/* MIR · shell/dialog.js — THE DIALOG and THE CONFIRM, so no app calls window.confirm again.
 *
 * Harvested from the six hand-rolled ones (NEBULA lab/nebula.css:95-101 and its `<dialog>.showModal()`, SOLEIL
 * sol.css:97-105, AUTOMATA automata.css:44-50, EARTH earth.css:36-44, POLAR's unstyled `<dialog>`, λWAVES'
 * `window.confirm` on a dirty open at rack.js:3913) and from λWAVES' photosensitivity trap (rack.js:6000-6030).
 * Every one of those dimmed the page (`dialog::backdrop { background: hsl(0 0% 0% / .55) }`); this one does not.
 *
 * THE LAWS IT KEEPS
 *   · NO SCRIM (INTENT rule 7).  A floating pane at menu height, CARD STYLE's material (`.glass`), and nothing behind
 *     it: no backdrop, no dimming layer, no inert veil.  The page is held by the focus trap and the press guard instead.
 *   · FOCUS IS TRAPPED AND RETURNED.  Tab and Shift+Tab cycle inside; on close the focus goes back to what had it.
 *   · DISMISS WHEN ALLOWED.  `dismiss: true` (the default): Escape and a press outside close it with `null`.  A press
 *     outside is swallowed either way (it never reaches the stage under it).  `dismiss: false` is the trap: only an
 *     action closes it.
 *   · ONE AT A TIME.  A second dialog waits in line and opens when the first closes.
 *   · KEYS STAY INSIDE.  A key pressed in the dialog does not reach the app's shortcuts (bubbling stops at the pane).
 *   · WORDS GO THROUGH THE LANGUAGE SEAM.  Title, body and action labels are English, written by `label()`, so a
 *     language change rewrites them in place.
 *
 * openDialog({ title, body, actions: [{ label, run, kind, value }], dismiss = true, kind, mark }) → { close(value), result, root }
 *   body     a string (English, translated) or a Node
 *   mark     'caution' (the kit's sign) or an element (an app's picture), seated above the title
 *   actions  each a kit trigger; kind 'primary' (its label in accent A, and it takes the focus) or 'danger';
 *            pressing one resolves `result` with run()'s return (awaited) or else its `value`
 *   result   Promise: the action's value, or null when dismissed
 * confirmDialog(text, { yes = 'OK', no = 'CANCEL', title, danger }) → Promise<boolean> */
import { el, label, trig } from '../kit.js';
import { presence } from '../core/motion.js';

const SVG = 'http://www.w3.org/2000/svg';
const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const line = [];                                        // dialogs waiting their turn
let current = null;

/** the caution triangle with the "!" knocked out (λWAVES' sign, drawn in currentColor) */
function caution() {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 120 106'); svg.setAttribute('class', 'mir-caution'); svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG, 'path');
  path.setAttribute('fill', 'currentColor'); path.setAttribute('fill-rule', 'evenodd');
  path.setAttribute('d', 'M 52.20 21.50 A 9 9 0 0 1 67.80 21.50 L 104.20 84.50 A 9 9 0 0 1 96.41 98 L 23.59 98 A 9 9 0 0 1 15.80 84.50 Z '
    + 'M 55.9 31 L 64.1 31 L 61.6 64 L 58.4 64 Z M 54.4 78 A 5.6 5.6 0 1 0 65.6 78 A 5.6 5.6 0 1 0 54.4 78 Z');
  svg.appendChild(path);
  return svg;
}

export function openDialog(opts = {}) {
  let settle, job;
  const result = new Promise((r) => { settle = r; });
  job = { opts, settle, root: null, close: (v) => (job.shown ? job.shut(v) : (line.splice(line.indexOf(job), 1), settle(v === undefined ? null : v))) };
  line.push(job);
  if (!current) next();
  return { result, close: (v) => job.close(v), get root() { return job.root; } };
}

function next() {
  current = line.shift() || null;
  if (current) show(current);
}

function show(job) {
  const o = job.opts, life = new AbortController(), on = { signal: life.signal, capture: true };
  const dismiss = o.dismiss !== false;
  const prev = document.activeElement;
  const root = el('div', 'mir-dialog glass');
  root.setAttribute('role', o.kind === 'notice' ? 'alertdialog' : 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.dataset.kind = o.kind || 'dialog';
  root.tabIndex = -1;
  if (o.mark === 'caution') root.appendChild(caution()); else if (o.mark && o.mark.nodeType === 1) root.appendChild(o.mark);   // the picture above the title (the notice's art)
  const id = 'mir-dlg-' + Math.random().toString(36).slice(2, 8);
  if (o.title) { const h = label(el('h2', 'mir-dialog-title', root), o.title); h.id = id + '-t'; root.setAttribute('aria-labelledby', h.id); }
  if (o.body !== undefined && o.body !== null) {
    const b = el('div', 'mir-dialog-body', root); b.id = id + '-b'; root.setAttribute('aria-describedby', b.id);
    if (typeof o.body === 'string') label(b, o.body); else b.appendChild(o.body);
  }
  const acts = el('div', 'mir-dialog-actions', root);
  const actions = o.actions && o.actions.length ? o.actions : [{ label: 'OK', kind: 'primary', value: true }];
  let first = null, busy = false;
  for (const a of actions) {
    const t = trig({ label: a.label, onFire: async () => {
      if (busy) return; busy = true;
      let v = a.value;
      if (typeof a.run === 'function') { try { const r = await a.run(); if (r !== undefined) v = r; } catch (e) { busy = false; console.error(e); return; } }
      shut(v === undefined ? true : v);
    } });
    if (a.kind) t.root.dataset.kind = a.kind;
    acts.appendChild(t.root);
    if (!first || a.kind === 'primary') first = first && first.dataset.kind === 'primary' ? first : t.root;
  }
  job.root = root; job.shown = true;
  root.hidden = true;
  document.body.appendChild(root);
  presence(root, true);
  (first || root).focus({ preventScroll: true });

  const inside = (n) => n instanceof Node && root.contains(n);
  /* the trap: Tab cycles inside; Escape dismisses when allowed */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      const f = [...root.querySelectorAll(FOCUSABLE)].filter((n) => !n.hidden && n.offsetParent !== null);
      if (!f.length) { e.preventDefault(); root.focus(); return; }
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && (i === f.length - 1 || i < 0)) { e.preventDefault(); f[0].focus(); }
    } else if (e.key === 'Escape') {
      e.preventDefault(); e.stopPropagation();
      if (dismiss) shut(null);
    } else if (!inside(e.target)) { e.stopPropagation(); }
  }, on);
  root.addEventListener('keydown', (e) => { if (e.key !== 'Tab') e.stopPropagation(); }, { signal: life.signal });   // keys stay in the pane
  /* the focus cannot leave by a pointer either */
  document.addEventListener('focusin', (e) => { if (!inside(e.target)) (first || root).focus({ preventScroll: true }); }, on);
  /* a press outside: swallowed (it never acts on the page under the pane), and dismisses when allowed */
  let swallow = false;
  window.addEventListener('pointerdown', (e) => {
    if (inside(e.target)) return;
    e.preventDefault(); e.stopPropagation(); swallow = true;
    if (dismiss) shut(null);
  }, on);
  window.addEventListener('click', (e) => { if (swallow && !inside(e.target)) { e.preventDefault(); e.stopPropagation(); } swallow = false; }, on);

  let done = false;
  function shut(v) {
    if (done) return; done = true;
    /* the click that followed an outside press must still be swallowed after we are gone */
    const tail = new AbortController();
    if (swallow) { window.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); tail.abort(); }, { capture: true, signal: tail.signal }); setTimeout(() => tail.abort(), 400); }
    life.abort();
    if (prev && prev.isConnected && typeof prev.focus === 'function') { try { prev.focus({ preventScroll: true }); } catch (_) {} }
    presence(root, false).then(() => root.remove());
    job.settle(v);
    current = null;
    next();
  }
  job.shut = shut;
}

/** confirmDialog(text, { yes, no, title, danger }) → Promise<boolean>; Escape or a press outside is "no" */
export function confirmDialog(text, { yes = 'OK', no = 'CANCEL', title, danger = false } = {}) {
  return openDialog({ title, body: text, actions: [{ label: no, value: false }, { label: yes, value: true, kind: danger ? 'danger' : 'primary' }] })
    .result.then((v) => v === true);
}
