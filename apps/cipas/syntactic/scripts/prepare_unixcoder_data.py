
import pandas as pd
import rapidfuzz
import random
import re
import argparse
from typing import List, Set, Dict, Tuple
from pathlib import Path
from collections import defaultdict, Counter
import math


# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent
DATASETS_DIR = BASE_DIR / "apps" / "cipas" / "datasets"
INPUT_CSV = DATASETS_DIR / "raw" / "codenet_type4_clones.csv"
OUTPUT_PARQUET = DATASETS_DIR / "processing" / "unixcoder_training_data.parquet"

def tokenize(code: str) -> List[str]:
    """Simple regex tokenizer for words and symbols."""
    return re.findall(r"[\w]+|[^\s\w]", code)

def compute_similarity_features(code_a: str, code_b: str, tokens_a: List[str], tokens_b: List[str]) -> List[float]:
    """
    Compute 6-dimensional similarity metrics.
    Returns [Jaccard, Dice, Cosine, LevDist, LevRatio, JaroWinkler]
    All normalized to [0, 1].
    """
    set_a = set(tokens_a)
    set_b = set(tokens_b)
    intersection = len(set_a.intersection(set_b))
    union = len(set_a.union(set_b))
    
    # 1. Jaccard
    jaccard = intersection / union if union > 0 else 0.0
    
    # 2. Sørensen–Dice
    dice = (2 * intersection) / (len(set_a) + len(set_b)) if (len(set_a) + len(set_b)) > 0 else 0.0
    
    # 3. Cosine Similarity (TF vectors)
    tf_a = Counter(tokens_a)
    tf_b = Counter(tokens_b)
    
    dot_product = sum(tf_a[t] * tf_b[t] for t in set_a.intersection(set_b))
    mag_a = math.sqrt(sum(c**2 for c in tf_a.values()))
    mag_b = math.sqrt(sum(c**2 for c in tf_b.values()))
    
    cosine = dot_product / (mag_a * mag_b) if (mag_a * mag_b) > 0 else 0.0
    
    # String-based metrics (Rapidfuzz)
    # 4. Levenshtein Distance (Normalized)
    lev_dist = rapidfuzz.distance.Levenshtein.normalized_similarity(code_a, code_b)
    
    # 5. Levenshtein Ratio (Fuzz Ratio)
    lev_ratio = rapidfuzz.fuzz.ratio(code_a, code_b) / 100.0
    
    # 6. Jaro-Winkler
    jaro_winkler = rapidfuzz.distance.JaroWinkler.similarity(code_a, code_b)
    
    return [jaccard, dice, cosine, lev_dist, lev_ratio, jaro_winkler]

class InvertedIndex:
    def __init__(self):
        self.index = defaultdict(list)
        self.methods = [] # Stores (code, problem_id) tuples

    def add_method(self, code: str, problem_id: str):
        idx = len(self.methods)
        self.methods.append((code, problem_id))
        tokens = set(tokenize(code))
        for token in tokens:
            self.index[token].append(idx)

    def search(self, query_tokens: List[str], min_overlap: int = 1) -> Set[int]:
        candidates = Counter()
        query_token_set = set(query_tokens)
        
        for token in query_token_set:
            if token in self.index:
                for idx in self.index[token]:
                    candidates[idx] += 1
        
        return {idx for idx, count in candidates.items() if count >= min_overlap}

def main():
    parser = argparse.ArgumentParser(description="Prepare UniXcoder training data")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of rows to process")
    parser.add_argument("--n_hard", type=int, default=2, help="Number of hard negatives per anchor")
    parser.add_argument("--n_easy", type=int, default=2, help="Number of easy negatives per anchor")
    args = parser.parse_args()

    print(f"Loading data from {INPUT_CSV}...")
    # Load only necessary columns to save memory, if possible. 
    # Provided CSV structure from previous turn: id, code_1, code_2, type, problem_id_1, problem_id_2, lexical_similarity
    # We filter by type='type_4'.
    
    df = pd.read_csv(INPUT_CSV)
    df = df[df['type'] == 'type_4'].copy()
    
    if args.limit:
        df = df.head(args.limit)
        
    print(f"Processing {len(df)} Type-4 pairs...")

    # 1. Build Candidate Pool & Index
    print("Building Inverted Index...")
    inv_index = InvertedIndex()
    
    # We can use all unique codes from the loaded DF as the pool
    # Or ideally, the WHOLE dataset (including non_clones) to find negatives?
    # For now, let's use the unique codes present in the Type-4 dataframe to ensure valid problem_ids
    # Actually, using only Type-4 codes might limit the diversity of negatives (they are all solutions to SOME problem).
    # That is fine for "Source Code" domain.
    
    unique_methods = {} # (problem_id, code) -> idx (dedup)
    
    # Collect all unique methods
    all_rows = []
    # We iterate and collect unique code blocks
    # Using a dict to dedup by content might be dangerous if same code used for diff problems (unlikely for solutions)
    # But let's assume unique content.
    
    candidate_list = [] # List for random sampling
    
    # Helper to add to index
    def process_row_codes(row):
        p1, c1 = row['problem_id_1'], row['code_1']
        p2, c2 = row['problem_id_2'], row['code_2']
        return [(p1, c1), (p2, c2)]

    # Flatten
    print("Extracting unique methods...")
    temp_pool = set()
    for _, row in df.iterrows():
        temp_pool.add((row['problem_id_1'], row['code_1']))
        temp_pool.add((row['problem_id_2'], row['code_2']))
        
    print(f"Indexing {len(temp_pool)} unique methods...")
    for pid, code in temp_pool:
        inv_index.add_method(code, pid)
        candidate_list.append((code, pid))
        
    # 2. Generate Training Pairs
    training_data = []
    
    print("Generating Training Pairs...")
    for _, row in df.iterrows():
        anchor_code = row['code_1']
        positive_code = row['code_2']
        anchor_problem = row['problem_id_1']
        
        # Determine max hard negatives we need
        # We need to find candidates that have HIGH similarity but DIFFERENT problem_id
        
        anchor_tokens = tokenize(anchor_code)
        
        # Search candidates
        # Min overlap: heuristic 10%
        cand_indices = inv_index.search(anchor_tokens, min_overlap=max(1, int(len(anchor_tokens) * 0.1)))
        
        potential_hard_negatives = []
        
        for idx in cand_indices:
            cand_code, cand_prob = inv_index.methods[idx]
            
            # Rule: Must be different problem
            if cand_prob == anchor_problem:
                continue
            
            # Compute TOMA score
            cand_tokens = tokenize(cand_code)
            # Optimization: check length ratio first
            len_ratio = len(cand_tokens) / len(anchor_tokens) if len(anchor_tokens) > 0 else 0
            if not (0.5 <= len_ratio <= 2.0):
                continue
                
            feats = compute_similarity_features(anchor_code, cand_code, anchor_tokens, cand_tokens)
            score = sum(feats) / len(feats)
            
            potential_hard_negatives.append({
                "code": cand_code,
                "score": score
            })
            
        # Sort by score descending
        potential_hard_negatives.sort(key=lambda x: x["score"], reverse=True)
        
        # Select top K
        hard_negatives = [x["code"] for x in potential_hard_negatives[:args.n_hard]]
        
        # If not enough hard negatives, fill with random? Or just keep what we have?
        # Let's fill with random if needed, or just leave as is. 
        # For strict contrastive learning, valid hard negatives are crucial.
        # Impl: Take what we have.
        
        # Easy Negatives
        easy_negatives = []
        while len(easy_negatives) < args.n_easy:
            # Random sample
            r_code, r_prob = random.choice(candidate_list)
            if r_prob != anchor_problem and r_code != anchor_code:
                easy_negatives.append(r_code)
                
        # Construct Record
        training_data.append({
            "anchor": anchor_code,
            "positive": positive_code,
            "hard_negatives": hard_negatives,
            "easy_negatives": easy_negatives
        })

    # Save
    print(f"Saving {len(training_data)} samples to {OUTPUT_PARQUET}...")
    df_out = pd.DataFrame(training_data)
    OUTPUT_PARQUET.parent.mkdir(parents=True, exist_ok=True)
    df_out.to_parquet(OUTPUT_PARQUET, index=False)
    print("Done.")

if __name__ == "__main__":
    main()
