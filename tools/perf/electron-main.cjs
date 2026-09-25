// electron-main.cjs — a bare Electron window for the compositor benchmark: Chromium with the real GPU on the session display.
// Loads the gate server's page over https (self-signed, so certificate errors are ignored) and exposes CDP on LW_CDP_PORT.
'use strict';
const { app, BrowserWindow } = require('electron');
app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('remote-debugging-port', process.env.LW_CDP_PORT || '9700');
if (process.env.LW_NO_SANDBOX) app.commandLine.appendSwitch('no-sandbox');
if (process.env.LW_DSF) app.commandLine.appendSwitch('force-device-scale-factor', process.env.LW_DSF);   // LW_DSF=2 = the retina / 4K case
app.whenReady().then(() => {
  const win = new BrowserWindow({ width: +(process.env.LW_W || 1920), height: +(process.env.LW_H || 1080), show: true, backgroundColor: '#070a0f',
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true } });
  win.setMenuBarVisibility(false);
  win.loadURL(process.env.LW_URL || 'https://127.0.0.1:8721/lab/?preset=1s%2B2pz&sw=0&warn=0');
});
app.on('window-all-closed', () => app.quit());
