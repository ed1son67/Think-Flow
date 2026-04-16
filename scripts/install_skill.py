#!/usr/bin/env python3
from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_PROJECT_ROOT = ROOT
DEFAULT_TARGET_ROOT = Path.home() / '.claude' / 'skills'
PROJECT_ROOT_TOKEN = '{{PROJECT_ROOT}}'


def render_text(contents: str, project_root: Path) -> str:
    return contents.replace(PROJECT_ROOT_TOKEN, str(project_root))


def copy_tree_with_render(source: Path, target: Path, project_root: Path) -> None:
    for path in sorted(source.rglob('*')):
        relative_path = path.relative_to(source)
        destination = target / relative_path
        if path.is_dir():
            destination.mkdir(parents=True, exist_ok=True)
            continue

        destination.parent.mkdir(parents=True, exist_ok=True)
        if path.suffix == '.md':
            rendered = render_text(path.read_text(encoding='utf-8'), project_root)
            destination.write_text(rendered, encoding='utf-8')
        else:
            shutil.copy2(path, destination)


def install_skill(source: Path, target_root: Path, project_root: Path) -> list[str]:
    skill_name = source.name
    target = target_root / skill_name

    existed = target.exists()
    if target.exists():
        shutil.rmtree(target)
    target.mkdir(parents=True, exist_ok=True)
    copy_tree_with_render(source, target, project_root)

    action = 'updated' if existed else 'installed'
    return [
        f'{action} {skill_name}',
        f'source: {source}',
        f'target: {target}',
    ]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path)
    parser.add_argument('--project-root', type=Path, default=DEFAULT_PROJECT_ROOT)
    parser.add_argument('--target-root', type=Path, default=DEFAULT_TARGET_ROOT)
    args = parser.parse_args()

    project_root = args.project_root.resolve()
    target_root = args.target_root.resolve()

    if args.source is not None:
        sources = [args.source.resolve()]
    else:
        skills_root = project_root / 'skills'
        sources = sorted(path for path in skills_root.iterdir() if path.is_dir())

    for source in sources:
        if not source.is_dir():
            print(f'error: source directory not found: {source}', file=sys.stderr)
            return 1

    for source in sources:
        for line in install_skill(source, target_root, project_root):
            print(line)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
