/* modulation/bind.js — how the modulation window drives an app's parameters.
 *
 * What it is: the seam between an app and the kit's modulation plugin, in one call.  The app hands over a list of
 * its parameters (each with get/set and, when it has one, the widget that shows it); this builds the registry and
 * the clock (host.js createModHost), installs the parameters as targets, marks every widget routable
 * (`data-param`), keeps each widget's base road (`setBase`), runs the clock while something moves, stores the rack
 * and the window in the app's settings, and mounts the window (window.js createModulation).  Until 1.5 every app
 * wrote this seam for itself (SOLEIL lab/modulation.js, NEBULA lab/modulation.js, λWAVES' rack.js wiring); this is
 * those seams with their differences as options.
 *   installModulation({ mount, params, … }) → { host, view, registry, M, open, close, toggle, isOpen,
 *     power, setPower, togglePower, onPower (arm, armed, onArm: the same, 1.4 names), play, togglePlay, playing, onPlay,
 *     add, remove, route, own, owned, apply, params, isModulated, baseOf, currentOf, hand, running, bpm, syncBases, paintWidgets, persist,
 *     setTimeline, timeline, setAutomationGrid, automationGrid, dispose }
 *   And three doors on the module (1.5.0-alpha.12), reaching the install made last: setAutomationGrid(value),
 *   automationGrid(), upsertProjectPreset(name, rack?).
 *   Targets come and go (1.5.0-alpha.5): add(param) registers one more after the install (a lazily built window adds
 *   its controls when it is built; a route already saved against it wakes up), and its remove() — or remove(id) —
 *   takes it away with its routes.  route(source, id, depth) is a first route in one call.
 *
 * THE LAWS IT KEEPS
 *   1. THE HAND OWNS THE BASE.  A hand on a routed control writes the registry's base (hand(id, v) → true); the
 *      value the app reads back is the modulated one.  A hand on an unrouted control is the app's, untouched.
 *   2. THE APP'S NUMBER IS THE BASE WHEREVER NOTHING DRIVES IT.  Each tick, before the clock advances, every
 *      unrouted parameter's own value is written into the registry (syncBases), so a route starts from the knob.
 *   3. IDLE COSTS NOTHING.  The clock ticks through core/frame.js only while it runs or the microphone is live; a
 *      paused change (a seek, a preset, a hand on a routed knob) asks for ONE paint of the open window, so the play
 *      dot and the rings follow the model without a loop.
 *   0. ONE CLOCK (1.5.0-alpha.4).  Time is the app's: play(on) starts and stops the clock, and only the app's play
 *      button calls it, and it always plays: it holds its own demand on the clock, so no route, no source and the power
 *      off never refuse it (alpha.6; three models' Tetris found it refused with nothing routed).  Modulation's POWER is a bypass, as BASINS has it: off, every route lets go and every target is
 *      back on its base, while the clock, the sources, the tempo and the HOLDs carry on; on, the routes drive again in
 *      time.  Power never plays; play never powers.
 *   4. A HIDDEN PAGE STOPS THE CLOCK (host.js setHidden) and the microphone; visible, it re-anchors and goes on.
 *   4b. A ROUTED WIDGET SHOWS ITS VALUE.  A knob or a fader whose parameter a route drives keeps the hand's base
 *      (set) and paints the modulated value over it (show) on every tick — so a route onto a fader moves the fader,
 *      natively (SOLEIL laid an invisible knob over its lane fader to get this).  `showWidgets: false` leaves it to the
 *      app.
 *   5. ONE RECORD IN THE APP'S SETTINGS: { modulationState, modwin, modArm, modCadence, audioDevice } through
 *      `store` (default: localStorage under `storageKey`), written 180 ms after the last change and on pagehide.
 *   6. THE RACK AND THE TEMPO ARE THE PROJECT'S TOO (wave 22, Josh's call 23).  The install registers the project parts
 *      'rack' and 'bpm' (modulation/project.js): a project saves them, and opening one writes them back through the same
 *      door a preset and an undo use, then persists the record of law 5 — one writer.  A project without them (older
 *      files) and NEW leave them as they are: the record stays the fallback, and a fresh page's.  `project: false`
 *      keeps them out; `project: { save, load }` translates the saved rack (modulation/project.js rackPart).
 */
import { createModHost } from './host.js';
import * as M from './mod.js';
import { createModulation, ROUTABLE } from './window.js';
import { frame } from '../core/frame.js';
import { createAudioCapture } from './audio-capture.js';
import { registerWindow } from '../window/window.js';
import { jsonStore } from '../core/prefs.js';
import { registerModulationParts } from './project.js';

const TICK = 'mir:modulation:tick', PAINT = 'mir:modulation:paint', APP_PLAY = 'app.play';
const IDLE = { state: 'idle', reason: '', live: false, deviceId: '', sampleRate: 0, frames: 0, inputLatencyMs: null,
  analysisLatencyMs: 0, visualLatencyMs: 0, latencyMs: 0, latencyEstimated: true };

/** a store in localStorage under one key: read() → the record, write(patch) merges.  Every access is guarded (a
 *  private window or blocked storage reads empty and writes nothing). */
export function localStore(key) {
  const s = jsonStore(key), read = () => s.get() || {};
  return { read, write(patch) { s.set({ ...read(), ...patch }); } };
}

/* THE LIVE INSTALL.  The model is one per page (mod.js), so the seam is too: the module-level doors below reach the
   modulation installModulation made last, and do nothing while none is installed. */
let live = null;

/** setAutomationGrid(value) — the AUTOMATION sampling grid (Settings › SAMPLING: FRAME 0 · 1/32 · 1/16 · 1/8, in beats):
 *  the arrangement's value is read at the beat floored to the grid, so it only changes on a grid line; a recorder's
 *  deterministic step always samples per frame.  Stored with the modulation's record.  → the grid now, or null with no
 *  modulation installed.  (BASINS modulation.js setAutomationGrid, docs/TIMELINE-SAMPLING-2026-10-01.md) */
export function setAutomationGrid(value) { return live ? live.setAutomationGrid(value) : null; }
/** automationGrid() → the grid now (0 = FRAME), or null with no modulation installed */
export function automationGrid() { return live ? live.automationGrid() : null; }

/** upsertProjectPreset(name, rack?) — A PROJECT SAVE IS ALSO A PRESET (Josh 10-01: "always write and include the
 *  modulation as it's own preset … All caps in titles"): the rack (default: the live one) is saved as a user preset
 *  named the project in CAPS, replacing its own earlier self; a name a factory preset owns takes the store's free
 *  copy name, in CAPS.  → presetSave's { ok, id, name, replaced, folder } or { ok: false, error }.
 *  (BASINS project-session.js upsertProjectPreset, called by its save window after every save) */
export function upsertProjectPreset(name, rack) {
  const r = M.presetUpsertCaps(name, rack || M.serializeRack());
  if (r && r.ok && live && live.view) live.view.rebuild();
  return r || { ok: false };
}

/** the registry roots a parameter list implies: the first segment of every id, once */
export function rootsOf(params) { return [...new Set(params.map((p) => String(p.id).split('.')[0]))]; }

/**
 * installModulation(o)
 *   mount        the element the window and its rail go in (`#floats`); null: the seam with no window (headless)
 *   params       [{ id, label, unit, group, hint, min, max, step, map, def, get(), set(v), widget }]
 *                id is 'root.name'; map linear | log | wrap | integer | bipolar; widget is a kit knob() or fader()
 *                (anything with .root, and setBase / paint if it has them) — it becomes routable
 *   roots        the registry's id roots (default: rootsOf(params) and 'app'; a target added later must sit under one)
 *   available()  the capability gate: may modulation write now (default: always)
 *   present()    ask the app for a frame (the renderer re-reads the parameters)
 *   onWindow(open)  the window opened or closed
 *   store        { read() → record, write(patch) } (default localStore(storageKey))
 *   storageKey   default 'mir.modulation'
 *   presetKey    the preset store's key (default mod.js PRESET_LS) — two apps on one origin must not share one
 *   audio        the audio capture factory, createAudioCapture({ onState }); absent: the kit's own (audio-capture.js, the microphone
 *                on a press of MIC); `false`: no AUDIO device; an app's own factory wins
 *   dock, copy, targets, routeGlow, toast   passed to the window (window.js createModulation's port; toast(msg): where a
 *                refusal is said — absent, the window's own status line)
 *   enabled      modulation's power at first boot, when the store has none (default true)
 *   switchWorkspace()  the MIR switch after the preset arrows swaps to the other workspace (BASINS:
 *                installModulation({ switchWorkspace: () => layout.switchWorkspace('timeline') })); absent, no switch
 *   automationGrid  the AUTOMATION sampling grid at install (0 FRAME · 1/32 · 1/16 · 1/8 beats); absent, the record's
 *                own `automationGrid` (the store's), else FRAME.  setAutomationGrid(value) changes it later
 *   factory      the app's bundled starter presets: [{ id, name, rack, folder? }] or { presets, folder?, apply?(preset) }
 *                — listed apart from the user's, named in CAPS, in their own folder (default STARTERS); apply(preset)
 *                → a rack to load (an app remaps its routes there), default the preset's own rack
 *   showWidgets  paint routed widgets from the registry each tick (default true; law 4b)
 *   project      the project parts 'rack' and 'bpm' (law 6): default on; false leaves them out; { save(rack) → json,
 *                load(json) → rack } translates the rack an app's files keep
 */
export function installModulation(o) {
  const { mount, present, onWindow } = o;
  let { params = [] } = o;
  const store = o.store || localStore(o.storageKey || 'mir.modulation');
  const prefs = store.read() || {};
  if (o.presetKey) M.setPresetKey(o.presetKey);
  try { if (prefs.modulationState) M.deserialize(prefs.modulationState); } catch (_) { /* a record this model cannot read */ }

  let view = null, lastTick = 0, feedMs = 0, saveTimer = 0, rebasing = false, looping = false, disposed = false;
  let cadence = prefs.modCadence === 120 ? 120 : 60;
  let armed = prefs.modArm === undefined ? o.enabled !== false : prefs.modArm !== false;
  let audioCap = null, timelineRef = null;
  /* the app's bundled starter presets (o.factory): a list, or { presets, folder, apply(preset) → rack } */
  const factory = Array.isArray(o.factory) ? { presets: o.factory } : (o.factory && typeof o.factory === 'object' ? o.factory : null);
  const starters = factory ? M.bundledPresets(factory.presets, factory.folder) : [];
  params = params.slice();                                         // the live list: add() and remove() change it
  const byId = new Map(params.map((p) => [p.id, p])), armWatchers = new Set();
  const available = typeof o.available === 'function' ? o.available : () => true;

  /* ONE CLOCK (1.5.0-alpha.4): the clock is always enabled — the app's play starts and stops it; modulation's POWER is
     host.js setModulationEnabled, which bypasses the routes and leaves time alone (BASINS modulation.js setArm) */
  const host = createModHost({ roots: o.roots || [...new Set([...rootsOf(params), 'app'])], available, presentationActive: false, enabled: true,
    present: () => { if (present) present(); requestLoop(); paintSoon(); } });

  const spec = (p) => ({
    id: p.id, label: p.label, unit: p.unit || '', group: p.group || p.id.split('.')[0], hint: p.hint || '',
    min: p.min, max: p.max, step: Number.isFinite(p.step) ? p.step : 0, map: p.map || 'linear', def: p.def,
    get: () => p.get(),
    set: (value) => { if (!rebasing) p.set(value); if (present) present(); },
  });
  /* every widget becomes a target: data-param is the routing's one hook (never the label), setBase its base road */
  function wire(p) {
    if (!p.widget || !p.widget.root) return;
    p.widget.root.dataset.param = p.id;
    if (p.widget.setBase) p.widget.setBase(() => (host.registry.isModulated(p.id) ? host.registry.baseOf(p.id) : null));
  }
  host.install(params.map(spec));
  for (const p of params) wire(p);
  const offHeld = host.registry.subscribe('*', (event) => {
    const p = byId.get(event.id);
    if (p && p.widget && p.widget.root) p.widget.root.classList.toggle('mod-held', host.registry.isModulated(event.id));
    if (present) present();
  });

  const stateRecord = () => ({ modulationState: M.serialize(), modwin: view ? view.presentation() : prefs.modwin, modArm: armed, modCadence: cadence,
    automationGrid: host.clock.automationGrid() });
  function persistNow() { if (saveTimer) { clearTimeout(saveTimer); saveTimer = 0; } store.write(stateRecord()); }
  function persistSoon() { if (saveTimer) clearTimeout(saveTimer); saveTimer = setTimeout(persistNow, 180); }

  /** the hand's number becomes the registry's base wherever nothing drives the target (law 2) */
  function syncBases(all = false) {
    let changed = 0; rebasing = true;
    try {
      for (const p of params) {
        if (!all && host.registry.isModulated(p.id)) continue;
        const value = Number(p.get());
        if (!Number.isFinite(value) || Object.is(host.registry.snap(p.id, value), host.registry.baseOf(p.id))) continue;
        host.registry.write(p.id, value); changed++;
      }
    } finally { rebasing = false; }
    return changed;
  }

  /* ── the microphone edge (optional): the app's own capture, fed at the modulation cadence ── */
  const audioFactory = o.audio === false ? null : typeof o.audio === 'function' ? o.audio : createAudioCapture;   // the kit's capture is the default (1.5.0-alpha.13)
  const capture = () => (audioCap || (audioCap = audioFactory({ onState: () => { if (view && view.isOpen) view.paint(true); if (present) present(); requestLoop(); } })));
  function audioState() {
    return audioCap ? { state: audioCap.state, reason: audioCap.reason, live: audioCap.live, deviceId: audioCap.deviceId, sampleRate: audioCap.sampleRate, frames: audioCap.frames,
      inputLatencyMs: audioCap.inputLatencyMs, analysisLatencyMs: audioCap.analysisLatencyMs, visualLatencyMs: audioCap.visualLatencyMs, latencyMs: audioCap.latencyMs,
      latencyEstimated: audioCap.latencyEstimated } : { ...IDLE };
  }
  function audioSync() {
    const devices = M.sourceList().filter((s) => s.kind === 'audio');
    if (!devices.length && audioCap && (audioCap.live || audioCap.state === 'asking')) audioCap.stop();
    for (const source of devices) if (M.audioArm) M.audioArm(source.id, true);
  }
  function audioSilence() { if (!M.audioReset) return; for (const source of M.sourceList()) if (source.kind === 'audio') M.audioReset(source.id); }
  function feedAudio(hz) {
    if (!audioCap || !audioCap.live) return;
    const packet = audioCap.read(hz); if (!packet) return;
    for (const source of M.sourceList()) if (source.kind === 'audio') M.modFeedAudio(source.id, packet);
  }

  /** law 4b: a routed widget keeps the hand's base and shows the modulated value; a route removed stands it down */
  const showWidgets = o.showWidgets !== false;
  function paintWidgets() {
    if (!showWidgets) return;
    for (const p of params) {
      const w = p.widget; if (!w || !w.show || (w.dragging && w.dragging())) continue;
      if (host.registry.isModulated(p.id)) { w.set(host.registry.baseOf(p.id)); w.show(host.registry.state(p.id).current); }
      else if (w.shown !== null && w.shown !== undefined) w.set(p.get());
    }
  }

  /* ── THE TICK, through the one frame, only while something moves (law 3) ── */
  const active = () => host.clock.isRunning() || !!(audioCap && audioCap.live);
  function requestLoop() { if (!looping && !disposed && active()) { looping = true; frame.coalesce(TICK, tick); } }
  function tick(stamp) {
    looping = false;
    if (stamp - lastTick >= 1000 / cadence - 1) {
      syncBases();
      if (lastTick) { const dt = Math.min(500, Math.max(1, stamp - lastTick)); feedMs = feedMs ? feedMs + (dt - feedMs) * 0.25 : dt; }
      lastTick = stamp;
      feedAudio(feedMs ? 1000 / feedMs : cadence);
      host.clock.advanceTo(stamp / 1000);
      paintWidgets();
      if (view && view.isOpen) view.paint(false);
      for (const fn of tickWatchers) { try { fn(stamp); } catch (e) { (globalThis.reportError || console.error)(e); } }
      if (present) present();
    }
    requestLoop();
  }
  /** a change while paused (a seek, a preset, a route): the open window paints once — the play dot is never stale */
  function paintSoon() {
    if (disposed || !view || active()) return;
    frame.coalesce(PAINT, () => { paintWidgets(); if (view && view.isOpen) view.paint(true); });
  }
  /** MODULATION'S POWER, as BASINS has it: off bypasses every route (each target returns to its base) and leaves the
   *  clock, the sources, the tempo and the HOLDs running, so power on picks up in time; on puts the routes back.  It
   *  never plays or pauses.  Stored as modArm (the record's old name).  Watchers hear every change (onPower). */
  function setArm(on, options) {
    const was = armed;
    armed = !!on; host.clock.setModulationEnabled(armed);
    if (view) view.sync();
    paintWidgets();
    if (was !== armed || (options && options.announce)) for (const fn of armWatchers) { try { fn(armed); } catch (e) { (globalThis.reportError || console.error)(e); } }
    if (!(options && options.quiet)) persistSoon();
    if (present) present();
    requestLoop(); return armed;
  }
  /** THE APP'S ONE PLAY.  The window never calls it; the app's play button (the transport bar's, the timeline's) does. */
  function play(on) {
    const w = performance.now() / 1000;
    /* the app's play is a DEMAND of its own on the clock (host.js `demand`), so it is never refused for want of a route
       or a source ("nothing-to-run" stays the law of a bare host, e.g. a modulation window's own transport) */
    if (on) host.clock.demand(APP_PLAY, true);
    const r = on ? host.clock.play(w) : host.clock.pause(w);
    if (!on) host.clock.demand(APP_PLAY, false);
    if (view) view.sync();
    if (present) present();
    requestLoop(); paintSoon();
    for (const fn of playWatchers) { try { fn(host.clock.isPlaying()); } catch (e) { (globalThis.reportError || console.error)(e); } }
    return r;
  }
  const playWatchers = new Set(), tickWatchers = new Set();
  /* MACROS OWNED BY A PANEL (1.5.0-alpha.14, the XY panel's ROUTE): a macro a panel drives by hand; no free-macro finder takes it */
  const owners = new Map();
  const owned = (id) => owners.has(String(id));

  const applyNow = () => { host.clock.applyAll(false); persistSoon(); if (present) present(); requestLoop(); paintSoon(); };
  const port = {
    M, registry: host.registry, targets: host.targets, clock: host.clock,
    apply: applyNow,
    cadence: () => cadence,
    setCadence: (hz) => { cadence = hz === 120 ? 120 : 60; persistSoon(); requestLoop(); return cadence; },
    armed: () => armed, arm: (on) => setArm(on),
    knobOf: (rid) => { const p = byId.get(rid); return p ? p.widget || null : null; },
    moved: o.moved || (() => {}),
    switchWorkspace: typeof o.switchWorkspace === 'function' ? o.switchWorkspace : null,   // the MIR switch in the preset bar (window/workspaces.js)
    /* THE BUNDLED STARTERS (row 94): the window lists them first, tagged STARTER, and loads one through applyStarterPreset */
    starterPresets: () => starters,
    applyStarterPreset(id) {
      const p = starters.find((x) => x.id === id); if (!p) return { ok: false, error: 'missing' };
      const rack = factory && typeof factory.apply === 'function' ? factory.apply(p) : p.rack;
      if (!rack) return { ok: false, error: 'missing' };
      host.registry.restoreAll();
      const r = M.rackApply(rack);
      if (r.ok) { M.syncDormant((tid) => host.registry.has(tid)); host.targets.sync(); host.clock.recomputeRunning(); }
      return { ...r, id: p.id, name: p.name };
    },
    opened: () => { host.clock.setPresentationActive(true); if (onWindow) onWindow(true); requestLoop(); },
    closed: () => { host.clock.setPresentationActive(false); if (onWindow) onWindow(false); },
    persist: persistNow,
    owned,
    presetKey: o.presetKey, copy: o.copy, dock: o.dock, targets: o.targets || ROUTABLE, routeGlow: o.routeGlow, toast: o.toast,
    audio: audioFactory ? {
      state: audioState, support: () => capture().support(),
      start: (id) => capture().start(id === undefined ? (store.read().audioDevice || '') : id)
        .then((state) => { if (audioCap && audioCap.live) store.write({ audioDevice: audioCap.deviceId }); requestLoop(); return state; }),
      stop: () => { audioSilence(); return capture().stop(); },
      sync: audioSync, devices: () => capture().devices(),
    } : null,
  };
  view = mount ? createModulation(mount, port) : null;              // no mount: the seam without its window (node tests)
  const stacked = view ? registerWindow({ root: view.root, rail: view.rail }) : null;   // ONE STACK (1.5.0-alpha.15): one press order with the kit's windows
  try { if (view) view.restore(prefs.modwin); } catch (_) { /* a record this window cannot read */ }
  /* the stored AUTOMATION grid, once everything its present() reaches exists (BASINS' 10-01 boot ReferenceError) */
  host.clock.setAutomationGrid(o.automationGrid !== undefined ? o.automationGrid : prefs.automationGrid);
  setArm(armed, { quiet: true, announce: true });

  /* ── targets that come and go, and the first route in one call (1.5.0-alpha.5) ── */
  /** add(param) — one more target after the install: { id, label, min, max, map, get(), set(v), widget }, as in
   *  `params`.  An id already added is replaced (the registry keeps its base and its routes).  → remove()
   *  add([param, …]) (1.5.0-alpha.14) adds a list and rebuilds the window once (a panel's first build adds a dozen).  → remove() of them all */
  function add(p) {
    const list = Array.isArray(p) ? p : [p];
    for (const q of list) if (!q || typeof q.get !== 'function' || typeof q.set !== 'function') throw new TypeError('mod.add: a parameter needs an id, get() and set()');
    for (const q of list) {
      const old = byId.get(q.id);
      if (old) params[params.indexOf(old)] = q; else params.push(q);
      byId.set(q.id, q);
      host.targets.installOne(q.id, spec(q));                        // a dormant route onto it wakes now
      wire(q);
      if (q.widget && q.widget.root) q.widget.root.classList.toggle('mod-held', host.registry.isModulated(q.id));
    }
    host.clock.recomputeRunning(); if (view) view.rebuild(); paintSoon(); requestLoop();
    return Array.isArray(p) ? () => { for (const q of list) remove(q.id); } : () => remove(p.id);
  }
  /** remove(id) — the target and every route onto it go; its number is left on its base */
  function remove(id) {
    const p = byId.get(id); if (!p) return false;
    M.removeRoutesOfTarget(id);
    host.targets.uninstall(id);
    byId.delete(id); params.splice(params.indexOf(p), 1);
    if (p.widget && p.widget.root) { delete p.widget.root.dataset.param; p.widget.root.classList.remove('mod-held'); if (p.widget.show) p.widget.set(p.get()); }
    host.clock.recomputeRunning(); if (view) view.rebuild(); applyNow();
    return true;
  }
  /** route(source, id, depth) — a first route in one call: `source` is a source id, a source, or a kind ('lfo', 'env',
   *  'audio': the first source of that kind, made if there is none); a macro already carrying it, or a free one, takes
   *  it; the route swings `depth` of the target's range up from its base (negative: down).  A route onto a target not
   *  added yet waits, dormant, until it is.  → { route, macro, source, remove() } or null (no macro free) */
  function route(source, id, depth = 0.5) {
    let src = typeof source === 'object' && source ? source : M.sourceOf(source), made = false;
    if (!src && typeof source === 'string') {
      src = M.sourceList().find((s) => s.kind === source) || null;
      if (!src) { const r = M.addSource(source); src = r && typeof r === 'object' ? r : M.sourceOf(r); made = !!src; }
    }
    if (!src) return null;
    let macro = M.macroList().find((m) => m.sourceId === src.id), bound = false;
    if (!macro) {
      macro = M.macroList().find((m) => !m.sourceId && m.kind !== 'trigger' && !owned(m.id) && !M.routeCountOfMacro(m.id)) || M.addMacro(null);
      if (!macro || !M.setMacro(macro.id, { sourceId: src.id })) return null;
      bound = true;
    }
    const d = Math.max(-1, Math.min(1, Number(depth) || 0));
    syncBases();                                                     // the route starts from the knob (law 2)
    const r = M.addRoute(macro.id, id, d < 0 ? -d : 0, d < 0 ? 0 : d);
    if (!r) return null;
    host.targets.sync(); host.clock.recomputeRunning(); applyNow(); if (view) view.rebuild();
    const out = { route: r.route, macro, source: src,
      remove() {
        M.removeRoute(r.route.id);
        if (host.registry.has(id) && !M.routeCountOfTarget(id)) host.registry.restoreBase(id);
        if (bound && !M.routeCountOfMacro(macro.id)) M.setMacro(macro.id, { sourceId: null });
        if (made) M.removeSource(src.id);
        host.clock.recomputeRunning(); applyNow(); if (view) view.rebuild();
        return true;
      } };
    return out;
  }

  const onVisibility = () => { host.clock.setHidden(document.hidden); if (audioCap) audioCap.setHidden(document.hidden); if (!document.hidden) requestLoop(); };
  const doc = globalThis.document || null, win = globalThis.window || null;
  if (doc) doc.addEventListener('visibilitychange', onVisibility);
  if (win) win.addEventListener('pagehide', persistNow);

  const self = Object.freeze({
    host, view, registry: host.registry, M,
    open: () => view && view.open(), close: () => view && view.close(), toggle: () => view && view.toggle(),
    get isOpen() { return !!(view && view.isOpen); },
    /** the power (1.5.0-alpha.4): power() reads it, setPower(on) sets it, togglePower() flips it, onPower(fn) → off hears
     *  every change.  arm / armed / onArm are the same three under their 1.4 names, kept as aliases. */
    power: () => armed, setPower: (on) => setArm(on), togglePower: () => setArm(!armed),
    onPower(fn) { armWatchers.add(fn); return () => armWatchers.delete(fn); },
    arm: setArm, armed: () => armed,
    onArm(fn) { armWatchers.add(fn); return () => armWatchers.delete(fn); },
    /** the app's one clock: play(on), togglePlay(), playing(), onPlay(fn) → off */
    play, togglePlay: () => play(!host.clock.isPlaying()), playing: () => host.clock.isPlaying(),
    onPlay(fn) { playWatchers.add(fn); return () => playWatchers.delete(fn); },
    /** onTick(fn) → off: fn(stamp) after every advance of the clock (the timeline's playhead rides it) */
    onTick(fn) { tickWatchers.add(fn); return () => tickWatchers.delete(fn); },
    isModulated: (id) => host.registry.isModulated(id),
    baseOf: (id) => host.registry.baseOf(id),
    currentOf: (id) => host.registry.state(id).current,
    /** own(macroId, owner) — a panel drives this macro by hand (XY ROUTE): route() and the window's source cycle pass it by.  → off
     *  owned(macroId) → the owner or null.  apply() — re-apply every route now and paint once (after a panel moved a macro) */
    own(macroId, owner) { owners.set(String(macroId), String(owner || 'panel')); return () => owners.delete(String(macroId)); },
    owned: (macroId) => owners.get(String(macroId)) || null,
    apply: applyNow,
    /** the hand law: a hand on a routed control writes the base and reports true; an unrouted one is the caller's */
    hand(id, value) {
      if (!host.registry.has(id) || !host.registry.isModulated(id)) return false;
      host.registry.write(id, value); persistSoon(); requestLoop(); paintSoon(); return true;
    },
    add, remove, route,
    /** the targets now, in order: [{ id, label, min, max, get, set, widget, … }] (a copy) */
    params: () => params.slice(),
    running: () => host.clock.isRunning(),
    bpm: () => M.transport.bpm,
    syncBases, persist: persistNow, paintWidgets,
    /** setTimeline(tl) — the timeline this modulation works with (installTimeline's result, or { editor, model }): → TL
     *  appears on every LFO and ENV head, and the PATTERN's sequencer reads its pattern clips.  null takes it away. */
    setTimeline(tl) { timelineRef = tl || null; if (view) view.setTimeline(timelineRef); return timelineRef; },
    /** the attached timeline, or null */
    timeline: () => timelineRef,
    /** the AUTOMATION sampling grid (see the module's setAutomationGrid) */
    setAutomationGrid(g) { const now = host.clock.setAutomationGrid(g); persistSoon(); if (present) present(); requestLoop(); return now; },
    automationGrid: () => host.clock.automationGrid(),
    dispose() {
      if (live === self) live = null;
      if (offParts) offParts();
      disposed = true; frame.cancel(TICK); frame.cancel(PAINT);
      if (doc) doc.removeEventListener('visibilitychange', onVisibility); if (win) win.removeEventListener('pagehide', persistNow);
      if (stacked) stacked.leave();
      offHeld(); persistNow(); if (audioCap) audioCap.stop(); if (view) view.dispose(); host.dispose();
    },
  });
  live = self;
  /* law 6: the rack and the tempo ride in the project; restoring them writes through the preset's door and persists */
  const offParts = o.project === false ? null
    : registerModulationParts(self, { ...(o.project && typeof o.project === 'object' ? o.project : {}), present: () => { if (present) present(); requestLoop(); paintSoon(); } });
  return self;
}
