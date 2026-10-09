/* MIR · core/describe.js — WHAT A VISITING MODEL CAN READ.
 *
 * Plan: MIR CLAUDE 1.5.X INFORMATIONAL + LLM PLAN 2026-10-01, §3.5.  An app hands over what it already has (its rack,
 * its parameters, its pages, its key table, its look preferences) and gets two texts back:
 *
 *   describe()  the app as a model needs it to help: the windows, every parameter with its range and current value,
 *               the key actions, and THE PAGES MARKED SHARED.  Markdown.  The same text is kept in the page, in one
 *               hidden labelled element (`#mir-describe`), for agents that only read the DOM.
 *   dump()      one block to paste to a model when something is wrong: the versions, the skin and look, the layout,
 *               the cost meter (core/perf.js), the last errors and the last input EVENTS — kinds and targets only —
 *               and then describe().
 *
 * THE LAWS IT KEEPS
 *   1. ONLY SHARED PAGES.  A page whose eye is shut (`shared !== true`) is never named, counted or quoted.
 *   2. NEVER WHAT WAS TYPED.  An event is a kind and a target described by its hooks (id, data-param, data-info,
 *      data-key-action, data-mir-window, data-mir-chip, data-action, data-menu, the first class), never by its text, its
 *      value, its title or its aria-label.  A key pressed in a field is recorded as "a key in a field", with no key.
 *      And as a last guard, any text a field on the page holds right now (4 characters or more) is cut out of the
 *      dump before it is returned.
 *   3. IDLE COSTS NOTHING.  No poller and no timer.  The hidden element is rewritten in one coalesced frame job
 *      (core/frame.js) when the pages or the keys change, and at the end of a gesture (pointerup, keyup, change).
 *      Between those its parameter values are as they were at the last rewrite; describe() always reads them live.
 *   4. ENGLISH.  A model reads the labels as the app wrote them (the English keys), whatever language the page shows.
 *   5. HIDDEN MEANS HIDDEN FROM A POLITE READER.  Anyone who opens the project file can read every page.
 *
 * createDescribe({ app, rack?, params?, pages?, keys?, prefs?, mod?, transport?, doc?, mount?, max? })
 *     → { describe(), dump(), refresh(), observe(event), events(), errors(), destroy() }
 *   app     { name, version?, what? }          what the app is, in its own words
 *   rack    a shell/rack.js rack                its windows (rack.windows()): id, title, open, built, side, floating
 *   params  [{ id, label, unit?, min, max, get() }], or a function returning them (createApp's live list)
 *   transport  a shell/transport.js bar          the one clock: playing, the tempo (with mod: the power too)
 *   pages   a shell/pages.js model              only its shared pages are read
 *   keys    a shell/keys.js table               its actions and their keys
 *   prefs   a core/prefs.js store (the GUI window's: gui.prefs)
 *   mod     the installModulation() handle      which parameters a route drives, and their base
 *   doc     the document (default: the page's); null runs without a DOM (node)
 *   mount   keep the hidden element (default true)
 *   max     how many events and errors are kept (default 20 each)
 * It also sets `window.__MIR.describe` and `window.__MIR.dump` for an agent with a console.
 *
 * Pure, node-tested: describeText(state), dumpText(state), targetOf(node), eventEntry(event), scrub(text, typed).
 *
 * THE DUMP LINES (BASINS overlay.js registerDumpLines): any module adds its own lines to every dump, by name.
 *   registerDumpLines(name, fn) — fn() → [string]; a second registration under a name replaces the first; → off()
 *   dumpLines() → [string]: every producer's lines in registration order.  TOTAL BY CONSTRUCTION: a producer that throws
 *   is one line naming it, never a lost dump (BASINS: "a broken diagnostic must never be able to destroy the dump").
 *   dump() prints them after the cost line, before the errors; the banner, the boot veil and the wake lock register theirs. */
const PRODUCERS = [];
export function registerDumpLines(name, fn) {
  if (typeof fn !== 'function') return () => false;
  const i = PRODUCERS.findIndex((p) => p.name === String(name));
  const rec = { name: String(name), fn };
  if (i >= 0) PRODUCERS[i] = rec; else PRODUCERS.push(rec);
  return () => { const j = PRODUCERS.indexOf(rec); if (j >= 0) PRODUCERS.splice(j, 1); return j >= 0; };
}
export function dumpLines() {
  const out = [];
  for (const p of PRODUCERS) {
    try { const L = p.fn(); if (Array.isArray(L)) for (const s of L) out.push(String(s)); }
    catch (e) { out.push(p.name + '  [dump producer threw: ' + String((e && e.message) || e) + ']'); }
  }
  return out;
}
import { MIR_VERSION } from '../version.js';
import { perf } from './perf.js';
import { frame } from './frame.js';
import { isField as isPlace } from './pointer.js';
import { english } from './i18n.js';   // a label's English, without the context a translator needs (time span::WINDOW → WINDOW)

export const DESCRIBE_ID = 'mir-describe';
const JOB = 'mir:describe';
const HOOKS = ['data-param', 'data-info', 'data-key-action', 'data-mir-window', 'data-mir-chip', 'data-action', 'data-menu'];

/** a place where the user types: every input counts here, so no key pressed in one is ever kept (core/pointer.js isField) */
const isField = (n) => isPlace(n, true);

/** targetOf(node) → 'tag#id.class[data-param=…]' from hooks only: never text, value, title or aria-label */
export function targetOf(n) {
  if (!n || !n.tagName) return n && n.nodeType === 9 ? 'document' : 'window';
  const attr = (k) => (typeof n.getAttribute === 'function' ? n.getAttribute(k) : null);
  let s = String(n.tagName).toLowerCase();
  const id = attr('id'); if (id) s += '#' + id;
  const cls = String(attr('class') || '').trim().split(/\s+/)[0]; if (cls) s += '.' + cls;
  for (const k of HOOKS) { const v = attr(k); if (v !== null && v !== undefined) s += `[${k}=${v}]`; }
  if (isField(n)) s += ' (a field)';
  return s;
}

/** eventEntry(event) → { kind, target, key? } — a key is kept only outside a field (there it is a command) */
export function eventEntry(e) {
  const out = { kind: e.type, target: targetOf(e.target) };
  if (e.type === 'keydown' && !isField(e.target)) {
    out.key = ['ctrlKey', 'metaKey', 'altKey', 'shiftKey'].filter((m) => e[m]).map((m) => m.replace('Key', '')).concat(e.code || '').filter(Boolean).join('+');
  }
  if (e.type === 'pointerdown' && e.pointerType) out.pointer = e.pointerType;
  return out;
}

/** scrub(text, typed[]) — cut out every typed string (4+ characters) that occurs in the text */
export function scrub(text, typed = []) {
  let s = String(text);
  for (const v of typed) if (typeof v === 'string' && v.trim().length >= 4) s = s.split(v).join('‹typed text›');
  return s;
}

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? +v.toFixed(4) : v);
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

/** describeText(state) — state: { app, windows, params, keys, pages } with values already read */
export function describeText({ app = {}, windows = [], params = [], keys = [], pages = [], clock = null, pageText = true } = {}) {
  const out = [`# ${app.name || 'An MIR app'}${app.version ? ' ' + app.version : ''} · MIR ${MIR_VERSION}`];
  if (app.what) out.push('', app.what);
  out.push('', 'Built on MIR, Magic Commons\' interface kit. The kit draws every control; an app passes data and options.');
  if (clock) {
    const bits = [];
    if (clock.playing !== undefined) bits.push(clock.playing ? 'playing' : 'paused');
    if (Number.isFinite(clock.tempo)) bits.push(`${num(clock.tempo)} BPM`);
    if (clock.power !== undefined) bits.push(`modulation ${clock.power ? 'on' : 'off (bypassed)'}`);
    if (bits.length) out.push('', `**Clock:** ${bits.join(' · ')}. One play (Space, the transport's ▶) runs the app's clock; modulation's power only bypasses its routes.`);
  }
  if (windows.length) {
    out.push('', '## Windows', '', '| id | title | state |', '|---|---|---|');
    for (const w of windows) out.push(`| ${cell(w.id)} | ${cell(w.title)} | ${w.open ? 'open' : 'closed'}${w.built ? '' : ', never built'}${w.side ? ', ' + w.side + ' rack' : ''}${w.floating ? ', floating' : ''}${w.folded ? ', folded' : ''} |`);
  }
  if (params.length) {
    out.push('', '## Parameters', '', 'Each is a control and a modulation target.', '', '| id | label | range | value |', '|---|---|---|---|');
    for (const p of params) {
      const unit = p.unit ? ' ' + p.unit : '';
      const v = p.driven ? `${num(p.value)}${unit} (driven by modulation; base ${num(p.base)})` : `${num(p.value)}${unit}`;
      out.push(`| ${cell(p.id)} | ${cell(english(p.label))} | ${num(p.min)} – ${num(p.max)}${unit} | ${cell(v)} |`);
    }
  }
  if (keys.length) {
    out.push('', '## Keys', '', '| action | label | keys |', '|---|---|---|');
    for (const k of keys) out.push(`| ${cell(k.id)} | ${cell(english(k.label))} | ${cell(k.display.join(', ') || '—')} |`);
  }
  const shared = pages.filter((p) => p && p.shared === true);
  if (shared.length) {
    out.push('', '## Shared pages');
    for (const p of shared) {
      const md = String(p.md || '').trim(), n = md ? md.split('\n').length : 0;
      if (pageText) out.push('', `### ${p.title || 'Untitled'}`, '', md);
      else out.push('', `- ${p.title || 'Untitled'} (${n} line${n === 1 ? '' : 's'})`);   // describe({ pages: false }): the titles only
    }
  }
  return out.join('\n') + '\n';
}

/** dumpText(state) — state: { app, made, browser, look, prefs, layout, cost, errors, events, describe } */
export function dumpText(s = {}) {
  const json = (v) => JSON.stringify(v === undefined ? null : v);
  const out = ['```mir-dump', `app: ${(s.app && s.app.name) || '?'}${s.app && s.app.version ? ' ' + s.app.version : ''} · MIR ${MIR_VERSION} · ${s.made || ''}`];
  if (s.browser) out.push(`browser: ${s.browser}`);
  out.push(`look: ${json(s.look || {})}`, `prefs: ${json(s.prefs || null)}`, `layout: ${json(s.layout || null)}`, `cost: ${json(s.cost || {})}`);
  for (const line of s.lines || []) out.push(line);
  out.push(`errors (${(s.errors || []).length}):`); for (const e of s.errors || []) out.push(`  +${e.at}ms ${e.message}${e.where ? ' @ ' + e.where : ''}`);
  out.push(`events (${(s.events || []).length}, kinds and targets only):`);
  for (const e of s.events || []) out.push(`  +${e.at}ms ${e.kind} ${e.target}${e.key ? ' ' + e.key : ''}${e.pointer ? ' ' + e.pointer : ''}`);
  out.push('```', '', s.describe || '');
  return out.join('\n');
}

/** the rack's windows in registration order: rack.windows() (1.5.0-alpha.5); an older rack is read from its WINDOW
 *  menu rows and capture() */
function windowsOf(rack) {
  if (!rack) return [];
  if (typeof rack.windows === 'function') return rack.windows();
  const ids = rack.registered || [], rows = (rack.windowMenu ? rack.windowMenu() : []).filter(Boolean);
  const cards = new Map(((rack.capture && rack.capture().cards) || []).map((c) => [c.id, c]));
  return ids.map((id, i) => {
    const c = cards.get(id) || {}, row = rows[i];
    const title = row ? String(row[0]).replace(/^(↑|⊕)\s+/, '').split('\t')[0] : id.toUpperCase();
    return { id, title, open: rack.isOpen(id), built: rack.isBuilt ? rack.isBuilt(id) : true, side: c.side, floating: !!c.float, folded: !!c.folded };
  });
}

/** the one clock and modulation's power: { playing, tempo, power } from the transport bar and the modulation seam */
function clockOf(transport, mod) {
  if (!transport && !mod) return null;
  const has = (k) => !!mod && typeof mod[k] === 'function';
  const pressed = transport && transport.el && transport.el.play ? transport.el.play.getAttribute('aria-pressed') : null;
  return { playing: pressed !== null ? pressed === 'true' : has('playing') ? mod.playing() : undefined,
    tempo: transport ? transport.bpm : has('bpm') ? mod.bpm() : undefined, power: has('power') ? mod.power() : undefined };
}

export function createDescribe({ app = {}, rack = null, params = [], pages = null, keys = null, prefs = null, mod = null, transport = null,
  doc = globalThis.document || null, mount = true, max = 20 } = {}) {
  const t0 = globalThis.performance ? performance.now() : Date.now();
  const at = () => Math.round((globalThis.performance ? performance.now() : Date.now()) - t0);
  const events = [], errors = [], life = new AbortController(), offs = [];
  const keep = (list, item) => { list.push({ at: at(), ...item }); if (list.length > max) list.shift(); };

  function state() {
    return {
      app,
      windows: windowsOf(rack),
      clock: clockOf(transport, mod),
      params: (typeof params === 'function' ? params() : params).map((p) => {
        const driven = !!(mod && mod.isModulated(p.id));
        return { id: p.id, label: english(p.label), unit: p.unit || '', min: p.min, max: p.max, value: driven ? mod.currentOf(p.id) : p.get(), driven, base: driven ? mod.baseOf(p.id) : undefined };
      }),
      keys: keys ? keys.describe().actions : [],
      pages: pages ? pages.list().filter((p) => p.shared === true) : [],
    };
  }
  const describe = (o) => describeText({ ...state(), pageText: !(o && o.pages === false) });   // describe({ pages: false }): each shared page as its title and line count

  function look() {
    if (!doc || !doc.documentElement) return {};
    const h = doc.documentElement, b = doc.body, view = doc.defaultView;
    return { skin: h.dataset.skin || 'frost', theme: b && b.dataset.theme, card: b && b.dataset.card, frost: !!(b && b.classList.contains('frost')),
      lang: h.lang, dir: h.dir || 'ltr', motion: h.dataset.motion || 'auto', viewport: view ? `${view.innerWidth}×${view.innerHeight}@${view.devicePixelRatio}` : undefined };
  }
  /** every text a field holds now: the last guard of law 2 */
  function typed() {
    if (!doc || !doc.querySelectorAll) return [];
    return [...doc.querySelectorAll('input, textarea, [contenteditable="true"], [contenteditable=""]')].map((n) => (n.isContentEditable ? n.textContent : n.value));
  }
  function dump() {
    const text = dumpText({ app, made: new Date().toISOString(), browser: globalThis.navigator ? navigator.userAgent : 'node',
      look: look(), prefs: prefs ? prefs.all() : null, layout: rack && rack.capture ? rack.capture() : null, cost: perf.snapshot(),
      lines: dumpLines(), errors, events, describe: describe() });
    return scrub(text, typed());
  }

  /* ── the hidden element, for agents that only read the DOM ── */
  let node = null;
  const write = () => { if (node) node.firstChild.textContent = describe(); };
  const refresh = () => { if (node) frame.coalesce(JOB, write); };
  if (doc && mount && doc.body) {
    node = doc.getElementById(DESCRIBE_ID) || doc.createElement('section');
    node.id = DESCRIBE_ID; node.hidden = true; node.dataset.mirDescribe = '';
    node.setAttribute('aria-label', 'What this app is, for a visiting model: windows, parameters, keys and shared pages');
    if (!node.firstChild) node.appendChild(doc.createElement('pre'));
    if (!node.isConnected) doc.body.appendChild(node);
    write();
  }
  if (pages) offs.push(pages.subscribe(refresh));
  if (keys) offs.push(keys.onChange(refresh));

  /* ── the event and error rings ── */
  const observe = (e) => { keep(events, eventEntry(e)); if (e.type !== 'pointerdown' && e.type !== 'keydown') refresh(); };
  if (doc && doc.addEventListener) {
    for (const k of ['pointerdown', 'keydown', 'change', 'drop', 'pointerup', 'keyup']) {
      doc.addEventListener(k, (e) => { if (k === 'pointerup' || k === 'keyup') refresh(); else observe(e); }, { capture: true, passive: true, signal: life.signal });
    }
    const view = doc.defaultView;
    if (view && view.addEventListener) {
      view.addEventListener('error', (e) => keep(errors, { message: String(e.message || e.error || 'error').split('\n')[0].slice(0, 240), where: e.filename ? `${String(e.filename).replace(/^.*\//, '')}:${e.lineno}` : '' }), { signal: life.signal });
      view.addEventListener('unhandledrejection', (e) => keep(errors, { message: 'unhandled rejection: ' + String((e.reason && e.reason.message) || e.reason).split('\n')[0].slice(0, 240) }), { signal: life.signal });
    }
  }
  const M = globalThis.window ? (globalThis.__MIR = globalThis.__MIR || {}) : null;
  if (M) { M.describe = describe; M.dump = dump; if (prefs) M.prefs = prefs; }   // prefs: a checker can set the theme

  return {
    describe, dump, refresh, observe,
    events: () => events.slice(), errors: () => errors.slice(),
    destroy() {
      life.abort(); for (const off of offs) { try { off(); } catch (_) {} } frame.cancel(JOB);
      if (node) node.remove();
      if (M && M.describe === describe) { delete M.describe; delete M.dump; delete M.prefs; }
    },
  };
}
