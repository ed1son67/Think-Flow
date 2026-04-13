# LLM Wiki v1 Design

## Goal

Design a feasible v1 for a personal, local-first LLM-maintained wiki inspired by `llm-wiki.md`, optimized for:

- single-user operation
- markdown/txt sources only
- semi-automated workflows
- a full ingest / query / lint loop
- a conservative page strategy with relatively few, high-value pages

## Scope

### In scope
- Local repository structure for raw sources and wiki pages
- A schema/workflow file (`CLAUDE.md`) that constrains wiki maintenance behavior
- Three core workflows: ingest, query, lint
- A small set of durable page types
- Indexing and logging conventions
- A low-complexity path to future tooling

### Out of scope for v1
- PDF parsing
- direct web ingestion
- vector databases / embeddings infrastructure
- multi-user collaboration or approval workflows
- standalone web application / product shell
- aggressive entity extraction or dense graph generation
- large-scale batch automation

## Recommended Approach

Use a **markdown-first local workflow** as the v1 implementation model, but define boundaries so a lightweight CLI/tooling layer can be added later without changing the core information architecture.

### Alternatives considered

#### Option A — Markdown-first local workflow (recommended)
Use local directories, Obsidian, Git, and Claude Code directly. Knowledge is stored as markdown pages with explicit conventions and lightweight operational prompts.

**Pros**
- Fastest to make real
- Matches the intent of `llm-wiki.md`
- Keeps all assets portable and inspectable
- Works well with semi-automated human-in-the-loop maintenance

**Cons**
- Relies on disciplined prompts/conventions
- Limited automation at first
- Search quality depends on index quality until dedicated search is added

#### Option B — Local CLI-centered workflow
Add a thin command layer around ingest/query/lint from the start.

**Pros**
- More consistent operator experience
- Easier to add validation and repetitive automation
- Good stepping stone to richer tooling

**Cons**
- More engineering work up front
- Risks spending too early on tooling instead of knowledge operations

#### Option C — Productized app/service
Build a dedicated application with backend state and custom UI.

**Pros**
- Strongest long-term extensibility
- Better eventual fit for collaboration

**Cons**
- Overbuilt for current goal
- Delays validation of the core hypothesis

### Decision
Start with **Option A**, but define the repo, metadata, and workflow boundaries as if **Option B** may be added later.

## Architecture

The system has three layers.

### 1. Raw sources
Immutable source documents stored locally. This layer is the evidence base.

Responsibilities:
- preserve original context
- provide auditable inputs for synthesis
- remain separate from generated knowledge artifacts

### 2. Wiki
LLM-maintained markdown pages that synthesize, organize, and cross-reference knowledge.

Responsibilities:
- create reusable summaries and topic pages
- accumulate analysis over time
- maintain navigable links and consistency

### 3. Schema / workflow
A rules document (`CLAUDE.md`) that tells the LLM how to maintain the wiki.

Responsibilities:
- define page types and directory conventions
- constrain ingest/query/lint behavior
- encode update discipline and writing rules
- reduce drift toward ad hoc chat-style output

## Repository Structure

```text
think-flow/
├── raw/
│   ├── inbox/
│   ├── processed/
│   └── assets/
│
├── wiki/
│   ├── sources/
│   ├── topics/
│   ├── concepts/         # optional in v1; may remain empty initially
│   ├── syntheses/
│   ├── index.md
│   └── log.md
│
├── prompts/
│   ├── ingest.md
│   ├── query.md
│   └── lint.md
│
├── scripts/
└── CLAUDE.md
```

### Design rationale
- `raw/` and `wiki/` stay strictly separated so evidence and synthesis are never conflated.
- `wiki/sources/` acts as the stable summary layer between raw documents and higher-level topic pages.
- `wiki/topics/` is the primary long-lived synthesis layer for v1.
- `wiki/syntheses/` captures high-value answers and analyses that emerge during querying.
- `prompts/` and `CLAUDE.md` together define operational discipline.

## Page Strategy

v1 should use a **few durable page types** and avoid over-fragmentation.

### Page type 1: source pages
One page per ingested source.

Purpose:
- summarize a source in reusable form
- expose key claims/facts/questions
- serve as the citation anchor for higher-level pages

### Page type 2: topic pages
Long-lived synthesis pages for stable themes.

Purpose:
- maintain the current view on a topic
- aggregate support across multiple sources
- track tensions, trade-offs, and unresolved questions

### Page type 3: synthesis pages
Stored outputs from high-value queries.

Purpose:
- preserve nontrivial analysis that would otherwise disappear into chat history
- turn question-driven exploration into reusable knowledge artifacts
- optionally feed improvements back into topic pages

### Page type 4: system pages
`index.md` and `log.md`.

Purpose:
- `index.md` is the navigational catalog
- `log.md` is the append-only chronology of operations

## Core Workflows

### Ingest workflow

**Goal:** convert one new raw source into reusable wiki knowledge.

**Input:** one markdown/txt document in `raw/inbox/`

**Output:**
- one source page
- updates to 1–3 topic pages where appropriate
- updated `wiki/index.md`
- appended `wiki/log.md` entry
- source moved from `raw/inbox/` to `raw/processed/`

**Steps**
1. Read the raw source fully.
2. Extract themes, claims, facts/examples, conclusions, open questions, and candidate topic mappings.
3. Write a source page in `wiki/sources/`.
4. Prefer updating existing topics over creating new ones.
5. Create a new topic only if the source introduces a durable concept likely to recur.
6. Update `index.md` and append to `log.md`.
7. Move the raw file to `processed/`.

**Operational rule:** v1 favors conservative page creation. The wiki should stay small enough to remain legible and maintainable.

### Query workflow

**Goal:** answer using the wiki first, not by rediscovering raw-document structure every time.

**Input:** a user question

**Output:**
- a cited answer based on wiki pages
- optionally a new synthesis page
- optionally small topic page improvements discovered during answering

**Steps**
1. Read `wiki/index.md` first.
2. Read the most relevant topic pages.
3. Read source pages only when deeper evidence is needed.
4. Produce an answer that distinguishes current wiki conclusions from inference.
5. If the answer is broadly reusable, save it as a synthesis page.
6. If answering exposes missing links or missing topic structure, update the wiki.

**Promotion rule for synthesis pages:** save the answer when it requires cross-source reasoning, is likely to recur, or creates a reusable decision rule or framework.

### Lint workflow

**Goal:** keep the wiki healthy as it grows.

**Input:** the wiki directory

**Output:**
- a lint report
- optional low-risk fixes
- appended `wiki/log.md` entry

**Checks**
- orphan pages
- missing cross-links
- overlapping/duplicate topics
- stale conclusions superseded by newer sources
- unresolved questions that have been left hanging too long
- index drift

**Modes**
- `report`: diagnose only
- `safe-fix`: make low-risk repairs such as index corrections, missing links, and metadata cleanup

**Principle:** lint is a knowledge-structure health check, not just a formatting pass.

## Metadata and Templates

All wiki pages should use a small common frontmatter shape:

```yaml
---
title: ...
type: source | topic | synthesis
status: active | draft | superseded
created: 2026-04-13
updated: 2026-04-13
tags: []
source_refs: []
topic_refs: []
---
```

### Metadata rules
- Keep metadata minimal and durable.
- Only track fields the system will actually maintain.
- Prefer deriving incidental data from content rather than storing everything in frontmatter.

### Source page template
Recommended sections:
- Summary
- Core Ideas
- Key Details
- Reusable Insights
- Open Questions
- Related Topics

### Topic page template
Recommended sections:
- Current View
- Key Points
- Supporting Evidence
- Tensions / Trade-offs
- Open Questions
- Related Pages

### Synthesis page template
Recommended sections:
- Question
- Short Answer
- Analysis
- Implications for This Wiki
- Follow-ups

## Index and Log Format

### `wiki/index.md`
Content-oriented entry page organized by page type.

Properties:
- grouped by Topics / Sources / Syntheses
- one-line description per page
- readable by both humans and the LLM
- used as the first stop during querying

### `wiki/log.md`
Chronological append-only operations log.

Properties:
- one entry per ingest/query/lint operation
- stable heading prefix format for grep/scriptability
- captures what changed and why it mattered

Recommended heading style:

```markdown
## [YYYY-MM-DD] ingest | Title
## [YYYY-MM-DD] query | Question
## [YYYY-MM-DD] lint | label
```

## Naming Conventions

### Source pages
`YYYY-MM-DD-short-slug.md`

Reason: preserves ingest chronology and makes provenance obvious.

### Topic pages
`kebab-case-topic-name.md`

Reason: stable, human-readable names for long-lived synthesis pages.

### Synthesis pages
`question-or-decision-slug.md`

Reason: makes the page reusable as a recorded answer or decision artifact.

## `CLAUDE.md` Requirements

The schema/workflow file should define:

1. Page responsibilities for raw/source/topic/synthesis layers
2. Ingest rules:
   - process one inbox item at a time
   - write source page before topic updates
   - prefer updating existing topics
   - always update `index.md` and `log.md`
3. Query rules:
   - start from `index.md`
   - answer from wiki first
   - distinguish conclusion vs inference
   - suggest saving high-value results as synthesis pages
4. Lint rules:
   - check structure, links, drift, duplication, and staleness
   - default to report mode unless safe-fix is requested
5. Writing rules:
   - concise pages
   - explicit conclusions and open questions
   - no dumping long source excerpts into the wiki
   - link to existing pages whenever relevant

## Minimal Tooling Plan

v1 may optionally include three very small helper scripts.

### `scripts/new-source`
Create a source page filename and starter template.

### `scripts/update-index`
Assist in checking whether new pages are represented in `wiki/index.md`.

### `scripts/lint-wiki`
Perform basic structural checks such as missing index entries, missing frontmatter fields, or empty pages.

These scripts are helpers only. They do not replace the LLM-maintained workflow.

## Operational Commands

The operator experience should converge on three command classes.

### Ingest command pattern
Examples:
- “处理 `raw/inbox/x.md`”
- “重点关注这篇对 agent memory 的定义”

Expected result:
- source page written
- topics updated
- index/log updated
- raw file moved to processed

### Query command pattern
Examples:
- “根据当前 wiki，解释为什么 source 和 topic 要分层”
- “把当前关于 X 的结论整理成对比表”

Expected result:
- answer from wiki with citations
- optional synthesis page
- optional small wiki improvements

### Lint command pattern
Examples:
- “给 wiki 做一次 lint”
- “只报告，不改”
- “做 safe-fix”

Expected result:
- health check report
- optional low-risk structural repairs

## Phased Rollout

### Phase 1 — Close the loop
- create the directory structure
- write `CLAUDE.md`
- establish stable ingest/query/lint behavior

### Phase 2 — Improve consistency
- add templates
- add minimal scripts
- refine page-creation rules and naming/log conventions

### Phase 3 — Improve search
- add local search such as `qmd` only when index-first retrieval becomes limiting
- keep the markdown repo as the source of truth

### Phase 4 — Add advanced capabilities
- PDF/web support
- batch ingest
- richer metadata / Dataview support
- collaboration or review flows

## Risks and Mitigations

### Risk: page sprawl
If every concept becomes its own page too early, maintenance cost rises and retrieval quality drops.

**Mitigation:** prefer topic consolidation in v1; only create new topics for recurring, durable themes.

### Risk: chat answers do not compound
If useful query outputs remain in conversation only, the wiki stops accumulating value.

**Mitigation:** explicitly promote reusable answers into synthesis pages.

### Risk: source traceability weakens
If topic pages absorb details without stable source anchors, provenance becomes fuzzy.

**Mitigation:** source pages are mandatory and should be the main citation layer.

### Risk: maintenance discipline drifts
Without a strong schema/workflow file, the system degrades into ad hoc markdown editing.

**Mitigation:** centralize behavioral rules in `CLAUDE.md` and keep page templates simple.

## Testing / Validation

Success criteria for v1:

1. A new markdown source can be ingested end-to-end with predictable outputs.
2. A query can be answered from the wiki without rereading the raw source unless needed.
3. A lint pass can identify structural issues and optionally fix the low-risk ones.
4. The wiki remains small, readable, and clearly organized after several ingest cycles.
5. A future search tool can be added without restructuring the repository.

## Final Recommendation

Build the first version as a **local markdown knowledge system with strict operational rules, not as a software product**.

That validates the core hypothesis from `llm-wiki.md`: that the compounding artifact is the valuable thing, and the LLM’s primary role is disciplined maintenance of that artifact over time.

If this works in a small local setting, richer tooling can be layered on later without invalidating the core repository design.
