# Type-4 Clone Detection: Execution-Based Semantic Equivalence

This document explains the implementation of Type-4 (semantic) clone detection for Java programs using execution-based validation.

## Table of Contents

1. [Overview](#overview)
2. [Why Execution-Based Validation?](#why-execution-based-validation)
3. [Architecture](#architecture)
4. [Implementation Details](#implementation-details)
5. [Risks and Limitations](#risks-and-limitations)
6. [Performance Considerations](#performance-considerations)
7. [Usage](#usage)

---

## Overview

### What are Type-4 Clones?

**Type-4 clones** are code fragments that are **semantically equivalent** but **syntactically different**. They implement the same functionality using completely different approaches.

Example:

```java
// Program A: Iterative approach
int sum = 0;
for (int i = 1; i <= n; i++) {
    sum += i;
}
return sum;

// Program B: Mathematical formula
return n * (n + 1) / 2;
```

These programs:

- ❌ Are NOT T1 clones (different tokens)
- ❌ Are NOT T2 clones (different structure)
- ❌ Are NOT T3 clones (different AST)
- ✅ ARE T4 clones (same behavior)

### Clone Type Hierarchy

| Type   | Detection Method     | Example                              |
| ------ | -------------------- | ------------------------------------ |
| **T1** | Exact token matching | Same code, different whitespace      |
| **T2** | Canonicalized tokens | Same structure, renamed variables    |
| **T3** | AST similarity       | Similar structure, minor differences |
| **T4** | Execution traces     | Different structure, same behavior   |

**Key Insight**: T4 is the only clone type that requires execution.

---

## Why Execution-Based Validation?

### The Fundamental Problem

**Question**: How do you prove two programs are semantically equivalent?

**Static Analysis Limitations**:

- ❌ Token comparison: Different implementations use different tokens
- ❌ AST similarity: Different algorithms have different structures
- ❌ Control flow analysis: Difficult to prove equivalence for complex logic
- ❌ Symbolic execution: Doesn't scale to real programs

**The ONLY Reliable Solution**: Run both programs and compare their behavior.

### Why Other Approaches Fail

#### Example 1: Different Algorithms

```java
// Bubble Sort
void sort(int[] arr) {
    for (int i = 0; i < arr.length; i++) {
        for (int j = 0; j < arr.length - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}

// Quick Sort
void sort(int[] arr) {
    quickSort(arr, 0, arr.length - 1);
}
void quickSort(int[] arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}
```

**Static Analysis Cannot Prove These Are Equivalent**:

- Completely different control flow
- Different number of functions
- Different variable usage patterns

**But They ARE Equivalent**: Both sort the array correctly.

#### Example 2: Mathematical Optimization

```java
// Approach A: Brute force
int count = 0;
for (int i = 1; i <= n; i++) {
    if (isPrime(i)) count++;
}

// Approach B: Sieve of Eratosthenes
boolean[] sieve = new boolean[n + 1];
Arrays.fill(sieve, true);
for (int p = 2; p * p <= n; p++) {
    if (sieve[p]) {
        for (int i = p * p; i <= n; i += p)
            sieve[i] = false;
    }
}
int count = 0;
for (boolean prime : sieve) if (prime) count++;
```

These have:

- Different complexity (O(n²) vs O(n log log n))
- Different memory usage
- Different loop structures

**But same output**: Count of primes up to n.

### Why Execution Works

**Semantic equivalence means**: For all valid inputs, the outputs are identical.

**Execution-based validation**:

1. ✅ Generate diverse test inputs
2. ✅ Run both programs on ALL test inputs
3. ✅ Compare outputs
4. ✅ If all outputs match → Programs are equivalent

**This is provable** (within the test domain).

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    T4 Clone Detector                        │
│                                                             │
│  ┌─────────────────┐  ┌──────────────────┐                │
│  │  Compilation    │  │  Test Case       │                │
│  │  Service        │  │  Generator       │                │
│  └────────┬────────┘  └────────┬─────────┘                │
│           │                     │                          │
│           ▼                     ▼                          │
│  ┌─────────────────────────────────────┐                  │
│  │      Execution Service              │                  │
│  │  - Sandboxing                       │                  │
│  │  - Timeout enforcement              │                  │
│  │  - Memory limits                    │                  │
│  │  - Output capture                   │                  │
│  └──────────────┬──────────────────────┘                  │
│                 │                                          │
│                 ▼                                          │
│  ┌─────────────────────────────┐                          │
│  │   Trace Comparator          │                          │
│  │  - Compare stdout           │                          │
│  │  - Validate exit codes      │                          │
│  │  - Check for errors         │                          │
│  └─────────────────────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Raw Java Files (data/raw/java/)
        ↓
   Compilation (isolated temp dir)
        ↓
   Test Case Generation (deterministic)
        ↓
   Execution (sandboxed, limited)
        ↓
   Execution Logs (data/execution_logs/<problem_id>/<submission_id>.json)
        ↓
   Trace Comparison (pairwise)
        ↓
   T4 Clone Pairs (data/metadata/t4_pairs.csv)
```

---

## Implementation Details

### 1. Compilation Service

**Purpose**: Compile Java source files in isolation.

**Key Features**:

- ✅ Isolated temporary directories
- ✅ UTF-8 encoding support
- ✅ Timeout (30 seconds)
- ✅ Error capture and reporting
- ✅ .class file verification

**Why Isolation?**

- Prevents conflicts between different submissions
- Clean environment for each compilation
- Easy cleanup after completion

**Code Structure**:

```python
class JavaCompilationService:
    def compile(source_path, output_dir, class_name) -> (success, error_msg)
```

### 2. Test Case Generator

**Purpose**: Generate deterministic test cases for programs.

**Key Features**:

- ✅ **Deterministic**: Fixed seed ensures reproducibility
- ✅ **Problem-aware**: Can use problem-specific constraints
- ✅ **Diverse**: Mix of edge cases and random inputs
- ✅ **Bounded**: Reasonable input sizes

**Why Deterministic?**

- Same programs → same test cases → reproducible results
- Fair comparison between programs
- Enables caching and incremental processing

**Test Case Types**:

1. **Sample inputs**: Provided by problem (if available)
2. **Random inputs**: Generated with fixed seed
3. **Edge cases**: Boundary values (future enhancement)

**Code Structure**:

```python
class TestCaseGenerator:
    def generate_test_cases(problem_id, num_tests, sample_inputs) -> List[TestCase]
```

**Determinism Implementation**:

```python
# Problem-specific seed ensures same tests for same problem
problem_seed = base_seed + hash(problem_id) % (2**31)
problem_rng = random.Random(problem_seed)
```

### 3. Execution Service

**Purpose**: Execute compiled Java programs with strict resource limits.

**Security & Resource Limits**:

- ✅ **CPU timeout**: Prevents infinite loops (default: 5 seconds)
- ✅ **Memory limit**: Prevents memory exhaustion (default: 256 MB)
- ✅ **Process isolation**: Each execution is independent
- ✅ **Output capture**: stdout, stderr, exit code

**Why Sandboxing is Critical**:

- Student code may have infinite loops
- Buggy code could exhaust system resources
- Malicious code could harm the system
- Fair comparison requires equal limits for all programs

**Resource Limits**:

```java
java -Xmx256m -cp <classpath> Main
```

**Timeout Implementation**:

```python
subprocess.run(
    [...],
    timeout=test_case.timeout_seconds  # Enforced by Python
)
```

**Code Structure**:

```python
class JavaExecutionService:
    def execute(class_dir, class_name, test_case, ...) -> ExecutionResult
```

### 4. Execution Result

**Purpose**: Capture complete execution trace for comparison.

**Captured Data**:

```python
@dataclass
class ExecutionResult:
    submission_id: str          # Which program
    problem_id: str             # Which problem
    test_case_id: str           # Which test
    stdout: str                 # Program output
    stderr: str                 # Error messages
    exit_code: int              # 0 = success
    execution_time: float       # Runtime (seconds)
    memory_used: int            # Peak memory (bytes)
    timeout: bool               # Did execution timeout?
    compilation_error: bool     # Did compilation fail?
    error_message: Optional[str] # Human-readable error
```

**Trace Signature**:

```python
def get_trace_signature() -> str:
    """SHA-256 hash of (stdout, exit_code)"""
    trace_data = f"{self.stdout}||{self.exit_code}"
    return hashlib.sha256(trace_data.encode()).hexdigest()
```

**Why hash stdout + exit_code?**

- **stdout**: The actual program output
- **exit_code**: Success/failure status
- **NOT stderr**: May contain JVM-specific messages

### 5. Trace Comparator

**Purpose**: Validate semantic equivalence by comparing execution traces.

**Equivalence Rules**:

Two programs are T4 clones if:

1. ✅ They produce **identical outputs** for ALL test cases
2. ✅ Both execute **successfully** (no crashes/timeouts)
3. ✅ They are **NOT** already T1, T2, or T3 clones

**Why Strict Comparison?**

- Even minor output differences indicate different semantics
- Timeouts/crashes are semantic differences
- We want **provable equivalence**, not approximation

**Comparison Algorithm**:

```python
def compare_traces(traces_a, traces_b) -> (equivalent, reason):
    1. Check same number of tests
    2. Sort by test_case_id (deterministic order)
    3. For each test case:
       a. Check both succeeded (no timeout/compilation error/crash)
       b. Compare trace signatures
       c. If any mismatch → NOT equivalent
    4. If all match → Equivalent
```

**Code Structure**:

```python
class TraceComparator:
    def compare_traces(traces_a, traces_b) -> (bool, Optional[str])
```

### 6. T4 Clone Detector (Orchestrator)

**Purpose**: Coordinate the entire T4 detection pipeline.

**Pipeline Steps**:

```
1. Load candidate pairs
   ↓ (exclude existing T1/T2/T3 pairs)
2. For each problem:
   a. Generate test cases (once per problem)
   b. For each submission:
      - Compile
      - Execute all test cases
      - Save execution log
   c. Compare all pairs:
      - Skip existing T1/T2/T3 pairs
      - Compare traces
      - Label T4 clones
3. Save results
```

**Why This Order?**

1. **Test generation once**: Efficiency (reuse tests for all submissions)
2. **Compile first**: Fast filter (broken code eliminated early)
3. **Execute all tests**: Complete behavioral profile
4. **Compare pairwise**: Final validation

**Candidate Pair Selection**:

- ✅ Same problem (semantic equivalence only makes sense for same task)
- ✅ NOT already T1/T2/T3 (avoid redundant detection)
- ✅ Both compile successfully
- ✅ Both execute successfully on all tests

---

## Risks and Limitations

### False Positives

**When can T4 detection incorrectly label non-clones as clones?**

#### 1. Insufficient Test Coverage

**Problem**: Limited test cases may not expose behavioral differences.

**Example**:

```java
// Program A: Returns input
int f(int x) { return x; }

// Program B: Returns 0 for x=0, input otherwise
int f(int x) { return x == 0 ? 0 : x; }
```

If test cases never include `x=0`, these appear equivalent.

**Mitigation**:

- ✅ Generate diverse test cases
- ✅ Include edge cases (0, negative, max values)
- ✅ Use problem-specific constraints when available
- ✅ Increase number of test cases (default: 10)

#### 2. Equivalent Wrong Solutions

**Problem**: Two programs with the same bug produce identical (wrong) outputs.

**Example**:

```java
// Both programs have off-by-one error
// Program A
for (int i = 0; i < n - 1; i++) sum += arr[i];

// Program B
for (int i = 0; i <= n - 2; i++) sum += arr[i];
```

Both are wrong, but behaviorally equivalent.

**Mitigation**:

- ⚠️ This is a **known limitation**
- T4 detection validates **behavioral equivalence**, not **correctness**
- If reference solutions exist, validate against them first
- Use test cases from known-correct submissions

#### 3. Non-Deterministic Output

**Problem**: Programs with randomness or timestamps may produce different outputs.

**Example**:

```java
System.out.println(System.currentTimeMillis());
System.out.println(Math.random());
```

Same program produces different output each run.

**Mitigation**:

- ⚠️ **Not supported** in current implementation
- Competitive programming problems are typically deterministic
- If needed: Modify programs to use fixed seeds
- Or: Parse and normalize non-deterministic parts

### False Negatives

**When can T4 detection miss actual clones?**

#### 1. Different Output Formats

**Problem**: Semantically equivalent but formatted differently.

**Example**:

```java
// Program A: One line
System.out.println("1 2 3");

// Program B: Multiple lines
System.out.println("1");
System.out.println("2");
System.out.println("3");
```

Same numbers, different format.

**Mitigation**:

- ✅ Problem statements usually specify exact output format
- ⚠️ If format is flexible, normalize outputs before comparison
- Future enhancement: Configurable output normalization

#### 2. Floating-Point Precision

**Problem**: Different rounding or precision.

**Example**:

```java
// Program A
System.out.println(1.0 / 3.0);  // 0.3333333333333333

// Program B
System.out.printf("%.2f", 1.0 / 3.0);  // 0.33
```

**Mitigation**:

- ✅ Most competitive programming problems avoid floating-point
- ⚠️ If needed: Implement epsilon-based comparison
- Future enhancement: Floating-point tolerance

#### 3. Timeouts on Slow Solutions

**Problem**: Correct but inefficient solution times out.

**Example**:

```java
// O(n²) solution times out for large n
// O(n log n) solution succeeds
```

**Mitigation**:

- ✅ Use reasonable timeout limits (default: 5 seconds)
- ⚠️ This is **intentional**: Different time complexity = different semantics
- If both would succeed given infinite time, increase timeout

### Security Risks

#### 1. Malicious Code Execution

**Problem**: Student submissions could contain malicious code.

**Examples**:

- File system access
- Network connections
- Resource exhaustion

**Mitigation**:

- ✅ Process isolation (subprocess)
- ✅ Timeout enforcement
- ✅ Memory limits
- ⚠️ Consider Docker containers for stronger isolation
- ⚠️ Consider running on isolated VMs

#### 2. Resource Exhaustion

**Problem**: Many executions can consume significant resources.

**Mitigation**:

- ✅ Per-execution timeout (5 seconds)
- ✅ Per-execution memory limit (256 MB)
- ✅ Graceful error handling
- ✅ Progress logging

---

## Performance Considerations

### Why Execution-Based Detection is Expensive

**Cost Breakdown** (per problem with N submissions, T test cases):

| Operation   | Complexity | Time per Unit  |
| ----------- | ---------- | -------------- |
| Compilation | O(N)       | ~1-5 seconds   |
| Execution   | O(N × T)   | ~0.1-5 seconds |
| Comparison  | O(N²)      | ~0.001 seconds |

**Total**: O(N² × T) in worst case

**Example**: 100 submissions, 10 tests

- Compilations: 100 × 2s = 200s
- Executions: 100 × 10 × 0.5s = 500s
- Comparisons: 4,950 × 0.001s = 5s
- **Total**: ~12 minutes per problem

### Optimization Strategies

#### 1. Early Filtering

```python
# Exclude T1/T2/T3 pairs (already detected)
if pair in existing_pairs:
    continue
```

**Savings**: Reduces comparison pairs by ~30-50%

#### 2. Compilation Caching

**Not implemented** (future enhancement):

```python
# Cache compiled .class files
if compiled_before:
    reuse_class_files()
else:
    compile()
```

**Savings**: Eliminates redundant compilations

#### 3. Execution Caching

**Not implemented** (future enhancement):

```python
# Cache execution results
if executed_before_with_same_tests:
    load_cached_results()
else:
    execute()
```

**Savings**: Enables incremental processing

#### 4. Parallel Execution

**Not implemented** (future enhancement):

```python
# Execute submissions in parallel
with ProcessPoolExecutor() as executor:
    results = executor.map(execute, submissions)
```

**Savings**: 4-8× speedup on multi-core machines

### When to Apply T4 Detection

**Recommended Strategy**: Apply detection types in order.

```
1. T1 Detection (fastest, ~seconds)
   ↓ Exclude T1 pairs
2. T2 Detection (fast, ~seconds)
   ↓ Exclude T2 pairs
3. T3 Detection (moderate, ~minutes)
   ↓ Exclude T3 pairs
4. T4 Detection (expensive, ~hours)
   ↓ Only on remaining candidates
```

**Why This Order?**

- Cheaper methods eliminate most clones
- T4 only runs on small subset
- Total time minimized

**Example Dataset** (1000 submissions):

- T1 detects: 400 pairs (1 second)
- T2 detects: 200 pairs (5 seconds)
- T3 detects: 100 pairs (10 minutes)
- T4 detects: 50 pairs (2 hours)

Without filtering: T4 would check all 499,500 pairs!

---

## Usage

### Basic Usage

```bash
cd apps/model-orchestrator/app/models/cipas/code_clone_detection
python scripts/t4_clone_detection.py
```

### Prerequisites

1. **Java Development Kit (JDK)**:

   ```bash
   # Verify installation
   javac -version
   java -version
   ```

2. **Input Data**:

   ```
   data/raw/java/<problem_id>/<submission_id>/Main.java
   ```

3. **Previous Detection Results** (optional):
   ```
   data/metadata/t1_t2_pairs.csv
   data/metadata/t3_pairs.csv
   ```

### Output Files

#### 1. Execution Logs

**Location**: `data/execution_logs/<problem_id>/<submission_id>.json`

**Format**:

```json
{
  "problem_id": "p00001",
  "submission_id": "s123456789",
  "num_tests": 10,
  "results": [
    {
      "submission_id": "s123456789",
      "problem_id": "p00001",
      "test_case_id": "p00001_sample_0",
      "stdout": "42\n",
      "stderr": "",
      "exit_code": 0,
      "execution_time": 0.15,
      "memory_used": 0,
      "timeout": false,
      "compilation_error": false,
      "error_message": null
    }
  ]
}
```

#### 2. T4 Clone Pairs

**Location**: `data/metadata/t4_pairs.csv`

**Format**:

```csv
problem_id,submission_id_1,submission_id_2,clone_type,confidence,detection_method
p00001,s123456789,s987654321,T4,1.0,execution_trace_comparison
```

**Fields**:

- `problem_id`: Problem identifier
- `submission_id_1`: First submission
- `submission_id_2`: Second submission
- `clone_type`: Always "T4"
- `confidence`: Always 1.0 (provable equivalence)
- `detection_method`: "execution_trace_comparison"

### Configuration

**Configurable Parameters** (edit `main()` function):

```python
detector = T4CloneDetector(
    raw_dir=raw_dir,              # Source files location
    output_dir=output_dir,        # Output location
    t1_t2_pairs_path=...,         # T1/T2 pairs to exclude
    t3_pairs_path=...,            # T3 pairs to exclude
    num_test_cases=10,            # Tests per problem
    seed=42                       # Random seed
)
```

**Resource Limits** (edit `TestCase` class):

```python
TestCase(
    ...,
    timeout_seconds=5,    # Max execution time
    memory_limit_mb=256   # Max heap size
)
```

### Logging

**Log Levels**:

- `INFO`: Progress updates
- `WARNING`: Non-fatal issues
- `ERROR`: Fatal errors

**Log Output**:

```
2025-12-03 10:00:00 - INFO - Java compiler available: javac 11.0.12
2025-12-03 10:00:01 - INFO - Java runtime available: openjdk version "11.0.12"
2025-12-03 10:00:02 - INFO - Loaded 500 existing T1/T2/T3 pairs to exclude
2025-12-03 10:00:03 - INFO - Found 50 problems with multiple submissions
2025-12-03 10:00:04 - INFO - Processing problem p00001 (20 submissions)
2025-12-03 10:00:05 - INFO -   Executing s123456789...
2025-12-03 10:00:10 - INFO -   Found T4 clone: s123456789 <-> s987654321
2025-12-03 10:05:00 - INFO - Progress: 10/50 problems
...
2025-12-03 12:00:00 - INFO - T4 clone detection complete. Found 25 T4 clone pairs.
```

---

## Conclusion

### Key Takeaways

1. **T4 clones require execution**: Static analysis cannot detect semantic equivalence

2. **Determinism is critical**: Reproducible results require fixed seeds and consistent environments

3. **Sandboxing is essential**: Student code must run in isolated, limited environments

4. **False positives/negatives exist**: No detection method is perfect

5. **Performance matters**: T4 is expensive; apply only after T1/T2/T3 filtering

### Future Enhancements

- [ ] **Problem-specific test generation**: Parse constraints from problem descriptions
- [ ] **Output normalization**: Handle flexible formatting
- [ ] **Floating-point tolerance**: Epsilon-based comparison
- [ ] **Parallel execution**: Speed up processing
- [ ] **Docker isolation**: Stronger security
- [ ] **Reference solution validation**: Detect correct vs. incorrect equivalence
- [ ] **Incremental processing**: Cache compilation and execution results

### References

- [Code Clone Detection: A Survey](https://dl.acm.org/doi/10.1145/3295750)
- [Project CodeNet: A Large-Scale AI for Code Dataset](https://github.com/IBM/Project_CodeNet)
- [Semantic Clone Detection Using Machine Learning](https://ieeexplore.ieee.org/document/8812053)

---

**Document Version**: 1.0  
**Last Updated**: December 3, 2025  
**Author**: Code Clone Detection Research Team
