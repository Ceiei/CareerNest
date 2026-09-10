const { app, BrowserWindow, ipcMain, dialog, shell, clipboard, Menu } = require('electron');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const readline = require('node:readline');

const root = path.resolve(__dirname, '../..');
const port = Number(process.env.CAREER_OS_PORT || 43119);
const origin = `http://127.0.0.1:${port}`;
const workspace = `${origin}/desktop`;
const dataDirectory = process.env.CAREER_OS_DATA || (process.platform === 'darwin'
  ? path.join(app.getPath('home'), 'Library', 'Application Support', 'Career OS')
  : path.join(process.env.LOCALAPPDATA || path.join(app.getPath('home'), 'AppData', 'Local'), 'Career OS'));
app.setName('Career OS Demo');
app.setPath('userData', path.join(dataDirectory, 'desktop-state'));
let child, window, token, quitting = false, closing = false;

function trusted(event) {
  return window && event.sender === window.webContents && event.senderFrame === window.webContents.mainFrame
    && event.senderFrame.url === workspace;
}

function freePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', () => reject(new Error(`端口 ${port} 已被占用。请先退出其他 Career OS 应用或本地服务，再重新启动。`)));
    probe.listen(port, '127.0.0.1', () => probe.close(resolve));
  });
}

async function startService() {
  await freePort();
  const python = path.join(root, '.demo-venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
  if (!fs.existsSync(python)) throw new Error('缺少 Python 环境。请先运行 npm run demo:setup。');
  fs.mkdirSync(dataDirectory, { recursive: true, mode: 0o700 });
  const log = fs.openSync(path.join(dataDirectory, 'desktop.log'), 'a', 0o600);
  const env = { ...process.env, CAREER_OS_DATA: dataDirectory, PYTHONUNBUFFERED: '1', PYTHONUTF8: '1' };
  if (process.platform === 'darwin') env.PATH = `/Library/TeX/texbin:${env.PATH || ''}`;
  child = spawn(python, ['-m', 'local_service.demo'], { cwd: root, env, windowsHide: true, stdio: ['pipe', 'pipe', log] });
  child.stdin.on('error', () => {});
  fs.closeSync(log);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('本地服务启动超时，请查看数据目录中的 desktop.log。')), 30000);
    const finish = (error) => { clearTimeout(timer); error ? reject(error) : resolve(); };
    child.once('error', finish);
    child.once('exit', () => finish(new Error('本地服务启动失败，请查看数据目录中的 desktop.log。')));
    readline.createInterface({ input: child.stdout }).on('line', line => {
      try { const result = JSON.parse(line); if (result.career_service === 'ready' && result.pid === child.pid) finish(); } catch {}
    });
  });
  token = fs.readFileSync(path.join(dataDirectory, 'config', 'api-token.txt'), 'utf8').trim();
  child.on('exit', () => {
    if (!quitting) { dialog.showErrorBox('Career OS', '本地服务已退出，请关闭应用后重新启动。'); app.quit(); }
  });
}

ipcMain.on('career:bootstrap', event => {
  event.returnValue = trusted(event) ? { token, dataDirectory } : null;
});
ipcMain.handle('career:native', async (event, message) => {
  if (!trusted(event) || !message || typeof message.action !== 'string') throw new Error('不允许此页面调用桌面功能');
  switch (message.action) {
    case 'folder': {
      const error = await shell.openPath(dataDirectory);
      if (error) throw new Error(error);
      return;
    }
    case 'copy':
      if (!/^\d{8}$/.test(message.text)) throw new Error('无效的配对码');
      clipboard.writeText(message.text); return;
    case 'save': {
      if (typeof message.name !== 'string' || typeof message.data !== 'string' || message.data.length > 64 * 1024 * 1024)
        throw new Error('导出文件过大或格式无效');
      const name = path.basename(message.name.replaceAll('\\', '/'));
      if (!/\.(json|pdf|tex)$/i.test(name)) throw new Error('不支持的导出类型');
      const result = await dialog.showSaveDialog(window, { defaultPath: name });
      if (result.canceled) return { canceled: true };
      await fs.promises.writeFile(result.filePath, Buffer.from(message.data, 'base64'), { mode: 0o600 });
      return { saved: true };
    }
    case 'ready':
      console.log('Career OS workspace ready');
      if (process.argv.includes('--smoke-test')) {
        if (!process.env.CAREER_OS_DATA || port === 43119) throw new Error('Smoke test requires isolated data and port');
        try {
          const headers = { 'X-Career-Token': token };
          const profile = await fetch(`${origin}/api/profile`, { headers }).then(r => r.json());
          if (profile.version !== 0) throw new Error('Smoke data must be empty');
          const response = await fetch(`${origin}/api/desktop/pair-code`, { method: 'POST', headers });
          const { code } = await response.json();
          const pair = await fetch(`${origin}/api/pair`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) }).then(r => r.json());
          const read = await fetch(`${origin}/api/profile`, { headers: { 'X-Career-Token': pair.token } });
          const write = await fetch(`${origin}/api/profile`, { method: 'PUT', headers: { 'X-Career-Token': pair.token, 'Content-Type': 'application/json' }, body: JSON.stringify({ profile: profile.profile, expected_version: 0 }) });
          if (read.status !== 200 || write.status !== 403) throw new Error('Readonly pairing failed');
          console.log('DESKTOP_SMOKE_OK: renderer bootstrap, empty SSoT, pairing, readonly access');
          quitting = true; app.quit();
        } catch (error) { console.error(error.message); quitting = true; app.exit(1); }
      }
      return;
    case 'error': console.error('Career OS workspace reported an error'); return;
    default: throw new Error('不支持的桌面操作');
  }
});

async function createWindow() {
  window = new BrowserWindow({ width: 1280, height: 840, minWidth: 900, minHeight: 650,
    title: 'Career OS Demo', backgroundColor: '#f7f6f2', show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true,
      nodeIntegration: false, sandbox: true, webviewTag: false, plugins: true, partition: 'persist:career-desktop' } });
  const session = window.webContents.session;
  session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  session.setPermissionCheckHandler(() => false);
  session.webRequest.onBeforeSendHeaders({ urls: [`${origin}/*`] }, (details, callback) => {
    if (details.webContentsId === window.webContents.id && details.resourceType === 'mainFrame' && details.url === workspace)
      details.requestHeaders['X-Career-Token'] = token;
    callback({ requestHeaders: details.requestHeaders });
  });
  window.webContents.on('will-navigate', (event, url) => { if (url !== workspace) event.preventDefault(); });
  window.webContents.on('will-attach-webview', event => event.preventDefault());
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url) && !url.startsWith(origin)) shell.openExternal(url);
    return { action: 'deny' };
  });
  window.on('page-title-updated', event => event.preventDefault());
  window.on('close', async event => {
    if (quitting) return;
    event.preventDefault();
    if (closing) return;
    closing = true;
    let dirty = true;
    try { dirty = await window.webContents.executeJavaScript('Boolean(window.careerHasUnsavedChanges?.())'); } catch {}
    if (dirty) {
      const result = await dialog.showMessageBox(window, { type: 'question', message: '有尚未保存的修改，仍要退出吗？',
        buttons: ['继续编辑', '放弃修改并退出'], defaultId: 0, cancelId: 0 });
      if (result.response === 0) { closing = false; return; }
    }
    quitting = true; app.quit();
  });
  await window.loadURL(workspace);
  window.show();
}

app.on('before-quit', event => {
  if (!quitting && window && !window.isDestroyed()) { event.preventDefault(); window.close(); return; }
  quitting = true;
  if (child && child.exitCode === null) {
    child.stdin.end();
    const owned = child;
    const timer = setTimeout(() => owned.kill(), 3000);
    owned.once('exit', () => clearTimeout(timer));
  }
});
app.on('window-all-closed', () => app.quit());
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (window) { if (window.isMinimized()) window.restore(); window.focus(); } });
  app.whenReady().then(async () => {
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      ...(process.platform === 'darwin' ? [{ role: 'appMenu' }] : []),
      { role: 'fileMenu' }, { role: 'editMenu' }, { role: 'viewMenu' }, { role: 'windowMenu' },
    ]));
    await startService(); await createWindow();
  }).catch(error => { dialog.showErrorBox('Career OS 启动失败', error.message); quitting = true; app.quit(); });
}
