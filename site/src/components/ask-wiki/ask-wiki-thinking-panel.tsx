import type { ProcessItem } from "./ask-wiki-view-model";

type AskWikiThinkingPanelProps = {
  isOpen: boolean;
  isRunning: boolean;
  statusLabel: string;
  summary: string;
  taskId: string | null;
  items: ProcessItem[];
  onToggle: () => void;
};

export function AskWikiThinkingPanel({
  isOpen,
  isRunning,
  statusLabel,
  summary,
  taskId,
  items,
  onToggle,
}: AskWikiThinkingPanelProps) {
  return (
    <section
      className={`ask-thinking-panel rounded-[1rem] border border-line bg-[rgba(255,255,255,0.62)] ${
        isOpen ? "is-open" : ""
      }`}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`ask-thinking-dot block size-2.5 rounded-full ${
              isRunning
                ? "ask-thinking-dot-live"
                : "bg-[rgba(191,91,36,0.34)]"
            }`}
          />
          <div className="min-w-0">
            <p className="text-[0.72rem] font-mono uppercase tracking-[0.22em] text-accent-strong">
              Trace
            </p>
            <p className="mt-1 truncate text-sm text-foreground">{summary}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {taskId ? (
            <span className="hidden rounded-full border border-line bg-white/76 px-2 py-1 font-mono text-[0.68rem] text-muted sm:inline">
              {taskId}
            </span>
          ) : null}
          <span className="text-xs font-medium text-muted">
            {isOpen ? "Hide" : "Show"}
          </span>
        </div>
      </button>

      <div className="ask-thinking-panel__body">
        <div className="ask-thinking-panel__body-inner border-t border-line px-4 pb-4 pt-3">
          <p className="text-xs leading-5 text-muted">{statusLabel}</p>

          {items.length > 0 ? (
            <div className="mt-3 space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="flex gap-3">
                  <div className="flex w-5 flex-col items-center pt-1">
                    <span
                      className={`block size-2.5 rounded-full ${
                        item.tone === "error"
                          ? "bg-[rgba(255,137,100,0.96)]"
                        : item.tone === "success"
                          ? "bg-[rgba(117,192,143,0.96)]"
                          : "bg-[rgba(191,91,36,0.34)]"
                      }`}
                    />
                    {index < items.length - 1 ? (
                      <span className="mt-1 h-full w-px bg-line" />
                    ) : null}
                  </div>
                  <p className="flex-1 pb-3 text-sm leading-6 text-foreground">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-muted">
              Ask Wiki will summarize visible steps here while it works.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
