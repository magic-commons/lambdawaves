/* md.js — McMurchie–Davidson Cartesian Gaussian integrals for molecules, l ≤ 2 by design.  Atomic units, bohr.
 * B-H2O-1 of research/MATH-H2O-2026-09-11.md; port of research/h2o-2026-09-11/scratch/md.mjs (ROUND 2 · OPUS).
 * Conventions: chemist's ERI (ij|kl); per-Cartesian-component primitive norm N_lmn(α); every contracted Cartesian
 * component renormalised to unit self-overlap, so PySCF's cart=True matrices are R_d M R_d with
 * R_d = diag(…, √(4π/5) on xx,yy,zz, √(4π/15) on xy,xz,yz, …) — the R_d convention of ROUND 3 · SOL.
 * AO order: by atom, then l ascending (stable within l), then the component order s; x,y,z; xx,xy,xz,yy,yz,zz.
 * Boys: Kummer seed + downward below t = 44, F_0 seed + upward above it (Proposition 9); supersedes the per-m
 * asymptote, which is wrong by 1.4e-11 at m = 8.  lab/gaussian.js stays the s-type one-dimensional predecessor.
 */

export const ANGSTROM = 1 / 0.52917721092;                                   // bohr per ångström, PySCF's CODATA
const STOP = Math.pow(2, -55);                                               // relative term stop, ROUND 2 Obs. 2
const T_SWITCH = 44, T_SMALL = 0.5;

/* ── Boys function F_m(t) = ∫₀¹ x^{2m} e^{−t x²} dx ────────────────────────────────────────────────────────────── */
/** F_0..F_mmax(t) in one Float64Array; the three regimes of ROUND 2 · OPUS Propositions 6, 7 and 9 */
export function boysTable(mmax, t) {
  const F = new Float64Array(mmax + 1);
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
/** F_m(t) alone */
export function boys(m, t) {
  if (!Number.isInteger(m) || m < 0) throw new Error('md: boys needs an integer order m ≥ 0');
  return boysTable(m, t)[m];
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

/** the full chemist's tensor (ij|kl), every ordered quartet computed independently */
function twoElectron(basis) {
  const { shells, n } = basis, g = new Float64Array(n ** 4);
  const gi = (i, j, k, l) => ((i * n + j) * n + k) * n + l;
  for (const sa of shells) for (const sb of shells) {
    const A = sa.c, B = sb.c, Lab = sa.l + sb.l;
    for (const sc of shells) for (const sd of shells) {
      const C = sc.c, D = sd.c, Lt = Lab + sc.l + sd.l;
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
