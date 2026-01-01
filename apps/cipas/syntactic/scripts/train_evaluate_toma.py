
import pandas as pd
import numpy as np
import joblib
import argparse
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from pathlib import Path
import sys
import math
import rapidfuzz
from collections import Counter
from tqdm import tqdm

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent.parent
sys.path.append(str(BASE_DIR))
DATA_PATH = BASE_DIR / "apps" / "cipas" / "datasets" / "processing" / "unixcoder_training_data.parquet"
MODEL_DIR = BASE_DIR / "apps" / "cipas" / "models"
MODEL_PATH = MODEL_DIR / "classifier.joblib"

# Re-implement feature calc to avoid complex imports if services not ready/independent
def tokenize(code: str):
    import re
    return re.findall(r"[\w]+|[^\s\w]", code)

def compute_features(code_a: str, code_b: str) -> list:
    tokens_a = tokenize(code_a)
    tokens_b = tokenize(code_b)
    
    set_a = set(tokens_a)
    set_b = set(tokens_b)
    intersection = len(set_a.intersection(set_b))
    union = len(set_a.union(set_b))
    
    jaccard = intersection / union if union > 0 else 0.0
    dice = (2 * intersection) / (len(set_a) + len(set_b)) if (len(set_a) + len(set_b)) > 0 else 0.0
    
    tf_a = Counter(tokens_a)
    tf_b = Counter(tokens_b)
    dot_product = sum(tf_a[t] * tf_b[t] for t in set_a.intersection(set_b))
    mag_a = math.sqrt(sum(c**2 for c in tf_a.values()))
    mag_b = math.sqrt(sum(c**2 for c in tf_b.values()))
    cosine = dot_product / (mag_a * mag_b) if (mag_a * mag_b) > 0 else 0.0
    
    lev_dist = rapidfuzz.distance.Levenshtein.normalized_similarity(code_a, code_b)
    lev_ratio = rapidfuzz.fuzz.ratio(code_a, code_b) / 100.0
    jaro_winkler = rapidfuzz.distance.JaroWinkler.similarity(code_a, code_b)
    
    return [jaccard, dice, cosine, lev_dist, lev_ratio, jaro_winkler]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None)
    args = parser.parse_args()

    if not DATA_PATH.exists():
        print(f"Data not found: {DATA_PATH}")
        return

    print("Loading data...")
    df = pd.read_parquet(DATA_PATH)
    if args.limit:
        df = df.head(args.limit)
        
    # Prepare training data
    # Class 1: Anchor - Positive
    # Class 0: Anchor - Hard Negative (and Easy Negative)
    
    X = []
    y = []
    
    print("Computing features...")
    for _, row in tqdm(df.iterrows(), total=len(df)):
        anchor = row['anchor']
        
        # Positive
        pos = row['positive']
        feats = compute_features(anchor, pos)
        X.append(feats)
        y.append(1)
        
        # Hard Negatives
        for neg in row['hard_negatives']:
            feats = compute_features(anchor, neg)
            X.append(feats)
            y.append(0)
            
        # Easy Negatives (Optional: include to make model robust to obvious non-clones?)
        # TOMA is usually for "Candidates" (filtered by token overlap).
        # Hard Negatives ARE candidates. Easy Negatives might not even pass token overlap.
        # But including them helps generalization.
        for neg in row['easy_negatives']:
            feats = compute_features(anchor, neg)
            X.append(feats)
            y.append(0)
            
    X = np.array(X)
    y = np.array(y)
    
    print(f"Dataset shape: {X.shape}")
    print(f"Class distribution: {Counter(y)}")
    
    # Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Random Forest...")
    clf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    clf.fit(X_train, y_train)
    
    print("Evaluating...")
    y_pred = clf.predict(X_test)
    print(classification_report(y_test, y_pred))
    
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(clf, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")

if __name__ == "__main__":
    main()
