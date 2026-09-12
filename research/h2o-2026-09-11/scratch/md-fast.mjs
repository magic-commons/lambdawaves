/* md.js — McMurchie–Davidson Cartesian Gaussian integrals for molecules, l ≤ 2 by design.  Atomic units, bohr.
 * B-H2O-1 of research/MATH-H2O-2026-09-11.md; port of research/h2o-2026-09-11/scratch/md.mjs (ROUND 2 · OPUS).
 * Conventions: chemist's ERI (ij|kl); per-Cartesian-component primitive norm N_lmn(α); every contracted Cartesian
 * component renormalised to unit self-overlap, so PySCF's cart=True matrices are R_d M R_d with
 * R_d = diag(…, √(4π/5) on xx,yy,zz, √(4π/15) on xy,xz,yz, …) — the R_d convention of ROUND 3 · SOL.
 * AO order: by atom, then l ascending (stable within l), then the component order s; x,y,z; xx,xy,xz,yy,yz,zz.
 * Boys: Kummer seed + downward below t = 44, F_0 seed + upward above it (Proposition 9); supersedes the per-m
 * asymptote, which is wrong by 1.4e-11 at m = 8.  lab/gaussian.js stays the s-type one-dimensional predecessor.
 * ERI speed (2026-09-12): shell-pair E tables built once, Cauchy–Schwarz screening, one contraction per unique
 * quartet filled through all eight symmetries, and a Taylor grid for the loop's Boys.  Benzene 37.0 s → 0.54 s.
 */

export const ANGSTROM = 1 / 0.52917721092;                                   // bohr per ångström, PySCF's CODATA
const STOP = Math.pow(2, -55);                                               // relative term stop, ROUND 2 Obs. 2
const T_SWITCH = 44, T_SMALL = 0.5;

/* ── Boys function F_m(t) = ∫₀¹ x^{2m} e^{−t x²} dx ────────────────────────────────────────────────────────────── */
/** F_0..F_mmax(t) into a caller-owned buffer; the three regimes of ROUND 2 · OPUS Propositions 6, 7 and 9 */
function boysInto(F, mmax, t) {
  if (t < T_SMALL) {                                                         // alternating series, Kahan-compensated
    for (let m = 0; m <= mmax; m++) {
      let a = 1 / (2 * m + 1), s = a, comp = 0;
      for (let k = 0; k < 200; k++) {
        a *= (-t / (k + 1)) * (2 * m + 2 * k + 1) / (2 * m + 2 * k + 3);
        const y = a - comp, u = s + y; comp = (u - s) - y; s = u;
        if (Math.abs(a) < STOP * Math.abs(s)) break;
      }
      F[m] = s;
    }
    return F;
  }
  if (t < T_SWITCH) {                                                        // F_M = e^{−t}/(2M+1) Σ t^k/(M+3/2)_k
    const M = mmax; let u = 1, s = 1, comp = 0;
    for (let k = 0; k < 400; k++) {
      u *= t / (M + 1.5 + k);
      const y = u - comp, w = s + y; comp = (w - s) - y; s = w;
      if (u < STOP * s) break;
    }
    const et = Math.exp(-t);
    F[M] = et * s / (2 * M + 1);
    for (let m = M; m >= 1; m--) F[m - 1] = (2 * t * F[m] + et) / (2 * m - 1);  // downward, amplification ≤ 1
    return F;
  }
  F[0] = 0.5 * Math.sqrt(Math.PI / t);                                       // erf(√t) = 1 − O(1e−20) for t ≥ 44
  const et = Math.exp(-t);
  for (let m = 1; m <= mmax; m++) F[m] = ((2 * m - 1) * F[m - 1] - et) / (2 * t);
  return F;
}
/** F_0..F_mmax(t) in one Float64Array */
export function boysTable(mmax, t) { return boysInto(new Float64Array(mmax + 1), mmax, t); }
/** F_m(t) alone */
export function boys(m, t) {
  if (!Number.isInteger(m) || m < 0) throw new Error('md: boys needs an integer order m ≥ 0');
  return boysTable(m, t)[m];
}

/* The ERI loop's Boys, where 40 % of the time went.  F_m' = −F_{m+1}, so one table of F_0..F_{16} on a 0.1 grid
 * gives every order by Taylor: F_m(t) = Σ_{k≤8} F_{m+k}(t_g)(t_g−t)^k/k!, truncation ≤ 0.05⁹/9! = 5.4e-18 relative
 * and no Math.exp per call.  MEASURED worst relative against the mpmath/70 fixture: 6.19e-16, below the Kummer
 * path's own 7.19e-16.  Above t = 44 it is Proposition 9 unchanged.  boysTable/boys stay the certified series. */
const GK = 8, GH = 0.1, GINV = 1 / GH, GTOP = T_SWITCH, GNORD = 17, GNG = Math.round(GTOP * GINV) + 1;
let GTAB = null;
function gridBuild() {
  const T = new Float64Array(GNG * GNORD), F = new Float64Array(GNORD);
  for (let i = 0; i < GNG; i++) { boysInto(F, GNORD - 1, i * GH); T.set(F, i * GNORD); }
  return (GTAB = T);
}
/** F_0..F_mmax(t) into a caller-owned buffer, mmax ≤ 8: the grid below t = 44, Proposition 9 above */
function boysFast(F, mmax, t) {
  if (t >= GTOP) {
    F[0] = 0.5 * Math.sqrt(Math.PI / t);
    const et = Math.exp(-t);
    for (let m = 1; m <= mmax; m++) F[m] = ((2 * m - 1) * F[m - 1] - et) / (2 * t);
    return F;
  }
  const T = GTAB || gridBuild(), o = Math.round(t * GINV) * GNORD, d = Math.round(t * GINV) * GH - t;
  for (let m = 0; m <= mmax; m++) {
    let s = T[o + m + GK];
    for (let k = GK - 1; k >= 0; k--) s = T[o + m + k] + s * d / (k + 1);
    F[m] = s;
  }
  return F;
}

/* ── Hermite expansion coefficients E_t^{ij} on one axis ──────────────────────────────────────────────────────── */
/** table E[(i*(jmax+1)+j)*(imax+jmax+1)+t]; out-of-range t is structurally zero */
export function etable(imax, jmax, a, b, Ax, Bx) {
  const p = a + b, mu = a * b / p, Px = (a * Ax + b * Bx) / p, XPA = Px - Ax, XPB = Px - Bx, Xab = Ax - Bx;
  const TM = imax + jmax, W = TM + 1, J = jmax + 1, E = new Float64Array((imax + 1) * J * W);
  const at = (i, j, t) => (i * J + j) * W + t;
  E[at(0, 0, 0)] = Math.exp(-mu * Xab * Xab);
  for (let i = 0; i < imax; i++) for (let t = 0; t <= i + 1 && t <= TM; t++) {
    let v = XPA * E[at(i, 0, t)];
    if (t > 0) v += E[at(i, 0, t - 1)] / (2 * p);
    if (t + 1 <= TM) v += (t + 1) * E[at(i, 0, t + 1)];
    E[at(i + 1, 0, t)] = v;
  }
  for (let i = 0; i <= imax; i++) for (let j = 0; j < jmax; j++) for (let t = 0; t <= i + j + 1 && t <= TM; t++) {
    let v = XPB * E[at(i, j, t)];
    if (t > 0) v += E[at(i, j, t - 1)] / (2 * p);
    if (t + 1 <= TM) v += (t + 1) * E[at(i, j, t + 1)];
    E[at(i, j + 1, t)] = v;
  }
  return { E, at, p, Px };
}

/* ── Hermite Coulomb auxiliaries R^n_{tuv}(ζ, R) ──────────────────────────────────────────────────────────────── */
export function rtable(Lmax, zeta, Rx, Ry, Rz) {
  const t2 = zeta * (Rx * Rx + Ry * Ry + Rz * Rz), F = boysTable(Lmax, t2);
  const N = Lmax + 1, R = new Float64Array(N * N * N * N), at = (n, t, u, v) => ((n * N + t) * N + u) * N + v;
  let f = 1;
  for (let n = 0; n <= Lmax; n++) { R[at(n, 0, 0, 0)] = f * F[n]; f *= -2 * zeta; }
  for (let tot = 1; tot <= Lmax; tot++) for (let t = 0; t <= tot; t++) for (let u = 0; t + u <= tot; u++) {
    const v = tot - t - u;
    for (let n = 0; n + tot <= Lmax; n++) {
      let val;
      if (t > 0) val = (t > 1 ? (t - 1) * R[at(n + 1, t - 2, u, v)] : 0) + Rx * R[at(n + 1, t - 1, u, v)];
      else if (u > 0) val = (u > 1 ? (u - 1) * R[at(n + 1, t, u - 2, v)] : 0) + Ry * R[at(n + 1, t, u - 1, v)];
      else val = (v > 1 ? (v - 1) * R[at(n + 1, t, u, v - 2)] : 0) + Rz * R[at(n + 1, t, u, v - 1)];
      R[at(n, t, u, v)] = val;
    }
  }
  return { R, at, N };
}

/* ── basis construction ───────────────────────────────────────────────────────────────────────────────────────── */
export const CART = [
  [[0, 0, 0]],
  [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
  [[2, 0, 0], [1, 1, 0], [1, 0, 1], [0, 2, 0], [0, 1, 1], [0, 0, 2]],
];
export const COMPONENT_ORDER = ['s', 'x,y,z', 'xx,xy,xz,yy,yz,zz'];
const LABEL = [['s'], ['x', 'y', 'z'], ['xx', 'xy', 'xz', 'yy', 'yz', 'zz']];
const SHELL_LETTER = ['s', 'p', 'd'];
const ELEMENT = ['X', 'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne'];
const df = (n) => { let r = 1; for (let k = n; k > 0; k -= 2) r *= k; return r; };   // (n)!!, (−1)!! = 1
/** N_lmn(α) = (2α/π)^{3/4} [ (4α)^{l+m+n} / ((2l−1)!!(2m−1)!!(2n−1)!!) ]^{1/2} */
export const primNorm = (al, l, m, n) =>
  Math.pow(2 * al / Math.PI, 0.75) * Math.sqrt(Math.pow(4 * al, l + m + n) / (df(2 * l - 1) * df(2 * m - 1) * df(2 * n - 1)));
/** ⟨g_lmn(α)|g_lmn(β)⟩ on one centre — closed form, used only for the contracted normalisation */
function primOverlapSame(a, b, l, m, n) {
  const p = a + b, ax = (k) => df(2 * k - 1) / Math.pow(2 * p, k) * Math.sqrt(Math.PI / p);
  return ax(l) * ax(m) * ax(n);
}

const centreOf = (a) => (Array.isArray(a.c) ? a.c : [a.x, a.y, a.z]).map(Number);

/** BSE record + atoms → shell specs keeping the record's decimal strings; SP shells split, l sorted per atom */
function shellSpecs(atoms, record) {
  const out = [];
  atoms.forEach((atom, ia) => {
    const rec = record.elements?.[String(atom.Z)];
    if (!rec) throw new Error(`md: the record has no element Z=${atom.Z}`);
    const here = [];
    for (const sh of rec.electron_shells) {
      if (sh.function_type && !String(sh.function_type).startsWith('gto')) throw new Error('md: non-GTO shell');
      const exps = sh.exponents.map(Number), expStr = sh.exponents.map(String);
      sh.angular_momentum.forEach((l, col) => {
        if (l > 2) throw new Error(`md: l = ${l} is beyond this engine's l ≤ 2`);
        here.push({ atom: ia, Z: atom.Z, c: centreOf(atom), l, exps, expStr,
          coefs: sh.coefficients[col].map(Number), coefStr: sh.coefficients[col].map(String) });
      });
    }
    here.sort((u, v) => u.l - v.l);                                          // stable: PySCF's per-atom AO order
    out.push(...here);
  });
  return out;
}

/**
 * basisFrom(atoms, record, { cart = true }) → the contracted Cartesian shell list.
 * atoms = [{ Z, x, y, z }] in bohr (or { Z, c: [x, y, z] }); record = a vendored BSE JSON record.
 * Every Cartesian component is renormalised to unit self-overlap, so S has a unit diagonal by construction.
 */
export function basisFrom(atoms, record, { cart = true } = {}) {
  if (!cart) throw new Error('md: this engine is Cartesian only; spherical 6-31+G* is a different model');
  const specs = shellSpecs(atoms, record), shells = [], bfs = [], order = [];
  const perAtomShell = new Map();
  let idx = 0;
  for (const sp of specs) {
    const seen = (perAtomShell.get(`${sp.atom}:${sp.l}`) ?? 0) + 1;
    perAtomShell.set(`${sp.atom}:${sp.l}`, seen);
    const sbfs = [];
    for (let ci = 0; ci < CART[sp.l].length; ci++) {
      const [lx, ly, lz] = CART[sp.l][ci];
      const d = sp.exps.map((al, i) => sp.coefs[i] * primNorm(al, lx, ly, lz));
      let ss = 0;
      for (let i = 0; i < d.length; i++) for (let j = 0; j < d.length; j++)
        ss += d[i] * d[j] * primOverlapSame(sp.exps[i], sp.exps[j], lx, ly, lz);
      const dn = d.map((v) => v / Math.sqrt(ss));
      const bf = { idx, atom: sp.atom, Z: sp.Z, c: sp.c, l: [lx, ly, lz], shell: sp.l, exps: sp.exps, d: dn };
      sbfs.push(bf); bfs.push(bf);
      order.push(`${sp.atom} ${ELEMENT[sp.Z] ?? 'Z' + sp.Z} ${seen + sp.l}${SHELL_LETTER[sp.l]}${sp.l ? LABEL[sp.l][ci] : ''}`);
      idx++;
    }
    shells.push({ atom: sp.atom, Z: sp.Z, c: sp.c, l: sp.l, exps: sp.exps, bfs: sbfs });
  }
  const canon = [`basis ${record.name ?? '?'} v${record.version ?? '?'}`, 'kind cartesian',
    `components ${COMPONENT_ORDER.join(' | ')}`, ...specs.map((sp) =>
      `Z${sp.Z} l${sp.l} e[${sp.expStr.join(' ')}] c[${sp.coefStr.join(' ')}]`)].join('\n');
  return { n: idx, nbf: idx, shells, bfs, order, kind: 'cartesian', componentOrder: COMPONENT_ORDER,
    atoms: atoms.map((a) => ({ Z: a.Z, c: centreOf(a) })), cart: true, hash: sha256Hex(canon),
    record: { name: record.name ?? null, version: record.version ?? null, revision: record.revision_date ?? null } };
}

/* ── one- and two-electron integrals ──────────────────────────────────────────────────────────────────────────── */
/** S, T, V and the three dipole matrices M^(q)_ab = ⟨χ_a| q |χ_b⟩ (position, not −position) */
function oneElectron(basis, atoms) {
  const { shells, n } = basis;
  const S = new Float64Array(n * n), T = new Float64Array(n * n), V = new Float64Array(n * n);
  const M = [new Float64Array(n * n), new Float64Array(n * n), new Float64Array(n * n)];
  for (const sa of shells) for (const sb of shells) {
    const A = sa.c, B = sb.c;
    for (let ip = 0; ip < sa.exps.length; ip++) for (let jp = 0; jp < sb.exps.length; jp++) {
      const a = sa.exps[ip], b = sb.exps[jp], p = a + b, pre = Math.pow(Math.PI / p, 1.5);
      const ex = etable(sa.l, sb.l + 2, a, b, A[0], B[0]), ey = etable(sa.l, sb.l + 2, a, b, A[1], B[1]),
            ez = etable(sa.l, sb.l + 2, a, b, A[2], B[2]);
      const P = [ex.Px, ey.Px, ez.Px], Lt = sa.l + sb.l;
      const rt = atoms.map((C) => rtable(Lt, p, P[0] - C.c[0], P[1] - C.c[1], P[2] - C.c[2]));
      for (const ba of sa.bfs) for (const bb of sb.bfs) {
        const la = ba.l, lb = bb.l, w = ba.d[ip] * bb.d[jp], k = ba.idx * n + bb.idx;
        const ov = (dx, dy, dz) => {
          const jx = lb[0] + dx, jy = lb[1] + dy, jz = lb[2] + dz;
          if (jx < 0 || jy < 0 || jz < 0) return 0;
          return ex.E[ex.at(la[0], jx, 0)] * ey.E[ey.at(la[1], jy, 0)] * ez.E[ez.at(la[2], jz, 0)] * pre;
        };
        const s0 = ov(0, 0, 0);
        S[k] += w * s0;
        M[0][k] += w * (B[0] * s0 + ov(1, 0, 0));
        M[1][k] += w * (B[1] * s0 + ov(0, 1, 0));
        M[2][k] += w * (B[2] * s0 + ov(0, 0, 1));
        let t = 0;
        for (let q = 0; q < 3; q++) {                                        // T from shifted overlaps
          const bq = lb[q], m2 = [0, 0, 0], p2 = [0, 0, 0]; m2[q] = -2; p2[q] = 2;
          t += -0.5 * (bq * (bq - 1) * ov(...m2) - 2 * b * (2 * bq + 1) * s0 + 4 * b * b * ov(...p2));
        }
        T[k] += w * t;
        let v = 0;
        for (let ci = 0; ci < atoms.length; ci++) {
          const { R, at } = rt[ci]; let acc = 0;
          for (let tt = 0; tt <= la[0] + lb[0]; tt++) { const exv = ex.E[ex.at(la[0], lb[0], tt)]; if (exv === 0) continue;
            for (let uu = 0; uu <= la[1] + lb[1]; uu++) { const eyv = ey.E[ey.at(la[1], lb[1], uu)]; if (eyv === 0) continue;
              for (let vv = 0; vv <= la[2] + lb[2]; vv++) acc += exv * eyv * ez.E[ez.at(la[2], lb[2], vv)] * R[at(0, tt, uu, vv)]; } }
          v += -atoms[ci].Z * (2 * Math.PI / p) * acc;
        }
        V[k] += w * v;
      }
    }
  }
  return { S, T, V, M };
}

/* ── two electrons: shell-pair tables built once, Schwarz screening, the 8-fold tensor filled per unique quartet ──
 * The mathematics is Proposition 4 verbatim.  What changed is the order: E^{ab}_{tuv} is built once per shell pair
 * (not once per quartet), (−1)^{τ+ν+φ} is folded into the ket table, the 2π^{5/2}/(pq√(p+q)) prefactor into the R
 * seed, and the double Hermite sum is split into a bra half-transform and a ket contraction.  Screening is Cauchy–
 * Schwarz in the Coulomb metric, which is positive definite: |(f|g)| ≤ √(f|f)·√(g|g).  With s_k = √(Ω_k|Ω_k) the
 * norm of one primitive pair's weighted Hermite distribution and Q_P = max_{ab∈P} √(ab|ab):
 *   · dropping primitive pair k costs ≤ s_k·Q_max ≤ s_k·QB, so s_k < TAU_PRIM/QB drops ≤ 18 terms of ≤ 1e-15 each;
 *   · skipping quartet (P,Q) when Q_P·Q_Q < TAU_SCHWARZ drops that integral's ONLY term, by < 1e-15;
 *   · skipping primitive quartet (k,m) when s_k·s_m < TAU_PQ drops ≤ 81 terms of < 1e-17 each.
 * Worst case 1.8e-14 + 1e-15 + 8.1e-15 < 3e-14, forty times under the 1e-12 gate and never observed above 1e-15.
 */
const TAU_PRIM = 1e-15, TAU_SCHWARZ = 1e-15, TAU_PQ = 1e-17;
const LMAX_AB = 4, LMAX_T = 8, PI25 = Math.pow(Math.PI, 2.5);                // l ≤ 2 ⇒ Lab ≤ 4, Lt = Lab + Lcd ≤ 8
const HI = [], HN = [];                                                      // HI[L] = packed (t,u,v) with t+u+v ≤ L
for (let L = 0; L <= LMAX_T; L++) {
  const a = [];
  for (let tot = 0; tot <= L; tot++) for (let t = 0; t <= tot; t++) for (let u = 0; u <= tot - t; u++) a.push(t, u, tot - t - u);
  HI.push(new Int32Array(a)); HN.push(a.length / 3);
}
/** IDX[L][N][h] = t·N² + u·N + v of HI[L]'s h-th triple; R^0 indices add, so (t+τ, u+ν, v+φ) is base[h] + off[h′] */
const IDX = HI.map((H, L) => {
  const byN = [];
  for (let N = 0; N <= LMAX_T + 1; N++) {
    const a = new Int32Array(HN[L]);
    for (let h = 0; h < HN[L]; h++) a[h] = H[3 * h] * N * N + H[3 * h + 1] * N + H[3 * h + 2];
    byN.push(a);
  }
  return byN;
});
const RBUF = new Float64Array((LMAX_T + 1) ** 4), FBUF = new Float64Array(LMAX_T + 1);
const TBUF = new Float64Array(HN[LMAX_AB]), ACCBUF = new Float64Array(36 * 36);

/** R^n_{tuv}(ζ, R) into RBUF at n·N³+t·N²+u·N+v, the ERI prefactor folded into the seed; Proposition 3's recursion */
function rInto(Lmax, zeta, Rx, Ry, Rz, pref) {
  boysFast(FBUF, Lmax, zeta * (Rx * Rx + Ry * Ry + Rz * Rz));
  const N = Lmax + 1, N2 = N * N, N3 = N2 * N;
  let f = pref;
  for (let n = 0; n <= Lmax; n++) { RBUF[n * N3] = f * FBUF[n]; f *= -2 * zeta; }
  for (let tot = 1; tot <= Lmax; tot++) for (let t = 0; t <= tot; t++) for (let u = 0; t + u <= tot; u++) {
    const v = tot - t - u, base = t * N2 + u * N + v;
    for (let n = 0; n + tot <= Lmax; n++) {
      const o = n * N3 + base + N3;
      let val;
      if (t > 0) val = (t > 1 ? (t - 1) * RBUF[o - 2 * N2] : 0) + Rx * RBUF[o - N2];
      else if (u > 0) val = (u > 1 ? (u - 1) * RBUF[o - 2 * N] : 0) + Ry * RBUF[o - N];
      else val = (v > 1 ? (v - 1) * RBUF[o - 2] : 0) + Rz * RBUF[o - 1];
      RBUF[n * N3 + base] = val;
    }
  }
}

/** the (ab) shell-pair table: p, P, and the weighted E^{ab}_{tuv} with its (−1)^{t+u+v} twin for the ket role */
function buildPairs(basis) {
  const sh = basis.shells, ns = sh.length, out = [];
  for (let i = 0; i < ns; i++) for (let j = i; j < ns; j++) {
    const si = sh[i], sj = sh[j], Lab = si.l + sj.l, nh = HN[Lab], H = HI[Lab];
    const na = si.bfs.length, nb = sj.bfs.length, nc = na * nb, npi = si.exps.length, npj = sj.exps.length;
    const np = npi * npj, stride = nc * nh;
    const P = { Lab, nh, nc, np, p: new Float64Array(np), Px: new Float64Array(np), Py: new Float64Array(np),
      Pz: new Float64Array(np), E: new Float64Array(np * stride), Es: new Float64Array(np * stride),
      ai: new Int32Array(nc), bi: new Int32Array(nc), s: null };
    for (let ca = 0; ca < na; ca++) for (let cb = 0; cb < nb; cb++) {
      P.ai[ca * nb + cb] = si.bfs[ca].idx; P.bi[ca * nb + cb] = sj.bfs[cb].idx;
    }
    let k = 0;
    for (let ip = 0; ip < npi; ip++) for (let jp = 0; jp < npj; jp++, k++) {
      const a = si.exps[ip], b = sj.exps[jp];
      const ex = etable(si.l, sj.l, a, b, si.c[0], sj.c[0]), ey = etable(si.l, sj.l, a, b, si.c[1], sj.c[1]),
            ez = etable(si.l, sj.l, a, b, si.c[2], sj.c[2]);
      P.p[k] = a + b; P.Px[k] = ex.Px; P.Py[k] = ey.Px; P.Pz[k] = ez.Px;
      for (let ca = 0; ca < na; ca++) for (let cb = 0; cb < nb; cb++) {
        const la = si.bfs[ca].l, lb = sj.bfs[cb].l, w = si.bfs[ca].d[ip] * sj.bfs[cb].d[jp];
        const o = k * stride + (ca * nb + cb) * nh;
        for (let h = 0; h < nh; h++) {
          const t = H[3 * h], u = H[3 * h + 1], v = H[3 * h + 2];
          if (t > la[0] + lb[0] || u > la[1] + lb[1] || v > la[2] + lb[2]) continue;
          const val = w * ex.E[ex.at(la[0], lb[0], t)] * ey.E[ey.at(la[1], lb[1], u)] * ez.E[ez.at(la[2], lb[2], v)];
          P.E[o + h] = val; P.Es[o + h] = ((t + u + v) & 1) ? -val : val;
        }
      }
    }
    out.push(P);
  }
  return out;
}

/** keep only the primitive pairs listed, in place */
function compactPair(P, keep) {
  const np = keep.length, stride = P.nc * P.nh, src = P;
  const f = () => new Float64Array(np);
  const p = f(), Px = f(), Py = f(), Pz = f(), s = f(), E = new Float64Array(np * stride), Es = new Float64Array(np * stride);
  for (let t = 0; t < np; t++) {
    const k = keep[t];
    p[t] = src.p[k]; Px[t] = src.Px[k]; Py[t] = src.Py[k]; Pz[t] = src.Pz[k]; s[t] = src.s[k];
    E.set(src.E.subarray(k * stride, k * stride + stride), t * stride);
    Es.set(src.Es.subarray(k * stride, k * stride + stride), t * stride);
  }
  P.np = np; P.p = p; P.Px = Px; P.Py = Py; P.Pz = Pz; P.s = s; P.E = E; P.Es = Es;
}

/** ACC[ia·Q.nc + jc] += the contracted (ab|cd) over primitive pairs [k0,k1) × [m0,m1); thr < 0 disables the screen */
function quartetAcc(P, Q, ACC, thr, k0, k1, m0, m1) {
  const nhP = P.nh, nhQ = Q.nh, ncP = P.nc, ncQ = Q.nc, Lmax = P.Lab + Q.Lab;
  const base = IDX[P.Lab][Lmax + 1], off = IDX[Q.Lab][Lmax + 1], EP = P.E, EQ = Q.Es;
  const strP = ncP * nhP, strQ = ncQ * nhQ;
  for (let k = k0; k < k1; k++) {
    const p = P.p[k], sk = P.s ? P.s[k] : 0, eP = k * strP, Ppx = P.Px[k], Ppy = P.Py[k], Ppz = P.Pz[k];
    for (let m = m0; m < m1; m++) {
      if (thr >= 0 && sk * Q.s[m] < thr) continue;
      const q = Q.p[m], pq = p + q;
      rInto(Lmax, p * q / pq, Ppx - Q.Px[m], Ppy - Q.Py[m], Ppz - Q.Pz[m], 2 * PI25 / (p * q * Math.sqrt(pq)));
      const eQ = m * strQ;
      for (let ia = 0; ia < ncP; ia++) {
        const eo = eP + ia * nhP;
        let any = false;
        for (let hp = 0; hp < nhQ; hp++) TBUF[hp] = 0;
        for (let h = 0; h < nhP; h++) {
          const e = EP[eo + h];
          if (e === 0) continue;
          const b = base[h]; any = true;
          for (let hp = 0; hp < nhQ; hp++) TBUF[hp] += e * RBUF[b + off[hp]];
        }
        if (!any) continue;
        for (let jc = 0; jc < ncQ; jc++) {
          const fo = eQ + jc * nhQ; let acc = 0;
          for (let hp = 0; hp < nhQ; hp++) { const f = EQ[fo + hp]; if (f !== 0) acc += f * TBUF[hp]; }
          ACC[ia * ncQ + jc] += acc;
        }
      }
    }
  }
}

/** max_{ab∈P} (ab|ab) over the primitive-pair range, the square of the Cauchy–Schwarz norm */
function diagNorm(P, k0, k1, thr) {
  const nn = P.nc * P.nc;
  ACCBUF.fill(0, 0, nn);
  quartetAcc(P, P, ACCBUF, thr, k0, k1, k0, k1);
  let mx = 0;
  for (let ia = 0; ia < P.nc; ia++) { const d = ACCBUF[ia * P.nc + ia]; if (d > mx) mx = d; }
  return Math.sqrt(mx > 0 ? mx : 0);
}

/** the full chemist's tensor (ij|kl), one contraction per unique shell quartet, filled through all eight symmetries */
function twoElectron(basis) {
  const n = basis.n, n2 = n * n, g = new Float64Array(n2 * n2);
  let pairs = buildPairs(basis);
  for (const P of pairs) {                                                   // s_k first, with no screen to seed it
    P.s = new Float64Array(P.np);
    for (let k = 0; k < P.np; k++) P.s[k] = diagNorm(P, k, k + 1, -1);
  }
  let QB = 0;                                                                // Σ_k s_k ≥ Q_P, so QB ≥ Q_max
  for (const P of pairs) { let t = 0; for (let k = 0; k < P.np; k++) t += P.s[k]; if (t > QB) QB = t; }
  const sMin = QB > 0 ? TAU_PRIM / QB : 0;
  for (const P of pairs) {
    const keep = [];
    for (let k = 0; k < P.np; k++) if (P.s[k] >= sMin) keep.push(k);
    if (keep.length < P.np) compactPair(P, Int32Array.from(keep));
  }
  pairs = pairs.filter((P) => P.np > 0);
  const NP = pairs.length, QN = new Float64Array(NP);
  for (let a = 0; a < NP; a++) QN[a] = diagNorm(pairs[a], 0, pairs[a].np, TAU_PQ);
  for (let a = 0; a < NP; a++) {
    const P = pairs[a], ncP = P.nc, qa = QN[a];
    for (let b = a; b < NP; b++) {
      const Q = pairs[b];
      if (qa * QN[b] < TAU_SCHWARZ) continue;
      const ncQ = Q.nc;
      ACCBUF.fill(0, 0, ncP * ncQ);
      quartetAcc(P, Q, ACCBUF, TAU_PQ, 0, P.np, 0, Q.np);
      for (let ia = 0; ia < ncP; ia++) {
        const i = P.ai[ia], j = P.bi[ia], pij = (i * n + j) * n2, pji = (j * n + i) * n2, qij = i * n + j, qji = j * n + i;
        for (let jc = 0; jc < ncQ; jc++) {
          const val = ACCBUF[ia * ncQ + jc], k = Q.ai[jc], l = Q.bi[jc];
          const pkl = (k * n + l) * n2, plk = (l * n + k) * n2, qkl = k * n + l, qlk = l * n + k;
          g[pij + qkl] = val; g[pji + qkl] = val; g[pij + qlk] = val; g[pji + qlk] = val;
          g[pkl + qij] = val; g[plk + qij] = val; g[pkl + qji] = val; g[plk + qji] = val;
        }
      }
    }
  }
  return g;
}

export function nuclearRepulsion(atoms) {
  let e = 0;
  for (let i = 0; i < atoms.length; i++) for (let j = i + 1; j < atoms.length; j++) {
    const ci = centreOf(atoms[i]), cj = centreOf(atoms[j]);
    e += atoms[i].Z * atoms[j].Z / Math.hypot(ci[0] - cj[0], ci[1] - cj[1], ci[2] - cj[2]);
  }
  return e;
}

/**
 * integrals(basis, atoms = basis.atoms) → everything lab/scf.js rhf() and lab/density.js createRTHF() need.
 * { n, S, T, V, h, X, Y, Z, eri, Enuc, nuclearDipole: [x, y, z], order, hash } — X/Y/Z are the dipole
 * (position) matrices ⟨χ_a| q |χ_b⟩, so a total dipole is nuclearDipole[q] − Tr(D M^(q)).
 */
export function integrals(basis, atoms = basis.atoms) {
  const at = atoms.map((a) => ({ Z: a.Z, c: centreOf(a) })), n = basis.n;
  const { S, T, V, M } = oneElectron(basis, at), eri = twoElectron(basis);
  const h = Float64Array.from(T, (x, k) => x + V[k]);
  return { n, S, T, V, h, X: M[0], Y: M[1], Z: M[2], M, eri, Enuc: nuclearRepulsion(at),
    nuclearDipole: [0, 1, 2].map((q) => at.reduce((s, a) => s + a.Z * a.c[q], 0)),
    order: basis.order, kind: basis.kind, hash: basis.hash, atoms: at };
}

/* ── SHA-256 over the record's decimal strings, so a saved project can refuse a mutated basis ─────────────────── */
const K256 = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);
const rotr = (x, k) => (x >>> k) | (x << (32 - k));
/** SHA-256 of a string (UTF-8) or byte array, as lowercase hex — matches Python's hashlib.sha256().hexdigest() */
export function sha256Hex(input) {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
  const len = bytes.length, blocks = Math.ceil((len + 9) / 64), m = new Uint8Array(blocks * 64);
  m.set(bytes); m[len] = 0x80;
  const bits = len * 8;
  const dv = new DataView(m.buffer);
  dv.setUint32(m.length - 8, Math.floor(bits / 4294967296));
  dv.setUint32(m.length - 4, bits >>> 0);
  const H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const w = new Uint32Array(64);
  for (let b = 0; b < blocks; b++) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(b * 64 + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a, bb, c, d, e, f, g, hh] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25), ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + K256[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22), mj = (a & bb) ^ (a & c) ^ (bb & c);
      const t2 = (S0 + mj) >>> 0;
      hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = bb; bb = a; a = (t1 + t2) >>> 0;
    }
    H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + bb) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + hh) >>> 0;
  }
  return [...H].map((v) => v.toString(16).padStart(8, '0')).join('');
}

/** the two d self-overlaps of PySCF's cart=True convention, MEASURED in ROUND 4 · OPUS §7 to nine digits */
export const RD2 = { axial: 4 * Math.PI / 5, mixed: 4 * Math.PI / 15 };
/** R_d: the diagonal congruence with PySCF cart=True, M_pyscf = R_d M R_d.  1 on s and p, where the two agree. */
export function rdOf(basis) {
  const r = new Float64Array(basis.n);
  basis.bfs.forEach((bf, i) => {
    const [lx, ly, lz] = bf.l;
    r[i] = lx + ly + lz < 2 ? 1 : Math.sqrt(Math.max(lx, ly, lz) === 2 ? RD2.axial : RD2.mixed);
  });
  return r;
}
