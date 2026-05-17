# Model registry — mirrors frontend/src/lib/models/registry.ts
# model_id must match what the provider expects.

MODEL_REGISTRY: dict[str, dict] = {
    # ── Image ─────────────────────────────────────────────────────────────────
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
    'flux-1.1-pro': {
        'label': 'Flux 1.1 Pro',
        'modality': 'image',
        'default_provider': 'replicate',
        'providers': {
            'replicate': {'model_id': 'black-forest-labs/flux-1.1-pro', 'cost_estimate': 0.04},
        },
        'defaults': {
            'width': 1024, 'height': 1024,
            'output_format': 'webp', 'output_quality': 90,
            'safety_tolerance': 2,
        },
    },
    'flux-1.1-pro-ultra': {
        'label': 'Flux 1.1 Pro Ultra',
        'modality': 'image',
        'default_provider': 'replicate',
        'providers': {
            'replicate': {'model_id': 'black-forest-labs/flux-1.1-pro-ultra', 'cost_estimate': 0.06},
        },
        'defaults': {
            'aspect_ratio': '1:1',
            'output_format': 'jpg', 'output_quality': 90,
            'safety_tolerance': 2,
        },
    },
    'flux-2-pro': {
        'label': 'Flux 2 Pro',
        'modality': 'image',
        'default_provider': 'replicate',
        'providers': {
            'replicate': {'model_id': 'black-forest-labs/flux-2-pro', 'cost_estimate': 0.05},
        },
        'defaults': {
            'width': 1024, 'height': 1024,
            'output_format': 'webp', 'output_quality': 90,
            'safety_tolerance': 2,
        },
    },
    'sd-3.5-large': {
        'label': 'SD 3.5 Large',
        'modality': 'image',
        'default_provider': 'replicate',
        'providers': {
            'replicate': {'model_id': 'stability-ai/stable-diffusion-3.5-large', 'cost_estimate': 0.035},
        },
        'defaults': {
            'width': 1024, 'height': 1024,
            'num_inference_steps': 28, 'guidance_scale': 4.5,
            'output_format': 'webp', 'output_quality': 90,
        },
    },
    'sdxl': {
        'label': 'SDXL',
        'modality': 'image',
        'default_provider': 'replicate',
        'providers': {
            'replicate': {'model_id': 'stability-ai/sdxl', 'cost_estimate': 0.0043},
        },
        'defaults': {
            'width': 1024, 'height': 1024,
            'num_inference_steps': 25, 'guidance_scale': 7.5,
            'refine': 'expert_ensemble_refiner', 'high_noise_frac': 0.8,
        },
    },
    'ideogram-v3-turbo': {
        'label': 'Ideogram v3 Turbo',
        'modality': 'image',
        'default_provider': 'replicate',
        'providers': {
            'replicate': {'model_id': 'ideogram-ai/ideogram-v3-turbo', 'cost_estimate': 0.03},
        },
        'defaults': {
            'aspect_ratio': '1:1',
            'magic_prompt_option': 'Auto',
        },
    },

    # ── Video ─────────────────────────────────────────────────────────────────
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
    'wan-2.7': {
        'label': 'Wan 2.7',
        'modality': 'video',
        'default_provider': 'replicate',
        'providers': {
            'replicate': {'model_id': 'wan-video/wan-2.7-t2v', 'cost_estimate': 0.12},
        },
        'defaults': {
            'num_frames': 81, 'num_inference_steps': 30, 'guidance_scale': 5.0,
            'aspect_ratio': '16:9',
        },
    },
    'hailuo-2.3': {
        'label': 'Hailuo 2.3',
        'modality': 'video',
        'default_provider': 'replicate',
        'providers': {
            'replicate': {'model_id': 'minimax/hailuo-2.3', 'cost_estimate': 0.15},
        },
        'defaults': {
            'duration': 6,
            'resolution': '1280x720',
        },
    },
    'hailuo-2.3-fast': {
        'label': 'Hailuo 2.3 Fast',
        'modality': 'video',
        'default_provider': 'replicate',
        'providers': {
            'replicate': {'model_id': 'minimax/hailuo-2.3-fast', 'cost_estimate': 0.08},
        },
        'defaults': {
            'duration': 6,
            'resolution': '512x512',
        },
    },
    'kling-v3': {
        'label': 'Kling v3',
        'modality': 'video',
        'default_provider': 'replicate',
        'providers': {
            'replicate': {'model_id': 'kwaivgi/kling-v3-video', 'cost_estimate': 0.14},
        },
        'defaults': {
            'duration': 5,
            'aspect_ratio': '16:9',
            'cfg_scale': 0.5,
        },
    },

    # ── Audio ─────────────────────────────────────────────────────────────────
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
    'minimax-music': {
        'label': 'MiniMax Music 2.6',
        'modality': 'audio',
        'default_provider': 'replicate',
        'providers': {
            'replicate': {'model_id': 'minimax/music-2.6', 'cost_estimate': 0.02},
        },
        'defaults': {
            'duration': 30,
            'bitrate': 128,
        },
    },
    'stable-audio-2.5': {
        'label': 'Stable Audio 2.5',
        'modality': 'audio',
        'default_provider': 'replicate',
        'providers': {
            'replicate': {'model_id': 'stability-ai/stable-audio-2.5', 'cost_estimate': 0.02},
        },
        'defaults': {
            'seconds_total': 30,
            'steps': 100,
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


def resolve_provider(model_slug: str, override: str | None = None, user=None):
    from django.conf import settings
    from providers.replicate import ReplicateProvider
    from providers.akashml import AkashMLProvider

    replicate_token = getattr(settings, 'REPLICATE_API_TOKEN', '')
    akashml_key = getattr(settings, 'AKASHML_API_KEY', '')
    akashml_url = getattr(settings, 'AKASHML_API_URL', '')

    if user and getattr(user, 'is_authenticated', False):
        from users.models import UserApiKey
        for uk in UserApiKey.objects.filter(user=user, provider__in=['replicate', 'akashml']):
            creds = uk.credentials
            if uk.provider == 'replicate' and creds.get('token'):
                replicate_token = creds['token']
            elif uk.provider == 'akashml':
                if creds.get('token'):
                    akashml_key = creds['token']
                if creds.get('api_url'):
                    akashml_url = creds['api_url']

    _providers = {
        'replicate': ReplicateProvider(token=replicate_token),
        'akashml': AkashMLProvider(api_key=akashml_key, api_url=akashml_url),
    }
    model = get_model(model_slug)
    name = override or model['default_provider']
    if name not in _providers:
        raise ValueError(f'Unknown provider: {name}')
    return _providers[name]
