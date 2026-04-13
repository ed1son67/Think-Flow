import subprocess
import tempfile
import unittest
from pathlib import Path


class NewSourceScriptTests(unittest.TestCase):
    def test_creates_dated_source_page_with_template(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            repo = Path(tmpdir)
            (repo / 'wiki' / 'sources').mkdir(parents=True)

            result = subprocess.run(
                [
                    'python3',
                    'scripts/new_source.py',
                    '--root',
                    str(repo),
                    '--date',
                    '2026-04-13',
                    '--title',
                    'LLM Wiki',
                    '--slug',
                    'llm-wiki-pattern',
                    '--topic-ref',
                    'knowledge-base-architecture',
                ],
                cwd=Path(__file__).resolve().parents[1],
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            created = repo / 'wiki' / 'sources' / '2026-04-13-llm-wiki-pattern.md'
            self.assertTrue(created.exists())
            text = created.read_text()
            self.assertIn('title: LLM Wiki', text)
            self.assertIn('type: source', text)
            self.assertIn('created: 2026-04-13', text)
            self.assertIn('- knowledge-base-architecture', text)
            self.assertIn('# Summary', text)
            self.assertIn('# Related Topics', text)

    def test_fails_when_target_file_already_exists(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            repo = Path(tmpdir)
            target_dir = repo / 'wiki' / 'sources'
            target_dir.mkdir(parents=True)
            target = target_dir / '2026-04-13-llm-wiki-pattern.md'
            target.write_text('existing')

            result = subprocess.run(
                [
                    'python3',
                    'scripts/new_source.py',
                    '--root',
                    str(repo),
                    '--date',
                    '2026-04-13',
                    '--title',
                    'LLM Wiki',
                    '--slug',
                    'llm-wiki-pattern',
                ],
                cwd=Path(__file__).resolve().parents[1],
                capture_output=True,
                text=True,
            )

            self.assertNotEqual(result.returncode, 0)
            self.assertIn('already exists', result.stderr)


if __name__ == '__main__':
    unittest.main()
