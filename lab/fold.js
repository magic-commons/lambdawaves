/* lab/fold.js — THE FOLD (2026-10-16, Josh, iteration 001: "for very long windows have a show/collapse … unify them into a system"): one chevron
 * at the end of a window's row shows or hides that window's details — SHADOW's details and MOLECULES' MORE were the idiom (native-ui.js,
 * chemview.js) and fold through this since 044 A3.3, as CAMERA and MO-REGISTRY do.  `bodies` is one node or several, each
 * `.lw-fold-body` (hidden by the attribute, skin.css); closed unless `open`.  A plain module: no `app`.
 * Iteration 011 Q2 (Josh: "By default make most of the hidable texts and expandable windows minimized for default users"): the press wears
 * `data-fold` (`key`, else `what`) — its name in a card's WORKSPACE record (shell/rack-wiring.js `folds`: the open ones, written only when one
 * is), and the handle the first-visit furniture closes every fold by (rack.js, first-run.js `inner`). */
import { trig, hint } from './mir/kit.js';
let n = 0;
export function fold(row, bodies, { what = 'details', open = false, cls = '', key = '' } = {}) {
  /* 044 A8 (L89): the press is the kit's glyph trig (the chevron alone; its name says Show or Hide) */
  const list = [].concat(bodies), T = trig({ glyph: 'chevronDown', word: false, label: 'Show ' + what, cls: 'lw-fold' + (cls ? ' ' + cls : '') }), b = row.appendChild(T.root); b.dataset.fold = key || what;
  for (const x of list) { x.classList.add('lw-fold-body'); if (!x.id) x.id = 'lw-fold-' + ++n; }
  b.setAttribute('aria-controls', list.map((x) => x.id).join(' ')); hint(b, 'Show or hide {what}', { what });   // 039 V10: a fold row's press names what it does (it had no hint)
  const set = (v) => { for (const x of list) x.hidden = !v; b.setAttribute('aria-expanded', String(!!v)); T.setLabel((v ? 'Hide ' : 'Show ') + what); };
  b.addEventListener('click', () => set(list[0].hidden)); set(open);
  return { button: b, set, get: () => !list[0].hidden };
}
