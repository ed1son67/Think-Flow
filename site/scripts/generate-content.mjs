import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fromVault } from "fumadocs-obsidian";
import { buildGeneratedFrontmatter } from "./wiki-frontmatter.mjs";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const siteRoot = path.resolve(currentDir, "..");
const repoRoot = path.resolve(siteRoot, "..");
const wikiRoot = path.join(repoRoot, "wiki");
const contentDir = path.join(siteRoot, "content", "docs");
const publicDir = path.join(siteRoot, "public", "wiki-assets");

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
    transformFrontmatter: (frontmatter, ctx) =>
      buildGeneratedFrontmatter(frontmatter, ctx.file),
  },
  out: {
    contentDir,
    publicDir,
  },
});
