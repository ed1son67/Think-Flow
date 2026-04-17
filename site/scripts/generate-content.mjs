import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fromVault } from "fumadocs-obsidian";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const siteRoot = path.resolve(currentDir, "..");
const repoRoot = path.resolve(siteRoot, "..");
const wikiRoot = path.join(repoRoot, "wiki");
const contentDir = path.join(siteRoot, "content", "docs");
const publicDir = path.join(siteRoot, "public", "wiki-assets");

function inferTitle(content, fallback) {
  const heading = content.match(/^#\s+(.+)$/mu)?.[1]?.trim();
  if (heading) return heading;

  return fallback;
}

await rm(contentDir, { recursive: true, force: true });
await rm(publicDir, { recursive: true, force: true });
await mkdir(contentDir, { recursive: true });
await mkdir(publicDir, { recursive: true });

await fromVault({
  dir: wikiRoot,
  include: [
    "**/*.md",
    "**/*.mdx",
    "**/*.png",
    "**/*.jpg",
    "**/*.jpeg",
    "**/*.gif",
    "**/*.svg",
    "**/*.webp",
    "**/*.avif",
  ],
  convert: {
    outputPath: "simple",
    url: (outputPath) => `/wiki-assets/${outputPath}`,
    transformFrontmatter: (frontmatter, ctx) => {
      const normalizedPath = ctx.file.path.replaceAll("\\", "/");
      const fallbackTitle = path.basename(
        normalizedPath,
        path.extname(normalizedPath),
      );

      return {
        ...frontmatter,
        title:
          typeof frontmatter.title === "string"
            && frontmatter.title !== fallbackTitle
            ? frontmatter.title
            : inferTitle(String(ctx.file.content), fallbackTitle),
        repoPath: `wiki/${normalizedPath}`,
        section: normalizedPath.includes("/")
          ? normalizedPath.split("/")[0]
          : "root",
      };
    },
  },
  out: {
    contentDir,
    publicDir,
  },
});
