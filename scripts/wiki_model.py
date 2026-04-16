from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import re


PAGE_DIRS = ('domains', 'concepts', 'questions', 'sources', 'syntheses')
WIKI_LINK_RE = re.compile(r'\[\[([^\]]+)\]\]')


@dataclass(frozen=True)
class Page:
    path: Path
    page_type: str
    frontmatter: dict[str, object]
    body: str

    @property
    def slug(self) -> str:
        return self.path.stem

    @property
    def title(self) -> str:
        return str(self.frontmatter.get('title') or self.slug)


def render_frontmatter_list(values: list[str]) -> str:
    lines = [f'  - {value}' for value in values]
    return '\n'.join(lines) if lines else '  []'


def wiki_page_paths(root: Path) -> list[Path]:
    pages: list[Path] = []
    for folder in PAGE_DIRS:
        directory = root / 'wiki' / folder
        if directory.exists():
            pages.extend(sorted(directory.glob('*.md')))
    return pages


def load_pages(root: Path) -> list[Page]:
    return [load_page(path) for path in wiki_page_paths(root)]


def load_page(path: Path) -> Page:
    frontmatter, body = parse_page_text(path.read_text())
    return Page(
        path=path,
        page_type=str(frontmatter.get('type') or page_type_for_dir(path.parent.name)),
        frontmatter=frontmatter,
        body=body,
    )


def parse_page_text(text: str) -> tuple[dict[str, object], str]:
    if not text.startswith('---\n'):
        return {}, text

    lines = text.splitlines()
    frontmatter_lines: list[str] = []
    body_start = 0
    for index, line in enumerate(lines[1:], start=1):
        if line == '---':
            body_start = index + 1
            break
        frontmatter_lines.append(line)
    else:
        return {}, text

    body = '\n'.join(lines[body_start:])
    if text.endswith('\n'):
        body += '\n'
    return parse_frontmatter(frontmatter_lines), body


def parse_frontmatter(lines: list[str]) -> dict[str, object]:
    data: dict[str, object] = {}
    index = 0
    while index < len(lines):
        line = lines[index]
        if not line.strip():
            index += 1
            continue

        key, _, raw_value = line.partition(':')
        raw_value = raw_value.lstrip()
        if not _:
            index += 1
            continue

        if raw_value:
            data[key] = parse_frontmatter_value(raw_value)
            index += 1
            continue

        list_values: list[str] = []
        lookahead = index + 1
        while lookahead < len(lines):
            item = lines[lookahead]
            if item.startswith('  - '):
                list_values.append(item[4:])
                lookahead += 1
                continue
            if item == '  []':
                lookahead += 1
                break
            if item.startswith(' '):
                lookahead += 1
                continue
            break

        data[key] = list_values
        index = lookahead

    return data


def parse_frontmatter_value(value: str) -> object:
    if value == '[]':
        return []
    if value == '""':
        return ''
    if re.fullmatch(r'-?\d+', value):
        return int(value)
    return value


def page_type_for_dir(directory_name: str) -> str:
    if directory_name == 'syntheses':
        return 'synthesis'
    return directory_name[:-1]


def extract_wiki_links(text: str) -> list[str]:
    return WIKI_LINK_RE.findall(text)
