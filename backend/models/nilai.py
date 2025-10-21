from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from models.user_model import Base

class Nilai(Base):
    __tablename__ = "nilai"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("assignment_submissions.id", ondelete="CASCADE"), unique=True, nullable=False)
    total_score = Column(Float, nullable=False)
    max_score = Column(Float, nullable=False)
    percentage = Column(Float, nullable=True)
    avg_pemahaman = Column(Float, nullable=True)
    avg_kelengkapan = Column(Float, nullable=True)
    avg_kejelasan = Column(Float, nullable=True)
    avg_analisis = Column(Float, nullable=True)
    avg_embedding_similarity = Column(Float, nullable=True)
    total_llm_time = Column(Float, nullable=True)
    total_similarity_time = Column(Float, nullable=True)
    graded_at = Column(DateTime, default=datetime.utcnow)

    submission = relationship("AssignmentSubmission", back_populates="nilai")

