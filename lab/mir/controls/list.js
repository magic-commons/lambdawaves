/* controls/list.js — THE STATIC CHIP STRIP and THE SORTABLE LIST.
 *
 * THE LAW IT KEEPS: A LIST THE USER BUILDS IS A STACK OF PANES, EACH WITH ITS OWN CHIPS (docs/CONTROLS-COLOUR.md).  BASINS'
 * colour window is the model: one pane per item (`data-mir-surface="island"`), a dot GRIP over an ARMED × on rail discs beside
 * it, on the OUTER edge of the rack (the right rack: the right of the pane; the left rack and a phone: the left); a drag on
 * the grip or the arrow keys reorder; the × asks twice ("sure?", 2.6 s) and the last item cannot go; a centred `+ ADD` pill at
 * the foot takes a new item and DIMS at the cap.  The items' content is the app's.
 *
 *   chipStrip({ id, title, chips, onChip, onGrip, onKey, glyphSize, flow: 'column' | 'row', material })
 *       → { el, chip(name), grip, setChip(name, state), state(name), setDisabled(name, on), destroy() }
 *       A STATIC strip of the rail's round discs (.mir-chip, window/rail.js's faces: the same tokens, the same chip table,
 *       the same ladder of card styles) that sits inline beside a lane or a pane.  `createRail` is fixed-position and its
 *       grip moves the window; this one never moves and never seats: it is a toolbar in the flow.  `chips` are rail.js's
 *       specs ({ name, kind: close | action | toggle | radio | cycle | grip, label, hint?, glyph | text, states, state })
 *       and one more key: `confirm: { text = 'sure?', ms = 2600, label }` makes a chip ARMED-TO-FIRE: the first press arms
 *       it (its ink becomes `text` in the warning colour for `ms`), the second within `ms` calls onChip.  onChip(name,
 *       next, spec) as the rail's; onGrip(pointerdown) when the grip is pressed (the owner decides what a drag means: the
 *       strip never moves anything: wire core/pointer.js drag() to `strip.grip`); onKey(name, keydown) on a chip.
 *   sortableList({ items, build, onMove, onRemove, onAdd, cap, min, noun, addLabel, side, armMs, material, axis })
 *       → { root, rows, add, items(), setItems(items), rebuild(), move(id, to), remove(id), nodeOf(id), count(), destroy() }
 *       items: [{ id, …the app's }].  build(item, index) → the pane's content: a node, or { el, destroy() }.
 *       onMove(id, to) → false refuses (the list goes back); onRemove(id) → false refuses; onAdd() → a new item (appended),
 *       or nothing when the app calls setItems itself.  cap: the most items (+ ADD dims there); min: the fewest (the × of the
 *       last is disabled; default 1); noun: the word in the hints ('colour').  side: 'auto' (the rack's) | 'left' | 'right'.
 *       axis: 'y' (a stack of panes, the default) | 'x' (side by side, as strips: the items sit in one island pane, each with its
 *       chips under it; the drag runs along x and ← → move an item, flipped under `direction: rtl`).
 *
 * THE KIT'S LAWS HERE.  The drag is core/pointer.js drag() (the pointer that began it owns it; pointercancel, lost capture,
 * Escape and a hidden page cancel it and the list goes back to the app's order); the row moves live under the hand, the drop
 * commits once.  No poller: nothing runs while nothing moves.  An item's pane is the kit's island surface, so CARD STYLE and
 * FROST paint it as they paint a window's body card.
 * Harvested from BASINS app/colour-window.js (wireGrip, wireClose, buildRow, rebuild) and colour.css (.colour-entry,
 * .colour-rail, .colour-addrow); the strip answers the gap the BASINS builder stopped on (2026-10-02: "there is no static
 * chip strip. `createRail` is fixed-position, and its grip moves the window"). */
import { el, trig, ariaLabel, hint, label } from '../kit.js';
import { glyphEl } from '../glyph.js';
import { drag } from '../core/pointer.js';
import { setAttr, setText, setVar, rect } from '../core/perf.js';
import { frame } from '../core/frame.js';
import { chipTable, nextState } from '../window/rail.js';
import { phrase } from '../core/i18n.js';

export const ARM_MS = 2600;                       // an armed × waits this long for its second tap (BASINS' SAVE window's number)
const GRIP_DOTS = 9;

/** a chip's text: a string, or ['… {x} …', { x }] for one with values in it */
const words = (v) => (Array.isArray(v) ? v : [v, undefined]);

/** chipStrip(o) — see the header */
export function chipStrip({ id = 'strip', title, chips = [], onChip, onGrip, onKey, glyphSize = 20, flow = 'column', material } = {}) {
  const root = el('div', 'mir-rail mir-chipstrip');
  if (flow === 'row') root.dataset.flow = 'row';
  root.setAttribute('role', 'toolbar');
  root.dataset.mirRail = id;
  root.dataset.static = 'true';
  if (material) root.dataset.mirMaterial = material;
  if (title) ariaLabel(root, '{title} controls', { title: { t: String(title) } });
  const specs = new Map(), nodes = new Map(), tables = new Map(), states = new Map(), inked = new Map(), timers = new Map();

  function ink(b, row, armed) {
    const want = armed ? 'a:' + armed : row.glyph ? 'g:' + row.glyph : row.text ? 't:' + row.text : '';
    if (inked.get(b) === want || b.dataset.kind === 'grip') return;
    inked.set(b, want); b.textContent = '';
    if (armed) { delete b.dataset.glyph; const t = el('span', 'mir-chip-text mir-chip-sure', b); label(t, armed); return; }
    if (row.glyph) { b.dataset.glyph = row.glyph; const g = glyphEl(row.glyph, 'mir-chip-ink gly-' + row.glyph, glyphSize); if (g) b.appendChild(g); }
    else { delete b.dataset.glyph; if (row.text) { const t = el('span', 'mir-chip-text', b); setText(t, row.text); } }
  }
  function setChip(name, state) {
    const b = nodes.get(name), spec = specs.get(name), table = tables.get(name);
    if (!b) return;
    const key = table.has(state) ? state : spec.kind === 'toggle' || spec.kind === 'radio' ? !!state : table.keys().next().value;
    const row = table.get(key);
    states.set(name, key);
    b.classList.toggle('on', row.pressed === 'true');
    setAttr(b, 'aria-pressed', row.pressed ?? null);
    setAttr(b, 'data-state', key === null ? null : String(key));
    const [lab, labVars] = words(row.label), [hnt, hntVars] = words(row.hint || row.label);
    if (lab) ariaLabel(b, lab, labVars); else setAttr(b, 'aria-label', name);
    if (hnt) hint(b, hnt, hntVars);
    ink(b, row, b.classList.contains('armed') ? (spec.confirm.text || phrase('sure?')) : null);
    if (spec.kind === 'radio' && key === true) for (const [n, s] of specs) if (n !== name && s.kind === 'radio' && s.group === spec.group && states.get(n)) setChip(n, false);
  }
  function disarm(name) {
    const b = nodes.get(name); clearTimeout(timers.get(name)); timers.delete(name);
    if (!b || !b.classList.contains('armed')) return;
    b.classList.remove('armed'); setChip(name, states.get(name));
  }
  function press(name) {
    const spec = specs.get(name), b = nodes.get(name);
    if (b.disabled) return;
    if (spec.confirm && !b.classList.contains('armed')) {                 // the first press only arms: "tap again to confirm"
      b.classList.add('armed'); setChip(name, states.get(name));
      const [en, vars] = words(spec.confirm.label || spec.label);        // the armed chip says what a second press will do
      ariaLabel(b, en, vars);
      timers.set(name, setTimeout(() => disarm(name), spec.confirm.ms || ARM_MS));
      return;
    }
    if (spec.confirm) disarm(name);
    const next = nextState(spec, states.get(name));
    if (spec.kind === 'toggle' || spec.kind === 'radio' || spec.kind === 'cycle') setChip(name, next);
    if (onChip) onChip(name, next, spec);
  }

  for (const spec of chips) {
    const b = el('button', 'mir-chip', root); b.type = 'button';
    b.dataset.mirChip = spec.name; b.dataset.kind = spec.kind;
    if (spec.kind === 'grip') { const dots = el('span', 'mir-grip-dots', b); dots.setAttribute('aria-hidden', 'true'); for (let i = 0; i < GRIP_DOTS; i++) el('i', null, dots); b.tabIndex = 0; b.setAttribute('role', 'button'); }
    specs.set(spec.name, spec); nodes.set(spec.name, b);
    tables.set(spec.name, chipTable(spec));
    setChip(spec.name, spec.kind === 'cycle' ? (spec.state ?? spec.states[0].id) : spec.kind === 'toggle' || spec.kind === 'radio' ? !!spec.state : null);
    if (spec.kind !== 'grip') b.addEventListener('click', () => press(spec.name));
    b.addEventListener('keydown', (e) => { if (onKey) onKey(spec.name, e); });
  }
  const grip = [...nodes.values()].find((b) => b.dataset.kind === 'grip') || null;
  if (grip && onGrip) grip.addEventListener('pointerdown', onGrip);
  grip && grip.addEventListener('contextmenu', (e) => e.preventDefault());

  return {
    el: root, grip,
    chip: (name) => nodes.get(name), setChip, state: (name) => states.get(name),
    setDisabled(name, on) { const b = nodes.get(name); if (!b) return; if (on) disarm(name); b.disabled = !!on; b.classList.toggle('disabled', !!on); },
    destroy() { for (const t of timers.values()) clearTimeout(t); timers.clear(); root.remove(); },
  };
}

/** sortableList(o) — see the header */
export function sortableList({ items = [], build, onMove, onRemove, onAdd, cap = 8, min = 1, noun = 'item', addLabel = phrase('+ ADD'), side = 'auto', armMs = ARM_MS, material, axis = 'y' } = {}) {
  const root = el('div', 'mir-list');
  root.dataset.side = side;
  const X = axis === 'x';
  if (X) root.dataset.axis = 'x';
  const rows = el('div', 'mir-list-rows', root);
  if (X) rows.dataset.mirSurface = 'island';                    // strips share one pane; a stack's items are a pane each
  const addRow = el('div', 'mir-list-addrow', root);            // not an item: nothing that walks .mir-list-item sees it
  const add = trig({ label: addLabel, cls: 'mir-list-add', onFire: () => doAdd() });
  addRow.appendChild(add.root);
  let list = items.slice();
  const recs = new Map();                                       // id → { row, pane, strip, content, off }
  const vars = (n) => ({ noun, n });

  function disposeRow(r) { try { r.off && r.off(); r.content && r.content.destroy && r.content.destroy(); } catch (_) { /* a host's destroy */ } r.strip.destroy(); }
  function count() { return list.length; }
  function sync() {
    const full = list.length >= cap, one = list.length <= min;
    for (const r of recs.values()) r.strip.setDisabled('remove', one);
    add.root.disabled = full; add.root.classList.toggle('disabled', full);
    hint(add.root, full ? phrase('The {noun} list is full — {count} of {cap}') : phrase('Add a {noun} — {count} of {cap}'), { noun, count: list.length, cap });
    ariaLabel(add.root, full ? phrase('Add a {noun} — {count} of {cap}, full') : phrase('Add a {noun} — {count} of {cap}'), { noun, count: list.length, cap });
    root.dataset.full = String(full);
  }
  const index = (id) => list.findIndex((x) => x.id === id);

  /** put the DOM in the list's order (a keyboard move, or a refused drag) */
  function reorderDom() { for (const it of list) { const r = recs.get(it.id); if (r) rows.appendChild(r.row); } }
  function move(id, to) {
    const from = index(id); if (from < 0) return false;
    to = Math.max(0, Math.min(list.length - 1, to));
    if (to === from) return true;
    if (onMove && onMove(id, to) === false) { reorderDom(); return false; }
    const [it] = list.splice(from, 1); list.splice(to, 0, it);
    reorderDom();
    return true;
  }
  function remove(id) {
    if (list.length <= min || index(id) < 0) return false;
    if (onRemove && onRemove(id) === false) return false;
    list.splice(index(id), 1); rebuild();
    return true;
  }
  function doAdd() {
    if (list.length >= cap) return null;
    const it = onAdd ? onAdd() : null;
    if (it && it.id !== undefined) { list.push(it); rebuild(); }
    return it || null;
  }

  /* THE DRAG.  The row under the hand follows it by transform and the rows it passes glide out of its way; nothing is moved in the
     DOM until the drop (an element that is re-parented mid-drag loses its pointer capture, and the drag with it: core/pointer.js
     would cancel it).  One read of the rows at the start, one transform write per row per frame; the drop commits once. */
  const A = X ? { pos: 'left', size: 'width', t: 'translateX', d: 'dx', gap: 'columnGap' } : { pos: 'top', size: 'height', t: 'translateY', d: 'dy', gap: 'rowGap' };
  function wireGrip(strip, id, row) {
    let rs = null;                                               // { from, mids, step, to }
    const shift = (to) => {
      for (let k = 0; k < rs.rows.length; k++) {
        if (k === rs.from) continue;
        const down = rs.from < to && k > rs.from && k <= to, up = to < rs.from && k >= to && k < rs.from;
        setVar(rs.rows[k], 'transform', down ? `${A.t}(${-rs.step}px)` : up ? `${A.t}(${rs.step}px)` : null);
      }
    };
    const clear = () => { if (!rs) return; for (const r of rs.rows) setVar(r, 'transform', null); rows.classList.remove('sorting'); rs = null; };
    drag(strip.grip, {
      slop: 4,
      onStart() {
        const all = [...rows.children], gap = parseFloat(getComputedStyle(rows)[A.gap]) || 0, boxes = all.map((r) => rect(r));
        const from = all.indexOf(row);
        rs = { rows: all, from, to: from, mids: boxes.map((b) => b[A.pos] + b[A.size] / 2), step: boxes[from][A.size] + gap, mid0: boxes[from][A.pos] + boxes[from][A.size] / 2 };
        row.classList.add('dragging'); rows.classList.add('sorting');
      },
      onMove(s) {
        if (!rs) return;
        setVar(row, 'transform', `${A.t}(${s[A.d]}px)`);
        const centre = rs.mid0 + s[A.d]; let to = rs.from;
        for (let k = 0; k < rs.from; k++) if (centre < rs.mids[k]) { to = k; break; }
        if (to === rs.from) for (let k = rs.rows.length - 1; k > rs.from; k--) if (centre > rs.mids[k]) { to = k; break; }
        if (to !== rs.to) { rs.to = to; shift(to); }
      },
      onEnd() {
        const to = rs ? rs.to : -1;
        row.classList.remove('dragging');
        rows.classList.add('settling');                           // the rows land at once: no glide back from where the hand left them
        clear(); if (to >= 0) move(id, to);
        frame.write(() => rows.classList.remove('settling'));
      },
      onCancel() { row.classList.remove('dragging'); clear(); },
    });
  }
  function keyMove(id) {
    return (name, e) => {
      if (name !== 'grip') return;
      const i = index(id), rtl = X && getComputedStyle(root).direction === 'rtl';
      const back = e.key === 'ArrowUp' || (X && e.key === (rtl ? 'ArrowRight' : 'ArrowLeft')), fwd = e.key === 'ArrowDown' || (X && e.key === (rtl ? 'ArrowLeft' : 'ArrowRight'));
      const to = back ? i - 1 : fwd ? i + 1 : e.key === 'Home' ? 0 : e.key === 'End' ? list.length - 1 : null;
      if (to === null) return;
      e.preventDefault(); e.stopPropagation();
      if (move(id, to)) { const r = recs.get(id); if (r) r.strip.grip.focus(); }
    };
  }
  function buildRow(it, i) {
    const n = i + 1;
    const row = el('div', 'mir-list-item', rows); row.dataset.id = String(it.id);
    const strip = chipStrip({ id: 'list', title: noun, material, chips: [
      { name: 'grip', kind: 'grip', label: [phrase('Reorder {noun} {n} — drag, or the arrow keys'), vars(n)], hint: [phrase('Drag to reorder this {noun}; arrow keys move it'), { noun }] },
      { name: 'remove', kind: 'close', glyph: 'close', label: [phrase('Remove {noun} {n}'), vars(n)], hint: [phrase('Remove this {noun} (tap twice)'), { noun }],
        confirm: { text: phrase('sure?'), ms: armMs, label: [phrase('Remove {noun} {n} — tap again to confirm'), vars(n)] } }],
      onChip: (name) => { if (name === 'remove') remove(it.id); }, onKey: keyMove(it.id) });
    row.appendChild(strip.el);                                  // the DOM keeps the rail first (the grip is the first tab stop); only the grid moves it
    const pane = el('div', 'mir-list-pane mir-lane', row); if (!X) pane.dataset.mirSurface = 'island';
    const made = build ? build(it, i, pane) : null;
    const node = made && made.el ? made.el : made;
    if (node && node.nodeType === 1 && node.parentNode !== pane) pane.appendChild(node);
    recs.set(it.id, { row, pane, strip, content: made && made.el ? made : null });
    wireGrip(strip, it.id, row);
    return row;
  }
  function rebuild() {
    for (const r of recs.values()) disposeRow(r);
    recs.clear(); rows.textContent = '';
    list.forEach((it, i) => buildRow(it, i));
    sync();
  }
  rebuild();

  return {
    root, rows, add: doAdd, move, remove, rebuild,
    items: () => list.slice(),
    setItems(next) { list = next.slice(); rebuild(); },
    nodeOf: (id) => (recs.get(id) ? recs.get(id).pane : null),
    stripOf: (id) => (recs.get(id) ? recs.get(id).strip : null),
    count,
    destroy() { for (const r of recs.values()) disposeRow(r); recs.clear(); root.remove(); },
  };
}
