# Home And Ask Wiki Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add restrained motion to the home page and turn Ask Wiki into a dedicated `/ask-wiki` result route that expands from the global floating launcher.

**Architecture:** Keep the existing query backend and SSE protocol intact, but split the frontend into two layers: a lightweight global launcher and a route-scoped Ask Wiki result screen. Use CSS-driven motion for home-page feedback and a one-shot launcher payload to carry the floating button origin into the route transition.

**Tech Stack:** Next.js App Router, React 19, TypeScript, existing Ask Wiki API routes, CSS/Tailwind utilities, Node test for existing bridge regression

---

## File Map

- Create: `site/src/app/ask-wiki/page.tsx`
- Create: `site/src/components/ask-wiki/ask-wiki-page.tsx`
- Create: `site/src/components/ask-wiki/ask-wiki-route-transition.tsx`
- Create: `site/src/components/ask-wiki/ask-wiki-launch-state.ts`
- Modify: `site/src/components/ask-wiki/ask-wiki-provider.tsx`
- Modify: `site/src/components/ask-wiki/ask-wiki-panel.tsx`
- Modify: `site/src/app/globals.css`
- Modify: `site/src/components/home-hero.tsx`
- Modify: `site/src/components/wiki-overview.tsx`
- Modify: `site/src/components/site-footer.tsx`
- Verify: `site/scripts/wiki-query-bridge.test.mjs`

## Task 1: Add a one-shot launcher contract for route transitions

**Files:**
- Create: `site/src/components/ask-wiki/ask-wiki-launch-state.ts`
- Modify: `site/src/components/ask-wiki/ask-wiki-provider.tsx`

- [ ] **Step 1: Add the launch-state helper used by both the launcher and the result route**

```ts
export type AskWikiLaunchOrigin = {
  left: number;
  top: number;
  width: number;
  height: number;
  radius: number;
};

export type AskWikiLaunchState = {
  createdAt: number;
  question: string;
  autoSubmit: boolean;
  origin: AskWikiLaunchOrigin | null;
};

const STORAGE_KEY = "think-flow:ask-wiki-launch";
const MAX_AGE_MS = 4000;

export function getLaunchOrigin(element: HTMLElement | null): AskWikiLaunchOrigin | null {
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    radius: Math.min(rect.width, rect.height) / 2,
  };
}

export function writeAskWikiLaunchState(value: AskWikiLaunchState) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function readAskWikiLaunchState(): AskWikiLaunchState | null {
  if (typeof window === "undefined") return null;

  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AskWikiLaunchState;
    if (Date.now() - parsed.createdAt > MAX_AGE_MS) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearAskWikiLaunchState() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
}
```

- [ ] **Step 2: Run lint on the new helper import path before changing launcher behavior**

Run: `npm run lint -- src/components/ask-wiki/ask-wiki-launch-state.ts src/components/ask-wiki/ask-wiki-provider.tsx`

Expected: ESLint reports either a missing-file failure or import-not-found failure before the provider update is complete.

- [ ] **Step 3: Convert the global provider into a launcher-only coordinator**

```tsx
"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AskWikiPanel } from "./ask-wiki-panel";
import {
  getLaunchOrigin,
  writeAskWikiLaunchState,
} from "./ask-wiki-launch-state";

export function AskWikiProvider() {
  const pathname = usePathname();
  const router = useRouter();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");

  if (pathname === "/ask-wiki") {
    return null;
  }

  const launch = (autoSubmit: boolean) => {
    writeAskWikiLaunchState({
      createdAt: Date.now(),
      question: question.trim(),
      autoSubmit,
      origin: getLaunchOrigin(buttonRef.current),
    });
    router.push("/ask-wiki");
  };

  return (
    <AskWikiPanel
      buttonRef={buttonRef}
      isOpen={isOpen}
      question={question}
      onToggle={() => setIsOpen((value) => !value)}
      onQuestionChange={setQuestion}
      onOpenRoute={() => launch(false)}
      onSubmit={() => launch(true)}
    />
  );
}
```

- [ ] **Step 4: Re-run lint and confirm the launcher contract compiles cleanly**

Run: `npm run lint -- src/components/ask-wiki/ask-wiki-launch-state.ts src/components/ask-wiki/ask-wiki-provider.tsx`

Expected: PASS with no `no-undef`, `import/no-unresolved`, or hook-order errors.

- [ ] **Step 5: Commit the launcher-contract change**

```bash
git add site/src/components/ask-wiki/ask-wiki-launch-state.ts site/src/components/ask-wiki/ask-wiki-provider.tsx
git commit -m "Preserve Ask Wiki launch context across route transitions" -m "The floating launcher now stores a short-lived route-transition payload instead of owning the full query lifecycle. This keeps the app shell small and gives the dedicated Ask Wiki route the information it needs to animate from the launcher origin." -m "Constraint: Keep the existing Ask Wiki backend and app-shell mount point" -m "Rejected: Pass DOMRect through the URL | brittle and exposes presentation-only state in navigation" -m "Confidence: high" -m "Scope-risk: narrow" -m "Directive: Treat the launch payload as one-shot state and clear it after the route consumes it" -m "Tested: npm run lint -- src/components/ask-wiki/ask-wiki-launch-state.ts src/components/ask-wiki/ask-wiki-provider.tsx" -m "Not-tested: Cross-tab behavior for stale sessionStorage values"
```

## Task 2: Move Ask Wiki query execution into a dedicated result route

**Files:**
- Create: `site/src/app/ask-wiki/page.tsx`
- Create: `site/src/components/ask-wiki/ask-wiki-page.tsx`
- Modify: `site/src/components/ask-wiki/ask-wiki-provider.tsx`

- [ ] **Step 1: Add the App Router entry for the new Ask Wiki page**

```tsx
import { AskWikiPage } from "@/components/ask-wiki/ask-wiki-page";

export default function AskWikiRoute() {
  return <AskWikiPage />;
}
```

- [ ] **Step 2: Run lint once the new route file exists**

Run: `npm run lint -- src/app/ask-wiki/page.tsx`

Expected: PASS for the route file, or a failure only because `AskWikiPage` does not exist yet.

- [ ] **Step 3: Build the route-scoped Ask Wiki screen and move the fetch/SSE state machine into it**

```tsx
"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  clearAskWikiLaunchState,
  readAskWikiLaunchState,
} from "./ask-wiki-launch-state";
import { AskWikiRouteTransition } from "./ask-wiki-route-transition";

type QueryCreateResponse = {
  taskId: string;
  status: string;
  error?: string;
};

type QueryStreamEvent = {
  type: string;
  status?: string;
  text?: string;
  message?: string;
  error?: string | null;
  finalMessage?: string | null;
};

export function AskWikiPage() {
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState("idle");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [launchState] = useState(readAskWikiLaunchState);
  const streamRef = useRef<EventSource | null>(null);

  const isRunning =
    status === "queued" || status === "starting" || status === "running";

  const statusText = useMemo(() => {
    if (status === "idle") return "Ready to query the local wiki workflow.";
    if (status === "queued") return "Task queued.";
    if (status === "starting") return "Starting local Codex query.";
    if (status === "running") return "Streaming task output.";
    if (status === "completed") return "Query finished.";
    if (status === "failed") return "Query failed.";
    return status;
  }, [status]);

  const closeStream = useEffectEvent(() => {
    streamRef.current?.close();
    streamRef.current = null;
  });

  const connectToTask = useEffectEvent((id: string) => {
    closeStream();
    const stream = new EventSource(`/api/wiki-query/${id}/stream`);
    streamRef.current = stream;

    stream.onmessage = (event) => {
      const payload = JSON.parse(event.data) as QueryStreamEvent;

      if (payload.type === "state" && payload.status) {
        setStatus(payload.status);
        if (payload.status === "completed" && payload.finalMessage) {
          setOutput(payload.finalMessage);
        }
        if (payload.status === "failed" && payload.error) {
          setError(payload.error);
        }
        if (payload.status === "completed" || payload.status === "failed") {
          closeStream();
        }
        return;
      }

      if (payload.type === "status" && payload.message) {
        setStatus(payload.status ?? "running");
        setOutput((current) =>
          current ? `${current}\n\n[status] ${payload.message}` : `[status] ${payload.message}`,
        );
        return;
      }

      if (payload.type === "chunk" && payload.text) {
        setOutput((current) => (current ? `${current}\n\n${payload.text}` : payload.text));
        return;
      }

      if (payload.type === "final" && payload.text) {
        setOutput(payload.text);
        return;
      }

      if (payload.type === "stderr" && payload.text) {
        setError(payload.text);
        return;
      }

      if (payload.type === "error") {
        setStatus("failed");
        setError(payload.message ?? payload.error ?? "Wiki query failed.");
        closeStream();
      }
    };

    stream.onerror = () => {
      setStatus("failed");
      setError("The query stream disconnected.");
      closeStream();
    };
  });

  const handleSubmit = useEffectEvent(async (nextQuestion?: string) => {
    const finalQuestion = (nextQuestion ?? question).trim();
    if (!finalQuestion) return;

    setQuestion(finalQuestion);
    setError(null);
    setOutput("");
    setStatus("queued");

    const response = await fetch("/api/wiki-query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: finalQuestion }),
    });

    const payload = (await response.json()) as QueryCreateResponse;

    if (!response.ok) {
      if (response.status === 409 && payload.taskId) {
        setTaskId(payload.taskId);
        setError("A query is already running. Attached to the active task.");
        connectToTask(payload.taskId);
        return;
      }

      setStatus("failed");
      setError(payload.error ?? "Failed to start the wiki query.");
      return;
    }

    setTaskId(payload.taskId);
    setStatus(payload.status);
    connectToTask(payload.taskId);
  });

  useEffect(() => {
    return () => closeStream();
  }, [closeStream]);

  useEffect(() => {
    if (!launchState) return;

    if (launchState.question) {
      setQuestion(launchState.question);
    }

    if (launchState.autoSubmit && launchState.question.trim()) {
      void handleSubmit(launchState.question);
    }

    clearAskWikiLaunchState();
  }, [handleSubmit, launchState]);

  return (
    <AskWikiRouteTransition origin={launchState?.origin ?? null}>
      <main className="page-shell min-h-screen">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.22em] text-accent-strong">
                Ask Wiki
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-foreground">
                Query the local Think Flow knowledge base
              </h1>
            </div>
            <Link href="/" className="surface-interactive rounded-full border border-line bg-white/75 px-4 py-2 text-sm font-medium text-foreground">
              Back home
            </Link>
          </div>

          <section className="rounded-[1.75rem] border border-line bg-panel-strong p-5 shadow-[0_24px_80px_rgba(43,32,19,0.12)] sm:p-6">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground">Question</span>
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                rows={5}
                placeholder="Ask the wiki a question..."
                className="w-full resize-none rounded-2xl border border-line bg-white/85 px-4 py-3 text-sm leading-7 text-foreground outline-none transition focus:border-accent focus:bg-white"
              />
            </label>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted">
                {taskId ? `${statusText} Task: ${taskId}` : statusText}
              </p>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isRunning || question.trim().length === 0}
                className="pressable inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRunning ? "Running..." : "Run Query"}
              </button>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-line bg-[rgba(255,251,246,0.86)] shadow-[0_18px_60px_rgba(43,32,19,0.10)]">
            <div className="border-b border-line px-5 py-4 font-mono text-[0.72rem] uppercase tracking-[0.22em] text-muted">
              Stream
            </div>
            <div className="min-h-[18rem] max-h-[38rem] overflow-y-auto px-5 py-5">
              {output ? (
                <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-7 text-foreground">
                  {output}
                </pre>
              ) : (
                <p className="text-sm leading-7 text-muted">
                  Query output will appear here.
                </p>
              )}
              {error ? (
                <p className="mt-4 rounded-xl border border-[rgba(141,47,17,0.2)] bg-[rgba(191,91,36,0.08)] px-3 py-2 text-sm leading-6 text-accent-strong">
                  {error}
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    </AskWikiRouteTransition>
  );
}
```

- [ ] **Step 4: Re-run lint for the new route screen and fix any hook or JSX issues before styling animation**

Run: `npm run lint -- src/app/ask-wiki/page.tsx src/components/ask-wiki/ask-wiki-page.tsx`

Expected: PASS with no `react-hooks/exhaustive-deps`, `jsx-a11y`, or unused-variable errors.

- [ ] **Step 5: Commit the result-route migration**

```bash
git add site/src/app/ask-wiki/page.tsx site/src/components/ask-wiki/ask-wiki-page.tsx site/src/components/ask-wiki/ask-wiki-provider.tsx
git commit -m "Move Ask Wiki query execution into a dedicated route" -m "The global launcher now hands off to /ask-wiki, where the existing create-task and SSE flow runs in a focused screen. This makes the full query lifecycle easier to understand and prepares the UI for an origin-aware page transition." -m "Constraint: Reuse the current /api/wiki-query endpoints and SSE payload shape" -m "Rejected: Keep streaming results in the floating panel | conflicts with the approved dedicated result page" -m "Confidence: high" -m "Scope-risk: moderate" -m "Directive: Keep the route usable for direct visits even when no launcher payload is present" -m "Tested: npm run lint -- src/app/ask-wiki/page.tsx src/components/ask-wiki/ask-wiki-page.tsx" -m "Not-tested: Long-running query behavior during route refresh"
```

## Task 3: Add the shell transition and refit the floating launcher UI

**Files:**
- Create: `site/src/components/ask-wiki/ask-wiki-route-transition.tsx`
- Modify: `site/src/components/ask-wiki/ask-wiki-panel.tsx`
- Modify: `site/src/app/globals.css`

- [ ] **Step 1: Create the client transition shell that expands from the saved launcher origin**

```tsx
"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type { AskWikiLaunchOrigin } from "./ask-wiki-launch-state";

type AskWikiRouteTransitionProps = {
  origin: AskWikiLaunchOrigin | null;
  children: ReactNode;
};

export function AskWikiRouteTransition({
  origin,
  children,
}: AskWikiRouteTransitionProps) {
  const [isActive, setIsActive] = useState(Boolean(origin));

  useEffect(() => {
    if (!origin) return;
    const frame = window.requestAnimationFrame(() => {
      setIsActive(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [origin]);

  return (
    <div className="ask-route-stage">
      {origin ? (
        <div
          aria-hidden="true"
          className={`ask-route-transition${isActive ? " is-active" : " is-settled"}`}
          style={
            {
              "--ask-origin-left": `${origin.left}px`,
              "--ask-origin-top": `${origin.top}px`,
              "--ask-origin-width": `${origin.width}px`,
              "--ask-origin-height": `${origin.height}px`,
              "--ask-origin-radius": `${origin.radius}px`,
            } as CSSProperties
          }
        />
      ) : null}
      <div className="ask-route-content">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Refactor the floating panel into a launcher surface with explicit open-route and submit actions**

```tsx
import type { RefObject } from "react";

type AskWikiPanelProps = {
  buttonRef: RefObject<HTMLButtonElement | null>;
  isOpen: boolean;
  question: string;
  onToggle: () => void;
  onQuestionChange: (value: string) => void;
  onOpenRoute: () => void;
  onSubmit: () => void;
};

export function AskWikiPanel({
  buttonRef,
  isOpen,
  question,
  onToggle,
  onQuestionChange,
  onOpenRoute,
  onSubmit,
}: AskWikiPanelProps) {
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-end sm:inset-x-6 sm:bottom-6">
      <div className="pointer-events-auto flex w-full max-w-[28rem] flex-col items-end gap-3">
        {isOpen ? (
          <section className="launcher-panel motion-enter rounded-[1.75rem] border border-line bg-panel-strong p-4 shadow-[0_24px_80px_rgba(43,32,19,0.18)] backdrop-blur-sm sm:p-5">
            <div className="mb-4">
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-accent-strong">
                Ask Wiki
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-foreground">
                Launch a focused query workspace
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Start from here, then continue in a dedicated result page.
              </p>
            </div>

            <textarea
              value={question}
              onChange={(event) => onQuestionChange(event.target.value)}
              rows={4}
              placeholder="Ask the wiki a question..."
              className="w-full resize-none rounded-2xl border border-line bg-white/80 px-4 py-3 text-sm leading-7 text-foreground outline-none transition focus:border-accent focus:bg-white"
            />

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onOpenRoute}
                className="surface-interactive rounded-full border border-line bg-white/80 px-4 py-2 text-sm font-semibold text-foreground"
              >
                Open workspace
              </button>
              <button
                type="button"
                onClick={onSubmit}
                disabled={question.trim().length === 0}
                className="pressable rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Ask now
              </button>
            </div>
          </section>
        ) : null}

        <button
          ref={buttonRef}
          type="button"
          onClick={onToggle}
          className="surface-interactive pressable rounded-full border border-line bg-[rgba(23,18,14,0.92)] px-5 py-3 text-sm font-semibold tracking-[0.01em] text-stone-50 shadow-[0_18px_50px_rgba(32,24,18,0.24)]"
        >
          Ask Wiki
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add reusable motion primitives and the route-transition CSS with reduced-motion fallbacks**

```css
@media (prefers-reduced-motion: no-preference) {
  .motion-enter {
    animation: motion-enter 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .motion-stagger {
    animation: motion-enter 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: var(--motion-delay, 0ms);
  }

  .surface-interactive {
    transition:
      transform 180ms ease,
      box-shadow 180ms ease,
      background-color 180ms ease,
      border-color 180ms ease,
      color 180ms ease;
  }

  .surface-interactive:hover {
    transform: translateY(-3px);
    box-shadow: 0 18px 40px rgba(43, 32, 19, 0.12);
  }

  .pressable:active {
    transform: translateY(0);
  }

  .ask-route-transition {
    position: fixed;
    left: var(--ask-origin-left);
    top: var(--ask-origin-top);
    width: var(--ask-origin-width);
    height: var(--ask-origin-height);
    border-radius: var(--ask-origin-radius);
    background: rgba(255, 247, 236, 0.98);
    box-shadow: 0 24px 80px rgba(43, 32, 19, 0.18);
    z-index: 40;
    transform-origin: center;
    transition:
      left 380ms cubic-bezier(0.22, 1, 0.36, 1),
      top 380ms cubic-bezier(0.22, 1, 0.36, 1),
      width 380ms cubic-bezier(0.22, 1, 0.36, 1),
      height 380ms cubic-bezier(0.22, 1, 0.36, 1),
      border-radius 380ms cubic-bezier(0.22, 1, 0.36, 1),
      opacity 220ms ease;
  }

  .ask-route-transition.is-active {
    left: 1rem;
    top: 1rem;
    width: calc(100vw - 2rem);
    height: calc(100vh - 2rem);
    border-radius: 2rem;
  }

  .ask-route-transition.is-settled {
    opacity: 0;
    pointer-events: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .motion-enter,
  .motion-stagger {
    animation: none;
  }

  .surface-interactive,
  .pressable,
  .ask-route-transition {
    transition: opacity 140ms ease, background-color 140ms ease, color 140ms ease;
  }

  .ask-route-transition {
    display: none;
  }
}

@keyframes motion-enter {
  from {
    opacity: 0;
    transform: translateY(14px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

- [ ] **Step 4: Run lint after the transition-shell refactor**

Run: `npm run lint -- src/components/ask-wiki/ask-wiki-route-transition.tsx src/components/ask-wiki/ask-wiki-panel.tsx src/components/ask-wiki/ask-wiki-page.tsx`

Expected: PASS with no `react/no-unknown-property`, `jsx-a11y`, or type-only import issues.

- [ ] **Step 5: Commit the transition-shell and launcher UI changes**

```bash
git add site/src/components/ask-wiki/ask-wiki-route-transition.tsx site/src/components/ask-wiki/ask-wiki-panel.tsx site/src/app/globals.css
git commit -m "Make Ask Wiki expand from the floating launcher" -m "The Ask Wiki flow now preserves a visible relationship between the fixed launcher and the dedicated result route. Motion stays CSS-first, with reduced-motion users receiving the same state changes without the shell expansion." -m "Constraint: No new animation dependency for this first pass" -m "Rejected: Add a JS-heavy animation timeline | unnecessary for a short shell transition and harder to maintain" -m "Confidence: medium" -m "Scope-risk: moderate" -m "Directive: Keep the transition shell ornamental only and do not couple task state to it" -m "Tested: npm run lint -- src/components/ask-wiki/ask-wiki-route-transition.tsx src/components/ask-wiki/ask-wiki-panel.tsx src/components/ask-wiki/ask-wiki-page.tsx" -m "Not-tested: Very small viewport edge cases for origin positioning"
```

## Task 4: Add restrained home-page motion and interaction feedback

**Files:**
- Modify: `site/src/components/home-hero.tsx`
- Modify: `site/src/components/wiki-overview.tsx`
- Modify: `site/src/components/site-footer.tsx`
- Modify: `site/src/app/globals.css`

- [ ] **Step 1: Apply staggered entrance and interactive-surface classes to the home hero**

```tsx
import type { CSSProperties } from "react";

<section className="grain-card motion-stagger rounded-[2rem] border border-line bg-panel-strong p-8 shadow-[0_20px_80px_rgba(73,54,34,0.12)] sm:p-12">
  <div className="home-grid rounded-[1.5rem] border border-white/40 bg-[rgba(255,250,243,0.84)] p-6 sm:p-8">
    <div
      className="motion-stagger flex flex-wrap items-center gap-3 text-xs font-mono uppercase tracking-[0.24em] text-accent-strong"
      style={{ "--motion-delay": "60ms" } as CSSProperties}
    >
      ...
    </div>

    <div
      className="motion-stagger mt-6 max-w-4xl space-y-6"
      style={{ "--motion-delay": "110ms" } as CSSProperties}
    >
      ...
    </div>

    <div
      className="motion-stagger mt-8 flex flex-col gap-4 sm:flex-row"
      style={{ "--motion-delay": "160ms" } as CSSProperties}
    >
      <Link href="/docs" className="surface-interactive pressable inline-flex ...">
        Open the wiki
      </Link>
      <Link href="/docs" className="surface-interactive pressable inline-flex ...">
        Browse the index
      </Link>
    </div>

    <div className="mt-10 grid gap-4 sm:grid-cols-3">
      <div className="motion-stagger surface-interactive rounded-[1.25rem] border border-line bg-white/80 p-4" style={{ "--motion-delay": "220ms" } as CSSProperties}>
        ...
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Apply the same restrained motion language to overview cards and latest-page links**

```tsx
import type { CSSProperties } from "react";

<section className="grid gap-8 lg:grid-cols-[1.35fr_0.95fr]">
  <div className="motion-stagger rounded-[1.8rem] border border-line bg-panel p-6 shadow-[0_14px_60px_rgba(73,54,34,0.08)] sm:p-8" style={{ "--motion-delay": "260ms" } as CSSProperties}>
    ...
    <Link
      key={section.key}
      href={section.href}
      className="surface-interactive group rounded-[1.4rem] border border-line bg-white/80 p-5 transition hover:bg-white"
    >
      ...
    </Link>
  </div>

  <div className="motion-stagger rounded-[1.8rem] border border-line bg-[rgba(23,18,14,0.92)] p-6 text-stone-50 shadow-[0_14px_60px_rgba(33,23,16,0.16)] sm:p-8" style={{ "--motion-delay": "320ms" } as CSSProperties}>
    ...
  </div>
</section>
```

- [ ] **Step 3: Bring the footer links onto the same interaction language**

```tsx
import type { CSSProperties } from "react";

<footer className="motion-stagger flex flex-col gap-3 border-t border-line/80 pt-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between" style={{ "--motion-delay": "360ms" } as CSSProperties}>
  <p>Think Flow wiki frontend built on Next.js + Fumadocs.</p>
  <div className="flex items-center gap-4">
    <Link href="/docs" className="surface-interactive rounded-full px-3 py-1 transition hover:text-foreground">
      Docs
    </Link>
    <Link href="/" className="surface-interactive rounded-full px-3 py-1 transition hover:text-foreground">
      Home
    </Link>
  </div>
</footer>
```

- [ ] **Step 4: Run lint for the home-page component updates**

Run: `npm run lint -- src/components/home-hero.tsx src/components/wiki-overview.tsx src/components/site-footer.tsx`

Expected: PASS with no `no-undef` or `react/jsx-no-duplicate-props` errors.

- [ ] **Step 5: Commit the home-page motion pass**

```bash
git add site/src/components/home-hero.tsx site/src/components/wiki-overview.tsx site/src/components/site-footer.tsx site/src/app/globals.css
git commit -m "Add restrained motion to the home page's core interactions" -m "The home screen now uses one-time entrance sequencing and consistent hover/press feedback to make the interface feel more responsive without changing its information architecture." -m "Constraint: Motion must stay light and avoid looping decorative behavior" -m "Rejected: Add background motion or parallax effects | too noisy for a knowledge product" -m "Confidence: high" -m "Scope-risk: narrow" -m "Directive: Keep all home-page motion optional under prefers-reduced-motion" -m "Tested: npm run lint -- src/components/home-hero.tsx src/components/wiki-overview.tsx src/components/site-footer.tsx" -m "Not-tested: Browser-specific animation timing differences"
```

## Task 5: Run regression checks and manual acceptance

**Files:**
- Verify only: `site/scripts/wiki-query-bridge.test.mjs`
- Verify only: `site/src/app/ask-wiki/page.tsx`
- Verify only: `site/src/components/ask-wiki/*`
- Verify only: `site/src/components/home-hero.tsx`
- Verify only: `site/src/components/wiki-overview.tsx`

- [ ] **Step 1: Re-run the existing Ask Wiki bridge regression tests to ensure the frontend refactor did not break the backend contract**

Run: `node --test scripts/wiki-query-bridge.test.mjs`

Expected: PASS with all existing `buildCodexPrompt`, `buildCodexArgs`, and `parseCodexJsonLine` assertions green.

- [ ] **Step 2: Run full lint for the site**

Run: `npm run lint`

Expected: PASS for the whole `site/` app.

- [ ] **Step 3: Run a production build**

Run: `npm run build`

Expected: PASS with `/ask-wiki` included in the App Router output and no client/server boundary errors.

- [ ] **Step 4: Manually verify the four approved user flows in dev mode**

Run: `npm run dev`

Expected manual checks:

- Home page hero, stats, overview, and footer enter once with short stagger.
- Hover and press feedback is present on hero CTAs, section cards, latest-page links, footer links, and the Ask Wiki launcher.
- Clicking Ask Wiki reveals the compact launcher panel; `Ask now` expands into `/ask-wiki` with a visible origin-aware transition.
- Direct navigation to `/ask-wiki` works without launcher state and still renders the composer and stream area cleanly.

- [ ] **Step 5: Manually verify query-state handling and reduced-motion behavior**

Run: `npm run dev`

Expected manual checks:

- Starting a real query streams output incrementally into the `/ask-wiki` page.
- A failed or disconnected query leaves the question intact and displays the error inline.
- With `prefers-reduced-motion` enabled in browser dev tools or OS settings, the result route skips the large expansion effect but remains fully functional.

- [ ] **Step 6: Commit the verification pass**

```bash
git add site
git commit -m "Verify the Ask Wiki route transition and home-page motion pass" -m "This commit records the final regression and manual validation pass for the restrained-motion frontend update." -m "Constraint: Visual behavior must remain functional under reduced motion" -m "Confidence: medium" -m "Scope-risk: narrow" -m "Directive: Re-run the direct-route and reduced-motion checks before changing the launcher or transition shell again" -m "Tested: node --test scripts/wiki-query-bridge.test.mjs; npm run lint; npm run build; manual home-page and Ask Wiki route checks" -m "Not-tested: Mobile Safari-specific animation behavior on physical devices"
```
