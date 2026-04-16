#!/usr/bin/env python3
import argparse
import sys
from pathlib import Path

from wiki_model import render_frontmatter_list


def build_content(
    title: str,
    slug: str,
    date: str,
    concept_refs: list[str],
    question_refs: list[str],
) -> str:
    concept_lines = render_frontmatter_list(concept_refs)
    question_lines = render_frontmatter_list(question_refs)
    return f"""---
id: {slug}
title: {title}
type: source
status: active
created: {date}
updated: {date}
aliases: []
tags: []
source_kind: note
raw_path: ""
trust_level: medium
claim_count: 0
concept_refs:
{concept_lines}
question_refs:
{question_lines}
---

# Source Summary

# Claims

# Evidence Notes

# Key Excerpts / Positions

# Reliability Notes

# Linked Concepts

# Linked Questions
"""


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', required=True)
    parser.add_argument('--date', required=True)
    parser.add_argument('--title', required=True)
    parser.add_argument('--slug', required=True)
    parser.add_argument('--concept-ref', action='append', default=[])
    parser.add_argument('--question-ref', action='append', default=[])
    args = parser.parse_args()

    root = Path(args.root)
    target = root / 'wiki' / 'sources' / f'{args.date}-{args.slug}.md'
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        print(f'{target} already exists', file=sys.stderr)
        return 1
    target.write_text(
        build_content(
            title=args.title,
            slug=args.slug,
            date=args.date,
            concept_refs=args.concept_ref,
            question_refs=args.question_ref,
        )
    )
    print(target)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
