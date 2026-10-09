/* core/intake.js — THE ONE WAY IN: a dropped file, a pasted text or picture, or the file picker, each turned into a
 * CHECKED envelope (core/envelope.js) or a rejection with its reason.
 *
 * WHAT COMES IN, AND WHAT IT BECOMES
 *   .md · .markdown · .txt          a `page` envelope: the title is the file name (shell/pages.js pageFromFile)
 *   .png · image/png                the envelope its `mir` chunk carries (core/png.js); none → "this picture carries no
 *                                   MIR data" (a screenshot or a chat app drops the chunk)
 *   .json · .mir · anything else    parsed as an envelope; a packed text ('mir1.z.…') is unpacked
 *   pasted text                     an envelope (JSON or packed); other text becomes a `page` only if `accept` takes pages
 *
 * THE LAWS IT KEEPS
 *   · ONE CHECKER.  Every envelope, whatever door it came through, goes through check() before onEnvelope sees it; the
 *     envelope handed on is the checker's clean copy.  A kind not in `accept` is refused by name.
 *   · A PICTURE CARRIES DATA, NEVER CODE.  Nothing here evaluates anything; a skin from a picture is values, checked.
 *   · THE DROP GUIDE IS THE KIT'S.  While a file is over the target it carries `data-prox="capture"` on the
 *     `.mir-prox-host` class, so core.css draws the same guide core/proximity.js draws for every other drop.
 *   · A PASTE INTO A FIELD IS THE FIELD'S.  Paste is ignored while the focus is in an input, a textarea or editable text.
 *   · Every listener lives under one AbortController; destroy() removes them, the class and the attribute.
 *   · Touch and keyboard: the picker is the way in without a drag (an app's button calls pick()).
 *
 * createIntake({ target, accept?, check?, onEnvelope, onReject?, paste? }) → { pick, ingest, destroy }
 *   check     the options for envelope.check ({ tokens, settings?, app? }), or a function (envelope) → result
 *   paste     where paste is heard: default target's document; false for none
 * readInput(input, { name?, type?, accept?, check? }) → Promise<{ ok, envelope, errors, warnings, source }>
 *   input is a File/Blob, a string, or a Uint8Array.  Never throws. */
import { KINDS, LIMITS, wrap, unwrap, unpackText, check as checkEnvelope } from './envelope.js';
import { extract } from './png.js';
import { pageFromFile } from '../shell/pages.js';
import { setAttr } from './perf.js';
import { t } from './i18n.js';

const isPngName = (name, type) => /\.png$/i.test(name || '') || type === 'image/png';
const isMdName = (name, type) => /\.(md|markdown|txt)$/i.test(name || '') || type === 'text/markdown' || type === 'text/plain' && !name;
const reject = (why, source, path = '') => ({ ok: false, envelope: null, errors: [{ path, why }], warnings: [], source });

/** readInput(input, opts) → Promise<result>: the pure-ish heart (no DOM beyond File/Blob reading), shared by every door */
export async function readInput(input, { name = '', type = '', accept = KINDS, check = {}, source = 'file' } = {}) {
  try {
    let env = null, errors = null;
    if (input && typeof input === 'object' && typeof input.arrayBuffer === 'function') {          // File / Blob
      name = name || input.name || ''; type = type || input.type || '';
      if (input.size > LIMITS.file) return reject(t('the file is larger than 32 MB'), source);
      if (isPngName(name, type)) {
        env = extract(new Uint8Array(await input.arrayBuffer()));
        if (!env) return reject(t('this picture carries no MIR data (a screenshot, a chat app or an editor drops it; use the saved file)'), source);
      } else {
        const text = await input.text();
        if (isMdName(name, type) && !/^\s*\{\s*"mir"/.test(text)) env = wrap('page', pageFromFile(name, text));
        else ({ envelope: env, errors } = /^\s*mir1\./.test(text) ? await unpackText(text) : unwrap(text));
      }
    } else if (input instanceof Uint8Array) {
      if (isPngName(name, type) || (input[0] === 137 && input[1] === 80)) { env = extract(input); if (!env) return reject(t('this picture carries no MIR data'), source); }
      else ({ envelope: env, errors } = unwrap(input));
    } else if (typeof input === 'string') {
      const t = input.trim();
      if (/^mir1\./.test(t)) ({ envelope: env, errors } = await unpackText(t));
      else if (/^\{/.test(t)) ({ envelope: env, errors } = unwrap(t));
      else if (accept.includes('page') && t) env = wrap('page', { title: name || 'PASTED', md: input });
      else return reject(t('not a MIR file (nothing here takes plain text)'), source);
    } else return reject(t('nothing to read'), source);
    if (!env) return { ok: false, envelope: null, errors: errors && errors.length ? errors : [{ path: '', why: 'not a MIR file' }], warnings: [], source };
    if (!accept.includes(env.kind)) return reject(t('this place takes {accept}; that is a {kind}', { accept: accept.join(', '), kind: env.kind }), source, 'kind');   // tr: {accept} and {kind} are kinds of MIR file (project, page …), written as their ids
    const r = typeof check === 'function' ? check(env) : checkEnvelope(env, check);
    return { ok: !!r.ok, envelope: r.ok ? r.envelope || env : null, errors: r.errors || [], warnings: r.warnings || [], source };
  } catch (e) { return reject(t('could not read it: {why}', { why: String(e && e.message || e).slice(0, 120) }), source); }
}

export function createIntake({ target, accept = KINDS, check = {}, onEnvelope, onReject, paste } = {}) {
  if (!target) throw new Error('createIntake needs a target');
  const life = new AbortController(), on = { signal: life.signal }, doc = target.ownerDocument;
  const pasteAt = paste === false ? null : paste || doc;
  target.classList.add('mir-prox-host');
  const guide = (v) => setAttr(target, 'data-prox', v ? 'capture' : null);

  async function ingest(input, opts = {}) {
    const r = await readInput(input, { accept, check, ...opts });
    if (life.signal.aborted) return r;
    if (r.ok) { if (onEnvelope) onEnvelope(r.envelope, r); } else if (onReject) onReject(r);
    return r;
  }
  const carries = (e) => { const t = e.dataTransfer && e.dataTransfer.types; return !!t && [...t].some((x) => x === 'Files' || x === 'text/plain'); };
  target.addEventListener('dragenter', (e) => { if (carries(e)) { e.preventDefault(); guide(true); } }, on);
  target.addEventListener('dragover', (e) => { if (carries(e)) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; guide(true); } }, on);
  target.addEventListener('dragleave', (e) => { if (!e.relatedTarget || !target.contains(e.relatedTarget)) guide(false); }, on);
  target.addEventListener('drop', (e) => {
    e.preventDefault(); guide(false);
    const dt = e.dataTransfer; if (!dt) return;
    if (dt.files && dt.files.length) { for (const f of dt.files) ingest(f, { source: 'drop' }); return; }
    const text = dt.getData('text/plain'); if (text) ingest(text, { source: 'drop' });
  }, on);
  doc.defaultView.addEventListener('blur', () => guide(false), on);
  if (pasteAt) pasteAt.addEventListener('paste', (e) => {
    const a = doc.activeElement;
    if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable)) return;      // a field's paste is the field's
    const cd = e.clipboardData; if (!cd) return;
    const file = cd.files && cd.files[0];
    if (file) { e.preventDefault(); ingest(file, { source: 'paste' }); return; }
    const text = cd.getData('text/plain'); if (text) { e.preventDefault(); ingest(text, { source: 'paste' }); }
  }, on);

  /** pick() — the file picker (the touch and keyboard way in) */
  function pick() {
    const input = doc.createElement('input');
    input.type = 'file'; input.multiple = true; input.accept = '.mir,.json,.md,.markdown,.txt,.png,image/png';
    input.addEventListener('change', () => { for (const f of input.files || []) ingest(f, { source: 'picker' }); }, { once: true, signal: life.signal });
    input.click();
  }
  return {
    pick, ingest,
    destroy() { life.abort(); guide(false); target.classList.remove('mir-prox-host'); }
  };
}
