/* history/gestures.js — NAMING THE GESTURE, and the listeners that hand it to the stack (history.js).
 *
 * LIFTED FROM BASINS (app/history-window.js gestureName + its listeners, 2026-10-01; λWAVES wave 106's law).  A pointer
 * gesture is ONE row, named for the control it began on — CONTROL · WINDOW — read off the DOM at the moment the gesture
 * starts, so a drag that ends elsewhere still carries the name of what was grabbed.  An input or change event, a wheel
 * turn or a key released on a control settles after the stack's quiet window (400 ms).  A drag on the picture is not an
 * edit: it is released with `absorb`.
 *
 * THE LAWS IT KEEPS
 *   · NAMES COME FROM HOOKS AND THE KIT'S OWN LABELS, never from English text in a selector.  The window is
 *     `[data-mir-window]` (its accessible name, or else its id) or a rack card `.dev` (its eyebrow); the control is the
 *     nearest widget CLASS the kit draws (`.k .sw .seg-b .trig .fd .m2k .m2dev`, a button, a select, an input, or
 *     anything with an aria-label), and its words are the label the kit wrote on it, in the language on screen.
 *     The name is stored as it is written: the sheet's `--label-case` puts it in capitals (history.css).
 *   · ONE LISTENER SET FOR THE PAGE, in the capture phase, passive where it can be; a press that is not a person's
 *     (`isTrusted` false: a control's forwarded copy of a press) is not a second gesture; blur releases every gesture.
 *   · NOTHING RUNS WHILE NOTHING HAPPENS.  No timer, no poll: the stack's own quiet timer is the only one.
 *
 * gestureName(target, { windows = '[data-mir-window]' }) → 'CONTROL · WINDOW' | 'CONTROL' | 'WINDOW' | ''
 * installHistoryGestures(history, { target = document, stage, windows, press = [0, 2] }) → remove
 *     stage     where a press is the picture's, not an edit: an element, a selector, or (target) => bool
 *     windows   the selector that finds a window (a gesture or a note in one is named for it)
 * editableTarget(el) → a field that owns its own undo (re-exported from history-list.js) */
import { editableTarget } from './history-list.js';

export { editableTarget };

const txt = (n) => (n && (n.textContent || '').trim().replace(/\s+/g, ' ')) || '';
/** the widget classes the kit draws, then the native controls; a landmark is not a control */
const CONTROL = '.k, .sw, .seg-b, .trig, .fd, .m2k, .m2dev, button, select, input, [aria-label]';
const LANDMARK = 'aside, section, .dev, [data-mir-window], #stage';
const WORDS = '.k-lbl, .sw-lbl, .trig-l, .fd-lbl, .m2kcap';

export function gestureName(t, { windows = '[data-mir-window]' } = {}) {
  if (!t || !t.closest) return '';
  const w = t.closest(windows), dev = t.closest('.dev');
  const win = (w ? (w.getAttribute('aria-label') || w.dataset.mirWindow || '') : dev ? txt(dev.querySelector('.dev-eyebrow')) : '').trim();
  let c = t.closest(CONTROL);
  if (c && c.matches(LANDMARK)) c = null;
  let what = '';
  if (c) {
    const lbl = c.querySelector && c.querySelector(WORDS);
    what = c.getAttribute('aria-label') || txt(lbl) || (c.matches('button, .seg-b, .trig') ? txt(c) : '') || c.title || '';
    if (c.matches('.seg-b')) { const g = c.closest('.segw, .seg'); const gl = g && txt(g.querySelector('.k-lbl')); if (gl) what = gl + ' ' + what; }
  }
  what = what.split(' — ')[0].trim();
  if (what.length > 32) what = what.split(' ')[0];
  const same = (a, b) => a.toLowerCase().includes(b.toLowerCase());
  return what && win && !same(what, win) ? what + ' · ' + win : (what || win);
}

export function installHistoryGestures(history, { target = document, stage = null, windows = '[data-mir-window]', press = [0, 2] } = {}) {
  const doc = target.ownerDocument || target, win = doc.defaultView || window;
  const life = new AbortController(), cap = { capture: true, signal: life.signal };
  const held = new Map();                                       // pointerId → a drag on the picture (absorbed, not an edit)
  const onStage = (n) => {
    if (!stage || !n || !n.closest) return false;
    if (typeof stage === 'function') return !!stage(n);
    if (typeof stage === 'string') return !!n.closest(stage);
    return stage.contains(n);
  };
  const name = (n) => gestureName(n, { windows });
  const inWindow = (n) => !!(n && n.closest && n.closest(windows + ', .dev'));

  const onUp = (e) => {
    if (e.isTrusted === false || !held.has(e.pointerId)) return;
    const onPicture = held.get(e.pointerId); held.delete(e.pointerId);
    history.release({ absorb: onPicture });
  };
  const onDown = (e) => {
    if (!e.isTrusted || !press.includes(e.button)) return;
    if (held.has(e.pointerId)) onUp(e);                         // a pointer that lost its up: released first
    const picture = onStage(e.target);
    held.set(e.pointerId, picture);
    history.hold(picture ? null : name(e.target));
  };
  doc.addEventListener('pointerdown', onDown, cap);
  for (const type of ['pointerup', 'pointercancel']) doc.addEventListener(type, onUp, cap);
  win.addEventListener('blur', () => { for (const id of [...held.keys()]) onUp({ pointerId: id }); }, { signal: life.signal });
  for (const type of ['input', 'change']) doc.addEventListener(type, (e) => { if (!editableTarget(e.target)) history.note(name(e.target)); }, cap);
  doc.addEventListener('wheel', (e) => { if (inWindow(e.target)) history.note(name(e.target)); }, { capture: true, passive: true, signal: life.signal });
  doc.addEventListener('keyup', (e) => {
    if (editableTarget(e.target) || e.ctrlKey || e.metaKey || e.altKey || /^(Control|Meta|Alt|Shift)/.test(e.key)) return;
    if (inWindow(e.target)) history.note(name(e.target));
  }, cap);
  return () => { life.abort(); held.clear(); };
}
