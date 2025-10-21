const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('kona', {
  openExternal: (url) => ipcRenderer.invoke('open-external', url)
});
