import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path
import unittest


ROOT = Path('/Users/zifeng.chen/bb/think-flow')
SCRIPT = ROOT / 'scripts' / 'read_llm_conversation.py'


class ReadLlmConversationTests(unittest.TestCase):
    def run_script(self, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(SCRIPT), *args],
            text=True,
            capture_output=True,
        )

    def write_jsonl(self, path: Path, rows: list[dict]) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(
            ''.join(f'{json.dumps(row, ensure_ascii=False)}\n' for row in rows),
            encoding='utf-8',
        )

    def test_codex_current_session_reads_latest_matching_workspace(self):
        with tempfile.TemporaryDirectory() as tmp:
            codex_root = Path(tmp) / '.codex'
            workspace = '/repo/current'
            older = codex_root / 'sessions' / '2026' / '04' / '16' / 'older.jsonl'
            newer = codex_root / 'sessions' / '2026' / '04' / '16' / 'newer.jsonl'

            self.write_jsonl(
                older,
                [
                    {
                        'timestamp': '2026-04-16T10:00:00Z',
                        'type': 'session_meta',
                        'payload': {'cwd': workspace},
                    },
                    {
                        'timestamp': '2026-04-16T10:00:01Z',
                        'type': 'response_item',
                        'payload': {
                            'type': 'message',
                            'role': 'user',
                            'content': [{'type': 'input_text', 'text': 'old question'}],
                        },
                    },
                    {
                        'timestamp': '2026-04-16T10:00:02Z',
                        'type': 'response_item',
                        'payload': {
                            'type': 'message',
                            'role': 'assistant',
                            'content': [{'type': 'output_text', 'text': 'old answer'}],
                        },
                    },
                ],
            )
            self.write_jsonl(
                newer,
                [
                    {
                        'timestamp': '2026-04-16T11:00:00Z',
                        'type': 'session_meta',
                        'payload': {'cwd': workspace},
                    },
                    {
                        'timestamp': '2026-04-16T11:00:01Z',
                        'type': 'response_item',
                        'payload': {
                            'type': 'message',
                            'role': 'developer',
                            'content': [{'type': 'input_text', 'text': 'ignore developer'}],
                        },
                    },
                    {
                        'timestamp': '2026-04-16T11:00:02Z',
                        'type': 'response_item',
                        'payload': {
                            'type': 'message',
                            'role': 'user',
                            'content': [{'type': 'input_text', 'text': 'new question'}],
                        },
                    },
                    {
                        'timestamp': '2026-04-16T11:00:03Z',
                        'type': 'response_item',
                        'payload': {
                            'type': 'message',
                            'role': 'assistant',
                            'content': [{'type': 'output_text', 'text': 'new answer'}],
                        },
                    },
                ],
            )
            os.utime(older, (1, 1))
            os.utime(newer, (2, 2))

            result = self.run_script(
                '--tool', 'codex',
                '--current',
                '--cwd', workspace,
                '--codex-root', str(codex_root),
                '--format', 'json',
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            payload = json.loads(result.stdout)
            self.assertEqual(payload['tool'], 'codex')
            self.assertEqual(payload['source_file'], str(newer.resolve()))
            self.assertEqual(
                payload['messages'],
                [
                    {'role': 'user', 'text': 'new question', 'timestamp': '2026-04-16T11:00:02Z'},
                    {'role': 'assistant', 'text': 'new answer', 'timestamp': '2026-04-16T11:00:03Z'},
                ],
            )

    def test_claude_current_session_reads_project_log_and_skips_tool_wrappers(self):
        with tempfile.TemporaryDirectory() as tmp:
            claude_root = Path(tmp) / '.claude'
            workspace = '/repo/current'
            session_id = 'abc-session'
            session_file = claude_root / 'sessions' / '111.json'
            project_file = claude_root / 'projects' / '-repo-current' / f'{session_id}.jsonl'

            session_file.parent.mkdir(parents=True, exist_ok=True)
            session_file.write_text(
                json.dumps(
                    {
                        'pid': 111,
                        'sessionId': session_id,
                        'cwd': workspace,
                        'startedAt': 1776331639016,
                        'kind': 'interactive',
                        'entrypoint': 'cli',
                    }
                ),
                encoding='utf-8',
            )
            self.write_jsonl(
                project_file,
                [
                    {
                        'type': 'user',
                        'timestamp': '2026-04-16T11:00:00Z',
                        'message': {'role': 'user', 'content': 'hello Claude'},
                    },
                    {
                        'type': 'assistant',
                        'timestamp': '2026-04-16T11:00:01Z',
                        'message': {
                            'role': 'assistant',
                            'content': [{'type': 'thinking', 'thinking': 'private reasoning'}],
                        },
                    },
                    {
                        'type': 'assistant',
                        'timestamp': '2026-04-16T11:00:02Z',
                        'message': {
                            'role': 'assistant',
                            'content': [{'type': 'text', 'text': 'hello user'}],
                        },
                    },
                    {
                        'type': 'assistant',
                        'timestamp': '2026-04-16T11:00:03Z',
                        'message': {
                            'role': 'assistant',
                            'content': [
                                {'type': 'tool_use', 'id': 'call_1', 'name': 'Read', 'input': {'file': 'x'}},
                            ],
                        },
                    },
                    {
                        'type': 'user',
                        'timestamp': '2026-04-16T11:00:04Z',
                        'message': {
                            'role': 'user',
                            'content': [
                                {
                                    'type': 'tool_result',
                                    'tool_use_id': 'call_1',
                                    'content': 'tool output',
                                }
                            ],
                        },
                    },
                ],
            )

            result = self.run_script(
                '--tool', 'claude',
                '--current',
                '--cwd', workspace,
                '--claude-root', str(claude_root),
                '--format', 'json',
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            payload = json.loads(result.stdout)
            self.assertEqual(payload['tool'], 'claude')
            self.assertEqual(payload['source_file'], str(project_file.resolve()))
            self.assertEqual(
                payload['messages'],
                [
                    {'role': 'user', 'text': 'hello Claude', 'timestamp': '2026-04-16T11:00:00Z'},
                    {'role': 'assistant', 'text': 'hello user', 'timestamp': '2026-04-16T11:00:02Z'},
                ],
            )

    def test_cursor_current_session_reads_latest_project_agent_transcript(self):
        with tempfile.TemporaryDirectory() as tmp:
            cursor_root = Path(tmp) / '.cursor'
            workspace = '/Users/zifeng.chen/repo/current'
            project_slug = 'Users-zifeng-chen-repo-current'
            older = (
                cursor_root
                / 'projects'
                / project_slug
                / 'agent-transcripts'
                / 'old-session'
                / 'old-session.jsonl'
            )
            newer = (
                cursor_root
                / 'projects'
                / project_slug
                / 'agent-transcripts'
                / 'new-session'
                / 'new-session.jsonl'
            )

            self.write_jsonl(
                older,
                [
                    {'role': 'user', 'message': {'content': [{'type': 'text', 'text': 'old question'}]}},
                    {'role': 'assistant', 'message': {'content': [{'type': 'text', 'text': 'old answer'}]}},
                ],
            )
            self.write_jsonl(
                newer,
                [
                    {'role': 'system', 'message': {'content': [{'type': 'text', 'text': 'ignore system'}]}},
                    {'role': 'user', 'message': {'content': [{'type': 'text', 'text': 'current question'}]}},
                    {'role': 'assistant', 'message': {'content': [{'type': 'text', 'text': 'current answer'}]}},
                    {'role': 'tool', 'message': {'content': [{'type': 'text', 'text': 'ignore tool'}]}},
                ],
            )
            os.utime(older, (1, 1))
            os.utime(newer, (2, 2))

            result = self.run_script(
                '--tool', 'cursor',
                '--current',
                '--cwd', workspace,
                '--cursor-root', str(cursor_root),
                '--format', 'json',
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            payload = json.loads(result.stdout)
            self.assertEqual(payload['tool'], 'cursor')
            self.assertEqual(payload['source_file'], str(newer.resolve()))
            self.assertEqual(payload['session_id'], 'new-session')
            self.assertEqual(
                payload['messages'],
                [
                    {'role': 'user', 'text': 'current question', 'timestamp': ''},
                    {'role': 'assistant', 'text': 'current answer', 'timestamp': ''},
                ],
            )


if __name__ == '__main__':
    unittest.main()
