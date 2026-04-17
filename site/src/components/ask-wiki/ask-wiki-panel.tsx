import type { RefObject } from "react";

type AskWikiPanelProps = {
  buttonRef: RefObject<HTMLButtonElement | null>;
  isOpen: boolean;
  question: string;
  onToggle: () => void;
  onQuestionChange: (value: string) => void;
  onOpenRoute: () => void;
  onSubmit: () => void;
};

export function AskWikiPanel({
  buttonRef,
  isOpen,
  question,
  onToggle,
  onQuestionChange,
  onOpenRoute,
  onSubmit,
}: AskWikiPanelProps) {
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-end sm:inset-x-6 sm:bottom-6">
      <div className="pointer-events-auto flex w-full max-w-[28rem] flex-col items-end gap-3">
        {isOpen ? (
          <section className="launcher-panel motion-enter w-full rounded-[1.1rem] border border-line bg-panel-strong p-4 shadow-[0_24px_80px_rgba(43,32,19,0.18)] backdrop-blur-sm sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-accent-strong">
                  Ask Wiki
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-foreground">
                  Impove it.
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Start from here, then continue in a dedicated result page.
                </p>
              </div>
              <button
                type="button"
                onClick={onToggle}
                className="surface-interactive rounded-xl border border-line bg-white/70 px-3 py-1 text-sm font-medium text-foreground"
              >
                Close
              </button>
            </div>

            <textarea
              value={question}
              onChange={(event) => onQuestionChange(event.target.value)}
              rows={4}
              placeholder="Ask the wiki a question..."
              className="w-full resize-none rounded-[0.95rem] border border-line bg-white/80 px-4 py-3 text-sm leading-7 text-foreground outline-none transition focus:border-accent focus:bg-white"
            />

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onOpenRoute}
                className="surface-interactive rounded-xl border border-line bg-white/80 px-4 py-2 text-sm font-semibold text-foreground"
              >
                Open workspace
              </button>
              <button
                type="button"
                onClick={onSubmit}
                disabled={question.trim().length === 0}
                className="pressable rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Ask now
              </button>
            </div>
          </section>
        ) : null}

        <button
          ref={buttonRef}
          type="button"
          onClick={onToggle}
          className="surface-interactive pressable rounded-xl border border-line bg-[rgba(23,18,14,0.92)] px-5 py-3 text-sm font-semibold tracking-[0.01em] text-stone-50 shadow-[0_18px_50px_rgba(32,24,18,0.24)]"
        >
          Ask Wiki
        </button>
      </div>
    </div>
  );
}
