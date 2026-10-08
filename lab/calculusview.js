/* calculusview.js — the CALCULUS window: the statistics, derived live, each a TILE — RADIATION's skin (0.4.0 S3 · F3: the kit's
 * readout tiles, here in a grid of two columns on the card and three floating, opted out of LEAN so a first visit sees them):
 * the value, the residual its law leaves, and the formula and the law on its hover.  ⧉ copies the PROSE FIGURE
 * (calculus.js calculusMarkdown), which pastes into the notebook and renders.  Nothing here is drawn from the picture: every
 * number is computed from the register with exact matrix elements, the derivatives centred differences of the exact evolution.
 */
import { stats } from './calculus.js';
import { el, readout, sw, mathText } from './mir/kit.js';

export function createCalculus(host) {
  let on = true, last = null, key = '';
  const r0 = el('div', 'row tight', host);
  r0.appendChild(sw({ label: 'LIVE', value: true, title: 'recompute every update (throttled while playing)', onChange: (v) => { on = v; } }).root);
  const grid = el('div', 'calc-grid', host), foot = el('div', 'calc-foot', host);
  el('div', 'note', host).innerHTML = '<b>Interpretation.</b> Each tile compares a measured change with the law that predicts it; the residual includes basis truncation, quadrature and the centred finite-difference error. In the box it also contains the wall force. A tile without a residual is a moment, not a law.';
  /* OPTIMIZATION 2026-09-24 · LA10 · THE TILES ARE KEPT: built once per set of rows (the names change only with the operator
     or a field), and each update writes only the strings that changed — the readouts' own dirty checks, and the class here. */
  let tiles = [], names = '', footS;
  function render(S) {
    const sig = S.rows.map((r) => r.name).join('|');
    if (sig !== names) {
      names = sig; grid.textContent = '';
      tiles = S.rows.map((r) => { const t = readout({ label: r.name, value: '—' }); grid.appendChild(t.root); t.cls = null; return t; });
    }
    S.rows.forEach((r, i) => {
      const t = tiles[i], tol = 1e-4 * (1 + Math.abs(r.predicted || 0));
      const cls = r.residual === null ? '' : !Number.isFinite(r.residual) ? 'warn' : Math.abs(r.residual) < tol ? 'ok' : (r.name.startsWith('2⟨T⟩') ? '' : 'warn');
      t.set(Number.isFinite(r.value) ? r.value.toFixed(6) + (r.unit ? ' ' + r.unit : '') : '—', cls === t.cls ? undefined : (t.cls = cls));
      t.setSub(r.residual === null ? r.law : 'residual ' + (Number.isFinite(r.residual) ? r.residual.toExponential(2) : 'toy on'));
      const hint = r.formula + ' · ' + r.law + (r.residual !== null && Number.isFinite(r.predicted) ? (r.derivative !== undefined ? ` · d/dt = ${r.derivative.toFixed(6)}, the law says ${r.predicted.toFixed(6)}` : ` · predicted ${r.predicted.toFixed(6)}`) : '');
      if (t.root.title !== hint) t.root.title = hint;
    });
    const f = `t = ${S.t.toFixed(3)} · ${S.ids} populated states · h = ${S.h}`;
    if (f !== footS) { footS = f; mathText(foot, f); }
  }
  /** the CPU tick, through the reader law (rack.js may): it skips if neither the register nor the clock moved */
  function update(reg, t) {
    if (!on) return;
    const k = `${reg.version}|${t.toFixed(4)}`;
    if (k === key) return;
    key = k; last = stats(reg, t); render(last);
  }
  return { update, get last() { return last; } };
}
