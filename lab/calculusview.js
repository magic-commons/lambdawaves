/* calculusview.js — the CALCULUS window: the statistics, derived live, each with its formula, its theorem and the
 * residual the theorem leaves.  Nothing here is drawn from the picture; everything is computed from the register
 * with exact matrix elements, and the derivatives are centred differences of the exact evolution.
 */
import { stats } from './calculus.js';
import { el, readout, sw, mathText } from './mir/kit.js';

export function createCalculus(host, api) {
  let on = true, last = null;
  const r0 = el('div', 'row tight', host);
  const liveSw = sw({ label: 'LIVE', value: true, title: 'recompute every update (throttled while playing)', onChange: (v) => { on = v; } });
  r0.appendChild(liveSw.root);
  const table = el('div', 'calc-table', host);
  el('div', 'note', host).innerHTML = '<b>Interpretation.</b> Each row compares a measured expectation-value change with the corresponding Ehrenfest prediction. The residual includes basis truncation, quadrature, and the centred finite-difference error. In the box, it also contains the wall force.';
  /* OPTIMIZATION 2026-09-24 · LA10 · THE ROWS ARE KEPT.  Every update used to empty the table and build it again —
     0.64 ms and 32 mutation records of a 0.93 ms update (REFUTE-B), for five rows whose names and formulas never move.
     The elements are built once per row COUNT; each update writes only the strings that changed, through the same
     mathText el() uses, so the table is the DOM a fresh build would make (same nodes, text, classes, order). */
  let cells = [], foot = null, footS;
  const put = (c, k, s) => { if (c.s[k] !== s) { c.s[k] = s; mathText(c[k], s); } };
  function render(S) {
    if (!foot || cells.length !== S.rows.length) {
      table.innerHTML = ''; cells = [];
      for (let i = 0; i < S.rows.length; i++) {
        const row = el('div', 'calc-row', table);
        cells.push({ name: el('span', 'calc-name', row), val: el('span', 'calc-val', row), res: el('span', 'calc-res', row), formula: el('span', 'calc-formula', row), law: el('span', 'calc-law', row), s: {} });
      }
      foot = el('div', 'calc-foot', table); footS = undefined;
    }
    S.rows.forEach((r, i) => {
      const c = cells[i];
      put(c, 'name', r.name);
      put(c, 'val', Number.isFinite(r.value) ? r.value.toFixed(6) + (r.unit ? ' ' + r.unit : '') : '—');
      put(c, 'res', 'residual ' + (Number.isFinite(r.residual) ? r.residual.toExponential(2) : 'toy on'));
      put(c, 'formula', r.formula);
      put(c, 'law', r.law + (Number.isFinite(r.predicted) ? (r.derivative !== undefined ? `  ·  d/dt = ${r.derivative.toFixed(6)}, law says ${r.predicted.toFixed(6)}` : `  ·  predicted ${r.predicted.toFixed(6)}`) : ''));
      const tol = 1e-4 * (1 + Math.abs(r.predicted || 0));
      const cls = 'calc-res ' + (!Number.isFinite(r.residual) ? 'warn' : Math.abs(r.residual) < tol ? 'ok' : (r.name.startsWith('2⟨T⟩') ? '' : 'warn'));
      if (c.res.className !== cls) c.res.className = cls;
    });
    const f = `t = ${S.t.toFixed(3)} · ${S.ids} populated states · h = ${S.h}`;
    if (f !== footS) { footS = f; mathText(foot, f); }
  }
  function update(reg, t) {
    if (!on || table.clientWidth < 32) return;
    const key = `${reg.version}|${t.toFixed(4)}`;
    if (key === update.key) return;
    update.key = key; last = stats(reg, t); render(last);
  }
  return { update, get last() { return last; } };
}
