// Pointer ownership and camera gestures. Physics-specific drags are supplied by
// the instrument; only their owning pointer may move, commit, or cancel them.
// 0.4.0 S2: the wheel and the pinch zoom at the cursor / the fingers' centroid
// (zoomAt, in uv), and two fingers or an Alt-drag slide the picture (pan, in uv:
// one pixel of drag moves the picture one pixel).
// 0.5.0 A8 · THE BINDINGS are ONE data table (R5-C1: today's stand, and a change is a row edit; brief 1 takes it as
// configuration).  bindStageGestures reads it through `bindings`; rack.js' Alt+Arrow quartet reads `nudge`.
// 0.5.0 C9 · THE SCENE GUARD (MIR 1.5 mir/shell/scene-guard.js, `install: false`, as BASINS' gestures.js): `ui()` is UI space, and
// a press or a double-click there starts nothing on the stage and its wheel goes to that region's scroller.  The table is the law
// for every press that does reach the stage; a drag begun on the stage keeps its pointer across the UI.
import { createSceneGuard } from './mir/shell/scene-guard.js';
const frozen = (o) => Object.freeze(Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v && typeof v === 'object' ? frozen(v) : v])));
export const STAGE_BINDINGS = frozen({
  pointer: { button: 0, slide: { altKey: true, ctrlKey: false }, fine: 'shiftKey' }, // one finger or the mouse: these modifiers slide; else the instrument's special; else orbit (`fine` × law.FINE)
  wheel: { line: 16, page: null, base: 1.1, per: 100, atCursor: true }, // CSS px a line (a page: null = the canvas' height); distance × base^(px / per)
  pinch: { slide: true, atCentroid: true }, // two fingers slide the picture and zoom at their centroid
  tap: { ms: 300, px: 8 }, // a touch tap is shorter and stiller than this
  doubleTap: { ms: null, px: 40 }, // a second tap this soon (null: the law's TAP_MS) and this near resets the view
  dblclick: true, // a double-click resets the view
  nudge: 0.05, // Alt+Arrows: the lens shift a press, of the half-frame (Shift × the key's fine factor)
});
export function bindStageGestures(canvas, {
  camera, travel, law, getDistance, zoomAt, pan, orbitBy, resetView,
  setDragging, present, startSpecial, hover, now = () => performance.now(), bindings: B = STAGE_BINDINGS, ui = () => [],
}) {
  const guard = createSceneGuard({ canvas, rects: ui, install: false });
  const points = new Map(), history = [];
  let special = null, pinch = null, down = null, lastTap = null, fine = false;
  const doc = canvas.ownerDocument, win = doc.defaultView;
  canvas.tabIndex = -1; // Pointer focus owns the stage's Tab-to-raise shortcut.
  const uv = (x, y, r) => [2 * (x - r.left) / r.width - 1, 1 - 2 * (y - r.top) / r.height];
  const centroid = () => { const [a, b] = points.values(); return [(a.x + b.x) / 2, (a.y + b.y) / 2]; };
  const held = (e, m) => Object.keys(m).every((k) => !!e[k] === m[k]), FINE = B.pointer.fine;
  function slide(e) { // Alt-drag: the lens shift, never the instrument's specials.
    const r = canvas.getBoundingClientRect(); let x = e.clientX, y = e.clientY;
    return { move(m) { pan(2 * (m.clientX - x) / r.width, -2 * (m.clientY - y) / r.height); x = m.clientX; y = m.clientY; } };
  }

  function capture(id) { // → whether the stage holds the pointer (a synthetic or expired one is never held)
    try { canvas.setPointerCapture(id); } catch (_) {} // Synthetic or expired pointer.
    return canvas.hasPointerCapture(id);
  }
  function release(id) {
    try { if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id); } catch (_) {}
  }
  function remember() {
    const t = now();
    history.push({ t, yaw: travel.yaw, pitch: travel.pitch });
    while (history.length > 2 && t - history[0].t > law.HIST_MS) history.shift();
  }
  function rebase() {
    history.length = 0;
    pinch = null;
    if (points.size === 2) {
      const [a, b] = points.values();
      pinch = { span: Math.hypot(a.x - b.x, a.y - b.y), distance: getDistance(), box: canvas.getBoundingClientRect() };
    }
    if (points.size === 1) remember();
  }
  function fling() {
    if (history.length < 2) return;
    const a = history[0], b = history[history.length - 1], dt = (b.t - a.t) / 1000;
    if (dt < 0.008 || now() - b.t > law.STALE_MS) return;
    const wy = (b.yaw - a.yaw) / dt, wp = (b.pitch - a.pitch) / dt;
    if (Math.hypot(wy, wp) >= law.REST) camera.fling(wy, wp);
  }
  function heal(e) { // 0.5.3 M4: a NEW press first ends, cancelled, a held pointer whose release never came — the same id, or one whose capture is gone (a new touch has a new id)
    const lost = (id, p) => id === e.pointerId || (p.cap && !canvas.hasPointerCapture(id));
    if (special && lost(special.id, special)) finish({ pointerId: special.id }, true);
    for (const [id, p] of [...points]) if (lost(id, p)) finish({ pointerId: id }, true);
  }
  function pointerDown(e) {
    heal(e);
    if (e.button !== B.pointer.button || special || points.has(e.pointerId) || points.size === 2 || guard.hit(e)) return;
    try { canvas.focus({ preventScroll: true }); } catch (_) {}
    if (!points.size) {
      const action = held(e, B.pointer.slide) ? slide(e) : startSpecial(e);
      if (action) {
        e.preventDefault(); lastTap = null;
        special = { id: e.pointerId, action, cap: capture(e.pointerId) }; return;
      }
    }
    points.set(e.pointerId, { x: e.clientX, y: e.clientY, cap: capture(e.pointerId) });
    setDragging(true); canvas.classList.add('drag');
    camera.stop(); fine = e[FINE];
    down = points.size === 1 ? { x: e.clientX, y: e.clientY, t: now() } : null;
    if (points.size > 1) lastTap = null;
    rebase();
  }
  function pointerMove(e) {
    if (e.pointerType === 'mouse' && e.buttons === 0 && (special?.id === e.pointerId || points.has(e.pointerId))) return finish(e, true);   // M4: its button is up, its pointerup lost
    if (special) {
      if (special.id === e.pointerId) special.action.move?.(e);
      return;
    }
    const p = points.get(e.pointerId);
    if (!p) { if (!points.size) hover(e); return; }
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) >= B.tap.px) down = null;
    if (points.size === 1) {
      if (fine !== e[FINE]) { fine = e[FINE]; history.length = 0; }
      const gain = law.SENS * camera.dragGain * (fine ? law.FINE : 1);
      orbitBy(-(e.clientX - p.x) * gain * (camera.flip ? -1 : 1), (e.clientY - p.y) * gain);   // iteration 014 C2: a FLIPPED view turns the other way, so it follows the hand
      remember();
    }
    const c0 = pinch && centroid();
    p.x = e.clientX; p.y = e.clientY;
    if (pinch) {
      const [a, b] = points.values(), span = Math.hypot(a.x - b.x, a.y - b.y), c1 = centroid(), r = pinch.box;
      if (B.pinch.slide) pan(2 * (c1[0] - c0[0]) / r.width, -2 * (c1[1] - c0[1]) / r.height); // Two fingers slide the picture, then zoom about where they are.
      if (pinch.span > 0) zoomAt(B.pinch.atCentroid ? uv(c1[0], c1[1], r) : [0, 0], pinch.distance * pinch.span / Math.max(1, span));
      else rebase(); // Two contacts can initially have the same coordinates.
    }
    present();
  }
  function finish(e, canceled) {
    if (special) {
      if (special.id !== e.pointerId) return;
      const { action } = special; special = null;
      if (canceled) action.cancel?.(); else action.end?.(e);
      release(e.pointerId); return;
    }
    if (!points.delete(e.pointerId)) return;
    release(e.pointerId);
    if (canceled) { down = null; lastTap = null; }
    if (points.size) { rebase(); return; }
    setDragging(false); canvas.classList.remove('drag');
    if (!canceled) fling();
    rebase();
    const t = now(), tap = !canceled && e.pointerType === 'touch' && down && t - down.t < B.tap.ms
      && Math.hypot(e.clientX - down.x, e.clientY - down.y) < B.tap.px;
    down = null;
    if (tap) {
      if (lastTap && t - lastTap.t < (B.doubleTap.ms ?? law.TAP_MS) && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < B.doubleTap.px) {
        lastTap = null; resetView();
      } else lastTap = { t, x: e.clientX, y: e.clientY };
    } else lastTap = null;
  }
  function cancel() {
    if (special) finish({ pointerId: special.id }, true);
    for (const id of points.keys()) finish({ pointerId: id }, true);
    lastTap = null;
  }
  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', e => finish(e, false));
  for (const type of ['pointercancel', 'lostpointercapture']) canvas.addEventListener(type, e => finish(e, true));
  canvas.addEventListener('wheel', e => {
    const r = guard.hit(e); if (r) return guard.wheel(e, r);
    e.preventDefault();
    // WheelEvent deltaMode: pixels, lines (16 CSS px), or viewport pages.
    const W = B.wheel, unit = e.deltaMode === 1 ? W.line : e.deltaMode === 2 ? (W.page ?? canvas.clientHeight) : 1;
    zoomAt(W.atCursor ? uv(e.clientX, e.clientY, canvas.getBoundingClientRect()) : [0, 0], getDistance() * Math.pow(W.base, e.deltaY * unit / W.per));
  }, { passive: false });
  if (B.dblclick) canvas.addEventListener('dblclick', e => { if (!guard.hit(e)) resetView(); });
  win.addEventListener('blur', cancel);
  win.addEventListener('pagehide', cancel);
  doc.addEventListener('visibilitychange', () => { if (doc.hidden) cancel(); });
}
