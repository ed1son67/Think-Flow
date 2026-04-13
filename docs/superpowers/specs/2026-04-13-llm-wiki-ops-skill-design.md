# LLM Wiki Ops Skill Design

## Goal

Design a single callable skill for Claude Code that lets the user operate this repository as an LLM Wiki through one entrypoint that can ingest documents, answer questions from the wiki, and run wiki health checks.

## User Intent

The user wants a skill they can invoke directly in the agent environment to perform the wiki’s three core workflows:

- ingest documents into the wiki
- query the wiki as the primary knowledge layer
- lint the wiki for structure and maintenance issues

The user explicitly prefers:

- one total-control skill instead of multiple small skills
- a first version that supports ingest, query, and lint
- a skill that works with the existing repository rules instead of redefining the wiki schema

## Recommended Approach

Build one orchestration skill named `llm-wiki-ops` that detects whether the user’s request is an ingest, query, or lint operation, then enforces the repository’s existing workflow rules by reading the correct repo-local control files before acting.

### Alternatives considered

#### Option A — One orchestration skill with explicit internal modes (recommended)
A single skill handles three internal modes: ingest, query, and lint.

**Pros**
- one invocation point for the user
- easy to remember and call
- keeps all mode detection and workflow enforcement in one place
- matches the user’s preference for a single total-control skill

**Cons**
- requires careful mode detection to avoid ambiguity
- the skill document must be written clearly to prevent workflow mixing

#### Option B — Separate skills per workflow
Use `wiki-ingest`, `wiki-query`, and `wiki-lint` as separate skills.

**Pros**
- simpler skill bodies
- lower risk of mode confusion

**Cons**
- worse user ergonomics
- contradicts the user’s stated preference for one control skill

#### Option C — One skill with freeform natural-language behavior only
A single skill tries to infer all behavior from the user’s prompt without explicit internal mode boundaries.

**Pros**
- most natural user phrasing

**Cons**
- highest ambiguity risk
- easiest way for the skill to drift or mix workflows
- hardest to keep reliable

### Decision

Use **Option A**: one total-control skill with three explicit internal modes.

## Skill Boundary

The skill is an orchestration layer, not a schema layer.

### The skill is responsible for
- identifying whether the user request is ingest, query, or lint
- reading the correct repo-local rules before acting
- enforcing the minimum execution order for the chosen mode
- producing structured, auditable output
- asking for clarification if the user intent is ambiguous

### The skill is not responsible for
- defining the wiki schema itself
- replacing `CLAUDE.md` or `prompts/*.md`
- implementing advanced parsing for PDFs, web ingestion, or embeddings
- acting as a generic knowledge-base skill outside repositories that match this pattern

## Repository Contract

The skill assumes it is operating inside a repository that already provides the LLM Wiki rules in these files:

- `CLAUDE.md`
- `prompts/ingest.md`
- `prompts/query.md`
- `prompts/lint.md`

The skill should refuse or stop for clarification if those files are missing or if the repository clearly does not match the LLM Wiki structure.

## Placement and Packaging

### Target location

For Claude Code, install the skill at:

```text
~/.claude/skills/llm-wiki-ops/SKILL.md
```

### v1 file structure

```text
~/.claude/skills/
└── llm-wiki-ops/
    └── SKILL.md
```

v1 should keep the skill self-contained in a single `SKILL.md`.

## Skill Frontmatter

Use:

```markdown
---
name: llm-wiki-ops
description: Use when working inside an LLM Wiki repository to ingest a source, answer questions from the wiki, or run a wiki health check.
---
```

### Frontmatter rationale
- `name` is valid for skill discovery
- `description` describes when to use the skill, not how it works
- the description includes the three triggering contexts without duplicating workflow logic

## Skill Structure

The skill document should contain these sections.

### 1. Overview
Explain that `llm-wiki-ops` is one entrypoint for three workflows:
- ingest
- query
- lint

State explicitly that the skill enforces repo-local rules rather than redefining them.

### 2. When to Use
List these trigger situations:
- the user wants to ingest a document into the wiki
- the user wants an answer based on the current wiki
- the user wants a lint or health check for the wiki

Also include when not to use it:
- non-LLM-Wiki repositories
- generic RAG tasks
- PDF/web ingestion workflows not yet supported by this repo

### 3. Mode Detection
Define conservative routing rules.

#### ingest mode
Trigger when the user provides a concrete file path or clearly asks to ingest/process a source into the wiki.

#### query mode
Trigger when the user asks a knowledge question that should be answered from the current wiki.

#### lint mode
Trigger when the user asks for linting, health checks, missing-link checks, orphan-page checks, or structure validation.

#### ambiguous mode
If the request could reasonably fit more than one mode, the skill must ask a clarifying question instead of guessing.

## Required Reads by Mode

### ingest mode
Must read:
- `CLAUDE.md`
- `prompts/ingest.md`

Then read the source document to ingest.

### query mode
Must read:
- `CLAUDE.md`
- `prompts/query.md`
- `wiki/index.md`

Then read the most relevant topic pages before source pages.

### lint mode
Must read:
- `CLAUDE.md`
- `prompts/lint.md`

Then inspect the relevant wiki pages and structure.

## Execution Contract

### Ingest mode contract
The skill must enforce this minimum sequence:
1. read `CLAUDE.md`
2. read `prompts/ingest.md`
3. read exactly one source file
4. create or update one source page under `wiki/sources/`
5. update one or more relevant topic pages under `wiki/topics/`
6. update `wiki/index.md`
7. append an ingest entry to `wiki/log.md`
8. move the raw source from `raw/inbox/` to `raw/processed/`
9. verify the resulting files exist and are linked

### Query mode contract
The skill must enforce this minimum sequence:
1. read `CLAUDE.md`
2. read `prompts/query.md`
3. read `wiki/index.md`
4. read relevant topic pages before source pages
5. answer the question while distinguishing established wiki conclusions from inference
6. create or suggest a synthesis page only when the output is likely to be reused

### Lint mode contract
The skill must enforce this minimum sequence:
1. read `CLAUDE.md`
2. read `prompts/lint.md`
3. inspect required structure and system pages
4. inspect content pages for frontmatter, emptiness, and index coverage
5. respect mode boundaries between `report` and `safe-fix`
6. avoid rewriting content-rich pages in v1 safe-fix mode

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
- the answer
- pages consulted
- evidence pages
- explicit distinction between established conclusion and inference
- whether a synthesis page was created

### lint output
Return:
- lint mode (`report` or `safe-fix`)
- missing structure
- metadata/frontmatter issues
- empty pages
- missing index coverage
- fixes applied

## Common Failure Modes the Skill Must Prevent

The skill must explicitly prevent these behaviors:
- skipping `wiki/index.md` during query
- writing topic pages during ingest without first creating/updating the source page
- forgetting `wiki/index.md` or `wiki/log.md` updates during ingest
- performing broad content rewrites during lint safe-fix mode
- guessing the mode when the request is ambiguous
- attempting to operate in repositories that do not match the expected LLM Wiki layout

## Invocation Examples

Examples the skill should be able to handle:

### ingest examples
- “Use llm-wiki-ops to ingest `raw/inbox/foo.md`.”
- “Process this source and update the wiki.”

### query examples
- “Use llm-wiki-ops to answer: why do source pages and topic pages stay separate?”
- “Based on the current wiki, summarize the core v1 design constraints.”

### lint examples
- “Use llm-wiki-ops to lint the wiki.”
- “Run a wiki health check in report mode only.”

## v1 Scope Limits

v1 intentionally excludes:
- PDF ingestion
- direct web ingestion
- embedding/vector infrastructure
- complex entity-page automation
- broad batch-import workflows
- using the skill outside repos that already define LLM Wiki conventions

## Testing Strategy

This skill should be tested with baseline failure scenarios and success scenarios.

### Baseline failures to observe without the skill
- ingest without updating `wiki/index.md` or `wiki/log.md`
- query without reading `wiki/index.md`
- query that jumps to raw sources before topic pages
- lint that gives an unstructured answer or overreaches in safe-fix mode

### Success scenarios with the skill
1. ingest a markdown file from `raw/inbox/` and verify source page, topic updates, index, log, and file move
2. answer a question from the wiki while citing consulted pages and separating conclusion from inference
3. run lint in report mode and verify structured findings
4. run lint in safe-fix mode and verify only allowed low-risk fixes occur

### Minimum acceptance prompts
- “Use llm-wiki-ops to ingest `raw/inbox/test.md`.”
- “Use llm-wiki-ops to answer: what are the core design constraints of this wiki?”
- “Use llm-wiki-ops to lint the current wiki in report mode.”

## Final Recommendation

Implement `llm-wiki-ops` as a single orchestration skill whose primary job is to force disciplined use of the repository’s existing ingest, query, and lint rules. This keeps the skill small, stable, and easy to invoke while letting the repository remain the source of truth for domain-specific wiki behavior.
