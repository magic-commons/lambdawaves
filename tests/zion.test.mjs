/* tests/zion.test.mjs — hydrogen-like ions by exact scaling.
 *   node tests/zion.test.mjs
 */
import { BASIS, orbitalFromTable, radial } from '../lab/hydrogen.js';
import { momentumFromTable } from '../lab/momentum.js';
import { HAMILTONIANS, setZ, getZ, getHamiltonian } from '../lab/hamiltonian.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 300)));
}
function simpson(f, a, b, N) { const h = (b - a) / N; let s = f(a) + f(b); for (let i = 1; i < N; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return s * h / 3; }
const H = HAMILTONIANS.hydrogen;
{
  setZ(2);
  judge('Z He⁺ (Z = 2): E_1s = −2, E_2 = −0.5, the label says so, and Stark / the hydrogen theorems stand down', Math.abs(H.energy(0) + 2) < 1e-15 && Math.abs(H.energy(1) + 0.5) < 1e-15 && H.label.includes('Z = 2') && H.stark === false && H.hydrogenTheorems === false && getZ() === 2);
  let worst = 0;
  for (const [n, l] of [[1, 0], [2, 1], [3, 2], [5, 0]]) {
    const I = simpson((r) => { const R = H.radial(n, l, r); return R * R * r * r; }, 0, 60, 30000);
    worst = Math.max(worst, Math.abs(I - 1));
  }
  judge('Z the scaled radial functions Z^{3/2}R(Zr) stay normalised (1e-8) — lengths shrink by Z, nothing else changes', worst < 1e-8, worst);
  const rmean = simpson((r) => { const R = H.radial(1, 0, r); return R * R * r * r * r; }, 0, 40, 30000);
  judge('Z ⟨r⟩_1s = 1.5/Z = 0.75 for He⁺', Math.abs(rmean - 0.75) < 1e-8, rmean);
}
{
  /* the tables the kernel gets: the position twin must equal Z^{3/2} ψ(Zx), the momentum twin Z^{−3/2} φ(p/Z) */
  setZ(3);
  let worstX = 0, worstP = 0;
  for (const s of BASIS) {
    if ((s.n + s.l + s.m) % 3) continue;
    const T = H.tableFor(s), B = HAMILTONIANS.hydrogen === H ? null : null;
    const base = (await import('../lab/hydrogen.js')).modeTable(s.n, s.l, s.m);
    for (const [x, y, z] of [[0.3, -0.2, 0.5], [1.1, 0.7, -0.4]]) {
      const a = orbitalFromTable(T, x, y, z), b = orbitalFromTable(base, 3 * x, 3 * y, 3 * z);
      worstX = Math.max(worstX, Math.abs(a.re - Math.pow(3, 1.5) * b.re), Math.abs(a.im - Math.pow(3, 1.5) * b.im));
    }
    const M = H.momentumTableFor(s), Mb = (await import('../lab/momentum.js')).momentumTable(s.n, s.l, s.m);
    for (const [px, py, pz] of [[0.6, -0.4, 1.0], [2.2, 1.4, -0.8]]) {
      const a = momentumFromTable(M, px, py, pz), b = momentumFromTable(Mb, px / 3, py / 3, pz / 3);
      worstP = Math.max(worstP, Math.abs(a.re - b.re / Math.pow(3, 1.5)), Math.abs(a.im - b.im / Math.pow(3, 1.5)));
    }
  }
  judge('Z the kernel tables for Z = 3 are exactly Z^{3/2}ψ(Zx) in position space (1e-13) — the polynomial is untouched, only the ρ-scale n/Z and the norm change', worstX < 1e-13, worstX);
  judge('Z and Z^{−3/2}φ(p/Z) in momentum space (1e-13), with the envelope exponent kept at n+1 while the scale is n/Z', worstP < 1e-13, worstP);
  judge('Z the box scales: the position box is hydrogen\'s over Z, the momentum box hydrogen\'s times Z', Math.abs(H.domainFor(2) - 16 / 3) < 1e-12 && Math.abs(H.domainForP(2) - 3 * 2.0) < 1e-12);
  setZ(1);
  judge('Z = 1 restores hydrogen exactly: E_1s = −½, the theorems and Stark are back, the label is HYDROGEN', Math.abs(H.energy(0) + 0.5) < 1e-15 && H.stark && H.hydrogenTheorems && H.label.startsWith('HYDROGEN  '));
}
console.log((FAILED ? 'RED' : 'GREEN') + ' zion.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
