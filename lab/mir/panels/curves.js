/* panels/curves.js — THE CURVES PANEL: Photoshop's curves, as a rack card on any picture (docs/PANEL-CURVES.md).
 *
 * Josh, 2026-10-02: "Curves (Like Photosho's curves)".  The source is SOLEIL's editor (S/curves.js:62–105: filled dots are points, open rings
 * on the segments are tension — drag up to lift, down to drop; 256-entry tables; the presets LINEAR LIFT S LOG GAMMA INVERT; AMOUNT; RESET),
 * standing on the kit's curve mathematics (modulation/curve.js: points { t, v, tension }, FL's tension, the add / remove / move / bend
 * functions) and the kit's curve pointer law (modulation/curve-gesture.js: svgPoint, the nearest-target hit, the axis locks, the fine
 * tension).  It is NOT the modulation window's curve editor, which is welded to a device's record: this one edits a plain list of points.
 *
 *   the plot      a square well: a quarter grid, the diagonal as the neutral curve, the app's histogram behind it when it hands one
 *   the hand      a press on the plot ADDS a point there and drags it · a press on a point drags it (Shift keeps its value, Ctrl its place)
 *                 · DRAG IT OUT of the plot, or DOUBLE-TAP it, to remove it (Alt-click too) · drag a ring to bend its segment (Ctrl fine),
 *                 double-tap a ring to straighten it · the two ends move only up and down and are never removed
 *   the keys      + / − pick the next / previous point · arrows move it (1/100; Shift ⅛ of that; Page ten) · Delete removes it ·
 *                 Enter adds one halfway to the next · Escape lets go (a drag in progress goes back)
 *   the rows      CHANNEL (a segment for MASTER R G B; a stepper for five or more) · PRESET (a stepper) · AMOUNT (a knob: identity at 0,
 *                 the whole curve at 1; a modulation target) · RESET (this channel back to the diagonal at 100 %)
 *
 *   createCurvesPanel({ rack, channels = ['MASTER', 'R', 'G', 'B'], port | canvas, mod, history, project, histogram, … }) → handle
 *   createCurvesView(parent, options) → { root, model, editor, sync(), setHistogram(data), params(), destroy() }
 *   createCurvesModel(options) → the curves and where their tables go, no DOM (made with the panel, so a closed card still applies them)
 *   curveEditor({ get, set(points, live), label, histogram }) → { root, svg, paint(), select(i), selected(), setHistogram(bins), destroy() }
 *   Pure: IDENTITY · PRESETS · PRESET_NAMES · isIdentity · presetOf · curveTable(points, amount, n) · pathOf(points, w, h, n) · histPath(bins, w, h)
 *
 * THE OUTPUT is one 256-entry table per channel (0..1, the AMOUNT mixed in): with no `port` it goes to picture-filter.js (MASTER, R, G, B on
 *   the canvas, one filter shared with GRADE); with `port: { setTable(channel, Float32Array) }` the app takes it into its own shader (any
 *   channel names: SOLEIL's twelve bands and its master) and no filter is installed.
 * PROJECT AND HISTORY  a part named `part` (default 'curves') unless `project: false`; with `history`, one domain: a gesture is one row.
 * IDLE  nothing runs at rest: the plot is painted on a change, coalesced on the frame. */
import { el, svgEl, ariaLabel, hint, trig, setKnobLaw } from '../kit.js';
import { control } from '../controls/factory.js';
import { frame } from '../core/frame.js';
import { setAttr } from '../core/perf.js';
import { registerProjectPart } from '../core/project.js';
import { handWrite } from '../modulation/registry.js';
import { evaluate, normalizePoints, addPoint, removePoint, movePoint, setTension } from '../modulation/curve.js';
import { svgPoint, curveHit, pointDrag, tensionDelta } from '../modulation/curve-gesture.js';
import { pictureFilter } from './picture-filter.js';
import { TAP } from '../controls/gesture.js';           // the kit's one double-tap: 300 ms and 14 px (Josh, 2026-10-07, call 20)

const W = 256;                                         // the plot's viewBox side: one unit per table entry
const OUT_PX = 24;                                     // a point dragged this far outside the plot is removed on release (Photoshop)
let uid = 0;
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

/* ── the pure part ─────────────────────────────────────────────────────────────────────────────────────────────────── */
export const IDENTITY = () => [{ t: 0, v: 0, tension: 0 }, { t: 1, v: 1, tension: 0 }];
/** SOLEIL's presets (S/curves.js:11–18), the ones that mean something for light */
export const PRESETS = Object.freeze({
  LINEAR: () => IDENTITY(),
  LIFT: () => [{ t: 0, v: 0, tension: -0.4 }, { t: 1, v: 1, tension: 0 }],
  S: () => [{ t: 0, v: 0, tension: 0.35 }, { t: 0.5, v: 0.5, tension: -0.35 }, { t: 1, v: 1, tension: 0 }],
  LOG: () => [{ t: 0, v: 0, tension: -0.75 }, { t: 1, v: 1, tension: 0 }],
  GAMMA: () => [{ t: 0, v: 0, tension: 0.4 }, { t: 1, v: 1, tension: 0 }],
  INVERT: () => [{ t: 0, v: 1, tension: 0 }, { t: 1, v: 0, tension: 0 }],
});
export const PRESET_NAMES = Object.freeze(Object.keys(PRESETS));
export const PRESET_HINT = Object.freeze({ LINEAR: 'the diagonal: the picture as it is', LIFT: 'lift the shadows', S: 'shadows down, highlights up', LOG: 'a strong lift: the dark comes up', GAMMA: 'darken the middle tones', INVERT: 'the negative' });
export const isIdentity = (pts) => !pts || (pts.length === 2 && pts[0].t === 0 && pts[0].v === 0 && pts[1].t === 1 && pts[1].v === 1 && !pts[0].tension);
/** presetOf(points) → the preset's name, or null */
export function presetOf(pts) {
  for (const name of PRESET_NAMES) {
    const P = PRESETS[name]();
    if (P.length === pts.length && P.every((p, i) => Math.abs(p.t - pts[i].t) < 1e-6 && Math.abs(p.v - pts[i].v) < 1e-6 && Math.abs((p.tension || 0) - (pts[i].tension || 0)) < 1e-6)) return name;
  }
  return null;
}
/** curveTable(points, amount, n) → Float32Array(n) in 0..1: the curve, mixed with the diagonal by amount (0 = identity, 1 = the whole curve) */
export function curveTable(pts, amount = 1, n = 256) {
  const a = clamp01(Number.isFinite(+amount) ? +amount : 1), out = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = i / (n - 1); out[i] = clamp01(x + (evaluate(pts, x) - x) * a); }
  return out;
}
/** pathOf(points, w, h, n) → an SVG path of the curve in a w × h box, y up */
export function pathOf(pts, w = W, h = W, n = 128) {
  let d = '';
  for (let i = 0; i <= n; i++) { const x = i / n, y = evaluate(pts, x); d += (i ? 'L' : 'M') + (x * w).toFixed(1) + ' ' + ((1 - y) * h).toFixed(1); }
  return d;
}
/** histPath(bins, w, h) → a closed area under the histogram (bins of any length; the tallest bin reaches 92 % of the plot), or '' */
export function histPath(bins, w = W, h = W) {
  if (!bins || !bins.length) return '';
  let max = 0; for (const b of bins) if (b > max) max = b;
  if (!(max > 0)) return '';
  const n = bins.length;
  let d = 'M0 ' + h;
  for (let i = 0; i < n; i++) { const x0 = (i / n) * w, x1 = ((i + 1) / n) * w, y = h - (bins[i] / max) * h * 0.92; d += 'L' + x0.toFixed(1) + ' ' + y.toFixed(1) + 'L' + x1.toFixed(1) + ' ' + y.toFixed(1); }
  return d + 'L' + w + ' ' + h + 'Z';
}
const channelKey = (c) => { const k = String(c).toUpperCase(); return k === 'MASTER' ? 'master' : k === 'R' ? 'r' : k === 'G' ? 'g' : k === 'B' ? 'b' : 'other'; };
const pack = (pts) => pts.map((p) => [+p.t.toFixed(4), +p.v.toFixed(4), +(p.tension || 0).toFixed(3)]);
const unpack = (a) => normalizePoints((a || []).map(([t, v, k]) => ({ t: +t, v: +v, tension: +k || 0 })));

/* ═══ THE EDITOR: the plot and the hand ═══════════════════════════════════════════════════════════════════════════════════════════════ */
export function curveEditor(o = {}) {
  const root = el('div', 'mir-curve');
  const svg = svgEl('svg', 'cv-svg', root);
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + W); svg.setAttribute('role', 'application'); svg.tabIndex = 0;
  svg.setAttribute('aria-roledescription', 'curve');
  ariaLabel(svg, o.label || 'CURVE');
  hint(svg, o.hint || 'CURVE — press to add a point and drag it; drag a point out or double-tap it to remove it; drag a ring to bend; + and − pick a point, the arrows move it');
  const hist = svgEl('path', 'cv-hist', svg);
  const grid = svgEl('path', 'cv-grid', svg);
  grid.setAttribute('d', [1, 2, 3].map((k) => 'M' + (k * W / 4) + ' 0V' + W + 'M0 ' + (k * W / 4) + 'H' + W).join(''));
  const diag = svgEl('path', 'cv-diag', svg); diag.setAttribute('d', 'M0 ' + W + 'L' + W + ' 0');
  const path = svgEl('path', 'cv-path', svg);
  const tens = svgEl('g', 'cv-tens', svg), dots = svgEl('g', 'cv-dots', svg);
  const X = (t) => t * W, Y = (v) => (1 - v) * W;
  let sel = -1, drag = null, last = { at: 0, x: 0, y: 0, kind: null, i: -1 }, histBins = null;
  const pointsNow = () => (drag && drag.pts ? (drag.out ? removePoint(drag.pts, drag.i).points : drag.pts) : o.get());

  function paint() {
    const pts = pointsNow();
    setAttr(path, 'd', pathOf(pts));
    const pool = (g, n, cls, r) => { while (g.childNodes.length < n) { const c = svgEl('circle', cls, g); c.setAttribute('r', r); } while (g.childNodes.length > n) g.lastChild.remove(); return g.childNodes; };
    const ds = pool(dots, pts.length, 'cv-dot', 5);
    pts.forEach((p, i) => { const c = ds[i]; setAttr(c, 'cx', X(p.t).toFixed(1)); setAttr(c, 'cy', Y(p.v).toFixed(1)); c.classList.toggle('sel', i === sel && !(drag && drag.out)); c.classList.toggle('end', i === 0 || i === pts.length - 1); c.dataset.i = String(i); });
    const ts = pool(tens, pts.length - 1, 'cv-ten', 4);
    for (let i = 0; i < pts.length - 1; i++) { const tm = (pts[i].t + pts[i + 1].t) / 2; setAttr(ts[i], 'cx', X(tm).toFixed(1)); setAttr(ts[i], 'cy', Y(evaluate(pts, tm)).toFixed(1)); ts[i].classList.toggle('bent', !!pts[i].tension); ts[i].dataset.i = String(i); }
    svg.classList.toggle('out', !!(drag && drag.out));
    const p = pts[sel];
    if (p) setAttr(svg, 'aria-valuetext', 'point ' + (sel + 1) + ' of ' + pts.length + ': in ' + Math.round(p.t * 255) + ', out ' + Math.round(p.v * 255));
    else svg.removeAttribute('aria-valuetext');
  }
  const key = 'mir.curve.paint.' + (++uid);
  const schedule = () => frame.coalesce(key, paint);
  function setHistogram(bins) { histBins = bins || null; setAttr(hist, 'd', histPath(histBins)); }
  if (o.histogram) setHistogram(typeof o.histogram === 'function' ? o.histogram() : o.histogram);

  /* the targets under a press, in the plot's units; the radius is a finger's on a coarse pointer */
  const hitAt = (P, pts) => {
    const r = svg.getBoundingClientRect(), px = matchMedia('(pointer: coarse)').matches ? 22 : 12;
    const s = W / Math.max(1, r.width);
    return curveHit(P, pts.map((p, i) => ({ x: X(p.t), y: Y(p.v), i })), pts.slice(0, -1).map((p, i) => ({ x: X((p.t + pts[i + 1].t) / 2), y: Y(evaluate(pts, (p.t + pts[i + 1].t) / 2)), i })), px * s);
  };
  const isEnd = (pts, i) => i === 0 || i === pts.length - 1;
  const commit = (pts) => { o.set(normalizePoints(pts), false); schedule(); };

  svg.addEventListener('contextmenu', (e) => e.preventDefault());
  svg.addEventListener('pointerdown', (e) => {
    if (drag || svg.getAttribute('aria-disabled') === 'true') return;
    const pts = o.get(), P = svgPoint(svg, e), hit = hitAt(P, pts);
    e.preventDefault(); svg.focus({ preventScroll: true });
    if (e.button === 2) {                                                   // the kit's curve law: a right-click on a ring straightens it, on the plot adds at the curve
      if (hit.kind === 'handle') commit(setTension(pts, hit.i, 0));
      else if (hit.kind === null) { const t = clamp01(P.x / W), r = addPoint(pts, t, evaluate(pts, t), 0); if (r.index >= 0) { sel = r.index; commit(r.points); } }
      return;
    }
    if (e.button !== 0) return;
    const now = performance.now(), twice = now - last.at < TAP.ms && Math.hypot(e.clientX - last.x, e.clientY - last.y) <= TAP.px && last.kind === hit.kind && last.i === hit.i && hit.kind !== null;
    last = { at: twice ? 0 : now, x: e.clientX, y: e.clientY, kind: hit.kind, i: hit.i };
    if (hit.kind === 'point' && (twice || e.altKey)) {                      // a double-tap (or Alt) removes a point; never an end
      if (!isEnd(pts, hit.i)) { const r = removePoint(pts, hit.i); if (r.removed) { sel = -1; commit(r.points); } }
      return;
    }
    if (hit.kind === 'handle' && twice) { commit(setTension(pts, hit.i, 0)); return; }   // a double-tap on a ring straightens it
    if (hit.kind === 'point') { sel = hit.i; drag = { kind: 'point', id: e.pointerId, i: hit.i, start: P, pts0: pts, pts, out: false, moved: false }; }
    else if (hit.kind === 'handle') { drag = { kind: 'tension', id: e.pointerId, i: hit.i, y0: P.y, t0: pts[hit.i].tension || 0, pts0: pts, pts }; }
    else {                                                                  // Photoshop: a press on the plot adds a point there, and drags it
      const r = addPoint(pts, clamp01(P.x / W), clamp01(1 - P.y / W), 0);
      if (r.index < 0) return;                                              // full (curve.js's rail: 32 points)
      sel = r.index; last = { at: 0, kind: null, i: -1 };                  // a press that made a point is not the first half of a double-tap on it
      drag = { kind: 'point', id: e.pointerId, i: r.index, start: { x: X(r.points[r.index].t), y: Y(r.points[r.index].v) }, pts0: pts, pts: r.points, out: false, moved: true };
      o.set(r.points, true);
    }
    try { svg.setPointerCapture(e.pointerId); } catch (_) { /* a pointer already gone */ }
    svg.classList.add('drag');
    schedule();
  });
  svg.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const P = svgPoint(svg, e);
    if (drag.kind === 'point') {
      const q = pointDrag(drag.start, P, e), cur = drag.pts, end = isEnd(cur, drag.i);
      const r = svg.getBoundingClientRect();
      const out = !end && (e.clientX < r.left - OUT_PX || e.clientX > r.right + OUT_PX || e.clientY < r.top - OUT_PX || e.clientY > r.bottom + OUT_PX);
      if (out !== drag.out) { drag.out = out; o.set(pointsNow(), true); }
      if (!out) {
        const t = end ? cur[drag.i].t : clamp01(q.x / W), v = clamp01(1 - q.y / W);
        const next = movePoint(cur, drag.i, t, v);
        const j = next.findIndex((p) => p.t === t && p.v === v);
        drag.pts = next; drag.i = j >= 0 ? j : drag.i; sel = drag.i; drag.moved = true;
        o.set(next, true);
      }
    } else {
      const d = tensionDelta(drag.y0, P.y, e) / (W / 2);                   // down drops the segment (positive tension), up lifts it; Ctrl is fine
      drag.pts = setTension(drag.pts0, drag.i, Math.max(-1, Math.min(1, drag.t0 + d)));
      o.set(drag.pts, true);
    }
    schedule();
  });
  const finish = (e, keep) => {
    if (!drag || (e && e.pointerId !== undefined && e.pointerId !== drag.id)) return;
    const g = drag; drag = null; svg.classList.remove('drag');
    if (!keep) { o.set(g.pts0, false); schedule(); return; }               // a cancelled gesture puts the curve back
    if (g.kind === 'point' && g.out) { sel = -1; commit(removePoint(g.pts, g.i).points); return; }
    if (g.kind === 'point' && !g.moved) { schedule(); return; }            // a press on a point that did not move only chooses it
    commit(g.pts);
  };
  svg.addEventListener('pointerup', (e) => finish(e, true));
  svg.addEventListener('pointercancel', (e) => finish(e, false));
  svg.addEventListener('lostpointercapture', (e) => finish(e, true));
  svg.addEventListener('dblclick', (e) => e.preventDefault());              // the double-tap was taken on the press
  svg.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || svg.getAttribute('aria-disabled') === 'true') return;
    const pts = o.get(), k = e.key;
    if (k === 'Escape') { if (drag) finish({}, false); else if (sel >= 0) { sel = -1; schedule(); } else return; e.preventDefault(); e.stopPropagation(); return; }
    if (k === '+' || k === '=' || k === '-' || k === '_') { sel = sel < 0 ? (k === '-' || k === '_' ? pts.length - 1 : 0) : (sel + (k === '-' || k === '_' ? pts.length - 1 : 1)) % pts.length; schedule(); e.preventDefault(); e.stopPropagation(); return; }
    if (sel < 0 || sel >= pts.length) return;
    const step = (e.code.startsWith('Page') ? 0.1 : 0.01) * (e.shiftKey ? setKnobLaw().keyFine : 1);   // the kit's one fine gear
    const mv = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step], PageUp: [0, step], PageDown: [0, -step] }[e.code];
    if (mv) {
      const p = pts[sel], end = isEnd(pts, sel), t = end ? p.t : clamp01(p.t + mv[0]), v = clamp01(p.v + mv[1]);
      const next = movePoint(pts, sel, t, v), j = next.findIndex((q) => q.t === t && q.v === v);
      if (j >= 0) sel = j;
      commit(next);
    } else if (k === 'Delete' || k === 'Backspace') {
      if (isEnd(pts, sel)) return;
      const r = removePoint(pts, sel); if (!r.removed) return;
      sel = Math.min(sel, r.points.length - 1); commit(r.points);
    } else if (k === 'Enter' || k === 'Insert') {
      const n = Math.min(sel, pts.length - 2), t = (pts[n].t + pts[n + 1].t) / 2, r = addPoint(pts, t, evaluate(pts, t), 0);
      if (r.index < 0) return; sel = r.index; commit(r.points);
    } else return;
    e.preventDefault(); e.stopPropagation();
  });
  svg.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });
  paint();
  return {
    root, svg, paint, schedule, setHistogram,
    select(i) { sel = i; schedule(); }, selected: () => sel, dragging: () => !!drag,
    setDisabled(on) { root.classList.toggle('disabled', !!on); svg.tabIndex = on ? -1 : 0; svg.setAttribute('aria-disabled', String(!!on)); },
    destroy() { frame.cancel(key); root.remove(); },
  };
}

/* ═══ THE MODEL: the curves and where their tables go ═════════════════════════════════════════════════════════════════════════════════ */
export function createCurvesModel(o = {}) {
  const port = o.port || null;
  if (!port && !o.canvas) throw new TypeError('curves panel: needs a port { setTable(channel, table) }, or a canvas for the zero-engine filter');
  const filter = port ? null : pictureFilter(o.canvas);
  const channels = (o.channels || ['MASTER', 'R', 'G', 'B']).map(String);
  const curves = Object.fromEntries(channels.map((c) => [c, IDENTITY()]));
  let amount = 1, channel = channels[0];
  const listeners = new Set();
  const emit = (what) => { for (const f of [...listeners]) f(what); };
  /** one channel's table to where it goes: the app's port (always a table), or the filter (null when it would do nothing) */
  function out(ch) {
    const pts = curves[ch];
    if (port) { if (typeof port.setTable === 'function') port.setTable(ch, curveTable(pts, amount)); }
    else filter.setTable(ch, isIdentity(pts) || amount === 0 ? null : curveTable(pts, amount));
  }
  const all = () => { for (const c of channels) out(c); };
  const M = {
    port, filter, channels, part: o.part || o.id || 'curves', modId: o.modId || ((o.modPrefix || o.part || o.id || 'curves') + '.amount'),
    points: (ch = channel) => curves[ch] || IDENTITY(),
    /** set(channel, points, live) — live while a hand drags, false when it lands (the history and the project hear the change either way) */
    set(ch, pts, live = false) { if (!(ch in curves)) return; curves[ch] = normalizePoints(pts); out(ch); emit({ ch, live }); },
    amount: () => amount,
    setAmount(v) { const a = clamp01(+v); if (a === amount || !Number.isFinite(a)) return; amount = a; all(); emit({ amount: a }); },
    channel: () => channel,
    setChannel(ch) { if (!(ch in curves) || ch === channel) return; channel = ch; emit({ channel: ch }); },
    preset(ch, name) { const P = PRESETS[name]; if (P) M.set(ch, P()); },
    reset(ch = channel) { M.set(ch, IDENTITY()); if (amount !== 1) M.setAmount(1); },
    table: (ch = channel) => curveTable(curves[ch], amount),
    /** the curves as data: { v: 1, amount, channel, curves: { MASTER: [[t, v, tension], …], … } } (identity channels left out) */
    serialize() { const c = {}; for (const ch of channels) if (!isIdentity(curves[ch])) c[ch] = pack(curves[ch]); return { v: 1, amount, channel, curves: c }; },
    restore(s) {
      if (!s) return;
      for (const ch of channels) curves[ch] = s.curves && Array.isArray(s.curves[ch]) && s.curves[ch].length >= 2 ? unpack(s.curves[ch]) : IDENTITY();
      if (Number.isFinite(+s.amount)) amount = clamp01(+s.amount);
      if (s.channel in curves) channel = s.channel;
      all(); emit({ restored: true });
    },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    destroy() { for (const f of offs) { try { f(); } catch (_) { /* gone */ } } listeners.clear(); if (filter) filter.release(); },
  };
  const offs = [];
  if (o.project !== false) {
    const reg = o.project && typeof o.project.register === 'function' ? o.project.register : registerProjectPart;
    offs.push(reg(M.part, { capture: () => M.serialize(), restore: (s) => M.restore(s), subscribe: (fn) => M.onChange((w) => { if (!w || !w.live) fn(); }) }));
  }
  if (o.history && typeof o.history.register === 'function') offs.push(o.history.register(M.part, { read: () => M.serialize(), write: (s) => M.restore(s) }));
  if (port) all();                                                          // the app's shader starts from the tables, identity included
  return M;
}

/* ═══ THE VIEW ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
export function createCurvesView(parent, o = {}) {
  const ownModel = !o.model;
  const M = o.model || createCurvesModel(o);
  const mod = o.mod || null;
  const key = 'mir.curves.sync.' + (++uid);
  const root = el('div', 'mir-curves' + (o.cls ? ' ' + o.cls : ''), parent);
  const paintChannel = () => { root.dataset.channel = channelKey(M.channel()); };
  paintChannel();

  /* ── the channel: a segment (2–4) or a stepper (5 or more) ── */
  let chan = null;
  if (M.channels.length > 1) {
    chan = control({ id: M.part + '.channel', label: o.channelLabel || 'CHANNEL', hint: 'CHANNEL — which curve the plot edits', options: M.channels.map((c) => ({ id: c, label: c })),
      value: M.channel(), get: () => M.channel(), set: (v) => M.setChannel(v) });
    el('div', 'curves-row curves-channel', root).appendChild(chan.root);
  }

  /* ── the plot ── */
  const histOf = () => { const h = o.histogram; if (!h) return null; const d = typeof h === 'function' ? h(M.channel()) : h; return d && !Array.isArray(d) && !ArrayBuffer.isView(d) ? (d[M.channel()] || d.MASTER || null) : d; };
  const editor = curveEditor({ label: o.label || 'CURVE', get: () => M.points(), set: (pts, live) => M.set(M.channel(), pts, live), histogram: histOf() });
  root.appendChild(editor.root);

  /* ── PRESET and AMOUNT, then RESET ── */
  const foot = el('div', 'curves-row curves-foot', root);
  const preset = control({ id: M.part + '.preset', label: 'PRESET', hint: 'PRESET — a curve to start from', options: PRESET_NAMES.map((n) => ({ id: n, label: n, hint: PRESET_HINT[n] })),
    value: presetOf(M.points()) || 'LINEAR', get: () => presetOf(M.points()) || 'LINEAR', set: (v) => M.preset(M.channel(), v) });
  const writeAmount = (v) => { if (!handWrite(mod, M.modId, v)) M.setAmount(v); };
  const amount = control({ id: M.modId, label: 'AMOUNT', hint: 'AMOUNT — how much of the curves apply: the diagonal at 0, the whole curve at 100 %', min: 0, max: 1, home: 1,
    fmt: (v) => Math.round(v * 100) + ' %', value: M.amount(), get: () => M.amount(), set: writeAmount });
  amount.widget.setDefault(1);
  foot.append(amount.root, preset.root);
  const resetBtn = trig({ label: 'RESET', cls: 'curves-reset', title: 'RESET — this channel back to the diagonal at 100 %', onFire: () => M.reset(M.channel()) });
  el('div', 'curves-row curves-verbs', root).appendChild(resetBtn.root);

  /* ── painting: a change, and the one frame that follows it ── */
  const routedAmount = () => { try { return !!(mod && mod.isModulated(M.modId)); } catch (_) { return false; } };
  function sync() {
    paintChannel();
    if (chan && chan.get() !== M.channel()) chan.set(M.channel());
    const p = presetOf(M.points()) || 'LINEAR'; if (preset.get() !== p) preset.set(p);
    if (!routedAmount() && !(amount.widget.dragging && amount.widget.dragging()) && amount.get() !== M.amount()) amount.set(M.amount());
    if (o.histogram) editor.setHistogram(histOf());
    editor.paint();
  }
  const schedule = () => frame.coalesce(key, sync);
  const offModel = M.onChange((w) => { if (w && w.live) editor.schedule(); else schedule(); });
  const targets = amount.params().map((rec) => ({ ...rec, id: M.modId, label: 'CURVES AMOUNT', get: () => M.amount(), set: (v) => M.setAmount(v) }));
  const offMod = [];
  if (mod && typeof mod.add === 'function' && targets.length) offMod.push(mod.add(targets));   // one rebuild of the modulation window (mod.add takes a list)
  sync();
  return {
    root, model: M, editor, channel: chan, preset, amount, reset: resetBtn, sync, schedule, params: () => targets.slice(),
    setHistogram(d) { o.histogram = d; editor.setHistogram(histOf()); },
    destroy() {
      frame.cancel(key); offModel();
      for (const f of offMod) { try { if (typeof f === 'function') f(); else if (f && typeof f.remove === 'function') f.remove(); } catch (_) { /* gone */ } }
      editor.destroy(); for (const c of [chan, preset, amount]) if (c && c.widget && c.widget.destroy) c.widget.destroy();
      if (ownModel) M.destroy();
      root.remove();
    },
  };
}

/* ═══ THE RACK CARD ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
export function createCurvesPanel(o = {}) {
  const id = o.id || 'curves';
  const model = createCurvesModel({ ...o, id });               // at once: a closed card still applies the curves and restores from a project
  let view = null;
  const handle = {
    id, model, view: () => view, params: () => (view ? view.params() : []), sync: () => view && view.sync(),
    setHistogram(d) { o.histogram = d; if (view) view.setHistogram(d); },
    destroy() { if (view) view.destroy(); view = null; model.destroy(); },
  };
  const spec = {
    id, title: o.title || 'CURVES', side: o.side || 'right', open: o.open, glyph: o.glyph || 'curves', action: o.action, eager: o.eager,
    hint: o.hint || 'the curves: a transfer curve per channel, as Photoshop draws it',
    build(body) { view = createCurvesView(body, { ...o, id, model }); handle.root = view.root; },
    onWake() { if (view) view.sync(); }, onOpen() { if (view) view.sync(); },
    ...(o.spec || {}),
  };
  if (o.parent) spec.build(o.parent);
  else if (o.rack) o.rack.register(spec);
  handle.spec = spec;
  return handle;
}
