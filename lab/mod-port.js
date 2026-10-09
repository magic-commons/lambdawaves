/* mod-port.js — THE MODULATION PORT (0.5.0 A5): the object MIR 1.5's `createModulation(host, port)` (`modulation/window.js`,
 * the window since C4) takes, key for key: M, registry, clock, apply, knobOf, persist, cadence, setCadence, armed, arm, audio,
 * rateControl, moved, opened, closed, dock — and the edges behind it that rack.js held in five places.
 *   · THE CATALOGUE'S HOOKS.  rack.js keeps the catalogue (its defs list: ids, ranges, adapters); install(defs, roots) registers
 *     it (host-contract.md PART 3: registry · target host · clock · presentation, and nothing else), stamps every dial that has
 *     one with its id (the drop hit-test is `.k[data-param]`, wave 61), hands each its registry BASE (`setBase`, wave 68: a
 *     focused dial under a running LFO announces the number the hand owns) and dresses a held dial in ACCENT B (`.mod-held`),
 *     window open or closed.  `knobs` / `gets` are the runtime door's maps too (LW.mod.register).
 *   · THE HAND / BASE / MODULATED LAW (registry.js).  `hand`: a hand on a routed control moves its BASE and leaves the current
 *     value to the modulator.  `setKnob`: a modulator's write to a routed dial is PAINTED (`show`), a plain one SET (Josh
 *     2026-09-10, "touching a macro'd dial teleported the whole range"), never while a finger is on the dial.  `syncBases`: the
 *     base follows the hand every frame for everything NOT held — resync() minus the modulated, so a base never ratchets up to
 *     wherever the LFO is; `all` only on a restore, which has just written the file's numbers into the Cards.  It asks for no
 *     frame (`syncing`, which rack.js' schedule() reads): everything it writes is already on the screen.
 *   · THE AUDIO DEVICE WIRING (waves 102/105).  One capture for the whole rack, built lazily and opened only by a press on an
 *     AUDIO device's MIC (`onCapture` hands it to rack.js' loop and visibility authority); the feed at the modulation cadence
 *     (`feedAudio`, one read for every AUDIO card); the closer off the frame path (`audio.sync` after every rebuild); silence when
 *     the signal stops (`audioReset`, or every follower pins its last value); the input remembered as a device HANDLE, never audio.
 *   · THE CADENCE: 60 or 120 Hz, the panel's, never the display's.
 *   · THE ONE CLOCK's modulation half (0.5.0 A6, the facade; C4, R-B1: every edge, LINKED/SEPARATE retired): `follow(on)` is THE
 *     play's edge (clock.js onePlay), the power on or off.  A play holds the kit's `demand('app.play')` first, so the modulation is
 *     never refused for want of a route or an open editor (MIR 1.5 `installModulation().play`); a pause releases it.
 *   · THE FLASH GUARD's LIMITER (0.5.1 D10-19, PARTIAL): `guardRoutes`, below — four luminance routes, nothing else.
 */
import { createModHost } from './mir/modulation/host.js';
import { createAudioCapture, AUDIO_STATE } from './mir/modulation/audio-capture.js';   // wave 102's capture half, the kit's since 1.5 (0.5.0 C4: lab/audio.js deleted)
import { createFlashGuard, WCAG } from './mir/shell/flash-guard.js';

/** THE FLASH GUARD's LIMITER (0.5.1 D10-19) on the four routes that reach the pixel's luminance; HUE is out (a wrap seam reads as a
 *  0.98 swing) and so is everything else.  PARTIAL: reg.morph, chem.kick and the camera can still flash — only the FIELD JUDGE (a pixel
 *  readback, 0.5.x) sees that.  FLASH_STEP is the step, in the map's own space (ln for a log route), that moves the picture's luminance
 *  by 10 % at the route's default (tools/flash-calibrate.mjs, U8), so ranges = [0, step / delta].  A route is held only while a
 *  modulator drives it: a hand's write and the restore to the base on a stop pass untouched and let go of the guard. */
export const FLASH_STEP = { 'material.exposure': 0.0953, 'material.gamma': 0.1319, 'material.stage': 0.1131, 'material.knee': 0.2595 };
export function guardRoutes(defs, { driven, now, say }) {
  const on = defs.filter((d) => d.id in FLASH_STEP);
  const guard = createFlashGuard({ now, ranges: Object.fromEntries(on.map((d) => [d.label, [0, FLASH_STEP[d.id] / WCAG.delta]])),
    onTrip: (t) => say(`FLASH GUARD · ${t.route} ${t.hz.toFixed(1)} Hz held to ${WCAG.maxHz}/s`), onRelease: () => say('') });
  return defs.map((d) => (!on.includes(d) ? d : { ...d, set: (v) => {
    if (!driven(d.id)) { if (guard.state(d.label)?.held) say(''); guard.reset(d.label); return d.set(v); }
    const log = d.map === 'log', x = log ? Math.log(v) : v, g = guard(x, d.label);
    return d.set(g === x ? v : log ? Math.exp(g) : g);          // a pass hands over the number it was given, never exp(ln v)
  } }));
}

const CAP = ['state', 'reason', 'live', 'deviceId', 'sampleRate', 'frames', 'inputLatencyMs', 'analysisLatencyMs', 'visualLatencyMs', 'latencyMs', 'latencyEstimated'];
const IDLE = { state: AUDIO_STATE.IDLE, reason: '', live: false, deviceId: '', sampleRate: 0, frames: 0, inputLatencyMs: null,
  analysisLatencyMs: 0, visualLatencyMs: 0, latencyMs: 0, latencyEstimated: true };

/** deps: { available, present (never a tier above PRESENT), view: () => the window or null, onCapture(cap), save(), say(text): the flash guard's line } */
export function createModPort({ available, present, view, onCapture, save, say }) {
  let host = null, cap = null, syncing = false, adapters = [], idOf = null;
  const knobs = Object.create(null), gets = Object.create(null), held = new Set();
  const cadence = { hz: 60, get step() { return 1000 / this.hz - 0.5; } };
  const win = () => view() || null;
  const routed = (id) => !!host && host.registry.has(id) && host.registry.isModulated(id);
  const knobId = (k) => {
    if (!idOf) { idOf = new Map(); for (const a of adapters) { try { const kk = a.knob && a.knob(); if (kk) idOf.set(kk, a.id); } catch (_) {} } }
    return idOf.get(k);
  };
  const capture = () => {
    if (!cap) { cap = createAudioCapture({ onState: () => { const v = win(); if (v && v.isOpen) v.paint(true); present(); } }); onCapture(cap); }
    return cap;
  };
  const audioSync = () => {
    if (!host) return;
    const M = host.model, devs = M.sourceList().filter((q) => q.kind === 'audio');
    if (!devs.length && cap && (cap.live || cap.state === 'asking')) cap.stop();
    for (const q of devs) { if (M.audioArm) M.audioArm(q.id, true); }   // `armed` is false at birth; audioDemand is dead without this
  };
  const audioSilence = () => { if (!host || !host.model.audioReset) return; for (const q of host.model.sourceList()) if (q.kind === 'audio') host.model.audioReset(q.id); };
  const P = {
    get host() { return host; }, get syncing() { return syncing; }, knobs, gets, held, cadence,
    setCadence(hz) { cadence.hz = hz === 120 ? 120 : 60; save(); return cadence.hz; },
    knobOf: (id) => (knobs[id] ? knobs[id]() : null),
    setKnob(k, v) { if (!k || k.root.classList.contains('drag')) return; const id = knobId(k); if (id && routed(id) && k.show) k.show(v); else k.set(v); },
    hand(id, v) { if (!routed(id)) return false; host.registry.write(id, v); return true; },
    /** 0.5.0 C1: the kit panels' two reads (panels/camera.js `routed`, `base`).  No `add`: the panels register nothing, the catalogue is rack.js' */
    isModulated: routed, baseOf: (id) => host.registry.baseOf(id),
    syncBases(all) {
      if (!host) return 0;
      const R = host.registry; let n = 0;
      syncing = true;
      try {
        for (const id of R.list()) {
          if (!all && R.isModulated(id)) continue;
          const g = gets[id]; if (!g) continue;
          const v = Number(g());
          if (!Number.isFinite(v) || Object.is(R.snap(id, v), R.baseOf(id))) continue;
          R.write(id, v); n++;
        }
      } finally { syncing = false; }
      return n;
    },
    /** one read serves every AUDIO card: two cards on one microphone are two ANALYSES of one signal */
    feedAudio(hz) {
      if (!cap || !cap.live || !host) return 0;
      const M = host.model, packet = cap.read(hz);
      if (!packet) return 0;
      let n = 0;
      for (const s of M.sourceList()) { if (s.kind !== 'audio') continue; M.modFeedAudio(s.id, packet); n++; }
      return n;
    },
    install(defs, roots) {
      defs = guardRoutes(defs, { driven: routed, now: () => host.clock.stats().seconds, say });   // the modulation's own seconds: wall live, the exact step in a film
      adapters = defs; idOf = null;
      host = createModHost({ available, present, presentationActive: false, roots });   // a closed editor has no preview demand
      host.install(defs.map(({ knob: _k, ...d }) => d));
      for (const d of defs) { if (d.knob) knobs[d.id] = d.knob; gets[d.id] = d.get; }
      requestAnimationFrame(P.stamp);                   // a frame later: the `ui.*` dials the accessors close over exist by then
      host.registry.subscribe('*', (ev) => {
        const on = !!ev.modulated;
        if (on === held.has(ev.id)) return;
        if (on) held.add(ev.id); else held.delete(ev.id);
        const k = knobs[ev.id] && knobs[ev.id]();
        if (k && k.root) k.root.classList.toggle('mod-held', on);
      });
      return host;
    },
    follow(on) {
      if (!host) return null;
      const C = host.clock, w = performance.now() / 1000; if (on) C.demand('app.play', true);   // the demand first, then the play
      const r = on ? C.play(w) : C.pause(w); if (!on) C.demand('app.play', false);           // the pause first, then the release
      const v = win(); if (v) v.sync(); return r;
    },
    stamp() {
      for (const d of adapters) { const k = d.knob && d.knob(); if (!k || !k.root) continue; k.root.dataset.param = d.id;
        if (k.setBase) k.setBase(() => (routed(d.id) ? host.registry.baseOf(d.id) : null)); }
    },
    /** THE PORT.  `extra` is the host's own: moved (the transport's dodge), rateControl, persist, note (a model edit may be a
     *  history row), device { read, write } (the remembered input, a PREFERENCE), and the arm (armed, arm). */
    port({ moved, rateControl, persist, note, device, armed, arm }) {
      const C = host.clock;
      return { moved, rateControl, persist, armed, arm, knobOf: P.knobOf,
        M: host.model, registry: host.registry, clock: C,   // 0.5.0 C4: no `targets` — the kit reads it as the routable-control SELECTOR
        dock: false,                                                     // 0.5.0 C4: the window floats; the dock span is the kit rack's (C3)
        opened: () => { C.setPresentationActive(true); present(); },   // the editor's preview demand only: THE play holds its own (A6)
        closed: () => { C.setPresentationActive(false); },              // the kit's close reports moved(null) itself
        apply: () => { C.applyAll(false); present(); note(); },
        cadence: () => cadence.hz, setCadence: P.setCadence,
        audio: {
          state: () => (cap ? Object.fromEntries(CAP.map((k) => [k, cap[k]])) : { ...IDLE }),
          support: () => capture().support(),
          start: (id) => capture().start(id === undefined ? device.read() : id).then((st) => { if (cap && cap.live) device.write(cap.deviceId); return st; }),
          stop: () => { audioSilence(); return capture().stop(); },
          sync: audioSync,
          devices: () => capture().devices(),
        } };
    },
  };
  return P;
}
