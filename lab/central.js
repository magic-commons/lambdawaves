/* central.js — CENTRAL (0.8.0 G1): THE GENERIC CENTRAL HAMILTONIAN.  A preset V(r) with knobs, solved by cornell.js' `numerov` for the 28 (n_r, l) rows
 * the 140 labels name (n ≤ 7), tabulated for the kernel's space 6 by cornell's own road (`tabRow`, row rowOfNr: 6l + n_r, n = 7's 7s and 7i at 36 + l); hydrogen units (μ = 1, Eh, a₀).  BOUND,
 * defined once: a row is bound iff its eigenvalue E < 0, below V at infinity (for CONFINED a level at E ≥ 0 is held by the wall alone).  The register holds no
 * continuum, so an UNBOUND label has no energy (NaN), a zero row (drawn as nothing) and reads "unbound here" in its lane.  QUARKONIUM is the preset `cornell`:
 * it IS HAMILTONIANS.cornell (cornell.js, GeV, `instruments.qcd`), so nothing here writes while QQ̄ is in force.  The oracle in force is printed beside the 1s.  STATUS: NUMERICAL. */
import { numerov, tabRow, NR, ROWS, L_RGB, radialAt, cornellTable, cornellPsiAt, configure as qqConfigure, system as qqSystem, solved as qqSolved, MEASURED } from './cornell.js';
import { BASIS, NMAX } from './hydrogen.js'; import { rowOf } from './atoms.js'; import { atomForms, L_LETTERS } from './names.js'; import { el, knob, readout, seg, stepper } from './mir/kit.js';
export const POTENTIALS = {
  confined: { label: 'CONFINED  −1/r inside a hard sphere R_c', V: () => (r) => -1 / r, knobs: { Rc: ['R_c', 1, 30, 'a₀'] } },
  yukawa: { label: 'YUKAWA  −e^(−r/λ)/r', V: (p) => (r) => -Math.exp(-r / p.lam) / r, knobs: { lam: ['λ', 0.5, 50, 'a₀'] } },
  well: { label: 'FINITE WELL  −V₀ for r < a', V: (p) => (r) => (r < p.a ? -p.V0 : 0), knobs: { V0: ['V₀', 0.1, 10, 'Eh'], a: ['a', 1, 30, 'a₀'] } },
  softcore: { label: 'SOFT-CORE  −1/√(r² + a²)', V: (p) => (r) => -1 / Math.sqrt(r * r + p.a * p.a), knobs: { a: ['a', 0.01, 5, 'a₀'] } },
  cornell: { label: 'QUARKONIUM  −4α_s/3r + σr  (GeV)', knobs: { alphaS: ['α_s', 0.1, 0.8, ''], sigma: ['σ', 0.05, 0.4, 'GeV²'] } },
};
export const DEFAULTS = { confined: { Rc: 25 }, yukawa: { lam: 25 }, well: { V0: 5, a: 4 }, softcore: { a: 0.5 } };
const N = 6000, RMAX = { confined: (p) => p.Rc, well: (p) => p.a / (Math.round(p.a * N / (p.a + 60)) + 0.5) * N };   // the well's step mid-cell: O(h²) across it, not O(h)
const M12 = (a, z) => { let t = 1, s = 1; for (let k = 0; k < 300; k++) { t *= (a + k) * z / ((2 + k) * (k + 1)); s += t; } return s; };   // M(a, 2, z), its series
/** the first sign change of f on [lo, hi] from f(lo) > 0 (a scan packed towards lo, then bisection); lo when f(lo) is already past it (the 1s at −½ to double precision behind a far wall) */
function firstRoot(f, lo, hi) { let a = lo, fa = f(a); if (!(fa > 0)) return lo;
  for (let i = 1; i <= 4000; i++) { let b = lo + (hi - lo) * (i / 4000) ** 2; const fb = f(b); if (fa * fb <= 0) { for (let j = 0; j < 100; j++) { const m = (a + b) / 2, fm = f(m); if (fa * fm <= 0) b = m; else { a = m; fa = fm; } } return (a + b) / 2; } a = b; fa = fb; } return NaN; }
const ORACLE = {   // the closed form (or the 2N Numerov) against which the measured 1s is printed, and where a state leaves
  confined: (p) => ({ closed: p.Rc > 1.835246 ? firstRoot((E) => { const k = Math.sqrt(-2 * E); return M12(1 - 1 / k, 2 * k * p.Rc); }, -0.5 + 1e-15, -1e-12) : NaN, what: 'M(1 − 1/κ, 2, 2κR_c) = 0', leaves: '1s leaves at R_c = j²₁,₁/8 = 1.835246 a₀' }),
  yukawa: (p, V, opt) => ({ closed: numerov(V, 1, 0, 1, { ...opt, N: 2 * N }).E, what: 'Numerov at 2N', leaves: '1s leaves at λ_c = 0.839908 a₀ (δ_c = 1/λ_c = 1.190612)' }),
  well: (p) => ({ closed: firstRoot((E) => { const k = Math.sqrt(2 * (p.V0 + E)), q = Math.sqrt(-2 * E); return k * Math.cos(k * p.a) + q * Math.sin(k * p.a); }, 1e-12 - p.V0, -1e-12), what: 'k cos ka + κ sin ka = 0', leaves: 'an s level leaves as √(2V₀)·a falls through (j − ½)π' }),
  softcore: (p, V, opt) => ({ closed: numerov(V, 1, 0, 1, { ...opt, N: 2 * N }).E, what: 'Numerov at 2N', leaves: 'a → 0 is hydrogen: E₁ₛ → −0.5' }),
};
/** the solve (the worker's op `central.solve`; the same pure function on the frame thread): the 28 rows, the space-6 table (unbound rows zero), the bound count, the oracle */
export function solveCentral(preset, p) {
  const t0 = Date.now(), V = POTENTIALS[preset].V(p), opt = { rmax: (RMAX[preset] || (() => 200))(p), N, eMin: -(p.V0 || 1) - 1 }, rows = [];
  const E = new Float64Array(ROWS).fill(NaN), rTab = new Float64Array(ROWS), r99 = new Float64Array(ROWS), table = new Float32Array(ROWS * NR); let bound = 0;
  for (let n = 1; n <= NMAX; n++) for (let l = 0; l < n; l++) { const row = rowOf(n, l), R = rows[row] = tabRow(V, 1, l, n - l - 1, opt, table, row);
    if (R.E < 0) { E[row] = R.E; rTab[row] = R.rTab; r99[row] = R.r99; bound += 2 * l + 1; } else table.fill(0, row * NR, row * NR + NR); }
  const o = ORACLE[preset](p, V, opt); o.measured = E[0]; o.d = Math.abs(E[0] - o.closed);
  o.line = (E[0] < 0 ? `1s ${E[0].toFixed(6)} · ${o.what}: ${Number.isFinite(o.closed) ? o.closed.toFixed(6) + ' · Δ ' + o.d.toExponential(1) : 'no root'}` : '1s unbound') + ' · ' + o.leaves;
  return { preset, params: { ...p }, E, rTab, r99, table, rows, bound, oracle: o, ms: Date.now() - t0 };
}
let cur = { preset: 'confined', params: { ...DEFAULTS.confined } }, S = null;
const tabs = new Map(), S_ = () => S || (S = solveCentral(cur.preset, cur.params)), bnd = (n, l) => S_().E[rowOf(n, l)] < 0;
/** the record { preset, params } (persist, the tests), solved on the frame thread at its next read; true when it changed.  Absent OR null is
 *  the defaults, as SEPARABLE's, LATTICE's and BLOCH's loads read it (iteration 010 X4: a null threw inside restore() and rolled the whole open back) */
export function configure(rec) { rec = rec || {}; const preset = DEFAULTS[rec.preset] ? rec.preset : 'confined', next = { preset, params: { ...DEFAULTS[preset], ...rec.params } }; if (JSON.stringify(next) === JSON.stringify(cur)) return false; cur = next; S = null; tabs.clear(); return true; }
/** a solve the worker answered becomes the Hamiltonian's data */
export function install(res) { cur = { preset: res.preset, params: res.params }; S = res; tabs.clear(); }
export const save = () => (JSON.stringify(cur) === JSON.stringify({ preset: 'confined', params: DEFAULTS.confined }) ? undefined : { preset: cur.preset, params: { ...cur.params } });
const tableFor = (s) => { let T = tabs.get(s.id); if (!T) tabs.set(s.id, T = cornellTable(s.n, s.l, s.m, S_())); return T; }, psiAt = (re, im, x, y, z, ids) => cornellPsiAt(re, im, x, y, z, ids, tableFor, S_());
const domainFor = (nmax) => { let r = 0; for (let n = 1; n <= nmax; n++) for (let l = 0; l < n; l++) if (bnd(n, l)) r = Math.max(r, S.r99[rowOf(n, l)]); return Math.max(r * 1.15, 2); };
export const CENTRAL = {
  id: 'central', get label() { return 'CENTRAL  ' + POTENTIALS[cur.preset].label; }, short: 'V(r)', unit: 'hartree', lengthUnit: 'a₀', radialTable: () => S_().table,
  energy: (a) => S_().E[rowOf(BASIS[a].n, BASIS[a].l)], radial: (n, l, r) => (bnd(n, l) ? radialAt(n - l - 1, l, r, S) : 0),
  tableFor, momentumTableFor: tableFor, psiAt, phiAt: psiAt, domainFor, domainForP: domainFor,   // momentum space is not built: the selector forces position space
  kernelSpace: { x: 6, p: 6 }, stark: false, hydrogenTheorems: false, noMomentum: true, labelOf: (s) => atomForms(s).plain,
  get spectrum() { const levels = []; for (let n = 1; n <= NMAX; n++) for (let l = 0; l < n; l++) if (bnd(n, l)) levels.push({ key: n + ':' + l, E: S.E[rowOf(n, l)], label: n + L_LETTERS[l], rgb: L_RGB[l] });
    return { levels: levels.sort((p, q) => p.E - q.E), levelKey: (a) => BASIS[a].n + ':' + BASIS[a].l, Emin: (levels.length ? levels[0].E : -0.5) * 1.05, Etop: 0, topLabel: 'E = 0',
      footer: `EIGENVALUE · ${POTENTIALS[cur.preset].label} · Numerov · ${S_().bound} bound of ${BASIS.length} · a level at E ≥ 0 is no state here (no continuum)` }; },
};
/** THE CARD: the POTENTIAL stepper, the preset's knobs, the readout.  api = { solve({ preset, params }) → Promise, apply(id), current(), populated() } */
export function createCentral(host, api) {
  const vals = JSON.parse(JSON.stringify(DEFAULTS)), kn = {}; let sel = cur.preset, busy = false, want = null;
  const step = stepper({ aria: 'Central potential', items: Object.entries(POTENTIALS).map(([id, P]) => ({ id, label: P.label.split('  ')[0] })), value: sel, cls: 'mol-step', onChange: (id) => pick(id) });
  const kind = seg({ label: 'QUARK', value: qqSystem().kind, options: [{ id: 'charm', label: 'CHARM' }, { id: 'bottom', label: 'BOTTOM' }], onChange: (v) => pick('cornell', { kind: v }) });
  const r1 = el('div', 'row', host), ro = readout({ label: 'BOUND · ORACLE', value: '—', cls: 'wide' }); host.prepend(step.root);
  for (const [id, P] of Object.entries(POTENTIALS)) for (const [k, [label, min, max, u]] of Object.entries(P.knobs)) r1.appendChild((kn[id + '.' + k] = knob({ label, min, max, log: max / min > 20,
    value: id === 'cornell' ? qqSystem().params[k] : vals[id][k], fmt: (v) => v.toPrecision(3) + (u ? ' ' + u : ''), onInput: (v) => pick(id, { [k]: v }) })).root);
  r1.append(kind.root, ro.root); el('div', 'note', host).innerHTML = '<b>Units.</b> Hydrogen units: lengths in a₀, energies in Eh; QUARKONIUM in GeV and GeV⁻¹. A level at E ≥ 0 is not a state of this Hamiltonian — the register holds no continuum — so its labels are drawn as nothing and read “unbound here”.';
  /** QUARKONIUM configures cornell.js and switches to its own entry; a generic preset re-solves in the worker (the latest ask wins), then switches */
  function pick(id, p = {}) { sel = id; if (id === 'cornell') { const s = qqSystem(); qqConfigure(p.kind || s.kind, { ...s.params, ...p }); api.apply('cornell'); } else { Object.assign(vals[id], p); ask({ preset: id, params: { ...vals[id] } }); } sync(); }
  function ask(w) { want = w; if (busy) return; busy = true; ro.setSub('solving 28 rows…');
    Promise.resolve(api.solve(w)).then((r) => { if (r && r.E) { install(r); if (want === w && sel !== 'cornell') api.apply('central'); } }).finally(() => { busy = false; if (want !== w) ask(want); else paint(); }); }
  function paint() {
    if (sel === 'cornell') { const Q = qqSolved(), L = MEASURED[Q.kind].levels[1]; ro.set(`${BASIS.length} bound of ${BASIS.length}`); ro.setSub(`confining · ${L.name} ${Q.M[1].toFixed(4)} GeV predicted · PDG ${L.M}`); return; }
    if (S) { const off = api.populated().filter((a) => !bnd(BASIS[a].n, BASIS[a].l)).length; ro.set(`${S.bound} bound of ${BASIS.length}` + (off ? ` · ${off} populated unbound here` : '')); ro.setSub(S.oracle.line + ` · ${S.ms} ms`); } }
  function sync() { step.set(sel); for (const key in kn) kn[key].root.style.display = key.startsWith(sel + '.') ? '' : 'none'; kind.root.style.display = sel === 'cornell' ? '' : 'none'; paint(); }
  /** on open: read back what owns the field (QUARKONIUM, or the record), and solve the record in the worker if nothing is held */
  function prepare() { sel = api.current() === 'cornell' ? 'cornell' : cur.preset; Object.assign(vals[cur.preset], cur.params); for (const k in vals[cur.preset]) kn[cur.preset + '.' + k].set(vals[cur.preset][k]); if (!S && !busy) ask(cur); sync(); }
  return { prepare, paint };
}
