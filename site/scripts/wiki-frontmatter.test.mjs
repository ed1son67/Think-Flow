import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtemp, writeFile } from "node:fs/promises";

import {
  buildGeneratedFrontmatter,
  extractRawFrontmatter,
} from "./wiki-frontmatter.mjs";

const sampleSource = `---
title: Codex Session Summary - AI Agent Frameworks
type: source
status: active
created: 2026-04-16
updated: 2026-04-16
tags: [codex, ai, agents, frameworks, selection]
source_refs:
  - raw/processed/2026-04-16-session-summary-codex-ai-agent-frameworks.md
topic_refs:
  - wiki/topics/ai-agent-framework-selection.md
---

# Summary

Body.
`;

test("extractRawFrontmatter returns the original yaml block without fences", () => {
  assert.equal(
    extractRawFrontmatter(sampleSource),
    `title: Codex Session Summary - AI Agent Frameworks
type: source
status: active
created: 2026-04-16
updated: 2026-04-16
tags: [codex, ai, agents, frameworks, selection]
source_refs:
  - raw/processed/2026-04-16-session-summary-codex-ai-agent-frameworks.md
topic_refs:
  - wiki/topics/ai-agent-framework-selection.md`,
  );
});

test("buildGeneratedFrontmatter prefers yaml title and preserves yaml text", () => {
  const result = buildGeneratedFrontmatter(
    {
      title: "Summary",
      type: "source",
    },
    {
      content: sampleSource,
      path: "sources/2026-04-16-codex-session-ai-agent-frameworks.md",
    },
  );

  assert.equal(result.title, "Codex Session Summary - AI Agent Frameworks");
  assert.equal(result.section, "sources");
  assert.equal(
    result.repoPath,
    "wiki/sources/2026-04-16-codex-session-ai-agent-frameworks.md",
  );
  assert.match(result.frontmatterYaml, /^title: Codex Session Summary/m);
  assert.doesNotMatch(result.frontmatterYaml, /^---$/m);
});

test("buildGeneratedFrontmatter falls back to heading when yaml title is absent", () => {
  const result = buildGeneratedFrontmatter(
    {},
    {
      content: `# From Heading\n\nBody.`,
      path: "sources/example.md",
    },
  );

  assert.equal(result.title, "From Heading");
});

test("buildGeneratedFrontmatter normalizes dates and mixed arrays into strings", () => {
  const result = buildGeneratedFrontmatter(
    {
      created: new Date("2026-04-16T00:00:00.000Z"),
      updated: new Date("2026-04-17T00:00:00.000Z"),
      tags: ["agent", 2026],
      source_refs: ["a.md", 42],
    },
    {
      content: "# Sample\n\nBody.",
      path: "sources/sample.md",
    },
  );

  assert.equal(result.created, "2026-04-16T00:00:00.000Z");
  assert.equal(result.updated, "2026-04-17T00:00:00.000Z");
  assert.deepEqual(result.tags, ["agent", "2026"]);
  assert.deepEqual(result.source_refs, ["a.md", "42"]);
});

test("buildGeneratedFrontmatter prefers the original vault file when adapter content already rewrote frontmatter", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "think-flow-frontmatter-"));
  const rawFilePath = path.join(tempDir, "source.md");

  await writeFile(rawFilePath, sampleSource, "utf8");

  const result = buildGeneratedFrontmatter(
    {
      title: "Summary",
      type: "source",
    },
    {
      content: "# Summary\n\nBody.",
      path: "sources/source.md",
      _raw: {
        path: rawFilePath,
      },
    },
  );

  assert.equal(result.title, "Codex Session Summary - AI Agent Frameworks");
  assert.match(result.frontmatterYaml, /^title: Codex Session Summary/m);
});
