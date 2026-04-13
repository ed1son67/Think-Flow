#!/usr/bin/env python3
import argparse
import sys
from pathlib import Path


def build_content(title: str, date: str, topic_refs: list[str]) -> str:
    topic_lines = '\n'.join(f'  - {topic}' for topic in topic_refs)
    if not topic_lines:
        topic_lines = '  []'
    return f"""---
title: {title}
type: source
status: active
created: {date}
updated: {date}
tags: []
source_refs: []
topic_refs:
{topic_lines}
---

# Summary

# Core Ideas

# Key Details

# Reusable Insights

# Open Questions

# Related Topics
"""


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', required=True)
    parser.add_argument('--date', required=True)
    parser.add_argument('--title', required=True)
    parser.add_argument('--slug', required=True)
    parser.add_argument('--topic-ref', action='append', default=[])
    args = parser.parse_args()

    root = Path(args.root)
    target = root / 'wiki' / 'sources' / f'{args.date}-{args.slug}.md'
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        print(f'{target} already exists', file=sys.stderr)
        return 1
    target.write_text(build_content(args.title, args.date, args.topic_ref))
    print(target)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
