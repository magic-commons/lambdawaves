/* MIR · core/kbm.js — THE INPUT CAPABILITY LAYER: the live pointer decides touch or precision, never the device class.
 *
 * Harvested from BASINS (app/overlay.js "WAVE-KBM — THE INPUT CAPABILITY LAYER"; Josh: "If the mobile device has access
 * to a mouse and keyboard control instead of touch, then it could secretly support the KBM"), and made the kit's in
 * 1.5.0 wave 21 (Josh, 2026-10-07: "I want it to behave exactly like my linux desktop is for the menu and logo via the
 * iPad's magic mousepad").
 *
 * THE LAW, one sentence: ADAPT TO THE INPUT BEING USED RIGHT NOW, NOT TO THE DEVICE CLASS.  An iPad with a Magic
 * Keyboard is a desktop for exactly as long as the trackpad is moving, and a touch device again the instant a finger
 * lands — both in the SAME session, minutes apart.
 *
 * THE TWO SIGNALS.  `e.pointerType` on every pointer event ('mouse' | 'touch' | 'pen') says WHAT IS HAPPENING and is
 * decisive.  The media queries say WHAT IS POSSIBLE: on iPadOS with a trackpad attached the PRIMARY pointer is still
 * coarse (`hover: none`, `pointer: coarse`) while `any-pointer: fine` and `any-hover: hover` turn true (measured on
 * Josh's iPad, 2026-10-07).  So THE LIVE EVENT ALWAYS WINS; the media queries set the mode at boot only, before any
 * pointer has been seen, from the PRIMARY pointer (a mouse in the bag is not a mouse in use).
 *
 * THREE THINGS KEPT APART
 *   mode   'touch' | 'precision'.  Flips AT ONCE both ways on a pointer event.  It governs affordances that move
 *          nothing: hover highlights, the menubar's hover, the cursor effects, tooltips.
 *   dense  the density step, which may move geometry: precision AND a mouse/pen actually OBSERVED AND continuously
 *          for KBM_DENSE_MS AND no pointer down.  Touch takes it away instantly (the 44 px law is absolute while touch
 *          is live); precision has to earn it.  (The kit's geometry does not follow it yet: `body.touch-tablet` is the
 *          screen's class and stays geometry only.)
 *   pref   'auto' | 'touch' | 'precision' — a person's override (MIR OPTIONS › MOTION › POINTER).  A device setting,
 *          never in a project; the key is written only when a person picks something, and AUTO removes it.
 *
 * THE ONE WRITER.  This module is the only thing that toggles `kbm-precision` / `kbm-touch` / `kbm-dense` on <html>,
 * and it compares before it toggles (no idle style invalidation).  Every visual consequence is a stylesheet rule on one
 * of them: a hover rule is written `:where(:root:not(.kbm-touch)) X:hover` (no specificity added; a page without the
 * layer keeps its hover), a touch-only reveal `:where(.kbm-touch) X`.
 *
 * THE STATIONARY-CURSOR VETO (BASINS, found by its gate): when a window closes under a motionless mouse the browser
 * sends pointerover/pointermove at the cursor's existing place; a mouse that has not moved has not been used, so such
 * an event is counted and dropped (a pointerdown is always a use).
 *
 * installKbm({ key, doc }) → kbm   once per page (later calls return the same layer); createApp and createGui call it.
 *   key   the localStorage key of the pref (default 'mir.pointer'; BASINS passes its own 'mandel.inputMode')
 * kbm.mode() → 'touch' | 'precision'      kbm.precision() → boolean    kbm.dense() → boolean
 * kbm.onChange(fn) → off                 fn(state, why) on every mode / dense change ('mode' · 'dense-on' · 'dense-off' · 'media')
 * kbm.pref() / kbm.setPref('auto' | 'touch' | 'precision') → state
 * kbm.state() → { mode, pref, source, dense, denseMs, lastType, mouseSeen, touchSeen, switches, pointerEvents, stationary,
 *                 pointersDown, keys, media, precision, hoverOk }
 * kbm.feel({ denseMs }) → { KBM_DENSE_MS }   the dwell, a feel lever (0 … 10000 ms)
 * kbm.simulate(type) → state             a gate's way in: a pointerType through the same path a real event takes
 * kbm.installed → boolean
 * hoverable(e) — may this pointer event act as a hover (the menubar, the logo seat)?  Not a touch, and not while the
 *   layer says touch (a pinned TOUCH pref included).  Without the layer: any non-touch pointer, as before.
 * pointerCoarse(doc) — the cursor effects' off rule (fx/pointer-light.js): the layer's touch mode, or with no layer the
 *   media query `(pointer: coarse)` as before. */
import { registerDumpLines } from './describe.js';

export const KBM_KEY = 'mir.pointer';
export const KBM_PREFS = Object.freeze(['auto', 'touch', 'precision']);
/** the dwell before a precision session may change geometry (BASINS' 600 ms) */
export let KBM_DENSE_MS = 600;

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
const S = {
  installed: false, doc: null, key: KBM_KEY,
  pref: 'auto', mode: 'touch', source: 'boot',
  lastType: null, lastAt: 0, mouseSeen: false, touchSeen: false,
  mx: null, my: null, stationary: 0,
  dense: false, down: 0, switches: 0, pointerEvents: 0,
  keys: { presses: 0, lastAt: 0, hardware: false },
  media: { fine: false, coarse: false, anyFine: false, anyCoarse: false, hover: false, anyHover: false },
};
const listeners = [];
let MQ = {}, denseTimer = 0;
const QUERIES = { fine: '(pointer: fine)', coarse: '(pointer: coarse)', anyFine: '(any-pointer: fine)', anyCoarse: '(any-pointer: coarse)', hover: '(hover: hover)', anyHover: '(any-hover: hover)' };

function readMedia() { for (const k of Object.keys(QUERIES)) S.media[k] = !!(MQ[k] && MQ[k].matches); return S.media; }

/** the three root classes — the only DOM this layer writes, each compared before it is toggled */
function paint() {
  const c = S.doc && S.doc.documentElement && S.doc.documentElement.classList; if (!c) return;
  const p = S.mode === 'precision';
  if (c.contains('kbm-precision') !== p) c.toggle('kbm-precision', p);
  if (c.contains('kbm-touch') !== !p) c.toggle('kbm-touch', !p);
  if (c.contains('kbm-dense') !== S.dense) c.toggle('kbm-dense', S.dense);
}
function fire(why) { const s = state(); for (const fn of listeners.slice()) { try { fn(s, why); } catch (e) { try { console.warn('kbm: a listener threw', e); } catch (_) {} } } }

/** arm, disarm or drop the density step: ONE function, so the asymmetry lives in one place */
function reconsiderDense() {
  const eligible = S.mode === 'precision' && S.mouseSeen && S.down === 0;
  if (!eligible) {
    if (denseTimer) { clearTimeout(denseTimer); denseTimer = 0; }
    if (S.dense) { S.dense = false; paint(); fire('dense-off'); }
    return;
  }
  if (S.dense || denseTimer) return;
  denseTimer = setTimeout(() => {
    denseTimer = 0;
    if (S.mode !== 'precision' || !S.mouseSeen || S.down !== 0) return;
    S.dense = true; paint(); fire('dense-on');
  }, KBM_DENSE_MS);
}

/** THE ONE PLACE THE MODE IS WRITTEN */
function setMode(want, source) {
  const m = want === 'precision' ? 'precision' : 'touch', changed = m !== S.mode;
  S.mode = m; S.source = source;
  if (changed) S.switches++;
  if (m !== 'precision') { if (denseTimer) { clearTimeout(denseTimer); denseTimer = 0; } S.dense = false; }   // touch takes density back in the same turn
  paint();
  if (changed) fire('mode');
  reconsiderDense();
  return S.mode;
}

/** the mode from the pref and whatever evidence exists */
function decide(source) {
  if (S.pref === 'touch' || S.pref === 'precision') return setMode(S.pref, 'forced');
  if (S.lastType === 'mouse' || S.lastType === 'pen') return setMode('precision', 'pointer');
  if (S.lastType === 'touch') return setMode('touch', 'pointer');
  readMedia();
  return setMode(S.media.fine && S.media.hover ? 'precision' : 'touch', source || 'media');   // no event yet: the PRIMARY pointer only
}

/** every pointer event, at the document, in the CAPTURE phase (a stopPropagation cannot hide it); the hot path leaves
 *  at once when the pointerType has not changed */
function notePointer(e) {
  const t = e && e.pointerType;
  if (t !== 'mouse' && t !== 'touch' && t !== 'pen') return;          // a constructed event carries '' and is not a kind
  S.pointerEvents++;
  if (t === S.lastType) { if (t !== 'touch') { S.mx = e.clientX; S.my = e.clientY; } return; }
  if (t !== 'touch' && e.type !== 'pointerdown' && S.mx !== null && S.my !== null && typeof e.clientX === 'number' &&
      Math.abs(e.clientX - S.mx) < 0.5 && Math.abs(e.clientY - S.my) < 0.5) { S.stationary++; return; }   // the stationary-cursor veto
  if (t !== 'touch' && typeof e.clientX === 'number') { S.mx = e.clientX; S.my = e.clientY; }
  S.lastType = t; S.lastAt = now();
  if (t === 'touch') S.touchSeen = true; else S.mouseSeen = true;
  decide('pointer');
}
function noteDown(e) {
  const t = e && e.pointerType; if (t !== 'mouse' && t !== 'touch' && t !== 'pen') return;
  S.down++; notePointer(e); reconsiderDense();
}
function noteUp(e) {
  const t = e && e.pointerType; if (t !== 'mouse' && t !== 'touch' && t !== 'pen') return;
  S.down = Math.max(0, S.down - 1); reconsiderDense();
}
/** keys: "keys were pressed", and a one-way proof of a hardware keyboard (a keydown with nothing editable focused) */
function noteKey(e) {
  if (!e || e.repeat) return;
  S.keys.presses++; S.keys.lastAt = now();
  if (!S.keys.hardware) { const a = S.doc && S.doc.activeElement; if (!(a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable))) S.keys.hardware = true; }
}

function state() {
  return { mode: S.mode, pref: S.pref, source: S.source, dense: S.dense, denseMs: KBM_DENSE_MS, lastType: S.lastType, lastAt: S.lastAt,
    mouseSeen: S.mouseSeen, touchSeen: S.touchSeen, switches: S.switches, pointerEvents: S.pointerEvents, stationary: S.stationary,
    pointersDown: S.down, keys: { ...S.keys }, media: { ...S.media }, precision: S.mode === 'precision', hoverOk: S.mode === 'precision', installed: S.installed };
}

function setPref(p) {
  const want = p === 'touch' || p === 'precision' ? p : 'auto';
  S.pref = want;
  try { const ls = S.doc && S.doc.defaultView && S.doc.defaultView.localStorage; if (ls) { if (want === 'auto') ls.removeItem(S.key); else ls.setItem(S.key, want); } } catch (_) {}
  decide('forced');
  fire('pref');
  return state();
}

export const kbm = {
  mode: () => S.mode,
  precision: () => S.mode === 'precision',
  dense: () => S.dense,
  pref: () => S.pref,
  setPref,
  state,
  onChange(fn) { if (typeof fn === 'function' && !listeners.includes(fn)) listeners.push(fn); return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); }; },
  feel(o) { if (o && 'denseMs' in o) { const x = Number(o.denseMs); if (Number.isFinite(x) && x >= 0 && x <= 10000) KBM_DENSE_MS = x; } reconsiderDense(); return { KBM_DENSE_MS }; },
  simulate(t) { notePointer({ pointerType: String(t) }); return state(); },
  get installed() { return S.installed; },
};

/** hoverable(e) — may this pointer event act as a hover?  Not a touch; with the layer, only while it says precision */
export const hoverable = (e) => !!e && e.pointerType !== 'touch' && (!S.installed || S.mode === 'precision');

/** pointerCoarse(doc) — the cursor effects' off rule: the layer's touch mode, or the media query without the layer */
export function pointerCoarse(doc = globalThis.document) {
  if (S.installed) return S.mode !== 'precision';
  const win = doc && doc.defaultView;
  return !!(win && win.matchMedia && win.matchMedia('(pointer: coarse)').matches);
}

export function installKbm({ key = KBM_KEY, doc = globalThis.document } = {}) {
  if (S.installed || !doc || !doc.defaultView) return kbm;
  S.installed = true; S.doc = doc; S.key = key;
  const win = doc.defaultView;
  try { const v = win.localStorage.getItem(key); S.pref = v === 'touch' || v === 'precision' ? v : 'auto'; } catch (_) {}
  MQ = {};
  for (const [k, q] of Object.entries(QUERIES)) { try { MQ[k] = win.matchMedia ? win.matchMedia(q) : null; } catch (_) { MQ[k] = null; } }
  readMedia();
  /* the media queries are live: plugging a mouse in changes what is possible (the dump says so) without changing a pixel */
  for (const m of Object.values(MQ)) if (m && m.addEventListener) m.addEventListener('change', () => { readMedia(); if (S.lastType === null) decide('media'); fire('media'); });
  const o = { capture: true, passive: true };
  doc.addEventListener('pointerdown', noteDown, o);
  doc.addEventListener('pointermove', notePointer, o);
  doc.addEventListener('pointerover', notePointer, o);
  doc.addEventListener('pointerup', noteUp, o);
  doc.addEventListener('pointercancel', noteUp, o);
  doc.addEventListener('keydown', noteKey, o);
  decide('boot');
  registerDumpLines('input', () => {
    const s = state(), m = s.media, cap = [];
    if (m.fine) cap.push('pointer:fine'); if (m.coarse) cap.push('pointer:coarse'); if (m.anyFine && !m.fine) cap.push('any-pointer:fine');
    if (m.hover) cap.push('hover:hover'); if (m.anyHover && !m.hover) cap.push('any-hover:hover');
    return ['input mode  ' + s.mode.toUpperCase() + (s.dense ? ' + DENSE' : '') + '   pref ' + s.pref.toUpperCase() + '   decided by ' + s.source +
        '   last pointer ' + (s.lastType || 'none yet') + '   switches ' + s.switches + '   [MIR OPTIONS › MOTION › POINTER; __MIR.kbm.state()]',
      '            capability [' + (cap.join(', ') || 'none reported') + ']   mouse/pen seen ' + (s.mouseSeen ? 'YES' : 'no') + '   touch seen ' + (s.touchSeen ? 'YES' : 'no') +
        '   keys ' + s.keys.presses + (s.keys.hardware ? ' (hardware keyboard proven)' : '') + (s.stationary ? '   stationary-cursor events ignored ' + s.stationary : '') +
        '   density arms after ' + s.denseMs + ' ms of observed mouse, drops on the first touch'];
  });
  try { const g = win.__MIR || (win.__MIR = {}); g.kbm = kbm; } catch (_) {}
  return kbm;
}
