/* lab/nodes-view.js — NODES' one VIEW (iteration 020 X0, split out of lab/nodes.js; the model is there).  Built twice over one graph: kind
 * 'win' (the MIR window: the free ground — it pans; a card moves by its title bar; the wires are one SVG layer) and kind 'card' (the rack
 * card: the chain as a column, no pan, no drag).  STAGE IN → the nodes → STAGE OUT; THE DEFAULT GRAPH IS EMPTY and says so in one faint line.
 * The + menu is ONE list: a search line (type to filter, Enter adds the first match, Escape closes), the types by class with a hairline
 * divider carrying the class's icon between classes (no word), each item its icon + its name + its cost mark (HEAVY as 019), then a divider
 * and the GRAPHS.  Icons: lab/img/nodes-icons.svg (`<use href="img/nodes-icons.svg#n-<type>">`, currentColor).
 * 020 X1 THE GROUND (the window only; the rack column never zooms or selects): ctrl/⌘ + wheel and a pinch zoom 0.5–2× about the pointer
 * (`scale` on the plane with the pan; the wires, the ports and the dot grid follow), FIT (the button beside +, Home) fits the cards with a
 * 24 px margin; a click on a title selects (shift adds), shift + drag on the empty ground draws a box (a plain drag still pans), Ctrl-A all,
 * Escape none; a selected title drags the whole selection; arrows nudge 1 px (shift 10).  THE KEYS ARE THE GROUND'S: they fire only with the
 * ground focused (tabindex 0) and stop there, so the kit's one key table never sees them — Delete · Ctrl-D · M · Tab / Shift-A · Home ·
 * Ctrl-Z / Ctrl-Shift-Z (NODES' own ring, lab/nodes-undo.js).
 * 020 X2 THE CARD: the chevron (H) collapses a card to its bar and its PREVIEW strip, COLLAPSE ALL / EXPAND ALL at the head; a double-click
 * on the title RENAMES it (Enter / Escape; empty = the type's name); every TABLE and MATRIX card draws a 128 × 10 strip — a grey ramp and a
 * hue ramp through the node's OWN transfer (nodes-compile.js transfer(): the compiler's fn / matrix), redrawn when its values move; the
 * right-click menus (a card's, the ground's) and TIDY (the cards back in one column, in list order).
 *   createView(parent, kind, M) → { view, widget(id, k), paint(q, k, v, shown), foot(), sync(), place() }   M: the model's door (nodes.js) */
import { el, svgEl, label, ariaLabel, chip } from './mir/kit.js';
import { nodeBody } from './node-types.js';
import { transfer } from './nodes-compile.js';
import { frame } from './mir/core/frame.js';

const AT = { in: [65, 16] };                                         // STAGE IN's first-run place; the nodes stack under it, STAGE OUT under the last
const SPAN = 250;                                                    // the column's width, centred in a view that has no pan of its own yet
const GAP = 36;
const NOTE = 'Grades the screen only — pictures and films are untouched.';
const MARK = { table: '·', matrix: '·', prim: '···', layer: '··' };       // THE COST IS ON THE CARD: · folds for free, ·· a layer, ··· a pass
const CLASSES = ['table', 'matrix', 'prim', 'layer'];
const NS = 'http://www.w3.org/2000/svg';
const hueAt = (h) => [Math.abs(h * 6 - 3) - 1, 2 - Math.abs(h * 6 - 2), 2 - Math.abs(h * 6 - 4)].map((x) => Math.min(1, Math.max(0, x)));
const ZOOM = [0.5, 2], clampZ = (z) => Math.min(ZOOM[1], Math.max(ZOOM[0], z));
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
  const cards = {}, ro = new ResizeObserver(() => wires()), sel = new Set();
  let pan = [0, 0], z = 1;
  /** the view: the pan (px) and the zoom; the dot grid follows both */
  const setPan = (p, zz = z) => { pan = p; z = zz; plane.style.translate = p[0] + 'px ' + p[1] + 'px'; plane.style.scale = z;
    ground.style.backgroundPosition = p[0] + 'px ' + p[1] + 'px'; ground.style.backgroundSize = 22 * z + 'px ' + 22 * z + 'px'; };
  const keep = () => M.put({ pan: { ...(M.rec().pan || {}), [kind]: pan }, ...(W ? { zoom: z } : {}) });
  /** zoom to zz about the ground point p (px): the plane point under it stays */
  const zoomAt = (zz, p, base = pan, z0 = z) => { zz = clampZ(zz); setPan([p[0] - ((p[0] - base[0]) * zz) / z0, p[1] - ((p[1] - base[1]) * zz) / z0], zz); };
  const local = (e) => { const r = ground.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  /** FIT: the cards' bounding box in the ground, a 24 px margin, the zoom clamped */
  function fit() {
    const B = Object.values(cards).map(({ c }) => [c.offsetLeft, c.offsetTop, c.offsetLeft + c.offsetWidth, c.offsetTop + c.offsetHeight]);
    const x0 = Math.min(...B.map((b) => b[0])), y0 = Math.min(...B.map((b) => b[1])), x1 = Math.max(...B.map((b) => b[2])), y1 = Math.max(...B.map((b) => b[3]));
    const gw = ground.clientWidth, gh = ground.clientHeight, zz = clampZ(Math.min((gw - 48) / (x1 - x0), (gh - 48) / (y1 - y0)));
    setPan([(gw - (x1 - x0) * zz) / 2 - x0 * zz, (gh - (y1 - y0) * zz) / 2 - y0 * zz], zz); keep();
  }
  const paintSel = () => { for (const [id, n] of Object.entries(cards)) n.c.classList.toggle('sel', sel.has(id)); };
  const pick = (ids, add) => { if (!add) sel.clear(); for (const id of ids) sel.add(id); paintSel(); };
  const xy = (c) => [parseFloat(c.style.left) || 0, parseFloat(c.style.top) || 0];
  const at = () => Object.fromEntries(M.list().filter((q) => cards[q.id]).map((q) => [q.id, xy(cards[q.id].c)]));
  /** a card moved: every node takes the place it shows (the model re-sorts the list by top → bottom) */
  const moved = (nudge) => M.moved(at(), { in: xy(cards.in.c), out: xy(cards.out.c) }, nudge);
  const node = (id, title, ins, outs, glyph, mark) => {
    const c = el('div', 'nodes-card', plane); c.dataset.node = id;
    const bar = el('div', 'nodes-title', c); icon(bar, glyph); const name = label(el('span', 'nodes-name', bar), title); if (mark) el('i', 'nodes-mark', bar, mark);
    if (ins) el('i', 'nodes-port in', c); if (outs) el('i', 'nodes-port out', c);
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
  /** a node's card: its bar (the chevron, its icon, the title, the cost mark, × BYPASS, the bin), the PREVIEW strip of a TABLE or MATRIX
      node, and its body (CURVES, or the type's knobs) */
  function make(q) {
    const t = T[q.type], n = node(q.id, t.label, true, true, q.type, MARK[t.cls]);
    n.c.dataset.type = q.type; n.c.title = t.hint || '';
    const v = el('button', 'nodes-chev', null); v.type = 'button'; chip(v, 'chevronDown', 'COLLAPSE'); n.bar.prepend(v); v.addEventListener('click', () => M.setFold(q.id, !q.fold));
    if (!W) n.name.addEventListener('dblclick', () => renameAt(q.id));
    n.c.addEventListener('contextmenu', (e) => { e.stopPropagation(); popup(e, cardRows(q)); });
    if (t.cls === 'table' || t.cls === 'matrix') { n.strip = el('canvas', 'nodes-strip'); n.strip.width = 128; n.strip.height = 10; n.c.insertBefore(n.strip, n.body); api.strip(q); }
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
  /** RENAME: the title becomes a line; Enter keeps it, Escape (or leaving it) does not; empty = the type's name */
  function renameAt(id) {
    const n = cards[id], q = M.byId(id); if (!n || !q || n.c.querySelector('.nodes-rename')) return;
    const f = el('input', 'nodes-rename sp-prename', null); f.type = 'text'; f.maxLength = 40; ariaLabel(f, 'node name'); f.value = q.name || T[q.type].label;
    n.name.hidden = true; n.name.after(f);
    let done = false; const end = (keep) => { if (done) return; done = true; f.remove(); n.name.hidden = false; if (keep) M.rename(id, f.value === T[q.type].label ? '' : f.value); if (W) ground.focus({ preventScroll: true }); };
    f.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); end(true); } else if (e.key === 'Escape') { e.preventDefault(); end(false); } });
    f.addEventListener('blur', () => end(false)); f.focus(); f.select();
  }
  /* THE RIGHT-CLICK MENUS: rows [word, run] (null = a divider), at the pointer, inside the ground */
  const pop = el('div', 'nodes-menu nodes-pop', ground); pop.hidden = true;
  function popup(e, rows) {
    e.preventDefault(); menu.hidden = true; pop.replaceChildren();
    for (const r of rows) if (!r) el('div', 'nodes-sep', pop); else { const b = el('button', 'nodes-item', pop); b.type = 'button'; label(el('span', '', b), r[0]); if (r[2]) b.setAttribute('aria-pressed', 'true');
      b.addEventListener('click', () => { pop.hidden = true; r[1](); }); }
    pop.hidden = false; const [x, y] = local(e);
    pop.style.left = Math.max(4, Math.min(x, ground.clientWidth - pop.offsetWidth - 4)) + 'px'; pop.style.top = Math.max(4, Math.min(y, ground.clientHeight - pop.offsetHeight - 4)) + 'px';
  }
  pop.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape') pop.hidden = true; });
  ground.addEventListener('pointerdown', (e) => { if (!pop.contains(e.target)) pop.hidden = true; }, true);
  const folded = () => M.list().length > 0 && M.list().every((q) => q.fold);
  const foldAll = () => M.setFold(M.list().map((q) => q.id), !folded());
  const cardRows = (q) => [['BYPASS', () => M.setBypass(q.id, !q.bypass), q.bypass], [q.fold ? 'EXPAND' : 'COLLAPSE', () => M.setFold(q.id, !q.fold)],
    ['DUPLICATE', () => pick(M.duplicate(q.id, at()))], ['RENAME', () => renameAt(q.id)], ['RESET', () => M.reset(q.id)], null,
    ['MOVE UP', () => M.move(q.id, -1)], ['MOVE DOWN', () => M.move(q.id, 1)], null, ['REMOVE', () => M.remove(q.id)]];
  const groundRows = () => [['ADD…', () => openMenu(true)], W && ['FIT', () => fit()], ['TIDY', () => M.tidy()], [folded() ? 'EXPAND ALL' : 'COLLAPSE ALL', foldAll]].filter((r) => r !== false);
  ground.addEventListener('contextmenu', (e) => popup(e, groundRows()));
  if (!W) ground.classList.add('nodes-column');
  else {
    /* THE GROUND'S HAND: a drag pans, shift + drag draws a box, two fingers pinch; ctrl/⌘ + wheel zooms about the pointer */
    ground.tabIndex = 0;
    const box = el('div', 'nodes-box', ground), pts = new Map();
    let drag = null, pinch = null;
    const span = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    ground.addEventListener('pointerdown', (e) => {
      if (!(e.target === ground || e.target === plane || e.target === svg)) return;
      ground.focus({ preventScroll: true }); menu.hidden = true; pts.set(e.pointerId, local(e));
      if (pts.size === 2) { const [a, b] = pts.values(); pinch = { d: span(a, b), m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], pan, z }; drag = null; return; }
      if (e.button !== 0) return;
      e.preventDefault(); try { ground.setPointerCapture(e.pointerId); } catch (_) { /* a pointer already gone */ }
      drag = { p: local(e), pan, box: e.shiftKey };
    });
    ground.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, local(e));
      if (pinch && pts.size === 2) { const [a, b] = pts.values(); zoomAt(pinch.z * (span(a, b) / pinch.d), pinch.m, pinch.pan, pinch.z); return; }
      if (!drag) return;
      const p = local(e), d = [p[0] - drag.p[0], p[1] - drag.p[1]];
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
      box.style.display = 'none'; drag = null;
    };
    ground.addEventListener('pointerup', up); ground.addEventListener('pointercancel', up);
    ground.addEventListener('wheel', (e) => { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault();
      zoomAt(z * Math.exp(-e.deltaY * (e.deltaMode ? 16 : 1) * 0.002), local(e)); keep(); }, { passive: false });
    /* THE KEYS ARE THE GROUND'S */
    ground.addEventListener('keydown', (e) => {
      if (e.target !== ground) return;
      e.stopPropagation();
      const k = e.key, c = e.ctrlKey || e.metaKey, ids = [...sel], L = M.list();
      const nudge = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[k];
      if (nudge && ids.length) { for (const id of ids) { const n = cards[id].c, p = xy(n), s = e.shiftKey ? 10 : 1; n.style.left = p[0] + nudge[0] * s + 'px'; n.style.top = p[1] + nudge[1] * s + 'px'; } moved(true); }
      else if (k === 'Delete' || k === 'Backspace') { M.remove(ids); sel.clear(); }
      else if (c && /^[dD]$/.test(k)) pick(M.duplicate(ids, at()));
      else if (c && /^[aA]$/.test(k)) pick(L.map((q) => q.id));
      else if (c && /^[zZ]$/.test(k)) { if (e.shiftKey) M.redo(); else M.undo(); }
      else if (c && /^[yY]$/.test(k)) M.redo();
      else if (!c && /^[mM]$/.test(k) && ids.length) M.setBypass(ids, ids.some((id) => !M.byId(id).bypass));
      else if (!c && /^[hH]$/.test(k) && ids.length) M.setFold(ids, ids.some((id) => !M.byId(id).fold));
      else if (k === 'Tab' || (k === 'A' && e.shiftKey && !c)) openMenu(true);
      else if (k === 'Home') fit();
      else if (k === 'Escape') { if (!menu.hidden || !pop.hidden) menu.hidden = pop.hidden = true; else pick([]); }
      else return;
      e.preventDefault();
    });
  }

  /* + : ONE list — the search line, the classes split by an icon divider, then the GRAPHS; the view's other door: the window ↔ the rack card */
  const tools = el('div', 'nodes-tools', ground), tool = (cls, g, word, run) => { const b = el('button', cls, tools); b.type = 'button'; chip(b, g, word); b.addEventListener('click', run); return b; };
  tool('nodes-add', 'plus', 'ADD NODE', () => openMenu(true));
  if (W) tool('nodes-fit', 'home', 'FIT — every card in view (Home)', () => fit());
  const foldB = tool('nodes-folds', 'compact', 'COLLAPSE ALL', () => foldAll());
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
      else if (e.key === 'Escape') { e.preventDefault(); menu.hidden = true; if (W) ground.focus({ preventScroll: true }); } });
    return find;
  }
  /** open (or shut) the + menu; `focus` puts the caret on its search line */
  const openMenu = (focus) => { if (!menu.hidden) { menu.hidden = true; return; } const f = fill(); menu.hidden = false; if (focus) f.focus(); };
  const foot = el('div', 'nodes-passes', ground);
  const door = el('button', 'nodes-door', ground); door.type = 'button';
  chip(door, W ? 'dock' : 'popOut', W ? 'DOCK IN THE RACK' : 'OPEN AS A WINDOW'); door.addEventListener('click', () => M.door(kind));
  if (!W) label(el('div', 'note', parent), NOTE);                   // the card's one line (window notes are a SETTINGS choice)
  const api = {
    get view() { return cards.curves && cards.curves.view; },
    widget: (id, k) => { const n = cards[id]; return n && n.ctl && n.ctl.ctls[k] ? n.ctl.ctls[k].targets[0] || null : null; },
    paint(q, k, v, shown) { const n = cards[q.id]; if (n && n.ctl) n.ctl.paint(k, v, shown); },
    /** the PREVIEW strip: a grey ramp over a hue ramp, each of the 128 columns through the node's own transfer (coalesced on the frame) */
    strip(q) { const n = cards[q.id]; if (!n || !n.strip) return; frame.coalesce('nodes.strip.' + kind + '.' + q.id, () => {
      const f = transfer(q, T[q.type]), g = n.strip.getContext('2d'), im = g.createImageData(128, 10);
      for (let i = 0; i < 128; i++) { const s = i / 127, rows = [f([s, s, s]), f(hueAt(i / 128))];
        for (let y = 0; y < 10; y++) { const c = rows[y < 5 ? 0 : 1], o = (y * 128 + i) * 4; im.data[o] = c[0] * 255; im.data[o + 1] = c[1] * 255; im.data[o + 2] = c[2] * 255; im.data[o + 3] = 255; } }
      g.putImageData(im, 0, 0); }); },
    /** the graph's foot: what the graph costs — filter primitives + layers */
    foot() { const p = M.passes(); if (p === 1) label(foot, '1 pass'); else label(foot, '{n} passes', { n: p }); },
    /** the cards follow the list: a new node gets its card, a removed one loses it */
    sync(rebuild) {
      const L = M.list();
      for (const id of Object.keys(cards)) if (id !== 'in' && id !== 'out' && (rebuild || !M.byId(id))) { sel.delete(id); ro.unobserve(cards[id].c); if (cards[id].view) cards[id].view.destroy(); cards[id].c.remove(); delete cards[id]; }
      for (const q of L) { if (!cards[q.id]) make(q); const n = cards[q.id]; n.c.classList.toggle('off', q.bypass); n.bar.querySelector('.nodes-x').setAttribute('aria-pressed', String(q.bypass));
        n.c.classList.toggle('fold', q.fold); n.bar.querySelector('.nodes-chev').setAttribute('aria-expanded', String(!q.fold));
        if (q.name) { label(n.name, ''); n.name.textContent = q.name; } else label(n.name, T[q.type].label); }
      chip(foldB, folded() ? 'expand' : 'compact', folded() ? 'EXPAND ALL' : 'COLLAPSE ALL');
      paintSel(); api.place();
    },
    place() {
      const L = M.list(); menu.hidden = pop.hidden = true; api.foot(); empty.hidden = L.length > 0;
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
