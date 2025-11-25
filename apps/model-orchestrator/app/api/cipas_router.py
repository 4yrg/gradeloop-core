from fastapi import APIRouter
from ...models.cipas.code_clone_detection.api.router import router as ciploc_router

cipas_router = APIRouter()

cipas_router.include_router(ciploc_router)

@cipas_router.get("/")
async def getHello():
    return "Hello From Test Router"