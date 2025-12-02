from fastapi import APIRouter
from .template_router import cipas_router

api_router = APIRouter()

api_router.include_router(cipas_router, prefix="/test", tags=["Test"])