'use strict';

const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

const isExternal = (url) => /^(https?:|mailto:)/i.test(url);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 380,
    minHeight: 500,
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
    show: false,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  // Links with target=_blank / window.open -> default browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isExternal(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  // Plain navigations away from the local app -> default browser.
  win.webContents.on('will-navigate', (event, url) => {
    if (isExternal(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Window title follows the page <title> (default behaviour, kept explicit).
  win.webContents.on('page-title-updated', (_e, title) => win.setTitle(title));

  win.once('ready-to-show', () => win.show());
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
}

// One instance only: focus the existing window instead of opening another.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
