from fastapi import APIRouter

router = APIRouter(prefix="/provenance", tags=["Provenance"])

@router.get("/")
async def get_provenance_root():
    return {"message": "Provenance Module"}
