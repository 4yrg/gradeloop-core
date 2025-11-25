import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import os

# This import assumes that you run pytest from the 'model-orchestrator' directory.
# You might need to adjust the import path based on your project structure and test runner configuration.
# To make this work, we are temporarily adding the parent directory to the path.
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', '..')))

from main import create_app
from ..db import Base, get_db

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test_code_clone.db"

engine = create_async_engine(TEST_DATABASE_URL, echo=True)
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine, class_=AsyncSession
)


async def override_get_db():
    async with TestingSessionLocal() as session:
        yield session


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest.fixture(scope="module")
async def app():
    # Setup database
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    fastapi_app = create_app()
    fastapi_app.dependency_overrides[get_db] = override_get_db
    yield fastapi_app

    # Teardown database
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="module")
async def client(app):
    async with AsyncClient(app=app, base_url="http://test") as c:
        yield c
