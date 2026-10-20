// iteration 012 · chain it012-rack · one headed Chromium on the session display (the real compositor: Page.captureScreenshot
// renders backdrop-filter, a WebDriver screenshot does not — Q5-BUILD.md), a fresh profile = the first-run material, 1920×1080.
//   DISPLAY=:0 LW_PORT=9511 node research/iteration-012/r-shots/shot.mjs <scenes.mjs>
// <scenes.mjs> default-exports { query?, boot?: 'js', scenes: [{ name, js }] }: each scene's js runs in the page (async body;
// return a value to log it), then the screenshot lands beside this file as <name>.png (no shot when name is null).
// LW_DSF=2 for the 2× reads.  Vulkan is off unless LW_VULKAN=1: with it this box's 2D canvases (the skeleton, kepler) paint nothing.
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));   // iteration 012 M1: a copy of r-shots/shot.mjs, its shots land here
const spec = (await import(pathToFileURL(path.resolve(process.argv[2])).href)).default;
const CHROME = process.env.CHROME || path.join(os.homedir(), '.cache/ms-playwright/chromium-1243/chrome-linux64/chrome');
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'lw-it012-'));
const cdpPort = 9800 + Math.floor(Math.random() * 90), W = 1920, H = 1080;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const proc = spawn(CHROME, [`--user-data-dir=${PROFILE}`, `--remote-debugging-port=${cdpPort}`, '--ignore-certificate-errors',
  '--enable-unsafe-webgpu', ...(process.env.LW_VULKAN === '1' ? ['--enable-features=Vulkan'] : []), '--no-sandbox', '--no-first-run', '--no-default-browser-check',
  '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding', '--disable-background-timer-throttling',
  `--window-size=${W + 16},${H + 120}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'], env: { ...process.env, DISPLAY: process.env.DISPLAY || ':0' } });
let stderr = ''; proc.stderr.on('data', (d) => { stderr += d; });
let ws;
try {
  let target = null;
  for (let i = 0; i < 120 && !target; i++) { try { target = (await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json()).find((x) => x.type === 'page'); } catch {} if (!target) await sleep(250); }
  if (!target) throw new Error('no page target: ' + stderr.split('\n').slice(-4).join(' | '));
  ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
  let id = 0; const pend = new Map(); ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
  const send = (method, params = {}) => new Promise((ok) => { const i = ++id; pend.set(i, ok); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression: `(async () => { ${expression} })()`, awaitPromise: true, returnByValue: true });
    if (r.result.exceptionDetails) throw new Error('page: ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text)); return r.result.result.value; };
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: +(process.env.LW_DSF || 1), mobile: false });
  await send('Page.navigate', { url: `https://127.0.0.1:${process.env.LW_PORT || 9511}/lab/?sw=0&warn=0${spec.query || ''}` });
  let up = false; for (let i = 0; i < 600 && !up; i++) { try { up = await ev('try { if (__LW.warning.open) __LW.warning.dismiss(); } catch (_) {} return !!(window.__LW && __LW.ready)'); } catch {} if (!up) await sleep(100); }
  console.log('ready', up, await ev(`window.__w = (ms) => new Promise((r) => setTimeout(r, ms)); await __w(2500); ${spec.boot || ''}; return 'booted'`));
  for (const s of spec.scenes) {
    const v = await ev(s.js);
    if (s.name) {
      const r = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(HERE, s.name + '.png'), Buffer.from(r.result.data, 'base64'));
    }
    console.log(s.name || '·', v === undefined ? '' : JSON.stringify(v));
  }
} catch (e) { console.error('ERROR', e); process.exitCode = 1; }
finally { try { ws && ws.close(); } catch {} proc.kill(); await sleep(500); try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {} }
