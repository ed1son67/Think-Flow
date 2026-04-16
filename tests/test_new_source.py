import subprocess
import tempfile
import unittest
from pathlib import Path


class NewSourceScriptTests(unittest.TestCase):
    def test_creates_dated_source_page_with_concept_and_question_refs(self):
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
                    'React Fiber Notes',
                    '--slug',
                    'react-fiber-notes',
                    '--concept-ref',
                    'react-fiber',
                    '--question-ref',
                    'what-is-react-fiber',
                ],
                cwd=Path(__file__).resolve().parents[1],
                capture_output=True,
                text=True,
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            created = repo / 'wiki' / 'sources' / '2026-04-13-react-fiber-notes.md'
            self.assertTrue(created.exists())
            text = created.read_text()
            self.assertIn('id: react-fiber-notes', text)
            self.assertIn('title: React Fiber Notes', text)
            self.assertIn('type: source', text)
            self.assertIn('created: 2026-04-13', text)
            self.assertIn('aliases: []', text)
            self.assertIn('tags: []', text)
            self.assertIn('source_kind: note', text)
            self.assertIn('raw_path: ""', text)
            self.assertIn('trust_level: medium', text)
            self.assertIn('claim_count: 0', text)
            self.assertIn('concept_refs:\n  - react-fiber', text)
            self.assertIn('question_refs:\n  - what-is-react-fiber', text)
            self.assertIn('# Source Summary', text)
            self.assertIn('# Claims', text)
            self.assertIn('# Evidence Notes', text)
            self.assertIn('# Key Excerpts / Positions', text)
            self.assertIn('# Reliability Notes', text)
            self.assertIn('# Linked Concepts', text)
            self.assertIn('# Linked Questions', text)

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
