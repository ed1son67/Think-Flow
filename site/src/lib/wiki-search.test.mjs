import test from "node:test";
import assert from "node:assert/strict";

import { rankSearchResults } from "./wiki-search.ts";

test("ranks the topical page above the index page for framework selection queries", () => {
  const results = rankSearchResults(
    [
      {
        id: "index.mdx",
        title: "Index",
        section: "root",
        href: "/docs",
        repoPath: "wiki/index.md",
        content:
          "Topics include AI Agent Framework Selection and other index entries.",
      },
      {
        id: "topics/ai-agent-framework-selection.mdx",
        title: "AI Agent Framework Selection",
        section: "topics",
        href: "/docs/topics/ai-agent-framework-selection",
        repoPath: "wiki/topics/ai-agent-framework-selection.md",
        content:
          "Agent framework selection should be scenario-driven. LangGraph, LlamaIndex, PydanticAI.",
      },
      {
        id: "syntheses/what-framework-is-best-for-building-agents-in-2026.mdx",
        title: "What Framework Is Best for Building Agents in 2026",
        section: "syntheses",
        href: "/docs/syntheses/what-framework-is-best-for-building-agents-in-2026",
        repoPath: "wiki/syntheses/what-framework-is-best-for-building-agents-in-2026.md",
        content:
          "Framework choice depends on the job shape instead of one overall winner.",
      },
    ],
    "What does the current wiki conclude about agent framework selection?",
  );

  assert.equal(results[0]?.repoPath, "wiki/topics/ai-agent-framework-selection.md");
});

test("ignores generic 是什么 filler so langchain queries do not surface unrelated pages first", () => {
  const results = rankSearchResults(
    [
      {
        id: "topics/software-development-validation-methods.mdx",
        title: "Software Development Validation Methods",
        section: "topics",
        href: "/docs/topics/software-development-validation-methods",
        repoPath: "wiki/topics/software-development-validation-methods.md",
        content: "ATDD 是什么？TDD 是什么？这是软件验证方法综述。",
      },
      {
        id: "syntheses/what-is-langchain.mdx",
        title: "What Is LangChain",
        section: "syntheses",
        href: "/docs/syntheses/what-is-langchain",
        repoPath: "wiki/syntheses/what-is-langchain.md",
        content: "LangChain 是什么？它是面向 AI Agent 开发的框架生态。",
      },
    ],
    "langchain 是什么",
  );

  assert.equal(results[0]?.repoPath, "wiki/syntheses/what-is-langchain.md");
});

test("does not return results for greetings with no actual content match", () => {
  const results = rankSearchResults(
    [
      {
        id: "topics/ai-agent-framework-selection.mdx",
        title: "AI Agent Framework Selection",
        section: "topics",
        href: "/docs/topics/ai-agent-framework-selection",
        repoPath: "wiki/topics/ai-agent-framework-selection.md",
        content: "Framework choice should be scenario-driven.",
      },
      {
        id: "topics/software-development-validation-methods.mdx",
        title: "Software Development Validation Methods",
        section: "topics",
        href: "/docs/topics/software-development-validation-methods",
        repoPath: "wiki/topics/software-development-validation-methods.md",
        content: "ATDD and TDD are different layers of validation.",
      },
    ],
    "你好",
  );

  assert.deepEqual(results, []);
});
