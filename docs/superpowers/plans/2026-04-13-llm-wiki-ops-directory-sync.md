# LLM Wiki Ops Directory Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Change `python3 scripts/install_skill.py` so it mirrors the full repo-local `skills/llm-wiki-ops/` directory into Claude Code's global skills directory.

**Architecture:** Keep `skills/llm-wiki-ops/` as the only source of truth, then update the installer from single-file copy behavior to full-directory mirror behavior. Replace the installer tests with directory-level cases that prove install, update, stale-file deletion, and clear failure when the source directory is missing. Keep the contract tests for `skills/llm-wiki-ops/SKILL.md` unchanged, and verify the real install target after the installer passes locally.

**Tech Stack:** Python 3 standard library (`argparse`, `pathlib`, `shutil`, `tempfile`, `subprocess`, `unittest`)

---

## File Structure

### Files to modify
- `/Users/zifeng.chen/bb/think-flow/scripts/install_skill.py` — change from copying one file to mirroring the full skill directory
- `/Users/zifeng.chen/bb/think-flow/tests/test_install_skill.py` — replace single-file installer tests with directory-sync tests

### Files to verify
- `/Users/zifeng.chen/bb/think-flow/skills/llm-wiki-ops/SKILL.md` — canonical repo-local skill entrypoint, still validated by contract tests
- `/Users/zifeng.chen/bb/think-flow/skills/llm-wiki-ops/CLAUDE.md` — helper file that must now be included in the install
- `/Users/zifeng.chen/bb/think-flow/skills/llm-wiki-ops/prompts/ingest.md` — prompt file that must now be included in the install
- `/Users/zifeng.chen/bb/think-flow/skills/llm-wiki-ops/prompts/query.md` — prompt file that must now be included in the install
- `/Users/zifeng.chen/bb/think-flow/skills/llm-wiki-ops/prompts/lint.md` — prompt file that must now be included in the install
- `/Users/zifeng.chen/bb/think-flow/tests/test_llm_wiki_ops_skill.py` — unchanged contract test against the repo-local `SKILL.md`
- `/Users/zifeng.chen/bb/think-flow/docs/superpowers/specs/2026-04-13-llm-wiki-ops-directory-sync-design.md` — approved design source

## Implementation Notes

- The source path is the directory `/Users/zifeng.chen/bb/think-flow/skills/llm-wiki-ops`.
- The managed target path is the directory `~/.claude/skills/llm-wiki-ops`.
- Mirror semantics mean the target must match the source exactly after each run.
- Target-only files inside `~/.claude/skills/llm-wiki-ops` must be removed during update.
- Keep `--target-root` support for isolated tests.
- Preserve the current `--source` override so tests can point at a temporary source directory.
- Do not add symlink logic, reverse sync, multi-skill management, or git commit logic.
- Do not change `/Users/zifeng.chen/bb/think-flow/tests/test_llm_wiki_ops_skill.py` unless verification shows it is required.

### Task 1: Rewrite the installer tests around directory mirroring

**Files:**
- Modify: `/Users/zifeng.chen/bb/think-flow/tests/test_install_skill.py`
- Test: `/Users/zifeng.chen/bb/think-flow/tests/test_install_skill.py`

- [ ] **Step 1: Replace the installer test file with directory-sync expectations**

```python
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

    def test_install_into_empty_target_root(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / 'source'
            target_root = Path(tmp) / 'target'
            self.write_tree(
                source,
                {
                    'SKILL.md': 'installed skill',
                    'CLAUDE.md': 'repo-local helper rules',
                    'prompts/ingest.md': 'ingest prompt',
                    'prompts/query.md': 'query prompt',
                },
            )

            result = self.run_script('--source', str(source), '--target-root', str(target_root))

            self.assertEqual(result.returncode, 0, result.stderr)
            target = target_root / 'llm-wiki-ops'
            self.assertTrue(target.is_dir())
            self.assertEqual(self.read_tree(target), self.read_tree(source))
            self.assertEqual(
                result.stdout.strip().splitlines(),
                [
                    'installed llm-wiki-ops',
                    f'source: {source}',
                    f'target: {target}',
                ],
            )

    def test_update_replaces_existing_file_contents(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / 'source'
            target_root = Path(tmp) / 'target'
            self.write_tree(
                source,
                {
                    'SKILL.md': 'updated skill',
                    'CLAUDE.md': 'updated helper rules',
                    'prompts/query.md': 'updated query prompt',
                },
            )
            target = target_root / 'llm-wiki-ops'
            self.write_tree(
                target,
                {
                    'SKILL.md': 'old skill',
                    'CLAUDE.md': 'old helper rules',
                    'prompts/query.md': 'old query prompt',
                },
            )

            result = self.run_script('--source', str(source), '--target-root', str(target_root))

            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(self.read_tree(target), self.read_tree(source))
            self.assertEqual(
                result.stdout.strip().splitlines(),
                [
                    'updated llm-wiki-ops',
                    f'source: {source}',
                    f'target: {target}',
                ],
            )

    def test_update_removes_stale_target_only_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / 'source'
            target_root = Path(tmp) / 'target'
            self.write_tree(
                source,
                {
                    'SKILL.md': 'current skill',
                    'prompts/ingest.md': 'current ingest prompt',
                },
            )
            target = target_root / 'llm-wiki-ops'
            self.write_tree(
                target,
                {
                    'SKILL.md': 'old skill',
                    'prompts/ingest.md': 'old ingest prompt',
                    'stale.txt': 'delete me',
                    'prompts/obsolete.md': 'delete me too',
                },
            )

            result = self.run_script('--source', str(source), '--target-root', str(target_root))

            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(self.read_tree(target), self.read_tree(source))
            self.assertFalse((target / 'stale.txt').exists())
            self.assertFalse((target / 'prompts' / 'obsolete.md').exists())

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
```

- [ ] **Step 2: Run the installer test and verify it fails against the current single-file installer**

Run:
```bash
python3 -m unittest discover -s "/Users/zifeng.chen/bb/think-flow/tests" -p "test_install_skill.py" -v
```

Expected:
```text
FAIL: test_install_into_empty_target_root (test_install_skill.InstallSkillTests.test_install_into_empty_target_root)
AssertionError: 1 != 0
```

That failure is correct because the current installer still treats `--source` as a file path and cannot mirror a directory tree.

### Task 2: Change the installer from file copy to directory mirror sync

**Files:**
- Modify: `/Users/zifeng.chen/bb/think-flow/scripts/install_skill.py`
- Test: `/Users/zifeng.chen/bb/think-flow/tests/test_install_skill.py`

- [ ] **Step 1: Replace the installer script with directory-mirroring behavior**

```python
#!/usr/bin/env python3
from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SOURCE = ROOT / 'skills' / 'llm-wiki-ops'
DEFAULT_TARGET_ROOT = Path.home() / '.claude' / 'skills'
SKILL_NAME = 'llm-wiki-ops'


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path, default=DEFAULT_SOURCE)
    parser.add_argument('--target-root', type=Path, default=DEFAULT_TARGET_ROOT)
    args = parser.parse_args()

    source = args.source.expanduser()
    target_root = args.target_root.expanduser()

    if not source.is_dir():
        print(f'error: source directory not found: {source}', file=sys.stderr)
        return 1

    target = target_root / SKILL_NAME
    existed = target.exists()

    if existed:
        shutil.rmtree(target)

    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(source, target)

    action = 'updated' if existed else 'installed'
    print(f'{action} llm-wiki-ops')
    print(f'source: {source}')
    print(f'target: {target}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
```

- [ ] **Step 2: Run the installer test again and verify all directory-sync cases pass**

Run:
```bash
python3 -m unittest discover -s "/Users/zifeng.chen/bb/think-flow/tests" -p "test_install_skill.py" -v
```

Expected:
```text
Ran 4 tests in 0.0xxs

OK
```

### Task 3: Verify the real install target and regression coverage

**Files:**
- Verify: `/Users/zifeng.chen/.claude/skills/llm-wiki-ops/`
- Test: `/Users/zifeng.chen/bb/think-flow/tests/test_llm_wiki_ops_skill.py`
- Test: `/Users/zifeng.chen/bb/think-flow/tests/test_install_skill.py`

- [ ] **Step 1: Run the installer against the real default target**

Run:
```bash
python3 "/Users/zifeng.chen/bb/think-flow/scripts/install_skill.py"
```

Expected:
```text
installed llm-wiki-ops
source: /Users/zifeng.chen/bb/think-flow/skills/llm-wiki-ops
target: /Users/zifeng.chen/.claude/skills/llm-wiki-ops
```

If the target already exists, the first line should be:
```text
updated llm-wiki-ops
```

- [ ] **Step 2: Verify the installed tree contains the full skill directory**

Run:
```bash
python3 - <<'PY'
from pathlib import Path
root = Path('/Users/zifeng.chen/.claude/skills/llm-wiki-ops')
for path in sorted(candidate.relative_to(root) for candidate in root.rglob('*') if candidate.is_file()):
    print(path)
PY
```

Expected:
```text
CLAUDE.md
SKILL.md
prompts/ingest.md
prompts/lint.md
prompts/query.md
```

- [ ] **Step 3: Run the repo-local skill contract tests and verify they still pass unchanged**

Run:
```bash
python3 -m unittest discover -s "/Users/zifeng.chen/bb/think-flow/tests" -p "test_llm_wiki_ops_skill.py" -v
```

Expected:
```text
Ran 10 tests in 0.0xxs

OK
```

- [ ] **Step 4: Run the full repository test suite**

Run:
```bash
python3 -m unittest discover -s "/Users/zifeng.chen/bb/think-flow/tests" -p "test_*.py" -v
```

Expected:
```text
...
OK
```

- [ ] **Step 5: Manually confirm the implementation stayed within scope**

Check that:
- `/Users/zifeng.chen/bb/think-flow/scripts/install_skill.py` only syncs repo → target
- `/Users/zifeng.chen/bb/think-flow/scripts/install_skill.py` still supports `--target-root`
- stale target-only files are deleted by replacing the managed target directory
- `/Users/zifeng.chen/bb/think-flow/tests/test_llm_wiki_ops_skill.py` remains pointed at the repo-local `SKILL.md`
- no symlink mode, reverse sync mode, batch install mode, or git commit logic was added

Expected: the implementation matches the approved design exactly and remains uncommitted unless the user explicitly asks for a commit.

## Self-Review

### Spec coverage
- Whole-directory mirror sync is covered in Task 2.
- Install into an empty target root is covered in Task 1.
- Update replacement behavior is covered in Task 1.
- Stale target-only file removal is covered in Task 1 and verified again in Task 3.
- Clear failure when the source directory is missing is covered in Task 1 and Task 2.
- Keeping the same command name is covered in Task 3.
- Keeping `--target-root` for tests is covered in Task 2 and Task 3.
- Leaving `tests/test_llm_wiki_ops_skill.py` unchanged is covered in Task 3.

### Placeholder scan
- No `TODO`, `TBD`, or vague implementation markers remain.
- Every file path is explicit.
- Every code-writing step includes complete file content.
- Every verification step includes an exact command and expected outcome.

### Type consistency
- The source path is consistently the directory `skills/llm-wiki-ops`.
- The managed target path is consistently the directory `~/.claude/skills/llm-wiki-ops`.
- The installer script path is consistently `scripts/install_skill.py`.
- The managed skill name is consistently `llm-wiki-ops`.
