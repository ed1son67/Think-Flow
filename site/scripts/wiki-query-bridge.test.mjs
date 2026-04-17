import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCodexArgs,
  buildCodexPrompt,
} from "./wiki-query-bridge.mjs";
import {
  consumeCodexTextChunk,
  createCodexTextStreamState,
  splitTextForStreaming,
} from "./codex-text-stream.mjs";

test("buildCodexPrompt embeds the Think Flow query contract and question", () => {
  const prompt = buildCodexPrompt({
    question: "What does the wiki conclude about agent framework selection?",
    repoRoot: "/tmp/think-flow",
  });

  assert.match(prompt, /\/th:query/u);
  assert.match(prompt, /CLAUDE\.md/u);
  assert.match(prompt, /skills\/think-flow\/prompts\/query\.md/u);
  assert.match(prompt, /agent framework selection/u);
});

test("buildCodexArgs uses plain stdout mode and captures the final message", () => {
  const args = buildCodexArgs({
    repoRoot: "/tmp/think-flow",
    prompt: "hello",
    lastMessagePath: "/tmp/task/last-message.txt",
  });

  assert.deepEqual(args.slice(0, 5), [
    "exec",
    "--full-auto",
    "--color",
    "never",
    "--output-last-message",
  ]);
  assert.equal(args.at(-2), "/tmp/think-flow");
  assert.equal(args.at(-1), "hello");
});

test("consumeCodexTextChunk keeps only assistant text and ignores tool logs", () => {
  const state = createCodexTextStreamState();
  const output = consumeCodexTextChunk(
    state,
    [
      "OpenAI Codex v0.121.0 (research preview)",
      "--------",
      "user",
      "Question",
      "codex",
      "First answer line",
      "exec",
      '/bin/zsh -lc "echo hi"',
      " succeeded in 0ms:",
      "hi",
      "codex",
      "Second answer line",
      "tokens used",
      "123",
      "",
    ].join("\n"),
    true,
  );

  assert.equal(output, "First answer line\nSecond answer line\n");
});

test("splitTextForStreaming breaks large text into smaller progressive pieces", () => {
  const chunks = splitTextForStreaming(
    "Alpha beta gamma. Delta epsilon zeta.",
    12,
  );

  assert.deepEqual(chunks, [
    "Alpha beta g",
    "amma.",
    " Delta epsil",
    "on zeta.",
  ]);
});
