/* P4 — the HELLMANN–FEYNMAN ELECTROSTATIC THEOREM on the lab's H₂⁺ (LCAO 1s_A + 1s_B).
 * The theorem: for an exact eigenstate, the force on nucleus B is the CLASSICAL electrostatic force of the electron
 * density plus the other nucleus: F_B = ∫ ρ(x) (x − R_B)/|x − R_B|³ d³x − Z_A Z_B (R_B − R_A)/R³  (electron charge −1).
 * For the LCAO trial function it is NOT exact — the mismatch against −dE/dR is the "Pulay force", and its size is
 * the number that says how far a minimal basis is from the theorem.  Both sides here, at R = 2.
 */
import { energies, overlapS } from '../../lab/molecule.js';
const R0 = 2, dR = 1e-4;
const M = energies(R0); console.log('energies(2) →', JSON.stringify(M));
const Eg = (R) => { const m = energies(R); for (const k of ['Eg', 'E_g', 'g', 'Etot', 'E']) if (typeof m[k] === 'number') return m[k]; for (const k of Object.keys(m)) if (typeof m[k] === 'number' && m[k] < -0.5 && m[k] > -1.2) return m[k]; return NaN; };
const dEdR = (Eg(R0 + dR) - Eg(R0 - dR)) / (2 * dR);
console.log('E_g(2) =', Eg(R0).toFixed(6), 'Eh (the known LCAO value −0.5538 at R = 2; exact −0.6026);  −dE/dR =', (-dEdR).toFixed(6));
/* the electrostatic force on nucleus B at (0,0,R/2) from the LCAO density ρ = (ψ_A + ψ_B)²/(2(1+S)), ψ = e^{−r}/√π, by (ρ_cyl, z) quadrature */
const S = overlapS(R0);
const zA = -R0 / 2, zB = R0 / 2;
let Fz = 0; const NR = 800, NZ = 1600, rmax = 14, zmin = -14, zmax = 14, dr = rmax / NR, dz = (zmax - zmin) / NZ;
for (let i = 0; i < NR; i++) { const rho = (i + 0.5) * dr; for (let j = 0; j < NZ; j++) { const z = zmin + (j + 0.5) * dz;
  const rA = Math.hypot(rho, z - zA), rB = Math.hypot(rho, z - zB); const pa = Math.exp(-rA) / Math.sqrt(Math.PI), pb = Math.exp(-rB) / Math.sqrt(Math.PI);
  const dens = (pa + pb) * (pa + pb) / (2 * (1 + S));
  Fz += dens * (z - zB) / (rB * rB * rB) * 2 * Math.PI * rho * dr * dz; } }
const Fnuc = 1 / (R0 * R0);                                             // A repels B along +z
console.log('electron pull on B (toward A, along −z):', Fz.toFixed(6), '; nuclear repulsion +1/R² =', Fnuc.toFixed(6), '; Hellmann–Feynman F_B =', (Fz + Fnuc).toFixed(6), '(positive = apart)');
console.log('compare −dE/dR (the variational force) =', (-dEdR).toFixed(6), '; the difference is the Pulay term of a minimal basis:', (Fz + Fnuc + dEdR).toFixed(6));
console.log('at the exact equilibrium R_e = 2.00 a₀ (exact H₂⁺), F_HF must vanish; the LCAO minimum sits at R ≈ 2.49 where its own −dE/dR = 0');
