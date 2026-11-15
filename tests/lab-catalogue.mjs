/* lab-catalogue.mjs — λWAVES' own modulation catalogue, for tests/mir.test.mjs alone (044 K5).
 *
 * This block lived in the kit (mir/modulation/host.js) until MIR 1.6.0-alpha.57, THE KIT HOLDS NO APP'S CATALOGUE: sixteen λWAVES
 * target ids as a function of a port (labParameters), three λWAVES presets and their readers.  No module of lab/ ever imported it
 * (the rack registers its own adapters: lab/mod-port.js); the one reader was the suite beside this file, so the block came home
 * with it, byte for byte below this header.  It is a test helper: it is not precached and nothing in lab/ may import it. */
import * as M from '../lab/mir/modulation/mod.js';

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
    add('observer.fov', { label: 'FOV', map: 'linear', min: 0.2, max: 1.6, group: 'observer', ...field(p.obs, 'fov') });   // tr[FOV]: field of view: how wide the camera sees
  }
  if (p.mat) {
    add('material.exposure', { label: 'EXPOSURE', map: 'log', min: 0.05, max: 20, group: 'material', ...field(p.mat, 'exposure') });
    add('material.softness', { label: 'SOFTNESS', map: 'linear', min: 0, max: 1, group: 'material', ...field(p.mat, 'softness') });
    add('material.iso', { label: 'ISO', map: 'log', min: 1e-4, max: 1, group: 'material', ...field(p.mat, 'iso') });
    add('material.grain', { label: 'GRAIN', map: 'linear', min: 0, max: 1, group: 'material', ...field(p.mat, 'grain') });
    add('material.knee', { label: 'KNEE', map: 'linear', min: 0, max: 1, group: 'material', ...field(p.mat, 'knee') });   // tr[KNEE]: the bend in the picture's tone curve where the highlights start to roll off (as in a compressor's knee)
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
    add('transport.window', { label: 'time span::WINDOW',   // tr[time span::WINDOW]: a span of time (in seconds) the view looks across, not an interface window
    map: 'log', min: 0.1, max: 1000, group: 'transport', ...field(p.clock, 'window') });
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
        { id: 's1', kind: 'lfo', on: 1, label: 'LAP', shapeMode: 'wave', wave: 'rotate',   // tr[LAP]: a demo LFO's name: it moves the camera one lap round per bar (the user can rename it)
          sync: 1, mult: 0, triplet: 0, dotted: 0,
          ratePos: 0.39, phaseOff: 0, smooth: 0, steps: 0,
          trig: 0, anchor: 1, invert: 0, minimized: 0 },
        /* the rise: one raised cosine per lap, on the SAME bar, so the two close together */
        { id: 's2', kind: 'lfo', on: 1, label: 'RISE', shapeMode: 'wave', wave: 'sine',   // tr[RISE]: a demo LFO's name: it moves the camera up and down (the user can rename it)
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
    hint: 'Step through twelve density levels to reveal shells.',   // tr: shells: the nested surfaces of equal density in the picture (like the layers of an onion)
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
        { id: 's1', kind: 'lfo', on: 1, label: 'TURN', shapeMode: 'wave', wave: 'rotate',   // tr[TURN]: a demo LFO's name: it turns the picture once per bar (the user can rename it)
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
