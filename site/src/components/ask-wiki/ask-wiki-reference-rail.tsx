"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { EvidenceItem } from "./ask-wiki-view-model";

type AskWikiReferenceRailProps = {
  items: EvidenceItem[];
};

function toneClass(tone: EvidenceItem["tone"]) {
  if (tone === "error") {
    return "bg-[rgba(191,91,36,0.14)] text-accent-strong";
  }

  if (tone === "success") {
    return "bg-[rgba(117,192,143,0.18)] text-[rgba(48,104,69,0.95)]";
  }

  return "bg-[rgba(90,78,62,0.08)] text-muted";
}

export function AskWikiReferenceRail({ items }: AskWikiReferenceRailProps) {
  const [openKey, setOpenKey] = useState<string | null>(
    items.find((item) => item.defaultOpen)?.key ?? items[0]?.key ?? null,
  );

  const activeItem = useMemo(
    () =>
      items.find((item) => item.key === openKey) ??
      items.find((item) => item.defaultOpen) ??
      items[0],
    [items, openKey],
  );

  const sourceCount = items.filter((item) => item.kind === "source").length;
  const processCount = items.filter((item) => item.kind === "process").length;
  const usedCount = items.filter((item) => item.usedInAnswer).length;

  return (
    <aside className="min-w-0">
      <div className="rounded-[1.45rem] border border-line bg-[rgba(255,251,246,0.94)] p-5 shadow-[0_24px_80px_rgba(43,32,19,0.10)] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.22em] text-accent-strong">
              Evidence
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-foreground">
              Reference
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Keep one document in focus while the rest stay compact and easy to
              scan.
            </p>
          </div>
          <span className="rounded-full border border-line bg-white/80 px-3 py-1 text-xs font-medium text-muted">
            {items.length}
          </span>
        </div>

        {items.length > 0 ? (
          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-line bg-white/80 px-3 py-1 text-[0.72rem] font-medium text-muted">
                {sourceCount} sources
              </span>
              <span className="rounded-full border border-[rgba(117,192,143,0.24)] bg-[rgba(117,192,143,0.14)] px-3 py-1 text-[0.72rem] font-medium text-[rgba(48,104,69,0.95)]">
                {usedCount} cited
              </span>
              <span className="rounded-full border border-line bg-white/80 px-3 py-1 text-[0.72rem] font-medium text-muted">
                {processCount} process notes
              </span>
            </div>

            {activeItem ? (
              <section className="rounded-[1rem] border border-line bg-white p-4 shadow-[0_12px_30px_rgba(43,32,19,0.06)]">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {activeItem.label}
                  </p>
                  <span
                    className={`rounded-full px-2 py-1 text-[0.68rem] font-medium ${toneClass(activeItem.tone)}`}
                  >
                    {activeItem.kind === "source"
                      ? activeItem.usedInAnswer
                        ? "used"
                        : "supporting"
                      : activeItem.detail}
                  </span>
                </div>
                <p className="mt-2 break-all font-mono text-[0.7rem] leading-5 text-muted">
                  {activeItem.detail}
                </p>
                <div className="mt-4 rounded-[0.9rem] border border-line/70 bg-transparent px-4 py-4">
                  <p className="text-[0.68rem] font-mono uppercase tracking-[0.18em] text-accent-strong">
                    Referenced Text
                  </p>
                  <p className="mt-3 text-sm leading-6 text-foreground">
                    {activeItem.note}
                  </p>
                </div>
                {activeItem.href ? (
                  <Link
                    href={activeItem.href}
                    className="surface-interactive mt-4 inline-flex items-center rounded-lg border border-line bg-panel px-3 py-2 text-sm font-medium text-foreground"
                  >
                    Open document
                  </Link>
                ) : null}
              </section>
            ) : null}

            <div className="space-y-2">
              {items.map((item) => {
                const isActive = item.key === activeItem?.key;
                const isUsed = Boolean(item.usedInAnswer);

                return (
                  <button
                    type="button"
                    key={item.key}
                    aria-pressed={isActive}
                    onClick={() => setOpenKey(item.key)}
                    className={`w-full rounded-[0.95rem] border px-4 py-3 text-left transition ${
                      isActive
                        ? isUsed
                          ? "border-[rgba(117,192,143,0.34)] bg-[rgba(117,192,143,0.16)] ring-1 ring-[rgba(117,192,143,0.24)]"
                          : "border-[rgba(191,91,36,0.24)] bg-[rgba(191,91,36,0.08)] ring-1 ring-[rgba(191,91,36,0.16)]"
                        : isUsed
                          ? "border-[rgba(117,192,143,0.24)] bg-[rgba(117,192,143,0.08)] hover:bg-[rgba(117,192,143,0.12)]"
                          : "border-line bg-white hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            {item.label}
                          </p>
                          <span
                            className={`rounded-full px-2 py-1 text-[0.68rem] font-medium ${toneClass(item.tone)}`}
                          >
                            {item.kind === "source"
                              ? item.usedInAnswer
                                ? "used"
                                : "supporting"
                              : item.detail}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-2 break-all font-mono text-[0.7rem] leading-5 text-muted">
                          {item.detail}
                        </p>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                          {item.note}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-medium text-muted">
                        {isActive ? "Focus" : isUsed ? "Cited" : "View"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-[1rem] border border-dashed border-line bg-white/76 px-4 py-5">
            <p className="text-sm leading-6 text-muted">
              Sources and visible activity will appear here after Ask Wiki
              starts scanning the wiki.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
