/* bloch.js — BLOCH (0.8.1 T1): ONE qubit in a window of LADDER's kind — its own register and canvas, nothing touching the main register, the field or the camera except
 * to read t and the camera's basis.  The Bloch vector (⟨σ_x⟩, ⟨σ_y⟩, ⟨σ_z⟩) on ORBIT's sphere painter in n = 2's colour (ORBIT's two spheres at n = 2 ARE Bloch spheres),
 * its trail over the last period, the drive's axis fainter; the qubit is bloch-model.js', its t the transport clock's from the moment a preset or a knob was set. */
import { PRESETS, DEFAULTS, DT, run, vec, closed, lzP, halve, pulse, phase } from './bloch-model.js';
import { cameraBasis, cameraKey } from './field.js'; import { project, sphereFrame, arm } from './orbit.js'; import { el, knob, readout, seg, themeInk, nRGB } from './mir/kit.js';
export let BL = null;   // the one handle (persist, the verb): the app literal never gains a key
const KN = { w0: ['ω₀', 0.2, 4], O: ['Ω', 0, 2], d: ['δ', -8, 8], b: ['β', -0.5, 0.5], th: ['θ₀', 0, Math.PI], ph: ['φ₀', 0, 2 * Math.PI] };
const LABEL = { flop: 'FLOP', larmor: 'LARMOR', rabi: 'RABI', lz: 'LANDAU–ZENER' }, pick = (id) => ({ w0: 1, ...PRESETS[id], preset: id });
export function createBloch(host, api) {
  const P = { ...DEFAULTS }, ui = {}; let t0 = 0, tt = 0, K = null, trail = [], lastKey = '';
  const pre = seg({ aria: 'Bloch preset', value: P.preset, options: Object.keys(PRESETS).map((id) => ({ id, label: LABEL[id] })), onChange: (id) => set(pick(id)) });
  pre.root.addEventListener('click', (e) => { if (e.target.closest('.seg-b.on')) set(pick(P.preset)); }, true);   // a tap on the lit preset runs it again (tap FLOP)
  host.append(pre.root); const r1 = el('div', 'row', host);
  for (const [k, [label, min, max]] of Object.entries(KN)) r1.appendChild((ui[k] = knob({ label, min, max, value: P[k], fmt: (v) => v.toFixed(k === 'b' ? 3 : 2), onInput: (v) => set({ [k]: v }) })).root);
  const hold = el('div', 'ladder-c', host), cv = el('canvas', '', hold); hold.style.height = '180px';
  const ro = { p: readout({ label: 'P↓  measured · closed form', value: '—', cls: 'wide' }), lz: readout({ label: 'LANDAU–ZENER  1 − e^(−πΩ²/2β)', value: '—', cls: 'wide' }), st: readout({ label: 'STEP  dt against dt/2', value: '—' }) };
  const r2 = el('div', 'row tight', host); for (const r of Object.values(ro)) r2.appendChild(r.root);
  el('div', 'note', host).innerHTML = '<b>Units.</b> ħ = 1, and ω₀ = 1 sets the unit of t, the transport clock’s from the moment a preset or a knob was set. The picture is the lab frame; the faint axis is (Ω cos φ, Ω sin φ, ω₀ − ω), the field the spin turns about in the frame turning with the drive — an exact change of frame, the drive being circular (no rotating-wave approximation).';
  function set(p) {
    Object.assign(P, p); for (const k in KN) ui[k].set(P[k]); pre.set(P.preset); t0 = api.t(); K = null; trail = []; lastKey = ''; const h = halve(P);
    ro.st.set(h.d.toExponential(1), h.d > 1e-6 ? 'warn' : 'ok'); ro.st.setSub(h.d > 1e-6 ? 'step too coarse' : `dt = ${DT} · the run to t = ${h.T.toFixed(1)}`); ro.lz.root.style.display = P.b ? '' : 'none'; update(api.t());
  }
  function update(t) {
    tt = Math.max(0, t - t0); const B = cameraBasis(api.obs), key = `${tt}|${cameraKey(api.obs)}|${hold.clientWidth}`; if (key === lastKey) return; lastKey = key;
    let s; if (P.b) { const g = Math.floor(tt / DT) * DT; if (!K || K.t > g) K = null; K = run(P, g, DT, K); s = run(P, tt, DT, K).s; } else s = run(P, tt).s;   // a chirp steps on from the kept grid point
    const v = vec(P, s, tt), pm = s[2] ** 2 + s[3] ** 2, per = 2 * Math.PI / Math.min(P.w0, Math.hypot(P.O, P.d) || P.w0), tp = pulse(P);
    if (trail.length && trail[trail.length - 1][0] > tt) trail = []; trail.push([tt, v]); while (trail.length > 900 || trail[0][0] < tt - per) trail.shift();
    if (!P.b) { const c = closed(P, tt); ro.p.set(`${pm.toFixed(6)} · ${((1 - c[2]) / 2).toFixed(6)}`);
      ro.p.setSub((tt < tp && P.O ? (P.th ? 'r₀ turned about (Ω, 0, −δ) by √(Ω²+δ²)·t' : 'Ω²/(Ω²+δ²)·sin²(√(Ω²+δ²)·t/2)') : `precession by ω₀t = ${(P.w0 * tt).toFixed(2)} rad · P↓ held`) + (tp < Infinity ? ` · π-pulse τ = π/Ω = ${tp.toFixed(2)}` : '') + ` · |Δr| = ${Math.hypot(v[0] - c[0], v[1] - c[1], v[2] - c[2]).toExponential(1)}`); }
    else { const x = -P.d / P.b, thru = x > 0 && tt >= 2 * x; ro.p.set(`${pm.toFixed(6)} · —`); ro.p.setSub(`a chirp has no closed form at finite t · ω − ω₀ = ${(P.d + P.b * tt).toFixed(2)}`);
      ro.lz.set(`${lzP(P).toFixed(4)} PREDICTION · ${thru ? pm.toFixed(4) + ' measured' : 'sweeping'}`, thru ? 'ok' : '');
      ro.lz.setSub(x <= 0 ? 'resonance is behind: δ and β have one sign' : thru ? `a finite sweep δ → −δ leaves wiggles of order Ω/|δ| = ${(P.O / Math.abs(P.d)).toFixed(3)}; the asymptote is ±∞’s` : `through resonance at t = ${x.toFixed(0)}, read at t = ${(2 * x).toFixed(0)}`); }
    paint(v, B, tt < tp ? P.O : 0);
  }
  function paint(v, B, O) {
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = hold.clientWidth, H = hold.clientHeight; if (W < 32 || H < 32) return;
    if (cv.width !== W * dpr || cv.height !== H * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
    const g = cv.getContext('2d'), T = themeInk(g), R = H / 2 - 16, cx = W / 2, cy = H / 2, f = phase(P, tt), a = [O * Math.cos(f), O * Math.sin(f), -(P.d + P.b * tt)], m = Math.hypot(...a), col = nRGB(2), rgba = (q) => `rgba(${col[0]},${col[1]},${col[2]},${q})`;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H); g.font = '9px ui-monospace, monospace'; g.textBaseline = 'middle'; sphereFrame(g, T, B, cx, cy, R);
    if (m > 1e-12) arm(g, cx, cy, R, project(a.map((u) => u / m), B), T.ink(0.3), T.ink(0.3));
    g.strokeStyle = rgba(0.45); g.lineWidth = 1.25; g.beginPath(); trail.forEach(([, u], i) => { const p = project(u, B); g[i ? 'lineTo' : 'moveTo'](cx + p[0] * R, cy - p[1] * R); }); g.stroke();
    arm(g, cx, cy, R, project(v, B), rgba(0.9), rgba(1));
  }
  new ResizeObserver(() => { lastKey = ''; update(api.t()); }).observe(hold);
  set({});
  return (BL = { update, set, pick, params: P, ro: Object.values(ro), get label() { return LABEL[P.preset]; },
    save() { const d = {}; for (const k in DEFAULTS) if (P[k] !== DEFAULTS[k]) d[k] = P[k]; return Object.keys(d).length ? d : undefined; },
    load(I) { const q = { ...DEFAULTS }; for (const k in q) if (I && typeof I[k] === typeof q[k]) q[k] = I[k]; if (!PRESETS[q.preset]) q.preset = DEFAULTS.preset; set(q); } });
}
