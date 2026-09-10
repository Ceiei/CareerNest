import json
import os
import socket
import subprocess
import sys
import tempfile
import time
import unittest
from pathlib import Path
from unittest.mock import patch

import httpx

from local_service.paths import data_directory


class DesktopDemoTests(unittest.TestCase):
    def test_windows_data_is_in_local_appdata(self):
        with patch('local_service.paths.sys.platform', 'win32'), patch.dict(os.environ, {'LOCALAPPDATA': '/example/local'}, clear=True):
            self.assertEqual(data_directory(), Path('/example/local/Career OS'))

    def test_owned_service_stops_on_pipe_eof_and_preserves_data(self):
        with tempfile.TemporaryDirectory() as directory:
            with socket.socket() as probe:
                probe.bind(('127.0.0.1', 0))
                port = probe.getsockname()[1]
            env = {**os.environ, 'CAREER_OS_DATA': directory, 'CAREER_OS_PORT': str(port), 'PYTHONUNBUFFERED': '1'}
            process = subprocess.Popen([sys.executable, '-m', 'local_service.demo'], env=env, stdin=subprocess.PIPE,
                                       stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            try:
                with httpx.Client(base_url=f'http://127.0.0.1:{port}', timeout=1, trust_env=False) as client:
                    for _ in range(100):
                        if process.poll() is not None:
                            self.fail('Service exited before readiness: ' + process.stderr.read())
                        try:
                            if client.get('/health').status_code == 200:
                                break
                        except httpx.HTTPError:
                            pass
                        time.sleep(0.1)
                    else:
                        self.fail('Service did not start')
                    token = Path(directory, 'config/api-token.txt').read_text().strip()
                    headers = {'X-Career-Token': token, 'Origin': f'http://127.0.0.1:{port}'}
                    profile = client.get('/api/profile', headers=headers).json()
                    profile['profile']['personal']['fullName'] = 'Demo fixture'
                    self.assertEqual(client.put('/api/profile', headers=headers, json={
                        'profile': profile['profile'], 'expected_version': 0}).status_code, 200)
                process.stdin.close()
                self.assertEqual(process.wait(timeout=10), 0)
                self.assertTrue(Path(directory, 'career.db').exists())
                self.assertIn('"career_service": "ready"', process.stdout.read())
            finally:
                if process.poll() is None:
                    process.kill(); process.wait(timeout=5)
                for stream in (process.stdin, process.stdout, process.stderr):
                    if stream and not stream.closed:
                        stream.close()


if __name__ == '__main__':
    unittest.main()
