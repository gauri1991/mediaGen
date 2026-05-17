from ninja import Router
from ninja_jwt.authentication import JWTAuth
from django.contrib.auth import get_user_model
from .schemas import SignupIn, UserOut

router = Router(tags=['users'])
User = get_user_model()


@router.post('/signup', response=UserOut, auth=None)
def signup(request, data: SignupIn):
    if User.objects.filter(email=data.email).exists():
        from ninja.errors import HttpError
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


@router.get('/providers/status', auth=None, response=dict)
def providers_status(request):
    from django.conf import settings
    return {
        'replicate': bool(settings.REPLICATE_API_TOKEN),
        'akashml': bool(settings.AKASHML_API_KEY),
    }
