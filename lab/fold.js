/* lab/fold.js — THE FOLD (2026-10-16, Josh, iteration 001: "for very long windows have a show/collapse … unify them into a system"): one chevron
 * at the end of a window's row shows or hides that window's details — SHADOW's details and MOLECULES' MORE were the idiom (native-ui.js,
 * chemview.js; their toggles wear `.lw-fold` too), CAMERA and MO-REGISTRY fold through this.  `bodies` is one node or several, each
 * `.lw-fold-body` (hidden by the attribute, skin.css); closed unless `open`.  A plain module: no `app`.
 * Iteration 011 Q2 (Josh: "By default make most of the hidable texts and expandable windows minimized for default users"): the press wears
 * `data-fold` (`key`, else `what`) — its name in a card's WORKSPACE record (shell/rack-wiring.js `folds`: the open ones, written only when one
 * is), and the handle the first-visit furniture closes every fold by (rack.js, first-run.js `inner`). */
import { el, chip } from './mir/kit.js';
let n = 0;
export function fold(row, bodies, { what = 'details', open = false, cls = '', key = '' } = {}) {
  const list = [].concat(bodies), b = el('button', 'trig lw-fold' + (cls ? ' ' + cls : ''), row); b.type = 'button'; b.dataset.fold = key || what;
  for (const x of list) { x.classList.add('lw-fold-body'); if (!x.id) x.id = 'lw-fold-' + ++n; }
  b.setAttribute('aria-controls', list.map((x) => x.id).join(' ')); chip(b, 'chevronDown', 'Show ' + what);
  const set = (v) => { for (const x of list) x.hidden = !v; b.setAttribute('aria-expanded', String(!!v)); b.setAttribute('aria-label', (v ? 'Hide ' : 'Show ') + what); };
  b.addEventListener('click', () => set(list[0].hidden)); set(open);
  return { button: b, set, get: () => !list[0].hidden };
}
