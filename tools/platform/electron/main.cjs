// main.cjs — the λWAVES desktop host: answers https://lambdawaves.localhost from the built dist/ (never the network) and changes nothing in it.
// An https origin and not a custom scheme (042 S): Cache Storage refuses every scheme but http(s), and the loader, the 47 records and the
// volumes keep their bytes there. The origin is the desktop's storage key (localStorage, IndexedDB, caches): it never changes again.
'use strict';
const { app, BrowserWindow, Menu, protocol, net, session, shell, dialog, screen } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { Readable } = require('node:stream');

const HOST = 'lambdawaves.localhost', ORIGIN = 'https://' + HOST;
const START = ORIGIN + '/index.html?sw=0&warn=0';   // no service worker: the package is the cache; warn=0 counts under automation alone (main.js)
const SMOKE = (process.argv.includes('--smoke') && process.env.LW_SMOKE_DIR) || '';   // the test mode needs the flag too: an environment variable alone never turns it on
const GROUND = '#070a0f';   // lab.css's ground and index.html's theme-color: the window before its first paint

const SWITCHES = [['disable-blink-features', 'WebShare']];   // Electron has no share sheet: saveBlob takes the download road
for (const s of SWITCHES) app.commandLine.appendSwitch(...s);
app.setPath('userData', SMOKE ? path.join(SMOKE, 'userData') : path.join(app.getPath('appData'), 'lambdawaves'));   // a name the product name cannot move
if (!app.requestSingleInstanceLock()) { app.quit(); return; }

const MIME = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.txt': 'text/plain', '.md': 'text/plain', '': 'text/plain' };
const TEXT = /^text\/|json|svg/;
const WEB_PREFS = { nodeIntegration: false, contextIsolation: true, sandbox: true, spellcheck: false, backgroundThrottling: false, preload: path.join(__dirname, 'preload.cjs') };
// spellcheck off: Chromium would fetch Hunspell dictionaries from Google; backgroundThrottling off: a hidden or minimised window keeps its
// clock and a film keeps rendering (the kit's recorder waits while the page is hidden), as a desktop instrument does
const root = app.isPackaged ? path.join(process.resourcesPath, 'dist') : path.resolve(__dirname, '../../../dist');
const CSP = ((() => { try { return fs.readFileSync(path.join(root, '_headers'), 'utf8'); } catch { return ''; } })().match(/^\s+Content-Security-Policy: (.+)$/m) || [])[1];   // the edge's own policy (build-deploy §2b)
const inApp = (u) => { try { return new URL(u).origin === ORIGIN; } catch { return false; } };
const isWeb = (u) => /^https?:\/\//i.test(u);

async function serve(req) {
  const u = new URL(req.url);
  if (u.host !== HOST) return net.fetch(req, { bypassCustomProtocolHandlers: true });   // a notebook's https picture (the CSP's img-src), as on the web
  const fail = (status) => new Response(String(status), { status, headers: { 'Content-Type': 'text/plain' } });
  let rel;
  try { rel = decodeURIComponent(u.pathname); } catch { return fail(400); }
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.resolve(root, '.' + path.posix.normalize(rel));
  const back = path.relative(root, file);
  if (!back || back.startsWith('..') || path.isAbsolute(back)) return fail(403);
  if (['_headers', '_redirects'].includes(path.basename(file))) return fail(404);
  if (/(^|[\\/])(con|prn|aux|nul|com[\d¹²³]|lpt[\d¹²³]|conin\$|conout\$)([ .][^\\/]*)?$/i.test(back)) return fail(404);   // Windows opens a device by that name, never a file of dist/
  const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const headers = { 'Content-Type': TEXT.test(type) ? type + '; charset=utf-8' : type, 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache',
    'Accept-Ranges': 'bytes', ...(CSP ? { 'Content-Security-Policy': CSP } : {}) };
  const r = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get('range') || ''), ranged = !!(r && (r[1] || r[2]));   // a film's seek
  if (!ranged && req.method !== 'HEAD') {   // the whole file in one read: a missing file, a directory, a NUL byte all fail it
    let body;
    try { body = await fs.promises.readFile(file); } catch { return fail(404); }
    return new Response(body, { status: 200, headers: { ...headers, 'Content-Length': String(body.length) } });
  }
  let size;
  try { const st = await fs.promises.stat(file); if (!st.isFile()) return fail(404); size = st.size; } catch { return fail(404); }
  const start = !ranged ? 0 : r[1] ? +r[1] : Math.max(0, size - +r[2]), end = ranged && r[1] && r[2] ? Math.min(+r[2], size - 1) : size - 1;
  if (ranged && start > end) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  if (ranged) headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
  headers['Content-Length'] = String(Math.max(0, end - start + 1));
  return new Response(req.method === 'HEAD' ? null : Readable.toWeb(fs.createReadStream(file, { start, end })), { status: ranged ? 206 : 200, headers });
}

// The roads lab/ takes through a permission, each answered on purpose: full screen (FULL, F11), the clipboard's write (COPY, LINK), Web MIDI
// (MAPPING: a mapped controller is live at launch), the microphone alone (AUDIO), the screen kept awake (a film, the transport),
// persistent storage (an install: library.js persistOnce). Refused, because nothing in lab/ asks: the camera, the clipboard's read,
// notifications, location, pointer and keyboard lock, the File System Access pickers, HID, serial, USB.
const GRANT = new Set(['fullscreen', 'clipboard-sanitized-write', 'midi', 'midiSysex', 'screen-wake-lock', 'persistent-storage']);
const allowPermission = (permission, mediaTypes, origin) => inApp(origin || '') &&
  (GRANT.has(permission) || (permission === 'media' && mediaTypes.length > 0 && mediaTypes.every((t) => t === 'audio')));

app.on('session-created', (ses) => { ses.setSpellCheckerEnabled(false); ses.setSpellCheckerDictionaryDownloadURL(ORIGIN + '/'); });   // no Hunspell fetch from Google
app.on('web-contents-created', (_e, wc) => {
  wc.on('will-navigate', (e, url) => {
    const to = e.url || url;
    if (inApp(to)) return;
    e.preventDefault();
    if (isWeb(to)) shell.openExternal(to);
  });
  wc.setWindowOpenHandler(({ url }) => {
    if (inApp(url)) return { action: 'allow', overrideBrowserWindowOptions: { backgroundColor: GROUND, webPreferences: WEB_PREFS } };
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

// THE WINDOW REMEMBERS: its size and place (only where a screen still shows it), maximised, full screen — userData/window.json at each close
const STATE = () => path.join(app.getPath('userData'), 'window.json');
function lastWindow() {
  let s; try { s = JSON.parse(fs.readFileSync(STATE(), 'utf8')); } catch { return {}; }
  if (!s || typeof s !== 'object') return {};
  const b = s.bounds;
  const seen = b && [b.x, b.y, b.width, b.height].every(Number.isFinite) && screen.getAllDisplays()
    .some(({ workArea: a }) => b.x < a.x + a.width && b.x + b.width > a.x && b.y < a.y + a.height && b.y + b.height > a.y);
  return { bounds: seen ? b : null, maximized: s.maximized === true, fullscreen: s.fullscreen === true };
}

// A page that died or hangs is said and reloaded (the session comes back with it: main.js RESUME), never left as a dead window
function guard(win) {
  const wc = win.webContents; let killed = false, hung = null;
  const ask = (o) => dialog.showMessageBox(win, { type: 'warning', title: 'λWAVES', detail: 'Reloading brings the session back as it was last kept.', defaultId: 0, ...o });
  wc.on('render-process-gone', (_e, d) => {
    if (killed || d.reason === 'clean-exit' || SMOKE || win.isDestroyed()) { killed = false; return; }
    ask({ message: `λWAVES stopped (${d.reason}).`, buttons: ['Reload', 'Quit'], cancelId: 1 }).then(({ response }) => (response === 0 ? win.loadURL(START) : app.quit()));
  });
  win.on('unresponsive', () => {
    if (hung || SMOKE) return;
    hung = new AbortController(); win.once('responsive', () => hung && hung.abort());
    ask({ message: 'λWAVES is not responding.', buttons: ['Wait', 'Reload'], cancelId: 0, signal: hung.signal }).then(({ response }) => {
      hung = null; if (response === 1 && !win.isDestroyed()) { killed = true; wc.forcefullyCrashRenderer(); wc.reload(); }
    });
  });
}

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
    const host = { versions: process.versions, isPackaged: app.isPackaged, switches: SWITCHES.map((s) => s.join('=')),
      gpuFeatureStatus: app.getGPUFeatureStatus(), gpuInfo: await app.getGPUInfo('basic').catch(() => null) };
    fs.writeFileSync(path.join(SMOKE, 'host.json'), JSON.stringify(host, null, 1));
    const img = await wc.capturePage();
    const out = path.join(SMOKE, 'screenshot.png');
    fs.writeFileSync(out + '.tmp', img.toPNG()); fs.renameSync(out + '.tmp', out);
  });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  protocol.handle('https', serve);
  const ses = session.defaultSession;
  ses.setPermissionRequestHandler((wc, permission, cb, d) => cb(allowPermission(permission, (d && d.mediaTypes) || [], (d && d.requestingUrl) || (wc && wc.getURL()))));
  ses.setPermissionCheckHandler((_wc, permission, origin, d) => allowPermission(permission, d && d.mediaType ? [d.mediaType] : [], origin));
  const last = lastWindow(), area = screen.getPrimaryDisplay().workAreaSize;
  const win = new BrowserWindow({ width: Math.min(1500, area.width), height: Math.min(1000, area.height), ...last.bounds, minWidth: 640, minHeight: 480,
    backgroundColor: GROUND, icon: path.join(root, 'img/icon-512.png'), webPreferences: WEB_PREFS });
  if (last.maximized) win.maximize();
  if (last.fullscreen) win.setFullScreen(true);
  win.on('close', () => { try { fs.writeFileSync(STATE(), JSON.stringify({ bounds: win.getNormalBounds(), maximized: win.isMaximized(), fullscreen: win.isFullScreen() })); } catch {} });
  win.webContents.on('before-input-event', (e, i) => {   // F11 is the window's, as it is a browser's (the app never binds it: mir/shell/keys.js)
    if (i.type === 'keyDown' && i.key === 'F11' && !i.alt && !i.control && !i.meta && !i.shift) { e.preventDefault(); win.setFullScreen(!win.isFullScreen()); }
  });
  guard(win);
  if (SMOKE) smokeHooks(win);
  win.loadURL(START);
});
app.on('second-instance', () => { const w = BrowserWindow.getAllWindows()[0]; if (w) { if (w.isMinimized()) w.restore(); w.focus(); } });
app.on('window-all-closed', () => app.quit());
