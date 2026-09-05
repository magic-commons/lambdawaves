/* tests/wigner.test.mjs — the node proof of the WIGNER SLICE.
 *   node tests/wigner.test.mjs
 * Oracles, all independent of lab/wigner.js's quadrature:
 *   (a) Praxmeyer–Mostowski–Wódkiewicz's one-dimensional generator for the 1s (Sol Q6, research/probes-fields/
 *       sol-wigner.py) — a completely different representation of the same function;
 *   (b) the two closed-form 1-D reductions of the slice, derived in the module header;
 *   (c) lab/hydrogen.js's psiAt (recurrence evaluator) and lab/momentum.js's phiAt, by direct 2-D quadrature;
 *   (d) the module's own off-axis path, which does the azimuth by trapezoid on lab/hydrogen.js's modeTable
 *       evaluator — an independent test of the analytic-azimuth selection rule δ_{m_a m_b} (−1)^m.
 */
import { wignerSlice, wignerAxial, wignerAt, sliceMomentumMarginal, gaussLegendre, gaussLaguerre, ONE_S } from '../lab/wigner.js';
import { BASIS, psiAt } from '../lab/hydrogen.js';
import { phiAt } from '../lab/momentum.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 400)));
}
const T0 = Date.now();
const idx = (n, l, m) => BASIS.findIndex((s) => s.n === n && s.l === l && s.m === m);
const S1S = [{ a: idx(1, 0, 0), re: 1, im: 0 }];
const S2PZ = [{ a: idx(2, 1, 0), re: 1, im: 0 }];
const MIX = [{ a: idx(1, 0, 0), re: Math.SQRT1_2, im: 0 }, { a: idx(2, 1, 0), re: Math.SQRT1_2, im: 0 }];
const THREE = [{ a: idx(1, 0, 0), re: 0.6, im: 0 }, { a: idx(2, 1, 0), re: 0.5, im: 0.2 }, { a: idx(3, 2, 0), re: 0.3, im: -0.4 }];
const PI = Math.PI;
/** a composite Gauss–Legendre rule: `npan` panels of order `q` on [a, b].  Every integrand below has a kink at the
 *  origin (|z| in the chord, the cusp of the slice) and a width of order 1 inside a range of tens: a SINGLE Gauss
 *  panel over the whole range gets 3 digits, panels get 12.  The breakpoint is always put on the kink. */
function panelInt(f, a, b, npan, q) {
  const G = gaussLegendre(q), h = (b - a) / npan; let s = 0;
  for (let k = 0; k < npan; k++) { const c = a + h * (k + 0.5);
    for (let i = 0; i < q; i++) s += (h / 2) * G.w[i] * f(c + (h / 2) * G.x[i]); }
  return s;
}

/* (a) the independent 1s oracle: W = (2/π³)∫₀¹ du u(1−u) e^{−2rC}(4r²/C³ + 6r/C⁴ + 3/C⁵) cos(2rpμ(2u−1)), C = √(1+4u(1−u)p²) */
function oracle1s(r, p, mu, N = 240) {
  const { x, w } = gaussLegendre(N); let s = 0;
  for (let i = 0; i < N; i++) {
    const u = (x[i] + 1) / 2, ww = w[i] / 2, C = Math.sqrt(1 + 4 * u * (1 - u) * p * p);
    s += ww * u * (1 - u) * Math.exp(-2 * r * C) * (4 * r * r / C ** 3 + 6 * r / C ** 4 + 3 / C ** 5) * Math.cos(2 * r * p * mu * (2 * u - 1));
  }
  return 2 / PI ** 3 * s;
}

{ /* the quadrature machinery itself */
  const G = gaussLegendre(8); let a = 0; for (let i = 0; i < 8; i++) a += G.w[i] * Math.exp(G.x[i]);
  const L = gaussLaguerre(24); let b = 0, c = 0;
  for (let i = 0; i < 24; i++) { b += L.w[i] * L.t[i] ** 5; c += L.we[i] * Math.exp(-3 * L.t[i]); }
  judge('THE RULES: Gauss–Legendre(8) on e^x, Gauss–Laguerre(24) on t⁵e^{−t} = 120 and on the weight-divided form of e^{−3t} = 1/3 — all to 1e-13',
    Math.abs(a - (Math.E - 1 / Math.E)) < 1e-13 && Math.abs(b - 120) < 1e-10 && Math.abs(c - 1 / 3) < 1e-13,
    { legendre: a, laguerre5: b, divided: c });
}
{ /* THE PEAK */
  const w0 = wignerAxial(S1S, 0, 0, { order: 'fine' }), exact = 1 / PI ** 3;
  judge('THE PEAK: W_1s(0, 0) = 1/π³ = 0.032251534433 to 1e-7 (this is the maximum of W_1s, and 1/π³ is its exact value)',
    Math.abs(w0 - exact) < 1e-7, { W: w0, exact, err: w0 - exact });
}
{ /* the module against the independent generator, over a grid that covers the drawn slice */
  let mx = 0, at = null;
  for (const z of [0, 0.2, 0.5, 1, 1.33, 2, 3, 4, 6, 8, -0.5, -2, -5]) for (const p of [0, 0.3, 1, 1.379, 2, 3, 4, -1, -2.5, -4]) {
    const a = wignerAxial(S1S, z, p, { order: 'fine' });
    const b = oracle1s(Math.abs(z), Math.abs(p), (z * p) >= 0 ? 1 : -1);
    if (Math.abs(a - b) > mx) { mx = Math.abs(a - b); at = [z, p]; }
  }
  judge('THE SAME FUNCTION TWICE: over 130 points of the slice (|z| ≤ 8, |p| ≤ 4) the chord quadrature and Praxmeyer\'s 1-D generator agree to 1e-8 absolute — two representations, no shared code',
    mx < 1e-8, { maxAbsErr: mx, at });
}
{ /* THE MINIMUM — a fine local search on the slice */
  let best = { v: Infinity, z: 0, p: 0 };
  for (let i = 0; i <= 20; i++) for (let j = 0; j <= 20; j++) {
    const z = 1.1 + 0.5 * i / 20, p = 1.15 + 0.5 * j / 20, v = wignerAxial(S1S, z, p, { order: 'normal' });
    if (v < best.v) best = { v, z, p };
  }
  let { z, p } = best, h = 0.02;
  best.v = wignerAxial(S1S, z, p, { order: 'fine' });
  for (let it = 0; it < 200 && h > 1e-7; it++) {
    let moved = false;
    for (const [dz, dp] of [[h, 0], [-h, 0], [0, h], [0, -h], [h, h], [-h, -h], [h, -h], [-h, h]]) {
      const v = wignerAxial(S1S, z + dz, p + dp, { order: 'fine' });
      if (v < best.v) { best = { v, z: z + dz, p: p + dp }; z += dz; p += dp; moved = true; break; }
    }
    if (!moved) h /= 2;
  }
  const dz = Math.abs(best.z - ONE_S.minAt[0]), dp = Math.abs(best.p - ONE_S.minAt[1]);
  judge('THE MINIMUM: W_1s is NEGATIVE, and its deepest point on the slice is −3.09725752e-4 at (z, p_z) = (1.3295, 1.3791) — value to 1e-7, location to 3e-3, found by a fine local search (both labs of the round: Sol Q6, Opus Q6)',
    Math.abs(best.v - ONE_S.min) < 1e-7 && dz < 3e-3 && dp < 3e-3,
    { W: best.v, ledger: ONE_S.min, dValue: best.v - ONE_S.min, z: best.z, p: best.p, dz, dp, depthPercentOfPeak: 100 * Math.abs(best.v) * PI ** 3 });
}
{ /* the ledger's angular row, through the OFF-AXIS path */
  const [r, p] = ONE_S.minAt, row = [7.76005, 6.40547, 3.02567, -0.714457, -3.09726];
  const got = [0, 0.25, 0.5, 0.75, 1].map((mu) => {
    const th = Math.acos(mu);
    return mu === 1 ? wignerAxial(S1S, r, p, { order: 'fine' })
                    : wignerAt(S1S, [0, 0, r], [p * Math.sin(th), 0, p * Math.cos(th)], { order: 'fine', nphi: 80 });
  });
  const ok = got.every((v, i) => Math.abs(v * 1e4 - row[i]) < 1e-5) && got.every((v, i) => Math.abs(v - oracle1s(r, p, [0, 0.25, 0.5, 0.75, 1][i])) < 1e-9);
  judge('THE SIGN IS SET BY r·p: at the minimum\'s (r, p) the off-axis W for cos(r,p) = 0, ¼, ½, ¾, 1 is (+7.76005, +6.40547, +3.02567, −0.714457, −3.09726)×10⁻⁴ — the ledger\'s row, reproduced to 1e-9 by the φ-trapezoid path',
    ok, { got: got.map((v) => +(v * 1e4).toFixed(6)), ledger: row });
}
{ /* NOT A MARGINAL */
  const g = (z) => sliceMomentumMarginal(S1S, z, { order: 'fine' });   // ∫∫, by the exact 1-D reduction, split at the kink
  const tot = panelInt(g, -24, 0, 24, 16) + panelInt(g, 0, 24, 24, 16);
  judge('NOT A MARGINAL, AND THE NUMBER THAT PROVES IT: ∫∫ W_1s(z, p_z) dz dp_z = 1/π² = 0.1013212, NOT 1 — the slice is a cut through a 6-D density, never a probability distribution on the plane it is drawn on',
    Math.abs(tot - 1 / (PI * PI)) < 1e-9 && Math.abs(tot - 1) > 0.8, { integral: tot, exact: 1 / (PI * PI), err: tot - 1 / (PI * PI) });
}
{ /* reduction 1: the p_z integral, in closed form and by a coarse p-grid of the drawn slice */
  let mx = 0;
  for (const z of [0, 0.3, 0.7, 1, 2, 4, 7]) mx = Math.max(mx, Math.abs(sliceMomentumMarginal(S1S, z, { order: 'fine' }) - ONE_S.momentumMarginal(z)));
  /* the same by integrating the SLICE VALUES over p on a coarse grid (what the window actually holds) */
  const coarse = 2 * panelInt((p) => wignerAxial(S1S, 1, p, { order: 'normal' }), 0, 40, 40, 12);   // W_1s is even in p
  judge('REDUCTION 1 (the certifiable marginal law): ∫W_1s(z, p_z) dp_z = e^{−2|z|}(1 + 2|z|)/(2π²) exactly — the p_z integral collapses the chord to s_z = 0 — held to 1e-12 at seven z, and recovered to 1e-6 at z = 1 by summing the drawn slice over a coarse p grid',
    mx < 1e-12 && Math.abs(coarse - ONE_S.momentumMarginal(1)) < 1e-6,
    { maxClosedFormErr: mx, atZ1: coarse, exact: ONE_S.momentumMarginal(1), err: coarse - ONE_S.momentumMarginal(1) });
}
{ /* reduction 2: the z integral, against the closed form AND against lab/momentum.js */
  /* the z range must reach past the 3d cloud: cutting at |z| = 26 leaves 2.7e-8 of the integral outside, which is
     larger than everything else in this line — so the rule runs to |z| = 60, finely near the atom and coarsely out */
  const zint = (terms, p) => {
    const f = (z) => wignerAxial(terms, z, p, { order: 'fine' });
    return panelInt(f, -60, -20, 10, 12) + panelInt(f, -20, 0, 20, 12) + panelInt(f, 0, 20, 20, 12) + panelInt(f, 20, 60, 10, 12);
  };
  const a0 = zint(S1S, 0), a1 = zint(S1S, 1);
  /* π⁻² ∫d²k_⊥ φ*(p + k_⊥) φ(p − k_⊥) with φ from lab/momentum.js — an independent module */
  const kint = (terms, p) => {
    const re = new Float64Array(91), im = new Float64Array(91), ids = terms.map((t) => t.a);
    for (const t of terms) { re[t.a] = t.re; im[t.a] = t.im; }
    const N = 60, G = gaussLegendre(N), NP = 32, panels = 6, L = 18; let tot = 0;
    for (let q = 0; q < panels; q++) for (let i = 0; i < N; i++) {
      const h = L / panels, k = h * (q + 0.5) + h / 2 * G.x[i], wk = h / 2 * G.w[i];
      let acc = 0;
      for (let j = 0; j < NP; j++) {
        const ph = 2 * PI * (j + 0.5) / NP, kx = k * Math.cos(ph), ky = k * Math.sin(ph);
        const A = phiAt(re, im, kx, ky, p, ids), B = phiAt(re, im, -kx, -ky, p, ids);
        acc += (A.re * B.re + A.im * B.im) * (2 * PI / NP);
      }
      tot += wk * k * acc;
    }
    return tot / (PI * PI);
  };
  const MIXD = [{ a: idx(2, 1, 0), re: 0.6, im: 0.2 }, { a: idx(3, 2, 0), re: 0.5, im: -0.4 }];
  const b = zint(MIXD, 0.4), c = kint(MIXD, 0.4);
  judge('REDUCTION 2 (the dual, and the momentum module cross-check): ∫W(z, p_z) dz = π⁻²∫d²k_⊥ φ*(p+k_⊥)φ(p−k_⊥) — for 1s that is 8/(3π³(1+p²)³) (to 1e-8 at p = 0 and 1), and for the mixed 2p₀+3d₀ state it matches lab/momentum.js\'s φ to 1e-8',
    Math.abs(a0 - ONE_S.positionMarginal(0)) < 1e-8 && Math.abs(a1 - ONE_S.positionMarginal(1)) < 1e-8 && Math.abs(b - c) < 1e-8,
    { p0: a0, exact0: ONE_S.positionMarginal(0), p1: a1, exact1: ONE_S.positionMarginal(1), mixWigner: b, mixMomentum: c, d: b - c });
}
{ /* the chord marginal against psiAt — hydrogen.js's OTHER evaluator */
  const direct = (terms, z) => {
    const re = new Float64Array(91), im = new Float64Array(91), ids = terms.map((t) => t.a);
    for (const t of terms) { re[t.a] = t.re; im[t.a] = t.im; }
    const N = 40, G = gaussLegendre(N), NP = 24, panels = 8, L = 60; let tot = 0;
    for (let q = 0; q < panels; q++) for (let i = 0; i < N; i++) {
      const h = L / panels, sr = h * (q + 0.5) + h / 2 * G.x[i], wr = h / 2 * G.w[i];
      let acc = 0;
      for (let k = 0; k < NP; k++) {
        const ph = 2 * PI * (k + 0.5) / NP, x = sr * Math.cos(ph), y = sr * Math.sin(ph);
        const A = psiAt(re, im, x, y, z, ids), B = psiAt(re, im, -x, -y, z, ids);
        acc += (A.re * B.re + A.im * B.im) * (2 * PI / NP);
      }
      tot += wr * sr * acc;
    }
    return tot / (PI * PI);
  };
  let mx = 0;
  for (const st of [S1S, [{ a: idx(2, 1, 1), re: 1, im: 0 }], [{ a: idx(3, 2, 0), re: 0.6, im: 0.2 }, { a: idx(2, 1, 0), re: 0.5, im: -0.4 }]])
    for (const z of [0.7, 2]) mx = Math.max(mx, Math.abs(sliceMomentumMarginal(st, z, { order: 'fine' }) - direct(st, z)) / Math.abs(direct(st, z)));
  judge('AGAINST THE RECURRENCE EVALUATOR: the chord of 1s, 2p₊1 and a 3d₀+2p₀ mix agrees with a direct 2-D quadrature built on hydrogen.js\'s psiAt to 1e-10 relative — the amplitude factorisation used by the chord is the register\'s own ψ',
    mx < 1e-10, { maxRelErr: mx });
}
{ /* the selection rule, tested by the path that does NOT assume it */
  const DM = [{ a: idx(2, 1, 1), re: 0.6, im: 0.1 }, { a: idx(2, 1, 0), re: 0.5, im: -0.3 }, { a: idx(3, 2, 1), re: 0.4, im: 0.2 }];
  let mx = 0;
  for (const [z, p] of [[1.2, 0.8], [-2, 0.5], [0.4, 1.5]]) {
    const a = wignerAxial(DM, z, p, { order: 'fine' });
    const b = wignerAt(DM, [0, 0, z], [0, 0, p], { order: 'fine', nphi: 64, general: true });
    mx = Math.max(mx, Math.abs(a - b) / Math.abs(a));
  }
  judge('THE SELECTION RULE ON THE AXIS: only EQUAL-m pairs contribute to the (z, p_z) slice, with the phase (−1)^m — the analytic azimuth and a 64-point φ trapezoid over the lab azimuths (on modeTable) agree to 1e-10 relative for a 2p₊1 + 2p₀ + 3d₊1 state, at z of both signs',
    mx < 1e-10, { maxRelErr: mx });
}
{ /* the symmetry law of the 2p_z slice — the true one */
  let evenZ = 0, evenP = 0, sum = 0, val = 0;
  for (const [z, p] of [[1, 1], [2, 0.6], [0.7, 1.8], [3, 0.4]]) {
    const A = wignerAxial(S2PZ, z, p, { order: 'fine' }), B = wignerAxial(S2PZ, -z, p, { order: 'fine' }), C = wignerAxial(S2PZ, z, -p, { order: 'fine' });
    evenZ = Math.max(evenZ, Math.abs(A - B)); evenP = Math.max(evenP, Math.abs(A - C));
    if (Math.abs(A + B) > sum) { sum = Math.abs(A + B); val = A; }
  }
  judge('THE 2p_z SLICE IS EVEN, NOT ODD: W(−z, p) = W(z, p) and W(z, −p) = W(z, p) to 1e-15 — ψ_{2p_z} is REAL (so W is even in p, since the chord ψ(r+s)ψ(r−s) is even in s) and has definite parity (so W(−r, −p) = W(r, p)); the two together force evenness in z alone. An ANTISYMMETRY under z → −z at fixed p is FALSE: W(−z,p) + W(z,p) = 1.6e-3 ≠ 0 at (1, 1), not 0',
    evenZ < 1e-15 && evenP < 1e-15 && sum > 1e-4,
    { maxEvenZdev: evenZ, maxEvenPdev: evenP, sumAtWorst: sum, valueThere: val });
  /* the mixed-parity state: still even in p (ψ real), no longer even in z */
  const A = wignerAxial(MIX, 1, 1, { order: 'fine' }), B = wignerAxial(MIX, -1, 1, { order: 'fine' }), C = wignerAxial(MIX, 1, -1, { order: 'fine' });
  judge('AND THE MIXED-PARITY STATE SPLITS THE TWO: for the real (1s + 2p_z)/√2 the slice is still EVEN in p (1e-15, realness alone) but no longer even in z (7.007e-4 against 1.758e-3) — the z asymmetry is exactly the parity mixing that gives the state its dipole',
    Math.abs(A - C) < 1e-15 && Math.abs(A - B) > 1e-4, { W: A, atMinusZ: B, atMinusP: C });
}
{ /* the slice as the window builds it */
  wignerSlice(THREE, { z: [-16, 16, 8], p: [-2, 2, 8], order: 'normal' });                     // warm the caches
  const t0 = Date.now();
  const S = wignerSlice(THREE, { z: [-16, 16, 64], p: [-2, 2, 64], order: 'normal' });
  const wall = Date.now() - t0;
  const spot = wignerAxial(THREE, S.zs[S.argmin.i], S.ps[S.argmin.j], { order: 'fine' });
  const ok = S.W.length === 64 * 64 && Math.abs(S.W[S.argmin.i * 64 + S.argmin.j] - S.min) < 1e-6 * Math.abs(S.min) &&
             Math.abs(spot - S.min) < 2e-6 && S.min < 0 && S.max > 0 && S.ms < 300;
  judge('THE DRAWN SLICE: a 64 × 64 (z, p_z) map of the 3-term state 0.6|1s⟩ + (0.5+0.2i)|2p₀⟩ + (0.3−0.4i)|3d₀⟩ over z ∈ [−16, 16], p ∈ [−2, 2] in ' + S.ms.toFixed(0) + ' ms — UNDER the 300 ms frame budget, so the window computes it in the frame and needs no chunking; its minimum re-evaluates at order fine to 2e-6',
    ok, { ms: +S.ms.toFixed(1), wallMs: wall, min: S.min, max: S.max, argmin: S.argmin, refined: spot });
  const F = wignerSlice(S1S, { z: [-8, 8, 65], p: [-4, 4, 65], order: 'normal' });
  judge('AND THE 1s MAP: 65 × 65 over z ∈ [−8, 8], p ∈ [−4, 4] in ' + F.ms.toFixed(0) + ' ms, peaking exactly on 1/π³ at the grid point (0, 0) to 1e-9 and reaching −3.02e-4 in the negative lobe — the true minimum −3.0973e-4 sits between grid lines, as it must',
    F.ms < 300 && F.min < -3.0e-4 && F.min > ONE_S.min - 1e-9 && Math.abs(F.max - 1 / PI ** 3) < 1e-9,
    { ms: +F.ms.toFixed(1), min: F.min, max: F.max, peak: 1 / PI ** 3 });
}
{ /* wave 42, the reviewer's findings: (4) a 17th term wrote past a fixed Float64Array(16) and W was NaN */
  const T17 = BASIS.slice(0, 17).map((s, i) => ({ a: s.index, re: 0.2 + 0.01 * i, im: 0.1 * ((i % 3) - 1) }));
  const v17 = wignerAxial(T17, 0.5, 0.3, { order: 'fast' }), m17 = sliceMomentumMarginal(T17, 0.5), s17 = wignerSlice(T17, { z: [-4, 4, 8], p: [-2, 2, 8], order: 'fast' });
  /* the 20-term state against a chunked sum: W is a quadratic form in the coefficients, so W(all) = Σ_i W(c_i) + Σ_{i<j}[W(c_i ∪ c_j) − W(c_i) − W(c_j)]
     with every evaluation on ≤ 16 terms; each chunk carries an n = 4 label so the quadrature (set by n_max) is the same rule
     for all of them and the identity holds to rounding */
  const T20 = BASIS.slice(0, 20).map((s, i) => ({ a: s.index, re: 0.2 + 0.01 * i, im: 0.1 * ((i % 3) - 1) }));
  const ch = [[...T20.slice(0, 7), T20[19]], [...T20.slice(7, 14), T20[18]], T20.slice(14, 18)], f = (t) => wignerAxial(t, 0.5, 0.3, { order: 'normal' });
  let sum = 0; for (let i = 0; i < 3; i++) { sum += f(ch[i]); for (let j = i + 1; j < 3; j++) sum += f([...ch[i], ...ch[j]]) - f(ch[i]) - f(ch[j]); }
  const v20 = f(T20);
  judge('W42-4 SEVENTEEN TERMS: the reviewer\'s 17-term state gives a finite W(0.5, 0.3), a finite momentum marginal and a finite 8 × 8 slice (all were NaN — the chord\'s scratch arrays were a fixed 16), and a 20-term state equals its 16-term-chunked bilinear sum to 1e-12 relative',
    isFinite(v17) && isFinite(m17) && Array.from(s17.W).every(isFinite) && isFinite(v20) && Math.abs(v20 - sum) < 1e-12 * Math.abs(v20),
    { W17: v17, marginal17: m17, slice17min: s17.min, W20: v20, chunked: sum, rel: (v20 - sum) / v20 });
}
{ /* (8) the 64 × 64 slice of a six-term n ≤ 6 state cost 138–150 ms at the default range and 306 ms at the knob's extreme:
     the s_z rule is now cut at the state's extent instead of each row's own tails, and holds only s_z > 0 (W is real) */
  const six = [[6, 5, 5], [6, 0, 0], [5, 4, -4], [4, 3, 3], [2, 1, 0], [1, 0, 0]].map(([n, l, m], i) => ({ a: idx(n, l, m), re: 0.4, im: 0.1 * i }));
  wignerSlice(six, { z: [-8, 8, 8], p: [-2, 2, 8], order: 'normal' });                                             // warm
  const corners = [[40, 4], [16, 4], [2, 4], [8, 2]].map(([zm, pm]) => { const t = Date.now(); const S = wignerSlice(six, { z: [-zm, zm, 64], p: [-pm, pm, 64], order: 'normal' }); return { zmax: zm, pmax: pm, ms: Date.now() - t, finite: Array.from(S.W).every(isFinite) }; });
  const w0 = wignerAxial(S1S, 0, 0, { order: 'normal' }), wm = wignerAxial(S1S, ONE_S.minAt[0], ONE_S.minAt[1], { order: 'normal' });
  const S8 = wignerSlice(six, { z: [-8, 8, 64], p: [-2, 2, 64], order: 'normal' }), F8 = wignerSlice(six, { z: [-8, 8, 64], p: [-2, 2, 64], order: 'fine' });
  let dev = 0; for (let i = 0; i < S8.W.length; i++) dev = Math.max(dev, Math.abs(S8.W[i] - F8.W[i]));
  judge('W42-8 THE SLICE UNDER 150 ms AT EVERY KNOB CORNER: the six-term n ≤ 6 state on 64 × 64 at (z_max, p_max) = (40, 4) [the reviewer\'s 306 ms], (16, 4), (2, 4) and (8, 2) — ' + corners.map((c) => c.ms).join(', ') + ' ms — at order normal (the extent cut and the half rule), all finite; the 1s anchors at that order: W(0, 0) = 1/π³ to 1e-7 (it is 2e-11) and the minimum −3.0973e-4 to 1e-7 (it is 6e-12); and the six-term slice at the default range agrees with order fine to 2e-4 absolute over the grid (the n = 6 truncation the header states: ~5e-5, 0.3 % of the maximum)',
    corners.every((c) => c.ms < 150 && c.finite) && Math.abs(w0 - 1 / PI ** 3) < 1e-7 && Math.abs(wm - ONE_S.min) < 1e-7 && dev < 2e-4,
    { corners, peakErr: w0 - 1 / PI ** 3, minErr: wm - ONE_S.min, normalVsFine: dev, max: S8.max });
}
console.log('      wall time ' + ((Date.now() - T0) / 1000).toFixed(1) + ' s');
console.log((FAILED ? 'RED ' : 'GREEN ') + 'wigner.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
