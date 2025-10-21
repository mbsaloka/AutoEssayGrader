from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, field_validator
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from passlib.context import CryptContext

from core.auth import get_current_user
from core.db import get_session
from models.user_model import (
    User,
    UserRead,
    UserUpdate,
    UserSession,
    UserOAuth,
    UserRole,
)

# from models.class_model import Class, ClassEnrollment, Assignment, AssignmentSubmission
from services.user_service import get_user_service

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserResponse(BaseModel):
    id: int
    email: str
    fullname: str
    username: str
    user_role: str
    is_active: bool
    is_superuser: bool
    is_verified: bool

    @field_validator("user_role", mode="before")
    @classmethod
    def convert_enum_to_str(cls, v):
        if isinstance(v, UserRole):
            return v.value
        return v

    class Config:
        from_attributes = True


@router.get("/", response_model=List[UserResponse])
async def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    user_service = await get_user_service(session)
    users = await user_service.get_all_users(skip=skip, limit=limit)
    return users


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    user_service = await get_user_service(session)
    user = await user_service.get_user_by_id(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="not found")

    return user


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="no perms")

    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="error")

    user_service = await get_user_service(session)
    await user_service.delete_user(user_id)
    return {"message": "User deleted successfully"}


@router.patch("/me", response_model=UserRead)
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(select(User).where(User.id == current_user.id))
    db_user = result.scalar_one_or_none()

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user_update.dict(exclude_unset=True)

    if "password" in update_data and update_data["password"]:
        update_data["hashed_password"] = pwd_context.hash(update_data["password"])
        del update_data["password"]

    for field, value in update_data.items():
        if hasattr(db_user, field) and field != "password":
            setattr(db_user, field, value)

    try:
        await session.commit()
        await session.refresh(db_user)
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=500, detail=f"Failed to update profile: {str(e)}"
        )

    return UserRead(
        id=db_user.id,
        fullname=db_user.fullname,
        username=db_user.username,
        email=db_user.email,
        user_role=db_user.user_role,
        notelp=db_user.notelp,
        institution=db_user.institution,
        biografi=db_user.biografi,
        profile_picture=db_user.profile_picture,
        is_active=db_user.is_active,
        is_superuser=db_user.is_superuser,
        is_verified=db_user.is_verified,
        is_oauth_user=not bool(db_user.hashed_password),
    )


@router.delete("/me")
async def delete_current_user_account(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    try:
        user_id = current_user.id

        await session.execute(delete(UserSession).where(UserSession.user_id == user_id))

        await session.execute(delete(UserOAuth).where(UserOAuth.user_id == user_id))

        result = await session.execute(select(User).where(User.id == user_id))
        db_user = result.scalar_one_or_none()

        if db_user:
            await session.delete(db_user)

        await session.commit()
        return {"message": "Akun berhasil dihapus"}
    except Exception as e:
        await session.rollback()
        raise HTTPException(
            status_code=500, detail=f"Gagal menghapus akun: {str(e)}"
        )
