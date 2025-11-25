from abc import ABC, abstractmethod
from pathlib import Path
from .config import settings


class ArtifactStorage(ABC):
    """
    Abstract base class for artifact storage.
    """

    @abstractmethod
    async def save(self, submission_id: str, content: bytes) -> None:
        """Saves a submission artifact."""
        pass

    @abstractmethod
    async def load(self, submission_id: str) -> bytes:
        """Loads a submission artifact."""
        pass


class LocalArtifactStorage(ArtifactStorage):
    """
    Local file system artifact storage.
    """

    def __init__(self, base_path: str = settings.ARTIFACT_STORE_URI):
        self._base_path = Path(base_path)
        self._base_path.mkdir(parents=True, exist_ok=True)

    async def save(self, submission_id: str, content: bytes) -> None:
        file_path = self._base_path / submission_id
        with open(file_path, "wb") as f:
            f.write(content)

    async def load(self, submission_id: str) -> bytes:
        file_path = self._base_path / submission_id
        with open(file_path, "rb") as f:
            return f.read()


def get_storage() -> ArtifactStorage:
    """
    Factory for getting the artifact storage implementation.
    """
    return LocalArtifactStorage()
