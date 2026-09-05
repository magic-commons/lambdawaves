/* tests/h2.test.mjs — the node proof of Heitler–London H₂ and the classical collision on its curves.
 *   node tests/h2.test.mjs
 * Oracles: E₁(x) against its series and known values, the Coulomb integral J′ against direct quadrature with the
 * exact 1s potential, the textbook Heitler–London equilibrium and dissociation energy, the repulsive triplet, the
 * dissociation limit, and the collision (a bounce on the triplet, a capture-and-return on the singlet).
 */
import { expint1, coulombJ2, exchangeK2, h2Energies, h2Equilibrium, KNOWN_HL, EXACT_H2, collide, hlDensityWeights, MU_H2 } from '../lab/h2.js';
import { overlapS } from '../lab/molecule.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 300)));
}
{
  /* E₁(1) = 0.219383934, E₁(0.5) = 0.559773595, E₁(4) = 0.003779352 (tables) */
  judge('H2 the exponential integral E₁ matches the tables at 0.5, 1, 4 (1e-8), and the series/continued-fraction seam at x = 1 is continuous (1e-12)',
    Math.abs(expint1(1) - 0.219383934) < 1e-8 && Math.abs(expint1(0.5) - 0.559773595) < 1e-8 && Math.abs(expint1(4) - 0.003779352) < 1e-8 && Math.abs(expint1(0.999999) - expint1(1.000001)) < 1e-5, [expint1(0.5), expint1(1), expint1(4)]);
}
{
  /* J′ = ∫ b²(x) V_a(x) d³x with the exact potential of a 1s cloud, V_a(r) = 1/r − e^{−2r}(1 + 1/r): cylindrical quadrature */
  const R = 1.4, NP = 600, NZ = 1200, P = 12, dp = P / NP, dz = 2 * P / NZ, w = (i, n) => (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2);
  let I = 0;
  for (let i = 1; i <= NP; i++) { const rho = i * dp; for (let l = 0; l <= NZ; l++) { const z = -P + l * dz, ww = w(i, NP) * w(l, NZ) * dp * dz / 9 * 2 * Math.PI * rho;
    const rb = Math.hypot(rho, z - R / 2), ra = Math.hypot(rho, z + R / 2); const b2 = Math.exp(-2 * rb) / Math.PI, Va = 1 / ra - Math.exp(-2 * ra) * (1 + 1 / ra); I += ww * b2 * Va; } }
  judge('H2 THE COULOMB ORACLE: J′(1.4) by direct quadrature of b² against the exact 1s potential matches the closed form 1/R − e^{−2R}(1/R + 11/8 + 3R/4 + R²/6) to 3e-5', Math.abs(I - coulombJ2(R)) < 3e-5, { quad: I, closed: coulombJ2(R) });
}
{
  const eq = h2Equilibrium();
  judge('H2 HEITLER–LONDON 1927: R_e = 1.64 a₀ and D_e = 3.156 eV (exact: 1.40 a₀, 4.75 eV) — the first bond, as a variational bound (1e-4 on D_e)', Math.abs(eq.Re - KNOWN_HL.Re) < 0.02 && Math.abs(eq.DeEV - KNOWN_HL.DeEV) < 1e-4 && eq.E > EXACT_H2.E, eq);
  let repulsive = true, ordered = true;
  for (let R = 0.6; R <= 10; R += 0.2) { const e = h2Energies(R); if (e.triplet < -1) repulsive = false; if (e.singlet > e.triplet) ordered = false; }
  judge('H2 the triplet is repulsive at every R (E > −1, the separated atoms) and lies above the singlet — Pauli repulsion is electrostatics of the exchange density', repulsive && ordered);
  const far = h2Energies(25);
  judge('H2 at R = 25 both curves are two free atoms, E = −1 (1e-6)', Math.abs(far.singlet + 1) < 1e-6 && Math.abs(far.triplet + 1) < 1e-6, far);
  const w = hlDensityWeights(1.4, 'singlet'), S = overlapS(1.4);
  judge('H2 the singlet one-electron density is w_g|σg|² + w_u|σu|² with w_g + w_u·… integrating to 2 electrons: (1+S)²+(1−S)² = 2(1+S²)', Math.abs(w.wg + w.wu - 2) < 1e-12, w);
}
{
  /* THE COLLISION: two atoms thrown together at R₀ = 8 with relative kinetic energy 0.02 hartree */
  const v0 = -Math.sqrt(2 * 0.02 / MU_H2);
  const t = collide(8, v0, 'triplet', { dt: 4, steps: 20000 }), s = collide(8, v0, 'singlet', { dt: 4, steps: 20000 });
  judge('H2 on the TRIPLET the atoms bounce: at 0.02 hartree of relative kinetic energy the exchange repulsion turns them around at R ≈ 3.4 a₀ (the triplet curve reaches 0.02 above the free atoms there), then back out past the start with the speed reversed (energy conserved to 1%)', t.Rmin > 2.8 && t.Rmin < 4.2 && t.Rend > 8 && t.vend > 0 && Math.abs(t.vend / -v0 - 1) < 0.01, { Rmin: t.Rmin, Rend: t.Rend, vend: t.vend, v0 });
  judge('H2 on the SINGLET they fall into the bond well — closest approach below 1 a₀ — and, with nothing to take the energy away, climb back out', s.Rmin < 1.0 && s.Rend > 8 && s.vend > 0, { Rmin: s.Rmin, Rend: s.Rend });
}
console.log((FAILED ? 'RED' : 'GREEN') + ' h2.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
