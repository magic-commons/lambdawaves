/* lab/nodes.js — NODES (iteration 018 D3; 019 N1–N5).  Josh (2026-10-27): "let 'CURVES' be part of a new window of the MIR class … called
 * 'NODES'. Similar to how Houdini 'Copernicus' works and the philosophy of Houdini but our own flavor".  A graph of operators over the stage
 * picture, flowing top → bottom as a Houdini network does: STAGE IN → the nodes, in order → STAGE OUT.  THE GRAPH COMPILES (019 N1,
 * lab/nodes-compile.js) to the kit's one picture filter (`setChain`, kit alpha.33): TABLE and MATRIX nodes fold into it for free, a PRIMITIVE
 * is a real pass, a LAYER sits over the stage; a neutral or bypassed node emits nothing.  The order is the graph's top → bottom: a node dragged
 * above another runs before it.  Drag the ground to pan; a node moves by its title bar; the wires are one SVG layer; + adds a node (019 N2:
 * lab/node-types.js); × on a bar bypasses it (it emits nothing and keeps its values), and a bypassed node's bin removes it.  CURVES is the
 * kit's curves panel (one, never removed: its × bypasses it, as 018's did).  Every node knob is a MIR control routed like any other dial
 * (target ids `nodes.<node>.<knob>`, stable).  Two live views of one graph, as FOLDERS has two of one library: the MIR-class floating window
 * `nodes` (kit createWindow, chrome 'close') and the rack card `nodes` (the CURVES card retired into it: settings.js RETIRED_WINDOWS curves →
 * nodes).  The grade is PREFERENCE `lambdawaves.q0.curves` as before; the reader's curves `lambdawaves.q0.curvePresets` (018 D2); the graph —
 * the node list (type, values, bypass, place), each view's pan, the window's shape — PREFERENCE `lambdawaves.q0.nodes` (018's one-node record,
 * `curves: false` and `at.curves`, still opens).
 *   createNodes({ device, rk, raise, host, canvas, curvesStore, occlusion, after, mod }) → { model, filter, nodes(), add(type), remove(id),
 *     setBypass(id, on), set(id, knob, value), passes(), compile(), win, views, open(), close(), has(), setHas(on) } */
import { el, label, ariaLabel, chip } from './mir/kit.js';
import { createWindow } from './mir/window/window.js';
import { createCurvesPanel, createCurvesView, isIdentity } from './mir/panels/curves.js';
import { pictureFilter, lookup } from './mir/panels/picture-filter.js';
import { frame } from './mir/core/frame.js';
import { compile } from './nodes-compile.js';
import { TABLE_TYPES, MATRIX_TYPES, homeOf, isNeutral, nodeBody } from './node-types.js';
import { jsonStore } from './mir/core/prefs.js';
import { createUserPresets } from './user-presets.js';
import { paintedRect } from './occlusion.js';

const AT = { in: [65, 16] };                                         // STAGE IN's first-run place; the nodes stack under it, STAGE OUT 36 px under the last
const SPAN = 250;                                                    // the column's width, centred in a view that has no pan of its own yet
const GAP = 36;
const NOTE = 'Grades the screen only — pictures and films are untouched.';

export function createNodes({ device, rk, raise, host, canvas, curvesStore, occlusion, after, mod }) {
  const store = jsonStore('lambdawaves.q0.nodes');
  const rec = () => { const r = store.get(); return r && r.v === 1 ? r : { v: 1 }; };
  const put = (patch) => store.set({ ...rec(), ...patch });
  const views = [];

  /* the reader's curves (018 D2, the PALETTE way): USER · theirs · PRESETS in the kit's PRESET stepper while one exists */
  const users = createUserPresets('lambdawaves.q0.curvePresets'), CU = 'user:';
  const presets = () => { const U = users.list().filter((u) => u.data && Array.isArray(u.data.points) && u.data.points.length >= 2).map((u) => ({ id: CU + u.name, label: u.name, points: u.data.points }));
    return U.length ? [{ id: '#user', label: 'USER', coming: true }, ...U, { id: '#built', label: 'PRESETS', coming: true }] : []; };

  /* 019 N1 · THE COMPILER: CURVES hands its tables to the graph (a `port`), not to the filter: it is a TABLE node like any other, and alone it
     compiles to the byte-identical filter 018 wrote.  One compile and one filter write per frame, whatever moved */
  const filter = pictureFilter(canvas), cache = new Map();
  let passes = 0, nodes = [];
  const recompile = () => frame.coalesce('nodes.compile', () => { const c = compile(nodes, TYPES, cache); passes = c.passes; filter.setChain(c.runs).flush(); });
  const panel = createCurvesPanel({ port: { setTable() { const q = nodes.find((n) => n.type === 'curves'); if (q) q.v++; recompile(); } }, project: false, presets }), model = panel.model;
  const curveTables = () => Object.fromEntries(model.channels.map((ch) => [ch, isIdentity(model.points(ch)) || model.amount() === 0 ? null : Float32Array.from(model.table(ch))]));
  const TYPES = {
    curves: { cls: 'table', label: 'CURVES', hint: 'a transfer curve per channel, as Photoshop draws it', knobs: [],
      neutral: () => model.amount() === 0 || model.channels.every((ch) => isIdentity(model.points(ch))),
      fn: () => { const T = curveTables(); return (y, ch) => { if (T.MASTER) y = lookup(T.MASTER, y); if (T[ch]) y = lookup(T[ch], y); return y; }; } },
    ...TABLE_TYPES, ...MATRIX_TYPES,
  };

  /* THE LIST: the graph record's nodes, or 018's one-node graph (CURVES, `curves: false` = bypassed) */
  const fresh = (id, type, o = {}) => ({ id, type, bypass: !!o.bypass, at: Array.isArray(o.at) ? o.at : null, values: { ...homeOf(TYPES[type]), ...(o.values || {}) }, v: 0 });
  function load() {
    const r = rec(), L = (Array.isArray(r.list) ? r.list : []).filter((q) => q && /^[a-z][a-z0-9]*$/.test(q.id) && TYPES[q.type]).map((q) => fresh(q.id, q.type, q));
    if (!L.some((q) => q.type === 'curves')) L.unshift(fresh('curves', 'curves', { bypass: r.curves === false, at: (r.at || {}).curves }));
    return L;
  }
  nodes = load();
  const byId = (id) => nodes.find((q) => q.id === id);
  const curvesNode = () => byId('curves') || nodes.find((q) => q.type === 'curves');
  const has = () => !curvesNode().bypass;
  let saving = 0, savingList = 0;
  const saveList = (now) => { clearTimeout(savingList); const w = () => put({ list: nodes.map(({ id, type, values, bypass, at }) => ({ id, type, values, bypass, at })) }); if (now) w(); else savingList = setTimeout(w, 250); };
  model.restore(curvesStore.get());
  model.onChange(() => { clearTimeout(saving); saving = setTimeout(() => curvesStore.set(model.serialize()), 250); });

  /* MODULATION: every number knob is a target `nodes.<node>.<knob>` through the runtime door (LW.mod.register); a hand on a ROUTED knob moves
     its BASE (the registry's), a modulator's write is PAINTED (show), as every rack dial (mod-port.js) */
  const ID = (q, k) => 'nodes.' + q.id + '.' + k;
  const routed = (id) => !!(mod && mod.registry && mod.registry.has(id) && mod.registry.isModulated(id));
  const knobsOf = (q) => TYPES[q.type].knobs.filter((K) => !K.colour && !K.options);
  const knobOf = (q, k) => { for (const v of views) { const w = v.widget(q.id, k); if (w) return w; } return null; };
  function enroll(q) {
    if (!mod || !mod.register) return;
    const T = TYPES[q.type];
    for (const K of knobsOf(q)) try {
      mod.register(ID(q, K.k), { label: T.label + ' ' + K.label, min: K.min, max: K.max, step: K.step || 0, map: K.log ? 'log' : K.step === 1 ? 'integer' : 'linear', unit: K.unit, hint: K.hint || T.hint,
        def: K.home, group: 'nodes', get: () => q.values[K.k], set: (v) => setValue(q, K.k, v, 'mod'), knob: () => knobOf(q, K.k) });
    } catch (e) { console.warn('NODES: a knob is no target', e); }
  }
  const unenroll = (q) => { if (mod && mod.unregister) for (const K of knobsOf(q)) mod.unregister(ID(q, K.k)); };
  function setValue(q, k, v, from) {
    if (q.values[k] === v) return;
    q.values[k] = v; q.v++; recompile();
    const shown = from === 'mod' && routed(ID(q, k));
    for (const view of views) view.paint(q, k, v, shown);
    if (from === 'hand') saveList();
  }
  const hand = (q, k, v) => { if (routed(ID(q, k))) mod.registry.write(ID(q, k), v); else setValue(q, k, v, 'hand'); };

  /* THE VERBS: add · remove · bypass · reorder (by the graph's top → bottom) */
  const changed = () => { saveList(true); recompile(); for (const v of views) v.sync(); };
  function add(type, o) {
    if (!TYPES[type] || type === 'curves') { if (type === 'curves') setBypass('curves', false); return null; }
    let k = 1; while (byId('n' + k)) k++;
    const q = fresh('n' + k, type, o); nodes.push(q); enroll(q); changed(); return q.id;
  }
  function remove(id) { const q = byId(id); if (!q || q.type === 'curves') return false; unenroll(q); nodes = nodes.filter((n) => n !== q); changed(); return true; }
  function setBypass(id, on) { const q = byId(id); if (!q || q.bypass === !!on) return; q.bypass = !!on; changed(); }
  function setHas(on) { setBypass(curvesNode().id, !on); }
  for (const q of nodes) enroll(q);
  recompile();

  /** one curves view in a node's body: the kit's view over the one model, CHANNEL · PRESET as aria (018 A7), the save glyph and each × (018 D2) */
  function curvesIn(body) {
    const v = createCurvesView(body, { model, presets });
    for (const l of v.root.querySelectorAll('.curves-channel .k-lbl, .curves-foot .k-lbl')) if (/^(CHANNEL|PRESET)$/.test(l.textContent.trim())) { ariaLabel(l.parentElement, l.textContent.trim()); l.remove(); }
    const foot = v.root.querySelector('.curves-foot'), nm = foot.querySelector('.mir-step-name'), save = el('button', 'sp-presave', foot); save.type = 'button';
    ariaLabel(save, 'SAVE CURVE'); save.title = 'SAVE · this channel\'s curve as your own preset (kept on this device)';
    save.addEventListener('click', () => {
      if (foot.querySelector('.sp-prename')) return;
      const f = el('input', 'sp-prename', null); f.type = 'text'; f.maxLength = 40; ariaLabel(f, 'curve name'); f.value = 'My curve';
      nm.parentElement.insertBefore(f, nm); nm.hidden = true;
      let done = false; const end = (keep, key) => { if (done) return; done = true; const n = f.value.trim(); f.remove(); nm.hidden = false;
        if (keep && n) users.add(n, { points: model.points().map((q) => ({ t: q.t, v: q.v, tension: q.tension || 0 })) }); if (key) nm.focus(); };
      f.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); end(true, true); } else if (e.key === 'Escape') { e.preventDefault(); end(false, true); } });
      f.addEventListener('blur', () => end(false)); f.focus(); f.select();
    });
    nm.addEventListener('click', () => { const pane = [...document.querySelectorAll('body > .mir-pick')].pop(); if (!pane) return;
      for (const b of pane.querySelectorAll('.mir-pick-i[data-id^="' + CU + '"]')) {
        const x = el('span', 'sp-prex', b, '×'), name = b.dataset.id.slice(CU.length); x.setAttribute('role', 'button'); x.title = 'remove ' + name; ariaLabel(x, 'remove {name}', { name });
        x.addEventListener('mousedown', (e) => e.preventDefault());
        x.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); users.remove(name); b.remove();
          if (!pane.querySelector('.mir-pick-i[data-id^="' + CU + '"]')) for (const h of pane.querySelectorAll('.mir-pick-i[data-id^="#"]')) h.remove(); });
      } });
    return v;
  }

  /** a press-and-drag on `handle`: start() → the base, move(base, dx, dy), end() — the pointer captured, a cancel ends it too */
  const grab = (handle, ok, start, move, end) => handle.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || !ok(e)) return;
    e.preventDefault(); handle.setPointerCapture(e.pointerId);
    const x0 = e.clientX, y0 = e.clientY, base = start();
    const mv = (ev) => move(base, ev.clientX - x0, ev.clientY - y0);
    const up = () => { for (const [t, f] of [['pointermove', mv], ['pointerup', up], ['pointercancel', up]]) handle.removeEventListener(t, f); end(); };
    for (const [t, f] of [['pointermove', mv], ['pointerup', up], ['pointercancel', up]]) handle.addEventListener(t, f);
  });

  /** one live view of the graph in `parent`: kind 'win' (the floating window) or 'card' (the rack card) */
  function graph(parent, kind) {
    const ground = el('div', 'nodes-ground', parent), plane = el('div', 'nodes-plane', ground);
    const svg = plane.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'svg')); svg.setAttribute('class', 'nodes-wires');
    const cards = {}, ro = new ResizeObserver(() => wires());
    let pan = null;
    const setPan = (p) => { pan = p; plane.style.translate = p[0] + 'px ' + p[1] + 'px'; ground.style.backgroundPosition = p[0] + 'px ' + p[1] + 'px'; };
    const xy = (c) => [parseFloat(c.style.left) || 0, parseFloat(c.style.top) || 0];
    /** a node moved: every node takes the place it shows, the list follows the graph's top → bottom (the order law), every view follows */
    function moved() {
      for (const q of nodes) if (cards[q.id]) q.at = xy(cards[q.id].c);
      put({ at: { ...(rec().at || {}), in: xy(cards.in.c), out: xy(cards.out.c) } });
      nodes.sort((a, b) => a.at[1] - b.at[1]); changed();
    }
    const node = (id, title, ins, outs, mark) => {
      const c = el('div', 'nodes-card', plane); c.dataset.node = id;
      const bar = el('div', 'nodes-title', c); if (mark) el('i', 'nodes-mark', bar, mark); label(el('span', '', bar), title);
      if (ins) el('i', 'nodes-port in', c); if (outs) el('i', 'nodes-port out', c);
      grab(bar, (e) => !e.target.closest('button'), () => xy(c), (b, dx, dy) => { c.style.left = b[0] + dx + 'px'; c.style.top = b[1] + dy + 'px'; wires(); }, moved);
      ro.observe(c);
      return cards[id] = { c, bar, body: el('div', 'nodes-body', c) };
    };
    label(node('in', 'STAGE IN', false, true).body, 'the stage picture');
    label(node('out', 'STAGE OUT', true, false).body, 'the screen');
    /** a node's card: its bar (the class mark, the title, × BYPASS, the bin while bypassed) and its body (CURVES, or the type's knobs) */
    function make(q) {
      const T = TYPES[q.type], n = node(q.id, T.label, true, true, T.cls === 'prim' ? '···' : T.cls === 'layer' ? '··' : '·');
      n.c.dataset.type = q.type; n.c.title = T.hint || '';
      const x = el('button', 'nodes-x', n.bar); x.type = 'button'; chip(x, 'close', 'BYPASS NODE'); x.addEventListener('click', () => setBypass(q.id, !q.bypass));
      if (q.type !== 'curves') { const b = el('button', 'nodes-rm', n.bar); b.type = 'button'; chip(b, 'clear', 'REMOVE NODE'); b.addEventListener('click', () => remove(q.id)); }
      if (q.type === 'curves') n.view = curvesIn(n.body);
      else { n.body.classList.add('nodes-knobs'); n.ctl = nodeBody(n.body, q, T, { idOf: (k) => ID(q, k), hand: (k, v) => hand(q, k, v) }); }
      plane.insertBefore(n.c, cards.out.c);
    }
    /** the wires: each node's out port (the bottom's middle) to the next one's in port (the top's middle), a cubic as a network draws it */
    function wires() {
      const mid = (id, end) => { const c = cards[id].c; return [c.offsetLeft + c.offsetWidth / 2, c.offsetTop + (end ? c.offsetHeight : 0)]; };
      const ids = ['in', ...nodes.map((q) => q.id), 'out'];
      svg.replaceChildren(...ids.slice(1).map((b, i) => { const [x1, y1] = mid(ids[i], true), [x2, y2] = mid(b, false), d = Math.max(30, Math.abs(y2 - y1) / 2);
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', `M${x1} ${y1} C${x1} ${y1 + d} ${x2} ${y2 - d} ${x2} ${y2}`); return p; }));
    }
    grab(ground, (e) => e.target === ground || e.target === plane || e.target === svg, () => pan, (b, dx, dy) => setPan([b[0] + dx, b[1] + dy]),
      () => put({ pan: { ...(rec().pan || {}), [kind]: pan } }));
    /* + : the node types; the view's other door: the window ↔ the rack card */
    const addB = el('button', 'nodes-add', ground); addB.type = 'button'; chip(addB, 'plus', 'ADD NODE');
    const menu = el('div', 'nodes-menu', ground); menu.hidden = true;
    for (const [type, T] of Object.entries(TYPES)) {
      const it = el('button', 'nodes-item', menu); it.type = 'button'; it.dataset.type = type; label(it, T.label); it.title = T.label + ' — ' + T.hint;
      it.addEventListener('click', () => { menu.hidden = true; add(type); });
    }
    addB.addEventListener('click', () => { menu.querySelector('[data-type="curves"]').disabled = has(); menu.hidden = !menu.hidden; });
    const door = el('button', 'nodes-door', ground); door.type = 'button';
    if (kind === 'win') { chip(door, 'dock', 'DOCK IN THE RACK'); door.addEventListener('click', () => { win.close(); raise('nodes'); }); }
    else { chip(door, 'popOut', 'OPEN AS A WINDOW'); door.addEventListener('click', () => { rk.close('nodes'); win.open(); }); }
    if (kind === 'card') label(el('div', 'note', parent), NOTE);   // the card's one line (window notes are a SETTINGS choice)
    const api = {
      get view() { return cards.curves && cards.curves.view; },
      widget: (id, k) => { const n = cards[id]; return n && n.ctl && n.ctl.ctls[k] ? n.ctl.ctls[k].targets[0] || null : null; },
      paint(q, k, v, shown) { const n = cards[q.id]; if (n && n.ctl) n.ctl.paint(k, v, shown); },
      /** the cards follow the list: a new node gets its card, a removed one loses it */
      sync() {
        for (const id of Object.keys(cards)) if (id !== 'in' && id !== 'out' && !byId(id)) { ro.unobserve(cards[id].c); if (cards[id].view) cards[id].view.destroy(); cards[id].c.remove(); delete cards[id]; }
        for (const q of nodes) { if (!cards[q.id]) make(q); cards[q.id].c.classList.toggle('off', q.bypass); cards[q.id].bar.querySelector('.nodes-x').setAttribute('aria-pressed', String(q.bypass)); }
        api.place();
      },
      place() {
        menu.hidden = true;
        const set = (n, l, t) => { n.c.style.left = l + 'px'; n.c.style.top = t + 'px'; };
        const A = rec().at || {}, pin = A.in || AT.in;
        set(cards.in, pin[0], pin[1]);
        let y = pin[1] + cards.in.c.offsetHeight + GAP;
        for (const q of nodes) { const n = cards[q.id], p = q.at || [Math.round((SPAN - n.c.offsetWidth) / 2), y]; set(n, p[0], p[1]); y = Math.max(y, p[1] + n.c.offsetHeight + GAP); }
        const po = A.out || [pin[0], y]; set(cards.out, po[0], Math.max(po[1], y));
        const p = (rec().pan || {})[kind]; setPan(Array.isArray(p) ? p : [Math.round((ground.clientWidth - SPAN) / 2), 0]);
        wires();
      },
    };
    views.push(api);
    api.sync();
    return api;
  }

  /* the rack card (the CURVES card's seat, after RENDER, closed) and the MIR window, each its own view */
  const card = device({ id: 'nodes', eyebrow: 'NODES', status: '' });
  const vCard = graph(card.body, 'card');
  after.after(card.root);
  rk.register({ id: 'nodes', el: card, side: 'right', closed: true, title: 'NODES', glyph: 'curves', hint: 'a graph over the stage picture: STAGE IN → the nodes → STAGE OUT',
    onOpen: () => requestAnimationFrame(() => vCard.place()) });
  const wbody = el('div', 'nodes-host');
  const vWin = graph(wbody, 'win');
  const win = createWindow({ id: 'nodes', title: 'NODES', host, chrome: 'close', resizable: true, size: { w: 440, h: 640 }, min: { w: 300, h: 280 }, body: wbody,
    persist: { read: () => rec().win || null, write: (st) => put({ win: st }) },
    onOpen: () => requestAnimationFrame(() => vWin.place()), onMoved: () => occlusion.dirty() });
  occlusion.register('nodes', () => (win.isOpen() ? [paintedRect(win.root)] : []));
  occlusion.watch(win.root, { attributes: true, attributeFilter: ['hidden', 'style', 'class'] });
  users.watch(() => { for (const v of views) if (v.view) v.view.setPresets(); });
  return { model, filter, win, views, has, setHas, add, remove, setBypass, nodes: () => nodes.map(({ id, type, values, bypass }) => ({ id, type, values: { ...values }, bypass })),
    set: (id, k, v) => { const q = byId(id); if (q) hand(q, k, v); }, passes: () => passes, compile: () => compile(nodes, TYPES, new Map()), open: () => win.open(), close: () => win.close() };
}
