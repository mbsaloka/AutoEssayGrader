from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.db import get_session
from models.user_model import User, UserOAuth, UserSession
from core.auth import get_jwt_strategy, ACCESS_TOKEN_EXPIRE_MINUTES
import httpx
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta

load_dotenv()

router = APIRouter()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USER_INFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_INFO_URL = "https://api.github.com/user"
GITHUB_USER_EMAIL_URL = "https://api.github.com/user/emails"


@router.get("/oauth/google")
async def oauth_google_login():
    redirect_uri = f"{BACKEND_URL}/api/auth/oauth/google/callback"
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent"
    }
    
    query_string = "&".join([f"{k}={v}" for k, v in params.items()])
    authorization_url = f"{GOOGLE_AUTHORIZE_URL}?{query_string}"
    
    return {"authorization_url": authorization_url}


@router.get("/oauth/google/callback")
async def oauth_google_callback(code: str, request: Request):
    async for session in get_session():
        pass
    
    redirect_uri = f"{BACKEND_URL}/api/auth/oauth/google/callback"
    
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
            },
        )
        
        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get access token")
        
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")
        
        user_info_response = await client.get(
            GOOGLE_USER_INFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        
        if user_info_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")
        
        user_info = user_info_response.json()
    
    oauth_id = user_info.get("id")
    email = user_info.get("email")
    name = user_info.get("name", "")
    picture = user_info.get("picture")
    
    result = await session.execute(
        select(UserOAuth).where(
            UserOAuth.oauth_provider == "google",
            UserOAuth.oauth_id == oauth_id
        )
    )
    oauth_account = result.scalar_one_or_none()
    
    if oauth_account:
        oauth_account.access_token = access_token
        oauth_account.refresh_token = refresh_token
        
        user = await session.get(User, oauth_account.user_id)
        if user:
            user.profile_picture = picture
            user.fullname = name
        
        await session.commit()
    else:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user:
            username = email.split("@")[0] + "_" + oauth_id[:6]
            
            from models.user_model import UserRole
            
            user = User(
                email=email,
                fullname=name,
                username=username,
                profile_picture=picture,
                user_role=UserRole.MAHASISWA,
                hashed_password="",
                is_active=True,
                is_verified=True,
            )
            session.add(user)
            await session.flush()
        
        oauth_account = UserOAuth(
            user_id=user.id,
            oauth_provider="google",
            oauth_id=oauth_id,
            access_token=access_token,
            refresh_token=refresh_token,
        )
        session.add(oauth_account)
        await session.commit()
    
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
    
    return RedirectResponse(url=f"{FRONTEND_URL}/home?token={token}")


@router.get("/oauth/github")
async def oauth_github_login():
    redirect_uri = f"{BACKEND_URL}/api/auth/oauth/github/callback"
    params = {
        "client_id": GITHUB_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "scope": "read:user user:email",
    }
    
    query_string = "&".join([f"{k}={v}" for k, v in params.items()])
    authorization_url = f"{GITHUB_AUTHORIZE_URL}?{query_string}"
    
    return {"authorization_url": authorization_url}


@router.get("/oauth/github/callback")
async def oauth_github_callback(code: str, request: Request):
    try:
        async for session in get_session():
            async with httpx.AsyncClient() as client:
                token_response = await client.post(
                    GITHUB_TOKEN_URL,
                    data={
                        "client_id": GITHUB_CLIENT_ID,
                        "client_secret": GITHUB_CLIENT_SECRET,
                        "code": code,
                    },
                    headers={"Accept": "application/json"},
                )
                
                if token_response.status_code != 200:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Failed to get access token: {token_response.text}"
                    )
                
                token_data = token_response.json()
                access_token = token_data.get("access_token")
                
                if not access_token:
                    raise HTTPException(
                        status_code=400,
                        detail=f"No access token in response: {token_data}"
                    )
                
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/json",
                }
                
                user_info_response = await client.get(GITHUB_USER_INFO_URL, headers=headers)
                
                if user_info_response.status_code != 200:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Failed to get user info: {user_info_response.text}"
                    )
                
                user_info = user_info_response.json()
                
                email_response = await client.get(GITHUB_USER_EMAIL_URL, headers=headers)
                if email_response.status_code == 200:
                    emails = email_response.json()
                    primary_email = next((e["email"] for e in emails if e["primary"]), None)
                else:
                    primary_email = user_info.get("email")
            
            oauth_id = str(user_info.get("id"))
            email = primary_email or f"github_{oauth_id}@gmail.com"
            name = user_info.get("name") or user_info.get("login", "")
            avatar = user_info.get("avatar_url")
            
            result = await session.execute(
                select(UserOAuth).where(
                    UserOAuth.oauth_provider == "github",
                    UserOAuth.oauth_id == oauth_id
                )
            )
            oauth_account = result.scalar_one_or_none()
            
            if oauth_account:
                oauth_account.access_token = access_token
                
                user = await session.get(User, oauth_account.user_id)
                if user:
                    user.profile_picture = avatar
                    user.fullname = name
                
                await session.commit()
            else:
                result = await session.execute(select(User).where(User.email == email))
                user = result.scalar_one_or_none()
                
                if not user:
                    username = user_info.get("login", "github_" + oauth_id[:6])
                    
                    from models.user_model import UserRole
                    
                    user = User(
                        email=email,
                        fullname=name,
                        username=username,
                        profile_picture=avatar,
                        user_role=UserRole.MAHASISWA, 
                        hashed_password="",
                        is_active=True,
                        is_verified=True,
                    )
                    session.add(user)
                    await session.flush()
                
                oauth_account = UserOAuth(
                    user_id=user.id,
                    oauth_provider="github",
                    oauth_id=oauth_id,
                    access_token=access_token,
                    refresh_token=None,
                )
                session.add(oauth_account)
                await session.commit()
            
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
            
            return RedirectResponse(url=f"{FRONTEND_URL}/home?token={token}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during GitHub OAuth: {str(e)}"
        )