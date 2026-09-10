/* calculusview.js — the CALCULUS window: the statistics, derived live, each with its formula, its theorem and the
 * residual the theorem leaves.  Nothing here is drawn from the picture; everything is computed from the register
 * with exact matrix elements, and the derivatives are centred differences of the exact evolution.
 */
import { stats } from './calculus.js';
import { el, readout, sw } from './kit.js';

export function createCalculus(host, api) {
  let on = true, last = null;
  const r0 = el('div', 'row tight', host);
  const liveSw = sw({ label: 'LIVE', value: true, title: 'recompute every update (throttled while playing)', onChange: (v) => { on = v; } });
  r0.appendChild(liveSw.root);
  const table = el('div', 'calc-table', host);
  el('div', 'note', host).innerHTML = '<b>Interpretation.</b> Each row compares a measured expectation-value change with the corresponding Ehrenfest prediction. The residual includes basis truncation, quadrature, and the centred finite-difference error. In the box, it also contains the wall force.';
  function render(S) {
    table.innerHTML = '';
    for (const r of S.rows) {
      const row = el('div', 'calc-row', table);
      el('span', 'calc-name', row, r.name);
      el('span', 'calc-val', row, Number.isFinite(r.value) ? r.value.toFixed(6) + (r.unit ? ' ' + r.unit : '') : '—');
      const res = el('span', 'calc-res', row, 'residual ' + (Number.isFinite(r.residual) ? r.residual.toExponential(2) : 'toy on'));
      el('span', 'calc-formula', row, r.formula);
      el('span', 'calc-law', row, r.law + (Number.isFinite(r.predicted) ? (r.derivative !== undefined ? `  ·  d/dt = ${r.derivative.toFixed(6)}, law says ${r.predicted.toFixed(6)}` : `  ·  predicted ${r.predicted.toFixed(6)}`) : ''));
      const tol = 1e-4 * (1 + Math.abs(r.predicted || 0));
      res.className = 'calc-res ' + (!Number.isFinite(r.residual) ? 'warn' : Math.abs(r.residual) < tol ? 'ok' : (r.name.startsWith('2⟨T⟩') ? '' : 'warn'));
    }
    el('div', 'calc-foot', table, `t = ${S.t.toFixed(3)} · ${S.ids} populated states · h = ${S.h}`);
  }
  function update(reg, t) {
    if (!on || table.clientWidth < 32) return;
    const key = `${reg.version}|${t.toFixed(4)}`;
    if (key === update.key) return;
    update.key = key; last = stats(reg, t); render(last);
  }
  return { update, get last() { return last; } };
}
