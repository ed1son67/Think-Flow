# Ask Wiki Query Panel Design

## Goal

Add a global Ask Wiki panel to the Fumadocs frontend so a user can ask a question from anywhere in the site and have the repository run the existing Think Flow wiki query workflow through the local Codex CLI.

The answer should stream into the page while Codex is running.

## Scope

This design covers:

- one global Ask Wiki UI surface in the site shell
- a local API layer inside the Next.js app
- a repository script that invokes `codex exec`
- streaming query output back into the browser
- allowing the query workflow to write back into the wiki when the Codex run decides to do so

This design does not cover:

- multi-user authentication
- persistent query history UI
- multiple concurrent tasks
- cancellation and retry orchestration
- remote deployment beyond local developer use

## Requirements

The feature must:

- be available from any page in the site
- use the local Codex CLI instead of reimplementing wiki retrieval in the frontend
- stream output incrementally into the browser
- run inside the repository root so the existing Think Flow workflow and file writes behave normally
- preserve the existing `/th:query` repository contract

## Architecture

The feature will use a three-layer bridge:

1. A global React panel submits a query request to the site API.
2. The site API creates a task directory and launches a local repository script in the background.
3. The repository script runs `codex exec` with a prompt that explicitly follows the Think Flow query contract, then writes task events and final state to disk.

The browser reads task updates through Server-Sent Events.

This keeps the browser stateless, the API thin, and the Codex integration isolated to one script.

## Task State

Each query run should use a local task directory under the site, for example:

```text
site/.codex-query-state/<task-id>/
```

Each task directory should contain:

- `meta.json` for task metadata
- `state.json` for current status and final summary
- `events.jsonl` for streamed output events
- `prompt.txt` for the exact prompt passed to Codex

This gives the UI a stable place to read incremental progress without holding open a long-running request to the Codex process itself.

## Codex Invocation

The repository script should invoke `codex exec` in the repository root with:

- `-C <repo-root>`
- `--json` so events can be parsed incrementally
- `--full-auto` or the equivalent low-friction local execution mode
- `workspace-write` sandbox semantics so the query workflow can update wiki files

The prompt should explicitly instruct Codex to:

- follow the Think Flow query rules from `CLAUDE.md`
- use the query prompt scaffold from `skills/think-flow/prompts/query.md`
- answer the user question
- append a `## 来源` section
- update the wiki if the workflow decides the result should be durable

## Streaming Model

The API should expose:

- `POST /api/wiki-query` to create a task and start execution
- `GET /api/wiki-query/[id]/stream` to stream task events via SSE

The stream should emit:

- task start
- stdout text chunks
- stderr/error chunks
- final completion or failure state

The client should treat the stream as append-only output plus a status channel.

## UI

The site should expose a single Ask Wiki panel from the app layout.

The first version should include:

- a floating trigger button
- an expandable panel
- a textarea for the question
- a run button
- a status line
- a scrollable streamed output area

The panel should be global and unique across the app rather than embedded inside page content.

## Safety

The API must accept only question text from the client.

It must not allow arbitrary command arguments, arbitrary working directories, or arbitrary file paths.

The repository script is the only component allowed to decide the exact Codex CLI arguments.

## Risks

- Codex CLI event output may evolve, so the parser should be tolerant and store raw fallback lines when needed.
- Streaming through filesystem-backed task state is simpler but introduces eventual-consistency delays of a few hundred milliseconds.
- Allowing wiki writes means a bad query can make repository changes, which is expected but should be clearly surfaced in UI status.

## Success Criteria

The feature is successful when:

- a user can open Ask Wiki from any page
- a question starts a local Codex-backed query task
- streamed answer text appears in the panel while the query is running
- the final output is visible in the page
- the query can still write durable wiki updates when the Think Flow workflow calls for it
