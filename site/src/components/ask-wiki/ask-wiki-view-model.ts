import type { SearchResult } from "@/lib/wiki-search";

export type AskWikiMode = "search" | "query";

export type SourceItem = {
  key: string;
  label: string;
  href: string;
  detail: string;
  excerpt?: string;
  usedInAnswer?: boolean;
};

export type ProcessItem = {
  id: string;
  label: string;
  tone: "neutral" | "success" | "error";
};

export type EvidenceItem = {
  key: string;
  kind: "source" | "process";
  label: string;
  detail: string;
  note: string;
  tone: ProcessItem["tone"];
  defaultOpen: boolean;
  href?: string;
  usedInAnswer?: boolean;
};

export function getStatusText(mode: AskWikiMode, status: string) {
  if (mode === "search") {
    if (status === "idle") return "Ready to search the wiki.";
    if (status === "queued") return "Search queued.";
    if (status === "running") return "Summarizing matched wiki pages.";
    if (status === "completed") return "Search finished.";
    if (status === "failed") return "Search failed.";
    return status;
  }

  if (status === "idle") return "Ready to query the local Think Flow workflow.";
  if (status === "queued") return "Task queued.";
  if (status === "starting") return "Starting local Codex query.";
  if (status === "running") return "Streaming task output.";
  if (status === "completed") return "Query finished.";
  if (status === "failed") return "Query failed.";
  return status;
}

export function getModeTitle(mode: AskWikiMode) {
  return mode === "search" ? "Search" : "Deep Query";
}

export function getModeDescription(mode: AskWikiMode) {
  return mode === "search"
    ? "Fast, read-only retrieval with a short synthesized answer."
    : "Slower, writable analysis that runs the local Codex Think Flow workflow.";
}

export function repoPathToHref(repoPath: string) {
  const normalized = repoPath.replace(/^wiki\//u, "").replace(/\.md$/u, "");
  if (normalized === "index") return "/docs";
  return `/docs/${normalized}`;
}

export function formatSourceLabel(repoPath: string) {
  const normalized = repoPath.replace(/^wiki\//u, "").replace(/\.md$/u, "");
  const leaf = normalized.split("/").at(-1) ?? normalized;
  return leaf.replace(/[-_]/gu, " ");
}

export function extractQuerySourcePaths(answer: string) {
  const sourceBlock = answer.match(/##\s*来源([\s\S]*)$/u)?.[1] ?? answer;
  const matches = Array.from(
    sourceBlock.matchAll(/`?(wiki\/[^\s`)\]]+\.md)`?/gu),
    (match) => match[1],
  );

  return Array.from(new Set(matches));
}

export function buildSearchSourceItems(
  searchResults: SearchResult[],
  usedPages: string[],
): SourceItem[] {
  const resultByPath = new Map(
    searchResults.map((result) => [result.repoPath, result]),
  );
  const orderedPaths = [
    ...usedPages,
    ...searchResults.map((result) => result.repoPath),
  ].filter((repoPath, index, array) => array.indexOf(repoPath) === index);

  return orderedPaths.map((repoPath) => {
    const result = resultByPath.get(repoPath);
    return {
      key: repoPath,
      label: result?.title ?? formatSourceLabel(repoPath),
      href: result?.href ?? repoPathToHref(repoPath),
      detail: repoPath,
      excerpt: result?.snippet,
      usedInAnswer: usedPages.includes(repoPath),
    };
  });
}

export function buildQuerySourceItems(output: string): SourceItem[] {
  return extractQuerySourcePaths(output).map((repoPath) => ({
    key: repoPath,
    label: formatSourceLabel(repoPath),
    href: repoPathToHref(repoPath),
    detail: repoPath,
  }));
}

export function buildEvidenceItems({
  sourceItems,
}: {
  sourceItems: SourceItem[];
}): EvidenceItem[] {
  if (sourceItems.length === 0) {
    return [];
  }

  if (sourceItems.length > 0) {
    return sourceItems.map((item, index) => ({
      key: item.key,
      kind: "source",
      label: item.label,
      detail: item.detail,
      note:
        item.excerpt
          ? item.usedInAnswer
            ? `Used directly in the answer. ${item.excerpt}`
            : `High-ranking supporting match. ${item.excerpt}`
          : item.usedInAnswer
            ? "Used in the answer. Open the document page to inspect the full context."
            : "Strong supporting match. Open the document page to inspect the full context.",
      tone: item.usedInAnswer ? "success" : "neutral",
      defaultOpen: item.usedInAnswer ? index === 0 : false,
      href: item.href,
      usedInAnswer: item.usedInAnswer ?? false,
    }));
  }

  return [];
}

export function getThinkingSummary(
  processItems: ProcessItem[],
  statusLabel: string,
) {
  if (processItems.length === 0) {
    return statusLabel;
  }

  const latest = processItems.at(-1);
  if (!latest) return statusLabel;

  if (processItems.length === 1) {
    return latest.label;
  }

  return `${processItems.length} steps · ${latest.label}`;
}
