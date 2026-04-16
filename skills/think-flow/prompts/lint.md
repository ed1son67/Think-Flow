# Lint Prompt

Check the health of the wiki without turning the run into open-ended refactoring.
All repository paths below are absolute paths anchored to `{{PROJECT_ROOT}}`.

## Required behavior
1. Check for missing required directories and files.
2. Check that content pages under `{{PROJECT_ROOT}}/wiki/sources/`, `{{PROJECT_ROOT}}/wiki/topics/`, and `{{PROJECT_ROOT}}/wiki/syntheses/` contain frontmatter.
3. Check for empty content pages.
4. Check that pages are represented in `{{PROJECT_ROOT}}/wiki/index.md`.
5. Report issues clearly.
6. In `safe-fix` mode, only create missing system files such as `{{PROJECT_ROOT}}/wiki/index.md` or `{{PROJECT_ROOT}}/wiki/log.md`.

## Report sections
- missing structure
- missing metadata
- empty pages
- missing index coverage
- safe fixes applied
