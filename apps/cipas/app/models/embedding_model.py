from transformers import AutoTokenizer, AutoModel
import torch
import torch.nn.functional as F

MODEL_NAME = "microsoft/codebert-base"

class CodeEmbedder:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"Loading {MODEL_NAME} on {self.device}...")
        self.tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        self.model = AutoModel.from_pretrained(MODEL_NAME).to(self.device)
        self.model.eval()

    def generate_embedding(self, code: str) -> list[float]:
        # Truncate to 512 tokens
        inputs = self.tokenizer(code, return_tensors="pt", truncation=True, max_length=512)
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        
        with torch.no_grad():
             outputs = self.model(**inputs)
             # Use CLS token embedding (index 0)
             embedding = outputs.last_hidden_state[:, 0, :]
             # Normalize
             embedding = F.normalize(embedding, p=2, dim=1)
             
        return embedding.cpu().numpy()[0].tolist()

# Singleton instance
embedder = CodeEmbedder()
