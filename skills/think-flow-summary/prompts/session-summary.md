# Session Summary Prompt

Summarize the conversation as reusable knowledge for future Q&A and follow-up work.
Do not produce a generic chronological recap.

Read the session transcript as working material, then extract only the durable details that are worth preserving as reusable knowledge.

After producing the summary, persist it as exactly one new markdown note under `{{PROJECT_ROOT}}/raw/inbox/`, then continue the normal Think Flow ingest workflow so the note is ingested into the wiki.

## Required Output Shape

## Topic and Intent
- What topic, system, workflow, or problem the session was really about.
- What the user was ultimately trying to learn, decide, fix, or build.

## Reusable Knowledge
- The highest-value conclusions that should be easy to answer later in a knowledge-Q&A context.
- Prefer conclusions that are likely to recur across sessions.

## Definitions, Facts, and Mappings
- Important terms, entities, APIs, files, commands, workflows, or concepts that were clarified.
- Include concrete mappings like "X lives in Y", "A is used for B", or "C means D" when present.

## Causal Insights and Rationale
- Why something works, fails, was chosen, or was rejected.
- Capture cause-effect relationships, tradeoffs, and decision rationale.

## Constraints, Boundaries, and Exceptions
- Important caveats, non-goals, environment-specific limits, or cases where the knowledge does not apply.

## Evidence and Verification
- Files, commands, tests, outputs, or observed behavior that support the conclusions.
- Keep this factual and compact.

## FAQ Candidates
- 1 to 5 question-answer pairs that would be valuable to answer quickly in a future knowledge query.
- Each answer should be short, factual, and grounded in the session.

## Open Questions or Follow-ups
- Only include unresolved items that materially affect future understanding or execution.

## Persistence Requirements
- Materialize the summary into exactly one new file under `{{PROJECT_ROOT}}/raw/inbox/`.
- Use a date-prefixed filename such as `{{PROJECT_ROOT}}/raw/inbox/YYYY-MM-DD-session-summary-<provider>.md`.
- If the user supplied a focus lens, it may replace the generic suffix when it gives a better durable slug.
- If the target filename already exists, append a numeric suffix instead of overwriting.
- The raw note must stay concise and knowledge-dense.
- Include lightweight provenance at the top:
  - source tool
  - transcript source file
  - optional focus lens
- Do not dump the full transcript into the raw note.
- Do not include hidden reasoning or low-value tool chatter.
- After writing the raw note, follow the standard `/th:ingest` workflow for exactly that file:
  - read `{{PROJECT_ROOT}}/CLAUDE.md`
  - read `{{PROJECT_ROOT}}/skills/think-flow/prompts/ingest.md`
  - ingest the new raw note into the wiki
  - move the processed raw file into `{{PROJECT_ROOT}}/raw/processed/`

## Writing Rules
- Prefer durable conclusions over transient chat phrasing.
- Separate confirmed facts from inference.
- Optimize for future retrieval and reuse in a knowledge-Q&A workflow.
- Prefer knowledge density over narrative completeness.
- Drop low-value status updates, social filler, and repetitive intermediate steps.
- If the session contained implementation work, mention only the high-signal changes and evidence.
- If the session was mostly design discussion, focus on conclusions, definitions, rationale, and boundaries.
- Keep the summary compact but specific.
