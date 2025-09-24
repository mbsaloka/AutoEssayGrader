from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import users
from core.auth import fastapi_users, auth_backend
from models.user_model import UserCreate, UserRead
from core.db import create_tables

app = FastAPI(
    title="Auto nilai essay API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    fastapi_users.get_auth_router(auth_backend), prefix="/auth/jwt", tags=["auth"]
)
app.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["auth"],
)

app.include_router(users.router, prefix="/api", tags=["users"])


@app.on_event("startup")
async def on_startup():
    await create_tables()


@app.get("/")
async def root():
    return {"message": "Oke mase"}
