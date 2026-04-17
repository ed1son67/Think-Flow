import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { NextResponse } from "next/server";
import { loadSearchDocuments, rankSearchResults } from "@/lib/wiki-search";

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

  const documents = await loadSearchDocuments();
  const results = rankSearchResults(documents, question);

  if (results.length === 0) {
    return NextResponse.json({
      summary: "No strong wiki matches were found for that question yet.",
      results: [],
      usedPages: [],
    });
  }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "think-flow-search-"));
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
      [path.join(process.cwd(), "scripts", "wiki-search-bridge.mjs"), "--input-file", inputFile],
      {
        cwd: process.cwd(),
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `search bridge exited with code ${code}`));
        return;
      }

      try {
        const payload = JSON.parse(stdout) as { summary?: string };
        resolve(payload.summary ?? "");
      } catch (error) {
        reject(error);
      }
    });
  }).finally(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  const usedPages =
    summary
      .split("\n")
      .filter((line) => line.trim().startsWith("- `wiki/"))
      .map((line) => line.replace(/^- `|`$/gu, "").trim()) ?? [];

  return NextResponse.json({
    summary,
    results,
    usedPages,
  });
}
