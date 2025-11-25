from fastapi import APIRouter
from .cipas_router import cipas_router # Corrected import

api_router = APIRouter()

api_router.include_router(cipas_router, prefix="/cipas", tags=["Cipas Module"])