import unittest
from pathlib import Path


SKILL_PATH = Path(__file__).resolve().parents[1] / 'skills' / 'llm-wiki-ops' / 'SKILL.md'


class LlmWikiOpsSkillTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.skill_text = SKILL_PATH.read_text(encoding='utf-8')

    def test_skill_has_required_frontmatter_and_sections(self):
        text = self.skill_text

        self.assertIn('name: llm-wiki-ops', text)
        self.assertIn('description: Use when working inside an LLM Wiki repository', text)
        for heading in [
            '# LLM Wiki Ops',
            '## Overview',
            '## When to Use',
            '## Mode Detection',
            '## Required Reads by Mode',
            '## Execution Contract',
            '## Output Contract',
            '## Common Mistakes',
        ]:
            self.assertIn(heading, text)

    def test_skill_requires_repo_rule_files(self):
        text = self.skill_text

        for reference in ['CLAUDE.md', 'prompts/ingest.md', 'prompts/query.md', 'prompts/lint.md', 'wiki/index.md']:
            self.assertIn(reference, text)
        self.assertIn('If those files are missing, stop for clarification instead of continuing.', text)

    def test_skill_has_file_and_inline_ingest_examples(self):
        text = self.skill_text

        for snippet in [
            '## Invocation Examples',
            'Use `llm-wiki-ops` to ingest `raw/inbox/foo.md`.',
            'Use `llm-wiki-ops` to ingest this text:',
            'Use `llm-wiki-ops` to answer:',
            'Use `llm-wiki-ops` to lint the wiki.',
        ]:
            self.assertIn(snippet, text)

    def test_skill_requires_clarification_for_ambiguous_requests(self):
        text = self.skill_text

        self.assertIn('If the request could fit more than one mode, stop and ask a clarifying question instead of guessing.', text)
        self.assertIn('If the request contains both a file path and a separate pasted body of text, stop and ask a clarifying question instead of guessing.', text)

    def test_skill_forbids_content_rewrites_in_safe_fix(self):
        text = self.skill_text

        self.assertIn('Do not rewrite content-rich pages in v1 safe-fix mode.', text)

    def test_skill_supports_single_line_and_multi_line_inline_ingest(self):
        text = self.skill_text

        self.assertIn('single-line inline text', text)
        self.assertIn('multi-line inline text', text)
        self.assertIn('Use `llm-wiki-ops` to ingest this text: We should keep source pages separate from topic pages because sources are evidence and topics are synthesis.', text)
        self.assertIn('# Project Constraints', text)

    def test_skill_requires_inline_text_materialization_into_raw_inbox(self):
        text = self.skill_text

        self.assertIn('materialize the inline text into one new raw file under `raw/inbox/`', text)
        self.assertIn('The text must not bypass the raw evidence layer.', text)
        self.assertIn('If the input is inline text, materialize the inline text into one new raw file under `raw/inbox/`.', text)

    def test_skill_describes_filename_generation_and_collision_handling(self):
        text = self.skill_text

        self.assertIn('If the content starts with a markdown heading like `# Title`, derive a slug from that heading.', text)
        self.assertIn('Otherwise use a generic fallback slug such as `inline-note`, `note`, or `capture`.', text)
        self.assertIn('If the generated filename already exists, append a numeric suffix instead of overwriting.', text)
        self.assertIn('raw/inbox/2026-04-13-inline-note-2.md', text)

    def test_skill_describes_markdown_like_and_plain_text_handling(self):
        text = self.skill_text

        self.assertIn('if the text appears to already be markdown, preserve it as closely as possible', text)
        self.assertIn('if the text appears to be plain text, wrap it minimally into markdown', text)
        self.assertIn('# Untitled Note', text)
        self.assertIn('fenced code blocks', text)

    def test_skill_describes_inline_ingest_failure_boundaries(self):
        text = self.skill_text

        self.assertIn('If the user asks to ingest inline text but does not actually provide enough content to write a source file, the skill must ask for the content instead of creating an empty raw file.', text)
        self.assertIn('If the inline text cannot be written into `raw/inbox/`, the skill must stop and must not proceed to wiki updates.', text)
        self.assertIn('If raw-file creation succeeds but a later ingest step fails, the generated raw file should remain in place for retry and traceability.', text)
