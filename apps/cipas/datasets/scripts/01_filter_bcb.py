
import pandas as pd
import hashlib
import os
import shutil
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
RAW_PARQUET = BASE_DIR / "raw" / "bigclonebench_400k.parquet"
PROCESSING_DIR = BASE_DIR / "processing"
OUTPUT_CSV = PROCESSING_DIR / "bcb_filtered.csv"
SOURCE_DIR = PROCESSING_DIR / "bcb_source"

def get_method_id(code: str) -> str:
    """Generate a stable ID for the code content."""
    return hashlib.md5(code.encode('utf-8')).hexdigest()

def main():
    print(f"Loading data from {RAW_PARQUET}...")
    df = pd.read_parquet(RAW_PARQUET)
    
    initial_count = len(df)
    print(f"Total pairs loaded: {initial_count}")
    
    # 1. Filter Clone Types
    # Keep 1, 2, 3. Assume '3' covers the requirement or is the best we have.
    allowed_types = ['1', '2', '3']
    df_filtered = df[df['clone_type'].isin(allowed_types)].copy()
    print(f"Pairs after filtering types {allowed_types}: {len(df_filtered)}")
    
    # 2. Remove missing or empty code
    df_filtered = df_filtered[
        (df_filtered['code_1'].notna()) & (df_filtered['code_1'] != "") &
        (df_filtered['code_2'].notna()) & (df_filtered['code_2'] != "")
    ]
    print(f"Pairs after removing missing code: {len(df_filtered)}")
    
    # 3. Generate Method IDs
    # Map code -> ID to ensure uniqueness
    # We collect all unique code snippets first
    unique_code = {} # hash -> code
    
    method_id_1 = []
    method_id_2 = []
    
    print("Generating method IDs and processing pairs...")
    for idx, row in df_filtered.iterrows():
        c1 = row['code_1']
        c2 = row['code_2']
        
        id1 = get_method_id(c1)
        id2 = get_method_id(c2)
        
        unique_code[id1] = c1
        unique_code[id2] = c2
        
        method_id_1.append(id1)
        method_id_2.append(id2)
        
    df_filtered['method_id_1'] = method_id_1
    df_filtered['method_id_2'] = method_id_2
    
    # 4. Remove duplicate pairs
    # Create a canonical pair key (min_id, max_id) to avoid (A, B) and (B, A) duplicates
    # assuming undirected graph
    df_filtered['pair_key'] = df_filtered.apply(
        lambda r: tuple(sorted([r['method_id_1'], r['method_id_2']])), axis=1
    )
    
    df_dedup = df_filtered.drop_duplicates(subset=['pair_key'])
    print(f"Pairs after deduplication: {len(df_dedup)}")
    
    # 5. Export CSV
    output_cols = ['method_id_1', 'method_id_2', 'clone_type']
    df_dedup[output_cols].to_csv(OUTPUT_CSV, index=False)
    print(f"Saved filtered dataset to {OUTPUT_CSV}")
    
    # 6. Save Source Files
    if SOURCE_DIR.exists():
        shutil.rmtree(SOURCE_DIR)
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    
    print(f"Saving {len(unique_code)} unique methods to {SOURCE_DIR}...")
    for mid, code in unique_code.items():
        # Wrap in a class to ensure it's valid Java for parsing if needed, 
        # but prompt says "Java method-level clone pairs", implying snippets.
        # Tree-sitter can parse methods if we know they are methods.
        # However, writing them as files: usually .java expects a class.
        # But A2 checks for "Extract method-level code fragments". 
        # If I save them as raw files, they might not be valid Java files (compilable),
        # but Tree-sitter can parse them. 
        # For valid parsing, wrapping in `class Dummy { ... }` is safer.
        # But A3 says "Remove comments...". 
        # I will save as is for now, or wrapped. 
        # The prompt A2 says "Parse the file into an AST... Extract method-level code fragments".
        # If I save just the method, A2 might fail if it expects a class.
        # I will wrap it in a dummy class.
        
        content = f"public class Method_{mid} {{\n{code}\n}}"
        
        file_path = SOURCE_DIR / f"{mid}.java"
        with open(file_path, "w") as f:
            f.write(content)
            
    print("Done.")
    print("\nStatistics:")
    print(df_dedup['clone_type'].value_counts())

if __name__ == "__main__":
    main()
