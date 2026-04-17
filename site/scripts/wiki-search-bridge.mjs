import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import {
  consumeCodexTextChunk,
  createCodexTextStreamState,
  splitTextForStreaming,
} from "./codex-text-stream.mjs";

export function buildSearchPrompt({ question, results }) {
  const formattedResults = results
    .map((result, index) =>
      [
        `Result ${index + 1}`,
        `Title: ${result.title}`,
        `Section: ${result.section}`,
        `Path: ${result.repoPath}`,
        `Snippet: ${result.snippet}`,
      ].join("\n"),
    )
    .join("\n\n");

  return [
    "Answer the user question using only the provided wiki search results.",
    "Do not use any tools, do not read files, and do not invent sources.",
    "Return a short answer in 3-6 sentences, then append a `## 来源` section listing only the provided repo paths you actually relied on.",
    "",
    `Question: ${question}`,
    "",
    "Search results:",
    formattedResults,
  ].join("\n");
}

export function buildSearchArgs({ prompt, lastMessagePath }) {
  return [
    "exec",
    "--ephemeral",
    "--sandbox",
    "read-only",
    "--skip-git-repo-check",
    "--color",
    "never",
    "--output-last-message",
    lastMessagePath,
    "-C",
    os.tmpdir(),
    prompt,
  ];
}

async function main() {
  const inputFileIndex = process.argv.indexOf("--input-file");
  if (inputFileIndex === -1 || !process.argv[inputFileIndex + 1]) {
    throw new Error("Missing --input-file");
  }

  const inputFile = process.argv[inputFileIndex + 1];
  const input = JSON.parse(await readFile(inputFile, "utf8"));
  const lastMessagePath = path.join(
    path.dirname(inputFile),
    `${path.basename(inputFile, ".json")}-last-message.txt`,
  );
  const prompt = buildSearchPrompt(input);
  const args = buildSearchArgs({
    prompt,
    lastMessagePath,
  });

  await writeFile(
    path.join(
      path.dirname(inputFile),
      `${path.basename(inputFile, ".json")}-prompt.txt`,
    ),
    prompt,
    "utf8",
  );

  const stdoutState = createCodexTextStreamState();
  let emittedText = "";

  await new Promise((resolve, reject) => {
    const child = spawn("codex", args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";

    child.stdout.on("data", (chunk) => {
      const emitted = consumeCodexTextChunk(
        stdoutState,
        chunk.toString("utf8"),
        false,
      );
      if (emitted) {
        emittedText += emitted;
        for (const piece of splitTextForStreaming(emitted)) {
          process.stdout.write(piece);
        }
      }
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        const emitted = consumeCodexTextChunk(stdoutState, "", true);
        if (emitted) {
          emittedText += emitted;
          for (const piece of splitTextForStreaming(emitted)) {
            process.stdout.write(piece);
          }
        }
        if (!emittedText.trim() && existsSync(lastMessagePath)) {
          const finalMessage = readFile(lastMessagePath, "utf8");
          Promise.resolve(finalMessage).then((text) => {
            if (text.trim()) {
              process.stdout.write(text);
            }
            resolve(undefined);
          }).catch(reject);
          return;
        }
        resolve(undefined);
      } else {
        reject(new Error(stderr.trim() || `codex exited with code ${code}`));
      }
    });
  });
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
