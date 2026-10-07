/* orbital-dispatch.mjs — 0.4.0 S0 MEASURE §3: one orbital-only dispatch at 96³, nAO 36 / 128 / 300 / 600, in Chromium
 * and Firefox on this box, beside the app's OWN benzene density dispatch measured in the same browser.
 *   python3 tools/gate/server.py "$PWD" 8735 &
 *   LW_PORT=8735 GD_PORT=5205 node tools/perf/orbital-dispatch.mjs [chromium] [firefox]
 * Per browser: (1) tools/perf/orbital-dispatch.html → window.__orb.run() (the no-tile kernel, plain and screened);
 * (2) /lab/?sw=0 → __LW.field.moleculeThroughput({ n }) on benzene at 96³, half 10.3, density (a Kac–Murdock–Szegő D,
 * as tests/field-molecule.browser-test.mjs does: the cost is set by nAO and the shells, never the values) and the
 * live ORBITAL kind (the χ-tile road) — 7 repeats each.  Writes research/release-0.4.0/measure/orbital-dispatch.json. */
import { launch, sleep } from './cdp.mjs';
import { open } from '../gate/gatekit.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PORT = process.env.LW_PORT || '8735';
const ORIGIN = `https://127.0.0.1:${PORT}`;
const OUT = 'research/release-0.4.0/measure/orbital-dispatch.json';
const PW = path.join(os.homedir(), '.cache/ms-playwright/chromium-1243/chrome-linux64/chrome');
/* the flags that put headless Chromium on the RTX here (tools/perf/gpu-limits.mjs: without Vulkan it is SwiftShader) */
const CHROME_ARGS = ['--no-sandbox', '--ignore-certificate-errors', '--enable-features=Vulkan', '--use-angle=vulkan', '--enable-webgpu-developer-features'];
const ORB = `return await window.__orb.run({ sizes: [36, 128, 300, 600], variants: ['plain', 'screened'], batches: 7, targetMs: 2500 });`;
const REF = `
  const f = __LW.field; if (!f.ok) return { skip: f.error || 'no WebGPU' };
  try { __LW.pause(); } catch (e) {}
  const [{ basisFrom }, { fieldShells }, { moleculeAtoms }] = await Promise.all([import('./md.js'), import('./molecular-field.js'), import('./molecules.js')]);
  const record = await (await fetch('./vendor/bse/sto-3g-v1.json')).json();
  const basis = basisFrom(moleculeAtoms('C6H6'), record, { cart: true }), n = basis.n;
  const shells = fieldShells(basis).map((s) => ({ center: s.center, l: s.l, ao: s.ao, prims: s.prims.map((p) => ({ alpha: p.alpha, w: Array.from(p.w) })) }));
  f.setResolution(96);
  const info = f.setMolecule({ nAO: n, half: 10.3, shells });
  const D = new Float32Array(n * n); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) D[i * n + j] = Math.exp(-0.5 * Math.abs(i - j));
  const c = new Float32Array(n); for (let i = 0; i < n; i++) c[i] = Math.sin(1 + i) / Math.sqrt(n / 2);
  const med = (a) => { const s = [...a].sort((x, y) => x - y), k = s.length >> 1; return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; };
  const out = { adapter: f.adapterInfo, info, res: f.resolution, ua: navigator.userAgent };
  for (const kind of ['density', 'orbital']) {
    f.setMoleculeMatrix(kind === 'density' ? D : c, { kind }); f.reconstructMolecule();
    await f.moleculeThroughput({ n: 40 });                                         // warm-up
    const runs = []; for (let r = 0; r < 7; r++) runs.push((await f.moleculeThroughput({ n: 800 })).msPerDispatch);
    out[kind] = { median: +med(runs).toFixed(4), min: Math.min(...runs), max: Math.max(...runs), runs, n: 800, cap: f.moleculeInfo && f.moleculeInfo.cap };
  }
  f.setMolecule(null);
  return out;`;

async function chromium() {
  process.env.CHROMIUM = PW; process.env.LW_CDP_TIMEOUT = '900000';
  const b = await launch({ width: 1200, height: 900, gpu: true, args: CHROME_ARGS });
  const R = {};
  try {
    await b.goto(`${ORIGIN}/tools/perf/orbital-dispatch.html`, 500);
    for (let i = 0; i < 100; i++) { if (await b.eval('!!window.__orb')) break; await sleep(100); }
    R.orbital = await b.eval(`(async()=>{ ${ORB} })()`);
    await b.goto(`${ORIGIN}/lab/?sw=0`, 1000);
    for (let i = 0; i < 400; i++) { try { if (await b.eval('!!(window.__LW && __LW.ready)')) break; } catch {} await sleep(100); }
    R.reference = await b.eval(`(async()=>{ ${REF} })()`);
    R.logs = b.logs.slice(0, 20);
  } finally { await b.close(); }
  return R;
}
async function firefox() {
  const g = await open(`${ORIGIN}/tools/perf/orbital-dispatch.html`, { width: 1200, height: 900, script: 900000, prefs: { 'privacy.reduceTimerPrecision': false } });
  const R = {};
  try {
    await g.waitFor('window.__orb', 100, 100);
    R.orbital = await g.ev(ORB);
    await g.nav(`${ORIGIN}/lab/?sw=0`).catch(() => {});
    await g.waitFor('window.__LW && __LW.ready', 600, 100);
    R.reference = await g.ev(REF);
  } finally { await g.close(); }
  return R;
}

const pick = process.argv.slice(2).length ? process.argv.slice(2) : ['chromium', 'firefox'];
let prev = {}; try { prev = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch {}
const res = prev.browsers || {};
for (const k of pick) {
  const t0 = Date.now();
  try { res[k] = await (k === 'chromium' ? chromium() : firefox()); }
  catch (e) { res[k] = { error: String(e && e.stack || e) }; }
  res[k].wallSec = +((Date.now() - t0) / 1000).toFixed(1); res[k].at = new Date().toISOString();
  const r = res[k];
  if (r.error) { console.log(k, 'ERROR', r.error); continue; }
  const ref = r.reference || {};
  console.log(`\n${k}: adapter ${JSON.stringify(r.orbital && r.orbital.adapter)} ts ${r.orbital && r.orbital.timestampQuery}; app benzene density ${ref.density && ref.density.median} ms, app orbital (tile) ${ref.orbital && ref.orbital.median} ms`);
  for (const row of (r.orbital && r.orbital.rows) || []) {
    const ratio = ref.density ? (row.wallMs.median / ref.density.median).toFixed(2) : '—';
    console.log(`  ${row.nAO} AO ${row.variant.padEnd(8)} wall ${row.wallMs.median} (${row.wallMs.min}–${row.wallMs.max}) gpu ${row.gpuMs ? row.gpuMs.median : '—'} ms · ×${ratio} benzene density · check rel ${row.check && row.check.relToMax}`);
  }
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ host: os.hostname(), browsers: res }, null, 1));
console.log('wrote', OUT);
