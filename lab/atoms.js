/* atoms.js — THE PERIODIC TABLE as a central field: Z = 1…36 by Xα(2/3) + the Latter tail.
 *
 * Every atom in this file is one self-consistent CENTRAL potential shared by all its shells (Herman–Skillman /
 * Hartree–Fock–Slater, but with Kohn–Sham–Gáspár–Dirac exchange α = 2/3, not Slater's α = 1):
 *
 *     [ −½ d²/dr² + l(l+1)/2r² − Z/r + V_H(r) + V_x(r) ] u_nl = ε_nl u_nl ,      ∫ u²_nl dr = 1
 *     q(r) = Σ_nl f_nl u²_nl ,   ρ = q/4πr² ,   V_H = (1/r)∫₀^r q ds + ∫_r^∞ q/s ds ,
 *     V_x = −(3α/2)(3ρ/π)^{1/3} ,   and the LATTER TAIL  V ← min(V, −(Z − N_el + 1)/r)
 *
 * (Latter, Phys. Rev. 99, 510 (1955)): the LDA potential decays exponentially, so without the clip a neutral atom's
 * valence electron sees no asymptotic Coulomb tail at all and the quantum defect has nothing to be defined against.
 * The total energy is the functional that matches this potential (Slater's, with the α-fraction restored):
 *
 *     E = Σ f_nl ( ε_nl − ∫ u²_nl V dr ) + ∫ q(−Z/r) dr + ½∫ q V_H dr + E_x ,
 *     E_x = −(9α/8)(3/π)^{1/3} ∫ 4π r² ρ^{4/3} dr .
 *
 * THE MESH is logarithmic, r_j = r₀ e^{j dx} (r₀ = 10⁻⁶/Z, r_max = 60 a₀), which is what puts points where a Z = 36
 * 1s lives.  With r = e^x and u = e^{x/2} v the radial equation becomes the symmetric-definite tridiagonal pencil
 * −v'' + [(l+½)² + 2r²V] v = ε (2r²) v, and B^{−½}AB^{−½} makes it an ordinary symmetric tridiagonal eigenproblem:
 *
 *     C_jj = 1/(dx² r_j²) + (l+½)²/2r_j² + V_j ,      C_{j,j+1} = −1/(2 dx² r_j r_{j+1}) ,   y = √2 √r · u ,
 *
 * so EVERY shell of a given l comes out of one Sturm bisection + inverse iteration — no shooting, no node hunting
 * (the node count is then CHECKED, not used).  The wall at r₀ is not u(r₀) = 0 (that costs 2Z³r₀ in the 1s, a first-
 * order hard-sphere shift): the exact behaviour u ∼ r^{l+1} is imposed as y₀ = e^{−(l+3/2)dx} y₁, which folds into
 * C₁₁ and keeps the matrix tridiagonal (and u₀ = u₁ e^{−(l+1)dx} is written back into the returned u, so R = u/r is finite
 * at the nucleus: R_1s(0) = u₁/r₁ — it read 0 before wave 42).  Second differences give ε = ε_exact + c·dx², so the whole SCF is run on two
 * meshes (M and 2M points, the coarse points being the even fine ones) and RICHARDSON-extrapolated, (4E_2M − E_M)/3.
 * Self-consistency is by ANDERSON/Pulay mixing (depth 6) on the residual V_out − V_in.
 *
 * STATUS: NUMERICAL, and the numbers are DERIVED-HERE against a KNOWN port.  Certified in tests/atoms.test.mjs:
 * bare Coulomb Z = 18 to 1e-7 Eh after Richardson; Ne −127.476 and Ar −524.506 (Opus Q2 of the FIELDS AND MOLECULES
 * round, research/MATH-FIELDS-AND-MOLECULES-2026-09-04.md, ported from research/probes-fields/opus-q2-atoms.py);
 * He by self-interaction-free Hartree = −2.8616800 = the Hartree–Fock limit (E.1, corrected by Opus with Simpson);
 * Ne 2p Δ-SCF 21.09 eV; Na δ_s.  KNOWN-and-cited: HF limits Ne −128.54710, Ar −526.81751, He −2.8616800/−0.9179559;
 * δ_s(Na) = 1.3730 from spectra; Cr and Cu are the two Aufbau exceptions below Z = 37.
 *
 * WHAT THIS MODEL IS NOT.  Xα eigenvalues are not Koopmans energies and must never be printed as ionisation
 * potentials (Slater 1970): −ε_2p(Ne) = 15.08 eV against a measured 21.56, while the Δ-SCF of the SAME functional
 * gives 21.09.  Xα(2/3), Slater's α = 1, "HFS" and nonlocal Hartree–Fock are FOUR different models; the α and the
 * tail travel with every number this file returns, in `model`.  The 3d/4s ordering of the transition row is
 * α-dependent (Sc crosses between 2/3 and 1) — the file reports both eigenvalues and never asserts an order.
 * A shell the ground configuration does not occupy (virtualOrbital, virtualEnergyOf, the ° labels) is an
 * eigenstate of the FROZEN field, not of the atom: it is not an excitation energy, not an affinity, and a high
 * one may be a state of the r_max box rather than of the atom — ε ≥ 0 says exactly that.
 */

const HARTREE_EV = 27.211386245988;                      // CODATA 2018
const SPD = 'spdfgh';
export const NR = 256;                                   // samples per tabulated radial row (space 6)
export const ROWS = 40;                                  // rows in the GPU's radial buffer (field.js: 40 × 256 f32)
export const rowOf = (n, l) => l * 6 + (n - l - 1);      // the same (n_r, l) row map cornell.js uses

/* ══ the ground configurations ══════════════════════════════════════════════════════════════════════════════ */
const NAMES = [
  ['H', 'Hydrogen'], ['He', 'Helium'], ['Li', 'Lithium'], ['Be', 'Beryllium'], ['B', 'Boron'], ['C', 'Carbon'],
  ['N', 'Nitrogen'], ['O', 'Oxygen'], ['F', 'Fluorine'], ['Ne', 'Neon'], ['Na', 'Sodium'], ['Mg', 'Magnesium'],
  ['Al', 'Aluminium'], ['Si', 'Silicon'], ['P', 'Phosphorus'], ['S', 'Sulfur'], ['Cl', 'Chlorine'], ['Ar', 'Argon'],
  ['K', 'Potassium'], ['Ca', 'Calcium'], ['Sc', 'Scandium'], ['Ti', 'Titanium'], ['V', 'Vanadium'], ['Cr', 'Chromium'],
  ['Mn', 'Manganese'], ['Fe', 'Iron'], ['Co', 'Cobalt'], ['Ni', 'Nickel'], ['Cu', 'Copper'], ['Zn', 'Zinc'],
  ['Ga', 'Gallium'], ['Ge', 'Germanium'], ['As', 'Arsenic'], ['Se', 'Selenium'], ['Br', 'Bromine'], ['Kr', 'Krypton'],
];
const MADELUNG = [[1, 0], [2, 0], [2, 1], [3, 0], [3, 1], [4, 0], [3, 2], [4, 1]];   // n + l, then n — enough for Z ≤ 36
/** the Aufbau filling of N electrons, as [{n, l, occ}] sorted by (n, l) */
function aufbau(N) {
  const cfg = [];
  for (const [n, l] of MADELUNG) { if (N <= 0) break; const o = Math.min(N, 2 * (2 * l + 1)); cfg.push({ n, l, occ: o }); N -= o; }
  return cfg.sort((a, b) => a.n - b.n || a.l - b.l);
}
/* the two exceptions below Z = 37: a half- and a wholly-filled d shell each buy one 4s electron */
const EXCEPTIONS = { 24: [[1, 0, 2], [2, 0, 2], [2, 1, 6], [3, 0, 2], [3, 1, 6], [3, 2, 5], [4, 0, 1]],
                     29: [[1, 0, 2], [2, 0, 2], [2, 1, 6], [3, 0, 2], [3, 1, 6], [3, 2, 10], [4, 0, 1]] };
export const EXCHANGE_MODEL = 'Xα(2/3) + Latter tail';
/** the model string that travels with every number: α and the tail, always named (Sol's model-identity rule) */
export function modelName(alpha, latter, sic) {
  if (sic) return 'Hartree, self-interaction-free' + (latter ? ' + Latter tail' : '');
  const a = alpha === 2 / 3 ? '2/3' : alpha === 1 ? '1' : (+alpha.toFixed(4)).toString();
  return (alpha ? `Xα(${a})` : 'Hartree (no exchange)') + (latter ? ' + Latter tail' : ', no tail');
}
/** ATOMS[i] is the atom of Z = i + 1 (H … Kr): { Z, symbol, name, config: [{n, l, occ}], term, model } */
export const ATOMS = NAMES.map(([symbol, name], i) => {
  const Z = i + 1;
  const config = EXCEPTIONS[Z] ? EXCEPTIONS[Z].map(([n, l, occ]) => ({ n, l, occ })) : aufbau(Z);
  return { Z, symbol, name, config, model: EXCHANGE_MODEL,
    term: config.map((c) => `${c.n}${SPD[c.l]}${c.occ > 1 ? String(c.occ).replace(/./g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]) : ''}`).join(' ') };
});
export const atom = (Z) => ATOMS[Z - 1];
export const configOf = (Z) => atom(Z).config.map((c) => ({ ...c }));

/* ══ symmetric tridiagonal: Sturm bisection + inverse iteration ══════════════════════════════════════════════ */
/** the number of eigenvalues of the tridiagonal (d, e) below s — the Sturm sequence of the leading minors */
function sturm(d, e, n, s) {
  let c = 0, p = d[0] - s;
  if (p < 0) c++;
  for (let i = 1; i < n; i++) { if (p === 0) p = 1e-300; p = d[i] - s - e[i - 1] * e[i - 1] / p; if (p < 0) c++; }
  return c;
}
/** the k-th (0-based) eigenvalue, by bisection on the Sturm count inside a bracket that must contain it */
function eigenvalue(d, e, n, k, lo, hi) {
  for (let it = 0; it < 200; it++) {
    const m = 0.5 * (lo + hi);
    if (m <= lo || m >= hi) break;
    if (sturm(d, e, n, m) > k) hi = m; else lo = m;
    if (hi - lo < 1e-14 * (1 + Math.abs(hi))) break;
  }
  return 0.5 * (lo + hi);
}
/** inverse iteration for the eigenvector of (d, e) at λ: LU of the tridiagonal with partial pivoting (dgtsv) */
function invIter(d, e, n, lam, x) {
  const dl = new Float64Array(n), du = new Float64Array(n), du2 = new Float64Array(n), dd = new Float64Array(n), piv = new Uint8Array(n);
  const shift = 1e-13 * (1 + Math.abs(lam));                       // λ is an eigenvalue to 1e-14: step off it
  for (let i = 0; i < n; i++) dd[i] = d[i] - lam - shift;
  for (let i = 0; i < n - 1; i++) { dl[i] = e[i]; du[i] = e[i]; }
  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(dd[i]) >= Math.abs(dl[i])) {
      if (dd[i] === 0) dd[i] = 1e-300;
      const m = dl[i] / dd[i]; dl[i] = m; dd[i + 1] -= m * du[i]; if (i < n - 2) du2[i] = 0; piv[i] = 0;
    } else {
      const m = dd[i] / dl[i]; dd[i] = dl[i]; dl[i] = m;
      const t = du[i]; du[i] = dd[i + 1]; dd[i + 1] = t - m * dd[i + 1];
      if (i < n - 2) { du2[i] = du[i + 1]; du[i + 1] = -m * du[i + 1]; }
      piv[i] = 1;
    }
  }
  if (dd[n - 1] === 0) dd[n - 1] = 1e-300;
  const b = new Float64Array(n);
  for (let pass = 0; pass < 2; pass++) {
    b.set(x);
    for (let i = 0; i < n - 1; i++) { if (piv[i]) { const t = b[i]; b[i] = b[i + 1]; b[i + 1] = t - dl[i] * b[i + 1]; } else b[i + 1] -= dl[i] * b[i]; }
    b[n - 1] /= dd[n - 1];
    if (n > 1) b[n - 2] = (b[n - 2] - du[n - 2] * b[n - 1]) / dd[n - 2];
    for (let i = n - 3; i >= 0; i--) b[i] = (b[i] - du[i] * b[i + 1] - du2[i] * b[i + 2]) / dd[i];
    let nrm = 0; for (let i = 0; i < n; i++) nrm += b[i] * b[i];
    nrm = 1 / Math.sqrt(nrm);
    for (let i = 0; i < n; i++) x[i] = b[i] * nrm;
  }
  return x;
}

/* ══ the logarithmic mesh and its quadratures ═══════════════════════════════════════════════════════════════ */
/** M interior points; n = M + 2 samples r₀ … r_max, n odd so Simpson closes */
function mesh(M, r0, rmax) {
  const n = M + 2, dx = Math.log(rmax / r0) / (n - 1), r = new Float64Array(n);
  for (let j = 0; j < n; j++) r[j] = r0 * Math.exp(j * dx);
  return { n, M, dx, r, r0, rmax };
}
/** ∫ f dr = ∫ f·r dx by Simpson (n odd) */
function integ(g, f) {
  const { n, r, dx } = g; let s = f[0] * r[0] + f[n - 1] * r[n - 1];
  for (let j = 1; j < n - 1; j++) s += (j % 2 ? 4 : 2) * f[j] * r[j];
  return s * dx / 3;
}
/** the running ∫_0^{r_j} f dr, third-order per step (the head ∫_0^{r₀} of a f ∼ r² density is f·r/3) */
function cumulative(g, f, out) {
  const { n, r, dx } = g, w = out || new Float64Array(n), q = new Float64Array(n);
  for (let j = 0; j < n; j++) q[j] = f[j] * r[j];
  w[0] = f[0] * r[0] / 3;
  for (let j = 0; j + 2 < n; j++) w[j + 1] = w[j] + dx / 12 * (5 * q[j] + 8 * q[j + 1] - q[j + 2]);
  w[n - 1] = w[n - 2] + dx / 12 * (-q[n - 3] + 8 * q[n - 2] + 5 * q[n - 1]);
  return w;
}
/** V_H(r) = (1/r)∫₀^r q ds + ∫_r^∞ q/s ds — the exact classical potential of the density q/4πr² */
function hartree(g, q, out) {
  const { n, r, dx } = g, V = out || new Float64Array(n), inner = cumulative(g, q);
  let outer = 0;                                              // ∫ q/s ds = ∫ q dx: the log mesh does this one for free
  V[n - 1] = inner[n - 1] / r[n - 1];
  for (let j = n - 2; j >= 0; j--) { outer += dx / 12 * (5 * q[j] + 8 * q[j + 1] - (j + 2 < n ? q[j + 2] : q[j + 1])); V[j] = inner[j] / r[j] + outer; }
  return V;
}

/* ══ the l-channel: every shell of one l from one matrix ════════════════════════════════════════════════════ */
function solveL(g, V, l, k, guess) {
  const { n, M, dx, r } = g, d = new Float64Array(M), e = new Float64Array(M - 1);
  const c = (l + 0.5) * (l + 0.5) / 2, id = 1 / (dx * dx);
  for (let i = 0; i < M; i++) { const j = i + 1, rr = r[j] * r[j]; d[i] = id / rr + c / rr + V[j]; }
  for (let i = 0; i < M - 1; i++) e[i] = -0.5 * id / (r[i + 1] * r[i + 2]);
  d[0] += Math.exp(-(l + 1.5) * dx) * (-0.5 * id / (r[0] * r[1]));      // u ∼ r^{l+1} at r₀, not the hard wall u(r₀) = 0
  let glo = Infinity, ghi = -Infinity;
  for (let i = 0; i < M; i++) { const a = (i > 0 ? Math.abs(e[i - 1]) : 0) + (i < M - 1 ? Math.abs(e[i]) : 0); glo = Math.min(glo, d[i] - a); ghi = Math.max(ghi, d[i] + a); }
  const out = [], x = new Float64Array(M);
  for (let q = 0; q < k; q++) {
    let lo = glo, hi = ghi;
    if (guess && guess[q] !== undefined && isFinite(guess[q])) {        // warm start: a narrow bracket saves ~30 Sturm sweeps
      const gq = guess[q], w = Math.max(2e-3, 0.08 * Math.abs(gq));
      if (sturm(d, e, M, gq - w) <= q && sturm(d, e, M, gq + w) > q) { lo = gq - w; hi = gq + w; }
    }
    const lam = eigenvalue(d, e, M, q, lo, hi);
    for (let i = 0; i < M; i++) x[i] = Math.sin((q + 1) * Math.PI * (i + 1) / (M + 1)) + 1e-6;
    invIter(d, e, M, lam, x);
    const u = new Float64Array(n);
    for (let i = 0; i < M; i++) u[i + 1] = x[i] / Math.sqrt(2 * r[i + 1]);      // y = √2 √r u
    u[0] = u[1] * Math.exp(-(l + 1) * dx);                                      // the wall's own law u ∼ r^{l+1}: u₀ = u₁(r₀/r₁)^{l+1} — it was left 0, a one-bin hole at the nucleus (wave 42)
    let nrm = u[0] * u[0] * r[0] + u[n - 1] * u[n - 1] * r[n - 1];
    for (let j = 1; j < n - 1; j++) nrm += (j % 2 ? 4 : 2) * u[j] * u[j] * r[j];
    nrm *= dx / 3;
    let sc = 1 / Math.sqrt(nrm), mx = 0, mi = 0;
    for (let j = 0; j < n; j++) if (Math.abs(u[j]) > mx) { mx = Math.abs(u[j]); mi = j; }
    if (u[mi] < 0) sc = -sc;
    for (let j = 0; j < n; j++) u[j] *= sc;
    let nodes = 0; for (let j = 2; j < n - 1; j++) if (u[j] * u[j - 1] < 0) nodes++;
    out.push({ eps: lam, u, nodes });
  }
  return out;
}

/* ══ Anderson (Pulay) mixing on the potential ═══════════════════════════════════════════════════════════════ */
class Anderson {
  constructor(n, depth, beta, w) { this.n = n; this.depth = depth; this.beta = beta; this.w = w; this.V = []; this.F = []; }
  /** given the input potential and its residual F = V_out − V_in, the next input potential */
  next(Vin, F) {
    const { n, w } = this;
    this.V.push(Float64Array.from(Vin)); this.F.push(Float64Array.from(F));
    if (this.V.length > this.depth) { this.V.shift(); this.F.shift(); }
    const m = this.V.length, B = [];
    for (let i = 0; i < m; i++) { B.push(new Float64Array(m + 1)); for (let j = 0; j < m; j++) { let s = 0; for (let k = 0; k < n; k++) s += w[k] * this.F[i][k] * this.F[j][k]; B[i][j] = s; } }
    const A = [];                                        // the DIIS system: B c = 0 with Σc = 1, by a Lagrange multiplier
    for (let i = 0; i < m; i++) { const row = new Float64Array(m + 2); for (let j = 0; j < m; j++) row[j] = B[i][j] * (i === j ? 1 + 1e-9 : 1); row[m] = 1; row[m + 1] = 0; A.push(row); }
    { const row = new Float64Array(m + 2); for (let j = 0; j < m; j++) row[j] = 1; row[m] = 0; row[m + 1] = 1; A.push(row); }
    const c = gauss(A, m + 1);
    const out = new Float64Array(n);
    if (!c) { for (let k = 0; k < n; k++) out[k] = Vin[k] + this.beta * F[k]; return out; }             // ill-conditioned: linear mix
    for (let i = 0; i < m; i++) for (let k = 0; k < n; k++) out[k] += c[i] * (this.V[i][k] + this.beta * this.F[i][k]);
    for (let k = 0; k < n; k++) if (!isFinite(out[k])) { for (let j = 0; j < n; j++) out[j] = Vin[j] + this.beta * F[j]; return out; }
    return out;
  }
}
/** Gaussian elimination with partial pivoting on the augmented rows; null if singular */
function gauss(A, N) {
  for (let i = 0; i < N; i++) {
    let p = i; for (let k = i + 1; k < N; k++) if (Math.abs(A[k][i]) > Math.abs(A[p][i])) p = k;
    if (Math.abs(A[p][i]) < 1e-300) return null;
    const t = A[i]; A[i] = A[p]; A[p] = t;
    for (let k = i + 1; k < N; k++) { const f = A[k][i] / A[i][i]; for (let j = i; j <= N; j++) A[k][j] -= f * A[i][j]; }
  }
  const x = new Float64Array(N);
  for (let i = N - 1; i >= 0; i--) { let s = A[i][N]; for (let j = i + 1; j < N; j++) s -= A[i][j] * x[j]; x[i] = s / A[i][i]; if (!isFinite(x[i])) return null; }
  return x;
}

/* ══ one self-consistent field on one mesh ══════════════════════════════════════════════════════════════════ */
const CX = -0.75 * Math.cbrt(3 / Math.PI);                 // E_x = α·CX·∫ρ^{4/3}d³r ; V_x = −(3α/2)(3ρ/π)^{1/3}
/** the pieces every SCF needs: the bare nucleus, the Latter ceiling, the l-channel demand, the mixer's measure */
function frame(Z, config, g) {
  const { n, r } = g, Nel = config.reduce((s, c) => s + c.occ, 0), lmax = config.reduce((m, c) => Math.max(m, c.l), 0);
  const nuc = new Float64Array(n), tail = new Float64Array(n), w = new Float64Array(n);
  for (let j = 0; j < n; j++) { nuc[j] = -Z / r[j]; tail[j] = -(Z - Nel + 1) / r[j]; w[j] = r[j] * r[j] * g.dx; }
  const need = [];
  for (let l = 0; l <= lmax; l++) { let k = 0; for (const c of config) if (c.l === l) k = Math.max(k, c.n - l); need.push(k); }
  return { Nel, lmax, nuc, tail, w, need };
}
const shellKey = (c) => c.n + ':' + c.l;
/** the common central field: Xα(α) + V_H on one potential for every shell, Anderson-mixed to self-consistency */
function scf(Z, config, g, o) {
  const { n, r } = g, { Nel, lmax, nuc, tail, w, need } = frame(Z, config, g);
  let V = o.V0 ? Float64Array.from(o.V0) : Float64Array.from(nuc);
  const mixer = new Anderson(n, o.depth, o.beta, w), guess = need.map(() => []);
  const solveAll = () => {
    const orbs = new Map();
    for (let l = 0; l <= lmax; l++) {
      if (!need[l]) continue;
      const s = solveL(g, V, l, need[l], guess[l]);
      for (let i = 0; i < need[l]; i++) { guess[l][i] = s[i].eps; orbs.set((i + l + 1) + ':' + l, s[i]); }
    }
    const q = new Float64Array(n);
    for (const c of config) { const u = orbs.get(shellKey(c)).u; for (let j = 0; j < n; j++) q[j] += c.occ * u[j] * u[j]; }
    return { orbs, q };
  };
  let orbs = null, q = null, it = 0, dV = 1;
  const k13 = 1.5 * o.alpha * Math.cbrt(3 / Math.PI), Vout = new Float64Array(n), F = new Float64Array(n);
  for (it = 1; it <= o.maxIter; it++) {
    ({ orbs, q } = solveAll());
    const VH = hartree(g, q);
    for (let j = 0; j < n; j++) Vout[j] = nuc[j] + VH[j] - k13 * Math.cbrt(q[j] / (4 * Math.PI * r[j] * r[j]));
    if (o.latter) for (let j = 0; j < n; j++) Vout[j] = Math.min(Vout[j], tail[j]);
    dV = maxdiff(Vout, V, r);
    if (dV < o.tol) break;
    for (let j = 0; j < n; j++) F[j] = Vout[j] - V[j];
    V = mixer.next(V, F);
  }
  ({ orbs, q } = solveAll());                               // ε, u and V are the same problem at the end
  const rho = new Float64Array(n); for (let j = 0; j < n; j++) rho[j] = q[j] / (4 * Math.PI * r[j] * r[j]);
  const VH = hartree(g, q), t = new Float64Array(n);
  let T = 0;
  for (const c of config) { const s = orbs.get(shellKey(c)); for (let j = 0; j < n; j++) t[j] = s.u[j] * s.u[j] * V[j]; T += c.occ * (s.eps - integ(g, t)); }
  for (let j = 0; j < n; j++) t[j] = q[j] * nuc[j];
  const Ene = integ(g, t);
  for (let j = 0; j < n; j++) t[j] = q[j] * VH[j];
  const EH = 0.5 * integ(g, t);
  for (let j = 0; j < n; j++) t[j] = 4 * Math.PI * r[j] * r[j] * Math.pow(rho[j], 4 / 3);
  const Ex = 1.5 * o.alpha * CX * integ(g, t);              // = −(9α/8)(3/π)^{1/3}∫ρ^{4/3}d³r
  return { E: T + Ene + EH + Ex, T, Ene, EH, Ex, orbs, q, rho, V, VH, g, r, iterations: it, dV, Nel, electrons: integ(g, q) };
}
/**
 * the self-interaction-free HARTREE: each shell moves in −Z/r + V_H[q_total] − V_H[q_nl]/f_nl, so no electron sees
 * its own charge.  For a closed-shell pair in ONE orbital this IS Hartree–Fock (He: −2.8616800), which is the E.1
 * gate; for one electron it is exactly −Z/r, which is the hydrogenic limit.  Anderson mixes the per-shell densities
 * concatenated into one vector — the self-interaction needs them separately, so the density is the state.
 */
function scfSic(Z, config, g, o) {
  const { n, r } = g, { Nel, nuc, tail, w } = frame(Z, config, g), ns = config.length;
  const W = new Float64Array(n * ns); for (let i = 0; i < ns; i++) W.set(w, i * n);
  const mixer = new Anderson(n * ns, o.depth, o.beta, W), guess = config.map(() => []);
  let state = new Float64Array(n * ns), orbs = null, Vorb = null, it = 0, dV = 1, first = true;
  const step = () => {                                       // densities → per-shell potentials → new densities
    const qt = new Float64Array(n);
    if (!first) for (let i = 0; i < ns; i++) for (let j = 0; j < n; j++) qt[j] += state[i * n + j];
    const VHt = first ? null : hartree(g, qt);
    Vorb = new Map(); orbs = new Map();
    const next = new Float64Array(n * ns);
    for (let i = 0; i < ns; i++) {
      const c = config[i], Vc = new Float64Array(n);
      if (first) Vc.set(nuc);
      else { const self = hartree(g, state.subarray(i * n, i * n + n)); for (let j = 0; j < n; j++) Vc[j] = nuc[j] + VHt[j] - self[j] / c.occ; }
      if (o.latter) for (let j = 0; j < n; j++) Vc[j] = Math.min(Vc[j], tail[j]);
      Vorb.set(shellKey(c), Vc);
      const s = solveL(g, Vc, c.l, c.n - c.l, guess[i])[c.n - c.l - 1];
      guess[i][c.n - c.l - 1] = s.eps; orbs.set(shellKey(c), s);
      for (let j = 0; j < n; j++) next[i * n + j] = c.occ * s.u[j] * s.u[j];
    }
    first = false;
    return next;
  };
  let next = step(); state = next;
  const F = new Float64Array(n * ns);
  for (it = 1; it <= o.maxIter; it++) {
    next = step();
    let m = 0; for (let i = 0; i < ns; i++) for (let j = 0; j < n; j++) { const d = Math.abs((next[i * n + j] - state[i * n + j]) * r[j]); if (d > m) m = d; }
    dV = m;
    if (dV < o.tol) break;
    for (let k = 0; k < n * ns; k++) F[k] = next[k] - state[k];
    state = mixer.next(state, F);
  }
  state = next; step();                                      // the last potentials are built from the final densities
  const q = new Float64Array(n);
  for (let i = 0; i < ns; i++) for (let j = 0; j < n; j++) q[j] += state[i * n + j];
  const VH = hartree(g, q), t = new Float64Array(n);
  let T = 0, EH = 0.5 * (() => { for (let j = 0; j < n; j++) t[j] = q[j] * VH[j]; return integ(g, t); })();
  for (const c of config) { const s = orbs.get(shellKey(c)), Vc = Vorb.get(shellKey(c)); for (let j = 0; j < n; j++) t[j] = s.u[j] * s.u[j] * Vc[j]; T += c.occ * (s.eps - integ(g, t)); }
  for (let i = 0; i < ns; i++) {                             // remove the self-Hartree double count, shell by shell
    const qi = state.subarray(i * n, i * n + n), hi = hartree(g, qi);
    for (let j = 0; j < n; j++) t[j] = qi[j] * hi[j];
    EH -= 0.5 * integ(g, t) / config[i].occ;
  }
  for (let j = 0; j < n; j++) t[j] = q[j] * nuc[j];
  const Ene = integ(g, t);
  const rho = new Float64Array(n); for (let j = 0; j < n; j++) rho[j] = q[j] / (4 * Math.PI * r[j] * r[j]);
  return { E: T + Ene + EH, T, Ene, EH, Ex: 0, orbs, q, rho, V: Vorb.get(shellKey(config[0])), Vorb, g, r,
    iterations: it, dV, Nel, electrons: integ(g, q) };
}
function maxdiff(a, b, r) { let m = 0; for (let j = 0; j < a.length; j++) { const d = Math.abs((a[j] - b[j]) * r[j]); if (d > m) m = d; } return m; }

/* ══ solveAtom — the two meshes and the Richardson limit ════════════════════════════════════════════════════ */
const CACHE = new Map();
const key = (Z, o) => [Z, o.alpha, o.latter ? 1 : 0, o.sic ? 1 : 0, o.M, o.rmax, o.richardson ? 1 : 0,
  o.config.map((c) => `${c.n}${c.l}:${c.occ}`).join(',')].join('|');

/**
 * solveAtom(Z, opts) — the self-consistent central field of atom Z, in hartree on a logarithmic mesh.
 *   opts: alpha = 2/3 (Xα; 0 = no exchange), config (default the ground configuration), tol = 1e-8 on max|ΔV·r|,
 *         latter = true, sic = false (self-interaction-free Hartree: a potential per shell, α ignored),
 *         richardson = true (solve on M and 2M points and extrapolate ε and E), M = 999, rmax = 60.
 * → { Z, E, orbitals: [{n, l, occ, eps, nodes, r, u}], iterations, model, alpha, config, r, ... }
 */
export function solveAtom(Z, opts = {}) {
  const o = { alpha: 2 / 3, latter: true, sic: false, tol: 1e-8, richardson: true, M: 999, rmax: 60,
    depth: 6, beta: 0.35, maxIter: 400, ...opts };
  o.config = (opts.config || configOf(Z)).filter((c) => c.occ > 0).map((c) => ({ n: c.n, l: c.l, occ: c.occ })).sort((a, b) => a.n - b.n || a.l - b.l);
  if (o.sic) o.alpha = 0;
  if (o.alpha === 0 && !opts.sic && opts.alpha === 0) o.sic = true;      // α = 0 means the self-interaction-free Hartree
  const kk = key(Z, o), hit = CACHE.get(kk); if (hit) return hit;
  const r0 = 1e-6 / Z, run = o.sic ? scfSic : scf;
  const gc = mesh(o.M, r0, o.rmax), A = run(Z, o.config, gc, o);
  let out = A, gf = gc;
  if (o.richardson) {
    gf = mesh(2 * o.M + 1, r0, o.rmax);                     // the coarse points are the even fine ones: x_i = x_{2i}
    let oF = o;
    if (!o.sic) {                                           // start the fine SCF from the coarse potential (rV + Z is smooth)
      const V0 = new Float64Array(gf.n);
      for (let i = 0; i < gc.n; i++) V0[2 * i] = A.V[i];
      for (let i = 0; i + 1 < gc.n; i++) { const W = 0.5 * ((A.V[i] * gc.r[i] + Z) + (A.V[i + 1] * gc.r[i + 1] + Z)); V0[2 * i + 1] = (W - Z) / gf.r[2 * i + 1]; }
      oF = { ...o, V0 };
    }
    const B = run(Z, o.config, gf, oF);
    out = B; out.coarse = A;
    out.E = (4 * B.E - A.E) / 3;
    for (const [k, s] of B.orbs) { const a = A.orbs.get(k); if (a) s.eps = (4 * s.eps - a.eps) / 3; }
    out.iterations = A.iterations + B.iterations;
  }
  const orbitals = o.config.map((c) => { const s = out.orbs.get(c.n + ':' + c.l); return { n: c.n, l: c.l, occ: c.occ, eps: s.eps, nodes: s.nodes, r: gf.r, u: s.u, label: `${c.n}${SPD[c.l]}` }; });
  const res = { Z, symbol: (atom(Z) || {}).symbol, E: out.E, orbitals, iterations: out.iterations, alpha: o.alpha,
    model: modelName(o.alpha, o.latter, o.sic), config: o.config, r: gf.r, mesh: gf, q: out.q, rho: out.rho, V: out.V,
    T: out.T, Ene: out.Ene, EH: out.EH, Ex: out.Ex, electrons: out.electrons, residual: out.dV, Nel: out.Nel,
    Vorb: out.Vorb, coarse: out.coarse && { V: out.coarse.V, mesh: out.coarse.g } };
  CACHE.set(kk, res);
  return res;
}
/** ε_nl of atom Z in hartree */
export function atomEnergyOf(Z, n, l, opts) {
  const s = solveAtom(Z, opts).orbitals.find((c) => c.n === n && c.l === l);
  if (!s) throw new Error(`Z = ${Z} has no ${n}${SPD[l]} shell in its ground configuration`);
  return s.eps;
}
/** the total energy of atom Z (hartree) */
export const atomTotalEnergy = (Z, opts) => solveAtom(Z, opts).E;
/** every shell of one l in the FROZEN converged field, fine mesh + the coarse one's Richardson partner — one
 *  solveL per channel (the matrix gives them all at once), cached on the solved atom.  n ≤ 6 comes for free. */
function frozenChannel(S, l, k) {
  if (!S.frozen) S.frozen = new Map();
  let c = S.frozen.get(l);
  if (!c || c.length < k) {
    const kk = Math.max(k, 6 - l);                                      // the register's 91 labels stop at n = 6
    const f = solveL(S.mesh, S.V, l, kk), co = S.coarse ? solveL(S.coarse.mesh, S.coarse.V, l, kk) : null;
    c = f.map((s, i) => ({ n: l + 1 + i, l, occ: 0, eps: co ? (4 * s.eps - co[i].eps) / 3 : s.eps, epsFine: s.eps, u: s.u, nodes: s.nodes, virtual: true }));
    S.frozen.set(l, c);
  }
  return c;
}
/**
 * virtualOrbital(Z, n, l) — the shell the ground configuration does NOT occupy (K's 3d), solved in the SAME
 * converged central field: { eps, u, r } (plus n, l, nodes).  ε is Richardson-extrapolated exactly as an occupied
 * shell's; u is the FINE mesh's normalised radial function (∫u² dr = 1, u ∼ r^{l+1} at the origin, R = u/r) and r
 * is that mesh.  It is a readout of the FROZEN field, not a self-consistent state of the atom, and it is neither
 * an excitation energy nor an electron affinity — ε ≥ 0 would mean the box binds the shell and the atom does not.
 */
export function virtualOrbital(Z, n, l, opts = {}) {
  const S = solveAtom(Z, opts);
  if (S.Vorb) throw new Error('virtual eigenvalues need one common central field: not the self-interaction-free branch');
  const c = frozenChannel(S, l, n - l)[n - l - 1];
  return { Z, n, l, eps: c.eps, u: c.u, r: S.mesh.r, mesh: S.mesh, nodes: c.nodes, epsFine: c.epsFine, virtual: true };
}
/** ε_nl of a shell the ground configuration does NOT occupy — virtualOrbital's eigenvalue, by construction */
export function virtualEnergyOf(Z, n, l, opts = {}) { return virtualOrbital(Z, n, l, opts).eps; }
/** ε_nl whether the shell is occupied or not */
export function shellEnergyOf(Z, n, l, opts) {
  const s = solveAtom(Z, opts).orbitals.find((c) => c.n === n && c.l === l);
  return s ? s.eps : virtualEnergyOf(Z, n, l, opts);
}

/* ══ Δ-SCF ionisation ═══════════════════════════════════════════════════════════════════════════════════════ */
/**
 * ionisation(Z, {n, l}) — the Δ-SCF ionisation potential in eV: the self-consistent ion (one electron removed from
 * that shell, so the Latter tail becomes −2/r) minus the self-consistent neutral.  NOT −ε: an Xα eigenvalue is not
 * a Koopmans energy (Ne 2p: −ε = 15.08 eV, Δ-SCF = 21.09 eV, measured 21.56).
 */
export function ionisation(Z, shell = {}, opts = {}) {
  const cfg = configOf(Z), sh = shell.n === undefined ? cfg[cfg.length - 1] : cfg.find((c) => c.n === shell.n && c.l === shell.l);
  if (!sh) throw new Error(`Z = ${Z} has no ${shell.n}${SPD[shell.l]} shell`);
  const ion = cfg.map((c) => (c === sh ? { ...c, occ: c.occ - 1 } : { ...c })).filter((c) => c.occ > 0);
  const A = solveAtom(Z, opts), B = solveAtom(Z, { ...opts, config: ion });
  return (B.E - A.E) * HARTREE_EV;
}

/* ══ the quantum defect ═════════════════════════════════════════════════════════════════════════════════════ */
/**
 * quantumDefect(Z, n, l) — δ_l = n − n*, n* = 1/√(−2ε_nl), from the Xα valence eigenvalue WITH the Latter tail
 * (without it the LDA potential decays exponentially and there is no Coulomb tail for n* to mean anything).
 * Na 3s: 1.3265 at α = 2/3 and 1.3732 at α = 1 (measured 1.3730) — the α travels with the number.
 */
export function quantumDefect(Z, n, l, opts = {}) {
  const eps = atomEnergyOf(Z, n, l, opts);
  if (eps >= 0) return NaN;
  return n - 1 / Math.sqrt(-2 * eps);
}
export const effectiveN = (Z, n, l, opts) => 1 / Math.sqrt(-2 * atomEnergyOf(Z, n, l, opts));

/* ══ the radial table the GPU consumes (space 6) ════════════════════════════════════════════════════════════ */
/** the (mesh, orbital) pair atomRadial reads: found once per (Z, n, l) for the default options — solveAtom's cache key is a
 *  string built per call, and the kernel and the radial integrals ask for R_nl(r) hundreds of thousands of times (wave 42) */
const RADIAL_REC = new Map();
function radialRecord(Z, n, l, opts) {
  const S = solveAtom(Z, opts), g = S.mesh;
  const s = S.orbitals.find((c) => c.n === n && c.l === l) || (S.Vorb ? null : virtualOrbital(Z, n, l, opts));
  return { g, s };
}
/** R_nl(r) = u(r)/r off the log mesh, by linear interpolation in x = ln r (0 outside, u ∼ r^{l+1} inside r₀, so R(0) = u₁/r₁
 *  for l = 0 and 0 for l > 0); a shell the ground configuration does not occupy is read off the frozen field's own orbital
 *  (virtualOrbital) */
export function atomRadial(Z, n, l, rr, opts) {
  let rec;
  if (opts === undefined) { const k = (Z * 8 + n) * 8 + l; rec = RADIAL_REC.get(k); if (!rec) { rec = radialRecord(Z, n, l); RADIAL_REC.set(k, rec); } }
  else rec = radialRecord(Z, n, l, opts);
  const { g, s } = rec;
  if (!s) return 0;
  if (rr >= g.rmax) return 0;
  if (rr <= g.r0) return l === 0 ? s.u[0] / g.r0 : 0;                    // R = u/r is finite at 0 only for l = 0
  const x = Math.log(rr / g.r0) / g.dx, i0 = Math.min(g.n - 2, Math.max(0, Math.floor(x))), f = x - i0;
  return (s.u[i0] * (1 - f) + s.u[i0 + 1] * f) / rr;
}
/** where 99.9 % of the shell lives, ×1.25 — the table's domain radius */
function domainOf(S, s) {
  const g = S.mesh; let acc = 0, i = g.n - 1;
  for (; i > 0; i--) { acc += s.u[i] * s.u[i] * g.r[i] * g.dx; if (acc > 1e-3) break; }
  return Math.min(g.rmax, g.r[i] * 1.25);
}
/**
 * atomRadialTable(Z, n, l) — the 40 × 256 space-6 table (Float32Array, row = l·6 + n − l − 1, 256 samples of
 * R_nl(r) = u/r linear in r from 0 to rTab) with EVERY occupied shell of the atom filled in, plus the domain
 * radius of the shell asked for.  The same shape and row map cornellRadialTable() hands field.js.
 * A shell the ground configuration does NOT occupy gets its own row too — the frozen field's orbital
 * (virtualOrbital), flagged `virtual` so the caller can keep saying ° — instead of throwing.
 */
export function atomRadialTable(Z, n, l, opts) {
  const S = solveAtom(Z, opts), g = S.mesh, table = new Float32Array(ROWS * NR), rows = [];
  const put = (s, virtual) => {
    const row = rowOf(s.n, s.l), rt = domainOf(S, s), rec = { n: s.n, l: s.l, occ: s.occ || 0, eps: s.eps, row, rTab: rt, virtual: !!virtual };
    rows.push(rec);
    for (let j = 0; j < NR; j++) {
      const rr = rt * j / (NR - 1);
      if (rr <= g.r0) { table[row * NR + j] = s.l === 0 ? s.u[0] / g.r0 : 0; continue; }
      const x = Math.log(rr / g.r0) / g.dx, i0 = Math.min(g.n - 2, Math.max(0, Math.floor(x))), f = x - i0;
      table[row * NR + j] = (s.u[i0] * (1 - f) + s.u[i0 + 1] * f) / rr;
    }
    return rec;
  };
  for (const s of S.orbitals) put(s, false);
  let me = rows.find((c) => c.n === n && c.l === l);
  if (!me) me = put(virtualOrbital(Z, n, l, opts), true);
  return { table, rows, row: me.row, rTab: me.rTab, domain: me.rTab, eps: me.eps, virtual: !!me.virtual, NR, ROWS, Z, n, l, model: S.model };
}
/** the half-width the field needs for atom Z: the largest occupied shell's table radius */
export function atomDomainFor(Z, opts) {
  const S = solveAtom(Z, opts); let r = 0;
  for (const s of S.orbitals) r = Math.max(r, domainOf(S, s));
  return Math.max(r, 1);
}
/** the occupied shells of atom Z as a spectrum ladder: { key, E, label, occ } sorted by ε */
export function atomSpectrum(Z, opts) {
  const S = solveAtom(Z, opts);
  return { levels: S.orbitals.map((s) => ({ key: s.n + ':' + s.l, E: s.eps, label: `${s.n}${SPD[s.l]}`, occ: s.occ })).sort((a, b) => a.E - b.E),
    E: S.E, footer: `EIGENVALUE  ε_nl of ${atom(Z).symbol} · ${S.model} · E = ${S.E.toFixed(5)} Eh  (ε is NOT an ionisation energy: use the Δ-SCF)` };
}
export const clearAtomCache = () => { CACHE.clear(); RADIAL_REC.clear(); };
export { HARTREE_EV };
