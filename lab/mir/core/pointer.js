/* core/pointer.js — one drag gesture, the press law, and the pointer field.
 *
 * THE LAW IT KEEPS: A GESTURE BELONGS TO THE POINTER THAT STARTED IT, AND IT ALWAYS ENDS ONE OF TWO WAYS.
 * Either the pointer lets go — the last sample is flushed first, so onEnd never commits a position the hand
 * already left — or the gesture is cancelled — pointercancel, lost capture, the window losing focus, the page
 * going hidden, or Escape — and onCancel rolls it back.  Nothing in between is ever left half-applied.
 * Moves are coalesced through the one frame (core/frame.js): latest sample wins, one apply per display frame.
 * (Harvested from BASINS snap-window.js + frame-coalescer.js, which had no Escape and no hidden-page cancel.)
 *
 * THE PRESS (from BASINS kwin.js): a capture-phase pointerdown marks the pressed control `.press` until that
 * same pointer lifts or cancels, for any pointer type — WebKit gives a finger no :active unless the page has a
 * touchstart listener, so a touch would otherwise get no feedback at all.
 *
 * THE POINTER FIELD: the pointer's place inside an element as `--px/--py` (0..1) and `--pxs/--pys` (−1..1),
 * for a cursor glow or a parallax.  One rect read per enter, one write batch per frame, cleared on leave; mouse
 * and pen only unless asked, and nothing at all unless the motion policy is 'full'.
 */
import { frame } from './frame.js';
import { rect, setVar, setAttr } from './perf.js';
import { motionPolicy } from './motion.js';

const MODS = ['Shift', 'Alt', 'Control', 'Meta'];

/* ── IS THE USER TYPING: the kit's one answer (the key table, the history keys, the describe trail, a page's Escape and the
   timeline's keys all ask it) ── */
const TEXTY = new Set(['', 'text', 'search', 'email', 'url', 'tel', 'password', 'number', 'date', 'time', 'datetime-local', 'month', 'week']);
/** isField(node, anyInput = false) — a place the user types: a textarea, a select, anything contenteditable, and an input
 *  of a text-like type (with `anyInput`, every input: a colour well, a range, a box — a place that keeps its own keys) */
export function isField(n, anyInput = false) {
  if (!n || !n.tagName) return false;
  const tag = String(n.tagName).toLowerCase();
  if (tag === 'textarea' || tag === 'select') return true;
  if (tag === 'input') return anyInput || TEXTY.has(String(n.type || n.getAttribute && n.getAttribute('type') || '').toLowerCase());
  return !!n.isContentEditable || (!!n.getAttribute && /^(|true|plaintext-only)$/.test(n.getAttribute('contenteditable') ?? 'x'));
}
let uid = 0;

/** drag(el, { slop, button, onStart, onMove, onEnd, onCancel }) — a drag from `el`.  Every callback gets a sample
 *  { x, y, x0, y0, dx, dy, shiftKey, altKey, ctrlKey, metaKey, pointerType, pointerId }.  onStart fires once the
 *  pointer has travelled `slop` px; a press that never does is a click and calls nothing.
 *  → { cancel(), destroy(), active } */
export function drag(el, { slop = 4, button = 0, onStart, onMove, onEnd, onCancel } = {}) {
  const key = 'drag:' + (++uid), win = el.ownerDocument.defaultView, doc = el.ownerDocument;
  let g = null;                                                     // the live gesture
  const sample = (e) => {
    g.s = { ...g.s, x: e.clientX ?? g.s.x, y: e.clientY ?? g.s.y,
      shiftKey: !!e.shiftKey, altKey: !!e.altKey, ctrlKey: !!e.ctrlKey, metaKey: !!e.metaKey };
    g.s.dx = g.s.x - g.s.x0; g.s.dy = g.s.y - g.s.y0;
    return g.s;
  };
  const post = () => { const s = { ...g.s }; frame.coalesce(key, () => onMove && onMove(s)); };
  const listen = (on) => {
    const f = on ? 'addEventListener' : 'removeEventListener';
    win[f]('blur', cancel); win[f]('keydown', keys, true); win[f]('keyup', keys, true);
    doc[f]('visibilitychange', hidden);
  };
  const finish = () => {
    const was = g; g = null; listen(false);
    try { if (el.hasPointerCapture(was.id)) el.releasePointerCapture(was.id); } catch { /* already released */ }
    return was;
  };
  function down(e) {
    if (g || e.button !== button || (!e.isPrimary && e.isTrusted)) return;   // a real second finger is refused; a scripted press (isPrimary defaults to false) is a press
    e.preventDefault();
    g = { id: e.pointerId, started: false, s: { x0: e.clientX, y0: e.clientY, pointerType: e.pointerType, pointerId: e.pointerId } };
    sample(e);
    try { el.setPointerCapture(e.pointerId); } catch { /* a capture that can't be taken must not throw (CONTRACT §8) */ }
    listen(true);
  }
  function move(e) {
    if (!g || e.pointerId !== g.id) return;
    sample(e);
    if (!g.started) {
      if (Math.hypot(g.s.dx, g.s.dy) < slop) return;
      g.started = true; if (onStart) onStart({ ...g.s });
    }
    e.preventDefault(); post();
  }
  function up(e) {
    if (!g || e.pointerId !== g.id) return;
    sample(e);
    const was = g;
    if (was.started) { post(); frame.flush(key); }                  // the final sample, before the commit
    finish();
    if (was.started && onEnd) onEnd({ ...was.s });
  }
  function cancel() {
    if (!g) return;
    frame.cancel(key);
    const was = finish();
    if (was.started && onCancel) onCancel({ ...was.s });
  }
  function keys(e) {
    if (!g) return;
    if (e.type === 'keydown' && e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cancel(); return; }
    if (g.started && MODS.includes(e.key)) { sample(e); post(); }   // a modifier changes the drag without a move
  }
  function hidden() { if (doc.visibilityState === 'hidden') cancel(); }
  const own = (e) => { if (g && e.pointerId === g.id) cancel(); };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', own);
  el.addEventListener('lostpointercapture', own);
  return {
    cancel,
    get active() { return !!(g && g.started); },
    destroy() {
      cancel();
      el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', own); el.removeEventListener('lostpointercapture', own);
    },
  };
}

/** installPress({ selector, root }) — the `.press` law for every pointer type.  → uninstall() */
export function installPress({ selector = 'button, [role="button"]', root = globalThis.window } = {}) {
  const pressed = new Map();                                        // pointerId → element
  const down = (e) => {
    const c = e.target && e.target.closest ? e.target.closest(selector) : null;
    if (!c || c.disabled || c.getAttribute('aria-disabled') === 'true') return;
    pressed.set(e.pointerId, c); c.classList.add('press');
  };
  const up = (e) => { const c = pressed.get(e.pointerId); if (c) { c.classList.remove('press'); pressed.delete(e.pointerId); } };
  root.addEventListener('pointerdown', down, true);
  root.addEventListener('pointerup', up, true);
  root.addEventListener('pointercancel', up, true);
  return () => {
    root.removeEventListener('pointerdown', down, true); root.removeEventListener('pointerup', up, true); root.removeEventListener('pointercancel', up, true);
    for (const c of pressed.values()) c.classList.remove('press'); pressed.clear();
  };
}

const FIELD = ['--px', '--py', '--pxs', '--pys'];
/** pointerField(el, { touch }) — write the pointer's place inside `el` as --px/--py and --pxs/--pys, and mark
 *  `data-pointer="in"` while it is there.  → destroy() */
export function pointerField(el, { touch = false } = {}) {
  const key = 'field:' + (++uid), win = el.ownerDocument.defaultView;
  let box = null, inside = false, reading = false, x = 0, y = 0;
  const ok = (e) => touch || e.pointerType !== 'touch';
  const paint = () => {
    if (!box || motionPolicy() !== 'full') return;
    const u = Math.min(1, Math.max(0, (x - box.left) / box.width)), v = Math.min(1, Math.max(0, (y - box.top) / box.height));
    setVar(el, '--px', u.toFixed(3)); setVar(el, '--py', v.toFixed(3));
    setVar(el, '--pxs', (u * 2 - 1).toFixed(3)); setVar(el, '--pys', (v * 2 - 1).toFixed(3));
    setAttr(el, 'data-pointer', 'in');
  };
  const clear = () => {
    inside = false; box = null; frame.cancel(key);
    frame.write(() => { if (inside) return; for (const n of FIELD) setVar(el, n, null); setAttr(el, 'data-pointer', null); });
  };
  const move = (e) => {
    if (!ok(e)) return;
    x = e.clientX; y = e.clientY; inside = true;
    if (!box && !reading) { reading = true; frame.read(() => { reading = false; if (inside) box = rect(el); }); }   // one read per enter
    frame.coalesce(key, paint);
  };
  const leave = (e) => { if (e.type === 'pointerleave' && !ok(e)) return; if (inside || el.hasAttribute('data-pointer')) clear(); };
  el.addEventListener('pointerenter', move);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerleave', leave);
  win.addEventListener('blur', leave);
  return () => {
    el.removeEventListener('pointerenter', move); el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerleave', leave); win.removeEventListener('blur', leave);
    inside = false; box = null; frame.cancel(key); for (const n of FIELD) setVar(el, n, null); setAttr(el, 'data-pointer', null);
  };
}
