#!/usr/bin/env python3
from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SOURCE = ROOT / 'skills' / 'llm-wiki-ops' / 'SKILL.md'
DEFAULT_TARGET_ROOT = Path.home() / '.claude' / 'skills'
SKILL_NAME = 'llm-wiki-ops'


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path, default=DEFAULT_SOURCE)
    parser.add_argument('--target-root', type=Path, default=DEFAULT_TARGET_ROOT)
    args = parser.parse_args()

    if not args.source.exists():
        print(f'error: source file not found: {args.source}', file=sys.stderr)
        return 1

    target = args.target_root / SKILL_NAME / 'SKILL.md'
    existed = target.exists()
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(args.source, target)

    action = 'updated' if existed else 'installed'
    print(f'{action} llm-wiki-ops')
    print(f'source: {args.source}')
    print(f'target: {target}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
