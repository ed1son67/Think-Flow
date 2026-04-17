import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="flex flex-col gap-3 border-t border-line/80 pt-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
      <p>Think Flow wiki frontend built on Next.js + Fumadocs.</p>
      <div className="flex items-center gap-4">
        <Link href="/docs" className="transition hover:text-foreground">
          Docs
        </Link>
        <Link href="/" className="transition hover:text-foreground">
          Home
        </Link>
      </div>
    </footer>
  );
}
