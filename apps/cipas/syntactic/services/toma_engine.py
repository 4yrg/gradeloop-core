# 6-dimensional metric calculation (Type-3) [cite: 130, 131]
from typing import List, Set
from ..schemas import CandidatePair, MethodMetadata
from ..repository import SyntacticRepository
from .normalizer import Normalizer


class TOMACandidateGenerator:
    def __init__(self, repository: SyntacticRepository, normalizer: Normalizer):
        self.repository = repository
        self.normalizer = normalizer

    async def generate_candidates(
        self, 
        query_code: str, 
        query_id: str, 
        tier1_exclusions: Set[str]
    ) -> List[CandidatePair]:
        """
        Generate candidate pairs for Tier-2 (TOMA) detection.
        Excludes methods already matched in Tier-1.
        Applies token overlap threshold and length similarity constraint.
        """
        # 1. Tokenize query code
        tokens = self.normalizer.tokenize(query_code)
        
        # 2. Retrieve candidates based on token overlap (Inverted Index Search)
        # Using a conservative overlap threshold to fetch potential candidates
        min_overlap_threshold = max(1, int(len(tokens) * 0.1)) # Example: 10% overlap
        candidate_ids = await self.repository.search_by_tokens(tokens, min_overlap_threshold)
        
        # 3. Filter candidates
        candidates = []
        
        query_metadata = await self.repository.get_method_metadata(query_id)
        if not query_metadata:
             # Fallback if metadata not found (shouldn't happen in real flow if indexed)
             query_metadata = MethodMetadata(method_id=query_id, length=len(query_code), token_count=len(tokens))

        for cid in candidate_ids:
            # Exclude Tier-1 matches
            if cid in tier1_exclusions or cid == query_id:
                continue
            
            # Fetch candidate metadata
            cand_metadata = await self.repository.get_method_metadata(cid)
            
            # Length Similarity Constraint
            # Ensure length is within a reasonable factor (e.g., 0.5 to 2.0 times query length)
            # This ensures sub-linear filtering by ignoring vastly different size methods
            if not (0.5 * query_metadata.length <= cand_metadata.length <= 2.0 * query_metadata.length):
                continue
                
            # Calculate actual token overlap (if not fully provided by search)
            # For this stub, we assume search_by_tokens returns relevant ones, but we calculate score here.
            # In a real inverted index, the overlap count might be returned. 
            # Here we simulate/calculate it if needed, or just create the candidate.
            
            # Simplified overlap calculation (would be optimized in real engine)
            # Since we don't have the candidate code here, we rely on the repository search guarantee
            # or we would fetch the tokens. For now, we assume the repo did the heavy lifting.
            # We will assign a placeholder overlap/score based on the search result.
            
            # NOTE: In a full implementation, we'd fetch the candidate's tokens or pre-computed signature.
            
            candidates.append(CandidatePair(
                query_id=query_id,
                candidate_id=cid,
                token_overlap=min_overlap_threshold, # Placeholder
                similarity_score=0.5 # Placeholder
            ))
            
        return candidates
