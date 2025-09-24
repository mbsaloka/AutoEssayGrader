from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.user_model import User
from fastapi import HTTPException


class UserService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        result = await self.session.execute(select(User).offset(skip).limit(limit))
        return result.scalars().all()

    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        result = await self.session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def delete_user(self, user_id: int) -> bool:
        user = await self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="not found")

        await self.session.delete(user)
        await self.session.commit()
        return True


async def get_user_service(session: AsyncSession) -> UserService:
    return UserService(session)
