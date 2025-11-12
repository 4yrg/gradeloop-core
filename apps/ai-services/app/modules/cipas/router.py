from fastapi import APIRouter
from fastapi.params import Depends

from app.modules.cipas.schemas import SubmissionInput
from app.modules.cipas.services import CIPASService, get_cipas_service

router = APIRouter()


@router.post("/analyze")
async def analyze_submission(
        payload: SubmissionInput,
        service: CIPASService = Depends(get_cipas_service)
):

    return await service.process_submission(payload)