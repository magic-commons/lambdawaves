/* lab/widgets.js — WIDGETS: the layer and the record (037 W1; Josh, BRIEF.md WIDGETS: "a new class of windows on the stage, extremely similar
 * to 'Informational's architecture … users can add as many copies of the same widgets as they want"; PLAN §1 A WIDGET IS A STAGE OBJECT, NOT
 * A WINDOW).  `#widgets` sits in #lab beside the kit's info layer at z 19 — over #atomLabels (9), under INFORMATIONAL's words (20) and every
 * window (30) — and takes no pointer outside EDIT.  A widget is `section.lw-widget[data-kind][data-id]` with no background, border or shadow
 * ("empty CSS"); its box {x, y, w, h} is in STAGE FRACTIONS, so a layout survives a resize.  THE RECORD `lambdawaves.q0.widgets`
 * { items: [{ id, kind, x, y, w, h, opts }] } is the live one a reload boots from; the PROJECT carries it as `presentation.widgets`
 * (default-absent: NEW, the demos and every file before 037 open with none) and the undo ring keeps it — a hand's change is one named row.
 * THE KINDS register themselves (registerKind: widget-mol.js, widget-clock.js, widget-text.js, chain V's visualizers) and the layer ticks the
 * mounted ones from the rack's one CPU frame (tickWidgets), gated on a hidden page and H only, never on a window.
 *   registerKind({ kind, label, glyph, hint, size: { w, h }, opts, mount(el, api) → { tick(now, force, ctx), set(opts), destroy() }, controls(bar, api) })
 *   api = { app, id, kind, el, opts(), set(patch, name), theme(), ink(), editing(), size() }
 *   createWidgets(app) → { root, add(kind, opts), remove(id), clear(), list(), edit(on), snap(on), tick(now, ctx), restore(rec), serialize(), subscribe(fn) } */
import { el, hint, ariaLabel, onThemeChange } from './mir/kit.js'; import { glyphEl } from './mir/glyph.js'; import { cssZoom } from './mir/core/zoom.js'; import { drag } from './mir/core/pointer.js';
const KEY = 'lambdawaves.q0.widgets', MIN = 0.06;
const KINDS = new Map(), heard = new Set();
const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), r4 = (v) => Math.round(v * 1e4) / 1e4;
/** a kind joins the gallery (in the order kinds register) and every item of it the record kept is drawn */
export function registerKind(def) { KINDS.set(def.kind, Object.freeze({ size: { w: 0.2, h: 0.2 }, opts: {}, ...def })); for (const f of heard) f(); }
export const kinds = () => [...KINDS.values()];
export const onKinds = (fn) => { heard.add(fn); return () => heard.delete(fn); };
/** a box held inside the stage, at least MIN each way */
const fit = (r) => { const w = clamp(+r.w || 0.2, MIN, 1), h = clamp(+r.h || 0.2, MIN, 1); return { x: r4(clamp(+r.x || 0, 0, 1 - w)), y: r4(clamp(+r.y || 0, 0, 1 - h)), w: r4(w), h: r4(h) }; };
/** a record's items, the well-formed ones only (an id once, a kind named, a box, an opts object) */
function clean(o) {
  const out = [], ids = new Set();
  for (const it of (o && Array.isArray(o.items) ? o.items : [])) {
    if (!it || typeof it.id !== 'string' || typeof it.kind !== 'string' || ids.has(it.id)) continue;
    ids.add(it.id); out.push({ id: it.id, kind: it.kind, ...fit(it), opts: it.opts && typeof it.opts === 'object' && !Array.isArray(it.opts) ? { ...it.opts } : {} });
  }
  return out;
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const theme = () => (document.body.dataset.theme === 'light' ? 'light' : 'dark');
let L = null;   // the one layer
/* 038 S3 · AN ADOPTED PAINTER: a kind drawn in a host a surface owns (the bar's mini-viewer, shell/transport.js) — no record, no EDIT, no history row;
   ticked with the layer from the rack's one CPU frame while its host has a box, and forced (its box, the theme, its opts) in its own animation frame */
const PINNED = new Set(); let pinRaf = 0;
const pinKick = (P) => { P.force = true; if (!pinRaf) pinRaf = requestAnimationFrame(() => { pinRaf = 0; for (const Q of PINNED) if (Q.force && Q.host.clientWidth) { Q.force = false; if (Q.inst.tick) Q.inst.tick(performance.now(), true); } }); };
/** adopt(kind, host, { app, opts }) → { set(opts) } | null — `opts()` is read at every paint, as an item's are */
export function adopt(kind, host, { app, opts }) {
  const K = KINDS.get(kind); if (!K) return null;
  const P = { host, force: false, inst: {} };
  P.inst = K.mount(host, { app, id: kind, kind, el: host, opts, theme, ink: () => getComputedStyle(host).color, editing: () => false,
    size: () => { const z = cssZoom(host); return { w: host.clientWidth * z, h: host.clientHeight * z }; }, set: () => {} }) || {};   // S6: the size SEEN — the bar is a zoomed root (UI SCALE), so its canvas is drawn at the pixels it covers
  PINNED.add(P); onThemeChange(() => pinKick(P));
  if (typeof ResizeObserver === 'function') new ResizeObserver(() => pinKick(P)).observe(host);
  return { set: (o) => { if (P.inst.set) P.inst.set(o); pinKick(P); } };
}
/** the rack's one call a CPU frame (rack.js); `ctx` is the frame's own, handed to every widget's tick as it came */
export const tickWidgets = (now, ctx) => { if (L) L.tick(now, ctx); };
/** the project's record (persist.js serialize, both scopes), or null when no widget stands */
export const widgetsOfProject = () => (L ? L.serialize() : null);
/** an open, a link, an undo: the file's widgets (absent: none) */
export const loadWidgets = (rec) => { if (L) L.restore(rec); };

export function createWidgets(app) {
  const root = el('div', '', app.dom.stage.parentElement); root.id = 'widgets'; root.setAttribute('aria-hidden', 'true');
  const live = new Map(), fans = new Set();   // id → { it, box, body, bar, K, view, inst, force }
  let items = [], editOn = false, snapOn = true, raf = 0;
  try { items = clean(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch (_) {}
  const place = (W) => { const s = W.box.style, it = W.it; s.left = it.x * 100 + '%'; s.top = it.y * 100 + '%'; s.width = it.w * 100 + '%'; s.height = it.h * 100 + '%'; };
  /* a FORCED tick (a mount, a resize, the theme, an opts change, EDIT) runs in the next animation frame, whether or not the rack is drawing */
  const kick = (W) => { for (const V of W ? [W] : live.values()) V.force = true;
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; for (const V of live.values()) if (V.force) { V.force = false; if (V.inst.tick) V.inst.tick(performance.now(), true); } }); };
  const sized = typeof ResizeObserver === 'function' ? new ResizeObserver((es) => { for (const e of es) { const W = live.get(e.target.parentElement.dataset.id); if (W) kick(W); } }) : null;
  const fan = () => { for (const f of fans) f(); };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ items })); } catch (_) {} };
  /** a hand's change: the record written, the manager told, one named row of the undo ring (the edit scope carries presentation.widgets) */
  const commit = (name) => { save(); fan(); if (app.state.history) app.state.history.note(name); };
  function mount(it) {
    const K = KINDS.get(it.kind); if (!K) return null;   // a kind not registered (yet): kept in the record, drawn when it registers
    const box = el('section', 'lw-widget', root); box.dataset.kind = it.kind; box.dataset.id = it.id; box.dataset.word = K.label;
    const body = el('div', 'lw-widget-body', box), bar = el('div', 'lw-widget-bar', box), x = el('button', 'lw-widget-x', box);
    x.type = 'button'; x.append(glyphEl('close', 'gly', 16)); hint(x, 'Remove this widget'); x.addEventListener('click', () => api.remove(it.id));
    el('i', 'lw-widget-grip', box);
    const W = { it, box, body, bar, K, inst: {}, force: false };
    const view = { app, id: it.id, kind: it.kind, el: body, opts: () => W.it.opts, theme, ink: () => getComputedStyle(root).color, editing: () => editOn,
      size: () => ({ w: body.clientWidth, h: body.clientHeight }),
      set: (patch, name = 'WIDGET ' + K.label) => { W.it.opts = { ...W.it.opts, ...patch }; if (W.inst.set) W.inst.set(W.it.opts); kick(W); commit(name); } };
    place(W); live.set(it.id, W); box.tabIndex = editOn ? 0 : -1;
    box.setAttribute('role', 'application'); box.setAttribute('aria-roledescription', 'widget'); ariaLabel(box, K.label);   // 044 A4 (L51): it says what it is, as the kit's pad does
    hand(W);
    W.inst = K.mount(body, view) || {};
    W.view = view; if (K.controls) K.controls(bar, view);
    if (sized) sized.observe(body);
    kick(W); return W;
  }
  function unmount(id) { const W = live.get(id); if (!W) return; live.delete(id); if (sized) sized.unobserve(W.body); try { if (W.inst.destroy) W.inst.destroy(); } catch (_) {} W.box.remove(); }
  onKinds(() => { for (const it of items) if (!live.has(it.id) && KINDS.has(it.kind)) mount(it); fan(); });
  onThemeChange(() => kick());
  /* ── 037 W2 · EDIT AND SNAP (Josh: "an 'edit' toggle mode so that you can move widgets around as if treating the stage like a 'home/lock'
     screen … a toggle for widgets to snap edges together similar to how photoshop snaps"): in EDIT a drag moves a widget, its grip sizes it
     (≥ MIN each way); SNAP holds the moving edges — a move's left · centre · right and top · middle · bottom, a size's right and bottom — on
     the nearest line within 6 px among every other widget's edges and centres and the stage's edges and centre lines, a 1-px accent guide
     across the stage while it holds, gone on release; the record is written on release (one row: WIDGET MOVE or WIDGET SIZE); arrows nudge
     5 % (Shift is fine, as everywhere: 1 %); Delete removes the focused widget; Escape leaves EDIT (the escape stack, lab/actions.js).
     044 A4 (L41 / L39): the hand is the kit's drag() — 4 px before a press is a drag, and Escape mid-drag, a lost capture or a hidden page
     put the widget back where the hand found it ── */
  const gx = el('i', 'lw-guide', root), gy = el('i', 'lw-guide lw-guide-y', root); gx.hidden = gy.hidden = true;
  let drop = null;
  function snapped(r, size, own, S) {
    const xs = [0, 0.5, 1], ys = [0, 0.5, 1];
    for (const q of items) if (q !== own) { xs.push(q.x, q.x + q.w / 2, q.x + q.w); ys.push(q.y, q.y + q.h / 2, q.y + q.h); }
    const near = (edges, lines, span) => { let b = null; for (const e of edges) for (const t of lines) { const d = t - e; if (Math.abs(d * span) <= 6 && (!b || Math.abs(d) < Math.abs(b.d))) b = { d, t }; } return b; };
    const bx = snapOn && near(size ? [r.x + r.w] : [r.x, r.x + r.w / 2, r.x + r.w], xs, S.width), by = snapOn && near(size ? [r.y + r.h] : [r.y, r.y + r.h / 2, r.y + r.h], ys, S.height);
    if (bx) r[size ? 'w' : 'x'] += bx.d; if (by) r[size ? 'h' : 'y'] += by.d;
    gx.hidden = !bx; gy.hidden = !by; if (bx) gx.style.left = bx.t * 100 + '%'; if (by) gy.style.top = by.t * 100 + '%';
    return r;
  }
  function hand(W) {
    const box = W.box; let S = null, size = false, o = null;
    box.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      if (!editOn || e.target.closest('.lw-widget-bar, .lw-widget-x')) { e.stopImmediatePropagation(); return; }   // the kind's controls and × are buttons of their own
      box.focus({ preventScroll: true }); S = root.getBoundingClientRect(); size = !!e.target.closest('.lw-widget-grip'); o = { ...W.it };
    });
    drag(box, {
      onMove: (m) => {
        const dx = m.dx / S.width, dy = m.dy / S.height;
        const r = snapped(size ? { x: o.x, y: o.y, w: Math.max(MIN, o.w + dx), h: Math.max(MIN, o.h + dy) } : { x: o.x + dx, y: o.y + dy, w: o.w, h: o.h }, size, W.it, S);
        if (size) { r.w = Math.min(r.w, 1 - r.x); r.h = Math.min(r.h, 1 - r.y); }
        Object.assign(W.it, fit(r)); place(W);
      },
      onEnd: () => { gx.hidden = gy.hidden = true; commit(size ? 'WIDGET SIZE' : 'WIDGET MOVE'); },
      onCancel: () => { gx.hidden = gy.hidden = true; Object.assign(W.it, o); place(W); },
    });
  }
  root.addEventListener('keydown', (e) => {
    const W = editOn && e.target.classList.contains('lw-widget') && live.get(e.target.dataset.id), d = W && { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (W && (e.key === 'Delete' || e.key === 'Backspace')) { e.preventDefault(); e.stopPropagation(); api.remove(W.it.id); return; }   // L49: Delete removes the selection
    if (!d) return; e.preventDefault(); e.stopPropagation();
    const k = e.shiftKey ? 0.01 : 0.05;                               // L34: Shift is FINE
    Object.assign(W.it, fit({ ...W.it, x: W.it.x + d[0] * k, y: W.it.y + d[1] * k })); place(W); commit('WIDGET MOVE');
  });
  const api = L = {
    root,
    /** one more widget of `kind` at the stage's centre (each next one a step down-right, so a pile stays readable); its id, or null */
    add(kind, opts = {}) {
      const K = KINDS.get(kind); if (!K) return null;
      const n = items.reduce((m, q) => Math.max(m, +q.id.slice(1) || 0), 0) + 1, s = (items.length % 5) * 0.02;
      const it = { id: 'w' + n, kind, ...fit({ x: 0.5 - K.size.w / 2 + s, y: 0.5 - K.size.h / 2 + s, w: K.size.w, h: K.size.h }), opts: { ...K.opts, ...opts } };
      items.push(it); mount(it); commit('WIDGET ADD'); return it.id;
    },
    remove(id) { if (!items.some((q) => q.id === id)) return false; items = items.filter((q) => q.id !== id); unmount(id); commit('WIDGET REMOVE'); return true; },
    clear() { if (!items.length) return false; for (const it of items) unmount(it.id); items = []; commit('WIDGETS CLEAR'); return true; },
    /** the record's items, each with its kind's word (a kind not registered says its id) */
    list: () => items.map((it) => ({ ...it, opts: { ...it.opts }, label: (KINDS.get(it.kind) || { label: it.kind.toUpperCase() }).label })),
    /** EDIT: the widgets take the pointer (W2); no argument reads it */
    edit(on) { if (on === undefined) return editOn; editOn = !!on; root.classList.toggle('edit', editOn); root.toggleAttribute('aria-hidden', !editOn);
      for (const W of live.values()) W.box.tabIndex = editOn ? 0 : -1;
      if (editOn && !drop && app.sh.ACTIONS) drop = app.sh.ACTIONS.escape.push(() => api.edit(false), { alive: () => editOn });
      if (!editOn) { if (drop) drop(); drop = null; gx.hidden = gy.hidden = true; if (root.contains(document.activeElement)) document.activeElement.blur(); }
      kick(); fan(); return editOn; },
    snap(on) { if (on === undefined) return snapOn; snapOn = !!on; fan(); return snapOn; },
    tick(now, ctx) {
      if (document.hidden || app.state.uiHidden) return;
      for (const P of PINNED) if (P.inst.tick && P.host.clientWidth) { const f = P.force; P.force = false; P.inst.tick(now, f, ctx); }   // 038 S3: an adopted painter, while its host has a box
      for (const W of live.values()) if (W.inst.tick) { const f = W.force; W.force = false; W.inst.tick(now, f, ctx); }
    },
    /** a project's record in place (absent: none): the widgets that stay keep their mount, the rest come and go; never a history row */
    restore(rec) {
      const next = clean(rec); if (same(next, items)) return;
      const by = new Map(next.map((it) => [it.id, it]));
      for (const [id, W] of [...live]) { const n = by.get(id); if (!n || n.kind !== W.it.kind) unmount(id); }
      items = next;
      for (const it of items) { const W = live.get(it.id); if (!W) { mount(it); continue; }
        const moved = !same(W.it.opts, it.opts); W.it = it; place(W);
        if (moved) { if (W.inst.set) W.inst.set(it.opts); if (W.K.controls) { W.bar.textContent = ''; W.K.controls(W.bar, W.view); } } kick(W); }   // an undo's opts: the picture and the kind's controls follow
      save(); fan();
    },
    serialize: () => (items.length ? { items: items.map((it) => ({ ...it, opts: { ...it.opts } })) } : null),
    subscribe(fn) { fans.add(fn); return () => fans.delete(fn); },
  };
  for (const it of items) mount(it);
  return api;
}
