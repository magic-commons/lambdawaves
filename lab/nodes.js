/* lab/nodes.js — NODES, the experiment (iteration 018 D3, call 1).  Josh (2026-10-27): "let 'CURVES' be part of a new window of the MIR class …
 * called 'NODES'. Similar to how Houdini 'Copernicus' works and the philosophy of Houdini but our own flavor".  v0: a graph of operators over the
 * stage picture, flowing top → bottom as a Houdini network does: STAGE IN (the source) → CURVES (the kit's curves panel, unchanged) → STAGE OUT
 * (the screen).  Drag the ground to pan; a node moves by its title bar; the wires are one SVG layer; + adds a node (one type for now, CURVES), and
 * × on its bar takes it out of the graph (the grade bypassed, kept).  Two live views of one graph, as FOLDERS has two of one library: the MIR-class
 * floating window `nodes` (kit createWindow, chrome 'close') and the rack card `nodes` (the CURVES card retired into it: settings.js
 * RETIRED_WINDOWS curves → nodes).  The grade is PREFERENCE `lambdawaves.q0.curves` as before; the reader's curves `lambdawaves.q0.curvePresets`
 * (018 D2); the graph — node places, each view's pan, the window's shape, CURVES in or out — PREFERENCE `lambdawaves.q0.nodes`.
 *   createNodes({ device, rk, raise, host, canvas, curvesStore, occlusion, after }) → { model, win, views, open(), close(), has(), setHas(on) } */
import { el, label, ariaLabel, chip } from './mir/kit.js';
import { createWindow } from './mir/window/window.js';
import { createCurvesPanel, createCurvesView, isIdentity } from './mir/panels/curves.js';
import { pictureFilter, lookup } from './mir/panels/picture-filter.js';
import { frame } from './mir/core/frame.js';
import { compile } from './nodes-compile.js';
import { jsonStore } from './mir/core/prefs.js';
import { createUserPresets } from './user-presets.js';
import { paintedRect } from './occlusion.js';

const AT = { in: [65, 16], curves: [0, 96] };                        // the first-run places: one column, CURVES' 250 px centred under STAGE IN; STAGE OUT 36 px under CURVES
const SPAN = 250;                                                    // the column's width, centred in a view that has no pan of its own yet
const NOTE = 'Grades the screen only — pictures and films are untouched.';

export function createNodes({ device, rk, raise, host, canvas, curvesStore, occlusion, after }) {
  const store = jsonStore('lambdawaves.q0.nodes');
  const rec = () => { const r = store.get(); return r && r.v === 1 ? r : { v: 1 }; };
  const put = (patch) => store.set({ ...rec(), ...patch });
  const at = (id) => (rec().at || {})[id] || AT[id];
  const has = () => rec().curves !== false;
  const views = [];

  /* the reader's curves (018 D2, the PALETTE way): USER · theirs · PRESETS in the kit's PRESET stepper while one exists */
  const users = createUserPresets('lambdawaves.q0.curvePresets'), CU = 'user:';
  const presets = () => { const U = users.list().filter((u) => u.data && Array.isArray(u.data.points) && u.data.points.length >= 2).map((u) => ({ id: CU + u.name, label: u.name, points: u.data.points }));
    return U.length ? [{ id: '#user', label: 'USER', coming: true }, ...U, { id: '#built', label: 'PRESETS', coming: true }] : []; };
  /* 019 N1 · THE COMPILER: the graph compiles to the kit's one picture filter (setChain, kit alpha.33).  CURVES hands its tables to the graph
     (a `port`), not to the filter: it is a TABLE node like any other, and alone it compiles to the byte-identical filter 018 wrote */
  const filter = pictureFilter(canvas), cache = new Map();
  let cv = 0, passes = 0;
  const recompile = () => frame.coalesce('nodes.compile', () => { const c = compile(list(), TYPES, cache); passes = c.passes; filter.setChain(c.runs).flush(); });
  const panel = createCurvesPanel({ port: { setTable() { cv++; recompile(); } }, project: false, presets }), model = panel.model;
  const curveTables = () => Object.fromEntries(model.channels.map((ch) => [ch, isIdentity(model.points(ch)) || model.amount() === 0 ? null : Float32Array.from(model.table(ch))]));
  const TYPES = {
    curves: { cls: 'table', neutral: () => model.amount() === 0 || model.channels.every((ch) => isIdentity(model.points(ch))),
      fn: () => { const T = curveTables(); return (y, ch) => { if (T.MASTER) y = lookup(T.MASTER, y); if (T[ch]) y = lookup(T[ch], y); return y; }; } },
  };
  const list = () => [{ id: 'curves', type: 'curves', values: null, bypass: !has(), v: cv }];
  model.restore(curvesStore.get());
  let saving = 0;
  model.onChange(() => { clearTimeout(saving); saving = setTimeout(() => curvesStore.set(model.serialize()), 250); });
  /** CURVES out of the graph = bypassed: it emits nothing and keeps its points */
  const bypass = recompile;
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
    const cards = {};
    let pan = null;
    const setPan = (p) => { pan = p; plane.style.translate = p[0] + 'px ' + p[1] + 'px'; ground.style.backgroundPosition = p[0] + 'px ' + p[1] + 'px'; };
    const node = (id, title, ins, outs) => {
      const c = cards[id] = el('div', 'nodes-card', plane); c.dataset.node = id;
      const bar = el('div', 'nodes-title', c); label(el('span', '', bar), title);
      if (ins) el('i', 'nodes-port in', c); if (outs) el('i', 'nodes-port out', c);
      grab(bar, (e) => !e.target.closest('button'), () => [parseFloat(c.style.left) || 0, parseFloat(c.style.top) || 0], (b, dx, dy) => { c.style.left = b[0] + dx + 'px'; c.style.top = b[1] + dy + 'px'; wires(); },
        () => { put({ at: { ...(rec().at || {}), [id]: [parseFloat(c.style.left), parseFloat(c.style.top)] } }); for (const v of views) if (v !== api) v.place(); });
      return { c, bar, body: el('div', 'nodes-body', c) };
    };
    label(node('in', 'STAGE IN', false, true).body, 'the stage picture');
    const cv = node('curves', 'CURVES', true, true), x = el('button', 'nodes-x', cv.bar); x.type = 'button'; chip(x, 'close', 'REMOVE NODE');
    x.addEventListener('click', () => setHas(false));
    const view = curvesIn(cv.body);
    label(node('out', 'STAGE OUT', true, false).body, 'the screen');
    /** the wires: an out port (the bottom's middle) to an in port (the top's middle), a cubic as a network draws it */
    function wires() {
      const mid = (id, end) => { const c = cards[id]; return [c.offsetLeft + c.offsetWidth / 2, c.offsetTop + (end ? c.offsetHeight : 0)]; };
      const pairs = has() ? [['in', 'curves'], ['curves', 'out']] : [['in', 'out']];
      svg.replaceChildren(...pairs.map(([a, b]) => { const [x1, y1] = mid(a, true), [x2, y2] = mid(b, false), d = Math.max(30, Math.abs(y2 - y1) / 2);
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', `M${x1} ${y1} C${x1} ${y1 + d} ${x2} ${y2 - d} ${x2} ${y2}`); return p; }));
    }
    new ResizeObserver(wires).observe(cv.c);
    grab(ground, (e) => e.target === ground || e.target === plane || e.target === svg, () => pan, (b, dx, dy) => setPan([b[0] + dx, b[1] + dy]),
      () => put({ pan: { ...(rec().pan || {}), [kind]: pan } }));
    /* + : the node types (CURVES, while it is out of the graph); the view's other door: the window ↔ the rack card */
    const add = el('button', 'nodes-add', ground); add.type = 'button'; chip(add, 'plus', 'ADD NODE');
    const menu = el('div', 'nodes-menu', ground); menu.hidden = true;
    const item = el('button', 'nodes-item', menu); item.type = 'button'; label(item, 'CURVES'); item.title = 'CURVES — a transfer curve per channel, as Photoshop draws it';
    add.addEventListener('click', () => { item.disabled = has(); menu.hidden = !menu.hidden; });
    item.addEventListener('click', () => { menu.hidden = true; setHas(true); });
    const door = el('button', 'nodes-door', ground); door.type = 'button';
    if (kind === 'win') { chip(door, 'dock', 'DOCK IN THE RACK'); door.addEventListener('click', () => { win.close(); raise('nodes'); }); }
    else { chip(door, 'popOut', 'OPEN AS A WINDOW'); door.addEventListener('click', () => { rk.close('nodes'); win.open(); }); }
    if (kind === 'card') label(el('div', 'note', parent), NOTE);   // the card's one line (window notes are a SETTINGS choice)
    const api = {
      view,
      place() {
        cards.curves.hidden = !has(); menu.hidden = true;
        for (const id of ['in', 'curves', 'out']) { const [l, t] = at(id) || [65, AT.curves[1] + cards.curves.offsetHeight + 36]; cards[id].style.left = l + 'px'; cards[id].style.top = t + 'px'; }
        const p = (rec().pan || {})[kind]; setPan(Array.isArray(p) ? p : [Math.round((ground.clientWidth - SPAN) / 2), 0]);
        wires();
      },
    };
    views.push(api);
    return api;
  }

  function setHas(on) { put({ curves: !!on }); bypass(); for (const v of views) v.place(); }

  /* the rack card (the CURVES card's seat, after RENDER, closed) and the MIR window, each its own view */
  const card = device({ id: 'nodes', eyebrow: 'NODES', status: '' });
  const vCard = graph(card.body, 'card');
  after.after(card.root);
  rk.register({ id: 'nodes', el: card, side: 'right', closed: true, title: 'NODES', glyph: 'curves', hint: 'a graph over the stage picture: STAGE IN → CURVES → STAGE OUT',
    onOpen: () => requestAnimationFrame(() => vCard.place()) });
  const wbody = el('div', 'nodes-host');
  const vWin = graph(wbody, 'win');
  const win = createWindow({ id: 'nodes', title: 'NODES', host, chrome: 'close', resizable: true, size: { w: 440, h: 640 }, min: { w: 300, h: 280 }, body: wbody,
    persist: { read: () => rec().win || null, write: (st) => put({ win: st }) },
    onOpen: () => requestAnimationFrame(() => vWin.place()), onMoved: () => occlusion.dirty() });
  occlusion.register('nodes', () => (win.isOpen() ? [paintedRect(win.root)] : []));
  occlusion.watch(win.root, { attributes: true, attributeFilter: ['hidden', 'style', 'class'] });
  users.watch(() => { for (const v of views) v.view.setPresets(); });
  return { model, filter, win, views, has, setHas, passes: () => passes, compile: () => compile(list(), TYPES, new Map()), open: () => win.open(), close: () => win.close() };
}
