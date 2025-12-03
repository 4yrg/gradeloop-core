import json
import yaml
import javalang
from pathlib import Path


def load_config():
    with open("data/configs/tokenize.yaml", "r") as f:
        return yaml.safe_load(f)


def tokenize_java(code: str):
    """
    Returns a list of tokens from Java source code.
    """
    tokens = []
    try:
        for token in javalang.tokenizer.tokenize(code):
            tokens.append({
                "type": token.__class__.__name__,
                "value": token.value
            })
    except javalang.tokenizer.LexerError as e:
        print(f"Lexer error: {e}")
    return tokens


def process_file(src: Path, dst: Path):
    code = src.read_text(encoding="utf-8", errors="ignore")
    tokens = tokenize_java(code)

    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(json.dumps(tokens, indent=2), encoding="utf-8")


def main():
    cfg = load_config()

    src_root = Path(cfg["input"]["java_root"])
    dst_root = Path(cfg["output"]["java_root"])

    java_files = list(src_root.rglob("*.java"))

    print(f"Tokenizing {len(java_files)} Java files...")

    for src_file in java_files:
        relative_path = src_file.relative_to(src_root)
        dst_file = dst_root / relative_path.parent / "tokens.json"

        process_file(src_file, dst_file)

    print(f"Java token streams saved to {dst_root}")


if __name__ == "__main__":
    main()
