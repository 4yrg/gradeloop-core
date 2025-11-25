from typing import Dict, List, Any
import os

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from ...models.cipas.code_clone_detection.services.inference_service import InferenceService, load_inference_service
from ...utils import get_logger

logger = get_logger(__name__)

cipas_router = APIRouter()

# --- Authentication Dependency ---
API_KEY = os.environ.get("CIPLOC_API_KEY", "super_secret_api_key") # Use a strong key in production

async def get_api_key(api_key: str = Field(..., header="X-API-Key")):
    if api_key != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key",
        )
    return api_key

# --- Request Models ---

class EncodeRequest(BaseModel):
    code: str = Field(..., description="The source code to embed.")
    lang: str = Field("java", description="The programming language of the code.")

class EncodeResponse(BaseModel):
    embedding: List[float] = Field(..., description="The generated embedding as a list of floats.")
    shape: List[int] = Field(..., description="The shape of the embedding array.")

class RetrieveRequest(BaseModel):
    code: str = Field(..., description="The source code to use as a query.")
    lang: str = Field("java", description="The programming language of the query code.")
    k: int = Field(10, description="The number of top similar results to retrieve.")

class RetrievedItem(BaseModel):
    id: str = Field(..., description="The submission ID of the retrieved code.")
    score: float = Field(..., description="The similarity score with the query code.")
    # TODO: Add more metadata if needed from DB (e.g., problem_id, language)

class RetrieveResponse(BaseModel):
    results: List[RetrievedItem]
    count: int


class RebuildIndexRequest(BaseModel):
    embeddings_dir: Path = Field(..., description="Directory containing embedding files (.npy and .json).")
    index_type: str = Field("flat", description="Type of FAISS index to build (flat or ivf).")
    nlist: int = Field(100, description="Number of Voronoi cells for IVF index.")
    metric: str = Field("ip", description="Distance metric (L2 or Inner Product).")


class RebuildIndexResponse(BaseModel):
    status: str
    message: str


# --- Endpoints ---

# @cipas_router.on_event("startup") # Cannot attach event handlers to sub-routers directly like this
# async def startup_event():
#     """Load the inference service once on application startup."""
#     # This logic is handled by the main app's startup event or Depends(load_inference_service)
#     pass

@cipas_router.get("/")
async def getHello():
    return "Hello From Test Router"

# --- Clone Detection Endpoints (moved from code_clone_detection/api/router.py) ---

# Prefix for these routes will effectively be /cipas/ciploc
@cipas_router.get("/ciploc/health", response_model=Dict[str, str])
async def health_check_ciploc(): # Renamed to avoid clash with cipas_router.get("/")
    """Health check endpoint for ciploc sub-module."""
    return {"status": "ok"}


@cipas_router.post("/ciploc/encode", response_model=EncodeResponse)
async def encode_code(
    request: EncodeRequest,
    inference_svc: InferenceService = Depends(load_inference_service),
):
    """Generates an embedding for the given code snippet."""
    try:
        embedding = inference_svc.embed_code(request.code)
        return EncodeResponse(embedding=embedding.tolist(), shape=list(embedding.shape))
    except Exception as e:
        logger.error(f"Error encoding code: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@cipas_router.post("/ciploc/retrieve", response_model=RetrieveResponse)
async def retrieve_clones(
    request: RetrieveRequest,
    inference_svc: InferenceService = Depends(load_inference_service),
):
    """Retrieves top-K similar code clones from the FAISS index."""
    try:
        results = await inference_svc.retrieve(request.code, request.k)
        retrieved_items = [RetrievedItem(id=res[0], score=res[1]) for res in results]
        return RetrieveResponse(results=retrieved_items, count=len(retrieved_items))
    except Exception as e:
        logger.error(f"Error retrieving clones: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@cipas_router.post("/ciploc/rebuild-index", response_model=RebuildIndexResponse)
async def rebuild_faiss_index(
    request: RebuildIndexRequest,
    api_key: str = Depends(get_api_key), # Auth guard
    inference_svc: InferenceService = Depends(load_inference_service),
):
    """Rebuilds the FAISS index. Requires authentication."""
    try:
        inference_svc.rebuild_index(
            embeddings_dir=request.embeddings_dir,
            index_type=request.index_type,
            nlist=request.nlist,
            metric=request.metric,
        )
        inference_svc._load_faiss_index() # Reload after rebuild
        
        return RebuildIndexResponse(status="success", message="FAISS index rebuild initiated and reloaded.")
    except Exception as e:
        logger.error(f"Error rebuilding FAISS index: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# --- Clone Detection Endpoints (moved from code_clone_detection/api/router.py) ---

# Prefix for these routes will effectively be /cipas/ciploc
@cipas_router.get("/ciploc/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


@cipas_router.post("/ciploc/encode", response_model=EncodeResponse)
async def encode_code(
    request: EncodeRequest,
    inference_svc: InferenceService = Depends(load_inference_service),
):
    """Generates an embedding for the given code snippet."""
    try:
        embedding = inference_svc.embed_code(request.code)
        return EncodeResponse(embedding=embedding.tolist(), shape=list(embedding.shape))
    except Exception as e:
        logger.error(f"Error encoding code: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@cipas_router.post("/ciploc/retrieve", response_model=RetrieveResponse)
async def retrieve_clones(
    request: RetrieveRequest,
    inference_svc: InferenceService = Depends(load_inference_service),
):
    """Retrieves top-K similar code clones from the FAISS index."""
    try:
        results = await inference_svc.retrieve(request.code, request.k)
        retrieved_items = [RetrievedItem(id=res[0], score=res[1]) for res in results]
        return RetrieveResponse(results=retrieved_items, count=len(retrieved_items))
    except Exception as e:
        logger.error(f"Error retrieving clones: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@cipas_router.post("/ciploc/rebuild-index", response_model=RebuildIndexResponse)
async def rebuild_faiss_index(
    request: RebuildIndexRequest,
    api_key: str = Depends(get_api_key), # Auth guard
    inference_svc: InferenceService = Depends(load_inference_service),
):
    """Rebuilds the FAISS index. Requires authentication."""
    try:
        inference_svc.rebuild_index(
            embeddings_dir=request.embeddings_dir,
            index_type=request.index_type,
            nlist=request.nlist,
            metric=request.metric,
        )
        inference_svc._load_faiss_index() # Reload after rebuild
        
        return RebuildIndexResponse(status="success", message="FAISS index rebuild initiated and reloaded.")
    except Exception as e:
        logger.error(f"Error rebuilding FAISS index: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))