/* lab/nodes.js — NODES (iteration 018 D3; 019 N1–N5; 020 X0–X4).  Josh (2026-10-27): "let 'CURVES' be part of a new window of the MIR class …
 * called 'NODES'. Similar to how Houdini 'Copernicus' works … but our own flavor".  A graph of operators over the stage picture, top → bottom:
 * STAGE IN → the nodes, in order → STAGE OUT.  THE GRAPH COMPILES (lab/nodes-compile.js) to the kit's one picture filter (`setChain`, kit
 * alpha.33): TABLE and MATRIX nodes fold into it for free, a PRIMITIVE is a real pass, a LAYER sits over the stage; a neutral or bypassed node
 * emits nothing.  THE COLUMN IS THE CHAIN: a card's place is its order (a node dragged above another runs before it).
 * This file is the MODEL — the list, the verbs, the records, the two seats and the public API; lab/nodes-view.js is the one VIEW (ground,
 * cards, wires, menus), built twice: the MIR window `nodes` (kit createWindow, the free graph, where every door opens it) and the rack card
 * `nodes` (the chain as a column, reached by the window's DOCK door or a saved layout that seats it).
 * 020 X0 THE CLEAN SLATE: CURVES is a node like any other — × bypasses, the bin removes — at most one (the kit's one curves model, kept alive
 * without a node and restored into the next CURVES), id `curves`.  THE DEFAULT GRAPH IS EMPTY: a first run (no record, no grade) opens
 * STAGE IN → STAGE OUT; a record with `list` opens as saved; 018's one-node record (`curves: false`, `at.curves`) opens with CURVES.
 * Every node knob is a MIR control routed like any other dial (`nodes.<node>.<knob>`, stable).  Records, all PREFERENCE: the grade
 * `lambdawaves.q0.curves`, the reader's curves `.curvePresets`, the graph `.nodes` ({ list: [{ id, type, values, bypass, at, name, fold }],
 * at, pan, zoom, win, off }), the reader's graphs `.nodePresets`.
 *   createNodes({ device, rk, raise, host, canvas, curvesStore, occlusion, after, mod }) → { model, filter, nodes(), add(type), remove(id),
 *     setBypass(id, on), set(id, knob, value), passes(), compile(), win, views, open(), close(), has(), setHas(on) } */
import { el, ariaLabel } from './mir/kit.js';
import { createWindow } from './mir/window/window.js';
import { createCurvesPanel, createCurvesView, isIdentity } from './mir/panels/curves.js';
import { pictureFilter, lookup } from './mir/panels/picture-filter.js';
import { frame } from './mir/core/frame.js';
import { compile } from './nodes-compile.js';
import { TABLE_TYPES, MATRIX_TYPES, homeOf } from './node-types.js';
import { LAYER_TYPES, createLayerHost } from './node-layers.js';
import { PRIM_TYPES } from './node-prims.js';
import { jsonStore } from './mir/core/prefs.js';
import { createUserPresets } from './user-presets.js';
import { paintedRect } from './occlusion.js';
import { createView } from './nodes-view.js';

/* 019 N5 · the shipped graphs (Josh's call 3: the recipes are the builder's) — every node but CURVES, which stays as it is */
const SHIPPED = {
  FILM: [{ type: 'levels', values: { outblack: 0.05, outwhite: 0.95, gamma: 1.08 } }, { type: 'temperature', values: { warmth: 0.3 } }, { type: 'saturation', values: { saturation: 0.82 } },
    { type: 'grain', values: { amount: 0.32, size: 1.2 } }, { type: 'vignette', values: { amount: 0.45, feather: 0.6, round: 0.35 } }],
  POSTER: [{ type: 'saturation', values: { saturation: 1.45 } }, { type: 'posterize', values: { steps: 5 } }, { type: 'sharpen', values: { amount: 0.4 } }],
  PRINT: [{ type: 'luma', values: { amount: 1 } }, { type: 'contrast', values: { contrast: 1.35 } }, { type: 'tint', values: { colour: [1, 0.93, 0.8], amount: 0.5 } },
    { type: 'grain', values: { amount: 0.25, size: 2, blend: 'overlay' } }, { type: 'vignette', values: { amount: 0.25 } }],
};

export function createNodes({ device, rk, raise, host, canvas, curvesStore, occlusion, after, mod }) {
  const store = jsonStore('lambdawaves.q0.nodes');
  const rec = () => { const r = store.get(); return r && r.v === 1 ? r : { v: 1 }; };
  const put = (patch) => store.set({ ...rec(), ...patch });
  const views = [];

  /* the reader's curves (018 D2, the PALETTE way): USER · theirs · PRESETS in the kit's PRESET stepper while one exists */
  const users = createUserPresets('lambdawaves.q0.curvePresets'), CU = 'user:', graphs = createUserPresets('lambdawaves.q0.nodePresets');
  const presets = () => { const U = users.list().filter((u) => u.data && Array.isArray(u.data.points) && u.data.points.length >= 2).map((u) => ({ id: CU + u.name, label: u.name, points: u.data.points }));
    return U.length ? [{ id: '#user', label: 'USER', coming: true }, ...U, { id: '#built', label: 'PRESETS', coming: true }] : []; };

  /* 019 N1 · THE COMPILER: CURVES hands its tables to the graph (a `port`), not to the filter: it is a TABLE node like any other, and alone it
     compiles to the byte-identical filter 018 wrote.  One compile and one filter write per frame, whatever moved */
  const filter = pictureFilter(canvas), cache = new Map(), layers = createLayerHost(canvas.parentElement);
  let passes = 0, nodes = [];
  const recompile = () => frame.coalesce('nodes.compile', () => { const c = compile(nodes, TYPES, cache); filter.setChain(c.runs).flush(); layers.set(c.layers);
    if (c.passes !== passes) { passes = c.passes; for (const v of views) v.foot(); } });
  const panel = createCurvesPanel({ port: { setTable() { const q = nodes.find((n) => n.type === 'curves'); if (q) q.v++; recompile(); } }, project: false, presets }), model = panel.model;
  const curveTables = () => Object.fromEntries(model.channels.map((ch) => [ch, isIdentity(model.points(ch)) || model.amount() === 0 ? null : Float32Array.from(model.table(ch))]));
  const TYPES = {
    curves: { cls: 'table', label: 'CURVES', hint: 'a transfer curve per channel, as Photoshop draws it', knobs: [],
      neutral: () => model.amount() === 0 || model.channels.every((ch) => isIdentity(model.points(ch))),
      fn: () => { const T = curveTables(); return (y, ch) => { if (T.MASTER) y = lookup(T.MASTER, y); if (T[ch]) y = lookup(T[ch], y); return y; }; } },
    ...TABLE_TYPES, ...MATRIX_TYPES, ...PRIM_TYPES, ...LAYER_TYPES,
  };

  /* THE LIST: the record's nodes as saved (at most one CURVES); else 018's one-node graph, or a reader who graded before NODES kept a
     record; else THE DEFAULT GRAPH, which is EMPTY */
  const fresh = (id, type, o = {}) => ({ id, type, bypass: !!o.bypass, at: Array.isArray(o.at) ? o.at : null, name: typeof o.name === 'string' && o.name ? o.name : null, fold: !!o.fold,
    values: { ...homeOf(TYPES[type]), ...(o.values || {}) }, v: 0 });
  function load() {
    const r = rec();
    if (!Array.isArray(r.list)) return 'curves' in r || (r.at && r.at.curves) || curvesStore.get() ? [fresh('curves', 'curves', { bypass: r.curves === false, at: (r.at || {}).curves })] : [];
    let one = false;
    return r.list.filter((q) => q && /^[a-z][a-z0-9]*$/.test(q.id) && TYPES[q.type] && (q.type !== 'curves' || (!one && (one = true)))).map((q) => fresh(q.type === 'curves' ? 'curves' : q.id, q.type, q));
  }
  nodes = load();
  const byId = (id) => nodes.find((q) => q.id === id);
  const curvesNode = () => nodes.find((q) => q.type === 'curves');
  const has = () => { const c = curvesNode(); return !!c && !c.bypass; };
  let saving = 0, savingList = 0;
  const saveList = (now) => { clearTimeout(savingList); const w = () => put({ list: nodes.map(({ id, type, values, bypass, at, name, fold }) => ({ id, type, values, bypass, at, name, fold })) }); if (now) w(); else savingList = setTimeout(w, 250); };
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
      mod.register(ID(q, K.k), { label: (q.name || T.label) + ' ' + K.label, min: K.min, max: K.max, step: K.step || 0, map: K.log ? 'log' : K.step === 1 ? 'integer' : 'linear', unit: K.unit, hint: K.hint || T.hint,
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

  /* THE VERBS: add · remove · bypass · a graph · reorder (by the graph's top → bottom) */
  const changed = () => { saveList(true); recompile(); for (const v of views) v.sync(); };
  function add(type, o) {
    if (!TYPES[type]) return null;
    const c = type === 'curves' && curvesNode();
    if (c) { setBypass(c.id, false); return c.id; }
    let k = 1; while (byId('n' + k)) k++;
    const q = fresh(type === 'curves' ? 'curves' : 'n' + k, type, o); nodes.push(q); enroll(q); changed(); return q.id;
  }
  function remove(id) { const q = byId(id); if (!q) return false; unenroll(q); nodes = nodes.filter((n) => n !== q); changed(); return true; }
  function setBypass(id, on) { const q = byId(id); if (!q || q.bypass === !!on) return; q.bypass = !!on; changed(); }
  /** the rack's CURVES door: absent = off; on adds CURVES (or lifts its bypass), off bypasses it */
  function setHas(on) { const c = curvesNode(); if (on) add('curves'); else if (c) setBypass(c.id, true); }
  /** a graph preset (a shipped one, or the reader's): every node but CURVES replaced by its list, laid out afresh */
  function applyGraph(list) {
    for (const q of nodes) if (q.type !== 'curves') unenroll(q);
    nodes = nodes.filter((q) => q.type === 'curves'); for (const q of nodes) q.at = null;
    let k = 0;
    for (const p of list || []) if (TYPES[p.type] && p.type !== 'curves') { const q = fresh('n' + ++k, p.type, p); nodes.push(q); enroll(q); }
    changed();
  }
  const graphOf = () => nodes.filter((q) => q.type !== 'curves').map(({ type, values, bypass }) => ({ type, values: { ...values }, bypass }));
  /** the cards moved (the window's ground): each node takes the place it shows, the list follows the graph's top → bottom (THE COLUMN IS THE CHAIN) */
  function moved(at, io) {
    for (const q of nodes) if (at[q.id]) q.at = at[q.id];
    put({ at: { ...(rec().at || {}), ...io } });
    nodes.sort((a, b) => (a.at ? a.at[1] : 0) - (b.at ? b.at[1] : 0)); changed();
  }
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

  /* the views' one door to the model */
  let win = null;
  const M = { TYPES, SHIPPED, graphs, rec, put, ID, list: () => nodes, byId, has, add, remove, setBypass, applyGraph, graphOf, moved, hand, curvesIn, passes: () => passes,
    door: (kind) => { if (kind === 'win') { win.close(); raise('nodes'); } else { rk.close('nodes'); win.open(); } } };

  /* the rack card (the CURVES card's seat, after RENDER, closed) and the MIR window, each its own view */
  const card = device({ id: 'nodes', eyebrow: 'NODES', status: '' });
  const vCard = createView(card.body, 'card', M); views.push(vCard);
  after.after(card.root);
  rk.register({ id: 'nodes', el: card, side: 'right', closed: true, title: 'NODES', glyph: 'curves', hint: 'a graph over the stage picture: STAGE IN → the nodes → STAGE OUT',
    onOpen: () => requestAnimationFrame(() => vCard.place()) });
  const wbody = el('div', 'nodes-host');
  const vWin = createView(wbody, 'win', M); views.push(vWin);
  win = createWindow({ id: 'nodes', title: 'NODES', host, chrome: 'close', resizable: true, size: { w: 440, h: 640 }, min: { w: 300, h: 280 }, body: wbody,
    persist: { read: () => rec().win || null, write: (st) => put({ win: st }) },
    onOpen: () => requestAnimationFrame(() => vWin.place()), onMoved: () => occlusion.dirty() });
  occlusion.register('nodes', () => (win.isOpen() ? [paintedRect(win.root)] : []));
  occlusion.watch(win.root, { attributes: true, attributeFilter: ['hidden', 'style', 'class'] });
  users.watch(() => { for (const v of views) if (v.view) v.view.setPresets(); });
  return { model, filter, win, views, has, setHas, add, remove, setBypass, nodes: () => nodes.map(({ id, type, values, bypass }) => ({ id, type, values: { ...values }, bypass })),
    set: (id, k, v) => { const q = byId(id); if (q) hand(q, k, v); }, passes: () => passes, compile: () => compile(nodes, TYPES, new Map()), open: () => win.open(), close: () => win.close() };
}
