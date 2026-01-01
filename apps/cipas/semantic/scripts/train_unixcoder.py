
import os
import torch
import torch.nn as nn
import pandas as pd
import numpy as np
from torch.utils.data import Dataset, DataLoader
from transformers import RobertaTokenizer, RobertaModel, RobertaConfig
from pathlib import Path
from tqdm import tqdm
import argparse
import sys

# Add project root to path for imports
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent
sys.path.append(str(BASE_DIR))

from apps.cipas.semantic.services.ast_flattener import ASTFlattener

OUTPUT_DIR = BASE_DIR / "apps" / "cipas" / "models" / "unixcoder_finetuned"
DATA_PATH = BASE_DIR / "apps" / "cipas" / "datasets" / "processing" / "unixcoder_training_data.parquet"

class UniXcoderDataset(Dataset):
    def __init__(self, data, tokenizer, max_len=512):
        self.data = data
        self.tokenizer = tokenizer
        self.max_len = max_len
        self.flattener = ASTFlattener()

    def __len__(self):
        return len(self.data)

    def _process_text(self, code):
        # Flatten AST
        ast_seq = self.flattener.flatten(code)
        return code, ast_seq

    def __getitem__(self, idx):
        row = self.data.iloc[idx]
        
        # We need to process Anchor, Positive, Hard Negatives, Easy Negatives
        # For simplicity in batching, we will flatten this into a list of sequences per sample?
        # Or returns a dict of tensors?
        
        # InfoNCE expects [Anchor, Positive, Neg1, Neg2, ...]
        # Let's collect all texts for this sample
        texts = []
        
        # Anchor
        texts.append(self._process_text(row['anchor']))
        
        # Positive
        texts.append(self._process_text(row['positive']))
        
        # Hard Negatives
        for n in row['hard_negatives']:
            texts.append(self._process_text(n))
            
        # Easy Negatives
        for n in row['easy_negatives']:
            texts.append(self._process_text(n))
            
        # Tokenize all
        # Input format: [CLS] code [SEP] ast [SEP]
        input_ids_list = []
        attention_mask_list = []
        
        for code, ast in texts:
            # Manually construct to ensure valid structure
            code_tokens = self.tokenizer.tokenize(code)
            ast_tokens = self.tokenizer.tokenize(ast)
            
            # Truncate
            # Half-half split strategy or priority to code?
            # Let's just concat and truncate
            # Budget: max_len - 3 ([CLS], [SEP], [SEP])
            budget = self.max_len - 3
            if len(code_tokens) + len(ast_tokens) > budget:
                # Truncate both proportionally or just cut off
                # Simple: truncate both to half
                limit = budget // 2
                code_tokens = code_tokens[:limit]
                ast_tokens = ast_tokens[:limit]
                
            tokens = [self.tokenizer.cls_token] + code_tokens + [self.tokenizer.sep_token] + ast_tokens + [self.tokenizer.sep_token]
            ids = self.tokenizer.convert_tokens_to_ids(tokens)
            mask = [1] * len(ids)
            
            # Padding
            padding_length = self.max_len - len(ids)
            ids = ids + [self.tokenizer.pad_token_id] * padding_length
            mask = mask + [0] * padding_length
            
            input_ids_list.append(torch.tensor(ids, dtype=torch.long))
            attention_mask_list.append(torch.tensor(mask, dtype=torch.long))
            
        return {
            "input_ids": torch.stack(input_ids_list), # [K+2, L]
            "attention_mask": torch.stack(attention_mask_list)
        }

class SiameseUniXcoder(nn.Module):
    def __init__(self, model_name="microsoft/unixcoder-base"):
        super().__init__()
        self.encoder = RobertaModel.from_pretrained(model_name)
        
    def forward(self, input_ids, attention_mask):
        # input_ids: [Batch, K, SeqLen] -> flatten to [Batch*K, SeqLen]
        batch_size, num_cands, seq_len = input_ids.shape
        
        flat_input = input_ids.view(-1, seq_len)
        flat_mask = attention_mask.view(-1, seq_len)
        
        outputs = self.encoder(input_ids=flat_input, attention_mask=flat_mask)
        # Pool: [CLS] token (first token)
        cls_embedding = outputs.last_hidden_state[:, 0, :] # [Batch*K, Hidden]
        
        return cls_embedding.view(batch_size, num_cands, -1)

def info_nce_loss(embeddings, temperature=0.05):
    # embeddings: [Batch, K, Hidden]
    # K includes Anchor(0), Positive(1), Negatives(2..)
    
    anchor = embeddings[:, 0, :] # [Batch, Hidden]
    candidates = embeddings[:, 1:, :] # [Batch, K-1, Hidden]
    
    # Cosine Similarity
    # Normalize first
    anchor = torch.nn.functional.normalize(anchor, p=2, dim=1)
    candidates = torch.nn.functional.normalize(candidates, p=2, dim=2)
    
    # Dot product: [Batch, 1, Hidden] @ [Batch, Hidden, K-1] -> [Batch, 1, K-1]
    # or simple elementwise then sum
    # anchor: [B, H] -> [B, 1, H]
    scores = torch.bmm(anchor.unsqueeze(1), candidates.transpose(1, 2)).squeeze(1) # [Batch, K-1]
    
    scores = scores / temperature
    
    # Target is always index 0 (the positive, which is at index 0 of candidates)
    # candidates includes [Positive, Neg1, Neg2...]
    target = torch.zeros(scores.size(), dtype=torch.long, device=scores.device)[:, 0] 
    # Wait, target must be 0? 
    # scores shape: [Batch, K-1]. 
    # Index 0 corresponds to candidates[:, 0, :], which is the Positive.
    # So yes, target class is 0.
    
    labels = torch.zeros(scores.size(0), dtype=torch.long, device=scores.device)
    
    loss = nn.CrossEntropyLoss()(scores, labels)
    return loss

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--batch_size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=2e-5)
    parser.add_argument("--temp", type=float, default=0.05)
    parser.add_argument("--limit", type=int, default=None)
    args = parser.parse_args()

    # Setup
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    
    # Data
    print("Loading data...")
    if not DATA_PATH.exists():
        print(f"Data not found at {DATA_PATH}")
        return
        
    df = pd.read_parquet(DATA_PATH)
    if args.limit:
        df = df.head(args.limit)
    
    # Split
    train_size = int(0.9 * len(df))
    train_df = df.iloc[:train_size]
    val_df = df.iloc[train_size:]
    
    tokenizer = RobertaTokenizer.from_pretrained("microsoft/unixcoder-base")
    
    train_ds = UniXcoderDataset(train_df, tokenizer)
    val_ds = UniXcoderDataset(val_df, tokenizer)
    
    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False)
    
    # Model
    print("Initializing model...")
    model = SiameseUniXcoder().to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr)
    
    # Train
    print("Starting training...")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    for epoch in range(args.epochs):
        model.train()
        train_loss = 0
        pbar = tqdm(train_loader, desc=f"Epoch {epoch+1}/{args.epochs}")
        
        for batch in pbar:
            input_ids = batch["input_ids"].to(device)
            mask = batch["attention_mask"].to(device)
            
            optimizer.zero_grad()
            embeddings = model(input_ids, mask)
            loss = info_nce_loss(embeddings, temperature=args.temp)
            
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            pbar.set_postfix({"loss": loss.item()})
            
        avg_train_loss = train_loss / len(train_loader)
        print(f"Epoch {epoch+1} Train Loss: {avg_train_loss:.4f}")
        
        # Validation
        model.eval()
        val_loss = 0
        with torch.no_grad():
            for batch in val_loader:
                input_ids = batch["input_ids"].to(device)
                mask = batch["attention_mask"].to(device)
                
                embeddings = model(input_ids, mask)
                loss = info_nce_loss(embeddings, temperature=args.temp)
                val_loss += loss.item()
                
        avg_val_loss = val_loss / len(val_loader) if len(val_loader) > 0 else 0
        print(f"Epoch {epoch+1} Val Loss: {avg_val_loss:.4f}")
        
        # Save checkpoing
        torch.save(model.state_dict(), OUTPUT_DIR / f"model_epoch_{epoch+1}.pt")
        
    print("Training complete.")

if __name__ == "__main__":
    main()
