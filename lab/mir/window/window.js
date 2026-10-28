/* window/window.js — the one floating window.
 *
 * THE LAW IT KEEPS: ONE WINDOW SPECIES, ONE PLACE THAT PLACES IT.  Every floating window in an app — MODULATION,
 * TIMELINE, SAVE/FOLDERS, PATTERN, HISTORY — is this: a glass pane, a chip rail beside it (window/rail.js), and one
 * layout function (windowLayout) that turns the window's state { x, y, w, h, open, dock, chipSide } into the rect
 * the pane lands in and the seat its rail lands in.  The drag, the resize, the dock, the three relocation gestures,
 * open and close all change the state and call that one function; nothing else writes the pane's box.  While the
 * window's own placement motion owns the pane (motion.owns), a plain relayout waits for it to land.
 *
 * And six rules:
 *   1. THE DOM CARRIES HOOKS, NOT LOOKS.  `data-mir-window="<id>"`, `data-mir-rail`, `data-mir-chip` and classes; the
 *      material is window.css, native.  No stylesheet is cloned at runtime (BASINS kwin.js adoptMaterial re-issued
 *      ~1,250 modulation-window rules per window) and nothing is styled by its label text.
 *   2. OPEN AND CLOSE HAVE MOTION (motion.presence), window and rail together; a dock landing travels (tweenRect).
 *   3. EVERY GESTURE IS core/pointer.js drag: coalesced, the last sample flushed before the commit, and any cancel —
 *      Escape, a lost capture, the window losing focus, a hidden page — rolls the state back.
 *   4. EMPTY GLASS IS A HANDLE (emptyDrag): a press that lands on nothing pressable is handed to the grip, so one
 *      gesture machinery moves the window from either.
 *   5. WINDOW AND RAIL RISE TOGETHER, by one stack shared by every window: a press anywhere on either puts the pair on
 *      top; z is the pair's place in the stack, so it stays small and nothing reads a sibling's style.  EVERY RAIL IS
 *      ABOVE EVERY WINDOW (1.5.0-alpha.17): the panes take 1 … n, the rails n + 1 … 2n, so no window covers chips.  A
 *      window with no rail (chrome: 'close') pressed above every rail window takes its rail's z and sits above them all.
 *   6. IT SAYS WHERE IT IS: onMoved(rect) after every layout (null when it closes), so a host can dodge it.
 *      A window the app built itself joins that one stack by registerWindow({ root, rail }) (1.5.0-alpha.15).
 *   7. THE LEGO STACK (1.5.0-alpha.12, BASINS shell.js syncWorkspaceStack / modwindow.js stackAbove / timeline-window.js
 *      reserveTop): reserveTop(px) keeps a band above the window free (its dock span's top and its floating floor), and
 *      stackAbove(anchor) seats the window 8 px above another one's rect; a hand dragging it away ends the stack.  The
 *      pairing itself is window/workspaces.js.
 * Harvested from BASINS mir-plugins/kwin/kwin.js (the shell, the raise law, empty-glass drag), snap-window.js (the
 * drag, the Shift seat, the dock commit), save-window.js and timeline-window.js (how a window is made today).
 */
import { drag, installPress } from '../core/pointer.js';
import { presence, tweenRect, owns, settled } from '../core/motion.js';
import { rect, setVar, setAttr } from '../core/perf.js';
import { ariaLabel, label, hint } from '../kit.js';
import { glyphEl, hasGlyph } from '../glyph.js';
import { createRail, seatRail, seatOn, nearestSide, roomFor, markForwarded, RAIL } from './rail.js';
import { dockGeometry, createDockGuide, anchorBox } from './dock.js';

/** the house clamp (kwin.js): 120 px of a window stays across the screen, 52 px of it stays below its top */
export const CLAMP = Object.freeze({ x: 120, y: 52, inset: 16, top: 56 });
const CHIP_SIDES = ['left', 'right', 'top', 'bottom', 'auto'];
const clamp = (n, lo, hi) => Math.max(lo, Math.min(Math.max(lo, hi), n));

/* ── the pure part: the persisted shape and the layout ─────────────────────────────────────────────────────── */
/** readShape(raw, defaults, min) — the one persistence shape { x, y, w, h, open, dock, chipSide }, every field
 *  checked: x/y a number or null (null = centred until a hand moves it), w/h at least `min`, dock top|bottom|null,
 *  chipSide left|right|top|bottom|auto.  Anything else falls back to the default. */
export function readShape(raw, d, min = { w: 0, h: 0 }) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const num = (v, f) => (Number.isFinite(v) ? Math.round(v) : f);
  return {
    x: num(r.x, d.x ?? null), y: num(r.y, d.y ?? null),
    w: Math.max(min.w, num(r.w, d.w)), h: Math.max(min.h, num(r.h, d.h)),
    open: typeof r.open === 'boolean' ? r.open : !!d.open,
    dock: r.dock === 'top' || r.dock === 'bottom' || r.dock === 'anchor' ? r.dock : null,
    chipSide: CHIP_SIDES.includes(r.chipSide) ? r.chipSide : (d.chipSide || 'left'),
  };
}
/** what the dock geometry is asked, the same for the guide and for the landing (so the guide IS the landing) */
export function dockInput(P, env) {
  return { span: env.span, side: P.chipSide === 'auto' ? 'left' : P.chipSide, height: Math.min(P.h, env.view.height - CLAMP.inset),
    railSizes: env.sizes, viewport: env.view };
}
/** stackedAt(box, anchor, view, gap) — BASINS modwindow.js stackAbove: the left edge on the anchor's (kept 8 px inside
 *  the screen), the bottom `gap` px above the anchor's top (the top never above 8).  → { left, top } */
export function stackedAt(box, anchor, view, gap = 8) {
  const edge = 8;
  return { left: Math.round(Math.max(edge, Math.min(view.width - box.width - edge, anchor.left))), top: Math.round(Math.max(edge, anchor.top - gap - box.height)) };
}
/** withReserve(span, reserve, edge) — the span with a band of `reserve` px kept free at its top (BASINS reserveTop:
 *  the bounds' top becomes 8 + reserve) */
export const withReserve = (span, reserve, edge = 8) => (reserve > 0 && span ? { ...span, top: Math.max(span.top ?? edge, edge + reserve) } : span);

/** windowLayout(P, env) — the state to the pane's rect and the rail's seat.  env = { view: { width, height },
 *  sizes: the rail's { vertical, horizontal }, span: the dock span or null, gap?: the floating rail's gap (a number or
 *  per side; default 0 — createWindow passes kwin's RAIL.gap), anchor?: the seat rect when docked on an anchor, which may carry
 *  `avoid` (the glass of the window it is seated on) and `outer` (the edge facing away from it) for the rail's seat }.  Docked when it can be; a dock with no
 *  room floats for now and keeps the wish (P.dock is not touched).  → { box, seat, docked } */
export function windowLayout(P, env) {
  const { view, sizes } = env;
  /* seated on an anchor (BASINS: the PATTERN window on its ENV): where the seat is, clamp-free (kwin.js place()) — the
     seat scrolls with its owner and the host's clip cuts what the owner cuts; no seat (it left): `away` */
  if (P.dock === 'anchor') {
    /* the rail under another window (BASINS snap-window.js seat): the anchor may say whose glass to keep off (`avoid`) and
       which edge faces away from it (`outer`); the racks' span is the lane a side seat must stay inside */
    if (env.anchor && env.anchor.width > 0) {
      const box = anchorBox(env.anchor, Math.min(P.h, view.height - CLAMP.inset)), a = env.anchor;
      return { box, seat: seatRail({ prefer: P.chipSide, box, sizes, view, gap: env.gap ?? 0, avoid: a.avoid || null, outer: a.outer || null, lane: a.avoid ? env.span || null : null }), docked: 'anchor' };
    }
    if (env.anchor !== undefined) return { box: null, seat: null, docked: 'anchor', away: true };
  }
  if (P.dock && P.dock !== 'anchor' && env.span) {
    const g = dockGeometry({ ...dockInput(P, env), dock: P.dock });
    if (g) { const box = { left: g.left, top: g.top, width: g.width, height: g.height }; return { box, seat: seatOn(g.side, box, sizes, view), docked: P.dock }; }
  }
  const w = Math.min(P.w, view.width - CLAMP.inset), h = Math.min(P.h, view.height - CLAMP.inset);
  /* env.top: a floating window stays below a reserved band (BASINS snap-window.js: P.y = max(P.y, bounds().top)) */
  const x = P.x ?? Math.round((view.width - w) / 2), y = Math.max(env.top ?? -Infinity, P.y ?? Math.round(Math.max(CLAMP.top, (view.height - h) / 2)));
  /* 1.5.6-alpha.3 (λWAVES 021 V1) · THE TALL WINDOW: one too tall to sit below the top band keeps its bottom (and its resize corner) on screen */
  const low = h > view.height - CLAMP.top - CLAMP.inset / 2 ? Math.max(0, view.height - h - CLAMP.inset / 2) : view.height - CLAMP.y;
  const box = { left: clamp(x, CLAMP.x - w, view.width - CLAMP.x), top: clamp(y, 0, Math.min(low, view.height - CLAMP.y)), width: w, height: h };
  return { box, seat: seatRail({ prefer: P.chipSide, box, sizes, view, gap: env.gap ?? 0 }), docked: null };
}

/* ── the raise: one stack for every window, the pair rises together, every rail above every window ─────────── */
/* panes at 1 … n in press order, rails at n + 1 … 2n in the same order (1.5.0-alpha.17, BASINS' window law: "the chips
   keep dissapearing underneath other windows" — Josh 2026-09-26): a window opened over another never covers its chips,
   the pressed window's rail is the top rail, and a registered window's rail is in the same tier as the kit's.  2n stays
   below the guide's --z-prox, as before.
   A TITLE-BAR WINDOW ON TOP IS ITS OWN RAIL (chrome: 'close', 1.5.0 wave 20): the tier law is for windows that have a
   rail; a pane that is its own chrome, pressed above every rail window, takes the z its rail would take (n + 1 + k), so
   it sits above every other rail and its title bar and × are never under one.  Below a rail window it is a pane in the
   pane tier, as before.  The same one stack, no second counter. */
const STACK = [];
function raisePair(w) {
  const i = STACK.indexOf(w); if (i >= 0) STACK.splice(i, 1);
  STACK.push(w);
  const n = STACK.length, lead = STACK.findLastIndex((x) => !x.titled);   // the top window that is not its own chrome
  STACK.forEach((x, k) => { setVar(x.root, 'z-index', String(x.titled && k > lead ? n + 1 + k : 1 + k)); if (x.rail) setVar(x.rail, 'z-index', String(n + 1 + k)); });
}
/* a window's pair, found from either of its two elements (an app's own window law holds elements, not the api) */
const OWNER = new WeakMap();
/** windowOf(el) → the api of the kit window (or the registered window) whose root or rail is el (or contains it), or
 *  null.  An app's window law that raises by element calls windowOf(el).raise(), and the rail comes with the pane. */
export function windowOf(el) {
  for (let n = el; n; n = n.parentElement) { const w = OWNER.get(n); if (w) return w; }
  return null;
}
/** registerWindow({ root, rail? }) — ONE STACK (1.5.0-alpha.15, BASINS kwin.js's window law: "one counter for everything
 *  in it").  A window the app built itself (the modulation window's #modwin, a window of its own) joins the kit's stack:
 *  a press on its pane or its rail raises the pair over every kit window, a press on a kit window raises that one over
 *  it, and windowOf(el) finds it; its rail is in the rails' tier, above every window (1.5.0-alpha.17).  It joins on
 *  top.  → { root, rail, pair, raise(), leave() }; leave() takes it out (its z-index is left where it was).  Registering the same root twice returns the first registration. */
export function registerWindow({ root, rail = null } = {}) {
  if (!root) return null;
  const had = OWNER.get(root); if (had && had.adopted) return had;
  const pair = { root, rail: rail || null }, raise = () => raisePair(pair);
  root.addEventListener('pointerdown', raise, true);
  if (pair.rail) pair.rail.addEventListener('pointerdown', raise, true);
  const api = { root, rail: pair.rail, pair, raise, adopted: true,
    leave() {
      root.removeEventListener('pointerdown', raise, true); if (pair.rail) pair.rail.removeEventListener('pointerdown', raise, true);
      const i = STACK.indexOf(pair); if (i >= 0) STACK.splice(i, 1);
      if (OWNER.get(root) === api) OWNER.delete(root); if (pair.rail && OWNER.get(pair.rail) === api) OWNER.delete(pair.rail);
    } };
  OWNER.set(root, api); if (pair.rail) OWNER.set(pair.rail, api);
  raise();
  return api;
}
/* ── THE TITLE BAR (chrome: 'close', 1.5.0 wave 19; Josh 2026-10-06: "Let MIR about and GUI feature a simple x in the
   corner instead of chips and make sure the window is easily draggable") ─────────────────────────────────────────────
   A small window with nothing to dock carries no chip rail: a title bar inside the pane, its title on the left, a
   slot for the window's own head buttons (`tools`) and a plain × in the corner.  THE WHOLE BAR IS THE GRIP: the house
   gripGesture runs on it as it runs on a rail's grip, so the drag, its cancels, the raise and the clamp are the same
   machinery.  The rail's side of that gesture is this stand-in: no element, no size, no seat. */
const NO_RAIL = Object.freeze({ vertical: Object.freeze({ w: 0, h: 0 }), horizontal: Object.freeze({ w: 0, h: 0 }) });
/** windowGlyphs({ id: glyphName }) (1.5.6-alpha.3) — an app names its windows' glyphs by window id once, before they are made, so a window
 *  a kit factory creates (MIR OPTIONS `gui`, ABOUT `gui-about`, `keyboard`, the TIMELINE…) wears one with no option on each factory;
 *  a `glyph` passed to createWindow wins */
const NAMED = new Map();
export function windowGlyphs(table) { for (const [id, g] of Object.entries(table || {})) if (typeof g === 'string' && g) NAMED.set(id, g); }

function titleBar(doc, root, title, onClose, glyph) {
  const bar = doc.createElement('div'); bar.className = 'mir-win-head'; root.appendChild(bar);
  if (glyph && hasGlyph(glyph)) bar.appendChild(glyphEl(glyph, 'mir-win-glyph gly gly-' + glyph));   // 1.5.6-alpha.3: the window's one drawing, before its title
  const name = label(doc.createElement('div'), String(title)); name.className = 'mir-win-title'; bar.appendChild(name);
  const tools = doc.createElement('div'); tools.className = 'mir-win-tools'; bar.appendChild(tools);
  /* a press on a head button is that button's, never the grip's (the grip's drag would take its pointer) */
  tools.addEventListener('pointerdown', (e) => { if (e.target !== tools) e.stopPropagation(); });
  const x = doc.createElement('button'); x.type = 'button'; x.className = 'mir-win-btn mir-win-x'; x.dataset.glyph = 'close';
  ariaLabel(x, 'Close window'); hint(x, 'Close window'); const g = glyphEl('close', 'gly gly-close'); if (g) x.appendChild(g);
  x.addEventListener('click', onClose); tools.appendChild(x);
  const rail = { el: null, grip: bar, chip: () => null, setChip() {}, state() {}, measure: () => null, sizes: () => NO_RAIL,
    seat: () => Promise.resolve(true), setDock() {}, holding: () => false, destroy() {} };
  return { bar, tools, close: x, rail };
}

const pressed = new WeakSet();
function installOnce(doc) { if (pressed.has(doc)) return; pressed.add(doc); installPress({ selector: '.mir-chip', root: doc.defaultView }); }

/* what empty glass is NOT: anything a hand presses, edits or scrolls by itself (kwin.js's list) */
const PRESSABLE = 'button, input, select, textarea, a[href], label, summary, [contenteditable=""], [contenteditable="true"], ' +
  '[role="button"], [role="slider"], [role="switch"], [role="tab"], [role="menuitem"], [role="option"], [tabindex]:not([tabindex="-1"]), ' +
  '.k, .fd, .sw, .seg, .trig, .mir-win-resize, canvas, video';
/** along(p, lo, size, next) — where a span of `next` starts so the point p keeps its place on it (detaching a dock) */
const along = (p, lo, size, next) => (p < lo ? lo : p > lo + size ? lo + size - next : p - ((p - lo) / size) * next);

/** gripGesture(rail, w) → { drag, active() } — THE GRIP DRAG of a window and its rail: the kit's window here, and the
 *  modulation window, which keeps its own layout.  core/pointer.js drag on the rail's grip: Shift hands the rail to the
 *  nearest edge; a docked window dragged away detaches with the pressed point keeping its place; near a dock the guide
 *  tracks the landing and a release there docks it; any cancel puts the state back.  `w` is the window's side of it:
 *    P() → its state (changed in place) · box() → its box now · moving() → its own travel is running · still() stops it
 *    floatSize() → { w, h } a detached window floats at · layout(o) lays it out from P ({ animate }) · relocate(side)
 *    guide (the dock guide, or null) · track() feeds the guide during a move · save() after a release
 *    begin() → what the window leaves when a drag starts (its lego stack), handed back to undo(it) on a cancel */
export function gripGesture(rail, w) {
  let gest = null;
  const grip = drag(rail.grip, { slop: RAIL.slop,
    onStart() {
      const P = w.P(); w.still();
      const b = w.box(); if (!P.dock && b) { P.x = b.left; P.y = b.top; }
      gest = { before: { ...P }, anchor: null, shifted: false, own: w.begin ? w.begin() : null };
      rail.grip.classList.add('drag');
    },
    onMove(s) {
      if (!gest || rail.holding()) return;
      const P = w.P();
      if (s.shiftKey) {                                              // Shift: the nearest edge takes the rail
        gest.shifted = true; gest.anchor = null; if (w.guide) w.guide.cancel();
        const side = nearestSide(s.x, s.y, w.box()); if (side !== P.chipSide) w.relocate(side);
        return;
      }
      if (!gest.anchor) {
        const at = gest.shifted ? { x: s.x, y: s.y } : { x: s.x0, y: s.y0 };
        if (P.dock) {                                                // drag away to detach: the point keeps its place
          const b = w.box(), f = w.floatSize();
          P.x = Math.round(along(at.x, b.left, b.width, f.w)); P.y = Math.round(along(at.y, b.top, b.height, f.h)); P.dock = null;
        }
        if (w.moving()) w.still();
        gest.anchor = { dx: at.x - P.x, dy: at.y - P.y };
      }
      P.x = Math.round(s.x - gest.anchor.dx); P.y = Math.round(s.y - gest.anchor.dy);
      w.layout();
      if (w.guide) w.track();
    },
    onEnd() {
      rail.grip.classList.remove('drag');
      const was = gest; gest = null;
      if (!was || rail.holding()) return;
      const hit = w.guide ? w.guide.end() : null;
      if (hit) { w.P().dock = hit.id; w.layout({ animate: true }); }
      w.save();
    },
    onCancel() {
      rail.grip.classList.remove('drag');
      if (w.guide) w.guide.cancel();
      if (!gest) return;
      const was = gest; Object.assign(w.P(), was.before); if (w.undo) w.undo(was.own); gest = null;
      w.still(); w.layout();
    },
  });
  return { drag: grip, active: () => !!gest };
}

/** createWindow({ id, title, host, chips, body | panels, size, min, resizable, emptyDrag, dock, persist, material,
 *  railGap, railTier, onMoved, onOpen, onClose })
 *    chips      rail chip specs (window/rail.js); a chip may carry press(state, win).  The close chip and the grip are
 *               added when absent; a radio chip named like a panel switches to it
 *    body       a Node, or fn(bodyEl) that fills the body;  panels: [{ name, body }] — one shown at a time (tab())
 *    size, min  { w, h } floating size and its floor;  resizable adds the corner;  emptyDrag true or a selector of
 *               the host's own pressable things
 *    dock       { span: { read(), subscribe(fn) } (dock.js observeSpan), guide: () => bool (the Display switch),
 *                 anchor?: { rect() → DOMRect | null, clip?() → DOMRect | null, subscribe?(fn) → off } — a seat on another
 *                 element the window can dock to (BASINS' anchorTarget): it follows it, is clipped to clip(), and hides
 *                 while the seat is gone or clipped away; seated, the window takes the seat's width and keeps it when a
 *                 hand frees it.  rect() may add { avoid, outer }: the glass the rail must keep off and the edge facing
 *                 away from it (rail.js seatClear, BASINS' seat law under the modulation window);  guideClass?: classes for the guide's overlays (an app's rig
 *                 selector, BASINS 'mod-snap-guide'); the overlays always carry data-mir-guide="dock" data-window="<id>" }
 *    material   'modulation' (or true): the window wears the modulation window's material (rail, chips, controls, resize corner;
 *               no CSS cloning), written as data-mir-material="modulation" on the window and its rail; window.css and skin.css key on that name
 *    railGap    the floating rail's gap from the pane, a number or { left, right, top, bottom } (default RAIL.gap: kwin's)
 *    persist    { read() → shape | null, write(shape) }
 *  → { root, body, rail, pair, open(), close(), toggle(), isOpen(), rect(), place(rect | pos, { animate }), resize({ w, h }), restore(shape), setChip, tab,
 *      raise(), stackAt(z), state(), destroy() }
 *    raise()    brings the pane AND its rail to the top of the kit's stack, together (a press on either does it)
 *    pair       { root, rail } — the window's two elements, for an app's own window law that stacks by element
 *    stackAt(z, { railOffset }) for an app law with its own counter: the pane at z, its rail at z + railOffset (default
 *               railTier), so they never part — or the rail sits in the app's own tier above every window
 *    railTier   createWindow's default rail offset for stackAt (1: just above its pane; BASINS keeps its rails in a tier
 *               above every window, e.g. 1000000)
 *    chrome     'rail' (default): the chip rail beside the pane.  'close': no rail — a title bar inside the pane (the title,
 *               the window's head buttons in `tools`, a plain × in the corner), the whole bar its grip, Escape closes it
 *               while focus is in it (or on nothing, with it on top).  For a small window with nothing to dock (GUI, ABOUT);
 *               `chips`, `dock`, `railGap` and the seat gestures do not apply.  → the api also carries `head` and `tools`
 *    glyph      a glyph name (1.5.6-alpha.3): the window's one drawing — before the title in a title bar, `data-glyph` on the root either way */
export function createWindow({ id, title = id, host, chips = [], body, panels, size = { w: 520, h: 360 }, min = { w: 240, h: 160 },
  resizable = false, emptyDrag = false, dock = null, persist = null, material = null, railGap = RAIL.gap, railTier = 1, chrome = 'rail', glyph = '', onMoved, onOpen, onClose } = {}) {
  const doc = host.ownerDocument, view = doc.defaultView;
  installOnce(doc);
  const mk = (tag, cls, parent) => { const n = doc.createElement(tag); if (cls) n.className = cls; if (parent) parent.appendChild(n); return n; };

  /* ── the DOM ── */
  const root = mk('div', 'mir-win glass');
  root.dataset.mirWindow = id;
  const mat = material === true ? 'modulation' : material || null;
  if (mat) root.dataset.mirMaterial = String(mat);   // a hook only: the sheet paints by it (docs/WINDOWS.md)
  root.setAttribute('role', 'group');
  ariaLabel(root, String(title));   // no toUpperCase: it would upper-case a translation
  root.hidden = true;
  if (!glyph) glyph = NAMED.get(id) || '';                         // 1.5.6-alpha.3: the app's table by id (windowGlyphs) for a kit factory's window
  if (glyph) root.dataset.glyph = glyph;                             // 1.5.6-alpha.3: drawn in a title bar; a rail window carries the name for a reader
  const head = chrome === 'close' ? titleBar(doc, root, title, () => api.close(), glyph) : null;
  if (head) { root.dataset.chrome = 'close'; dock = null; }
  const bodyEl = mk('div', 'mir-win-body', root);
  const fill = (target, b) => { const n = typeof b === 'function' ? b(target) : b; if (n && n.nodeType) target.appendChild(n); };
  const panelEls = new Map();
  if (panels && panels.length) {
    for (const p of panels) { const el = mk('div', 'mir-win-panel', bodyEl); el.dataset.panel = p.name; el.setAttribute('role', 'tabpanel'); fill(el, p.body); panelEls.set(p.name, el); }
  } else fill(bodyEl, body);
  const corner = resizable ? mk('div', 'mir-win-resize', root) : null;
  if (corner) { corner.setAttribute('role', 'separator'); ariaLabel(corner, 'Resize window'); }
  host.appendChild(root);

  /* ── the state ── */
  const P = readShape(persist && persist.read ? persist.read() : null, { w: size.w, h: size.h, chipSide: 'left' }, min);
  const wantOpen = P.open; P.open = false;
  let box = null, moving = null, deferred = false, gripping = () => false, kbBefore = null, active = panels && panels.length ? panels[0].name : null;
  let reserve = 0, stack = null;                                     // the lego stack: a band kept free above; the window this one sits on
  const seatOf = () => (dock && dock.anchor && typeof dock.anchor.rect === 'function' ? dock.anchor.rect() || null : undefined);
  const env = () => ({ view: { width: view.innerWidth, height: view.innerHeight }, sizes: rail.sizes(), span: dock ? withReserve(dock.span.read(), reserve) : null,
    gap: railGap, anchor: P.dock === 'anchor' ? seatOf() : undefined, top: reserve > 0 ? 8 + reserve : undefined });
  const shape = () => ({ x: P.x, y: P.y, w: P.w, h: P.h, open: P.open, dock: P.dock, chipSide: P.chipSide });
  const save = () => { if (persist && persist.write) persist.write(shape()); };

  const rail = head ? head.rail : createRail({ id, title, chips, layer: host,
    seats: () => ['left', 'right', 'top', 'bottom'].map((side) => ({ id: side, rect: relocated(side).seat })),
    onChip(name, state, spec) {
      if (spec.kind === 'close') { api.close(); return; }
      if (panelEls.has(name)) tab(name);
      if (spec.press) spec.press(state, api);
    },
    onSide(side, phase) {
      if (phase === 'preview') { if (!kbBefore) kbBefore = { ...P }; relocate(side); return; }
      if (phase === 'cancel') { if (kbBefore) { Object.assign(P, kbBefore); kbBefore = null; layout({ animate: true }); } return; }
      kbBefore = null;
      if (side && side !== P.chipSide) relocate(side);
      save();
    },
    onNudge(dx, dy) { if (P.dock || !box) return; P.x = box.left + dx; P.y = box.top + dy; layout({ animate: true }); save(); },
  });
  if (rail.el) host.appendChild(rail.el);
  if (mat && rail.el) rail.el.dataset.mirMaterial = String(mat);
  const pair = { root, rail: rail.el, titled: !!head };              // titled: its pane is its own chrome (the raise above)
  const shown = (on) => { root.hidden = !on; if (rail.el) rail.el.hidden = !on; };   // a title-bar window has no rail element
  const guide = dock ? createDockGuide({ layer: host, enabled: dock.guide || (() => true), window: id, cls: dock.guideClass || '' }) : null;

  /* ── THE ONE PLACE THAT PLACES IT ── */
  function layout({ animate = false } = {}) {
    if (!P.open) return box;
    /* the window's own placement tween owns the pane: a plain relayout waits for it to land (presence, an entrance,
       does not place, so a drag during an entrance is not held up) */
    if (!animate && moving && owns(root)) {
      if (!deferred) { deferred = true; settled(root).then(() => { deferred = false; layout(); }); }
      return box;
    }
    /* stacked on another window (the lego stack): it floats where the stack puts it; its own dock is kept as a wish */
    const on = stack && !gripping() ? stack() : null;
    if (on) {
      rail.setDock(null);
      const e = env(), w = Math.min(P.w, e.view.width - CLAMP.inset), h = Math.min(P.h, e.view.height - CLAMP.inset), at = stackedAt({ width: w, height: h }, on, e.view);
      P.x = at.left; P.y = at.top;
    }
    rail.setDock(!on && P.dock && dock ? P.dock : null);           // the docked rail sits tighter (window.css --rail-gap)
    const Q = on ? { ...P, dock: null } : P;
    let L = windowLayout(Q, on ? { ...env(), top: undefined } : env());
    if ((L.docked || null) !== (Q.dock && dock ? Q.dock : null)) { rail.setDock(L.docked); L = windowLayout(Q, env()); }
    /* an anchored window whose seat has gone, or is clipped away entirely, is not painted; otherwise it is cut to the clip */
    const clipTo = L.docked === 'anchor' && L.box && dock.anchor.clip ? dock.anchor.clip() : null;
    const out = L.away || (clipTo && (L.box.left >= clipTo.right || L.box.left + L.box.width <= clipTo.left || L.box.top >= clipTo.bottom || L.box.top + L.box.height <= clipTo.top));
    setVar(root, 'visibility', out ? 'hidden' : null); if (rail.el) setVar(rail.el, 'visibility', out ? 'hidden' : null);
    setAttr(root, 'data-anchor', L.docked === 'anchor' ? (out ? 'away' : 'seated') : null);
    if (L.away) { if (onMoved) onMoved(null); return box; }
    setVar(root, 'clip-path', clipTo && !out ? `inset(${Math.max(0, clipTo.top - L.box.top)}px ${Math.max(0, L.box.left + L.box.width - clipTo.right)}px ${Math.max(0, L.box.top + L.box.height - clipTo.bottom)}px ${Math.max(0, clipTo.left - L.box.left)}px)` : null);
    box = L.box;
    /* seated on an anchor, the window IS the seat's size (BASINS snap-window.js: `w = P.w = s.width; P.x = s.left;
       P.y = s.top`): a hand that frees it takes it at that width, and a drop back where it left lands on the seat */
    if (L.docked === 'anchor') { P.w = box.width; P.x = box.left; P.y = box.top; }
    setAttr(root, 'data-dock', L.docked);
    if (animate) {
      const t = tweenRect(root, box); moving = t;
      t.then(() => { if (moving === t) moving = null; });
    } else {
      setVar(root, 'left', `${box.left}px`); setVar(root, 'top', `${box.top}px`);
      setVar(root, 'width', `${box.width}px`); setVar(root, 'height', `${box.height}px`);
    }
    rail.seat(L.seat, { animate });
    if (onMoved) onMoved({ ...box, right: box.left + box.width, bottom: box.top + box.height });   // a whole rect, as a DOMRect reads (W20 TR: BASINS' shell read `right` and dropped every report)
    return box;
  }
  /** stop the window's own travel where it is seen, so a hand can take it */
  function still() { if (moving) { moving = null; tweenRect(root, rect(root)); box = { ...box, ...pick(rect(root)) }; } }
  const pick = (r) => ({ left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) });
  const pin = () => { if (!P.dock && box) { P.x = box.left; P.y = box.top; } };
  /** the state after the hand chooses `side`: a floating window makes room for its rail there */
  function relocated(side) {
    const Q = { ...P, chipSide: side }, e = env();
    if (!Q.dock || !e.span) { const r = roomFor(windowLayout(Q, e).box, side, e.sizes, e.view, RAIL.pad, railGap); Q.x = r.left; Q.y = r.top; }
    return { Q, seat: windowLayout(Q, e).seat };
  }
  function relocate(side) { if (!rail.el) return; Object.assign(P, relocated(side).Q); layout({ animate: true }); }

  /* ── THE DRAG: the grip (and empty glass, handed to it) ── */
  const grip = gripGesture(rail, { P: () => P, box: () => box, moving: () => !!moving, still, layout, relocate, guide, save,
    floatSize: () => { const e = env(); return { w: Math.min(P.w, e.view.width - CLAMP.inset), h: Math.min(P.h, e.view.height - CLAMP.inset) }; },
    track: () => guide.track(box, dockInput(P, env()), seatOf() || null),
    begin: () => { const s = stack; stack = null; return s; },   // dragged away, a stacked window leaves its stack (BASINS)
    undo: (s) => { stack = s; } });
  const gripDrag = grip.drag; gripping = grip.active;
  const onEmpty = (e) => {
    const t = e.target;
    if (e.defaultPrevented || e.button !== 0 || (!e.isPrimary && e.isTrusted) || gripDrag.active || !(t instanceof view.Element)) return;
    if (t.closest(PRESSABLE + (typeof emptyDrag === 'string' ? ', ' + emptyDrag : ''))) return;
    if (t.scrollHeight > t.clientHeight || t.scrollWidth > t.clientWidth) {    // a scroller's own scrollbar is not glass
      const r = t.getBoundingClientRect();
      if (e.clientX - r.left - t.clientLeft >= t.clientWidth || e.clientY - r.top - t.clientTop >= t.clientHeight) return;
    }
    e.preventDefault();
    rail.grip.dispatchEvent(markForwarded(new view.PointerEvent('pointerdown', { pointerId: e.pointerId, pointerType: e.pointerType, isPrimary: true,
      button: 0, buttons: e.buttons, clientX: e.clientX, clientY: e.clientY, shiftKey: e.shiftKey, cancelable: true })));
  };
  if (emptyDrag) root.addEventListener('pointerdown', onEmpty);

  /* ── THE RESIZE CORNER (bottom-right; top-right when docked at the bottom, where the height grows upward) ── */
  let rz = null;
  const cornerDrag = corner && drag(corner, {
    onStart() { still(); pin(); rz = { ...P }; root.classList.add('resizing'); },
    onMove(s) {
      if (!rz) return;
      const e = env();
      if (!P.dock) P.w = Math.round(clamp(rz.w + s.dx, min.w, e.view.width - CLAMP.inset));
      P.h = Math.round(clamp(rz.h + (P.dock === 'bottom' ? -s.dy : s.dy), min.h, e.view.height - CLAMP.inset));
      layout();
    },
    onEnd() { root.classList.remove('resizing'); rz = null; save(); },
    onCancel() { root.classList.remove('resizing'); if (rz) { Object.assign(P, rz); rz = null; layout(); } },
  });

  /* ── the raise, the viewport, the racks ── */
  const raise = () => raisePair(pair);
  root.addEventListener('pointerdown', raise, true);
  if (rail.el) rail.el.addEventListener('pointerdown', raise, true);
  const resized = () => layout();
  view.addEventListener('resize', resized, { passive: true });
  /* a title-bar window closes on Escape: when focus is in it, or on nothing while it is the top open window */
  const onEscape = (e) => {
    if (e.key !== 'Escape' || e.defaultPrevented || !P.open) return;
    const a = doc.activeElement, top = [...STACK].reverse().find((x) => !x.root.hidden);
    if (root.contains(a) || ((!a || a === doc.body) && top === pair)) { e.preventDefault(); api.close(); }
  };
  if (head) view.addEventListener('keydown', onEscape);
  const unSpan = dock && dock.span.subscribe ? dock.span.subscribe(() => { if (P.dock && P.dock !== 'anchor') layout(); }) : null;
  /* an anchored window follows its seat: the host says when the seat moved (a scroll, a relayout of its owner) */
  const unSeat = dock && dock.anchor && typeof dock.anchor.subscribe === 'function' ? dock.anchor.subscribe(() => { if (P.dock === 'anchor' && !gripping()) layout(); }) : null;

  function tab(name) {
    if (!panelEls.has(name)) return active;
    active = name;
    for (const [n, p] of panelEls) p.hidden = n !== name;
    if (rail.chip(name)) rail.setChip(name, true);
    bodyEl.scrollTop = 0;
    return name;
  }
  if (active) tab(active);

  const api = {
    root, body: bodyEl, rail, panels: panelEls,
    /** head — the title bar (chrome: 'close'), or null; tools — its slot for the window's own head buttons, before the × */
    head: head ? head.bar : null, tools: head ? head.tools : null,
    /** open() — measure and lay out once with nothing painted, then the entrance: window and rail together */
    open() {
      if (P.open) return;
      P.open = true;
      shown(true); rail.measure(); layout(); shown(false);
      raise();
      presence(root, true); if (rail.el) presence(rail.el, true);
      if (onOpen) onOpen(api);
      save();
    },
    close() {
      if (!P.open) return;
      gripDrag.cancel(); if (cornerDrag) cornerDrag.cancel(); if (guide) guide.cancel();
      P.open = false; moving = null;
      presence(root, false); if (rail.el) presence(rail.el, false);
      if (onMoved) onMoved(null);
      if (onClose) onClose(api);
      save();
    },
    toggle() { if (P.open) api.close(); else api.open(); },
    isOpen: () => P.open,
    rect: () => (box ? { ...box } : null),
    /** place(rect | pos, { animate }) — the host puts the window somewhere: it floats there */
    place(t, { animate = false } = {}) {
      if (t) {
        P.dock = null; P.x = Math.round(t.left ?? t.x); P.y = Math.round(t.top ?? t.y);
        if (t.width || t.w) P.w = Math.max(min.w, Math.round(t.width || t.w));
        if (t.height || t.h) P.h = Math.max(min.h, Math.round(t.height || t.h));
      }
      layout({ animate }); save();
    },
    /** restore(shape) — put the window in a persisted shape { x, y, w, h, open, dock, chipSide } (fields left out keep
     *  theirs), e.g. dock: 'anchor' seats it on its anchor again (BASINS kwin.js restore); opens or closes as it says */
    restore(raw = {}) {
      const Q = readShape({ ...shape(), ...(raw && typeof raw === 'object' ? raw : {}) }, { w: P.w, h: P.h, chipSide: P.chipSide }, min);
      const wantOpen = Q.open; Q.open = P.open; Object.assign(P, Q);
      if (wantOpen && !P.open) api.open(); else if (!wantOpen && P.open) api.close(); else { layout({ animate: true }); save(); }
    },
    /** resize({ w, h }) — the window's own size (docked: the height the dock or the anchor lands at), keeping the dock;
     *  one layout, saved.  A host whose content decides the height (the PATTERN window's rows) calls it. */
    resize({ w, h } = {}) {
      if (Number.isFinite(w)) P.w = Math.max(min.w, Math.round(w));
      if (Number.isFinite(h)) P.h = Math.max(min.h, Math.round(h));
      layout(); save();
    },
    setChip: rail.setChip, tab, raise, pair,
    /** reserveTop(px) — keep a band of px above this window free: a dock lands below it, a floating window stays below
     *  it (BASINS timeline-window.js reserveTop).  Re-places only when the band changed. */
    reserveTop(px) { const next = Math.max(0, Math.round(+px || 0)); if (next === reserve) return reserve; reserve = next; if (P.open) layout(); return reserve; },
    get reserved() { return reserve; },
    /** stackAbove(anchor | null) — sit 8 px above the rect `anchor()` gives (another window's), following it on every
     *  layout; null, or a drag of this window's grip, ends it (BASINS modwindow.js stackAbove) */
    stackAbove(anchor) { stack = typeof anchor === 'function' ? anchor : null; if (P.open) layout(); },
    get isStacked() { return !!stack; },
    /** stackHeight() — the height the stack must leave free for this window */
    stackHeight: () => (box ? box.height : Math.min(P.h, view.innerHeight - CLAMP.inset)),
    /** stackAt(z) — the pane at z-index z and its rail just above it (an app's own stacking law; an app whose own windows
     *  are registered (registerWindow) needs none: raise() is one press order for all of them) */
    stackAt(z, { railOffset = railTier } = {}) { const n = Math.round(+z) || 0; setVar(root, 'z-index', String(n)); if (rail.el) setVar(rail.el, 'z-index', String(n + (Math.round(+railOffset) || 0))); },
    state: shape,
    destroy() {
      dead = true; api.close(); gripDrag.destroy(); if (cornerDrag) cornerDrag.destroy(); if (guide) guide.destroy();
      if (unSpan) unSpan(); if (typeof unSeat === 'function') unSeat(); view.removeEventListener('resize', resized); view.removeEventListener('keydown', onEscape);
      const i = STACK.indexOf(pair); if (i >= 0) STACK.splice(i, 1);
      rail.destroy(); root.remove();
    },
  };
  /* a window persisted OPEN opens one microtask after createWindow returns, so its onOpen can already use the window
     and whatever the host builds right after the call (docs/WINDOWS.md) */
  let dead = false;
  if (wantOpen) queueMicrotask(() => { if (!dead && !P.open) api.open(); });
  OWNER.set(root, api); if (rail.el) OWNER.set(rail.el, api);
  return api;
}
