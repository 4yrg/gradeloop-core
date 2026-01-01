
import pandas as pd
import json
import hashlib
from pathlib import Path
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import sys

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent
DATASETS_DIR = BASE_DIR / "apps" / "cipas" / "datasets"
BCB_CSV = DATASETS_DIR / "processing" / "bcb_filtered.csv"
FRAGMENTS_JSONL = DATASETS_DIR / "processing" / "fragments_normalized.jsonl" # Use normalized for Tier 1 usually? Or raw? 
# "Standard tokenization and blind renaming (Type-2)" - Tier 1 is Type-1 (Exact match). 
# Exact match on RAW code is Type-1.
# Exact match on NORMALIZED code is Type-2.
# Prompt B1: "Tier 1: Fast hash-based filtering for Type-1 clones." -> Implies Raw or ignoring whitespace.
# Let's try Raw first. If Fragments file has 'code' as raw, we use that.

def load_code_map(jsonl_path):
    code_map = {}
    print(f"Loading code from {jsonl_path}...")
    try:
        with open(jsonl_path, 'r') as f:
            for line in f:
                data = json.loads(line)
                code_map[data['id']] = data['code']
    except Exception as e:
        print(f"Error loading code map: {e}")
    return code_map

def compute_hash(content: str) -> str:
    # Standardize: remove whitespace? Type-1 allows for whitespace/comment variations usually.
    # But strict hashing needs normalization of whitespace.
    # Let's strip and remove all whitespace for robust Type-1.
    clean = "".join(content.split())
    return hashlib.md5(clean.encode('utf-8')).hexdigest()

def main():
    if not BCB_CSV.exists():
        print(f"Dataset not found: {BCB_CSV}")
        return

    print("Loading BCB pairs...")
    df = pd.read_csv(BCB_CSV)
    
    # Filter for Type 1 and Non-Clones for evaluation
    # existing types: 1, 2, 3, 0 (non-clone)
    # We want to see if Hash detects Type 1 and ignores Non-Clones.
    # We can also check Type 2/3 - they should NOT match hash (Recall should be 0 for them, which is correct for Tier 1).
    # Precision/Recall for "Is it a Type-1 clone?"
    
    # Let's evaluate on Type-1 vs Non-Clone
    eval_df = df[df['clone_type'].isin([1, 0])].copy()
    
    # If no type 1/0, fallback to all
    if len(eval_df) == 0:
        print("No Type-1/Non-Clone data found. Using all data.")
        eval_df = df.copy()
        
    code_map = load_code_map(FRAGMENTS_JSONL)
    
    print(f"Evaluating Tier 1 on {len(eval_df)} pairs...")
    
    y_true = []
    y_pred = []
    
    for _, row in eval_df.iterrows():
        id1, id2 = row['method_id_1'], row['method_id_2']
        if id1 not in code_map or id2 not in code_map:
            continue
            
        c1 = code_map[id1]
        c2 = code_map[id2]
        
        h1 = compute_hash(c1)
        h2 = compute_hash(c2)
        
        pred = 1 if h1 == h2 else 0
        
        # Ground truth
        # clone_type 1 -> 1
        # clone_type 0 -> 0
        # If we included type 2/3, they are technically clones, but Type-1 detector should classify them as 0?
        # Or should we only evaluate on Type 1 vs Non-Clone?
        # Let's assume we are evaluating "Type-1 Detector". 
        # So True Positive = Type 1 detected as Clone.
        # False Positive = Non-Clone detected as Clone.
        
        label = 1 if row['clone_type'] == 1 else 0
        
        y_true.append(label)
        y_pred.append(pred)
        
    print("\nTier 1 (Hasher) Evaluation (Type-1 vs Non-Clone):")
    if len(y_true) > 0:
        print(classification_report(y_true, y_pred, target_names=["Non-Clone", "Type-1"]))
        print(f"Accuracy: {accuracy_score(y_true, y_pred):.4f}")
        print("Confusion Matrix:")
        print(confusion_matrix(y_true, y_pred))
    else:
        print("No valid pairs to evaluate.")

if __name__ == "__main__":
    main()
