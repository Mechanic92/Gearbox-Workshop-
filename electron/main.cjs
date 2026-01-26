const { app, BrowserWindow, Tray, Menu, nativeImage, shell } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;
const { spawn } = require('child_process');

let mainWindow;
let tray;
let backendProcess;

function safePath(p) {
  try {
    return p && typeof p === 'string' ? p : null;
  } catch {
    return null;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    frame: true,
    titleBarStyle: 'default',
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, backend serves the UI on :5173
    mainWindow.loadURL('http://localhost:5173');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('minimize', (event) => {
    if (tray) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  // Don’t crash if tray icon is missing/invalid
  try {
    const trayIconCandidate = safePath(path.join(__dirname, '../build/tray-icon.ico'));
    const trayImg = trayIconCandidate ? nativeImage.createFromPath(trayIconCandidate) : nativeImage.createEmpty();

    tray = new Tray(trayImg.isEmpty() ? nativeImage.createEmpty() : trayImg);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show Gearbox',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      {
        label: 'Open (Local)',
        click: () => shell.openExternal('http://localhost:5173'),
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.isQuitting = true;
          app.quit();
        },
      },
    ]);

    tray.setToolTip('Gearbox Workshop Management');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
      if (!mainWindow) return;
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (e) {
    // Tray is optional. If it fails, app still runs.
    console.error('Tray init failed (non-fatal):', e);
    tray = null;
  }
}

function startBackend() {
  if (isDev) return;

  const logFile = path.join(app.getPath('userData'), 'server-debug.log');
  const fs = require('fs');

  // Use the bundled server in production
  const serverEntry = path.join(app.getAppPath(), 'electron', 'server.cjs');
  
  fs.writeFileSync(logFile, `Starting backend from: ${serverEntry}\n`);

  const env = {
      ...process.env,
      NODE_ENV: 'production',
      PORT: '5173',
      HOST: '0.0.0.0',
      DIST_PATH: path.join(app.getAppPath(), 'dist'),
      PUBLIC_PATH: path.join(app.getAppPath(), 'public-site'),
      DATABASE_URL: `file:${path.join(app.getPath('userData'), 'local.db')}`,
      ELECTRON_RUN_AS_NODE: '1',
  };

  fs.appendFileSync(logFile, `ENV: ${JSON.stringify(env, null, 2)}\n`);

  backendProcess = spawn(process.execPath, [serverEntry], {
    stdio: ['ignore', 'pipe', 'pipe'], // Capture stdio
    env: env
  });

  backendProcess.stdout.on('data', (data) => {
    fs.appendFileSync(logFile, `[STDOUT] ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    fs.appendFileSync(logFile, `[STDERR] ${data}`);
  });

  backendProcess.on('error', (err) => {
    fs.appendFileSync(logFile, `[ERROR] ${err.message}\n`);
  });

  backendProcess.on('exit', (code) => {
    fs.appendFileSync(logFile, `[EXIT] Backend process exited with code ${code}\n`);
  });
}

app.on('ready', () => {
  startBackend();

  // In production we need a moment for backend to boot before loading UI
  setTimeout(() => {
    createWindow();
    createTray();
  }, isDev ? 250 : 1500);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (backendProcess) backendProcess.kill();
});

app.on('will-quit', () => {
  if (backendProcess) backendProcess.kill();
});
