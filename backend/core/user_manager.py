from typing import Optional
from fastapi import Depends, Request
from fastapi_users import BaseUserManager, IntegerIDMixin
from models.user_model import User, UserCreate
from core.db import get_user_db
import os
from dotenv import load_dotenv

load_dotenv()

SECRET = os.getenv("SECRET_KEY")

if SECRET is None:
    raise ValueError("SECRET_KEY doesnt exists")


class UserManager(IntegerIDMixin, BaseUserManager[User, int]):
    reset_password_token_secret = SECRET
    verification_token_secret = SECRET

    async def on_after_register(self, user: User, request: Optional[Request] = None):
        pass

    async def on_after_forgot_password(
        self, user: User, token: str, request: Optional[Request] = None
    ):
        pass

    async def on_after_request_verify(
        self, user: User, token: str, request: Optional[Request] = None
    ):
        pass


async def get_user_manager(user_db=Depends(get_user_db)):
    yield UserManager(user_db)
