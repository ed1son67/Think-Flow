# Fumadocs Wiki Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a standalone Next.js + Fumadocs frontend in `site/` that renders the repository's existing `wiki/` content as a browsable website.

**Architecture:** Keep `wiki/` as the source of truth, generate Fumadocs-compatible content into `site/content/docs`, and render it through a custom landing page plus standard docs routes. Use built-in Orama search with Mandarin tokenization for mixed Chinese/English content.

**Tech Stack:** Next.js App Router, React, TypeScript, Fumadocs UI/Core/MDX, Fumadocs Obsidian, Orama search

---

## File Map

- Create: `site/package.json`
- Create: `site/tsconfig.json`
- Create: `site/next.config.mjs`
- Create: `site/eslint.config.mjs`
- Create: `site/postcss.config.mjs`
- Create: `site/.gitignore`
- Create: `site/next-env.d.ts`
- Create: `site/source.config.ts`
- Create: `site/scripts/generate-content.mjs`
- Create: `site/app/layout.tsx`
- Create: `site/app/globals.css`
- Create: `site/app/page.tsx`
- Create: `site/app/docs/layout.tsx`
- Create: `site/app/docs/[[...slug]]/page.tsx`
- Create: `site/app/api/search/route.ts`
- Create: `site/lib/source.ts`
- Create: `site/lib/layout.tsx`
- Create: `site/lib/wiki.ts`
- Create: `site/mdx-components.tsx`
- Create: `site/components/home-hero.tsx`
- Create: `site/components/wiki-overview.tsx`
- Create: `site/components/site-footer.tsx`
- Create: `site/public/.gitkeep`
- Create: `site/content/docs/.gitkeep`
- Modify: `README.md`

### Task 1: Scaffold the isolated site workspace

**Files:**
- Create: `site/package.json`
- Create: `site/tsconfig.json`
- Create: `site/next.config.mjs`
- Create: `site/eslint.config.mjs`
- Create: `site/postcss.config.mjs`
- Create: `site/.gitignore`
- Create: `site/next-env.d.ts`

- [ ] Add the standalone Next.js workspace and dependency manifest.
- [ ] Configure App Router, TypeScript path aliases, and Fumadocs MDX integration.
- [ ] Add the minimal repo-local ignore rules for `.next`, `.source`, and `node_modules`.

### Task 2: Add wiki-to-Fumadocs generation

**Files:**
- Create: `site/source.config.ts`
- Create: `site/scripts/generate-content.mjs`
- Create: `site/public/.gitkeep`
- Create: `site/content/docs/.gitkeep`

- [ ] Configure `fumadocs-mdx` to read from `site/content/docs`.
- [ ] Add a generation script that reads root `wiki/`, regenerates `site/content/docs`, and emits assets to `site/public`.
- [ ] Wire the site scripts so sync runs before `dev` and `build`.

### Task 3: Build the Fumadocs shell

**Files:**
- Create: `site/app/layout.tsx`
- Create: `site/app/docs/layout.tsx`
- Create: `site/app/docs/[[...slug]]/page.tsx`
- Create: `site/app/api/search/route.ts`
- Create: `site/lib/source.ts`
- Create: `site/lib/layout.tsx`
- Create: `site/mdx-components.tsx`

- [ ] Set up the root provider and global document shell.
- [ ] Configure the docs layout with repo-aware nav links and generated page tree.
- [ ] Render wiki pages through Fumadocs docs page components.
- [ ] Add built-in Orama search with Mandarin tokenization.
- [ ] Register Fumadocs Obsidian MDX components so generated content renders correctly.

### Task 4: Build the custom landing experience

**Files:**
- Create: `site/app/page.tsx`
- Create: `site/lib/wiki.ts`
- Create: `site/components/home-hero.tsx`
- Create: `site/components/wiki-overview.tsx`
- Create: `site/components/site-footer.tsx`
- Create: `site/app/globals.css`

- [ ] Read lightweight stats from the repo wiki folder for the landing page.
- [ ] Design a custom home page with category entry points and high-signal project framing.
- [ ] Add a visual system that feels intentional and distinct from the default docs skin.

### Task 5: Document and verify

**Files:**
- Modify: `README.md`

- [ ] Add a short "Frontend Wiki" section with local commands.
- [ ] Install dependencies.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Record any remaining risks that are real and unresolved.
