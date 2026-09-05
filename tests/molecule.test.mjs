/* tests/molecule.test.mjs — the node proof of H₂⁺ in the 1s LCAO basis.
 *   node tests/molecule.test.mjs
 * Oracles: the three two-centre integrals by direct cylindrical quadrature of the 1s orbitals (the closed forms
 * must match), the variational bound against the exact Bates–Ledsham–Stewart energies, the textbook LCAO
 * equilibrium, the σu nodal plane, norm conservation in the non-orthogonal basis, and the tunnelling period.
 */
import { overlapS, coulombJ, resonanceK, energies, EXACT_REFERENCE, equilibrium, moState, moAt, aoAmplitudes, populationA, tunnelPeriod, psiAt, fieldModes, EV } from '../lab/molecule.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 300)));
}
/* THE INTEGRAL ORACLE: S, J, K by cylindrical quadrature (ρ, z), φ integrated analytically (2π) */
{
  const R = 2, A = -R / 2, B = R / 2, NP = 700, NZ = 1400, P = 14, dp = P / NP, dz = 2 * P / NZ;
  const w = (i, n) => (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2);
  let s = 0, j = 0, k = 0;
  for (let i = 1; i <= NP; i++) {
    const rho = i * dp;
    for (let l = 0; l <= NZ; l++) {
      const z = -P + l * dz, ww = w(i, NP) * w(l, NZ) * dp * dz / 9 * 2 * Math.PI * rho;
      const ra = Math.hypot(rho, z - A), rb = Math.hypot(rho, z - B);
      const fa = Math.exp(-ra) / Math.sqrt(Math.PI), fb = Math.exp(-rb) / Math.sqrt(Math.PI);
      s += ww * fa * fb; j += ww * fa * fa * (-1 / rb); k += ww * fa * fb * (-1 / ra);
    }
  }
  judge('M THE INTEGRAL ORACLE at R = 2: the closed forms S = e^{−R}(1+R+R²/3), J = −1/R + e^{−2R}(1+1/R), K = −e^{−R}(1+R) match direct quadrature of the 1s orbitals to 5e-5 (K carries the 1/r_A cusp and converges slowest)', Math.abs(s - overlapS(R)) < 2e-5 && Math.abs(j - coulombJ(R)) < 2e-5 && Math.abs(k - resonanceK(R)) < 5e-5, { S: [s, overlapS(R)], J: [j, coulombJ(R)], K: [k, resonanceK(R)] });
}
/* the variational bound, and what it misses */
{
  const worst = EXACT_REFERENCE.map((p) => energies(p.R).Eg - p.E);
  judge('M THE BOUND: at R = 1, 2, 3, 4 the LCAO σg energy lies ABOVE the exact Bates–Ledsham–Stewart energy — by 0.163 at R = 1, where frozen 1s orbitals are worst, down to 0.009 at R = 4 — a variational upper bound, never below', worst.every((d) => d > 0 && d < 0.2) && worst[0] > worst[3], worst);
  const eq = equilibrium();
  judge('M the textbook LCAO equilibrium: R_e = 2.49 a₀, D_e = 1.76 eV (exact: 2.00 a₀, 2.79 eV) — the frozen 1s orbitals miss the contraction toward the bond', Math.abs(eq.Re - 2.49) < 0.01 && Math.abs(eq.DeEV - 1.76) < 0.02, eq);
  const far = energies(30);
  judge('M at R = 30 both orbitals go to the free atom, E = −½ (1e-8): the molecule dissociates into H + H⁺', Math.abs(far.Eg + 0.5) < 1e-8 && Math.abs(far.Eu + 0.5) < 1e-8, far);
  const e2 = energies(2);
  judge('M at R = 2 the bonding orbital is bound (E_g = −0.554) and the antibonding is not (E_u = −0.161 > −½): σu pushes the protons apart', e2.Eg < -0.5 && e2.Eu > -0.5 && Math.abs(e2.Eg + 0.5538) < 2e-3 && Math.abs(e2.Eu + 0.1609) < 2e-3, e2);
}
/* the orbitals themselves */
{
  const R = 2;
  const u = psiAt(moState('sigma_u', R), R, 0, 0.7, -0.3, 0), g = psiAt(moState('sigma_g', R), R, 0, 0.7, -0.3, 0);
  judge('M σu has a nodal plane at z = 0 (ψ = 0 there to 1e-15) and σg does not', Math.abs(u.re) < 1e-15 && Math.abs(g.re) > 0.05, { u: u.re, g: g.re });
  /* norm in the non-orthogonal basis: |c_a|² + |c_b|² + 2 S Re(c_a c_b*) = 1 for every state and time */
  let worst = 0;
  for (const kind of ['sigma_g', 'sigma_u', 'on_A']) for (const t of [0, 3.3, 17]) {
    const ao = aoAmplitudes(moAt(moState(kind, R), R, t), R), S = overlapS(R);
    const n = ao.a[0] ** 2 + ao.a[1] ** 2 + ao.b[0] ** 2 + ao.b[1] ** 2 + 2 * S * (ao.a[0] * ao.b[0] + ao.a[1] * ao.b[1]);
    worst = Math.max(worst, Math.abs(n - 1));
  }
  judge('M every state stays normalised in the non-orthogonal AO basis at every time (1e-14)', worst < 1e-14, worst);
}
/* THE FIRST MOLECULAR DYNAMICS: the electron on A tunnels to B and back with period 2π/(E_u − E_g) */
{
  const R = 2, T = tunnelPeriod(R), st = moState('on_A', R);
  const pA = (t) => populationA(aoAmplitudes(moAt(st, R, t), R), R);
  judge('M the electron placed on A is on A (population 1), on B at T/2 (population 0), and back on A at T — with T = 2π/(E_u − E_g) = 16.0 a.u. at R = 2', Math.abs(pA(0) - 1) < 1e-14 && Math.abs(pA(T / 2)) < 1e-12 && Math.abs(pA(T) - 1) < 1e-12 && Math.abs(T - 15.99) < 0.02, { T, p0: pA(0), pHalf: pA(T / 2), pT: pA(T) });
  const m = fieldModes(st, R, 0);
  judge('M the field modes: two 1s tables centred on the protons at ±R/2 with the AO amplitudes (c_a = 1, c_b = 0 for the electron on A)', m.length === 2 && m[0].center[2] === -1 && m[1].center[2] === 1 && Math.abs(m[0].re - 1) < 1e-14 && Math.abs(m[1].re) < 1e-14, m.map((x) => [x.re, x.center]));
}

console.log((FAILED ? 'RED' : 'GREEN') + ' molecule.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
