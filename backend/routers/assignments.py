from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

from core.db import get_session
from core.auth import get_current_user, get_current_dosen
from models.user_model import User, UserRole
from models.kelas import Kelas
from models.assignment import Assignment
from models.question import Question
from models.assignment_submission import AssignmentSubmission, SubmissionType
from models.question_answer import QuestionAnswer
from models.class_participant import ClassParticipant
from models.nilai import Nilai
# from services.ocr_service import process_uploaded_file
from services.grading_tunneling import grade_submission_batch_via_tunnel

router = APIRouter(prefix="/api/assignments", tags=["assignments"])

class QuestionCreate(BaseModel):
    question_text: str
    reference_answer: str
    points: int = 10

class QuestionRead(BaseModel):
    id: int
    question_text: str
    reference_answer: str
    question_order: int
    points: int

    class Config:
        from_attributes = True

class QuestionUpdate(BaseModel):
    id: Optional[int] = None
    question_text: Optional[str] = None
    reference_answer: Optional[str] = None
    points: Optional[int] = None

class CreateAssignmentRequest(BaseModel):
    kelas_id: int
    title: str
    description: Optional[str] = None
    questions: List[QuestionCreate] = []
    deadline: Optional[datetime] = None
    max_score: Optional[int] = None
    minimal_score: Optional[int] = 75

class UpdateAssignmentRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    questions: Optional[List[QuestionUpdate]] = None
    deadline: Optional[datetime] = None
    max_score: Optional[int] = None
    minimal_score: Optional[int] = None
    is_published: Optional[bool] = None

class AnswerSubmit(BaseModel):
    question_id: int
    answer_text: str

class SubmitAnswerRequest(BaseModel):
    answers: List[AnswerSubmit]

class AssignmentResponse(BaseModel):
    id: int
    kelas_id: int
    title: str
    description: Optional[str]
    questions: List[QuestionRead]
    deadline: Optional[datetime]
    max_score: int
    minimal_score: int
    is_published: bool
    created_at: datetime

    class Config:
        from_attributes = True

class AssignmentDetailResponse(AssignmentResponse):
    submission_count: int
    class_name: str

class QuestionAnswerRead(BaseModel):
    id: int
    question_id: int
    answer_text: str
    final_score: Optional[float] = None
    feedback: Optional[str] = None

    class Config:
        from_attributes = True

class SubmissionResponse(BaseModel):
    id: int
    assignment_id: int
    student_id: int
    student_name: str
    submission_type: str
    submitted_at: datetime
    score: Optional[float] = None

    class Config:
        from_attributes = True

@router.post("/", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    request: CreateAssignmentRequest,
    current_user: User = Depends(get_current_dosen),
    db: AsyncSession = Depends(get_session)
):
    result = await db.execute(
        select(Kelas).where(Kelas.id == request.kelas_id)
    )
    kelas = result.scalar_one_or_none()

    if not kelas:
        raise HTTPException(status_code=404, detail="Kelas tidak ditemukan")

    if kelas.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Tidak punya permission untuk membuat tugas di kelas ini")

    calculated_max_score = sum(q.points for q in request.questions) if request.questions else 100
    max_score = request.max_score if request.max_score is not None else calculated_max_score
    minimal_score = request.minimal_score if request.minimal_score is not None else 75

    new_assignment = Assignment(
        kelas_id=request.kelas_id,
        title=request.title,
        description=request.description,
        deadline=request.deadline,
        max_score=max_score,
        minimal_score=minimal_score
    )

    db.add(new_assignment)
    await db.flush()

    for idx, question_data in enumerate(request.questions):
        question = Question(
            assignment_id=new_assignment.id,
            question_text=question_data.question_text,
            reference_answer=question_data.reference_answer,
            points=question_data.points,
            question_order=idx + 1
        )
        db.add(question)

    await db.commit()
    await db.refresh(new_assignment, ["questions"])

    return AssignmentResponse(
        id=new_assignment.id,
        kelas_id=new_assignment.kelas_id,
        title=new_assignment.title,
        description=new_assignment.description,
        questions=[QuestionRead.model_validate(q) for q in new_assignment.questions],
        deadline=new_assignment.deadline,
        max_score=new_assignment.max_score,
        minimal_score=new_assignment.minimal_score,
        is_published=new_assignment.is_published,
        created_at=new_assignment.created_at
    )

@router.get("/class/{class_id}", response_model=List[AssignmentResponse])
async def get_class_assignments(
    class_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    result = await db.execute(
        select(Kelas).where(Kelas.id == class_id)
    )
    kelas = result.scalar_one_or_none()

    if not kelas:
        raise HTTPException(status_code=404, detail="Kelas tidak ditemukan")

    is_teacher = kelas.teacher_id == current_user.id

    if not is_teacher:
        result = await db.execute(
            select(ClassParticipant).where(
                ClassParticipant.kelas_id == class_id,
                ClassParticipant.user_id == current_user.id
            )
        )
        is_participant = result.scalar_one_or_none() is not None

        if not is_participant:
            raise HTTPException(status_code=403, detail="Tidak punya permission untuk melihat tugas di kelas ini")

    result = await db.execute(
        select(Assignment)
        .options(selectinload(Assignment.questions))
        .where(Assignment.kelas_id == class_id)
    )
    assignments = result.scalars().all()

    if not is_teacher:
        assignments = [a for a in assignments if a.is_published]

    return [
        AssignmentResponse(
            id=assignment.id,
            kelas_id=assignment.kelas_id,
            title=assignment.title,
            description=assignment.description,
            questions=[QuestionRead.model_validate(q) for q in assignment.questions],
            deadline=assignment.deadline,
            max_score=assignment.max_score,
            minimal_score=assignment.minimal_score,
            is_published=assignment.is_published,
            created_at=assignment.created_at
        )
        for assignment in assignments
    ]

@router.get("/{assignment_id}", response_model=AssignmentDetailResponse)
async def get_assignment_detail(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    result = await db.execute(
        select(Assignment)
        .options(
            selectinload(Assignment.kelas),
            selectinload(Assignment.submissions),
            selectinload(Assignment.questions)
        )
        .where(Assignment.id == assignment_id)
    )
    assignment = result.scalar_one_or_none()

    if not assignment:
        raise HTTPException(status_code=404, detail="Tugas tidak ditemukan")

    is_teacher = assignment.kelas.teacher_id == current_user.id

    if not is_teacher:
        result = await db.execute(
            select(ClassParticipant).where(
                ClassParticipant.kelas_id == assignment.kelas_id,
                ClassParticipant.user_id == current_user.id
            )
        )
        is_participant = result.scalar_one_or_none() is not None

        if not is_participant:
            raise HTTPException(status_code=403, detail="Tidak punya permission untuk melihat tugas di kelas ini")

        if not assignment.is_published:
            raise HTTPException(status_code=403, detail="Tugas belum diterbitkan")

    return AssignmentDetailResponse(
        id=assignment.id,
        kelas_id=assignment.kelas_id,
        title=assignment.title,
        description=assignment.description,
        questions=[QuestionRead.model_validate(q) for q in assignment.questions],
        deadline=assignment.deadline,
        max_score=assignment.max_score,
        minimal_score=assignment.minimal_score,
        is_published=assignment.is_published,
        created_at=assignment.created_at,
        submission_count=len(assignment.submissions),
        class_name=assignment.kelas.name
    )

@router.put("/{assignment_id}", response_model=AssignmentResponse)
async def update_assignment(
    assignment_id: int,
    request: UpdateAssignmentRequest,
    current_user: User = Depends(get_current_dosen),
    db: AsyncSession = Depends(get_session)
):
    result = await db.execute(
        select(Assignment)
        .options(
            selectinload(Assignment.kelas),
            selectinload(Assignment.questions),
            selectinload(Assignment.submissions)
        )
        .where(Assignment.id == assignment_id)
    )
    assignment = result.scalar_one_or_none()

    if not assignment:
        raise HTTPException(status_code=404, detail="Tugas tidak ditemukan")

    if assignment.kelas.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Tidak punya permission untuk mengubah tugas di kelas ini")

    if len(assignment.submissions) > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Tidak dapat mengubah tugas. Sudah ada {len(assignment.submissions)} submission(s). Mengubah tidak dapat dilakukan setelah siswa mengumpulkan tugas."
        )

    if request.title is not None:
        assignment.title = request.title
    if request.description is not None:
        assignment.description = request.description
    if request.deadline is not None:
        assignment.deadline = request.deadline
    if request.max_score is not None:
        assignment.max_score = request.max_score
    if request.minimal_score is not None:
        assignment.minimal_score = request.minimal_score
    if request.is_published is not None:
        assignment.is_published = request.is_published

    if request.questions is not None:
        existing_question_ids = {q.id for q in assignment.questions}
        updated_question_ids = {q.id for q in request.questions if q.id is not None}

        questions_to_delete = existing_question_ids - updated_question_ids
        if questions_to_delete:
            await db.execute(
                delete(Question).where(Question.id.in_(questions_to_delete))
            )

        for idx, question_update in enumerate(request.questions):
            if question_update.id is not None:
                result = await db.execute(
                    select(Question).where(Question.id == question_update.id)
                )
                existing_question = result.scalar_one_or_none()
                if existing_question:
                    if question_update.question_text is not None:
                        existing_question.question_text = question_update.question_text
                    if question_update.reference_answer is not None:
                        existing_question.reference_answer = question_update.reference_answer
                    if question_update.points is not None:
                        existing_question.points = question_update.points
                    existing_question.question_order = idx + 1
            else:
                if question_update.question_text and question_update.reference_answer:
                    new_question = Question(
                        assignment_id=assignment.id,
                        question_text=question_update.question_text,
                        reference_answer=question_update.reference_answer,
                        points=question_update.points or 10,
                        question_order=idx + 1
                    )
                    db.add(new_question)

    await db.commit()
    await db.refresh(assignment, ["questions"])

    return AssignmentResponse(
        id=assignment.id,
        kelas_id=assignment.kelas_id,
        title=assignment.title,
        description=assignment.description,
        questions=[QuestionRead.model_validate(q) for q in assignment.questions],
        deadline=assignment.deadline,
        max_score=assignment.max_score,
        minimal_score=assignment.minimal_score,
        is_published=assignment.is_published,
        created_at=assignment.created_at
    )

@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assignment(
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
        raise HTTPException(status_code=403, detail="Tidak punya permission untuk menghapus tugas di kelas ini")

    await db.delete(assignment)
    await db.commit()

    return None

@router.post("/{assignment_id}/submit/typing", status_code=status.HTTP_201_CREATED)
async def submit_answer_typing(
    assignment_id: int,
    request: SubmitAnswerRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    result = await db.execute(
        select(Assignment)
        .options(selectinload(Assignment.kelas), selectinload(Assignment.questions))
        .where(Assignment.id == assignment_id)
    )
    assignment = result.scalar_one_or_none()

    if not assignment:
        raise HTTPException(status_code=404, detail="Tugas tidak ditemukan")

    if not assignment.is_published:
        raise HTTPException(status_code=403, detail="Tugas belum diterbitkan")

    result = await db.execute(
        select(ClassParticipant).where(
            ClassParticipant.kelas_id == assignment.kelas_id,
            ClassParticipant.user_id == current_user.id
        )
    )
    is_participant = result.scalar_one_or_none() is not None

    if not is_participant:
        raise HTTPException(status_code=403, detail="Tidak punya permission untuk mengumpulkan tugas di kelas ini")

    if assignment.deadline and datetime.utcnow() > assignment.deadline:
        raise HTTPException(status_code=400, detail="Batas waktu pengumpulan tugas sudah lewat")

    result = await db.execute(
        select(AssignmentSubmission).where(
            AssignmentSubmission.assignment_id == assignment_id,
            AssignmentSubmission.student_id == current_user.id
        )
    )
    existing_submission = result.scalar_one_or_none()

    if existing_submission:
        raise HTTPException(status_code=400, detail="Anda sudah mengumpulkan tugas ini")

    assignment_question_ids = {q.id for q in assignment.questions}
    submitted_question_ids = {a.question_id for a in request.answers}

    if assignment_question_ids != submitted_question_ids:
        raise HTTPException(
            status_code=400,
            detail="Anda harus menjawab semua pertanyaan. Pertanyaan yang hilang atau ekstra terdeteksi."
        )

    submission = AssignmentSubmission(
        assignment_id=assignment_id,
        student_id=current_user.id,
        submission_type=SubmissionType.TYPED
    )

    db.add(submission)
    await db.flush()

    for answer_data in request.answers:
        question_answer = QuestionAnswer(
            submission_id=submission.id,
            question_id=answer_data.question_id,
            answer_text=answer_data.answer_text
        )
        db.add(question_answer)

    await db.commit()
    await db.refresh(submission, ["question_answers"])

    # Grade submission using AI tunnel
    try:
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
        await db.commit()

        return {
            "message": "Answer submitted and graded successfully via AI tunnel",
            "submission_id": submission.id,
            "total_score": nilai.total_score,
            "max_score": nilai.max_score,
            "percentage": nilai.percentage
        }
    except Exception as e:
        print(f"Auto-grading failed: {str(e)}")
        await db.commit()  # Commit the submission even if grading fails
        return {
            "message": f"Answer submitted successfully (grading failed: {str(e)})",
            "submission_id": submission.id
        }

# @router.post("/{assignment_id}/submit/ocr", status_code=status.HTTP_201_CREATED)
# async def submit_answer_ocr(
#     assignment_id: int,
#     file: UploadFile = File(...),
#     current_user: User = Depends(get_current_user),
#     db: AsyncSession = Depends(get_session)
# ):
#     result = await db.execute(
#         select(Assignment)
#         .options(selectinload(Assignment.kelas), selectinload(Assignment.questions))
#         .where(Assignment.id == assignment_id)
#     )
#     assignment = result.scalar_one_or_none()

#     if not assignment:
#         raise HTTPException(status_code=404, detail="Tugas tidak ditemukan")

#     if not assignment.is_published:
#         raise HTTPException(status_code=403, detail="Tugas belum diterbitkan")

#     result = await db.execute(
#         select(ClassParticipant).where(
#             ClassParticipant.kelas_id == assignment.kelas_id,
#             ClassParticipant.user_id == current_user.id
#         )
#     )
#     is_participant = result.scalar_one_or_none() is not None

#     if not is_participant:
#         raise HTTPException(status_code=403, detail="Tidak punya permission untuk mengumpulkan tugas di kelas ini")

#     if assignment.deadline and datetime.utcnow() > assignment.deadline:
#         raise HTTPException(status_code=400, detail="Batas waktu pengumpulan tugas sudah lewat")

#     result = await db.execute(
#         select(AssignmentSubmission).where(
#             AssignmentSubmission.assignment_id == assignment_id,
#             AssignmentSubmission.student_id == current_user.id
#         )
#     )
#     existing_submission = result.scalar_one_or_none()

#     if existing_submission:
#         raise HTTPException(status_code=400, detail="Anda sudah mengumpulkan tugas ini")

#     extracted_text = await process_uploaded_file(file)

#     return {
#         "message": "File processed successfully",
#         "extracted_text": extracted_text,
#         "questions": [QuestionRead.model_validate(q) for q in assignment.questions],
#         "note": "Silakan review teks yang diambil dan kirimkan jawaban menggunakan endpoint typing"
#     }

@router.get("/{assignment_id}/submissions", response_model=List[SubmissionResponse])
async def get_assignment_submissions(
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
        raise HTTPException(status_code=403, detail="Tidak punya permission untuk melihat submission tugas di kelas ini")

    result = await db.execute(
        select(AssignmentSubmission)
        .options(
            selectinload(AssignmentSubmission.student),
            selectinload(AssignmentSubmission.nilai)
        )
        .where(AssignmentSubmission.assignment_id == assignment_id)
    )
    submissions = result.scalars().all()

    return [
        SubmissionResponse(
            id=submission.id,
            assignment_id=submission.assignment_id,
            student_id=submission.student_id,
            student_name=submission.student.fullname or submission.student.username,
            submission_type=submission.submission_type.value,
            submitted_at=submission.submitted_at,
            score=submission.nilai.total_score if submission.nilai else None
        )
        for submission in submissions
    ]

@router.get("/{assignment_id}/my-submission")
async def get_my_submission(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session)
):
    result = await db.execute(
        select(AssignmentSubmission)
        .options(
            selectinload(AssignmentSubmission.nilai),
            selectinload(AssignmentSubmission.question_answers).selectinload(QuestionAnswer.question)
        )
        .where(
            AssignmentSubmission.assignment_id == assignment_id,
            AssignmentSubmission.student_id == current_user.id
        )
    )
    submission = result.scalar_one_or_none()

    if not submission:
        return {"submitted": False}

    return {
        "submitted": True,
        "submission_id": submission.id,
        "submission_type": submission.submission_type.value,
        "submitted_at": submission.submitted_at,
        "answers": [
            {
                "question_id": qa.question_id,
                "question_text": qa.question.question_text,
                "answer_text": qa.answer_text,
                "final_score": qa.final_score,
                "feedback": qa.feedback,
                "rubric_pemahaman": qa.rubric_pemahaman,
                "rubric_kelengkapan": qa.rubric_kelengkapan,
                "rubric_kejelasan": qa.rubric_kejelasan,
                "rubric_analisis": qa.rubric_analisis,
                "rubric_rata_rata": qa.rubric_rata_rata,
                "embedding_similarity": qa.embedding_similarity
            }
            for qa in submission.question_answers
        ],
        "total_score": submission.nilai.total_score if submission.nilai else None,
        "max_score": submission.nilai.max_score if submission.nilai else None,
        "percentage": submission.nilai.percentage if submission.nilai else None,
        "graded": submission.nilai is not None,
        "avg_pemahaman": submission.nilai.avg_pemahaman if submission.nilai else None,
        "avg_kelengkapan": submission.nilai.avg_kelengkapan if submission.nilai else None,
        "avg_kejelasan": submission.nilai.avg_kejelasan if submission.nilai else None,
        "avg_analisis": submission.nilai.avg_analisis if submission.nilai else None,
        "avg_embedding_similarity": submission.nilai.avg_embedding_similarity if submission.nilai else None,
        "graded_at": submission.nilai.graded_at if submission.nilai else None
    }

