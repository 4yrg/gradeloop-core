# scripts/execute_validation.py
import asyncio
import csv
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional

import typer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import AsyncSessionLocal
from ..models import Submission
from ..utils import get_logger

logger = get_logger(__name__)
app = typer.Typer()
ARTIFACTS_DIR = Path(__file__).parent.parent / "artifacts"
# This should point to the root of the CodeNet dataset to find testcases
LOCAL_CODENET_ROOT = "D:/Projects/SLIIT/Research/Datasets/Project_CodeNet"


@dataclass
class CompletedRun:
    """Result of a single sandboxed execution."""
    stdout: bytes
    stderr: bytes
    exit_code: int
    timed_out: bool = False

@dataclass
class SubmissionInfo:
    """Wrapper for submission data needed for validation."""
    id: str
    source_path: Path
    language: str


async def run_in_sandbox(
    source_path: Path,
    lang: str,
    input_bytes: bytes,
    timeout: int = 10,
) -> CompletedRun:
    """
    Compiles (if necessary) and runs a source file in a temporary directory
    with a given input, subject to a timeout.

    WARNING: This is a basic sandbox. It does not provide strong security
    guarantees and should not be used in production. Resource limits are
    not enforced beyond a simple timeout.
    """
    lang = lang.lower()
    
    with tempfile.TemporaryDirectory() as temp_dir_str:
        temp_dir = Path(temp_dir_str)
        executable_path = ""
        compile_cmd = None
        
        # --- 1. Compilation Step ---
        if lang in ["c", "cpp", "go"]:
            executable_path = temp_dir / "a.out"
            ext = ".cpp" if lang == "cpp" else "." + lang
            source_file = temp_dir / ("source" + ext)
            source_file.write_bytes(source_path.read_bytes())
            
            if lang in ["c", "cpp"]:
                compile_cmd = f"g++ -O2 -std=c++17 {source_file} -o {executable_path}"
            elif lang == "go":
                compile_cmd = f"go build -o {executable_path} {source_file}"

        elif lang == "java":
            # For Java, we need to guess the main class name
            main_class_name = source_path.stem
            source_file = temp_dir / source_path.name
            source_file.write_bytes(source_path.read_bytes())
            compile_cmd = f"javac {source_file}"
        
        else: # Python, Javascript
             executable_path = source_path # No compilation needed

        if compile_cmd:
            try:
                proc = await asyncio.create_subprocess_shell(
                    compile_cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    cwd=temp_dir,
                )
                _, stderr = await asyncio.wait_for(proc.communicate(), timeout=30)
                if proc.returncode != 0:
                    return CompletedRun(b"", stderr, proc.returncode)
            except asyncio.TimeoutError:
                return CompletedRun(b"", b"Compilation timed out", -1, timed_out=True)
        
        # --- 2. Execution Step ---
        run_cmd = ""
        if lang in ["python"]:
            run_cmd = f"python {executable_path}"
        elif lang in ["javascript"]:
            run_cmd = f"node {executable_path}"
        elif lang == "java":
            run_cmd = f"java {main_class_name}"
        elif executable_path: # Compiled languages
            run_cmd = str(executable_path)

        if not run_cmd:
            return CompletedRun(b"", b"Unsupported language for execution", -1)

        try:
            proc = await asyncio.create_subprocess_shell(
                run_cmd,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=temp_dir,
            )
            stdout, stderr = await asyncio.wait_for(proc.communicate(input=input_bytes), timeout=timeout)
            return CompletedRun(stdout, stderr, proc.returncode)
        except asyncio.TimeoutError:
            proc.kill()
            return CompletedRun(b"", b"Execution timed out", -1, timed_out=True)
        except Exception as e:
            return CompletedRun(b"", str(e).encode(), -1)


async def validate_pair(
    sub_a: SubmissionInfo,
    sub_b: SubmissionInfo,
    testcases_dir: Path,
) -> bool:
    """
    Validates a pair of submissions against all testcases.
    Returns True if their outputs are identical for every testcase.
    """
    if not testcases_dir.exists():
        logger.warning(f"Test case directory not found: {testcases_dir}")
        return False
        
    input_files = sorted(list(testcases_dir.glob("*.in")))
    if not input_files:
        logger.warning(f"No input files (*.in) found in {testcases_dir}")
        return False

    for input_file in input_files:
        input_bytes = input_file.read_bytes()
        
        # Run both submissions concurrently
        results = await asyncio.gather(
            run_in_sandbox(sub_a.source_path, sub_a.language, input_bytes),
            run_in_sandbox(sub_b.source_path, sub_b.language, input_bytes),
        )
        run_a, run_b = results

        # Normalize outputs (ignore trailing whitespace/newlines)
        output_a = run_a.stdout.strip()
        output_b = run_b.stdout.strip()

        # Check for identical output and exit code
        if run_a.exit_code != run_b.exit_code or output_a != output_b:
            logger.debug(f"Mismatch for {input_file.name} between {sub_a.id} and {sub_b.id}. Exit codes: {run_a.exit_code} vs {run_b.exit_code}")
            return False
            
    logger.info(f"Pair ({sub_a.id}, {sub_b.id}) passed all {len(input_files)} testcases.")
    return True


@app.command()
def bulk_validate(
    problem_id: str = typer.Argument(..., help="The problem ID to validate (e.g., p00001)."),
    pairs_csv: Path = typer.Argument(..., help="CSV file containing clone pairs (e.g., t2_pairs.csv)."),
    output_csv: Path = typer.Option(ARTIFACTS_DIR / "t4_validated_pairs.csv", help="Path to save validated pairs."),
    dry_run: bool = typer.Option(False, help="Print pairs that would be validated without running them."),
    concurrency: int = typer.Option(4, help="Number of pairs to validate concurrently."),
):
    """
    Performs bulk semantic validation of clone pairs for a given problem.
    """
    async def _run():
        if not pairs_csv.exists():
            logger.error(f"Input pairs CSV not found: {pairs_csv}")
            return

        # --- Read pairs from CSV ---
        pairs_to_validate = []
        with open(pairs_csv, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get("problem_id") == problem_id:
                    pairs_to_validate.append(row)
        
        logger.info(f"Found {len(pairs_to_validate)} pairs for problem {problem_id} in {pairs_csv.name}.")
        
        if dry_run:
            for pair_row in pairs_to_validate:
                print(f"[Dry Run] Would validate pair: ({pair_row['submission_id_1']}, {pair_row['submission_id_2']})")
            return

        # --- Get submission info from DB ---
        db: AsyncSession = AsyncSessionLocal()
        validated_pairs = []
        try:
            # Create a semaphore to limit concurrency
            sem = asyncio.Semaphore(concurrency)
            
            async def process_pair(pair_row):
                async with sem:
                    sub_id_1 = pair_row["submission_id_1"]
                    sub_id_2 = pair_row["submission_id_2"]
                    
                    # Fetch submission details
                    sub1_db = (await db.execute(select(Submission).where(Submission.id == sub_id_1))).scalars().first()
                    sub2_db = (await db.execute(select(Submission).where(Submission.id == sub_id_2))).scalars().first()

                    if not sub1_db or not sub2_db:
                        logger.warning(f"Could not find one or both submissions in DB: {sub_id_1}, {sub_id_2}")
                        return

                    # The artifact_uri is the path to the source file in our previous script
                    sub_a = SubmissionInfo(id=sub_id_1, source_path=Path(sub1_db.artifact_uri), language=sub1_db.language)
                    sub_b = SubmissionInfo(id=sub_id_2, source_path=Path(sub2_db.artifact_uri), language=sub2_db.language)

                    testcases_dir = LOCAL_CODENET_ROOT / problem_id / "input"
                    
                    is_valid = await validate_pair(sub_a, sub_b, testcases_dir)
                    if is_valid:
                        validated_pairs.append(pair_row)
            
            tasks = [process_pair(p) for p in pairs_to_validate]
            await asyncio.gather(*tasks)

        finally:
            await db.close()

        # --- Write results ---
        if validated_pairs:
            logger.info(f"Found {len(validated_pairs)} semantically equivalent (Type-4) pairs.")
            # Custom CSV writing for dicts
            ARTIFACTS_DIR.mkdir(exist_ok=True)
            with open(output_csv, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=validated_pairs[0].keys())
                writer.writeheader()
                writer.writerows(validated_pairs)
            logger.info(f"Wrote validated pairs to {output_csv}")
        else:
            logger.info("No semantically equivalent pairs found.")

    asyncio.run(_run())

if __name__ == "__main__":
    app()
