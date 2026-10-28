/* lab/nodes-view.js — NODES' one VIEW (iteration 020 X0, split out of lab/nodes.js; the model is there).  Built twice over one graph: kind
 * 'win' (the MIR window: the free ground — it pans; a card moves by its title bar; the wires are one SVG layer) and kind 'card' (the rack
 * card: the chain as a column, no pan, no drag).  STAGE IN → the nodes → STAGE OUT; THE DEFAULT GRAPH IS EMPTY and says so in one faint line.
 * The + menu is ONE list: a search line (type to filter, Enter adds the first match, Escape closes), the types by class with a hairline
 * divider carrying the class's icon between classes (no word), each item its icon + its name + its cost mark (HEAVY as 019), then a divider
 * and the GRAPHS.  Icons: lab/img/nodes-icons.svg (`<use href="img/nodes-icons.svg#n-<type>">`, currentColor).
 *   createView(parent, kind, M) → { view, widget(id, k), paint(q, k, v, shown), foot(), sync(), place() }   M: the model's door (nodes.js) */
import { el, svgEl, label, ariaLabel, chip } from './mir/kit.js';
import { nodeBody } from './node-types.js';

const AT = { in: [65, 16] };                                         // STAGE IN's first-run place; the nodes stack under it, STAGE OUT under the last
const SPAN = 250;                                                    // the column's width, centred in a view that has no pan of its own yet
const GAP = 36;
const NOTE = 'Grades the screen only — pictures and films are untouched.';
const MARK = { table: '·', matrix: '·', prim: '···', layer: '··' };       // THE COST IS ON THE CARD: · folds for free, ·· a layer, ··· a pass
const CLASSES = ['table', 'matrix', 'prim', 'layer'];
const NS = 'http://www.w3.org/2000/svg';
/** one icon of the sprite, first or last in `parent` */
const icon = (parent, name, first) => { const s = svgEl('svg', 'nodes-ico'); s.setAttribute('viewBox', '0 0 16 16'); s.setAttribute('aria-hidden', 'true');
  svgEl('use', null, s).setAttribute('href', 'img/nodes-icons.svg#n-' + name); if (first) parent.prepend(s); else parent.appendChild(s); return s; };

/** a press-and-drag on `handle`: start() → the base, move(base, dx, dy), end() — the pointer captured, a cancel ends it too */
const grab = (handle, ok, start, move, end) => handle.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 || !ok(e)) return;
  e.preventDefault(); handle.setPointerCapture(e.pointerId);
  const x0 = e.clientX, y0 = e.clientY, base = start(e);
  const mv = (ev) => move(base, ev.clientX - x0, ev.clientY - y0);
  const up = () => { for (const [t, f] of [['pointermove', mv], ['pointerup', up], ['pointercancel', up]]) handle.removeEventListener(t, f); end(base); };
  for (const [t, f] of [['pointermove', mv], ['pointerup', up], ['pointercancel', up]]) handle.addEventListener(t, f);
});

export function createView(parent, kind, M) {
  const W = kind === 'win', T = M.TYPES;
  const ground = el('div', 'nodes-ground', parent), plane = el('div', 'nodes-plane', ground);
  const svg = plane.appendChild(document.createElementNS(NS, 'svg')); svg.setAttribute('class', 'nodes-wires');
  const empty = el('div', 'nodes-empty', plane); label(empty, 'Hit + to add a node');
  const cards = {}, ro = new ResizeObserver(() => wires());
  let pan = null;
  const setPan = (p) => { pan = p; plane.style.translate = p[0] + 'px ' + p[1] + 'px'; ground.style.backgroundPosition = p[0] + 'px ' + p[1] + 'px'; };
  const xy = (c) => [parseFloat(c.style.left) || 0, parseFloat(c.style.top) || 0];
  /** a card moved: every node takes the place it shows (the model re-sorts the list by top → bottom) */
  const moved = () => M.moved(Object.fromEntries(M.list().filter((q) => cards[q.id]).map((q) => [q.id, xy(cards[q.id].c)])), { in: xy(cards.in.c), out: xy(cards.out.c) });
  const node = (id, title, ins, outs, glyph, mark) => {
    const c = el('div', 'nodes-card', plane); c.dataset.node = id;
    const bar = el('div', 'nodes-title', c); icon(bar, glyph); const name = label(el('span', 'nodes-name', bar), title); if (mark) el('i', 'nodes-mark', bar, mark);
    if (ins) el('i', 'nodes-port in', c); if (outs) el('i', 'nodes-port out', c);
    if (W) grab(bar, (e) => !e.target.closest('button'), () => xy(c), (b, dx, dy) => { c.style.left = b[0] + dx + 'px'; c.style.top = b[1] + dy + 'px'; wires(); }, moved);
    ro.observe(c);
    return cards[id] = { c, bar, name, body: el('div', 'nodes-body', c) };
  };
  label(node('in', 'STAGE IN', false, true, 'in').body, 'the stage picture');
  label(node('out', 'STAGE OUT', true, false, 'out').body, 'the screen');
  /** a node's card: its bar (its icon, the title, the cost mark, × BYPASS, the bin) and its body (CURVES, or the type's knobs) */
  function make(q) {
    const t = T[q.type], n = node(q.id, t.label, true, true, q.type, MARK[t.cls]);
    n.c.dataset.type = q.type; n.c.title = t.hint || '';
    const x = el('button', 'nodes-x', n.bar); x.type = 'button'; chip(x, 'close', 'BYPASS NODE'); x.addEventListener('click', () => M.setBypass(q.id, !q.bypass));
    const b = el('button', 'nodes-rm', n.bar); b.type = 'button'; chip(b, 'clear', 'REMOVE NODE'); b.addEventListener('click', () => M.remove(q.id));
    if (q.type === 'curves') n.view = M.curvesIn(n.body);
    else { n.body.classList.add('nodes-knobs'); n.ctl = nodeBody(n.body, q, t, { idOf: (k) => M.ID(q, k), hand: (k, v) => M.hand(q, k, v) }); }
    plane.insertBefore(n.c, cards.out.c);
  }
  /** the wires: each node's out port (the bottom's middle) to the next one's in port (the top's middle), a cubic as a network draws it */
  function wires() {
    if (!W) return;                                                 // the rack card is a column: its ports meet, no wire to draw
    const mid = (id, end) => { const c = cards[id].c; return [c.offsetLeft + c.offsetWidth / 2, c.offsetTop + (end ? c.offsetHeight : 0)]; };
    const ids = ['in', ...M.list().map((q) => q.id), 'out'];
    svg.replaceChildren(...ids.slice(1).map((b, i) => { const [x1, y1] = mid(ids[i], true), [x2, y2] = mid(b, false), d = Math.max(30, Math.abs(y2 - y1) / 2);
      const p = document.createElementNS(NS, 'path'); p.setAttribute('d', `M${x1} ${y1} C${x1} ${y1 + d} ${x2} ${y2 - d} ${x2} ${y2}`); return p; }));
  }
  if (!W) ground.classList.add('nodes-column');
  grab(ground, (e) => W && (e.target === ground || e.target === plane || e.target === svg), () => pan, (b, dx, dy) => setPan([b[0] + dx, b[1] + dy]),
    () => M.put({ pan: { ...(M.rec().pan || {}), [kind]: pan } }));

  /* + : ONE list — the search line, the classes split by an icon divider, then the GRAPHS; the view's other door: the window ↔ the rack card */
  const addB = el('button', 'nodes-add', ground); addB.type = 'button'; chip(addB, 'plus', 'ADD NODE');
  const menu = el('div', 'nodes-menu', ground); menu.hidden = true;
  const sep = (cls) => { const s = el('div', 'nodes-sep', menu); if (cls) icon(s, cls); return s; };
  const item = (text, title, run, cls = 'nodes-item') => { const it = el('button', cls, menu); it.type = 'button'; label(el('span', '', it), text); it.title = title;
    it.addEventListener('click', () => { menu.hidden = true; run(); }); return it; };
  function fill() {
    menu.replaceChildren();
    const find = el('input', 'nodes-find', menu); find.type = 'search'; find.placeholder = 'search'; ariaLabel(find, 'find a node');
    for (const cls of CLASSES) {
      sep(cls);
      for (const [type, t] of Object.entries(T)) if (t.cls === cls) {
        const it = item(t.label, t.label + ' — ' + t.hint, () => M.add(type)); it.dataset.type = type; icon(it, type, true);
        el('i', 'nodes-mark', it, MARK[cls]); if (t.heavy) label(el('i', 'nodes-heavy', it), 'HEAVY');
        if (type === 'curves') it.disabled = M.has();
      }
    }
    sep(); label(el('div', 'nodes-head', menu), 'GRAPHS');
    for (const [name, list] of Object.entries(M.SHIPPED)) item(name, name + ' — a shipped graph: every node but CURVES replaced', () => M.applyGraph(list)).dataset.graph = name;
    for (const u of M.graphs.list()) { const it = item(u.name, u.name + ' — your graph', () => M.applyGraph(u.data && u.data.nodes)); it.dataset.graph = 'user:' + u.name;
      const x = el('span', 'sp-prex', it, '×'); x.setAttribute('role', 'button'); ariaLabel(x, 'remove {name}', { name: u.name });
      x.addEventListener('click', (e) => { e.stopPropagation(); M.graphs.remove(u.name); fill(); }); }
    const sv = item('SAVE THIS GRAPH', 'SAVE · the nodes as your own graph (kept on this device)', () => {}, 'nodes-item nodes-save');
    sv.addEventListener('click', (e) => { e.stopImmediatePropagation();
      const f = el('input', 'sp-prename', null); f.type = 'text'; f.maxLength = 40; ariaLabel(f, 'graph name'); f.value = 'My graph'; sv.replaceWith(f);
      let done = false; const end = (keep) => { if (done) return; done = true; const n = f.value.trim(); if (keep && n) M.graphs.add(n, { nodes: M.graphOf() }); fill(); };
      f.addEventListener('keydown', (ev) => { ev.stopPropagation(); if (ev.key === 'Enter') { ev.preventDefault(); end(true); } else if (ev.key === 'Escape') { ev.preventDefault(); end(false); } });
      f.addEventListener('blur', () => end(false)); f.focus(); f.select(); }, true);
    /* the search: every row whose name holds the words; the dividers and GRAPHS' head step aside while a search is typed */
    const shown = () => [...menu.querySelectorAll('.nodes-item')].filter((i) => !i.hidden && !i.disabled);
    find.addEventListener('input', () => { const s = find.value.trim().toUpperCase();
      for (const i of menu.querySelectorAll('.nodes-item')) i.hidden = !!s && !i.textContent.toUpperCase().includes(s);
      for (const h of menu.querySelectorAll('.nodes-sep, .nodes-head')) h.hidden = !!s; });
    find.addEventListener('keydown', (e) => { e.stopPropagation();
      if (e.key === 'Enter') { e.preventDefault(); const f = shown()[0]; if (f) f.click(); }
      else if (e.key === 'Escape') { e.preventDefault(); menu.hidden = true; ground.focus({ preventScroll: true }); } });
    return find;
  }
  /** open (or shut) the + menu; `focus` puts the caret on its search line */
  const openMenu = (focus) => { if (!menu.hidden) { menu.hidden = true; return; } const f = fill(); menu.hidden = false; if (focus) f.focus(); };
  addB.addEventListener('click', () => openMenu(true));
  const foot = el('div', 'nodes-passes', ground);
  const door = el('button', 'nodes-door', ground); door.type = 'button';
  chip(door, W ? 'dock' : 'popOut', W ? 'DOCK IN THE RACK' : 'OPEN AS A WINDOW'); door.addEventListener('click', () => M.door(kind));
  if (!W) label(el('div', 'note', parent), NOTE);                   // the card's one line (window notes are a SETTINGS choice)
  const api = {
    get view() { return cards.curves && cards.curves.view; },
    widget: (id, k) => { const n = cards[id]; return n && n.ctl && n.ctl.ctls[k] ? n.ctl.ctls[k].targets[0] || null : null; },
    paint(q, k, v, shown) { const n = cards[q.id]; if (n && n.ctl) n.ctl.paint(k, v, shown); },
    /** the graph's foot: what the graph costs — filter primitives + layers */
    foot() { const p = M.passes(); if (p === 1) label(foot, '1 pass'); else label(foot, '{n} passes', { n: p }); },
    /** the cards follow the list: a new node gets its card, a removed one loses it */
    sync() {
      const L = M.list();
      for (const id of Object.keys(cards)) if (id !== 'in' && id !== 'out' && !M.byId(id)) { ro.unobserve(cards[id].c); if (cards[id].view) cards[id].view.destroy(); cards[id].c.remove(); delete cards[id]; }
      for (const q of L) { if (!cards[q.id]) make(q); cards[q.id].c.classList.toggle('off', q.bypass); cards[q.id].bar.querySelector('.nodes-x').setAttribute('aria-pressed', String(q.bypass)); }
      api.place();
    },
    place() {
      const L = M.list(); menu.hidden = true; api.foot(); empty.hidden = L.length > 0;
      if (!W) { plane.append(cards.in.c, empty, ...L.map((q) => cards[q.id].c), cards.out.c); return; }   // the rack card: the chain as a column, in order
      const set = (n, l, t) => { n.style.left = l + 'px'; n.style.top = t + 'px'; };
      const A = M.rec().at || {}, pin = A.in || AT.in;
      set(cards.in.c, pin[0], pin[1]);
      let y = pin[1] + cards.in.c.offsetHeight + GAP;
      if (!L.length) { set(empty, pin[0] + cards.in.c.offsetWidth / 2, y - GAP / 2 + 6); y += GAP; }
      for (const q of L) { const n = cards[q.id], p = q.at || [Math.round((SPAN - n.c.offsetWidth) / 2), y]; set(n.c, p[0], p[1]); y = Math.max(y, p[1] + n.c.offsetHeight + GAP); }
      const po = A.out || [pin[0], y]; set(cards.out.c, po[0], Math.max(po[1], y));
      const p = (M.rec().pan || {})[kind]; setPan(Array.isArray(p) ? p : [Math.round((ground.clientWidth - SPAN) / 2), 0]);
      wires();
    },
  };
  api.sync();
  return api;
}
