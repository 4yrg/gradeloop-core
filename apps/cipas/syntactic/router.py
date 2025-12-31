from fastapi import APIRouter

router = APIRouter(prefix="/syntactic", tags=["Syntactic"])

@router.get("/")
async def get_syntactic_root():
    return {"message": "Syntactic Module"}
