from fastapi import FastAPI
from contextlib import asynccontextmanager
from .storage.database import init_db
from .storage.redis_client import get_redis
from .api import detect

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to DB/Redis logic
    print("Starting up Clone Detection System...")
    await init_db()
    
    # Check Redis connection
    r = await get_redis()
    try:
        await r.ping()
        print("Redis connected.")
    except Exception as e:
        print(f"Redis connection failed: {e}")

    yield
    # Shutdown
    print("Shutting down...")

app = FastAPI(title="CIPAS Clone Detection", lifespan=lifespan)

app.include_router(detect.router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "cipas"}

@app.get("/")
async def root():
    return {"message": "Welcome to CIPAS Clone Detection System"}
