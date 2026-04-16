import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class ThWikiCommandTests(unittest.TestCase):
    def read(self, relative_path: str) -> str:
        return (ROOT / relative_path).read_text(encoding='utf-8')

    def test_claude_query_command_uses_shared_prompt(self):
        text = self.read('.claude/commands/th/query.md')

        self.assertIn('/th:query', text)
        self.assertIn('skills/think-flow/prompts/query.md', text)
        self.assertIn('{{PROJECT_ROOT}}/CLAUDE.md', text)
        self.assertIn('{{PROJECT_ROOT}}/wiki/index.md', text)
        self.assertIn('append a `## 来源` section at the end of the answer', text)
        self.assertIn('list only the wiki pages actually used', text)

    def test_claude_ingest_command_uses_shared_prompt(self):
        text = self.read('.claude/commands/th/ingest.md')

        self.assertIn('/th:ingest', text)
        self.assertIn('skills/think-flow/prompts/ingest.md', text)
        self.assertIn('{{PROJECT_ROOT}}/CLAUDE.md', text)
        self.assertIn('{{PROJECT_ROOT}}/raw/inbox/', text)

    def test_claude_lint_command_uses_shared_prompt(self):
        text = self.read('.claude/commands/th/lint.md')

        self.assertIn('/th:lint', text)
        self.assertIn('skills/think-flow/prompts/lint.md', text)
        self.assertIn('{{PROJECT_ROOT}}/CLAUDE.md', text)
        self.assertIn('{{PROJECT_ROOT}}/wiki/index.md', text)

    def test_cursor_query_command_uses_shared_prompt(self):
        text = self.read('.cursor/commands/th/query.md')

        self.assertIn('/th:query', text)
        self.assertIn('skills/think-flow/prompts/query.md', text)
        self.assertIn('{{PROJECT_ROOT}}/CLAUDE.md', text)
        self.assertIn('append a `## 来源` section at the end of the answer', text)
        self.assertIn('list only the wiki pages actually used', text)

    def test_cursor_ingest_command_uses_shared_prompt(self):
        text = self.read('.cursor/commands/th/ingest.md')

        self.assertIn('/th:ingest', text)
        self.assertIn('skills/think-flow/prompts/ingest.md', text)
        self.assertIn('{{PROJECT_ROOT}}/CLAUDE.md', text)

    def test_cursor_lint_command_uses_shared_prompt(self):
        text = self.read('.cursor/commands/th/lint.md')

        self.assertIn('/th:lint', text)
        self.assertIn('skills/think-flow/prompts/lint.md', text)
        self.assertIn('{{PROJECT_ROOT}}/CLAUDE.md', text)


if __name__ == '__main__':
    unittest.main()
