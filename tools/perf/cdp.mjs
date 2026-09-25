/* cdp.mjs — a headless Chromium over the DevTools protocol, no dependency (vendored from MIR/tools/cdp.mjs,
 * 2026-09-24, with `args` so a benchmark can accept the gate server's self-signed certificate and ask for
 * the real GPU).  launch() → { goto, eval, mouse, shot, resize, close, logs }. */
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const LIVE = new Set();
const reap = () => { for (const b of LIVE) { try { b.proc.kill(); } catch {} try { fs.rmSync(b.profile, { recursive: true, force: true }); } catch {} } LIVE.clear(); };
process.on('exit', reap);
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { reap(); process.exit(130); });
function findChromium() {
  if (process.env.CHROMIUM) return process.env.CHROMIUM;
  for (const name of ['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable']) {
    try { const p = execFileSync('which', [name], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); if (p) return p; } catch {}
  }
  return '/snap/bin/chromium';
}
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export async function launch({ width = 1280, height = 900, scale = 1, gpu = false, args = [], port = 9300 + Math.floor(Math.random() * 600) } = {}) {
  const bin = findChromium();
  let snap = false; try { snap = fs.realpathSync(bin).startsWith('/snap/') || bin.startsWith('/snap/'); } catch { snap = bin.startsWith('/snap/'); }
  const base = process.env.MIR_TMP || (snap ? path.join(os.homedir(), 'snap', 'chromium', 'common') : os.tmpdir());
  fs.mkdirSync(base, { recursive: true });
  const profile = fs.mkdtempSync(path.join(base, 'lw-cdp-'));
  const proc = spawn(bin, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--force-color-profile=srgb',
    '--font-render-hinting=none', '--disable-lcd-text', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, `--window-size=${width},${height}`,
    ...(gpu ? ['--enable-unsafe-webgpu', '--ignore-gpu-blocklist'] : []), ...args, 'about:blank'], { stdio: 'ignore' });
  const handle = { proc, profile }; LIVE.add(handle);
  let ok = false;
  for (let i = 0; i < 80 && !ok; i++) { try { await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); ok = true; } catch { await sleep(250); } }
  if (!ok) { proc.kill(); LIVE.delete(handle); throw new Error('chromium (' + bin + ') did not open its DevTools port'); }
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let id = 0; const pending = new Map(); const logs = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); return; }
    if (d.method === 'Runtime.exceptionThrown') logs.push('EXCEPTION ' + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text));
    else if (d.method === 'Runtime.consoleAPICalled' && (d.params.type === 'error' || d.params.type === 'warning')) logs.push(d.params.type + ' ' + d.params.args.map((a) => a.value ?? a.description).join(' '));
  };
  const LIMIT = Number(process.env.LW_CDP_TIMEOUT) || 120000;
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const i = ++id;
    const timer = setTimeout(() => { if (pending.delete(i)) reject(new Error(`cdp: ${method} took longer than ${LIMIT} ms`)); }, LIMIT);
    pending.set(i, (d) => { clearTimeout(timer); resolve(d); });
    try { ws.send(JSON.stringify({ id: i, method, params })); } catch (e) { clearTimeout(timer); pending.delete(i); reject(e); }
  });
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile: false });
  return {
    logs, send,
    async goto(url, settle = 1500) { await send('Page.navigate', { url }); await sleep(settle); },
    async eval(expression) {
      const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (r.result.exceptionDetails) throw new Error('page: ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text));
      return r.result.result.value;
    },
    async mouse(x, y, type = 'mouseMoved') { await send('Input.dispatchMouseEvent', { type, x, y, button: type === 'mouseMoved' ? 'none' : 'left', clickCount: type === 'mouseMoved' ? 0 : 1 }); },
    async shot(file, clip) {
      const r = await send('Page.captureScreenshot', { format: 'png', ...(clip ? { clip: { ...clip, scale: 1 } } : {}) });
      fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, Buffer.from(r.result.data, 'base64'));
    },
    async resize(w, h) { await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: scale, mobile: false }); },
    async close() { try { ws.close(); } catch {} proc.kill(); LIVE.delete(handle); await sleep(300); try { fs.rmSync(profile, { recursive: true, force: true }); } catch {} },
  };
}
