/* calculusview.js — the CALCULUS window: the statistics, derived live, each a TILE — RADIATION's skin (0.4.0 S3 · F3: the kit's
 * readout tiles, here in a grid of two columns on the card and three floating, opted out of LEAN so a first visit sees them):
 * the value, the residual its law leaves, and the formula and the law on its hover.  ⧉ copies the PROSE FIGURE
 * (calculus.js calculusMarkdown), which pastes into the notebook and renders.  Nothing here is drawn from the picture: every
 * number is computed from the register with exact matrix elements, the derivatives centred differences of the exact evolution.
 */
import { stats, rayAt, expectR, radialBreath } from './calculus.js'; import { getHamiltonian } from './hamiltonian.js'; import { revivalClocks } from './frontier.js'; import { PRESET_BY_ID } from './state.js';
import { el, readout, sw, mathText, trig, label } from './mir/kit.js';
import { covariance } from './calculus.js'; import { BASIS } from './hydrogen.js';   // 0.8.3 B3: THE ELLIPSOID's line
import { traceOf, fmtPeriod } from './period.js';   // 0.8.3 B2: THE A(t) TRACE

export function createCalculus(host, opt = {}) {
  let on = true, last = null, key = '';
  const r0 = el('div', 'row tight', host);
  r0.appendChild(sw({ label: 'LIVE', value: true, title: 'recompute every update (throttled while playing)', onChange: (v) => { on = v; } }).root);
  const grid = el('div', 'calc-grid', host), ray = readout({ label: 'RAY  Re ψ · Im ψ · |ψ|²  from the origin through the bead', value: '—', cls: 'wide calc-ray' }), foot = el('div', 'calc-foot', host);
  const cv = el('canvas', '', ray.root), g = cv.getContext('2d'); host.insertBefore(ray.root, foot);   // 0.8.2 P3: ψ ALONG A RAY, 128 closed-form samples, each curve over the ray's max |ψ|
  /* 0.8.3 B1 · THE BREATH: P(r, t) over [0, half] in the kit's ink, its scale the register version's running max, and its two integrals against stats' ⟨r⟩; REVIVAL (a hand press, never at boot) is
     ONE verb list, ONE history row: the radial packet `rydberg-s`, RATE = T_cl a.u. a second (the `rate` verb consults the flash law and says why it holds), play */
  const BL = ['BREATH  P(r, t) = r² Σ_lm |Σ_n c_nlm(t) R_nl(r)|²', 'BREATH  P(p, t) = p² Σ_lm |Σ_n c_nlm(t) F_nl(p)|²'], br = readout({ label: BL[0], value: '—', cls: 'wide calc-ray' }), bv = el('canvas', '', br.root), bg = bv.getContext('2d'), rv = el('div', 'row tight', br.root); host.insertBefore(br.root, foot); let bKey = '', bMax = 0, bLab = false;
  const rvLine = el('span', 'calc-rev'); rv.append(trig({ label: 'REVIVAL', title: "Radial Rydberg packet, one period a second", onFire: async () => {
    const m = PRESET_BY_ID.get('rydberg-s').modes, w = m.reduce((s, q) => s + q.amp * q.amp, 0), nb = m.reduce((s, q) => s + q.n * q.amp * q.amp, 0) / w, { Tcl, Trev } = revivalClocks(nb);
    const r = opt.revival ? await opt.revival([{ verb: 'preset', args: { id: 'rydberg-s' } }, { verb: 'rate', args: { value: Tcl } }, { verb: 'play', args: { on: true } }]) : { refused: [] };
    rvLine.textContent = `n̄ ${nb.toFixed(2)} · T_cl = 2πn̄³ = ${Tcl.toFixed(0)} a.u. · T_rev = 4πn̄⁴/3 = (2n̄/3)·T_cl = ${Trev.toFixed(0)} a.u. (LADDER's law, exact to quadratic order in n − n̄)` + r.refused.map((x) => ' · ' + x.why).join(''); } }).root, rvLine);
  el('div', 'note', host).innerHTML = '<b>Interpretation.</b> Each tile compares a measured change with the law that predicts it; the residual includes basis truncation, quadrature and the centred finite-difference error. In the box it also contains the wall force. A tile without a residual is a moment, not a law.';
  /* OPTIMIZATION 2026-09-24 · LA10 · THE TILES ARE KEPT: built once per set of rows (the names change only with the operator
     or a field), and each update writes only the strings that changed — the readouts' own dirty checks, and the class here. */
  let tiles = [], names = '', footS;
  /* 0.8.3 B2 · THE A(t) TRACE (period.js traceOf): 512 samples over ONE REPEATS period, rebuilt only when its key moves (the register, the field, the operator, the period,
     the equalizer's table; never in a frame); the clock's t the cursor, the revivals dots, the hover t and A.  Its source is readouts.js' `calculus.trace`. */
  const at = readout({ label: 'A(t)  |⟨ψ(0)|ψ(t)⟩|²  over one REPEATS period · t = 0 the anchor, as REPEATS counts its laps', value: '—', cls: 'wide calc-ray' }), acv = el('canvas', '', at.root), ag = acv.getContext('2d');
  host.insertBefore(at.root, foot); let tr = null, tk = '', dk = '', tG = null;
  acv.addEventListener('pointermove', (e) => { if (!tr) return; const N = tr.A.length, w = acv.clientWidth || 1, i0 = Math.round(e.offsetX / w * (N - 1)), j = tr.peaks.find((q) => Math.abs(q - i0) * w / (N - 1) < 6), i = j ?? i0;
    acv.title = `t = ${tr.t[i].toFixed(2)} a.u. (${(tr.t[i] / tr.T).toFixed(3)} T) · A = ${tr.A[i].toFixed(6)}${j === undefined ? '' : ' · a revival'}`; });
  function trace(src, reg, t, mol) {
    const S = src ? src() : {}, P = S.P, why = mol ? 'a molecule: the STATES register\'s autocorrelation is a later row' : reg.transition ? 'an A ↔ B transition: the mix has its own clock (the Rabi period)' : '';
    if (why) { tr = null; tk = dk = ''; acv.width = 0; at.set('—'); return at.setSub(why); }
    const k = `${reg.version}|${reg.field.Fz}|${reg.field.Bz}|${P && P.T}|${getHamiltonian().id}`, W = acv.clientWidth || 240;
    if (k !== tk || S.T !== tG) { tk = k; tG = S.T; dk = ''; tr = traceOf(reg, P, S.g2); }
    const T = tr.T, N = tr.A.length, c = ((t % T) + T) % T, d2 = `${t.toFixed(4)}|${W}`; if (d2 === dk) return; dk = d2;
    const Hh = 56, d = Math.min(2, window.devicePixelRatio || 1), cs = getComputedStyle(document.body), ink = cs.getPropertyValue('--fg').trim() || cs.color, acc = cs.getPropertyValue('--acc').trim() || ink, x = (i) => i * W / (N - 1), y = (a) => Hh - 2 - a * (Hh - 4);
    acv.width = Math.round(W * d); acv.height = Hh * d; ag.setTransform(d, 0, 0, d, 0, 0); ag.lineWidth = 1.25; ag.strokeStyle = ink; ag.beginPath(); tr.A.forEach((a, i) => ag[i ? 'lineTo' : 'moveTo'](x(i), y(a))); ag.stroke();
    ag.fillStyle = ag.strokeStyle = acc; for (const i of tr.peaks) { ag.beginPath(); ag.arc(x(i), y(tr.A[i]), 2.5, 0, 7); ag.fill(); } ag.beginPath(); ag.moveTo(c / T * W, 0); ag.lineTo(c / T * W, Hh); ag.stroke();
    at.set(fmtPeriod(T)); at.setSub(`${tr.src} · ${S.g2 ? 'coherences damped: the envelope is the model\'s · A(0) = PURITY ' + tr.A[0].toFixed(3) : S.signed ? 'a signed table is no state: the register\'s own trace' : 'exact |Σ p e^{−iEt}|²'} · now A = ${(S.g2 ? tr.A[Math.round(c / T * (N - 1))] : reg.autocorrelation(t).abs ** 2).toFixed(4)} · ${tr.peaks.length} revivals${tr.turns > 128 ? ` · the fastest beat turns ${tr.turns.toFixed(0)}×: 512 samples alias it` : ''}`);
  }
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
    trace(this && this.trace, reg, t, mol);   // 0.8.3 B2: A(t) on its own key; `this` is the object returned below, readouts.js sets its `trace`
    const k = `${reg.version}|${t.toFixed(4)}|${half}|${p}|${mol}`;
    if (k === key) return;
    key = k; const H = getHamiltonian(), why = mol ? 'a molecule: the ray stands down this cut (the AO evaluator is not free on the frame thread)' : p && H.phiAt === H.psiAt ? 'momentum space: this operator\'s φ(p) is not on the road (its ψ(x) without the phase)' : '';
    const sep = H.separable && 'a separable system: its radial tiles stand down';   // 0.9.4 S1: the moments, the breath and the ellipsoid read H.radial; the ray reads ψ
    if (sep) { last = null; for (const x of [...tiles, br, ell]) { x.set('—'); x.setSub(sep); } bv.width = 0; } else { if (!mol) { last = stats(reg, t); render(last); } breath(reg, t, half, p, mol); ellLine(reg, t, p, mol, H); } if (why) { ray.set('—'); cv.width = 0; return ray.setSub(why); }
    const c = reg.at(t), ids = reg.populated(), r = p ? expectR(c.re, c.im, ids, true) : last ? last.r : [0, 0, 0], n = Math.hypot(...r), u = n < 1e-3 ? [0, 0, 1] : r.map((v) => v / n), S = rayAt(c.re, c.im, ids, u, half, p), m = Math.max(1e-300, ...S.map((q) => Math.hypot(q.re, q.im)));
    const W = cv.clientWidth || 240, Hh = 56, d = Math.min(2, window.devicePixelRatio || 1), cs = getComputedStyle(document.body), ink = cs.getPropertyValue('--fg').trim() || cs.color, acc = cs.getPropertyValue('--acc').trim() || ink;
    cv.width = Math.round(W * d); cv.height = Hh * d; g.setTransform(d, 0, 0, d, 0, 0); g.lineWidth = 1.25;
    for (const [f, col, a] of [[() => 0, ink, 0.15], [(q) => q.re / m, ink, 1], [(q) => q.im / m, ink, 0.4], [(q) => (q.re * q.re + q.im * q.im) / (m * m), acc, 1]]) { g.strokeStyle = col; g.globalAlpha = a; g.beginPath(); S.forEach((q, i) => g[i ? 'lineTo' : 'moveTo'](i * W / (S.length - 1), Hh / 2 - f(q) * (Hh / 2 - 2))); g.stroke(); }
    ray.set(`0 → ${half.toFixed(1)} ${p ? 'ħ/a₀' : H.lengthUnit}`); ray.setSub(`along (${u.map((v) => v.toFixed(2)).join(', ')}) · ${p ? '⟨p⟩' : '⟨r⟩'} = (${r.map((v) => v.toFixed(3)).join(', ')}) · max |ψ| ${m.toExponential(2)}`);
  }
  const ell = readout({ label: 'ELLIPSOID  σ_k = √λ_k of Σ_ij = ⟨r_i r_j⟩ − ⟨r_i⟩⟨r_j⟩', value: '—', cls: 'wide calc-ray' }); host.insertBefore(ell.root, foot);   // 0.8.3 B3: tr Σ against ⟨r²⟩ − |⟨r⟩|² (⟨r²⟩ by its own road); one hydrogen label prints its exact n²(5n² + 1 − 3l(l + 1))/2Z²
  function ellLine(reg, t, p, mol, H) { const E = !mol && !p && covariance(reg, t), ids = reg.populated(), s = E && ids.length === 1 && H.id === 'hydrogen' && BASIS[ids[0]], tr = E && E.S[0][0] + E.S[1][1] + E.S[2][2], o = E && E.r2 - E.mean.reduce((q, v) => q + v * v, 0);
    ell.set(E ? `σ = (${[...E.lam].sort((a, b) => a - b).map((l) => Math.sqrt(Math.max(0, l)).toFixed(2)).join(', ')}) ${H.lengthUnit}` : '—'); ell.setSub(E ? `tr Σ = ${tr.toFixed(3)} ${Math.abs(tr - o) < 1e-8 ? '=' : '≠'} ⟨r²⟩ − |⟨r⟩|² = ${o.toFixed(3)} (Δ ${Math.abs(tr - o).toExponential(0)})` + (s ? ` · exact ${+(s.n * s.n * (5 * s.n * s.n + 1 - 3 * s.l * (s.l + 1)) / 2 / (H.k || 1) ** 2).toPrecision(6)}` : '') : mol ? 'a molecule: the ellipsoid stands down (its density\'s quadrupole is a later row)' : 'momentum space: the ellipsoid is the position\'s'); }
  function breath(reg, t, half, p, mol) {   // 0.8.3 B1 · 0.9.2 F2: momentum space draws P(p, t) for hydrogen and the oscillator; the box, ATOM and CENTRAL say so and draw P(r, t)
    if (mol) { br.set('—'); bv.width = 0; return br.setSub('a molecule: the breath reads the atom register'); }
    const H = getHamiltonian(), q = p && (H.id === 'hydrogen' || H.id === 'qho'), B = radialBreath(reg, t, half, 256, q), W = bv.clientWidth || 240, Hh = 56, d = Math.min(2, window.devicePixelRatio || 1), cs = getComputedStyle(document.body);
    if (bLab !== q) label(br.root.firstChild, BL[+(bLab = q)]); if (reg.version + '|' + q !== bKey) { bKey = reg.version + '|' + q; bMax = 0; } for (let k = 0; B.r[k] <= half; k++) bMax = Math.max(bMax, B.P[k]);
    bv.width = Math.round(W * d); bv.height = Hh * d; bg.setTransform(d, 0, 0, d, 0, 0); bg.lineWidth = 1.25; bg.strokeStyle = cs.getPropertyValue('--fg').trim() || cs.color; bg.beginPath();
    for (let k = 0; B.r[k] <= half; k++) bg[k ? 'lineTo' : 'moveTo'](B.r[k] / half * W, Hh - 2 - B.P[k] / (bMax || 1) * (Hh - 4)); bg.stroke();
    const ids = reg.populated(), s = q && H.id === 'hydrogen' && ids.length === 1 && BASIS[ids[0]], k = H.k || 1, r0 = !q && last.rows.find((x) => x.name === '⟨r⟩').value;
    br.set(`0 → ${half.toFixed(1)} ${q ? 'a.u.' : H.lengthUnit}`); br.setSub(q ? `∫P = ${B.norm.toFixed(9)} · ⟨p²⟩ = ${B.m2.toFixed(4)}` + (s ? ` (exact ${k === 1 ? '1/n²' : '(Zμ/n)²'} = ${+(k * k / s.n / s.n).toPrecision(6)})` : '')
      : (p ? 'momentum space: the breath is position\'s · ' : '') + `∫P = ${B.norm.toFixed(9)} · ∫rP/∫P = ${B.rMean.toFixed(4)} = ⟨r⟩ (Δ ${Math.abs(B.rMean - r0).toExponential(0)})`);
  }
  return { update, get last() { return last; } };
}
