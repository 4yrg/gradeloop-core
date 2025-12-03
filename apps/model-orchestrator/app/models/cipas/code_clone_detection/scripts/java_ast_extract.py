import json
import asyncio
from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

import tree_sitter
from tree_sitter import Language, Parser, Node
import tree_sitter_java

import typer
from pydantic import BaseModel, Field, ConfigDict
from pydantic_settings import BaseSettings
import aiofiles
import torch
from transformers import AutoTokenizer, AutoModel
import javalang

app = typer.Typer()


class ParserConfig(BaseModel):
    """Configuration for tree-sitter parser."""
    language: str = "java"
    include_text: bool = False
    include_positions: bool = True
    max_depth: Optional[int] = None


class InputConfig(BaseModel):
    """Input configuration."""
    java_root: str = "data/normalized/java"
    batch_size: int = 100


class OutputConfig(BaseModel):
    """Output configuration."""
    java_root: str = "data/ast/java"
    features_root: str = "data/features/java"
    embeddings_root: str = "data/embeddings/java"


class ASTConfig(BaseSettings):
    """Main configuration class using pydantic-settings."""
    input: InputConfig = InputConfig()
    output: OutputConfig = OutputConfig()
    parser: ParserConfig = ParserConfig()
    reproducibility: Dict[str, Any] = Field(default_factory=lambda: {"seed": 42})

    model_config = ConfigDict(
        env_prefix="AST_",
        env_file=".env"
    )


def setup_parser() -> Parser:
    """Initialize tree-sitter parser for Java."""
    JAVA_LANGUAGE = Language(tree_sitter_java.language())
    parser = Parser()
    parser.language = JAVA_LANGUAGE
    return parser


def serialize_ast(node: Node, include_text: bool = False, include_positions: bool = True, max_depth: Optional[int] = None, current_depth: int = 0) -> Dict[str, Any]:
    """
    Convert tree-sitter AST node into a JSON-serializable dict with enhanced features.
    """
    if max_depth is not None and current_depth >= max_depth:
        return {"type": node.type, "truncated": True}
    
    result = {
        "type": node.type,
        "children": [
            serialize_ast(child, include_text, include_positions, max_depth, current_depth + 1) 
            for child in node.children
        ]
    }
    
    if include_text and node.text:
        try:
            result["text"] = node.text.decode("utf-8")
        except UnicodeDecodeError:
            result["text"] = node.text.decode("utf-8", errors="ignore")
    
    if include_positions:
        result["start_point"] = node.start_point
        result["end_point"] = node.end_point
        result["start_byte"] = node.start_byte
        result["end_byte"] = node.end_byte
    
    return result


def extract_ast_features(ast_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Extract statistical features from AST."""
    def count_nodes(node_dict, node_counts=None):
        if node_counts is None:
            node_counts = {}
        
        node_type = node_dict.get("type", "unknown")
        node_counts[node_type] = node_counts.get(node_type, 0) + 1
        
        for child in node_dict.get("children", []):
            count_nodes(child, node_counts)
        
        return node_counts
    
    def calculate_depth(node_dict, current_depth=0):
        if not node_dict.get("children"):
            return current_depth
        return max(calculate_depth(child, current_depth + 1) for child in node_dict["children"])
    
    node_counts = count_nodes(ast_dict)
    max_depth = calculate_depth(ast_dict)
    total_nodes = sum(node_counts.values())
    
    return {
        "node_counts": node_counts,
        "total_nodes": total_nodes,
        "max_depth": max_depth,
        "unique_node_types": len(node_counts),
        "avg_children_per_node": total_nodes / max(1, len(node_counts))
    }


def extract_java_metrics(code: str) -> Dict[str, Any]:
    """Extract Java-specific metrics using javalang."""
    try:
        tree = javalang.parse.parse(code)
        
        metrics = {
            "classes": 0,
            "methods": 0,
            "fields": 0,
            "imports": 0,
            "interfaces": 0,
            "enums": 0
        }
        
        for path, node in tree:
            if isinstance(node, javalang.tree.ClassDeclaration):
                metrics["classes"] += 1
            elif isinstance(node, javalang.tree.MethodDeclaration):
                metrics["methods"] += 1
            elif isinstance(node, javalang.tree.FieldDeclaration):
                metrics["fields"] += 1
            elif isinstance(node, javalang.tree.Import):
                metrics["imports"] += 1
            elif isinstance(node, javalang.tree.InterfaceDeclaration):
                metrics["interfaces"] += 1
            elif isinstance(node, javalang.tree.EnumDeclaration):
                metrics["enums"] += 1
        
        return metrics
    except Exception as e:
        typer.echo(f"Failed to parse Java code with javalang: {e}", err=True)
        return {"error": str(e)}


async def process_file_async(src: Path, dst: Path, features_dst: Path, parser: Parser, config: ASTConfig) -> bool:
    """Process a single file asynchronously."""
    try:
        async with aiofiles.open(src, mode='r', encoding='utf-8', errors='ignore') as f:
            code = await f.read()
        
        # Parse with tree-sitter
        tree = parser.parse(bytes(code, "utf8"))
        root = tree.root_node
        
        # Serialize AST
        ast_json = serialize_ast(
            root,
            include_text=config.parser.include_text,
            include_positions=config.parser.include_positions,
            max_depth=config.parser.max_depth
        )
        
        # Extract features
        ast_features = extract_ast_features(ast_json)
        java_metrics = extract_java_metrics(code)
        
        combined_data = {
            "ast": ast_json,
            "features": ast_features,
            "java_metrics": java_metrics,
            "file_info": {
                "path": str(src),
                "size": len(code),
                "lines": code.count('\n') + 1
            }
        }
        
        # Ensure directories exist
        dst.parent.mkdir(parents=True, exist_ok=True)
        features_dst.parent.mkdir(parents=True, exist_ok=True)
        
        # Write AST
        async with aiofiles.open(dst, mode='w', encoding='utf-8') as f:
            await f.write(json.dumps(ast_json, indent=2))
        
        # Write features
        async with aiofiles.open(features_dst, mode='w', encoding='utf-8') as f:
            await f.write(json.dumps(combined_data, indent=2, default=str))
        
        return True
        
    except Exception as e:
        typer.echo(f"Error processing {src}: {e}", err=True)
        return False


async def process_batch(files_batch: List[Path], config: ASTConfig, parser: Parser) -> int:
    """Process a batch of files concurrently."""
    src_root = Path(config.input.java_root)
    dst_root = Path(config.output.java_root)
    features_root = Path(config.output.features_root)
    
    tasks = []
    for src_file in files_batch:
        rel_path = src_file.relative_to(src_root)
        dst_file = dst_root / rel_path.parent / "ast.json"
        features_file = features_root / rel_path.parent / "features.json"
        
        task = process_file_async(src_file, dst_file, features_file, parser, config)
        tasks.append(task)
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    successful = sum(1 for result in results if result is True)
    
    return successful


def create_embeddings_summary(config: ASTConfig) -> None:
    """Create a summary of all processed files for embedding generation."""
    features_root = Path(config.output.features_root)
    embeddings_root = Path(config.output.embeddings_root)
    embeddings_root.mkdir(parents=True, exist_ok=True)
    
    all_features = []
    file_paths = []
    
    for features_file in features_root.rglob("features.json"):
        try:
            with open(features_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            features = data.get('features', {})
            file_paths.append(str(features_file.relative_to(features_root)))
            all_features.append(features)
            
        except Exception as e:
            typer.echo(f"Error reading {features_file}: {e}", err=True)
    
    if all_features:
        # Create DataFrame for analysis
        df = pd.DataFrame(all_features)
        df['file_path'] = file_paths
        
        # Save summary statistics
        summary_file = embeddings_root / "summary.json"
        summary = {
            "total_files": len(all_features),
            "feature_statistics": df.describe().to_dict(),
            "node_type_distribution": df.get('unique_node_types', pd.Series()).describe().to_dict()
        }
        
        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, default=str)
        
        # Save processed data as CSV for further analysis
        csv_file = embeddings_root / "features_summary.csv"
        df.to_csv(csv_file, index=False)
        
        typer.echo(f"Summary saved to {summary_file}")
        typer.echo(f"Features CSV saved to {csv_file}")


@app.command()
async def extract_asts(
    config_file: Optional[str] = typer.Option(None, "--config", "-c", help="Path to configuration file"),
    batch_size: int = typer.Option(100, "--batch-size", "-b", help="Batch size for concurrent processing"),
    max_depth: Optional[int] = typer.Option(None, "--max-depth", "-d", help="Maximum AST depth to serialize"),
    include_text: bool = typer.Option(False, "--include-text", help="Include node text in AST"),
    include_positions: bool = typer.Option(True, "--include-positions", help="Include node positions in AST"),
    generate_summary: bool = typer.Option(True, "--generate-summary", help="Generate embeddings summary")
):
    """Extract ASTs from Java files with enhanced features."""
    
    # Load configuration
    if config_file:
        # Load from custom config file if provided
        config = ASTConfig()
        # Could implement custom config loading here
    else:
        config = ASTConfig()
    
    # Override config with CLI arguments
    if batch_size != 100:
        config.input.batch_size = batch_size
    if max_depth is not None:
        config.parser.max_depth = max_depth
    if include_text:
        config.parser.include_text = include_text
    if not include_positions:
        config.parser.include_positions = include_positions
    
    # Set random seeds for reproducibility
    np.random.seed(config.reproducibility["seed"])
    torch.manual_seed(config.reproducibility["seed"])
    
    # Setup parser
    parser = setup_parser()
    
    # Find Java files
    src_root = Path(config.input.java_root)
    if not src_root.exists():
        typer.echo(f"Error: Source directory {src_root} does not exist", err=True)
        raise typer.Exit(1)
    
    java_files = list(src_root.rglob("*.java"))
    if not java_files:
        typer.echo(f"No Java files found in {src_root}")
        raise typer.Exit(1)
    
    typer.echo(f"Found {len(java_files)} Java files to process...")
    
    # Process files in batches
    total_processed = 0
    batch_count = 0
    
    for i in range(0, len(java_files), config.input.batch_size):
        batch = java_files[i:i + config.input.batch_size]
        batch_count += 1
        
        typer.echo(f"Processing batch {batch_count}/{(len(java_files) + config.input.batch_size - 1) // config.input.batch_size}")
        
        successful = await process_batch(batch, config, parser)
        total_processed += successful
        
        typer.echo(f"Batch {batch_count}: {successful}/{len(batch)} files processed successfully")
    
    typer.echo(f"\nTotal: {total_processed}/{len(java_files)} files processed successfully")
    typer.echo(f"ASTs written to: {Path(config.output.java_root)}")
    typer.echo(f"Features written to: {Path(config.output.features_root)}")
    
    # Generate summary if requested
    if generate_summary:
        typer.echo("Generating embeddings summary...")
        create_embeddings_summary(config)


if __name__ == "__main__":
    # For backwards compatibility, provide a sync main function
    import sys
    if len(sys.argv) == 1:
        # If no CLI args, run with default config
        config = ASTConfig()
        asyncio.run(extract_asts(
            config_file=None,
            batch_size=100,
            max_depth=None,
            include_text=False,
            include_positions=True,
            generate_summary=True
        ))
    else:
        app()
