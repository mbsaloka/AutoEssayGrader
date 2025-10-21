from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from core.db import get_session
from core.auth import get_current_user, get_current_dosen
from models.user_model import User
from models.assignment import Assignment
from models.question import Question
from models.assignment_submission import AssignmentSubmission
from models.question_answer import QuestionAnswer
from models.nilai import Nilai
from models.class_participant import ClassParticipant
from services.grading_tunneling import grade_submission_batch_via_tunnel

router = APIRouter(prefix="/api/grading", tags=["grading"])

class GradeSubmissionRequest(BaseModel):
    total_score: float

class AutoGradeRequest(BaseModel):
    submission_id: int

class NilaiResponse(BaseModel):
    id: int
    submission_id: int
    student_id: int
    student_name: str
    assignment_id: int
    assignment_title: str
    total_score: float
    max_score: float
    percentage: Optional[float]
    graded_at: datetime

    class Config:
        from_attributes = True

class AssignmentStatisticsResponse(BaseModel):
    assignment_id: int
    assignment_title: str
    total_students: int
    total_submissions: int
    graded_submissions: int
    passed_students: int
    failed_students: int
    pass_percentage: float
    fail_percentage: float
    average_score: Optional[float]
    highest_score: Optional[float]
    lowest_score: Optional[float]
    minimal_score: int

class QuestionGradeDetail(BaseModel):
    question_id: int
    question_text: str
    question_points: int
    answer_text: str
    final_score: Optional[float]
    feedback: Optional[str]
    rubric_pemahaman: Optional[float]
    rubric_kelengkapan: Optional[float]
    rubric_kejelasan: Optional[float]
    rubric_analisis: Optional[float]
    rubric_rata_rata: Optional[float]
    embedding_similarity: Optional[float]

class SubmissionDetailResponse(BaseModel):
    submission_id: int
    student_id: int
    student_name: str
    assignment_id: int
    assignment_title: str
    submission_type: str
    submitted_at: datetime
    graded: bool
    total_score: Optional[float]
    max_score: Optional[float]
    percentage: Optional[float]
    avg_pemahaman: Optional[float]
    avg_kelengkapan: Optional[float]
    avg_kejelasan: Optional[float]
    avg_analisis: Optional[float]
    avg_embedding_similarity: Optional[float]
    graded_at: Optional[datetime]
    question_details: List[QuestionGradeDetail]

@router.post("/submissions/{submission_id}/grade", status_code=status.HTTP_201_CREATED)
async def grade_submission(
    submission_id: int,
    request: GradeSubmissionRequest,
    current_user: User = Depends(get_current_dosen),
    db: AsyncSession = Depends(get_session)
):
    result = await db.execute(
        select(AssignmentSubmission)
        .options(
            selectinload(AssignmentSubmission.assignment).selectinload(Assignment.kelas)
        )
        .where(AssignmentSubmission.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission tidak ditemukan")
    
    if submission.assignment.kelas.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Tidak punya permission untuk menilai submission tugas di kelas ini")
    
    if request.total_score < 0 or request.total_score > submission.assignment.max_score:
        raise HTTPException(
            status_code=400, 
            detail=f"Score must be between 0 and {submission.assignment.max_score}"
        )
    
    result = await db.execute(
        select(Nilai).where(Nilai.submission_id == submission_id)
    )
    existing_nilai = result.scalar_one_or_none()
    
    max_score = submission.assignment.max_score
    percentage = (request.total_score / max_score * 100) if max_score > 0 else 0
    
    if existing_nilai:
        existing_nilai.total_score = request.total_score
        existing_nilai.max_score = max_score
        existing_nilai.percentage = percentage
        existing_nilai.graded_at = datetime.utcnow()
        await db.commit()
        await db.refresh(existing_nilai)
        nilai = existing_nilai
    else:
        nilai = Nilai(
            submission_id=submission_id,
            total_score=request.total_score,
            max_score=max_score,
            percentage=percentage
        )
        db.add(nilai)
        await db.commit()
        await db.refresh(nilai)
    
    return {"message": "Submission berhasil dinilai", "nilai_id": nilai.id}

@router.post("/submissions/{submission_id}/auto-grade", status_code=status.HTTP_200_OK)
async def auto_grade_submission(
    submission_id: int,
    current_user: User = Depends(get_current_dosen),
    db: AsyncSession = Depends(get_session)
):
    result = await db.execute(
        select(AssignmentSubmission)
        .options(
            selectinload(AssignmentSubmission.assignment)
                .selectinload(Assignment.kelas),
            selectinload(AssignmentSubmission.assignment)
                .selectinload(Assignment.questions),
            selectinload(AssignmentSubmission.question_answers)
                .selectinload(QuestionAnswer.question)
        )
        .where(AssignmentSubmission.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission tidak ditemukan")
    
    if submission.assignment.kelas.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Tidak punya permission untuk menilai submission tugas di kelas ini")
    
    # Prepare submission data for AI grading
    submission_data = {
        "assignment_info": {
            "title": submission.assignment.title,
            "description": submission.assignment.description or ""
        },
        "questions": [
            {
                "question_id": q.id,
                "question_text": q.question_text,
                "reference_answer": q.reference_answer,
                "points": q.points
            }
            for q in submission.assignment.questions
        ],
        "answers": [
            {
                "question_id": qa.question_id,
                "answer_text": qa.answer_text
            }
            for qa in submission.question_answers
        ]
    }
    
    # Call AI tunnel for grading
    try:
        grading_result = await grade_submission_batch_via_tunnel(submission_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI grading failed: {str(e)}")
    
    
    for result_item in grading_result["results"]:
        question_answer = next(
            (qa for qa in submission.question_answers if qa.question_id == result_item["question_id"]),
            None
        )
        
        if question_answer:
            question_answer.final_score = result_item["final_score"]
            question_answer.feedback = result_item["feedback"]
            question_answer.rubric_pemahaman = result_item["rubric_scores"]["pemahaman"]
            question_answer.rubric_kelengkapan = result_item["rubric_scores"]["kelengkapan"]
            question_answer.rubric_kejelasan = result_item["rubric_scores"]["kejelasan"]
            question_answer.rubric_analisis = result_item["rubric_scores"]["analisis"]
            question_answer.rubric_rata_rata = result_item["rubric_scores"]["rata_rata"]
            question_answer.embedding_similarity = result_item["embedding_similarity"]
            question_answer.llm_time = result_item["llm_time"]
            question_answer.similarity_time = result_item["similarity_time"]
    
    result = await db.execute(
        select(Nilai).where(Nilai.submission_id == submission_id)
    )
    existing_nilai = result.scalar_one_or_none()
    
    if existing_nilai:
        existing_nilai.total_score = grading_result["total_score"]
        existing_nilai.max_score = grading_result["total_points"]
        existing_nilai.percentage = grading_result["percentage"]
        existing_nilai.avg_pemahaman = grading_result["aggregate_rubrics"]["pemahaman"]
        existing_nilai.avg_kelengkapan = grading_result["aggregate_rubrics"]["kelengkapan"]
        existing_nilai.avg_kejelasan = grading_result["aggregate_rubrics"]["kejelasan"]
        existing_nilai.avg_analisis = grading_result["aggregate_rubrics"]["analisis"]
        existing_nilai.avg_embedding_similarity = grading_result["aggregate_rubrics"]["avg_embedding_similarity"]
        existing_nilai.total_llm_time = grading_result["total_llm_time"]
        existing_nilai.total_similarity_time = grading_result["total_similarity_time"]
        existing_nilai.graded_at = datetime.utcnow()
        await db.commit()
        await db.refresh(existing_nilai)
        nilai = existing_nilai
    else:
        nilai = Nilai(
            submission_id=submission_id,
            total_score=grading_result["total_score"],
            max_score=grading_result["total_points"],
            percentage=grading_result["percentage"],
            avg_pemahaman=grading_result["aggregate_rubrics"]["pemahaman"],
            avg_kelengkapan=grading_result["aggregate_rubrics"]["kelengkapan"],
            avg_kejelasan=grading_result["aggregate_rubrics"]["kejelasan"],
            avg_analisis=grading_result["aggregate_rubrics"]["analisis"],
            avg_embedding_similarity=grading_result["aggregate_rubrics"]["avg_embedding_similarity"],
            total_llm_time=grading_result["total_llm_time"],
            total_similarity_time=grading_result["total_similarity_time"]
        )
        db.add(nilai)
        await db.commit()
        await db.refresh(nilai)
    
    return {
        "message": "Submission auto-graded successfully via AI tunnel",
        "total_score": nilai.total_score,
        "max_score": nilai.max_score,
        "percentage": nilai.percentage,
        "aggregate_rubrics": grading_result["aggregate_rubrics"],
        "question_results": grading_result["results"],
        "total_llm_time": grading_result["total_llm_time"],
        "total_similarity_time": grading_result["total_similarity_time"]
    }

@router.post("/assignments/{assignment_id}/auto-grade-all", status_code=status.HTTP_200_OK)
async def auto_grade_all_submissions(
    assignment_id: int,
    current_user: User = Depends(get_current_dosen),
    db: AsyncSession = Depends(get_session)
):
    result = await db.execute(
        select(Assignment)
        .options(
            selectinload(Assignment.kelas),
            selectinload(Assignment.questions)
        )
        .where(Assignment.id == assignment_id)
    )
    assignment = result.scalar_one_or_none()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Tugas tidak ditemukan")
    
    if assignment.kelas.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Tidak punya permission untuk menilai semua submission tugas di kelas ini")
    
    result = await db.execute(
        select(AssignmentSubmission)
        .options(
            selectinload(AssignmentSubmission.nilai),
            selectinload(AssignmentSubmission.question_answers)
        )
        .where(AssignmentSubmission.assignment_id == assignment_id)
    )
    submissions = result.scalars().all()
    
    graded_count = 0
    failed_count = 0
    
    for submission in submissions:
        if not submission.nilai:  # Only grade ungraded submissions
            submission_data = {
                "assignment_info": {
                    "title": assignment.title,
                    "description": assignment.description or ""
                },
                "questions": [
                    {
                        "question_id": q.id,
                        "question_text": q.question_text,
                        "reference_answer": q.reference_answer,
                        "points": q.points
                    }
                    for q in assignment.questions
                ],
                "answers": [
                    {
                        "question_id": qa.question_id,
                        "answer_text": qa.answer_text
                    }
                    for qa in submission.question_answers
                ]
            }
            
            try:
                grading_result = await grade_submission_batch_via_tunnel(submission_data)
                
                for result_item in grading_result["results"]:
                    question_answer = next(
                        (qa for qa in submission.question_answers if qa.question_id == result_item["question_id"]),
                        None
                    )
                    
                    if question_answer:
                        question_answer.final_score = result_item["final_score"]
                        question_answer.feedback = result_item["feedback"]
                        question_answer.rubric_pemahaman = result_item["rubric_scores"]["pemahaman"]
                        question_answer.rubric_kelengkapan = result_item["rubric_scores"]["kelengkapan"]
                        question_answer.rubric_kejelasan = result_item["rubric_scores"]["kejelasan"]
                        question_answer.rubric_analisis = result_item["rubric_scores"]["analisis"]
                        question_answer.rubric_rata_rata = result_item["rubric_scores"]["rata_rata"]
                        question_answer.embedding_similarity = result_item["embedding_similarity"]
                        question_answer.llm_time = result_item["llm_time"]
                        question_answer.similarity_time = result_item["similarity_time"]
                
                nilai = Nilai(
                    submission_id=submission.id,
                    total_score=grading_result["total_score"],
                    max_score=grading_result["total_points"],
                    percentage=grading_result["percentage"],
                    avg_pemahaman=grading_result["aggregate_rubrics"]["pemahaman"],
                    avg_kelengkapan=grading_result["aggregate_rubrics"]["kelengkapan"],
                    avg_kejelasan=grading_result["aggregate_rubrics"]["kejelasan"],
                    avg_analisis=grading_result["aggregate_rubrics"]["analisis"],
                    avg_embedding_similarity=grading_result["aggregate_rubrics"]["avg_embedding_similarity"],
                    total_llm_time=grading_result["total_llm_time"],
                    total_similarity_time=grading_result["total_similarity_time"]
                )
                db.add(nilai)
                graded_count += 1
            except Exception as e:
                print(f"❌ Failed to grade submission {submission.id}: {str(e)}")
                failed_count += 1
                continue
    
    await db.commit()
    
    return {
        "message": f"Auto-graded {graded_count} submissions successfully via AI tunnel",
        "total_submissions": len(submissions),
        "newly_graded": graded_count,
        "failed": failed_count
    }

@router.get("/assignments/{assignment_id}/statistics", response_model=AssignmentStatisticsResponse)
async def get_assignment_statistics(
    assignment_id: int,
    current_user: User = Depends(get_current_dosen),
    db: AsyncSession = Depends(get_session)
):
    result = await db.execute(
        select(Assignment)
        .options(selectinload(Assignment.kelas))
        .where(Assignment.id == assignment_id)
    )
    assignment = result.scalar_one_or_none()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Tugas tidak ditemukan")
    
    if assignment.kelas.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Tidak punya permission untuk melihat statistik tugas di kelas ini")
    
    # Get total students in the class
    result = await db.execute(
        select(func.count(ClassParticipant.id))
        .where(ClassParticipant.kelas_id == assignment.kelas_id)
    )
    total_students = result.scalar_one()
    
    result = await db.execute(
        select(func.count(AssignmentSubmission.id))
        .where(AssignmentSubmission.assignment_id == assignment_id)
    )
    total_submissions = result.scalar_one()
    
    result = await db.execute(
        select(func.count(Nilai.id))
        .join(AssignmentSubmission, Nilai.submission_id == AssignmentSubmission.id)
        .where(AssignmentSubmission.assignment_id == assignment_id)
    )
    graded_submissions = result.scalar_one()
    
    result = await db.execute(
        select(
            func.avg(Nilai.total_score),
            func.max(Nilai.total_score),
            func.min(Nilai.total_score)
        )
        .join(AssignmentSubmission, Nilai.submission_id == AssignmentSubmission.id)
        .where(AssignmentSubmission.assignment_id == assignment_id)
    )
    stats = result.one()
    
    # Calculate pass/fail based on minimal_score
    result = await db.execute(
        select(func.count(Nilai.id))
        .join(AssignmentSubmission, Nilai.submission_id == AssignmentSubmission.id)
        .where(
            AssignmentSubmission.assignment_id == assignment_id,
            Nilai.total_score >= assignment.minimal_score
        )
    )
    passed_students = result.scalar_one()
    
    failed_students = graded_submissions - passed_students
    pass_percentage = round((passed_students / graded_submissions * 100), 2) if graded_submissions > 0 else 0.0
    fail_percentage = round((failed_students / graded_submissions * 100), 2) if graded_submissions > 0 else 0.0
    
    return AssignmentStatisticsResponse(
        assignment_id=assignment_id,
        assignment_title=assignment.title,
        total_students=total_students,
        total_submissions=total_submissions,
        graded_submissions=graded_submissions,
        passed_students=passed_students,
        failed_students=failed_students,
        pass_percentage=pass_percentage,
        fail_percentage=fail_percentage,
        average_score=float(stats[0]) if stats[0] else None,
        highest_score=float(stats[1]) if stats[1] else None,
        lowest_score=float(stats[2]) if stats[2] else None,
        minimal_score=assignment.minimal_score
    )

@router.get("/assignments/{assignment_id}/grades", response_model=List[NilaiResponse])
async def get_assignment_grades(
    assignment_id: int,
    current_user: User = Depends(get_current_dosen),
    db: AsyncSession = Depends(get_session)
):
    result = await db.execute(
        select(Assignment)
        .options(selectinload(Assignment.kelas))
        .where(Assignment.id == assignment_id)
    )
    assignment = result.scalar_one_or_none()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Tugas tidak ditemukan")
    
    if assignment.kelas.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Tidak punya permission untuk melihat nilai tugas di kelas ini")
    
    result = await db.execute(
        select(Nilai)
        .join(AssignmentSubmission, Nilai.submission_id == AssignmentSubmission.id)
        .options(
            selectinload(Nilai.submission).selectinload(AssignmentSubmission.student),
            selectinload(Nilai.submission).selectinload(AssignmentSubmission.assignment)
        )
        .where(AssignmentSubmission.assignment_id == assignment_id)
    )
    grades = result.scalars().all()
    
    return [
        NilaiResponse(
            id=grade.id,
            submission_id=grade.submission_id,
            student_id=grade.submission.student_id,
            student_name=grade.submission.student.fullname or grade.submission.student.username,
            assignment_id=grade.submission.assignment_id,
            assignment_title=grade.submission.assignment.title,
            total_score=grade.total_score,
            max_score=grade.max_score,
            percentage=grade.percentage,
            graded_at=grade.graded_at
        )
        for grade in grades
    ]

@router.get("/submissions/{submission_id}/details", response_model=SubmissionDetailResponse)
async def get_submission_details(
    submission_id: int,
    current_user: User = Depends(get_current_dosen),
    db: AsyncSession = Depends(get_session)
):
    result = await db.execute(
        select(AssignmentSubmission)
        .options(
            selectinload(AssignmentSubmission.student),
            selectinload(AssignmentSubmission.assignment).selectinload(Assignment.kelas),
            selectinload(AssignmentSubmission.nilai),
            selectinload(AssignmentSubmission.question_answers).selectinload(QuestionAnswer.question)
        )
        .where(AssignmentSubmission.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission tidak ditemukan")
    
    if submission.assignment.kelas.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Tidak punya permission untuk melihat detail submission tugas di kelas ini")
    
    question_details = [
        QuestionGradeDetail(
            question_id=qa.question_id,
            question_text=qa.question.question_text,
            question_points=qa.question.points,
            answer_text=qa.answer_text,
            final_score=qa.final_score,
            feedback=qa.feedback,
            rubric_pemahaman=qa.rubric_pemahaman,
            rubric_kelengkapan=qa.rubric_kelengkapan,
            rubric_kejelasan=qa.rubric_kejelasan,
            rubric_analisis=qa.rubric_analisis,
            rubric_rata_rata=qa.rubric_rata_rata,
            embedding_similarity=qa.embedding_similarity
        )
        for qa in submission.question_answers
    ]
    
    return SubmissionDetailResponse(
        submission_id=submission.id,
        student_id=submission.student_id,
        student_name=submission.student.fullname or submission.student.username,
        assignment_id=submission.assignment_id,
        assignment_title=submission.assignment.title,
        submission_type=submission.submission_type.value,
        submitted_at=submission.submitted_at,
        graded=submission.nilai is not None,
        total_score=submission.nilai.total_score if submission.nilai else None,
        max_score=submission.nilai.max_score if submission.nilai else None,
        percentage=submission.nilai.percentage if submission.nilai else None,
        avg_pemahaman=submission.nilai.avg_pemahaman if submission.nilai else None,
        avg_kelengkapan=submission.nilai.avg_kelengkapan if submission.nilai else None,
        avg_kejelasan=submission.nilai.avg_kejelasan if submission.nilai else None,
        avg_analisis=submission.nilai.avg_analisis if submission.nilai else None,
        avg_embedding_similarity=submission.nilai.avg_embedding_similarity if submission.nilai else None,
        graded_at=submission.nilai.graded_at if submission.nilai else None,
        question_details=question_details
    )

@router.get("/students/{student_id}/grades", response_model=List[NilaiResponse])
async def get_student_grades(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    if current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Tidak punya permission untuk melihat nilai mahasiswa ini")
    
    result = await db.execute(
        select(Nilai)
        .join(AssignmentSubmission, Nilai.submission_id == AssignmentSubmission.id)
        .options(
            selectinload(Nilai.submission).selectinload(AssignmentSubmission.student),
            selectinload(Nilai.submission).selectinload(AssignmentSubmission.assignment)
        )
        .where(AssignmentSubmission.student_id == student_id)
    )
    grades = result.scalars().all()
    
    return [
        NilaiResponse(
            id=grade.id,
            submission_id=grade.submission_id,
            student_id=grade.submission.student_id,
            student_name=grade.submission.student.fullname or grade.submission.student.username,
            assignment_id=grade.submission.assignment_id,
            assignment_title=grade.submission.assignment.title,
            total_score=grade.total_score,
            max_score=grade.max_score,
            percentage=grade.percentage,
            graded_at=grade.graded_at
        )
        for grade in grades
    ]

@router.delete("/submissions/{submission_id}/grade", status_code=status.HTTP_204_NO_CONTENT)
async def delete_grade(
    submission_id: int,
    current_user: User = Depends(get_current_dosen),
    db: AsyncSession = Depends(get_session)
):
    result = await db.execute(
        select(AssignmentSubmission)
        .options(
            selectinload(AssignmentSubmission.assignment).selectinload(Assignment.kelas)
        )
        .where(AssignmentSubmission.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission tidak ditemukan")
    
    if submission.assignment.kelas.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Tidak punya permission untuk menghapus nilai submission tugas di kelas ini")
    
    result = await db.execute(
        select(Nilai).where(Nilai.submission_id == submission_id)
    )
    nilai = result.scalar_one_or_none()
    
    if not nilai:
        raise HTTPException(status_code=404, detail="Nilai tidak ditemukan")
    
    await db.delete(nilai)
    await db.commit()
    
    return None

