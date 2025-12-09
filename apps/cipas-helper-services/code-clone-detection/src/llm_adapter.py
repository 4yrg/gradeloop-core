"""
LLM adapter interface for semantic analysis.

Defines abstract interface for LLM providers with mockable implementations.
"""

import logging
from abc import ABC, abstractmethod
from typing import List, Optional

logger = logging.getLogger(__name__)


class LLMAdapter(ABC):
    """
    Abstract base class for LLM adapters.
    
    Provides interface for generating embeddings and semantic analysis.
    """
    
    @abstractmethod
    def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding vector for text.
        
        Args:
            text: Input text
            
        Returns:
            Embedding vector as list of floats
        """
        pass
    
    @abstractmethod
    def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple texts (batched).
        
        Args:
            texts: List of input texts
            
        Returns:
            List of embedding vectors
        """
        pass
    
    @abstractmethod
    def compute_semantic_similarity(self, text1: str, text2: str) -> float:
        """
        Compute semantic similarity between two texts.
        
        Args:
            text1: First text
            text2: Second text
            
        Returns:
            Similarity score (0-1)
        """
        pass
    
    def is_available(self) -> bool:
        """
        Check if LLM service is available.
        
        Returns:
            True if available
        """
        return True


class MockLLMAdapter(LLMAdapter):
    """
    Mock LLM adapter for testing and development.
    
    Returns deterministic mock embeddings.
    """
    
    def __init__(self, embedding_dim: int = 128):
        """
        Initialize mock adapter.
        
        Args:
            embedding_dim: Dimension of embedding vectors
        """
        self.embedding_dim = embedding_dim
        logger.info(f"Initialized MockLLMAdapter with dim={embedding_dim}")
    
    def generate_embedding(self, text: str) -> List[float]:
        """
        Generate mock embedding based on text hash.
        
        Args:
            text: Input text
            
        Returns:
            Mock embedding vector
        """
        # Simple deterministic mock: use hash to generate values
        hash_value = hash(text)
        embedding = [
            (hash_value * (i + 1)) % 100 / 100.0
            for i in range(self.embedding_dim)
        ]
        return embedding
    
    def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generate mock embeddings for batch.
        
        Args:
            texts: List of input texts
            
        Returns:
            List of mock embedding vectors
        """
        return [self.generate_embedding(text) for text in texts]
    
    def compute_semantic_similarity(self, text1: str, text2: str) -> float:
        """
        Compute mock similarity (based on text length similarity).
        
        Args:
            text1: First text
            text2: Second text
            
        Returns:
            Mock similarity score
        """
        len1 = len(text1)
        len2 = len(text2)
        
        if len1 == 0 and len2 == 0:
            return 1.0
        
        # Similarity based on length difference
        max_len = max(len1, len2)
        diff = abs(len1 - len2)
        similarity = 1.0 - (diff / max_len)
        
        return max(0.0, min(1.0, similarity))


class OpenAIAdapter(LLMAdapter):
    """
    OpenAI adapter (interface only - requires openai package).
    
    To use: pip install openai
    """
    
    def __init__(self, api_key: Optional[str] = None, model: str = "text-embedding-ada-002"):
        """
        Initialize OpenAI adapter.
        
        Args:
            api_key: OpenAI API key
            model: Embedding model name
        """
        self.api_key = api_key
        self.model = model
        self._client = None
        logger.info(f"Initialized OpenAIAdapter with model={model}")
    
    def _get_client(self):
        """Lazy load OpenAI client."""
        if self._client is None:
            try:
                import openai
                self._client = openai.OpenAI(api_key=self.api_key)
            except ImportError:
                raise ImportError("openai package not installed. Install with: pip install openai")
        return self._client
    
    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding using OpenAI API."""
        client = self._get_client()
        response = client.embeddings.create(input=[text], model=self.model)
        return response.data[0].embedding
    
    def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings in batch."""
        client = self._get_client()
        response = client.embeddings.create(input=texts, model=self.model)
        return [item.embedding for item in response.data]
    
    def compute_semantic_similarity(self, text1: str, text2: str) -> float:
        """Compute similarity using embeddings."""
        emb1 = self.generate_embedding(text1)
        emb2 = self.generate_embedding(text2)
        
        # Cosine similarity
        dot_product = sum(a * b for a, b in zip(emb1, emb2))
        norm1 = sum(a * a for a in emb1) ** 0.5
        norm2 = sum(b * b for b in emb2) ** 0.5
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        similarity = dot_product / (norm1 * norm2)
        return (similarity + 1) / 2  # Normalize to 0-1


def create_llm_adapter(
    provider: str = "mock",
    config: Optional[dict] = None
) -> LLMAdapter:
    """
    Factory function to create LLM adapter.
    
    Args:
        provider: Provider name (mock, openai, anthropic)
        config: Configuration dictionary for the adapter
        
    Returns:
        LLMAdapter instance
        
    Example:
        >>> adapter = create_llm_adapter("mock", {"embedding_dim": 256})
        >>> embedding = adapter.generate_embedding("def foo(): pass")
    """
    if config is None:
        config = {}
    
    if provider == "mock":
        return MockLLMAdapter(embedding_dim=config.get("embedding_dim", 128))
    
    elif provider == "openai":
        return OpenAIAdapter(
            api_key=config.get("api_key"),
            model=config.get("model", "text-embedding-ada-002")
        )
    
    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")
