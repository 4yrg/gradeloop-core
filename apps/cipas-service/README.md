# Unified Semantic Code Clone Detection System

This project implements a semantic code clone detection system using **UniXcoder**, **LoRA** for efficient fine-tuning, and **FastAPI** for serving. It supports Type-1 to Type-4 clone detection effectively.

## Features

- **Backbone**: UniXcoder-base with Siamese architecture.
- **Fine-tuning**: Parameter-Efficient Fine-Tuning (PEFT) using LoRA.
- **Retrieval**: FAISS-based approximate nearest neighbor search.
- **Augmentation**: AST-based data augmentation (identifier renaming, statement swapping).
- **Extensible**: Modular pipeline supporting addition of new languages and adapters.

## Setup

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
   *Note: Ensure you have a compatible Torch version for your hardware (CPU/CUDA).*

2. **Project Structure**:
   - `app/`: Main application code.
     - `pipeline.py`: Core ML logic (Model, LoRA, FAISS).
     - `utils/`: AST and Data handling utilities.
   - `scripts/`: Training and augmentation scripts.
   - `models/`: Directory to store trained adapters.
   - `data/`: Directory for datasets.

## Usage

### 1. Start the Server
Run the FastAPI server with Uvicorn:
```bash
uvicorn main:app --reload
```
The API will be available at `http://localhost:8000`.
API Documentation (Swagger UI): `http://localhost:8000/docs`.

### 2. Data Augmentation
To augment your dataset (expand small datasets):
```bash
python scripts/augment.py --input data/original.json --output data/augmented.json --variants 2
```

### 3. Training LoRA Adapters
Train the model on your dataset:
```bash
python scripts/train.py data/augmented.json
```
This will save the trained LoRA adapter and classifier head to `models/adapter`.

### 4. Indexing & Querying
The system automatically handles embedding generation. In a production scenario, you would preload the FAISS index.
Currently, the `/detect` endpoint demonstrates searching against indexed vectors. *Note: In this POC, you need to populate the index first or modify the logic to persist the FAISS index.*

To populate the index via code (example):
```python
from app.pipeline import CloneDetectionPipeline
pipeline = CloneDetectionPipeline()
pipeline.index_embeddings(embeddings, metadata)
```

## Extending

### Adding New Languages
1. The system uses `tree-sitter`. `tree_sitter_languages` supports many languages out of the box.
2. Update `app/utils/ast_handler.py` `extract_fragments` method to add specific queries for the new language (e.g., Python, C++).
3. If using language-specific LoRA adapters, train a new adapter using `scripts/train.py` and load it via the `/adapter` endpoint.

### Loading Adapters
Use the API endpoint:
```http
POST /adapter
{
    "adapter_path": "models/my_new_adapter"
}
```

## Testing
Run unit tests:
```bash
python -m unittest discover tests
```
