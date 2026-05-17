from ninja import Schema
from typing import Any, Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal


class GenerationCreate(Schema):
    model_slug: str
    prompt: str
    negative_prompt: Optional[str] = None
    provider: Optional[str] = None
    params: Optional[dict[str, Any]] = None


class AssetOut(Schema):
    id: UUID
    type: str
    url: Optional[str]
    thumbnail_r2_key: Optional[str]
    mime_type: Optional[str]
    width: Optional[int]
    height: Optional[int]
    duration_seconds: Optional[float]
    created_at: datetime


class GenerationOut(Schema):
    id: UUID
    modality: str
    model_slug: str
    provider: str
    status: str
    progress: Optional[int]
    prompt: str
    negative_prompt: Optional[str]
    cost_credits: Optional[Decimal]
    error_message: Optional[str]
    assets: list[AssetOut]
    created_at: datetime
    completed_at: Optional[datetime]

    @staticmethod
    def from_orm(gen) -> 'GenerationOut':
        return GenerationOut(
            id=gen.id,
            modality=gen.modality,
            model_slug=gen.model_slug,
            provider=gen.provider,
            status=gen.status,
            progress=gen.progress,
            prompt=gen.prompt,
            negative_prompt=gen.negative_prompt,
            cost_credits=gen.cost_credits,
            error_message=gen.error_message,
            assets=[
                AssetOut(
                    id=a.id,
                    type=a.type,
                    url=a.url,
                    thumbnail_r2_key=a.thumbnail_r2_key,
                    mime_type=a.mime_type,
                    width=a.width,
                    height=a.height,
                    duration_seconds=a.duration_seconds,
                    created_at=a.created_at,
                )
                for a in gen.assets.all()
            ],
            created_at=gen.created_at,
            completed_at=gen.completed_at,
        )


class UsageOut(Schema):
    total: int
    total_cost: float
    completed: int
    failed: int
    queued: int
    processing: int
    by_modality: list[dict]
    by_model: list[dict]
