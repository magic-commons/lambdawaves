/* gaussian.js — s-type contracted Gaussian integrals (superseded by lab/md.js; kept under tests/lib for the proofs) for any number of centres on the z axis, any exponents.
 * Atomic units.  STATUS: EXACT closed forms (Boys F₀ from h2ci.js); KNOWN formulas (Szabo–Ostlund App. A).
 *
 * Every primitive is a normalised 1s Gaussian N e^{−α r²}, N = (2α/π)^{3/4}.  For primitives a (centre A) and b
 * (centre B) with p = a + b, μ = ab/p, R² = |A − B|² and product centre P = (aA + bB)/p:
 *     S_ab = N_aN_b (π/p)^{3/2} e^{−μR²}         T_ab = μ(3 − 2μR²) S_ab          z_ab = P_z S_ab
 *     V_ab^C = −Z_C N_aN_b (2π/p) e^{−μR²} F₀(p|P − C|²)
 *     (ab|cd) = N_aN_bN_cN_d 2π^{5/2}/(pq√(p+q)) e^{−μ_ab R_AB² − μ_cd R_CD²} F₀(pq/(p+q)|P − Q|²)
 * A basis function is one contracted set per centre (STO-3G: three primitives).  `sBasis` returns every matrix a
 * self-consistent field or a real-time propagation needs: S, T, V, h = T + V, the dipole Z, the chemist's-notation
 * two-electron tensor g[((i n + j) n + k) n + l] = (ij|kl), and the nuclear repulsion.  h2ci.js's homonuclear
 * `sto3gIntegrals` is the special case this generalises; tests/scf.test.mjs holds the two against each other.
 */
import { boys0, STO3G_H } from '../../lab/h2ci.js';

/** the STO-3G 1s contraction at Slater exponent ζ: α_i(ζ) = α_i(1) ζ², the tabulated set being ζ = 1.24 (KNOWN) */
export function sto3g1s(zeta) {
  return { alpha: STO3G_H.alpha.map((a) => a * (zeta / 1.24) ** 2), coef: STO3G_H.coef.slice() };
}
/** the Szabo–Ostlund exponents: hydrogen 1.24, helium 2.0925 (KNOWN, Hehre–Stewart–Pople 1969) */
export const ZETA = { H: 1.24, He: 2.0925 };

/**
 * sBasis(centres) → { n, S, T, V, h, Z, eri, Enuc, centres }
 * centres: [{ z, Z: nuclearCharge, alpha: [...], coef: [...] }], one contracted s function per centre.
 */
export function sBasis(centres) {
  const n = centres.length, N = (a) => Math.pow(2 * a / Math.PI, 0.75);
  const prim = centres.map((c) => ({ z: c.z, a: c.alpha, d: c.coef.map((w, i) => w * N(c.alpha[i])) }));
  for (const p of prim) {                                                     // unit self-overlap per contracted function
    let s = 0; for (let i = 0; i < p.a.length; i++) for (let j = 0; j < p.a.length; j++) s += p.d[i] * p.d[j] * Math.pow(Math.PI / (p.a[i] + p.a[j]), 1.5);
    p.d = p.d.map((v) => v / Math.sqrt(s));
  }
  const S = new Float64Array(n * n), T = new Float64Array(n * n), V = new Float64Array(n * n), Z = new Float64Array(n * n);
  for (let A = 0; A < n; A++) for (let B = 0; B < n; B++) {
    const pa = prim[A], pb = prim[B], R2 = (pa.z - pb.z) ** 2; let s = 0, t = 0, v = 0, dz = 0;
    for (let i = 0; i < pa.a.length; i++) for (let j = 0; j < pb.a.length; j++) {
      const a = pa.a[i], b = pb.a[j], p = a + b, mu = a * b / p, c = pa.d[i] * pb.d[j];
      const K = c * Math.pow(Math.PI / p, 1.5) * Math.exp(-mu * R2), P = (a * pa.z + b * pb.z) / p;
      s += K; t += K * mu * (3 - 2 * mu * R2); dz += K * P;
      for (const C of centres) v += -C.Z * c * (2 * Math.PI / p) * Math.exp(-mu * R2) * boys0(p * (P - C.z) ** 2);
    }
    S[A * n + B] = s; T[A * n + B] = t; V[A * n + B] = v; Z[A * n + B] = dz;
  }
  const h = Float64Array.from(T, (x, k) => x + V[k]);
  const eri = new Float64Array(n ** 4), idx = (i, j, k, l) => ((i * n + j) * n + k) * n + l;
  for (let A = 0; A < n; A++) for (let B = A; B < n; B++) for (let C = 0; C < n; C++) for (let D = C; D < n; D++) {
    if (A * n + B > C * n + D) continue;                                    // (AB|CD) = (CD|AB), symmetric pairs only
    const pa = prim[A], pb = prim[B], pc = prim[C], pd = prim[D], RAB2 = (pa.z - pb.z) ** 2, RCD2 = (pc.z - pd.z) ** 2;
    let tot = 0;
    for (let i = 0; i < pa.a.length; i++) for (let j = 0; j < pb.a.length; j++) {
      const a = pa.a[i], b = pb.a[j], p = a + b, mab = a * b / p, P = (a * pa.z + b * pb.z) / p, cab = pa.d[i] * pb.d[j] * Math.exp(-mab * RAB2);
      for (let k = 0; k < pc.a.length; k++) for (let l = 0; l < pd.a.length; l++) {
        const c = pc.a[k], d = pd.a[l], q = c + d, mcd = c * d / q, Q = (c * pc.z + d * pd.z) / q;
        tot += cab * pc.d[k] * pd.d[l] * Math.exp(-mcd * RCD2) * 2 * Math.pow(Math.PI, 2.5) / (p * q * Math.sqrt(p + q)) * boys0(p * q / (p + q) * (P - Q) ** 2);
      }
    }
    for (const [i, j, k, l] of [[A, B, C, D], [B, A, C, D], [A, B, D, C], [B, A, D, C], [C, D, A, B], [D, C, A, B], [C, D, B, A], [D, C, B, A]]) eri[idx(i, j, k, l)] = tot;
  }
  let Enuc = 0;
  for (let A = 0; A < n; A++) for (let B = A + 1; B < n; B++) Enuc += centres[A].Z * centres[B].Z / Math.abs(centres[A].z - centres[B].z);
  const nuclearDipole = centres.reduce((acc, c) => acc + c.Z * c.z, 0);
  return { n, S, T, V, h, Z, eri, Enuc, nuclearDipole, centres };
}
