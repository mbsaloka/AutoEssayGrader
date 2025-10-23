from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import (
    users,
    oauth,
    auth,
    classes,
    assignments,
    grading,
    profile,
    dashboard,
)
from core.db import create_tables

app = FastAPI(
    title="Auto Essay Grader API",
    version="1.1.0",
    description="Grade",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://9qg3vc8l-3000.asse.devtunnels.ms/", "https://9qg3vc8l-3000.asse.devtunnels.ms"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])

app.include_router(oauth.router, prefix="/api/auth", tags=["oauth"])

app.include_router(users.router, prefix="/api/users", tags=["users"])

app.include_router(profile.router, tags=["profile"])

app.include_router(dashboard.router, tags=["dashboard"])

app.include_router(classes.router, tags=["classes"])

app.include_router(assignments.router, tags=["assignments"])

app.include_router(grading.router, tags=["grading"])

# app.include_router(ocr.router, tags=["ocr"])

@app.on_event("startup")
async def on_startup():
    await create_tables()
    print("Database tables created successfully")

    # NOTE: Uncomment kalo AI sudah full implemented
    # from services.grading_service import initialize_embedding_model
    # try:
    #     initialize_embedding_model()
    # except Exception as e:
    #     print(f"Warning: Failed to initialize embedding model: {e}")


@app.get("/")
async def root():
    return {"message": "oke redi"}
