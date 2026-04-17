import type { Metadata } from "next";
import { RootProvider } from "fumadocs-ui/provider/next";
import { AskWikiProvider } from "@/components/ask-wiki/ask-wiki-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Think Flow",
    template: "%s | Think Flow",
  },
  description:
    "A Fumadocs-powered frontend for the Think Flow local-first Markdown wiki.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <RootProvider
          search={{
            enabled: true,
            options: {
              api: "/api/search",
              links: [
                ["Home", "/"],
                ["Open Wiki", "/docs"],
              ],
            },
          }}
          theme={{ enabled: false }}
        >
          {children}
          <AskWikiProvider />
        </RootProvider>
      </body>
    </html>
  );
}
