from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import secrets

from core.db import get_session
from core.auth import get_current_user, get_current_dosen
from models.user_model import User, UserRole
from models.kelas import Kelas
from models.class_participant import ClassParticipant

router = APIRouter(prefix="/api/classes", tags=["classes"])

class CreateClassRequest(BaseModel):
    name: str
    description: Optional[str] = None

class UpdateClassRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class JoinClassRequest(BaseModel):
    class_code: str

class ClassResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    class_code: str
    teacher_id: int
    teacher_name: str
    participant_count: int
    created_at: datetime

    class Config:
        from_attributes = True

class ClassDetailResponse(ClassResponse):
    participants: List[dict]
    assignments_count: int

@router.post("/", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
async def create_class(
    request: CreateClassRequest,
    current_user: User = Depends(get_current_dosen),
    db: AsyncSession = Depends(get_session)
):
    class_code = secrets.token_urlsafe(8)
    
    new_class = Kelas(
        name=request.name,
        description=request.description,
        class_code=class_code,
        teacher_id=current_user.id
    )
    
    db.add(new_class)
    await db.commit()
    await db.refresh(new_class)
    
    result = await db.execute(
        select(Kelas)
        .options(selectinload(Kelas.teacher), selectinload(Kelas.participants))
        .where(Kelas.id == new_class.id)
    )
    kelas = result.scalar_one()
    
    return ClassResponse(
        id=kelas.id,
        name=kelas.name,
        description=kelas.description,
        class_code=kelas.class_code,
        teacher_id=kelas.teacher_id,
        teacher_name=kelas.teacher.fullname or kelas.teacher.username,
        participant_count=len(kelas.participants),
        created_at=kelas.created_at
    )

@router.get("/search")
async def search_classes(
    query: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    if current_user.user_role == UserRole.DOSEN:
        result = await db.execute(
            select(Kelas)
            .options(selectinload(Kelas.teacher), selectinload(Kelas.participants))
            .where(
                Kelas.teacher_id == current_user.id,
                or_(
                    Kelas.name.ilike(f"%{query}%"),
                    Kelas.description.ilike(f"%{query}%")
                )
            )
        )
        classes = result.scalars().all()
    else:
        result = await db.execute(
            select(Kelas)
            .join(ClassParticipant)
            .options(selectinload(Kelas.teacher), selectinload(Kelas.participants))
            .where(
                ClassParticipant.user_id == current_user.id,
                or_(
                    Kelas.name.ilike(f"%{query}%"),
                    Kelas.description.ilike(f"%{query}%")
                )
            )
        )
        classes = result.scalars().all()
    
    return [
        {
            "id": kelas.id,
            "name": kelas.name,
            "description": kelas.description,
            "class_code": kelas.class_code,
            "teacher_name": kelas.teacher.full_name or kelas.teacher.username,
            "participant_count": len(kelas.participants)
        }
        for kelas in classes
    ]

@router.get("/", response_model=List[ClassResponse])
async def get_user_classes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    if current_user.user_role == UserRole.DOSEN:
        result = await db.execute(
            select(Kelas)
            .options(selectinload(Kelas.teacher), selectinload(Kelas.participants))
            .where(Kelas.teacher_id == current_user.id)
        )
        classes = result.scalars().all()
    else:
        result = await db.execute(
            select(Kelas)
            .join(ClassParticipant)
            .options(selectinload(Kelas.teacher), selectinload(Kelas.participants))
            .where(ClassParticipant.user_id == current_user.id)
        )
        classes = result.scalars().all()
    
    return [
        ClassResponse(
            id=kelas.id,
            name=kelas.name,
            description=kelas.description,
            class_code=kelas.class_code,
            teacher_id=kelas.teacher_id,
            teacher_name=kelas.teacher.fullname or kelas.teacher.username,
            participant_count=len(kelas.participants),
            created_at=kelas.created_at
        )
        for kelas in classes
    ]

@router.get("/{class_id}", response_model=ClassDetailResponse)
async def get_class_detail(
    class_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    result = await db.execute(
        select(Kelas)
        .options(
            selectinload(Kelas.teacher),
            selectinload(Kelas.participants).selectinload(ClassParticipant.user),
            selectinload(Kelas.assignments)
        )
        .where(Kelas.id == class_id)
    )
    kelas = result.scalar_one_or_none()
    
    if not kelas:
        raise HTTPException(status_code=404, detail="Kelas tidak ditemukan")
    
    is_teacher = kelas.teacher_id == current_user.id
    is_participant = any(p.user_id == current_user.id for p in kelas.participants)
    
    if not is_teacher and not is_participant:
        raise HTTPException(status_code=403, detail="Tidak punya permission untuk melihat kelas ini")
    
    participants = [
        {
            "id": p.user.id,
            "username": p.user.username,
            "full_name": p.user.fullname,
            "email": p.user.email,
            "joined_at": p.joined_at
        }
        for p in kelas.participants
    ]
    
    return ClassDetailResponse(
        id=kelas.id,
        name=kelas.name,
        description=kelas.description,
        class_code=kelas.class_code,
        teacher_id=kelas.teacher_id,
        teacher_name=kelas.teacher.fullname or kelas.teacher.username,
        participant_count=len(kelas.participants),
        created_at=kelas.created_at,
        participants=participants,
        assignments_count=len(kelas.assignments)
    )

@router.put("/{class_id}", response_model=ClassResponse)
async def update_class(
    class_id: int,
    request: UpdateClassRequest,
    current_user: User = Depends(get_current_dosen),
    db: AsyncSession = Depends(get_session)
):
    result = await db.execute(
        select(Kelas).where(Kelas.id == class_id)
    )
    kelas = result.scalar_one_or_none()
    
    if not kelas:
        raise HTTPException(status_code=404, detail="Kelas tidak ditemukan")
    
    if kelas.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Tidak punya permission untuk mengubah kelas ini")
    
    if request.name is not None:
        kelas.name = request.name
    if request.description is not None:
        kelas.description = request.description
    
    await db.commit()
    await db.refresh(kelas)
    
    result = await db.execute(
        select(Kelas)
        .options(selectinload(Kelas.teacher), selectinload(Kelas.participants))
        .where(Kelas.id == kelas.id)
    )
    kelas = result.scalar_one()
    
    return ClassResponse(
        id=kelas.id,
        name=kelas.name,
        description=kelas.description,
        class_code=kelas.class_code,
        teacher_id=kelas.teacher_id,
        teacher_name=kelas.teacher.fullname or kelas.teacher.username,
        participant_count=len(kelas.participants),
        created_at=kelas.created_at
    )

@router.delete("/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_class(
    class_id: int,
    current_user: User = Depends(get_current_dosen),
    db: AsyncSession = Depends(get_session)
):
    result = await db.execute(
        select(Kelas).where(Kelas.id == class_id)
    )
    kelas = result.scalar_one_or_none()
    
    if not kelas:
        raise HTTPException(status_code=404, detail="Kelas tidak ditemukan")
    
    if kelas.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Tidak punya permission untuk menghapus kelas ini")
    
    await db.delete(kelas)
    await db.commit()
    
    return None

@router.post("/join", status_code=status.HTTP_200_OK)
async def join_class(
    request: JoinClassRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    result = await db.execute(
        select(Kelas).where(Kelas.class_code == request.class_code)
    )
    kelas = result.scalar_one_or_none()
    
    if not kelas:
        raise HTTPException(status_code=404, detail="Kelas tidak ditemukan dengan kode ini")
    
    if kelas.teacher_id == current_user.id:
        raise HTTPException(status_code=400, detail="Anda adalah guru dari kelas ini")
    
    existing = await db.execute(
        select(ClassParticipant).where(
            ClassParticipant.kelas_id == kelas.id,
            ClassParticipant.user_id == current_user.id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Anda sudah menjadi anggota dari kelas ini")
    
    participant = ClassParticipant(
        kelas_id=kelas.id,
        user_id=current_user.id
    )
    db.add(participant)
    await db.commit()
    
    return {"message": "Berhasil bergabung dengan kelas", "class_id": kelas.id}

@router.post("/{class_id}/invite", status_code=status.HTTP_200_OK)
async def get_invite_info(
    class_id: int,
    current_user: User = Depends(get_current_dosen),
    db: AsyncSession = Depends(get_session)
):
    result = await db.execute(
        select(Kelas).where(Kelas.id == class_id)
    )
    kelas = result.scalar_one_or_none()
    
    if not kelas:
        raise HTTPException(status_code=404, detail="Kelas tidak ditemukan")
    
    if kelas.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Tidak punya permission untuk mengundang anggota kelas ini")
    
    return {
        "class_code": kelas.class_code,
        "invite_link": f"/join?code={kelas.class_code}",
        "class_name": kelas.name
    }

@router.delete("/{class_id}/participants/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_participant(
    class_id: int,
    user_id: int,
    current_user: User = Depends(get_current_dosen),
    db: AsyncSession = Depends(get_session)
):
    result = await db.execute(
        select(Kelas).where(Kelas.id == class_id)
    )
    kelas = result.scalar_one_or_none()
    
    if not kelas:
        raise HTTPException(status_code=404, detail="Kelas tidak ditemukan")
    
    if kelas.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Tidak punya permission untuk menghapus anggota kelas ini")
    
    result = await db.execute(
        select(ClassParticipant).where(
            ClassParticipant.kelas_id == class_id,
            ClassParticipant.user_id == user_id
        )
    )
    participant = result.scalar_one_or_none()
    
    if not participant:
        raise HTTPException(status_code=404, detail="Anggota tidak ditemukan")
    
    await db.delete(participant)
    await db.commit()
    
    return None

