/* gpu-limits.mjs — 0.4.0 S0 MEASURE §1: the WebGPU adapter limits on this box, per browser.
 *   python3 tools/gate/server.py "$PWD" 8735 &
 *   LW_PORT=8735 GD_PORT=5205 node tools/perf/gpu-limits.mjs [variant …]
 * Variants (default: all but headed): pw-headless · pw-headless-vulkan · snap-headless · snap-headed · firefox
 * Each loads tools/perf/limits.html and reads window.__limits (adapter info, compute limits, features, and whether
 * requestDevice({ requiredLimits: { maxComputeWorkgroupStorageSize: 32768 } }) succeeds).  Writes
 * research/release-0.4.0/measure/limits.json and prints a table.  Nothing under lab/ is read or touched. */
import { launch, sleep } from './cdp.mjs';
import { open } from '../gate/gatekit.mjs';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PORT = process.env.LW_PORT || '8735';
const URL_ = `https://127.0.0.1:${PORT}/tools/perf/limits.html`;
const OUT = 'research/release-0.4.0/measure/limits.json';
const PW = path.join(os.homedir(), '.cache/ms-playwright/chromium-1243/chrome-linux64/chrome');
const BASE = ['--ignore-certificate-errors'];                       // probe-chromium.mjs's flags; launch({ gpu: true }) adds --enable-unsafe-webgpu --ignore-gpu-blocklist
const VULKAN = ['--enable-features=Vulkan', '--use-angle=vulkan'];

async function viaCdp(bin, extra) {
  process.env.CHROMIUM = bin;
  const b = await launch({ width: 900, height: 700, gpu: true, args: [...BASE, ...extra] });
  try {
    await b.goto(URL_, 300);
    const R = await b.eval('window.__limits');
    R.version = await b.eval('navigator.userAgent');
    return R;
  } finally { await b.close(); }
}
/* the headed road (probe-chromium-headed.mjs): a window on the session display for a few seconds */
async function headedSnap(extra = []) {
  const port = 9600 + Math.floor(Math.random() * 300);
  const profile = `/home/joshua-hosain/snap/chromium/common/lw-limits-${port}`;
  const proc = spawn('/snap/bin/chromium', ['--no-first-run', '--no-default-browser-check', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    '--window-size=900,700', '--enable-unsafe-webgpu', '--ignore-gpu-blocklist', ...BASE, ...extra, 'about:blank'], { stdio: 'ignore', env: { ...process.env, DISPLAY: process.env.DISPLAY || ':0' } });
  try {
    let ok = false; for (let i = 0; i < 80 && !ok; i++) { try { await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); ok = true; } catch { await sleep(250); } }
    if (!ok) throw new Error('no devtools port');
    const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
    const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
    let id = 0; const pending = new Map(); ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
    const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
    const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.text); return r.result.result.value; };
    await send('Page.enable'); await send('Page.navigate', { url: URL_ }); await sleep(800);
    let R = null; for (let i = 0; i < 50 && !R; i++) { try { R = await ev('window.__limits'); } catch { await sleep(200); } }
    R.version = await ev('navigator.userAgent');
    ws.close(); return R;
  } finally { proc.kill(); await sleep(400); fs.rmSync(profile, { recursive: true, force: true }); }
}
async function firefox() {
  const g = await open(URL_, { width: 900, height: 700 });
  try {
    await g.waitFor('window.__limits', 100, 100);
    const R = await g.ev('return await window.__limits;');
    R.version = await g.ev('return navigator.userAgent;');
    return R;
  } finally { await g.close(); }
}

const VARIANTS = {
  /* --no-sandbox: this box's AppArmor refuses unprivileged user namespaces to a non-snap Chromium (playwright passes it too) */
  'pw-headless': { label: 'Chromium 153 (playwright chromium-1243), headless=new', run: () => viaCdp(PW, ['--no-sandbox']) },
  'pw-headless-vulkan': { label: 'Chromium 153 (playwright chromium-1243), headless=new + Vulkan', run: () => viaCdp(PW, ['--no-sandbox', ...VULKAN]) },
  'snap-headless-vulkan': { label: 'Chromium 154 (/snap/bin/chromium), headless=new + Vulkan', run: () => viaCdp('/snap/bin/chromium', VULKAN) },
  'snap-headless': { label: 'Chromium 154 (/snap/bin/chromium), headless=new', run: () => viaCdp('/snap/bin/chromium', []) },
  'snap-headed': { label: 'Chromium 154 (/snap/bin/chromium), headed on :0', run: () => headedSnap() },
  'snap-headed-vulkan': { label: 'Chromium 154 (/snap/bin/chromium), headed on :0 + Vulkan', run: () => headedSnap(VULKAN) },
  firefox: { label: 'Firefox 157 (/usr/bin/firefox snap, geckodriver), headless, the gate\'s prefs', run: firefox },
};
const pick = process.argv.slice(2).length ? process.argv.slice(2) : ['pw-headless', 'pw-headless-vulkan', 'snap-headless', 'firefox'];
let prev = {}; try { prev = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch {}
const rows = prev.rows || {};
for (const k of pick) {
  const v = VARIANTS[k]; if (!v) { console.error('unknown variant', k); continue; }
  try { rows[k] = { label: v.label, ...(await v.run()) }; }
  catch (e) { rows[k] = { label: v.label, error: String(e && e.message || e) }; }
  console.log(k, JSON.stringify(rows[k]).slice(0, 400));
}
rows.m5 = rows.m5 || { label: 'iPad M5, Safari', pending: true, how: 'paste the one line in research/release-0.4.0/measure/MEASURE.md §1 into the Web Inspector console, or open tools/perf/limits.html from the LAN server' };
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ at: new Date().toISOString(), host: os.hostname(), rows }, null, 1));
const cols = ['maxComputeWorkgroupStorageSize', 'maxComputeInvocationsPerWorkgroup', 'maxComputeWorkgroupSizeX', 'maxComputeWorkgroupSizeY', 'maxComputeWorkgroupSizeZ', 'maxStorageBufferBindingSize', 'maxBufferSize', 'maxComputeWorkgroupsPerDimension'];
console.log('\n| variant | adapter | ' + cols.join(' | ') + ' | 32 KiB device | timestamp-query |');
for (const [k, r] of Object.entries(rows)) {
  const ad = r.info ? [r.info.vendor, r.info.architecture, r.info.description].filter(Boolean).join(' / ') : (r.pending ? 'M5 pending' : r.error || '?');
  console.log(`| ${k} | ${ad} | ` + cols.map((c) => (r.limits ? r.limits[c] : '—')).join(' | ') + ` | ${r.request32k ? (r.request32k.ok ? 'yes' : 'NO') : '—'} | ${r.timestampQuery ?? '—'} |`);
}
console.log('wrote', OUT);
