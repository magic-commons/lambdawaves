/* tests/dynamics.test.mjs — the node proof of the LAGRANGIAN picture, the action–angle chart, the dipole and the
 * particle (Bohmian) velocity field.
 *   node tests/dynamics.test.mjs
 * Anchors are hand-typed table values (⟨1s|z|2p_z⟩ = 128√2/243), exact analytic limits (2p₊'s velocity field is
 * φ̂/(r sinθ) exactly), and independent numerical routes (central differences; Simpson; RK4 of q̈ = −E²q).
 */
import { lagrangian, action, actionAngle, angularMoments, rotorEntropy, angularDipoleZ, radialDipole, dipoleZ,
  dipoleLines, psiAndGrad, bohmVelocity, bohmStep, radialMoment, radialObservables } from '../lab/dynamics.js';
import { BASIS, stateOf, orbital, radial } from '../lab/hydrogen.js';
import { Register, PRESETS } from '../lab/state.js';
import { shellMatrix, schmidt } from '../lab/frontier.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 260)));
}
const PI = Math.PI, S2 = Math.SQRT1_2;
let seed = 20260904; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
function simpson(f, a, b, n) { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * ((i % 2) ? 4 : 2); return s * h / 3; }

/* ── wave 42, the reviewer's finding 5 — FIRST, so the caches are cold: the uniform Simpson with 12000·⌈n_max²/n_min²⌉
   panels cost a 16-label hydrogen state 1.4 s on its first frame (dipoleZ 418 ms + radialObservables 1009 ms) ── */
{
  const re = new Float64Array(91), im = new Float64Array(91);
  for (const [n, l, m] of [[1, 0, 0], [2, 0, 0], [2, 1, 0], [2, 1, 1], [3, 1, 0], [3, 2, -2], [4, 1, -1], [4, 2, 2], [4, 3, 3], [5, 4, -4], [6, 0, 0], [6, 5, 5], [6, 1, 0], [5, 0, 0], [6, 2, 0], [5, 1, 0]]) re[stateOf(n, l, m).index] = 0.25;
  const ids = BASIS.filter((s) => re[s.index]).map((s) => s.index);
  const t0 = performance.now(); const dz = dipoleZ(re, im, ids); const t1 = performance.now(); const ro = radialObservables(re, im, ids, -0.1); const t2 = performance.now();
  judge('W42-5 THE FIRST FRAME OF A 16-LABEL STATE: dipoleZ + radialObservables cold in ' + (t2 - t0).toFixed(1) + ' ms (< 100; it was 1427 ms) — the radial integrals are Gauss–Legendre on doubling panels now, 24 points per panel, exponentially convergent (the 1s–4p and 1s–6p elements are judged against mpmath in tests/radiation.test.mjs)',
    t2 - t0 < 100 && isFinite(dz.value) && isFinite(ro.r) && isFinite(ro.rinv) && Math.abs(dz.value + 6.99358203) < 1e-6 && Math.abs(ro.r - 21.8338696) < 1e-6,
    { dipoleMs: +(t1 - t0).toFixed(1), radialMs: +(t2 - t1).toFixed(1), z: dz.value, r: ro.r, rinv: ro.rinv });
}

/* ── L, T, V, H and the virial ────────────────────────────────────────────── */
{
  const R = new Register(); R.load(PRESETS.find((p) => p.id === '1s+2s'));
  const ids = R.populated();
  const at = (t) => { const c = R.at(t); return lagrangian(c.re, c.im, ids); };
  const l0 = at(0);
  judge('D L = T − V and H = T + V, and H is ⟨H⟩ per unit norm (the shadow\'s H_C = c†Hc)', Math.abs(l0.L - (l0.T - l0.V)) < 1e-15 && Math.abs(l0.H - (l0.T + l0.V)) < 1e-15 && Math.abs(l0.H - R.energy() * R.norm2()) < 1e-14, l0);
  /* the virial over one full beat: ⟨T⟩ = ⟨V⟩ = ½⟨H⟩ and ⟨L⟩ = 0 */
  // L's a-th term oscillates at 2|E_a| (periods 2π for 1s and 8π for 2s), so the common period is 8π — an average
  // over anything else leaves a residue, which is what a first version of this test measured
  const T = 8 * PI;
  const mT = simpson((t) => at(t).T, 0, T, 20000) / T, mV = simpson((t) => at(t).V, 0, T, 20000) / T, mL = simpson((t) => at(t).L, 0, T, 20000) / T;
  judge('D the virial theorem of the shadow: ⟨T⟩ = ⟨V⟩ = ½⟨H⟩ and ⟨L⟩ = 0 over a period (1e-9)', Math.abs(mT - mV) < 1e-9 && Math.abs(mT - l0.H / 2) < 1e-9 && Math.abs(mL) < 1e-9, { mT, mV, mL, halfH: l0.H / 2 });
  /* the closed-form action against ∫L dt */
  let worst = 0;
  for (const t of [3.3, 11.7, 40.2, 137.5]) {
    const num = simpson((u) => at(u).L, 0, t, 40000), cf = action(R.re0, R.im0, t, ids);
    worst = Math.max(worst, Math.abs(num - cf));
  }
  judge('D the action S(t) = ½Σ|c_a|²[sin 2θ_a(t) − sin 2θ_a(0)] equals ∫₀ᵗ L dt′ at four times (1e-9)', worst < 1e-9, worst);
  /* action–angle: J is the population, θ is the phase */
  const c = R.at(7.77), aa = actionAngle(c.re, c.im, ids);
  let wj = 0, wt = 0;
  for (const x of aa) { wj = Math.max(wj, Math.abs(x.J - R.population(x.a))); const want = Math.atan2(c.im[x.a], c.re[x.a]); wt = Math.max(wt, Math.abs(x.theta - want)); }
  judge('D the action variable J_a = (1/2π)∮p dq IS the population |c_a|², and its angle is arg c_a — SPECTRUM is the action–angle chart of SHADOW', wj < 1e-15 && wt < 1e-15 && aa.length === 2, { wj, wt });
  /* Euler–Lagrange: q̈ = −E²q reproduces the closed form */
  {
    const a0 = ids[0], E = BASIS[a0].E;
    let q = Math.SQRT2 * R.re0[a0], v = Math.SQRT2 * R.im0[a0] * E;         // q̇ = E p
    const dt = 1e-4, steps = 300000;
    const acc = (x) => -E * E * x;
    for (let i = 0; i < steps; i++) {
      const k1v = acc(q), k1q = v;
      const k2v = acc(q + dt / 2 * k1q), k2q = v + dt / 2 * k1v;
      const k3v = acc(q + dt / 2 * k2q), k3q = v + dt / 2 * k2v;
      const k4v = acc(q + dt * k3q), k4q = v + dt * k3v;
      q += dt / 6 * (k1q + 2 * k2q + 2 * k3q + k4q); v += dt / 6 * (k1v + 2 * k2v + 2 * k3v + k4v);
    }
    const tEnd = dt * steps, want = Math.SQRT2 * R.at(tEnd).re[a0];
    judge('D Euler–Lagrange: RK4 of q̈ = −E²q (the Lagrangian equation of motion) reproduces √2 Re c(t) over 30 a.u. (1e-9)', Math.abs(q - want) < 1e-9, { got: q, want, t: tEnd });
  }
}
/* ── exact angular moments and the rotor entropy ──────────────────────────── */
{
  const mk = (list) => { const re = new Float64Array(91), im = new Float64Array(91); for (const [n, l, m, r, i] of list) { re[stateOf(n, l, m).index] = r; im[stateOf(n, l, m).index] = i || 0; } return { re, im }; };
  const circ = mk([[2, 1, 1, 1]]), mix = mk([[2, 1, 1, S2], [2, 1, -1, S2]]), s2 = mk([[2, 0, 0, 1]]), stark = mk([[2, 0, 0, S2], [2, 1, 0, S2]]);
  const A = angularMoments(circ.re, circ.im), B = angularMoments(mix.re, mix.im), C = angularMoments(stark.re, stark.im);
  judge('D ⟨L_z⟩ and ⟨L²⟩ are exact and diagonal: 2p₊ gives (1, 2); (2p₊ + 2p₋)/√2 gives (0, 2); the Stark state gives (0, 1)',
    Math.abs(A.Lz - 1) < 1e-15 && Math.abs(A.L2 - 2) < 1e-15 && Math.abs(B.Lz) < 1e-15 && Math.abs(B.L2 - 2) < 1e-15 && Math.abs(C.Lz) < 1e-15 && Math.abs(C.L2 - 1) < 1e-15, { A, B, C });
  const e2s = rotorEntropy(schmidt(shellMatrix(s2.re, s2.im, 2)).values), est = rotorEntropy(schmidt(shellMatrix(stark.re, stark.im, 2)).values);
  judge('D the entanglement entropy of the two SO(4) rotors: 2s is maximally entangled (ln 2) and the Stark state is a product (0)', Math.abs(e2s - Math.log(2)) < 1e-12 && est < 1e-12, { s2: e2s, ln2: Math.log(2), stark: est });
}
/* ── the dipole ───────────────────────────────────────────────────────────── */
{
  judge('D the z selection rule: ⟨Y_00|cosθ|Y_10⟩ = 1/√3, ⟨Y_10|cosθ|Y_20⟩ = 2/√15, and Δl = 0 or |Δm| = 1 gives exactly 0',
    Math.abs(angularDipoleZ(0, 0, 1, 0) - 1 / Math.sqrt(3)) < 1e-15 && Math.abs(angularDipoleZ(1, 0, 2, 0) - 2 / Math.sqrt(15)) < 1e-15 &&
    angularDipoleZ(1, 0, 1, 0) === 0 && angularDipoleZ(0, 0, 1, 1) === 0, { a: angularDipoleZ(0, 0, 1, 0), b: angularDipoleZ(1, 0, 2, 0) });
  const z12 = angularDipoleZ(0, 0, 1, 0) * radialDipole(1, 0, 2, 1);
  judge('D ⟨1s|z|2p_z⟩ = 128√2/243 = 0.7449 (hand-typed from the table, not from this generator)', Math.abs(Math.abs(z12) - 128 * Math.SQRT2 / 243) < 1e-7, { got: z12, want: 128 * Math.SQRT2 / 243 });
  /* the flagship preset's dipole oscillates at the Bohr frequency with that amplitude */
  const R = new Register(); R.load(PRESETS.find((p) => p.id === '1s+2pz'));
  const ids = R.populated(), om = 0.5 - 0.125;
  let worst = 0;
  for (const t of [0, 2.2, 6.6, 13.1, 16.755 / 2]) {
    const c = R.at(t), d = dipoleZ(c.re, c.im, ids).value;
    worst = Math.max(worst, Math.abs(Math.abs(d) - Math.abs(128 * Math.SQRT2 / 243 * Math.cos(om * t))));
  }
  judge('D the 1s+2p_z preset\'s dipole is ⟨z⟩(t) = 0.7449 cos(0.375 t): the beat the lab is named for, at five times (1e-7)', worst < 1e-7, worst);
  const lines = dipoleLines(R.at(0).re, R.at(0).im, ids);
  judge('D its emission spectrum is ONE line at ω = 0.375 a.u. (T = 16.755), and a single-l state has none at all', lines.length === 1 && Math.abs(lines[0].omega - om) < 1e-15 && Math.abs(lines[0].period - 16.7552) < 1e-3 && dipoleLines(...(() => { const S = new Register(); S.load(PRESETS.find((p) => p.id === '2p+')); return [S.re0, S.im0, S.populated()]; })()).length === 0, lines[0]);
}
/* ── radial moments and the atom's own virial theorem ─────────────────────── */
{
  const mk = (list) => { const re = new Float64Array(91), im = new Float64Array(91), ids = []; for (const [n, l, m, r] of list) { const a = stateOf(n, l, m).index; re[a] = r; ids.push(a); } return { re, im, ids }; };
  let wr = 0, wi = 0;
  for (const [n, l] of [[1, 0], [2, 0], [2, 1], [3, 1], [4, 2], [6, 5]]) {
    const s = mk([[n, l, 0, 1]]);
    const o = radialObservables(s.re, s.im, s.ids, -0.5 / (n * n));
    wr = Math.max(wr, Math.abs(o.r - (3 * n * n - l * (l + 1)) / 2) / ((3 * n * n) / 2));
    wi = Math.max(wi, Math.abs(o.rinv - 1 / (n * n)) * n * n);
  }
  judge('D ⟨r⟩ = (3n² − l(l+1))/2 and ⟨1/r⟩ = 1/n² for six eigenstates (the closed forms, 1e-6 relative)', wr < 1e-6 && wi < 1e-6, { r: wr, rinv: wi });
  const s = mk([[3, 1, 0, 1]]);
  const o = radialObservables(s.re, s.im, s.ids, -0.5 / 9);
  judge('D the ATOM\'s virial theorem: 2⟨T⟩ = −⟨V⟩ exactly, i.e. ⟨T⟩ = −E and ⟨V⟩ = 2E — a different statement from the shadow\'s harmonic ⟨T⟩ = ⟨V⟩, and both hold here',
    Math.abs(o.virial - 1) < 1e-6 && Math.abs(o.T - 0.5 / 9) < 1e-7 && Math.abs(o.V + 1 / 9) < 1e-7, o);
}

/* ── the particle velocity field ──────────────────────────────────────────── */
{
  const mk = (list) => { const re = new Float64Array(91), im = new Float64Array(91), ids = []; for (const [n, l, m, r, i] of list) { const a = stateOf(n, l, m).index; re[a] = r; im[a] = i || 0; ids.push(a); } return { re, im, ids }; };
  /* ∇ψ analytically against central differences on the independent closed form `orbital` */
  const st = mk([[1, 0, 0, 0.6], [2, 1, 0, 0.5], [3, 2, 2, 0.4], [4, 1, -1, 0.3]]);
  let worst = 0, at = null;
  for (let k = 0; k < 40; k++) {
    const x = (rnd() * 2 - 1) * 9, y = (rnd() * 2 - 1) * 9, z = (rnd() * 2 - 1) * 9;
    if (Math.hypot(x, y, z) < 0.4) continue;
    const s = psiAndGrad(st.re, st.im, st.ids, x, y, z);
    const h = 1e-5;
    const psi = (X, Y, Z) => { let pr = 0, pi = 0; for (const a of st.ids) { const b = BASIS[a], o = orbital(b.n, b.l, b.m, X, Y, Z); pr += st.re[a] * o.re - st.im[a] * o.im; pi += st.re[a] * o.im + st.im[a] * o.re; } return { re: pr, im: pi }; };
    const num = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((e) => {
      const p = psi(x + h * e[0], y + h * e[1], z + h * e[2]), m = psi(x - h * e[0], y - h * e[1], z - h * e[2]);
      return { re: (p.re - m.re) / (2 * h), im: (p.im - m.im) / (2 * h) };
    });
    const an = [s.gx, s.gy, s.gz], scale = Math.max(1e-12, Math.max(...num.map((g) => Math.hypot(g.re, g.im))));
    for (let i = 0; i < 3; i++) { const d = Math.hypot(an[i].re - num[i].re, an[i].im - num[i].im) / scale; if (d > worst) { worst = d; at = [x, y, z]; } }
  }
  judge('D ∇ψ analytic (the GPU\'s own polynomial tables, differentiated) = central differences on the recurrence oracle, four modes, 40 holdout points (1e-7 rel)', worst < 1e-7, { worst, at });
  /* 2p₊: the velocity field is EXACTLY φ̂/(r sinθ) — a pure circulation, the textbook Bohmian orbit */
  const circ = mk([[2, 1, 1, 1]]);
  let wv = 0;
  for (const [x, y, z] of [[1.3, 0.4, 0.9], [-2.1, 1.7, -0.6], [0.8, -3.2, 2.2], [4.0, 0.1, 0.0]]) {
    const r = Math.hypot(x, y, z), rho = Math.hypot(x, y);
    const b = bohmVelocity(circ.re, circ.im, circ.ids, x, y, z);
    const want = [-y / (rho * rho), x / (rho * rho), 0];                   // φ̂/(r sinθ) = (−y, x, 0)/ρ²
    wv = Math.max(wv, Math.hypot(b.v[0] - want[0], b.v[1] - want[1], b.v[2] - want[2]));
  }
  judge('D the particle field of 2p₊ is exactly φ̂/(r sinθ): a rigid circulation about z, dφ/dt = 1/ρ² (1e-12)', wv < 1e-12, wv);
  /* an integrated trajectory in 2p₊ stays on its circle and closes at the predicted period */
  {
    const p0 = [2.0, 0, 1.0], rho = 2.0, T = 2 * PI * rho * rho;
    let p = p0.slice();
    const coeffsAt = () => ({ re: circ.re, im: circ.im });
    const N = 4000, dt = T / N;
    for (let i = 0; i < N; i++) { const q = bohmStep(coeffsAt, circ.ids, p, i * dt, dt, 1e9); if (!q) break; p = q; }
    judge('D and an integrated trajectory closes on itself after T = 2πρ² = ' + T.toFixed(3) + ' a.u., keeping ρ and z (1e-6)', Math.hypot(p[0] - p0[0], p[1] - p0[1], p[2] - p0[2]) < 1e-6, { start: p0, end: p.map((v) => +v.toFixed(8)) });
  }
  /* a REAL STATIONARY state has v ≡ 0: the Bohmian particle of 1s, 2p_z or 3d_z² does not move at all */
  {
    let w = 0;
    for (const st of [[[1, 0, 0, 1]], [[2, 1, 0, 1]], [[3, 2, 0, 1]]]) {
      const s = mk(st);
      for (const [x, y, z] of [[1.1, 0.7, 2.2], [-2.3, 0.4, -1.1], [0.3, -1.9, 3.3]]) {
        const b = bohmVelocity(s.re, s.im, s.ids, x, y, z);
        if (b) w = Math.max(w, Math.hypot(...b.v));
      }
    }
    judge('D a real stationary state has velocity field IDENTICALLY zero — the Bohmian particle of 1s, 2p_z or 3d_z² sits still (1e-15)', w < 1e-15, w);
  }
  /* and a trajectory cannot cross a nodal surface: 2p_z + 3p_z keeps the plane z = 0 nodal at every time */
  {
    const pz = mk([[2, 1, 0, 0.7], [3, 1, 0, 0.7]]);
    const R = new Register(); for (const a of pz.ids) R.set(a, pz.re[a], pz.im[a], 0);
    const coeffsAt = (t) => R.at(t);
    let p = [0.9, 0.3, 1.4], crossed = false, moved = 0;
    for (let i = 0; i < 3000; i++) { const q = bohmStep(coeffsAt, pz.ids, p, i * 0.01, 0.01); if (!q) break; moved += Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]); p = q; if (p[2] <= 0) crossed = true; }
    judge('D a trajectory of 2p_z + 3p_z (both ∝ cos θ, so z = 0 is nodal at every time) moves and never crosses it', !crossed && moved > 0.05 && p[2] > 0, { z: p[2], arc: +moved.toFixed(4) });
  }
}

/* ── wave 42, the reviewer's finding 10: the φ-gradient was dropped on the axis (sin θ < 1e-9 → 0/0 → 0) ── */
{
  const mk = (n, l, m) => { const re = new Float64Array(91), im = new Float64Array(91), a = stateOf(n, l, m).index; re[a] = 1; return { re, im, ids: [a] }; };
  const p1 = mk(2, 1, 1), on = psiAndGrad(p1.re, p1.im, p1.ids, 0, 0, 1), off = psiAndGrad(p1.re, p1.im, p1.ids, 1e-8, 0, 1);   // 1e-8 off: the second derivative moves g by ~2e-10 there
  const exact = -Math.exp(-0.5) / (8 * Math.sqrt(PI));                                     // ∂_y[−(x+iy)e^{−r/2}/(8√π)] at (0,0,1) = −i e^{−1/2}/(8√π)
  const d1 = mk(3, 2, 1), on3 = psiAndGrad(d1.re, d1.im, d1.ids, 0, 0, -2), off3 = psiAndGrad(d1.re, d1.im, d1.ids, 0, 1e-8, -2);
  const d2 = mk(3, 2, 2), on22 = psiAndGrad(d2.re, d2.im, d2.ids, 0, 0, 1.5);
  const dev = (a, b) => Math.max(Math.abs(a.gx.re - b.gx.re), Math.abs(a.gx.im - b.gx.im), Math.abs(a.gy.re - b.gy.re), Math.abs(a.gy.im - b.gy.im), Math.abs(a.gz.re - b.gz.re), Math.abs(a.gz.im - b.gz.im));
  judge('W42-10 ∇ψ ON THE AXIS: 2p₊1 at (0, 0, 1) has g_y = −0.04277i — the closed form −e^{−1/2}/(8√π) to 1e-12 and the off-axis limit at x = 1e-8 to 1e-9 (it read g_y = 0); 3d₊1 at (0, 0, −2) matches its off-axis limit to 1e-9, and 3d₊2 (sin²θ: no gradient on the axis) is finite and 0 there — (∂_φψ)/sin θ is carried with sin^{|m|−1}θ, as electrostatics.js\'s thetaFuncs do',
    Math.abs(on.gy.im - exact) < 1e-12 && Math.abs(on.gy.re) < 1e-15 && dev(on, off) < 1e-9 && dev(on3, off3) < 1e-9 && [on22.gx, on22.gy, on22.gz].every((g) => isFinite(g.re) && isFinite(g.im) && Math.abs(g.re) < 1e-15 && Math.abs(g.im) < 1e-15),
    { gy_on: on.gy, exact, gy_off: off.gy, dev2p: dev(on, off), dev3d1: dev(on3, off3) });
}
console.log((FAILED ? 'RED' : 'GREEN') + ' dynamics.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
