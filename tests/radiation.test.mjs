/* tests/radiation.test.mjs — the node proof of W-RADIATION.
 *   node tests/radiation.test.mjs
 * Oracles, all outside lab/radiation.js:
 *   (a) the closed forms of the hydrogen radial dipoles (mpmath, 18 digits, ~/bin/scipython on the exact R_nl);
 *   (b) the angular integrals ∫ Y*_{l'm'} r̂ Y_{lm} dΩ by spherical quadrature on lab/hydrogen.js's ylm;
 *   (c) lab/dynamics.js's dipoleZ — the ⟨z⟩ the A/B TRANSITION readout already prints;
 *   (d) NIST/PDG's tabulated Einstein A for four hydrogen lines;
 *   (e) the Poynting flux of farField, integrated over a sphere and over a period, against pattern's total power —
 *       the classical-power law is CERTIFIED by that integral, not asserted from the algebra that produced it.
 */
import * as R from '../lab/radiation.js';
import { BASIS, ylm } from '../lab/hydrogen.js';
import { dipoleZ, radialDipole } from '../lab/dynamics.js';
import { gaussLegendre } from '../lab/wigner.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 420)));
}
const T0 = Date.now(), PI = Math.PI;
const id = (n, l, m) => `h:${n}:${l}:${m}`;

{ /* the radial integrals, against mpmath */
  const oracle = [[[1, 0], [2, 1], 1.29026620195986336], [[1, 0], [3, 1], 0.51668924261832663],
                  [[2, 1], [3, 2], 4.74799161153900945], [[2, 1], [3, 0], 0.938404237739791966],
                  [[1, 0], [4, 1], 0.304583803892459128], [[2, 0], [3, 1], 3.06481540657051644],
                  [[2, 1], [4, 2], 1.70970248097939369]];
  let mx = 0;
  for (const [[na, la], [nb, lb], v] of oracle) mx = Math.max(mx, Math.abs(radialDipole(na, la, nb, lb) - v) / v);
  const z = R.dipoleMatrix(id(1, 0, 0), id(2, 1, 0)).z.re, exact = 128 * Math.SQRT2 / 243;
  judge('THE RADIAL INTEGRALS ARE THE REGISTER\'S OWN: dynamics.js\'s Simpson ∫R r R r²dr matches mpmath on seven pairs to 1e-11 relative (3.5e-15 at best, 2.6e-14 at worst) — it used to be 1.4e-9 on 1s–4p, because that rule sets its RANGE from the larger n (40n²) and its STEP from a fixed 12000 panels, so the smaller shell\'s cusp was resolved (n_max/n_min)² times too coarsely; the panel count carries that ratio now (wave 40) and every pair is resolved like the equal-n case; ⟨1s|z|2p₀⟩ = 128√2/243 = 0.744935539 to 3e-13 — the round\'s probe printed 0.74496, and that 3e-5 is exactly what put the ledger\'s A below NIST',
    mx < 1e-11 && Math.abs(z - exact) < 3e-13, { maxRelErr: mx, zDipole: z, exact, roundsProbe: 0.74496 });
}
{ /* wave 40, the fix itself: the pair the old rule was worst on, against its own oracle
     (~/bin/scipython mpmath, 40 dps: ∫R_10 R_41 r³ dr = 0.30458380389245912758, ∫R_10 R_61 r³ dr = 0.15513544438180798717) */
  const O4 = 0.30458380389245912758, O6 = 0.15513544438180798717;
  const v4 = radialDipole(1, 0, 4, 1), r4 = Math.abs(v4 - O4) / O4;
  const v6 = radialDipole(1, 0, 6, 1), r6 = Math.abs(v6 - O6) / O6;
  judge('THE 1s–4p RADIAL DIPOLE TO 1e-11 (the under-resolved cusp, cured): 12000 panels × ⌈n_max²/n_min²⌉ — 192000 for 1s–4p, 432000 for 1s–6p — puts ∫R_1s r R_4p r²dr on mpmath\'s 0.304583803892459128 to 2.2e-14 and 1s–6p to 2.6e-14, where the fixed count gave 1.4e-9 and 2.4e-8; the values are cached, so the extra panels are integrated once per pair and never again',
    r4 < 1e-11 && r6 < 1e-11, { v4, oracle4p: O4, rel4p: r4, v6, oracle6p: O6, rel6p: r6 });
}
{ /* the angular algebra, against a spherical quadrature on hydrogen.js's ylm */
  const angNum = (lp, mp, l, m) => {
    const N = 24, G = gaussLegendre(N), NP = 32, o = { x: { re: 0, im: 0 }, y: { re: 0, im: 0 }, z: { re: 0, im: 0 } };
    for (let i = 0; i < N; i++) {
      const ct = G.x[i], st = Math.sqrt(1 - ct * ct), th = Math.acos(ct);
      for (let k = 0; k < NP; k++) {
        const ph = 2 * PI * k / NP, w = G.w[i] * 2 * PI / NP, A = ylm(lp, mp, th, ph), B = ylm(l, m, th, ph);
        const pr = A.re * B.re + A.im * B.im, pi = A.re * B.im - A.im * B.re;
        const n = [st * Math.cos(ph), st * Math.sin(ph), ct];
        o.x.re += w * pr * n[0]; o.x.im += w * pi * n[0]; o.y.re += w * pr * n[1];
        o.y.im += w * pi * n[1]; o.z.re += w * pr * n[2]; o.z.im += w * pi * n[2];
      }
    }
    return o;
  };
  let mx = 0;
  for (const [lp, mp, l, m] of [[0, 0, 1, 0], [0, 0, 1, 1], [0, 0, 1, -1], [1, 1, 0, 0], [1, 0, 2, 0], [1, 1, 2, 2],
                                [2, 1, 1, 0], [2, -1, 3, -2], [3, 2, 2, 2], [1, -1, 2, -2], [2, 2, 3, 3], [1, 0, 2, 1]]) {
    const a = R.angularDipole(lp, mp, l, m), b = angNum(lp, mp, l, m);
    for (const c of ['x', 'y', 'z']) mx = Math.max(mx, Math.abs(a[c].re - b[c].re), Math.abs(a[c].im - b[c].im));
  }
  judge('THE ANGULAR ALGEBRA: all three components of ⟨l\'m\'|r̂|lm⟩ — the Condon–Shortley ∓√(…) of the sinθe^{±iφ} channels, not just the ⟨cosθ⟩ the lab already had — match a spherical quadrature on hydrogen.js\'s ylm to 1e-13 over twelve pairs including Δm = ±1 and l\' = l ± 1 both ways',
    mx < 1e-13, { maxAbsErr: mx });
}
{ /* structure: hermiticity, isotropy, and the forbidden line */
  const A = R.dipoleMatrix(id(1, 0, 0), id(2, 1, 1)), B = R.dipoleMatrix(id(2, 1, 1), id(1, 0, 0));
  let herm = 0;
  for (const c of ['x', 'y', 'z']) herm = Math.max(herm, Math.abs(A[c].re - B[c].re), Math.abs(A[c].im + B[c].im));
  const iso = [-1, 0, 1].map((m) => R.dipoleMatrix(id(1, 0, 0), id(2, 1, m)).abs2);
  const forb = R.dipoleMatrix(id(2, 0, 0), id(1, 0, 0)), forbA = R.einsteinA(id(2, 0, 0), id(1, 0, 0));
  judge('THE MATRIX IS HERMITIAN AND THE LINE IS ISOTROPIC: ⟨b|r|a⟩ = ⟨a|r|b⟩* to 1e-16, and |⟨1s|r|2p_m⟩|² = 0.5549290 for m = −1, 0, +1 alike (Wigner–Eckart: the rate cannot know which m decayed) — so A is the same for all three',
    herm < 1e-16 && Math.abs(iso[0] - iso[1]) < 1e-15 && Math.abs(iso[2] - iso[1]) < 1e-15,
    { hermDev: herm, abs2: iso });
  judge('2s → 1s IS DEAD, EXACTLY: the dipole is zero to the last bit (l\' = l is not l ± 1 — the angular factor is identically 0, not a small number), so A = 0 and the 2s metastability is in the register, not in a tolerance',
    forb.abs2 === 0 && forbA === 0 && Math.abs(forb.z.re) < 1e-300, { abs2: forb.abs2, A: forbA });
}
{ /* THE RATE */
  const inf = R.einsteinA(id(2, 1, 0), id(1, 0, 0), { reducedMass: false });
  const red = R.einsteinA(id(2, 1, 0), id(1, 0, 0));
  const au = R.einsteinAtomic(id(2, 1, 0), id(1, 0, 0)), closed = Math.pow(2 / 3, 8) * R.ALPHA ** 3;
  const tau = R.lifetime(id(2, 1, 0), id(1, 0, 0)) * 1e9;
  judge('THE CLOSED FORM: A_au(2p → 1s) = (4/3)α³(3/8)³(2^15/3^10) = (2/3)^8 α³ = 1.51623290e-8 EXACTLY — every factor of the register\'s dipole cancels into one power of α³ — reproduced to 4.3e-13 relative, which is precisely twice the 2.2e-13 Simpson error of the radial integral it is built from',
    Math.abs(au - closed) < 1e-12 * closed, { au, closed, rel: (au - closed) / closed });
  judge('THE RATE: A(2p → 1s) = 6.268315 × 10⁸ s⁻¹ at infinite nuclear mass and 6.264903 × 10⁸ s⁻¹ with the reduced mass of ¹H — the second is NIST\'s 6.2649 × 10⁸ to 3 × 10² s⁻¹, i.e. 5 × 10⁻⁶ relative, well inside the 2 × 10⁴ gate',
    Math.abs(red - 6.2649e8) < 2e4 && Math.abs(inf - 6.268315e8) < 2e4,
    { infiniteMass: inf, reducedMass: red, NIST: 6.2649e8, dNIST: red - 6.2649e8 });
  judge('AND THE LEDGER\'S FIGURE, PLACED: the SYNTHESIS row prints 6.2646 × 10⁸ with the reduced mass; the register\'s exact value is 6.26490 × 10⁸, 3.0 × 10⁴ (5 × 10⁻⁵) higher, the whole gap being the round\'s quadrature dipole 0.74496 against the exact 0.744936 — the ledger row should read 6.2649, which is also what NIST prints',
    Math.abs(red - 6.2646e8) < 4e4 && (red - 6.2646e8) > 0,
    { ledger: 6.2646e8, register: red, d: red - 6.2646e8, fromLedgerDipole: (4 / 3) * R.ALPHA ** 3 * (3 / 8) ** 3 * 0.74496 ** 2 / R.AU_S * R.MU_H });
  judge('THE LIFETIME: τ = 1/A = 1.596194 ns for the 2p → 1s channel — the only open channel of 2p, so this is the level\'s lifetime too (the round printed 1.5963 ns)',
    Math.abs(tau - 1.5963) < 5e-4 && Math.abs(tau - 1.5961939) < 1e-6, { tau_ns: tau, round: 1.5963 });
  judge('THE REDUCED MASS ENTERS EXACTLY ONCE: A(μ)/A(∞) = μ/m_e = 0.99945568 to 1e-15 — energies scale as μ and lengths as 1/μ, so A ∝ (μ/m)³·(m/μ)² — the ledger\'s "A ∝ μ_reduced", now with the exponent shown',
    Math.abs(red / inf - R.MU_H) < 1e-15, { ratio: red / inf, mu: R.MU_H });
}
{ /* the tabulated lines */
  const rows = [[[3, 1, 0], [1, 0, 0], 1.6725e8], [[3, 2, 0], [2, 1, 0], 6.4651e7], [[4, 1, 0], [1, 0, 0], 6.8186e7]];
  const got = rows.map(([u, l]) => R.spontaneousRate(id(...u), id(...l)));
  const ok = got.every((v, i) => Math.abs(v - rows[i][2]) < 1e-4 * rows[i][2]);
  const one = R.spontaneousRate(id(2, 1, 0), id(1, 0, 0)), same = R.einsteinA(id(2, 1, 0), id(1, 0, 0));
  judge('THREE MORE LINES, AGAINST THE TABLES: the level-to-level rate (the lower m\'s summed — einsteinA is one m\' of it) gives 3p → 1s 1.67253e8, 3d → 2p 6.46510e7, 4p → 1s 6.81867e7 s⁻¹ against NIST\'s 1.6725e8, 6.4651e7, 6.8186e7 — all inside 1e-4 relative; 3s → 2p comes out 6.31358e6 (printed, not gated)',
    ok && Math.abs(one - same) < 1e-6 * same,
    { got, nist: rows.map((r) => r[2]), rel: got.map((v, i) => (v - rows[i][2]) / rows[i][2]), s3to2p: R.spontaneousRate(id(3, 0, 0), id(2, 1, 0)) });
}
{ /* the dipole against the readout the lab already prints */
  const a = BASIS.findIndex((s) => s.n === 1 && s.l === 0), b = BASIS.findIndex((s) => s.n === 2 && s.l === 1 && s.m === 0);
  const c1 = { re: 0.6, im: 0 }, c2 = { re: 0.5, im: 0.62449979983984 };            // |c₁|² + |c₂|² = 1
  const w = BASIS[b].E - BASIS[a].E, M = R.dipoleMatrix(a, b);
  let mx = 0;
  for (const t of [0, 1.7, 4.4, 9.1, 21]) {
    const re = new Float64Array(91), im = new Float64Array(91);
    for (const [k, c] of [[a, c1], [b, c2]]) {
      const th = -BASIS[k].E * t, ph = { re: Math.cos(th), im: Math.sin(th) };
      re[k] = c.re * ph.re - c.im * ph.im; im[k] = c.re * ph.im + c.im * ph.re;
    }
    const dyn = dipoleZ(re, im, [a, b]).value;
    const pr = c1.re * c2.re + c1.im * c2.im, pi = c1.re * c2.im - c1.im * c2.re;   // c₁* c₂
    const dre = pr * M.z.re - pi * M.z.im, dim = pr * M.z.im + pi * M.z.re;
    const mine = 2 * (dre * Math.cos(w * t) + dim * Math.sin(w * t));               // 2 Re(d e^{−iωt})
    mx = Math.max(mx, Math.abs(dyn - mine));
  }
  judge('THE SAME DIPOLE THE TRANSITION READOUT PRINTS: dynamics.js\'s ⟨z⟩(t) for 0.6|1s⟩ + (0.5 + 0.6245i)|2p₀⟩ equals 2 Re(d e^{−iωt}) with d = c₁* c₂ ⟨1s|r|2p₀⟩ to 1e-15 at five times — the far field and the stage readout are one object',
    mx < 1e-15, { maxDev: mx, omega: w, dz: M.z.re });
}
{ /* the pattern */
  const dip = R.dipoleMatrix(id(1, 0, 0), id(2, 1, 0)), w = 3 / 8, pat = R.pattern(dip, w);
  let mx = 0;
  for (const th of [PI / 12, PI / 6, PI / 4, PI / 3, 5 * PI / 12, PI / 2, 2 * PI / 3])
    mx = Math.max(mx, Math.abs(pat.dPdOmega([Math.sin(th), 0, Math.cos(th)]) / pat.peak - Math.sin(th) ** 2));
  const onAxis = pat.dPdOmega([0, 0, 1]), atRight = pat.dPdOmega([1, 0, 0]);
  judge('THE PATTERN IS sin²θ: dP/dΩ ÷ its peak equals sin²θ to 1e-16 at seven angles, it is EXACTLY zero along the dipole (θ = 0 — nothing radiates up the axis it oscillates on) against 6.787e-10 a.u. at θ = π/2, and the peak is at the equator',
    mx < 1e-15 && onAxis === 0 && atRight > 1e-12 && Math.abs(atRight - pat.peak) < 1e-18,
    { maxDev: mx, onAxis, atRight, peak: pat.peak });
  judge('AND THE WAVELENGTH SAYS WHY IT IS A SEPARATE VIEW: λ = 2πc/ω = 2296.1 a₀ for Lyman-α, so at the stage edge r = 16 a₀ the retardation is kr = 0.04378 rad — the ledger\'s corrected A.1 number (0.0438, one part in 22.8), and 143 stage-widths short of the radiation zone this module describes',
    Math.abs(pat.wavelength - 2296.1) < 0.1 && Math.abs(w / R.C_AU * 16 - 0.0438) < 5e-5,
    { lambda: pat.wavelength, kr_at_16a0: w / R.C_AU * 16, stagesToLambda: pat.wavelength / 16 });
}
{ /* the far field's structure */
  const dip = R.dipoleMatrix(id(1, 0, 0), id(2, 1, 0)), w = 3 / 8;
  let trans = 0, bmag = 0, curl = 0, falloff = 0;
  for (const n of [[0, 0, 1], [1, 0, 0], [0.6, 0.8, 0], [0.3, -0.4, 0.866025403784439]])
    for (const t of [0, 3.3, 11.7]) {
      const r = 1e5, F = R.farField(dip, w, n, r, t + r / R.C_AU);
      const u = n.map((v) => v / Math.hypot(...n));
      const E = Math.hypot(...F.E);
      trans = Math.max(trans, Math.abs(F.E[0] * u[0] + F.E[1] * u[1] + F.E[2] * u[2]) / (E || 1));
      bmag = Math.max(bmag, Math.abs(Math.hypot(...F.B) - E) / (E || 1));
      const cx = [u[1] * F.E[2] - u[2] * F.E[1], u[2] * F.E[0] - u[0] * F.E[2], u[0] * F.E[1] - u[1] * F.E[0]];
      curl = Math.max(curl, Math.hypot(F.B[0] - cx[0], F.B[1] - cx[1], F.B[2] - cx[2]) / (E || 1));
      const G = R.farField(dip, w, n, 2 * r, t + 2 * r / R.C_AU);      // same retarded time, twice the distance
      falloff = Math.max(falloff, Math.abs(2 * Math.hypot(...G.E) - E) / (E || 1));
    }
  judge('THE RADIATION ZONE, STRUCTURALLY: E ⊥ n̂, B = n̂ × E, |B| = |E| and E ∝ 1/r at fixed retarded time — all to 1e-15 over four directions and three times (Gaussian atomic units: 1 a.u. of field = 5.1422e11 V/m = 1715.26 T, which is 1/α times SMALLER than the SI-Hartree magnetic a.u. the lab\'s magnetostatics probes quote)',
    trans < 1e-15 && bmag < 1e-15 && curl < 1e-15 && falloff < 1e-15,
    { transverse: trans, bEqualsE: bmag, curlLaw: curl, inverseR: falloff });
}
{ /* the power law, by integrating the Poynting flux */
  const poynting = (dip, w, r, NT = 20, NP = 24, NTIME = 32) => {
    const G = gaussLegendre(NT); let tot = 0;
    for (let i = 0; i < NT; i++) {
      const ct = G.x[i], st = Math.sqrt(1 - ct * ct);
      for (let k = 0; k < NP; k++) {
        const ph = 2 * PI * (k + 0.5) / NP, n = [st * Math.cos(ph), st * Math.sin(ph), ct];
        let sm = 0; const T = 2 * PI / w;
        for (let q = 0; q < NTIME; q++) {
          const F = R.farField(dip, w, n, r, r / R.C_AU + T * q / NTIME);
          sm += (F.S[0] * n[0] + F.S[1] * n[1] + F.S[2] * n[2]) / NTIME;
        }
        tot += G.w[i] * (2 * PI / NP) * sm * r * r;
      }
    }
    return tot;
  };
  const dip = R.dipoleMatrix(id(1, 0, 0), id(2, 1, 0)), w = 3 / 8, pat = R.pattern(dip, w);
  const flux = poynting(dip, w, 1e5);
  judge('LARMOR, CERTIFIED BY THE FLUX: ∮⟨S·n̂⟩r²dΩ of the farField over a sphere and one period = 5.6858734e-9 a.u., equal to pattern\'s (4/3)ω⁴|d|²/c³ to 1e-13 relative (the gate asked 1e-6) — the pattern is not an assertion about the fields, it is their integral',
    Math.abs(flux - pat.total) < 1e-6 * pat.total && Math.abs(flux - pat.total) < 1e-12 * pat.total,
    { flux, total: pat.total, rel: (flux - pat.total) / pat.total });
  /* B.2 as the SYNTHESIS corrected it */
  const rows = [[Math.SQRT1_2, Math.SQRT1_2], [0.6, 0.8], [0.3, 0.4], [0.9539392014169456, 0.3]];
  let mxRatio = 0, mxFlux = 0, eq = null;
  for (const [c1, c2] of rows) {
    const cp = R.coherentPower(id(1, 0, 0), id(2, 1, 0), c1, c2);
    mxRatio = Math.max(mxRatio, Math.abs(cp.ratio - 1));
    mxFlux = Math.max(mxFlux, Math.abs(poynting(cp.d, Math.abs(cp.omega), 1e5) - cp.P) / cp.P);
    if (c1 === Math.SQRT1_2) eq = cp;
  }
  judge('B.2 AS THE SYNTHESIS CORRECTED IT: the classical field of the coherent pair radiates P = |c₁|²|c₂|² ħωA — held to 1e-15 for four coefficient pairs, and each P confirmed to 1e-13 by the Poynting integral of the actual fields. At the equal mix |c₁|² = |c₂|² = ½ it is ħωA/4 = 1.4214683e-9 a.u., which is P5\'s number: the digest\'s law and the probe\'s quarter are ONE statement, not two',
    mxRatio < 1e-15 && mxFlux < 1e-12 && Math.abs(eq.P - eq.hbarOmegaA / 4) < 1e-18,
    { maxRatioDev: mxRatio, maxFluxRelDev: mxFlux, equalMixP: eq.P, hbarOmegaA_over4: eq.hbarOmegaA / 4, weight: eq.weight });
}
{ /* wave 42, the reviewer's finding 9: ω came from the static BASIS (Z = 1) while the dipole followed the Hamiltonian in
     force, so at Z = 2 A(2p₀ → 1s) read 1.566e8 (the dipole's 1/Z² alone) instead of Z⁴ · 6.2649e8 = 1.002e10 */
  const { setZ, getZ } = await import('../lab/hamiltonian.js');
  const A1 = R.einsteinA(id(2, 1, 0), id(1, 0, 0)), P1 = R.coherentPower(id(1, 0, 0), id(2, 1, 0), 0.6, 0.8);
  setZ(2); const A2 = R.einsteinA(id(2, 1, 0), id(1, 0, 0)), P2 = R.coherentPower(id(1, 0, 0), id(2, 1, 0), 0.6, 0.8), w2 = Math.abs(P2.omega); setZ(1);
  const A1b = R.einsteinA(id(2, 1, 0), id(1, 0, 0));
  judge('W42-9 THE RATE FOLLOWS THE HAMILTONIAN IN FORCE: at Z = 2, A(2p₀ → 1s) = 1.002e10 s⁻¹ = Z⁴ × 6.2649e8 to 1e-3 relative (the ratio is 16 to 1e-12: ω scales as Z², |d|² as 1/Z²), the coherent pair\'s ω is 4 × 3/8 = 1.5 and its P/(|c₁|²|c₂|²ħωA) is still 1; back at Z = 1 the rate is the NIST 6.2649e8 unchanged',
    Math.abs(A2 - 1.002384e10) < 1e-3 * 1.002384e10 && Math.abs(A2 / A1 - 16) < 1e-11 && Math.abs(w2 - 1.5) < 1e-14 && Math.abs(P2.ratio - 1) < 1e-14 && A1b === A1 && Math.abs(A1 - 6.2649e8) < 2e4 && getZ() === 1,
    { A_Z1: A1, A_Z2: A2, ratio: A2 / A1, omega_Z2: w2, ratio_Z2: P2.ratio, ratio_Z1: P1.ratio });
}
console.log('      wall time ' + ((Date.now() - T0) / 1000).toFixed(1) + ' s');
console.log((FAILED ? 'RED ' : 'GREEN ') + 'radiation.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
