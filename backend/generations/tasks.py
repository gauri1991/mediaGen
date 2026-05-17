"""
Celery tasks for the generation pipeline.

submit_generation  — picks up a queued job and sends it to the provider
poll_generation    — polls a processing job; schedules itself again if not done
handle_completed   — downloads outputs, uploads to R2, creates Asset records
"""
import os
import logging
from datetime import datetime, timezone

from celery import shared_task
from django.db import transaction
from django.utils import timezone as dj_tz

from providers.registry import resolve_provider, get_model, MODEL_REGISTRY
from providers.base import SubmitInput
from storage.r2 import upload_bytes, download_url, asset_key, thumbnail_key, public_url

logger = logging.getLogger(__name__)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _mime(modality: str, url: str) -> str:
    ext = os.path.splitext(url)[1].lower()
    if modality == 'image':
        return 'image/png' if ext == '.png' else 'image/webp'
    if modality == 'video':
        return 'video/mp4'
    if modality == 'audio':
        return 'audio/wav' if ext == '.wav' else 'audio/mpeg'
    return 'application/octet-stream'


def _ext(mime: str) -> str:
    return {
        'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg',
        'video/mp4': 'mp4', 'audio/mpeg': 'mp3', 'audio/wav': 'wav',
    }.get(mime, 'bin')


def _make_thumbnail(data: bytes, mime: str) -> bytes | None:
    if not mime.startswith('image/'):
        return None
    try:
        from PIL import Image
        import io
        img = Image.open(io.BytesIO(data))
        img.thumbnail((400, 400))
        buf = io.BytesIO()
        img.save(buf, format='WEBP', quality=75)
        return buf.getvalue()
    except Exception:
        return None


# ── Submit ────────────────────────────────────────────────────────────────────

@shared_task(bind=True, max_retries=3, default_retry_delay=5)
def submit_generation(self, generation_id: str):
    from generations.models import Generation

    try:
        gen = Generation.objects.get(id=generation_id)
    except Generation.DoesNotExist:
        logger.error(f'submit_generation: Generation {generation_id} not found')
        return

    if gen.status != Generation.Status.QUEUED:
        return

    try:
        provider = resolve_provider(gen.model_slug, gen.provider, user=gen.user)
        model = get_model(gen.model_slug)

        params = {**model.get('defaults', {}), **gen.params}
        params['prompt'] = gen.prompt
        if gen.negative_prompt:
            params['negative_prompt'] = gen.negative_prompt

        provider_job_id = provider.submit(SubmitInput(
            model_slug=gen.model_slug,
            modality=gen.modality,
            params=params,
            webhook_url=None,
        ))

        with transaction.atomic():
            gen = Generation.objects.select_for_update().get(id=generation_id)
            if gen.status != Generation.Status.QUEUED:
                return
            gen.status = Generation.Status.PROCESSING
            gen.provider_job_id = provider_job_id
            gen.started_at = dj_tz.now()
            gen.save(update_fields=['status', 'provider_job_id', 'started_at'])

        logger.info(f'Submitted {generation_id} → {provider.name}:{provider_job_id}')

        task = poll_generation.apply_async((generation_id,), countdown=5)
        Generation.objects.filter(id=generation_id).update(celery_task_id=task.id)

    except Exception as exc:
        logger.error(f'submit_generation failed for {generation_id}: {exc}')
        try:
            self.retry(exc=exc)
        except self.MaxRetriesExceededError:
            gen.status = Generation.Status.FAILED
            gen.error_message = str(exc)
            gen.save(update_fields=['status', 'error_message'])


# ── Poll ──────────────────────────────────────────────────────────────────────

@shared_task(bind=True, max_retries=30, default_retry_delay=5)
def poll_generation(self, generation_id: str):
    from generations.models import Generation

    try:
        gen = Generation.objects.get(id=generation_id)
    except Generation.DoesNotExist:
        return

    if gen.status not in (Generation.Status.PROCESSING, Generation.Status.QUEUED):
        return

    if not gen.provider_job_id:
        return

    try:
        provider = resolve_provider(gen.model_slug, gen.provider, user=gen.user)
        result = provider.poll(gen.provider_job_id, gen.modality)

        if result.status == 'processing':
            if result.progress is not None:
                gen.progress = result.progress
                gen.save(update_fields=['progress'])
            backoff = min(5 * (2 ** min(self.request.retries, 4)), 60)
            raise self.retry(countdown=backoff)

        if result.status == 'failed':
            gen.status = Generation.Status.FAILED
            gen.error_message = result.error or 'Provider returned failed status'
            gen.completed_at = dj_tz.now()
            gen.save(update_fields=['status', 'error_message', 'completed_at'])
            return

        if result.status == 'completed':
            handle_completed.delay(generation_id, result.outputs)

    except Exception as exc:
        if not isinstance(exc, self.retry.__class__):
            logger.error(f'poll_generation error for {generation_id}: {exc}')
            raise self.retry(exc=exc, countdown=10)


# ── Handle completed ──────────────────────────────────────────────────────────

@shared_task
def handle_completed(generation_id: str, outputs: list[dict]):
    from generations.models import Generation, Asset

    with transaction.atomic():
        try:
            gen = Generation.objects.select_for_update().get(id=generation_id)
        except Generation.DoesNotExist:
            return

        if gen.status == Generation.Status.COMPLETED:
            return

    asset_records = []

    for i, output in enumerate(outputs):
        provider_url = output.get('url', '')
        asset_type = output.get('type', gen.modality)
        try:
            mime = _mime(asset_type, provider_url)
            ext = _ext(mime)

            # Try R2 upload; fall back to provider URL if R2 is not configured
            r2_key = None
            asset_url = provider_url
            thumb_key = None
            width = height = None
            data = None

            try:
                key = asset_key(gen.user_id, str(gen.id), f'output_{i}.{ext}')
                data = download_url(provider_url)
                upload_bytes(key, data, mime)
                r2_key = key
                asset_url = public_url(key)

                thumb = _make_thumbnail(data, mime)
                if thumb:
                    thumb_key = thumbnail_key(key)
                    upload_bytes(thumb_key, thumb, 'image/webp')
            except Exception as r2_exc:
                logger.warning(f'R2 upload skipped for {generation_id}[{i}]: {r2_exc} — using provider URL')
                if data is None:
                    try:
                        data = download_url(provider_url)
                    except Exception:
                        pass

            if mime.startswith('image/') and data:
                try:
                    from PIL import Image
                    import io
                    img = Image.open(io.BytesIO(data))
                    width, height = img.size
                except Exception:
                    pass

            asset_records.append(Asset(
                generation=gen,
                user_id=gen.user_id,
                type=asset_type,
                r2_key=r2_key or '',
                url=asset_url,
                thumbnail_r2_key=thumb_key,
                mime_type=mime,
                bytes=len(data) if data else 0,
                width=width,
                height=height,
            ))

        except Exception as exc:
            logger.error(f'Asset record failed for {generation_id}[{i}]: {exc}')

    # Cost
    model = get_model(gen.model_slug)
    provider_cfg = model.get('providers', {}).get(gen.provider, {})
    cost = provider_cfg.get('cost_estimate')

    Asset.objects.bulk_create(asset_records, ignore_conflicts=True)

    gen.status = Generation.Status.COMPLETED
    gen.completed_at = dj_tz.now()
    gen.progress = 100
    if cost is not None:
        gen.cost_credits = cost
    gen.save(update_fields=['status', 'completed_at', 'progress', 'cost_credits'])

    logger.info(f'Completed {generation_id} — {len(asset_records)} asset(s)')
