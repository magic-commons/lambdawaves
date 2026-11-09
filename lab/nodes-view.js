/* lab/nodes-view.js — NODES' one VIEW (iteration 020 X0, split out of lab/nodes.js; the model is there).  Built twice over one graph: kind
 * 'win' (the MIR window: the free ground — it pans; a card moves by its title bar; the wires are one SVG layer) and kind 'card' (the rack
 * card: the chain as a column, no pan, no drag).  STAGE IN → the nodes → STAGE OUT; THE DEFAULT GRAPH IS EMPTY and says so in one faint line.
 * 038 N1 THE + MENU IS THE KIT'S: contextMenu under the +, on the page (its plate, its blur, never clipped): a search line (typed: the matches,
 * Enter adds the first, Escape closes), the GROUPS (each a submenu: an item is its icon + its name + its cost mark, HEAVY as 019), GRAPHS ›.
 * Icons: the one table's `node<Type>` glyphs (lab/icons.js, 021 V2; the sprite retired).
 * 020 X1 THE GROUND (the window only; the rack column never zooms or selects): ctrl/⌘ + wheel and a pinch zoom 0.5–2× about the pointer
 * (`scale` on the plane with the pan; the wires, the ports and the dot grid follow), FIT (the button beside +, Home) fits the cards with a
 * 24 px margin; a click on a title selects (shift adds), shift + drag on the empty ground draws a box (a plain drag still pans), Ctrl-A all,
 * Escape none; a selected title drags the whole selection; arrows nudge 1 px (shift 10).  THE KEYS ARE THE GROUND'S: they fire only with the
 * ground focused (tabindex 0) and stop there, so the kit's one key table never sees them — Delete · Ctrl-D · M · Tab / Shift-A · Home ·
 * Ctrl-Z / Ctrl-Shift-Z (NODES' own ring, lab/nodes-undo.js).
 * 020 X2 THE CARD: the chevron (H) folds a card to its bar and its PREVIEW strip, FOLD ALL / UNFOLD ALL at the head (039 X8: one word family); a double-click
 * on the title RENAMES it (Enter / Escape; empty = the type's name); every TABLE and MATRIX card draws a 128 × 10 strip — a grey ramp and a
 * hue ramp through the node's OWN transfer (nodes-compile.js transfer(): the compiler's fn / matrix), redrawn when its values move; the
 * right-click menus (a card's, the ground's) and TIDY (the cards back in one column, in list order).
 * 020 X3 THE FLAGS: an eye on every bar (VIEW HERE: the stage shows the chain up to it, the foot says "viewing 3 of 6"; the lit eye again =
 * STAGE OUT), SOLO (S, a second lit mark: this node alone), BYPASS ALL (the head's power, key \: the foot says "graph off").
 * 038 N4 THE WIRE HAS A KNOB (FL Studio's Patcher): on each wire into a node a round HANDLE at its middle — the node's MIX (its FADE; a LAYER's or a
 * SHADER's own 0–1 MIX or AMOUNT), turned by a vertical drag or the wheel, its arc the value; a press selects the wire (Delete unplugs it, the arrows
 * turn it); a card's PORT carried onto a wire moves its node into that wire (and plugs it in), an in-port let go on the empty ground unplugs it.
 * 038 N5 THE MINIMAP (the window): the graph in small at the ground's bottom-right — the cards, the view as an accent rect; a drag looks round, the
 * wheel zooms about the view's centre; hidden while every card is in view.
 * 020 X4 FADE AND MASK: a foot fold on every card but a LAYER — FADE · MASK · SOFT (MIR controls; FADE and SOFT are modulation targets); the
 * fold is lit while either is off home; the cost mark follows the compiler (a masked LEVELS reads ···).
 *   createView(parent, kind, M) → { view, widget(id, k), paint(q, k, v, shown), foot(), sync(), place() }   M: the model's door (nodes.js) */
import { el, label, ariaLabel, chip, onContext, placeholder } from './mir/kit.js'; import { contextMenu } from './mir/shell/menubar.js'; import { openDialog } from './mir/shell/dialog.js';
import { nodeBody, FOOT } from './node-types.js';
import { transfer, ownRun, over } from './nodes-compile.js';
import { frame } from './mir/core/frame.js'; import { glyphEl } from './mir/glyph.js'; import { nodeGlyph } from './icons.js';
import { cssZoom } from './mir/core/zoom.js';
/** keysAt(el) — the acts of the graph whose ground `el` is (the `nodes.*` rows run them while it has the focus), or null */
const GROUNDS = new WeakMap(); export const keysAt = (n) => (n && GROUNDS.get(n)) || null;

const AT = { in: [65, 16] };                                         // STAGE IN's first-run place; the nodes stack under it, STAGE OUT under the last
const SPAN = 250;                                                    // the column's width, centred in a view that has no pan of its own yet
const GAP = 36;
const NOTE = 'Grades the screen only — pictures and films are untouched.';
const MARK = { table: '·', matrix: '·', prim: '···', layer: '··', shader: '····' };   // THE COST IS ON THE CARD: · folds for free, ·· a layer, ··· a pass, ···· a GPU pass (024 S)
/** 038 N1 · the + menu's groups, in order: [id, its word, its glyph, the classes it takes (else [id])] — a kind is in `T.group` (else its class);
 *  a group with no kind is not shown.  038 P9 THE FULL NODE AND THE ONE-KNOB NODE: the full nodes (COLOUR, TONE) first, then every one-knob TABLE and
 *  MATRIX kind in one group, as Josh put it ("the full node vs the simple 1-knob nodes"); a kind with `menu: false` (the old LEVELS) opens, never offered */
const GROUPS = [['colour', 'COLOUR', 'nodeColor'], ['tone', 'TONE', 'nodeTable'], ['one', 'ONE-KNOB', 'nodeKnob', ['table', 'matrix']], ['prim', 'PASSES', 'nodePrim'],
  ['layer', 'LAYERS', 'nodeLayer'], ['shader', 'SHADERS', 'nodeShader']];
const markOf = (q, T) => MARK[!over(T) && ownRun(q, T) ? 'prim' : T.cls];
const NS = 'http://www.w3.org/2000/svg';
const hueAt = (h) => [Math.abs(h * 6 - 3) - 1, 2 - Math.abs(h * 6 - 2), 2 - Math.abs(h * 6 - 4)].map((x) => Math.min(1, Math.max(0, x)));
const ZOOM = [0.5, 2], clampZ = (z) => Math.min(ZOOM[1], Math.max(ZOOM[0], z));
/** a node type's glyph (021 V2: the one table, lab/icons.js `node<Type>` — the sprite retired), first or last in `parent` */
const icon = (parent, name, first) => { const s = glyphEl(nodeGlyph(name), 'nodes-ico', 14); if (!s) return null; if (first) parent.prepend(s); else parent.appendChild(s); return s; };

/** a press-and-drag on `handle`: start() → the base, move(base, dx, dy), end() — the pointer captured, a cancel ends it too */
const grab = (handle, ok, start, move, end) => handle.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 || !ok(e)) return;
  e.preventDefault(); handle.setPointerCapture(e.pointerId);
  const x0 = e.clientX, y0 = e.clientY, base = start(e), u = cssZoom(handle);   // 036 K2: the hand in the window's px (UI SCALE)
  const mv = (ev) => move(base, (ev.clientX - x0) / u, (ev.clientY - y0) / u);
  const up = () => { for (const [t, f] of [['pointermove', mv], ['pointerup', up], ['pointercancel', up]]) handle.removeEventListener(t, f); end(base); };
  for (const [t, f] of [['pointermove', mv], ['pointerup', up], ['pointercancel', up]]) handle.addEventListener(t, f);
});

export function createView(parent, kind, M) {
  const W = kind === 'win', T = M.TYPES;
  const ground = el('div', 'nodes-ground', parent), plane = el('div', 'nodes-plane', ground);
  const svg = plane.appendChild(document.createElementNS(NS, 'svg')); svg.setAttribute('class', 'nodes-wires');
  const empty = el('div', 'nodes-empty', plane); label(empty, 'Hit + to add a node');
  /* 038 N8 · A CARD THAT GROWS PUSHES THE CARDS BELOW (the window: its cards are placed, not flowed): a card that grows — its FADE · MASK · TARGET fold,
     its body unfolded — moves the cards under it (overlapping its width) down until the gap is GAP again, kept as a nudge; no card is covered */
  const ro = new ResizeObserver((es) => { if (W) { let pushed = false; for (const e of es) { const c = e.target; if (c === ground) continue; const h = c.offsetHeight; if (c.h0 !== undefined && h > c.h0 && clear(c)) pushed = true; c.h0 = h; } if (pushed) moved(true); } wires(); });
  const cards = {}, sel = new Set();
  const hands = el('div', 'nodes-hands', plane), H = new Map(), P = new Map();   // 038 N4: the wires' handles and paths, by their downstream node
  let wsel = null;                                                   // the selected wire: its downstream node's id
  let map = null, held = false;                                      // 038 N5: the minimap (the window's), and a hand on it (its frame held)
  let pan = [0, 0], z = 1;
  /** the view: the pan (px) and the zoom; the dot grid follows both */
  const setPan = (p, zz = z) => { pan = p; z = zz; plane.style.translate = p[0] + 'px ' + p[1] + 'px'; plane.style.scale = z;
    ground.style.backgroundPosition = p[0] + 'px ' + p[1] + 'px'; ground.style.backgroundSize = 22 * z + 'px ' + 22 * z + 'px'; drawMap(); };
  const keep = () => M.put({ pan: { ...(M.rec().pan || {}), [kind]: pan }, ...(W ? { zoom: z } : {}) });
  /** zoom to zz about the ground point p (px): the plane point under it stays */
  const zoomAt = (zz, p, base = pan, z0 = z) => { zz = clampZ(zz); setPan([p[0] - ((p[0] - base[0]) * zz) / z0, p[1] - ((p[1] - base[1]) * zz) / z0], zz); };
  const local = (e) => { const r = ground.getBoundingClientRect(), u = cssZoom(ground); return [(e.clientX - r.left) / u, (e.clientY - r.top) / u]; };   // 036 K2: own px
  /** FIT: the cards' bounding box in the ground, a 24 px margin, the zoom clamped */
  function fit() {
    const B = Object.values(cards).map(({ c }) => [c.offsetLeft, c.offsetTop, c.offsetLeft + c.offsetWidth, c.offsetTop + c.offsetHeight]);
    const x0 = Math.min(...B.map((b) => b[0])), y0 = Math.min(...B.map((b) => b[1])), x1 = Math.max(...B.map((b) => b[2])), y1 = Math.max(...B.map((b) => b[3]));
    const gw = ground.clientWidth, gh = ground.clientHeight, zz = clampZ(Math.min((gw - 48) / (x1 - x0), (gh - 48) / (y1 - y0)));
    setPan([(gw - (x1 - x0) * zz) / 2 - x0 * zz, (gh - (y1 - y0) * zz) / 2 - y0 * zz], zz); keep();
  }
  const paintSel = () => { for (const [id, n] of Object.entries(cards)) { n.c.classList.toggle('sel', sel.has(id)); if (W && id !== 'in' && id !== 'out') M.editing(id, 'sel', sel.has(id)); }   // 040 N1: a selected node is edited
    for (const [id, h] of H) h.classList.toggle('sel', id === wsel); for (const [id, p] of P) p.classList.toggle('sel', id === wsel); };
  const pick = (ids, add) => { if (!add) sel.clear(); for (const id of ids) sel.add(id); wsel = null; paintSel(); };
  const pickWire = (id) => { sel.clear(); wsel = id; paintSel(); };
  const xy = (c) => [parseFloat(c.style.left) || 0, parseFloat(c.style.top) || 0];
  const clear = (c) => { const [l, t] = xy(c), r = l + c.offsetWidth, below = Object.values(cards).map((n) => n.c).filter((o) => o !== c && xy(o)[1] > t && xy(o)[0] < r && xy(o)[0] + o.offsetWidth > l);
    if (!below.length) return false; const push = t + c.offsetHeight + GAP - Math.min(...below.map((o) => xy(o)[1])); if (push <= 0) return false;
    for (const o of below) o.style.top = xy(o)[1] + push + 'px'; return true; };
  const at = () => Object.fromEntries(M.list().filter((q) => cards[q.id]).map((q) => [q.id, xy(cards[q.id].c)]));
  /** a card moved: every node takes the place it shows (the model re-sorts the list by top → bottom) */
  const moved = (nudge, plug) => M.moved(at(), { in: xy(cards.in.c), out: xy(cards.out.c) }, nudge, plug);   // plug: a node plugged in by the move (038 N4)
  const node = (id, title, ins, outs, glyph, mark) => {
    const c = el('div', 'nodes-card', plane); c.dataset.node = id;
    const bar = el('div', 'nodes-title', c); icon(bar, glyph); const name = label(el('span', 'nodes-name', bar), title); if (mark) el('i', 'nodes-mark', bar, mark);
    for (const [has, side] of [[ins, 'in'], [outs, 'out']]) if (has) { const pt = el('i', 'nodes-port ' + side, c);
      if (W && id !== 'in' && id !== 'out') { pt.classList.add('live'); pt.title = side === 'in' ? 'drag onto a wire: the node goes there · off: unplugs' : 'drag onto a wire: the node goes there';
        pt.addEventListener('pointerdown', (e) => portDrag(e, id, side)); } }
    /* a press on a title selects it (shift adds or takes it out) and drags the selection with it; STAGE IN / OUT drag alone */
    let t0 = -1e9;                                                  // a second press within 350 ms is a double-click: RENAME
    if (W) grab(bar, (e) => !e.target.closest('button, input'), (e) => {
      ground.focus({ preventScroll: true });
      if (id === 'in' || id === 'out') return { g: [[c, xy(c)]] };
      if (e.timeStamp - t0 < 350) { renameAt(id); return { g: [] }; } t0 = e.timeStamp;
      if (e.shiftKey && sel.has(id)) { sel.delete(id); paintSel(); return { g: [] }; }
      if (!sel.has(id)) pick([id], e.shiftKey);
      return { g: [...sel].map((i) => [cards[i].c, xy(cards[i].c)]) };
    }, (b, dx, dy) => { b.on = true; for (const [n, p] of b.g) { n.style.left = p[0] + dx / z + 'px'; n.style.top = p[1] + dy / z + 'px'; } wires(); }, (b) => { if (b.on) moved(); });
    ro.observe(c);
    return cards[id] = { c, bar, name, body: el('div', 'nodes-body', c) };
  };
  label(node('in', 'STAGE IN', false, true, 'in').body, 'the stage picture');
  label(node('out', 'STAGE OUT', true, false, 'out').body, 'the screen');
  /** a node's card: its bar (the chevron, its icon, the title, the cost mark, ⏻ MUTE (the record's bypass), × REMOVE), the PREVIEW strip of a
      TABLE or MATRIX node, and its body (CURVES, or the type's knobs).  036 P3 (Josh: "use the 'x' for the real delete and use a power symbol for
      mute effect"): the kit's `power` (BYPASS ALL's glyph) mutes, the kit's plain `close` × removes */
  function make(q) {
    const t = T[q.type], n = node(q.id, t.label, true, true, q.type, MARK[t.cls]);
    n.c.dataset.type = q.type; n.c.title = t.hint || '';
    /* 040 N1 · the node is EDITED while its card is under the pointer or holds the focus (the stage's focal handle shows, lab/node-focus.js) */
    n.c.addEventListener('pointerenter', () => M.editing(q.id, kind + ':hover', true)); n.c.addEventListener('pointerleave', () => M.editing(q.id, kind + ':hover', false));
    n.c.addEventListener('focusin', () => M.editing(q.id, kind + ':focus', true)); n.c.addEventListener('focusout', (e) => { if (!n.c.contains(e.relatedTarget)) M.editing(q.id, kind + ':focus', false); });
    const v = el('button', 'nodes-chev', null); v.type = 'button'; chip(v, 'chevronDown', 'FOLD OR UNFOLD'); n.bar.prepend(v); v.addEventListener('click', () => M.setFold(q.id, !q.fold));
    if (!W) n.name.addEventListener('dblclick', () => renameAt(q.id));
    if (t.cls === 'table' || t.cls === 'matrix') { n.strip = el('canvas', 'nodes-strip' + (t.draw ? ' nodes-drawn' : '')); n.strip.width = 128; n.strip.height = 10; n.c.insertBefore(n.strip, n.body); api.strip(q); }
    const eye = el('button', 'nodes-eye', n.bar); eye.type = 'button'; chip(eye, 'eye', 'VIEW HERE'); eye.addEventListener('click', () => M.setView(q.id));
    const so = el('button', 'nodes-solo', n.bar); so.type = 'button'; chip(so, 'solo', 'SOLO'); so.addEventListener('click', () => M.setSolo(q.id));
    const x = el('button', 'nodes-x', n.bar); x.type = 'button'; chip(x, 'power', 'MUTE NODE'); x.addEventListener('click', () => M.setBypass(q.id, !q.bypass));
    const b = el('button', 'nodes-rm', n.bar); b.type = 'button'; chip(b, 'close', 'REMOVE NODE'); b.addEventListener('click', () => M.remove(q.id));
    if (q.type === 'curves') n.view = M.curvesIn(n.body);
    else { n.body.classList.add('nodes-knobs', 'row', 'fit'); n.ctl = nodeBody(n.body, q, t, { idOf: (k) => M.ID(q, k), hand: (k, v) => M.hand(q, k, v) }); }
    if (!over(t)) {                                                   // the foot fold: FADE · MASK · SOFT
      const f = el('div', 'nodes-foot', n.c), tg = el('button', 'nodes-foot-t', f), fb = el('div', 'nodes-knobs row fit', f); tg.type = 'button'; label(tg, 'FADE · MASK · TARGET'); fb.hidden = true;
      tg.setAttribute('aria-expanded', 'false'); tg.addEventListener('click', () => { fb.hidden = !fb.hidden; tg.setAttribute('aria-expanded', String(!fb.hidden)); });
      n.foot = tg; n.fctl = nodeBody(fb, q, { knobs: FOOT }, { idOf: (k) => M.ID(q, k), hand: (k, v) => M.hand(q, k, v) });
    }
    plane.insertBefore(n.c, cards.out.c);
  }
  /** the wires: each node's out port (the bottom's middle) to the next one's in port (the top's middle), a cubic as a network draws it; 038 N4: on
      each wire into a node its HANDLE at the curve's middle (t = ½ is the mean of the ends), and an unplugged node's wire drawn only from above to
      its handle (the cubic's first half), dashed */
  function wires() {
    if (!W) return;                                                 // the rack card is a column: its ports meet, no wire to draw
    const mid = (id, end) => { const c = cards[id].c; return [c.offsetLeft + c.offsetWidth / 2, c.offsetTop + (end ? c.offsetHeight : 0)]; };
    const ids = ['in', ...M.list().map((q) => q.id), 'out'], hs = new Set(); P.clear();
    svg.replaceChildren(...ids.slice(1).map((b, i) => { const [x1, y1] = mid(ids[i], true), [x2, y2] = mid(b, false), d = Math.max(30, Math.abs(y2 - y1) / 2);
      const q = M.byId(b), cut = !!q && q.plug === false, mx = (x1 + x2) / 2, my = (y1 + y2) / 2, p = document.createElementNS(NS, 'path');
      p.setAttribute('d', cut ? `M${x1} ${y1} C${x1} ${y1 + d / 2} ${(3 * x1 + x2) / 4} ${(3 * y1 + y2 + d) / 4} ${mx} ${my}` : `M${x1} ${y1} C${x1} ${y1 + d} ${x2} ${y2 - d} ${x2} ${y2}`);
      p.wire = [x1, y1, x2, y2, d]; p.classList.toggle('cut', cut); P.set(b, p);
      if (q) { const h = handOf(q); h.style.left = mx + 'px'; h.style.top = my + 'px'; h.classList.toggle('cut', cut); hs.add(h); if (h.parentNode !== hands) hands.appendChild(h); }
      return p; }));
    for (const [id, h] of H) if (!hs.has(h)) { h.remove(); H.delete(id); }
    paintSel(); drawMap();
  }
  /* 038 N5 · THE MINIMAP (Josh: "Patcher also has a cool minimap view finder … Perhaps scrolling on the viewfinder will allow you to zoom in and out
     as well to adjust the view finder width"): an SVG over the cards' union and the view [−pan/z, (ground − pan)/z] — each card a rect (STAGE IN /
     OUT in the accent, a muted or unplugged node faint), the view an accent rect — redrawn once a frame when the view or a card moves; a drag centres
     the view where it points (the map's frame held while the hand is on it), the wheel zooms about the view's centre; hidden while all is in view */
  function drawMap() {
    if (!map) return;
    frame.coalesce('nodes.map.' + kind, () => {
      const B = Object.entries(cards).map(([id, n]) => { const [l, t] = xy(n.c); return [l, t, n.c.offsetWidth, n.c.offsetHeight, id, n.c]; }), gw = ground.clientWidth, gh = ground.clientHeight;
      const v = [-pan[0] / z, -pan[1] / z, gw / z, gh / z], x0 = Math.min(...B.map((b) => b[0])), y0 = Math.min(...B.map((b) => b[1])), x1 = Math.max(...B.map((b) => b[0] + b[2])), y1 = Math.max(...B.map((b) => b[1] + b[3]));
      map.hidden = !held && x0 >= v[0] - 1 && y0 >= v[1] - 1 && x1 <= v[0] + v[2] + 1 && y1 <= v[1] + v[3] + 1; if (map.hidden) return;
      const s = map.firstChild;
      if (!held) { const X0 = Math.min(x0, v[0]), Y0 = Math.min(y0, v[1]), w = Math.max(x1, v[0] + v[2]) - X0, h = Math.max(y1, v[1] + v[3]) - Y0, m = 0.05 * Math.max(w, h);
        s.setAttribute('viewBox', [X0 - m, Y0 - m, w + 2 * m, h + 2 * m].map((x) => x.toFixed(1)).join(' ')); }
      while (s.childElementCount < B.length + 1) s.insertBefore(document.createElementNS(NS, 'rect'), s.firstChild);
      while (s.childElementCount > B.length + 1) s.firstChild.remove();
      const R = [...s.children], put = (r, x, y, w, h) => { r.setAttribute('x', x.toFixed(1)); r.setAttribute('y', y.toFixed(1)); r.setAttribute('width', w.toFixed(1)); r.setAttribute('height', h.toFixed(1)); };
      B.forEach(([l, t, w, h, id, c], i) => { put(R[i], l, t, w, h); R[i].setAttribute('rx', 10); R[i].setAttribute('class', 'c' + (id === 'in' || id === 'out' ? ' io' : '') + (c.matches('.off, .unplug') ? ' dim' : '')); });
      put(R[B.length], ...v); R[B.length].setAttribute('class', 'v');
    });
  }
  /* 038 N4 · THE WIRE HAS A KNOB (Josh: "The connector wires also need a way to connect and disconnect. Check out FL Studio's 'Patcher' … how they
     design the 'knob' on the wires"): each wire is its downstream node's input, so its knob is that node's MIX — FADE (already folded, already a
     target), or a LAYER's / SHADER's own 0–1 MIX or AMOUNT (none: no arc).  The kit's hand: 220 px of rise is the whole range, Shift the fine gear
     (1/8), two presses come home; the wheel turns it here, where nothing scrolls */
  const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const mixOf = (t) => (!over(t) ? 'fade' : ['mix', 'amount'].find((k) => t.knobs.some((K) => K.k === k && K.min === 0 && K.max === 1)) || null);
  const homeOf = (t, k) => [...t.knobs, ...FOOT].find((K) => K.k === k).home;
  const SV = (tag, a, parent) => { const e = document.createElementNS(NS, tag); for (const n in a) e.setAttribute(n, a[n]); parent.appendChild(e); return e; };
  const paintHand = (q, v) => { const h = H.get(q.id); if (!h) return; const k = mixOf(T[q.type]), x = k ? clamp01(+(v === undefined ? q.values[k] : v)) : 0, arc = h.querySelector('.v');
    h.classList.toggle('nomix', !k); arc.setAttribute('stroke-dasharray', (x * 300).toFixed(1) + ' 360'); arc.style.visibility = x > 0.004 ? '' : 'hidden';
    if (k) label(h.querySelector('.nodes-hand-val'), k === 'amount' ? 'AMOUNT {v} %' : 'MIX {v} %', { v: Math.round(x * 100) }); };   // 038 N8: the readout's words through label()
  function handOf(q) {
    const id = q.id; let h = H.get(id); if (h) return h;
    h = el('div', 'nodes-hand'); h.dataset.wire = id; h.title = 'the wire\'s MIX: drag or wheel · Delete unplugs';
    const s = SV('svg', { viewBox: '0 0 20 20', 'aria-hidden': 'true' }, h);
    SV('circle', { class: 't', cx: 10, cy: 10, r: 7, pathLength: 360, 'stroke-dasharray': '300 360', transform: 'rotate(120 10 10)' }, s);
    SV('circle', { class: 'v', cx: 10, cy: 10, r: 7, pathLength: 360, transform: 'rotate(120 10 10)' }, s); SV('circle', { class: 'c', cx: 10, cy: 10, r: 2.4 }, s); el('span', 'nodes-hand-val', h);
    h.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return; e.preventDefault(); e.stopPropagation(); ground.focus({ preventScroll: true }); pickWire(id);
      const q0 = M.byId(id), k = q0 && mixOf(T[q0.type]); if (!k) return;
      if (e.timeStamp - (h.t0 || -1e9) < 300) { h.t0 = -1e9; M.hand(q0, k, homeOf(T[q0.type], k)); return; } h.t0 = e.timeStamp;
      h.setPointerCapture(e.pointerId); const u = cssZoom(ground); let v0 = clamp01(+q0.values[k]), y0 = e.clientY, fine = e.shiftKey;
      const mv = (ev) => { const q = M.byId(id); if (!q) return; if (ev.shiftKey !== fine) { fine = ev.shiftKey; v0 = clamp01(+q.values[k]); y0 = ev.clientY; }
        h.classList.add('turn'); M.hand(q, k, clamp01(v0 - (ev.clientY - y0) / u / (fine ? 1760 : 220))); };
      const end = () => { for (const [t, f] of on) h.removeEventListener(t, f); h.classList.remove('turn'); };
      const on = [['pointermove', mv], ['pointerup', end], ['pointercancel', end]]; for (const [t, f] of on) h.addEventListener(t, f);
    });
    h.addEventListener('wheel', (e) => { if (e.ctrlKey || e.metaKey) return; const q = M.byId(id), k = q && mixOf(T[q.type]); if (!k) return; e.preventDefault(); e.stopPropagation();
      M.hand(q, k, clamp01(+q.values[k] - Math.sign(e.deltaY) * (e.shiftKey ? 0.01 : 0.05))); h.classList.add('turn'); clearTimeout(h.tw); h.tw = setTimeout(() => h.classList.remove('turn'), 700); }, { passive: false });
    H.set(id, h); paintHand(q); return h;
  }
  /** a card's port carried onto a wire (or onto a port: the wire it ends) puts its node INTO that wire and plugs it in — THE COLUMN IS THE CHAIN,
      so "into" is a place: under the wire's upstream card, every card from its downstream one on shifted down to make room (the order kept, no
      card covered); an in-port let go on the empty ground (24 px off) unplugs its node.  Its own wires are no target, but an unplugged node's own
      input wire plugs it back where it stands */
  const toPlane = (e) => { const p = local(e); return [(p[0] - pan[0]) / z, (p[1] - pan[1]) / z]; };
  function wireAt(p, id) {
    const q = M.byId(id), ids = ['in', ...M.list().map((n) => n.id), 'out']; let best = null, bd = 18 / z;
    for (let i = 1; i < ids.length; i++) {
      if (ids[i - 1] === id || (ids[i] === id && q.plug !== false)) continue;
      const w = P.get(ids[i]); if (!w || !w.wire) continue; const [x1, y1, x2, y2, d] = w.wire;
      for (let s = 0; s <= 16; s++) { const t = s / 16, a = (1 - t) ** 3, b = 3 * (1 - t) ** 2 * t, c = 3 * (1 - t) * t * t, f = t ** 3;
        const dd = Math.hypot((a + b) * x1 + (c + f) * x2 - p[0], a * y1 + b * (y1 + d) + c * (y2 - d) + f * y2 - p[1]); if (dd < bd) { bd = dd; best = ids[i]; } }
    }
    return best;
  }
  function portDrag(e, id, side) {
    if (e.button !== 0) return; e.preventDefault(); e.stopPropagation(); ground.focus({ preventScroll: true });
    const pt = e.currentTarget, c = cards[id].c, from = [c.offsetLeft + c.offsetWidth / 2, c.offsetTop + (side === 'out' ? c.offsetHeight : 0)], p0 = toPlane(e);
    pt.setPointerCapture(e.pointerId);
    const ghost = svg.appendChild(document.createElementNS(NS, 'path')); ghost.setAttribute('class', 'ghost'); let hot = null, far = false;
    const mv = (ev) => { const p = toPlane(ev); far = far || Math.hypot(p[0] - p0[0], p[1] - p0[1]) > 24 / z; hot = wireAt(p, id);
      ghost.setAttribute('d', `M${from[0]} ${from[1]} L${p[0]} ${p[1]}`); for (const [b, w] of P) w.classList.toggle('hot', b === hot); };
    const end = (ev) => { for (const [t, f] of on) pt.removeEventListener(t, f); ghost.remove(); for (const w of P.values()) w.classList.remove('hot');
      if (ev.type === 'pointercancel') return; const q = M.byId(id); if (!q) return;
      if (hot) into(id, hot); else if (far && side === 'in' && q.plug !== false) M.setPlug(id, false); };
    const on = [['pointermove', mv], ['pointerup', end], ['pointercancel', end]]; for (const [t, f] of on) pt.addEventListener(t, f);
  }
  function into(id, D) {
    const L = ['in', ...M.list().map((q) => q.id), 'out'], U = L[L.indexOf(D) - 1];
    if (U === id || D === id) { moved(false, id); return; }
    const x = cards[id].c, u = cards[U].c, dn = cards[D].c, [ul, ut] = xy(u), [dl, d0] = xy(dn), top = ut + u.offsetHeight + GAP;
    x.style.left = Math.round((ul + u.offsetWidth / 2 + dl + dn.offsetWidth / 2) / 2 - x.offsetWidth / 2) + 'px'; x.style.top = Math.round(top) + 'px';
    const shift = top + x.offsetHeight + GAP - d0;
    if (shift > 0) for (const [k, n] of Object.entries(cards)) if (k !== id && k !== 'in' && xy(n.c)[1] >= d0) n.c.style.top = xy(n.c)[1] + shift + 'px';
    moved(false, id);
  }
  /** RENAME: the title becomes a line; Enter keeps it, Escape (or leaving it) does not; empty = the type's name */
  function renameAt(id) {
    const n = cards[id], q = M.byId(id); if (!n || !q || n.c.querySelector('.nodes-rename')) return;
    const f = el('input', 'nodes-rename sp-prename', null); f.type = 'text'; f.maxLength = 40; ariaLabel(f, 'node name'); f.value = q.name || T[q.type].label;
    n.name.hidden = true; n.name.after(f);
    let done = false; const end = (keep) => { if (done) return; done = true; f.remove(); n.name.hidden = false; if (keep) M.rename(id, f.value === T[q.type].label ? '' : f.value); if (W) ground.focus({ preventScroll: true }); };
    f.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); end(true); } else if (e.key === 'Escape') { e.preventDefault(); end(false); } });
    f.addEventListener('blur', () => end(false)); f.focus(); f.select();
  }
  /* THE RIGHT-CLICK MENUS (022 P2: the kit's contextMenu — a right-click, the ContextMenu key or a still hold, onContext; ✓ where a row is a state) */
  let pop = null;                                                    // the kit menu open from this view (a right-click's, or the + menu)
  let drag = null;                                                   // the ground's press: a pan, a box (shift) or a zoom (ctrl / ⌘)
  const popup = (x, y, rows) => { const m = pop = contextMenu({ x, y, entries: rows.map((r) => (r ? [r[0], r[1], false, '', r.length > 2 ? { checked: !!r[2] } : {}] : null)), onClose: () => { if (pop === m) pop = null; } }); };
  const folded = () => M.list().length > 0 && M.list().every((q) => q.fold);
  const foldAll = () => M.setFold(M.list().map((q) => q.id), !folded());
  const cardRows = (q) => [['VIEW HERE', () => M.setView(q.id), M.flags.view === q.id], ['SOLO', () => M.setSolo(q.id), M.flags.solo === q.id], ['BYPASS', () => M.setBypass(q.id, !q.bypass), q.bypass], [q.fold ? 'UNFOLD' : 'FOLD', () => M.setFold(q.id, !q.fold)],
    ['DUPLICATE', () => pick(M.duplicate(q.id, at()))], ['RENAME', () => renameAt(q.id)], ['RESET', () => M.reset(q.id)], null,
    ['MOVE UP', () => M.move(q.id, -1)], ['MOVE DOWN', () => M.move(q.id, 1)], null, ['REMOVE', () => M.remove(q.id)]];
  const wireRows = (q) => { const k = mixOf(T[q.type]); return [[q.plug === false ? 'PLUG IN' : 'UNPLUG', () => M.setPlug(q.id, q.plug === false)], k && ['RESET MIX', () => M.hand(q, k, homeOf(T[q.type], k))]].filter(Boolean); };
  const groundRows = () => [['ADD…', () => openMenu()], W && ['FIT', () => fit()], ['TIDY', () => M.tidy()], [folded() ? 'UNFOLD ALL' : 'FOLD ALL', foldAll], ['BYPASS ALL', () => M.setOff(!M.off()), M.off()],
    ...(wsel && M.byId(wsel) ? [null, wireRows(M.byId(wsel))[0]] : [])].filter((r) => r !== false);
  onContext(ground, ({ x, y, target }) => { if (target.closest('input') || (drag && drag.zoom)) return;   // a Mac's ctrl + press is a zoom here, not a menu
    const hd = target.closest('.nodes-hand'), hq = hd && M.byId(hd.dataset.wire); if (hq) { pickWire(hq.id); popup(x, y, wireRows(hq)); return; }
    const c = target.closest('.nodes-card[data-node]'), q = c && M.byId(c.dataset.node); popup(x, y, q ? cardRows(q) : groundRows()); });
  if (!W) ground.classList.add('nodes-column');
  else {
    /* THE GROUND'S HAND: a drag pans, shift + drag draws a box, two fingers pinch; ctrl/⌘ + wheel zooms about the pointer, and 038 N2 (Josh: "Ctrl+drag
       on background will resize/scale the entire nodes like a zoom-in/out feature") ctrl/⌘ + drag zooms about the press — up is in, 0.5–2× —
       the kit's modifier table ("Ctrl shapes — zoom"); the cursor says so while the key is held over the ground */
    ground.tabIndex = 0;
    const box = el('div', 'nodes-box', ground), pts = new Map();
    let pinch = null;
    const span = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    ground.addEventListener('pointerdown', (e) => {
      if (!(e.target === ground || e.target === plane || e.target === svg)) return;
      ground.focus({ preventScroll: true }); pts.set(e.pointerId, local(e));
      if (pts.size === 2) { const [a, b] = pts.values(); pinch = { d: span(a, b), m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], pan, z }; drag = null; return; }
      if (e.button !== 0) return;
      e.preventDefault(); try { ground.setPointerCapture(e.pointerId); } catch (_) { /* a pointer already gone */ }
      const zk = e.ctrlKey || e.metaKey; drag = { p: local(e), pan, box: e.shiftKey && !zk, zoom: zk && z }; ground.classList.toggle('nodes-zooming', zk);
    });
    ground.addEventListener('pointermove', (e) => {
      ground.classList.toggle('nodes-zkey', e.ctrlKey || e.metaKey);
      if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, local(e));
      if (pinch && pts.size === 2) { const [a, b] = pts.values(); zoomAt(pinch.z * (span(a, b) / pinch.d), pinch.m, pinch.pan, pinch.z); return; }
      if (!drag) return;
      const p = local(e), d = [p[0] - drag.p[0], p[1] - drag.p[1]];
      if (drag.zoom) { zoomAt(drag.zoom * Math.exp(-d[1] * 0.006), drag.p, drag.pan, drag.zoom); return; }
      if (!drag.box) { setPan([drag.pan[0] + d[0], drag.pan[1] + d[1]]); return; }
      drag.r = [Math.min(p[0], drag.p[0]), Math.min(p[1], drag.p[1]), Math.abs(d[0]), Math.abs(d[1])];
      Object.assign(box.style, { display: 'block', left: drag.r[0] + 'px', top: drag.r[1] + 'px', width: drag.r[2] + 'px', height: drag.r[3] + 'px' });
    });
    const up = (e) => {
      pts.delete(e.pointerId);
      if (pinch) { if (pts.size < 2) { pinch = null; keep(); } return; }
      if (!drag) return;
      if (drag.box && drag.r) {                                     // the cards the box touches join the selection (in plane units)
        const [l, t, w, h] = drag.r.map((v, i) => (i < 2 ? (v - pan[i]) / z : v / z));
        pick(M.list().map((q) => q.id).filter((id) => { const c = cards[id].c; return c.offsetLeft < l + w && c.offsetLeft + c.offsetWidth > l && c.offsetTop < t + h && c.offsetTop + c.offsetHeight > t; }), true);
      } else if (!drag.box) { if (drag.pan === pan) pick([]); else keep(); }   // a click on the empty ground lets the selection go
      box.style.display = 'none'; drag = null; ground.classList.remove('nodes-zooming');
    };
    ground.addEventListener('pointerup', up); ground.addEventListener('pointercancel', up);
    for (const t of ['keydown', 'keyup']) ground.addEventListener(t, (e) => { if (e.key === 'Control' || e.key === 'Meta') ground.classList.toggle('nodes-zkey', t === 'keydown'); });
    ground.addEventListener('pointerleave', () => ground.classList.remove('nodes-zkey'));
    ground.addEventListener('wheel', (e) => { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault();
      zoomAt(z * Math.exp(-e.deltaY * (e.deltaMode ? 16 : 1) * 0.002), local(e)); keep(); }, { passive: false });
    map = el('div', 'nodes-map', ground); map.hidden = true; map.title = 'MAP — drag to look round · the wheel zooms'; map.appendChild(document.createElementNS(NS, 'svg'));
    const look = (e) => { const s = map.firstChild, m = s.getScreenCTM(); if (!m) return; const q = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
      setPan([ground.clientWidth / 2 - q.x * z, ground.clientHeight / 2 - q.y * z]); };
    map.addEventListener('pointerdown', (e) => { if (e.button !== 0) return; e.preventDefault(); e.stopPropagation(); held = true; map.setPointerCapture(e.pointerId); look(e);
      const mv = (ev) => look(ev), end = () => { map.removeEventListener('pointermove', mv); map.removeEventListener('pointerup', end); map.removeEventListener('pointercancel', end); held = false; keep(); drawMap(); };
      map.addEventListener('pointermove', mv); map.addEventListener('pointerup', end); map.addEventListener('pointercancel', end); });
    map.addEventListener('wheel', (e) => { e.preventDefault(); e.stopPropagation(); zoomAt(z * Math.exp(-e.deltaY * (e.deltaMode ? 16 : 1) * 0.002), [ground.clientWidth / 2, ground.clientHeight / 2]); keep(); }, { passive: false });
    ro.observe(ground);
    /* THE KEYS ARE THE GROUND'S — 021 I1: rows of THE ACTION REGISTRY (`nodes.*`, lab/actions.js), live while this ground has the focus (THE FOCUS
       LAW): chords by place (AZERTY, Dvorak), rebindable, on the board; Tab is the kit's again, the add menu is Shift+A.  These are their acts. */
    GROUNDS.set(ground, {
      nudge(dx, dy, a) { if (wsel) { const q = M.byId(wsel), k = q && mixOf(T[q.type]); if (k) M.hand(q, k, clamp01(+q.values[k] + (dx - dy) * (a && a.shift ? 0.1 : 0.01))); return; }
        const ids = [...sel]; if (!ids.length) return; const s = a && a.shift ? 10 : 1;
        for (const id of ids) { const n = cards[id].c, p = xy(n); n.style.left = p[0] + dx * s + 'px'; n.style.top = p[1] + dy * s + 'px'; } moved(true); },
      remove() { if (wsel) { M.setPlug(wsel, false); return; } M.remove([...sel]); sel.clear(); }, duplicate() { pick(M.duplicate([...sel], at())); }, all() { pick(M.list().map((q) => q.id)); },
      undo: () => M.undo(), redo: () => M.redo(), off: () => M.setOff(!M.off()), add: () => openMenu(), fit: () => fit(),
      bypass() { const ids = [...sel]; if (ids.length) M.setBypass(ids, ids.some((id) => !M.byId(id).bypass)); }, solo() { const ids = [...sel]; if (ids.length) M.setSolo(ids[0]); },
      fold() { const ids = [...sel]; if (ids.length) M.setFold(ids, ids.some((id) => !M.byId(id).fold)); },
      escape() { if (pop) pop.close(); else pick([]); } });
  }

  /* + · THE ADD MENU (038 N1, Josh: "Nodes dropdown seems to be missing it's background"): the kit's contextMenu under the + — a pane on the page,
     so its plate reads over the stage and its blur takes what lies behind (inside the card or the window it blurred nothing and the card clipped it
     to a scroller) — with the kit's ↑ ↓ → ←, Enter, Escape and a press outside.  The kinds by GROUP, each group a submenu (no scroller); GRAPHS a
     submenu (the shipped ones, the reader's, SAVE THIS GRAPH, REMOVE ›); a search line on top: typed, the matches as one list, Enter adds the first.
     A kind joins a group by `group` (else its class); a new group is a GROUPS row.  The tools sit before the plane, so Tab meets + first (038 N7) */
  const tools = ground.insertBefore(el('div', 'nodes-tools'), plane), tool = (cls, g, word, run) => { const b = el('button', cls, tools); b.type = 'button'; chip(b, g, word); b.addEventListener('click', run); return b; };
  const addB = tool('nodes-add', 'plus', 'ADD NODE', () => openMenu());
  if (W) tool('nodes-fit', 'home', 'FIT — every card in view (Home)', () => fit());
  const foldB = tool('nodes-folds', 'compact', 'FOLD ALL', () => foldAll());
  const offB = tool('nodes-off', 'power', 'BYPASS ALL — the picture without the graph (\\)', () => M.setOff(!M.off()));
  const back = () => { if (W) ground.focus({ preventScroll: true }); };   // a pick or an Escape gives the ground its keys back
  const kindRow = (type, t) => [t.label + '\t' + MARK[t.cls] + (t.heavy ? ' HEAVY' : ''), () => { M.add(type); back(); }, type === 'curves' && M.has(), t.hint, { icon: nodeGlyph(type), id: type }];
  const kinds = ([g, , , cls = [g]]) => Object.entries(T).filter(([, t]) => t.menu !== false && cls.includes(t.group || t.cls)).map(([type, t]) => kindRow(type, t));
  const graph = (name, list, hint, raw) => [name, () => { M.applyGraph(list, name); back(); }, false, hint, { id: 'graph:' + name, raw }];   // 040 N4: the bar names it
  const graphRows = () => { const U = M.graphs.list();
    return [...Object.entries(M.SHIPPED).map(([name, list]) => graph(name, list, 'a shipped graph: every node but CURVES replaced')),
      ...(U.length ? [null, ...U.map((u) => graph(u.name, u.data && u.data.nodes, 'your graph (kept on this device)', true))] : []),
      null, ['SAVE THIS GRAPH', saveGraph, false, 'the nodes as your own graph (kept on this device)', { icon: 'saveInto', id: 'save' }],
      ...(U.length ? [['REMOVE', () => U.map((u) => [u.name, () => M.graphs.remove(u.name), false, 'remove this graph', { raw: true, id: 'remove:' + u.name }]), null, '', { sub: true, icon: 'trash', id: 'remove' }]] : [])]; };
  const found = (s) => { const S = s.toUpperCase();
    return [...Object.entries(T).filter(([, t]) => t.menu !== false && t.label.includes(S)).map(([type, t]) => kindRow(type, t)),
      ...Object.entries(M.SHIPPED).filter(([n]) => n.includes(S)).map(([n, list]) => graph(n, list, 'a shipped graph')),
      ...M.graphs.list().filter((u) => u.name.toUpperCase().includes(S)).map((u) => graph(u.name, u.data && u.data.nodes, 'your graph', true))].slice(0, 10); };
  let find = null;
  /** open the + menu, its caret on the search line; a typed search reopens it with the matches (the line kept, the caret where it was) */
  function openMenu(s = '') {
    if (!find) { find = el('input', 'nodes-find'); find.type = 'search'; placeholder(find, 'search'); ariaLabel(find, 'find a node');
      find.addEventListener('input', () => openMenu(find.value.trim()));
      find.addEventListener('keydown', (e) => { e.stopPropagation(); const r = pop && pop.pane.querySelector('.mb-item:not(:disabled)');
        if (r && (e.key === 'Enter' || e.key === 'ArrowDown')) { e.preventDefault(); if (e.key === 'Enter') r.click(); else r.focus(); } }); }
    if (!s) find.value = '';
    const at = [find.selectionStart, find.selectionEnd], rows = s ? found(s) : [...GROUPS.filter((G) => kinds(G).length).map((G) => [G[1], () => kinds(G), null, '', { sub: true, icon: G[2], id: 'group:' + G[0] }]),
      null, ['GRAPHS', graphRows, null, '', { sub: true, icon: 'nodes', id: 'graphs' }]];
    const m = pop = contextMenu({ anchor: addB, label: 'Add a node', entries: rows.length ? rows : [['NO MATCH', null, true]], onClose: () => { if (pop === m) pop = null; } });
    if (!m) return;
    m.pane.classList.add('nodes-add-menu'); m.pane.prepend(find); find.focus({ preventScroll: true }); if (s) find.setSelectionRange(at[0], at[1]);
    m.host.addEventListener('keydown', (e) => { if (e.key !== 'Escape' || e.target.closest('.mb-sub-list')) return; e.preventDefault(); e.stopPropagation(); m.close(); back(); }, true);
  }
  /** SAVE THIS GRAPH: its name in the kit's dialog (Enter keeps it, Escape does not) */
  function saveGraph() {
    const f = el('input', 'sp-prename'); f.type = 'text'; f.maxLength = 40; ariaLabel(f, 'graph name'); f.value = 'My graph';
    const d = openDialog({ title: 'SAVE THIS GRAPH', body: f, actions: [{ label: 'CANCEL', value: null }, { label: 'SAVE', kind: 'primary', run: () => f.value.trim() || null }] });
    f.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); d.close(f.value.trim() || null); } });
    requestAnimationFrame(() => { f.focus(); f.select(); });
    d.result.then((n) => { if (n) M.graphs.add(n, { nodes: M.graphOf() }); back(); });
  }
  const foot = el('div', 'nodes-passes', ground);
  if (!W) label(el('div', 'note', parent), NOTE);                   // the card's one line (window notes are a SETTINGS choice)
  const api = {
    get view() { return cards.curves && cards.curves.view; },
    widget: (id, k) => { const n = cards[id], c = n && ((n.ctl && n.ctl.ctls[k]) || (n.fctl && n.fctl.ctls[k])); return c ? c.targets[0] || null : null; },
    paint(q, k, v, shown) { const n = cards[q.id]; if (!n) return; for (const c of [n.ctl, n.fctl]) if (c) c.paint(k, v, shown); if (k === mixOf(T[q.type])) paintHand(q, v); api.mark(q); },
    /** the cost mark (a masked node is a pass) and the foot fold's light (FADE or MASK off home) */
    mark(q) { const n = cards[q.id]; if (!n) return; n.bar.querySelector('.nodes-mark').textContent = markOf(q, T[q.type]);
      if (n.foot) n.foot.classList.toggle('on', q.values.fade < 1 || (q.values.mask || 'none') !== 'none' || (q.values.target || 'both') !== 'both'); },
    /** the PREVIEW strip: a grey ramp over a hue ramp, each of the 128 columns through the node's own transfer (coalesced on the frame) */
    strip(q) { const n = cards[q.id]; if (!n || !n.strip) return; frame.coalesce('nodes.strip.' + kind + '.' + q.id, () => {
      const f = transfer(q, T[q.type]), g = n.strip.getContext('2d');
      if (T[q.type].draw) { T[q.type].draw(g, q.values, f); return; }   // 038 P2: a kind that draws its own strip (LEVELS' curve and marks)
      const im = g.createImageData(128, 10);
      for (let i = 0; i < 128; i++) { const s = i / 127, rows = [f([s, s, s]), f(hueAt(i / 128))];
        for (let y = 0; y < 10; y++) { const c = rows[y < 5 ? 0 : 1], o = (y * 128 + i) * 4; im.data[o] = c[0] * 255; im.data[o + 1] = c[1] * 255; im.data[o + 2] = c[2] * 255; im.data[o + 3] = 255; } }
      g.putImageData(im, 0, 0); }); },
    /** the graph's foot: what the graph costs — filter primitives + layers */
    foot() { const p = M.passes(), L = M.list(), i = L.findIndex((q) => q.id === M.flags.view); foot.replaceChildren();
      if (p === 1) label(el('span', '', foot), '1 pass'); else label(el('span', '', foot), '{n} passes', { n: p });
      if (i >= 0) label(el('span', '', foot), 'viewing {i} of {n}', { i: i + 1, n: L.length });
      if (M.flags.solo) label(el('span', '', foot), 'solo');
      if (M.off()) label(el('span', '', foot), 'graph off'); },
    /** the cards follow the list: a new node gets its card, a removed one loses it */
    sync(rebuild) {
      const L = M.list();
      for (const id of Object.keys(cards)) if (id !== 'in' && id !== 'out' && (rebuild || !M.byId(id))) { sel.delete(id); ro.unobserve(cards[id].c); if (cards[id].view) cards[id].view.destroy(); cards[id].c.remove(); delete cards[id]; }
      for (const q of L) { if (!cards[q.id]) make(q); const n = cards[q.id]; n.c.classList.toggle('off', q.bypass); n.c.classList.toggle('unplug', q.plug === false); paintHand(q); n.bar.querySelector('.nodes-x').setAttribute('aria-pressed', String(q.bypass));
        api.mark(q); n.c.classList.toggle('fold', q.fold); n.bar.querySelector('.nodes-eye').setAttribute('aria-pressed', String(M.flags.view === q.id));
        n.bar.querySelector('.nodes-solo').setAttribute('aria-pressed', String(M.flags.solo === q.id));
        n.c.classList.toggle('past', !!(M.flags.solo ? M.flags.solo !== q.id : M.flags.view && L.findIndex((p) => p.id === M.flags.view) < L.indexOf(q))); n.bar.querySelector('.nodes-chev').setAttribute('aria-expanded', String(!q.fold));
        if (q.name) { label(n.name, ''); n.name.textContent = q.name; } else label(n.name, T[q.type].label); }
      offB.setAttribute('aria-pressed', String(M.off())); ground.classList.toggle('nodes-off', M.off());
      chip(foldB, folded() ? 'expand' : 'compact', folded() ? 'UNFOLD ALL' : 'FOLD ALL');
      paintSel(); api.place();
    },
    place() {
      const L = M.list(); if (pop) pop.close(); api.foot(); empty.hidden = L.length > 0;
      if (!W) { plane.append(cards.in.c, empty, ...L.map((q) => cards[q.id].c), cards.out.c); return; }   // the rack card: the chain as a column, in order
      const set = (n, l, t) => { n.style.left = l + 'px'; n.style.top = t + 'px'; };
      const A = M.rec().at || {}, pin = A.in || AT.in;
      set(cards.in.c, pin[0], pin[1]);
      let y = pin[1] + cards.in.c.offsetHeight + GAP;
      if (!L.length) { set(empty, pin[0] + cards.in.c.offsetWidth / 2, y - GAP / 2 + 6); y += GAP; }
      for (const q of L) { const n = cards[q.id], p = q.at || [Math.round((SPAN - n.c.offsetWidth) / 2), y]; set(n.c, p[0], p[1]); y = Math.max(y, p[1] + n.c.offsetHeight + GAP); }
      const po = A.out || [pin[0], y]; set(cards.out.c, po[0], Math.max(po[1], y));
      const p = (M.rec().pan || {})[kind]; setPan(Array.isArray(p) ? p : [Math.round((ground.clientWidth - SPAN) / 2), 0], W ? clampZ(+M.rec().zoom || 1) : 1);
      wires();
    },
  };
  api.sync();
  return api;
}
