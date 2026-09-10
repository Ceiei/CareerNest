import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { checkNode, root, python, run, npm } from './demo-common.mjs';

try {
  checkNode();
  if (!existsSync(python)) {
    const candidates = [...(process.env.CAREER_OS_PYTHON ? [[process.env.CAREER_OS_PYTHON, []]] : []),
      ...(process.platform === 'win32' ? [['py', ['-3.12']], ['py', ['-3']], ['python', []]] : [['python3.12', []], ['python3.11', []], ['python3', []]])];
    const found = candidates.find(([command, args]) => spawnSync(command, [...args, '-c', 'import sys; assert sys.version_info >= (3,11)'], { cwd: root, stdio: 'ignore' }).status === 0);
    if (!found) throw new Error('未找到 Python 3.11+。请安装 Python 3.12（Windows 勾选 Add python.exe to PATH），然后重新打开终端。');
    run(found[0], [...found[1], '-m', 'venv', '.demo-venv']);
  }
  run(python, ['-c', 'import sys; assert sys.version_info >= (3,11), "Python 3.11+ required"']);
  run(python, ['-m', 'pip', 'install', '-r', 'local_service/requirements-demo.txt']);
  npm(['run', 'build']);
  run(python, ['scripts/sync-extension.py']);
  run(python, ['scripts/doctor.py']);
  console.log('\n准备完成。运行 npm start 打开 App；Chrome 加载项目里的 chrome-mv3 文件夹。');
} catch (error) { console.error(`\n准备失败：${error.message}`); process.exitCode = 1; }
