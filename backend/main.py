from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import users, oauth, auth, ocr
# Disabled: classes, enrollments, assignments
from core.db import create_tables

app = FastAPI(
    title="Auto Essay Grader API",
    version="1.0.0",
    description="API for Auto Essay Grader System"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication endpoints
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])

# OAuth endpoints
app.include_router(oauth.router, prefix="/api/auth", tags=["oauth"])

# User management endpoints
app.include_router(users.router, prefix="/api", tags=["users"])


# OCR processing endpoints
app.include_router(ocr.router, tags=["ocr"])


@app.on_event("startup")
async def on_startup():
    await create_tables()
    print("✅ Database tables created successfully")


@app.get("/")
async def root():
    return {"message": "oke masse"}
