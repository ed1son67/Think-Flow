import { TextEncoder } from "node:util";
import { NextResponse } from "next/server";
import {
  getTaskPaths,
  readTaskEvents,
  readTaskState,
} from "@/lib/wiki-query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const taskState = await readTaskState(id);

  if (!taskState) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      let sentEvents = 0;
      let lastStatus = "";

      const send = (event: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      const tick = async () => {
        if (closed) return;

        const events = await readTaskEvents(id);
        const nextState = await readTaskState(id);

        for (const event of events.slice(sentEvents)) {
          send(event);
        }
        sentEvents = events.length;

        if (nextState?.status && nextState.status !== lastStatus) {
          lastStatus = nextState.status;
          send({
            type: "state",
            status: nextState.status,
            error: nextState.error ?? null,
            finalMessage: nextState.finalMessage ?? null,
          });
        }

        if (
          nextState &&
          (nextState.status === "completed" || nextState.status === "failed")
        ) {
          closed = true;
          controller.close();
          clearInterval(intervalId);
        }
      };

      send({
        type: "state",
        status: taskState.status,
        error: taskState.error ?? null,
        finalMessage: taskState.finalMessage ?? null,
      });

      const intervalId = setInterval(() => {
        void tick();
      }, 300);

      void tick();

      return () => {
        closed = true;
        clearInterval(intervalId);
      };
    },
    cancel() {
      const { eventsPath } = getTaskPaths(id);
      void eventsPath;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
