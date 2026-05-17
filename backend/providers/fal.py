import httpx
from django.conf import settings
from .base import BaseProvider, SubmitInput, JobStatus

BASE = 'https://queue.fal.run'


class FalProvider(BaseProvider):
    name = 'fal'

    def __init__(self, api_key: str | None = None):
        self._api_key = api_key or getattr(settings, 'FAL_KEY', '')

    def _headers(self) -> dict:
        return {
            'Authorization': f'Key {self._api_key}',
            'Content-Type': 'application/json',
        }

    def _translate_params(self, params: dict) -> dict:
        """Translate internal param names to fal.ai equivalents."""
        out = {}
        for k, v in params.items():
            # Drop Replicate-specific params not accepted by fal.ai
            if k in ('output_quality', 'refine', 'high_noise_frac', 'safety_tolerance'):
                continue
            # width + height → image_size (handled below)
            if k in ('width', 'height'):
                continue
            # guidance → guidance_scale
            if k == 'guidance':
                out['guidance_scale'] = v
                continue
            # num_outputs → num_images
            if k == 'num_outputs':
                out['num_images'] = v
                continue
            # steps → num_inference_steps (only if num_inference_steps not already set)
            if k == 'steps':
                out.setdefault('num_inference_steps', v)
                continue
            # output_format: webp → jpeg
            if k == 'output_format':
                out['output_format'] = 'jpeg' if v == 'webp' else v
                continue
            # prompt_upsampling → enable_prompt_upsampling
            if k == 'prompt_upsampling':
                out['enable_prompt_upsampling'] = v
                continue
            # seed: only include if not None
            if k == 'seed':
                if v is not None:
                    out['seed'] = v
                continue
            # everything else passes through
            out[k] = v

        # Merge width/height into image_size if present
        w = params.get('width')
        h = params.get('height')
        if w is not None and h is not None:
            out['image_size'] = {'width': w, 'height': h}
        elif w is not None:
            out['image_size'] = {'width': w}
        elif h is not None:
            out['image_size'] = {'height': h}

        return out

    def submit(self, inp: SubmitInput) -> str:
        model_id = _model_id(inp.model_slug)
        fal_params = self._translate_params(inp.params)
        with httpx.Client(timeout=30) as client:
            r = client.post(
                f'{BASE}/{model_id}',
                headers=self._headers(),
                json={'input': fal_params},
            )
            r.raise_for_status()
            request_id = r.json()['request_id']
        return f'{model_id}||{request_id}'

    def poll(self, provider_job_id: str, modality: str = 'image') -> JobStatus:
        model_id, request_id = provider_job_id.split('||', 1)

        with httpx.Client(timeout=15) as client:
            r = client.get(
                f'{BASE}/{model_id}/requests/{request_id}/status',
                headers=self._headers(),
            )
            r.raise_for_status()
            status_data = r.json()

        fal_status = status_data.get('status', '')

        status_map = {
            'IN_QUEUE': 'queued',
            'IN_PROGRESS': 'processing',
            'COMPLETED': 'completed',
            'FAILED': 'failed',
        }
        status = status_map.get(fal_status, 'processing')

        outputs: list[dict] = []
        error = status_data.get('error')

        if status == 'completed':
            with httpx.Client(timeout=15) as client:
                r = client.get(
                    f'{BASE}/{model_id}/requests/{request_id}',
                    headers=self._headers(),
                )
                r.raise_for_status()
                result = r.json()

            asset_type = modality if modality in ('image', 'video', 'audio') else 'image'

            if 'images' in result:
                raw = result['images']
                if isinstance(raw, list):
                    for item in raw:
                        url = item['url'] if isinstance(item, dict) else item
                        if url:
                            outputs.append({'url': url, 'type': 'image'})
            elif 'video' in result:
                raw = result['video']
                url = raw['url'] if isinstance(raw, dict) else raw
                if url:
                    outputs.append({'url': url, 'type': 'video'})
            elif 'audio' in result:
                raw = result['audio']
                url = raw['url'] if isinstance(raw, dict) else raw
                if url:
                    outputs.append({'url': url, 'type': 'audio'})
            elif 'output' in result:
                # Fallback generic output field
                raw = result['output']
                if isinstance(raw, str):
                    raw = [raw]
                if isinstance(raw, list):
                    outputs = [{'url': u, 'type': asset_type} for u in raw if isinstance(u, str)]

        return JobStatus(status=status, outputs=outputs, error=error)

    def cancel(self, provider_job_id: str) -> None:
        # fal.ai does not expose a cancel endpoint for queue jobs
        pass


def _model_id(model_slug: str) -> str:
    """Map registry slug → fal.ai model id."""
    from providers.registry import MODEL_REGISTRY
    cfg = MODEL_REGISTRY.get(model_slug)
    if cfg and 'fal' in cfg.get('providers', {}):
        return cfg['providers']['fal']['model_id']
    return model_slug
