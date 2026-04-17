type AskWikiPanelProps = {
  isOpen: boolean;
  isRunning: boolean;
  mode: "search" | "query";
  question: string;
  statusText: string;
  output: string;
  error: string | null;
  searchResults: Array<{
    id: string;
    title: string;
    section: string;
    href: string;
    repoPath: string;
    snippet: string;
    score: number;
  }>;
  usedPages: string[];
  onToggle: () => void;
  onModeChange: (mode: "search" | "query") => void;
  onQuestionChange: (value: string) => void;
  onSubmit: () => void;
};

export function AskWikiPanel({
  isOpen,
  isRunning,
  mode,
  question,
  statusText,
  output,
  error,
  searchResults,
  usedPages,
  onToggle,
  onModeChange,
  onQuestionChange,
  onSubmit,
}: AskWikiPanelProps) {
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-end sm:inset-x-6 sm:bottom-6">
      <div className="pointer-events-auto flex w-full max-w-[28rem] flex-col items-end gap-3">
        {isOpen ? (
          <section className="w-full rounded-[1.75rem] border border-line bg-panel-strong p-4 shadow-[0_24px_80px_rgba(43,32,19,0.18)] backdrop-blur-sm sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-accent-strong">
                  Ask Wiki
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-foreground">
                  {mode === "search" ? "Search the wiki" : "Run Deep Query"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {mode === "search"
                    ? "Search is read-only: program retrieval first, then a model summary over the matched wiki pages."
                    : "Deep Query uses the local Codex CLI and may update wiki pages if the query decides the result should be durable."}
                </p>
              </div>
              <button
                type="button"
                onClick={onToggle}
                className="rounded-full border border-line bg-white/70 px-3 py-1 text-sm font-medium text-foreground transition hover:bg-white"
              >
                Close
              </button>
            </div>

            <div className="mb-4 inline-flex rounded-full border border-line bg-white/65 p-1">
              <button
                type="button"
                onClick={() => onModeChange("search")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  mode === "search"
                    ? "bg-accent text-white"
                    : "text-foreground hover:bg-white"
                }`}
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => onModeChange("query")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  mode === "query"
                    ? "bg-accent text-white"
                    : "text-foreground hover:bg-white"
                }`}
              >
                Deep Query
              </button>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground">
                Question
              </span>
              <textarea
                value={question}
                onChange={(event) => onQuestionChange(event.target.value)}
                rows={4}
                placeholder="Ask the wiki a question..."
                className="w-full resize-none rounded-2xl border border-line bg-white/80 px-4 py-3 text-sm leading-7 text-foreground outline-none transition focus:border-accent focus:bg-white"
              />
            </label>

            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="text-sm text-muted">{statusText}</p>
              <button
                type="button"
                onClick={onSubmit}
                disabled={isRunning || question.trim().length === 0}
                className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRunning
                  ? mode === "search"
                    ? "Searching..."
                    : "Running..."
                  : mode === "search"
                    ? "Run Search"
                    : "Run Query"}
              </button>
            </div>

            <div className="mt-4 rounded-[1.25rem] border border-line bg-[rgba(255,251,246,0.82)]">
              <div className="border-b border-line px-4 py-3 font-mono text-[0.7rem] uppercase tracking-[0.22em] text-muted">
                {mode === "search" ? "Search Result" : "Stream"}
              </div>
              <div className="max-h-[22rem] min-h-[12rem] overflow-y-auto px-4 py-4">
                {output ? (
                  <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-7 text-foreground">
                    {output}
                  </pre>
                ) : (
                  <p className="text-sm leading-7 text-muted">
                    Query output will appear here.
                  </p>
                )}
                {mode === "search" && searchResults.length > 0 ? (
                  <div className="mt-5 space-y-3">
                    <div className="rounded-xl border border-line/80 bg-white/70 p-3">
                      <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted">
                        Matched Pages
                      </p>
                      <div className="mt-3 space-y-3">
                        {searchResults.map((result) => (
                          <a
                            key={result.id}
                            href={result.href}
                            className="block rounded-xl border border-line bg-panel px-3 py-3 transition hover:bg-white/90"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <p className="text-sm font-semibold text-foreground">
                                {result.title}
                              </p>
                              <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted">
                                {result.section}
                              </span>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-muted">
                              {result.snippet}
                            </p>
                            <p className="mt-2 font-mono text-[0.7rem] text-accent-strong">
                              {result.repoPath}
                            </p>
                          </a>
                        ))}
                      </div>
                    </div>
                    {usedPages.length > 0 ? (
                      <div className="rounded-xl border border-line/80 bg-white/70 p-3">
                        <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted">
                          Used Pages
                        </p>
                        <ul className="mt-3 space-y-2 text-sm text-foreground">
                          {usedPages.map((page) => (
                            <li key={page} className="font-mono text-[0.8rem]">
                              {page}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {error ? (
                  <p className="mt-4 rounded-xl border border-[rgba(141,47,17,0.2)] bg-[rgba(191,91,36,0.08)] px-3 py-2 text-sm leading-6 text-accent-strong">
                    {error}
                  </p>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        <button
          type="button"
          onClick={onToggle}
          className="rounded-full border border-line bg-[rgba(23,18,14,0.92)] px-5 py-3 text-sm font-semibold tracking-[0.01em] text-stone-50 shadow-[0_18px_50px_rgba(32,24,18,0.24)] transition hover:-translate-y-0.5 hover:bg-[rgba(23,18,14,0.98)]"
        >
          Ask Wiki
        </button>
      </div>
    </div>
  );
}
