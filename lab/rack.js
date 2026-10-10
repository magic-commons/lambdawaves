import { waitForPaint } from './frame-settle.js';
import { installWakeLock } from './mir/core/wakelock.js';   // 0.5.0 C6b: the screen stays on while THE play plays
import { reworkNative, planeModel } from './native-ui.js';
import { firstRunMaterial, firstRunQuality } from './first-run.js';   // W125: the first-run material follows the device · PACE P2: so does the first-run quality, and a saved one keeps within the device
/* rack.js — the instrument: the windows, the work-tier router, the four clocks, the transport.
 *
 *   STATE → EVOLUTION → OBSERVABLE FIELD → OBSERVER → RENDER        (§52)
 *
 * Tiers (§13):  PRESENT < RECONSTRUCT < EVOLVE < REBUILD.  Every cause asks for a tier; one
 * animation frame coalesces to the strongest and does exactly that much.  Idle is ZERO work:
 * when nothing plays, nothing spins and nothing is pending, no frame is scheduled (§45).
 * Four clocks (§12): the physics clock is the Clock (exact logical time); the field clock is the
 * reconstruction cadence (cappable, never alters c); the camera clock is observer motion; the
 * presentation clock is the display rate.  Observer controls never touch the register (§14).
 */
import { DEFAULT_PALETTE } from './palette-app.js';   // Jet Black: the app's palette row, appended to the kit's catalogue before anything reads it (KIT BRIEF J)
import { BASIS, domainFor, psiAt, orbitalFromTable } from './hydrogen.js';
import { Register, PRESETS, PRESET_BY_ID, RENDER_CAP } from './state.js';
import { Clock, onePlay } from './clock.js';
import { createWindowActivity } from './mir/window-activity.js';
import { paintedRect } from './occlusion.js';   // 0.5.0 A7: the occlusion providers (KIT BRIEF 8's twin)
import { VIEW, VIEW_NAMES, STYLE, cameraBasis, toScreen, cameraKey, quatFromYawPitch } from './field.js';
import { el, knob, sw, seg, trig, readout, device as kitDevice, group, cssRGB, accentRGB, parseCssColor, mathPlain } from './mir/kit.js';
import { MOLECULE_BY_ID, moleculeAtoms } from './molecules.js';
import { ELEMENT } from './md.js';
import { createInfoLayer } from './mir/info/layer.js';   // 0.5.1 D1: the STAGE TEXT is one block of the kit's INFORMATIONAL layer
import { isField } from './mir/core/pointer.js';                       // 0.5.1 D2: the head's Escape, as the kit's greet reads it
import { createSpectrumCard } from './windows/spectrum.js';   // 0.5.2 R2a: the SPECTRUM card, out of boot()
import { createMeters } from './meters.js';
import { createShadowView, createShadowFoot } from './shadowview.js';
import { createLadder } from './ladder.js';
import { createOrbit } from './orbit.js';
import { createVortex } from './vortex.js';
import { createParticles } from './particles.js';
import { createKepler } from './keplerview.js';
import { createFilm } from './render-exact.js';   // 0.5.0 C7: the film is MIR's recorder with λWAVES' frame
import { createFilmCard } from './film-card.js';   // 0.5.0 C7b: the film's UI is the kit's RENDER card
import { createKeyTable } from './key-table.js';    // 0.5.0 C3: ACTIONS on MIR's ONE KEY TABLE (keys.js and shortcuts.js left)
import { keplerOrbits } from './kepler.js';
import { createGas } from './gas.js';
import { densityPeriod, densityPeriodExact, fmtPeriod } from './period.js';
import { createCapture, maxPictureSize } from './capture.js';
import { createChem } from './chemview.js';   // wave CHEMISTRY: the RHF · real-time window (contract B-H2O-8)
import { createRegister } from './registerview.js';   // REGISTER: one window, two registers — ORBITAL (orbitalsview.js, MATH-H2O Proposition 1) and STATES (statesview.js, the many-electron TD-CIS register)
import { createMolecularSession } from './molecular-session.js';   // the ONE owner of the molecular volume (MOLECULAR WAVES stage 1)
import { solveLadder } from './ladder-model.js';
import { createCalculus } from './calculusview.js';
import { calculusMarkdown } from './calculus.js';
import { createRampPanel } from './mir/panels/ramp.js';   // 0.5.0 C1: the phase palette's editor (paletteview.js left)
import { createSliceView } from './sliceview.js';
import { createAtoms } from './atomsview.js';
import { createWigner } from './wignerview.js';
import { createRadiation } from './radiationview.js';
import { toLUT, PRESET_BY_ID as PALETTE_BY_ID, PRESET_GROUPS, rgbToHex, hexToRgb, contrastRatio } from './mir/palette.js';   // N6: the kit's copy (lab/palette.js differed only in two comment lines)
import { momentumZ, rotorsToZ } from './kick.js';
import { getHamiltonian, setHamiltonian, HAMILTONIANS, setZ, getZ } from './hamiltonian.js';
import { createStateCard } from './windows/state.js';   // 0.5.2 R2a: the STATE card, out of boot()
import { stateLatex, moleculeHead, mdText, formulaLatex, BASIS_LABEL } from './latex-state.js';   // 0.3.3 · wave 135: SPECTRUM's ⧉ and EDIT › COPY the state as LaTeX; 0.4.0 S0: the molecule's page; 0.5.1 D2: its head
import { wellPacket, wellCentroid } from './well.js';
import { applyRotor as rotorOnCopy } from './frontier.js';
import { createSettings } from './shell/settings.js'; import { createPersist } from './shell/persist.js'; import { createLinks } from './shell/links.js'; import { createHistory } from './shell/history.js';   // 0.5.2 R3a (edit-domain.js left with the history)
import { CAM, createCameraLaw, clampShift } from './camera-law.js';   // wave 130 seam 11: the camera law and the observer's pose, out of boot()
import { createCameraPanel } from './mir/panels/camera.js';           // 0.5.0 C1: the CAMERA card's rows are the kit's panel over the law's port
import { createModulation } from './mir/modulation/window.js';   // 0.5.0 C4: the kit's window controller (MIR 1.5), over A5's port
import { createCurvesPanel } from './mir/panels/curves.js';     // 0.5.1 D10-24: the CURVES card's rows are the kit's panel over the stage canvas
import { createSettingsStore } from './settings-store.js';   // 0.5.0 A1: the settings blob's one door
import { createMotionPref } from './motion-pref.js';   // N7 seam 1: the reduced-motion law, out of boot()
import { createController } from './shell/controller.js';   // 0.5.2 R1: ONE CONTROLLER · FIELD · THE MATHS WORKERS · ONE ROAD, out of boot()
import { CARD_GROUND } from './look.js';    // 0.5.0 C2: the look is the kit's — mir.gui (createPrefs over LOOK_SCHEMA rows) and createAccent (once N7 seam 4, accent-wheel.js)
import { createSwClient } from './sw-client.js';        // N7 seam 5: the install layer's interface half, out of boot()
import { createBadges } from './badges.js';             // N7 seam 6: the badges and the canvas's sentence, out of boot()
import { createTransport } from './shell/transport.js'; import { createRackWiring } from './shell/rack-wiring.js'; import { createNotebook } from './shell/notebook.js'; import { createKeys } from './shell/keys.js';   // 0.5.2 R3b (createRack, createMenubar, installWindowChrome left with them)
import { readLink, LINK_CHAR_CEILING } from './statelink.js';   // wave 56: every state of this lab is a LINK

/* THE BUILD STAMP — one constant, and every wave updates it.  The ABOUT face and its copy dump both read it here;
   nothing else in the app hand-writes a version, so a stale line can only come from forgetting THIS line. */
export const BUILD_LINE = '0.5.1-alpha · Informational Update · 2026-10-09';   // THE ONLY PLACE THE NUMBER LIVES: the ABOUT face, the copy dump and the proof all read it back through LW.build (ANTI-PATTERN 6)

export const TIER = { NONE: 0, PRESENT: 1, RECONSTRUCT: 2, EVOLVE: 3, REBUILD: 4 };
const TIER_NAME = ['NONE', 'PRESENT', 'RECONSTRUCT', 'EVOLVE', 'REBUILD'];

export async function boot(dom) {
  const DEVICES = new Map(), device = (o) => { const d = kitDevice(o); DEVICES.set(o.id, d); return d; };   // 0.5.0 C3: the rack registers each card with its device(), so its fold is called, never re-clicked
  const reg = new Register();
  /* UNDO / REDO: the ring (`app.state.history`) is built at the foot of boot(), once every path it writes through exists; hNote() is
     the "an edit may have happened" ping for the few register-side setters that do not bump reg.version */
  const hNote = () => { if (app.state.history) app.state.history.note(); };
  const clock = new Clock(), appPlay = onePlay(clock);   // 0.5.0 A6: THE play (clock.js) — every road that plays or pauses the physics clock is its edge


  const obs = { yaw: 0.65, pitch: 0.38, dist: 3.3, fov: 0.6, mode: 'free', quat: quatFromYawPitch(0.65, 0.38), shift: [0, 0] };   // wave 54: TURNTABLE reads (yaw, pitch); FREE reads `quat` and the angles become a READOUT; 0.4.0 S2: `shift`, the pivot's place on the frame (NDC)
  const mat = { view: VIEW.phase, exposure: 1, softness: 0.7, steps: 160, slice: { mode: 0, axis: 2, pos: 0, thick: 0.03 }, hueShift: 0, invert: false, frame: true, axis: true, axisInk: 'theme', paletteOn: false, style: STYLE.cloud, iso: 0.06, grain: 0.35, knee: 0.6, dither: 0, boost: { k: [0, 0, 0], on: false }, bg: [0.028, 0.038, 0.058], gamma: 1, lightUI: false, finish: 'lit' };   // S3: 'lit' from the boot, as restore() writes it
  const FIELD_CHROME = ['frame', 'axis', 'frameMode', 'axisMode', 'cornerSide', 'invert', 'axisInk'];   // 0.3.1 · S1 (D1): the reader's measurement furniture — PREFERENCE, never in a project or a link (docs/STATE-SCOPES.md)

  const rates = new Float64Array(91).fill(1);
  const energyOf = (a) => getHamiltonian().energy(a) * rates[a];


  const sturm = { on: false, lambda: 1, P: null, rec: null, buildMs: 0, roVersion: -1 };
  const labelExpect = (a) => sturm.P.H[a * 91 + a] / sturm.P.S[a * 91 + a];          // a label's ⟨a|H|a⟩/⟨a|S|a⟩ under the scale — NOT an eigenvalue
  /* WAVE 54 · THE KEY MOVED UP, and it had to.  readSettings() is a function declaration and hoists, but the
     const it reads did NOT — it sat 90 lines below this and every early call fell into readSettings' own catch and
     came back {}.  A silent {} is exactly the shape of "this browser has never said anything", so the palette this
     browser HAD chosen was read as no choice at all and the default won every reload.  One declaration, at the top,
     above the first reader. */
  const settingsStore = createSettingsStore();   // 0.5.0 A1: `lambdawaves.q0.settings` through lab/settings-store.js (read / write / remove)
  const useCompactDefaults = readSettings().nativeLayout === 1 || !Array.isArray(readSettings().closed);
  /* 0.3.1 · S1 (D2, docs/STATE-SCOPES.md): THE PALETTE IS PROJECT STATE.  The boot wears the shipped default and a project
     (or a link) brings its own; a `palette` an older build left in this browser's settings is never read. */
  const PAL_DEF = DEFAULT_PALETTE;
  /* THE PHONE SENTINEL (wave 51).  skin.css's LAST block raises `--phone` to 1 at a (hover: none) + size
     pair; the breakpoint is written THERE, once, and this reads it back out of the computed style — exactly
     as the peek handler already reads --rack-w — so the script can never disagree with the stylesheet about
     what a phone is.  What CSS cannot do is move a card between racks, dock the transport, cap the device
     pixel ratio or pick a grid; that is all the phone module below does. */
  const isPhone = () => (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--phone')) || 0) >= 1;
  /* THE TABLET: the iPad (its UA, or the Mac-reporting iPad with touch points), or a coarse, hover-less pointer on a screen
     at least 600 px on its short side — and never a phone.  syncPhone() reads it on every crossing (the DPR and step caps);
     the first-run material below reads it once, at boot. */
  const isTablet = () => { try {
    const ipad = /iPad/.test(navigator.userAgent || '') || ((navigator.platform || '') === 'MacIntel' && navigator.maxTouchPoints > 1);
    const coarse = matchMedia('(hover: none) and (pointer: coarse)').matches;
    return !isPhone() && (ipad || (coarse && Math.min(innerWidth, innerHeight) >= 600));
  } catch (_) { return false; } };
  /* W125 (Josh, 2026-09-25) · THE FIRST-RUN MATERIAL FOLLOWS THE DEVICE: a desktop's is REFRACTIVE + FROST ALWAYS, a phone's
     or a tablet's is TINTED + FROST OFF (first-run.js, a pure function of this one answer).  It is only the DEFAULT —
     what a browser that has never said anything gets; a stored choice always wins (0.5.0 C2: the look store's `defaults`). */
  const FIRST_RUN = firstRunMaterial(isPhone() || isTablet());
  /** WAVE 101 · is this an Apple display?  Used for ONE first-run default (the colour gamut) and for
   *  nothing else — no capability is inferred from it, and a saved choice always wins. */
  const appleDevice = () => { try {
    const ua = (navigator.userAgent || '') + ' ' + (navigator.platform || '') + ' ' + (navigator.vendor || '');
    return /iPhone|iPad|iPod|Macintosh|Mac OS X/i.test(ua);
  } catch (_) { return false; } };
  /* 0.5.0 C2 · λWAVES' HOME LOOK, the look store's `defaults` (lab/look.js, `mir.gui`): light, the device's first-run card and
     frost (W125), 22 px blur, 50 % VIVID, disconnected cards.  A browser that has never chosen wears these; a stored choice wins.
     The phone crossing's FROST OFF is a later, separate law (enterPhone). */
  const LOOK_DEFAULTS = { theme: 'light', card: FIRST_RUN.card, frost: FIRST_RUN.frost, blur: 22, vivid: 0.5, disconnected: true };
  /* THE CONTEXT (0.5.2 R0 · research/release-0.5.2/PLAN.md §1, G-A): `app`, the one object a module is handed.  Fixed-shape namespaces,
     each ONE literal with every key, never extended, never Object.assign-ed into, never deleted (V8 makes a literal of 128 keys or more a
     dictionary, so none is that large).  The keys are every boot-level name the planned cut makes cross a module (`node tools/rack-deps.mjs
     --classes`).  A const or function keeps its name and sits here by value where the value exists at this line (§0's consts, the hoisted
     functions that never move, and readSettings, which §0 calls first — U1); null until the row that moves a reader fills it at its owner's
     seat.  Every SHARED let lives in `state`: read and written live as app.state.x, never destructured.  `ui` is the one flat registry. */
  const ui = {};
  const app = {
    dom, ui, device, DEVICES, reg, hNote, clock, appPlay, obs, mat, FIELD_CHROME, rates, energyOf, sturm, labelExpect, settingsStore, useCompactDefaults, PAL_DEF, isPhone, isTablet, FIRST_RUN,
    appleDevice, LOOK_DEFAULTS,
    hooks: { theme: null, restage: null, setStageColour: null, setStageFollow: null, setStage: null, setGamut: null, setTheme: null, ab: null, slap: null, period: null, keys: null, warning: null },
    state: { history: null, palette: null, molFormulaScale: 1, space: 'x', playedLast: false, uiHidden: false, pointerHeld: false, metersWall: 0, govVersion: -1, keplerDirty: true, badgesWall: 0,
      applyVisuals: true, modView: null, modHost: null, modWall: 0, tl: null, modExpOn: null, dodge: null, filmCard: null, feedMs: 0, rotMoved: false, rotTicking: false, audioCap: null, modArm: true,
      occludeDirty: true, occludeAt: 0, stageMix: 0.04, stageFollow: true, refSnapshot: null, pendingRef: null, warmTimer: 0, warmIdle: 0, dragging: false, cornerLayoutDirty: true,
      exportLocked: false, histShown: null, lastNmax: 1, capApi: null, camKnobs: null, exporter3d: null, flowEpoch: null, chem: null, restampParams: null, molSession: null, register: null,
      orbitals: null, states: null, stageText: null, bow: null, bowInFlight: 0, bowChain: null, kdrag: null, gasWidth: 1.8, gasAxial: false, lastLaunch: null, restoreNotice: '', linkLast: null },
    loop: { schedule, hold: null, resetWall: () => { lastWall = performance.now() / 1000; }, page: null, loopRing: null, ringMedian: null, windowActivity: null, canPresent: null, modesAt, refModes,
      meterSnapshot, paceRate: null, MOTION: null },
    host: { camera: null, orbitBy: null, camTravel: null, queueKeyOrbit: null, camLevel: null, syncFreeAngles: null, setCamMode: null, cameraPort: null, resetView: null, zoomAt: null, panBy: null,
      setDist: null, setFov: null, syncCamUI: null, rack: null, hydroReader, swClient: null, rackL: null, LAYOUT_SLOTS: null, floats: null, warning: null },
    w: { wObs: null, wPal: null, wCam: null, wClip: null, clearRegister: null, wState: null, wSpec: null, spectrum: null, toggleFullscreen: null, normalizeNow: null, copyLatex: null,
      switchHamiltonian: null, setSturmian: null, applySturmian: null, paintSturmRo: null, sturmEigen: null, occupiedEigen: null, periodEnergies: null, selectEigen: null, setElement: null,
      fillValence: null, wSh: null, shadowView: null, shadowFoot: null, wOrb: null, orbit: null, kepler: null, wVor: null, vortex: null, particles: null, flowTracers: null, wSlice: null, slice: null,
      wChem: null, head: null, stageCaption: null, stageTextTick: null, initStageText: null, wOrbs: null, wCalc: null, calculus: null, wMet: null, meters: null, wLad: null, ladder: null, wAtoms: null,
      atomsView: null, wWig: null, wignerView: null, wRad: null, radiationView: null, WIG_OK: null, RAD_OK: null, bowStart: null, bowMove: null, bowRelease: null, orbitOfShell: null, kepShell: null,
      keplerTurn: null, keplerDragToPoint: null, keplerDragTo: null, keplerRowSync: null, gas: null, gasReadout: null, gasTableOn: null, gasSigma: null, launchPacket: null, enterBox: null,
      coherentBounce: null, bowCancel: null, slapAlong: null },
    ctl: { autoQ: null, controlStep: null, RES_LADDER: null, gov: null, effectiveRes: null, READER_LAW: null, keep: null, domain: null, fieldRate: null, perf: null, frameBudget: null,
      perfBudgetMs: null, tick: null, READERS: null, may: null, unpark: null, setGovernor: null, setKeepFrames: null, setPerfMode: null, stats: null, cRe: null, cIm: null, mod: null, MOD: null,
      modSyncBases: null, feedAudio: null, modHand: null, setKnob: null, modGets: null, modKnobs: null, modHeld: null, ROT_LIMIT: null, rotRate: null, rotDriving: null, setRotationRate: null,
      rotStep: null, modStore: null, saveMod: null, curvesStore: null, occlusion: null, look: null, applyAccent: null, paintMarks: null, markBatchBegin: null, markBatchEnd: null, wheelColor: null,
      accent: null, inkCtx: null, markInk: null, stageGround: null, busyWrap: null, busyFlash: null, busy: null, busySync: null, cardLoading: null, busyHost: null, field: null, maths: null,
      scan: null, cards: null, solveChem: null, solveCard: null, cancelWarm: null, warmArm: null, touchState: null, loadPreset: null, setReference: null, api: null },
    sh: { readSettings, saveSettings: null, setCardStyle: null, setFrost: null, setDisconnected: null, lookSync: null, applySettings: null, KIND: null, RETIRED_WINDOWS: null, powered: null,
      DIGESTS: null, quality: null, transport: null, togglePlay: null, setModArm: null, barLock: null, refreshOcclusion: null, devById: null, rackCardWidth: null, popFace: null, rk: null,
      layout: null, winHint: null, wTr: null, phone: null, tablet: null, syncPhone: null, keyState: null, keyHelp: null, stageHasFocus: null, ACTIONS: null, kt: null, modSeats: null, serialize: null,
      restoreModulation: null, save: null, copyJSON: null, restore: null, notCarriedWords: null, esc: null, mintLink: null, copyLink: null, openLink: null, historyApi: null, LW: null },
  };
  function readSettings() { return settingsStore.read(); }   // 0.5.2 R3a: §1's reader stays in the head — §0 calls it first (U1), app.sh holds it by value
  /* ── SETTINGS: what this browser remembers — lab/shell/settings.js (0.5.2 R3a), created here ── */
  const { saveSettings, setCardStyle, setFrost, setDisconnected, applySettings, KIND, RETIRED_WINDOWS, powered, DIGESTS } = createSettings(app);
  const quality = { ...firstRunQuality(isPhone() ? 'phone' : isTablet() ? 'tablet' : 'desktop'), auto: true, autoScale: 1, minScale: 0.35 };   // PACE P2: 64³ × 160 × 1 on a desktop (and a phone, whose crossing has its own rule), the GRID pairing 64³ × 110 × 0.75 on a tablet
  app.sh.quality = quality; app.sh.saveSettings = saveSettings; app.sh.setFrost = setFrost; app.sh.KIND = KIND; app.sh.RETIRED_WINDOWS = RETIRED_WINDOWS; app.sh.DIGESTS = DIGESTS;   // 0.5.2 R3b: the shell modules' reads
  /* ── ONE CONTROLLER · FIELD · THE MATHS WORKERS · ONE ROAD: lab/shell/controller.js (0.5.2 R1), created here; the loop stays below ── */
  const { autoQ, controlStep, RES_LADDER, gov, effectiveRes, READER_LAW, keep, domain, fieldRate, perf, frameBudget, perfBudgetMs, tick, READERS, may, unpark, setGovernor, setKeepFrames,
    setPerfMode, stats, cRe, cIm, mod, MOD, modSyncBases, feedAudio, modHand, setKnob, modGets, modKnobs, modHeld, ROT_LIMIT, rotRate, rotDriving, setRotationRate, rotStep, modStore, saveMod,
    curvesStore, occlusion, look, applyAccent, paintMarks, markBatchBegin, markBatchEnd, wheelColor, accent, inkCtx, markInk, stageGround, busyWrap, busyFlash, busy, busySync, cardLoading,
    busyHost, field, maths, scan, cards, solveChem, solveCard, cancelWarm, warmArm, touchState, loadPreset, setReference, api } = await createController(app);

  /* ── THE BACKGROUNDED TAB (wave 54, board #42) ──────────────────────────────────────────────────────────────
   * WHAT IS AND IS NOT A WIN, measured in this browser rather than assumed:
   *  · THE STUDY SAID rAF IS SKIPPED ENTIRELY WHEN HIDDEN, AND IN THIS BROWSER IT IS NOT.  Measured here with a
   *    bare rAF chain and a real hidden tab: Gecko THROTTLES its refresh driver to about 1 Hz for a background
   *    document rather than aborting the callback, so the loop kept running three times over three seconds — and
   *    because each of those frames may integrate a whole MAX_WALL_STEP, the transport advanced 1.2 a.u. of
   *    logical time in a tab nobody was looking at.  So there IS a win at the loop after all, and this wave takes
   *    it: `schedule` refuses to ask for a frame while hidden and `loop` returns immediately if one arrives
   *    anyway, while `pending` still rises so nothing asked for is lost.
   *  · main-thread setTimeout is clamped to a 1000 ms floor (dom.min_background_timeout_value).  That makes the
   *    SLAP warm chain a 1 Hz nuisance rather than a 25 Hz one, but 8 ms of quadrature every second is still work
   *    for a picture nobody can see, so it parks.
   *  · A DEDICATED WORKER IS THROTTLED BY NOTHING.  It has its own event loop on its own OS thread and it runs at
   *    full speed with the tab in the background.  That is the actual item, and it is what the park protocol in
   *    mathworker.js exists for.
   * WHAT IS NOT DESTROYED, and the reason said out loud rather than left as a silence: the 96³ rgba16float cache
   * is 13.5 MB and the pipelines and bind groups that reference it are invalidated by texture.destroy().  Freeing
   * it would buy back memory the OS was going to page out anyway and cost a full rebuild plus a re-upload —
   * 50–200 ms of hitch — on the first frame back, on unified-memory hardware (the iPad is a target) where the
   * "saving" is not even a saving because CPU heap and GPU memory are the same pool.  So the GPU keeps everything.
   * RESUMING RE-ANCHORS, IT NEVER JUMPS, and it re-anchors the way the two clocks that already solved this do it
   * (mir/modulation/host.js: prevWall = null, so the first dt after a stop is not a dt; camera.wake(): lastWall = now).  There
   * is no third mechanism here — every wall reference the loop holds is simply set to NOW before the first frame. */
  const page = { hidden: false, parks: 0, resumes: 0, hiddenAt: 0, hiddenMs: 0, firstDt: null, firstWall: 0, jumped: 0, mark: null, back: null, via: '' };
  app.loop.page = page;
  function setPageHidden(on, via) {
    const want = !!on;
    if (want === page.hidden) return page.hidden;
    page.hidden = want; page.via = via || '';
    if (want) {
      page.parks++; page.hiddenAt = performance.now();
      page.mark = { t: clock.t, camT: camera.t, frames: stats.frames, presents: stats.presents, wall: page.hiddenAt };
      if (maths.ok) maths.park(); if (scan.ok) scan.park(); if (cards.ok) cards.park();     // the workers: the one thing the browser throttles for nobody
      cancelWarm();                                             // the idle reader and its delay
      if (app.state.modHost) app.state.modHost.clock.setHidden(true);                 // the modulation clock stops (and releases any hold)
      if (app.state.audioCap && app.state.audioCap.setHidden) app.state.audioCap.setHidden(true);  // wave 105: the capture reports to the SAME authority — it owns no listener of its own
    } else {
      page.resumes++; page.hiddenMs += performance.now() - page.hiddenAt;
      const now = performance.now();
      /* THE SAME FOUR NUMBERS, READ AT THE OTHER EDGE.  Nothing runs between the two handlers — the loop is a rAF
         chain and rAF is not called while hidden — so `back` and `mark` must be IDENTICAL in t and in frames, and
         only the wall between them may have moved.  That equality is the claim, and the gate reads it rather than
         inferring it from a number that happens to look small. */
      page.back = { t: clock.t, camT: camera.t, frames: stats.frames, presents: stats.presents, wall: now };
      /* THE RE-ANCHOR.  Not one of these clocks may receive the whole gap as one delta. */
      clock._wall = null;                       // PHYSICS: clock.js's own idiom — "the next dt is NOT a dt" (what pause() leaves behind)
      lastWall = now / 1000;                    // CAMERA: exactly what camera.wake() does
      app.state.modWall = now; lastReconMs = -1e9;        // the modulation cadence and the FIELD clock start their windows here
      autoQ.lastMs = 0; autoQ.presented = 0;   // the controller's window, and the "the thread was blocked" flash that a 3-minute gap would otherwise fire
      app.state.metersWall = 0; winStart = 0; winFrames = winRecon = winSteps = 0;
      if (camLevel.from) camLevel.t0 = now;     // a levelling slerp interrupted by a tab switch resumes, it does not finish in one frame
      page.firstDt = null;                      // the loop records the first dt it actually integrates, and the gate reads it
      if (maths.ok) maths.resume(); if (scan.ok) scan.resume(); if (cards.ok) cards.resume();
      if (app.state.modHost) app.state.modHost.clock.setHidden(false);                // mir/modulation/host.js re-anchors itself: prevWall = null + reanchorTransport
      if (app.state.audioCap && app.state.audioCap.setHidden) app.state.audioCap.setHidden(false); // wave 105: …and the follower spends one frame re-learning the spectrum rather than firing a phantom onset
      warmArm(60);
      schedule(TIER.PRESENT);
    }
    return page.hidden;
  }
  /* ONE AUTHORITY.  visibilitychange is the only universally implemented primitive and is the one that decides;
     freeze/resume (Chromium's Page Lifecycle) and pagehide/pageshow (bfcache, and the mobile app switch) are
     funnelled into the SAME function so there can never be two answers.  `blur` is deliberately NOT bound: a
     click into the devtools or a second monitor blurs the window while the document is still visible. */
  document.addEventListener('visibilitychange', () => setPageHidden(document.visibilityState === 'hidden', 'visibilitychange'));
  document.addEventListener('freeze', () => setPageHidden(true, 'freeze'));
  document.addEventListener('resume', () => setPageHidden(false, 'resume'));
  window.addEventListener('pagehide', () => setPageHidden(true, 'pagehide'));
  /* A pagehide that is NOT going into the back-forward cache is a real unload: release the GPU in order
     (textures, buffers, context, device) before the navigation tears the page down under the driver. */
  window.addEventListener('pagehide', (e) => { if (!e.persisted && field && field.dispose) field.dispose(); });
  window.addEventListener('pageshow', () => setPageHidden(document.visibilityState === 'hidden', 'pageshow'));

  /* ── the router ───────────────────────────────────────────────────────── */
  let pending = TIER.NONE, rafId = 0, lastWall = 0, lastReconMs = -1e9; app.state.dragging = false; let inLoop = false;
  /* OPTIMIZATION 2026-09-24 · LA1: the WHOLE loop's own ms, from entry (before the occlusion burst and the modulation
     pump, which perf.ring's tFrame0 leaves out), 60 deep, beside perf.ring — LW.perf.loopMedian reads it.  Both rings
     are written to the slot the frame's head captured (the tail used to write the NEXT slot, so the getter read the
     last frame alone: AUDIT-B FB2, AUDIT-F F5). */
  const loopRing = new Float64Array(60);
  const loopFaults = new Set(); let lastFault = '';                  // LA4: the messages a thrown frame has reported, and the last frame's own
  const ringMedian = (r) => { const a = Array.from(r).filter((v) => v > 0).sort((x, y) => x - y); return a.length ? a[a.length >> 1] : 0; };
  let winStart = 0, winFrames = 0, winRecon = 0, winSteps = 0;
  /* a schedule() from INSIDE the loop only raises `pending` — the loop's own tail registers the next frame.  Before wave
     45 it registered a second callback (rafId is 0 while the loop runs), and every in-loop schedule — H₂ running, a
     governor step — added one more loop call per frame for good: METERS read 300 "fps" at a 58 Hz display. */
  const cornerAxis = el('button','corner-axis-hit',document.getElementById('lab'));
  cornerAxis.type='button'; cornerAxis.hidden=true; cornerAxis.setAttribute('aria-label','Swap corner axis side');
  cornerAxis.title='Double-click or double-tap to swap sides; Enter also swaps';
  app.state.cornerLayoutDirty = true; let cornerSideAtLayout='',cornerVW=0,cornerVH=0;
  const swapCorner=()=>{mat.cornerSide=mat.cornerSide==='left'?'right':'left';app.state.cornerLayoutDirty=true;saveSettings();schedule(TIER.PRESENT);};
  let cornerTap=0;
  cornerAxis.addEventListener('click',e=>{const now=performance.now();if(e.detail===0 || now-cornerTap<400){swapCorner();cornerTap=0;}else cornerTap=now;});
  function placeCornerAxis() {
    if (mat.axis===false || mat.axisMode!=='corner') { if (!cornerAxis.hidden) cornerAxis.hidden=true; return; }
    if (cornerAxis.hidden) { cornerAxis.hidden=false; app.state.cornerLayoutDirty=true; }
    if (cornerSideAtLayout!==mat.cornerSide || cornerVW!==window.innerWidth || cornerVH!==window.innerHeight) app.state.cornerLayoutDirty=true;
    if (!app.state.cornerLayoutDirty) return;
    app.state.cornerLayoutDirty=false;
    const vw=window.innerWidth,vh=window.innerHeight,left=mat.cornerSide==='left';
    cornerSideAtLayout=mat.cornerSide;cornerVW=vw;cornerVH=vh;
    const rack=document.getElementById(left?'rackL':'rack'),r=rack&&rack.getBoundingClientRect();
    const inset=r&&r.width>0 ? (left?Math.max(0,r.right):Math.max(0,vw-r.left)) : 0;
    const x=left?Math.min(vw-48,inset+54):Math.max(48,vw-inset-54),y=vh-76;
    const cssLeft=(x-44)+'px',cssTop=(y-44)+'px';
    if(cornerAxis.style.left!==cssLeft)cornerAxis.style.left=cssLeft;
    if(cornerAxis.style.top!==cssTop)cornerAxis.style.top=cssTop;
    mat.cornerX=x/vw*2-1;mat.cornerY=1-y/vh*2;mat.cornerScaleX=64/vw;mat.cornerScaleY=64/vh;
  }
  document.addEventListener('transitionrun',e=>{if(!['rack','rackL'].includes(e.target.id)||mat.axisMode!=='corner')return;const end=performance.now()+500;const tick=()=>{app.state.cornerLayoutDirty=true;schedule(TIER.PRESENT);if(performance.now()<end)requestAnimationFrame(tick);};tick();});
  document.addEventListener('transitionend',e=>{if(e.target.id==='rack'||e.target.id==='rackL'){app.state.cornerLayoutDirty=true;schedule(TIER.PRESENT);}});
  app.state.exportLocked = false;
  function schedule(tier) {
    if (mod.syncing) return;                   // wave 52: a re-base writes what is already there (modSyncBases)
    if (tier > pending) pending = tier;
    /* LA8 · AN EXPORT RECORDS THE ASK, IT ARMS NOTHING.  This return used to come first, so a REBUILD asked for
       during an export (GRID, DOMAIN, SPACE, OPERATOR) was dropped: the export's finally raises only RECONSTRUCT, and
       the field went on marching the old grid under a control that showed the new one (AUDIT-F F8).  No rAF is armed
       while locked (render-exact's H9 witness); the finally's schedule() arms one frame at max(pending, RECONSTRUCT). */
    if (app.state.exportLocked) return;
    /* WAVE 54 · A HIDDEN PAGE ASKS FOR NO FRAMES.  `pending` still rises, so nothing asked for is lost — the
       resume schedules once and the next frame does all of it.  See the measurement in setPageHidden. */
    if (page.hidden) { stats.scheduled = false; return; }
    if (!rafId && !inLoop) { rafId = requestAnimationFrame(loop); stats.scheduled = true; }
  }
  /* The frame loop asks this cached service instead of reading layout geometry. IntersectionObserver accounts for
     both viewport clipping and a rack's scrollport; class/hidden mutations wake one catch-up frame on re-entry. */
  app.state.histShown = null;                // S4: the HISTORY card's reveal (below) rides the one activity hook the rack already has
  const windowActivity = createWindowActivity({ onChange: () => { schedule(TIER.PRESENT); if (app.state.histShown) app.state.histShown(); } });
  app.loop.windowActivity = windowActivity;
  const canPresent = (w) => windowActivity.canPresent(w);
  app.loop.canPresent = canPresent;
  const canPresentTransport = () => !app.state.uiHidden && (layout.docked ? canPresent(wTr)
    : (!document.body.classList.contains('rack-hidden') || document.body.classList.contains('transport-peek')));
  const tableOf = (a) => sturm.P ? sturm.rec[a] : (app.state.space === 'p' ? getHamiltonian().momentumTableFor(BASIS[a]) : getHamiltonian().tableFor(BASIS[a]));   // W-STURMIAN: the scaled record, else the operator's
  const sturmHalf = () => { const nm = reg.nmax(1e-3); return domainFor(nm) / (nm * sturm.lambda); };   // a Sturmian's extent is hydrogen's for n over nλ (ρ = 2λr against 2r/n)
  /* Population membership, mute/solo eligibility and ordering change only with register.version. During exact
     time evolution the coefficients rotate but these lists do not; rebuilding and sorting them each frame was
     pure allocation. The returned records are read-only inside the rack. */
  const stateShape = { version: -1, populated: [], rendered: null };
  function stateReaders() {
    if (stateShape.version !== reg.version) {
      stateShape.populated = reg.populated();
      stateShape.rendered = reg.renderSet(RENDER_CAP, stateShape.populated);
      stateShape.version = reg.version;
    }
    return stateShape;
  }
  let modeStateT = NaN, modeStateVersion = -1;
  const modeState = { re: cRe, im: cIm };
  function modesAt(t) {
    modeStateT = NaN; modeStateVersion = -1;
    if (app.state.chem && app.state.chem.on) return null;                                      // CHEMISTRY: the field reads an AO density matrix, not a mode list — packModes is skipped entirely
    if (gas && gas.on) return gas.fieldModes(t);                           // the AXIAL GAS: the box's second register
    const c = reg.at(t, cRe, cIm), ids = stateReaders().rendered.ids; modeStateT = t; modeStateVersion = reg.version;
    modeList.length = ids.length;                                        // wave 45: the same 91 records, rewritten in place (was 1–91 fresh objects per reconstruct)
    for (let i = 0; i < ids.length; i++) { const a = ids[i], m = modeRecs[i]; m.table = tableOf(a); m.re = c.re[a]; m.im = c.im[a]; modeList[i] = m; }
    return modeList;
  }
  const modeRecs = Array.from({ length: 91 }, () => ({ table: null, re: 0, im: 0 })), modeList = [];
  function refModes() {
    if (!app.state.refSnapshot) return null;
    return app.state.refSnapshot.ids.map((a) => ({ table: tableOf(a), re: app.state.refSnapshot.re[a], im: app.state.refSnapshot.im[a] }));
  }
  function applyRebuild() {
    busyWrap(null);                                                    // wave 48: a rebuild is BUSY work — synchronous, so it only shows when the frame-gap rule catches it running long
    const HH = getHamiltonian();
    if (domain.auto) domain.half = (app.state.chem && app.state.chem.on) ? app.state.chem.half : (app.state.space === 'p' ? HH.domainForP(reg.nmin()) : sturm.P ? sturmHalf() : HH.domainFor(reg.nmax(1e-3)));   // ignore a slap's 1e-4 tails
    if (field.ok) field.setSpace(app.state.space === 'p' ? HH.kernelSpace.p : HH.kernelSpace.x);
    if (field.ok && HH.radialTable) field.setRadialTable(HH.radialTable());   // QUARKONIUM: the tabulated radial rows the kernel reads
    if (field.ok) {
      field.setDomain(domain.half);
      const want = effectiveRes(); if (field.resolution !== want) field.setResolution(want);   // the governor's notch, if it stepped
    }
    mat.steps = quality.steps;
    if (app.state.refSnapshot) app.state.pendingRef = refModes();      // the reference lives on the grid: rebuild it with the grid
    stats.rebuilds++;
    ui.domainKnob.set(domain.half);
  }


  function loop(nowMs) {
    rafId = 0;
    if (page.hidden || app.state.exportLocked) { stats.scheduled = false; return; }   // wave 54: a frame that arrived after the tab went away does nothing and re-arms nothing
    inLoop = true;
    const tLoop0 = performance.now();                                 // LA1: the whole loop, timed from entry
    let fault = '';
    try {   /* LA4 · the body is deliberately NOT re-indented (one exception anywhere used to end the loop for the session: AUDIT-B FB7) */
    if (field.ok && field.setOcclusion && (app.state.occludeDirty || nowMs - app.state.occludeAt > 300)) refreshOcclusion(nowMs);   // layout is read HERE, before the writes below
    if (mat.axis!==false && mat.axisMode==='corner') placeCornerAxis();
    else if (!cornerAxis.hidden) cornerAxis.hidden=true;
    if(ui.frameSw) { const mode=mat.frame===false?'OFF':(mat.frameMode||'box').toUpperCase(); if(ui.frameSw.root.dataset.mode!==mode)ui.frameSw.root.dataset.mode=mode; }
    if(ui.axisSw) { const mode=mat.axis===false?'OFF':(mat.axisMode||'box').toUpperCase(); if(ui.axisSw.root.dataset.mode!==mode)ui.axisSw.root.dataset.mode=mode; }
    look.moving(clock.playing);   /* WAVE 67: the FROST policy's one per-frame act — a compare, no read of anything (0.5.0 C2: on the
                      edge the kit's frost row writes frost-hold under STILL: the filter moves while the field runs, never the fill).
                      It rides the loop rather than the play button because there are seven ways to start the
                      transport in this lab (the button, the key, LW.play, the A/B switch, the bow, the slap,
                      a preset restore) and a policy wired to one of them is a policy that is wrong six times.
                      Pausing schedules one more frame, which is the frame that gives the glass back. */
    const now = nowMs / 1000;
    /* ── THE MODULATION CLOCK (wave 52) — the SECOND logical time over this one wall clock.  ONE call,
       with a monotonic stamp in SECONDS, and it is the only entry point the scheduler uses.  THE CADENCE
       CAP is here and nowhere else: on a 240 Hz panel the modulation still applies 60 (or 120) times a
       second, and skipping a frame costs nothing — under WALL sync the beat is DERIVED from the absolute
       stamp, so it cannot drift, and under FREE sync the next dt carries the whole gap.  Its present
       callback is schedule(TIER.PRESENT), which is why this sits ABOVE the read of `pending`: the output
       of this frame is presented on this frame.  It runs whether or not the window that shows it is open. */
    if (app.state.modHost) {
      const modRunning = app.state.modHost.clock.isRunning();
      if (modRunning) modSyncBases();
      if (nowMs - app.state.modWall >= MOD.step) {
        /* WAVE 102 · THE FEED RATE IS MEASURED, NOT NOMINAL.  `modFeedAudio` turns each output's
           attack and release MILLISECONDS into per-frame coefficients using this number, so handing
           it a nominal 60 while the loop is really running at 43 would make every one of those eight
           time constants wrong by the same ratio. */
        /* ⚠ WAVE 105 · SMOOTHED, BECAUSE ONE HITCH IS NOT A CADENCE.  The instantaneous interval is
           honest per tick and useless as a rate: the 60 Hz cap makes it alternate 16.7/33.3 ms in
           steady state, and one 200 ms stall handed the model `feedHz = 5`, from which it derives
           `dtFeed = 0.2 s` and decrements the 83 ms gate hold and the onset refractory by that in a
           SINGLE step — the gate slams shut and the followers collapse to pass-through.  A short EMA
           over the last few intervals costs nothing and cannot spike. */
        if (app.state.modWall) {
          const dt = Math.min(500, Math.max(1, nowMs - app.state.modWall));
          app.state.feedMs = app.state.feedMs ? app.state.feedMs + (dt - app.state.feedMs) * 0.25 : dt;
        }
        const feedHz = app.state.feedMs ? 1000 / app.state.feedMs : MOD.hz;
        /* THE ROTATION RATES INTEGRATE ON THIS TICK, from the RAW interval — never from `feedMs`,
           which is an EMA and would make the accumulated angle drift against the wall clock.  The
           250 ms ceiling is wave 105's own measurement used again: one 200 ms stall must not become
           a 1.3-radian jump in a single step. */
        const modDt = app.state.modWall ? Math.min(0.25, (nowMs - app.state.modWall) / 1000) : 0;
        app.state.modWall = nowMs;
        if (modRunning || (app.state.audioCap && app.state.audioCap.live) || rotDriving()) {
          feedAudio(feedHz);
          app.state.modHost.clock.advanceTo(now);
        }
        /* AFTER advanceTo AND NOT BEFORE: the macros have just written the rates, so the angle this
           tick applies is driven by the rate this tick asked for, with no one-frame lag between the
           modulator's number and the register's turn.  At rate zero this returns on its first line. */
        rotStep(modDt);
      }
    }
    let tier = pending; pending = TIER.NONE;
    const dt = clock.advance(now);                                   // PHYSICS clock (exact)
    if (page.firstDt === null) { page.firstDt = dt; page.firstWall = Math.max(0, now - lastWall); if (dt > 0.5 * clock.rate) page.jumped++; }   // wave 54: the first frame after a resume, kept so the gate can read it rather than infer it
    if (dt !== 0) { tier = Math.max(tier, TIER.EVOLVE); stats.evolves++; winSteps++; }
    if (camLevel.from && camLevelStep(nowMs)) tier = Math.max(tier, TIER.PRESENT);   // wave 54: FREE → TURNTABLE levels the roll, it never snaps
    if (stepKeyOrbit(Math.min(0.1, Math.max(0, now - lastWall)))) tier = Math.max(tier, TIER.PRESENT);
    if (!app.state.dragging && camera.moving) {                                // CAMERA clock: observer only (§12) — the law, never the state
      if (cameraStep(Math.min(0.1, Math.max(0, now - lastWall)))) tier = Math.max(tier, TIER.PRESENT);
    }
    lastWall = now;
    /* On iPad, the nested neumorphic shadow stack competes with the live WebGPU canvas even without
       backdrop blur. Keep the silhouettes and fills, and flatten only inner shadows while pixels move. */
    const tabletMotion = tablet.on && (clock.playing || app.state.dragging || camera.moving || camLevel.from ||
      (app.state.modHost && app.state.modHost.clock.isRunning()) || rotDriving());
    if (tabletMotion !== document.body.classList.contains('tablet-motion'))
      document.body.classList.toggle('tablet-motion', tabletMotion);
    /* PACE (P1, 2026-09-25) · A BOUNDED QUEUE where the GPU's completion is prompt (field.paced): with FOUR submitted frames
       still unfinished, this one would only queue behind them — Safari before its frame pacer lets 60 frames/s pile onto a GPU
       that finishes 35, then stalls while they drain (WEBKIT-FPS-RESEARCH §1.3; the iPad report).  Under a Safari-like loop
       (probes/PACE/pace-safari-emu: rAF as a 60 Hz timer, a 27 ms frame) the queue ran 20–26 deep and AUTO SCALE read 16.6 ms
       and never moved; held at four it stays ≤ 4, presents at the GPU's rate (32.7 ms) and AUTO SCALE steps once, at 0.55 s.
       FOUR, not one or two: Chromium already paces its rAF and its completions arrive 20–60 ms late, so it runs ~4 in flight
       by itself — holding at one cost it 17 % on a GPU-bound scene, at two 22 % with the modulation window open; at four it
       draws what it drew.  The ask is carried WHOLE to the next rAF (a REBUILD or RECONSTRUCT is never dropped: LA8's
       discipline); the clocks and the CPU readers run as on any frame.  Only this rAF road: an export calls field.frame
       itself, and no rAF runs while one does (render-exact H9). */
    const held = tier >= TIER.PRESENT && field.ok && field.paced && field.inFlight > 3;
    if (held) { if (tier > pending) pending = tier; tier = TIER.NONE; stats.skipped++; }
    if (tier >= TIER.REBUILD) applyRebuild();
    let modes = null;
    if (tier >= TIER.RECONSTRUCT) {
      const due = (nowMs - lastReconMs) >= fieldRate.capMs;          // FIELD clock: cadence, never c
      if (tier !== TIER.EVOLVE || due) { modes = modesAt(clock.t); lastReconMs = nowMs; stats.fieldT = clock.t; winRecon++; }
    }
    const tFrame0 = performance.now();
    if (tier >= TIER.PRESENT && field.ok) {                          // PRESENTATION
      field.setStepCap(tabletMotion ? tablet.steps : Infinity);   // full saved quality returns on the first still frame
      tick('field', () => { field.resize(quality.scale * (quality.auto ? quality.autoScale : 1)); field.frame({ modes, refModes: app.state.pendingRef, obs, mat, molecule: !!(app.state.molSession && app.state.molSession.molecule) }); });   // ONE owner flag: the session holds the molecule, so the session says whether the volume is molecular
      app.state.pendingRef = null;
      stats.presents++; stats.lastEncodeMs = field.stats.lastEncodeMs;
    }
    if (modes) stats.reconstructs++;
    if (tier > 0) { stats.tiers[TIER_NAME[tier]]++; stats.lastTier = TIER_NAME[tier]; }
    stats.frames++; if (!held) winFrames++;                            // PACE: the fps readout counts what the loop drew
    if (tier >= TIER.PRESENT && !autoQ.presented++) { autoQ.sinceMs = nowMs; autoQ.k = 0; }   // the controller's window opens on its first presented frame
    if (autoQ.lastMs && tier >= TIER.PRESENT) {
      const iv = nowMs - autoQ.lastMs;
      frameBudget.sample(iv);
      if (iv <= 250) autoQ.iv[autoQ.k++ & 31] = iv;
    }
    if (!held) {                                                     // PACE: a held frame is not an interval — the next present's spans it, which is what the GPU delivered
      if (autoQ.lastMs && nowMs - autoQ.lastMs > 250) busyFlash(600);    // wave 48: a gap that long means the thread WAS blocked by work nobody wrapped — say so for 600 ms
      autoQ.lastMs = nowMs;
    }
    const slot = perf.counts.frames % 60; perf.ring[slot] = 0; loopRing[slot] = 0;   // filled at the tail with this frame's own main-thread cost — the SAME slot (LA1)
    const d = controlStep(autoQ, nowMs, quality.autoScale, quality.minScale, perfBudgetMs(), quality.auto, gov.on && clock.playing && effectiveRes() > RES_LADDER[0]);
    if (d) {                                                         // THE ONE CONTROLLER has judged (its law at autoQ)
      if (d.rung || !clock.playing || d.scale >= quality.autoScale) autoQ.m0 = 0;
      else if (!autoQ.m0) { autoQ.m0 = d.median; autoQ.s0 = quality.autoScale; }   // a descent begins: the scale² test reads from here
      if (d.rung) { gov.drop++; gov.changes++; schedule(TIER.REBUILD); }
      if (d.scale !== quality.autoScale) { quality.autoScale = d.scale; autoQ.changes++; }
      gov.median = d.median; autoQ.presented = 0;
      if (ui.scaleRo) ui.scaleRo.set((100 * quality.scale * (quality.auto ? quality.autoScale : 1)).toFixed(0) + '%', quality.auto && quality.autoScale < 1 ? 'warn' : '');
    }
    if (app.state.playedLast && !clock.playing) {                              // THE PAUSE EDGE (W125-2): the user's grid and canvas come back at once, and the window restarts
      autoQ.presented = autoQ.lastMs = autoQ.m0 = 0;                 // the play's intervals, and the edge's own transition interval, are not the still picture's
      if (gov.drop) { gov.drop = 0; gov.changes++; schedule(TIER.REBUILD); }
      if (quality.auto && quality.autoScale < 1) { quality.autoScale = 1; autoQ.changes++; schedule(TIER.PRESENT); if (ui.scaleRo) ui.scaleRo.set((100 * quality.scale).toFixed(0) + '%', ''); }   // the still picture repaints at full size on the next frame (REFUTE-B: nothing else would)
    }
    app.state.playedLast = clock.playing;
    perf.counts.frames++;
    const cpuTick = !clock.playing || (perf.counts.frames % perf.cpuEvery) === 0;   // the CPU windows' cadence
    if (cpuTick) {
      /* modesAt() already evolved the same register into these scratch arrays on a reconstruction frame. Reuse it;
         in 120 Hz mode the other three frames need no CPU-reader coefficient vector at all. */
      const c = modeStateT === clock.t && modeStateVersion === reg.version ? modeState : reg.at(clock.t, cRe, cIm);
      perf.counts.cpu++;
      if (reg.version !== app.state.govVersion) { app.state.govVersion = reg.version; if (gov.parked.size) { const np = reg.populated().length; for (const [name, p] of [...gov.parked.entries()]) if (np < p.pop) unpark(name, READERS[name]); } }   // an edit that SHRANK the state: a parked reader may have got cheap — re-measured (one that grew stays parked: the landing frame measured 449 ms with the SLICE re-measuring on 91 labels)
      if (app.state.stageText) { stageTextTick(); app.state.stageText.atomLabels(app.state.chem && app.state.chem.on ? app.state.chem.preset() : '', obs, domain.half); }   // the STAGE TEXT follows the register; the ATOM LABELS the camera (initStageText: compares only)
      if (may('spectrum', wSpec)) tick('spectrum', () => spectrum.update(c, clock.t));
      if (may('shadow', wSh)) tick('shadow', () => { shadowView.update(c, clock.t, stateReaders().populated, spectrum.selected); if (ui.shadowDetails && !ui.shadowDetails.hidden) shadowFoot.update(reg, c, clock.t, stateReaders().populated); });
      if (may('orbit', wOrb)) tick('orbit', () => { orbit.update(obs); keplerRowSync(); });   // the Kepler knobs' own liveness rides the tick this window already pays for, keyed on reg.version like every other reader
    }
    const overlayDomain = app.state.space === 'x' && getHamiltonian().hydrogenTheorems && !sturm.P && !(app.state.chem && app.state.chem.on);
    if (overlayDomain) {
      const vortexVisible = canPresent(wVor);
      if (vortexVisible && may('vortex')) tick('vortex', () => vortex.update(reg, clock.t, obs, domain.half, clock.playing));
      else if (!vortexVisible) vortex.suspend();

      const particlesVisible = canPresent(wVor);   // 0.4.0 S3: PARTICLES live in VORTEX — the flow
      if (particlesVisible && particles.on && may('particles')) tick('particles', () => {
        if (perf.cpuEvery === 1 || (perf.counts.frames % 2) === 0) particles.advance(reg, clock.t, domain.half);
        particles.draw(obs, domain.half);
      });
      else if (!particlesVisible || !particles.on) particles.suspend(clock.t);   // retain switch/points; skip hidden time instead of a catch-up burst

      const keplerVisible = app.state.bow || canPresent(wOrb);
      if (keplerVisible && (kepler.on || app.state.kdrag || app.state.keplerDirty || app.state.bow) && (app.state.bow || may('kepler'))) tick('kepler', () => {
        kepler.update(reg, clock.t, obs, domain.half); app.state.keplerDirty = !!kepler.on;
        if (!kepler.on && !app.state.bow) kepler.suspend();
      });
      else if (!keplerVisible) kepler.suspend();
    } else {
      vortex.suspend(); particles.suspend(clock.t);
      /* The impulse remains a stage gesture when a molecule, momentum space or a
         Sturmian owns the field.  Those modes deliberately skip the Kepler redraw above, so clear
         its transparent canvas explicitly before bowFrame() paints the next arrow. */
      if (app.state.bow) kepler.clear(); else kepler.suspend();
    }

    kepler.bowFrame();
    app.state.chem.setActive(canPresent(wChem));
    /* ONE PRODUCT A FRAME, AND THE ORDER OF THESE TWO CALLS DECIDES NOTHING.  Both windows hand their product to
       molSession, which selects a model by RANK (the real-time run, then the register, then the card) and drops
       what the unselected ones offer — where this used to be "whoever writes the matrix last owns the frame". */
    app.state.molSession.tick();
    if (app.state.chem.on && powered(wChem)) app.state.chem.update(clock.t);   // the RT pump: one outstanding worker request, then an upload — no maths on this thread, so no tick()
    app.state.register.setActive(canPresent(wOrbs));
    if ((app.state.orbitals.on || app.state.states.on) && powered(wOrbs)) app.state.register.update(clock.t);
    if (flowTracers) {
      /* the source belongs to the model that is PLAYING: the STATES register, the ORBITAL packet, or CHEMISTRY's run */
      const playing = app.state.molSession ? app.state.molSession.selected : null;
      const src = playing === 'states' ? (app.state.states.flowOn ? app.state.states.flowSource() : null) : playing === 'orbital-packet' ? app.state.orbitals.flowSource() : (playing === 'tdhf' || playing === 'ground') && app.state.chem ? app.state.chem.flowSource() : null;
      if (src && src.ready) {
        if (!flowTracers.on || app.state.flowEpoch !== src) { flowTracers.setOn(true); flowTracers.setTrail(48); flowTracers.setCap(2.5); flowTracers.seedFrom(src, 220, Number.isFinite(src.time) ? src.time : clock.t, app.state.chem.half * 0.75); app.state.flowEpoch = src; }
        tick('particles', () => { flowTracers.advanceFrom(src, Number.isFinite(src.time) ? src.time : clock.t, app.state.chem.half * 0.75); flowTracers.draw(obs, domain.half); });
      } else if (flowTracers.on) { flowTracers.setOn(false); app.state.flowEpoch = null; }
    }
    const sliceVisible = canPresent(wSlice); slice.setActive(sliceVisible);
    ladder.setActive(canPresent(wLad));
    if (cpuTick) {
      if (sliceVisible && may('slice', wSlice)) tick('slice', () => slice.update(reg, clock.t, clock.playing));
      if (may('atoms', wAtoms)) tick('atoms', () => atomsView.update());
      if (may('wigner', wWig)) tick('wigner', () => {          // the WIGNER slice: its own throttle (2 Hz while playing, wignerview.js), its own guard
        const G = hydroReader(); wWig.setStatus(G.status === null ? WIG_OK : G.status, G.status === null ? '' : 'warn');
        wignerView.update(reg, clock.t, clock.playing, G.on, G.why, domain.half);
      });
      if (may('radiation', wRad)) tick('radiation', () => {        // the DIPOLE: cheap, so every CPU tick
        const G = hydroReader(); radiationView.update(reg, clock.t, clock.playing, G.on, G.why);
        const st = G.status !== null ? G.status : radiationView.cache ? RAD_OK : 'no dipole in this state';
        wRad.setStatus(st, st === RAD_OK ? '' : 'warn');
      });
      if (may('calculus', wCalc)) tick('calculus', () => { if (calculus && !sturm.P && !(app.state.chem && app.state.chem.on)) calculus.update(reg, clock.t); });
      if (canPresent(wSh)) ui.hc.set(reg.energy().toFixed(5));
      if (canPresent(wSpec) && sturm.P && ui.sturmRo && sturm.roVersion !== reg.version) paintSturmRo();   // W-STURMIAN: the scale's readout follows the state
      if (canPresent(wSpec) && gas && gas.on && ui.gasRo && (perf.counts.cpu % 6) === 0) gasReadout(clock.t);   // K5w: the maths worker's stats(), painted when it lands
    }
    if (canPresentTransport()) transport.update();
    /* WAVE 52: the strip, the meters and the beat readout, at 30 Hz (modview throttles itself) — and
       the EXPAND lamp, which is the one thing that must be painted whether the window is open or not. */
    if (app.state.modHost) {
      if (!app.state.uiHidden && app.state.modView && app.state.modView.isOpen) app.state.modView.paint(false);
      if (!app.state.uiHidden && app.state.tl && app.state.tl.isOpen()) app.state.tl.paintHead();   // 0.5.0 C7b: the playhead paints from the one present (TIMELINE.md: no tick of its own)
      const on = app.state.modHost.clock.isRunning();
      if (on !== app.state.modExpOn) { app.state.modExpOn = on; if (ui.modExp) ui.modExp.classList.toggle('live', on); }
    }
    if (now - winStart >= 1) {
      const w = now - winStart; stats.fps = winFrames / w; stats.reconPerSec = winRecon / w; stats.stepsPerSec = winSteps / w;
      winStart = now; winFrames = winRecon = winSteps = 0;
    }
    inLoop = false;
    loopTail(false);                                                  // LA4: the re-arm, one function for this tail and the fault's
    if (cpuTick && canPresent(wMet) && (!clock.playing || nowMs - app.state.metersWall >= 100)) { app.state.metersWall = nowMs; tick('meters', () => { meters.update(meterSnapshot()); paintGovernor(); }); }   // wave 45: 10 Hz while playing (fifteen strings and a snapshot per call), every frame when paused
    /* 0.4.0 S0 · wave 137: the STATUS TAGS, the Stark/Zeeman and masked/truncated warnings and the canvas's sentence tick on
       their OWN ≤ 10 Hz clock — they rode METERS' tick and went stale whenever METERS was closed.  Gated on the tags being
       shown or the canvas being read (focused); the governor's readout stays with METERS. */
    if (cpuTick && nowMs - app.state.badgesWall >= 100 && (!document.body.classList.contains('no-badges') || document.activeElement === dom.canvas)) { app.state.badgesWall = nowMs; tick('badges', () => badges.update()); }
    if (ui.sliceMini && canPresent(wClip)) ui.sliceMini.paint();   // the plane model lives in CLIP (id `clip`), not in PLANE (id `slice`) — gated on the wrong window it never repainted while dragged
    const tEnd = performance.now(), spent = tEnd - tFrame0;
    perf.profile.total = perf.profile.total * 0.9 + spent * 0.1;
    perf.ring[slot] = spent;                                          // wave 48: the loop's OWN main-thread ms, 60 deep — LW.perf.median reads it
    loopRing[slot] = tEnd - tLoop0;                                   // LA1: …and the whole loop's, from entry — LW.perf.loopMedian
    } catch (e) {
      fault = String(e && e.message || e); loopFault(fault, e);
    } finally {
      /* A THROWN FRAME STILL ENDS LIKE A FRAME: `inLoop` comes down and the loop re-arms on the normal tail's own
         condition — so a reader that throws once costs one frame, not the session.  A throw that REPEATS (the same
         message on consecutive frames) does not re-arm on `pending` alone: a throw before the tier read leaves
         `pending` unconsumed, and re-arming on it would spin a paused instrument at the display rate forever.  The
         next schedule() arms a frame as it always does. */
      if (inLoop) { inLoop = false; loopTail(fault !== '' && fault === lastFault); }
      lastFault = fault;
    }
  }
  /* WAVE 105 · A LIVE MICROPHONE IS ITS OWN REASON TO KEEP THE FRAME.  Without this the loop
     quiesced the moment nothing else was moving — which is the BOOT DEFAULT — so pressing MIC with
     the transport stopped opened the device and then never read it: the meter sat at 0.00, the
     followers never moved, and the recording indicator stayed lit on a capture nothing was using. */
  function loopTail(faultRepeat) {
    if (clock.playing || camera.moving || keyOrbitMoving() || camLevel.from || (pending && !faultRepeat) || (app.state.audioCap && app.state.audioCap.live) || (app.state.modHost && app.state.modHost.clock.isRunning()) || rotDriving()) { rafId = requestAnimationFrame(loop); stats.scheduled = true; }   // camera key easing schedules only until its last queued increment lands
    else { stats.scheduled = false; stats.fps = 0; stats.reconPerSec = 0; stats.stepsPerSec = 0; autoQ.lastMs = autoQ.presented = 0; frameBudget.breakSequence(); }
  }
  /** LA4: a thrown frame is REPORTED ONCE per distinct message (32 kept) to window.__e and the console — a throw that
   *  repeats every frame must not flood either */
  function loopFault(msg, e) {
    if (loopFaults.has(msg) || loopFaults.size >= 32) return;
    loopFaults.add(msg);
    (window.__e = window.__e || []).push('LOOP ' + msg);
    console.error('λWAVES frame loop: ' + msg + ' — that frame was abandoned; the loop goes on', e);
  }
  function meterSnapshot() {
    const rs = stateReaders().rendered;
    return { norm: reg.norm(), energy: reg.energy(), autocorr: reg.autocorrelation(clock.t).abs, t: clock.t, playing: clock.playing,
      rendered: rs.rendered, populated: rs.populated, masked: rs.masked, truncated: rs.truncated, covered: rs.coveredFraction,
      res: field.ok ? field.resolution : 0, half: domain.half, steps: mat.steps, encodeMs: stats.lastEncodeMs,
      fps: stats.fps, reconPerSec: stats.reconPerSec, stepsPerSec: stats.stepsPerSec, scheduled: stats.scheduled, lastTier: stats.lastTier, tiers: stats.tiers,
      status: statusLine(), profile: perf.profile, perfMode: perf.mode, unit: getHamiltonian().unit };
  }
  /** the METERS line for the governor: its state, the median it judged, the grid it runs, and what it parked */
  function paintGovernor() {
    if (!ui.govRo) return;
    const st = !gov.on ? 'OFF' : gov.drop ? 'GRID −' + gov.drop : 'nominal';
    ui.govRo.set(`${st} · ${gov.median ? gov.median.toFixed(1) : '—'} ms · ${field.ok ? field.resolution : 0}³`, !gov.on ? '' : gov.drop ? 'warn' : 'ok');
    const parked = [...gov.parked.entries()].map(([n, p]) => n + ' ' + p.cost.toFixed(0) + ' ms');
    ui.govRo.setSub((parked.length ? 'parked: ' + parked.join(' · ') : 'all readers active') + ' · budget ' + (perfBudgetMs() * 4 / 3).toFixed(0) + ' ms · scale ' + (100 * quality.scale * (quality.auto ? quality.autoScale : 1)).toFixed(0) + '%');
  }
  function statusLine() {
    const rs = stateReaders().rendered;
    let s = reg.field.Fz !== 0 ? 'STARK SHELL MODEL · FIELD GRID'
      : reg.field.Bz !== 0 ? 'ZEEMAN MODEL · FIELD GRID'
      : 'HYDROGEN · FIELD GRID';
    if (sturm.P) s = 'STURMIAN λ = ' + sturm.lambda.toFixed(3) + ' · S-NORM' + (reg.field.Bz !== 0 ? ' · ZEEMAN' : '') + ' · FIELD GRID';
    if (reg.damping > 0) s = 'DRAG γ = ' + reg.damping.toFixed(3) + ' · ' + s;
    if (!field.ok) s += ' (no GPU)';
    if (rs.masked) s += ` · MASKED ${rs.masked}`;
    if (rs.truncated) s += ` · TRUNCATED ${rs.truncated}`;
    return s;
  }

  /* THE MOTION PREFERENCE (wave 57, wave 59): what `prefers-reduced-motion` means for a strobing volumetric render —
     nothing moves unasked, and a rate nobody chose is paced by a quarter.  Its law and its reasons live in
     lab/motion-pref.js (seam 1, optimization N7); MOTION is the live object LW.motion reads. */
  const { MOTION, paceRate } = createMotionPref();
  app.loop.paceRate = paceRate;

  /* ── windows ──────────────────────────────────────────────────────────── */
  /* THE CAMERA LAW (wave 50) and the observer's pose — CAM, the camera, the two modes, orbitBy, the key orbit, ZOOM / FOV /
     RESET VIEW: lab/camera-law.js (wave 130 seam 11).  Built here, before the first window that reads it. */
  const { camera, camTravel, camLevel, syncFreeAngles, orbitBy, keyOrbitMoving, queueKeyOrbit, stepKeyOrbit, setCamMode,
    camLevelStep, cameraStep, setDist, setFov, syncCamUI, resetView, zoomAt, panBy, port: cameraPort } = createCameraLaw({ obs, present: () => schedule(TIER.PRESENT),
    modHand, resetWall: app.loop.resetWall });
  const rack = dom.rack;
  app.host.camera = camera; app.host.camLevel = camLevel; app.host.syncFreeAngles = syncFreeAngles; app.host.syncCamUI = syncCamUI; app.host.rack = rack; app.host.panBy = panBy;
  app.host.camTravel = camTravel; app.host.orbitBy = orbitBy; app.host.queueKeyOrbit = queueKeyOrbit; app.host.setDist = setDist; app.host.setFov = setFov; app.host.resetView = resetView; app.host.zoomAt = zoomAt;


  const wObs = device({ id: 'observer', eyebrow: 'WAVE', status: '' });
  const wPal = device({ id: 'palette', eyebrow: 'PALETTE', status: '' });
  const wCam = device({ id: 'camera', eyebrow: 'CAMERA', status: '' });
  app.state.capApi = null;                      // wave 58: the CAPTURE group's handle, published out of the block that builds it (LW reads it)
  app.state.camKnobs = {};                      // 0.5.0 C1: the CAMERA panel's dials by modulation id, published the same way (the observer.* defs read it)
  app.state.exporter3d = null;                  // wave 134: FILE › EXPORT SHAPE / GRID's module instance, published the same way (LW.shapeExport reads it)
  const wClip = device({ id: 'clip', eyebrow: 'CLIP', status: '' });   // 0.4.0 S3 (R-W3): CLIP, once SLICE / CLIP — the id stays
  {


    const gSpace = group(wObs.body, 'SPACE');
    const gDraw = group(wObs.body, 'DRAW');
    {
      const r0 = el('div', 'row', gSpace);
      ui.spaceSeg = seg({ label: 'the same state, two exact pictures', value: 'x', options: [
        { id: 'x', label: 'POSITION ψ(x)', title: 'the wavefunction in space' },
        { id: 'p', label: 'MOMENTUM φ(p)', title: 'Momentum-space view of the current state' }],
        onChange: (v) => { app.state.space = v; schedule(TIER.REBUILD); } });
      r0.appendChild(ui.spaceSeg.root);
      ui.spaceNote = el('div', 'sturm-note', gSpace); ui.spaceNote.hidden = true;          // its own class: the ⓘ sweep folds every .note away, and this one must be seen
      ui.spaceNote.innerHTML = '<b>STURMIAN:</b> momentum space is not built for the scaled radials (the Podolsky–Pauling transform would need its own table) — position space only until SCALE is back on HYDROGEN.';
    }
    const r1 = el('div', 'row', gSpace);
    ui.viewSeg = seg({ label: 'OBSERVABLE (colour is semantic)', value: 'phase', options: [


      { id: 'density', label: '<m>ρ=|ψ|²</m>', title: 'Probability density; palette θ = 0 when enabled, original blue when off' }, { id: 'phase', label: '<m>arg ψ</m>', title: 'phase as hue, density as opacity' },
      { id: 'real', label: '<m>Re ψ</m>', title: 'signed, diverging: palette ±π/2 or original orange/blue' }, { id: 'imag', label: '<m>Im ψ</m>' }, { id: 'diff', label: '<m>Δρ</m>', title: 'ρ(t) − ρ_ref: palette −π/2 gain and +π/2 loss, or original yellow/blue' }, { id: 'reim', label: '<m>Re+Im</m>', title: 'Overlay real and imaginary parts in one volume' }],
      onChange: (v) => { mat.view = VIEW[v]; schedule(TIER.PRESENT); } });
    r1.appendChild(ui.viewSeg.root).dataset.keyAction = 'view';
    const r2 = el('div', 'row tight', gSpace);
    ui.expK = knob({ label: 'EXPOSURE', min: 0.08, max: 12, value: 1, log: true, fmt: (v) => v.toFixed(2), onInput: (v) => { if (modHand('material.exposure', v)) return; mat.exposure = v; schedule(TIER.PRESENT); } }); r2.appendChild(ui.expK.root);
    ui.softK = knob({ label: 'SOFT', min: 0.3, max: 2.2, value: 0.7, fmt: (v) => 'γ' + v.toFixed(2), onInput: (v) => { if (modHand('material.softness', v)) return; mat.softness = v; schedule(TIER.PRESENT); } }); r2.appendChild(ui.softK.root);
    ui.hueK = knob({ label: 'HUE', min: 0, max: 1, value: 0, wrap: true, fmt: (v) => (v * 360).toFixed(0) + '°', onInput: (v) => { if (modHand('material.hue', v)) return; mat.hueShift = v; applyAccent(); schedule(TIER.PRESENT); } }); r2.appendChild(ui.hueK.root);


    /* ── THEME and SURFACE: the interface's skin, and the stage underneath it ── */
    ui.set = device({ id: 'settings', eyebrow: 'SETTINGS', status: '' });
    const gi = group(ui.set.body, 'INTERFACE');
    const ri = el('div', 'row tight', gi);
    /* 0.5.0 C2: STATUS TAGS, CONTROL HINTS and HELP are the look store's (mir.gui); native-ui.js seats them on DISPLAY */
    ui.badgesSw = sw({ label: 'STATUS TAGS', value: look.get('badges'), title: 'Show status tags at the top', onChange: (v) => look.set({ badges: v }) }); ri.appendChild(ui.badgesSw.root);
    ui.controlHintsSw = sw({ label: 'CONTROL HINTS', value: look.get('hints'), title: 'Show control hints after a short hover', onChange: (v) => look.set({ hints: v }) }); ri.appendChild(ui.controlHintsSw.root);
    ui.setWindowInfo = (v) => look.set({ help: v });   // the WINDOW menu's `notes` action calls it by this name
    ui.windowInfoSw = sw({ label: 'HELP', value: look.get('help'), title: 'Show window help buttons', onChange: ui.setWindowInfo }); ri.appendChild(ui.windowInfoSw.root);
    ui.capSw = sw({ label: 'STAGE CAPTIONS', value: false, title: 'the KEPLER / VORTEX lines at the foot of the stage', onChange: (v) => { document.body.classList.toggle('no-captions', !v); saveSettings(); schedule(TIER.PRESENT); } }); ri.appendChild(ui.capSw.root);
    ui.molFormulaSw = sw({ label: 'STAGE TEXT', value: true, title: 'Write what is playing on the stage — the MOLECULES formula or the SPECTRUM states, a preset\'s name as it is pressed, the element of each nucleus — and caption a picture or a recording with it', onChange: (v) => { document.body.classList.toggle('no-mol-formula', !v); if (app.state.stageText) app.state.stageText.setOn(v); schedule(TIER.PRESENT); saveSettings(); } }); ri.appendChild(ui.molFormulaSw.root);
    ui.molFormulaK = knob({ label: 'SIZE', min: 0.5, max: 3, value: 1, fmt: (v) => Math.round(v * 100) + '%', title: 'The STAGE TEXT\'s size: 100% is the notebook\'s — the formula its title (34 px), an announcement its heading, an atom label its body',
      onInput: (v) => { app.state.molFormulaScale = v; if (app.state.stageText) app.state.stageText.setScale(v); schedule(TIER.PRESENT); }, onChange: () => saveSettings() }); ri.appendChild(ui.molFormulaK.root);
    ri.appendChild(trig({ label: 'RESET LAYOUT', title: 'Restore the default window layout', onFire: () => layout.resetLayout() }).root);
    ri.appendChild(trig({ label: 'FORGET', title: 'Clear saved interface settings and reload', onFire: () => { settingsStore.remove(); look.prefs.forget(); modStore.write({ modArm: undefined, modCadence: undefined }); curvesStore.remove(); location.reload(); } }).root);


    const rc = el('div', 'row tight', gi);
    ui.frameSw = sw({ label: 'FRAME', value: true, title: 'Show the field boundary', onChange: () => { const modes=['box','lattice','dots','off']; const current=mat.frame===false?'off':mat.frameMode||'box'; const next=modes[(modes.indexOf(current)+1)%modes.length]; mat.frame=next!=='off'; mat.frameMode=next==='off'?'box':next; ui.frameSw.set(mat.frame); ui.frameSw.root.title='FRAME · '+next.toUpperCase(); saveSettings(); schedule(TIER.PRESENT); } });
    rc.appendChild(ui.frameSw.root);
    ui.axisSw = sw({ label: 'AXIS', value: true, title: 'Show or hide the x, y, and z axes', onChange: () => { const modes=['box','corner','off']; const current=mat.axis===false?'off':mat.axisMode||'box'; const next=modes[(modes.indexOf(current)+1)%modes.length]; mat.axis=next!=='off'; mat.axisMode=next==='off'?'box':next; ui.axisSw.set(mat.axis); ui.axisSw.root.title='AXIS · '+next.toUpperCase(); saveSettings(); schedule(TIER.PRESENT); } });
    rc.appendChild(ui.axisSw.root);
    ui.axisInkSeg = seg({ label: 'AXIS COLOUR', value: 'theme', options: [
      { id: 'theme', label: 'THEME', title: 'Choose axis colours from the current theme' },
      { id: 'cmy', label: 'CMY', title: 'Use cyan, magenta, and yellow axes' },
      { id: 'rgb', label: 'RGB', title: 'Use red, green, and blue axes' }],
      onChange: (v) => { mat.axisInk = v; saveSettings(); schedule(TIER.PRESENT); } });
    rc.appendChild(ui.axisInkSeg.root);
    ri.appendChild(trig({ label: 'SHOW THE WARNING AGAIN', title: 'Show the photosensitivity notice now and on the next load', onFire: () => { if (app.hooks.warning) { app.hooks.warning.reset(); app.hooks.warning.show(); } } }).root);
    el('div', 'note', gi).innerHTML = '<b>Settings.</b> Appearance and performance choices are stored in this browser. Window power stops its reader; collapse changes layout; close removes the window until reopened from + or WINDOW.';
    const gt = group(ui.set.body, 'THEME  ·  SURFACE');
    const rt = el('div', 'row tight', gt);
    const THEMES = { dark: { bg: [0.028, 0.038, 0.058], invert: false }, light: { bg: [0.93, 0.95, 0.975], invert: true } };


    /* THE THEME'S ENGINE SIDE (0.5.0 C2): the kit's theme row writes body[data-theme] (SYSTEM follows the OS by itself) and its
       `run` calls this once per resolved change.  WAVE 56: the browser's own chrome follows the theme — <meta name="theme-color">
       overrides the manifest wherever it is honoured; #eef1f6 is skin.css's `body[data-theme="light"] #stage`, #070a0f lab.css's
       unconditional ground.  Wave 48: the GPU chrome (the cube frame, the three axes) cannot read a CSS token — it reads lightUI. */
    app.hooks.theme = (theme) => {
      const tc = document.getElementById('themeColor');
      if (tc) tc.setAttribute('content', theme === 'light' ? '#eef1f6' : '#070a0f');
      mat.bg = THEMES[theme].bg.slice();
      if (app.hooks.restage) app.hooks.restage();
      mat.lightUI = theme === 'light';
      schedule(TIER.PRESENT);
    };
    ui.themeSeg = seg({ label: 'THEME', value: look.get('theme'), options: [
      { id: 'light', label: 'LIGHT', title: 'Use the light interface and stage' },
      { id: 'dark', label: 'DARK', title: 'Use the dark interface and stage' },
      { id: 'system', label: 'SYSTEM', title: 'Follow the operating system theme' }],
      onChange: (v) => look.set({ theme: v }) });
    rt.appendChild(ui.themeSeg.root);


    ui.discSw = sw({ label: 'DISCONNECTED', value: look.get('disconnected'), title: 'Separate window headers from their bodies', onChange: (v) => setDisconnected(v) });
    rt.appendChild(ui.discSw.root);
    ui.frostSeg = seg({ label: 'FROST', value: look.get('frost'), options: [
      { id: 'off', label: 'OFF', title: 'Disable backdrop filtering' },
      { id: 'still', label: 'STILL', title: 'Apply frost while the field is paused' },
      { id: 'always', label: 'ALWAYS', title: 'Apply frost continuously. This can reduce frame rate.' }],
      onChange: (v) => setFrost(v) });
    rt.appendChild(ui.frostSeg.root);
    el('div', 'note', rt, 'Frost filters the field behind windows. STILL applies it while paused; ALWAYS keeps it during motion.');
    ui.blurK = knob({ label: 'GLASS BLUR', min: 0, max: 30, value: look.get('blur'), fmt: (v) => v.toFixed(0) + ' px', title: 'the blur radius of the NOTEBOOK glass and of FROST', onInput: (v) => look.set({ blur: v }) }); rt.appendChild(ui.blurK.root);
    /* THE STAGE KNOB IS THE HEADER λ's GROUND (wave 59), which is why moving it repaints the mark: `#title`
       is `background: none` over `#field`, so `mat.bg` — this value — is the surface the λ is drawn on, and a
       correction against a ground the hand can drag is not a correction.  One named function, so the knob,
       LW.setStage and the gate all take the same road. */
    /* STAGE has one plain law: 0% is the active theme ground and 100% is the retained custom colour.
       FOLLOW THEME bypasses the blend without changing the knob or swatch, so it is reversible. */
    const themeGround = () => THEMES[document.body.dataset.theme === 'light' ? 'light' : 'dark'].bg;
    mat.stageCustom = [0.12, 0.14, 0.18];
    function setStageMix(v) {
      app.state.stageMix = Math.max(0, Math.min(1, Number.isFinite(+v) ? +v : 0));
      const a = themeGround(), b = mat.stageCustom;
      mat.bg = app.state.stageFollow ? a.slice() : [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * app.state.stageMix);
      paintMarks(); schedule(TIER.PRESENT);
    }
    app.hooks.restage = () => setStageMix(app.state.stageMix);
    function setStageColour(colour) {
      if (Array.isArray(colour) && colour.length >= 3) mat.stageCustom = colour.slice(0, 3).map((v) => Math.max(0, Math.min(1, +v || 0)));
      if (ui.stageColour) ui.stageColour.value = rgbToHex(mat.stageCustom);
      setStageMix(app.state.stageMix);
    }
    function setStageFollow(on) {
      app.state.stageFollow = !!on;
      if (ui.stageFollow) { ui.stageFollow.classList.toggle('on', app.state.stageFollow); ui.stageFollow.setAttribute('aria-pressed', String(app.state.stageFollow)); }
      setStageMix(app.state.stageMix);
    }
    app.hooks.setStageColour = setStageColour;
    app.hooks.setStageFollow = setStageFollow;
    ui.stageK = knob({ label: 'STAGE', min: 0, max: 1, value: 0.04, fmt: (v) => (v * 100).toFixed(0) + '%', onInput: (v) => { if (!modHand('material.stage', v)) setStageMix(v); } });
    app.hooks.setStage = (v) => { const x = Math.max(0, Math.min(1, +v || 0)); ui.stageK.set(x); setStageMix(x); return x; };
    { const seat = el('div', 'stage-seat', rt); ui.stageSeat = { root: seat };
      ui.stageColour = el('input', 'pal-color stage-colour', seat); ui.stageColour.type = 'color'; ui.stageColour.title = 'Stage colour at 100%'; ui.stageColour.setAttribute('aria-label', 'stage colour');
      ui.stageColour.addEventListener('input', () => { setStageColour(hexToRgb(ui.stageColour.value)); setStageFollow(false); });
      ui.stageFollow = el('button', 'trig stage-follow', seat, 'FOLLOW THEME'); ui.stageFollow.type = 'button'; ui.stageFollow.title = 'Ignore the chosen stage colour';
      ui.stageFollow.addEventListener('click', () => setStageFollow(!app.state.stageFollow));
      rt.appendChild(ui.stageK.root); setStageColour(mat.stageCustom); setStageFollow(true); }
    ui.gammaK = knob({ label: 'GAMMA', min: 0.5, max: 2.4, value: 1, fmt: (v) => v.toFixed(2), onInput: (v) => { if (modHand('material.gamma', v)) return; mat.gamma = v; schedule(TIER.PRESENT); } }); rt.appendChild(ui.gammaK.root);
    ui.cardSeg = seg({ label: 'CARD STYLE', value: look.get('card'), options: [
      { id: 'refractive', label: 'REFRACTIVE', title: 'Use transparent window surfaces' },
      { id: 'tinted', label: 'TINTED', title: 'Add the theme tint behind window content' },
    ], onChange: (v) => setCardStyle(v) });
    rt.appendChild(ui.cardSeg.root);
    el('div', 'note', gt, 'Refractive shows the field through the blur. Tinted adds the theme panel colour.');


    const gamutSup = field.ok && field.gamutSupport ? field.gamutSupport : { canvas: false, css: false, display: false, reason: 'no WebGPU device: the canvas has no colour space to set' };
    const gamutOK = !!(gamutSup.canvas && gamutSup.css);
    const rg = el('div', 'row tight', gt);
    ui.gamutSeg = seg({ label: 'GAMUT', value: 'srgb', options: [
      { id: 'srgb', label: 'sRGB', title: 'Use the sRGB colour space' },
      { id: 'p3', label: 'DISPLAY-P3', title: gamutOK ? 'the wider space, on BOTH sides at once — the canvas is re-configured and every accent is re-expressed in it' : gamutSup.reason }],
      onChange: (v) => setGamut(v) });
    rg.appendChild(ui.gamutSeg.root);
    ui.p3Seg = seg({ label: 'IN P3', value: 'convert', options: [
      { id: 'convert', label: 'CONVERT', title: 'Preserve authored colours in Display P3' },
      { id: 'vivid', label: 'VIVID', title: 'Increase chroma in Display P3' }],
      onChange: () => { if (field.ok && field.gamut !== 'srgb') setGamut('p3'); } });
    rg.appendChild(ui.p3Seg.root);
    /** the ONE road into the gamut: it asks the canvas, believes the answer, and puts the DOM wherever the canvas ended up */
    function setGamut(id) {
      const got = field.ok ? field.setGamut(id === 'p3' ? (ui.p3Seg && ui.p3Seg.get() === 'vivid' ? 'p3-vivid' : 'p3') : 'srgb') : 'srgb';
      const on = got !== 'srgb';
      document.body.dataset.gamut = on ? 'p3' : 'srgb';
      ui.gamutSeg.set(on ? 'p3' : 'srgb');
      applyAccent();                                   // the DOM's accents go through the SAME map the LUT went through
      if (ui.gamutRo) ui.gamutRo.set(on ? (got === 'p3-vivid' ? 'DISPLAY-P3 · vivid' : 'DISPLAY-P3') : 'sRGB', on ? 'ok' : '');
      if (ui.gamutRo) ui.gamutRo.setSub(gamutOK ? 'the interface and the field are both ' + (on ? 'DISPLAY-P3' : 'sRGB') : gamutSup.reason);
      saveSettings(); schedule(TIER.PRESENT);
      return got;
    }
    app.hooks.setGamut = setGamut;
    ui.gamutRo = readout({ label: 'IN FORCE', value: 'sRGB', sub: '' });
    rg.appendChild(ui.gamutRo.root);
    if (!gamutOK) {
      for (const id of ['p3']) { const b = ui.gamutSeg.button(id); if (b) { b.disabled = true; b.classList.add('disabled'); } }
      for (const id of ['convert', 'vivid']) { const b = ui.p3Seg.button(id); if (b) { b.disabled = true; b.classList.add('disabled'); b.title = gamutSup.reason; } }
    }
    ui.gamutRo.set('sRGB'); ui.gamutRo.setSub(gamutOK ? 'the interface and the field are both sRGB' : gamutSup.reason);
    el('div', 'note', gt).innerHTML = '<b>Gamut.</b> Display P3 is available only when both CSS and the WebGPU canvas support it. CONVERT preserves authored colours; VIVID increases chroma. DITHER reduces visible 8-bit banding.';
    const ra = el('div', 'row tight', gt);
    ui.accA = knob({ label: 'ACCENT A', min: 0, max: 360, value: look.get('accentA'), wrap: true, fmt: (v) => v.toFixed(0) + '°', title: 'the first UI accent: an angle on the current palette wheel', onInput: (v) => look.set({ accentA: v }) }); ra.appendChild(ui.accA.root);
    ui.accB = knob({ label: 'ACCENT B', min: 0, max: 360, value: look.get('accentB'), wrap: true, fmt: (v) => v.toFixed(0) + '°', title: 'Set Accent B', onInput: (v) => look.set({ accentB: v }) }); ra.appendChild(ui.accB.root);
    ui.vivid = knob({ label: 'VIVID', min: 0, max: 1, value: look.get('vivid'), fmt: (v) => (v * 100).toFixed(0) + '%', title: 'Increase accent chroma and glow', onInput: (v) => look.set({ vivid: v }) }); ra.appendChild(ui.vivid.root);
    el('div', 'note', gt).innerHTML = '<b>Appearance.</b> Theme changes the interface and stage. Stage, gamma, accents, hue, exposure, and invert affect presentation without changing ψ. Frost may reduce frame rate while the field moves.';
    app.hooks.setTheme = (t) => look.set({ theme: t });

    const gd = group(gDraw, 'the transfer has a bounded ceiling');            // WAVE 56: DRAW STYLE (window id `style`) merged into WAVE (board #59); this block is the DRAW section of the WAVE window
    const rd = el('div', 'row tight', gd);
    ui.styleSeg = seg({ label: 'STYLE', value: 'cloud', options: [
      { id: 'cloud', label: 'CLOUD', title: 'the emission/absorption integral' },
      { id: 'solid', label: 'SOLID', title: 'Render a lit density shell' },
      { id: 'grain', label: 'GRAIN', title: 'Render a sparse particle field' },
      { id: 'signed', label: 'SIGNED', title: 'Render signed lobes and nodal surfaces' },
      { id:'dust',label:'DUST',title:'World-locked fine particles; GRAIN controls their count' },
      { id:'glass',label:'SHELL',title:'Render a translucent density shell' },
      { id:'additive',label:'ADD',title:'Additive emission through the field' },
      { id: 'bands', label: 'BANDS', title: 'Draw amplitude level bands; GRAIN sets their count' }],
      onChange: (v) => { mat.style = STYLE[v]; schedule(TIER.PRESENT); } });
    rd.appendChild(ui.styleSeg.root).dataset.keyAction = 'style';
    /* 2026-09-10 (Josh): ISO, GRAIN and KNEE sit directly under EXPOSURE, SOFT and HUE — one six-knob
       material row above STYLE — instead of a second row below the style seg. */
    ui.isoK = knob({ label: 'ISO', min: 0.002, max: 0.9, value: 0.06, log: true, fmt: (v) => v.toFixed(3), onInput: (v) => { if (modHand('material.iso', v)) return; mat.iso = v; schedule(TIER.PRESENT); } }); ui.hueK.root.parentElement.appendChild(ui.isoK.root);
    ui.grainK = knob({ label: 'GRAIN', min: 0.02, max: 1, value: 0.35, log: true, fmt: (v) => v.toFixed(2), onInput: (v) => { if (modHand('material.grain', v)) return; mat.grain = v; schedule(TIER.PRESENT); } }); ui.hueK.root.parentElement.appendChild(ui.grainK.root);
    ui.kneeK = knob({ label: 'KNEE', min: 0.02, max: 8, value: 0.6, log: true, fmt: (v) => v.toFixed(2), onInput: (v) => { if (modHand('material.knee', v)) return; mat.knee = v; schedule(TIER.PRESENT); } }); ui.hueK.root.parentElement.appendChild(ui.kneeK.root);


    const rdd = el('div', 'row tight', gd);
    ui.ditherSeg = seg({ label: 'DITHER', value: 'off', options: [
      { id: 'off', label: 'OFF', title: 'the colour goes to the 8-bit swapchain as it is' },
      { id: 'ordered', label: 'ORDERED 8×8', title: 'Apply ordered dithering to reduce 8-bit colour bands' }],
      onChange: (v) => { mat.dither = v === 'off' ? 0 : (ui.ditherK ? ui.ditherK.get() : 1); if (ui.ditherK) ui.ditherK.setDisabled(v === 'off'); schedule(TIER.PRESENT); } });
    rdd.appendChild(ui.ditherSeg.root);
    ui.ditherK = knob({ label: 'STRENGTH', min: 0.25, max: 2, value: 1, fmt: (v) => '±' + (v / 2).toFixed(2) + ' LSB', onInput: (v) => { if (ui.ditherSeg.get() !== 'off') { mat.dither = v; schedule(TIER.PRESENT); } } });
    ui.ditherK.root.title = 'Dither strength in 8-bit output levels; 1 is ±½ level';
    ui.ditherK.setDisabled(true);
    rdd.appendChild(ui.ditherK.root);
    el('div', 'note', gd).innerHTML = '<b>Draw style.</b> KNEE limits opacity growth. ISO sets the solid or shell threshold; GRAIN controls particle density or band count. Ordered dithering reduces colour steps; strength 1 is ±½ output level.';

    const gs = group(wClip.body, 'observer only');
    const r3 = el('div', 'row', gs);
    /* wave 106: these two keep their handles for the same reason POS and THICK now do — an undo has to
       be able to MOVE a control, and a control nothing holds cannot be moved. */
    ui.sliceModeSeg = seg({ aria: 'slice mode', value: 'off', options: [{ id: 'off', label: 'VOLUME' }, { id: 'clip', label: 'CLIP' }, { id: 'slab', label: 'SLAB' }], onChange: (v) => { mat.slice.mode = { off: 0, clip: 1, slab: 2 }[v]; schedule(TIER.PRESENT); } });
    r3.appendChild(ui.sliceModeSeg.root);
    ui.sliceAxisSeg = seg({ aria: 'slice axis', value: 'z', options: [{ id: 'x', label: 'X' }, { id: 'y', label: 'Y' }, { id: 'z', label: 'Z' }], onChange: (v) => { mat.slice.axis = { x: 0, y: 1, z: 2 }[v]; delete mat.slice.normal; schedule(TIER.PRESENT); } });
    r3.appendChild(ui.sliceAxisSeg.root);
    const sliceNormals = [[1,0,0],[0,1,0],[0,0,1]];
    const mini = planeModel(gs, { getNormal:()=>mat.slice.normal || sliceNormals[mat.slice.axis|0] || sliceNormals[2], getPosition:()=>mat.slice.pos, onTurn:n=>{mat.slice.normal=n; schedule(TIER.PRESENT);} });
    ui.sliceMini = mini;
    ui.sliceAxisSeg.root.hidden = true;
    /* WAVE 106 · THESE TWO KEEP THEIR HANDLES NOW, and that is what makes them modulatable.  Both
       were built inline — `knob({...}).root` appended straight into the row — so the objects went
       out of scope the instant they were made and nothing could ever read or move them again.  A MIR
       target needs a `knob:` accessor to become a DROP target (registration alone only puts it in the
       picker), and `setKnob` needs the handle to move the needle when a macro drives it.
         `modHand` in front of each setter is the law every registered knob obeys (see ISO/GRAIN/KNEE):
       on a modulated parameter the hand's turn is a change to the BASE, routed through the registry,
       not a write straight to the instrument — otherwise `applyAll` stomps it on the next frame. */
    ui.slicePosK = knob({ label: 'POS', min: -1, max: 1, value: 0, fmt: (v) => v.toFixed(2), onInput: (v) => { if (modHand('material.slice.pos', v)) return; mat.slice.pos = v; schedule(TIER.PRESENT); } });
    r3.appendChild(ui.slicePosK.root);
    ui.sliceThickK = knob({ label: 'THICK', min: 0.01, max: 0.4, value: 0.03, log: true, fmt: (v) => v.toFixed(3), onInput: (v) => { if (modHand('material.slice.thick', v)) return; mat.slice.thick = v; schedule(TIER.PRESENT); } });
    r3.appendChild(ui.sliceThickK.root);
    /* 0.5.0 C1 · RAMP: the phase palette's editor is MIR's createRampPanel (panels/ramp.js — paletteview.js made generic, which leaves):
       the strip IS the phase circle (−π … +π, wrapping), its seam read in OKLab, the ring, the stops as handles, the presets in λWAVES'
       grouped order; the table is palette.js toLUT bit for bit.  PALETTE (on/off, the `palette` key) stays the app's switch, and the
       stops ride λWAVES' own project (`project: false`); `palette` keeps the editor's old API for serialize/restore, the link and LW. */
    const gp = group(wPal.body, 'COLOUR');
    const palOn = (v) => { mat.paletteOn = v; applyAccent(); if (v) { mat.view = VIEW.phase; ui.viewSeg.set('phase'); } schedule(TIER.PRESENT); };
    const palSw = sw({ label: 'PALETTE', value: false, onChange: palOn });
    el('div', 'row tight palette-enable', gp).appendChild(palSw.root).dataset.keyAction = 'palette';
    let palId = PAL_DEF, palStops = PALETTE_BY_ID.get(PAL_DEF).stops;
    const rv = createRampPanel({ parent: gp, cyclic: true, project: false, presets: PRESET_GROUPS.flatMap((g) => g.items),
      labels: { ticks: [[0, '−π'], [0.25, '−π/2'], [0.5, '0'], [0.75, '+π/2'], [1, '+π']], seam: 'SEAM at ±π', seamWarn: 'a visible seam at arg ψ = ±π', at: 'ARG ψ', fmt: (u) => ((2 * u - 1) * Math.PI).toFixed(3) + ' rad' },
      ramp: { get: () => ({ stops: palStops, preset: palId }), set: (s, o) => { palStops = s; if (o.preset) palId = o.preset; },
        lut: (lut) => { if (field.ok) field.setPalette(lut); applyAccent({ wheelStops: palStops }); schedule(TIER.PRESENT); } } }).view;   // the kit's accent takes stops: toLUT(palStops) is this lut bit for bit
    el('div', 'note', gp).innerHTML = '<b>Phase palette.</b> The strip runs from arg ψ = −π to +π and wraps at the seam. Tap the strip to add a stop, drag one to move it, drag it off the strip to remove it. OKLab blending keeps transitions perceptually even.';
    app.state.palette = { get stops() { return rv.stops(); }, get selected() { return rv.selected(); }, get on() { return palSw.get(); }, get id() { return palId; },
      get groups() { return PRESET_GROUPS.map((g) => ({ points: g.points, items: g.items.map((p) => p.id) })); },
      setOn(v) { palSw.set(!!v); palOn(!!v); }, select: (id) => rv.preset(id),
      /** the file's own stops under its name (the preset is kept when the file names none, so RESET still reloads it); `selected` is the stop the hand had */
      load(s, selected = 0, id) { rv.load(s, PALETTE_BY_ID.get(id) ? id : palId); const h = rv.handle(Math.max(0, Math.min(rv.stops().length - 1, Math.trunc(selected) || 0))); if (h) h.dispatchEvent(new FocusEvent('focus')); } };


    const rInv = el('div', 'row tight', wPal.body);
    ui.invertSw = sw({ label: 'INVERT', value: false, title: 'Invert field colour without changing ψ', onChange: (v) => { mat.invert = v; saveSettings(); schedule(TIER.PRESENT); } });
    rInv.appendChild(ui.invertSw.root);
    /* 0.5.0 C1 · THE CAMERA PANEL: MIR's createCameraPanel over A8's port, its rows built into this card now — HOME and the port's
       PAN HOME, CONTROL, the direction sphere (YAW · PITCH), the PAN pad (X · Y), ZOOM · FOV and the HAND (DRAG · FRICTION · FLING ·
       AUTO-ROTATE · SPIN).  No project part and no history: the pose rides λWAVES' own project and is no edit; the feel is a
       PREFERENCE, so a hand on it saves the settings (coalesced).  `mod` is the modulation port WITHOUT `add`: the panel registers no
       target — the saved observer.* routes stay the defs' below, whose knob accessors are these dials (camKnobs) — and a hand on a
       routed dial writes its base (modHand), as everywhere. */
    const gc = group(wCam.body, 'CAMERA'), FEEL = new Set(['spin', 'friction', 'drag', 'fling']); let feelSave = 0;
    const camPanel = createCameraPanel({ mode: '3d', modPrefix: 'observer', project: false, mod,
      port: { ...cameraPort, set(id, v) { cameraPort.set(id, v); if (FEEL.has(id)) { clearTimeout(feelSave); feelSave = setTimeout(saveSettings, 250); } } } });
    camPanel.spec.build(gc, null);
    const camView = camPanel.view(); camView.homeBtn.root.dataset.keyAction = 'camReset';
    app.state.camKnobs = Object.fromEntries(camView.targets().map((t) => [t.id, t.widget]));
    el('div', 'row tight', gc).appendChild(trig({ label: 'SET Δρ REF', title: 'Use the current density as the difference reference', onFire: () => { setReference(); ui.viewSeg.set('diff'); mat.view = VIEW.diff; } }).root);
    el('div', 'note', gc).innerHTML = '<b>Camera.</b> Drag the stage or the sphere to turn the view; Shift gives finer motion. Alt-drag, two fingers or the PAN pad slide the picture; the molecule stays the pivot. Double-click, double-tap or HOME restores the camera.';

    /* ── THE FILM (0.5.0 C7 · C7b): MIR's recorder handed λWAVES' frame(i, ctx) (render-exact.js createFilm); its UI is the kit's — the
       RENDER card (lab/film-card.js) and the TIMELINE window — and the CAPTURE group left.  While a film owns the page the rack's loop
       stands aside (no frame of ours presents with an unpinned seed: hazard H9), and what the film steps through — the state, the
       material, the pose, the rotation rates — is put back exactly as it was.  `__LW.captureUI` is its scripting facade: createFilm's
       named takes at C7's defaults (30 fps, 6 s, ×2), no UI; a verb while one runs stops it. */
    let exact = null, filmBefore = null, cap = null, facadeRun = null;
    function filmHold(on) {
      if (on) {
        filmBefore = { state: reg.serialize(clock.t), version: reg.version, mat: structuredClone(mat), obs: { ...obs }, rot: { ...rotRate } };
        app.state.exportLocked = true; if (rafId) cancelAnimationFrame(rafId); rafId = 0; stats.scheduled = false;
        return;
      }
      const b = filmBefore; filmBefore = null;
      if (b) { if (reg.version !== b.version) reg.restore(b.state); Object.assign(mat, b.mat); Object.assign(obs, b.obs); Object.assign(rotRate, b.rot); }   // a film that moved no coefficient leaves the register (and the loop plan made on it) as it was
      app.state.exportLocked = false; app.state.modWall = 0; lastWall = performance.now() / 1000;
      schedule(TIER.RECONSTRUCT);
    }
    const film = () => exact || (exact = createFilm(LW, { canvas: dom.canvas, energies: periodEnergies, canvasCap: 16384, host: () => app.state.modHost, hold: filmHold,
      road: { pending: () => ({ caption: stageCaption(), spin: camera.ambient && obs.mode !== 'free' ? camera.ambient : 0, yaw0: obs.yaw }), step: rotStep, rotating: rotDriving,
        plan: (o) => capture().planLoop(o) } }));   // the rack's own for the film's three schedules (take) and the card's road
    const capture = () => cap || (cap = createCapture(LW, { canvas: dom.canvas, canvasCap: 16384, energies: periodEnergies, caption: () => stageCaption() }));   // wave 58: capture reads the SAME energies periodNow() does, never the labels' ⟨H⟩; 0.4.0 S3: and draws the STAGE TEXT's caption
    const take = async (kind, o, keep) => {
      if (facadeRun) { facadeRun.stop(); return null; }
      facadeRun = film().take(kind, { fps: 30, seconds: 6, scale: 2, drive: app.state.modArm, ...o });
      try { const r = await facadeRun.done; if (r && r.ok && keep) film().save(r); return r; }
      catch (e) { return { ok: false, error: String(e && e.message || e) }; } finally { facadeRun = null; }
    };
    app.state.capApi = { get exact() { return film(); }, get capture() { return capture(); }, plan: () => capture().planLoop({ fps: 30, seconds: 6 }),
      limits: () => { try { return capture().limits(); } catch (_) { return maxPictureSize(field && field.ok ? field.device.limits : null, 16384); } },
      async picture() { const r = await capture().picture({ scale: 2 }); if (r && r.ok !== false) capture().save(r); return r; },
      record: () => take('clip', {}, true), loop: () => take('period', {}, true), exportFrames: (options = {}) => take('frames', { options }, options.download !== false),
      get busy() { return !!facadeRun || !!(exact && exact.running); } };
    const gq = group(ui.set.body, 'FIELD QUALITY');
    const r5 = el('div', 'row', gq);
    ui.gridSeg = seg({ label: 'GRID', value: String(quality.res),   /* wave 101: the CONTROL reads the shipped grid rather than restating it — a hardcoded '96' here would have disagreed with quality.res the moment the default moved */ options: [{ id: '64', label: '64³' }, { id: '96', label: '96³' }, { id: '128', label: '128³' }],
      onChange: (v) => { quality.res = +v; quality.steps = { 64: 110, 96: 160, 128: 240 }[+v]; quality.scale = { 64: 0.75, 96: 1, 128: 1 }[+v]; schedule(TIER.REBUILD); } });
    r5.appendChild(ui.gridSeg.root);
    r5.appendChild(seg({ label: 'FIELD CLOCK cap', value: '0', options: [{ id: '0', label: 'MAX' }, { id: '33', label: '30 Hz' }, { id: '66', label: '15 Hz' }, { id: '200', label: '5 Hz' }],
      onChange: (v) => { fieldRate.capMs = +v; } }).root);
    const r5b = el('div', 'row tight', gq);
    ui.autoSw = sw({ label: 'AUTO SCALE', value: true, title: 'Adjust canvas resolution to the frame budget', onChange: (v) => { quality.auto = v; if (!v) quality.autoScale = 1; saveSettings(); } }); r5b.appendChild(ui.autoSw.root);
    ui.govSw = sw({ label: 'GOVERNOR', value: true, title: 'Protect the frame rate automatically', onChange: (v) => { setGovernor(v); saveSettings(); } }); r5b.appendChild(ui.govSw.root);
    ui.perfSeg = seg({ label: 'PERFORMANCE', value: '120', options: [   // 0.4.0 S3: out of METERS, beside the GOVERNOR it works with
      { id: 'full', label: 'FULL', title: 'Update visible readers every frame' },
      { id: '120', label: '120 Hz', title: 'Update visible CPU readers every fourth frame' }],
      onChange: (v) => { setPerfMode(v); saveSettings(); } });
    r5b.appendChild(ui.perfSeg.root);
    ui.scaleRo = readout({ label: 'RENDER SCALE', value: '100%', sub: 'canvas pixels per CSS pixel × DPR' });
    r5b.appendChild(ui.scaleRo.root);
    const r6 = el('div', 'row', gq);
    ui.domainAuto = sw({ label: 'DOMAIN AUTO', value: true, onChange: (v) => { domain.auto = v; ui.domainKnob.setDisabled(v); schedule(TIER.REBUILD); } });
    r6.appendChild(ui.domainAuto.root);
    ui.domainKnob = knob({ label: 'HALF-WIDTH', min: 3, max: 140, value: 7, log: true, fmt: (v) => '±' + v.toFixed(0) + ' a₀', onChange: (v) => { domain.half = v; schedule(TIER.REBUILD); } });
    ui.domainKnob.setDisabled(true);
    r6.appendChild(ui.domainKnob.root);
    const r7 = el('div', 'row tight', gq);
    ui.keepSw = sw({ label: 'KEEP FRAMES', value: false, title: 'Update the playhead every frame', onChange: (v) => { setKeepFrames(v); saveSettings(); } }); r7.appendChild(ui.keepSw.root);
    el('div', 'note', gq).innerHTML = '<b>Performance.</b> AUTO SCALE lowers canvas resolution when frames exceed the budget. GOVERNOR can also pause expensive readers and retries them periodically. PERFORMANCE 120 Hz updates the visible CPU readers every fourth frame while the field presents every frame; FULL updates them every frame. KEEP FRAMES updates the playhead every frame and may cost performance.';
  }

  // STATE — preparation. Everything here changes c.
  const { clearRegister, wState } = createStateCard(app); app.w.clearRegister = clearRegister;   // 0.5.2 R2a: lab/windows/state.js (STATE's CLEAR with it)

  // SPECTRUM
  const { wSpec, spectrum, toggleFullscreen, normalizeNow, copyLatex, switchHamiltonian, setSturmian, applySturmian, paintSturmRo, sturmEigen, occupiedEigen,
    periodEnergies, selectEigen, setElement, fillValence } = createSpectrumCard(app);   // 0.5.2 R2a: lab/windows/spectrum.js
  app.w.toggleFullscreen = toggleFullscreen; app.w.copyLatex = copyLatex; app.w.occupiedEigen = occupiedEigen; app.w.periodEnergies = periodEnergies;   // 0.5.2 R3b: the transport's, the notebook's and the keys' reads

  rack.appendChild(wPal.root); rack.appendChild(wObs.root); rack.appendChild(wCam.root); rack.appendChild(wClip.root);
  rack.appendChild(ui.set.root);
  /* THE ABOUT FACE LIVES IN THE NOTEBOOK GLASS (wave 30), and its markup is lab/index.html's `.nb-aboutface`.
     A commented-out copy of the old in-window version sat here for twenty-nine waves; wave 59 deleted it,
     because it was a trap: it claimed two typefaces where three ship, named a font that has since been
     renamed for licence reasons, said "waves 5-27", and linked `/REPORT.md` at the SITE root — a path the
     deploy does not have.  Anyone who uncommented it would have shipped four wrong facts at once. */

  // SHADOW
  const wSh = device({ id: 'shadow', eyebrow: 'SHADOW', status: '' });
  rack.appendChild(wSh.root);
  const shCanvas = el('canvas', 'shadow-c', wSh.body);
  const shadowView = createShadowView(shCanvas, api);
  app.w.shadowView = shadowView;
  {
    const r = wSh.row();
    ui.shadowSeg = seg({ aria: 'shadow picture', value: 'phasors', options: [{ id: 'phasors', label: 'PHASORS' }, { id: 'oscillators', label: 'OSC', title: 'Oscillators' }, { id: 'lissajous', label: 'LISSA', title: 'Lissajous' }], onChange: (v) => { shadowView.setMode(v); schedule(TIER.PRESENT); } });
    r.appendChild(ui.shadowSeg.root);
    ui.hc = readout({ label: 'H_C = ½qᵀAq + ½pᵀAp = ⟨H⟩', value: '—' });
    r.appendChild(ui.hc.root);
    el('div', 'epi', wSh.body, 'THE SAME COEFFICIENTS IN q,p COORDINATES');
  el('div', 'note', wSh.body).innerHTML = '<b>Shadow.</b> Each complex coefficient appears as one q,p oscillator. This is a coordinate map of the same quantum state, not a classical atom model.';
  }
  /* the FOOTER (0.4.0 S3, out of the retired DYNAMICS): L, T, V, S and their history — native-ui.js seats it in SHADOW's
     details fold, and the frame loop runs it only while that fold is open */
  ui.shFoot = el('div', 'shadow-foot', wSh.body);
  const shadowFoot = createShadowFoot(ui.shFoot);

  // ORBIT — the two rotors (print, Thread B)
  const wOrb = device({ id: 'orbit', eyebrow: 'ORBIT', status: '' });
  rack.appendChild(wOrb.root);
  const orbit = createOrbit(wOrb.body, { reg, setStatus: (t, c) => wOrb.setStatus(t, c), rotor(spec) { reg.rotor(spec); touchState(); } });
  const kepler = createKepler(dom.kepler);
  {
    const rk = wOrb.row('tight');


    ui.kepShell = seg({ label: 'SHELL', value: '3', aria: 'Kepler shell',
      options: [2, 3, 4, 5, 6].map((n) => ({ id: String(n), label: 'n' + n, title: `Read orbit axes from shell ${n}` })),
      onChange: () => keplerRowSync(true) });
    rk.appendChild(ui.kepShell.root);
    {
      const rkk = wOrb.row('tight');
      /* SPIN is the drag's OWN FIRST LEG, and it is the same call — keplerTurn('spin', dθ) is what
         keplerDragToPoint reaches for once it has worked out the φ that puts the perihelion under
         the pointer.  One entry point, one fresh read, one convention check, one touchState. */
      ui.kepSpin = knob({ label: 'SPIN  ω', min: 0, max: 2 * Math.PI, value: 0, wrap: true, cls: 'rot', fmt: () => 'D(R_L̂)',
        title: 'Rotate perihelion within the orbit plane',
        onDelta: (d) => keplerTurn('spin', d) });
      ui.kepTilt = knob({ label: 'TILT  ν', min: 0, max: 2 * Math.PI, value: 0, wrap: true, cls: 'rot', fmt: () => 'D(R_n̂)',
        title: 'Change inclination around the ascending node',
        onDelta: (d) => keplerTurn('tilt', d) });
      ui.kepTurn = knob({ label: 'TURN  Ω', min: 0, max: 2 * Math.PI, value: 0, wrap: true, cls: 'rot', fmt: () => 'D(R_z)',
        title: 'Rotate the ascending node around world z',
        onDelta: (d) => keplerTurn('turn', d) });
      for (const k of [ui.kepSpin, ui.kepTilt, ui.kepTurn]) rkk.appendChild(k.root);
      ui.kepRo = readout({ label: 'ORBIT  a · e · coherence', cls: 'wide', value: '—', sub: 'pick a populated shell' });
      rkk.appendChild(ui.kepRo.root);
    }
    ui.keplerSw = sw({ label: 'KEPLER ORBIT', value: false, title: 'Draw the Kepler orbit over the field', onChange: (v) => { kepler.setOn(v); schedule(TIER.PRESENT); } }); rk.appendChild(ui.keplerSw.root);
  el('div', 'note', wOrb.body).innerHTML = '<b>Kepler overlay.</b> The selected shell sets the ellipse size and eccentricity from ⟨L⟩ and ⟨K⟩. Dashed lines indicate a low-coherence correspondence; no orbit is drawn below the threshold.';
  }

  // VORTEX — the flow: the nodal lines (print, Thread C), and the PARTICLES that ride the same current
  const wVor = device({ id: 'vortex', eyebrow: 'VORTEX', status: '' });
  rack.appendChild(wVor.root);
  const vortex = createVortex(wVor.body, dom.vortex, { reg, clock, scrubTo: (t) => { clock.scrub(t); schedule(TIER.EVOLVE); } });
  /* PARTICLES (0.4.0 S3 · R-W1: out of the retired DYNAMICS): de Broglie–Bohm tracers seeded from |ψ|² and riding v = j/ρ —
     the same current whose singular lines VORTEX locates, so the switch lives here and its overlay presents while VORTEX
     can.  COUNT and TRAIL are the project's (instruments.particles); the switch is the overlay's (overlays.particles). */
  const particles = createParticles(dom.particles, {});
  {
    const gP = group(wVor.body, 'PARTICLES'), r = el('div', 'row tight', gP);
    const seed = () => { particles.seed(Math.round(ui.pN.get()), reg, clock.t, domain.half); schedule(TIER.PRESENT); };
    ui.pOn = sw({ label: 'PARTICLES', value: false, title: 'Draw de Broglie–Bohm tracers seeded from |ψ|², riding the current v = j/ρ', onChange: (v) => { particles.setOn(v); if (v) seed(); else schedule(TIER.PRESENT); } });
    ui.pN = knob({ label: 'COUNT', min: 20, max: 600, value: 160, log: true, step: 10, fmt: (v) => v.toFixed(0), onChange: () => { if (ui.pOn.get()) seed(); } });
    ui.pTrail = knob({ label: 'TRAIL', min: 0, max: 120, value: 24, step: 1, fmt: (v) => v.toFixed(0), onInput: (v) => { particles.setTrail(Math.round(v)); schedule(TIER.PRESENT); } });
    for (const c of [ui.pOn, ui.pN, ui.pTrail]) r.appendChild(c.root);
    r.appendChild(trig({ label: 'RESEED', title: 'sample a fresh cloud from |ψ|² at the current time', onFire: () => { if (ui.pOn.get()) seed(); } }).root);
    el('div', 'note', gP).innerHTML = '<b>Particles.</b> Seeds follow |ψ|² and move with the probability current; a path never crosses a nodal line. Paths stop at the domain edge or near a node; speed is capped for display.';
  }
  /* FLOW (MOLECULAR WAVES stage 6): the SAME tracer view on its own canvas, riding a molecule's current v = j/ρ —
     the STATES register hands it a source (lab/molecular-flow.js) whose matrices it rebuilds once a frame */
  const flowTracers = dom.flow ? createParticles(dom.flow, { ink: () => (document.body.dataset.theme === 'light' ? { trail: 'rgba(16,36,84,0.42)', dot: 'rgba(10,22,56,0.92)', text: 'rgba(20,30,50,0.6)' } : { trail: 'rgba(190,230,255,0.4)', dot: 'rgba(235,248,255,0.95)', text: 'rgba(255,255,255,0.5)' }),
    caption: (st) => `FLOW · ${st.alive}/${st.count} tracers on v = j/ρ of the TD-CIS density matrix · sense exact, magnitude qualitative in STO-3G` }) : null;
  app.state.flowEpoch = null;                                                // the SOURCE the tracers were seeded from: a new source is a new ensemble

  // PLANE (id `slice`) — a rotatable complex plane through ψ (the 4D engine's rotor pair, carrying hydrogen's own 4-space)
  const wSlice = device({ id: 'slice', eyebrow: 'PLANE', status: '' });   // 0.4.0 S3 (R-W3): PLANE, once SLICE — the id and slice.* stay
  app.w.wOrb = wOrb; app.w.wVor = wVor; app.w.wSlice = wSlice;
  const slice = createSliceView(wSlice.body, {
    lut: () => (app.state.palette && app.state.palette.on ? toLUT(app.state.palette.stops) : null),
    repaint() { schedule(TIER.PRESENT); }
  });
  app.w.shadowFoot = shadowFoot; app.w.kepler = kepler; app.w.vortex = vortex; app.w.particles = particles; app.w.slice = slice;
  /* OPTIMIZATION 2026-09-24 · M6(b): appended AFTER its view is built (in its old seat, so the rack order and
     LW.bootOrder are unchanged).  Appended first, the plane model's construction-time paint read `cv.clientWidth` on a
     half-built rack and forced its first full style + layout (28.6 ms); disconnected, the read answers 0 without a
     flush, and the plane model's own ResizeObserver paints it once it is laid out. */
  rack.appendChild(wSlice.root);

  /* ── LEGACY WINDOWS (2026-10, Josh): all five are gone — QCD, H₂⁺ and HELIUM in 0.5.0 D9, H₂ and ELECTROSTATICS in D9b
     (R5-L1; ATOMS came back in 0.4.0 S3).  An older file that used one opens on its shim in restore and says so in one line. */

  /* H₂⁺ · LEGACY (the `molecule` card, with W-MO and W-PULSE) was DELETED in 0.5.0 D9: restore opens a file it owned as MOLECULES · H₂ */
  app.state.chem = null;                                                     // wave CHEMISTRY: the fifth field owner, assigned below
  app.state.restampParams = null;                                            // re-tag knobs as modulation targets: lanes built after boot call it (the REGISTER's phase needles)
  app.state.molSession = null;                                               // the one owner of the molecular volume, assigned beside CHEMISTRY below (the frame loop reads it)
  app.state.orbitals = null; app.state.states = null; app.state.register = null;                 // REGISTER: the window (register) and its two modes, assigned beside CHEMISTRY below
  let specFoldedByMol = false;           // 2026-10: SPECTRUM folded by a molecule taking the field (so the molecule's end unfolds it)
  function moleculeMode(v) {
    for (const w of [wState, wSh, wOrb, wVor, wSlice, wLad, wCalc]) if (w) w.root.hidden = !!v;   // CALCULUS reads the atomic register: it stands down too (Round 11 §10b)
    /* 2026-10 (Josh) · SPECTRUM is MINIMISED, not hidden: it stays on the rack, folded, while a molecule has the field, and
       unfolds when the molecule lets go — unless the reader folded or unfolded it themselves in between. */
    if (wSpec) {
      const folded = wSpec.root.classList.contains('folded');
      if (v && !folded) { wSpec.fold(true); specFoldedByMol = true; }
      else if (!v && specFoldedByMol) { if (folded) wSpec.fold(false); specFoldedByMol = false; }
    }
    if (v && app.state.space === 'p') { app.state.space = 'x'; if (ui.spaceSeg) ui.spaceSeg.set('x'); }
    if (!v) switchHamiltonian(getHamiltonian().id);                  // restore the atom's own hiding rules
    app.state.refSnapshot = null; app.state.pendingRef = null;
    schedule(TIER.REBUILD);
  }

  /* HELIUM · LEGACY (Hylleraas) was DELETED in 0.5.0 D9: restore opens a file it owned as SPECTRUM's ATOM · He 1s */

  /* H₂ · LEGACY (Heitler–London, the collision) was DELETED in 0.5.0 D9b: restore opens a file it owned as MOLECULES · H₂ */

  /* CHEMISTRY — eight molecules, RHF and the real-time δ-kick: the field becomes an AO density matrix.
     It is a FIELD OWNER, so it goes through the moleculeMode() policy. */
  let chemPrevView = null;   // the observable the field showed before CHEMISTRY (or the ORBITALS register) took it
  /* ONE ROAD to the field's observable for the molecular pair.  CHEMISTRY asks for density / real / diff, the
     ORBITALS register asks for phase, and `null` hands back whatever the user had before either of them took it —
     so handing the field between the two cards never loses the observable the user chose for themselves. */
  function molFieldView(name) {
    if (!name) { if (chemPrevView !== null) { mat.view = chemPrevView; if (ui.viewSeg) ui.viewSeg.set(VIEW_NAMES[chemPrevView]); chemPrevView = null; } }
    else if (VIEW[name] !== undefined && mat.view !== VIEW[name]) { if (chemPrevView === null) chemPrevView = mat.view; mat.view = VIEW[name]; if (ui.viewSeg) ui.viewSeg.set(name); }
    schedule(TIER.PRESENT);
  }
  /* THE MOLECULAR SESSION — one owner, and the end of "last writer wins".  CHEMISTRY and the ORBITALS register are
     PRODUCERS of its named models; it is the only module that touches the field's two molecular setters, and the
     only caller of the view road above, so the observable comes back to the user by the same rule whichever model
     let go of the field.  tests/field-owner.test.mjs is the law that keeps that "only" true. */
  app.state.molSession = createMolecularSession({ field: () => field, fieldView: molFieldView,
    repaint(rebuild) { schedule(rebuild ? TIER.REBUILD : TIER.PRESENT); } });
  const wChem = device({ id: 'chem', eyebrow: 'MOLECULES', title: 'RHF · real time', status: '' });
  if (useCompactDefaults) wChem.root.classList.add('closed');   // built closed (chemview's N8 shown() guard); the first-run block opens it on the LEFT rack — still no solve until it is switched on
  rack.appendChild(wChem.root);
  app.state.chem = createChem(wChem.body, { active: () => canPresent(wChem), loading: cardLoading(wChem, 'chem'), moreOpen: FIRST_RUN.more,   // 0.4.0 S0: the MORE fold opens on a desktop, folds on a phone or tablet
    solve: (msg, fallback, pluck) => solveChem(msg, fallback, pluck),
    repaint(rebuild) { schedule(rebuild ? TIER.REBUILD : TIER.PRESENT); },
    status(t, cls) { wChem.setStatus(t, cls); },
    setOn(v) { moleculeMode(v); stageTextTick(); },
    hand: (id) => headPick(id),                                      // 0.5.1 D2: a HAND pick (the dropdown, ON, a notebook link)
    /* the card does not touch the field: it hands `ground` and `tdhf` products to the session, which decides which
       model is playing and which observable the field shows.  See molecular-session.js. */
    session: app.state.molSession,
    derived: (fill) => (app.state.history ? app.state.history.absorb(fill) : fill()),   // S4 · a solve's derived defaults join the row that asked for it
    now: () => clock.t });
  /* 0.5.1 D2 · THE MOLECULE'S HEAD (R6-G): a HAND pick shows its head (latex-state.js moleculeHead: every number the record's stem or
     the live solve) in THE FADE's seat once THIS molecule's solve lands — held until Escape, a press on the picture after 2.5 s, or
     the next pick: the dismiss half of the kit's greet (info/page.js; λWAVES has no pages model).  A restore, an undo, a project,
     link or demo open never shows it — none comes through `hand`.  `head.shown` is the gate's witness (__LW.head). */
  const head = { shown: 0, md: null, want: null, bye: null };
  function headPick(id) { if (head.bye) head.bye(); head.want = id; headLand(app.state.chem.solution()); }
  function headLand(sol) {
    const id = head.want, row = id && MOLECULE_BY_ID.get(id);
    if (!row || !sol || !app.state.stageText) return;
    if (app.state.chem.preset() !== id) { head.want = null; return; }                      // the molecule changed first: nothing
    if (sol.key !== id + '|' + app.state.chem.basis + '|' + row.charge) return;             // chemview's solve key: this molecule's landing
    head.want = null;
    const md = moleculeHead({ molecule: row, basis: app.state.chem.basis, ground: sol, stem: sol.stem });
    if (!md || !app.state.stageText.announce(md, 0)) return;
    head.shown++; head.md = md;
    const life = new AbortController(), until = performance.now() + 2500, bye = head.bye = () => { life.abort(); if (head.bye === bye) head.bye = null; app.state.stageText.dismiss(md); };
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && !isField(e.target, true)) bye(); }, { signal: life.signal });
    dom.canvas.addEventListener('pointerdown', () => { if (performance.now() >= until) bye(); }, { signal: life.signal, passive: true });
  }
  app.state.chem.subscribe(headLand);

  /* THE STAGE TEXT (Settings › Display; 0.4.0 S3 · F2; 0.5.1 D1 below) — its SOURCE: what is playing, as markdown — the MOLECULES formula
     ($\mathrm{H_{2}O}$, latex-state.js formulaLatex) while MOLECULES is on, else SPECTRUM's populated states in stateLatex's
     own prose ("$2s_{0}$ and $2p_{-1}$"; A ↔ B under a TRANSITION).  The states go in with UNIT coefficients — the list line
     depends on which labels are populated, never on c — so no live coefficient can reach the stage.  The source is asked
     only when one of its inputs moved (the register's version, the pick, a legacy owner): one compare a CPU tick. */
  app.state.stageText = null;
  const stageSrc = { v: -1, id: null };
  /** the states that play, as stateLatex's prose with UNIT coefficients (md) or as their plain labels, comma-separated */
  function stageStates(md) {
    const H = getHamiltonian(), mix = reg.transition;
    const line = md ? (ids) => stateLatex({ H, states: ids.map((a) => ({ n: BASIS[a].n, l: BASIS[a].l, m: BASIS[a].m, re: 1, im: 0 })) }).split('\n')[0]
      : (ids) => ids.map((a) => (H.id === 'hydrogen' ? BASIS[a].label : H.labelOf(BASIS[a]))).join(', ');
    const live = (re, im) => BASIS.filter((s) => re[s.index] * re[s.index] + im[s.index] * im[s.index] > 1e-12).map((s) => s.index);
    if (mix) { const A = line(live(mix.reA, mix.imA)), B = line(live(mix.reB, mix.imB)); return A && B ? A + '  ↔  ' + B : A || B; }
    return line(reg.populated());
  }
  function stageMd() {
    const row = app.state.chem && app.state.chem.on ? MOLECULE_BY_ID.get(app.state.chem.preset()) : null;
    return row ? '$' + formulaLatex(row.formula) + '$' : stageStates(true);
  }
  /** THE CAPTION a capture carries (T3): the same stage text as ONE plain-Unicode line — `H₂O · 1b1 HOMO · STO-3G` (the
   *  formula, the ORBITAL on the field in names.js's plain form, the basis) or SPECTRUM's states ("2s₀, 2p₋₁"; A ↔ B) — drawn
   *  by capture.js, since the DOM formula never reaches an export.  It follows the STAGE TEXT switch.  KIT BRIEF 6 replaces it. */
  function stageCaption() {
    if (!app.state.stageText || !app.state.stageText.on) return '';
    const row = app.state.chem && app.state.chem.on ? MOLECULE_BY_ID.get(app.state.chem.preset()) : null;
    if (!row) return stageStates(false);
    const o = app.state.chem.exportNames(), k = o && o.orbital;
    return [mathPlain(row.formula), k && k.plain ? k.plain + (/^(HOMO|LUMO)$/.test(k.frontier) ? ' ' + k.frontier : '') : '', BASIS_LABEL[app.state.chem.basis] || ''].filter(Boolean).join(' · ');
  }
  function stageTextTick() {
    if (!app.state.stageText) return;
    const id = app.state.chem && app.state.chem.on ? app.state.chem.preset() : '';
    if (reg.version === stageSrc.v && id === stageSrc.id) return;
    stageSrc.v = reg.version; stageSrc.id = id;
    app.state.stageText.setFormula(stageMd());
  }
  app.w.stageTextTick = stageTextTick;
  /* 0.5.1 D1 · THE STAGE TEXT IS ONE BLOCK of the kit's INFORMATIONAL layer (mir/info/layer.js; stage-text.js left): the kit's ink,
     shade and serif at the kit's seat — the free stage's top + 12 %, between the racks, clear of the transport and a docked TIMELINE —
     and STILL: no subject, no labels, no parallax, no drift, no following, and never told of a camera move (a block with no subject
     depends on no view; the layer's own ResizeObserver and `resize` cover a size, and the racks and the transport are told below);
     only a pointer passing within the kit's reach (260 px) parts it, and HOLD (I) freezes even that.
     THE LAWS kept: the key is the STRING — a changed one is remove() + addBlock(), the kit's exit and entrance — and KaTeX runs at
     most four times a second (a change inside the quarter second waits, then renders whatever is wanted by then); OFF COSTS NOTHING
     (the root hidden, nothing added); THE FADE is a HAND's preset (`{ hand: true }`; the register's `announce`) in the formula's seat
     for 2.4 s — the formula leaves and comes back, and the kit's exit IS the fade.  The type (lab.css .lw-stage) is the notebook's:
     the formula its title (34 px), an announcement its heading (22 px), × SIZE.  THE ATOM LETTERS stay λWAVES' (R6-L): one element
     symbol per nucleus at its projected place, written only when the camera, the molecule, the SIZE or the canvas changed; white
     under `difference`, so each glyph inverts what it is on; the notebook's body (14 px) × SIZE. */
  function initStageText() {
    const KATEX_MS = 250, racks = () => [rackL, rack].filter((r) => r && r.querySelector('.dev:not(.closed):not([hidden])'));
    const layer = createInfoLayer({ stage: dom.stage, parallax: false, drift: false, follow: false,
      avoid: () => [...racks(), layout.docked ? null : document.getElementById('transport'), app.state.tl && app.state.tl.isOpen() ? app.state.tl.root : null].map((e) => paintedRect(e)).filter(Boolean) });
    layer.root.classList.add('lw-stage'); layer.root.setAttribute('aria-hidden', 'true');
    const stats = { renders: 0, announced: 0, places: 0, labelWrites: 0 };   // the gate's witnesses: KaTeX runs, banners, re-placements asked, letter moves
    let on = true, scale = 1, formula = '', banner = null, shown = '', block = null, lastRender = -1e9, wait = 0, fadeT = 0;
    function show() {                                                // the markdown wanted now, as a new block if it changed and KaTeX's quarter second has passed
      if (!on) return;
      const md = banner !== null ? banner : formula;
      if (md === shown) return;
      const due = lastRender + KATEX_MS - performance.now();
      if (due > 0) { if (!wait) wait = setTimeout(() => { wait = 0; show(); }, due); return; }
      if (block) block.remove();
      block = md ? layer.addBlock({ md }) : null; shown = md;
      if (block) { block.el.toggleAttribute('data-fade', banner !== null); lastRender = performance.now(); stats.renders++; }
    }
    /* the racks hide, peek and slide (body classes), the transport docks or goes to the top, the TIMELINE opens or docks: only THOSE
       re-place the block — the play edge's frost-hold and the tablet's motion class are not a reason to read layout — and once more
       400 ms on, when the slide or the pill's dodge (a class first, then its arrival) has landed */
    let settle = 0;
    const place = (again = true) => { stats.places++; layer.viewChanged(); clearTimeout(settle); if (again) settle = setTimeout(place, 400, false); };
    const rackKey = () => ['rack-hidden', 'rack-peek', 'rack-l', 'ui-hidden', 'phone', 'transport-peek'].map((c) => +document.body.classList.contains(c)).join('');
    let racksAt = rackKey();
    new MutationObserver(() => { const k = rackKey(); if (k === racksAt) return; racksAt = k; place(); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    for (const [n, f] of [[document.getElementById('transport'), ['class']], [app.state.tl && app.state.tl.root, ['hidden', 'style']]]) if (n) new MutationObserver(() => place()).observe(n, { attributes: true, attributeFilter: f });

    const labels = el('div', '', dom.stage); labels.id = 'atomLabels'; labels.setAttribute('aria-hidden', 'true'); labels.hidden = true;
    let cssW = dom.canvas.clientWidth, cssH = dom.canvas.clientHeight;
    if (typeof ResizeObserver === 'function') new ResizeObserver((e) => { const b = e[e.length - 1].contentRect; cssW = b.width; cssH = b.height; }).observe(dom.canvas);
    let atomsId = '', atoms = [], spans = [], labelsKey = '', placeKey = '';
    function atomLabels(id, obs, half) {
      if (!id || !on) { if (!labels.hidden) labels.hidden = true; labelsKey = placeKey = ''; return; }
      if (id !== atomsId) { atomsId = id; atoms = moleculeAtoms(id); labelsKey = ''; }
      if (labelsKey !== id + '|' + scale) {
        labelsKey = id + '|' + scale; placeKey = '';
        labels.textContent = ''; spans = atoms.map((a) => el('span', 'atom-label', labels, ELEMENT[a.Z] || '?'));
        labels.style.fontSize = Math.round(14 * scale) + 'px';
      }
      labels.hidden = false;
      if (cssW < 32 || cssH < 32) return;
      const key = `${labelsKey}|${cameraKey(obs)}|${obs.dist}|${obs.fov}|${half}|${cssW}|${cssH}`;
      if (key === placeKey) return;
      placeKey = key; stats.labelWrites++;
      const S = toScreen(obs, half, cssW, cssH);
      for (let i = 0; i < atoms.length; i++) {
        const a = atoms[i], sp = spans[i], q = S.at(a.x, a.y, a.z);
        if (!q) { sp.style.display = 'none'; continue; }
        sp.style.display = ''; sp.style.transform = `translate(${q[0].toFixed(1)}px, ${q[1].toFixed(1)}px) translate(-50%, -50%)`;
      }
    }
    app.state.stageText = {
      layer, stats, atomLabels,
      /** the formula's markdown ('' for none); the DOM moves only if the string did */
      setFormula(md) { formula = md || ''; if (banner === null) show(); },
      /** THE FADE: `md` in the formula's seat for `ttl` (0: until dismiss(md) — the molecule's head, D2), then its exit and the
       *  formula's return.  Only a HAND calls it. */
      announce(md, ttl = 2400) {
        if (!on || !md) return false;
        stats.announced++; clearTimeout(fadeT); banner = md; show();
        if (ttl) fadeT = setTimeout(() => { banner = null; show(); }, ttl);
        return true;
      },
      dismiss(md) { if (banner !== md) return; clearTimeout(fadeT); banner = null; show(); },   // a later announcement has already taken the seat: nothing
      setOn(v) { on = !!v; layer.root.hidden = !on; show(); },
      /** SIZE: the type × s (lab.css), then a re-measure — setPane(false) measures every bare block again (layer.js) */
      setScale(s) { scale = s; labelsKey = ''; layer.root.style.setProperty('--lw-stage-size', String(s)); stats.places++; layer.setPane(false); },
      get on() { return on; }, get md() { return shown; }, get formula() { return formula; }, get banner() { return banner; },
    };
    wChem.root.addEventListener('change', stageTextTick);           // the pick lands in `preset` at once; the solve comes later
    app.state.chem.subscribe(() => stageTextTick());                         // … and a restore / undo / link that re-solves
    paintMarks(); stageTextTick();
  }

  /* ORBITALS — the MOLECULAR REGISTER: ψ(r, t) = Σ_k c_k e^{−iε_k t} φ_k over CHEMISTRY's canonical orbitals, which
     is where a molecule's `arg` lives (MATH-H2O-2026-09-11, Proposition 1).  It is NOT a sixth field owner: it does
     not upload a molecule and it does not touch moleculeMode() — CHEMISTRY owns the shells and this window owns the
     matrix while REGISTER ON is up.  2026-10 (Josh): it STAYS on the rack whatever MOLECULES does — MOLECULES OFF only stands its
     switch down (orbitalsview.js update), and the ladder stays painted and editable. */
  const wOrbs = device({ id: 'orbitals', eyebrow: 'MO-REGISTRY', title: 'molecular orbital registry', status: '' });   // the id stays `orbitals` so saved layouts survive the rename (REGISTER-WINDOW-SPEC §11.1)
  app.w.wChem = wChem; app.w.wOrbs = wOrbs;
  if (useCompactDefaults) wOrbs.root.classList.add('closed');   // the same rule CHEMISTRY keeps; the first-run block opens it under MOLECULES
  rack.appendChild(wOrbs.root);
  app.state.register = createRegister(wOrbs.body, { active: () => canPresent(wOrbs),
    stamp: () => { if (app.state.restampParams) requestAnimationFrame(app.state.restampParams); },   // a lane built after boot becomes a drop target for a macro
    solve: (msg, fallback, pluck) => solveChem(msg, fallback, pluck),   // the STATES mode asks the chem worker for its canonical ladder and vectors
    repaint(rebuild) { schedule(rebuild ? TIER.REBUILD : TIER.PRESENT); },
    status(t, cls) { wOrbs.setStatus(t, cls); },
    announce: (md) => app.state.stageText && app.state.stageText.announce(md),        // a HAND's preset only (orbitalsview / statesview presetSel)
    now: () => clock.t, field: () => field, chem: () => app.state.chem, session: app.state.molSession });
  app.state.orbitals = app.state.register.orbitals; app.state.states = app.state.register.states;

  // CALCULUS — the stats, derived live, with their laws and residuals
  const wCalc = device({ id: 'calculus', eyebrow: 'CALCULUS', status: '' });
  rack.appendChild(wCalc.root);
  const calculus = createCalculus(wCalc.body, {});

  // METERS
  const wMet = device({ id: 'meters', eyebrow: 'METERS', status: '' });
  app.w.wMet = wMet;
  rack.appendChild(wMet.root);
  const meters = createMeters(wMet.body);

  {
    const rp = wMet.row('tight');                                     // 0.4.0 S3: PERFORMANCE moved to SETTINGS › QUALITY; the GOVERNOR's readout stays here
    ui.govRo = readout({ label: 'GOVERNOR  state · median · grid', value: 'nominal', cls: 'wide', sub: 'budget 22 ms · the window median' }); rp.appendChild(ui.govRo.root);
  el('div', 'note', wMet.body).innerHTML = '<b>Frame profile.</b> Times are moving averages measured in this browser. PERFORMANCE (SETTINGS › QUALITY) at 120 Hz updates visible CPU readers every fourth frame while the field continues to present each frame.';
  }
  // LADDER — the Rydberg revival as a spectral instrument (print, Thread A); its own register, no field
  const wLad = device({ id: 'ladder', eyebrow: 'LADDER', status: '' });
  app.w.wCalc = wCalc; app.w.wLad = wLad;
  if (useCompactDefaults) wLad.root.classList.add('closed');
  rack.appendChild(wLad.root);
  const ladder = createLadder(wLad.body, { active: () => canPresent(wLad), loading: cardLoading(wLad, 'revival'), solve: (params) => solveCard({ op: 'ladder', params }, () => solveLadder(params)) });
  app.w.ladder = ladder;
  /* Shift multi-add reopens several cards in one gesture. Each explicit request enters the card worker queue even
     if later cards land below the rack clip; the single worker keeps those solves from competing with the field. */
  wChem.root.addEventListener('devopen', () => app.state.chem.prepare());
  wOrbs.root.addEventListener('devopen', () => { app.state.chem.prepare(); app.state.orbitals.paint(); app.state.orbitals.refresh(); });   // the register runs on CHEMISTRY's ladder: opening it asks for one
  wLad.root.addEventListener('devopen', () => ladder.prepare());

  /* ── WAVE 52 · W-MODWINDOW: THE MODULATION RACK ────────────────────────────────────────────────
   * The model is lab/mir — vendored, headless, 53 gates green before a single pixel of this existed.
   * Four edges reach it and this is where all four are wired: the REGISTRY's catalogue (below), the
   * TARGET HOST's availability gate, the CLOCK's per-frame pump (in loop(), one call), and the
   * PRESENTATION callback, which is schedule(TIER.PRESENT) and is never allowed to be more.
   *
   * WHICH CONTROLS ARE OFFERED, and the line the choice draws.  MODULATION IS AN OBSERVER
   * INSTRUMENT: most targets move camera, material and physics RATE. Wave 107 adds three
   * operator rates that integrate into ψ; they own no absolute angle and share one held history
   * gesture. Absolute coefficient targets remain excluded. The original boundary explains why:
   *   · Every offered setter is a PRESENT — the contract forbids anything above it, so a target
   *     whose setter needs a REBUILD is not a target here.  That is why FIELD RESOLUTION and STEPS
   *     (in host.js's labParameters as the SHAPE of a catalogue) are NOT offered: an LFO on the grid
   *     would rebuild an N³ volume sixty times a second, and the governor owns that number anyway.
   *   · state.mode.<n:l:m>.amp / .phase are NOT offered either, and the reason is a real one found
   *     here: every register write bumps reg.version, which is the UNDO ring's trigger and the
   *     recurrence scan's cache key — an LFO on an amplitude would push an undo entry every 400 ms
   *     and re-run densityPeriod on every frame.  The register is the hand's, not the modulator's.
   *   · RANGES ARE THE DIALS' OWN, not host.js's illustrative ones: ZOOM really is [1.2, 8] and
   *     EXPOSURE really is [0.08, 12], because a registry whose range disagrees with the knob lies
   *     about where the parameter is the moment either end is reached.
   * Each adapter also moves the control's REAL DIAL (setKnob), because a knob that does not follow
   * the value it owns is a knob that lies — and the hand's road back is modHand(), above.  */
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
        get: () => obs.shift[0], set: (v) => { obs.shift = [clampShift([v, 0])[0], obs.shift[1]]; camOut('observer.panx', obs.shift[0]); } },
      { id: 'observer.pany', label: 'PAN Y', map: 'bipolar', min: -CAM.SHIFT, max: CAM.SHIFT, def: 0, group: 'observer', knob: () => app.state.camKnobs['observer.pany'], hint: 'the lens shift up and down: where the pivot sits on the frame',
        get: () => obs.shift[1], set: (v) => { obs.shift = [obs.shift[0], clampShift([0, v])[1]]; camOut('observer.pany', obs.shift[1]); } },
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

      /* CHEMISTRY offers exactly TWO targets and the choice is the same law as everywhere above: a κ and a
         RATE, both PRESENT-only setters that store a number and schedule nothing (the RT pump is already
         running a frame of its own when either matters).  The ORBITAL INDEX is deliberately NOT registered:
         it changes WHICH quantity the volume means, which is a rebuild of the picture's subject rather than
         a value to sweep — the same line that keeps FIELD RESOLUTION and STEPS out of this array. */
      { id: 'chem.kick', label: 'κ KICK', map: 'log', min: 1e-4, max: 1e-2, def: 1e-3, group: 'state', knob: () => (app.state.chem ? app.state.chem.knobs.kick() : null),
        hint: 'the δ-kick strength the next KICK will use — linear response wants the smallest κ the trace can carry',
        get: () => (app.state.chem ? app.state.chem.kappa : 1e-3), set: (v) => { if (app.state.chem) { app.state.chem.setKappa(v); setKnob(app.state.chem.knobs.kick(), app.state.chem.kappa); } } },
      { id: 'chem.speed', label: 'MOLECULES SPEED', unit: ' steps/frame', map: 'linear', min: 1, max: 50, def: 10, group: 'state', knob: () => (app.state.chem ? app.state.chem.knobs.speed() : null),
        hint: 'real-time propagation steps asked of the worker each frame',
        get: () => (app.state.chem ? app.state.chem.speed : 10), set: (v) => { if (app.state.chem) { app.state.chem.setSpeed(v); setKnob(app.state.chem.knobs.speed(), app.state.chem.speed); } } },
      /* THE REGISTER's SLOTS (REGISTER-WINDOW-SPEC §6): MORPH, and eight lane slots in lane order — S₀ is slot 1.
         PRESENT-only like every target here: a setter stores a number and the register's own frame push reads it.
         A slot with no lane behind it is a no-op, which is the present-only law for a lane that is not there. */
      { id: 'reg.morph', label: 'REG MORPH', map: 'linear', min: 0, max: 1, def: 0, group: 'state', knob: () => (app.state.states ? app.state.states.knobs.morph() : null),
        hint: 'where the STATES register plays on the path from store A to store B (MORPH must be on)',
        get: () => (app.state.states ? app.state.states.morph : 0), set: (v) => { if (app.state.states) { app.state.states.setMorphValue(v); setKnob(app.state.states.knobs.morph(), app.state.states.morph); } } },
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
       CHEMISTRY's two targets are `chem.kick` and `chem.speed`, and an id's root is what a saved route is addressed by — so it
       names the instrument, not the nearest existing group.  0.5.0 C1: `observer.yaw` / `observer.pitch` carry the CAMERA panel's
       sphere arcs, so they are drop targets now, like every observer.* dial. */
    app.state.modHost = mod.install(defs, ['observer', 'material', 'state', 'transport', 'field', 'chem', 'reg']);
    app.state.restampParams = mod.stamp;


    let trSeat = 'bottom', trMoving = false;
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
      const rs = Object.values(dodging).filter(Boolean), free = (s, w, h) => !rs.some((r) => hits(seatRect(s, w, h), r));
      occlusion.dirty();   // a paused field still has to move its line masks with the window
      const t = document.getElementById('transport');
      if (!t || !t.classList.contains('mini')) return;
      if (trMoving) { if (!rs.length) setTimeout(() => modDodge(rect, who), 320); return; }
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
      armed: () => app.state.modArm, arm: (on) => setModArm(!!on) }));
    app.state.modView.root.dataset.mirWindow = 'modulation';    // 0.5.0 A10's hook (the kit's controller sets the rail's, not the pane's)
    applyAccent();                                    // the two angles reach the window as soon as it exists
    app.state.modView.restore(readSettings().modwin);
    app.state.dodge = modDodge;                                 // 0.5.0 C7b: the TIMELINE's `moved` gives way through the same seat chooser
    /* wave 54: the modulation clock's visibility is driven by the ONE authority (setPageHidden), not by a second listener of its own — it still RE-ANCHORS and never jumps */
    if (page.hidden) app.state.modHost.clock.setHidden(true);
  }

  // ATOMS — the periodic table as one central field (Xα(2/3) + the Latter tail, solved live); it ships CLOSED.  0.4.0 S3 (R-A2):
  // no longer LEGACY — the periodic table of SPECTRUM's ATOM operator, with its own row in + and WINDOW
  const wAtoms = device({ id: 'atoms', eyebrow: 'ATOMS', status: '' });
  rack.appendChild(wAtoms.root); wAtoms.root.classList.add('closed');            // reopened from the + at the top of the rack
  const atomsView = createAtoms(wAtoms.body, {
    Z: () => HAMILTONIANS.atom.Z,
    select: (z) => setElement(z),
    fill: () => fillValence(),
    active: () => getHamiltonian().id === 'atom',
  });
  app.w.wAtoms = wAtoms; app.w.atomsView = atomsView;

  /* ELECTROSTATICS · LEGACY (Φ, E, B and j of the register's charge, the #fieldlines overlay) was DELETED in 0.5.0 D9b */

  // WIGNER — the one joint object of position and momentum, cut through the axis; a niche window: it ships CLOSED
  const wWig = device({ id: 'wigner', eyebrow: 'WIGNER', status: '' });
  rack.appendChild(wWig.root); wWig.root.classList.add('closed');                // reopened from the + at the top of the rack
  const wignerView = createWigner(wWig.body, { repaint() { schedule(TIER.PRESENT); } });
  app.w.wignerView = wignerView;

  // RADIATION — what the prepared pair would radiate, and the shape of its far field; also CLOSED
  const wRad = device({ id: 'radiation', eyebrow: 'RADIATION', status: '' });
  rack.appendChild(wRad.root); wRad.root.classList.add('closed');
  const radiationView = createRadiation(wRad.body, { repaint() { schedule(TIER.PRESENT); }, ab: () => app.hooks.ab });
  const WIG_OK = 'numerical · a slice, not a marginal', RAD_OK = 'exact matrix elements · classical far field';
  Object.assign(READERS, { spectrum: wSpec, shadow: wSh, orbit: wOrb, vortex: wVor, particles: wVor, kepler: wOrb,
    slice: wSlice, atoms: wAtoms, wigner: wWig, radiation: wRad, calculus: wCalc });   // the windows the READER LAW may park (never MOLECULE — it steps nuclei — nor METERS, which shows the governor)
  for (const w of [...Object.values(READERS), wVor, wMet, wLad]) windowActivity.track(w);
  /** the guard the two hydrogenic readers share: hydrogen at Z = 1, no Sturmian scale, no other model holding the
      field.  Both windows integrate the SHIPPED closed-form radials, so anything else would be two operators in one
      number; they say which one stood them down, in the wave-39 voice. */
  function hydroReader() {
    const H = getHamiltonian();
    if (sturm.P) return { on: false, status: 'hydrogen only: no closed form for the scaled radials',
      why: 'the STURMIAN scale is on: the scaled radials are not the ones this window integrates — switch SCALE back to HYDROGEN' };
    if (H.id !== 'hydrogen') return { on: false, status: 'hydrogenic register only', why: 'hydrogenic register only — the operator in force is ' + H.label };
    if (getZ() !== 1) return { on: false, status: 'hydrogenic register only (Z = 1)', why: 'the ion at Z = ' + getZ() + ' scales every radial: this window reads the Z = 1 closed forms' };
    if (app.state.chem && app.state.chem.on) return { on: false, status: 'hydrogenic register only', why: 'another model holds the field — this window reads the hydrogenic register' };   // 0.4.0 S0 · wave 137: MOLECULES too
    return { on: true, status: null, why: '' };
  }

  /* ── transport strip (§25): lab/shell/transport.js (0.5.2 R3b), created here — λWAVES' own bar ── */
  const { transport, togglePlay, setModArm, barLock } = createTransport(app);

  /* ── badges (§41) ─────────────────────────────────────────────────────── */
  const badges = createBadges({ dom, accept: () => swClient.accept(), field, reg, mat, clock, domain, quality,
    getSpace: () => app.state.space, stateReaders, ui });   // N7 seam 6: lab/badges.js

  /* ── WAVE 56 · THE INSTALL LAYER'S INTERFACE HALF: lab/sw-client.js (N7 seam 5).  The tab that ASKED reloads; a tab that
     did not ask is told and keeps its work.  It is LW.sw. ── */
  /* THE QUIET TAKE'S ONE DEFINITION (wave 133): a reload would bring back the same scene — a fresh boot, or the same link —
     and this browser's settings, so it loses nothing the reader made.  What a reload does NOT keep is the clock's position,
     a capture in flight and the AUTO-ROTATE switch; a capture is excluded here, and so, in the foreground, is a clock that
     has moved (played and paused, or scrubbed): that session is offered, not taken.  The take-on-hide road (ignorePlaying)
     keeps ignoring the clock — it takes while nobody watches.  So: the ring holds only its origin row, named `boot` or `link`
     (an `open · …`, `new project` or `resume` origin is a scene a reload would not bring back: the opener's covers and RESUME
     are offered a build, never taken); nothing is pending or held; the project is clean; no pointer is down; the
     photosensitivity notice is not up; nothing is being typed; no capture is running; and, unless the caller says playing is
     fine, the transport is paused at t = 0.  Read only after boot (register waits ≥ 1.5 s past load).  0.5.0 C6b: the same
     question, asked on pagehide, decides whether a reload of this tab skips the title screen (the boot tail). */
  const untouched = (ignorePlaying) => {
    const rows = app.state.history ? app.state.history.entries() : [];
    return rows.length === 1 && !app.state.history.canUndo && !app.state.history.pendingLabel && !app.state.history.holding
      && (rows[0].label === 'boot' || rows[0].label === 'link')
      && !(layout.projects && layout.projects.dirty) && !app.state.pointerHeld
      && !(warning && warning.open)
      && !(document.activeElement && /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName))
      && !(app.state.capApi && app.state.capApi.busy)
      && (ignorePlaying || (!clock.playing && !clock.t));
  };
  const swClient = createSwClient({ buildBadge: () => badges.build,
    setStatus: (text) => { if (ui.set) ui.set.setStatus(text, 'warn'); }, getProjects: () => layout.projects, untouched,
    host: dom.badges.parentElement });

  /* ── THE BOW: ctrl+drag draws it, release fires, releasing CTRL first cancels ── */
  app.state.bow = null; let bowPrevView = null;
  function bowStart(e) {
    const r = dom.canvas.getBoundingClientRect();
    app.state.bow = { x0: e.clientX - r.left, y0: e.clientY - r.top, x1: e.clientX - r.left, y1: e.clientY - r.top, k: 0, dir: [0, 0, 1] };
    bowPrevView = mat.view; mat.view = VIEW.phase; if (ui.viewSeg) ui.viewSeg.set('phase');
    try { if (e.pointerId !== undefined) dom.canvas.setPointerCapture(e.pointerId); } catch (_) {}
    kepler.setBow(app.state.bow); schedule(TIER.PRESENT);
  }
  function bowMove(e) {
    if (!app.state.bow) return;
    const r = dom.canvas.getBoundingClientRect();
    app.state.bow.x1 = e.clientX - r.left; app.state.bow.y1 = e.clientY - r.top;
    const dx = app.state.bow.x1 - app.state.bow.x0, dy = app.state.bow.y1 - app.state.bow.y0;
    app.state.bow.k = Math.min(mat.bow?.limit ?? 3, Math.pow(Math.hypot(dx, dy) / 120, mat.bow?.curve ?? 1) * (mat.bow?.gain ?? 1));                    // 120 px of pull = 1 a.u. of momentum, capped at 3
    const B = cameraBasis(obs);
    const d = [-(dx * B.right[0] - dy * B.up[0]), -(dx * B.right[1] - dy * B.up[1]), -(dx * B.right[2] - dy * B.up[2])];   // a bow: the arrow flies opposite to the pull; screen y points down
    const n = Math.hypot(d[0], d[1], d[2]);
    app.state.bow.dir = n > 0 ? [d[0] / n, d[1] / n, d[2] / n] : [0, 0, 1];
    mat.boost.k = [app.state.bow.dir[0] * app.state.bow.k, app.state.bow.dir[1] * app.state.bow.k, app.state.bow.dir[2] * app.state.bow.k]; mat.boost.on = app.state.bow.k > 0;
    kepler.setBow(app.state.bow); schedule(TIER.PRESENT);
  }
  /* THE BOW LANDS ASYNCHRONOUSLY (wave 45).  The slap (kick.js) or the packet (well.js) is computed in the maths
     worker and lands when it answers — the pointer is free the moment the finger lifts (measured before: 127 ms on
     the first hydrogen bow, 191 ms + a 1.2 s frame on a BOX bow).  bowChain is the queue: two bows in flight land in
     order, on the state the first one left; LW.bow.landed resolves when the queue is empty.  The SLAP trigger, the K
     key and LAUNCH keep the synchronous road. */
  app.state.bowChain = Promise.resolve(); app.state.bowInFlight = 0;
  function bowRelease() {
    if (!app.state.bow) return;
    const k = app.state.bow.k, dir = app.state.bow.dir, x0 = app.state.bow.x0, y0 = app.state.bow.y0; bowCancel();
    if (k <= 0.005) return;
    const job = getHamiltonian().id === 'well' ? () => launchPacketAsync(unproject(x0, y0), dir.map((v) => v * k), gasSigma(k)) : () => slapAlongAsync(k, dir);   // the GAS: a new packet where you pressed
    app.state.bowInFlight++; wState.setStatus('the impulse is in flight…', 'live');
    app.state.bowChain = app.state.bowChain.then(job).catch((e) => { __e.push('BOW ' + (e && e.message || e)); }).then(() => { if (--app.state.bowInFlight === 0) wState.setStatus('changes c'); });
  }
  /** the BOX bow: wellPacket in the worker, the same numbers as launchPacket, landed on the clock's time when it answers */
  async function launchPacketAsync(x0, kvec, sigma) {
    if (app.state.gasAxial || !maths.ok) { launchPacket(x0, kvec, sigma); return; }
    const r = await maths.call({ op: 'packet', x0, k: kvec, sigma, radius: HAMILTONIANS.well.radius });
    if (!r || r.error) { launchPacket(x0, kvec, sigma); return; }
    if (getHamiltonian().id !== 'well' || app.state.gasAxial) return;                             // the box was left while the packet was in flight
    reg.clear(); for (let a = 0; a < 91; a++) if (r.re[a] || r.im[a]) reg.set(a, r.re[a], r.im[a], clock.t);
    app.state.lastLaunch = { x0, k: kvec, sigma, captured: r.captured };
    if (ui.gasRo) { ui.gasRo.set(`${(100 * r.captured).toFixed(1)}% held`, r.captured > 0.85 ? 'ok' : 'warn'); ui.gasRo.setSub(`σ = ${sigma.toFixed(2)} a₀ at (${x0.map((v) => v.toFixed(1)).join(', ')}) · |k| = ${Math.hypot(...kvec).toFixed(2)} · the box resolves ≈ a/6 = ${(HAMILTONIANS.well.radius / 6).toFixed(1)} a₀`); }
    touchState();
  }
  /** the hydrogen / oscillator bow: the slap on a snapshot of c(t) in the worker, set back at that time on landing —
      exact, the law being time-translation invariant; ATOM and QUARKONIUM (tabulated radials) keep the synchronous road */
  async function slapAlongAsync(k, dir) {
    const H = getHamiltonian();
    if (!maths.ok || !(H.id === 'hydrogen' || H.id === 'qho')) { slapAlong(k, dir); return; }
    if (!reg.populated().length) reg.set(0, 1, 0, clock.t);
    const t0 = clock.t, v0 = reg.version, c = reg.at(t0), n0 = reg.norm2();
    const r = await maths.call({ op: 'kick', re: c.re, im: c.im, k, d: dir, ham: H.id, Z: getZ() }, [c.re.buffer, c.im.buffer]);
    if (!r || r.error) { slapAlong(k, dir); return; }
    if (reg.version !== v0 || getHamiltonian() !== H) { slapAlong(k, dir); return; }     // the state moved under the bow: slap what is there now, synchronously
    reg.setAnchorAt(r.re, r.im, t0);
    const n1 = reg.norm2(), esc = n0 > 0 ? 1 - n1 / n0 : 0;
    if (ui.kickRo) {
      ui.kickRo.set(`${(100 * esc).toFixed(2)}% · ${(r.p1 - r.p0).toFixed(4)}`, esc > 0.2 ? 'warn' : 'ok');
      ui.kickRo.setSub(`impulse vector: <m>k</m> = ${k.toFixed(3)} along (${dir.map((v) => v.toFixed(2)).join(', ')}) · Ehrenfest would give ${k.toFixed(3)} · <m>‖ψ‖</m> now ${Math.sqrt(n1).toFixed(4)}`);
    }
    touchState();
  }
  /* ── KEPLER AS A CONTROL SURFACE: the perihelion handle drives exact rotors on the state ── */
  function pointerRay(px, py) {                                     // S2: toScreen's inverse, so the lens shift is the overlays' own
    const S = toScreen(obs, domain.half, dom.canvas.clientWidth, dom.canvas.clientHeight);
    return { cam: S.eye, d: S.ray(px, py), B: S.basis, target: S.target };
  }
  function orbitOfShell(n, re, im) {
    const c = re ? { re, im } : (reg.field.Fz !== 0 ? reg.at(clock.t) : { re: reg.re0, im: reg.im0 });
    const o = keplerOrbits(c.re, c.im, 0.01).find((x) => x.orbit.n === n); return o ? o.orbit : null;
  }
  /** a rotor about an arbitrary axis: carry the axis to z with spatial rotors, turn about z, carry it back */
  function rotorSeq(which, axisVec, angle) {
    const seq = rotorsToZ(axisVec), out = [];
    for (const r of seq) out.push({ which: 'both', axis: r.axis, angle: r.angle });
    out.push({ which, axis: 'z', angle });
    for (const r of [...seq].reverse()) out.push({ which: 'both', axis: r.axis, angle: -r.angle });
    return out;
  }
  const applySeq = (seq) => { for (const s of seq) reg.rotor({ ...s, t: clock.t }); };
  /* ══ THE ONE ROAD EVERY KEPLER EDIT TAKES ══════════════════════════════════════════════════════
   * The drag and the knobs are the same two moves, so they are the same two functions.  A Kepler
   * edit has exactly two legs, which is what keplerDragToPoint has always been:
   *   keplerTurn(kind, dθ)  — a ROTATION, about an axis read off the orbit NOW
   *   keplerSeekE(n, eT)    — an ECCENTRICITY, which has no closed form and must be searched
   * The drag hands the first a φ computed from the pointer and the second an eT computed from the
   * pointer's radius; the knobs hand the first their own delta and the second their own number.
   * Neither road caches the orbit, and that is the whole reason the two agree: both read it fresh
   * from reg.re0/im0, so a knob turned after a drag sees what the drag left, and a drag started
   * after a knob sees what the knob left.  Two roads with two reads would drift within one gesture.
   */
  const kepShell = () => (ui.kepShell ? +ui.kepShell.get() : 3);
  /** the axis a kind names, read off a FRESH orbit — or null when the orbit has no such axis */
  function keplerAxis(kind, o) {
    if (kind === 'turn') return [0, 0, 1];                             // world z: native to reg.rotor, no conjugation
    if (kind === 'spin') return o.normal;                              // L̂ — the drag's own first leg
    /* THE NODE LINE: ẑ × L̂, the intersection of the orbit plane with the reference plane.  It
       degenerates exactly when the plane is ALREADY level (L̂ ∥ ẑ), where every in-plane direction
       is a node and the choice is free — so û is taken, which still tips the plane and is the one
       in-plane axis the state itself names. */
    const N = o.normal, nx = -N[1], ny = N[0], nl = Math.hypot(nx, ny);
    return nl > 1e-6 ? [nx / nl, ny / nl, 0] : o.u;
  }
  /** THE ROTATION LEG.  Fresh read, isotropy guard, rotor, convention check, one touchState. */
  function keplerTurn(kind, dth, n = kepShell()) {
    if (!['spin', 'tilt', 'turn'].includes(kind) || !Number.isFinite(dth) || !Number.isInteger(n) || n < 2 || n > 6 || !(Math.abs(dth) > 1e-9)) return false;
    const o = orbitOfShell(n); if (!o || o.isotropic) return false;    // no ⟨L⟩ and no ⟨K⟩: there is no axis, and the dials are already disabled
    const ax = keplerAxis(kind, o); if (!ax) return false;
    applySeq(rotorSeq('both', ax, dth));
    /* THE SAME CHECK THE DRAG MAKES, stated without a target: the rotor convention is checked, not
       assumed.  û is carried by |dθ| about ax, so the achieved turn must have the sign asked for —
       if it went the other way, turn back twice as far.  Skipped for 'turn', whose axis is ẑ and
       whose sign reg.rotateZ has always fixed, and skipped when û lies along the axis (nothing to
       measure).  A projection is used rather than the full angle so a tilt out of the plane, which
       moves û legitimately, is not read as a wrong-way turn. */
    if (kind !== 'turn') {
      const p = orbitOfShell(n);
      if (p && !p.isotropic) {
        const proj = (v) => { const d = v[0] * ax[0] + v[1] * ax[1] + v[2] * ax[2]; return [v[0] - d * ax[0], v[1] - d * ax[1], v[2] - d * ax[2]]; };
        const a0 = proj(o.u), a1 = proj(p.u), l0 = Math.hypot(...a0), l1 = Math.hypot(...a1);
        if (l0 > 1e-6 && l1 > 1e-6) {
          const c = (a0[0] * a1[0] + a0[1] * a1[1] + a0[2] * a1[2]) / (l0 * l1);
          const s = (ax[0] * (a0[1] * a1[2] - a0[2] * a1[1]) + ax[1] * (a0[2] * a1[0] - a0[0] * a1[2]) + ax[2] * (a0[0] * a1[1] - a0[1] * a1[0])) / (l0 * l1);
          if (Math.atan2(s, c) * dth < 0) applySeq(rotorSeq('both', ax, -2 * dth));
        }
      }
    }
    touchState(); return true;
  }
  /** bring shell n's perihelion to the world point w (in its orbit plane): around by D(R) about L̂, in/out by e^{−iθ â·K} */
  function keplerDragToPoint(n, w) {
    const o = orbitOfShell(n); if (!o || o.isotropic) return false;
    const N = o.normal, wl = Math.hypot(w[0], w[1], w[2]); if (wl < 1e-6) return false;
    const uT = [w[0] / wl, w[1] / wl, w[2] / wl];
    const cr = [o.u[1] * uT[2] - o.u[2] * uT[1], o.u[2] * uT[0] - o.u[0] * uT[2], o.u[0] * uT[1] - o.u[1] * uT[0]];
    const phi = Math.atan2(cr[0] * N[0] + cr[1] * N[1] + cr[2] * N[2], o.u[0] * uT[0] + o.u[1] * uT[1] + o.u[2] * uT[2]);
    if (Math.abs(phi) > 1e-6) {
      /* THE DRAG'S FIRST LEG IS THE SPIN KNOB'S CALL.  It used to carry its own copy of the rotor
         and its own convention check; both now live in keplerTurn, so the two controls cannot
         diverge — a fix to the convention is a fix to both, which is what one entry point buys. */
      keplerTurn('spin', phi, n);
      const chk = orbitOfShell(n);                                     // and the DRAG keeps its own extra check, which keplerTurn cannot make: it has a TARGET, and the target is the better witness
      if (chk && !chk.isotropic && (chk.u[0] * uT[0] + chk.u[1] * uT[1] + chk.u[2] * uT[2]) < Math.cos(Math.abs(phi)) - 1e-3) applySeq(rotorSeq('both', N, -2 * phi));
    }
    const eT = Math.max(0, Math.min(0.96, 1 - wl / o.a));
    const o2 = orbitOfShell(n); if (!o2 || o2.isotropic) { touchState(); return true; }
    const ax = [N[1] * o2.u[2] - N[2] * o2.u[1], N[2] * o2.u[0] - N[0] * o2.u[2], N[0] * o2.u[1] - N[1] * o2.u[0]];   // N × û: in the plane, ⟂ the perihelion
    const c0 = reg.field.Fz !== 0 ? reg.at(clock.t) : { re: Float64Array.from(reg.re0), im: Float64Array.from(reg.im0) };
    const eAt = (th) => { const re = Float64Array.from(c0.re), im = Float64Array.from(c0.im); for (const s of rotorSeq('K', ax, th)) rotorOnCopy(re, im, s); const q = orbitOfShell(n, re, im); return q && !q.isotropic ? q.e : 0; };
    /* the angle: e(θ) is periodic and bounded (|L|² + |K|² is a shell invariant, so e ≤ √(L²+K²)/n) — scan the whole
       turn for the θ whose e is closest to the target, then refine; an out-of-reach target lands on the shell's maximum */
    let th = 0, best = Math.abs(o2.e - eT);
    for (let i = 1; i <= 64; i++) { const t = -Math.PI + 2 * Math.PI * i / 64, d = Math.abs(eAt(t) - eT); if (d < best - 1e-12) { best = d; th = t; } }
    let step = Math.PI / 64; for (let it = 0; it < 24; it++) { step *= 0.5; for (const t of [th - step, th + step]) { const d = Math.abs(eAt(t) - eT); if (d < best - 1e-12) { best = d; th = t; } } }
    if (Math.abs(th) > 1e-7) applySeq(rotorSeq('K', ax, th));
    const o3 = orbitOfShell(n);                                          // the rotor may have set K along −û: half a turn about L̂ (spatial, exact) puts the perihelion where the pointer is
    if (o3 && !o3.isotropic && o3.e > 1e-3 && (o3.u[0] * uT[0] + o3.u[1] * uT[1] + o3.u[2] * uT[2]) < 0) applySeq(rotorSeq('both', N, Math.PI));
    touchState(); return true;
  }
  function keplerDragTo(n, px, py) {
    const o = orbitOfShell(n); if (!o || o.isotropic) return false;
    const { cam, d } = pointerRay(px, py), N = o.normal;
    const dn = d[0] * N[0] + d[1] * N[1] + d[2] * N[2]; if (Math.abs(dn) < 1e-6) return false;
    const lam = -(cam[0] * N[0] + cam[1] * N[1] + cam[2] * N[2]) / dn; if (lam <= 0) return false;
    return keplerDragToPoint(n, [cam[0] + lam * d[0], cam[1] + lam * d[1], cam[2] + lam * d[2]]);
  }
  /* THE ROW SAYS WHY A CONTROL IS DEAD, because a control that stops working without saying so is
     the same defect as one that silently no-ops.  Keyed on reg.version — the key orbit.js,
     keplerview.js, spectrum.js and nine other readers already use — so a still instrument spends a
     single integer compare per frame here and nothing else. */
  let kepRowVer = -1, kepRowTime = NaN;
  function keplerRowSync(force) {
    if (!ui.kepShell || !ui.kepRo) return;
    const time = reg.field.Fz !== 0 ? clock.t : 0;
    if (!force && reg.version === kepRowVer && time === kepRowTime) return;
    kepRowVer = reg.version; kepRowTime = time;
    const lit = new Map(keplerOrbits(reg.field.Fz !== 0 ? reg.at(clock.t).re : reg.re0, reg.field.Fz !== 0 ? reg.at(clock.t).im : reg.im0, 0.01).map((x) => [x.orbit.n, x.orbit]));
    for (const n of [2, 3, 4, 5, 6]) { const b = ui.kepShell.button(String(n)); if (b) b.disabled = !lit.has(n); }
    ui.kepShell.set(ui.kepShell.get());
    const n = kepShell(), o = lit.get(n);
    const dead = !o || o.isotropic;
    for (const k of [ui.kepSpin, ui.kepTilt, ui.kepTurn]) if (k) k.setDisabled(dead);
    if (!o) { ui.kepRo.set(`n${n} not populated`, 'warn'); ui.kepRo.setSub('this shell carries less than 1 % of the norm — nothing to turn'); return; }
    if (o.isotropic) { ui.kepRo.set(`n${n} isotropic`, 'warn'); ui.kepRo.setSub('⟨L⟩ = ⟨K⟩ = 0: no normal, no node line, no perihelion — there is no axis to turn about'); return; }
    const warn = o.coherence < 0.5;
    ui.kepRo.set(`a = ${o.a} a₀ · e = ${o.e.toFixed(3)} · coh ${o.coherence.toFixed(2)}`, warn ? 'warn' : 'ok');
    ui.kepRo.setSub(warn
      ? 'below coherence ½ NO ELLIPSE IS DRAWN (Round 11 A5) — but ⟨L⟩ and ⟨K⟩ are exact and so are the rotors, so the knobs stay live: the refusal is the picture\'s, not the operator\'s'
      : `L̂ = (${o.normal.map((v) => v.toFixed(2)).join(', ')}) · û = (${o.u.map((v) => v.toFixed(2)).join(', ')}) · the rotors turn EVERY populated shell; this shell supplies the axes`);
  }
  app.state.kdrag = null;
  /* the point on the plane through the origin ⟂ the view direction that sits under a screen position */
  function unproject(px, py) {
    const { cam, d, B, target: T } = pointerRay(px, py);              // N6: pointerRay's ray met with the plane through the TARGET
    const lam = ((T[0] - cam[0]) * B.fwd[0] + (T[1] - cam[1]) * B.fwd[1] + (T[2] - cam[2]) * B.fwd[2]) / (d[0] * B.fwd[0] + d[1] * B.fwd[1] + d[2] * B.fwd[2]);
    const p = [cam[0] + lam * d[0], cam[1] + lam * d[1], cam[2] + lam * d[2]];
    const a = HAMILTONIANS.well.radius, r = Math.hypot(...p), cap = 0.75 * a;
    return r > cap ? p.map((c) => c * cap / r) : p;                 // keep the launch point well inside the wall
  }
  camera.pointer = { ray: pointerRay, unproject };                  // S2: the pointer maths, for the camera-shift gate (__LW.camera.pointer)
  /* a DESIGN CHOICE, labelled: a harder pull launches a tighter packet (a boost alone never changes a width) */
  app.state.gasWidth = 1.8; app.state.gasAxial = false;
  const gas = createGas(HAMILTONIANS.well.radius);
  app.w.kepShell = kepShell; app.w.keplerRowSync = keplerRowSync;
  /* K5w (optimization 2026-09-24 · AUDIT-B FB1, AUDIT-F F11, SOL-REVIEW K5, PLAN §9) · SPECTRUM's `⟨z⟩ · σ_z` line.
     gas.stats(t) is 8–17 ms and ran on the frame thread every 6th CPU tick while the gas played — outside tick(), so no
     profile or governor saw it.  Now the maths worker runs the SAME stats() on its own gas (mathworker.js gasStats: its
     tables from the same radius, the page's register copied by the message) and the line is painted when the answer
     lands: the same doubles, the same strings, one round trip later (N1).  One request in flight; a tick that finds one
     leaves only its t, asked when the answer lands.  An answer for another radius or another packet (WELL RADIUS, a new
     LAUNCH, the 91 basis) or for a window that can no longer present is dropped.  `raw`, not `call`: this readout never
     raised the busy mark and must not flash it at 2.5 Hz.  With no worker the old synchronous road runs, as it did. */
  let gasAsk = null, gasNext = null;
  const gasPaint = (s) => ui.gasRo.set(`${(100 * gas.captured).toFixed(1)}% held · ⟨z⟩ ${s.z.toFixed(2)} · σ_z ${s.sz.toFixed(2)}`, gas.captured > 0.85 ? 'ok' : 'warn');
  const gasCurrent = (q) => { const R = gas.register; return !!(canPresent(wSpec) && gas.on && ui.gasRo && R && R.re0 === q.re0 && gas.radius === q.radius); };
  function gasAskWorker(q) {
    gasAsk = q;
    maths.raw(q).then((r) => {
      gasAsk = null;
      if (r && r.stats) { if (gasCurrent(q)) gasPaint(r.stats); }
      else if (!maths.ok && gasCurrent(q)) gasPaint(gas.stats(q.t));             // the worker died under this request: the old road answers it
      const n = gasNext; gasNext = null;
      if (n && gasCurrent(n)) { if (maths.ok) gasAskWorker(n); else gasPaint(gas.stats(n.t)); }
    });
  }
  function gasReadout(t) {
    if (!maths.ok) { gasPaint(gas.stats(t)); return; }
    const R = gas.register, q = { op: 'gas.stats', radius: gas.radius, t, re0: R.re0, im0: R.im0, t0: R.t0 };   // posted, so COPIED — never transferred
    if (gasAsk) gasNext = q; else gasAskWorker(q);
  }
  /* optimization K7 · THE GAS TABLE — THE DEFAULT since W125 (Josh, 2026-09-25); `?gastab=0` / __LW.gasTable(false) opt out.
     Armed at boot, built only once the axial gas holds a packet (gas.js slices it in idle time), uploaded by the field, and
     the records carry their rows only once it is held; the landing repaints a live gas.  While an EXPORT holds the loop the
     upload answers null (not now) and gas.js retries on a later idle slice: a deterministic render never straddles it. */
  const gasTableOn = (on) => gas.setTable(on, (tab) => app.state.exportLocked ? null : !!(field.ok && field.setGasTable && field.setGasTable(tab)), () => { if (gas.on) schedule(TIER.RECONSTRUCT); });
  const gasSigma = (k) => Math.max(0.5, Math.min(3, app.state.gasWidth * (1 - 0.18 * Math.min(k, 3))));
  function launchPacket(x0, kvec, sigma) {
    if (app.state.gasAxial) {                                                      // the AXIAL register: along z, on the axis
      const A = HAMILTONIANS.well.radius, z0 = Math.max(-0.8 * A, Math.min(0.8 * A, x0[2] || -A / 2)), kz = kvec[2] !== 0 ? kvec[2] : Math.hypot(...kvec);
      const G = gas.launch(z0, kz, sigma, clock.t);
      reg.clear(); app.state.refSnapshot = null;
      app.state.lastLaunch = { x0: [0, 0, z0], k: [0, 0, kz], sigma, captured: G.captured, axial: true };
      if (ui.gasRo) { ui.gasRo.set(`${(100 * G.captured).toFixed(1)}% held · axial`, G.captured > 0.85 ? 'ok' : 'warn'); ui.gasRo.setSub(`σ = ${sigma.toFixed(2)} a₀ at z = ${z0.toFixed(1)} · k = ${kz.toFixed(2)} along z · ${G.modes} modes (m = 0, l ≤ 15)`); }
      touchState(); return;
    }
    const P = wellPacket(x0, kvec, sigma);
    reg.clear(); for (let a = 0; a < 91; a++) if (P.re[a] || P.im[a]) reg.set(a, P.re[a], P.im[a], clock.t);
    app.state.lastLaunch = { x0, k: kvec, sigma, captured: P.captured };
    if (ui.gasRo) { ui.gasRo.set(`${(100 * P.captured).toFixed(1)}% held`, P.captured > 0.85 ? 'ok' : 'warn'); ui.gasRo.setSub(`σ = ${sigma.toFixed(2)} a₀ at (${x0.map((v) => v.toFixed(1)).join(', ')}) · |k| = ${Math.hypot(...kvec).toFixed(2)} · the box resolves ≈ a/6 = ${(HAMILTONIANS.well.radius / 6).toFixed(1)} a₀`); }
    touchState();
  }
  app.state.lastLaunch = null;

  function enterBox() {
    const ax = keyState.axis, a = HAMILTONIANS.well.radius, d = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] }[ax], k = ui.gasSpeed && ui.gasSpeed.get ? ui.gasSpeed.get() : 0.8;
    launchPacket(d.map((v) => -v * a / 2), d.map((v) => v * k), gasSigma(k));
    if (!clock.playing) { clock.play(performance.now() / 1000); schedule(TIER.EVOLVE); }
  }
  /** the oscillator's exact rigid packet: ground state, slapped */
  function coherentBounce() {
    if (getHamiltonian().id !== 'qho') { setHamiltonian('qho'); switchHamiltonian('qho'); if (ui.hamSeg) ui.hamSeg.set('qho'); }
    const ax = keyState.axis, d = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] }[ax], k = ui.gasSpeed && ui.gasSpeed.get ? ui.gasSpeed.get() : 0.8;
    reg.clear(); reg.set(0, 1, 0, clock.t);            // label 0 = 1s = the oscillator's ground state
    reg.kickAlong(k, d, clock.t);
    app.state.lastLaunch = { x0: [0, 0, 0], k: d.map((v) => v * k), sigma: 1 / Math.SQRT2, captured: reg.norm2(), coherent: true };
    if (ui.gasRo) { ui.gasRo.set(`coherent · |α|² = ${(k * k / 2).toFixed(2)}`, 'ok'); ui.gasRo.setSub(`⟨z⟩ = ${k.toFixed(2)} sin t · rigid · period 2π · ${(100 * reg.norm2()).toFixed(2)}% in N ≤ 10`); }
    touchState();
    if (!clock.playing) { clock.play(performance.now() / 1000); schedule(TIER.EVOLVE); }
  }
  app.w.gas = gas; app.w.gasSigma = gasSigma; app.w.launchPacket = launchPacket; app.w.enterBox = enterBox; app.w.coherentBounce = coherentBounce;
  function bowCancel() {
    app.state.bow = null; mat.boost.on = false; kepler.setBow(null); app.state.keplerDirty = true;   // one clearing draw of the KEPLER canvas after the arrow
    if (bowPrevView !== null) { mat.view = bowPrevView; if (ui.viewSeg) ui.viewSeg.set(VIEW_NAMES[bowPrevView]); bowPrevView = null; }
    schedule(TIER.PRESENT);
  }
  function pAlongDir(dir) {
    const c = reg.at(clock.t), re = Float64Array.from(c.re), im = Float64Array.from(c.im);
    for (const r of rotorsToZ(dir)) rotorOnCopy(re, im, { which: 'both', axis: r.axis, angle: r.angle });
    return momentumZ(re, im);
  }
  function slapAlong(k, dir) {
    if (!reg.populated().length && getHamiltonian().id !== 'well') { reg.set(0, 1, 0, clock.t); }
    const n0 = reg.norm2(), p0 = pAlongDir(dir);
    reg.kickAlong(k, dir, clock.t);
    const n1 = reg.norm2(), p1 = pAlongDir(dir), esc = n0 > 0 ? 1 - n1 / n0 : 0;
    if (ui.kickRo) {
      ui.kickRo.set(`${(100 * esc).toFixed(2)}% · ${(p1 - p0).toFixed(4)}`, esc > 0.2 ? 'warn' : 'ok');
      ui.kickRo.setSub(`impulse vector: <m>k</m> = ${k.toFixed(3)} along (${dir.map((v) => v.toFixed(2)).join(', ')}) · Ehrenfest would give ${k.toFixed(3)} · <m>‖ψ‖</m> now ${Math.sqrt(n1).toFixed(4)}`);
    }
    touchState();
  }
  window.addEventListener('keyup', (e) => { if (e.key === 'Control' && app.state.bow) bowCancel(); });

  /* ── THE FLOATING RACK: hide button, hover-reveal, draggable cards, hint icons, the transport's dock ── */
  const rackL = document.getElementById('rackL');
  for (const rk of [rack, rackL]) if (rk) rk.addEventListener('scroll', () => { gov.scroll = performance.now(); }, { passive: true });   // wave 45: a scrolling rack makes every reader yield for 150 ms
  /* body.rack-l says the mirror rack holds cards: the stage captions step right of it */
  if (rackL) { const syncL = () => document.body.classList.toggle('rack-l', rackL.children.length > 0); new MutationObserver(syncL).observe(rackL, { childList: true }); syncL(); }
  const LAYOUT_SLOTS = 4;      // wave 54: four favourite layouts, numbered — see the note at the ☆ button


  const floats = document.getElementById('floats'); app.host.rackL = rackL; app.host.LAYOUT_SLOTS = LAYOUT_SLOTS; app.host.floats = floats; app.host.swClient = swClient;
  app.w.bowStart = bowStart; app.w.bowMove = bowMove; app.w.bowRelease = bowRelease; app.w.bowCancel = bowCancel; app.w.keplerDragTo = keplerDragTo;   // 0.5.2 R3b: the stage gestures' (rack-wiring)
  /* ── INK STAYS UNDER GLASS (2026-09-11) ─────────────────────────────────────────────────────────
   * The field's frame, axes and slice outline are 1-px lines drawn on the stage; a translucent pane over
   * the stage showed them as a hairline through a device's title. Skip only PAINTED surfaces, not the
   * transparent layout box around a disconnected card or the modulation constellation. Otherwise the
   * frame is cut into a moving rectangle wherever that box goes. Rectangles are gathered here — one
   * layout burst, at most every 300 ms while a frame runs, and never inside a paint.  0.5.0 A7: each species is a
   * provider in lab/occlusion.js, registered below in the old order; this host converts, clears and presents. */
  const NO_OCCLUSION = [];
  function refreshOcclusion(nowMs) {
    app.state.occludeDirty = false; app.state.occludeAt = nowMs;
    /* LA3 · HIDDEN, NOTHING IS PAINTED, SO NOTHING MASKS.  Under body.ui-hidden every surface below is display:none
       (lab.css: the racks, transport, sheet and both lists !important; #floats (the keyboard window too) and #notebook !important), and
       #keysheet no longer exists — so the burst's answer is exactly [] and its layout reads bought nothing, every 300 ms
       (AUDIT-B FB5, REFUTE-E/F).  The empty block is still HANDED OVER, because the line pass still runs under H (the
       slice outline) and the rectangles from before the hide must not punch holes in it; setOcclusion compares its
       signature, so an already-empty block costs a string compare.  The body-class observer below re-dirties the
       burst on the way back. */
    if (document.body.classList.contains('ui-hidden')) { if (field.setOcclusion(NO_OCCLUSION)) schedule(TIER.PRESENT); return; }
    const cb = dom.canvas.getBoundingClientRect();
    const toCanvas = (r) => { const x0 = r.left - cb.left, y0 = r.top - cb.top, x1 = r.right - cb.left, y1 = r.bottom - cb.top;
      return x1 - x0 < 2 || y1 - y0 < 2 || x1 <= 0 || y1 <= 0 || x0 >= cb.width || y0 >= cb.height ? null : [x0, y0, x1, y1]; };
    if (field.setOcclusion(occlusion.rects(toCanvas))) schedule(TIER.PRESENT);
  }
  { const body = document.body, { root: mw, rail } = app.state.modView, dirty = occlusion.dirty, shown = (d) => !d.hidden && !d.classList.contains('closed');
    const rackShown = () => !body.classList.contains('rack-hidden') || body.classList.contains('rack-peek'), rects = (els) => els.map((s) => paintedRect(s));
    /* a card is one pane, or (DISCONNECTED, never on a phone) its head and its body with the stage showing between them */
    const panes = (d) => body.classList.contains('disconnected') && !body.classList.contains('phone') ? [d.querySelector('.dev-head'), d.querySelector('.dev-body')] : [d];
    /* Device cards scroll inside the modulation run. Their offscreen bounds must not mask the stage. */
    occlusion.register('modwin', () => shown(mw) ? [...mw.querySelectorAll('.m2rail, .m2dev, .m2workbar')].map((s) => paintedRect(s, s.classList.contains('m2dev') && s.closest('.m2run'))) : []);
    occlusion.register('chiprail', () => shown(rail) ? rects([...rail.querySelectorAll('.crail-chip')]) : []);
    /* 0.5.0 C4: the kit's window travels (tweenRect) and fades (presence); its `hidden` lands when the exit ends, and onGeometry
       tells every place, landing, open and close — both are the one producer's, so a paused field's mask follows them */
    for (const el of [mw, rail]) occlusion.watch(el, { attributes: true, attributeFilter: ['hidden'] });
    app.state.modView.onGeometry(dirty);
    occlusion.register('floats', () => rects([...floats.children].filter((d) => d.classList.contains('dev') && shown(d)).flatMap(panes)));
    occlusion.register('extra', () => rects(['transport', 'notebook', 'sheet', 'offer', 'rackAddList', 'rackFavList'].map((id) => document.getElementById(id))));
    occlusion.register('keymap', () => rects([document.querySelector('[data-mir-window="keyboard"]'), ...document.querySelectorAll('[data-mir-rail="keyboard"] .mir-chip')]));   // C3: the kit's window and its rail
    occlusion.register('rack', () => rackShown() ? rects([rack, rackL].flatMap((rk) => rk ? [...rk.children] : []).filter((d) => d.classList.contains('dev') && !d.classList.contains('closed')).flatMap(panes)) : [],
      { standIn: () => rackShown() ? [paintedRect(rack), paintedRect(rackL)] : [] });   // past the block's 32 the two columns stand in for their cards
    for (const el of [floats, rack, rackL]) occlusion.watch(el, { childList: true });
    /* A paused field has no periodic frame to notice a source card sliding under the run's clip. */
    if (floats) floats.addEventListener('scroll', dirty, { capture: true, passive: true });
    for (const id of ['notebook', 'transport', 'sheet', 'offer', 'rackAddList', 'rackFavList']) occlusion.watch(document.getElementById(id), { attributes: true, attributeFilter: ['style', 'hidden', 'class'] });
    new MutationObserver(dirty).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    for (const rk of [rack, rackL]) if (rk) rk.addEventListener('scroll', dirty, { passive: true });
    window.addEventListener('resize', dirty, { passive: true });
    /* 0.5.0 C3 · the kit's rack moves a floating card by `translate` and left/top and animates a folding card's height: a card's OWN
       style or class (never a knob's inside it) dirties the block, so a paused field's mask follows the hand and the fold */
    const own = new MutationObserver((rs) => { if (rs.some((r) => [floats, rack, rackL].includes(r.target.parentElement))) dirty(); });
    for (const el of [floats, rack, rackL]) if (el) own.observe(el, { attributes: true, subtree: true, attributeFilter: ['style', 'class'] });
  }
  /* ── 0.5.0 C3 · THE RACK IS THE KIT'S: lab/shell/rack-wiring.js (0.5.2 R3b), created here; its second seat, wireStage(), follows the notebook's ── */
  const { rk, layout, wTr, tablet, syncPhone, wireStage } = createRackWiring(app);
  /* ── §19b the skip links · the dock chip · MENUS and the menubar · THE NOTEBOOK · PROJECTS: lab/shell/notebook.js (0.5.2 R3b), created here ── */
  createNotebook(app);
  wireStage();   // §19a's second seat (lab/shell/rack-wiring.js): the crossings' listeners and the stage gestures, after the notebook's, as they stood
  /* ── KEYS: a rebindable action table · THE KEYBOARD WINDOW · THE TIMELINE · THE TAB ORDER: lab/shell/keys.js (0.5.2 R3b), created here ── */
  const { stageHasFocus, keyState } = createKeys(app);

  /* ── persistence (§46): lab/shell/persist.js (0.5.2 R3a), created here — serialize and restore whole ── */
  const { modSeats, serialize, restoreModulation, save, copyJSON, restore } = createPersist(app); app.sh.modSeats = modSeats;
  /* ── WAVE 56 · SHAREABLE LINKS: lab/shell/links.js (0.5.2 R3a), created here; the link opens at §29 ── */
  const { notCarriedWords, mintLink, copyLink, openLink } = createLinks(app);
  /* 0.3.1 · S3 THE TRUE HISTORY and its card: lab/shell/history.js (0.5.2 R3a), created here, so the card keeps its seat in the rack */
  const { historyApi } = createHistory(app); app.sh.historyApi = historyApi;

  /* ── the diagnostics surface (tests and curiosity; one road) ──────────── */
  const modEdited = () => { if (app.state.modView) app.state.modView.rebuild(); hNote(); };   // LW.mod's model edits: shown, and maybe a row (S3)
  const LW = {
    ready: false, reg, clock, obs, mat, quality, domain, camera, fieldRate, stats, field, presets: PRESETS, TIER, shadowView, spectrum, orbitView: orbit, vortex, ladder, particles, get particleUI() { return { on: ui.pOn, n: ui.pN, trail: ui.pTrail }; }, slice, kepler, chem: app.state.chem, head, calculus, layout, setTheme(t) { if (app.hooks.setTheme) app.hooks.setTheme(t); }, setCardStyle(c) { return setCardStyle(c); }, get cardStyle() { return document.body.dataset.card || 'refractive'; }, setFrost(m) { return setFrost(m); }, get frostLive() { return document.body.classList.contains('frost') && !document.body.classList.contains('frost-hold'); }, setDisconnected(v) { return setDisconnected(v); }, get disconnected() { return document.body.classList.contains('disconnected'); }, applySettings, get settings() { return readSettings(); }, get build() { return BUILD_LINE; }, get ab() { return app.hooks.ab; }, get notebook() { return layout.notebook; }, get period() { return app.hooks.period ? app.hooks.period() : null; }, get gas() { return gas; }, /** optimization K7 / W125: the gas table, ON by default — gasTable(true|false) switches it, gasTable() reads 'off' | 'building' (wanted: armed until the first AXIAL launch, then sliced in idle time) | 'on' */ gasTable(on) { if (on !== undefined) gasTableOn(!!on); return gas.table; }, setGasBasis(v) { if (ui.gasBasis) ui.gasBasis.set(v); app.state.gasAxial = v === 'axial'; if (!app.state.gasAxial) gas.off(); hNote(); schedule(TIER.RECONSTRUCT); }, get gasBasis() { return app.state.gasAxial ? 'axial' : 'reg'; }, keplerDrag(n, w) { return keplerDragToPoint(n, w); }, keplerTurn(kind, dth, n) { return keplerTurn(kind, dth, n); }, get keplerShell() { return kepShell(); }, setKeplerShell(n) { if (ui.kepShell) { ui.kepShell.set(String(n)); keplerRowSync(true); } return kepShell(); }, keplerOrbitOf(n) { return orbitOfShell(n === undefined ? kepShell() : n); }, get rotRate() { return { ...rotRate }; }, setRotRate(which, v) { const k = which === 'z' ? 'z' : which === 'kz' ? 'kz' : which === 'def' ? 'def' : null; if (!k) return null; if (!Number.isFinite(v)) return null; const w = (k !== 'z' && sturm.P) ? 0 : Math.max(-ROT_LIMIT[k], Math.min(ROT_LIMIT[k], v)); if (modHand('state.' + (k === 'z' ? 'rot.z' : k === 'kz' ? 'stark.kz' : 'defect.l2'), w)) return w; return setRotationRate(k, w); }, get rotDriving() { return rotDriving(); }, get projects() { return layout.projects; }, rateOf(a) { return rates[a]; }, setRate(a, r) { return api.setRate(a, r); }, saveSettings, setStage(v) { return app.hooks.setStage ? app.hooks.setStage(v) : null; }, setStyle(name) { if (STYLE[name] === undefined) return false; mat.style = STYLE[name]; if (ui.styleSeg) ui.styleSeg.set(name); schedule(TIER.PRESENT); return true; }, accent: { set(a, b) { look.set({ ...(a !== undefined && { accentA: a }), ...(b !== undefined && { accentB: b }) }); }, get a() { return look.get('accentA'); }, get b() { return look.get('accentB'); }, colorAt(deg) { return rgbToHex(wheelColor(deg)); } }, get theme() { return document.body.dataset.theme || 'dark'; }, get themeChoice() { return look.get('theme'); }, launchPacket, get lastLaunch() { return app.state.lastLaunch; }, enterBox() { if (getHamiltonian().id !== 'well') { setHamiltonian('well'); switchHamiltonian('well'); if (ui.hamSeg) ui.hamSeg.set('well'); } enterBox(); }, coherentBounce() { coherentBounce(); }, get autoQ() { return autoQ; }, governor: { get on() { return gov.on; }, set on(v) { setGovernor(v); }, get drop() { return gov.drop; }, get median() { return gov.median; }, get changes() { return gov.changes; }, get parked() { return [...gov.parked.keys()]; }, get probes() { return gov.probes; }, get probeMs() { return READER_LAW.probeMs; }, get state() { return !gov.on ? 'off' : gov.drop ? 'stepped-' + gov.drop : 'nominal'; }, get resolution() { return effectiveRes(); }, get work() { return perf.work; } }, maths: { get ok() { return maths.ok && scan.ok; }, get bow() { return maths.ok; }, get scan() { return scan.ok; }, get started() { return { bow: maths.started, scan: scan.started, cards: cards.started }; }, call: (m) => maths.call(m) }, get keepFrames() { return keep.frames; }, setKeepFrames, packetCentroid(G = 24) { const c = reg.at(clock.t); return wellCentroid(c.re, c.im, reg.populated(), { G }); }, setIonZ(z) { setZ(z); switchHamiltonian('hydrogen'); if (ui.zKnob) ui.zKnob.set(z); }, get Z() { return getZ(); }, perf: { get mode() { return perf.mode; }, setMode: setPerfMode, get profile() { return perf.profile; }, get counts() { return perf.counts; }, /** the median of the loop's OWN main-thread ms over the last 60 frames — the budget-independent read of "is hidden cheaper?" */ get median() { return ringMedian(perf.ring); }, /** LA1: the same median over the WHOLE loop, timed from its entry */ get loopMedian() { return ringMedian(loopRing); }, resetRing() { perf.ring.fill(0); loopRing.fill(0); } }, get keys() { return app.hooks.keys; }, bow: { start: (x, y) => bowStart({ clientX: x, clientY: y }), move: (x, y) => bowMove({ clientX: x, clientY: y }), release: () => bowRelease(), cancel: () => bowCancel(), get active() { return !!app.state.bow; }, get k() { return app.state.bow ? app.state.bow.k : 0; }, get dir() { return app.state.bow ? app.state.bow.dir : null; }, get landed() { return app.state.bowChain; }, get inFlight() { return app.state.bowInFlight > 0; } }, kickAlong(k, d) { slapAlong(k, d); }, setDamping(g) { reg.setDamping(g); touchState(); }, get hamiltonian() { return getHamiltonian().id; }, setHamiltonian(id) { switchHamiltonian(id); if (ui.hamSeg) ui.hamSeg.set(id); }, kick(k, axis = 'z') { if (app.hooks.slap) app.hooks.slap(k, axis); }, get space() { return app.state.space; }, setSpace(s) { if (s === 'p' && sturm.P) return false; app.state.space = s; if (ui.spaceSeg) ui.spaceSeg.set(s); schedule(TIER.REBUILD); }, get palette() { return app.state.palette; },
    /* ── WAVE 54 ─────────────────────────────────────────────────────────────────────────────────────────────── */
    /** THE BACKGROUNDED TAB.  Read-only counters plus the two levers a gate needs: the workers' own busy ledger,
     *  and a speculative job it can issue to prove the park is real in both directions. */
    background: { get hidden() { return page.hidden; }, get parks() { return page.parks; }, get resumes() { return page.resumes; },
      get via() { return page.via; }, get hiddenMs() { return page.hiddenMs; }, get mark() { return page.mark; },
      get firstDt() { return page.firstDt; }, get firstWall() { return page.firstWall; }, get jumped() { return page.jumped; }, get back() { return page.back; },
      get visibility() { return document.visibilityState; },
      async workerStat() { return { bow: maths.ok ? await maths.stat() : null, scan: scan.ok ? await scan.stat() : null }; },
      /** a SPECULATIVE job (the SLAP warm): it waits while the page is hidden and runs on resume — the falsifiable half */
      probe() { return maths.ok ? maths.raw({ op: 'warm', ham: 'hydrogen', Z: 1 }) : Promise.resolve(null); },
      /** a BOUNDED job the user asked for: it runs whether the page is hidden or not, by the stated rule */
      scanNow() { return scan.ok ? scan.raw({ op: 'period', energies: reg.populated().map((a) => energyOf(a)), horizon: 400 }) : Promise.resolve(null); } },
    /** THE CAMERA'S SECOND MODE.  setCamMode('turntable', true) levels instantly; without it the roll slerps 150 ms. */
    get camMode() { return obs.mode; }, get camQuat() { return obs.mode === 'free' ? obs.quat.slice() : quatFromYawPitch(obs.yaw, obs.pitch); }, get camLevelling() { return !!camLevel.from; },
    setCamMode(m, now) { return setCamMode(m, now ? { now: true } : undefined); },
    cameraBasis() { return cameraBasis(obs); }, orbitBy(dy, dp) { orbitBy(dy, dp); schedule(TIER.PRESENT); return { yaw: obs.yaw, pitch: obs.pitch }; },
    /** THE DITHER.  setDither(0) is OFF and OFF adds exactly zero to the colour. */
    get dither() { return mat.dither || 0; },
    setDither(k) { mat.dither = Math.max(0, +k || 0); if (ui.ditherSeg) ui.ditherSeg.set(mat.dither ? 'ordered' : 'off'); if (ui.ditherK) { ui.ditherK.setDisabled(!mat.dither); if (mat.dither) ui.ditherK.set(Math.max(0.25, Math.min(2, mat.dither))); } schedule(TIER.PRESENT); return mat.dither; },
    /** THE GAMUT, and the LAW: `state()` reports both sides, and they are never allowed to differ. */
    gamut: { get support() { return field.ok ? field.gamutSupport : { canvas: false, css: false, display: false, reason: 'no WebGPU device' }; },
      get canvas() { return field.ok ? field.gamut : 'srgb'; }, get dom() { return document.body.dataset.gamut || 'srgb'; },
      get available() { const g = field.ok ? field.gamutSupport : null; return !!(g && g.canvas && g.css); },
      get disabled() { const b = ui.gamutSeg && ui.gamutSeg.button('p3'); return !!(b && b.disabled); },
      get reason() { const b = ui.gamutSeg && ui.gamutSeg.button('p3'); return b ? b.title : ''; },
      state() { const c = field.ok ? field.gamut : 'srgb'; const d = document.body.dataset.gamut || 'srgb'; return { canvas: c === 'srgb' ? 'srgb' : 'p3', dom: d, agree: (c === 'srgb') === (d === 'srgb') }; },
      set(id) { return app.hooks.setGamut ? app.hooks.setGamut(id) : 'srgb'; } },
    /** THE PALETTE by NAME, and the menu's grouping by stop count */
    setPalette(id) { return app.state.palette ? app.state.palette.select(id) : false; },
    get paletteId() { return app.state.palette ? app.state.palette.id : null; }, get paletteGroups() { return app.state.palette ? app.state.palette.groups : []; },
    loadPreset, schedule, togglePlay, setReference, serialize, restore, api,
    /* ── ORBITALS · the MOLECULAR REGISTER, one road (MATH-H2O Proposition 1) ─────────────────────
     * ψ(r, t) = Σ_k c_k e^{−iε_k t} φ_k over CHEMISTRY's canonical orbitals.  `ladder()` is the
     * solved ε_k with their ground-state occupancies; `state()` carries the selection, Σ|c|² and the
     * beat period 2π/Δε of the two strongest levels — the FROZEN-ORBITAL gap, never ω_RPA. */
    orbitals: {
      select(k, amp = 1, phase = 0) { return app.state.orbitals.select(k, amp, phase); },
      deselect(k) { return app.state.orbitals.deselect(k); },
      toggle(k) { return app.state.orbitals.toggle(k); },
      clear() { return app.state.orbitals.clear(); },
      norm() { return app.state.orbitals.norm(); },
      setAmp(k, v) { return app.state.orbitals.setAmp(k, v); }, setPhase(k, v) { return app.state.orbitals.setPhase(k, v); },
      setOn(v) { return app.state.orbitals.setOn(v); }, get on() { return app.state.orbitals.on; },
      setFlow(v) { return app.state.orbitals.setFlow(v); }, get flowOn() { return app.state.orbitals.flowOn; },
      preset(name) { return app.state.orbitals.preset(name); }, store(w) { return app.state.orbitals.store(w); }, setMorph(on, sv) { return app.state.orbitals.setMorph(on, sv); },
      get dials() { return app.state.orbitals.dials; }, setDials(v) { return app.state.orbitals.setDials(v); },
      ladder() { return app.state.orbitals.ladder(); }, state() { return app.state.orbitals.state(); },
      solution() { return app.state.orbitals.solution(); },
      save() { return app.state.orbitals.save(); }, load(r) { return app.state.orbitals.load(r); },
    },
    /* the REGISTER window's switch and its STATES mode: the many-electron register over S₀ and the TDA states */
    register: { get mode() { return app.state.register.mode; }, setMode(v) { return app.state.register.setMode(v); }, save() { return app.state.register.save(); }, load(r) { return app.state.register.load(r); } },
    states: {
      select(k, amp, phase) { return app.state.states.select(k, amp, phase); }, deselect(k) { return app.state.states.deselect(k); }, toggle(k) { return app.state.states.toggle(k); },
      clear() { return app.state.states.clear(); }, norm() { return app.state.states.norm(); }, setAmp(k, v) { return app.state.states.setAmp(k, v); }, setPhase(k, v) { return app.state.states.setPhase(k, v); },
      preset(name) { return app.state.states.preset(name); }, play(k) { return app.state.states.play(k); }, store(w) { return app.state.states.store(w); },
      setMorph(on, s) { return app.state.states.setMorph(on, s); }, setView(v) { return app.state.states.setView(v); }, setRef(v) { return app.state.states.setRef(v); },
      setFlow(v) { return app.state.states.setFlow(v); }, get flowOn() { return app.state.states.flowOn; }, flowState() { return flowTracers ? { on: flowTracers.on, ...flowTracers.state } : null; },
      setDrive(v) { return app.state.states.setDrive(v); }, setDriveParam(k, v) { return app.state.states.setDriveParam(k, v); }, tune() { return app.state.states.tune(); }, get drive() { return app.state.states.drive; },
      setOn(v) { return app.state.states.setOn(v); }, get on() { return app.state.states.on; },
      ladder() { return app.state.states.ladder(); }, state() { return app.state.states.state(); }, save() { return app.state.states.save(); }, load(r) { return app.state.states.load(r); },
    },
    /* the molecular funnel, readable: which model is playing, why, and what the session has dropped */
    molsession: {
      state() { return app.state.molSession.state(); },
      get selected() { return app.state.molSession.selected; }, get reason() { return app.state.molSession.reason; },
      get molecule() { return app.state.molSession.molecule; }, get solution() { return app.state.molSession.solution; },
      get counters() { return { ...app.state.molSession.counters }; },
      claimed(id) { return app.state.molSession.claimed(id); }, why(id) { return app.state.molSession.why(id); },
    },
    /* ── WAVE 52 · THE MODULATION RACK.  One road to the model, the four edges, the window and the
     * three numbers the strip is showing — `read(id)` hands back exactly what is on the screen. ── */
    mod: {
      get host() { return app.state.modHost; }, get model() { return app.state.modHost && app.state.modHost.model; },
      get registry() { return app.state.modHost && app.state.modHost.registry; }, get clock() { return app.state.modHost && app.state.modHost.clock; },
      get view() { return app.state.modView && app.state.modView.api; },
      get running() { return !!(app.state.modHost && app.state.modHost.clock.isRunning()); },
      get playing() { return !!(app.state.modHost && app.state.modHost.clock.isPlaying()); },
      get cadence() { return MOD.hz; },
      setCadence(hz) { mod.setCadence(hz); if (app.state.modView) app.state.modView.sync(); return MOD.hz; },
      /* ── WAVE 65 · THE ARM, THE ONE KEY AND THE RESUME LAW, all readable from outside ────────── */
      get armed() { return app.state.modArm; },
      arm(on) { return setModArm(!!on); },
      /** which law the rack's own chips put on the next resume, and what the last one actually did */
      resume() { return app.state.modHost ? app.state.modHost.clock.resumePlan() : null; },
      /** the loop clock locked to the density's exact recurrence: one bar = one repeat (g) */
      barLock,
      get expanded() { return layout.modulation.open; },
      expand() { return layout.modulation.expand(); }, collapse() { return layout.modulation.collapse(); },
      /** PACE P3 · the window's remembered presentation, and the road that puts one back (the device report's put-back: its
       *  first open prunes remembered rows for sources that no longer exist, which is the report's doing, not the hand's) */
      presentation() { return app.state.modView ? app.state.modView.presentation() : null; }, restorePresentation(o) { if (app.state.modView && o) app.state.modView.restore(o); return !!(app.state.modView && o); },
      /* 0.5.0 C4 (R-B1): the modulation has no play of its own — these are THE play and THE pause (the edge follows) */
      play() { appPlay.play(); schedule(TIER.EVOLVE); return { ok: true, playing: app.state.modHost.clock.isPlaying() }; },
      stop() { appPlay.pause(); schedule(TIER.PRESENT); return { ok: true, playing: app.state.modHost.clock.isPlaying() }; },
      /** a deterministic step — no realtime anywhere near it, which is what a proof wants */
      step(dt) { const d = app.state.modHost.clock.step(dt); if (app.state.modView) app.state.modView.paint(true); return d; },
      targets() { return app.state.modHost.registry.describe(); },
      state(id) { return app.state.modHost.registry.state(id); },
      read(id) { return app.state.modView ? app.state.modView.api.read(id) : null; },
      picker() { return app.state.modView ? app.state.modView.api.picker() : []; },
      addSource(kind) { const s2 = app.state.modHost.model.addSource(kind); modEdited(); return s2.id; },
      addMacro() { const m = app.state.modHost.model.addMacro(null); modEdited(); return m.id; },
      /** BIND: unbind first, always — setMacro REFUSES a change on a macro already bound to a live
       *  source, and a caller that just calls setMacro reads that refusal as a control doing nothing. */
      bind(macroId, sourceId) { app.state.modHost.model.setMacro(macroId, { sourceId: null });
        if (sourceId) app.state.modHost.model.setMacro(macroId, { sourceId }); app.state.modHost.clock.recomputeRunning();
        modEdited(); return app.state.modHost.model.macroOf(macroId).sourceId; },
      route(macroId, targetId, min, max) { const r = app.state.modHost.model.addRoute(macroId, targetId, min === undefined ? 0 : min, max === undefined ? 1 : max);
        app.state.modHost.clock.recomputeRunning(); modEdited(); return r && r.route ? r.route.id : null; },
      unroute(id) { const ok = app.state.modHost.model.removeRoute(id); modEdited(); return ok; },
      /** the runtime door: a control registered NOW is in the picker NOW, with no edit to modview.js */
      /* WAVE 61: a control registered at RUNTIME with a `knob` accessor is a drop target at runtime,
         with no edit anywhere — installOne still strips nothing it did not want, the accessor is kept
         here beside modGets, and the dial is stamped the moment it exists. That is the runtime door's
         whole promise, and without the stamp the new control would be in the picker and not on the glass. */
      register(id, spec) { const d = app.state.modHost.targets.installOne(id, spec); modGets[id] = spec.get;
        if (spec.knob) { modKnobs[id] = spec.knob; const k = spec.knob(); if (k && k.root) k.root.dataset.param = id; }
        if (app.state.modView) app.state.modView.rebuild(); return d; },
      unregister(id) { const n = app.state.modHost.targets.uninstall(id); delete modGets[id]; delete modKnobs[id]; if (app.state.modView) app.state.modView.rebuild(); return n; },
      reset() { app.state.modHost.clock.pause(); app.state.modHost.registry.restoreAll(); app.state.modHost.model.modReset();
        app.state.modHost.targets.sync(); app.state.modHost.clock.applyAll(true); modEdited(); schedule(TIER.PRESENT); return true; },
      serialize() { return app.state.modHost.model.serialize(); }, restore(o) { const ok = restoreModulation(o); hNote(); return ok; },
      diagnostics() { return app.state.modHost.diagnostics(); },
      paint() { return app.state.modView ? app.state.modView.paint(true) : false; },
      get held() { return [...modHeld]; },
      get knobs() { return Object.keys(modKnobs); },
    },
    /* UNDO / REDO over the edit scope (S3): the whole PROJECT but the view, quality and the notebook — never the layout or a preference */
    get history() { return historyApi; },
    /** W-CAPTURE (wave 58): lab/capture.js itself, built on first use — picture · planLoop · save · limits · grab, and `laws` for the
     *  pure schedule functions (0.5.0 C7: the film is captureUI.exact, render-exact.js createFilm over the kit's recorder). */
    get capture() { return app.state.capApi ? app.state.capApi.capture : null; }, get capturePlan() { return app.state.capApi ? app.state.capApi.plan(true) : null; },
    get captureUI() { return app.state.capApi; },
    /* W-EXPORT (wave 134): FILE › EXPORT SHAPE / GRID's own module instance — run(fmt), busy, last (the proof's hook;
     *  the five rows call run(fmt) themselves and need nothing here) */
    get shapeExport() { return app.state.exporter3d; },
    /* W-WIGNER: the (z, p_z) slice — the last map computed (recomputed if the state has moved), its two ranges, its numbers */
    wigner: { slice() { return hydroReader().on ? wignerView.slice(reg, clock.t) : null; }, setRange(z, p) { return wignerView.setRange(z, p); },
      get stats() { return wignerView.stats; }, get zmax() { return wignerView.zmax; }, get pmax() { return wignerView.pmax; },
      get canvas() { return wignerView.canvas; }, table() { return wignerView.table(); } },
    /* W-RADIATION: the pair in force and what it radiates */
    radiation: { pair() { return hydroReader().on ? radiationView.pair(reg, clock.t, app.hooks.ab) : null; },
      get A() { const s = radiationView.stats; return s ? s.A : 0; }, get tau() { const s = radiationView.stats; return s ? s.tau : Infinity; },
      get power() { const s = radiationView.stats; return s ? s.P : 0; }, get stats() { return radiationView.stats; },
      get canvas() { return radiationView.canvas; }, table() { return radiationView.table(); } },
    atoms: atomsView, setElement, fillValence, get atomZ() { return HAMILTONIANS.atom.Z; }, get element() { return HAMILTONIANS.atom.element; },
    /* W-STURMIAN: the scale — on/off, λ, the eigen-decomposition {E, pop, l, m, n} (of c(t) when t is given, else the anchor), load eigenstate k, the S-norm ⟨c|S|c⟩ */
    sturmian: { set(on) { setSturmian({ on: !!on }); return sturm.on; }, setLambda(l) { setSturmian({ lambda: l }); return sturm.lambda; }, get on() { return sturm.on; }, get lambda() { return sturm.lambda; }, get active() { return !!sturm.P; },
      get buildMs() { return sturm.buildMs; }, get P() { return sturm.P; }, eigen(t) { return sturmEigen(t); }, select(k) { return selectEigen(k); },
      norm(t) { return sturm.P ? sturm.P.norm(t === undefined ? { re: reg.re0, im: reg.im0 } : reg.at(t)) : reg.norm2(); }, expect(a) { return sturm.P ? labelExpect(a) : reg.Ediag(a); }, get records() { return sturm.rec; } },
    rotateK(th) { reg.rotateK(th); touchState(); }, defectWait(a) { reg.defectWait(a); touchState(); },
    rotor(spec) { reg.rotor(spec); touchState(); },
    seedParticles(n = 160) { particles.setOn(true); const k = particles.seed(n, reg, clock.t, domain.half); schedule(TIER.PRESENT); return k; },
    play() { clock.play(performance.now() / 1000); schedule(TIER.EVOLVE); }, pause() { clock.pause(); schedule(TIER.PRESENT); },
    scrub(t) { clock.scrub(t); schedule(TIER.EVOLVE); }, step(dt) { clock.step(dt); schedule(TIER.EVOLVE); },
    setMute(a, on) { reg.setMute(a, on); touchState(); }, setView(v) { mat.view = VIEW[v]; ui.viewSeg.set(v); schedule(TIER.PRESENT); },
    orbit(dy, dp) { orbitBy(dy, dp); schedule(TIER.PRESENT); },
    setShadowMode(m) { shadowView.setMode(m); ui.shadowSeg.set(m); schedule(TIER.PRESENT); },
    /** GPU throughput at the current settings: ms per frame for reconstruct+present, reconstruct, present (n back-to-back frames) */
    async gpuFrameMs(n = 60) { if (!field.ok) return null; field.resize(quality.scale * (quality.auto ? quality.autoScale : 1)); const r = await field.throughput({ modes: modesAt(clock.t), obs, mat, n }); r.half = domain.half; return r; },
    stateDigest: () => reg.digest(), meters: meterSnapshot, modesAt,
    /** THE BUSY MARK (wave 48): a nesting counter.  begin()/end() bracket any work that can make the lab wait. */
    busy: { begin() { busy.n++; busySync(); return busy.n; }, end() { busy.n = Math.max(0, busy.n - 1); busySync(); return busy.n; },
      flash: busyFlash, wrap: busyWrap, get count() { return busy.n; }, get visible() { return busy.shown; },
      get moves() { return busy.moves; }, get host() { return busyHost(); },
      get at() { const h = busy.host; return h ? [h.style.getPropertyValue('--cx'), h.style.getPropertyValue('--cy')] : [null, null]; } },
    /** the photosensitivity notice: shown once per browser, remembered in the settings key, SETTINGS brings it back */
    get warning() { return warning; },
    get uiHidden() { return app.state.uiHidden; },
    /** the nine wheel samples every copy of the mark is painted from — the ABOUT face reads the same ones */
    paintMarks,
    /** WAVE 53 · the two chrome objects, each with its own switch and its own seat in the settings key */
    setFrame(v) { mat.frame = !!v; if (ui.frameSw) ui.frameSw.set(mat.frame); saveSettings(); schedule(TIER.PRESENT); return mat.frame; },
    setAxis(v) { mat.axis = !!v; if (ui.axisSw) ui.axisSw.set(mat.axis); saveSettings(); schedule(TIER.PRESENT); return mat.axis; },
    /** ⚠ the AXES' COLOUR, the user's now and not the theme's: 'theme' (the shipped binding), 'cmy' or 'rgb'.
     *  Anything else is 'theme' rather than a refusal — the same forgiveness applySettings and the link decoder give it. */
    setAxisInk(v) { mat.axisInk = (v === 'cmy' || v === 'rgb') ? v : 'theme'; if (ui.axisInkSeg) ui.axisInkSeg.set(mat.axisInk); saveSettings(); schedule(TIER.PRESENT); return mat.axisInk; },
    /** ⚠ INVERT, which this browser remembers now that it lives in PALETTE beside the palette's own switch */
    setInvert(v) { mat.invert = !!v; if (ui.invertSw) ui.invertSw.set(mat.invert); saveSettings(); schedule(TIER.PRESENT); return mat.invert; },
    /** WAVE 53 · THE LOGO.  Nothing here rotates: `colours(φ)` is the nine squares at palette phase φ, `stops` is
     *  what the generated keyframes actually animate through, and `turn()` runs the boot's one turn again. */
    logo: {
      colours(phi = 0) { return Array.from({ length: 9 }, (_, i) => rgbToHex(wheelColor(i * 40 + phi))); },
      get stops() { return look.turnStops(); },
      get css() { const sheet = document.getElementById('mirTurn'); return sheet ? sheet.textContent : ''; },   // the kit accent's turn sheet
      get steps() { return 36; }, get step() { return 40; },
      turn() { return accent.turn(); },
      get turning() { const m = document.querySelector('#title .mark'); return !!m && (m.classList.contains('turn') || m.classList.contains('busy')); },
      get menu() { return layout.menu; },
    },
    /* WAVE 106 · THE FROST POLICY IS READABLE, not only writable.  setFrost has been on this surface since
       wave 67 and the matching read never was, so a caller that wanted to borrow the policy for one
       measurement and hand it back had nothing to hand back — it read undefined and setFrost(undefined)
       resolves to 'off', which is not the same as the policy it borrowed.  B62 is exactly that caller: it
       has to take FROST off to see the CARD STYLE pane at all, because the frost rule is a later rule of
       equal specificity that replaces the pane with its own veil. */
    get frost() { return look.get('frost'); },
    /** WAVE 53 · the '?' sheet: open / close / what it is showing (read back out of the DOM) */
    get keysheet() { return layout.keysheet; },
    get windowActivity() { return windowActivity; },   // the gate presents below-the-fold windows through presentOffscreen()
    /** WAVE 106 · the drawn keyboard: open / close / is it up */
    get keymap() { return layout.keymap; },
    cpuPsi(x, y, z) { const c = reg.at(clock.t); if (sturm.P) { let R = 0, I = 0; for (const a of reg.renderSet(RENDER_CAP).ids) { const v = orbitalFromTable(sturm.rec[a], x, y, z); R += c.re[a] * v.re - c.im[a] * v.im; I += c.re[a] * v.im + c.im[a] * v.re; } return { re: R, im: I }; } return psiAt(c.re, c.im, x, y, z, reg.renderSet(RENDER_CAP).ids); },   // W-STURMIAN: the kernel's CPU twin on the scaled records
    readPixels: () => field.ok ? field.readPixels(obs, mat) : null,
    /** the GPU chrome as the screen gets it: the box and the three axes rendered alone over the stage's ground */
    linePixels: (w, h) => field.ok ? field.linePixels(obs, mat, w, h) : null,
    lineColors: () => field.ok ? field.lineColors(mat) : null,
    fieldDigest: () => field.ok ? field.fieldDigest() : null,
    sampleVoxel: (i, j, k) => field.ok ? field.sampleVoxel(i, j, k) : null,
    /** resolves after the next frame has run (so a scheduled tier has been applied) */
    settle() { schedule(TIER.PRESENT); return waitForPaint(() => ({ frames: stats.frames, error: field.error, hidden: page.hidden })); },
    /* ── WAVE 56 ──────────────────────────────────────────────────────────────────────────────────────── */
    /** SHAREABLE LINKS.  mint() builds without copying; copy() is the trig; open() is the boot/hashchange road. */
    link: { mint: () => mintLink(), copy: () => copyLink(), open: (href) => openLink(href),
      read: (href) => readLink(href === undefined ? location.href : href),
      get last() { return app.state.linkLast; }, get ceiling() { return LINK_CHAR_CEILING; },
      names: (keys) => notCarriedWords(keys || []) },
    /** THE INSTALL LAYER's interface half — the offer, the press, and what a controllerchange means here. */
    sw: swClient,
    /** the name tests/pwa.test.mjs's closing comment gives the offer; main.js calls it through LW.sw */
    buildReady: (take) => swClient.buildReady(take),
    /* ── WAVE 57 ──────────────────────────────────────────────────────────────────────────────────────── */
    /** THE MOTION PREFERENCE as this page resolved it, and what it refused because of it */
    get motion() { return { reduced: MOTION.reduced, source: MOTION.source, divisor: MOTION.divisor, autoplay: MOTION.autoplay, rate: clock.rate }; },
    /** THE COLOUR ROAD the canvas views take: one reader that knows all four CSS forms, and the two
     *  accents the WHEEL published (never the DOM string re-parsed through a gamut), plus the λ's ink. */
    ink: { parse: (t) => parseCssColor(t), css: (name, fallback) => cssRGB(inkCtx(), name, fallback),
      accent: (n) => accentRGB(inkCtx(), n),
      mark: (deg) => markInk(deg || 0).map((v) => Math.round(v * 255)),
      /* wave 59: the header λ and the notebook's are corrected against DIFFERENT grounds, so a gate that can
         only ask about one of them cannot see the difference.  `mark`/`ground` are the CARD (the notebook's);
         `stageMark`/`stageGround` are the live canvas clear colour the header λ actually sits on. */
      stageMark: (deg) => markInk(deg || 0, stageGround()).map((v) => Math.round(v * 255)),
      get stageGround() { return stageGround().map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255)); },
      get floor() { return 3; },
      get ground() { return CARD_GROUND[document.body.dataset.theme === 'light' ? 'light' : 'dark'].map((v) => Math.round(v * 255)); },
      /** the WCAG ratio between two 0…255 triples — the gate's own arithmetic, from the shipping code */
      ratio: (a, b) => contrastRatio(a.map((v) => v / 255), b.map((v) => v / 255)) },
    /** the ONE input to the TAB rule: are the hands on the world, or in the rack? */
    get stageFocus() { return stageHasFocus(); },
    version: 'QWAVE-0.1 hydrogen shadow lab · FRONTIER · 2026-09-03',
    /** 0.5.0 C9 · R14 · FOLDERS' thumbnail() for C6's project adapter, whose toThumb() drawImage()s what it gets (a WebGPU canvas can
     *  answer that BLANK): the GPU readback's PNG, always (C7 took capture's readability probe away; C7b drops its dead branch). */
    async thumbnail() { const r = await app.state.capApi.capture.picture({ width: 320 }); return r.ok ? r.blob : null; },
    look: look.prefs,   // 0.5.0 C2: the look store (`mir.gui`), for probes (`__LW.look.get('theme')`)
    session: dom.start ? dom.start.session : null,   // 0.5.0 C6b: THE SESSION (main.js createSession over the one part): read(), armed(), flush()
    get timeline() { return app.state.tl; },   // 0.5.0 C7b: the kit's TIMELINE (installTimeline's result: model, editor, controller, open/close), for the timeline suite
    get render() { return app.state.filmCard; },   // 0.5.0 C7b: the RENDER card ({ card, view, recorder, plan, place }; view.state() is the kit's harness read)
  };
  window.__LW = LW; app.sh.LW = LW;
  /* ── 0.5.0 C7b · THE RENDER CARD (lab/film-card.js): MIR's createRenderCard over the film's host recorder, built once LW exists (the film
     reads it) and registered closed on the right rack (R2), in + and WINDOW; its saves are the hand-over fix (capture.js handOver) ── */
  app.state.filmCard = createFilmCard({ film: app.state.capApi.exact, capture: app.state.capApi.capture, editor: () => app.state.tl && app.state.tl.editor, open: () => app.state.tl && app.state.tl.open(), armed: () => app.state.modArm,
    digest: () => reg.digest(), key: () => [reg.version, mat.view, obs.yaw, obs.pitch, obs.dist, obs.fov, obs.shift.join(), clock.t].join('|') });
  rack.prepend(app.state.filmCard.card.root);   // at the top, where a reopen puts it and a layout that does not list it (a demo's) leaves it: a reload saves the same `closed`
  rk.register({ id: 'render', el: app.state.filmCard.card, side: 'right', closed: true, title: 'RENDER', glyph: 'render', hint: 'the picture and the film' });
  /* 0.5.1 D10-24 · THE CURVES CARD: the kit's curves panel over the stage canvas (MASTER · R · G · B through its one SVG picture filter), so the SCREEN is
     graded and nothing else: capture.js reads the GPU texture and the film draws frame(i, ctx), neither sees a CSS filter.  `project: false` (ONE project
     part), no `history`, no `port`, no `mod` (AMOUNT is not routed).  The grade is PREFERENCE (`lambdawaves.q0.curves`): restored here, written 250 ms
     after a change, never in a project, a link or a history row.  Neutral = `filter: none`.  Closed, in + and WINDOW, seated after RENDER (where a layout
     that does not list it leaves it, so a reload saves the same `closed`); `__LW.curves` is the model. */
  const wCurves = device({ id: 'curves', eyebrow: 'CURVES', status: '' });
  el('div', 'note', wCurves.body, 'Grades the screen only — pictures and films are untouched.');
  const curves = createCurvesPanel({ parent: wCurves.body, canvas: dom.canvas, project: false }).model;
  curves.restore(curvesStore.get());
  let curvesSave = 0;
  curves.onChange(() => { clearTimeout(curvesSave); curvesSave = setTimeout(() => curvesStore.set(curves.serialize()), 250); });
  app.state.filmCard.card.root.after(wCurves.root); rk.register({ id: 'curves', el: wCurves, side: 'right', closed: true, title: 'CURVES', glyph: 'curves', hint: 'grade the screen: a transfer curve per channel' });
  LW.curves = curves;

  /* ── go ───────────────────────────────────────────────────────────────── */
  LW.bootView = VIEW_NAMES[mat.view]; LW.bootVortex = vortex.on; LW.bootOrder = layout.orderAll(); LW.bootClosed = layout.closed();   // the shipped defaults, recorded before a URL preset's visuals apply
  const q = new URLSearchParams(location.search);
  loadPreset(q.get('preset') && PRESET_BY_ID.has(q.get('preset')) ? q.get('preset') : '1s+2pz');
  mat.view = VIEW.phase; if (ui.viewSeg) ui.viewSeg.set('phase'); schedule(TIER.PRESENT);
  if (q.get('view') && VIEW[q.get('view')] !== undefined) { mat.view = VIEW[q.get('view')]; ui.viewSeg.set(q.get('view')); }
  if (q.get('gastab') !== '0') gasTableOn(true);   // K7 → W125: the axial gas's Hermite table is ARMED by default (built at the first AXIAL launch); `?gastab=0` opts out (never saved, never linked)
  /* WAVE 57 · `?play=1` USED TO BE HERE, seventy-five lines above the photosensitivity notice — so a shared
     link animated the field underneath the warning while it was being read, which is exactly the thing the
     pane exists to prevent, and wave 56's shareable links made it likelier rather than rarer.  The transport
     is now started at the FOOT of boot, after the notice has been shown, and only when it has been accepted
     (or was accepted by this browser before).  See `armAutoplay` below. */
  Object.assign(DIGESTS, {
    meters: () => 'density period\t' + (() => { const P = app.hooks.period ? app.hooks.period() : null; return P && P.exact && P.T ? P.T.toFixed(6) + ' a.u. (exact)' : P && P.T ? '≈ ' + P.T.toFixed(3) + ' a.u. (no exact period)' : '—'; })() + '\nframe profile (ms, EMA)\n' + Object.entries(perf.profile).map(([k, v]) => k + '\t' + (+v).toFixed(3)).join('\n') + '\nframes\t' + stats.frames + '\nreconstructs\t' + stats.reconstructs + '\npresents\t' + stats.presents,
    calculus: () => ({ md: calculus && calculus.last ? calculusMarkdown(calculus.last) : '' }),   // 0.4.0 S3: ⧉ copies THE PROSE FIGURE (calculus.js), which pastes into the notebook and renders
    vortex: () => vortex.last && vortex.last.points ? 'nodal points (x, y, z)\n' + vortex.last.points.map((p) => [p.x, p.y, p.z].map((v) => (+v).toFixed(5)).join('\t')).join('\n') : '',
    spectrum: () => { const c = reg.at(clock.t), H = getHamiltonian(); return 'label\tE\t|c|²\targ c\n' + reg.populated().map((a) => H.labelOf(BASIS[a]) + '\t' + H.energy(a).toFixed(6) + '\t' + (c.re[a] ** 2 + c.im[a] ** 2).toFixed(6) + '\t' + Math.atan2(c.im[a], c.re[a]).toFixed(5)).join('\n')
      + (sturm.P ? (() => { const e = sturmEigen(); return '\n\nSTURMIAN λ = ' + sturm.lambda.toFixed(4) + ' · Z = ' + getZ() + ' · ⟨c|S|c⟩ = ' + e.norm.toFixed(6) + ' · ⟨H⟩ = ' + e.energy.toFixed(6) + '\neigenvalue\tpopulation\t(l, m)\n' + e.E.map((E, k) => E.toFixed(6) + '\t' + e.pop[k].toFixed(6) + '\t' + 'spdfgh'[e.l[k]] + (e.m[k] >= 0 ? '+' : '-') + Math.abs(e.m[k])).join('\n'); })() : ''); },
    atoms: () => atomsView.digest(),
    wigner: () => wignerView.table(),
    radiation: () => radiationView.table(),
    shadow: () => { const c = reg.at(clock.t); return 'label\tq\tp\n' + reg.populated().map((a) => getHamiltonian().labelOf(BASIS[a]) + '\t' + (c.re[a] * Math.SQRT2).toFixed(6) + '\t' + (c.im[a] * Math.SQRT2).toFixed(6)).join('\n'); },
  });
  layout.moveToRack('spectrum', 'L'); spectrum.openPicker(true);
  // First-visit furniture. Existing saved visibility and layouts are restored below.
  // 2026-10 (Josh): MOLECULES and MO-REGISTRY open on the LEFT rack under SPECTRUM.  No `devopen` fires here, so neither
  // solves at boot — MOLECULES pays its solve when it is switched on or a molecule is picked.
  if(useCompactDefaults) {
    const left=['shadow','spectrum','chem','orbitals'],right=['settings','state','palette','observer','camera','clip'];
    for(const d of document.querySelectorAll('.dev'))d.classList.toggle('closed',![...left,...right].includes(d.dataset.id));
    for(const [host,ids] of [[rackL,left],[rack,right]])for(const id of ids){const d=document.querySelector('.dev[data-id="'+id+'"]');host.appendChild(d);const fold=FIRST_RUN.folded.includes(id);if(d.classList.contains('folded')!==fold)d.querySelector('.dev-fold')?.click();}
  }
  initStageText(); LW.stageText = app.state.stageText;   // the gate reads its string, its render count and its announcements
  applySettings();
  rk.start();                         // 0.5.0 C3: the kit's rack takes the furniture as it stands, and its crossing runs before λWAVES' half
  syncPhone();                        // wave 51: the breakpoint is read once the browser's settings are in, so the phone's DEFAULTS never overwrite them

  /* ── WAVE 56 · A LINK OPENS HERE ──────────────────────────────────────────────────────────────────
   * `?preset=` is read forty lines up, and this is the same kind of thing said in the fragment — but it
   * lands AFTER applySettings() and not beside the preset, deliberately: applySettings restores THIS
   * BROWSER's frame, axis, camera mode, quality and gamut, and a link that opened before it would have
   * had four of its own choices overwritten by the reader's.  A link is somebody else's picture; the
   * browser's preferences are the reader's furniture, and the picture goes on top.
   * It is also before `history.clear()` below, which is the law: a link is the BOTTOM of the stack. */
  const linkAtBoot = openLink();
  /* the fragment is a live address, not only a start.  WAVE 133 (found by its verifier; the hole is wave 56's): a link pasted
     over an EDITED session replaced the edit and wiped the undo ring without a question, and over an unedited one left the page
     reading dirty although a reload brings the same scene back clean.  It now asks first, in the house's words, and a link
     that opened is the clean state (the address bar can bring it back).  A cancel leaves the new fragment in the address bar
     while the page keeps its scene: a reload would then open the link, and the beforeunload guard asks there.  Only a fragment
     that CARRIES a link asks: the skip links' `#rack` is a hashchange too, and a malformed link changes nothing (openLink says so). */
  addEventListener('hashchange', () => {
    let got = null;
    try { got = readLink(location.href); } catch (e) { openLink(); return; }
    if (!got) return;
    if (layout.projects && !layout.projects.discard('OPEN THIS LINK')) return;
    const r = openLink();
    if (r.opened && r.ok && layout.projects) layout.projects.markClean();
  });


  /* the photosensitivity notice is main.js' `warning` (0.5.0 C6b: λWAVES' law over the kit's notice, shown before the title screen) */
  const warning = dom.start.warning;
  ui.saveNative = saveSettings;
  reworkNative({ ui, mat, repaint:()=>schedule(TIER.PRESENT), modHost: app.state.modHost, modApi:()=>app.state.modView&&app.state.modView.api, cadence:()=>MOD.hz, setCadence:mod.setCadence });
  app.hooks.warning = warning;
  /* ── WAVE 57 · THE ORDER, AND IT IS THE WHOLE FIX ────────────────────────────────────────────────
   * NOTHING MOVES UNTIL THE NOTICE HAS BEEN ACCEPTED — or was accepted by this browser before and is
   * remembered.  `onAccept` fires immediately when the pane is not up, so a returning visitor loses
   * nothing; when it IS up, the transport waits behind the CONTINUE button, which is the only way past
   * a photosensitivity warning there has ever been in this app.
   * And the second refusal is the motion preference's: `?play=1` is the one thing in the lab that
   * starts the field WITHOUT A PRESS, so it is exactly what `prefers-reduced-motion` refuses. */
  function armAutoplay() {
    if (q.get('play') !== '1') return false;
    if (MOTION.reduced) { MOTION.autoplay = 'refused: reduced motion'; return false; }
    warning.onAccept(() => { MOTION.autoplay = 'started'; LW.play(); });
    if (MOTION.autoplay !== 'started') MOTION.autoplay = 'waiting for the notice';
    return true;
  }
  if (MOTION.reduced && ui.rateKnob) ui.rateKnob.root.title = 'Reduced motion lowered RATE. Adjust it to override.';
  app.state.history.clear(linkAtBoot.opened && linkAtBoot.ok ? 'link' : 'boot');   // the shipped boot (and a ?preset= in the URL) is the BOTTOM of the stack, not a step in it


  accent.turn();
  busyHost();                         // the mark is cloned and painted before anything can need it
  markBatchEnd();                     // M7: …painted here, once, every copy of it (the clones included)
  if (layout.projects) { await Promise.race([layout.projects.seed().catch(() => null), new Promise((r) => setTimeout(r, 3000))]); layout.projects.markClean(); }   // 0.5.0 C6: the six demos are FOLDERS' starters before the lab says ready
  /* 0.5.0 C6b · THE SESSION hears the one part: the ring's moves and the notebook's input (projects.changed, the part's subscribe) */
  if (layout.projects) { app.state.history.subscribe(layout.projects.changed); const nbEl = document.getElementById('notebook'); if (nbEl) nbEl.addEventListener('input', layout.projects.changed); }
  /* THE CHOICE (main.js: the title screen's pick, ?starter=, or `boot` for a driven or direct start).  NEW and the boot keep the shipped
     scene and its `boot` / `link` origin; a cover opens its demo (origin `open · NAME`); RESUME puts the session back (origin `resume`).
     NEW and a cover forget the session, the boot arms it.  ?play=1 waits for the choice and then for the notice (armAutoplay). */
  const S = LW.session, id = await dom.start.choice;
  if (id === 'boot') S.arm(); else if (id === 'resume') layout.projects.resume(S); else S.discard();
  if (!['home', 'boot', 'resume'].includes(id)) await layout.projects.demo(id);
  armAutoplay();
  installWakeLock({ clock: appPlay });   // ONE clock: the wake lock is held while THE play plays (asked inside a gesture, armed otherwise; no timer)
  /* a reload of this tab skips the title screen only while a reload loses nothing (the quiet take's own question) */
  addEventListener('pagehide', () => { try { if (untouched(true)) sessionStorage.setItem('lambdawaves.opener', 'home'); else sessionStorage.removeItem('lambdawaves.opener'); } catch (_) {} });
  LW.ready = true;
  LW.report = (o, t = performance.now()) => import('../tools/perf/device-report.js').then((m) => m.run(LW, o, t)); if (q.get('report') === '1') LW.report(q);   // THE DEVICE REPORT (2026-09-25): a diagnostic in tools/, never precached — `?report=1` or __LW.report() measures this device and puts every setting back
  return LW;
}
