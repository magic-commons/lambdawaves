/* modulation/mod-cursor.js — THE MODULATION WINDOW'S CURSOR: the device curve editor's sibling to the timeline's cursor
 * (harvested from BASINS app/mod-cursor.js, branch basins-ui-fixes-2026-10-01, 2026-10-02; docs MODWINDOW-READOUT 10-01).
 *
 * It resolves one tuple from the pointer — the geometric inverse of X(t)/Y(v): where the hand points, not what the curve
 * reads there — or from the edit in flight (the dragged point's or handle's committed t, v).  It never writes to the
 * model; it reads only what the window's render() already put on rec.g.  timeline/readout.js paints what it returns.
 *   createModCursor({ rec, timeTextAt, inkOf }) → { resolve(ev), gesture() }
 *     rec          the device row: rec.g = { box, svg, w, h, X, Y, pts, sig }, rec.s the source, rec.drag
 *                  { kind: 'point' | 'handle', index } | null (set and cleared by the window's editor gestures)
 *     timeTextAt(s, u)  the period's own unit (beats synced, seconds free) — the window's, so this stays ignorant of BPM
 *     inkOf(rec)   the curve's own computed stroke colour */
import { svgPoint } from './curve-gesture.js';
import { evaluate as curveEval } from './curve.js';
import { GEOM } from './modwindow/modwindow.js';
import { formatPercent } from '../timeline/time-format.js';

const PAD = GEOM.PAD;
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function createModCursor({ rec, timeTextAt, inkOf }) {
  function frame(u, v, box, held) {
    const g = rec.g, ink = inkOf(rec);
    const x = box.left + g.X(u) * box.width / g.w, y = box.top + g.Y(v) * box.height / g.h;
    return {
      state: held ? 'held' : 'hover', track: null,
      vLine: { x, top: box.top, bottom: box.bottom, ink },
      hLine: { y, left: box.left, right: box.right, ink },
      clip: { rect: box, ink, timeText: timeTextAt(rec.s, u), valueText: formatPercent(v, held) }
    };
  }
  function resolve(ev) {
    const g = rec.g;
    if (!ev || !Number.isFinite(ev.clientX) || !g || !g.svg.isConnected) return null;
    const box = g.svg.getBoundingClientRect();
    if (ev.clientX < box.left || ev.clientX > box.right || ev.clientY < box.top || ev.clientY > box.bottom) return null;
    const p = svgPoint(g.svg, ev);
    const u = clamp01((p.x - PAD) / Math.max(1, g.w - 2 * PAD));
    const v = clamp01(1 - (p.y - PAD) / Math.max(1, g.h - 2 * PAD));
    return frame(u, v, box, false);
  }
  function gesture() {
    const g = rec.g, drag = rec.drag, pts = g && g.pts;
    if (!drag || !pts || !pts.length) return null;
    let t, v;
    if (drag.kind === 'handle') {
      const a = pts[drag.index], b = pts[drag.index + 1];
      if (!a || !b) return null;
      t = (a.t + b.t) / 2; v = curveEval(pts, t);
    } else {
      const pt = pts[drag.index];
      if (!pt) return null;
      t = pt.t; v = pt.v;
    }
    return frame(clamp01(t), clamp01(v), g.svg.getBoundingClientRect(), true);
  }
  return { resolve, gesture };
}
