from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from typing import Optional
from passlib.context import CryptContext

from core.db import get_session
from core.auth import get_current_user
from models.user_model import User

router = APIRouter(prefix="/api/profile", tags=["profile"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UpdateProfileRequest(BaseModel):
    fullname: Optional[str] = None
    email: Optional[EmailStr] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class ProfileResponse(BaseModel):
    id: int
    username: str
    email: str
    fullname: Optional[str]
    user_role: str
    profile_picture: Optional[str]

    class Config:
        from_attributes = True

@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return ProfileResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        fullname=current_user.fullname,
        user_role=current_user.user_role.value,
        profile_picture=current_user.profile_picture
    )

@router.put("/me", response_model=ProfileResponse)
async def update_my_profile(
    request: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    if request.email is not None:
        result = await db.execute(
            select(User).where(User.email == request.email, User.id != current_user.id)
        )
        existing_user = result.scalar_one_or_none()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = request.email
    
    if request.fullname is not None:
        current_user.fullname = request.fullname
    
    await db.commit()
    await db.refresh(current_user)
    
    return ProfileResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        fullname=current_user.fullname,
        user_role=current_user.user_role.value,
        profile_picture=current_user.profile_picture
    )

@router.post("/me/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    if not pwd_context.verify(request.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Password saat ini salah")
    
    if len(request.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password harus minimal 6 karakter")
    
    current_user.hashed_password = pwd_context.hash(request.new_password)
    await db.commit()
    
    return {"message": "Password berhasil diubah"}

@router.post("/me/upload-photo", status_code=status.HTTP_200_OK)
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File harus berupa gambar")
    
    file_path = f"uploads/profiles/{current_user.id}_{file.filename}"
    
    current_user.profile_picture = file_path
    await db.commit()
    
    return {"message": "Foto profil berhasil diunggah", "photo_url": file_path}

