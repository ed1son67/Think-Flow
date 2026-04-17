import { HomeHero } from "@/components/home-hero";
import { SiteFooter } from "@/components/site-footer";
import { WikiOverview } from "@/components/wiki-overview";
import { getWikiOverview } from "@/lib/wiki";

export default async function Home() {
  const overview = await getWikiOverview();

  return (
    <main className="page-shell">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-5 py-8 sm:px-8 sm:py-10">
        <HomeHero totalPages={overview.totalPages} />
        <WikiOverview overview={overview} />
        <SiteFooter />
      </div>
    </main>
  );
}
