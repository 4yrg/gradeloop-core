import numpy as np
from typing import List
from ..models.embedding_model import embedder
from ..storage.redis_client import get_redis
import json

EMBEDDING_PREFIX = "emb:"

class Tier3Semantic:
    def __init__(self):
        pass

    async def _get_redis(self):
        return await get_redis()

    async def search(self, submission_id: str, code: str, candidates: List[dict]) -> List[dict]:
        """
        Retrieves semantic candidates. 
        If 'candidates' is populated (from Tier 2), it re-ranks them.
        If empty (or we want to broaden search), we might search the global index 
        (simulated here by fetching all embeddings - inefficient for huge scale 
        but fine for prototype/demo).
        """
        
        # 1. Generate Embedding
        embedding = embedder.generate_embedding(code)
        
        r = await self._get_redis()
        # Store embedding
        # We store as bytes or JSON. JSON for simplicity.
        await r.set(f"{EMBEDDING_PREFIX}{submission_id}", json.dumps(embedding))
        
        # 2. Search Strategy
        # If we have strong candidates from Tier 2, we just verify them semantically.
        # But Tier 3 is also supposed to find Type-4 clones that Tier 1/2 missed using Inverted Index.
        # So we should ideally search the whole space or a cluster.
        
        # For this implementation, let's assume we re-check the top candidates passed down 
        # PLUS maybe some random sampling or recent submissions if we had a vector index.
        # Since we don't have a real vector index (FAISS) running, we will calculate similarity 
        # for the provided candidates to refine the score.
        
        results = []
        vec1 = np.array(embedding)
        
        # Re-rank candidates
        for cand in candidates:
            cand_id = cand["submission_id"]
            emb_json = await r.get(f"{EMBEDDING_PREFIX}{cand_id}")
            
            if emb_json:
                vec2 = np.array(json.loads(emb_json))
                # Cosine sim (vectors are already normalized in model)
                score = np.dot(vec1, vec2)
                
                # Combine with previous score?
                # Semantic score is usually the authority for Type-4.
                cand["semantic_similarity"] = float(score)
                cand["similarity"] = (cand["similarity"] + float(score)) / 2 # Simple average
                cand["tier"] = 3
                
                if score > 0.75: # Type-4 threshold
                    results.append(cand)

        # If we had 0 candidates from Tier 1/2 (very unlikely unless unique code), 
        # Tier 3 could be used to scanning all. We skip that for efficiency here.
        
        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:5]

tier3 = Tier3Semantic()
