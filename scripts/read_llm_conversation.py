#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description='Read Codex or Claude conversation text from local CLI session artifacts.'
    )
    parser.add_argument('--tool', choices=('codex', 'claude', 'cursor'), required=True)
    source_group = parser.add_mutually_exclusive_group(required=True)
    source_group.add_argument('--current', action='store_true', help='Read the latest matching session for the current workspace.')
    source_group.add_argument('--source-file', type=Path, help='Read a specific session artifact file.')
    parser.add_argument('--cwd', default=str(Path.cwd()), help='Workspace path used for current-session auto detection.')
    parser.add_argument('--codex-root', type=Path, default=Path.home() / '.codex')
    parser.add_argument('--claude-root', type=Path, default=Path.home() / '.claude')
    parser.add_argument('--cursor-root', type=Path, default=Path.home() / '.cursor')
    parser.add_argument('--format', choices=('text', 'json'), default='text')
    parser.add_argument('--include-tools', action='store_true', help='Include tool-use and tool-result wrapper messages when available.')
    parser.add_argument('--include-thinking', action='store_true', help='Include Claude thinking blocks.')
    return parser.parse_args()


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    with path.open(encoding='utf-8') as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            rows.append(json.loads(line))
    return rows


def read_codex_session_cwd(path: Path) -> str | None:
    for row in load_jsonl(path):
        if row.get('type') != 'session_meta':
            continue
        payload = row.get('payload') or {}
        return payload.get('cwd')
    return None


def resolve_current_codex_file(codex_root: Path, cwd: str) -> Path:
    candidates = sorted(
        (path for path in (codex_root / 'sessions').rglob('*.jsonl') if path.is_file()),
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )
    for path in candidates:
        if read_codex_session_cwd(path) == cwd:
            return path
    raise FileNotFoundError(f'No Codex session file matched cwd: {cwd}')


def extract_codex_text(content: list[dict[str, Any]]) -> str:
    parts = [
        item.get('text', '').strip()
        for item in content
        if item.get('type') in {'input_text', 'output_text'} and item.get('text', '').strip()
    ]
    return '\n'.join(parts).strip()


def parse_codex_messages(path: Path) -> tuple[list[dict[str, str]], str | None]:
    rows = load_jsonl(path)
    messages: list[dict[str, str]] = []
    session_id: str | None = None
    for row in rows:
        row_type = row.get('type')
        if row_type == 'session_meta':
            payload = row.get('payload') or {}
            session_id = payload.get('id')
            continue
        if row_type != 'response_item':
            continue
        payload = row.get('payload') or {}
        if payload.get('type') != 'message':
            continue
        role = payload.get('role')
        if role not in {'user', 'assistant'}:
            continue
        text = extract_codex_text(payload.get('content') or [])
        if not text:
            continue
        messages.append(
            {
                'role': role,
                'text': text,
                'timestamp': row.get('timestamp', ''),
            }
        )
    return messages, session_id


def resolve_current_claude_file(claude_root: Path, cwd: str) -> tuple[Path, str]:
    session_files = sorted(
        (path for path in (claude_root / 'sessions').glob('*.json') if path.is_file()),
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )
    for session_file in session_files:
        payload = json.loads(session_file.read_text(encoding='utf-8'))
        if payload.get('cwd') != cwd:
            continue
        session_id = payload.get('sessionId')
        if not session_id:
            continue
        matches = [
            path
            for path in (claude_root / 'projects').rglob(f'{session_id}.jsonl')
            if '/subagents/' not in path.as_posix()
        ]
        if matches:
            return matches[0], session_id
    raise FileNotFoundError(f'No Claude session file matched cwd: {cwd}')


def format_claude_content(
    content: Any,
    *,
    include_tools: bool,
    include_thinking: bool,
) -> str:
    if isinstance(content, str):
        return content.strip()
    if not isinstance(content, list):
        return ''

    parts: list[str] = []
    for item in content:
        item_type = item.get('type')
        if item_type == 'text':
            text = item.get('text', '').strip()
            if text:
                parts.append(text)
        elif item_type == 'thinking' and include_thinking:
            thinking = item.get('thinking', '').strip()
            if thinking:
                parts.append(f'[thinking]\n{thinking}')
        elif item_type == 'tool_use' and include_tools:
            name = item.get('name', 'unknown')
            input_payload = json.dumps(item.get('input', {}), ensure_ascii=False, sort_keys=True)
            parts.append(f'[tool_use] {name} {input_payload}')
        elif item_type == 'tool_result' and include_tools:
            tool_output = item.get('content', '')
            if isinstance(tool_output, str) and tool_output.strip():
                parts.append(f'[tool_result] {tool_output.strip()}')
    return '\n'.join(parts).strip()


def parse_claude_messages(
    path: Path,
    *,
    include_tools: bool,
    include_thinking: bool,
) -> tuple[list[dict[str, str]], str | None]:
    rows = load_jsonl(path)
    messages: list[dict[str, str]] = []
    session_id: str | None = None
    for row in rows:
        row_type = row.get('type')
        if row_type not in {'user', 'assistant'}:
            continue
        message = row.get('message') or {}
        role = message.get('role') or row_type
        if role not in {'user', 'assistant'}:
            continue
        text = format_claude_content(
            message.get('content'),
            include_tools=include_tools,
            include_thinking=include_thinking,
        )
        if not text:
            continue
        session_id = session_id or row.get('sessionId')
        messages.append(
            {
                'role': role,
                'text': text,
                'timestamp': row.get('timestamp', ''),
            }
        )
    return messages, session_id


def cursor_project_slug(cwd: str) -> str:
    trimmed = cwd.strip().strip('/')
    if not trimmed:
        return 'root'
    slug = re.sub(r'[^A-Za-z0-9]+', '-', trimmed)
    return slug.strip('-') or 'root'


def resolve_current_cursor_file(cursor_root: Path, cwd: str) -> tuple[Path, str]:
    project_dir = cursor_root / 'projects' / cursor_project_slug(cwd) / 'agent-transcripts'
    if not project_dir.is_dir():
        raise FileNotFoundError(f'No Cursor agent-transcripts directory matched cwd: {cwd}')

    candidates = sorted(
        (
            path
            for path in project_dir.glob('*/*.jsonl')
            if '/subagents/' not in path.as_posix()
        ),
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )
    if not candidates:
        raise FileNotFoundError(f'No Cursor transcript file matched cwd: {cwd}')
    transcript = candidates[0]
    return transcript, transcript.parent.name


def extract_cursor_text(content: Any) -> str:
    if isinstance(content, str):
        return content.strip()
    if not isinstance(content, list):
        return ''
    parts = [
        item.get('text', '').strip()
        for item in content
        if item.get('type') == 'text' and item.get('text', '').strip()
    ]
    return '\n'.join(parts).strip()


def parse_cursor_messages(path: Path) -> tuple[list[dict[str, str]], str | None]:
    rows = load_jsonl(path)
    messages: list[dict[str, str]] = []
    for row in rows:
        role = row.get('role')
        if role not in {'user', 'assistant'}:
            continue
        message = row.get('message') or {}
        text = extract_cursor_text(message.get('content'))
        if not text:
            continue
        messages.append(
            {
                'role': role,
                'text': text,
                'timestamp': row.get('timestamp', ''),
            }
        )
    return messages, path.parent.name


def render_text(payload: dict[str, Any]) -> str:
    lines = [
        f'tool: {payload["tool"]}',
        f'source_file: {payload["source_file"]}',
    ]
    if payload.get('session_id'):
        lines.append(f'session_id: {payload["session_id"]}')
    lines.append('')
    for message in payload['messages']:
        lines.append(f'[{message["timestamp"]}] {message["role"]}: {message["text"]}')
        lines.append('')
    return '\n'.join(lines).rstrip() + '\n'


def main() -> int:
    args = parse_args()

    try:
        if args.tool == 'codex':
            source_file = args.source_file.resolve() if args.source_file else resolve_current_codex_file(args.codex_root.resolve(), args.cwd)
            messages, session_id = parse_codex_messages(source_file)
        elif args.tool == 'claude':
            if args.source_file:
                source_file = args.source_file.resolve()
                messages, session_id = parse_claude_messages(
                    source_file,
                    include_tools=args.include_tools,
                    include_thinking=args.include_thinking,
                )
            else:
                source_file, session_id = resolve_current_claude_file(args.claude_root.resolve(), args.cwd)
                messages, _ = parse_claude_messages(
                    source_file,
                    include_tools=args.include_tools,
                    include_thinking=args.include_thinking,
                )
        else:
            if args.source_file:
                source_file = args.source_file.resolve()
                messages, session_id = parse_cursor_messages(source_file)
            else:
                source_file, session_id = resolve_current_cursor_file(args.cursor_root.resolve(), args.cwd)
                messages, _ = parse_cursor_messages(source_file)
        payload = {
            'tool': args.tool,
            'source_file': str(source_file),
            'session_id': session_id,
            'messages': messages,
        }
        if args.format == 'json':
            print(json.dumps(payload, ensure_ascii=False, indent=2))
        else:
            sys.stdout.write(render_text(payload))
        return 0
    except FileNotFoundError as exc:
        print(f'error: {exc}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
