/* md.mjs — McMurchie–Davidson Cartesian Gaussian integrals, l ≤ 2 by design, centres anywhere in 3-D.
 * ROUND 2 · OPUS of research/MATH-H2O-2026-09-11.md.  Atomic units.  Scratch: proves the recursions by running them.
 * Conventions: chemist's ERI (ab|cd); per-Cartesian-component primitive norm N_lmn(α); every contracted Cartesian
 * component renormalised to unit self-overlap (this is what PySCF does for l ≤ 1, where spherical = Cartesian).
 */

/* ── Boys function ─────────────────────────────────────────────────────────────────────────────────────────────── */
const STOP = Math.pow(2, -55);
/** F_0..F_mmax(T).  variant 'opus' (default): t<0.5 alternating series · 0.5≤t<tSwitch Kummer seed + downward ·
 *  t≥tSwitch F_0 asymptotic + upward.  'sol': per-m asymptotic above tSwitch.  'kummer': no small-t branch at all. */
export function boysTable(mmax, T, variant = 'opus', stop = STOP, tSwitch = 44, tSmall = 0.5) {
  const STOP = stop;
  const F = new Float64Array(mmax + 1);
  if (T < tSmall && variant !== 'kummer') {
    for (let m = 0; m <= mmax; m++) {
      let a = 1 / (2 * m + 1), s = a, comp = 0;
      for (let k = 0; k < 200; k++) {
        a *= (-T / (k + 1)) * (2 * m + 2 * k + 1) / (2 * m + 2 * k + 3);
        const y = a - comp, t = s + y; comp = (t - s) - y; s = t;             // Kahan
        if (Math.abs(a) < STOP * Math.abs(s)) break;
      }
      F[m] = s;
    }
    return F;
  }
  if (T < tSwitch) {
    const M = mmax; let u = 1, s = 1, comp = 0;                              // F_M = e^{-T}/(2M+1) Σ T^k/(M+3/2)_k
    for (let k = 0; k < 400; k++) {
      u *= T / (M + 1.5 + k);
      const y = u - comp, t = s + y; comp = (t - s) - y; s = t;
      if (u < STOP * s) break;
    }
    const eT = Math.exp(-T);
    F[M] = eT * s / (2 * M + 1);
    for (let m = M; m >= 1; m--) F[m - 1] = (2 * T * F[m] + eT) / (2 * m - 1);
    return F;
  }
  if (variant === 'sol') {                                                   // (2m-1)!!√π / (2^{m+1} t^{m+1/2})
    let df = 1;
    for (let m = 0; m <= mmax; m++) { F[m] = df * Math.sqrt(Math.PI) / (Math.pow(2, m + 1) * Math.pow(T, m + 0.5)); df *= (2 * m + 1); }
    return F;
  }
  F[0] = 0.5 * Math.sqrt(Math.PI / T);                                       // erf(√T) = 1 − O(10^{-20}) for T ≥ 44
  const eT = Math.exp(-T);
  for (let m = 1; m <= mmax; m++) F[m] = ((2 * m - 1) * F[m - 1] - eT) / (2 * T);
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
export function rtable(Lmax, zeta, Rx, Ry, Rz, variant = 'opus') {
  const T = zeta * (Rx * Rx + Ry * Ry + Rz * Rz), F = boysTable(Lmax, T, variant);
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
const df = (n) => { let r = 1; for (let k = n; k > 0; k -= 2) r *= k; return r; };   // (n)!!, (-1)!! = 1
/** N_lmn(α) = (2α/π)^{3/4} [ (4α)^{l+m+n} / ((2l-1)!!(2m-1)!!(2n-1)!!) ]^{1/2}  (Sol, Round 1) */
export const primNorm = (al, l, m, n) =>
  Math.pow(2 * al / Math.PI, 0.75) * Math.sqrt(Math.pow(4 * al, l + m + n) / (df(2 * l - 1) * df(2 * m - 1) * df(2 * n - 1)));

/** shells: [{ c:[x,y,z], l, exps:[...], coefs:[...] }] → { shells (with bfs), nbf, atoms } */
export function buildBasis(shellSpecs, atoms) {
  const shells = [], all = [];
  let idx = 0;
  for (const sp of shellSpecs) {
    const bfs = [];
    for (const [lx, ly, lz] of CART[sp.l]) {
      const d = sp.exps.map((al, i) => sp.coefs[i] * primNorm(al, lx, ly, lz));
      let ss = 0;
      for (let i = 0; i < d.length; i++) for (let j = 0; j < d.length; j++)
        ss += d[i] * d[j] * primOverlapSame(sp.exps[i], sp.exps[j], lx, ly, lz);
      const dn = d.map((v) => v / Math.sqrt(ss));
      bfs.push({ idx, l: [lx, ly, lz], d: dn }); all.push({ idx, c: sp.c, l: [lx, ly, lz], exps: sp.exps, d: dn }); idx++;
    }
    shells.push({ c: sp.c, l: sp.l, exps: sp.exps, bfs });
  }
  return { shells, nbf: idx, atoms, bfs: all };
}
/** ⟨g_lmn(α)|g_lmn(β)⟩ on one centre — closed form, used only for contracted normalisation */
function primOverlapSame(a, b, l, m, n) {
  const p = a + b, ax = (k) => df(2 * k - 1) / Math.pow(2 * p, k) * Math.sqrt(Math.PI / p);
  return ax(l) * ax(m) * ax(n);
}

/* ── one-electron integrals ───────────────────────────────────────────────────────────────────────────────────── */
/** S, T, V, and the three dipole matrices M^(q) = ⟨χ_a| q |χ_b⟩ (position, not −position) */
export function oneElectron(basis) {
  const { shells, nbf, atoms } = basis;
  const S = new Float64Array(nbf * nbf), T = new Float64Array(nbf * nbf), V = new Float64Array(nbf * nbf);
  const M = [new Float64Array(nbf * nbf), new Float64Array(nbf * nbf), new Float64Array(nbf * nbf)];
  for (const sa of shells) for (const sb of shells) {
    const A = sa.c, B = sb.c;
    for (let ip = 0; ip < sa.exps.length; ip++) for (let jp = 0; jp < sb.exps.length; jp++) {
      const a = sa.exps[ip], b = sb.exps[jp], p = a + b, pre = Math.pow(Math.PI / p, 1.5);
      const ex = etable(sa.l, sb.l + 2, a, b, A[0], B[0]), ey = etable(sa.l, sb.l + 2, a, b, A[1], B[1]),
            ez = etable(sa.l, sb.l + 2, a, b, A[2], B[2]);
      const P = [ex.Px, ey.Px, ez.Px];
      const Lt = sa.l + sb.l;
      const rt = atoms.map((C) => rtable(Lt, p, P[0] - C.c[0], P[1] - C.c[1], P[2] - C.c[2]));
      for (const ba of sa.bfs) for (const bb of sb.bfs) {
        const la = ba.l, lb = bb.l, w = ba.d[ip] * bb.d[jp], k = ba.idx * nbf + bb.idx;
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
        for (let q = 0; q < 3; q++) {
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

/* ── two-electron tensor, every ordered quartet computed independently ────────────────────────────────────────── */
export function twoElectron(basis) {
  const { shells, nbf } = basis, g = new Float64Array(nbf ** 4);
  const gi = (i, j, k, l) => ((i * nbf + j) * nbf + k) * nbf + l;
  for (const sa of shells) for (const sb of shells) {
    const A = sa.c, B = sb.c, Lab = sa.l + sb.l;
    for (const sc of shells) for (const sd of shells) {
      const C = sc.c, D = sd.c, Lcd = sc.l + sd.l, Lt = Lab + Lcd;
      for (let ip = 0; ip < sa.exps.length; ip++) for (let jp = 0; jp < sb.exps.length; jp++) {
        const a = sa.exps[ip], b = sb.exps[jp], p = a + b;
        const ex = etable(sa.l, sb.l, a, b, A[0], B[0]), ey = etable(sa.l, sb.l, a, b, A[1], B[1]),
              ez = etable(sa.l, sb.l, a, b, A[2], B[2]);
        for (let kp = 0; kp < sc.exps.length; kp++) for (let lp = 0; lp < sd.exps.length; lp++) {
          const c = sc.exps[kp], d = sd.exps[lp], q = c + d, rho = p * q / (p + q);
          const fx = etable(sc.l, sd.l, c, d, C[0], D[0]), fy = etable(sc.l, sd.l, c, d, C[1], D[1]),
                fz = etable(sc.l, sd.l, c, d, C[2], D[2]);
          const { R, at } = rtable(Lt, rho, ex.Px - fx.Px, ey.Px - fy.Px, ez.Px - fz.Px);
          const pref = 2 * Math.pow(Math.PI, 2.5) / (p * q * Math.sqrt(p + q));
          for (const ba of sa.bfs) for (const bb of sb.bfs) {
            const la = ba.l, lb = bb.l, wab = ba.d[ip] * bb.d[jp];
            for (const bc of sc.bfs) for (const bd of sd.bfs) {
              const lc = bc.l, ld = bd.l, w = wab * bc.d[kp] * bd.d[lp];
              let acc = 0;
              for (let t = 0; t <= la[0] + lb[0]; t++) { const e1 = ex.E[ex.at(la[0], lb[0], t)]; if (e1 === 0) continue;
                for (let u = 0; u <= la[1] + lb[1]; u++) { const e2 = e1 * ey.E[ey.at(la[1], lb[1], u)]; if (e2 === 0) continue;
                  for (let v = 0; v <= la[2] + lb[2]; v++) { const e3 = e2 * ez.E[ez.at(la[2], lb[2], v)]; if (e3 === 0) continue;
                    for (let tau = 0; tau <= lc[0] + ld[0]; tau++) { const f1 = fx.E[fx.at(lc[0], ld[0], tau)]; if (f1 === 0) continue;
                      for (let nu = 0; nu <= lc[1] + ld[1]; nu++) { const f2 = f1 * fy.E[fy.at(lc[1], ld[1], nu)]; if (f2 === 0) continue;
                        for (let phi = 0; phi <= lc[2] + ld[2]; phi++) {
                          const f3 = f2 * fz.E[fz.at(lc[2], ld[2], phi)]; if (f3 === 0) continue;
                          const sg = ((tau + nu + phi) & 1) ? -1 : 1;
                          acc += e3 * f3 * sg * R[at(0, t + tau, u + nu, v + phi)];
                        } } } } } }
              g[gi(ba.idx, bb.idx, bc.idx, bd.idx)] += w * pref * acc;
            } }
        } }
    } }
  return g;
}

/* ── molecular scaffolding ────────────────────────────────────────────────────────────────────────────────────── */
export const ANG = 1.8897261246;                                             // PySCF's bohr per ångström
/** BSE record + atoms [{Z, c:[bohr]}] → shell specs, SP shells split */
export function shellsFromBSE(bse, atoms) {
  const out = [];
  for (const at of atoms) {
    const rec = bse.elements[String(at.Z)];
    if (!rec) throw new Error('md: no BSE record for Z=' + at.Z);
    for (const sh of rec.electron_shells) {
      const exps = sh.exponents.map(Number);
      sh.angular_momentum.forEach((l, col) => out.push({ c: at.c, l, exps, coefs: sh.coefficients[col].map(Number) }));
    }
  }
  return out;
}
export function nuclearRepulsion(atoms) {
  let e = 0;
  for (let i = 0; i < atoms.length; i++) for (let j = i + 1; j < atoms.length; j++) {
    const d = Math.hypot(atoms[i].c[0] - atoms[j].c[0], atoms[i].c[1] - atoms[j].c[1], atoms[i].c[2] - atoms[j].c[2]);
    e += atoms[i].Z * atoms[j].Z / d;
  }
  return e;
}
export const nuclearDipole = (atoms, q) => atoms.reduce((s, a) => s + a.Z * a.c[q], 0);
/** everything scf.js and density.js need, for one molecule */
export function molecule(bse, atoms) {
  const basis = buildBasis(shellsFromBSE(bse, atoms), atoms);
  const { S, T, V, M } = oneElectron(basis), eri = twoElectron(basis), n = basis.nbf;
  const h = Float64Array.from(T, (x, k) => x + V[k]);
  return { n, S, T, V, h, M, eri, Enuc: nuclearRepulsion(atoms), atoms, basis,
    nuclearDipole: [0, 1, 2].map((q) => nuclearDipole(atoms, q)) };
}
