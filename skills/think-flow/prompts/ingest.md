# Ingest Prompt

You are processing one file from `{{PROJECT_ROOT}}/raw/inbox/` into the LLM Wiki.
All repository paths below are absolute paths anchored to `{{PROJECT_ROOT}}`.

## Required behavior
1. Read the raw source completely.
2. Extract themes, key claims, examples, conclusions, and open questions.
3. Create or update exactly one source page in `{{PROJECT_ROOT}}/wiki/sources/`.
4. Prefer updating existing topic pages in `wiki/topics/` over creating a new topic.
5. Only create a new topic when the concept is durable and likely to recur.
6. Update `{{PROJECT_ROOT}}/wiki/index.md`.
7. Append `## [YYYY-MM-DD] ingest | Title` to `{{PROJECT_ROOT}}/wiki/log.md`.
8. Move the processed raw file from `{{PROJECT_ROOT}}/raw/inbox/` to `{{PROJECT_ROOT}}/raw/processed/`.

## Output checklist
- source page written
- topic pages updated
- index updated
- log updated
- raw file moved
