from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import List

from core.db import get_session
from core.auth import get_current_user
from models.user_model import User, UserRole
from models.kelas import Kelas
from models.assignment import Assignment
from models.assignment_submission import AssignmentSubmission
from models.class_participant import ClassParticipant
from models.nilai import Nilai

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

class DashboardStats(BaseModel):
    total_classes: int
    total_assignments: int
    pending_submissions: int
    average_score: float

class RecentActivity(BaseModel):
    type: str
    title: str
    description: str
    timestamp: str

@router.get("/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    if current_user.user_role == UserRole.DOSEN:
        result = await db.execute(
            select(func.count(Kelas.id)).where(Kelas.teacher_id == current_user.id)
        )
        total_classes = result.scalar_one()
        
        result = await db.execute(
            select(func.count(Assignment.id))
            .join(Kelas, Assignment.kelas_id == Kelas.id)
            .where(Kelas.teacher_id == current_user.id)
        )
        total_assignments = result.scalar_one()
        
        result = await db.execute(
            select(func.count(AssignmentSubmission.id))
            .join(Assignment, AssignmentSubmission.assignment_id == Assignment.id)
            .join(Kelas, Assignment.kelas_id == Kelas.id)
            .outerjoin(Nilai, Nilai.submission_id == AssignmentSubmission.id)
            .where(Kelas.teacher_id == current_user.id, Nilai.id == None)
        )
        pending_submissions = result.scalar_one()
        
        result = await db.execute(
            select(func.avg(Nilai.score))
            .join(AssignmentSubmission, Nilai.submission_id == AssignmentSubmission.id)
            .join(Assignment, AssignmentSubmission.assignment_id == Assignment.id)
            .join(Kelas, Assignment.kelas_id == Kelas.id)
            .where(Kelas.teacher_id == current_user.id)
        )
        avg_score = result.scalar_one()
        
        return {
            "total_classes": total_classes,
            "total_assignments": total_assignments,
            "pending_submissions": pending_submissions,
            "average_score": float(avg_score) if avg_score else 0.0
        }
    else:
        result = await db.execute(
            select(func.count(ClassParticipant.id))
            .where(ClassParticipant.user_id == current_user.id)
        )
        total_classes = result.scalar_one()
        
        result = await db.execute(
            select(func.count(Assignment.id))
            .join(Kelas, Assignment.kelas_id == Kelas.id)
            .join(ClassParticipant, ClassParticipant.kelas_id == Kelas.id)
            .where(ClassParticipant.user_id == current_user.id, Assignment.is_published == True)
        )
        total_assignments = result.scalar_one()
        
        result = await db.execute(
            select(func.count(Assignment.id))
            .join(Kelas, Assignment.kelas_id == Kelas.id)
            .join(ClassParticipant, ClassParticipant.kelas_id == Kelas.id)
            .outerjoin(
                AssignmentSubmission,
                (AssignmentSubmission.assignment_id == Assignment.id) &
                (AssignmentSubmission.student_id == current_user.id)
            )
            .where(
                ClassParticipant.user_id == current_user.id,
                Assignment.is_published == True,
                AssignmentSubmission.id == None
            )
        )
        pending_submissions = result.scalar_one()
        
        result = await db.execute(
            select(func.avg(Nilai.score))
            .join(AssignmentSubmission, Nilai.submission_id == AssignmentSubmission.id)
            .where(AssignmentSubmission.student_id == current_user.id)
        )
        avg_score = result.scalar_one()
        
        return {
            "total_classes": total_classes,
            "total_assignments": total_assignments,
            "pending_assignments": pending_submissions,
            "average_score": float(avg_score) if avg_score else 0.0
        }

@router.get("/recent-activity")
async def get_recent_activity(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    activities = []
    
    if current_user.user_role == UserRole.DOSEN:
        result = await db.execute(
            select(Assignment)
            .options(selectinload(Assignment.kelas))
            .join(Kelas, Assignment.kelas_id == Kelas.id)
            .where(Kelas.teacher_id == current_user.id)
            .order_by(Assignment.created_at.desc())
            .limit(5)
        )
        assignments = result.scalars().all()
        
        for assignment in assignments:
            activities.append({
                "type": "assignment_created",
                "title": f"Created assignment: {assignment.title}",
                "description": f"In class: {assignment.kelas.name}",
                "timestamp": assignment.created_at.isoformat()
            })
    else:
        result = await db.execute(
            select(AssignmentSubmission)
            .options(
                selectinload(AssignmentSubmission.assignment),
                selectinload(AssignmentSubmission.nilai)
            )
            .where(AssignmentSubmission.student_id == current_user.id)
            .order_by(AssignmentSubmission.submitted_at.desc())
            .limit(5)
        )
        submissions = result.scalars().all()
        
        for submission in submissions:
            if submission.nilai:
                activities.append({
                    "type": "graded",
                    "title": f"Assignment graded: {submission.assignment.title}",
                    "description": f"Score: {submission.nilai.score}",
                    "timestamp": submission.nilai.graded_at.isoformat()
                })
            else:
                activities.append({
                    "type": "submitted",
                    "title": f"Submitted: {submission.assignment.title}",
                    "description": "Awaiting grading",
                    "timestamp": submission.submitted_at.isoformat()
                })
    
    return {"activities": activities}

