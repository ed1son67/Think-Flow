# Ask Wiki Query Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a global Ask Wiki panel that streams results from a local Codex-powered Think Flow query workflow into the Fumadocs site.

**Architecture:** The site API creates a local task and launches a repository script that runs `codex exec` in the repo root. Task state is written to disk and streamed back to the browser through SSE, while the UI lives once at the app shell level.

**Tech Stack:** Next.js App Router, React, TypeScript, local Node scripts, Codex CLI, SSE, filesystem-backed task state

---

## File Map

- Create: `site/scripts/wiki-query-bridge.mjs`
- Create: `site/scripts/wiki-query-bridge.test.mjs`
- Create: `site/src/lib/wiki-query.ts`
- Create: `site/src/app/api/wiki-query/route.ts`
- Create: `site/src/app/api/wiki-query/[id]/stream/route.ts`
- Create: `site/src/components/ask-wiki/ask-wiki-provider.tsx`
- Create: `site/src/components/ask-wiki/ask-wiki-panel.tsx`
- Modify: `site/src/app/layout.tsx`
- Modify: `site/src/app/globals.css`

### Task 1: Lock the bridge behavior with tests

**Files:**
- Create: `site/scripts/wiki-query-bridge.test.mjs`
- Create: `site/scripts/wiki-query-bridge.mjs`

- [ ] Write failing tests for prompt construction, task-directory layout, and Codex event parsing.
- [ ] Run the Node test file and verify it fails for the expected missing functions.
- [ ] Implement the minimal bridge helpers to make the tests pass.
- [ ] Re-run the Node test file and confirm all tests pass.

### Task 2: Add filesystem-backed task-state helpers

**Files:**
- Create: `site/src/lib/wiki-query.ts`
- Modify: `site/scripts/wiki-query-bridge.mjs`

- [ ] Implement task id generation, task-path resolution, metadata/state read-write helpers, and JSONL event appends.
- [ ] Make the bridge script use the shared task-state format rather than writing ad hoc files.
- [ ] Verify helper behavior with a focused local test run.

### Task 3: Add API routes for create + stream

**Files:**
- Create: `site/src/app/api/wiki-query/route.ts`
- Create: `site/src/app/api/wiki-query/[id]/stream/route.ts`
- Modify: `site/src/lib/wiki-query.ts`

- [ ] Implement `POST /api/wiki-query` to validate question text, create a task, and background-launch the bridge script.
- [ ] Implement SSE streaming from `events.jsonl` and task state.
- [ ] Handle completion, failure, and idle polling cleanly so the stream closes when the task is done.

### Task 4: Build the global Ask Wiki UI

**Files:**
- Create: `site/src/components/ask-wiki/ask-wiki-provider.tsx`
- Create: `site/src/components/ask-wiki/ask-wiki-panel.tsx`
- Modify: `site/src/app/layout.tsx`
- Modify: `site/src/app/globals.css`

- [ ] Add a single global provider/panel mounted from the app layout.
- [ ] Build the floating trigger, panel shell, textarea, submit action, status display, and streamed output view.
- [ ] Connect the panel to the API create route and SSE stream route.
- [ ] Style the panel so it fits the current site language without looking like a default admin widget.

### Task 5: Verify the end-to-end query flow

**Files:**
- Modify: `site/scripts/wiki-query-bridge.mjs`
- Modify: `site/src/app/api/wiki-query/route.ts`
- Modify: `site/src/app/api/wiki-query/[id]/stream/route.ts`
- Modify: `site/src/components/ask-wiki/ask-wiki-panel.tsx`

- [ ] Run bridge unit tests.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Start the local dev server and submit a real Ask Wiki query.
- [ ] Confirm the output streams incrementally and the final answer appears in the panel.
- [ ] Confirm the flow still works when the query writes durable wiki updates.
