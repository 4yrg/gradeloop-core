# scripts/generate_structural_clones.py
import asyncio
import csv
from dataclasses import dataclass, fields
from pathlib import Path
from typing import Dict, List, Literal

import typer
import numpy as np
from tree_sitter import Tree

from ..db import AsyncSessionLocal, Submission
from ..parsers.tree_sitter_wrapper import parse_code
from ..storage import get_storage
from ..utils import get_logger

logger = get_logger(__name__)
app = typer.Typer()
ARTIFACTS_DIR = Path(__file__).parent.parent / "artifacts"

SimilarityMethod = Literal["jaccard", "tree_edit"]

@dataclass
class T3PairRecord:
    """Represents a pair of submissions classified as a Type-3 clone."""
    submission_id_1: str
    submission_id_2: str
    problem_id: str
    language: str
    clone_type: str  # Will be 'T3'
    similarity_score: float


def _get_ast_node_counts(tree: Tree) -> Dict[str, int]:
    """Traverses an AST and returns a frequency map of node types."""
    counts = {}
    if not tree:
        return counts

    cursor = tree.walk()
    visited_children = False
    while True:
        if not visited_children:
            node_type = cursor.node.type
            counts[node_type] = counts.get(node_type, 0) + 1
            if not cursor.goto_first_child():
                visited_children = True
        else:
            if not cursor.goto_next_sibling():
                if not cursor.goto_parent():
                    break
                visited_children = True
            else:
                visited_children = False
    return counts


def _jaccard_similarity(counts1: Dict[str, int], counts2: Dict[str, int]) -> float:
    """Calculates Jaccard similarity between two node frequency maps."""
    all_keys = set(counts1.keys()) | set(counts2.keys())
    
    intersection_sum = sum(min(counts1.get(k, 0), counts2.get(k, 0)) for k in all_keys)
    union_sum = sum(max(counts1.get(k, 0), counts2.get(k, 0)) for k in all_keys)
    
    return intersection_sum / union_sum if union_sum > 0 else 0.0


def _tree_edit_distance_placeholder(tree1: Tree, tree2: Tree) -> float:
    """Placeholder for a proper tree edit distance implementation."""
    logger.warning("Tree edit distance is not implemented. Returning 0.0.")
    # A real implementation (e.g., with libraries like zss) would go here.
    return 0.0


async def ast_similarity(
    code_a: str,
    code_b: str,
    lang: str,
    method: SimilarityMethod = "jaccard",
) -> float:
    """
    Computes the structural similarity between two code snippets based on their ASTs.
    """
    lang = lang.lower()
    
    # Concurrently parse both code snippets
    tree_a, tree_b = await asyncio.gather(
        parse_code(code_a, lang),
        parse_code(code_b, lang)
    )

    if not tree_a or not tree_b:
        logger.error("Could not parse one or both code snippets. Returning 0.0 similarity.")
        return 0.0

    if method == "jaccard":
        counts_a = _get_ast_node_counts(tree_a)
        counts_b = _get_ast_node_counts(tree_b)
        return _jaccard_similarity(counts_a, counts_b)
    elif method == "tree_edit":
        return _tree_edit_distance_placeholder(tree_a, tree_b)
    else:
        raise ValueError(f"Unknown similarity method: {method}")


@app.command()
def find_t3(
    t4_pairs_csv: Path = typer.Argument(..., help="CSV file of validated T4 pairs."),
    output_csv: Path = typer.Option(ARTIFACTS_DIR / "t3_pairs.csv", help="Path to save T3 pairs."),
    min_threshold: float = typer.Option(0.5, help="Minimum similarity score for a T3 clone."),
    max_threshold: float = typer.Option(0.9, help="Maximum similarity score for a T3 clone."),
    concurrency: int = typer.Option(4, help="Number of pairs to process concurrently."),
):
    """
    Analyzes semantically equivalent pairs (T4) to find structurally
    similar but not identical pairs (T3).
    """
    async def _run():
        if not t4_pairs_csv.exists():
            logger.error(f"Input T4 pairs CSV not found: {t4_pairs_csv}")
            return
            
        storage = get_storage()
        t3_pairs = []
        
        # Read pairs from the input CSV
        with open(t4_pairs_csv, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            t4_pairs = list(reader)

        logger.info(f"Loaded {len(t4_pairs)} T4 pairs for analysis.")

        sem = asyncio.Semaphore(concurrency)

        async def process_pair(pair_row):
            async with sem:
                sub_id_1 = pair_row["submission_id_1"]
                sub_id_2 = pair_row["submission_id_2"]
                lang = pair_row["language"]
                
                try:
                    # Fetch code from artifact store
                    code_a_bytes, code_b_bytes = await asyncio.gather(
                        storage.load(sub_id_1),
                        storage.load(sub_id_2)
                    )
                    code_a = code_a_bytes.decode("utf-8")
                    code_b = code_b_bytes.decode("utf-8")

                    # Calculate similarity
                    score = await ast_similarity(code_a, code_b, lang, method="jaccard")

                    # Classify as T3
                    if min_threshold <= score < max_threshold:
                        t3_pairs.append(T3PairRecord(
                            submission_id_1=sub_id_1,
                            submission_id_2=sub_id_2,
                            problem_id=pair_row["problem_id"],
                            language=lang,
                            clone_type="T3",
                            similarity_score=round(score, 4),
                        ))
                        logger.info(f"Pair ({sub_id_1}, {sub_id_2}) classified as T3 with score {score:.4f}")

                except Exception as e:
                    logger.error(f"Failed to process pair ({sub_id_1}, {sub_id_2}): {e}")

        tasks = [process_pair(p) for p in t4_pairs]
        await asyncio.gather(*tasks)

        # --- Write results ---
        if t3_pairs:
            logger.info(f"Found {len(t3_pairs)} structural (Type-3) clone pairs.")
            ARTIFACTS_DIR.mkdir(exist_ok=True)
            with open(output_csv, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                header = [field.name for field in fields(T3PairRecord)]
                writer.writerow(header)
                for pair in t3_pairs:
                    writer.writerow([
                        pair.submission_id_1, pair.submission_id_2, pair.problem_id,
                        pair.language, pair.clone_type, pair.similarity_score
                    ])
            logger.info(f"Wrote T3 pairs to {output_csv}")
        else:
            logger.info("No Type-3 pairs found within the given thresholds.")

    asyncio.run(_run())

if __name__ == "__main__":
    app()
