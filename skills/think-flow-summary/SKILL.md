---
name: think-flow-summary
description: Use when summarizing the current Codex, Claude, or Cursor session into reusable knowledge for future Q&A, especially for "总结本次对话", session handoff, or knowledge capture. use through `/th:summary`
---

# Think Flow Summary

## Overview

Use this skill to summarize the current AI session into reusable knowledge, not just dump transcript text. First read the current session from local artifacts, then apply the shared summary prompt so the output preserves high-value conclusions, definitions, rationale, boundaries, evidence, and FAQ candidates. After that, persist the summary into `raw/inbox/` and immediately ingest it into the wiki.

## When to Use

- summarize the current Codex conversation in this workspace
- summarize the current Claude conversation in this workspace
- summarize the current Cursor conversation in this workspace when an agent transcript exists
- produce a reusable handoff or knowledge-Q&A summary from the current session
- capture the summary into Think Flow as a new raw note and ingest it into the wiki
- summarize a specific saved session file by absolute path

Do not use this skill for broad historical search across many unrelated sessions.

## Provider Routing

- `codex`: read `~/.codex/sessions/**/*.jsonl`
- `claude`: read `~/.claude/sessions/*.json` to find the current session id, then read `~/.claude/projects/**/<sessionId>.jsonl`
- `cursor`: read `~/.cursor/projects/<workspace-slug>/agent-transcripts/*/*.jsonl`
- skip developer prompts, tool-only wrappers, Cursor tool records, and Claude thinking blocks unless the user explicitly asks for them and you pass the matching flags

## Execution

1. Read the shared prompt scaffold at `{{PROJECT_ROOT}}/skills/think-flow-summary/prompts/session-summary.md`.
2. Read the current session transcript with the repo-local helper.
3. Produce a summary using the shared prompt, not a raw transcript dump.
4. Materialize the summary into exactly one new raw note under `{{PROJECT_ROOT}}/raw/inbox/`.
5. Continue the standard `/th:ingest` workflow for that raw note.

```bash
python3 {{PROJECT_ROOT}}/scripts/read_llm_conversation.py --tool codex --current --cwd {{PROJECT_ROOT}} --format json
```

```bash
python3 {{PROJECT_ROOT}}/scripts/read_llm_conversation.py --tool claude --current --cwd {{PROJECT_ROOT}} --format json
```

```bash
python3 {{PROJECT_ROOT}}/scripts/read_llm_conversation.py --tool cursor --current --cwd {{PROJECT_ROOT}} --format json
```

For a known artifact path, bypass auto detection:

```bash
python3 {{PROJECT_ROOT}}/scripts/read_llm_conversation.py --tool claude --source-file /absolute/path/to/session.jsonl --format json
```

Pick the tool that matches the current environment:

- Codex session -> `--tool codex`
- Claude Code session -> `--tool claude`
- Cursor agent transcript -> `--tool cursor`

Use `--include-tools` or `--include-thinking` only when the user explicitly asks for those non-dialogue details.

## Output Contract

- summarize the conversation as reusable knowledge for future Q&A and follow-up work
- report the resolved provider and source file when useful
- report the generated raw file path
- report that ingest was executed for that new raw note
- extract only the durable details: conclusions, definitions, rationale, boundaries, evidence, FAQ candidates, open questions
- avoid generic chronological recap unless the user explicitly asks for a timeline
- if auto detection finds no matching current session for the workspace, stop and surface the error instead of guessing another project

## Common Mistakes

- returning the raw transcript instead of a reusable knowledge summary
- skipping `skills/think-flow-summary/prompts/session-summary.md`
- stopping after on-screen summary instead of writing a raw note and ingesting it
- reading `~/.claude/transcripts/` first even when `~/.claude/projects/**/<sessionId>.jsonl` exists
- treating Codex `developer` payloads as user conversation
- including Claude or Cursor tool wrappers as if they were normal dialogue
- including Claude thinking blocks when the user only asked for the visible conversation
