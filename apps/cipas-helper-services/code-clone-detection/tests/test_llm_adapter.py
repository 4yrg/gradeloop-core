"""
Unit tests for LLM adapters.
"""

import pytest

from src.llm_adapter import MockLLMAdapter, create_llm_adapter


def test_mock_llm_adapter():
    """Test MockLLMAdapter."""
    adapter = MockLLMAdapter(embedding_dim=64)
    
    # Test single embedding
    text = "def foo(): pass"
    embedding = adapter.generate_embedding(text)
    
    assert len(embedding) == 64
    assert all(isinstance(x, float) for x in embedding)
    
    # Test deterministic behavior
    embedding2 = adapter.generate_embedding(text)
    assert embedding == embedding2


def test_mock_llm_batch():
    """Test batch embedding generation."""
    adapter = MockLLMAdapter(embedding_dim=32)
    
    texts = ["def foo(): pass", "def bar(): return 42", "class Test: pass"]
    embeddings = adapter.generate_embeddings_batch(texts)
    
    assert len(embeddings) == 3
    assert all(len(emb) == 32 for emb in embeddings)


def test_mock_semantic_similarity():
    """Test mock semantic similarity."""
    adapter = MockLLMAdapter()
    
    text1 = "def foo(): pass"
    text2 = "def foo(): return"
    
    similarity = adapter.compute_semantic_similarity(text1, text2)
    
    assert 0 <= similarity <= 1
    # Similar length texts should have high similarity
    assert similarity > 0.8


def test_create_llm_adapter():
    """Test LLM adapter factory."""
    adapter = create_llm_adapter("mock", {"embedding_dim": 128})
    
    assert isinstance(adapter, MockLLMAdapter)
    embedding = adapter.generate_embedding("test")
    assert len(embedding) == 128


def test_create_llm_adapter_invalid():
    """Test invalid provider."""
    with pytest.raises(ValueError):
        create_llm_adapter("invalid_provider")
