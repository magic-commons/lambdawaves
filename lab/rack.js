import { installWakeLock } from './mir/core/wakelock.js';   // 0.5.0 C6b: the screen stays on while THE play plays
import { reworkNative } from './native-ui.js';
import { firstRunMaterial, firstRunQuality } from './first-run.js';   // W125: the first-run material follows the device · PACE P2: so does the first-run quality, and a saved one keeps within the device
/* rack.js — the instrument: the windows, the work-tier router, one clock, the transport.
 *
 *   STATE → EVOLUTION → OBSERVABLE FIELD → OBSERVER → RENDER        (§52)
 *
 * Tiers (§13):  PRESENT < RECONSTRUCT < EVOLVE < REBUILD.  Every cause asks for a tier; one
 * animation frame coalesces to the strongest and does exactly that much.  Idle is ZERO work:
 * when nothing plays, nothing spins and nothing is pending, no frame is scheduled (§45).
 * Four time domains (§12), under ONE play clock (0.5.0 C4): the physics clock is the Clock (exact logical time); the field clock is the
 * reconstruction cadence (cappable, never alters c); the camera clock is observer motion; the
 * presentation clock is the display rate.  Observer controls never touch the register (§14).
 */
import { DEFAULT_PALETTE } from './palette-app.js';   // Jet Black: the app's palette row, appended to the kit's catalogue before anything reads it (KIT BRIEF J)
import { BASIS, domainFor } from './hydrogen.js';
import { Register, PRESET_BY_ID, RENDER_CAP } from './state.js';
import { Clock, onePlay } from './clock.js';
import { createWindowActivity } from './mir/window-activity.js';
import { VIEW, VIEW_NAMES, STYLE, quatFromYawPitch } from './field.js';
import { el, device as kitDevice } from './mir/kit.js';
import { createSpectrumCard } from './windows/spectrum.js';   // 0.5.2 R2a: the SPECTRUM card, out of boot()
import { createReadouts } from './windows/readouts.js'; import { createKeplerSurface } from './windows/kepler.js';   // 0.5.2 R2b: the readout cards and THE BOW + KEPLER, out of boot()
import { createFilmCard } from './film-card.js';   // 0.5.0 C7b: the film's UI is the kit's RENDER card
import { createSkeleton, centroid } from './skeleton.js';   // 0.7.0 V2: THE SKELETON, the molecule's beads, bonds and dipole on #skeleton
import { createMolecules } from './windows/molecules.js'; import { createStageWords } from './shell/stage-words.js'; import { createModSeam } from './shell/modulation.js'; import { createInk } from './shell/ink.js';   // 0.5.2 R2d (chemview, registerview, the molecular session, the info layer and the modulation window left with them)
import { calculusMarkdown, beadOf, covariance } from './calculus.js';
import { createMaterial } from './windows/material.js'; import { createSettingsCard } from './windows/settings-card.js'; import { createFilmApi } from './windows/film.js';   // 0.5.2 R2c: WAVE · CLIP · PALETTE · CAMERA, the SETTINGS card and THE FILM, out of boot()
import { getHamiltonian, getZ } from './hamiltonian.js';
import { createStateCard } from './windows/state.js';   // 0.5.2 R2a: the STATE card, out of boot()
import { createSettings } from './shell/settings.js'; import { createPersist } from './shell/persist.js'; import { createLinks } from './shell/links.js'; import { createHistory } from './shell/history.js'; import { createFacade } from './shell/facade.js'; import { createVerbs } from './verbs.js';   // 0.5.2 R3a (edit-domain.js left with the history) · R5 the facade
import { createCameraLaw } from './camera-law.js'; import { createPicker } from './picker.js';   // iteration 003: THE MAIN MENU; iteration 004: THE PICKER   // wave 130 seam 11: the camera law and the observer's pose, out of boot()
import { createCurvesPanel } from './mir/panels/curves.js';     // 0.5.1 D10-24: the CURVES card's rows are the kit's panel over the stage canvas
import { createSettingsStore } from './settings-store.js';   // 0.5.0 A1: the settings blob's one door
import { createMotionPref } from './motion-pref.js';   // N7 seam 1: the reduced-motion law, out of boot()
import { createController } from './shell/controller.js';   // 0.5.2 R1: ONE CONTROLLER · FIELD · THE MATHS WORKERS · ONE ROAD, out of boot()
import { createSwClient } from './sw-client.js';        // N7 seam 5: the install layer's interface half, out of boot()
import { createBadges } from './badges.js';             // N7 seam 6: the badges and the canvas's sentence, out of boot()
import { createTransport } from './shell/transport.js'; import { createRackWiring } from './shell/rack-wiring.js'; import { createNotebook } from './shell/notebook.js'; import { createKeys } from './shell/keys.js';   // 0.5.2 R3b (createRack, createMenubar, installWindowChrome left with them)
import { createMirGui } from './mir-gui.js';   // iteration 003: MIR OPTIONS and MIR ABOUT, the kit's createGui over the look store
import { readLink } from './statelink.js';   // wave 56: every state of this lab is a LINK

/* THE BUILD STAMP — one constant, and every wave updates it.  The ABOUT face and its copy dump both read it here;
   nothing else in the app hand-writes a version, so a stale line can only come from forgetting THIS line. */
export const BUILD_LINE = '0.9.4-alpha · Separable · 2026-10-16';   // THE ONLY PLACE THE NUMBER LIVES: the ABOUT face, the copy dump and the proof all read it back through LW.build (ANTI-PATTERN 6)

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
  const energyOf = (a) => (getHamiltonian().energy(a) || 0) * rates[a];   // 0.8.0 G1: a label CENTRAL leaves unbound (NaN) holds its c, still


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
    hooks: { theme: null, restage: null, setStageColour: null, setStageFollow: null, setStage: null, setGamut: null, setTheme: null, ab: null, slap: null, period: null, keys: null, warning: null, sheet: null, status: null },   // sheet / status: 0.5.4 P4 (badges.js, informational.js)
    state: { history: null, palette: null, picker: null, molFormulaScale: 1, atomLabelsScale: 1, space: 'x', playedLast: false, uiHidden: false, pointerHeld: false, metersWall: 0, govVersion: -1, keplerDirty: true, badgesWall: 0,
      applyVisuals: true, modView: null, modHost: null, modWall: 0, tl: null, modExpOn: null, dodge: null, filmCard: null, feedMs: 0, rotMoved: false, rotTicking: false, audioCap: null, modArm: true,
      occludeDirty: true, occludeAt: 0, stageMix: 0.04, stageFollow: true, refSnapshot: null, pendingRef: null, warmTimer: 0, warmIdle: 0, dragging: false, cornerLayoutDirty: true,
      exportLocked: false, histShown: null, lastNmax: 1, capApi: null, camKnobs: {}, exporter3d: null, flowEpoch: null, chem: null, restampParams: null, molSession: null, register: null,
      orbitals: null, states: null, stageText: null, bow: null, bowInFlight: 0, bowChain: null, kdrag: null, gasWidth: 1.8, gasAxial: false, lastLaunch: null, restoreNotice: '', linkLast: null, eq: null, eqNoNodes: false, chord: null },
    loop: { schedule, hold: filmHold, resetWall: () => { lastWall = performance.now() / 1000; }, page: null, loopRing: null, ringMedian: null, windowActivity: null, canPresent: null, modesAt, refModes,
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
    sh: { readSettings, ask: null, saveSettings: null, setCardStyle: null, setFrost: null, setDisconnected: null, lookSync: null, applySettings: null, KIND: null, RETIRED_WINDOWS: null, powered: null,
      DIGESTS: null, quality: null, transport: null, togglePlay: null, setModArm: null, barLock: null, refreshOcclusion: null, devById: null, rackCardWidth: null, popFace: null, rk: null,
      layout: null, winHint: null, wTr: null, phone: null, tablet: null, syncPhone: null, keyState: null, keyHelp: null, stageHasFocus: null, ACTIONS: null, kt: null, modSeats: null, serialize: null,
      restoreModulation: null, save: null, copyJSON: null, restore: null, notCarriedWords: null, esc: null, mintLink: null, copyLink: null, openLink: null, historyApi: null, verbs: null, LW: null },
  };
  function readSettings() { return settingsStore.read(); }   // 0.5.2 R3a: §1's reader stays in the head — §0 calls it first (U1), app.sh holds it by value
  /* ── SETTINGS: what this browser remembers — lab/shell/settings.js (0.5.2 R3a), created here ── */
  const { saveSettings, setCardStyle, setFrost, setDisconnected, applySettings, KIND, RETIRED_WINDOWS, powered, DIGESTS } = createSettings(app);
  const quality = { ...firstRunQuality(isPhone() ? 'phone' : isTablet() ? 'tablet' : 'desktop'), auto: true, autoScale: 1, minScale: 0.35 }; app.sh.quality = quality;   // PACE P2: 64³ × 160 × 1 on a desktop (and a phone, whose crossing has its own rule), the GRID pairing 64³ × 110 × 0.75 on a tablet
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
  const ringMedian = (r) => { const a = Array.from(r).filter((v) => v > 0).sort((x, y) => x - y); return a.length ? a[a.length >> 1] : 0; }; app.loop.loopRing = loopRing; app.loop.ringMedian = ringMedian;
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
          if (app.state.eq && app.state.eq.audioTick) app.state.eq.audioTick();   // iteration 002: the EQUALIZER's AUDIO IN reads the follower just fed
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
      syncEq();                                                      // 0.6.0 B2: the BEAT EQUALIZER's table follows the register, the operator and the space (keyed)
      if (may('spectrum', wSpec)) tick('spectrum', () => spectrum.update(c, clock.t));
      if (may('shadow', wSh)) tick('shadow', () => { shadowView.update(c, clock.t, stateReaders().populated, spectrum.selected); if (ui.shadowDetails && !ui.shadowDetails.hidden) shadowFoot.update(reg, c, clock.t, stateReaders().populated); });
      if (may('orbit', wOrb)) tick('orbit', () => { orbit.update(obs); keplerRowSync(); });   // the Kepler knobs' own liveness rides the tick this window already pays for, keyed on reg.version like every other reader
    }
    const overlayDomain = app.state.space === 'x' && getHamiltonian().hydrogenTheorems && !sturm.P && !(app.state.chem && app.state.chem.on) && !app.state.eqNoNodes;
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
    const mol = app.state.chem.on, skOn = !!(ui.skeletonSw && ui.skeletonSw.get() && mol), elOn = !!(ui.ellipsoidSw && ui.ellipsoidSw.get()) && !mol && !sturm.P && app.state.space !== 'p', bdOn = (!!(ui.beadSw && ui.beadSw.get()) && (mol || !sturm.P)) || elOn;   // 0.8.2 P3: THE BEAD shares the canvas, drawn after the skeleton, with SKELETON off too; 0.8.3 B3: THE ELLIPSOID rides it (position space, a register)
    if (skOn || bdOn) { if (may('skeleton')) tick('skeleton', () => skeleton.draw(skOn ? app.state.chem.atomsNow() : null, skOn ? app.state.chem.dipoleNow() : null, obs, domain.half, !bdOn ? null : mol ? centroid(app.state.chem.atomsNow(), app.state.chem.dipoleNow(), app.state.chem.preset()) : Object.assign(beadOf(reg, clock.t, app.state.space === 'p'), { ell: elOn ? covariance(reg, clock.t) : null }))); } else skeleton.clear();   // 0.7.0 V2: a yielding reader keeps its bitmap; off, one clear and then nothing

    kepler.bowFrame();
    app.state.chem.setActive(canPresent(wChem));
    /* ONE PRODUCT A FRAME, AND THE ORDER OF THESE TWO CALLS DECIDES NOTHING.  Both windows hand their product to
       molSession, which selects a model by RANK (the real-time run, then the register, then the card) and drops
       what the unselected ones offer — where this used to be "whoever writes the matrix last owns the frame". */
    app.state.molSession.tick();
    if (app.state.chem.on && powered(wChem)) app.state.chem.update(clock.t);   // the RT pump: one outstanding worker request, then an upload — no maths on this thread, so no tick()
    app.state.register.setActive(canPresent(wOrbs));
    if ((app.state.orbitals.on || app.state.states.on || app.state.states.songOn) && powered(wOrbs)) app.state.register.update(clock.t);
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
        const G = hydroReader(true); radiationView.update(reg, clock.t, clock.playing, G.on, G.why);
        const st = G.status !== null ? G.status : radiationView.cache ? RAD_OK : 'no dipole in this state';
        wRad.setStatus(st, st === RAD_OK ? '' : 'warn');
      });
      if (may('calculus', wCalc)) tick('calculus', () => { if (calculus && !sturm.P) calculus.update(reg, clock.t, domain.half, app.state.space === 'p', !!(app.state.chem && app.state.chem.on)); });   // 0.8.2 P3: a molecule reads only the RAY's sentence
      if (may('lattice', wLat)) tick('lattice', () => lattice.update(clock.t));   // 0.7.2 L1: ψ(t) from LATTICE's eigenpairs, N² a frame, only while it can present
      if (may('bloch', wBlo)) tick('bloch', () => bloch.update(clock.t));   // 0.8.1 T1: one 2 × 2 step a frame (a chirp's few), only while it can present
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
    if (reg.P && reg.P.stark) s = 'INTER-SHELL STARK · NUMERICAL · FIELD GRID';   // 0.8.0 G3: the propagator's own word
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
  app.loop.paceRate = paceRate; app.loop.MOTION = MOTION;

  /* ── windows ──────────────────────────────────────────────────────────── */
  /* THE CAMERA LAW (wave 50) and the observer's pose — CAM, the camera, the two modes, orbitBy, the key orbit, ZOOM / FOV /
     RESET VIEW: lab/camera-law.js (wave 130 seam 11).  Built here, before the first window that reads it. */
  const { camera, camTravel, camLevel, syncFreeAngles, orbitBy, keyOrbitMoving, queueKeyOrbit, stepKeyOrbit, setCamMode,
    camLevelStep, cameraStep, setDist, setFov, syncCamUI, resetView, zoomAt, panBy, port: cameraPort } = createCameraLaw({ obs, present: () => schedule(TIER.PRESENT),
    modHand, resetWall: app.loop.resetWall });
  const rack = dom.rack;
  app.host.camera = camera; app.host.camLevel = camLevel; app.host.syncFreeAngles = syncFreeAngles; app.host.syncCamUI = syncCamUI; app.host.rack = rack; app.host.panBy = panBy; app.host.setCamMode = setCamMode;
  app.host.camTravel = camTravel; app.host.orbitBy = orbitBy; app.host.queueKeyOrbit = queueKeyOrbit; app.host.setDist = setDist; app.host.setFov = setFov; app.host.resetView = resetView; app.host.zoomAt = zoomAt; app.host.cameraPort = cameraPort;

  function filmHold(on) {
    if (app.state.chord) app.state.chord[on ? 'suspend' : 'resume']();   // 0.6.4 S2: a film stays silent
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
  let filmBefore = null;   // THE FILM's hold (0.5.2 R2c): filmHold stays beside the loop, app.loop.hold by value; the film's road is lab/windows/film.js
  const { wObs, wPal, wCam, wClip, createDrawClipPaletteCamera } = createMaterial(app);   // 0.5.2 R2c: lab/windows/material.js — WAVE's head and the four cards (two seats)
  /* ── THEME and SURFACE: the interface's skin, and the stage underneath it ── */
  const { createFieldQuality } = createSettingsCard(app);   // 0.5.2 R2c: lab/windows/settings-card.js — the SETTINGS card (two seats)
  createDrawClipPaletteCamera();   // 0.5.2 R2c: material's second seat — WAVE's DRAW, CLIP, PALETTE · INVERT, CAMERA
  /* ── THE FILM (0.5.0 C7 · C7b): MIR's recorder handed λWAVES' frame(i, ctx) (render-exact.js createFilm); its UI is the kit's — the
     RENDER card (lab/film-card.js) and the TIMELINE window — and the CAPTURE group left.  While a film owns the page the rack's loop
     stands aside (no frame of ours presents with an unpinned seed: hazard H9), and what the film steps through — the state, the
     material, the pose, the rotation rates — is put back exactly as it was.  `__LW.captureUI` is its scripting facade: createFilm's
     named takes at C7's defaults (30 fps, 6 s, ×2), no UI; a verb while one runs stops it. */
  createFilmApi(app);   // 0.5.2 R2c: lab/windows/film.js — film(), capture(), the takes, app.state.capApi
  createFieldQuality();   // 0.5.2 R2c: the SETTINGS card's second seat — FIELD QUALITY

  // STATE — preparation. Everything here changes c.
  const { clearRegister, wState } = createStateCard(app); app.w.clearRegister = clearRegister;   // 0.5.2 R2a: lab/windows/state.js (STATE's CLEAR with it)

  // SPECTRUM
  const { wSpec, spectrum, toggleFullscreen, normalizeNow, copyLatex, switchHamiltonian, setSturmian, applySturmian, paintSturmRo, sturmEigen, occupiedEigen,
    periodEnergies, selectEigen, setElement, fillValence, syncEq } = createSpectrumCard(app);   // 0.5.2 R2a: lab/windows/spectrum.js

  rack.appendChild(wPal.root); rack.appendChild(wObs.root); rack.appendChild(wCam.root); rack.appendChild(wClip.root);
  rack.appendChild(ui.set.root);
  /* THE ABOUT FACE LIVES IN THE NOTEBOOK GLASS (wave 30), and its markup is lab/index.html's `.nb-aboutface`.
     A commented-out copy of the old in-window version sat here for twenty-nine waves; wave 59 deleted it,
     because it was a trap: it claimed two typefaces where three ship, named a font that has since been
     renamed for licence reasons, said "waves 5-27", and linked `/REPORT.md` at the SITE root — a path the
     deploy does not have.  Anyone who uncommented it would have shipped four wrong facts at once. */

  // SHADOW
  const { wSh, shadowView, shadowFoot, wOrb, orbit, kepler, wVor, vortex, particles, flowTracers, wSlice, slice, createCalcMetersLadder,
    createAtomsWignerRadiation } = createReadouts(app);   // 0.5.2 R2b: lab/windows/readouts.js, three seats

  /* ── LEGACY WINDOWS (2026-10, Josh): all five are gone — QCD, H₂⁺ and HELIUM in 0.5.0 D9, H₂ and ELECTROSTATICS in D9b
     (R5-L1; ATOMS came back in 0.4.0 S3).  An older file that used one opens on its shim in restore and says so in one line. */
  const { wChem, head, createMoRegistry } = createMolecules(app);   // 0.5.2 R2d: lab/windows/molecules.js, two seats (MO-REGISTRY's below the stage words)

  /* THE STAGE TEXT (Settings › Display; 0.4.0 S3 · F2; 0.5.1 D1 below) — its SOURCE: what is playing, as markdown — the MOLECULES formula
     ($\mathrm{H_{2}O}$, latex-state.js formulaLatex) while MOLECULES is on, else SPECTRUM's populated states in stateLatex's
     own prose ("$2s_{0}$ and $2p_{-1}$"; A ↔ B under a TRANSITION).  The states go in with UNIT coefficients — the list line
     depends on which labels are populated, never on c — so no live coefficient can reach the stage.  The source is asked
     only when one of its inputs moved (the register's version, the pick, a legacy owner): one compare a CPU tick. */
  const { stageTextTick, initStageText } = createStageWords(app);   // 0.5.2 R2d: lab/shell/stage-words.js

  /* ORBITALS — the MOLECULAR REGISTER: ψ(r, t) = Σ_k c_k e^{−iε_k t} φ_k over CHEMISTRY's canonical orbitals, which
     is where a molecule's `arg` lives (MATH-H2O-2026-09-11, Proposition 1).  It is NOT a sixth field owner: it does
     not upload a molecule and it does not touch moleculeMode() — CHEMISTRY owns the shells and this window owns the
     matrix while REGISTER ON is up.  2026-10 (Josh): it STAYS on the rack whatever MOLECULES does — MOLECULES OFF only stands its
     switch down (orbitalsview.js update), and the ladder stays painted and editable. */
  const { wOrbs } = createMoRegistry();   // 0.5.2 R2d: molecules' second seat

  // CALCULUS — the stats, derived live, with their laws and residuals
  const { wCalc, calculus, wMet, meters, wLad, ladder, wLat, lattice, wBlo, bloch, wCen, wSep } = createCalcMetersLadder();   // 0.5.2 R2b: readouts' second seat

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
  createModSeam(app);   // 0.5.2 R2d: lab/shell/modulation.js

  // ATOMS — the periodic table as one central field (Xα(2/3) + the Latter tail, solved live); it ships CLOSED.  0.4.0 S3 (R-A2):
  // no longer LEGACY — the periodic table of SPECTRUM's ATOM operator, with its own row in + and WINDOW
  const { wAtoms, atomsView, wWig, wignerView, wRad, radiationView, WIG_OK, RAD_OK } = createAtomsWignerRadiation();   // 0.5.2 R2b: readouts' third seat
  const skeleton = createSkeleton(document.getElementById('skeleton'));   // 0.7.0 V2: its switch is MOLECULES' (ui.skeletonSw, a PREFERENCE)
  Object.assign(READERS, { spectrum: wSpec, shadow: wSh, orbit: wOrb, vortex: wVor, particles: wVor, kepler: wOrb,
    slice: wSlice, atoms: wAtoms, wigner: wWig, radiation: wRad, calculus: wCalc, skeleton: wChem, lattice: wLat, bloch: wBlo, central: wCen, separable: wSep });   // the windows the READER LAW may park (never MOLECULE — it steps nuclei — nor METERS, which shows the governor)
  for (const w of [...Object.values(READERS), wVor, wMet, wLad]) windowActivity.track(w);
  /** the guard the two hydrogenic readers share: hydrogen at Z = 1, no Sturmian scale, no other model holding the
      field.  Both windows integrate the SHIPPED closed-form radials, so anything else would be two operators in one
      number; they say which one stood them down, in the wave-39 voice. */
  function hydroReader(rad) {   // rad: RADIATION reads the rates, which follow μ (0.8.1 T2); the rest read the μ = mₑ closed forms
    const H = getHamiltonian(), qho = !rad && H.id === 'qho';   // 0.8.2 P1: WIGNER (the one reader without rad) integrates the oscillator's closed radials too — no Z, no μ there
    if (sturm.P) return { on: false, status: 'hydrogen only: no closed form for the scaled radials',
      why: 'the STURMIAN scale is on: the scaled radials are not the ones this window integrates — switch SCALE back to HYDROGEN' };
    if (H.id !== 'hydrogen' && !qho) return { on: false, status: 'hydrogenic register only', why: 'hydrogenic register only — the operator in force is ' + H.label };
    if (!rad && H.mass) return { on: false, status: 'hydrogenic register only (μ = mₑ)', why: H.mass + ' scales every radial: this window reads the μ = mₑ closed forms' };
    if (getZ() !== 1 && !qho) return { on: false, status: 'hydrogenic register only (Z = 1)', why: 'the ion at Z = ' + getZ() + ' scales every radial: this window reads the Z = 1 closed forms' };
    if (app.state.chem && app.state.chem.on) return { on: false, status: 'hydrogenic register only', why: 'another model holds the field — this window reads the hydrogenic register' };   // 0.4.0 S0 · wave 137: MOLECULES too
    return { on: true, status: null, why: '' };
  }

  /* ── transport strip (§25): lab/shell/transport.js (0.5.2 R3b), created here — λWAVES' own bar ── */
  const { transport, togglePlay, setModArm, barLock } = createTransport(app);

  /* ── badges (§41) ─────────────────────────────────────────────────────── */
  const badges = createBadges({ dom, accept: () => swClient.accept(), field, reg, mat, clock, domain, quality,
    getSpace: () => app.state.space, stateReaders, ui }); app.hooks.sheet = badges.sheet;   // N7 seam 6: lab/badges.js

  /* ── WAVE 56 · THE INSTALL LAYER'S INTERFACE HALF: lab/sw-client.js (N7 seam 5).  The tab that ASKED reloads; a tab that
     did not ask is told and keeps its work.  It is LW.sw. ── */
  /* THE QUIET TAKE'S ONE DEFINITION (wave 133): a reload would bring back the same scene — a fresh boot, or the same link —
     and this browser's settings, so it loses nothing the reader made.  What a reload does NOT keep is the clock's position,
     a capture in flight and the AUTO-ROTATE switch; a capture is excluded here, and so, in the foreground, is a clock that
     has moved (played and paused, or scrubbed): that session is offered, not taken.  The take-on-hide road (ignorePlaying)
     keeps ignoring the clock — it takes while nobody watches.  So: the ring holds only its origin row, named `boot`, `link` or
     `resume` (iteration 004: with no title screen a reload of a resumed tab resumes the same session, flushed on pagehide; an
     `open · …` or `new project` origin is a scene a reload would not bring back, and is offered a build, never taken); nothing
     is pending or held; the project is clean; no pointer is down; the photosensitivity notice is not up; nothing is being
     typed; no capture is running; and, unless the caller says playing is fine, the transport is paused at t = 0.  Read only
     after boot (register waits ≥ 1.5 s past load). */
  const untouched = (ignorePlaying) => {
    const rows = app.state.history ? app.state.history.entries() : [];
    return rows.length === 1 && !app.state.history.canUndo && !app.state.history.pendingLabel && !app.state.history.holding
      && (rows[0].label === 'boot' || rows[0].label === 'link' || rows[0].label === 'resume')
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
  const { bowStart, bowMove, bowRelease, orbitOfShell, kepShell, keplerTurn, keplerDragToPoint, keplerDragTo, keplerRowSync, gas, gasReadout, gasTableOn, launchPacket, enterBox, coherentBounce,
    bowCancel, slapAlong } = createKeplerSurface(app);   // 0.5.2 R2b: lab/windows/kepler.js

  /* ── THE FLOATING RACK: hide button, hover-reveal, draggable cards, hint icons, the transport's dock ── */
  const rackL = document.getElementById('rackL');
  for (const rk of [rack, rackL]) if (rk) rk.addEventListener('scroll', () => { gov.scroll = performance.now(); }, { passive: true });   // wave 45: a scrolling rack makes every reader yield for 150 ms
  /* body.rack-l says the mirror rack holds cards: the stage captions step right of it */
  if (rackL) { const syncL = () => document.body.classList.toggle('rack-l', rackL.children.length > 0); new MutationObserver(syncL).observe(rackL, { childList: true }); syncL(); }
  const LAYOUT_SLOTS = 4;      // wave 54: four favourite layouts, numbered — see the note at the ☆ button


  const floats = document.getElementById('floats'); app.host.rackL = rackL; app.host.LAYOUT_SLOTS = LAYOUT_SLOTS; app.host.floats = floats; app.host.swClient = swClient;
  /* ── INK STAYS UNDER GLASS (2026-09-11) ─────────────────────────────────────────────────────────
   * The field's frame, axes and slice outline are 1-px lines drawn on the stage; a translucent pane over
   * the stage showed them as a hairline through a device's title. Skip only PAINTED surfaces, not the
   * transparent layout box around a disconnected card or the modulation constellation. Otherwise the
   * frame is cut into a moving rectangle wherever that box goes. Rectangles are gathered here — one
   * layout burst, at most every 300 ms while a frame runs, and never inside a paint.  0.5.0 A7: each species is a
   * provider in lab/occlusion.js, registered below in the old order; this host converts, clears and presents. */
  const { refreshOcclusion } = createInk(app);   // 0.5.2 R2d: lab/shell/ink.js
  /* ── 0.5.0 C3 · THE RACK IS THE KIT'S: lab/shell/rack-wiring.js (0.5.2 R3b), created here; its second seat, wireStage(), follows the notebook's ── */
  const { rk, layout, wTr, tablet, syncPhone, wireStage } = createRackWiring(app);
  createMirGui(app);   // iteration 003: after the rack, whose one dock span the modulation window docks in
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

  const verbs = createVerbs(app); app.sh.verbs = verbs;   // 0.6.6 G1: THE VERB TABLE + THE INVENTORY (lab/verbs.js), before the facade that carries it
  /* ── the diagnostics surface (tests and curiosity; one road) ──────────── */
  const LW = createFacade(app);   // 0.5.2 R5: lab/shell/facade.js — the literal, whole
  window.__LW = LW; app.sh.LW = LW;
  /* ── 0.5.0 C7b · THE RENDER CARD (lab/film-card.js): MIR's createRenderCard over the film's host recorder, built once LW exists (the film
     reads it) and registered closed on the right rack (R2), in + and WINDOW; its saves are the hand-over fix (capture.js handOver) ── */
  app.state.filmCard = createFilmCard({ film: app.state.capApi.exact, capture: app.state.capApi.capture, editor: () => app.state.tl && app.state.tl.editor, open: () => app.state.tl && app.state.tl.open(), armed: () => app.state.modArm,
    digest: () => reg.digest(), key: () => [reg.version, mat.view, obs.yaw, obs.pitch, obs.dist, obs.fov, obs.shift.join(), clock.t].join('|'),
    /* iteration 004: FILES (FOLDERS' project zip) and the SUBJECT — THIS VIEW, or the project FOLDERS' ⓘ pointed at */
    files: layout.projects ? layout.projects.folders.zip : null, gallery: layout.projects ? layout.projects.inspected : null,
    here: () => { const C = app.state.chem; return { chem: C && C.on ? C.save() : null, ham: getHamiltonian().id, preset: reg.preset, view: mat.view, t: clock.t }; } });
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
  /* iteration 004 · THE FOLDERS CARD (BASINS' rackSave, save-window.js:380): the kit's mountGallery, a second live view of FOLDERS' one library,
     8 a page — closed at the top of the LEFT rack, in + and WINDOW.  Built here, as BASINS builds it (a saved layout opens a card by its
     class alone, shell/rack-wiring.js, so a first-open build would leave it empty); painted again when it opens.  The id `projects` is
     permanent (a WORKSPACE layout row, Gemma's window list); a layout that does not list it leaves it where it is seated here */
  const wFolders = device({ id: 'projects', eyebrow: 'FOLDERS', status: 'PROJECTS' });
  const foldersView = layout.projects ? layout.projects.folders.mountGallery(wFolders.body, { pageSize: 8 }) : null;
  (rackL || rack).prepend(wFolders.root);
  rk.register({ id: 'projects', el: wFolders, side: 'left', closed: true, title: 'FOLDERS', glyph: 'folder', hint: 'your projects and the DEMOS',
    onOpen: () => { if (foldersView) foldersView.paint(); } });

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
  // 2026-10 (Josh): MOLECULES (with its register since iteration 008 U) opens on the LEFT rack under SPECTRUM.  No `devopen` fires here, so neither
  // solves at boot — MOLECULES pays its solve when it is switched on or a molecule is picked.
  if(useCompactDefaults) {
    const left=['informational','spectrum','chem'],right=['settings','state','palette','observer','camera','clip'];
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
  /* THE PICKER (iteration 004; iteration 003's main menu) is the front page unless something was opened — and it opens only once the
     photosensitivity notice is accepted: the notice (the kit's dialog, z 70) would sit UNDER the Picker (z 100000), and its CONTINUE
     could not be reached (IT004-MIR15-GAP §0 item 5).  `onAccept` runs at once when the notice is not up (a returning visitor, a driver). */
  const pickerAtBoot = !linkAtBoot.opened && !q.get('preset') && q.get('menu') !== '0' && (navigator.webdriver !== true || q.get('menu') === '1' || q.get('opener') === '1' || q.get('warn') === '1');   // a test driver goes straight in (as the opener's law was); ?menu=1, ?opener=1 or ?warn=1 (a human start, played) shows it there
  createPicker(app, { open: false });
  dom.start.warning.onAccept(() => { if (pickerAtBoot && app.state.picker) app.state.picker.open(); });
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
  /* THE CHOICE (main.js: ?starter=, `boot` for a driven or direct start, and for a human start RESUME when the session holds work, else
     `boot` — iteration 004, no title screen).  `home` and the boot keep the shipped scene and its `boot` / `link` origin; a demo id opens
     its demo (origin `open · NAME`); RESUME puts the session back (origin `resume`).  `home` and a demo forget the session, the boot arms
     it.  ?play=1 waits for the choice and then for the notice (armAutoplay). */
  const S = LW.session, id = await dom.start.choice;
  if (id === 'boot') S.arm(); else if (id === 'resume') layout.projects.resume(S); else S.discard();
  if (!['home', 'boot', 'resume'].includes(id)) await layout.projects.demo(id);
  armAutoplay();
  installWakeLock({ clock: appPlay });   // ONE clock: the wake lock is held while THE play plays (asked inside a gesture, armed otherwise; no timer)
  LW.ready = true;
  LW.report = (o, t = performance.now()) => import('../tools/perf/device-report.js').then((m) => m.run(LW, o, t)); if (q.get('report') === '1') LW.report(q);   // THE DEVICE REPORT (2026-09-25): a diagnostic in tools/, never precached — `?report=1` or __LW.report() measures this device and puts every setting back
  return LW;
}
