from ninja import Schema
from typing import Optional
from datetime import date, datetime
import uuid


class ProjectCreate(Schema):
    name: str
    description: str = ''
    status: str = 'draft'
    tags: list[str] = []
    deadline: Optional[date] = None


class ProjectUpdate(Schema):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[list[str]] = None
    deadline: Optional[date] = None
    cover_asset_id: Optional[uuid.UUID] = None


class ProjectGenerationAdd(Schema):
    generation_ids: list[uuid.UUID]
    note: str = ''


class CoverSet(Schema):
    asset_id: uuid.UUID


class AssetMini(Schema):
    id: uuid.UUID
    url: Optional[str] = None
    type: str


class ProjectOut(Schema):
    id: uuid.UUID
    name: str
    description: str
    status: str
    tags: list[str]
    deadline: Optional[date] = None
    cover_asset: Optional[AssetMini] = None
    created_at: datetime
    updated_at: datetime
    generation_count: int = 0
    asset_count: int = 0
    total_cost: float = 0.0


class ByModalityItem(Schema):
    modality: str
    count: int
    cost: float


class ByStatusItem(Schema):
    status: str
    count: int


class ProjectStatsOut(Schema):
    generation_count: int
    asset_count: int
    total_cost: float
    by_modality: list[ByModalityItem]
    by_status: list[ByStatusItem]


class AssetOut(Schema):
    id: uuid.UUID
    type: str
    url: Optional[str] = None
    thumbnail_r2_key: Optional[str] = None
    mime_type: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    duration_seconds: Optional[float] = None
    generation: dict


class ProjectAssetsOut(Schema):
    items: list[AssetOut]
    next_cursor: Optional[str] = None
