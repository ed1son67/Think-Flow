# LLM Wiki Ops Inline Text Ingest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend `llm-wiki-ops` so ingest mode accepts inline text, materializes it into `raw/inbox/`, and then follows the existing ingest workflow contract.

**Architecture:** The implementation stays documentation-first: update the personal skill file at `~/.claude/skills/llm-wiki-ops/SKILL.md` and strengthen the repo-local contract tests in `tests/test_llm_wiki_ops_skill.py`. The skill keeps the same three top-level modes (`ingest`, `query`, `lint`) and adds an inline-text subpath under `ingest`, with conservative mode detection, raw-layer preservation rules, and explicit failure boundaries.

**Tech Stack:** Markdown skill document, Python 3 standard library (`unittest`, `pathlib`), existing repo-local spec and prompts

---

## File Structure

### Files to modify
- `/Users/zifeng.chen/.claude/skills/llm-wiki-ops/SKILL.md` — add inline-text ingest routing, raw-file materialization rules, failure boundaries, and invocation examples
- `/Users/zifeng.chen/bb/think-flow/tests/test_llm_wiki_ops_skill.py` — add repo-local contract tests for inline-text ingest support

### Files to verify
- `/Users/zifeng.chen/bb/think-flow/docs/superpowers/specs/2026-04-13-llm-wiki-ops-inline-text-ingest-design.md` — approved design source for the implementation
- `/Users/zifeng.chen/bb/think-flow/tests/test_lint_wiki.py` — regression coverage that should still pass after the skill contract changes
- `/Users/zifeng.chen/bb/think-flow/tests/test_new_source.py` — regression coverage that should still pass after the skill contract changes
- `/Users/zifeng.chen/bb/think-flow/tests/test_update_index.py` — regression coverage that should still pass after the skill contract changes

## Implementation Notes

- Keep `llm-wiki-ops` as one self-contained personal skill file.
- Do not add a new top-level mode; extend `ingest` with an inline-text subpath.
- Do not add helper scripts or parsers in this iteration.
- Keep the raw layer as evidence: inline text must first become a file under `raw/inbox/`.
- Prefer exact sentence assertions in tests when the spec calls for hard guardrails.
- Do not create a git commit unless the user explicitly asks.

### Task 1: Add failing contract tests for inline-text ingest support

**Files:**
- Modify: `/Users/zifeng.chen/bb/think-flow/tests/test_llm_wiki_ops_skill.py`
- Test: `/Users/zifeng.chen/bb/think-flow/tests/test_llm_wiki_ops_skill.py`

- [ ] **Step 1: Replace the test file with inline-ingest contract assertions**

```python
import unittest
from pathlib import Path


SKILL_PATH = Path('/Users/zifeng.chen/.claude/skills/llm-wiki-ops/SKILL.md')


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

    def test_skill_has_invocation_examples(self):
        text = self.skill_text

        for snippet in [
            '## Invocation Examples',
            'Use `llm-wiki-ops` to ingest `raw/inbox/foo.md`.',
            'Use `llm-wiki-ops` to answer:',
            'Use `llm-wiki-ops` to lint the wiki.',
        ]:
            self.assertIn(snippet, text)

    def test_skill_requires_clarification_for_ambiguous_requests(self):
        text = self.skill_text

        self.assertIn('If the request could fit more than one mode, stop and ask a clarifying question instead of guessing.', text)

    def test_skill_forbids_content_rewrites_in_safe_fix(self):
        text = self.skill_text

        self.assertIn('Do not rewrite content-rich pages in v1 safe-fix mode.', text)

    def test_skill_supports_single_line_and_multi_line_inline_ingest(self):
        text = self.skill_text

        self.assertIn('single-line inline text', text)
        self.assertIn('multi-line inline text', text)
        self.assertIn('Use `llm-wiki-ops` to ingest this text:', text)

    def test_skill_requires_inline_text_materialization_into_raw_inbox(self):
        text = self.skill_text

        self.assertIn('materialize the inline text into one new raw file under `raw/inbox/`', text)
        self.assertIn('The text must not bypass the raw evidence layer.', text)

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

    def test_skill_describes_inline_ingest_failure_boundaries(self):
        text = self.skill_text

        self.assertIn('If the user asks to ingest inline text but does not actually provide enough content to write a source file, the skill must ask for the content instead of creating an empty raw file.', text)
        self.assertIn('If the inline text cannot be written into `raw/inbox/`, the skill must stop and must not proceed to wiki updates.', text)
        self.assertIn('If raw-file creation succeeds but a later ingest step fails, the generated raw file should remain in place for retry and traceability.', text)
```

- [ ] **Step 2: Run the updated skill contract tests and verify they fail**

Run:
```bash
python3 -m unittest discover -s "/Users/zifeng.chen/bb/think-flow/tests" -p "test_llm_wiki_ops_skill.py" -v
```

Expected:
```text
...
test_skill_supports_single_line_and_multi_line_inline_ingest (...) ... FAIL
test_skill_requires_inline_text_materialization_into_raw_inbox (...) ... FAIL
test_skill_describes_filename_generation_and_collision_handling (...) ... FAIL
test_skill_describes_markdown_like_and_plain_text_handling (...) ... FAIL
test_skill_describes_inline_ingest_failure_boundaries (...) ... FAIL
```

- [ ] **Step 3: Confirm the failure is due to missing inline-ingest contract text, not a missing skill file**

Check that the output references missing expected strings in `~/.claude/skills/llm-wiki-ops/SKILL.md`, not `FileNotFoundError`.

Expected: the existing five tests still load the skill file successfully, and only the new inline-ingest assertions fail.

### Task 2: Update the skill contract for inline-text ingest materialization

**Files:**
- Modify: `/Users/zifeng.chen/.claude/skills/llm-wiki-ops/SKILL.md`
- Test: `/Users/zifeng.chen/bb/think-flow/tests/test_llm_wiki_ops_skill.py`

- [ ] **Step 1: Replace the skill file with the inline-ingest-aware contract text**

```markdown
---
name: llm-wiki-ops
description: Use when working inside an LLM Wiki repository to ingest a source, answer questions from the wiki, or run a wiki health check.
---

# LLM Wiki Ops

## Overview
Use this skill as the single entry point for all LLM Wiki work: ingest, query, and lint. The repo-local rules are the source of truth; this skill only operationalizes them.

`ingest` supports two input paths:
- file ingest when the user provides a concrete `raw/inbox/` path
- inline ingest when the user provides single-line inline text or multi-line inline text directly in the request

For inline ingest, materialize the text into `raw/inbox/` first and then continue with the normal ingest workflow.

## When to Use
Use when the task is clearly one of these modes:
- ingest a source from `raw/inbox/`
- ingest single-line inline text into the wiki
- ingest multi-line inline text into the wiki
- answer a question from the wiki
- run a wiki health check / lint pass

Do not use this skill for unrelated repository work.

## Mode Detection
Detect the mode conservatively.
- If the request is clearly about bringing in new source material from `raw/inbox/`, use `ingest` with file input.
- If the request is clearly asking to ingest, process, or store text directly into the wiki, use `ingest` with inline input.
- If the request is clearly asking for an answer grounded in existing wiki content, use `query`.
- If the request is clearly about checking repository health, missing pages, or structural hygiene, use `lint`.
- If the request could fit more than one mode, stop and ask a clarifying question instead of guessing.
- If the request contains both a file path and a separate pasted body of text, stop and ask a clarifying question instead of guessing.

## Repository Contract
Always read `CLAUDE.md` first. Then follow the mode-specific minimum reads.
- `CLAUDE.md`
- `prompts/ingest.md`
- `prompts/query.md`
- `prompts/lint.md`

If those files are missing, stop for clarification instead of continuing.

## Required Reads by Mode

### ingest
- `CLAUDE.md`
- `prompts/ingest.md`
- for file ingest: read the single source file from `raw/inbox/`
- for inline ingest: first materialize the inline text into one new raw file under `raw/inbox/`, then read that generated raw file as the single source

### query
- `CLAUDE.md`
- `prompts/query.md`
- `wiki/index.md`
- the most relevant topic pages
- relevant source pages only if topic pages are insufficient

### lint
- `CLAUDE.md`
- `prompts/lint.md`
- `wiki/index.md`
- the pages needed to inspect the reported issue

## Inline Ingest Materialization Rules

### raw file location
Inline text must first be written to a new file under `raw/inbox/`.
The text must not bypass the raw evidence layer.

### filename generation
Generate the filename automatically.
1. If the content starts with a markdown heading like `# Title`, derive a slug from that heading.
2. Otherwise use a generic fallback slug such as `inline-note`, `note`, or `capture`.
3. Prefix the filename with the current date.
4. If the generated filename already exists, append a numeric suffix instead of overwriting.

Examples:
- `raw/inbox/2026-04-13-project-constraints.md`
- `raw/inbox/2026-04-13-inline-note.md`
- `raw/inbox/2026-04-13-inline-note-2.md`

### content preservation
Use a lightweight smart decision:
- if the text appears to already be markdown, preserve it as closely as possible
- if the text appears to be plain text, wrap it minimally into markdown

Treat the input as markdown-like when it shows obvious markers such as `# `, `## `, `- `, `1. `, fenced code blocks, or markdown links/emphasis.

For plain text, a minimal wrapper like this is allowed:

```markdown
# Untitled Note

<original text>
```

Do not add complex metadata or summary content at the raw layer.

## Execution Contract
- Operate one mode at a time: ingest, query, or lint.
- Follow the repo-local workflow for the selected mode.
- Prefer existing wiki pages over creating new ones.
- Preserve raw evidence; do not rewrite files under `raw/`.
- Keep changes minimal and aligned with the requested mode.
- If mode detection is unclear, pause and ask for clarification.

For ingest, enforce this sequence:
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

## Invocation Examples
- Use `llm-wiki-ops` to ingest `raw/inbox/foo.md`.
- Use `llm-wiki-ops` to ingest this text: We should keep source pages separate from topic pages because sources are evidence and topics are synthesis.
- Use `llm-wiki-ops` to ingest this text:
  ```markdown
  # Project Constraints

  - Keep raw files immutable
  - Keep source pages separate from topic pages
  ```
- Use `llm-wiki-ops` to answer: "What does the wiki conclude about source ingestion?"
- Use `llm-wiki-ops` to lint the wiki.

## Output Contract
- **ingest**: summarize the source, list the pages written or updated, and note any open questions or follow-ups.
- **inline ingest**: also report the generated raw file path under `raw/inbox/` and whether the content was preserved as markdown-like text or minimally wrapped as plain text.
- **query**: separate wiki-backed conclusions from inference, and cite which wiki pages were used.
- **lint**: report findings, severity, and whether any durable wiki content changed.

## Failure Boundaries
- If the user asks to ingest inline text but does not actually provide enough content to write a source file, the skill must ask for the content instead of creating an empty raw file.
- If the inline text cannot be written into `raw/inbox/`, the skill must stop and must not proceed to wiki updates.
- If raw-file creation succeeds but a later ingest step fails, the generated raw file should remain in place for retry and traceability.

## Common Mistakes
- Treating this skill as a general repo skill instead of a single entry point for ingest/query/lint
- Skipping `CLAUDE.md` or the relevant prompt scaffold
- Forgetting that inline ingest must first create a raw file under `raw/inbox/`
- Letting inline text bypass the raw evidence layer
- Overwriting an existing generated raw file instead of adding a numeric suffix
- Acting on ambiguous instructions instead of asking a clarifying question
- Rewriting raw files or over-editing content-rich wiki pages
- Do not rewrite content-rich pages in v1 safe-fix mode.
- Failing to distinguish wiki conclusions from inference
```

- [ ] **Step 2: Run the skill contract tests and verify the inline-ingest assertions pass**

Run:
```bash
python3 -m unittest discover -s "/Users/zifeng.chen/bb/think-flow/tests" -p "test_llm_wiki_ops_skill.py" -v
```

Expected:
```text
Ran 10 tests in 0.0xxs

OK
```

- [ ] **Step 3: Read the skill text back and verify the ingest mode still has only two inputs, not a new top-level mode**

Check that:
- `# LLM Wiki Ops` still describes the skill as `ingest`, `query`, and `lint`
- inline text is described as a subpath of `ingest`
- `query` and `lint` wording is unchanged in scope

Expected: the skill remains a three-mode orchestration skill.

### Task 3: Strengthen examples and failure-boundary tests for inline ingest

**Files:**
- Modify: `/Users/zifeng.chen/bb/think-flow/tests/test_llm_wiki_ops_skill.py`
- Test: `/Users/zifeng.chen/bb/think-flow/tests/test_llm_wiki_ops_skill.py`

- [ ] **Step 1: Replace the test file with a final grouped version that adds explicit example and ambiguity checks**

```python
import unittest
from pathlib import Path


SKILL_PATH = Path('/Users/zifeng.chen/.claude/skills/llm-wiki-ops/SKILL.md')


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

- [ ] **Step 2: Run the skill tests and verify the final contract still passes**

Run:
```bash
python3 -m unittest discover -s "/Users/zifeng.chen/bb/think-flow/tests" -p "test_llm_wiki_ops_skill.py" -v
```

Expected:
```text
Ran 10 tests in 0.0xxs

OK
```

- [ ] **Step 3: Manually inspect the new test groups for overlap and scope drift**

Check that:
- no test implies a new top-level mode beyond `ingest`, `query`, `lint`
- no test requires user-provided filenames or titles
- no test expects a new helper script or parser

Expected: the test file matches the approved scope exactly.

### Task 4: Final verification against the repo and skill file

**Files:**
- Modify: `/Users/zifeng.chen/.claude/skills/llm-wiki-ops/SKILL.md`
- Modify: `/Users/zifeng.chen/bb/think-flow/tests/test_llm_wiki_ops_skill.py`
- Test: `/Users/zifeng.chen/bb/think-flow/tests/test_llm_wiki_ops_skill.py`

- [ ] **Step 1: Verify the personal skill file still exists in the correct location**

Run:
```bash
python3 - <<'PY'
from pathlib import Path
path = Path('/Users/zifeng.chen/.claude/skills/llm-wiki-ops/SKILL.md')
print(path.exists())
PY
```

Expected:
```text
True
```

- [ ] **Step 2: Run the final skill contract tests**

Run:
```bash
python3 -m unittest discover -s "/Users/zifeng.chen/bb/think-flow/tests" -p "test_llm_wiki_ops_skill.py" -v
```

Expected: all 10 skill-contract tests pass.

- [ ] **Step 3: Run the repo’s full test suite to confirm no regressions**

Run:
```bash
python3 -m unittest discover -s "/Users/zifeng.chen/bb/think-flow/tests" -p "test_*.py" -v
```

Expected:
```text
test_report_mode_flags_missing_frontmatter_and_index (test_lint_wiki.LintWikiScriptTests.test_report_mode_flags_missing_frontmatter_and_index) ... ok
test_safe_fix_creates_missing_index_and_log_files (test_lint_wiki.LintWikiScriptTests.test_safe_fix_creates_missing_index_and_log_files) ... ok
test_creates_dated_source_page_with_template (test_new_source.NewSourceScriptTests.test_creates_dated_source_page_with_template) ... ok
test_fails_when_target_file_already_exists (test_new_source.NewSourceScriptTests.test_fails_when_target_file_already_exists) ... ok
test_reports_missing_source_page_from_index (test_update_index.UpdateIndexScriptTests.test_reports_missing_source_page_from_index) ... ok
test_returns_success_when_all_pages_are_indexed (test_update_index.UpdateIndexScriptTests.test_returns_success_when_all_pages_are_indexed) ... ok
...
OK
```

- [ ] **Step 4: Manually inspect the final skill text for scope clarity**

Check that:
- the frontmatter description still starts with `Use when...`
- the skill still describes only three top-level modes
- inline text is clearly a subpath under `ingest`
- the raw evidence layer is preserved
- the skill does not promise user-specified filenames or new parsing infrastructure

Expected: the extension is narrow, explicit, and aligned with the approved spec.

- [ ] **Step 5: Confirm no commit is made unless explicitly requested**

Check that no git commit step is executed during this task sequence unless the user later asks for one.

Expected: the implementation remains uncommitted by default, matching the workflow already used in this session.

## Self-Review

### Spec coverage
- Inline text support for both single-line and multi-line input is covered in Tasks 1–3.
- Automatic file naming with heading-derived slug and collision suffixes is covered in Tasks 1–3.
- Markdown-like preservation and plain-text wrapping are covered in Tasks 1–3.
- The rule that inline text must first materialize into `raw/inbox/` is covered in Tasks 1–2.
- Failure boundaries for missing content, write failure, and downstream ingest failure are covered in Tasks 1–3.
- The guarantee that `ingest` remains a subpath instead of a new top-level mode is covered in Tasks 2 and 4.
- Final repo-wide verification is covered in Task 4.

### Placeholder scan
- No `TODO`, `TBD`, or vague placeholders remain.
- Every task includes exact file paths.
- Every code-writing step includes concrete file content.
- Every verification step includes an exact command and expected outcome.

### Type consistency
- The skill name is consistently `llm-wiki-ops`.
- The repository contract files remain `CLAUDE.md`, `prompts/ingest.md`, `prompts/query.md`, and `prompts/lint.md`.
- Inline text is consistently described as a subpath under `ingest`, not as a fourth top-level mode.
- Filename examples consistently use `raw/inbox/YYYY-MM-DD-*.md`.
