# scripts/train_encoder.py
import asyncio
import csv
import json
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union

import faiss
import numpy as np
import pandas as pd
import pytorch_lightning as pl
import torch
from pytorch_lightning.callbacks import Callback
from pytorch_lightning.loggers import TensorBoardLogger
from torch.utils.data import DataLoader, Dataset
from transformers import AutoModel, AutoTokenizer, get_linear_schedule_with_warmup

from ..db import AsyncSessionLocal
from ..models import Submission
from ..storage import get_storage
from ..utils import get_logger

logger = get_logger(__name__)
app = typer.Typer()
ARTIFACTS_DIR = Path(__file__).parent.parent / "artifacts"
EMBEDDINGS_DIR = ARTIFACTS_DIR / "embeddings"


@dataclass
class TrainingConfig:
    """Configuration for the encoder training."""
    model_name: str = "Salesforce/codet5p-220m-bimodal"
    max_length: int = 256
    pooling_method: str = "mean"  # "cls", "mean", "first_token"
    
    lr: float = 2e-5
    epochs: int = 3
    batch_size: int = 16
    eval_batch_size: int = 32
    temperature: float = 0.07  # For InfoNCE loss
    
    gradient_accumulation_steps: int = 1
    mixed_precision: Union[str, None] = "16-mixed" # "bf16", "16-mixed", None
    
    t4_pairs_csv: Path = ARTIFACTS_DIR / "t4_validated_pairs.csv"
    negatives_json: Path = ARTIFACTS_DIR / "generated_negatives_p00001.json" # Example
    
    embeddings_output_dir: Path = EMBEDDINGS_DIR
    num_hard_negatives: int = 5 # Number of hard negatives to use per anchor
    
    # Paths for hard negative mining
    hn_mining_eval_dataset_size: int = 1000 # Max number of samples to use for HN mining eval
    hn_mine_every_n_epochs: int = 1
    
    # Device for FAISS (if available)
    faiss_device: int = -1 # -1 for CPU, >=0 for GPU index


class ContrastiveDataset(Dataset):
    """
    Dataset for contrastive learning.
    Yields (anchor_input, positive_input, negatives_input_list).
    """
    def __init__(
        self,
        t4_pairs_csv: Path,
        negatives_json: Path,
        tokenizer: AutoTokenizer,
        max_length: int,
        num_hard_negatives: int = 5,
        hn_cache: Optional[Dict[str, List[str]]] = None # Hard negative cache
    ):
        self.tokenizer = tokenizer
        self.max_length = max_length
        self.num_hard_negatives = num_hard_negatives
        self.hn_cache = hn_cache if hn_cache is not None else {}
        self.submission_contents: Dict[str, str] = {} # sid -> code string
        self.anchor_positive_pairs: List[Tuple[str, str]] = [] # (anchor_sid, positive_sid)
        
        # Load all available submission content (code)
        # This is simplified; in a real app, content might be fetched on demand.
        self._load_submission_content_from_csv(t4_pairs_csv)
        
        # Load initial negative examples
        self.initial_negatives: Dict[str, List[str]] = defaultdict(list) # problem_id -> list of code strings
        if negatives_json.exists():
            try:
                with open(negatives_json, "r", encoding="utf-8") as f:
                    problem_negatives = json.load(f)
                    # Assuming negatives_json stores a list of negative code for a problem_id
                    # Need to infer problem_id for this file name
                    problem_id = negatives_json.stem.replace("generated_negatives_", "")
                    self.initial_negatives[problem_id].extend(problem_negatives)
            except json.JSONDecodeError:
                logger.warning(f"Could not load negatives from {negatives_json}. Skipping.")

        # Build anchor-positive pairs from T4 CSV
        self._build_pairs_from_t4_csv(t4_pairs_csv)
        
        logger.info(f"Loaded {len(self.anchor_positive_pairs)} anchor-positive pairs.")

    def _load_submission_content_from_csv(self, t4_pairs_csv: Path):
        """Loads all unique submission contents referenced in T4 pairs from the DB."""
        unique_sids = set()
        if not t4_pairs_csv.exists():
            logger.warning(f"T4 pairs CSV not found at {t4_pairs_csv}. No anchor-positive pairs will be loaded.")
            return

        with open(t4_pairs_csv, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                unique_sids.add(row["submission_id_1"])
                unique_sids.add(row["submission_id_2"])
        
        async def fetch_contents():
            db_session = AsyncSessionLocal()
            storage = get_storage()
            try:
                for sid in unique_sids:
                    submission_db = (await db_session.execute(select(Submission).where(Submission.id == sid))).scalars().first()
                    if submission_db:
                        code_bytes = await storage.load(submission_db.artifact_uri)
                        self.submission_contents[sid] = code_bytes.decode("utf-8")
            finally:
                await db_session.close()

        asyncio.run(fetch_contents())
        logger.info(f"Loaded content for {len(self.submission_contents)} unique submissions.")

    def _build_pairs_from_t4_csv(self, t4_pairs_csv: Path):
        """Reads T4 pairs and creates anchor-positive pairs."""
        if not t4_pairs_csv.exists():
            return

        with open(t4_pairs_csv, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Add both (s1, s2) and (s2, s1) as anchor-positive pairs
                self.anchor_positive_pairs.append((row["submission_id_1"], row["submission_id_2"]))
                self.anchor_positive_pairs.append((row["submission_id_2"], row["submission_id_1"]))


    def _tokenize_code(self, code: str) -> Dict[str, torch.Tensor]:
        """Tokenizes code using the dataset's tokenizer."""
        return self.tokenizer(
            code,
            padding="max_length",
            truncation=True,
            max_length=self.max_length,
            return_tensors="pt",
        )

    def _get_negatives(self, anchor_sid: str, problem_id: str, current_positive_sid: str) -> List[str]:
        """Gets negative samples, prioritizing hard negatives from cache."""
        negatives = []

        # 1. Hard negatives from cache
        if anchor_sid in self.hn_cache:
            negatives.extend(self.hn_cache[anchor_sid])
        
        # 2. Randomly sample from initial negatives (if any) to fill up
        initial_problem_negatives = [
            n for n in self.initial_negatives.get(problem_id, [])
            if n != self.submission_contents.get(anchor_sid) and n != self.submission_contents.get(current_positive_sid)
        ]
        
        # Avoid duplicates and ensure enough negatives
        while len(negatives) < self.num_hard_negatives and initial_problem_negatives:
            # Simple random choice, could be more sophisticated
            neg_code = initial_problem_negatives.pop(np.random.randint(len(initial_problem_negatives)))
            if neg_code not in negatives:
                negatives.append(neg_code)

        # Pad with empty string if not enough negatives
        while len(negatives) < self.num_hard_negatives:
            negatives.append("") 
            
        return negatives[:self.num_hard_negatives]

    def __len__(self) -> int:
        return len(self.anchor_positive_pairs)

    def __getitem__(self, idx: int) -> Dict[str, torch.Tensor]:
        anchor_sid, positive_sid = self.anchor_positive_pairs[idx]
        
        # Get actual code strings
        anchor_code = self.submission_contents.get(anchor_sid, "")
        positive_code = self.submission_contents.get(positive_sid, "")
        
        # Infer problem_id (assuming submissions have problem_id metadata somewhere)
        # This needs to be more robust. For now, assume a single problem_id in the T4 file.
        # Or, pass problem_id as part of the pair.
        problem_id_for_negatives = t4_pairs_csv.stem.split("_")[-1] # Simplistic problem_id extraction

        negatives_code = self._get_negatives(anchor_sid, problem_id_for_negatives, positive_sid)
        
        # Tokenize everything
        anchor_inputs = self._tokenize_code(anchor_code)
        positive_inputs = self._tokenize_code(positive_code)
        negative_inputs_list = [self._tokenize_code(neg_code) for neg_code in negatives_code]

        # Stack input_ids and attention_mask for negatives
        negative_input_ids = torch.cat([x['input_ids'] for x in negative_inputs_list], dim=0)
        negative_attention_mask = torch.cat([x['attention_mask'] for x in negative_inputs_list], dim=0)

        return {
            "anchor_input_ids": anchor_inputs['input_ids'].squeeze(0),
            "anchor_attention_mask": anchor_inputs['attention_mask'].squeeze(0),
            "positive_input_ids": positive_inputs['input_ids'].squeeze(0),
            "positive_attention_mask": positive_inputs['attention_mask'].squeeze(0),
            "negative_input_ids": negative_input_ids,
            "negative_attention_mask": negative_attention_mask,
        }


class ContrastiveEncoder(pl.LightningModule):
    """
    PyTorch Lightning module for contrastive fine-tuning of a HuggingFace encoder.
    """
    def __init__(self, config: TrainingConfig, tokenizer: AutoTokenizer):
        super().__init__()
        self.config = config
        self.tokenizer = tokenizer
        self.save_hyperparameters(config.__dict__) # Save config to hparams
        
        self.model = AutoModel.from_pretrained(config.model_name)
        
        # We need a way to pool token embeddings into a single vector
        # Common methods: CLS token, mean pooling, first non-padding token
        if self.config.pooling_method == "mean":
            self.pooler = lambda embeddings, attention_mask: (embeddings * attention_mask.unsqueeze(-1)).sum(1) / attention_mask.sum(1).unsqueeze(-1)
        elif self.config.pooling_method == "cls":
            self.pooler = lambda embeddings, attention_mask: embeddings[:, 0]
        else:
            raise ValueError(f"Unknown pooling method: {config.pooling_method}")

    def _get_embeddings(self, input_ids: torch.Tensor, attention_mask: torch.Tensor) -> torch.Tensor:
        """Helper to get pooled embeddings from the model."""
        outputs = self.model(input_ids=input_ids, attention_mask=attention_mask)
        # Assuming last_hidden_state is the sequence of embeddings
        sequence_output = outputs.last_hidden_state
        return self.pooler(sequence_output, attention_mask)

    def training_step(self, batch: Dict[str, torch.Tensor], batch_idx: int) -> torch.Tensor:
        anchor_embed = self._get_embeddings(batch['anchor_input_ids'], batch['anchor_attention_mask'])
        positive_embed = self._get_embeddings(batch['positive_input_ids'], batch['positive_attention_mask'])
        
        # Get embeddings for all negatives in the batch
        # Reshape negative_input_ids and attention_mask to (batch_size * num_hard_negatives, max_length)
        num_negatives = batch['negative_input_ids'].shape[1]
        negative_input_ids_flat = batch['negative_input_ids'].view(-1, self.config.max_length)
        negative_attention_mask_flat = batch['negative_attention_mask'].view(-1, self.config.max_length)
        
        all_negative_embed_flat = self._get_embeddings(negative_input_ids_flat, negative_attention_mask_flat)
        
        # Reshape back to (batch_size, num_hard_negatives, embedding_dim)
        negative_embeds = all_negative_embed_flat.view(-1, num_negatives, all_negative_embed_flat.shape[-1])

        # Calculate InfoNCE Loss
        # Anchor-positive similarity
        ap_sim = torch.cosine_similarity(anchor_embed, positive_embed) # (batch_size,)
        
        # Anchor-negative similarities
        # Expand anchor_embed for broadcasting (batch_size, 1, embedding_dim)
        # negative_embeds (batch_size, num_negatives, embedding_dim)
        an_sim = torch.cosine_similarity(anchor_embed.unsqueeze(1), negative_embeds, dim=2) # (batch_size, num_negatives)
        
        # Combine all similarities for logsumexp
        # (batch_size, 1 + num_negatives)
        all_sims = torch.cat([ap_sim.unsqueeze(1), an_sim], dim=1) / self.config.temperature
        
        # InfoNCE loss: -log(exp(ap_sim) / sum(exp(all_sims)))
        # The target for NCE loss is always the positive sample (index 0)
        loss = torch.nn.functional.cross_entropy(all_sims, torch.zeros(all_sims.shape[0], dtype=torch.long, device=self.device))
        
        self.log("train_loss", loss)
        return loss

    def validation_step(self, batch: Dict[str, torch.Tensor], batch_idx: int):
        # In validation, we might just calculate embeddings and store them for hard negative mining
        # For simplicity, calculate loss too
        loss = self.training_step(batch, batch_idx)
        self.log("val_loss", loss)
        return loss # This is just dummy for now

    def configure_optimizers(self):
        optimizer = torch.optim.AdamW(self.parameters(), lr=self.config.lr)
        
        # Scheduler (linear warmup and decay)
        num_training_steps = self.trainer.estimated_stepping_batches # Automatically set by PL
        num_warmup_steps = int(num_training_steps * 0.1) # 10% warmup
        scheduler = get_linear_schedule_with_warmup(
            optimizer, num_warmup_steps=num_warmup_steps, num_training_steps=num_training_steps
        )
        return {
            "optimizer": optimizer,
            "lr_scheduler": {
                "scheduler": scheduler,
                "interval": "step", # Update scheduler every step
            },
        }


class HardNegativeMiner(Callback):
    """
    PyTorch Lightning Callback for hard negative mining.
    Collects embeddings and performs FAISS search to find hard negatives.
    """
    def __init__(self, config: TrainingConfig, tokenizer: AutoTokenizer, train_dataset: ContrastiveDataset):
        self.config = config
        self.tokenizer = tokenizer
        self.train_dataset = train_dataset
        self.all_eval_embeddings: List[Tuple[str, np.ndarray, str]] = [] # (sid, embedding, problem_id)
        
    def on_validation_epoch_end(self, trainer: pl.Trainer, pl_module: pl.LightningModule):
        """
        After each validation epoch, collect embeddings and perform hard negative mining.
        """
        logger.info(f"Starting hard negative mining after epoch {trainer.current_epoch}...")
        
        if trainer.current_epoch % self.config.hn_mine_every_n_epochs != 0:
            logger.info("Skipping hard negative mining this epoch.")
            return

        # 1. Collect embeddings for a subset of the dataset (or entire validation set)
        # This requires a dedicated DataLoader for the eval/mining set.
        # For simplicity in this scaffold, we'll assume `self.all_eval_embeddings`
        # is populated by a separate process or a dedicated evaluation step.
        # In a real scenario, you'd run a separate `on_validation_batch_end`
        # or a specific 'mining_dataloader' for this.

        # Dummy placeholder: For a real impl, you'd iterate a dedicated eval DataLoader
        # and collect embeddings and their corresponding sids/problem_ids.
        # This part assumes we have an eval_dataset (e.g., first N samples of train_dataset)
        
        num_eval_samples = min(len(self.train_dataset), self.config.hn_mining_eval_dataset_size)
        eval_dataloader = DataLoader(self.train_dataset, batch_size=self.config.eval_batch_size, shuffle=False)
        
        pl_module.eval() # Set model to eval mode
        all_embeddings = []
        all_sids = []
        
        with torch.no_grad():
            for batch_idx, batch in enumerate(eval_dataloader):
                if batch_idx * self.config.eval_batch_size >= num_eval_samples:
                    break
                
                # Move batch to device
                batch_on_device = {k: v.to(pl_module.device) for k, v in batch.items()}
                
                # Get embeddings for anchor, positive, and negatives
                anchor_embed = pl_module._get_embeddings(batch_on_device['anchor_input_ids'], batch_on_device['anchor_attention_mask'])
                positive_embed = pl_module._get_embeddings(batch_on_device['positive_input_ids'], batch_on_device['positive_attention_mask'])
                
                # Need to map these embeddings back to actual submission IDs to create the FAISS index
                # This requires modifying ContrastiveDataset to return submission IDs in `__getitem__`
                # For now, we'll assume we can build an index of all unique sids' embeddings.
                # This needs a more robust implementation to get distinct embeddings for all unique submissions.
                
                # For this scaffold, we'll just use embeddings of anchors for simplicity
                all_embeddings.append(anchor_embed.cpu().numpy())
                # Example: `all_sids` would need to be populated with actual sids from the batch
                # This is a major simplification.
                all_sids.extend([f"dummy_sid_{batch_idx}_{i}" for i in range(len(anchor_embed))])
        
        if not all_embeddings:
            logger.warning("No embeddings collected for hard negative mining.")
            return

        all_embeddings = np.concatenate(all_embeddings, axis=0)
        
        # 2. Build FAISS index
        embedding_dim = all_embeddings.shape[1]
        index = faiss.IndexFlatL2(embedding_dim) # L2 distance
        index.add(all_embeddings)

        # 3. Query for hard negatives (closest non-positive embeddings)
        # This part also requires mapping sids back to codes and problem_ids
        
        new_hn_cache = defaultdict(list)
        
        # Iterate over a subset of anchors to find hard negatives
        for i, (anchor_sid, positive_sid) in enumerate(self.train_dataset.anchor_positive_pairs[:num_eval_samples]):
            if anchor_sid not in self.train_dataset.submission_contents:
                continue

            anchor_code = self.train_dataset.submission_contents[anchor_sid]
            anchor_inputs = self.tokenizer(anchor_code, padding="max_length", truncation=True, max_length=self.config.max_length, return_tensors="pt")
            anchor_embed = pl_module._get_embeddings(anchor_inputs['input_ids'].to(pl_module.device), anchor_inputs['attention_mask'].to(pl_module.device)).cpu().numpy()

            # Search for nearest neighbors
            D, I = index.search(anchor_embed, self.config.num_hard_negatives * 5) # Search more and filter
            
            hn_found_codes = []
            for neighbor_idx in I[0]:
                if neighbor_idx == i: # Skip self (anchor itself)
                    continue
                
                neighbor_sid = all_sids[neighbor_idx] # This mapping needs to be correct
                neighbor_code = self.train_dataset.submission_contents.get(neighbor_sid) # This mapping is crucial
                
                # Filter out the positive sample for this anchor (very important)
                if neighbor_code and neighbor_code != self.train_dataset.submission_contents.get(positive_sid):
                    hn_found_codes.append(neighbor_code)
                
                if len(hn_found_codes) >= self.config.num_hard_negatives:
                    break
            
            if hn_found_codes:
                new_hn_cache[anchor_sid].extend(hn_found_codes)
        
        # Update the dataset's hard negative cache
        self.train_dataset.hn_cache.update(new_hn_cache)
        logger.info(f"Updated hard negative cache with {sum(len(v) for v in new_hn_cache.values())} new hard negatives.")
        
        pl_module.train() # Set model back to train mode

    def on_save_checkpoint(self, trainer: pl.Trainer, pl_module: pl.LightningModule, checkpoint: Dict[str, any]):
        # Save hard negative cache with checkpoint if desired
        checkpoint["hn_cache"] = self.train_dataset.hn_cache


# Main CLI Command
@app.command()
def train(
    config_path: Optional[Path] = typer.Option(None, help="Path to a JSON config file."),
    # Overridable config options
    model_name: str = typer.Option(TrainingConfig.model_name, help="HuggingFace model ID."),
    max_length: int = typer.Option(TrainingConfig.max_length, help="Tokenizer max length."),
    lr: float = typer.Option(TrainingConfig.lr, help="Learning rate."),
    epochs: int = typer.Option(TrainingConfig.epochs, help="Number of epochs."),
    batch_size: int = typer.Option(TrainingConfig.batch_size, help="Training batch size."),
    temperature: float = typer.Option(TrainingConfig.temperature, help="InfoNCE temperature."),
    # Add more CLI flags for other config options as needed
):
    """
    Fine-tunes a HuggingFace encoder model for contrastive retrieval.
    """
    # Load config from file or use CLI overrides
    if config_path:
        with open(config_path, "r", encoding="utf-8") as f:
            config_dict = json.load(f)
            config = TrainingConfig(**config_dict)
    else:
        config = TrainingConfig()

    # Apply CLI overrides
    config.model_name = model_name
    config.max_length = max_length
    config.lr = lr
    config.epochs = epochs
    config.batch_size = batch_size
    config.temperature = temperature
    
    logger.info(f"Training with config: {config}")

    # Create directories
    config.embeddings_output_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. Load tokenizer
    tokenizer = AutoTokenizer.from_pretrained(config.model_name)

    # 2. Prepare dataset and dataloaders
    train_dataset = ContrastiveDataset(
        t4_pairs_csv=config.t4_pairs_csv,
        negatives_json=config.negatives_json,
        tokenizer=tokenizer,
        max_length=config.max_length,
        num_hard_negatives=config.num_hard_negatives,
    )
    
    train_dataloader = DataLoader(
        train_dataset,
        batch_size=config.batch_size,
        shuffle=True,
        num_workers=os.cpu_count() // 2, # Example num_workers
        pin_memory=True,
    )

    # 3. Initialize model
    model = ContrastiveEncoder(config, tokenizer)

    # 4. Callbacks and Logger
    hn_miner = HardNegativeMiner(config, tokenizer, train_dataset)
    tb_logger = TensorBoardLogger("tb_logs", name="contrastive_encoder")
    
    # 5. Trainer
    trainer = pl.Trainer(
        max_epochs=config.epochs,
        accelerator="auto", # Use GPU if available
        precision=config.mixed_precision,
        gradient_clip_val=1.0, # Example gradient clipping
        accumulate_grad_batches=config.gradient_accumulation_steps,
        callbacks=[hn_miner],
        logger=tb_logger,
        log_every_n_steps=10,
    )

    # 6. Train!
    trainer.fit(model, train_dataloader)

    # 7. (Optional) Save embeddings for evaluation dataset
    # This requires a separate evaluation dataloader/dataset
    # For now, we'll save the final model.
    output_model_path = EMBEDDINGS_DIR / "final_model"
    model.model.save_pretrained(output_model_path)
    tokenizer.save_pretrained(output_model_path)
    logger.info(f"Final model and tokenizer saved to {output_model_path}")


if __name__ == "__main__":
    app()
