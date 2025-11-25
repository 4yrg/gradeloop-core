# tests/test_execution_validation.py
import pytest
from pathlib import Path

from ..scripts.execute_validation import validate_pair, SubmissionInfo, run_in_sandbox

# Mark all tests in this file as asyncio
pytestmark = pytest.mark.asyncio

# --- Fixture for fake filesystem ---

@pytest.fixture
def fake_fs_for_validation(fs):
    """Create a fake filesystem with submissions and testcases."""
    # Submission A: Correctly adds two numbers
    script_a_path = Path("/project/subs/sub_a.py")
    fs.create_file(script_a_path, contents="""
import sys
try:
    a = int(sys.stdin.readline())
    b = int(sys.stdin.readline())
    print(a + b)
except (IOError, ValueError):
    print("Invalid input")
""")

    # Submission B: Also correctly adds two numbers (should be a clone)
    script_b_path = Path("/project/subs/sub_b.py")
    fs.create_file(script_b_path, contents="""
import sys
x = int(sys.stdin.readline())
y = int(sys.stdin.readline())
print(x + y)
""")

    # Submission C: Incorrectly multiplies instead of adding
    script_c_path = Path("/project/subs/sub_c.py")
    fs.create_file(script_c_path, contents="""
import sys
a = int(sys.stdin.readline())
b = int(sys.stdin.readline())
print(a * b)
""")
    
    # Testcases for the problem
    testcases_dir = Path("/project/testcases/p00001/input")
    fs.create_dir(testcases_dir)
    fs.create_file(testcases_dir / "test1.in", contents="2\n3\n")
    fs.create_file(testcases_dir / "test2.in", contents="10\n5\n")
    
    return {
        "sub_a": SubmissionInfo(id="a", source_path=script_a_path, language="Python"),
        "sub_b": SubmissionInfo(id="b", source_path=script_b_path, language="Python"),
        "sub_c": SubmissionInfo(id="c", source_path=script_c_path, language="Python"),
        "testcases_dir": testcases_dir,
    }

# --- Tests ---

async def test_run_in_sandbox_with_python(fake_fs_for_validation):
    """Test that a simple Python script can be executed correctly."""
    sub_info = fake_fs_for_validation["sub_a"]
    input_bytes = b"5\n7\n"
    
    result = await run_in_sandbox(sub_info.source_path, sub_info.language, input_bytes)
    
    assert result.exit_code == 0
    assert result.stdout.strip() == b"12"
    assert not result.timed_out

async def test_validate_pair_succeeds_for_identical_behavior(fake_fs_for_validation):
    """
    Tests that validate_pair returns True for two submissions that produce
    the same output for all testcases.
    """
    subs = fake_fs_for_validation
    
    # Pair (A, B) should be semantically equivalent
    is_valid = await validate_pair(subs["sub_a"], subs["sub_b"], subs["testcases_dir"])
    
    assert is_valid is True

async def test_validate_pair_fails_for_different_behavior(fake_fs_for_validation):
    """
    Tests that validate_pair returns False for two submissions that produce
    different outputs.
    """
    subs = fake_fs_for_validation
    
    # Pair (A, C) should NOT be semantically equivalent
    is_valid = await validate_pair(subs["sub_a"], subs["sub_c"], subs["testcases_dir"])
    
    assert is_valid is False

async def test_validate_pair_fails_if_no_testcases(fake_fs_for_validation):
    """
    Tests that validation returns False if the testcase directory is empty or missing.
    """
    subs = fake_fs_for_validation
    empty_dir = Path("/project/testcases/p00002/input")
    empty_dir.mkdir(parents=True, exist_ok=True)
    
    is_valid = await validate_pair(subs["sub_a"], subs["sub_b"], empty_dir)
    assert is_valid is False
    
    is_valid_missing = await validate_pair(subs["sub_a"], subs["sub_b"], Path("/nonexistent/dir"))
    assert is_valid_missing is False
