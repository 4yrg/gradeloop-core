import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.pipeline import CloneDetectionPipeline
import json
import logging
from tqdm import tqdm

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def index_dataset(data_path, output_dir="models/index"):
    pipeline = CloneDetectionPipeline()
    
    # Load adapter if available
    adapter_path = "models/adapter"
    if os.path.exists(adapter_path):
        logging.info("Loading trained adapter for better embeddings...")
        try:
            pipeline.load_adapter(adapter_path)
        except Exception as e:
            logging.warning(f"Could not load adapter: {e}")
            
    # Load Data
    logging.info(f"Loading data from {data_path}...")
    data = []
    if data_path.endswith('.jsonl'):
        with open(data_path, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    data.append(json.loads(line))
    else:
        with open(data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
    logging.info(f"Found {len(data)} items. Indexing unique code fragments...")
    
    # Extract unique code fragments to index
    # We index individual fragments so we can find 'similar fragments'
    
    unique_fragments = {} # hash -> metadata
    
    for item in data:
        code_1 = item.get('code_1') or item.get('code_a')
        code_2 = item.get('code_2') or item.get('code_b')
        
        # We store metadata for retrieval
        # Ideally we'd have an ID. We'll generate one or use problem_id
        
        if code_1 and code_1 not in unique_fragments:
            unique_fragments[code_1] = {"code": code_1, "id": f"frag_{len(unique_fragments)}", "source": "dataset"}
            
        if code_2 and code_2 not in unique_fragments:
            unique_fragments[code_2] = {"code": code_2, "id": f"frag_{len(unique_fragments)}", "source": "dataset"}

    logging.info(f"Unique fragments to index: {len(unique_fragments)}")
    
    batch_size = 32
    fragments = list(unique_fragments.keys())
    metadatas = list(unique_fragments.values())
    
    # Process in batches
    for i in tqdm(range(0, len(fragments), batch_size)):
        batch_code = fragments[i:i+batch_size]
        batch_meta = metadatas[i:i+batch_size]
        
        embeddings = pipeline.get_embeddings(batch_code)
        pipeline.index_embeddings(embeddings, batch_meta)
        
    logging.info(f"Saving index to {output_dir}...")
    pipeline.save_index(output_dir)
    logging.info("Done.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python index_data.py <data_path>")
    else:
        index_dataset(sys.argv[1])
