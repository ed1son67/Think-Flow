# Learning Knowledge Wiki Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current topic-centered wiki implementation with a concept-centered learning knowledge architecture, including new page models, stronger source templates, regenerated navigation, semantic linting, updated skill rules, and migration of the existing repository content.

**Architecture:** Introduce a shared metadata layer for page parsing and rendering, then rebuild the operational scripts around the new `domain / concept / question / source / synthesis` model. Migrate repository content with an explicit script so the new rules become executable rather than remaining a doc-only convention.

**Tech Stack:** Python 3 scripts, unittest-based script tests, markdown frontmatter files, repo-local skill docs under `skills/think-flow/` plus root `CLAUDE.md`

---

## File Structure

### New files

- `scripts/wiki_model.py` — shared helpers for frontmatter parsing, page discovery, metadata access, slug-safe index rendering, and link extraction
- `scripts/migrate_learning_wiki.py` — migrates the existing wiki from `topics/` to `concepts/`, creates `domains/` and `questions/`, rewrites metadata, and regenerates navigation
- `tests/test_migrate_learning_wiki.py` — migration behavior and content preservation checks

### Modified files

- `scripts/new_source.py` — new source template with `concept_refs` and `question_refs`
- `scripts/update_index.py` — regenerate `wiki/index.md` from the new information model instead of only checking stem presence
- `scripts/lint_wiki.py` — structural + semantic lint for domains, concepts, questions, sources, syntheses
- `CLAUDE.md` — rewrite operational rules around concepts/questions/sources
- `skills/think-flow/SKILL.md` — rewrite mode contracts and examples around the new architecture
- `skills/think-flow/prompts/ingest.md` — concept-centered ingest instructions
- `skills/think-flow/prompts/query.md` — concept-first query instructions
- `skills/think-flow/prompts/lint.md` — semantic lint instructions
- `tests/test_new_source.py` — new source template assertions
- `tests/test_update_index.py` — index regeneration assertions
- `tests/test_lint_wiki.py` — structural and semantic lint assertions
- `tests/test_think_flow_skill.py` — skill contract assertions for concepts/questions/domains
- `wiki/index.md` — regenerated root entrypoint
- `wiki/log.md` — append migration entry
- `wiki/` content tree — creation of `domains/`, `concepts/`, `questions/` and migration of existing content

### Existing files intentionally left alone

- unrelated user changes already present in the worktree
- install/read-conversation skill work outside the wiki-architecture scope

## Task 1: Build Shared Wiki Model Helpers

**Files:**
- Create: `scripts/wiki_model.py`
- Modify: `scripts/new_source.py`
- Modify: `tests/test_new_source.py`

- [ ] **Step 1: Write the failing tests for the new source template shape**

```python
def test_creates_dated_source_page_with_concept_and_question_refs(self):
    result = subprocess.run(
        [
            'python3',
            'scripts/new_source.py',
            '--root', str(repo),
            '--date', '2026-04-16',
            '--title', 'React Fiber Notes',
            '--slug', 'react-fiber-notes',
            '--concept-ref', 'react-fiber',
            '--question-ref', 'what-is-react-fiber',
        ],
        ...
    )

    self.assertEqual(result.returncode, 0, result.stderr)
    text = created.read_text()
    self.assertIn('concept_refs:', text)
    self.assertIn('- react-fiber', text)
    self.assertIn('question_refs:', text)
    self.assertIn('- what-is-react-fiber', text)
    self.assertIn('# Claims', text)
    self.assertIn('# Linked Concepts', text)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest tests.test_new_source -v`
Expected: FAIL because `--concept-ref` and `--question-ref` are not accepted and the output template still uses `topic_refs`.

- [ ] **Step 3: Add a shared wiki model helper module**

Create `scripts/wiki_model.py` with focused parsing and discovery helpers:

```python
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import re


PAGE_DIRS = ('domains', 'concepts', 'questions', 'sources', 'syntheses')
WIKI_LINK_RE = re.compile(r'\[\[([^\]]+)\]\]')


@dataclass
class Page:
    path: Path
    page_type: str
    frontmatter: dict[str, object]
    body: str

    @property
    def slug(self) -> str:
        return self.path.stem

    @property
    def title(self) -> str:
        return str(self.frontmatter.get('title') or self.slug)
```

- [ ] **Step 4: Implement the new source template on top of the helper conventions**

Update `scripts/new_source.py` so the generated content matches the source-page spec:

```python
def build_content(title: str, date: str, concept_refs: list[str], question_refs: list[str]) -> str:
    concept_lines = '\n'.join(f'  - {ref}' for ref in concept_refs) or '  []'
    question_lines = '\n'.join(f'  - {ref}' for ref in question_refs) or '  []'
    return f"""---
id: {title.lower().replace(' ', '-')}
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
```

- [ ] **Step 5: Run tests to verify the new template passes**

Run: `python3 -m unittest tests.test_new_source -v`
Expected: PASS

## Task 2: Regenerate Index from the New Architecture

**Files:**
- Modify: `scripts/update_index.py`
- Modify: `tests/test_update_index.py`
- Reuse: `scripts/wiki_model.py`

- [ ] **Step 1: Write the failing tests for generated index sections**

Add a test that creates `domains/`, `concepts/`, `questions/`, `sources/`, `syntheses/` pages and expects `scripts/update_index.py` to rewrite `wiki/index.md`:

```python
def test_regenerates_index_from_domain_concept_question_source_pages(self):
    (repo / 'wiki' / 'domains').mkdir(parents=True)
    (repo / 'wiki' / 'concepts').mkdir(parents=True)
    (repo / 'wiki' / 'questions').mkdir(parents=True)
    (repo / 'wiki' / 'sources').mkdir(parents=True)
    (repo / 'wiki' / 'syntheses').mkdir(parents=True)

    write_page(repo / 'wiki' / 'domains' / 'frontend.md', title='Frontend', page_type='domain')
    write_page(repo / 'wiki' / 'concepts' / 'react-fiber.md', title='React Fiber', page_type='concept')
    write_page(repo / 'wiki' / 'questions' / 'what-is-react-fiber.md', title='What is React Fiber?', page_type='question')
    write_page(repo / 'wiki' / 'sources' / '2026-04-16-react-fiber-notes.md', title='React Fiber Notes', page_type='source')

    result = subprocess.run(['python3', 'scripts/update_index.py', '--root', str(repo)], ...)

    self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
    index_text = (repo / 'wiki' / 'index.md').read_text()
    self.assertIn('## Domains', index_text)
    self.assertIn('## Core Concepts', index_text)
    self.assertIn('## Question Entry Points', index_text)
    self.assertIn('## Recent Source Ingests', index_text)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest tests.test_update_index -v`
Expected: FAIL because the current script only checks stem coverage and does not regenerate `index.md`.

- [ ] **Step 3: Replace index checking with index generation**

Implement `scripts/update_index.py` as a deterministic generator:

```python
def render_index(root: Path) -> str:
    pages = load_pages(root)
    domains = [page for page in pages if page.page_type == 'domain']
    concepts = [page for page in pages if page.page_type == 'concept']
    questions = [page for page in pages if page.page_type == 'question']
    sources = sorted(
        [page for page in pages if page.page_type == 'source'],
        key=lambda page: str(page.frontmatter.get('updated', '')),
        reverse=True,
    )
    syntheses = [page for page in pages if page.page_type == 'synthesis']

    return '\n'.join([
        '# Index',
        '',
        '## Domains',
        *render_links(domains),
        '',
        '## Core Concepts',
        *render_links(concepts[:20]),
        '',
        '## Question Entry Points',
        *render_links(questions[:20]),
        '',
        '## Recent Source Ingests',
        *render_links(sources[:20]),
        '',
        '## Recent Syntheses',
        *render_links(syntheses[:20]),
        '',
        '## Knowledge Gaps',
        '- No curated gaps yet. Add missing concepts or unresolved questions here as lint surfaces them.',
        '',
    ])
```

- [ ] **Step 4: Make the script idempotent and success-oriented**

Use this main flow:

```python
target = root / 'wiki' / 'index.md'
rendered = render_index(root)
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(rendered)
print('index updated')
return 0
```

- [ ] **Step 5: Run tests to verify the new index behavior passes**

Run: `python3 -m unittest tests.test_update_index -v`
Expected: PASS

## Task 3: Rebuild Lint Around Structural and Semantic Checks

**Files:**
- Modify: `scripts/lint_wiki.py`
- Modify: `tests/test_lint_wiki.py`
- Reuse: `scripts/wiki_model.py`

- [ ] **Step 1: Write failing tests for semantic linting**

Add tests for these scenarios:

```python
def test_flags_concept_without_source_refs(self):
    write_page(
        repo / 'wiki' / 'concepts' / 'react-fiber.md',
        title='React Fiber',
        page_type='concept',
        extra_frontmatter='domain_refs: []\nquestion_refs: []\nsource_refs: []\nrelated_concepts: []\ncanonical: true\nmastery: seed\n',
    )
    result = subprocess.run(['python3', 'scripts/lint_wiki.py', '--root', str(repo), '--mode', 'report'], ...)
    self.assertIn('concept missing source evidence: wiki/concepts/react-fiber.md', result.stdout)


def test_flags_question_without_concept_refs(self):
    write_page(
        repo / 'wiki' / 'questions' / 'what-is-react-fiber.md',
        title='What is React Fiber?',
        page_type='question',
        extra_frontmatter='concept_refs: []\nsource_refs: []\nanswer_type: concept\ncanonical_question_for: ""\n',
    )
    result = subprocess.run(...)
    self.assertIn('question missing concept target: wiki/questions/what-is-react-fiber.md', result.stdout)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest tests.test_lint_wiki -v`
Expected: FAIL because current lint only checks frontmatter presence and flat index coverage.

- [ ] **Step 3: Expand required structure and semantic checks**

Implement lint helpers along these lines:

```python
def lint_semantics(pages: list[Page]) -> list[str]:
    issues: list[str] = []
    for page in pages:
        rel = page.path.relative_to(page.path.parents[1]).as_posix()
        if page.page_type == 'concept' and not page.frontmatter.get('source_refs'):
            issues.append(f'concept missing source evidence: {rel}')
        if page.page_type == 'question' and not page.frontmatter.get('concept_refs'):
            issues.append(f'question missing concept target: {rel}')
        if page.page_type == 'source' and not page.frontmatter.get('concept_refs'):
            issues.append(f'source missing concept linkage: {rel}')
    return issues
```

- [ ] **Step 4: Preserve safe-fix constraints while creating the new system files**

`safe-fix` should only create empty `index.md`, `log.md`, and the new wiki directories:

```python
for directory in ['domains', 'concepts', 'questions', 'sources', 'syntheses']:
    (root / 'wiki' / directory).mkdir(parents=True, exist_ok=True)
```

- [ ] **Step 5: Run tests to verify lint behavior passes**

Run: `python3 -m unittest tests.test_lint_wiki -v`
Expected: PASS

## Task 4: Rewrite Skill Rules and Prompts Around Concepts

**Files:**
- Modify: `CLAUDE.md`
- Modify: `skills/think-flow/SKILL.md`
- Modify: `skills/think-flow/prompts/ingest.md`
- Modify: `skills/think-flow/prompts/query.md`
- Modify: `skills/think-flow/prompts/lint.md`
- Modify: `tests/test_think_flow_skill.py`

- [ ] **Step 1: Write failing skill-contract tests for the new architecture terms**

Add assertions like:

```python
self.assertIn('{{PROJECT_ROOT}}/wiki/domains/', self.claude_text)
self.assertIn('{{PROJECT_ROOT}}/wiki/concepts/', self.claude_text)
self.assertIn('{{PROJECT_ROOT}}/wiki/questions/', self.claude_text)
self.assertIn('Concept pages are the canonical long-term knowledge asset', self.skill_text)
self.assertIn('Read relevant concept pages first', self.skill_text)
self.assertIn('Create a question page only if the material expresses a reusable question framing.', self.claude_text)
self.assertNotIn('{{PROJECT_ROOT}}/wiki/topics/', self.skill_text)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python3 -m unittest tests.test_think_flow_skill -v`
Expected: FAIL because the current skill still routes through `topics/`.

- [ ] **Step 3: Rewrite the operational rules**

Update `CLAUDE.md` with the new repository layout:

```markdown
- `{{PROJECT_ROOT}}/wiki/domains/`: navigation pages for top-level subject areas
- `{{PROJECT_ROOT}}/wiki/concepts/`: canonical knowledge pages
- `{{PROJECT_ROOT}}/wiki/questions/`: reusable question entry pages
- `{{PROJECT_ROOT}}/wiki/sources/`: strong evidence pages
- `{{PROJECT_ROOT}}/wiki/syntheses/`: reusable cross-source analysis pages
```

Update ingest/query rules to prefer:

```markdown
- Prefer updating an existing concept page over creating a new concept.
- Create a question page only when the question framing is reusable.
- Read concept pages before source pages during query.
```

- [ ] **Step 4: Rewrite the skill examples and prompt scaffolds**

Revise the prompts so they mention `concepts`, `questions`, and `domains` instead of `topics`, and make query/lint examples reflect the new structure.

- [ ] **Step 5: Run tests to verify the skill docs pass**

Run: `python3 -m unittest tests.test_think_flow_skill -v`
Expected: PASS

## Task 5: Migrate Existing Wiki Content and Verify End-to-End

**Files:**
- Create: `scripts/migrate_learning_wiki.py`
- Create: `tests/test_migrate_learning_wiki.py`
- Modify: `wiki/index.md`
- Modify: `wiki/log.md`
- Modify: `wiki/` content tree

- [ ] **Step 1: Write the failing migration tests**

Add tests covering:

```python
def test_migration_moves_topics_to_concepts_and_creates_new_dirs(self):
    (repo / 'wiki' / 'topics').mkdir(parents=True)
    (repo / 'wiki' / 'topics' / 'react-fiber.md').write_text(existing_topic_text)

    result = subprocess.run(['python3', 'scripts/migrate_learning_wiki.py', '--root', str(repo)], ...)

    self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
    self.assertTrue((repo / 'wiki' / 'concepts' / 'react-fiber.md').exists())
    self.assertTrue((repo / 'wiki' / 'domains').exists())
    self.assertTrue((repo / 'wiki' / 'questions').exists())
    self.assertFalse((repo / 'wiki' / 'topics' / 'react-fiber.md').exists())
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest tests.test_migrate_learning_wiki -v`
Expected: FAIL because the migration script does not exist.

- [ ] **Step 3: Implement the migration script**

Core migration flow:

```python
def migrate(root: Path) -> list[str]:
    actions: list[str] = []
    wiki = root / 'wiki'
    for directory in ['domains', 'concepts', 'questions', 'sources', 'syntheses']:
        (wiki / directory).mkdir(parents=True, exist_ok=True)

    for topic in sorted((wiki / 'topics').glob('*.md')):
        target = wiki / 'concepts' / topic.name
        text = topic.read_text()
        text = text.replace('type: topic', 'type: concept')
        text = text.replace('topic_refs:', 'question_refs:')
        text = text.replace('# Current View', '# Definition')
        target.write_text(text)
        topic.unlink()
        actions.append(f'migrated topic to concept: {topic.name}')
```

- [ ] **Step 4: Run migration on the real repository and regenerate navigation**

Run:

```bash
python3 scripts/migrate_learning_wiki.py --root /Users/zifeng.chen/bb/think-flow
python3 scripts/update_index.py --root /Users/zifeng.chen/bb/think-flow
python3 scripts/lint_wiki.py --root /Users/zifeng.chen/bb/think-flow --mode report
```

Expected:

- `wiki/concepts/` contains migrated concept pages
- `wiki/domains/` and `wiki/questions/` exist
- `wiki/index.md` is regenerated with the new sections
- lint output reflects remaining semantic gaps rather than old `topics` structure

- [ ] **Step 5: Run the full relevant test suite**

Run:

```bash
python3 -m unittest \
  tests.test_new_source \
  tests.test_update_index \
  tests.test_lint_wiki \
  tests.test_think_flow_skill \
  tests.test_migrate_learning_wiki \
  -v
```

Expected: PASS

## Final Verification

- [ ] Run `python3 -m unittest tests.test_new_source tests.test_update_index tests.test_lint_wiki tests.test_think_flow_skill tests.test_migrate_learning_wiki -v`
- [ ] Run `python3 scripts/update_index.py --root /Users/zifeng.chen/bb/think-flow`
- [ ] Run `python3 scripts/lint_wiki.py --root /Users/zifeng.chen/bb/think-flow --mode report`
- [ ] Inspect `wiki/index.md`, one migrated concept page, one source page, and the updated skill docs

## Notes for Execution

- Do not touch unrelated dirty worktree changes.
- Keep diffs narrowly scoped to the new information architecture.
- If migration quality is uneven, preserve content and metadata first; refinement of specific concept prose can happen after the architecture lands.
