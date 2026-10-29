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
 * `lambdawaves.q0.curves`, the reader's curves `.curvePresets`, the graph `.nodes` ({ seq, list: [{ id, type, values, bypass, at, name, fold }],
 * at, pan, zoom, win, off }), the reader's graphs `.nodePresets`.
 *   createNodes({ device, rk, raise, host, canvas, curvesStore, occlusion, after, mod, field, mat, present }) → { model, filter, nodes(), add(type), remove(id),
 *     setBypass(id, on), set(id, knob, value), passes(), compile(), win, views, open(), close(), has(), setHas(on) } */
import { el, ariaLabel, chip } from './mir/kit.js';
import { createWindow } from './mir/window/window.js';
import { createCurvesPanel, createCurvesView, isIdentity } from './mir/panels/curves.js';
import { pictureFilter, lookup } from './mir/panels/picture-filter.js';
import { frame } from './mir/core/frame.js';
import { compile, over } from './nodes-compile.js';
import { TABLE_TYPES, MATRIX_TYPES, homeOf, FOOT } from './node-types.js';
import { LAYER_TYPES, createLayerHost } from './node-layers.js';
import { PRIM_TYPES } from './node-prims.js';
import { SHADER_TYPES, createShaderHost } from './node-shader.js';
import { jsonStore } from './mir/core/prefs.js';
import { createUserPresets } from './user-presets.js';
import { paintedRect } from './occlusion.js';
import { createView, keysAt } from './nodes-view.js';
import { createUndo } from './nodes-undo.js';
import { onForget } from './settings-store.js';   // 021 R4: FORGET cancels the 250 ms writes below before it wipes the records

/* 019 N5 · the shipped graphs (Josh's call 3: the recipes are the builder's) — every node but CURVES, which stays as it is */
const SHIPPED = {
  FILM: [{ type: 'levels', values: { outblack: 0.05, outwhite: 0.95, gamma: 1.08 } }, { type: 'temperature', values: { warmth: 0.3 } }, { type: 'saturation', values: { saturation: 0.82 } },
    { type: 'grain', values: { amount: 0.32, size: 1.2 } }, { type: 'vignette', values: { amount: 0.45, feather: 0.6, round: 0.35 } }],
  POSTER: [{ type: 'saturation', values: { saturation: 1.45 } }, { type: 'posterize', values: { steps: 5, fade: 0.85 } }, { type: 'sharpen', values: { amount: 0.4 } }],
  PRINT: [{ type: 'luma', values: { amount: 1 } }, { type: 'contrast', values: { contrast: 1.5, mask: 'mids', soft: 0.6 } }, { type: 'tint', values: { colour: [1, 0.93, 0.8], amount: 0.5 } },
    { type: 'grain', values: { amount: 0.25, size: 2, blend: 'overlay' } }, { type: 'vignette', values: { amount: 0.25 } }],
  /* 020 X4: POSTER's steps at 85 % (the banding softened, free: a fold), PRINT's contrast in the mid-tones only (a masked run) */
};

export function createNodes({ device, rk, raise, host, canvas, curvesStore, occlusion, after, mod, field = null, mat = {}, present = null, onWin = () => {} }) {
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
  /* 024 S2 · THE SHADER HOST: SHADER nodes draw on the field's device from its tap — set while one lives, cleared when none does */
  const gpu = field && field.ok ? createShaderHost({ device: field.device, canvas, tap: field.tap, present,
    palette: () => ({ ...field.paletteLUT(), on: !!mat.paletteOn, invert: !!mat.invert, hue: mat.hueShift || 0 }) }) : null;   // S3: the WAVE palette, as the ESP bar reads it
  const filter = pictureFilter(canvas), cache = new Map(), layers = createLayerHost(canvas.parentElement, gpu);
  let passes = 0, nodes = [];
  const flags = { view: null, solo: null };                          // 020 X3 · A FLAG IS NOT A RECORD: VIEW HERE and SOLO die with the session
  const how = () => ({ upTo: flags.view, solo: flags.solo, off: !!rec().off });
  const recompile = () => frame.coalesce('nodes.compile', () => { const c = compile(nodes, TYPES, cache, how()); filter.setChain(c.runs).flush(); layers.set(c.layers);
    if (c.passes !== passes) { passes = c.passes; for (const v of views) v.foot(); } });
  const panel = createCurvesPanel({ port: { setTable() { const q = nodes.find((n) => n.type === 'curves'); if (q) { q.v++; for (const v of views) v.strip(q); } recompile(); } }, project: false, presets }), model = panel.model;
  const curveTables = () => Object.fromEntries(model.channels.map((ch) => [ch, isIdentity(model.points(ch)) || model.amount() === 0 ? null : Float32Array.from(model.table(ch))]));
  const TYPES = {
    curves: { cls: 'table', label: 'CURVES', hint: 'a transfer curve per channel, as Photoshop draws it', knobs: [],
      neutral: () => model.amount() === 0 || model.channels.every((ch) => isIdentity(model.points(ch))),
      fn: () => { const T = curveTables(); return (y, ch) => { if (T.MASTER) y = lookup(T.MASTER, y); if (T[ch]) y = lookup(T[ch], y); return y; }; } },
    ...TABLE_TYPES, ...MATRIX_TYPES, ...PRIM_TYPES, ...LAYER_TYPES, ...SHADER_TYPES,
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
  /* 021 R2 · A NODE'S ID IS PERMANENT: `seq` (in the record) only grows — add, duplicate and a graph take 'n' + (++seq), nothing renumbers,
     so a route or a TIMELINE lane on `nodes.n2.amount` can never wake on another node.  An older record without it starts at its highest n */
  let seq = Math.max(Number.isInteger(rec().seq) ? rec().seq : 0, ...nodes.map((q) => (/^n(\d+)$/.exec(q.id) || [0, 0])[1] | 0));
  const nextId = () => 'n' + (++seq);
  const batch = (fn) => (mod && mod.batch ? mod.batch(fn) : fn());   // one modulation-window rebuild per graph change
  const byId = (id) => nodes.find((q) => q.id === id);
  const curvesNode = () => nodes.find((q) => q.type === 'curves');
  const has = () => { const c = curvesNode(); return !!c && !c.bypass; };
  let saving = 0, savingList = 0;
  const saveList = (now) => { clearTimeout(savingList); const w = () => put({ seq, list: nodes.map(({ id, type, values, bypass, at, name, fold }) => ({ id, type, values, bypass, at, name, fold })) }); if (now) w(); else savingList = setTimeout(w, 250); };
  onForget(() => { clearTimeout(saving); clearTimeout(savingList); saving = savingList = 0; });
  model.restore(curvesStore.get());
  model.onChange(() => { clearTimeout(saving); saving = setTimeout(() => curvesStore.set(model.serialize()), 250); });

  /* MODULATION: every number knob is a target `nodes.<node>.<knob>` through the runtime door (LW.mod.register); a hand on a ROUTED knob moves
     its BASE (the registry's), a modulator's write is PAINTED (show), as every rack dial (mod-port.js) */
  const ID = (q, k) => 'nodes.' + q.id + '.' + k;
  const routed = (id) => !!(mod && mod.registry && mod.registry.has(id) && mod.registry.isModulated(id));
  const knobsOf = (q) => [...TYPES[q.type].knobs, ...(over(TYPES[q.type]) ? [] : FOOT)].filter((K) => !K.colour && !K.options);   // X4: FADE and SOFT too
  const knobOf = (q, k) => { for (const v of views) { const w = v.widget(q.id, k); if (w) return w; } return null; };
  /* 021 R2 · THE FLASH GUARD reaches NODES: each knob's 10 % step is a tenth of its span (in ln for a log knob) — conservative, uncalibrated */
  const flashStep = (K) => (K.log && K.min > 0 ? Math.log(K.max / K.min) : K.max - K.min) / 10;
  function enroll(q) {
    if (!mod || !mod.register) return;
    const T = TYPES[q.type];
    for (const K of knobsOf(q)) try {
      mod.register(ID(q, K.k), { label: (q.name || T.label) + ' ' + K.label, min: K.min, max: K.max, step: K.step || 0, map: K.log ? 'log' : K.step === 1 ? 'integer' : 'linear', unit: K.unit, hint: K.hint || T.hint,
        def: K.home, group: 'nodes', flash: flashStep(K), get: () => q.values[K.k], set: (v) => setValue(q, K.k, v, 'mod'), knob: () => knobOf(q, K.k) });
    } catch (e) { console.warn('NODES: a knob is no target', e); }
  }
  const unenroll = (q) => { if (mod && mod.unregister) for (const K of knobsOf(q)) mod.unregister(ID(q, K.k)); };   // its routes go dormant (the id is never reused)
  function setValue(q, k, v, from) {
    if (q.values[k] === v) return;
    q.values[k] = v; q.v++; recompile();
    const shown = from === 'mod' && routed(ID(q, k));
    for (const view of views) { view.paint(q, k, v, shown); view.strip(q); }
    if (from === 'hand') saveList();
  }
  const hand = (q, k, v) => { undo.touch(); if (routed(ID(q, k))) mod.registry.write(ID(q, k), v); else setValue(q, k, v, 'hand'); };

  /* 020 X1 · NODES' OWN UNDO (lab/nodes-undo.js): a snapshot of the list and the graph's places; every verb marks the state before it */
  const snap = () => JSON.stringify({ list: nodes.map(({ id, type, values, bypass, at, name, fold }) => ({ id, type, values, bypass, at, name, fold })), at: rec().at || null });
  const undo = createUndo(snap, (s) => { const o = JSON.parse(s); batch(() => { for (const q of nodes) unenroll(q); nodes = o.list.map((q) => fresh(q.id, q.type, q)); for (const q of nodes) enroll(q); });
    put({ at: o.at }); changed(true); });
  const many = (x) => (Array.isArray(x) ? x : [x]);

  /* THE VERBS: add · remove · bypass · a graph · reorder (by the graph's top → bottom) */
  const changed = (rebuild) => { saveList(true); recompile(); for (const v of views) v.sync(rebuild); };
  function add(type, o) {
    if (!TYPES[type]) return null;
    undo.mark();
    const c = type === 'curves' && curvesNode();
    if (c) { setBypass(c.id, false); return c.id; }
    const q = fresh(type === 'curves' ? 'curves' : nextId(), type, o); nodes.push(q); batch(() => enroll(q)); changed(); return q.id;
  }
  /** remove(id | ids) · setBypass(id | ids, on): one step for the lot */
  function remove(ids) { const Q = many(ids).map(byId).filter(Boolean); if (!Q.length) return false; undo.mark(); batch(() => { for (const q of Q) unenroll(q); }); nodes = nodes.filter((n) => !Q.includes(n));
    for (const f of ['view', 'solo']) if (!byId(flags[f])) flags[f] = null; changed(); return true; }
  function setBypass(ids, on) { const Q = many(ids).map(byId).filter((q) => q && q.bypass !== !!on); if (!Q.length) return; undo.mark(); for (const q of Q) q.bypass = !!on; changed(); }
  /** duplicate(ids, at): each beside its original (new ids, the same values, 24 px down-right of `at[id]`); CURVES stays one */
  function duplicate(ids, at = {}) {
    const Q = many(ids).map(byId).filter((q) => q && q.type !== 'curves'); if (!Q.length) return []; undo.mark();
    const out = batch(() => Q.map((q) => { const p = at[q.id] || q.at, d = fresh(nextId(), q.type, { ...q, values: JSON.parse(JSON.stringify(q.values)), at: p ? [p[0] + 24, p[1] + 24] : null });
      nodes.splice(nodes.indexOf(q) + 1, 0, d); enroll(d); return d.id; }));
    changed(); return out;
  }
  /** the rack's CURVES door: absent = off; on adds CURVES (or lifts its bypass), off bypasses it */
  function setHas(on) { const c = curvesNode(); if (on) add('curves'); else if (c) setBypass(c.id, true); }
  /** a graph preset (a shipped one, or the reader's): every node but CURVES replaced by its list, laid out afresh */
  function applyGraph(list) {
    undo.mark();
    batch(() => {
      for (const q of nodes) if (q.type !== 'curves') unenroll(q);
      nodes = nodes.filter((q) => q.type === 'curves'); for (const q of nodes) q.at = null;
      for (const p of list || []) if (TYPES[p.type] && p.type !== 'curves') { const q = fresh(nextId(), p.type, p); nodes.push(q); enroll(q); }
    });
    changed();
  }
  /* 020 X2 · THE CARD's verbs: collapse · rename (the bar and the modulation target's label; ids never change) · reset · move up / down · tidy */
  function setFold(ids, on) { const Q = many(ids).map(byId).filter((q) => q && q.fold !== !!on); if (!Q.length) return; undo.mark(); for (const q of Q) q.fold = !!on; changed(); }
  function rename(id, name) { const q = byId(id); name = String(name || '').trim().slice(0, 40) || null; if (!q || q.name === name) return; undo.mark(); batch(() => { unenroll(q); q.name = name; enroll(q); }); changed(); }
  function reset(id) { const q = byId(id); if (!q) return; undo.mark(); if (q.type === 'curves') for (const ch of model.channels) model.preset(ch, 'LINEAR');
    q.values = { ...q.values, ...homeOf(TYPES[q.type]) }; q.v++; changed(true); }
  function move(id, d) { const i = nodes.findIndex((q) => q.id === id), j = i + d; if (i < 0 || j < 0 || j >= nodes.length) return; undo.mark();
    const a = nodes[i], b = nodes[j]; [a.at, b.at] = [b.at, a.at]; nodes[i] = b; nodes[j] = a; changed(); }
  /* 020 X3 · THE FLAGS: VIEW HERE (the chain up to this node; again = STAGE OUT) and SOLO (this node alone) are the view's; BYPASS ALL
     (the graph off, `off: true`) is the record's, so a reload shows what the reader saw */
  const flag = (f, id) => { flags[f] = id && flags[f] !== id && byId(id) ? id : null; changed(); };
  function setOff(on) { if (!!rec().off === !!on) return; undo.mark(); put({ off: !!on }); changed(); }
  function tidy() { undo.mark(); for (const q of nodes) q.at = null; put({ at: {} }); changed(); }
  const graphOf = () => nodes.filter((q) => q.type !== 'curves').map(({ type, values, bypass }) => ({ type, values: { ...values }, bypass }));
  /** the cards moved (the window's ground): each node takes the place it shows, the list follows the graph's top → bottom (THE COLUMN IS THE CHAIN) */
  function moved(at, io, nudge) {
    if (nudge) undo.touch(); else undo.mark();
    for (const q of nodes) if (at[q.id]) q.at = at[q.id];
    put({ at: { ...(rec().at || {}), ...io } });
    nodes.sort((a, b) => (a.at ? a.at[1] : 0) - (b.at ? b.at[1] : 0)); changed();
  }
  batch(() => { for (const q of nodes) enroll(q); });
  recompile();

  /** one curves view in a node's body: the kit's view over the one model, CHANNEL · PRESET as aria (018 A7), the save glyph and each × (018 D2) */
  function curvesIn(body) {
    const v = createCurvesView(body, { model, presets });
    for (const l of v.root.querySelectorAll('.curves-channel .k-lbl, .curves-foot .k-lbl')) if (/^(CHANNEL|PRESET)$/.test(l.textContent.trim())) { ariaLabel(l.parentElement, l.textContent.trim()); l.remove(); }
    const foot = v.root.querySelector('.curves-foot'), nm = foot.querySelector('.mir-step-name'), save = chip(el('button', 'sp-presave', foot), 'saveInto'); save.type = 'button';
    ariaLabel(save, 'SAVE CURVE'); save.title = 'SAVE · this curve as your own preset';
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
  const M = { TYPES, SHIPPED, graphs, rec, put, ID, list: () => nodes, byId, has, add, remove, setBypass, duplicate, applyGraph, graphOf, moved, hand, curvesIn, passes: () => passes,
    setFold, rename, reset, move, tidy, flags, setView: (id) => flag('view', id), setSolo: (id) => flag('solo', id), setOff, off: () => !!rec().off,
    undo: () => undo.undo(), redo: () => undo.redo(),
    door: (kind) => { if (kind === 'win') { win.close(); raise('nodes'); } else { rk.close('nodes'); win.open(); } } };

  /* the rack card (the CURVES card's seat, after RENDER, closed) and the MIR window, each its own view */
  const card = device({ id: 'nodes', eyebrow: 'NODES', status: '' });
  const vCard = createView(card.body, 'card', M); views.push(vCard);
  after.after(card.root);
  rk.register({ id: 'nodes', el: card, side: 'right', closed: true, title: 'NODES', glyph: 'nodes', hint: 'STAGE IN → the nodes → STAGE OUT',
    onOpen: () => requestAnimationFrame(() => vCard.place()) });
  const wbody = el('div', 'nodes-host');
  const vWin = createView(wbody, 'win', M); views.push(vWin);
  win = createWindow({ id: 'nodes', title: 'NODES', host, chrome: 'close', resizable: true, size: { w: 440, h: 640 }, min: { w: 300, h: 280 }, body: wbody,
    persist: { read: () => rec().win || null, write: (st) => put({ win: st }) },
    onOpen: () => { onWin(true); requestAnimationFrame(() => vWin.place()); }, onClose: () => onWin(false), onMoved: () => occlusion.dirty() });   // 021 I1: the bar's NODES seat lights on these
  occlusion.register('nodes', () => (win.isOpen() ? [paintedRect(win.root)] : []));
  occlusion.watch(win.root, { attributes: true, attributeFilter: ['hidden', 'style', 'class'] });
  users.watch(() => { for (const v of views) if (v.view) v.view.setPresets(); });
  return { model, filter, win, views, has, setHas, add, remove, setBypass, duplicate, setFold, rename, reset, move, tidy, setView: M.setView, setSolo: M.setSolo, setOff, undo: M.undo, redo: M.redo, nodes: () => nodes.map(({ id, type, values, bypass }) => ({ id, type, values: { ...values }, bypass })),
    set: (id, k, v) => { const q = byId(id); if (q) hand(q, k, v); }, passes: () => passes, keysAt, compile: () => compile(nodes, TYPES, new Map(), how()), open: () => win.open(), close: () => win.close(),
    /* 025 B1 · the film's compile: the graph as the stage runs it, a PRIMITIVE's px knobs × k (film px per stage CSS px; DISPLACE's frequency ÷ k), and the
       SHADER host the film bakes its SHADER layers through (render-exact.js frame → lab/film-bake.js) */
    compileAt: (k) => compile(nodes.map((q) => { const T = TYPES[q.type]; if (!T || T.cls !== 'prim' || k === 1) return q;
      const values = { ...q.values }; for (const n of T.knobs || []) if (n.unit === ' px') values[n.k] *= k; else if (n.k === 'freq') values[n.k] /= k;
      return { ...q, values, v: q.v + ':' + k }; }), TYPES, new Map(), how()), shaders: gpu };
}
