import json
import yaml
import shutil
import random
from pathlib import Path

random.seed(42)

def load_config():
    with open('data/configs/ingest.yaml', "r") as f:
        return yaml.safe_load(f)

def iter_problem_dirs(base_dir: Path, max_problems: int):
    return sorted(
        [p for p in base_dir.iterdir() if p.is_dir()]
    )[:max_problems]

def ingest_language(lang, cfg, global_index):
    lang_cfg = cfg["languages"][lang]
    if not lang_cfg["enabled"]:
        return

    print(f"\nIngesting language: {lang.upper()}")

    src_root = Path(cfg["dataset"]["codenet_root"]) / lang_cfg["folder"]
    dst_root = Path(lang_cfg["output_dir"])
    dst_root.mkdir(parents=True, exist_ok=True)

    problems = iter_problem_dirs(
        src_root, cfg["limits"]["max_problems"]
    )

    for problem_dir in problems:
        submissions = sorted(problem_dir.rglob("*")) 
        count = 0

        for file in submissions:
            if file.suffix.lower() not in lang_cfg["extensions"]:
                continue

            if count >= cfg["limits"]["max_submissions_per_problem"]:
                break

            submission_id = file.stem
            target_dir = dst_root / problem_dir.name / submission_id
            target_dir.mkdir(parents=True, exist_ok=True)

            target_file = target_dir / file.name
            shutil.copy(file, target_file)

            global_index.append({
                "language": lang,
                "problem_id": problem_dir.name,
                "submission_id": submission_id,
                "file_path": str(target_file).replace("\\", "/")
            })

            count += 1

    print(f"Completed {lang.upper()} ingestion")

def main():
    cfg = load_config()
    index = []

    for lang in cfg["languages"]:
        ingest_language(lang, cfg, index)

    meta_path = Path(cfg["output"]["metadata_path"])
    meta_path.parent.mkdir(parents=True, exist_ok=True)

    with open(meta_path, "w") as f:
        json.dump(index, f, indent=2)

    print(f"\nTotal programs ingested: {len(index)}")
    print(f"Metadata saved to: {meta_path}")

if __name__ == "__main__":
    main()
