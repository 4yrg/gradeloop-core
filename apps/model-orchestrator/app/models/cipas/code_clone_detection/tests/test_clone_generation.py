# tests/test_clone_generation.py
import asyncio
from unittest.mock import MagicMock, AsyncMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Submission
from ..scripts.generate_syntactic_clones import generate_t1_pairs, generate_t2_pairs

# Mark all tests in this file as asyncio
pytestmark = pytest.mark.asyncio

# --- Mock Data ---

# T1: s1 and s2 are identical after normalization, s3 is different
T1_SUBMISSION_1 = Submission(id="uuid1", problem_id="p1", language="Python", artifact_uri="uri1")
T1_CODE_1 = "def f(x): return x + 1 # comment"

T1_SUBMISSION_2 = Submission(id="uuid2", problem_id="p1", language="Python", artifact_uri="uri2")
T1_CODE_2 = "def f(x): 
    return x+1"

T1_SUBMISSION_3 = Submission(id="uuid3", problem_id="p1", language="Python", artifact_uri="uri3")
T1_CODE_3 = "def g(y): return y * 2"

# T2: s4 and s5 are syntactically identical, s6 is different
T2_SUBMISSION_4 = Submission(id="uuid4", problem_id="p2", language="Python", artifact_uri="uri4")
T2_CODE_4 = "def add(a, b): return a + b"

T2_SUBMISSION_5 = Submission(id="uuid5", problem_id="p2", language="Python", artifact_uri="uri5")
T2_CODE_5 = "def subtract(x, y): return x + y" # Note: function name and vars are different, but structure is same

T2_SUBMISSION_6 = Submission(id="uuid6", problem_id="p2", language="Python", artifact_uri="uri6")
T2_CODE_6 = "def add(a, b): return a - b" # Different operation

MOCK_ARTIFACT_STORE = {
    "uri1": T1_CODE_1.encode("utf-8"),
    "uri2": T1_CODE_2.encode("utf-8"),
    "uri3": T1_CODE_3.encode("utf-8"),
    "uri4": T2_CODE_4.encode("utf-8"),
    "uri5": T2_CODE_5.encode("utf-8"),
    "uri6": T2_CODE_6.encode("utf-8"),
}

# --- Mocks and Fixtures ---

@pytest.fixture
def mock_db_session():
    """Fixture to create a mock SQLAlchemy async session."""
    session = AsyncMock(spec=AsyncSession)
    
    # Mock the execute method to return a MagicMock that has a scalars method
    execute_result = MagicMock()
    session.execute.return_value = execute_result
    
    return session, execute_result.scalars

@pytest.fixture
def mock_storage(mocker):
    """Fixture to mock the artifact storage."""
    mock_storage_instance = MagicMock()
    
    async def mock_load(uri):
        return MOCK_ARTIFACT_STORE.get(uri, b"")
        
    mock_storage_instance.load = AsyncMock(side_effect=mock_load)
    mocker.patch(
        "gradeloop-core.apps.model-orchestrator.app.models.cipas.code_clone_detection.scripts.generate_syntactic_clones.get_storage",
        return_value=mock_storage_instance
    )
    return mock_storage_instance


# --- Tests ---

async def test_generate_t1_pairs(mock_db_session, mock_storage):
    """
    Verify that Type-1 clone pairs are correctly identified.
    """
    session, scalars_mock = mock_db_session
    # Configure the mock to return our test submissions
    submissions = [T1_SUBMISSION_1, T1_SUBMISSION_2, T1_SUBMISSION_3]
    scalars_mock.return_value.all.return_value = submissions
    
    # Run the pair generation
    pairs = await generate_t1_pairs(session, languages=["Python"], problem_id="p1")
    
    # Assertions
    assert len(pairs) == 1
    pair = pairs[0]
    
    assert pair.clone_type == "T1"
    assert pair.problem_id == "p1"
    # Ensure the pair contains the correct two submission IDs
    assert {pair.submission_id_1, pair.submission_id_2} == {"uuid1", "uuid2"}
    assert "uuid3" not in {pair.submission_id_1, pair.submission_id_2}

async def test_generate_t2_pairs(mock_db_session, mock_storage):
    """
    Verify that Type-2 clone pairs are correctly identified.
    """
    session, scalars_mock = mock_db_session
    submissions = [T2_SUBMISSION_4, T2_SUBMISSION_5, T2_SUBMISSION_6]
    scalars_mock.return_value.all.return_value = submissions
    
    pairs = await generate_t2_pairs(session, languages=["Python"], problem_id="p2")
    
    assert len(pairs) == 1
    pair = pairs[0]
    
    assert pair.clone_type == "T2"
    assert pair.problem_id == "p2"
    assert {pair.submission_id_1, pair.submission_id_2} == {"uuid4", "uuid5"}
    assert "uuid6" not in {pair.submission_id_1, pair.submission_id_2}
