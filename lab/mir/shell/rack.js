/* shell/rack.js — the rack: the columns of windows at the screen's edges, the + and ☆ menus, drag to reorder, float
 * and dock, hide and peek, the transport's dodge, the phone's one rack, and the layout that survives a reload.
 *
 * Harvested from BASINS rack.js (the newest: the held card follows the hand while its neighbours swap, it stays in
 * the rack until it has cleared it by 12 px, a hidden rack is still a drop target, the phone crossing), checked
 * against λWAVES 0.3.2 (rack.js, rack-menus.js: the SHIFT-queue, favourite layouts, edge peek with an armed dismiss,
 * the transport dodge).  The DOM and the class names are theirs (`#rack`, `#rackL`, `#floats`, `.dev.floating`,
 * `.dragging`, `body.rack-hidden`, `rack-peek-left|right`, `#rackAdd`, `.mb-item`, `.mb-num`), so an adopting app's
 * own sheets keep matching and its look does not move.  docs/RACK.md is the manual.
 *
 * THE LAWS IT KEEPS
 *   1. A WINDOW IS REGISTERED BY NAME AND BUILT ON FIRST OPEN (EARTH's ask).  register() costs a Map entry; the
 *      device() shell and the window's own build(body, api) run the first time it opens.  EARTH's lifecycle law:
 *      FOLD keeps it running (onFold), CLOSE puts it to sleep (onClose / onSleep), POWER OFF frees it (onPower(false)).
 *      Whether its body can be seen at all is window-activity.js's answer, reported through onPresent(active).
 *   2. ONE GESTURE, ONE WRITER.  Every drag is core/pointer.js `drag` on one hidden grip, handed the press only once the
 *      hand has moved (so a click, a double click and every header button keep their own events).  The held window
 *      moves by `translate`; its neighbours FLIP (core/motion.js); the layout is committed once, on release.  Escape,
 *      pointercancel, a lost capture, a blur or a hidden page put everything back where the gesture began.
 *   3. THE DROP SHOWS WHERE IT LANDS (core/proximity.js): carrying a window over a rack draws the insertion slot it
 *      will land in, brightening with nearness and solid when release would land; while a docked window is carried,
 *      the slot it holds is drawn, and the rack's detach edge brightens as the window nears it.
 *   4. HIDE COSTS NOTHING, BY ONE PATH.  setHidden() writes `body.rack-hidden` and nothing else; window-activity.js
 *      reads that class and every window's presentation stands down.  A rack hides by TRANSFORM and DELAYED
 *      VISIBILITY only, never by fading it: an ancestor with opacity below one becomes what the glass inside it blurs
 *      (the likely cause of the Linux bug where a clicked rack window lost its blur).  rack.css says the same.
 *   5. A TOUCH USER ALWAYS HAS A WAY BACK: the edge handle shows while the interface is hidden on a coarse pointer.
 *   6. KEYBOARD AND TOUCH ARE FIRST-CLASS.  A window's header is focusable: ↑ ↓ move it in its rack, ← → move it to the
 *      other rack, Enter floats or docks it (arrows nudge a floating one).  A finger holds the header 400 ms to lift it.
 *   7. IDLE COSTS NOTHING: no poller, no rAF while nothing moves; peek reads one cached width per pointer move.
 *   8. THE LAYOUT IS DATA.  capture() → { v, hidden, phoneShown, cards: [{ id, side, open, folded, off, float }], nb? } in
 *      rack order, through an injected store; readLayout() repairs anything it is handed (unknown ids are dropped,
 *      never thrown on), and reads λWAVES' and BASINS' saved layouts (side 'L'/'R', `closed`) as they are.  A retired
 *      id resolves to its heir (`retired`), and a ☆ layout keeps the notebook's size (`nb`), as BASINS' did.
 *   9. BASINS' LEFTOVERS (1.5.0-alpha.12): the scrollbar seated at the card column (shell/rack-scrollbar.js,
 *      `scrollbar: true`), the touch-tablet float clamp (`tabletClamp`) and RESET LAYOUT (`resetLayout()`).
 *
 * createRack(options) → api — see docs/RACK.md.  windows() lists the windows with their titles and state (for describe()
 * and the openers); keepClear() gives the rects a new floating window should not land on (FOLDERS' first seat).  The pure helpers are exported for node tests. */
import { el, device, chip, ariaLabel } from '../kit.js';
import { drag } from '../core/pointer.js';
import { sequence, motionPolicy, motionToken, own, parseDuration } from '../core/motion.js';
import { createProximity } from '../core/proximity.js';
import { frame } from '../core/frame.js';
import { setVar, setAttr } from '../core/perf.js';
import { createWindowActivity } from '../window-activity.js';
import { observeSpan } from '../window/dock.js';
import { registerWindow } from '../window/window.js';
import { glyphEl, hasGlyph } from '../glyph.js';
import { createRackScrollbars } from './rack-scrollbar.js';
import { jsonStore } from '../core/prefs.js';

export const SIDES = Object.freeze(['left', 'right']);
/** the numbers the rack keeps (BASINS and λWAVES measured them) */
export const RACK = Object.freeze({
  detach: 12,       // … and comes off the rack once it has cleared the column by 12 px (BASINS rack.js:501)
  slot: 4,          // the insertion slot's thickness
  peekNear: 44,     // a hidden rack peeks when the pointer is this near its edge (BASINS rack.js:397) …
  peekHold: 48,     // … and holds while the pointer stays within the rack plus this (the armed dismiss)
  longPress: 400,   // a finger holds a header this long to lift it
  slop: 3,          // the hand travels this far before a press becomes a drag
  nudge: 24,        // an arrow nudges a floating window this far (the window rail's Shift+arrow)
  favourites: 4,    // ☆ layout slots (λWAVES LAYOUT_SLOTS)
  seatTop: 52, seatBottom: 60,   // the transport's two seats (λWAVES seatRect)
  tabletEdge: 8,    // on a touch tablet a float stays this far inside the visual viewport (BASINS clampFloat)
  tabletMin: 701,   // … a touch tablet is a coarse pointer at least this wide, and not the phone
});
const RACK_ID = { left: 'rackL', right: 'rack' };
/* what a header press must leave alone: its own buttons and anything a hand edits */
const PRESSABLE = 'button, input, select, textarea, a[href], label, [role="button"], [contenteditable="true"]';

/* ── the pure part ─────────────────────────────────────────────────────────────────────────────────────────── */
const mid = (b) => b.top + b.height / 2;
/** reorderIndex(boxes, at, bar) — THE TITLE BAR DECIDES (Josh, 2026-10-02: "Let the windows title bar be the deciding
 *  factor whether a window goes above or below something").  boxes are the rack's visible windows in order, the held
 *  one at `at`; `bar` is the middle of the held window's title bar.  It goes above a window as soon as `bar` is above
 *  that window's middle, and below it as soon as `bar` is below.  (BASINS compared the held window's CENTRE with the
 *  neighbour's middle, ± 8 px.)  No hysteresis is needed: once it has passed a window, that window's middle moves the
 *  held window's height away.  → the index the held window should take */
export function reorderIndex(boxes, at, bar) {
  if (!boxes[at]) return at;
  let to = at;
  for (let i = at - 1; i >= 0; i--) { if (bar < mid(boxes[i])) to = i; else break; }
  if (to !== at) return to;
  for (let i = at + 1; i < boxes.length; i++) { if (bar > mid(boxes[i])) to = i; else break; }
  return to;
}
/** insertionIndex(boxes, bar) — where a carried window lands among `boxes` (which do not include it): above the first
 *  window whose middle is below `bar`, the middle of its title bar (the same rule as reorderIndex) */
export function insertionIndex(boxes, y) {
  for (let i = 0; i < boxes.length; i++) if (y < mid(boxes[i])) return i;
  return boxes.length;
}
/** slotRect(col, boxes, index, thick) — the insertion slot: a line across the column, centred in the gap it opens */
export function slotRect(col, boxes, index, thick = RACK.slot) {
  const n = boxes.length, gap = n > 1 ? Math.max(0, boxes[1].top - (boxes[0].top + boxes[0].height)) : 10;
  const y = !n ? col.top + gap : index <= 0 ? boxes[0].top - gap / 2 : index >= n ? boxes[n - 1].top + boxes[n - 1].height + gap / 2
    : (boxes[index - 1].top + boxes[index - 1].height + boxes[index].top) / 2;
  return { left: col.left, top: Math.round(y - thick / 2), width: col.right - col.left, height: thick };
}
/** moveId(list, id, to) — the list with `id` moved to index `to` (clamped) */
export function moveId(list, id, to) {
  const a = list.filter((x) => x !== id);
  a.splice(Math.max(0, Math.min(to, a.length)), 0, id);
  return a;
}
/** clampFloat(x, y, w, view, head) — BASINS: 120 px of a floating window stays across the screen, its header below the top */
export function clampFloat(x, y, w, view, head = 44) {
  const keep = Math.min(120, w);
  return { x: Math.round(Math.max(keep - w, Math.min(view.width - keep, x))), y: Math.round(Math.max(0, Math.min(Math.max(0, view.height - head), y))) };
}
/** clampFloatTablet(x, y, w, h, vv, edge) — BASINS' touch-tablet clamp: the WHOLE floating window stays inside the
 *  visual viewport, `edge` px in.  vv = { width (the layout width), height (innerHeight), top (offsetTop), vh (its height) } */
export function clampFloatTablet(x, y, w, h, vv, edge = RACK.tabletEdge) {
  const top = Math.max(0, vv.top || 0), bottom = Math.min(vv.height, top + (vv.vh ?? vv.height));
  return { x: Math.round(Math.max(edge, Math.min(Math.max(edge, vv.width - w - edge), x))), y: Math.round(Math.max(top + edge, Math.min(Math.max(top + edge, bottom - h - edge), y))) };
}
/** detached(left, width, col, margin) — the carried window has cleared the column by `margin` on either side */
export const detached = (left, width, col, m = RACK.detach) => left > col.right + m || left + width < col.left - m;
/** peekSide({ x, width, left, right, current, near, hold }) — which hidden rack peeks.  left/right are the widths of
 *  the racks that have something to show (0 = none).  A pointer near an edge peeks that side; a peek already showing
 *  holds while the pointer stays over its rack plus `hold` (λWAVES' armed dismiss: only a peek this armed is its to end). */
export function peekSide({ x, width, left = 0, right = 0, current = '', near = RACK.peekNear, hold = RACK.peekHold }) {
  if (left > 0 && x <= near) return 'left';
  if (right > 0 && x >= width - near) return 'right';
  if (current === 'left' && left > 0 && x <= left + hold) return 'left';
  if (current === 'right' && right > 0 && x >= width - right - hold) return 'right';
  return '';
}
const hits = (a, b) => !!a && !!b && !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
/** dodgeSeat(seats, rect, current, home) — λWAVES modDodge: the home seat ('bottom' unless the user chose 'top' on the
 *  transport bar) unless the floating rect covers it, then the other one unless that is covered too, else stay.
 *  No rect (the window closed) is the home seat. */
export function dodgeSeat(seats, r, current = 'bottom', home = 'bottom') {
  const away = home === 'top' ? 'bottom' : 'top';
  if (!r || !hits(seats[home], r)) return home;
  if (!hits(seats[away], r)) return away;
  return current;
}
/** queueToggle(queue, id) — SHIFT-click adds a window to the queue, or takes it back out */
export const queueToggle = (q, id) => (q.includes(id) ? q.filter((x) => x !== id) : [...q, id]);
/** openOrder(queue) — every open PREPENDS, so the queue is replayed backwards and the rack reads in pick order (λWAVES) */
export const openOrder = (q) => q.slice().reverse();
/** favSlot(slots, n) — the first empty ☆ slot, else the oldest */
export function favSlot(m, n = RACK.favourites) {
  for (let i = 1; i <= n; i++) if (!m[i]) return i;
  let o = 1; for (let i = 2; i <= n; i++) if ((m[i].at || 0) < (m[o].at || 0)) o = i;
  return o;
}
const sideOf = (s) => (s === 'left' || s === 'L' ? 'left' : 'right');
/** readLayout(raw, known, retired) — the one layout shape, repaired: every field checked, unknown and repeated ids
 *  dropped.  Accepts λWAVES' and BASINS' records (side 'L'/'R', `closed`).  `retired` ({ oldId: heirId }, BASINS'
 *  RETIRED): an old id stands for its heir — unless the layout names the heir itself, when the old record is dropped.
 *  `nb` (the notebook's [w, h], BASINS / λWAVES) is kept when it is a size.  Never throws. */
export function readLayout(raw, known, retired) {
  const out = { v: 1, hidden: false, phoneShown: false, cards: [] };
  if (!raw || typeof raw !== 'object') return out;
  out.hidden = raw.hidden === true || raw.rackHidden === true; out.phoneShown = raw.phoneShown === true;
  if (Number.isFinite(raw.at)) out.at = raw.at;
  if (Array.isArray(raw.nb) && Number.isFinite(raw.nb[0]) && raw.nb[0] > 0) out.nb = [Math.round(raw.nb[0]), Number.isFinite(raw.nb[1]) ? Math.round(raw.nb[1]) : 0];
  const list = Array.isArray(raw.cards) ? raw.cards : [];
  const named = new Set(list.map((c) => c && c.id)), heirOf = (id) => (retired && Object.hasOwn(retired, id) && typeof retired[id] === 'string' ? retired[id] : null);
  const seen = new Set(), num = (v, f) => (Number.isFinite(v) ? Math.round(v) : f);
  for (const c of list) {
    if (!c || typeof c.id !== 'string') continue;
    const heir = heirOf(c.id); if (heir && named.has(heir)) continue;   // BASINS: the heir's own record wins
    const id = heir || c.id;
    if (seen.has(id) || (known && !known.has(id))) continue;
    seen.add(id);
    const f = c.float && typeof c.float === 'object' ? { x: num(c.float.x, 0), y: num(c.float.y, 0), w: Math.max(120, num(c.float.w, 300)),
      compact: c.float.compact === true, z: num(c.float.z, 0), index: Math.max(0, num(c.float.index, 0)) } : null;
    out.cards.push({ id, side: sideOf(c.side), open: typeof c.open === 'boolean' ? c.open : c.closed === false, folded: c.folded === true, off: c.off === true, float: f });
  }
  return out;
}
/** closedLayout(windows, { phoneShown, at }) — BASINS' reload record (createRack({ persist: 'closed' })): each window
 *  [{ id, side, open }] in registration order on its own side, open or closed, and nothing the hand arranged (no
 *  order, fold, float or hidden rack); readLayout reads it as any layout. */
export function closedLayout(windows, { phoneShown = false, at = Date.now() } = {}) {
  return { v: 1, at, hidden: false, phoneShown: !!phoneShown, cards: (windows || []).map((w) => ({ id: String(w.id), side: sideOf(w.side), open: !!w.open })) };
}
/** layoutLabel(layout, slot) — what a ☆ row says (λWAVES): the slot, how many windows, which racks, floating, the time */
export function layoutLabel(L, slot) {
  const open = L.cards.filter((c) => c.open), sides = new Set(open.map((c) => c.side)), fl = open.filter((c) => c.float).length;
  const d = new Date(L.at || Date.now());
  return slot + '  ·  ' + open.length + ' window' + (open.length === 1 ? '' : 's') + '  ·  ' + (sides.size > 1 ? 'both racks' : sides.has('left') ? 'left rack' : 'right rack')
    + (fl ? '  ·  ' + fl + ' floating' : '') + '  ·  ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}
/** localStore(key) — the default store: one JSON value in localStorage under `key`; a failing storage is a no-op */
export function localStore(key, view = globalThis) {
  const s = jsonStore(key, view);
  return { get: s.get, set: s.set };
}

/* ── THE RACK'S MOTION: BASINS' app/rack-motion.js createRackMotion, harvested (Josh, 2026-10-02: "Yes to basins
 *    animated drag and drop") ─────────────────────────────────────────────────────────────────────────────────────
 * It observes the cards, not the verbs: a ResizeObserver on every card's head and body, a MutationObserver on the
 * racks' membership and on the classes that change a card's layout (folded, closed, compact, floating, hidden).  Any
 * change — fold, open, close, content growing, a window dropped in or lifted out — is ONE refresh: the last layout's
 * VISUAL positions are rebuilt (a running motion included), the new layout is read, and
 *   · a card whose height changed animates its HEIGHT from the old to the new (`.rack-sizing` clips it meanwhile) —
 *     the one sanctioned layout animation in the kit (docs/MOTION-LAW.md, "the rack's cards");
 *   · every card that moved travels by transform from where it was SEEN to its new place (FLIP);
 *   · the card in the hand is held (hold/follow/release): it follows the pointer by `translate`, is never FLIPped,
 *     and settles into its slot on release.
 * BASINS' numbers: 320 ms, cubic-bezier(.22, 1, .36, 1) — the kit's --motion-structural and --ease-out, the same
 * values (core.css), read from the tokens.  Reduced motion, `off` and the flat tier (durations 0) jump.  Every
 * animation joins core/motion.js's registry (own), so one writer per element holds and settled() waits for it;
 * a change mid-motion starts from where the cards are seen, so a reversal lands exactly.  No loop: idle is zero. */
export function createRackMotion(hosts, view = globalThis) {
  let previous = new Map(), syncing = false, signature = '', held = null;
  const heights = new Map(), moves = new Map(), observed = new Map();
  const live = () => motionPolicy() === 'full' && timing().duration > 0;
  /* rack.css's values (--rack-motion, --rack-ease on [data-mir-rack]), the core's tokens when a page has no rack.css */
  const timing = () => {
    const cs = hosts[0] ? view.getComputedStyle(hosts[0]) : null, d = cs && cs.getPropertyValue('--rack-motion').trim(), e = cs && cs.getPropertyValue('--rack-ease').trim();
    return { duration: d ? parseDuration(d, motionToken('structural')) : motionToken('structural'), easing: e || motionToken('out') };
  };
  const cards = () => hosts.flatMap((h) => [...h.children].filter((c) => c.classList.contains('dev')));
  const visible = (c) => !c.hidden && !c.classList.contains('closed') && c.getClientRects().length && c.getBoundingClientRect().height > 0;
  const cancel = (map, c) => { const a = map.get(c); if (a) a.cancel(); map.delete(c); };
  const translation = (c) => {
    if (held && held.card === c) return { x: held.x, y: held.y };
    if (!moves.has(c)) return { x: 0, y: 0 };
    const cs = view.getComputedStyle(c), m = new view.DOMMatrixReadOnly(cs.transform), t = String(cs.translate).split(' ');
    return { x: m.m41 + (parseFloat(t[0]) || 0), y: m.m42 + (parseFloat(t[1]) || 0) };
  };
  const rectOf = (c) => {
    const h = c.parentElement, r = c.getBoundingClientRect(), hr = h.getBoundingClientRect();
    const t = held && held.card === c ? held : { x: 0, y: 0 };
    return { host: h, x: r.left - t.x - hr.left + h.scrollLeft, y: r.top - t.y - hr.top + h.scrollTop, height: r.height, width: r.width };
  };
  const screen = (r) => { const h = r.host, p = h.getBoundingClientRect(); return { x: p.left + r.x - h.scrollLeft, y: p.top + r.y - h.scrollTop }; };
  function animate(map, c, frames, sizing = false) {
    cancel(map, c);
    if (sizing) c.classList.add('rack-sizing');
    const a = c.animate(frames, timing());
    map.set(c, a); own(c, a);
    a.finished.then(() => { if (map.get(c) !== a) return; map.delete(c); if (sizing) c.classList.remove('rack-sizing'); }).catch(() => {});
  }
  function refresh() {
    if (syncing) return;
    const all = cards();
    const stamp = all.map((c) => [hosts.indexOf(c.parentElement), c.dataset.id, c.hidden, ['folded', 'closed', 'compact', 'floating'].filter((k) => c.classList.contains(k)).join(','),
      c.getBoundingClientRect().width, ...[...c.children].filter((n) => n.matches('.dev-head, .dev-body')).map((n) => n.getBoundingClientRect().height)].join(':')).join('|');
    if (stamp === signature) return;
    signature = stamp; syncing = true;
    /* the last layout, as it is SEEN now: a running move's offset and a part-done height included */
    const oldScreen = new Map(), oldHeights = new Map();
    for (const host of hosts) {
      let shift = 0;
      for (const [c, p] of previous) {
        if (p.host !== host) continue;
        const t = translation(c), pos = screen(p);
        oldScreen.set(c, { x: pos.x + t.x, y: pos.y + shift + t.y });
        const h = heights.has(c) ? c.getBoundingClientRect().height : p.height;
        oldHeights.set(c, h); shift += h - p.height;
      }
    }
    for (const c of heights.keys()) { cancel(heights, c); c.classList.remove('rack-sizing'); }
    for (const c of moves.keys()) cancel(moves, c);
    const next = new Map(all.filter(visible).map((c) => [c, rectOf(c)]));
    if (live()) {
      for (const [c, p] of next) {
        const old = previous.get(c), h = oldHeights.get(c);
        if (old && Math.abs(h - p.height) > 0.5 && Math.abs(old.width - p.width) < 0.5) animate(heights, c, [{ height: h + 'px' }, { height: p.height + 'px' }], true);
      }
      /* read after the height motions have started: the initial flow, so translation carries only the moves */
      for (const [c] of next) {
        if (held && held.card === c) continue;
        const from = oldScreen.get(c); if (!from) continue;
        const r = c.getBoundingClientRect(), dx = from.x - r.left, dy = from.y - r.top;
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) animate(moves, c, [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0px, 0px)' }]);
      }
    }
    previous = next;
    if (observed.size !== all.length || all.some((c) => !observed.has(c))) {
      attributes.disconnect();
      for (const [c, nodes] of observed) if (!all.includes(c)) { nodes.forEach((n) => sizes.unobserve(n)); observed.delete(c); }
      for (const c of all) {
        if (!observed.has(c)) { const nodes = [...c.children].filter((n) => n.matches('.dev-head, .dev-body')); nodes.forEach((n) => sizes.observe(n)); observed.set(c, nodes); }
        attributes.observe(c, { attributes: true, attributeOldValue: true, attributeFilter: ['class', 'hidden'] });
      }
    }
    syncing = false;
  }
  const sizes = new view.ResizeObserver(refresh);
  const attributes = new view.MutationObserver((records) => {
    /* only the classes that change a card's layout; not our own sizing flag, an entrance, a value, a power */
    if (records.some((r) => r.attributeName === 'hidden' || ['folded', 'closed', 'compact', 'floating'].some((k) =>
      (r.oldValue || '').split(' ').includes(k) !== r.target.classList.contains(k)))) refresh();
  });
  const membership = new view.MutationObserver(refresh);
  hosts.forEach((h) => membership.observe(h, { childList: true }));
  refresh();
  return {
    refresh,
    /** hold(card) — the hand takes it: no FLIP for it, its place is the hand's */
    hold(c) { cancel(moves, c); held = { card: c, x: 0, y: 0 }; },
    /** follow(card, x, y) — the card's top-left SEEN at (x, y); x undefined keeps it at its own column */
    follow(c, x, y) {
      if (!held || held.card !== c) return;
      const r = c.getBoundingClientRect();
      if (x !== undefined) held.x = x - (r.left - held.x);
      held.y = y - (r.top - held.y);
      setVar(c, 'translate', `${held.x}px ${held.y}px`);
    },
    /** release(card, settle) — the hand lets go: it travels from where it is seen into its slot (settle) or stays */
    release(c, settle = true) {
      if (!held || held.card !== c) return;
      const from = `${held.x}px ${held.y}px`;
      held = null; setVar(c, 'translate', null);
      signature = ''; refresh();
      if (settle && live()) animate(moves, c, [{ translate: from }, { translate: '0px 0px' }]);
    },
    get holding() { return held ? held.card : null; },
    destroy() {
      if (held) setVar(held.card, 'translate', null); held = null;
      sizes.disconnect(); attributes.disconnect(); membership.disconnect();
      for (const c of heights.keys()) { cancel(heights, c); c.classList.remove('rack-sizing'); }
      for (const c of moves.keys()) cancel(moves, c);
      previous.clear();
    },
  };
}

/* ── the rack ──────────────────────────────────────────────────────────────────────────────────────────────── */
/** createRack({ host, sides, key, store, favourites, transport, seats, phone, chrome, handle, onChange }) → api
 *    host        where the racks, the float layer and the chrome are appended (λWAVES/BASINS: #lab)
 *    sides       which racks exist: ['left', 'right'] (default) or one of them
 *    key, store  the layout's store: { get() → value | null, set(value) }; default localStorage under `key`
 *    favourites  ☆ slots (0: no ☆ button)
 *    transport   an element that gives way to a floating rect (dodge) and peeks with a hidden rack (optional)
 *    phone       () => boolean — the phone law (default: the kit's --phone sentinel, or body.phone)
 *    chrome      false: build no hide / + / ☆ buttons (the app drives the api itself)
 *    handle      'coarse' (default): the edge handle shows for a coarse pointer only; 'always'; 'never'
 *    look        'auto' (default): nodes the rack creates wear the kit's look (rack.css), nodes the app already had
 *                (#rack, #rackL, #floats, #rackAdd …, found by id) keep the app's; 'kit': the kit's look on both
 *    onChange    (layout) after every persisted change
 *    scrollbar   true: the scrollbar seated at the card column (shell/rack-scrollbar.js, BASINS'); default false
 *    tabletClamp true (default, BASINS): on a touch tablet a float is clamped fully inside the visual viewport
 *    retired     { oldId: heirId }: saved layouts that name an old window open its heir
 *    notebook    the notebook ({ size() → { w, h, custom } | [w, h], resize(w, h) }) or () => it: ☆ layouts keep its size
 *    persist     what a reload keeps: 'all' (default: every window's side, order, fold, float and the rack hidden) or
 *                'closed' (BASINS rack.js persist: only which windows are closed, and the phone rack shown; each window
 *                comes back on its own side, in registration order).  The ☆ layouts keep everything either way.
 *  An app that already has a rack adopts it in place: see docs/RACK.md "Adopting into an app that has a rack". */
export function createRack({ host = globalThis.document && document.body, sides = SIDES, key = 'mir.rack', store, favourites = RACK.favourites,
  transport = null, seats = { top: RACK.seatTop, bottom: RACK.seatBottom }, phone, chrome = true, handle = 'coarse', look = 'auto', onChange,
  scrollbar = false, tabletClamp = true, retired = null, notebook = null, persist: keep = 'all' } = {}) {
  const doc = host.ownerDocument, view = doc.defaultView, body = doc.body;
  const life = new AbortController(), on = { signal: life.signal }, passive = { passive: true, signal: life.signal };
  const S = store || localStore(key, view);
  const isPhone = phone || (() => body.classList.contains('phone') || (parseFloat(view.getComputedStyle(doc.documentElement).getPropertyValue('--phone')) || 0) >= 1);
  const made = [];                                                  // nodes this rack created, removed by destroy()
  /* ADOPTION: a node the app already has (BASINS' #rack, #rackL, #floats, #rackAdd …) is used AS IT IS — same element,
     same id, same classes, so every app rule and script that names it keeps working, and no second container is made.
     It gets the rack's behaviour hooks (data-side, data-mir-adopted) but not the kit's look classes, unless the app
     asks for the kit's look (`look: 'kit'`).  A node the rack creates wears the kit's look (rack.css). */
  const adopted = new Set();
  const take = (id, tag, cls) => {
    let n = doc.getElementById(id);
    if (!n) { n = el(tag, '', host); n.id = id; made.push(n); }
    else { adopted.add(n); n.dataset.mirAdopted = ''; }
    if (!adopted.has(n) || look === 'kit') for (const c of cls.split(' ')) n.classList.add(c);
    return n;
  };

  /* ── the DOM: the racks, the float layer, the grip, the chrome ── */
  const racks = {};
  for (const side of SIDES) if (sides.includes(side)) {
    const r = take(RACK_ID[side], 'div', 'mir-rack'); r.dataset.side = side; r.dataset.mirRack = ''; r.tabIndex = -1;
    r.setAttribute('role', 'region'); ariaLabel(r, side === 'left' ? 'the left rack' : 'the rack');   // tr: the RACK: the column of docked windows at the screen’s edge (not the SHELF, where notes are kept)
    racks[side] = r;
  }
  const rackOf = (side) => racks[side] || racks.right || racks.left;
  const isRack = (n) => !!n && (n === racks.left || n === racks.right);
  const motion = createRackMotion(Object.values(racks), view);       // BASINS' animated drag and drop (above)
  const floats = take('floats', 'div', 'mir-rack-floats');
  const grip = el('div', 'mir-rack-grip', host); grip.setAttribute('aria-hidden', 'true'); made.push(grip);
  const btn = (id, kind, text, label) => { const b = take(id, 'button', 'glass mir-rack-btn'); b.type = 'button'; b.dataset.rackBtn = kind; if (text) b.textContent = text; b.setAttribute('aria-label', label); b.title = label; return b; };
  const list = (id, kind) => { const l = take(id, 'div', 'glass mir-rack-list'); l.dataset.rackList = kind; l.hidden = true; l.setAttribute('role', 'menu'); return l; };
  let toggleBtn = null, addBtn = null, addList = null, favBtn = null, favList = null;
  if (chrome) {
    toggleBtn = btn('rackToggle', 'toggle', '◧', 'Hide or show the rack');
    addBtn = btn('rackAdd', 'add', '', 'Open a window'); chip(addBtn, 'plus', 'open a window'); addList = list('rackAddList', 'add');
    if (favourites > 0) { favBtn = btn('rackFav', 'fav', '☆', 'Save or load a window layout'); favList = list('rackFavList', 'fav'); }
  }
  const handles = handle === 'never' ? [] : Object.keys(racks).map((side) => {
    const h = el('button', 'mir-rack-handle', host); made.push(h);
    h.type = 'button'; h.dataset.side = side; h.dataset.when = handle; h.setAttribute('aria-label', 'Show the interface'); h.title = 'Show the interface'; h.dataset.keyAction = 'hide';   // the key shown is the table's (W19 K2)
    h.addEventListener('click', () => { setInterface(true); setHidden(false); }, on);
    return h;
  });
  /* the transport wears the kit's hide rule only beside the kit's racks: an app with its own racks hides its own transport */
  const kitLook = look === 'kit' || !Object.values(racks).some((r) => adopted.has(r));
  if (transport && kitLook) transport.classList.add('mir-rack-transport');

  /* ── the registry and its windows ── */
  const reg = new Map();                                             // id → { spec, dev, api, present }
  const floatState = new Map();                                      // id → { home: { side, index }, x, y, w, compact }
  const stack = [];                                                  // floating windows, back-most first
  let spanObs = null;
  let built = 0, started = false, saved = null, phoneOn = false, phoneMem = null, peek = '', trPeek = false, rackW = 0;

  const cards = (rk, all = false) => (rk ? [...rk.children].filter((c) => c.classList.contains('dev') && (all || (!c.hidden && !c.classList.contains('closed')))) : []);
  const isHidden = () => body.classList.contains('rack-hidden');
  const viewSize = () => ({ width: view.innerWidth, height: view.innerHeight });
  const call = (w, name, ...a) => { const f = w.spec[name]; if (typeof f === 'function') { try { f(...a, w.api); } catch (err) { console.warn('rack: ' + w.spec.id + '.' + name, err); } } };

  const activity = createWindowActivity({ body, rackIds: Object.values(racks).map((r) => r.id), onChange: presented });
  function presented() {
    for (const w of reg.values()) {
      if (!w.dev || !w.spec.onPresent) continue;
      const now = activity.canPresent(w.dev.root);
      if (now !== w.present) { w.present = now; call(w, 'onPresent', now); }
    }
  }

  /* the one save: coalesced to a frame, never mid-gesture */
  const save = () => { if (started) frame.coalesce('mir-rack:save', persist); };
  function persist() {
    if (G) return;
    const value = S.get(); const next = { ...(value && typeof value === 'object' ? value : {}), v: 1, layout: keep === 'closed' ? captureClosed() : capture() };
    S.set(next);
    if (onChange) onChange(next.layout);
  }

  /* ── build on first open ── */
  function build(id) {
    const w = reg.get(id); if (!w || w.dev) return w;
    const dev = device({ id, eyebrow: w.spec.title, status: w.spec.status || '', loadingMark: w.spec.loadingMark,
      onPower: (live) => { call(w, 'onPower', live); save(); } });
    w.dev = dev;
    dev.root.dataset.home = w.spec.side; dev.root.classList.add('closed');
    rackOf(w.spec.side).appendChild(dev.root);
    wire(w);
    try { if (w.spec.build) w.spec.build(dev.body, w.api); } catch (err) { console.warn('rack: build ' + id, err); }
    return w;
  }
  /** adopt(w, x) — take over a window the app ALREADY BUILT (BASINS builds every window eagerly with its own builder):
   *  x is device()'s return value (best: its fold / setOff are used) or the `.dev` element itself.  Nothing is rebuilt
   *  or moved; it keeps its rack, its place, its classes and its listeners. */
  let passing = false;                                               // a shim's own click on a header button, let through
  function adopt(w, x) {
    const root = x && x.nodeType === 1 ? x : x && x.root;
    if (!root) throw new Error('rack.register: `el` is a .dev element or a device() result');
    root.dataset.id = w.spec.id;
    const q = (sel) => root.querySelector(sel);
    const press = (sel, cls, v) => { if (root.classList.contains(cls) === !!v) return; const b = q(sel); if (!b) { root.classList.toggle(cls, !!v); return; } passing = true; try { b.click(); } finally { passing = false; } };
    w.dev = x.nodeType === 1 ? {
      root, body: q('.dev-body') || root,
      fold: (v) => press('.dev-fold', 'folded', v),
      setOff: (v) => press('.dev-power', 'off', v),
      get off() { return root.classList.contains('off'); },
      setStatus: (t) => { const st = q('.dev-stat'); if (st && st.textContent !== t) st.textContent = t; },
    } : x;
    if (!root.dataset.home) root.dataset.home = w.spec.side;
    if (w.spec.closed === true) root.classList.add('closed');           // BASINS' addWindow(dev, side, { closed: true })
    /* an adopted window that already floats is put on the float stack where it stands */
    if (root.classList.contains('floating')) {
      const r = root.getBoundingClientRect();
      floatState.set(w.spec.id, { home: { side: w.spec.side, index: 0 }, x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width) || 300, compact: root.classList.contains('compact') });
      raiseFloat(root);
    }
    /* power: an adopted window's own power button tells the rack after it has acted */
    const pw = q('.dev-power');
    if (pw) pw.addEventListener('click', () => { call(w, 'onPower', !root.classList.contains('off')); save(); }, on);
    wire(w);
    return w;
  }
  /** the rack's hands on a window, built or adopted: the header (pointer, keyboard), close / fold / pop / rail through
   *  the rack, the float raise, the window's api, and window-activity */
  function wire(w) {
    const id = w.spec.id, dev = w.dev, root = dev.root, head = root.querySelector('.dev-head') || root;
    /* the header: a handle for the hand (pointer pre-gesture) and for the keyboard */
    head.tabIndex = 0; head.setAttribute('aria-roledescription', 'rack window');
    head.setAttribute('aria-keyshortcuts', 'ArrowUp ArrowDown ArrowLeft ArrowRight Enter');
    head.addEventListener('pointerdown', headDown, on);
    head.addEventListener('keydown', headKey, on);
    /* close, fold and double-click go through the rack so the neighbours travel (flip) and the layout is kept */
    root.addEventListener('click', (e) => {
      if (passing) return;
      const b = e.target.closest && e.target.closest('button'); if (!b || !root.contains(b)) return;
      if (w.spec.card && !b.classList.contains('dev-fold')) return;   // an app card keeps its own buttons
      if (b.classList.contains('dev-close')) { e.stopPropagation(); close(id); }
      else if (b.classList.contains('dev-fold')) { e.stopPropagation(); fold(id); }
      else if (b.classList.contains('dev-pop')) { e.stopPropagation(); toggleFloat(id); }
      else if (b.classList.contains('dev-rail')) { e.stopPropagation(); setCompact(id, !root.classList.contains('compact')); }
    }, { capture: true, signal: life.signal });
    head.addEventListener('dblclick', (e) => { if (e.target.closest(PRESSABLE)) return; e.stopImmediatePropagation(); fold(id); }, { capture: true, signal: life.signal });
    root.addEventListener('pointerdown', () => { if (root.classList.contains('floating')) raiseFloat(root); }, { capture: true, signal: life.signal });
    popFace(root); railFace(root);
    w.api = {
      id, dev, root, body: dev.body,
      setStatus: (t, cls) => dev.setStatus(t, cls),
      canPresent: () => activity.canPresent(root),
      open: () => open(id), close: () => close(id), raise: () => raise(id),
      get isOpen() { return !root.classList.contains('closed'); },
      get floating() { return root.classList.contains('floating'); },
      get side() { return sideFor(root); },
    };
    built++;
    activity.track(root);
    return w;
  }
  function popFace(d) {
    const b = d.querySelector('.dev-pop'); if (!b) return;
    const out = d.classList.contains('floating');
    chip(b, out ? 'dock' : 'popOut', out ? 'dock this window back into the rack' : 'take this window off the rack');
    b.title = out ? 'Return this window to its rack' : 'Move this window onto the stage';
  }
  function railFace(d) {
    const b = d.querySelector('.dev-rail'); if (!b) return;
    const c = d.classList.contains('compact');
    chip(b, c ? 'expand' : 'compact', c ? 'give this window its full width back' : 'narrow this window to its rail');
    b.title = c ? 'Use the full window layout' : 'Use the compact window layout';
  }
  const sideFor = (root) => { const st = floatState.get(root.dataset.id); if (st) return st.home.side; if (root.dataset.phoneFrom) return root.dataset.phoneFrom; return root.parentElement && root.parentElement.dataset.side || root.dataset.home; };

  /* the entrance (BASINS basins-pane-enter): the neighbours make room (the rack's motion), the window rises 6 px into
     its seat — translate only, no fade */
  function enter(root) {
    if (motionPolicy() !== 'full' || typeof root.animate !== 'function') return;
    const cs = root.parentElement ? view.getComputedStyle(root.parentElement) : null, d = cs && cs.getPropertyValue('--rack-enter').trim(), e = cs && cs.getPropertyValue('--rack-enter-ease').trim();
    own(root, root.animate([{ translate: '0px 6px' }, { translate: '0px 0px' }], { duration: d ? parseDuration(d, motionToken('ui')) : motionToken('ui'), easing: e || motionToken('out') }));   // BASINS' 220 ms on its own curve (rack.css)
  }

  /** open(id, { side, index }) — build it if it never was, then into a rack (default: the one it was in, at the top) */
  function open(id, o = {}) {
    const w = reg.get(id); if (!w) return false;
    const first = !w.dev; build(id);
    const root = w.dev.root;
    if (!root.classList.contains('closed')) { if (o.side || o.index !== undefined) move(id, o); return true; }
    if (root.classList.contains('floating')) { root.classList.remove('closed'); raiseFloat(root); }
    else {
      const rk = phoneOn ? rackOf('right') : o.side ? rackOf(o.side) : isRack(root.parentElement) ? root.parentElement : rackOf(w.spec.side);
      if (phoneOn && o.side === 'left') root.dataset.phoneFrom = 'left';
      root.classList.remove('closed'); const list = cards(rk).filter((c) => c !== root); rk.insertBefore(root, list[Math.max(0, Math.min(o.index ?? 0, list.length))] || null);
      enter(root);
    }
    root.dispatchEvent(new CustomEvent('devopen', { bubbles: true }));
    call(w, 'onOpen'); if (!first) call(w, 'onWake');
    save(); return true;
  }
  /** close(id) — out of the rack (the neighbours close the gap); the window sleeps but keeps what it built */
  function close(id) {
    const w = reg.get(id); if (!w || !w.dev) return false;
    const root = w.dev.root; if (root.classList.contains('closed')) return true;
    if (G && G.card === root) drg.cancel();
    const rk = root.parentElement;
    root.classList.add('closed');
    root.dispatchEvent(new CustomEvent('devclose', { bubbles: true }));
    call(w, 'onClose'); call(w, 'onSleep');
    save(); return true;
  }
  const toggle = (id) => (isOpen(id) ? close(id) : open(id));
  const isOpen = (id) => { const w = reg.get(id); return !!(w && w.dev && !w.dev.root.classList.contains('closed')); };
  /** fold(id, on?) — the body folds away and the neighbours travel up; the window keeps running (EARTH: FOLD keeps drawing) */
  function fold(id, want) {
    const w = reg.get(id); if (!w || !w.dev) return false;
    const root = w.dev.root, now = root.classList.contains('folded'), next = want === undefined ? !now : !!want;
    if (next === now) return true;
    w.dev.fold(next);
    call(w, 'onFold', next); save(); return true;
  }
  /** raise(id) — open it, unfold it, show the rack, and bring it to the top of its rack (or the front, floating) */
  function raise(id) {
    const w = reg.get(id); if (!w) return false;
    open(id); const root = w.dev.root;
    if (root.classList.contains('folded')) fold(id, false);
    if (root.classList.contains('floating')) { raiseFloat(root); if (root.classList.contains('compact')) setCompact(id, false); }
    else { const rk = root.parentElement; if (cards(rk)[0] !== root) rk.insertBefore(root, cards(rk)[0] || null); rk.scrollTop = 0; setHidden(false); }
    save(); return true;
  }
  /** move(id, { side, index }) — to a place in a rack (the keyboard's move, and a host's) */
  function move(id, { side, index } = {}) {
    const w = reg.get(id); if (!w || !w.dev || w.dev.root.classList.contains('floating')) return false;
    const root = w.dev.root, from = root.parentElement, to = phoneOn ? rackOf('right') : side ? rackOf(side) : from;
    const list = cards(to).filter((c) => c !== root), at = Math.max(0, Math.min(index ?? 0, list.length));
    if (from === to && cards(to).indexOf(root) === at) return true;
    to.insertBefore(root, list[at] || null); motion.refresh();
    save(); return true;
  }

  /* ── floating ── */
  /* ONE RAISE STACK: a floating card's z is its place in the kit's one window stack (window/window.js registerWindow), so a
     card and a kit window in the same float layer never tie, and a press puts either on top.  `stack` keeps the rack's own
     order of its floating cards (the saved layout's z), as before. */
  const stacked = new Map();                                          // floating card → its registerWindow entry
  function raiseFloat(root) {
    const i = stack.indexOf(root); if (i >= 0) stack.splice(i, 1);
    stack.push(root);
    const s = stacked.get(root); if (s) s.raise(); else stacked.set(root, registerWindow({ root }));
    return true;
  }
  function unstack(root) { const s = stacked.get(root); if (s) { s.leave(); stacked.delete(root); } }
  /* the touch tablet (BASINS isTouchTablet): a coarse pointer wider than 700 px that is not the phone */
  const tabletMq = tabletClamp && view.matchMedia ? view.matchMedia(`(any-pointer: coarse) and (min-width: ${RACK.tabletMin}px)`) : null;
  const isTablet = () => !!tabletMq && tabletMq.matches && !phoneOn && !body.classList.contains('phone');
  /** clampAt(root, x, y, w) — the one clamp for a float: on a touch tablet the whole window inside the visual viewport
   *  (its drawn size), elsewhere 120 px across and the header below the top */
  function clampAt(root, x, y, w) {
    if (!isTablet()) return clampFloat(x, y, w, viewSize());
    const r = root.getBoundingClientRect(), vv = view.visualViewport;
    return clampFloatTablet(x, y, r.width, r.height, { width: view.innerWidth, height: view.innerHeight, top: vv ? vv.offsetTop : 0, vh: vv ? vv.height : view.innerHeight });
  }
  const placeFloat = (root, st) => { const c = clampAt(root, st.x, st.y, st.w); st.x = c.x; st.y = c.y; setVar(root, 'left', c.x + 'px'); setVar(root, 'top', c.y + 'px'); };
  const restOf = (rk) => { const r = rk.getBoundingClientRect(), m = new view.DOMMatrixReadOnly(view.getComputedStyle(rk).transform); return { left: r.left - m.m41, top: r.top - m.m42, width: r.width, height: r.height }; };
  /** the DOM change of floating a window, no motion (the drag and the pop chip each bring their own) */
  function floatNow(id, at = {}) {
    const w = reg.get(id), root = w.dev.root, rk = root.parentElement;
    const r = root.getBoundingClientRect(), list = cards(rk);
    const home = at.home || { side: sideFor(root), index: Math.max(0, list.indexOf(root)) };
    const wd = Math.round(at.w || r.width || 300), v = viewSize();
    let x = at.x ?? (r.width ? (home.side === 'left' ? r.left + wd + 24 : r.left - wd - 24) : (v.width - wd) / 2);
    let y = at.y ?? (r.height ? r.top : 72);
    if (at.y === undefined) { const h = Math.min(r.height || 320, v.height - 16); y = Math.max(8, Math.min(y, v.height - h - 8)); }
    const st = { home, x: Math.round(x), y: Math.round(y), w: wd, compact: false };
    floatState.set(id, st);
    setVar(root, '--float-w', wd + 'px'); root.classList.add('floating'); floats.appendChild(root);
    placeFloat(root, st); raiseFloat(root);
    if (at.compact) setCompact(id, true);
    popFace(root); railFace(root);
    return st;
  }
  /** float(id, at) — take a window off its rack onto the stage */
  function float(id, at) {
    const w = reg.get(id); if (!w || !w.dev || phoneOn) return false;
    const root = w.dev.root; if (root.classList.contains('floating')) { raiseFloat(root); return true; }
    floatNow(id, at || {});                                           // BASINS popOut: it comes off at once; the rack closes the gap
    save(); return true;
  }
  /** the DOM change of docking a floating window: into `side` at `index`, or home */
  function dockNow(id, drop) {
    const w = reg.get(id), root = w.dev.root, st = floatState.get(id); if (!st) return;
    const rk = rackOf(phoneOn ? 'right' : drop && drop.side || st.home.side);
    const list = cards(rk).filter((c) => c !== root), at = drop && Number.isFinite(drop.index) ? drop.index : st.home.index;
    root.classList.remove('floating', 'compact');
    for (const p of ['left', 'top', 'z-index', '--float-w', 'translate']) setVar(root, p, null);
    const i = stack.indexOf(root); if (i >= 0) stack.splice(i, 1);
    unstack(root);
    if (phoneOn && st.home.side === 'left') root.dataset.phoneFrom = 'left';
    rk.insertBefore(root, list[Math.max(0, Math.min(at, list.length))] || null);
    floatState.delete(id);
    popFace(root); railFace(root);
  }
  /** dock(id, { side, index }) — put a floating window back (home, unless told where) */
  function dock(id, drop) {
    const w = reg.get(id); if (!w || !w.dev || !floatState.has(id)) return false;
    dockNow(id, drop);                                                // BASINS dockWindow: it lands at once; the rack makes room
    save(); return true;
  }
  const toggleFloat = (id) => (floatState.has(id) ? dock(id) : float(id));
  function setCompact(id, v) {
    const w = reg.get(id), st = floatState.get(id); if (!w || !w.dev || !st) return false;
    st.compact = !!v; w.dev.root.classList.toggle('compact', !!v); railFace(w.dev.root); save(); return true;
  }
  function dockAll(remember) {
    const kept = {};
    for (const root of stack.slice()) { const id = root.dataset.id, st = floatState.get(id); if (remember) kept[id] = { ...st, home: { ...st.home }, z: stack.indexOf(root) }; dockNow(id); }
    return kept;
  }

  /* ── THE GESTURE: one drag on the grip; a header press is handed to it once the hand has moved ── */
  let pre = null, G = null, pending = null;
  const landProx = createProximity({ layer: host, reach: 160, capture: 0 });
  const edgeProx = createProximity({ layer: host, reach: 96, capture: 0 });
  function headDown(e) {
    if (e.button !== 0 || !e.isPrimary || G || pre || pending) return;
    if (e.target.closest(PRESSABLE)) return;
    const card = e.currentTarget.closest('.dev'); if (!card || card.classList.contains('closed')) return;
    pre = { id: e.pointerId, x: e.clientX, y: e.clientY, card, type: e.pointerType, timer: 0 };
    if (e.pointerType === 'touch') pre.timer = view.setTimeout(() => { if (pre) { pre.card.classList.add('dragging'); forward(); } }, RACK.longPress);
  }
  const preMove = (e) => {
    if (!pre || e.pointerId !== pre.id) return;
    const d = Math.hypot(e.clientX - pre.x, e.clientY - pre.y);
    if (pre.type === 'touch') { if (d > 10) { view.clearTimeout(pre.timer); pre = null; } return; }   // a finger that slides first is not a lift
    if (d >= RACK.slop) forward();
  };
  const preEnd = (e) => { if (pre && e.pointerId === pre.id) { view.clearTimeout(pre.timer); pre = null; } };
  view.addEventListener('pointermove', preMove, passive);
  view.addEventListener('pointerup', preEnd, passive);
  view.addEventListener('pointercancel', preEnd, passive);
  function forward() {
    const p = pre; pre = null; view.clearTimeout(p.timer); pending = p;
    grip.dispatchEvent(new view.PointerEvent('pointerdown', { pointerId: p.id, pointerType: p.type, isPrimary: true, button: 0, buttons: 1,
      clientX: p.x, clientY: p.y, cancelable: true, bubbles: false }));
  }
  /* a forwarded press that never became a drag (a finger lifted after the hold): nothing moved, put the lift down */
  const unpend = () => { if (pending && !G) { pending.card.classList.remove('dragging'); pending = null; } };
  grip.addEventListener('pointerup', unpend, on); grip.addEventListener('pointercancel', unpend, on); grip.addEventListener('lostpointercapture', unpend, on);

  /* the columns a carried window can land in: each rack that is shown (or peeking), at its RESTING place */
  function columns() {
    if (phoneOn) return [];
    const out = [];
    for (const [side, rk] of Object.entries(racks)) {
      if (isHidden() && peek !== side) continue;
      const r = restOf(rk), cs = view.getComputedStyle(rk);
      const left = r.left + (parseFloat(cs.paddingLeft) || 0), right = r.left + r.width - (parseFloat(cs.paddingRight) || 0);
      if (right - left < 2) continue;
      out.push({ side, rk, left, right, top: r.top, bottom: r.top + r.height, rest: r });
    }
    return out;
  }
  /* a rack's windows as layout boxes (offsetTop: no transform, no running flip) */
  const boxes = (col, except) => cards(col.rk).filter((c) => c !== except).map((c) => ({ top: col.rest.top + c.offsetTop - col.rk.scrollTop, height: c.offsetHeight, el: c }));

  const drg = drag(grip, { slop: 1,
    onStart() {
      const p = pending; pending = null; if (!p) return;
      const card = p.card, id = card.dataset.id, r = card.getBoundingClientRect(), floating = card.classList.contains('floating');
      const head = card.querySelector('.dev-head') || card;
      G = { card, id, mode: floating ? 'float' : 'reorder', ax: p.x - r.left, ay: p.y - r.top, w: r.width, h: r.height, cols: columns(),
        headH: head.offsetHeight || 0,                              // THE TITLE BAR DECIDES (Josh 2026-10-02): its middle is the probe
        origin: floating ? { float: { ...floatState.get(id) } } : { rk: card.parentElement, next: card.nextElementSibling } };
      card.classList.add('dragging');
      if (floating) raiseFloat(card); else motion.hold(card);
    },
    onMove(s) { if (!G) return; if (G.mode === 'reorder') reorderMove(s); else floatMove(s); },
    onEnd() {
      const g = G; if (!g) return;
      G = null; g.card.classList.remove('dragging');
      if (g.mode === 'reorder') {
        edgeProx.end(); landProx.end();
        motion.release(g.card);                                       // BASINS: it settles from the hand into its slot
      } else {
        edgeProx.end();
        const m = landProx.end(), st = floatState.get(g.id);
        if (m && m.captured) {
          dockNow(g.id, { side: m.captured.id, index: m.captured.index });   // BASINS: it lands in the slot; the rack makes room
        } else if (st && g.at) {                                       // ONE layout commit: left/top land, the transform goes
          st.x = g.at.x; st.y = g.at.y; setVar(g.card, 'translate', null); placeFloat(g.card, st);
        }
      }
      save();
    },
    onCancel() {
      const g = G; G = null; pending = null;
      edgeProx.cancel(); landProx.cancel();
      if (!g) return;
      g.card.classList.remove('dragging');
      const card = g.card;
      if (g.origin.rk) {                                               // it began in a rack: back to its rack and its place
        const rk = g.origin.rk, next = g.origin.next && g.origin.next.parentElement === rk ? g.origin.next : null;
        if (floatState.has(g.id)) { dockNow(g.id, { side: rk.dataset.side, index: 0 }); motion.hold(card); }
        rk.insertBefore(card, next); motion.refresh();
        motion.release(card);                                         // BASINS endDrag on cancel: back in its place, settling there
      } else setVar(card, 'translate', null);                         // it began floating: its left/top were never written
      save();
    },
  });

  function reorderMove(s) {
    const card = G.card, rk = card.parentElement, col = G.cols.find((c) => c.rk === rk) || { rk, rest: restOf(rk), left: 0, right: 0, top: 0, bottom: 0 };
    const list = boxes(col);
    const at = list.findIndex((b) => b.el === card), bar = s.y - G.ay + G.headH / 2;   // the middle of the title bar in the hand
    const to = reorderIndex(list, at, bar);
    if (to !== at && at >= 0) {
      rk.insertBefore(card, to < at ? list[to].el : list[to].el.nextElementSibling);
      motion.refresh();                                               // BASINS: the others make room, travelling (FLIP)
    }
    /* the held window follows the hand vertically at its own x; its layout place is the slot it will land in */
    const top = col.rest.top + card.offsetTop - rk.scrollTop, left = col.rest.left + card.offsetLeft;
    motion.follow(card, undefined, s.y - G.ay);
    const proj = s.x - G.ax;
    if (!phoneOn && col.right > col.left && detached(proj, G.w, col)) { toFloat(s, proj); return; }
    landProx.update({ x: s.x, y: s.y }, [{ id: col.side || 'home', rect: { left, top, width: G.w, height: card.offsetHeight }, hit: { left: col.left, top: 0, width: col.right - col.left, height: view.innerHeight }, shape: 'rect' }]);
    if (col.right > col.left) {
      const leftward = col.side !== 'left', x = leftward ? col.left - RACK.detach : col.right + RACK.detach;
      const trailing = leftward ? proj + G.w : proj;                 // the edge that must clear the line for the window to come loose
      edgeProx.update({ x: trailing, y: s.y }, [{ id: 'detach', rect: { left: x - RACK.slot / 2, top: col.top, width: RACK.slot, height: col.bottom - col.top }, hit: { left: x, top: col.top, width: 0, height: col.bottom - col.top }, shape: 'slot' }]);
    }
  }
  function toFloat(s, proj) {
    const card = G.card, rk = card.parentElement;
    edgeProx.cancel(); landProx.cancel();
    motion.release(card, false);                                      // BASINS: let go without settling, then off the rack
    floatNow(G.id, { x: proj, y: s.y - G.ay, w: G.w, home: { side: rk.dataset.side, index: Math.max(0, cards(rk).indexOf(card)) } });
    G.mode = 'float'; G.cols = columns();
    floatMove(s);
  }
  function floatMove(s) {
    const st = floatState.get(G.id); if (!st) return;
    const want = clampAt(G.card, s.x - G.ax, s.y - G.ay, st.w);
    G.at = want;
    setVar(G.card, 'translate', `${want.x - st.x}px ${want.y - st.y}px`);
    const targets = G.cols.map((col) => {
      const bx = boxes(col, G.card), index = insertionIndex(bx, s.y - G.ay + G.headH / 2);   // the title bar decides here too
      return { id: col.side, index, rect: slotRect(col, bx, index), hit: { left: col.left, top: 0, width: col.right - col.left, height: view.innerHeight }, shape: 'slot' };
    });
    landProx.update({ x: s.x, y: s.y }, targets);
  }

  /* ── the keyboard on a header ── */
  function headKey(e) {
    if (e.target !== e.currentTarget || e.ctrlKey || e.metaKey || e.altKey) return;
    const root = e.currentTarget.closest('.dev'), id = root.dataset.id, floating = root.classList.contains('floating');
    const k = e.key; let done = true;
    if (k === 'Enter') { if (floating) dock(id); else float(id); }
    else if (floating && k.startsWith('Arrow')) {
      const st = floatState.get(id), d = RACK.nudge;
      st.x += k === 'ArrowLeft' ? -d : k === 'ArrowRight' ? d : 0; st.y += k === 'ArrowUp' ? -d : k === 'ArrowDown' ? d : 0;
      placeFloat(root, st); save();
    } else if (k === 'ArrowUp' || k === 'ArrowDown') {
      const i = cards(root.parentElement).indexOf(root); move(id, { index: Math.max(0, i + (k === 'ArrowUp' ? -1 : 1)) });
    } else if (k === 'ArrowLeft' || k === 'ArrowRight') {
      const side = k === 'ArrowLeft' ? 'left' : 'right';
      if (racks[side] && racks[side] !== root.parentElement && !phoneOn) move(id, { side, index: Math.min(cards(root.parentElement).indexOf(root), cards(racks[side]).length) });
    } else done = false;
    if (!done) return;
    e.preventDefault();
    const head = root.querySelector('.dev-head'); if (doc.activeElement !== head) head.focus({ preventScroll: true });
  }

  /* ── hide, peek, the interface, the edge handle ── */
  function setPeek(side) {
    if (side === peek) return;
    peek = side;
    body.classList.toggle('rack-peek', !!side); body.classList.toggle('rack-peek-left', side === 'left'); body.classList.toggle('rack-peek-right', side === 'right');
    if (G) G.cols = columns();
  }
  /** setHidden(v) — THE hide path, for the key, the menu, a touch and a test alike: one class, read by window-activity */
  function setHidden(v, { keep = true } = {}) {
    const want = !!v; if (want === isHidden()) return want;
    body.classList.toggle('rack-hidden', want); setPeek(''); body.classList.remove('transport-peek'); trPeek = false;
    if (toggleBtn) toggleBtn.setAttribute('aria-pressed', String(want));
    if (keep && phoneOn) phoneShown = !want;
    if (keep) save();
    return want;
  }
  let phoneShown = false;
  /** setInterface(shown) — H: the whole interface out of paint (display: none), and the edge handle the way back */
  function setInterface(shown) { body.classList.toggle('ui-hidden', !shown); if (shown) setPeek(''); return !!shown; }
  const readW = () => { const r = racks.right || racks.left; rackW = r ? r.offsetWidth : 0; return rackW; };
  const hasShown = (side) => !!racks[side] && (!!G || cards(racks[side]).length > 0);
  view.addEventListener('pointermove', (e) => {
    if (!isHidden() || phoneOn || body.classList.contains('ui-hidden')) { if (peek) setPeek(''); return; }
    if (e.pointerType === 'touch' && !G) return;
    const w = rackW || readW();
    let side = peekSide({ x: e.clientX, width: view.innerWidth, left: hasShown('left') ? w : 0, right: hasShown('right') ? w : 0, current: peek });
    if (G && G.mode === 'reorder') side = G.card.parentElement.dataset.side;
    setPeek(side);
    if (transport) {                                                  // λWAVES wave 108: the transport peeks around its own seat
      const b = trSeatRect(), x = e.clientX, y = e.clientY;
      const near = x >= b.left - 80 && x <= b.right + 80 && y >= b.top - 60 && y <= b.bottom + 60;
      const inside = x >= b.left - 120 && x <= b.right + 120 && y >= b.top - 120 && y <= b.bottom + 120;
      if (near && !trPeek) { trPeek = true; body.classList.add('transport-peek'); } else if (!inside && trPeek) { trPeek = false; body.classList.remove('transport-peek'); }
    }
  }, passive);
  view.addEventListener('blur', () => setPeek(''), on);
  const refit = () => { for (const root of stack) { const st = floatState.get(root.dataset.id); if (st) placeFloat(root, st); } };
  view.addEventListener('resize', () => { rackW = 0; trBox = null; refit(); syncPhone(); }, passive);
  if (tabletMq && view.visualViewport) view.visualViewport.addEventListener('resize', refit, passive);   // BASINS fitFloats: the keyboard and the pinch move the visual viewport
  view.addEventListener('orientationchange', () => syncPhone(), passive);

  /* ── the transport's dodge: two seats, a sequence that waits on each animation (no timers) ── */
  let seat = 'bottom', home = 'bottom', run = null, lastRect = null, trBox = null;
  /* the bar's size, kept only when it was read on the stage at rest (not docked, not in a work bar, its tempo panel shut): a bar measured in the
     rack's TRANSPORT window, a work lane or with its panel open is not the size of the seat it will take (W20 TR) */
  const trSize = () => {
    if (trBox || !transport) return trBox;
    const b = { w: transport.offsetWidth || 560, h: transport.offsetHeight || 46 };
    if (!transport.matches('.docked, .tempo-open, [data-bar="work"]')) trBox = b;
    return b;
  };
  function seatRects() {
    const { w, h } = trSize(), vw = view.innerWidth, vh = view.innerHeight, left = (vw - w) / 2;
    return { bottom: { left, right: left + w, top: vh - seats.bottom - h, bottom: vh - seats.bottom }, top: { left, right: left + w, top: seats.top, bottom: seats.top + h } };
  }
  const trSeatRect = () => seatRects()[seat];
  /** dodge(rect | null) — a floating thing reports where it is; the transport takes the seat it does not cover */
  function dodge(r) {
    lastRect = r ? { left: r.left, top: r.top, right: r.right ?? r.left + r.width, bottom: r.bottom ?? r.top + r.height } : null;
    if (!transport || run) return seat;
    const want = view.matchMedia('(max-width: 860px)').matches ? 'top' : dodgeSeat(seatRects(), lastRect, seat, home);
    if (want === seat) return seat;
    const policy = motionPolicy(), shift = (s) => `0px ${s === 'bottom' ? 96 : -96}px`;
    const anim = (from, to, ease) => (policy === 'off' || typeof transport.animate !== 'function' ? null
      : transport.animate(policy === 'reduced' ? [{ opacity: from.opacity }, { opacity: to.opacity }] : [from, to], { duration: motionToken('ui'), easing: motionToken(ease), fill: 'forwards' }));
    let out = null, back = null;
    const used = lastRect;
    run = sequence([
      () => (out = anim({ translate: '0px 0px', opacity: 1 }, { translate: shift(seat), opacity: 0 }, 'in')),
      () => { seat = want; setAttr(transport, 'data-seat', want); if (out) out.cancel(); return (back = anim({ translate: shift(want), opacity: 0 }, { translate: '0px 0px', opacity: 1 }, 'out')); },
    ]);
    run.finished.then(() => { if (out) out.cancel(); if (back) back.cancel(); run = null; if (lastRect !== used) dodge(lastRect); });
    return want;
  }
  if (transport) setAttr(transport, 'data-seat', seat);
  /** setHome(seat) — the transport's resting seat, the user's choice on the bar (shell/transport.js): 'bottom' | 'top' */
  function setHome(s) {
    home = s === 'top' ? 'top' : 'bottom'; trBox = null;
    if (run) run.finished.then(() => dodge(lastRect)); else dodge(lastRect);
    return home;
  }

  /* ── the + menu (the SHIFT-queue) and the ☆ menu (favourite layouts) ── */
  let queue = [];
  const titleOf = (w) => w.spec.title;
  function renumber() {
    for (const b of addList.querySelectorAll('.mb-item')) {
      const k = queue.indexOf(b.dataset.win); b.classList.toggle('queued', k >= 0);
      let n = b.querySelector('.mb-num');
      if (k < 0) { if (n) n.remove(); continue; }
      if (!n) n = el('span', 'mb-num', b);
      n.textContent = String(k + 1);
    }
  }
  const addShown = (v) => { if (!addList) return; addList.hidden = !v; addBtn.setAttribute('aria-expanded', String(!!v)); if (!v) { queue = []; } };
  const favShown = (v) => { if (!favList) return; favList.hidden = !v; favBtn.setAttribute('aria-expanded', String(!!v)); };
  function flushQueue() {
    if (!queue.length) return false;
    const ids = openOrder(queue); addShown(false);
    for (const id of ids) open(id);
    return true;
  }
  function lastFavIds() {
    const m = favs(); let best = null;
    for (const k of Object.keys(m)) if (m[k] && (!best || (m[k].at || 0) > (best.at || 0))) best = m[k];
    return best ? new Set(best.cards.filter((c) => c.open).map((c) => c.id)) : null;
  }
  function drawAdd() {
    addList.innerHTML = ''; queue = [];
    const closed = [...reg.values()].filter((w) => !w.spec.card && !isOpen(w.spec.id)).sort((a, b) => titleOf(a).localeCompare(titleOf(b), undefined, { sensitivity: 'base' }));
    if (!closed.length) el('div', 'rack-add-none', addList, 'every window is open — × on a window closes it');
    const fav = lastFavIds();
    for (const w of closed) {
      const it = el('button', 'mb-item', addList); it.type = 'button'; it.dataset.win = w.spec.id; it.setAttribute('role', 'menuitem');
      if (w.spec.glyph && hasGlyph(w.spec.glyph)) it.appendChild(glyphEl(w.spec.glyph, 'mb-glyph', 14));
      el('span', 'mb-lbl', it, '⊕  ' + w.spec.title);
      /* the drawn solid star (glyph.js starFill: "is one"), never a typed ★ (Josh's call 18, 2026-10-07) */
      if (fav && fav.has(w.spec.id)) { const st = el('span', 'mb-fav', it); st.appendChild(glyphEl('starFill', 'gly gly-starFill', 10)); st.title = 'In the most recently saved layout'; st.setAttribute('aria-label', 'in the saved favourite layout'); }
      it.title = (w.spec.hint ? w.spec.title + '  ·  ' + w.spec.hint : w.spec.title) + '  ·  SHIFT-click to queue several; they open in the order you picked them when you let SHIFT go';
      it.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (ev.shiftKey) { queue = queueToggle(queue, w.spec.id); renumber(); return; }
        addShown(false); open(w.spec.id);
      });
    }
  }
  function drawFav() {
    favList.innerHTML = '';
    const saved = layouts();
    const s = el('button', 'mb-item', favList, '☆  SAVE LAYOUT' + (saved.length >= favourites ? '  ·  replaces the oldest' : '')); s.type = 'button'; s.setAttribute('role', 'menuitem');
    s.title = 'Save the current window arrangement';
    s.addEventListener('click', (ev) => { ev.stopPropagation(); saveLayout(); drawFav(); });
    el('div', 'rack-fav-head', favList, saved.length ? 'LOAD LAYOUT' : 'nothing saved yet');
    for (const L of saved) {
      const it = el('button', 'mb-item', favList, '⊙  ' + L.label); it.type = 'button'; it.setAttribute('role', 'menuitem'); it.title = 'Restore this window layout';
      const x = el('span', 'fav-x', it, '×'); x.title = 'forget this layout';
      it.addEventListener('click', (ev) => { ev.stopPropagation(); if (ev.target === x) { forgetLayout(L.slot); drawFav(); return; } loadLayout(L.slot); favShown(false); });
    }
  }
  if (toggleBtn) toggleBtn.addEventListener('click', () => setHidden(!isHidden()), on);
  if (addBtn) addBtn.addEventListener('click', (e) => { e.stopPropagation(); if (!addList.hidden) { addShown(false); return; } favShown(false); drawAdd(); addShown(true); }, on);
  if (favBtn) favBtn.addEventListener('click', (e) => { e.stopPropagation(); if (!favList.hidden) { favShown(false); return; } addShown(false); drawFav(); favShown(true); }, on);
  view.addEventListener('keyup', (e) => { if (e.key === 'Shift' && addList && !addList.hidden) flushQueue(); }, on);
  view.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    if (addList && !addList.hidden) { e.preventDefault(); addShown(false); addBtn.focus(); } else if (favList && !favList.hidden) { e.preventDefault(); favShown(false); favBtn.focus(); }
  }, on);
  doc.addEventListener('pointerdown', (e) => {
    if (addList && !addList.hidden && !addList.contains(e.target) && !addBtn.contains(e.target)) addShown(false);
    if (favList && !favList.hidden && !favList.contains(e.target) && !favBtn.contains(e.target)) favShown(false);
  }, { capture: true, signal: life.signal });

  /* ── the layout: capture, apply, the ☆ slots ── */
  function capture() {
    const out = [];
    const rec = (root, side, f) => out.push({ id: root.dataset.id, side, open: !root.classList.contains('closed'), folded: root.classList.contains('folded'), off: root.classList.contains('off'), float: f });
    for (const side of SIDES) if (racks[side]) for (const root of cards(racks[side], true)) rec(root, root.dataset.phoneFrom || side, null);
    for (const root of stack) { const st = floatState.get(root.dataset.id); if (st) rec(root, st.home.side, { x: st.x, y: st.y, w: st.w, compact: !!st.compact, z: stack.indexOf(root), index: st.home.index }); }
    const L = { v: 1, at: Date.now(), hidden: phoneOn ? !!(phoneMem && phoneMem.hidden) : isHidden(), phoneShown, cards: out };
    const nb = nbSize(); if (nb) L.nb = nb;                            // λWAVES rack.js:3551, BASINS captureLayout: a layout keeps the notebook's size
    return L;
  }
  /** BASINS' reload record (persist: 'closed'): which windows are open or closed, each on its own side in registration
   *  order, and the phone rack shown — nothing about where the hand put them */
  const captureClosed = () => closedLayout([...reg.values()].filter((w) => !w.spec.card).map((w) => ({ id: w.spec.id, side: w.spec.side, open: isOpen(w.spec.id) })), { phoneShown });
  /* the notebook, when the app gave one: its size as [w, h] (null at its default size, as BASINS' unset style), and its resize */
  const nbOf = () => { try { return typeof notebook === 'function' ? notebook() : notebook; } catch { return null; } };
  function nbSize() {
    const n = nbOf(); if (!n || typeof n.size !== 'function') return null;
    const z = n.size(); if (Array.isArray(z)) return z[0] ? [Math.round(z[0]), Math.round(z[1] || 0)] : null;
    return z && z.w && z.custom !== false ? [Math.round(z.w), Math.round(z.h || 0)] : null;
  }
  const known = () => new Set([...reg.keys(), ...appCards().keys()]);
  /** apply(layout) — arrange every registered window as the layout says (a retired id opens its heir; an id it does not
   *  know is ignored), and size the notebook as the layout kept it (BASINS applyLayout) */
  const apply = (raw) => arrange(raw, true);
  function arrange(raw, sizeNotebook) {
    const L = readLayout(raw, known(), retired);
    if (sizeNotebook && L.nb) { const n = nbOf(); if (n && typeof n.resize === 'function') { try { n.resize(L.nb[0], L.nb[1]); } catch (err) { console.warn('rack: notebook size', err); } } }   // λWAVES rack.js:3612
    dockAll(false);
    const named = new Set();
    for (const c of L.cards) {
      named.add(c.id);
      const w = reg.get(c.id);
      /* an app card (registered with `card: true`, or a .dev the app put in a rack and never registered): it keeps its
         PLACE in the order; its state (hidden, closed, docked) is the app's */
      if (!w || w.spec.card) { const n = w ? w.dev.root : appCards().get(c.id); if (n && !n.classList.contains('floating')) (phoneOn ? rackOf('right') : rackOf(c.side)).appendChild(n); continue; }
      if (!c.open && !w.dev) continue;                                 // closed and never built: it stays a name
      build(c.id);
      const root = w.dev.root, rk = phoneOn ? rackOf('right') : rackOf(c.side);
      if (phoneOn) { if (c.side === 'left') root.dataset.phoneFrom = 'left'; else delete root.dataset.phoneFrom; }
      const wasClosed = root.classList.contains('closed');
      root.classList.toggle('closed', !c.open); rk.appendChild(root);
      if (root.classList.contains('folded') !== c.folded) w.dev.fold(c.folded);
      if (w.dev.off !== c.off) w.dev.setOff(c.off);
      if (wasClosed && c.open) { call(w, 'onOpen'); } else if (!wasClosed && !c.open) { call(w, 'onClose'); call(w, 'onSleep'); }
    }
    const fl = L.cards.filter((c) => c.float && c.open).sort((a, b) => a.float.z - b.float.z);
    if (phoneOn) phoneMem = { ...(phoneMem || {}), floats: Object.fromEntries(fl.map((c) => [c.id, { ...c.float, home: { side: c.side, index: c.float.index } }])) };
    else for (const c of fl) floatNow(c.id, { x: c.float.x, y: c.float.y, w: c.float.w, compact: c.float.compact, home: { side: c.side, index: c.float.index } });
    phoneShown = L.phoneShown;
    if (phoneOn) phoneMem = { ...(phoneMem || {}), hidden: L.hidden }; else setHidden(L.hidden, { keep: false });
    save();
    return named;
  }
  /** the .dev elements standing in the racks that are not registered windows (an app's own cards), by id */
  function appCards() {
    const m = new Map();
    for (const rk of Object.values(racks)) for (const n of cards(rk, true)) if (n.dataset.id && !reg.has(n.dataset.id)) m.set(n.dataset.id, n);
    return m;
  }
  const favs = () => { const v = S.get(); return v && v.favs && typeof v.favs === 'object' ? v.favs : {}; };
  const writeFavs = (m) => { const v = S.get(); S.set({ ...(v && typeof v === 'object' ? v : {}), v: 1, favs: m }); };
  function layouts() {
    const m = favs();
    return Object.keys(m).map(Number).filter((n) => n >= 1 && n <= favourites && m[n]).sort((a, b) => a - b)
      .map((slot) => ({ slot, label: layoutLabel(readLayout(m[slot], null, retired), slot), at: m[slot].at }));
  }
  function saveLayout(slot) { const m = favs(); const n = +slot || favSlot(m, favourites); m[n] = capture(); writeFavs(m); return n; }
  function loadLayout(slot) { const m = favs(); if (!m[slot]) return false; apply(m[slot]); return true; }
  function forgetLayout(slot) { const m = favs(); delete m[slot]; writeFavs(m); return true; }

  /** resetLayout() — RESET LAYOUT (BASINS layout.resetLayout, its Settings button): every float docked home, every
   *  window opened, powered on and unfolded, every window back in its home rack (the right rack's order kept, the left
   *  rack's windows that are not left-homed appended to it, then every left-homed window into the left rack, in that
   *  order), and the rack shown.  An app card (`card: true`, or a .dev the app never registered) keeps its place and
   *  its state: it is the app's (BASINS docks its transport card itself). */
  function resetLayout() {
    if (G) drg.cancel();
    dockAll(false);
    if (phoneOn) phoneMem = { ...(phoneMem || {}), floats: {} };
    const app = (d) => { const w = reg.get(d.dataset.id); return !w || w.spec.card; };
    for (const w of reg.values()) {
      if (w.spec.card) continue;
      build(w.spec.id); const root = w.dev.root;
      if (root.classList.contains('closed')) { root.classList.remove('closed'); call(w, 'onOpen'); }   // as apply() opens one
      if (w.dev.off) w.dev.setOff(false);
      if (root.classList.contains('folded')) { w.dev.fold(false); call(w, 'onFold', false); }
    }
    const R = rackOf('right'), Lr = racks.left && racks.left !== R ? racks.left : null;
    if (Lr) for (const d of cards(Lr, true)) if (!app(d)) R.appendChild(d);
    for (const d of cards(R, true)) {
      if (app(d)) continue;
      const left = sideOf(d.dataset.home) === 'left';
      if (phoneOn) { if (left && racks.left) d.dataset.phoneFrom = 'left'; else delete d.dataset.phoneFrom; }
      else if (left && Lr) Lr.appendChild(d);
    }
    setHidden(false);
    save(); return true;
  }

  /* ── the phone: one rack, nothing floats, the crossing is reversible (λWAVES waves 51, 59) ── */
  function syncPhone() {
    const now = !!isPhone();
    if (now === phoneOn) return now;
    if (G) drg.cancel();
    phoneOn = now; body.classList.toggle('phone', now); setPeek('');
    if (now) {
      phoneMem = { floats: dockAll(true), hidden: isHidden() };
      if (racks.left && racks.right && racks.left !== racks.right) for (const d of cards(racks.left, true).reverse()) { d.dataset.phoneFrom = 'left'; racks.right.insertBefore(d, racks.right.firstElementChild); }
      setHidden(!phoneShown, { keep: false });
    } else {
      const mem = phoneMem || {}; phoneMem = null;
      if (racks.left && racks.right) for (const d of [...racks.right.querySelectorAll('.dev[data-phone-from="left"]')]) { delete d.dataset.phoneFrom; racks.left.appendChild(d); }
      setHidden(!!mem.hidden, { keep: false });
      if (mem.floats) for (const id of Object.keys(mem.floats).sort((a, b) => (mem.floats[a].z || 0) - (mem.floats[b].z || 0))) if (isOpen(id)) floatNow(id, mem.floats[id]);
    }
    save();
    return now;
  }

  /* ── the WINDOW menu, as data for createMenubar({ menus }) ── */
  /** windowMenu({ rack }) — one row per registered window: ↑ raises an open one, ⊕ opens a closed one; `rack: true`
   *  adds a separator and HIDE / SHOW the rack.  A row is [label, run, disabled, hint] (shell/menubar.js). */
  function windowMenu({ rack: rackRow = false, rackKey = '', keyOf = null } = {}) {
    /* a card's key is the key table's chord for its `action` (keyOf(action) → text: createApp passes keys.menuKey), never a typed string (W19 K6) */
    const keyText = (spec) => (spec.action && keyOf ? keyOf(spec.action) || '' : '');
    const rows = [...reg.values()].filter((w) => !w.spec.card).map((w) => [(isOpen(w.spec.id) ? '↑  ' : '⊕  ') + w.spec.title + (keyText(w.spec) ? '\t' + keyText(w.spec) : ''),
      () => raise(w.spec.id), false, w.spec.hint || (isOpen(w.spec.id) ? 'bring it to the top of its rack' : 'open it')]);
    if (rackRow) rows.push(null, ['HIDE / SHOW the rack' + (rackKey ? '\t' + rackKey : ''), () => setHidden(!isHidden())]);
    return rows;
  }

  /** register({ id, title, side, build, … }) → id — a window by name; nothing is built until it first opens.
   *  { el }: a window the app ALREADY BUILT (device()'s result or its .dev) is taken over in place, never rebuilt;
   *  { closed: true } with it starts it closed.  { eager: true }: built now (closed until the layout or `open` opens it).
   *  { card: true } with { el }: an app card that is not a window (BASINS' transport card): it keeps its place in the
   *  order and in saved layouts, drags and folds with the rest, and is in neither the + list nor the WINDOW menu. */
  function register(spec) {
    if (!spec || typeof spec.id !== 'string' || reg.has(spec.id)) throw new Error('rack.register: a new string id is required');
    /* an adopted window's home is the rack it is standing in, unless the app says otherwise */
    const node = spec.el && (spec.el.nodeType === 1 ? spec.el : spec.el.root);
    const inSide = node && isRack(node.parentElement) ? node.parentElement.dataset.side : undefined;
    const w = { spec: { title: spec.id.toUpperCase(), ...spec, side: sideOf(spec.side ?? inSide ?? 'right') }, dev: null, api: null, present: null };
    reg.set(spec.id, w);
    if (spec.el) { adopt(w, spec.el); return spec.id; }                 // already built: taken over, never rebuilt
    if (spec.eager) build(spec.id);                                  // built now, opened by the layout or its `open`
    if (started) {                                                   // registered late: its saved record (or its default) applies now
      const c = saved && saved.cards.find((x) => x.id === spec.id);
      if (c ? c.open : spec.open) { open(spec.id, { side: c ? c.side : undefined }); if (c && c.folded) fold(spec.id, true); }
    }
    return spec.id;
  }
  /** start() — apply the saved layout (or each window's `open` default) and begin keeping it.  Runs by itself after the
   *  task that created the rack, so windows registered in that task are all there; calling it sooner is allowed. */
  function start() {
    if (started) return api;
    const raw = S.get();
    saved = readLayout(raw && raw.layout, known(), retired);
    syncPhone();
    /* the reload: the notebook keeps its own size (only a ☆ load or a host's apply() resizes it) */
    if (raw && raw.layout) {
      const listed = new Set(saved.cards.map((c) => c.id));
      arrange({ ...saved, cards: [...saved.cards, ...[...reg.values()].filter((w) => !listed.has(w.spec.id) && w.spec.open).map((w) => ({ id: w.spec.id, side: w.spec.side, open: true }))] }, false);
    } else arrange({ v: 1, hidden: isHidden(), cards: [...reg.values()].filter((w) => w.spec.open && !w.spec.el).map((w) => ({ id: w.spec.id, side: w.spec.side, open: true })) }, false);   // an adopted window is already where the app put it
    started = true; save();
    return api;
  }
  queueMicrotask(() => { if (!life.signal.aborted) start(); });

  const api = {
    register, start, open, close, toggle, isOpen, raise, fold, move, float, dock, toggleFloat, setCompact,
    setHidden, setInterface, dodge, setHome, windowMenu,
    get hidden() { return isHidden(); },
    toggleHidden: () => setHidden(!isHidden()),
    get peek() { return peek; },
    get phone() { return phoneOn; },
    get seat() { return seat; },
    /** how many windows have been built (laziness, visible) */
    get built() { return built; },
    get registered() { return [...reg.keys()]; },
    isBuilt: (id) => !!(reg.get(id) && reg.get(id).dev),
    /** windows() — every registered window, in registration order: [{ id, title, side, open, built, floating, folded }] */
    windows: () => [...reg.values()].map((w) => ({ id: w.spec.id, card: !!w.spec.card, title: w.spec.title, side: (w.dev && w.dev.root.parentElement && w.dev.root.parentElement.dataset.side) || w.spec.side, open: isOpen(w.spec.id), built: !!w.dev,
      floating: !!(w.dev && w.dev.root.classList.contains('floating')), folded: !!(w.dev && w.dev.root.classList.contains('folded')) })),
    /** keepClear() — the rects a new floating window should not land on: each rack showing a window, and the transport */
    keepClear() {
      const out = [];
      for (const side of SIDES) { const rk = racks[side]; if (rk && cards(rk).length && !(isHidden() && peek !== side)) out.push(rk.getBoundingClientRect()); }
      if (transport && transport.isConnected && transport.offsetWidth) out.push(transport.getBoundingClientRect());
      return out.map((r) => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom }));
    },
    /** spec(id) — a registered window's own description ({ id, title, side, glyph, key, hint, … }), for the transport's openers */
    spec: (id) => (reg.get(id) ? { ...reg.get(id).spec } : null),
    window: (id) => (reg.get(id) && reg.get(id).api) || null,
    order: (side) => cards(rackOf(side)).map((c) => c.dataset.id),
    floating: () => stack.map((r) => r.dataset.id),
    floatOf: (id) => (floatState.has(id) ? { ...floatState.get(id), home: { ...floatState.get(id).home } } : null),
    capture, apply, layouts, saveLayout, loadLayout, forgetLayout, resetLayout,
    /** the scrollbar seated at the card column (`scrollbar: true`), or null */
    get scrollbar() { return bars; },
    addMenu: { open: () => { if (addBtn && addList.hidden) addBtn.click(); return !!addBtn; }, close: () => { addShown(false); return true; }, get shown() { return !!addList && !addList.hidden; }, get queued() { return queue.slice(); }, commit: flushQueue },
    favMenu: { open: () => { if (favBtn && favList.hidden) favBtn.click(); return !!favBtn; }, close: () => { favShown(false); return true; }, get shown() { return !!favList && !favList.hidden; } },
    get dragging() { return !!G; },
    cancelDrag: () => drg.cancel(),
    activity,
    /** span() — THE dock span for every docking window on the page: dock.js observeSpan on these two racks (BASINS'
     *  rack-bounds: the shadow gutter out, an empty / hidden / phone / narrow rack absent).  Made once, on first ask. */
    span() { if (!spanObs) spanObs = observeSpan({ left: racks.left || null, right: racks.right || null, view }); return spanObs; },
    el: { racks: { ...racks }, floats, grip, toggle: toggleBtn, add: addBtn, addList, fav: favBtn, favList, handles: handles.slice() },
    sync: syncPhone,
    destroy() {
      if (bars) { bars.destroy(); bars = null; }
      for (const [root, id] of flashes) { view.clearTimeout(id); root.classList.remove('copied'); } flashes.clear();
      if (spanObs) spanObs.destroy();
      motion.destroy(); drg.cancel(); drg.destroy(); landProx.destroy(); edgeProx.destroy(); life.abort(); activity.disconnect();
      if (run) run.cancel(); frame.cancel('mir-rack:save');
      for (const w of reg.values()) if (w.dev) w.dev.root.remove();
      for (const n of made) n.remove();
      body.classList.remove('rack-peek', 'rack-peek-left', 'rack-peek-right', 'transport-peek');
      if (transport) { transport.classList.remove('mir-rack-transport'); transport.removeAttribute('data-seat'); }
      for (const root of [...stacked.keys()]) unstack(root);
      reg.clear(); floatState.clear(); stack.length = 0;
    },
  };
  /* BASINS installs its scrollbars with the rack; they follow the page's one dock span through a rack's slide */
  let bars = scrollbar ? createRackScrollbars({ host, racks: Object.values(racks), span: api.span(), view }) : null;
  return api;
}
