import asyncio
from dataclasses import dataclass
from pathlib import Path
from typing import AsyncIterator, List, Optional
import typer
import aiofiles
from anyio import Path as AsyncPath
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

# This is a long relative import path. It assumes the script is run as a module.
# You might need to adjust PYTHONPATH if running it as a standalone script.
from ..db import AsyncSessionLocal
from ..models import Submission
from ..storage import get_storage
from ..utils import get_logger

logger = get_logger(__name__)
app = typer.Typer()

# Define the local path where CodeNet dataset is expected
LOCAL_CODENET_ROOT = "D:/Projects/SLIIT/Research/Datasets/Project_CodeNet"

# Filter languages
LANGUAGES_TO_INGEST = {"Java", "C++", "C", "Go", "Python", "JavaScript"}
LANGUAGE_EXTENSIONS = {
    ".java": "Java",
    ".cpp": "C++",
    ".c": "C",
    ".go": "Go",
    ".py": "Python",
    ".js": "JavaScript",
}


@dataclass
class SubmissionMeta:
    """
    Metadata for a single CodeNet submission.
    - problem_id: The ID of the problem the submission is for.
    - language: The programming language of the submission.
    - status: The submission status (e.g., 'Accepted', 'Wrong Answer').
    - file_path: The absolute path to the submission file.
    """
    problem_id: str
    language: str
    status: str
    file_path: Path


async def scan_submissions(root_dir: Path) -> AsyncIterator[SubmissionMeta]:
    """Scans the CodeNet directory structure to find submissions."""
    if not root_dir.exists():
        logger.error(f"Root directory for CodeNet does not exist: {root_dir}")
        return

    logger.info(f"Scanning for submissions in {root_dir}...")
    
    # Using Path.rglob for async-friendly directory traversal with anyio.Path
    async for file_path in AsyncPath(root_dir).rglob("*"):
        if file_path.is_file() and file_path.suffix in LANGUAGE_EXTENSIONS:
            language_from_ext = LANGUAGE_EXTENSIONS[file_path.suffix]

            try:
                # Expected structure: {root_dir}/{problem_id}/{language_dir}/{filename}
                # Example: D:/Projects/SLIIT/Research/Datasets/Project_CodeNet/p00001/Python/s12345.py
                
                # Get the parent directories relative to the root_dir
                relative_to_root = file_path.relative_to(root_dir)
                parts = relative_to_root.parts

                if len(parts) >= 3: # Expecting at least problem_id/language_dir/filename
                    problem_id = parts[0]
                    language_dir = parts[1] # e.g., 'Python', 'Java', 'C++'

                    # Check if the language from the directory matches our expected languages
                    # and if it corresponds to the file extension's language
                    if (language_from_ext in LANGUAGES_TO_INGEST) and \
                       (language_from_ext == language_dir or language_dir == "Python"): # CodeNet uses 'Python' for Python
                        
                        yield SubmissionMeta(
                            problem_id=problem_id,
                            language=language_from_ext,
                            status="Unknown",  # Status not available directly from path in this assumed structure
                            file_path=Path(file_path),
                        )
            except (ValueError, IndexError) as e:
                logger.warning(f"Skipping {file_path} due to parsing error: {e}")
                continue


async def store_submission(submission_meta: SubmissionMeta, db: AsyncSession) -> Optional[Submission]:
    """Stores a submission's content in the artifact store and its metadata in the DB."""
    storage = get_storage()
    
    # Using a hash of the file path for artifact URI to ensure uniqueness and handle long paths
    # A more robust solution might use a hash of the file content
    artifact_uri = f"codenet/{submission_meta.problem_id}/{submission_meta.language}/{submission_meta.file_path.name}"

    # Check if this has already been ingested to prevent duplicates
    result = await db.execute(select(Submission).where(Submission.artifact_uri == artifact_uri))
    existing_submission = result.scalars().first()
    if existing_submission:
        logger.debug(f"Submission {submission_meta.file_path.name} already ingested.")
        return None

    # Read content asynchronously
    async with aiofiles.open(submission_meta.file_path, "rb") as f:
        content = await f.read()

    # Save content to artifact store
    await storage.save(artifact_uri, content)

    # Store metadata in the database
    db_submission = Submission(
        problem_id=submission_meta.problem_id,
        language=submission_meta.language,
        status=submission_meta.status,
        artifact_uri=artifact_uri,
    )
    db.add(db_submission)
    return db_submission


@app.command()
def scan(
    root_dir: Path = typer.Option(
        LOCAL_CODENET_ROOT,
        help="The root directory of the extracted CodeNet dataset (e.g., D:/Projects/SLIIT/Research/Datasets/Project_CodeNet).",
    ),
):
    """Scans the dataset and prints submission metadata."""
    async def _scan():
        count = 0
        async for meta in scan_submissions(root_dir):
            logger.info(meta)
            count += 1
        logger.info(f"Found {count} submissions.")

    asyncio.run(_scan())


@app.command()
async def store(
    root_dir: Path = typer.Option(
        LOCAL_CODENET_ROOT,
        help="The root directory of the extracted CodeNet dataset (e.g., D:/Projects/SLIIT/Research/Datasets/Project_CodeNet).",
    ),
    limit: Optional[int] = typer.Option(None, help="Limit the number of submissions to ingest."),
    batch_size: int = typer.Option(100, help="Number of submissions to process before committing to DB."),
):
    """Scans the dataset and stores submissions in the database and artifact store."""
    db: AsyncSession = AsyncSessionLocal()
    try:
        count = 0
        ingested_count = 0
        processed_in_batch = 0

        async for meta in scan_submissions(root_dir):
            if meta.language in LANGUAGES_TO_INGEST:
                submission = await store_submission(meta, db)
                if submission:
                    ingested_count += 1
                    logger.info(f"Ingested: {meta.file_path.name} (Problem: {meta.problem_id}, Lang: {meta.language})")
                
                count += 1
                processed_in_batch += 1

                if processed_in_batch >= batch_size:
                    await db.commit()
                    logger.info(f"Committed {processed_in_batch} submissions to DB. Total ingested: {ingested_count}")
                    processed_in_batch = 0
                
                if limit and count >= limit:
                    break
        
        # Commit any remaining submissions in the last batch
        if processed_in_batch > 0:
            await db.commit()
            logger.info(f"Committed final {processed_in_batch} submissions to DB. Total ingested: {ingested_count}")

        logger.info(f"Finished ingestion. Total unique submissions ingested: {ingested_count}.")
        logger.info(f"Total files scanned: {count}.")

    except Exception as e:
        await db.rollback()
        logger.error(f"An error occurred during ingestion, rolling back transaction: {e}")
        raise
    finally:
        await db.close()


if __name__ == "__main__":
    app()
