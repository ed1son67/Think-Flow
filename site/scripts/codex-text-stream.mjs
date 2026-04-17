export function createCodexTextStreamState() {
  return {
    mode: "ignore",
    buffer: "",
    skipNextUserLine: false,
  };
}

function isMetadataLine(trimmed) {
  return (
    trimmed === "--------" ||
    trimmed === "user" ||
    trimmed === "codex" ||
    trimmed === "exec" ||
    trimmed === "tokens used" ||
    trimmed.startsWith("OpenAI Codex ") ||
    trimmed.startsWith("workdir:") ||
    trimmed.startsWith("model:") ||
    trimmed.startsWith("provider:") ||
    trimmed.startsWith("approval:") ||
    trimmed.startsWith("sandbox:") ||
    trimmed.startsWith("reasoning effort:") ||
    trimmed.startsWith("reasoning summaries:") ||
    trimmed.startsWith("session id:")
  );
}

function isToolLogLine(trimmed) {
  return (
    trimmed.startsWith("/bin/") ||
    trimmed.startsWith("succeeded in ") ||
    trimmed.startsWith("exited ") ||
    trimmed.startsWith("failed in ")
  );
}

export function consumeCodexTextChunk(state, chunk, flushAll = false) {
  state.buffer += chunk;
  const parts = state.buffer.split("\n");

  if (!flushAll) {
    state.buffer = parts.pop() ?? "";
  } else {
    state.buffer = "";
  }

  let text = "";

  for (const part of parts) {
    const line = part.replace(/\r$/u, "");
    const trimmed = line.trim();

    if (!trimmed) {
      if (state.mode === "assistant") {
        text += "\n";
      }
      continue;
    }

    if (trimmed === "codex") {
      state.mode = "assistant";
      continue;
    }

    if (trimmed === "user") {
      state.skipNextUserLine = true;
      continue;
    }

    if (state.skipNextUserLine) {
      state.skipNextUserLine = false;
      continue;
    }

    if (trimmed === "exec") {
      state.mode = "tool";
      continue;
    }

    if (trimmed === "tokens used") {
      state.mode = "ignore";
      continue;
    }

    if (isMetadataLine(trimmed)) {
      continue;
    }

    if (state.mode === "tool") {
      if (isToolLogLine(trimmed)) continue;
      continue;
    }

    if (state.mode === "assistant") {
      text += `${line}\n`;
    }
  }

  return text;
}

export function splitTextForStreaming(text, maxChars = 24) {
  if (!text) return [];

  const chunks = [];
  let current = "";

  const pushCurrent = () => {
    if (!current) return;
    chunks.push(current);
    current = "";
  };

  for (const char of text) {
    current += char;

    const shouldBreak =
      current.length >= maxChars ||
      /[\n。！？；.!?;,，、]/u.test(char);

    if (shouldBreak) {
      pushCurrent();
    }
  }

  pushCurrent();
  return chunks;
}

export function shouldIgnoreCodexStderrLine(trimmed) {
  if (!trimmed) return true;
  if (trimmed === "Reading additional input from stdin...") return true;
  if (isMetadataLine(trimmed)) return true;

  if (
    trimmed.startsWith("Run the Think Flow wiki query workflow") ||
    trimmed.startsWith("Repository root:") ||
    trimmed.startsWith("Required repo contract:") ||
    trimmed.startsWith("Required query scaffold:") ||
    trimmed.startsWith("Behavior requirements:") ||
    trimmed.startsWith("Question:")
  ) {
    return true;
  }

  if (trimmed.startsWith("- ")) {
    return true;
  }

  return false;
}
