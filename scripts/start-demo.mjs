import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { checkNode, python, run } from './demo-common.mjs';

try {
  checkNode();
  if (!existsSync(python)) throw new Error('请先运行 npm run demo:setup。');
  const require = createRequire(import.meta.url);
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  run(require('electron'), ['desktop/electron/main.cjs', ...process.argv.slice(2)], { env });
} catch (error) { console.error(`启动失败：${error.message}`); process.exitCode = 1; }
