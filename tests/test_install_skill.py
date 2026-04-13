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

    def write_tree(self, root: Path, files: dict[str, str]) -> None:
        for relative_path, contents in files.items():
            path = root / relative_path
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(contents, encoding='utf-8')

    def read_tree(self, root: Path) -> dict[str, str]:
        return {
            str(path.relative_to(root)): path.read_text(encoding='utf-8')
            for path in sorted(candidate for candidate in root.rglob('*') if candidate.is_file())
        }

    def test_install_into_empty_target_root_renders_project_root(self):
        with tempfile.TemporaryDirectory() as tmp:
            project_root = (Path(tmp) / 'project').resolve()
            source = project_root / 'skills' / 'llm-wiki-ops'
            target_root = (Path(tmp) / 'target').resolve()
            self.write_tree(
                source,
                {
                    'SKILL.md': 'read {{PROJECT_ROOT}}/skills/llm-wiki-ops/CLAUDE.md',
                    'CLAUDE.md': 'write into {{PROJECT_ROOT}}/wiki/index.md',
                    'prompts/query.md': 'scan {{PROJECT_ROOT}}/wiki/topics',
                },
            )

            result = self.run_script(
                '--source', str(source),
                '--project-root', str(project_root),
                '--target-root', str(target_root),
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            target = target_root / 'llm-wiki-ops'
            self.assertTrue(target.is_dir())
            self.assertEqual(
                self.read_tree(target),
                {
                    'CLAUDE.md': f'write into {project_root}/wiki/index.md',
                    'SKILL.md': f'read {project_root}/skills/llm-wiki-ops/CLAUDE.md',
                    'prompts/query.md': f'scan {project_root}/wiki/topics',
                },
            )
            self.assertEqual(
                result.stdout.strip().splitlines(),
                [
                    'installed llm-wiki-ops',
                    f'source: {source}',
                    f'target: {target}',
                ],
            )

    def test_update_replaces_contents_and_removes_stale_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            project_root = (Path(tmp) / 'project').resolve()
            source = project_root / 'skills' / 'llm-wiki-ops'
            target_root = (Path(tmp) / 'target').resolve()
            self.write_tree(
                source,
                {
                    'SKILL.md': 'skill for {{PROJECT_ROOT}}',
                    'CLAUDE.md': 'helper for {{PROJECT_ROOT}}/wiki',
                    'prompts/ingest.md': 'ingest {{PROJECT_ROOT}}/raw/inbox',
                },
            )
            target = target_root / 'llm-wiki-ops'
            self.write_tree(
                target,
                {
                    'SKILL.md': 'old skill',
                    'CLAUDE.md': 'old helper',
                    'stale.txt': 'delete me',
                    'prompts/obsolete.md': 'delete me too',
                },
            )

            result = self.run_script(
                '--source', str(source),
                '--project-root', str(project_root),
                '--target-root', str(target_root),
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(
                self.read_tree(target),
                {
                    'CLAUDE.md': f'helper for {project_root}/wiki',
                    'SKILL.md': f'skill for {project_root}',
                    'prompts/ingest.md': f'ingest {project_root}/raw/inbox',
                },
            )
            self.assertFalse((target / 'stale.txt').exists())
            self.assertFalse((target / 'prompts' / 'obsolete.md').exists())
            self.assertEqual(
                result.stdout.strip().splitlines(),
                [
                    'updated llm-wiki-ops',
                    f'source: {source}',
                    f'target: {target}',
                ],
            )

    def test_fail_clearly_when_source_directory_is_missing(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / 'missing-skill-dir'
            target_root = Path(tmp) / 'target'

            result = self.run_script('--source', str(source), '--target-root', str(target_root))

            self.assertEqual(result.returncode, 1)
            self.assertIn('error: source directory not found', result.stderr)
            self.assertIn(str(source), result.stderr)


if __name__ == '__main__':
    unittest.main()
