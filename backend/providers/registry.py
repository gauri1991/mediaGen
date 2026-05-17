# Model registry — mirrors frontend/src/lib/models/registry.ts
# model_id must match what the provider expects.

MODEL_REGISTRY: dict[str, dict] = {
    'flux-dev': {
        'label': 'Flux.1 Dev',
        'modality': 'image',
        'default_provider': 'replicate',
        'providers': {
            'replicate': {'model_id': 'black-forest-labs/flux-dev', 'cost_estimate': 0.025},
            'akashml':   {'model_id': 'flux.1-dev',                 'cost_estimate': 0.012},
        },
        'defaults': {
            'width': 1024, 'height': 1024,
            'num_inference_steps': 28, 'guidance': 3.5,
            'output_format': 'webp', 'output_quality': 90,
        },
    },
    'flux-schnell': {
        'label': 'Flux.1 Schnell',
        'modality': 'image',
        'default_provider': 'replicate',
        'providers': {
            'replicate': {'model_id': 'black-forest-labs/flux-schnell', 'cost_estimate': 0.003},
        },
        'defaults': {
            'width': 1024, 'height': 1024,
            'num_inference_steps': 4,
            'output_format': 'webp', 'output_quality': 90,
        },
    },
    'ltx-video': {
        'label': 'LTX-Video',
        'modality': 'video',
        'default_provider': 'replicate',
        'providers': {
            'replicate': {'model_id': 'lightricks/ltx-video', 'cost_estimate': 0.08},
        },
        'defaults': {
            'width': 768, 'height': 512, 'num_frames': 97,
            'num_inference_steps': 40, 'guidance_scale': 3.0,
        },
    },
    'wan-2.1': {
        'label': 'Wan 2.1',
        'modality': 'video',
        'default_provider': 'replicate',
        'providers': {
            'replicate': {'model_id': 'wavespeedai/wan-2.1-t2v-480p', 'cost_estimate': 0.09},
        },
        'defaults': {
            'width': 832, 'height': 480, 'num_frames': 81,
            'num_inference_steps': 30, 'guidance_scale': 5.0,
        },
    },
    'musicgen': {
        'label': 'MusicGen',
        'modality': 'audio',
        'default_provider': 'replicate',
        'providers': {
            'replicate': {'model_id': 'meta/musicgen', 'cost_estimate': 0.016},
        },
        'defaults': {
            'duration': 30, 'model_version': 'stereo-large',
            'output_format': 'mp3', 'top_k': 250, 'temperature': 1.0,
        },
    },
    'f5-tts': {
        'label': 'F5-TTS',
        'modality': 'audio',
        'default_provider': 'replicate',
        'providers': {
            'replicate': {'model_id': 'lucataco/f5-tts', 'cost_estimate': 0.008},
        },
        'defaults': {'speed': 1.0, 'nfe_step': 32},
    },
}


def get_model(slug: str) -> dict:
    if slug not in MODEL_REGISTRY:
        raise ValueError(f'Unknown model: {slug}')
    return MODEL_REGISTRY[slug]


def resolve_provider(model_slug: str, override: str | None = None):
    from providers.replicate import ReplicateProvider
    from providers.akashml import AkashMLProvider

    _providers = {
        'replicate': ReplicateProvider(),
        'akashml': AkashMLProvider(),
    }
    model = get_model(model_slug)
    name = override or model['default_provider']
    if name not in _providers:
        raise ValueError(f'Unknown provider: {name}')
    return _providers[name]
