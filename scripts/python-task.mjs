import { python, run } from './demo-common.mjs';
try {
  const env = { ...process.env };
  if (process.platform === 'darwin') env.PATH = `/Library/TeX/texbin:${env.PATH || ''}`;
  run(python, process.argv.slice(2), { env });
}
catch (error) { console.error(error.message); process.exitCode = 1; }
