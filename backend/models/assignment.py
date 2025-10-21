from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from models.user_model import Base

class AssignmentType(str, enum.Enum):
    FILE_BASED = "file_based"
    TEXT_BASED = "text_based"

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    kelas_id = Column(Integer, ForeignKey("kelas.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    assignment_type = Column(SQLEnum(AssignmentType), nullable=False, default=AssignmentType.TEXT_BASED)
    deadline = Column(DateTime, nullable=True)
    max_score = Column(Integer, default=100)
    minimal_score = Column(Integer, default=75)
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    kelas = relationship("Kelas", back_populates="assignments")
    questions = relationship("Question", back_populates="assignment", cascade="all, delete-orphan", order_by="Question.question_order")
    submissions = relationship("AssignmentSubmission", back_populates="assignment", cascade="all, delete-orphan")

