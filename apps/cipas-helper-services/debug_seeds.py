import pandas as pd
import subprocess
import os
import sys
from pathlib import Path
import tempfile

def main():
    print("=== DEBUGGING SEED FAILURES ===")
    
    # 1. Check JDK
    try:
        res = subprocess.run(["javac", "-version"], capture_output=True, text=True)
        if res.returncode == 0:
            print(f"JDK Status: OK ({res.stdout.strip()} {res.stderr.strip()})")
        else:
            print(f"JDK Status: FAIL (Return code {res.returncode})")
    except Exception as e:
        print(f"JDK Status: ERROR ({e})")

    # 2. Load Data
    dataset_path = "Project_CodeNet_Java.parquet"
    if not os.path.exists(dataset_path):
        print(f"Dataset file {dataset_path} NOT FOUND in current directory.")
        return

    print("Loading dataset...")
    try:
        df = pd.read_parquet(dataset_path)
        print(f"Dataset loaded. Rows: {len(df)}")
    except Exception as e:
        print(f"Error loading dataset: {e}")
        return

    # 3. Pick a problem to test
    # Let's try prob 0 (p00000) or similar
    problems = sorted(df['problem_id'].unique())
    target_pid = problems[0]
    print(f"\nTesting Problem ID: {target_pid}")

    # 4. Get Seed
    subset = df[(df['problem_id'] == target_pid) & (df['language'].str.lower() == 'java') & (df['status'].str.lower() == 'accepted')]
    if subset.empty:
        print("No accepted Java solutions for this problem.")
        return
    
    # Sort by length like the main script
    subset = subset.assign(_code_len=subset['source_code'].str.len()).sort_values('_code_len')
    row = subset.iloc[0]
    code = row['source_code']
    print(f"Selected Seed Code Length: {len(code)}")
    
    # 5. Get Test Case (might come from a different row for the same problem)
    problem_rows = df[(df['problem_id'] == target_pid) & df['inputs'].notnull() & df['outputs'].notnull()]
    if problem_rows.empty:
        print("No testcases found for this problem.")
    else:
        test_row = problem_rows.iloc[0]
        input_data = test_row['inputs']
        expected_output = test_row['outputs']
        print(f"Found testcases.")

    # 6. Validate
    print("\nAttempting Compilation & Execution...")
    with tempfile.TemporaryDirectory() as temp_dir:
        java_file = Path(temp_dir) / "Main.java"
        
        # Ensure 'public class Main'
        if "class Main" not in code:
             print("WARNING: 'class Main' not found in code. Script normally wraps this?")
             # The main script doesn't automatically wrap existing seeds, it assumes they are valid.
             # check extraction logic?
        
        java_file.write_text(code, encoding='utf-8')
        
        # Compile
        compile_res = subprocess.run(["javac", "Main.java"], cwd=temp_dir, capture_output=True, text=True)
        if compile_res.returncode != 0:
            print("COMPILATION FAILED:")
            print(compile_res.stderr)
        else:
            print("COMPILATION SUCCESS.")
            
            if problem_rows.empty:
                print("Skipping execution (no inputs).")
            else:
                run_res = subprocess.run(["java", "Main"], cwd=temp_dir, input=input_data, capture_output=True, text=True, timeout=5)
                if run_res.returncode != 0:
                    print(f"RUNTIME ERROR: {run_res.stderr}")
                else:
                    print("RUNTIME SUCCESS.")
                    print(f"Output: {run_res.stdout.strip()[:50]}...")
                    if run_res.stdout.strip() == expected_output.strip():
                        print("VALIDATION PASSED: Output matches.")
                    else:
                        print("VALIDATION FAILED: Output mismatch.")
                        print(f"Expected: {expected_output.strip()[:50]}...")

if __name__ == "__main__":
    main()
