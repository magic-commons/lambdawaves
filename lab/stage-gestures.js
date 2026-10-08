// Pointer ownership and camera gestures. Physics-specific drags are supplied by
// the instrument; only their owning pointer may move, commit, or cancel them.
// 0.4.0 S2: the wheel and the pinch zoom at the cursor / the fingers' centroid
// (zoomAt, in uv), and two fingers or an Alt-drag slide the picture (pan, in uv:
// one pixel of drag moves the picture one pixel).
export function bindStageGestures(canvas, {
  camera, travel, law, getDistance, zoomAt, pan, orbitBy, resetView,
  setDragging, present, startSpecial, hover, now = () => performance.now(),
}) {
  const points = new Map(), history = [];
  let special = null, pinch = null, down = null, lastTap = null, fine = false;
  const doc = canvas.ownerDocument, win = doc.defaultView;
  canvas.tabIndex = -1; // Pointer focus owns the stage's Tab-to-raise shortcut.
  const uv = (x, y, r) => [2 * (x - r.left) / r.width - 1, 1 - 2 * (y - r.top) / r.height];
  const centroid = () => { const [a, b] = points.values(); return [(a.x + b.x) / 2, (a.y + b.y) / 2]; };
  function slide(e) { // Alt-drag: the lens shift, never the instrument's specials.
    const r = canvas.getBoundingClientRect(); let x = e.clientX, y = e.clientY;
    return { move(m) { pan(2 * (m.clientX - x) / r.width, -2 * (m.clientY - y) / r.height); x = m.clientX; y = m.clientY; } };
  }

  function capture(id) {
    try { canvas.setPointerCapture(id); } catch (_) {} // Synthetic or expired pointer.
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
  function pointerDown(e) {
    if (e.button !== 0 || special || points.has(e.pointerId) || points.size === 2) return;
    try { canvas.focus({ preventScroll: true }); } catch (_) {}
    if (!points.size) {
      const action = e.altKey && !e.ctrlKey ? slide(e) : startSpecial(e);
      if (action) {
        e.preventDefault(); lastTap = null;
        special = { id: e.pointerId, action }; capture(e.pointerId); return;
      }
    }
    capture(e.pointerId);
    points.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setDragging(true); canvas.classList.add('drag');
    camera.stop(); fine = e.shiftKey;
    down = points.size === 1 ? { x: e.clientX, y: e.clientY, t: now() } : null;
    if (points.size > 1) lastTap = null;
    rebase();
  }
  function pointerMove(e) {
    if (special) {
      if (special.id === e.pointerId) special.action.move?.(e);
      return;
    }
    const p = points.get(e.pointerId);
    if (!p) { if (!points.size) hover(e); return; }
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) >= 8) down = null;
    if (points.size === 1) {
      if (fine !== e.shiftKey) { fine = e.shiftKey; history.length = 0; }
      const gain = law.SENS * camera.dragGain * (fine ? law.FINE : 1);
      orbitBy(-(e.clientX - p.x) * gain, (e.clientY - p.y) * gain);
      remember();
    }
    const c0 = pinch && centroid();
    p.x = e.clientX; p.y = e.clientY;
    if (pinch) {
      const [a, b] = points.values(), span = Math.hypot(a.x - b.x, a.y - b.y), c1 = centroid(), r = pinch.box;
      pan(2 * (c1[0] - c0[0]) / r.width, -2 * (c1[1] - c0[1]) / r.height); // Two fingers slide the picture, then zoom about where they are.
      if (pinch.span > 0) zoomAt(uv(c1[0], c1[1], r), pinch.distance * pinch.span / Math.max(1, span));
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
    const t = now(), tap = !canceled && e.pointerType === 'touch' && down && t - down.t < 300
      && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8;
    down = null;
    if (tap) {
      if (lastTap && t - lastTap.t < law.TAP_MS && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 40) {
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
    e.preventDefault();
    // WheelEvent deltaMode: pixels, lines (16 CSS px), or viewport pages.
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? canvas.clientHeight : 1;
    zoomAt(uv(e.clientX, e.clientY, canvas.getBoundingClientRect()), getDistance() * Math.pow(1.1, e.deltaY * unit / 100));
  }, { passive: false });
  canvas.addEventListener('dblclick', resetView);
  win.addEventListener('blur', cancel);
  win.addEventListener('pagehide', cancel);
  doc.addEventListener('visibilitychange', () => { if (doc.hidden) cancel(); });
}
