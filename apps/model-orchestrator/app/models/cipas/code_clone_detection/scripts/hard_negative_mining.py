# scripts/hard_negative_mining.py
import asyncio
import csv
import json
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import faiss
import numpy as np
import pandas as pd
import typer
import torch
from pytorch_lightning import LightningModule
from transformers import AutoModel, AutoTokenizer

from ..db import AsyncSessionLocal
from ..models import Submission
from ..storage import get_storage
from ..utils import get_logger
from .train_encoder import ContrastiveEncoder, TrainingConfig # Import for model loading

logger = get_logger(__name__)
app = typer.Typer()
ARTIFACTS_DIR = Path(__file__).parent.parent / "artifacts"
EMBEDDINGS_DIR = ARTIFACTS_DIR / "embeddings"
HARD_NEGATIVES_CSV = ARTIFACTS_DIR / "hard_negatives.csv"


@dataclass
class HardNegativeTriplet:
    """Represents an (anchor, positive, hard_negative) triplet."""
    anchor_sid: str
    positive_sid: str
    hard_negative_sid: str


async def _get_all_submission_code(sids: List[str]) -> Dict[str, str]:
    """Fetches code for a list of submission IDs from the database and storage."""
    code_map: Dict[str, str] = {}
    db = AsyncSessionLocal()
    storage = get_storage()
    
    try:
        # Fetch submissions from DB
        submissions_db = (await db.execute(select(Submission).where(Submission.id.in_(sids)))).scalars().all()
        submission_artifact_map = {sub.id: sub.artifact_uri for sub in submissions_db}
        
        async def fetch_one_code(sid, artifact_uri):
            try:
                content_bytes = await storage.load(artifact_uri)
                code_map[sid] = content_bytes.decode("utf-8")
            except Exception as e:
                logger.error(f"Failed to load code for submission {sid} from {artifact_uri}: {e}")
        
        tasks = [fetch_one_code(sid, submission_artifact_map[sid]) for sid in sids if sid in submission_artifact_map]
        await asyncio.gather(*tasks)

    finally:
        await db.close()
    return code_map


async def compute_all_embeddings(
    model: AutoModel,
    tokenizer: AutoTokenizer,
    all_sids: List[str],
    all_code_map: Dict[str, str],
    config: TrainingConfig,
    device: torch.device,
) -> Tuple[np.ndarray, List[str]]:
    """Computes embeddings for all unique submissions."""
    model.eval()
    model.to(device)

    embeddings = []
    sids_in_order = []

    # Prepare batches
    batch_codes = []
    batch_sids = []

    for sid in all_sids:
        code = all_code_map.get(sid)
        if code:
            batch_codes.append(code)
            batch_sids.append(sid)
        
        if len(batch_codes) == config.batch_size:
            inputs = tokenizer(
                batch_codes,
                padding="max_length",
                truncation=True,
                max_length=config.max_length,
                return_tensors="pt",
            ).to(device)
            with torch.no_grad():
                outputs = model(**inputs)
                pooled_embeds = ContrastiveEncoder(config, tokenizer).pooler(outputs.last_hidden_state, inputs.attention_mask)
                embeddings.append(pooled_embeds.cpu().numpy())
            sids_in_order.extend(batch_sids)
            batch_codes = []
            batch_sids = []
    
    # Process any remaining batch
    if batch_codes:
        inputs = tokenizer(
            batch_codes,
            padding="max_length",
            truncation=True,
            max_length=config.max_length,
            return_tensors="pt",
        ).to(device)
        with torch.no_grad():
            outputs = model(**inputs)
            pooled_embeds = ContrastiveEncoder(config, tokenizer).pooler(outputs.last_hidden_state, inputs.attention_mask)
            embeddings.append(pooled_embeds.cpu().numpy())
        sids_in_order.extend(batch_sids)

    if not embeddings:
        return np.array([]), []

    return np.vstack(embeddings), sids_in_order


@app.command()
async def mine_hard_negatives(
    checkpoint_path: Path = typer.Argument(..., help="Path to the trained model checkpoint (e.g., artifacts/embeddings/final_model)."),
    t4_pairs_csv: Path = typer.Argument(..., help="CSV file containing validated T4 pairs (e.g., artifacts/t4_validated_pairs.csv)."),
    output_csv: Path = typer.Option(HARD_NEGATIVES_CSV, help="Path to save the hard negative triplets."),
    top_k: int = typer.Option(5, "--top-k", "-k", help="Number of hard negatives to find per anchor."),
    sample_limit: Optional[int] = typer.Option(None, help="Limit the number of T4 pairs to sample for mining."),
    batch_size: int = typer.Option(64, help="Batch size for embedding computation."),
    faiss_device: int = typer.Option(-1, help="-1 for CPU, >=0 for GPU index for FAISS."),
):
    """
    Performs offline hard negative mining using a trained encoder model and FAISS.
    """
    if not checkpoint_path.exists():
        logger.error(f"Model checkpoint not found: {checkpoint_path}")
        raise typer.Exit(code=1)
    if not t4_pairs_csv.exists():
        logger.error(f"T4 pairs CSV not found: {t4_pairs_csv}")
        raise typer.Exit(code=1)

    # Ensure output directory exists
    output_csv.parent.mkdir(parents=True, exist_ok=True)

    # 1. Load model and tokenizer
    logger.info(f"Loading model and tokenizer from {checkpoint_path}...")
    tokenizer = AutoTokenizer.from_pretrained(checkpoint_path)
    
    # Need to instantiate ContrastiveEncoder to get the pooling logic
    # For this, we need a dummy TrainingConfig
    config = TrainingConfig(model_name=str(checkpoint_path), batch_size=batch_size)
    model = ContrastiveEncoder(config, tokenizer) # This loads the AutoModel internally
    
    device = torch.device(f"cuda:{faiss_device}" if faiss_device >= 0 and torch.cuda.is_available() else "cpu")
    model.to(device)
    model.eval()
    logger.info(f"Model loaded onto {device}.")

    # 2. Load T4 pairs and identify all unique submission IDs
    logger.info(f"Loading T4 pairs from {t4_pairs_csv}...")
    t4_df = pd.read_csv(t4_pairs_csv)
    
    all_unique_sids = set(t4_df["submission_id_1"]).union(set(t4_df["submission_id_2"]))
    
    # Map of known positive pairs (sid -> set of sids it's a clone of)
    known_clones = defaultdict(set)
    for _, row in t4_df.iterrows():
        known_clones[row["submission_id_1"]].add(row["submission_id_2"])
        known_clones[row["submission_id_2"]].add(row["submission_id_1"])

    # 3. Compute embeddings for all unique submissions
    logger.info(f"Fetching code for {len(all_unique_sids)} unique submissions and computing embeddings...")
    all_code_map = await _get_all_submission_code(list(all_unique_sids))
    
    # Filter out sids for which code couldn't be loaded
    sids_with_code = [sid for sid in all_unique_sids if sid in all_code_map]
    if not sids_with_code:
        logger.error("No submission code could be loaded. Exiting.")
        raise typer.Exit(code=1)

    all_embeddings_np, sids_in_index_order = await compute_all_embeddings(
        model.model, tokenizer, sids_with_code, all_code_map, config, device
    )
    
    if all_embeddings_np.size == 0:
        logger.error("No embeddings computed. Exiting.")
        raise typer.Exit(code=1)

    # 4. Build FAISS index
    logger.info("Building FAISS index...")
    embedding_dim = all_embeddings_np.shape[1]
    
    if faiss_device >= 0 and torch.cuda.is_available():
        res = faiss.StandardGpuResources()
        index = faiss.IndexFlatL2Gpu(res, embedding_dim)
        logger.info(f"Using FAISS GPU index on device {faiss_device}.")
    else:
        index = faiss.IndexFlatL2(embedding_dim) # L2 distance
        logger.info("Using FAISS CPU index.")
        
    index.add(all_embeddings_np)
    
    sid_to_index = {sid: i for i, sid in enumerate(sids_in_index_order)}

    # 5. Mine hard negatives
    logger.info("Mining hard negatives...")
    hard_negative_triplets: List[HardNegativeTriplet] = []

    # Iterate through unique anchor-positive pairs from T4 data
    processed_pairs = set()
    for _, row in t4_df.iterrows():
        anchor_sid = row["submission_id_1"]
        positive_sid = row["submission_id_2"]

        # Ensure we process each pair direction only once (e.g., (A,B) not also (B,A))
        canonical_pair_key = tuple(sorted((anchor_sid, positive_sid)))
        if canonical_pair_key in processed_pairs:
            continue
        processed_pairs.add(canonical_pair_key)

        if anchor_sid not in sid_to_index or positive_sid not in sid_to_index:
            logger.warning(f"Anchor {anchor_sid} or Positive {positive_sid} not found in embeddings index. Skipping pair.")
            continue

        anchor_idx = sid_to_index[anchor_sid]
        
        # Query FAISS for nearest neighbors of the anchor
        # Ensure anchor_embed is 2D for FAISS search (1, embedding_dim)
        anchor_embed_query = all_embeddings_np[anchor_idx:anchor_idx+1]
        
        # Search more than top_k to allow for filtering out known clones
        D, I = index.search(anchor_embed_query, top_k * 10 + 2) # +2 for self and positive
        
        nearest_neighbor_indices = I[0]
        
        # Filter out known clones and collect top_k hard negatives
        found_hard_negatives_sids = []
        for neighbor_idx in nearest_neighbor_indices:
            candidate_sid = sids_in_index_order[neighbor_idx]
            
            # Skip if it's the anchor itself or the positive for this pair
            if candidate_sid == anchor_sid or candidate_sid == positive_sid:
                continue
            
            # Skip if it's a known clone of the anchor
            if candidate_sid in known_clones.get(anchor_sid, set()):
                continue
            
            found_hard_negatives_sids.append(candidate_sid)
            if len(found_hard_negatives_sids) >= top_k:
                break
        
        for hn_sid in found_hard_negatives_sids:
            hard_negative_triplets.append(HardNegativeTriplet(
                anchor_sid=anchor_sid,
                positive_sid=positive_sid,
                hard_negative_sid=hn_sid
            ))
        
        if sample_limit and len(hard_negative_triplets) >= sample_limit:
            logger.info(f"Reached sample limit of {sample_limit} hard negatives.")
            break

    # 6. Write results
    logger.info(f"Found {len(hard_negative_triplets)} hard negative triplets.")
    with open(output_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["anchor_sid", "positive_sid", "hard_negative_sid"])
        for triplet in hard_negative_triplets:
            writer.writerow([triplet.anchor_sid, triplet.positive_sid, triplet.hard_negative_sid])
    logger.info(f"Hard negative triplets saved to {output_csv}")


if __name__ == "__main__":
    app()
