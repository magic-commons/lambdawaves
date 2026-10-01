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
