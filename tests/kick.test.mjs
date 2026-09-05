/* tests/kick.test.mjs — the node proof of the SLAP (a sudden momentum impulse on the register).
 *   node tests/kick.test.mjs
 * Oracles: the closed-form momentum wavefunctions (a boost is a SHIFT in momentum space — a second, independent
 * route to every matrix element), the 1s→2p dipole 128√2/243, the bound part of the Thomas–Reiche–Kuhn sum rule
 * (which is what the register can hold of a boost), and Heisenberg's p = i[H, z] against a direct ∫p|φ|² d³p.
 */
import { BASIS, energy } from '../lab/hydrogen.js';
import { momentumFromTable, momentumTable, phiAt } from '../lab/momentum.js';
import { sphericalBessel, kickMatrixZ, applyKickZ, applyKick, momentumZ, escaped, AXIS_TO_Z } from '../lab/kick.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 300)));
}
const idx = (n, l, m) => BASIS.findIndex((s) => s.n === n && s.l === l && s.m === m);
const N = 91;
/* spherical Bessel */
{
  const j2 = (x) => (3 / (x * x * x) - 1 / x) * Math.sin(x) - 3 * Math.cos(x) / (x * x);
  let worst = 0;
  for (const x of [0.3, 1, 2.5, 7, 30]) worst = Math.max(worst, Math.abs(sphericalBessel(2, x) - j2(x)));
  let worstRec = 0;                                           // j_{L−1} + j_{L+1} = (2L+1)/x · j_L, the defining recurrence, across both régimes
  for (const x of [0.05, 0.5, 3, 9, 40]) for (let L = 1; L <= 9; L++) worstRec = Math.max(worstRec, Math.abs(sphericalBessel(L - 1, x) + sphericalBessel(L + 1, x) - (2 * L + 1) / x * sphericalBessel(L, x)) / (Math.abs(sphericalBessel(L, x)) + 1e-300));
  judge('K spherical Bessel functions: j₂ matches its closed form (1e-13) and the recurrence holds to 1e-9 for L ≤ 9 across x = 0.05 … 40 (Miller downward and upward régimes)', worst < 1e-13 && worstRec < 1e-9, { worst, worstRec });
  judge('K and near zero j_L ≈ x^L/(2L+1)!!: j₃(1e-4) = 1e-12/105', Math.abs(sphericalBessel(3, 1e-4) / (1e-12 / 105) - 1) < 1e-8);
}
/* the matrix at k = 0 is the identity; at small k the 1s→2p element is the dipole 128√2/243 */
{
  const M0 = kickMatrixZ(0);
  let dev = 0; for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) dev = Math.max(dev, Math.abs(M0.re[a * N + b] - (a === b ? 1 : 0)), Math.abs(M0.im[a * N + b]));
  judge('K k = 0 is the identity', dev === 0, dev);
  const a1 = idx(1, 0, 0), b2 = idx(2, 1, 0), k = 0.001;
  const M = kickMatrixZ(k);
  const el = { re: M.re[b2 * N + a1], im: M.im[b2 * N + a1] };
  const ratio = Math.hypot(el.re, el.im) / k, exact = 128 * Math.SQRT2 / 243;
  judge('K ⟨2p₀|e^{ikz}|1s⟩ / k → ⟨2p₀|z|1s⟩ = 128√2/243 = 0.74493 as k → 0 (k = 0.001, 1e-5), and it is purely imaginary (the i in ikz)', Math.abs(ratio / exact - 1) < 1e-5 && Math.abs(el.re) < 1e-6 * Math.abs(el.im), { ratio, exact, el });
  const diag = Math.hypot(M.re[a1 * N + a1], M.im[a1 * N + a1]);
  judge('K ⟨1s|e^{ikz}|1s⟩ = 1 − k²⟨z²⟩/2 + … with ⟨z²⟩₁ₛ = 1: 1 − 5e-5 at k = 0.01 (1e-7)', Math.abs(diag - (1 - k * k / 2)) < 1e-7, diag);
}
/* THE MOMENTUM ORACLE: a boost is a shift in momentum space — ⟨a|e^{ikz}|1s⟩ = ∫ φ_a*(p) φ_1s(p − kẑ) d³p, computed
   from the closed-form momentum functions on a cylindrical grid, against the multipole route */
{
  const k = 0.3, a1 = idx(1, 0, 0), M = kickMatrixZ(k);
  const T1 = momentumTable(1, 0, 0);
  const NP = 1200, NZ = 2400, P = 12, dpr = P / NP, dpz = 2 * P / NZ;
  const wS = (i, n) => (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2);
  let worst = 0, worstAt = null, checked = 0;
  for (let a = 0; a < N; a++) {
    if (BASIS[a].m !== 0) continue;
    const Ta = momentumTable(BASIS[a].n, BASIS[a].l, 0);
    let sr = 0, si = 0;
    for (let i = 0; i <= NP; i++) {
      const pr = i * dpr; if (pr === 0) continue;
      for (let j = 0; j <= NZ; j++) {
        const pz = -P + j * dpz, w = wS(i, NP) * wS(j, NZ) * dpr * dpz / 9 * 2 * Math.PI * pr;
        const A = momentumFromTable(Ta, pr, 0, pz), B = momentumFromTable(T1, pr, 0, pz - k);   // φ_a* φ_1s(p − k)
        sr += w * (A.re * B.re + A.im * B.im); si += w * (A.re * B.im - A.im * B.re);
      }
    }
    const mr = M.re[a * N + a1], mi = M.im[a * N + a1];
    const d = Math.hypot(sr - mr, si - mi);
    if (d > worst) { worst = d; worstAt = { state: BASIS[a].id, multipole: [mr, mi], shift: [sr, si] }; }
    checked++;
  }
  judge(`K THE MOMENTUM ORACLE: for all ${checked} m = 0 states the multipole matrix element ⟨a|e^{ikz}|1s⟩ equals the momentum-space SHIFT overlap ∫φ_a*(p)φ_1s(p−kẑ)d³p at k = 0.3 (3e-5; the oracle grid converges onto the multipole value from below) — two independent routes, position multipoles and closed-form momentum functions`, worst < 3e-5, { worst, worstAt });
}
/* what the register can hold of a boost: the bound part of the sum rule */
{
  const a1 = idx(1, 0, 0), re = new Float64Array(N), im = new Float64Array(N);
  re[a1] = 1;
  applyKickZ(re, im, 0.1);
  let n2 = 0; for (let a = 0; a < N; a++) n2 += re[a] * re[a] + im[a] * im[a];
  const esc = escaped(1, n2);
  /* the bound oscillator strengths 1s→np, n ≤ 6 (KNOWN: 0.4162, 0.0791, 0.0290, 0.0139, 0.0078) give Σ|z|² = 0.697 of ⟨z²⟩ = 1 */
  judge('K a slap of k = 0.1 on 1s knocks 0.30% of the electron OUT of the register — k²(⟨z²⟩ − Σ_{n≤6}|⟨np|z|1s⟩|²) = k² · 0.303, the continuum plus n > 6 share of the sum rule', esc > 0.0027 && esc < 0.0034, { escaped: esc, secondOrder: 0.01 * 0.303 });
  /* Ehrenfest with a deficit: ⟨p_z⟩ = k · Σ_bound f = 0.546 k, because the register holds only the bound part of the TRK sum */
  const re2 = new Float64Array(N), im2 = new Float64Array(N); re2[a1] = 1; applyKickZ(re2, im2, 0.05);
  const pz = momentumZ(re2, im2);
  judge('K EHRENFEST WITH A DEFICIT: after a slap of k = 0.05 the register\'s ⟨p_z⟩ is 0.5446 k (±0.3%), the bound share of the Thomas–Reiche–Kuhn sum rule (Σ f_{1s→np}, n ≤ 6) — the missing 45% is the continuum a six-shell register cannot hold', Math.abs(pz / 0.05 - 0.5446) < 0.003, { pzOverK: pz / 0.05 });
  /* the same ⟨p_z⟩ by the direct momentum-space integral ∫ p_z |φ|² d³p — a second route */
  const ids = []; for (let a = 0; a < N; a++) if (Math.hypot(re2[a], im2[a]) > 1e-12) ids.push(a);
  const G = 44, P = 5, h = 2 * P / G; let num = 0, den = 0;
  for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) for (let l = 0; l < G; l++) {
    const px = -P + (i + 0.5) * h, py = -P + (j + 0.5) * h, pzv = -P + (l + 0.5) * h;
    const v = phiAt(re2, im2, px, py, pzv, ids), d = v.re * v.re + v.im * v.im;
    num += pzv * d; den += d;
  }
  judge('K and ∫p_z|φ|²d³p on a 44³ momentum grid agrees with Heisenberg\'s p = i[H,z] to 2%', Math.abs(num / den - pz) < 0.02 * Math.abs(pz), { grid: num / den, heisenberg: pz });
}
/* a kick along x is the z-kick conjugated by a rotation: ⟨p_x⟩ > 0, ⟨p_z⟩ ≈ 0, by the momentum integral */
{
  const a1 = idx(1, 0, 0), re = new Float64Array(N), im = new Float64Array(N); re[a1] = 1;
  applyKick(re, im, 0.2, 'x');
  const ids = []; for (let a = 0; a < N; a++) if (Math.hypot(re[a], im[a]) > 1e-12) ids.push(a);
  const G = 40, P = 5, h = 2 * P / G; let nx = 0, nz = 0, den = 0;
  for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) for (let l = 0; l < G; l++) {
    const px = -P + (i + 0.5) * h, py = -P + (j + 0.5) * h, pz = -P + (l + 0.5) * h;
    const v = phiAt(re, im, px, py, pz, ids), d = v.re * v.re + v.im * v.im;
    nx += px * d; nz += pz * d; den += d;
  }
  const px = nx / den, pz = nz / den;
  judge('K a slap along x: ⟨p_x⟩ = +0.5446·k = 0.1089 (the 40³ momentum grid reads it within 5%; the rotation conjugation has the right sign) and ⟨p_z⟩ = 0', Math.abs(px - 0.1089) < 0.006 && Math.abs(pz) < 0.005, { px, pz, expected: 0.546 * 0.2, rot: AXIS_TO_Z.x });
  /* it jiggles: the dipole after a z-slap is not constant — a superposition rings at the Lyman-α beat */
  const rz = new Float64Array(N), iz = new Float64Array(N); rz[a1] = 1; applyKickZ(rz, iz, 0.05);
  const b2 = idx(2, 1, 0);
  judge('K the slapped 1s carries 2p₀ (and higher p states) so it now has a dipole to ring with: |c_{2p₀}|² = k²·0.555 at k = 0.05', Math.abs((rz[b2] ** 2 + iz[b2] ** 2) / (0.0025 * 0.5549) - 1) < 0.02, rz[b2] ** 2 + iz[b2] ** 2);
}

/* A SLAP ACTS AT THE CURRENT LOGICAL TIME.  The register's operator hook has a fast path for operators that commute
   with H (every rotor does); a boost does not, so it must be applied to c(t) and re-anchored.  Found by the
   oscillator: a slap "at t = 4" applied to the anchor instead reads ⟨p⟩ = k cos 4 = −0.65k at t = 4. */
{
  const { Register } = await import('../lab/state.js');
  const R = new Register(); R.clear(); R.set(0, 1, 0);                          // 1s, hydrogen
  const t = 4.0;
  R.kick(0.1, 'z', t);
  const c = R.at(t);
  const pAt = momentumZ(c.re, c.im);
  const c0 = R.at(0), pAt0 = momentumZ(c0.re, c0.im);
  judge('K a slap at logical time t = 4 acts on c(t), not on the anchor: right after it ⟨p_z⟩ = 0.546k (the bound share), and read back at t = 0 the same state has a different ⟨p_z⟩ — the kick is not a commuting operator', Math.abs(pAt / 0.1 - 0.546) < 0.02 && Math.abs(pAt0 - pAt) > 0.01, { pAt, pAt0 });
}
/* A KICK ALONG ANY DIRECTION (the bow): rotate the direction onto ẑ, kick, rotate back — and the DRAG toy */
{
  const { rotorsToZ, applyKickAlong } = await import('../lab/kick.js');
  const rx = rotorsToZ([1, 0, 0]);
  judge('K rotorsToZ(x̂) is the y-rotation by −π/2 the x-kick already used (its z-rotation is by 0)', Math.abs(rx[0].angle) < 1e-15 && rx[1].axis === 'y' && Math.abs(rx[1].angle + Math.PI / 2) < 1e-15, rx);
  const a1 = idx(1, 0, 0), re = new Float64Array(N), im = new Float64Array(N); re[a1] = 1;
  const d = [1, 1, 1].map((v) => v / Math.sqrt(3)), k = 0.2;
  applyKickAlong(re, im, k, d);
  const ids = []; for (let a = 0; a < N; a++) if (Math.hypot(re[a], im[a]) > 1e-12) ids.push(a);
  const G = 40, P = 5, h = 2 * P / G; let sx = 0, sy = 0, sz = 0, den = 0;
  for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) for (let l = 0; l < G; l++) {
    const px = -P + (i + 0.5) * h, py = -P + (j + 0.5) * h, pz = -P + (l + 0.5) * h;
    const v = phiAt(re, im, px, py, pz, ids), w = v.re * v.re + v.im * v.im;
    sx += px * w; sy += py * w; sz += pz * w; den += w;
  }
  const p = [sx / den, sy / den, sz / den], mag = Math.hypot(...p), cosang = (p[0] * d[0] + p[1] * d[1] + p[2] * d[2]) / mag;
  judge('K a kick along the diagonal (1,1,1)/√3 gives ⟨p⟩ ALONG that direction (cos > 0.999) with |⟨p⟩| = 0.5446k by the momentum-space integral (40³ grid, within 5%) — the bow can aim anywhere', cosang > 0.999 && Math.abs(mag / k - 0.5446) < 0.03, { p, mag, cosang });
}
{
  const { Register } = await import('../lab/state.js');
  const R = new Register(); R.clear(); R.set(idx(1, 0, 0), Math.SQRT1_2, 0); R.set(idx(2, 1, 0), Math.SQRT1_2, 0);
  R.setDamping(0.1);
  const c10 = R.at(10), c0 = R.at(0), cm = R.at(-3);
  const p1s = c10.re[idx(1, 0, 0)] ** 2 + c10.im[idx(1, 0, 0)] ** 2, p2p = c10.re[idx(2, 1, 0)] ** 2 + c10.im[idx(2, 1, 0)] ** 2;
  const expect2p = 0.5 * Math.exp(-2 * 0.1 * 0.375 * 10);
  judge('K THE DRAG TOY (labelled non-physics): with γ = 0.1 the 2p population decays as e^{−2γ(E₂−E₁)t} = e^{−0.75} at t = 10 while 1s is untouched, nothing happens at t = 0 or backwards, and the norm drops — the wave "settles"', Math.abs(p2p - expect2p) < 1e-12 && Math.abs(p1s - 0.5) < 1e-12 && Math.abs(c0.re[idx(2, 1, 0)] ** 2 - 0.5) < 1e-12 && Math.abs(cm.re[idx(2, 1, 0)] ** 2 + cm.im[idx(2, 1, 0)] ** 2 - 0.5) < 1e-12 && p1s + p2p < 1, { p2p, expect2p, p1s });
  R.setDamping(0);
  const u = R.at(10);
  judge('K and γ = 0 is the exact unitary register again (norm 1 at t = 10)', Math.abs(u.re[idx(2, 1, 0)] ** 2 + u.im[idx(2, 1, 0)] ** 2 - 0.5) < 1e-12 && R.damping === 0);
}
console.log((FAILED ? 'RED' : 'GREEN') + ' kick.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
