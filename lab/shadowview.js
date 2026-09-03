/* shadowview.js — the SHADOW view: the same c(t), read as real canonical coordinates.
 *
 * Three representations of one (q, p) state (§8): PHASORS (every populated mode as a rotating
 * phasor in one (q,p) plane), OSCILLATORS (each mode as a bead at q_a(t) on its own track —
 * for diagonal H they are uncoupled, and 1s visibly bobs four times faster than 2s), and
 * LISSAJOUS (q_a against q_b for the two largest populations, or the selected pair).
 * Nothing here integrates anything: the coordinates are read from the register's c(t).
 */
import { BASIS } from './hydrogen.js';
import { N_RGB } from './kit.js';
import { SQRT2 } from './shadow.js';

export function createShadowView(canvas, api) {
  const trail = [];            // Lissajous trace, in (q_a, q_b)
  let trailKey = '';
  let mode = 'phasors';
  const g = canvas.getContext('2d');
  function size() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = canvas.clientWidth, H = canvas.clientHeight;
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { W, H };
  }
  const rgba = (n, a) => { const c = N_RGB[n]; return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
  const label = (a) => BASIS[a].label;

  function update(c, t, ids, selected) {
    const { W, H } = size();
    /* a FOLDED window has no size: every radius below would go negative and canvas throws (which would kill the
       rest of the render loop — layout must never break the instrument, §24). Draw nothing and say nothing. */
    if (W < 32 || H < 32) return;
    g.clearRect(0, 0, W, H);
    g.font = '9px ui-monospace, monospace'; g.textBaseline = 'middle';
    if (!ids.length) { g.fillStyle = 'rgba(255,255,255,0.35)'; g.textAlign = 'center'; g.fillText('no populated modes', W / 2, H / 2); return; }
    const q = ids.map((a) => SQRT2 * c.re[a]), p = ids.map((a) => SQRT2 * c.im[a]);
    out.last = { t, ids: ids.slice(), q: q.slice(), p: p.slice() };      // what was drawn, for the lockstep proof
    let rmax = 1e-9; for (let i = 0; i < ids.length; i++) rmax = Math.max(rmax, Math.hypot(q[i], p[i]));
    if (mode === 'phasors') {
      const cx = W * 0.36, cy = H / 2, R = Math.min(W * 0.32, H / 2 - 14);
      g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(cx - R - 6, cy); g.lineTo(cx + R + 6, cy); g.moveTo(cx, cy - R - 6); g.lineTo(cx, cy + R + 6); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.4)'; g.textAlign = 'left'; g.fillText('q', cx + R + 8, cy); g.textAlign = 'center'; g.fillText('p', cx, cy - R - 10);
      for (let i = 0; i < ids.length; i++) {
        const a = ids[i], n = BASIS[a].n, r = Math.hypot(q[i], p[i]) / rmax * R;
        g.strokeStyle = rgba(n, 0.22); g.beginPath(); g.arc(cx, cy, r, 0, 2 * Math.PI); g.stroke();
      }
      for (let i = 0; i < ids.length; i++) {
        const a = ids[i], n = BASIS[a].n, x = cx + q[i] / rmax * R, y = cy - p[i] / rmax * R;
        g.strokeStyle = rgba(n, a === selected ? 1 : 0.85); g.lineWidth = a === selected ? 2.5 : 1.5;
        g.beginPath(); g.moveTo(cx, cy); g.lineTo(x, y); g.stroke();
        g.fillStyle = rgba(n, 1); g.beginPath(); g.arc(x, y, a === selected ? 4.5 : 3.5, 0, 2 * Math.PI); g.fill();
      }
      // legend: mode, angular velocity −E_a
      g.textAlign = 'left';
      let yy = 14;
      for (let i = 0; i < ids.length && yy < H - 8; i++) {
        const a = ids[i], n = BASIS[a].n;
        g.fillStyle = rgba(n, 1); g.fillText(`${label(a)}  ω = ${(-BASIS[a].E).toFixed(4)}`, W * 0.70, yy);
        g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillText(`(${q[i].toFixed(2)}, ${p[i].toFixed(2)})`, W * 0.70, yy + 10);
        yy += 24;
      }
    } else if (mode === 'oscillators') {
      const n = ids.length, left = 26, right = W - 10, top = 16, bot = H - 22, mid = (top + bot) / 2, amp = (bot - top) / 2 - 4;
      const dx = (right - left) / n;
      g.strokeStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.moveTo(left - 8, mid); g.lineTo(right, mid); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.4)'; g.textAlign = 'right'; g.fillText('q', left - 10, top); g.fillText('0', left - 10, mid);
      for (let i = 0; i < n; i++) {
        const a = ids[i], nn = BASIS[a].n, x = left + dx * (i + 0.5);
        const r = Math.hypot(q[i], p[i]) / rmax;
        g.strokeStyle = rgba(nn, 0.25); g.lineWidth = 3; g.beginPath(); g.moveTo(x, mid - r * amp); g.lineTo(x, mid + r * amp); g.stroke();
        g.strokeStyle = 'rgba(255,255,255,0.10)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, top); g.lineTo(x, bot); g.stroke();
        const y = mid - q[i] / rmax * amp;
        g.fillStyle = rgba(nn, 1); g.beginPath(); g.arc(x, y, a === selected ? 7 : 5.5, 0, 2 * Math.PI); g.fill();
        g.textAlign = 'center'; g.fillText(label(a), x, bot + 8);
        g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillText('ω ' + (-BASIS[a].E).toFixed(3), x, bot + 17);
      }
    } else {   // lissajous
      let ia = 0, ib = Math.min(1, ids.length - 1);
      /* populations from the register's anchor: constant in time, so equal weights cannot flicker the pair */
      const pops = ids.map((a) => api.reg.population(a));
      const order = ids.map((_, i) => i).sort((x, y) => (pops[y] - pops[x]) || (x - y));
      ia = order[0]; ib = order.length > 1 ? order[1] : order[0];
      const si = ids.indexOf(selected);
      if (si >= 0 && si !== ia) ib = si;
      const key = ids[ia] + ':' + ids[ib];
      if (key !== trailKey) { trail.length = 0; trailKey = key; }
      const cx = W / 2, cy = H / 2, R = Math.min(W / 2, H / 2) - 18;
      const ra = Math.hypot(q[ia], p[ia]) || 1e-9, rb = Math.hypot(q[ib], p[ib]) || 1e-9;
      trail.push([q[ia] / ra, q[ib] / rb]); if (trail.length > 900) trail.shift();
      g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(cx - R, cy); g.lineTo(cx + R, cy); g.moveTo(cx, cy - R); g.lineTo(cx, cy + R); g.stroke();
      g.strokeRect(cx - R, cy - R, 2 * R, 2 * R);
      for (let i = 1; i < trail.length; i++) {
        const f = i / trail.length;
        g.strokeStyle = `rgba(120,225,240,${(0.05 + 0.9 * f * f).toFixed(3)})`;
        g.beginPath(); g.moveTo(cx + trail[i - 1][0] * R, cy - trail[i - 1][1] * R); g.lineTo(cx + trail[i][0] * R, cy - trail[i][1] * R); g.stroke();
      }
      const x = cx + trail[trail.length - 1][0] * R, y = cy - trail[trail.length - 1][1] * R;
      g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, 4, 0, 2 * Math.PI); g.fill();
      g.textAlign = 'left'; g.fillStyle = rgba(BASIS[ids[ia]].n, 1); g.fillText('q ' + label(ids[ia]) + ' →', cx + R - 60, cy + R + 9);
      g.save(); g.translate(cx - R - 9, cy - R + 40); g.rotate(-Math.PI / 2); g.fillStyle = rgba(BASIS[ids[ib]].n, 1); g.fillText('q ' + label(ids[ib]) + ' →', 0, 0); g.restore();
      const ratio = BASIS[ids[ia]].E / BASIS[ids[ib]].E;
      g.fillStyle = 'rgba(255,255,255,0.5)'; g.textAlign = 'right'; g.fillText('ω ratio ' + ratio.toFixed(3), cx + R, cy - R - 8);
    }
  }
  const out = { update, setMode(m) { mode = m; trail.length = 0; }, get mode() { return mode; }, clearTrail() { trail.length = 0; }, last: null };
  return out;
}
