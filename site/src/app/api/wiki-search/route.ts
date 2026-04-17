import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { NextResponse } from "next/server";
import { loadSearchDocuments, rankSearchResults } from "@/lib/wiki-search";
import { splitTextForStreaming } from "../../../../scripts/codex-text-stream.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SearchRequestBody = {
  question?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as SearchRequestBody;
  const question = body.question?.trim();

  if (!question) {
    return NextResponse.json(
      { error: "Question is required." },
      { status: 400 },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      try {
        send({
          type: "status",
          status: "running",
          message: "Searching wiki pages.",
        });

        const documents = await loadSearchDocuments();
        const results = rankSearchResults(documents, question);

        send({
          type: "results",
          results,
        });

        if (results.length === 0) {
          send({
            type: "summary",
            summary: "No strong wiki matches were found for that question yet.",
            usedPages: [],
          });
          send({
            type: "status",
            status: "completed",
            message: "Search finished.",
          });
          controller.close();
          return;
        }

        send({
          type: "status",
          status: "running",
          message: "Summarizing matched wiki pages.",
        });

        const tempDir = await mkdtemp(path.join(os.tmpdir(), "think-flow-search-"));

        try {
          const inputFile = path.join(tempDir, "search-input.json");

          await writeFile(
            inputFile,
            JSON.stringify({
              question,
              results,
            }),
            "utf8",
          );

          const summary = await new Promise<string>((resolve, reject) => {
            const child = spawn(
              process.execPath,
              [
                path.join(process.cwd(), "scripts", "wiki-search-bridge.mjs"),
                "--input-file",
                inputFile,
              ],
              {
                cwd: process.cwd(),
                env: process.env,
                stdio: ["ignore", "pipe", "pipe"],
              },
            );

            let stdout = "";
            let stderr = "";

            child.stdout.on("data", (chunk) => {
              const text = chunk.toString("utf8");
              stdout += text;
              for (const piece of splitTextForStreaming(text)) {
                send({
                  type: "chunk",
                  text: piece,
                });
              }
            });

            child.stderr.on("data", (chunk) => {
              stderr += chunk.toString("utf8");
            });

            child.on("error", reject);
            child.on("close", (code) => {
              if (code !== 0) {
                reject(
                  new Error(
                    stderr.trim() || `search bridge exited with code ${code}`,
                  ),
                );
                return;
              }

              resolve(stdout.trim());
            });
          });

          const usedPages =
            summary
              .split("\n")
              .filter((line) => line.trim().startsWith("- `wiki/"))
              .map((line) => line.replace(/^- `|`$/gu, "").trim()) ?? [];

          send({
            type: "summary",
            summary,
            usedPages,
          });
          send({
            type: "status",
            status: "completed",
            message: "Search finished.",
          });
          controller.close();
        } finally {
          await rm(tempDir, { recursive: true, force: true });
        }
      } catch (error) {
        send({
          type: "error",
          error: error instanceof Error ? error.message : String(error),
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
