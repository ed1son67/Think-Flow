# LLM Wiki Ops Directory Sync Design

> Historical note: this document describes the legacy `llm-wiki-ops` naming and layout from 2026-04-13. The current live repo uses the `think-flow` skill under `skills/think-flow/`, the root schema file at `CLAUDE.md`, and `/th:*` command entrypoints.

## Goal

Change `llm-wiki-ops` installation so one command syncs the entire repo-local skill directory into Claude Code's global skills directory, not just `SKILL.md`.

## User Intent

The user wants to keep using a single install command, but have it copy the full `skills/llm-wiki-ops/` folder into `~/.claude/skills/llm-wiki-ops/`.

The user explicitly chose:

- keep the repo as the source of truth
- keep the command `python3 scripts/install_skill.py`
- sync the whole skill folder, including helper files like `CLAUDE.md` and `prompts/`
- use directory-mirroring semantics
- use Option A: full directory overwrite sync
- skip further review loops and have the implementation written directly after design approval

## Recommended Approach

Keep `skills/llm-wiki-ops/` as the canonical repo-local skill directory, then update `scripts/install_skill.py` so it mirrors that whole directory into `~/.claude/skills/llm-wiki-ops/`.

Recommended command:

```bash
python3 scripts/install_skill.py
```

The script should treat the repo directory as authoritative:

- if the target directory does not exist, install it
- if the target directory already exists, update it so the target matches the source exactly
- remove files or subdirectories that exist only in the target

## Alternatives Considered

### Option A — Whole-directory mirror sync (recommended)
Mirror `skills/llm-wiki-ops/` into `~/.claude/skills/llm-wiki-ops/`, including deletion of stale target-only files.

**Pros**
- repo remains the unambiguous source of truth
- no stale prompt or helper files linger in the global install
- behavior is predictable and easy to explain
- scales naturally as the skill directory grows

**Cons**
- stronger overwrite behavior than simple copy
- target-only manual changes are discarded on next sync

### Option B — Whole-directory copy without deletions
Copy the source directory over the target, but keep extra target-only files.

**Pros**
- more conservative behavior
- lower risk of deleting unexpected local files

**Cons**
- stale files can accumulate in the target directory
- target may drift away from the repo over time
- weakens the source-of-truth model

### Option C — White-listed file sync
Sync a curated list of files such as `SKILL.md`, `CLAUDE.md`, and `prompts/*.md`.

**Pros**
- very explicit control over what is installed

**Cons**
- requires script changes whenever the skill folder structure changes
- adds maintenance overhead without solving a current problem
- less robust than mirroring the whole directory

## Decision

Use **Option A**: make `scripts/install_skill.py` perform a whole-directory mirror sync from `skills/llm-wiki-ops/` to `~/.claude/skills/llm-wiki-ops/`.

## File Layout

### Repo-local source directory
- `skills/llm-wiki-ops/` — canonical directory tracked in the repo
- `skills/llm-wiki-ops/SKILL.md`
- `skills/llm-wiki-ops/CLAUDE.md`
- `skills/llm-wiki-ops/prompts/ingest.md`
- `skills/llm-wiki-ops/prompts/query.md`
- `skills/llm-wiki-ops/prompts/lint.md`

### Installer and tests
- `scripts/install_skill.py` — directory-mirroring installer/updater
- `tests/test_install_skill.py` — directory-sync behavior tests
- `tests/test_llm_wiki_ops_skill.py` — unchanged contract tests against the repo-local `SKILL.md`

### Global install target
- `~/.claude/skills/llm-wiki-ops/`

## Command Behavior

The install command remains:

```bash
python3 scripts/install_skill.py
```

The script should:

1. Read the source directory `skills/llm-wiki-ops/`.
2. Ensure the target directory exists under `~/.claude/skills/llm-wiki-ops/`.
3. Copy all source files and subdirectories into the target.
4. Remove files and subdirectories that exist only in the target.
5. Print a clear result that includes:
   - whether the action was install or update
   - source directory path
   - target directory path

Success output should remain exactly:

```text
installed llm-wiki-ops
source: <source dir>
target: <target dir>
```

or:

```text
updated llm-wiki-ops
source: <source dir>
target: <target dir>
```

## Boundaries

### In scope
- change installer behavior from single-file sync to whole-directory sync
- keep the repo directory authoritative
- remove stale target-only files during sync
- keep the same command name
- keep `--target-root` support for tests
- update tests to validate directory-level behavior

### Out of scope
- managing multiple skills in one command
- reverse-syncing global changes back into the repo
- symlink-based installation
- partial sync modes or merge policies
- preserving target-only drift files
- git commits unless the user explicitly requests them

## Error Handling

The installer should fail clearly when the repo-local source directory is missing.

It should create the target directory automatically when needed.

It should only modify the managed target directory for `llm-wiki-ops`.

## Test Strategy

### Skill contract tests
`tests/test_llm_wiki_ops_skill.py` should continue validating the repo-local `skills/llm-wiki-ops/SKILL.md`.

No behavior change is needed there.

### Installer tests
Update `tests/test_install_skill.py` to verify:

- install into an empty target root copies a full directory tree
- update replaces old file contents with repo contents
- stale target-only files are removed during update
- clear failure when the repo-local source directory is missing

To keep tests isolated, continue to support:

```bash
python3 scripts/install_skill.py --target-root /tmp/test-home/.claude/skills
```

## Final Recommendation

Make the installer mirror the whole `skills/llm-wiki-ops/` directory into Claude's global skills directory. This keeps the repo directory authoritative, ensures prompts and helper files are installed together, and prevents stale files from lingering in the global copy.
