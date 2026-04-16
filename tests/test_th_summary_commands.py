import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CLAUDE_COMMAND = ROOT / '.claude' / 'commands' / 'th' / 'summary.md'
CURSOR_COMMAND = ROOT / '.cursor' / 'commands' / 'th' / 'summary.md'


class ThSummaryCommandTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.claude_text = CLAUDE_COMMAND.read_text(encoding='utf-8')
        cls.cursor_text = CURSOR_COMMAND.read_text(encoding='utf-8')

    def test_claude_command_uses_shared_prompt_and_claude_transcript_reader(self):
        text = self.claude_text

        self.assertIn('/th:summary', text)
        self.assertIn('skills/think-flow-summary/prompts/session-summary.md', text)
        self.assertIn('python3 {{PROJECT_ROOT}}/scripts/read_llm_conversation.py --tool claude --current --cwd {{PROJECT_ROOT}} --format json', text)
        self.assertIn('reusable knowledge for future Q&A', text)
        self.assertIn('{{PROJECT_ROOT}}/raw/inbox/', text)
        self.assertIn('skills/think-flow/prompts/ingest.md', text)

    def test_cursor_command_uses_shared_prompt_and_cursor_transcript_reader(self):
        text = self.cursor_text

        self.assertIn('/th:summary', text)
        self.assertIn('skills/think-flow-summary/prompts/session-summary.md', text)
        self.assertIn('python3 {{PROJECT_ROOT}}/scripts/read_llm_conversation.py --tool cursor --current --cwd {{PROJECT_ROOT}} --format json', text)
        self.assertIn('reusable knowledge for future Q&A', text)
        self.assertIn('{{PROJECT_ROOT}}/raw/inbox/', text)
        self.assertIn('skills/think-flow/prompts/ingest.md', text)


if __name__ == '__main__':
    unittest.main()
