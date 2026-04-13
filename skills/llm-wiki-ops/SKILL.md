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
Always read `{{PROJECT_ROOT}}/skills/llm-wiki-ops/CLAUDE.md` first. Then follow the mode-specific minimum reads.
All paths in this skill are absolute paths anchored to `{{PROJECT_ROOT}}`.
Use injected absolute paths such as `{{PROJECT_ROOT}}/skills/llm-wiki-ops/CLAUDE.md` and `{{PROJECT_ROOT}}/wiki/index.md`.
- `{{PROJECT_ROOT}}/skills/llm-wiki-ops/CLAUDE.md`
- `{{PROJECT_ROOT}}/skills/llm-wiki-ops/prompts/ingest.md`
- `{{PROJECT_ROOT}}/skills/llm-wiki-ops/prompts/query.md`
- `{{PROJECT_ROOT}}/skills/llm-wiki-ops/prompts/lint.md`

The repo-local rules define the workspace-specific ingest, query, and lint behavior; this skill does not replace them.
If those files are missing, stop for clarification instead of continuing.

## Required Reads by Mode

### ingest
- `{{PROJECT_ROOT}}/skills/llm-wiki-ops/CLAUDE.md`
- `{{PROJECT_ROOT}}/skills/llm-wiki-ops/prompts/ingest.md`
- for file ingest: read the single source file from `{{PROJECT_ROOT}}/raw/inbox/`
- for inline ingest: first materialize the inline text into one new raw file under `{{PROJECT_ROOT}}/raw/inbox/`, then read that generated raw file as the single source

### query
- `{{PROJECT_ROOT}}/skills/llm-wiki-ops/CLAUDE.md`
- `{{PROJECT_ROOT}}/wiki/index.md`
- the most relevant topic pages
- relevant source pages only if topic pages are insufficient
- relevant query prompt scaffolds in `{{PROJECT_ROOT}}/skills/llm-wiki-ops/prompts/`, including `{{PROJECT_ROOT}}/skills/llm-wiki-ops/prompts/query.md`

### lint
- `{{PROJECT_ROOT}}/skills/llm-wiki-ops/CLAUDE.md`
- relevant prompt scaffolds in `{{PROJECT_ROOT}}/skills/llm-wiki-ops/prompts/`, including `{{PROJECT_ROOT}}/skills/llm-wiki-ops/prompts/lint.md`
- `{{PROJECT_ROOT}}/wiki/index.md`
- the pages needed to inspect the reported issue

## Inline Ingest Materialization Rules
- Raw file location: create exactly one new file under `{{PROJECT_ROOT}}/raw/inbox/`.
- Filename generation: use the current date prefix and a derived slug, such as `{{PROJECT_ROOT}}/raw/inbox/2026-04-13-inline-note.md`.
- If the content starts with a markdown heading like `# Title`, derive a slug from that heading.
- Otherwise use a generic fallback slug such as `inline-note`, `note`, or `capture`.
- If the generated filename already exists, append a numeric suffix instead of overwriting.
- For example, a second capture on 2026-04-13 could become `{{PROJECT_ROOT}}/raw/inbox/2026-04-13-inline-note-2.md`.
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
  1. Read `{{PROJECT_ROOT}}/skills/llm-wiki-ops/CLAUDE.md`.
  2. Read `{{PROJECT_ROOT}}/skills/llm-wiki-ops/prompts/ingest.md`.
  3. If the input is inline text, materialize the inline text into one new raw file under `{{PROJECT_ROOT}}/raw/inbox/`.
  4. Process exactly one source.
  5. Create or update one source page under `{{PROJECT_ROOT}}/wiki/sources/`.
  6. Update one or more relevant topic pages under `{{PROJECT_ROOT}}/wiki/topics/`.
  7. Update `{{PROJECT_ROOT}}/wiki/index.md`.
  8. Append an ingest entry to `{{PROJECT_ROOT}}/wiki/log.md`.
  9. Move the raw source from `{{PROJECT_ROOT}}/raw/inbox/` to `{{PROJECT_ROOT}}/raw/processed/`.
  10. Verify the resulting files exist and are linked.
- If mode detection is unclear, pause and ask for clarification.

## Invocation Examples
- Use `llm-wiki-ops` to ingest `{{PROJECT_ROOT}}/raw/inbox/foo.md`.
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
- **inline ingest**: also report the generated raw file path under `{{PROJECT_ROOT}}/raw/inbox/` and whether the content was preserved as markdown-like text or minimally wrapped as plain text.
- **query**: separate wiki-backed conclusions from inference, and cite which wiki pages were used.
- **lint**: report findings, severity, and whether any durable wiki content changed.

## Failure Boundaries
If the user asks to ingest inline text but does not actually provide enough content to write a source file, the skill must ask for the content instead of creating an empty raw file.
If the inline text cannot be written into `{{PROJECT_ROOT}}/raw/inbox/`, the skill must stop and must not proceed to wiki updates.
If raw-file creation succeeds but a later ingest step fails, the generated raw file should remain in place for retry and traceability.

## Common Mistakes
- Treating this skill as a general repo skill instead of a single entry point for ingest/query/lint
- Skipping `CLAUDE.md` or the relevant prompt scaffold
- Forgetting `{{PROJECT_ROOT}}/wiki/index.md` during query or lint work
- Acting on ambiguous instructions instead of asking a clarifying question
- Rewriting raw files or over-editing content-rich wiki pages
- Do not rewrite content-rich pages in v1 safe-fix mode.
- Failing to distinguish wiki conclusions from inference
- Forgetting that inline ingest must first create a raw file under `{{PROJECT_ROOT}}/raw/inbox/`
- Letting inline text bypass the raw evidence layer
- Overwriting an existing generated raw file instead of adding a numeric suffix
- Creating an empty raw file when the user did not provide enough inline content
- Overwriting an existing raw file instead of appending a numeric suffix to a generated filename
