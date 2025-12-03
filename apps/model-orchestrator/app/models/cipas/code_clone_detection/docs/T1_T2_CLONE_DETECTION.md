# T1 and T2 Clone Detection for Java

This implementation provides large-scale code clone detection using Project CodeNet data, focusing on Type-1 (exact) and Type-2 (renamed) clones.

## Overview

### Clone Types

- **T1 (Type-1) Clones**: Exact clones after normalization
  - Identical code with only whitespace/comment differences removed
  - Detected by hashing normalized source code
- **T2 (Type-2) Clones**: Renamed clones
  - Identical code structure with different identifier names and literal values
  - Detected by canonicalizing token streams and hashing

## Architecture

### Implementation Design

The implementation follows clean software engineering principles:

1. **Modular**: Separate classes for T1 detection, T2 detection, grouping, and orchestration
2. **Deterministic**: No randomness - same input always produces same output
3. **Extensible**: Easy to adapt to other programming languages
4. **Well-documented**: Extensive comments explaining the "why" behind design decisions

### Key Components

#### `T1CloneDetector`

- Reads normalized Java source files
- Computes SHA-256 hash of entire file content
- Files with identical hashes are exact clones

**Why SHA-256?**

- Deterministic: Same input → same hash
- Collision-resistant: Negligible false positive rate
- Fast: O(n) complexity
- Standard: Widely used and trusted

#### `T2CloneDetector`

- Reads token streams (from javalang)
- Canonicalizes tokens:
  - Identifiers → `id1`, `id2`, `id3`, ... (in order of first occurrence)
  - Literals → `lit1`, `lit2`, `lit3`, ...
  - Preserves: keywords, operators, separators (structure)
- Hashes canonicalized token sequence

**Why Canonicalization Works:**
Code with identical structure but different names produces identical canonicalized sequences.

Example:

```java
// Original A:
int count = 0;

// Original B:
int total = 0;

// Both canonicalize to:
int id1 = lit1 ;
```

#### `CloneGrouper`

- Groups files by hash value
- Generates unordered clone pairs
- Ensures deterministic output through sorting

#### `CloneHashingPipeline`

- Orchestrates the entire process
- Loads metadata
- Processes all files
- Generates all outputs

## Usage

### Running the Script

```bash
cd apps/model-orchestrator/app/models/cipas/code_clone_detection
python scripts/t1_t2_clone_hashing.py
```

### Input Requirements

The script expects the following data structure:

```
data/
├── metadata/
│   └── codenet_index.json          # Ingestion metadata
├── normalized/
│   └── java/
│       └── <problem_id>/
│           └── <submission_id>/
│               └── <submission_id>.java
└── tokens/
    └── java/
        └── <problem_id>/
            └── <submission_id>/
                └── tokens.json
```

### Output Files

All outputs are stored in `data/metadata/`:

#### `t1_t2_hashes.json`

Per-file hash values:

```json
{
  "p00003/s000170221": {
    "t1_hash": "2352f67727a1a9c5c00b07a508b1a6b665e9f18f7a01dfd075a25261bec2e82f",
    "t2_hash": "ae3f2200494d79ce0917c184ec34e5dbe42ace95bec36d8dd53bd32310d6538c"
  }
}
```

#### `t1_groups.json` and `t2_groups.json`

Hash-to-files mappings (only groups with >1 file):

```json
{
  "hash_value": ["problem_id/submission_id1", "problem_id/submission_id2"]
}
```

#### `t1_pairs.csv` and `t2_pairs.csv`

Unordered clone pairs:

```csv
file1,file2
p02264/s296444456,p02264/s319296566
p02389/s018495776,p02389/s471579445
```

## Results

### Sample Run (10,000 files)

```
Total files processed: 10,000

T1 (Exact) Clones:
  - Clone groups: 0
  - Clone pairs: 0

T2 (Renamed) Clones:
  - Clone groups: 91
  - Clone pairs: 149
```

### Interpretation

- **No T1 clones found**: Each normalized submission is unique (no exact duplicates)
- **91 T2 groups found**: 91 distinct code structures with different identifiers
- **149 T2 pairs**: 149 pairs of submissions with identical logic but renamed variables

This is expected behavior in competitive programming datasets where:

- Exact copies are rare (no T1 clones)
- Many solutions follow similar patterns with different variable names (T2 clones)

## Extension to Other Languages

The modular design makes it easy to extend to other languages:

1. **Tokenization**: Use language-specific tokenizer (instead of javalang)
2. **Normalization**: Apply language-specific normalization rules
3. **Token Types**: Adjust token type categories for canonicalization
4. **Rest remains the same**: Hashing, grouping, and pair generation are language-agnostic

### Steps to Add a New Language

1. Create language-specific tokenizer in `scripts/`
2. Create language-specific normalizer in `scripts/`
3. Update token type mapping in `T2CloneDetector.canonicalize_tokens()`
4. Update paths in `CloneHashingPipeline.__init__()`

## Technical Decisions

### Why Hash-Based Detection?

**Advantages:**

- O(n) complexity per file (scalable)
- Deterministic results
- No false positives (with SHA-256)
- Simple implementation
- Easy to distribute/parallelize

**Trade-offs:**

- Requires exact matches (after canonicalization)
- Doesn't detect partial clones (Type-3/Type-4)
- Doesn't handle reordered statements

### Why SHA-256?

- **256 bits of entropy**: 2^256 possible hash values
- **Collision probability**: Negligible for practical dataset sizes
  - For 1 billion files: P(collision) ≈ 4.3 × 10^-60
- **Performance**: Fast and widely optimized
- **Standardization**: Part of Python standard library

### Canonicalization Strategy

**Order-based renaming** (not alphabetical):

- Identifiers/literals renamed in order of first appearance
- Ensures deterministic output
- Preserves code flow and dependencies

**Preserved tokens**:

- Keywords (if, while, return, etc.)
- Operators (+, -, \*, etc.)
- Separators ({, }, ;, etc.)
- Modifiers (public, static, etc.)

These define the code structure and are essential for detecting clones.

## Performance

- **Processing**: ~4 minutes for 10,000 files
- **Memory**: Linear in dataset size
- **Disk I/O**: Read normalized files + token files once
- **Scalability**: Can process millions of files

## Limitations

1. **Exact matching only**: After canonicalization, tokens must match exactly
2. **No partial clones**: Doesn't detect Type-3 (near-miss) or Type-4 (semantic) clones
3. **No reordering**: Statement order must be identical
4. **Single-file focus**: Doesn't detect cross-file clones
5. **Token-level only**: Doesn't use AST structure (future enhancement)

## Future Enhancements

1. **Type-3 clones**: Use fuzzy hashing or edit distance
2. **Type-4 clones**: Use semantic similarity (embeddings)
3. **AST-based detection**: Use abstract syntax trees for structural matching
4. **Cross-file clones**: Detect clones spanning multiple files
5. **Incremental updates**: Only process changed files
6. **Distributed processing**: Parallelize across multiple machines

## References

- Project CodeNet: https://github.com/IBM/Project_CodeNet
- Clone Detection Survey: Roy et al. (2009) - "Comparison and Evaluation of Code Clone Detection Techniques and Tools"
- SHA-256: FIPS PUB 180-4
