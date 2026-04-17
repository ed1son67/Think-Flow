import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  consumeCodexTextChunk,
  createCodexTextStreamState,
  splitTextForStreaming,
  shouldIgnoreCodexStderrLine,
} from "./codex-text-stream.mjs";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const siteRoot = path.resolve(currentDir, "..");
const repoRoot = path.resolve(siteRoot, "..");
const stateRoot = path.join(siteRoot, ".codex-query-state");

export function buildCodexPrompt({ question, repoRoot }) {
  const claudePath = path.join(repoRoot, "CLAUDE.md");
  const queryPromptPath = path.join(
    repoRoot,
    "skills",
    "think-flow",
    "prompts",
    "query.md",
  );

  return [
    "Run the Think Flow wiki query workflow for the following question.",
    `Repository root: ${repoRoot}`,
    `Required repo contract: ${claudePath}`,
    `Required query scaffold: ${queryPromptPath}`,
    "",
    "Behavior requirements:",
    "- Treat this as the equivalent of `/th:query` in the Think Flow repository.",
    "- Read the required repository files and follow the existing query rules.",
    "- Use the wiki as the primary knowledge layer.",
    "- Append a `## 来源` section.",
    "- If the answer is reusable, you may update wiki pages, wiki/syntheses, and wiki/log.md.",
    "",
    `Question: ${question}`,
  ].join("\n");
}

export function buildCodexArgs({ repoRoot, prompt, lastMessagePath }) {
  return [
    "exec",
    "--full-auto",
    "--color",
    "never",
    "--output-last-message",
    lastMessagePath,
    "-C",
    repoRoot,
    prompt,
  ];
}

function getTaskDir(taskId) {
  return path.join(stateRoot, taskId);
}

function getTaskPaths(taskId) {
  const taskDir = getTaskDir(taskId);

  return {
    taskDir,
    metaPath: path.join(taskDir, "meta.json"),
    statePath: path.join(taskDir, "state.json"),
    promptPath: path.join(taskDir, "prompt.txt"),
    questionPath: path.join(taskDir, "question.txt"),
    eventsPath: path.join(taskDir, "events.jsonl"),
    lastMessagePath: path.join(taskDir, "last-message.txt"),
  };
}

async function appendEvent(eventsPath, event) {
  await appendFile(
    eventsPath,
    `${JSON.stringify({ timestamp: new Date().toISOString(), ...event })}\n`,
    "utf8",
  );
}

async function writeState(statePath, nextState) {
  await writeFile(statePath, `${JSON.stringify(nextState, null, 2)}\n`, "utf8");
}

async function runTask(taskId) {
  const { metaPath, statePath, promptPath, questionPath, eventsPath, lastMessagePath } =
    getTaskPaths(taskId);

  const meta = JSON.parse(await readFile(metaPath, "utf8"));
  const question = await readFile(questionPath, "utf8");
  const startedAt = new Date().toISOString();
  const prompt = buildCodexPrompt({
    question: question.trim(),
    repoRoot,
  });

  await writeFile(promptPath, prompt, "utf8");
  await writeState(statePath, {
    ...meta,
    status: "running",
    startedAt,
    completedAt: null,
    error: null,
    finalMessage: null,
  });
  await appendEvent(eventsPath, {
    type: "status",
    status: "running",
    message: "Launching local Codex query.",
  });
  await appendEvent(eventsPath, {
    type: "status",
    status: "starting",
    message: "Codex thread started.",
  });

  const args = buildCodexArgs({
    repoRoot,
    prompt,
    lastMessagePath,
  });
  const child = spawn("codex", args, {
    cwd: repoRoot,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  const stdoutState = createCodexTextStreamState();
  let accumulatedText = "";
  let stderrBuffer = "";
  let settled = false;

  const flushStdout = async (chunk, flushAll = false) => {
    const emitted = consumeCodexTextChunk(stdoutState, chunk, flushAll);
    if (!emitted) return;

    for (const piece of splitTextForStreaming(emitted)) {
      accumulatedText += piece;
      await appendEvent(eventsPath, {
        type: "chunk",
        text: piece,
      });
    }
  };

  const flushStderr = async (flushAll = false) => {
    const parts = stderrBuffer.split("\n");
    if (!flushAll) {
      stderrBuffer = parts.pop() ?? "";
    } else {
      stderrBuffer = "";
    }

    for (const part of parts) {
      const line = part.trim();
      if (!line) continue;
      if (shouldIgnoreCodexStderrLine(line)) continue;

      await appendEvent(eventsPath, {
        type: "stderr",
        text: line,
      });
    }
  };

  const finalize = async ({ status, code, error }) => {
    if (settled) return;
    settled = true;

    await flushStdout("", true);
    await flushStderr(true);

    const finalMessage =
      existsSync(lastMessagePath)
        ? (await readFile(lastMessagePath, "utf8")).trim()
        : accumulatedText.trim() || null;

    await writeState(statePath, {
      ...meta,
      status,
      startedAt,
      completedAt: new Date().toISOString(),
      error: error ?? null,
      exitCode: code ?? null,
      finalMessage,
    });

    if (finalMessage) {
      await appendEvent(eventsPath, {
        type: "final",
        text: finalMessage,
      });
    }

    await appendEvent(eventsPath, {
      type: "status",
      status,
      message:
        status === "completed"
          ? "Wiki query finished."
          : "Wiki query failed.",
      error: error ?? null,
      exitCode: code ?? null,
    });
  };

  child.stdout.on("data", (chunk) => {
    void flushStdout(chunk.toString("utf8"), false);
  });

  child.stderr.on("data", (chunk) => {
    stderrBuffer += chunk.toString("utf8");
    void flushStderr(false);
  });

  child.on("error", (error) => {
    void finalize({
      status: "failed",
      code: null,
      error: error.message,
    });
  });

  child.on("close", (code) => {
    void finalize({
      status: code === 0 ? "completed" : "failed",
      code,
      error: code === 0 ? null : `Codex exited with code ${code}.`,
    });
  });
}

async function main() {
  await mkdir(stateRoot, { recursive: true });

  const taskIdIndex = process.argv.indexOf("--task-id");
  if (taskIdIndex === -1 || !process.argv[taskIdIndex + 1]) {
    throw new Error("Missing --task-id");
  }

  const taskId = process.argv[taskIdIndex + 1];
  await runTask(taskId);
}

if (process.argv[1] === currentFile) {
  main().catch(async (error) => {
    const taskIdIndex = process.argv.indexOf("--task-id");
    const taskId =
      taskIdIndex !== -1 ? process.argv[taskIdIndex + 1] : undefined;

    if (taskId) {
      const { metaPath, statePath, eventsPath } = getTaskPaths(taskId);
      const meta = existsSync(metaPath)
        ? JSON.parse(readFileSync(metaPath, "utf8"))
        : { id: taskId };
      await mkdir(getTaskDir(taskId), { recursive: true });
      await appendEvent(eventsPath, {
        type: "error",
        message: error instanceof Error ? error.message : String(error),
      });
      await writeState(statePath, {
        ...meta,
        status: "failed",
        completedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
        finalMessage: null,
      });
    }

    process.exitCode = 1;
  });
}
