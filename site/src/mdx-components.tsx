import type { MDXComponents } from "mdx/types";
import defaultMdxComponents from "fumadocs-ui/mdx";
import {
  ObsidianCallout,
  ObsidianCalloutBody,
  ObsidianCalloutTitle,
} from "fumadocs-obsidian/ui";

export const mdxComponents: MDXComponents = {
  ...defaultMdxComponents,
  ObsidianCallout,
  ObsidianCalloutBody,
  ObsidianCalloutTitle,
};

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...mdxComponents,
    ...components,
  };
}
