import httpx
from django.conf import settings
from .base import BaseProvider, SubmitInput, JobStatus

BASE = 'https://api.replicate.com/v1'


def _headers() -> dict:
    return {
        'Authorization': f'Bearer {settings.REPLICATE_API_TOKEN}',
        'Content-Type': 'application/json',
        'Prefer': 'wait',
    }


class ReplicateProvider(BaseProvider):
    name = 'replicate'

    def submit(self, inp: SubmitInput) -> str:
        # model_slug format: "owner/name" or "owner/name:version"
        model_id = _model_id(inp.model_slug)
        payload: dict = {'input': inp.params}
        if inp.webhook_url:
            payload['webhook'] = inp.webhook_url
            payload['webhook_events_filter'] = ['completed']

        with httpx.Client(timeout=30) as client:
            if ':' in model_id:
                # versioned prediction
                owner_name, version = model_id.rsplit(':', 1)
                r = client.post(f'{BASE}/predictions', headers=_headers(), json={
                    'version': version,
                    'input': inp.params,
                    **({'webhook': inp.webhook_url, 'webhook_events_filter': ['completed']} if inp.webhook_url else {}),
                })
            else:
                # latest version of a model
                r = client.post(
                    f'{BASE}/models/{model_id}/predictions',
                    headers=_headers(),
                    json=payload,
                )
            r.raise_for_status()
            return r.json()['id']

    def poll(self, provider_job_id: str, modality: str = 'image') -> JobStatus:
        with httpx.Client(timeout=15) as client:
            r = client.get(f'{BASE}/predictions/{provider_job_id}', headers=_headers())
            r.raise_for_status()
            data = r.json()

        status_map = {
            'starting': 'processing',
            'processing': 'processing',
            'succeeded': 'completed',
            'failed': 'failed',
            'canceled': 'failed',
        }
        status = status_map.get(data['status'], 'processing')
        outputs: list[dict] = []

        if status == 'completed' and data.get('output'):
            raw = data['output']
            if isinstance(raw, str):
                raw = [raw]
            asset_type = modality if modality in ('image', 'video', 'audio') else 'image'
            outputs = [{'url': u, 'type': asset_type} for u in raw if isinstance(u, str)]

        return JobStatus(
            status=status,
            outputs=outputs,
            error=data.get('error'),
        )

    def cancel(self, provider_job_id: str) -> None:
        with httpx.Client(timeout=10) as client:
            client.post(f'{BASE}/predictions/{provider_job_id}/cancel', headers=_headers())


def _model_id(model_slug: str) -> str:
    """Map registry slug → Replicate model id."""
    from providers.registry import MODEL_REGISTRY
    cfg = MODEL_REGISTRY.get(model_slug)
    if cfg and 'replicate' in cfg.get('providers', {}):
        return cfg['providers']['replicate']['model_id']
    return model_slug
