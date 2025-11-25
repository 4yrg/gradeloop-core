import pytest
from pathlib import Path
import asyncio

from ..scripts.data_ingest import scan_submissions, SubmissionMeta

@pytest.mark.anyio
async def test_scan_submissions(fs):
    """
    Test that scan_submissions correctly finds and parses submission metadata
    from a fake filesystem.
    """
    # 1. Create a fake directory structure mimicking CodeNet
    base_dir = Path("/fakedata/Project_CodeNet")
    submission_path = base_dir / "data" / "p00001" / "Python" / "Accepted" / "s12345.py"
    fs.create_file(submission_path, contents="print('hello')")
    
    # Create another file that should be ignored
    fs.create_file(base_dir / "data" / "p00001" / "Python" / "metadata.csv")

    # 2. Run the scanner
    results = []
    async for meta in scan_submissions(base_dir):
        results.append(meta)

    # 3. Assert the results
    assert len(results) == 1
    
    expected_meta = SubmissionMeta(
        problem_id="p00001",
        language="Python",
        status="Accepted",
        file_path=submission_path,
    )
    assert results[0] == expected_meta

@pytest.mark.anyio
async def test_scan_submissions_with_mixed_languages(fs):
    """
    Test that scan_submissions works with multiple languages and file types.
    """
    base_dir = Path("/fakedata/Project_CodeNet")
    
    # Create files for different languages
    fs.create_file(base_dir / "data" / "p00002" / "Java" / "Wrong Answer" / "Main.java")
    fs.create_file(base_dir / "data" / "p00003" / "C++" / "Accepted" / "solution.cpp")
    
    results = []
    async for meta in scan_submissions(base_dir):
        results.append(meta)

    assert len(results) == 2
    
    problem_ids = {res.problem_id for res in results}
    languages = {res.language for res in results}

    assert "p00002" in problem_ids
    assert "p00003" in problem_ids
    assert "Java" in languages
    assert "C++" in languages
