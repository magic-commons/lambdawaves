/* cost-refit.mjs — 0.4.0 S4a · THE COST REFIT (PLAN §10 N2): lab/molecules.js COST from the rows S0 measured.
 *   node tools/perf/cost-refit.mjs [research/release-0.4.0/measure/benzene-node.json]
 *
 * The model is unchanged — ms = a·eriWork + b·rpaWork + c over the whole worker path (ground + spectrum) — and so are its two
 * work measures, read off the ENGINE's own basis (lab/md.js basisFrom) so the 6-31+G* row counts its real primitives:
 *   eriWork = Σ over the unique shell quartets of Π components × Π primitives  (= molecules.js eriWork for STO-3G's 3 primitives)
 *   rpaWork = (nocc·nvirt)²·nAO²
 * The rows are S0's node medians (MEASURE.md §2, `benzene-node.json`): H₂O, N₂, C₆H₆, C₂H₄/6-31+G* and naphthalene (58 AO).
 * The fit is NON-NEGATIVE least squares in RELATIVE error (each row weighted 1/ms), every subset of {a, b, c} tried and the
 * best feasible kept — an absolute fit would hand the whole model to naphthalene's 17.5 s and say nothing about water.
 * Prints the constants, each row's prediction, and the 54 entries' verdict against the benzene cap (nothing may cross it). */
import { readFileSync } from 'node:fs';
import { basisFrom } from '../../lab/md.js';
import { MOLECULES, MOLECULE_BY_ID, moleculeAtoms, eriWork, rpaWork } from '../../lab/molecules.js';

const FILE = process.argv[2] || 'research/release-0.4.0/measure/benzene-node.json';
const M = JSON.parse(readFileSync(FILE, 'utf8'));
const rec = (f) => JSON.parse(readFileSync(new URL('../../lab/vendor/bse/' + f, import.meta.url), 'utf8'));
const RECS = { 'sto-3g': rec('sto-3g-v1.json'), '6-31+g-star': rec('6-31+g-star-v1.json') };
const NC = [1, 3, 6];
function works(atoms, basis, charge = 0) {
  const b = basisFrom(atoms, RECS[basis], { cart: true }), pair = [];
  for (let i = 0; i < b.shells.length; i++) for (let j = 0; j <= i; j++) {
    const s = b.shells[i], t = b.shells[j];
    pair.push(NC[s.l] * NC[t.l] * s.exps.length * t.exps.length);
  }
  let w = 0; for (let p = 0; p < pair.length; p++) for (let q = 0; q <= p; q++) w += pair[p] * pair[q];
  const nocc = (atoms.reduce((s, a) => s + a.Z, 0) - charge) / 2;
  return { eri: w, rpa: rpaWork(b.n, nocc), nAO: b.n };
}
const naph = [...Array(10)].map(() => ({ Z: 6, x: 0, y: 0, z: 0 })).concat([...Array(8)].map(() => ({ Z: 1, x: 0, y: 0, z: 0 })));
const ATOMS = { H2O: moleculeAtoms('H2O'), N2: moleculeAtoms('N2'), C6H6: moleculeAtoms('C6H6'), C2H4: moleculeAtoms('C2H4') };
const rows = Object.entries(M.cases).map(([id, c]) => {
  const key = id.startsWith('C10H8') ? 'C10H8' : id, w = works(key === 'C10H8' ? naph : ATOMS[key], c.basis);
  if (w.nAO !== c.nAO) throw new Error(`${id}: ${w.nAO} AO here, ${c.nAO} measured`);
  return { id: key + (c.basis === 'sto-3g' ? '' : '/' + c.basis), ms: c.summary.total.median, ...w };
});
/* the generalised count IS molecules.js's for STO-3G — checked, not assumed */
for (const id of ['H2O', 'N2', 'C6H6']) { const m = MOLECULE_BY_ID.get(id); if (rows.find((r) => r.id === id).eri !== m.eriWork) throw new Error('eriWork disagrees with molecules.js for ' + id); }

/* weighted NNLS over every subset of the three columns */
const cols = [(r) => r.eri, (r) => r.rpa, () => 1];
function solve(sub) {
  const k = sub.length, A = Array.from({ length: k }, () => new Array(k).fill(0)), y = new Array(k).fill(0);
  for (const r of rows) { const w = 1 / r.ms, x = sub.map((j) => cols[j](r) * w); for (let i = 0; i < k; i++) { y[i] += x[i] * r.ms * w; for (let j = 0; j < k; j++) A[i][j] += x[i] * x[j]; } }
  for (let i = 0; i < k; i++) { let p = i; for (let q = i + 1; q < k; q++) if (Math.abs(A[q][i]) > Math.abs(A[p][i])) p = q; [A[i], A[p]] = [A[p], A[i]]; [y[i], y[p]] = [y[p], y[i]];
    for (let q = i + 1; q < k; q++) { const f = A[q][i] / A[i][i]; for (let j = i; j < k; j++) A[q][j] -= f * A[i][j]; y[q] -= f * y[i]; } }
  const x = new Array(k).fill(0); for (let i = k - 1; i >= 0; i--) { let s = y[i]; for (let j = i + 1; j < k; j++) s -= A[i][j] * x[j]; x[i] = s / A[i][i]; }
  const coef = [0, 0, 0]; sub.forEach((j, i) => { coef[j] = x[i]; });
  return coef;
}
let best = null;
for (const sub of [[0, 1, 2], [0, 1], [0, 2], [1, 2], [0], [1], [2]]) {
  const c = solve(sub); if (c.some((v) => v < 0)) continue;
  const err = rows.reduce((s, r) => s + ((c[0] * r.eri + c[1] * r.rpa + c[2]) / r.ms - 1) ** 2, 0);
  if (!best || err < best.err) best = { c, err, sub };
}
const [a, b, c] = best.c, sig = (v) => +v.toPrecision(7);
const pred = (eri, rpa) => sig(a) * eri + sig(b) * rpa + sig(c);
console.log(`COST refit (relative NNLS, columns ${best.sub.map((j) => ['a', 'b', 'c'][j]).join('')}): a = ${sig(a)}, b = ${sig(b)}, c = ${sig(c)} · Σ(rel err)² ${best.err.toExponential(3)}`);
for (const r of rows) console.log(`  ${r.id.padEnd(18)} ${String(r.nAO).padStart(3)} AO · eriWork ${r.eri.toExponential(4)} · rpaWork ${r.rpa.toExponential(4)} · measured ${r.ms.toFixed(1)} ms · predicted ${pred(r.eri, r.rpa).toFixed(1)} ms · ratio ${(pred(r.eri, r.rpa) / r.ms).toFixed(2)}`);
const cap = Math.round(pred(MOLECULE_BY_ID.get('C6H6').eriWork, MOLECULE_BY_ID.get('C6H6').rpaWork));
const over = MOLECULES.filter((m) => Math.round(pred(m.eriWork, m.rpaWork)) > cap * 1.02).map((m) => m.id);
const top = MOLECULES.map((m) => [m.id, Math.round(pred(m.eriWork, m.rpaWork))]).sort((x, y) => y[1] - x[1]).slice(0, 6);
console.log(`  the cap (benzene) ${cap} ms · over it: ${over.length ? over.join(', ') : 'none'} · the six slowest: ${top.map(([i, v]) => i + ' ' + v).join(', ')} · Br₂ below benzene: ${top.findIndex((t) => t[0] === 'Br2') > top.findIndex((t) => t[0] === 'C6H6')}`);
