/* panels/lanes.js — THE LANES PANEL: a list of lanes, each a colour, one principal amount, a blend and a mute (docs/PANEL-LANES.md).
 *
 * Josh: "Lambdawaves has a palette system while Basins has an 'add a color' system. Nebula has an 'AGE' system, and Automata has its own
 * complex coloring."  Those systems stay each app's.  What they are BUILT from is the same list, and this is it: BASINS' colour lanes (the
 * flagship, the most complete: a pane per colour, a grip over an armed × on the OUTER edge, + ADD at the foot, the swatch and the FREQ pill
 * on row one, the PHASE and OPACITY arcs and the blend on row two), NEBULA's AGE strip (a hue arc, a blend, a vertical gain, a mute dot,
 * side by side), SOLEIL's lanes (the same, and its SOLO: a latching solo restores exactly, a hold is a peek) and EARTH's layer rows (a
 * swatch, M, S, one amount).  What a lane MEANS (BASINS' fold order, NEBULA's strata, EARTH's units) is the app's.
 *
 *   createLanesPanel({ rack, lanes: port, layout: 'rows' | 'strips', … }) → api        a rack card (or `parent: node`: the same rows anywhere)
 *   createLanesView(parent, options) → api                                              the rows, built now
 *
 * THE PORT (the app's; nothing here reads it on a timer: the app says when it changed)
 *   list()                 → [lane]         the lanes in order; a lane is a record of data:
 *     { id, label?, ink?, colour?: 'swatch' | 'hue' | 'chip', hue?: { min, max, home, wrap, fmt, law }, fill?,
 *       principal: { key, label, min, max, home, log, fmt, unit, hint },          the lane's ONE amount: a lane slider in its ink
 *       extras?: [{ key, label, min, max, home, wrap, log, fmt, unit, hint }],     arcs in its ink (BASINS' PHASE and OPACITY)
 *       blend?: [{ id, label }] | ['ADD', …],                                      the blend stepper (key 'blend')
 *       mute?: true, solo?: true, active?: false }
 *       colour 'swatch' edits key 'colour' ([r, g, b] 0..1); 'hue' edits key 'hue' (an arc); 'chip' only shows `fill` (a CSS colour or
 *       gradient) or the ink (EARTH's layer swatch).  The ink is `ink` (a CSS colour or () → colour) if the app gives one, else the
 *       swatch's or the hue's own colour, else the accent; a muted lane's ink is the faint ink.  The mute key is `mute` (true = silenced).
 *   add()                  → the new lane's id, or its record, or nothing        move(id, to) → false refuses      remove(id) → false refuses
 *   get(id, key), set(id, key, value)                                            subscribe(fn) → off   (fn() when anything changed)
 *   cap?, min?             the list's size (8 and 1 by default; options override)
 *   snapshot?() / restore?(s)   the project part and history rows; absent, the panel's own (the lanes by position, every key above)
 *
 * WHAT THE KIT KEEPS (and the app does not write again)
 *   · the list is controls/list.js `sortableList` (rows down, strips across with `axis: 'x'`): a dot grip, arrows, armed ×, + ADD that dims at the cap;
 *   · every continuous control — the principal, every extra, the hue arc — is a MODULATION TARGET `lanes.<lane>.<key>` (`mod`, installModulation's result):
 *     added with the lane, removed with it, kept across a rebuild (a hot re-registration keeps the routes);
 *   · SOLO is SOLEIL's law: a click latches (everything else is muted; again, or another lane's, moves or lifts it and what it silenced comes back as it
 *     was); a hold of 250 ms is a PEEK (the lane alone while the finger is down, exactly what was on when it lifts, never a state);
 *   · TOUCH PROTECTION (Josh, 09-12: "I keep accidentally touching the colors while zooming on touchscreen … I also too keep deleting the colors on
 *     accident"): the × is always armed (two taps); on a coarse pointer a lane's extras and blend sit behind its fold (`fold: 'auto'`); a press that began on
 *     the picture never reaches a lane (the scene guard, shell/scene-guard.js, keeps it: nothing here listens to the picture);
 *   · project part `lanes` (named for the card's `id`; `project: false` when the app's own part carries the lanes: BASINS' palette does), one history domain of the same name (a gesture is one row, named for the control it
 *     began on, by history/gestures.js), the card docks, floats, folds and powers like every rack card;
 *   · no poller: the port notifies, the panel repaints on the frame while the card is present and once when it becomes so.
 *
 * Pure parts exported for tests: laneTargetId, hueCss, createSolo, laneKeys, snapshotLanes, restoreLanes. */
import { el, label, ariaLabel, hint, trig, sw, stepper, arcKnob, hueSwatch, laneSlider, laneInk, rgbCss, sortableList } from '../kit.js';
import { glyphEl } from '../glyph.js';
import { frame } from '../core/frame.js';
import { setVar, setAttr } from '../core/perf.js';
import { registerProjectPart } from '../core/project.js';
import { handWrite } from '../modulation/registry.js';
import { ARM_MS } from '../controls/list.js';

export const HOLD_MS = 250;                       // a hold this long is a peek, not a click (SOLEIL atlas.js HOLD_MS)
let uid = 0;

/* ── the pure part ───────────────────────────────────────────────────────────────────────────────────────── */
/** one registry segment: lowercase alphanumeric, starting with a letter */
const seg = (s) => { const t = String(s).toLowerCase().replace(/[^a-z0-9]/g, ''); return /^[a-z]/.test(t) ? t : 'l' + t; };
/** laneTargetId(root, laneId, key) → 'lanes.c1.freq' — the modulation id of one lane's control (a registry segment is lowercase alphanumeric) */
export const laneTargetId = (root, laneId, key) => root + '.' + seg(laneId) + '.' + seg(key);
/** hueCss(v, min, max) → the CSS colour of a hue arc's value (BASINS' arc ink: hsl at 85% 62%) */
export function hueCss(v, min = 0, max = 1) {
  const span = max - min, u = span ? (v - min) / span : 0;
  return 'hsl(' + +(((u % 1 + 1) % 1) * 360).toFixed(2) + ' 85% 62%)';
}
/** the keys a lane carries (the snapshot's keys): colour or hue, the principal, the extras, blend, mute */
export function laneKeys(rec) {
  const keys = [];
  if (rec.colour === 'swatch') keys.push('colour'); else if (rec.colour === 'hue') keys.push('hue');
  if (rec.principal) keys.push(rec.principal.key);
  for (const x of rec.extras || []) keys.push(x.key);
  if (rec.blend) keys.push('blend');
  if (rec.mute) keys.push('mute');
  return keys;
}
const copy = (v) => (Array.isArray(v) ? v.slice() : v);
/** snapshotLanes(port) → { lanes: [{ id, values: { key: value } }] } — the default project part and history row */
export function snapshotLanes(port) {
  if (typeof port.snapshot === 'function') return port.snapshot();
  return { lanes: port.list().map((rec) => ({ id: rec.id, values: Object.fromEntries(laneKeys(rec).map((k) => [k, copy(port.get(rec.id, k))])) })) };
}
/** restoreLanes(port, snap) — the lanes by POSITION: the surplus goes, the missing are added, the order follows the snapshot, then every value */
export function restoreLanes(port, snap) {
  if (typeof port.restore === 'function') return port.restore(snap);
  const want = (snap && snap.lanes) || [];
  let have = port.list();
  const ids = new Set(want.map((l) => l.id));
  for (const r of have.slice().reverse()) if (have.length > want.length && !ids.has(r.id)) { port.remove(r.id); have = port.list(); }
  while (have.length > want.length) { const n = have.length; port.remove(have[n - 1].id); have = port.list(); if (have.length === n) break; }
  while (have.length < want.length) { const n = have.length; port.add(); have = port.list(); if (have.length === n) break; }
  for (let i = 0; i < want.length && i < have.length; i++) {
    if (have[i].id !== want[i].id && have.some((h) => h.id === want[i].id)) { port.move(want[i].id, i); have = port.list(); }
  }
  have.forEach((r, i) => { const s = want[i]; if (s) for (const [k, v] of Object.entries(s.values || {})) port.set(r.id, k, copy(v)); });
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** createSolo({ ids, get, set }) — SOLEIL's solo (main.js toggleSolo / audition) over any lanes.
 *  ids() → the lanes in play; get(id) → muted; set(id, muted).  toggle(id) latches: everything else is muted, the lane is on, and what was on is remembered once; again
 *  on the same lane, or the same call lifting it, gives every lane back as it was; another lane moves the latch and keeps the first memory.  peek(id, on) is the hold:
 *  the lane alone while the finger is down, exactly what was there when it lifts, and it is never a state (a latch under it is left as it was). */
export function createSolo({ ids, get, set }) {
  let latched = null, before = null, peeking = null;
  const snap = () => new Map(ids().map((id) => [id, !!get(id)]));
  const apply = (id) => { for (const x of ids()) set(x, x !== id); };
  const give = (m) => { for (const x of ids()) if (m.has(x)) set(x, m.get(x)); };
  return {
    toggle(id) {
      if (latched === id) { if (before) give(before); latched = null; before = null; return false; }
      if (!before) before = snap();
      latched = id; apply(id); return true;
    },
    peek(id, on) {
      if (on) { if (peeking) return false; peeking = snap(); apply(id); return true; }
      if (!peeking) return false;
      const was = peeking; peeking = null; give(was); return true;
    },
    latched: () => latched, peeking: () => peeking !== null,
    /** drop a latch that no longer names a lane (it was removed): nothing is restored */
    forget() { if (latched !== null && !ids().includes(latched)) { latched = null; before = null; } },
    clear() { latched = null; before = null; peeking = null; },
  };
}

/* ── the view ────────────────────────────────────────────────────────────────────────────────────────────── */
const num = (v) => (Number.isFinite(+v) ? +v : 0);

export function createLanesView(parent, o = {}) {
  const port = o.lanes;
  if (!port || typeof port.list !== 'function' || typeof port.get !== 'function' || typeof port.set !== 'function') throw new TypeError('panels/lanes: the port needs list(), get() and set()');
  const layout = o.layout === 'strips' ? 'strips' : 'rows';
  const noun = o.noun || 'lane', rootId = o.idRoot || 'lanes', mod = o.mod || null;
  const life = new AbortController(), key = 'lanes:' + (++uid);
  const root = el('div', 'mir-lanes', parent);
  root.dataset.layout = layout;
  const mq = typeof matchMedia === 'function' ? matchMedia('(pointer: coarse)') : null;
  const foldOn = () => o.fold === true || (o.fold !== false && !!(mq && mq.matches));
  const paintFold = () => { root.dataset.fold = foldOn() ? 'on' : 'off'; };
  paintFold();
  if (mq && mq.addEventListener) mq.addEventListener('change', paintFold, { signal: life.signal });

  const tid = (id, k) => (o.targetId ? o.targetId(id, k) : laneTargetId(rootId, id, k));
  const cache = new Map();                      // lane id → { root, targets, paint(rec), destroy() }: built once, moved between panes
  const opened = new Set();                     // lane ids whose fold is open
  let busy = 0, dirty = false, present = true, offSub = null;
  const recs = () => port.list();
  const ids = () => recs().map((r) => r.id);
  const play = () => recs().filter((r) => r.active !== false).map((r) => r.id);
  const isMuted = (id) => !!port.get(id, 'mute');
  const solo = createSolo({ ids: play, get: isMuted, set: (id, m) => { if (!!port.get(id, 'mute') !== m) port.set(id, 'mute', m); } });
  const nameOf = (rec, i) => rec.label || (noun + ' ' + (i + 1));

  /** a hand on a routed control writes the registry's base (mod.hand); on an unrouted one, the app */
  function write(id, k, v) { if (!handWrite(mod, tid(id, k), v)) port.set(id, k, v); }
  const routed = (id, k) => !!(mod && mod.isModulated && (() => { try { return mod.isModulated(tid(id, k)); } catch (_) { return false; } })());
  const liveOf = (id, k) => () => (routed(id, k) && mod.currentOf ? mod.currentOf(tid(id, k)) : null);
  /** the commit of a gesture: the port may persist (BASINS' persistPalette) */
  const commit = (id, k) => { if (typeof port.commit === 'function') port.commit(id, k); };

  /* ── one lane's controls ── */
  function makeLane(rec, index) {
    const id = rec.id, name = () => { const i = ids().indexOf(id); return nameOf(recs()[i] || rec, i < 0 ? index : i); };
    const strips = layout === 'strips';
    const body = el('div', 'mir-lane mir-lane-body'); body.dataset.id = String(id);
    const lc = { root: body, targets: [], ctl: {}, rec };
    const wantHead = !!(rec.label || rec.mute || rec.solo);
    const head = el('div', 'mir-lane-head', body);
    const nameEl = el('span', 'mir-lane-name', head);
    const state = el('div', 'mir-lane-state', head);
    const grid = el('div', 'mir-lane-grid', body);
    if (!wantHead) head.dataset.quiet = '';                                     // rows: a head with nothing to say shows only while the fold does (coarse pointer)
    const aria = (what) => what + ' · ' + name();

    /* the colour: BASINS' swatch, NEBULA's hue arc, EARTH's display chip */
    if (rec.colour === 'swatch') {
      lc.ctl.colour = hueSwatch({ rgb: port.get(id, 'colour') || [0.5, 0.5, 0.5], label: aria(rec.colourLabel || 'colour'),
        onInput: (rgb) => { port.set(id, 'colour', rgb); paintInk(); }, onChange: () => commit(id, 'colour') });
      lc.ctl.colour.root.classList.add('mir-lane-colour'); grid.appendChild(lc.ctl.colour.root);
    } else if (rec.colour === 'hue') {
      const h = rec.hue || {}, lo = Number.isFinite(h.min) ? h.min : 0, hi = Number.isFinite(h.max) ? h.max : 1;
      const k = 'hue', a = arcKnob({ label: 'HUE', aria: aria('HUE'), size: 'sm', min: lo, max: hi, wrap: h.wrap !== false, law: h.law || 'vertical', value: num(port.get(id, k)), home: Number.isFinite(h.home) ? h.home : lo,
        fmt: h.fmt, title: h.hint, ink: (v) => hueCss(v, lo, hi), live: liveOf(id, k), onInput: (v) => write(id, k, v), onChange: () => commit(id, k) });
      a.root.classList.add('mir-lane-colour'); lc.ctl.colour = a; grid.appendChild(a.root);
      lc.targets.push({ key: k, d: { key: k, label: 'HUE', min: lo, max: hi, wrap: h.wrap !== false, home: Number.isFinite(h.home) ? h.home : lo, unit: h.unit, hint: h.hint }, w: a });
    } else if (rec.colour === 'chip') {
      lc.ctl.colour = { root: el('span', 'mir-lane-colour mir-lane-chip', grid) }; lc.ctl.colour.root.setAttribute('aria-hidden', 'true');
    }

    /* the principal amount: a lane slider in the lane's ink, vertical on a strip */
    if (rec.principal) {
      const d = rec.principal, k = d.key;
      const s = laneSlider({ label: d.label || 'AMOUNT', aria: aria(d.label || 'AMOUNT'), title: d.hint, min: d.min, max: d.max, log: !!d.log, fmt: d.fmt, unit: d.unit, orient: strips ? 'v' : 'h',
        value: num(port.get(id, k)), home: Number.isFinite(d.home) ? d.home : num(port.get(id, k)), onInput: (v) => write(id, k, v), onChange: () => commit(id, k) });
      s.root.classList.add('mir-lane-principal'); lc.ctl.principal = s; grid.appendChild(s.root);
      lc.targets.push({ key: k, d, w: s });
    }

    /* the extras: arcs in the lane's ink (BASINS' PHASE and OPACITY) */
    const more = (rec.extras && rec.extras.length) ? el('div', 'mir-lane-extras', grid) : null;
    lc.ctl.extras = {};
    for (const d of rec.extras || []) {
      const k = d.key;
      const a = arcKnob({ label: d.label, aria: aria(d.label), size: 'sm', min: d.min, max: d.max, wrap: !!d.wrap, log: !!d.log, law: d.law || 'vertical', fmt: d.fmt, title: d.hint,
        value: num(port.get(id, k)), home: Number.isFinite(d.home) ? d.home : num(port.get(id, k)), ink: d.ink, live: liveOf(id, k), onInput: (v) => write(id, k, v), onChange: () => commit(id, k) });
      more.appendChild(a.root); lc.ctl.extras[k] = a;
      lc.targets.push({ key: k, d, w: a });
    }

    /* the blend: a stepper (five or more modes in order); a tap on the name opens the list */
    if (rec.blend) {
      const items = rec.blend.map((m) => (typeof m === 'string' ? { id: m, label: m } : m));
      const b = stepper({ aria: aria('BLEND'), items, value: port.get(id, 'blend'), cls: 'mir-lane-blend', compact: layout === 'strips', onChange: (v) => { port.set(id, 'blend', v); commit(id, 'blend'); } });
      grid.appendChild(b.root); lc.ctl.blend = b;
    }

    /* the lane's state: the mute dot (it is the lamp, in the lane's ink), the solo, the fold */
    if (rec.mute) {
      const m = sw({ label: 'ON', cls: 'mir-lane-mute', value: !isMuted(id), title: 'in or out: the dot is lit while this is on',
        onChange: (on) => { port.set(id, 'mute', !on); commit(id, 'mute'); } });
      ariaLabel(m.root, 'On · {lane}', { lane: name() });
      state.appendChild(m.root); lc.ctl.mute = m;
    }
    if (rec.solo) {
      const b = trig({ label: 'S', cls: 'mir-lane-solo', title: 'SOLO: this one alone; again, the others come back. Hold to peek', onFire: () => { if (held) { held = false; return; } doSolo(id); } });
      ariaLabel(b.root, 'Solo · {lane}', { lane: name() });
      let timer = 0, held = false;
      const over = () => { clearTimeout(timer); timer = 0; if (held) { solo.peek(id, false); delete b.root.dataset.peek; changed(); } };
      b.root.addEventListener('pointerdown', (e) => { if (e.button) return; held = false; clearTimeout(timer);
        timer = setTimeout(() => { timer = 0; if (solo.peek(id, true)) { held = true; b.root.dataset.peek = ''; changed(); } }, HOLD_MS); }, { signal: life.signal });
      for (const t of ['pointerup', 'pointercancel']) b.root.addEventListener(t, over, { signal: life.signal });
      b.root.addEventListener('pointerleave', () => { if (timer) { clearTimeout(timer); timer = 0; } }, { signal: life.signal });
      b.root.addEventListener('contextmenu', (e) => e.preventDefault(), { signal: life.signal });
      state.appendChild(b.root); lc.ctl.solo = b; lc.soloTimer = () => clearTimeout(timer);
    }
    if (more || rec.blend) {
      const f = el('button', 'mir-lane-fold', state); f.type = 'button';
      const g = glyphEl('chevronDown', 'gly gly-chevronDown', 16); if (g) f.appendChild(g);
      ariaLabel(f, 'Show the controls of {lane}', { lane: name() }); hint(f, 'Show or hide this lane’s arcs and blend (so a thumb zooming the picture cannot turn them)');
      f.setAttribute('aria-expanded', String(opened.has(id)));
      f.addEventListener('click', () => { if (opened.has(id)) opened.delete(id); else opened.add(id); body.toggleAttribute('data-open', opened.has(id)); f.setAttribute('aria-expanded', String(opened.has(id))); }, { signal: life.signal });
      lc.ctl.fold = f;
    }
    body.toggleAttribute('data-open', opened.has(id));

    /* the lane's colour is its ink (--lane-ink); a muted lane wears the faint ink */
    function inkNow(r) {
      if (r.ink) return typeof r.ink === 'function' ? r.ink() : r.ink;
      if (r.colour === 'swatch') return rgbCss(port.get(id, 'colour') || [0.5, 0.5, 0.5]);
      if (r.colour === 'hue') { const h = r.hue || {}; return hueCss(num(port.get(id, 'hue')), Number.isFinite(h.min) ? h.min : 0, Number.isFinite(h.max) ? h.max : 1); }
      return null;
    }
    function paintInk() {
      const r = recs().find((x) => x.id === id) || rec, muted = !!(r.mute && isMuted(id));
      laneInk(body, muted ? null : inkNow(r));
      body.toggleAttribute('data-muted', muted);
      if (lc.ctl.colour && r.colour === 'chip') setVar(lc.ctl.colour.root, '--lane-fill', r.fill || (muted ? null : inkNow(r)));
    }
    lc.paintInk = paintInk;

    /** every widget from the port, except one under a hand or one a route drives (the registry paints that) */
    lc.paint = function paint(r, i) {
      lc.rec = r;
      setAttr(nameEl, 'data-n', String(i + 1));
      if (r.label) label(nameEl, r.label); else label(nameEl, noun + ' ' + (i + 1));
      body.toggleAttribute('data-inactive', r.active === false);
      const pull = (w, k) => { if (!w || (w.dragging && w.dragging()) || routed(id, k)) return; const v = port.get(id, k); if (Array.isArray(v) ? !same(w.get(), v) : (num(v) !== w.get() && Number.isFinite(+v))) w.set(v); };
      if (lc.ctl.colour && r.colour === 'swatch') { const c = port.get(id, 'colour'); if (c && !lc.ctl.colour.dragging() && !same(lc.ctl.colour.get(), c)) lc.ctl.colour.set(c); }
      if (lc.ctl.colour && r.colour === 'hue') pull(lc.ctl.colour, 'hue');
      if (lc.ctl.principal) pull(lc.ctl.principal, r.principal.key);
      for (const [k, w] of Object.entries(lc.ctl.extras)) pull(w, k);
      if (lc.ctl.blend && lc.ctl.blend.get() !== port.get(id, 'blend')) lc.ctl.blend.set(port.get(id, 'blend'));
      if (lc.ctl.mute) { const on = !isMuted(id); if (lc.ctl.mute.get() !== on) lc.ctl.mute.set(on); }
      if (lc.ctl.solo) { lc.ctl.solo.on = solo.latched() === id; }
      paintInk();
    };

    /* the modulation targets: one per continuous control, under lanes.<lane>.<key>; replaced (routes kept) when the numbering moves */
    lc.retarget = function retarget() {
      if (!mod || typeof mod.add !== 'function') return;
      const i = ids().indexOf(id), nm = nameOf(recs()[i] || rec, i < 0 ? index : i);
      const list = lc.targets.map((t) => {
        const d = t.d, k = t.key, map = d.wrap ? 'wrap' : d.log ? 'log' : 'linear';
        return { id: tid(id, k), label: (nm + ' · ' + (d.label || k)).toUpperCase(), min: d.min, max: d.max, step: 0, map, unit: d.unit, hint: d.hint, def: Number.isFinite(d.home) ? d.home : undefined,
          get: () => num(port.get(id, k)), set: (v) => port.set(id, k, v), widget: t.w };
      });
      if (!list.length) return;
      try { mod.add(list); lc.added = true; }                                    // one rebuild of the modulation window per lane (mod.add takes a list)
      catch (err) { if (!lc.warned) { lc.warned = true; console.warn('panels/lanes: modulation refused ' + list[0].id + ' — add "' + rootId + '" to installModulation({ roots })', err); } }
    };
    lc.destroy = function destroy() {
      if (lc.soloTimer) lc.soloTimer();
      if (mod && typeof mod.remove === 'function') for (const t of lc.targets) { try { mod.remove(tid(id, t.key)); } catch (_) { /* not added */ } }
      for (const w of [lc.ctl.colour, lc.ctl.principal, lc.ctl.blend, ...Object.values(lc.ctl.extras)]) { try { w && w.destroy && w.destroy(); } catch (_) { /* a widget's own */ } }
      body.remove();
    };
    return lc;
  }
  function laneOf(rec, i) {
    let lc = cache.get(rec.id);
    if (!lc) { lc = makeLane(rec, i); cache.set(rec.id, lc); lc.retarget(); lc.paint(rec, i); }
    return lc;
  }
  function prune() {
    const live = new Set(ids());
    for (const [id, lc] of cache) if (!live.has(id)) { lc.destroy(); cache.delete(id); opened.delete(id); }
    solo.forget();
  }

  /* ── the list ── */
  const nodeOf = (rec, i) => laneOf(rec, i).root;
  const fixed = !!o.fixed;
  const capOf = () => (fixed ? recs().length : Number.isFinite(port.cap) ? port.cap : Number.isFinite(o.cap) ? o.cap : 8);
  const minOf = () => (fixed ? recs().length : Number.isFinite(port.min) ? port.min : Number.isFinite(o.min) ? o.min : 1);
  const guard = (fn) => { busy++; try { return fn(); } finally { busy--; } };
  const after = () => queueMicrotask(() => { if (life.signal.aborted) return; prune(); orderCheck(); refresh(); });
  function addLane() {
    const before = ids();
    const r = guard(() => port.add());
    const list = recs();
    const rec = (r && typeof r === 'object' ? list.find((x) => x.id === r.id) || r : r !== undefined && r !== null ? list.find((x) => x.id === r) : null) || list.find((x) => !before.includes(x.id)) || null;
    after();
    return rec;
  }
  const moveLane = (id, to) => { const ok = guard(() => port.move(id, to)) !== false; if (ok) after(); return ok; };
  const removeLane = (id) => { const ok = guard(() => port.remove(id)) !== false; if (ok) after(); return ok; };

  /* rows stack down, strips sit across (sortableList's axis 'x': one island pane, a chip strip under each strip); `fixed` hides the chips and + ADD */
  if (fixed) root.dataset.fixed = '';
  const view = sortableList({ items: recs(), cap: capOf(), min: minOf(), noun, side: o.side || 'auto', addLabel: o.addLabel, armMs: o.armMs || ARM_MS, material: o.material,
    axis: layout === 'rows' ? 'y' : 'x',
    build: (it, i) => ({ el: nodeOf(it, i), destroy() { /* the lane lives in the panel's cache: a rebuild only moves it */ } }),
    onAdd: addLane, onMove: moveLane, onRemove: removeLane });
  root.appendChild(view.root);

  /* ── keeping the view and the port as one ── */
  let lastOrder = ids().join('|');
  function orderCheck() {
    const now = ids().join('|');
    if (now !== lastOrder) { lastOrder = now; for (const lc of cache.values()) lc.retarget(); }      // the numbering in the modulation window follows the order (routes kept)
  }
  function refresh() {
    if (life.signal.aborted) return;
    if (busy || !present) { dirty = true; return; }
    dirty = false;
    const list = recs();
    if (view.items().map((x) => x.id).join('|') !== list.map((x) => x.id).join('|') || (view.count() !== list.length)) { view.setItems(list); prune(); orderCheck(); }
    list.forEach((r, i) => laneOf(r, i).paint(r, i));
    root.dataset.count = String(list.length);
  }
  const request = () => { if (life.signal.aborted) return; if (!present || busy) { dirty = true; return; } frame.coalesce(key, refresh); };
  if (typeof port.subscribe === 'function') offSub = port.subscribe(request);
  refresh();
  /* the modulation targets exist from the first build: the retarget of each lane ran as it was made */

  const api = {
    root, view, layout,
    refresh, request,
    ids, lane: (id) => (cache.get(id) ? cache.get(id).ctl : null), laneRoot: (id) => (cache.get(id) ? cache.get(id).root : null),
    /** the lane's modulation parameter records (installModulation({ params })) when `mod` was not handed over */
    params: () => [...cache.values()].flatMap((lc) => lc.targets.map((t) => ({ id: tid(lc.rec.id, t.key), label: (t.d.label || t.key), min: t.d.min, max: t.d.max, step: 0, map: t.d.wrap ? 'wrap' : t.d.log ? 'log' : 'linear',
      def: t.d.home, get: () => num(port.get(lc.rec.id, t.key)), set: (v) => port.set(lc.rec.id, t.key, v), widget: t.w }))),
    targetId: tid,
    /** SOLEIL's solo: toggle(id) latches (true) or lifts (false); peek(id, on) is the hold; soloOf() the latched lane */
    solo: (id) => { const r = solo.toggle(id); changed(); return r; },
    peek: (id, on) => { const r = solo.peek(id, on); changed(); return r; },
    soloOf: () => solo.latched(), peeking: () => solo.peeking(), resetSolo: () => solo.clear(),
    /** the card's presence: false stops repainting; true repaints once if anything came while it was away */
    present(on) { present = !!on; if (present && dirty) refresh(); },
    destroy() {
      life.abort(); frame.cancel(key);
      if (offSub) { try { offSub(); } catch (_) { /* the port's */ } offSub = null; }
      for (const lc of cache.values()) lc.destroy();
      cache.clear(); view.destroy(); root.remove();
    },
  };
  function doSolo(id) { api.solo(id); }
  function changed() { dirty = false; for (const [id, lc] of cache) { const r = recs().find((x) => x.id === id); if (r) lc.paint(r, ids().indexOf(id)); } }
  return api;
}

/* ── the card ────────────────────────────────────────────────────────────────────────────────────────────── */
/** createLanesPanel(options) → api — the lanes as a rack card (`rack`), or in `parent`; the project part and the history domain are made here, so they
 *  exist before the card is ever opened.  options: lanes (the port), layout, noun, cap, min, fixed, fold ('auto' | true | false), mod, idRoot, project (false: none),
 *  history, id, title, side, open, action (the key table's id for the card), glyph, hint, eager, parent, addLabel, side (the chips' side), material */
export function createLanesPanel(o = {}) {
  const port = o.lanes;
  if (!port) throw new TypeError('panels/lanes: createLanesPanel needs a port (`lanes`)');
  const id = o.id || 'lanes';
  let view = null;
  const api = {
    id, get view() { return view; }, get root() { return view ? view.root : null; },
    refresh: () => view && view.refresh(), ids: () => port.list().map((r) => r.id),
    solo: (x) => (view ? view.solo(x) : null), peek: (x, on) => (view ? view.peek(x, on) : null), soloOf: () => (view ? view.soloOf() : null),
    params: () => (view ? view.params() : []),
    snapshot: () => snapshotLanes(port),
    restore(snap) { restoreLanes(port, snap); if (view) { view.resetSolo(); view.request(); } },
    part: () => ({ capture: () => snapshotLanes(port), restore: (saved) => { if (saved) api.restore(saved); }, signature: () => JSON.stringify(snapshotLanes(port)), subscribe: (fn) => (typeof port.subscribe === 'function' ? port.subscribe(fn) : () => {}) }),
    destroy() { if (offPart) offPart(); if (offHist) offHist(); if (view) view.destroy(); view = null; },
  };
  let offPart = null, offHist = null;
  if (o.project !== false) { const reg = o.project && typeof o.project.register === 'function' ? o.project.register : registerProjectPart; offPart = reg(o.projectName || id, api.part()); }
  if (o.history) offHist = o.history.register(o.historyName || id, { read: () => snapshotLanes(port), write: (s) => { restoreLanes(port, s); if (view) { view.resetSolo(); view.request(); } } });
  const build = (body) => { view = createLanesView(body, o); };
  if (o.rack) {
    o.rack.register({ id, title: o.title || 'LANES', side: o.side || 'right', open: o.open, glyph: o.glyph || 'lanes', hint: o.hint || 'the lanes: a colour, an amount, a blend and a mute each', action: o.action, eager: o.eager,
      build, onPresent: (a) => { if (view) view.present(a); }, onPower: (live) => { if (view) view.present(live); } });
  } else if (o.parent) build(o.parent);
  return api;
}
