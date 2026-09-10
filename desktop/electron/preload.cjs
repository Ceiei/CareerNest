const { contextBridge, ipcRenderer } = require('electron');

if (process.isMainFrame) {
  const bootstrap = ipcRenderer.sendSync('career:bootstrap');
  if (bootstrap) {
    contextBridge.exposeInMainWorld('careerDesktop', bootstrap);
    contextBridge.exposeInMainWorld('careerNative', {
      postMessage: (message) => ipcRenderer.invoke('career:native', message),
    });
  }
}
