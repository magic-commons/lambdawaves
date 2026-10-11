// (c) f32 overflow of ipow(rho,l) and the CPU-side FACT limit for circular Rydberg states |n,n-1,n-1>
// Reads the tree (read-only): lab/hydrogen.js modeTable. Emulates the kernel's f32 evaluation of space 0 with Math.fround.
import { modeTable, radial } from '/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/sos-s0/lab/hydrogen.js';
import fs from 'node:fs';
const f = Math.fround;
function ipow32(x, k) { let r = f(1); for (let i = 0; i < k; i++) r = f(r * x); return r; }
const out = [];
const F32MAX = 3.4028234663852886e38;
for (let n = 8; n <= 32; n++) {
  const l = n - 1, row = { n, l };
  // CPU twin
  let T; try { T = modeTable(n, l, l); } catch (e) { T = null; row.modeTableError = String(e.message || e); }
  row.normF64 = T ? T.norm : null;
  row.normNaN = T ? !Number.isFinite(T.norm) : null;
  // f32 representability of the norm
  row.normF32 = T && Number.isFinite(T.norm) ? f(T.norm) : null;
  row.normUnderflowsF32 = T && Number.isFinite(T.norm) ? (Math.abs(T.norm) < 1.17549435e-38) : null;
  // ipow range: rho = 2r/n; peak of circular state at r = n^2 -> rho = 2n; 99.9% of density out to ~ n^2 + 5*sqrt(n^2*(n^2/(2n+1))...) use r_max = n^2 + 6*n^1.5
  const rhoPeak = 2 * n;
  row.rhoPeak = rhoPeak;
  row.ipowAtPeakF32 = ipow32(f(rhoPeak), l);
  row.ipowAtPeakOverflow = !Number.isFinite(row.ipowAtPeakF32);
  // largest rho for which ipow32 is finite
  row.rhoMaxFinite = Math.pow(F32MAX, 1 / l);
  // radial std of circular state: sigma_r = n^2 sqrt(1/(2n+1)) ~ n^1.5/sqrt2 ; density negligible beyond +6 sigma
  const rPeak = n * n, sig = n * n / Math.sqrt(2 * n + 1);
  row.rhoAt6sigma = 2 * (rPeak + 6 * sig) / n;
  row.overflowWithin6sigma = row.rhoAt6sigma > row.rhoMaxFinite;
  // fraction of radial probability lost to inf in the box where rho>rhoMaxFinite (use f64 radial() oracle if finite)
  out.push(row);
}
const firstPeakOverflow = out.find(r => r.ipowAtPeakOverflow)?.n;
const first6sig = out.find(r => r.overflowWithin6sigma)?.n;
const firstNormNaN = out.find(r => r.normNaN)?.n;
const firstNormUnder = out.find(r => r.normUnderflowsF32)?.n;
// exact: density mass beyond rhoMaxFinite (f64 closed form for circular: u^2 ~ r^(2n) e^{-2r/n})
function lostMass(n) {
  const l = n - 1, rhoM = Math.pow(F32MAX, 1 / l); const rM = rhoM * n / 2;
  // radial density P(r) ∝ r^(2n) e^{-2r/n}: Gamma(2n+1, 2r/n) tail; compute by log-sum numerically
  const a = 2 * n + 1; const x = 2 * rM / n; // upper incomplete gamma ratio Q(a,x)
  let sum = 0, term = 1; // series for P(a,x)
  // use regularized gamma via continued fraction/series in log space
  const lg = (z) => { // Lanczos
    const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    z -= 1; let xx = c[0]; for (let i = 1; i < g + 2; i++) xx += c[i] / (z + i); const t = z + g + 0.5; return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(xx); };
  // Q(a,x) by continued fraction (x > a+1) else 1-P series
  let Q;
  if (x < a + 1) { let ap = a, del = 1 / a, s = del; for (let i = 0; i < 2000; i++) { ap += 1; del *= x / ap; s += del; if (Math.abs(del) < Math.abs(s) * 1e-16) break; } Q = 1 - s * Math.exp(-x + a * Math.log(x) - lg(a)); }
  else { let b = x + 1 - a, c = 1e300, d = 1 / b, h = d; for (let i = 1; i < 2000; i++) { const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300; c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-16) break; } Q = Math.exp(-x + a * Math.log(x) - lg(a)) * h; }
  return Q;
}
for (const r of out) r.massBeyondFiniteIpow = lostMass(r.n);
const summary = { firstNWhereIpowOverflowsAtThePeak: firstPeakOverflow, firstNWhereIpowOverflowsWithin6Sigma: first6sig, firstNWhereCpuNormIsNaN: firstNormNaN, firstNWhereNormUnderflowsF32: firstNormUnder,
  FACT_limit_in_hydrogenjs: 24, note: 'FACT built to 24 (hydrogen.js:31-32); radialNorm needs FACT[n+l] = FACT[2n-1] for a circular state, so n>=14 needs FACT[27]+ -> undefined -> NaN' };
fs.writeFileSync(new URL('./sonnet0-c-f32-circular.json', import.meta.url), JSON.stringify({ summary, rows: out }, null, 1));
console.log(JSON.stringify(summary, null, 1));
for (const r of out.filter(r => [10,12,13,14,16,18,20,22,23,24,25,26,28,30].includes(r.n))) console.log(r.n, 'norm', r.normF64, 'rhoPeak', r.rhoPeak, 'ipow@peak', r.ipowAtPeakF32, 'rhoMaxFinite', r.rhoMaxFinite.toFixed(1), 'rho@6s', r.rhoAt6sigma.toFixed(1), 'massLost', r.massBeyondFiniteIpow.toExponential(2));
