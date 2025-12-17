from fastapi import FastAPI, HTTPException, Body
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
from app.pipeline import CloneDetectionPipeline
from app.utils.ast_handler import ASTHandler
from app.utils.data_handler import DataAugmentor
import os

app = FastAPI(title="Unified Semantic Code Clone Detection System")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def read_index():
    return FileResponse('static/index.html')

# Global pipeline instance
pipeline = None
ast_handler = None
augmentor = None

@app.on_event("startup")
async def startup_event():
    global pipeline, ast_handler, augmentor
    # Initialize pipeline
    # In production, model paths should be configurable
    print("Loading pipeline...")
    pipeline = CloneDetectionPipeline()
    # Try to load index & adapter
    if os.path.exists("models/adapter"):
        try:
            print("Loading trained adapter...")
            pipeline.load_adapter("models/adapter")
            # Load classifier head if exists
            if os.path.exists("models/adapter/classifier.pt"):
                 import torch
                 pipeline.classifier.load_state_dict(torch.load("models/adapter/classifier.pt", map_location=pipeline.device))
        except Exception as e:
            print(f"Failed to load adapter: {e}")

    if os.path.exists("models/index"):
        print("Loading FAISS index...")
        pipeline.load_index("models/index")
        
    ast_handler = ASTHandler()
    augmentor = DataAugmentor()
    print("Pipeline loaded.")

class CodeRequest(BaseModel):
    code: str
    language: str = "java"

class EmbedResponse(BaseModel):
    embeddings: List[List[float]]

class DetectResponse(BaseModel):
    matches: List[Dict]
    
class TrainRequest(BaseModel):
    pairs: List[Dict] # [{'code_a': ..., 'code_b': ..., 'label': ...}]
    adapter_name: str

class AdapterRequest(BaseModel):
    adapter_path: str

@app.post("/embed", response_model=EmbedResponse)
async def generate_embeddings(request: CodeRequest):
    """
    Accept code fragment(s), return embeddings.
    """
    try:
        # Extract fragments if requested or just process raw
        # For now, processing raw code block
        emb = pipeline.get_embeddings([request.code])
        return {"embeddings": emb.tolist()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/detect", response_model=DetectResponse)
async def detect_clones(request: CodeRequest):
    """
    Accept code fragment, return top-k similar fragments with classification.
    """
    try:
        # 1. FAISS Retrieval (Top-10)
        candidates = pipeline.search_similar(request.code, k=10)
        
        results = []
        for cand in candidates:
            cand_code = cand['metadata']['code']
            # 2. Re-ranking / Classification
            clone_type, probs = pipeline.predict_clone_type(request.code, cand_code)
            
            results.append({
                "code": cand_code,
                "similarity_score": cand['distance'],
                "predicted_type": clone_type,
                "probabilities": probs,
                "metadata": cand['metadata']
            })
            
        return {"matches": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/train")
async def train_adapter(request: TrainRequest):
    """
    Endpoint to train LoRA adapters on new labeled code pairs.
    """
    try:
        # Pass data to pipeline training logic (stubbed in pipeline.py)
        # pipeline.train(request.pairs)
        return {"status": "Training started (mock)", "adapter": request.adapter_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/adapter")
async def load_adapter(request: AdapterRequest):
    """
    Dynamically load language-specific LoRA adapters.
    """
    try:
        if not os.path.exists(request.adapter_path):
            raise HTTPException(status_code=404, detail="Adapter path not found")
            
        pipeline.load_adapter(request.adapter_path)
        return {"status": "Adapter loaded", "path": request.adapter_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/augment")
async def augment_data(request: CodeRequest):
    """
    Helper endpoint to visualize data augmentation.
    """
    try:
        augmented = augmentor.augment(request.code)
        return {"original": request.code, "augmented": augmented}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
