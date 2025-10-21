from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from models.user_model import Base

class ClassParticipant(Base):
    __tablename__ = "class_participants"

    id = Column(Integer, primary_key=True, index=True)
    kelas_id = Column(Integer, ForeignKey("kelas.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)

    kelas = relationship("Kelas", back_populates="participants")
    user = relationship("User", back_populates="class_participants")

    __table_args__ = (UniqueConstraint('kelas_id', 'user_id', name='_kelas_user_uc'),)

