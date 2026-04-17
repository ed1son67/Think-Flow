import type { CSSProperties } from "react";
import Link from "next/link";
import type { WikiOverview as WikiOverviewData } from "@/lib/wiki";

type WikiOverviewProps = {
  overview: WikiOverviewData;
};

export function WikiOverview({ overview }: WikiOverviewProps) {
  return (
    <section className="grid gap-8 lg:grid-cols-[1.35fr_0.95fr]">
      <div
        className="motion-stagger rounded-[1.8rem] border border-line bg-panel p-6 shadow-[0_14px_60px_rgba(73,54,34,0.08)] sm:p-8"
        style={{ "--motion-delay": "260ms" } as CSSProperties}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.22em] text-muted">
              Knowledge Lanes
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em]">
              Browse by how the repository thinks
            </h2>
          </div>
          <Link
            href="/docs"
            className="surface-interactive rounded-full border border-line bg-white/75 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white"
          >
            Full docs
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {overview.sections.map((section) => (
            <Link
              key={section.key}
              href={section.href}
              className="surface-interactive group rounded-[1.4rem] border border-line bg-white/80 p-5 transition hover:bg-white"
            >
              <p className="text-xs font-mono uppercase tracking-[0.22em] text-accent-strong">
                {section.label}
              </p>
              <p className="mt-4 text-3xl font-semibold tracking-[-0.06em]">
                {section.count}
              </p>
              <p className="mt-3 text-sm leading-6 text-muted">
                {section.description}
              </p>
              <p className="mt-5 text-sm font-medium text-foreground transition group-hover:text-accent-strong">
                Sample page: {section.sampleTitle}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <div
        className="motion-stagger rounded-[1.8rem] border border-line bg-[rgba(23,18,14,0.92)] p-6 text-stone-50 shadow-[0_14px_60px_rgba(33,23,16,0.16)] sm:p-8"
        style={{ "--motion-delay": "320ms" } as CSSProperties}
      >
        <p className="text-xs font-mono uppercase tracking-[0.22em] text-stone-300">
          Latest Pages
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em]">
          What changed recently
        </h2>
        <div className="mt-8 space-y-4">
          {overview.latestPages.map((page) => (
            <Link
              key={page.relativePath}
              href={page.href}
              className="surface-interactive block rounded-[1.3rem] border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
            >
              <p className="text-xs font-mono uppercase tracking-[0.18em] text-stone-400">
                {page.updatedAt}
              </p>
              <p className="mt-2 text-lg font-medium tracking-[-0.03em]">
                {page.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-300">
                {page.relativePath}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
