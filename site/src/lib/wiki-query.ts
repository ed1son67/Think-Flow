import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

export type QueryTaskStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed";

export type QueryTaskState = {
  id: string;
  question: string;
  status: QueryTaskStatus;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  error?: string | null;
  exitCode?: number | null;
  finalMessage?: string | null;
};

export type QueryTaskEvent = {
  timestamp: string;
  type: string;
  text?: string;
  message?: string;
  status?: string;
  error?: string | null;
  exitCode?: number | null;
  usage?: unknown;
  raw?: unknown;
};

export function getSiteRoot() {
  return process.cwd();
}

export function getQueryStateRoot() {
  return path.join(getSiteRoot(), ".codex-query-state");
}

export function getBridgeScriptPath() {
  return path.join(getSiteRoot(), "scripts", "wiki-query-bridge.mjs");
}

export function getTaskDir(taskId: string) {
  return path.join(getQueryStateRoot(), taskId);
}

export function getTaskPaths(taskId: string) {
  const taskDir = getTaskDir(taskId);

  return {
    taskDir,
    metaPath: path.join(taskDir, "meta.json"),
    statePath: path.join(taskDir, "state.json"),
    questionPath: path.join(taskDir, "question.txt"),
    eventsPath: path.join(taskDir, "events.jsonl"),
  };
}

export function createTaskId() {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function ensureQueryStateRoot() {
  await mkdir(getQueryStateRoot(), { recursive: true });
}

export async function writeTaskJson<T>(filePath: string, value: T) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function readTaskJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function createQueryTask(question: string) {
  const id = createTaskId();
  const { taskDir, metaPath, statePath, questionPath } = getTaskPaths(id);
  const createdAt = new Date().toISOString();
  const initialState: QueryTaskState = {
    id,
    question,
    status: "queued",
    createdAt,
    startedAt: null,
    completedAt: null,
    error: null,
    finalMessage: null,
    exitCode: null,
  };

  await mkdir(taskDir, { recursive: true });
  await writeFile(questionPath, question, "utf8");
  await writeTaskJson(metaPath, initialState);
  await writeTaskJson(statePath, initialState);

  return initialState;
}

export async function readTaskState(taskId: string) {
  const { statePath } = getTaskPaths(taskId);
  return readTaskJson<QueryTaskState>(statePath);
}

export async function listQueryTaskIds() {
  try {
    const entries = await readdir(getQueryStateRoot(), { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
}

export async function findActiveTask() {
  const taskIds = await listQueryTaskIds();

  for (const taskId of taskIds.reverse()) {
    const state = await readTaskState(taskId);
    if (state?.status === "queued" || state?.status === "running") {
      return state;
    }
  }

  return null;
}

export async function readTaskEvents(taskId: string) {
  const { eventsPath } = getTaskPaths(taskId);

  try {
    const raw = await readFile(eventsPath, "utf8");
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as QueryTaskEvent);
  } catch {
    return [];
  }
}
