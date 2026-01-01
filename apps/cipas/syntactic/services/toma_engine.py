# 6-dimensional metric calculation (Type-3) [cite: 130, 131]
import rapidfuzz
from typing import List, Set
from ..schemas import CandidatePair, MethodMetadata
from ..repository import SyntacticRepository
from .normalizer import Normalizer


class TOMACandidateGenerator:
    def __init__(self, repository: SyntacticRepository, normalizer: Normalizer):
        self.repository = repository
        self.normalizer = normalizer


    def compute_similarity_features(
        self, 
        code_a: str, 
        code_b: str, 
        tokens_a: List[str], 
        tokens_b: List[str]
    ) -> List[float]:
        """
        Compute 6-dimensional similarity metrics.
        Returns [Jaccard, Dice, Cosine, LevDist, LevRatio, JaroWinkler]
        All normalized to [0, 1].
        """
        # Set-based metrics
        set_a = set(tokens_a)
        set_b = set(tokens_b)
        intersection = len(set_a.intersection(set_b))
        union = len(set_a.union(set_b))
        
        # 1. Jaccard
        jaccard = intersection / union if union > 0 else 0.0
        
        # 2. Sørensen–Dice
        dice = (2 * intersection) / (len(set_a) + len(set_b)) if (len(set_a) + len(set_b)) > 0 else 0.0
        
        # 3. Cosine Similarity (TF vectors)
        # Simplified TF cosine for tokens (Frequency vector dot product)
        from collections import Counter
        import math
        
        tf_a = Counter(tokens_a)
        tf_b = Counter(tokens_b)
        
        dot_product = sum(tf_a[t] * tf_b[t] for t in set_a.intersection(set_b))
        mag_a = math.sqrt(sum(c**2 for c in tf_a.values()))
        mag_b = math.sqrt(sum(c**2 for c in tf_b.values()))
        
        cosine = dot_product / (mag_a * mag_b) if (mag_a * mag_b) > 0 else 0.0
        
        # String-based metrics (Rapidfuzz)
        # 4. Levenshtein Distance (Normalized)
        # rapidfuzz.distance.Levenshtein.normalized_similarity returns 0-1 directly? 
        # Checking rapidfuzz docs: normalized_similarity is 1.0 (identical) to 0.0
        lev_dist = rapidfuzz.distance.Levenshtein.normalized_similarity(code_a, code_b)
        
        # 5. Levenshtein Ratio (Fuzz Ratio)
        # rapidfuzz.fuzz.ratio returns 0-100
        lev_ratio = rapidfuzz.fuzz.ratio(code_a, code_b) / 100.0
        
        # 6. Jaro-Winkler
        jaro_winkler = rapidfuzz.distance.JaroWinkler.similarity(code_a, code_b)
        
        return [jaccard, dice, cosine, lev_dist, lev_ratio, jaro_winkler]

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
        Computes 6-dimensional similarity features.
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
                
            # Fetch candidate code for feature computation
            cand_code = await self.repository.get_method_code(cid)
            if not cand_code:
                # Stub behavior: we might not have code in mock/stub env
                cand_code = "" 
            
            cand_tokens = self.normalizer.tokenize(cand_code)
            
            # Compute features
            features = self.compute_similarity_features(query_code, cand_code, tokens, cand_tokens)
            
            candidates.append(CandidatePair(
                query_id=query_id,
                candidate_id=cid,
                token_overlap=min_overlap_threshold, # Placeholder
                similarity_score=sum(features) / len(features), # Simple average as score for now
                features=features
            ))
            
        return candidates
