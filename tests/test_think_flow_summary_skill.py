import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SKILL_PATH = ROOT / 'skills' / 'think-flow-summary' / 'SKILL.md'
PROMPT_PATH = ROOT / 'skills' / 'think-flow-summary' / 'prompts' / 'session-summary.md'


class ThinkFlowSummarySkillTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.skill_text = SKILL_PATH.read_text(encoding='utf-8')
        cls.prompt_text = PROMPT_PATH.read_text(encoding='utf-8')

    def test_skill_references_shared_prompt_and_all_supported_tools(self):
        text = self.skill_text

        self.assertIn('skills/think-flow-summary/prompts/session-summary.md', text)
        self.assertIn('`codex`', text)
        self.assertIn('`claude`', text)
        self.assertIn('`cursor`', text)
        self.assertIn('python3 {{PROJECT_ROOT}}/scripts/read_llm_conversation.py --tool codex --current --cwd {{PROJECT_ROOT}} --format json', text)
        self.assertIn('{{PROJECT_ROOT}}/raw/inbox/', text)
        self.assertIn('/th:ingest', text)

    def test_prompt_organizes_summary_for_reusable_knowledge_qa(self):
        text = self.prompt_text

        for snippet in [
            '# Session Summary Prompt',
            '## Topic and Intent',
            '## Reusable Knowledge',
            '## Definitions, Facts, and Mappings',
            '## Causal Insights and Rationale',
            '## Constraints, Boundaries, and Exceptions',
            '## Evidence and Verification',
            '## FAQ Candidates',
            '## Open Questions or Follow-ups',
        ]:
            self.assertIn(snippet, text)
        self.assertIn('Do not produce a generic chronological recap.', text)
        self.assertIn('Summarize the conversation as reusable knowledge for future Q&A and follow-up work.', text)
        self.assertIn('Optimize for future retrieval and reuse in a knowledge-Q&A workflow.', text)
        self.assertIn('## Persistence Requirements', text)
        self.assertIn('After producing the summary, persist it as exactly one new markdown note under `{{PROJECT_ROOT}}/raw/inbox/`, then continue the normal Think Flow ingest workflow so the note is ingested into the wiki.', text)
        self.assertIn('read `{{PROJECT_ROOT}}/skills/think-flow/prompts/ingest.md`', text)


if __name__ == '__main__':
    unittest.main()
