/* lab/shell/modulation.js — THE MODULATION SEAM (0.5.2 R2d; moved verbatim out of lab/rack.js boot()): the ONE `defs` route table and mod.install, the pill's
 * seat and dodge, and the kit's modulation window (app.state.modHost / modView, read live by every module).  createModSeam(app) runs where the seam stood. */
import { TIER } from '../rack.js'; import { knob } from '../mir/kit.js'; import { CAM, clampShift } from '../camera-law.js'; import { createModulation } from '../mir/modulation/window.js'; import { registerWindow } from '../mir/window/window.js'; import { BASIS } from '../hydrogen.js'; import { dockSpan } from '../mir-gui.js'; import { OMORPH } from '../orbitalsview.js'; import { MOL_LIMITS } from '../field.js';
export function createModSeam(app) {
  const { ui, hNote, clock, obs, mat, settingsStore, reg, rates } = app, { schedule, page } = app.loop, { orbitBy, cameraPort } = app.host, { readSettings, saveSettings } = app.sh,
    { mod, modHand, setKnob, ROT_LIMIT, rotRate, setRotationRate, occlusion, applyAccent, api } = app.ctl;
  /* ── WAVE 64 · THERE IS NO MODULATION CARD ANY MORE ──────────────────────────────────────────
   * The modulation window is a PORTED ARTIFACT (docs/ui/STYLE-LOCK.md, THE PORTED-WINDOW
   * EXCEPTION): `lab/mir/modulation/modwindow/`, BASINS' own window, moved here whole.  It is 716 × 466 at
   * one card and it carries its own chrome, its own chip rail and its own drag grip — a 300 px
   * rack slot cannot hold it and wrapping it in `device()` would put the house's frame around a
   * window whose frame is the thing that travelled.  So it is built into the FLOAT LAYER by
   * the kit's controller (`lab/mir/modulation/window.js`, 0.5.0 C4; `lab/modwindow.js`, its copy, is deleted) and shown by the transport pill's ⤢, exactly as wave 55 already opened it
   * (`layout.modulation` below is unchanged in its verbs and rewritten in its mechanism).
   * `lab/modview.js` — 1705 lines, the window this replaces — is deleted with it. */
  {
    let accWall = 0;
    /* the interface's ACCENT wheel follows a modulated HUE at CHROME cadence, not at the field's:
       applyAccent() repaints three copies of the logo and four custom properties, and none of that
       is worth sixty times a second — the FIELD, which is what HUE is actually for, follows every frame */
    const hueAccent = () => { const t = performance.now(); if (t - accWall < 100) return; accWall = t; applyAccent(); };
    /* A WRAPPED TARGET IS AN ANGLE, and the registry stores the canonical representative of one.  The
       instrument does NOT: obs.yaw accumulates through every turn a drag makes and the camera law
       integrates it, so writing the canonical form back would silently subtract 2π from a running fling.
       So the two wrapped setters write only when the ANGLE differs — which is the only difference that
       means anything — and an un-modulated yaw is never quietly re-based by the sync above. */
    const sameCycle = (a, b, L) => Math.abs(((a - b) % L + L + L / 2) % L - L / 2) < 1e-9;
    const camOut = (id, v) => { setKnob(app.state.camKnobs[id], v); cameraPort.notify(); schedule(TIER.PRESENT); };   // C1 (A8's open item 3): a route's write is a notice
    const defs = [
      /* 0.5.0 C1 · the six saved observer.* routes keep their ids, maps and ranges, and stay HERE (the registry's road writes the pose
         raw; the panel registers none of them).  Their dials are the CAMERA panel's (camKnobs: the sphere's two arcs, ZOOM, FOV, the
         pad's X and Y), and a modulator's write is a notice to the port's subscribers (camOut), so the panel follows a route. */
      { id: 'observer.yaw', label: 'YAW', unit: ' rad', map: 'wrap', min: 0, max: 2 * Math.PI, group: 'observer', knob: () => app.state.camKnobs['observer.yaw'],
        hint: 'the camera azimuth — free-spinning, because an orbit that reaches the end of the dial and stops is not an orbit',
        get: () => obs.yaw, set: (v) => { if (sameCycle(v, obs.yaw, 2 * Math.PI)) return; if (obs.mode === 'free') orbitBy(v - obs.yaw, 0); else obs.yaw = v; camOut('observer.yaw', obs.yaw); } },
      { id: 'observer.pitch', label: 'PITCH', unit: ' rad', map: 'bipolar', min: -CAM.PITCH, max: CAM.PITCH, def: 0, group: 'observer', knob: () => app.state.camKnobs['observer.pitch'],
        hint: 'Pitch balance; 50% is level',
        get: () => obs.pitch, set: (v) => { const w = Math.max(-CAM.PITCH, Math.min(CAM.PITCH, v)); if (w === obs.pitch) return; if (obs.mode === 'free') orbitBy(0, w - obs.pitch); else obs.pitch = w; camOut('observer.pitch', obs.pitch); } },
      { id: 'observer.dist', label: 'ZOOM', map: 'log', min: CAM.DIST[0], max: CAM.DIST[1], group: 'observer', knob: () => app.state.camKnobs['observer.dist'],
        hint: 'the ZOOM dial itself — log, because the interesting half of a zoom is always the near half',
        get: () => obs.dist, set: (v) => { obs.dist = Math.max(CAM.DIST[0], Math.min(CAM.DIST[1], v)); camOut('observer.dist', obs.dist); } },
      { id: 'observer.fov', label: 'FOV', map: 'linear', min: CAM.FOV[0], max: CAM.FOV[1], group: 'observer', knob: () => app.state.camKnobs['observer.fov'],
        get: () => obs.fov, set: (v) => { obs.fov = Math.max(CAM.FOV[0], Math.min(CAM.FOV[1], v)); camOut('observer.fov', obs.fov); } },
      { id: 'observer.panx', label: 'PAN X', map: 'bipolar', min: -CAM.SHIFT, max: CAM.SHIFT, def: 0, group: 'observer', knob: () => app.state.camKnobs['observer.panx'], hint: 'the lens shift across: where the pivot sits on the frame',   // 0.4.0 S2
        get: () => obs.shift[0], set: (v) => { obs.shift = [cameraPort.get('lock') ? 0 : clampShift([v, 0])[0], obs.shift[1]]; camOut('observer.panx', obs.shift[0]); } },   // 0.5.3 M6: a route under the LOCK writes the centre
      { id: 'observer.pany', label: 'PAN Y', map: 'bipolar', min: -CAM.SHIFT, max: CAM.SHIFT, def: 0, group: 'observer', knob: () => app.state.camKnobs['observer.pany'], hint: 'the lens shift up and down: where the pivot sits on the frame',
        get: () => obs.shift[1], set: (v) => { obs.shift = [obs.shift[0], cameraPort.get('lock') ? 0 : clampShift([0, v])[1]]; camOut('observer.pany', obs.shift[1]); } },
      { id: 'material.stage', label: 'STAGE', map: 'linear', min: 0, max: 1, group: 'material', knob: () => ui.stageK, get: () => ui.stageK.get(), set: (v) => app.hooks.setStage(v) },
      { id: 'material.gamma', label: 'GAMMA', map: 'linear', min: 0.5, max: 2.4, group: 'material', knob: () => ui.gammaK, get: () => mat.gamma, set: (v) => { mat.gamma = v; setKnob(ui.gammaK, v); schedule(TIER.PRESENT); } },
      { id: 'material.exposure', label: 'EXPOSURE', map: 'log', min: 0.08, max: 12, group: 'material', knob: () => ui.expK,
        get: () => mat.exposure, set: (v) => { mat.exposure = v; setKnob(ui.expK, v); schedule(TIER.PRESENT); } },
      { id: 'material.softness', label: 'SOFT', map: 'linear', min: 0.3, max: 2.2, group: 'material', knob: () => ui.softK,
        get: () => mat.softness, set: (v) => { mat.softness = v; setKnob(ui.softK, v); schedule(TIER.PRESENT); } },
      { id: 'material.hue', label: 'HUE', map: 'wrap', min: 0, max: 1, group: 'material', knob: () => ui.hueK,
        hint: 'Turn the palette and interface accents',
        get: () => mat.hueShift, set: (v) => { if (sameCycle(v, mat.hueShift, 1)) return; mat.hueShift = v; setKnob(ui.hueK, v); hueAccent(); schedule(TIER.PRESENT); } },
      { id: 'material.iso', label: 'ISO', map: 'log', min: 0.002, max: 0.9, group: 'material', knob: () => ui.isoK,
        get: () => mat.iso, set: (v) => { mat.iso = v; setKnob(ui.isoK, v); schedule(TIER.PRESENT); } },
      { id: 'material.grain', label: 'GRAIN', map: 'log', min: 0.02, max: 1, group: 'material', knob: () => ui.grainK,
        get: () => mat.grain, set: (v) => { mat.grain = v; setKnob(ui.grainK, v); schedule(TIER.PRESENT); } },
      { id: 'material.knee', label: 'KNEE', map: 'log', min: 0.02, max: 8, group: 'material', knob: () => ui.kneeK,
        get: () => mat.knee, set: (v) => { mat.knee = v; setKnob(ui.kneeK, v); schedule(TIER.PRESENT); } },
      /* THE PHYSICS RATE — the clearest reason the modulation clock cannot BE the physics clock: this
         is a thing an LFO may modulate, so it cannot also be the thing that says how fast the LFO runs.
         Its setter schedules NOTHING: while it matters the loop is already running an EVOLVE of its own. */
      { id: 'transport.rate', label: 'RATE', unit: ' a.u./s', map: 'log', min: 0.1, max: 3000, group: 'transport', knob: () => ui.rateKnob,
        hint: 'Set the physics clock rate',
        get: () => clock.rate, set: (v) => { clock.setRate(v); setKnob(ui.rateKnob, v); } },

      { id: 'material.slice.pos', label: 'CLIP POS', map: 'bipolar', min: -1, max: 1, def: 0, group: 'material', knob: () => ui.slicePosK,
        hint: 'Set the clip or slab position',
        get: () => mat.slice.pos, set: (v) => { mat.slice.pos = v; setKnob(ui.slicePosK, v); schedule(TIER.PRESENT); } },
      { id: 'material.slice.thick', label: 'CLIP THICK', map: 'log', min: 0.01, max: 0.4, group: 'material', knob: () => ui.sliceThickK,
        hint: 'Set slab depth',
        get: () => mat.slice.thick, set: (v) => { mat.slice.thick = v; setKnob(ui.sliceThickK, v); schedule(TIER.PRESENT); } },

      /* Ω RABI is the cleanest of the five and the one worth having most: it is the RATE of the A→B→A
         mix, so a macro on it makes the transition breathe.  `reg.transition.omega` is a plain property
         write — `setTransition` is the only thing in state.js that bumps `version` — so no undo entry
         and no rebuild.  The knob's own `onInput` schedules nothing (while a transition plays the loop
         is already evolving); the SETTER must, or a PAUSED instrument would not repaint under a macro. */
      /* ══ THE ROTATION AND DEFLECTION RATES — THE HOUSE RULE, KEPT BY CHANGING WHAT IS REGISTERED ══
       * The rule above this array refused ROTATE z, STARK K_z and DEFECT L² for two reasons, both
       * true: their setters bump reg.version (the undo trigger and twelve readers' cache key), and
       * they hold no value to be a target OF.  Registering the RATE answers both.
       *   · NOTHING GOES STALE.  rotRate.{z,kz,def} is a real stored number and the ONLY truth about
       *     the drive; the angle is still nowhere.  So `get` is honest, modSyncBases re-bases from
       *     the instrument rather than from a fiction, and the arc is anchored to something real.
       *   · THE VERSION BUMP IS ANSWERED SEPARATELY, at the ring, not here — see hDriven below.  A
       *     driven turn is a MOTION, not an edit, and the undo ring is told so once.
       * They carry `knob:` accessors on purpose, so all three are DROP targets: a rate is exactly
       * the kind of number a macro should be dragged onto, and the accessor is also what hands the
       * dial its base through setBase, so a focused dial under a running LFO announces the number
       * the hand owns instead of the number the modulator is at.
       * `map: 'bipolar'` on all three, and it is load-bearing rather than decorative: it makes the
       * detent at zero EXACT, and zero is the state in which this whole feature costs nothing. */
      { id: 'state.rot.z', label: 'SPIN z', unit: ' rad/s', map: 'bipolar', min: -ROT_LIMIT.z, max: ROT_LIMIT.z, def: 0, group: 'state', knob: () => ui.rotZRate,
        hint: 'Set z-rotation speed',
        get: () => rotRate.z,
        set: (v) => { setRotationRate('z', v); } },
      { id: 'state.stark.kz', label: 'SPIN K_z', unit: ' rad/s', map: 'bipolar', min: -ROT_LIMIT.kz, max: ROT_LIMIT.kz, def: 0, group: 'state', knob: () => ui.kzRate,
        hint: 'Set Stark rotation speed',
        get: () => rotRate.kz,
        set: (v) => { setRotationRate('kz', v); } },
      { id: 'state.defect.l2', label: 'SPIN L²', unit: ' rad/s', map: 'bipolar', min: -ROT_LIMIT.def, max: ROT_LIMIT.def, def: 0, group: 'state', knob: () => ui.defRate,
        hint: 'Set defect phase speed',
        get: () => rotRate.def,
        set: (v) => { setRotationRate('def', v); } },
      /* 0.6.0 B3a · THE SHELL RATES: a shell's labels on the lanes' own road (api.setRate: rates, setEnergies, the ring, the lanes' knobs); no dial of their own; `n1` because the kit's segment starts with a letter */
      ...Array.from({ length: 7 }, (_, i) => ({ id: `shell.rate.n${i + 1}`, label: `SHELL ${i + 1} RATE`, unit: '×', map: 'log', min: 0.25, max: 4, def: 1, group: 'state', knob: () => null,
        hint: 'one shell’s per-label RATE (× its energies); a beat above 3 Hz on screen flashes — the RATE label says when',
        get: () => rates[reg.populated().find((b) => BASIS[b].n === i + 1) ?? BASIS.findIndex((s) => s.n === i + 1)],   // its first populated label, else its first
        set: (v) => { for (const s of BASIS) if (s.n === i + 1 && rates[s.index] !== v) api.setRate(s.index, v); } })),

      /* CHEMISTRY's targets: a κ and a RATE, both PRESENT-only setters that store a number and schedule nothing (the RT pump is
         already running a frame of its own when either matters) — and, since iteration 007 O, THE ORBITAL INDEX.
         ADR-0001 (research/iteration-007/architecture/ADR-draft-0001-orbital-index-is-a-stepped-target.md, ACCEPTED; Josh 10-18:
         "Orbitals should be steps and I think it could handle it at lower frequencies"): this array used to keep the index out because
         it changes WHICH quantity the volume means — a rebuild of the picture's subject, not a value to sweep.  That is still true, and
         it is answered rather than refused: `chem.orbital` is an INTEGER target (every value a route or a lane writes is a whole
         orbital, never a cross-fade), and its setter is CAPPED (chemview stepOrbital: the latest value wins, at most one step per
         334 ms — three a second, THE PHOTOSENSITIVITY LAW's flashes).  Its range is the MOLECULE's, so this row only holds the id, the
         adapters and the field's orbital ceiling until the first landing; every landing re-registers it by id with the molecule's
         span (below the install: the kit's HOT RE-REGISTRATION keeps the base and the routes).  Do not move it back out: saved
         projects carry routes and TIMELINE clips on this id.  FIELD RESOLUTION and STEPS stay out — they rebuild the field itself. */
      { id: 'chem.kick', label: 'κ KICK', map: 'log', min: 1e-4, max: 1e-2, def: 1e-3, group: 'state', knob: () => (app.state.chem ? app.state.chem.knobs.kick() : null),
        hint: 'the δ-kick strength the next KICK will use — linear response wants the smallest κ the trace can carry',
        get: () => (app.state.chem ? app.state.chem.kappa : 1e-3), set: (v) => { if (app.state.chem) { app.state.chem.setKappa(v); setKnob(app.state.chem.knobs.kick(), app.state.chem.kappa); } } },
      { id: 'chem.speed', label: 'MOLECULES SPEED', unit: ' steps/frame', map: 'linear', min: 1, max: 50, def: 10, group: 'state', knob: () => (app.state.chem ? app.state.chem.knobs.speed() : null),
        hint: 'real-time propagation steps asked of the worker each frame',
        get: () => (app.state.chem ? app.state.chem.speed : 10), set: (v) => { if (app.state.chem) { app.state.chem.setSpeed(v); setKnob(app.state.chem.knobs.speed(), app.state.chem.speed); } } },
      { id: 'chem.orbital', label: 'MOLECULES ORBITAL', map: 'integer', min: 1, max: MOL_LIMITS.ao, step: 1, group: 'state', knob: () => (app.state.chem ? app.state.chem.knobs.orbital() : null),
        hint: 'which molecular orbital VIEW ORBITAL draws, ascending in ε — whole orbitals, three steps a second at most (one per 334 ms)',
        get: () => { const k = app.state.chem ? app.state.chem.orbital() : null; return Number.isFinite(k) ? k : NaN; },   // NaN before a molecule: the base is not synced from nothing
        set: (v) => { if (app.state.chem) app.state.chem.stepOrbital(v, app.state.modHost.registry.isModulated('chem.orbital')); } },
      /* THE REGISTER's SLOTS (REGISTER-WINDOW-SPEC §6): MORPH, and eight lane slots in lane order — S₀ is slot 1.
         PRESENT-only like every target here: a setter stores a number and the register's own frame push reads it.
         A slot with no lane behind it is a no-op, which is the present-only law for a lane that is not there. */
      { id: 'reg.morph', label: 'REG MORPH', map: 'linear', min: 0, max: 1, def: 0, group: 'state', knob: () => (app.state.states ? app.state.states.knobs.morph() : null),
        hint: 'where the STATES register plays on the path from store A to store B (MORPH must be on)',
        get: () => (app.state.states ? app.state.states.morph : 0), set: (v) => { if (app.state.states) { app.state.states.setMorphValue(v); setKnob(app.state.states.knobs.morph(), app.state.states.morph); } } },
      /* iteration 007 B (ADR-0002): the ORBITAL register's A ↔ B is its OWN target (`reg.omorph`, the id in orbitalsview.js) — a route that
         followed whichever pane is showing would change a saved route's meaning with the pane.  Its knob carries the stamp, so the TIMELINE
         lanes it like any registered dial (a lane AND a route ADD: the kit's host.js livePos samples the lane as the moving base and the
         routes modulate around it — B-BUILD measured their sum). */
      { id: OMORPH, label: 'ORBITAL MORPH', map: 'linear', min: 0, max: 1, def: 0, group: 'state', knob: () => (app.state.orbitals ? app.state.orbitals.knobs.morph() : null),
        hint: 'where the ORBITAL register plays on the path from store A to store B (MORPH must be on)',
        get: () => (app.state.orbitals ? app.state.orbitals.morph : 0), set: (v) => { if (app.state.orbitals) { app.state.orbitals.setMorphValue(v); setKnob(app.state.orbitals.knobs.morph(), app.state.orbitals.morph); } } },
      { id: 'reg.e0', label: 'DRIVE E₀', unit: ' a.u.', map: 'log', min: 1e-4, max: 0.2, def: 0.01, group: 'state', knob: () => (app.state.states ? app.state.states.knobs.driveE() : null),
        hint: 'the STATES drive’s field amplitude — a live knob of the running propagation, never a restart',
        get: () => (app.state.states ? app.state.states.drive.e0 : 0.01), set: (v) => { if (app.state.states) { app.state.states.setDriveParam('e0', v); setKnob(app.state.states.knobs.driveE(), app.state.states.drive.e0); } } },
      { id: 'reg.w', label: 'DRIVE ω', unit: ' Eh', map: 'log', min: 0.05, max: 3, def: 0.4, group: 'state', knob: () => (app.state.states ? app.state.states.knobs.driveW() : null),
        hint: 'the STATES drive’s carrier frequency — sweep it through a stick to watch the resonance',
        get: () => (app.state.states ? app.state.states.drive.omega : 0.4), set: (v) => { if (app.state.states) { app.state.states.setDriveParam('omega', v); setKnob(app.state.states.knobs.driveW(), app.state.states.drive.omega); } } },
      ...Array.from({ length: 8 }, (_, i) => ({ id: `reg.amp${i + 1}`, label: `REG |b|² ${i + 1}`, map: 'linear', min: 0, max: 1, def: 0, group: 'state',
        knob: () => (app.state.states ? app.state.states.knobs.pop(i) : null), hint: `the population of lane ${i + 1} of the STATES register (lane 1 is S₀)`,
        get: () => (app.state.states ? app.state.states.slotAmp(i) : 0), set: (v) => { if (app.state.states) { app.state.states.setSlotAmp(i, v); setKnob(app.state.states.knobs.pop(i), app.state.states.slotAmp(i)); } } })),
      ...Array.from({ length: 8 }, (_, i) => ({ id: `reg.ph${i + 1}`, label: `REG PHASE ${i + 1}`, unit: ' rad', map: 'linear', min: 0, max: 2 * Math.PI, def: 0, group: 'state',
        knob: () => (app.state.states ? app.state.states.knobs.ph(i) : null), hint: `the phase of lane ${i + 1} of the STATES register — on the y lane of a degenerate pair this sweeps slosh → ring → slosh → counter-ring`,
        get: () => (app.state.states ? app.state.states.slotPhase(i) : 0), set: (v) => { if (app.state.states) app.state.states.setSlotPhase(i, v); } })),

      { id: 'state.rabi', label: 'Ω RABI', map: 'log', min: 0.005, max: 1, def: 0.05, group: 'state', knob: () => ui.abOmega,
        hint: 'Set the A–B transition rate',
        get: () => app.hooks.ab.omega,
        set: (v) => { app.hooks.ab.setOmega(v); setKnob(ui.abOmega, v); schedule(TIER.PRESENT); } },
    ];
    /* THE SIXTH ROOT, through mir/registry's own documented extension point rather than by editing the vendored module:
       CHEMISTRY's targets are `chem.kick`, `chem.speed` and `chem.orbital` (iteration 007 O), and an id's root is what a saved route is addressed by — so it
       names the instrument, not the nearest existing group.  0.5.0 C1: `observer.yaw` / `observer.pitch` carry the CAMERA panel's
       sphere arcs, so they are drop targets now, like every observer.* dial. */
    app.state.modHost = mod.install(defs, ['observer', 'material', 'state', 'transport', 'field', 'chem', 'reg', 'shell']);
    app.state.restampParams = mod.stamp;
    /* iteration 007 O (ADR-0001) · chem.orbital's RANGE IS THE MOLECULE'S: every landing re-registers it by id (the kit keeps the base and
       the routes; a lane's 0..1 curve spans the new molecule), hands the base the landing's orbital (the HOMO, or the index a file named),
       re-asserts a routed target at once, and restamps the dial chemview rebuilt (its stamp was copied; the base road is the port's) */
    { const { knob: _k, id: _i, ...orbSpec } = defs.find((d) => d.id === 'chem.orbital'), H = app.state.modHost;
      app.state.chem.subscribe((sol) => { if (!sol) return;
        const [lo, hi] = app.state.chem.span(), k = app.state.chem.orbital();
        H.targets.installOne('chem.orbital', { ...orbSpec, min: lo, max: Math.max(hi, lo + 1) });   // integer needs min < max: a one-column record keeps a dead top step
        if (Number.isFinite(k)) H.registry.setBase('chem.orbital', k);
        if (H.registry.isModulated('chem.orbital')) H.clock.applyAll(true);
        mod.stamp(); if (app.state.modView) app.state.modView.rebuild(); }); }

    let trSeat = 'bottom', trMoving = false, dodgeAgain = 0;
    function seatRect(where, w, h) {
      const vw = window.innerWidth, vh = window.innerHeight;
      const narrowRack = matchMedia('(max-width: 860px)').matches;
      const top = where === 'top' ? (narrowRack ? 112 : 52) : vh - 60 - h;
      const left = narrowRack ? vw - w - 10 : (vw - w) / 2;
      return { left, right: left + w, top, bottom: top + h };
    }
    const hits = (a, b) => !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
    const dodging = {};   // 0.5.0 C7b: each kit window's open rect (the modulation window's, the TIMELINE's): the pill gives way to both
    function modDodge(rect, who = 'mod') {
      /* 0.5.0 C4: the kit's close reports null, and its place() reports the real box even while closed (λWAVES' copy sent the
         zero rect): a window that is not open has nothing to dodge */
      dodging[who] = rect && (who === 'mod' ? app.state.modView && app.state.modView.isOpen : app.state.tl && app.state.tl.isOpen()) ? rect : null;
      if (who === 'tl') magnetSeat();   // 015 T5: the modulation window follows the timeline it sits on
      const rs = Object.values(dodging).filter(Boolean), free = (s, w, h) => !rs.some((r) => hits(seatRect(s, w, h), r));
      occlusion.dirty();   // a paused field still has to move its line masks with the window
      const t = document.getElementById('transport');
      if (!t || !t.classList.contains('mini') || t.dataset.place === 'free') return;   // iteration 014 A4: the FREE window is the hand's, never dodged
      /* 015 T6 · A DODGE ASKED MID-MOVE IS KEPT, NOT DROPPED: the last one re-asks once the move has landed (before, only a report with no window
         open was retried, so a window that opened while the pill travelled could land on top of it) */
      if (trMoving) { clearTimeout(dodgeAgain); dodgeAgain = setTimeout(() => modDodge(dodging.mod || null, 'mod'), 320); return; }
      if (document.body.classList.contains('rack-hidden')) return;   // it is already parked off-screen
      /* OPTIMIZATION 2026-09-24 · N8 · A CLOSED WINDOW HAS NOTHING TO DODGE, AND ASKING COST THE BOOT A LAYOUT.  A closed
         modulation window reports the origin's empty rect (the kit's window.js place(); `closed` sends −1s).  No seat can hit a
         rect at or left of x = 0: a seat's left is (vw − w)/2 and the pill is `min(640px, 100vw − 24px)` wide
         (skin.css), so it starts ≥ 12 px in — the old chain always answered 'bottom' (or 'top' on a narrow rack) for it.
         When the pill already sits there, that answer changed nothing but it read the pill's rect first: on a first visit
         the boot's forced style + layout, 30–38 ms, once the closed H₂ and MOLECULES cards stopped paying it
         (probes/N/n8-reads.mjs).  Any other case falls through to the measured road below, unchanged. */
      if (!rs.length && trSeat === (matchMedia('(max-width: 860px)').matches ? 'top' : 'bottom')) return;
      const box = t.getBoundingClientRect();
      const w = box.width || 560, h = box.height || 34;
      const narrowRack = matchMedia('(max-width: 860px)').matches;
      if (narrowRack) trSeat = 'top';
      const want = narrowRack ? 'top'
                 : free('bottom', w, h) ? 'bottom'
                 : free('top', w, h) ? 'top' : trSeat;
      if (want === trSeat) return;
      trMoving = true;
      const leaving = trSeat === 'bottom' ? 'lw-tr-out-down' : 'lw-tr-out-up';
      const arriving = want === 'bottom' ? 'lw-tr-in-up' : 'lw-tr-in-down';
      t.style.animation = leaving + ' 140ms cubic-bezier(.55,0,1,.45) forwards';
      let arrived = false;
      const arrive = () => {
        if (arrived) return;                                    // the event and the belt may BOTH fire
        arrived = true;
        t.removeEventListener('animationend', arrive);
        trSeat = want;
        t.classList.toggle('at-top', want === 'top');
        t.style.animation = arriving + ' 160ms cubic-bezier(.23,1,.32,1) forwards';
        let ended = false;
        const done = () => { if (ended) return; ended = true;
          t.removeEventListener('animationend', done); t.style.animation = ''; trMoving = false; };
        t.addEventListener('animationend', done);
        setTimeout(done, 400);                                  // the belt: an animation that never fires must not wedge the flag
      };
      t.addEventListener('animationend', arrive);
      setTimeout(arrive, 220);                                  // the same belt on the leaving half
    }

    /* iteration 015 T5 · THE MAGNET (Josh: "The CSB can allow them to be called both on the screen and magnet/stack on top of each other"): with
       the TIMELINE open, the modulation window's bottom sits on the timeline's top, centred on it and clamped to the screen — the kit's lego
       stack (`stackAbove`, BASINS' stackAbove: 8 px above the anchor) handed an anchor whose left centres this window on the timeline.  It is
       asked on the window's open and on every timeline layout (its open, its dock, a move: `moved` → modDodge('tl')), so it follows; a hand's
       grip drag ends the kit's stack, which releases the magnet until the next open; the timeline's close lets the window stay where it is. */
    const magnet = { ours: false, released: false };
    const onTimeline = () => { const r = dodging.tl; if (!r) return null; const w = app.state.modView.root.offsetWidth || 0;
      return { left: r.left + (r.right - r.left - w) / 2, top: r.top }; };
    function magnetSeat() {
      const mv = app.state.modView; if (!mv || !mv.isOpen) return;
      if (magnet.ours && !mv.isStacked) { magnet.ours = false; magnet.released = true; }   // the hand dragged it away
      if (!magnet.released && dodging.tl) { magnet.ours = true; mv.stackAbove(onTimeline); }
      else if (magnet.ours) { magnet.ours = false; mv.stackAbove(null); }
    }
    app.state.modView = createModulation(document.getElementById('floats') || document.getElementById('lab'), mod.port({
      moved: modDodge, persist: () => saveSettings(), note: hNote,
      rateControl: () => knob({ label: 'RATE', min: 0.1, max: 3000, value: clock.rate, log: true, fmt: (v) => v.toFixed(2), onInput: (v) => { if (!modHand('transport.rate', v)) { clock.setRate(v); ui.rateKnob.set(v); } } }),
      /* WAVE 102 · THE FIFTH EDGE's memory: the chosen input, kept in this browser's settings so a returning user is not asked to
         pick it again — a device HANDLE, never audio (the kit's mir/modulation/audio-capture.js header says why that distinction matters). */
      device: { read: () => readSettings().audioDevice || '',
        write: (id) => { const S = readSettings();
          settingsStore.write({ ...S, audioDevice: id }); } },
      /* WAVE 65 · THE ARM'S OTHER DOOR: pressing the window's PLAY on a disarmed rack asks the host to arm, and the MOD lamp on
         the transport lights.  The host owns the flag, the glow and the persistence; the window only asks. */
      armed: () => app.state.modArm, arm: (on) => app.sh.setModArm(!!on),
      /* 0.5.3 M13a · the kit's 3×3 mark on the window's foot: it swaps to the TIMELINE (the button alone; no lego stack, R11) */
      switchWorkspace: () => { app.state.modView.close(); app.state.tl.open(); },
      onOpen: () => { magnet.released = false; magnetSeat(); },   // 015 T5: every open meets the magnet afresh
      /* iteration 003 · IT DOCKS AT THE BOTTOM LIKE BASINS' (shell.js installModulation dock): dragged to the foot it lands full-width
         between the racks, the kit's guide drawn while MIR OPTIONS' DROP GUIDES is on; dragged out, it floats.  The transport pill
         gives way to its rect through modDodge (moved) and takes the top seat; a docked transport is a rack card and never meets it. */
      dock: { span: dockSpan, guide: () => app.ctl.look.get('dropGuides') } }));
    app.state.modView.root.dataset.mirWindow = 'modulation';    // 0.5.0 A10's hook (the kit's controller sets the rail's, not the pane's)
    /* iteration 004 · ONE WINDOW STACK (MIR 1.5.0-alpha.15; BASINS shell.js registerWindow, the kit's bind.js for installModulation): a press
       on the modulation window or its rail raises it over FOLDERS, the TIMELINE, the KEYBOARD and MIR OPTIONS, in one press order.  Its z is
       all that moves: the mask is painted rects (shell/ink.js), never a stacking order */
    registerWindow({ root: app.state.modView.root, rail: app.state.modView.rail });
    applyAccent();                                    // the two angles reach the window as soon as it exists
    app.state.modView.restore(readSettings().modwin);
    app.state.dodge = modDodge;                                 // 0.5.0 C7b: the TIMELINE's `moved` gives way through the same seat chooser
    /* wave 54: the modulation clock's visibility is driven by the ONE authority (setPageHidden), not by a second listener of its own — it still RE-ANCHORS and never jumps */
    if (page.hidden) app.state.modHost.clock.setHidden(true);
  }
}
