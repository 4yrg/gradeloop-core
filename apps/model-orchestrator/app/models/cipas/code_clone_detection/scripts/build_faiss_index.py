# scripts/build_faiss_index.py
import asyncio
import json
import os
import pickle
from pathlib import Path
from typing import List, Literal, Optional, Tuple

import faiss
import numpy as np
import typer
import torch
from sqlalchemy import select

from ..db import AsyncSessionLocal
from ..models import Submission
from ..storage import get_storage
from ..utils import get_logger

logger = get_logger(__name__)
app = typer.Typer()

EMBEDDINGS_DIR = Path(__file__).parent.parent / "artifacts" / "embeddings"
FAISS_INDEX_PATH = EMBEDDINGS_DIR / "faiss_index.bin"
SID_MAP_PATH = EMBEDDINGS_DIR / "sid_map.pkl"


async def _get_embedding_data_from_db(
    limit: Optional[int] = None,
) -> Tuple[np.ndarray, List[str]]:
    """
    Fetches all submission code, computes embeddings, and returns a concatenated
    numpy array of embeddings and a list of corresponding submission IDs.
    This function relies on an already trained model to compute embeddings,
    but for this script, we'll assume embeddings are pre-computed and stored.
    """
    # For this script, we assume embeddings are already generated and saved.
    # If not, this function would need to load the model and compute them.
    # This function is currently a placeholder for loading pre-saved embeddings.

    embeddings_files = sorted(list(EMBEDDINGS_DIR.glob("*.npy")))
    sids_files = sorted(list(EMBEDDINGS_DIR.glob("*.json")))

    if not embeddings_files or not sids_files:
        logger.error(f"No .npy or .json files found in {EMBEDDINGS_DIR}. Please run training script first to save embeddings.")
        return np.array([]), []

    all_embeddings = []
    all_sids = []

    for emb_file, sid_file in zip(embeddings_files, sids_files):
        try:
            current_embeddings = np.load(emb_file)
            with open(sid_file, "r") as f:
                current_sids = json.load(f)
            
            # Ensure dimensions match
            if current_embeddings.shape[0] != len(current_sids):
                logger.warning(f"Embedding count mismatch in {emb_file} and {sid_file}. Skipping.")
                continue
            
            all_embeddings.append(current_embeddings)
            all_sids.extend(current_sids)

            if limit and len(all_sids) >= limit:
                break
        except Exception as e:
            logger.error(f"Error loading {emb_file} or {sid_file}: {e}")

    if not all_embeddings:
        return np.array([]), []

    concatenated_embeddings = np.vstack(all_embeddings)
    
    if limit:
        concatenated_embeddings = concatenated_embeddings[:limit]
        all_sids = all_sids[:limit]

    logger.info(f"Loaded {len(all_sids)} embeddings with dimension {concatenated_embeddings.shape[1]}.")
    return concatenated_embeddings, all_sids


def _save_index(index: faiss.Index, sids: List[str], index_path: Path, sid_map_path: Path):
    """Saves the FAISS index and the submission ID mapping."""
    index_path.parent.mkdir(parents=True, exist_ok=True)
    faiss.write_index(index, str(index_path))
    with open(sid_map_path, "wb") as f:
        pickle.dump(sids, f)
    logger.info(f"FAISS index saved to {index_path}")
    logger.info(f"Submission ID map saved to {sid_map_path}")


def _load_index(index_path: Path, sid_map_path: Path) -> Tuple[faiss.Index, List[str]]:
    """Loads the FAISS index and the submission ID mapping."""
    index = faiss.read_index(str(index_path))
    with open(sid_map_path, "rb") as f:
        sids = pickle.load(f)
    logger.info(f"FAISS index loaded from {index_path}")
    logger.info(f"Submission ID map loaded from {sid_map_path}")
    return index, sids


@app.command()
def build(
    index_path: Path = typer.Option(FAISS_INDEX_PATH, help="Path to save the FAISS index."),
    sid_map_path: Path = typer.Option(SID_MAP_PATH, help="Path to save the submission ID map."),
    index_type: Literal["flat", "ivf"] = typer.Option("flat", help="Type of FAISS index to build."),
    nlist: int = typer.Option(100, help="Number of Voronoi cells for IVF index."),
    metric: Literal["l2", "ip"] = typer.Option("ip", help="Distance metric (L2 or Inner Product)."),
    overwrite: bool = typer.Option(False, help="Overwrite existing index and map if they exist."),
    limit: Optional[int] = typer.Option(None, help="Limit the number of embeddings to load and index."),
):
    """Builds a new FAISS index from embeddings in the artifacts/embeddings directory."""
    async def _build():
        if index_path.exists() and not overwrite:
            logger.error(f"Index already exists at {index_path}. Use --overwrite to replace.")
            raise typer.Exit(code=1)

        embeddings, sids = await _get_embedding_data_from_db(limit=limit)
        if embeddings.size == 0:
            logger.error("No embeddings to build index from. Exiting.")
            raise typer.Exit(code=1)

        dimension = embeddings.shape[1]
        
        if metric == "l2":
            faiss_metric = faiss.METRIC_L2
        else:
            faiss_metric = faiss.METRIC_INNER_PRODUCT # Default

        if index_type == "flat":
            index = faiss.IndexFlat(dimension, faiss_metric)
            logger.info("Building Flat FAISS index...")
        elif index_type == "ivf":
            quantizer = faiss.IndexFlat(dimension, faiss_metric)
            index = faiss.IndexIVFFlat(quantizer, dimension, nlist, faiss_metric)
            logger.info(f"Training IVF FAISS index with nlist={nlist}...")
            index.train(embeddings)
        else:
            logger.error(f"Unknown index type: {index_type}")
            raise typer.Exit(code=1)

        index.add(embeddings)
        _save_index(index, sids, index_path, sid_map_path)
        logger.info("FAISS index built successfully.")

    asyncio.run(_build())


@app.command()
def add(
    new_embeddings_file: Path = typer.Argument(..., help="Path to a .npy file with new embeddings to add."),
    new_sids_file: Path = typer.Argument(..., help="Path to a .json file with corresponding submission IDs."),
    index_path: Path = typer.Option(FAISS_INDEX_PATH, help="Path to the existing FAISS index."),
    sid_map_path: Path = typer.Option(SID_MAP_PATH, help="Path to the existing submission ID map."),
):
    """Adds new embeddings to an existing FAISS index."""
    if not index_path.exists() or not sid_map_path.exists():
        logger.error("Existing index or SID map not found. Please build an index first.")
        raise typer.Exit(code=1)
    if not new_embeddings_file.exists() or not new_sids_file.exists():
        logger.error("New embeddings or SIDs file not found.")
        raise typer.Exit(code=1)

    index, existing_sids = _load_index(index_path, sid_map_path)
    new_embeddings = np.load(new_embeddings_file)
    with open(new_sids_file, "r") as f:
        new_sids = json.load(f)

    if new_embeddings.shape[0] != len(new_sids):
        logger.error("Count mismatch between new embeddings and SIDs.")
        raise typer.Exit(code=1)

    index.add(new_embeddings)
    updated_sids = existing_sids + new_sids
    _save_index(index, updated_sids, index_path, sid_map_path)
    logger.info(f"Added {new_embeddings.shape[0]} new embeddings. Index now has {index.ntotal} items.")


@app.command()
def rebuild(
    index_path: Path = typer.Option(FAISS_INDEX_PATH, help="Path to save the FAISS index."),
    sid_map_path: Path = typer.Option(SID_MAP_PATH, help="Path to save the submission ID map."),
    index_type: Literal["flat", "ivf"] = typer.Option("flat", help="Type of FAISS index to build."),
    nlist: int = typer.Option(100, help="Number of Voronoi cells for IVF index."),
    metric: Literal["l2", "ip"] = typer.Option("ip", help="Distance metric (L2 or Inner Product)."),
    limit: Optional[int] = typer.Option(None, help="Limit the number of embeddings to load and index."),
):
    """Rebuilds the FAISS index from scratch, useful for updating or changing index type."""
    # This just calls build with overwrite=True
    build(
        index_path=index_path,
        sid_map_path=sid_map_path,
        index_type=index_type,
        nlist=nlist,
        metric=metric,
        overwrite=True,
        limit=limit,
    )


if __name__ == "__main__":
    app()
