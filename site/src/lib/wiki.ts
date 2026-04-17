import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

type SectionKey = "topics" | "sources" | "syntheses";

type SectionCard = {
  key: SectionKey;
  label: string;
  description: string;
  count: number;
  href: string;
  sampleTitle: string;
};

type LatestPage = {
  title: string;
  href: string;
  updatedAt: string;
  relativePath: string;
};

export type WikiOverview = {
  totalPages: number;
  sections: SectionCard[];
  latestPages: LatestPage[];
};

const sectionInfo: Record<SectionKey, Omit<SectionCard, "count" | "href" | "sampleTitle">> = {
  topics: {
    key: "topics",
    label: "Topics",
    description: "Canonical pages for durable concepts and reusable conclusions.",
  },
  sources: {
    key: "sources",
    label: "Sources",
    description: "Evidence pages that keep source traceability close to the wiki.",
  },
  syntheses: {
    key: "syntheses",
    label: "Syntheses",
    description: "High-value analysis pages that connect multiple sources and ideas.",
  },
};

function getWikiRoot() {
  return path.resolve(process.cwd(), "..", "wiki");
}

function toDocsUrl(relativePath: string) {
  const normalized = relativePath.replaceAll(path.sep, "/");
  const withoutExtension = normalized.replace(/\.mdx?$/u, "");

  if (withoutExtension === "index") return "/docs";

  return `/docs/${withoutExtension}`;
}

function extractTitle(raw: string, fallback: string) {
  const frontmatterTitle = raw.match(/^title:\s*(.+)$/mu)?.[1]?.trim();
  if (frontmatterTitle) return frontmatterTitle.replace(/^['"]|['"]$/gu, "");

  const heading = raw.match(/^#\s+(.+)$/mu)?.[1]?.trim();
  if (heading) return heading;

  return fallback;
}

async function collectMarkdownFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      if (entry.name.startsWith(".")) return [];

      const fullPath = path.join(root, entry.name);
      if (entry.isDirectory()) return collectMarkdownFiles(fullPath);
      if (!entry.isFile()) return [];
      if (!entry.name.endsWith(".md") && !entry.name.endsWith(".mdx")) return [];

      return [fullPath];
    }),
  );

  return files.flat();
}

async function readMarkdownInfo(fullPath: string) {
  const raw = await readFile(fullPath, "utf8");
  const relativePath = path.relative(getWikiRoot(), fullPath);
  const fileStat = await stat(fullPath);

  return {
    fullPath,
    relativePath,
    href: toDocsUrl(relativePath),
    title: extractTitle(raw, path.basename(fullPath, path.extname(fullPath))),
    updatedAt: fileStat.mtime,
  };
}

export async function getWikiOverview(): Promise<WikiOverview> {
  const wikiRoot = getWikiRoot();
  const allFiles = await collectMarkdownFiles(wikiRoot);
  const allPages = await Promise.all(allFiles.map(readMarkdownInfo));

  const sections = await Promise.all(
    (Object.keys(sectionInfo) as SectionKey[]).map(async (key) => {
      const prefix = `${key}${path.sep}`;
      const pages = allPages
        .filter((page) => page.relativePath.startsWith(prefix))
        .sort((left, right) => left.relativePath.localeCompare(right.relativePath));
      const firstPage = pages[0];

      return {
        ...sectionInfo[key],
        count: pages.length,
        href: firstPage?.href ?? "/docs",
        sampleTitle: firstPage?.title ?? "Empty section",
      };
    }),
  );

  const latestPages = allPages
    .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())
    .slice(0, 4)
    .map((page) => ({
      title: page.title,
      href: page.href,
      updatedAt: page.updatedAt.toISOString().slice(0, 10),
      relativePath: page.relativePath.replaceAll(path.sep, "/"),
    }));

  return {
    totalPages: allPages.length,
    sections,
    latestPages,
  };
}
