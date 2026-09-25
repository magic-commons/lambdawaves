/* tools/perf/digest-lock.mjs — THE DIGEST LOCK (optimization 2026-09-24, lane K item K0).
 *
 *   LW_PORT=8722 GD_PORT=5241 node tools/perf/digest-lock.mjs --write    record the lock on THIS tree
 *   LW_PORT=8722 GD_PORT=5241 node tools/perf/digest-lock.mjs --check    re-run and compare, exit 1 on any difference
 *   options:  --fixture <path>   (default research/optimization-2026-09-24/digest-lock-base.json)
 *             --only states,styles,lines     --grids 64,96,128     --query 'gastab=1'   (appended to the lab URL)
 *
 * What it locks, every number read from the SHIPPED pipelines through the booted app (window.__LW, __LW.field) —
 * no replica, no copied WGSL:
 *   states × grids   {1s+2pz, rydberg, 91 labels, BOX packet, AXIAL gas 256, helium, H₂, momentum, oscillator,
 *                     quarkonium, a Sturmian state, legacy H₂⁺, one molecule (MOLECULES · H₂O)} × {64, 96, 128}:
 *                     fieldDigest (hash of every rgba16float texel's re/im halves + integral + maxRho), readPixels at
 *                     320×240 and 1024×640 (volume + chrome), and a hash of packModes' bytes (the CPU record side).
 *   styles           readPixels (1024×640) for every VIEW × every draw STYLE at 96³ on 1s+2pz, plus the flags a
 *                     specialised render pipeline could fold (palette on/off, invert, finish glass/matte, the bow,
 *                     dither, slice clip/slab).
 *   lines            linePixels (640×480; its bytes hashed as they are mapped) and readPixels for FRAME
 *                     {off, box, lattice, dots} × axis {box, corner} + axis off + a slice + the other theme's ink,
 *                     each with no occlusion and with a fixed two-rectangle occlusion block.
 *
 * DETERMINISM, and how each input is pinned (render-exact.js' hazard list is the source):
 *   H1 jitter        field.stats.presents is set to 13 (render-exact's and capture's seed) synchronously before every
 *                    readPixels/linePixels call (writeView reads it before the call's first await) and put back after.
 *   H2/H3            governor off, AUTO SCALE off at 1, quality.scale 1, the clock paused, the modulation clock stopped.
 *   time             every state is launched at t = 0 (box/gas launches read clock.t) and scrubbed to a fixed t.
 *   occlusion        the block the lines read is set explicitly before every capture (the app's own rects move with
 *                    window layout); the corner-axis placement is pinned to fixed values.
 *   grid pairing     64/96/128 with the GRID segment's steps 110/160/240; the canvas size never changes.
 * Every state@grid is digested twice with a forced reconstruct between (`repeat`), so a kernel that is not a pure
 * function of its inputs shows inside one run; `--check` run twice on an untouched tree is the cross-run proof.
 * Machine-specific (adapter, driver, browser build): a fixture recorded here is compared only on this machine.
 */
import { open } from '../gate/gatekit.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const flag = (k) => args.includes(k);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 && i + 1 < args.length ? args[i + 1] : d; };
const MODE = flag('--write') ? 'write' : flag('--check') ? 'check' : null;
if (!MODE) { console.error('usage: node tools/perf/digest-lock.mjs --write|--check [--fixture f] [--only states,styles,lines] [--grids 64,96,128] [--query q]'); process.exit(2); }
const FIXTURE = path.resolve(ROOT, opt('--fixture', 'research/optimization-2026-09-24/digest-lock-base.json'));
const ONLY = opt('--only', 'states,styles,lines').split(',');
const GRIDS = opt('--grids', '64,96,128').split(',').map(Number);
const QUERY = opt('--query', '');
const PORT = process.env.LW_PORT || '8721';
const W = 1600, H = 1000;
const url = `https://127.0.0.1:${PORT}/lab/?preset=1s%2B2pz&sw=0${QUERY ? '&' + QUERY : ''}`;

/* ── the in-page helpers, installed once as window.__DL ─────────────────────────────────────────────────────── */
const HELPERS = `
const LW = __LW, F = LW.field, d = F.device;
if (!F || !F.ok) throw new Error('no WebGPU field: ' + (F && F.error));
const STEPS = { 64: 110, 96: 160, 128: 240 }, SEED = 13;
const fnvU32 = (u32) => { let h = 2166136261 >>> 0; for (let i = 0; i < u32.length; i++) h = Math.imul(h ^ u32[i], 16777619) >>> 0; return h.toString(16); };
const fnvRGB = (px, w, h, bpr) => { let hs = 2166136261 >>> 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = y * bpr + x * 4; hs = Math.imul(hs ^ (px[o] + (px[o + 1] << 8) + (px[o + 2] << 16)), 16777619) >>> 0; } return hs.toString(16); };
const settle = async (n = 2) => { for (let i = 0; i < n; i++) await LW.settle(); };
const fm = await import('/lab/field.js');
const OCC2 = [[40, 40, 300, 200], [500, 300, 900, 700]];
const CORNER = { cornerX: 0.8, cornerY: -0.8, cornerScaleX: 0.04, cornerScaleY: 0.064 };
const mat0 = JSON.parse(JSON.stringify(LW.mat));
const MAT_KEYS = ['view', 'style', 'paletteOn', 'invert', 'finish', 'dither', 'frame', 'frameMode', 'axis', 'axisMode', 'lightUI', 'slice', 'boost', 'cornerX', 'cornerY', 'cornerScaleX', 'cornerScaleY'];
const restoreMat = () => { for (const k of MAT_KEYS) { if (mat0[k] === undefined) delete LW.mat[k]; else LW.mat[k] = JSON.parse(JSON.stringify(mat0[k])); } };
/** the pinned readback: occlusion set, jitter seed pinned for the synchronous half of the call, then put back */
async function rp(w, h, occ = []) {
  F.setOcclusion(occ);
  const k = F.stats.presents; F.stats.presents = SEED;
  const p = F.readPixels(LW.obs, LW.mat, w, h);
  F.stats.presents = k;
  const r = await p; return { hash: r.hash, nonBlack: r.nonBlack };
}
/** linePixels with its mapped bytes hashed: the MAP_READ buffer it allocates is wrapped for the synchronous half */
async function lp(w, h, occ = []) {
  F.setOcclusion(occ);
  let bytes = null; const own = Object.prototype.hasOwnProperty.call(d, 'createBuffer'), orig = d.createBuffer;
  d.createBuffer = function (desc) { const b = orig.call(d, desc); if (desc.usage & GPUBufferUsage.MAP_READ) { const g = b.getMappedRange.bind(b); b.getMappedRange = (...a) => { const r = g(...a); bytes = new Uint8Array(r.slice(0)); return r; }; } return b; };
  const k = F.stats.presents; F.stats.presents = SEED;
  let p; try { p = F.linePixels(LW.obs, LW.mat, w, h); } finally { F.stats.presents = k; if (own) d.createBuffer = orig; else delete d.createBuffer; }
  const r = await p;
  return { hash: bytes ? fnvRGB(bytes, w, h, Math.ceil(w * 4 / 256) * 256) : null, buckets: r.buckets, darkest: r.darkest };
}
function packHash() {
  const modes = LW.modesAt(LW.clock.t);
  if (!modes) return { count: 0, pack: null };
  const pk = fm.packModes(modes);
  return { count: pk.count, pack: fnvU32(new Uint32Array(pk.buf.buffer, 0, Math.max(1, pk.count) * 28)) };
}
async function atGrid(g) {
  LW.quality.res = g; LW.quality.steps = STEPS[g]; LW.quality.scale = 1; LW.quality.auto = false; LW.quality.autoScale = 1;
  LW.schedule(4); await settle(3);
  if (F.resolution !== g) throw new Error('grid did not take: ' + F.resolution + ' for ' + g);
}
async function freeze(t) {
  LW.pause(); if (LW.mod && LW.mod.running) LW.mod.stop();
  LW.clock.scrub(t); LW.schedule(4); await settle(2);
}
async function base() {
  try { if (LW.chem.state && LW.chem.state().on) LW.chem.setOn(false); } catch (_) {}
  for (const c of [LW.helium, LW.h2, LW.molecule]) if (c && c.on) c.setOn(false);
  if (LW.sturmian.on) LW.sturmian.set(false);
  if (LW.space !== 'x') LW.setSpace('x');
  LW.setGasBasis('reg');
  if (LW.hamiltonian !== 'hydrogen') LW.setHamiltonian('hydrogen');
  LW.pause(); LW.clock.scrub(0);
  LW.loadPreset('1s+2pz'); LW.pause(); LW.clock.scrub(0);
  restoreMat(); LW.mat.view = 1; LW.mat.style = 0;          // the state rows present PHASE · CLOUD (the boot view)
  await settle(2);
}
/* ── THE STATES.  Each one is entered from base() at t = 0, then frozen at its own fixed t. ── */
const STATES = {
  '1s+2pz': async () => { await freeze(3.7); },
  rydberg: async () => { LW.loadPreset('rydberg'); LW.pause(); LW.clock.scrub(0); await freeze(3.7); },
  h91: async () => { LW.loadPreset('1s'); LW.pause(); LW.clock.scrub(0); for (let a = 0; a < 91; a++) LW.reg.set(a, 1, 0, 0); LW.reg.normalize(); await freeze(3.7); },
  box: async () => { LW.loadPreset('1s'); LW.setHamiltonian('well'); LW.setGasBasis('reg'); LW.pause(); LW.clock.scrub(0); LW.enterBox(); await freeze(2.0); },
  gas: async () => { LW.setHamiltonian('well'); LW.setGasBasis('axial'); LW.pause(); LW.clock.scrub(0); LW.enterBox(); await freeze(2.0); },
  helium: async () => { LW.helium.load({ on: true, x1: [0.3, 0.4, 0.5] }); await freeze(3.7); },
  h2: async () => { LW.h2.load({ on: true, R: 1.4, which: 'singlet' }); await freeze(3.7); },
  momentum: async () => { LW.setSpace('p'); await freeze(3.7); },
  oscillator: async () => { LW.setHamiltonian('qho'); LW.loadPreset('1s+2pz'); LW.pause(); LW.clock.scrub(0); await freeze(1.3); },
  quarkonium: async () => { LW.setHamiltonian('cornell'); LW.loadPreset('1s+2pz'); LW.pause(); LW.clock.scrub(0); await freeze(3.7); },
  sturmian: async () => { LW.sturmian.set(true); LW.sturmian.setLambda(1.4); await freeze(3.7); },
  h2plus: async () => { LW.molecule.load({ on: true, R: 2.0, kind: 'sigma_g' }); await freeze(3.7); },
  chem: async () => { await LW.chem.solve('H2O'); LW.chem.setOn(true); LW.chem.setView('density'); await settle(4); await freeze(3.7); },
};
async function state(name, grids) {
  await base(); await STATES[name]();
  const out = {};
  for (const g of grids) {
    await atGrid(g);
    const dg = await F.fieldDigest();
    const gen = F.generation; LW.schedule(2); await settle(2);
    const dg2 = await F.fieldDigest();
    const a = await rp(320, 240), b = await rp(1024, 640), pk = packHash();
    out[g] = { digest: dg.hash, integral: dg.integral, maxRho: dg.maxRho, nan: dg.nan, half: dg.half, res: dg.res,
      repeat: dg2.hash === dg.hash, reconstructed: F.generation > gen, rp: a.hash, rpL: b.hash, nonBlack: b.nonBlack,
      pack: pk.pack, count: pk.count, space: F.space, t: LW.clock.t, hamiltonian: LW.hamiltonian };
  }
  return out;
}
async function styles() {
  await base(); await freeze(3.7); await atGrid(96);
  const out = {}, VN = fm.VIEW_NAMES, SN = fm.STYLE_NAMES;
  const cap = async (key, set) => { restoreMat(); set(); out[key] = (await rp(1024, 640)).hash; };
  for (let v = 0; v < VN.length; v++) for (let s = 0; s < SN.length; s++) await cap(VN[v] + '/' + SN[s], () => { LW.mat.view = v; LW.mat.style = s; });
  const FL = {
    'palette-on': { paletteOn: true }, 'palette-off': { paletteOn: false }, invert: { invert: true },
    'finish-glass': { finish: 'glass' }, 'finish-matte': { finish: 'matte' }, dither: { dither: 1 },
    bow: { boost: { on: true, k: [0, 0.4, 1.2] } },
    'slice-clip': { slice: { mode: 1, axis: 2, pos: 0.1, thick: 0.03 } }, 'slice-slab': { slice: { mode: 2, axis: 0, pos: -0.2, thick: 0.08 } },
  };
  const FV = [[0, 0], [1, 0], [2, 0], [4, 0], [1, 1], [0, 3], [5, 6], [3, 7]];      // view/style pairs each flag is read on
  for (const [fk, fo] of Object.entries(FL)) for (const [v, s] of FV) await cap(fk + ':' + VN[v] + '/' + SN[s], () => { Object.assign(LW.mat, JSON.parse(JSON.stringify(fo))); LW.mat.view = v; LW.mat.style = s; });
  restoreMat();
  return out;
}
async function lines() {
  await base(); await freeze(3.7); await atGrid(96);
  const out = {};
  const V = {
    'off': { frame: false }, 'box': { frame: true, frameMode: 'box' }, 'lattice': { frame: true, frameMode: 'lattice' }, 'dots': { frame: true, frameMode: 'dots' },
    'off+corner': { frame: false, axis: true, axisMode: 'corner', ...CORNER }, 'box+corner': { frame: true, frameMode: 'box', axis: true, axisMode: 'corner', ...CORNER },
    'lattice+corner': { frame: true, frameMode: 'lattice', axis: true, axisMode: 'corner', ...CORNER }, 'dots+corner': { frame: true, frameMode: 'dots', axis: true, axisMode: 'corner', ...CORNER },
    'box-axisoff': { frame: true, frameMode: 'box', axis: false }, 'box+slice': { frame: true, frameMode: 'box', slice: { mode: 2, axis: 1, pos: 0.25, thick: 0.05 } },
    'box+ink': { frame: true, frameMode: 'box', lightUI: !mat0.lightUI }, 'lattice+ink': { frame: true, frameMode: 'lattice', lightUI: !mat0.lightUI }, 'dots+ink': { frame: true, frameMode: 'dots', lightUI: !mat0.lightUI },
  };
  for (const [k, o] of Object.entries(V)) for (const [ok, occ] of [['', []], ['@occ', OCC2]]) {
    restoreMat(); Object.assign(LW.mat, { axis: true, axisMode: 'box' }, JSON.parse(JSON.stringify(o)));
    const l = await lp(640, 480, occ), r = await rp(640, 480, occ);
    out[k + ok] = { line: l.hash, buckets: l.buckets, darkest: l.darkest, rp: r.hash };
  }
  restoreMat();
  return out;
}
window.__DL = { state, styles, lines, base, STATES: Object.keys(STATES),
  meta: () => ({ obs: JSON.parse(JSON.stringify(LW.obs)), canvas: [F.canvas.width, F.canvas.height], dpr: devicePixelRatio, format: F.format,
    gamut: F.gamut, adapter: F.adapterInfo, theme: LW.theme, lightUI: LW.mat.lightUI, palette: !!LW.mat.paletteOn, ua: navigator.userAgent, build: LW.build }) };
return { ok: true, states: Object.keys(STATES) };
`;

const t0 = Date.now();
const g = await open(url, { width: W, height: H, script: 1800000, prefs: { 'privacy.reduceTimerPrecision': false } });
const result = { made: new Date().toISOString(), url, meta: null, states: {}, styles: null, lines: null, pageErrors: [] };
let failed = null;
try {
  const r = await g.waitFor('window.__LW && __LW.ready', 3000, 20);
  if (!r || r.ok === 0) throw new Error('lab did not become ready');
  await g.ev(`try { if (__LW.warning && __LW.warning.dismiss) __LW.warning.dismiss(); } catch (_) {} __LW.governor.on = false; __LW.quality.auto = false; __LW.quality.autoScale = 1; __LW.pause(); await __LW.settle(); await __LW.settle(); return true;`);
  const inst = await g.ev(HELPERS);
  if (!inst || inst.E) throw new Error('helpers: ' + JSON.stringify(inst));
  result.meta = await g.ev('return __DL.meta();');
  if (ONLY.includes('styles')) { result.styles = await g.ev('return await __DL.styles();'); if (result.styles && result.styles.E) throw new Error('styles: ' + result.styles.E); console.log('styles', Object.keys(result.styles).length); }
  if (ONLY.includes('lines')) { result.lines = await g.ev('return await __DL.lines();'); if (result.lines && result.lines.E) throw new Error('lines: ' + result.lines.E); console.log('lines', Object.keys(result.lines).length); }
  if (ONLY.includes('states')) for (const s of inst.states) {
    const t = Date.now();
    const o = await g.ev(`return await __DL.state(${JSON.stringify(s)}, ${JSON.stringify(GRIDS)});`);
    if (!o || o.E) throw new Error('state ' + s + ': ' + JSON.stringify(o));
    result.states[s] = o;
    console.log('state', s, GRIDS.map((gr) => gr + ':' + o[gr].digest + (o[gr].repeat ? '' : ' (NOT REPEATABLE)')).join(' '), ((Date.now() - t) / 1000).toFixed(1) + ' s');
  }
  result.pageErrors = await g.ev('return (window.__e || []).slice(0, 10);');
} catch (e) { failed = String(e && e.stack || e); }
finally { await g.close(); }
if (failed) { console.error('DIGEST LOCK: the run failed —', failed); process.exit(3); }

/* ── compare / write ─────────────────────────────────────────────────────────────────────────────────────── */
const sortKeys = (v) => Array.isArray(v) ? v.map(sortKeys) : (v && typeof v === 'object') ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])])) : v;
const leaves = (o, pre = '', acc = {}) => { if (o && typeof o === 'object' && !Array.isArray(o)) { for (const k of Object.keys(o)) leaves(o[k], pre ? pre + '.' + k : k, acc); } else acc[pre] = JSON.stringify(o); return acc; };
const unrepeatable = [];
for (const [s, o] of Object.entries(result.states)) for (const [gr, e] of Object.entries(o)) if (!e.repeat) unrepeatable.push(s + '@' + gr);
if (MODE === 'write') {
  fs.writeFileSync(FIXTURE, JSON.stringify(sortKeys(result), null, 1) + '\n');
  const n = Object.keys(leaves({ states: result.states, styles: result.styles, lines: result.lines })).length;
  console.log(`DIGEST LOCK written: ${FIXTURE} · ${n} values · ${Object.keys(result.states).length} states × ${GRIDS.length} grids · ${result.styles ? Object.keys(result.styles).length : 0} style rows · ${result.lines ? Object.keys(result.lines).length : 0} line rows · unrepeatable: ${unrepeatable.length ? unrepeatable.join(', ') : 'none'} · page errors ${result.pageErrors.length} · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  process.exit(0);
}
const fixture = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
const pick = (r) => { const o = {}; if (ONLY.includes('states')) { o.states = {}; for (const [s, v] of Object.entries(r.states || {})) { o.states[s] = {}; for (const gr of GRIDS) if (v[gr]) o.states[s][gr] = v[gr]; } } if (ONLY.includes('styles')) o.styles = r.styles; if (ONLY.includes('lines')) o.lines = r.lines; return o; };
const A = leaves(pick(fixture)), B = leaves(pick(result));
const diffs = [];
for (const k of new Set([...Object.keys(A), ...Object.keys(B)])) if (A[k] !== B[k]) diffs.push({ k, base: A[k], now: B[k] });
const same = (x, y) => JSON.stringify(sortKeys(x)) === JSON.stringify(sortKeys(y));          // the fixture is written key-sorted
const metaDiff = ['obs', 'canvas', 'dpr', 'format', 'gamut', 'theme', 'lightUI'].filter((k) => !same(fixture.meta && fixture.meta[k], result.meta[k]));
const adapterSame = same(fixture.meta && fixture.meta.adapter, result.meta.adapter);
/* a difference in `pack`/`count` alone (the CPU record bytes) is reported apart from the GPU readbacks: K7 changes it by design */
const gpu = diffs.filter((x) => !/\.pack$|\.count$/.test(x.k)), cpu = diffs.filter((x) => /\.pack$|\.count$/.test(x.k));
for (const x of diffs.slice(0, 60)) console.log('DIFF', x.k, 'base', x.base, 'now', x.now);
if (metaDiff.length) console.log('META DIFFERS (inputs, not outputs):', metaDiff.join(', '));
if (!adapterSame) console.log('ADAPTER DIFFERS: the fixture is machine-specific', JSON.stringify(fixture.meta && fixture.meta.adapter), JSON.stringify(result.meta.adapter));
console.log(`DIGEST LOCK ${diffs.length || metaDiff.length ? 'RED' : 'GREEN'}: ${Object.keys(A).length} values compared · ${gpu.length} readback differences · ${cpu.length} record-byte differences · unrepeatable now: ${unrepeatable.length ? unrepeatable.join(', ') : 'none'} · page errors ${result.pageErrors.length} · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
process.exit(diffs.length || metaDiff.length ? 1 : 0);
