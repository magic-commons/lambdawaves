/* latex-state.js — THE COPY (0.3.3 · wave 135): the register as LaTeX, in the notebook's own spelling and chemistry's order.
 *
 * PURE: no DOM, no clock, no register.  `stateLatex({ states, H })` is handed the populated labels with their LIVE
 * coefficients — `[{ n, l, m, re, im }]`, c(t) at the clock's t, what the field shows — and the Hamiltonian in force, and
 * returns TWO lines (PLAN R5; the reader deletes the one they do not want):
 *   line 1  the list, in Josh's prose (WAVE DANCER's notebook):   $2p_{-1}$, $2p_{1}$, $4p_{-1}$, and $4d_{2}$
 *   line 2  the expansion:                                         $\psi = 0.50\,2p_{-1} + 0.50\,e^{i\pi/2}\,2p_{1} + …$
 * An empty register is '' — the caller says so and writes nothing to the clipboard.
 *
 * ORDER (R4) is chemistry's: Madelung — n + l, then n — then l, then m from −l to l.  For hydrogen that puts 4s before 3d,
 *   which is exactly what "chemistry style" means for a configuration.
 * AMPLITUDES a_k = |c_k| / √Σ|c|², to two decimals, dropped when 1.00 (a single state).  Under field-free evolution they
 *   are constants of the motion.
 * PHASES φ_k = arg c_k − arg c_first, the first term in that order carrying 0.  They are the LIVE relative phases and move
 *   with t (at E_j − E_k), so a copy is a snapshot of its instant.  A factor below 0.005 rad is dropped; one within 1e-3
 *   of p/q · π (q ≤ 12) is written in π (`e^{i\pi/2}`, `e^{-3i\pi/4}`, `e^{i\pi}`), any other in radians (`e^{1.23i}`).
 *   Under a Zeeman or Stark field, an A ↔ B transition or the Sturmian scale the amplitudes move as well; the copy is
 *   still exactly c(t) at that t (STATE-A/B: the live register IS the mix, and the mix is what is copied).
 * NAMES: hydrogen (any Z) and ATOM name a state by n, l, m — `2p_{-1}`, `4d_{2}`, `1s_{0}`, the notebook's spelling.
 *   Any other operator keeps its own labelOf, made LaTeX-safe: `\mathrm{…}`, a `₊2` / `₋2` becomes `_{+2}` / `_{-2}`
 *   bound to the word before it (KaTeX refuses a subscript after `\,` — "Got group of unknown type: 'internal'"),
 *   and the remaining spaces become `\,`.
 */

const L_LETTER = 'spdfgh';
const TERM_FLOOR = 1e-14;          // |c|²/Σ|c|² at or below this is not a term: the register's own EPS_POP, made relative
const PHASE_FLOOR = 0.005;         // rad: below this the factor is 1 to the printed precision
const PI_TOL = 1e-3, PI_QMAX = 12; // φ/π within PI_TOL of p/q, q ≤ PI_QMAX, is written as a multiple of π

/** the notebook's name for a label: n l m for hydrogen and the atom, the operator's own label (LaTeX-safe) otherwise */
export function latexName(s, H) {
  if (!H || H.id === 'hydrogen' || H.id === 'atom' || typeof H.labelOf !== 'function') return `${s.n}${L_LETTER[s.l]}_{${s.m}}`;
  const safe = String(H.labelOf(s)).trim()
    .replace(/\s*([₊₋])(\d+)/g, (_, sg, d) => `_{${sg === '₊' ? '+' : '-'}${d}}`)
    .replace(/\s+/g, '\\,');
  return `\\mathrm{${safe}}`;
}

/** the phase factor for φ in (−π, π]: '' when it prints as 1 */
function phaseFactor(phi) {
  if (!(Math.abs(phi) >= PHASE_FLOOR)) return '';
  const x = phi / Math.PI;
  for (let q = 1; q <= PI_QMAX; q++) {
    let p = Math.round(x * q);
    if (p === 0 || Math.abs(x - p / q) >= PI_TOL) continue;
    if (p === -q) p = q;                                       // e^{-iπ} is e^{iπ}: one spelling
    const a = Math.abs(p);
    return `e^{${p < 0 ? '-' : ''}${a === 1 ? '' : a}i\\pi${q === 1 ? '' : '/' + q}}`;
  }
  return `e^{${phi.toFixed(2)}i}`;
}

/** the terms of the copy, in chemistry's order: { n, l, m, name, amp (0…1), phase (rad, the first term 0) } */
export function stateTerms({ states, H } = {}) {
  const live = (states || []).filter((s) => s && Number.isFinite(s.re) && Number.isFinite(s.im));
  let sum = 0; for (const s of live) sum += s.re * s.re + s.im * s.im;
  if (!(sum > 0)) return [];
  const kept = live.filter((s) => (s.re * s.re + s.im * s.im) / sum > TERM_FLOOR)
    .sort((a, b) => (a.n + a.l) - (b.n + b.l) || a.n - b.n || a.l - b.l || a.m - b.m);
  if (!kept.length) return [];
  const norm = Math.sqrt(sum), arg0 = Math.atan2(kept[0].im, kept[0].re);
  return kept.map((s, k) => {
    const d = Math.atan2(s.im, s.re) - arg0;
    return { n: s.n, l: s.l, m: s.m, name: latexName(s, H), amp: Math.hypot(s.re, s.im) / norm, phase: k ? Math.atan2(Math.sin(d), Math.cos(d)) : 0 };
  });
}

/** the two lines: the prose list, then ψ with its amplitudes and phases; '' for an empty register */
export function stateLatex(o) {
  const terms = stateTerms(o);
  if (!terms.length) return '';
  const names = terms.map((t) => '$' + t.name + '$');
  const list = names.length === 1 ? names[0] : names.length === 2 ? names[0] + ' and ' + names[1]
    : names.slice(0, -1).join(', ') + ', and ' + names[names.length - 1];
  const psi = terms.map((t) => {
    const a = t.amp.toFixed(2), f = phaseFactor(t.phase);
    return (a === '1.00' ? '' : a + '\\,') + (f ? f + '\\,' : '') + t.name;
  }).join(' + ');
  return list + '\n$\\psi = ' + psi + '$';
}

/* ── THE MOLECULE'S PAGE (0.4.0 S0 · wave 136): EDIT › COPY under a molecular field owner ─────────────────────────────
 * `moleculeLatex({ molecule, basis, charge, ground })` — the library row (`{ formula, name }`, lab/molecules.js), the basis
 * id, the formal charge and the RHF ground the worker returned (`{ energy, eps, nocc, nAO }`, mathworker.js chemGround) —
 * in stateLatex's two-line shape:
 *   line 1  prose: the formula and name, RHF/basis, the charge, the total energy in E_h, the occupied count of n AO
 *   line 2  the ladder:  $\varepsilon_{1} = -20.2516\ (\mathrm{HOMO{-}4}),\ …,\ \varepsilon_{6} = 0.6037\ (\mathrm{LUMO}),\ …$
 * Every level is tagged BY INDEX from the frontier (HOMO, HOMO−1, …, LUMO, LUMO+1, …).  '' when there is no ground. */
const BASIS_LABEL = { 'sto-3g': 'STO-3G', '6-31+g-star': '6-31+G*' };
const SUB = '₀₁₂₃₄₅₆₇₈₉';
/** a library formula ('<m>H₂O</m>', 'NH₄⁺', 'CO(NH₂)₂') as upright LaTeX: \mathrm{H_{2}O} */
export function formulaLatex(f) {
  const s = String(f || '').replace(/<\/?m>/g, '')
    .replace(/[₀-₉]+/g, (d) => '_{' + [...d].map((c) => SUB.indexOf(c)).join('') + '}')
    .replace(/⁺/g, '^{+}').replace(/⁻/g, '^{-}');
  return '\\mathrm{' + s + '}';
}
/** the frontier name of orbital i (1-based) with nocc occupied: HOMO, HOMO−k, LUMO, LUMO+k */
function frontier(i, nocc) {
  if (i <= nocc) return i === nocc ? 'HOMO' : 'HOMO{-}' + (nocc - i);
  return i === nocc + 1 ? 'LUMO' : 'LUMO{+}' + (i - nocc - 1);
}
export function moleculeLatex({ molecule, basis, charge, ground } = {}) {
  if (!molecule || !ground || !Number.isFinite(ground.energy) || !ground.eps || !ground.eps.length) return '';
  const nocc = ground.nocc, nAO = ground.nAO || ground.eps.length, q = charge || 0;
  const head = '$' + formulaLatex(molecule.formula) + '$' + (molecule.name ? ', ' + molecule.name : '')
    + ' — RHF/' + (BASIS_LABEL[basis] || String(basis || '').toUpperCase())
    + ', ' + (q ? 'charge ' + (q > 0 ? '+' : '−') + Math.abs(q) : 'neutral')
    + ', $E = ' + ground.energy.toFixed(6) + '\\,E_h$, ' + nocc + ' occupied of ' + nAO + ' AO, orbital energies $\\varepsilon_{i}$ in $E_h$:';
  /* S1 slots the symmetry NAME of each level in beside its frontier tag here (e.g. `1b_{1}`, HOMO) — same function, same shape */
  const ladder = Array.from(ground.eps, (e, k) => '\\varepsilon_{' + (k + 1) + '} = ' + e.toFixed(4) + '\\ (\\mathrm{' + frontier(k + 1, nocc) + '})');
  return head + '\n$' + ladder.join(',\\ ') + '$';
}
