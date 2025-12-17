import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import torch
import torch.nn as nn
from app.pipeline import CloneDetectionPipeline
from torch.utils.data import DataLoader, Dataset
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class CodePairDataset(Dataset):
    def __init__(self, data_path, max_samples=None):
        self.data = []
        logging.info(f"Loading dataset from {data_path}...")
        
        try:
            # Detect JSONL vs JSON
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
        # Map fields to standard names
        code_a = item.get('code_1') or item.get('code_a')
        code_b = item.get('code_2') or item.get('code_b')
        label_raw = item.get('label')
        
        # Convert label to integer
        # Assuming 1 for clone, 0 for non-clone
        if isinstance(label_raw, str):
            label = 1 if label_raw.lower() == 'clone' else 0
        else:
            label = int(label_raw)
            
        return code_a, code_b, label

def train(data_path, output_dir="models/adapter", epochs=3, batch_size=4):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    logging.info(f"Using device: {device}")
    
    pipeline = CloneDetectionPipeline(device=device)
    pipeline.embedding_model.train()
    pipeline.classifier.train()
    
    # Trainable parameters: Classifier + LoRA params
    params = list(pipeline.classifier.parameters()) + list(pipeline.embedding_model.bert.parameters())
    optimizer = torch.optim.AdamW(params, lr=2e-5)
    
    classification_loss_fn = nn.CrossEntropyLoss()
    
    dataset = CodePairDataset(data_path)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
    
    logging.info(f"Starting training for {epochs} epochs...")
    
    for epoch in range(epochs):
        total_loss = 0
        steps = 0
        
        for batch_idx, (code_a, code_b, labels) in enumerate(dataloader):
            optimizer.zero_grad()
            
            # Prepare inputs
            # Tokenize batch
            # Note: We need to handle list of strings from dataloader
            
            # Forward pass
            # We need to expose a way to get logits directly or use the underlying models
            # Here we manually call models to support gradient flow
            
            # 1. Tokenize
            inputs_a = pipeline.preprocess(list(code_a))
            inputs_b = pipeline.preprocess(list(code_b))
            
            labels = labels.to(device)
            
            # 2. Embed
            emb_a = pipeline.embedding_model(inputs_a["input_ids"], inputs_a["attention_mask"])
            emb_b = pipeline.embedding_model(inputs_b["input_ids"], inputs_b["attention_mask"])
            
            # 3. Classify
            logits = pipeline.classifier(emb_a, emb_b)
            
            # 4. Loss
            loss = classification_loss_fn(logits, labels)
            
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item()
            steps += 1
            
            if steps % 10 == 0:
                logging.info(f"Epoch {epoch+1}, Step {steps}, Loss: {loss.item():.4f}")
        
        avg_loss = total_loss / steps if steps > 0 else 0
        logging.info(f"Epoch {epoch+1} completed. Average Loss: {avg_loss:.4f}")

    # Save
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Save adapter
    pipeline.embedding_model.bert.save_pretrained(output_dir)
    # Save classifier head
    torch.save(pipeline.classifier.state_dict(), os.path.join(output_dir, "classifier.pt"))
    logging.info(f"Model saved to {output_dir}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python train.py <data_path> [epochs]")
    else:
        epochs = int(sys.argv[2]) if len(sys.argv) > 2 else 3
        train(sys.argv[1], epochs=epochs)
