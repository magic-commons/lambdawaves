/* bf-r6-audit3.mjs — Round 6 audit, part 3: envelopeI's exponent cancellation, the census's
 * middle-mode window, applyRotateK exactness, vortexPoints root matching. */
import { envelopeI, peakLaw, stretchedCensus, applyRotateK, applyDefectWait, shellMatrix, schmidt,
  kzElement, vortexPoints, coaxialPolynomial, polyRoots, symEig } from '../../lab/frontier.js';
import { radial, ylm, stateOf, BASIS, energy } from '../../lab/hydrogen.js';
const out = (s) => console.log(s); const J = (o) => JSON.stringify(o); const PI = Math.PI;

/* ═══ 1 · envelopeI: three O(1/β²) terms whose sum is O(1) ═══════════════ */
out('### 1  envelopeI exponent cancellation at small β  (α = 0)');
out('    β        α/(6β)+1/(108β²)   ζ(z*)        |I|          predicted rel err  δα* law 2e-9/β   observed δα*');
for (const b of [1e-5, 3e-5, 1e-4, 3e-4, 1e-3, 3e-3, 1e-2, 1e-1]) {
  const c = Math.cbrt(3 * b), alpha = 0, z = (alpha + 1 / (12 * b)) / c;
  const ex = alpha / (6 * b) + 1 / (108 * b * b), zeta = (2 / 3) * Math.pow(z, 1.5);
  const p = peakLaw(b);
  out('  ' + String(b).padEnd(8) + '  ' + ex.toExponential(6) + '  ' + zeta.toExponential(6) + '  ' +
      envelopeI(0, b).toFixed(9) + '  ' + (2.22e-16 * Math.max(ex, zeta)).toExponential(2) + '        ' +
      (2e-9 / b).toExponential(2) + '     ' + Math.abs(p.alphaStar - p.alphaStarNum).toExponential(2));
}

/* ═══ 2 · the census's blind spot is the MIDDLE mode's radial nodes ══════ */
out('\n### 2  stretchedCensus: the dominance window collapses onto the nodes of the MIDDLE mode Â₀');
const sig = (l, m) => ylm(l, m, PI / 2, 0).re;
{
  const aP = (r) => radial(3, 2, r) * sig(2, 2), aZ = (r) => radial(4, 1, r) * sig(1, 1), aN = (r) => radial(5, 0, r) * sig(0, 0);
  const zn = []; { let pr = 0.02, pv = radial(4, 1, pr); for (let r = 0.03; r < 60; r += 1e-4) { const v = radial(4, 1, r); if (pv * v < 0) { let a = pr, b = r, fa = pv; for (let k = 0; k < 60; k++) { const m = (a + b) / 2, fm = radial(4, 1, m); if (fa * fm <= 0) b = m; else { a = m; fa = fm; } } zn.push((a + b) / 2); } pv = v; pr = r; } }
  out('  radial nodes of the MIDDLE mode 4p₊₁: ' + J(zn.map((x) => +x.toFixed(6))) + '   (the instrument scans finely only around the nodes of 3d and 5s: [1.855, 6.425, 14.325, 27.385])');
  out('\n   c₀      window half-widths δr at the two 4p nodes    instrument roots  instr count   TRUTH roots  truth count');
  for (const c0 of [30, 100, 300, 1000, 3000, 1e4, 3e4, 7.6241394354e4, 3e5]) {
    const cm = 3.7179689892;
    const Phi = (r) => (c0 * aZ(r)) ** 2 - 4 * Math.abs(aP(r) * cm * aN(r));
    const xi = (r) => Math.abs(c0 * aZ(r)) / (2 * Math.abs(aP(r)));
    const truth = []; let pr = 0.01, pv = Phi(pr);
    for (let r = 0.01 + 1e-6; r < 60; r += 1e-6) { const v = Phi(r); if (pv * v < 0) { let a = pr, b = r, fa = pv; for (let k = 0; k < 60; k++) { const m2 = (a + b) / 2, fm = Phi(m2); if (fa * fm <= 0) b = m2; else { a = m2; fa = fm; } } truth.push((a + b) / 2); } pv = v; pr = r; }
    const tAdm = truth.filter((r) => xi(r) <= 1);
    const c = stretchedCensus([{ n: 3, l: 2, m: 2, re: 1, im: 0 }, { n: 4, l: 1, m: 1, re: c0, im: 0 }, { n: 5, l: 0, m: 0, re: cm, im: 0 }], 60);
    const halves = zn.map((z0) => { const cand = truth.filter((r) => Math.abs(r - z0) < 0.5); return cand.length === 2 ? +(cand[1] - cand[0]).toExponential(2) : null; });
    out('  ' + String(c0).padEnd(10) + J(halves).padEnd(28) + '  ' + String(c.roots.length).padStart(3) + '  ' + String(c.count).padStart(9) +
        '     ' + String(truth.length).padStart(3) + '  ' + String(2 * tAdm.length).padStart(9) + (c.count !== 2 * tAdm.length ? '   <<< WRONG' : ''));
  }
}

/* ═══ 3 · applyRotateK: exactness and the group law ══════════════════════ */
out('\n### 3  applyRotateK: unitarity, the one-parameter group law, and Schmidt invariance');
{
  let seed = 11; const rnd = () => { seed = (seed * 1103515245 + 12345) >>> 0; return seed / 4294967296 - 0.5; };
  const re = new Float64Array(91), im = new Float64Array(91);
  for (let i = 0; i < 91; i++) { re[i] = rnd(); im[i] = rnd(); }
  let nn = 0; for (let i = 0; i < 91; i++) nn += re[i] ** 2 + im[i] ** 2; nn = Math.sqrt(nn);
  for (let i = 0; i < 91; i++) { re[i] /= nn; im[i] /= nn; }
  const s0 = [2, 3, 4, 5, 6].map((n) => schmidt(shellMatrix(re, im, n)).values.slice());
  // group law: R(0.7)R(1.3) vs R(2.0)
  const a1 = Float64Array.from(re), b1 = Float64Array.from(im);
  applyRotateK(a1, b1, 0.7); applyRotateK(a1, b1, 1.3);
  const a2 = Float64Array.from(re), b2 = Float64Array.from(im);
  applyRotateK(a2, b2, 2.0);
  let dg = 0; for (let i = 0; i < 91; i++) dg = Math.max(dg, Math.hypot(a1[i] - a2[i], b1[i] - b2[i]));
  let n2 = 0; for (let i = 0; i < 91; i++) n2 += a2[i] ** 2 + b2[i] ** 2;
  // inverse
  const a3 = Float64Array.from(a2), b3 = Float64Array.from(b2); applyRotateK(a3, b3, -2.0);
  let di = 0; for (let i = 0; i < 91; i++) di = Math.max(di, Math.hypot(a3[i] - re[i], b3[i] - im[i]));
  const s1 = [2, 3, 4, 5, 6].map((n) => schmidt(shellMatrix(a2, b2, n)).values.slice());
  let ds = 0; for (let k = 0; k < 5; k++) for (let i = 0; i < s0[k].length; i++) ds = Math.max(ds, Math.abs(s0[k][i] - s1[k][i]));
  out('  group law  |R(0.7)R(1.3) − R(2.0)| = ' + dg.toExponential(3));
  out('  norm after R(2.0)  = ' + n2.toFixed(16) + '   (unitary ⇒ 1)');
  out('  |R(−2.0)R(2.0) − 1| = ' + di.toExponential(3));
  out('  Schmidt spectra invariant under K_z to ' + ds.toExponential(3) + '   (SO(4) rotation ⇒ 0)');
  const a4 = Float64Array.from(re), b4 = Float64Array.from(im); applyDefectWait(a4, b4, 0.3);
  const s2 = [2, 3, 4, 5, 6].map((n) => schmidt(shellMatrix(a4, b4, n)).values.slice());
  let dw = 0; for (let k = 0; k < 5; k++) for (let i = 0; i < s0[k].length; i++) dw = Math.max(dw, Math.abs(s0[k][i] - s2[k][i]));
  out('  Schmidt spectra CHANGED by the DEFECT WAIT by ' + dw.toExponential(3) + '   (not SO(4) ⇒ > 0)');
  // large theta: does the eigen-route stay unitary?
  const a5 = Float64Array.from(re), b5 = Float64Array.from(im); applyRotateK(a5, b5, 1e6);
  let n5 = 0; for (let i = 0; i < 91; i++) n5 += a5[i] ** 2 + b5[i] ** 2;
  out('  norm after R(1e6) = ' + n5.toFixed(16));
}

/* ═══ 4 · vortexPoints: does the drawing converge as the θ sampling refines? ═══ */
out('\n### 4  vortexPoints on the certified four-mode state (3d₊₂+4p₊₁+5s+6p₋₁)/2, at t just off the event');
{
  const ids = [stateOf(3, 2, 2).index, stateOf(4, 1, 1).index, stateOf(5, 0, 0).index, stateOf(6, 1, -1).index];
  for (const t of [0, 113.5265785166, 113.6]) {
    const re = new Float64Array(91), im = new Float64Array(91);
    for (const a of ids) { const s = BASIS[a], ph = -energy(s.n) * t; re[a] = 0.5 * Math.cos(ph); im[a] = 0.5 * Math.sin(ph); }
    const counts = [];
    for (const nth of [48, 96, 192, 384]) counts.push(vortexPoints(re, im, ids, { nr: 20, nth, rMin: 0.5, rMax: 20 }).points.length);
    out('  t=' + String(t).padEnd(16) + ' points at nθ = 48,96,192,384: ' + J(counts));
  }
  // the matching tolerance: how close do two distinct roots of the coaxial cubic come?
  const re = new Float64Array(91), im = new Float64Array(91);
  for (const a of ids) { const s = BASIS[a], ph = -energy(s.n) * 113.5265785166; re[a] = 0.5 * Math.cos(ph); im[a] = 0.5 * Math.sin(ph); }
  let minsep = Infinity, at = null;
  for (let ir = 0; ir < 40; ir++) { const r = 0.5 + 19.5 * (ir + 0.5) / 40;
    for (let it = 0; it <= 96; it++) { const th = 1e-3 + (PI - 2e-3) * it / 96;
      const P = coaxialPolynomial(re, im, ids, r, th); if (P.mmax <= P.mmin) continue;
      const rt = polyRoots(P.coeffs);
      for (let i = 0; i < rt.length; i++) for (let k = i + 1; k < rt.length; k++) { const d = Math.hypot(rt[i].re - rt[k].re, rt[i].im - rt[k].im); if (d < minsep) { minsep = d; at = [+r.toFixed(3), +th.toFixed(4)]; } }
    } }
  out('  closest pair of distinct coaxial roots over the scanned grid: ' + minsep.toExponential(3) + ' at (r,θ) = ' + J(at) + '   (matcher tolerance is 0.6)');
}
