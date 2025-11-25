import pytest
from pathlib import Path
import asyncio

from ..scripts.data_ingest import scan_submissions, SubmissionMeta, LANGUAGE_EXTENSIONS

@pytest.mark.anyio
async def test_scan_submissions(fs):
    """
    Test that scan_submissions correctly finds and parses submission metadata
    from a fake filesystem.
    """
    # 1. Create a fake directory structure mimicking CodeNet
    base_dir = Path("/fakedata/Project_CodeNet")
    # Expected structure: {root_dir}/{problem_id}/{language_dir}/{filename}
    submission_path = base_dir / "p00001" / "Python" / "s12345.py"
    fs.create_file(submission_path, contents="print('hello')")
    
    # Create another file that should be ignored (wrong suffix)
    fs.create_file(base_dir / "p00001" / "Python" / "metadata.txt")
    # Create a file with an unexpected language dir name
    fs.create_file(base_dir / "p00002" / "UnknownLang" / "s999.xyz")

    # 2. Run the scanner
    results = []
    async for meta in scan_submissions(base_dir):
        results.append(meta)

    # 3. Assert the results
    assert len(results) == 1
    
    expected_meta = SubmissionMeta(
        problem_id="p00001",
        language=LANGUAGE_EXTENSIONS[".py"], # Should be Python from our map
        status="Unknown", # As per the updated script
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
    fs.create_file(base_dir / "p00002" / "Java" / "Main.java")
    fs.create_file(base_dir / "p00003" / "C++" / "solution.cpp")
    fs.create_file(base_dir / "p00004" / "Go" / "main.go")
    
    results = []
    async for meta in scan_submissions(base_dir):
        results.append(meta)

    assert len(results) == 3
    
    problem_ids = {res.problem_id for res in results}
    languages = {res.language for res in results}

    assert "p00002" in problem_ids
    assert "p00003" in problem_ids
    assert "p00004" in problem_ids
    assert LANGUAGE_EXTENSIONS[".java"] in languages
    assert LANGUAGE_EXTENSIONS[".cpp"] in languages
    assert LANGUAGE_EXTENSIONS[".go"] in languages
