import httpx
from django.conf import settings
from .base import BaseProvider, SubmitInput, JobStatus

BASE = 'https://api.runpod.io/v2'


class RunPodProvider(BaseProvider):
    name = 'runpod'

    def __init__(self, api_key: str | None = None, endpoint_id: str | None = None):
        self._api_key = api_key or getattr(settings, 'RUNPOD_API_KEY', '')
        self._endpoint_id = endpoint_id or getattr(settings, 'RUNPOD_ENDPOINT_ID', '')

    def _headers(self) -> dict:
        return {
            'Authorization': f'Bearer {self._api_key}',
            'Content-Type': 'application/json',
        }

    def submit(self, inp: SubmitInput) -> str:
        endpoint_id = self._endpoint_id
        with httpx.Client(timeout=30) as client:
            r = client.post(
                f'{BASE}/{endpoint_id}/run',
                headers=self._headers(),
                json={'input': inp.params},
            )
            r.raise_for_status()
            job_id = r.json()['id']
        return f'{endpoint_id}||{job_id}'

    def poll(self, provider_job_id: str, modality: str = 'image') -> JobStatus:
        endpoint_id, job_id = provider_job_id.split('||', 1)

        with httpx.Client(timeout=15) as client:
            r = client.get(
                f'{BASE}/{endpoint_id}/status/{job_id}',
                headers=self._headers(),
            )
            r.raise_for_status()
            data = r.json()

        status_map = {
            'IN_QUEUE': 'queued',
            'IN_PROGRESS': 'processing',
            'COMPLETED': 'completed',
            'FAILED': 'failed',
            'CANCELLED': 'failed',
            'TIMED_OUT': 'failed',
        }
        status = status_map.get(data.get('status', ''), 'processing')

        outputs: list[dict] = []
        error = data.get('error')

        if status == 'completed' and data.get('output') is not None:
            raw = data['output']
            asset_type = modality if modality in ('image', 'video', 'audio') else 'image'

            if isinstance(raw, list):
                # List of URL strings
                for item in raw:
                    if isinstance(item, str):
                        outputs.append({'url': item, 'type': asset_type})
                    elif isinstance(item, dict) and item.get('url'):
                        outputs.append({'url': item['url'], 'type': asset_type})
            elif isinstance(raw, dict):
                # Dict with images / video / audio key
                if 'images' in raw:
                    items = raw['images']
                    if isinstance(items, list):
                        for item in items:
                            url = item['url'] if isinstance(item, dict) else item
                            if url:
                                outputs.append({'url': url, 'type': 'image'})
                    elif isinstance(items, str):
                        outputs.append({'url': items, 'type': 'image'})
                elif 'video' in raw:
                    item = raw['video']
                    url = item['url'] if isinstance(item, dict) else item
                    if url:
                        outputs.append({'url': url, 'type': 'video'})
                elif 'audio' in raw:
                    item = raw['audio']
                    url = item['url'] if isinstance(item, dict) else item
                    if url:
                        outputs.append({'url': url, 'type': 'audio'})
                elif raw.get('url'):
                    outputs.append({'url': raw['url'], 'type': asset_type})

        return JobStatus(status=status, outputs=outputs, error=error)

    def cancel(self, provider_job_id: str) -> None:
        endpoint_id, job_id = provider_job_id.split('||', 1)
        with httpx.Client(timeout=10) as client:
            client.post(
                f'{BASE}/{endpoint_id}/cancel/{job_id}',
                headers=self._headers(),
            )
