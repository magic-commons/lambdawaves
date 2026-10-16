#!/usr/bin/env node
// shots.mjs — the store screenshots: pure UI of the real app, no overlays, driven over CDP.
//   node store/shots.mjs          → store/steam/screenshots/0N-*.png  1920×1080, the PACKAGED Electron build (lambdawaves://app)
//   node store/shots.mjs --ipad   → store/apple/screenshots/0N-*.png  2752×2064 = 1376×1032 CSS × 2, touch + iPad UA emulated, SAME host
//   Both use the packaged Electron (real WebGPU on this box's GPU) serving the same dist/ the iOS shell bundles. Snap Chromium here
//   only offers SwiftShader, on which the app reports "the GPU device was lost" (measured 2026-09-24), so it cannot make these renders.
//   node store/shots.mjs --art    → store/steam/capsules/src-*.png  3840×2160 (1920×1080 CSS × 2) field-only stills (H = hide the interface), the capsule source
//   --only=3  one state · --out=DIR  elsewhere · --no-sandbox is added for Electron only when chrome-sandbox is not root:4755 (said on stdout)
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import net from 'node:net';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.resolve(HERE, '..');
const arg = (k) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1];
const IPAD = process.argv.includes('--ipad'), ART = process.argv.includes('--art'), ONLY = +arg('only') || 0;
const OUT = path.resolve(arg('out') || path.join(HERE, ART ? 'steam/capsules' : IPAD ? 'apple/screenshots' : 'steam/screenshots'));
const VIEW = IPAD ? { width: 1376, height: 1032, deviceScaleFactor: 2, mobile: true } : { width: 1920, height: 1080, deviceScaleFactor: ART ? 2 : 1, mobile: false };
const BASE = 'lambdawaves://app/index.html';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = () => new Promise((r) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
const kids = []; process.on('exit', () => kids.forEach((k) => { try { k.kill('SIGKILL'); } catch {} }));

const unfold = (id) => `__LW.layout.reopen('${id}','R'); { const d = document.querySelector('.dev[data-id="${id}"]'); if (d && d.classList.contains('folded')) d.querySelector('.dev-fold').click(); }`;
/* The five states. `q` is the boot query; `go` runs in the page after boot and the notice. */
const STATES = [
  { name: '01-hydrogen-field-and-rack', q: 'play=1', wait: 2500, go: `` },
  { name: '02-spectrum-state-superposition', q: 'preset=recon&view=phase&play=1', wait: 3000, go: unfold('state') },
  { name: '03-wave-dancer-demo', q: '', wait: 4000,
    go: `document.querySelector('.pj-demo').click(); await new Promise((r) => setTimeout(r, 1500)); __LW.layout.notebook.close(); __LW.play();` },
  { name: '04-molecules-benzene', q: 'view=density', wait: 3000,
    go: unfold('chem') + `await __LW.chem.solve('C6H6'); __LW.chem.setOn(true); __LW.play();` },
  { name: '05-notebook-and-projects', q: 'preset=1s%2B2s&view=density&play=1', wait: 2500,
    go: `const nb = __LW.layout.notebook; __LW.projects.save('lessons/radial-breathing'); nb.open('notes'); nb.title = 'RADIAL BREATHING';
      nb.text = '## 1s + 2s\\n\\nTwo s states beat at the difference of their energies:\\n\\n$$T = \\\\frac{2\\\\pi}{E_2 - E_1} = 16.755\\\\ \\\\text{a.u.}$$\\n\\nThe density breathes in and out once per period. Next: add $2p_z$ and watch it slosh.';
      nb.setMode('view'); __LW.projects.save('lessons/radial-breathing');` },
];

const HIDE = `await new Promise((r) => setTimeout(r, 800)); dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyH', key: 'h', bubbles: true }));`;
const ARTS = [
  { name: 'src-field-wave-dancer', q: '', wait: 3000, go: STATES[2].go + HIDE },
  { name: 'src-field-reconnection-dark', q: 'preset=recon&view=phase&play=1', wait: 3000, go: `__LW.setTheme('dark');` + HIDE },
];

function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl); let id = 0; const pend = new Map(), errs = [];
  ws.onmessage = (m) => { const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
    else if (d.method === 'Runtime.exceptionThrown') errs.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
    else if (d.method === 'Page.javascriptDialogOpening') send('Page.handleJavaScriptDialog', { accept: true }).catch(() => {}); };
  const send = (method, params = {}) => new Promise((ok, no) => { const i = ++id; pend.set(i, (d) => (d.error ? no(new Error(method + ': ' + d.error.message)) : ok(d.result))); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
    if (r.exceptionDetails) throw new Error('page: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text)); return r.result.value; };
  return new Promise((ok, no) => { ws.onopen = () => ok({ send, ev, errs }); ws.onerror = no; });
}

async function target(p, match) {
  for (let i = 0; i < 160; i++) { try { const t = (await (await fetch(`http://127.0.0.1:${p}/json/list`)).json()).find((x) => x.type === 'page' && match(x.url)); if (t) return t; } catch {} await sleep(250); }
  throw new Error('no page target on DevTools port ' + p);
}

async function launch() {
  const p = await port(), tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lw-shots-'));
  const PKG = path.join(REPO, 'tools/platform/electron/out/lambdawaves-desktop-linux-x64'), sb = fs.statSync(path.join(PKG, 'chrome-sandbox'));
  const flags = sb.uid === 0 && (sb.mode & 0o4000) ? [] : ['--no-sandbox'];
  console.log('electron sandbox: ' + (flags.length ? 'OFF (--no-sandbox: chrome-sandbox is not root:4755; capture only, never shipped)' : 'on'));
  kids.push(spawn(path.join(PKG, 'lambdawaves-desktop'), [`--remote-debugging-port=${p}`, '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding', ...flags], { env: { ...process.env, LW_SMOKE_DIR: tmp }, stdio: 'ignore' }));
  return target(p, (u) => u.startsWith('lambdawaves://app'));
}

const t = await launch(), page = await cdp(t.webSocketDebuggerUrl);
await page.send('Runtime.enable'); await page.send('Page.enable'); await page.send('Page.bringToFront'); await page.send('Emulation.setFocusEmulationEnabled', { enabled: true });
await page.send('Emulation.setDeviceMetricsOverride', { ...VIEW, screenWidth: VIEW.width, screenHeight: VIEW.height });
if (IPAD) { await page.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await page.send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPad; CPU OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1', platform: 'iPad' }); }
fs.mkdirSync(OUT, { recursive: true });
let bad = 0;
for (const [i, s] of (ART ? ARTS : STATES).entries()) {
  if (ONLY && ONLY !== i + 1) continue;
  await page.ev(`(() => { try { localStorage.clear(); } catch (e) {} return 1; })()`).catch(() => {});
  await page.send('Page.navigate', { url: `${BASE}?sw=0&warn=0${s.q ? '&' + s.q : ''}` });
  await sleep(800);
  for (let k = 0; k < 150 && !(await page.ev('!!(window.__LW && __LW.ready === true)').catch(() => false)); k++) await sleep(200);
  await page.ev(`(() => { const p = document.getElementById('warnPane'), b = p && p.querySelector('.warn-btn'); if (p && !p.hidden && b) b.click(); return 1; })()`);
  await sleep(500);
  if (s.go) await page.ev(`(async () => { ${s.go} })()`);
  await sleep(s.wait); await page.ev('__LW.settle()');
  const info = await page.ev(`({ frames: __LW.stats.frames, ok: __LW.field.ok, adapter: __LW.field.adapterInfo && (__LW.field.adapterInfo.vendor + '/' + __LW.field.adapterInfo.architecture), errors: [...(window.__e || [])].length })`);
  const r = await page.send('Page.captureScreenshot', { format: 'png' }), buf = Buffer.from(r.data, 'base64');
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20), want = [VIEW.width * VIEW.deviceScaleFactor, VIEW.height * VIEW.deviceScaleFactor];
  const file = path.join(OUT, s.name + '.png'); fs.writeFileSync(file, buf);
  const ok = w === want[0] && h === want[1] && info.ok && info.frames > 0;
  if (!ok) bad++;
  console.log(`${ok ? 'GREEN' : 'RED  '} ${path.relative(REPO, file)} ${w}×${h} · ${buf.length} B · frames ${info.frames} · adapter ${info.adapter} · __e ${info.errors}`);
}
if (page.errs.length) console.log('page exceptions: ' + page.errs.join(' | '));
process.exit(bad ? 1 : 0);
