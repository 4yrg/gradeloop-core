# scripts/generate_syntactic_clones.py
import asyncio
import csv
import hashlib
from collections import defaultdict
from dataclasses import dataclass, fields
from pathlib import Path
from typing import Dict, List, Optional

import typer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import AsyncSessionLocal
from ..models import Submission
from ..parsers.normalizers import (
    normalize_whitespace_and_format,
    strip_comments,
    ast_rename_identifiers,
)
from ..storage import get_storage
from ..utils import get_logger

logger = get_logger(__name__)
app = typer.Typer()
ARTIFACTS_DIR = Path(__file__).parent.parent / "artifacts"


@dataclass
class PairRecord:
    """Represents a pair of submissions that are clones."""
    submission_id_1: str
    submission_id_2: str
    problem_id: str
    language: str
    clone_type: str


async def _get_submissions(
    db: AsyncSession,
    languages: Optional[List[str]] = None,
    problem_id: Optional[str] = None,
) -> List[Submission]:
    """Fetches submissions from the database based on filter criteria."""
    query = select(Submission)
    if languages:
        query = query.where(Submission.language.in_(languages))
    if problem_id:
        query = query.where(Submission.problem_id == problem_id)
    
    result = await db.execute(query)
    return result.scalars().all()


async def _process_submissions(submissions: List[Submission], normalization_func) -> Dict[str, List[Submission]]:
    """Generic function to process submissions, apply normalization, and group by fingerprint."""
    storage = get_storage()
    fingerprints = defaultdict(list)

    async def _process_one(sub: Submission):
        try:
            code = (await storage.load(sub.artifact_uri)).decode("utf-8")
            normalized_code = await normalization_func(code, sub.language.lower())
            fingerprint = hashlib.sha256(normalized_code.encode("utf-8")).hexdigest()
            return fingerprint, sub
        except Exception as e:
            logger.error(f"Failed to process submission {sub.id} ({sub.artifact_uri}): {e}")
            return None, None

    tasks = [_process_one(sub) for sub in submissions]
    results = await asyncio.gather(*tasks)

    for fingerprint, sub in results:
        if fingerprint:
            fingerprints[fingerprint].append(sub)
    
    return fingerprints


def generate_t1_pairs(db: AsyncSession, languages: List[str], problem_id: Optional[str]) -> List[PairRecord]:
    """
    Generates Type-1 (exact text, ignoring comments/whitespace) clone pairs.
    """
    logger.info("Starting Type-1 clone detection...")
    submissions = await _get_submissions(db, languages, problem_id)

    async def t1_normalize(code: str, lang: str) -> str:
        formatted_code = await normalize_whitespace_and_format(code, lang)
        no_comments_code = await strip_comments(formatted_code, lang)
        # Final pass to remove empty lines and standardize line endings
        return "\n".join(line.strip() for line in no_comments_code.splitlines() if line.strip())

    fingerprints = await _process_submissions(submissions, t1_normalize)
    
    pairs = []
    for group in fingerprints.values():
        if len(group) > 1:
            for i in range(len(group)):
                for j in range(i + 1, len(group)):
                    sub1, sub2 = group[i], group[j]
                    pairs.append(PairRecord(
                        submission_id_1=str(sub1.id),
                        submission_id_2=str(sub2.id),
                        problem_id=sub1.problem_id,
                        language=sub1.language,
                        clone_type="T1",
                    ))
    logger.info(f"Found {len(pairs)} Type-1 clone pairs.")
    return pairs


def generate_t2_pairs(db: AsyncSession, languages: List[str], problem_id: Optional[str]) -> List[PairRecord]:
    """
    Generates Type-2 (syntactically identical) clone pairs.
    """
    logger.info("Starting Type-2 clone detection...")
    submissions = await _get_submissions(db, languages, problem_id)
    
    fingerprints = await _process_submissions(submissions, ast_rename_identifiers)

    pairs = []
    for group in fingerprints.values():
        if len(group) > 1:
            for i in range(len(group)):
                for j in range(i + 1, len(group)):
                    sub1, sub2 = group[i], group[j]
                    pairs.append(PairRecord(
                        submission_id_1=str(sub1.id),
                        submission_id_2=str(sub2.id),
                        problem_id=sub1.problem_id,
                        language=sub1.language,
                        clone_type="T2",
                    ))
    logger.info(f"Found {len(pairs)} Type-2 clone pairs.")
    return pairs

def _write_csv(output_path: Path, pairs: List[PairRecord]):
    """Writes a list of PairRecords to a CSV file."""
    if not pairs:
        logger.warning("No pairs found to write to CSV.")
        return
        
    ARTIFACTS_DIR.mkdir(exist_ok=True)
    
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        # Write header
        header = [field.name for field in fields(PairRecord)]
        writer.writerow(header)
        # Write rows
        for pair in pairs:
            writer.writerow([
                pair.submission_id_1,
                pair.submission_id_2,
                pair.problem_id,
                pair.language,
                pair.clone_type,
            ])
    logger.info(f"Successfully wrote {len(pairs)} pairs to {output_path}")


@app.command(name="t1")
def run_t1(
    languages: Optional[List[str]] = typer.Option(None, "--language", "-l", help="Filter by language."),
    problem_id: Optional[str] = typer.Option(None, "--problem", "-p", help="Filter by a specific problem ID."),
    output_path: Path = typer.Option(ARTIFACTS_DIR / "t1_pairs.csv", help="Path to save the output CSV."),
):
    """Find Type-1 (exact match) clones."""
    async def _run():
        db = AsyncSessionLocal()
        try:
            pairs = await generate_t1_pairs(db, languages, problem_id)
            _write_csv(output_path, pairs)
        finally:
            await db.close()

    asyncio.run(_run())


@app.command(name="t2")
def run_t2(
    languages: Optional[List[str]] = typer.Option(None, "--language", "-l", help="Filter by language."),
    problem_id: Optional[str] = typer.Option(None, "--problem", "-p", help="Filter by a specific problem ID."),
    output_path: Path = typer.Option(ARTIFACTS_DIR / "t2_pairs.csv", help="Path to save the output CSV."),
):
    """Find Type-2 (syntactically identical) clones."""
    async def _run():
        db = AsyncSessionLocal()
        try:
            pairs = await generate_t2_pairs(db, languages, problem_id)
            _write_csv(output_path, pairs)
        finally:
            await db.close()

    asyncio.run(_run())


if __name__ == "__main__":
    app()
