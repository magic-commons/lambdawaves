/* tests/hydrogen.test.mjs — the node proof of the exact core (Q0, Q1, Q2 of §50).
 *   node tests/hydrogen.test.mjs
 * The anchors below are HAND-TYPED from standard tables (Griffiths / Jackson conventions),
 * not derived from the generator under test — that is the point (§51).
 */
import { BASIS, energy, radial, ylm, orbital, orbitalFromTable, modeTable, HARTREE_EV, stateOf } from '../lab/hydrogen.js';
import { Register, PRESETS, T_BEAT_12, N } from '../lab/state.js';
import { Clock } from '../lab/clock.js';
import { toQP, fromQP, diagonalSystem, realGenerator, classicalEnergy, integrateRK4, splitH } from '../lab/shadow.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 240)));
}
const PI = Math.PI;
function simpson(f, a, b, n) {           // n even
  const h = (b - a) / n; let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * ((i % 2) ? 4 : 2);
  return s * h / 3;
}
/* a small deterministic PRNG so every run sees the same holdout points */
let seed = 20260902;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

/* ── Q0 BASIS ─────────────────────────────────────────────────────────────── */
judge('Q0 register holds exactly 91 states', BASIS.length === 91 && N === 91, BASIS.length);
judge('Q0 ids are unique and stable', new Set(BASIS.map((s) => s.id)).size === 91, BASIS[0].id + ' … ' + BASIS[90].id);
judge('Q0 energies E_n = −1/(2n²)', energy(1) === -0.5 && energy(2) === -0.125 && Math.abs(energy(6) + 1 / 72) < 1e-16);
judge('Q0 Lyman-α energy 0.375 a.u. = 10.204 eV', Math.abs((energy(2) - energy(1)) * HARTREE_EV - 10.2043) < 2e-3, (energy(2) - energy(1)) * HARTREE_EV);

/* radial normalization ∫|R_nl|² r² dr = 1 for every (n,l) */
{
  let worst = 0, which = '';
  for (let n = 1; n <= 6; n++) for (let l = 0; l < n; l++) {
    const I = simpson((r) => { const R = radial(n, l, r); return R * R * r * r; }, 0, 400, 40000);
    if (Math.abs(I - 1) > worst) { worst = Math.abs(I - 1); which = `R_${n}${l}`; }
  }
  judge('Q0 ∫|R_nl|² r² dr = 1 for all 21 (n,l) to 1e-6', worst < 1e-6, { worst, which });
}
/* angular normalization ⟨Y_lm|Y_lm⟩ = 1 for every (l,m), 2-D Simpson in (θ, φ) */
{
  let worst = 0, which = '';
  for (let l = 0; l <= 5; l++) for (let m = -l; m <= l; m++) {
    const I = simpson((th) => simpson((ph) => { const Y = ylm(l, m, th, ph); return (Y.re * Y.re + Y.im * Y.im) * Math.sin(th); }, 0, 2 * PI, 64), 0, PI, 400);
    if (Math.abs(I - 1) > worst) { worst = Math.abs(I - 1); which = `Y_${l}^${m}`; }
  }
  judge('Q0 ⟨Y_lm|Y_lm⟩ = 1 for all 36 (l,m) to 1e-6', worst < 1e-6, { worst, which });
}
/* orthogonality samples */
{
  const rad = (n1, l, n2) => simpson((r) => radial(n1, l, r) * radial(n2, l, r) * r * r, 0, 400, 40000);
  const ang = (l1, m1, l2, m2) => {   // ⟨Y1|Y2⟩ = ∫ conj(Y1) Y2
    let re = 0, im = 0;
    re = simpson((th) => simpson((ph) => { const a = ylm(l1, m1, th, ph), b = ylm(l2, m2, th, ph); return (a.re * b.re + a.im * b.im) * Math.sin(th); }, 0, 2 * PI, 64), 0, PI, 400);
    im = simpson((th) => simpson((ph) => { const a = ylm(l1, m1, th, ph), b = ylm(l2, m2, th, ph); return (a.re * b.im - a.im * b.re) * Math.sin(th); }, 0, 2 * PI, 64), 0, PI, 400);
    return Math.hypot(re, im);
  };
  const r1 = rad(1, 0, 2), r2 = rad(2, 1, 3), r3 = rad(3, 2, 5), r4 = rad(4, 0, 6);
  judge('Q0 radial orthogonality ⟨R_10|R_20⟩, ⟨R_21|R_31⟩, ⟨R_32|R_52⟩, ⟨R_40|R_60⟩ ≈ 0', Math.max(Math.abs(r1), Math.abs(r2), Math.abs(r3), Math.abs(r4)) < 1e-7, [r1, r2, r3, r4]);
  const a1 = ang(1, 1, 1, -1), a2 = ang(2, 1, 3, 1), a3 = ang(2, 2, 2, -2), a4 = ang(0, 0, 2, 0), a5 = ang(3, 2, 5, 2);
  judge('Q0 angular orthogonality ⟨Y11|Y1-1⟩, ⟨Y21|Y31⟩, ⟨Y22|Y2-2⟩, ⟨Y00|Y20⟩, ⟨Y32|Y52⟩ ≈ 0', Math.max(a1, a2, a3, a4, a5) < 1e-7, [a1, a2, a3, a4, a5]);
}
/* HAND-TYPED ANCHORS (Condon–Shortley phase, physics convention) */
{
  const S = Math.sqrt;
  const anchorsR = [
    ['R_10', 1, 0, (r) => 2 * Math.exp(-r)],
    ['R_20', 2, 0, (r) => (1 / (2 * S(2))) * (2 - r) * Math.exp(-r / 2)],
    ['R_21', 2, 1, (r) => r * Math.exp(-r / 2) / (2 * S(6))],
    ['R_30', 3, 0, (r) => (2 / (3 * S(3))) * (1 - 2 * r / 3 + 2 * r * r / 27) * Math.exp(-r / 3)],
    ['R_31', 3, 1, (r) => (8 / (27 * S(6))) * r * (1 - r / 6) * Math.exp(-r / 3)],
    ['R_32', 3, 2, (r) => (4 / (81 * S(30))) * r * r * Math.exp(-r / 3)],
  ];
  let worst = 0, which = '';
  for (const [name, n, l, f] of anchorsR) for (const r of [0.1, 0.7, 1.3, 2.9, 5.5, 11]) {
    const d = Math.abs(radial(n, l, r) - f(r));
    if (d > worst) { worst = d; which = name + '@' + r; }
  }
  judge('Q0 radial anchors R_10 R_20 R_21 R_30 R_31 R_32 (table-typed) agree to 1e-12', worst < 1e-12, { worst, which });

  const anchorsY = [
    ['Y_00', 0, 0, (t, p) => [1 / (2 * S(PI)), 0]],
    ['Y_10', 1, 0, (t, p) => [S(3 / (4 * PI)) * Math.cos(t), 0]],
    ['Y_11', 1, 1, (t, p) => [-S(3 / (8 * PI)) * Math.sin(t) * Math.cos(p), -S(3 / (8 * PI)) * Math.sin(t) * Math.sin(p)]],
    ['Y_1-1', 1, -1, (t, p) => [S(3 / (8 * PI)) * Math.sin(t) * Math.cos(p), -S(3 / (8 * PI)) * Math.sin(t) * Math.sin(p)]],
    ['Y_20', 2, 0, (t, p) => [S(5 / (16 * PI)) * (3 * Math.cos(t) ** 2 - 1), 0]],
    ['Y_21', 2, 1, (t, p) => [-S(15 / (8 * PI)) * Math.sin(t) * Math.cos(t) * Math.cos(p), -S(15 / (8 * PI)) * Math.sin(t) * Math.cos(t) * Math.sin(p)]],
    ['Y_22', 2, 2, (t, p) => [S(15 / (32 * PI)) * Math.sin(t) ** 2 * Math.cos(2 * p), S(15 / (32 * PI)) * Math.sin(t) ** 2 * Math.sin(2 * p)]],
    ['Y_2-2', 2, -2, (t, p) => [S(15 / (32 * PI)) * Math.sin(t) ** 2 * Math.cos(2 * p), -S(15 / (32 * PI)) * Math.sin(t) ** 2 * Math.sin(2 * p)]],
    ['Y_30', 3, 0, (t, p) => [S(7 / (16 * PI)) * (5 * Math.cos(t) ** 3 - 3 * Math.cos(t)), 0]],
    ['Y_33', 3, 3, (t, p) => [-S(35 / (64 * PI)) * Math.sin(t) ** 3 * Math.cos(3 * p), -S(35 / (64 * PI)) * Math.sin(t) ** 3 * Math.sin(3 * p)]],
  ];
  worst = 0; which = '';
  for (const [name, l, m, f] of anchorsY) for (const [t, p] of [[0.3, 0.2], [1.1, 2.5], [2.0, -1.2], [2.9, 4.0]]) {
    const Y = ylm(l, m, t, p), [er, ei] = f(t, p);
    const d = Math.hypot(Y.re - er, Y.im - ei);
    if (d > worst) { worst = d; which = name; }
  }
  judge('Q0 angular anchors Y_00…Y_33 with Condon–Shortley phase (table-typed) agree to 1e-12', worst < 1e-12, { worst, which });
}
/* the GPU's polynomial tables against the recurrence oracle, all 91 states, holdout points */
{
  let worst = 0, which = '';
  for (const s of BASIS) {
    const T = modeTable(s.n, s.l, s.m);
    for (let k = 0; k < 12; k++) {
      const L = 2 * s.n * s.n;
      const x = (rnd() * 2 - 1) * L, y = (rnd() * 2 - 1) * L, z = (rnd() * 2 - 1) * L;
      const a = orbital(s.n, s.l, s.m, x, y, z), b = orbitalFromTable(T, x, y, z);
      const d = Math.hypot(a.re - b.re, a.im - b.im) / (Math.hypot(a.re, a.im) + 1e-6);
      if (d > worst) { worst = d; which = s.id; }
    }
  }
  judge('Q3 polynomial tables (GPU path) = recurrence oracle for all 91 states, 1e-9 rel', worst < 1e-9, { worst, which });
}
/* nodal structure: 2p_z vanishes on z = 0, 2s vanishes at r = 2, 3d_z² on cos²θ = 1/3 */
{
  const a = orbital(2, 1, 0, 1.3, -0.4, 0), b = radial(2, 0, 2), c = orbital(3, 2, 0, Math.sqrt(2 / 3) * 4, 0, Math.sqrt(1 / 3) * 4);
  judge('Q3 analytic nodes: 2p_z on z=0, 2s at r=2, 3d_z² at cos²θ=1/3', Math.abs(a.re) < 1e-15 && Math.abs(b) < 1e-15 && Math.abs(c.re) < 1e-14, [a.re, b, c.re]);
}

/* ── Q1 DIAGONAL EVOLUTION ────────────────────────────────────────────────── */
{
  const R = new Register();
  const picks = [0, 3, 7, 12, 30, 55, 90];
  for (const a of picks) R.set(a, rnd() - 0.5, rnd() - 0.5, 0);
  const n0 = R.norm();
  const t = 137.3;
  const { re, im } = R.at(t);
  let n2 = 0, worstMag = 0, worstPh = 0;
  for (let a = 0; a < N; a++) n2 += re[a] ** 2 + im[a] ** 2;
  for (const a of picks) {
    worstMag = Math.max(worstMag, Math.abs(Math.hypot(re[a], im[a]) - Math.hypot(R.re0[a], R.im0[a])));
    const dph = Math.atan2(im[a], re[a]) - Math.atan2(R.im0[a], R.re0[a]);
    const want = -BASIS[a].E * t;
    let diff = (dph - want) % (2 * PI); diff = Math.abs(((diff + 3 * PI) % (2 * PI)) - PI);
    worstPh = Math.max(worstPh, diff);
  }
  judge('Q1 norm invariant under evolution (1e-13)', Math.abs(Math.sqrt(n2) - n0) < 1e-13, { n0, nt: Math.sqrt(n2) });
  judge('Q1 |c_a(t)| = |c_a(0)|, arg advances by −E_a t exactly', worstMag < 1e-14 && worstPh < 1e-10, { worstMag, worstPh });
  judge('Q1 ⟨E⟩ invariant under evolution', Math.abs(R.energy() - (() => { let e = 0, n = 0; for (let a = 0; a < N; a++) { const p = re[a] ** 2 + im[a] ** 2; e += p * BASIS[a].E; n += p; } return e / n; })()) < 1e-14);
  /* set-at-time round trip: an edit at time t reads back at time t */
  R.set(12, 0.31, -0.22, 55.5);
  const c = R.coeffAt(12, 55.5);
  judge('Q1 set(a, c, t) then coeffAt(a, t) round-trips (edits happen at the current time)', Math.hypot(c.re - 0.31, c.im + 0.22) < 1e-14, c);
  /* stationary eigenstate: density (populations) do not move */
  const S1 = new Register(); S1.load(PRESETS[0]);
  const A1 = S1.autocorrelation(1234.5);
  judge('Q1 an eigenstate is stationary: |A(t)| = 1 for all t', Math.abs(A1.abs - 1) < 1e-14, A1.abs);
}
/* revival of the 1s+2s beat */
{
  const R = new Register(); R.load(PRESETS.find((p) => p.id === '1s+2s'));
  const T = T_BEAT_12;
  const full = R.autocorrelation(T).abs, half = R.autocorrelation(T / 2).abs, quarter = R.autocorrelation(T / 4).abs;
  judge('Q1 1s+2s: |A(T)| = 1 at T = 2π/(E₂−E₁) = ' + T.toFixed(4) + ' a.u.', Math.abs(full - 1) < 1e-12, { full, T });
  judge('Q1 1s+2s: |A(T/2)| = 0 (equal weights), |A(T/4)| = 1/√2', half < 1e-12 && Math.abs(quarter - Math.SQRT1_2) < 1e-12, { half, quarter });
  judge('Q1 1s+2s: preset loads normalized, norm = 1.000', Math.abs(R.norm() - 1) < 1e-15, R.norm());
  const Rd = new Register(); Rd.load(PRESETS.find((p) => p.id === '2s+2pz'));
  judge('Q1 2s+2p_z degenerate pair does not move: |A(t)| = 1', Math.abs(Rd.autocorrelation(99.9).abs - 1) < 1e-14);
}
/* pause/resume: no giant first step (§25) */
{
  const C = new Clock(); C.rate = 4;
  C.play(0); for (let i = 1; i <= 10; i++) C.advance(0.05 * i);   // a display loop: ten 50 ms ticks
  judge('Q6 clock: 0.5 s of wall (ten ticks) at 4 a.u./s → t = 2.0', Math.abs(C.t - 2) < 1e-12, C.t);
  C.pause(); C.play(100); const dt = C.advance(100.016);
  judge('Q6 clock: resume after 100 s pause advances 0.064, not 400 (no giant first step)', Math.abs(dt - 0.064) < 1e-12 && Math.abs(C.t - 2.064) < 1e-12, { dt, t: C.t });
  const dt2 = C.advance(105);
  judge('Q6 clock: a single wall interval is capped at 0.1 s (0.4 a.u.)', Math.abs(dt2 - 0.4) < 1e-12, dt2);
  C.pause(); const before = C.t; C.advance(200);
  judge('Q6 clock: paused advance is zero', C.t === before);
}
/* render set: mute/solo are a mask, truncation is reported */
{
  const R = new Register(); R.load(PRESETS.find((p) => p.id === 'rydberg'));
  const s0 = R.renderSet();
  R.setMute(R.populated()[0], true);
  const s1 = R.renderSet();
  judge('mute is a reconstruction mask: state digest of c unchanged, rendered set shrinks, covered fraction < 1',
    s0.rendered === 3 && s1.rendered === 2 && s1.masked === 1 && s1.coveredFraction < 1 && Math.abs(R.norm() - 1) < 1e-15, { s0: s0.rendered, s1: s1.rendered, cov: s1.coveredFraction });
  R.setSolo(R.populated()[1], true);
  judge('solo wins over mute', R.renderSet().rendered === 1);
  const Big = new Register(); for (let a = 0; a < 40; a++) Big.set(a, 1, 0, 0);
  const sb = Big.renderSet(32);                                    // an explicit cap: the register's default now holds all 91
  judge('a 40-mode state under an explicit 32-mode cap is truncated and SAYS so (the default cap now holds all 91)', sb.rendered === 32 && sb.truncated === 8 && Math.abs(sb.coveredFraction - 0.8) < 1e-12, sb);
}
/* presets all load inside the register and normalized */
{
  let ok = true, detail = [];
  for (const p of PRESETS) { const R = new Register(); R.load(p); const n = R.norm(); detail.push([p.id, R.populated().length, +n.toFixed(6)]); if (Math.abs(n - 1) > 1e-12) ok = false; }
  judge('presets: all ' + PRESETS.length + ' load, normalized', ok, detail);
}
/* STATE ROTATE about z: R_z(π/2) takes 2p_x to 2p_y (exact D-matrix on m) */
{
  const R = new Register();
  const p1 = stateOf(2, 1, 1).index, m1 = stateOf(2, 1, -1).index;
  R.set(p1, -Math.SQRT1_2, 0, 0); R.set(m1, Math.SQRT1_2, 0, 0);     // p_x = (Y_1^{-1} − Y_1^{1})/√2
  R.rotateZ(PI / 2);
  const ok = Math.hypot(R.re0[p1], R.im0[p1] - Math.SQRT1_2) < 1e-14 && Math.hypot(R.re0[m1], R.im0[m1] - Math.SQRT1_2) < 1e-14;   // p_y = i(Y_1^{-1} + Y_1^{1})/√2
  judge('Q5 STATE ROTATE R_z(π/2): 2p_x → 2p_y coefficients (i/√2, i/√2)', ok, { p1: [R.re0[p1], R.im0[p1]], m1: [R.re0[m1], R.im0[m1]] });
  const d0 = R.digest(); R.rotateZ(0.7); judge('Q5 a state rotation changes the state digest', R.digest() !== d0);
}
/* serialize / restore round trip */
{
  const R = new Register(); R.load(PRESETS.find((p) => p.id === '1s+2pz')); R.setMute(0, true);
  const j = JSON.parse(JSON.stringify(R.serialize(3.25)));
  const R2 = new Register(); const t = R2.restore(j);
  judge('Q7 serialize/restore preserves coefficients, mask, time and provenance', R2.digest() === R.digest() && t === 3.25 && R2.preset === '1s+2pz', { digest: R2.digest(), t });
}

/* ── Q2 CLASSICAL SHADOW ──────────────────────────────────────────────────── */
{
  /* (a) diagonal, the lab's own system: RK4 of the REAL system vs the closed-form complex evolution */
  const Es = [energy(1), energy(2), energy(3), energy(4), energy(2)];
  const sys = diagonalSystem(Es);
  const re = Float64Array.from([0.4, -0.3, 0.2, 0.5, 0.1]), im = Float64Array.from([0.1, 0.25, -0.35, 0.05, -0.2]);
  const { q, p } = toQP(re, im);
  const x0 = new Float64Array(10); x0.set(q, 0); x0.set(p, 5);
  const T = 40;
  const x = integrateRK4(sys, x0, T, 40000);
  let worst = 0;
  for (let a = 0; a < 5; a++) {
    const ph = -Es[a] * T, cr = re[a] * Math.cos(ph) - im[a] * Math.sin(ph), ci = re[a] * Math.sin(ph) + im[a] * Math.cos(ph);
    const back = fromQP(x.subarray(0, 5), x.subarray(5, 10));
    worst = Math.max(worst, Math.hypot(back.re[a] - cr, back.im[a] - ci));
  }
  judge('Q2 diagonal H: RK4 of q̇=Ap, ṗ=−Aq matches c(t)=e^{−iEt}c(0) to 1e-9 over 40 a.u.', worst < 1e-9, worst);
  const Hc = classicalEnergy(q, p, sys);
  let Hq = 0; for (let a = 0; a < 5; a++) Hq += (re[a] ** 2 + im[a] ** 2) * Es[a];
  judge('Q2 H_C = ½qᵀAq + ½pᵀAp + pᵀBq equals c†Hc exactly (c = (q+ip)/√2)', Math.abs(Hc - Hq) < 1e-14, { Hc, Hq });
  const G = realGenerator(sys); let asym = 0;
  for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) asym = Math.max(asym, Math.abs(G[i * 10 + j] + G[j * 10 + i]));
  judge('Q2 the real generator [[B,A],[−A,B]] is antisymmetric', asym === 0);

  /* (b) COMPLEX coupling (B ≠ 0): 2×2 Hermitian H = h0·I + h·σ, closed form e^{-iHt} via Pauli,
        against RK4 of the realified system — the complex-coupling path, not only B = 0 */
  const h0 = 0.3, hx = 0.7, hy = -0.45, hz = 0.2;                 // H = [[h0+hz, hx−i hy],[hx+i hy, h0−hz]]
  const Hre = Float64Array.from([h0 + hz, hx, hx, h0 - hz]), Him = Float64Array.from([0, -hy, hy, 0]);
  const csys = splitH(Hre, Him, 2);
  const c0re = Float64Array.from([0.8, 0.36]), c0im = Float64Array.from([-0.1, 0.47]);
  const Tc = 7.5, hh = Math.hypot(hx, hy, hz), cs = Math.cos(hh * Tc), sn = Math.sin(hh * Tc);
  // U = e^{-i h0 t} (cos(|h|t) I − i sin(|h|t) (h·σ)/|h|)
  const nx = hx / hh, ny = hy / hh, nz = hz / hh;
  // M = cos I − i sin (n·σ) ; (n·σ) = [[nz, nx − i ny],[nx + i ny, −nz]]
  const M = [[{ re: cs, im: -sn * nz }, { re: -sn * ny, im: -sn * nx }], [{ re: sn * ny, im: -sn * nx }, { re: cs, im: sn * nz }]];
  const g = { re: Math.cos(-h0 * Tc), im: Math.sin(-h0 * Tc) };
  const mul = (a, b) => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
  const want = [0, 1].map((i) => { let s = { re: 0, im: 0 }; for (let j = 0; j < 2; j++) { const t = mul(M[i][j], { re: c0re[j], im: c0im[j] }); s.re += t.re; s.im += t.im; } return mul(g, s); });
  const qp = toQP(c0re, c0im); const y0 = new Float64Array(4); y0.set(qp.q, 0); y0.set(qp.p, 2);
  const y = integrateRK4(csys, y0, Tc, 20000);
  const got = fromQP(y.subarray(0, 2), y.subarray(2, 4));
  const err = Math.max(Math.hypot(got.re[0] - want[0].re, got.im[0] - want[0].im), Math.hypot(got.re[1] - want[1].re, got.im[1] - want[1].im));
  judge('Q2 complex coupling (B ≠ 0): realified RK4 matches the Pauli closed form e^{−iHt} to 1e-9', err < 1e-9, { err, got: [got.re[0], got.im[0]], want: [want[0].re, want[0].im] });
  const e0 = classicalEnergy(qp.q, qp.p, csys), e1 = classicalEnergy(y.subarray(0, 2), y.subarray(2, 4), csys);
  judge('Q2 H_C is conserved along the real flow (complex coupling)', Math.abs(e0 - e1) < 1e-10, { e0, e1 });
}

console.log((FAILED ? 'RED' : 'GREEN') + ' hydrogen.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
