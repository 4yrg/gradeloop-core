from typing import List, Dict, Any
import math
from .tier1_lexical import tier1
from ..features.ast_analysis import extract_ast_features
from ..storage.redis_client import get_redis
import json

AST_FEATURE_PREFIX = "ast:"

class Tier2Syntactic:
    def __init__(self):
        pass
        
    async def _get_redis(self):
        return await get_redis()

    def cosine_similarity(self, vec1: Dict[str, int], vec2: Dict[str, int]) -> float:
        intersection = set(vec1.keys()) & set(vec2.keys())
        numerator = sum([vec1[x] * vec2[x] for x in intersection])
        
        sum1 = sum([vec1[x]**2 for x in vec1.keys()])
        sum2 = sum([vec2[x]**2 for x in vec2.keys()])
        denominator = math.sqrt(sum1) * math.sqrt(sum2)
        
        if not denominator:
            return 0.0
        return numerator / denominator

    async def process(self, submission_id: str, code: str, candidates: List[dict]) -> List[dict]:
        """
        Refines candidates from Tier 1 using Syntactic Similarity.
        Also indexes the current submission's AST features.
        """
        features = extract_ast_features(code)
        
        # Store features in Redis for future comparisons
        # In production, we might use Postgres, but Redis is fast for prototyping
        r = await self._get_redis()
        await r.set(f"{AST_FEATURE_PREFIX}{submission_id}", json.dumps(features))
        
        refined_results = []
        
        for cand in candidates:
            # If it's already Type-1, we keep it as is, or verify. 
            # Usually strict Type-1 implies Syntactic similarity = 1.0 (almost)
            
            cand_id = cand["submission_id"]
            
            # Fetch candidate features
            cand_features_json = await r.get(f"{AST_FEATURE_PREFIX}{cand_id}")
            if not cand_features_json:
                continue
                
            cand_features = json.loads(cand_features_json)
            
            sim = self.cosine_similarity(features, cand_features)
            
            # Weighted score: Tier 1 score + Tier 2 score? 
            # Or just threshold.
            
            if sim >= 0.7:
                 refined_results.append({
                     "submission_id": cand_id,
                     "similarity": sim,
                     "tier": 2,
                     "type": "Type-3" if sim < 1.0 else "Type-2"
                 })
                 
        # Sort by similarity
        refined_results.sort(key=lambda x: x["similarity"], reverse=True)
        return refined_results[:10] # Top 10

tier2 = Tier2Syntactic()
