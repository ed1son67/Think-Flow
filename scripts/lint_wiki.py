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


def ensure_system_files(root: Path) -> list[str]:
    created: list[str] = []
    index_path = root / 'wiki' / 'index.md'
    log_path = root / 'wiki' / 'log.md'
    if not index_path.exists():
        index_path.write_text('# Index\n\n## Topics\n\n## Sources\n\n## Syntheses\n')
        created.append('created wiki/index.md')
    if not log_path.exists():
        log_path.write_text('# Log\n')
        created.append('created wiki/log.md')
    return created


def lint(root: Path) -> list[str]:
    issues: list[str] = []
    index_text = (root / 'wiki' / 'index.md').read_text() if (root / 'wiki' / 'index.md').exists() else ''
    for page in content_pages(root):
        relative = page.relative_to(root).as_posix()
        text = page.read_text()
        if not text.startswith('---\n'):
            issues.append(f'missing frontmatter: {relative}')
        if page.stem not in index_text:
            issues.append(f'missing index entry: {relative}')
        if not text.strip():
            issues.append(f'empty page: {relative}')
    return issues


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', required=True)
    parser.add_argument('--mode', choices=['report', 'safe-fix'], default='report')
    args = parser.parse_args()

    root = Path(args.root)
    if args.mode == 'safe-fix':
        for item in ensure_system_files(root):
            print(item)

    issues = lint(root)
    if issues:
        for issue in issues:
            print(issue)
        return 1

    print('lint ok')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
