from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from core.auth import current_active_user
from core.db import get_session
from models.user_model import User, UserRead
from services.user_service import get_user_service, UserService

router = APIRouter(tags=["users"])


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    is_active: bool
    is_superuser: bool
    is_verified: bool

    class Config:
        from_attributes = True


@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_session),
):
    user_service = await get_user_service(session)
    users = await user_service.get_all_users(skip=skip, limit=limit)
    return users


@router.get("/users/me", response_model=UserResponse)
async def get_current_user(current_user: User = Depends(current_active_user)):
    return current_user


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: int,
    current_user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_session),
):
    user_service = await get_user_service(session)
    user = await user_service.get_user_by_id(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="not found")

    return user


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_session),
):
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="no perms")

    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="error")

    user_service = await get_user_service(session)
    await user_service.delete_user(user_id)
    return {"message": "User deleted successfully"}
