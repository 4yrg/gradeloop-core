from fastapi import APIRouter

cipas_router = APIRouter()

@cipas_router.get("/")
async def getHello():
    return "Hello From Test Router"