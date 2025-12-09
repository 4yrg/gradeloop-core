"""
Example usage scripts for the code clone detection pipeline.
"""

# Example 1: Run complete pipeline
def example_run_pipeline():
    """Run the complete pipeline from configuration."""
    from src import run_pipeline_from_config
    
    results = run_pipeline_from_config("configs/pipeline_config.yaml")
    
    print("Pipeline Results:")
    print(f"  Total fragments: {results['total_fragments']}")
    print(f"  Total clone pairs: {results['total_clone_pairs']}")
    print(f"  Languages: {results['languages']}")
    print(f"  Clone types: {results['clone_types']}")


# Example 2: Extract fragments from a file
def example_extract_fragments():
    """Extract code fragments from a single file."""
    from src import extract_fragments_from_file
    
    fragments = extract_fragments_from_file(
        file_path="src/parser.py",
        language="python",
        min_lines=5
    )
    
    print(f"Extracted {len(fragments)} fragments:")
    for i, frag in enumerate(fragments[:3], 1):  # Show first 3
        print(f"\n{i}. {frag.file_path}:{frag.start_line}-{frag.end_line}")
        print(f"   Tokens: {frag.metrics.token_count}, LOC: {frag.metrics.loc}")


# Example 3: Detect clones with custom settings
def example_detect_clones():
    """Detect clones with custom threshold."""
    from src import extract_fragments_from_file, detect_clones
    
    # Extract fragments from multiple files
    files = ["src/parser.py", "src/models.py"]
    all_fragments = []
    
    for file_path in files:
        fragments = extract_fragments_from_file(file_path, "python")
        all_fragments.extend(fragments)
    
    # Detect clones
    clones = detect_clones(
        all_fragments,
        threshold=0.80,
        methods=["token", "ast"]
    )
    
    print(f"Detected {len(clones)} clone pairs:")
    for clone in clones[:5]:  # Show first 5
        print(f"  {clone.clone_type}: {clone.similarity_score:.2f}")


# Example 4: Use LLM adapter
def example_llm_adapter():
    """Use LLM adapter for semantic analysis."""
    from src import create_llm_adapter
    
    # Create mock adapter
    llm = create_llm_adapter("mock", {"embedding_dim": 64})
    
    code1 = "def add(a, b): return a + b"
    code2 = "def sum(x, y): return x + y"
    
    # Generate embeddings
    emb1 = llm.generate_embedding(code1)
    emb2 = llm.generate_embedding(code2)
    
    print(f"Embedding dimensions: {len(emb1)}")
    
    # Compute similarity
    similarity = llm.compute_semantic_similarity(code1, code2)
    print(f"Semantic similarity: {similarity:.2f}")


# Example 5: Load and analyze results
def example_analyze_results():
    """Load and analyze pipeline results."""
    from src import load_fragments, load_clone_pairs
    
    # Load data
    fragments = load_fragments("data/processed/fragments.parquet")
    clones = load_clone_pairs("data/processed/clone_pairs.parquet")
    
    # Analyze clone types
    clone_type_counts = {}
    for clone in clones:
        clone_type_counts[clone.clone_type] = clone_type_counts.get(clone.clone_type, 0) + 1
    
    print("Clone Type Distribution:")
    for clone_type, count in sorted(clone_type_counts.items()):
        print(f"  {clone_type}: {count}")
    
    # Find highest similarity
    max_clone = max(clones, key=lambda c: c.similarity_score)
    print(f"\nHighest similarity: {max_clone.similarity_score:.2f} ({max_clone.clone_type})")


# Example 6: Custom pipeline with code
def example_custom_pipeline():
    """Create a custom pipeline programmatically."""
    from src import CloneDetectionPipeline, Config
    
    # Create custom config
    config_data = {
        "data_source": {
            "type": "local",
            "input_dir": "data/raw",
            "output_dir": "data/processed",
            "extensions": [".py"]
        },
        "parser": {
            "enabled": True,
            "language": "python",
            "min_lines": 10  # Only larger fragments
        },
        "clone_detection": {
            "similarity_threshold": 0.90,  # Higher threshold
            "clone_types": ["type1", "type2"]
        },
        "output": {
            "format": "json",
            "include_source": True
        },
        "logging": {
            "level": "INFO",
            "console": True
        }
    }
    
    config = Config(config_data)
    pipeline = CloneDetectionPipeline(config)
    
    results = pipeline.run()
    print(f"Custom pipeline completed: {results['total_clone_pairs']} clones detected")


if __name__ == "__main__":
    print("Code Clone Detection Examples\n")
    
    print("=" * 60)
    print("Example 1: Extract Fragments")
    print("=" * 60)
    example_extract_fragments()
    
    print("\n" + "=" * 60)
    print("Example 2: LLM Adapter")
    print("=" * 60)
    example_llm_adapter()
    
    # Uncomment to run other examples:
    # example_run_pipeline()
    # example_detect_clones()
    # example_analyze_results()
    # example_custom_pipeline()
