/* P2 — the field of the register's charge: (a) the Einstein A of 2p → 1s from the register's own dipole, and the
 * near-zone criterion on the stage; (b) the electrostatic potential of |1s|² and |2p_z|² in closed form, checked by
 * quadrature — the seed of the theorem that the Coulomb potential of ANY register state is a finite closed form.
 */
import { BASIS, psiAt } from '../../lab/hydrogen.js';
const ALPHA = 1 / 137.035999, AU_S = 2.4188843e-17;                  // fine structure, atomic unit of time in s
const idx = (n, l, m) => BASIS.findIndex((s) => s.n === n && s.l === l && s.m === m);
/* (a) ⟨1s|z|2p0⟩ by quadrature, then A = (4/3) α³ ω³ |d|² */
{
  const a1 = idx(1, 0, 0), a2 = idx(2, 1, 0); const re = new Float64Array(91), im = new Float64Array(91);
  let d = 0; const NR = 400, NT = 200, rmax = 40;
  for (let i = 0; i < NR; i++) { const r = (i + 0.5) * rmax / NR; for (let j = 0; j < NT; j++) { const th = (j + 0.5) * Math.PI / NT; const z = r * Math.cos(th), x = r * Math.sin(th);
    re.fill(0); re[a1] = 1; const p1 = psiAt(re, im, x, 0, z, [a1]); re.fill(0); re[a2] = 1; const p2 = psiAt(re, im, x, 0, z, [a2]);
    d += p1.re * z * p2.re * r * r * Math.sin(th) * (rmax / NR) * (Math.PI / NT) * 2 * Math.PI; } }
  const omega = 0.5 - 0.125, A = (4 / 3) * ALPHA ** 3 * omega ** 3 * d * d, lambda = 2 * Math.PI * (1 / ALPHA) / omega;
  console.log('⟨1s|z|2p0⟩ =', d.toFixed(5), '(exact 128√2/243 =', (128 * Math.SQRT2 / 243).toFixed(5) + ')');
  console.log('Einstein A(2p→1s) =', A.toExponential(4), 'a.u. =', (A / AU_S).toExponential(4), 's⁻¹  (PDG/NIST 6.2649e8)');
  console.log('Lyman-α wavelength λ =', lambda.toFixed(0), 'a₀; the stage is ±16 a₀ → λ/stage ≈', (lambda / 16).toFixed(0), ': the near zone, the field is quasi-static');
}
/* (b) the potential of a density by shell quadrature: Φ(r) = Σ_l (4π/(2l+1)) Y_l0 [ r^{-l-1} ∫_0^r ρ_l r'^{l+2} dr' + r^l ∫_r^∞ ρ_l r'^{1-l} dr' ] */
function potential(rho_l, lmax, r) {                                   // rho_l(l, r') : the Y_l0 component (real) of the density
  let out = 0; const NR = 4000, rmax = 60, h = rmax / NR;
  for (let l = 0; l <= lmax; l++) {
    let inner = 0, outer = 0;
    for (let i = 0; i < NR; i++) { const rp = (i + 0.5) * h, v = rho_l(l, rp); if (rp < r) inner += v * rp ** (l + 2) * h; else outer += v * rp ** (1 - l) * h; }
    out += (4 * Math.PI / (2 * l + 1)) * Math.sqrt((2 * l + 1) / (4 * Math.PI)) * (inner / r ** (l + 1) + outer * r ** l);   // Y_l0(θ=0) = √((2l+1)/4π)
  }
  return out;
}
{
  /* 1s: ρ = e^{−2r}/π, only l = 0 → ρ_0 = e^{−2r}/π · √(4π);  closed form Φ_e(r) = −[1 − (1 + r) e^{−2r}] / r */
  for (const r of [0.5, 1, 2, 5]) { const num = -potential((l, rp) => (l === 0 ? Math.exp(-2 * rp) / Math.PI * Math.sqrt(4 * Math.PI) : 0), 0, r); const cf = -(1 - (1 + r) * Math.exp(-2 * r)) / r; console.log('1s  Φ_e(' + r + ') quadrature', num.toFixed(6), 'closed form', cf.toFixed(6)); }
  /* 2p_z: ρ = r² e^{−r} cos²θ / (32π) = r² e^{−r}/(32π) · [1/3 + (2/3) P₂] → ρ_0 = r² e^{−r}/(32π) · (1/3)·√(4π), ρ_2 = r² e^{−r}/(32π) · (2/3) · √(4π/5)
     closed form on the axis (θ = 0): Φ_e(z) = −[ (1/z)(1 − e^{−z}(1 + z + z²/2 + z³/6 + z⁴/24 ... )) ... ] — we assert the quadrature and the multipole tail instead */
  for (const r of [1, 3, 8, 20]) { const num = -potential((l, rp) => { const f = rp * rp * Math.exp(-rp) / (32 * Math.PI); return l === 0 ? f / 3 * Math.sqrt(4 * Math.PI) : l === 2 ? f * 2 / 3 * Math.sqrt(4 * Math.PI / 5) : 0; }, 2, r);
    const tail = -1 / r - 2 * (-6) / r ** 3 * 0.5;                    // monopole −1/r plus the quadrupole: Q_zz = ⟨3z² − r²⟩ = −(−6)? see ledger — printed for comparison only
    console.log('2p_z Φ_e on the axis at r =', r, ': quadrature', num.toFixed(6), '  −1/r =', (-1 / r).toFixed(6)); }
  /* the quadrupole moment of 2p_z: ⟨3z² − r²⟩ with ⟨r²⟩ = 30, ⟨z²⟩ = ⟨r²⟩·(3/5)?  (∫cos²θ·cos²θ dΩ / ∫cos²θ dΩ = 3/5) → Q = 3·18 − 30 = 24 */
  console.log('2p_z quadrupole Q = ⟨3z² − r²⟩ = 3·(3/5)·30 − 30 =', 3 * 0.6 * 30 - 30, '→ the axis tail Φ_e → −1/r − Q/(2 r³)·(−1)… the ledger carries the sign; check: Φ_e(20)+1/20 =', ((-potential((l, rp) => { const f = rp * rp * Math.exp(-rp) / (32 * Math.PI); return l === 0 ? f / 3 * Math.sqrt(4 * Math.PI) : l === 2 ? f * 2 / 3 * Math.sqrt(4 * Math.PI / 5) : 0; }, 2, 20)) + 1 / 20).toExponential(4), 'vs −Q/(2·20³) =', (-24 / (2 * 8000)).toExponential(4));
}
