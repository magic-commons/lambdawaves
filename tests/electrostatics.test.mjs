/* tests/electrostatics.test.mjs — the node proof of W-FIELD (the ELECTROSTATICS window).
 *   node tests/electrostatics.test.mjs
 * Oracles: Sol's closed form on the axis for (1s+2p_z)/√2 (ledger Q1: −0.568025637, −0.357019862, −0.145345133); an
 * INDEPENDENT route for the same potential — a spherical Gauss–Legendre quadrature of |ψ|² taken straight from
 * hydrogen.js psiAt, centred on the observation point (no Gaunt, no Legendre, no gammas anywhere in it); the 1s closed
 * form −(1 − (1+r)e^{−2r})/r; Sol's Biot–Savart closed form B_z(z) = −12.516824431/24 [γ(5,z)/z³ + Γ(2,z)] T (Q5);
 * Opus/P7's Hellmann–Feynman numbers at R = 2 (F_elec −0.13390616, Pulay 0.06228945, bound 0.102024) and a B-centred
 * quadrature of the LCAO density done here; C.3's v_φ = m/(r sin θ) for the current.
 */
import { BASIS, psiAt, factorial } from '../lab/hydrogen.js';
import { multipoles, createElectrostatics, hellmannFeynman, gaussLegendre, radialPanels, inverseSquareIntegral, B_TESLA } from '../lab/electrostatics.js';
import { overlapS } from '../lab/molecule.js';

const T0 = performance.now();
let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 400)));
}
const idx = (n, l, m) => BASIS.findIndex((s) => s.n === n && s.l === l && s.m === m);
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const fmt = (x, d = 9) => +x.toFixed(d);

/* ── the states ──────────────────────────────────────────────────────────────────────────────────────────────────── */
const ONE_S = [{ a: idx(1, 0, 0), re: 1, im: 0 }];
const PZ = [{ a: idx(2, 1, 0), re: 1, im: 0 }];
const P1 = [{ a: idx(2, 1, 1), re: 1, im: 0 }];
const PX = [{ a: idx(2, 1, 1), re: -Math.SQRT1_2, im: 0 }, { a: idx(2, 1, -1), re: Math.SQRT1_2, im: 0 }];  // 2p_x, real
const SPZ = [{ a: idx(1, 0, 0), re: Math.SQRT1_2, im: 0 }, { a: idx(2, 1, 0), re: Math.SQRT1_2, im: 0 }];   // (1s+2p_z)/√2, t = 0
const FOUR = [[2, 1, -1], [2, 1, 1], [4, 1, -1], [4, 2, 2]].map(([n, l, m]) => ({ a: idx(n, l, m), re: 0.5, im: 0 }));   // Josh's state
const SIX3 = [[1, 0, 0, 0.5, 0.1], [2, 1, -1, 0.3, -0.2], [2, 1, 1, -0.2, 0.4], [3, 0, 0, 0.35, 0.05], [3, 2, 0, 0.1, -0.3], [3, 2, 2, 0.25, 0.2]];
const TWELVE = [[1, 0, 0], [2, 0, 0], [2, 1, 0], [2, 1, 1], [3, 1, 0], [3, 2, -2], [4, 1, -1], [4, 2, 2], [4, 3, 3], [5, 4, -4], [6, 0, 0], [6, 5, 5]];
function normalised(list) {                                   // deterministic pseudo-random complex amplitudes (an LCG), normalised
  let seed = 12345; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 - 0.5; };
  const t = list.map(([n, l, m, re, im]) => ({ a: idx(n, l, m), re: re ?? rnd(), im: im ?? rnd() }));
  const nrm = Math.sqrt(t.reduce((s, c) => s + c.re * c.re + c.im * c.im, 0));
  return t.map((c) => ({ a: c.a, re: c.re / nrm, im: c.im / nrm }));
}
const S6 = normalised(SIX3), S12 = normalised(TWELVE);
const arrays = (terms) => { const re = new Float64Array(91), im = new Float64Array(91); for (const t of terms) { re[t.a] = t.re; im[t.a] = t.im; } return { re, im, ind: terms.map((t) => t.a) }; };

/* ── the independent route: Φ_e(P) = −∫ |ψ(P + s ŝ)|² s ds dΩ, spherical GL quadrature centred on P, pole toward the nucleus;
 *    cos θ = 1 − 2v⁴ so the spike the cloud makes on the spheres s ≈ d is a smooth even function of v ─────────────────── */
function phiBrute(terms, P, { nRad = 20, nTheta = 48, nPhi = 32 } = {}) {
  const { re, im, ind } = arrays(terms);
  let nmax = 1; for (const t of terms) nmax = Math.max(nmax, BASIS[t.a].n);
  const rMax = nmax * (15 + 2.25 * nmax), d = Math.hypot(...P);
  const e3 = d > 1e-12 ? P.map((c) => -c / d) : [0, 0, 1], a = Math.abs(e3[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
  let e1 = [a[1] * e3[2] - a[2] * e3[1], a[2] * e3[0] - a[0] * e3[2], a[0] * e3[1] - a[1] * e3[0]]; const n1 = Math.hypot(...e1); e1 = e1.map((v) => v / n1);
  const e2 = [e3[1] * e1[2] - e3[2] * e1[1], e3[2] * e1[0] - e3[0] * e1[2], e3[0] * e1[1] - e3[1] * e1[0]];
  const bounds = radialPanels(d, rMax);
  const { x: gx, w: gw } = gaussLegendre(nRad), { x: tx, w: tw } = gaussLegendre(nTheta);
  let acc = 0, count = 0;
  for (let p = 0; p + 1 < bounds.length; p++) {
    const h = (bounds[p + 1] - bounds[p]) / 2, c = (bounds[p] + bounds[p + 1]) / 2;
    for (let i = 0; i < nRad; i++) { const s = c + h * gx[i], ws = gw[i] * h * s;
      for (let k = 0; k < nTheta; k++) { const v = 0.5 + 0.5 * tx[k], ct = 1 - 2 * v ** 4, st = Math.sqrt(Math.max(0, 1 - ct * ct)), wk = ws * 0.5 * tw[k] * 8 * v * v * v * (2 * Math.PI / nPhi);
        for (let q = 0; q < nPhi; q++) { const ph = 2 * Math.PI * (q + 0.5) / nPhi, cp = Math.cos(ph), sp = Math.sin(ph);
          const x = P[0] + s * (st * cp * e1[0] + st * sp * e2[0] + ct * e3[0]), y = P[1] + s * (st * cp * e1[1] + st * sp * e2[1] + ct * e3[1]), z = P[2] + s * (st * cp * e1[2] + st * sp * e2[2] + ct * e3[2]);
          const v = psiAt(re, im, x, y, z, ind); acc += wk * (v.re * v.re + v.im * v.im); count++;
        } } }
  }
  return { phi: -acc, points: count, panels: bounds.length - 1 };
}
const sphereAverage = (f, r, nTheta = 24, nPhi = 48) => { const { x, w } = gaussLegendre(nTheta); let s = 0; for (let k = 0; k < nTheta; k++) { const st = Math.sqrt(1 - x[k] * x[k]); for (let q = 0; q < nPhi; q++) { const ph = 2 * Math.PI * q / nPhi; s += w[k] * f(r * st * Math.cos(ph), r * st * Math.sin(ph), r * x[k]) / nPhi; } } return s / 2; };

/* ── 0. constants ────────────────────────────────────────────────────────────────────────────────────────────────── */
judge('THE TESLA: μ₀eħ/(4π m_e a₀³) = 12.516824431 T (Sol Q5, CODATA 2018)', near(B_TESLA, 12.516824431, 1e-8), { B_TESLA });

/* ── 1. Sol's gate: Φ_e on the +z axis for (1s+2p_z)/√2 ──────────────────────────────────────────────────────────── */
{
  const F = createElectrostatics(SPZ);
  const want = { 1: -0.568025637, 3: -0.357019862, 8: -0.145345133 }, got = {}, brute = {};
  let ok = true, okB = true, maxB = 0;
  for (const r of [1, 3, 8]) { got[r] = F.phiE(0, 0, r); if (!near(got[r], want[r], 1e-7)) ok = false; }
  judge('SOL Q1: Φ_e(0,0,r) for (1s+2p_z)/√2 at t = 0: r = 1 → −0.568025637, r = 3 → −0.357019862, r = 8 → −0.145345133, each to 1e-7', ok, Object.fromEntries([1, 3, 8].map((r) => [r, fmt(got[r])])));
  judge('the table has the three slots Sol counted (L = 0, 1, 2; M = 0), β ∈ {2, 3/2, 1}', F.meta.slots === 3 && F.meta.Lmax === 2 && F.meta.betaClasses === 3, F.meta);
  const t0 = performance.now();
  for (const r of [1, 3, 8]) { const b = phiBrute(SPZ, [0, 0, r]); brute[r] = b; const d = Math.abs(b.phi - got[r]); maxB = Math.max(maxB, d); if (d > 1e-4) okB = false; }
  const ms = performance.now() - t0;
  judge('INDEPENDENT ROUTE: the same Φ_e by spherical quadrature of |ψ|² from psiAt centred on the point (' + brute[1].panels + ' radial panels × 20 GL × 48 polar × 32 azimuthal = ' + brute[1].points + ' points each, no multipoles) agrees to 1e-4 — it agrees to ' + maxB.toExponential(1) + ' in ' + ms.toFixed(0) + ' ms', okB, Object.fromEntries([1, 3, 8].map((r) => [r, [fmt(got[r]), fmt(brute[r].phi)]])));
  const tot = F.phi(0, 0, 3), nuc = 1 / 3;
  judge('phi = +Z/r + Φ_e: at (0,0,3) the total is 1/3 − 0.357019862', near(tot, nuc + want[3], 1e-7), { tot });
}

/* ── 2. the 1s closed form, and −1/r at large r ──────────────────────────────────────────────────────────────────── */
{
  const F = createElectrostatics(ONE_S);
  const cf = (r) => -(1 - (1 + r) * Math.exp(-2 * r)) / r;
  const rows = [0.5, 2, 5].map((r) => [r, F.phiE(r, 0, 0), cf(r), F.phiE(0, r / Math.SQRT2, r / Math.SQRT2)]);
  judge('1s: Φ_e = −(1 − (1+r)e^{−2r})/r to 1e-12 at r = 0.5, 2, 5 (on the x axis and off it)', rows.every(([, a, b, c]) => near(a, b, 1e-12) && near(c, b, 1e-12)), rows.map((v) => v.map((x) => fmt(x, 13))));
  judge('1s at the origin: Φ_e(0) → −1 (the finite value −∫ρ/r = −Z), no NaN', near(F.phiE(0, 0, 0), -1, 1e-9), { at0: F.phiE(0, 0, 0) });
  const F2 = createElectrostatics(ONE_S, { Z: 2 }), cfZ = (r, Z) => -(1 - (1 + Z * r) * Math.exp(-2 * Z * r)) / r;
  const rowsZ = [0.5, 2, 5].map((r) => [r, F2.phiE(0, r, 0), cfZ(r, 2), F2.phi(0, r, 0) - 2 / r]);
  judge('the dilation Z = 2 (He⁺ 1s): Φ_e = −(1 − (1+Zr)e^{−2Zr})/r to 1e-12 and phi = Z/r + Φ_e', rowsZ.every(([, a, b, c]) => near(a, b, 1e-12) && near(c, b, 1e-12)), rowsZ.map((v) => v.map((x) => fmt(x, 12))));
  /* Φ_e → −1/r: the sphere average kills every L ≥ 1 multipole, so for a normalised state it is −(charge inside)/r exactly */
  const states = { '1s': ONE_S, '2p+1': P1, '(1s+2pz)/√2': SPZ, 'six terms n≤3': S6 };
  const avg = Object.fromEntries(Object.entries(states).map(([k, t]) => [k, sphereAverage(createElectrostatics(t).phiE, 40)]));
  judge('Φ_e → −1/r for any normalised state: the sphere average of Φ_e at r = 40 is −1/40 to 1e-6 for 1s, 2p₊1, (1s+2p_z)/√2 and a six-term n ≤ 3 state (pointwise, the physical dipole/quadrupole remain: (1s+2p_z)/√2 has d_z = 0.745 → 4.7e-4 at r = 40)', Object.values(avg).every((v) => near(v, -1 / 40, 1e-6)), Object.fromEntries(Object.entries(avg).map(([k, v]) => [k, fmt(v + 1 / 40, 10)])));
  /* the monopole slot carries the charge: √(4π) Σ_β Σ_q C_q (q+2)!/β^{q+3} = 1 for a normalised state (every shell) */
  const charge = (terms) => { const T = multipoles(terms), s0 = T.slots.find((s) => s.L === 0 && s.M === 0); let q0 = 0; for (const t of s0.terms) for (let q = t.qmin; q <= t.qmax; q++) q0 += t.re[q] * factorial(q + 2) / Math.pow(t.beta, q + 3); return Math.sqrt(4 * Math.PI) * q0; };
  judge('the L = 0 slot integrates to the charge 1 to 1e-12 for the 12-term state (n = 1…6, L ≤ 10) and Josh\'s four-channel state', near(charge(S12), 1, 1e-12) && near(charge(FOUR), 1, 1e-12), { twelve: charge(S12), four: charge(FOUR) });
}

/* ── 3. the general machinery: 121 slots, complex M ≠ 0, against the brute-force route ───────────────────────────── */
{
  const F4 = createElectrostatics(FOUR), F12 = createElectrostatics(S12);
  const P4 = [3, 1.5, 2], P12 = [2, -1, 1.5];
  const t0 = performance.now();
  const b4 = phiBrute(FOUR, P4, { nTheta: 40, nPhi: 32 }), b12 = phiBrute(S12, P12, { nTheta: 40, nPhi: 32 });
  const ms = performance.now() - t0;
  const g4 = F4.phiE(...P4), g12 = F12.phiE(...P12);
  judge('GENERAL: Josh\'s four-channel state (M up to 3, L up to 4) at (3, 1.5, 2) and the 12-term state (' + F12.meta.slots + ' slots, L ≤ ' + F12.meta.Lmax + ', M ≤ ' + F12.meta.Mmax + ', ' + F12.meta.betaClasses + ' β-classes) at (2, −1, 1.5): closed form = brute force to 1e-5 (' + ms.toFixed(0) + ' ms)', near(g4, b4.phi, 1e-5) && near(g12, b12.phi, 1e-5), { four: [fmt(g4), fmt(b4.phi)], twelve: [fmt(g12), fmt(b12.phi)] });
  judge('dedup by conjugacy: the 12-term table stores only M ≥ 0, at most 66 of the 121 slots', F12.table.slots.every((s) => s.M >= 0) && F12.meta.slots <= 66, { slots: F12.meta.slots, radialTerms: F12.meta.radialTerms });
  /* −∇Φ against a central difference, h scaled to r */
  let worst = 0; const pts = [[1.2, -0.7, 0.4], [3, 1.5, 2], [-2, 4, -1.5], [0.3, 0.1, 0.9], [0, 0, 2.5]];
  for (const P of pts) { const h = 1e-4 * Math.max(1, Math.hypot(...P)), E = F12.E(...P);
    for (let c = 0; c < 3; c++) { const Pp = [...P], Pm = [...P]; Pp[c] += h; Pm[c] -= h; const q = -(F12.phi(...Pp) - F12.phi(...Pm)) / (2 * h); worst = Math.max(worst, Math.abs(q - E[c])); } }
  judge('E = −∇Φ analytic (12-term state, five points incl. the axis) equals the central difference quotient to 1e-6 — worst ' + worst.toExponential(2), worst < 1e-6, { worst });
  const Ez = F12.E(0, 0, 2.5), qz = -(F12.phi(0, 0, 2.5 + 1e-4) - F12.phi(0, 0, 2.5 - 1e-4)) / 2e-4;
  judge('on the axis (sin θ = 0) the field is finite and right (no 0/0 from the M ≥ 1 slots)', Ez.every(isFinite) && near(Ez[2], qz, 1e-6), { Ez: Ez.map((v) => fmt(v)) });
}

/* ── 4. the probability current ──────────────────────────────────────────────────────────────────────────────────── */
{
  const Fp = createElectrostatics(P1), Fd = createElectrostatics([{ a: idx(4, 2, 2), re: 1, im: 0 }]);
  /* 2p₊1: j = ϱ e^{−r}/(64π) φ̂ (Sol Q5), v_φ = j/ρ = 1/ϱ (C.3) */
  let okJ = true, okV = true; const rows = [];
  for (const [x, y, z] of [[1, 0, 0], [0, 2, 0.5], [2, 3, -1], [-4, 1, 2]]) {
    const rho = Math.hypot(x, y), r = Math.hypot(x, y, z), J = Fp.j(x, y, z), jphi = rho * Math.exp(-r) / (64 * Math.PI);
    const want = [-jphi * y / rho, jphi * x / rho, 0]; const p = Fp.psi(x, y, z), dens = p.re * p.re + p.im * p.im;
    if (!want.every((w, i) => near(J[i], w, 1e-14))) okJ = false;
    if (!near(Math.hypot(...J) / dens, 1 / rho, 1e-10)) okV = false; rows.push([Math.hypot(...J) / dens, 1 / rho]);
  }
  judge('2p₊1: j = Im(ψ*∇ψ) equals ϱ e^{−r}/(64π) φ̂ to 1e-14 at four points (analytic ∇ψ from the radial polynomials and the modeTable angular record)', okJ);
  judge('C.3: v_φ = |j|/ρ = m/(r sin θ) = 1/ϱ to 1e-10', okV, rows.map((v) => v.map((x) => fmt(x, 6))));
  /* ∇·j = 0 for a stationary orbital: central differences of the analytic j */
  const div = (F, P) => { const h = 1e-4; let s = 0; for (let c = 0; c < 3; c++) { const Pp = [...P], Pm = [...P]; Pp[c] += h; Pm[c] -= h; s += (F.j(...Pp)[c] - F.j(...Pm)[c]) / (2 * h); } return s; };
  const divs = [[Fp, [1, 0.5, 0.3]], [Fp, [2, -1, 1]], [Fd, [3, 1, 2]], [Fd, [-2, 4, 0.5]]].map(([F, P]) => div(F, P));
  judge('∇·j = 0 for the stationary orbitals 2p₊1 and 4d₊2 (spot check, four points, |∇·j| < 1e-9)', divs.every((d) => Math.abs(d) < 1e-9), divs.map((d) => d.toExponential(2)));
  const Fz = createElectrostatics(PZ), Fx = createElectrostatics(PX);
  const zeros = [[1, 0.5, 0.3], [2, -1, 1], [0, 0, 1.5]].map((P) => [...Fz.j(...P), ...Fx.j(...P)]);
  judge('j = 0 for the real orbitals 2p_z and 2p_x = (ψ₂₁₋₁ − ψ₂₁₁)/√2 (the m < 0 sign convention checked)', zeros.every((v) => v.every((c) => Math.abs(c) < 1e-15)), zeros.map((v) => v.map((c) => c.toExponential(1))));
  /* the s-orbital gradient (the l = 0 branch of ∇ψ): ∇ψ_1s = −ψ r̂ */
  const F1 = createElectrostatics(ONE_S), g = F1.psi(0.7, -0.2, 0.4);
  const P = [0.7, -0.2, 0.4], r = Math.hypot(...P), h = 1e-5, numg = P.map((_, c) => { const Pp = [...P], Pm = [...P]; Pp[c] += h; Pm[c] -= h; return (F1.psi(...Pp).re - F1.psi(...Pm).re) / (2 * h); });
  judge('∇ψ for l = 0: ψ_1s gradient is −ψ r̂ (checked by differences to 1e-9)', numg.every((v, c) => near(v, -g.re * P[c] / r, 1e-9)), { numg: numg.map((v) => fmt(v, 7)) });
}

/* ── 5. Biot–Savart: B at the nucleus and on the axis ────────────────────────────────────────────────────────────── */
{
  const lower = (n, x) => { let term = 1 / n, sum = term; for (let k = 1; k < 500; k++) { term *= x / (n + k); sum += term; if (term < 1e-18 * sum) break; } return Math.pow(x, n) * Math.exp(-x) * sum; };
  const upper = (n, x) => { let s = 0; for (let k = 0; k < n; k++) s += Math.pow(x, k) / factorial(k); return factorial(n - 1) * Math.exp(-x) * s; };
  const solBz = (z) => -B_TESLA / 24 * (z > 0 ? lower(5, z) / (z * z * z) + upper(2, z) : 1);
  const Fp = createElectrostatics(P1);
  const t0 = performance.now(); const Bn = Fp.bNucleus(); const B1 = Fp.bAxis(1); const ms = performance.now() - t0;
  judge('SOL Q5: B at the nucleus for 2p₊1 = −0.521534 T (1e-5) — the orbital hyperfine field, an electron, antiparallel to L', near(Bn.Bz, -0.521534, 1e-5) && Math.abs(Bn.Bx) < 1e-9 && Math.abs(Bn.By) < 1e-9, { Bz: fmt(Bn.Bz), closed: fmt(solBz(0)), ms: +ms.toFixed(0) });
  judge('SOL Q5: B_z(1 a₀) = −0.429533 T (1e-5), by the general observation-centred quadrature', near(B1, -0.429533, 1e-5), { Bz1: fmt(B1), closed: fmt(solBz(1)) });
  const rows = [0.5, 2, 5, 12].map((z) => [z, Fp.bAxis(z), solBz(z)]);
  judge('the whole axis: bAxis(z) matches the ledger\'s closed form −12.5168/24 [γ(5,z)/z³ + Γ(2,z)] to 1e-7 T at z = 0.5, 2, 5, 12 (and → the point-dipole −12.5168/z³ only far out)', rows.every(([, a, b]) => near(a, b, 1e-7)), rows.map(([z, a, b]) => [z, fmt(a, 8), fmt(b, 8), fmt(-B_TESLA / z ** 3, 4)]));
  const Bpz = createElectrostatics(PZ).bNucleus(), Bpz1 = createElectrostatics(PZ).bAxis(1);
  judge('B = 0 for 2p_z (a real orbital has no current)', Bpz.mag < 1e-12 && Math.abs(Bpz1) < 1e-12, { mag: Bpz.mag });
  const Bm = createElectrostatics([{ a: idx(2, 1, -1), re: 1, im: 0 }]).bNucleus();
  judge('2p₋1 reverses it: +0.521534 T', near(Bm.Bz, +0.521534, 1e-5), { Bz: fmt(Bm.Bz) });
}

/* ── 6. Hellmann–Feynman on the lab's H₂⁺ ────────────────────────────────────────────────────────────────────────── */
{
  const H = hellmannFeynman(2);
  judge('OPUS/P7: F_elec(H₂⁺, R = 2) on proton B = −0.13391 (2e-5)  [got ' + H.F_elec.toFixed(8) + '; Opus −0.13390616]', near(H.F_elec, -0.13391, 2e-5) && near(H.F_elec, -0.13390616, 2e-7), { F_elec: fmt(H.F_elec), F_HF: fmt(H.F_HF) });
  judge('−dE/dR = 0.053804 (the variational force, central differences of energies(R))', near(H.F_exact, 0.05380439, 1e-6), { F_exact: fmt(H.F_exact) });
  judge('the Pulay term = 0.06229 (2e-4), computed analytically as 2⟨∂_Rψ|(H−E)ψ⟩ [got ' + H.pulay.toFixed(8) + '; Opus 0.06228945]', near(H.pulay, 0.06229, 2e-4) && near(H.pulay, 0.06228945, 2e-7), { pulay: fmt(H.pulay) });
  judge('F_exact = F_elec + 1/R² − Pulay to 1e-7: the analytic Pulay integral and the difference of the energy curve are the same number', near(H.F_exact, H.F_HF - H.pulay, 1e-7) && near(H.pulayByDifference, H.pulay, 1e-7), { byDifference: fmt(H.pulayByDifference), analytic: fmt(H.pulay) });
  judge('OPUS: the Pulay bound 2‖∂_Rψ‖‖(H−E)ψ‖ = 0.102 (1e-2) [got ' + H.bound.toFixed(6) + '; Opus 0.102024], and it holds the Pulay term at 61 %', near(H.bound, 0.102, 1e-2) && near(H.bound, 0.102024, 1e-5) && H.pulay < H.bound, { bound: fmt(H.bound), residual: fmt(H.residual), dpsi: fmt(H.dpsiNorm), ratio: fmt(H.pulay / H.bound, 3) });
  /* F_elec by an independent B-centred quadrature of the full LCAO density: ∫ ρ cos θ_B dr_B dΩ (P7's kernel, GL here;
     cos θ_B = −1 + 2v⁴ so the cusp of |1s_A|² on the sphere r_B = R is a smooth even function of v) */
  const R = 2, S = overlapS(R), { x: gx, w: gw } = gaussLegendre(48), { x: tx, w: tw } = gaussLegendre(64);
  let Fq = 0; const bounds = [0, 0.5, 1, 1.7, 2, 2.3, 3, 5, 8, 14, 24, 40];
  for (let p = 0; p + 1 < bounds.length; p++) { const h = (bounds[p + 1] - bounds[p]) / 2, c = (bounds[p] + bounds[p + 1]) / 2;
    for (let i = 0; i < 48; i++) { const rb = c + h * gx[i]; for (let k = 0; k < 64; k++) { const v = 0.5 + 0.5 * tx[k], u = -1 + 2 * v ** 4, rA = Math.sqrt(rb * rb + R * R + 2 * R * rb * u);
      const a = Math.exp(-rA) / Math.sqrt(Math.PI), b = Math.exp(-rb) / Math.sqrt(Math.PI); Fq += gw[i] * h * 0.5 * tw[k] * 8 * v * v * v * 2 * Math.PI * (a + b) * (a + b) / (2 * (1 + S)) * u; } } }
  judge('F_elec by a B-centred Gauss–Legendre quadrature of the LCAO density (48 × 64 on eleven panels, no closed forms) agrees with the closed form to 1e-8', near(Fq, H.F_elec, 1e-8), { quadrature: fmt(Fq), closed: fmt(H.F_elec) });
  const HH = hellmannFeynman(2.49), Hb = hellmannFeynman(1.5);
  judge('at the LCAO minimum R = 2.49 the variational force vanishes while F_HF does not (the Pulay gap); at R = 1.5 the identity still holds', Math.abs(HH.F_exact) < 2e-3 && HH.F_HF > 0.05 && near(Hb.F_exact, Hb.F_HF - Hb.pulay, 1e-7), { R249: [fmt(HH.F_exact, 5), fmt(HH.F_HF, 5)], R15: [fmt(Hb.F_elec, 6), fmt(Hb.pulay, 6), fmt(Hb.bound, 6)] });
}

/* ── 7. the stage: contours and streamlines ──────────────────────────────────────────────────────────────────────── */
{
  const F = createElectrostatics(ONE_S), plane = { origin: [0, 0, 0], u: [1, 0, 0], v: [0, 0, 1], half: 8, n: 128 };
  const t0 = performance.now(); const C = F.contours(plane, [-0.3, -0.15, -0.6], { which: 'phiE' }); const ms = performance.now() - t0;
  const scatter = C.levels.map((lv) => { const pts = lv.lines.flat(); const r = pts.map(([s, t]) => Math.hypot(s, t)); const m = r.reduce((a, b) => a + b, 0) / r.length; return { level: lv.level, lines: lv.lines.length, n: pts.length, mean: fmt(m, 5), scatter: Math.max(...r.map((v) => Math.abs(v - m))), closed: lv.closed.every(Boolean) }; });
  judge('CONTOURS: the equipotentials of a 1s in the xz-plane are circles — radius scatter < 1e-3 at every level, one closed polyline each (marching squares, secant-polished; ' + ms.toFixed(0) + ' ms for 128² + 3 levels)', scatter.every((s) => s.scatter < 1e-3 && s.lines === 1 && s.closed), scatter.map((s) => ({ ...s, scatter: s.scatter.toExponential(1) })));
  const cf = (r) => -(1 - (1 + r) * Math.exp(-2 * r)) / r;
  judge('and the circle radii are where the closed form puts them (Φ_e(r) = level to 1e-6)', scatter.every((s) => near(cf(s.mean), s.level, 1e-6)));
  const seeds = [[2, 0], [0, 3], [-1.5, 1.5], [4, -4]];
  const SL = F.streamlines(plane, 'E', seeds, { dir: 1 });
  const radial = SL.every((l) => l.points.every(([s, t]) => Math.abs(s * l.seed[1] - t * l.seed[0]) < 1e-6 * Math.hypot(s, t) * Math.hypot(...l.seed)) && l.stop === 'edge');
  judge('STREAMLINES: the E lines of a 1s are radial (every RK4 point collinear with its seed and the nucleus to 1e-6) and run outward to the stage edge', radial, SL.map((l) => [l.points.length, l.stop]));
  const Fp = createElectrostatics(P1), xy = { origin: [0, 0, 0], u: [1, 0, 0], v: [0, 1, 0], half: 8, n: 64 };
  const JL = Fp.streamlines(xy, 'j', [[2, 0], [4, 0]], { step: 0.02 });
  const circles = JL.every((l) => l.closed && l.points.every(([s, t]) => near(Math.hypot(s, t), Math.hypot(...l.seed), 1e-6)));
  judge('the j lines of 2p₊1 in the xy-plane are closed circles (radius kept to 1e-6 around the loop)', circles, JL.map((l) => [l.points.length, l.closed, l.stop]));
}

/* ── 8. timing: the UI budget ─────────────────────────────────────────────────────────────────────────────────────── */
{
  const t0 = performance.now(); const F = createElectrostatics(S12); const tb = performance.now() - t0;
  const t1 = performance.now(); let acc = 0;
  for (let i = 0; i < 10000; i++) { const s = -16 + 32 * (i % 100) / 99, t = -16 + 32 * Math.floor(i / 100) / 99; acc += F.phi(s, 0.37, t); }
  const tp = performance.now() - t1;
  const t2 = performance.now(); for (let i = 0; i < 2000; i++) F.E(-3 + i * 0.003, 0.5, 1.2); const te = performance.now() - t2;
  const F4 = createElectrostatics(FOUR); const t3 = performance.now(); for (let i = 0; i < 10000; i++) acc += F4.phi(-16 + 32 * (i % 100) / 99, 0.37, -16 + 32 * Math.floor(i / 100) / 99); const tp4 = performance.now() - t3;
  judge('TIMING: 12-term state (' + F.meta.slots + ' slots, ' + F.meta.radialTerms + ' radial terms) build ' + tb.toFixed(1) + ' ms; 10 000 phi ' + tp.toFixed(0) + ' ms (' + (tp / 10).toFixed(1) + ' μs each); 2 000 E ' + te.toFixed(0) + ' ms; Josh\'s four-channel state 10 000 phi ' + tp4.toFixed(0) + ' ms — build < 100 ms and 10 000 phi < 3 s', tb < 100 && tp < 3000 && isFinite(acc), { build_ms: +tb.toFixed(2), phi10k_ms: +tp.toFixed(1), E2k_ms: +te.toFixed(1), four_phi10k_ms: +tp4.toFixed(1) });
}

/* ── 9. wave 42, the reviewer's findings 7 and 11 ────────────────────────────────────────────────────────────────── */
{
  /* 7. the window calls bNucleus() + bAxis(1) per rebuild: 200 ms for a 12-term state with 20 × 48 everywhere.  Near/far
        orders now (10 radial, 32/24 polar, 2|m|_max + 4 azimuthal on the axis), judged against the old rule. */
  const TW = [[1, 0, 0], [2, 0, 0], [2, 1, 0], [2, 1, 1], [3, 1, 0], [3, 2, -2], [4, 1, -1], [4, 2, 2], [4, 3, 3], [5, 4, -4], [6, 0, 0], [6, 5, 5]].map(([n, l, m], i) => ({ a: idx(n, l, m), re: 0.3, im: 0.05 * i }));
  const OLD = { nRad: 20, nRadFar: 20, nTheta: 48, nThetaFar: 48, nPhi: 16 };
  const F = createElectrostatics(TW); F.bNucleus();                                          // warm the JIT once
  const t0 = performance.now(); const bn = F.bNucleus(); const b1 = F.bAxis(1); const ms = performance.now() - t0;
  const rn = F.B(0, 0, 0, OLD)[2], r1 = F.B(0, 0, 1, OLD)[2], bo = F.B(1, 0.5, 0.3), ro = F.B(1, 0.5, 0.3, OLD);
  const lower = (n, x) => { let term = 1 / n, sum = term; for (let k = 1; k < 500; k++) { term *= x / (n + k); sum += term; if (term < 1e-18 * sum) break; } return Math.pow(x, n) * Math.exp(-x) * sum; };
  const upper = (n, x) => { let s = 0; for (let k = 0; k < n; k++) s += Math.pow(x, k) / factorial(k); return factorial(n - 1) * Math.exp(-x) * s; };
  const solBz = (z) => -B_TESLA / 24 * (z > 0 ? lower(5, z) / (z * z * z) + upper(2, z) : 1);
  const Fp = createElectrostatics(P1), p0 = Fp.bNucleus().Bz, p1 = Fp.bAxis(1);
  judge('W42-7 THE TWO B READOUTS OF THE 12-TERM STATE in ' + ms.toFixed(1) + ' ms (< 60; the reviewer measured 200): B_z(0) and B_z(1) agree with the 20 × 48 rule to 1e-9 T (they agree to 1e-13), so does an off-axis point, and the 2p₊1 anchors B_z(0) = −0.521534351 T and B_z(1) = −0.429533192 T hold to 1e-7 T against the closed forms (to 1e-12)',
    ms < 60 && Math.abs(bn.Bz - rn) < 1e-9 && Math.abs(b1 - r1) < 1e-9 && bo.every((v, i) => Math.abs(v - ro[i]) < 1e-9) && Math.abs(p0 - solBz(0)) < 1e-7 && Math.abs(p1 - solBz(1)) < 1e-7,
    { ms: +ms.toFixed(1), Bz0: bn.Bz, dev0: bn.Bz - rn, Bz1: b1, dev1: b1 - r1, offAxisDev: Math.max(...bo.map((v, i) => Math.abs(v - ro[i]))), anchor0: p0 - solBz(0), anchor1: p1 - solBz(1) });
  /* 11. inverseSquareIntegral's left branch r = R − t² had fixed panels 0.02 … 0.6 and one panel from 0.6 to √R: the density
        r e^{−2r} lives at t ∈ [√(R−5), √R], a sliver at the END that the rule never saw — 1.6e-4 relative at R = 40, 8e-3
        at R = 60, where the residual ‖(H−E)ψ‖² = gg − (½+E_el)² (a four-digit cancellation) went negative and the bound
        clipped to 0.  Panel edges now sit at √(R − 8), √(R − 2), √R. */
  const brute = (R) => { const N = 4000000, h = 60 / N; let s = 0; for (let i = 0; i < N; i++) { const r = (i + 0.5) * h; s += r * Math.exp(-2 * r) * Math.log((r + R) / Math.abs(r - R)); } return (2 / R) * s * h; };
  const I2 = [2, 40, 60].map((R) => ({ R, module: inverseSquareIntegral(R), brute: brute(R) })), law = [40, 60].map((R) => hellmannFeynman(R).bound * Math.sqrt(3) * R * R);
  const H60 = hellmannFeynman(60);
  judge('W42-11 ⟨1s_A|1/r_B²|1s_A⟩ at R = 2, 40, 60 against a 4·10⁶-point midpoint rule to 1e-8 relative (it was 1.6e-4 off at 40 and 8e-3 at 60), R = 2 unchanged at 0.29468077249 to 1e-10, and the Pulay bound at R = 60 is 1.6048e-4 (not 0): the large-R law bound → 1/(√3 R²) — from ‖∂_Rψ‖ → 1/√12 and ‖(H−E)ψ‖² = ⟨1/r_B²⟩ − 1/R² → ⟨r²⟩/(3R⁴) = 1/R⁴ — holds to 0.2 % at R = 40 and 60 (the reviewer\'s "≈ 1.8e-4" was an estimate; the law gives 1.604e-4)',
    I2.every((x) => Math.abs(x.module - x.brute) < 1e-8 * x.brute) && near(inverseSquareIntegral(2), 0.29468077249, 1e-10) && H60.bound > 1.5e-4 && near(H60.bound, 1 / (Math.sqrt(3) * 3600), 2e-3 * 1.6e-4) && law.every((v) => near(v, 1, 2e-3)),
    { I2: I2.map((x) => ({ R: x.R, module: x.module, rel: (x.module - x.brute) / x.brute })), bound60: H60.bound, law: 1 / (Math.sqrt(3) * 3600), lawRatio: law });
}
const wall = (performance.now() - T0) / 1000;
console.log((FAILED ? 'RED ' : 'GREEN ') + 'electrostatics.test — ' + FAILED + ' failing of ' + TOTAL + ' · ' + wall.toFixed(2) + ' s');
process.exit(FAILED ? 1 : 0);
