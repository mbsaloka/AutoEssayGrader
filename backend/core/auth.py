from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.user_model import User, UserRole
from core.db import get_session
from datetime import datetime, timedelta
import os
import jwt

SECRET_KEY = os.getenv("SECRET_KEY")
ACCESS_TOKEN_EXPIRE_MINUTES = 10080  

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/auth/token",
    scheme_name="Bearer Token Authentication"
)

class JWTStrategy:
    def __init__(self, secret: str, lifetime_seconds: int = 3600):
        self.secret = secret
        self.lifetime_seconds = lifetime_seconds
    
    async def write_token(self, user: User) -> str:
        data = {
            "sub": str(user.id),
            "aud": ["fastapi-users:auth"],
            "exp": datetime.utcnow() + timedelta(seconds=self.lifetime_seconds)
        }
        return jwt.encode(data, self.secret, algorithm="HS256")

def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(secret=SECRET_KEY, lifetime_seconds=ACCESS_TOKEN_EXPIRE_MINUTES * 60)

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_session)
) -> User:
    
    try:
        payload = jwt.decode(
            token, 
            SECRET_KEY, 
            algorithms=["HS256"],
            audience=["fastapi-users:auth"]
        )
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        result = await db.execute(select(User).where(User.id == int(user_id)))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )
        
        return user
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_dosen(current_user: User = Depends(get_current_user)) -> User:
    if current_user.user_role != UserRole.DOSEN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only dosen (teachers) can access this resource"
        )
    return current_user

async def get_current_mahasiswa(current_user: User = Depends(get_current_user)) -> User:
    if current_user.user_role != UserRole.MAHASISWA:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only mahasiswa (students) can access this resource"
        )
    return current_user

get_current_teacher = get_current_dosen
get_current_student = get_current_mahasiswa
