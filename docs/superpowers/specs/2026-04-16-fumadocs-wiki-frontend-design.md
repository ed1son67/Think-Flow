# Fumadocs Wiki Frontend Design

## Goal

Add a standalone Next.js frontend for this repository's wiki so the existing local-first Markdown knowledge base can be browsed as a modern website with:

- a strong landing page
- searchable documentation pages
- sidebar navigation generated from the wiki structure
- Obsidian-flavored Markdown compatibility

The current `wiki/` directory remains the source of truth.

## Scope

This design covers:

- a new `site/` Next.js application
- one-way content generation from `wiki/` into Fumadocs content folders
- a docs route that renders generated Markdown through Fumadocs
- a custom home page tailored to this repository's knowledge model
- local developer commands for sync, dev, and build

This design does not cover:

- replacing the existing Python ingest/query/lint workflow
- editing wiki content from the browser
- multi-user auth, comments, or remote CMS features
- full Obsidian graph/backlinks parity

## Constraints

- The repository is currently Markdown-first and not an existing Node monorepo.
- `wiki/` and `wiki/.obsidian/` already exist and must remain usable in Obsidian.
- Fumadocs' Obsidian integration is currently documented as experimental.
- Chinese content exists in the wiki, so search should not assume English-only tokenization.
- The diff should stay reviewable and keep the existing repo workflow intact.

## Architecture

The frontend will live in `site/` as an isolated Next.js App Router app.

The content path will be:

1. `wiki/` stays the authoring source.
2. A generation script uses `fumadocs-obsidian` to transform the vault into `site/content/docs` and `site/public`.
3. `fumadocs-mdx` compiles generated docs.
4. `fumadocs-core` + `fumadocs-ui` render the docs site.

This makes the integration reversible and avoids coupling the main repository layout to Next.js conventions.

## Content Model

The site should reflect the existing wiki structure rather than invent a second taxonomy.

Expected top-level docs sections:

- `index`
- `sources`
- `topics`
- `syntheses`
- `concepts` and other future folders when they appear

The generated page tree should come from the generated docs directory so navigation stays aligned with the wiki filesystem.

## UX Direction

The site should look more like a knowledge product than a generic docs skin.

The initial UX should include:

- a custom home page with a strong hero and quick entry points
- category cards for `topics`, `sources`, and `syntheses`
- lightweight repo stats derived from the wiki directory
- a prominent "Open the wiki" CTA into the docs route
- standard Fumadocs sidebar, TOC, breadcrumbs, and search for content pages

The first version should prioritize clarity and intentional styling over novelty for its own sake.

## Routing

- `/` renders the custom landing page
- `/docs` renders the wiki index page
- `/docs/[...slug]` renders all generated wiki pages
- `/api/search` serves Fumadocs built-in Orama search

## Search

Use Fumadocs built-in Orama search through `createFromSource`.

Because the repository contains Chinese content, configure Mandarin tokenization via `@orama/tokenizers/mandarin`.

This keeps search self-hosted and avoids adding external services.

## Sync Strategy

The site must not require users to manually copy files.

Provide a script that:

- reads from repository root `wiki/`
- clears and regenerates `site/content/docs`
- copies assets to `site/public`

Development and build commands should run this sync before `next dev` and `next build`.

## Risks

- The Obsidian adapter may not perfectly preserve every Obsidian-specific behavior.
- Generated navigation may need small adjustments if the current wiki structure changes.
- Search quality for mixed Chinese/English content depends on tokenizer behavior and generated content shape.

## Success Criteria

The work is successful when:

- `npm run dev` in `site/` starts a working Fumadocs site
- the site renders pages generated from the existing `wiki/`
- search works against the generated docs
- the landing page clearly represents Think Flow as a local-first knowledge wiki
- the existing repository workflow remains intact
