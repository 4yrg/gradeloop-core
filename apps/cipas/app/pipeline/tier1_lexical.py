import hashlib
from typing import List, Set
from ..features.normalization import normalize_code_ast, tokenize_source
from ..storage.redis_client import get_redis
from ..models.submission import Submission

# Key prefixes
HASH_PREFIX = "hash:"
TOKEN_PREFIX = "idx:"

class Tier1Lexical:
    def __init__(self):
        pass

    async def _get_redis(self):
        return await get_redis()

    def compute_hash(self, tokenized_code: List[str]) -> str:
        """MD5 hash of the normalized token sequence."""
        content = " ".join(tokenized_code)
        return hashlib.md5(content.encode()).hexdigest()

    async def index_submission(self, submission: Submission, normalized_tokens: List[str]):
        """
        Stores the submission hash and updates the inverted index for tokens.
        """
        r = await self._get_redis()
        sub_id = submission.id
        
        # 1. Type-1: Store Hash
        code_hash = self.compute_hash(normalized_tokens)
        await r.sadd(f"{HASH_PREFIX}{code_hash}", sub_id)
        
        # 2. Type-2: Inverted Index (Store unique tokens for Jaccard approximation)
        # To save space, we might only index rare tokens or use MinHash, but for now simple Inverted Index
        unique_tokens = set(normalized_tokens)
        
        async with r.pipeline() as pipe:
            for token in unique_tokens:
                # We pipe the adds
                pipe.sadd(f"{TOKEN_PREFIX}{token}", sub_id)
            await pipe.execute()

    async def search(self, normalized_tokens: List[str]) -> List[dict]:
        """
        Returns a list of candidate submission IDs with scores.
        """
        r = await self._get_redis()
        candidates = {} # sub_id -> score
        
        # 1. Type-1 Check (Exact Hash Match)
        code_hash = self.compute_hash(normalized_tokens)
        exact_matches = await r.smembers(f"{HASH_PREFIX}{code_hash}")
        
        results = []
        for mid in exact_matches:
            results.append({"submission_id": mid, "similarity": 1.0, "tier": 1, "type": "Type-1"})
            
        # 2. Type-2 Check (Token Overlap / Jaccard)
        # For efficiency, we can pick top N rarest tokens if dataset is huge, 
        # or just query all if submission is small.
        # Here we do a simple query for now. 
        # WARNING: O(N) where N is num tokens. 
        unique_tokens = list(set(normalized_tokens))
        
        # Limit token lookup to avoid explosion
        search_tokens = unique_tokens[:100] 
        
        # In a real heavy system we'd use MinHash LSH here. 
        # For this implementation, we'll do an intersection count via Redis or fetch & count in app.
        
        # Fetch all sets
        # Optimized: keys = [f"{TOKEN_PREFIX}{t}" for t in search_tokens]
        # Union/Intersections in redis can be slow if sets are huge.
        # Approach: Retrieve members for each token, aggregate counts in memory (MapReduce style)
        
        for token in search_tokens:
            matches = await r.smembers(f"{TOKEN_PREFIX}{token}")
            for mid in matches:
                candidates[mid] = candidates.get(mid, 0) + 1
                
        # Calculate Jaccard for top candidates
        # Jaccard = (Intersection) / (Len(A) + Len(B) - Intersection)
        # We know Intersection (candidates[mid]) and Len(A) (len(unique_tokens)).
        # We DON'T know Len(B) easily without storing metadata in Redis.
        # Simplified Tier 1: Just return candidates with high overlap count for Tier 2 to verify.
        
        # Let's filter candidates that share at least X% of tokens
        threshold_count = len(unique_tokens) * 0.4 # very loose filter
        
        for mid, count in candidates.items():
            if count >= threshold_count and mid not in exact_matches:
                # We assign a rough score, refined later
                score = count / len(unique_tokens) 
                results.append({"submission_id": mid, "similarity": score, "tier": 1, "type": "Candidate"})
                
        # Dedupe results
        # Done implicitly by logic
        
        return results

tier1 = Tier1Lexical()
