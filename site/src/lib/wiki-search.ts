import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export type SearchSection = "root" | "topics" | "syntheses" | "sources";

export type SearchDocument = {
  id: string;
  title: string;
  section: SearchSection;
  href: string;
  repoPath: string;
  content: string;
};

export type SearchResult = {
  id: string;
  title: string;
  section: SearchSection;
  href: string;
  repoPath: string;
  snippet: string;
  score: number;
};

const PRIMARY_SECTIONS: SearchSection[] = ["root", "topics", "syntheses"];
const SECONDARY_SECTIONS: SearchSection[] = ["sources"];
const STOP_TOKENS = new Set([
  "what",
  "does",
  "do",
  "the",
  "a",
  "an",
  "about",
  "current",
  "wiki",
  "conclude",
  "conclusion",
  "tell",
  "show",
  "is",
  "are",
  "was",
  "were",
  "how",
  "why",
  "which",
  "when",
  "where",
  "who",
  "吗",
  "呢",
  "呀",
  "吧",
  "是什么",
  "什么",
  "怎么",
  "如何",
  "为什么",
  "结论",
  "当前",
]);

function getDocsRoot() {
  return path.join(process.cwd(), "content", "docs");
}

function toHref(relativePath: string) {
  const normalized = relativePath.replaceAll(path.sep, "/");
  const withoutExtension = normalized.replace(/\.mdx?$/u, "");

  if (withoutExtension === "index") return "/docs";

  return `/docs/${withoutExtension}`;
}

function parseFrontmatter(raw: string) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/u);
  const block = match?.[1] ?? "";

  return {
    title:
      block.match(/^title:\s*(.+)$/mu)?.[1]?.trim().replace(/^['"]|['"]$/gu, "") ??
      undefined,
    repoPath:
      block.match(/^repoPath:\s*(.+)$/mu)?.[1]?.trim().replace(/^['"]|['"]$/gu, "") ??
      undefined,
    section:
      block.match(/^section:\s*(.+)$/mu)?.[1]?.trim().replace(/^['"]|['"]$/gu, "") ??
      undefined,
    content: raw.replace(/^---\n[\s\S]*?\n---\n?/u, "").trim(),
  };
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[`*_#[\]()>-]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function tokenize(value: string) {
  const normalized = normalizeText(value);
  const tokens = normalized
    .split(/[\s/]+/u)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
    .filter((token) => !STOP_TOKENS.has(token));

  return Array.from(new Set(tokens));
}

function countOccurrences(haystack: string, needle: string) {
  if (!needle) return 0;

  let count = 0;
  let start = 0;

  while (true) {
    const index = haystack.indexOf(needle, start);
    if (index === -1) return count;
    count += 1;
    start = index + needle.length;
  }
}

function extractSnippet(rawContent: string, query: string, tokens: string[]) {
  const compact = rawContent.replace(/\s+/gu, " ").trim();
  const normalized = normalizeText(compact);
  const target =
    [normalizeText(query), ...tokens].find((token) => normalized.includes(token)) ?? "";

  if (!target) {
    return compact.slice(0, 240);
  }

  const index = normalized.indexOf(target);
  if (index === -1) return compact.slice(0, 240);

  const start = Math.max(0, index - 80);
  const end = Math.min(compact.length, index + target.length + 160);
  const snippet = compact.slice(start, end);

  return start > 0 ? `...${snippet}` : snippet;
}

export function buildEvidenceResults(
  documents: SearchDocument[],
  repoPaths: string[],
  query: string,
) {
  const tokens = tokenize(query);
  const byRepoPath = new Map(
    documents.map((document) => [document.repoPath, document]),
  );

  return repoPaths
    .map((repoPath) => {
      const document = byRepoPath.get(repoPath);
      if (!document) return null;

      return {
        id: document.id,
        title: document.title,
        section: document.section,
        href: document.href,
        repoPath: document.repoPath,
        score: 0,
        snippet: extractSnippet(document.content, query, tokens),
      } satisfies SearchResult;
    })
    .filter((result): result is SearchResult => result !== null);
}

function scoreDocument(document: SearchDocument, query: string, tokens: string[]) {
  const normalizedTitle = normalizeText(document.title);
  const normalizedContent = normalizeText(document.content);
  const normalizedQuery = normalizeText(query);
  const sectionWeight =
    document.section === "topics"
      ? 78
      : document.section === "syntheses"
        ? 54
        : document.section === "root"
          ? 4
          : 18;

  const queryInTitle = normalizedTitle.includes(normalizedQuery);
  const queryInContent = normalizedContent.includes(normalizedQuery);

  const matchedTitleTokens = tokens.filter((token) =>
    normalizedTitle.includes(token),
  ).length;
  const matchedContentTokens = tokens.filter((token) =>
    normalizedContent.includes(token),
  ).length;
  const hasAnyMatch =
    queryInTitle || queryInContent || matchedTitleTokens > 0 || matchedContentTokens > 0;

  if (!hasAnyMatch) {
    return 0;
  }

  let score = sectionWeight;

  if (queryInTitle) score += 120;
  if (queryInContent) score += 45;

  const titleCoverage = tokens.length > 0 ? matchedTitleTokens / tokens.length : 0;
  score += matchedTitleTokens * 14;
  score += Math.round(titleCoverage * 60);

  if (document.section === "topics") {
    score += Math.round(titleCoverage * 24);
  }

  for (const token of tokens) {
    score += countOccurrences(normalizedTitle, token) * 18;
    score += countOccurrences(normalizedContent, token) * 6;
  }

  return score;
}

async function collectDocs(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      if (entry.name.startsWith(".")) return [];
      const fullPath = path.join(root, entry.name);

      if (entry.isDirectory()) return collectDocs(fullPath);
      if (!entry.isFile()) return [];
      if (!entry.name.endsWith(".mdx")) return [];

      return [fullPath];
    }),
  );

  return nested.flat();
}

export async function loadSearchDocuments() {
  const docsRoot = getDocsRoot();
  const files = await collectDocs(docsRoot);

  return Promise.all(
    files.map(async (filePath) => {
      const relativePath = path.relative(docsRoot, filePath);
      const raw = await readFile(filePath, "utf8");
      const frontmatter = parseFrontmatter(raw);
      const title =
        frontmatter.title ??
        frontmatter.content.match(/^#\s+(.+)$/mu)?.[1]?.trim() ??
        path.basename(filePath, ".mdx");
      const section = (frontmatter.section ?? "root") as SearchSection;

      return {
        id: relativePath.replaceAll(path.sep, "/"),
        title,
        section,
        href: toHref(relativePath),
        repoPath: frontmatter.repoPath ?? `wiki/${relativePath.replace(/\.mdx$/u, ".md")}`,
        content: frontmatter.content,
      } satisfies SearchDocument;
    }),
  );
}

export function rankSearchResults(documents: SearchDocument[], query: string) {
  const tokens = tokenize(query);
  const primary = documents
    .filter((document) => {
      if (!PRIMARY_SECTIONS.includes(document.section)) return false;
      if (document.section === "root" && document.id !== "index.mdx") return false;
      return true;
    })
    .map((document) => ({
      document,
      score: scoreDocument(document, query, tokens),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  const shouldExpandToSources =
    primary.length < 3 || (primary[0]?.score ?? 0) < 80;

  const secondary = shouldExpandToSources
    ? documents
        .filter((document) => SECONDARY_SECTIONS.includes(document.section))
        .map((document) => ({
          document,
          score: scoreDocument(document, query, tokens),
        }))
        .filter((entry) => entry.score > 0)
        .sort((left, right) => right.score - left.score)
    : [];

  const merged = [...primary, ...secondary]
    .sort((left, right) => right.score - left.score)
    .slice(0, 6)
    .map(({ document, score }) => ({
      id: document.id,
      title: document.title,
      section: document.section,
      href: document.href,
      repoPath: document.repoPath,
      score,
      snippet: extractSnippet(document.content, query, tokens),
    })) satisfies SearchResult[];

  return merged;
}
