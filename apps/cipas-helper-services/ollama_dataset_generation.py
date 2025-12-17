
import sys
import os
import subprocess
import time
import uuid
import re
import argparse
import tempfile
from pathlib import Path
import json
import logging
import requests

# --- Configuration & Constants ---

DEFAULT_OLLAMA_URL = "http://localhost:11434/api/generate"
# Updated to use deepseek-coder by default as it is stronger, but user can override
DEFAULT_MODEL = "deepseek-coder:6.7b" 

TYPE1_PROMPT_TEMPLATE = """You are a Java code formatter. Transform this Java code by ONLY changing formatting while preserving all semantics.
Rules:
1. MUST have class name as "Main"
2. ONLY change formatting (whitespace, indentation)
3. DO NOT rename variables or modify logic
4. Output raw Java code ONLY (no markdown blocks)

Original Code:
<<<CODE_PLACEHOLDER>>>

Formatted Code:"""

TYPE2_PROMPT_TEMPLATE = """You are a Java refactoring assistant. Transform this code by renaming identifiers and changing literals while preserving exact behavior.
Rules:
1. MUST have class name as "Main"
2. Rename variables/methods (except main)
3. Change literals (e.g. 10 -> 0xA)
4. NO logic changes
5. Output raw Java code ONLY

Original Code:
<<<CODE_PLACEHOLDER>>>

Refactored Code:"""

TYPE3_PROMPT_TEMPLATE = """You are a Java code mutator. Transform this code with MODERATE statement-level modifications while preserving exact program behavior.

**TYPE-3 CLONE REQUIREMENTS (Maintain >60% similarity):**
Perform EXACTLY 2 or 3 of these modifications:
1. Replace for loops with while loops
2. Break up complex expressions (temp variables)
3. Add dead code / unused variables
4. Reorder independent statements
5. Replace if-else with ternary

**Examples:**
Input: `for(int i=0; i<n; i++) sum+=i;`
Output: `int i=0; while(i<n) { sum+=i; i++; }`

Input: `return a * b;`
Output: `int res = a * b; return res;`

**Rules:**
1. Class name must be "Main"
2. Preserve exact input/output behavior
3. Output raw Java code ONLY

Original Code:
<<<CODE_PLACEHOLDER>>>

Structurally Modified Code:"""

TYPE4_PROMPT_TEMPLATE = """You are an expert Java programmer. Rewrite this code using a completely different algorithm while maintaining identical observable behavior.
Rules:
1. Class name must be "Main"
2. Completely different algorithm/approach
3. Identical Input/Output behavior
4. Output raw Java code ONLY

Original Code:
<<<CODE_PLACEHOLDER>>>

Rewritten Code:"""

EASY_NONCLONE_PROMPT_TEMPLATE = """Create a simple, different Java program that solves a basic algorithmic problem.
Rules:
1. Class name "Main"
2. Completely different problem domain
3. No reuse of variables/logic from reference
4. Output raw Java code ONLY

Reference Code (Avoid this):
<<<CODE_PLACEHOLDER>>>

New Program:"""

HARD_NONCLONE_PROMPT_TEMPLATE = """Create a sophisticated Java program that has similar structure but different semantics (Hard Non-Clone).
Rules:
1. Class name "Main"
2. Similar control flow/structure to reference
3. DIFFERENT semantic problem/output
4. Output raw Java code ONLY

Reference Code (Mimic structure but change meaning):
<<<CODE_PLACEHOLDER>>>

New Program:"""

REPAIR_PROMPT_TEMPLATE = """Fix the validation errors in this Java code.
Rules:
1. Class name "Main"
2. Fix the error below
3. Output raw Java code ONLY

Code:
<<<CODE_PLACEHOLDER>>>

Error:
<<<ERROR_PLACEHOLDER>>>

Fixed Code:"""

# --- Helpers ---

try:
    from colorama import Fore, Style, init
    import pandas as pd
    import jsonlines
    from tqdm import tqdm
    init(autoreset=True)
except ImportError:
    # Minimal fallback
    class Fore: 
        RED = ""; GREEN = ""; YELLOW = ""; CYAN = ""; MAGENTA = ""; RESET = ""
    class Style: 
        RESET_ALL = ""
    def tqdm(iterable=None, *args, **kwargs): return iterable

def normalize_unicode_to_ascii(text):
    replacements = {'\u201c': '"', '\u201d': '"', '\u00a0': ' '}
    for k, v in replacements.items(): text = text.replace(k, v)
    return text.encode('ascii', 'ignore').decode('ascii')

def sanitize_code_from_model(raw_text):
    if not raw_text: return None
    text = normalize_unicode_to_ascii(raw_text.strip())
    
    # Extract code blocks
    if "```" in text:
        blocks = text.split("```")
        for i, block in enumerate(blocks):
            if i % 2 == 1: # Odd are code blocks
                block = block.replace("java", "", 1).strip()
                if "class" in block or "main" in block:
                    text = block
                    break
        else:
             # If loop finishes without break, just clean up markers
             text = text.replace("```java", "").replace("```", "")
    
    # Wrapping logic
    if "class Main" in text: return text.strip()
    
    if "public static void main" in text and "class " not in text:
        return f"public class Main {{\n{text}\n}}"
        
    if "public class" not in text and "class Main" not in text and len(text) > 10:
         if "public static void main" not in text:
             return f"public class Main {{\n    public static void main(String[] args) {{\n{text}\n    }}\n}}"

    return text.strip()

def quick_check_code_quality(code_str):
    if not code_str or len(code_str) < 20: return False, "Code too short"
    if "class Main" not in code_str: return False, "Missing 'class Main'"
    if "main(" not in code_str: return False, "Missing main method"
    if code_str.count('{') != code_str.count('}'): return False, "Unbalanced braces"
    return True, "OK"

def compile_java(temp_dir):
    java_file = Path(temp_dir) / "Main.java"
    if not java_file.exists(): return False, "Main.java not found"
    try:
        res = subprocess.run(["javac", str(java_file)], cwd=temp_dir, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=10)
        return (True, None) if res.returncode == 0 else (False, res.stderr.decode('utf-8', errors='ignore')[:500])
    except Exception as e: return False, str(e)

def run_java_with_input(temp_dir, input_str, timeout=3):
    try:
        res = subprocess.run(["java", "Main"], cwd=temp_dir, input=input_str.encode('utf-8'), stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout)
        if res.returncode != 0: return None, res.stderr.decode('utf-8', errors='ignore')[:500]
        return res.stdout.decode('utf-8', errors='ignore'), None
    except Exception as e: return None, str(e)

def normalize_output(text):
    if not text: return ""
    return '\n'.join(line.rstrip() for line in text.strip().splitlines()).strip()

def load_testcases(codenet_df, problem_id):
    df = codenet_df[codenet_df['problem_id'] == problem_id]
    if 'language' in df.columns: df = df[df['language'].str.lower() == 'java']
    if 'status' in df.columns: df = df[df['status'].str.lower() == 'accepted']
    df = df[df['inputs'].notnull() & df['outputs'].notnull()]
    if df.empty: return []
    row = df.iloc[0]
    return [(str(row['inputs']), str(row['outputs']))]

def validate_java(code_str, problem_id, codenet_df):
    testcases = load_testcases(codenet_df, problem_id)
    if not testcases: return "no_tests"
    with tempfile.TemporaryDirectory() as temp_dir:
        (Path(temp_dir) / "Main.java").write_text(code_str, encoding='utf-8')
        c_success, c_err = compile_java(temp_dir)
        if not c_success: return f"compile_error: {c_err}"
        for inp, exp in testcases:
            out, err = run_java_with_input(temp_dir, inp)
            if err: return f"runtime_error: {err}"
            if normalize_output(out) != normalize_output(exp): return "wrong_answer"
        return "passed"

def validate_similarity(original, generated, threshold=0.6):
    from difflib import SequenceMatcher
    def norm(c): return re.sub(r'\s+', ' ', c).strip()
    ratio = SequenceMatcher(None, norm(original), norm(generated)).ratio()
    return ratio > threshold, ratio

def list_problems(codenet_df):
    return sorted(codenet_df['problem_id'].unique())

def choose_seed(codenet_df, problem_id):
    df = codenet_df[codenet_df['problem_id'] == problem_id]
    if df.empty: return None, None
    row = df.iloc[0]
    return row.get('source_code'), row.get('submission_id')

# --- OLLAMA CLIENT ---

def call_ollama(prompt, model, url=DEFAULT_OLLAMA_URL):
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.2,
            "num_predict": 1024
        }
    }
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        return response.json().get('response', ""), None
    except Exception as e:
        if 'response' in locals() and hasattr(response, 'text'):
             return None, f"{str(e)} - Server Response: {response.text}"
        return None, str(e)

# --- GENERATION LOGIC ---

def generate_with_repair(prompt, problem_id, codenet_df, model, max_retries=1):
    # Initial Generation
    raw, err = call_ollama(prompt, model)
    if err: 
        print(f"Ollama Error: {err}")
        return None
    
    code = sanitize_code_from_model(raw)
    valid, reason = quick_check_code_quality(code)
    
    msg = reason
    if valid:
        if problem_id:
            res = validate_java(code, problem_id, codenet_df)
            if res == "passed": return code
            msg = res
        else:
             with tempfile.TemporaryDirectory() as td:
                 (Path(td)/"Main.java").write_text(code, encoding='utf-8')
                 res, err = compile_java(td)
                 if res: return code
                 msg = err
    
    # Repair
    print(f"  {Fore.YELLOW}Repairing error: {msg}{Style.RESET_ALL}")
    
    # Auto-fix wrapper before asking LLM
    if "Missing 'class Main'" in str(msg) or "Missing main method" in str(msg):
        if "class Main" not in code:
            if "public static void main" in code:
                 code = f"public class Main {{\n{code}\n}}"
            else:
                 code = f"public class Main {{\n    public static void main(String[] args) {{\n{code}\n    }}\n}}"
            
            valid, reason = quick_check_code_quality(code)
            if valid:
                 if problem_id:
                     if validate_java(code, problem_id, codenet_df) == "passed": return code
                 else:
                     return code

    # LLM Repair
    repair_prompt = REPAIR_PROMPT_TEMPLATE.replace("<<<CODE_PLACEHOLDER>>>", code).replace("<<<ERROR_PLACEHOLDER>>>", str(msg))
    raw_repair, err = call_ollama(repair_prompt, model)
    
    repaired = sanitize_code_from_model(raw_repair)
    valid, reason = quick_check_code_quality(repaired)
    if valid:
        if problem_id:
            if validate_java(repaired, problem_id, codenet_df) == "passed": return repaired
        else:
            with tempfile.TemporaryDirectory() as td:
                 (Path(td)/"Main.java").write_text(repaired, encoding='utf-8')
                 if compile_java(td)[0]: return repaired
                 
    return None

def main():
    parser = argparse.ArgumentParser(description="Ollama Java Clone Generator")
    parser.add_argument("--type", type=str, required=True, 
                        choices=['type1', 'type2', 'type3', 'type4', 'nonclone_easy', 'nonclone_hard'],
                        help="Specific clone type to generate")
    parser.add_argument("--model", type=str, default=DEFAULT_MODEL, help="Ollama model name (e.g. deepseek-coder:6.7b)")
    parser.add_argument("--target", type=int, default=10, help="Target number of clones")
    parser.add_argument("--parquet", type=str, default="Project_CodeNet_Java.parquet")
    parser.add_argument("--url", type=str, default=DEFAULT_OLLAMA_URL, help="Ollama API URL")
    
    args = parser.parse_args()
    
    if not Path(args.parquet).exists():
        print(f"Error: {args.parquet} not found.")
        return

    # Load Data
    print(f"Loading data from {args.parquet}...")
    df = pd.read_parquet(args.parquet)
    problems = list_problems(df)
    
    output_file = Path(f"dataset/ollama_{args.type}.jsonl")
    
    # Stats
    count = 0
    if output_file.exists():
        with jsonlines.open(output_file) as reader:
            for _ in reader: count += 1
            
    print(f"{Fore.CYAN}Generating {args.type} using {args.model}. Target: {args.target}. Current: {count}{Style.RESET_ALL}")
    
    pbar = tqdm(total=args.target, initial=count, desc=f"Ollama {args.type}")
    
    processed_problems = 0
    while count < args.target and processed_problems < len(problems):
        prob_id = problems[processed_problems]
        processed_problems += 1
        
        code, _ = choose_seed(df, prob_id)
        if not code: continue
        
        # Select Prompt
        prompt = ""
        if args.type == 'type1': prompt = TYPE1_PROMPT_TEMPLATE.replace("<<<CODE_PLACEHOLDER>>>", code)
        elif args.type == 'type2': prompt = TYPE2_PROMPT_TEMPLATE.replace("<<<CODE_PLACEHOLDER>>>", code)
        elif args.type == 'type3': prompt = TYPE3_PROMPT_TEMPLATE.replace("<<<CODE_PLACEHOLDER>>>", code)
        elif args.type == 'type4': prompt = TYPE4_PROMPT_TEMPLATE.replace("<<<CODE_PLACEHOLDER>>>", code)
        elif args.type == 'nonclone_easy': prompt = EASY_NONCLONE_PROMPT_TEMPLATE.replace("<<<CODE_PLACEHOLDER>>>", code)
        elif args.type == 'nonclone_hard': prompt = HARD_NONCLONE_PROMPT_TEMPLATE.replace("<<<CODE_PLACEHOLDER>>>", code)

        print(f"Attempting {prob_id}...")
        generated = generate_with_repair(prompt, prob_id if 'nonclone' not in args.type else None, df, args.model)
        
        if generated:
             if args.type == 'type3':
                sim, ratio = validate_similarity(code, generated, 0.6)
                if not sim:
                    print(f"  {Fore.YELLOW}Rejected: Low Similarity ({ratio:.2f}){Style.RESET_ALL}")
                    continue
            
             with jsonlines.open(output_file, mode='a', flush=True) as writer:
                writer.write({
                    'id': f"{prob_id}_{args.type}_{uuid.uuid4().hex[:8]}",
                    'code_1': code,
                    'code_2': generated,
                    'label': 'non-clone' if 'nonclone' in args.type else 'clone',
                    'clone_type': args.type,
                    'problem_id': prob_id,
                    'generator': f"ollama-{args.model}"
                })
             count += 1
             pbar.update(1)
             print(f"  {Fore.GREEN}SUCCESS!{Style.RESET_ALL}")
        else:
             pass # Failed logic inside logs error
             
    pbar.close()

if __name__ == "__main__":
    main()
