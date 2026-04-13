# Query Prompt

Answer questions from the wiki before consulting raw sources.

## Required behavior
1. Read `wiki/index.md` first.
2. Read the most relevant topic pages in `wiki/topics/`.
3. Read source pages in `wiki/sources/` only if the topics are insufficient.
4. Distinguish current wiki conclusions from inference.
5. If the answer is reusable, save it as a page in `wiki/syntheses/`.
6. If the query reveals missing links or missing structure, update the relevant pages.

## Output checklist
- answer cites the wiki pages used
- durable analysis is promoted into `wiki/syntheses/` when appropriate
