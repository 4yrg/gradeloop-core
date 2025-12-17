import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
from app.utils.data_handler import DataAugmentor
import argparse

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Input JSON file with list of code fragments")
    parser.add_argument("--output", required=True, help="Output JSON file")
    parser.add_argument("--variants", type=int, default=2, help="Number of variants per fragment")
    args = parser.parse_args()
    
    augmentor = DataAugmentor()
    
    data = []
    if args.input.endswith('.jsonl'):
        with open(args.input, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    data.append(json.loads(line))
    else:
        with open(args.input, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
    augmented_data = []
    
    # Assuming data is list of strings or list of dicts with 'code' key
    # For pair dataset (code_1, code_2), we might want to augment both or just treat them as independent fragments if structure allows.
    # The current logic handles single 'code' field or raw string.
    # If dataset has 'code_1' and 'code_2', we need to adapt or just skip complex logic for this generic script.
    # Let's verify dataset structure: {"id":..., "code_1":..., "code_2":...}
    # This script as written looks for 'code' key.
    # We will update it to look for code_1/code_2 if present.
    
    for item in data:
        if isinstance(item, dict):
            # Check for standard fields
            code_fields = [k for k in item.keys() if k.startswith('code')]
            if not code_fields and 'code' in item:
                code_fields = ['code']
                
            if code_fields:
                base_meta = item.copy()
                new_items_base = [base_meta.copy() for _ in range(args.variants)]
                
                # For each code field, generate variants
                for field in code_fields:
                    original_code = item[field]
                    if not original_code: continue
                    
                    variants = augmentor.augment(original_code, num_variations=args.variants)
                    
                    # Distribute variants to new items
                    # Logic: Create N new items, each having augmented version of this field
                    # If multiple fields, weaugment all? Or mix?
                    # Simple strategy: Augment each field in the new items
                    for i in range(min(len(variants), args.variants)):
                        new_items_base[i][field] = variants[i]
                        new_items_base[i]['is_augmented'] = True
                
                augmented_data.append(item) # Keep original
                augmented_data.extend(new_items_base)
            else:
                # No code field found, just keep it?
                augmented_data.append(item)
        else:
            # String fragment
            original_code = item
            variants = augmentor.augment(original_code, num_variations=args.variants)
            augmented_data.extend(variants)
            augmented_data.append(original_code)
            
    if args.output.endswith('.jsonl'):
        with open(args.output, 'w', encoding='utf-8') as f:
            for item in augmented_data:
                f.write(json.dumps(item) + '\n')
    else:
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(augmented_data, f, indent=2)
        
    print(f"Augmented data saved to {args.output}. Total items: {len(augmented_data)}")

if __name__ == "__main__":
    main()
