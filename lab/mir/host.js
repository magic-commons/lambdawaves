/* host.js — THE λWAVES MODULATION HOST.  MIR edges 2, 3 and 4.
 *
 * The other project spent a whole mission proving one thing: their modulation window
 * boots on FOUR INJECTED EDGES and nothing else.  Not on their renderer, not on their
 * scheduler, not on their GPU, not on their canvas — on four edges.
 *
 *   1  a parameter registry           lab/mir/registry.js       (edge 1, its own file)
 *   2  a target host                  createTargetHost()        install / sync / uninstall / available
 *   3  a clock that OWNS modulation time   createModClock()     the whole of the risk
 *   4  presentation + geometry invalidation callbacks           default no-ops
 *
 * This file is edges 2, 3 and 4 for λWAVES.  Edge 4 defaults to no-ops, which is what
 * makes the whole thing run under node with no DOM in sight; the rack wave will map it
 * to schedule(TIER.PRESENT).  Nothing here imports the rack, and nothing here imports
 * their WindowKit — our rack IS our window kit.
 *
 * ── WHY THE CLOCK IS THE DANGEROUS ONE ────────────────────────────────────────────
 * Their own extraction document calls clock ownership "the highest-risk behavioural
 * move", and the reason is that six different behaviours all read the same two
 * numbers (dt and the wall stamp) and all mean different things by them:
 *
 *   WALL SYNC     beats are DERIVED from the absolute wall stamp, not accumulated
 *                 from dt.  A clamp on dt therefore does not slow wall-synced LFOs,
 *                 and a re-anchor is the only thing that moves them.
 *   FREE SYNC     beats ARE accumulated from dt.  A clamp on dt loses time here and
 *                 only here — which is exactly what it is for.
 *   ENV TIME      an envelope's own clock is dt, always, in both sync modes.
 *   HOLD FOLDS    a hold folds the beat into one bar and keeps a SHADOW of the
 *                 un-held run; release rejoins the shadow.  Hidden releases holds.
 *   VISIBILITY    hidden stops the clock; visible RE-ANCHORS and continues from where
 *                 the phase was, rather than jumping to where the wall says it is.
 *   STEPPING      a deterministic step must give bit-identical results for the same
 *                 (dt, wall) schedule, with no realtime pump anywhere near it.
 *
 * Every one of those is preserved below with the source's own numbers and the source's
 * own order of operations, and tests/mir.test.mjs is the gate on all six.
 */

import * as M from './mod.js';
import { createRegistry } from './registry.js';

export { M as model };

/** BASINS animTick's dt clamp, kept to the digit: a frame longer than this is a tab
 *  that was away, not a frame.  It bites free sync and envelope time; wall sync
 *  derives its beat from the absolute stamp and is untouched by it (see above). */
export const MAX_WALL_STEP = 0.25;

/** The pause law's two settings.  BASE is what ships: when the transport stops, every
 *  source-driven control returns to the knob the user left it on.  HOLD freezes it
 *  where the modulator had it. */
export const PAUSE_MODES = Object.freeze(['BASE', 'HOLD']);


export const RESUME_LAWS = Object.freeze(['ANCH', 'BPM', 'TRIG', 'FREE']);

/**
 * resumeGrid(sources) → { law, grid, anch, bpm, trig, free }
 *
 * Which law claims the beat, and on what grid, for a list of the model's own source records.
 * PURE — it reads the rack and moves nothing, so a face may call it on a frame and a gate may
 * call it on a fixture.  `grid` is in BEATS and is 0 for every law but BPM.
 */
export function resumeGrid(sources) {
  let anch = 0, bpm = 0, trig = 0, free = 0, grid = 0;
  for (const s of (sources || [])) {
    if (!s || !s.on || s.kind !== 'lfo') continue;
    /* NO NOTE, NOTHING TO CLAIM.  A free-Hz source carries its own phase in both sync modes, so
       TRIG's rewind sticks there with no help from the beat, and a source with neither chip just
       carries on (the model's own last branch rewinds it, which is what FREE has always meant). */
    if (!s.sync) { if (s.trig) trig++; else free++; continue; }
    if (s.anchor) { anch++; continue; }                /* claims CONTINUITY, and outranks the grid */
    /* A SYNCED SOURCE CLAIMS THE GRID WHETHER OR NOT IT WEARS TRIG, and the reason is the same
       arithmetic seen from two sides: under a bar sync mode its phase IS `frac(beats / note)`, so
       the only way to honour TRIG's "start the curve over" is to put the beat on its own note
       boundary — which is precisely the number BPM's "jump to the truncated note" asks for.  A
       TRIG chip that the beat silently overwrote would be a control that changes nothing. */
    if (s.trig) trig++; else bpm++;
    const L = M.beatsPerCycle(s);                      /* the model's own note arithmetic */
    if (L > grid) grid = L;
  }
  const law = anch > 0 ? 'ANCH' : grid > 0 ? 'BPM' : trig > 0 ? 'TRIG' : 'FREE';
  return { law, grid: law === 'BPM' ? grid : 0, anch, bpm, trig, free };
}

/* The LFO free-rate entry box's range, in Hz, and its logarithmic dial.  Taken from
   the source project's own lab host so a rack typed into ours reads the same. */
const ENTRY_LO = 0.05, ENTRY_HI = 20, ENTRY_K = Math.log(ENTRY_HI / ENTRY_LO);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/* ═══════════════════════ EDGE 2 — the target host ══════════════════════════════
 * What the Lab owns and MIR must never learn: which parameters exist, what they are
 * called, what they do, and whether the instrument is in a state where modulating
 * them means anything at all (`available` — BASINS calls its version `flowActive`).
 */

/**
 * createTargetHost({ registry, available, onRefuse })
 *   registry   the instance from edge 1.
 *   available  the capability gate.  Defaults to always-available, which is right for
 *              a headless proof; the rack should wire it to whether the reader is
 *              actually live, exactly as BASINS wires flowActive.
 */
export function createTargetHost(opts) {
  const o = opts || {};
  const registry = o.registry || createRegistry(o.registryOptions);
  const available = typeof o.available === 'function' ? o.available : () => true;
  const installed = new Set();
  const stats = { installs: 0, syncs: 0, uninstalls: 0, refused: 0 };

  /** Re-run the dormancy law: a route whose target is not installed goes DORMANT and
   *  keeps its settings; the moment the target comes back, so does the route.  This
   *  is what makes a preset written against a window that is currently closed — or
   *  against another project's target ids entirely — safe to load. */
  function sync() {
    stats.syncs++;
    M.syncDormant((id) => registry.has(id));
    return M.dormantCount();
  }

  function installOne(id, spec) {
    const d = registry.register(id, spec);
    installed.add(d.id);
    stats.installs++;
    return d;
  }

  return Object.freeze({
    registry,
    available: () => !!available(),

    /** defs: [{ id, ...spec }] — the Card's own descriptors, registered in order. */
    install(defs) {
      const list = Array.isArray(defs) ? defs : [defs];
      const out = [];
      for (const def of list) {
        const { id, ...spec } = def || {};
        out.push(installOne(id, spec));
      }
      sync();
      return out;
    },
    installOne: (id, spec) => { const d = installOne(id, spec); sync(); return d; },
    sync,

    /** Uninstall.  Every target lets go of its modulated value FIRST — abandoning a
     *  parameter with an LFO's number still in it leaves the instrument holding a
     *  value nobody set and nobody can explain. */
    uninstall(ids) {
      const list = ids === undefined ? Array.from(installed) : (Array.isArray(ids) ? ids : [ids]);
      let n = 0;
      for (const id of list) {
        if (!registry.has(id)) { installed.delete(id); continue; }
        registry.restoreBase(id);
        registry.unregister(id);
        installed.delete(id);
        n++;
      }
      stats.uninstalls += n;
      sync();
      return n;
    },

    has: (id) => registry.has(id),
    ids: () => Array.from(installed),

    /* The free-rate entry box's two directions. */
    entryFreqPos: (hz) => clamp01(Math.log(Math.max(Number(hz) || 0, 1e-30) / ENTRY_LO) / ENTRY_K),
    entryFreqRaw: (p) => ENTRY_LO * Math.exp(ENTRY_K * clamp01(Number(p) || 0)),
    entryFreqRange: () => ({ lo: ENTRY_LO, hi: ENTRY_HI, k: ENTRY_K }),

    diagnostics: () => ({
      available: !!available(),
      installed: Array.from(installed),
      dormant: M.dormantCount(),
      routes: M.routeList().length,
      stats: { ...stats },
      values: Object.fromEntries(registry.list().map((id) => [id, registry.readNorm(id)]))
    })
  });
}

/* ═══════════════════════ EDGE 3 — the clock ════════════════════════════════════ */

/**
 * createModClock({ registry, targets, present, pauseMode, maxStep, enabled, presentationActive })
 *
 * It owns modulation time.  Rendering may only SAMPLE it — that is the boundary law,
 * and the reason λWAVES's own lab/clock.js (which owns PHYSICS time, in atomic units,
 * at `rate` a.u. per wall second) must never be handed this job.  They are two
 * different times: pausing the physics must not stop an LFO that is animating the
 * camera, and turning the RATE knob from 4 to 40 a.u./s must not make the LFO ten
 * times faster.  ONE wall clock, TWO logical times, and this is the second one.
 */
export function createModClock(opts) {
  const o = opts || {};
  const registry = o.registry;
  const targets = o.targets || null;
  if (!registry) throw new TypeError('mir/host: the clock needs a registry');
  const present = typeof o.present === 'function' ? o.present : () => {};
  const available = targets ? () => targets.available() : () => true;
  const maxStep = Number.isFinite(o.maxStep) && o.maxStep > 0 ? o.maxStep : MAX_WALL_STEP;

  let pauseMode = o.pauseMode === 'HOLD' ? 'HOLD' : 'BASE';
  let enabled = o.enabled === undefined ? true : !!o.enabled;   /* WAVE 65 · the MOD arm */
  let playing = false;
  let running = false;
  let hidden = false;
  /* An unpatched source has one useful product: the moving preview in its open window.
   * Default true preserves the headless host contract; an app with a closable view owns this edge. */
  let presentationActive = o.presentationActive === undefined ? true : !!o.presentationActive;
  let stepping = 0;                 /* > 0 inside a deterministic step (their videoClock.on) */
  let wall = Number.isFinite(o.wall) ? o.wall : 0;
  let prevWall = null;              /* null: the next dt is NOT a dt (their prevTs = 0) */
  const demands = new Set();        /* things that want the clock without owning a route */
  const stats = { plays: 0, pauses: 0, autoPauses: 0, resumes: 0, frames: 0, steps: 0,
                  seconds: 0, sets: 0, restores: 0, presents: 0, refusedPlays: 0,
                  arms: 0, disarms: 0, quantised: 0, beatsRewound: 0 };
  let lastResume = { law: 'FREE', grid: 0, anch: 0, bpm: 0, trig: 0, free: 0,
                     from: 0, to: 0, moved: 0, mode: 'wall', applied: false };

  const requestPresentation = (reason) => { stats.presents++; present(String(reason || 'modulation')); };
  const anyRouted = () => M.needsClock() || demands.size > 0;


  const anyLive = () => anyRouted() ||
    (presentationActive && typeof M.sourceList === 'function' &&
     M.sourceList().some((s) => s && s.kind !== 'audioout' && s.on !== false));

  /* ── THE PAUSE LAW, four lines, ported from the source's livePos() ─────────────
   * It is four lines and every one of them is load-bearing:
   *   NaN            no live route, or every route on this target bypassed — the
   *                  parameter goes back to the user's knob.
   *   not driven     a hand macro holds its value even when the transport stops: a
   *                  hand does not let go because the clock did.
   *   running        the modulated value, obviously.
   *   stopped        HOLD freezes it, BASE returns it to the knob.  BASE ships.
   * NULL below means "the base" — the registry, not this function, owns that number.
   *
   * WAVE 65 ADDS A LINE ABOVE THE OTHER FOUR AND IT IS THE ARM: with MOD off the modulation is
   * INERT and every routed control sits on the number the hand left it on — including the ones a
   * HAND MACRO holds, which line 2 keeps even when the transport is stopped, and which is
   * therefore the whole reason the arm cannot be spelled `pause()`.
   *   THE ONE EXEMPTION IS `stepping`, AND IT IS THE RECORDER'S.  render-exact.js's
   * `modulation: 'drive'` pin STOPS the clock and then calls `step(1/fps)` per frame, and mir's
   * deterministic door applies as though running (line 3's `stepping > 0`).  A disarm that
   * reached inside `step` would silently render a take with every modulator flat while every
   * witness the renderer checks — `LW.mod.running` false throughout — still passed.  So the arm
   * is read OUTSIDE the deterministic door and nowhere inside it: `step(dt)` does in this build
   * exactly what it did in the last one, armed or not. */
  function livePos(id) {
    const st = registry.state(id);
    const v = M.targetValue(id, st.baseNorm, st.wrap);
    if (v !== v) return null;
    if (!enabled && stepping === 0) return null;
    if (!M.targetDriven(id)) return v;
    if (running || stepping > 0) return v;
    return pauseMode === 'HOLD' ? v : null;
  }

  /** Push every registered target once.  `force` writes even unchanged values — the
   *  transport edges use it, because anything could have moved while we were stopped. */
  function applyAll(force) {
    let moved = 0;
    for (const id of registry.list()) {
      const u = livePos(id);
      if (u === null) {
        /* A forced transport edge must re-assert routed targets, but it must not
         * write every unmodulated control back through its adapter.  Some adapters
         * are presentation bridges rather than plain knobs (STAGE maps its value
         * to the theme's clear colour), so doing that here can overwrite a live
         * theme/surface choice merely by pressing Space. */
        if (registry.isModulated(id)) { registry.restoreBase(id, !!force); stats.restores++; moved++; }
        continue;
      }
      const before = registry.read(id);
      registry.applyModulatedNorm(id, u, force);
      if (!Object.is(before, registry.read(id)) || force) { stats.sets++; moved++; }
    }
    return moved;
  }

  /** The one place `running` is written.  running = playing AND visible AND available
   *  AND something actually needs a clock — the source's own conjunction, unchanged. */
  function recomputeRunning() {
    const want = enabled && playing && !hidden && available() && anyLive();
    if (want === running) return running;
    running = want;
    if (running) {
      prevWall = null;              /* the first dt after a stop is not a dt */
      M.reanchorTransport(wall);    /* the phase continues; it does not jump to the wall */
      applyAll(true);               /* anything could have moved while we were stopped */
      requestPresentation('transport-start');
    } else {
      applyAll(true);               /* the synth rule: letting go returns every control */
      requestPresentation('transport-stop');
    }
    return running;
  }

  /** THE RESUME, applied on the play EDGE and BEFORE `modPlayEdge`, because the beat it may move
   *  is the number `modPlayEdge` re-anchors and the frame after it places every source from.
   *  Returns the plan whether or not it moved anything, so a face can say which law is in force
   *  even when the answer is "nothing to do". */
  function applyResume() {
    const plan = resumeGrid(M.sourceList());
    const mode = M.effectiveSyncMode();
    const from = M.transport.beats;
    const p = { ...plan, from, to: from, moved: 0, mode, applied: false };
    /* FREE sync is deliberately left alone: a non-anchored synced source accumulates its OWN
       phase there, so the beat is not its position and `modPlayEdge` already floors it to 0. */
    if (plan.law === 'BPM' && plan.grid > 0 && mode !== 'free') {
      const q = Math.floor(from / plan.grid) * plan.grid;
      if (from - q > 1e-12) {
        M.setTransport({ beats: q });              /* the model's own road — it re-anchors */
        if (wall > 0) {
          M.reanchorTransport(wall);               /* ...at OUR stamp, so the first frame is not a jump */
          M.advance(0, wall);                      /* dt = 0 is an EDIT: place every synced source on the
                                                      new beat and re-read it, so the resume's first paint
                                                      shows the truncated note rather than the old phase */
        }
        p.to = M.transport.beats; p.moved = from - p.to; p.applied = true;
        stats.quantised++; stats.beatsRewound += p.moved;
      }
    }
    lastResume = p;
    return p;
  }

  /** THE FIRST PAINT MUST NOT BE A LIE (found building the resume law; the transient is older).
   *  `modPlayEdge`'s last branch rewinds every un-anchored source to phase 0 — which under a BAR
   *  sync mode is not where the next frame will put it, because there the phase is DERIVED from
   *  the beat and the frame re-reads it.  Left alone, the resume's own `applyAll(true)` pushes
   *  that transient 0 to every routed control and the frame after it corrects them: one frame of
   *  a number nobody asked for, on every dial the rack holds.  `dt = 0` is the model's own word
   *  for an EDIT — it advances no time and re-reads every source where the beat says it is — so
   *  the placement happens HERE, before anything is applied.  Under FREE there is nothing to
   *  place: the phase is the source's own and `modPlayEdge` has just said what it should be. */
  function placeOnResume() {
    if (!(wall > 0) || M.effectiveSyncMode() === 'free') return false;
    M.advance(0, wall);
    return true;
  }

  function setPlaying(on) {
    const want = !!on;
    if (want && !anyLive()) {
      /* A transport with NO SOURCES is a control that does nothing.  Refuse, and SAY so — the caller
         decides whether that deserves a toast.  (Wave 84: this used to refuse on `anyRouted`, which
         also caught a rack full of devices that simply were not patched to a knob yet.) */
      stats.refusedPlays++;
      return { ok: false, reason: 'nothing-to-run', playing };
    }
    if (want !== playing) {
      playing = want;
      M.setTransport({ playing });
      if (want) { stats.plays++; applyResume(); M.modPlayEdge(); placeOnResume(); } else stats.pauses++;
    }
    recomputeRunning();
    return { ok: true, playing, running, resume: want ? lastResume : null };
  }

  return Object.freeze({
    /* transport */
    play: (at) => { if (Number.isFinite(at)) { wall = at; prevWall = at; } return setPlaying(true); },
    pause: (at) => { if (Number.isFinite(at)) { wall = at; prevWall = at; } return setPlaying(false); },
    toggle: (at) => { if (Number.isFinite(at)) { wall = at; prevWall = at; } return setPlaying(!playing); },
    setPlaying,
    isPlaying: () => playing,
    isRunning: () => running,
    anyRouted,

    /** Unrouted sources run only to animate their editor. Routed sources remain machinery and
     *  continue when the editor closes. This changes presentation demand, never transport state. */
    setPresentationActive(on) {
      const want = !!on;
      if (want === presentationActive) return presentationActive;
      presentationActive = want;
      recomputeRunning();
      return presentationActive;
    },
    isPresentationActive: () => presentationActive,

    /** Visibility.  Hidden stops the clock without touching `playing`, and RELEASES
     *  any hold — the source releases holds on hide because a hold is a gesture and
     *  the gesture is over.  Becoming visible again re-anchors (see recomputeRunning). */
    setHidden(on) {
      const want = !!on;
      if (want === hidden) return running;
      hidden = want;
      if (hidden && M.transport.hold) M.holdEnd();
      const was = running;
      recomputeRunning();
      if (was && !running) stats.autoPauses++;
      if (!was && running) stats.resumes++;
      return running;
    },
    isHidden: () => hidden,

    /* ── the real-time pump ────────────────────────────────────────────────────── */
    /** Advance to an absolute monotonic wall stamp, in SECONDS.  This is the only
     *  entry point the rack's scheduler should use.  Wall time passes whether or not
     *  the clock is running; the MODEL only moves when it is. */
    advanceTo(w) {
      if (!Number.isFinite(w)) return 0;
      const dt = prevWall === null ? 0 : Math.min(Math.max(w - prevWall, 0), maxStep);
      prevWall = w;
      wall = w;
      if (!running) return 0;
      stats.frames++;
      stats.seconds += dt;
      M.advance(dt, w);
      if (applyAll(false)) requestPresentation('modulation-output');
      return dt;
    },

    /* ── deterministic stepping ────────────────────────────────────────────────── */
    /** Advance by EXACTLY dt with a synthesised wall stamp.  No realtime anywhere:
     *  the same sequence of step() calls from the same rack gives bit-identical
     *  results, which is what an export and a proof both need.  It applies as though
     *  running, exactly as the source's video clock does. */
    step(dt) {
      const d = Number.isFinite(dt) && dt > 0 ? dt : 0;
      stepping++;
      try {
        wall += d;
        prevWall = wall;
        stats.steps++;
        stats.seconds += d;
        M.advance(d, wall);
        applyAll(false);
        requestPresentation(running ? 'modulation-output' : 'manual-step');
      } finally { stepping--; }
      return d;
    },

    /** Wall time passes and the model does not: the proof of a real pause. */
    elapseWhilePaused(dt) {
      if (running) throw new Error('mir/host: pause before elapsing paused wall time');
      const d = Number.isFinite(dt) && dt > 0 ? dt : 0;
      wall += d;
      prevWall = wall;
      applyAll(false);
      requestPresentation('paused-wall');
      return wall;
    },

    /* ── transport arithmetic ──────────────────────────────────────────────────── */
    setBpm(bpm) {
      /* setTransport re-anchors before it moves the tempo, so beats, model time and
         source phase are all continuous ACROSS the edit — the tempo changes what
         happens next, never what already happened. */
      M.setTransport({ bpm });
      applyAll(false);
      requestPresentation('transport-bpm');
      return M.transport.bpm;
    },
    setSync(mode) {
      const was = M.syncMode();
      const now = M.setSyncMode(mode);
      /* the mode changed WHEN the mode changed: take the anchor here with a live
         stamp rather than leaving it pending, and only while we are running */
      if (now !== was && running) M.reanchorTransport(wall);
      return now;
    },
    /** The stutter hold.  A hold is a GESTURE, and this is deliberately not wired to
     *  window visibility: closing the modulation window must never release it (their
     *  one YELLOW on the "closing the view affects machinery" coupling — we do not
     *  inherit the bug). */
    hold(note) { const ok = M.holdStart(note); if (ok) { applyAll(true); requestPresentation('hold-start'); } return ok; },
    release() { const ok = M.holdEnd(); if (ok) { applyAll(true); requestPresentation('hold-end'); } return ok; },

    /** Clients that want the clock to run without owning a route of their own. */
    demand(id, on) { if (on) demands.add(String(id)); else demands.delete(String(id)); recomputeRunning(); return demands.size; },

    setPauseMode(m) {
      pauseMode = m === 'HOLD' ? 'HOLD' : 'BASE';
      if (!running) { applyAll(true); requestPresentation('pause-mode'); }
      return pauseMode;
    },
    pauseMode: () => pauseMode,


    setEnabled(on) {
      const want = !!on;
      if (want === enabled) return enabled;
      enabled = want;
      if (want) stats.arms++; else stats.disarms++;
      const was = running;
      recomputeRunning();                       /* pushes applyAll(true) on an EDGE */
      if (was === running) { applyAll(true); requestPresentation(want ? 'mod-arm' : 'mod-disarm'); }
      return enabled;
    },
    isEnabled: () => enabled,
    /** which resume law the rack is standing in, read live and moving nothing (`resumeGrid`), plus
     *  what the last play edge actually did with the beat */
    resumePlan: () => ({ ...resumeGrid(M.sourceList()), mode: M.effectiveSyncMode(), last: { ...lastResume } }),

    /* ── reading it ────────────────────────────────────────────────────────────── */
    wall: () => wall,
    applyAll,
    recomputeRunning,
    reanchor: (w) => M.reanchorTransport(Number.isFinite(w) ? w : wall).anchorAt,
    stats: () => ({ ...stats }),
    snapshot: () => ({
      playing, running, hidden, presentationActive, wall, pauseMode, enabled,
      resume: { ...resumeGrid(M.sourceList()), mode: M.effectiveSyncMode(), last: { ...lastResume } },
      bpm: M.transport.bpm, beats: M.transport.beats, time: M.transport.time,
      sync: M.transport.sync, reanchors: M.transport.reanchors,
      hold: M.transport.hold, holdNote: M.transport.holdNote,
      sources: M.sourceList().map((s) => ({ id: s.id, kind: s.kind, on: !!s.on,
                                            phase: s.phase, cycles: s.cycles | 0, out: s.out })),
      targets: registry.list().map((id) => {
        const st = registry.state(id);
        return { id: st.id, base: st.base, current: st.current,
                 modulated: st.modulated, norm: st.currentNorm, writes: st.writes };
      })
    })
  });
}

/* ═══════════════════════ THE COMPOSITION — all four edges ══════════════════════ */

/**
 * createModHost({ registry, targets, available, present, invalidateGeometry, pauseMode,
 *                 wall, maxStep, roots })
 *
 * Everything defaults, and every default is headless.  Under node this runs with no
 * DOM, no renderer, no GPU and no rack; in the browser the rack wave passes
 *   present: (reason) => schedule(TIER.PRESENT)
 *   invalidateGeometry: (reason) => <the glass geometry invalidator>
 *   available: () => <is the reader live>
 * and changes nothing else.
 */
export function createModHost(opts) {
  const o = opts || {};
  const registry = o.registry || createRegistry({ roots: o.roots, onError: o.onError });

  /* EDGE 4 — presentation and glass geometry.  Default no-ops, counted so a proof can
     say the window ASKED for a paint without any painting machinery existing. */
  const presentation = { requests: 0, lastReason: null, reasons: [] };
  const geometry = { requests: 0, lastReason: null };
  const userPresent = typeof o.present === 'function' ? o.present : null;
  const userGeometry = typeof o.invalidateGeometry === 'function' ? o.invalidateGeometry : null;

  function present(reason) {
    presentation.requests++;
    presentation.lastReason = reason;
    presentation.reasons.push(reason);
    if (presentation.reasons.length > 512) presentation.reasons.shift();
    if (userPresent) userPresent(reason);
  }
  function invalidateGeometry(reason) {
    geometry.requests++;
    geometry.lastReason = reason === undefined ? null : String(reason);
    if (userGeometry) userGeometry(geometry.lastReason);
  }

  const targets = o.targets || createTargetHost({ registry, available: o.available });
  const clock = createModClock({ registry, targets, present,
                                 pauseMode: o.pauseMode, wall: o.wall, maxStep: o.maxStep,
                                 enabled: o.enabled, presentationActive: o.presentationActive });

  return Object.freeze({
    /* the four edges, each reachable on its own */
    registry, targets, clock, present, invalidateGeometry,

    /* the model itself — the same module instance the clock is driving */
    model: M,

    /** Install a set of parameters and let the routes that were waiting for them wake
     *  up.  Returns the descriptors, in order, exactly as a target list wants them. */
    install: (defs) => targets.install(defs),

    /** A window CLOSE must never reach this. */
    dispose() { clock.setPlaying(false); return targets.uninstall(); },

    presentation: () => ({ requests: presentation.requests, lastReason: presentation.lastReason,
                           reasons: presentation.reasons.slice() }),
    geometry: () => ({ ...geometry }),
    diagnostics: () => ({
      targets: targets.diagnostics(),
      clock: clock.stats(),
      transport: clock.snapshot(),
      registry: registry.stats(),
      presentation: { requests: presentation.requests, lastReason: presentation.lastReason },
      geometry: { ...geometry }
    })
  });
}

/* ═══════════════════ the shipped λWAVES parameter catalogue ════════════════════
 * Board #33's actual content: the instrument's controls, with the id, the range and
 * the MAP each one has always had in kit.js but never declared.  It is a function of
 * a port rather than a constant because the registry never touches the instrument
 * directly — the Card owns the get/set adapters, always.
 *
 * `port` is any object with the live values on it, e.g.
 *   { obs, mat, quality, clock, amp(key), setAmp(key, v) }
 * and anything it does not supply is simply not registered.
 */
export function labParameters(port) {
  const p = port || {};
  const defs = [];
  const add = (id, spec) => { defs.push({ id, ...spec }); };
  const field = (obj, key) => ({ get: () => obj[key], set: (v) => { obj[key] = v; } });

  if (p.obs) {
    /* YAW is the free-spinning one: a camera azimuth has no end, and an LFO that
       reaches the end of it and stops is not an orbit. */
    add('observer.yaw', { label: 'YAW', unit: 'rad', map: 'wrap', min: 0, max: 2 * Math.PI, group: 'observer', ...field(p.obs, 'yaw') });
    /* PITCH is signed and detented at the horizon: bipolar, so 0.5 is EXACTLY level. */
    add('observer.pitch', { label: 'PITCH', unit: 'rad', map: 'bipolar', min: -Math.PI / 2, max: Math.PI / 2, group: 'observer', def: 0, ...field(p.obs, 'pitch') });
    /* DISTANCE is a log knob: the interesting half of a zoom is always the near half. */
    add('observer.dist', { label: 'DIST', map: 'log', min: 0.4, max: 40, group: 'observer', ...field(p.obs, 'dist') });
    add('observer.fov', { label: 'FOV', map: 'linear', min: 0.2, max: 1.6, group: 'observer', ...field(p.obs, 'fov') });
  }
  if (p.mat) {
    add('material.exposure', { label: 'EXPOSURE', map: 'log', min: 0.05, max: 20, group: 'material', ...field(p.mat, 'exposure') });
    add('material.softness', { label: 'SOFTNESS', map: 'linear', min: 0, max: 1, group: 'material', ...field(p.mat, 'softness') });
    add('material.iso', { label: 'ISO', map: 'log', min: 1e-4, max: 1, group: 'material', ...field(p.mat, 'iso') });
    add('material.grain', { label: 'GRAIN', map: 'linear', min: 0, max: 1, group: 'material', ...field(p.mat, 'grain') });
    add('material.knee', { label: 'KNEE', map: 'linear', min: 0, max: 1, group: 'material', ...field(p.mat, 'knee') });
    /* HUE SHIFT wraps: the palette wheel is a wheel. */
    add('material.hueshift', { label: 'HUE', unit: '°', map: 'wrap', min: 0, max: 360, group: 'material', ...field(p.mat, 'hueShift') });
  }
  if (p.quality) {
    /* RESOLUTION is the integer map, on the rungs the field actually builds. */
    add('field.resolution', { label: 'RES', map: 'integer', min: 32, max: 192, step: 32, group: 'field', ...field(p.quality, 'res') });
    add('field.steps', { label: 'STEPS', map: 'integer', min: 32, max: 512, step: 1, group: 'field', ...field(p.quality, 'steps') });
  }
  if (p.clock) {
    /* The PHYSICS rate — a modulation target like any other, and the clearest reason
       the modulation clock cannot be the physics clock: this is a thing an LFO may
       modulate, so it cannot also be the thing that tells the LFO how fast to run. */
    add('transport.rate', { label: 'RATE', unit: ' a.u./s', map: 'log', min: 0.01, max: 100, group: 'transport', get: () => p.clock.rate, set: (v) => p.clock.setRate(v) });
    add('transport.window', { label: 'WINDOW', map: 'log', min: 0.1, max: 1000, group: 'transport', ...field(p.clock, 'window') });
  }
  /* The register's own address space.  `modes` is a list of stable ids "h:n:l:m"
     (lab/hydrogen.js), and each one contributes an AMPLITUDE and a PHASE — the phase
     wraps, because a phase is an angle and an LFO that reaches the end of one and
     stops is not a rotation. */
  if (Array.isArray(p.modes) && typeof p.amp === 'function' && typeof p.setAmp === 'function') {
    const hasPhase = typeof p.phase === 'function' && typeof p.setPhase === 'function';
    for (const key of p.modes) {
      add('state.mode.' + key + '.amp', { label: key + ' AMP', map: 'linear', min: 0, max: 1, group: 'state', get: () => p.amp(key), set: (v) => p.setAmp(key, v) });
      if (hasPhase) add('state.mode.' + key + '.phase', { label: key + ' PHASE', unit: 'rad', map: 'wrap', min: 0, max: 2 * Math.PI, group: 'state', get: () => p.phase(key), set: (v) => p.setPhase(key, v) });
    }
  }
  return defs;
}

/* ═══════════════ THE PRESET FOLDER — and the three that could never work ═══════
 *
 * ── WHAT WAS MEASURED ─────────────────────────────────────────────────────────────
 * mod.js ships three FACTORY_PRESETS — BREATHE, PULSE, DRIFT — in a folder called
 * MANDELBROT, and ALL THREE LOAD 100 % DORMANT HERE.  Between them they carry six
 * routes, to `freq` · `phase` · `bright` · `pal.e1.phase` · `pal.e2.phase`, and not one
 * of those five ids is a parameter λWAVES registers; four of them are not even legal
 * under registry.js's id grammar (no dotted root, or the root `pal`).  So they take the
 * dormancy law's safe path — kept, settings intact, waiting for targets that will never
 * arrive — and a user who opened the preset menu today would find three patches that do
 * NOTHING.  Three dead patches are worse than an empty menu: the first is a broken
 * instrument, the second is an instrument with nothing in it yet.
 *
 * ── THE FILTER, AND WHY IT IS HERE AND NOT THERE ─────────────────────────────────
 * mod.js is VENDORED and maintained by diff (§16 of tests/mir.test.mjs undoes six marked
 * edits and demands byte-identity with the source), so deleting their folder there would
 * cost a seventh edit for something that is not a defect in their file — it is a defect
 * in the JOIN, and this file IS the join.  So the filter is one predicate:
 *
 *      labPresetList() = OUR folder ++ M.presetList().filter((p) => !p.factory)
 *
 * `factory: 1` is the marker presetPublic() already stamps on every vendored preset and
 * on nothing else, so the filter names exactly the foreign folder and cannot catch a
 * user's own patch.  They stay REACHABLE: labPresetGet() returns one marked `foreign: 1`,
 * foreignPresets() lists all three with the targets they wanted, and labPresetApply()
 * loads one for a caller that passes `allowForeign` and says so out loud.  Nothing is
 * deleted; it is simply not OFFERED.
 *
 * ── THE HOUSE RULE FOR THIS FOLDER: THE BAR IS THE LAP ───────────────────────────
 * Every preset here that TURNS turns once per bar, on the BPM grid, in WALL sync — and
 * that is not decoration, it is the only phase law in this model that is a pure function
 * of elapsed time.  advance() DERIVES a wall-synced beat from the absolute stamp
 * (`beats = anchorBeats + (bpm/60)·(w − anchorAt)`) where free-run ACCUMULATES
 * `phase += hz·dt` frame by frame.  Derived phase is what a recording needs, and it is
 * what makes the second half of the rule work: point `barTempo()` at the state's own
 * recurrence and ONE BAR BECOMES ONE RECURRENCE, so the camera's lap, the colour wheel's
 * turn and the density's return are the same event.  The transport carries no tempo into
 * a preset (mod.js deletes it on save, on purpose), so the tempo is the user's and this
 * folder is written to make that one dial worth setting.
 */

/** The folder these are offered in.  Not `PRESET_FOLDER_FACTORY` ('MANDELBROT'), which
 *  mod.js reserves for the three we are filtering out, and not `PRESET_FOLDER_DEFAULT`,
 *  which is the user's own. */
export const LAB_PRESET_FOLDER = 'λWAVES';

/**
 * THE THREE.  Each is model DATA — the same `rack` shape a save writes — so they carry
 * no code, migrate with everything else, and can be read by anyone who can read a patch.
 *
 * Every route below is an OFFSET from wherever the user left the knob (routeInfluence is
 * `lerped − r.min`, and the registry adds it in NORMALISED space), so the depths are
 * chosen to be honest at the shipped bases and to reach without clipping.  None of them
 * touches the register: modulation is an observer instrument, ψ is the hand's.
 */
export const LAB_PRESETS = [
  {
    id: 'lw.oneturn', lab: 1, name: 'ONE TURN',
    hint: 'One camera orbit per bar, with a vertical sweep.',
    /* ── WHY IT EXISTS ────────────────────────────────────────────────────────────
     * A still camera hides exactly the half of a hydrogenic state that the quantum
     * numbers l and m live in.  |ψ_{nlm}|² has ANGULAR nodes — a 2p_z is a dumbbell on
     * the z axis, a 2p_x is the same dumbbell lying down, and an m = ±1 combination is a
     * torus — and from one fixed azimuth at one fixed elevation those three can look
     * identical.  Turning all the way round settles it; rising and falling through the
     * equator settles the rest, because a torus and a dumbbell differ in exactly the
     * direction a fixed equatorial camera cannot see.
     *
     * ── AND WHY IT IS THE ONE FOR THE RECORDER ───────────────────────────────────
     * render-exact.js's `modulation: 'drive'` steps this clock by EXACTLY 1/fps per
     * frame through mir's own deterministic door, so an N-frame take advances modulation
     * time by exactly N/fps seconds.  The camera therefore returns to where it started
     * whenever the take's wall length is a whole number of BARS — and capture.js already
     * guarantees the other seam, because ρ(t₀ + T) = ρ(t₀) is a theorem.  Set the tempo
     * with barTempo({ seconds }) for the length you are about to record (or with the
     * state's T and the clock's rate, which is the same thing said in physics), and BOTH
     * seams close in the same frame.
     *
     * Three deliberate absences, each of which would have broken that:
     *   · SMOOTH is 0.  A one-pole filter is a state accumulator, not a function of
     *     phase; its transient decays but never lands, and on a SAW driving a WRAP
     *     target it does something worse — at the seam it slews BACKWARDS through half
     *     the circle chasing 1 → 0.
     *   · S&H and DRIFT are absent.  Both hash `cycles`, which counts up for ever, so
     *     lap two is not lap one.
     *   · STEPS is 0.  A ladder would close, but a stepped camera is a stuttering
     *     camera, and this one is meant to be watched.
     * (In FREE camera mode the yaw setter composes quaternion turns rather than writing
     * the angle, so the POSE returns to within float there; the modulator's own output
     * returns exactly in both modes.) */
    rack: {
      seq: { macro: 2, source: 2, route: 2 },
      sources: [
        /* SAW↑ on a circle is seamless BY CONSTRUCTION: position 1 IS position 0, so a
           full turn has no jump in it to hide.  One whole note = 4 beats = one bar. */
        { id: 's1', kind: 'lfo', on: 1, label: 'LAP', shapeMode: 'wave', wave: 'rotate',
          sync: 1, mult: 0, triplet: 0, dotted: 0,
          ratePos: 0.39, phaseOff: 0, smooth: 0, steps: 0,
          trig: 0, anchor: 1, invert: 0, minimized: 0 },
        /* the rise: one raised cosine per lap, on the SAME bar, so the two close together */
        { id: 's2', kind: 'lfo', on: 1, label: 'RISE', shapeMode: 'wave', wave: 'sine',
          sync: 1, mult: 0, triplet: 0, dotted: 0,
          ratePos: 0.39, phaseOff: 0, smooth: 0, steps: 0,
          trig: 0, anchor: 1, invert: 0, minimized: 0 }
      ],
      macros: [
        { id: 'm1', name: 'LAP', named: 1, value: 0, sourceId: 's1' },
        { id: 'm2', name: 'RISE', named: 1, value: 0, sourceId: 's2' }
      ],
      routes: [
        /* the whole circle: 0 … 1 of a wrap map over [0, 2π) */
        { id: 'r1', macroId: 'm1', targetId: 'observer.yaw', min: 0, max: 1 },
        /* BIPOLAR, so the user's own elevation is the CENTRE of the swing and not its
           floor: ±0.20 of the bipolar pitch map is about −13° … +57° from the shipped
           0.38 rad, which crosses the equator — the only place a torus stops looking
           like a dumbbell. */
        { id: 'r2', macroId: 'm2', targetId: 'observer.pitch', min: 0.30, max: 0.70, bi: 1 }
      ]
    }
  },

  {
    id: 'lw.peel', lab: 1, name: 'PEEL',
    hint: 'Step through twelve density levels to reveal shells.',
    /* ── WHY IT EXISTS ────────────────────────────────────────────────────────────
     * A volume render shows one level of the density at a time and the viewer has no way
     * to know which.  |ψ_{nl}|² has n − l − 1 RADIAL nodes, and they are invisible until
     * something walks the level through them: raise the threshold and the outer shell
     * thins, breaks and vanishes, leaving the next one behind it.  Sweeping the level is
     * the only way this instrument can show that structure without touching ψ.
     *
     * TWO ROUTES, ONE IDEA, BECAUSE THE STAGE HAS TWO TRANSFER LAWS and the draw style
     * chooses between them.  In CLOUD, PHASE, RE and IM the opacity is w = ρ^γ and
     * SOFTNESS is γ: raising it starves the tail and keeps the peaks.  In SOLID and
     * SIGNED the opacity is a band about ρ ≈ ISO and softness is not read at all: raising
     * ISO walks that band inward.  Routing both together means the preset means the same
     * thing in every style the instrument has, including the shipped one (CLOUD).
     *
     * THE LADDER IS THE POINT.  `steps: 12` quantises the macro to twelve rungs, so this
     * is not a morph — it is twelve NAMED contours, each held about a second and a half,
     * which is long enough to look at one and see the next arrive.  A continuous sweep
     * shows the same levels and lets the eye read none of them.  TRI climbs and comes
     * back down through the same twelve, so the sequence is reversible by inspection.
     *
     * It free-runs at 1/32 Hz rather than sitting on the bar, because the bar is at most
     * 12 s at BPM_MIN and twelve rungs inside that is a strobe.  32.000 s is also a round
     * number of loop seconds, so it can still be recorded — it is simply not what it is
     * for. */
    rack: {
      seq: { macro: 2, source: 1, route: 2 },
      sources: [
        { id: 's1', kind: 'lfo', on: 1, label: 'LEVEL', shapeMode: 'wave', wave: 'tri',
          sync: 0, mult: M.LFO_MULT_DEFAULT, triplet: 0, dotted: 0,
          ratePos: M.freePos(1 / 32), phaseOff: 0, smooth: 0, steps: 12,
          trig: 0, anchor: 0, invert: 0, minimized: 0 }
      ],
      macros: [
        { id: 'm1', name: 'LEVEL', named: 1, value: 0, sourceId: 's1' },
        { id: 'm2', name: '', named: 0, value: 0, sourceId: null }
      ],
      routes: [
        /* ISO is a LOG knob over [0.002, 0.9], so a normalised span is a fixed RATIO:
           0.35 of 2.65 decades is a factor of 8.5 in the level, which from the shipped
           0.06 climbs to about 0.51 without reaching the top of the dial. */
        { id: 'r1', macroId: 'm1', targetId: 'material.iso', min: 0, max: 0.35 },
        /* SOFTNESS is linear over [0.3, 2.2]: +0.50 is γ 0.7 → 1.65, the same peel
           expressed in the exponent the cloud styles actually read. */
        { id: 'r2', macroId: 'm1', targetId: 'material.softness', min: 0, max: 0.50 }
      ]
    }
  },

  {
    id: 'lw.globalphase', lab: 1, name: 'GLOBAL PHASE',
    hint: 'Rotate phase colour once per bar without moving the state.',
    /* ── WHY IT EXISTS ────────────────────────────────────────────────────────────
     * In the PHASE view (the shipped one) the hue of a voxel IS arg ψ there: field.js
     * paints `h = atan2(Im, Re)/2π + ½ + hueShift`.  So the HUE knob is not a colour
     * preference in that view — it is a rigid rotation of the wavefunction's phase, and
     * turning it through one whole revolution multiplies ψ by e^{iθ} for θ running the
     * full 0 → 2π.  What the viewer sees is the entire picture change colour and NOTHING
     * ELSE HAPPEN: no lobe moves, no node moves, no density changes anywhere.  That is
     * the unobservability of the global phase, demonstrated rather than asserted, and it
     * is the fact behind capture.js's whole T_ψ argument — ψ(t + T_ρ) = e^{iφ}ψ(t), so
     * the density has come home while the colour has not, and a loop in the phase view
     * must run to T_ψ instead.  Run this once and that paragraph stops being a paragraph.
     *
     * ONE SOURCE, ONE ROUTE, ON PURPOSE.  The claim is "nothing else moves", and a second
     * route would be the preset arguing with itself.
     *
     * SAW↑ on the wrap map again, smooth 0 for the same seam reason as ONE TURN, on the
     * bar so it composes with it: load both, set the tempo once, and the camera's lap and
     * the phase's turn are the same lap.
     *
     * WHAT IT DOES NOT DO, said here so nobody has to find out: in the DENSITY and DIFF
     * views the colour ramp does not read hueShift at all and the stage will not move —
     * only the interface's accent wheel follows, at 10 Hz. */
    rack: {
      seq: { macro: 2, source: 1, route: 1 },
      sources: [
        { id: 's1', kind: 'lfo', on: 1, label: 'TURN', shapeMode: 'wave', wave: 'rotate',
          sync: 1, mult: 0, triplet: 0, dotted: 0,
          ratePos: 0.39, phaseOff: 0, smooth: 0, steps: 0,
          trig: 0, anchor: 1, invert: 0, minimized: 0 }
      ],
      macros: [
        { id: 'm1', name: 'TURN', named: 1, value: 0, sourceId: 's1' },
        { id: 'm2', name: '', named: 0, value: 0, sourceId: null }
      ],
      routes: [
        { id: 'r1', macroId: 'm1', targetId: 'material.hue', min: 0, max: 1 }
      ]
    }
  }
];

/* ── reading a preset without loading it ──────────────────────────────────────── */

/** The distinct target ids a preset's rack routes to, in route order.  This is the one
 *  question that would have caught the foreign three before they shipped, and it is a
 *  pure function of the DATA — so a menu can grey a patch out, and a gate can refuse
 *  one, without going anywhere near the live model. */
export function presetRouteTargets(p) {
  const rack = p && p.rack ? p.rack : null;
  const list = rack && Array.isArray(rack.routes) ? rack.routes : [];
  const out = [];
  for (const r of list) {
    const id = r && r.targetId !== undefined && r.targetId !== null ? String(r.targetId) : '';
    if (id && out.indexOf(id) < 0) out.push(id);
  }
  return out;
}

/** The public view of one of OURS, in the same shape presetPublic() gives the others so
 *  a face can render one list.  `factory: 1` because this folder is undeletable in
 *  exactly the way theirs is; `lab: 1` because only this one is ours. */
function labPublic(p) {
  return { id: p.id, name: p.name, at: 0, factory: 1, lab: 1,
           folder: LAB_PRESET_FOLDER, modV: M.MOD_STATE_V,
           stale: false, migratedFrom: null, hint: p.hint || null,
           targets: presetRouteTargets(p) };
}

/** The three we are NOT offering, named, with the targets each one wanted — so the
 *  filter can be SHOWN rather than merely done, and so a later wave that wires an
 *  "everything, including the foreign folder" affordance has the list already. */
export function foreignPresets() {
  return M.FACTORY_PRESETS.map((f) => ({
    id: f.id, name: f.name, folder: M.PRESET_FOLDER_FACTORY, foreign: 1,
    targets: presetRouteTargets(f), hint: f.hint || null
  }));
}

/**
 * EVERY PRESET THIS LAB OFFERS: our folder first, then the user's own.  The vendored
 * `factory: 1` folder is filtered out — see the header for why the seam and not the
 * vendored file is where that belongs.
 */
export function labPresetList() {
  return LAB_PRESETS.map(labPublic).concat(M.presetList().filter((p) => !p.factory));
}

/** The folders, ours in the factory slot theirs used to hold. */
export function labPresetFolders() {
  return [{ name: LAB_PRESET_FOLDER, factory: 1, lab: 1, count: LAB_PRESETS.length }]
    .concat(M.presetFolders().filter((f) => !f.factory));
}

/** One preset by id, rack and all.  A foreign one IS returned — marked, so a caller
 *  cannot load it by accident — because filtering a menu is not the same as sealing a
 *  door, and somebody debugging the port will want to read theirs. */
export function labPresetGet(id) {
  const k = String(id);
  const mine = LAB_PRESETS.find((x) => x.id === k);
  if (mine) return { ...labPublic(mine), rack: mine.rack };
  const p = M.presetGet(k);
  if (!p) return null;
  return p.factory ? { ...p, foreign: 1, targets: presetRouteTargets(p) } : p;
}

/**
 * labPresetApply(id, { host, targets, allowForeign })
 *
 * Loads a patch and leaves the transport alone (a preset never carries a tempo).  Hand
 * it `host` and it does the whole dance the rack already does by hand for a project
 * restore — let go of every modulated target, load, re-run the dormancy law, then push
 * once with force so nothing is left holding a number from the patch that just left.
 * A vendored factory preset is REFUSED by name unless `allowForeign` is passed, and the
 * refusal says which targets it wanted, so the message can be true.
 */
export function labPresetApply(id, opts) {
  const o = opts || {};
  const host = o.host || null;
  const targets = o.targets || (host ? host.targets : null);
  const k = String(id);
  const counts = () => ({ macros: M.macroList().length, sources: M.sourceList().length,
                          routes: M.routeList().length });

  const mine = LAB_PRESETS.find((x) => x.id === k);
  if (mine) {
    let rack = null;
    try { rack = JSON.parse(JSON.stringify(mine.rack)); }
    catch (_) { return { ok: false, error: 'rack', id: k, name: mine.name }; }
    if (host) host.registry.restoreAll();
    M.deserializeRack(rack);
    if (targets) targets.sync();
    if (host) { host.clock.recomputeRunning(); host.clock.applyAll(true); }
    return { ok: true, id: k, name: mine.name, lab: 1, factory: true, migratedFrom: null,
             counts: counts(), dormant: M.dormantCount() };
  }

  const p = M.presetGet(k);
  if (!p) return { ok: false, error: 'missing', id: k };
  if (p.factory && !o.allowForeign) {
    return { ok: false, error: 'foreign', id: k, name: p.name, folder: p.folder,
             targets: presetRouteTargets(p),
             message: '"' + p.name + '" is one of the vendored model\'s own presets: every ' +
                      'route in it goes to a target this instrument does not register (' +
                      presetRouteTargets(p).join(' · ') + '), so it would load completely ' +
                      'dormant. Pass allowForeign to load it anyway.' };
  }
  if (host) host.registry.restoreAll();
  const r = M.presetApply(k);
  if (r.ok) {
    if (targets) targets.sync();
    if (host) { host.clock.recomputeRunning(); host.clock.applyAll(true); }
  }
  return r.ok ? { ...r, dormant: M.dormantCount() } : r;
}

/* ═════════════ THE BAR AND THE STATE'S OWN BEAT — barTempo() ═══════════════════
 *
 * The one number that makes this folder's house rule mean something.  λWAVES knows the
 * EXACT recurrence time of the density (period.js: T = 2π/gcd{|ΔE|}, a theorem while the
 * energies are commensurate) and it knows the physics clock's rate in a.u. per wall
 * second, so it knows exactly how many WALL SECONDS one recurrence lasts.  This turns
 * that into the modulation transport's tempo, so that one bar IS one recurrence — and
 * then every bar-locked preset in this folder is locked to the state instead of to a
 * number somebody typed.
 *
 *     barTempo({ T, rate })        one bar = one recurrence of the density
 *     barTempo({ seconds })        one bar = the wall length of the take about to be cut
 *
 * The second door is the recorder's: capture.js plans N frames at fps and the take's wall
 * length is exactly N/fps, and render-exact.js's `modulation: 'drive'` steps this clock
 * by exactly 1/fps per frame — so a bar that divides N/fps is a modulation seam that
 * closes in the same frame the physics seam does.
 *
 * IT NEVER SILENTLY LIES.  The transport's tempo is bounded ([20, 300] BPM), so a
 * recurrence longer than 12 s or shorter than 0.8 s cannot be one bar at all.  Rather
 * than clamp and pretend, it clamps and SAYS SO, and hands back the lap count that does
 * fit: two laps per recurrence, or seventeen, is still exact commensurability and is
 * still a closing seam — it is only the word "one" that had to go.
 */
export function barTempo(opts) {
  const o = opts || {};
  const beats = Number.isFinite(o.beats) && o.beats > 0 ? o.beats : M.BEATS_PER_WHOLE;
  const laps = Number.isFinite(o.laps) && o.laps >= 1 ? Math.round(o.laps) : 1;
  const seconds = Number.isFinite(o.seconds) && o.seconds > 0 ? o.seconds
    : (Number.isFinite(o.T) && o.T > 0 && Number.isFinite(o.rate) && o.rate > 0
        ? o.T / o.rate : NaN);
  if (!(seconds > 0)) {
    return { ok: false, reason: 'barTempo needs `seconds`, or a period T with the clock rate',
             bpm: M.transport.bpm, beats, laps };
  }
  const wanted = 60 * beats * laps / seconds;
  const bpm = Math.min(M.BPM_MAX, Math.max(M.BPM_MIN, wanted));
  const clamped = !(Math.abs(bpm - wanted) < 1e-12);
  /* the lap count that DOES fit: more laps when the bar would be too slow, fewer when it
     would be too fast — and never fewer than one */
  const lapsThatFit = !clamped ? laps
    : (wanted < M.BPM_MIN ? Math.ceil(M.BPM_MIN * seconds / (60 * beats))
                          : Math.max(1, Math.floor(M.BPM_MAX * seconds / (60 * beats))));
  /* what to set for `lapsThatFit`, computed here so nobody re-derives it — and a flat
     statement of whether ANY lap count reaches, because a bar shorter than 0.8 s does
     not exist at any integer lap and pretending otherwise is the one thing this must
     not do */
  const rawThatFits = 60 * beats * lapsThatFit / seconds;
  const fitsAtLaps = rawThatFits >= M.BPM_MIN - 1e-12 && rawThatFits <= M.BPM_MAX + 1e-12;
  return { ok: true, bpm, wanted, beats, laps, seconds,
           barSeconds: 60 * beats / bpm, clamped, lapsThatFit, fitsAtLaps,
           bpmThatFits: Math.min(M.BPM_MAX, Math.max(M.BPM_MIN, rawThatFits)) };
}
