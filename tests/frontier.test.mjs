/* tests/frontier.test.mjs — the node proof of the FRONTIER mathematics (print of 2026-09-03) in the instrument.
 *   node tests/frontier.test.mjs
 * Anchors are the OTHER lab's numbers (Opus's), table values (DLMF), and quadrature — never the generator itself.
 */
import { airyAi, envelopeI, peakLaw, revivalClocks, packet, ladderAutocorr, revivalScan, poissonAiry, combVerdict, cubicPeak,
  clebsch, kzElement, kzElementCG, shellMatrix, schmidt, rotorExpectations, applyRotateK, applyDefectWait, symEig,
  polyRoots, coaxialPolynomial, vortexPoints, stretchedCensus, threeModes,
  wignerD, shellCoefficients, applyShellRotors, applyRotor, clockAutocorr, quarticEnvelope, cuspEnvelopeC,
  superrevival, korseltModulus, clockDeafness, saddleSingulant, poissonAiryChirped, envelope4C, AI_SWITCH } from '../lab/frontier.js';
import { radial, ylm, stateOf, BASIS } from '../lab/hydrogen.js';
import { Register, PRESETS } from '../lab/state.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 300)));
}
const PI = Math.PI, S2 = Math.SQRT1_2;
function simpson(f, a, b, n) { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * ((i % 2) ? 4 : 2); return s * h / 3; }
let seed = 20260903; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

/* ── A · the Airy function against DLMF table values ─────────────────────── */
{
  const T = [[0, 0.3550280538878172], [1, 0.1352924163128814], [-1, 0.5355608832923521], [2, 0.03492413042327438], [-2, 0.2274074282016470],
    [3, 0.006591139357460719], [-3, -0.3788142936776581], [5, 1.0834442813607441e-4], [-5, 0.3507610090241142], [10, 1.1047532552898687e-10], [-10, 0.04024123848644319]];
  let worst = 0, which = 0;
  for (const [x, v] of T) { const d = Math.abs(airyAi(x) - v) / Math.max(Math.abs(v), 1e-4); if (d > worst) { worst = d; which = x; } }
  judge('A Ai(x) at eleven DLMF anchors, rel 1.2e-8 — Round 6 showed 1e-8 is NOT achievable by this pair of representations and moved the switch to the crossing x* = 5.746', worst < 1.2e-8, { worst, at: which });
  // the switch itself: the old boundary x = 6 was the worst place to put it
  const SW = [[5.746, 1.8601858625358966e-5], [5.9999, 9.9501711787465266e-6], [6.0, 9.9476943602528896e-6], [-5.746, -0.18587679691494196], [-5.9999, -0.32911057020714068]];
  let ws = 0, wsx = 0;
  for (const [x, v] of SW) { const d = Math.abs(airyAi(x) - v) / Math.abs(v); if (d > ws) { ws = d; wsx = x; } }
  judge('A and across the switch (x = ±5.746, ±5.9999, 6.0 against mpmath at 30 digits) the relative error stays under 1.2e-8', ws < 1.2e-8, { worst: ws, at: wsx });
}
/* the envelope closed form against direct quadrature of ∫e^{-u²/2}cos(αu+βu³)du/√(2π) */
{
  let worst = 0, which = null;
  for (const [a, b, n, tol] of [[-0.06, 0.02, 200000, 1e-9], [-0.45774, 0.2, 400000, 1e-9], [0.3, 0.5, 400000, 1e-8], [-1.41263, 1.5, 800000, 1e-7]]) {
    const q = simpson((u) => Math.exp(-u * u / 2) * Math.cos(a * u + b * u * u * u), -14, 14, n) / Math.sqrt(2 * PI);
    const d = Math.abs(envelopeI(a, b) - q) / tol; if (d > worst) { worst = d; which = [a, b, envelopeI(a, b), q]; }
  }
  judge('A I(α,β) closed form (Airy) = quadrature at four (α,β) within their tolerances', worst < 1, which);
}
/* the two exact series against the numerical maximiser (optimal truncation) */
{
  const p2 = peakLaw(0.02), p5 = peakLaw(0.05);
  judge('A α*(0.02): integer series −3β+54β³−… (optimally truncated, error 2e-10) = numerical maximiser to 1e-7 (the √ε floor of locating a maximum)', Math.abs(p2.alphaStar - p2.alphaStarNum) < 1e-7 && p2.alphaStarError < 1e-9, { series: p2.alphaStar, num: p2.alphaStarNum, terms: p2.alphaStarTerms });
  judge('A |I|max(0.02): rational series 1−3β²+(279/2)β⁴−… = numerical maximum to 1e-9', Math.abs(p2.height - p2.heightNum) < 1e-9, { series: p2.height, num: p2.heightNum });
  judge('A α*(0.05): the series is Gevrey-1 — its optimal truncation error is ~2e-4 and the numerical value sits inside it', Math.abs(p5.alphaStar - p5.alphaStarNum) < 3 * p5.alphaStarError + 1e-6 && p5.alphaStarError < 5e-4, { series: p5.alphaStar, num: p5.alphaStarNum, err: p5.alphaStarError });
  judge('A the first lobe: at β = 3 the maximiser is α* = −1.89744 (Round 3 probe, 2e-3); at β = 300 the height tends to √(2π)·max Ai/(3β)^{1/3} = 1.3427/(3β)^{1/3} within 1%', Math.abs(peakLaw(3).alphaStarNum + 1.89744) < 2e-3 && Math.abs(peakLaw(300).heightNum * Math.cbrt(900) / 1.3427 - 1) < 0.01, { a3: peakLaw(3).alphaStarNum, h300: peakLaw(300).heightNum * Math.cbrt(900) });
}
/* the clocks and the Poisson sum of Airy envelopes against the exact ladder sum */
{
  const c = revivalClocks(30, 2);
  judge('A clocks: T_cl = 2πn̄³, T_rev = 4πn̄⁴/3, T_sr = πn̄⁵, β₃ = 8πσ³/3n̄, β₄ = 10πσ⁴/3n̄²', Math.abs(c.Tcl - 2 * PI * 27000) < 1e-6 && Math.abs(c.Trev - 4 * PI * 810000 / 3) < 1e-6 && Math.abs(c.Tsr - PI * 24300000) < 1e-3 && Math.abs(c.beta3 - 8 * PI * 8 / 90) < 1e-12 && Math.abs(c.beta4 - 10 * PI * 16 / 2700) < 1e-12, c);
  let worst600 = 0, worst150 = 0;
  for (const nb of [600, 150]) {
    const pops = packet({ nbar: nb, sigma: 2 }), { Tcl, Trev } = revivalClocks(nb);
    for (const x of [0, 0.13, -0.31, 0.5, 0.27]) {
      const exact = ladderAutocorr(pops, Trev + x * Tcl).abs, pred = poissonAiry(nb, 2, x);
      const d = Math.abs(exact - pred); if (nb === 600) worst600 = Math.max(worst600, d); else worst150 = Math.max(worst150, d);
    }
  }
  judge('A Theorem A.4: |Σ_j I(α_j,β₃)| reproduces the exact ladder sum at T_rev + x·T_cl to 3e-3 (n̄ = 600, σ = 2; quartic β₄ = 4.7e-4)', worst600 < 3e-3, { worst600 });
  judge('A Theorem A.4 at n̄ = 150: the discrepancy is the neglected quartic (β₄ = 7.4e-3), below 3e-2', worst150 < 3e-2, { worst150 });
  const s = revivalScan(packet({ nbar: 30, sigma: 2 }), 30, { maxPeriods: 40 });
  judge('A n̄ = 30, σ = 2: the revival peak is at 0.99–0.999 T_rev with |A| > 0.78 while |A(T_rev)| < 0.4 (the cubic term moves it)', s.aPeak > 0.78 && s.tPeak / s.Trev > 0.99 && s.tPeak / s.Trev < 0.999 && s.aAtTrev < 0.4, { aPeak: s.aPeak, at: s.tPeak / s.Trev, atTrev: s.aAtTrev });
}
/* the deaf comb and the Parseval floor — Opus's exact numbers (bf-r4-comb) */
{
  const v1 = combVerdict(36000, 30), v2 = combVerdict(45000, 30), v3 = combVerdict(24000, 30), v4 = combVerdict(32400, 30);
  judge('A comb fractions 4d³/3n̄: 36000→1/1 deaf, 24000→3/2 deaf, 45000→4/5 not, 32400→10/9 not', v1.fraction === '1/1' && v1.deaf && v3.fraction === '3/2' && v3.deaf && v2.fraction === '4/5' && !v2.deaf && v4.fraction === '10/9' && !v4.deaf, [v1, v2, v3, v4]);
  const teeth = packet({ nbar: 36000, sigma: 60, d: 30, teeth: 8 });
  judge('A the comb p_m ∝ e^{-m²/8} (d = 30, σ = 60, 17 teeth): p_1/p_0 = e^{-1/8}', Math.abs(teeth.find((t) => t.m === 1).p / teeth.find((t) => t.m === 0).p - Math.exp(-1 / 8)) < 1e-12 && teeth.length === 17);
  const deaf = cubicPeak(teeth, 1, 1), p45 = cubicPeak(teeth, 4, 5), p32 = cubicPeak(teeth, 3, 2), p109 = cubicPeak(teeth, 10, 9);
  judge('A Theorem A.5: b | 6 is deaf — cubic-level peaks 1.000000 for 1/1 and 3/2', Math.abs(deaf.peak - 1) < 1e-9 && Math.abs(p32.peak - 1) < 1e-9, { deaf: deaf.peak, p32: p32.peak });
  judge('A 4/5 → 0.744456 and 10/9 → 0.844052 (Opus, bf-r4-comb, exact cubic level) to 3e-5', Math.abs(p45.peak - 0.744456) < 3e-5 && Math.abs(p109.peak - 0.844052) < 3e-5, { p45: p45.peak, p109: p109.peak });
  judge('A Theorem A.6: the Parseval floor ‖p‖₂/‖p‖₁ = 0.375570 (Opus) and every peak sits above it', Math.abs(p45.floor - 0.375570) < 2e-6 && p45.peak > p45.floor && p109.peak > p109.floor, { floor: p45.floor });
}

/* ── B · Clebsch–Gordan, Pauli, the two rotors ───────────────────────────── */
{
  const A = [[0.5, 0.5, 0.5, -0.5, 1, 0, S2], [0.5, 0.5, 0.5, -0.5, 0, 0, S2], [0.5, -0.5, 0.5, 0.5, 0, 0, -S2], [1, 1, 1, -1, 0, 0, 1 / Math.sqrt(3)],
    [1, 0, 1, 0, 0, 0, -1 / Math.sqrt(3)], [1, 1, 1, 0, 2, 1, S2], [1, 1, 1, 0, 1, 1, S2], [1, 0, 1, 0, 2, 0, Math.sqrt(2 / 3)], [1, 1, 1, 1, 2, 2, 1]];
  let worst = 0; for (const [j1, m1, j2, m2, J, M, v] of A) worst = Math.max(worst, Math.abs(clebsch(j1, m1, j2, m2, J, M) - v));
  judge('B Clebsch–Gordan: nine table anchors (Condon–Shortley) to 1e-14', worst < 1e-14, worst);
  // orthonormality of the coupling matrix for j = 5/2 (n = 6)
  let wo = 0; const j = 2.5;
  for (let l = 0; l <= 5; l++) for (let l2 = l; l2 <= 5; l2++) for (let m = -l; m <= l; m++) if (Math.abs(m) <= l2) {
    let s = 0; for (let p = 0; p < 6; p++) { const q = m - (j - p); if (Math.abs(q) > j + 1e-9) continue; s += clebsch(j, j - p, j, q, l, m) * clebsch(j, j - p, j, q, l2, m); }
    wo = Math.max(wo, Math.abs(s - (l === l2 ? 1 : 0)));
  }
  judge('B the j = 5/2 ⊗ 5/2 coupling matrix is orthonormal (n = 6 shell), 1e-13', wo < 1e-13, wo);
}
/* Pauli's K_z: the coupled picture reproduces the hydrogen matrix elements, and the closed form reproduces quadrature */
{
  let worst = 0, which = '';
  for (let n = 2; n <= 6; n++) for (let l = 0; l < n - 1; l++) { const d = Math.abs(Math.abs(kzElementCG(n, l)) - kzElement(n, l, 0)); if (d > worst) { worst = d; which = `n${n} l${l}`; } }
  judge('B |⟨l+1 0|J₊z−J₋z|l 0⟩| in V_j⊗V_j equals Pauli\'s √(n²−(l+1)²)·(l+1)/√((2l+1)(2l+3)) for every n ≤ 6, l (1e-12)', worst < 1e-12, { worst, which });
  let wz = 0, wzw = '';
  for (const [n, l, m] of [[2, 0, 0], [3, 1, 0], [3, 0, 0], [4, 2, 1], [6, 3, 2], [5, 1, -1]]) {
    const rad = simpson((r) => radial(n, l + 1, r) * radial(n, l, r) * r * r * r, 0, 300, 60000);
    const ang = 2 * PI * simpson((th) => ylm(l + 1, m, th, 0).re * ylm(l, m, th, 0).re * Math.cos(th) * Math.sin(th), 0, PI, 4000);
    const z = rad * ang, want = -1.5 * n * kzElement(n, l, m);
    const d = Math.abs(z - want); if (d > wz) { wz = d; wzw = `n${n}l${l}m${m}: ${z} vs ${want}`; }
  }
  judge('B ⟨n l+1 m|z|n l m⟩ by quadrature = −(3n/2)·K_z element (Pauli, with the CS/positive-R conventions), 1e-7', wz < 1e-7, wzw);
}
/* the orbit theorem in the instrument: Schmidt spectra, ⟨L⟩, ⟨K⟩, eccentricity */
{
  const mk = (list) => { const re = new Float64Array(91), im = new Float64Array(91); for (const [n, l, m, r, i] of list) { re[stateOf(n, l, m).index] = r; im[stateOf(n, l, m).index] = i || 0; } return { re, im }; };
  const s2 = mk([[2, 0, 0, 1]]), st = mk([[2, 0, 0, S2], [2, 1, 0, S2]]), circ = mk([[2, 1, 1, 1]]);
  const sch = (s) => schmidt(shellMatrix(s.re, s.im, 2)).values;
  judge('B 2s has Schmidt spectrum (1/√2, 1/√2) — an entangled pair of rotors (Opus, bf-r4-corpus)', Math.abs(sch(s2)[0] - S2) < 1e-12 && Math.abs(sch(s2)[1] - S2) < 1e-12, sch(s2));
  judge('B the Stark state (2s+2p₀)/√2 and the circular state 2p₊ have spectrum (1, 0): coherent, on Gr⁺(2,4)', Math.abs(sch(st)[0] - 1) < 1e-12 && Math.abs(sch(st)[1]) < 1e-12 && Math.abs(sch(circ)[0] - 1) < 1e-12, { stark: sch(st), circ: sch(circ) });
  const R = rotorExpectations(shellMatrix(st.re, st.im, 2)), C = rotorExpectations(shellMatrix(circ.re, circ.im, 2));
  judge('B Stark: ⟨K⟩ = ẑ, ⟨L⟩ = 0, e = 1/2 = (n−1)/n, ⟨z⟩ = −3 (the sign fixes the l-phase)', Math.abs(R.K[2] - 1) < 1e-12 && R.absL < 1e-12 && Math.abs(R.e - 0.5) < 1e-12 && Math.abs(R.z + 3) < 1e-12, R);
  judge('B circular 2p₊: ⟨L⟩ = ẑ (n−1), ⟨K⟩ = 0, e = 0, both rotors fully polarised (coherence 1)', Math.abs(C.L[2] - 1) < 1e-12 && C.absK < 1e-12 && C.e < 1e-12 && Math.abs(C.coherence - 1) < 1e-12, C);
  // invariance: a random n = 3 state keeps its spectrum under R_z and K_z rotations, loses it under a DEFECT WAIT
  const re = new Float64Array(91), im = new Float64Array(91);
  for (const s of BASIS) if (s.n === 3) { re[s.index] = rnd() - 0.5; im[s.index] = rnd() - 0.5; }
  const s0 = schmidt(shellMatrix(re, im, 3)).values;
  const reg = new Register(); for (let a = 0; a < 91; a++) if (re[a] || im[a]) reg.set(a, re[a], im[a], 0);
  reg.rotateZ(0.9); const s1 = schmidt(shellMatrix(reg.re0, reg.im0, 3)).values;
  applyRotateK(reg.re0, reg.im0, 0.83); const s2v = schmidt(shellMatrix(reg.re0, reg.im0, 3)).values;
  const n1 = reg.norm();
  applyDefectWait(reg.re0, reg.im0, 0.7); const s3 = schmidt(shellMatrix(reg.re0, reg.im0, 3)).values;
  const dmax = (a, b) => Math.max(...a.map((x, i) => Math.abs(x - b[i])));
  judge('B Theorem B.1: the Schmidt spectrum of a random n = 3 state is invariant under R_z(0.9) and e^{-i0.83K_z} (1e-12), norm kept', dmax(s0, s1) < 1e-12 && dmax(s0, s2v) < 1e-12 && Math.abs(n1 - Math.hypot(...Array.from(re), ...Array.from(im))) < 1e-12, { s0, s2v });
  judge('B Theorem B.3: the DEFECT WAIT e^{i0.7L²} changes the spectrum (it is not an SO(4) element)', dmax(s0, s3) > 1e-3, { s0, s3 });
  // B5 end to end: e^{iπ/4 L²} e^{-iπ/4 K_z} |2s⟩ = (2s + 2p₀)/√2
  const b5 = mk([[2, 0, 0, 1]]);
  applyRotateK(b5.re, b5.im, PI / 4);
  const mid = [b5.re[stateOf(2, 0, 0).index], b5.im[stateOf(2, 0, 0).index], b5.re[stateOf(2, 1, 0).index], b5.im[stateOf(2, 1, 0).index]];
  applyDefectWait(b5.re, b5.im, PI / 4);
  const fin = [b5.re[stateOf(2, 0, 0).index], b5.im[stateOf(2, 0, 0).index], b5.re[stateOf(2, 1, 0).index], b5.im[stateOf(2, 1, 0).index]];
  const RB = rotorExpectations(shellMatrix(b5.re, b5.im, 2));
  judge('B Theorem B.3 (Opus B5): e^{-iπ/4 K_z}|2s⟩ = (2s − i·2p₀)/√2 with ⟨z⟩ = 0, then e^{iπ/4 L²} lands on (2s+2p₀)/√2, ⟨z⟩ = −3, Schmidt (1,0)',
    Math.abs(mid[0] - S2) < 1e-12 && Math.abs(mid[1]) < 1e-12 && Math.abs(mid[2]) < 1e-12 && Math.abs(mid[3] + S2) < 1e-12 && Math.abs(fin[0] - S2) < 1e-12 && Math.abs(fin[2] - S2) < 1e-12 && Math.abs(fin[3]) < 1e-12 && Math.abs(RB.z + 3) < 1e-12 && Math.abs(schmidt(shellMatrix(b5.re, b5.im, 2)).values[0] - 1) < 1e-12, { mid, fin, z: RB.z });
  const ev = symEig(Float64Array.from([2, 1, 0, 1, 2, 1, 0, 1, 2]), 3).values.sort((a, b) => a - b);
  judge('B Jacobi eigenvalues of the 3×3 tridiagonal (2,1) are 2−√2, 2, 2+√2', Math.abs(ev[0] - (2 - Math.SQRT2)) < 1e-13 && Math.abs(ev[1] - 2) < 1e-13 && Math.abs(ev[2] - (2 + Math.SQRT2)) < 1e-13, ev);
}

/* ── C · the vortex lines ─────────────────────────────────────────────────── */
{
  const roots = polyRoots([{ re: -1, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: 1, im: 0 }]).map((z) => [z.re, z.im]).sort((a, b) => Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0]));
  const want = [[-1, 0], [0, -1], [1, 0], [0, 1]].sort((a, b) => Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0]));
  let w = 0; for (let i = 0; i < 4; i++) w = Math.max(w, Math.hypot(roots[i][0] - want[i][0], roots[i][1] - want[i][1]));
  judge('C Durand–Kerner: the roots of w⁴ − 1 are the four unimodular fourth roots of unity (1e-12)', roots.length === 4 && w < 1e-12, roots);
  const mk = (list) => { const re = new Float64Array(91), im = new Float64Array(91), ids = []; for (const [n, l, m, r, i] of list) { const a = stateOf(n, l, m).index; re[a] = r; im[a] = i || 0; ids.push(a); } return { re, im, ids }; };
  const px = mk([[2, 1, -1, S2], [2, 1, 1, -S2]]);
  const V = vortexPoints(px.re, px.im, px.ids, { nr: 6, nth: 48, rMax: 8 });
  const xmax = Math.max(...V.points.map((p) => Math.abs(p.x)));
  judge('C Theorem C.1: the nodal set of 2p_x on every coaxial circle is the pair of unimodular roots at φ = ±π/2 — all points lie in x = 0', V.points.length >= 12 && xmax < 1e-6 && V.M === 2 && V.axis === 1, { points: V.points.length, xmax, M: V.M, axis: V.axis });
  const dip = mk([[1, 0, 0, 0.8], [2, 1, 0, 0.6]]);
  const D = vortexPoints(dip.re, dip.im, dip.ids, { nr: 4, nth: 24, rMax: 8 });
  judge('C degree bound: an m = 0 superposition (1s+2p_z) has M = 0 — no vortex lines, no axis charge', D.points.length === 0 && D.M === 0 && D.axis === 0, D);
  // the census of the print: (3d₊₂ + 4p₊₁ + 5s)/√3 — five admissible radii, ten points, T_d = 481.265
  const reg = new Register(); reg.load(PRESETS.find((p) => p.id === 'recon'));
  const ids = reg.populated();
  const cen = stretchedCensus(threeModes(reg.re0, reg.im0, ids), 60);
  const wantR = [2.75347965, 6.36762188, 6.51013250, 14.32627490, 14.32954540, 20.05924142];
  let wr = 0; for (let i = 0; i < 6; i++) wr = Math.max(wr, Math.abs((cen.roots[i] || 0) - wantR[i]));
  judge('C Theorem C.3: Φ(r) has six roots at the print\'s radii (1e-5), five admissible (the last has ξ = 1.077), census 10, T_d = 481.265', cen && cen.roots.length === 6 && wr < 1e-5 && cen.admissible === 5 && cen.count === 10 && Math.abs(cen.Td - 481.2653) < 1e-3 && Math.abs(cen.points[5].xi - 1.07736) < 1e-4, { roots: cen && cen.roots, adm: cen && cen.admissible, Td: cen && cen.Td });
  judge('C the two firing phases: points with sgn(Â₊Â₋) < 0 fire at T_d/2 = 240.633, the others at t = 0 (Theorem C.2)', cen.points.every((p) => Math.abs(p.t0 - (p.sign < 0 ? cen.Td / 2 : 0)) < 1e-6 || Math.abs(p.t0 - cen.Td) < 1e-6), cen.points.map((p) => [p.sign, +p.t0.toFixed(4)]));
  // the first point is a double unimodular root at its firing time — the reconnection itself
  const p0 = cen.points[0], t0 = p0.t0, c = reg.at(t0);
  const Pw = coaxialPolynomial(c.re, c.im, ids, p0.r, p0.theta), rts = polyRoots(Pw.coeffs);
  const um = rts.map((z) => Math.abs(Math.hypot(z.re, z.im) - 1)), sep = Math.hypot(rts[0].re - rts[1].re, rts[0].im - rts[1].im);
  judge('C at (r, θ, t₀) = (2.7535, 0.8376, 240.633) the coaxial polynomial has a DOUBLE unimodular root: two roots on |w| = 1 within 1e-6, 1e-3 apart', rts.length === 2 && Math.max(...um) < 1e-6 && sep < 1e-3, { um, sep, phi: Math.atan2(rts[0].im, rts[0].re) });
  // the non-stretched case is refused, not faked
  judge('C the census refuses a state that is not three stretched consecutive-m modes', stretchedCensus(threeModes(dip.re, dip.im, dip.ids), 60) === null);
}
/* presets added by the frontier load and normalise; the STATE operations are on the register's road */
{
  const R = new Register(); R.load(PRESETS.find((p) => p.id === '2px'));
  const p1 = stateOf(2, 1, 1).index, m1 = stateOf(2, 1, -1).index;
  judge('P preset 2p_x = (Y₁⁻¹ − Y₁¹)/√2 loads with the right signs', Math.abs(R.re0[m1] - S2) < 1e-12 && Math.abs(R.re0[p1] + S2) < 1e-12);
  const S = new Register(); S.load(PRESETS.find((p) => p.id === '2s+2pz'));
  const c0re = Float64Array.from(S.re0), c0im = Float64Array.from(S.im0);
  const back = () => { let w = 0; for (let a = 0; a < 91; a++) w = Math.max(w, Math.abs(S.re0[a] - c0re[a]), Math.abs(S.im0[a] - c0im[a])); return w; };
  const d0 = S.digest(); S.rotateK(0.3); const d1 = S.digest(); S.rotateK(-0.3); const w1 = back();
  judge('P Register.rotateK(θ) changes the digest and rotateK(−θ) restores the coefficients to 1e-14 (unitary, invertible)', d0 !== d1 && w1 < 1e-14 && Math.abs(S.norm() - 1) < 1e-12, { d0, d1, w1 });
  S.defectWait(0.4); const d3 = S.digest(); S.defectWait(-0.4); const w2 = back();
  judge('P Register.defectWait(α) changes the digest, keeps the norm, and defectWait(−α) restores the coefficients', d3 !== d0 && w2 < 1e-14 && Math.abs(S.norm() - 1) < 1e-12, { d3, w2 });
}

/* ── R · Round 7: the full rotor action, the cusp, the exact clocks, the Korselt law ─────── */
{
  const rand = (n) => { const re = new Float64Array(91), im = new Float64Array(91); for (const s of BASIS) if (s.n === n) { re[s.index] = rnd() - 0.5; im[s.index] = rnd() - 0.5; } return { re, im }; };
  const diff = (a, b) => { let w = 0; for (let i = 0; i < 91; i++) w = Math.max(w, Math.abs(a.re[i] - b.re[i]), Math.abs(a.im[i] - b.im[i])); return w; };
  let worst = 0;
  for (const n of [2, 3, 4, 5, 6]) { const s = rand(n), re2 = new Float64Array(91), im2 = new Float64Array(91); shellCoefficients(shellMatrix(s.re, s.im, n), n, re2, im2); worst = Math.max(worst, diff(s, { re: re2, im: im2 })); }
  judge('R Theorem B.7: the Clebsch transform is orthogonal — shellCoefficients ∘ shellMatrix = identity on every shell n ≤ 6', worst < 1e-13, worst);
  {
    const n = 4, s = rand(n), al = 0.73;
    const R = new Register(); for (let a = 0; a < 91; a++) { R.re0[a] = s.re[a]; R.im0[a] = s.im[a]; }
    const re2 = Float64Array.from(s.re), im2 = Float64Array.from(s.im);
    applyRotor(re2, im2, { which: 'both', axis: 'z', angle: al }); R.rotateZ(al);
    judge('R the diagonal rotor pair U = V = D^j(R_z) is the ordinary rotation D^l(R_z): equals the register\'s rotateZ (1e-13)', diff({ re: R.re0, im: R.im0 }, { re: re2, im: im2 }) < 1e-13, diff({ re: R.re0, im: R.im0 }, { re: re2, im: im2 }));
  }
  {
    let w = 0;
    for (const n of [2, 3, 4, 5, 6]) {
      const s = rand(n), th = 0.61;
      const a1 = Float64Array.from(s.re), b1 = Float64Array.from(s.im); applyRotateK(a1, b1, th);
      const a2 = Float64Array.from(s.re), b2 = Float64Array.from(s.im); applyRotor(a2, b2, { which: 'K', axis: 'z', angle: th });
      w = Math.max(w, diff({ re: a1, im: b1 }, { re: a2, im: b2 }));
    }
    judge('R e^{−iθK_z} two independent ways — the tridiagonal eigendecomposition and the opposite rotor pair — agree to 1e-12 (the l-phase convention is checked, not assumed)', w < 1e-12, w);
  }
  {
    const n = 5, s = rand(n), M0 = shellMatrix(s.re, s.im, n), sp0 = schmidt(M0).values, R0 = rotorExpectations(M0);
    const a = Float64Array.from(s.re), b = Float64Array.from(s.im);
    applyRotor(a, b, { which: '+', axis: 'y', angle: 0.8 });
    const M1 = shellMatrix(a, b, n), sp1 = schmidt(M1).values, R1 = rotorExpectations(M1);
    const c = Float64Array.from(s.re), d = Float64Array.from(s.im);
    applyRotor(c, d, { which: 'both', axis: 'y', angle: 0.8 });
    const M2 = shellMatrix(c, d, n), R2 = rotorExpectations(M2);
    const dmax = (x, y) => Math.max(...x.map((v, i) => Math.abs(v - y[i])));
    judge('R Theorem B.1 for ALL of SO(4): one rotor alone keeps the Schmidt spectrum but moves ⟨L⟩ and ⟨K⟩; the diagonal pair keeps their lengths too',
      dmax(sp0, sp1) < 1e-12 && Math.abs(R1.absL - R0.absL) > 1e-3 && dmax(sp0, schmidt(M2).values) < 1e-12 && Math.abs(R2.absL - R0.absL) < 1e-12 && Math.abs(R2.absK - R0.absK) < 1e-12,
      { sp0: sp0.slice(0, 3), sp1: sp1.slice(0, 3), L: [R0.absL, R1.absL, R2.absL] });
  }
  /* the clocks, exactly: t = (A/B)πn̄^M makes t/(4πn²) rational, so BigInt keeps every digit of the phase */
  {
    const pops = packet({ nbar: 2000, sigma: 3 });
    const ex = clockAutocorr(pops, 2000, 1, 1, 5).abs;
    judge('R clockAutocorr at T_sr, n̄ = 2000, σ = 3 = 0.767146503 (mpmath at 40 digits, research/probes/bf-r7-cusp2.py)', Math.abs(ex - 0.767146503) < 1e-8, ex);
    const big = clockAutocorr(packet({ nbar: 200000, sigma: 3 }), 200000, 1, 1, 5).abs;
    judge('R and at n̄ = 200000, where the phase t/(2n²) ≈ 1.6e19 rad would leave a double with no digits at all: 0.99952208 (γ_sr → 0 ⇒ |A| → 1)', Math.abs(big - 0.9995220833) < 1e-8, big);
  }
  /* Theorem A.10: the cusp, and the arithmetic of n̄ mod 4 */
  {
    let w = 0, rows = [];
    for (const [nbar, sigma] of [[2000, 3], [4000, 4], [8000, 5], [4002, 4], [8002, 5], [4001, 4], [2000, 2]]) {
      const S = superrevival(nbar, sigma), ex = clockAutocorr(packet({ nbar, sigma }), nbar, 1, 1, 5).abs;
      w = Math.max(w, Math.abs(ex - S.predicted)); rows.push([nbar, S.kind, +ex.toFixed(6), +S.predicted.toFixed(6)]);
    }
    judge('R Theorem A.10 (the cusp): the superrevival envelope is the alias-summed QUARTIC (Pearcey) envelope in all four classes of n̄ mod 4 — full, half-shifted, fractional — to 1e-4 where the quintic is small', w < 1e-4, { worst: w, rows });
    const S0 = superrevival(4000, 4), S2 = superrevival(4002, 4), S1 = superrevival(4001, 4);
    judge('R and the classes are what the arithmetic says: 4 | n̄ full · n̄ ≡ 2 half-shifted (suppressed by (−1)^k) · n̄ odd fractional', S0.kind === 'full' && S2.kind === 'half-shifted' && S1.kind === 'fractional' && S0.predicted > 0.7 && S2.predicted < 0.1 && S1.predicted > 0.5, { full: S0.predicted, half: S2.predicted, frac: S1.predicted });
  }
  /* Theorem A.11: the Korselt / Bernoulli law of deafness */
  {
    const K = [2, 3, 4, 5, 6, 7].map(korseltModulus);
    judge('R Theorem A.11: the deafness modulus K(p) is 2, 6, 2, 30, 2, 42 for p = 2…7 — for odd p the denominator of the Bernoulli number B_{p−1} (von Staudt–Clausen); p = 3 gives the print\'s b | 6', JSON.stringify(K) === JSON.stringify([2, 6, 2, 30, 2, 42]), K);
    const a = clockDeafness(36000, 30, 3), b = clockDeafness(45000, 30, 3), c = combVerdict(36000, 30), d = combVerdict(45000, 30);
    judge('R clockDeafness at p = 3 reproduces the print\'s comb verdict on both sides (deaf 1/1, hearing 4/5)', a.deaf && a.fraction === c.fraction && !b.deaf && b.fraction === d.fraction, { a, b });
  }
  /* Theorem A.9: the singulant is the action difference of two saddles */
  {
    const s3 = saddleSingulant(3, 0.1), s4 = saddleSingulant(4, 0.25);
    judge('R Theorem A.9: |ΔS_p| = ((p−2)/2p)(pγ)^{−2/(p−2)} gives 1/(54β²) at p = 3 — the print\'s Borel pole β² = −1/54, derived from the saddles rather than fitted — and 1/(16γ) at p = 4',
      Math.abs(s3.abs - 1 / (54 * 0.01)) < 1e-9 && Math.abs(s4.abs - 1 / (16 * 0.25)) < 1e-12 && s3.constant === 54 && s4.constant === 16, { s3: s3.abs, want3: 1 / 0.54, s4: s4.abs, want4: 0.25 });
  }
}

/* ── K · Round 6's kills, each now a permanent anchor ────────────────────── */
{
  /* THE KILL: the census printed 0 where the truth is 8. The pairs hide in a 1.4e-4 dip at the MIDDLE mode's
     radial nodes — Φ = −4|Â₊Â₋| < 0 there — which the old scan never covered. Opus's state, his four radii. */
  const kill = stretchedCensus([{ n: 3, l: 2, m: 2, re: 1, im: 0 }, { n: 4, l: 1, m: 1, re: 76241.394354, im: 0 }, { n: 5, l: 0, m: 0, re: 3.7179689892, im: 0 }], 60);
  const want = [5.52779176, 5.52793632, 14.47210203, 14.47216989];
  const gotR = kill.roots.slice().sort((a, b) => a - b);
  const wr = gotR.length === 4 ? Math.max(...want.map((v, i) => Math.abs(v - gotR[i]))) : Infinity;
  judge('K Round 6\'s counter-example: (3d₊₂, 4p₊₁, 5s) with moduli (1, 76241.394354, 3.7179689892) has FOUR roots of Φ at the 4p radial nodes and a census of 8 — the instrument printed 0 before the scan was made node-aware on all three modes',
    kill.roots.length === 4 && wr < 1e-6 && kill.admissible === 4 && kill.count === 8, { roots: gotR, worst: wr, census: kill.count });
  /* and the states of the print are unchanged by the new scan */
  const R5 = new Register(); R5.load(PRESETS.find((p) => p.id === 'recon'));
  const c5 = stretchedCensus(threeModes(R5.re0, R5.im0, R5.populated()), 60);
  judge('K and the print\'s own census is untouched: six roots, five admissible, ten points', c5.roots.length === 6 && c5.admissible === 5 && c5.count === 10, { roots: c5.roots.length, census: c5.count });
  /* the degenerate beat: 2E₀ = E₊ + E₋ has no firing time at all (it was NaN) */
  const deg = stretchedCensus([{ n: 4, l: 2, m: 2, re: 1, im: 0 }, { n: 4, l: 1, m: 1, re: 1, im: 0 }, { n: 4, l: 0, m: 0, re: 1, im: 0 }], 60);
  judge('K a degenerate beat (three modes of one shell: 2E₀ = E₊ + E₋) reports T_d = ∞ and no firing time, instead of NaN', deg && deg.Td === Infinity && deg.points.every((p) => p.t0 === null), { Td: deg && deg.Td, t0: deg && deg.points.map((p) => p.t0) });
  /* the chirp: the term the fold prediction actually neglects away from the revival */
  let eA = 0, eC = 0;
  for (const [nbar, sigma] of [[600, 2], [300, 2]]) {
    const { Tcl, Trev } = revivalClocks(nbar, sigma), pops = packet({ nbar, sigma });
    for (const x of [0.13, -0.31, 0.5, 0.27]) {
      const ex = ladderAutocorr(pops, Trev + x * Tcl).abs;
      eA += Math.abs(poissonAiry(nbar, sigma, x) - ex); eC += Math.abs(poissonAiryChirped(nbar, sigma, x) - ex);
    }
  }
  judge('K the chirp δ = 3πxσ²/n̄ is the neglected term away from x = 0 (Round 6: 67× the quartic): restoring it cuts the fold prediction\'s total error by ~1.5× here (9× at n̄ = 600, x = 0.13) — an improvement on average, not at every point', eC < 0.8 * eA, { airy: eA, chirped: eC, gain: +(eA / eC).toFixed(2) });
  judge('K peakLaw\'s seriesUsable boundary is the measured one (β < 0.0555), not the old 0.32 where the series is already 23% low', peakLaw(0.05).seriesUsable && !peakLaw(0.3).seriesUsable && Math.abs(peakLaw(0.319).height - 0.69472) < 2e-3 && Math.abs(peakLaw(0.319).heightNum - 0.89878) < 2e-3, { series: peakLaw(0.319).height, truth: peakLaw(0.319).heightNum });
}

console.log((FAILED ? 'RED' : 'GREEN') + ' frontier.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
