"""
LLM Client for Clone Generation

Provides a unified interface for LLM interactions across different providers.
This module implements a flexible architecture that supports multiple LLM backends
(mock, OpenAI, Anthropic, Hugging Face) through a common interface.

The LLMClient class:
- Reads configuration from models.yaml
- Selects appropriate backend based on provider setting
- Delegates operations to provider-specific implementations
- Provides common methods: summarize(), generate_from_summary(), verify_pair()

Architecture:
    LLMClient (facade) → Provider-specific implementations
    ├── MockLLMClient (imported from type3_backtranslate)
    ├── OpenAILLMClient (future)
    ├── AnthropicLLMClient (future)
    └── HuggingFaceLLMClient (future)

Usage:
    config = load_config()  # Load from models.yaml
    client = LLMClient(config)
    summary = client.summarize(code, "python")
    new_code = client.generate_from_summary(summary, "python")
    is_similar = client.verify_pair(code_a, code_b)
"""

import logging
from typing import Any, Optional

from .type3_backtranslate import BaseLLMClient, MockLLMClient

logger = logging.getLogger(__name__)


class LLMClient:
    """
    Unified LLM client with multi-provider support.
    
    This class provides a facade over different LLM provider implementations.
    It reads configuration to determine which backend to use and delegates
    all operations to the selected provider.
    
    The client supports:
    - Mock provider (for testing/development)
    - OpenAI (future implementation)
    - Anthropic (future implementation)
    - Hugging Face (future implementation)
    
    Configuration is read from models.yaml under the 'llm' section.
    
    Attributes:
        config: Configuration dictionary from models.yaml
        provider: Name of the LLM provider (mock, openai, anthropic, huggingface)
        backend: Actual LLM client instance (provider-specific)
    
    Examples:
        >>> config = {'llm': {'provider': 'mock', 'model_name': 'mock-local'}}
        >>> client = LLMClient(config)
        >>> summary = client.summarize("def add(a, b): return a + b", "python")
        >>> isinstance(summary, str)
        True
        >>> code = client.generate_from_summary(summary, "python")
        >>> len(code) > 0
        True
    """
    
    def __init__(self, config: dict[str, Any]):
        """
        Initialize LLM client with configuration.
        
        Args:
            config: Configuration dictionary, expected to have 'llm' section
                   with 'provider' and other provider-specific settings
        
        Raises:
            ValueError: If provider is not supported
            KeyError: If required configuration is missing
        """
        self.config = config
        
        # Extract LLM configuration
        llm_config = config.get('llm', {})
        self.provider = llm_config.get('provider', 'mock').lower()
        
        logger.info(f"Initializing LLMClient with provider: {self.provider}")
        
        # Initialize backend based on provider
        self.backend = self._create_backend(llm_config)
        
        logger.info(f"LLMClient initialized successfully with {self.provider} backend")
    
    def _create_backend(self, llm_config: dict[str, Any]) -> BaseLLMClient:
        """
        Factory method to create provider-specific backend.
        
        Args:
            llm_config: LLM configuration section from models.yaml
        
        Returns:
            Provider-specific LLM client instance
        
        Raises:
            ValueError: If provider is not supported
        """
        if self.provider == 'mock':
            return MockLLMClient(llm_config)
        
        elif self.provider == 'openai':
            # Future implementation
            logger.warning("OpenAI provider not yet implemented, falling back to mock")
            return MockLLMClient(llm_config)
            # from .providers.openai_client import OpenAILLMClient
            # return OpenAILLMClient(llm_config)
        
        elif self.provider == 'anthropic':
            # Future implementation
            logger.warning("Anthropic provider not yet implemented, falling back to mock")
            return MockLLMClient(llm_config)
            # from .providers.anthropic_client import AnthropicLLMClient
            # return AnthropicLLMClient(llm_config)
        
        elif self.provider == 'huggingface':
            # Future implementation
            logger.warning("Hugging Face provider not yet implemented, falling back to mock")
            return MockLLMClient(llm_config)
            # from .providers.huggingface_client import HuggingFaceLLMClient
            # return HuggingFaceLLMClient(llm_config)
        
        elif self.provider == 'ollama':
            from .ollama_client import OllamaLLMClient
            return OllamaLLMClient(llm_config)
        
        else:
            raise ValueError(
                f"Unsupported LLM provider: {self.provider}. "
                f"Supported providers: mock, openai, anthropic, huggingface, ollama"
            )
    
    def summarize(self, code: str, lang: str) -> str:
        """
        Generate a high-level summary of code functionality.
        
        Analyzes the provided code and produces a natural language summary
        describing what the code does. This is useful for the back-translation
        approach to Type-3 clone generation.
        
        Args:
            code: Source code to summarize
            lang: Programming language (e.g., 'python', 'java')
        
        Returns:
            Natural language summary of code functionality
        
        Examples:
            >>> client = LLMClient({'llm': {'provider': 'mock'}})
            >>> code = "def factorial(n):\\n    return 1 if n <= 1 else n * factorial(n-1)"
            >>> summary = client.summarize(code, "python")
            >>> "function" in summary.lower() or "factorial" in summary.lower()
            True
        """
        logger.debug(f"Summarizing {lang} code ({len(code)} chars)")
        summary = self.backend.summarize(code, lang)
        logger.debug(f"Generated summary: {summary[:100]}...")
        return summary
    
    def generate_from_summary(self, summary: str, lang: str) -> str:
        """
        Generate new code from a functional summary.
        
        Takes a natural language description and generates source code that
        implements the described functionality. This creates structural variants
        while preserving semantic similarity.
        
        Args:
            summary: Natural language description of desired functionality
            lang: Target programming language (e.g., 'python', 'java')
        
        Returns:
            Generated source code implementing the summary
        
        Examples:
            >>> client = LLMClient({'llm': {'provider': 'mock'}})
            >>> summary = "A function that computes the sum of two numbers"
            >>> code = client.generate_from_summary(summary, "python")
            >>> len(code) > 0
            True
        """
        logger.debug(f"Generating {lang} code from summary: {summary[:100]}...")
        generated_code = self.backend.generate_from_summary(summary, lang)
        logger.debug(f"Generated code ({len(generated_code)} chars)")
        return generated_code
    
    def verify_pair(
        self,
        code_a: str,
        code_b: str,
        lang: Optional[str] = None
    ) -> bool:
        """
        Verify if two code snippets are semantically similar clones.
        
        Uses LLM to analyze whether two code snippets implement similar
        functionality, even if structurally different. This is useful for
        validating generated clones or detecting existing clones.
        
        The verification process:
        1. Summarize both code snippets
        2. Compare summaries for semantic similarity
        3. Return True if similar, False otherwise
        
        Args:
            code_a: First code snippet
            code_b: Second code snippet
            lang: Programming language (optional, auto-detected if possible)
        
        Returns:
            True if code snippets are semantically similar, False otherwise
        
        Notes:
            Mock implementation uses simple heuristics. Real LLM providers
            will use more sophisticated semantic analysis.
        
        Examples:
            >>> client = LLMClient({'llm': {'provider': 'mock'}})
            >>> code1 = "def add(a, b): return a + b"
            >>> code2 = "def sum_two(x, y): return x + y"
            >>> # Mock verification based on simple heuristics
            >>> isinstance(client.verify_pair(code1, code2, "python"), bool)
            True
        """
        logger.debug(f"Verifying code pair (lang: {lang or 'auto'})")
        
        # Detect language if not provided
        if lang is None:
            lang = self._detect_language(code_a, code_b)
            logger.debug(f"Auto-detected language: {lang}")
        
        # Generate summaries for both code snippets
        summary_a = self.summarize(code_a, lang)
        summary_b = self.summarize(code_b, lang)
        
        # Compare summaries
        similarity = self._compare_summaries(summary_a, summary_b)
        
        logger.debug(f"Pair verification result: {similarity}")
        return similarity
    
    def _detect_language(self, code_a: str, code_b: str) -> str:
        """
        Attempt to detect programming language from code snippets.
        
        Uses simple heuristics to detect language. For production use,
        consider using a proper language detection library.
        
        Args:
            code_a: First code snippet
            code_b: Second code snippet
        
        Returns:
            Detected language name (defaults to 'unknown')
        """
        combined = (code_a + "\n" + code_b).lower()
        
        # Simple heuristic detection
        if 'def ' in combined and ':' in combined:
            return 'python'
        elif 'public class' in combined or 'private ' in combined:
            return 'java'
        elif 'function ' in combined and ('{' in combined or '=>' in combined):
            return 'javascript'
        elif 'fn ' in combined and '->' in combined:
            return 'rust'
        
        logger.warning("Could not detect language, using 'unknown'")
        return 'unknown'
    
    def _compare_summaries(self, summary_a: str, summary_b: str) -> bool:
        """
        Compare two summaries for semantic similarity.
        
        Mock implementation uses simple token overlap. Real LLM providers
        would use embeddings or LLM-based comparison.
        
        Args:
            summary_a: First summary
            summary_b: Second summary
        
        Returns:
            True if summaries are similar, False otherwise
        """
        # Simple token-based comparison for mock
        tokens_a = set(summary_a.lower().split())
        tokens_b = set(summary_b.lower().split())
        
        # Calculate Jaccard similarity
        intersection = tokens_a & tokens_b
        union = tokens_a | tokens_b
        
        if not union:
            return False
        
        similarity = len(intersection) / len(union)
        threshold = 0.3  # Configurable threshold
        
        logger.debug(f"Summary similarity: {similarity:.2f} (threshold: {threshold})")
        return similarity >= threshold
    
    def get_provider_info(self) -> dict[str, Any]:
        """
        Get information about the current provider configuration.
        
        Returns:
            Dictionary with provider name, model, and settings
        """
        return {
            'provider': self.provider,
            'model_name': self.config.get('llm', {}).get('model_name', 'unknown'),
            'backend_type': type(self.backend).__name__,
            'config': self.config.get('llm', {})
        }
