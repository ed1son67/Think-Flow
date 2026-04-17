import { readFileSync } from "node:fs";
import path from "node:path";

export function extractRawFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/u);
  return match?.[1]?.trim() ?? "";
}

export function extractYamlTitle(rawFrontmatter) {
  const titleLine = rawFrontmatter.match(/^title:\s*(.+)$/mu)?.[1]?.trim();
  if (!titleLine) return undefined;

  return titleLine.replace(/^['"]|['"]$/gu, "");
}

export function inferTitle(content, fallback) {
  const heading = content.match(/^#\s+(.+)$/mu)?.[1]?.trim();
  if (heading) return heading;

  return fallback;
}

function normalizeScalar(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return value;
}

function normalizeStringArray(values) {
  if (!Array.isArray(values)) return values;

  return values.map((value) => {
    const normalized = normalizeScalar(value);
    return typeof normalized === "string" ? normalized : String(normalized);
  });
}

export function buildGeneratedFrontmatter(frontmatter, file) {
  const normalizedPath = file.path.replaceAll("\\", "/");
  const rawContent =
    typeof file?._raw?.path === "string"
      ? readFileSync(file._raw.path, "utf8")
      : String(file.content);
  const rawFrontmatter = extractRawFrontmatter(rawContent);
  const fallbackTitle = path.basename(
    normalizedPath,
    path.extname(normalizedPath),
  );
  const yamlTitle = extractYamlTitle(rawFrontmatter);

  return {
    ...frontmatter,
    created: normalizeScalar(frontmatter.created),
    updated: normalizeScalar(frontmatter.updated),
    tags: normalizeStringArray(frontmatter.tags),
    source_refs: normalizeStringArray(frontmatter.source_refs),
    topic_refs: normalizeStringArray(frontmatter.topic_refs),
    title:
      typeof yamlTitle === "string" && yamlTitle.length > 0
        ? yamlTitle
        : inferTitle(rawContent, fallbackTitle),
    repoPath: `wiki/${normalizedPath}`,
    section: normalizedPath.includes("/") ? normalizedPath.split("/")[0] : "root",
    frontmatterYaml: rawFrontmatter || undefined,
  };
}
