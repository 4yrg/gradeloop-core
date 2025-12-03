#!/usr/bin/env python3
"""
Main orchestration script for Type-4 Clone Detection.

This script provides a simple command-line interface for running T4 clone detection
with configurable parameters.

Usage:
    python t4_detect_clones.py [--config CONFIG_PATH]
    
Examples:
    # Use default configuration
    python t4_detect_clones.py
    
    # Custom test count and seed
    python t4_detect_clones.py --num-tests 20 --seed 12345
    
    # Custom paths
    python t4_detect_clones.py --raw-dir /path/to/raw --output-dir /path/to/output
"""

import argparse
import logging
import sys
from pathlib import Path
from typing import Optional

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent))

from t4_clone_detection import T4CloneDetector

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def parse_args():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description='Type-4 Clone Detection using Execution-Based Validation',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Use default settings
  python t4_detect_clones.py
  
  # Custom test count
  python t4_detect_clones.py --num-tests 20
  
  # Custom paths
  python t4_detect_clones.py --raw-dir ../data/raw --output-dir ../data
  
  # Custom timeout and memory
  python t4_detect_clones.py --timeout 10 --memory 512
  
  # Skip excluding T1/T2/T3 pairs
  python t4_detect_clones.py --no-exclude-existing
        """
    )
    
    # Path arguments
    parser.add_argument(
        '--raw-dir',
        type=Path,
        default=None,
        help='Directory containing raw Java source files (default: ../data/raw)'
    )
    
    parser.add_argument(
        '--output-dir',
        type=Path,
        default=None,
        help='Directory for output files (default: ../data)'
    )
    
    parser.add_argument(
        '--t1-t2-pairs',
        type=Path,
        default=None,
        help='Path to T1/T2 pairs CSV (default: ../data/metadata/t1_t2_pairs.csv)'
    )
    
    parser.add_argument(
        '--t3-pairs',
        type=Path,
        default=None,
        help='Path to T3 pairs CSV (default: ../data/metadata/t3_pairs.csv)'
    )
    
    # Detection parameters
    parser.add_argument(
        '--num-tests',
        type=int,
        default=10,
        help='Number of test cases per problem (default: 10)'
    )
    
    parser.add_argument(
        '--seed',
        type=int,
        default=42,
        help='Random seed for test generation (default: 42)'
    )
    
    parser.add_argument(
        '--timeout',
        type=int,
        default=5,
        help='Execution timeout in seconds (default: 5)'
    )
    
    parser.add_argument(
        '--memory',
        type=int,
        default=256,
        help='Memory limit in MB (default: 256)'
    )
    
    parser.add_argument(
        '--no-exclude-existing',
        action='store_true',
        help='Do not exclude existing T1/T2/T3 pairs'
    )
    
    # Logging
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Enable verbose logging'
    )
    
    parser.add_argument(
        '--quiet',
        action='store_true',
        help='Minimal logging (warnings and errors only)'
    )
    
    return parser.parse_args()


def validate_paths(args) -> bool:
    """
    Validate that required paths exist.
    
    Returns:
        True if validation passes, False otherwise
    """
    # Set default paths if not provided
    base_dir = Path(__file__).parent.parent
    
    if args.raw_dir is None:
        args.raw_dir = base_dir / "data" / "raw"
    
    if args.output_dir is None:
        args.output_dir = base_dir / "data"
    
    # Check raw directory
    if not args.raw_dir.exists():
        logger.error(f"Raw directory not found: {args.raw_dir}")
        return False
    
    java_dir = args.raw_dir / "java"
    if not java_dir.exists():
        logger.error(f"Java source directory not found: {java_dir}")
        logger.error("Expected structure: <raw_dir>/java/<problem_id>/<submission_id>/Main.java")
        return False
    
    # Set default pair paths if not provided
    if args.t1_t2_pairs is None:
        args.t1_t2_pairs = args.output_dir / "metadata" / "t1_t2_pairs.csv"
    
    if args.t3_pairs is None:
        args.t3_pairs = args.output_dir / "metadata" / "t3_pairs.csv"
    
    return True


def configure_logging(args):
    """Configure logging based on command-line arguments."""
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    elif args.quiet:
        logging.getLogger().setLevel(logging.WARNING)


def print_configuration(args):
    """Print current configuration."""
    logger.info("=" * 70)
    logger.info("Type-4 Clone Detection Configuration")
    logger.info("=" * 70)
    logger.info(f"Raw directory:        {args.raw_dir}")
    logger.info(f"Output directory:     {args.output_dir}")
    logger.info(f"T1/T2 pairs:          {args.t1_t2_pairs if args.t1_t2_pairs.exists() else 'Not found (will not exclude)'}")
    logger.info(f"T3 pairs:             {args.t3_pairs if args.t3_pairs.exists() else 'Not found (will not exclude)'}")
    logger.info(f"Number of tests:      {args.num_tests}")
    logger.info(f"Random seed:          {args.seed}")
    logger.info(f"Execution timeout:    {args.timeout}s")
    logger.info(f"Memory limit:         {args.memory}MB")
    logger.info(f"Exclude existing:     {not args.no_exclude_existing}")
    logger.info("=" * 70)


def main():
    """Main entry point."""
    args = parse_args()
    
    # Configure logging
    configure_logging(args)
    
    # Validate paths
    if not validate_paths(args):
        logger.error("Path validation failed. Exiting.")
        sys.exit(1)
    
    # Print configuration
    print_configuration(args)
    
    # Determine which pair files to use
    t1_t2_path = args.t1_t2_pairs if args.t1_t2_pairs.exists() and not args.no_exclude_existing else None
    t3_path = args.t3_pairs if args.t3_pairs.exists() and not args.no_exclude_existing else None
    
    try:
        # Initialize detector
        logger.info("Initializing T4 Clone Detector...")
        detector = T4CloneDetector(
            raw_dir=args.raw_dir,
            output_dir=args.output_dir,
            t1_t2_pairs_path=t1_t2_path,
            t3_pairs_path=t3_path,
            num_test_cases=args.num_tests,
            seed=args.seed
        )
        
        # Detect T4 clones
        logger.info("Starting T4 clone detection...")
        logger.info("This may take a while depending on the number of submissions...")
        
        t4_pairs = detector.detect_t4_clones()
        
        # Save results
        logger.info("Saving results...")
        detector.save_results(t4_pairs)
        
        # Print summary
        logger.info("=" * 70)
        logger.info("T4 Clone Detection Complete")
        logger.info("=" * 70)
        logger.info(f"Total T4 clone pairs found: {len(t4_pairs)}")
        logger.info(f"Results saved to: {args.output_dir / 'metadata' / 't4_pairs.csv'}")
        logger.info(f"Execution logs saved to: {args.output_dir / 'execution_logs'}")
        logger.info("=" * 70)
        
        # Print sample results
        if t4_pairs:
            logger.info("\nSample T4 Clone Pairs:")
            for i, (problem_id, sub1, sub2, confidence) in enumerate(t4_pairs[:5]):
                logger.info(f"  {i+1}. Problem {problem_id}: {sub1} <-> {sub2} (confidence: {confidence})")
            if len(t4_pairs) > 5:
                logger.info(f"  ... and {len(t4_pairs) - 5} more pairs")
        
    except KeyboardInterrupt:
        logger.warning("\nDetection interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Error during T4 clone detection: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
