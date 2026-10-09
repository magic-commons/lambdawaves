/* MIR · shell/about.js — the ABOUT face: what every app on MIR says about itself.
 *
 * The DOM is λWAVES' `.nb-aboutface` (index.html), built from data instead of written by hand:
 *   .nb-logo            filled from the wordmark when the face first shows (shell/notebook.js)
 *   .ab-eyebrow ABOUT
 *   .ab-version         the build line; its first " · " part is the uppercase .ab-tag (`tagSplit: 'last'`: all but the last part,
 *                       BASINS' "MANDELBROT · BASINS · 2026-09-26")
 *   .ab-tagline         one sentence, or one per line of `taglines` (BASINS has two)
 *   .ab-fine            the copyright line
 *   .ab-fine            THE LICENCE — by default the GPL-3.0-only notice with LICENSE and NOTICE links
 *   .ab-rule
 *   .ab-eyebrow SPECIAL THANKS, then .ab-credit lines (optional)
 *   .ab-eyebrow `teamTitle`, then .ab-credit.ab-team   (optional; BASINS: "Independent research & Assistance")
 *   .ab-credit.ab-made  `made` as a line, or with `makers` BASINS' block: "Made with" (or `made`) over .ab-makers, one
 *                       <span>name<small>house</small></span> per maker (shell.css lays them out three across)
 *   .ab-rule
 *   .ab-fine            THE TYPE — by default the kit's three faces and their SIL OFL 1.1 licences
 *   .ab-actions         COPY DUMP (the notebook wires it) and a home link (optional)
 *
 * RICH TEXT WITHOUT innerHTML.  A line is a string, or an array of parts where a part is a string (text; '\n' is a
 * line break), [text, href] (a link that opens a new tab without a handle on this window) or { sup: text } (a superscript:
 * BASINS' 10<sup>500</sup>).  An href whose scheme
 * could run or smuggle content (javascript:, data:, vbscript:, file:, blob:) is dropped and its words stay as text —
 * the same rule the notebook's renderer applies to a note.
 *
 * 1.5.4 · WHAT TRANSLATES.  A part may also be { t: 'English {x}', vars } — the kit's own lines (the licence, the type)
 * are written so, and an app writes its tagline so when it wants it translated.  A var that is [text, href] becomes a
 * link inside the sentence, so a translator moves the link with the words instead of the code joining fragments.  A
 * plain string part is the app's own words (a name, a copyright) and is written as it is.  The eyebrows and buttons
 * are kit labels.  Every line is written again when the language changes.
 *
 * aboutFace(face, data) → face;  data = { name, version, tagSplit, tagline, taglines, copyright, licence, thanks, teamTitle, team, made,
 *                                         makers, type, home, dump } */
import { el, label } from '../kit.js';
import { t, onLanguage } from '../core/i18n.js';

const NBSP = '\u00a0';
export const safeHref = (u) => !/^(?:javascript|data|vbscript|file|blob):/i.test(String(u).replace(/[\u0000-\u0020]/g, ''));

/** the licence line an app on the GPL writes unless it says otherwise; `notice: null` when the app has no NOTICE */
export const gplLicence = (name, { license = './LICENSE', notice = './NOTICE' } = {}) => [notice
  ? { t: 'GNU GPL v3.0 only — no warranty. You may redistribute and modify {name} under its terms — {license} and {notice}', vars: { name, license: ['LICENSE', license], notice: ['NOTICE', notice] } }
  : { t: 'GNU GPL v3.0 only — no warranty. You may redistribute and modify {name} under its terms — {license}', vars: { name, license: ['LICENSE', license] } }];
/** the type line for the kit's own faces; `fonts` is where their licence texts are served (adopt copies fonts/ to
 *  lab/fonts/, beside the app's index.html, so the default is right for an adopted app) */
export const kitType = (extra = [], fonts = './fonts/') => [{ t: 'Type: {title}, a renamed subset of Spinwerad by gluk · {roboto} · {stix} — all SIL OFL 1.1, subset for this app.',
  vars: { title: ['LW' + NBSP + 'Title', fonts + 'Spinwerad-OFL.txt'], roboto: ['Roboto', fonts + 'Roboto-OFL.txt'], stix: ['STIX' + NBSP + 'Two' + NBSP + 'Math', fonts + 'STIXTwoMath-OFL.txt'] } }, ...extra];

const link = (node, part) => {
  if (!safeHref(part[1])) { node.appendChild(document.createTextNode(String(part[0]))); return; }
  const a = document.createElement('a'); a.textContent = part[0]; a.href = part[1]; a.target = '_blank'; a.rel = 'noopener'; node.appendChild(a);
};
const words = (node, str) => String(str).split('\n').forEach((chunk, i) => { if (i) node.appendChild(document.createElement('br')); if (chunk) node.appendChild(document.createTextNode(chunk)); });
const LINES = new WeakMap();   // node → the line it was written from, so a language change can write it again
/* every rich line in the document (the ABOUT face, the GUI window's ABOUT page) is written again on a language change;
   `data-t-rich` marks the nodes, the WeakMap holds their lines, and nothing runs until the language changes */
if (typeof document !== 'undefined') onLanguage(() => {
  for (const n of document.querySelectorAll('[data-t-rich]')) if (LINES.has(n)) { n.replaceChildren(); richText(n, LINES.get(n)); }
});

export function richText(node, line) {
  LINES.set(node, line); node.setAttribute('data-t-rich', '');
  const parts = Array.isArray(line) ? line : [line];
  for (const part of parts) {
    if (Array.isArray(part)) { link(node, part); continue; }
    if (part && typeof part === 'object' && part.sup != null) { const s = document.createElement('sup'); s.textContent = String(part.sup); node.appendChild(s); continue; }
    if (part && typeof part === 'object' && typeof part.t === 'string') {
      /* a sentence with its links as {vars}: the plain vars are substituted by t(), the link vars are cut out here */
      const v = part.vars || {}, plain = {};
      for (const k in v) if (!Array.isArray(v[k])) plain[k] = v[k];
      t(part.t, plain).split(/(\{\w+\})/).forEach((bit, i) => {
        const k = i % 2 ? bit.slice(1, -1) : null;
        if (k && Array.isArray(v[k])) link(node, v[k]); else words(node, bit);
      });
      continue;
    }
    words(node, part);
  }
  return node;
}

export function aboutFace(face, data = {}) {
  const name = data.name || 'this app';
  const logo = el('div', 'nb-logo', face); logo.setAttribute('aria-label', name);
  label(el('div', 'ab-eyebrow', face), 'ABOUT');
  const v = el('div', 'ab-version', face);
  if (data.version) { const i = data.tagSplit === 'last' ? data.version.lastIndexOf(' · ') : data.version.indexOf(' · '); el('span', 'ab-tag', v, i < 0 ? data.version : data.version.slice(0, i)); if (i >= 0) v.appendChild(document.createTextNode(data.version.slice(i))); }
  for (const line of data.taglines || (data.tagline ? [data.tagline] : [])) richText(el('p', 'ab-tagline', face), line);
  if (data.copyright) richText(el('p', 'ab-fine', face), data.copyright);
  if (data.licence !== false) richText(el('p', 'ab-fine', face), data.licence || gplLicence(name));
  el('div', 'ab-rule', face);
  if (data.thanks && data.thanks.length) { label(el('div', 'ab-eyebrow', face), 'SPECIAL THANKS'); for (const line of data.thanks) richText(el('p', 'ab-credit', face), line); }
  if (data.team) { if (data.teamTitle) label(el('div', 'ab-eyebrow', face), data.teamTitle); richText(el('p', 'ab-credit ab-team', face), data.team); }
  if (data.makers && data.makers.length) {
    const m = el('div', 'ab-credit ab-made', face);
    richText(el('span', 'ab-made-lead', m), data.made || { t: 'Made with' });
    const k = el('div', 'ab-makers', m);
    for (const [who, house] of data.makers) el('small', '', el('span', '', k, who), house);
  } else if (data.made) richText(el('p', 'ab-credit ab-made', face), data.made);
  if (data.type !== false) { el('div', 'ab-rule', face); richText(el('p', 'ab-fine', face), data.type || kitType()); }
  const actions = el('div', 'ab-actions', face);
  if (data.dump !== false) { const b = label(el('button', 'nb-dump', actions), 'COPY DUMP'); b.type = 'button'; }
  if (data.home && safeHref(data.home.href)) { const a = label(el('a', 'ab-home', actions), data.home.label || 'RETURN HOME'); a.href = data.home.href; }
  return face;                                                   // its rich lines relabel with every other (richText, above)
}
