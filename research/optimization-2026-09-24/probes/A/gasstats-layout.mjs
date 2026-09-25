/* gasstats-layout.mjs — lane B's FB1 / lane F's F11 (gas.stats 8–17 ms on the frame thread): is there a BIT-IDENTICAL
 * speed-up, i.e. the same multiplications and additions in the same order, only with a cache-friendly memory layout?
 * Shipped: for each (i, j): for m: v = Rt[m][i]·Pt[l_m][j]; skip v === 0; pr += re_m·v; pi += im_m·v  — Rt[m][i] strides
 * across 256 separate Float64Arrays and Pt[modes[m].l] is a property chase per term.  The variant reads Rt from one
 * transposed Float64Array RtT[i·256 + m] and l_m from an Int32Array; every term and every partial sum is unchanged.
 * The probe first proves its copy of the shipped stats() equals gas.stats() with Object.is, then compares.
 *   node research/optimization-2026-09-24/probes/A/gasstats-layout.mjs */
import { createGas, sphj, legP } from '../../../../lab/gas.js';
import fs from 'node:fs';
const A = 10, NRQ = 200, NTQ = 160;
const gas = createGas(A);
gas.launch(-5, 2, 0.8, 0);
const M = gas.modes, N = M.length;
/* build()'s grids and tables, the same expressions */
const r = new Float64Array(NRQ), rw = new Float64Array(NRQ), dr = A / NRQ;
for (let i = 0; i < NRQ; i++) { r[i] = (i + 0.5) * dr; rw[i] = r[i] * r[i] * dr; }
const ct = new Float64Array(NTQ), w = new Float64Array(NTQ), dth = Math.PI / NTQ;
for (let j = 0; j < NTQ; j++) { const th = (j + 0.5) * dth; ct[j] = Math.cos(th); w[j] = Math.sin(th) * dth * 2 * Math.PI; }
const Rt = M.map((m) => { const row = new Float64Array(NRQ); for (let i = 0; i < NRQ; i++) row[i] = m.rnorm * sphj(m.l, m.k * r[i]); return row; });
const Pt = []; for (let l = 0; l <= 15; l++) { const row = new Float64Array(NTQ); const an = Math.sqrt((2 * l + 1) / (4 * Math.PI)); for (let j = 0; j < NTQ; j++) row[j] = an * legP(l, ct[j]); Pt.push(row); }
function statsShipped(t, stride = 2) {
  const c = gas.at(t); let n = 0, z = 0, z2 = 0, rr = 0;
  for (let i = 0; i < NRQ; i += stride) for (let j = 0; j < NTQ; j += stride) {
    let pr = 0, pi = 0;
    for (let m = 0; m < N; m++) { const v = Rt[m][i] * Pt[M[m].l][j]; if (v === 0) continue; pr += c.re[m] * v; pi += c.im[m] * v; }
    const d = (pr * pr + pi * pi) * rw[i] * w[j] * stride * stride, zz = r[i] * ct[j];
    n += d; z += d * zz; z2 += d * zz * zz; rr += d * r[i];
  }
  if (n <= 0) return { norm: 0, z: 0, sz: 0, r: 0 };
  return { norm: n, z: z / n, sz: Math.sqrt(Math.max(0, z2 / n - (z / n) ** 2)), r: rr / n };
}
/* the transposed layout */
const RtT = new Float64Array(NRQ * N); for (let m = 0; m < N; m++) for (let i = 0; i < NRQ; i++) RtT[i * N + m] = Rt[m][i];
const PtT = new Float64Array(NTQ * 16); for (let l = 0; l < 16; l++) for (let j = 0; j < NTQ; j++) PtT[j * 16 + l] = Pt[l][j];
const Lm = new Int32Array(N); for (let m = 0; m < N; m++) Lm[m] = M[m].l;
const cre = new Float64Array(N), cim = new Float64Array(N);
function statsLayout(t, stride = 2) {
  const c = gas.at(t); cre.set(c.re); cim.set(c.im); let n = 0, z = 0, z2 = 0, rr = 0;
  for (let i = 0; i < NRQ; i += stride) { const ro = i * N;
    for (let j = 0; j < NTQ; j += stride) { const po = j * 16;
      let pr = 0, pi = 0;
      for (let m = 0; m < N; m++) { const v = RtT[ro + m] * PtT[po + Lm[m]]; if (v === 0) continue; pr += cre[m] * v; pi += cim[m] * v; }
      const d = (pr * pr + pi * pi) * rw[i] * w[j] * stride * stride, zz = r[i] * ct[j];
      n += d; z += d * zz; z2 += d * zz * zz; rr += d * r[i];
    } }
  if (n <= 0) return { norm: 0, z: 0, sz: 0, r: 0 };
  return { norm: n, z: z / n, sz: Math.sqrt(Math.max(0, z2 / n - (z / n) ** 2)), r: rr / n };
}
const same = (a, b) => ['norm', 'z', 'sz', 'r'].every((k) => Object.is(a[k], b[k]));
const times = [0, 0.37, 1, 2.5, 4, 6, 8, 10, 13.7];
const out = { copyMatchesGasStats: times.every((t) => same(statsShipped(t), gas.stats(t))), layoutBitIdentical: times.every((t) => same(statsShipped(t), statsLayout(t))) };
const bench = (f) => { for (let k = 0; k < 5; k++) f(1.3); const a = []; for (let k = 0; k < 15; k++) { const t0 = performance.now(); f(1.3 + k * 0.01); a.push(performance.now() - t0); } a.sort((x, y) => x - y); return +a[7].toFixed(2); };
out.gasStatsMs = bench((t) => gas.stats(t)); out.shippedCopyMs = bench(statsShipped); out.layoutMs = bench(statsLayout);
out.speedup = +(out.gasStatsMs / out.layoutMs).toFixed(2);
console.log(JSON.stringify(out));
fs.writeFileSync(new URL('./gasstats-layout.out.json', import.meta.url), JSON.stringify(out, null, 1));
