/* MIR · shell/notebook.js — the NOTEBOOK: a free glass over the stage.  Its ◐ flips NOTES between writing and
 * reading, its ⓘ flips it into the ABOUT face and back, and any face an app adds (λWAVES: ▤ PROJECTS) gets a
 * round button of its own.
 *
 * Ported from λWAVES (index.html #notebook, rack.js "THE NOTEBOOK", lab.css §notebook), 2026-09-16.  The DOM is
 * λWAVES', node for node, so mir/shell/shell.css styles it and tools/shell-parity.mjs can prove the pixels.
 *
 * THE LAWS IT CARRIES
 *   · The glass is real blur with no colour overlay (DARK adds a .22 shade behind the blur, the glass stays clear).
 *   · NOTES keeps markdown with $inline$ and $$display$$ maths; Ctrl/⌘+Enter previews.  The preview is rendered by
 *     `render` (default shell/notebook-render.js: sanitised marked + KaTeX) and a pasted book previews its first
 *     200 000 characters.  The kit carries marked and KaTeX in shell/vendor/ and loads them THE FIRST TIME A PREVIEW
 *     ASKS, and only what the page has not already loaded — an app that never previews never downloads them.
 *   · Typing never reaches the app's keys, except Ctrl/⌘+S and Ctrl/⌘+, which stay the app's.
 *   · Title: Enter opens the subtitle; Backspace on an empty subtitle removes it; ↑/↓ move between them.
 *   · Storage writes are debounced 300 ms and flushed on pagehide; move and resize write style once per frame, through
 *     the frame core's coalescer (core/frame.js), which keeps a 32 ms timer behind the rAF so a busy or throttled tab
 *     still paints (BASINS frame-coalescer.js is that timer, now the kit's own); the last frame is committed before the
 *     size is saved.
 *   · A drag belongs to the pointer that started it, primary button only; a capture that cannot be taken must not
 *     throw; pointercancel and lostpointercapture end it like pointerup.
 *   · NOTES opens 640 × 460 at 12 % from the top, ABOUT 520 × 812 (BASINS': sized to fit without a scroll; `aboutSize`
 *     says another) centred above the transport; each face remembers its own size (nbW/nbH, abW/abH); neither is ever
 *     smaller than 320 × 240 or larger than the viewport less 16 px.  THE SIZE SAVED IS THE ONE IT WAS GIVEN (the inline
 *     style: λWAVES W129), never its layout box, so a phone's full-screen layout never becomes the desktop size.
 *   · A PROJECT LANDS ON ITS NOTEBOOK ONLY WHEN IT HAS TEXT (λWAVES 0.3.1 · S2, BASINS): `project.restore()` opens the
 *     notes in the preview when the project's notebook has text, and does nothing when it has none.
 *
 * createNotebook(options) → { root, open(face), close(), toggle(), isOpen, face, moveTo, resize, size, dump,
 *                              text, title, subtitle, mode, setMode, render, html, project, destroy() }
 *   project       { capture(name), restore(saved, name) → bool, signature(), part() } — the notebook's text as part of a
 *                 project (λWAVES projects.save / open, BASINS notebookProject), for a notebook without `pages`:
 *                 capture → { title, subtitle, text } (a notebook still titled the default takes the project's name),
 *                 restore puts it back, drops the last project's pending keystrokes, and lands (above);
 *                 part() → { capture, restore, signature, subscribe } for core/project.js registerProjectPart.
 *                 null when the notebook has `pages` (the pages are the project's notes then).
 *   One notebook per page: it owns the id `notebook`.  destroy() flushes storage, removes it and its listeners.
 *   host          where the <section id="notebook"> goes (λWAVES: #stage)
 *   name          the app's name, for labels ('about λWAVES')
 *   title         the notebook's default title (default 'NOTEBOOK')
 *   storageKey    localStorage prefix for text, title, subtitle and sizes (default 'mir.notebook')
 *   about         data for shell/about.js (false: no ABOUT face)
 *   faces         [{ id, glyph, label, title, build(faceEl, api) }] — extra faces, their buttons after ◐.  A face with
 *                 `run(api)` instead of `build` is a button that runs an action and flips nothing (BASINS' ▤ opens its SAVE
 *                 window); it has no face element.  A face change is a swap, never animated (BASINS measured: no transition)
 *   render        (markdown) => html  (default: the kit's renderer)
 *   vendor        false: never load the kit's marked/KaTeX (the page brings its own, or wants none)
 *   logo          () => the wordmark element the ABOUT logo is cloned from (default #title)
 *   onLogo        () => void, after the logo is cloned (shell/accent.js paintMarks)
 *   dump          () => string, what COPY DUMP adds after the ABOUT face's own text; the press says COPIED or FAILED
 *                 (a notice, 1.4 s: BASINS' flash)
 *   keyLabel      the notebook's key, for the close button's title (λWAVES: 'J')
 *   aboutSize     { w, h } the ABOUT face opens at (default 520 × 812, BASINS'; λWAVES' own is 470 × 670)
 *   aboutRise     px the ABOUT face sits above the stage's middle so it clears the transport (default 32, BASINS')
 *   landing       with `pages`: a project lands on its notebook when a page has text ('text'); false (default) leaves
 *                 the greeting to the stage (INFORMATIONAL).  Without `pages` the law is always on (project.restore).
 *   pages         a shell/pages.js model: the notebook gets TABS (below).  Absent, nothing below exists and the
 *                 notebook is λWAVES' node for node (tests/shell.browser.mjs, tools/shell-parity.mjs).
 *   A face that carries `store` (notes/face.js notesFace) is THE SHELF: the notebook's COPY TO SHELF writes there.
 *
 * THE TABS (with `pages`; mir/shell/pages.css draws them).  Josh, 2026-10-01: "the multiple pages … are really just
 * different .mds."  The first tab is YOURS — the note open from your shelf, kept in this browser exactly as the
 * notebook's text always was.  After a divider come the open project's pages, one tab each; page 0 (the greeting)
 * carries a small 0.  The selected tab is what the title field, the text and the ◐ preview edit.
 *   · A page's text is written to the model debounced 300 ms, and flushed at once on a tab switch, when the field
 *     loses focus, on Ctrl/⌘+S or Ctrl/⌘+, (before the app's own key handler sees it), on pagehide and on destroy —
 *     so a project capture never misses the last keystrokes.
 *   · The model is the truth: its subscribe keeps the strip true when a project restores or another part (the
 *     INFORMATIONAL stage) edits a page.  A restore drops the old project's tabs; YOURS and the shelf never change.
 *   · Per tab: rename (double-click or F2), delete with an inline "delete? yes / no" (never window.confirm), reorder
 *     by drag (core/pointer.js drag, core/motion.js flip, the drop slots through core/proximity.js) and by
 *     Ctrl/⌘+←/→, an EYE that flips `shared` (a page is hidden from a visiting model unless its eye is open).
 *   · The strip is a real tablist: roving tabindex, ←/→/Home/End move and select, F2 renames, Delete asks.  Many
 *     tabs scroll sideways inside the strip, the selected one kept in view; the notebook never scrolls sideways.
 *   · The foot gains SHOW ON OPEN (only while the greeting is selected), .MD (export the tab as a file), IMPORT .MD,
 *     and COPY TO SHELF (a project page) or COPY TO PROJECT (yours).  A .md dropped on the notebook becomes a page.
 *     Every copy is a copy: the two never share an object, so editing one never changes the other.
 *   api adds: pages, shelf, selected, select(id|'yours'), yours → { title, md }, openNote({ title, md }), flush() */
import { el, label, ariaLabel, hint } from '../kit.js';
import { glyphSvg } from '../glyph.js';
import { t as tx, tn, phrase, onLanguage } from '../core/i18n.js';
/* the maths syntax the hint shows: typed exactly so in every language, so it is a var and never translated */
const SYNTAX = Object.freeze({ inline: '$inline$', display: '$$display$$' });
import { aboutFace } from './about.js';
import { renderNotebook } from './notebook-render.js';
import { pageFile, pageFromFile } from './pages.js';
import { drag } from '../core/pointer.js';
import { flip } from '../core/motion.js';
import { frame } from '../core/frame.js';
import { createProximity } from '../core/proximity.js';
import { setText, setAttr, setVar } from '../core/perf.js';
import { copyText } from './clipboard.js';
import { saveBlob } from '../folders/save-blob.js';
import { notice } from './notice.js';
import { chordFromEvent } from './keys.js';

const VENDOR = new URL('./vendor/', import.meta.url).href;
let vendorLoad = null;
/** marked and KaTeX from shell/vendor/, once per page, only the halves the page has not loaded itself */
export function loadRenderer() {
  if (window.marked && window.katex) return Promise.resolve(true);
  if (vendorLoad) return vendorLoad;
  const script = (src) => new Promise((resolve) => { const s = document.createElement('script'); s.src = src; s.onload = () => resolve(true); s.onerror = () => resolve(false); document.head.appendChild(s); });
  const jobs = [];
  if (!window.marked) jobs.push(script(VENDOR + 'marked.min.js'));
  if (!window.katex) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = VENDOR + 'katex/katex.min.css'; document.head.appendChild(l); jobs.push(script(VENDOR + 'katex/katex.min.js')); }
  vendorLoad = Promise.all(jobs).then((r) => r.every(Boolean));
  return vendorLoad;
}

const NOTES_DEF_W = 640, NOTES_DEF_H = 460, ABOUT_DEF_W = 520, ABOUT_DEF_H = 812, ABOUT_RISE = 32, NB_MIN_W = 320, NB_MIN_H = 240;
/** the keys a notebook field lets through to the app (the shelf's face keeps the same law): the chords the app's key table
 *  marks `inFields` (createApp's 'save', Ctrl/⌘+S; any inFields row an app adds), read from the table createNotebook({ keys })
 *  was handed, so a rebound save passes and nothing is typed here; with no table, Ctrl/⌘+S and Ctrl/⌘+, as before */
let fieldKeys = null;
export const APP_KEY = (e) => {
  if (fieldKeys) { const c = chordFromEvent(e, fieldKeys.platform); return !!c && fieldKeys.holders(c).some((id) => { const a = fieldKeys.get(id); return !!(a && a.inFields); }); }
  return (e.ctrlKey || e.metaKey) && !e.altKey && (e.code === 'KeyS' || e.code === 'Comma');
};
/** askInline(row, { cls, label, then, back }) → the NO button (for the caller to focus), or null if the row is already asking.
 *  An inline "label yes / no" on a row (a notebook tab, a shelf row): YES runs `then`; NO and Escape put the row back and
 *  call `back`; leaving it puts the row back.  `cls` is the class prefix: 'nb-tab' → .nb-tab-ask .nb-tab-q .nb-tab-yes .nb-tab-no */
export function askInline(row, { cls, label: words, then, back }) {
  if (row.dataset.asking !== undefined) return null;
  row.dataset.asking = '';
  const q = el('span', cls + '-ask', row); label(el('span', cls + '-q', q), words);
  const yes = label(el('button', cls + '-yes', q), 'yes'); yes.type = 'button';
  const no = label(el('button', cls + '-no', q), 'no'); no.type = 'button';
  let shut = false;
  const close = () => { if (shut) return; shut = true; delete row.dataset.asking; q.remove(); };   // removing the focused button fires focusout: once only
  yes.addEventListener('click', () => { close(); then(); });
  no.addEventListener('click', () => { close(); if (back) back(); });
  q.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.preventDefault(); close(); if (back) back(); } if (!APP_KEY(e)) e.stopPropagation(); });
  q.addEventListener('focusout', (e) => { if (!q.contains(e.relatedTarget)) close(); });
  return no;
}

export function createNotebook(options = {}) {
  const o = { name: 'this app', title: 'NOTEBOOK', storageKey: 'mir.notebook', render: renderNotebook, ...options };
  if (o.keys && typeof o.keys.holders === 'function') fieldKeys = o.keys;   // createApp passes app.keys (wave 19)
  const life = new AbortController(), on = { signal: life.signal };
  const aboutW = o.aboutSize && o.aboutSize.w > 0 ? o.aboutSize.w : ABOUT_DEF_W, aboutH = o.aboutSize && o.aboutSize.h > 0 ? o.aboutSize.h : ABOUT_DEF_H;
  const aboutRise = Number.isFinite(o.aboutRise) ? o.aboutRise : ABOUT_RISE;
  const K = { text: o.storageKey, title: o.storageKey + '.title', subtitle: o.storageKey + '.subtitle', size: o.storageKey + '.size' };
  const read = (k) => { try { return localStorage.getItem(k); } catch (_) { return null; } };
  const readSize = () => { try { return JSON.parse(read(K.size) || '{}') || {}; } catch (_) { return {}; } };

  /* ── the DOM, λWAVES' ── */
  const nb = el('section', 'nb', o.host || document.body); nb.id = 'notebook'; nb.hidden = true;
  ariaLabel(nb, 'notebook'); nb.dataset.face = 'notes';
  const head = el('header', 'nb-head', nb);
  const titles = el('div', 'nb-titles', head);
  const titleIn = el('input', 'nb-title', titles); titleIn.value = tx(o.title); titleIn.spellcheck = false;
  ariaLabel(titleIn, 'notebook title'); titleIn.title = 'the notebook’s title — type to rename';
  const subIn = el('input', 'nb-subtitle', titles); subIn.placeholder = tx('subtitle'); subIn.spellcheck = false; subIn.hidden = true;
  ariaLabel(subIn, 'notebook subtitle'); subIn.title = 'the notebook’s subtitle — type to rename';
  const tools = el('span', 'nb-tools', head);
  const tool = (cls, glyph, aria, title, vars) => { const b = el('button', cls, tools, glyph); b.type = 'button'; ariaLabel(b, aria, vars); hint(b, title, vars); return b; };
  const modeBtn = tool('nb-mode', '◐', phrase('edit or preview the notes'), phrase('Edit or preview the notebook'));
  const extra = (o.faces || []).map((f) => ({ ...f, btn: tool('nb-' + f.id + '-btn', f.glyph, f.label || f.id, f.title || f.id) }));
  const aboutBtn = o.about === false ? null : tool('nb-about', 'i', phrase('about {name}'), phrase('about {name} (and back to the notes)'), { name: o.name });
  tool('nb-close', '×', phrase('close the notebook'), o.keyLabel ? phrase('close ({key})') : phrase('close'), { key: o.keyLabel });   // tr[close ({key})]: {key} is the notebook’s shortcut key, e.g. J

  const notes = el('div', 'nb-face nb-notes', nb);
  const ta = el('textarea', 'nb-text', notes); ta.spellcheck = false;
  const yoursHint = () => (o.projectsNote ? tx('notes — markdown, {inline} and {display} maths; ctrl+enter previews — kept in this browser and in the project', SYNTAX)   // tr: {inline} and {display} are the maths syntax, $inline$ and $$display$$, shown exactly as typed
    : tx('notes — markdown, {inline} and {display} maths; ctrl+enter previews — kept in this browser', SYNTAX));   // tr: {inline} and {display} are the maths syntax, $inline$ and $$display$$, shown exactly as typed
  ta.placeholder = yoursHint();
  const view = el('div', 'nb-view md', notes);
  const foot = el('div', 'nb-foot', notes); const countEl = el('span', 'nb-count', foot);
  const copyBtn = label(el('button', 'nb-copy', foot), 'COPY'); copyBtn.type = 'button'; copyBtn.title = 'copy the notes as text';
  const faces = { notes };
  for (const f of extra) if (!f.run) { faces[f.id] = el('div', 'nb-face nb-' + f.id + 'face', nb); faces[f.id].hidden = true; }
  if (o.about !== false) { faces.about = el('div', 'nb-face nb-aboutface', nb); faces.about.hidden = true; aboutFace(faces.about, { name: o.name, ...(o.about || {}) }); }
  const grip = el('div', 'nb-grip', nb); grip.title = 'Drag to resize the notebook'; grip.setAttribute('aria-hidden', 'true');

  /* ── storage: debounced, flushed on pagehide ── */
  const pending = new Map(); let timer = 0;
  const flush = () => { timer = 0; for (const [k, v] of pending) { try { localStorage.setItem(k, v); } catch (_) {} } pending.clear(); };
  const store = (k, v) => { pending.set(k, v); if (!timer) timer = setTimeout(flush, 300); };
  window.addEventListener('pagehide', flush, on);
  ta.value = read(K.text) || '';
  { const t = read(K.title); if (t) titleIn.value = t; const s = read(K.subtitle); if (s) { subIn.value = s; subIn.hidden = false; } }

  /* ── one paint per frame for move and resize: the frame core's coalescer (the latest wins; its 32 ms timer behind the
        rAF keeps a throttled tab painting), and the last one is flushed before a size is saved ── */
  const PAINT = 'notebook:paint';
  const post = (fn) => frame.coalesce(PAINT, fn);
  const flushPaint = () => { frame.flush(PAINT); };

  /* ── title and subtitle ── */
  let tabs = null;                                                  // the tabs, when the app hands over `pages`
  const onPage = () => !!tabs && tabs.sel !== 'yours';
  titleIn.addEventListener('input', () => { if (onPage()) tabs.edit('title', titleIn.value); else store(K.title, titleIn.value); if (tabs) tabs.relabel(); });
  titleIn.addEventListener('keydown', (e) => {
    if (onPage() && e.key === 'Enter') { e.preventDefault(); ta.focus(); }   // a page has no subtitle: Enter goes to its text
    else if (e.key === 'Enter') { e.preventDefault(); subIn.hidden = false; subIn.focus(); subIn.select(); }
    if (tabs && APP_KEY(e)) tabs.flush();
    if (e.key === 'ArrowDown' && !subIn.hidden) { e.preventDefault(); subIn.focus(); }
    if (!APP_KEY(e)) e.stopPropagation();
  });
  subIn.addEventListener('input', () => store(K.subtitle, subIn.value));
  subIn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); subIn.blur(); }
    else if (e.key === 'Backspace' && !subIn.value) { e.preventDefault(); subIn.hidden = true; try { localStorage.removeItem(K.subtitle); } catch (_) {} titleIn.focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); titleIn.focus(); }
    if (!APP_KEY(e)) e.stopPropagation();
  });

  /* ── notes: write ↔ read ── */
  const paintView = () => { const src = ta.value || '*' + tx('empty — press ◐ to write') + '*'; view.innerHTML = o.render(src.length > 200000 ? src.slice(0, 200000) + '\n\n*' + tx('… preview truncated at 200 000 characters; the notes are kept whole') + '*' : src); };
  const render = () => {
    paintView();
    if (o.render === renderNotebook && o.vendor !== false && !(window.marked && window.katex)) loadRenderer().then(() => { if (nb.isConnected && nb.dataset.mode === 'view') paintView(); });
  };
  const setMode = (m) => { nb.dataset.mode = m; if (m === 'view') render(); else ta.focus(); };
  nb.dataset.mode = 'edit';
  modeBtn.addEventListener('click', () => setMode(nb.dataset.mode === 'view' ? 'edit' : 'view'));
  ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setMode('view'); } if (tabs && APP_KEY(e)) tabs.flush(); if (!APP_KEY(e)) e.stopPropagation(); });
  const count = () => {                                             // whole sentences, so a translator sees each one
    const n = ta.value.trim() ? ta.value.trim().split(/\s+/).length : 0, p = onPage();
    countEl.textContent = n ? (p ? tn(n, '{n} word · in the project', '{n} words · in the project') : tn(n, '{n} word · kept in this browser', '{n} words · kept in this browser'))
      : (p ? tx('empty · in the project') : tx('empty · kept in this browser'));
  };
  ta.addEventListener('input', () => { if (onPage()) tabs.edit('md', ta.value); else store(K.text, ta.value); count(); });
  copyBtn.addEventListener('click', () => copyText(ta.value));   // the clipboard, or the textarea fallback a tablet needs

  /* ── size and place ── */
  const clamp = (w, h) => [Math.max(NB_MIN_W, Math.min(w, window.innerWidth - 16)), Math.max(NB_MIN_H, Math.min(h, window.innerHeight - 16))];
  function resize(w, h) { const [cw, ch] = clamp(w, h); nb.style.width = cw + 'px'; nb.style.height = ch + 'px'; return [cw, ch]; }
  function saveSize() {
    /* W129: the size it was GIVEN (the inline style), never its layout box */
    const w = Math.round(parseFloat(nb.style.width)), h = Math.round(parseFloat(nb.style.height)), S = readSize();
    if (!(w > 0 && h > 0)) return;
    const [kw, kh] = nb.dataset.face === 'about' ? ['abW', 'abH'] : ['nbW', 'nbH'];
    if (S[kw] === w && S[kh] === h) return;
    try { localStorage.setItem(K.size, JSON.stringify({ ...S, [kw]: w, [kh]: h })); } catch (_) {}
  }
  let moved = false;
  const show = (face) => {
    if (!faces[face]) face = 'notes';
    /* THE HAND (1.5.0-alpha.19): a face changed while the notebook shows keeps the head's top-right corner, so its
       buttons (✎, ⓘ, ×) keep their seats; only a notebook that opens is placed afresh */
    const was = nb.hidden ? null : { right: nb.offsetLeft + nb.offsetWidth, top: nb.offsetTop, screen: nb.getBoundingClientRect().top };
    nb.hidden = false; for (const [k, f] of Object.entries(faces)) f.hidden = k !== face; nb.dataset.face = face; nb.style.removeProperty('max-height');
    const S = readSize();
    const keep = (h) => { nb.style.left = Math.max(8, was.right - nb.offsetWidth) + 'px'; nb.style.top = was.top + 'px';   // the width as drawn (the sheet's max-width may cap the given one)
      const room = window.innerHeight - was.screen - 8; if (h > room) nb.style.maxHeight = Math.max(NB_MIN_H, Math.floor(room)) + 'px'; };   // a taller face hangs from the same head and scrolls (.nb-face) rather than run off the screen; the size it was GIVEN stays the one saved
    if (face === 'about') {
      const [w, h] = resize(typeof S.abW === 'number' ? S.abW : aboutW, typeof S.abH === 'number' ? S.abH : aboutH);
      /* centred in the stage ABOVE the transport (BASINS: ≈ 64 px at the foot), so the taller face clears it */
      if (was) keep(h); else if (!moved) { nb.style.left = 'calc(50% - ' + Math.round(w / 2) + 'px)'; nb.style.top = 'max(20px, calc(50% - ' + Math.round(h / 2 + aboutRise) + 'px))'; }
      const logo = faces.about.querySelector('.nb-logo'), src = o.logo ? o.logo() : document.getElementById('title');
      if (logo && src && !logo.children.length) { for (const c of src.children) if (!c.classList.contains('ms')) logo.appendChild(c.cloneNode(true)); if (o.onLogo) o.onLogo(); }
    } else {
      const [w, h] = resize(typeof S.nbW === 'number' ? S.nbW : NOTES_DEF_W, typeof S.nbH === 'number' ? S.nbH : NOTES_DEF_H);
      if (was) keep(h); else if (!moved) { nb.style.left = 'calc(50% - ' + Math.round(w / 2) + 'px)'; nb.style.top = '12%'; }
    }
    const f = extra.find((x) => x.id === face); if (f && f.show) f.show(faces[face], api);
    if (face === 'notes') { if (tabs) tabs.reveal(); ta.focus(); }
  };
  if (aboutBtn) aboutBtn.addEventListener('click', () => show(nb.dataset.face === 'about' ? 'notes' : 'about'));
  for (const f of extra) f.btn.addEventListener('click', () => { if (f.run) f.run(api); else show(nb.dataset.face === f.id ? 'notes' : f.id); });
  nb.querySelector('.nb-close').addEventListener('click', () => { nb.hidden = true; });

  /* ── COPY DUMP: the ABOUT face's own words, then whatever the app adds ── */
  const dumpText = () => {
    const info = faces.about ? [...faces.about.children].filter((n) => !n.classList.contains('ab-actions')).map((n) => n.innerText).join('\n') : '';
    return info.replace(/\n{3,}/g, '\n\n') + (o.dump ? '\n\n' + o.dump() : '') + '\n' + navigator.userAgent;
  };
  const dumpBtn = nb.querySelector('.nb-dump');
  /* it says whether it worked (BASINS flashed COPIED / FAILED for 1.4 s): the kit's notice, through the kit's clipboard
     and its fallback (shell/clipboard.js); a refused clipboard leaves the dump in the console */
  if (dumpBtn) dumpBtn.addEventListener('click', async () => {
    const text = dumpText();
    if (await copyText(text)) notice(tx('COPIED'), { kind: 'ok', ms: 1400 });
    else { notice(tx('FAILED'), { kind: 'warn', ms: 1400 }); try { console.log(text); } catch (_) { /* no console */ } }
  });

  /* ── resize by the grip, move by the head: the pointer that started it owns it ── */
  let gd = null;
  grip.addEventListener('pointerdown', (e) => { if (e.button !== 0 || gd) return; e.preventDefault(); e.stopPropagation(); const r = nb.getBoundingClientRect(); gd = { id: e.pointerId, x: e.clientX, y: e.clientY, w: r.width, h: r.height }; try { grip.setPointerCapture(e.pointerId); } catch (_) {} });
  grip.addEventListener('pointermove', (e) => { if (!gd || e.pointerId !== gd.id) return; e.preventDefault(); const w = gd.w + (e.clientX - gd.x), h = gd.h + (e.clientY - gd.y); post(() => resize(w, h)); });
  const gend = (e) => { if (!gd || e.pointerId !== gd.id) return; flushPaint(); gd = null; try { if (grip.hasPointerCapture(e.pointerId)) grip.releasePointerCapture(e.pointerId); } catch (_) {} saveSize(); };
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) grip.addEventListener(type, gend);
  nb.addEventListener('pointerup', () => saveSize());   // the desktop's own CSS resize ends in a pointerup over the glass
  { const S0 = readSize(); if (typeof S0.nbW === 'number' && typeof S0.nbH === 'number') resize(S0.nbW, S0.nbH); }
  let nd = null;
  head.addEventListener('pointerdown', (e) => { if (e.button !== 0 || nd || e.target.closest('button, input')) return; const r = nb.getBoundingClientRect(); nd = { id: e.pointerId, dx: e.clientX - r.left, dy: e.clientY - r.top }; try { head.setPointerCapture(e.pointerId); } catch (_) {} });
  head.addEventListener('pointermove', (e) => { if (!nd || e.pointerId !== nd.id) return; moved = true; const L = Math.max(0, Math.min(window.innerWidth - 80, e.clientX - nd.dx)) + 'px', T = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - nd.dy)) + 'px'; post(() => { nb.style.left = L; nb.style.top = T; }); });
  const nend = (e) => { if (!nd || e.pointerId !== nd.id) return; flushPaint(); nd = null; };
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) head.addEventListener(type, nend);
  count();

  /* ── THE PROJECT SEAM (λWAVES rack.js projects.save / open, BASINS notebookProject), for a notebook without `pages`:
        the notebook's own { title, subtitle, text } is the project's notes.  A notebook with `pages` has none: its pages
        are the project's notes (pages.part()). ── */
  const projectSeam = o.pages ? null : {
    capture(name) {
      if (name && titleIn.value === tx(o.title)) { titleIn.value = name; store(K.title, name); }   // λWAVES: a saved NOTEBOOK takes the project's name
      return { title: titleIn.value, subtitle: subIn.value, text: ta.value };
    },
    restore(n, name) {
      if (!n || typeof n !== 'object') return false;
      if (timer) { clearTimeout(timer); timer = 0; } pending.clear();   // the last project's keystrokes must not land over this one's
      ta.value = typeof n.text === 'string' ? n.text : ''; titleIn.value = (typeof n.title === 'string' && n.title) || name || tx(o.title);
      subIn.value = typeof n.subtitle === 'string' ? n.subtitle : ''; subIn.hidden = !subIn.value;
      try { localStorage.setItem(K.text, ta.value); localStorage.setItem(K.title, titleIn.value); localStorage.setItem(K.subtitle, subIn.value); } catch (_) {}
      count();
      if (ta.value.trim()) { show('notes'); nb.dataset.mode = 'view'; }   // λWAVES 0.3.1 · S2: only a notebook with text opens, the complete notes, in the preview
      render();                                                           // the preview never keeps the last project's notes
      return true;
    },
    signature: () => JSON.stringify([titleIn.value, subIn.value, ta.value]),
    /** part() — the seam as a core/project.js part: registerProjectPart('notebook', notebook.project.part()) */
    part() {
      return {
        capture: () => projectSeam.capture(), restore: (saved) => { projectSeam.restore(saved); }, signature: projectSeam.signature,
        subscribe(fn) { const ac = new AbortController(), f = () => fn(); for (const x of [ta, titleIn, subIn]) x.addEventListener('input', f, { signal: ac.signal }); return () => ac.abort(); },
      };
    },
  };

  /* ── THE TABS: yours, then the open project's pages (only when the app hands over `pages`) ── */
  function mountTabs(P) {
    const shelf = (extra.find((f) => f.store) || {}).store || null;
    const T = { sel: 'yours' };
    let yours = null;                     // yours' fields, held while a page is selected
    let pend = null, ptimer = 0;          // { id, patch }: a page edit not yet written to the model
    const PH = { yours: yoursHint, page: () => tx('this page — markdown, {inline} and {display} maths — saved in the project', SYNTAX) };   // tr: {inline} and {display} are the maths syntax, shown exactly as typed
    notes.id = 'nb-tabpanel'; notes.setAttribute('role', 'tabpanel');
    const strip = el('div', 'nb-tabs'); notes.insertBefore(strip, notes.firstChild);
    const list = el('div', 'nb-tablist', strip); list.setAttribute('role', 'tablist'); ariaLabel(list, 'pages');
    const addBtn = el('button', 'nb-tab-add', strip, '+'); addBtn.type = 'button'; ariaLabel(addBtn, 'add a page'); addBtn.title = 'add a page to the project';

    const EYE_OPEN = glyphSvg('eye', 'gly gly-eye', 14);
    const EYE_SHUT = glyphSvg('eyeShut', 'gly gly-eyeShut', 14);
    const mkTab = (key) => {
      const w = el('div', 'nb-tab'); w.setAttribute('role', 'presentation'); w.dataset.tab = key;
      const b = el('button', 'nb-tab-b', w); b.type = 'button'; b.setAttribute('role', 'tab'); b.tabIndex = -1; b.setAttribute('aria-controls', notes.id);
      const mark = el('span', 'nb-tab-mark', b, '0'); mark.hidden = true; mark.title = 'page 0 — the greeting, shown when the project opens';
      const name = el('span', 'nb-tab-name', b);
      const t = { key, w, b, mark, name };
      b.addEventListener('click', (e) => { select(key); b.focus(); if (e.detail === 2) rename(t); });
      return t;
    };
    const mine = mkTab('yours'); mine.w.classList.add('nb-tab-mine'); mine.b.title = 'yours — the note open from your shelf, kept in this browser';
    list.appendChild(mine.w);
    const div = el('span', 'nb-tab-div', list); div.setAttribute('role', 'none'); div.setAttribute('aria-hidden', 'true');
    const tabFor = new Map();
    const pageTab = (id) => {
      const t = mkTab(id);
      t.eye = el('button', 'nb-tab-eye', t.w); t.eye.type = 'button'; t.eye.tabIndex = -1;
      t.eye.addEventListener('click', () => { const p = P.get(id); if (p) P.update(id, { shared: !p.shared }); });
      t.x = el('button', 'nb-tab-x', t.w, '×'); t.x.type = 'button'; t.x.tabIndex = -1; ariaLabel(t.x, 'delete this page'); t.x.title = 'delete this page';
      t.x.addEventListener('click', () => ask(t));
      t.drag = drag(t.b, { onStart: () => carryStart(t), onMove: (s) => carryMove(t, s), onEnd: (s) => carryEnd(t, s), onCancel: () => carryEnd(t, null) });
      return t;
    };
    const tabs = () => [mine, ...P.list().map((r) => tabFor.get(r.id)).filter(Boolean)];
    const nodes = () => tabs().map((t) => t.w);

    /* the strip, made true from the model: kept nodes (so flip can move them), created and removed by id */
    function paint() {
      const rows = P.list(), ids = new Set(rows.map((r) => r.id));
      for (const [id, t] of tabFor) if (!ids.has(id)) { t.drag.destroy(); t.w.remove(); tabFor.delete(id); }
      let prev = div;
      rows.forEach((r, i) => {
        let t = tabFor.get(r.id); if (!t) { t = pageTab(r.id); tabFor.set(r.id, t); }
        if (prev.nextSibling !== t.w) list.insertBefore(t.w, prev.nextSibling);
        prev = t.w;
        setText(t.name, (r.id === T.sel ? titleIn.value : r.title) || tx('Untitled'));
        t.mark.hidden = i !== 0; setAttr(t.w, 'data-greeting', i === 0 ? '' : null);
        if (setAttr(t.eye, 'aria-pressed', String(r.shared))) {
          t.eye.innerHTML = r.shared ? EYE_OPEN : EYE_SHUT;
          if (r.shared) ariaLabel(t.eye, 'shared with a visiting model — hide it'); else ariaLabel(t.eye, 'hidden from a visiting model — share it');
          t.eye.title = r.shared ? 'shared: a visiting model may read this page' : 'hidden: a visiting model cannot read this page';
        }
      });
      setText(mine.name, (T.sel === 'yours' ? titleIn.value : yours.title) || tx('NOTEBOOK'));
      setAttr(div, 'data-empty', rows.length ? null : '');
      paintSel(); paintFoot();
    }
    function paintSel() {
      let on = null;
      for (const t of tabs()) { const s = t.key === T.sel; setAttr(t.b, 'aria-selected', String(s)); t.b.tabIndex = s ? 0 : -1; setAttr(t.w, 'data-sel', s ? '' : null); if (s) on = t.w; }
      setAttr(nb, 'data-tab', T.sel === 'yours' ? 'yours' : 'page');
      if (on) inView(on);
    }
    function inView(w) {                                           // a tab kept in view, inside the strip
      const l = w.offsetLeft, r = l + w.offsetWidth;
      if (l < list.scrollLeft) list.scrollLeft = Math.max(0, l - 6);
      else if (r > list.scrollLeft + list.clientWidth) list.scrollLeft = r - list.clientWidth + 6;
    }
    const relabel = () => { const t = T.sel === 'yours' ? mine : tabFor.get(T.sel); if (t) setText(t.name, titleIn.value || tx(t === mine ? 'NOTEBOOK' : 'Untitled')); };

    /* edits: debounced into the model, flushed whenever they must be there */
    function flushPage() { if (ptimer) { clearTimeout(ptimer); ptimer = 0; } if (pend) { const p = pend; pend = null; P.update(p.id, p.patch); } }
    function edit(field, v) {
      if (pend && pend.id !== T.sel) flushPage();
      if (!pend) pend = { id: T.sel, patch: {} };
      pend.patch[field] = v;
      if (!ptimer) ptimer = setTimeout(flushPage, 300);
    }
    function fill() {
      if (T.sel === 'yours') {
        titleIn.value = yours.title; ta.value = yours.text; subIn.value = yours.sub; subIn.hidden = !yours.subShown; yours = null; ta.placeholder = PH.yours();
      } else {
        const p = P.get(T.sel); titleIn.value = p.title; ta.value = p.md; subIn.hidden = true; ta.placeholder = PH.page();
      }
      count(); if (nb.dataset.mode === 'view') render();
    }
    /** select(key): 'yours' or a page id.  A page that is gone selects yours. */
    function select(key) {
      if (key !== 'yours' && !P.get(key)) key = 'yours';
      if (key === T.sel && key === 'yours') { paintSel(); return; }
      if (key !== T.sel) { flushPage(); if (T.sel === 'yours') yours = { title: titleIn.value, text: ta.value, sub: subIn.value, subShown: !subIn.hidden }; }
      T.sel = key; fill(); paint();
    }
    const yoursPage = () => (T.sel === 'yours' ? { title: titleIn.value, md: ta.value } : { title: yours.title, md: yours.text });
    function openNote(page) {
      select('yours');
      titleIn.value = String(page.title ?? ''); ta.value = String(page.md ?? ''); subIn.value = ''; subIn.hidden = true;
      store(K.title, titleIn.value); store(K.text, ta.value); try { localStorage.removeItem(K.subtitle); } catch (_) {}
      count(); relabel(); show('notes'); if (nb.dataset.mode === 'view') render();
    }

    /* rename in place */
    function rename(t) {
      if (t.w.dataset.renaming !== undefined) return;
      const cur = t.key === 'yours' ? yoursPage().title : (t.key === T.sel ? titleIn.value : P.get(t.key).title);
      t.w.dataset.renaming = '';
      const inp = el('input', 'nb-tab-in'); inp.value = cur; inp.spellcheck = false; ariaLabel(inp, 'rename this tab');
      t.w.insertBefore(inp, t.b.nextSibling); inView(t.w); inp.focus(); inp.select();
      let done = false;
      const end = (keep) => {
        if (done) return; done = true;
        const v = inp.value; inp.remove(); delete t.w.dataset.renaming;
        if (keep && v !== cur) {
          if (t.key === T.sel) { titleIn.value = v; titleIn.dispatchEvent(new Event('input')); flushPage(); }
          else if (t.key === 'yours') { yours.title = v; store(K.title, v); paint(); }
          else P.update(t.key, { title: v });
        }
        t.b.focus();
      };
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); end(true); } else if (e.key === 'Escape') { e.preventDefault(); end(false); } if (!APP_KEY(e)) e.stopPropagation(); });
      inp.addEventListener('blur', () => end(true));
    }
    /* delete, after an inline "delete? yes / no" on the tab itself */
    function ask(t) {
      const no = askInline(t.w, { cls: 'nb-tab', label: 'delete?', then: () => removePage(t.key), back: () => t.b.focus() });
      if (no) { inView(t.w); no.focus(); }
    }
    function removePage(id) {
      const rows = P.list(), i = rows.findIndex((r) => r.id === id); if (i < 0) return;
      if (T.sel === id) { if (pend && pend.id === id) { clearTimeout(ptimer); ptimer = 0; pend = null; } const n = rows[i + 1] || rows[i - 1]; select(n ? n.id : 'yours'); }
      flip(nodes, () => P.remove(id));
      const t = tabFor.get(T.sel) || mine; t.b.focus();
    }
    function addPage(page, at) { flushPage(); const p = P.add(page, at); select(p.id); return p; }
    function move(id, to) { flushPage(); return flip(nodes, () => P.move(id, to)); }

    /* reorder by drag: the carried tab rides the pointer one height up; the drop slots are proximity targets */
    const prox = createProximity({ layer: document.body, reach: 64, capture: 28 });
    let carry = null;
    function carryStart(t) {
      flushPage();
      const ws = P.list().map((r) => tabFor.get(r.id).w), from = ws.indexOf(t.w);
      const R = ws.map((w) => w.getBoundingClientRect()), gap = R.length > 1 ? Math.max(0, R[1].left - R[0].right) : 4;
      const slots = [];
      for (let i = 0; i <= R.length; i++) {
        if (i === from || i === from + 1) continue;               // the places it already is
        const x = i < R.length ? R[i].left - gap / 2 : R[R.length - 1].right + gap / 2, r = R[Math.min(i, R.length - 1)];
        const rect = { left: x - 1, top: r.top + 3, width: 2, height: r.height - 6 };
        slots.push({ id: 's' + i, i, rect, hit: rect, shape: 'slot' });
      }
      carry = { t, from, slots };
      t.w.dataset.carried = '';
    }
    function carryMove(t, s) { if (!carry) return; setVar(t.w, 'translate', s.dx + 'px 0px'); prox.update({ x: s.x, y: s.y }, carry.slots); }
    function carryEnd(t, s) {
      if (!carry) return;
      const c = carry; carry = null;
      const m = s ? prox.end() : (prox.cancel(), null), hit = m && m.captured;
      const to = hit ? (hit.i > c.from ? hit.i - 1 : hit.i) : c.from;
      flip(nodes, () => { setVar(t.w, 'translate', null); delete t.w.dataset.carried; if (to !== c.from) P.move(t.key, to); });
    }

    /* the strip's keys: a real tablist */
    list.addEventListener('keydown', (e) => {
      const b = e.target.closest && e.target.closest('.nb-tab-b'); if (!b) return;
      const all = tabs(), i = all.findIndex((t) => t.b === b), t = all[i], mod = e.ctrlKey || e.metaKey;
      const go = (j) => { const n = all[Math.max(0, Math.min(all.length - 1, j))]; select(n.key); n.b.focus(); };
      if (mod && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { if (t.key !== 'yours') move(t.key, P.index(t.key) + (e.key === 'ArrowLeft' ? -1 : 1)); t.b.focus(); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') go(i + (e.key === 'ArrowLeft' ? -1 : 1));
      else if (e.key === 'Home' || e.key === 'End') go(e.key === 'Home' ? 0 : all.length - 1);
      else if (e.key === 'F2') rename(t);
      else if ((e.key === 'Delete' || e.key === 'Backspace') && t.key !== 'yours') ask(t);
      else return;
      e.preventDefault(); e.stopPropagation();
    });
    list.addEventListener('wheel', (e) => {                        // a mouse wheel scrolls the strip sideways
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || list.scrollWidth <= list.clientWidth) return;
      e.preventDefault(); list.scrollLeft += e.deltaY;
    }, { passive: false, signal: life.signal });
    addBtn.addEventListener('click', () => { addPage({ title: tx('Untitled'), md: '' }); titleIn.focus(); titleIn.select(); });

    /* the foot: SHOW ON OPEN · .MD · IMPORT .MD · COPY TO SHELF | COPY TO PROJECT */
    const acts = el('span', 'nb-pageacts'); foot.insertBefore(acts, copyBtn);
    const fbtn = (cls, title) => { const b = el('button', cls, acts); b.type = 'button'; hint(b, title); return b; };   // its words: label(), below
    const greetBtn = label(fbtn('nb-pg-greet', phrase('show this greeting when the project opens')), 'SHOW ON OPEN');
    const mdBtn = label(fbtn('nb-pg-md', phrase('save this tab as a markdown file')), '.MD');
    const impBtn = label(fbtn('nb-pg-import', phrase('add markdown files as pages of the project')), 'IMPORT .MD');
    const copyTo = label(fbtn('nb-pg-copy', ''), 'COPY TO SHELF');
    function paintFoot() {
      const g = P.greeting(), onGreet = !!g && g.id === T.sel;
      greetBtn.hidden = !onGreet; setAttr(greetBtn, 'aria-pressed', String(P.showOnOpen));
      const toShelf = T.sel !== 'yours';
      if (toShelf && copyTo.dataset.t !== 'COPY TO SHELF') label(copyTo, 'COPY TO SHELF'); else if (!toShelf && copyTo.dataset.t !== 'COPY TO PROJECT') label(copyTo, 'COPY TO PROJECT');
      copyTo.title = toShelf ? 'copy this page onto your shelf (a copy: the two never change each other)' : 'copy your note into the project as a new page (a copy)';
      copyTo.hidden = toShelf && !shelf;
    }
    const say = (s) => setText(countEl, s);
    greetBtn.addEventListener('click', () => { P.showOnOpen = !P.showOnOpen; });
    mdBtn.addEventListener('click', () => {
      flushPage(); const f = pageFile(T.sel === 'yours' ? yoursPage() : P.copyOut(T.sel));
      saveBlob(new Blob([f.text], { type: 'text/markdown' }), f.name); say(tx('saved {name}', { name: f.name }));
    });
    const MD = /\.(md|markdown|txt)$/i;
    async function addFiles(files) {
      const md = [...files].filter((f) => MD.test(f.name) || /^text\/(markdown|plain)$/.test(f.type));
      let last = null;
      for (const f of md) last = addPage(pageFromFile(f.name, await f.text()));
      if (last) say(md.length === 1 ? tx('added the page {title}', { title: last.title }) : tn(md.length, 'added {n} page', 'added {n} pages'));
      return md.length;
    }
    impBtn.addEventListener('click', () => {
      const f = document.createElement('input'); f.type = 'file'; f.multiple = true; f.accept = '.md,.markdown,.txt,text/markdown,text/plain';
      f.addEventListener('change', () => { if (f.files) addFiles(f.files); }); f.click();
    });
    copyTo.addEventListener('click', () => {
      if (T.sel === 'yours') { const y = yoursPage(); addPage({ title: y.title, md: y.md }); say(tx('copied into the project')); return; }
      flushPage(); const page = P.copyOut(T.sel); if (!shelf || !page) return;
      const path = shelf.save(shelf.freePath(page.title || tx('Untitled')), page);
      say(path ? tx('copied to the shelf as {path}', { path }) : shelf.error);
    });
    /* a .md dropped anywhere on the notebook becomes a page */
    const isFiles = (e) => !!e.dataTransfer && [...e.dataTransfer.types].includes('Files');
    nb.addEventListener('dragover', (e) => { if (!isFiles(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setAttr(nb, 'data-drop', ''); }, on);
    nb.addEventListener('dragleave', (e) => { if (!nb.contains(e.relatedTarget)) setAttr(nb, 'data-drop', null); }, on);
    nb.addEventListener('drop', (e) => { setAttr(nb, 'data-drop', null); if (!isFiles(e)) return; e.preventDefault(); addFiles(e.dataTransfer.files); }, on);

    for (const f of [ta, titleIn]) f.addEventListener('focusout', flushPage, on);
    window.addEventListener('pagehide', flushPage, on);
    const off = P.subscribe((what, id) => {
      if (what === 'restore') {                                     // another project: its tabs, never yours
        if (ptimer) clearTimeout(ptimer); ptimer = 0; pend = null;
        if (o.landing === 'text') {                                 // the landing law: it lands on its notebook only when it has text
          const lands = P.list().find((r) => String(r.md || '').trim());
          if (lands) { T.sel = 'yours'; fill(); show('notes'); select(lands.id); setMode('view'); return; }
        }
        if (T.sel !== 'yours') { T.sel = 'yours'; fill(); const g = P.greeting(); if (g) { select(g.id); return; } }   // a page was open: the new greeting, else yours
      } else if (what === 'update' && id === T.sel && !(pend && pend.id === id)) {
        const p = P.get(id); if (titleIn.value !== p.title) titleIn.value = p.title;
        if (ta.value !== p.md) { ta.value = p.md; count(); if (nb.dataset.mode === 'view') render(); }
      } else if (what === 'remove' && id === T.sel) { T.sel = 'yours'; fill(); }
      paint();
    });
    paint();
    return {
      get sel() { return T.sel; }, edit, relabel, flush: flushPage, select, openNote, addFiles, shelf,
      repaint: () => { if (!carry) paint(); ta.placeholder = T.sel === 'yours' ? PH.yours() : PH.page(); },
      reveal: () => paintSel(),                                    // the face was hidden, so the strip could not be measured
      get yours() { return yoursPage(); },
      destroy() { flushPage(); off(); prox.destroy(); for (const t of tabFor.values()) t.drag.destroy(); },
    };
  }

  const api = {
    root: nb,
    open: (face = 'notes') => show(face), close: () => { nb.hidden = true; }, toggle: () => { if (nb.hidden) show('notes'); else nb.hidden = true; },
    get isOpen() { return !nb.hidden; }, get face() { return nb.dataset.face; },
    moveTo(x, y) { moved = true; nb.style.left = x + 'px'; nb.style.top = y + 'px'; },
    resize(w, h) { const r = resize(w, h); saveSize(); return r; },
    size() { const w = Math.round(parseFloat(nb.style.width) || NOTES_DEF_W), h = Math.round(parseFloat(nb.style.height) || NOTES_DEF_H); return { w, h, custom: w !== NOTES_DEF_W || h !== NOTES_DEF_H }; },
    dump: dumpText,
    project: projectSeam,
    destroy() { if (offCapture) offCapture(); offLang(); if (tabs) tabs.destroy(); flush(); life.abort(); frame.cancel(PAINT); nb.remove(); },
    get text() { return ta.value; }, set text(v) { ta.value = v; ta.dispatchEvent(new Event('input')); },
    get title() { return titleIn.value; }, set title(v) { titleIn.value = v; titleIn.dispatchEvent(new Event('input')); },
    get subtitle() { return subIn.value; }, set subtitle(v) { subIn.value = v; subIn.hidden = !v; subIn.dispatchEvent(new Event('input')); },
    get mode() { return nb.dataset.mode; }, setMode, render: o.render, get html() { return view.innerHTML; },
    /* the tabs (null / 'yours' / no-ops without `pages`) */
    pages: o.pages || null,
    get shelf() { return tabs ? tabs.shelf : ((extra.find((f) => f.store) || {}).store || null); },
    get selected() { return tabs ? tabs.sel : 'yours'; },
    select: (key) => { if (tabs) tabs.select(key); },
    get yours() { return tabs ? tabs.yours : { title: titleIn.value, md: ta.value }; },
    /** openNote({ title, md }): a shelf note into the YOURS tab, which is selected and shown */
    openNote(page) {
      if (tabs) return tabs.openNote(page);
      titleIn.value = String(page.title ?? ''); ta.value = String(page.md ?? ''); store(K.title, titleIn.value); store(K.text, ta.value); count(); show('notes');
    },
    addFiles: (files) => (tabs ? tabs.addFiles(files) : Promise.resolve(0)),
    flush() { if (tabs) tabs.flush(); flush(); },
  };
  if (o.pages) tabs = mountTabs(o.pages);
  /* the pages model asks for the last keystrokes before every capture (pages.beforeCapture) */
  const offCapture = o.pages && o.pages.beforeCapture ? o.pages.beforeCapture(() => api.flush()) : null;
  /* a language change: the words this notebook writes itself; a stored title is the user's and is never translated */
  const offLang = onLanguage(() => {
    subIn.placeholder = tx('subtitle'); count(); if (nb.dataset.mode === 'view') paintView();
    if (tabs) tabs.repaint(); else ta.placeholder = yoursHint();
    if ((!tabs || tabs.sel === 'yours') && read(K.title) === null && !titleIn.matches(':focus')) titleIn.value = tx(o.title);
  });
  for (const f of extra) if (f.build && faces[f.id]) f.build(faces[f.id], api);
  return api;
}
