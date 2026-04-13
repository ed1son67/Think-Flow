# LLM Wiki Ops Install Sync Design

## Goal

Store `llm-wiki-ops` inside this repository as the source of truth, then install or update it into Claude Code's global skill directory with a single command.

## User Intent

The user wants the skill to live in the repo instead of being edited only under `~/.claude/skills/`, while still being easy to inject into the global Claude skill directory.

The user explicitly chose:

- a repo-local source of truth for the skill
- a single install/update command
- a script-based sync flow instead of symlinks or a raw `cp` command
- a narrow v1 that only manages `llm-wiki-ops`

## Recommended Approach

Keep the canonical skill file in the repo at `skills/llm-wiki-ops/SKILL.md`, then add a small install script at `scripts/install_skill.py` that copies it into the global Claude skill directory.

Recommended command:

```bash
python3 scripts/install_skill.py
```

The script should be idempotent:

- if the target skill does not exist, install it
- if the target skill already exists, overwrite it with the repo-local version

## Alternatives Considered

### Option A — Repo-local skill plus install script (recommended)
Store the skill in the repo and provide one script that installs or updates the global copy.

**Pros**
- repo becomes the single source of truth
- install/update flow is explicit and stable
- easy to add validation and test coverage
- scales cleanly if more repo-managed skills are added later

**Cons**
- requires one sync step after editing the skill
- creates one more script to maintain

### Option B — Repo-local skill plus symlink
Store the skill in the repo and symlink `~/.claude/skills/llm-wiki-ops` to it.

**Pros**
- no copy step after updates
- simple steady-state behavior

**Cons**
- fragile if the repo moves or the path changes
- less portable across machines and environments
- link management is more error-prone than a direct copy in v1

### Option C — Repo-local file plus manual shell copy
Store the skill in the repo and rely on a single `cp` or `install` command.

**Pros**
- smallest implementation surface
- easy to understand

**Cons**
- weakest validation story
- less maintainable than a dedicated script
- harder to test cleanly

## Decision

Use **Option A**: keep `llm-wiki-ops` in the repo and sync it to `~/.claude/skills/` through a dedicated install script.

## File Layout

### Repo-local source files
- `skills/llm-wiki-ops/SKILL.md` — canonical skill content tracked in the repo
- `scripts/install_skill.py` — single-command installer/updater
- `tests/test_llm_wiki_ops_skill.py` — skill contract tests against the repo-local skill file
- `tests/test_install_skill.py` — installer behavior tests

### Global install target
- `~/.claude/skills/llm-wiki-ops/SKILL.md`

## Command Behavior

The default install command is:

```bash
python3 scripts/install_skill.py
```

The script should:

1. Read `skills/llm-wiki-ops/SKILL.md` from the repo.
2. Ensure the target directory exists under `~/.claude/skills/llm-wiki-ops/`.
3. Copy the repo-local skill file to `~/.claude/skills/llm-wiki-ops/SKILL.md`.
4. Print a clear result that includes:
   - source path
   - target path
   - whether the action was install or update

The default behavior should remain intentionally small:

- one command
- one managed skill
- overwrite-based sync
- no reverse sync
- no batch management of unrelated skills

## Boundaries

### In scope
- move the canonical `llm-wiki-ops` skill into the repo
- provide one command to install or update the global copy
- make the sync idempotent
- keep tests pointed at the repo-local source of truth
- add installer tests that do not depend on the real home directory

### Out of scope
- managing multiple skills in one command
- reverse-syncing global changes back into the repo
- symlink-based installation
- automatic reload hooks or background sync
- diff views, prompts, or merge logic
- git commits unless the user explicitly requests them

## Error Handling

The installer should fail clearly when the repo-local source file is missing.

It should create the target directory automatically if needed.

It should not modify any files other than the target skill path.

## Test Strategy

### Skill contract tests
Update `tests/test_llm_wiki_ops_skill.py` so it validates:

- `skills/llm-wiki-ops/SKILL.md`
- not the global installed copy under `~/.claude/skills/`

This keeps the tests deterministic and makes the repo-local file the real source of truth.

### Installer tests
Add `tests/test_install_skill.py` to verify:

- install into an empty target root
- update by overwriting an existing target file
- clear failure when the repo-local source file is missing

To keep tests isolated, the installer should support an optional target-root override for tests, for example:

```bash
python3 scripts/install_skill.py --target-root /tmp/test-home/.claude/skills
```

When that flag is omitted, the script should use the real default target under the user's home directory.

## Final Recommendation

Make the repo copy of `llm-wiki-ops` authoritative and add a narrow installer script that syncs it into Claude's global skill directory with one command. This keeps authoring local to the project, keeps installation explicit, and avoids the fragility of symlinks in v1.
