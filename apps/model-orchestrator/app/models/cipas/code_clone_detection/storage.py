from abc import ABC, abstractmethod
from pathlib import Path
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

from .config import settings
from .utils import get_logger

logger = get_logger(__name__)


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
        logger.info(f"Using local artifact storage at: {self._base_path.resolve()}")

    async def save(self, submission_id: str, content: bytes) -> None:
        file_path = self._base_path / submission_id
        with open(file_path, "wb") as f:
            f.write(content)
        logger.info(f"Saved artifact for submission {submission_id} to {file_path.resolve()}")

    async def load(self, submission_id: str) -> bytes:
        file_path = self._base_path / submission_id
        with open(file_path, "rb") as f:
            return f.read()


class S3ArtifactStorage(ArtifactStorage):
    """
    S3-compatible artifact storage.
    """

    def __init__(self):
        self.bucket_name = settings.S3_BUCKET_NAME
        logger.info(f"Initializing S3 artifact storage for bucket: {self.bucket_name}")
        self.s3_client = boto3.client(
            "s3",
            endpoint_url=settings.S3_ENDPOINT_URL,
            aws_access_key_id=settings.S3_ACCESS_KEY_ID,
            aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
            config=Config(signature_version="s3v4"),
        )
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
            logger.info(f"S3 bucket '{self.bucket_name}' already exists.")
        except ClientError as e:
            if e.response["Error"]["Code"] == "404":
                logger.info(f"S3 bucket '{self.bucket_name}' not found. Creating it.")
                self.s3_client.create_bucket(Bucket=self.bucket_name)
                logger.info(f"S3 bucket '{self.bucket_name}' created successfully.")
            else:
                logger.error(f"Error checking for S3 bucket: {e}")
                raise

    async def save(self, submission_id: str, content: bytes) -> None:
        self.s3_client.put_object(
            Bucket=self.bucket_name, Key=submission_id, Body=content
        )
        logger.info(f"Saved artifact for submission {submission_id} to S3 bucket '{self.bucket_name}'")

    async def load(self, submission_id: str) -> bytes:
        response = self.s3_client.get_object(Bucket=self.bucket_name, Key=submission_id)
        return response["Body"].read()


def get_storage() -> ArtifactStorage:
    """
    Factory for getting the artifact storage implementation based on settings.
    """
    if settings.STORAGE_TYPE == "s3":
        return S3ArtifactStorage()
    elif settings.STORAGE_TYPE == "local":
        return LocalArtifactStorage()
    else:
        raise ValueError(f"Unknown storage type: {settings.STORAGE_TYPE}")
