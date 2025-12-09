"""
Clone detection algorithms.

Implements various similarity metrics for detecting code clones.
"""

import logging
from typing import Dict, List, Tuple

from .models import ClonePair, CodeFragment

logger = logging.getLogger(__name__)


def detect_clones(
    fragments: List[CodeFragment],
    threshold: float = 0.85,
    methods: List[str] = None
) -> List[ClonePair]:
    """
    Detect clone pairs from code fragments.
    
    Args:
        fragments: List of CodeFragment objects
        threshold: Minimum similarity threshold (0-1)
        methods: Detection methods to use (token, ast, semantic)
        
    Returns:
        List of ClonePair objects
        
    Example:
        >>> fragments = [frag1, frag2, frag3]
        >>> clones = detect_clones(fragments, threshold=0.85)
        >>> len(clones)
        5
    """
    if methods is None:
        methods = ["token", "ast"]
    
    clone_pairs: List[ClonePair] = []
    
    # Compare all pairs of fragments
    for i in range(len(fragments)):
        for j in range(i + 1, len(fragments)):
            frag1 = fragments[i]
            frag2 = fragments[j]
            
            # Skip if same file and overlapping lines
            if frag1.file_path == frag2.file_path:
                if _is_overlapping(frag1, frag2):
                    continue
            
            # Compute similarity
            similarity, metadata = compute_similarity(frag1, frag2, methods)
            
            if similarity >= threshold:
                clone_type = classify_clone_type(similarity, metadata)
                
                clone_pair = ClonePair(
                    fragment_1_id=frag1.id,
                    fragment_2_id=frag2.id,
                    clone_type=clone_type,
                    similarity_score=similarity,
                    detection_method="+".join(methods),
                    metadata=metadata
                )
                clone_pairs.append(clone_pair)
    
    logger.info(f"Detected {len(clone_pairs)} clone pairs from {len(fragments)} fragments")
    return clone_pairs


def compute_similarity(
    frag1: CodeFragment,
    frag2: CodeFragment,
    methods: List[str]
) -> Tuple[float, Dict[str, float]]:
    """
    Compute similarity between two fragments using multiple methods.
    
    Args:
        frag1: First code fragment
        frag2: Second code fragment
        methods: List of methods to use
        
    Returns:
        Tuple of (overall_similarity, metadata_dict)
    """
    metadata: Dict[str, float] = {}
    scores: List[float] = []
    
    # Token-based similarity
    if "token" in methods and frag1.tokens and frag2.tokens:
        token_sim = token_similarity(frag1.tokens, frag2.tokens)
        metadata["token_similarity"] = token_sim
        scores.append(token_sim)
    
    # AST-based similarity
    if "ast" in methods and frag1.ast_hash and frag2.ast_hash:
        ast_sim = ast_similarity(frag1.ast_hash, frag2.ast_hash)
        metadata["ast_similarity"] = ast_sim
        scores.append(ast_sim)
    
    # Semantic similarity (requires embeddings)
    if "semantic" in methods and frag1.embedding and frag2.embedding:
        sem_sim = semantic_similarity(frag1.embedding, frag2.embedding)
        metadata["semantic_similarity"] = sem_sim
        scores.append(sem_sim)
    
    # Average of all scores
    overall_similarity = sum(scores) / len(scores) if scores else 0.0
    
    return overall_similarity, metadata


def token_similarity(tokens1: List[str], tokens2: List[str]) -> float:
    """
    Compute Jaccard similarity between token sets.
    
    Args:
        tokens1: List of tokens from first fragment
        tokens2: List of tokens from second fragment
        
    Returns:
        Similarity score (0-1)
    """
    if not tokens1 or not tokens2:
        return 0.0
    
    set1 = set(tokens1)
    set2 = set(tokens2)
    
    intersection = len(set1 & set2)
    union = len(set1 | set2)
    
    return intersection / union if union > 0 else 0.0


def ast_similarity(hash1: str, hash2: str) -> float:
    """
    Compute similarity based on AST hash.
    
    Args:
        hash1: AST hash of first fragment
        hash2: AST hash of second fragment
        
    Returns:
        Similarity score (0-1)
    """
    if hash1 == hash2:
        return 1.0
    
    # Compute character-level similarity (simplified)
    matches = sum(c1 == c2 for c1, c2 in zip(hash1, hash2))
    return matches / max(len(hash1), len(hash2))


def semantic_similarity(embedding1: List[float], embedding2: List[float]) -> float:
    """
    Compute cosine similarity between embeddings.
    
    Args:
        embedding1: Embedding vector of first fragment
        embedding2: Embedding vector of second fragment
        
    Returns:
        Similarity score (0-1)
    """
    if len(embedding1) != len(embedding2):
        logger.warning("Embedding dimensions don't match")
        return 0.0
    
    # Cosine similarity
    dot_product = sum(a * b for a, b in zip(embedding1, embedding2))
    norm1 = sum(a * a for a in embedding1) ** 0.5
    norm2 = sum(b * b for b in embedding2) ** 0.5
    
    if norm1 == 0 or norm2 == 0:
        return 0.0
    
    similarity = dot_product / (norm1 * norm2)
    
    # Normalize to 0-1 range (cosine is -1 to 1)
    return (similarity + 1) / 2


def classify_clone_type(similarity: float, metadata: Dict[str, float]) -> str:
    """
    Classify clone type based on similarity scores.
    
    Args:
        similarity: Overall similarity score
        metadata: Dictionary with individual similarity metrics
        
    Returns:
        Clone type string (type1, type2, type3, type4)
    """
    token_sim = metadata.get("token_similarity", 0)
    ast_sim = metadata.get("ast_similarity", 0)
    
    # Type 1: Exact clones (except whitespace/comments)
    if ast_sim >= 0.98 and token_sim >= 0.95:
        return "type1"
    
    # Type 2: Syntactically identical (different identifiers/literals)
    elif ast_sim >= 0.90 and token_sim >= 0.70:
        return "type2"
    
    # Type 3: Copied with modifications
    elif ast_sim >= 0.75 or token_sim >= 0.70:
        return "type3"
    
    # Type 4: Semantically similar
    else:
        return "type4"


def _is_overlapping(frag1: CodeFragment, frag2: CodeFragment) -> bool:
    """Check if two fragments overlap in line numbers."""
    return not (frag1.end_line < frag2.start_line or frag2.end_line < frag1.start_line)


def filter_clones_by_type(
    clone_pairs: List[ClonePair],
    clone_types: List[str]
) -> List[ClonePair]:
    """
    Filter clone pairs by clone type.
    
    Args:
        clone_pairs: List of clone pairs
        clone_types: List of clone types to keep
        
    Returns:
        Filtered list of clone pairs
    """
    return [pair for pair in clone_pairs if pair.clone_type in clone_types]
