import type { CSSProperties } from "react";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer
      className="motion-stagger flex flex-col gap-3 border-t border-line/80 pt-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between"
      style={{ "--motion-delay": "360ms" } as CSSProperties}
    >
      <p>Think Flow wiki frontend built on Next.js + Fumadocs.</p>
      <div className="flex items-center gap-4">
        <Link
          href="/docs"
          className="surface-interactive rounded-full px-3 py-1 transition hover:text-foreground"
        >
          Docs
        </Link>
        <Link
          href="/"
          className="surface-interactive rounded-full px-3 py-1 transition hover:text-foreground"
        >
          Home
        </Link>
      </div>
    </footer>
  );
}
