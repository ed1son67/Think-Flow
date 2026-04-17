"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Link from "next/link";
import { Streamdown } from "streamdown";
import "streamdown/styles.css";
import type { SearchResult } from "@/lib/wiki-search";
import {
  clearAskWikiLaunchState,
  readAskWikiLaunchState,
} from "./ask-wiki-launch-state";
import { AskWikiReferenceRail } from "./ask-wiki-reference-rail";
import { AskWikiRouteTransition } from "./ask-wiki-route-transition";
import { AskWikiThinkingPanel } from "./ask-wiki-thinking-panel";
import {
  buildEvidenceItems,
  buildQuerySourceItems,
  buildSearchSourceItems,
  getModeDescription,
  getStatusText,
  getThinkingSummary,
  type AskWikiMode,
  type ProcessItem,
} from "./ask-wiki-view-model";

type QueryCreateResponse = {
  taskId?: string;
  status?: string;
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

type SearchResponse = {
  error?: string;
};

type SearchStreamEvent =
  | {
      type: "status";
      status: string;
      message: string;
    }
  | {
      type: "results";
      results: SearchResult[];
    }
  | {
      type: "chunk";
      text: string;
    }
  | {
      type: "summary";
      summary: string;
      usedPages: string[];
    }
  | {
      type: "error";
      error: string;
    };

function ModeToggle({
  mode,
  onChange,
}: {
  mode: AskWikiMode;
  onChange: (mode: AskWikiMode) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-white/75 p-0.75">
      <button
        type="button"
        onClick={() => onChange("search")}
        className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
          mode === "search"
            ? "bg-accent text-white"
            : "text-foreground hover:bg-white"
        }`}
      >
        Search
      </button>
      <button
        type="button"
        onClick={() => onChange("query")}
        className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
          mode === "query"
            ? "bg-accent text-white"
            : "text-foreground hover:bg-white"
        }`}
      >
        Deep Query
      </button>
    </div>
  );
}

export function AskWikiPage() {
  const [launchState] = useState(readAskWikiLaunchState);
  const [mode, setMode] = useState<AskWikiMode>("search");
  const [question, setQuestion] = useState(() => launchState?.question ?? "");
  const [submittedQuestion, setSubmittedQuestion] = useState<string | null>(
    null,
  );
  const [status, setStatus] = useState("idle");
  const [statusDetail, setStatusDetail] = useState("");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [queryEvidenceResults, setQueryEvidenceResults] = useState<SearchResult[]>([]);
  const [usedPages, setUsedPages] = useState<string[]>([]);
  const [processItems, setProcessItems] = useState<ProcessItem[]>([]);
  const [thinkingOpen, setThinkingOpen] = useState(true);
  const streamRef = useRef<EventSource | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const searchRequestIdRef = useRef(0);
  const hasConsumedLaunchState = useRef(false);

  const isRunning =
    status === "queued" || status === "starting" || status === "running";

  const sourceItems = useMemo(
    () =>
      mode === "search"
        ? buildSearchSourceItems(searchResults, usedPages)
        : queryEvidenceResults.length > 0
          ? buildSearchSourceItems(
              queryEvidenceResults,
              buildQuerySourceItems(output).map((item) => item.detail),
            )
          : buildQuerySourceItems(output),
    [mode, output, queryEvidenceResults, searchResults, usedPages],
  );
  const evidenceItems = useMemo(
    () =>
      buildEvidenceItems({
        sourceItems,
      }),
    [sourceItems],
  );

  const statusLabel = statusDetail || getStatusText(mode, status);

  const appendProcessItem = useCallback(
    (label: string, tone: ProcessItem["tone"] = "neutral") => {
      setProcessItems((current) => {
        const previous = current.at(-1);
        if (previous?.label === label && previous.tone === tone) {
          return current;
        }

        return [
          ...current,
          {
            id: `${Date.now()}-${current.length}`,
            label,
            tone,
          },
        ];
      });
    },
    [],
  );

  const closeStream = useCallback(() => {
    streamRef.current?.close();
    streamRef.current = null;
    searchAbortRef.current?.abort();
    searchAbortRef.current = null;
  }, []);

  const resetConversation = useCallback(() => {
    closeStream();
    setSubmittedQuestion(null);
    setTaskId(null);
    setStatus("idle");
    setStatusDetail("");
    setOutput("");
    setError(null);
    setSearchResults([]);
    setQueryEvidenceResults([]);
    setUsedPages([]);
    setProcessItems([]);
  }, [closeStream]);

  const connectToTask = useCallback(
    (id: string) => {
      closeStream();

      const stream = new EventSource(`/api/wiki-query/${id}/stream`);
      streamRef.current = stream;

      stream.onmessage = (event) => {
        const payload = JSON.parse(event.data) as QueryStreamEvent;

        if (payload.type === "state" && payload.status) {
          setStatus(payload.status);
          setStatusDetail(getStatusText("query", payload.status));
          appendProcessItem(
            getStatusText("query", payload.status),
            payload.status === "failed"
              ? "error"
              : payload.status === "completed"
                ? "success"
                : "neutral",
          );

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
          setStatusDetail(payload.message);
          appendProcessItem(payload.message);
          return;
        }

        if (payload.type === "chunk" && payload.text) {
          const text = payload.text;
          setOutput((current) => (current ? `${current}${text}` : text));
          return;
        }

        if (payload.type === "final" && payload.text) {
          setOutput(payload.text);
          return;
        }

        if (payload.type === "stderr" && payload.text) {
          setError(payload.text);
          appendProcessItem(payload.text, "error");
          return;
        }

        if (payload.type === "error") {
          setStatus("failed");
          setStatusDetail("The query run failed.");
          setError(payload.message ?? payload.error ?? "Wiki query failed.");
          appendProcessItem(
            payload.message ?? payload.error ?? "Wiki query failed.",
            "error",
          );
          closeStream();
        }
      };

      stream.onerror = () => {
        setStatus("failed");
        setStatusDetail("The query stream disconnected.");
        setError("The query stream disconnected.");
        appendProcessItem("The query stream disconnected.", "error");
        closeStream();
      };
    },
    [appendProcessItem, closeStream],
  );

  const handleSearch = useCallback(
    async (finalQuestion: string, requestId: number) => {
      searchAbortRef.current?.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;

      const response = await fetch("/api/wiki-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: finalQuestion }),
        signal: controller.signal,
      });

      if (!response.ok) {
        if (requestId !== searchRequestIdRef.current) return;
        const payload = (await response.json()) as SearchResponse;
        setStatus("failed");
        setStatusDetail("The search request failed.");
        setError(payload.error ?? "Search failed.");
        appendProcessItem(payload.error ?? "Search failed.", "error");
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        if (requestId !== searchRequestIdRef.current) return;
        setStatus("failed");
        setStatusDetail("The search stream was unavailable.");
        setError("Search stream was unavailable.");
        appendProcessItem("Search stream was unavailable.", "error");
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (requestId !== searchRequestIdRef.current) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          const payload = JSON.parse(trimmed) as SearchStreamEvent;
          if (requestId !== searchRequestIdRef.current) continue;

          if (payload.type === "status") {
            setStatus(payload.status);
            setStatusDetail(payload.message);
            appendProcessItem(
              payload.message,
              payload.status === "failed"
                ? "error"
                : payload.status === "completed"
                  ? "success"
                  : "neutral",
            );
            continue;
          }

          if (payload.type === "results") {
            setSearchResults(payload.results);
            appendProcessItem(
              payload.results.length > 0
                ? `Matched ${payload.results.length} wiki pages.`
                : "No strong wiki matches were found.",
              payload.results.length > 0 ? "success" : "neutral",
            );
            continue;
          }

          if (payload.type === "chunk") {
            setOutput((current) =>
              current ? `${current}${payload.text}` : payload.text,
            );
            continue;
          }

          if (payload.type === "summary") {
            setOutput(payload.summary);
            setUsedPages(payload.usedPages);
            appendProcessItem("Summary ready.", "success");
            continue;
          }

          if (payload.type === "error") {
            setStatus("failed");
            setStatusDetail("The search stream failed.");
            setError(payload.error);
            appendProcessItem(payload.error, "error");
          }
        }
      }
    },
    [appendProcessItem],
  );

  const handleSubmit = useCallback(
    async (nextQuestion?: string) => {
      const finalQuestion = (nextQuestion ?? question).trim();
      if (!finalQuestion) return;

      closeStream();
      setQuestion(finalQuestion);
      setSubmittedQuestion(finalQuestion);
      setTaskId(null);
      setStatus("queued");
      setStatusDetail(
        mode === "search" ? "Preparing wiki search." : "Preparing deep query.",
      );
      setOutput("");
      setError(null);
      setSearchResults([]);
      setQueryEvidenceResults([]);
      setUsedPages([]);
      setProcessItems([]);
      appendProcessItem(
        mode === "search" ? "Preparing wiki search." : "Preparing deep query.",
      );

      if (mode === "search") {
        const requestId = Date.now();
        searchRequestIdRef.current = requestId;
        await handleSearch(finalQuestion, requestId);
        return;
      }

      try {
        const response = await fetch("/api/wiki-query", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ question: finalQuestion }),
        });

        const payload = (await response.json()) as QueryCreateResponse;

        if (!response.ok) {
          if (response.status === 409 && payload.taskId) {
            setTaskId(payload.taskId);
            setError(
              "A query is already running. Attached to the active task.",
            );
            connectToTask(payload.taskId);
            return;
          }

          setStatus("failed");
          setStatusDetail("Failed to start the wiki query.");
          setError(payload.error ?? "Failed to start the wiki query.");
          appendProcessItem(
            payload.error ?? "Failed to start the wiki query.",
            "error",
          );
          return;
        }

        if (!payload.taskId) {
          setStatus("failed");
          setStatusDetail("The wiki query API did not return a task id.");
          setError("The wiki query API did not return a task id.");
          appendProcessItem(
            "The wiki query API did not return a task id.",
            "error",
          );
          return;
        }

        setTaskId(payload.taskId);
        setStatus(payload.status ?? "queued");
        setStatusDetail("Connecting to live query output.");
        appendProcessItem("Connecting to live query output.");
        connectToTask(payload.taskId);
      } catch (submitError) {
        setStatus("failed");
        setStatusDetail("Failed to start the wiki query.");
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Failed to start the wiki query.",
        );
        appendProcessItem(
          submitError instanceof Error
            ? submitError.message
            : "Failed to start the wiki query.",
          "error",
        );
      }
    },
    [
      appendProcessItem,
      closeStream,
      connectToTask,
      handleSearch,
      mode,
      question,
    ],
  );

  useEffect(() => {
    return () => {
      streamRef.current?.close();
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (hasConsumedLaunchState.current) return;
    hasConsumedLaunchState.current = true;

    if (!launchState) return;

    const autoQuestion = launchState.autoSubmit
      ? launchState.question.trim()
      : "";

    clearAskWikiLaunchState();

    if (!autoQuestion) return;

    const timeoutId = window.setTimeout(() => {
      void handleSubmit(autoQuestion);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [launchState]);

  useEffect(() => {
    if (mode !== "query") return;
    if (!submittedQuestion?.trim()) return;

    const paths = buildQuerySourceItems(output).map((item) => item.detail);
    if (paths.length === 0) {
      setQueryEvidenceResults([]);
      return;
    }

    let cancelled = false;

    const run = async () => {
      const response = await fetch("/api/wiki-evidence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paths,
          query: submittedQuestion,
        }),
      });

      if (!response.ok) return;
      const payload = (await response.json()) as { results?: SearchResult[] };
      if (cancelled) return;
      setQueryEvidenceResults(payload.results ?? []);
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [mode, output, submittedQuestion]);

  useEffect(() => {
    if (status === "completed") {
      setThinkingOpen(false);
      return;
    }

    if (status === "queued" || status === "starting" || status === "running") {
      setThinkingOpen(true);
    }
  }, [status]);

  return (
    <AskWikiRouteTransition origin={launchState?.origin ?? null}>
      <main className="page-shell min-h-screen">
        <div className="mx-auto flex w-full max-w-7xl flex-col px-5 py-8 sm:px-8 sm:py-10">
          <div
            className="motion-stagger flex items-center justify-between gap-4"
            style={{ "--motion-delay": "40ms" } as CSSProperties}
          >
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.22em] text-accent-strong">
                Ask Wiki
              </p>
            </div>
            <Link
              href="/docs"
              className="surface-interactive rounded-xl border border-line bg-white/75 px-4 py-2 text-sm font-medium text-foreground"
            >
              Back to docs
            </Link>
          </div>

          <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="space-y-6">
              <section
                className="motion-stagger ask-glass-panel overflow-hidden rounded-[1.7rem] p-6 sm:p-7"
                style={{ "--motion-delay": "90ms" } as CSSProperties}
              >
                <div className="min-w-0">
                  <p className="text-xs font-mono uppercase tracking-[0.22em] text-accent-strong">
                    Workspace
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-foreground">
                    {submittedQuestion ?? "Ask anything"}
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
                    {getModeDescription(mode)}
                  </p>
                </div>

                <div className="mt-6">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-foreground">
                      Question
                    </span>
                    <div className="ask-glass-input overflow-hidden rounded-[1.15rem] border border-white/45">
                      <textarea
                        value={question}
                        onChange={(event) => setQuestion(event.target.value)}
                        rows={2}
                        placeholder="Ask the wiki a question..."
                        className="w-full resize-none bg-transparent px-4 py-3 text-sm leading-7 text-foreground outline-none"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/45 px-4 py-3">
                        <ModeToggle
                          mode={mode}
                          onChange={(nextMode) => {
                            setMode(nextMode);
                            resetConversation();
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => void handleSubmit()}
                          disabled={isRunning || question.trim().length === 0}
                          className="pressable inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[9rem]"
                        >
                          {isRunning
                            ? mode === "search"
                              ? "Searching..."
                              : "Running..."
                            : mode === "search"
                              ? "Ask Wiki"
                              : "Run Deep Query"}
                        </button>
                      </div>
                    </div>
                  </label>
                </div>
              </section>

              <section
                className="motion-stagger rounded-[1.65rem] border border-line bg-[rgba(255,251,246,0.9)] p-6 shadow-[0_24px_80px_rgba(43,32,19,0.10)] sm:p-7"
                style={{ "--motion-delay": "140ms" } as CSSProperties}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[0.72rem] uppercase tracking-[0.22em] text-accent-strong">
                      Answer
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-foreground">
                      {submittedQuestion
                        ? "Wiki Response"
                        : "Ready when you are"}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {submittedQuestion
                        ? "The answer stays on the left while evidence and scan details live on the right."
                        : "Submit a question to start streaming an answer into this workspace."}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col rounded-[1.35rem] border border-line bg-panel-strong p-5 shadow-none sm:p-6">
                  <AskWikiThinkingPanel
                    isOpen={thinkingOpen}
                    isRunning={isRunning}
                    statusLabel={statusLabel}
                    summary={getThinkingSummary(processItems, statusLabel)}
                    taskId={taskId}
                    items={processItems}
                    onToggle={() => setThinkingOpen((value) => !value)}
                  />

                  {output ? (
                    <div className="ask-wiki-markdown mt-5">
                      <Streamdown
                        className="text-sm leading-7 text-foreground"
                        mode={isRunning ? "streaming" : "static"}
                        isAnimating={isRunning}
                      >
                        {output}
                      </Streamdown>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-[1rem] border border-dashed border-line bg-white/72 px-4 py-5">
                      <p className="text-sm leading-7 text-muted">
                        {isRunning
                          ? "The answer is streaming into this card."
                          : "Your answer will appear here after you submit a question."}
                      </p>
                    </div>
                  )}

                  {error ? (
                    <div className="mt-5 rounded-[0.9rem] border border-[rgba(141,47,17,0.2)] bg-[rgba(191,91,36,0.08)] px-4 py-3 text-sm leading-6 text-accent-strong">
                      {error}
                    </div>
                  ) : null}
                </div>
              </section>
            </div>

            <div
              className="motion-stagger min-w-0 xl:sticky xl:top-6 xl:self-start"
              style={{ "--motion-delay": "190ms" } as CSSProperties}
            >
              <AskWikiReferenceRail items={evidenceItems} />
            </div>
          </section>
        </div>
      </main>
    </AskWikiRouteTransition>
  );
}
