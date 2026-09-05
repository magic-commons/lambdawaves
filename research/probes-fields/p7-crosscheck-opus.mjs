/* P7 — Fable's cross-checks of Opus's rival round:
 *  (a) the STANDING three-fold: in Josh's state the k = 3 harmonic has two sources, 4d₊2 × 2p₋1 (ΔE = 3/32, turning) and
 *      4d₊2 × 4p₋1 (ΔE = 0, static). Their amplitudes on rings of r = 6, 12, 16 — Opus says the static one wins beyond r ≈ 9.
 *  (b) the Hellmann–Feynman force on nucleus B of LCAO H₂⁺ at R = 2 by a quadrature CENTRED ON B (r_B, θ_B), where the
 *      kernel (x − R_B)/r_B³ · r_B² dr_B dΩ = cos θ_B dr_B dΩ has no singularity — against Opus's −0.13390616 and P4's −0.130157.
 */
import { BASIS, psiAt } from '../../lab/hydrogen.js';
const idx = (n, l, m) => BASIS.findIndex((s) => s.n === n && s.l === l && s.m === m);
/* (a) */
{
  const pairs = [['4d+2 × 2p-1 (turning, ΔE = 3/32)', idx(4, 2, 2), idx(2, 1, -1)], ['4d+2 × 4p-1 (static, ΔE = 0)', idx(4, 2, 2), idx(4, 1, -1)]];
  const harm3 = (a, b, r) => { const re = new Float64Array(91), im = new Float64Array(91); re[a] = 0.5; re[b] = 0.5;   // Josh's equal amplitudes |c|² = 1/4
    const N = 360, th = Math.PI / 2.4; let cr = 0, ci = 0, m0 = 0; for (let i = 0; i < N; i++) { const phi = 2 * Math.PI * i / N; const p = psiAt(re, im, r * Math.sin(th) * Math.cos(phi), r * Math.sin(th) * Math.sin(phi), r * Math.cos(th), [a, b]); const d = p.re * p.re + p.im * p.im; cr += d * Math.cos(3 * phi); ci -= d * Math.sin(3 * phi); m0 += d; } return { h3: 2 * Math.hypot(cr, ci) / N, mean: m0 / N }; };
  for (const r of [6, 9, 12, 16]) { const t = harm3(pairs[0][1], pairs[0][2], r), s = harm3(pairs[1][1], pairs[1][2], r); console.log('r =', r, ': |h3| turning =', t.h3.toExponential(3), ', static =', s.h3.toExponential(3), '→ static/turning =', (s.h3 / t.h3).toFixed(2)); }
}
/* (b) */
{
  const R = 2, zA = -R / 2, zB = R / 2, S = Math.exp(-R) * (1 + R + R * R / 3);
  const NR = 2000, NT = 400, NP = 1, rmax = 30, dr = rmax / NR, dth = Math.PI / NT;
  let Fz = 0;
  for (let i = 0; i < NR; i++) { const rb = (i + 0.5) * dr; for (let j = 0; j < NT; j++) { const th = (j + 0.5) * dth, ct = Math.cos(th), st = Math.sin(th);
    const z = zB + rb * ct, rho = rb * st, rA = Math.hypot(rho, z - zA);
    const pa = Math.exp(-rA) / Math.sqrt(Math.PI), pb = Math.exp(-rb) / Math.sqrt(Math.PI), dens = (pa + pb) * (pa + pb) / (2 * (1 + S));
    Fz += dens * ct * dr * st * dth * 2 * Math.PI; } }                     // ∫ ρ (z − z_B)/r_B³ d³x = ∫ ρ cosθ_B dr_B sinθ dθ dφ
  console.log('F_elec on B by the B-centred quadrature =', Fz.toFixed(8), ' (Opus −0.13390616; P4 cylindrical −0.130157) → F_HF = F_elec + 1/R² =', (Fz + 0.25).toFixed(8), '; Pulay = F_HF + dE/dR with −dE/dR = 0.05380439 →', (Fz + 0.25 - 0.05380439).toFixed(8));
}
