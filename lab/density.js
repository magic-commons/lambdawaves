/* density.js — one-particle density-matrix propagation in the Löwdin frame, PORT 2 of the ChronusQ map
 * (research/chronusq-2026-09-11/A §7; Williams-Young et al. 2020 Eqs. 10–15).  Atomic units.
 * STATUS: DERIVED-HERE from i dc̃/dt = F̃ c̃; KNOWN integrators (Magnus-2 predictor–corrector, MMUT); gated by
 * tests/density.test.mjs against modrive.js (N = 1), the RPA closed form (N = 2), and the invariants below.
 *
 * Frame.  S the AO overlap, X = S^{−1/2}, W = S^{1/2}.  AO density D = Σ_k f_k c_k c_k†, N_e = Tr(DS).
 *     P = W D W ,   F̃ = X F X ,   D = X P X ,   i dP/dt = [F̃, P] .
 * Step.  P(t+Δt) = U P(t) U†, U = exp(−iΔt F̃) = V e^{−iΔt w} V† by one Hermitian diagonalisation of F̃.  A unitary
 * similarity preserves the spectrum of P, hence Tr P and the idempotency (P/f)² = P/f EXACTLY: a drift of Tr(DS)
 * is a defect of S^{±1/2}, never of the integrator.  Magnus-2 predictor–corrector for F = F[P]:
 *     F₀ = F̃[P(t), t] ;  P* = e^{−iΔtF₀} P e^{+iΔtF₀} ;  F₁ = F̃[P*, t+Δt] ;  F̄ = ½(F₀+F₁) ;  P(t+Δt) = e^{−iΔtF̄} P(t) e^{+iΔtF̄}
 * from the SAVED P(t).  MMUT: P(t+Δt) = U(t) P(t−Δt) U(t)†, U(t) = exp(−2iΔt F̃(t)), restarted with a Magnus-2 step.
 * A unitary step has no stability limit, so a too-large Δt fails silently and perfectly normalised: the only honest
 * convergence statement is that halving Δt shrinks the change of the dipole trace by ≥ 4 (local error O(Δt³‖[F,F′]‖)).
 * Complex matrices are { re, im, n } row-major; a Hermitian eigenproblem is solved by the real symmetric
 * realification [[A, −B], [B, A]] of A + iB, whose 2n eigenpairs (u; v) ↔ u + iv give each eigenvalue twice.
 * For one electron the Fock matrix has no P dependence and this is exactly modrive.js's exponential midpoint.
 */
import { eigSym } from './h2ci.js';

/* ── complex matrices ────────────────────────────────────────────────────────────────────────────────────────────── */
export const cmat = (n) => ({ re: new Float64Array(n * n), im: new Float64Array(n * n), n });
export const creal = (A, n) => ({ re: Float64Array.from(A), im: new Float64Array(n * n), n });
export function cmul(A, B) {
  const n = A.n, C = cmat(n);
  for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) {
    const ar = A.re[i * n + k], ai = A.im[i * n + k]; if (ar === 0 && ai === 0) continue;
    for (let j = 0; j < n; j++) { const br = B.re[k * n + j], bi = B.im[k * n + j]; C.re[i * n + j] += ar * br - ai * bi; C.im[i * n + j] += ar * bi + ai * br; }
  }
  return C;
}
export function cadj(A) { const n = A.n, C = cmat(n); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { C.re[j * n + i] = A.re[i * n + j]; C.im[j * n + i] = -A.im[i * n + j]; } return C; }
export const ctrace = (A) => { let re = 0, im = 0; for (let i = 0; i < A.n; i++) { re += A.re[i * A.n + i]; im += A.im[i * A.n + i]; } return { re, im }; };
/** X A X for real symmetric X (the Löwdin transforms) */
export function sandwich(X, A) {
  const n = A.n, T = cmat(n), C = cmat(n);
  for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { const x = X[i * n + k]; if (x === 0) continue; for (let j = 0; j < n; j++) { T.re[i * n + j] += x * A.re[k * n + j]; T.im[i * n + j] += x * A.im[k * n + j]; } }
  for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { const tr = T.re[i * n + k], ti = T.im[i * n + k]; if (tr === 0 && ti === 0) continue; for (let j = 0; j < n; j++) { const x = X[k * n + j]; C.re[i * n + j] += tr * x; C.im[i * n + j] += ti * x; } }
  return C;
}

/**
 * eigenpairs of a Hermitian matrix, ascending; V has the eigenvectors as columns (V[i*n+k]).
 *
 * THE REALIFICATION GIVES EVERY EIGENVALUE TWICE, and picking n independent COMPLEX vectors out of the 2n real
 * ones is the whole difficulty.  A real eigenvector (u; v) of [[A,−B],[B,A]] is the complex z = u + iv, and so is
 * (−v; u) — the same z times i.  Inside a cluster of 2p real vectors the p complex directions have to be sieved
 * out, and a greedy sweep that takes them in the solver's own order and drops anything whose residual falls below
 * a fixed floor DOES NOT WORK: which real basis the eigensolver returns for a degenerate cluster is arbitrary, and
 * a residual of 1e-5 — above the floor, far below a real direction — is normalised into a vector that is not
 * orthogonal to the ones already kept.  MEASURED on benzene/STO-3G, where symmetry gives twelve exactly degenerate
 * pairs in the Löwdin Fock: the old sweep returned V with ‖V†V − I‖ = 9.7e-8 on the kicked Fock and 1.5 on the
 * Magnus-2 average, so U = V e^{−iΔtw} V† was not unitary and one Magnus-2 step took the idempotency defect to
 * 6.8 — the shipped card's benzene run was losing the determinant on its first step.
 *
 * WHAT IS DONE INSTEAD: the cluster is taken whole, and its complex directions are chosen BY PIVOTING — at each
 * turn the remaining candidate with the LARGEST residual against what is already kept, orthogonalised twice
 * (Kahan's "twice is enough"), and a residual below 0.1 is a REFUSAL rather than a vector.  This is independent of
 * which orthonormal basis the real eigensolver happened to return for the cluster, which is what makes the answer
 * the same for cyclic Jacobi and for Householder–QL.
 */
export function hermitianEigen(A) {
  const n = A.n, m = 2 * n, R = new Float64Array(m * m);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const a = A.re[i * n + j], b = A.im[i * n + j];
    R[i * m + j] = a; R[(i + n) * m + (j + n)] = a; R[i * m + (j + n)] = -b; R[(i + n) * m + j] = b;
  }
  const e = eigSym(R, m), V = cmat(n), w = new Float64Array(n);
  let scale = 0; for (let k = 0; k < m; k++) scale = Math.max(scale, Math.abs(e.values[k]));
  const tol = 1e-9 * Math.max(scale, 1);
  /** z ← z − Σ_q ⟨q, z⟩ q over an orthonormal complex set, twice, returning the residual norm */
  const project = (zr, zi, basis) => {
    for (let pass = 0; pass < 2; pass++) for (const q of basis) {
      let pr = 0, pi = 0;
      for (let i = 0; i < n; i++) { pr += q.zr[i] * zr[i] + q.zi[i] * zi[i]; pi += q.zr[i] * zi[i] - q.zi[i] * zr[i]; }
      for (let i = 0; i < n; i++) { zr[i] -= pr * q.zr[i] - pi * q.zi[i]; zi[i] -= pr * q.zi[i] + pi * q.zr[i]; }
    }
    let nrm = 0; for (let i = 0; i < n; i++) nrm += zr[i] ** 2 + zi[i] ** 2;
    return Math.sqrt(nrm);
  };
  /* THE PROJECTION IS AGAINST EVERYTHING KEPT, not only against the current cluster.  Two vectors from different
     clusters are orthogonal only if they are exact eigenvectors of different eigenvalues, and a nearly degenerate
     pair that the tolerance cuts in half is precisely the case where they are not: over 400 MMUT steps on benzene
     that left ‖V†V − I‖ big enough to take the idempotency defect to 1.9e-8.  Orthogonalising globally costs one
     n³ pass and makes V unitary by construction at every step, whatever the clustering did. */
  const kept4 = [];
  let kept = 0;
  for (let k = 0; k < m;) {
    let j = k; while (j < m && e.values[j] - e.values[k] <= tol) j++;          // the cluster [k, j), an anchor apart
    const want = Math.round((j - k) / 2), cand = [];
    for (let c = k; c < j; c++) {
      const zr = new Float64Array(n), zi = new Float64Array(n);
      for (let i = 0; i < n; i++) { zr[i] = e.vectors[i * m + c]; zi[i] = e.vectors[(i + n) * m + c]; }
      cand.push({ zr, zi, live: true });
    }
    const basis = [];
    for (let t = 0; t < want && kept + basis.length < n; t++) {
      let best = -1, bestNorm = 0, bz = null;
      for (let c = 0; c < cand.length; c++) {
        if (!cand[c].live) continue;
        const zr = Float64Array.from(cand[c].zr), zi = Float64Array.from(cand[c].zi);
        const nrm = project(zr, zi, kept4.concat(basis));
        if (nrm > bestNorm) { bestNorm = nrm; best = c; bz = { zr, zi }; }
      }
      if (best < 0 || bestNorm < 0.1) break;                                  // no independent direction left here
      cand[best].live = false;
      for (let i = 0; i < n; i++) { bz.zr[i] /= bestNorm; bz.zi[i] /= bestNorm; }
      basis.push(bz);
    }
    /* each kept vector carries the MEAN of its own conjugate pair; inside a cluster the values agree to `tol` */
    basis.forEach((q, t) => {
      if (kept >= n) return;
      const a = e.values[Math.min(j - 1, k + 2 * t)], b = e.values[Math.min(j - 1, k + 2 * t + 1)];
      w[kept] = 0.5 * (a + b);
      for (let i = 0; i < n; i++) { V.re[i * n + kept] = q.zr[i]; V.im[i * n + kept] = q.zi[i]; }
      kept4.push(q); kept++;
    });
    k = j;
  }
  if (kept !== n) throw new Error(`density: Hermitian eigenproblem yielded ${kept} independent vectors, not ${n}`);
  return { w, V };
}

/** the Löwdin roots of a real symmetric positive metric: X = S^{−1/2}, W = S^{1/2} */
export function loewdin(S, n) {
  const e = eigSym(S, n), X = new Float64Array(n * n), W = new Float64Array(n * n);
  if (e.values[0] <= 0) throw new Error('density: metric is not positive definite');
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let x = 0, w = 0;
    for (let k = 0; k < n; k++) { const v = e.vectors[i * n + k] * e.vectors[j * n + k]; x += v / Math.sqrt(e.values[k]); w += v * Math.sqrt(e.values[k]); }
    X[i * n + j] = x; W[i * n + j] = w; }
  return { X, W, eigenvalues: e.values };
}

/** U = exp(−i dt F̃) for Hermitian F̃ */
export function unitaryOf(Ft, dt) {
  const n = Ft.n, { w, V } = hermitianEigen(Ft), U = cmat(n), Vd = cadj(V), D = cmat(n);
  for (let k = 0; k < n; k++) { const ph = -dt * w[k]; D.re[k * n + k] = Math.cos(ph); D.im[k * n + k] = Math.sin(ph); }
  const VD = cmul(V, D), R = cmul(VD, Vd);
  U.re.set(R.re); U.im.set(R.im); return U;
}
/** U P U† */
export const similarity = (U, P) => cmul(cmul(U, P), cadj(U));

/** one Magnus-2 predictor–corrector step; fock(P, t) → F̃ (Löwdin frame, Hermitian) */
export function magnus2({ P, t, dt, fock }) {
  const F0 = fock(P, t), U0 = unitaryOf(F0, dt), Pstar = similarity(U0, P);
  const F1 = fock(Pstar, t + dt), Fbar = cmat(P.n);
  for (let k = 0; k < P.n * P.n; k++) { Fbar.re[k] = 0.5 * (F0.re[k] + F1.re[k]); Fbar.im[k] = 0.5 * (F0.im[k] + F1.im[k]); }
  return { P: similarity(unitaryOf(Fbar, dt), P), F0, F1, Fbar };
}
/** one MMUT step from P(t−Δt) through F̃(t) to P(t+Δt) */
export const mmut = ({ Pprev, Fnow, dt }) => similarity(unitaryOf(Fnow, 2 * dt), Pprev);

/* ── diagnostics (report, never repair silently) ────────────────────────────────────────────────────────────────── */
/** max |Q² − Q| with Q = P/f — zero for an idempotent single determinant */
export function idempotencyDefect(P, f = 2) {
  const n = P.n, Q = cmat(n); for (let k = 0; k < n * n; k++) { Q.re[k] = P.re[k] / f; Q.im[k] = P.im[k] / f; }
  const Q2 = cmul(Q, Q); let d = 0;
  for (let k = 0; k < n * n; k++) d = Math.max(d, Math.hypot(Q2.re[k] - Q.re[k], Q2.im[k] - Q.im[k]));
  return d;
}
/** McWeeny purification f(3Q² − 2Q³), Q = P/f — an explicitly labelled REPAIR; the caller must say it was used */
export function purify(P, f = 2) {
  const n = P.n, Q = cmat(n); for (let k = 0; k < n * n; k++) { Q.re[k] = P.re[k] / f; Q.im[k] = P.im[k] / f; }
  const Q2 = cmul(Q, Q), Q3 = cmul(Q2, Q), R = cmat(n);
  for (let k = 0; k < n * n; k++) { R.re[k] = f * (3 * Q2.re[k] - 2 * Q3.re[k]); R.im[k] = f * (3 * Q2.im[k] - 2 * Q3.im[k]); }
  return R;
}

/* ── the field shapes ChronusQ documents (RT wiki): κ·f(t) between t_on and t_off ─────────────────────────────── */
export function fieldOf({ shape = 'step', kappa = 0, omega = 0, tOn = 0, tOff = Infinity, alpha = 1, phase = 0 } = {}) {
  const f = { step: () => 1, ramp: (u) => u, wave: (u) => Math.cos(omega * u + phase), gaussian: (u) => Math.exp(-alpha * u * u) }[shape];
  if (!f) throw new Error('density: unknown field shape ' + shape);
  return (t) => (t < tOn || t >= tOff) ? 0 : kappa * f(t - tOn);
}

/**
 * createRTHF({ n, S, h, eri, Z, Enuc, nuclearDipole, nElectrons, D0, field, dt, integrator, restartEvery })
 * `restartEvery`: MMUT steps between Magnus-2 restarts; 0 or null is the UNRESTARTED leapfrog.  The default stays
 * 50 — node tests and the ledger's measurements were taken at it — and the card asks for 0, which is what it says.
 * Real-time restricted Hartree–Fock (or one-electron exact dynamics when nElectrons = 1) in the length gauge,
 * H'(t) = +E(t) ẑ per electron (λWAVES's convention, the one modrive.js and the ChronusQ papers use).
 * D0: the initial real AO density (spin-summed), e.g. scf.js's rhf().D.  Returns { step, observables, t, P, D }.
 */
export function createRTHF({ n, S, h, eri = null, Z = null, mu = null, Enuc = 0, nuclearDipole = 0, nElectrons, D0, field = () => 0, dt = 0.05, integrator = 'magnus2', restartEvery = 50 } = {}) {
  const D0c = D0 && D0.re ? D0 : (D0 && D0.length === n * n ? creal(D0, n) : null);
  if (!D0c || D0c.re.length !== n * n) throw new Error('rthf: D0 (n×n density, real or { re, im }) required');
  /* THE RESTART POLICY, IN ONE PLACE.  0 and null both mean NEVER RESTART — SYNTHESIS decision 2's unrestarted
     MMUT, which is what the CHEMISTRY card runs.  It cannot be spelled `Infinity` on the wire (JSON drops it, and
     `Infinity | 0` is 0), and 0 read literally would make `sinceRestart < restartEvery` false forever and take the
     Magnus-2 branch every step — the exact opposite of what it says.  So the wire value is normalised HERE and
     nowhere else, and `policy` below is what the engine is actually doing. */
  const restart = (restartEvery === null || restartEvery === 0) ? Infinity : Math.max(1, restartEvery | 0);
  const policy = restart === Infinity ? 'unrestarted' : `restart every ${restart}`;
  const twoElectron = nElectrons > 1 && !!eri, f = nElectrons === 1 ? 1 : 2;
  const { X, W } = loewdin(S, n);
  let P = sandwich(W, D0c), t = 0, steps = 0, Pprev = null, sinceRestart = 0, lastMagnus = null;
  const Zt = Z ? sandwich(X, creal(Z, n)) : null;
  /** the δ-kick exp(−iκ ẑ) applied to the density: P ← U P U†, U = exp(−iκ Z̃) — exact, idempotency-preserving */
  function kick(kappa) {
    if (!Zt) throw new Error('rthf: no dipole matrix to kick with');
    P = similarity(unitaryOf(Zt, kappa), P); Pprev = null; sinceRestart = 0; return self;
  }
  /* ── THE OTHER TWO AXES.  `Z` alone kicks along z, which is the shipped path and the only one the length-gauge
     field drives; `mu: [X, Y, Z]` (lab/md.js's three dipole matrices) adds x and y, each carried into the Löwdin
     frame once and cached, so a three-polarisation absorption run pays one transform per axis it actually uses. */
  const AXIS = { x: 0, y: 1, z: 2 }, muAO = mu || (Z ? [null, null, Z] : null), muL = [null, null, Zt];
  const axisOf = (a) => { const q = typeof a === 'number' ? a : AXIS[a];
    if (q !== 0 && q !== 1 && q !== 2) throw new Error("rthf: axis must be 'x', 'y' or 'z'"); return q; };
  const muFrame = (q) => { if (!muL[q]) {
    if (!muAO || !muAO[q]) throw new Error(`rthf: no dipole matrix for axis ${'xyz'[q]} — pass mu: [X, Y, Z]`);
    muL[q] = sandwich(X, creal(muAO[q], n)); } return muL[q]; };
  /** the δ-kick exp(−iκ q̂) along ONE axis: P ← U P U†, U = exp(−iκ μ̃_q) — exact, idempotency-preserving */
  function kickAlong(axis, kappa) { const q = axisOf(axis);
    P = similarity(unitaryOf(muFrame(q), kappa), P); Pprev = null; sinceRestart = 0; return self; }
  /** the ELECTRON dipole along one axis, −Tr(D M_q) — the sign convention observables().electronDipole uses */
  function dipoleAlong(axis) {
    const q = axisOf(axis), M = muAO && muAO[q];
    if (!M) throw new Error(`rthf: no dipole matrix for axis ${'xyz'[q]}`);
    const D = sandwich(X, P); let s = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) s += D.re[j * n + i] * M[i * n + j];
    return -s;
  }
  const fockAO = (D, time) => {
    const F = cmat(n), E = field(time);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      let fr = h[i * n + j] + (Z ? E * Z[i * n + j] : 0), fi = 0;
      /* F_μν = h_μν + Σ_λσ P_λσ [ (μν|σλ) − ½ (μλ|σν) ]  (Szabo–Ostlund 3.154).  The exchange pairs P_λσ with (μλ|σν):
         for a COMPLEX density the index order matters — pairing (il|kj) with D_kl instead of D_lk conjugates the
         exchange, keeps every real SCF right, and moves the RT linear-response peak from ω_RPA to
         √((Δε+K)² − (2K−J)²).  Caught by the PySCF TDHF oracle in tests/density.test.mjs. */
      if (twoElectron) for (let k = 0; k < n; k++) for (let l = 0; l < n; l++) {
        const J = eri[((i * n + j) * n + k) * n + l], K = 0.5 * eri[((i * n + l) * n + k) * n + j];
        fr += D.re[k * n + l] * J - D.re[l * n + k] * K; fi += D.im[k * n + l] * J - D.im[l * n + k] * K;
      }
      F.re[i * n + j] = fr; F.im[i * n + j] = fi;
    }
    return F;
  };
  const fockL = (Pm, time) => sandwich(X, fockAO(sandwich(X, Pm), time));
  function step(h_ = dt) {
    if (!Number.isFinite(h_) || h_ === 0) return self;
    if (integrator === 'mmut' && Pprev && sinceRestart < restart) {
      const Fnow = fockL(P, t), Pnext = mmut({ Pprev, Fnow, dt: h_ });
      Pprev = P; P = Pnext; sinceRestart++;
    } else {
      const r = magnus2({ P, t, dt: h_, fock: fockL });
      Pprev = P; P = r.P; lastMagnus = r; sinceRestart = 0;
    }
    t += h_; steps++; return self;
  }
  function observables() {
    const D = sandwich(X, P), F0 = fockAO(D, -Infinity);                     // field(−∞) = 0 for every shape
    let electronic = 0, z = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      electronic += 0.5 * (D.re[j * n + i] * (h[i * n + j] + F0.re[i * n + j]) - D.im[j * n + i] * F0.im[i * n + j]);
      if (Z) z += D.re[j * n + i] * Z[i * n + j];
    }
    if (!twoElectron) electronic = 0, ((() => { for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) electronic += D.re[j * n + i] * h[i * n + j]; })());
    const E = field(t), tr = ctrace(P), electronDipole = -z, totalDipole = nuclearDipole + electronDipole;
    return { t, steps, electrons: tr.re, electronsIm: tr.im, idempotency: idempotencyDefect(P, f), electronic,
      fieldFreeTotal: electronic + Enuc, instantaneousTotal: electronic + Enuc - E * totalDipole,
      field: E, z, electronDipole, totalDipole, restartPolicy: policy, sinceRestart };
  }
  const self = { step, kick, kickAlong, dipoleAlong, observables, get t() { return t; }, get P() { return { re: Float64Array.from(P.re), im: Float64Array.from(P.im), n }; },
    get Pprev() { return Pprev ? { re: Float64Array.from(Pprev.re), im: Float64Array.from(Pprev.im), n } : null; },
    get restartEvery() { return restart === Infinity ? 0 : restart; }, get restartPolicy() { return policy; }, get sinceRestart() { return sinceRestart; },
    get D() { return sandwich(X, P); }, X, W, model: `${nElectrons === 1 ? 'one electron, exact' : 'RT-RHF'}; length gauge; ${integrator} (${policy}); Löwdin frame` };
  return self;
}
