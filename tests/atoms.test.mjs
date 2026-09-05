/* tests/atoms.test.mjs — the node proof of W-ATOMS: the central-field Xα(2/3) + Latter-tail periodic table.
 *   node tests/atoms.test.mjs
 * Oracles, in order of authority:
 *   KNOWN, cited — the hydrogenic spectrum −Z²/2n² (the eigensolver is certified against it through the public API);
 *     the Hartree–Fock limits He −2.8616800 / ε −0.9179559 / ⟨r⟩ 0.9273, Ne −128.54710, Ar −526.81751; the exact
 *     He −2.90372; the measured Ne 2p IP 21.5645 eV and δ_s(Na) = 1.3730 from spectra.
 *   PORTED — Opus Q2 of the FIELDS AND MOLECULES round (research/probes-fields/opus-q2-atoms.py, uniform mesh +
 *     scipy tridiagonal eigensolve + Richardson), re-run here for every number this file judges.  lab/atoms.js is an
 *     independent implementation (log mesh, own Sturm bisection + inverse iteration, Anderson mixing), so agreement
 *     with it is a two-implementation check, not a restatement.
 *   THE LEDGER — research/MATH-FIELDS-AND-MOLECULES-2026-09-04.md, SYNTHESIS W-ATOMS (lines 632–689) for the gates.
 * Two of the SYNTHESIS's own gate numbers are judged as the ledger states them AND corrected where the ledger is
 * internally inconsistent — see NA and SC below.  Nothing here asserts the 3d/4s order.
 */
import { ATOMS, atom, solveAtom, ionisation, quantumDefect, atomRadialTable, atomEnergyOf, shellEnergyOf,
  virtualEnergyOf, virtualOrbital, atomRadial, rowOf, NR, ROWS, EXCHANGE_MODEL, clearAtomCache, HARTREE_EV } from '../lab/atoms.js';

let FAILED = 0, TOTAL = 0;
const T0 = Date.now();
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 400)));
}
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const f5 = (x) => +x.toFixed(5);
/** ∫ f dr on the returned log mesh, by a Simpson written here and not in the module */
function quad(r, f) {
  const n = r.length, dx = Math.log(r[1] / r[0]);
  let s = f(0) * r[0] + f(n - 1) * r[n - 1];
  for (let j = 1; j < n - 1; j++) s += (j % 2 ? 4 : 2) * f(j) * r[j];
  return s * dx / 3;
}

/* ══ 0. the eigensolver, certified on the one spectrum that is exact ═══════════════════════════════════════ */
{
  /* a ONE-electron ion, self-interaction removed, no tail: the potential is exactly −Z/r, so ε must be −Z²/2n².
     This goes through the public API — it certifies the mesh, the r₀ boundary law, the bisection and Richardson. */
  const rows = [], Z = 18;
  for (const [n, l] of [[1, 0], [2, 0], [3, 0], [2, 1], [3, 1], [3, 2], [5, 0]]) {
    const s = solveAtom(Z, { alpha: 0, latter: false, config: [{ n, l, occ: 1 }] }).orbitals[0];
    rows.push({ nl: `${n}${'spdfg'[l]}`, eps: s.eps, err: Math.abs(s.eps + Z * Z / (2 * n * n)), nodes: s.nodes, want: n - l - 1 });
  }
  const worst = Math.max(...rows.map((r) => r.err));
  judge('CERTIFICATION: bare Coulomb at Z = 18 through solveAtom — every ε_nl (n ≤ 5, l ≤ 2) is −Z²/2n² to better than 1e-6 Eh after Richardson, and every node count is n − l − 1',
    worst < 1e-6 && rows.every((r) => r.nodes === r.want), { worst: worst.toExponential(2), rows: rows.map((r) => [r.nl, r.err.toExponential(1), r.nodes]) });
}

/* ══ 1. the table: Z = 1…36, Aufbau with the two exceptions ════════════════════════════════════════════════ */
{
  const okLen = ATOMS.length === 36 && ATOMS.every((a, i) => a.Z === i + 1);
  const okSum = ATOMS.every((a) => a.config.reduce((s, c) => s + c.occ, 0) === a.Z);
  const okCap = ATOMS.every((a) => a.config.every((c) => c.occ > 0 && c.occ <= 2 * (2 * c.l + 1) && c.l < c.n));
  const sym = [1, 2, 10, 18, 21, 24, 29, 36].map((Z) => atom(Z).symbol).join(' ');
  judge('THE TABLE: 36 atoms H…Kr, every configuration sums to Z, no shell over 2(2l+1), l < n',
    okLen && okSum && okCap && sym === 'H He Ne Ar Sc Cr Cu Kr', { sym, len: ATOMS.length });
  const cr = atom(24).config, cu = atom(29).config, v = atom(23).config;
  const occ = (cfg, n, l) => (cfg.find((c) => c.n === n && c.l === l) || { occ: 0 }).occ;
  judge('THE TWO EXCEPTIONS: Cr is 3d⁵ 4s¹ and Cu is 3d¹⁰ 4s¹ (not 3d⁴4s² / 3d⁹4s²), while V between them stays plain Aufbau 3d³ 4s²',
    occ(cr, 3, 2) === 5 && occ(cr, 4, 0) === 1 && occ(cu, 3, 2) === 10 && occ(cu, 4, 0) === 1 && occ(v, 3, 2) === 3 && occ(v, 4, 0) === 2,
    { Cr: atom(24).term, Cu: atom(29).term, V: atom(23).term });
  judge("THE MODEL IS NAMED on every number: EXCHANGE_MODEL is 'Xα(2/3) + Latter tail' and a solve carries it",
    EXCHANGE_MODEL === 'Xα(2/3) + Latter tail' && solveAtom(10).model === 'Xα(2/3) + Latter tail' && solveAtom(10, { alpha: 1 }).model === 'Xα(1) + Latter tail'
    && solveAtom(2, { alpha: 0 }).model.startsWith('Hartree, self-interaction-free'),
    { xa: solveAtom(10).model, slater: solveAtom(10, { alpha: 1 }).model, sic: solveAtom(2, { alpha: 0 }).model });
}

/* ══ 2. the two total-energy gates ═════════════════════════════════════════════════════════════════════════ */
{
  const ne = solveAtom(10), ar = solveAtom(18);
  judge('GATE Ne: E = −127.476 ± 0.03 Eh for Xα(2/3) + Latter tail (SYNTHESIS W-ATOMS; the old E.2 gate "within 0.5 % of HF −128.54710" is DEAD and is re-checked as a failure below)',
    near(ne.E, -127.476, 0.03), { E: f5(ne.E), ported: -127.47595, HF: -128.54710, percentOfHF: +(100 * Math.abs(ne.E + 128.54710) / 128.54710).toFixed(3) });
  judge('GATE Ar: E = −524.506 ± 0.08 Eh',
    near(ar.E, -524.506, 0.08), { E: f5(ar.E), ported: -524.50582, HF: -526.81751, percentOfHF: +(100 * Math.abs(ar.E + 526.81751) / 526.81751).toFixed(3) });
  judge('E.2 AS ORIGINALLY WRITTEN IS REFUTED, and the refutation is the judged line: Ne is 0.83 % from the HF total (the 0.5 % gate FAILS), while Ar at 0.44 % passes it — the same model, two verdicts',
    100 * Math.abs(ne.E + 128.54710) / 128.54710 > 0.5 && 100 * Math.abs(ar.E + 526.81751) / 526.81751 < 0.5,
    { NePercent: +(100 * Math.abs(ne.E + 128.54710) / 128.54710).toFixed(3), ArPercent: +(100 * Math.abs(ar.E + 526.81751) / 526.81751).toFixed(3) });
  const eps = (S, n, l) => S.orbitals.find((c) => c.n === n && c.l === l).eps;
  const port = [[eps(ne, 1, 0), -30.38483], [eps(ne, 2, 0), -1.36619], [eps(ne, 2, 1), -0.55410],
    [eps(ar, 1, 0), -113.81295], [eps(ar, 2, 0), -10.81785], [eps(ar, 2, 1), -8.46724], [eps(ar, 3, 0), -0.89550], [eps(ar, 3, 1), -0.40113]];
  judge('PORT FIDELITY: every Ne and Ar eigenvalue agrees with the independent Python solve (uniform mesh + scipy + Richardson) to 1e-3 Eh — two meshes, two eigensolvers, two mixers',
    port.every(([a, b]) => near(a, b, 1e-3)), port.map(([a, b]) => [f5(a), b]));
  judge('THE ELECTRONS ARE ALL THERE: ∫q dr = N_el to 1e-8 for Ne and Ar, and the SCF residual max|ΔV·r| is under the 1e-8 tolerance',
    near(ne.electrons, 10, 1e-8) && near(ar.electrons, 18, 1e-8) && ne.residual < 1e-8 && ar.residual < 1e-8,
    { Ne: ne.electrons, Ar: ar.electrons, resNe: ne.residual.toExponential(2), resAr: ar.residual.toExponential(2), itNe: ne.iterations, itAr: ar.iterations });
}

/* ══ 3. helium: the Hartree limit, and what Xα is not ══════════════════════════════════════════════════════ */
{
  const he = solveAtom(2, { alpha: 0 }), o = he.orbitals[0];      // α = 0 → self-interaction-free Hartree
  const rmean = quad(o.r, (j) => o.u[j] * o.u[j] * o.r[j]);
  judge('GATE He AT THE HARTREE LIMIT: for a closed-shell pair in ONE orbital, self-interaction-free Hartree IS Hartree–Fock — E = −2.8616800 ± 3e-6, ε = −0.9179559 ± 3e-6, ⟨r⟩ = 0.9273 ± 1e-4 (E.1 as Opus corrected it; P3\'s −2.86149 was its first-order quadrature, not the grid)',
    near(he.E, -2.8616800, 3e-6) && near(o.eps, -0.9179559, 3e-6) && near(rmean, 0.9273, 1e-4),
    { E: +he.E.toFixed(7), eps: +o.eps.toFixed(7), rmean: +rmean.toFixed(6), HF: [-2.8616800, -0.9179559, 0.9273] });
  judge('CORRELATION IS THE PRICE OF THE MEAN FIELD: exact −2.90372 minus this Hartree limit = 42 mEh = 1.14 eV (E.1 says 42 mEh = 1.1 eV)',
    near(Math.abs(-2.90372 - he.E), 0.042, 0.001), { mEh: +(1000 * Math.abs(-2.90372 - he.E)).toFixed(1), eV: +(HARTREE_EV * Math.abs(-2.90372 - he.E)).toFixed(3) });
  const xa = solveAtom(2);
  judge('AND WHAT Xα(2/3) GIVES FOR He IS NOT THAT: E = −2.70968, ε_1s = −0.74265 — 0.152 Eh ABOVE the Hartree/HF limit, because Xα(2/3) leaves each of the two electrons its own self-interaction and only approximates the exchange that should cancel it.  REPORTED, not gated: the ledger states no Xα He number',
    xa.E > he.E && near(xa.E - he.E, 0.152, 0.002), { XaE: f5(xa.E), Xaeps: f5(xa.orbitals[0].eps), above: +(xa.E - he.E).toFixed(5), model: xa.model });
}

/* ══ 4. the ionisation the model can actually give ═════════════════════════════════════════════════════════ */
{
  const ip = ionisation(10, { n: 2, l: 1 }), koop = -atomEnergyOf(10, 2, 1) * HARTREE_EV;
  judge('GATE Ne Δ-SCF: the 2p ionisation potential is 21.09 ± 0.15 eV — the self-consistent Ne⁺ (2p⁵, Latter tail now −2/r) minus the self-consistent Ne, both from the same functional (measured 21.5645)',
    near(ip, 21.09, 0.15), { deltaSCF: +ip.toFixed(3), ported: 21.09, measured: 21.5645 });
  judge('AND KOOPMANS IS NOT AVAILABLE HERE, as a number: −ε_2p = 15.08 eV is 6.0 eV BELOW the Δ-SCF of the same solve — an Xα eigenvalue is not an ionisation energy (Slater 1970), so no window may print it as one',
    near(koop, 15.08, 0.05) && ip - koop > 5, { koopmans: +koop.toFixed(2), deltaSCF: +ip.toFixed(2), gap: +(ip - koop).toFixed(2) });
}

/* ══ 5. the quantum defect of Na — and the ledger's own inconsistency ══════════════════════════════════════ */
{
  const d23 = quantumDefect(11, 3, 0), d1 = quantumDefect(11, 3, 0, { alpha: 1 }), dNo = quantumDefect(11, 3, 0, { latter: false });
  judge('GATE Na δ_s = 1.373 ± 0.01 (measured 1.3730): reached at α = 1 (Slater) — δ_s = 1.3732, which is the α the SYNTHESIS\'s own 1.3732 came from',
    near(d1, 1.373, 0.01), { alpha1: +d1.toFixed(4), measured: 1.3730, ported: 1.3732, eps3s: f5(atomEnergyOf(11, 3, 0, { alpha: 1 })) });
  judge('THE LEDGER IS INTERNALLY INCONSISTENT HERE, and this is the judged correction: the SAME contract line says "Xα(2/3) + Latter tail … Na δ_s = 1.373", but at α = 2/3 this model gives δ_s = 1.3266 (ported 1.3265), which MISSES 1.373 ± 0.01.  The gate holds only if α is allowed to be 1',
    near(d23, 1.3265, 0.002) && !near(d23, 1.373, 0.01), { alpha23: +d23.toFixed(4), ported: 1.3265, missesBy: +(1.373 - d23).toFixed(4) });
  judge('AND THE TAIL IS WHAT MAKES A DEFECT MEAN ANYTHING: drop the Latter clip and δ_s collapses to 0.452 (ported 0.4519) — the LDA potential decays exponentially, so n* has no Coulomb tail to be measured against',
    near(dNo, 0.4519, 0.002), { withTail: +d23.toFixed(4), noTail: +dNo.toFixed(4), ported: 0.4519 });
}

/* ══ 6. the 3d/4s order: α-dependent, and never asserted ═══════════════════════════════════════════════════ */
{
  const sc = (a) => ({ d: shellEnergyOf(21, 3, 2, { alpha: a }), s: shellEnergyOf(21, 4, 0, { alpha: a }) });
  const a23 = sc(2 / 3), a07 = sc(0.7), a10 = sc(1);
  const order = (x) => (x.d < x.s ? '3d below 4s' : '4s below 3d');
  judge('GATE Sc: the 3d/4s order is α-DEPENDENT — at α = 2/3 it is 4s below 3d (−0.18487 < −0.13963) and at α = 1 it is 3d below 4s (−0.26585 < −0.21557).  The order is reported, never asserted; the ledger\'s "Sc flips with α" is the claim, and it holds',
    order(a23) !== order(a10), { 'α=2/3': [f5(a23.d), f5(a23.s), order(a23)], 'α=1': [f5(a10.d), f5(a10.s), order(a10)] });
  judge('BUT NOT BY α = 0.7: the brief\'s "flips between α = 2/3 and α = 0.7" is wrong as stated — at 0.7 the order is still 4s below 3d (−0.18692 < −0.14945).  The crossing ε_3d = ε_4s is located at α* = 0.839 ± 0.005 by bisection on the same solver',
    order(a07) === order(a23) && (() => { let lo = 0.7, hi = 1; for (let i = 0; i < 12; i++) { const m = (lo + hi) / 2; if (sc(m).d - sc(m).s > 0) lo = m; else hi = m; } return near((lo + hi) / 2, 0.839, 0.005); })(),
    { 'α=0.7': [f5(a07.d), f5(a07.s), order(a07)], gapAt23: f5(a23.d - a23.s), gapAt07: f5(a07.d - a07.s), gapAt1: f5(a10.d - a10.s) });
  const k3d = virtualEnergyOf(19, 3, 2), k4s = atomEnergyOf(19, 4, 0);
  judge('K at α = 2/3 puts 4s below 3d (−0.14356 < −0.05751, ported −0.14353 / −0.05751), which is the right order for K — and the 3d it compares against is a VIRTUAL eigenvalue of the frozen field, not an occupied state',
    k4s < k3d && near(k3d, -0.05751, 1e-3) && near(k4s, -0.14356, 1e-3), { eps3d: f5(k3d), eps4s: f5(k4s) });
}

/* ══ 7. the hydrogenic limit ═══════════════════════════════════════════════════════════════════════════════ */
{
  const h = solveAtom(1, { alpha: 0 });                       // α = 0 → self-interaction-free Hartree: V is exactly −1/r
  judge('GATE H at α = 0: with the self-interaction removed, the one electron of hydrogen sees exactly −1/r, so ε_1s = E = −0.5 to 1e-6 (got 6e-11).  Xα(2/3) on the SAME atom gives −0.40024: a one-electron atom is where a self-interacting exchange functional is most obviously wrong',
    near(h.orbitals[0].eps, -0.5, 1e-6) && near(h.E, -0.5, 1e-6) && !near(solveAtom(1).E, -0.5, 0.05),
    { eps: h.orbitals[0].eps, E: h.E, err: Math.abs(h.orbitals[0].eps + 0.5).toExponential(2), xalpha: f5(solveAtom(1).E) });
}

/* ══ 8. every atom, every orbital: normalisation, nodes, charge, convergence ═══════════════════════════════ */
{
  let worstNorm = 0, worstCharge = 0, worstRes = 0, bad = [], slow = 0, totalIt = 0;
  const totals = [];
  for (const A of ATOMS) {
    const t = Date.now(), S = solveAtom(A.Z);
    slow = Math.max(slow, Date.now() - t); totalIt += S.iterations;
    worstCharge = Math.max(worstCharge, Math.abs(S.electrons - A.Z));
    worstRes = Math.max(worstRes, S.residual);
    totals.push([A.symbol, f5(S.E)]);
    for (const o of S.orbitals) {
      worstNorm = Math.max(worstNorm, Math.abs(quad(o.r, (j) => o.u[j] * o.u[j]) - 1));
      if (o.nodes !== o.n - o.l - 1) bad.push(`${A.symbol} ${o.n}${'spdf'[o.l]}: ${o.nodes} not ${o.n - o.l - 1}`);
      if (!(o.eps < 0)) bad.push(`${A.symbol} ${o.n}${'spdf'[o.l]}: unbound ${o.eps}`);
    }
  }
  judge('EVERY ORBITAL OF EVERY ATOM Z = 1…36: ∫u² dr = 1 to 1e-8 (worst 1.3e-14, by a Simpson written in this test, not in the module) and the node count is exactly n − l − 1 — 192 orbitals, none unbound',
    worstNorm < 1e-8 && bad.length === 0, { worstNorm: worstNorm.toExponential(2), bad: bad.slice(0, 5) });
  judge('AND ALL 36 CONVERGE: ∫q dr = Z to 1e-7 for every atom and every SCF residual max|ΔV·r| is below 1e-8',
    worstCharge < 1e-7 && worstRes < 1e-8, { worstCharge: worstCharge.toExponential(2), worstResidual: worstRes.toExponential(2), meanIterations: Math.round(totalIt / 36), slowestAtomMs: slow });
  judge('THE TOTALS FALL MONOTONICALLY WITH Z (a shell added is never a bond broken) and Kr lands at −2746.855 Eh',
    ATOMS.every((A, i) => i === 0 || solveAtom(A.Z).E < solveAtom(A.Z - 1).E) && near(solveAtom(36).E, -2746.855, 0.01),
    { first: totals.slice(0, 3), last: totals.slice(-3) });
}

/* ══ 9. the table the GPU eats (space 6) ═══════════════════════════════════════════════════════════════════ */
{
  const T = atomRadialTable(10, 2, 1);
  let worst = 0;
  for (let j = 0; j < NR; j++) worst = Math.max(worst, Math.abs(T.table[T.row * NR + j] - atomRadial(10, 2, 1, T.rTab * j / (NR - 1))));
  const rowsRight = T.rows.every((x) => x.row === rowOf(x.n, x.l)) && T.row === rowOf(2, 1);
  judge('THE RADIAL TABLE: 40 rows × 256 samples of R = u/r in a Float32Array (the shape and row map cornellRadialTable hands field.js — row = 6l + n − l − 1), every occupied shell filled, and each row reproduces the log-mesh radial to float32 precision',
    T.table.length === ROWS * NR && T.table instanceof Float32Array && rowsRight && worst < 1e-6 && T.rTab > 0,
    { len: T.table.length, ROWS, NR, row2p: T.row, rows: T.rows.map((x) => [`${x.n}${'spdf'[x.l]}`, x.row, +x.rTab.toFixed(3)]), maxDiff: worst.toExponential(2) });
  const Tk = atomRadialTable(36, 4, 1), Tv = atomRadialTable(10, 3, 2), vRow = Tv.rows.find((x) => x.n === 3 && x.l === 2);
  judge('AND IT HOLDS THE WHOLE ATOM: Kr fills eight rows (1s…4p) inside the 40, every domain radius is finite and inside r_max, and a shell the ground configuration does NOT occupy is no longer refused — Ne 3d comes back as a FOURTH row beside Ne\'s three occupied ones, flagged virtual with occ = 0 on its own row 6l + n − l − 1, carrying virtualEnergyOf\'s ε',
    Tk.rows.length === 8 && Tk.rows.every((x) => x.rTab > 0 && x.rTab < 60) && !Tk.virtual
    && Tv.virtual && Tv.rows.length === 4 && Tv.row === rowOf(3, 2) && Tv.rTab > 0 && Tv.rTab <= 60
    && !!vRow && vRow.occ === 0 && vRow.virtual === true && Tv.eps === virtualEnergyOf(10, 3, 2),
    { rows: Tk.rows.map((x) => [`${x.n}${'spdf'[x.l]}`, x.row, +x.rTab.toFixed(3)]),
      ne3d: [Tv.row, +Tv.rTab.toFixed(3), f5(Tv.eps), Tv.virtual] });
  /* and the unoccupied shell is a real orbital of the frozen field, not a stub */
  const V = virtualOrbital(10, 3, 0);
  const vNorm = quad(V.r, (j) => V.u[j] * V.u[j]);
  let vNodes = 0; for (let j = 2; j + 1 < V.r.length; j++) if (V.u[j] * V.u[j - 1] < 0) vNodes++;
  judge('THE VIRTUAL SHELL IS A STATE, NOT A STUB: Ne 3s° solved in the FROZEN Xα(2/3) + Latter field is normalised (∫u² dr = 1 to 1e-8, by this file\'s own Simpson), carries exactly n − l − 1 = 2 nodes, is bound (ε = −0.16236 < 0), and its ε is virtualEnergyOf\'s to the last bit — so every one of the 91 labels has a radial and ° keeps meaning "not in the ground configuration", never "no state"',
    near(vNorm, 1, 1e-8) && vNodes === 2 && V.eps < 0 && V.eps === virtualEnergyOf(10, 3, 0)
    && V.u.length === V.r.length && near(V.eps, -0.1623602, 1e-6),
    { eps: V.eps, norm: vNorm, nodes: vNodes, mesh: V.r.length, sameAsVirtualEnergyOf: V.eps === virtualEnergyOf(10, 3, 0) });
}

/* ══ 10. the benchmark the SYNTHESIS demanded before a build ═══════════════════════════════════════════════ */
{
  clearAtomCache();
  const t = Date.now(), S = solveAtom(36), ms = Date.now() - t;
  judge(`BENCHMARK (SYNTHESIS "the Xα solver's wall time for Z = 36 in JS (node) — if it exceeds 2 s the atoms are precomputed tables shipped with the lab"): solveAtom(36) takes ${ms} ms, both meshes and the Richardson limit included, so the atoms are SOLVED LIVE and no precomputed table is shipped`,
    ms < 2000 && near(S.E, -2746.855, 0.01), { ms, budget: 2000, E: f5(S.E), iterations: S.iterations, orbitals: S.orbitals.length });
}

/* ══ 11. wave 42, the reviewer's finding 6: the one-bin hole at the nucleus ════════════════════════════════ */
{
  /* atomRadial read s.u[0]/g.r0 for r ≤ r₀, and solveL never wrote u[0]: R_1s(0) = 0, and sample 0 of every s-row of the
     GPU table was 0.  u₀ = u₁ e^{−(l+1)dx} is the wall's own law now, so R_1s(0) = u₁/r₁. */
  const S1 = solveAtom(1), g1 = S1.mesh, r0 = atomRadial(1, 1, 0, 0), u1r1 = S1.orbitals[0].u[1] / g1.r[1];
  const Kr = atomRadialTable(36, 1, 0), s0 = Kr.table[Kr.row * NR], s1 = Kr.table[Kr.row * NR + 1];
  const SKr = solveAtom(36), kr0 = SKr.orbitals[0].u[1] / SKr.mesh.r[1];
  judge('THE NUCLEUS IS NOT A HOLE: atomRadial(Z = 1, 1s, r = 0) = 2.0000 (1e-3 of the hydrogenic 2Z^{3/2}; it read 0), equal to u₁/r₁ to 1e-12; the Kr 1s table\'s sample 0 is 425.40 > 0 (u₁/r₁ = ' + kr0.toFixed(2) + ', to float32) and its sample 1 is within 3 % of it (the cusp, not a cliff); and u₀ = u₁ e^{−dx} to 1e-15 on the fine mesh',
    near(r0, 2.0, 1e-3) && near(r0, u1r1, 1e-12) && s0 > 0 && near(s0, kr0, 1e-3 * kr0) && Math.abs(s1 - s0) < 0.03 * s0 && near(S1.orbitals[0].u[0], S1.orbitals[0].u[1] * Math.exp(-g1.dx), 1e-15),
    { R1s0: r0, u1r1, KrSample0: s0, KrSample1: s1, Kr_u1r1: kr0, u0: S1.orbitals[0].u[0], u1: S1.orbitals[0].u[1] });
}
console.log((FAILED ? 'RED ' : 'GREEN ') + 'atoms.test — ' + FAILED + ' failing of ' + TOTAL + '  (' + ((Date.now() - T0) / 1000).toFixed(1) + ' s)');
process.exit(FAILED ? 1 : 0);
