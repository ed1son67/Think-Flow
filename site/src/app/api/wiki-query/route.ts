import { spawn } from "node:child_process";
import { NextResponse } from "next/server";
import {
  createQueryTask,
  ensureQueryStateRoot,
  findActiveTask,
  getBridgeScriptPath,
} from "@/lib/wiki-query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreateQueryBody = {
  question?: string;
};

export async function POST(request: Request) {
  await ensureQueryStateRoot();

  const body = (await request.json()) as CreateQueryBody;
  const question = body.question?.trim();

  if (!question) {
    return NextResponse.json(
      { error: "Question is required." },
      { status: 400 },
    );
  }

  const activeTask = await findActiveTask();
  if (activeTask) {
    return NextResponse.json(
      {
        error: "A wiki query is already running.",
        taskId: activeTask.id,
      },
      { status: 409 },
    );
  }

  const task = await createQueryTask(question);
  const child = spawn(
    process.execPath,
    [getBridgeScriptPath(), "--task-id", task.id],
    {
      cwd: process.cwd(),
      detached: true,
      stdio: "ignore",
      env: process.env,
    },
  );

  child.unref();

  return NextResponse.json({
    taskId: task.id,
    status: task.status,
  });
}
