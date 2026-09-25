// Lane B probe: the axial gas's per-reconstruct allocation and gas.stats cost (node/V8 — an order-of-magnitude read;
// Firefox's SpiderMonkey numbers come from the browser probe). Run: node --expose-gc research/optimization-2026-09-24/probes/B/gas-bench.mjs
import { createGas } from '../../../../lab/gas.js';
import { packModes } from '../../../../lab/field.js';
const gas = createGas(10);
const G = gas.launch(0, 3, 0.8, 0);          // a narrow, fast packet: most of the 256 modes populated
let live = 0; { const c = gas.at(0.3); for (let m = 0; m < 256; m++) if (Math.abs(c.re[m]) >= 1e-7 || Math.abs(c.im[m]) >= 1e-7) live++; }
const heapNow = () => process.memoryUsage().heapUsed;
function bench(name, fn, n = 2000) {
  for (let i = 0; i < 200; i++) fn(i);          // warm
  if (global.gc) global.gc();
  const h0 = heapNow(); const t0 = performance.now();
  for (let i = 0; i < n; i++) fn(i);
  const ms = (performance.now() - t0) / n; const dh = heapNow() - h0;
  return { name, usPerCall: +(ms * 1000).toFixed(2), heapGrowthKBPerCall_lowerBound: +(dh / n / 1024).toFixed(2) };
}
// the shipped road
const shipped = bench('gas.fieldModes (shipped)', (i) => gas.fieldModes(0.3 + i * 1e-3));
const shippedPack = bench('gas.fieldModes + packModes (shipped reconstruct CPU)', (i) => packModes(gas.fieldModes(0.3 + i * 1e-3)));
// the proposed road: records built once per launch (table rows are t-independent), only re/im rewritten per reconstruct
const M = gas.modes, A = gas.radius;
const tables = M.map((Mm) => ({ n: 1, l: Mm.l, am: 0, m: 0, norm: Mm.rnorm * Mm.anorm, lag: Float64Array.from([Mm.k, A, 1, 0, 0, 0]), leg: new Float64Array(6), space: 'gas' }));
const recs = M.map((_, m) => ({ table: tables[m], re: 0, im: 0 })), list = [];
const c0 = gas.at(0), E = M.map((m) => m.E);   // this launch has t0 = 0, so at(0) IS the anchor
function fieldModesReuse(t) {
  list.length = 0;
  for (let m = 0; m < 256; m++) {
    const ph = -E[m] * (t - 0), c = Math.cos(ph), s = Math.sin(ph);
    const r = c0.re[m] * c - c0.im[m] * s, ii = c0.re[m] * s + c0.im[m] * c;
    if (Math.abs(r) < 1e-7 && Math.abs(ii) < 1e-7) continue;
    const R = recs[m]; R.re = r; R.im = ii; list.push(R);
  }
  return list;
}
const reuse = bench('fieldModes (reused records)', (i) => fieldModesReuse(0.3 + i * 1e-3));
const reusePack = bench('fieldModes reused + packModes', (i) => packModes(fieldModesReuse(0.3 + i * 1e-3)));
// equality check: the packed bytes must be identical
const a = packModes(gas.fieldModes(0.7)); const ab = Float32Array.from(a.buf.subarray(0, a.count * 28)), ac = a.count;
const b = packModes(fieldModesReuse(0.7)); let same = ac === b.count; for (let i = 0; same && i < ac * 28; i++) same = Object.is(ab[i], b.buf[i]);
// gas.stats — called every 6th cpu tick while SPECTRUM is visible and the gas is on
const st = bench('gas.stats(t) (stride 2)', (i) => gas.stats(0.3 + i * 1e-3), 40);
console.log(JSON.stringify({ captured: G.captured, liveModes: live, shipped, shippedPack, reuse, reusePack, packedBytesIdentical: same, stats: st }, null, 1));
