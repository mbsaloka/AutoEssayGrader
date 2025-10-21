from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from models.user_model import Base

class SubmissionType(str, enum.Enum):
    TYPED = "typed"
    OCR = "ocr"

class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    submission_type = Column(SQLEnum(SubmissionType), nullable=False)
    file_path = Column(String, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)

    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("User", back_populates="assignment_submissions")
    question_answers = relationship("QuestionAnswer", back_populates="submission", cascade="all, delete-orphan")
    nilai = relationship("Nilai", back_populates="submission", uselist=False, cascade="all, delete-orphan")

