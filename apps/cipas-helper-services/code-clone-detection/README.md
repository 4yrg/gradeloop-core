# Code Clone Detection Dataset Pipeline

A modular Python pipeline for creating high-quality code clone datasets. This tool extracts code fragments, generates clone pairs, applies transformations, validates clones, balances datasets, and exports in multiple formats for machine learning research.

## Features

- 🔍 **Multi-language support**: Python, Java, JavaScript, C++
- 🧩 **Modular architecture**: Organized into extract, preprocess, generation, negatives, validation, balancing, and export stages
- 🤖 **LLM integration**: Optional semantic analysis with mockable interfaces
- 📊 **Multiple output formats**: Parquet, CSV, JSON
- 🧪 **Fully tested**: Comprehensive unit tests
- 📓 **Jupyter-friendly**: All functions return values for interactive analysis
- ⚖️ **Dataset balancing**: Automatic balancing of positive and negative samples
- ✅ **Validation**: Built-in validation for clone quality and dataset integrity

## Project Structure

```
code-clone-detection/
├── configs/
│   ├── pipeline_config.yaml    # Main configuration
│   └── schema.yaml              # Data schema definitions
├── src/
│   ├── __init__.py
│   ├── utils/                   # Shared utilities (config, logging, file I/O)
│   ├── extract/                 # Code fragment extraction
│   ├── preprocess/              # Data cleaning and normalization
│   ├── generation/              # Clone pair generation
│   ├── negatives/               # Negative sample generation
│   ├── validation/              # Quality validation
│   ├── balancing/               # Dataset balancing
│   └── export/                  # Export to various formats
├── scripts/
│   └── init_project.py          # Project initialization script
├── notebooks/                   # Jupyter notebooks for exploration
├── tests/
│   └── unit/                    # Unit tests
├── data/
│   ├── raw/                     # Input source code
│   └── processed/               # Output datasets
├── requirements.txt
└── README.md
```

## Installation

1. **Clone or navigate to the project directory:**

   ```bash
   cd cipas-helper-services/code-clone-detection
   ```

2. **Initialize project structure (if needed):**

   ```bash
   python scripts/init_project.py
   ```

3. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

4. **Optional dependencies for advanced features:**

   ```bash
   # For tree-sitter AST parsing
   pip install tree-sitter
   
   # For LibCST Python manipulation
   pip install libcst
   ```

## Quick Start

### 1. Configure the Pipeline

Edit `configs/pipeline_config.yaml` to customize:

```yaml
data_source:
  type: "local"
  input_dir: "data/raw"
  output_dir: "data/processed"
  extensions: [".py", ".java", ".js"]

clone_detection:
  similarity_threshold: 0.85
  clone_types: ["type1", "type2", "type3", "type4"]
```

### 2. Run the Pipeline

```python
from src import run_pipeline_from_config

# Run complete pipeline
results = run_pipeline_from_config("configs/pipeline_config.yaml")

print(f"Found {results['total_clone_pairs']} clone pairs")
print(f"Processed {results['total_fragments']} code fragments")
```

### 3. Analyze Results

```python
from src import load_fragments, load_clone_pairs

# Load results
fragments = load_fragments("data/processed/fragments.parquet")
clones = load_clone_pairs("data/processed/clone_pairs.parquet")

# Inspect a clone pair
clone = clones[0]
print(f"Clone Type: {clone.clone_type}")
print(f"Similarity: {clone.similarity_score:.2f}")
```

## Usage Examples

### Example 1: Extract Code Fragments

```python
from src import extract_fragments_from_file

fragments = extract_fragments_from_file(
    file_path="data/raw/example.py",
    language="python",
    min_lines=5,
    extract_functions=True,
    extract_classes=True
)

for frag in fragments:
    print(f"Fragment at {frag.file_path}:{frag.start_line}-{frag.end_line}")
    print(f"LOC: {frag.metrics.loc}, Tokens: {frag.metrics.token_count}")
```

### Example 2: Detect Clones

```python
from src import detect_clones

clones = detect_clones(
    fragments,
    threshold=0.85,
    methods=["token", "ast"]
)

for clone in clones:
    print(f"Clone {clone.clone_type}: {clone.similarity_score:.2f}")
```

### Example 3: Use LLM for Semantic Analysis

```python
from src import create_llm_adapter

# Use mock adapter for testing
llm = create_llm_adapter("mock", {"embedding_dim": 128})

# Generate embeddings
embedding = llm.generate_embedding("def foo(): pass")
print(f"Embedding dimension: {len(embedding)}")

# Compute semantic similarity
similarity = llm.compute_semantic_similarity(
    "def foo(): pass",
    "def bar(): return 42"
)
print(f"Semantic similarity: {similarity:.2f}")
```

### Example 4: Custom Pipeline

```python
from src import CloneDetectionPipeline, Config

# Load configuration
config = Config.from_file("configs/pipeline_config.yaml")

# Override settings
config._data["clone_detection"]["similarity_threshold"] = 0.90

# Run pipeline
pipeline = CloneDetectionPipeline(config)
results = pipeline.run()
```

## Configuration

### Key Configuration Options

| Setting                                | Description                  | Default    |
| -------------------------------------- | ---------------------------- | ---------- |
| `data_source.input_dir`                | Directory with source code   | `data/raw` |
| `data_source.extensions`               | File extensions to process   | `[".py"]`  |
| `parser.min_lines`                     | Minimum lines for a fragment | `5`        |
| `clone_detection.similarity_threshold` | Minimum similarity (0-1)     | `0.85`     |
| `llm.enabled`                          | Enable semantic analysis     | `false`    |
| `output.format`                        | Output format                | `parquet`  |

### Clone Types

- **Type 1**: Exact clones (except whitespace/comments)
- **Type 2**: Syntactically identical (different identifiers)
- **Type 3**: Copied with modifications
- **Type 4**: Semantically similar (different implementation)

## Testing

Run the test suite:

```bash
pytest tests/ -v
```

Run with coverage:

```bash
pytest tests/ --cov=src --cov-report=html
```

## Development

### Adding a New Language Parser

1. Extend `parser.py` with language-specific extraction logic
2. Add pattern matching for language constructs
3. Update configuration to support the new language

### Creating a Custom LLM Adapter

```python
from src.llm_adapter import LLMAdapter

class CustomLLMAdapter(LLMAdapter):
    def generate_embedding(self, text: str) -> List[float]:
        # Your implementation
        pass

    def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        # Your implementation
        pass

    def compute_semantic_similarity(self, text1: str, text2: str) -> float:
        # Your implementation
        pass
```

## Data Schema

### CodeFragment

| Field        | Type         | Description                          |
| ------------ | ------------ | ------------------------------------ |
| `id`         | string       | Unique identifier                    |
| `file_path`  | string       | Source file path                     |
| `start_line` | int          | Starting line number                 |
| `end_line`   | int          | Ending line number                   |
| `language`   | string       | Programming language                 |
| `content`    | string       | Raw code content                     |
| `tokens`     | list[string] | Token list                           |
| `ast_hash`   | string       | AST structure hash                   |
| `metrics`    | dict         | Code metrics (LOC, complexity, etc.) |
| `embedding`  | list[float]  | Optional semantic embedding          |

### ClonePair

| Field              | Type   | Description                   |
| ------------------ | ------ | ----------------------------- |
| `id`               | string | Unique identifier             |
| `fragment_1_id`    | string | First fragment ID             |
| `fragment_2_id`    | string | Second fragment ID            |
| `clone_type`       | string | Clone type (type1-4)          |
| `similarity_score` | float  | Overall similarity (0-1)      |
| `detection_method` | string | Method used                   |
| `metadata`         | dict   | Additional similarity metrics |

## Performance Tips

1. **Use Parquet format**: Much faster than CSV for large datasets
2. **Adjust batch size**: For LLM embeddings, tune `llm.batch_size`
3. **Filter by extensions**: Process only relevant file types
4. **Set min_lines**: Skip very small code fragments

## Troubleshooting

### Issue: Out of memory when processing large codebases

**Solution**: Process files in batches using `iter_files()` from `file_utils.py`

### Issue: LLM API rate limits

**Solution**: Use the mock adapter for testing, or adjust `llm.batch_size`

### Issue: Parser not detecting functions

**Solution**: Check language-specific patterns in `parser.py` and adjust extraction logic

## License

This project is part of the GRADELOOP research initiative at SLIIT.

## Contributing

Contributions are welcome! Please ensure:

- Code follows Python 3.10+ type hints
- All functions have docstrings
- Unit tests are included
- Functions are Jupyter-friendly (return values)

## Citation

If you use this tool in your research, please cite:

```
GRADELOOP Code Clone Detection Pipeline
SLIIT Research Project, 2025
```
