# Think Flow Operating Rules

## Purpose
This repository is a local-first markdown wiki maintained with Claude Code. Operate it through `/th:ingest`, `/th:query`, and `/th:lint`. The raw source layer is evidence. The wiki layer is synthesis. Do not treat chat output as durable unless it is written back into the wiki.

All repository paths below are absolute paths anchored to `{{PROJECT_ROOT}}`.
Use injected absolute paths such as `{{PROJECT_ROOT}}/wiki/index.md` and `{{PROJECT_ROOT}}/skills/think-flow/prompts/`.

## Repository layout
- `/raw/inbox/`: new markdown or txt sources waiting to be processed
- `/raw/processed/`: sources that have already been ingested
- `/raw/assets/`: local assets referenced by raw sources
- `/wiki/sources/`: one summary page per source
- `/wiki/topics/`: durable topic synthesis pages
- `/wiki/concepts/`: optional future expansion area; do not require it in v1
- `/wiki/syntheses/`: high-value answers and analyses promoted from query work
- `1/wiki/index.md`: the content-oriented entry point
- `/wiki/log.md`: append-only chronology of ingest/query/lint operations
- `/skills/think-flow/prompts/`: reusable prompt scaffolds for ingest/query/lint
- `/scripts/`: small helper tools only; no database or service logic

## Global rules
- Keep raw files immutable. Never rewrite content under `/raw/`.
- Prefer updating an existing topic page over creating a new one.
- Keep pages concise and structured.
- Distinguish conclusions from open questions.
- Preserve source traceability through source pages.
- Update `/wiki/index.md` and `/wiki/log.md` whenever you change durable wiki content.

## Ingest workflow
1. Read exactly one file from `/raw/inbox/`.
2. Extract themes, claims, examples, conclusions, and open questions.
3. Write a source page under `/wiki/sources/`.
4. Update one or more relevant topic pages.
5. Only create a new topic when the concept is durable and likely to recur.
6. Update `/wiki/index.md`.
7. Append an ingest entry to `/wiki/log.md` using `## [YYYY-MM-DD] ingest | Title`.
8. Move the raw file into `/raw/processed/`.

## Query workflow
1. Read `/wiki/index.md` first.
2. Read the most relevant topic pages before source pages.
3. Use source pages for evidence when topic pages are insufficient.
4. In answers, clearly separate current wiki conclusions from inference.
5. If the answer is likely to be reused, save it to `/wiki/syntheses/`.
6. If the query reveals missing links or missing structure, update the affected wiki pages.
7. Append a `## 来源` section to the end of the answer and list only the wiki pages actually used.
8. Append a query entry to `/wiki/log.md` using `## [YYYY-MM-DD] query | Question` when the query creates durable output.

## Lint workflow
1. Check for missing required directories and system pages.
2. Check that content pages contain frontmatter.
3. Check for empty content pages.
4. Check that content pages appear in `/wiki/index.md`.
5. Default to report-only behavior.
6. `safe-fix` may create missing `/wiki/index.md` or `/wiki/log.md`, but should not rewrite content-rich pages.
7. Append a lint entry to `/wiki/log.md` using `## [YYYY-MM-DD] lint | label` when a lint run changes durable content.

## Page templates
### Source page
```markdown
---
title: ...
type: source
status: active
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: []
source_refs: []
topic_refs: []
---

# Summary

# Core Ideas

# Key Details

# Reusable Insights

# Open Questions

# Related Topics
```

### Topic page
```markdown
---
title: ...
type: topic
status: active
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: []
source_refs: []
topic_refs: []
---

# Current View

# Key Points

# Supporting Evidence

# Tensions / Trade-offs

# Open Questions

# Related Pages
```

### Synthesis page
```markdown
---
title: ...
type: synthesis
status: active
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: []
source_refs: []
topic_refs: []
---

# Question

# Short Answer

# Analysis

# Implications for This Wiki

# Follow-ups
```
