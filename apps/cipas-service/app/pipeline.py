import torch
import torch.nn as nn
from transformers import AutoModel, AutoTokenizer
from peft import get_peft_model, LoraConfig, TaskType
import faiss
import numpy as np
import os
from typing import List, Tuple, Dict, Optional

class CloneClassifier(nn.Module):
    def __init__(self, hidden_size, num_classes=5): # 0=Non-clone, 1-4=Type 1-4
        super().__init__()
        self.dropout = nn.Dropout(0.1)
        self.fc = nn.Linear(hidden_size * 3, num_classes) # Concatenate u, v, |u-v|

    def forward(self, embedding_a, embedding_b):
        # Feature engineering for pair classification
        abs_diff = torch.abs(embedding_a - embedding_b)
        features = torch.cat((embedding_a, embedding_b, abs_diff), dim=1)
        features = self.dropout(features)
        logits = self.fc(features)
        return logits

class EmbeddingModel(nn.Module):
    def __init__(self, base_model):
        super().__init__()
        self.bert = base_model
        
    def forward(self, input_ids, attention_mask):
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        # Use CLS token (first token)
        cls_embedding = outputs.last_hidden_state[:, 0, :]
        return cls_embedding

class CloneDetectionPipeline:
    def __init__(self, model_name: str = "microsoft/unixcoder-base", device: str = None):
        self.device = device if device else ("cuda" if torch.cuda.is_available() else "cpu")
        self.model_name = model_name
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        
        # Load backbone
        base_model = AutoModel.from_pretrained(model_name)
        self.embedding_model = EmbeddingModel(base_model)
        
        # Initialize LoRA
        self.setup_lora()
        
        # Classification head
        self.classifier = CloneClassifier(base_model.config.hidden_size)
        
        # Move to device
        self.embedding_model.to(self.device)
        self.classifier.to(self.device)
        
        # FAISS Index
        self.index = None
        self.stored_embeddings = []
        self.stored_metadata = []

    def setup_lora(self):
        # Configure LoRA
        peft_config = LoraConfig(
            task_type=TaskType.FEATURE_EXTRACTION, 
            inference_mode=False, 
            r=8, 
            lora_alpha=32, 
            lora_dropout=0.1
        )
        # Apply LoRA to the BERT backbone
        self.embedding_model.bert = get_peft_model(self.embedding_model.bert, peft_config)
        self.embedding_model.bert.print_trainable_parameters()

    def load_adapter(self, adapter_path: str):
        """Load a specific LoRA adapter"""
        from peft import PeftModel
        self.embedding_model.bert = PeftModel.from_pretrained(
            self.embedding_model.bert.base_model, # Get base if already wrapped
            adapter_path
        )
        self.embedding_model.to(self.device)

    def preprocess(self, code_fragments: List[str]):
        return self.tokenizer(
            code_fragments, 
            return_tensors="pt", 
            padding=True, 
            truncation=True, 
            max_length=512
        ).to(self.device)

    @torch.no_grad()
    def get_embeddings(self, code_fragments: List[str]) -> np.ndarray:
        self.embedding_model.eval()
        inputs = self.preprocess(code_fragments)
        embeddings = self.embedding_model(inputs["input_ids"], inputs["attention_mask"])
        return embeddings.cpu().numpy()

    def index_embeddings(self, embeddings: np.ndarray, metadata: List[Dict]):
        """Add embeddings to FAISS index"""
        dimension = embeddings.shape[1]
        if self.index is None:
            self.index = faiss.IndexFlatL2(dimension)
            
        self.index.add(embeddings)
        self.stored_embeddings.append(embeddings)
        self.stored_metadata.extend(metadata)

    def search_similar(self, code: str, k: int = 5):
        """Vector search using FAISS"""
        if self.index is None:
            return []
            
        emb = self.get_embeddings([code])
        distances, indices = self.index.search(emb, k)
        
        results = []
        for i, idx in enumerate(indices[0]):
            if idx != -1:
                results.append({
                    "metadata": self.stored_metadata[idx],
                    "distance": float(distances[0][i])
                })
        return results

    def predict_clone_type(self, code_a: str, code_b: str):
        """Predict if pair is clone and which type"""
        self.embedding_model.eval()
        self.classifier.eval()
        
        inputs_a = self.preprocess([code_a])
        inputs_b = self.preprocess([code_b])
        
        with torch.no_grad():
            emb_a = self.embedding_model(inputs_a["input_ids"], inputs_a["attention_mask"])
            emb_b = self.embedding_model(inputs_b["input_ids"], inputs_b["attention_mask"])
            logits = self.classifier(emb_a, emb_b)
            probs = torch.softmax(logits, dim=1)
            pred_class = torch.argmax(probs, dim=1).item()
            
        return pred_class, probs[0].tolist()

    def save_index(self, directory: str):
        """Save FAISS index and metadata to disk"""
        if not os.path.exists(directory):
            os.makedirs(directory)
            
        if self.index is not None:
            faiss.write_index(self.index, os.path.join(directory, "index.faiss"))
            
        import pickle
        with open(os.path.join(directory, "metadata.pkl"), "wb") as f:
            pickle.dump(self.stored_metadata, f)
            
    def load_index(self, directory: str):
        """Load FAISS index and metadata from disk"""
        index_path = os.path.join(directory, "index.faiss")
        meta_path = os.path.join(directory, "metadata.pkl")
        
        if os.path.exists(index_path):
            self.index = faiss.read_index(index_path)
            
        if os.path.exists(meta_path):
            import pickle
            with open(meta_path, "rb") as f:
                self.stored_metadata = pickle.load(f)

    def train_step(self, batch_data: List[Dict]):
        """
        Expects batch_data to contain pairs: 
        {'code_a': str, 'code_b': str, 'label': int}
        """
        self.embedding_model.train()
        self.classifier.train()
        
        pass
