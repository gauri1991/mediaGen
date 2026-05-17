from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv(Path(__file__).resolve().parent.parent / '.env')

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-dev-only')
DEBUG = os.environ.get('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'ninja_extra',
    'ninja_jwt',
    'users',
    'generations',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# ── Database ──────────────────────────────────────────────────────────────────

DATABASE_URL = os.environ.get('DATABASE_URL', '')
if DATABASE_URL:
    import re
    m = re.match(r'postgresql://([^:]+):([^@]+)@([^:/]+):?(\d*)/(.+)', DATABASE_URL)
    if m:
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.postgresql',
                'USER': m.group(1),
                'PASSWORD': m.group(2),
                'HOST': m.group(3),
                'PORT': m.group(4) or '5432',
                'NAME': m.group(5),
            }
        }
    else:
        raise ValueError(f'Cannot parse DATABASE_URL: {DATABASE_URL}')
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# ── Auth ──────────────────────────────────────────────────────────────────────

AUTH_USER_MODEL = 'users.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
]

NINJA_JWT = {
    'ACCESS_TOKEN_LIFETIME': __import__('datetime').timedelta(days=7),
    'REFRESH_TOKEN_LIFETIME': __import__('datetime').timedelta(days=30),
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ── CORS ──────────────────────────────────────────────────────────────────────

CORS_ALLOWED_ORIGINS = os.environ.get(
    'CORS_ALLOWED_ORIGINS', 'http://localhost:3000'
).split(',')
CORS_ALLOW_CREDENTIALS = True

# ── Celery ────────────────────────────────────────────────────────────────────

REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_TASK_SERIALIZER = 'json'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TIMEZONE = 'UTC'

# ── Storage (Cloudflare R2) ───────────────────────────────────────────────────

R2_ACCOUNT_ID = os.environ.get('R2_ACCOUNT_ID', '')
R2_ACCESS_KEY_ID = os.environ.get('R2_ACCESS_KEY_ID', '')
R2_SECRET_ACCESS_KEY = os.environ.get('R2_SECRET_ACCESS_KEY', '')
R2_BUCKET_NAME = os.environ.get('R2_BUCKET_NAME', 'media-generator')
R2_PUBLIC_URL = os.environ.get('R2_PUBLIC_URL', '')

# ── Providers ─────────────────────────────────────────────────────────────────

REPLICATE_API_TOKEN = os.environ.get('REPLICATE_API_TOKEN', '')
REPLICATE_WEBHOOK_SECRET = os.environ.get('REPLICATE_WEBHOOK_SECRET', '')
AKASHML_API_KEY = os.environ.get('AKASHML_API_KEY', '')
AKASHML_API_URL = os.environ.get('AKASHML_API_URL', 'https://api.akash.network/inference/v1')

if not REPLICATE_WEBHOOK_SECRET:
    import logging as _log
    _log.getLogger(__name__).warning(
        'REPLICATE_WEBHOOK_SECRET not set — webhook endpoint accepts unsigned payloads'
    )

# ── Misc ──────────────────────────────────────────────────────────────────────

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True
STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
