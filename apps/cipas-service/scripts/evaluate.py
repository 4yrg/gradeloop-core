import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import torch
import torch.nn as nn
from app.pipeline import CloneDetectionPipeline
from torch.utils.data import DataLoader, Dataset
import json
import logging
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class CodePairDataset(Dataset):
    def __init__(self, data_path, max_samples=None):
        self.data = []
        logging.info(f"Loading dataset from {data_path}...")
        
        try:
            if data_path.endswith('.jsonl'):
                with open(data_path, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    if max_samples:
                        lines = lines[:max_samples]
                    for line in lines:
                        if line.strip():
                            self.data.append(json.loads(line))
            else:
                with open(data_path, 'r', encoding='utf-8') as f:
                    content = json.load(f)
                    if max_samples:
                        content = content[:max_samples]
                    self.data = content
        except Exception as e:
            logging.error(f"Error loading dataset: {e}")
            raise e
            
        logging.info(f"Loaded {len(self.data)} pairs.")

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        item = self.data[idx]
        code_a = item.get('code_1') or item.get('code_a')
        code_b = item.get('code_2') or item.get('code_b')
        label_raw = item.get('label')
        
        if isinstance(label_raw, str):
            label = 1 if label_raw.lower() == 'clone' else 0
        else:
            label = int(label_raw)
            
        return code_a, code_b, label

def evaluate(data_path, adapter_path="models/adapter", batch_size=8):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    logging.info(f"Using device: {device}")
    
    pipeline = CloneDetectionPipeline(device=device)
    
    # Load trained adapter
    if os.path.exists(adapter_path):
        # Check if valid adapter directory
        if os.path.isdir(adapter_path) and os.path.exists(os.path.join(adapter_path, "adapter_config.json")):
            logging.info(f"Loading adapter from {adapter_path}...")
            pipeline.load_adapter(adapter_path)
            
            # Load classifier head
            classifier_path = os.path.join(adapter_path, "classifier.pt")
            if os.path.exists(classifier_path):
                 pipeline.classifier.load_state_dict(torch.load(classifier_path, map_location=device))
            else:
                 logging.warning("Classifier head not found, using random init (results will be poor).")
        else:
            logging.warning(f"Path {adapter_path} exists but does not look like a valid adapter (missing adapter_config.json). Using base model.")
    else:
        logging.warning(f"Adapter not found at {adapter_path}. Using base model.")

    dataset = CodePairDataset(data_path)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=False)
    
    all_preds = []
    all_labels = []
    
    logging.info("Starting evaluation...")
    
    with torch.no_grad():
        for batch_idx, (code_a, code_b, labels) in enumerate(dataloader):
            inputs_a = pipeline.preprocess(list(code_a))
            inputs_b = pipeline.preprocess(list(code_b))
            
            labels = labels.to(device)
            
            emb_a = pipeline.embedding_model(inputs_a["input_ids"], inputs_a["attention_mask"])
            emb_b = pipeline.embedding_model(inputs_b["input_ids"], inputs_b["attention_mask"])
            
            logits = pipeline.classifier(emb_a, emb_b)
            probs = torch.softmax(logits, dim=1)
            preds = torch.argmax(probs, dim=1)
            
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
            
            if (batch_idx + 1) % 10 == 0:
                logging.info(f"Processed {batch_idx + 1} batches")

    # Metrics
    acc = accuracy_score(all_labels, all_preds)
    precision, recall, f1, _ = precision_recall_fscore_support(all_labels, all_preds, average='binary')
    cm = confusion_matrix(all_labels, all_preds)
    
    print("\n" + "="*30)
    print(f"Evaluation Results on {data_path}")
    print("="*30)
    print(f"Accuracy:  {acc:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print("-" * 30)
    print("Confusion Matrix:")
    print(cm)
    print("="*30)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python evaluate.py <data_path> [adapter_path]")
    else:
        adapter = sys.argv[2] if len(sys.argv) > 2 else "models/adapter"
        evaluate(sys.argv[1], adapter_path=adapter)
