// F probe: gas.fieldModes(t) / gas.stats(t) cost and allocation at 256 modes, vs an in-probe reuse variant (NOT in lab/).
//   node --expose-gc research/optimization-2026-09-24/probes/F/gas-fieldmodes.mjs [calls]
import { createGas } from '../../../../lab/gas.js';
import { packModes } from '../../../../lab/field.js';
const gas = createGas(10);
const L = gas.launch(-5, 2.5, 0.8, 0);            // a narrow fast axial packet (what the BOX bow launches): every mode populated
const t = 3.7;
const nOut = gas.fieldModes(t).length;
const N = +(process.argv[2] || 1000);
const time = (f, n) => { for (let i = 0; i < Math.min(200, n); i++) f(i); const t0 = performance.now(); for (let i = 0; i < n; i++) f(i); return (performance.now() - t0) / n; };
// 1) fieldModes: time per call
const msFieldModes = time((i) => gas.fieldModes(t + i * 1e-3), N);
// 2) bytes per call (heapUsed growth while every result is kept alive; young-gen estimate)
globalThis.gc(); let h0 = process.memoryUsage().heapUsed;
let keep = []; for (let i = 0; i < 200; i++) keep.push(gas.fieldModes(t + i * 1e-3));
const bytesFieldModes = (process.memoryUsage().heapUsed - h0) / 200; keep = [];
globalThis.gc(); h0 = process.memoryUsage().heapUsed;
for (let i = 0; i < 200; i++) keep.push(gas.at(t + i * 1e-3));
const bytesAt = (process.memoryUsage().heapUsed - h0) / 200; keep = [];
// 3) a reuse variant built OUTSIDE lab/: persistent records + tables, same numbers
const modes = gas.modes, A = gas.radius;
const recs = modes.map((M) => ({ table: { n: 1, l: M.l, am: 0, m: 0, norm: M.rnorm * M.anorm, lag: Float64Array.from([M.k, A, 1, 0, 0, 0]), leg: new Float64Array(6), space: 'gas' }, re: 0, im: 0 }));
const list = [], cre = new Float64Array(modes.length), cim = new Float64Array(modes.length);
let re0 = null, im0 = null, t00 = 0;
{ const c0 = gas.at(0); re0 = Float64Array.from(c0.re); im0 = Float64Array.from(c0.im); t00 = 0; }
function atInto(tt) { for (let m = 0; m < modes.length; m++) { const ph = -modes[m].E * (tt - t00), c = Math.cos(ph), s = Math.sin(ph); cre[m] = re0[m] * c - im0[m] * s; cim[m] = re0[m] * s + im0[m] * c; } }
function fieldModesReuse(tt) {
  const c = gas.at(tt); list.length = 0;
  for (let m = 0; m < modes.length; m++) { if (Math.abs(c.re[m]) < 1e-7 && Math.abs(c.im[m]) < 1e-7) continue; const r = recs[m]; r.re = c.re[m]; r.im = c.im[m]; list.push(r); }
  return list;
}
const msReuse = time((i) => fieldModesReuse(t + i * 1e-3), N);
// 4) neutrality: packModes bytes identical over many t
let same = true, compared = 0;
for (let i = 0; i < 64; i++) {
  const tt = t + i * 0.37;
  const a = Float32Array.from(packModes(gas.fieldModes(tt)).buf.subarray(0, nOut * 28));
  const b = packModes(fieldModesReuse(tt)).buf.subarray(0, nOut * 28);
  for (let j = 0; j < a.length; j++) { compared++; if (!Object.is(a[j], b[j])) { same = false; break; } }
}
// 5) packModes cost at 256 modes (every reconstruct)
const ml = gas.fieldModes(t);
const msPack = time(() => packModes(ml), N);
// 6) gas.stats(t) — the SPECTRUM window's gasRo readout (rack.js loop, every 6th CPU tick while the window can present)
const msStats = time((i) => gas.stats(t + i * 1e-3), 50);
// 7) gas.launch — the axial bow / enterBox (synchronous, on the pointer)
const msLaunch = time(() => gas.launch(-5, 2.5, 0.8, 0), 5);
console.log(JSON.stringify({ modesRendered: nOut, captured: +L.captured.toFixed(4), calls: N,
  fieldModesMs: +msFieldModes.toFixed(4), fieldModesBytes: Math.round(bytesFieldModes), atBytes: Math.round(bytesAt), objectsPerCall: 4 + nOut * 4,
  reuseVariantMs: +msReuse.toFixed(4), packModesMs: +msPack.toFixed(4), packBytesIdentical: same, floatsCompared: compared,
  gasStatsMs: +msStats.toFixed(3), gasLaunchMs: +msLaunch.toFixed(1) }));
