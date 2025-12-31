from contextlib import asynccontextmanager
from fastapi import FastAPI
from apps.cipas.core.redis import RedisClient
from apps.cipas.core.database import init_db
from apps.cipas.syntactic.router import router as syntactic_router
from apps.cipas.semantic.router import router as semantic_router
from apps.cipas.ai_generated.router import router as ai_generated_router
from apps.cipas.provenance.router import router as provenance_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await RedisClient.connect()
    # verify db connection or init
    await init_db()
    yield
    # Shutdown
    await RedisClient.close()

app = FastAPI(title="CIPAS API", lifespan=lifespan)

app.include_router(syntactic_router)
app.include_router(semantic_router)
app.include_router(ai_generated_router)
app.include_router(provenance_router)

@app.get("/")
async def root():
    return {"message": "Welcome to CIPAS"}
