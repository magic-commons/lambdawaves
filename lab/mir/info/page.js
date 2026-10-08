/* info/page.js — A PAGE ON THE PICTURE: one markdown file becomes INFORMATIONAL's blocks and labels.
 *
 * THE MENTALITY (Josh, 2026-10-01): "if a user wants to do a tutorial or guide thing, then that could be up to the
 * user to add.  That's what the multiple pages are for which are really just different .mds."  So a page is a plain
 * markdown file (shell/pages.js holds them), and this module only READS one: the kit has no tutorial, guide or tour
 * machinery, and no title card.  The greeting is page 0, shown as it is.
 *
 * THE SYNTAX — a label is an Obsidian callout, so the page still reads well in Obsidian:
 *     > [!mir|nucleus] The nucleus                    a label on the feature the app calls `nucleus`, titled
 *     > Period $p = 3$, at $c \approx -0.1226 + 0.7449i$.
 *     > [!mir|@-0.20+0.42i flat]                      a label at a PLACE in the app's own coordinates, its line chosen
 *     > [!mir|ui:page-next] Turn the page             a label on a CONTROL (data-info~="page-next", or id="page-next")
 *   The word after the bar is the anchor; one optional word after it chooses the line (`flat` · `diagonal`, or the long
 *   names); the title is optional.  Every other callout (`> [!note]` …) is ordinary prose.  Everything that is not a
 *   label is block text, and a `---` on a line of its own separates blocks (a `---` under a paragraph is therefore never
 *   read as a setext heading).  Markdown and `$maths$` pass through
 *   untouched (the layer renders them).  Fenced code is never read for labels or rules.  A YAML front matter at the very
 *   top (Obsidian's properties) is skipped.
 *
 * THE LAWS
 *   PURE           parsePage has no DOM; node-tested (tests/info-page.node.mjs).
 *   ONE PAGE       showPage puts one page on a layer: showing another runs the old one's exit, then the new one's
 *                  entrance.  clear() takes it away.  Labels the app added itself are never touched.
 *   PLACES         `@…` is handed to the app's `place(text) → { x, y, r } | null` (stage CSS px), asked again on every
 *                  viewChanged(); null or off the stage hides the label and its line until it returns (info/layer.js).
 *   CONTROLS       `ui:name` follows the element live wherever it is in the document; its line is drawn on the
 *                  layer's document-wide overlay (info/layer.js, THE OVERLAY).
 *   THE GREETING   greet() shows pages[0] when pages.shouldGreet(): it holds still 2500 ms, then leaves on Escape or
 *                  on the first press on the stage (the layer is click-through, so that press still reaches the app).
 *                  `first: true` shows only its first part, up to the first `---`.
 *
 *   parsePage(md)                      → { blocks: [{ md }], labels: [{ anchor, kind, line, title, md }] }
 *   anchorKind(anchor)                 → 'feature' | 'place' | 'control'
 *   showPage(layer, page, { place?, controls?, pane?, hold? }) → { clear(), page, labels, blocks }
 *     page: a pages-model row ({ md }), a markdown string, or a parsed page
 *   greet(layer, pages, { hold?, first?, pane?, place?, controls?, onDismiss? }) → { dismiss(), shown }
 *     first: true shows only the page's first part, up to its first `---` (a long page would fill the picture)
 *   firstPart(md)                      → the markdown up to the first `---` */
import { isField } from '../core/pointer.js';

const CALLOUT = /^\s{0,3}>\s?\[!mir\|([^\]\s|]+)(?:\s+([a-z-]+))?\s*\][+-]?[ \t]*(.*)$/i;
const FENCE = /^\s{0,3}(`{3,}|~{3,})/;
const RULE = /^\s{0,3}-{3,}\s*$/;
const LINES = { flat: 'flat-first', 'flat-first': 'flat-first', diagonal: 'diagonal-first', 'diagonal-first': 'diagonal-first' };

/** anchorKind(anchor) — `@…` is a place, `ui:…` a control, any other word a feature the app names */
export const anchorKind = (a) => (a.startsWith('@') ? 'place' : /^ui:/i.test(a) ? 'control' : 'feature');

/** parsePage(md) → { blocks, labels }.  CRLF, CR and a byte-order mark are accepted. */
export function parsePage(md) {
  const lines = String(md ?? '').replace(/^﻿/, '').replace(/\r\n?/g, '\n').split('\n');
  let i = 0;
  /* Obsidian's properties: a YAML block at the very top, between two `---` lines */
  if (RULE.test(lines[0] || '') && lines[0].trim() === '---') {
    const end = lines.findIndex((l, k) => k > 0 && l.trim() === '---');
    if (end > 0 && lines.slice(1, end).every((l) => /^\s*$|^[\w-]+\s*:|^\s+|^\s*-\s/.test(l))) i = end + 1;
  }
  const blocks = [], labels = [];
  let cur = [], fence = null;
  const flush = () => { const t = trimBlank(cur).join('\n'); if (t.trim()) blocks.push({ md: t }); cur = []; };
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (fence) { cur.push(line); if (line.trim().startsWith(fence)) fence = null; continue; }
    const f = FENCE.exec(line);
    if (f) { fence = f[1][0].repeat(3); cur.push(line); continue; }
    if (RULE.test(line)) { flush(); continue; }
    const c = CALLOUT.exec(line);
    if (c) {
      const body = [];
      while (i + 1 < lines.length && /^\s{0,3}>/.test(lines[i + 1])) body.push(lines[++i].replace(/^\s{0,3}>\s?/, ''));
      const word = (c[2] || '').toLowerCase();
      /* a second word that is not a line is ignored (Obsidian's callout metadata is free text) */
      labels.push({ anchor: c[1], kind: anchorKind(c[1]), line: LINES[word] || 'auto', title: c[3].trim(), md: trimBlank(body).join('\n') });
      continue;
    }
    cur.push(line);
  }
  flush();
  return { blocks, labels };
}
/** firstPart(md) — the page up to its first `---` (front matter and fenced code read as parsePage reads them) */
export function firstPart(md) {
  const lines = String(md ?? '').replace(/^﻿/, '').replace(/\r\n?/g, '\n').split('\n');
  let i = 0, fence = null;
  if ((lines[0] || '').trim() === '---') {
    const end = lines.findIndex((l, k) => k > 0 && l.trim() === '---');
    if (end > 0 && lines.slice(1, end).every((l) => /^\s*$|^[\w-]+\s*:|^\s+|^\s*-\s/.test(l))) i = end + 1;
  }
  const start = i;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (fence) { if (line.trim().startsWith(fence)) fence = null; continue; }
    const f = FENCE.exec(line);
    if (f) { fence = f[1][0].repeat(3); continue; }
    if (RULE.test(line) && lines.slice(start, i).some((l) => l.trim())) break;   // a rule before any words is not an end
  }
  return lines.slice(start, i).join('\n');
}
function trimBlank(ls) { let a = 0, b = ls.length; while (a < b && !ls[a].trim()) a++; while (b > a && !ls[b - 1].trim()) b--; return ls.slice(a, b); }

/* ── on the layer ─────────────────────────────────────────────────────────────────────────────────────────────── */
const SHOWN = new WeakMap();                                         // layer → the page it shows now

const parsed = (page) => (page && Array.isArray(page.blocks) && Array.isArray(page.labels) ? page : parsePage(typeof page === 'string' ? page : page && page.md));

/** showPage(layer, page, opts) — put a page on the layer; the page it showed before leaves first */
export function showPage(layer, page, { place = null, controls = null, pane, hold = 0 } = {}) {
  const P = parsed(page);
  const prev = SHOWN.get(layer);
  let handles = [], cleared = false;
  const places = new Map();                                          // one anchor per place text, so labels there comb
  const anchorOf = (l) => {
    if (l.kind === 'place') {
      if (!places.has(l.anchor)) { const text = l.anchor.slice(1); places.set(l.anchor, () => (place ? place(text) : null)); }
      return places.get(l.anchor);
    }
    if (l.kind === 'control') return 'ui:' + l.anchor.slice(3);
    return l.anchor;
  };
  const put = () => {
    if (cleared) return;
    for (const b of P.blocks) handles.push(layer.addBlock({ md: b.md, hold, ...(pane === undefined ? {} : { pane: !!pane }) }));
    for (const l of P.labels) handles.push(layer.addLabel({ anchor: anchorOf(l), title: l.title, md: l.md, line: l.line, ...(l.kind === 'control' && controls ? { control: controls } : {}) }));
  };
  const me = {
    page: P,
    get blocks() { return handles.filter((h) => h.el.classList.contains('mir-info-block')); },
    get labels() { return handles.filter((h) => h.el.classList.contains('mir-info-label')); },
    /** clear() → a promise that resolves once the page's exit has landed */
    clear() {
      cleared = true; if (SHOWN.get(layer) === me) SHOWN.delete(layer);
      const hs = handles; handles = [];
      return Promise.all(hs.map((h) => h.remove()));
    },
  };
  SHOWN.set(layer, me);
  if (prev) prev.clear().then(put); else put();                       // the old page's exit, then this one's entrance
  return me;
}

/** greet(layer, pages, opts) — page 0, if the project wants it: still for `hold` ms, then gone on Escape or on the
 *  first press on the stage.  No title card, no chrome: it is the page, shown as a block. */
export function greet(layer, pages, { hold = 2500, onDismiss = null, first = false, ...opts } = {}) {
  if (!pages || !pages.shouldGreet()) return { shown: false, dismiss() {} };
  const g = pages.greeting();
  const shown = showPage(layer, first ? firstPart(typeof g === 'string' ? g : g && g.md) : g, { ...opts, hold });
  const stage = layer.stage, win = (stage && stage.ownerDocument.defaultView) || globalThis;
  const life = new AbortController(), until = performance.now() + hold;
  let gone = false;
  const dismiss = () => {
    if (gone) return Promise.resolve(); gone = true; life.abort();
    if (SHOWN.get(layer) !== shown) return Promise.resolve();         // another page has already taken its place
    const p = shown.clear();
    if (onDismiss) p.then(() => onDismiss());
    return p;
  };
  win.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !isField(e.target, true)) dismiss(); }, { signal: life.signal });
  if (stage) stage.addEventListener('pointerdown', () => { if (performance.now() >= until) dismiss(); }, { signal: life.signal, passive: true });
  return { shown: true, page: shown, dismiss };
}
