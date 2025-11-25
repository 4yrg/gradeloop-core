# scripts/eval_metrics.py
import asyncio
import csv
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Set, Tuple

import numpy as np
import pandas as pd
import typer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import AsyncSessionLocal
from ..models import Submission
from ..services.inference_service import InferenceService
from ..utils import get_logger

logger = get_logger(__name__)
app = typer.Typer()
ARTIFACTS_DIR = Path(__file__).parent.parent / "artifacts"
EVAL_REPORTS_DIR = ARTIFACTS_DIR / "eval_reports"
LOCAL_CODENET_ROOT = "D:/Projects/SLIIT/Research/Datasets/Project_CodeNet" # For CodeNet query data


# --- Metrics Functions ---

def average_precision(retrieved_list: List[str], ground_truth_set: Set[str]) -> float:
    """
    Computes Average Precision for a single query.
    
    Args:
        retrieved_list: Ordered list of retrieved submission IDs.
        ground_truth_set: Set of relevant submission IDs.
        
    Returns:
        Average Precision score.
    """
    if not ground_truth_set:
        return 0.0

    sum_precisions = 0.0
    num_relevant_found = 0
    for i, item_id in enumerate(retrieved_list):
        if item_id in ground_truth_set:
            num_relevant_found += 1
            precision_at_i = num_relevant_found / (i + 1)
            sum_precisions += precision_at_i
            
    if num_relevant_found == 0:
        return 0.0
    return sum_precisions / len(ground_truth_set)


def mean_average_precision(retrieved: List[List[str]], ground_truth: List[Set[str]]) -> float:
    """
    Computes Mean Average Precision (MAP).
    
    Args:
        retrieved: List of lists, where each inner list is an ordered list of retrieved IDs for a query.
        ground_truth: List of sets, where each inner set contains relevant IDs for a query.
        
    Returns:
        MAP score.
    """
    if len(retrieved) != len(ground_truth):
        raise ValueError("Lengths of retrieved and ground_truth lists must be equal.")
    
    aps = [average_precision(r, g) for r, g in zip(retrieved, ground_truth)]
    return np.mean(aps).item() if aps else 0.0


def recall_at_k(retrieved: List[List[str]], ground_truth: List[Set[str]], k: int) -> float:
    """
    Computes Recall@k.
    
    Args:
        retrieved: List of lists, where each inner list is an ordered list of retrieved IDs for a query.
        ground_truth: List of sets, where each inner set contains relevant IDs for a query.
        k: The number of top results to consider.
        
    Returns:
        Recall@k score.
    """
    if len(retrieved) != len(ground_truth):
        raise ValueError("Lengths of retrieved and ground_truth lists must be equal.")
    
    recalls = []
    for r, g in zip(retrieved, ground_truth):
        if not g: # If no ground truth, recall is 1 if nothing is retrieved, 0 otherwise (or skip)
            # Following common practice, if there are no relevant items, AP/Recall is 0.
            recalls.append(0.0)
            continue

        retrieved_at_k = set(r[:k])
        num_relevant_at_k = len(retrieved_at_k.intersection(g))
        recalls.append(num_relevant_at_k / len(g))
        
    return np.mean(recalls).item() if recalls else 0.0


# --- Data Loading / Evaluation Routines ---

async def _load_codenet_eval_data(
    t4_pairs_csv: Path,
    limit_queries: Optional[int] = None,
) -> Tuple[List[str], List[Set[str]], List[str]]:
    """
    Loads CodeNet data for evaluation. Uses T4 pairs to define queries and ground truth.
    
    Returns:
        (query_codes, ground_truth_sets, query_sids)
        - query_codes: List of code strings for the queries.
        - ground_truth_sets: List of sets of relevant submission IDs for each query.
        - query_sids: List of submission IDs corresponding to the query_codes.
    """
    if not t4_pairs_csv.exists():
        logger.error(f"T4 pairs CSV not found at {t4_pairs_csv}.")
        return [], [], []

    df = pd.read_csv(t4_pairs_csv)
    
    # Map submission IDs to their ground truth clones
    ground_truth_map = defaultdict(set)
    # Also keep track of all unique SIDs that could be queries or targets
    all_sids_in_t4 = set()

    for _, row in df.iterrows():
        sid1 = row["submission_id_1"]
        sid2 = row["submission_id_2"]
        ground_truth_map[sid1].add(sid2)
        ground_truth_map[sid2].add(sid1) # Clones are symmetric
        all_sids_in_t4.add(sid1)
        all_sids_in_t4.add(sid2)
    
    # Fetch code for all relevant submissions
    db = AsyncSessionLocal()
    storage = get_storage()
    submission_codes: Dict[str, str] = {}
    
    try:
        # Fetch submission details from DB
        submissions_db_result = await db.execute(select(Submission).where(Submission.id.in_(list(all_sids_in_t4))))
        submissions_db = {sub.id: sub for sub in submissions_db_result.scalars().all()}
        
        async def fetch_one_code(sid, sub_data: Submission):
            try:
                code_bytes = await storage.load(sub_data.artifact_uri)
                submission_codes[sid] = code_bytes.decode("utf-8")
            except Exception as e:
                logger.warning(f"Could not load code for SID {sid}: {e}")
        
        tasks = [fetch_one_code(sid, submissions_db[sid]) for sid in all_sids_in_t4 if sid in submissions_db]
        await asyncio.gather(*tasks)

    finally:
        await db.close()

    # Prepare queries and ground truth sets
    query_codes: List[str] = []
    ground_truth_sets: List[Set[str]] = []
    query_sids: List[str] = []

    for sid in sorted(list(ground_truth_map.keys())): # Sort for reproducibility
        if sid in submission_codes:
            query_codes.append(submission_codes[sid])
            # Ensure the query itself is not in its ground truth set (it shouldn't be for semantic clones)
            gt_for_sid = ground_truth_map[sid].copy()
            gt_for_sid.discard(sid)
            ground_truth_sets.append(gt_for_sid)
            query_sids.append(sid)
        
        if limit_queries and len(query_codes) >= limit_queries:
            break
            
    logger.info(f"Loaded {len(query_codes)} queries from CodeNet T4 pairs.")
    return query_codes, ground_truth_sets, query_sids


async def _run_evaluation(
    dataset_name: str,
    model_checkpoint_path: Path,
    faiss_index_path: Path,
    sid_map_path: Path,
    k_retrieval: int,
    limit_queries: Optional[int] = None,
    t4_pairs_csv: Path = ARTIFACTS_DIR / "t4_validated_pairs.csv",
) -> Dict[str, Any]:
    """Orchestrates the evaluation process."""
    inference_service = InferenceService(
        checkpoint_path=model_checkpoint_path,
        faiss_index_path=faiss_index_path,
        sid_map_path=sid_map_path,
    )
    
    if not inference_service.model or not inference_service.faiss_index:
        logger.error("InferenceService could not be initialized. Check model/index paths.")
        raise typer.Exit(code=1)

    query_codes: List[str] = []
    ground_truth_sets: List[Set[str]] = []
    query_sids: List[str] = []

    if dataset_name == "codenet":
        query_codes, ground_truth_sets, query_sids = await _load_codenet_eval_data(t4_pairs_csv, limit_queries)
    elif dataset_name == "bigclonebench":
        logger.warning("BigCloneBench evaluation not fully implemented yet. Placeholder.")
        # Load BigCloneBench data (queries, candidates, ground truth)
        # For a full implementation, this would parse a specific BigCloneBench format.
        # For now, we'll return empty.
        pass
    elif dataset_name == "codexglue":
        logger.warning("CodeXGLUE evaluation not fully implemented yet. Placeholder.")
        # Load CodeXGLUE data
        pass
    else:
        logger.error(f"Unknown dataset: {dataset_name}")
        raise typer.Exit(code=1)

    if not query_codes:
        logger.warning("No queries loaded for evaluation.")
        return {"metrics": {}, "notes": "No queries loaded."}

    # Perform retrieval for all queries
    retrieved_results: List[List[str]] = []
    
    async def retrieve_one_query(code: str):
        return await inference_service.retrieve(code, k=k_retrieval)

    # Concurrently retrieve for all queries
    retrieval_tasks = [retrieve_one_query(code) for code in query_codes]
    all_retrieved_pairs = await asyncio.gather(*retrieval_tasks)
    
    for query_idx, retrieved_pair_list in enumerate(all_retrieved_pairs):
        current_retrieved_ids = [sid for sid, score in retrieved_pair_list]
        retrieved_results.append(current_retrieved_ids)
        
        # Log specific query results if needed for debugging
        logger.debug(f"Query {query_sids[query_idx]}: Retrieved {current_retrieved_ids[:5]}, GT: {ground_truth_sets[query_idx]}")

    # Compute metrics
    map_score = mean_average_precision(retrieved_results, ground_truth_sets)
    recall_5 = recall_at_k(retrieved_results, ground_truth_sets, k=5)
    recall_10 = recall_at_k(retrieved_results, ground_truth_sets, k=10)
    
    metrics = {
        "dataset": dataset_name,
        "num_queries": len(query_codes),
        "k_retrieval": k_retrieval,
        "mean_average_precision": map_score,
        "recall@5": recall_5,
        "recall@10": recall_10,
        "model_checkpoint": str(model_checkpoint_path),
        "faiss_index": str(faiss_index_path),
        "timestamp": datetime.now().isoformat(),
    }
    logger.info(f"Evaluation Metrics: {metrics}")
    return metrics


@app.command()
def evaluate(
    dataset: str = typer.Argument("codenet", help="Dataset to evaluate on (codenet, bigclonebench, codexglue)."),
    model_checkpoint: Path = typer.Option(
        EMBEDDINGS_DIR / "final_model",
        help="Path to the trained model checkpoint (e.g., artifacts/embeddings/final_model)."
    ),
    faiss_index: Path = typer.Option(
        ARTIFACTS_DIR / "embeddings" / "faiss_index.bin",
        help="Path to the FAISS index file."
    ),
    sid_map: Path = typer.Option(
        ARTIFACTS_DIR / "embeddings" / "sid_map.pkl",
        help="Path to the submission ID map file."
    ),
    k: int = typer.Option(10, help="Number of top results to retrieve for Recall@k calculation."),
    limit_queries: Optional[int] = typer.Option(None, help="Limit the number of queries to run evaluation on."),
    output_dir: Path = typer.Option(EVAL_REPORTS_DIR, help="Directory to save the JSON report."),
):
    """
    Evaluates the code clone detection system using specified metrics.
    """
    async def _main_evaluate():
        EVAL_REPORTS_DIR.mkdir(parents=True, exist_ok=True)
        report = await _run_evaluation(
            dataset_name=dataset,
            model_checkpoint_path=model_checkpoint,
            faiss_index_path=faiss_index,
            sid_map_path=sid_map,
            k_retrieval=k,
            limit_queries=limit_queries,
        )
        
        if report:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            report_filename = output_dir / f"eval_report_{dataset}_{timestamp}.json"
            with open(report_filename, "w", encoding="utf-8") as f:
                json.dump(report, f, indent=2)
            logger.info(f"Evaluation report saved to {report_filename}")

    asyncio.run(_main_evaluate())


if __name__ == "__main__":
    app()
