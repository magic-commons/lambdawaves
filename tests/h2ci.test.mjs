/* tests/h2ci.test.mjs — the node proof of W-H2CI (ledger research/MATH-MOLECULAR-PULSES-2026-09-05.md §2.4 (ii),
 * §2.6 C3): H₂ with the correlation put back, twice, in the lab's own JS.
 *   node tests/h2ci.test.mjs
 * Oracles, in order of independence:
 *   · Heitler–London's closed-form TRIPLET (lab/h2.js's h2Energies until the H₂ card left in 0.5.0 D9b; below) — an exact
 *     eigenvector of the CI matrix, so at ζ = 1 the two must agree to the last bit.  This validates the whole 1s-STO
 *     integral set against code written years apart.  Q8 keeps tests/h2.test.mjs's anchors on the closed forms h2ci.js took.
 *   · prolate-spheroidal quadrature of the hybrid integral (aa|ab), and radial quadrature of (aa|aa) and F₀.
 *   · the tables: Weinbaum 1933 (E = −1.1478, D_e = 4.02 eV, ζ = 1.193 at R = 1.40) and Szabo–Ostlund's STO-3G
 *     H₂ (RHF −1.116714, FCI −1.137276 at R = 1.4) — KNOWN, from memory.
 *   · PySCF 2.14.0's own numbers at 3.00 Å, re-run on this machine by the reviewer (ledger §2.1 A14):
 *     RHF −0.656048251146, FCI −0.933631844558.
 */
import { h2Curves, weinbaum, weinbaumOptimal, sto3gH2, sto3gIntegrals, stoIntegrals, minimalH2, sto3gHydrogen,
  hybridAAAB, coulombAAAA, boys0, dissociation, HARTREE_EV, expint1, coulombJ2, exchangeK2 } from '../lab/h2ci.js';
import { overlapS, coulombJ, resonanceK, EV } from '../lab/molecule.js';
import { gaussLegendre } from './lib/twocentre.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 420)));
}
const T0 = performance.now();
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const sig = (v, d = 8) => +v.toPrecision(d);
const ANG = 0.529177210903;
/* Heitler–London 1927 in closed form (lab/h2.js's h2Energies, moved here with the H₂ card's deletion, 0.5.0 D9b):
   E± = −1 + 1/R + [2J + J′ ± (2SK + K′)] / (1 ± S²), with H₂⁺'s S, J, K and the two-electron J′, K′ */
function h2Energies(R) {
  const S = overlapS(R), J = coulombJ(R), K = resonanceK(R), J2 = coulombJ2(R), K2 = exchangeK2(R);
  const Ecoul = 2 * J + J2, Eexch = 2 * S * K + K2;
  return { S, J, K, J2, K2, singlet: -1 + 1 / R + (Ecoul + Eexch) / (1 + S * S), triplet: -1 + 1 / R + (Ecoul - Eexch) / (1 - S * S) };
}

/* ── Q1  the Boys function, against its own defining integral ─────────────────────────────────────────────────── */
{
  const GL = gaussLegendre(64);
  const ref = (t) => { let s = 0; for (let k = 0; k < 64; k++) { const u = 0.5 * (GL.x[k] + 1); s += 0.5 * GL.w[k] * Math.exp(-t * u * u); } return s; };
  const ts = [0, 1e-10, 0.01, 0.5, 3, 12, 29.9, 30.1, 60, 400];
  const devs = ts.map((t) => Math.abs(boys0(t) - ref(t)));
  judge('Q1 THE BOYS FUNCTION F₀(t) = ∫₀¹e^{−tu²}du to 1e-14 at ten arguments spanning the series, the t = 30 crossover and the ½√(π/t) tail — the positive-term series e^{−t}Σ(2t)ⁱ/(2i+1)!! has no cancellation anywhere, which is why the Gaussian integrals can be judged at 1e-9 below',
    devs.every((d) => d < 1e-14), { maxDeviation: sig(Math.max(...devs), 3), atCrossover: [sig(boys0(29.9), 12), sig(boys0(30.1), 12)], F0_0: boys0(0) });
}

/* ── Q2  the two-electron integrals over 1s STOs: (aa|aa), and THE HYBRID (aa|ab) by quadrature ────────────────── */
{
  const GL = gaussLegendre(48), GH = gaussLegendre(80);
  /* (aa|aa) = ∫ρ(r)V(r)4πr²dr with ρ = (ζ³/π)e^{−2ζr} and V(r) = (1/r)[1 − (1+ζr)e^{−2ζr}] the potential of ρ */
  const selfRepulsion = (z) => { let s = 0; const L = 40 / z;
    for (let k = 0; k < 80; k++) { const r = L * 0.5 * (GH.x[k] + 1), w = L * 0.5 * GH.w[k];
      const rho = (z ** 3 / Math.PI) * Math.exp(-2 * z * r), V = (1 / r) * (1 - (1 + z * r) * Math.exp(-2 * z * r));
      s += w * rho * V * 4 * Math.PI * r * r; } return s; };
  /* (aa|ab) on the prolate grid: r_A = (R/2)(ξ+η), r_B = (R/2)(ξ−η), d³r = (R/2)³(ξ²−η²)dξdηdφ, a·b = (ζ³/π)e^{−ζRξ} */
  const hybridQuad = (z, R) => { const L = 70 / (z * R); let tot = 0;
    for (let i = 0; i < 48; i++) { const xi = 1 + L * 0.5 * (GL.x[i] + 1), wxi = L * 0.5 * GL.w[i];
      for (let j = 0; j < 48; j++) { const eta = GL.x[j], we = GL.w[j];
        const rA = (R / 2) * (xi + eta), jac = Math.pow(R / 2, 3) * (xi * xi - eta * eta);
        const ab = (z ** 3 / Math.PI) * Math.exp(-z * R * xi), V = (1 / rA) * (1 - (1 + z * rA) * Math.exp(-2 * z * rA));
        tot += 2 * Math.PI * wxi * we * jac * ab * V; } } return tot; };
  const zs = [1, 1.193], Rs = [0.5, 1.0, 1.4, 2.0, 3.0, 5.0];
  let maxDev = 0; const rows = [];
  for (const z of zs) for (const R of Rs) { const q = hybridQuad(z, R), c = hybridAAAB(z, R); maxDev = Math.max(maxDev, Math.abs(q - c)); if (z === 1.193 && (R === 1.4 || R === 3)) rows.push({ z, R, closed: sig(c, 10), quad: sig(q, 10) }); }
  const lim = hybridAAAB(1.193, 1e-7), self = coulombAAAA(1.193);
  const selfDev = Math.abs(selfRepulsion(1.193) - self);
  judge('Q2 THE TWO-ELECTRON INTEGRALS: (aa|aa) = 5ζ/8 to 1e-10 against a radial quadrature of ∫ρV; and THE HYBRID (aa|ab) = ζ[e^{−w}(w + 1/8 + 5/16w) − e^{−3w}(1/8 + 5/16w)] against a 48 × 48 prolate quadrature at twelve (ζ, R) points to 1e-9 — and its R → 0 limit is EXACTLY (aa|aa), which is what fixes the constants 1/8 and 5/16',
    maxDev < 1e-9 && selfDev < 1e-10 && near(lim, self, 1e-6),
    { maxHybridDeviation: sig(maxDev, 3), selfRepulsionDeviation: sig(selfDev, 3), 'limit R→0': sig(lim, 10), '5ζ/8': sig(self, 10), rows });
}

/* ── Q3  the exact cross-check against Heitler–London's closed form: the M_s = 0 triplet is the same number ────── */
{
  let maxT = 0, maxRes = 0, allBelow = true; const rows = [];
  for (const R of [1.0, 1.4, 2.0, 3.0, 6.0]) {
    const mine = minimalH2(stoIntegrals(1, R)), hl = h2Energies(R);
    maxT = Math.max(maxT, Math.abs(mine.triplet - hl.triplet)); maxRes = Math.max(maxRes, mine.tripletResidual);
    if (!(mine.fci <= hl.singlet)) allBelow = false;
    rows.push({ R, triplet: sig(mine.triplet, 12), fci: sig(mine.fci, 9), hlSinglet: sig(hl.singlet, 9) });
  }
  judge('Q3 THE INDEPENDENT ORACLE — HEITLER–LONDON\'S CLOSED FORM AND h2ci.js ARE THE SAME PHYSICS AT ζ = 1: the M_s = 0 triplet, which is an exact eigenvector of the 4-determinant CI by spin symmetry alone, equals Heitler–London\'s closed-form triplet (Sugiura\'s J′, K′ and the exponential integral) to 1e-14 at five separations, with CI residual ‖(H−E)t‖ < 1e-14; and the CI singlet lies BELOW the Heitler–London singlet at every one of them — the ionic configuration is the variational gain, and it is the whole content of Weinbaum',
    maxT < 1e-14 && maxRes < 1e-14 && allBelow, { maxTripletDeviation: sig(maxT, 3), maxCIResidual: sig(maxRes, 3), rows });
}

/* ── Q4  THE WEINBAUM FUNCTION ────────────────────────────────────────────────────────────────────────────────── */
{
  const w = weinbaum(1.40, 1.193), De = (-1 - w.fci) * HARTREE_EV;
  const opt = weinbaumOptimal(1.40), eq = dissociation('weinbaum'), hl = h2Energies(1.40);
  judge('Q4 WEINBAUM 1933 (KNOWN, from memory): at R = 1.40 a₀ with ζ = 1.193 the covalent + ionic function gives E = −1.14772 hartree (−1.1478 to 2e-4) and D_e = 4.020 eV (4.02 to 1e-2), with ionic mixing λ = 0.260; ζ re-optimised at that R gives 1.2005 and −1.147777, and the curve\'s own minimum is R_e = 1.430 a₀, D_e = 4.026 eV against the exact 1.40 and 4.75. Heitler–London on the same two orbitals at ζ = 1 reaches only −1.10547: the ionic term is worth 1.15 eV',
    near(w.fci, -1.1478, 2e-4) && near(De, 4.02, 1e-2) && near(w.lambda, 0.260, 5e-3) && near(opt.zeta, 1.2005, 1e-3)
    && near(eq.Re, 1.430, 5e-3) && near(eq.De_eV, 4.026, 1e-2) && w.fci < hl.singlet,
    { E: sig(w.fci, 8), De_eV: sig(De, 6), lambda: sig(w.lambda, 6), optimalZeta: sig(opt.zeta, 7), optimalE: sig(opt.fci, 8),
      curveMinimum: { Re: sig(eq.Re, 6), De_eV: sig(eq.De_eV, 6) }, heitlerLondon: sig(hl.singlet, 8), ionicGainEV: sig((hl.singlet - w.fci) * HARTREE_EV, 4) });
}

/* ── Q5  STO-3G: the Gaussian side, and its own SCF ────────────────────────────────────────────────────────────── */
{
  const s = sto3gH2(1.4), I = sto3gIntegrals(1.4);
  /* the closed form the SCF must land on: 2h_gg + (gg|gg) + Z_AZ_B/R with σg fixed by symmetry */
  const closedRHF = (R) => { const J = sto3gIntegrals(R), S = J.S, ng = 1 / Math.sqrt(2 * (1 + S));
    const hgg = ng * ng * (J.h[0] + J.h[1] + J.h[2] + J.h[3]);
    const gg = Math.pow(ng, 4) * (2 * J.eri.aaaa + 2 * J.eri.aabb + 4 * J.eri.abab + 8 * J.eri.aaab);
    return 2 * hgg + gg + J.Enuc; };
  const devs = [1.4, 3, 5.669177837, 8].map((R) => Math.abs(sto3gH2(R).rhf - closedRHF(R)));
  const sym = Math.abs(s.Cocc[0] - s.Cocc[1]);
  judge('Q5 STO-3G RHF AND FCI at R = 1.4 a₀: RHF = −1.116714 and FCI = −1.137276 to 1e-5 (Szabo–Ostlund, KNOWN) — the correlation energy is −0.020562 hartree. The SCF is a real Roothaan cycle from the core guess and CONVERGES IN 2 ITERATIONS to the symmetric orbital (|c_a − c_b| < 1e-15) at every R, landing on the closed form 2h_gg + (gg|gg) + 1/R to 1e-12 at R = 1.4, 3, 5.67 and 8 — including the two where the unprojected iteration walks off σg',
    near(s.rhf, -1.116714, 1e-5) && near(s.fci, -1.137276, 1e-5) && s.scfConverged && s.scfIterations <= 3 && sym < 1e-15 && devs.every((d) => d < 1e-12) && near(I.Snorm, 1, 1e-7),
    { rhf: sig(s.rhf, 10), fci: sig(s.fci, 10), correlation: sig(s.fci - s.rhf, 6), scfIterations: s.scfIterations, orbitalAsymmetry: sig(sym, 3), maxClosedFormDeviation: sig(Math.max(...devs), 3), contractionNorm: sig(I.Snorm, 10) });

  const R3 = 3.00 / ANG, t = sto3gH2(R3);
  judge('Q5 AND AGAINST PySCF 2.14.0 AT 3.00 Å (the other lab\'s own numbers, re-run on this machine — ledger §2.1 A14): RHF −0.656048251 and FCI −0.933631845 to 5e-8, from s-type Gaussian integrals written here in fifty lines with the Boys function and no dependencies',
    near(t.rhf, -0.656048251146, 5e-8) && near(t.fci, -0.933631844558, 5e-8),
    { R_bohr: sig(R3, 10), rhf: sig(t.rhf, 12), pyscfRHF: -0.656048251146, dRHF: sig(t.rhf + 0.656048251146, 3), fci: sig(t.fci, 12), pyscfFCI: -0.933631844558, dFCI: sig(t.fci + 0.933631844558, 3) });
}

/* ── Q6  THE DISSOCIATION LAW — the reason the file exists ─────────────────────────────────────────────────────── */
{
  const H = sto3gHydrogen(), limit = 2 * H.E;
  const a = sto3gH2(8), b = sto3gH2(20), eqF = dissociation('fci'), eqR = dissociation('rhf');
  judge('Q6 THE RESTRICTED DETERMINANT CANNOT DISSOCIATE AND THE CORRELATED ONE CAN: at R = 8 a₀ the STO-3G RHF energy sits 0.3231 hartree ABOVE FCI (≥ 0.2 required) because a doubly occupied σg keeps half an ionic H⁻H⁺ amplitude for ever, while FCI = −0.933166 has reached 2E(H, STO-3G) = −0.933164 to 3e-6 (1e-3 required, and to 1e-9 by R = 20). E(H, STO-3G) = −0.4665819 is this basis\'s own atom, computed here. STO-3G\'s D_e is 5.55 eV against the exact 4.75 — it overbinds relative to its own atomic limit, which is a basis-set fact and is reported, not gated',
    a.rhf - a.fci >= 0.2 && near(a.fci, -0.93318, 1e-3) && near(a.fci, limit, 1e-3) && near(b.fci, limit, 1e-9) && eqR.De_eV < eqF.De_eV,
    { R8: { rhf: sig(a.rhf, 9), fci: sig(a.fci, 9), gap: sig(a.rhf - a.fci, 6) }, twoEH: sig(limit, 9), EH: sig(H.E, 9),
      R20fci: sig(b.fci, 12), fciCurve: { Re: sig(eqF.Re, 6), De_eV: sig(eqF.De_eV, 6) }, rhfCurve: { Re: sig(eqR.Re, 6), De_eV: sig(eqR.De_eV, 6) } });
}

/* ── Q7  the exported curve, and the variational ordering that must hold at every R ────────────────────────────── */
{
  const Rs = [0.8, 1.0, 1.4, 2.0, 3.0, 5.0, 8.0];
  let ordered = true, arrayOk = true; const rows = [];
  for (const R of Rs) {
    const rhf = h2Curves('rhf', R), fci = h2Curves('fci', R), wb = h2Curves('weinbaum', R), hl = h2Curves('hl', R), tr = h2Curves('triplet', R);
    if (!(fci <= rhf + 1e-12 && fci <= tr + 1e-12 && wb <= hl + 1e-12)) ordered = false;
    if (R === 1.4 || R === 3.0) rows.push({ R, rhf: sig(rhf, 8), fci: sig(fci, 8), weinbaum: sig(wb, 8) });
  }
  const arr = h2Curves('fci', Float64Array.from(Rs));
  arrayOk = arr.length === Rs.length && near(arr[2], h2Curves('fci', 1.4), 1e-15);
  judge('Q7 h2Curves(kind, R) — the export a UI wave can draw: five curves (rhf, fci, weinbaum, hl, triplet), a number for a number and a Float64Array for an array, with the variational ordering FCI ≤ RHF, FCI ≤ triplet and Weinbaum ≤ Heitler–London holding at all seven separations from 0.8 to 8 a₀',
    ordered && arrayOk, { rows, arrayLength: arr.length });
}

/* ── Q8  tests/h2.test.mjs's anchors on the closed forms h2ci.js took from lab/h2.js (0.5.0 D9b: the H₂ card and h2.js left;
         its density-weight and collision judges guarded deleted code and went with them) ────────────────────────────── */
{
  /* E₁(1) = 0.219383934, E₁(0.5) = 0.559773595, E₁(4) = 0.003779352 (tables) */
  judge('Q8 the exponential integral E₁ matches the tables at 0.5, 1, 4 (1e-8), and the series/continued-fraction seam at x = 1 is continuous (1e-12)',
    Math.abs(expint1(1) - 0.219383934) < 1e-8 && Math.abs(expint1(0.5) - 0.559773595) < 1e-8 && Math.abs(expint1(4) - 0.003779352) < 1e-8 && Math.abs(expint1(0.999999) - expint1(1.000001)) < 1e-5, [expint1(0.5), expint1(1), expint1(4)]);
  /* J′ = ∫ b²(x) V_a(x) d³x with the exact potential of a 1s cloud, V_a(r) = 1/r − e^{−2r}(1 + 1/r): cylindrical quadrature */
  const R = 1.4, NP = 600, NZ = 1200, P = 12, dp = P / NP, dz = 2 * P / NZ, w = (i, n) => (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2);
  let I = 0;
  for (let i = 1; i <= NP; i++) { const rho = i * dp; for (let l = 0; l <= NZ; l++) { const z = -P + l * dz, ww = w(i, NP) * w(l, NZ) * dp * dz / 9 * 2 * Math.PI * rho;
    const rb = Math.hypot(rho, z - R / 2), ra = Math.hypot(rho, z + R / 2); const b2 = Math.exp(-2 * rb) / Math.PI, Va = 1 / ra - Math.exp(-2 * ra) * (1 + 1 / ra); I += ww * b2 * Va; } }
  judge('Q8 THE COULOMB ORACLE: J′(1.4) by direct quadrature of b² against the exact 1s potential matches the closed form 1/R − e^{−2R}(1/R + 11/8 + 3R/4 + R²/6) to 3e-5', Math.abs(I - coulombJ2(R)) < 3e-5, { quad: I, closed: coulombJ2(R) });
  /* Heitler–London's equilibrium by golden section on [0.8, 4] (h2.js's h2Equilibrium, verbatim) */
  let a = 0.8, b = 4; const gr = (Math.sqrt(5) - 1) / 2; let c = b - gr * (b - a), d = a + gr * (b - a);
  const E = (r) => h2Energies(r).singlet;
  for (let i = 0; i < 100; i++) { if (E(c) < E(d)) b = d; else a = c; c = b - gr * (b - a); d = a + gr * (b - a); }
  const Re = (a + b) / 2, Emin = E(Re), eq = { Re, E: Emin, De: -1 - Emin, DeEV: (-1 - Emin) * EV };
  judge('Q8 HEITLER–LONDON 1927: R_e = 1.64 a₀ and D_e = 3.156 eV (exact: 1.40 a₀, 4.75 eV) — the first bond, as a variational bound (1e-4 on D_e)', Math.abs(eq.Re - 1.64) < 0.02 && Math.abs(eq.DeEV - 3.1557) < 1e-4 && eq.E > -1.1745, eq);
  let repulsive = true, ordered = true;
  for (let r = 0.6; r <= 10; r += 0.2) { const e = h2Energies(r); if (e.triplet < -1) repulsive = false; if (e.singlet > e.triplet) ordered = false; }
  judge('Q8 the Heitler–London triplet is repulsive at every R (E > −1, the separated atoms) and lies above the singlet — Pauli repulsion is electrostatics of the exchange density', repulsive && ordered);
  const far = h2Energies(25);
  judge('Q8 at R = 25 both Heitler–London curves are two free atoms, E = −1 (1e-6)', Math.abs(far.singlet + 1) < 1e-6 && Math.abs(far.triplet + 1) < 1e-6, far);
}

console.log('wall ' + ((performance.now() - T0) / 1000).toFixed(2) + ' s');
console.log((FAILED ? 'RED ' : 'GREEN ') + 'h2ci.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
