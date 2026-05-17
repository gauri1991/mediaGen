from ninja import Router
from ninja.errors import HttpError
from ninja_jwt.authentication import JWTAuth
from django.contrib.auth import get_user_model
from .schemas import SignupIn, UpdateMeIn, ChangePasswordIn, UserOut, ApiKeyIn, ApiKeyOut
from .models import UserApiKey

router = Router(tags=['users'])
User = get_user_model()


@router.post('/signup', response=UserOut, auth=None)
def signup(request, data: SignupIn):
    if User.objects.filter(email=data.email).exists():
        raise HttpError(409, 'Email already registered')

    user = User.objects.create_user(
        username=data.email,
        email=data.email,
        password=data.password,
        first_name=data.name,
    )
    return UserOut.from_user(user)


@router.get('/me', response=UserOut, auth=JWTAuth())
def me(request):
    return UserOut.from_user(request.user)


@router.patch('/me', response=UserOut, auth=JWTAuth())
def update_me(request, data: UpdateMeIn):
    user = request.user
    if data.name is not None:
        parts = data.name.strip().split(' ', 1)
        user.first_name = parts[0]
        user.last_name = parts[1] if len(parts) > 1 else ''
        user.save(update_fields=['first_name', 'last_name'])
    return UserOut.from_user(user)


@router.post('/change-password', auth=JWTAuth())
def change_password(request, data: ChangePasswordIn):
    user = request.user
    if not user.check_password(data.old_password):
        raise HttpError(400, 'Current password is incorrect')
    if len(data.new_password) < 8:
        raise HttpError(400, 'New password must be at least 8 characters')
    user.set_password(data.new_password)
    user.save(update_fields=['password'])
    return {'ok': True}


# ── Provider API keys ─────────────────────────────────────────────────────────

@router.get('/api-keys', response=list[ApiKeyOut], auth=JWTAuth())
def list_api_keys(request):
    keys = UserApiKey.objects.filter(user=request.user)
    return [ApiKeyOut.from_model(k) for k in keys]


@router.put('/api-keys/{provider}', response=ApiKeyOut, auth=JWTAuth())
def save_api_key(request, provider: str, data: ApiKeyIn):
    VALID = {'replicate', 'akashml', 'r2'}
    if provider not in VALID:
        raise HttpError(400, f'Unknown provider: {provider}')
    if not data.credentials:
        raise HttpError(400, 'credentials must not be empty')

    uk, _ = UserApiKey.objects.update_or_create(
        user=request.user,
        provider=provider,
        defaults={'credentials': data.credentials},
    )
    return ApiKeyOut.from_model(uk)


@router.delete('/api-keys/{provider}', auth=JWTAuth())
def delete_api_key(request, provider: str):
    deleted, _ = UserApiKey.objects.filter(user=request.user, provider=provider).delete()
    if not deleted:
        raise HttpError(404, 'Key not found')
    return {'ok': True}


# ── Provider status (checks DB keys first, falls back to env) ─────────────────

@router.get('/providers/status', auth=JWTAuth(), response=dict)
def providers_status(request):
    from django.conf import settings

    user_keys = {uk.provider: uk.credentials
                 for uk in UserApiKey.objects.filter(user=request.user)}

    def _has_replicate():
        creds = user_keys.get('replicate', {})
        return bool(creds.get('token')) or bool(settings.REPLICATE_API_TOKEN)

    def _has_akashml():
        creds = user_keys.get('akashml', {})
        return bool(creds.get('token')) or bool(settings.AKASHML_API_KEY)

    def _has_r2():
        creds = user_keys.get('r2', {})
        if creds.get('account_id') and creds.get('access_key_id') and creds.get('secret_access_key'):
            return True
        return bool(settings.R2_ACCOUNT_ID and settings.R2_ACCESS_KEY_ID and settings.R2_SECRET_ACCESS_KEY)

    return {
        'replicate': _has_replicate(),
        'akashml': _has_akashml(),
        'r2': _has_r2(),
    }
