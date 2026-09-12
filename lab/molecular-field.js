/* molecular-field.js — the CPU evaluator behind the molecular orbital and density field, B-H2O-4 of
 * research/MATH-H2O-2026-09-11.md.  Atomic units, bohr.  STATUS: DERIVED-HERE assembly of KNOWN forms, gated by
 * tests/molecular-field.test.mjs against PySCF's `mol.eval_gto` and `dft.numint.eval_rho` at the same points
 * (tests/fixtures/h2o-field.json).
 *
 * A contracted Cartesian Gaussian component of a shell on centre A is
 *     χ_lmn(r) = (x−A_x)^l (y−A_y)^m (z−A_z)^n Σ_i d_i e^{−α_i |r−A|²} ,
 * and every component of one shell shares the SAME exponents, so the exponentials are a per-shell quantity, not a
 * per-component one: STO-3G water needs 3 + 3 + 3 + 3 = 12 of them per point, not 7 × 3 = 21, because O 2s and the
 * three O 2p components are one three-exponent sp shell (MATH-H2O ROUND 3 · SOL, kill 5).  Shells that share a
 * centre and an exponent list are merged into one exponential group here, so `lab/md.js`'s shell list — which
 * splits an sp record into an l = 0 and an l = 1 shell over the same `exps` array — costs 12, not 15.
 *
 * ρ(r) = Σ_ij D_ij χ_i(r) χ_j(r) and ψ_k(r) = Σ_i C_ik χ_i(r); the electron count is Tr(DS), NEVER a voxel sum.
 * A 96³ midpoint sum of ρ over the ±10.3 bohr box gives 9.662692 electrons, 3.4 % short, because the O 1s cusp
 * (width 1/√(2·130.71) = 0.062 bohr against a 0.215 bohr voxel) is unresolved at any display resolution; 192³ on
 * the same box reaches 9.984107 and a ±24 bohr box gets worse, 8.600860.  MUST NOT CLAIM: that the display grid is
 * a quadrature, that caching beats direct evaluation on every GPU, that f16 lacks the range for ρ(O) = 193.31, or
 * that an isosurface is an observable.
 */

/** the GPU upload interface, as data — a documented contract, not a WebGPU implementation */
export const uploadContract = ({ N = 96, layers = 7, format = 'r32float' } = {}) => Object.freeze({
  format, dimension: '3d', size: [N, N, N], cells: N ** 3, layers,
  bytesPerCell: 4, bytesPerLayer: N ** 3 * 4, bytes: layers * N ** 3 * 4,
  layout: 'one r32float 3-D texture per AO layer, x fastest, then y, then z; values are χ_i(r) in bohr^{-3/2}',
  order: 'the shell order of the basis record: atom, shell, Cartesian component s; x,y,z; xx,xy,xz,yy,yz,zz',
  precision: 'r32float is chosen for f32 accumulation accuracy, not for exponent range — f16 already holds ρ(O) = 193.31',
  electronCount: 'Tr(DS). The voxel sum of ρ over this grid is 9.662692 for H₂O/STO-3G on the ±10.3 bohr box and is NOT a quadrature.',
});

/** shells that share a centre and an exponent list are one exponential group */
function group(shells) {
  const groups = [], components = [];
  let idx = 0;
  for (const sh of shells) {
    if (!sh || !Array.isArray(sh.bfs) || !sh.bfs.length) throw new Error('molecular-field: a shell needs bfs: [{ l: [lx, ly, lz], d: [...] }]');
    if (!sh.c || sh.c.length !== 3 || !sh.exps || !sh.exps.length) throw new Error('molecular-field: a shell needs c: [x, y, z] in bohr and exps: [...]');
    let g = groups.find((q) => q.c[0] === sh.c[0] && q.c[1] === sh.c[1] && q.c[2] === sh.c[2]
      && q.exps.length === sh.exps.length && q.exps.every((a, i) => a === sh.exps[i]));
    if (!g) { g = { c: Float64Array.from(sh.c), exps: Float64Array.from(sh.exps), e: new Float64Array(sh.exps.length), comps: [] }; groups.push(g); }
    for (const b of sh.bfs) {
      if (!b.l || b.l.length !== 3 || !b.d || b.d.length !== sh.exps.length) throw new Error('molecular-field: a component needs l: [lx, ly, lz] and one weight per exponent');
      g.comps.push({ idx, l: Int32Array.from(b.l), d: Float64Array.from(b.d) });
      components.push({ idx, c: g.c, l: Int32Array.from(b.l), exps: g.exps, d: Float64Array.from(b.d), shell: sh });
      idx++;
    }
  }
  return { groups, components, n: idx };
}
const power = (v, k) => { let p = 1; for (let i = 0; i < k; i++) p *= v; return p; };

/**
 * evaluator(shells) → { n, groups, components, exponentialsPerPoint, stats,
 *                       ao(point, out?), orbital(C, k, point), density(D, point), supportRadius(shell, threshold) }
 * `shells` is the normalised contracted shell list: [{ c: [x, y, z] bohr, l, exps: [...], bfs: [{ l: [lx, ly, lz], d: [...] }] }],
 * the shape `lab/md.js`'s buildBasis returns and tests/fixtures/h2o-field.json stores.
 */
export function evaluator(shells) {
  if (!Array.isArray(shells) || !shells.length) throw new Error('molecular-field: evaluator(shells) needs a non-empty shell list');
  const { groups, components, n } = group(shells);
  const exponentialsPerPoint = groups.reduce((s, g) => s + g.exps.length, 0);
  const stats = { calls: 0, exponentials: 0 };
  const scratch = new Float64Array(n);
  /** every contracted AO value at one point; one exp per primitive per group, reused across its components */
  function ao(point, out = new Float64Array(n)) {
    stats.calls++;
    for (const g of groups) {
      const dx = point[0] - g.c[0], dy = point[1] - g.c[1], dz = point[2] - g.c[2], r2 = dx * dx + dy * dy + dz * dz;
      for (let i = 0; i < g.exps.length; i++) g.e[i] = Math.exp(-g.exps[i] * r2);
      stats.exponentials += g.exps.length;
      for (const b of g.comps) {
        let acc = 0;
        for (let i = 0; i < b.d.length; i++) acc += b.d[i] * g.e[i];
        out[b.idx] = acc * power(dx, b.l[0]) * power(dy, b.l[1]) * power(dz, b.l[2]);
      }
    }
    return out;
  }
  /** ψ_k(r) = Σ_i C[i·n + k] χ_i(r) */
  function orbital(C, k, point) {
    if (!C || C.length !== n * n) throw new Error('molecular-field: orbital needs C[ao·n + mo] of length n²');
    if (!Number.isInteger(k) || k < 0 || k >= n) throw new Error(`molecular-field: orbital index ${k} outside [0, ${n})`);
    const v = ao(point, scratch);
    let s = 0; for (let i = 0; i < n; i++) s += C[i * n + k] * v[i];
    return s;
  }
  /** ρ(r) = Σ_ij D_ij χ_i(r) χ_j(r) for the spin-summed AO density */
  function density(D, point) {
    if (!D || D.length !== n * n) throw new Error('molecular-field: density needs an n×n AO density matrix');
    const v = ao(point, scratch);
    let s = 0;
    for (let i = 0; i < n; i++) { const vi = v[i]; if (vi === 0) continue;
      for (let j = 0; j < n; j++) s += D[i * n + j] * vi * v[j]; }
    return s;
  }
  /** the radius beyond which every component of `shell` is under `threshold`: r^l Σ|d_i| e^{−α_i r²} ≤ threshold */
  function supportRadius(shell, threshold = 1e-10) {
    if (!(threshold > 0)) throw new Error('molecular-field: supportRadius needs a positive threshold');
    const exps = Array.from(shell.exps || []), bfs = shell.bfs || [];
    if (!exps.length || !bfs.length) throw new Error('molecular-field: supportRadius needs a shell with exps and bfs');
    const aMin = Math.min(...exps), lMax = Math.max(...bfs.map((b) => b.l[0] + b.l[1] + b.l[2]));
    const w = exps.map((_, i) => Math.max(...bfs.map((b) => Math.abs(b.d[i]))));
    const f = (r) => power(r, lMax) * exps.reduce((s, a, i) => s + w[i] * Math.exp(-a * r * r), 0) - threshold;
    let hi = Math.max(1, Math.sqrt(lMax / (2 * aMin)) + 1);                   // start past the envelope's maximum
    for (let k = 0; k < 200 && f(hi) > 0; k++) hi *= 1.5;
    let lo = Math.max(hi / 1.5, Math.sqrt(lMax / (2 * aMin)));
    if (f(lo) < 0) lo = 0;
    for (let k = 0; k < 80; k++) { const mid = 0.5 * (lo + hi); if (f(mid) > 0) lo = mid; else hi = mid; }
    return hi;
  }
  return { n, groups, components, exponentialsPerPoint, stats, ao, orbital, density, supportRadius, uploadContract };
}
