import uuid
from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
from ..db import Base


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    problem_id = Column(String, nullable=False, index=True)
    language = Column(String, nullable=False, index=True)
    status = Column(String, nullable=False)
    # This will point to the object in the artifact store (e.g., S3 key or local file path)
    artifact_uri = Column(String, nullable=False, unique=True)
