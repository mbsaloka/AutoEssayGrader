from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from models.user_model import Base

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False)
    question_text = Column(Text, nullable=False)
    reference_answer = Column(Text, nullable=False)
    question_order = Column(Integer, nullable=False)
    points = Column(Integer, default=10)

    assignment = relationship("Assignment", back_populates="questions")
    question_answers = relationship("QuestionAnswer", back_populates="question", cascade="all, delete-orphan")

