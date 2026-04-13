# LLM Wiki v1 Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap a local markdown-first LLM Wiki v1 with repo structure, maintenance rules, prompt templates, and minimal helper scripts for source creation, index validation, and lint reporting.

**Architecture:** The implementation keeps raw evidence and generated wiki artifacts in separate directories, encodes operational rules in `CLAUDE.md`, and uses a few tiny Python scripts to enforce predictable structure without introducing a database or web app. The scripts only assist with repeatable filesystem checks; the wiki itself remains plain markdown managed by Claude Code.

**Tech Stack:** Markdown, Python 3 standard library (`argparse`, `pathlib`, `re`, `datetime`, `unittest`), shell commands for verification

---

## File Structure

### Files to create
- `CLAUDE.md` — schema and workflow rules for ingest/query/lint behavior
- `raw/inbox/.gitkeep` — keeps the inbox directory in git
- `raw/processed/.gitkeep` — keeps the processed directory in git
- `raw/assets/.gitkeep` — keeps the assets directory in git
- `wiki/sources/.gitkeep` — keeps the sources directory in git
- `wiki/topics/.gitkeep` — keeps the topics directory in git
- `wiki/concepts/.gitkeep` — optional directory placeholder for future use
- `wiki/syntheses/.gitkeep` — keeps the syntheses directory in git
- `wiki/index.md` — content-oriented catalog page
- `wiki/log.md` — chronological append-only operations log
- `prompts/ingest.md` — reusable ingest workflow prompt
- `prompts/query.md` — reusable query workflow prompt
- `prompts/lint.md` — reusable lint workflow prompt
- `scripts/new_source.py` — creates a dated source page from title/slug input
- `scripts/update_index.py` — validates that wiki pages are represented in `wiki/index.md`
- `scripts/lint_wiki.py` — checks required files, frontmatter presence, empty pages, and index coverage
- `tests/test_new_source.py` — unit tests for source page generation
- `tests/test_update_index.py` — unit tests for index coverage detection
- `tests/test_lint_wiki.py` — unit tests for lint checks

### Files to modify
- None; the repository is effectively being initialized from scratch.

## Implementation Notes

- Use Python standard library only. Do not add dependencies.
- Keep script interfaces file-path based and explicit; avoid hidden config.
- `wiki/concepts/` exists to match the design, but no workflow should require it in v1.
- `update_index.py` should be a checker, not a file rewriter. It reports missing index entries so the LLM can update `wiki/index.md` intentionally.
- `lint_wiki.py` should support `--mode report` and `--mode safe-fix`, but `safe-fix` in v1 only creates missing system files (`wiki/index.md`, `wiki/log.md`) if absent. It should not rewrite content-rich pages.

### Task 1: Create the wiki skeleton and system pages

**Files:**
- Create: `CLAUDE.md`
- Create: `raw/inbox/.gitkeep`
- Create: `raw/processed/.gitkeep`
- Create: `raw/assets/.gitkeep`
- Create: `wiki/sources/.gitkeep`
- Create: `wiki/topics/.gitkeep`
- Create: `wiki/concepts/.gitkeep`
- Create: `wiki/syntheses/.gitkeep`
- Create: `wiki/index.md`
- Create: `wiki/log.md`
- Test: verify paths with `ls` and file reads

- [ ] **Step 1: Create the directory skeleton**

Run:
```bash
mkdir -p raw/inbox raw/processed raw/assets wiki/sources wiki/topics wiki/concepts wiki/syntheses
```

Expected: command succeeds with no output.

- [ ] **Step 2: Add gitkeep placeholders**

Create these empty files:
```text
raw/inbox/.gitkeep
raw/processed/.gitkeep
raw/assets/.gitkeep
wiki/sources/.gitkeep
wiki/topics/.gitkeep
wiki/concepts/.gitkeep
wiki/syntheses/.gitkeep
```

Expected: each directory remains present in git before real content exists.

- [ ] **Step 3: Write `wiki/index.md`**

```markdown
# Index

## Topics

## Sources

## Syntheses
```

- [ ] **Step 4: Write `wiki/log.md`**

```markdown
# Log
```

- [ ] **Step 5: Write `CLAUDE.md`**

```markdown
# LLM Wiki Operating Rules

## Purpose
This repository is a local-first markdown wiki maintained with Claude Code. The raw source layer is evidence. The wiki layer is synthesis. Do not treat chat output as durable unless it is written back into the wiki.

## Repository layout
- `raw/inbox/`: new markdown or txt sources waiting to be processed
- `raw/processed/`: sources that have already been ingested
- `raw/assets/`: local assets referenced by raw sources
- `wiki/sources/`: one summary page per source
- `wiki/topics/`: durable topic synthesis pages
- `wiki/concepts/`: optional future expansion area; do not require it in v1
- `wiki/syntheses/`: high-value answers and analyses promoted from query work
- `wiki/index.md`: the content-oriented entry point
- `wiki/log.md`: append-only chronology of ingest/query/lint operations
- `prompts/`: reusable prompt scaffolds for ingest/query/lint
- `scripts/`: small helper tools only; no database or service logic

## Global rules
- Keep raw files immutable. Never rewrite content under `raw/`.
- Prefer updating an existing topic page over creating a new one.
- Keep pages concise and structured.
- Distinguish conclusions from open questions.
- Preserve source traceability through source pages.
- Update `wiki/index.md` and `wiki/log.md` whenever you change durable wiki content.

## Ingest workflow
1. Read exactly one file from `raw/inbox/`.
2. Extract themes, claims, examples, conclusions, and open questions.
3. Write a source page under `wiki/sources/`.
4. Update one or more relevant topic pages.
5. Only create a new topic when the concept is durable and likely to recur.
6. Update `wiki/index.md`.
7. Append an ingest entry to `wiki/log.md` using `## [YYYY-MM-DD] ingest | Title`.
8. Move the raw file into `raw/processed/`.

## Query workflow
1. Read `wiki/index.md` first.
2. Read the most relevant topic pages before source pages.
3. Use source pages for evidence when topic pages are insufficient.
4. In answers, clearly separate current wiki conclusions from inference.
5. If the answer is likely to be reused, save it to `wiki/syntheses/`.
6. If the query reveals missing links or missing structure, update the affected wiki pages.
7. Append a query entry to `wiki/log.md` using `## [YYYY-MM-DD] query | Question` when the query creates durable output.

## Lint workflow
1. Check for missing required directories and system pages.
2. Check that content pages contain frontmatter.
3. Check for empty content pages.
4. Check that content pages appear in `wiki/index.md`.
5. Default to report-only behavior.
6. `safe-fix` may create missing `wiki/index.md` or `wiki/log.md`, but should not rewrite content-rich pages.
7. Append a lint entry to `wiki/log.md` using `## [YYYY-MM-DD] lint | label` when a lint run changes durable content.

## Page templates
### Source page
```markdown
---
title: ...
type: source
status: active
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: []
source_refs: []
topic_refs: []
---

# Summary

# Core Ideas

# Key Details

# Reusable Insights

# Open Questions

# Related Topics
```

### Topic page
```markdown
---
title: ...
type: topic
status: active
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: []
source_refs: []
topic_refs: []
---

# Current View

# Key Points

# Supporting Evidence

# Tensions / Trade-offs

# Open Questions

# Related Pages
```

### Synthesis page
```markdown
---
title: ...
type: synthesis
status: active
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: []
source_refs: []
topic_refs: []
---

# Question

# Short Answer

# Analysis

# Implications for This Wiki

# Follow-ups
```
```

- [ ] **Step 6: Verify the skeleton exists**

Run:
```bash
ls raw raw/inbox raw/processed raw/assets wiki wiki/sources wiki/topics wiki/concepts wiki/syntheses
```

Expected: all listed directories print successfully.

- [ ] **Step 7: Verify the system pages read cleanly**

Run:
```bash
python3 - <<'PY'
from pathlib import Path
for path in [Path('wiki/index.md'), Path('wiki/log.md'), Path('CLAUDE.md')]:
    text = path.read_text()
    print(path, 'OK', len(text) > 0)
PY
```

Expected:
```text
wiki/index.md OK True
wiki/log.md OK True
CLAUDE.md OK True
```

- [ ] **Step 8: Commit**

```bash
git add CLAUDE.md raw wiki
git commit -m "feat: initialize llm wiki structure"
```

Expected: a new commit containing the repo skeleton and workflow rules.

### Task 2: Add reusable prompt scaffolds for ingest, query, and lint

**Files:**
- Create: `prompts/ingest.md`
- Create: `prompts/query.md`
- Create: `prompts/lint.md`
- Test: `prompts/*.md` can be read and refer to the actual repo paths

- [ ] **Step 1: Write `prompts/ingest.md`**

```markdown
# Ingest Prompt

You are processing one file from `raw/inbox/` into the LLM Wiki.

## Required behavior
1. Read the raw source completely.
2. Extract themes, key claims, examples, conclusions, and open questions.
3. Create or update exactly one source page in `wiki/sources/`.
4. Prefer updating existing topic pages in `wiki/topics/` over creating a new topic.
5. Only create a new topic when the concept is durable and likely to recur.
6. Update `wiki/index.md`.
7. Append `## [YYYY-MM-DD] ingest | Title` to `wiki/log.md`.
8. Move the processed raw file from `raw/inbox/` to `raw/processed/`.

## Output checklist
- source page written
- topic pages updated
- index updated
- log updated
- raw file moved
```

- [ ] **Step 2: Write `prompts/query.md`**

```markdown
# Query Prompt

Answer questions from the wiki before consulting raw sources.

## Required behavior
1. Read `wiki/index.md` first.
2. Read the most relevant topic pages in `wiki/topics/`.
3. Read source pages in `wiki/sources/` only if the topics are insufficient.
4. Distinguish current wiki conclusions from inference.
5. If the answer is reusable, save it as a page in `wiki/syntheses/`.
6. If the query reveals missing links or missing structure, update the relevant pages.

## Output checklist
- answer cites the wiki pages used
- durable analysis is promoted into `wiki/syntheses/` when appropriate
```

- [ ] **Step 3: Write `prompts/lint.md`**

```markdown
# Lint Prompt

Check the health of the wiki without turning the run into open-ended refactoring.

## Required behavior
1. Check for missing required directories and files.
2. Check that content pages under `wiki/sources/`, `wiki/topics/`, and `wiki/syntheses/` contain frontmatter.
3. Check for empty content pages.
4. Check that pages are represented in `wiki/index.md`.
5. Report issues clearly.
6. In `safe-fix` mode, only create missing system files such as `wiki/index.md` or `wiki/log.md`.

## Report sections
- missing structure
- missing metadata
- empty pages
- missing index coverage
- safe fixes applied
```

- [ ] **Step 4: Verify the prompt files point at real repo paths**

Run:
```bash
python3 - <<'PY'
from pathlib import Path
checks = {
    'prompts/ingest.md': ['raw/inbox/', 'wiki/index.md', 'wiki/log.md'],
    'prompts/query.md': ['wiki/index.md', 'wiki/topics/', 'wiki/syntheses/'],
    'prompts/lint.md': ['wiki/sources/', 'wiki/topics/', 'wiki/syntheses/'],
}
for path_str, needles in checks.items():
    text = Path(path_str).read_text()
    print(path_str, all(needle in text for needle in needles))
PY
```

Expected:
```text
prompts/ingest.md True
prompts/query.md True
prompts/lint.md True
```

- [ ] **Step 5: Commit**

```bash
git add prompts
git commit -m "feat: add llm wiki workflow prompts"
```

Expected: a new commit containing the prompt scaffolds.

### Task 3: Build and test `scripts/new_source.py`

**Files:**
- Create: `scripts/new_source.py`
- Test: `tests/test_new_source.py`

- [ ] **Step 1: Write the failing test for dated source page generation**

```python
import subprocess
import tempfile
import unittest
from pathlib import Path


class NewSourceScriptTests(unittest.TestCase):
    def test_creates_dated_source_page_with_template(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            repo = Path(tmpdir)
            (repo / 'wiki' / 'sources').mkdir(parents=True)

            result = subprocess.run(
                [
                    'python3',
                    'scripts/new_source.py',
                    '--root',
                    str(repo),
                    '--date',
                    '2026-04-13',
                    '--title',
                    'LLM Wiki',
                    '--slug',
                    'llm-wiki-pattern',
                    '--topic-ref',
                    'knowledge-base-architecture',
                ],
                cwd=Path(__file__).resolve().parents[1],
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            created = repo / 'wiki' / 'sources' / '2026-04-13-llm-wiki-pattern.md'
            self.assertTrue(created.exists())
            text = created.read_text()
            self.assertIn('title: LLM Wiki', text)
            self.assertIn('type: source', text)
            self.assertIn('created: 2026-04-13', text)
            self.assertIn('- knowledge-base-architecture', text)
            self.assertIn('# Summary', text)
            self.assertIn('# Related Topics', text)


if __name__ == '__main__':
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
python3 -m unittest tests.test_new_source -v
```

Expected: FAIL with `ModuleNotFoundError` for `tests.test_new_source` or file-not-found errors until the test file and script exist.

- [ ] **Step 3: Create `tests/test_new_source.py`**

```python
import subprocess
import tempfile
import unittest
from pathlib import Path


class NewSourceScriptTests(unittest.TestCase):
    def test_creates_dated_source_page_with_template(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            repo = Path(tmpdir)
            (repo / 'wiki' / 'sources').mkdir(parents=True)

            result = subprocess.run(
                [
                    'python3',
                    'scripts/new_source.py',
                    '--root',
                    str(repo),
                    '--date',
                    '2026-04-13',
                    '--title',
                    'LLM Wiki',
                    '--slug',
                    'llm-wiki-pattern',
                    '--topic-ref',
                    'knowledge-base-architecture',
                ],
                cwd=Path(__file__).resolve().parents[1],
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            created = repo / 'wiki' / 'sources' / '2026-04-13-llm-wiki-pattern.md'
            self.assertTrue(created.exists())
            text = created.read_text()
            self.assertIn('title: LLM Wiki', text)
            self.assertIn('type: source', text)
            self.assertIn('created: 2026-04-13', text)
            self.assertIn('- knowledge-base-architecture', text)
            self.assertIn('# Summary', text)
            self.assertIn('# Related Topics', text)


if __name__ == '__main__':
    unittest.main()
```

- [ ] **Step 4: Write the minimal implementation in `scripts/new_source.py`**

```python
#!/usr/bin/env python3
import argparse
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
    target.write_text(build_content(args.title, args.date, args.topic_ref))
    print(target)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
```

- [ ] **Step 5: Run the test to verify it passes**

Run:
```bash
python3 -m unittest tests.test_new_source -v
```

Expected:
```text
test_creates_dated_source_page_with_template (tests.test_new_source.NewSourceScriptTests.test_creates_dated_source_page_with_template) ... ok

----------------------------------------------------------------------
Ran 1 test in 0.0xxs

OK
```

- [ ] **Step 6: Add a second failing test for overwrite protection**

```python
    def test_fails_when_target_file_already_exists(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            repo = Path(tmpdir)
            target_dir = repo / 'wiki' / 'sources'
            target_dir.mkdir(parents=True)
            target = target_dir / '2026-04-13-llm-wiki-pattern.md'
            target.write_text('existing')

            result = subprocess.run(
                [
                    'python3',
                    'scripts/new_source.py',
                    '--root',
                    str(repo),
                    '--date',
                    '2026-04-13',
                    '--title',
                    'LLM Wiki',
                    '--slug',
                    'llm-wiki-pattern',
                ],
                cwd=Path(__file__).resolve().parents[1],
                capture_output=True,
                text=True,
            )

            self.assertNotEqual(result.returncode, 0)
            self.assertIn('already exists', result.stderr)
```

- [ ] **Step 7: Run the test suite to verify the new test fails**

Run:
```bash
python3 -m unittest tests.test_new_source -v
```

Expected: FAIL because the script currently overwrites existing files.

- [ ] **Step 8: Update `scripts/new_source.py` to reject overwrites**

```python
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
```

- [ ] **Step 9: Run the test suite again**

Run:
```bash
python3 -m unittest tests.test_new_source -v
```

Expected:
```text
test_creates_dated_source_page_with_template (tests.test_new_source.NewSourceScriptTests.test_creates_dated_source_page_with_template) ... ok
test_fails_when_target_file_already_exists (tests.test_new_source.NewSourceScriptTests.test_fails_when_target_file_already_exists) ... ok

----------------------------------------------------------------------
Ran 2 tests in 0.0xxs

OK
```

- [ ] **Step 10: Commit**

```bash
git add scripts/new_source.py tests/test_new_source.py
git commit -m "feat: add source page bootstrap script"
```

Expected: a new commit containing the source page generator and tests.

### Task 4: Build and test `scripts/update_index.py`

**Files:**
- Create: `scripts/update_index.py`
- Test: `tests/test_update_index.py`

- [ ] **Step 1: Write the failing test for missing index coverage detection**

```python
import subprocess
import tempfile
import unittest
from pathlib import Path


class UpdateIndexScriptTests(unittest.TestCase):
    def test_reports_missing_source_page_from_index(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            repo = Path(tmpdir)
            (repo / 'wiki' / 'sources').mkdir(parents=True)
            (repo / 'wiki' / 'index.md').write_text('# Index\n\n## Topics\n\n## Sources\n\n## Syntheses\n')
            (repo / 'wiki' / 'sources' / '2026-04-13-llm-wiki-pattern.md').write_text('---\ntitle: LLM Wiki\n---\n')

            result = subprocess.run(
                ['python3', 'scripts/update_index.py', '--root', str(repo)],
                cwd=Path(__file__).resolve().parents[1],
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 1)
            self.assertIn('wiki/sources/2026-04-13-llm-wiki-pattern.md', result.stdout)


if __name__ == '__main__':
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
python3 -m unittest tests.test_update_index -v
```

Expected: FAIL until the test file and script exist.

- [ ] **Step 3: Create `tests/test_update_index.py`**

```python
import subprocess
import tempfile
import unittest
from pathlib import Path


class UpdateIndexScriptTests(unittest.TestCase):
    def test_reports_missing_source_page_from_index(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            repo = Path(tmpdir)
            (repo / 'wiki' / 'sources').mkdir(parents=True)
            (repo / 'wiki' / 'index.md').write_text('# Index\n\n## Topics\n\n## Sources\n\n## Syntheses\n')
            (repo / 'wiki' / 'sources' / '2026-04-13-llm-wiki-pattern.md').write_text('---\ntitle: LLM Wiki\n---\n')

            result = subprocess.run(
                ['python3', 'scripts/update_index.py', '--root', str(repo)],
                cwd=Path(__file__).resolve().parents[1],
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 1)
            self.assertIn('wiki/sources/2026-04-13-llm-wiki-pattern.md', result.stdout)


if __name__ == '__main__':
    unittest.main()
```

- [ ] **Step 4: Write the minimal implementation in `scripts/update_index.py`**

```python
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


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', required=True)
    args = parser.parse_args()

    root = Path(args.root)
    index_path = root / 'wiki' / 'index.md'
    index_text = index_path.read_text() if index_path.exists() else ''
    missing = []
    for page in content_pages(root):
        relative = page.relative_to(root).as_posix()
        if page.stem not in index_text:
            missing.append(relative)

    if missing:
        for item in missing:
            print(item)
        return 1

    print('index coverage ok')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
```

- [ ] **Step 5: Run the test to verify it passes**

Run:
```bash
python3 -m unittest tests.test_update_index -v
```

Expected:
```text
test_reports_missing_source_page_from_index (tests.test_update_index.UpdateIndexScriptTests.test_reports_missing_source_page_from_index) ... ok

----------------------------------------------------------------------
Ran 1 test in 0.0xxs

OK
```

- [ ] **Step 6: Add a second failing test for complete coverage**

```python
    def test_returns_success_when_all_pages_are_indexed(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            repo = Path(tmpdir)
            (repo / 'wiki' / 'sources').mkdir(parents=True)
            (repo / 'wiki' / 'topics').mkdir(parents=True)
            (repo / 'wiki' / 'syntheses').mkdir(parents=True)
            (repo / 'wiki' / 'sources' / '2026-04-13-llm-wiki-pattern.md').write_text('---\ntitle: LLM Wiki\n---\n')
            (repo / 'wiki' / 'topics' / 'knowledge-base-architecture.md').write_text('---\ntitle: Knowledge Base Architecture\n---\n')
            (repo / 'wiki' / 'syntheses' / 'why-separate-source-and-topic-pages.md').write_text('---\ntitle: Why Separate Source and Topic Pages\n---\n')
            (repo / 'wiki' / 'index.md').write_text(
                '# Index\n\n'
                '## Topics\n'
                '- [[knowledge-base-architecture]]\n\n'
                '## Sources\n'
                '- [[2026-04-13-llm-wiki-pattern]]\n\n'
                '## Syntheses\n'
                '- [[why-separate-source-and-topic-pages]]\n'
            )

            result = subprocess.run(
                ['python3', 'scripts/update_index.py', '--root', str(repo)],
                cwd=Path(__file__).resolve().parents[1],
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 0)
            self.assertIn('index coverage ok', result.stdout)
```

- [ ] **Step 7: Run the test suite to verify the new test fails**

Run:
```bash
python3 -m unittest tests.test_update_index -v
```

Expected: FAIL because the current script has only been exercised against missing coverage and may not yet handle the complete set predictably.

- [ ] **Step 8: Keep `scripts/update_index.py` as-is if Step 7 already passes; otherwise patch it to this version**

```python
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
```

- [ ] **Step 9: Run the test suite again**

Run:
```bash
python3 -m unittest tests.test_update_index -v
```

Expected:
```text
test_reports_missing_source_page_from_index (tests.test_update_index.UpdateIndexScriptTests.test_reports_missing_source_page_from_index) ... ok
test_returns_success_when_all_pages_are_indexed (tests.test_update_index.UpdateIndexScriptTests.test_returns_success_when_all_pages_are_indexed) ... ok

----------------------------------------------------------------------
Ran 2 tests in 0.0xxs

OK
```

- [ ] **Step 10: Commit**

```bash
git add scripts/update_index.py tests/test_update_index.py
git commit -m "feat: add wiki index coverage checker"
```

Expected: a new commit containing the index checker and tests.

### Task 5: Build and test `scripts/lint_wiki.py`

**Files:**
- Create: `scripts/lint_wiki.py`
- Test: `tests/test_lint_wiki.py`

- [ ] **Step 1: Write the failing test for report mode**

```python
import subprocess
import tempfile
import unittest
from pathlib import Path


class LintWikiScriptTests(unittest.TestCase):
    def test_report_mode_flags_missing_frontmatter_and_index(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            repo = Path(tmpdir)
            (repo / 'wiki' / 'sources').mkdir(parents=True)
            (repo / 'wiki' / 'topics').mkdir(parents=True)
            (repo / 'wiki' / 'syntheses').mkdir(parents=True)
            (repo / 'wiki' / 'index.md').write_text('# Index\n\n## Topics\n\n## Sources\n\n## Syntheses\n')
            (repo / 'wiki' / 'log.md').write_text('# Log\n')
            (repo / 'wiki' / 'topics' / 'knowledge-base-architecture.md').write_text('# Current View\n')

            result = subprocess.run(
                ['python3', 'scripts/lint_wiki.py', '--root', str(repo), '--mode', 'report'],
                cwd=Path(__file__).resolve().parents[1],
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 1)
            self.assertIn('missing frontmatter: wiki/topics/knowledge-base-architecture.md', result.stdout)
            self.assertIn('missing index entry: wiki/topics/knowledge-base-architecture.md', result.stdout)


if __name__ == '__main__':
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
python3 -m unittest tests.test_lint_wiki -v
```

Expected: FAIL until the test file and script exist.

- [ ] **Step 3: Create `tests/test_lint_wiki.py`**

```python
import subprocess
import tempfile
import unittest
from pathlib import Path


class LintWikiScriptTests(unittest.TestCase):
    def test_report_mode_flags_missing_frontmatter_and_index(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            repo = Path(tmpdir)
            (repo / 'wiki' / 'sources').mkdir(parents=True)
            (repo / 'wiki' / 'topics').mkdir(parents=True)
            (repo / 'wiki' / 'syntheses').mkdir(parents=True)
            (repo / 'wiki' / 'index.md').write_text('# Index\n\n## Topics\n\n## Sources\n\n## Syntheses\n')
            (repo / 'wiki' / 'log.md').write_text('# Log\n')
            (repo / 'wiki' / 'topics' / 'knowledge-base-architecture.md').write_text('# Current View\n')

            result = subprocess.run(
                ['python3', 'scripts/lint_wiki.py', '--root', str(repo), '--mode', 'report'],
                cwd=Path(__file__).resolve().parents[1],
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 1)
            self.assertIn('missing frontmatter: wiki/topics/knowledge-base-architecture.md', result.stdout)
            self.assertIn('missing index entry: wiki/topics/knowledge-base-architecture.md', result.stdout)


if __name__ == '__main__':
    unittest.main()
```

- [ ] **Step 4: Write the minimal implementation in `scripts/lint_wiki.py`**

```python
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

    issues = lint(Path(args.root))
    if issues:
        for issue in issues:
            print(issue)
        return 1

    print('lint ok')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
```

- [ ] **Step 5: Run the test to verify it passes**

Run:
```bash
python3 -m unittest tests.test_lint_wiki -v
```

Expected:
```text
test_report_mode_flags_missing_frontmatter_and_index (tests.test_lint_wiki.LintWikiScriptTests.test_report_mode_flags_missing_frontmatter_and_index) ... ok

----------------------------------------------------------------------
Ran 1 test in 0.0xxs

OK
```

- [ ] **Step 6: Add a second failing test for `safe-fix` creating missing system files**

```python
    def test_safe_fix_creates_missing_index_and_log_files(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            repo = Path(tmpdir)
            (repo / 'wiki' / 'sources').mkdir(parents=True)
            (repo / 'wiki' / 'topics').mkdir(parents=True)
            (repo / 'wiki' / 'syntheses').mkdir(parents=True)

            result = subprocess.run(
                ['python3', 'scripts/lint_wiki.py', '--root', str(repo), '--mode', 'safe-fix'],
                cwd=Path(__file__).resolve().parents[1],
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertTrue((repo / 'wiki' / 'index.md').exists())
            self.assertTrue((repo / 'wiki' / 'log.md').exists())
            self.assertIn('created wiki/index.md', result.stdout)
            self.assertIn('created wiki/log.md', result.stdout)
```

- [ ] **Step 7: Run the test suite to verify the new test fails**

Run:
```bash
python3 -m unittest tests.test_lint_wiki -v
```

Expected: FAIL because the script does not yet implement `safe-fix` file creation.

- [ ] **Step 8: Update `scripts/lint_wiki.py` to support safe system-file creation**

```python
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
    created: list[str] = []
    if args.mode == 'safe-fix':
        created = ensure_system_files(root)
        for item in created:
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
```

- [ ] **Step 9: Run the test suite again**

Run:
```bash
python3 -m unittest tests.test_lint_wiki -v
```

Expected:
```text
test_report_mode_flags_missing_frontmatter_and_index (tests.test_lint_wiki.LintWikiScriptTests.test_report_mode_flags_missing_frontmatter_and_index) ... ok
test_safe_fix_creates_missing_index_and_log_files (tests.test_lint_wiki.LintWikiScriptTests.test_safe_fix_creates_missing_index_and_log_files) ... ok

----------------------------------------------------------------------
Ran 2 tests in 0.0xxs

OK
```

- [ ] **Step 10: Run the full test suite**

Run:
```bash
python3 -m unittest discover -s tests -v
```

Expected:
```text
test_creates_dated_source_page_with_template (test_new_source.NewSourceScriptTests.test_creates_dated_source_page_with_template) ... ok
test_fails_when_target_file_already_exists (test_new_source.NewSourceScriptTests.test_fails_when_target_file_already_exists) ... ok
test_report_mode_flags_missing_frontmatter_and_index (test_lint_wiki.LintWikiScriptTests.test_report_mode_flags_missing_frontmatter_and_index) ... ok
test_safe_fix_creates_missing_index_and_log_files (test_lint_wiki.LintWikiScriptTests.test_safe_fix_creates_missing_index_and_log_files) ... ok
test_reports_missing_source_page_from_index (test_update_index.UpdateIndexScriptTests.test_reports_missing_source_page_from_index) ... ok
test_returns_success_when_all_pages_are_indexed (test_update_index.UpdateIndexScriptTests.test_returns_success_when_all_pages_are_indexed) ... ok

----------------------------------------------------------------------
Ran 6 tests in 0.0xxs

OK
```

- [ ] **Step 11: Commit**

```bash
git add scripts/lint_wiki.py tests/test_lint_wiki.py
git commit -m "feat: add wiki lint helper"
```

Expected: a new commit containing the lint helper and tests.

### Task 6: Final repo verification and smoke test

**Files:**
- Modify: `wiki/index.md` if needed to include created content pages later
- Test: manual smoke commands only

- [ ] **Step 1: Verify all required top-level files and directories exist**

Run:
```bash
python3 - <<'PY'
from pathlib import Path
required = [
    'CLAUDE.md',
    'raw/inbox',
    'raw/processed',
    'raw/assets',
    'wiki/sources',
    'wiki/topics',
    'wiki/concepts',
    'wiki/syntheses',
    'wiki/index.md',
    'wiki/log.md',
    'prompts/ingest.md',
    'prompts/query.md',
    'prompts/lint.md',
    'scripts/new_source.py',
    'scripts/update_index.py',
    'scripts/lint_wiki.py',
]
for path in required:
    print(path, Path(path).exists())
PY
```

Expected: every printed line ends with `True`.

- [ ] **Step 2: Smoke-test `scripts/new_source.py` in the real repo**

Run:
```bash
python3 scripts/new_source.py --root . --date 2026-04-13 --title "Bootstrap Sample" --slug bootstrap-sample --topic-ref knowledge-base-architecture
```

Expected: prints `wiki/sources/2026-04-13-bootstrap-sample.md`.

- [ ] **Step 3: Add the smoke-test page to `wiki/index.md` manually**

Append this line under `## Sources` in `wiki/index.md`:
```markdown
- [[2026-04-13-bootstrap-sample]] — bootstrap sample source page created during repo smoke testing
```

- [ ] **Step 4: Run index and lint smoke checks**

Run:
```bash
python3 scripts/update_index.py --root . && python3 scripts/lint_wiki.py --root . --mode report
```

Expected:
```text
index coverage ok
lint ok
```

- [ ] **Step 5: Append a bootstrap entry to `wiki/log.md`**

Append:
```markdown
## [2026-04-13] ingest | Bootstrap Sample
- Added source page: [[2026-04-13-bootstrap-sample]]
- Updated index during repository bootstrap validation
- Notes: created only to verify the end-to-end source-page workflow
```

- [ ] **Step 6: Run the full test suite one last time**

Run:
```bash
python3 -m unittest discover -s tests -v
```

Expected: all six tests pass as in Task 5.

- [ ] **Step 7: Commit**

```bash
git add wiki/index.md wiki/log.md wiki/sources/2026-04-13-bootstrap-sample.md
git commit -m "test: smoke test llm wiki bootstrap workflow"
```

Expected: a final commit proving the bootstrap loop works end to end.

## Self-Review

### Spec coverage
- Repo structure from the spec is covered in Task 1.
- `CLAUDE.md` schema/workflow requirements are covered in Task 1.
- Prompt scaffolds from the design are covered in Task 2.
- Minimal helper tooling is covered in Tasks 3–5.
- Validation and end-to-end bootstrap behavior are covered in Task 6.

### Placeholder scan
- No `TODO`, `TBD`, or “implement later” placeholders remain.
- Every task references exact file paths.
- Every code-writing step includes concrete file content.
- Every verification step includes exact commands and expected outcomes.

### Type consistency
- Script names are consistent across all tasks: `new_source.py`, `update_index.py`, `lint_wiki.py`.
- Directory names are consistent with the spec: `raw/inbox`, `raw/processed`, `wiki/sources`, `wiki/topics`, `wiki/syntheses`.
- The frontmatter fields are consistent across `CLAUDE.md`, the source-page generator, and the plan narrative.
