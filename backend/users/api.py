from ninja import Router
from ninja.errors import HttpError
from ninja_jwt.authentication import JWTAuth
from django.contrib.auth import get_user_model
from .schemas import SignupIn, UpdateMeIn, ChangePasswordIn, UserOut

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


@router.get('/providers/status', auth=None, response=dict)
def providers_status(request):
    from django.conf import settings
    return {
        'replicate': bool(settings.REPLICATE_API_TOKEN),
        'akashml': bool(settings.AKASHML_API_KEY),
    }
