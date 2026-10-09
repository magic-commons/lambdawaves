/* MIR · shell/banner.js — THE BANNER: a persistent pane of what went wrong, put down by its ×.
 *
 * Harvested from BASINS (app/overlay.js report / fail / warn / offerReload, the `#banner` in app/index.html, its sheet in
 * app/lab.css 280–297 and basins.css:5).  BASINS' words for why it exists: "The overlay is our only debugger: the user is
 * a non-programmer on an iPad with no console.  Everything funnels here."  The notice (shell/notice.js) leaves by itself;
 * the banner stays until it is dismissed, because a problem nobody had time to read is a problem nobody can report.
 *
 * THE LAWS IT KEEPS (BASINS', value for value)
 *   · DE-DUPLICATED BY TITLE.  The same title again is a count on its first line ("  (x3)"), never a second node: a
 *     failure inside a frame loop would otherwise append a node every frame and take the page down with it.
 *   · AT MOST 30 PROBLEMS are drawn; after that the console (and the dump) still has everything.
 *   · AN ERROR MAKES THE PANE AN ERROR PANE for good (`data-kind="error"`); warnings alone leave it `warn`.
 *   · DISMISSABLE.  The × hides it (26 px of ink, 44 px of finger); a new problem shows it again.
 *   · THE RELOAD OFFER is the banner's last honest move, once recovery itself has failed (a GPU that would not come back):
 *     offerReload() shows a "Reload the page" button under the problems; offerReload(false) takes it away again.
 *   · EVERY PROBLEM IS IN THE DUMP: the lines `--- problems (n) ---` (core/describe.js registerDumpLines), with each
 *     problem's detail indented under it, whether or not the pane was drawn.
 *   · installBanner({ errors: true }) also reports every uncaught error and unhandled rejection (BASINS: overlay.js).
 *   · No text shadow, no scrim: one pane over the stage, BASINS' maroon, its own ink on both themes (BASINS wave 59: the
 *     pane does not follow the theme, so its ink cannot either).
 *
 * report(severity 'error' | 'warn', title, detail?) · fail(title, detail?) · warn(title, detail?) · offerReload(on = true)
 * problems() → [string]   the dump's lines
 * installBanner({ host = #stage or <body>, errors = true }) → { root, report, fail, warn, offerReload, hide(), problems, destroy() }
 *   report() before installBanner() builds the pane in the default host; installing later moves it. */
import { el, ariaLabel, trig } from '../kit.js';
import { registerDumpLines } from '../core/describe.js';

const LIMIT = 30;
const list = [];                       // the dump's lines, one per title (its count folded in)
const seen = new Map();                // title → { n, count, idx, head, tail }
let pane = null, body = null, acts = null, kind = 'warn', life = null, offDump = null;

/** describeDetail(x) → text: an Error as name, message and stack; an object as JSON; anything else as a string (BASINS describe) */
export function describeDetail(e) {
  if (e === null || e === undefined) return String(e);
  if (typeof e === 'string') return e;
  if (e instanceof Error) return (e.name || 'Error') + ': ' + e.message + (e.stack ? '\n' + e.stack : '');
  try { return JSON.stringify(e); } catch (_) { return String(e); }
}

const defaultHost = () => (typeof document === 'undefined' ? null : document.getElementById('stage') || document.body);
function build(host) {
  if (pane) { if (host && pane.parentElement !== host) host.appendChild(pane); return pane; }
  host = host || defaultHost(); if (!host) return null;
  pane = el('div', 'mir-banner', host); pane.id = 'mir-banner'; pane.setAttribute('role', 'alert'); pane.hidden = true;
  pane.dataset.kind = kind;
  const x = el('button', 'mir-banner-x', pane, '×'); x.type = 'button';
  ariaLabel(x, 'dismiss this message'); x.title = 'dismiss';
  x.addEventListener('click', () => { pane.hidden = true; });
  body = el('div', 'mir-banner-body', pane);
  acts = el('div', 'mir-banner-acts', pane); acts.hidden = true;
  const again = trig({ label: 'Reload the page', onFire: () => location.reload() });
  again.root.classList.add('mir-banner-reload');
  acts.appendChild(again.root);
  return pane;
}
if (!offDump) offDump = registerDumpLines('problems', () => ['--- problems (' + list.length + ') ---', ...(list.length ? list : ['(none)'])]);

/** report(severity, title, detail) — the one funnel (BASINS overlay.js report, verbatim in its rules) */
export function report(severity, title, detail) {
  const sev = severity === 'error' ? 'error' : 'warn';
  const text = detail === undefined ? '' : describeDetail(detail);
  try { (sev === 'error' ? console.error : console.warn)(title, detail); } catch (_) { /* no console */ }
  const prev = seen.get(title);
  if (prev) {
    prev.n++;
    prev.count.textContent = '  (x' + prev.n + ')';
    list[prev.idx] = prev.head + '  (x' + prev.n + ')' + prev.tail;
  } else if (seen.size < LIMIT) {
    const head = '[' + sev + '] ' + title, tail = text ? '\n    ' + text.replace(/\n/g, '\n    ') : '';
    const idx = list.push(head + tail) - 1;
    if (!build()) { seen.set(title, { n: 1, count: { textContent: '' }, idx, head, tail }); return; }
    const item = el('div', 'mir-banner-item', body);
    const t = el('span', 'mir-banner-title', item, (sev === 'error' ? '⛔ ' : '⚠︎ ') + title); t.translate = false;
    const count = el('span', 'mir-banner-count', item);
    if (text) item.appendChild(document.createTextNode('\n' + text));
    seen.set(title, { n: 1, count, idx, head, tail });
  } else return;                          // the pane is full; the console still has everything
  if (!pane) return;
  if (sev === 'error') kind = 'error';
  pane.dataset.kind = kind;
  pane.hidden = false;
}
export const fail = (title, detail) => report('error', title, detail);
export const warn = (title, detail) => report('warn', title, detail);

/** offerReload(on = true) — the "Reload the page" button under the problems (BASINS overlay.js offerReload) */
export function offerReload(on = true) {
  if (!build()) return false;
  acts.hidden = !on;
  if (on) pane.hidden = false;
  return true;
}
export const problems = () => list.slice();

/** installBanner({ host, errors }) — seat the pane, and (errors: true) report every uncaught error and rejection */
export function installBanner({ host = null, errors = true } = {}) {
  build(host || defaultHost());
  if (life) life.abort();
  life = new AbortController();
  if (errors && typeof window !== 'undefined') {
    window.addEventListener('error', (ev) => fail('Uncaught error', ev.error || (ev.message + ' @ ' + ev.filename + ':' + ev.lineno + ':' + ev.colno)), { signal: life.signal });
    window.addEventListener('unhandledrejection', (ev) => fail('Unhandled promise rejection', ev.reason), { signal: life.signal });
  }
  return {
    get root() { return pane; }, report, fail, warn, offerReload, problems,
    hide() { if (pane) pane.hidden = true; },
    destroy() {
      if (life) { life.abort(); life = null; }
      if (pane) pane.remove();
      pane = body = acts = null; kind = 'warn'; seen.clear(); list.length = 0;
    },
  };
}
