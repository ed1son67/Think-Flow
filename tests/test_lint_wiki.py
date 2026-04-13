import subprocess
import tempfile
import unittest
from pathlib import Path


class LintWikiScriptTests(unittest.TestCase):
    def test_report_mode_flags_missing_frontmatter_and_index(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            repo = Path(tmpdir)
            (repo / 'wiki' / 'sources').mkdir(parents=True)
            (repo / 'wiki' / 'topics').mkdir(parents=True)
            (repo / 'wiki' / 'syntheses').mkdir(parents=True)
            (repo / 'wiki' / 'index.md').write_text('# Index\n\n## Topics\n\n## Sources\n\n## Syntheses\n')
            (repo / 'wiki' / 'log.md').write_text('# Log\n')
            (repo / 'wiki' / 'topics' / 'knowledge-base-architecture.md').write_text('# Current View\n')

            result = subprocess.run(
                ['python3', 'scripts/lint_wiki.py', '--root', str(repo), '--mode', 'report'],
                cwd=Path(__file__).resolve().parents[1],
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 1)
            self.assertIn('missing frontmatter: wiki/topics/knowledge-base-architecture.md', result.stdout)
            self.assertIn('missing index entry: wiki/topics/knowledge-base-architecture.md', result.stdout)

    def test_safe_fix_creates_missing_index_and_log_files(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            repo = Path(tmpdir)
            (repo / 'wiki' / 'sources').mkdir(parents=True)
            (repo / 'wiki' / 'topics').mkdir(parents=True)
            (repo / 'wiki' / 'syntheses').mkdir(parents=True)

            result = subprocess.run(
                ['python3', 'scripts/lint_wiki.py', '--root', str(repo), '--mode', 'safe-fix'],
                cwd=Path(__file__).resolve().parents[1],
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertTrue((repo / 'wiki' / 'index.md').exists())
            self.assertTrue((repo / 'wiki' / 'log.md').exists())
            self.assertIn('created wiki/index.md', result.stdout)
            self.assertIn('created wiki/log.md', result.stdout)


if __name__ == '__main__':
    unittest.main()
