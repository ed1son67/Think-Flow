import test from "node:test";
import assert from "node:assert/strict";

import { buildSearchArgs, buildSearchPrompt } from "./wiki-search-bridge.mjs";

test("buildSearchPrompt constrains the model to provided search results", () => {
  const prompt = buildSearchPrompt({
    question: "What does the wiki conclude about agent framework selection?",
    results: [
      {
        title: "AI Agent Framework Selection",
        section: "topics",
        repoPath: "wiki/topics/ai-agent-framework-selection.md",
        snippet: "LangGraph is the default comparison point for general production agents.",
      },
    ],
  });

  assert.match(prompt, /Do not use any tools/u);
  assert.match(prompt, /## 来源/u);
  assert.match(prompt, /wiki\/topics\/ai-agent-framework-selection\.md/u);
});

test("buildSearchArgs runs codex in read-only ephemeral mode", () => {
  const args = buildSearchArgs({
    prompt: "hello",
    lastMessagePath: "/tmp/last-message.txt",
  });

  assert.deepEqual(args.slice(0, 8), [
    "exec",
    "--ephemeral",
    "--sandbox",
    "read-only",
    "--skip-git-repo-check",
    "--output-last-message",
    "/tmp/last-message.txt",
    "-C",
  ]);
});
