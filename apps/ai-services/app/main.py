from contextlib import asynccontextmanager

from fastapi import FastAPI
from app.modules.cipas.router import router as cipas_router
from app.core.config import settings

ml_models = {}

@asynccontextmanager
async def lifespan(app : FastAPI):
    # --- STARTUP ---
    # This block runs when Uvicorn starts
    print("AI Service Starting Up...")

    # TODO: "Lazy load" ML models here
    # ml_models["unixcoder"] = load_model(settings.MODEL_PATH_UNIXCODER)
    # ml_models["codellama"] = load_model(settings.MODEL_PATH_CODELIAMA)
    print("--- Models would be loaded here ---")

    yield

    # --- SHUTDOWN ---
    # This block runs when Uvicorn stops
    print("AI Service Shutting Down...")
    ml_models.clear()
    print("--- Models cleared ---")


app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan  # Apply the lifespan manager
)

@app.get("/")
def read_root():
    return {"message": "AI Services Microservice is online"}

# Mount the CIPAS module router
app.include_router(
    cipas_router,
    prefix=f"{settings.API_V1_STR}/cipas",
    tags=["CIPAS"]
)

# You can add other module routers here later
# from app.modules.security_scanner.router import router as security_router
# app.include_router(security_router, prefix=f"{settings.API_V1_STR}/security", tags=["Security"])