# LLM Wiki Ops Install Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the repo-local `llm-wiki-ops` skill the source of truth and add one command that installs or updates it into Claude Code's global skill directory.

**Architecture:** Move the canonical skill text into `skills/llm-wiki-ops/SKILL.md`, update the existing skill contract test to read that repo-local file, and add a small installer script that copies the repo-local skill into `~/.claude/skills/llm-wiki-ops/SKILL.md`. Add a dedicated installer test that uses a temporary target root so the test suite stays deterministic and does not mutate the real global skill directory.

**Tech Stack:** Markdown skill document, Python 3 standard library (`argparse`, `pathlib`, `shutil`, `tempfile`, `subprocess`, `unittest`)

---

## File Structure

### Files to create
- `/Users/zifeng.chen/bb/think-flow/skills/llm-wiki-ops/SKILL.md` — canonical repo-local copy of the skill
- `/Users/zifeng.chen/bb/think-flow/scripts/install_skill.py` — single-command install/update script for the global Claude skill directory
- `/Users/zifeng.chen/bb/think-flow/tests/test_install_skill.py` — installer behavior tests against a temporary target root

### Files to modify
- `/Users/zifeng.chen/bb/think-flow/tests/test_llm_wiki_ops_skill.py` — point contract tests at the repo-local skill path instead of the global one

### Files to verify
- `/Users/zifeng.chen/.claude/skills/llm-wiki-ops/SKILL.md` — current installed skill copy to be replaced by the repo-managed workflow
- `/Users/zifeng.chen/bb/think-flow/docs/superpowers/specs/2026-04-13-llm-wiki-ops-install-sync-design.md` — approved design source

## Implementation Notes

- The repo copy becomes the only source of truth.
- The installer is one-way only: repo → global skill directory.
- v1 manages only `llm-wiki-ops`.
- The installer should support `--target-root` for tests.
- The default install target should remain `~/.claude/skills`.
- Do not add symlink logic, reverse sync, batch install, or git commits in this implementation.

### Task 1: Move the skill source of truth into the repo

**Files:**
- Create: `/Users/zifeng.chen/bb/think-flow/skills/llm-wiki-ops/SKILL.md`
- Modify: `/Users/zifeng.chen/bb/think-flow/tests/test_llm_wiki_ops_skill.py`
- Test: `/Users/zifeng.chen/bb/think-flow/tests/test_llm_wiki_ops_skill.py`

- [ ] **Step 1: Create the failing repo-local contract test by changing the skill path**

```python
import unittest
from pathlib import Path


SKILL_PATH = Path('/Users/zifeng.chen/bb/think-flow/skills/llm-wiki-ops/SKILL.md')


class LlmWikiOpsSkillTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.skill_text = SKILL_PATH.read_text(encoding='utf-8')

    def test_skill_has_required_frontmatter_and_sections(self):
        text = self.skill_text

        self.assertIn('name: llm-wiki-ops', text)
        self.assertIn('description: Use when working inside an LLM Wiki repository', text)
        for heading in [
            '# LLM Wiki Ops',
            '## Overview',
            '## When to Use',
            '## Mode Detection',
            '## Required Reads by Mode',
            '## Execution Contract',
            '## Output Contract',
            '## Common Mistakes',
        ]:
            self.assertIn(heading, text)

    def test_skill_requires_repo_rule_files(self):
        text = self.skill_text

        for reference in ['CLAUDE.md', 'prompts/ingest.md', 'prompts/query.md', 'prompts/lint.md', 'wiki/index.md']:
            self.assertIn(reference, text)
        self.assertIn('If those files are missing, stop for clarification instead of continuing.', text)

    def test_skill_has_file_and_inline_ingest_examples(self):
        text = self.skill_text

        for snippet in [
            '## Invocation Examples',
            'Use `llm-wiki-ops` to ingest `raw/inbox/foo.md`.',
            'Use `llm-wiki-ops` to ingest this text:',
            'Use `llm-wiki-ops` to answer:',
            'Use `llm-wiki-ops` to lint the wiki.',
        ]:
            self.assertIn(snippet, text)

    def test_skill_requires_clarification_for_ambiguous_requests(self):
        text = self.skill_text

        self.assertIn('If the request could fit more than one mode, stop and ask a clarifying question instead of guessing.', text)
        self.assertIn('If the request contains both a file path and a separate pasted body of text, stop and ask a clarifying question instead of guessing.', text)

    def test_skill_forbids_content_rewrites_in_safe_fix(self):
        text = self.skill_text

        self.assertIn('Do not rewrite content-rich pages in v1 safe-fix mode.', text)

    def test_skill_supports_single_line_and_multi_line_inline_ingest(self):
        text = self.skill_text

        self.assertIn('single-line inline text', text)
        self.assertIn('multi-line inline text', text)
        self.assertIn('Use `llm-wiki-ops` to ingest this text: We should keep source pages separate from topic pages because sources are evidence and topics are synthesis.', text)
        self.assertIn('# Project Constraints', text)

    def test_skill_requires_inline_text_materialization_into_raw_inbox(self):
        text = self.skill_text

        self.assertIn('materialize the inline text into one new raw file under `raw/inbox/`', text)
        self.assertIn('The text must not bypass the raw evidence layer.', text)
        self.assertIn('If the input is inline text, materialize the inline text into one new raw file under `raw/inbox/`.', text)

    def test_skill_describes_filename_generation_and_collision_handling(self):
        text = self.skill_text

        self.assertIn('If the content starts with a markdown heading like `# Title`, derive a slug from that heading.', text)
        self.assertIn('Otherwise use a generic fallback slug such as `inline-note`, `note`, or `capture`.', text)
        self.assertIn('If the generated filename already exists, append a numeric suffix instead of overwriting.', text)
        self.assertIn('raw/inbox/2026-04-13-inline-note-2.md', text)

    def test_skill_describes_markdown_like_and_plain_text_handling(self):
        text = self.skill_text

        self.assertIn('if the text appears to already be markdown, preserve it as closely as possible', text)
        self.assertIn('if the text appears to be plain text, wrap it minimally into markdown', text)
        self.assertIn('# Untitled Note', text)
        self.assertIn('fenced code blocks', text)

    def test_skill_describes_inline_ingest_failure_boundaries(self):
        text = self.skill_text

        self.assertIn('If the user asks to ingest inline text but does not actually provide enough content to write a source file, the skill must ask for the content instead of creating an empty raw file.', text)
        self.assertIn('If the inline text cannot be written into `raw/inbox/`, the skill must stop and must not proceed to wiki updates.', text)
        self.assertIn('If raw-file creation succeeds but a later ingest step fails, the generated raw file should remain in place for retry and traceability.', text)
```

- [ ] **Step 2: Run the contract test and verify it fails because the repo-local skill file does not exist yet**

Run:
```bash
python3 -m unittest discover -s "/Users/zifeng.chen/bb/think-flow/tests" -p "test_llm_wiki_ops_skill.py" -v
```

Expected:
```text
FileNotFoundError: [Errno 2] No such file or directory: '/Users/zifeng.chen/bb/think-flow/skills/llm-wiki-ops/SKILL.md'
```

- [ ] **Step 3: Create the repo-local skill file by copying the current approved skill text into the repo**

```markdown
---
name: llm-wiki-ops
description: Use when working inside an LLM Wiki repository to ingest a source, answer questions from the wiki, or run a wiki health check.
---

# LLM Wiki Ops

## Overview
Use this skill as the single entry point for all LLM Wiki work: ingest, query, and lint. `ingest` supports both file ingest and inline ingest; the repo-local rules are the source of truth, and this skill only operationalizes them.

## When to Use
Use when the task is clearly one of these modes:
- ingest a source from `raw/inbox/`
- ingest single-line inline text or multi-line inline text
- answer a question from the wiki
- run a wiki health check / lint pass

Do not use this skill for unrelated repository work.

## Mode Detection
Detect the mode conservatively.
- file input
- inline input
- If the request contains both a file path and a separate pasted body of text, stop and ask a clarifying question instead of guessing.
- If the request is clearly asking for an answer grounded in existing wiki content, use `query`.
- If the request is clearly about checking repository health, missing pages, or structural hygiene, use `lint`.
- If the request could fit more than one mode, stop and ask a clarifying question instead of guessing.

## Repository Contract
Always read `CLAUDE.md` first. Then follow the mode-specific minimum reads.
- `CLAUDE.md`
- `prompts/ingest.md`
- `prompts/query.md`
- `prompts/lint.md`

The repo-local rules define the workspace-specific ingest, query, and lint behavior; this skill does not replace them.
If those files are missing, stop for clarification instead of continuing.

## Required Reads by Mode

### ingest
- `CLAUDE.md`
- `prompts/ingest.md`
- for file ingest: read the single source file from `raw/inbox/`
- for inline ingest: first materialize the inline text into one new raw file under `raw/inbox/`, then read that generated raw file as the single source

### query
- `CLAUDE.md`
- `wiki/index.md`
- the most relevant topic pages
- relevant source pages only if topic pages are insufficient
- relevant query prompt scaffolds in `prompts/`, including `prompts/query.md`

### lint
- `CLAUDE.md`
- relevant prompt scaffolds in `prompts/`, including `prompts/lint.md`
- `wiki/index.md`
- the pages needed to inspect the reported issue

## Inline Ingest Materialization Rules
- Raw file location: create exactly one new file under `raw/inbox/`.
- Filename generation: use the current date prefix and a derived slug, such as `raw/inbox/2026-04-13-inline-note.md`.
- If the content starts with a markdown heading like `# Title`, derive a slug from that heading.
- Otherwise use a generic fallback slug such as `inline-note`, `note`, or `capture`.
- If the generated filename already exists, append a numeric suffix instead of overwriting.
- For example, a second capture on 2026-04-13 could become `raw/inbox/2026-04-13-inline-note-2.md`.
- Content preservation: preserve the content as faithfully as possible.
- if the text appears to already be markdown, preserve it as closely as possible.
- if the text appears to be plain text, wrap it minimally into markdown.
- Markdown-like detection: if the text already looks like markdown, keep it close to the original, including markers like `# `, `## `, `- `, `1. `, fenced code blocks, or markdown links/emphasis.
- Minimal plain-text wrapper: if the text is plain text, wrap it minimally into markdown.
- For a short captured note with no obvious title, use a minimal wrapper such as `# Untitled Note`.
- Do not add complex metadata or summary content at the raw layer.
- The text must not bypass the raw evidence layer.

## Execution Contract
- Operate one mode at a time: ingest, query, or lint.
- Follow the repo-local workflow for the selected mode.
- Prefer existing wiki pages over creating new ones.
- Preserve raw evidence; do not rewrite files under `raw/`.
- Keep changes minimal and aligned with the requested mode.
- For ingest, follow this sequence:
  1. Read `CLAUDE.md`.
  2. Read `prompts/ingest.md`.
  3. If the input is inline text, materialize the inline text into one new raw file under `raw/inbox/`.
  4. Process exactly one source.
  5. Create or update one source page under `wiki/sources/`.
  6. Update one or more relevant topic pages under `wiki/topics/`.
  7. Update `wiki/index.md`.
  8. Append an ingest entry to `wiki/log.md`.
  9. Move the raw source from `raw/inbox/` to `raw/processed/`.
  10. Verify the resulting files exist and are linked.
- If mode detection is unclear, pause and ask for clarification.

## Invocation Examples
- Use `llm-wiki-ops` to ingest `raw/inbox/foo.md`.
- Use `llm-wiki-ops` to ingest this text: We should keep source pages separate from topic pages because sources are evidence and topics are synthesis.
- Use `llm-wiki-ops` to ingest this text:
  ```
  # Project Constraints
  - source pages stay separate from topic pages
  - raw files remain immutable
  - wiki updates should preserve traceability
  ```
- Use `llm-wiki-ops` to answer: "What does the wiki conclude about source ingestion?"
- Use `llm-wiki-ops` to lint the wiki.

## Output Contract
- **ingest**: summarize the source, list the pages written or updated, note any open questions or follow-ups.
- **inline ingest**: also report the generated raw file path under `raw/inbox/` and whether the content was preserved as markdown-like text or minimally wrapped as plain text.
- **query**: separate wiki-backed conclusions from inference, and cite which wiki pages were used.
- **lint**: report findings, severity, and whether any durable wiki content changed.

## Failure Boundaries
If the user asks to ingest inline text but does not actually provide enough content to write a source file, the skill must ask for the content instead of creating an empty raw file.
If the inline text cannot be written into `raw/inbox/`, the skill must stop and must not proceed to wiki updates.
If raw-file creation succeeds but a later ingest step fails, the generated raw file should remain in place for retry and traceability.

## Common Mistakes
- Treating this skill as a general repo skill instead of a single entry point for ingest/query/lint
- Skipping `CLAUDE.md` or the relevant prompt scaffold
- Forgetting `wiki/index.md` during query or lint work
- Acting on ambiguous instructions instead of asking a clarifying question
- Rewriting raw files or over-editing content-rich wiki pages
- Do not rewrite content-rich pages in v1 safe-fix mode.
- Failing to distinguish wiki conclusions from inference
- Forgetting that inline ingest must first create a raw file under `raw/inbox/`
- Letting inline text bypass the raw evidence layer
- Overwriting an existing generated raw file instead of adding a numeric suffix
- Creating an empty raw file when the user did not provide enough inline content
- Overwriting an existing raw file instead of appending a numeric suffix to a generated filename
```

- [ ] **Step 4: Run the contract test again and verify the repo-local copy passes**

Run:
```bash
python3 -m unittest discover -s "/Users/zifeng.chen/bb/think-flow/tests" -p "test_llm_wiki_ops_skill.py" -v
```

Expected:
```text
Ran 10 tests in 0.0xxs

OK
```

### Task 2: Add a single-command installer for the global skill copy

**Files:**
- Create: `/Users/zifeng.chen/bb/think-flow/scripts/install_skill.py`
- Test: `/Users/zifeng.chen/bb/think-flow/tests/test_install_skill.py`

- [ ] **Step 1: Write the failing installer test file**

```python
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path('/Users/zifeng.chen/bb/think-flow')
SCRIPT = ROOT / 'scripts' / 'install_skill.py'
SOURCE = ROOT / 'skills' / 'llm-wiki-ops' / 'SKILL.md'


class InstallSkillScriptTests(unittest.TestCase):
    def test_installs_skill_into_empty_target_root(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            target_root = Path(temp_dir) / '.claude' / 'skills'

            result = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPT),
                    '--target-root',
                    str(target_root),
                ],
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            target = target_root / 'llm-wiki-ops' / 'SKILL.md'
            self.assertTrue(target.exists())
            self.assertEqual(target.read_text(encoding='utf-8'), SOURCE.read_text(encoding='utf-8'))
            self.assertIn('installed', result.stdout)

    def test_updates_existing_skill_file(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            target_root = Path(temp_dir) / '.claude' / 'skills'
            target = target_root / 'llm-wiki-ops' / 'SKILL.md'
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text('old content\n', encoding='utf-8')

            result = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPT),
                    '--target-root',
                    str(target_root),
                ],
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(target.read_text(encoding='utf-8'), SOURCE.read_text(encoding='utf-8'))
            self.assertIn('updated', result.stdout)

    def test_fails_clearly_when_source_file_is_missing(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            target_root = Path(temp_dir) / '.claude' / 'skills'
            missing_source = Path(temp_dir) / 'missing' / 'SKILL.md'

            result = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPT),
                    '--source',
                    str(missing_source),
                    '--target-root',
                    str(target_root),
                ],
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 1)
            self.assertIn('source skill file not found', result.stderr)
            self.assertIn(str(missing_source), result.stderr)


if __name__ == '__main__':
    unittest.main()
```

- [ ] **Step 2: Run the installer test to verify it fails before the script exists**

Run:
```bash
python3 -m unittest discover -s "/Users/zifeng.chen/bb/think-flow/tests" -p "test_install_skill.py" -v
```

Expected:
```text
python3: can't open file '/Users/zifeng.chen/bb/think-flow/scripts/install_skill.py': [Errno 2] No such file or directory
```

- [ ] **Step 3: Create the installer script**

```python
#!/usr/bin/env python3
import argparse
import shutil
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SOURCE = ROOT / 'skills' / 'llm-wiki-ops' / 'SKILL.md'
DEFAULT_TARGET_ROOT = Path.home() / '.claude' / 'skills'
SKILL_NAME = 'llm-wiki-ops'


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', default=str(DEFAULT_SOURCE))
    parser.add_argument('--target-root', default=str(DEFAULT_TARGET_ROOT))
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    source = Path(args.source).expanduser()
    target_root = Path(args.target_root).expanduser()
    target = target_root / SKILL_NAME / 'SKILL.md'

    if not source.exists():
        print(f'source skill file not found: {source}', file=sys.stderr)
        return 1

    action = 'updated' if target.exists() else 'installed'
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, target)

    print(f'{action} {SKILL_NAME}')
    print(f'source: {source}')
    print(f'target: {target}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
```

- [ ] **Step 4: Run the installer test again and verify all cases pass**

Run:
```bash
python3 -m unittest discover -s "/Users/zifeng.chen/bb/think-flow/tests" -p "test_install_skill.py" -v
```

Expected:
```text
Ran 3 tests in 0.0xxs

OK
```

### Task 3: Verify the real install flow and repo-wide regression coverage

**Files:**
- Modify: `/Users/zifeng.chen/.claude/skills/llm-wiki-ops/SKILL.md`
- Test: `/Users/zifeng.chen/bb/think-flow/tests/test_llm_wiki_ops_skill.py`
- Test: `/Users/zifeng.chen/bb/think-flow/tests/test_install_skill.py`

- [ ] **Step 1: Run the installer against the real default target**

Run:
```bash
python3 "/Users/zifeng.chen/bb/think-flow/scripts/install_skill.py"
```

Expected:
```text
installed llm-wiki-ops
source: /Users/zifeng.chen/bb/think-flow/skills/llm-wiki-ops/SKILL.md
target: /Users/zifeng.chen/.claude/skills/llm-wiki-ops/SKILL.md
```

If the target already exists, the first line should be:
```text
updated llm-wiki-ops
```

- [ ] **Step 2: Run all skill-related tests**

Run:
```bash
python3 -m unittest discover -s "/Users/zifeng.chen/bb/think-flow/tests" -p "test_*skill*.py" -v
```

Expected:
```text
test_installs_skill_into_empty_target_root (test_install_skill.InstallSkillScriptTests.test_installs_skill_into_empty_target_root) ... ok
test_updates_existing_skill_file (test_install_skill.InstallSkillScriptTests.test_updates_existing_skill_file) ... ok
test_fails_clearly_when_source_file_is_missing (test_install_skill.InstallSkillScriptTests.test_fails_clearly_when_source_file_is_missing) ... ok
...
OK
```

- [ ] **Step 3: Run the full repository test suite**

Run:
```bash
python3 -m unittest discover -s "/Users/zifeng.chen/bb/think-flow/tests" -p "test_*.py" -v
```

Expected:
```text
...
OK
```

- [ ] **Step 4: Manually inspect the final behavior and boundaries**

Check that:
- `skills/llm-wiki-ops/SKILL.md` is the canonical repo copy
- `tests/test_llm_wiki_ops_skill.py` reads the repo-local path
- `scripts/install_skill.py` only copies repo → target and never reverse-syncs
- `scripts/install_skill.py` supports `--target-root` for tests
- no symlink logic, batch install logic, or git commit logic was added

Expected: the implementation stays narrow and matches the approved design exactly.

- [ ] **Step 5: Confirm no commit is made unless explicitly requested**

Check that no git commit step is executed during this implementation.

Expected: all changes remain uncommitted unless the user later asks for a commit.

## Self-Review

### Spec coverage
- Repo-local source-of-truth skill placement is covered in Task 1.
- Single-command install/update behavior is covered in Task 2.
- Optional `--target-root` support for isolated tests is covered in Task 2.
- Clear failure when the source skill file is missing is covered in Task 2.
- Real install verification and regression coverage are covered in Task 3.
- The one-way sync boundary and no-extra-features boundary are covered in Task 3.

### Placeholder scan
- No `TODO`, `TBD`, or vague placeholders remain.
- Every task includes exact file paths.
- Every code-writing step includes concrete file content.
- Every verification step includes exact commands and expected outcomes.

### Type consistency
- The canonical repo skill path is consistently `skills/llm-wiki-ops/SKILL.md`.
- The installed target path is consistently `~/.claude/skills/llm-wiki-ops/SKILL.md`.
- The installer script is consistently `scripts/install_skill.py`.
- The managed skill name is consistently `llm-wiki-ops`.
