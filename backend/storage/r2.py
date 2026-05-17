import boto3
import httpx
import os
from django.conf import settings

_r2 = None


def _client():
    global _r2
    if _r2 is None:
        _r2 = boto3.client(
            's3',
            endpoint_url=f'https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            region_name='auto',
        )
    return _r2


def upload_bytes(key: str, data: bytes, content_type: str) -> None:
    _client().put_object(
        Bucket=settings.R2_BUCKET_NAME,
        Key=key,
        Body=data,
        ContentType=content_type,
    )


def download_url(url: str) -> bytes:
    with httpx.Client(timeout=120, follow_redirects=True) as client:
        r = client.get(url)
        r.raise_for_status()
        return r.content


def public_url(key: str) -> str:
    base = settings.R2_PUBLIC_URL.rstrip('/')
    return f'{base}/{key}' if base else ''


def asset_key(user_id, generation_id, filename: str) -> str:
    return f'users/{user_id}/generations/{generation_id}/{filename}'


def thumbnail_key(asset_key_str: str) -> str:
    base, _ = os.path.splitext(asset_key_str)
    return f'{base}_thumb.webp'
