# from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
# from sqlalchemy.ext.asyncio import AsyncSession
# from typing import Optional
# from datetime import datetime
# import os
# import shutil
# import subprocess
# import sys

# from core.db import get_session
# from core.auth import get_current_user
# from models.user_model import User
# from pydantic import BaseModel


# router = APIRouter(prefix="/api/ocr", tags=["ocr"])


# class OCRResultRead(BaseModel):
#     success: bool
#     message: str
#     result_text: Optional[str] = None
#     filename: Optional[str] = None
#     processed_at: Optional[str] = None


# @router.post("/upload", response_model=OCRResultRead)
# async def upload_and_process_pdf(
#     file: UploadFile = File(...),
#     current_user: User = Depends(get_current_user),
#     session: AsyncSession = Depends(get_session),
# ):

#     if not file.filename.endswith('.pdf'):
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Hanya file PDF yang diizinkan"
#         )

#     MAX_FILE_SIZE = 50 * 1024 * 1024

#     file_content = await file.read()
#     file_size = len(file_content)

#     if file_size > MAX_FILE_SIZE:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail=f"Ukuran file melebihi batas 50MB. File Anda adalah {file_size / (1024*1024):.2f}MB"
#         )

#     await file.seek(0)

#     try:
#         base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
#         artificial_dir = os.path.join(base_dir, "artifcial")
#         files_dir = os.path.join(artificial_dir, "files")

#         if not os.path.exists(files_dir):
#             os.makedirs(files_dir)

#         timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
#         original_filename = file.filename.replace(" ", "_")
#         new_filename = f"1-{timestamp}_{original_filename}"
#         file_path = os.path.join(files_dir, new_filename)

#         for existing_file in os.listdir(files_dir):
#             if existing_file.endswith(f"_{original_filename}"):
#                 old_file_path = os.path.join(files_dir, existing_file)
#                 try:
#                     os.remove(old_file_path)
#                     print(f"[INFO] Deleted old file: {existing_file}")
#                 except Exception as e:
#                     print(f"[WARNING] Could not delete old file {existing_file}: {e}")

#         with open(file_path, "wb") as buffer:
#             shutil.copyfileobj(file.file, buffer)

#         print(f"[INFO] File saved: {new_filename}")

#         main_py_path = os.path.join(artificial_dir, "main.py")

#         print("[INFO] Running OCR process...")

#         venv_python = os.path.join(artificial_dir, ".venv", "Scripts", "python.exe")

#         if not os.path.exists(venv_python):
#             venv_python = sys.executable

#         pdf_relative_path = f"files/{new_filename}"

#         print(f"[INFO] Processing PDF: {pdf_relative_path}")

#         result = subprocess.run(
#             [venv_python, main_py_path, pdf_relative_path],
#             cwd=artificial_dir,
#             capture_output=True,
#             text=True,
#             timeout=300
#         )

#         if result.returncode != 0:
#             print(f"[ERROR] OCR process failed: {result.stderr}")
#             raise HTTPException(
#                 status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#                 detail=f"OCR processing failed: {result.stderr}"
#             )

#         print("[INFO] OCR process completed successfully")
#         print(f"[OUTPUT] {result.stdout}")

#         hasil_ocr_path = os.path.join(artificial_dir, "hasil_ocr.txt")

#         if not os.path.exists(hasil_ocr_path):
#             raise HTTPException(
#                 status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#                 detail="OCR result file not found"
#             )

#         with open(hasil_ocr_path, "r", encoding="utf-8") as f:
#             ocr_result = f.read()

#         return OCRResultRead(
#             success=True,
#             message="PDF processed successfully",
#             result_text=ocr_result,
#             filename=new_filename,
#             processed_at=datetime.now().isoformat()
#         )

#     except subprocess.TimeoutExpired:
#         raise HTTPException(
#             status_code=status.HTTP_408_REQUEST_TIMEOUT,
#             detail="OCR processing took too long (timeout after 5 minutes)"
#         )
#     except Exception as e:
#         print(f"[ERROR] Upload and process failed: {str(e)}")
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Failed to process PDF: {str(e)}"
#         )


# @router.get("/result", response_model=OCRResultRead)
# async def get_latest_ocr_result(
#     current_user: User = Depends(get_current_user),
#     session: AsyncSession = Depends(get_session),
# ):
#     try:
#         base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
#         artificial_dir = os.path.join(base_dir, "artifcial")
#         hasil_ocr_path = os.path.join(artificial_dir, "hasil_ocr.txt")

#         if not os.path.exists(hasil_ocr_path):
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail="No OCR result found"
#             )

#         with open(hasil_ocr_path, "r", encoding="utf-8") as f:
#             ocr_result = f.read()

#         mod_time = os.path.getmtime(hasil_ocr_path)
#         processed_at = datetime.fromtimestamp(mod_time).isoformat()

#         return OCRResultRead(
#             success=True,
#             message="OCR result retrieved successfully",
#             result_text=ocr_result,
#             processed_at=processed_at
#         )

#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Failed to retrieve OCR result: {str(e)}"
#         )
