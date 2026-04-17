type FrontmatterPanelProps = {
  yaml: string;
};

export function FrontmatterPanel({ yaml }: FrontmatterPanelProps) {
  return (
    <details className="not-prose mb-8 rounded-2xl border border-line bg-panel p-4 shadow-[0_10px_30px_rgba(73,54,34,0.06)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-strong">
          Frontmatter
        </h2>
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
          yaml
        </span>
      </summary>
      <pre className="mt-3 overflow-x-auto rounded-xl border border-line bg-white/75 p-4 text-sm leading-7 text-foreground">
        <code>{yaml}</code>
      </pre>
    </details>
  );
}
