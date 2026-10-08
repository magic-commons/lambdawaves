/* panels/xy.js — THE XY CONTROLLER: one pad, three uses, as a rack card an app gets by naming its pairs.
 *
 * Built from the control language (docs/CONTROLS.md): the kit's XY PAD and its two knobs for the hand, a SEGMENT for the use (2–4 modes),
 * a STEPPER for the pair or the window (the brief's ruling), SWITCHES WITH A LAMP for SPRING and ENGAGE, TRIGGERS for the verbs.  The three
 * uses, chosen by the segment at the head:
 *   PAIR    the pad drives one of the app's coupled pairs (BASINS PAN X/Y, SOLEIL PAN and LENS, NEBULA Re c / Im c, POLAR YAW / PITCH):
 *           `pairs: [{ label, x, y }]`, x and y a modulation id (looked up in `mod.params()`) or a record { id, label, min, max, map, get, set }.
 *           The pad's knobs are the pair's own targets (data-param is the app's id): a macro dropped on them routes the app's parameter, and
 *           a routed pair moves the dot in accent B while the hand's base stays a ring.
 *   ROUTE   the pad is a controller in the VST sense: X and Y ARE TWO MACROS the panel owns (`<id>:x`, `<id>:y`, named "XY X" / "XY Y"),
 *           made the first time the hand uses them.  Their grips are the modulation window's own (`mod.view.api.wireGrip`: drag onto any
 *           knob, tap to arm, double-tap to reset), so there is no second routing: the routes, the depths and the presets are the
 *           window's.  The pad writes the macros' values.
 *   MORPH   AUTOMATA's MORPH (lab/main.js 685–711, morph.js): snapshots of a chosen window's parameters (their BASES) in a bank of
 *           eight; four of them on the corners A–D; ENGAGE and the pad blends them, each dial in its own map.  A corner: tap, then a
 *           snapshot's number, puts it there (AUTOMATA's); HOLD or SHIFT-CLICK stores the dials as they stand straight onto it.
 * The pad in every use: drag, the arrow keys, Home or a double-tap centres (the kit's one knob law); SPRING (a switch with a lamp)
 * returns it to centre on release; while a route moves it a TRAIL of its last positions is drawn (painted only when it moves).
 *
 * THE LAWS IT KEEPS
 *   1. ONE ROUTING.  ROUTE's sources are model macros (mod.js) and the window's own grip; nothing here routes, ranges or stores a route.
 *   2. EVERY CONTINUOUS CONTROL IS A TARGET.  ROUTE's X and Y are `<prefix>.x` / `<prefix>.y`, MORPH's `<prefix>.morphx` / `.morphy`
 *      (AUTOMATA's morph.x / morph.y): an LFO moves the dot, and through it the macros or the blend.  The install's `roots` must name
 *      the prefix (installModulation({ roots: ['xy'] })).  PAIR's knobs are the app's targets.
 *   3. THE HAND OWNS THE BASE.  A hand on a routed axis or dial writes the registry's base (mod.hand); an unrouted one writes the app.
 *   4. NO POLLER.  The app notifies (`subscribe`); a routed pair is repainted on the modulation's own tick only while the card is
 *      presented; a morph step runs on the one frame only after its position or its corners moved; the trail paints only when the dot does.
 *   5. PROJECT AND HISTORY.  The panel's state is a project part named `part` (default the card's id, 'xy') and, given `history`,
 *      one snapshot domain of the same name, so a gesture is one row named CONTROL · WINDOW (history/gestures.js).
 *
 *   createXYPanel({ rack | parent, mod, pairs, morph, subscribe, history, project, id, title, side, open, modPrefix, part, … }) → api
 *     api: { id, spec, root, mode(), setMode(m), modes(), pair(), setPair(i), sets(), set(), setSet(id), route() → { x, y },
 *            morph() → { set, engaged, x, y, bank }, store(corner | slot?), engage(on), capture(), restore(s), params(), sync(), destroy() }
 *   Pure, for tests: MODES, resolveRef, morphSets, readXY. */
import { el, label, hint, ariaLabel, sw, seg, trig } from '../kit.js';
import { xyPad } from '../controls/xy.js';
import { stepper } from '../controls/stepper.js';
import { glyphEl } from '../glyph.js';
import { frame } from '../core/frame.js';
import { setVar, setText } from '../core/perf.js';
import { t } from '../core/i18n.js';
import { registerProjectPart } from '../core/project.js';
import { handWrite } from '../modulation/registry.js';
import { createMorph, kindOf, snapshot, recallValues, loadBank, saveBank, CORNERS, BANK_MAX, NAME_MAX } from './morph.js';

export const MODES = Object.freeze(['pair', 'route', 'morph']);
export const TRAIL = 12;                                   // the trail's dots (the last positions while a route moves the pad)
export const HOLD_MS = 450;                                 // a corner held this long stores onto it (the window's own long press)
const WORD = { pair: 'PAIR', route: 'ROUTE', morph: 'MORPH' };
const TIP = {
  pair: 'PAIR — the pad drives one of the app\'s coupled pairs',
  route: 'ROUTE — X and Y are two macros: drag their grips onto any knob',
  morph: 'MORPH — four snapshots on the corners; the pad blends them',
};
const MORPH_LINE = 'STORE keeps the dials as they stand; tap a corner, then a snapshot\'s number, to put it there; hold a corner (or Shift-click it) to store straight onto it. ENGAGE and drag the pad: every dial blends in its own map (log dials geometrically; a stepped dial takes the nearest corner). X and Y are modulation targets. A hand on a dial wins until the pad next moves.';
let uid = 0;
const f3 = (v) => (+v).toFixed(3);
const finite = (v) => typeof v === 'number' && Number.isFinite(v);
const unit = (v) => (finite(v) ? Math.min(1, Math.max(0, v)) : 0.5);

/* ═══ the pure parts ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
/** resolveRef(ref, list) — a pair axis or a morph dial: an id looked up in the parameter list (mod.params()), or a record handed as it is
 *  ({ id, min, max, get, set, … }).  → the record, or null when the id is not (yet) a parameter */
export function resolveRef(ref, list) {
  if (ref && typeof ref === 'object') return typeof ref.get === 'function' && typeof ref.set === 'function' ? ref : null;
  if (typeof ref !== 'string' || !Array.isArray(list)) return null;
  return list.find((p) => p && p.id === ref) || null;
}
const dialable = (p) => p && finite(p.min) && finite(p.max) && p.max > p.min && typeof p.get === 'function' && typeof p.set === 'function';
/** morphSets(params, own) — the windows a MORPH can snapshot when the app names none: the parameter list grouped by its root
 *  (`camera.rotation` → CAMERA), without the panel's own ids and without anything that is not a finite range.  → [{ id, label, params }] */
export function morphSets(params, own) {
  const out = new Map();
  for (const p of params || []) {
    if (!dialable(p) || (own && String(p.id).startsWith(own + '.'))) continue;
    const root = String(p.group || p.id.split('.')[0]);
    if (!out.has(root)) out.set(root, { id: root, label: root.toUpperCase(), params: [] });
    out.get(root).params.push(p);
  }
  return [...out.values()];
}
/** readXY(raw) — the project part / history row, sanitised.  → { v, mode, pair, spring, set, route: [x, y], banks: { setId: bank } } */
export function readXY(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const banks = {};
  if (r.banks && typeof r.banks === 'object') for (const [k, b] of Object.entries(r.banks)) banks[k] = loadBank(b);
  const xy = Array.isArray(r.route) ? r.route : [];
  return { v: 1, mode: MODES.includes(r.mode) ? r.mode : null, pair: Number.isInteger(r.pair) && r.pair >= 0 ? r.pair : 0, spring: r.spring === true,
    set: typeof r.set === 'string' ? r.set : null, route: [unit(xy[0]), unit(xy[1])], banks };
}

/* ═══ the panel ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
export function createXYPanel(o = {}) {
  const id = o.id || 'xy', pre = o.modPrefix || id, part = o.part || id, title = o.title || 'XY';
  const mod = o.mod || null, M = mod && mod.M ? mod.M : null;
  const pairs = Array.isArray(o.pairs) ? o.pairs : [];
  const key = 'mir.xy.' + (++uid);
  const S = { mode: null, pair: 0, spring: false, set: null };
  const R = new Float64Array([0.5, 0.5, 0.5, 0.5]);           // ROUTE: the hand's x, y; the live x, y (the macros' values)
  const MX = new Float64Array([0.5, 0.5, 0.5, 0.5]);          // MORPH: the same for the morph pad (AUTOMATA's mxy)
  const banks = new Map();                                    // set id → bank (morph.js loadBank: slots, corners, engaged, x, y)
  const MAC = { x: pre + ':x', y: pre + ':y' };
  const AX = { route: [pre + '.x', pre + '.y'], morph: [pre + '.morphx', pre + '.morphy'] };
  const watchers = new Set(), offs = [], offMod = [];
  let V = null, say = () => {}, presented = true, engineCache = null, morphing = { armed: -1, hint: '' };

  /* ── what the app has ── */
  const plist = () => (mod && typeof mod.params === 'function' ? mod.params() : []);
  const sets = () => {
    const raw = Array.isArray(o.morph) ? o.morph : morphSets(plist(), pre);
    return raw.map((s) => {
      const src = typeof s.params === 'function' ? s.params() : s.params || [];
      return { id: String(s.id), label: s.label || String(s.id).toUpperCase(), params: src.map((r) => resolveRef(r, plist())).filter(dialable) };
    }).filter((s) => s.params.length);
  };
  const modes = () => MODES.filter((m) => (m === 'pair' ? pairs.length > 0 : m === 'route' ? !!M : sets().length > 0));
  const pairRecs = (i) => { const p = pairs[i]; if (!p) return null; const x = resolveRef(p.x, plist()), y = resolveRef(p.y, plist()); return x && y ? { label: p.label || 'PAIR', x, y } : null; };

  /* ── the hand law, and the app's roads ── */
  const has = (pid) => { try { return !!(mod && mod.registry && mod.registry.has(pid)); } catch (_) { return false; } };
  const routed = (pid) => { if (!mod || !has(pid)) return false; try { return !!mod.isModulated(pid); } catch (_) { return false; } };
  const hand = (pid, v) => has(pid) && handWrite(mod, pid, v);
  const baseOf = (rec) => (routed(rec.id) ? mod.baseOf(rec.id) : rec.get());
  const homeOf = (rec) => (finite(rec.def) ? rec.def : finite(rec.home) ? rec.home : rec.map === 'log' && rec.min > 0 ? Math.sqrt(rec.min * rec.max) : (rec.min + rec.max) / 2);
  /** a dial of the app: the base through the registry when routed (law 3), else the app's own number, and its widget shows it */
  function write(rec, v) {
    if (hand(rec.id, v)) return;
    rec.set(v);
    const w = rec.widget;
    if (w && typeof w.set === 'function' && !(typeof w.dragging === 'function' && w.dragging())) w.set(v);
  }
  /** after a hand moved a macro or a base: the routes are applied now, not at the next tick (the window's own `apply`) */
  function applyNow() {
    if (!mod) return;
    if (typeof mod.apply === 'function') mod.apply();
    else { if (mod.host && mod.host.clock) mod.host.clock.applyAll(false); if (mod.paintWidgets) mod.paintWidgets(); }
    if (mod.view && mod.view.isOpen && mod.view.paint) mod.view.paint(true);
  }
  const changed = () => { for (const f of watchers) { try { f(); } catch (e) { (globalThis.reportError || console.error)(e); } } };
  const addTarget = (rec) => { if (!mod || typeof mod.add !== 'function') return; try { offMod.push(mod.add(rec)); } catch (e) { console.warn('xy panel: ' + rec.id + ' is not a target (does installModulation({ roots }) name "' + pre + '"?)', e); } };

  /* ═══ ROUTE: two macros the panel owns ═══ */
  function ensureMacro(ax) {
    if (!M) return null;
    let m = M.macroOf(MAC[ax]);
    if (m) { if (typeof mod.own === 'function' && !mod.owned(m.id)) mod.own(m.id, id); return m; }   // a reload: the record kept the macro, the claim is made again
    m = M.addMacro(title + ' ' + ax.toUpperCase(), { id: MAC[ax], named: true, value: R[ax === 'x' ? 2 : 3] });
    if (!m) { say(t('the modulation rack is full: free a macro for {axis}', { axis: ax.toUpperCase() })); return null; }
    if (typeof mod.own === 'function') mod.own(m.id, id);                          // the seam (ASKS.md): free-macro finders pass it by
    if (mod.view && mod.view.rebuild) mod.view.rebuild();
    if (mod.persist) mod.persist();
    return m;
  }
  function driveMacro(ax, v) {
    if (!M) return;
    const m = M.macroOf(MAC[ax]);
    if (m && m.kind !== 'trigger' && !m.sourceId && m.value !== v) M.setMacro(m.id, { value: v });
  }
  /** a macro of this panel routed onto this panel's own axis would drive itself: such a route is taken away */
  function dropSelf() {
    if (!M) return 0;
    let n = 0;
    for (const tid of AX.route) for (const r of M.routesOfTarget(tid)) if (r.macroId === MAC.x || r.macroId === MAC.y) { M.removeRoute(r.id); n++; }
    if (n) { say(t('X and Y cannot drive themselves')); if (mod.view && mod.view.rebuild) mod.view.rebuild(); applyNow(); }
    return n;
  }
  function routeHand(x, y) {
    R[0] = x; R[1] = y;
    if (!hand(AX.route[0], x)) R[2] = x;
    if (!hand(AX.route[1], y)) R[3] = y;
    ensureMacro('x'); ensureMacro('y');
    driveMacro('x', R[2]); driveMacro('y', R[3]);
    applyNow();
  }

  /* ═══ MORPH: AUTOMATA's, over any window's parameters ═══ */
  function curSet() {
    const all = sets(); if (!all.length) return null;
    let s = all.find((x) => x.id === S.set); if (!s) { s = all[0]; S.set = s.id; }
    return s;
  }
  const bankOf = (sid) => { let b = banks.get(sid); if (!b) { b = loadBank(null); banks.set(sid, b); } return b; };
  /** the set's morph, rebuilt when its dials change (a window built later, a lane added) */
  function engine() {
    const s = curSet(); if (!s) return null;
    const sig = s.id + '|' + s.params.map((p) => p.id + ':' + p.min + ':' + p.max + ':' + (p.map || '')).join(',');
    if (!engineCache || engineCache.sig !== sig) {
      const dials = s.params.map((p) => ({ id: p.id, name: p.id, kind: kindOf(p), min: p.min, max: p.max }));
      const m = createMorph(dials);
      const b = bankOf(s.id);
      m.setCorners(b.corners.map((k) => (k === null ? null : b.slots[k])));
      m.sync(MX);
      engineCache = { sig, set: s, dials, recs: s.params, m, bank: b };
    }
    return engineCache;
  }
  /** the step: engaged and moved (or its corners), the morphed dials' BASES, each through its own door (AUTOMATA's morphTick) */
  function morphStep() {
    const E = engine(); if (!E || !E.bank.engaged || !E.m.step(MX)) return;
    const out = E.m.out, on = E.m.mask;
    for (let i = 0; i < E.recs.length; i++) if (on[i] && baseOf(E.recs[i]) !== out[i]) write(E.recs[i], out[i]);
    applyNow();
  }
  const kick = () => frame.coalesce(key + ':morph', morphStep);
  function morphHand(x, y) {
    MX[0] = x; MX[1] = y;
    if (!hand(AX.morph[0], x)) MX[2] = x;
    if (!hand(AX.morph[1], y)) MX[3] = y;
    kick();
  }
  function morphCorners() { const E = engine(); if (!E) return; E.m.setCorners(E.bank.corners.map((k) => (k === null ? null : E.bank.slots[k]))); kick(); paintMorph(); changed(); }
  function store(i) {
    const E = engine(); if (!E) return -1;
    const b = E.bank;
    if (i === undefined || i === null) i = b.slots.findIndex((s) => !s);
    if (i < 0 || i >= BANK_MAX) { morphing.hint = t('The bank holds {n}: STORE over one, or × one.', { n: BANK_MAX }); paintMorph(); return -1; }
    const base = {}; for (const r of E.recs) base[r.id] = baseOf(r);
    const was = b.slots[i];
    b.slots[i] = snapshot(E.dials, base, was ? was.name : 'SNAP ' + (i + 1), null);
    morphing.hint = '';
    if (b.corners.includes(i)) morphCorners(); else { paintMorph(); changed(); }
    return i;
  }
  function recall(i) {
    const E = engine(); if (!E || !E.bank.slots[i]) return false;
    for (const [name, v] of recallValues(E.dials, E.bank.slots[i])) { const r = E.recs.find((x) => x.id === name); if (r) write(r, v); }
    applyNow(); changed(); return true;
  }
  function rename(i, name) { const E = engine(); const s = E && E.bank.slots[i], nm = String(name).trim().slice(0, NAME_MAX); if (s && nm) { s.name = nm; changed(); } paintMorph(); }
  function remove(i) { const E = engine(); if (!E || !E.bank.slots[i]) return; const b = E.bank; b.slots[i] = null; const held = b.corners.includes(i); b.corners = b.corners.map((k) => (k === i ? null : k)); if (held) morphCorners(); else { paintMorph(); changed(); } }
  function cornerTap(c) { morphing.armed = morphing.armed === c ? -1 : c; morphing.hint = morphing.armed >= 0 ? t('Corner {c}: tap a snapshot\'s number to put it there (tap {c} again to leave it).', { c: CORNERS[c] }) : ''; paintMorph(); }
  function cornerAssign(c, i) { const E = engine(); if (!E) return; E.bank.corners[c] = i; morphing.armed = -1; morphing.hint = ''; morphCorners(); }
  /** a hold or a Shift-click on a corner: the dials as they stand, stored onto that corner (its own slot, else the next empty one) */
  function storeOnCorner(c) {
    const E = engine(); if (!E) return -1;
    const k = E.bank.corners[c];
    const i = store(k === null || k === undefined ? undefined : k);
    if (i >= 0) cornerAssign(c, i);
    return i;
  }
  function engage(on) { const E = engine(); if (!E) return; E.bank.engaged = !!on; if (E.bank.engaged) E.m.touch(); kick(); paintMorph(); changed(); }
  function setSet(sid) {
    if (engineCache) { engineCache.bank.x = MX[0]; engineCache.bank.y = MX[1]; }
    S.set = sid; engineCache = null; morphing = { armed: -1, hint: '' };
    const b = bankOf(sid); MX[0] = MX[2] = b.x; MX[1] = MX[3] = b.y;
    engine();
    if (V && V.morphPad) V.morphPad.set(MX[0], MX[1]);
    paintMorph(); changed();
  }

  /* ═══ PAIR ═══ */
  const pairHand = (P, x, y) => { write(P.x, x); write(P.y, y); applyNow(); };
  function paintPair() {
    if (!V || !V.pair) return;
    const { pad, recs } = V.pair;
    if (pad.pad.classList.contains('drag') || pad.x.dragging() || pad.y.dragging()) return;
    for (const [k, r] of [[pad.x, recs.x], [pad.y, recs.y]]) {
      if (routed(r.id)) { k.set(mod.baseOf(r.id)); k.show(mod.currentOf(r.id)); }
      else { const v = r.get(); if (k.get() !== v || k.shown !== null) k.set(v); }
    }
  }

  /* ═══ the view ═══ */
  function padBlock(parent, opts, onHome) {
    const p = xyPad(opts);
    parent.appendChild(p.root);
    const side = p.root.querySelector('.mir-xy-side');
    const spring = sw({ label: 'SPRING', value: S.spring, cls: 'xy-spring', title: 'SPRING — the pad returns to centre when you let go', onChange: (v) => { S.spring = v; for (const s of V.springs) if (s !== spring) s.set(v); changed(); } });
    side.appendChild(spring.root); V.springs.push(spring);
    /* SPRING: on release of a drag, the pad goes home (the keyboard keeps its own Home) */
    let dragged = false;
    p.pad.addEventListener('pointerdown', () => { dragged = p.pad.classList.contains('drag'); });
    const release = () => { if (!dragged) return; dragged = false; if (S.spring) { onHome(); changed(); } };
    p.pad.addEventListener('pointerup', release); p.pad.addEventListener('pointercancel', release);
    trail(p);
    return p;
  }
  /** THE TRAIL: the dot's last positions while a route moves it, painted on the frame after the dot moved and never otherwise */
  function trail(p) {
    const box = el('div', 'xy-trail', p.pad); box.hidden = true; box.setAttribute('aria-hidden', 'true');
    const dots = Array.from({ length: TRAIL }, (_, i) => { const d = el('i', 'xy-trail-dot', box); setVar(d, '--i', i); d.hidden = true; return d; });
    const xs = new Float64Array(TRAIL), ys = new Float64Array(TRAIL), dot = p.pad.querySelector('.xy-dot'), tk = key + ':trail:' + dots.length + ':' + (++uid);
    let n = 0, head = 0;
    function paint() {
      if (!p.pad.classList.contains('mod')) { if (!box.hidden) { box.hidden = true; n = 0; for (const d of dots) d.hidden = true; } return; }
      const x = parseFloat(dot.style.getPropertyValue('--x')), y = parseFloat(dot.style.getPropertyValue('--y'));
      const last = (head + TRAIL - 1) % TRAIL;
      if (!finite(x) || !finite(y) || (n && xs[last] === x && ys[last] === y)) return;     // a still dot paints nothing
      xs[head] = x; ys[head] = y; head = (head + 1) % TRAIL; n = Math.min(TRAIL, n + 1);
      box.hidden = false;
      for (let k = 0; k < TRAIL; k++) {
        const d = dots[k]; if (k >= n) { d.hidden = true; continue; }
        const j = (head - 1 - k + 2 * TRAIL) % TRAIL; d.hidden = false; setVar(d, '--x', xs[j]); setVar(d, '--y', ys[j]);
      }
    }
    for (const k of [p.x, p.y]) {
      const set0 = k.set, show0 = k.show;
      k.set = function (v, silent) { set0.call(k, v, silent); frame.coalesce(tk, paint); };
      k.show = function (v) { show0.call(k, v); frame.coalesce(tk, paint); };
    }
    V.trails.push(tk);
  }
  const title_ = (parent, words) => label(el('div', 'xy-title', parent), words);

  function buildPair(box) {
    if (pairs.length > 1) {
      V.pairStep = stepper({ label: 'PAIR', items: pairs.map((p, i) => ({ id: String(i), label: p.label || 'PAIR ' + (i + 1) })), value: String(S.pair),
        onChange: (sid) => { S.pair = +sid; mountPair(); changed(); } });
      V.pairStep.root.classList.add('xy-pick'); box.appendChild(V.pairStep.root);
    }
    V.pairSeat = el('div', 'xy-seat', box);
    mountPair();
  }
  function mountPair() {
    if (V.pair) { V.pair.pad.destroy(); V.pair = null; V.springs = V.springs.filter((s) => s.root.isConnected); }
    V.pairSeat.replaceChildren();
    const recs = pairRecs(S.pair);
    if (!recs) { label(el('p', 'xy-quiet', V.pairSeat), 'This pair is not here yet: its window has not been built.'); return; }
    const ax = (r) => ({ label: r.label, min: r.min, max: r.max, value: baseOf(r), log: r.map === 'log', step: r.step || undefined, fmt: r.fmt, unit: r.unit, title: r.hint });
    const home = [homeOf(recs.x), homeOf(recs.y)];
    const P = { recs };
    const pad = padBlock(V.pairSeat, { label: recs.label, aria: recs.label + ' — XY pad', x: ax(recs.x), y: ax(recs.y), home,
      onInput: (x, y) => pairHand(recs, x, y), onChange: () => changed() }, () => { pad.set(home[0], home[1]); pairHand(recs, home[0], home[1]); });
    pad.x.setDefault(home[0]); pad.y.setDefault(home[1]);
    pad.x.root.dataset.param = recs.x.id; pad.y.root.dataset.param = recs.y.id;   // a macro dropped here routes the app's own parameter
    P.pad = pad; V.pair = P;
    paintPair();
  }

  function buildRoute(box) {
    const pad = padBlock(box, { label: title, aria: title + ' — XY controller', x: { label: 'X', min: 0, max: 1, value: R[0], fmt: f3 }, y: { label: 'Y', min: 0, max: 1, value: R[1], fmt: f3 },
      home: [0.5, 0.5], onInput: (x, y) => routeHand(x, y), onChange: () => { if (mod && mod.persist) mod.persist(); changed(); } },
    () => { pad.set(0.5, 0.5); routeHand(0.5, 0.5); });
    pad.x.setDefault(0.5); pad.y.setDefault(0.5);
    V.routePad = pad;
    const row = el('div', 'xy-grips', box);
    const api = mod && mod.view && mod.view.api && typeof mod.view.api.wireGrip === 'function' ? mod.view.api : null;
    V.grips = {};
    for (const ax of ['x', 'y']) {
      const g = el('button', 'trig xy-grip m2grip', row); g.type = 'button'; g.dataset.axis = ax;
      g.appendChild(glyphEl('move', 'xy-grip-g', 18));
      label(el('span', 'trig-l', g), ax.toUpperCase());
      const n = el('span', 'xy-grip-n', g);
      hint(g, 'Drag {axis} onto any knob to route it there; tap to arm, then tap a knob; double-tap resets it', { axis: ax.toUpperCase() });
      ariaLabel(g, 'route {axis} — drag onto a control, or tap to arm', { axis: ax.toUpperCase() });
      g.addEventListener('pointerdown', () => { ensureMacro(ax); }, { capture: true });   // the macro exists before the window's grip reads it
      if (api) api.wireGrip(g, MAC[ax]); else g.disabled = true;
      g.addEventListener('pointerup', () => frame.coalesce(key + ':route', () => { dropSelf(); syncRoute(); }));
      V.grips[ax] = { root: g, n };
    }
    if (!api) label(el('p', 'xy-quiet', box), 'The modulation window is not mounted here: X and Y cannot be routed.');
    for (const ax of ['x', 'y']) if (M && M.macroOf(MAC[ax])) ensureMacro(ax);     // macros a saved rack kept are this panel's again
    AX.route.forEach((tid, i) => addTarget({ id: tid, label: title + ' ' + 'XY'[i], min: 0, max: 1, step: 0, map: 'linear', def: 0.5, hint: 'the XY controller\'s ' + 'XY'[i],
      get: () => R[2 + i], set: (v) => { R[2 + i] = v; driveMacro(i ? 'y' : 'x', v); }, widget: i ? pad.y : pad.x }));
    syncRoute();
  }
  /** the pad and the grips from the model: a macro moved in the window (its value bar, a double-tap on its grip) is the truth when no
   *  route drives the axis; the grips say how many controls each reaches */
  function syncRoute() {
    if (!V || !V.routePad) return;
    ['x', 'y'].forEach((ax, i) => {
      const m = M && M.macroOf(MAC[ax]);
      if (m && !m.sourceId && !routed(AX.route[i]) && m.value !== R[2 + i]) { R[i] = R[2 + i] = m.value; }
      const g = V.grips[ax]; if (g) setText(g.n, m && M.routeCountOfMacro(m.id) ? '→ ' + M.routeCountOfMacro(m.id) : '');
    });
    const pad = V.routePad;
    if (!pad.pad.classList.contains('drag') && !routed(AX.route[0]) && !routed(AX.route[1])) pad.set(R[0], R[1]);
  }

  function buildMorph(box) {
    const all = sets();
    if (all.length > 1) {
      V.setStep = stepper({ label: 'WINDOW', items: all.map((s) => ({ id: s.id, label: s.label })), value: S.set || all[0].id, onChange: (sid) => setSet(sid) });
      V.setStep.root.classList.add('xy-pick'); box.appendChild(V.setStep.root);
    }
    title_(box, 'SNAPSHOTS');
    V.rows = el('div', 'xy-rows', box);
    const sr = el('div', 'xy-row-store', box);
    V.storeBtn = trig({ label: 'STORE', title: 'Store the window\'s dials as they stand (their bases) into the next empty slot', cls: 'xy-store', onFire: () => store() });
    sr.appendChild(V.storeBtn.root);
    title_(box, 'CORNERS');
    const grid = el('div', 'xy-corners', box);
    V.corners = [];
    for (const c of [2, 3, 0, 1]) {                                            // laid out as the pad is: C D over A B
      let held = false, timer = 0;
      const b = trig({ label: CORNERS[c], cls: 'xy-corner', onFire: (e) => {
        if (held) { held = false; return; }                                     // the click that ends a hold stores nothing more
        if (e && e.shiftKey) storeOnCorner(c); else cornerTap(c);
      } });
      b.root.dataset.corner = CORNERS[c];
      const cancel = () => { if (timer) { clearTimeout(timer); timer = 0; } };
      b.root.addEventListener('pointerdown', (e) => { if (e.button) return; held = false; cancel(); timer = setTimeout(() => { timer = 0; held = true; storeOnCorner(c); }, HOLD_MS); });
      b.root.addEventListener('pointerup', cancel); b.root.addEventListener('pointercancel', () => { cancel(); held = false; }); b.root.addEventListener('pointerleave', cancel);
      grid.appendChild(b.root); V.corners[c] = b;
    }
    const pad = padBlock(box, { label: 'PAD', aria: 'The morph pad: drag to blend the four corners; arrows nudge, Home centres', tags: { bl: 'A', br: 'B', tl: 'C', tr: 'D' },
      x: { label: 'X', min: 0, max: 1, value: MX[0], fmt: f3 }, y: { label: 'Y', min: 0, max: 1, value: MX[1], fmt: f3 }, home: [0.5, 0.5],
      onInput: (x, y) => morphHand(x, y), onChange: () => { const E = engine(); if (E) { E.bank.x = MX[0]; E.bank.y = MX[1]; } changed(); } },
    () => { pad.set(0.5, 0.5); morphHand(0.5, 0.5); const E = engine(); if (E) { E.bank.x = 0.5; E.bank.y = 0.5; } });
    pad.x.setDefault(0.5); pad.y.setDefault(0.5);
    V.engage = sw({ label: 'ENGAGE', value: false, cls: 'xy-engage', title: 'The pad drives the dials; off, the pad and its routes do nothing and the dials are the hand\'s', onChange: (on) => engage(on) });
    pad.root.querySelector('.mir-xy-side').insertBefore(V.engage.root, pad.root.querySelector('.xy-spring'));
    V.morphPad = pad;
    V.hint = el('p', 'xy-quiet xy-hint', box);
    AX.morph.forEach((tid, i) => addTarget({ id: tid, label: 'MORPH ' + 'XY'[i], min: 0, max: 1, step: 0, map: 'linear', def: 0.5, hint: 'the morph pad\'s ' + 'XY'[i] + ': A and ' + (i ? 'B at 0, C and D at 1' : 'C at 0, B and D at 1'),
      get: () => MX[2 + i], set: (v) => { MX[2 + i] = v; kick(); }, widget: i ? pad.y : pad.x }));
    engine(); paintMorph();
  }
  /** the bank's rows, the corners' names, ENGAGE and the hint (AUTOMATA's paintMorph) */
  function paintMorph() {
    if (!V || !V.rows) return;
    const E = engine();
    V.rows.replaceChildren(); V.rows.classList.toggle('assigning', morphing.armed >= 0);
    if (E) E.bank.slots.forEach((s, i) => {
      if (!s) return;
      const row = el('div', 'xy-row', V.rows); row.dataset.slot = String(i);
      const num = el('button', 'xy-num', row); num.type = 'button'; setText(num, String(i + 1));
      hint(num, morphing.armed >= 0 ? 'Put {name} on corner {c}' : 'Tap a corner first, then this number, to put this snapshot there', { name: s.name, c: CORNERS[Math.max(0, morphing.armed)] });
      num.addEventListener('click', () => { if (morphing.armed >= 0) cornerAssign(morphing.armed, i); else { morphing.hint = t('Tap a corner (A · B · C · D) first, then a snapshot\'s number.'); paintHint(); } });
      const name = el('input', 'xy-name', row); name.type = 'text'; name.value = s.name; name.maxLength = NAME_MAX; name.spellcheck = false;
      ariaLabel(name, 'snapshot {n}\'s name', { n: i + 1 });
      name.addEventListener('change', () => rename(i, name.value)); name.addEventListener('keydown', (e) => { if (e.key === 'Enter') name.blur(); });
      const on = E.bank.corners.map((k, c) => (k === i ? CORNERS[c] : '')).join('');
      if (on) { const tag = el('span', 'xy-on', row); setText(tag, on); }
      const acts = el('div', 'xy-acts', row);
      acts.append(trig({ label: 'RECALL', cls: 'xy-recall', title: 'Set the dials to this snapshot', onFire: () => recall(i) }).root,
        trig({ label: 'STORE', cls: 'xy-over', title: 'Store the dials as they stand over this snapshot', onFire: () => store(i) }).root,
        trig({ label: '×', cls: 'xy-del', title: 'Delete this snapshot', onFire: () => remove(i) }).root);
    });
    if (!V.rows.children.length) label(el('p', 'xy-quiet', V.rows), 'No snapshots yet: STORE keeps the dials as they stand.');
    for (let c = 0; c < 4; c++) {
      const b = V.corners[c], k = E ? E.bank.corners[c] : null;
      b.setLabel(CORNERS[c] + ' · ' + (k === null || !E.bank.slots[k] ? '—' : E.bank.slots[k].name));
      b.on = morphing.armed === c;
      hint(b.root, 'Corner {c}: tap, then a snapshot\'s number, to put it here; hold or Shift-click to store the dials straight onto it', { c: CORNERS[c] });
    }
    if (V.engage && E && V.engage.get() !== E.bank.engaged) V.engage.set(E.bank.engaged);
    if (V.morphPad) V.morphPad.pad.classList.toggle('engaged', !!(E && E.bank.engaged));
    paintHint();
  }
  const paintHint = () => { if (V && V.hint) setText(V.hint, morphing.hint || t(MORPH_LINE)); };

  function setMode(m) {
    if (!modes().includes(m) || m === S.mode) return;
    S.mode = m;
    if (V) { for (const [k, b] of Object.entries(V.bodies)) b.hidden = k !== m; if (V.modeSeg && V.modeSeg.get() !== m) V.modeSeg.set(m); }
    sync(); changed();
  }
  function build(parent, api) {
    say = api && api.setStatus ? (s) => api.setStatus(s) : () => {};
    const ms = modes();
    if (!ms.includes(S.mode)) S.mode = ms[0] || null;
    V = { springs: [], trails: [], bodies: {} };
    const root = el('div', 'mir-xypanel', parent);
    V.root = root;
    if (ms.length > 1) {
      const head = el('div', 'xy-head', root);
      V.modeSeg = seg({ aria: 'what the pad does', options: ms.map((m) => ({ id: m, label: WORD[m], title: TIP[m] })), value: S.mode, onChange: (m) => setMode(m) });
      head.appendChild(V.modeSeg.root);
    }
    if (!ms.length) label(el('p', 'xy-quiet', root), 'Nothing to drive: give the panel pairs, a modulation install, or a window to morph.');
    for (const m of ms) {
      const box = el('section', 'xy-body', root); box.dataset.mode = m; box.hidden = m !== S.mode; V.bodies[m] = box;
      (m === 'pair' ? buildPair : m === 'route' ? buildRoute : buildMorph)(box);
    }
    if (typeof o.subscribe === 'function') offs.push(o.subscribe(() => frame.coalesce(key + ':sync', sync)));
    if (mod && typeof mod.onTick === 'function') offs.push(mod.onTick(() => { if (presented && S.mode === 'pair' && V && V.pair && (routed(V.pair.recs.x.id) || routed(V.pair.recs.y.id))) paintPair(); }));
    return root;
  }
  /** everything from the model, once (a notice, an open, a wake, a restore) */
  function sync() {
    if (!V) return;
    if (V.pair) { const recs = pairRecs(S.pair); if (!recs || recs.x !== V.pair.recs.x || recs.y !== V.pair.recs.y) mountPair(); else paintPair(); }
    else if (V.pairSeat && pairRecs(S.pair)) mountPair();
    if (V.pairStep && V.pairStep.get() !== String(S.pair)) V.pairStep.set(String(S.pair));
    syncRoute();
    if (V.morphPad) {
      if (V.setStep && S.set && V.setStep.get() !== S.set) V.setStep.set(S.set);
      if (!V.morphPad.pad.classList.contains('drag') && !routed(AX.morph[0]) && !routed(AX.morph[1])) V.morphPad.set(MX[0], MX[1]);
      paintMorph();
    }
    for (const s of V.springs) if (s.get() !== S.spring) s.set(S.spring);
  }

  /* ── the project and the history ── */
  function capture() {
    if (engineCache) { engineCache.bank.x = MX[0]; engineCache.bank.y = MX[1]; }
    const b = {}; for (const [k, bank] of banks) b[k] = saveBank(bank);
    return { v: 1, mode: S.mode, pair: S.pair, spring: S.spring, set: S.set, route: [R[0], R[1]], banks: b };
  }
  function restore(raw) {
    if (!raw) return;
    const s = readXY(raw);
    if (s.mode) S.mode = s.mode; S.pair = s.pair; S.spring = s.spring; S.set = s.set;
    banks.clear(); for (const [k, b] of Object.entries(s.banks)) banks.set(k, b);
    engineCache = null; morphing = { armed: -1, hint: '' };
    /* ROUTE: the hand's position, and the macros where nothing drives them */
    R[0] = s.route[0]; R[1] = s.route[1];
    if (!hand(AX.route[0], R[0])) R[2] = R[0];
    if (!hand(AX.route[1], R[1])) R[3] = R[1];
    driveMacro('x', R[2]); driveMacro('y', R[3]);
    /* MORPH: the set's pad as it stands is no move (AUTOMATA's restore): the dials are their own part's */
    const cs = curSet();
    if (cs) { const b = bankOf(cs.id); MX[0] = MX[2] = b.x; MX[1] = MX[3] = b.y; hand(AX.morph[0], b.x); hand(AX.morph[1], b.y); engine(); }
    applyNow();
    if (V) {
      for (const [k, b] of Object.entries(V.bodies)) b.hidden = k !== S.mode;
      if (V.modeSeg && S.mode) V.modeSeg.set(S.mode);
      sync();
    }
  }
  if (o.project !== false) {
    const reg = o.project && typeof o.project.register === 'function' ? o.project.register : registerProjectPart;
    offs.push(reg(part, { capture, restore, subscribe: (fn) => { watchers.add(fn); return () => watchers.delete(fn); } }));
  }
  if (o.history && typeof o.history.register === 'function') offs.push(o.history.register(part, { read: capture, write: restore }));

  /* ── the card ── */
  const api = {
    id, part, macros: MAC, targets: AX,
    get root() { return V && V.root; },
    mode: () => S.mode, setMode, modes,
    pair: () => S.pair, setPair: (i) => { if (!pairs[i]) return; S.pair = i; if (V && V.pairSeat) mountPair(); changed(); },
    sets: () => sets().map((s) => ({ id: s.id, label: s.label, params: s.params.map((p) => p.id) })), set: () => S.set, setSet,
    route: () => ({ x: R[2], y: R[3], hand: [R[0], R[1]] }),
    morph: () => { const E = engine(); return E ? { set: E.set.id, engaged: E.bank.engaged, x: MX[2], y: MX[3], bank: saveBank(E.bank) } : null; },
    store, recall, storeOnCorner, assign: cornerAssign, engage,
    capture, restore, sync,
    params: () => (mod ? plist().filter((p) => String(p.id).startsWith(pre + '.')) : []),
    view: () => V,
    destroy() {
      for (const f of offs) { try { if (typeof f === 'function') f(); } catch (_) { /* gone */ } }
      for (const f of offMod) { try { if (typeof f === 'function') f(); } catch (_) { /* gone */ } }
      frame.cancel(key + ':morph'); frame.cancel(key + ':sync'); frame.cancel(key + ':route');
      if (V) { for (const tk of V.trails) frame.cancel(tk); if (V.root) V.root.remove(); }
      V = null; watchers.clear();
    },
  };
  const spec = {
    id, title, side: o.side || 'right', open: o.open, glyph: o.glyph || 'xy', action: o.action,
    hint: o.hint || 'the XY controller: a pair of the app\'s, two routable sources, or a morph of four snapshots',
    build(body, rackApi) { build(body, rackApi); },
    onOpen() { sync(); }, onWake() { sync(); },
    onPresent(active) { presented = !!active; if (presented) sync(); },
    ...(o.spec || {}),
  };
  api.spec = spec;
  if (o.rack) o.rack.register(spec);
  else if (o.parent) build(o.parent, null);
  return api;
}
