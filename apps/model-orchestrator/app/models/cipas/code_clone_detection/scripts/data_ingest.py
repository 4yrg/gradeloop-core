import asyncio
import tarfile
from dataclasses import dataclass
from pathlib import Path
from typing import AsyncIterator, List, Optional
import httpx
import typer
import aiofiles
from anyio import Path as AsyncPath
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

# This is a long relative import path. It assumes the script is run as a module.
# You might need to adjust PYTHONPATH if running it as a standalone script.
from ..db import get_db, AsyncSessionLocal
from ..models import Submission
from ..storage import get_storage

app = typer.Typer()

CODENET_URL = "https://dax-cdn.cdn.appdomain.cloud/dax-project-codenet/1.0.0/Project_CodeNet.tar.gz"
LANGUAGES = {"Java", "C++", "C", "Go", "Python", "JavaScript"}
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


async def download_codenet_subset(root_dir: Path, url: str) -> Path:
    """Downloads and extracts the CodeNet dataset."""
    root_dir.mkdir(exist_ok=True, parents=True)
    tar_path = root_dir / "Project_CodeNet.tar.gz"

    if tar_path.exists():
        print(f"Dataset already exists at {tar_path}")
    else:
        print(f"Downloading CodeNet dataset from {url}...")
        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream("GET", url) as response:
                response.raise_for_status()
                total_size = int(response.headers.get("content-length", 0))
                with open(tar_path, "wb") as f:
                    with typer.progressbar(length=total_size, label="Downloading") as progress:
                        async for chunk in response.aiter_bytes():
                            f.write(chunk)
                            progress.update(len(chunk))
        print("Download complete.")

    print("Extracting dataset...")
    with tarfile.open(tar_path, "r:gz") as tar:
        # Extracting can be slow, might be better to do it member by member if memory is a concern
        tar.extractall(path=root_dir)
    print("Extraction complete.")
    return root_dir / "Project_CodeNet"


async def scan_submissions(root_dir: Path) -> AsyncIterator[SubmissionMeta]:
    """Scans the CodeNet directory structure to find submissions."""
    data_path = AsyncPath(root_dir) / "data"
    print(f"Scanning for submissions in {data_path}...")

    async for file_path in data_path.rglob("*"):
        if file_path.is_file() and file_path.suffix in LANGUAGE_EXTENSIONS:
            language = LANGUAGE_EXTENSIONS[file_path.suffix]
            try:
                # Expected structure: .../data/{problem_id}/{language}/{status}/.../{filename}
                # This parsing is based on a potential structure and might need adjustment.
                parts = file_path.parts
                # Find the index of 'data' and parse from there
                data_index = parts.index('data')
                problem_id = parts[data_index + 1]
                # Assuming status is part of the path, e.g., .../Accepted/...
                status_part = next((p for p in parts if p in ["Accepted", "Wrong Answer", "Runtime Error"]), "Unknown")
                
                yield SubmissionMeta(
                    problem_id=problem_id,
                    language=language,
                    status=status_part,
                    file_path=Path(file_path),
                )
            except (ValueError, IndexError):
                # This file path doesn't match the expected structure, skip it.
                continue


async def store_submission(submission_meta: SubmissionMeta, db: AsyncSession) -> Submission:
    """Stores a submission's content in the artifact store and its metadata in the DB."""
    storage = get_storage()
    
    # Use file_path as a unique identifier for the artifact URI for now
    artifact_uri = str(submission_meta.file_path.as_posix())

    # Check if this has already been ingested
    result = await db.execute(select(Submission).where(Submission.artifact_uri == artifact_uri))
    if result.scalars().first():
        return None

    async with aiofiles.open(submission_meta.file_path, "rb") as f:
        content = await f.read()

    await storage.save(artifact_uri, content)

    db_submission = Submission(
        problem_id=submission_meta.problem_id,
        language=submission_meta.language,
        status=submission_meta.status,
        artifact_uri=artifact_uri,
    )
    db.add(db_submission)
    return db_submission


@app.command()
def download(
    root_dir: Path = typer.Option(
        "D:/Projects/SLIIT/Research/Datasets/Project_CodeNet",
        help="The directory to download and extract the dataset into.",
    ),
    url: str = typer.Option(CODENET_URL, help="URL for the CodeNet tarball."),
):
    """Downloads and extracts the CodeNet dataset."""
    asyncio.run(download_codenet_subset(root_dir, url))


@app.command()
def scan(
    root_dir: Path = typer.Option(
        "D:/Projects/SLIIT/Research/Datasets/Project_CodeNet/Project_CodeNet",
        help="The root directory of the extracted CodeNet dataset.",
    ),
):
    """Scans the dataset and prints submission metadata."""
    async def _scan():
        count = 0
        async for meta in scan_submissions(root_dir):
            print(meta)
            count += 1
        print(f"Found {count} submissions.")

    asyncio.run(_scan())


@app.command()
def store(
    root_dir: Path = typer.Option(
        "D:/Projects/SLIIT/Research/Datasets/Project_CodeNet/Project_CodeNet",
        help="The root directory of the extracted CodeNet dataset.",
    ),
    limit: int = typer.Option(None, help="Limit the number of submissions to ingest."),
):
    """Scans the dataset and stores submissions in the database and artifact store."""
    async def _store():
        db: AsyncSession = AsyncSessionLocal()
        try:
            count = 0
            ingested_count = 0
            async for meta in scan_submissions(root_dir):
                if meta.language in LANGUAGES:
                    submission = await store_submission(meta, db)
                    if submission:
                        ingested_count += 1
                        print(f"Stored: {meta.file_path.name}")
                    
                    count += 1
                    if limit and count >= limit:
                        break
            
            await db.commit()
            print(f"Successfully ingested {ingested_count} new submissions.")
        finally:
            await db.close()

    asyncio.run(_store())


if __name__ == "__main__":
    app()
