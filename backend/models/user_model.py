from sqlalchemy import Column, String, Boolean, Integer, Text, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from fastapi_users import schemas
from typing import Optional
from fastapi_users.db import SQLAlchemyBaseUserTable
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum

Base = declarative_base()


class UserRole(enum.Enum):
    DOSEN = "dosen"
    MAHASISWA = "mahasiswa"


class User(SQLAlchemyBaseUserTable[int], Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    profile_picture = Column(String, nullable=True)
    fullname = Column(String, nullable=False)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    notelp = Column(String, nullable=True)
    institution = Column(String, nullable=True)
    biografi = Column(Text, nullable=True)
    user_role = Column(SQLEnum(UserRole), default=UserRole.MAHASISWA, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    oauth_accounts = relationship("UserOAuth", back_populates="user", cascade="all, delete-orphan")
    created_classes = relationship("Kelas", back_populates="teacher", foreign_keys="[Kelas.teacher_id]")
    class_participants = relationship("ClassParticipant", back_populates="user")
    assignment_submissions = relationship("AssignmentSubmission", back_populates="student")


class UserOAuth(Base):
    __tablename__ = "users_oauth"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    oauth_provider = Column(String, nullable=False)
    oauth_id = Column(String, nullable=False)
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    user = relationship("User", back_populates="oauth_accounts")


class UserSession(Base):
    __tablename__ = "user_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(Text, nullable=False)
    login_timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_activity = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    ip_address = Column(String, nullable=True)
    user_agent = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    
    user = relationship("User")


class UserCreate(schemas.BaseUserCreate):
    fullname: str
    username: str
    email: str
    password: str
    user_role: UserRole = UserRole.MAHASISWA
    notelp: Optional[str] = None
    institution: Optional[str] = None
    biografi: Optional[str] = None
    profile_picture: Optional[str] = None


class UserRead(schemas.BaseUser[int]):
    id: int
    fullname: str
    username: str
    email: str
    user_role: UserRole
    notelp: Optional[str] = None
    institution: Optional[str] = None
    biografi: Optional[str] = None
    profile_picture: Optional[str] = None
    is_active: bool
    is_superuser: bool
    is_verified: bool
    is_oauth_user: bool = False


class UserUpdate(schemas.BaseUserUpdate):
    fullname: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    user_role: Optional[UserRole] = None
    notelp: Optional[str] = None
    institution: Optional[str] = None
    biografi: Optional[str] = None
    profile_picture: Optional[str] = None
    password: Optional[str] = None