from fastapi import APIRouter

router = APIRouter(prefix="/semantic", tags=["Semantic"])

@router.get("/")
async def get_semantic_root():
    return {"message": "Semantic Module"}
