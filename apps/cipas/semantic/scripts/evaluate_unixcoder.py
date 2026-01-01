
import torch
import pandas as pd
import numpy as np
from transformers import RobertaTokenizer, RobertaModel
from torch.utils.data import DataLoader, Dataset
from sklearn.metrics import roc_auc_score, f1_score, precision_recall_curve
from pathlib import Path
from tqdm import tqdm
import argparse
import sys

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent
sys.path.append(str(BASE_DIR))
from apps.cipas.semantic.services.ast_flattener import ASTFlattener

DATA_PATH = BASE_DIR / "apps" / "cipas" / "datasets" / "processing" / "unixcoder_training_data.parquet"
MODEL_PATH = BASE_DIR / "apps" / "cipas" / "models" / "unixcoder_finetuned"

class EvalDataset(Dataset):
    def __init__(self, data, tokenizer, max_len=512):
        self.data = data
        self.tokenizer = tokenizer
        self.max_len = max_len
        self.flattener = ASTFlattener()
        self.pairs = self._prepare_pairs()

    def _prepare_pairs(self):
        pairs = []
        for _, row in self.data.iterrows():
            anchor = row['anchor']
            # Positive
            pairs.append((anchor, row['positive'], 1))
            # Hard Negatives
            for n in row['hard_negatives']:
                pairs.append((anchor, n, 0))
            # Easy Negatives
            for n in row['easy_negatives']:
                pairs.append((anchor, n, 0))
        return pairs

    def __len__(self):
        return len(self.pairs)
        
    def _process(self, code):
        ast = self.flattener.flatten(code)
        tokens = [self.tokenizer.cls_token] + self.tokenizer.tokenize(code) + [self.tokenizer.sep_token] + self.tokenizer.tokenize(ast) + [self.tokenizer.sep_token]
        ids = self.tokenizer.convert_tokens_to_ids(tokens)[:self.max_len]
        mask = [1] * len(ids)
        padding = self.max_len - len(ids)
        ids += [self.tokenizer.pad_token_id] * padding
        mask += [0] * padding
        return torch.tensor(ids), torch.tensor(mask)

    def __getitem__(self, idx):
        c1, c2, label = self.pairs[idx]
        id1, m1 = self._process(c1)
        id2, m2 = self._process(c2)
        return id1, m1, id2, m2, torch.tensor(label, dtype=torch.float)

class Encoder(torch.nn.Module):
    def __init__(self, model_path):
        super().__init__()
        # Try loading finetuned, else base
        try:
            # Finding the latest checkpoint
            checkpoints = sorted(list(Path(model_path).glob("*.pt")))
            if checkpoints:
                print(f"Loading checkpoint: {checkpoints[-1]}")
                self.encoder = RobertaModel.from_pretrained("microsoft/unixcoder-base")
                # Wait, if we saved state_dict of SiameseUniXcoder, keys might match or need adjustment
                # SiameseUniXcoder has self.encoder
                # State dict keys: encoder.embeddings...
                # So we can load it into a wrapper
                state_dict = torch.load(checkpoints[-1], map_location="cpu")
                self.load_state_dict(state_dict) 
            else:
                print("No checkpoint found, using base model.")
                self.encoder = RobertaModel.from_pretrained("microsoft/unixcoder-base")
        except Exception as e:
            print(f"Error loading model: {e}. Using base.")
            self.encoder = RobertaModel.from_pretrained("microsoft/unixcoder-base")

    def forward(self, input_ids, attention_mask):
        out = self.encoder(input_ids=input_ids, attention_mask=attention_mask)
        return out.last_hidden_state[:, 0, :]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--batch_size", type=int, default=16)
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")

    if not DATA_PATH.exists():
        print("Data not found.")
        return

    df = pd.read_parquet(DATA_PATH)
    if args.limit:
        df = df.head(args.limit)

    # Use tail as test set (simple split, assuming train_unixcoder uses head)
    # Ideally should use same split.
    # train_unixcoder uses 90% train, 10% val.
    # We can evaluate on that 10% val set.
    train_size = int(0.9 * len(df))
    test_df = df.iloc[train_size:]
    
    tokenizer = RobertaTokenizer.from_pretrained("microsoft/unixcoder-base")
    ds = EvalDataset(test_df, tokenizer)
    loader = DataLoader(ds, batch_size=args.batch_size)
    
    model = Encoder(MODEL_PATH).to(device)
    model.eval()
    
    sims = []
    labels = []
    
    print("Evaluating...")
    with torch.no_grad():
        for b in tqdm(loader):
            id1, m1, id2, m2, lbl = [x.to(device) for x in b]
            
            emb1 = model(id1, m1)
            emb2 = model(id2, m2)
            
            cos = torch.nn.functional.cosine_similarity(emb1, emb2)
            sims.extend(cos.cpu().numpy())
            labels.extend(lbl.cpu().numpy())
            
    sims = np.array(sims)
    labels = np.array(labels)
    
    auc = roc_auc_score(labels, sims)
    print(f"AUC: {auc:.4f}")
    
    # Find best F1
    precision, recall, thresholds = precision_recall_curve(labels, sims)
    f1_scores = 2 * recall * precision / (recall + precision + 1e-10)
    best_idx = np.argmax(f1_scores)
    print(f"Best F1: {f1_scores[best_idx]:.4f} at Threshold: {thresholds[best_idx]:.4f}")

if __name__ == "__main__":
    main()
