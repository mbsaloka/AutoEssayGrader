from sqlalchemy import Column, String, Boolean, Integer
from fastapi_users import schemas
from typing import Optional
from fastapi_users.db import SQLAlchemyBaseUserTable
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class User(SQLAlchemyBaseUserTable[int], Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)


class UserCreate(schemas.BaseUserCreate):
    name: str
    email: str
    password: str


class UserRead(schemas.BaseUser[int]):
    name: str
    email: str
    is_active: bool
    is_superuser: bool


class UserUpdate(schemas.BaseUserUpdate):
    name: Optional[str] = None
    email: Optional[str] = None
