from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class SubmitInput:
    model_slug: str
    modality: str
    params: dict
    webhook_url: Optional[str] = None


@dataclass
class JobStatus:
    status: str  # queued | processing | completed | failed
    progress: Optional[int] = None
    outputs: list[dict] = field(default_factory=list)  # [{url, type}]
    error: Optional[str] = None


class BaseProvider(ABC):
    name: str

    @abstractmethod
    def submit(self, inp: SubmitInput) -> str:
        """Submit a job and return provider_job_id."""

    @abstractmethod
    def poll(self, provider_job_id: str, modality: str = 'image') -> JobStatus:
        """Poll job status."""

    @abstractmethod
    def cancel(self, provider_job_id: str) -> None:
        """Cancel a running job."""
