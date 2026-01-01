
import pandas as pd
import numpy as np
import json
import hashlib
from pathlib import Path
import random
from collections import defaultdict, deque

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
PROCESSING_DIR = BASE_DIR / "processing"
RAW_DIR = BASE_DIR / "raw"

BCB_CSV = PROCESSING_DIR / "bcb_filtered.csv"
FRAGMENTS_JSONL = PROCESSING_DIR / "fragments_normalized.jsonl"
CODENET_CSV = RAW_DIR / "codenet_type4_clones.csv"

OUTPUT_DIR = PROCESSING_DIR / "unified"

def get_connected_components(pairs):
    """
    Find connected components of the graph defined by pairs.
    pairs: list of (id1, id2)
    Returns: list of sets, where each set is a component.
    """
    adj = defaultdict(list)
    nodes = set()
    for u, v in pairs:
        adj[u].append(v)
        adj[v].append(u)
        nodes.add(u)
        nodes.add(v)
        
    visited = set()
    components = []
    
    for node in nodes:
        if node not in visited:
            component = set()
            stack = [node]
            visited.add(node)
            while stack:
                curr = stack.pop()
                component.add(curr)
                for neighbor in adj[curr]:
                    if neighbor not in visited:
                        visited.add(neighbor)
                        stack.append(neighbor)
            components.append(component)
    return components

def load_bcb_data():
    print("Loading BCB data...")
    # Load pairs
    df_bcb = pd.read_csv(BCB_CSV)
    
    # Load code map
    print("Loading code fragments...")
    code_map = {}
    with open(FRAGMENTS_JSONL, 'r') as f:
        for line in f:
            data = json.loads(line)
            # We need normalized code? 
            # Prompt A3 output: Normalized token stream, Normalized serialized string.
            # A4 doesn't explicitly say use normalized code, but usually we provide raw.
            # "No overlap... label pairs...".
            # Providing both is good, or raw. Let's provide raw 'code' and let model normalize if needed, 
            # or provide normalized if the prompt implies normalized dataset.
            # Prompt A3 says "Output: Normalized token stream". 
            # Prompt A4 says "Construct a unified dataset... Output three CSV files".
            # I will provide 'code_1', 'code_2' as raw, and maybe 'normalized_code_1', etc. if easy.
            # Let's stick to raw code as base, as simple CSV usually implies source.
            code_map[data['id']] = data['code']
            
    # Map code to dataframe
    # Filter out pairs where code is missing (if any)
    valid_mask = df_bcb['method_id_1'].isin(code_map) & df_bcb['method_id_2'].isin(code_map)
    df_bcb = df_bcb[valid_mask].copy()
    
    df_bcb['code_1'] = df_bcb['method_id_1'].map(code_map)
    df_bcb['code_2'] = df_bcb['method_id_2'].map(code_map)
    df_bcb['source'] = 'BigCloneBench'
    
    # Map types
    type_map = {1: 'type1', 2: 'type2', 3: 'type3', '1': 'type1', '2': 'type2', '3': 'type3'}
    df_bcb['label'] = df_bcb['clone_type'].map(type_map)
    
    # BCB Splitting: Connected Components
    print("Computing BCB connected components...")
    pairs = list(zip(df_bcb['method_id_1'], df_bcb['method_id_2']))
    components = get_connected_components(pairs)
    
    # Assign components to splits
    # Shuffle components
    random.seed(42)
    random.shuffle(components)
    
    # Simple accumulation for 80-10-10
    total_pairs = len(df_bcb)
    train_comps, val_comps, test_comps = [], [], []
    train_count, val_count, test_count = 0, 0, 0
    
    # Component-wise assignment
    current_pairs = 0
    for comp in components:
        # Count pairs in this component
        # Approximate: number of edges in subgraph.
        # This acts as a grouping ID.
        # We can just assign a group_id to each component and join back.
        pass
        
    # Map node -> component_id
    node_to_comp = {}
    for i, comp in enumerate(components):
        for node in comp:
            node_to_comp[node] = i
            
    df_bcb['comp_id'] = df_bcb['method_id_1'].map(node_to_comp)
    
    # Now split by comp_id
    comp_ids = list(range(len(components)))
    random.shuffle(comp_ids)
    
    n_comps = len(comp_ids)
    train_cut = int(0.8 * n_comps)
    val_cut = int(0.9 * n_comps)
    
    train_ids = set(comp_ids[:train_cut])
    val_ids = set(comp_ids[train_cut:val_cut])
    test_ids = set(comp_ids[val_cut:])
    
    def get_split(cid):
        if cid in train_ids: return 'train'
        elif cid in val_ids: return 'val'
        else: return 'test'
        
    df_bcb['split'] = df_bcb['comp_id'].apply(get_split)
    
    return df_bcb[['code_1', 'code_2', 'label', 'split', 'source']]

def load_codenet_data():
    print("Loading CodeNet data...")
    # Read CSV
    # Columns: id, code_1, code_2, type, problem_id_1, problem_id_2, lexical_similarity
    # We might need to chunk if too big, but let's try reading necessary cols.
    # Note: 'type' values are 'type_4', 'non_clone'.
    
    df = pd.read_csv(CODENET_CSV)
    
    # Filter
    df['source'] = 'Project_CodeNet'
    
    # Logic for labels
    def get_label(row):
        t = row['type']
        if t == 'type_4':
            return 'type4'
        elif t == 'non_clone':
            sim = row['lexical_similarity']
            if sim >= 0.5: # Threshold for hard non-clone
                return 'non_clone_hard'
            else:
                return 'non_clone_easy'
        return 'unknown'
        
    df['label'] = df.apply(get_label, axis=1)
    
    # Splitting by Problem ID
    # Constraint: No overlap of projects (problems) between splits.
    # Also valid pairs must be within same split (intra-problem clones) 
    # OR we discard pairs that cross splits (inter-problem non-clones).
    
    # Get all problem IDs
    probs = set(df['problem_id_1'].unique()) | set(df['problem_id_2'].unique())
    probs = list(probs)
    random.seed(42)
    random.shuffle(probs)
    
    n_probs = len(probs)
    train_cut = int(0.8 * n_probs)
    val_cut = int(0.9 * n_probs)
    
    train_probs = set(probs[:train_cut])
    val_probs = set(probs[train_cut:val_cut])
    test_probs = set(probs[val_cut:])
    
    def get_split(row):
        p1 = row['problem_id_1']
        p2 = row['problem_id_2']
        
        # If both in train, train.
        # If both in val, val.
        # If both in test, test.
        # Else: invalid (cross-split).
        
        s1 = 'train' if p1 in train_probs else ('val' if p1 in val_probs else 'test')
        s2 = 'train' if p2 in train_probs else ('val' if p2 in val_probs else 'test')
        
        if s1 == s2:
            return s1
        return None # Drop cross-split pairs
        
    df['split'] = df.apply(get_split, axis=1)
    
    # Drop None splits
    df = df.dropna(subset=['split'])
    
    return df[['code_1', 'code_2', 'label', 'split', 'source']]

def main():
    if not OUTPUT_DIR.exists():
        OUTPUT_DIR.mkdir(parents=True)

    df_bcb = load_bcb_data()
    print(f"BCB processed. Shape: {df_bcb.shape}")
    print(df_bcb['label'].value_counts())
    
    df_cn = load_codenet_data()
    print(f"CodeNet processed. Shape: {df_cn.shape}")
    print(df_cn['label'].value_counts())
    
    # Merge
    df_full = pd.concat([df_bcb, df_cn], ignore_index=True)
    
    # Balanced Sampling
    # Goal: Balanced class distribution per split.
    # We find the min count per split and sample.
    
    final_dfs = {}
    
    for split in ['train', 'val', 'test']:
        df_split = df_full[df_full['split'] == split]
        counts = df_split['label'].value_counts()
        print(f"\nSplit {split} counts (pre-balance):")
        print(counts)
        
        if counts.empty:
            continue

        min_count = counts.min()
        # Cap at a reasonable number if min is too small? 
        # Or if one class is huge, downsample.
        # We start by downsampling majorities to the median or min?
        # "Balanced class distribution" -> Equal count is ideal.
        
        sampled_list = []
        for label in counts.index:
            sub = df_split[df_split['label'] == label]
            if len(sub) > min_count:
                sub = sub.sample(n=min_count, random_state=42)
            sampled_list.append(sub)
            
        df_balanced = pd.concat(sampled_list)
        final_dfs[split] = df_balanced
        
        # Save
        out_path = OUTPUT_DIR / f"{split}.csv" # Prompt asks for CSV. Plan said CSV/Parquet. Prompt A4: "Output three CSV files"
        # Wait, prompt A4 says "Output three CSV files". 
        # "create commits for each step. Do not commit the raw datasets. the processed shuld be a parquet".
        # Contradiction: "Output three CSV files: train.csv..." vs "the processed shuld be a parquet".
        # I will save as parquet as per "processed shuld be a parquet" instruction at the end, 
        # BUT the prompt A4 listing says "Output three CSV files".
        # I will save BOTH or Parquet. Parquet is better for code.
        # User said "processed shuld be a parquet". I will follow that as the format constraint.
        # Whatever, I will save parquet.
        # Actually, "Output three CSV files" is in the prompt text. "the processed shuld be a parquet" is in the user addendum. 
        # I used CSV in A1.
        # I'll save as PARQUET to satisfy the commit instruction constraint.
        
        out_path_pq = OUTPUT_DIR / f"{split}.parquet"
        df_balanced.to_parquet(out_path_pq, index=False)
        print(f"Saved {split}: {len(df_balanced)} rows to {out_path_pq}")
        print(df_balanced['label'].value_counts())

if __name__ == "__main__":
    main()
