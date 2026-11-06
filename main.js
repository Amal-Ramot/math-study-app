'use strict';

const { app, BrowserWindow, shell, dialog, net } = require('electron');
const path = require('path');

const isExternal = (url) => /^(https?:|mailto:)/i.test(url);

// ---------- automatic updates ----------
// Windows (NSIS) and Linux (AppImage): electron-updater downloads new releases
// from GitHub in the background and installs them on the next restart.
// macOS: auto-install needs a paid Apple signing certificate, so the app only
// tells the user a newer version exists and opens the download page.
const REPO = 'Amal-Ramot/math-study-app';
const RELEASES_URL = `https://github.com/${REPO}/releases/latest`;
const CHECK_EVERY_MS = 4 * 60 * 60 * 1000;

function mainWindow() {
  return BrowserWindow.getAllWindows()[0] || null;
}

function setupAutoUpdate() {
  if (!app.isPackaged) return;
  // AppImage updates only work when actually running from the AppImage file.
  if (process.platform === 'linux' && !process.env.APPIMAGE) return;

  let autoUpdater;
  try {
    ({ autoUpdater } = require('electron-updater'));
  } catch (e) {
    return;
  }
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('error', () => {}); // offline etc. — try again later, silently

  let prompted = false;
  autoUpdater.on('update-downloaded', async (info) => {
    if (prompted) return;
    prompted = true;
    const opts = {
      type: 'info',
      buttons: ['להפעיל מחדש עכשיו', 'אחר כך'],
      defaultId: 0,
      cancelId: 1,
      title: 'עדכון חדש',
      message: `גרסה חדשה (${info.version}) הורדה ומוכנה.`,
      detail: 'העדכון יותקן בהפעלה מחדש של התוכנה. ההתקדמות השמורה לא תימחק.',
    };
    const win = mainWindow();
    const { response } = win ? await dialog.showMessageBox(win, opts) : await dialog.showMessageBox(opts);
    if (response === 0) autoUpdater.quitAndInstall();
  });

  const check = () => autoUpdater.checkForUpdates().catch(() => {});
  check();
  setInterval(check, CHECK_EVERY_MS);
}

function newerVersion(a, b) {
  const pa = String(a).replace(/^v/, '').split('.').map(Number);
  const pb = String(b).replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return true;
    if ((pa[i] || 0) < (pb[i] || 0)) return false;
  }
  return false;
}

function setupMacUpdateNotice() {
  if (!app.isPackaged) return;
  let notified = false;
  const check = () => {
    if (notified) return;
    const req = net.request(`https://api.github.com/repos/${REPO}/releases/latest`);
    req.setHeader('Accept', 'application/vnd.github+json');
    req.setHeader('User-Agent', 'math-study-app');
    let body = '';
    req.on('response', (res) => {
      res.on('data', (c) => { body += c; });
      res.on('end', async () => {
        try {
          const tag = JSON.parse(body).tag_name;
          if (!tag || !newerVersion(tag, app.getVersion())) return;
          notified = true;
          const opts = {
            type: 'info',
            buttons: ['להורדת הגרסה החדשה', 'אחר כך'],
            defaultId: 0,
            cancelId: 1,
            title: 'יש גרסה חדשה',
            message: `גרסה חדשה (${tag.replace(/^v/, '')}) זמינה להורדה.`,
            detail: 'ההתקדמות השמורה נשארת גם אחרי התקנת הגרסה החדשה.',
          };
          const win = mainWindow();
          const { response } = win ? await dialog.showMessageBox(win, opts) : await dialog.showMessageBox(opts);
          if (response === 0) shell.openExternal(RELEASES_URL);
        } catch (e) { /* ignore */ }
      });
    });
    req.on('error', () => {});
    req.end();
  };
  setTimeout(check, 5000);
  setInterval(check, CHECK_EVERY_MS);
}

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
    if (process.platform === 'darwin') setupMacUpdateNotice();
    else setupAutoUpdate();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
