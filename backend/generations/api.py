import asyncio
import base64
import hashlib
import hmac
import json
import logging
import time
from typing import Optional
from uuid import UUID

from asgiref.sync import sync_to_async
from django.conf import settings
from django.http import StreamingHttpResponse
from ninja import Router
from ninja.errors import HttpError
from ninja_jwt.authentication import JWTAuth

from providers.registry import get_model, resolve_provider, MODEL_REGISTRY
from .models import Generation, Asset
from .schemas import GenerationCreate, GenerationOut, UsageOut
from .tasks import submit_generation

logger = logging.getLogger(__name__)

router = Router(tags=['generations'], auth=JWTAuth())


# ── Create ────────────────────────────────────────────────────────────────────

@router.post('', response={201: dict})
def create_generation(request, data: GenerationCreate):
    try:
        model = get_model(data.model_slug)
    except ValueError as e:
        raise HttpError(400, str(e))

    provider = resolve_provider(data.model_slug, data.provider)

    gen = Generation.objects.create(
        user=request.user,
        modality=model['modality'],
        model_slug=data.model_slug,
        provider=provider.name,
        status=Generation.Status.QUEUED,
        prompt=data.prompt,
        negative_prompt=data.negative_prompt,
        params=data.params or {},
    )

    submit_generation.delay(str(gen.id))

    return 201, {'id': str(gen.id), 'status': gen.status}


# ── List ──────────────────────────────────────────────────────────────────────

@router.get('', response=list[GenerationOut])
def list_generations(request, modality: Optional[str] = None, limit: int = 50):
    limit = min(limit, 200)
    qs = Generation.objects.filter(user=request.user).prefetch_related('assets')
    if modality:
        qs = qs.filter(modality=modality)
    return [GenerationOut.from_orm(g) for g in qs[:limit]]


# ── Detail ────────────────────────────────────────────────────────────────────

@router.get('/{generation_id}', response=GenerationOut)
def get_generation(request, generation_id: UUID):
    try:
        gen = Generation.objects.prefetch_related('assets').get(
            id=generation_id, user=request.user
        )
    except Generation.DoesNotExist:
        raise HttpError(404, 'Not found')
    return GenerationOut.from_orm(gen)


# ── SSE stream (async — non-blocking in ASGI deployments) ─────────────────────

@router.get('/{generation_id}/stream', auth=None)
async def stream_generation(request, generation_id: UUID, token: Optional[str] = None):
    from ninja_jwt.tokens import AccessToken
    from django.contrib.auth import get_user_model
    User = get_user_model()
    user = None
    if token:
        try:
            validated = AccessToken(token)
            user = await sync_to_async(User.objects.get)(id=validated['user_id'])
        except Exception:
            pass
    if user is None and request.user and request.user.is_authenticated:
        user = request.user
    if user is None:
        from django.http import HttpResponse
        return HttpResponse('Unauthorized', status=401)

    try:
        await sync_to_async(Generation.objects.get)(id=generation_id, user=user)
    except Generation.DoesNotExist:
        raise HttpError(404, 'Not found')

    async def event_stream():
        terminal = {Generation.Status.COMPLETED, Generation.Status.FAILED}
        deadline = time.time() + 600

        while time.time() < deadline:
            try:
                def _fetch():
                    gen = Generation.objects.prefetch_related('assets').get(id=generation_id)
                    assets = [
                        {
                            'id': str(a.id),
                            'type': a.type,
                            'url': a.url,
                            'mime_type': a.mime_type,
                            'width': a.width,
                            'height': a.height,
                        }
                        for a in gen.assets.all()
                    ]
                    return gen, assets

                gen, assets_data = await sync_to_async(_fetch)()
                payload = {
                    'id': str(gen.id),
                    'status': gen.status,
                    'progress': gen.progress,
                    'error_message': gen.error_message,
                    'assets': assets_data,
                }
                yield f'event: update\ndata: {json.dumps(payload)}\n\n'

                if gen.status in terminal:
                    return
            except Exception:
                pass
            await asyncio.sleep(2)

        yield 'event: timeout\ndata: {}\n\n'

    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    return response


# ── Webhook (Replicate) ───────────────────────────────────────────────────────

def _verify_webhook_signature(request) -> bool:
    secret = getattr(settings, 'REPLICATE_WEBHOOK_SECRET', '')
    if not secret:
        return True

    msg_id = request.headers.get('webhook-id', '')
    msg_ts = request.headers.get('webhook-timestamp', '')
    sig_header = request.headers.get('webhook-signature', '')

    if not all([msg_id, msg_ts, sig_header]):
        return False

    signed_content = f'{msg_id}.{msg_ts}.{request.body.decode()}'
    # Svix secret format: "whsec_<base64>" — strip prefix if present
    raw_secret = secret.split('_', 1)[1] if '_' in secret else secret
    secret_bytes = base64.b64decode(raw_secret)
    mac = hmac.new(secret_bytes, signed_content.encode(), hashlib.sha256)
    expected = f'v1,{base64.b64encode(mac.digest()).decode()}'

    return any(
        hmac.compare_digest(expected, sig.strip())
        for sig in sig_header.split(' ')
        if sig.strip()
    )


@router.post('/{generation_id}/webhook', auth=None)
def replicate_webhook(request, generation_id: UUID):
    if not _verify_webhook_signature(request):
        raise HttpError(401, 'Invalid webhook signature')

    try:
        gen = Generation.objects.get(id=generation_id)
    except Generation.DoesNotExist:
        raise HttpError(404, 'Not found')

    if gen.status in (Generation.Status.COMPLETED, Generation.Status.FAILED):
        return {'ok': True}

    body = json.loads(request.body)
    status = body.get('status')
    output = body.get('output')

    if status == 'succeeded' and output:
        raw = [output] if isinstance(output, str) else output
        outputs = [{'url': u, 'type': gen.modality} for u in raw if isinstance(u, str)]
        from .tasks import handle_completed
        handle_completed.delay(str(gen.id), outputs)

    elif status in ('failed', 'canceled'):
        gen.status = Generation.Status.FAILED
        gen.error_message = body.get('error') or f'Provider status: {status}'
        gen.save(update_fields=['status', 'error_message'])

    return {'ok': True}


# ── Cancel ─────────────────────────────────────────────────────────────────────

@router.post('/{generation_id}/cancel', response={200: dict})
def cancel_generation(request, generation_id: UUID):
    try:
        gen = Generation.objects.get(id=generation_id, user=request.user)
    except Generation.DoesNotExist:
        raise HttpError(404, 'Not found')

    if gen.status not in (Generation.Status.QUEUED, Generation.Status.PROCESSING):
        raise HttpError(400, 'Generation is not cancellable')

    if gen.celery_task_id:
        from config.celery import app as celery_app
        celery_app.control.revoke(gen.celery_task_id, terminate=True)

    if gen.provider_job_id:
        try:
            provider = resolve_provider(gen.model_slug, gen.provider)
            if hasattr(provider, 'cancel'):
                provider.cancel(gen.provider_job_id)
        except Exception:
            pass

    gen.status = Generation.Status.FAILED
    gen.error_message = 'Cancelled by user'
    gen.save(update_fields=['status', 'error_message'])

    return {'ok': True}


# ── Assets ────────────────────────────────────────────────────────────────────

@router.get('/assets/list', response=list[dict])
def list_assets(
    request,
    type: Optional[str] = None,
    limit: int = 48,
    cursor: Optional[str] = None,
    search: Optional[str] = None,
):
    limit = min(limit, 200)
    qs = Asset.objects.filter(user=request.user).select_related('generation').order_by('-id')
    if type:
        qs = qs.filter(type=type)
    if cursor:
        qs = qs.filter(id__lt=cursor)
    if search:
        qs = qs.filter(generation__prompt__icontains=search)

    items = list(qs[:limit + 1])
    has_more = len(items) > limit
    items = items[:limit]

    return [
        {
            'id': str(a.id),
            'type': a.type,
            'url': a.url,
            'thumbnail_r2_key': a.thumbnail_r2_key,
            'mime_type': a.mime_type,
            'width': a.width,
            'height': a.height,
            'generation': {
                'id': str(a.generation.id),
                'prompt': a.generation.prompt,
                'model_slug': a.generation.model_slug,
                'modality': a.generation.modality,
                'created_at': a.generation.created_at.isoformat(),
            },
        }
        for a in items
    ]


# ── Usage stats ───────────────────────────────────────────────────────────────

@router.get('/usage/summary', response=UsageOut)
def usage_summary(request):
    from django.db.models import Count, Sum

    qs = Generation.objects.filter(user=request.user)
    agg = qs.aggregate(total=Count('id'), total_cost=Sum('cost_credits'))

    completed = qs.filter(status=Generation.Status.COMPLETED).count()
    failed = qs.filter(status=Generation.Status.FAILED).count()

    by_modality = list(
        qs.values('modality')
        .annotate(count=Count('id'), cost=Sum('cost_credits'))
        .order_by('modality')
    )

    return UsageOut(
        total=agg['total'] or 0,
        total_cost=float(agg['total_cost'] or 0),
        completed=completed,
        failed=failed,
        by_modality=[
            {'modality': r['modality'], 'count': r['count'], 'cost': float(r['cost'] or 0)}
            for r in by_modality
        ],
    )
