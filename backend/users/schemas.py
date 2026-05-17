from ninja import Schema
from pydantic import EmailStr
from typing import Optional, Any


class SignupIn(Schema):
    name: str
    email: EmailStr
    password: str


class UpdateMeIn(Schema):
    name: Optional[str] = None


class ChangePasswordIn(Schema):
    old_password: str
    new_password: str


class UserOut(Schema):
    id: int
    name: str
    email: str

    @staticmethod
    def from_user(user) -> 'UserOut':
        return UserOut(id=user.id, name=user.get_full_name() or user.username, email=user.email)


class ApiKeyIn(Schema):
    credentials: dict[str, Any]


def _mask(val: str) -> str:
    if len(val) <= 8:
        return '****'
    return val[:4] + '****' + val[-4:]


class ApiKeyOut(Schema):
    provider: str
    configured: bool
    preview: Optional[dict[str, str]] = None  # masked credential values

    @staticmethod
    def from_model(uk) -> 'ApiKeyOut':
        masked = {k: _mask(str(v)) for k, v in uk.credentials.items() if v}
        return ApiKeyOut(provider=uk.provider, configured=bool(uk.credentials), preview=masked or None)
