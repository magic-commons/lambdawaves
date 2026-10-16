// main.cjs — the λWAVES desktop host: serves the built dist/ over lambdawaves://app and changes nothing in it.
'use strict';
const { app, BrowserWindow, Menu, protocol, session, shell, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const ORIGIN = 'lambdawaves://app';
const START = ORIGIN + '/index.html?sw=0&warn=0';
const SMOKE = process.env.LW_SMOKE_DIR || '';
const SWITCHES = []; // Linux-only WebGPU switches: none needed (RTX 3070, Wayland, Electron 44.4.5, 2026-09-24)
if (process.platform === 'linux') for (const s of SWITCHES) app.commandLine.appendSwitch(...s.split('='));

protocol.registerSchemesAsPrivileged([{ scheme: 'lambdawaves', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, codeCache: true } }]);
if (SMOKE) app.setPath('userData', path.join(SMOKE, 'userData'));
if (!app.requestSingleInstanceLock()) { app.quit(); return; }

const MIME = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.txt': 'text/plain', '.md': 'text/plain', '': 'text/plain' };
const TEXT = /^text\/|json|svg/;
const WEB_PREFS = { nodeIntegration: false, contextIsolation: true, sandbox: true, preload: path.join(__dirname, 'preload.cjs') };
const root = app.isPackaged ? path.join(process.resourcesPath, 'dist') : path.resolve(__dirname, '../../../dist');
const inApp = (u) => { try { return new URL(u).origin === ORIGIN; } catch { return false; } };
const isWeb = (u) => /^https?:\/\//i.test(u);

async function serve(req) {
  const u = new URL(req.url);
  const fail = (status) => new Response(String(status), { status, headers: { 'Content-Type': 'text/plain' } });
  if (u.host !== 'app') return fail(404);
  let rel;
  try { rel = decodeURIComponent(u.pathname); } catch { return fail(400); }
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.resolve(root, '.' + path.posix.normalize(rel));
  const back = path.relative(root, file);
  if (!back || back.startsWith('..') || path.isAbsolute(back)) return fail(403);
  if (['_headers', '_redirects'].includes(path.basename(file))) return fail(404);
  let body;
  try { body = await fs.promises.readFile(file); } catch { return fail(404); }
  const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
  return new Response(body, { status: 200, headers: { 'Content-Type': TEXT.test(type) ? type + '; charset=utf-8' : type, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache' } });
}

const allowPermission = (permission, mediaTypes, origin) => {
  if (!inApp(origin || '')) return false;
  if (permission === 'fullscreen' || permission === 'clipboard-sanitized-write') return true;
  return permission === 'media' && mediaTypes.length > 0 && mediaTypes.every((t) => t === 'audio');
};

app.on('web-contents-created', (_e, wc) => {
  wc.on('will-navigate', (e, url) => {
    const to = e.url || url;
    if (inApp(to)) return;
    e.preventDefault();
    if (isWeb(to)) shell.openExternal(to);
  });
  wc.setWindowOpenHandler(({ url }) => {
    if (inApp(url)) return { action: 'allow', overrideBrowserWindowOptions: { webPreferences: WEB_PREFS } };
    if (isWeb(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  wc.on('will-prevent-unload', (e) => {
    if (SMOKE) { e.preventDefault(); return; }
    const win = BrowserWindow.fromWebContents(wc);
    const opts = { type: 'question', buttons: ['Leave', 'Stay'], defaultId: 1, cancelId: 1,
      title: 'λWAVES', message: 'Leave without saving?', detail: 'Your unsaved project changes will be lost.' };
    const choice = win ? dialog.showMessageBoxSync(win, opts) : dialog.showMessageBoxSync(opts);
    if (choice === 0) e.preventDefault();
  });
});

function smokeHooks(win) {
  const wc = win.webContents;
  wc.session.on('will-download', (_e, item) => item.setSavePath(path.join(SMOKE, item.getFilename())));
  const dbg = wc.debugger;
  dbg.attach('1.3');
  dbg.on('message', (_e, method, params) => {
    if (method !== 'Page.fileChooserOpened') return;
    const pick = fs.readdirSync(SMOKE).filter((f) => f.endsWith('.lambdawaves.json'))
      .map((f) => path.join(SMOKE, f)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
    dbg.sendCommand('DOM.setFileInputFiles', { files: pick ? [pick] : [], backendNodeId: params.backendNodeId }).catch(() => {});
  });
  dbg.sendCommand('Page.enable').then(() => dbg.sendCommand('Page.setInterceptFileChooserDialog', { enabled: true })).catch(() => {});
  wc.on('console-message', async (e, ...a) => {
    if ((typeof e.message === 'string' ? e.message : a[1]) !== '__LW_SMOKE_CAPTURE__') return;
    const host = { versions: process.versions, isPackaged: app.isPackaged, switches: process.platform === 'linux' ? SWITCHES : [],
      gpuFeatureStatus: app.getGPUFeatureStatus(), gpuInfo: await app.getGPUInfo('basic').catch(() => null) };
    fs.writeFileSync(path.join(SMOKE, 'host.json'), JSON.stringify(host, null, 1));
    const img = await wc.capturePage();
    const out = path.join(SMOKE, 'screenshot.png');
    fs.writeFileSync(out + '.tmp', img.toPNG()); fs.renameSync(out + '.tmp', out);
  });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  protocol.handle('lambdawaves', serve);
  const ses = session.defaultSession;
  ses.setPermissionRequestHandler((wc, permission, cb, d) => cb(allowPermission(permission, (d && d.mediaTypes) || [], (d && d.requestingUrl) || (wc && wc.getURL()))));
  ses.setPermissionCheckHandler((_wc, permission, origin, d) => allowPermission(permission, d && d.mediaType ? [d.mediaType] : [], origin));
  const win = new BrowserWindow({ width: 1500, height: 1000, backgroundColor: '#000000', webPreferences: WEB_PREFS });
  if (SMOKE) smokeHooks(win);
  win.loadURL(START);
});
app.on('second-instance', () => { const w = BrowserWindow.getAllWindows()[0]; if (w) { if (w.isMinimized()) w.restore(); w.focus(); } });
app.on('window-all-closed', () => app.quit());
