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
 *   · Storage writes are debounced 300 ms and flushed on pagehide; move and resize write style once per frame.
 *   · A drag belongs to the pointer that started it, primary button only; a capture that cannot be taken must not
 *     throw; pointercancel and lostpointercapture end it like pointerup.
 *   · NOTES opens 640 × 460 at 12 % from the top, ABOUT 470 × 670 centred; each face remembers its own size;
 *     neither is ever smaller than 320 × 240 or larger than the viewport less 16 px.
 *
 * createNotebook(options) → { root, open(face), close(), toggle(), isOpen, face, moveTo, resize, size, dump,
 *                              text, title, subtitle, mode, setMode, render, html, destroy() }
 *   One notebook per page: it owns the id `notebook`.  destroy() flushes storage, removes it and its listeners.
 *   host          where the <section id="notebook"> goes (λWAVES: #stage)
 *   name          the app's name, for labels ('about λWAVES')
 *   title         the notebook's default title (default 'NOTEBOOK')
 *   storageKey    localStorage prefix for text, title, subtitle and sizes (default 'mir.notebook')
 *   about         data for shell/about.js (false: no ABOUT face)
 *   faces         [{ id, glyph, label, title, build(faceEl, api) }] — extra faces, their buttons after ◐
 *   render        (markdown) => html  (default: the kit's renderer)
 *   vendor        false: never load the kit's marked/KaTeX (the page brings its own, or wants none)
 *   logo          () => the wordmark element the ABOUT logo is cloned from (default #title)
 *   onLogo        () => void, after the logo is cloned (shell/accent.js paintMarks)
 *   dump          () => string, what COPY DUMP adds after the ABOUT face's own text
 *   keyLabel      the notebook's key, for the close button's title (λWAVES: 'J') */
import { el } from '../kit.js';
import { aboutFace } from './about.js';
import { renderNotebook } from './notebook-render.js';

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

const NOTES_DEF_W = 640, NOTES_DEF_H = 460, ABOUT_DEF_W = 470, ABOUT_DEF_H = 670, NB_MIN_W = 320, NB_MIN_H = 240;
const APP_KEY = (e) => (e.ctrlKey || e.metaKey) && !e.altKey && (e.code === 'KeyS' || e.code === 'Comma');

export function createNotebook(options = {}) {
  const o = { name: 'this app', title: 'NOTEBOOK', storageKey: 'mir.notebook', render: renderNotebook, ...options };
  const life = new AbortController(), on = { signal: life.signal };
  const K = { text: o.storageKey, title: o.storageKey + '.title', subtitle: o.storageKey + '.subtitle', size: o.storageKey + '.size' };
  const read = (k) => { try { return localStorage.getItem(k); } catch (_) { return null; } };
  const readSize = () => { try { return JSON.parse(read(K.size) || '{}') || {}; } catch (_) { return {}; } };

  /* ── the DOM, λWAVES' ── */
  const nb = el('section', 'nb', o.host || document.body); nb.id = 'notebook'; nb.hidden = true;
  nb.setAttribute('aria-label', 'notebook'); nb.dataset.face = 'notes';
  const head = el('header', 'nb-head', nb);
  const titles = el('div', 'nb-titles', head);
  const titleIn = el('input', 'nb-title', titles); titleIn.value = o.title; titleIn.spellcheck = false;
  titleIn.setAttribute('aria-label', 'notebook title'); titleIn.title = "the notebook's title — type to rename";
  const subIn = el('input', 'nb-subtitle', titles); subIn.placeholder = 'subtitle'; subIn.spellcheck = false; subIn.hidden = true;
  subIn.setAttribute('aria-label', 'notebook subtitle'); subIn.title = "the notebook's subtitle — type to rename";
  const tools = el('span', 'nb-tools', head);
  const tool = (cls, glyph, aria, title) => { const b = el('button', cls, tools, glyph); b.type = 'button'; b.setAttribute('aria-label', aria); b.title = title; return b; };
  const modeBtn = tool('nb-mode', '◐', 'edit or preview the notes', 'Edit or preview the notebook');
  const extra = (o.faces || []).map((f) => ({ ...f, btn: tool('nb-' + f.id + '-btn', f.glyph, f.label || f.id, f.title || f.id) }));
  const aboutBtn = o.about === false ? null : tool('nb-about', 'i', 'about ' + o.name, 'about ' + o.name + ' (and back to the notes)');
  tool('nb-close', '×', 'close the notebook', 'close' + (o.keyLabel ? ' (' + o.keyLabel + ')' : ''));

  const notes = el('div', 'nb-face nb-notes', nb);
  const ta = el('textarea', 'nb-text', notes); ta.spellcheck = false;
  ta.placeholder = 'notes — markdown, $inline$ and $$display$$ maths; ctrl+enter previews — kept in this browser' + (o.projectsNote ? ' and in the project' : '');
  const view = el('div', 'nb-view md', notes);
  const foot = el('div', 'nb-foot', notes); const countEl = el('span', 'nb-count', foot);
  const copyBtn = el('button', 'nb-copy', foot, 'COPY'); copyBtn.type = 'button'; copyBtn.title = 'copy the notes as text';
  const faces = { notes };
  for (const f of extra) { faces[f.id] = el('div', 'nb-face nb-' + f.id + 'face', nb); faces[f.id].hidden = true; }
  if (o.about !== false) { faces.about = el('div', 'nb-face nb-aboutface', nb); faces.about.hidden = true; aboutFace(faces.about, { name: o.name, ...(o.about || {}) }); }
  const grip = el('div', 'nb-grip', nb); grip.title = 'Drag to resize the notebook'; grip.setAttribute('aria-hidden', 'true');

  /* ── storage: debounced, flushed on pagehide ── */
  const pending = new Map(); let timer = 0;
  const flush = () => { timer = 0; for (const [k, v] of pending) { try { localStorage.setItem(k, v); } catch (_) {} } pending.clear(); };
  const store = (k, v) => { pending.set(k, v); if (!timer) timer = setTimeout(flush, 300); };
  window.addEventListener('pagehide', flush, on);
  ta.value = read(K.text) || '';
  { const t = read(K.title); if (t) titleIn.value = t; const s = read(K.subtitle); if (s) { subIn.value = s; subIn.hidden = false; } }

  /* ── one paint per frame for move and resize ── */
  let raf = 0, next = null;
  const post = (fn) => { next = fn; if (!raf) raf = requestAnimationFrame(() => { raf = 0; const f = next; next = null; if (f) f(); }); };
  const flushPaint = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } const f = next; next = null; if (f) f(); };

  /* ── title and subtitle ── */
  titleIn.addEventListener('input', () => store(K.title, titleIn.value));
  titleIn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); subIn.hidden = false; subIn.focus(); subIn.select(); }
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
  const paintView = () => { const src = ta.value || '*empty — press ◐ to write*'; view.innerHTML = o.render(src.length > 200000 ? src.slice(0, 200000) + '\n\n*… preview truncated at 200 000 characters; the notes are kept whole*' : src); };
  const render = () => {
    paintView();
    if (o.render === renderNotebook && o.vendor !== false && !(window.marked && window.katex)) loadRenderer().then(() => { if (nb.isConnected && nb.dataset.mode === 'view') paintView(); });
  };
  const setMode = (m) => { nb.dataset.mode = m; if (m === 'view') render(); else ta.focus(); };
  nb.dataset.mode = 'edit';
  modeBtn.addEventListener('click', () => setMode(nb.dataset.mode === 'view' ? 'edit' : 'view'));
  ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setMode('view'); } if (!APP_KEY(e)) e.stopPropagation(); });
  const count = () => { countEl.textContent = ta.value.trim() ? ta.value.trim().split(/\s+/).length + ' words · kept in this browser' : 'empty · kept in this browser'; };
  ta.addEventListener('input', () => { store(K.text, ta.value); count(); });
  copyBtn.addEventListener('click', async () => { try { await navigator.clipboard.writeText(ta.value); } catch (_) {} });

  /* ── size and place ── */
  const clamp = (w, h) => [Math.max(NB_MIN_W, Math.min(w, window.innerWidth - 16)), Math.max(NB_MIN_H, Math.min(h, window.innerHeight - 16))];
  function resize(w, h) { const [cw, ch] = clamp(w, h); nb.style.width = cw + 'px'; nb.style.height = ch + 'px'; return [cw, ch]; }
  function saveSize() {
    const w = Math.round(nb.offsetWidth), h = Math.round(nb.offsetHeight), S = readSize();
    const [kw, kh] = nb.dataset.face === 'about' ? ['abW', 'abH'] : ['nbW', 'nbH'];
    if (S[kw] === w && S[kh] === h) return;
    try { localStorage.setItem(K.size, JSON.stringify({ ...S, [kw]: w, [kh]: h })); } catch (_) {}
  }
  let moved = false;
  const show = (face) => {
    if (!faces[face]) face = 'notes';
    nb.hidden = false; for (const [k, f] of Object.entries(faces)) f.hidden = k !== face; nb.dataset.face = face;
    const S = readSize();
    if (face === 'about') {
      const w = typeof S.abW === 'number' ? S.abW : ABOUT_DEF_W, h = typeof S.abH === 'number' ? S.abH : ABOUT_DEF_H;
      resize(w, h);
      if (!moved) { nb.style.left = 'calc(50% - ' + Math.round(w / 2) + 'px)'; nb.style.top = 'max(20px, calc(50% - ' + Math.round(h / 2) + 'px))'; }
      const logo = faces.about.querySelector('.nb-logo'), src = o.logo ? o.logo() : document.getElementById('title');
      if (logo && src && !logo.children.length) { for (const c of src.children) if (!c.classList.contains('ms')) logo.appendChild(c.cloneNode(true)); if (o.onLogo) o.onLogo(); }
    } else {
      const w = typeof S.nbW === 'number' ? S.nbW : NOTES_DEF_W, h = typeof S.nbH === 'number' ? S.nbH : NOTES_DEF_H;
      resize(w, h);
      if (!moved) { nb.style.left = 'calc(50% - ' + Math.round(w / 2) + 'px)'; nb.style.top = '12%'; }
    }
    const f = extra.find((x) => x.id === face); if (f && f.show) f.show(faces[face], api);
    if (face === 'notes') ta.focus();
  };
  if (aboutBtn) aboutBtn.addEventListener('click', () => show(nb.dataset.face === 'about' ? 'notes' : 'about'));
  for (const f of extra) f.btn.addEventListener('click', () => show(nb.dataset.face === f.id ? 'notes' : f.id));
  nb.querySelector('.nb-close').addEventListener('click', () => { nb.hidden = true; });

  /* ── COPY DUMP: the ABOUT face's own words, then whatever the app adds ── */
  const dumpText = () => {
    const info = faces.about ? [...faces.about.children].filter((n) => !n.classList.contains('ab-actions')).map((n) => n.innerText).join('\n') : '';
    return info.replace(/\n{3,}/g, '\n\n') + (o.dump ? '\n\n' + o.dump() : '') + '\n' + navigator.userAgent;
  };
  const dumpBtn = nb.querySelector('.nb-dump');
  if (dumpBtn) dumpBtn.addEventListener('click', async () => { try { await navigator.clipboard.writeText(dumpText()); } catch (_) {} });

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

  const api = {
    root: nb,
    open: (face = 'notes') => show(face), close: () => { nb.hidden = true; }, toggle: () => { if (nb.hidden) show('notes'); else nb.hidden = true; },
    get isOpen() { return !nb.hidden; }, get face() { return nb.dataset.face; },
    moveTo(x, y) { moved = true; nb.style.left = x + 'px'; nb.style.top = y + 'px'; },
    resize(w, h) { const r = resize(w, h); saveSize(); return r; },
    size() { const w = Math.round(parseFloat(nb.style.width) || NOTES_DEF_W), h = Math.round(parseFloat(nb.style.height) || NOTES_DEF_H); return { w, h, custom: w !== NOTES_DEF_W || h !== NOTES_DEF_H }; },
    dump: dumpText,
    destroy() { flush(); life.abort(); if (raf) cancelAnimationFrame(raf); nb.remove(); },
    get text() { return ta.value; }, set text(v) { ta.value = v; ta.dispatchEvent(new Event('input')); },
    get title() { return titleIn.value; }, set title(v) { titleIn.value = v; titleIn.dispatchEvent(new Event('input')); },
    get subtitle() { return subIn.value; }, set subtitle(v) { subIn.value = v; subIn.hidden = !v; subIn.dispatchEvent(new Event('input')); },
    get mode() { return nb.dataset.mode; }, setMode, render: o.render, get html() { return view.innerHTML; },
  };
  for (const f of extra) if (f.build) f.build(faces[f.id], api);
  return api;
}
