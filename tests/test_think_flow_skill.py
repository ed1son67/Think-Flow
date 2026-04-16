import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SKILL_PATH = ROOT / 'skills' / 'think-flow' / 'SKILL.md'
CLAUDE_PATH = ROOT / 'CLAUDE.md'
QUERY_PROMPT_PATH = ROOT / 'skills' / 'think-flow' / 'prompts' / 'query.md'


class ThinkFlowSkillTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.skill_text = SKILL_PATH.read_text(encoding='utf-8')
        cls.claude_text = CLAUDE_PATH.read_text(encoding='utf-8')
        cls.query_prompt_text = QUERY_PROMPT_PATH.read_text(encoding='utf-8')

    def test_skill_has_required_frontmatter_and_sections(self):
        text = self.skill_text

        self.assertIn('name: think-flow', text)
        self.assertIn('description: Use when working inside a Think Flow wiki repository', text)
        for heading in [
            '# Think Flow',
            '## Overview',
            '## When to Use',
            '## Command Routing',
            '## Required Reads by Command',
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

    def test_skill_uses_project_root_placeholder_paths(self):
        text = self.skill_text

        self.assertIn('All paths in this skill are absolute paths anchored to `{{PROJECT_ROOT}}`.', text)
        self.assertIn('Use injected absolute paths such as `{{PROJECT_ROOT}}/CLAUDE.md` and `{{PROJECT_ROOT}}/wiki/index.md`.', text)
        self.assertIn('{{PROJECT_ROOT}}/CLAUDE.md', text)
        self.assertIn('{{PROJECT_ROOT}}/skills/think-flow/prompts/ingest.md', text)
        self.assertNotIn('`./wiki/index.md`', text)
        self.assertNotIn('`./CLAUDE.md`', text)
        self.assertNotIn('`./prompts/ingest.md`', text)
        self.assertNotIn('/Users/zifeng.chen/bb/think-flow', text)
        self.assertNotIn('llm-wiki-ops', text)

    def test_claude_rules_declare_project_root_placeholder_base(self):
        text = self.claude_text

        self.assertIn('All repository paths below are absolute paths anchored to `{{PROJECT_ROOT}}`.', text)
        self.assertIn('{{PROJECT_ROOT}}/wiki/index.md', text)
        self.assertIn('{{PROJECT_ROOT}}/skills/think-flow/prompts/', text)

    def test_skill_has_explicit_slash_command_examples(self):
        text = self.skill_text

        for snippet in [
            '## Invocation Examples',
            '`/th:ingest {{PROJECT_ROOT}}/raw/inbox/foo.md`',
            '`/th:ingest We should keep source pages separate from topic pages because sources are evidence and topics are synthesis.`',
            '`/th:query What does the wiki conclude about source ingestion?`',
            '`/th:lint`',
        ]:
            self.assertIn(snippet, text)

    def test_skill_routes_commands_explicitly(self):
        text = self.skill_text

        self.assertIn('Use `/th:ingest` for both file ingest and inline ingest inputs.', text)
        self.assertIn('Use `/th:query` for questions grounded in existing wiki content.', text)
        self.assertIn('Use `/th:lint` for health checks, missing-page checks, and structural hygiene.', text)
        self.assertIn('If the user omits the `/th:` command prefix and the intent is ambiguous, stop and ask a clarifying question instead of guessing.', text)
        self.assertIn('If the request contains both a file path and a separate pasted body of text, stop and ask a clarifying question instead of guessing.', text)

    def test_skill_supports_single_line_and_multi_line_inline_ingest(self):
        text = self.skill_text

        self.assertIn('single-line inline text', text)
        self.assertIn('multi-line inline text', text)
        self.assertIn('`/th:ingest We should keep source pages separate from topic pages because sources are evidence and topics are synthesis.`', text)
        self.assertIn('# Project Constraints', text)

    def test_skill_requires_inline_text_materialization_into_raw_inbox(self):
        text = self.skill_text

        self.assertIn('materialize the inline text into one new raw file under `{{PROJECT_ROOT}}/raw/inbox/`', text)
        self.assertIn('The text must not bypass the raw evidence layer.', text)
        self.assertIn('If the `/th:ingest` input is inline text, materialize the inline text into one new raw file under `{{PROJECT_ROOT}}/raw/inbox/`.', text)

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
        self.assertIn('If the inline text cannot be written into `{{PROJECT_ROOT}}/raw/inbox/`, the skill must stop and must not proceed to wiki updates.', text)
        self.assertIn('If raw-file creation succeeds but a later ingest step fails, the generated raw file should remain in place for retry and traceability.', text)

    def test_query_output_contract_requires_a_dedicated_sources_section(self):
        text = self.skill_text
        prompt_text = self.query_prompt_text

        self.assertIn('`## 来源` section to the end of the answer', text)
        self.assertIn('`## 来源` section to the end of the answer', prompt_text)
        self.assertIn('list only the wiki pages actually used', text)
        self.assertIn('list only the wiki pages actually used', prompt_text)


if __name__ == '__main__':
    unittest.main()
