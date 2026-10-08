/* MIR · shell/notice.js — THE NOTICE: a short message that leaves by itself.  Two seats:
 *
 *   THE TOAST (the default) is BASINS' `#toast` (app/overlay.js toast(), basins.css:6-11): ONE seat, centred, 84 px above
 *   the bottom, at most 560 px wide, a pill; a new message REPLACES the one showing; no ×; 3 s unless told otherwise.
 *   THE CORNER (`seat: 'corner'`, or `stack: true`) is NEBULA's `#notice` (lab/index.html:213, main.js:43-47), copied
 *   into SOLEIL, AUTOMATA and EARTH: a stack in the bottom end corner, up to `max` (4), each with a ×, 5 s (9 s for an
 *   error).
 *
 * THE LAWS IT KEEPS (both seats)
 *   · NOTHING BLOCKS THE STAGE.  The toast takes no press at all (BASINS': a press goes to whatever is beneath it); with
 *     an action, only the action does — so the pointer holds a toast only on its action.  In the corner, a notice
 *     takes a press and the stack's box takes none.
 *   · POLITE.  The seat is a `role=status` live region (`aria-live=polite`).
 *   · IT LEAVES BY ITSELF, and HOVER OR FOCUS HOLDS IT: the time left pauses while the pointer is on it or the focus is
 *     in it.  `ms: 0` stays until closed.
 *   · `kind` ('info' | 'ok' | 'warn' | 'error') is on the element as `data-kind`; the corner draws it as a bar, the toast
 *     (as BASINS) does not draw it.  An `action` is a kit trigger inside the message in both seats.
 *   · MOTION through core/motion.js `presence`: under reduced motion it only fades; under off it just appears.
 *   · ENGLISH IN, translated by `label()`; the text is one whole sentence (use t('{n} saved', { n }) for a value).
 *
 * notice(text, { kind, ms, action: { label, run }, seat = 'toast' | 'corner', stack, offset, max = 4 }) → { close(), root }
 *   offset  the toast's distance from the bottom (px, or a CSS length); BASINS' 84 px by default (--toast-bottom).  An
 *           app whose transport sits higher passes its own.
 * guarded(fn) → fn's result; a throw (or a rejected promise) becomes an error notice instead (NEBULA's safe()). */
import { el, label, ariaLabel, trig } from '../kit.js';
import { presence } from '../core/motion.js';

/** the pause-under-the-hand timer both seats share: it starts at once; the pointer or the focus on `root` holds it */
function timing(root, left, close, signal) {
  let timer = 0, since = 0, holds = 0;
  const run = () => { if (!left || holds) return; since = performance.now(); timer = setTimeout(close, left); };
  const hold = () => { if (holds++ === 0 && timer) { clearTimeout(timer); timer = 0; left = Math.max(800, left - (performance.now() - since)); } };
  const free = () => { if (holds > 0 && --holds === 0) run(); };
  const on = { signal };
  root.addEventListener('pointerenter', hold, on); root.addEventListener('pointerleave', free, on);
  root.addEventListener('focusin', hold, on);
  root.addEventListener('focusout', (e) => { if (!root.contains(e.relatedTarget)) free(); }, on);
  let hovered = false; try { hovered = !root.hidden && root.matches(':hover'); } catch (_) {}
  if (hovered) holds = 1;                                         // a replacement under a resting pointer is held at once
  run();
  return () => clearTimeout(timer);
}
const actionOf = (action, close) => trig({ label: action.label, onFire: () => { try { if (action.run) action.run(); } finally { close(); } } }).root;

export function notice(text, o = {}) {
  return o.seat === 'corner' || o.stack ? cornerNotice(text, o) : toastNotice(text, o);
}

/* ── the toast: BASINS' one centred seat ─────────────────────────────────────────────────────────────── */
let toastSeat = null, toastNow = null;
function toastNotice(text, { kind = 'info', ms, action = null, offset } = {}) {
  if (!toastSeat || !toastSeat.isConnected) {
    /* BASINS' `<div id="toast" class="glass">`: a pane, so CARD STYLE's blur reaches it; the id carries its own fill
       over the pane's, as BASINS' does.  .mir-notice: "a notice", in either seat */
    toastSeat = el('div', 'mir-toast mir-notice glass', document.body); toastSeat.id = 'mir-toast'; toastSeat.hidden = true;
    toastSeat.setAttribute('role', 'status'); toastSeat.setAttribute('aria-live', 'polite');
  }
  const seat = toastSeat;
  if (toastNow) toastNow.drop();                                  // replaced: its timer and listeners go, the seat stays up
  const life = new AbortController();
  seat.textContent = ''; seat.dataset.kind = kind;
  if (offset !== undefined && offset !== null) seat.style.setProperty('--toast-bottom', typeof offset === 'number' ? offset + 'px' : String(offset));
  else seat.style.removeProperty('--toast-bottom');
  label(el('span', 'mir-notice-text', seat), String(text));
  let closed = false, stop = () => {};
  const me = { drop() { closed = true; stop(); life.abort(); } };
  function close() {
    if (closed) return; me.drop();
    if (toastNow === me) { toastNow = null; presence(seat, false); }
  }
  if (action && action.label) seat.appendChild(actionOf(action, close));
  toastNow = me;
  presence(seat, true);
  stop = timing(seat, ms === undefined ? 3000 : ms, close, life.signal);
  return { close, root: seat };
}

/* ── the corner: NEBULA's stack ──────────────────────────────────────────────────────────────────────── */
let stack = null;
const live = new Set();
function host() {
  if (stack && stack.isConnected) return stack;
  stack = el('div', 'mir-notices', document.body);
  stack.setAttribute('role', 'status'); stack.setAttribute('aria-live', 'polite');
  return stack;
}
function cornerNotice(text, { kind = 'info', ms, action = null, max = 4 } = {}) {
  const life = new AbortController();
  const root = el('div', 'mir-notice glass'); root.dataset.kind = kind; root.hidden = true;
  label(el('span', 'mir-notice-text', root), String(text));
  let closed = false, stop = () => {};
  function close() {
    if (closed) return; closed = true;
    stop(); life.abort(); live.delete(root);
    presence(root, false).then(() => root.remove());
  }
  if (action && action.label) root.appendChild(actionOf(action, close));
  const x = el('button', 'mir-notice-x', root, '×'); x.type = 'button'; ariaLabel(x, 'dismiss');   // tr[dismiss]: put the notice away (not close a window)
  x.addEventListener('click', () => close(), { signal: life.signal });
  host().appendChild(root);
  live.add(root);
  root.__close = close;
  while (live.size > max) { const old = live.values().next().value; old.__close(); }
  presence(root, true);
  stop = timing(root, ms === undefined ? (kind === 'error' ? 9000 : 5000) : ms, close, life.signal);
  return { close, root };
}

/** guarded(fn) — run fn; a throw or a rejection becomes an error notice with its message */
export function guarded(fn) {
  const say = (e) => notice(String((e && e.message) || e), { kind: 'error' });
  try { const r = fn(); if (r && typeof r.catch === 'function') r.catch(say); return r; } catch (e) { say(e); return null; }
}
