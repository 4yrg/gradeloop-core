import re
import yaml
from pathlib import Path
from typing import List

# -------- Regex Patterns (carefully ordered) --------
LINE_COMMENT = re.compile(r"//.*?$", re.MULTILINE)
BLOCK_COMMENT = re.compile(r"/\*.*?\*/", re.DOTALL)
MULTI_WHITESPACE = re.compile(r"\s+")


def load_config():
    with open("data/configs/normalize.yaml", "r") as f:
        return yaml.safe_load(f)


def remove_comments(code: str) -> str:
    """Remove // and /* */ comments"""
    code = BLOCK_COMMENT.sub("", code)
    code = LINE_COMMENT.sub("", code)
    return code


def normalize_whitespace(code: str) -> str:
    """Collapse all whitespace to single spaces"""
    return MULTI_WHITESPACE.sub(" ", code).strip()


def normalize_java_code(code: str, rules: dict) -> str:
    if rules["remove_comments"]:
        code = remove_comments(code)

    if rules["strip_blank_lines"]:
        code = "\n".join(
            line for line in code.splitlines() if line.strip()
        )

    if rules["normalize_whitespace"]:
        code = normalize_whitespace(code)

    return code


def process_file(src: Path, dst: Path, rules: dict):
    code = src.read_text(encoding="utf-8", errors="ignore")
    normalized = normalize_java_code(code, rules)

    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(normalized, encoding="utf-8")


def main():
    cfg = load_config()
    src_root = Path(cfg["input"]["java_root"])
    dst_root = Path(cfg["output"]["java_root"])
    rules = cfg["rules"]

    java_files: List[Path] = list(src_root.rglob("*.java"))

    print(f"Normalizing {len(java_files)} Java files...")

    for src_file in java_files:
        relative_path = src_file.relative_to(src_root)
        dst_file = dst_root / relative_path

        process_file(src_file, dst_file, rules)

    print(f"Normalized Java files written to: {dst_root}")


if __name__ == "__main__":
    main()
