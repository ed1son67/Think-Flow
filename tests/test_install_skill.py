import subprocess
import sys
import tempfile
from pathlib import Path
import unittest

ROOT = Path('/Users/zifeng.chen/bb/think-flow')
SCRIPT = ROOT / 'scripts' / 'install_skill.py'


class InstallSkillTests(unittest.TestCase):
    def run_script(self, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(SCRIPT), *args],
            text=True,
            capture_output=True,
        )

    def test_install_into_empty_target_root(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / 'SKILL.md'
            source.write_text('installed content')
            target_root = Path(tmp) / 'target'

            result = self.run_script('--source', str(source), '--target-root', str(target_root))

            self.assertEqual(result.returncode, 0)
            target = target_root / 'llm-wiki-ops' / 'SKILL.md'
            self.assertTrue(target.exists())
            self.assertEqual(target.read_text(), 'installed content')
            self.assertEqual(
                result.stdout.strip().splitlines(),
                [
                    'installed llm-wiki-ops',
                    f'source: {source}',
                    f'target: {target}',
                ],
            )

    def test_update_existing_skill_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / 'SKILL.md'
            source.write_text('updated content')
            target_root = Path(tmp) / 'target'
            target = target_root / 'llm-wiki-ops' / 'SKILL.md'
            target.parent.mkdir(parents=True)
            target.write_text('old content')

            result = self.run_script('--source', str(source), '--target-root', str(target_root))

            self.assertEqual(result.returncode, 0)
            self.assertEqual(target.read_text(), 'updated content')
            self.assertEqual(
                result.stdout.strip().splitlines(),
                [
                    'updated llm-wiki-ops',
                    f'source: {source}',
                    f'target: {target}',
                ],
            )

    def test_fail_clearly_when_source_file_is_missing(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / 'missing.md'
            target_root = Path(tmp) / 'target'

            result = self.run_script('--source', str(source), '--target-root', str(target_root))

            self.assertEqual(result.returncode, 1)
            self.assertIn('error: source file not found', result.stderr)


if __name__ == '__main__':
    unittest.main()
