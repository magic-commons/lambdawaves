/* controls/range.js — THE RANGE SLIDER: one track, two thumbs, a lo and a hi.
 *
 * THE LAW IT KEEPS: A LO/HI PAIR IS ONE CONTROL, NOT TWO KNOBS (docs/CONTROLS.md; the census found AUTOMATA's LO/HI, EARTH's RANGE and
 * NEBULA's BLACK/WHITE as pairs of knobs that could cross).  The thumbs never cross: each stops against the other (less `minGap`).
 * Each thumb is a MODULATION TARGET on its own, with the same widget contract as the kit's knob and fader (root, get, set, show, shown,
 * setBase, setDisabled, setDefault, paint): a routed thumb keeps the hand's base (a small tick) and paints the modulated value over it.
 * THE HAND is the one knob law (kit.js `verticalDrag`'s gear, applied along the track): ⅛ fine on any modifier or a second finger, on a
 * virtual point; a press on the track brings the NEAREST thumb to it (unless the gear is engaged: then nothing jumps); a double-tap on a
 * thumb is home.  The keys on a thumb: ← ↓ and → ↑ one hundredth of the range (one step on a stepped range, Shift ignored there, as on a stepped knob),
 * Shift ⅛ of that, Page ten, Home and End its bounds.
 *   rangeSlider({ label, aria, min, max, lo, hi, step, log, fmt, minGap, onInput, onChange, cls, loLabel, hiLabel })
 *     onInput(lo, hi) while a thumb moves; onChange(lo, hi) when a gesture or key lands.  minGap is in value units (default: one step, or 0).
 *   → { root, lo, hi, get() → [lo, hi], set(lo, hi), setDisabled(on), destroy() }   (lo and hi are the thumb widgets)
 * The pure parts (for tests): rangeBounds, nearestThumb. */
import { el, label, ariaLabel, hint, watchTouches, gearOf, tapWatcher } from '../kit.js';
import { setVar, setText, setAttr } from '../core/perf.js';
import { digitsOf } from './number.js';
import { t as tx } from '../core/i18n.js';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** rangeBounds(which, lo, hi, { min, max, minGap }) → [floor, ceiling] the named thumb may take (pure) */
export function rangeBounds(which, lo, hi, { min, max, minGap = 0 }) {
  return which === 'lo' ? [min, Math.max(min, hi - minGap)] : [Math.min(max, lo + minGap), max];
}
/** nearestThumb(u, ulo, uhi) → 'lo' | 'hi': the thumb nearest to a press at u (a tie goes to the side the press is on) (pure) */
export function nearestThumb(u, ulo, uhi) {
  const a = Math.abs(u - ulo), b = Math.abs(u - uhi);
  return a < b ? 'lo' : b < a ? 'hi' : (u >= uhi ? 'hi' : 'lo');
}

export function rangeSlider(o = {}) {
  const min = o.min, max = o.max, log = !!o.log && min > 0 && max > min, step = o.step > 0 ? o.step : 0;
  const gap = o.minGap > 0 ? o.minGap : step;
  const digits = digitsOf(step) || 2;
  const fmt = o.fmt || ((x) => x.toFixed(digits));
  const norm = (x) => (log ? clamp01(Math.log(x / min) / Math.log(max / min)) : clamp01((x - min) / (max - min)));
  const denorm = (u) => (log ? min * Math.pow(max / min, clamp01(u)) : min + clamp01(u) * (max - min));
  const snap = (x) => (step ? Math.round((x - min) / step) * step + min : x);
  const root = el('div', 'mir-range' + (o.cls ? ' ' + o.cls : ''));
  root.dir = 'ltr';                                                   // a value control never mirrors
  if (o.label) label(el('div', 'k-lbl', root), o.label);
  const rail = el('div', 'mir-rng-rail', root);
  el('i', 'mir-rng-track', rail);
  const spanEl = el('i', 'mir-rng-span', rail);
  const vals = el('div', 'mir-rng-vals', root);
  const state = { lo: o.lo ?? min, hi: o.hi ?? max }, def = { lo: state.lo, hi: state.hi };
  let disabled = false, drag = null;
  watchTouches();

  function thumb(which, nm) {
    const baseEl = el('i', 'mir-rng-base', rail); baseEl.hidden = true;
    const t = el('div', 'rng-t rng-' + which, rail); t.tabIndex = 0; t.setAttribute('role', 'slider');
    const valEl = el('span', 'mir-rng-val rng-' + which, vals);
    const name = nm || (o.aria || o.label ? (o.aria || o.label) + ' ' + (which === 'lo' ? 'low' : 'high') : null);
    if (name) ariaLabel(t, name);
    let shown = null, baseOf = null, saidNow = null, saidText = null;
    const bounds = () => rangeBounds(which, state.lo, state.hi, { min, max, minGap: gap });
    const announce = (fromUser) => {
      const [bl, bh] = bounds();
      setAttr(t, 'aria-valuemin', String(bl)); setAttr(t, 'aria-valuemax', String(bh));
      let b = null; if (baseOf) { try { const x = baseOf(); if (Number.isFinite(x)) b = x; } catch (_) {} }
      if (b === null && !fromUser && t === t.ownerDocument.activeElement) return;                        // the chatter guard: never announce a change the APP made to a thumb the user sits on
      const base = b !== null ? (fromUser ? state[which] : b) : state[which];      // a driven thumb speaks its BASE (the kit's wave-68 law), the hand's number
      const mod = b !== null ? 'base' : shown !== null && !(drag && drag.which === which) ? 'mod' : '';
      const now = String(base), said = mod + '|' + fmt(base);
      if (saidNow !== now) { saidNow = now; t.setAttribute('aria-valuenow', now); }
      if (saidText !== said) { saidText = said; t.setAttribute('aria-valuetext', mod === 'base' ? tx('{value} · base · modulated', { value: fmt(base) }) : mod ? tx('{value} · modulated', { value: fmt(base) }) : fmt(base)); }
    };
    const paint = (fromUser) => {
      const sv = shown !== null && !(drag && drag.which === which) ? shown : state[which];
      setVar(t, '--u', +norm(sv).toFixed(5)); setText(valEl, fmt(sv));
      const mod = shown !== null && !(drag && drag.which === which);
      t.classList.toggle('mod', mod); baseEl.hidden = !mod;
      if (mod) setVar(baseEl, '--u', +norm(state[which]).toFixed(5));
      announce(fromUser);
    };
    const api = { root: t, get: () => state[which],
      /** the hand's value, held against the other thumb */
      set(x, silent = true) { const [bl, bh] = bounds(); x = Math.min(bh, Math.max(bl, snap(x))); state[which] = x; shown = null; paintAll(); if (!silent && o.onChange) o.onChange(state.lo, state.hi); },
      /** paint a modulated value over the base; the base stays the hand's (and a drag's start) */
      show(x) { shown = x; paint(); }, get shown() { return shown; },
      setBase(fn) { baseOf = typeof fn === 'function' ? fn : null; announce(false); },
      setDefault(x) { def[which] = x; },
      setDisabled(on) { t.classList.toggle('disabled', !!on); t.tabIndex = on ? -1 : 0; t.setAttribute('aria-disabled', String(!!on)); },
      paint, which };
    t._api = api;
    return api;
  }
  const lo = thumb('lo', o.loLabel), hi = thumb('hi', o.hiLabel);
  const T = { lo, hi };
  function paintSpan() { setVar(spanEl, '--u-lo', +norm(state.lo).toFixed(5)); setVar(spanEl, '--u-hi', +norm(state.hi).toFixed(5)); }
  function paintAll(fromUser) { paintSpan(); lo.paint(fromUser); hi.paint(fromUser); }
  const emit = () => { if (o.onInput) o.onInput(state.lo, state.hi); };
  const land = () => { if (o.onChange) o.onChange(state.lo, state.hi); };
  /** move a thumb to value x, held against the other: true if it moved */
  function move(which, x, fromUser = true) {
    const [bl, bh] = rangeBounds(which, state.lo, state.hi, { min, max, minGap: gap });
    x = Math.min(bh, Math.max(bl, snap(x)));
    if (x === state[which]) return false;
    state[which] = x; paintAll(fromUser); emit(); return true;
  }

  /* ── the hand ── */
  const widthOf = () => rail.getBoundingClientRect().width || 1;
  const tap = { lo: tapWatcher(() => homeOf('lo')), hi: tapWatcher(() => homeOf('hi')) };
  function homeOf(which) { if (move(which, def[which])) land(); }
  rail.addEventListener('pointerdown', (e) => {
    if (disabled || drag || e.button) return;
    const r = rail.getBoundingClientRect();
    const onThumb = e.target.closest && e.target.closest('.rng-t');
    const u = clamp01((e.clientX - r.left) / Math.max(1, r.width));
    const which = onThumb ? (onThumb.classList.contains('rng-lo') ? 'lo' : 'hi') : nearestThumb(u, norm(state.lo), norm(state.hi));
    e.preventDefault(); try { rail.setPointerCapture(e.pointerId); } catch (_) {}
    T[which].root.focus({ preventScroll: true });
    drag = { id: e.pointerId, which, lastX: e.clientX, w: r.width || 1, u: norm(state[which]), tie: !!onThumb && state.hi - state.lo <= gap };   // two thumbs on one spot: the first move chooses which one goes
    rail.classList.add('drag'); T[which].root.classList.add('drag');
    if (onThumb) tap[which](e);
    if (!onThumb && gearOf(e, e.pointerId) === 1) { drag.u = u; move(which, denorm(u)); }
  });
  rail.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (drag.tie && e.clientX !== drag.lastX) {
      drag.tie = false; const w = e.clientX > drag.lastX ? 'hi' : 'lo';
      if (w !== drag.which) { T[drag.which].root.classList.remove('drag'); drag.which = w; drag.u = norm(state[w]); T[w].root.classList.add('drag'); T[w].root.focus({ preventScroll: true }); }
    }
    drag.u =clamp01(drag.u + gearOf(e, drag.id) * (e.clientX - drag.lastX) / drag.w);   // the virtual point: the gear moves nothing by itself
    drag.lastX = e.clientX;
    const x = denorm(drag.u), [bl, bh] = rangeBounds(drag.which, state.lo, state.hi, { min, max, minGap: gap });
    if (x < bl || x > bh) drag.u = norm(Math.min(bh, Math.max(bl, x)));                  // pinned against the other thumb: the point stays on the edge
    move(drag.which, denorm(drag.u));
  });
  const end = (e) => {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    const d = drag; drag = null; rail.classList.remove('drag'); T[d.which].root.classList.remove('drag');
    paintAll(); land();
  };
  rail.addEventListener('pointerup', end); rail.addEventListener('pointercancel', end); rail.addEventListener('lostpointercapture', end);
  rail.addEventListener('dblclick', (e) => { const t = e.target.closest && e.target.closest('.rng-t'); if (t) { e.preventDefault(); homeOf(t.classList.contains('rng-lo') ? 'lo' : 'hi'); } });
  rail.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });
  /* the keys, on a thumb: one hundredth of the range, Shift an eighth of it (the one gear), Page ten; Home and End its bounds */
  const KEYDIR = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 1, PageDown: -1 };
  for (const which of ['lo', 'hi']) T[which].root.addEventListener('keydown', (e) => {
    if (disabled || e.ctrlKey || e.metaKey || e.altKey) return;
    const dir = KEYDIR[e.code] || 0, page = e.code === 'PageUp' || e.code === 'PageDown';
    const [bl, bh] = rangeBounds(which, state.lo, state.hi, { min, max, minGap: gap });
    let x = state[which];
    if (dir) {
      if (step && !log) x = x + dir * step * (page ? 10 : 1);
      else x = denorm(norm(x) + dir * 0.01 * (page ? 10 : 1) * (e.shiftKey ? 0.125 : 1));
    } else if (e.code === 'Home') x = bl; else if (e.code === 'End') x = bh;
    else if (e.code === 'Delete' || e.code === 'Backspace') x = def[which]; else return;
    e.preventDefault();
    if (move(which, x)) land();
  });
  hint(root, o.title || '');
  paintAll();
  return { root, lo, hi, get: () => [state.lo, state.hi], set(l, h) { state.lo = Math.min(max, Math.max(min, snap(l))); state.hi = Math.min(max, Math.max(state.lo, snap(h))); lo.set(state.lo); hi.set(state.hi); },
    setDisabled(on) { disabled = !!on; root.classList.toggle('disabled', disabled); lo.setDisabled(on); hi.setDisabled(on); },
    destroy() { root.remove(); } };
}
