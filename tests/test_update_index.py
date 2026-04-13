import subprocess
import tempfile
import unittest
from pathlib import Path


class UpdateIndexScriptTests(unittest.TestCase):
    def test_reports_missing_source_page_from_index(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            repo = Path(tmpdir)
            (repo / 'wiki' / 'sources').mkdir(parents=True)
            (repo / 'wiki' / 'index.md').write_text('# Index\n\n## Topics\n\n## Sources\n\n## Syntheses\n')
            (repo / 'wiki' / 'sources' / '2026-04-13-llm-wiki-pattern.md').write_text('---\ntitle: LLM Wiki\n---\n')

            result = subprocess.run(
                ['python3', 'scripts/update_index.py', '--root', str(repo)],
                cwd=Path(__file__).resolve().parents[1],
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 1)
            self.assertIn('wiki/sources/2026-04-13-llm-wiki-pattern.md', result.stdout)

    def test_returns_success_when_all_pages_are_indexed(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            repo = Path(tmpdir)
            (repo / 'wiki' / 'sources').mkdir(parents=True)
            (repo / 'wiki' / 'topics').mkdir(parents=True)
            (repo / 'wiki' / 'syntheses').mkdir(parents=True)
            (repo / 'wiki' / 'sources' / '2026-04-13-llm-wiki-pattern.md').write_text('---\ntitle: LLM Wiki\n---\n')
            (repo / 'wiki' / 'topics' / 'knowledge-base-architecture.md').write_text('---\ntitle: Knowledge Base Architecture\n---\n')
            (repo / 'wiki' / 'syntheses' / 'why-separate-source-and-topic-pages.md').write_text('---\ntitle: Why Separate Source and Topic Pages\n---\n')
            (repo / 'wiki' / 'index.md').write_text(
                '# Index\n\n'
                '## Topics\n'
                '- [[knowledge-base-architecture]]\n\n'
                '## Sources\n'
                '- [[2026-04-13-llm-wiki-pattern]]\n\n'
                '## Syntheses\n'
                '- [[why-separate-source-and-topic-pages]]\n'
            )

            result = subprocess.run(
                ['python3', 'scripts/update_index.py', '--root', str(repo)],
                cwd=Path(__file__).resolve().parents[1],
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 0)
            self.assertIn('index coverage ok', result.stdout)


if __name__ == '__main__':
    unittest.main()
