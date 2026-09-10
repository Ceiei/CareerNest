import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { root } from './demo-common.mjs';

const directory = await mkdtemp(path.join(os.tmpdir(), 'career-desktop-smoke-'));
const port = await new Promise((resolve, reject) => {
  const probe = net.createServer();
  probe.once('error', reject);
  probe.listen(0, '127.0.0.1', () => { const result = probe.address().port; probe.close(() => resolve(result)); });
});
const env = { ...process.env, CAREER_OS_DATA: directory, CAREER_OS_PORT: String(port) };
delete env.ELECTRON_RUN_AS_NODE;
let output = '';
try {
  const binary = createRequire(import.meta.url)('electron');
  const child = spawn(binary, ['desktop/electron/main.cjs', '--smoke-test'], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
  const timer = setTimeout(() => child.kill(), 60000);
  child.stdout.on('data', chunk => { output += chunk; process.stdout.write(chunk); });
  child.stderr.on('data', chunk => process.stderr.write(chunk));
  const result = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); });
  clearTimeout(timer);
  if (result !== 0 || !output.includes('DESKTOP_SMOKE_OK')) throw new Error('Desktop smoke test failed');
  // Verify that the desktop-owned service exits, including Windows stdin EOF handling.
  let closed = false;
  for (let attempt = 0; attempt < 50; attempt++) {
    try { await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(300) }); }
    catch { closed = true; break; }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!closed) throw new Error('Desktop left its service running');
  console.log('DESKTOP_SHUTDOWN_OK');
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await rm(directory, { recursive: true, force: true, maxRetries: 20, retryDelay: 200 }); }
