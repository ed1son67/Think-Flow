import { defineConfig, defineDocs, frontmatterSchema } from "fumadocs-mdx/config";
import { z } from "zod";

export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: frontmatterSchema.extend({
      type: z.string().optional(),
      status: z.string().optional(),
      created: z.string().optional(),
      updated: z.string().optional(),
      tags: z.array(z.string()).optional(),
      source_refs: z.array(z.string()).optional(),
      topic_refs: z.array(z.string()).optional(),
      repoPath: z.string().optional(),
      section: z.string().optional(),
      frontmatterYaml: z.string().optional(),
    }),
  },
});

export default defineConfig({});
