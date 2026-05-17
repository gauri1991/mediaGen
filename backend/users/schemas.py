from ninja import Schema
from pydantic import EmailStr
from typing import Optional


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
