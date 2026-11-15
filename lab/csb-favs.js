/* lab/csb-favs.js — iteration 014 A3 · THE EXPANDER'S FAVOURITES.  Josh: "a section where we can add CUSTOM knob routing/macros for any favorite knobs
 * a user can pick via the right click feature on a knob (hold for mobile).  These can stay as user preferences rather than project settings … These
 * knobs can function exactly what the original can like being able to be macro'd by the modulation window, timeline, etc."
 *
 * A favourite is a SECOND FACE of the same control, never a copy of its value:
 *   · a knob (any registered `.k[data-param]`): the kit's knob made again from the original's own options (`spec`), under the SAME data-param id,
 *     so the modulation window routes it, the timeline's hold menu automates it and the registry paints it; a turn of either face moves both;
 *   · a segment the owners offer (`offer(id, control, { width })`; Josh's answer 4: SPECTRUM's HYDROGEN | STURMIAN, WAVE's POSITION | MOMENTUM and its
 *     OBSERVABLE): a seg made from the original's options whose press presses the original's button, so its owner's road (history, its status) runs.
 * ADD / REMOVE ride the kit's knob menu (setTimelineKnobRows: its foot) and an offered row's menu (`data-fav`, lab/context-menus.js).  The list is a
 * PREFERENCE (`lambdawaves.q0.csb` { v: 1, items, page }), never a project: every new project starts with it.  Faces are built when the expander opens.
 * 022 C2: the strip is the kit's knob bank — eight slots on the surface's grid, its own page past eight (the `page` field, read with a default 0),
 * a slot dragged by its grip (or ← →) to reorder. */
import { knob, seg, sw, hint, knobBank, el, label } from './mir/kit.js';
import { jsonStore } from './mir/core/prefs.js';
import { setTimelineKnobRows } from './mir/timeline/knobs.js';
import { glyphEl } from './mir/glyph.js';
import { cssZoom } from './mir/core/zoom.js';
import { WINDOW_GLYPH } from './icons.js';

const CSB_KEY = 'lambdawaves.q0.csb';
const HALF_CARD = 150;   // a part wider than half a rack card is not offered (A-PLAN A3)

export function createCsbFavs(app, { panel }) {
  const store = jsonStore(CSB_KEY);
  const st = store.get(), ok = st && st.v === 1 && Array.isArray(st.items);
  let items = ok ? st.items.filter((x) => typeof x === 'string') : [];
  /* 038 S3 · THE MINI-VIEWER BY THE BAR's { on, style } rides this record (`mini`, written only off its default: absent = on, BALL + STICK) */
  const m0 = ok && st.mini && typeof st.mini === 'object' ? st.mini : {}, miniFans = new Set();
  let mini = { on: m0.on !== false, style: typeof m0.style === 'string' ? m0.style : 'ballstick' };
  const offers = new Map();                                            // id → { control, width }
  const move = (id, to) => { items = items.filter((x) => x !== id); items.splice(Math.min(to, items.length), 0, id); save(); };
  const bank = knobBank({ slots: 8, page: ok && Number.isFinite(st.page) ? st.page : 0, parent: panel, label: 'Favourite controls', onMove: move, onPage: () => save() });
  const strip = bank.root; strip.classList.add('csb-favs');
  const faces = new Map();                                             // id → { root, destroy }
  let built = false;

  const R = () => app.state.modHost && app.state.modHost.registry;
  const knobOf = (id) => { try { return app.ctl.mod.knobOf(id); } catch (_) { return null; } };
  const isFav = (id) => items.includes(id);
  const eligible = (id) => (offers.has(id) ? offers.get(id).width <= HALF_CARD : !!(R() && R().has(id) && knobOf(id) && knobOf(id).spec));
  /** 036 W1 · THE FACE'S WINDOW: the glyph of the window the original lives in (its .dev's, else the bar's, else its id's root), set before the
   *  face's label — a sibling, so a language pass that rewrites the label keeps it; csb.css shows it in the floating layer only */
  function mark(root, id, orig) {
    const d = orig && orig.closest('.dev'), key = d ? d.dataset.id : orig && orig.closest('#transport') ? 'transport' : id.split('.')[0];
    const g = glyphEl((d && d.dataset.glyph) || WINDOW_GLYPH[key] || 'controlSurface', 'gly csb-fav-gly', 12), lbl = root.querySelector(':scope > .k-lbl');
    if (g) { if (lbl) lbl.before(g); else root.prepend(g); }
    return root;
  }

  /** a knob's second face: the original's options, one value between them, the registry's paint on both */
  function knobFace(id) {
    const orig = knobOf(id); if (!orig || !orig.spec) return null;
    const o = orig.spec, reg = R();
    const f = knob({ ...o, value: orig.get(), onInput: (v) => { orig.set(v); if (o.onInput) o.onInput(v); }, onChange: (v) => { if (o.onChange) o.onChange(v); } });
    f.root.dataset.param = id; f.root.classList.add('csb-fav'); mark(f.root, id, orig.root);
    if (reg) f.setBase(() => (reg.isModulated(id) ? reg.baseOf(id) : null));
    /* the original's paint reaches the face (a modulator's show, a restore's set); a hand on the original is copied after its frame */
    const set0 = orig.set, show0 = orig.show;
    orig.set = (x, silent) => { set0(x, silent); if (!f.root.classList.contains('drag')) f.set(x); };
    if (show0) orig.show = (x) => { show0(x); if (!f.root.classList.contains('drag')) f.show(x); };
    let raf = 0; const copy = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; if (!f.root.classList.contains('drag')) f.set(orig.get()); }); };
    const evs = ['pointermove', 'pointerup', 'keydown', 'dblclick', 'wheel'];
    for (const t of evs) orig.root.addEventListener(t, copy, { passive: true });
    const unsub = reg ? reg.subscribe(id, (ev) => f.root.classList.toggle('mod-held', !!ev.modulated)) : null;
    if (reg && reg.isModulated(id)) f.root.classList.add('mod-held');
    return { root: f.root, destroy() { orig.set = set0; if (show0) orig.show = show0; for (const t of evs) orig.root.removeEventListener(t, copy); if (unsub) unsub(); cancelAnimationFrame(raf); } };
  }
  /** an offered segment's second face: the original's options; a press is the original's own button */
  function segFace(id) {
    const { control: orig } = offers.get(id); if (!orig || !orig.spec) return null;
    const o = orig.spec;
    const f = seg({ ...o, value: orig.get(), onChange: (v) => { const b = orig.button(v); if (b) b.click(); else f.set(orig.get()); } });
    f.root.classList.add('csb-fav'); f.root.dataset.fav = id; mark(f.root, id, orig.root);
    const mo = new MutationObserver(() => { if (f.get() !== orig.get()) f.set(orig.get()); });
    mo.observe(orig.root, { subtree: true, attributes: true, attributeFilter: ['aria-checked', 'aria-pressed', 'class'] });
    return { root: f.root, destroy() { mo.disconnect(); } };
  }
  /** a switch's second face (iteration 014 D4): the same glyph switch, knob-sized; a press is the original's own press, so its owner's road runs.
   *  036 W1: it stands in a cell with its word (a glyph switch draws none), so the floating layer can name it beside its window's glyph */
  function swFace(id, orig, o) {
    const f = sw({ ...o, value: orig.get(), onChange: () => { orig.root.click(); f.set(orig.get()); } });
    f.root.classList.add('csb-fav'); f.root.dataset.fav = id;
    const cell = el('div', 'csb-fav-sw'); if (o.label) label(el('div', 'k-lbl', cell), o.label); cell.append(f.root); mark(cell, id, orig.root);
    const mo = new MutationObserver(() => { if (f.get() !== orig.get()) f.set(orig.get()); });
    mo.observe(orig.root, { attributes: true, attributeFilter: ['aria-pressed'] });
    return { root: cell, destroy() { mo.disconnect(); } };
  }
  function paint() {
    for (const [id, face] of faces) if (!isFav(id)) { face.destroy(); face.root.remove(); faces.delete(id); }
    for (const id of items) {
      if (faces.has(id)) continue;
      const face = offers.has(id) ? (offers.get(id).build ? offers.get(id).build(offers.get(id).control) : segFace(id)) : knobFace(id);
      if (face) faces.set(id, face);
    }
    bank.set(items.filter((id) => faces.has(id)).map((id) => ({ id, root: faces.get(id).root, span: offers.has(id) && !offers.get(id).build ? 4 : 1 })));   // the list's order, eight a page; a segment takes four slots
    strip.classList.toggle('empty', !faces.size); hint(strip, faces.size ? '' : 'Right-click a knob (hold on touch) to add it here');
  }
  const save = () => { store.set({ v: 1, items, page: bank.page(), ...(mini.on && mini.style === 'ballstick' ? {} : { mini }) }); if (built) paint(); };
  function add(id) { if (isFav(id) || !eligible(id)) return false; items = items.concat(id); save(); return true; }
  function remove(id) { if (!isFav(id)) return false; items = items.filter((x) => x !== id); save(); return true; }
  const rowsFor = (id) => (isFav(id) ? [{ label: 'REMOVE FROM CONTROL SURFACE', run: () => remove(id) }] : eligible(id) ? [{ label: 'ADD TO CONTROL SURFACE', run: () => add(id) }] : []);
  setTimelineKnobRows(rowsFor);                                       // the knob's own right-click / hold menu (TIMELINE CLIP) carries the two rows

  /** 036 W1 · THE FLOATING FAVOURITES (Josh: "Mouseover on the CSB will reveal the favorites section but as floating knobs … No background … the
   *  window's icons to the left of the text … the macro routing … can also be drag-routed to it.  Expanding the CSB will deactivate the favorites"):
   *  250 ms of a fine pointer on the COLLAPSED stage bar lifts THE ONE strip out of the expander into a layer beside the bar (above it; below when it
   *  sits at the top), back 400 ms after the pointer leaves both, at once on EXPAND, Escape, or the bar hiding.  One strip, so each control has one
   *  face in the document: a route's drop lands on it by id (no hidden copy measures a zero rect).  The layer is the bar's sibling, placed from its
   *  seen rect ÷ its own zoom (UI SCALE), so the bar's box, trSize and the dodge never change.  A route's drag holds the pointer (capture: no
   *  enter or leave reaches the bar), so while one is armed the bar is hovered by coordinates. */
  function float(bar, { home, open }) {
    const B = document.body, stage = bar.parentElement, layer = el('div', 'csb-float', stage), fine = matchMedia('(hover: hover) and (pointer: fine)');
    layer.hidden = true;
    let tIn = 0, tOut = 0, mo = null;
    const ok = () => fine.matches && items.length && bar.classList.contains('mini') && bar.dataset.place === 'stage' && !open()
      && !B.classList.contains('rack-hidden') && !B.classList.contains('ui-hidden') && !B.classList.contains('phone');
    function place() {
      const r = bar.getBoundingClientRect(), s = stage.getBoundingClientRect(), z = cssZoom(layer), top = bar.classList.contains('at-top');
      layer.style.left = (r.left + r.width / 2 - s.left) / z + 'px';
      layer.style.top = top ? (r.bottom + 6 - s.top) / z + 'px' : 'auto'; layer.style.bottom = top ? 'auto' : (s.bottom - r.top + 6) / z + 'px';
      layer.classList.toggle('below', top);
    }
    /* 041 P11 (Josh 11-09: "disappears too abruptly vs when it's revealed, can we match it going out as it does coming in?"): the pointer's leave
       plays the arrival backwards (the same rise, the same time) and then puts the strip home; EXPAND, Escape and the bar hiding still hide at once */
    let going = null;
    function leave() {
      tOut = 0; if (layer.hidden || going) return;
      const cs = getComputedStyle(layer), ms = cs.animationName === 'none' ? 0 : parseFloat(cs.animationDuration) * 1000;
      if (!(ms > 0)) return hide();
      going = layer.animate([{ opacity: 1, translate: '-50% 0' }, { opacity: 0, translate: layer.classList.contains('below') ? '-50% -6px' : '-50% 6px' }], { duration: ms, easing: 'ease-in', fill: 'forwards' });
      going.onfinish = hide;
    }
    function hide() {
      if (going) { going.onfinish = null; going.cancel(); going = null; }
      clearTimeout(tIn); clearTimeout(tOut); tIn = tOut = 0; if (layer.hidden) return;
      layer.hidden = true; home.append(strip); if (mo) mo.disconnect(); mo = null;
    }
    function show() {
      tIn = 0; if (!layer.hidden || !ok()) return;
      if (!built) { built = true; paint(); } if (!faces.size) return;
      layer.append(strip); place(); layer.hidden = false;
      mo = new MutationObserver(() => (ok() ? place() : hide()));
      mo.observe(B, { attributes: true, attributeFilter: ['class'] }); mo.observe(bar, { attributes: true, attributeFilter: ['class', 'data-place'] });
    }
    const want = (on) => {
      if (on) { clearTimeout(tOut); tOut = 0; if (going) { going.onfinish = null; going.cancel(); going = null; } if (layer.hidden && !tIn) tIn = setTimeout(show, 250); }
      else { clearTimeout(tIn); tIn = 0; if (!layer.hidden && !tOut && !going) tOut = setTimeout(leave, 400); }
    };
    for (const n of [bar, layer]) { n.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') want(true); }); n.addEventListener('pointerleave', () => want(false)); }
    addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch' || !B.classList.contains('mod-arming')) return;
      const inside = (n) => { const r = n.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; };
      want(inside(bar) || (!layer.hidden && inside(layer)));
    }, { passive: true });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && !layer.hidden) hide(); });
    return { layer, hide, get shown() { return !layer.hidden; } };
  }

  return {
    strip, add, remove, rowsFor, swFace, float, get items() { return items.slice(); },
    /** 038 S3 · the mini-viewer by the bar: mini() its { on, style }, setMini(patch) writes the record and tells onMini's listeners */
    mini: () => ({ ...mini }), setMini(p) { mini = { ...mini, ...p }; save(); for (const f of miniFans) f(); }, onMini(fn) { miniFans.add(fn); return () => miniFans.delete(fn); },
    /** offer(id, control, { width, build }) — an owner's segment that may become a favourite; its row answers a right click.  `build(control)` makes a
     *  face that is not a segment (iteration 014 D4: PALETTE's INVERT, a knob-sized switch) and returns { root, destroy } */
    offer(id, control, { width = HALF_CARD, build = null } = {}) { if (!control || !control.root) return; offers.set(id, { control, width, build }); const row = control.root; row.dataset.fav = id; },
    /** the expander opened: the faces are made (nothing is built at boot) */
    show() { built = true; paint(); },
  };
}
