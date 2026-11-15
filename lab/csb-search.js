/* lab/csb-search.js — the CONTROL SURFACE's SEARCH (014 A2 · A8: the pill over the bar; 042 Q · THE SEARCH KNOWS THE WHOLE APP, Josh 11-11: "the
 * old fashioned way … mixed with modern raycast / macOS 26 Spotlight. Keep it super clean").  Mod+K (the row `csb.search`) or the button opens it;
 * each open gathers the documents from the roads that are there (a kind without one is skipped; the molecules are the Picker's rows, read at the
 * first open), lab/search-index.js ranks them: TOP HIT, a section a kind (≤ 4 rows, ≤ 9 in all), the MOLECULES the Picker's own tiles (≤ 6, its
 * press its road).  A row is the kit's menu row: glyph · the title, its matched letters marked · the kind · an act's keycaps.  ↑ ↓ · Enter ·
 * Mod+1…9 · Tab completes · PageUp/PageDown by section · Escape clears, then closes.  The empty pill: RECENT and the scope signs.  A pick is
 * frecency (PREFERENCE `lambdawaves.q0.search`); a greyed act (its `when` says no) is listed and Enter does nothing. */
import { el, chip } from './mir/kit.js';
import { searchField, emptyLine } from './mir/shell/window-picker.js';
import { cssZoom } from './mir/core/zoom.js';
import { setGlyph } from './mir/glyph.js';
import { jsonStore } from './mir/core/prefs.js';
import { parseChord, modText, keyText } from './mir/shell/keys.js';
import { createIndex, createFrecency, scope, marks, WINDOW_WORDS } from './search-index.js';
import { WINDOW_GLYPH } from './icons.js';
import { ATOMS } from './atoms.js';
import { BASIS } from './hydrogen.js';
import { CATALOGUE } from './catalogue.js';
import { STARTERS } from './project-store.js';

const SKIP = /^(knob|control|event|picker|nodes)\./;   // rows that act on a pressed control, a tile or NODES' ground: nothing to press from here
const plain = (s) => String(s || '').replace(/<\/?m>/g, '').replace(/[_{}\\]/g, '');
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
/** an act's first chord as the kit's keycaps ('⌘' 'K' · 'Ctrl' 'K'), read from the live key table */
function capsOf(kt, row) {
  const P = (kt && kt.table && kt.table.platform) || 'other', c = (kt ? kt.window.chords(row.id) : [].concat(row.keys || []))[0], p = c && parseChord(c, P);
  return p ? [...p.mods.map((m) => modText(m, P)), keyText(p.code, P)] : [];
}

/** THE PROVIDERS: each kind's documents from its road, and what Enter does */
const PROVIDERS = {
  action: {
    docs(app) { const A = app.sh.ACTIONS; if (!A) return []; const kt = app.sh.kt;
      return A.list().filter((r) => r.group !== 'VERBS' && !r.id.startsWith('window.') && r.kind !== 'hold' && !r.stage && !SKIP.test(r.id)).map((r) => {
        const caps = capsOf(kt, r);   // 044 AV2: the title is the act's one name, its sentence the row's hint
        return { id: 'action:' + r.id, kind: 'action', key: r.id, title: r.label, hint: r.hint || '', alias: r.short || '', keys: caps.join(' '), caps, body: (r.hint || '') + ' ' + r.id,
          glyph: typeof r.icon === 'string' && r.icon ? r.icon : null, prior: (r.keys ? 0.3 : 0) + (r.short ? 0.1 : 0),
          get off() { try { return !!r.when && !r.when(); } catch (_) { return true; } } };
      }); },
    run: (app, d) => app.sh.ACTIONS.run(d.key) },
  window: {
    /* 044 A2 (L19) · ONE TABLE: the special windows are the FINDER's own rows (notebook.js `layout.special`: MODULATION · TIMELINE · CONTROL SURFACE ·
       NOTEBOOK · NODES), each with the FINDER's open-or-raise; a rack window that is one of them (NODES) or an app card (the bar's) is not listed twice */
    docs(app) { const rk = app.sh.rk; if (!rk) return [];
      const special = app.sh.layout && app.sh.layout.special ? app.sh.layout.special() : [], named = new Set(special.map((r) => r.id));
      const wins = rk.windows().filter((w) => !w.card && !named.has(w.id)).map((w) => ({ id: 'window:' + w.id, kind: 'window', key: w.id, title: w.title,
        alias: WINDOW_WORDS[w.id] || '', glyph: WINDOW_GLYPH[w.id], prior: 0.5, off: !!w.hidden, open: !!w.open && !w.hidden }));   // 044 AV2: an act named as its window (RENDER, TIMELINE) ties with it, and the window leads   // a window the mode hides is greyed (the FINDER's)
      return wins.concat(special.map((r) => ({ id: 'window:' + r.id, kind: 'window', key: r.id, title: r.title, alias: WINDOW_WORDS[r.id] || '', glyph: WINDOW_GLYPH[r.id] || r.glyph, prior: 0.5, run: r.run, open: !!(r.open && r.open()) }))); },
    run: (app, d) => (d.run ? d.run() : app.sh.ACTIONS.reveal(d.key)) },
  molecule: {
    async docs(app) { const P = app.state.picker; if (!P || !P.rows) return [];
      return (await P.rows()).map((r) => ({ id: 'molecule:' + (r.vol || '') + ':' + r.id, kind: 'molecule', title: cap(plain(r.name)), exact: [plain(r.formula), r.id], body: r.vol || '', r })); } },
  element: {
    docs: (app) => (app.w.setElement ? ATOMS.map((a) => ({ id: 'element:' + a.Z, kind: 'element', key: a.Z, title: a.name, exact: [a.symbol], alias: 'element z ' + a.Z, glyph: 'atom' })) : []),
    run(app, d) { const C = app.state.chem; if (C && C.on) C.setOn(false); app.w.setElement(d.key, true); } },   // ATOMS' preset road (041 H5)
  system: {
    docs: (app) => (app.ui.hamSeg ? ['hydrogen', 'qho', 'well', 'atom', 'central', 'cornell', 'separable', 'lattice'].map((id) => { const r = CATALOGUE.find((x) => x.id === id) || { name: id };
      return { id: 'system:' + id, kind: 'system', key: id, title: r.name.split(' ·')[0].split(' › ').pop(), alias: r.name, body: r.word || '', glyph: id === 'lattice' ? 'lattice' : 'spectrum' }; }) : []),
    run: (app, d) => app.ui.hamSeg.show(d.key) },   // ‹ SYSTEM › to it, SPECTRUM up
  state: {
    docs: (app) => (app.state.picker && app.state.picker.hydrogen ? [...BASIS].sort((a, b) => a.n - b.n || a.l - b.l || Math.abs(a.m) - Math.abs(b.m) || b.m - a.m)
      .map((b) => ({ id: 'state:' + b.id, kind: 'state', key: b.id, title: b.label, alias: `n ${b.n} l ${b.l} m ${b.m}`, body: 'hydrogen', glyph: 'orbitals', b })) : []),
    run: (app, d) => app.state.picker.hydrogen(d.b) },   // the 140 tile's press: HYDROGEN with that label alone
  project: {
    docs(app) { const P = app.sh.layout && app.sh.layout.projects; if (!P) return [];
      return P.list().filter((it) => it.folder !== 'DEMOS').map((it) => ({ id: 'project:' + it.path, kind: 'project', key: it.path, title: it.name, alias: it.folder || '', glyph: 'folders' }))
        .concat(STARTERS.map((s) => ({ id: 'project:demo:' + s.file, kind: 'project', key: s.file, title: s.name, alias: 'demo', glyph: 'folders', demo: true }))); },
    run(app, d) { const P = app.sh.layout.projects, e = !d.demo && P.entryOf(d.key); if (d.demo) return P.demo(d.key); P.show(e ? { folder: e.folder } : {}); if (e) P.folders.openEntry(e.id); } },   // FILE › OPEN RECENT's road: FOLDERS asks first over unsaved work
  page: {
    docs: (app) => (app.state.picker ? [['face', 'MAIN MENU'], ['tutorial', 'TUTORIAL'], ['atomic', 'ATOMIC'], ['molecular', 'MOLECULAR'], ['library', 'EXPANSIONS']]
      .map(([id, title]) => ({ id: 'page:' + id, kind: 'page', key: id, title, alias: 'main menu', glyph: 'picker' })) : []),
    run(app, d) { const P = app.state.picker; if (d.key !== 'face') P.show(d.key); else if (!P.shown) P.open(); } },
};
/** gather(app) → { docs, later }: every kind whose road is there; the molecules' promise apart */
export function gather(app) {
  const now = [], later = [];
  for (const p of Object.values(PROVIDERS)) { let d; try { d = p.docs(app) || []; } catch (_) { d = []; } if (d.then) later.push(d.catch(() => [])); else now.push(d); }
  return { docs: now.flat(), later: Promise.all(later).then((l) => l.flat()) };
}

export function createCsbSearch(app, { bar }) {
  const root = el('button', 'csb-search-b'); root.type = 'button'; chip(root, 'search', 'search λWAVES'); root.title = 'Search λWAVES';
  root.dataset.keyAction = 'csb.search';
  const pill = el('div', 'lw-menu glass csb-pill', document.body); pill.hidden = true;
  const input = searchField(pill, { cls: 'csb-search-in' }); input.placeholder = 'search λWAVES';   // 044 KV2: the kit's one search field (the FINDER's pill)
  input.setAttribute('aria-label', 'Search λWAVES'); input.setAttribute('role', 'combobox'); input.setAttribute('aria-autocomplete', 'list'); input.setAttribute('aria-expanded', 'false');
  const count = el('div', 'csb-count', pill); count.setAttribute('aria-live', 'polite');
  const pane = el('div', 'lw-menu glass csb-suggest', document.body); pane.hidden = true; pane.dataset.mirSurface = 'menu'; pane.setAttribute('role', 'listbox'); pane.setAttribute('aria-label', 'Results');
  pane.id = 'csbResults'; input.setAttribute('aria-controls', pane.id);
  const fr = createFrecency(jsonStore('lambdawaves.q0.search'));
  let index = null, mols = [], opts = [], at = -1, gen = 0;

  /** the index, built at each open from what is there now (a volume, a save, the mode); the molecules last read until the Picker answers */
  function build() {
    const g = ++gen, { docs, later } = gather(app);
    index = createIndex(docs.concat(mols), { frecency: fr });
    later.then((m) => { if (g !== gen || m.length === mols.length) return; mols = m; index = createIndex(docs.concat(mols), { frecency: fr }); if (!pill.hidden) find(); });
  }
  const closePane = () => { pane.hidden = true; pane.textContent = ''; opts = []; at = -1; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); };
  function close() { gen++; closePane(); input.value = ''; pill.hidden = true; root.setAttribute('aria-expanded', 'false'); }
  function mark(i) {
    at = i; opts.forEach((o, k) => { o.el.classList.toggle('on', k === i); o.el.setAttribute('aria-selected', String(k === i)); });
    if (opts[i]) { input.setAttribute('aria-activedescendant', opts[i].el.id); opts[i].el.scrollIntoView({ block: 'nearest' }); } else input.removeAttribute('aria-activedescendant');
  }
  /** the pill above the bar (below it near the top), beside the card when docked or FREE; the results on its roomier side */
  function place() {
    const b = bar(), r = b.getBoundingClientRect(), card = b.classList.contains('docked') || b.dataset.place === 'free';
    const zp = cssZoom(pill), pw = pill.offsetWidth * zp, ph = pill.offsetHeight * zp, gap = 8;   // 036 K2: seen px; written ÷ UI SCALE
    let x, y;
    if (card) { x = r.right + gap + pw <= innerWidth - 8 ? r.right + gap : r.left - gap - pw; const s = root.getBoundingClientRect(); y = s.top + s.height / 2 - ph / 2; }
    else { x = r.left + r.width / 2 - pw / 2; y = r.top - ph - gap >= innerHeight - r.bottom - ph - gap ? r.top - ph - gap : r.bottom + gap; }
    x = Math.max(8, Math.min(innerWidth - pw - 8, x)); y = Math.max(8, Math.min(innerHeight - ph - 8, y));
    pill.style.left = Math.round(x / zp) + 'px'; pill.style.top = Math.round(y / zp) + 'px';
    if (pane.hidden) return;
    const up = y + ph / 2 > innerHeight / 2, z = cssZoom(pane), room = (up ? y - gap : innerHeight - y - ph - gap) - 8;
    pane.style.maxHeight = Math.max(120, Math.round(room / z)) + 'px';
    const w = pane.offsetWidth * z, h = pane.offsetHeight * z;
    pane.style.left = Math.round(Math.max(8, Math.min(innerWidth - w - 8, x + pw / 2 - w / 2)) / z) + 'px';
    pane.style.top = Math.round((up ? Math.max(8, y - h - gap) : Math.min(innerHeight - h - 8, y + ph + gap)) / z) + 'px';
  }
  function open() { pill.hidden = false; root.setAttribute('aria-expanded', 'true'); build(); place(); input.focus(); find(); }
  function row(d, q, sec, top) {
    const b = el('div', 'mb-item csb-row' + (top ? ' csb-top' : '') + (d.off ? ' off' : ''), pane); b.setAttribute('role', 'option'); b.id = 'csb-o' + opts.length;
    if (d.off) b.setAttribute('aria-disabled', 'true'); else if (d.open) b.dataset.open = '';   // 044 AV2 (L147): an open window's row wears the FINDER's dot
    const pic = d.kind === 'molecule' && app.state.picker ? app.state.picker.suggestTile(b, d.r) : null;
    if (!pic) { const g = el('i', 'mb-icon', b); if (d.glyph) setGlyph(g, d.glyph); }
    const lbl = el('span', 'mb-lbl', b); let i = 0; b.title = d.hint || d.title;   // 044 KV2: a long name ends in an ellipsis; 044 AV2: the hint is the act's sentence, else the whole name
    for (const [s, e] of q ? marks(d.title, q) : []) { if (s > i) lbl.append(d.title.slice(i, s)); el('b', 'csb-m', lbl, d.title.slice(s, e)); i = e; }
    lbl.append(d.title.slice(i));
    el('span', 'csb-kind', b, d.kind.toUpperCase());
    if (d.caps && d.caps.length) { const k = el('span', 'mb-key', b); for (const c of d.caps) el('kbd', 'mir-cap', k, c); }
    const o = { el: b, doc: d, sec, pic }; opts.push(o);
    b.addEventListener('pointermove', () => { if (at !== opts.indexOf(o)) mark(opts.indexOf(o)); });
    b.addEventListener('click', () => act(o));
  }
  const head = (t) => el('div', 'csb-head', pane, t).setAttribute('role', 'presentation');
  function find() {
    if (pill.hidden || !index) return;
    const { kinds, q } = scope(input.value), res = q || kinds ? index.search(q, { kinds }) : [];
    pane.textContent = ''; opts = []; at = -1;
    if (!q && !kinds) {
      const recent = fr.recent(6).map((id) => index.byId(id)).filter(Boolean);
      if (recent.length) { head('RECENT'); for (const d of recent) row(d, '', 0); }
      el('div', 'csb-hint', pane, '>  actions    @  windows    #  molecules    :  states');
    } else if (!res.length) emptyLine(pane);   // 044 KV2: the one dim line, the kit's one wording ("Nothing matches")
    else {
      row(res[0].doc, q, 0, true);
      const by = new Map(); for (const r of res.slice(1)) { if (!by.has(r.doc.kind)) by.set(r.doc.kind, []); by.get(r.doc.kind).push(r.doc); }
      let n = 1, sec = 1;
      for (const [kind, list] of by) {
        if (n >= 9) break; head(kind.toUpperCase() + 'S');
        if (kind === 'molecule' && app.state.picker) {
          const strip = el('div', 'csb-tiles', pane);
          for (const d of list.slice(0, 6)) { const t = app.state.picker.suggestTile(strip, d.r), o = { el: t, doc: d, sec, tile: true }; t.setAttribute('role', 'option'); t.id = 'csb-o' + opts.length; opts.push(o);
            t.addEventListener('click', () => { fr.pick(scope(input.value).q, d.id); close(); }); t.addEventListener('pointermove', () => { if (at !== opts.indexOf(o)) mark(opts.indexOf(o)); }); }
          n++;
        } else for (const d of list.slice(0, Math.min(4, 9 - n))) { row(d, q, sec); n++; }
        sec++;
      }
    }
    count.textContent = q || kinds ? res.length + (res.length === 1 ? ' result' : ' results') : '';
    pane.hidden = false; input.setAttribute('aria-expanded', 'true');
    mark(opts.findIndex((o) => !o.doc.off)); place();
  }
  function act(o) {
    if (!o || o.doc.off) return;
    if (o.tile) { o.el.click(); return; }   // the Picker's own tile: its press, and its listener's pick
    const d = o.doc; fr.pick(scope(input.value).q, d.id);
    try { if (o.pic) o.pic.click(); else if (PROVIDERS[d.kind].run) PROVIDERS[d.kind].run(app, d); } finally { close(); }
  }
  const step = (d) => { if (!opts.length) return; let i = at; for (let k = 0; k < opts.length; k++) { i = (i + d + opts.length) % opts.length; if (!opts[i].doc.off) break; } mark(i); };
  root.addEventListener('click', () => (pill.hidden ? open() : close()));
  root.setAttribute('aria-expanded', 'false');
  input.addEventListener('input', () => { requestAnimationFrame(find); });
  input.addEventListener('keydown', (e) => {
    const k = e.key, mod = e.ctrlKey || e.metaKey;
    if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); if (input.value) { input.value = ''; find(); } else { close(); root.focus({ preventScroll: true }); } return; }
    if (k === 'ArrowDown' || k === 'ArrowUp') { e.preventDefault(); step(k === 'ArrowDown' ? 1 : -1); return; }
    if (k === 'PageDown' || k === 'PageUp') { e.preventDefault(); const s = opts[at] ? opts[at].sec : 0, secs = [...new Set(opts.map((o) => o.sec))], j = secs.indexOf(s);
      const to = secs[(j + (k === 'PageDown' ? 1 : -1) + secs.length) % secs.length]; mark(opts.findIndex((o) => o.sec === to)); return; }
    if (k === 'Tab' && opts[at]) { e.preventDefault(); input.value = (scope(input.value).kinds ? input.value.trimStart()[0] + ' ' : '') + opts[at].doc.title; find(); return; }
    if (k === 'Enter') { e.preventDefault(); act(opts[at]); return; }
    if (mod && /^Digit[1-9]$/.test(e.code)) { e.preventDefault(); act(opts[+e.code.slice(5) - 1]); }
  });
  document.addEventListener('pointerdown', (e) => { if (!pill.hidden && !pill.contains(e.target) && !pane.contains(e.target) && !root.contains(e.target)) close(); }, true);
  addEventListener('resize', () => { if (!pill.hidden) place(); }, { passive: true });
  return { root, input, pill, pane, open, close, get shown() { return !pill.hidden; } };
}

/** finderMatch(query, rows) — 044 KV2 · THE FINDER TAKES THE SEARCH'S BRAIN (MIR 1.6.0-alpha.51 createWindowPicker({ match })): the FINDER's rows ranked by
 *  lab/search-index.js, so "tmln" finds TIMELINE there as it does here.  The FINDER still lists windows only; no frecency, no kinds: one look, one
 *  matcher, two things (Josh 2026-11-13). */
export function finderMatch(query, rows) {
  const key = (r) => 'window:' + (r.section ? r.section + '/' : '') + r.id, by = new Map(rows.map((r) => [key(r), r]));
  const index = createIndex(rows.map((r) => ({ id: key(r), kind: 'window', title: r.title, alias: r.words || '', off: r.off })));
  return index.search(query).map((h) => by.get(h.doc.id)).filter(Boolean);
}
