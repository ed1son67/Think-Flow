# Think Flow

Think Flow is a local-first knowledge workflow for LLM agents. It combines a stable Markdown repository layout, repo-level operating rules, and a few helper scripts so an agent can turn raw materials into a persistent wiki instead of answering from scratch every time.

The core model is:

- `raw/` stores immutable source material
- `wiki/` stores synthesized, maintained knowledge pages
- `CLAUDE.md`, `AGENTS.md`, and `skills/` define the operating contract
- `scripts/` provide lightweight local utilities

## What It Is For

- Building a personal or team knowledge base over time
- Ingesting articles, notes, transcripts, and research material
- Turning repeated AI conversations into reusable long-term knowledge
- Using Obsidian as the browsing layer while the agent maintains the wiki

## Repository Layout

```text
think-flow/
├── raw/                  # Raw evidence layer
├── wiki/                 # Generated and maintained wiki pages
├── scripts/              # Local helper scripts
├── skills/               # Think Flow skill definitions
├── tests/                # Regression tests
├── CLAUDE.md             # Repo-local workflow rules
├── AGENTS.md             # Codex / OMX operating rules
└── LLM-WIKI.md           # Concept and architecture background
```

Important paths:

- `raw/inbox/`: incoming source material
- `raw/processed/`: archived processed sources
- `raw/assets/`: attachments for raw sources
- `wiki/sources/`: per-source summary pages
- `wiki/topics/`: durable topic synthesis pages
- `wiki/syntheses/`: high-value query outputs
- `wiki/index.md`: content index
- `wiki/log.md`: chronological operation log

## Core Workflows

### 1. Ingest

Add a source or inline note into the wiki workflow:

- read one source from `raw/inbox/`, or materialize inline text into `raw/inbox/`
- create or update a page in `wiki/sources/`
- update one or more relevant topic pages
- update `wiki/index.md` and `wiki/log.md`
- move processed raw material into `raw/processed/`

### 2. Query

Answer questions from the maintained wiki instead of re-scanning raw sources every time:

- start from `wiki/index.md`
- prefer topic pages before source pages
- separate wiki-backed conclusions from model inference
- optionally persist high-value answers into `wiki/syntheses/`

### 3. Lint

Check structural wiki health:

- missing `index.md` or `log.md`
- missing frontmatter
- missing index coverage
- empty pages

### 4. Summary

Read the current Claude / Codex / Cursor session and turn it into reusable knowledge, then ingest it into the wiki.

## Requirements

To use the local scripts, you typically only need:

- Python 3.9+
- Git
- An LLM agent environment that follows repo rules, such as Claude Code, Cursor, or Codex

Optional tools:

- `pytest` for tests
- Obsidian for browsing the wiki

## Installation

### 1. Clone the repository

```bash
git clone <your-repo-url> think-flow
cd think-flow
```

### 2. Prepare Python

A virtual environment is optional but recommended:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

There are no mandatory runtime dependencies for the scripts in this repo. Install `pytest` only if you want to run tests:

```bash
python3 -m pip install pytest
```

### 3. Install the Think Flow skills

The repository includes an installer that copies the skill directories and renders `{{PROJECT_ROOT}}` into the absolute path of your local checkout.

Install all skills:

```bash
python3 scripts/install_skill.py \
  --project-root "$(pwd)" \
  --target-root "$HOME/.claude/skills"
```

Install one specific skill:

```bash
python3 scripts/install_skill.py \
  --source "$(pwd)/skills/think-flow" \
  --project-root "$(pwd)" \
  --target-root "$HOME/.claude/skills"
```

The default target is `~/.claude/skills`, so this path is most useful for Claude Code. Cursor command templates are already included under `.cursor/commands/`, and Codex reads this repository through `AGENTS.md` plus the local `skills/` definitions.

## How To Use

### Option 1: Use the agent command workflow

This is the recommended path. The repo defines these Think Flow command surfaces:

- `/th:ingest`
- `/th:query`
- `/th:lint`
- `/th:summary`

Examples:

```text
/th:ingest raw/inbox/my-article.md
/th:ingest This is an inline note I want to preserve in the wiki
/th:query What does the current wiki conclude about agent framework selection?
/th:lint
/th:summary
```

Workflow rules:

- new evidence should enter through `raw/`
- `raw/` is the evidence layer and should not be rewritten
- query work should be grounded in `wiki/`, not chat history alone
- durable outputs should be written back into the wiki

### Option 2: Run the local scripts directly

Useful for debugging, verification, and batch operations.

#### Install skills

```bash
python3 scripts/install_skill.py --project-root "$(pwd)"
```

#### Check index coverage

This script checks whether pages under `wiki/sources/`, `wiki/topics/`, and `wiki/syntheses/` are all represented in `wiki/index.md`.

```bash
python3 scripts/update_index.py --root "$(pwd)"
```

#### Run wiki lint

Report-only mode:

```bash
python3 scripts/lint_wiki.py --root "$(pwd)" --mode report
```

Create missing system files safely, then lint:

```bash
python3 scripts/lint_wiki.py --root "$(pwd)" --mode safe-fix
```

#### Create a source-page scaffold

```bash
python3 scripts/new_source.py \
  --root "$(pwd)" \
  --date 2026-04-16 \
  --title "Example Source" \
  --slug example-source
```

#### Read the current AI session artifact

Codex:

```bash
python3 scripts/read_llm_conversation.py \
  --tool codex \
  --current \
  --cwd "$(pwd)" \
  --format json
```

Claude:

```bash
python3 scripts/read_llm_conversation.py \
  --tool claude \
  --current \
  --cwd "$(pwd)" \
  --format json
```

Cursor:

```bash
python3 scripts/read_llm_conversation.py \
  --tool cursor \
  --current \
  --cwd "$(pwd)" \
  --format json
```

## Recommended Daily Flow

### Knowledge capture

1. Drop a source into `raw/inbox/`.
2. Run `/th:ingest` for exactly one source.
3. Review `wiki/index.md`, topic pages, and graph links in Obsidian.
4. Ask cross-source questions with `/th:query`.
5. Run `/th:lint` periodically.

### Conversation capture

1. Finish a useful working session in Claude, Codex, or Cursor.
2. Run `/th:summary`.
3. Let the conversation summary land in `raw/inbox/`.
4. Let the normal ingest flow persist it into the wiki.

## Design Principles

- Local-first: knowledge stays in local Markdown files
- Evidence first: `raw/` is evidence, `wiki/` is synthesis
- Incremental synthesis: knowledge compounds over time
- Agent-maintained: the agent handles cross-linking and upkeep
- Human-guided: humans choose sources, priorities, and interpretation

## Testing

Run the full test suite with:

```bash
python3 -m pytest -q
```

If `pytest` is not installed yet:

```bash
python3 -m pip install pytest
```

## Related Files

- [LLM-WIKI.md](./LLM-WIKI.md): concept and motivation
- [CLAUDE.md](./CLAUDE.md): repo-local Think Flow rules
- [skills/think-flow/SKILL.md](./skills/think-flow/SKILL.md): core Think Flow skill
- [skills/think-flow-summary/SKILL.md](./skills/think-flow-summary/SKILL.md): session-summary skill
