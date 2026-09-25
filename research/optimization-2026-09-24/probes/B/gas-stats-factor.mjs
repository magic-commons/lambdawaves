// Lane B probe: gas.stats(t) is O(grid × 256) = 100 × 80 × 256 ≈ 2.05 M mul-adds per call. The sum over modes
// separates by l: ψ(i,j) = Σ_l P_l(j) · A_l(i),  A_l(i) = Σ_nr c_{l,nr} R_{l,nr}(i)  → 16× fewer mul-adds.
// This measures the cost and how far (in ulps and in the printed toFixed(2)) the reassociated sum moves.
// Run: node research/optimization-2026-09-24/probes/B/gas-stats-factor.mjs
import { createGas } from '../../../../lab/gas.js';
const gas = createGas(10);
gas.launch(0, 3, 0.8, 0);
const NRQ = 200, NTQ = 160, A = gas.radius, M = gas.modes, NM = M.length;
// rebuild the quadrature exactly as gas.js does (same expressions, same order)
const r = new Float64Array(NRQ), rw = new Float64Array(NRQ), dr = A / NRQ;
for (let i = 0; i < NRQ; i++) { r[i] = (i + 0.5) * dr; rw[i] = r[i] * r[i] * dr; }
const ct = new Float64Array(NTQ), w = new Float64Array(NTQ), dth = Math.PI / NTQ;
for (let j = 0; j < NTQ; j++) { const th = (j + 0.5) * dth; ct[j] = Math.cos(th); w[j] = Math.sin(th) * dth * 2 * Math.PI; }
// the tables: recover Rt/Pt through the public surface is not possible, so this probe re-derives them the same way
import { sphj, legP, LMAX, NRMAX } from '../../../../lab/gas.js';
const Rt = M.map((m) => { const row = new Float64Array(NRQ); for (let i = 0; i < NRQ; i++) row[i] = m.rnorm * sphj(m.l, m.k * r[i]); return row; });
const Pt = []; for (let l = 0; l <= LMAX; l++) { const row = new Float64Array(NTQ), an = Math.sqrt((2 * l + 1) / (4 * Math.PI)); for (let j = 0; j < NTQ; j++) row[j] = an * legP(l, ct[j]); Pt.push(row); }
function factored(t, stride = 2) {
  const c = gas.at(t); let n = 0, z = 0, z2 = 0, rr = 0;
  const L = LMAX + 1, Ar = new Float64Array(L), Ai = new Float64Array(L);
  for (let i = 0; i < NRQ; i += stride) {
    Ar.fill(0); Ai.fill(0);
    for (let m = 0; m < NM; m++) { const v = Rt[m][i]; if (v === 0) continue; const l = M[m].l; Ar[l] += c.re[m] * v; Ai[l] += c.im[m] * v; }
    for (let j = 0; j < NTQ; j += stride) {
      let pr = 0, pi = 0;
      for (let l = 0; l < L; l++) { const p = Pt[l][j]; pr += Ar[l] * p; pi += Ai[l] * p; }
      const d = (pr * pr + pi * pi) * rw[i] * w[j] * stride * stride, zz = r[i] * ct[j];
      n += d; z += d * zz; z2 += d * zz * zz; rr += d * r[i];
    }
  }
  if (n <= 0) return { norm: 0, z: 0, sz: 0, r: 0 };
  return { norm: n, z: z / n, sz: Math.sqrt(Math.max(0, z2 / n - (z / n) ** 2)), r: rr / n };
}
const T = [0, 0.3, 1, 2.5, 4, 6, 8, 10, 17.3];
let worstRel = 0, printedDiffers = 0; const rows = [];
for (const t of T) {
  const a = gas.stats(t), b = factored(t);
  for (const k of ['norm', 'z', 'sz', 'r']) { const rel = Math.abs(a[k] - b[k]) / Math.max(1e-300, Math.abs(a[k])); worstRel = Math.max(worstRel, rel); }
  rows.push({ t, z: [a.z, b.z], sz: [a.sz, b.sz], norm: [a.norm, b.norm] }); if (a.z.toFixed(2) !== b.z.toFixed(2) || a.sz.toFixed(2) !== b.sz.toFixed(2)) printedDiffers++;
}
const time = (fn, n) => { for (let i = 0; i < 3; i++) fn(0.1 * i); const t0 = performance.now(); for (let i = 0; i < n; i++) fn(0.37 + i * 0.01); return (performance.now() - t0) / n; };
console.log(JSON.stringify({ shippedMs: +time((t) => gas.stats(t), 30).toFixed(3), factoredMs: +time((t) => factored(t), 300).toFixed(3), worstRelativeDiff: worstRel, printedReadoutDiffers: printedDiffers, samples: T.length, rows }, null, 1));
