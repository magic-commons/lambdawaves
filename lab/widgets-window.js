/* lab/widgets-window.js — WIDGETS, the manager (037 W3; Josh, BRIEF.md WIDGETS: "a new 'Widgets' MIR rack window that acts as a Widget manager
 * (kind of similar to iOS/Android ro general phone philosophy for widgets) that shows a possible collage view of different widgets you can add to
 * the scene"): a rack card `widgets` — CLOSED on a first run, in the FINDER and WINDOW, `window.widgets.*` generated, as every card is — that IS
 * the widgets' library (Josh: "its own library similar to the 'finder'"): the gallery of the kinds (each its glyph and word; a press adds one at
 * the stage's centre), the placed list (each its word and its number among its kind; × removes it — the one scroller, inside its own box, past
 * six rows) and EDIT · SNAP · CLEAR.  The layer is lab/widgets.js; the kinds' modules are imported here, so the gallery is whole when the card is
 * built (a kind that registers later joins it).  Returns the layer.  In lab/, not windows/: rack-deps admits only rack.js's planned modules there. */
import { el, sw, trig, label } from './mir/kit.js'; import { glyphEl } from './mir/glyph.js';
import { createWidgets, kinds, onKinds } from './widgets.js';
import './widget-mol.js'; import './widget-clock.js'; import './widget-text.js'; import './widget-views.js';
export function createWidgetsWindow(app) {
  const L = createWidgets(app), w = app.device({ id: 'widgets', eyebrow: 'WIDGETS', status: '' });
  w.root.classList.add('closed', 'lw-widgets-card'); app.host.rack.appendChild(w.root);
  const gal = el('div', 'wg-gallery', w.body), list = el('div', 'wg-list', w.body), acts = el('div', 'row tight fit wg-acts', w.body);
  const edit = sw({ label: 'EDIT', title: 'Move and size the widgets on the stage', onChange: (v) => L.edit(v) });
  const snap = sw({ label: 'SNAP', value: true, title: 'Snap to edges and centres while dragging', onChange: (v) => L.snap(v) });
  /* 038 S3 · BY THE BAR: the mini-viewer beside the control surface (shell/transport.js), the favourites' record's (csb-favs.js mini) — not a widget of the stage's record */
  const csb = app.sh.csb, bar = csb && sw({ label: 'BY THE BAR', cls: 'wg-bar', value: csb.mini().on, title: 'A mini-viewer beside the control surface', onChange: (v) => csb.setMini({ on: v }) });
  acts.append(edit.root, snap.root, trig({ label: 'CLEAR', title: 'Remove every widget from the stage', onFire: () => L.clear() }).root, ...(bar ? [bar.root] : []));
  if (bar) csb.onMini(() => bar.set(csb.mini().on));
  const paintGallery = () => { gal.textContent = ''; for (const K of kinds()) gal.append(trig({ label: K.label, glyph: K.glyph, title: K.hint, cls: 'wg-kind', onFire: () => L.add(K.kind) }).root); };
  const paintList = () => {
    const n = {}, items = L.list(); list.textContent = ''; list.hidden = !items.length;
    for (const it of items) {
      n[it.kind] = (n[it.kind] || 0) + 1; const r = el('div', 'wg-row', list); r.dataset.id = it.id;
      const K = kinds().find((k) => k.kind === it.kind), g = K && glyphEl(K.glyph, 'wg-gly', 16); if (g) r.append(g);   // 044 AV2 (L18): the FINDER's row — its kind's glyph, its word, its number
      label(el('span', 'wg-word', r), it.label); el('span', 'wg-n', r, String(n[it.kind]));
      r.append(trig({ label: '', glyph: 'close', title: 'Remove this widget', cls: 'wg-x', onFire: () => L.remove(it.id) }).root);
    }
    w.setStatus(items.length ? String(items.length) : '', 'live'); edit.set(L.edit()); snap.set(L.snap());
  };
  onKinds(paintGallery); L.subscribe(paintList); paintGallery(); paintList();
  return L;
}
