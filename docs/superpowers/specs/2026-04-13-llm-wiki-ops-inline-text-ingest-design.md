# LLM Wiki Ops Inline Text Ingest Design

## Goal

Extend `llm-wiki-ops` so ingest mode can accept inline text in addition to file paths, while preserving the repository’s existing raw-evidence-first ingest workflow.

## User Intent

The user wants to be able to paste a short note or a multi-line block of text directly into the skill and have it enter the wiki through the same ingest pipeline as file-based sources.

The user explicitly prefers:

- support for both single-line and multi-line inline text input
- automatic file naming rather than requiring a title or filename
- smart raw-content handling: markdown-like text should stay mostly unchanged, while plain text can be lightly wrapped
- reusing the current ingest contract rather than creating a new top-level workflow

## Recommended Approach

Extend the existing `ingest` mode with a second input path:

- **file ingest** when the user supplies a concrete `raw/inbox/` file path
- **inline ingest** when the user supplies text directly in the request

For inline ingest, the skill should first materialize the provided text into a new raw file under `raw/inbox/`, then continue with the normal ingest workflow using that new raw file as the evidence source.

### Alternatives considered

#### Option A — Extend ingest with an inline-text subpath (recommended)
A single `ingest` mode supports either file-path input or inline-text input.

**Pros**
- minimal change to the existing skill model
- preserves the current raw → wiki layering
- best user experience for both short and long pasted text
- keeps all ingest rules in one place

**Cons**
- mode detection must distinguish file-path ingest from inline-text ingest carefully
- skill contract and examples must expand to cover the new branch clearly

#### Option B — Require the agent to create a raw file first, then call normal ingest
The skill refuses inline text and instructs the agent or user to create a raw file manually before ingestion.

**Pros**
- simpler skill wording
- fully explicit raw-file creation step

**Cons**
- worse user experience
- does not satisfy the request for direct inline-text ingest
- adds friction without adding meaningful architectural value

#### Option C — Split ingest into separate top-level modes
The skill introduces distinct internal modes for file-ingest and inline-ingest.

**Pros**
- very explicit branching
- easier to describe each path independently

**Cons**
- adds conceptual complexity to a skill that should stay small
- weakens the existing three-mode framing of ingest/query/lint

### Decision

Use **Option A**: keep one `ingest` mode and add an inline-text subpath that materializes the text into `raw/inbox/` before continuing.

## Scope and Boundaries

### In scope
- support single-line inline text ingest requests
- support multi-line inline text ingest requests
- auto-create a raw markdown file in `raw/inbox/`
- infer a filename from a markdown heading when available, otherwise use a generic fallback slug
- avoid overwriting existing raw files by adding a numeric suffix on collision
- preserve markdown-like content as closely as possible
- lightly wrap plain text into markdown when needed
- continue the existing ingest workflow after raw-file creation
- document the new behavior in the skill and validate it through repo-local contract tests

### Out of scope
- changing query or lint behavior
- adding a new top-level skill mode
- adding a new helper script or parser in v1 of this extension
- advanced markdown parsing or normalization
- PDF, web, or attachment-based inline ingest
- user-specified filenames or titles in this iteration

## Mode Detection Updates

The skill should continue to route conservatively.

### file ingest
Use file ingest when the user clearly provides a concrete file path under `raw/inbox/`.

### inline ingest
Use inline ingest when the user clearly asks to ingest/process/store a body of text directly into the wiki.

The skill should support both:
- short single-line text
- multi-line pasted markdown or prose

### ambiguity guardrail
If the request contains both a file path and a separate pasted body of text, or if it could reasonably be interpreted as either ingest or query, the skill must stop and ask a clarifying question instead of guessing.

## Inline Ingest Materialization Rules

### Raw file location
Inline text must first be written to a new file under:

```text
raw/inbox/
```

The text must not bypass the raw evidence layer.

### Filename generation
The skill should generate a filename automatically.

Preferred strategy:
1. If the content starts with a markdown heading like `# Title`, derive a slug from that heading.
2. Otherwise use a generic fallback slug such as `inline-note`, `note`, or `capture`.
3. Prefix the filename with the current date.
4. If the generated filename already exists, append a numeric suffix instead of overwriting.

Examples:

```text
raw/inbox/2026-04-13-project-constraints.md
raw/inbox/2026-04-13-inline-note.md
raw/inbox/2026-04-13-inline-note-2.md
```

### Content preservation strategy
Use a lightweight smart decision:

- if the text appears to already be markdown, preserve it as closely as possible
- if the text appears to be plain text, wrap it minimally into markdown

The raw layer should remain evidence, not a synthesized layer.

### Markdown-like detection
v1 should use conservative heuristics rather than deep parsing. Treat the input as markdown-like if one or more clear signals are present, such as:

- leading markdown headings like `# ` or `## `
- list markers like `- ` or `1. `
- fenced code blocks
- obvious markdown links or emphasis

If those signals are absent, treat the text as plain text.

### Plain-text wrapping
For plain text, the skill may lightly wrap the content into markdown using a minimal title, for example:

```markdown
# Untitled Note

<original text>
```

Do not add complex metadata or summary content at the raw layer.

## Execution Contract Update

### Existing ingest contract remains authoritative
The current ingest workflow remains the core contract:
1. read `CLAUDE.md`
2. read `prompts/ingest.md`
3. process exactly one source
4. create or update one source page under `wiki/sources/`
5. update one or more relevant topic pages under `wiki/topics/`
6. update `wiki/index.md`
7. append an ingest entry to `wiki/log.md`
8. move the raw source from `raw/inbox/` to `raw/processed/`
9. verify the resulting files exist and are linked

### Additional inline-ingest pre-step
For inline ingest only, prepend one step before the normal ingest sequence:

1. materialize the inline text into one new raw file under `raw/inbox/`

Then continue with the existing ingest contract unchanged.

## Failure Handling

### Missing inline body
If the user asks to ingest inline text but does not actually provide enough content to write a source file, the skill must ask for the content instead of creating an empty raw file.

### Filename conflicts
If the preferred generated filename already exists, the skill must create a suffixed filename instead of overwriting the existing raw file.

### Raw-file creation failure
If the inline text cannot be written into `raw/inbox/`, the skill must stop and must not proceed to wiki updates.

### Downstream ingest failure
If raw-file creation succeeds but a later ingest step fails, the generated raw file should remain in place for retry and traceability.

## Output Contract Update

For inline ingest, the skill output should additionally report:

- the generated raw file path under `raw/inbox/`
- whether the input was preserved as markdown-like content or minimally wrapped as plain text
- the normal ingest outputs already required by the base skill contract

## Invocation Examples

Examples the updated skill should support:

### single-line inline ingest
- `Use llm-wiki-ops to ingest this text: We should keep source pages separate from topic pages because sources are evidence and topics are synthesis.`

### multi-line inline ingest
- `Use llm-wiki-ops to ingest this text:` followed by a multi-line markdown block
- `Use llm-wiki-ops to process this note into the wiki:` followed by multiple paragraphs

### file ingest remains valid
- `Use llm-wiki-ops to ingest raw/inbox/foo.md.`

## Testing Strategy

This extension should stay lightweight and focus on skill-contract validation.

### Contract test updates
Add repo-local tests that verify the skill document now describes:
- both file-based and inline-text ingest inputs
- the requirement to materialize inline text into `raw/inbox/`
- automatic filename generation
- markdown-like vs plain-text handling
- collision-safe file creation
- ambiguity handling when both file paths and inline text appear together

### Example coverage
Add assertions that the skill includes at least one single-line inline-text example and one multi-line inline-text example.

### Non-goals for this iteration
Do not add a new parser, CLI helper, or end-to-end execution harness just for this extension.

## Final Recommendation

Extend `llm-wiki-ops` by adding a narrow inline-text ingest entry path inside the existing `ingest` mode. The skill should always materialize inline text into `raw/inbox/` first, then reuse the current ingest workflow unchanged. This preserves the repository’s raw-evidence contract while giving the user a much more direct way to capture notes into the wiki.
