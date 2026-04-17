import test from "node:test";
import assert from "node:assert/strict";

import { buildEvidenceItems } from "../src/components/ask-wiki/ask-wiki-view-model.ts";

test("buildEvidenceItems prioritizes cited sources over process activity", () => {
  const sourceItems = [
    {
      key: "wiki/architecture/search.md",
      label: "Search Architecture",
      href: "/docs/architecture/search",
      detail: "wiki/architecture/search.md",
      excerpt: "Explains the retrieval pipeline used by Ask Wiki.",
      usedInAnswer: true,
    },
  ];

  const items = buildEvidenceItems({
    sourceItems,
  });

  assert.equal(items.length, 1);
  assert.deepEqual(items[0], {
    key: "wiki/architecture/search.md",
    kind: "source",
    label: "Search Architecture",
    detail: "wiki/architecture/search.md",
    note: "Used directly in the answer. Explains the retrieval pipeline used by Ask Wiki.",
    tone: "success",
    defaultOpen: true,
    href: "/docs/architecture/search",
    usedInAnswer: true,
  });
});

test("buildEvidenceItems keeps supporting matches but does not auto-expand them", () => {
  const sourceItems = [
    {
      key: "wiki/architecture/search.md",
      label: "Search Architecture",
      href: "/docs/architecture/search",
      detail: "wiki/architecture/search.md",
      excerpt: "Explains the retrieval pipeline used by Ask Wiki.",
    },
  ];

  const items = buildEvidenceItems({
    sourceItems,
  });

  assert.equal(items.length, 1);
  assert.deepEqual(items[0], {
    key: "wiki/architecture/search.md",
    kind: "source",
    label: "Search Architecture",
    detail: "wiki/architecture/search.md",
    note: "High-ranking supporting match. Explains the retrieval pipeline used by Ask Wiki.",
    tone: "neutral",
    defaultOpen: false,
    href: "/docs/architecture/search",
    usedInAnswer: false,
  });
});
