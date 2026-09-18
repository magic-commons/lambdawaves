/* chem-sweep.test.mjs — THE 2026-09-18 PREPARATION REWRITE, held to the road it replaced.
 *
 *   node tests/chem-sweep.test.mjs
 *
 * WHAT IS COMPARED.  For every molecule swept, the RPA spectrum is computed TWICE from the same converged RHF
 * reference: once by the shipped road (Cholesky reduction, Householder–QL — JUDGMENT.md Proposition 3) and once by
 * `{ route: 'halves', solver: 'jacobi' }`, which is the 2026-09-11 arithmetic that shipped before it — M =
 * (A−B)^{1/2}(A+B)(A−B)^{1/2} through three cyclic-Jacobi diagonalisations.  Every ω and every f must agree to
 * 1e-10.  The one thing the reference does NOT reproduce bit for bit is the AO→MO transform: A and B are now built
 * from three quarter transforms restricted to the occupied and virtual ranges (lab/rpa-inspector.js
 * `hessianBlocks`, shared with the stability Hessian) instead of the full n⁴ tensor, so the two roads differ at
 * round-off in the MATRICES as well as in the eigensolver.  The measured agreement below is over both.
 *
 * The ground-state energies are held to the INDEPENDENT oracle, PySCF 2.14.0 in lab/oracles/sto-3g-v1.json, at
 * molecules.test.mjs's own scaled tolerance max(1e-9, 3e-12·|E|) — a stronger statement than old-versus-new, since
 * the eigensolver dispatch touches every Fock diagonalisation in the SCF.
 *
 * WHAT IS SWEPT: every enabled entry of lab/molecules.js at 14 Cartesian AOs or fewer (the set
 * tests/molecules.test.mjs runs energies for), plus C₂H₄ and C₆H₆ — benzene being the cap the card is built
 * around and the only molecule where the two roads differ by seconds rather than milliseconds.  The two REFUSED
 * entries, CuH and ZnH₂, are checked to be refused still, by the Cholesky verdict and by the RPA itself.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { moleculeRHF, registerRecord, stabilityHessian } from '../lab/rhf-molecule.js';
import { rpa } from '../lab/rpa-inspector.js';
import { MOLECULES, MOLECULE_BY_ID, moleculeAtoms, moleculeCharge } from '../lab/molecules.js';
import { chemGround, chemSpectrum, chemSolve, chemRootVectors, chemRegister } from '../lab/mathworker.js';

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
registerRecord('sto-3g', read('../lab/vendor/bse/sto-3g-v1.json'));
const LIB = read('../lab/oracles/sto-3g-v1.json').library;
const tolOf = (E) => Math.max(1e-9, 3e-12 * Math.abs(E));
let fails = 0, checks = 0;
const judge = (ok, what, detail) => { checks++; if (ok) console.log('GREEN ' + what); else { fails++; console.log('RED   ' + what + '\n      ' + JSON.stringify(detail)); } };
const clock = (fn) => { const t = performance.now(), value = fn(); return { value, ms: performance.now() - t }; };

const SWEPT = [...MOLECULES.filter((m) => !m.disabled && m.nAO <= 14).map((m) => m.id), 'C2H4', 'C6H6'];
const rows = [], timings = {};
let worstE = 0, worstEid = '', worstW = 0, worstWid = '', worstF = 0, worstFid = '', worstNorm = 0, worstSum = 0;
let totalRoots = 0;
for (const id of SWEPT) {
  const atoms = moleculeAtoms(id), charge = moleculeCharge(id), o = LIB[id];
  const g = clock(() => moleculeRHF({ atoms, basis: 'sto-3g', charge }));
  const sol = g.value, I = sol.integrals;
  const args = { S: I.S, h: I.h, eri: I.eri, X: I.X, Y: I.Y, Z: I.Z, C: sol.C, eps: sol.orbitalEnergies, nocc: sol.nocc };
  const now = clock(() => rpa(args));
  const ref = clock(() => rpa({ ...args, route: 'halves', solver: 'jacobi' }));
  const A = now.value.roots, B = ref.value.roots;
  assert.equal(A.length, B.length, `${id}: the two roads found the same number of roots`);
  let dw = 0, df = 0, norm = 0;
  for (let k = 0; k < A.length; k++) {
    dw = Math.max(dw, Math.abs(A[k].omega - B[k].omega));
    df = Math.max(df, Math.abs(A[k].f - B[k].f));
    let xx = 0, yy = 0; for (let p = 0; p < A[k].X.length; p++) { xx += A[k].X[p] ** 2; yy += A[k].Y[p] ** 2; }
    norm = Math.max(norm, Math.abs(xx - yy - 1));                            // XᵀX − YᵀY = 1, the paired normalisation
  }
  /* the f-sum over a DEGENERATE cluster is basis-free even where one root of the cluster need not be, so it is
     reported beside the per-root figure rather than instead of it */
  let sumDiff = 0;
  for (let k = 0; k < A.length;) {
    let j = k, sa = 0, sb = 0;
    while (j < A.length && Math.abs(A[j].omega - A[k].omega) < 1e-9) { sa += A[j].f; sb += B[j].f; j++; }
    sumDiff = Math.max(sumDiff, Math.abs(sa - sb)); k = j;
  }
  const dE = Math.abs(sol.energy - o.energy);
  assert.ok(dE <= tolOf(o.energy), `${id}: RHF energy ${sol.energy} against PySCF ${o.energy} (Δ ${dE.toExponential(2)})`);
  assert.ok(sol.stability.hessian.minimum, `${id}: the Cholesky verdict says the reference is a minimum`);
  assert.ok(sol.stability.hessian.lowestApB > 0 && sol.stability.hessian.lowestAmB > 0, `${id}: and both lowest eigenvalues are positive`);
  if (dE > worstE) { worstE = dE; worstEid = id; }
  if (dw > worstW) { worstW = dw; worstWid = id; }
  if (df > worstF) { worstF = df; worstFid = id; }
  worstNorm = Math.max(worstNorm, norm); worstSum = Math.max(worstSum, sumDiff); totalRoots += A.length;
  timings[id] = { ground: +g.ms.toFixed(1), rpa: +now.ms.toFixed(1), reference: +ref.ms.toFixed(1) };
  rows.push(`${id} ${A.length}r Δω ${dw.toExponential(1)} Δf ${df.toExponential(1)} ${Math.round(g.ms)}+${Math.round(now.ms)} ms (ref ${Math.round(ref.ms)})`);
}
judge(worstE < 1e-9 && worstW < 1e-10 && worstF < 1e-10 && worstNorm < 1e-9,
  `${SWEPT.length} molecules, ${totalRoots} RPA roots: the Cholesky/QL road and the 2026-09-11 halves/Jacobi road agree to`
  + ` ${worstW.toExponential(2)} in ω (${worstWid}) and ${worstF.toExponential(2)} in f (${worstFid}); degenerate-cluster f sums to`
  + ` ${worstSum.toExponential(2)}; XᵀX − YᵀY = 1 to ${worstNorm.toExponential(2)}; every ground energy within`
  + ` ${worstE.toExponential(2)} of PySCF (${worstEid})`, rows);
console.log('      ' + rows.join(' · '));
judge(true, `benzene, this run: ground ${timings.C6H6.ground} ms, RPA ${timings.C6H6.rpa} ms (the halves/Jacobi reference for the same`
  + ` spectrum: ${timings.C6H6.reference} ms)`, timings.C6H6);

/* THE TWO REFUSALS.  CuH and ZnH₂ converge — when they converge at all — to a clean aufbau solution that is NOT a
 * minimum; lab/molecules.js disables them and the RPA cannot answer for them.  What is LAW here is A − B ≺ 0 and
 * the refusal it forces, on whatever point the SCF reaches, by BOTH roads.
 *
 * WHY THE VALUES ARE NOT GATED against lab/molecules.js's table (measured 2026-09-12, before the eigensolver
 * dispatch).  On these two the RHF fixed point is a saddle, and whether a fixed-point iteration sticks to a saddle
 * is decided by round-off: with the cyclic Jacobi the SCF settled in 26 (CuH) and 28 (ZnH₂) cycles at the table's
 * numbers, and with Householder–QL it wanders for all 200 — E = −1620.955894746 against the table's
 * −1620.944903679, where PySCF's own run did not converge either.  The isolation is in
 * research/molecular-waves-2026-09-18/scratch/probe-old-two.mjs: the SHIPPED code with nothing changed but the
 * eigensolver reproduces the new landing point to every digit.  Every one of the 52 ENABLED entries converges and
 * matches PySCF (scratch/sweep-all.json), so the difference lives only where the reference is not a minimum. */
{
  const detail = {};
  let ok = true;
  for (const id of ['CuH', 'ZnH2']) {
    const m = MOLECULE_BY_ID.get(id), atoms = moleculeAtoms(id);
    const sol = moleculeRHF({ atoms, basis: 'sto-3g', charge: moleculeCharge(id), detect: false, stability: false, hessian: false });
    const H = stabilityHessian(sol.integrals, sol, sol.nocc);
    const I = sol.integrals;
    const args = { S: I.S, h: I.h, eri: I.eri, X: I.X, Y: I.Y, Z: I.Z, C: sol.C, eps: sol.orbitalEnergies, nocc: sol.nocc };
    let threwNew = null, threwRef = null;
    try { rpa(args); } catch (e) { threwNew = e.message; }
    try { rpa({ ...args, route: 'halves', solver: 'jacobi' }); } catch (e) { threwRef = e.message; }
    const good = H.minimum === false && H.positiveDefinite.AmB === false && H.lowestAmB < -1e-3
      && m.disabled && /not a minimum/.test(m.reason)
      && /not positive definite/.test(threwNew || '') && /not positive definite/.test(threwRef || '');
    ok = ok && good;
    detail[id] = { energy: sol.energy, converged: sol.converged, iterations: sol.iterations,
      lowestApB: H.lowestApB, lowestAmB: H.lowestAmB, table: m.instability, threwNew, threwRef };
  }
  judge(ok, 'CuH and ZnH₂ are still refused: the A − B Cholesky fails on both, the lowest A − B eigenvalue is'
    + ` ${detail.CuH.lowestAmB.toFixed(6)} and ${detail.ZnH2.lowestAmB.toFixed(6)}, both RPA roads refuse them by the same sentence,`
    + ' and the library still disables them by name', detail);
  console.log('      ' + JSON.stringify(detail));
}

/* THE TDA LADDER IS NOT THE RPA LADDER'S PARTNER LIST — the finding behind the 0d fix, pinned here so the two
   ladders may never again be read off against each other by index. */
{
  const atoms = moleculeAtoms('C6H6');
  const sol = moleculeRHF({ atoms, basis: 'sto-3g', charge: 0, detect: false, stability: false, hessian: false });
  const I = sol.integrals;
  const R = rpa({ S: I.S, h: I.h, eri: I.eri, X: I.X, Y: I.Y, Z: I.Z, C: sol.C, eps: sol.orbitalEnergies, nocc: sol.nocc });
  const rpaBright = R.roots.map((r, k) => [k, r.omega, r.f]).filter(([, , f]) => f > 0.5).slice(0, 2);
  const tdaBright = R.tda.map((r, k) => [k, r.omega, r.f]).filter(([, , f]) => f > 0.5).slice(0, 2);
  const ascending = R.tda.every((r, k) => k === 0 || r.omega >= R.tda[k - 1].omega);
  const sameIndex = rpaBright.length && tdaBright.length && rpaBright[0][0] === tdaBright[0][0];
  const perIndex = R.roots.map((r, k) => Math.abs(r.omegaTDA - R.tda[k].omega)).reduce((a, b) => Math.max(a, b), 0);
  judge(ascending && !sameIndex && perIndex === 0,
    `benzene: the first bright RPA root is index ${rpaBright[0][0]} (ω ${rpaBright[0][1].toFixed(6)}, f ${rpaBright[0][2].toFixed(4)}) and the first`
    + ` bright TDA root is index ${tdaBright[0][0]} (ω ${tdaBright[0][1].toFixed(6)}, f ${tdaBright[0][2].toFixed(4)}) — the ladders cross, so`
    + ` roots[k].omegaTDA is the k-th TDA root BY INDEX (it equals tda[k].omega exactly) and never root k's partner`,
    { rpaBright, tdaBright, ascending, perIndexDifference: perIndex });
}

/* THE STAGED WORKER REPLY (2026-09-18).  chem.solve used to answer only after the RPA; the ground state is now
   publishable on its own, about a second earlier for benzene, and the spectrum follows.  The ops are exported
   pure functions, so the contract is gated here rather than by racing a browser: chem.ground carries the ground
   state and NO roots, chem.spectrum carries the roots and the TDA ladder, chem.solve is unchanged and carries
   both, and the full X, Y and TDA vectors stay inside the worker where chemRootVectors can reach them. */
{
  const atoms = moleculeAtoms('H2O'), basis = 'sto-3g', charge = 0;
  const record = read('../lab/vendor/bse/sto-3g-v1.json');
  chemRegister(basis, record);
  const t0 = performance.now(), ground = chemGround({ atoms, basis, charge }), tGround = performance.now() - t0;
  const t1 = performance.now(), spec = chemSpectrum({ atoms, basis, charge }), tSpec = performance.now() - t1;
  const full = chemSolve({ atoms, basis, charge });
  const vec = chemRootVectors(0);
  const groundKeys = ['energy', 'Enuc', 'nocc', 'nAO', 'hash', 'eps', 'C', 'D', 'shells', 'stability', 'solutions', 'timings'];
  const ok = ground.stage === 'ground' && !ground.roots && groundKeys.every((k) => ground[k] !== undefined)
    && spec.stage === 'spectrum' && spec.roots.length === 10 && spec.tda.length === 10
    && full.stage === 'full' && full.roots.length === 10 && full.tda.length === 10
    && Math.abs(full.energy - ground.energy) === 0 && Math.abs(full.roots[0].omega - spec.roots[0].omega) === 0
    && ground.timings.rpa === null && Number.isFinite(ground.timings.integrals) && Number.isFinite(full.timings.rpa)
    && vec.X.length === 10 && vec.Y.length === 10 && vec.XTDA.length === 10
    && ground.stability.hessian.minimum === true && ground.stability.hessian.lowestApB === null;
  judge(ok, `the worker stages: chem.ground answers in ${tGround.toFixed(0)} ms with the ground state and no roots, chem.spectrum adds`
    + ` ${spec.roots.length} RPA roots and ${spec.tda.length} TDA roots in ${tSpec.toFixed(0)} ms, chem.solve still answers whole, the X/Y/TDA`
    + ' vectors stay in the worker (chemRootVectors), and a minimum ships its Cholesky verdict without the two eigensolves',
    { stages: [ground.stage, spec.stage, full.stage], groundHasRoots: !!ground.roots, timings: full.timings,
      hessianOnTheWire: ground.stability.hessian, vectors: { X: vec.X.length, Y: vec.Y.length, XTDA: vec.XTDA.length } });
}

console.log(`\nGREEN chem-sweep.test — ${fails} failing of ${checks}`);
process.exit(fails ? 1 : 0);
