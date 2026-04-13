#!/usr/bin/env python3
import argparse
from pathlib import Path


def content_pages(root: Path) -> list[Path]:
    pages: list[Path] = []
    for folder in ['sources', 'topics', 'syntheses']:
        directory = root / 'wiki' / folder
        if directory.exists():
            pages.extend(sorted(directory.glob('*.md')))
    return pages


def find_missing_pages(root: Path) -> list[str]:
    index_path = root / 'wiki' / 'index.md'
    index_text = index_path.read_text() if index_path.exists() else ''
    missing: list[str] = []
    for page in content_pages(root):
        relative = page.relative_to(root).as_posix()
        if page.stem not in index_text:
            missing.append(relative)
    return missing


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', required=True)
    args = parser.parse_args()

    missing = find_missing_pages(Path(args.root))
    if missing:
        for item in missing:
            print(item)
        return 1

    print('index coverage ok')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
