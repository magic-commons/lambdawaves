/* MIR · shell/about.js — the ABOUT face: what every app on MIR says about itself.
 *
 * The DOM is λWAVES' `.nb-aboutface` (index.html), built from data instead of written by hand:
 *   .nb-logo            filled from the wordmark when the face first shows (shell/notebook.js)
 *   .ab-eyebrow ABOUT
 *   .ab-version         the build line; its first " · " part is the uppercase .ab-tag
 *   .ab-tagline         one sentence
 *   .ab-fine            the copyright line
 *   .ab-fine            THE LICENCE — by default the GPL-3.0-only notice with LICENSE and NOTICE links
 *   .ab-rule
 *   .ab-eyebrow SPECIAL THANKS, then .ab-credit lines (optional)
 *   .ab-credit.ab-team, .ab-credit.ab-made   (optional)
 *   .ab-rule
 *   .ab-fine            THE TYPE — by default the kit's three faces and their SIL OFL 1.1 licences
 *   .ab-actions         COPY DUMP (the notebook wires it) and a home link (optional)
 *
 * RICH TEXT WITHOUT innerHTML.  A line is a string, or an array of parts where a part is a string (text; '\n' is a
 * line break) or [text, href] (a link that opens a new tab without a handle on this window).  An href whose scheme
 * could run or smuggle content (javascript:, data:, vbscript:, file:, blob:) is dropped and its words stay as text —
 * the same rule the notebook's renderer applies to a note.
 *
 * aboutFace(face, data) → face;  data = { name, version, tagline, copyright, licence, thanks, team, made, type, home, dump } */
import { el } from '../kit.js';

const NBSP = '\u00a0';
export const safeHref = (u) => !/^(?:javascript|data|vbscript|file|blob):/i.test(String(u).replace(/[\u0000-\u0020]/g, ''));

/** the licence line an app on the GPL writes unless it says otherwise; `notice: null` when the app has no NOTICE */
export const gplLicence = (name, { license = './LICENSE', notice = './NOTICE' } = {}) =>
  [`GNU GPL v3.0 only — no warranty. You may redistribute and modify ${name} under its terms — `, ['LICENSE', license], ...(notice ? [' and ', ['NOTICE', notice]] : [])];
/** the type line for the kit's own faces; `fonts` is where their licence texts are served (adopt copies fonts/ to
 *  lab/fonts/, beside the app's index.html, so the default is right for an adopted app) */
export const kitType = (extra = [], fonts = './fonts/') => ['Type: ', ['LW' + NBSP + 'Title', fonts + 'Spinwerad-OFL.txt'], ', a renamed subset of Spinwerad by gluk · ',
  ['Roboto', fonts + 'Roboto-OFL.txt'], ' · ', ['STIX' + NBSP + 'Two' + NBSP + 'Math', fonts + 'STIXTwoMath-OFL.txt'], ' — all SIL OFL 1.1, subset for this app.', ...extra];

export function richText(node, line) {
  const parts = Array.isArray(line) ? line : [line];
  for (const part of parts) {
    if (Array.isArray(part)) {
      if (!safeHref(part[1])) { node.appendChild(document.createTextNode(String(part[0]))); continue; }
      const a = document.createElement('a'); a.textContent = part[0]; a.href = part[1]; a.target = '_blank'; a.rel = 'noopener'; node.appendChild(a); continue;
    }
    const s = String(part).split('\n');
    s.forEach((chunk, i) => { if (i) node.appendChild(document.createElement('br')); if (chunk) node.appendChild(document.createTextNode(chunk)); });
  }
  return node;
}

export function aboutFace(face, data = {}) {
  const name = data.name || 'this app';
  const logo = el('div', 'nb-logo', face); logo.setAttribute('aria-label', name);
  el('div', 'ab-eyebrow', face, 'ABOUT');
  const v = el('div', 'ab-version', face);
  if (data.version) { const i = data.version.indexOf(' · '); el('span', 'ab-tag', v, i < 0 ? data.version : data.version.slice(0, i)); if (i >= 0) v.appendChild(document.createTextNode(data.version.slice(i))); }
  if (data.tagline) richText(el('p', 'ab-tagline', face), data.tagline);
  if (data.copyright) richText(el('p', 'ab-fine', face), data.copyright);
  if (data.licence !== false) richText(el('p', 'ab-fine', face), data.licence || gplLicence(name));
  el('div', 'ab-rule', face);
  if (data.thanks && data.thanks.length) { el('div', 'ab-eyebrow', face, 'SPECIAL THANKS'); for (const line of data.thanks) richText(el('p', 'ab-credit', face), line); }
  if (data.team) richText(el('p', 'ab-credit ab-team', face), data.team);
  if (data.made) richText(el('p', 'ab-credit ab-made', face), data.made);
  if (data.type !== false) { el('div', 'ab-rule', face); richText(el('p', 'ab-fine', face), data.type || kitType()); }
  const actions = el('div', 'ab-actions', face);
  if (data.dump !== false) { const b = el('button', 'nb-dump', actions, 'COPY DUMP'); b.type = 'button'; }
  if (data.home && safeHref(data.home.href)) { const a = el('a', 'ab-home', actions, data.home.label || 'RETURN HOME'); a.href = data.home.href; }
  return face;
}
