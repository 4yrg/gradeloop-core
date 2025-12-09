"""
Code fragment data models.

Defines data structures for code fragments and clone pairs.
"""

import hashlib
import logging
from dataclasses import dataclass, field
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


@dataclass
class CodeMetrics:
    """Code fragment metrics."""
    
    loc: int = 0  # Lines of code
    complexity: int = 0  # Cyclomatic complexity
    token_count: int = 0  # Number of tokens
    
    def to_dict(self) -> Dict[str, int]:
        """Convert to dictionary."""
        return {
            "loc": self.loc,
            "complexity": self.complexity,
            "token_count": self.token_count
        }


@dataclass
class CodeFragment:
    """
    Represents a code fragment for clone detection.
    
    Attributes:
        id: Unique identifier
        file_path: Source file path
        start_line: Starting line number
        end_line: Ending line number
        language: Programming language
        content: Raw code content
        tokens: List of tokens
        ast_hash: Hash of AST structure
        metrics: Code metrics
        embedding: Optional semantic embedding vector
    """
    
    file_path: str
    start_line: int
    end_line: int
    language: str
    content: str
    id: Optional[str] = None
    tokens: List[str] = field(default_factory=list)
    ast_hash: Optional[str] = None
    metrics: CodeMetrics = field(default_factory=CodeMetrics)
    embedding: Optional[List[float]] = None
    
    def __post_init__(self):
        """Generate ID if not provided."""
        if self.id is None:
            self.id = self._generate_id()
    
    def _generate_id(self) -> str:
        """Generate unique ID based on file path and line numbers."""
        id_string = f"{self.file_path}:{self.start_line}:{self.end_line}"
        return hashlib.md5(id_string.encode()).hexdigest()[:16]
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for serialization."""
        return {
            "id": self.id,
            "file_path": self.file_path,
            "start_line": self.start_line,
            "end_line": self.end_line,
            "language": self.language,
            "content": self.content,
            "tokens": self.tokens,
            "ast_hash": self.ast_hash,
            "metrics": self.metrics.to_dict(),
            "embedding": self.embedding
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> "CodeFragment":
        """Create instance from dictionary."""
        metrics_data = data.get("metrics", {})
        metrics = CodeMetrics(**metrics_data) if metrics_data else CodeMetrics()
        
        return cls(
            id=data.get("id"),
            file_path=data["file_path"],
            start_line=data["start_line"],
            end_line=data["end_line"],
            language=data["language"],
            content=data["content"],
            tokens=data.get("tokens", []),
            ast_hash=data.get("ast_hash"),
            metrics=metrics,
            embedding=data.get("embedding")
        )


@dataclass
class ClonePair:
    """
    Represents a pair of code clones.
    
    Attributes:
        fragment_1_id: ID of first fragment
        fragment_2_id: ID of second fragment
        clone_type: Type of clone (type1, type2, type3, type4)
        similarity_score: Overall similarity score (0-1)
        detection_method: Method used for detection
        metadata: Additional similarity metrics
    """
    
    fragment_1_id: str
    fragment_2_id: str
    clone_type: str
    similarity_score: float
    detection_method: str = "unknown"
    id: Optional[str] = None
    metadata: Dict[str, float] = field(default_factory=dict)
    
    def __post_init__(self):
        """Generate ID if not provided."""
        if self.id is None:
            self.id = self._generate_id()
    
    def _generate_id(self) -> str:
        """Generate unique ID for the clone pair."""
        # Sort IDs to ensure consistent pairing
        ids = sorted([self.fragment_1_id, self.fragment_2_id])
        id_string = f"{ids[0]}:{ids[1]}"
        return hashlib.md5(id_string.encode()).hexdigest()[:16]
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for serialization."""
        return {
            "id": self.id,
            "fragment_1_id": self.fragment_1_id,
            "fragment_2_id": self.fragment_2_id,
            "clone_type": self.clone_type,
            "similarity_score": self.similarity_score,
            "detection_method": self.detection_method,
            "metadata": self.metadata
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> "ClonePair":
        """Create instance from dictionary."""
        return cls(
            id=data.get("id"),
            fragment_1_id=data["fragment_1_id"],
            fragment_2_id=data["fragment_2_id"],
            clone_type=data["clone_type"],
            similarity_score=data["similarity_score"],
            detection_method=data.get("detection_method", "unknown"),
            metadata=data.get("metadata", {})
        )


def validate_fragment(fragment: CodeFragment) -> bool:
    """
    Validate code fragment data.
    
    Args:
        fragment: CodeFragment to validate
        
    Returns:
        True if valid
        
    Raises:
        ValueError: If validation fails
    """
    if fragment.start_line < 1:
        raise ValueError("start_line must be >= 1")
    
    if fragment.end_line < fragment.start_line:
        raise ValueError("end_line must be >= start_line")
    
    if not fragment.content:
        raise ValueError("content cannot be empty")
    
    if not fragment.file_path:
        raise ValueError("file_path cannot be empty")
    
    return True


def validate_clone_pair(pair: ClonePair) -> bool:
    """
    Validate clone pair data.
    
    Args:
        pair: ClonePair to validate
        
    Returns:
        True if valid
        
    Raises:
        ValueError: If validation fails
    """
    if not 0 <= pair.similarity_score <= 1:
        raise ValueError("similarity_score must be between 0 and 1")
    
    valid_types = ["type1", "type2", "type3", "type4"]
    if pair.clone_type not in valid_types:
        raise ValueError(f"clone_type must be one of {valid_types}")
    
    if pair.fragment_1_id == pair.fragment_2_id:
        raise ValueError("fragment IDs cannot be identical")
    
    return True
