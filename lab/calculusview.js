/* calculusview.js — the CALCULUS window: the statistics, derived live, each a TILE — RADIATION's skin (0.4.0 S3 · F3: the kit's
 * readout tiles, here in a grid of two columns on the card and three floating, opted out of LEAN so a first visit sees them):
 * the value, the residual its law leaves, and the formula and the law on its hover.  ⧉ copies the PROSE FIGURE
 * (calculus.js calculusMarkdown), which pastes into the notebook and renders.  Nothing here is drawn from the picture: every
 * number is computed from the register with exact matrix elements, the derivatives centred differences of the exact evolution.
 */
import { stats, rayAt, expectR, radialBreath } from './calculus.js'; import { getHamiltonian } from './hamiltonian.js'; import { revivalClocks } from './frontier.js'; import { PRESET_BY_ID } from './state.js';
import { el, readout, sw, mathText, trig } from './mir/kit.js';

export function createCalculus(host, opt = {}) {
  let on = true, last = null, key = '';
  const r0 = el('div', 'row tight', host);
  r0.appendChild(sw({ label: 'LIVE', value: true, title: 'recompute every update (throttled while playing)', onChange: (v) => { on = v; } }).root);
  const grid = el('div', 'calc-grid', host), ray = readout({ label: 'RAY  Re ψ · Im ψ · |ψ|²  from the origin through the bead', value: '—', cls: 'wide calc-ray' }), foot = el('div', 'calc-foot', host);
  const cv = el('canvas', '', ray.root), g = cv.getContext('2d'); host.insertBefore(ray.root, foot);   // 0.8.2 P3: ψ ALONG A RAY, 128 closed-form samples, each curve over the ray's max |ψ|
  /* 0.8.3 B1 · THE BREATH: P(r, t) over [0, half] in the kit's ink, its scale the register version's running max, and its two integrals against stats' ⟨r⟩; REVIVAL (a hand press, never at boot) is
     ONE verb list, ONE history row: the radial packet `rydberg-s`, RATE = T_cl a.u. a second (the `rate` verb consults the flash law and says why it holds), play */
  const br = readout({ label: 'BREATH  P(r, t) = r² Σ_lm |Σ_n c_nlm(t) R_nl(r)|²', value: '—', cls: 'wide calc-ray' }), bv = el('canvas', '', br.root), bg = bv.getContext('2d'), rv = el('div', 'row tight', br.root); host.insertBefore(br.root, foot); let bKey = -1, bMax = 0;
  const rvLine = el('span', 'calc-rev'); rv.append(trig({ label: 'REVIVAL', title: "STATE's radial Rydberg packet (ns, n = 4…6), RATE so one classical period T_cl = 2πn̄³ takes a second, the clock playing", onFire: async () => {
    const m = PRESET_BY_ID.get('rydberg-s').modes, w = m.reduce((s, q) => s + q.amp * q.amp, 0), nb = m.reduce((s, q) => s + q.n * q.amp * q.amp, 0) / w, { Tcl, Trev } = revivalClocks(nb);
    const r = opt.revival ? await opt.revival([{ verb: 'preset', args: { id: 'rydberg-s' } }, { verb: 'rate', args: { value: Tcl } }, { verb: 'play', args: { on: true } }]) : { refused: [] };
    rvLine.textContent = `n̄ ${nb.toFixed(2)} · T_cl = 2πn̄³ = ${Tcl.toFixed(0)} a.u. · T_rev = 4πn̄⁴/3 = (2n̄/3)·T_cl = ${Trev.toFixed(0)} a.u. (LADDER's law, exact to quadratic order in n − n̄)` + r.refused.map((x) => ' · ' + x.why).join(''); } }).root, rvLine);
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
  function update(reg, t, half = 1, p = false, mol = false) {
    if (!on) return;
    const k = `${reg.version}|${t.toFixed(4)}|${half}|${p}|${mol}`;
    if (k === key) return;
    key = k; const H = getHamiltonian(), why = mol ? 'a molecule: the ray stands down this cut (the AO evaluator is not free on the frame thread)' : p && H.phiAt === H.psiAt ? 'momentum space: this operator\'s φ(p) is not on the road (its ψ(x) without the phase)' : '';
    if (!mol) { last = stats(reg, t); render(last); } breath(reg, t, half, p, mol); if (why) { ray.set('—'); cv.width = 0; return ray.setSub(why); }
    const c = reg.at(t), ids = reg.populated(), r = p ? expectR(c.re, c.im, ids, true) : last.r, n = Math.hypot(...r), u = n < 1e-3 ? [0, 0, 1] : r.map((v) => v / n), S = rayAt(c.re, c.im, ids, u, half, p), m = Math.max(1e-300, ...S.map((q) => Math.hypot(q.re, q.im)));
    const W = cv.clientWidth || 240, Hh = 56, d = Math.min(2, window.devicePixelRatio || 1), cs = getComputedStyle(document.body), ink = cs.getPropertyValue('--fg').trim() || cs.color, acc = cs.getPropertyValue('--acc').trim() || ink;
    cv.width = Math.round(W * d); cv.height = Hh * d; g.setTransform(d, 0, 0, d, 0, 0); g.lineWidth = 1.25;
    for (const [f, col, a] of [[() => 0, ink, 0.15], [(q) => q.re / m, ink, 1], [(q) => q.im / m, ink, 0.4], [(q) => (q.re * q.re + q.im * q.im) / (m * m), acc, 1]]) { g.strokeStyle = col; g.globalAlpha = a; g.beginPath(); S.forEach((q, i) => g[i ? 'lineTo' : 'moveTo'](i * W / (S.length - 1), Hh / 2 - f(q) * (Hh / 2 - 2))); g.stroke(); }
    ray.set(`0 → ${half.toFixed(1)} ${p ? 'ħ/a₀' : H.lengthUnit}`); ray.setSub(`along (${u.map((v) => v.toFixed(2)).join(', ')}) · ${p ? '⟨p⟩' : '⟨r⟩'} = (${r.map((v) => v.toFixed(3)).join(', ')}) · max |ψ| ${m.toExponential(2)}`);
  }
  function breath(reg, t, half, p, mol) {   // 0.8.3 B1: a molecule and momentum space stand down with a sentence
    if (mol || p) { br.set('—'); bv.width = 0; return br.setSub(mol ? 'a molecule: the breath reads the atom register' : 'momentum space: the breath is P(r, t); P(p, t) is a later row'); }
    const B = radialBreath(reg, t, half), r0 = last.rows.find((q) => q.name === '⟨r⟩').value, W = bv.clientWidth || 240, Hh = 56, d = Math.min(2, window.devicePixelRatio || 1), cs = getComputedStyle(document.body);
    if (reg.version !== bKey) { bKey = reg.version; bMax = 0; } for (let k = 0; B.r[k] <= half; k++) bMax = Math.max(bMax, B.P[k]);
    bv.width = Math.round(W * d); bv.height = Hh * d; bg.setTransform(d, 0, 0, d, 0, 0); bg.lineWidth = 1.25; bg.strokeStyle = cs.getPropertyValue('--fg').trim() || cs.color; bg.beginPath();
    for (let k = 0; B.r[k] <= half; k++) bg[k ? 'lineTo' : 'moveTo'](B.r[k] / half * W, Hh - 2 - B.P[k] / (bMax || 1) * (Hh - 4)); bg.stroke();
    br.set(`0 → ${half.toFixed(1)} ${getHamiltonian().lengthUnit}`); br.setSub(`∫P = ${B.norm.toFixed(9)} · ∫rP/∫P = ${B.rMean.toFixed(4)} = ⟨r⟩ (Δ ${Math.abs(B.rMean - r0).toExponential(0)})`);
  }
  return { update, get last() { return last; } };
}
