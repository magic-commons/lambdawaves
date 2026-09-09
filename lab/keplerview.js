/* keplerview.js — the KEPLER overlay: the classical orbit each populated shell carries, drawn over the quantum cloud.
 *
 * The ellipse comes from the exact expectation values (kepler.js); the drawing uses the FIELD's camera so it sits
 * in the same space as the cloud.  Marked on it: the perihelion (toward ⟨K⟩) and the classical time-averaged
 * position, which is exactly the quantum ⟨x⟩ of the shell (Pauli).  Position space only.
 */
import { cameraBasis } from './field.js';
import { keplerOrbits, orbitPoints } from './kepler.js';
import { vividInk, showGraphTip, hideGraphTip, fitText } from './kit.js';

const N_RGB = { 2: [255, 190, 90], 3: [120, 225, 240], 4: [200, 140, 255], 5: [140, 240, 160], 6: [255, 120, 150] };

export function createKepler(canvas) {
  const cv = canvas, g = cv.getContext('2d');
  let on = false, orbits = [], lastKey = '';                    // off by default (Josh, 2026-09-04)
  let handles = [], hover = null;                       // the perihelion handles of the last draw (canvas pixels), and the hovered one
  let lastPointer = null;                               // where the rack last asked hit(): the tip goes there
  /* WAVE 46 — the caption used to carry every orbit's numbers in one line ("n2 a=4 e=0.833 L_orbit=1.73 vs
     ⟨L⟩=1.73 T=2π·8 · n3 …"), which ran off the stage as soon as two shells were lit.  The caption keeps the
     LAW and the legend; each orbit's numbers are on its own perihelion handle, through the shared tip.  This
     canvas is pointer-events: none, so the rack's own hit()/setHover() route drives it — no rack.js change. */
  function recompute(reg, t) {
    const key = `${reg.version}|${reg.field.Fz !== 0 ? t.toFixed(3) : 0}`;
    if (key === lastKey) return;
    lastKey = key;
    const c = reg.field.Fz !== 0 ? reg.at(t) : { re: reg.re0, im: reg.im0 };
    orbits = keplerOrbits(c.re, c.im, 0.01);
  }
  function draw(obs, half) {
    const W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (W < 32 || H < 32) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    handles = [];
    if (!on || !orbits.length) return;
    const B = cameraBasis(obs), D = obs.dist * half, cam = [B.dir[0] * D, B.dir[1] * D, B.dir[2] * D];
    const tanH = Math.tan((obs.fov || 0.6) / 2), aspect = W / H;
    const proj = (p) => {
      const dx = p[0] - cam[0], dy = p[1] - cam[1], dz = p[2] - cam[2];
      const depth = dx * B.fwd[0] + dy * B.fwd[1] + dz * B.fwd[2]; if (depth <= 0) return null;
      const u = (dx * B.right[0] + dy * B.right[1] + dz * B.right[2]) / (depth * tanH * aspect), v = (dx * B.up[0] + dy * B.up[1] + dz * B.up[2]) / (depth * tanH);
      return [(u + 1) / 2 * W, (1 - v) / 2 * H];
    };
    let label = [];
    for (const { share, orbit: o } of orbits) {
      if (o.isotropic) { label.push(`n${o.n} isotropic`); continue; }
      if (o.coherence < 0.5) { label.push(`n${o.n}: no classical orbit (coherence ${o.coherence.toFixed(2)} < ½)`); continue; }   // the mean vectors of an incoherent shell are not an orbit (Round 11 A5)
      const rgb = vividInk(N_RGB[o.n] || [255, 255, 255]), alpha = 0.35 + 0.6 * Math.min(1, share);
      const pts = orbitPoints(o, 160).map(proj);
      g.strokeStyle = `rgba(${rgb.join(',')},${alpha})`; g.lineWidth = 1.6; g.setLineDash(o.coherence > 0.98 ? [] : [5, 4]);
      g.beginPath(); let started = false;
      for (const q of pts) { if (!q) { started = false; continue; } if (!started) { g.moveTo(q[0], q[1]); started = true; } else g.lineTo(q[0], q[1]); }
      if (o.e < 1 - 1e-9) g.closePath();
      g.stroke(); g.setLineDash([]);
      const per = proj(o.perihelion), mean = proj(o.meanPosition);
      if (per) { g.fillStyle = `rgba(${rgb.join(',')},${alpha})`; g.beginPath(); g.arc(per[0], per[1], 3.2, 0, 2 * Math.PI); g.fill();
        handles.push({ n: o.n, x: per[0], y: per[1], orbit: o, share,
          info: `n${o.n}  ·  a = ${o.a} a₀  ·  e = ${o.e.toFixed(3)}  ·  L_orbit = ${o.Lorbit.toFixed(2)} vs ⟨L⟩ = ${o.absL.toFixed(2)}  ·  T = 2π·${o.n ** 3}${o.coherence > 0.98 ? '' : `  ·  dashed: not coherent (${o.coherence.toFixed(2)})`}` });
        if (hover && hover.n === o.n) { g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 1.2; g.beginPath(); g.arc(per[0], per[1], 9, 0, 2 * Math.PI); g.stroke(); } }
      if (mean) { g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(mean[0] - 5, mean[1]); g.lineTo(mean[0] + 5, mean[1]); g.moveTo(mean[0], mean[1] - 5); g.lineTo(mean[0], mean[1] + 5); g.stroke(); }
    }
    g.fillStyle = document.body.dataset.theme === 'light' ? 'rgba(20,30,50,0.62)' : 'rgba(255,255,255,0.45)'; g.font = '9px ui-monospace, monospace'; g.textAlign = 'left';
    const cx = document.body.classList.contains('rack-l') ? 12 + (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--rack-w')) || 300) + 8 : 12;
    /* the caption is the LAW and the legend, measured into the stage it has: the numbers are on the handles */
    if (!document.body.classList.contains('no-captions'))
      fitText(g, `KEPLER${label.length ? ' · ' + label.join(' · ') : ''} · dot = perihelion (⟨K⟩) — drag it: around = D(R) about L̂, in/out = e^{−iθK} (exact rotors on the state) · cross = ⟨x⟩ (exact)`,
        cx, H - 128, { x0: cx, y0: 0, x1: W - 12, y1: H }, 'left', true);
  }
  /* ── the IMPULSE VECTOR (wave 53; `bow` is still its name in the code): drawn over everything while ctrl+drag is held ── */
  let bow = null;
  function setBow(b) { bow = b; }
  function bowFrame() {
    if (!bow) return;
    const W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (W < 32 || H < 32) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1.5; g.setLineDash([6, 4]); g.beginPath(); g.moveTo(bow.x0, bow.y0); g.lineTo(bow.x1, bow.y1); g.stroke(); g.setLineDash([]);
    const dx = bow.x0 - bow.x1, dy = bow.y0 - bow.y1, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, len = Math.min(160, 30 + 70 * bow.k);
    const ax = bow.x0 + ux * len, ay = bow.y0 + uy * len;
    g.strokeStyle = 'rgba(120,225,240,0.95)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(bow.x0, bow.y0); g.lineTo(ax, ay); g.stroke();
    g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax - ux * 11 - uy * 6, ay - uy * 11 + ux * 6); g.lineTo(ax - ux * 11 + uy * 6, ay - uy * 11 - ux * 6); g.closePath(); g.fillStyle = 'rgba(120,225,240,0.95)'; g.fill();
    g.beginPath(); g.arc(bow.x0, bow.y0, 4, 0, 2 * Math.PI); g.fillStyle = 'rgba(255,255,255,0.9)'; g.fill();
    g.fillStyle = 'rgba(255,255,255,0.92)'; g.font = '11px ui-monospace, monospace';
    /* the gesture's own readout, clamped into the stage: it used to run off the right edge from a bow drawn there */
    fitText(g, `IMPULSE VECTOR  k = ${bow.k.toFixed(3)} a.u. · λ = 2π/k = ${bow.k > 0.001 ? (2 * Math.PI / bow.k).toFixed(1) : '∞'} · release to apply · release CTRL to cancel`,
      bow.x1 + 12, bow.y1 - 10, { x0: 10, y0: 0, x1: W - 10, y1: H }, 'left', true);
  }
  function update(reg, t, obs, half) { recompute(reg, t); draw(obs, half); }
  function suspend() {
    handles = []; hover = null;
    hideGraphTip(cv);
    if (cv.width !== 1 || cv.height !== 1) { cv.width = 1; cv.height = 1; }
  }
  /** the perihelion handle under a canvas point (within 14 px), or null */
  function hit(x, y) { lastPointer = [x, y]; let best = null, bd = 14; for (const h of handles) { const d = Math.hypot(h.x - x, h.y - y); if (d < bd) { bd = d; best = h; } } return best; }
  /** the rack hands the hovered handle back here: that is where the orbit's own numbers are shown */
  function setHover(h) {
    hover = h;
    if (h && h.info && lastPointer) { const r = cv.getBoundingClientRect(); showGraphTip(cv, h.info, r.left + lastPointer[0], r.top + lastPointer[1]); }
    else hideGraphTip(cv);
  }
  return { update, suspend, setBow, bowFrame, get on() { return on; }, setOn(v) { on = !!v; }, get orbits() { return orbits; }, hit, setHover, get handles() { return handles; } };
}
