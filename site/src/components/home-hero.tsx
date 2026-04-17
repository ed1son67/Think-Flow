import Link from "next/link";
import { ArrowRight, Orbit, Sparkles } from "lucide-react";

type HomeHeroProps = {
  totalPages: number;
};

export function HomeHero({ totalPages }: HomeHeroProps) {
  return (
    <section className="grain-card rounded-[2rem] border border-line bg-panel-strong p-8 shadow-[0_20px_80px_rgba(73,54,34,0.12)] sm:p-12">
      <div className="home-grid rounded-[1.5rem] border border-white/40 bg-[rgba(255,250,243,0.84)] p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono uppercase tracking-[0.24em] text-accent-strong">
          <span className="rounded-full border border-accent/20 bg-accent-soft px-3 py-1">
            Fumadocs Frontend
          </span>
          <span className="rounded-full border border-line bg-white/60 px-3 py-1">
            Obsidian-Compatible
          </span>
        </div>

        <div className="mt-6 max-w-4xl space-y-6">
          <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.08em] text-foreground sm:text-6xl">
            Think Flow now has a proper front door for the wiki.
          </h1>
          <p className="max-w-2xl text-base leading-8 text-muted sm:text-lg">
            Keep writing in Markdown and Obsidian. The frontend turns the same
            repository wiki into a browsable knowledge surface with sidebar
            navigation, search, and a landing page that feels like a product,
            not a folder dump.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/docs"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong"
          >
            Open the wiki
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-white/70 px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-white"
          >
            Browse the index
            <Orbit className="size-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[1.25rem] border border-line bg-white/80 p-4">
            <p className="text-xs font-mono uppercase tracking-[0.22em] text-muted">
              Scale
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.06em]">
              {totalPages}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Markdown pages available from the current wiki snapshot.
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-line bg-white/80 p-4">
            <p className="text-xs font-mono uppercase tracking-[0.22em] text-muted">
              Search
            </p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.06em]">
              CN + EN
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Orama search is configured for mixed Chinese and English content.
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-line bg-white/80 p-4">
            <p className="text-xs font-mono uppercase tracking-[0.22em] text-muted">
              Workflow
            </p>
            <p className="mt-3 flex items-center gap-2 text-3xl font-semibold tracking-[-0.06em]">
              Keep
              <Sparkles className="size-5 text-accent-strong" />
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              The existing local-first wiki flow stays the source of truth.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
