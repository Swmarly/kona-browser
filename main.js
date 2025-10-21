const electron = require('electron');

if (!electron.app) {
  console.error(
    'Kona Browser must be launched with Electron. Run "npm start" or "npx electron ." instead of "node main.js".'
  );
  process.exit(1);
}

const { app, BrowserWindow, ipcMain, shell, nativeTheme } = electron;
const path = require('path');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Kona Browser',
    backgroundColor: '#0e0a1a',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      spellcheck: true
    }
  });

  win.loadFile(path.join(__dirname, 'src', 'index.html'));

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
};

app.whenReady().then(() => {
  nativeTheme.themeSource = 'dark';
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('open-external', async (_event, url) => {
  if (typeof url === 'string' && url.startsWith('http')) {
    await shell.openExternal(url);
  }
});
