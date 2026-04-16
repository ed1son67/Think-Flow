# Learning Knowledge Wiki Architecture Design

## Goal

Redesign the repository information architecture so it works as a long-lived learning knowledge base instead of a file-ingest mirror.

The redesigned system should optimize for:

- long-term knowledge accumulation
- concept-centered organization
- question-driven entry without question-driven fragmentation
- strong evidence traceability back to source material
- durable navigation and maintainability as the wiki grows

## Context

The current repository has a working local-first ingest/query/lint loop, but the information model has drifted away from the original intent.

Observed failure modes in the current design:

- many `topic` pages are effectively 1:1 mirrors of source files
- `index.md` is a flat directory listing rather than a navigational entrypoint
- source pages usually preserve file metadata and shallow summaries, but not claim-level evidence
- query and lint workflows operate on structurally valid pages without enough semantic structure
- the system currently behaves more like "markdown ingestion" than "knowledge maintenance"

The user wants the repository to become a learning-oriented knowledge base. The primary long-term assets should be reusable knowledge pages, not imported files or ad hoc question phrasing.

## Design Principles

1. Concepts are the primary durable asset.
2. Questions are entrypoints, not the final home of knowledge.
3. Sources are evidence objects and must support traceability.
4. Domains organize navigation but should not become bloated knowledge containers.
5. Synthesis pages should be rare, high-value, and cross-source.
6. Updating existing knowledge objects is preferable to creating new pages.
7. The same concept should accumulate multiple sources over time.
8. The same question should reliably resolve to one or more concept pages.

## Non-Goals

This redesign does not introduce:

- vector databases or embeddings infrastructure
- web application or service-layer productization
- multi-user workflows
- approval queues
- automatic ontology generation
- large-scale batch ingest automation

## Recommended Information Model

The wiki should use five page types:

- `domain`
- `concept`
- `question`
- `source`
- `synthesis`

Only `concept` pages are the primary knowledge asset. The other page types support navigation, evidence, reuse, and query entry.

## Page Types

### 1. Domain Pages

Purpose:

- provide top-level navigation
- group related concepts for browsing
- expose gaps and related domains

Properties:

- small in number
- slow-changing
- not the place for detailed explanation of specific concepts

Examples:

- `frontend`
- `network`
- `system-design`

### 2. Concept Pages

Purpose:

- serve as the canonical home of stable knowledge
- accumulate definitions, mechanisms, boundaries, examples, misconceptions, and linked evidence
- unify material from many source files and many question phrasings

Properties:

- the primary durable content layer
- should not be created directly from raw file names unless the name is already a stable concept
- should absorb new evidence over time

Examples:

- `react-fiber`
- `http-cache`
- `gray-release`

### 3. Question Pages

Purpose:

- capture how users naturally ask for knowledge
- route questions to the correct concept pages
- preserve reusable answer outlines for common question forms

Properties:

- entrypoint layer, not the final knowledge destination
- many question pages may point to one concept page
- useful for interview-style material and recurring query patterns

Examples:

- `what-is-react-fiber`
- `how-to-design-gray-release`

### 4. Source Pages

Purpose:

- preserve evidence derived from raw material
- record claims, excerpts, locations, and reliability notes
- make higher-level conclusions auditable

Properties:

- strong evidence layer
- closer to ingest-time identity than concept pages
- may be lightweight for low-value material, but must still support traceability

Examples:

- `2026-04-13-react-rendering-notes`
- `2026-04-13-http-cache-article`

### 5. Synthesis Pages

Purpose:

- capture high-value cross-source analysis
- preserve frameworks, comparisons, reviews, or decisions that should be reused later

Properties:

- not produced by default
- created only when the analysis is broader than a single concept page update
- should connect concepts, questions, and sources rather than duplicate them

Examples:

- `react-rendering-models-comparison`
- `frontend-cache-strategy-framework`

## Relationship Model

The information architecture should follow these primary relationships:

- `domain -> concept`
- `question -> concept`
- `concept -> source`
- `synthesis -> concept`
- `synthesis -> source`
- `synthesis -> question`

Implications:

- a source does not automatically create a concept
- a source should often update several concepts
- a question should usually resolve to one or more existing concepts
- a concept should usually accumulate evidence from multiple sources over time
- a synthesis page should sit above concepts and sources, not replace them

## Repository Structure

Recommended wiki structure:

```text
wiki/
├── index.md
├── log.md
├── domains/
├── concepts/
├── questions/
├── sources/
└── syntheses/
```

Responsibilities:

- `index.md`: global entrypoint
- `log.md`: chronological operational record
- `domains/`: navigation pages
- `concepts/`: canonical knowledge pages
- `questions/`: reusable question entry pages
- `sources/`: evidence pages linked to raw material
- `syntheses/`: reusable cross-source analysis pages

## Naming Rules

### General Rules

- file names are for stable reference, not display
- display labels belong in `title`
- alternate Chinese or English names belong in `aliases`
- `id` is the canonical stable identifier used in metadata

### File Naming Rules

- `domain`, `concept`, `question`, and `synthesis` file names should use stable slugs without dates
- `source` file names may include dates or source-specific identity markers
- avoid deriving long-term page names directly from raw source filenames unless the raw source already names a stable concept

Examples:

- `wiki/concepts/react-fiber.md`
- `wiki/questions/what-is-react-fiber.md`
- `wiki/sources/2026-04-13-react-rendering-notes.md`

### Language Rules

- allow both Chinese and English in `title` and `aliases`
- keep `id` and filenames slug-safe for linking and automation
- do not rely on filename language for user-facing display

## Common Metadata Shape

All content pages should share a common base frontmatter:

```yaml
---
id: react-fiber
title: React Fiber
type: concept
status: active
created: 2026-04-16
updated: 2026-04-16
aliases: []
tags: []
---
```

This common metadata supports stable routing, automation, and future lint checks.

## Type-Specific Metadata

### Domain

```yaml
child_concepts: []
related_domains: []
```

### Concept

```yaml
domain_refs: []
question_refs: []
source_refs: []
related_concepts: []
canonical: true
mastery: seed | growing | stable
```

### Question

```yaml
concept_refs: []
source_refs: []
answer_type: concept | comparison | design
canonical_question_for: ""
```

### Source

```yaml
source_kind: note | article | book | code | transcript
raw_path: ""
trust_level: low | medium | high
claim_count: 0
concept_refs: []
question_refs: []
```

### Synthesis

```yaml
concept_refs: []
question_refs: []
source_refs: []
synthesis_kind: comparison | framework | review | decision
```

## Page Templates

### Domain Page Template

Recommended sections:

- Scope
- Core Concepts
- Related Domains
- Gaps / Next Areas

Domain pages should help a reader navigate what exists and what is missing, not become a dumping ground for detailed explanations.

### Concept Page Template

Recommended sections:

- Definition
- Why It Matters
- How It Works
- Key Examples
- Boundaries / Misconceptions
- Related Questions
- Supporting Evidence
- Open Questions

Concept pages are the canonical long-term knowledge asset. They should integrate many sources and resist drift toward raw-file summaries.

### Question Page Template

Recommended sections:

- Question
- Short Answer
- Canonical Concept
- Answer Outline
- Related Sources
- Variants of This Question

Question pages should route and reuse, not become isolated topic silos.

### Source Page Template

Recommended sections:

- Source Summary
- Claims
- Evidence Notes
- Key Excerpts / Positions
- Reliability Notes
- Linked Concepts
- Linked Questions

This is the key evidence-layer change from the current design. Source pages must retain more than title/path/line-count metadata. They should preserve traceable claims and evidence references.

### Synthesis Page Template

Recommended sections:

- Problem / Theme
- Compared Concepts or Positions
- Analysis
- Takeaways
- Follow-ups

Synthesis pages should exist only when a reusable, higher-order analysis has emerged.

## Navigation Design

### Global Index

`wiki/index.md` should become a true entrypoint rather than a flat page directory.

Recommended sections:

1. `Domains`
2. `Core Concepts`
3. `Question Entry Points`
4. `Recent Source Ingests`
5. `Recent Syntheses`
6. `Knowledge Gaps`

Expected behavior:

- help a user find where to begin reading
- help the LLM identify high-value knowledge entrypoints before drilling into details
- highlight what is missing, not only what exists

### Domain Navigation

Each domain page should maintain:

- its core concept list
- representative question entrypoints
- recommended reading order when useful
- important gaps or underdeveloped concepts

This gives the system two navigation layers:

- global navigation through `index.md`
- scoped navigation through `domains/*.md`

## Workflow Redesign

### Ingest Workflow

Goal:

Convert one raw source into evidence and concept updates without mechanically generating a long-lived knowledge page for every file.

Recommended sequence:

1. Read one raw source fully.
2. Identify candidate concepts, questions, claims, and domain mappings.
3. Create or update exactly one source page for the raw source.
4. Decide whether each identified knowledge unit maps to:
   - an existing concept
   - a new concept
   - a question page
   - no durable page yet
5. Prefer updating existing concepts over creating new concepts.
6. Create a new concept only if the material introduces a stable recurring idea.
7. Create a question page only if the material expresses a reusable question framing.
8. Update affected domain pages.
9. Update `index.md`.
10. Append to `log.md`.
11. Move the raw source from inbox to processed.

Ingest should default to:

- one source page
- updates to one or more concept pages
- optional question updates
- optional domain updates

Ingest should not default to:

- creating a concept for every file
- promoting file names into canonical concepts

### Query Workflow

Goal:

Answer from stable knowledge objects first, with strong fallback to evidence when needed.

Recommended sequence:

1. Read `index.md` to identify likely entrypoints.
2. Read relevant domain pages when the query is broad.
3. Read relevant concept pages first.
4. Read question pages when the query itself is a known phrasing.
5. Read source pages when evidence or traceability is required.
6. Distinguish clearly between:
   - current wiki-backed conclusions
   - inference drawn from available material
7. Update concept or question pages if answering reveals structural gaps.
8. Create a synthesis page only if the output is durable and reusable.

Query should optimize for:

- stable concept retrieval
- evidence-backed answers
- durable improvement of the knowledge base

### Lint Workflow

Goal:

Maintain semantic health, not just structural validity.

Lint should run on three levels.

#### 1. Structural checks

- missing required directories
- missing system pages
- invalid or missing frontmatter
- broken references
- orphan pages

#### 2. Semantic checks

- duplicate concepts representing the same idea
- question pages with no concept target
- concept pages with no source evidence
- source pages with no concept linkage
- domain pages with bloated detailed content
- concept pages that are still acting like raw-file summaries

#### 3. Maintenance checks

- core concepts still backed by only one weak source
- stale concept pages with old `updated` timestamps
- open questions that remain unresolved despite newer evidence
- synthesis pages that should be folded back into concept pages

`safe-fix` should remain conservative:

- allow creation of missing system files
- allow repair of obvious structural metadata
- do not rewrite substantive knowledge content

## Logging Model

`wiki/log.md` remains append-only, but entries should reflect the new architecture.

Recommended ingest log details:

- source page created or updated
- concept pages changed
- question pages created or updated
- domain pages changed
- whether a new concept was created

Recommended query log details when durable output changed:

- concepts consulted
- sources consulted
- whether a synthesis was created
- whether any concept or question page was updated

Recommended lint log details when durable output changed:

- structural fixes applied
- semantic issues flagged
- follow-up actions recommended

## Migration Strategy

This redesign should be introduced incrementally.

### Phase 1: Introduce the new model

- add `domains/`, `concepts/`, and `questions/`
- preserve old content while the new structure is created
- document new page types and schemas

### Phase 2: Migrate core knowledge

- identify the most valuable existing topic pages
- convert stable topic pages into concept pages
- create initial domain pages
- add question pages only for high-frequency or high-value entrypoints

### Phase 3: Clean up long tail content

Reclassify current `topic` pages into one of these outcomes:

- real concept -> move to `concepts/`
- reusable question framing -> move to `questions/`
- file-derived summary only -> keep as `source`
- cross-source framework -> move to `syntheses/`

### Phase 4: Rewrite workflows and automation

- update ingest rules to target concepts instead of old topics
- redesign `index.md`
- update lint logic to validate semantic structure
- update query behavior to route through concept pages first

## Acceptance Criteria

The redesign should be considered successful when all of the following are true:

- ingesting one source does not mechanically create one long-lived concept page
- a concept can accumulate multiple sources over time
- a recurring question reliably resolves to one or more concept pages
- answers can trace claims back to source pages
- `index.md` works as a real entrypoint rather than a long page dump
- lint can detect semantic misclassification, not just missing metadata
- the knowledge base becomes more connected as it grows, not more fragmented

## Final Recommendation

Adopt a concept-centered information architecture with question entrypoints and a strong source evidence layer.

This design best matches the user's goal:

- a learning-oriented knowledge base
- optimized for long-term accumulation
- concept-first rather than file-first
- question-friendly without becoming question-fragmented
- auditable through source evidence

The most important change is conceptual, not cosmetic:

the wiki must stop treating imported files as the primary identity of knowledge and instead treat concepts as the canonical home of durable understanding.
