/* window/rail.js — the one chip rail.
 *
 * THE LAW IT KEEPS: A CHIP SAYS ONE THING IN ONE PLACE, AND THE RAIL IS ALWAYS REACHABLE.
 * Every state a chip can be in is a row of ONE table, declared once with the chip: its class, its aria-pressed
 * (true | false | mixed), its label, its hint and its ink.  setChip(name, state) writes that row and nothing else, so
 * a cycle's order and what aria-pressed means for it cannot disagree between two windows again (survey B §1: WORK
 * BARS cycled bottom→top→hidden in one window and top→bottom→hidden in the other, and "pressed" meant different
 * states).  And the rail SEATS by one solver — the preferred side, then the other three, then the first side it can
 * fit on at all, then a clamp — which never overwrites the preference: a lack of room today is not a choice.
 *
 * The seat moves three ways, for three kinds of hand:
 *   · Shift-drag on the grip — the nearest edge of the window wins (the desktop gesture; window.js runs that drag);
 *   · a LONG PRESS on the grip — the four seats appear as drop guides (core/proximity.js) and the finger picks one;
 *   · the KEYBOARD — the grip is a button: arrows move the seat, Enter keeps it, Escape puts it back.
 * Each calls onSide(side, phase) and the window makes room with motion.
 *
 * Sizes are measured once per layout (one rect read, the other orientation is the same flex line turned), never per
 * pointer frame: the app version flipped the rail's flex direction twice per guide frame (survey B §3b).
 * Harvested from BASINS mod-window-snap.js (chipPosition, nearestChipSide), snap-window.js (seat), kwin.js (the DOM).
 */
import { glyphEl } from '../glyph.js';
import { ariaLabel, hint } from '../kit.js';
import { phrase } from '../core/i18n.js';
import { rect, setAttr, setVar, setText } from '../core/perf.js';
import { tweenRect, flip, owns } from '../core/motion.js';
import { createProximity } from '../core/proximity.js';

export const SIDES = Object.freeze(['left', 'right', 'top', 'bottom']);
/* gap: how far a FLOATING window's rail sits from its pane, per side — kwin.js's RAIL_GAP (BASINS): 8 px on the right,
   flush on the left; kwin has no top or bottom rail, and BASINS' mod-window-snap seats those flush.  A docked rail
   (seatOn in its lane) is flush: snap-window seats it there. */
export const RAIL = Object.freeze({ pad: 4, longPress: 450, slop: 6, nudge: 24, gap: Object.freeze({ left: 0, right: 8, top: 0, bottom: 0 }) });
/** gapOf(gap, side) — a gap given as one number or as a per-side table */
export const gapOf = (g, side) => (typeof g === 'number' ? g : (g && g[side]) || 0);
const vertical = (side) => side === 'left' || side === 'right';
const clamp = (n, lo, hi) => Math.max(lo, Math.min(Math.max(lo, hi), n));
const R = (b) => ({ left: b.left ?? b.x, top: b.top ?? b.y, width: b.width, height: b.height });

/* ── the pure geometry ──────────────────────────────────────────────────────────────────────────────────────── */
/** chipPosition(side, box, w, h, view, pad, gap) — the rail beside `box` on `side`, `gap` px from it, centred along it,
 *  clamped into the view */
export function chipPosition(side, box, w, h, view, pad = RAIL.pad, gap = 0) {
  const b = R(box), right = b.left + b.width, bottom = b.top + b.height;
  const x = side === 'left' ? b.left - w - gap : side === 'right' ? right + gap : b.left + (b.width - w) / 2;
  const y = side === 'top' ? b.top - h - gap : side === 'bottom' ? bottom + gap : b.top + (b.height - h) / 2;
  return { left: Math.round(clamp(x, pad, view.width - w - pad)), top: Math.round(clamp(y, pad, view.height - h - pad)),
    fits: x >= pad && x + w <= view.width - pad && y >= pad && y + h <= view.height - pad };
}

/** seatRail({ prefer, box, sizes, view, avoid?, outer?, lane? }) — THE SOLVER.  `prefer` is left|right|top|bottom|auto
 *  ('auto' = no preference: the order of SIDES).  The preferred side if it fits; else the first other side that fits;
 *  else the first side the rail can fit on at all, clamped; else the preference, clamped.  With `avoid` (a window seated
 *  on another: the other's glass) it is seatClear's law below.  Pure: the preference is an input, never written.
 *  → { side, left, top, width, height, fits } — the exact landing rect of the rail */
export function seatRail({ prefer = 'left', box, sizes, view, pad = RAIL.pad, gap = 0, avoid = null, outer = null, lane = null }) {
  if (avoid) return seatClear({ prefer, box, sizes, view, pad, gap, avoid, outer, lane });
  const order = SIDES.includes(prefer) ? [prefer, ...SIDES.filter((s) => s !== prefer)] : SIDES;
  let reachable = null;
  for (const side of order) {
    const s = seatOn(side, box, sizes, view, pad, gapOf(gap, side));
    if (s.fits) return s;
    if (!reachable && s.width <= view.width - 2 * pad && s.height <= view.height - 2 * pad) reachable = side;
  }
  return seatOn(reachable || order[0], box, sizes, view, pad, gapOf(gap, reachable || order[0]));
}
/** coverOf(seat, r) — the area of the seat's rect that lies on r (0 when they do not meet) */
export const coverOf = (s, r) => Math.max(0, Math.min(s.left + s.width, r.right ?? r.left + r.width) - Math.max(s.left, r.left)) *
  Math.max(0, Math.min(s.top + s.height, r.bottom ?? r.top + r.height) - Math.max(s.top, r.top));
/** seatClear — THE SEAT UNDER ANOTHER WINDOW (BASINS snap-window.js seat(), a window docked on an anchor): `avoid` is the
 *  glass of the window it is seated on (the modulation window's content), `outer` the edge facing away from it, `lane`
 *  the racks' span.  A side the hand chose (prefer a real side: a Shift-drag, a long press, the keys) wins; with no choice
 *  ('auto') the sides go left, right, the outer edge, then the rest, and one seats the rail only in a CLEAR lane — inside
 *  the racks and off that glass.  With no clear lane the fitting seat that covers least of it wins, else the first side
 *  the rail can fit on at all. */
function seatClear({ prefer, box, sizes, view, pad, gap, avoid, outer, lane }) {
  const own = SIDES.includes(prefer) ? prefer : null;
  const order = [...new Set([own, 'left', 'right', outer, ...SIDES].filter((s) => SIDES.includes(s)))];
  const clear = (s) => s.side === own || ((!lane || (s.left >= lane.left && s.left + s.width <= lane.right)) && !coverOf(s, avoid));
  let reachable = null, least = null;
  for (const side of order) {
    const s = seatOn(side, box, sizes, view, pad, gapOf(gap, side));
    if (!reachable && s.width <= view.width - 2 * pad && s.height <= view.height - 2 * pad) reachable = side;
    if (s.fits && (!least || coverOf(s, avoid) < least.area)) least = { side, area: coverOf(s, avoid) };
    if (s.fits && clear(s)) return s;
  }
  const side = least ? least.side : reachable || own || order[0];
  return seatOn(side, box, sizes, view, pad, gapOf(gap, side));
}
/** seatOn(side, box, sizes, view) — the rail on that side and no other, clamped: a docked window's lane, which the
 *  dock geometry has already made room for */
export function seatOn(side, box, sizes, view, pad = RAIL.pad, gap = 0) {
  const { w, h } = sizes[vertical(side) ? 'vertical' : 'horizontal'], pos = chipPosition(side, box, w, h, view, pad, gapOf(gap, side));
  return { side, left: pos.left, top: pos.top, width: w, height: h, fits: pos.fits };
}

/** nearestSide(x, y, box) — the edge of the window nearest the pointer (the Shift-drag law) */
export function nearestSide(x, y, box) {
  const b = R(box), right = b.left + b.width, bottom = b.top + b.height;
  const cx = clamp(x, b.left, right), cy = clamp(y, b.top, bottom);
  const d = (side) => Math.hypot(x - (side === 'left' ? b.left : side === 'right' ? right : cx), y - (side === 'top' ? b.top : side === 'bottom' ? bottom : cy));
  return SIDES.reduce((best, s) => (d(s) < d(best) ? s : best), SIDES[0]);
}

/** roomFor(box, side, sizes, view) — where a FLOATING window moves so its rail fits on `side` (the window makes
 *  room when the hand chose that side); unchanged when it already fits or when window and rail cannot both fit */
export function roomFor(box, side, sizes, view, pad = RAIL.pad, gap = 0) {
  const b = R(box), g = gapOf(gap, side), { w: w0, h: h0 } = sizes[vertical(side) ? 'vertical' : 'horizontal'];
  const w = vertical(side) ? w0 + g : w0, h = vertical(side) ? h0 : h0 + g;   // the gap is room the rail needs too
  let { left, top } = b;
  if (side === 'left' && b.width + w <= view.width - 2 * pad) left = clamp(left, pad + w, view.width - pad - b.width);
  if (side === 'right' && b.width + w <= view.width - 2 * pad) left = clamp(left, pad, view.width - pad - w - b.width);
  if (side === 'top' && b.height + h <= view.height - 2 * pad) top = clamp(top, pad + h, view.height - pad - b.height);
  if (side === 'bottom' && b.height + h <= view.height - 2 * pad) top = clamp(top, pad, view.height - pad - h - b.height);
  return { left, top, width: b.width, height: b.height };
}

/* ── the chip tables ────────────────────────────────────────────────────────────────────────────────────────── */
const PRESSED = { true: 'true', false: 'false', mixed: 'mixed' };
/** chipTable(spec) — every state of a chip as one row { pressed, label, hint, glyph, text }, keyed by state.
 *  close · action · grip: one row (key null, no aria-pressed).  toggle · radio: rows true and false.
 *  cycle: one row per `states[]` entry, in the declared order, each saying its own pressed (default false). */
export function chipTable(spec) {
  const base = { label: spec.label, hint: spec.hint, glyph: spec.glyph, text: spec.text };
  const row = (o = {}, pressed) => ({ ...base, ...o, pressed: PRESSED[String(o.pressed ?? pressed)] });
  const t = new Map();
  if (spec.kind === 'toggle' || spec.kind === 'radio') {
    t.set(false, row(spec.states && spec.states.false, false)); t.set(true, row(spec.states && spec.states.true, true));
  } else if (spec.kind === 'cycle') {
    if (!spec.states || !spec.states.length) throw new Error(`rail: cycle chip "${spec.name}" needs states[]`);
    for (const s of spec.states) t.set(s.id, row(s, false));
  } else t.set(null, { ...base, pressed: undefined });
  return t;
}
/** the state a press moves a chip to: a toggle flips, a radio turns on, a cycle steps in its declared order */
export function nextState(spec, state) {
  if (spec.kind === 'toggle') return !state;
  if (spec.kind === 'radio') return true;
  if (spec.kind === 'cycle') { const ids = spec.states.map((s) => s.id), i = ids.indexOf(state); return ids[(i + 1) % ids.length]; }
  return null;
}
const initial = (spec) => (spec.kind === 'cycle' ? (spec.state ?? spec.states[0].id) : spec.kind === 'toggle' || spec.kind === 'radio' ? !!spec.state : null);

/* ── the rail ───────────────────────────────────────────────────────────────────────────────────────────────── */
const GRIP_HINT = phrase('Move window · Shift-drag, or hold, to move these controls to another edge · arrows when focused');
const KEY_SIDE = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'top', ArrowDown: 'bottom' };
const KEY_NUDGE = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
const forwarded = new WeakSet();
/** markForwarded(e) — a press another surface handed to the grip (window.js empty glass): the long press ignores it */
export const markForwarded = (e) => { forwarded.add(e); return e; };

/** createRail({ id, title, chips, side, layer, seats, onChip, onSide, onNudge })
 *  chips: [{ name, kind: close|action|toggle|radio|cycle|grip, label, hint?, glyph? | text?, group?, states?, state? }]
 *  seats() → [{ id: side, rect }] — where the rail would land on each side (the window's own layout); onSide(side,
 *  phase) with phase 'preview' (keyboard, live), 'commit' or 'cancel' (back to where the keyboard started).
 *  → { el, grip, chip(name), setChip(name, state), state(name), measure(), sizes(), seat(seat, { animate }),
 *      setDock(dock), holding(), destroy() }
 *  setDock('top' | 'bottom' | null) — the rail carries its window's dock (data-dock): docked at the top or bottom, the
 *  chips sit tighter along it (window.css, --rail-gap; BASINS 2026-10-01).  Its length changes, so the next sizes()
 *  measures again; its width across does not (the dock lane is measured from it). */
export function createRail({ id, title, chips = [], layer, seats, onChip, onSide, onNudge } = {}) {
  const doc = (layer && layer.ownerDocument) || document;
  const el = doc.createElement('div');
  el.className = 'mir-rail';
  el.setAttribute('role', 'toolbar');
  ariaLabel(el, '{title} window controls', { title: { t: String(title || id) } });   // for people; CSS keys on the hooks
  el.dataset.mirRail = id;
  el.hidden = true;
  const specs = new Map(), nodes = new Map(), tables = new Map(), states = new Map(), inked = new Map();   // inked: the ink drawn now
  const list = chips.some((c) => c.kind === 'close') ? chips : [{ name: 'close', kind: 'close', glyph: 'close', label: 'Close window' }, ...chips];
  const all = list.some((c) => c.kind === 'grip') ? list : [...list, { name: 'grip', kind: 'grip', label: 'Move window', hint: GRIP_HINT }];
  for (const spec of all) {
    const b = doc.createElement('button');
    b.type = 'button'; b.className = 'mir-chip';
    b.dataset.mirChip = spec.name; b.dataset.kind = spec.kind;
    if (spec.kind === 'grip') { const dots = doc.createElement('span'); dots.className = 'mir-grip-dots kwin-grip-dots'; dots.setAttribute('aria-hidden', 'true'); for (let i = 0; i < 9; i++) dots.appendChild(doc.createElement('i')); b.appendChild(dots); }
    el.appendChild(b);
    specs.set(spec.name, spec); nodes.set(spec.name, b); tables.set(spec.name, chipTable(spec));
    setChip(spec.name, initial(spec));
    if (spec.kind !== 'grip') b.addEventListener('click', () => press(spec.name));
  }
  const grip = [...nodes.values()].find((b) => b.dataset.kind === 'grip');

  /** the ink: a glyph from glyph.js, or a short text (a sort mode, "A–Z") */
  function ink(b, row) {
    const want = row.glyph ? 'g:' + row.glyph : row.text ? 't:' + row.text : '';
    if (inked.get(b) === want || b.dataset.kind === 'grip') return;
    inked.set(b, want); b.textContent = '';
    if (row.glyph) { b.dataset.glyph = row.glyph; const g = glyphEl(row.glyph, 'mir-chip-ink gly-' + row.glyph, 26); if (g) b.appendChild(g); }
    else { delete b.dataset.glyph; if (row.text) { const t = doc.createElement('span'); t.className = 'mir-chip-text'; setText(t, row.text); b.appendChild(t); } }
  }
  /** setChip(name, state) — write the state's row: .on, aria-pressed, data-state, label, hint, ink */
  function setChip(name, state) {
    const b = nodes.get(name), spec = specs.get(name), table = tables.get(name);
    if (!b) return;
    const key = table.has(state) ? state : spec.kind === 'toggle' || spec.kind === 'radio' ? !!state : table.keys().next().value;
    const row = table.get(key);
    states.set(name, key);
    b.classList.toggle('on', row.pressed === 'true');
    setAttr(b, 'aria-pressed', row.pressed ?? null);
    setAttr(b, 'data-state', key === null ? null : String(key));
    if (row.label) ariaLabel(b, row.label); else setAttr(b, 'aria-label', name);   // a chip's name and hint are the kit's words (1.5.4)
    hint(b, row.hint || row.label || name);
    ink(b, row);
    if (spec.kind === 'radio' && key === true) for (const [n, s] of specs) if (n !== name && s.kind === 'radio' && s.group === spec.group && states.get(n)) setChip(n, false);
  }
  function press(name) {
    const spec = specs.get(name), next = nextState(spec, states.get(name));
    if (spec.kind === 'toggle' || spec.kind === 'radio' || spec.kind === 'cycle') setChip(name, next);
    if (onChip) onChip(name, next, spec);
  }

  /* the sizes: one read per layout, the other orientation is the same line turned */
  let size = null;
  function measure() {
    const r = rect(el); if (!r.width || !r.height) return size;
    const v = vertical(el.dataset.side || 'left');
    const a = { w: Math.round(r.width), h: Math.round(r.height) }, b = { w: a.h, h: a.w };
    size = v ? { vertical: a, horizontal: b } : { vertical: b, horizontal: a };
    return size;
  }
  let stale = false;                                                 // the dock changed the rail's length: measure again
  /** seat(s, { animate }) — land the rail on a seat from seatRail().  Animated: the same orientation travels by
   *  tweenRect (position only), a turn of orientation lands at once and travels by flip. */
  const pos = (n, to) => { setVar(n, 'left', `${Math.round(to.left)}px`); setVar(n, 'top', `${Math.round(to.top)}px`); };
  function seat(s, { animate = false } = {}) {
    const was = el.dataset.side;
    const write = () => { setAttr(el, 'data-side', s.side); pos(el, s); };
    if (!animate || el.hidden || !was) { if (owns(el)) tweenRect(el, rect(el), { commit: pos }); write(); return Promise.resolve(true); }
    if (vertical(was) === vertical(s.side)) { setAttr(el, 'data-side', s.side); return tweenRect(el, s, { commit: pos }); }
    return flip([el], write);
  }

  /* ── THE LONG PRESS: the four seats, as drop guides, and the finger picks one ─────────────────────────────── */
  const prox = createProximity({ layer: layer || doc.body, reach: 96, capture: 32, onCancel: () => endPick() });
  let hold = null, picking = false, held = false;
  const seatsNow = () => (seats ? seats() : []).map((t) => ({ id: t.id, rect: t.rect, shape: 'rect' }));
  function endPick() { picking = false; grip.classList.remove('armed'); setAttr(el, 'data-picking', null); }
  const holdDown = (e) => {
    held = false;
    if (forwarded.has(e) || (!e.isPrimary && e.isTrusted) || e.button !== 0) return;   // a scripted press is a press (core/pointer.js)
    hold = { id: e.pointerId, x: e.clientX, y: e.clientY, timer: setTimeout(() => {
      hold.timer = 0; picking = held = true; grip.classList.add('armed'); setAttr(el, 'data-picking', 'true');
      prox.update({ x: hold.x, y: hold.y }, seatsNow());
    }, RAIL.longPress) };
  };
  const holdMove = (e) => {
    if (!hold || e.pointerId !== hold.id) return;
    if (picking) { prox.update({ x: e.clientX, y: e.clientY }, seatsNow()); return; }
    if (hold.timer && Math.hypot(e.clientX - hold.x, e.clientY - hold.y) > RAIL.slop) { clearTimeout(hold.timer); hold = null; }
  };
  const holdUp = (e) => {
    if (!hold || e.pointerId !== hold.id) return;
    if (hold.timer) clearTimeout(hold.timer);
    hold = null;
    if (!picking) return;
    const m = prox.end(), pick = m && (m.captured || m.best);
    endPick();
    if (pick && onSide) onSide(pick.id, 'commit');
  };
  const holdCancel = (e) => { if (!hold || (e.pointerId !== undefined && e.pointerId !== hold.id)) return; if (hold.timer) clearTimeout(hold.timer); hold = null; if (picking) prox.cancel(); };
  grip.addEventListener('pointerdown', holdDown);
  grip.addEventListener('pointermove', holdMove);
  grip.addEventListener('pointerup', holdUp);
  grip.addEventListener('pointercancel', holdCancel);
  grip.addEventListener('lostpointercapture', holdCancel);
  grip.addEventListener('contextmenu', (e) => e.preventDefault());   // a held finger is a seat pick, not a menu

  /* ── THE KEYBOARD: arrows move the seat, Enter keeps it, Escape puts it back; Shift+arrows nudge the window ── */
  let kb = false;                                                    // a keyboard seat preview is open
  const keys = (e) => {
    if (e.shiftKey && KEY_NUDGE[e.key]) { e.preventDefault(); if (onNudge) onNudge(KEY_NUDGE[e.key][0] * RAIL.nudge, KEY_NUDGE[e.key][1] * RAIL.nudge); return; }
    if (KEY_SIDE[e.key]) { e.preventDefault(); kb = true; if (onSide) onSide(KEY_SIDE[e.key], 'preview'); return; }
    if (e.key === 'Enter' && kb) { e.preventDefault(); kb = false; if (onSide) onSide(null, 'commit'); return; }
    if (e.key === 'Escape' && kb) { e.preventDefault(); e.stopPropagation(); kb = false; if (onSide) onSide(null, 'cancel'); }
  };
  const blur = () => { if (kb) { kb = false; if (onSide) onSide(null, 'commit'); } };
  grip.addEventListener('keydown', keys);
  grip.addEventListener('blur', blur);

  return {
    el, grip,
    chip: (name) => nodes.get(name),
    setChip, state: (name) => states.get(name),
    /* before the rail has ever been seen, the kit's chip target (62) and gap (7) stand in for a measurement */
    measure, sizes: () => { if (stale) { stale = false; measure(); } return size || measure() || { vertical: { w: 62, h: 69 * nodes.size - 7 }, horizontal: { w: 69 * nodes.size - 7, h: 62 } }; },
    seat,
    setDock(dock) { const d = dock === 'top' || dock === 'bottom' ? dock : null; if ((el.dataset.dock || null) === d) return; setAttr(el, 'data-dock', d); stale = true; },
    /** true from a long press until the next press: the window's drag stands down for it */
    holding: () => held,
    destroy() { holdCancel({}); prox.destroy(); el.remove(); },
  };
}
