import type { ReactNode } from "react";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { docsLinks, navTitle } from "@/lib/layout";
import { source } from "@/lib/source";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      nav={{
        title: navTitle,
        url: "/",
        transparentMode: "none",
      }}
      links={docsLinks}
      sidebar={{ enabled: true }}
      searchToggle={{ enabled: true }}
      themeSwitch={{ enabled: false }}
    >
      {children}
    </DocsLayout>
  );
}
