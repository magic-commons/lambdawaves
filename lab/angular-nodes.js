/* angular-nodes.js — ANGULAR NODES (0.6.3 E2): Y_lm's nodal set for one populated label on a sphere (R = half/2) in VORTEX's overlay. EXACT ANALYTIC:
 * latitudes = the l − |m| roots of P_l^{|m|}(cos θ) in (0, π) (sign changes on a 720-step θ scan offset half a step, bisected to the last bit); REAL =
 * Re Y_lm ∝ cos(|m|φ) (`ylm`), |m| great circles φ = (k + ½)π/|m|; COMPLEX = the latitudes, the poles nodal points when m ≠ 0. Wraps VORTEX's pass. */
import { BASIS, legendreP } from './hydrogen.js';
import { cameraKey, toScreen } from './field.js';
import { readout, seg, sw } from './mir/kit.js';

function angularNodes(l, m, { real = true } = {}) {
  const am = Math.abs(m), P = (th) => legendreP(l, am, Math.cos(th)), N = 720, latitudes = [];
  for (let i = 0; i + 1 < N; i++) {
    let a = Math.PI * (i + 0.5) / N, b = Math.PI * (i + 1.5) / N, fa = P(a); if (fa * P(b) >= 0) continue;
    for (let c = (a + b) / 2; c > a && c < b; c = (a + b) / 2) { const fc = P(c); if (fa * fc <= 0) b = c; else { a = c; fa = fc; } } latitudes.push(Math.abs(P(a)) <= Math.abs(P(b)) ? a : b);
  }
  return { latitudes, meridians: real ? Array.from({ length: am }, (_, k) => (k + 0.5) * Math.PI / am) : [], poles: !real && am > 0 };
}
/** latitudes and meridians as 96-segment circles on the sphere of radius R, the poles as dots; the far side (depth > the centre's) dimmed */
function drawAngularNodes(g, S, R, nodes, { ink = '255,190,90', width = 1.6 } = {}) {
  const c0 = S.at(0, 0, 0); if (!c0) return; const zc = c0[2], K = 96; g.lineWidth = width;
  const curve = (f) => { let p = null; for (let k = 0; k <= K; k++) { const q = S.at(...f(2 * Math.PI * k / K)); if (p && q) { g.strokeStyle = `rgba(${ink},${(p[2] + q[2]) / 2 > zc ? 0.22 : 0.9})`; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); } p = q; } };
  for (const th of nodes.latitudes) curve((u) => [R * Math.sin(th) * Math.cos(u), R * Math.sin(th) * Math.sin(u), R * Math.cos(th)]); for (const ph of nodes.meridians) curve((u) => [R * Math.sin(u) * Math.cos(ph), R * Math.sin(u) * Math.sin(ph), R * Math.cos(u)]);
  if (nodes.poles) for (const z of [R, -R]) { const q = S.at(0, 0, z); if (q) { g.fillStyle = `rgba(${ink},${q[2] > zc ? 0.3 : 0.95})`; g.beginPath(); g.arc(q[0], q[1], 3.2, 0, 2 * Math.PI); g.fill(); } }
}
/** VORTEX's third row: ANGULAR NODES · LABEL · REAL | COMPLEX · the count; returns VORTEX's pass wrapped (base = { update, suspend, drawOverlay, locating }) */
export function createAngularNodes(host, cv, base) {
  const g = cv.getContext('2d'); let key = '', ids = null, cur = null, at = null; const redo = () => { key = '?'; };
  const on = sw({ label: 'ANGULAR NODES', value: false, onChange: redo }), mode = seg({ label: 'Y_lm', value: 'real', options: [{ id: 'real', label: 'REAL' }, { id: 'complex', label: 'COMPLEX' }], onChange: redo });
  let pick = seg({ label: 'LABEL', options: [] }); const ro = readout({ label: 'LATITUDES · MERIDIANS', value: '—', sub: '' }); host.append(on.root, pick.root, mode.root, ro.root);
  function draw(obs) {
    if (!on.get() || base.locating()) { base.drawOverlay(obs); if (!on.get() || cv.width === 1 || !cur) return; } else { obs = obs || (at && at.obs); const W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1); if (!obs || !cur || W < 1 || H < 1) return; if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); } g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H); }
    drawAngularNodes(g, toScreen(obs || at.obs, at.half, cv.clientWidth, cv.clientHeight), at.half / 2, cur);
  }
  function update(reg, t, obs, half, playing) {
    base.update(reg, t, obs, half, playing); if (!on.get() && !key) return;
    const s = reg.renderSet().ids; if (!ids || s.join() !== ids.join()) { ids = s.slice(); const was = pick.get(), nx = seg({ label: 'LABEL', value: ids.map(String).includes(was) ? was : ids.length ? String(ids[0]) : '', options: ids.map((a) => ({ id: String(a), label: BASIS[a].label })), onChange: redo }); pick.root.replaceWith(nx.root); pick = nx; }
    at = { obs, half }; const k = on.get() ? [pick.get(), mode.get(), half, cameraKey(obs), obs.dist.toFixed(4), obs.fov, cv.clientWidth, cv.clientHeight].join('|') : '';
    if (k === key) return; key = k; const b = BASIS[+pick.get()]; cur = on.get() && b && pick.get() !== '' ? angularNodes(b.l, b.m, { real: mode.get() === 'real' }) : null;
    if (cur) { ro.set(`${cur.latitudes.length} latitudes · ${cur.meridians.length} meridians${cur.poles ? ' · poles' : ''}`); ro.setSub((cur.latitudes.length ? 'θ = ' + cur.latitudes.map((th) => (th * 180 / Math.PI).toFixed(2) + '°').join(', ') : 'no latitude') + ' · sphere r = half/2'); } else { ro.set('—'); ro.setSub(''); } draw(obs);
  }
  return { update, suspend() { key = on.get() ? '?' : ''; base.suspend(); }, drawOverlay: draw };
}
