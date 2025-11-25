from fastapi import APIRouter
from .template_router import cipas_router
from ...app.models.cipas.code_clone_detection.api.router import router as ciploc_router

api_router = APIRouter()

api_router.include_router(cipas_router, prefix="/test", tags=["Test"])
api_router.include_router(ciploc_router, prefix="/ciploc", tags=["Clone Detection"])