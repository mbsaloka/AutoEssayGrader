from sqlalchemy import Column, Integer, Float, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from models.user_model import Base

class QuestionAnswer(Base):
    __tablename__ = "question_answers"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("assignment_submissions.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    answer_text = Column(Text, nullable=False)
    final_score = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    rubric_pemahaman = Column(Float, nullable=True)
    rubric_kelengkapan = Column(Float, nullable=True)
    rubric_kejelasan = Column(Float, nullable=True)
    rubric_analisis = Column(Float, nullable=True)
    rubric_rata_rata = Column(Float, nullable=True)
    embedding_similarity = Column(Float, nullable=True)
    llm_time = Column(Float, nullable=True)
    similarity_time = Column(Float, nullable=True)

    submission = relationship("AssignmentSubmission", back_populates="question_answers")
    question = relationship("Question", back_populates="question_answers")

