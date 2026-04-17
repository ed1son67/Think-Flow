import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCodexArgs,
  buildCodexPrompt,
  parseCodexJsonLine,
} from "./wiki-query-bridge.mjs";

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

test("buildCodexArgs enables json mode and captures the final message", () => {
  const args = buildCodexArgs({
    repoRoot: "/tmp/think-flow",
    prompt: "hello",
    lastMessagePath: "/tmp/task/last-message.txt",
  });

  assert.deepEqual(args.slice(0, 4), [
    "exec",
    "--json",
    "--full-auto",
    "--output-last-message",
  ]);
  assert.equal(args.at(-2), "/tmp/think-flow");
  assert.equal(args.at(-1), "hello");
});

test("parseCodexJsonLine extracts agent message text chunks", () => {
  const event = parseCodexJsonLine(
    JSON.stringify({
      type: "item.completed",
      item: {
        type: "agent_message",
        text: "hello",
      },
    }),
  );

  assert.deepEqual(event, {
    type: "chunk",
    text: "hello",
  });
});

test("parseCodexJsonLine maps turn start into a running status event", () => {
  const event = parseCodexJsonLine(
    JSON.stringify({
      type: "turn.started",
    }),
  );

  assert.deepEqual(event, {
    type: "status",
    status: "running",
    message: "Codex is querying the wiki.",
  });
});
