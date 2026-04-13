# LLM Wiki Ops Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single Claude Code skill named `llm-wiki-ops` that orchestrates ingest, query, and lint operations for this repository’s LLM Wiki workflow.

**Architecture:** The implementation adds one self-contained personal skill under `~/.claude/skills/llm-wiki-ops/` and validates it with repository-local tests that assert the documented contract: conservative mode detection, required file reads, explicit workflow boundaries, and output expectations. The skill remains thin by delegating domain rules to this repo’s `CLAUDE.md` and `prompts/*.md` files instead of duplicating schema logic.

**Tech Stack:** Markdown skill document, Python 3 standard library (`unittest`, `pathlib`, `re`), existing repo docs and prompts

---

## File Structure

### Files to create
- `/Users/zifeng.chen/.claude/skills/llm-wiki-ops/SKILL.md` — the callable Claude Code skill for LLM Wiki ingest/query/lint orchestration
- `/Users/zifeng.chen/bb/think-flow/tests/test_llm_wiki_ops_skill.py` — repository-local tests that validate the skill’s contract and discovery metadata

### Files to modify
- None required if the skill is kept fully self-contained and repo-local behavior remains in `CLAUDE.md` plus `prompts/*.md`.

## Implementation Notes

- Keep the skill in one file for v1.
- The frontmatter description must describe when to use the skill, not the workflow details.
- The skill must explicitly tell future agents to read the repo-local rule files before acting.
- The skill must enforce conservative mode detection and require clarification on ambiguous requests.
- Since the skill lives outside the repo, use repo-local tests to validate its text contract after writing it.
- Do not introduce extra supporting files unless the main `SKILL.md` becomes too large.
- Do not create git commits unless the user explicitly asks.

### Task 1: Add contract tests for the skill document

**Files:**
- Create: `/Users/zifeng.chen/bb/think-flow/tests/test_llm_wiki_ops_skill.py`
- Test: `/Users/zifeng.chen/bb/think-flow/tests/test_llm_wiki_ops_skill.py`

- [ ] **Step 1: Write the failing test file for skill metadata and required sections**

```python
import re
import unittest
from pathlib import Path


SKILL_PATH = Path('/Users/zifeng.chen/.claude/skills/llm-wiki-ops/SKILL.md')


class LlmWikiOpsSkillTests(unittest.TestCase):
    def test_skill_has_required_frontmatter_and_sections(self):
        text = SKILL_PATH.read_text()

        self.assertIn('name: llm-wiki-ops', text)
        self.assertIn('description: Use when working inside an LLM Wiki repository', text)
        self.assertIn('# LLM Wiki Ops', text)
        self.assertIn('## Overview', text)
        self.assertIn('## When to Use', text)
        self.assertIn('## Mode Detection', text)
        self.assertIn('## Required Reads by Mode', text)
        self.assertIn('## Execution Contract', text)
        self.assertIn('## Output Contract', text)
        self.assertIn('## Common Mistakes', text)

    def test_skill_requires_repo_rule_files(self):
        text = SKILL_PATH.read_text()

        self.assertIn('`CLAUDE.md`', text)
        self.assertIn('`prompts/ingest.md`', text)
        self.assertIn('`prompts/query.md`', text)
        self.assertIn('`prompts/lint.md`', text)
        self.assertIn('`wiki/index.md`', text)


if __name__ == '__main__':
    unittest.main()
```

- [ ] **Step 2: Run the test to verify it fails before the skill exists**

Run:
```bash
python3 -m unittest tests.test_llm_wiki_ops_skill -v
```

Expected: FAIL with file-not-found errors for `/Users/zifeng.chen/.claude/skills/llm-wiki-ops/SKILL.md`.

- [ ] **Step 3: Create `tests/test_llm_wiki_ops_skill.py`**

```python
import unittest
from pathlib import Path


SKILL_PATH = Path('/Users/zifeng.chen/.claude/skills/llm-wiki-ops/SKILL.md')


class LlmWikiOpsSkillTests(unittest.TestCase):
    def test_skill_has_required_frontmatter_and_sections(self):
        text = SKILL_PATH.read_text()

        self.assertIn('name: llm-wiki-ops', text)
        self.assertIn('description: Use when working inside an LLM Wiki repository', text)
        self.assertIn('# LLM Wiki Ops', text)
        self.assertIn('## Overview', text)
        self.assertIn('## When to Use', text)
        self.assertIn('## Mode Detection', text)
        self.assertIn('## Required Reads by Mode', text)
        self.assertIn('## Execution Contract', text)
        self.assertIn('## Output Contract', text)
        self.assertIn('## Common Mistakes', text)

    def test_skill_requires_repo_rule_files(self):
        text = SKILL_PATH.read_text()

        self.assertIn('`CLAUDE.md`', text)
        self.assertIn('`prompts/ingest.md`', text)
        self.assertIn('`prompts/query.md`', text)
        self.assertIn('`prompts/lint.md`', text)
        self.assertIn('`wiki/index.md`', text)


if __name__ == '__main__':
    unittest.main()
```

- [ ] **Step 4: Run the test again to verify the missing-skill failure is real**

Run:
```bash
python3 -m unittest tests.test_llm_wiki_ops_skill -v
```

Expected: FAIL with `FileNotFoundError` because the skill file still does not exist.

### Task 2: Write the minimal `llm-wiki-ops` skill document

**Files:**
- Create: `/Users/zifeng.chen/.claude/skills/llm-wiki-ops/SKILL.md`
- Test: `/Users/zifeng.chen/bb/think-flow/tests/test_llm_wiki_ops_skill.py`

- [ ] **Step 1: Create the skill directory**

Run:
```bash
mkdir -p "/Users/zifeng.chen/.claude/skills/llm-wiki-ops"
```

Expected: command succeeds with no output.

- [ ] **Step 2: Write the minimal skill document**

```markdown
---
name: llm-wiki-ops
description: Use when working inside an LLM Wiki repository to ingest a source, answer questions from the wiki, or run a wiki health check.
---

# LLM Wiki Ops

## Overview

`llm-wiki-ops` is a single-entry skill for operating an LLM Wiki repository through three modes: ingest, query, and lint.
It is an orchestration skill, not a schema skill: the repository’s `CLAUDE.md` and `prompts/*.md` files remain the source of truth for workflow rules.

## When to Use

Use this skill when:
- the user wants to ingest a markdown or txt source into the wiki
- the user wants an answer based on the current wiki
- the user wants a wiki health check or lint pass

Do not use this skill when:
- the repository does not define an LLM Wiki workflow
- the task is a generic RAG request unrelated to this repo’s wiki structure
- the task requires PDF ingestion, direct web ingestion, or embedding infrastructure in v1

## Mode Detection

### ingest
Use ingest mode when the user provides a concrete source file path or clearly asks to ingest/process a source into the wiki.

### query
Use query mode when the user asks a knowledge question that should be answered from the current wiki.

### lint
Use lint mode when the user asks for linting, a health check, orphan-page checks, missing-link checks, or structure validation.

### ambiguous
If the request could fit more than one mode, stop and ask a clarifying question instead of guessing.

## Required Reads by Mode

### ingest
Read these before acting:
- `CLAUDE.md`
- `prompts/ingest.md`

Then read exactly one source document.

### query
Read these before acting:
- `CLAUDE.md`
- `prompts/query.md`
- `wiki/index.md`

Then read the most relevant topic pages before source pages.

### lint
Read these before acting:
- `CLAUDE.md`
- `prompts/lint.md`

Then inspect the relevant wiki structure and pages.

## Execution Contract

### ingest
1. Read `CLAUDE.md`.
2. Read `prompts/ingest.md`.
3. Read exactly one source file.
4. Create or update one source page under `wiki/sources/`.
5. Update one or more relevant topic pages under `wiki/topics/`.
6. Update `wiki/index.md`.
7. Append an ingest entry to `wiki/log.md`.
8. Move the source from `raw/inbox/` to `raw/processed/`.
9. Verify the resulting files exist and are linked.

### query
1. Read `CLAUDE.md`.
2. Read `prompts/query.md`.
3. Read `wiki/index.md`.
4. Read relevant topic pages before source pages.
5. Answer while distinguishing established wiki conclusions from inference.
6. Create or suggest a synthesis page only when the output is likely to be reused.

### lint
1. Read `CLAUDE.md`.
2. Read `prompts/lint.md`.
3. Inspect required structure and system pages.
4. Inspect content pages for frontmatter, emptiness, and index coverage.
5. Respect the boundary between `report` and `safe-fix`.
6. Do not rewrite content-rich pages in v1 safe-fix mode.

## Output Contract

### ingest output
Return:
- processed source path
- source page path created or updated
- topic pages updated
- system pages updated
- whether any new topic was created

### query output
Return:
- answer
- pages consulted
- evidence pages
- explicit distinction between established conclusion and inference
- whether a synthesis page was created

### lint output
Return:
- lint mode
- missing structure
- metadata/frontmatter issues
- empty pages
- missing index coverage
- fixes applied

## Common Mistakes

Avoid these mistakes:
- skipping `wiki/index.md` during query
- writing topic pages during ingest before creating or updating the source page
- forgetting `wiki/index.md` or `wiki/log.md` updates during ingest
- rewriting content pages during lint safe-fix mode
- guessing the mode when the request is ambiguous
- using this skill in repositories that do not match the expected LLM Wiki layout
```

- [ ] **Step 3: Run the tests to verify the minimal skill passes**

Run:
```bash
python3 -m unittest tests.test_llm_wiki_ops_skill -v
```

Expected:
```text
test_skill_has_required_frontmatter_and_sections (tests.test_llm_wiki_ops_skill.LlmWikiOpsSkillTests.test_skill_has_required_frontmatter_and_sections) ... ok
test_skill_requires_repo_rule_files (tests.test_llm_wiki_ops_skill.LlmWikiOpsSkillTests.test_skill_requires_repo_rule_files) ... ok

----------------------------------------------------------------------
Ran 2 tests in 0.0xxs

OK
```

### Task 3: Add tests for mode boundaries and ambiguity handling

**Files:**
- Modify: `/Users/zifeng.chen/bb/think-flow/tests/test_llm_wiki_ops_skill.py`
- Test: `/Users/zifeng.chen/bb/think-flow/tests/test_llm_wiki_ops_skill.py`

- [ ] **Step 1: Add a failing test for ambiguous mode handling**

```python
    def test_skill_requires_clarification_for_ambiguous_requests(self):
        text = SKILL_PATH.read_text()

        self.assertIn('If the request could fit more than one mode, stop and ask a clarifying question instead of guessing.', text)
```

- [ ] **Step 2: Add a failing test for lint safe-fix boundaries**

```python
    def test_skill_forbids_content_rewrites_in_safe_fix(self):
        text = SKILL_PATH.read_text()

        self.assertIn('Do not rewrite content-rich pages in v1 safe-fix mode.', text)
```

- [ ] **Step 3: Update `tests/test_llm_wiki_ops_skill.py` with the new tests**

```python
import unittest
from pathlib import Path


SKILL_PATH = Path('/Users/zifeng.chen/.claude/skills/llm-wiki-ops/SKILL.md')


class LlmWikiOpsSkillTests(unittest.TestCase):
    def test_skill_has_required_frontmatter_and_sections(self):
        text = SKILL_PATH.read_text()

        self.assertIn('name: llm-wiki-ops', text)
        self.assertIn('description: Use when working inside an LLM Wiki repository', text)
        self.assertIn('# LLM Wiki Ops', text)
        self.assertIn('## Overview', text)
        self.assertIn('## When to Use', text)
        self.assertIn('## Mode Detection', text)
        self.assertIn('## Required Reads by Mode', text)
        self.assertIn('## Execution Contract', text)
        self.assertIn('## Output Contract', text)
        self.assertIn('## Common Mistakes', text)

    def test_skill_requires_repo_rule_files(self):
        text = SKILL_PATH.read_text()

        self.assertIn('`CLAUDE.md`', text)
        self.assertIn('`prompts/ingest.md`', text)
        self.assertIn('`prompts/query.md`', text)
        self.assertIn('`prompts/lint.md`', text)
        self.assertIn('`wiki/index.md`', text)

    def test_skill_requires_clarification_for_ambiguous_requests(self):
        text = SKILL_PATH.read_text()

        self.assertIn('If the request could fit more than one mode, stop and ask a clarifying question instead of guessing.', text)

    def test_skill_forbids_content_rewrites_in_safe_fix(self):
        text = SKILL_PATH.read_text()

        self.assertIn('Do not rewrite content-rich pages in v1 safe-fix mode.', text)


if __name__ == '__main__':
    unittest.main()
```

- [ ] **Step 4: Run the tests to verify the new assertions pass**

Run:
```bash
python3 -m unittest tests.test_llm_wiki_ops_skill -v
```

Expected:
```text
test_skill_forbids_content_rewrites_in_safe_fix (tests.test_llm_wiki_ops_skill.LlmWikiOpsSkillTests.test_skill_forbids_content_rewrites_in_safe_fix) ... ok
test_skill_has_required_frontmatter_and_sections (tests.test_llm_wiki_ops_skill.LlmWikiOpsSkillTests.test_skill_has_required_frontmatter_and_sections) ... ok
test_skill_requires_clarification_for_ambiguous_requests (tests.test_llm_wiki_ops_skill.LlmWikiOpsSkillTests.test_skill_requires_clarification_for_ambiguous_requests) ... ok
test_skill_requires_repo_rule_files (tests.test_llm_wiki_ops_skill.LlmWikiOpsSkillTests.test_skill_requires_repo_rule_files) ... ok

----------------------------------------------------------------------
Ran 4 tests in 0.0xxs

OK
```

### Task 4: Refine the skill for invocation examples and misuse prevention

**Files:**
- Modify: `/Users/zifeng.chen/.claude/skills/llm-wiki-ops/SKILL.md`
- Test: `/Users/zifeng.chen/bb/think-flow/tests/test_llm_wiki_ops_skill.py`

- [ ] **Step 1: Add a failing test for invocation examples and repository-fit checks**

```python
    def test_skill_includes_examples_and_repo_fit_guardrail(self):
        text = SKILL_PATH.read_text()

        self.assertIn('## Invocation Examples', text)
        self.assertIn('Use `llm-wiki-ops` to ingest `raw/inbox/foo.md`.', text)
        self.assertIn('Use `llm-wiki-ops` to answer:', text)
        self.assertIn('Use `llm-wiki-ops` to lint the wiki.', text)
        self.assertIn('stop for clarification if those files are missing', text)
```

- [ ] **Step 2: Update the skill to include invocation examples and repository guardrails**

```markdown
## Repository Contract

This skill assumes it is operating inside a repository that already provides:
- `CLAUDE.md`
- `prompts/ingest.md`
- `prompts/query.md`
- `prompts/lint.md`

If those files are missing, stop for clarification instead of continuing.

## Invocation Examples

### ingest examples
- Use `llm-wiki-ops` to ingest `raw/inbox/foo.md`.
- Process this source and update the wiki.

### query examples
- Use `llm-wiki-ops` to answer: why do source pages and topic pages stay separate?
- Based on the current wiki, summarize the core v1 design constraints.

### lint examples
- Use `llm-wiki-ops` to lint the wiki.
- Run a wiki health check in report mode only.
```

- [ ] **Step 3: Expand `tests/test_llm_wiki_ops_skill.py` to include the new assertions**

```python
import unittest
from pathlib import Path


SKILL_PATH = Path('/Users/zifeng.chen/.claude/skills/llm-wiki-ops/SKILL.md')


class LlmWikiOpsSkillTests(unittest.TestCase):
    def test_skill_has_required_frontmatter_and_sections(self):
        text = SKILL_PATH.read_text()

        self.assertIn('name: llm-wiki-ops', text)
        self.assertIn('description: Use when working inside an LLM Wiki repository', text)
        self.assertIn('# LLM Wiki Ops', text)
        self.assertIn('## Overview', text)
        self.assertIn('## When to Use', text)
        self.assertIn('## Mode Detection', text)
        self.assertIn('## Required Reads by Mode', text)
        self.assertIn('## Execution Contract', text)
        self.assertIn('## Output Contract', text)
        self.assertIn('## Common Mistakes', text)

    def test_skill_requires_repo_rule_files(self):
        text = SKILL_PATH.read_text()

        self.assertIn('`CLAUDE.md`', text)
        self.assertIn('`prompts/ingest.md`', text)
        self.assertIn('`prompts/query.md`', text)
        self.assertIn('`prompts/lint.md`', text)
        self.assertIn('`wiki/index.md`', text)

    def test_skill_requires_clarification_for_ambiguous_requests(self):
        text = SKILL_PATH.read_text()

        self.assertIn('If the request could fit more than one mode, stop and ask a clarifying question instead of guessing.', text)

    def test_skill_forbids_content_rewrites_in_safe_fix(self):
        text = SKILL_PATH.read_text()

        self.assertIn('Do not rewrite content-rich pages in v1 safe-fix mode.', text)

    def test_skill_includes_examples_and_repo_fit_guardrail(self):
        text = SKILL_PATH.read_text()

        self.assertIn('## Invocation Examples', text)
        self.assertIn('Use `llm-wiki-ops` to ingest `raw/inbox/foo.md`.', text)
        self.assertIn('Use `llm-wiki-ops` to answer:', text)
        self.assertIn('Use `llm-wiki-ops` to lint the wiki.', text)
        self.assertIn('If those files are missing, stop for clarification instead of continuing.', text)


if __name__ == '__main__':
    unittest.main()
```

- [ ] **Step 4: Run the tests to verify the refined skill passes**

Run:
```bash
python3 -m unittest tests.test_llm_wiki_ops_skill -v
```

Expected:
```text
test_skill_forbids_content_rewrites_in_safe_fix (tests.test_llm_wiki_ops_skill.LlmWikiOpsSkillTests.test_skill_forbids_content_rewrites_in_safe_fix) ... ok
test_skill_has_required_frontmatter_and_sections (tests.test_llm_wiki_ops_skill.LlmWikiOpsSkillTests.test_skill_has_required_frontmatter_and_sections) ... ok
test_skill_includes_examples_and_repo_fit_guardrail (tests.test_llm_wiki_ops_skill.LlmWikiOpsSkillTests.test_skill_includes_examples_and_repo_fit_guardrail) ... ok
test_skill_requires_clarification_for_ambiguous_requests (tests.test_llm_wiki_ops_skill.LlmWikiOpsSkillTests.test_skill_requires_clarification_for_ambiguous_requests) ... ok
test_skill_requires_repo_rule_files (tests.test_llm_wiki_ops_skill.LlmWikiOpsSkillTests.test_skill_requires_repo_rule_files) ... ok

----------------------------------------------------------------------
Ran 5 tests in 0.0xxs

OK
```

### Task 5: Final verification against the repository and skill file

**Files:**
- Create: `/Users/zifeng.chen/.claude/skills/llm-wiki-ops/SKILL.md`
- Test: `/Users/zifeng.chen/bb/think-flow/tests/test_llm_wiki_ops_skill.py`

- [ ] **Step 1: Verify the skill file exists in the correct personal skill location**

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

- [ ] **Step 2: Run the skill contract tests**

Run:
```bash
python3 -m unittest tests.test_llm_wiki_ops_skill -v
```

Expected: all five tests pass.

- [ ] **Step 3: Run the repo’s existing test suite to ensure the new skill work does not regress bootstrap behavior**

Run:
```bash
python3 -m unittest discover -s tests -v
```

Expected:
```text
test_report_mode_flags_missing_frontmatter_and_index (test_lint_wiki.LintWikiScriptTests.test_report_mode_flags_missing_frontmatter_and_index) ... ok
test_safe_fix_creates_missing_index_and_log_files (test_lint_wiki.LintWikiScriptTests.test_safe_fix_creates_missing_index_and_log_files) ... ok
test_creates_dated_source_page_with_template (test_new_source.NewSourceScriptTests.test_creates_dated_source_page_with_template) ... ok
test_fails_when_target_file_already_exists (test_new_source.NewSourceScriptTests.test_fails_when_target_file_already_exists) ... ok
test_reports_missing_source_page_from_index (test_update_index.UpdateIndexScriptTests.test_reports_missing_source_page_from_index) ... ok
test_returns_success_when_all_pages_are_indexed (test_update_index.UpdateIndexScriptTests.test_returns_success_when_all_pages_are_indexed) ... ok
test_skill_forbids_content_rewrites_in_safe_fix (test_llm_wiki_ops_skill.LlmWikiOpsSkillTests.test_skill_forbids_content_rewrites_in_safe_fix) ... ok
test_skill_has_required_frontmatter_and_sections (test_llm_wiki_ops_skill.LlmWikiOpsSkillTests.test_skill_has_required_frontmatter_and_sections) ... ok
test_skill_includes_examples_and_repo_fit_guardrail (test_llm_wiki_ops_skill.LlmWikiOpsSkillTests.test_skill_includes_examples_and_repo_fit_guardrail) ... ok
test_skill_requires_clarification_for_ambiguous_requests (test_llm_wiki_ops_skill.LlmWikiOpsSkillTests.test_skill_requires_clarification_for_ambiguous_requests) ... ok
test_skill_requires_repo_rule_files (test_llm_wiki_ops_skill.LlmWikiOpsSkillTests.test_skill_requires_repo_rule_files) ... ok

----------------------------------------------------------------------
Ran 11 tests in 0.xxs

OK
```

- [ ] **Step 4: Manually inspect the skill text for CSO and scope clarity**

Check that:
- the frontmatter description starts with “Use when...”
- the skill does not duplicate the full repository schema
- the skill explicitly prevents ambiguous mode guessing
- the skill keeps ingest/query/lint boundaries clear

- [ ] **Step 5: Confirm no commit is made unless explicitly requested**

Check that no git commit step is executed during this task sequence unless the user later asks for one.

Expected: the implementation remains uncommitted by default, matching the repository workflow used in this session.

## Self-Review

### Spec coverage
- Single-skill architecture is covered in Task 2.
- Placement at `~/.claude/skills/llm-wiki-ops/SKILL.md` is covered in Tasks 2 and 5.
- Internal ingest/query/lint modes are covered in the skill body written in Task 2.
- Required repo-local reads are covered by Task 1 tests and Task 2 content.
- Conservative ambiguity handling and lint safe-fix boundaries are covered by Task 3.
- Invocation examples and repo-fit guardrails are covered by Task 4.
- End-to-end verification against the existing repo is covered by Task 5.

### Placeholder scan
- No `TODO`, `TBD`, or vague placeholders remain.
- Every task includes exact file paths.
- Every code-writing step includes concrete content.
- Verification commands and expected outcomes are explicit.

### Type consistency
- The skill name is consistently `llm-wiki-ops` across tests, docs, and target path.
- The required rule files are consistently named `CLAUDE.md`, `prompts/ingest.md`, `prompts/query.md`, and `prompts/lint.md`.
- The safe-fix boundary language and ambiguity language are consistent between the tests and skill content.
