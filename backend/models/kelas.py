from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from models.user_model import Base

class Kelas(Base):
    __tablename__ = "kelas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    class_code = Column(String, unique=True, index=True, nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    teacher = relationship("User", back_populates="created_classes", foreign_keys=[teacher_id])
    participants = relationship("ClassParticipant", back_populates="kelas", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="kelas", cascade="all, delete-orphan")

