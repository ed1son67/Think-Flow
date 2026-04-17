import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/page";
import { FrontmatterPanel } from "@/components/frontmatter-panel";
import { mdxComponents } from "@/mdx-components";
import { source } from "@/lib/source";

type PageProps = {
  params: Promise<{
    slug?: string[];
  }>;
};

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug = [] } = await params;
  const page = source.getPage(slug);

  if (!page) {
    return {};
  }

  const title = page.data.title ?? "Think Flow";
  const description =
    page.data.description ??
    `Browse ${title} in the Think Flow knowledge wiki frontend.`;

  return {
    title,
    description,
  };
}

export default async function DocsCatchAllPage({ params }: PageProps) {
  const { slug = [] } = await params;
  const page = source.getPage(slug);

  if (!page) {
    notFound();
  }

  const MDXContent = page.data.body;
  const frontmatterYaml =
    typeof page.data.frontmatterYaml === "string"
      ? page.data.frontmatterYaml
      : undefined;
  const shouldShowFrontmatter =
    page.data.section === "sources" &&
    typeof frontmatterYaml === "string" &&
    frontmatterYaml.length > 0;

  return (
    <DocsPage toc={page.data.toc}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody className="wiki-prose">
        {shouldShowFrontmatter ? (
          <FrontmatterPanel yaml={frontmatterYaml} />
        ) : null}
        <MDXContent components={mdxComponents} />
      </DocsBody>
    </DocsPage>
  );
}
