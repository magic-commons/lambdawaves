/* sturmianreg.js — THE SCALE on the register: the Sturmian propagator over the 140 labels of n ≤ 7, assembled block by block.
 *
 * THE SCALE TOOK n = 7 (iteration 009 N7; at 008 A7 it had stayed at the 91 with zero rows for n = 7).  Every (l, m) block now
 * holds its n = 7 label — 49 blocks of ≤ 7 labels, the new (6, m) blocks one label each — so an n = 7 coefficient has its own
 * column and evolves under the scale.  One more Sturmian in a block moves every variational eigenvalue of that block DOWN
 * (Hylleraas–Undheim–MacDonald interlacing: E_k(n ≤ 7) ≤ E_k(n ≤ 6) ≤ E_{k+1}(n ≤ 7)), or holds it where it is exact (the label
 * n₀ at λ = Z/n₀); THE LOCK's sturmian rows were re-captured by name for it (research/iteration-009/N7-BUILD.md holds the table).
 *
 * sturmian.js gives S, H and the generalised eigenproblem H C = S C E, CᵀSC = I on ANY label set (closed forms, EXACT;
 * eigenvalues VARIATIONAL).  On the whole register the (l, m) blocks are exactly degenerate in ±m pairs (neither H nor
 * S sees the sign of m) and, at λ = 1/n, across l as well — and an eigen-solver handed all 140 labels at once is free to
 * return any orthonormal basis of a degenerate eigenspace, mixing blocks.  The instrument needs every eigenvector to
 * carry ONE (l, m): then the Zeeman term is the exact shift E_k + B m_k/2, the SPECTRUM ladder can name its levels, and
 * "load eigenstate k" loads a state of definite m.  So the register's propagator is built one (l, m) block at a time
 * (49 blocks of ≤ 7 labels, each through createSturmian) and assembled into the 140 × 140 objects the register and the
 * SPECTRUM read:
 *     c(t) = C e^{−iEt} CᵀS c(0),      populations |⟨C_k|S|c⟩|² / ⟨c|S|c⟩,      norm ⟨c|S|c⟩
 * — the same law as sturmian.js's evolve (the assembled C is block-diagonal, so exp(−iS⁻¹Ht) is unchanged).  E is
 * sorted ascending over the register; column k remembers its block (lK, mK) and the label of largest S-weight in it
 * (nK, the ladder's colour).  A Sturmian record for every label (n_rec = 1/λ, the label's own Laguerre and Legendre
 * tables) is what the FIELD draws, through the hydrogen kernel unchanged (sturmian.js, RENDERING).
 *
 * The interface is what Register.setPropagator() reads — evolve, norm, populations, energyOf, eigenstate, E, C, CtS,
 * H, S, rank, mK — and nothing in it is Sturmian-specific: any propagator in a non-orthogonal basis plugs in.
 *
 * STATUS: EXACT (bookkeeping over sturmian.js's closed forms; judged against the unblocked 140 × 140 solve to 1e-10 in
 * tests/sturmianreg.test.mjs: same eigenvalues, same evolution, CᵀSC = I, block purity), VARIATIONAL (the eigenvalues).
 */
import { BASIS } from './hydrogen.js';
import { createSturmian, sturmianRecord } from './sturmian.js';

export const N = BASIS.length;                                      // 140: the register's width, every label in a block
/** THE SCALE's λ range (iteration 010 X2): the floor is 1/7, the hydrogen limit of n = 7 (a label n₀ is exact at λ = Z/n₀), so every
 *  shell of the register can be met by the knob; the ceiling 3 and the default 1 unchanged.  At 008–009 the floor was 0.25 (n = 4).
 *  `clampLambda` is the one clamp — the knob, the setter and a project's restore — so an older λ (always in [0.25, 3]) opens as it was. */
export const LAMBDA_MIN = 1 / 7, LAMBDA_MAX = 3;
export const clampLambda = (v) => Math.max(LAMBDA_MIN, Math.min(LAMBDA_MAX, +v || 1));

/**
 * createRegisterSturmian(λ, { Z }) → the block-pure propagator over the 140 labels in BASIS order.
 *   evolve(c0, t)     c(t) = C e^{−iEt} CᵀS c0,  c0 = { re, im } Float64Array(140) (a new { re, im })
 *   populations(c)    the S-metric projections onto the eigenvectors, as fractions of ⟨c|S|c⟩ (Σ = 1)
 *   energyOf(c)       ⟨c|H|c⟩ / ⟨c|S|c⟩          norm(c)  ⟨c|S|c⟩          eigenstate(k)  { re, im } (real, S-normalised)
 *   records()         sturmianRecord(n, l, m, λ) for every label, in BASIS order
 *   E, C, CtS, S, H   the assembled objects (Float64Array; C is 140 × rank row-major, CtS rank × 140)
 *   lK, mK, nK        per eigenvector: its block's l and m, and the n of its dominant label
 */
export function createRegisterSturmian(lambda, { Z = 1 } = {}) {
  const blocks = new Map();
  for (const s of BASIS) { const key = s.l + ':' + s.m; if (!blocks.has(key)) blocks.set(key, []); blocks.get(key).push(s.index); }   // every label, n = 7 included (the header)
  const S = new Float64Array(N * N), H = new Float64Array(N * N), cols = [];
  for (const idx of blocks.values()) {
    const P = createSturmian(idx, lambda, { Z }), B = idx.length;
    for (let i = 0; i < B; i++) for (let j = 0; j < B; j++) { S[idx[i] * N + idx[j]] = P.S[i * B + j]; H[idx[i] * N + idx[j]] = P.H[i * B + j]; }
    for (let k = 0; k < P.rank; k++) {
      const v = new Float64Array(B); for (let i = 0; i < B; i++) v[i] = P.C[i * P.rank + k];
      cols.push({ E: P.E[k], idx, v, l: BASIS[idx[0]].l, m: BASIS[idx[0]].m });
    }
  }
  cols.sort((a, b) => a.E - b.E || a.l - b.l || a.m - b.m);         // ascending; exact ties in (l, m) order, so the numbering is deterministic
  const M = cols.length;
  const E = new Float64Array(M), C = new Float64Array(N * M), CtS = new Float64Array(M * N);
  const lK = new Int8Array(M), mK = new Int8Array(M), nK = new Uint8Array(M);
  for (let k = 0; k < M; k++) {
    const { idx, v } = cols[k]; E[k] = cols[k].E; lK[k] = cols[k].l; mK[k] = cols[k].m;
    for (let i = 0; i < idx.length; i++) C[idx[i] * M + k] = v[i];
    for (let j = 0; j < idx.length; j++) { let s = 0; for (let i = 0; i < idx.length; i++) s += v[i] * S[idx[i] * N + idx[j]]; CtS[k * N + idx[j]] = s; }   // row k of CᵀS: only the block's columns
    let best = -Infinity, bi = idx[0];                                // the dominant label: the largest S-weight C_ik (SC)_ik (these sum to 1 over i)
    for (let i = 0; i < idx.length; i++) { const w = v[i] * CtS[k * N + idx[i]]; if (w > best) { best = w; bi = idx[i]; } }
    nK[k] = BASIS[bi].n;
  }
  /* the algebra: d = CᵀS c (the projections), c = C d (the reconstruction), ⟨c|A|c⟩ */
  const project = (c) => {
    const re = new Float64Array(M), im = new Float64Array(M);
    for (let k = 0; k < M; k++) { let sr = 0, si = 0; for (let i = 0; i < N; i++) { const w = CtS[k * N + i]; if (w === 0) continue; sr += w * c.re[i]; si += w * c.im[i]; } re[k] = sr; im[k] = si; }
    return { re, im };
  };
  const quad = (A, c) => { let s = 0; for (let i = 0; i < N; i++) { let ar = 0, ai = 0; for (let j = 0; j < N; j++) { const w = A[i * N + j]; if (w === 0) continue; ar += w * c.re[j]; ai += w * c.im[j]; } s += c.re[i] * ar + c.im[i] * ai; } return s; };
  const norm = (c) => quad(S, c);
  function evolve(c0, t) {
    const d = project(c0);
    for (let k = 0; k < M; k++) { const ph = -E[k] * t, cs = Math.cos(ph), sn = Math.sin(ph), r = d.re[k], i = d.im[k]; d.re[k] = r * cs - i * sn; d.im[k] = r * sn + i * cs; }
    const re = new Float64Array(N), im = new Float64Array(N);
    for (let i = 0; i < N; i++) { let sr = 0, si = 0; for (let k = 0; k < M; k++) { const w = C[i * M + k]; if (w === 0) continue; sr += w * d.re[k]; si += w * d.im[k]; } re[i] = sr; im[i] = si; }
    return { re, im };
  }
  function populations(c) {
    const d = project(c), nn = norm(c) || 1, p = new Float64Array(M);
    for (let k = 0; k < M; k++) p[k] = (d.re[k] * d.re[k] + d.im[k] * d.im[k]) / nn;
    return p;
  }
  const energyOf = (c) => quad(H, c) / quad(S, c);
  const eigenstate = (k) => { const re = new Float64Array(N), im = new Float64Array(N); for (let i = 0; i < N; i++) re[i] = C[i * M + k]; return { re, im }; };
  const records = () => BASIS.map((s) => sturmianRecord(s.n, s.l, s.m, lambda));
  return { labels: BASIS, lambda, Z, n: N, rank: M, blocks: blocks.size, S, H, E, C, CtS, lK, mK, nK, evolve, populations, energyOf, norm, eigenstate, records };
}
