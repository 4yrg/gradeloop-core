from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field

class Submission(SQLModel, table=True):
    id: Optional[str] = Field(default=None, primary_key=True) # using string ID to match plan "subm_..." or UUID
    student_id: str = Field(index=True)
    assignment_id: str = Field(index=True)
    code: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    # Metadata for caching/hashing could be added here or stored separately
    # For now, we keep it simple.
