/* lab/shell/modulation.js — THE MODULATION SEAM (0.5.2 R2d; moved verbatim out of lab/rack.js boot()): the ONE `defs` route table and mod.install, the pill's
 * seat and dodge, and the kit's modulation window (app.state.modHost / modView, read live by every module).  createModSeam(app) runs where the seam stood. */
import { TIER } from '../tier.js'; import { knob } from '../mir/kit.js'; import { cssZoom } from '../mir/core/zoom.js'; import { CAM, clampShift } from '../camera-law.js'; import { createModulation } from '../mir/modulation/window.js'; import { installPattern } from '../mir/pattern/window.js'; import { registerWindow, windowOf } from '../mir/window/window.js'; import { clearSeat } from '../summon.js'; import { BASIS } from '../hydrogen.js'; import { EPS_POP } from '../state.js'; import { dockSpan } from '../mir-gui.js'; import { OMORPH } from '../orbitalsview.js'; import { MOL_LIMITS, STYLE, STYLE_NAMES, VIEW, WAVE_VIEWS, waveView, drawStyle } from '../field.js'; import { PRESETS as PALETTES } from '../mir/palette.js'; import { lightDefs } from '../light-window.js';   // 037 L3: THE LIGHT's targets
/** 032 W3 · AN OLDER CURVE ON A BANDED TARGET (the project open road, shell/persist.js): a curve drawn before its target had `options` carries no
 *  `steps` and meant the old integer line — k at k / (max − min) — so each point is read back as that integer (an older GRAIN as DUST, BALLS or
 *  STICKS as SHELL), seated at the centre of its option's band, and the curve remembers the count (WATER ESP's, STAR LOOP's and BENZENE π's STYLE
 *  lanes); a curve with `steps`, a kind (pattern, audio) or a plain target is untouched (the conductor writes `steps` on a banded lane).  Pure. */
export function liftBands(doc, registry) {
  if (!doc || !Array.isArray(doc.curves) || !registry) return doc;
  const lift = (id, k) => (id !== 'material.style' ? k : k === STYLE.balls || k === STYLE.sticks ? STYLE.glass : STYLE[drawStyle(k)]);
  let moved = false;
  const curves = doc.curves.map((c) => {
    if (!c || c.steps || c.kind || !Array.isArray(c.points) || !registry.has(c.targetId)) return c;
    const d = registry.describe(c.targetId); if (d.map !== 'integer' || !d.steps) return c;
    const lo = Number.isFinite(c.min) ? c.min : 0, hi = Number.isFinite(c.max) ? c.max : 1; moved = true;
    return { ...c, min: 0, max: 1, steps: d.steps, points: c.points.map((p) => { const u = lo + (hi - lo) * Math.max(0, Math.min(1, Number(p.v) || 0));
      return { ...p, v: registry.toNorm(c.targetId, lift(c.targetId, d.min + Math.round(u * (d.max - d.min)))) }; }) };
  });
  return moved ? { ...doc, curves } : doc;
}
export function createModSeam(app) {
  const { ui, hNote, clock, obs, mat, settingsStore, reg, rates, dom } = app, { schedule, page } = app.loop, { orbitBy, cameraPort } = app.host, { readSettings, saveSettings, powered } = app.sh, { wChem } = app.w,
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
    /* 032 W3: an event target's set is its seg's own road — the option `id` as a hand's press takes it (onChange), refused while its button is hidden
       or greyed, nothing while it is the one held */
    const segRoad = (g, id) => { const b = g && g.button(id); if (!b || b.hidden || b.disabled || g.get() === id) return; g.set(id); if (g.spec && g.spec.onChange) g.spec.onChange(id); };
    const SLICE_MODES = ['off', 'clip', 'slab'];   // mat.slice.mode 0 · 1 · 2 (CLIP's ON switch and its CLIP | SLAB)
    const defs = [
      /* 0.5.0 C1 · the six saved observer.* routes keep their ids, maps and ranges, and stay HERE (the registry's road writes the pose
         raw; the panel registers none of them).  Their dials are the CAMERA panel's (camKnobs: the sphere's two arcs, ZOOM, FOV, the
         pad's X and Y), and a modulator's write is a notice to the port's subscribers (camOut), so the panel follows a route. */
      { id: 'observer.yaw', label: 'YAW', unit: ' rad', map: 'wrap', min: 0, max: 2 * Math.PI, group: 'observer', knob: () => app.state.camKnobs['observer.yaw'],
        hint: 'the camera azimuth, free-spinning',
        get: () => obs.yaw, set: (v) => { if (sameCycle(v, obs.yaw, 2 * Math.PI)) return; if (obs.mode === 'free') orbitBy(v - obs.yaw, 0); else obs.yaw = v; camOut('observer.yaw', obs.yaw); } },
      { id: 'observer.pitch', label: 'PITCH', unit: ' rad', map: 'bipolar', min: -CAM.PITCH, max: CAM.PITCH, def: 0, group: 'observer', knob: () => app.state.camKnobs['observer.pitch'],
        hint: 'Pitch balance; 50% is level',
        get: () => obs.pitch, set: (v) => { const w = Math.max(-CAM.PITCH, Math.min(CAM.PITCH, v)); if (w === obs.pitch) return; if (obs.mode === 'free') orbitBy(0, w - obs.pitch); else obs.pitch = w; camOut('observer.pitch', obs.pitch); } },
      { id: 'observer.dist', label: 'ZOOM', map: 'log', min: CAM.DIST[0], max: CAM.DIST[1], group: 'observer', knob: () => app.state.camKnobs['observer.dist'],
        hint: 'the ZOOM dial itself (log)',
        get: () => obs.dist, set: (v) => { obs.dist = Math.max(CAM.DIST[0], Math.min(CAM.DIST[1], v)); camOut('observer.dist', obs.dist); } },
      { id: 'observer.fov', label: 'FOV', map: 'linear', min: CAM.FOV[0], max: CAM.FOV[1], group: 'observer', knob: () => app.state.camKnobs['observer.fov'],
        get: () => obs.fov, set: (v) => { obs.fov = Math.max(CAM.FOV[0], Math.min(CAM.FOV[1], v)); camOut('observer.fov', obs.fov); } },
      { id: 'observer.panx', label: 'PAN X', map: 'bipolar', min: -CAM.SHIFT, max: CAM.SHIFT, def: 0, group: 'observer', knob: () => app.state.camKnobs['observer.panx'], hint: 'the lens shift across: where the pivot sits on the frame',   // 0.4.0 S2
        get: () => obs.shift[0], set: (v) => { obs.shift = [cameraPort.get('lock') ? 0 : clampShift([v, 0])[0], obs.shift[1]]; camOut('observer.panx', obs.shift[0]); } },   // 0.5.3 M6: a route under the LOCK writes the centre
      { id: 'observer.pany', label: 'PAN Y', map: 'bipolar', min: -CAM.SHIFT, max: CAM.SHIFT, def: 0, group: 'observer', knob: () => app.state.camKnobs['observer.pany'], hint: 'the lens shift: where the pivot sits on the frame',
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
      ...Array.from({ length: 7 }, (_, i, at = BASIS.flatMap((s, a) => (s.n === i + 1 ? [a] : []))) => ({ id: `shell.rate.n${i + 1}`, label: `SHELL ${i + 1} RATE`, unit: '×', map: 'log', min: 0.25, max: 4, def: 1, group: 'state', knob: () => null,
        hint: 'one shell’s per-label RATE (× its energies)',
        get: () => { for (const a of at) if (reg.re0[a] ** 2 + reg.im0[a] ** 2 > EPS_POP) return rates[a]; return rates[at[0]]; },   // its first populated label, else its first (017 P2: no populated() array per read — syncBases reads it every modulation tick)
        set: (v) => { for (const s of BASIS) if (s.n === i + 1 && rates[s.index] !== v) api.setRate(s.index, v); } })),

      /* CHEMISTRY's targets: a κ and a RATE, both PRESENT-only setters that store a number and schedule nothing (the RT pump is
         already running a frame of its own when either matters) — and, since iteration 007 O, THE ORBITAL INDEX.
         ADR-0001 (research/iteration-007/architecture/ADR-draft-0001-orbital-index-is-a-stepped-target.md, ACCEPTED; Josh 10-18:
         "Orbitals should be steps and I think it could handle it at lower frequencies"): this array used to keep the index out because
         it changes WHICH quantity the volume means — a rebuild of the picture's subject, not a value to sweep.  That is still true, and
         it is answered rather than refused: `chem.orbital` is an INTEGER target (every value a route or a lane writes is a whole
         orbital, never a cross-fade), and its setter steps (chemview stepOrbital: one step a frame, the latest value wins — 038 C2 retired
         10-18's 334 ms cap by Josh's word, so a route walks the ladder as the hand does).  Its range is the MOLECULE's, so this row only holds the id, the
         adapters and the field's orbital ceiling until the first landing; every landing re-registers it by id with the molecule's
         span (below the install: the kit's HOT RE-REGISTRATION keeps the base and the routes).  Do not move it back out: saved
         projects carry routes and TIMELINE clips on this id.  FIELD RESOLUTION and STEPS stay out — they rebuild the field itself. */
      { id: 'chem.kick', label: 'κ KICK', map: 'log', min: 1e-4, max: 1e-2, def: 1e-3, group: 'state', knob: () => (app.state.chem ? app.state.chem.knobs.kick() : null),
        hint: 'the δ-kick strength the next KICK uses',
        get: () => (app.state.chem ? app.state.chem.kappa : 1e-3), set: (v) => { if (app.state.chem) { app.state.chem.setKappa(v); setKnob(app.state.chem.knobs.kick(), app.state.chem.kappa); } } },
      { id: 'chem.speed', label: 'MOLECULES SPEED', unit: ' steps/frame', map: 'linear', min: 1, max: 50, def: 10, group: 'state', knob: () => (app.state.chem ? app.state.chem.knobs.speed() : null),
        hint: 'real-time propagation steps asked of the worker each frame',
        get: () => (app.state.chem ? app.state.chem.speed : 10), set: (v) => { if (app.state.chem) { app.state.chem.setSpeed(v); setKnob(app.state.chem.knobs.speed(), app.state.chem.speed); } } },
      { id: 'chem.orbital', label: 'MOLECULES ORBITAL', map: 'integer', min: 1, max: MOL_LIMITS.ao, step: 1, group: 'state', knob: () => (app.state.chem ? app.state.chem.knobs.orbital() : null),
        hint: 'the orbital VIEW ORBITAL draws, ascending in ε',
        get: () => { const k = app.state.chem ? app.state.chem.orbital() : null; return Number.isFinite(k) ? k : NaN; },   // NaN before a molecule: the base is not synced from nothing
        set: (v) => { if (app.state.chem) app.state.chem.stepOrbital(v, app.state.modHost.registry.isModulated('chem.orbital')); } },
      /* THE REGISTER's SLOTS (REGISTER-WINDOW-SPEC §6): MORPH, and eight lane slots in lane order — S₀ is slot 1.
         PRESENT-only like every target here: a setter stores a number and the register's own frame push reads it.
         A slot with no lane behind it is a no-op, which is the present-only law for a lane that is not there. */
      { id: 'reg.morph', label: 'REG MORPH', map: 'linear', min: 0, max: 1, def: 0, group: 'state', knob: () => (app.state.states ? app.state.states.knobs.morph() : null),
        hint: 'the STATES register on the path A → B (MORPH on)',
        get: () => (app.state.states ? app.state.states.morph : 0), set: (v) => { if (app.state.states) { app.state.states.setMorphValue(v); setKnob(app.state.states.knobs.morph(), app.state.states.morph); } } },
      /* iteration 007 B (ADR-0002): the ORBITAL register's A ↔ B is its OWN target (`reg.omorph`, the id in orbitalsview.js) — a route that
         followed whichever pane is showing would change a saved route's meaning with the pane.  Its knob carries the stamp, so the TIMELINE
         lanes it like any registered dial (a lane AND a route ADD: the kit's host.js livePos samples the lane as the moving base and the
         routes modulate around it — B-BUILD measured their sum). */
      { id: OMORPH, label: 'ORBITAL MORPH', map: 'linear', min: 0, max: 1, def: 0, group: 'state', knob: () => (app.state.orbitals ? app.state.orbitals.knobs.morph() : null),
        hint: 'the ORBITAL register on the path A → B (MORPH on)',
        get: () => (app.state.orbitals ? app.state.orbitals.morph : 0), set: (v) => { if (app.state.orbitals) { app.state.orbitals.setMorphValue(v); setKnob(app.state.orbitals.knobs.morph(), app.state.orbitals.morph); } } },
      { id: 'reg.e0', label: 'DRIVE E₀', unit: ' a.u.', map: 'log', min: 1e-4, max: 0.2, def: 0.01, group: 'state', knob: () => (app.state.states ? app.state.states.knobs.driveE() : null),
        hint: 'the STATES drive’s field amplitude, live',
        get: () => (app.state.states ? app.state.states.drive.e0 : 0.01), set: (v) => { if (app.state.states) { app.state.states.setDriveParam('e0', v); setKnob(app.state.states.knobs.driveE(), app.state.states.drive.e0); } } },
      { id: 'reg.w', label: 'DRIVE ω', unit: ' Eh', map: 'log', min: 0.05, max: 3, def: 0.4, group: 'state', knob: () => (app.state.states ? app.state.states.knobs.driveW() : null),
        hint: 'the STATES drive’s carrier frequency',
        get: () => (app.state.states ? app.state.states.drive.omega : 0.4), set: (v) => { if (app.state.states) { app.state.states.setDriveParam('omega', v); setKnob(app.state.states.knobs.driveW(), app.state.states.drive.omega); } } },
      ...Array.from({ length: 8 }, (_, i) => ({ id: `reg.amp${i + 1}`, label: `REG |b|² ${i + 1}`, map: 'linear', min: 0, max: 1, def: 0, group: 'state',
        knob: () => (app.state.states ? app.state.states.knobs.pop(i) : null), hint: `STATES lane ${i + 1} population (lane 1 is S₀)`,
        get: () => (app.state.states ? app.state.states.slotAmp(i) : 0), set: (v) => { if (app.state.states) { app.state.states.setSlotAmp(i, v); setKnob(app.state.states.knobs.pop(i), app.state.states.slotAmp(i)); } } })),
      ...Array.from({ length: 8 }, (_, i) => ({ id: `reg.ph${i + 1}`, label: `REG PHASE ${i + 1}`, unit: ' rad', map: 'linear', min: 0, max: 2 * Math.PI, def: 0, group: 'state',
        knob: () => (app.state.states ? app.state.states.knobs.ph(i) : null), hint: `STATES lane ${i + 1} phase`,
        get: () => (app.state.states ? app.state.states.slotPhase(i) : 0), set: (v) => { if (app.state.states) app.state.states.setSlotPhase(i, v); } })),

      /* 026 A1 · THE ABSOLUTE LOOK: STYLE, VIEW and PALETTE as integer targets (a lane can say "bar 7 is SHELL on PHOSPHOR").  Each writes on
         its seg's own road (the seg's set, no stage word) and stands down where a press could not land: a MOLECULES-only STYLE's button is
         hidden while MOLECULES is off, a muted VIEW's is disabled.  PALETTE is PALETTE's select, in the kit's PRESETS order; a value equal
         to the live one writes nothing (a project's base never re-selects over its own stops). */
      /* 032 W3 · THE EVENT TARGETS (T23, MIR 1.5.6-alpha.22): a segmented row or a switch that offers CREATE EVENT is an `integer` row with `options`
         (the unit line in equal bands, one an option, read when asked — STYLE's are the seg's visible styles, so an EVENT clip drawn for nine wears ⚠
         under hydrogen's eight) or a toggle; `seg` names its control (stamped below: `data-event`, each button `data-v`) and a set takes its own road */
      { id: 'material.style', label: 'STYLE', map: 'integer', min: 0, max: STYLE_NAMES.length - 1, step: 1, group: 'material', knob: () => null,
        options: () => (ui.styleList ? ui.styleList().map(([s]) => STYLE[s]) : null), seg: () => ui.styleSeg, of: (s) => STYLE[s],
        hint: 'WAVE STYLE, in the seg’s order (its visible styles)',
        get: () => mat.style | 0,
        set: (v) => { const s = drawStyle(STYLE_NAMES[v | 0]), b = ui.styleSeg && ui.styleSeg.button(s); if (!b || b.hidden || mat.style === STYLE[s]) return; const from = mat.style | 0; mat.style = STYLE[s]; ui.styleRecall(from, mat.style, true); ui.styleSeg.set(s); schedule(TIER.PRESENT); } },   // 038 K1: a lane's switch recalls the hand's memory (and starts none)
      { id: 'material.view', label: 'VIEW', map: 'integer', min: 0, max: WAVE_VIEWS.length - 1, step: 1, group: 'material', knob: () => null,
        options: WAVE_VIEWS.map((_, i) => i), seg: () => ui.viewSeg, of: (w) => WAVE_VIEWS.indexOf(w),
        hint: 'the observable by number: 0 ρ · 1 phase · 2 Re · 3 Im',
        get: () => WAVE_VIEWS.indexOf(waveView(mat.view) || 'density'),
        set: (v) => { const w = WAVE_VIEWS[v | 0], b = ui.viewSeg && ui.viewSeg.button(w); if (!b || b.hidden || b.disabled || mat.view === VIEW[w]) return; mat.view = VIEW[w]; ui.viewSeg.set(w); schedule(TIER.PRESENT); } },
      { id: 'palette.index', label: 'PALETTE', map: 'integer', min: 0, max: PALETTES.length - 1, step: 1, group: 'material', knob: () => null, options: PALETTES.map((_, i) => i),
        hint: 'the palette by number, in the PALETTE menu order',
        get: () => { const P = app.state.palette, i = P ? PALETTES.findIndex((q) => q.id === P.id) : -1; return i >= 0 ? i : NaN; },
        set: (v) => { const P = app.state.palette, q = PALETTES[v | 0]; if (P && q && P.id !== q.id) P.select(q.id); } },
      { id: 'material.space', label: 'SPACE', map: 'integer', min: 0, max: 1, step: 1, group: 'material', knob: () => null, options: [0, 1], seg: () => ui.spaceSeg, of: (w) => (w === 'p' ? 1 : 0),
        hint: 'WAVE SPACE: 0 POSITION · 1 MOMENTUM',
        get: () => (app.state.space === 'p' ? 1 : 0), set: (v) => segRoad(ui.spaceSeg, v >= 1 ? 'p' : 'x') },
      { id: 'material.slice.mode', label: 'CLIP', map: 'integer', min: 0, max: 2, step: 1, group: 'material', knob: () => null, options: [0, 1, 2],
        seg: () => ui.sliceModeSeg && ui.sliceModeSeg.kind, also: () => ui.sliceModeSeg, of: (w) => SLICE_MODES.indexOf(w),   // the ON switch and its CLIP | SLAB
        hint: 'CLIP: 0 OFF · 1 CLIP · 2 SLAB',
        get: () => (mat.slice ? mat.slice.mode | 0 : 0),
        set: (v) => { const w = SLICE_MODES[v | 0], S = ui.sliceModeSeg; if (!w || !S || !mat.slice || S.get() === w) return; S.set(w); mat.slice.mode = v | 0; schedule(TIER.PRESENT); } },
      { id: 'state.scale', label: 'SCALE', map: 'integer', min: 0, max: 1, step: 1, group: 'state', knob: () => null, options: [0, 1], seg: () => ui.scaleSeg, of: (w) => (w === 'sturmian' ? 1 : 0),
        hint: 'SPECTRUM SCALE: 0 HYDROGEN 1/n · 1 STURMIAN λ',
        get: () => (ui.scaleSeg && ui.scaleSeg.get() === 'sturmian' ? 1 : 0), set: (v) => segRoad(ui.scaleSeg, v >= 1 ? 'sturmian' : 'hydrogen') },
      /* the register's hand on the 140 grid: a value is the register as that one state (hydrogen; a molecule's register is its own) — the grid's road
         (CLEAR, then the state's press, then the hand's quiet normalisation); a value it already holds writes nothing.  It is the TIMELINE's alone: it
         writes only the value a clip on it says at this beat — a base, a restore, a route or a film's frozen look (its stale 0 while the register holds
         many states) never empties the register */
      { id: 'state.index', label: 'STATE', map: 'integer', min: 0, max: BASIS.length - 1, step: 1, group: 'state', knob: () => null, options: BASIS.map((_, i) => i),
        seg: () => document.querySelector('.dev[data-id="spectrum"] .picker'),
        hint: 'the register as one of the 140 states',
        get: () => { const p = reg.populated(); return p.length === 1 ? p[0] : NaN; },
        set: (v) => { const k = v | 0, p = reg.populated(), H = app.state.modHost, tl = app.state.tl; if ((app.state.chem && app.state.chem.on) || !(k >= 0 && k < BASIS.length) || (p.length === 1 && p[0] === k) || !H || !tl) return;
          const u = tl.model.value('state.index', H.model.transport.beats); if (!Number.isFinite(u) || H.registry.fromNorm('state.index', u) !== k) return;   // a clip says k here, or nothing moves
          api.clear(); api.toggleMode(k); api.settle(); } },

      { id: 'state.rabi', label: 'Ω RABI', map: 'log', min: 0.005, max: 1, def: 0.05, group: 'state', knob: () => ui.abOmega,
        hint: 'Set the A–B transition rate',
        get: () => app.hooks.ab.omega,
        set: (v) => { app.hooks.ab.setOmega(v); setKnob(ui.abOmega, v); schedule(TIER.PRESENT); } },
      /* 037 T4 · PULSE (lab/stage-window.js), the `stage` root: the wash's AMOUNT — a luminance route, so it declares its own `flash` step (a light
         stage's × 0.7 moves the picture 10 % at about a third of the range) — and its RATE */
      { id: 'stage.pulse', label: 'PULSE', map: 'linear', min: 0, max: 1, def: 0, group: 'stage', flash: 0.3, knob: () => ui.pulseK, hint: 'STAGE › PULSE: how strongly the stage washes',
        get: () => (mat.stage ? mat.stage.pulse : 0), set: (v) => { ui.setPulse({ pulse: v }); setKnob(ui.pulseK, v); } },
      { id: 'stage.rate', label: 'PULSE RATE', unit: ' Hz', map: 'linear', min: 0, max: 2, def: 0, group: 'stage', knob: () => ui.pulseRateK, hint: 'STAGE › PULSE: breaths a second while playing',
        get: () => (mat.stage ? mat.stage.rate : 0), set: (v) => { ui.setPulse({ rate: v }); setKnob(ui.pulseRateK, v); } },
      /* 037 L3 · THE LIGHT (lab/light-window.js): light.az · light.el (the SUN pad's; no dial) and the LIGHTING window's ten dials, their ranges the dials' own;
         a route's value is written as a hand's is (mat.light, off its home), the hand's base is the registry's */
      ...lightDefs(app),
    ];
    /* 038 C1 · THE POWER BUTTON QUIETS: MOLECULES powered off swallows every write to its targets (chem.* · reg.*), so a route or a clip on one
       goes quiet and is KEPT — nothing unrouted, the stage as it was.  C4 · THE QUIET CARD LETS GO: a target whose write was swallowed reads back
       as the registry holds it (so no base re-syncs from the frozen card), and POWER ON writes each one the registry's value now — a clip or a
       route taken off while quiet lets go to the base, one put on lands — then re-asserts every route */
    const slept = new Map(), quiet = () => !powered(wChem), R = () => app.state.modHost.registry;
    for (const d of defs) if (/^(chem|reg)\./.test(d.id)) { const { set, get } = d;
      d.set = (v) => { if (quiet()) slept.set(d.id, set); else set(v); };
      d.get = () => (slept.has(d.id) ? R().read(d.id) : get()); }
    wChem.root.querySelector('.dev-power').addEventListener('click', () => { if (quiet()) return;
      for (const [id, set] of slept) { slept.delete(id); if (R().has(id)) set(R().read(id)); }
      app.state.modHost.clock.applyAll(true); });
    /* THE SIXTH ROOT, through mir/registry's own documented extension point rather than by editing the vendored module:
       CHEMISTRY's targets are `chem.kick`, `chem.speed` and `chem.orbital` (iteration 007 O), and an id's root is what a saved route is addressed by — so it
       names the instrument, not the nearest existing group.  0.5.0 C1: `observer.yaw` / `observer.pitch` carry the CAMERA panel's
       sphere arcs, so they are drop targets now, like every observer.* dial. */
    app.state.modHost = mod.install(defs, ['observer', 'material', 'state', 'transport', 'field', 'chem', 'reg', 'shell', 'nodes', 'action', 'palette', 'stage', 'light']);   // 037 T4: `stage` (PULSE) · L3: `light`
    /* 032 W3: each event target's control says its target (`data-event`) and each of its buttons its value (`data-v`) — CREATE EVENT and COPY VALUE
       (lab/actions.js, the control menu) read them; SETTINGS' FRAME · AXIS and INFORMATIONAL's switches name their `action.<id>` toggles */
    for (const d of defs) for (const c of [d.seg && d.seg(), d.also && d.also()]) { const r = c && (c.root || c); if (!r || !r.dataset) continue; r.dataset.event = d.id;
      if (c.spec && d.of) for (const o of c.spec.options) { const b = c.button(o.id); if (b) b.dataset.v = String(d.of(o.id)); } }
    for (const [id, c] of [['view.frame', ui.frameSw], ['view.axis', ui.axisSw], ['view.captions', ui.capSw], ['view.formula', ui.molFormulaSw], ['view.labels', ui.atomLabelsSw]]) if (c && c.root) c.root.dataset.event = 'action.' + id;   // 021 I2: `action.<id>`, the registry's acts (lab/mapping.js)   // 026 A1: `palette.index`   // 019 N2: NODES' knobs, `nodes.<node>.<knob>` (lab/nodes.js, the runtime door)
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
    /* 034 F3 · THE BAR'S HOME IS THE BOTTOM (Josh 11-02: "CSB seems stuck to the top … I would prefer it towards the bottom"): a wide stage seats it
       at the bottom while the bottom is free, on top only while a window holds the bottom (TIMELINE + MODULATION docked below), and back at the
       bottom the moment the bottom frees; a narrow stage (≤ 860 px) seats it on top.  032 T13 kept the side a DODGE landed on (`lw.csb.side`), which
       is what stuck it on top: a dodge's landing is never a choice, so the record is retired and a stored one removed at boot */
    const narrowNow = () => matchMedia('(max-width: 860px)').matches;
    try { localStorage.removeItem('lw.csb.side'); } catch (_) {}
    function seatRect(where, w, h) {
      const vw = window.innerWidth, vh = window.innerHeight;
      const narrowRack = matchMedia('(max-width: 860px)').matches;
      const z = cssZoom(document.getElementById('transport') || document.body) || 1;   // 038 M7: the seats are the bar's own px — at UI SCALE 150 % its 52 px top is 78 on the screen
      const top = where === 'top' ? Math.max(narrowRack ? 112 : 52, clearPx) * z : vh - 60 - h;
      const left = narrowRack ? vw - w - 10 : (vw - w) / 2;
      return { left, right: left + w, top, bottom: top + h };
    }
    /* 038 M6 · M7 · THE BAR CLEARS THE RACKS (the fresh eyes: at 820 px ADVANCED's third left card drew over the bar; at 1000 × 700 the bar sat on
       the right rack's CAMERA and CLIP; at UI SCALE 150 % its PLAY and mini-viewer reached over both columns): the top seat — a narrow stage's
       always, a wide one's `.at-top` — sits under the last card of every rack hanging from the stage's top whose columns the bar, its PLAY or its
       mini-viewer shares: `--csb-clear` on the bar (the greater rack's end + 10 px), read as max(the seat, the clear) by lab.css and csb.css and by
       `seatRect`, absent when nothing is in the way, and never lower than the room above the foot (a narrow stage's bottom rack) leaves.  Where no
       seat clears a rack's cards (the foot's room is short of them), the racks stop above the bar (039 V1, below).
       A rack's box is its cards' (lab.css: top 0, bottom auto), so their ResizeObserver, the bar's own box and class, the body's class (B, H) and a
       resize ask again, once a frame */
    const racksEl = ['rackL', 'rack'].map((id) => document.getElementById(id)).filter(Boolean); let clearPx = 0, clearBooked = 0;
    const shownCard = (d) => d.classList.contains('dev') && !d.hidden && !d.classList.contains('closed') && !d.classList.contains('floating');
    /** the bar on the stage and its columns: its box with PLAY beside its left edge and the mini-viewer beside its right (each when drawn), or null */
    const barSpan = () => {
      const t = document.getElementById('transport');
      if (!t || !t.classList.contains('mini') || t.dataset.place === 'free' || document.body.classList.contains('rack-hidden') || !t.offsetWidth) return null;
      const rs = [t, t.querySelector(':scope > .csb-play'), t.querySelector(':scope > .csb-mini')].filter((e) => e && e.offsetWidth).map((e) => e.getBoundingClientRect());
      return { left: Math.min(...rs.map((r) => r.left)), right: Math.max(...rs.map((r) => r.right)), top: Math.min(...rs.map((r) => r.top)), bottom: Math.max(...rs.map((r) => r.bottom)) };
    };
    /* 039 V1 · THE BAR IS ON TOP AND THE RACKS STOP ABOVE IT (the walks: the Play disc's click landed on MOLECULES' chevron; one unfolded rack window
       covered six bar buttons at 1000 × 700, EXPAND ALL ten): the bar never goes under a rack (038 M7's `rackOver` is gone); instead every rack whose
       columns the bar, its PLAY or its mini-viewer share stops 10 px above the bar's top — `--rack-stop` on the rack, its max-height (lab.css), in the
       rack's own px — so a tall column scrolls above the bar instead of running under it.  The top seat's clear reads the racks' CONTENT bottoms (the
       cards as laid out, never the stopped box: the stop follows the bar, the bar's clear follows the cards), so the two never chase each other */
    const contentBottom = (rk) => { let b = 0; for (const c of rk.children) if (c.offsetParent === rk) b = Math.max(b, c.offsetTop + c.offsetHeight); return b + (parseFloat(getComputedStyle(rk).paddingBottom) || 0); };
    const stops = new Map();
    function clearRack() {
      clearBooked = 0;
      const t = document.getElementById('transport'), s = barSpan(); if (!t) return;
      let v = 0;
      const meet = s ? racksEl.filter((rk) => [...rk.children].some(shownCard)).map((rk) => ({ rk, r: rk.getBoundingClientRect() })).filter(({ r }) => r.width && r.right > s.left && r.left < s.right) : [];
      const hang = meet.filter(({ r }) => r.top < 52);
      if (hang.length) {   // a narrow stage's right rack lies along the foot (its top is not the stage's): never one to clear by going lower
        /* 039 V2: …nor lower than an open work bar's top (the TIMELINE or MODULATION docked below holds the foot): the bar stays above it and the
           rack stops above the bar (V1), never the bar across the timeline's lanes */
        const b = t.getBoundingClientRect(), work = Object.values(dodging).filter((r) => r && r.top > 52 * (cssZoom(t) || 1) + b.height).map((r) => r.top);
        const foot = Math.min(narrowNow() ? (document.getElementById('rack') || t).getBoundingClientRect().top : innerHeight - 60, ...work);
        const cards = Math.max(...hang.map(({ rk, r }) => r.top + contentBottom(rk) * (cssZoom(rk) || 1)));
        v = Math.max(0, Math.round((Math.min(cards + 10, foot - b.height - 10) - (t.offsetParent || document.body).getBoundingClientRect().top) / (cssZoom(t) || 1)));
      }
      if (v !== clearPx) { clearPx = v; if (v) t.style.setProperty('--csb-clear', v + 'px'); else t.style.removeProperty('--csb-clear'); occlusion.dirty(); }   // the line masks follow the bar, paused or not
      if (trMoving) return;   // the stop is measured on the bar where it landed (the settle asks again)
      for (const rk of racksEl) {
        const m = meet.find((x) => x.rk === rk), stop = m && m.r.top < s.top ? Math.max(0, Math.floor((s.top - 10 - m.r.top) / (cssZoom(rk) || 1))) : 0;
        if (stops.get(rk) !== stop) { stops.set(rk, stop); if (stop) rk.style.setProperty('--rack-stop', stop + 'px'); else rk.style.removeProperty('--rack-stop'); }
      }
      under(blocked);
    }
    /* no ResizeObserver on the racks (M7: a card another observer resized inside the racks left theirs undelivered — the browser's "loop" error):
       a card opened, closed or folded (its class, in either rack), the bar's class, the body's class and a resize ask once a frame, and once more when
       a fold's or a dodge's motion has landed */
    { let settle = 0; const ask = () => { if (!clearBooked) clearBooked = requestAnimationFrame(clearRack); }, book = () => { ask(); clearTimeout(settle); settle = setTimeout(ask, 420); };
      const mo = new MutationObserver(book), t = document.getElementById('transport');
      for (const rk of racksEl) mo.observe(rk, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'hidden'] });
      if (t) mo.observe(t, { attributes: true, attributeFilter: ['class', 'data-place'] });
      if (t) new ResizeObserver(book).observe(t);   // 039 V1: the expander opening or closing moves the bar's top, and the racks' stop with it (the callback only books a frame)
      mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
      addEventListener('resize', book); }
    const hits = (a, b) => !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
    const dodging = {};   // 0.5.0 C7b: each kit window's open rect (the modulation window's, the TIMELINE's): the pill gives way to both
    /* 020 T3 · THE BAR IS ON TOP of every window (lab.css, chrome + 3) but these two: when no seat clears them it goes UNDER them for that time.
       021 V3 · …AND UNDER AN OPEN FLOAT IT MEETS — since 039 V1 only one TALLER THAN THE ROOM above the bar (MIR OPTIONS on a short screen: no seat
       could clear it, and its foot would lie under the bar); any other window that meets the bar (a hand's drag) goes under the bar, which stays
       pressable.  The seat is chosen against TIMELINE and MODULATION as before (`blocked`: no seat cleared those two) */
    const floatsEl = document.getElementById('floats');
    let blocked = false;
    const floatOver = () => {
      if (!floatsEl) return false;
      const open = [...floatsEl.children].filter((n) => !n.hidden && (n.classList.contains('mir-win') || (n.classList.contains('dev') && n.classList.contains('floating') && !n.classList.contains('closed'))) && !n.classList.contains('mir-transport-free'));
      if (!open.length) return false;
      const t = document.getElementById('transport'); if (!t || !t.classList.contains('mini') || t.dataset.place === 'free') return false;
      const b = t.getBoundingClientRect(); if (!b.width) return false;
      const room = Math.max(b.top - 52 * (cssZoom(t) || 1), innerHeight - b.bottom);   // 039 V1: the taller of the two bands beside the bar's seat
      return open.some((n) => { const r = n.getBoundingClientRect(); return r.width > 0 && (r.height > room || n.dataset.seat === 'over') && hits(r, b); });
    };
    const under = (on) => document.body.classList.toggle('transport-under', !!on || floatOver());
    /* 039 V2 · A SUMMONED WINDOW CLEARS THE BAR, THE LOGO AND THE OPEN WORK BAR (the walks: NODES over the logo and 17 bar buttons, RENDER over the
       bar's right half, FOLDERS over CAMERA and the timeline's chips): a window that opens — a kit window a menu, a key, a bar button or a restore
       shows, a card floated off its rack by anything but a hand's drag (FILE › RENDER…), the notebook — moves once to the seat nearest its own that
       covers neither the bar (its PLAY and mini-viewer), nor the λWAVES logo and the menu row's band, nor an open TIMELINE or MODULATION and their
       rails, nor a rack column where the stage has the room (summon.js clearSeat; the order under `fit`).  A window with no seat at all keeps the one
       it opened in and lies over the bar as V1 lets a tall one (`data-seat="over"`).  The work bars and PATTERN keep their own seats (the
       magnet, the dock, the dodge, the anchor); a hand's later drag is never undone while the window stays open.  Measured by layout (offset*,
       never the entrance's scale), in the observer's microtask, before the window is painted where it opened */
    const laid = (e) => { const p = e.offsetParent, o = p ? p.getBoundingClientRect() : { left: 0, top: 0 }, z = cssZoom(e) || 1, l = o.left + e.offsetLeft * z, tp = o.top + e.offsetTop * z;
      return { left: l, top: tp, right: l + e.offsetWidth * z, bottom: tp + e.offsetHeight * z }; };
    const spanOf = (rs) => (rs.length ? { left: Math.min(...rs.map((r) => r.left)), top: Math.min(...rs.map((r) => r.top)), right: Math.max(...rs.map((r) => r.right)), bottom: Math.max(...rs.map((r) => r.bottom)) } : null);
    const railOf = (n) => { const w = windowOf(n), r = w && w.pair && w.pair.rail; return r && !r.hidden && r.offsetWidth ? r : null; };
    const workRoots = () => [document.querySelector('[data-mir-window="timeline"]'), app.state.modView && app.state.modView.root].filter(Boolean);
    const nbEl = document.getElementById('notebook'), seated = new WeakSet();
    let pressed = false;   // a card added to the float layer under a pressed pointer is a hand's detach: never moved
    addEventListener('pointerdown', () => { pressed = true; }, true);
    for (const k of ['pointerup', 'pointercancel']) addEventListener(k, () => { pressed = false; }, true);
    const summoned = (n) => !!n && !n.hidden && n.offsetWidth > 0 && (n === nbEl || (n.classList.contains('mir-win') && !n.classList.contains('mir-transport-free'))
      || (n.classList.contains('dev') && n.classList.contains('floating') && !n.classList.contains('closed') && n.dataset.id !== 'transport')) && !workRoots().includes(n) && n.dataset.mirWindow !== 'pattern';
    function seatOpen(n, floor = { h: 280, w: 300 }) {
      const kit = n.classList.contains('mir-win') ? windowOf(n) : null; if (kit && typeof kit.place !== 'function') return;
      const pane = laid(n), rail = kit ? railOf(n) : null, box = spanOf([pane, ...(rail ? [laid(rail)] : [])]), s = barSpan(), title = document.getElementById('title');
      const door = [s, title && title.offsetWidth ? title.getBoundingClientRect() : null].filter(Boolean), work = workRoots().filter((r) => !r.hidden && r.offsetWidth).flatMap((r) => [laid(r), ...(railOf(r) ? [laid(railOf(r))] : [])]), hard = [...door, ...work];
      const soft = document.body.classList.contains('rack-hidden') ? [] : racksEl.filter((rk) => [...rk.children].some(shownCard)).map((rk) => rk.getBoundingClientRect()).filter((r) => r.width);
      const view = { width: innerWidth, height: innerHeight }, top = 52 * (cssZoom(title) || 1), ph = pane.bottom - pane.top, pw = pane.right - pane.left, rim = box.bottom - box.top - ph, wim = box.right - box.left - pw;
      /* the full size first, then shorter (6 % a step, never below 280 px, the tallest minimum of the windows that come here) and narrower (4 % a step,
         three at most, never below 300 px): clear of everything; then of all but the rack columns; then — a stage too small for a work bar and a window
         beside it (1000 × 700 with the TIMELINE) — of the bar and the logo alone, with the racks and without.  A floated card keeps its size (V3 folds RENDER) */
      const sizes = (kit || n === nbEl) ? 12 * 4 : 1;
      const fit = (avoid) => { for (let i = 0; i < sizes; i++) { const k = i >> 2, j = i & 3, hh = Math.floor(ph * (1 - k * 0.06)), ww = Math.floor(pw * (1 - j * 0.04)); if (i && (hh < floor.h || ww < floor.w)) continue;
        const at = clearSeat({ ...box, right: box.left + wim + ww, bottom: box.top + rim + hh }, { avoid, view, top }); if (at) return { at, h: k ? hh : 0, w: j ? ww : 0 }; } return null; };
      const got = fit([...hard, ...soft]) || fit(hard) || fit([...door, ...soft]) || fit(door);
      if (n.dataset.seat === 'over') delete n.dataset.seat;
      if (!got) { if (s && hits(box, s)) n.dataset.seat = 'over'; return; }   // no room on this stage: it stays where it opened, over the bar (021 V3)
      const { at, h, w } = got; if (at.left === Math.round(box.left) && at.top === Math.round(box.top) && !h && !w) return;
      const z = cssZoom(n) || 1, x = pane.left + at.left - box.left, y = pane.top + at.top - box.top;
      if (kit) { kit.place({ left: x / z, top: y / z, ...(h ? { height: h / z } : {}), ...(w ? { width: w / z } : {}) });
        const was = laid(n), wh = was.bottom - was.top, wd = was.right - was.left;   // the kit's floor (min) can be above ours: once more from there, never shorter than it
        if (floor.h === 280 && ((h && wh > h + 2) || (w && wd > w + 2))) seatOpen(n, { h: Math.ceil(wh), w: Math.ceil(wd) }); }
      else if (n === nbEl) { const o = n.offsetParent ? n.offsetParent.getBoundingClientRect() : { left: 0, top: 0 }; n.style.left = (x - o.left) / z + 'px'; n.style.top = (y - o.top) / z + 'px'; if (h) n.style.height = h / z + 'px'; if (w) n.style.width = w / z + 'px'; }
      else app.sh.layout.moveFloat(n.dataset.id, x, y);
    }
    const seatNew = (gone = []) => {
      for (const n of gone) if (n.nodeType === 1 && n.parentElement !== floatsEl) seated.delete(n);
      for (const n of [...(floatsEl ? floatsEl.children : []), nbEl]) {
        if (!summoned(n)) { if (n) seated.delete(n); continue; }
        if (seated.has(n)) continue; seated.add(n);
        if (n.classList.contains('dev') && pressed) continue;
        try { seatOpen(n); } catch (_) {}   // a seat is a courtesy: never a thrown open
      }
    };
    if (nbEl) new MutationObserver(() => seatNew()).observe(nbEl, { attributes: true, attributeFilter: ['hidden'] });
    if (floatsEl) {   // a float opened, closed, moved or resized: ask again, once a frame
      let booked = 0; const book = () => { if (!booked) booked = requestAnimationFrame(() => { booked = 0; if (!trMoving) under(blocked); }); };
      const mo = new MutationObserver((list) => { const gone = []; for (const m of list) { for (const n of m.addedNodes || []) if (n.nodeType === 1) watch(n); gone.push(...(m.removedNodes || [])); } seatNew(gone); book(); });
      const watch = (n) => mo.observe(n, { attributes: true, attributeFilter: ['hidden', 'style', 'class'] });
      mo.observe(floatsEl, { childList: true }); for (const n of floatsEl.children) watch(n);
      addEventListener('resize', book);
    }
    function modDodge(rect, who = 'mod') {
      /* 0.5.0 C4: the kit's close reports null, and its place() reports the real box even while closed (λWAVES' copy sent the
         zero rect): a window that is not open has nothing to dodge */
      const was = dodging[who];
      dodging[who] = rect && (who === 'mod' ? app.state.modView && app.state.modView.isOpen : app.state.tl && app.state.tl.isOpen()) ? rect : null;
      if (!clearBooked) clearBooked = requestAnimationFrame(clearRack);   // 039 V2: the top seat's clear stops above an open work bar
      if (who === 'tl' && !was && dodging.tl && cycle('tl')) return;   // 016 W5: the timeline opened where the two cannot stack — the window gave way
      if (who === 'tl') magnetSeat();   // 015 T5: the modulation window follows the timeline it sits on
      const rs = Object.values(dodging).filter(Boolean), free = (s, w, h) => !rs.some((r) => hits(seatRect(s, w, h), r));
      occlusion.dirty();   // a paused field still has to move its line masks with the window
      const t = document.getElementById('transport');
      if (!t || !t.classList.contains('mini') || t.dataset.place === 'free') { blocked = false; under(false); return; }   // iteration 014 A4: the FREE window is the hand's, never dodged
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
      if (!rs.length && trSeat === (narrowNow() ? 'top' : 'bottom')) { blocked = false; under(false); return; }   // 034 F3: nothing to dodge and the bar at home
      const box = t.getBoundingClientRect();
      const w = box.width || 560, h = box.height || 34;
      const narrowRack = matchMedia('(max-width: 860px)').matches;
      if (narrowRack) trSeat = 'top';
      const want = narrowRack ? 'top'
                 : free('bottom', w, h) ? 'bottom'                 // 034 F3: home while the bottom is free
                 : free('top', w, h) ? 'top' : trSeat;
      blocked = !free(want, w, h); under(blocked);
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
          t.removeEventListener('animationend', done); t.style.animation = ''; trMoving = false; under(blocked); };   // 021 V3: landed, the floats asked again
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
    /* iteration 016 W5 · THE MAGNET CYCLES (Josh, call 8: "CYCLE (one at a time) rather than stack or swap — two at once is too much even on a large
       screen" when they do not fit): when the TIMELINE's height and the modulation window's (with the stack's 8 px) exceed the stage's, opening one
       closes the other — the CSB latch, the door, a key or a menu alike; a stage that holds both keeps 015 T5's magnet.  → true when it closed one */
    function cycle(opened) {
      const mv = app.state.modView, tl = app.state.tl;
      if (!mv || !mv.isOpen || !tl || !tl.isOpen() || !dodging.tl) return false;
      /* the stage's height less the menubar's seat (the kit window's 52 px top clamp) and, on the stage, the control surface with its margin */
      const t = document.getElementById('transport'), bar = t && t.classList.contains('mini') && t.dataset.place !== 'free' && !document.body.classList.contains('rack-hidden') ? t.offsetHeight + 12 : 0;
      const stage = ((dom.canvas && dom.canvas.getBoundingClientRect().height) || window.innerHeight) - 52 - bar;
      if ((dodging.tl.bottom - dodging.tl.top) + mv.root.offsetHeight + 8 <= stage) return false;
      if (opened === 'tl') mv.close(); else tl.close();
      return true;
    }
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
      onOpen: () => { magnet.released = false; if (!cycle('mod')) magnetSeat(); },   // 015 T5: every open meets the magnet afresh; 016 W5: or closes the timeline that cannot hold it
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
/** 036 P6 · THE ENVELOPE TRIGGER (Josh: "the event's envelope-trigger feature (I think it's built in Basins) is missing in Lambdawaves, Add that
 *  feature in"): BASINS' ENV + PATTERN road, vendored in the kit (pattern/window.js · sequencer.js · model.js), installed on λWAVES' one modulation
 *  host.  PATT on every ENV face opens the PATTERN window (one step row per ENV, a 16th a step, FL's channel rack); the sequencer rides the host
 *  clock's one advance notice and fires each lit step's ENV (its velocity scales the ENV's macros), a PATTERN clip under the playhead ruling its ENV
 *  (an ENV's → TL sends one).  The rows are the PROJECT's inside λWAVES' one part — `presentation.pattern`, default-absent (shell/persist.js);
 *  `project: false` keeps the kit's own 'pattern' part out (projects.js' ONE PART law) — undone on the one stack as their own snapshot domain, a
 *  row edit dirtying the project; the window's shape is the WORKSPACE record `lambdawaves.q0.patternwin`.  rack.js seats it after the history. */
export function installEnvelopeTrigger(app) {
  const { layout } = app.sh, H = app.state.history, host = app.state.modHost;
  if (!host || !app.state.modView) return null;
  const pat = installPattern({ mount: document.getElementById('floats') || document.getElementById('lab'), project: false, storageKey: 'lambdawaves.q0.patternwin',
    history: H ? { hold: (n) => H.hold(n), release: () => H.release(), register: (d, io) => H.stack.register(d, io) } : null,
    dock: { span: dockSpan, guide: () => app.ctl.look.get('dropGuides') },
    mod: { host, view: app.state.modView, onTick: (fn) => host.clock.onAdvance(() => fn()), open: () => layout.modulation.expand(),
      timeline: () => (app.state.tl ? { model: app.state.tl.model } : null) } });
  pat.model.subscribe((why) => { if (why === 'edit' && layout.projects) layout.projects.changed(); });
  layout.pattern = { model: pat.model, win: pat.win, get open() { return pat.isOpen(); }, show: (envId) => pat.show(envId), close: () => pat.close(), toggle: () => pat.toggle(), rows: () => pat.rows() };
  return pat;
}
