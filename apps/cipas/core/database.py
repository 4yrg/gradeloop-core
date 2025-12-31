from typing import AsyncGenerator
import os
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/gradeloop")

# Shared underlying connection pool via a single engine
engine = create_async_engine(DATABASE_URL, echo=True, future=True)

async_session_maker = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting async sessions"""
    async with async_session_maker() as session:
        yield session

async def init_db():
    """Initializes the database. Call this on startup."""
    async with engine.begin() as conn:
        # separate metadata handling might be needed for multi-schema if we want to create them automatically
        # For now, we assume schemas exist or models will handle their own creation logic if using alembic
        # automatic creation of schemas via SQLModel/SQLAlchemy requires explicit DDL execution
        pass
