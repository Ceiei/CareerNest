import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const python = path.join(root, '.demo-venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
export function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', ...options,
    env: { ...process.env, ...options.env, PYTHONUTF8: '1' } });
  if (result.error) throw new Error(`${command}: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${command} 执行失败（${result.status ?? result.signal}）`);
}
export function npm(args) {
  // npm.cmd requires cmd.exe on Windows; arguments here are fixed internal commands.
  run(process.platform === 'win32' ? 'cmd.exe' : 'npm', process.platform === 'win32' ? ['/d', '/s', '/c', 'npm', ...args] : args);
}
export function checkNode() {
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major < 22 || (major === 22 && minor < 13)) throw new Error('请安装 Node.js 22.13+（推荐 Node.js 24 LTS），然后重新打开终端。');
}
