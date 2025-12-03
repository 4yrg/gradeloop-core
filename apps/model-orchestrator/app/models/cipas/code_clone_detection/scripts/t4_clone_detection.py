#!/usr/bin/env python3
"""
Type-4 Clone Detection: Execution-Based Semantic Equivalence for Java Programs.

This module implements Type-4 (semantic) clone detection by executing Java programs
and comparing their behavior. Unlike syntactic clones (T1-T3), T4 clones can have
completely different code structure but produce identical outputs.

Why Execution-Based Validation?
================================
T4 clones cannot be detected through:
- Token comparison (T1/T2) - different tokens
- AST similarity (T3) - different structure
- Static analysis - behavior is not statically apparent

The ONLY reliable way to detect T4 clones is to execute programs and compare
their runtime behavior.

Architecture:
============
1. Compilation Service: Compiles Java source in isolation
2. Test Generation: Creates deterministic test cases
3. Execution Service: Runs programs with sandboxing
4. Trace Comparison: Validates semantic equivalence
5. Clone Labeling: Identifies T4 pairs (excluding T1-T3)

Engineering Constraints:
=======================
- Strict sandboxing (timeouts, memory limits)
- Deterministic test generation (fixed seed)
- Graceful error handling
- Clean separation of concerns
"""

import json
import logging
import subprocess
import tempfile
import shutil
import csv
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Set
from dataclasses import dataclass, asdict
from collections import defaultdict
import hashlib
import random
import time
import resource
import signal

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class ExecutionResult:
    """
    Represents the result of executing a Java program.
    
    This captures everything needed to compare program behavior:
    - stdout: Normal program output
    - stderr: Error messages (if any)
    - exit_code: Process exit status
    - execution_time: Runtime in seconds
    - memory_used: Peak memory usage in bytes
    - timeout: Whether execution exceeded time limit
    - compilation_error: Whether compilation failed
    """
    submission_id: str
    problem_id: str
    test_case_id: str
    stdout: str
    stderr: str
    exit_code: int
    execution_time: float
    memory_used: int
    timeout: bool
    compilation_error: bool
    error_message: Optional[str] = None
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization."""
        return asdict(self)
    
    def get_trace_signature(self) -> str:
        """
        Generate a unique signature for this execution trace.
        
        Two programs are semantically equivalent if they produce
        the same trace signature for all test cases.
        
        Returns:
            SHA-256 hash of (stdout, exit_code) tuple
        """
        # Only consider stdout and exit_code for equivalence
        # stderr may contain JVM-specific messages
        trace_data = f"{self.stdout}||{self.exit_code}"
        return hashlib.sha256(trace_data.encode('utf-8')).hexdigest()


@dataclass
class TestCase:
    """
    Represents a single test case for a Java program.
    
    Attributes:
        test_id: Unique identifier for this test
        stdin_data: Input to be fed to the program
        expected_behavior: Optional description of expected output
        timeout_seconds: Maximum execution time
        memory_limit_mb: Maximum memory usage
    """
    test_id: str
    stdin_data: str
    expected_behavior: Optional[str] = None
    timeout_seconds: int = 5
    memory_limit_mb: int = 256


class JavaCompilationService:
    """
    Handles compilation of Java source files in an isolated environment.
    
    Design Principles:
    - Isolation: Each compilation happens in a temporary directory
    - Error Handling: Captures and reports compilation errors
    - Cleanup: Ensures temporary files are removed
    - Determinism: Same source always produces same result
    """
    
    def __init__(self, javac_path: str = "javac"):
        """
        Initialize compilation service.
        
        Args:
            javac_path: Path to javac compiler (default: use system PATH)
        """
        self.javac_path = javac_path
        self._verify_compiler()
    
    def _verify_compiler(self):
        """Verify that javac is available."""
        try:
            result = subprocess.run(
                [self.javac_path, "-version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode != 0:
                raise RuntimeError(f"javac verification failed: {result.stderr}")
            logger.info(f"Java compiler available: {result.stderr.strip()}")
        except FileNotFoundError:
            raise RuntimeError(f"Java compiler not found: {self.javac_path}")
        except subprocess.TimeoutExpired:
            raise RuntimeError("Java compiler verification timed out")
    
    def compile(
        self,
        source_path: Path,
        output_dir: Path,
        class_name: str
    ) -> Tuple[bool, Optional[str]]:
        """
        Compile a Java source file.
        
        Args:
            source_path: Path to .java source file
            output_dir: Directory for .class files
            class_name: Expected main class name
            
        Returns:
            Tuple of (success: bool, error_message: Optional[str])
        """
        try:
            # Ensure output directory exists
            output_dir.mkdir(parents=True, exist_ok=True)
            
            # Compile with specific output directory
            result = subprocess.run(
                [
                    self.javac_path,
                    "-d", str(output_dir),
                    "-encoding", "UTF-8",
                    str(source_path)
                ],
                capture_output=True,
                text=True,
                timeout=30  # Compilation should be fast
            )
            
            if result.returncode != 0:
                return False, result.stderr
            
            # Verify that .class file was created
            class_file = output_dir / f"{class_name}.class"
            if not class_file.exists():
                return False, f"Expected class file not found: {class_name}.class"
            
            return True, None
            
        except subprocess.TimeoutExpired:
            return False, "Compilation timeout (30s exceeded)"
        except Exception as e:
            return False, f"Compilation error: {str(e)}"


class TestCaseGenerator:
    """
    Generates deterministic test cases for Java programs.
    
    Design Principles:
    - Deterministic: Fixed seed ensures reproducibility
    - Problem-Aware: Uses problem constraints if available
    - Bounded: Reasonable input sizes to prevent hangs
    - Diverse: Mix of edge cases and random inputs
    
    Why Deterministic?
    - Reproducible results across runs
    - Fair comparison between programs
    - Enables caching and incremental processing
    """
    
    def __init__(self, seed: int = 42):
        """
        Initialize test case generator.
        
        Args:
            seed: Random seed for deterministic generation
        """
        self.seed = seed
        self.rng = random.Random(seed)
    
    def generate_test_cases(
        self,
        problem_id: str,
        num_tests: int = 10,
        sample_inputs: Optional[List[str]] = None
    ) -> List[TestCase]:
        """
        Generate test cases for a competitive programming problem.
        
        Args:
            problem_id: Unique problem identifier
            num_tests: Number of random tests to generate
            sample_inputs: Optional provided sample inputs
            
        Returns:
            List of TestCase objects
        """
        test_cases = []
        
        # 1. Add provided sample inputs (if any)
        if sample_inputs:
            for idx, sample_input in enumerate(sample_inputs):
                test_cases.append(TestCase(
                    test_id=f"{problem_id}_sample_{idx}",
                    stdin_data=sample_input,
                    expected_behavior="Sample test case"
                ))
        
        # 2. Generate deterministic random test cases
        # Reset RNG to ensure determinism for this specific problem
        problem_seed = self.seed + hash(problem_id) % (2**31)
        problem_rng = random.Random(problem_seed)
        
        for i in range(num_tests):
            test_cases.append(self._generate_random_test(
                problem_id=problem_id,
                test_idx=i,
                rng=problem_rng
            ))
        
        return test_cases
    
    def _generate_random_test(
        self,
        problem_id: str,
        test_idx: int,
        rng: random.Random
    ) -> TestCase:
        """
        Generate a single random test case.
        
        This is a generic generator. In production, you would:
        - Parse problem constraints from metadata
        - Generate inputs according to those constraints
        - Use problem-specific input formats
        
        For now, we generate simple numeric inputs.
        """
        # Generate 1-10 random integers in range [0, 100]
        num_inputs = rng.randint(1, 10)
        values = [rng.randint(0, 100) for _ in range(num_inputs)]
        stdin_data = "\n".join(map(str, values)) + "\n"
        
        return TestCase(
            test_id=f"{problem_id}_random_{test_idx}",
            stdin_data=stdin_data,
            expected_behavior="Random test case"
        )


class JavaExecutionService:
    """
    Executes compiled Java programs with strict sandboxing.
    
    Security & Resource Limits:
    - CPU timeout: Prevents infinite loops
    - Memory limit: Prevents memory exhaustion
    - Process isolation: Each execution is independent
    
    Why Sandboxing is Critical:
    - Student code may have infinite loops
    - Malicious or buggy code could exhaust resources
    - Fair comparison requires equal resource limits
    """
    
    def __init__(self, java_path: str = "java"):
        """
        Initialize execution service.
        
        Args:
            java_path: Path to java runtime (default: use system PATH)
        """
        self.java_path = java_path
        self._verify_runtime()
    
    def _verify_runtime(self):
        """Verify that java is available."""
        try:
            result = subprocess.run(
                [self.java_path, "-version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            # java -version outputs to stderr
            version_info = result.stderr.strip() or result.stdout.strip()
            logger.info(f"Java runtime available: {version_info.split(chr(10))[0]}")
        except FileNotFoundError:
            raise RuntimeError(f"Java runtime not found: {self.java_path}")
        except subprocess.TimeoutExpired:
            raise RuntimeError("Java runtime verification timed out")
    
    def execute(
        self,
        class_dir: Path,
        class_name: str,
        test_case: TestCase,
        submission_id: str,
        problem_id: str
    ) -> ExecutionResult:
        """
        Execute a compiled Java program with a test case.
        
        Args:
            class_dir: Directory containing .class files
            class_name: Main class name to execute
            test_case: Test case to run
            submission_id: Submission identifier
            problem_id: Problem identifier
            
        Returns:
            ExecutionResult with execution trace
        """
        start_time = time.time()
        timeout_occurred = False
        
        try:
            # Run java with resource limits
            result = subprocess.run(
                [
                    self.java_path,
                    "-cp", str(class_dir),
                    f"-Xmx{test_case.memory_limit_mb}m",  # Max heap size
                    class_name
                ],
                input=test_case.stdin_data,
                capture_output=True,
                text=True,
                timeout=test_case.timeout_seconds
            )
            
            execution_time = time.time() - start_time
            
            return ExecutionResult(
                submission_id=submission_id,
                problem_id=problem_id,
                test_case_id=test_case.test_id,
                stdout=result.stdout,
                stderr=result.stderr,
                exit_code=result.returncode,
                execution_time=execution_time,
                memory_used=0,  # Not easily measurable without OS-specific tools
                timeout=False,
                compilation_error=False
            )
            
        except subprocess.TimeoutExpired as e:
            execution_time = time.time() - start_time
            return ExecutionResult(
                submission_id=submission_id,
                problem_id=problem_id,
                test_case_id=test_case.test_id,
                stdout=e.stdout.decode('utf-8') if e.stdout else "",
                stderr=e.stderr.decode('utf-8') if e.stderr else "",
                exit_code=-1,
                execution_time=execution_time,
                memory_used=0,
                timeout=True,
                compilation_error=False,
                error_message=f"Execution timeout ({test_case.timeout_seconds}s)"
            )
        
        except Exception as e:
            execution_time = time.time() - start_time
            return ExecutionResult(
                submission_id=submission_id,
                problem_id=problem_id,
                test_case_id=test_case.test_id,
                stdout="",
                stderr=str(e),
                exit_code=-1,
                execution_time=execution_time,
                memory_used=0,
                timeout=False,
                compilation_error=False,
                error_message=f"Execution error: {str(e)}"
            )


class TraceComparator:
    """
    Compares execution traces to validate semantic equivalence.
    
    Two programs are semantically equivalent (T4 clones) if:
    1. They produce identical outputs for ALL test cases
    2. Both execute successfully (no crashes/timeouts)
    3. They are NOT already T1, T2, or T3 clones
    
    Why Strict Comparison?
    - Even minor output differences indicate different semantics
    - Timeouts/crashes are semantic differences
    - We want provable equivalence, not approximation
    """
    
    def compare_traces(
        self,
        traces_a: List[ExecutionResult],
        traces_b: List[ExecutionResult]
    ) -> Tuple[bool, Optional[str]]:
        """
        Compare execution traces from two programs.
        
        Args:
            traces_a: Execution results from program A
            traces_b: Execution results from program B
            
        Returns:
            Tuple of (are_equivalent: bool, reason: Optional[str])
        """
        # Must have same number of test results
        if len(traces_a) != len(traces_b):
            return False, f"Different number of test results: {len(traces_a)} vs {len(traces_b)}"
        
        # Sort by test_case_id for deterministic comparison
        traces_a = sorted(traces_a, key=lambda t: t.test_case_id)
        traces_b = sorted(traces_b, key=lambda t: t.test_case_id)
        
        # Compare each test case
        for trace_a, trace_b in zip(traces_a, traces_b):
            # Test IDs must match
            if trace_a.test_case_id != trace_b.test_case_id:
                return False, f"Test ID mismatch: {trace_a.test_case_id} vs {trace_b.test_case_id}"
            
            # Both must succeed (no timeouts, compilation errors, crashes)
            if trace_a.timeout or trace_b.timeout:
                return False, f"Timeout in test {trace_a.test_case_id}"
            
            if trace_a.compilation_error or trace_b.compilation_error:
                return False, f"Compilation error in test {trace_a.test_case_id}"
            
            if trace_a.exit_code != 0 or trace_b.exit_code != 0:
                return False, f"Non-zero exit code in test {trace_a.test_case_id}"
            
            # Compare trace signatures
            sig_a = trace_a.get_trace_signature()
            sig_b = trace_b.get_trace_signature()
            
            if sig_a != sig_b:
                return False, f"Different output in test {trace_a.test_case_id}"
        
        return True, None


class T4CloneDetector:
    """
    Main orchestrator for Type-4 clone detection.
    
    Pipeline:
    1. Load candidate pairs (non-T1/T2/T3 pairs from same problem)
    2. For each pair:
       a. Compile both programs
       b. Generate test cases
       c. Execute both programs on all tests
       d. Compare execution traces
       e. Label as T4 if traces match
    3. Save results
    
    Why This Order?
    - Compilation first: Fast filter for broken code
    - Test generation once: Reuse tests for all submissions
    - Execution expensive: Only do for compiled pairs
    - Comparison last: Final validation
    """
    
    def __init__(
        self,
        raw_dir: Path,
        output_dir: Path,
        t1_t2_pairs_path: Optional[Path] = None,
        t3_pairs_path: Optional[Path] = None,
        num_test_cases: int = 10,
        seed: int = 42
    ):
        """
        Initialize T4 clone detector.
        
        Args:
            raw_dir: Directory containing raw Java source files
            output_dir: Directory for execution logs
            t1_t2_pairs_path: Path to T1/T2 pairs CSV (to exclude)
            t3_pairs_path: Path to T3 pairs CSV (to exclude)
            num_test_cases: Number of test cases per problem
            seed: Random seed for test generation
        """
        self.raw_dir = raw_dir
        self.output_dir = output_dir
        self.execution_logs_dir = output_dir / "execution_logs"
        self.metadata_dir = output_dir / "metadata"
        
        self.compilation_service = JavaCompilationService()
        self.execution_service = JavaExecutionService()
        self.test_generator = TestCaseGenerator(seed=seed)
        self.trace_comparator = TraceComparator()
        
        # Load existing clone pairs to exclude
        self.existing_pairs = self._load_existing_pairs(t1_t2_pairs_path, t3_pairs_path)
        
        self.num_test_cases = num_test_cases
    
    def _load_existing_pairs(
        self,
        t1_t2_path: Optional[Path],
        t3_path: Optional[Path]
    ) -> Set[Tuple[str, str]]:
        """
        Load existing T1/T2/T3 clone pairs to exclude from T4 detection.
        
        Returns:
            Set of (submission_id1, submission_id2) tuples
        """
        existing = set()
        
        for path in [t1_t2_path, t3_path]:
            if path and path.exists():
                with open(path, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        sub1 = row['submission_id_1']
                        sub2 = row['submission_id_2']
                        # Store in canonical order (sorted)
                        pair = tuple(sorted([sub1, sub2]))
                        existing.add(pair)
        
        logger.info(f"Loaded {len(existing)} existing T1/T2/T3 pairs to exclude")
        return existing
    
    def _get_candidate_pairs(self) -> Dict[str, List[Path]]:
        """
        Identify candidate submission pairs for T4 detection.
        
        Returns:
            Dict mapping problem_id to list of submission paths
        """
        problem_submissions = defaultdict(list)
        
        java_dir = self.raw_dir / "java"
        if not java_dir.exists():
            logger.warning(f"Raw Java directory not found: {java_dir}")
            return {}
        
        # Group submissions by problem
        for problem_dir in java_dir.iterdir():
            if not problem_dir.is_dir():
                continue
            
            problem_id = problem_dir.name
            
            for submission_dir in problem_dir.iterdir():
                if not submission_dir.is_dir():
                    continue
                
                # Find Main.java file
                main_file = submission_dir / "Main.java"
                if main_file.exists():
                    problem_submissions[problem_id].append(main_file)
        
        logger.info(f"Found {len(problem_submissions)} problems with multiple submissions")
        return problem_submissions
    
    def _compile_and_execute(
        self,
        source_path: Path,
        test_cases: List[TestCase],
        problem_id: str,
        submission_id: str
    ) -> Tuple[bool, List[ExecutionResult]]:
        """
        Compile and execute a single submission.
        
        Returns:
            Tuple of (success: bool, execution_results: List[ExecutionResult])
        """
        # Create temporary directory for compilation
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            class_dir = temp_path / "classes"
            
            # Compile
            success, error = self.compilation_service.compile(
                source_path=source_path,
                output_dir=class_dir,
                class_name="Main"
            )
            
            if not success:
                # Return compilation error result
                error_result = ExecutionResult(
                    submission_id=submission_id,
                    problem_id=problem_id,
                    test_case_id="compilation",
                    stdout="",
                    stderr=error or "Unknown compilation error",
                    exit_code=-1,
                    execution_time=0.0,
                    memory_used=0,
                    timeout=False,
                    compilation_error=True,
                    error_message=error
                )
                return False, [error_result]
            
            # Execute all test cases
            results = []
            for test_case in test_cases:
                result = self.execution_service.execute(
                    class_dir=class_dir,
                    class_name="Main",
                    test_case=test_case,
                    submission_id=submission_id,
                    problem_id=problem_id
                )
                results.append(result)
            
            return True, results
    
    def _save_execution_log(
        self,
        problem_id: str,
        submission_id: str,
        results: List[ExecutionResult]
    ):
        """Save execution log to JSON file."""
        log_dir = self.execution_logs_dir / problem_id
        log_dir.mkdir(parents=True, exist_ok=True)
        
        log_file = log_dir / f"{submission_id}.json"
        
        log_data = {
            "problem_id": problem_id,
            "submission_id": submission_id,
            "num_tests": len(results),
            "results": [r.to_dict() for r in results]
        }
        
        with open(log_file, 'w', encoding='utf-8') as f:
            json.dump(log_data, f, indent=2)
    
    def detect_t4_clones(self) -> List[Tuple[str, str, str, float]]:
        """
        Detect Type-4 clones using execution-based validation.
        
        Returns:
            List of (problem_id, submission_id_1, submission_id_2, confidence) tuples
        """
        t4_pairs = []
        candidate_pairs = self._get_candidate_pairs()
        
        total_problems = len(candidate_pairs)
        processed_problems = 0
        
        for problem_id, submission_paths in candidate_pairs.items():
            logger.info(f"Processing problem {problem_id} ({len(submission_paths)} submissions)")
            
            # Generate test cases once per problem
            test_cases = self.test_generator.generate_test_cases(
                problem_id=problem_id,
                num_tests=self.num_test_cases
            )
            
            # Compile and execute all submissions
            execution_cache: Dict[str, Tuple[bool, List[ExecutionResult]]] = {}
            
            for source_path in submission_paths:
                submission_id = source_path.parent.name
                
                logger.info(f"  Executing {submission_id}...")
                success, results = self._compile_and_execute(
                    source_path=source_path,
                    test_cases=test_cases,
                    problem_id=problem_id,
                    submission_id=submission_id
                )
                
                execution_cache[submission_id] = (success, results)
                
                # Save execution log
                self._save_execution_log(problem_id, submission_id, results)
            
            # Compare all pairs
            submission_ids = list(execution_cache.keys())
            for i in range(len(submission_ids)):
                for j in range(i + 1, len(submission_ids)):
                    sub1, sub2 = submission_ids[i], submission_ids[j]
                    
                    # Skip if already T1/T2/T3 clone
                    pair_key = tuple(sorted([sub1, sub2]))
                    if pair_key in self.existing_pairs:
                        continue
                    
                    # Both must have executed successfully
                    success1, traces1 = execution_cache[sub1]
                    success2, traces2 = execution_cache[sub2]
                    
                    if not (success1 and success2):
                        continue
                    
                    # Compare traces
                    equivalent, reason = self.trace_comparator.compare_traces(traces1, traces2)
                    
                    if equivalent:
                        logger.info(f"  Found T4 clone: {sub1} <-> {sub2}")
                        t4_pairs.append((problem_id, sub1, sub2, 1.0))
            
            processed_problems += 1
            logger.info(f"Progress: {processed_problems}/{total_problems} problems")
        
        return t4_pairs
    
    def save_results(self, t4_pairs: List[Tuple[str, str, str, float]]):
        """
        Save T4 clone pairs to CSV.
        
        Args:
            t4_pairs: List of (problem_id, sub1, sub2, confidence) tuples
        """
        self.metadata_dir.mkdir(parents=True, exist_ok=True)
        output_file = self.metadata_dir / "t4_pairs.csv"
        
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow([
                'problem_id',
                'submission_id_1',
                'submission_id_2',
                'clone_type',
                'confidence',
                'detection_method'
            ])
            
            for problem_id, sub1, sub2, confidence in t4_pairs:
                writer.writerow([
                    problem_id,
                    sub1,
                    sub2,
                    'T4',
                    confidence,
                    'execution_trace_comparison'
                ])
        
        logger.info(f"Saved {len(t4_pairs)} T4 pairs to {output_file}")


def main():
    """Main entry point for T4 clone detection."""
    # Set up paths
    base_dir = Path(__file__).parent.parent
    raw_dir = base_dir / "data" / "raw"
    output_dir = base_dir / "data"
    
    t1_t2_pairs = base_dir / "data" / "metadata" / "t1_t2_pairs.csv"
    t3_pairs = base_dir / "data" / "metadata" / "t3_pairs.csv"
    
    # Initialize detector
    detector = T4CloneDetector(
        raw_dir=raw_dir,
        output_dir=output_dir,
        t1_t2_pairs_path=t1_t2_pairs if t1_t2_pairs.exists() else None,
        t3_pairs_path=t3_pairs if t3_pairs.exists() else None,
        num_test_cases=10,
        seed=42
    )
    
    # Detect T4 clones
    logger.info("Starting T4 clone detection...")
    t4_pairs = detector.detect_t4_clones()
    
    # Save results
    detector.save_results(t4_pairs)
    
    logger.info(f"T4 clone detection complete. Found {len(t4_pairs)} T4 clone pairs.")


if __name__ == "__main__":
    main()
