from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.db import get_session
from models.user_model import User, UserCreate, UserRead, UserSession, UserRole
from core.auth import get_jwt_strategy, ACCESS_TOKEN_EXPIRE_MINUTES
from passlib.context import CryptContext
from pydantic import BaseModel
from datetime import datetime, timedelta
import os
import jwt

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserRead


class RegisterResponse(BaseModel):
    message: str
    user: UserRead


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


@router.post("/token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    request: Request = None,
    session: AsyncSession = Depends(get_session)
):
    result = await session.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    jwt_strategy = get_jwt_strategy()
    access_token = await jwt_strategy.write_token(user)
    
    login_timestamp = datetime.utcnow()
    expires_at = login_timestamp + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    client_host = request.client.host if request and request.client else None
    user_agent = request.headers.get("user-agent", "") if request else ""
    
    new_session = UserSession(
        user_id=user.id,
        token=access_token,
        login_timestamp=login_timestamp,
        last_activity=login_timestamp,
        ip_address=client_host,
        user_agent=user_agent,
        is_active=True,
        expires_at=expires_at
    )
    
    session.add(new_session)
    await session.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserCreate,
    session: AsyncSession = Depends(get_session)
):
    result = await session.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email sudah terdaftar"
        )
    
    result = await session.execute(select(User).where(User.username == user_data.username))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username sudah terpakai"
        )
    
    hashed_password = get_password_hash(user_data.password)
    
    new_user = User(
        email=user_data.email,
        fullname=user_data.fullname,
        username=user_data.username,
        user_role=UserRole.MAHASISWA,
        notelp=user_data.notelp,
        institution=user_data.institution,
        biografi=user_data.biografi,
        profile_picture=user_data.profile_picture,
        hashed_password=hashed_password,
        is_active=True,
        is_verified=False,
        is_superuser=False,
    )
    
    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)
    
    user_read = UserRead(
        id=new_user.id,
        email=new_user.email,
        fullname=new_user.fullname,
        username=new_user.username,
        user_role=new_user.user_role,
        notelp=new_user.notelp,
        institution=new_user.institution,
        biografi=new_user.biografi,
        profile_picture=new_user.profile_picture,
        is_active=new_user.is_active,
        is_verified=new_user.is_verified,
        is_superuser=new_user.is_superuser,
    )
    
    return RegisterResponse(
        message="User terdaftar berhasil",
        user=user_read
    )


@router.post("/login", response_model=LoginResponse)
async def login_user(
    login_data: LoginRequest,
    request: Request,
    session: AsyncSession = Depends(get_session)
):
    result = await session.execute(select(User).where(User.email == login_data.email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive"
        )
    
    jwt_strategy = get_jwt_strategy()
    token = await jwt_strategy.write_token(user)
    
    login_timestamp = datetime.utcnow()
    expires_at = login_timestamp + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    client_host = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent", "")
    
    new_session = UserSession(
        user_id=user.id,
        token=token,
        login_timestamp=login_timestamp,
        last_activity=login_timestamp,
        ip_address=client_host,
        user_agent=user_agent,
        is_active=True,
        expires_at=expires_at
    )
    
    session.add(new_session)
    await session.commit()
    
    is_oauth_user = not user.hashed_password or user.hashed_password == ""
    
    user_read = UserRead(
        id=user.id,
        email=user.email,
        fullname=user.fullname,
        username=user.username,
        user_role=user.user_role,
        notelp=user.notelp,
        institution=user.institution,
        biografi=user.biografi,
        profile_picture=user.profile_picture,
        is_active=user.is_active,
        is_verified=user.is_verified,
        is_superuser=user.is_superuser,
        is_oauth_user=is_oauth_user,
    )
    
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=user_read
    )


@router.get("/me", response_model=UserRead)
async def get_current_user(
    authorization: str = Header(None),
    session: AsyncSession = Depends(get_session)
):
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    
    token = parts[1]
    
    try:
        SECRET = os.getenv("SECRET_KEY")
        payload = jwt.decode(
            token, 
            SECRET, 
            algorithms=["HS256"],
            audience=["fastapi-users:auth"]
        )
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        
        stmt = select(User).where(User.id == int(user_id))
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        is_oauth_user = not user.hashed_password or user.hashed_password == ""
        
        return UserRead(
            id=user.id,
            email=user.email,
            fullname=user.fullname,
            username=user.username,
            user_role=user.user_role,
            notelp=user.notelp,
            institution=user.institution,
            biografi=user.biografi,
            profile_picture=user.profile_picture,
            is_active=user.is_active,
            is_verified=user.is_verified,
            is_superuser=user.is_superuser,
            is_oauth_user=is_oauth_user,
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )


@router.post("/logout")
async def logout_user(
    token: str,
    session: AsyncSession = Depends(get_session)
):
    try:
        result = await session.execute(
            select(UserSession).where(
                UserSession.token == token,
                UserSession.is_active == True
            )
        )
        user_session = result.scalar_one_or_none()
        
        if user_session:
            user_session.is_active = False
            await session.commit()
        
        return {"message": "Logout berhasil"}
    except Exception:
        return {"message": "Logout berhasil"}

