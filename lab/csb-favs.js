/* lab/csb-favs.js — iteration 014 A3 · THE EXPANDER'S FAVOURITES.  Josh: "a section where we can add CUSTOM knob routing/macros for any favorite knobs
 * a user can pick via the right click feature on a knob (hold for mobile).  These can stay as user preferences rather than project settings … These
 * knobs can function exactly what the original can like being able to be macro'd by the modulation window, timeline, etc."
 *
 * A favourite is a SECOND FACE of the same control, never a copy of its value:
 *   · a knob (any registered `.k[data-param]`): the kit's knob made again from the original's own options (`spec`), under the SAME data-param id,
 *     so the modulation window routes it, the timeline's hold menu automates it and the registry paints it; a turn of either face moves both;
 *   · a segment the owners offer (`offer(id, control, { width })`; Josh's answer 4: SPECTRUM's HYDROGEN | STURMIAN, WAVE's POSITION | MOMENTUM and its
 *     OBSERVABLE): a seg made from the original's options whose press presses the original's button, so its owner's road (history, its status) runs.
 * ADD / REMOVE ride the knob's TIMELINE CLIP menu (the kit's setTimelineKnobRows) and a right click on an offered row (`data-fav`).  The list is a
 * PREFERENCE (`lambdawaves.q0.csb` { v: 1, items }), never a project: every new project starts with it.  Faces are built when the expander opens. */
import { el, knob, seg, label } from './mir/kit.js';
import { jsonStore } from './mir/core/prefs.js';
import { setTimelineKnobRows } from './mir/timeline/knobs.js';

export const CSB_KEY = 'lambdawaves.q0.csb';
const HALF_CARD = 150;   // a part wider than half a rack card is not offered (A-PLAN A3)

export function createCsbFavs(app, { panel }) {
  const store = jsonStore(CSB_KEY);
  const read = () => { const s = store.get(); return s && s.v === 1 && Array.isArray(s.items) ? s.items.filter((x) => typeof x === 'string') : []; };
  let items = read();
  const offers = new Map();                                            // id → { control, width }
  const strip = el('div', 'csb-favs'); strip.setAttribute('aria-label', 'favourite controls');
  if (panel) panel.appendChild(strip);
  const faces = new Map();                                             // id → { root, destroy }
  let built = false;

  const R = () => app.state.modHost && app.state.modHost.registry;
  const knobOf = (id) => { try { return app.ctl.mod.knobOf(id); } catch (_) { return null; } };
  const isFav = (id) => items.includes(id);
  const eligible = (id) => (offers.has(id) ? offers.get(id).width <= HALF_CARD : !!(R() && R().has(id) && knobOf(id) && knobOf(id).spec));

  /** a knob's second face: the original's options, one value between them, the registry's paint on both */
  function knobFace(id) {
    const orig = knobOf(id); if (!orig || !orig.spec) return null;
    const o = orig.spec, reg = R();
    const f = knob({ ...o, value: orig.get(), onInput: (v) => { orig.set(v); if (o.onInput) o.onInput(v); }, onChange: (v) => { if (o.onChange) o.onChange(v); } });
    f.root.dataset.param = id; f.root.classList.add('csb-fav');
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
    f.root.classList.add('csb-fav'); f.root.dataset.fav = id;
    const mo = new MutationObserver(() => { if (f.get() !== orig.get()) f.set(orig.get()); });
    mo.observe(orig.root, { subtree: true, attributes: true, attributeFilter: ['aria-checked', 'aria-pressed', 'class'] });
    return { root: f.root, destroy() { mo.disconnect(); } };
  }
  function paint() {
    for (const [id, face] of faces) if (!isFav(id)) { face.destroy(); face.root.remove(); faces.delete(id); }
    for (const id of items) {
      if (faces.has(id)) { strip.appendChild(faces.get(id).root); continue; }   // the list's order
      const face = offers.has(id) ? segFace(id) : knobFace(id);
      if (face) { faces.set(id, face); strip.appendChild(face.root); }
    }
    strip.classList.toggle('empty', !faces.size);
    if (!faces.size && !strip.querySelector('.csb-favs-empty')) label(el('div', 'csb-favs-empty', strip), 'Right-click a knob (hold on a touch screen) to add it here.');
    else if (faces.size) { const e = strip.querySelector('.csb-favs-empty'); if (e) e.remove(); }
  }
  const save = () => { store.set({ v: 1, items }); if (built) paint(); };
  function add(id) { if (isFav(id) || !eligible(id)) return false; items = items.concat(id); save(); return true; }
  function remove(id) { if (!isFav(id)) return false; items = items.filter((x) => x !== id); save(); return true; }
  const rowsFor = (id) => (isFav(id) ? [{ label: 'REMOVE FROM CONTROL SURFACE', run: () => remove(id) }] : eligible(id) ? [{ label: 'ADD TO CONTROL SURFACE', run: () => add(id) }] : []);
  setTimelineKnobRows(rowsFor);                                       // the knob's own right-click / hold menu (TIMELINE CLIP) carries the two rows

  /* an offered row's right click (or a held finger): the same two rows in the house's menu pane */
  let pop = null;
  const closePop = () => { if (pop) { pop.remove(); pop = null; } };
  function menu(id, x, y) {
    closePop(); const rows = rowsFor(id); if (!rows.length) return;
    pop = el('div', 'tl-pop glass', document.body); pop.dataset.mirSurface = 'menu'; pop.setAttribute('role', 'menu');
    for (const r of rows) { const b = el('button', 'trig', pop); b.type = 'button'; label(b, r.label); b.addEventListener('click', () => { closePop(); r.run(); }); }
    const b = pop.getBoundingClientRect(); pop.style.left = Math.max(8, Math.min(innerWidth - b.width - 8, x)) + 'px'; pop.style.top = Math.max(8, Math.min(innerHeight - b.height - 8, y)) + 'px';
    pop.querySelector('button').focus();
  }
  document.addEventListener('contextmenu', (e) => { const row = e.target.closest && e.target.closest('[data-fav]'); if (!row || e.target.closest('.k[data-param]')) return; e.preventDefault(); menu(row.dataset.fav, e.clientX, e.clientY); });
  let hold = null;
  document.addEventListener('pointerdown', (e) => {
    if (pop && !pop.contains(e.target)) closePop();
    const row = e.pointerType === 'touch' && e.target.closest && e.target.closest('[data-fav]'); if (!row || e.target.closest('.k[data-param]')) return;
    const x = e.clientX, y = e.clientY; hold = setTimeout(() => { hold = null; menu(row.dataset.fav, x, y); }, 500);
  }, true);
  const unhold = () => { if (hold) { clearTimeout(hold); hold = null; } };
  for (const t of ['pointerup', 'pointercancel', 'pointermove']) document.addEventListener(t, unhold, true);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closePop(); });

  return {
    strip, add, remove, rowsFor, get items() { return items.slice(); },
    /** offer(id, control, { width }) — an owner's segment that may become a favourite; its row answers a right click */
    offer(id, control, { width = HALF_CARD } = {}) { if (!control || !control.root) return; offers.set(id, { control, width }); const row = control.root; row.dataset.fav = id; },
    /** the expander opened: the faces are made (nothing is built at boot) */
    show() { built = true; paint(); },
  };
}
