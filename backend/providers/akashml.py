import httpx
from django.conf import settings
from .base import BaseProvider, SubmitInput, JobStatus


class AkashMLProvider(BaseProvider):
    name = 'akashml'

    def __init__(self, api_key: str | None = None, api_url: str | None = None):
        self._api_key = api_key or getattr(settings, 'AKASHML_API_KEY', '')
        self._api_url = api_url or getattr(settings, 'AKASHML_API_URL', '')

    def _headers(self) -> dict:
        return {
            'Authorization': f'Bearer {self._api_key}',
            'Content-Type': 'application/json',
        }

    def _base(self) -> str:
        return self._api_url.rstrip('/')

    def submit(self, inp: SubmitInput) -> str:
        from providers.registry import MODEL_REGISTRY
        cfg = MODEL_REGISTRY.get(inp.model_slug, {})
        model_id = cfg.get('providers', {}).get('akashml', {}).get('model_id', inp.model_slug)

        payload = {'model': model_id, 'input': inp.params}
        with httpx.Client(timeout=30) as client:
            r = client.post(f'{self._base()}/predictions', headers=self._headers(), json=payload)
            r.raise_for_status()
            return r.json()['id']

    def poll(self, provider_job_id: str, modality: str = 'image') -> JobStatus:
        with httpx.Client(timeout=15) as client:
            r = client.get(f'{self._base()}/predictions/{provider_job_id}', headers=self._headers())
            r.raise_for_status()
            data = r.json()

        status_map = {'starting': 'processing', 'processing': 'processing',
                      'succeeded': 'completed', 'failed': 'failed'}
        status = status_map.get(data.get('status', ''), 'processing')
        outputs = []
        if status == 'completed' and data.get('output'):
            raw = data['output']
            if isinstance(raw, str):
                raw = [raw]
            outputs = [{'url': u, 'type': modality} for u in raw if isinstance(u, str)]

        return JobStatus(status=status, outputs=outputs, error=data.get('error'))

    def cancel(self, provider_job_id: str) -> None:
        with httpx.Client(timeout=10) as client:
            client.post(f'{self._base()}/predictions/{provider_job_id}/cancel', headers=self._headers())
