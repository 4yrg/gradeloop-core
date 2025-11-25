# services/inference_service.py
import asyncio
import pickle
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import faiss
import numpy as np
import torch
from transformers import AutoModel, AutoTokenizer

from ..db import AsyncSessionLocal
from ..models import Submission
from ..scripts.train_encoder import ContrastiveEncoder, TrainingConfig # For pooling
from ..storage import get_storage
from ..utils import get_logger

logger = get_logger(__name__)

# Constants for default paths
EMBEDDINGS_DIR = Path(__file__).parent.parent.parent / "artifacts" / "embeddings"
FAISS_INDEX_PATH = EMBEDDINGS_DIR / "faiss_index.bin"
SID_MAP_PATH = EMBEDDINGS_DIR / "sid_map.pkl"
MODEL_CHECKPOINT_PATH = EMBEDDINGS_DIR / "final_model" # From train_encoder.py


class InferenceService:
    """
    Service for generating code embeddings and retrieving similar code clones
    using a FAISS index.
    """
    def __init__(
        self,
        checkpoint_path: Path = MODEL_CHECKPOINT_PATH,
        faiss_index_path: Path = FAISS_INDEX_PATH,
        sid_map_path: Path = SID_MAP_PATH,
        max_length: int = 256,
        pooling_method: str = "mean",
    ):
        self.checkpoint_path = checkpoint_path
        self.faiss_index_path = faiss_index_path
        self.sid_map_path = sid_map_path
        self.max_length = max_length
        self.pooling_method = pooling_method
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        self.tokenizer: Optional[AutoTokenizer] = None
        self.model: Optional[AutoModel] = None
        self.pooler = None
        self.faiss_index: Optional[faiss.Index] = None
        self.sid_map: Optional[List[str]] = None
        self.id_to_sid: Dict[int, str] = {} # FAISS internal ID to submission ID
        
        self._load_model()
        self._load_faiss_index()

    def _load_model(self):
        """Loads the HuggingFace model and tokenizer."""
        if not self.checkpoint_path.exists():
            logger.error(f"Model checkpoint not found at {self.checkpoint_path}. Cannot initialize InferenceService.")
            return

        logger.info(f"Loading model and tokenizer from {self.checkpoint_path}...")
        self.tokenizer = AutoTokenizer.from_pretrained(self.checkpoint_path)
        self.model = AutoModel.from_pretrained(self.checkpoint_path)
        self.model.eval()
        self.model.to(self.device)

        # Re-use pooling logic from ContrastiveEncoder
        dummy_config = TrainingConfig(pooling_method=self.pooling_method)
        self.pooler = ContrastiveEncoder(dummy_config, self.tokenizer).pooler
        logger.info("Model and tokenizer loaded successfully.")

    def _load_faiss_index(self):
        """Loads the FAISS index and the submission ID map."""
        if not self.faiss_index_path.exists():
            logger.error(f"FAISS index not found at {self.faiss_index_path}. Retrieval will not work.")
            return
        if not self.sid_map_path.exists():
            logger.error(f"Submission ID map not found at {self.sid_map_path}. Retrieval will not work.")
            return

        logger.info(f"Loading FAISS index from {self.faiss_index_path}...")
        self.faiss_index = faiss.read_index(str(self.faiss_index_path))
        with open(self.sid_map_path, "rb") as f:
            self.sid_map = pickle.load(f)
        
        # Create a mapping from FAISS internal ID to actual submission ID
        self.id_to_sid = {i: sid for i, sid in enumerate(self.sid_map)}
        logger.info(f"FAISS index with {self.faiss_index.ntotal} items loaded.")

    def _embed_batch(self, codes: List[str]) -> np.ndarray:
        """Internal method to tokenize and embed a batch of code strings."""
        if not self.model or not self.tokenizer:
            raise RuntimeError("Model and tokenizer not loaded. Call _load_model() first.")
        
        inputs = self.tokenizer(
            codes,
            padding="max_length",
            truncation=True,
            max_length=self.max_length,
            return_tensors="pt",
        ).to(self.device)

        with torch.no_grad():
            outputs = self.model(input_ids=inputs.input_ids, attention_mask=inputs.attention_mask)
            embeddings = self.pooler(outputs.last_hidden_state, inputs.attention_mask)
        
        return embeddings.cpu().numpy()

    def embed_code(self, code: str) -> np.ndarray:
        """Generates an embedding for a single code string."""
        return self._embed_batch([code])[0] # Return the first (and only) embedding

    async def retrieve(self, code: str, k: int = 10) -> List[Tuple[str, float]]:
        """
        Retrieves the top-K most similar submission IDs and their scores
        from the FAISS index.
        """
        if not self.faiss_index or not self.sid_map:
            logger.error("FAISS index or SID map not loaded. Retrieval aborted.")
            return []
        
        # Embed the query code
        query_embedding = self.embed_code(code)
        
        # Perform FAISS search
        # D is distances, I is indices
        D, I = self.faiss_index.search(query_embedding.reshape(1, -1), k)
        
        results: List[Tuple[str, float]] = []
        for i, distance in zip(I[0], D[0]):
            if i == -1: # FAISS returns -1 for empty slots
                continue
            sid = self.id_to_sid.get(i)
            if sid:
                # FAISS returns distances, we want similarity. For IP, it's already similarity.
                # For L2, similarity = 1 / (1 + distance).
                score = float(distance) # Assuming IP for now
                results.append((sid, score))
        
        return results

    def rebuild_index(self, embeddings_dir: Path, index_type: str, nlist: int, metric: str):
        """
        Triggers a rebuild of the FAISS index. This is a simplified call to the
        external build script logic and requires re-instantiation of the service.
        """
        logger.info("Initiating FAISS index rebuild. This will overwrite current index.")
        # This would typically call the build script externally or duplicate its logic.
        # For simplicity, we'll just log and suggest re-initializing the service.
        logger.warning(f"Rebuild logic is not fully integrated directly within the service. "
                       f"Please run `python -m scripts.build_faiss_index build ...` and "
                       f"then re-instantiate the InferenceService.")
        # In a real system, this would call build_faiss_index.build directly
        # and then call self._load_faiss_index() again.
        
        # To simulate a rebuild and reload for now:
        if self.faiss_index_path.exists():
            os.remove(self.faiss_index_path)
        if self.sid_map_path.exists():
            os.remove(self.sid_map_path)
        
        # Need to re-run the build script. This class shouldn't directly call a typer app.
        # This method's implementation depends heavily on how build_faiss_index.py is designed.
        # For now, it's a placeholder that just clears the current state.
        self.faiss_index = None
        self.sid_map = None
        self.id_to_sid = {}
        logger.info("Index cleared. Please run the build script and re-initialize InferenceService.")

# Initialize as a global singleton, will be loaded on app startup.
# Ensure this is called once during FastAPI app startup.
inference_service = InferenceService()

# Example of how to pre-load for FastAPI
async def load_inference_service():
    global inference_service
    inference_service = InferenceService()
    # Perform initial load and potentially check health
    if inference_service.faiss_index is None or inference_service.model is None:
        logger.error("InferenceService failed to load model or FAISS index on startup.")
    return inference_service


if __name__ == "__main__":
    # Example usage (for testing, not part of the service's runtime)
    async def main():
        # First, ensure you have a trained model and a built FAISS index.
        # python scripts/train_encoder.py train ...
        # python scripts/build_faiss_index.py build ...
        
        svc = InferenceService()
        if svc.model and svc.faiss_index:
            test_code = "public class Example { public static void main(String[] args) { System.out.println(\"Hello\"); } }"
            embedding = svc.embed_code(test_code)
            print(f"Embedding shape: {embedding.shape}")
            
            results = await svc.retrieve(test_code, k=5)
            print(f"Top 5 similar: {results}")
        else:
            print("Inference service not fully initialized. Check logs for errors.")

    asyncio.run(main())
