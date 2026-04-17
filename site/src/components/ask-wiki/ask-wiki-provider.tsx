"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AskWikiPanel } from "./ask-wiki-panel";
import type { SearchResult } from "@/lib/wiki-search";
import { writeAskWikiLaunchState } from "./ask-wiki-launch-state";

type SearchResponse = {
  summary: string;
  results: SearchResult[];
  usedPages: string[];
  error?: string;
};

export function AskWikiProvider() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"search" | "query">("search");
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState("idle");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [usedPages, setUsedPages] = useState<string[]>([]);

  const isRunning = status === "queued" || status === "running" || status === "starting";

  const statusText = useMemo(() => {
    if (mode === "search") {
      if (status === "idle") return "Ready to search the wiki.";
      if (status === "queued") return "Search queued.";
      if (status === "running") return "Summarizing matched wiki pages.";
      if (status === "completed") return "Search finished.";
      if (status === "failed") return "Search failed.";
      return status;
    }

    if (status === "idle") return "Open the full Ask Wiki route for deep query.";
    if (status === "queued") return "Opening Ask Wiki route.";
    return status;
  }, [mode, status]);

  if (pathname === "/ask-wiki") {
    return null;
  }

  const launchDeepQuery = () => {
    setStatus("queued");
    setError(null);
    setOutput("");
    setSearchResults([]);
    setUsedPages([]);

    writeAskWikiLaunchState({
      createdAt: Date.now(),
      question: question.trim(),
      autoSubmit: true,
      // The floating launcher button is still encapsulated inside AskWikiPanel.
      origin: null,
    });

    router.push("/ask-wiki");
  };

  const handleSubmit = async () => {
    setIsOpen(true);
    setError(null);
    setOutput("");
    setSearchResults([]);
    setUsedPages([]);
    setStatus("queued");

    if (mode === "search") {
      const response = await fetch("/api/wiki-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      const payload = (await response.json()) as SearchResponse;

      if (!response.ok) {
        setStatus("failed");
        setError(payload.error ?? "Search failed.");
        return;
      }

      setOutput(payload.summary);
      setSearchResults(payload.results);
      setUsedPages(payload.usedPages);
      setStatus("completed");
      return;
    }

    launchDeepQuery();
  };

  return (
    <AskWikiPanel
      isOpen={isOpen}
      isRunning={isRunning}
      mode={mode}
      question={question}
      statusText={statusText}
      output={output}
      error={error}
      searchResults={searchResults}
      usedPages={usedPages}
      onToggle={() => setIsOpen((value) => !value)}
      onModeChange={(nextMode) => {
        setMode(nextMode);
        setStatus("idle");
        setError(null);
        setOutput("");
        setSearchResults([]);
        setUsedPages([]);
      }}
      onQuestionChange={setQuestion}
      onSubmit={() => {
        void handleSubmit();
      }}
    />
  );
}
