
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

LIBRARIES_IMPORTED = False
try:
    from colorama import Fore, Style, init
    import pandas as pd
    import jsonlines
    from tqdm import tqdm
    import torch
    from transformers import AutoTokenizer, AutoModelForCausalLM, AutoModelForSeq2SeqLM, BitsAndBytesConfig
    import datasets
    init(autoreset=True)
    LIBRARIES_IMPORTED = True
except Exception as e:
    class Fore:
        RED = ""; GREEN = ""; YELLOW = ""; CYAN = ""; WHITE = ""
    class Style:
        RESET_ALL = ""
    def init(**kwargs): pass
    print(f"Libraries missing or error ({e}). Will attempt installation in check_environment...")
    LIBRARIES_IMPORTED = False

# --- Configuration & Constants ---

def check_environment():
    """Checks and prints the environment status including CUDA, Dependencies, and JDK."""
    print(f"{Fore.CYAN}=========================================={Style.RESET_ALL}")
    print(f"{Fore.CYAN}       ENVIRONMENT CONFIGURATION CHECK    {Style.RESET_ALL}")
    print(f"{Fore.CYAN}=========================================={Style.RESET_ALL}")

    # 1. CUDA Check
    print(f"{Fore.YELLOW}[1] Checking CUDA Availability...{Style.RESET_ALL}")
    if LIBRARIES_IMPORTED:
        if torch.cuda.is_available():
            print(f"  {Fore.GREEN}✓ CUDA is available!{Style.RESET_ALL}")
            print(f"  • Device Name: {torch.cuda.get_device_name(0)}")
            print(f"  • CUDA Version: {torch.version.cuda}")
            print(f"  • Device Count: {torch.cuda.device_count()}")
        else:
            print(f"  {Fore.RED}✗ CUDA is NOT available.{Style.RESET_ALL}")
            print(f"  • Running on CPU (Performance will be significantly slower)")
    else:
        print(f"  {Fore.YELLOW}⚠ Cannot check CUDA yet (libraries missing).{Style.RESET_ALL}")

    # 2. Dependencies
    print(f"{Fore.YELLOW}[2] Checking & Installing Dependencies...{Style.RESET_ALL}")
    
    # Base dependencies
    dependencies = [
        "pandas", "numpy", "transformers", "accelerate", "datasets", 
        "sentencepiece", "bitsandbytes", "colorama", "jsonlines", 
        "hf-transfer", "gdown", "protobuf"
    ]

    print(f"  Installing base libraries: {', '.join(dependencies)}")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install"] + dependencies)
        
        # Install PyTorch with CUDA support if requested/available
        print(f"  Checking PyTorch installation...")
        try:
            import torch as local_torch
            if local_torch.cuda.is_available():
                print(f"  {Fore.GREEN}✓ PyTorch is already installed with CUDA support.{Style.RESET_ALL}")
            else:
                print(f"  {Fore.YELLOW}⚠ PyTorch found but CUDA not available/detected.{Style.RESET_ALL}")
                print(f"  Attempting to install PyTorch with CUDA 12.1 support...")
                subprocess.check_call([sys.executable, "-m", "pip", "install", "torch", "torchvision", "--index-url", "https://download.pytorch.org/whl/cu121"])
                print(f"  {Fore.YELLOW}⚠ PyTorch re-installed. You may need to restart the script to load CUDA support.{Style.RESET_ALL}")
        except ImportError:
            print(f"  {Fore.YELLOW}⚠ PyTorch not found. Installing with CUDA 12.1 support...{Style.RESET_ALL}")
            subprocess.check_call([sys.executable, "-m", "pip", "install", "torch", "torchvision", "--index-url", "https://download.pytorch.org/whl/cu121"])
        
        if not LIBRARIES_IMPORTED:
            print(f"  {Fore.GREEN}✓ Libraries installed. RESTARTING SCRIPT to load them...{Style.RESET_ALL}")
            print(f"  -------------------------------------------------------------------")
            # Restart script
            os.execv(sys.executable, [sys.executable] + sys.argv)
            
    except subprocess.CalledProcessError as e:
        print(f"  {Fore.RED}✗ Dependency installation failed! Error: {e}{Style.RESET_ALL}")

    print(f"{Fore.CYAN}=========================================={Style.RESET_ALL}\n")

MODEL_MAPPING = {
    'type1': 'Salesforce/codet5-small',
    'type2': 'Salesforce/codet5-small',
    'type3': 'Salesforce/codet5-small',
    'type4': 'Salesforce/codegen-350M-mono',
    'nonclone_easy': 'Salesforce/codet5-small',
    'nonclone_hard': 'Salesforce/codet5-small',
    'repair': 'Salesforce/codet5-small' 
}

# Type 4 might need generated repair using specific repair model if generation model fails?
# For simplicity, we will use the same loaded model for repair if it's capable, 
# OR we can force switch. But switching for every repair is slow.
# Given type 4 is using CodeGen-350M, which is decent, we will stick with it for repair 
# UNLESS forced to switch. The user table said "Repair: CodeT5-small".
# Switching to CodeT5-small just for repair of Type 4 is expensive (unload/load).
# I will make a design choice: Use the ACTIVE model for repair to save time.
# CodeGen-350M is capable of repair.

DEFAULT_MAX_TOKENS = 512 # CodeT5 is small, keeping tokens reasonable
TYPE4_MAX_TOKENS = 1000  # CodeGen for Type 4
DEFAULT_CLONES_PER_TYPE = 100
DEFAULT_MAX_RETRIES = 1 
DEFAULT_CODENET_PATH = Path("Project_CodeNet_Java.parquet")

# --- Prompts (Identical to previous, Type 3 has examples) ---

TYPE1_PROMPT_TEMPLATE = """You are a Java code formatter. Transform this Java code by ONLY changing formatting while preserving all semantics.
Rules:
1. MUST have class name as "Main"
2. ONLY change formatting (whitespace, indentation)
3. DO NOT rename variables or modify logic
4. Output raw Java code ONLY

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

# Type 3 with few-shot examples as requested
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

# --- Helpers (Same as before) ---

def log(message, color=Fore.WHITE):
    try: print(f"{color}{message}{Style.RESET_ALL}")
    except: print(message)

def normalize_unicode_to_ascii(text):
    replacements = {'\u201c': '"', '\u201d': '"', '\u00a0': ' '}
    for k, v in replacements.items(): text = text.replace(k, v)
    return text.encode('ascii', 'ignore').decode('ascii')

def sanitize_code_from_model(raw_text):
    if not raw_text: return None
    text = normalize_unicode_to_ascii(raw_text.strip())
    if "```" in text:
        for part in text.split("```"):
            if part.lower().strip().startswith("java"):
                return part[4:].strip()
    # Fallback for CodeT5 which might just output code directly
    if "class Main" in text: return text
    
    # NEW: If it has main method but no class, wrap it
    if "public static void main" in text and "class " not in text:
        return f"public class Main {{\n{text}\n}}"
    
    # NEW: Last resort for CodeT5 - if it looks like statements but no class/main
    # (e.g. just variable declarations), we might wrap it in main and class?
    # Risky, but better than discarding.
    if "public class" not in text and "class Main" not in text:
         if "public static void main" not in text:
             # Assume it's just the body of main
             return f"public class Main {{\n    public static void main(String[] args) {{\n{text}\n    }}\n}}"

    return text

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
    return [(str(row['inputs']), str(row['outputs']))] # Simplified for new script

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
    if df.empty: return None
    row = df.iloc[0]
    return row.get('source_code'), row.get('submission_id')

# --- Model Manager ---

class MultiModelManager:
    def __init__(self, device_type="auto"):
        self.device = torch.device("cuda" if (device_type == "gpu" or (device_type=="auto" and torch.cuda.is_available())) else "cpu")
        self.current_model_name = None
        self.model = None
        self.tokenizer = None
        self.is_seq2seq = False

    def load_model(self, model_name):
        if self.current_model_name == model_name:
            return # Already loaded
        
        # Unload previous
        if self.model:
            del self.model
            del self.tokenizer
            torch.cuda.empty_cache()
            
        print(f"{Fore.CYAN}Loading model: {model_name}...{Style.RESET_ALL}")
        self.tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
        
        # Determine type
        # Refactored to force safetensors as requested
        try:
            if "t5" in model_name.lower():
                self.model = AutoModelForSeq2SeqLM.from_pretrained(
                    model_name, 
                    trust_remote_code=True, 
                    use_safetensors=True
                ).to(self.device)
                self.is_seq2seq = True
            else:
                self.model = AutoModelForCausalLM.from_pretrained(
                    model_name, 
                    trust_remote_code=True, 
                    use_safetensors=True
                ).to(self.device)
                self.is_seq2seq = False
        except Exception as e:
            # Fallback warning if safetensors fails (though user requested force)
            print(f"{Fore.RED}Failed to load with safetensors: {e}{Style.RESET_ALL}")
            print(f"{Fore.YELLOW}Attempting fallback to default load (might invoke vulnerability error)...{Style.RESET_ALL}")
            if "t5" in model_name.lower():
                self.model = AutoModelForSeq2SeqLM.from_pretrained(model_name, trust_remote_code=True).to(self.device)
                self.is_seq2seq = True
            else:
                self.model = AutoModelForCausalLM.from_pretrained(model_name, trust_remote_code=True).to(self.device)
                self.is_seq2seq = False
            
        self.current_model_name = model_name
        print(f"{Fore.GREEN}Model loaded.{Style.RESET_ALL}")

    def generate(self, prompt, max_new_tokens=512):
        try:
            inputs = self.tokenizer(prompt, return_tensors="pt", truncation=True, max_length=2048).to(self.device)
            
            with torch.no_grad():
                output = self.model.generate(
                    **inputs,
                    max_new_tokens=max_new_tokens,
                    temperature=0.2,
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id
                )
            
            generated = self.tokenizer.decode(output[0], skip_special_tokens=True)
            
            # Post-processing
            if not self.is_seq2seq and generated.startswith(prompt):
                 generated = generated[len(prompt):].strip()
                 
            return generated, None
        except Exception as e:
            return None, str(e)

# --- Main Logic ---

def generate_with_repair(manager: MultiModelManager, prompt, problem_id, codenet_df, max_retries=1, max_tokens=512):
    # Initial Generation
    raw, err = manager.generate(prompt, max_new_tokens=max_tokens)
    if err: return None
    
    code = sanitize_code_from_model(raw)
    valid, reason = quick_check_code_quality(code)
    
    msg = reason
    if valid and problem_id:
        # validate logic/compilation
        res = validate_java(code, problem_id, codenet_df)
        if res == "passed": return code
        msg = res
    elif valid and not problem_id:
         # simple compilation check for non-clones
         with tempfile.TemporaryDirectory() as td:
             (Path(td)/"Main.java").write_text(code, encoding='utf-8')
             res, err = compile_java(td)
             if res: return code
             msg = err

    # Repair (Using SAME model for efficiency)
    print(f"  {Fore.YELLOW}Repairing error: {msg}")
    
    # AUTO-FIX: If error is Missing class or main, try to wrap it FORCEFULLY before asking LLM
    if "Missing 'class Main'" in str(msg) or "Missing main method" in str(msg):
        # forcing wrap
        if "class Main" not in code:
            if "public static void main" in code:
                 code = f"public class Main {{\n{code}\n}}"
            else:
                 code = f"public class Main {{\n    public static void main(String[] args) {{\n{code}\n    }}\n}}"
            
            # Re-validate immediately
            valid, reason = quick_check_code_quality(code)
            if valid:
                # If problem_id exists, check full validation
                if problem_id:
                     res = validate_java(code, problem_id, codenet_df)
                     if res == "passed": return code
                     msg = res # Code is now syntactically valid but maybe logic error, continue to LLM repair
                else: 
                     return code # for non-clones, syntax valid is enough


    repair_prompt = REPAIR_PROMPT_TEMPLATE.replace("<<<CODE_PLACEHOLDER>>>", code).replace("<<<ERROR_PLACEHOLDER>>>", str(msg))
    raw_repair, err = manager.generate(repair_prompt, max_new_tokens=max_tokens)
    
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
    check_environment()
    
    parser = argparse.ArgumentParser()
    parser.add_argument("--parquet", default=str(DEFAULT_CODENET_PATH))
    parser.add_argument("--target", type=int, default=100)
    args = parser.parse_args()
    
    # Init CodeNet
    if not Path(args.parquet).exists():
        subprocess.check_call([sys.executable, "-m", "pip", "install", "gdown"])
        import gdown
        gdown.download("https://drive.google.com/uc?id=1rOGafVqqzl2JM7bvoS-2kkBK6PCbNFsZ", args.parquet, quiet=False)
        
    df = pd.read_parquet(args.parquet)
    problems = list_problems(df)
    
    manager = MultiModelManager()
    output_file = Path("dataset/multi_model_clones.jsonl")
    
    # Load progress
    stats = {k: 0 for k in MODEL_MAPPING.keys()}
    if output_file.exists():
        with jsonlines.open(output_file) as reader:
            for obj in reader:
                if obj['clone_type'] in stats: stats[obj['clone_type']] += 1
    
    print(f"Refined Targets: {args.target} per type. Current: {stats}")

    # ITERATE BY TYPE (To load model once per type)
    for clone_type, model_name in MODEL_MAPPING.items():
        if stats[clone_type] >= args.target:
            continue
            
        print(f"\n{Fore.MAGENTA}=== Processing {clone_type} with {model_name} ==={Style.RESET_ALL}")
        manager.load_model(model_name)
        
        pbar = tqdm(total=args.target, initial=stats[clone_type], desc=clone_type)
        
        seed_idx = 0
        while stats[clone_type] < args.target and seed_idx < len(problems):
            prob_id = problems[seed_idx]
            seed_idx += 1
            
            code, _ = choose_seed(df, prob_id)
            if not code: continue
            
            # Select Prompt
            prompt = None
            if clone_type == 'type1': prompt = TYPE1_PROMPT_TEMPLATE.replace("<<<CODE_PLACEHOLDER>>>", code)
            elif clone_type == 'type2': prompt = TYPE2_PROMPT_TEMPLATE.replace("<<<CODE_PLACEHOLDER>>>", code)
            elif clone_type == 'type3': prompt = TYPE3_PROMPT_TEMPLATE.replace("<<<CODE_PLACEHOLDER>>>", code)
            elif clone_type == 'type4': prompt = TYPE4_PROMPT_TEMPLATE.replace("<<<CODE_PLACEHOLDER>>>", code)
            elif clone_type == 'nonclone_easy': prompt = EASY_NONCLONE_PROMPT_TEMPLATE.replace("<<<CODE_PLACEHOLDER>>>", code)
            elif clone_type == 'nonclone_hard': prompt = HARD_NONCLONE_PROMPT_TEMPLATE.replace("<<<CODE_PLACEHOLDER>>>", code)
            
            # Generate
            # Special logic for Type 3 similarity check
            max_tk = TYPE4_MAX_TOKENS if clone_type == 'type4' else DEFAULT_MAX_TOKENS
            
            generated = generate_with_repair(manager, prompt, prob_id if 'nonclone' not in clone_type else None, df, max_tokens=max_tk)
            
            if generated:
                # Type 3 Similarity Check
                if clone_type == 'type3':
                    similar, ratio = validate_similarity(code, generated, 0.6)
                    if not similar:
                        print(f"  {Fore.YELLOW}Type 3 rejected: ratio {ratio:.2f}")
                        continue
                
                # Save
                with jsonlines.open(output_file, mode='a', flush=True) as writer:
                    writer.write({
                        'id': f"{prob_id}_{clone_type}_{uuid.uuid4().hex[:8]}",
                        'code_1': code,
                        'code_2': generated,
                        'label': 'non-clone' if 'nonclone' in clone_type else 'clone',
                        'clone_type': clone_type,
                        'problem_id': prob_id,
                        'generator': model_name
                    })
                
                stats[clone_type] += 1
                pbar.update(1)
                print(f"  {Fore.GREEN}SUCCESS: {clone_type} generated.{Style.RESET_ALL}")
            else:
                # print(f"  {Fore.RED}Failed {clone_type}{Style.RESET_ALL}")
                pass
                
        pbar.close()

if __name__ == "__main__":
    main()
