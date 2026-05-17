from django.db.models import Count, Sum, Q
from django.shortcuts import get_object_or_404
from ninja import Router
from ninja_jwt.authentication import JWTAuth
from typing import Optional
import uuid

from .models import Project, ProjectGeneration, ProjectStatus
from .schemas import (
    ProjectCreate, ProjectUpdate, ProjectOut, ProjectGenerationAdd,
    ProjectStatsOut, ProjectAssetsOut, CoverSet, AssetMini,
    ByModalityItem, ByStatusItem
)
from generations.models import Generation, Asset

router = Router(tags=['projects'])


def _project_qs(user):
    return (
        Project.objects
        .filter(user=user)
        .select_related('cover_asset')
        .annotate(
            generation_count=Count('project_generations', distinct=True),
            asset_count=Count('project_generations__generation__assets', distinct=True),
            total_cost_ann=Sum('project_generations__generation__cost_credits'),
        )
    )


def _to_out(p) -> dict:
    cover = None
    if p.cover_asset_id:
        a = p.cover_asset
        cover = AssetMini(id=a.id, url=a.url, type=a.type)
    return ProjectOut(
        id=p.id,
        name=p.name,
        description=p.description,
        status=p.status,
        tags=p.tags or [],
        deadline=p.deadline,
        cover_asset=cover,
        created_at=p.created_at,
        updated_at=p.updated_at,
        generation_count=getattr(p, 'generation_count', 0) or 0,
        asset_count=getattr(p, 'asset_count', 0) or 0,
        total_cost=float(getattr(p, 'total_cost_ann', 0) or 0),
    )


@router.get('/', auth=JWTAuth(), response=list[ProjectOut])
def list_projects(request, status: Optional[str] = None, tag: Optional[str] = None):
    qs = _project_qs(request.user)
    if status and status != 'all':
        qs = qs.filter(status=status)
    if tag:
        qs = qs.filter(tags__contains=[tag])
    return [_to_out(p) for p in qs]


@router.post('/', auth=JWTAuth(), response={201: ProjectOut})
def create_project(request, body: ProjectCreate):
    p = Project.objects.create(
        user=request.user,
        name=body.name,
        description=body.description,
        status=body.status,
        tags=body.tags,
        deadline=body.deadline,
    )
    p = _project_qs(request.user).get(pk=p.pk)
    return 201, _to_out(p)


@router.get('/{project_id}', auth=JWTAuth(), response=ProjectOut)
def get_project(request, project_id: uuid.UUID):
    p = get_object_or_404(_project_qs(request.user), pk=project_id)
    return _to_out(p)


@router.patch('/{project_id}', auth=JWTAuth(), response=ProjectOut)
def update_project(request, project_id: uuid.UUID, body: ProjectUpdate):
    p = get_object_or_404(Project, pk=project_id, user=request.user)
    data = body.dict(exclude_unset=True)
    if 'cover_asset_id' in data:
        p.cover_asset_id = data.pop('cover_asset_id')
    for k, v in data.items():
        setattr(p, k, v)
    p.save()
    p = _project_qs(request.user).get(pk=p.pk)
    return _to_out(p)


@router.delete('/{project_id}', auth=JWTAuth(), response={204: None})
def delete_project(request, project_id: uuid.UUID):
    p = get_object_or_404(Project, pk=project_id, user=request.user)
    p.delete()
    return 204, None


@router.post('/{project_id}/generations', auth=JWTAuth(), response=ProjectOut)
def add_generations(request, project_id: uuid.UUID, body: ProjectGenerationAdd):
    p = get_object_or_404(Project, pk=project_id, user=request.user)
    gens = Generation.objects.filter(
        id__in=[str(g) for g in body.generation_ids],
        user=request.user,
    )
    rows = [
        ProjectGeneration(project=p, generation=g, note=body.note)
        for g in gens
    ]
    ProjectGeneration.objects.bulk_create(rows, ignore_conflicts=True)
    # auto-set cover if not set
    if not p.cover_asset_id:
        first_asset = Asset.objects.filter(
            generation__project_generations__project=p,
            generation__status='completed',
        ).first()
        if first_asset:
            p.cover_asset = first_asset
            p.save(update_fields=['cover_asset'])
    p = _project_qs(request.user).get(pk=p.pk)
    return _to_out(p)


@router.delete('/{project_id}/generations/{gen_id}', auth=JWTAuth(), response={204: None})
def remove_generation(request, project_id: uuid.UUID, gen_id: uuid.UUID):
    get_object_or_404(
        ProjectGeneration,
        project_id=project_id,
        generation_id=gen_id,
        project__user=request.user,
    ).delete()
    return 204, None


@router.get('/{project_id}/assets', auth=JWTAuth(), response=ProjectAssetsOut)
def list_project_assets(request, project_id: uuid.UUID,
                         cursor: Optional[str] = None, limit: int = 48):
    get_object_or_404(Project, pk=project_id, user=request.user)
    qs = Asset.objects.filter(
        generation__project_generations__project_id=project_id,
    ).select_related('generation').order_by('-id')
    if cursor:
        qs = qs.filter(id__lt=cursor)
    items = list(qs[:limit + 1])
    has_more = len(items) > limit
    if has_more:
        items = items[:limit]
    next_cursor = str(items[-1].id) if has_more and items else None
    out_items = []
    for a in items:
        out_items.append({
            'id': a.id,
            'type': a.type,
            'url': a.url,
            'thumbnail_r2_key': a.thumbnail_r2_key,
            'mime_type': a.mime_type,
            'width': a.width,
            'height': a.height,
            'duration_seconds': float(a.duration_seconds) if a.duration_seconds else None,
            'generation': {
                'id': str(a.generation.id),
                'prompt': a.generation.prompt,
                'modelSlug': a.generation.model_slug,
                'modality': a.generation.modality,
                'createdAt': a.generation.created_at.isoformat(),
            },
        })
    return {'items': out_items, 'next_cursor': next_cursor}


@router.get('/{project_id}/stats', auth=JWTAuth(), response=ProjectStatsOut)
def get_project_stats(request, project_id: uuid.UUID):
    get_object_or_404(Project, pk=project_id, user=request.user)
    gens = Generation.objects.filter(
        project_generations__project_id=project_id
    )
    total_cost = float(gens.aggregate(s=Sum('cost_credits'))['s'] or 0)
    gen_count = gens.count()
    asset_count = Asset.objects.filter(
        generation__project_generations__project_id=project_id
    ).count()
    by_modality_qs = (
        gens.values('modality')
        .annotate(count=Count('id'), cost=Sum('cost_credits'))
        .order_by('modality')
    )
    by_status_qs = (
        gens.values('status')
        .annotate(count=Count('id'))
        .order_by('status')
    )
    return ProjectStatsOut(
        generation_count=gen_count,
        asset_count=asset_count,
        total_cost=total_cost,
        by_modality=[
            ByModalityItem(modality=r['modality'], count=r['count'],
                           cost=float(r['cost'] or 0))
            for r in by_modality_qs
        ],
        by_status=[
            ByStatusItem(status=r['status'], count=r['count'])
            for r in by_status_qs
        ],
    )


@router.post('/{project_id}/cover', auth=JWTAuth(), response=ProjectOut)
def set_cover(request, project_id: uuid.UUID, body: CoverSet):
    p = get_object_or_404(Project, pk=project_id, user=request.user)
    asset = get_object_or_404(
        Asset,
        pk=body.asset_id,
        generation__project_generations__project=p,
    )
    p.cover_asset = asset
    p.save(update_fields=['cover_asset'])
    p = _project_qs(request.user).get(pk=p.pk)
    return _to_out(p)
