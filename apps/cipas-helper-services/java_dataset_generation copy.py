
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
    from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
    import datasets
    init(autoreset=True)
    LIBRARIES_IMPORTED = True
except Exception as e:
    # Define dummy colorama classes so we don't crash before installing
    class Fore:
        RED = ""; GREEN = ""; YELLOW = ""; CYAN = ""; WHITE = ""
    class Style:
        RESET_ALL = ""
    def init(**kwargs): pass
    
    print(f"Libraries missing or error ({e}). Will attempt installation in check_environment...")
    # Do not exit; let check_environment run
    LIBRARIES_IMPORTED = False

# Configuration Defaults
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
        "hf-transfer", "gdown"
    ]

    print(f"  Installing base libraries: {', '.join(dependencies)}")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install"] + dependencies)
        
        # Install PyTorch with CUDA support if requested/available
        # We'll check if torch is already installed and has CUDA. If not, reinstall with CUDA index.
        print(f"  Checking PyTorch installation...")
        try:
            # We use distinct name to avoid shadowing global 'torch' variable
            import torch as local_torch
            if local_torch.cuda.is_available():
                print(f"  {Fore.GREEN}✓ PyTorch is already installed with CUDA support.{Style.RESET_ALL}")
            else:
                print(f"  {Fore.YELLOW}⚠ PyTorch found but CUDA not available/detected.{Style.RESET_ALL}")
                print(f"  Attempting to install PyTorch with CUDA 12.1 support...")
                subprocess.check_call([sys.executable, "-m", "pip", "install", "torch", "torchvision", "--index-url", "https://download.pytorch.org/whl/cu121"])
                # Reload to pick up changes if possible, or just warn user to restart
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

    # 3. JDK Check
    print(f"{Fore.YELLOW}[3] Checking Java Development Kit (JDK)...{Style.RESET_ALL}")
    try:
        # Check javac
        result = subprocess.run(["javac", "-version"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, check=False)
        if result.returncode == 0:
            version_output = result.stdout.decode('utf-8').strip()
            print(f"  {Fore.GREEN}✓ JDK is installed: {version_output}{Style.RESET_ALL}")
        else:
            raise FileNotFoundError
    except FileNotFoundError:
        print(f"  {Fore.RED}✗ JDK (javac) NOT found in PATH.{Style.RESET_ALL}")
        
        # Check if we are on Linux (Ubuntu/Debian) to attempt install
        if sys.platform.startswith("linux"):
            print(f"  {Fore.YELLOW}Attempting to install OpenJDK 17 on Linux...{Style.RESET_ALL}")
            try:
                # Need sudo usually, assuming user has permissions or running as root in container
                # Trying standard apt-get commands
                print("  Running: sudo apt-get update && sudo apt-get install -y openjdk-17-jdk")
                subprocess.check_call([ "apt-get", "update"])
                subprocess.check_call(["apt-get", "install", "-y", "openjdk-17-jdk"])
                print(f"  {Fore.GREEN}✓ JDK Installation successful.{Style.RESET_ALL}")
            except subprocess.CalledProcessError as e:
                print(f"  {Fore.RED}✗ JDK Installation failed: {e}{Style.RESET_ALL}")
                print(f"  Please run manually: sudo apt-get update && sudo apt-get install -y openjdk-17-jdk")
        else:
            print(f"  To install JDK:")
            print(f"  • {Fore.CYAN}Windows:{Style.RESET_ALL}       Download JDK 17+ from Oracle/Adoptium and add 'bin' folder to PATH.")

    print(f"{Fore.CYAN}=========================================={Style.RESET_ALL}\n")

# Configuration Defaults
DEFAULT_MODEL_NAME = "Qwen/Qwen2.5-Coder-7B-Instruct" # Using Instruct version usually better for following prompts
# Fallback to the one in notebook if preferred: "Qwen/Qwen2.5-Coder-7B"
HF_MODEL_NAME = "Qwen/Qwen2.5-Coder-7B-Instruct"
DEFAULT_MAX_TOKENS = 2048 # Default max new tokens for generation
DEFAULT_CLONES_PER_TYPE = 10 # Target number of clones per type per problem
DEFAULT_MAX_RETRIES = 3 # Maximum number of repair attempts
DEFAULT_MAX_CLONES_PER_PROBLEM = 5 # Maximum number of clones generated per problem to avoid bias

# Path to Project_CodeNet_Java.parquet
# Assuming it stands in the same directory or user provides path
DEFAULT_CODENET_PATH = Path("Project_CodeNet_Java.parquet")

# --- Prompts ---

TYPE1_PROMPT_TEMPLATE = """You are a Java code formatter. Transform this Java code by ONLY changing formatting while preserving all semantics.

**CRITICAL:** Your output must be raw Java code ONLY. Do not include any markdown, explanations, or special tokens.

RULES:
1. MUST have class name as "Main" (CRITICAL for compilation)
2. MUST have public static void main(String[] args) method
3. ONLY change formatting: whitespace, indentation, line breaks, comments
4. MUST preserve all identifiers, literals, and code structure
5. DO NOT rename variables, methods, or classes
6. DO NOT change any literals or expressions
7. DO NOT add, remove, or modify any statements
8. DO NOT change control flow structure
9. Output raw Java code ONLY (no markdown, no explanation)

Original Code:
<<<CODE_PLACEHOLDER>>>

Formatted Code:"""

TYPE2_PROMPT_TEMPLATE = """You are a Java refactoring assistant. Transform this code by renaming identifiers and changing literals while preserving exact behavior.

**CRITICAL:** Your output must be raw Java code ONLY. Do not include any markdown, explanations, or special tokens.

RULES:
1. MUST have class name as "Main" (CRITICAL for compilation)
2. MUST have public static void main(String[] args) method
3. CAN rename variables, parameters, and method names (EXCEPT main method)
4. CAN change literals (e.g., 10→0xA, true→(1==1), "test"→"TEST".toLowerCase())
5. MUST preserve exact control flow and structure
6. DO NOT add, remove, or reorder any statements
7. DO NOT change the algorithmic logic or approach
8. DO NOT modify control flow patterns (if/else, loops, etc.)
9. Structure and statement order MUST remain identical
10. Output raw Java code ONLY (no markdown, no explanation)

Original Code:
<<<CODE_PLACEHOLDER>>>

Refactored Code:"""

TYPE3_PROMPT_TEMPLATE = """You are a Java code mutator. Transform this code with SIGNIFICANT statement-level modifications while preserving exact program behavior.

**CRITICAL:** Your output must be raw Java code ONLY. Do not include any markdown, explanations, or special tokens.

**TYPE-3 CLONE REQUIREMENTS - YOU MUST DO AT LEAST 3 OF THESE:**
1. Replace for loops with while loops (or vice versa)
2. Add temporary variables to break up complex expressions: `result = a + b + c` → `temp = a + b; result = temp + c`
3. Add dead code: unused variables, unreachable statements after return/break
4. Reorder independent statements (declarations, assignments that don't depend on each other)
5. Replace if-else with ternary operators (or vice versa): `if(x>0) y=1; else y=0;` → `y = (x>0) ? 1 : 0;`
6. Add redundant calculations: `x = 5` → `x = 3 + 2` or `x = 10/2`
7. Extract inline calculations into separate statements
8. Add extra variable assignments that don't change behavior
9. Change loop increment styles: `i++` → `i = i + 1` → `i += 1`
10. Add null checks or bounds checks that are always true/false

**CONCRETE EXAMPLES OF REQUIRED CHANGES:**

Example 1 - Loop Conversion:
BEFORE: `for(int i=0; i<n; i++) { sum += arr[i]; }`
AFTER: `int i = 0; while(i < n) { sum += arr[i]; i = i + 1; }`

Example 2 - Expression Breakdown:
BEFORE: `int result = (a + b) * (c - d);`
AFTER: `int temp1 = a + b; int temp2 = c - d; int result = temp1 * temp2;`

Example 3 - Dead Code Addition:
BEFORE: `return result;`
AFTER: `int unused = 42; return result; System.out.println("never reached");`

**FORBIDDEN (these make Type-1 clones, NOT Type-3):**
- Only changing whitespace/formatting
- Only renaming variables
- Only changing comments
- Only changing literal values without structural impact

**REQUIRED STRUCTURE:**
1. MUST have class name as "Main" (CRITICAL for compilation)
2. MUST have public static void main(String[] args) method
3. MUST preserve exact input/output behavior
4. MUST have noticeable structural differences from original
5. Output raw Java code ONLY (no markdown, no explanation)

Original Code:
<<<CODE_PLACEHOLDER>>>

Structurally Modified Code:"""

TYPE4_PROMPT_TEMPLATE = """You are an expert Java programmer. Rewrite this code using a completely different algorithm while maintaining identical observable behavior.

**CRITICAL:** Your output must be raw Java code ONLY. Do not include any markdown, explanations, or special tokens.

RULES:
1. MUST have class name as "Main" (CRITICAL for compilation)
2. MUST have public static void main(String[] args) method
3. MUST preserve exact input format and parsing
4. MUST preserve exact output format and content
5. MUST have identical behavior for ALL possible inputs
6. CAN use completely different algorithms, data structures, approaches
7. CAN restructure the entire program logic
8. CAN use different computational strategies
9. Structure and implementation MAY be completely different
10. Observable input/output behavior MUST be identical
11. Output raw Java code ONLY (no markdown, no explanation)

Original Code:
<<<CODE_PLACEHOLDER>>>

Rewritten Code:"""

EASY_NONCLONE_PROMPT_TEMPLATE = """You are a Java programmer. Create a simple, different Java program that solves a basic algorithmic problem.

**CRITICAL:** Your output must be raw Java code ONLY. Do not include any markdown, explanations, or special tokens.

RULES:
1. MUST have class name as "Main" (CRITICAL for compilation)
2. MUST have public static void main(String[] args) method
3. Create a program for a COMPLETELY DIFFERENT problem domain
4. DO NOT reuse any variable names from the reference code
5. DO NOT use similar control-flow patterns
6. DO NOT use similar data structures
7. Must solve a clearly different algorithmic problem
8. Use basic concepts: simple loops, arrays, basic arithmetic
9. Must be functionally complete and compilable
10. Different problem goal and output meaning required
11. Output raw Java code ONLY (no markdown, no explanation)

Reference Code (CREATE SOMETHING COMPLETELY DIFFERENT):
<<<CODE_PLACEHOLDER>>>

New Different Program:"""

HARD_NONCLONE_PROMPT_TEMPLATE = """You are an expert Java programmer. Create a sophisticated Java program that has similar structure but different semantics from the reference code.

**CRITICAL:** Your output must be raw Java code ONLY. Do not include any markdown, explanations, or special tokens.

RULES:
1. MUST have class name as "Main" (CRITICAL for compilation)
2. MUST have public static void main(String[] args) method
3. MUST have similar control flow patterns (similar if/else, loop structures)
4. MUST have similar program skeleton and structure
5. MUST solve a DIFFERENT semantic problem with DIFFERENT output meaning
6. MUST NOT have behavioral equivalence with the reference code
7. Use advanced concepts: collections, recursion, object-oriented design
8. High structural similarity but different algorithmic goal required
9. Must be functionally complete and compilable
10. Different problem domain but similar complexity
11. Output raw Java code ONLY (no markdown, no explanation)

Reference Code (CREATE SIMILAR STRUCTURE, DIFFERENT SEMANTICS):
<<<CODE_PLACEHOLDER>>>

New Structurally Similar Program:"""

REPAIR_PROMPT_TEMPLATE = """You are a Java code repair assistant. The following Java code has errors. Fix the validation errors and output the corrected code.

**CRITICAL:** Your output must be raw Java code ONLY. Do not include any markdown, explanations, or special tokens.

Rules:
1. MUST have class name as "Main"
2. Fix SPECIFICALLY the error reported below
3. Preserve the original logic as much as possible
4. Output raw Java code ONLY

Original Code:
<<<CODE_PLACEHOLDER>>>

Validation Error:
<<<ERROR_PLACEHOLDER>>>

Fixed Code:"""

# --- Helpers ---

def log(message, color=Fore.WHITE):
    """Simple logger function."""
    try:
        print(f"{color}{message}{Style.RESET_ALL}")
    except Exception:
        print(message)

def normalize_unicode_to_ascii(text):
    """Convert Unicode characters to ASCII equivalents."""
    replacements = {
        '\u201c': '"', '\u201d': '"', '\u2018': "'", '\u2019': "'",
        '\u201b': "'", '\u2013': '-', '\u2014': '-', '\u2015': '-',
        '\u00a0': ' ', '\u2009': ' ', '\u200a': ' ', '\u2026': '...',
        '\u00b4': "'", '\u02bb': "'", '\u02bc': "'"
    }
    
    for unicode_char, ascii_char in replacements.items():
        text = text.replace(unicode_char, ascii_char)
    
    cleaned = []
    for char in text:
        if ord(char) < 128 or char in ['\n', '\r', '\t']:
            cleaned.append(char)
        else:
            cleaned.append(' ')
    
    return ''.join(cleaned)

def sanitize_code_from_model(raw_text):
    """Sanitize and extract Java code from model output."""
    if raw_text is None:
        return None
    
    text = raw_text.strip()
    text = normalize_unicode_to_ascii(text)
    
    # Handle fenced code blocks
    if "```" in text:
        parts = text.split("```")
        for part in parts:
            if part.lower().strip().startswith("java"):
                text = part[4:].lstrip()
                break
        else:
            # Fallback: find the largest block inside backticks
            candidates = [p for p in parts if len(p.strip()) > 20]
            if candidates:
                text = max(candidates, key=len)
    
    # Remove common LLM artifacts
    llm_artifacts = [
        r'< begin of sentence >', r'<begin of sentence>', r'< end of sentence >',
        r'<end of sentence>', r'<\|begin_of_text\|>', r'<\|end_of_text\|>',
        r'<s>', r'</s>', r'<\|startoftext\|>', r'<\|endoftext\|>',
        r'<\|file_separator\|>', r'<\|code_start\|>', r'<\|code_end\|>'
    ]
    
    for artifact in llm_artifacts:
        text = re.sub(artifact, '', text, flags=re.IGNORECASE)
    
    # Clean up specific System.out artifacts if they leaked into code
    text = re.sub(r'System\.out\s*<[^>]+>\s*', 'System.out.', text)
    
    # Basic validation
    if "class Main" not in text:
        # Try to wrap it if it looks like code but missing class
        if "public static void main" in text:
             text = "public class Main {\n" + text + "\n}"
        else:
            return None
    
    return text.strip()

def quick_check_code_quality(code_str):
    """Check code quality without compilation."""
    if not code_str or len(code_str) < 50:
        return False, "Code too short"
    
    if "class Main" not in code_str:
        return False, "Missing 'class Main'"
    
    if "main(" not in code_str:
        return False, "Missing main method"
    
    suspicious = [
        "TODO:", "FIXME:", "[Your code here]", "// ... rest of",
        "// Original code", "// Explanation:", "Note that", 
        "< begin of sentence >", "<begin of sentence>",
        "< end of sentence >", "<end of sentence>"
    ]
    
    for pattern in suspicious:
        if pattern in code_str:
            return False, f"Contains suspicious pattern: {pattern}"
    
    if code_str.count('{') != code_str.count('}'):
        return False, "Unbalanced braces"
    
    if code_str.count('(') != code_str.count(')'):
        return False, "Unbalanced parentheses"
    
    trimmed = code_str.strip()
    if trimmed and trimmed[-1] not in ['}', ';', '*', '/']:
        return False, "Code appears incomplete"
    
    return True, "OK"

def compile_java(temp_dir):
    """Compile Main.java in temp_dir."""
    java_file = Path(temp_dir) / "Main.java"
    
    if not java_file.exists():
        return False, "Main.java not found"
    
    try:
        result = subprocess.run(
            ["javac", str(java_file)],
            cwd=temp_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=10,
            check=False
        )
        
        if result.returncode != 0:
            error = result.stderr.decode('utf-8', errors='ignore')
            return False, f"Compilation error: {error[:500]}"
        
        return True, None
        
    except subprocess.TimeoutExpired:
        return False, "Compilation timeout"
    except FileNotFoundError:
        return False, "javac not found. Please install JDK."
    except Exception as e:
        return False, f"Compilation exception: {str(e)}"

def run_java_with_input(temp_dir, input_str, timeout=3):
    """Run compiled Java program with given input."""
    try:
        result = subprocess.run(
            ["java", "Main"],
            cwd=temp_dir,
            input=input_str.encode('utf-8'),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=timeout,
            check=False
        )
        
        if result.returncode != 0:
            error = result.stderr.decode('utf-8', errors='ignore')
            return None, f"Runtime error: {error[:500]}"
        
        output = result.stdout.decode('utf-8', errors='ignore')
        return output, None
        
    except subprocess.TimeoutExpired:
        return None, "Execution timeout"
    except Exception as e:
        return None, f"Execution exception: {str(e)}"

def normalize_output(text):
    """Normalize output text."""
    if not text:
        return ""
    # splitlines handles \r, \n, \r\n
    lines = text.strip().splitlines()
    return '\n'.join(line.rstrip() for line in lines).strip()

def load_testcases(codenet_df, problem_id):
    """Load input/output testcases for a problem from the parquet file."""
    df = codenet_df[codenet_df['problem_id'] == problem_id]
    if 'language' in df.columns:
        df = df[df['language'].str.lower() == 'java']
    if 'status' in df.columns:
        df = df[df['status'].str.lower() == 'accepted']
    
    df = df[df['inputs'].notnull() & df['outputs'].notnull()]
    if df.empty:
        return []
    
    row = df.iloc[0]
    input_val = row['inputs']
    output_val = row['outputs']
    
    import numpy as np
    
    # Handle array/list inputs (common in CodeNet parquet)
    if isinstance(input_val, (np.ndarray, list)):
        in_list = [str(x) if x is not None else "" for x in input_val]
        out_list = []
        if isinstance(output_val, (np.ndarray, list)):
            out_list = [str(x) if x is not None else "" for x in output_val]
        else:
            # If output is single item but input is list, might be mismatch or single output?
            # Usually they match structure.
            out_list = [str(output_val)] * len(in_list)
            
        return list(zip(in_list, out_list))
        
    # Handle single string containing newlines (older format assumption)
    input_text = str(input_val)
    output_text = str(output_val)
    
    if isinstance(input_text, str) and '\n' in input_text and isinstance(output_text, str) and '\n' in output_text:
        # Heuristic: if inputs are separated by newlines in a single string
        # But be careful not to split a single multiline input.
        # This branch is risky if CodeNet changed format.
        # Check if length matches
        input_lines = input_text.strip().split('\n')
        output_lines = output_text.strip().split('\n')
        if len(input_lines) > 1 and len(input_lines) == len(output_lines):
            return list(zip(input_lines, output_lines))
    
    return [(input_text, output_text)]

def validate_java(code_str, problem_id, codenet_df, timeout_seconds=5):
    """Validate Java code by compiling and running against testcases."""
    testcases = load_testcases(codenet_df, problem_id)
    
    if not testcases:
        return "no_tests"
    
    with tempfile.TemporaryDirectory() as temp_dir:
        java_file = Path(temp_dir) / "Main.java"
        
        try:
            java_file.write_text(code_str, encoding='utf-8')
        except Exception:
            return "compile_error"
        
        compile_success, compile_error = compile_java(temp_dir)
        
        if not compile_success:
            # print(f"  [DEBUG] Seed compilation failed for {problem_id}: {compile_error[:100]}...") 
            return f"compile_error: {compile_error}"
        
        for idx, (input_text, expected_output) in enumerate(testcases):
            output, error = run_java_with_input(temp_dir, input_text, timeout=timeout_seconds)
            
            if error:
                if "timeout" in error.lower():
                    return "timeout"
                else:
                    return f"runtime_error: {error}"
            
            norm_output = normalize_output(output)
            norm_expected = normalize_output(expected_output)
            
            if norm_output != norm_expected:
                return "wrong_answer"
        
        return "passed"

def validate_type3_clone(original_code, generated_code):
    """Validates if generated_code is a type-3 clone of original_code."""
    from difflib import SequenceMatcher

    def normalize_code(code):
        code = re.sub(r"//.*?$|/\*.*?\*/", "", code, flags=re.DOTALL | re.MULTILINE)
        code = '\n'.join([line.strip() for line in code.splitlines() if line.strip()])
        return code

    norm_orig = normalize_code(original_code)
    norm_gen = normalize_code(generated_code)

    if norm_orig == norm_gen:
        return False, "Identical code (type-1)"

    ratio = SequenceMatcher(None, norm_orig, norm_gen).ratio()
    if ratio > 0.6:
        return True, f"Syntactically similar (ratio={ratio:.2f})"
    else:
        return False, f"Not similar enough (ratio={ratio:.2f})"

# --- CodeNet Data ---

def list_problems(codenet_df):
    return sorted(codenet_df['problem_id'].unique())

def choose_seed(codenet_df, problem_id):
    df = codenet_df[codenet_df['problem_id'] == problem_id]
    if df.empty:
        return None, None
    if 'language' in df.columns:
        df = df[df['language'].str.lower() == 'java']
    if 'status' in df.columns:
        df = df[df['status'].str.lower() == 'accepted']
    if df.empty:
        return None, None
    
    df = df.assign(_code_len=df['source_code'].str.len()).sort_values('_code_len')
    row = df.iloc[0]
    code = row['source_code'] if 'source_code' in row else None
    submission_id = row['submission_id'] if 'submission_id' in row else None
    
    if code and len(code) <= 10240:
        return code, submission_id
    return None, None

# --- Model Manager ---

class ModelManager:
    def __init__(self, model_name, device_type):
        self.model_name = model_name
        self.device = torch.device("cuda" if device_type == "gpu" and torch.cuda.is_available() else "cpu")
        self.tokenizer = None
        self.model = None
        self._load_model()

    def _load_model(self):
        print(f"Loading model {self.model_name} on {self.device}...")
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name, trust_remote_code=True)
            
            kwargs = {
                "trust_remote_code": True,
                # "device_map": "auto" if self.device.type == "cuda" else None  <-- Removed, handled below
                "low_cpu_mem_usage": True  # Crucial for avoiding meta tensor errors with accelerate/quantization
            }
            
            if self.device.type == "cuda":
                # Use quantization if on GPU to save memory, if bitsandbytes available
                try:
                    bnb_config = BitsAndBytesConfig(
                        load_in_4bit=True,
                        bnb_4bit_compute_dtype=torch.float16,
                        bnb_4bit_use_double_quant=True,
                        bnb_4bit_quant_type="nf4",
                        llm_int8_enable_fp32_cpu_offload=True # Enable CPU offload if GPU OOM
                    )
                    kwargs["quantization_config"] = bnb_config
                    kwargs["dtype"] = torch.float16
                    # Use 'auto' device_map which handles offloading automatically when cpu_offload enabled
                    kwargs["device_map"] = "auto" 
                except Exception as e:
                    print(f"Warning: Could not use quantization: {e}. Loading full precision.")
                    kwargs["torch_dtype"] = torch.float16
                    kwargs["device_map"] = "auto"
            else:
                # CPU doesn't support 4bit bitsandbytes generally
                kwargs["torch_dtype"] = torch.float32 
                kwargs["device_map"] = "cpu"
            
            # Remove redundant device_map in kwargs if it was set to None initially for cpu
            # logic above handles it.
            
            self.model = AutoModelForCausalLM.from_pretrained(self.model_name, **kwargs)
            if self.device.type == "cpu":
                self.model.to(self.device)
                
            print(f"Model loaded successfully.")
        except Exception as e:
            print(f"Critical Error loading model: {e}")
            sys.exit(1)

    def generate(self, prompt, max_tokens=DEFAULT_MAX_TOKENS, temperature=0.1):
        try:
            inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)
            with torch.no_grad():
                output = self.model.generate(
                    **inputs,
                    max_new_tokens=max_tokens,
                    temperature=temperature,
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id
                )
            generated = self.tokenizer.decode(output[0], skip_special_tokens=True)
            # Simple prompt removal logic
            if generated.startswith(prompt):
                generated = generated[len(prompt):].strip()
            # Also handle if prompt includes system tokens that decode might skip but generate keeps logic
            # Usually decode skip_special_tokens handles most
            return generated, None
        except Exception as e:
            return None, str(e)

# --- Generation Logic ---

def generate_with_repair(model_manager: ModelManager, prompt, problem_id, codenet_df, max_retries=DEFAULT_MAX_RETRIES):
    temperatures = [0.1, 0.3, 0.5]
    
    for attempt in range(max_retries):
        temp = temperatures[min(attempt, len(temperatures) - 1)]
        raw, error = model_manager.generate(prompt, max_tokens=1500, temperature=temp)
        
        if error:
            log(f"[MODEL ERROR] {error}", Fore.RED)
            continue
            
        code = sanitize_code_from_model(raw)
        if not code:
            continue
            
        valid_syntax, reason = quick_check_code_quality(code)
        if not valid_syntax:
            error_msg = f"Syntax error: {reason}"
        else:
            if problem_id:
                result = validate_java(code, problem_id, codenet_df)
                if result == "passed":
                    return code
                else:
                    error_msg = result
            else:
                # For non-clones, we must at least ensure it compiles
                with tempfile.TemporaryDirectory() as temp_dir:
                    p = Path(temp_dir) / "Main.java"
                    try:
                        p.write_text(code, encoding='utf-8')
                        c_success, c_err = compile_java(temp_dir)
                        if c_success:
                            return code
                        else:
                            error_msg = f"Compilation error: {c_err}"
                    except Exception as e:
                        error_msg = f"File write error: {e}" 

        # Repair Loop
        print(f"  {Fore.YELLOW}Attempting repair for error: {error_msg}")
        current_code = code
        for repair_attempt in range(2):
            repair_prompt = REPAIR_PROMPT_TEMPLATE.replace("<<<CODE_PLACEHOLDER>>>", current_code).replace("<<<ERROR_PLACEHOLDER>>>", str(error_msg))
            raw_repair, err = model_manager.generate(repair_prompt, max_tokens=1500, temperature=0.1)
            
            if err:
                log(f"[MODEL ERROR] {err}", Fore.RED)
                break
                
            repaired_code = sanitize_code_from_model(raw_repair)
            if not repaired_code:
                continue
                
            valid_syntax, reason = quick_check_code_quality(repaired_code)
            if not valid_syntax:
                error_msg = f"Syntax error after repair: {reason}"
                current_code = repaired_code
                continue
            
            if problem_id:
                result = validate_java(repaired_code, problem_id, codenet_df)
                if result == "passed":
                    print(f"  {Fore.GREEN}Repair successful!")
                    return repaired_code
                else:
                    error_msg = result
                    current_code = repaired_code
            else:
                # Non-clone compilation check repair
                with tempfile.TemporaryDirectory() as temp_dir:
                    p = Path(temp_dir) / "Main.java"
                    try:
                        p.write_text(repaired_code, encoding='utf-8')
                        c_success, c_err = compile_java(temp_dir)
                        if c_success:
                            print(f"  {Fore.GREEN}Repair successful (Compilation)!")
                            return repaired_code
                        else:
                            error_msg = f"Compilation error: {c_err}"
                            current_code = repaired_code
                    except Exception as e:
                        error_msg = f"File write error: {e}"
                        current_code = repaired_code
                
    return None

def generate_clone(model_manager, code, clone_type, problem_id, codenet_df):
    prompt_map = {
        'type1': TYPE1_PROMPT_TEMPLATE,
        'type2': TYPE2_PROMPT_TEMPLATE,
        'type3': TYPE3_PROMPT_TEMPLATE,
        'type4': TYPE4_PROMPT_TEMPLATE
    }
    
    prompt_temp = prompt_map.get(clone_type)
    if not prompt_temp:
        return None
        
    prompt = prompt_temp.replace("<<<CODE_PLACEHOLDER>>>", code)
    
    if clone_type == 'type3':
        for attempt in range(5):
            generated_code = generate_with_repair(model_manager, prompt, problem_id, codenet_df)
            if not generated_code:
                continue
            
            is_type3, reason = validate_type3_clone(code, generated_code)
            if is_type3:
                return generated_code
            else:
                print(f"  {Fore.YELLOW}Type-3 validation failed: {reason}")
                if attempt < 4:
                    prompt += f"\n\nIMPORTANT: Previous attempt rejected: {reason}\nMake MORE SIGNIFICANT structural changes."
        return None
    else:
        return generate_with_repair(model_manager, prompt, problem_id, codenet_df)

def generate_nonclone(model_manager, code, nonclone_type, problem_id, codenet_df):
    prompt_map = {
        'easy': EASY_NONCLONE_PROMPT_TEMPLATE,
        'hard': HARD_NONCLONE_PROMPT_TEMPLATE
    }
    prompt_temp = prompt_map.get(nonclone_type)
    if not prompt_temp:
        return None
    
    prompt = prompt_temp.replace("<<<CODE_PLACEHOLDER>>>", code)
    
    # For non-clones, we can't strict validate output behavior because it's a different problem.
    # We pass problem_id=None to skip testcase validation, only syntax/compilation checking inside generate_with_repair (indirectly)
    # Actually generate_with_repair checks Problem ID, if None returns code.
    # We should probably do a compile check though.
    
    # Custom loop for non-clone to check compilation at least
    generated = generate_with_repair(model_manager, prompt, None, codenet_df) # problem_id None skips semantic check
    
    # Since generate_with_repair with None returns after syntax check, we might want to ensure it compiles.
    # But validate_java requires input/output to run.
    # So we'll trust syntax check or add a "compile_only" flag? 
    # For now, quick_check_code_quality is decent. 
    return generated


def main():
    parser = argparse.ArgumentParser(description="Java Code Clone Generator")
    parser.add_argument("--gpu", action="store_true", help="Force use of GPU")
    parser.add_argument("--cpu", action="store_true", help="Force use of CPU")
    parser.add_argument("--model", type=str, default=DEFAULT_MODEL_NAME, help="Hugging Face model name")
    parser.add_argument("--parquet", type=str, default=str(DEFAULT_CODENET_PATH), help="Path to CodeNet parquet file")
    # args.target removed from logic usage, keeping in parser for compatibility if needed or simply ignoring it
    parser.add_argument("--target", type=int, default=1, help="Target clones per type (GLOBAL LIMIT = 1)")
    parser.add_argument("--max-problems", type=int, default=None, help="Max problems to process")
    parser.add_argument("--output-dir", type=str, default="dataset", help="Output directory")
    
    args = parser.parse_args()

    # Perform Environment Check
    check_environment()
    
    # Device Selection
    device_type = "auto"
    if args.gpu:
        device_type = "gpu"
    elif args.cpu:
        device_type = "cpu"
    
    if device_type == "auto":
        device_type = "gpu" if torch.cuda.is_available() else "cpu"
        
    print(f"{Fore.GREEN}Starting Generator on {device_type.upper()}")
    
    # Check Data
    parquet_path = Path(args.parquet)
    if not parquet_path.exists():
        print(f"{Fore.YELLOW}Dataset file {parquet_path} not found.{Style.RESET_ALL}")
        print(f"Attempting download from Google Drive...")
        try:
            try:
                import gdown
            except ImportError:
                print("Installing gdown...")
                subprocess.check_call([sys.executable, "-m", "pip", "install", "gdown"])
                import gdown
            
            url = "https://drive.google.com/uc?id=1rOGafVqqzl2JM7bvoS-2kkBK6PCbNFsZ"
            gdown.download(url, str(parquet_path), quiet=False)
            
            if not parquet_path.exists():
                raise FileNotFoundError("Download seemed successful but file is missing.")
                
            print(f"{Fore.GREEN}✓ Download complete.{Style.RESET_ALL}")
            
        except Exception as e:
            print(f"{Fore.RED}Error downloading dataset: {e}{Style.RESET_ALL}")
            sys.exit(1)
            
    print(f"Loading data from {parquet_path}...")
    try:
        codenet_df = pd.read_parquet(parquet_path)
    except Exception as e:
        print(f"Error loading parquet: {e}")
        sys.exit(1)
        
    # Init Model
    model_manager = ModelManager(args.model, device_type)
    
    # Directories
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # --- Generate Clones ---
    
    target_types = ['type1', 'type2', 'type3', 'type4', 'nonclone_easy', 'nonclone_hard']
    clone_output_file = output_dir / "generated_clones.jsonl"
    
    # Load existing progress
    completed_types = set()
    if clone_output_file.exists():
        print(f"Loading existing progress from {clone_output_file}...")
        try:
            with jsonlines.open(clone_output_file) as reader:
                for obj in reader:
                    ctype = obj.get('clone_type')
                    if ctype in target_types:
                        completed_types.add(ctype)
            print(f"Found existing records for: {sorted(list(completed_types))}")
        except Exception as e:
            print(f"{Fore.RED}Error reading existing file: {e}. Will append knowing risks.{Style.RESET_ALL}")

    # Check if we are already done
    if len(completed_types) >= len(target_types):
        print(f"{Fore.GREEN}All clone types have already been generated (1 per type). Exiting.{Style.RESET_ALL}")
        return

    problems = list_problems(codenet_df)
    if args.max_problems:
        problems = problems[:args.max_problems]
        
    print(f"Processing up to {len(problems)} problems to find 1 sample per type...")
    print(f"Remaining types to generate: {set(target_types) - completed_types}")
    print(f"Writing to {clone_output_file} (Mode: APPEND - Preserving existing data, flush=True)")
    
    writer = jsonlines.open(clone_output_file, mode='a', flush=True)
    
    stats = {'success': 0, 'failed': 0}
    
    # Progress bar for PROBLEMS (indefinite mainly, but we show progress)
    # We stop as soon as we are done.
    pbar = tqdm(total=len(target_types), initial=len(completed_types), desc="Completed Types", unit="type")
    
    for problem_id in problems:
        # STOP CONDITION: All types generated
        if len(completed_types) >= len(target_types):
            print(f"\n{Fore.GREEN}Successfully generated clones for ALL types. Stopping.{Style.RESET_ALL}")
            break

        # Basic filter: check if problem has valid seed
        seed_code, sub_id = choose_seed(codenet_df, problem_id)
        if not seed_code:
            continue
            
        # Verify seed compiles/passes tests before using it as base
        if validate_java(seed_code, problem_id, codenet_df) != "passed":
            continue
            
        # Attempt to generate MISSING types
        for gen_type in target_types:
            if gen_type in completed_types:
                continue
            
            # Additional stop check just in case
            if len(completed_types) >= len(target_types):
                break
                
            print(f"Attempting {gen_type} using problem {problem_id}...")
            
            try:
                generated = None
                label = 'clone'
                
                if gen_type.startswith('nonclone_'):
                    subtype = gen_type.split('_')[1] # easy or hard
                    generated = generate_nonclone(model_manager, seed_code, subtype, problem_id, codenet_df)
                    label = 'non-clone'
                else:
                    generated = generate_clone(model_manager, seed_code, gen_type, problem_id, codenet_df)
                    label = 'clone'
                
                if generated:
                    record = {
                        'id': f"{problem_id}_{gen_type}_{uuid.uuid4().hex[:8]}",
                        'code_1': seed_code,
                        'code_2': generated,
                        'label': label,
                        'clone_type': gen_type,
                        'problem_id': problem_id,
                        'generator': args.model,
                        'timestamp': time.time()
                    }
                    
                    # CRITICAL: Write immediately
                    writer.write(record)
                    
                    completed_types.add(gen_type)
                    stats['success'] += 1
                    pbar.update(1)
                    print(f"  {Fore.GREEN}✓ {gen_type} GENERATED & SAVED.{Style.RESET_ALL}")
                else:
                    stats['failed'] += 1
                    print(f"  {Fore.RED}✗ Failed to generate {gen_type}.{Style.RESET_ALL}")
                    
            except Exception as e:
                print(f"Error generating {gen_type} for {problem_id}: {e}")
                stats['failed'] += 1
                
    writer.close()
    pbar.close()
    
    if len(completed_types) < len(target_types):
        print(f"\n{Fore.YELLOW}Finished processing problems but did NOT complete all types.{Style.RESET_ALL}")
        print(f"Missing: {set(target_types) - completed_types}")
    else:
        print(f"\n{Fore.GREEN}Mission Accomplished.{Style.RESET_ALL}")

if __name__ == "__main__":
    main()
