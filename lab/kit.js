/* kit.js — the control kit and the device chassis, in the house rack grammar.
 *
 * Primitive types are preserved (§23): boolean → switch, scalar → knob or fader,
 * enumeration → segmented select, event → trigger.  Every control is a real 44 px seat,
 * takes pointer events (mouse, pen and touch alike, `touch-action: none`), and the rack
 * wheel never changes a hovered control (§24).  Knobs reset on double-tap.
 *
 * ── WAVE 62 · EVERY CONTROL IS OPERABLE FROM A KEYBOARD, AND THE LAW WAS ALREADY HERE ───────────
 * `knob()`'s pointer drag moves normalized TRAVEL (`p`) and then denormalizes.  So the key law is
 * not a new one: AN ARROW MOVES A KNOB'S TRAVEL BY A FIXED FRACTION, NEVER ITS VALUE BY A FIXED
 * AMOUNT — one rule that covers a linear and a logarithmic dial with no new mathematics, because on
 * a log knob a fixed fraction of travel is a constant RATIO: 1/100 of RATE's travel is ×1.1085907 at
 * 0.1 and ×1.1085907 at 3000, where a fixed additive step would be a 40 000-press crawl at the bottom
 * and invisible at the top.  1/100 is `<input type=range>`'s own unset-step resolution, which is
 * the muscle memory AT users arrive with; Shift is ×0.25, INHERITED from the pointer's fine drag
 * (220/900) and from the action dispatcher's own `e.shiftKey ? 0.25 : 1`, never re-invented.
 *
 * A CONTROL ANNOUNCES ITSELF THROUGH ITS OWN `fmt`, never as a bare number.  That is correctness
 * here, not taste: DRAG γ formats 0 as 'off', FRICTION formats 0 as '∞ · forever', ELEMENT Z formats
 * 10 as 'Z = 10  Ne'.  `aria-valuetext` carries the unit and the domain word; `aria-valuenow` keeps
 * the tree numerically honest underneath it.
 *
 * AND THE HAZARD, which is the whole reason `paint()` takes an argument: `paint()` runs from the
 * frame loop — for the scrub, for every `[data-live]` dial and for every modulated target — and a
 * screen reader announces a FOCUSED slider's value change.  Writing `aria-valuetext` at 60 Hz on a
 * focused control is a live region built BY ACCIDENT, a hundred readouts speaking ten times a
 * second.  So the value is written when the USER moved it, or when nobody is sitting on it, and
 * never in the one case that would speak.  One boolean; B127 measures that it worked.
 *
 * ── WAVE 68 · SILENCE IS HONEST; A STALE NUMBER IS NOT ──────────────────────────────────────────
 * The guard above holds — a live LFO on the dial under the user's own finger makes ZERO aria
 * mutations across three seconds — but for four waves what it left standing in the tree was the
 * string from the moment focus ARRIVED, measured 9.3× off the instrument (ear 1.00 · eye 9.33 ·
 * model 10.27), and even the user's own arrow announced 10.80 while the dial was at 12.00.  A
 * screen-reader user reads `aria-valuetext` ON DEMAND, not only when it changes, so "nothing is
 * spoken" and "what is there is true" are two separate promises and only the first was kept.
 *   THE LAW: **a control the app is driving under a focused user announces THE BASE — the number
 *   the user's own hand owns — and says the word.**  It is not a claim about the current value and
 *   it does not pretend to be one.  On a modulated dial the base is exactly what an arrow writes
 *   (rack.js `modHand`: on a routed parameter `write` IS `setBase`), so the arrow's own
 *   announcement and the frame loop's agree by construction and the mutation count stays at 0 —
 *   the base moves only when the user moves it.  `setBase(fn)` is the one wire: rack.js hands each
 *   of the eleven modulation targets its registry base, and a dial nobody drives never sees it.
 *   B140 gates the EAR, the EYE and the MODEL together, which is what B127 could not see.
 */
import { setGlyph } from './mir/glyph.js';


export const chip = (btn, name, label) => setGlyph(btn, name, { label });


const M_RUN = /<m>([\s\S]*?)<\/m>/g;
/** true if `s` carries at least one marked run — one indexOf, so every call site can ask cheaply */
export const hasMath = (s) => typeof s === 'string' && s.indexOf('<m>') >= 0;
/** the string with its markers removed — for `title`, `aria-label`, and anything else that is text */
export const mathPlain = (s) => (typeof s === 'string' ? s.replace(/<\/?m>/g, '') : s);
/** write `s` into `node`, every `<m>…</m>` run becoming an <m> element.  No innerHTML anywhere. */
export function mathText(node, s) {
  const str = s === undefined || s === null ? '' : String(s);
  if (!hasMath(str)) { node.textContent = str; return node; }
  node.textContent = '';
  let i = 0, m; M_RUN.lastIndex = 0;
  while ((m = M_RUN.exec(str)) !== null) {
    if (m.index > i) node.appendChild(document.createTextNode(str.slice(i, m.index)));
    const e = document.createElement('m'); e.textContent = m[1]; node.appendChild(e);
    i = m.index + m[0].length;
  }
  if (i < str.length) node.appendChild(document.createTextNode(str.slice(i)));
  return node;
}

export function el(tag, cls, parent, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  /* the marker is honoured HERE and so every widget in the kit gets it at once — a label, an option,
     a title, a group heading and a readout's value are all one line of DOM creation in this file */
  if (text !== undefined && text !== null) mathText(e, text);
  if (parent) parent.appendChild(e);
  return e;
}
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** double-tap detector shared by knobs and faders — and, since wave 61, by the modulation
 *  ARC on a routed knob, so the 320 ms that separates a tap from a double-tap is ONE number
 *  in ONE file and the arc's "double-tap to remove the route" feels like the dial's own
 *  "double-tap to default". */
export function tapWatcher(fn) {
  let last = 0;
  return () => { const now = performance.now(); if (now - last < 320) { last = 0; fn(); } else last = now; };
}

/**
 * knob({ label, min, max, value, log, wrap, step, fmt, unit, onInput, onChange, onDelta, size })
 *   wrap: free-spinning (phase); onDelta(dRad) reports drag deltas instead of absolute values.
 */
export function knob(o) {
  const root = el('div', 'k' + (o.size === 'lg' ? ' k-lg' : '') + (o.cls ? ' ' + o.cls : ''));
  if (o.label) el('div', 'k-lbl', root, o.label);
  const dial = el('div', 'k-dial', root);
  const needle = el('i', 'k-needle', dial);
  const val = el('div', 'k-val', root);
  let v = o.value, def = o.value, dragging = false, disabled = false;
  const lo = o.min, hi = o.max, log = !!o.log;
  const norm = (x) => log ? (Math.log(x) - Math.log(lo)) / (Math.log(hi) - Math.log(lo)) : (x - lo) / (hi - lo);
  const denorm = (p) => log ? Math.exp(Math.log(lo) + p * (Math.log(hi) - Math.log(lo))) : lo + p * (hi - lo);
  const fmt = o.fmt || ((x) => (Math.abs(x) >= 100 ? x.toFixed(0) : Math.abs(x) >= 10 ? x.toFixed(1) : x.toFixed(2)) + (o.unit || ''));
  /* WAVE 62 · THE DIAL IS A SLIDER.  The role goes on the ROOT, not the dial: skin.css's
     `.k:focus-within .k-val` has been waiting for a focusable root since it was written, so the value
     tooltip appears on Tab for free.  No `aria-orientation` — a knob is neither horizontal nor
     vertical and both arrow axes work, exactly as the pointer sums both axes.
     A JOG WHEEL (`o.onDelta`: ROTATE z, STARK K_z, DEFECT L², the palette's ROTATE) holds no value:
     it reports drag deltas.  It is still a slider, and what it announces is THE TURN IT HAS APPLIED —
     0…360°, folded — which is honest, satisfies ARIA's demand for a valuenow, and is the same
     normalized-travel law as everything else (one arrow is 2π/100 of a turn). */
  const wheel = !!o.onDelta;
  let turn = 0;                                             // a wheel's applied rotation, degrees in [0, 360)
  root.tabIndex = 0;
  root.setAttribute('role', 'slider');
  const ariaName = o.aria || o.label;                       // `aria` OVERRIDES: the two nameless dials and the 91 spectrum lanes name themselves at the call site
  if (ariaName) root.setAttribute('aria-label', mathPlain(ariaName));
  root.setAttribute('aria-valuemin', String(wheel ? 0 : lo));
  root.setAttribute('aria-valuemax', String(wheel ? 360 : hi));
  if (o.title) root.title = mathPlain(o.title);             // knob() silently dropped `title:` at ten call sites; the hint was already written
  /** the announcement — guarded, and only ever the string the eye is reading (`fmt`), never a bare number.
   *  The two `!==` compare against a CLOSURE and not the DOM: paint() runs on the frame loop for every
   *  live and every modulated dial, and this module already knows what it last wrote. */
  let saidNow = null, saidText = null, baseOf = null;
  /** WAVE 68 · the host's road to THE NUMBER THE USER OWNS.  `fn()` returns the base of a driven
   *  parameter, or null/undefined when nothing is driving this dial (see the header). */
  function setBase(fn) { baseOf = fn; }
  function announce(fromUser) {
    const focused = root === document.activeElement;
    /* A DRIVEN DIAL SPEAKS ITS BASE, focused or not, and on the user's own write too — the value an
       arrow has just set IS the base the host is about to store, so the two agree with no second
       mutation one frame later.  `b` is null for every dial nobody is driving, which is all of them
       until a route is made, and then the wave-62 law below is the whole law. */
    let b = null;
    if (!wheel && baseOf) { try { const x = baseOf(); if (Number.isFinite(x)) b = x; } catch (_) {} }
    if (b !== null) {
      const now = String(fromUser ? v : b), text = fmt(fromUser ? v : b) + ' · base · modulated';
      if (saidNow !== now) { saidNow = now; root.setAttribute('aria-valuenow', now); }
      if (saidText !== text) { saidText = text; root.setAttribute('aria-valuetext', text); }
      return;
    }
    if (!fromUser && focused) return;                                  // THE CHATTER GUARD: never announce a change the APP made to a control the user is sitting on
    const now = String(wheel ? turn : v), text = wheel ? (turn ? '+' + turn.toFixed(0) + '° · ' : '') + val.textContent : val.textContent;
    if (saidNow !== now) { saidNow = now; root.setAttribute('aria-valuenow', now); }
    if (saidText !== text) { saidText = text; root.setAttribute('aria-valuetext', text); }
  }
  function paint(fromUser) {
    const p = o.wrap ? (norm(v) % 1 + 1) % 1 : clamp01(norm(v));
    needle.style.setProperty('--turn', (o.wrap ? p * 360 : -135 + p * 270) + 'deg');
    val.textContent = fmt(v);
    announce(fromUser);
  }
  /** WAVE 68 · ONE QUANTISER, ONE FOLD, ONE CLAMP — and BOTH ROADS TAKE IT.  The fold lived in the
   *  keydown handler alone, so the sentence below ("`v` is folded back into [lo, hi) so `get()` and
   *  `aria-valuenow` stay inside [valuemin, valuemax]") was true of the keyboard and false of the
   *  hand: one mouse drag on ACCENT A left `aria-valuenow="654.5454545454545"` against a declared
   *  `aria-valuemax="360"`, and the eye read 655° on a 0–360 dial.  A law with two implementations
   *  is a law with one (ANTI-PATTERN 20); this is the one. */
  const settle = (nv) => {
    if (o.step) nv = Math.round(nv / o.step) * o.step;
    if (o.wrap) return lo + ((((nv - lo) % (hi - lo)) + (hi - lo)) % (hi - lo));
    return Math.min(hi, Math.max(lo, nv));
  };
  let p0 = 0, x0 = 0, y0 = 0, acc = 0;
  dial.addEventListener('pointerdown', (e) => {
    if (disabled) return;
    e.preventDefault(); try { dial.setPointerCapture(e.pointerId); } catch (_) {}   // a pointer already gone (or a synthetic one) must not abort the drag
    dragging = true; root.classList.add('drag'); root.classList.add('active'); p0 = norm(v); x0 = e.clientX; y0 = e.clientY; acc = 0;
    tap();
  });
  dial.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dp = ((y0 - e.clientY) + (e.clientX - x0)) / (e.shiftKey ? 900 : 220);
    if (o.onDelta) { const d = dp - acc; acc = dp; turn = ((turn + d * 360) % 360 + 360) % 360; o.onDelta(d * 2 * Math.PI); announce(true); return; }
    const nv = settle(denorm(o.wrap ? p0 + dp : clamp01(p0 + dp)));
    if (nv !== v) { v = nv; paint(); if (o.onInput) o.onInput(v); }
  });
  const end = () => { if (!dragging) return; dragging = false; root.classList.remove('drag'); setTimeout(() => root.classList.remove('active'), 700); if (o.onChange && !o.onDelta) o.onChange(v); };
  dial.addEventListener('pointerup', end); dial.addEventListener('pointercancel', end);
  const reset = () => { if (o.onDelta) { if (o.onReset) o.onReset(); return; } v = def; paint(); if (o.onInput) o.onInput(v); if (o.onChange) o.onChange(v); };
  const tap = tapWatcher(reset);                       // two taps within 320 ms reset the control to its default …
  dial.addEventListener('dblclick', (e) => { e.preventDefault(); reset(); });   // … and so does a double-click
  dial.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });
  /* THE KEY MAP.  Δp = 1/100 of TRAVEL · Shift ×0.25 · Page ×10 · Home/End the ends · Delete resets.
     Three rulings a builder gets wrong, so they are written here rather than inferred:
       · SHIFT ON A STEPPED KNOB IS IGNORED.  `o.step` quantizes with Math.round(nv/step)*step, so a
         quarter-step lands off the lattice, rounds straight back to where it started, and Shift+Arrow
         becomes a DEAD KEY.  One arrow is one step, and Shift changes nothing.
       · `log` + `step` together (COUNT, n̄) step in VALUE space — denorm first, quantize second, which
         is exactly what the pointer does.  COUNT goes 160 → 170, which is what `step: 10` means.
       · A WRAP KNOB DOES NOT CLAMP, at the seam or anywhere.  From HUE = 0 one ArrowLeft lands at 0.99
         and the needle has gone the short way round; phase is an angle.  `v` is folded back into
         [lo, hi) by `settle()` — on BOTH roads since wave 68 — so `get()` and `aria-valuenow` stay
         inside [valuemin, valuemax].
       · AND WHAT `End` MEANS ON A WHEEL, ruled in wave 68 because the old answer made a declared
         attribute unreachable: Home, End and Delete were three names for the seam, so a dial that
         published `aria-valuemax="360"` could never announce it, which is a control telling an
         assistive technology something untrue.  **End is the declared maximum and it is NOT folded**
         — on a circle `hi` and `lo` are the same POINT and two different NUMBERS, so End paints the
         seam and says 360°, Home paints the seam and says 0°, and every arrow from either folds back
         into [lo, hi) as before.  The needle cannot tell them apart; the tree can, and now both ends
         of the declared range are reachable exactly once.
     Enter and Space are NOT owned: they stay the app's, so Space still plays the transport from a
     focused dial (rack.js, THE SINGLE-KEY LAW).  Nor is any modifier: Ctrl/⌘+Z undoes from in here. */
  const KEYDIR = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 1, PageDown: -1 };
  root.addEventListener('keydown', (e) => {
    if (disabled || e.ctrlKey || e.metaKey || e.altKey) return;
    const dir = KEYDIR[e.code] || 0, page = e.code === 'PageUp' || e.code === 'PageDown';
    if (wheel) {                                            // a wheel reports a turn; it has no lo, no hi and no End
      if (dir) { e.preventDefault(); const d = dir * (page ? 10 : 1) * 2 * Math.PI / 100;
        turn = ((turn + d * 180 / Math.PI) % 360 + 360) % 360; o.onDelta(d); announce(true); return; }
      if (e.code === 'Home' || e.code === 'Delete' || e.code === 'Backspace') { e.preventDefault(); turn = 0; reset(); announce(true); return; }
      return;
    }
    let nv = v;
    if (dir) {
      if (o.step) nv = v + dir * o.step * (page ? 10 : 1);               // stepped: value space, Shift ignored
      else {
        const dp = 0.01 * (page ? 10 : 1) * (e.shiftKey ? 0.25 : 1);     // the lab's own fine modifier, inherited
        nv = denorm(o.wrap ? norm(v) + dir * dp : clamp01(norm(v) + dir * dp));
      }
    } else if (e.code === 'Home') nv = lo;
    else if (e.code === 'End') { e.preventDefault(); nv = hi;            // the declared maximum, unfolded — see the ruling above
      if (nv !== v) { v = nv; paint(true); if (o.onInput) o.onInput(v); if (o.onChange) o.onChange(v); }
      return; }
    else if (e.code === 'Delete' || e.code === 'Backspace') { e.preventDefault(); reset(); announce(true); return; }
    else return;                                                        // not ours: let it reach the app
    nv = settle(nv);
    e.preventDefault();
    if (nv !== v) { v = nv; paint(true); if (o.onInput) o.onInput(v); if (o.onChange) o.onChange(v); }
  });
  root.addEventListener('blur', () => announce(false));     // the tree catches up the moment nobody is listening
  paint();
  return { root, get: () => v, set(x, silent = true) { v = x; paint(); if (!silent && o.onChange) o.onChange(v); }, setDefault(x) { def = x; },
    /* WAVE 68 · A DEAD CONTROL SAYS SO, AND DOES NOT KEEP THE SEAT.  This wrote a class and a
       tabIndex and nothing else, so λ SCALE, HALF-WIDTH and STRENGTH mounted as sliders holding a
       live `aria-valuenow` that no key could move — and rack.js's single-key guard, keyed on the
       ROLE, then took those keys away from the app as well, so three presses reached nobody at all.
       `aria-disabled` is what the scrub one file away already wrote (rack.js setKeepFrames), and the
       guard now reads it.  And `tabIndex = -1` does NOT blur: a user who Tabbed onto λ SCALE and then
       switched SCALE back to HYDROGEN was left sitting in a dead zone, so the seat moves to the
       window's own power button — the rescue wave 62 wrote once for `inert`, used again. */
    setDisabled(on) { disabled = on; root.classList.toggle('disabled', on); root.tabIndex = on ? -1 : 0;
      root.setAttribute('aria-disabled', String(!!on));
      if (on && root === document.activeElement) { const dev = root.closest('.dev'); const seat = dev && dev.querySelector('.dev-power'); if (seat) seat.focus(); else root.blur(); } },
    setBase, paint };
}

/** sw({ label, value, onChange }) — a boolean */
export function sw(o) {
  const b = el('button', 'sw' + (o.cls ? ' ' + o.cls : ''));
  b.type = 'button';


  if (o.title) b.title = mathPlain(o.title);
  el('i', 'sw-led', b); el('span', 'sw-lbl', b, o.label);
  let v = !!o.value;
  const paint = () => { b.classList.toggle('on', v); b.setAttribute('aria-pressed', String(v)); };
  b.addEventListener('click', () => { v = !v; paint(); if (o.onChange) o.onChange(v); });
  paint();
  return { root: b, get: () => v, set(x) { v = !!x; paint(); } };
}

/** seg({ label, aria, options: [{id, label, title}], value, onChange }) — an enumeration */
export function seg(o) {
  const root = el('div', 'segw' + (o.cls ? ' ' + o.cls : ''));
  if (o.label) el('div', 'k-lbl', root, o.label);
  const row = el('div', 'seg', root);
  /* WAVE 62 · THIS IS THE ONE PLACE THE INTERFACE PRESENTED STATE IT DID NOT EXPOSE: the selection
     lived in a CSS class and nowhere else, across 42 groups and about a hundred buttons.
     A ROVING TAB STOP earns its place here, and it is the rare accessibility change that makes the
     app SMALLER: all-tabbable radios would add ~60 stops to a rack that already has hundreds, and
     roving leaves 42.  It is also the platform's own contract — an AT user ARROWS inside a
     radiogroup, they do not Tab through it.  SELECTION FOLLOWS FOCUS, which this lab can afford
     because every seg change is a one-press change under the mouse too; the one honest cost is that
     arrowing GRID from 64³ to 128³ triggers two rebuilds where a mouse triggers one, and that is not
     worth a second interaction model.  Space and Enter are the BUTTON's own activation and need no
     code here — what they need is the app to get out of the way, which is rack.js's OWNED guard. */
  row.setAttribute('role', 'radiogroup');
  const ariaName = o.aria || o.label;
  if (ariaName) row.setAttribute('aria-label', mathPlain(ariaName));
  let v = o.value; const btns = new Map(); const ids = [];
  for (const opt of o.options) {
    const b = el('button', 'seg-b', row, opt.label); b.type = 'button'; if (opt.title) b.title = mathPlain(opt.title);
    b.setAttribute('role', 'radio');
    b.addEventListener('click', () => { if (v === opt.id) return; v = opt.id; paint(); if (o.onChange) o.onChange(v); });
    b.addEventListener('keydown', onKey);
    btns.set(opt.id, b); ids.push(opt.id);
  }
  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const live = ids.filter((id) => !btns.get(id).disabled);
    if (!live.length) return;
    const i = Math.max(0, live.indexOf(v));
    let id = null;
    if (e.code === 'ArrowRight' || e.code === 'ArrowDown') id = live[(i + 1) % live.length];
    else if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') id = live[(i - 1 + live.length) % live.length];
    else if (e.code === 'Home') id = live[0];
    else if (e.code === 'End') id = live[live.length - 1];
    else return;                                            // not ours: it reaches the app
    e.preventDefault();
    const moved = id !== v;
    if (moved) { v = id; paint(); }
    const b = btns.get(id); if (b) b.focus();
    if (moved && o.onChange) o.onChange(v);
  }
  /* WAVE 68 · THE SEAT AND THE KEYS AGREE, AND THEY GO ON AGREEING.  `paint()` seated the roving tab
     stop on `on` ALONE while `onKey` above filters on `disabled` — two halves of one function
     disagreeing about what a reachable option is — and a disabled <button> is out of the tab order AND
     takes no keydown, so a group whose checked option is disabled had NO seat and NO keys.  IN P3
     shipped on Firefox with zero reachable options for exactly that reason, and the fallback's own
     comment ("a value outside the options must still leave the group reachable") is the case it did
     not cover.  The predicate is now the SAME on both sides.
     AND THE RE-SEAT IS NOT THE CALLER'S JOB: every one of the three sites that disables an option does
     it AFTER seg() has painted, so a fixed predicate alone would have changed nothing about the bug
     that shipped.  One MutationObserver on `disabled` re-seats the group whenever anybody disables or
     re-enables anything, which is a law the module keeps rather than a discipline it asks for
     (ANTI-PATTERN 13: fix the module).  `tabIndex` is not in the filter, so paint() cannot re-enter. */
  const paint = () => {
    let seat = null;
    for (const [id, b] of btns) { const on = id === v; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); const live = on && !b.disabled; b.tabIndex = live ? 0 : -1; if (live) seat = b; }
    if (!seat) for (const id of ids) { const b = btns.get(id); if (b && !b.disabled) { b.tabIndex = 0; break; } }   // the first LIVE option; a group with none is genuinely dead and native `disabled` says so
  };
  paint();
  try { new MutationObserver(paint).observe(row, { attributes: true, attributeFilter: ['disabled'], subtree: true }); } catch (_) {}
  return { root, get: () => v, set(x) { v = x; paint(); }, button: (id) => btns.get(id), paint };
}

/** trig({ label, onFire, glyph, cls }) — a momentary event */
export function trig(o) {
  const b = el('button', 'trig' + (o.cls ? ' ' + o.cls : ''));
  b.type = 'button';
  if (o.glyph) el('span', 'trig-g', b, o.glyph);
  el('span', 'trig-l', b, o.label);
  if (o.title) b.title = mathPlain(o.title);
  b.addEventListener('click', (e) => { if (o.onFire) o.onFire(e); });
  /* wave 62: a `trig` used as a STATE says so.  A trig that never sets `on` never gets the attribute,
     so this is correct for every caller and costs one expression. */
  return { root: b, setLabel(t) { mathText(b.querySelector('.trig-l'), t); }, setGlyph(g) { const s = b.querySelector('.trig-g'); if (s) s.textContent = g; }, set on(v) { b.classList.toggle('on', !!v); b.setAttribute('aria-pressed', String(!!v)); } };
}

/** fader({ label, aria, min, max, value, fmt, onInput, onChange, showValue }) — a horizontal scalar */
export function fader(o) {
  const root = el('div', 'fd' + (o.cls ? ' ' + o.cls : ''));
  const fill = el('div', 'fd-fill', root);
  const edge = el('div', 'fd-edge', root);
  const lbl = el('div', 'fd-lbl', root, o.label || '');
  const val = el('div', 'fd-val', root);
  let v = o.value, def = o.value, dragging = false, lastX = 0;
  const lo = o.min, hi = o.max;
  const fmt = o.fmt || ((x) => x.toFixed(3));
  /* WAVE 62 · the same slider as knob(), and all seven are linear: no log, no wrap, no step.  The
     chatter guard is what keeps a FOCUSED scrub silent while the transport writes it every frame. */
  root.tabIndex = 0;
  root.setAttribute('role', 'slider');
  const ariaName = o.aria || o.label;
  if (ariaName) root.setAttribute('aria-label', mathPlain(ariaName));
  root.setAttribute('aria-valuemin', String(lo));
  root.setAttribute('aria-valuemax', String(hi));
  let saidNow = null, saidText = null;
  function announce(fromUser) {
    if (!fromUser && root === document.activeElement) return;
    const now = String(v), text = val.textContent;
    if (saidNow !== now) { saidNow = now; root.setAttribute('aria-valuenow', now); }
    if (saidText !== text) { saidText = text; root.setAttribute('aria-valuetext', text); }
  }
  const paint = (fromUser) => { const p = clamp01((v - lo) / (hi - lo)); root.style.setProperty('--fill', p); val.textContent = fmt(v); announce(fromUser); };
  const fromEvent = (e) => { const r = root.getBoundingClientRect(); return lo + clamp01((e.clientX - r.left) / Math.max(1, r.width)) * (hi - lo); };
  root.addEventListener('pointerdown', (e) => { e.preventDefault(); try { root.setPointerCapture(e.pointerId); } catch (_) {} dragging = true; root.classList.add('drag'); tap(); lastX = e.clientX; if (!e.shiftKey) v = fromEvent(e); paint(); if (o.onInput) o.onInput(v); });
  root.addEventListener('pointermove', (e) => { if (!dragging) return; if (e.shiftKey) { const r = root.getBoundingClientRect(); v = lo + clamp01((v - lo) / (hi - lo) + (e.clientX - lastX) / Math.max(1, r.width) * 0.2) * (hi - lo); } else v = fromEvent(e); lastX = e.clientX; paint(); if (o.onInput) o.onInput(v); });   // shift = fine: a fifth of the travel
  const end = () => { if (!dragging) return; dragging = false; root.classList.remove('drag'); if (o.onChange) o.onChange(v); };
  root.addEventListener('pointerup', end); root.addEventListener('pointercancel', end);
  const reset = () => { v = def; paint(); if (o.onInput) o.onInput(v); if (o.onChange) o.onChange(v); };
  const tap = tapWatcher(reset);
  root.addEventListener('dblclick', (e) => { e.preventDefault(); reset(); });
  root.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });
  const FDIR = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 1, PageDown: -1 };
  root.addEventListener('keydown', (e) => {
    if (root.tabIndex < 0 || e.ctrlKey || e.metaKey || e.altKey) return;   // a fader taken out of the tab order (the scrub, with KEEP FRAMES off) takes no keys either
    const dir = FDIR[e.code] || 0, page = e.code === 'PageUp' || e.code === 'PageDown';
    let nv = v;
    if (dir) nv = lo + clamp01((v - lo) / (hi - lo) + dir * 0.01 * (page ? 10 : 1) * (e.shiftKey ? 0.25 : 1)) * (hi - lo);
    else if (e.code === 'Home') nv = lo;
    else if (e.code === 'End') nv = hi;
    else if (e.code === 'Delete' || e.code === 'Backspace') { e.preventDefault(); reset(); announce(true); return; }
    else return;
    e.preventDefault();
    if (nv !== v) { v = nv; paint(true); if (o.onInput) o.onInput(v); if (o.onChange) o.onChange(v); }
  });
  root.addEventListener('blur', () => announce(false));
  paint();
  return { root, get: () => v, set(x) { v = x; paint(); }, setLabel(t) { lbl.textContent = t; }, dragging: () => dragging };
}

/** readout({ label, value, cls }) — a labelled number */
export function readout(o) {
  const root = el('div', 'ro' + (o.cls ? ' ' + o.cls : ''));
  el('div', 'ro-lbl', root, o.label);
  const val = el('div', 'ro-val', root, o.value === undefined ? '—' : String(o.value));
  el('div', 'ro-sub', root, o.sub || '');
  /* WAVE 69 · both writers take the `<m>` marker, so a readout can print `⟨p⟩ gained` or
     `T = 2π/gcd{|ΔE|}` in the math face while its DIGITS stay in the UI column.  The dirty-check is
     on the SOURCE string, not on textContent, because a marked string and its rendered text are no
     longer the same thing and comparing them would rewrite the node on every frame. */
  let wasV = String(o.value === undefined ? '—' : o.value), wasS = o.sub === undefined ? null : String(o.sub);
  return { root, set(t, cls) { if (wasV !== t) { wasV = t; mathText(val, t); } if (cls !== undefined) val.className = 'ro-val ' + cls; }, setSub(t) { let s = root.querySelector('.ro-sub'); if (!s) { s = el('div', 'ro-sub', root); wasS = null; } const next = t === undefined || t === null ? '' : String(t).trim(); if (wasS !== next) { wasS = next; mathText(s, next); } } };
}


export function formula(o) {
  const root = el('div', 'fx' + (o.cls ? ' ' + o.cls : ''));
  const slots = new Map();
  for (const line of o.lines) {
    const row = el('div', 'fx-l', root);
    for (const part of line) {
      /* A STRING PART TAKES THE SAME `<m>` MARKER AS EVERY OTHER STRING IN THE LAB, and that is not
         tidiness: `tests/pwa.test.mjs §G` reads the subset's cmap and scans the tree for marked runs,
         so a formula whose mathematics were implicit would be the one place the coverage gate could
         not see.  One convention, one scan, no exceptions. */
      if (typeof part === 'string') { mathText(el('span', null, row), part); continue; }
      const v = el('i', 'fx-v', row, part.v === undefined ? '—' : String(part.v));
      v.dataset.s = part.s;
      slots.set(part.s, { el: v, was: v.textContent });
    }
  }
  return {
    root,
    /** write only the slots whose value MOVED — the dirty-check is the closure, never the DOM */
    set(vals) { for (const k in vals) { const sl = slots.get(k); if (!sl) continue; const t = String(vals[k]); if (sl.was !== t) { sl.was = t; sl.el.textContent = t; } } },
    get names() { return [...slots.keys()]; }
  };
}

/** device({ id, eyebrow, title, status }) — a rack window: identity | live status | utilities */
export function device(o) {
  const root = el('section', 'dev'); root.dataset.id = o.id;
  const head = el('header', 'dev-head', root);
  /* THE STATUS IS NOT ALWAYS VISIBLE (wave 44).  The header is one grid row — eyebrow, status, buttons — and on a
     274 px card a long eyebrow beside six utility buttons leaves the status NO width at all: ELECTROSTATICS'
     'hydrogen only: no closed-form field for the scaled radials' measured 0 px wide, so the reason the overlay had
     stood down was on the card and unreadable.  The header's hover hint carries it now, whatever the width. */
  const headHint = (st) => { const name = mathPlain(o.eyebrow || o.id || 'window'); head.title = st ? name + ': ' + mathPlain(st) : name; };
  headHint(o.status || '');
  const idz = el('div', 'dev-id', head);
  el('div', 'dev-eyebrow', idz, o.eyebrow || '');
  /* WAVE 62 · TWENTY-FIVE NAMED REGIONS, for three lines.  A <section> is only a landmark once it has
     an accessible name, and the name it should carry is the <h2> already sitting in its header — so a
     screen-reader user navigates this rack BY REGION rather than by four hundred Tab presses.  This is
     the real answer to "hundreds of tab stops" for the population that has region navigation; the two
     skip links in index.html are the answer for the population that does not. */
  const h2 = el('h2', 'dev-title', idz, o.eyebrow || o.id || 'window');
  h2.id = 'devt-' + o.id;
  root.setAttribute('aria-labelledby', h2.id);
  const stat = el('div', 'dev-stat', head, o.status || '');
  const util = el('div', 'dev-util', head);
  const power = el('button', 'dev-power', util, ''); power.type = 'button'; power.title = 'Turn this window on or off'; power.setAttribute('aria-pressed', 'true');
  power.setAttribute('aria-label', 'power');                 // it has no content, so that 90-character `title` WAS its accessible name
  const fold = el('button', 'dev-fold', util); fold.type = 'button'; fold.title = 'Collapse or expand this window';
  chip(fold, 'chevronDown', 'fold or unfold this window');   // ONE drawing: `.folded` turns it a quarter turn, which is the caret's own idiom (glyph.js, chevronDown)
  /* ── WAVE 55 · THE POP-OUT, and the rail beside it ──────────────────────────────────────────────
   * Every window gains the control the transport has always had.  device() builds the two chips and
   * NOTHING ELSE: the act itself is the rack's (lab/rack.js `layout.float`), because taking a card off
   * the rack needs the racks, the stage and the phone breakpoint, none of which the kit knows about.
   * The rail chip is in the DOM for every window and shown by CSS only while the window floats, so the
   * header's box never changes shape when a window comes off the rack. */
  const pop = el('button', 'dev-pop', util); pop.type = 'button';
  chip(pop, 'north', 'take this window off the rack');
  pop.title = 'Move this window between the rack and stage';
  const rail = el('button', 'dev-rail', util); rail.type = 'button';
  chip(rail, 'compact', 'narrow this window to its rail');
  rail.title = 'Use the compact window layout';
  const close = el('button', 'dev-close', util); close.type = 'button'; close.title = 'Close this window';
  chip(close, 'close', 'close this window');
  let off = false;
  /* WAVE 62 · THE ONE `inert` IN THE LAB.  Every other hidden state is already out of the tab order and
     out of the accessibility tree — `.dev.closed` and `.folded .dev-body` and a railed body are
     `display: none`, a hidden rack is `visibility: hidden`, `body.ui-hidden` is `display: none`.  Only
     a POWERED-OFF body is `opacity: .38; pointer-events: none`: visible to Tab, dead to the hand.
     The focus rescue is not garnish — the spec sends focus to <body> when its ancestor becomes inert,
     so a user who powers a window off from inside it would be silently teleported to the top of the
     document.  `pointer-events: none` stays: the CSS also dims, and splitting the visual from the
     behaviour across two files is how they come apart. */
  const setOff = (v) => {
    off = !!v;
    if (off && body.contains(document.activeElement)) power.focus();
    root.classList.toggle('off', off);
    body.inert = off || loadingKeys.size > 0;
    power.setAttribute('aria-pressed', String(!off));
    if (o.onPower) o.onPower(!off);
  };
  power.addEventListener('click', (e) => { e.stopPropagation(); setOff(!off); });
  close.addEventListener('click', (e) => { e.stopPropagation(); root.classList.add('closed'); root.dispatchEvent(new CustomEvent('devclose', { bubbles: true })); });
  const body = el('div', 'dev-body', root);
  body.id = 'devb-' + o.id;
  /* Heavy card maths is demand-loaded. Desktop already has the cursor-following busy mark; coarse pointers need
     the same mark where the waiting card is, because there may be no cursor position at all. A keyed set lets
     independent blocks in one card finish in either order without unlocking each other. */
  const loadingKeys = new Set();
  const loading = el('div', 'dev-loading', root); loading.hidden = true; loading.setAttribute('aria-hidden', 'true');
  const loadingMark = document.querySelector('#title .mark'); if (loadingMark) loading.appendChild(loadingMark.cloneNode(true));
  el('span', 'dev-loading-label', loading, 'CALCULATING');
  const setLoading = (v, key = 'work') => {
    if (v) loadingKeys.add(key); else loadingKeys.delete(key);
    const on = loadingKeys.size > 0;
    root.classList.toggle('loading', on); root.toggleAttribute('aria-busy', on); root.inert = on;
    body.inert = off || on; loading.hidden = !on;
    return on;
  };
  fold.setAttribute('aria-controls', body.id); fold.setAttribute('aria-expanded', 'true');
  let folded = false;
  const setFold = (on) => { folded = on; root.classList.toggle('folded', on); fold.setAttribute('aria-expanded', String(!on)); };   // the glyph is ONE drawing now; `.dev.folded .dev-fold svg` turns it (lab.css §55)
  fold.addEventListener('click', () => setFold(!folded));
  /* the guard is `closest`, not `===`: the target of a click on a chip is the SVG inside the button, never the button */
  head.addEventListener('dblclick', (e) => { if (e.target.closest && e.target.closest('button')) return; setFold(!folded); });
  return { root, body, setOff, setLoading, popBtn: pop, railBtn: rail, foldBtn: fold, get off() { return off; }, get loading() { return loadingKeys.size > 0; }, setStatus(t, cls) { if (stat.textContent !== t) { stat.textContent = t; headHint(t); } if (cls !== undefined) stat.className = 'dev-stat ' + cls; }, fold: setFold, row(cls) { return el('div', 'row' + (cls ? ' ' + cls : ''), body); } };
}

/** a labelled group inside a device body */
export function group(parent, label) {
  const g = el('div', 'grp', parent);
  if (label) el('div', 'grp-lbl', g, label);
  return g;
}
export const N_COLOR = ['', 'var(--n1)', 'var(--n2)', 'var(--n3)', 'var(--n4)', 'var(--n5)', 'var(--n6)'];
export const N_RGB = ['', [255, 226, 170], [120, 225, 240], [230, 160, 240], [255, 150, 90], [140, 220, 140], [180, 160, 255]];


/* ── the light-theme shell ink ──────────────────────────────────────────────────────────────────
 * --n1…--n6 (lab.css:29) were chosen on the dark ground.  Measured against the light card they run
 * 1.25 : 1 … 2.19 : 1 — far under the 3 : 1 a 2 px line needs.  The light set keeps every hue, pushes the
 * chroma up (+12 saturation) and walks the lightness DOWN until the WCAG contrast ratio is ≥ 3 against
 * BOTH grounds the app actually renders — the light card, MEASURED in the page at (236,239,243), and the well
 * every plot sits in, (220,225,232), which is the binding one.  Computed, not eyeballed; the six ratios are in
 * skin.css beside the tokens and in REPORT.md wave 46.  The dark set is untouched.
 */
export const N_RGB_LIGHT = ['', [173, 116, 0], [7, 139, 159], [223, 22, 223], [217, 87, 0], [29, 147, 29], [142, 98, 247]];
export const lightTheme = () => document.body.dataset.theme === 'light';
/** the shell colour of level n as it must be drawn on THIS theme's ground */
export const nRGB = (n) => ((lightTheme() ? N_RGB_LIGHT : N_RGB)[n] || [255, 255, 255]);

const LIN = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const LUM = (c) => 0.2126 * LIN(c[0]) + 0.7152 * LIN(c[1]) + 0.0722 * LIN(c[2]);
const RATIO = (a, b) => { const x = LUM(a), y = LUM(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const CARD_LIGHT = [236, 239, 243], WELL_LIGHT = [220, 225, 232];   // measured in the page, not derived from the tokens
function hsl2rgb(h, s, l) { const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]; }
function rgb2hsl(r, g, b) { r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
  if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  return [h, s, l]; }
const inkCache = new Map();
/** vividInk(rgb) — the same walk for any other graph colour: identity on the dark theme, and on the
 *  light one the same hue at higher chroma and lower lightness until it clears 3 : 1 on the well. */
export function vividInk(rgb) {
  if (!lightTheme() || !rgb) return rgb;
  const key = rgb[0] + ',' + rgb[1] + ',' + rgb[2];
  const got = inkCache.get(key); if (got) return got;
  const [h, s0, l0] = rgb2hsl(rgb[0], rgb[1], rgb[2]);
  const s = Math.min(1, s0 + 0.12);
  let out = rgb;
  for (let l = l0; l >= 0.06; l -= 0.005) { const c = hsl2rgb(h, s, l);
    if (RATIO(c, CARD_LIGHT) >= 3 && RATIO(c, WELL_LIGHT) >= 3) { out = c; break; } }
  inkCache.set(key, out); return out;
}
/** the contrast ratio of a drawn colour against this theme's card — the proof B61 recomputes */
export const inkRatio = (rgb, ground) => RATIO(rgb, ground || (lightTheme() ? CARD_LIGHT : [56, 60, 65]));

/* ── the theme flip ─────────────────────────────────────────────────────────────────────────────
 * A CARD CANVAS IS PAINTED WHEN ITS DATA MOVES, NOT EVERY FRAME (wave 46).  MOLECULE, H₂, QCD and the
 * SPECTRUM eigen ladder are painted once at boot and then only when R, the potential or the register
 * changes — so a theme flip left every one of them holding the OTHER theme's ink until something else
 * happened to move.  One observer on the body's data-theme, and every registered view repaints. */
const themeFns = new Set();
let themeObs = null;
export function onThemeChange(fn) {
  themeFns.add(fn);
  if (!themeObs) {
    let last = document.body.dataset.theme || '';
    themeObs = new MutationObserver(() => {
      const now = document.body.dataset.theme || '';
      if (now === last) return;
      last = now; inkCache.clear();
      for (const f of themeFns) { try { f(); } catch (e) { /* one view must never stop the rest */ } }
    });
    themeObs.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
  }
  return () => themeFns.delete(fn);
}

/* ── the one tip ────────────────────────────────────────────────────────────────────────────── */
let tipEl = null, tipOwner = null;
function tipNode() {
  if (!tipEl || !tipEl.isConnected) { tipEl = el('div', '', document.body); tipEl.id = 'graphTip'; tipEl.hidden = true; }
  return tipEl;
}
/** the tip has ONE owner at a time, so a view that never sees a pointerleave cannot hide another view's tip.
 *  KEPLER's overlay canvas is pointer-events: none — the rack already routes the field's pointer through
 *  kepler.hit()/setHover(), so that view drives the same tip by hand through these two. */
export function showGraphTip(owner, txt, cx, cy) { tipOwner = owner; placeTip(txt, cx, cy); }
export function hideGraphTip(owner) {
  if (owner !== undefined && tipOwner !== null && tipOwner !== owner) return;
  tipOwner = null;
  if (!tipEl || tipEl.hidden) return;              // a live canvas calls this every frame: never write the DOM twice
  tipEl.hidden = true; tipEl.textContent = '';
}
/** the tip never leaves the viewport: it is fixed on the body, so no card can clip it */
function placeTip(txt, cx, cy) {
  const t = tipNode();
  if (t.textContent !== txt) t.textContent = txt;
  t.hidden = false;
  const r = t.getBoundingClientRect(), W = window.innerWidth, H = window.innerHeight;
  let x = cx + 13, y = cy + 15;
  if (x + r.width > W - 6) x = cx - 13 - r.width;
  if (x < 6) x = 6;
  if (y + r.height > H - 6) y = cy - 15 - r.height;
  if (y < 6) y = 6;
  t.style.left = x.toFixed(1) + 'px'; t.style.top = y.toFixed(1) + 'px';
}

/* ── geometry: the nearest object within 8 px ───────────────────────────────────────────────── */
const HIT_PX = 8;
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
  let t = L2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / L2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
/** points may be [[x, y], …] or a flat [x, y, x, y, …] */
function polyDist(pts, px, py) {
  if (!pts || pts.length === 0) return Infinity;
  const flat = typeof pts[0] === 'number';
  const n = flat ? pts.length >> 1 : pts.length;
  if (n === 1) return flat ? Math.hypot(px - pts[0], py - pts[1]) : Math.hypot(px - pts[0][0], py - pts[0][1]);
  let best = Infinity;
  for (let i = 1; i < n; i++) {
    const ax = flat ? pts[2 * i - 2] : pts[i - 1][0], ay = flat ? pts[2 * i - 1] : pts[i - 1][1];
    const bx = flat ? pts[2 * i] : pts[i][0], by = flat ? pts[2 * i + 1] : pts[i][1];
    const d = segDist(px, py, ax, ay, bx, by); if (d < best) best = d;
  }
  return best;
}
function objDist(o, px, py) {   /* an object marked `quiet` answers but is never outlined (a raster) */
  if (o.kind === 'line' || o.kind === 'curve') return polyDist(o.points, px, py);
  if (o.kind === 'bar' && o.w !== undefined && o.h !== undefined) {
    const x0 = Math.min(o.x, o.x + o.w), x1 = Math.max(o.x, o.x + o.w);
    const y0 = Math.min(o.y, o.y + o.h), y1 = Math.max(o.y, o.y + o.h);
    return Math.hypot(Math.max(x0 - px, 0, px - x1), Math.max(y0 - py, 0, py - y1));
  }
  return Math.max(0, Math.hypot(px - o.x, py - o.y) - (o.r || 0));   // to the centre, discounted by the drawn radius
}
/** the default highlight: the object again, 2 px brighter, with a soft halo of its own colour */
function defaultDraw(g, o) {
  const col = o.colour || 'rgba(255,255,255,1)';
  g.save();
  g.lineCap = 'round'; g.lineJoin = 'round'; g.setLineDash([]);
  if (o.kind === 'line' || o.kind === 'curve') {
    const pts = o.points, flat = typeof pts[0] === 'number', n = flat ? pts.length >> 1 : pts.length;
    const path = () => { g.beginPath();
      for (let i = 0; i < n; i++) { const x = flat ? pts[2 * i] : pts[i][0], y = flat ? pts[2 * i + 1] : pts[i][1]; i ? g.lineTo(x, y) : g.moveTo(x, y); }
      if (n === 1) { const x = flat ? pts[0] : pts[0][0], y = flat ? pts[1] : pts[0][1]; g.arc(x, y, 3, 0, 6.2832); } };
    g.globalAlpha = 0.22; g.strokeStyle = col; g.lineWidth = (o.lw || 2) + 6; path(); g.stroke();
    g.globalAlpha = 1; g.lineWidth = (o.lw || 2) + 2; path(); g.stroke();
  } else if (o.kind === 'bar' && o.w !== undefined) {
    g.globalAlpha = 0.22; g.strokeStyle = col; g.lineWidth = 6; g.strokeRect(o.x, o.y, o.w, o.h);
    g.globalAlpha = 1; g.lineWidth = 2; g.strokeRect(o.x, o.y, o.w, o.h);
  } else {
    const r = (o.r || 3) + 3;
    g.globalAlpha = 0.22; g.strokeStyle = col; g.lineWidth = 6; g.beginPath(); g.arc(o.x, o.y, r, 0, 6.2832); g.stroke();
    g.globalAlpha = 1; g.lineWidth = 2; g.beginPath(); g.arc(o.x, o.y, r, 0, 6.2832); g.stroke();
  }
  g.restore();
}

/**
 * graphHover(canvas, { objects, plot, repaint, draw, dpr })
 *   objects : () => [{ kind: 'line'|'curve'|'dot'|'bar', points | x, y, r, w, h, colour, lw, info }]
 *   plot    : the plot rectangle {x0, y0, x1, y1} in CSS px (or a function returning it) — parked on
 *             canvas.__lwPlot so the proof can ask where the plot is
 *   repaint : () => void — the view's own draw; the hover calls it when the hit changes
 *   draw    : (ctx, hit) => void — an optional highlight of the view's own (else the default one)
 * Returns { set(objects, plot), hit(), clear() }.  A view calls set() at the end of every redraw,
 * with the canvas transform still the plot's, and the highlight lands on top of what it just drew.
 */
export function graphHover(canvas, o = {}) {
  let objs = [], rect = null, hit = null, px = -1e9, py = -1e9, inside = false, pinned = false, painting = false;
  if (o.repaint) {
    onThemeChange(() => { try { o.repaint(); } catch (e) {} });            // the flip repaints the view in the new ink …
    /* … and a view that had NO SIZE when the flip happened could not repaint at all: a folded or stood-down card
       measures 0 and every paint() here returns early, so MOLECULE kept the dark theme's cyan on the light card
       until its R moved.  The canvas says when it is laid out again, and that is when the ink is put right. */
    if (typeof ResizeObserver === 'function') {
      let lw = -1, lh = -1;
      try { new ResizeObserver(() => { const w = canvas.clientWidth, h = canvas.clientHeight;
        if (w === lw && h === lh) return; lw = w; lh = h;
        if (w > 8 && h > 8) { try { o.repaint(); } catch (e) {} } }).observe(canvas); } catch (e) {}
    }
  }
  const ctx = () => canvas.getContext('2d');
  const pull = () => (typeof o.objects === 'function' ? (o.objects() || []) : objs);
  const pullPlot = () => (typeof o.plot === 'function' ? o.plot() : (o.plot || rect));
  const idOf = (h) => (h ? (h.key !== undefined ? String(h.key) : String(h.info)) : '');   // identity, so a hover that does not change does not repaint
  function find() {
    if (!inside && !pinned) return null;
    let best = null, bd = HIT_PX;
    for (const ob of objs) { if (!ob || ob.info === undefined) continue; const d = objDist(ob, px, py); if (d <= bd) { bd = d; best = ob; } }
    return best;
  }
  function show() {
    if (!hit) { if (tipOwner === canvas || tipOwner === null) hideGraphTip(canvas); return; }
    const r = canvas.getBoundingClientRect();
    /* info may be a FUNCTION of the pointer: a raster (WIGNER, the SLICE) answers with the value under it */
    const txt = typeof hit.info === 'function' ? hit.info(px, py) : String(hit.info);
    if (!txt) { hideGraphTip(canvas); return; }
    showGraphTip(canvas, txt, r.left + px, r.top + py);
  }
  function repaint() { if (painting) return; if (o.repaint) o.repaint(); }
  function set(objects, plot) {
    objs = objects || pull() || [];
    rect = plot || pullPlot() || rect;
    if (rect) canvas.__lwPlot = rect;
    canvas.__lwObjects = objs;
    const was = idOf(hit);
    hit = find();
    if (hit && !hit.quiet) { painting = true; try { (o.draw || defaultDraw)(ctx(), hit); } finally { painting = false; } }
    void was; show();
  }
  function move(e) {
    const r = canvas.getBoundingClientRect();
    px = e.clientX - r.left; py = e.clientY - r.top; inside = true;
    const was = idOf(hit), now = idOf(find());
    if (now === was) { if (hit) show(); return; }   // the same object: only the tip moves (and a live one re-reads)
    if (o.repaint) { repaint(); return; }
    hit = find();                                      // no repaint hook: the highlight lands on what is already there
    if (hit && !hit.quiet) { painting = true; try { (o.draw || defaultDraw)(ctx(), hit); } finally { painting = false; } }
    show();
  }
  function leave() { inside = false; pinned = false; if (hit) { hit = null; hideGraphTip(canvas); repaint(); } else hideGraphTip(canvas); }
  canvas.addEventListener('pointermove', (e) => { if (e.pointerType === 'touch') return; move(e); });
  /* A TOUCH POINTER NEVER "LEAVES" (wave 51, found by driving this with a REAL WebDriver finger for the first
     time).  Firefox — like every engine — destroys a touch pointer the instant it lifts and fires pointerout +
     pointerleave for it, so the pin that pointerdown had just set was torn down again about 1 ms later and the
     tip never appeared on any real touch screen.  Wave 48 built the pin and wave 51's gate is the first thing
     to press it with a finger instead of through __lwHover.  For touch, leaving is a second TAP (below), never
     a leave event; pointercancel still clears, because a cancelled gesture really is gone. */
  canvas.addEventListener('pointerleave', (e) => { if (e && e.pointerType === 'touch') return; leave(); });
  canvas.addEventListener('pointercancel', leave);
  canvas.addEventListener('pointerdown', (e) => {                      // touch (the iPad): a tap toggles the tip
    if (e.pointerType !== 'touch') return;
    const r = canvas.getBoundingClientRect();
    px = e.clientX - r.left; py = e.clientY - r.top;
    const was = idOf(hit); pinned = true; inside = true;
    const now = idOf(find());
    if (now && now === was) { pinned = false; inside = false; hit = null; hideGraphTip(canvas); repaint(); }
    else repaint();
  });
  canvas.__lwHover = { get hit() { return hit; }, move, leave };      // the proof drives it without a real pointer
  return { set, hit: () => hit, clear: leave, get plot() { return rect; } };
}

/** fitText(g, txt, x, y, rect, align, clip) — every glyph left in a canvas is MEASURED before it is drawn.
 *  One that fits is nudged until it is wholly inside rect; one that cannot fit is dropped — unless `clip`,
 *  when it is cut to the width there is with an ellipsis (a caption is better short than gone).
 *  Returns the x actually used, or null if it was dropped. */
export function fitText(g, txt, x, y, rect, align = 'left', clip = false) {
  if (!rect) { g.textAlign = align; g.fillText(txt, x, y); return x; }
  const room = rect.x1 - rect.x0;
  let w = g.measureText(txt).width;
  if (y < rect.y0 - 1 || y > rect.y1 + 1) return null;
  if (w > room) {
    if (!clip || room < 12) return null;
    let s = txt;
    while (s.length > 1 && g.measureText(s + '…').width > room) s = s.slice(0, -1);
    txt = s + '…'; w = g.measureText(txt).width;
  }
  let L = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
  if (L < rect.x0) L = rect.x0;
  if (L + w > rect.x1) L = rect.x1 - w;
  g.textAlign = 'left'; g.fillText(txt, L, y);
  return L;
}

/* ── the theme's own ink on a canvas ────────────────────────────────────────────────────────────
 * A CANVAS HAS NO THEME.  Rules written rgba(255,255,255,…) are right on the dark ground and white
 * on white on the light one.  Let the context itself parse the token (it is a CSS colour parser),
 * exactly as spectrum.js has done since wave 44 — --dim is rated ≥ 4.5 : 1 on the card in both themes. */
/* ── WAVE 57 · THE FOURTH COLOUR FORM, AND WHY ITS ABSENCE WAS NOT A LATENT BUG BUT A LIVE ONE ────
 * Five modules carried a copy of this reader and all five matched exactly three forms — #rrggbb, #rgb
 * and rgb()/rgba().  There is a fourth, and the app WRITES it: under DISPLAY-P3 `applyAccent()` sets
 * `--acc` to `color(display-p3 …)` (rack.js's gamutCss), a 2-D context serialises it BACK in that form,
 * none of the three regexes matched, and the reader fell to its last resort — which in four of the five
 * copies was a hard-coded `[120, 225, 240]`, the wave-23 house cyan.  So on a P3 display six canvas
 * views would have drawn LAST YEAR'S ACCENT while the DOM around them wore the chosen palette, by
 * design, silently.  One reader now, in one file, and it knows the form.
 * P3 → sRGB is the inverse of field.js's M_SRGB_P3 in LINEAR light (both share the sRGB transfer
 * curve); the rows sum to 1, so D65 white stays white, and out-of-sRGB colours clamp per channel — the
 * same thing the browser does when it paints one on an sRGB canvas. */
const M_P3_SRGB = [[1.224940, -0.224940, 0], [-0.042057, 1.042057, 0], [-0.019638, -0.078635, 1.098274]];
const C_LIN = (u) => (u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4));
const C_ENC = (u) => (u <= 0.0031308 ? 12.92 * u : 1.055 * Math.pow(u, 1 / 2.4) - 0.055);
const c255 = (u) => Math.max(0, Math.min(255, Math.round(u * 255)));
/** parseCssColor(str) → [r, g, b] 0…255, or null — the four forms a canvas can hand back */
export function parseCssColor(t) {
  if (!t) return null;
  const s = String(t).trim();
  let m = /^#([0-9a-f]{6})$/i.exec(s);
  if (m) { const k = parseInt(m[1], 16); return [k >> 16 & 255, k >> 8 & 255, k & 255]; }
  m = /^#([0-9a-f]{8})$/i.exec(s);
  if (m) { const k = parseInt(m[1].slice(0, 6), 16); return [k >> 16 & 255, k >> 8 & 255, k & 255]; }
  m = /^#([0-9a-f]{3,4})$/i.exec(s);
  if (m) return [0, 1, 2].map((i) => parseInt(m[1][i] + m[1][i], 16));
  m = /^rgba?\(([^)]+)\)$/i.exec(s);
  if (m) { const tok = m[1].split(/[,\s/]+/).filter((x) => x !== '');
    if (tok.length < 3) return null;
    return [0, 1, 2].map((i) => (/%$/.test(tok[i]) ? c255(parseFloat(tok[i]) / 100) : Math.max(0, Math.min(255, Math.round(parseFloat(tok[i])))))); }
  m = /^color\(\s*([a-z0-9-]+)\s+([^)]+)\)$/i.exec(s);
  if (m) {
    const space = m[1].toLowerCase();
    const p = m[2].split('/')[0].trim().split(/[\s,]+/).filter((x) => x !== '')
      .map((x) => (/%$/.test(x) ? parseFloat(x) / 100 : parseFloat(x)));
    if (p.length < 3 || p.some((x) => !isFinite(x))) return null;
    if (space === 'srgb') return [c255(p[0]), c255(p[1]), c255(p[2])];
    if (space === 'srgb-linear') return [c255(C_ENC(p[0])), c255(C_ENC(p[1])), c255(C_ENC(p[2]))];
    if (space === 'display-p3') { const l = [C_LIN(p[0]), C_LIN(p[1]), C_LIN(p[2])];
      return M_P3_SRGB.map((r) => c255(C_ENC(Math.max(0, Math.min(1, r[0] * l[0] + r[1] * l[1] + r[2] * l[2]))))); }
    return null;                                     // a space we do not write: say so rather than guess
  }
  return null;
}
/* ── the theme's own ink on a canvas ────────────────────────────────────────────────────────────
 * A CANVAS HAS NO THEME.  Rules written rgba(255,255,255,…) are right on the dark ground and white
 * on white on the light one.  Let the context itself parse the token (it is a CSS colour parser),
 * exactly as spectrum.js has done since wave 44 — --dim is rated ≥ 4.5 : 1 on the card in both themes. */
export function cssRGB(g, name, fallback) {
  const v = getComputedStyle(document.body).getPropertyValue(name).trim();
  const keep = g.fillStyle;
  g.fillStyle = fallback; if (v) { try { g.fillStyle = v; } catch (e) { /* unparseable: the fallback stands */ } }
  const t = String(g.fillStyle); g.fillStyle = keep;
  return parseCssColor(t) || parseCssColor(fallback) || [255, 255, 255];
}
/** themeInk(g) → { ink(a), fg(a), INK, FG } — the muted ink and the foreground of THIS theme */
export function themeInk(g) {
  const I = cssRGB(g, '--dim', '#b8b8b8'), F = cssRGB(g, '--fg', '#ffffff');
  return { INK: I, FG: F,
    ink: (a = 1) => `rgba(${I[0]},${I[1]},${I[2]},${a})`,
    fg: (a = 1) => `rgba(${F[0]},${F[1]},${F[2]},${a})` };
}
/* ── WAVE 57 · THE TWO ACCENTS, PUBLISHED BY THE WHEEL RATHER THAN RE-READ OFF THE DOM ───────────
 * `applyAccent()` computes A and B as sRGB triples and only THEN stringifies them for the body.  A
 * canvas view that parses that string back is re-deriving a number the wheel already had, through a
 * gamut round-trip that can only lose; so the wheel hands them over directly and the views draw the
 * SAME ARRAY the DOM was painted from.  There is no path by which they can now disagree.
 * The CSS token is still the fallback (a view used without the rack, or before the first accent is
 * applied), and its last resort is this theme's FOREGROUND — never a stale copy of some past accent,
 * because ink that is merely the wrong grey is honest and a plausible-looking cyan is not. */
let ACC_A = null, ACC_B = null;
export function setAccentRGB(a, b) { ACC_A = a ? a.slice(0, 3) : null; ACC_B = b ? b.slice(0, 3) : null; }
/** accentRGB(g, n) — ACCENT A (n = 1, the default) or ACCENT B (n = 2) as [r, g, b] 0…255 */
export function accentRGB(g, n) {
  const held = n === 2 ? ACC_B : ACC_A;
  if (held) return held.slice();
  return cssRGB(g, n === 2 ? '--acc2' : '--acc', lightTheme() ? '#1b2027' : '#f2f5f7');
}
