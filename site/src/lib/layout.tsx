import type { LinkItemType } from "fumadocs-ui/layouts/shared";
import { Compass, LibraryBig, Search } from "lucide-react";

export const docsLinks: LinkItemType[] = [
  {
    type: "main",
    text: "Home",
    url: "/",
    icon: <Compass className="size-4" />,
  },
  {
    type: "main",
    text: "Wiki",
    url: "/docs",
    icon: <LibraryBig className="size-4" />,
  },
  {
    type: "main",
    text: "Search",
    url: "/docs",
    active: "none",
    icon: <Search className="size-4" />,
  },
];

export const navTitle = (
  <div className="flex items-center gap-3 text-[0.95rem] font-semibold tracking-[-0.04em] text-foreground">
    <span className="flex size-9 items-center justify-center rounded-2xl border border-line bg-panel-strong shadow-[0_10px_30px_rgba(76,58,36,0.08)]">
      <LibraryBig className="size-4 text-accent-strong" />
    </span>
    <span className="flex flex-col leading-none">
      <span>Think Flow</span>
      <span className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-muted">
        wiki.frontend
      </span>
    </span>
  </div>
);
