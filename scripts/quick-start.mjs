import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { checkNode, root, python, npm } from './demo-common.mjs';

try {
  checkNode();
  const stamp = path.join(root, '.demo-ready');
  const digest = createHash('sha256');
  for (const file of ['package-lock.json', 'local_service/requirements-demo.txt', 'scripts/setup-demo.mjs']) digest.update(readFileSync(path.join(root, file)));
  digest.update(`${process.platform}/${process.arch}/${process.versions.node}`);
  const fingerprint = digest.digest('hex');
  if (!existsSync(stamp) || readFileSync(stamp, 'utf8') !== fingerprint || !existsSync(python) || !existsSync(path.join(root, 'node_modules/electron/path.txt')) || !existsSync(path.join(root, 'chrome-mv3/manifest.json'))) {
    npm(['ci']);
    npm(['run', 'demo:setup']);
    writeFileSync(stamp, fingerprint);
  }
  npm(['start']);
} catch (error) { console.error(`\n启动未完成：${error.message}\n请查看 README 的故障排查。`); process.exitCode = 1; }
