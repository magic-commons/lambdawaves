import { bindStageGestures, STAGE_BINDINGS } from './stage-gestures.js';
import { uiSpace } from './mir/shell/scene-guard.js';   // 0.5.0 C9: the kit's UI space, the stage guard's rects
import { coalesce } from './frame-coalescer.js';
import { waitForPaint } from './frame-settle.js';
import { createProjects } from './projects.js';   // 0.5.0 C6: PROJECTS are MIR's FOLDERS over the one project part (lab/projects.js, lab/project-store.js)
import { installWakeLock } from './mir/core/wakelock.js';   // 0.5.0 C6b: the screen stays on while THE play plays
import { renderNotebook } from './mir/shell/notebook-render.js';   // N6: the kit's copy (lab/notebook-render.js was byte-identical)
import { reworkNative, planeModel } from './native-ui.js';
import { firstRunMaterial, firstRunQuality, deviceQuality } from './first-run.js';   // W125: the first-run material follows the device · PACE P2: so does the first-run quality, and a saved one keeps within the device
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
import { BASIS, domainFor, psiAt, stateOf, orbitalFromTable } from './hydrogen.js';
import { Register, PRESETS, PRESET_BY_ID, RENDER_CAP } from './state.js';
import { Clock, onePlay } from './clock.js';
import { createFrameBudget } from './frame-budget.js';
import { createWindowActivity } from './mir/window-activity.js';
import { createOcclusion, paintedRect } from './occlusion.js';   // 0.5.0 A7: the occlusion providers (KIT BRIEF 8's twin)
import { createField, tableFor, VIEW, VIEW_NAMES, STYLE, STYLE_NAMES, cameraBasis, cameraEye, toScreen, quatFromYawPitch } from './field.js';
import { el, knob, sw, seg, trig, fader, readout, device, group, formula, chip, cssRGB, accentRGB, parseCssColor, mathPlain } from './mir/kit.js';
import { MOLECULE_BY_ID } from './molecules.js';
import { createStageText } from './stage-text.js';   // 0.4.0 S3 · F2: the STAGE TEXT — the interim renderer 0.5.0 deletes
import { createSpectrum } from './spectrum.js';
import { createMeters } from './meters.js';
import { createShadowView, createShadowFoot } from './shadowview.js';
import { createLadder } from './ladder.js';
import { createOrbit } from './orbit.js';
import { createVortex } from './vortex.js';
import { createParticles } from './particles.js';
import { createKepler } from './keplerview.js';
import { createFilm, FILM_FPS } from './render-exact.js';   // 0.5.0 C7: the film is MIR's recorder with λWAVES' frame
import { installTimeline } from './mir/timeline/bind.js';   // 0.5.0 C7b: the kit's TIMELINE window, on λWAVES' one modulation host
import { createFilmCard } from './film-card.js';   // 0.5.0 C7b: the film's UI is the kit's RENDER card
import { createKeyboardWindow } from './mir/keyboard/keyboard.js';   // 0.5.0 C3: the KEYBOARD window is the kit's (keymap.js left)
import { createKeyTable } from './key-table.js';    // 0.5.0 C3: ACTIONS on MIR's ONE KEY TABLE (keys.js and shortcuts.js left)
import { keplerOrbits } from './kepler.js';
import { createGas } from './gas.js';
import { densityPeriod, densityPeriodExact, fmtPeriod } from './period.js';
import { createCapture, maxPictureSize } from './capture.js';
import { createExporter, EXPORTS as SHAPE_EXPORTS } from './export3d.js';   // wave 134: FILE › EXPORT SHAPE / GRID
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
import { ATOMS, configOf } from './atoms.js';
import { toLUT, PRESET_BY_ID as PALETTE_BY_ID, PRESET_GROUPS, rgbToHex, hexToRgb, contrastRatio } from './mir/palette.js';   // N6: the kit's copy (lab/palette.js differed only in two comment lines)
import { domainForP, momentumTableFor } from './momentum.js';
import { momentumZ, AXIS_TO_Z, rotorsToZ, warmStep as kickWarm, tablesReady as kickReady } from './kick.js';
import { getHamiltonian, setHamiltonian, HAMILTONIANS, setZ, getZ } from './hamiltonian.js';
import { createRegisterSturmian } from './sturmianreg.js';
import { stateLatex, moleculeLatex, formulaLatex, BASIS_LABEL } from './latex-state.js';   // 0.3.3 · wave 135: SPECTRUM's ⧉ and EDIT › COPY the state as LaTeX; 0.4.0 S0: the molecule's page
import { wellPacket, wellCentroid } from './well.js';
import { applyRotor as rotorOnCopy } from './frontier.js';
import { createEditHistory } from './edit-domain.js';   // 0.5.0 C5: the one `edit` domain on the kit's stack (mir/history/history.js); lab/history.js left
import { CAM, createCameraLaw, clampShift } from './camera-law.js';   // wave 130 seam 11: the camera law and the observer's pose, out of boot()
import { createCameraPanel } from './mir/panels/camera.js';           // 0.5.0 C1: the CAMERA card's rows are the kit's panel over the law's port
import { barTempo } from './mir/modulation/host.js';
import { createModulation } from './mir/modulation/window.js';   // 0.5.0 C4: the kit's window controller (MIR 1.5), over A5's port
import { localStore } from './mir/modulation/bind.js';          // 0.5.0 C4: the kit's modulation record (the power and the cadence)
import { createModPort } from './mod-port.js';       // 0.5.0 A5: the port that window takes, and the edges behind it
import { createSettingsStore } from './settings-store.js';   // 0.5.0 A1: the settings blob's one door
import { createMotionPref } from './motion-pref.js';   // N7 seam 1: the reduced-motion law, out of boot()
import { createBusyMark } from './busy-mark.js';        // N7 seam 2: the busy mark, out of boot()
import { createWorkerPool } from './worker-pool.js';    // N7 seam 3: the maths workers, out of boot()
import { createLook, CARD_GROUND } from './look.js';    // 0.5.0 C2: the look is the kit's — mir.gui (createPrefs over LOOK_SCHEMA rows) and createAccent (once N7 seam 4, accent-wheel.js)
import { createSwClient } from './sw-client.js';        // N7 seam 5: the install layer's interface half, out of boot()
import { createBadges } from './badges.js';             // N7 seam 6: the badges and the canvas's sentence, out of boot()
import { createRack, readLayout, layoutLabel as rackLayoutLabel } from './mir/shell/rack.js';
import { device as kitDevice } from './mir/kit.js';   // 0.5.0 C3: the rack, its + and ☆ lists, the phone's crossing (rack-menus.js left)
import { createMenubar } from './mir/shell/menubar.js';    // 0.5.0 C3: the logo's bar is the kit's (menubar.js left; its MENUS table stays)
import { installWindowChrome } from './window-chrome.js'; // N7 seam 9: the LEAN and KIND passes, out of boot()
import { linkFor, readLink, LinkError, LINK_CHAR_CEILING } from './statelink.js';   // wave 56: every state of this lab is a LINK

/* THE BUILD STAMP — one constant, and every wave updates it.  The ABOUT face and its copy dump both read it here;
   nothing else in the app hand-writes a version, so a stale line can only come from forgetting THIS line. */
const BUILD_LINE = '0.5.0-alpha · GUI Adoption · 2026-10-09';   // THE ONLY PLACE THE NUMBER LIVES: the ABOUT face, the copy dump and the proof all read it back through LW.build (ANTI-PATTERN 6)

export const TIER = { NONE: 0, PRESENT: 1, RECONSTRUCT: 2, EVOLVE: 3, REBUILD: 4 };
const TIER_NAME = ['NONE', 'PRESENT', 'RECONSTRUCT', 'EVOLVE', 'REBUILD'];
const LS_EXP = 'lambdawaves.q0.experiment', LS_PRES = 'lambdawaves.q0.presentation';

export async function boot(dom) {
  const DEVICES = new Map(), device = (o) => { const d = kitDevice(o); DEVICES.set(o.id, d); return d; };   // 0.5.0 C3: the rack registers each card with its device(), so its fold is called, never re-clicked
  const reg = new Register();
  const __LW_hooks = {};
  /* UNDO / REDO: the ring is built at the foot of boot(), once every path it writes through exists; hNote() is
     the "an edit may have happened" ping for the few register-side setters that do not bump reg.version */
  let history = null;
  const hNote = () => { if (history) history.note(); };
  const clock = new Clock(), appPlay = onePlay(clock);   // 0.5.0 A6: THE play (clock.js) — every road that plays or pauses the physics clock is its edge


  const obs = { yaw: 0.65, pitch: 0.38, dist: 3.3, fov: 0.6, mode: 'free', quat: quatFromYawPitch(0.65, 0.38), shift: [0, 0] };   // wave 54: TURNTABLE reads (yaw, pitch); FREE reads `quat` and the angles become a READOUT; 0.4.0 S2: `shift`, the pivot's place on the frame (NDC)
  const mat = { view: VIEW.phase, exposure: 1, softness: 0.7, steps: 160, slice: { mode: 0, axis: 2, pos: 0, thick: 0.03 }, hueShift: 0, invert: false, frame: true, axis: true, axisInk: 'theme', paletteOn: false, style: STYLE.cloud, iso: 0.06, grain: 0.35, knee: 0.6, dither: 0, boost: { k: [0, 0, 0], on: false }, bg: [0.028, 0.038, 0.058], gamma: 1, lightUI: false, finish: 'lit' };   // S3: 'lit' from the boot, as restore() writes it
  const FIELD_CHROME = ['frame', 'axis', 'frameMode', 'axisMode', 'cornerSide', 'invert', 'axisInk'];   // 0.3.1 · S1 (D1): the reader's measurement furniture — PREFERENCE, never in a project or a link (docs/STATE-SCOPES.md)
  let palette = null;

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
  /* ── SETTINGS: what this browser remembers (theme, chrome, accents, quality, closed windows) ── */
  let settingsLoaded = false;
  let molFormulaScale = 1;                         // the STAGE TEXT's SIZE knob (Settings › Display): × the notebook's sizes (stage-text.js TYPE), a PREFERENCE
  function readSettings() { return settingsStore.read(); }
  function saveSettings() {
    if (!settingsLoaded) return;
    try {
      /* WAVE 54 · FOUND HERE: this writer built the object FROM SCRATCH, so every key written by anyone else was
         silently dropped on the next call — the notebook's remembered size (nbW / nbH, written by nbSaveSize's own
         merge) did not survive so much as a fold. The three keys this function does not own are carried through. */
      /* WAVE 59 · AND `warned` IS THE FOURTH, and it is not bookkeeping.  Wave 48 added the photosensitivity
         acceptance to this key AFTER wave 54 fixed the three above, so it fell into the same hole: accept the
         notice, then change the theme / close a window / load a layout / open a link that names a palette, and
         the acceptance was ERASED — in the same session, before `warning.needed()` reads it.  A safety notice a
         visitor has answered must stay answered, so it is carried like the other three. `remember()` writes the
         value; this function's only job is not to throw it away. */
      const S0 = readSettings();
      /* WAVE 105 · `audioDevice` IS THE FIFTH CARRIED KEY.  This writer rebuilds the object from
         scratch, so a key it does not name is destroyed on the next call — the exact hole waves 54 and
         59 each fixed once, and wave 102 reopened by writing the chosen microphone from somewhere
         else.  Pick an input, move any window, reload: back to the system default. */
      /* OPTIMIZATION 2026-09-24 · M4 · `abW` / `abH` ARE THE SIXTH AND SEVENTH, and the fourth time this one hole has been
         found (waves 54, 59, 105): nbSaveSize writes the ABOUT face's remembered size into this key, and the next
         preference change (a theme flip, a window closed) rebuilt the object without them, so ABOUT reopened at
         470 × 670.  Carried like the others; an absent value stays absent (JSON drops undefined). */
      settingsStore.write({ nativeLayout:useCompactDefaults?1:S0.nativeLayout, nbW: S0.nbW, nbH: S0.nbH, abW: S0.abW, abH: S0.abH, layouts: S0.layouts, warned: S0.warned, audioDevice: S0.audioDevice, captions: !document.body.classList.contains('no-captions'), molFormula: !document.body.classList.contains('no-mol-formula'), molFormulaSize: molFormulaScale,
        auto: quality.auto, governor: gov.on, keepFrames: keep.frames, perfMode: perf.mode,
        /* WAVE 51 · THE CAMERA'S FEEL IS A PREFERENCE, not a project's (wave 50 built FRICTION / SPIN / AUTO-ROTATE and
           none of the three survived a reload).  FRICTION and SPIN are how the instrument FEELS in the hand and they
           belong beside FROST and GOVERNOR.  AUTO-ROTATE is deliberately NOT here: a lab that starts turning by itself
           when you open it is a surprise, not a setting. */
        friction: camera.friction, spin: camera.speed, dragGain: camera.dragGain, fling: camera.flingGain,   // wave 58: the two View-window dials are the same kind of preference as FRICTION and SPIN (0.5.0 C4: the MOD power and cadence are the kit's record, saveMod)
        /* WAVE 64 · THE PORTED WINDOW'S PRESENTATION STATE, and it is the sixth of the six things
           host-contract.md says a host owes it: where the window sits, which lane the work bars are
           in, each device's F/C/M mode, the ribbon, and whether it was left open.  The RACK itself
           is not here — that rides in the project file, exactly as it did before. */
        modwin: modView ? modView.presentation() : S0.modwin,
        tlwin: S0.tlwin,   // 0.5.0 C7b: the TIMELINE window's shape and work lane (WORKSPACE), written by its own store and carried here
        frame: mat.frame !== false, axis: mat.axis !== false, frameMode: mat.frameMode, axisMode:mat.axisMode, cornerSide:mat.cornerSide,
        /* ⚠ WAVE 106 · TWO MORE OF THE FIELD'S CHROME, AND ONE CLOSES AN ASYMMETRY NEVER DECIDED.
           `invert` IS NEW HERE: it sat in the same row as FRAME and AXIS from wave 56 and was the only
           one of the three this browser did not remember — two kept over a reload and one silently
           thrown away.  Moving it to PALETTE is the moment to end that.
           `axisInk` is a BROWSER PREFERENCE like frame and axis, and NOT like `mat.lightUI`, which
           serialize() strips out of every project: lightUI is not a choice at all, it is the RESOLVED
           theme, and a file carrying it would impose the sender's theme on its reader.  AXIS COLOUR
           *is* a choice, and it is remembered here.  0.3.1 · S1 (D1): the whole field chrome — frame, axis,
           their modes, the corner, invert, axis colour — is this browser's alone; serialize() strips it and
           restore() ignores it in an older file, so no project or link can change a reader's axes. */
        invert: !!mat.invert, axisInk: mat.axisInk || 'theme',        // wave 53: the two chrome objects are this browser's, like FROST and the tags
        phoneTr: !!document.querySelector('.dev[data-id="transport"].folded'),
        /* WAVE 59 · WHICH WAY THE PHONE'S RACK WAS LEFT, on exactly phoneTr's pattern — a phone-only chrome
           preference, derived from the DOM rather than tracked in a second place.  The DEFAULT (nothing said)
           is HIDDEN, and that default is the whole point: see enterPhone(). */
        phoneRack: document.body.classList.contains('phone') ? !document.body.classList.contains('rack-hidden') : S0.phoneRack,
        /* WAVE 54: which colour space this BROWSER asked for.  0.3.1 · S1: the camera MODE and the palette left this key —
           the palette is PROJECT state (D2), and so is the mode, because a pose cannot be read back without it (D4: a
           TURNTABLE record's rotor is stale, a FREE one carries roll; docs/STATE-SCOPES.md). */
        gamut: document.body.dataset.gamut === 'p3' ? 'p3' : 'srgb', p3Mode: ui.p3Seg ? ui.p3Seg.get() : 'convert',
        closed: [...document.querySelectorAll('.dev.closed')].map((d) => d.dataset.id) });
    } catch (e) {}
  }


  /* 0.5.0 C2 · THE LOOK'S SETTERS are the store's (lab/look.js): one `set`, on the page in the same task, and SETTINGS repainted
     from the store (lookSync).  An unnamed card is the device's and an unknown frost is OFF, as they always were. */
  function setCardStyle(id) { look.set({ card: id === 'tinted' || id === 'refractive' ? id : FIRST_RUN.card }); return document.body.dataset.card; }
  function setFrost(mode) { look.set({ frost: mode === 'still' || mode === 'always' ? mode : 'off' }); return look.get('frost'); }
  function setDisconnected(v) { look.set({ disconnected: !!v }); return !!v; }
  /** the SETTINGS controls the look store drives, repainted from it */
  function lookSync(s, keys) {
    const c = { theme: ui.themeSeg, card: ui.cardSeg, frost: ui.frostSeg, disconnected: ui.discSw, blur: ui.blurK, accentA: ui.accA, accentB: ui.accB, vivid: ui.vivid,
      badges: ui.badgesSw, hints: ui.controlHintsSw, help: ui.windowInfoSw };
    for (const k of keys) if (c[k]) c[k].set(s[k]);
  }
  function applySettings() {
    const s = readSettings();
    look.rerun(); lookSync(look.prefs.all(), Object.keys(look.prefs.all()));   // 0.5.0 C2: the look again, now that the theme's engine hooks exist
    const captions = s.captions === true;
    document.body.classList.toggle('no-captions', !captions); if (ui.capSw) ui.capSw.set(captions);
    /* THE STAGE TEXT (0.4.0 S3): one switch for the formula, the fade and the atom labels; nothing said means ON.  The ATOM
       LABELS' own key is read ONCE — only where the formula's was never written (an older profile) — and is dropped by the
       next save with its SIZE: a stored molFormula decides, because the row is one switch and that is the key it keeps. */
    const molFormula = s.molFormula !== undefined ? s.molFormula !== false : s.atomLabels !== false;
    document.body.classList.toggle('no-mol-formula', !molFormula); if (ui.molFormulaSw) ui.molFormulaSw.set(molFormula);
    molFormulaScale = Number.isFinite(+s.molFormulaSize) ? Math.max(0.5, Math.min(3, +s.molFormulaSize)) : 1; if (ui.molFormulaK) ui.molFormulaK.set(molFormulaScale);
    if (stageText) { stageText.setScale(molFormulaScale); stageText.setOn(molFormula); }
    if (s.auto === false) { quality.auto = false; if (ui.autoSw) ui.autoSw.set(false); }
    if (s.governor === false) setGovernor(false);                 // wave 45: the governor held off
    if (s.keepFrames === true) setKeepFrames(true);              // wave 45: the playhead follows every frame (off by default)
    setPerfMode(s.perfMode === 'full' ? 'full' : '120');         // an absent key takes the official 120 Hz profile; an explicit FULL choice survives
    if (typeof s.friction === 'number') camera.setFriction(s.friction);   // wave 51: the camera's feel comes back …
    if (typeof s.spin === 'number') camera.setSpeed(s.spin);              // … but AUTO-ROTATE never does (see saveSettings)
    if (typeof s.dragGain === 'number') camera.setDragGain(s.dragGain);   // wave 58: DRAG GAIN and FLING ride beside them
    if (typeof s.fling === 'number') camera.setFling(s.fling);
    /* 0.5.0 C4 · THE POWER AND THE CADENCE are this browser's (PREFERENCE) and live in the kit's modulation record, the one
       MIR's installModulation reads; an older blob's pair is read ONCE into it, and the blob drops it on its next save. */
    const mr = { modArm: s.modArm, modCadence: s.modCadence, ...modStore.read() };
    MOD.hz = mr.modCadence === 120 ? 120 : 60; if (modView) modView.sync();   // wave 52: the modulation's cadence cap is the PANEL's, not the project's
    if (mr.modArm === false) setModArm(false, { quiet: true });   // wave 65: ARMED is the default a fresh visit gets
    if (s.modArm !== undefined || s.modCadence !== undefined) saveMod();
    if (s.frame === false) { mat.frame = false; if (ui.frameSw) ui.frameSw.set(false); }     // wave 53: FRAME and AXIS, independently
    if (['box','lattice','dots'].includes(s.frameMode)) mat.frameMode=s.frameMode;
    if (['box','corner'].includes(s.axisMode)) mat.axisMode=s.axisMode;
    mat.cornerSide=s.cornerSide==='left'?'left':'right';
    if (s.axis === false) { mat.axis = false; if (ui.axisSw) ui.axisSw.set(false); }
    /* ⚠ and the two that left the WAVE window with them.  Both read the NON-DEFAULT ONLY, on exactly
       the law of the two lines above: NOTHING SAID MEANS THE SHIPPED VALUE, so a profile written
       before this wave opens as it always did instead of inheriting a default nobody chose. */
    if (s.invert === true) { mat.invert = true; if (ui.invertSw) ui.invertSw.set(true); }
    if (s.axisInk === 'cmy' || s.axisInk === 'rgb') { mat.axisInk = s.axisInk; if (ui.axisInkSeg) ui.axisInkSeg.set(s.axisInk); }
    if (Array.isArray(s.closed)) for (const d of document.querySelectorAll('.dev')) d.classList.toggle('closed', s.closed.includes(d.dataset.id));   // the remembered set, exactly
    /* 0.3.1 · S1 (D4's escape hatch): the camera MODE is the project's, like the pose it is needed to read, so a `camMode`
       an older build left here is not read — the boot is FREE (the shipped seed) and a project brings its own. */
    if (s.p3Mode === 'vivid' && ui.p3Seg) ui.p3Seg.set('vivid');


    const wantP3 = s.gamut ? s.gamut === 'p3' : appleDevice();
    if (wantP3 && ui.gamutSeg) ui.gamutSeg.set(field.ok && field.setGamut ? (field.setGamut(s.p3Mode === 'vivid' ? 'p3-vivid' : 'p3') === 'srgb' ? 'srgb' : 'p3') : 'srgb');   // it can only come back if the canvas can honour it
    document.body.dataset.gamut = field.ok && field.gamut !== 'srgb' ? 'p3' : 'srgb';
    settingsLoaded = true;
  }


  const KIND = { state: 'core', spectrum: 'core', observer: 'core', palette: 'core', camera: 'core', clip: 'core', transport: 'core', settings: 'other', shadow: 'info', vortex: 'info', slice: 'info', calculus: 'info', meters: 'info', ladder: 'info', orbit: 'control', atoms: 'info', chem: 'other', wigner: 'info', radiation: 'info' };
  /* WAVE 56 · WINDOWS THAT NO LONGER EXIST, and the window that absorbed each of them.  A saved LAYOUT is
     a list of window ids and nothing else, so retiring an id would silently drop a seat out of every layout
     ever saved unless the id has somewhere to go.  `style` (DRAW STYLE) was merged into `observer` (WAVE) by
     board #59, which kept the heir's id precisely so that three CSS selectors and the gate did not have to
     move.  Read by layout.applyLayout(); the settings key's `closed[]` needs nothing, because it names each
     window independently and the heir already names itself. */
  /* 0.4.0 S3 (R-W1): DYNAMICS is retired into SHADOW (L, T, V, S and the plot), CALCULUS (the moments), RADIATION (the
     lines) and VORTEX (PARTICLES); a saved layout's DYNAMICS seat lands on SHADOW. */
  const RETIRED_WINDOWS = { style: 'observer', dynamics: 'shadow' };
  /* POWER is persistent device state. Presentation eligibility is a separate, transient visibility law below:
     leaving the viewport must save work without rewriting the user's project or switches. */
  const powered = (w) => !(w && w.root && w.root.classList.contains('off'));
  const DIGESTS = {};
  let space = 'x';                 // 'x' position ψ(x) · 'p' momentum φ(p): the same state, two exact pictures


  const quality = { ...firstRunQuality(isPhone() ? 'phone' : isTablet() ? 'tablet' : 'desktop'), auto: true, autoScale: 1, minScale: 0.35 };   // PACE P2: 64³ × 160 × 1 on a desktop (and a phone, whose crossing has its own rule), the GRID pairing 64³ × 110 × 0.75 on a tablet
  /* ── ONE CONTROLLER (wave 128; AUTO SCALE's one rule AS 2026-09-25 + the GOVERNOR of wave 45, merged) ─────────────────────
     ONE measurement: the MEDIAN of the presented-frame intervals in a window of one running loop (the loop is paced, so rAF
     is honest on every browser).  ONE decision, once ≥ 250 ms and ≥ 6 presented frames have passed, against the frame budget
     (60 Hz in FULL, the observed cadence up to 120 Hz in 120 mode); the window restarts after every decision.  Its levers:
     SCALE (the AUTO SCALE switch): outside [budget·1.08, budget·4/3] jump ONCE to the scale that meets the target (the present
       costs ∝ scale²: scale·√(target/median), ×0.5…×1.15) on the 0.05 grid, rounded toward the current scale, then HOLD — each
       step reallocates the canvas (a stall on WebKit), and at vsync the interval cannot show headroom, so it never probes up.
     GRID (the GOVERNOR switch, while playing, above 64³, and only from the scale's own probe — with AUTO SCALE off it never
       steps): one rung down (128 → 96 → 64, the rebuild road) when the DESCENT the scale made did not lower the median as scale²
       predicts (median > m0·(s/s0)² + budget: a vsync-quantised present-bound frame misses its prediction by less than one
       refresh ≤ one budget, so only a reconstruct-bound frame fails it), or reached the floor still over.  The scale then
       returns to what the present measured on that descent can afford.  No rung comes back while playing.
     READERS (the GOVERNOR switch): the reader law below, by measured cost.
     THE PAUSE EDGE (W125-2, one place, in the loop): the user's grid and a scale of 1 come back at once with one frame, and the
     window restarts — the play's intervals are not the still picture's.  quality.res stays the USER's (and the project's);
     gov.drop is this browser's, never serialised.  (The step rung ×0.7/×0.5 of 2026-09-10 is gone: it only ever helped a
     present-bound frame, which the scale mends for less, and on a compute-bound one it stacked on the scale — AUDIT-A FA4.) */
  const autoQ = { presented: 0, sinceMs: 0, k: 0, iv: new Float64Array(32), lastMs: 0, changes: 0, m0: 0, s0: 1 };   // m0/s0: the median and scale where the current descent began
  function controlStep(w, nowMs, scale, minScale, budgetMs, auto, gridFree) {   // null until due, else { median, scale, rung }
    if (w.presented < 6 || nowMs - w.sinceMs < 250) return null;
    const n = Math.min(w.k, w.iv.length), ms = n > 2 ? w.iv.subarray(0, n).sort()[n >> 1] : 0;   // sorts the window in place: it restarts after every decision
    const over = ms > budgetMs * 4 / 3, failed = w.m0 > 0 && ms > w.m0 * (scale / w.s0) ** 2 + budgetMs;   // failed: the descent did not buy what scale² promised
    if (auto && gridFree && (failed || (over && scale <= minScale))) {
      const P = w.m0 > ms ? (w.m0 - ms) / (w.s0 * w.s0 - scale * scale) : 0;   // the present's cost at scale 1, as the descent measured it
      return { median: ms, rung: true, scale: w.m0 > 0 ? Math.max(scale, P > 0 ? Math.min(1, Math.floor(20 * Math.sqrt(budgetMs / P) + 1e-9) / 20) : 1) : scale };
    }
    if (!auto || (!over && !(ms > 0 && ms <= budgetMs * 1.08))) return { median: ms, rung: false, scale };
    const x = 20 * scale * Math.min(1.15, Math.max(0.5, Math.sqrt((over ? budgetMs : budgetMs * 1.08) / ms)));
    return { median: ms, rung: false, scale: Math.min(1, Math.max(minScale, (over ? Math.ceil(x - 1e-9) : Math.floor(x + 1e-9)) / 20)) };
  }
  let playedLast = false;          // W125: was the transport playing on the last frame the loop ran?  The pause EDGE is playedLast && !playing
  const RES_LADDER = [64, 96, 128];
  const gov = { on: true, drop: 0, median: 0, changes: 0, scroll: 0, parked: new Map(), probes: 0, probeFrame: -1 };


  const effectiveRes = () => { if (!gov.drop) return quality.res; let i = RES_LADDER.findIndex((r) => r >= quality.res); if (i < 0) i = RES_LADDER.length - 1; return RES_LADDER[Math.max(0, i - gov.drop)]; };
  const READER_LAW = { park: 16, slow: 6, parkDrop: 8, slowDrop: 3, probeMs: 3000 };   // ms per update: parked while playing / slowed to every 6 × cost — and the tighter pair once stepped down


  const keep = { frames: false };
  const domain = { auto: true, half: 7 };
  const fieldRate = { capMs: 0 };
  /* PERFORMANCE: 'full' updates every CPU window every frame; '120' updates them every 4th frame (≈30 Hz at 120 Hz)
     while the FIELD still presents every frame — the picture never waits for a readout.  The profile is an EMA of
     the milliseconds each stage costs per frame, so the mode is chosen on numbers, not on faith. */
  const perf = { mode: '120', cpuEvery: 4, profile: { total: 0, field: 0, spectrum: 0, shadow: 0, orbit: 0, vortex: 0, particles: 0, kepler: 0, slice: 0, calculus: 0, meters: 0, badges: 0, atoms: 0, wigner: 0, radiation: 0 }, counts: { frames: 0, cpu: 0 }, ring: new Float64Array(60), work: {}, wall: {} };   // work: an EMA of the cost of the updates that DID work (≥ 1 ms), wall: when the last one ran
  const frameBudget = createFrameBudget();
  const perfBudgetMs = () => frameBudget.milliseconds(perf.mode);
  const tick = (name, fn) => { const a = performance.now(); fn(); const d = performance.now() - a; perf.profile[name] = perf.profile[name] * 0.9 + d * 0.1; if (d >= 1) { perf.work[name] = perf.work[name] ? perf.work[name] * 0.7 + d * 0.3 : d; perf.wall[name] = a; } };
  /** THE READER LAW (wave 45).  While the transport PLAYS and the governor is on, a window whose update was measured over
      a frame's budget is PARKED — it runs on pause or edit, and its status says so — one over half a frame runs at most
      every 6 × its cost, and the rack's own scroll makes every reader yield for 150 ms.  Paused, every reader runs on
      every frame exactly as before, so nothing a proof reads after settle() has changed.  The SLICE was the case: a 128²
      resample of every populated mode, 20–100 ms each at 8 Hz — every hitch of the idle histogram, and 134 ms per call
      after a bow (wave 45's measurements). */
  let uiHidden = false;
  const READERS = {};
  function may(name, w) {
    if (w && !windowActivity.canPresent(w)) return false;
    if (!clock.playing || !gov.on) { if (gov.parked.has(name)) unpark(name, w); return true; }
    const now = performance.now();
    if (now - gov.scroll < 150) return false;
    const cost = perf.work[name] || 0, park = gov.drop ? READER_LAW.parkDrop : READER_LAW.park, slow = gov.drop ? READER_LAW.slowDrop : READER_LAW.slow;
    /* THE RE-PROBE (wave 50).  A parked reader never runs, so its cost is never measured again, so it stays parked
       for the whole session even after the thing that made it dear has gone (a one-off hitch during its measurement,
       a smaller state, a window that got cheaper, a governor notch that made every reader cheaper).  Once every
       PROBE_MS it is let through ONCE: perf.work is cleared first, so tick() writes a FRESH measurement rather than
       nudging a stale EMA (and a probe under 1 ms writes nothing at all, which reads as free).  The next may() then
       unparks it on the new number, or parks it again on the old one.  PROBE_MS = 3 s was the old governor's recovery
       cadence (3 s under budget lifted a grid notch): one probe of an over-budget reader costs at most its own frame,
       so the price of asking is under 1 % of the wall even for a 30 ms reader, and a window that came back under
       budget is live again within one cadence of the edit that freed it. */
    if (gov.parked.has(name)) { const p = gov.parked.get(name); if (now - p.probe >= READER_LAW.probeMs && gov.probeFrame !== perf.counts.frames) { gov.probeFrame = perf.counts.frames; p.probe = now; p.probes++; gov.probes++; perf.work[name] = 0; return true; } }   // ONE probe per frame: the law exists so that no frame carries two readers over budget, and a probe is a reader over budget
    if (cost > park) { if (!gov.parked.has(name)) parkReader(name, w, cost); return false; }
    if (gov.parked.has(name)) unpark(name, w);
    if (cost > slow && now - (perf.wall[name] || 0) < Math.max(250, 6 * cost)) return false;
    return true;
  }
  function parkReader(name, w, cost) {
    const st = w && w.root ? w.root.querySelector('.dev-stat') : null, prev = st ? st.textContent : '', cls = st ? st.className : 'dev-stat';
    const note = (prev ? prev + ' · ' : '') + 'PARKED by the GOVERNOR: ' + cost.toFixed(0) + ' ms per update — runs on pause or edit';
    gov.parked.set(name, { prev, cls, note, cost, pop: reg.populated().length, probe: performance.now(), probes: 0 }); if (w && w.setStatus) w.setStatus(note, 'warn');
  }
  function unpark(name, w) {
    const p = gov.parked.get(name); gov.parked.delete(name); perf.work[name] = 0;      // re-measured on its next update
    if (p && w && w.root) { const st = w.root.querySelector('.dev-stat'); if (st && st.textContent === p.note) { w.setStatus(p.prev); st.className = p.cls; } }
  }
  function setGovernor(v) {
    gov.on = !!v; if (ui.govSw) ui.govSw.set(gov.on);
    if (!gov.on) { gov.drop = 0; for (const name of [...gov.parked.keys()]) unpark(name, READERS[name]); schedule(TIER.REBUILD); }
  }
  function setKeepFrames(v) {
    keep.frames = !!v; if (ui.keepSw) ui.keepSw.set(keep.frames);
    if (!ui.scrub) return;
    const r = ui.scrub.root; r.classList.toggle('disabled', !keep.frames); r.style.opacity = keep.frames ? '' : '.35'; r.style.pointerEvents = keep.frames ? '' : 'none';
    r.tabIndex = keep.frames ? 0 : -1; r.setAttribute('aria-disabled', String(!keep.frames));   // wave 62: a control the pointer cannot reach must not be reachable by Tab either
    r.title = keep.frames ? '' : 'Enable KEEP FRAMES to animate the playhead';
    if (!keep.frames) ui.scrub.set(0);
    schedule(TIER.PRESENT);
  }
  function setPerfMode(m) {
    perf.mode = m === '120' ? '120' : 'full';
    perf.cpuEvery = perf.mode === '120' ? 4 : 1;
    autoQ.presented = autoQ.lastMs = 0;
    frameBudget.breakSequence();
    if (ui.perfSeg) ui.perfSeg.set(perf.mode);
  }
  const stats = { frames: 0, presents: 0, skipped: 0, reconstructs: 0, evolves: 0, rebuilds: 0, tiers: { PRESENT: 0, RECONSTRUCT: 0, EVOLVE: 0, REBUILD: 0 }, lastTier: 'NONE', scheduled: false, fps: 0, reconPerSec: 0, stepsPerSec: 0, lastEncodeMs: 0, fieldT: 0 };
  const cRe = new Float64Array(91), cIm = new Float64Array(91);
  let pointerHeld = false;       // a gesture is in flight: the expensive per-frame readouts wait it out (see periodNow)
  let keplerDirty = true, govVersion = -1, metersWall = 0, badgesWall = 0;   // wave 45: the KEPLER canvas is drawn only while on (one clearing draw after), the parked readers re-run on an edit, METERS repaints at 10 Hz while playing
  let applyVisuals = true;
  /* WAVE 52 · W-MODWINDOW.  The modulation host (lab/mir) and its face.  Declared HERE, beside the
     scheduler's own state, because the frame loop drives the modulation clock and must be able to
     guard on it before the window that shows it has been built.  0.5.0 A5: the port is lab/mod-port.js. */
  let modHost = null, modView = null, modWall = 0, modExpOn = null, dodge = null, tl = null, filmCard = null;   // C7b: the pill's dodge (both kit windows) · the TIMELINE · the RENDER card
  const mod = createModPort({ available: () => field.ok, present: () => schedule(TIER.PRESENT), view: () => modView, onCapture: (c) => { audioCap = c; }, save: saveMod, say: (t) => wMet.setStatus(t, t ? 'warn' : '') });   // 0.5.1 D10-19: the flash guard's one line, METERS' status
  const { setKnob, hand: modHand, syncBases: modSyncBases, feedAudio, cadence: MOD, knobs: modKnobs, gets: modGets, held: modHeld } = mod;   // the hand / base / modulated law, the feed, the cadence, the maps
  appPlay.onChange((on) => mod.follow(on));   // 0.5.0 C4 (R-B1): ONE clock — every play edge, the power on or off, holding the app-play demand while it plays
  let feedMs = 0;                      // wave 105: the SMOOTHED feed interval, ms — see the pump


  const ROT_LIMIT = { z: 2 * Math.PI, kz: 2 * Math.PI, def: Math.PI };
  const rotRate = { z: 0, kz: 0, def: 0 };            // rad/s.  THE ANGLE IS NOT STORED AND NEVER WILL BE.
  const rotDriving = () => rotRate.z !== 0 || rotRate.kz !== 0 || rotRate.def !== 0;
  /* S4 · THE RING'S `driven` IS "THE DRIVE MOVED THE REGISTER ON ITS LAST TICK", not "a rate is set": ROTATE z on an m = 0 state
     turns nothing, and a set rate froze the ring over every edit (probes/S3-verify/rotdrive.mjs).  NOT "and the clock plays": the
     drive integrates on the modulation tick's wall clock, and a paused 2p_x keeps turning (probes/S4/rot-paused.js).  The drive's
     own version bumps note nothing (rotTicking): its stop notes 'rotation drive', once. */
  let rotMoved = false, rotTicking = false;
  function setRotationRate(key, value) {
    if (!(key in ROT_LIMIT) || !Number.isFinite(value)) return false;
    const v = key !== 'z' && sturm.P ? 0 : Math.max(-ROT_LIMIT[key], Math.min(ROT_LIMIT[key], value));
    if (rotRate[key] === v) return v;
    rotRate[key] = v;
    const k = key === 'z' ? ui.rotZRate : key === 'kz' ? ui.kzRate : ui.defRate;
    setKnob(k, v);
    if (!rotDriving()) { rotMoved = false; if (history) history.note('rotation drive'); }
    schedule(TIER.PRESENT);
    return v;
  }
  /** One tick applies each exact operator in z, K_z, L² order. Simultaneous noncommuting
   * drives use this ordered splitting; no claim of a joint closed-form exponential is made. */
  function rotStep(dt) {
    if (dt <= 0 || !rotDriving()) return false;       // the whole cost of a still instrument
    /* W-STURMIAN: K_z and L² are moves inside a COULOMB shell.  Under the Sturmian propagator
       state.js's _op takes its non-commuting branch and would apply them at time t under a scale
       whose shells are not n²-fold degenerate — which is why the two jog wheels already stand down
       (applySturmian).  Their RATES stand down on the same line, in the SETTER as well as here, so
       a modulated rate cannot creep past a disabled dial.  ROTATE z survives: m is still m. */
    const az = rotRate.z * dt, ak = sturm.P ? 0 : rotRate.kz * dt, ad = sturm.P ? 0 : rotRate.def * dt;
    if (az === 0 && ak === 0 && ad === 0) return false;
    const d0 = reg.digest(); rotTicking = true;
    if (az !== 0) reg.rotateZ(az);
    if (ak !== 0) reg.rotateK(ak);                    // ≤ 35 blocks of ≤ 6×6 symEig, unpopulated ones skipped
    if (ad !== 0) reg.defectWait(ad);
    rotTicking = false; rotMoved = reg.digest() !== d0;
    touchState();                                     // ONE schedule for all three, not three
    return true;
  }
  let audioCap = null;   // wave 102: THE ONE MICROPHONE, built lazily by the port on a MIC press (never by adding a device); read by the loop and setPageHidden


  let modArm = true;
  const modStore = localStore('lambdawaves.q0.modulation');   // 0.5.0 C4: { modArm, modCadence }, PREFERENCE (docs/STATE-SCOPES.md)
  function saveMod() { modStore.write({ modArm, modCadence: MOD.hz }); }
  let occludeDirty = true, occludeAt = 0;    // INK UNDER GLASS: the window rectangles the line pass skips; refreshed at the top of a frame, before any DOM write
  const occlusion = createOcclusion(() => { occludeDirty = true; schedule(TIER.PRESENT); });   // 0.5.0 A7: dirty() is the one producer (a PRESENT even while paused)
  let stageMix = 0.04, stageFollow = true;   // STAGE: 0 = theme, 1 = chosen colour; FOLLOW THEME bypasses the mix without erasing either setting
  let refSnapshot = null;        // { re, im, ids } — the DIFF reference state
  let pendingRef = null;


  /* 0.5.0 C2 · THE LOOK (lab/look.js): the kit's store `mir.gui` over LOOK_SCHEMA rows and its accent engine, applied at once —
     before a single window is built, so the FIRST paint is already this browser's glass.  The theme's engine side (the stage
     ground, the GPU chrome, the browser's bar) is __LW_hooks.theme, which the SETTINGS block registers. */
  const look = createLook({ settings: settingsStore, defaults: LOOK_DEFAULTS, mat, wheelStops: PALETTE_BY_ID.get(PAL_DEF).stops,
    getModView: () => modView, onTheme: (t, choice) => { if (__LW_hooks.theme) __LW_hooks.theme(t, choice); } });
  const { accent, applyAccent, paintMarks, markBatchBegin, markBatchEnd, stageGround, inkCtx } = look, { wheelColor, markInk } = accent;
  look.prefs.subscribe(lookSync);
  const { busy, busyHost, busySync, busyFlash, busyWrap, cardLoading } = createBusyMark({ paintMarks, markBusy: accent.busy });   // N7 seam 2: lab/busy-mark.js

  /* ── FIELD ────────────────────────────────────────────────────────────── */
  /* WAVE 59 · `onLost` WAS NEVER PASSED, and field.js has offered it since it was written: `device.lost`
     flips `field.ok` to false and, with no handler, TELLS NOBODY.  A driver reset, a backgrounded mobile tab
     whose GPU is reclaimed, a laptop switching cards — the rack goes on working, the readouts go on updating,
     and the picture is frozen with no explanation.  That is the most likely failure on a phone and it is the
     one this app was silent about.  0.5.0 C9 · R14: this is λWAVES' GPU RECOVERY, `gpuRecovery` (gate: tests/gpu-recovery).
     0.5.0 C6b: the banner is the kit's (main.js installBanner, dom.banner: its pane, its ×, its ink on both themes). */
  const field = await createField(dom.canvas, { resolution: quality.res,
    onError: (m) => dom.banner.fail('GPU error', m),
    onLost: function gpuRecovery(i) { dom.banner.fail('the GPU device was lost', ((i && i.message) || 'the browser took the WebGPU device back') + ' — the FIELD is frozen where it stands. RELOAD to bring it back; SPECTRUM, SHADOW and METERS are still live and the state is untouched.'); } });
  if (field.ok) look.setGamut((rgb) => (field.gamut === 'srgb' ? rgbToHex(rgb) : 'color(display-p3 ' + field.gamutInk(rgb).map((v) => v.toFixed(4)).join(' ') + ')'));   // wave 54: one map, both sides
  /* M1 (2026-09-24): a device lost before createField finished has already put up onLost's own banner (the GPU device
     was lost … RELOAD); "WebGPU unavailable" over it would be the wrong sentence, so that one road keeps its banner. */
  if (!field.ok && !/^device lost/.test(field.error || '')) dom.banner.warn('WebGPU unavailable', field.error + '. The FIELD needs WebGPU; SPECTRUM, SHADOW and METERS still run on the CPU.');
  markBatchBegin();                   // M7: the boot's build is one synchronous task from here to busyHost() at its tail — one mark paint, there
  /* ── THE MATHS WORKERS (wave 45): lab/worker-pool.js (N7 seam 3) — bow · period · cards · chem, and the two card roads.
     The constructor is the one literal worker road in the lab, so it stays here. ── */
  const { maths, scan, cards, solveCard, solveChem } = createWorkerPool({ busyWrap,
    spawn: () => new Worker(new URL('./mathworker.js', import.meta.url), { type: 'module' }) });
  /* …and on this thread too (the K key and the IMPULSE trigger are synchronous). This used to spend 8 ms every
     40 ms beginning 1.5 s after boot: a deliberate 20% main-thread tax during the exact interval an iPad was
     trying to settle its first field. Warm in short idle slices instead, after the first-use path is stable. */
  let warmTimer = 0, warmIdle = 0, workerWarmStarted = false;
  const cancelWarm = () => {
    if (warmTimer) { clearTimeout(warmTimer); warmTimer = 0; }
    if (warmIdle && globalThis.cancelIdleCallback) { cancelIdleCallback(warmIdle); warmIdle = 0; }
  };
  const warmKick = (deadline) => {
    warmTimer = warmIdle = 0; if (page.hidden) return;
    const room = deadline && deadline.timeRemaining ? deadline.timeRemaining() : 3;
    /* The worker graph used to load during boot. Its speculative table now starts only in real idle time and does
       not raise the cursor busy mark; the first user-requested bow still starts the same worker immediately. */
    if (!workerWarmStarted && maths.ok && !clock.playing && room >= 1) { workerWarmStarted = true; maths.raw({ op: 'warm', ham: 'hydrogen', Z: 1 }); }
    if (!kickReady() && !clock.playing && room >= 1) kickWarm(Math.min(4, Math.max(1, room - 1)));
    /* LA5 · NOTHING LEFT TO WARM, SO NOTHING IS ARMED.  This used to re-arm every 2 s forever — a timer and an idle
       callback per tick on a paused, untouched instrument (AUDIT-B FB9, AUDIT-F F15).  The tables are keyed on the
       Hamiltonian in force (kick.js tablesReady), so switchHamiltonian — the one funnel of every OPERATOR, Z, ELEMENT,
       LAUNCH, restore and undo change — re-arms the chain; the resume road re-arms it too (warmArm(60)). */
    if (kickReady() && (workerWarmStarted || !maths.ok)) return;
    warmArm(kickReady() ? 2000 : clock.playing ? 750 : 120);
  };
  const warmArm = (ms) => {
    cancelWarm();
    warmTimer = setTimeout(() => {
      warmTimer = 0;
      if (globalThis.requestIdleCallback) warmIdle = requestIdleCallback(warmKick, { timeout: 1500 });
      else warmKick(null);
    }, ms);
  };
  warmArm(3000);

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
  function setPageHidden(on, via) {
    const want = !!on;
    if (want === page.hidden) return page.hidden;
    page.hidden = want; page.via = via || '';
    if (want) {
      page.parks++; page.hiddenAt = performance.now();
      page.mark = { t: clock.t, camT: camera.t, frames: stats.frames, presents: stats.presents, wall: page.hiddenAt };
      if (maths.ok) maths.park(); if (scan.ok) scan.park(); if (cards.ok) cards.park();     // the workers: the one thing the browser throttles for nobody
      cancelWarm();                                             // the idle reader and its delay
      if (modHost) modHost.clock.setHidden(true);                 // the modulation clock stops (and releases any hold)
      if (audioCap && audioCap.setHidden) audioCap.setHidden(true);  // wave 105: the capture reports to the SAME authority — it owns no listener of its own
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
      modWall = now; lastReconMs = -1e9;        // the modulation cadence and the FIELD clock start their windows here
      autoQ.lastMs = 0; autoQ.presented = 0;   // the controller's window, and the "the thread was blocked" flash that a 3-minute gap would otherwise fire
      metersWall = 0; winStart = 0; winFrames = winRecon = winSteps = 0;
      if (camLevel.from) camLevel.t0 = now;     // a levelling slerp interrupted by a tab switch resumes, it does not finish in one frame
      page.firstDt = null;                      // the loop records the first dt it actually integrates, and the gate reads it
      if (maths.ok) maths.resume(); if (scan.ok) scan.resume(); if (cards.ok) cards.resume();
      if (modHost) modHost.clock.setHidden(false);                // mir/modulation/host.js re-anchors itself: prevWall = null + reanchorTransport
      if (audioCap && audioCap.setHidden) audioCap.setHidden(false); // wave 105: …and the follower spends one frame re-learning the spectrum rather than firing a phantom onset
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
  let pending = TIER.NONE, rafId = 0, lastWall = 0, lastReconMs = -1e9, dragging = false, inLoop = false;
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
  let cornerLayoutDirty=true,cornerSideAtLayout='',cornerVW=0,cornerVH=0;
  const swapCorner=()=>{mat.cornerSide=mat.cornerSide==='left'?'right':'left';cornerLayoutDirty=true;saveSettings();schedule(TIER.PRESENT);};
  let cornerTap=0;
  cornerAxis.addEventListener('click',e=>{const now=performance.now();if(e.detail===0 || now-cornerTap<400){swapCorner();cornerTap=0;}else cornerTap=now;});
  function placeCornerAxis() {
    if (mat.axis===false || mat.axisMode!=='corner') { if (!cornerAxis.hidden) cornerAxis.hidden=true; return; }
    if (cornerAxis.hidden) { cornerAxis.hidden=false; cornerLayoutDirty=true; }
    if (cornerSideAtLayout!==mat.cornerSide || cornerVW!==window.innerWidth || cornerVH!==window.innerHeight) cornerLayoutDirty=true;
    if (!cornerLayoutDirty) return;
    cornerLayoutDirty=false;
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
  document.addEventListener('transitionrun',e=>{if(!['rack','rackL'].includes(e.target.id)||mat.axisMode!=='corner')return;const end=performance.now()+500;const tick=()=>{cornerLayoutDirty=true;schedule(TIER.PRESENT);if(performance.now()<end)requestAnimationFrame(tick);};tick();});
  document.addEventListener('transitionend',e=>{if(e.target.id==='rack'||e.target.id==='rackL'){cornerLayoutDirty=true;schedule(TIER.PRESENT);}});
  let exportLocked = false;
  function schedule(tier) {
    if (mod.syncing) return;                   // wave 52: a re-base writes what is already there (modSyncBases)
    if (tier > pending) pending = tier;
    /* LA8 · AN EXPORT RECORDS THE ASK, IT ARMS NOTHING.  This return used to come first, so a REBUILD asked for
       during an export (GRID, DOMAIN, SPACE, OPERATOR) was dropped: the export's finally raises only RECONSTRUCT, and
       the field went on marching the old grid under a control that showed the new one (AUDIT-F F8).  No rAF is armed
       while locked (render-exact's H9 witness); the finally's schedule() arms one frame at max(pending, RECONSTRUCT). */
    if (exportLocked) return;
    /* WAVE 54 · A HIDDEN PAGE ASKS FOR NO FRAMES.  `pending` still rises, so nothing asked for is lost — the
       resume schedules once and the next frame does all of it.  See the measurement in setPageHidden. */
    if (page.hidden) { stats.scheduled = false; return; }
    if (!rafId && !inLoop) { rafId = requestAnimationFrame(loop); stats.scheduled = true; }
  }
  /* The frame loop asks this cached service instead of reading layout geometry. IntersectionObserver accounts for
     both viewport clipping and a rack's scrollport; class/hidden mutations wake one catch-up frame on re-entry. */
  let histShown = null;                // S4: the HISTORY card's reveal (below) rides the one activity hook the rack already has
  const windowActivity = createWindowActivity({ onChange: () => { schedule(TIER.PRESENT); if (histShown) histShown(); } });
  const canPresent = (w) => windowActivity.canPresent(w);
  const canPresentTransport = () => !uiHidden && (layout.docked ? canPresent(wTr)
    : (!document.body.classList.contains('rack-hidden') || document.body.classList.contains('transport-peek')));
  const tableOf = (a) => sturm.P ? sturm.rec[a] : (space === 'p' ? getHamiltonian().momentumTableFor(BASIS[a]) : getHamiltonian().tableFor(BASIS[a]));   // W-STURMIAN: the scaled record, else the operator's
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
    if (chem && chem.on) return null;                                      // CHEMISTRY: the field reads an AO density matrix, not a mode list — packModes is skipped entirely
    if (gas && gas.on) return gas.fieldModes(t);                           // the AXIAL GAS: the box's second register
    const c = reg.at(t, cRe, cIm), ids = stateReaders().rendered.ids; modeStateT = t; modeStateVersion = reg.version;
    modeList.length = ids.length;                                        // wave 45: the same 91 records, rewritten in place (was 1–91 fresh objects per reconstruct)
    for (let i = 0; i < ids.length; i++) { const a = ids[i], m = modeRecs[i]; m.table = tableOf(a); m.re = c.re[a]; m.im = c.im[a]; modeList[i] = m; }
    return modeList;
  }
  const modeRecs = Array.from({ length: 91 }, () => ({ table: null, re: 0, im: 0 })), modeList = [];
  function refModes() {
    if (!refSnapshot) return null;
    return refSnapshot.ids.map((a) => ({ table: tableOf(a), re: refSnapshot.re[a], im: refSnapshot.im[a] }));
  }
  function applyRebuild() {
    busyWrap(null);                                                    // wave 48: a rebuild is BUSY work — synchronous, so it only shows when the frame-gap rule catches it running long
    const HH = getHamiltonian();
    if (domain.auto) domain.half = (chem && chem.on) ? chem.half : (space === 'p' ? HH.domainForP(reg.nmin()) : sturm.P ? sturmHalf() : HH.domainFor(reg.nmax(1e-3)));   // ignore a slap's 1e-4 tails
    if (field.ok) field.setSpace(space === 'p' ? HH.kernelSpace.p : HH.kernelSpace.x);
    if (field.ok && HH.radialTable) field.setRadialTable(HH.radialTable());   // QUARKONIUM: the tabulated radial rows the kernel reads
    if (field.ok) {
      field.setDomain(domain.half);
      const want = effectiveRes(); if (field.resolution !== want) field.setResolution(want);   // the governor's notch, if it stepped
    }
    mat.steps = quality.steps;
    if (refSnapshot) pendingRef = refModes();      // the reference lives on the grid: rebuild it with the grid
    stats.rebuilds++;
    ui.domainKnob.set(domain.half);
  }


  function loop(nowMs) {
    rafId = 0;
    if (page.hidden || exportLocked) { stats.scheduled = false; return; }   // wave 54: a frame that arrived after the tab went away does nothing and re-arms nothing
    inLoop = true;
    const tLoop0 = performance.now();                                 // LA1: the whole loop, timed from entry
    let fault = '';
    try {   /* LA4 · the body is deliberately NOT re-indented (one exception anywhere used to end the loop for the session: AUDIT-B FB7) */
    if (field.ok && field.setOcclusion && (occludeDirty || nowMs - occludeAt > 300)) refreshOcclusion(nowMs);   // layout is read HERE, before the writes below
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
    if (modHost) {
      const modRunning = modHost.clock.isRunning();
      if (modRunning) modSyncBases();
      if (nowMs - modWall >= MOD.step) {
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
        if (modWall) {
          const dt = Math.min(500, Math.max(1, nowMs - modWall));
          feedMs = feedMs ? feedMs + (dt - feedMs) * 0.25 : dt;
        }
        const feedHz = feedMs ? 1000 / feedMs : MOD.hz;
        /* THE ROTATION RATES INTEGRATE ON THIS TICK, from the RAW interval — never from `feedMs`,
           which is an EMA and would make the accumulated angle drift against the wall clock.  The
           250 ms ceiling is wave 105's own measurement used again: one 200 ms stall must not become
           a 1.3-radian jump in a single step. */
        const modDt = modWall ? Math.min(0.25, (nowMs - modWall) / 1000) : 0;
        modWall = nowMs;
        if (modRunning || (audioCap && audioCap.live) || rotDriving()) {
          feedAudio(feedHz);
          modHost.clock.advanceTo(now);
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
    if (!dragging && camera.moving) {                                // CAMERA clock: observer only (§12) — the law, never the state
      if (cameraStep(Math.min(0.1, Math.max(0, now - lastWall)))) tier = Math.max(tier, TIER.PRESENT);
    }
    lastWall = now;
    /* On iPad, the nested neumorphic shadow stack competes with the live WebGPU canvas even without
       backdrop blur. Keep the silhouettes and fills, and flatten only inner shadows while pixels move. */
    const tabletMotion = tablet.on && (clock.playing || dragging || camera.moving || camLevel.from ||
      (modHost && modHost.clock.isRunning()) || rotDriving());
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
      tick('field', () => { field.resize(quality.scale * (quality.auto ? quality.autoScale : 1)); field.frame({ modes, refModes: pendingRef, obs, mat, molecule: !!(molSession && molSession.molecule) }); });   // ONE owner flag: the session holds the molecule, so the session says whether the volume is molecular
      pendingRef = null;
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
    if (playedLast && !clock.playing) {                              // THE PAUSE EDGE (W125-2): the user's grid and canvas come back at once, and the window restarts
      autoQ.presented = autoQ.lastMs = autoQ.m0 = 0;                 // the play's intervals, and the edge's own transition interval, are not the still picture's
      if (gov.drop) { gov.drop = 0; gov.changes++; schedule(TIER.REBUILD); }
      if (quality.auto && quality.autoScale < 1) { quality.autoScale = 1; autoQ.changes++; schedule(TIER.PRESENT); if (ui.scaleRo) ui.scaleRo.set((100 * quality.scale).toFixed(0) + '%', ''); }   // the still picture repaints at full size on the next frame (REFUTE-B: nothing else would)
    }
    playedLast = clock.playing;
    perf.counts.frames++;
    const cpuTick = !clock.playing || (perf.counts.frames % perf.cpuEvery) === 0;   // the CPU windows' cadence
    if (cpuTick) {
      /* modesAt() already evolved the same register into these scratch arrays on a reconstruction frame. Reuse it;
         in 120 Hz mode the other three frames need no CPU-reader coefficient vector at all. */
      const c = modeStateT === clock.t && modeStateVersion === reg.version ? modeState : reg.at(clock.t, cRe, cIm);
      perf.counts.cpu++;
      if (reg.version !== govVersion) { govVersion = reg.version; if (gov.parked.size) { const np = reg.populated().length; for (const [name, p] of [...gov.parked.entries()]) if (np < p.pop) unpark(name, READERS[name]); } }   // an edit that SHRANK the state: a parked reader may have got cheap — re-measured (one that grew stays parked: the landing frame measured 449 ms with the SLICE re-measuring on 91 labels)
      if (stageText) { stageTextTick(); stageText.atomLabels(chem && chem.on ? chem.preset() : '', obs, domain.half); }   // the STAGE TEXT follows the register; the ATOM LABELS the camera (stage-text.js: compares only)
      if (may('spectrum', wSpec)) tick('spectrum', () => spectrum.update(c, clock.t));
      if (may('shadow', wSh)) tick('shadow', () => { shadowView.update(c, clock.t, stateReaders().populated, spectrum.selected); if (ui.shadowDetails && !ui.shadowDetails.hidden) shadowFoot.update(reg, c, clock.t, stateReaders().populated); });
      if (may('orbit', wOrb)) tick('orbit', () => { orbit.update(obs); keplerRowSync(); });   // the Kepler knobs' own liveness rides the tick this window already pays for, keyed on reg.version like every other reader
    }
    const overlayDomain = space === 'x' && getHamiltonian().hydrogenTheorems && !sturm.P && !(chem && chem.on);
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

      const keplerVisible = bow || canPresent(wOrb);
      if (keplerVisible && (kepler.on || kdrag || keplerDirty || bow) && (bow || may('kepler'))) tick('kepler', () => {
        kepler.update(reg, clock.t, obs, domain.half); keplerDirty = !!kepler.on;
        if (!kepler.on && !bow) kepler.suspend();
      });
      else if (!keplerVisible) kepler.suspend();
    } else {
      vortex.suspend(); particles.suspend(clock.t);
      /* The impulse remains a stage gesture when a molecule, momentum space or a
         Sturmian owns the field.  Those modes deliberately skip the Kepler redraw above, so clear
         its transparent canvas explicitly before bowFrame() paints the next arrow. */
      if (bow) kepler.clear(); else kepler.suspend();
    }

    kepler.bowFrame();
    chem.setActive(canPresent(wChem));
    /* ONE PRODUCT A FRAME, AND THE ORDER OF THESE TWO CALLS DECIDES NOTHING.  Both windows hand their product to
       molSession, which selects a model by RANK (the real-time run, then the register, then the card) and drops
       what the unselected ones offer — where this used to be "whoever writes the matrix last owns the frame". */
    molSession.tick();
    if (chem.on && powered(wChem)) chem.update(clock.t);   // the RT pump: one outstanding worker request, then an upload — no maths on this thread, so no tick()
    register.setActive(canPresent(wOrbs));
    if ((orbitals.on || states.on) && powered(wOrbs)) register.update(clock.t);
    if (flowTracers) {
      /* the source belongs to the model that is PLAYING: the STATES register, the ORBITAL packet, or CHEMISTRY's run */
      const playing = molSession ? molSession.selected : null;
      const src = playing === 'states' ? (states.flowOn ? states.flowSource() : null) : playing === 'orbital-packet' ? orbitals.flowSource() : (playing === 'tdhf' || playing === 'ground') && chem ? chem.flowSource() : null;
      if (src && src.ready) {
        if (!flowTracers.on || flowEpoch !== src) { flowTracers.setOn(true); flowTracers.setTrail(48); flowTracers.setCap(2.5); flowTracers.seedFrom(src, 220, Number.isFinite(src.time) ? src.time : clock.t, chem.half * 0.75); flowEpoch = src; }
        tick('particles', () => { flowTracers.advanceFrom(src, Number.isFinite(src.time) ? src.time : clock.t, chem.half * 0.75); flowTracers.draw(obs, domain.half); });
      } else if (flowTracers.on) { flowTracers.setOn(false); flowEpoch = null; }
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
      if (may('calculus', wCalc)) tick('calculus', () => { if (calculus && !sturm.P && !(chem && chem.on)) calculus.update(reg, clock.t); });
      if (canPresent(wSh)) ui.hc.set(reg.energy().toFixed(5));
      if (canPresent(wSpec) && sturm.P && ui.sturmRo && sturm.roVersion !== reg.version) paintSturmRo();   // W-STURMIAN: the scale's readout follows the state
      if (canPresent(wSpec) && gas && gas.on && ui.gasRo && (perf.counts.cpu % 6) === 0) gasReadout(clock.t);   // K5w: the maths worker's stats(), painted when it lands
    }
    if (canPresentTransport()) transport.update();
    /* WAVE 52: the strip, the meters and the beat readout, at 30 Hz (modview throttles itself) — and
       the EXPAND lamp, which is the one thing that must be painted whether the window is open or not. */
    if (modHost) {
      if (!uiHidden && modView && modView.isOpen) modView.paint(false);
      if (!uiHidden && tl && tl.isOpen()) tl.paintHead();   // 0.5.0 C7b: the playhead paints from the one present (TIMELINE.md: no tick of its own)
      const on = modHost.clock.isRunning();
      if (on !== modExpOn) { modExpOn = on; if (ui.modExp) ui.modExp.classList.toggle('live', on); }
    }
    if (now - winStart >= 1) {
      const w = now - winStart; stats.fps = winFrames / w; stats.reconPerSec = winRecon / w; stats.stepsPerSec = winSteps / w;
      winStart = now; winFrames = winRecon = winSteps = 0;
    }
    inLoop = false;
    loopTail(false);                                                  // LA4: the re-arm, one function for this tail and the fault's
    if (cpuTick && canPresent(wMet) && (!clock.playing || nowMs - metersWall >= 100)) { metersWall = nowMs; tick('meters', () => { meters.update(meterSnapshot()); paintGovernor(); }); }   // wave 45: 10 Hz while playing (fifteen strings and a snapshot per call), every frame when paused
    /* 0.4.0 S0 · wave 137: the STATUS TAGS, the Stark/Zeeman and masked/truncated warnings and the canvas's sentence tick on
       their OWN ≤ 10 Hz clock — they rode METERS' tick and went stale whenever METERS was closed.  Gated on the tags being
       shown or the canvas being read (focused); the governor's readout stays with METERS. */
    if (cpuTick && nowMs - badgesWall >= 100 && (!document.body.classList.contains('no-badges') || document.activeElement === dom.canvas)) { badgesWall = nowMs; tick('badges', () => badges.update()); }
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
    if (clock.playing || camera.moving || keyOrbitMoving() || camLevel.from || (pending && !faultRepeat) || (audioCap && audioCap.live) || (modHost && modHost.clock.isRunning()) || rotDriving()) { rafId = requestAnimationFrame(loop); stats.scheduled = true; }   // camera key easing schedules only until its last queued increment lands
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

  /* ── state mutations: ONE road (finger, key, test, restore all come here) ─ */
  let lastNmax = 1;
  function touchState() {
    const nm = reg.nmax();
    if (domain.auto && nm !== lastNmax) { lastNmax = nm; schedule(TIER.REBUILD); }
    else schedule(TIER.RECONSTRUCT);
  }
  /** a preset into the atom register.  `opt.hand` is the PRESS (the STATE select and RELOAD): only a hand's preset is
   *  announced on the stage (0.4.0 S3 · F2) — the boot, a URL preset, a test, a restore or an undo say nothing */
  function loadPreset(id, opt) {
    const p = PRESET_BY_ID.get(id); if (!p) return false;
    if (opt && opt.hand && stageText) stageText.announce(p.label.replace(/[\\`*_{}[\]()#+\-.!|$<>~]/g, '\\$&'));   // the label as text: markdown's specials escaped
    for (const key of Object.keys(rotRate)) setRotationRate(key, 0);
    reg.load(p); clock.reset(); lastNmax = -1;
    clock.window = p.visual.window;
    if (applyVisuals) { clock.setRate(paceRate(p.visual.rate)); mat.view = VIEW[p.visual.view]; ui.viewSeg.set(p.visual.view); ui.rateKnob.set(clock.rate); }   // wave 57: a rate NOBODY CHOSE is paced by the motion preference
    ui.presetSel.value = id; ui.presetNote.textContent = p.note;
    setReference();
    spectrum.select(-1);
    shadowView.clearTrail();
    ui.scrub.set(0);
    schedule(TIER.REBUILD);
    return true;
  }
  function setReference() {
    const c = reg.at(clock.t);
    refSnapshot = { re: Float64Array.from(c.re), im: Float64Array.from(c.im), ids: reg.populated(), t: clock.t, digest: reg.digest() };
    pendingRef = refModes(); schedule(TIER.PRESENT);
  }
  const api = {
    reg,
    select(a) { spectrum.select(a); schedule(TIER.PRESENT); },
    toggleMode(a) {
      if (reg.population(a) > 0) { reg.set(a, 0, 0, clock.t); }
      else { const pop = reg.populated(); let amp = 1; if (pop.length) { amp = 0; for (const b of pop) amp += Math.sqrt(reg.population(b)); amp /= pop.length; } reg.set(a, amp, 0, clock.t); }
      touchState();
    },
    /** 2026-10 · the PAINT stroke's batch (lab/paint-stroke.js on SPECTRUM's grid): add ⇒ every listed state not populated
     *  joins at the mean |c| of those that were (toggleMode's rule, read ONCE before the stroke adds), phase 0; remove ⇒
     *  each populated one goes to c = 0.  One touchState() however many states it covers. */
    paintModes(list, add) {
      let n = 0, amp = 1;
      if (add) { const pop = reg.populated(); if (pop.length) { amp = 0; for (const b of pop) amp += Math.sqrt(reg.population(b)); amp /= pop.length; } }
      for (const a of list) {
        if (!(a >= 0) || a >= BASIS.length) continue;
        const on = reg.population(a) > 0;
        if (add && !on) { reg.set(a, amp, 0, clock.t); n++; } else if (!add && on) { reg.set(a, 0, 0, clock.t); n++; }
      }
      if (n) touchState();
      return n;
    },
    setPopulation(a, v) {
      const n = reg.norm() || 1; const c = reg.coeffAt(a, clock.t); const ph = Math.atan2(c.im, c.re);
      reg.setPolar(a, Math.sqrt(Math.max(0, v)) * n, ph, clock.t); touchState();
    },
    clear() { reg.clear(); refSnapshot = null; touchState(); },
    normalize() { normalizeNow(); },
    rateOf(a) { return rates[a]; },
    setRate(a, r) {
      if (sturm.P) return false;                                     // W-STURMIAN: RATE is a diagonal-phase feature — off under the scale
      const c = reg.coeffAt(a, clock.t); rates[a] = r; reg.setEnergies(energyOf); reg.set(a, c.re, c.im, clock.t); touchState();   // re-anchored: c(t) is continuous, only its speed changes
      const toy = rates.some((v) => Math.abs(v - 1) > 1e-9);
      wSpec.setStatus(toy ? 'CUSTOM RATES · H RESCALED' : getHamiltonian().label, toy ? 'warn' : (getHamiltonian().id === 'hydrogen' ? '' : 'live'));
    },
    addPhase(a, d) { const c = reg.coeffAt(a, clock.t); reg.setPolar(a, Math.hypot(c.re, c.im), Math.atan2(c.im, c.re) + d, clock.t); touchState(); },
    setPhase(a, ph) { const c = reg.coeffAt(a, clock.t); reg.setPolar(a, Math.hypot(c.re, c.im), ph, clock.t); touchState(); },
    toggleMute(a) { reg.setMute(a, !reg.muted[a]); touchState(); },
    toggleSolo(a) { reg.setSolo(a, !reg.solo[a]); touchState(); },
    remove(a) { reg.set(a, 0, 0, clock.t); reg.setMute(a, false); reg.setSolo(a, false); touchState(); }
  };

  /* ── windows ──────────────────────────────────────────────────────────── */
  const ui = {};
  /* THE CAMERA LAW (wave 50) and the observer's pose — CAM, the camera, the two modes, orbitBy, the key orbit, ZOOM / FOV /
     RESET VIEW: lab/camera-law.js (wave 130 seam 11).  Built here, before the first window that reads it. */
  const { camera, camTravel, camLevel, syncFreeAngles, orbitBy, keyOrbitMoving, queueKeyOrbit, stepKeyOrbit, setCamMode,
    camLevelStep, cameraStep, setDist, setFov, syncCamUI, resetView, zoomAt, panBy, port: cameraPort } = createCameraLaw({ obs, present: () => schedule(TIER.PRESENT),
    modHand, resetWall: () => { lastWall = performance.now() / 1000; } });
  const rack = dom.rack;


  const wObs = device({ id: 'observer', eyebrow: 'WAVE', status: '' });
  const wPal = device({ id: 'palette', eyebrow: 'PALETTE', status: '' });
  const wCam = device({ id: 'camera', eyebrow: 'CAMERA', status: '' });
  let capApi = null;                      // wave 58: the CAPTURE group's handle, published out of the block that builds it (LW reads it)
  let camKnobs = {};                      // 0.5.0 C1: the CAMERA panel's dials by modulation id, published the same way (the observer.* defs read it)
  let exporter3d = null;                  // wave 134: FILE › EXPORT SHAPE / GRID's module instance, published the same way (LW.shapeExport reads it)
  const wClip = device({ id: 'clip', eyebrow: 'CLIP', status: '' });   // 0.4.0 S3 (R-W3): CLIP, once SLICE / CLIP — the id stays
  {


    const gSpace = group(wObs.body, 'SPACE');
    const gDraw = group(wObs.body, 'DRAW');
    {
      const r0 = el('div', 'row', gSpace);
      ui.spaceSeg = seg({ label: 'the same state, two exact pictures', value: 'x', options: [
        { id: 'x', label: 'POSITION ψ(x)', title: 'the wavefunction in space' },
        { id: 'p', label: 'MOMENTUM φ(p)', title: 'Momentum-space view of the current state' }],
        onChange: (v) => { space = v; schedule(TIER.REBUILD); } });
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
    ui.molFormulaSw = sw({ label: 'STAGE TEXT', value: true, title: 'Write what is playing on the stage — the MOLECULES formula or the SPECTRUM states, a preset\'s name as it is pressed, the element of each nucleus — and caption a picture or a recording with it', onChange: (v) => { document.body.classList.toggle('no-mol-formula', !v); if (stageText) stageText.setOn(v); schedule(TIER.PRESENT); saveSettings(); } }); ri.appendChild(ui.molFormulaSw.root);
    ui.molFormulaK = knob({ label: 'SIZE', min: 0.5, max: 3, value: 1, fmt: (v) => Math.round(v * 100) + '%', title: 'The STAGE TEXT\'s size: 100% is the notebook\'s — the formula its title (34 px), an announcement its heading, an atom label its body',
      onInput: (v) => { molFormulaScale = v; if (stageText) stageText.setScale(v); schedule(TIER.PRESENT); }, onChange: () => saveSettings() }); ri.appendChild(ui.molFormulaK.root);
    ri.appendChild(trig({ label: 'RESET LAYOUT', title: 'Restore the default window layout', onFire: () => layout.resetLayout() }).root);
    ri.appendChild(trig({ label: 'FORGET', title: 'Clear saved interface settings and reload', onFire: () => { settingsStore.remove(); look.prefs.forget(); modStore.write({ modArm: undefined, modCadence: undefined }); location.reload(); } }).root);


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
    ri.appendChild(trig({ label: 'SHOW THE WARNING AGAIN', title: 'Show the photosensitivity notice now and on the next load', onFire: () => { if (__LW_hooks.warning) { __LW_hooks.warning.reset(); __LW_hooks.warning.show(); } } }).root);
    el('div', 'note', gi).innerHTML = '<b>Settings.</b> Appearance and performance choices are stored in this browser. Window power stops its reader; collapse changes layout; close removes the window until reopened from + or WINDOW.';
    const gt = group(ui.set.body, 'THEME  ·  SURFACE');
    const rt = el('div', 'row tight', gt);
    const THEMES = { dark: { bg: [0.028, 0.038, 0.058], invert: false }, light: { bg: [0.93, 0.95, 0.975], invert: true } };


    /* THE THEME'S ENGINE SIDE (0.5.0 C2): the kit's theme row writes body[data-theme] (SYSTEM follows the OS by itself) and its
       `run` calls this once per resolved change.  WAVE 56: the browser's own chrome follows the theme — <meta name="theme-color">
       overrides the manifest wherever it is honoured; #eef1f6 is skin.css's `body[data-theme="light"] #stage`, #070a0f lab.css's
       unconditional ground.  Wave 48: the GPU chrome (the cube frame, the three axes) cannot read a CSS token — it reads lightUI. */
    __LW_hooks.theme = (theme) => {
      const tc = document.getElementById('themeColor');
      if (tc) tc.setAttribute('content', theme === 'light' ? '#eef1f6' : '#070a0f');
      mat.bg = THEMES[theme].bg.slice();
      if (__LW_hooks.restage) __LW_hooks.restage();
      mat.lightUI = theme === 'light';
      if (__LW_hooks.themeChanged) __LW_hooks.themeChanged(theme);
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
      stageMix = Math.max(0, Math.min(1, Number.isFinite(+v) ? +v : 0));
      const a = themeGround(), b = mat.stageCustom;
      mat.bg = stageFollow ? a.slice() : [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * stageMix);
      paintMarks(); schedule(TIER.PRESENT);
    }
    __LW_hooks.restage = () => setStageMix(stageMix);
    function setStageColour(colour) {
      if (Array.isArray(colour) && colour.length >= 3) mat.stageCustom = colour.slice(0, 3).map((v) => Math.max(0, Math.min(1, +v || 0)));
      if (ui.stageColour) ui.stageColour.value = rgbToHex(mat.stageCustom);
      setStageMix(stageMix);
    }
    function setStageFollow(on) {
      stageFollow = !!on;
      if (ui.stageFollow) { ui.stageFollow.classList.toggle('on', stageFollow); ui.stageFollow.setAttribute('aria-pressed', String(stageFollow)); }
      setStageMix(stageMix);
    }
    __LW_hooks.setStageColour = setStageColour;
    __LW_hooks.setStageFollow = setStageFollow;
    ui.stageK = knob({ label: 'STAGE', min: 0, max: 1, value: 0.04, fmt: (v) => (v * 100).toFixed(0) + '%', onInput: (v) => { if (!modHand('material.stage', v)) setStageMix(v); } });
    __LW_hooks.setStage = (v) => { const x = Math.max(0, Math.min(1, +v || 0)); ui.stageK.set(x); setStageMix(x); return x; };
    { const seat = el('div', 'stage-seat', rt); ui.stageSeat = { root: seat };
      ui.stageColour = el('input', 'pal-color stage-colour', seat); ui.stageColour.type = 'color'; ui.stageColour.title = 'Stage colour at 100%'; ui.stageColour.setAttribute('aria-label', 'stage colour');
      ui.stageColour.addEventListener('input', () => { setStageColour(hexToRgb(ui.stageColour.value)); setStageFollow(false); });
      ui.stageFollow = el('button', 'trig stage-follow', seat, 'FOLLOW THEME'); ui.stageFollow.type = 'button'; ui.stageFollow.title = 'Ignore the chosen stage colour';
      ui.stageFollow.addEventListener('click', () => setStageFollow(!stageFollow));
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
    __LW_hooks.setGamut = setGamut;
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
    __LW_hooks.setTheme = (t) => look.set({ theme: t });

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
    palette = { get stops() { return rv.stops(); }, get selected() { return rv.selected(); }, get on() { return palSw.get(); }, get id() { return palId; },
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
    camKnobs = Object.fromEntries(camView.targets().map((t) => [t.id, t.widget]));
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
        exportLocked = true; if (rafId) cancelAnimationFrame(rafId); rafId = 0; stats.scheduled = false;
        return;
      }
      const b = filmBefore; filmBefore = null;
      if (b) { if (reg.version !== b.version) reg.restore(b.state); Object.assign(mat, b.mat); Object.assign(obs, b.obs); Object.assign(rotRate, b.rot); }   // a film that moved no coefficient leaves the register (and the loop plan made on it) as it was
      exportLocked = false; modWall = 0; lastWall = performance.now() / 1000;
      schedule(TIER.RECONSTRUCT);
    }
    const film = () => exact || (exact = createFilm(LW, { canvas: dom.canvas, energies: periodEnergies, canvasCap: 16384, host: () => modHost, hold: filmHold,
      road: { pending: () => ({ caption: stageCaption(), spin: camera.ambient && obs.mode !== 'free' ? camera.ambient : 0, yaw0: obs.yaw }), step: rotStep, rotating: rotDriving,
        plan: (o) => capture().planLoop(o) } }));   // the rack's own for the film's three schedules (take) and the card's road
    const capture = () => cap || (cap = createCapture(LW, { canvas: dom.canvas, canvasCap: 16384, energies: periodEnergies, caption: () => stageCaption() }));   // wave 58: capture reads the SAME energies periodNow() does, never the labels' ⟨H⟩; 0.4.0 S3: and draws the STAGE TEXT's caption
    const take = async (kind, o, keep) => {
      if (facadeRun) { facadeRun.stop(); return null; }
      facadeRun = film().take(kind, { fps: 30, seconds: 6, scale: 2, drive: modArm, ...o });
      try { const r = await facadeRun.done; if (r && r.ok && keep) film().save(r); return r; }
      catch (e) { return { ok: false, error: String(e && e.message || e) }; } finally { facadeRun = null; }
    };
    capApi = { get exact() { return film(); }, get capture() { return capture(); }, plan: () => capture().planLoop({ fps: 30, seconds: 6 }),
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

  /* OPTIMIZATION 2026-09-24 · N1 · STATE's CLEAR, NAMED.  The menubar's "CLEAR the register" pressed the FIRST `.trig`
     reading CLEAR in document order — SPECTRUM's head row on a first visit (c ↦ 0, no clock reset), the undo ring's own
     CLEAR once HISTORY floated (AUDIT-E FE1).  The register's CLEAR is this one function now, and both the STATE trigger
     and the menu row call it (the lead's ruling: STATE's CLEAR; Josh may reverse it). */
  function clearRegister() { reg.clear(); refSnapshot = null; clock.reset(); if (ui.scrub) ui.scrub.set(0); shadowView.clearTrail(); touchState(); }
  // STATE — preparation. Everything here changes c.
  const wState = device({ id: 'state', eyebrow: 'STATE', status: '' });
  rack.appendChild(wState.root);
  {
    const r1 = wState.row();
    ui.presetSel = el('select', 'sel', r1); ui.presetSel.setAttribute('aria-label', 'preset superposition');
    for (const p of PRESETS) { const o = el('option', '', ui.presetSel, p.label); o.value = p.id; }
    ui.presetSel.addEventListener('change', () => loadPreset(ui.presetSel.value, { hand: true }));
    ui.presetSel.style.flex = '1 1 160px';


    r1.appendChild(trig({ label: 'RELOAD', title: 'Reload the selected preset and reset time', onFire: () => loadPreset(ui.presetSel.value, { hand: true }) }).root);
    r1.appendChild(sw({ label: 'PRESET VISUALS', value: true, onChange: (v) => { applyVisuals = v; } }).root);
    ui.presetNote = el('div', 'note', wState.body, '');
    const r2 = wState.row();
    r2.appendChild(trig({ label: 'NORMALIZE', title: 'Normalize the state coefficients', onFire: () => normalizeNow() }).root);


    r2.appendChild(trig({ label: 'CLEAR', onFire: () => clearRegister() }).root);
    r2.appendChild(knob({ label: 'ROTATE z', min: 0, max: 2 * Math.PI, value: 0, wrap: true, cls: 'rot', fmt: () => 'D(R_z)', onDelta: (d) => { reg.rotateZ(d); touchState(); } }).root);
    /* THE JOG WHEEL ABOVE AND THE DIAL BELOW ARE NOT TWO TRUTHS.  The wheel is a DELTA — one shove,
       applied and forgotten, holding nothing (mir/kit.js knob, `onDelta`).  This is a RATE, in rad/s, and it is a
       real stored number: rotRate.z IS what the registry reads and writes, so `get` cannot lie and
       modSyncBases cannot fight it.  Nothing anywhere accumulates the angle the two of them make. */
    ui.rotZRate = knob({ label: 'SPIN z', min: -ROT_LIMIT.z, max: ROT_LIMIT.z, value: 0, cls: 'rot',
      title: 'Continuous state rotation about z. Double-click to stop.',
      fmt: (v) => v === 0 ? '· still ·' : v.toFixed(3) + ' rad/s',
      onInput: (v) => { if (modHand('state.rot.z', v)) return; setRotationRate('z', v); } });
    r2.appendChild(ui.rotZRate.root);
    {
      const gab = group(wState.body, 'A / B  ·  TRANSITION  (Rabi)');
      const rab = el('div', 'row tight', gab);
      let abA = null, abB = null, abOmega = 0.05;
      const snap = () => ({ re: Float64Array.from(reg.re0), im: Float64Array.from(reg.im0) });
      const recall = (S) => { if (!S) return; if (reg.transition) { reg.clearTransition(clock.t); ui.abSw.set(false); } reg.re0.set(S.re); reg.im0.set(S.im); reg.version++; touchState(); abStatus(); };
      ui.abRo = readout({ label: 'A / B', value: '—  /  —', sub: 'store two states, then TRANSITION plays A → B → A at Ω' });
      rab.appendChild(trig({ label: 'STORE A', title: 'keep the register as it is now as state A', onFire: () => { abA = snap(); abStatus(); hNote(); } }).root);
      rab.appendChild(trig({ label: 'STORE B', title: 'keep the register as it is now as state B', onFire: () => { abB = snap(); abStatus(); hNote(); } }).root);
      rab.appendChild(trig({ label: 'A', title: 'recall state A', onFire: () => recall(abA) }).root);
      rab.appendChild(trig({ label: 'B', title: 'recall state B', onFire: () => recall(abB) }).root);
      const rab2 = el('div', 'row tight', gab);
      ui.abSw = sw({ label: 'TRANSITION', value: false, title: 'play the Rabi mix cos(Ω(t−t₀)/2)·A(t) + sin(Ω(t−t₀)/2)·B(t)', onChange: (v) => {
        if (v && sturm.P) { ui.abSw.set(false); ui.abRo.set('off under STURMIAN', 'warn'); ui.abRo.setSub('A / B TRANSITION is a diagonal-phase feature (two exact diagonal evolutions mixed): switch SCALE back to HYDROGEN'); return; }
        if (v) { if (!abA || !abB) { ui.abSw.set(false); ui.abRo.set('store A and B first', 'warn'); return; } reg.setTransition(abA, abB, abOmega, clock.t); if (!clock.playing) { clock.play(performance.now() / 1000); schedule(TIER.EVOLVE); } }
        else if (reg.transition) reg.clearTransition(clock.t);
        touchState(); abStatus();
      } });
      rab2.appendChild(ui.abSw.root);
      ui.abOmega = knob({ label: 'Ω  RABI', min: 0.005, max: 1, value: 0.05, log: true, fmt: (v) => v.toFixed(3), onInput: (v) => { if (reg.transition) { const th = reg.mixAngle(clock.t); reg.transition.omega = v; reg.transition.t0 = clock.t - 2 * th / v; } abOmega = v; } });
      rab2.appendChild(ui.abOmega.root);
      rab2.appendChild(ui.abRo.root);
      /* THE PROJECT'S ROAD (Josh, 2026-09-10: "state transitions don't keep"): both stores, Ω and whether the
         transition is running — plain arrays in the file, typed arrays in the block. */
      ui.ab = {
        get: () => ({ a: abA ? { re: Array.from(abA.re), im: Array.from(abA.im) } : null, b: abB ? { re: Array.from(abB.re), im: Array.from(abB.im) } : null, omega: abOmega, on: !!reg.transition }),
        set(o) { if (!o) return; const take = (S) => (S && Array.isArray(S.re) && S.re.length === 91 && Array.isArray(S.im)) ? { re: Float64Array.from(S.re), im: Float64Array.from(S.im) } : null;
          abA = take(o.a); abB = take(o.b); if (Number.isFinite(o.omega)) { abOmega = Math.max(0.005, Math.min(1, o.omega)); if (ui.abOmega) ui.abOmega.set(abOmega); }
          if (reg.transition) reg.clearTransition(clock.t);
          if (o.on && abA && abB && !sturm.P) { reg.setTransition(abA, abB, abOmega, clock.t); ui.abSw.set(true); } else ui.abSw.set(false);
          abStatus(); }
      };
      function abStatus() {
        const count = (S) => S ? S.re.reduce((k, v, i) => k + ((v || S.im[i]) ? 1 : 0), 0) : 0, nA = count(abA), nB = count(abB);
        let ov = 0; if (abA && abB) { let r = 0, im = 0; for (let a = 0; a < 91; a++) { r += abA.re[a] * abB.re[a] + abA.im[a] * abB.im[a]; im += abA.re[a] * abB.im[a] - abA.im[a] * abB.re[a]; } ov = Math.hypot(r, im); }
        const exact = nA === 1 && nB === 1 && ov < 1e-9;
        ui.abRo.set((abA ? nA + (nA === 1 ? ' mode' : ' modes') : '—') + '  /  ' + (abB ? nB + (nB === 1 ? ' mode' : ' modes') : '—'), reg.transition ? (exact ? 'ok' : 'warn') : '');
        ui.abRo.setSub(reg.transition ? (exact ? 'two-level Rabi drive · |⟨A|B⟩| = ' + ov.toFixed(3) : 'composite-state envelope · |⟨A|B⟩| = ' + ov.toFixed(3)) : 'store two states, then TRANSITION plays A → B → A at Ω');
      }
      __LW_hooks.ab = { get A() { return abA; }, get B() { return abB; }, storeA() { abA = snap(); abStatus(); hNote(); }, storeB() { abB = snap(); abStatus(); hNote(); }, setStores(A, B) { abA = A ? { re: Float64Array.from(A.re), im: Float64Array.from(A.im) } : null; abB = B ? { re: Float64Array.from(B.re), im: Float64Array.from(B.im) } : null; abStatus(); }, recallA() { recall(abA); }, recallB() { recall(abB); }, set(v) { if (v && sturm.P) return false; ui.abSw.set(v); if (v) { if (!abA || !abB) return false; reg.setTransition(abA, abB, abOmega, clock.t); } else if (reg.transition) reg.clearTransition(clock.t); touchState(); abStatus(); return true; }, get on() { return !!reg.transition; }, get status() { return ui.abRo.root.textContent; },
        /* WAVE 106 · Ω REACHES THE DEFS THROUGH HERE, and it has to.  `abOmega` is block-local (it is
           `let` a few lines up) and the MIR `defs` array is far outside this block, so a target could
           not see it.  Worse, a setter that wrote only `reg.transition.omega` would leave `abOmega`
           stale and the NEXT `setTransition` would start the mix at the old rate — two truths for one
           number.  This writes both, and re-solves t0 exactly as the knob does so the mix angle is
           CONTINUOUS across a change: theta = Omega*(t - t0)/2, so holding theta while Omega moves
           means t0 = t - 2*theta/Omega.  A modulator sweeping Omega therefore bends the rate without
           ever jumping the phase. */
        get omega() { return abOmega; },
        setOmega(v) { const w = Math.max(0.005, Math.min(1, +v || 0.05));
          if (reg.transition) { const th = reg.mixAngle(clock.t); reg.transition.omega = w; reg.transition.t0 = clock.t - 2 * th / w; }
          abOmega = w; return w; } };
      el('div', 'note', gab).innerHTML = '<b>A / B.</b> STORE A and STORE B capture two states. TRANSITION mixes them at Ω; composite states use the same envelope as an illustrative model. Turning the transition off keeps the current mix.';
    }
    ui.kzKnob = knob({ label: 'STARK K_z', min: 0, max: 2 * Math.PI, value: 0, wrap: true, cls: 'rot', fmt: () => 'e^{−iθK_z}', onDelta: (d) => { reg.rotateK(d); touchState(); } });
    r2.appendChild(ui.kzKnob.root);
    ui.defKnob = knob({ label: 'DEFECT L²', min: 0, max: 2 * Math.PI, value: 0, wrap: true, cls: 'rot', fmt: () => 'e^{iαL²}', onDelta: (d) => { reg.defectWait(d); touchState(); } });
    r2.appendChild(ui.defKnob.root);
    /* THE TWO DEFLECTION RATES.  Both setters CLAMP TO ZERO under STURMIAN rather than trusting the
       disable, because a modulated base survives a setDisabled(): the dial would sit dead while an
       LFO went on writing behind it.  A guard in rotStep alone would be worse — the dial would then
       read a rate that does nothing, and a knob that does not follow the value it owns is a knob
       that lies.  So: clamped here, zeroed and disabled in applySturmian, and ignored in rotStep. */
    ui.kzRate = knob({ label: 'SPIN K_z', min: -ROT_LIMIT.kz, max: ROT_LIMIT.kz, value: 0, cls: 'rot',
      title: 'Continuous Stark rotation. Double-click to stop.',
      fmt: (v) => v === 0 ? '· still ·' : v.toFixed(3) + ' rad/s',
      onInput: (v) => { const w = sturm.P ? 0 : v; if (w !== v) ui.kzRate.set(w); if (modHand('state.stark.kz', w)) return; setRotationRate('kz', w); } });
    r2.appendChild(ui.kzRate.root);
    ui.defRate = knob({ label: 'SPIN L²', min: -ROT_LIMIT.def, max: ROT_LIMIT.def, value: 0, cls: 'rot',
      title: 'Continuous l-dependent phase. Double-click to stop.',
      fmt: (v) => v === 0 ? '· still ·' : v.toFixed(3) + ' rad/s',
      onInput: (v) => { const w = sturm.P ? 0 : v; if (w !== v) ui.defRate.set(w); if (modHand('state.defect.l2', w)) return; setRotationRate('def', w); } });
    r2.appendChild(ui.defRate.root);
    el('div', 'note', wState.body).innerHTML = '<b>State transforms.</b> STATE ROTATE changes m phase. STARK ROTATE mixes l within each (n,m) shell. DEFECT WAIT adds an l-dependent phase. Camera rotation changes only the view.';


    const gK = group(wState.body, 'BOW');
    mat.bow = { gain: 1, curve: 1, limit: 3, ...(mat.bow || {}) };
    const feel = el('div', 'row tight bow-feel', gK);
    ui.bowKnobs = {};
    for (const [key,label,min,max] of [['gain','PULL',.25,4],['curve','RESPONSE',.25,3],['limit','LIMIT',.1,3]]) {
      const k = knob({ label, min, max, value:mat.bow[key], fmt:v=>v.toFixed(2), title: key==='curve'?'Shape the response around linear':'Bow '+label.toLowerCase(), onInput:v=>{mat.bow[key]=v;} }); ui.bowKnobs[key]=k; feel.appendChild(k.root);
    }
    el('div','bow-hint',gK,'Ctrl + drag · release to fire');
    const rk = el('div', 'row tight', gK);
    let kickK = 0.2, kickAxis = 'z';
    rk.appendChild(knob({ label: 'STRENGTH', min: 0.01, max: 1.5, value: 0.2, log: true, fmt: (v) => v.toFixed(3) + ' a.u.', onInput: (v) => { kickK = v; } }).root);
    ui.kickAxis = seg({ label: 'ALONG', value: 'z', options: [{ id: 'x', label: 'x' }, { id: 'y', label: 'y' }, { id: 'z', label: 'z' }], onChange: (v) => { kickAxis = v; } });
    rk.appendChild(ui.kickAxis.root);
    rk.appendChild(trig({ label: 'RELEASE', title: 'Apply ψ ↦ e^{ik·x}ψ on the selected axis', onFire: () => slap(kickK, kickAxis) }).root);
    ui.dragKnob = knob({ label: 'DRAG <m>γ</m>', min: 0, max: 0.5, value: 0, fmt: (v) => v === 0 ? 'off' : v.toFixed(3), onInput: (v) => { reg.setDamping(v); touchState(); } });
    rk.appendChild(ui.dragKnob.root);
    ui.kickRo = readout({ label: 'BOW · escaped / momentum', value: '—', cls: 'two', sub: 'no impulse yet' });
    rk.appendChild(ui.kickRo.root);
    el('div', 'note', gK).innerHTML = '<b>Impulse.</b> RELEASE applies e<sup>ik·x</sup> and keeps only the part represented by n ≤ 6; ESCAPED reports the omitted norm. Ctrl-drag on the field sets direction and strength. DRAG γ damps excited amplitudes as a display model and discards the lost norm.';
    function pAlong(axis) {
      const c = reg.at(clock.t);                                  // sum over the WHOLE register: a rotation moves amplitude between m
      if (axis === 'z') return momentumZ(c.re, c.im);
      const R = AXIS_TO_Z[axis], re = Float64Array.from(c.re), im = Float64Array.from(c.im);
      rotorOnCopy(re, im, { which: 'both', axis: R.axis, angle: R.angle });
      return momentumZ(re, im);
    }
    function slap(k, axis) {
      const n0 = reg.norm2(), p0 = pAlong(axis);
      if (!reg.populated().length && getHamiltonian().id !== 'well') reg.set(0, 1, 0, clock.t);
      reg.kick(k, axis, clock.t);
      const n1 = reg.norm2(), p1 = pAlong(axis);
      const esc = n0 > 0 ? 1 - n1 / n0 : 0;
      ui.kickRo.set(`${(100 * esc).toFixed(2)}% · ${(p1 - p0).toFixed(4)}`, esc > 0.2 ? 'warn' : 'ok');
      ui.kickRo.setSub(`<m>k</m> = ${k.toFixed(3)} along ${axis} · Ehrenfest would give ${k.toFixed(3)}; the deficit is the continuum · <m>‖ψ‖</m> now ${Math.sqrt(n1).toFixed(4)}`);
      touchState();
    }
    __LW_hooks.slap = slap;

    const gF = group(wState.body, 'STATIC FIELD');
    const rf = el('div', 'row tight', gF);
    ui.bz = knob({ label: 'ZEEMAN B', min: 0, max: 0.05, value: 0, fmt: (v) => v === 0 ? 'off' : v.toFixed(4), onInput: (v) => { reg.setField({ Bz: v }); touchState(); } });
    ui.fz = knob({ label: 'STARK F', min: 0, max: 0.01, value: 0, fmt: (v) => v === 0 ? 'off' : v.toExponential(1), onInput: (v) => { if (!getHamiltonian().stark || sturm.P) { ui.fz.set(0); return; } reg.setField({ Fz: v }); touchState(); } });
    rf.appendChild(ui.bz.root); rf.appendChild(ui.fz.root);
    rf.appendChild(trig({ label: 'NO FIELD', onFire: () => { reg.setField({ Bz: 0, Fz: 0 }); ui.bz.set(0); ui.fz.set(0); touchState(); } }).root);
    ui.fieldRo = readout({ label: 'H IN FORCE', value: 'H₀ (bare Coulomb)', cls: 'two', sub: '' });
    rf.appendChild(ui.fieldRo.root);
    el('div', 'note', gF).innerHTML = '<b>Fields.</b> ZEEMAN adds an orbital m-dependent phase. STARK mixes l within each shell and omits coupling between shells; keep F well below the limit shown in the readout.';

    const r3 = wState.row();
    r3.appendChild(trig({ label: 'SAVE', title: 'Save the experiment and presentation separately', onFire: () => { save(); } }).root);
    r3.appendChild(trig({ label: 'LOAD', onFire: () => { restore(); } }).root);
    r3.appendChild(trig({ label: 'COPY JSON', onFire: () => copyJSON() }).root);
    /* WAVE 56 (board #55): the whole session as a URL.  Its seat is beside SAVE / LOAD / COPY JSON because
       that is where "this state, made portable" already lives — and the FILE menu names it too. */
    r3.appendChild(trig({ label: 'COPY LINK', title: 'Copy a link to the current state and presentation', onFire: () => copyLink() }).root);
    /* THE PLACE THE LINK SPEAKS.  A `.note` and not a hover: what a link dropped is information, and
       information reachable only by hover is unreachable on the iPad (ANTI-PATTERNS 4). */
    ui.linkNote = el('div', 'note link-note', wState.body, ''); ui.linkNote.hidden = true;
  }

  // SPECTRUM
  const wSpec = device({ id: 'spectrum', eyebrow: 'SPECTRUM', status: '' });
  rack.appendChild(wSpec.root);
  /* 0.3.3 · wave 135 · THE COPY.  SPECTRUM's ⧉ is the INFO panels' ⧉ (window-chrome.js): the same class, the same glyph,
     the same seat before the fold — the kit already styles `.dev-copy` in the power button's box and tokens (base.css)
     and stands it down on a phone (skin.css §5), where EDIT › COPY the state as LaTeX is the road.  What it copies is
     the state, not the panel's text: copyLatex() below. */
  { const util = wSpec.root.querySelector('.dev-util'), b = el('button', 'dev-copy', null, '⧉'); b.type = 'button';
    b.title = 'Copy the state as LaTeX'; b.setAttribute('aria-label', 'Copy the state as LaTeX');
    util.insertBefore(b, util.querySelector('.dev-fold')); b.addEventListener('click', (e) => { e.stopPropagation(); copyLatex(); }); }
  {
    const hamGroup = group(wSpec.body, 'HAMILTONIAN');
    const rh = el('div', 'row tight', hamGroup);
    ui.hamSeg = seg({ label: 'OPERATOR', value: 'hydrogen', options: [
      { id: 'hydrogen', label: 'HYDROGEN', title: 'E = −1/(2n²); every window is a theorem about it' },
      { id: 'qho', label: 'OSCILLATOR', title: 'Harmonic oscillator levels with spacing ħω' },
      { id: 'well', label: 'BOX', title: 'Infinite spherical well with a hard boundary' },
      { id: 'atom', label: 'ATOM', title: 'Self-consistent Xα central-field atom from H to Kr' },
      { id: 'cornell', label: 'QUARKONIUM', title: 'Solve heavy-quark levels with Numerov' }],
      onChange: (v) => { switchHamiltonian(v); if (v === 'well') enterBox(); if (v === 'atom') { wAtoms.root.hidden = false; wAtoms.root.classList.remove('closed'); } } });
    /* 0.4.0 S0 · wave 136 (audit F6): the two operators whose only editors are LEGACY windows.  ATOM opens ATOMS again (its
       element picker) by un-hiding it; QUARKONIUM's button is HIDDEN (its editor, QCD,
       left in 0.5.0 D9) — the button, not the value: an older project restoring `cornell` still sets it (set() paints any id). */
    ui.hamSeg.button('cornell').hidden = true;
    rh.appendChild(ui.hamSeg.root);
    ui.wellKnob = knob({ label: 'WELL RADIUS <m>a</m>', min: 3, max: 30, value: 10, fmt: (v) => v.toFixed(1) + ' a₀', onInput: (v) => { HAMILTONIANS.well.setRadius(v); gas.setRadius(v); hNote(); if (getHamiltonian().id === 'well') { reg.setEnergies(energyOf); wSpec.body.querySelectorAll('.sp-e[data-a]').forEach((e) => { e.textContent = `${api.energyOf(+e.dataset.a).toFixed(4)} ${api.unit()}`; }); schedule(TIER.REBUILD); } } });
    rh.appendChild(ui.wellKnob.root);
    {
      const rg = wSpec.row('tight');
      rg.appendChild(knob({ label: 'GAS  σ', min: 0.5, max: 3, value: 1.8, fmt: (v) => v.toFixed(2) + ' a₀', onInput: (v) => { gasWidth = v; } }).root);
      ui.gasBasis = seg({ label: 'GAS BASIS', value: 'reg', options: [{ id: 'reg', label: '91', title: 'the register\'s 91 labels (l ≤ 5): a packet no smaller than about a/6, launched on any axis' }, { id: 'axial', label: 'AXIAL 256', title: 'Use the larger axial box basis for narrower z packets' }], onChange: (v) => { gasAxial = v === 'axial'; if (!gasAxial) gas.off(); hNote(); schedule(TIER.RECONSTRUCT); } });
      rg.appendChild(ui.gasBasis.root);
      ui.gasSpeed = knob({ label: 'GAS  |k|', min: 0.1, max: 2.5, value: 0.8, log: true, fmt: (v) => v.toFixed(2), onInput: () => {} });
      rg.appendChild(ui.gasSpeed.root);
      rg.appendChild(trig({ label: 'LAUNCH', title: 'Launch a Gaussian packet in the box', onFire: () => {
        if (getHamiltonian().id !== 'well') { setHamiltonian('well'); switchHamiltonian('well'); if (ui.hamSeg) ui.hamSeg.set('well'); }
        const ax = keyState.axis, a = HAMILTONIANS.well.radius, d = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] }[ax], k = ui.gasSpeed.get ? ui.gasSpeed.get() : 0.8;
        launchPacket(d.map((v) => -v * a / 2), d.map((v) => v * k), gasSigma(k));
      } }).root);
      ui.gasRo = readout({ label: 'GAS  packet held by the box', value: '—', sub: 'nothing launched' });
      rg.appendChild(ui.gasRo.root);
      rg.appendChild(trig({ label: 'COHERENT BOUNCE', title: 'Launch a non-spreading oscillator packet', onFire: () => coherentBounce() }).root);
      el('div', 'note', wSpec.body).innerHTML = '<b>Coherent bounce.</b> In the oscillator, an impulse moves the ground-state packet without changing its width. In the box, the packet disperses and reflects from the wall.';
      el('div', 'note', wSpec.body).innerHTML = '<b>Gas packet.</b> LAUNCH projects a Gaussian packet into the box basis. CAPTURED reports how much fits. Ctrl-drag on the field sets its launch point, direction, and strength.';
    }
    /* WAVE 68 · `step: 1`, and it is the only knob in the lab that lacked one.  Without it an arrow
       moved 1/100 of the travel = 0.05 = a TWENTIETH of an integer, so eleven real presses produced
       TWO announced values while `aria-valuenow` walked 1.05 … 1.55 through Z values the register
       cannot hold.  A dial whose `fmt` rounds has a lattice; the travel law has to know about it. */
    ui.zKnob = knob({ label: 'Z  (ion)', min: 1, max: 6, value: 1, step: 1, fmt: (v) => 'Z = ' + Math.round(v), onInput: (v) => { setZ(Math.round(v)); if (getHamiltonian().id === 'hydrogen') switchHamiltonian('hydrogen'); } });
    rh.appendChild(ui.zKnob.root);
    ui.elemKnob = knob({ label: 'ELEMENT  Z', min: 1, max: 36, value: 10, step: 1, fmt: (v) => 'Z = ' + Math.round(v) + '  ' + ATOMS[Math.max(0, Math.min(35, Math.round(v) - 1))].symbol, onChange: (v) => setElement(Math.round(v)) });
    rh.appendChild(ui.elemKnob.root);
    {
      const rs = wSpec.row('tight');
      ui.scaleSeg = seg({ label: 'SCALE  ·  the exponent of the 91 radials  (hydrogen operator only)', value: 'hydrogen', options: [
        { id: 'hydrogen', label: 'HYDROGEN  1/n', title: 'Use standard hydrogen radial functions' },
        { id: 'sturmian', label: 'STURMIAN  λ', title: 'Use one common radial exponent λ for every label' }],
        onChange: (v) => setSturmian({ on: v === 'sturmian' }) });
      rs.appendChild(ui.scaleSeg.root);
      ui.lambdaKnob = knob({ label: 'λ  SCALE', min: 0.25, max: 3, value: 1, fmt: (v) => 'λ = ' + v.toFixed(3), onInput: (v) => { if (sturm.on) setSturmian({ lambda: v }); else sturm.lambda = Math.max(0.25, Math.min(3, v)); } });
      ui.lambdaKnob.root.title = 'Set the Sturmian exponent; Shift is finer; double-tap resets';
      ui.lambdaKnob.setDisabled(true);
      rs.appendChild(ui.lambdaKnob.root);
      ui.sturmRo = readout({ label: 'SCALE', value: 'HYDROGEN 1/n', cls: 'two', sub: 'the shipped radials · λ acts once STURMIAN is on' });
      rs.appendChild(ui.sturmRo.root);
      el('div', 'note', wSpec.body).innerHTML = '<b>Radial scale.</b> HYDROGEN uses the standard n-dependent orbitals. STURMIAN gives all labels one exponent λ and evolves them in a non-orthogonal basis. Controls that require diagonal hydrogen phases are disabled while it is active.';
    }
    el('div', 'note', wSpec.body).innerHTML = '<b>Hamiltonian.</b> Z rescales hydrogen-like ions. OSCILLATOR uses equally spaced levels; BOX uses spherical-well levels; ATOM and QUARKONIUM load numerical radial tables. Windows tied to hydrogen identities pause under other operators.';
  }
    el('div', 'note', wSpec.body).innerHTML = '<b>Atom operator.</b> Uses the selected element’s self-consistent Xα central field. Occupied shells have drawable radial functions; ° marks virtual shells with energy only. Momentum space is unavailable. See ATOMS for Δ-SCF and −ε values.';
  api.hamiltonian = () => sturm.P ? sturmSpectrum() : getHamiltonian().spectrum;          // W-STURMIAN: the eigen ladder under the scale
  /* wave 50: THE RATE WAS MISSING HERE.  The register evolves label a at energyOf(a) = H.energy(a) · rates[a]
     (`energyOf` at the top of boot(), what reg.setEnergies is given), and this — the API every reader prints from, SPECTRUM's Eh and
     the digests — returned H.energy(a) alone, so with any RATE ≠ 1 the card printed an energy the state was
     not moving with.  It is the same function now.  (Under STURMIAN the labels are not eigenstates, RATE is
     refused there, and the label's ⟨a|H|a⟩/⟨a|S|a⟩ stands.) */
  api.energyOf = (a) => sturm.P ? labelExpect(a) : energyOf(a);
  api.rateDisabled = () => !!sturm.P;
  api.rateNote = () => 'RATE is a diagonal-phase feature (a multiplier on one label\'s own E): off under STURMIAN, where the labels are not eigenstates — switch SCALE back to HYDROGEN';
  api.selectEigen = (k) => selectEigen(k);
  api.unit = () => (getHamiltonian().unit === 'hartree' ? 'Eh' : getHamiltonian().unit);
  api.labelOf = (s) => getHamiltonian().labelOf(s);
  const spectrum = createSpectrum(wSpec.body, api);
  { const kids = [...wSpec.body.children], i = kids.findIndex((k) => k.classList.contains('ladder')); const h=kids[0]; for(const k of kids.slice(1,Math.max(0,i)))h.appendChild(k); wSpec.body.appendChild(h); }
  /** NORMALIZE, and say what it did — a unit-norm state looks the same afterwards, which is why it seemed to do nothing */
  function toggleFullscreen() { const d = document; if (d.fullscreenElement) { if (d.exitFullscreen) d.exitFullscreen(); } else { const e = d.documentElement; const f = e.requestFullscreen || e.webkitRequestFullscreen; if (f) try { f.call(e); } catch (err) {} } }
  function normalizeNow() {
    const n = reg.normalize(); touchState();
    const nm = sturm.P ? '⟨c|S|c⟩^½' : '‖c‖';                                     // W-STURMIAN: the S-norm is the norm
    const msg = Math.abs(n - 1) < 5e-4 ? nm + ' was 1 already · nothing to do' : nm + ' ' + n.toFixed(4) + ' → 1';
    wState.setStatus(msg, 'live'); wSpec.setStatus(msg, 'live');
    setTimeout(() => { wState.setStatus('changes c'); wSpec.setStatus(...specStatus()); }, 1800);
  }
  /** THE COPY (0.3.3 · wave 135): the populated register at the clock's t — c(t), the mix while A/B plays — as the notebook's
   *  LaTeX in chemistry order (lab/latex-state.js), through copyDigest's one clipboard road and its `copied` flash.  SPECTRUM's
   *  status line says what went: it is where the ⧉ is.  An empty register says so and writes nothing.
   *  0.4.0 S0 · wave 136: under a MOLECULAR field owner the copy is the MOLECULE's page (moleculeLatex: the formula, RHF/basis,
   *  E, the ε ladder), never greyed — SPECTRUM only folds there now (moleculeMode), so its own list is not what the field shows. */
  let copySaid = 0;                                                  // the status restore of the last copy: a second press restarts it
  function copyLatex() {
    let text, said;
    if (chem && chem.on) {
      const row = chem && chem.on ? MOLECULE_BY_ID.get(chem.preset()) : null, sol = row ? chem.solution() : null;
      const ground = sol && sol.key === chem.preset() + '|' + chem.basis + '|' + row.charge ? sol : null;   // chemview's own solve key: never the previous molecule's ladder
      text = moleculeLatex({ molecule: row, basis: chem && chem.basis, charge: row && row.charge, ground });
      said = text ? mathPlain(row.formula) + '’s page as LaTeX' : row ? 'nothing to copy — ' + mathPlain(row.formula) + ' is still solving' : 'nothing to copy — this molecule has no page';
    } else {
      const c = reg.at(clock.t), H = getHamiltonian();
      const states = reg.populated().map((a) => ({ n: BASIS[a].n, l: BASIS[a].l, m: BASIS[a].m, re: c.re[a], im: c.im[a] }));
      text = stateLatex({ states, H }); const n = text ? text.split('\n')[0].split('$').length >> 1 : 0;
      said = text ? n + (n === 1 ? ' state' : ' states') + ' as LaTeX' : 'nothing to copy — the register is empty';
    }
    wSpec.setStatus(said, text ? 'live' : 'warn');
    clearTimeout(copySaid); copySaid = setTimeout(() => wSpec.setStatus(...specStatus()), 1800);
    return text ? layout.copyText('spectrum', text) : Promise.resolve('');
  }
  function switchHamiltonian(id) {
    if (!warmTimer && !warmIdle && !page.hidden) warmArm(120);       // LA5: the kick tables are keyed on the operator — warm the new one in idle slices
    const H = setHamiltonian(id);
    if (id !== 'well' && gas.on) { gas.off(); schedule(TIER.RECONSTRUCT); }
    reg.setEnergies(energyOf);
    if (!H.stark && reg.field.Fz !== 0) { reg.setField({ Fz: 0 }); if (ui.fz) ui.fz.set(0); }
    if (H.noMomentum && space === 'p') { space = 'x'; if (ui.spaceSeg) ui.spaceSeg.set('x'); }
    for (const w of [wOrb, wVor, wSlice, wLad]) if (w) w.root.hidden = !H.hydrogenTheorems;
    wSpec.setStatus(hamLabel(), H.id === 'hydrogen' ? '' : 'live');
    wSpec.body.querySelectorAll('.sp-e[data-a]').forEach((e) => { e.textContent = `${api.energyOf(+e.dataset.a).toFixed(4)} ${api.unit()}`; });   // wave 50: the API, so the RATE is in the number the card shows
    wSpec.body.querySelectorAll('.sp-nm[data-a]').forEach((e) => { e.textContent = H.labelOf(BASIS[+e.dataset.a]); });
    if (sturm.on) { applySturmian(); return; }                        // W-STURMIAN: re-arm (or stand down) the scale under the operator now in force
    refSnapshot = null; pendingRef = null;
    schedule(TIER.REBUILD);
  }


  const sturmLabel = () => `STURMIAN · λ ${sturm.lambda.toFixed(3)} · Z ${getZ()} · 91 labels`;
  /* the SAME sentence switchHamiltonian writes (wave 44): it used to drop the element, so an UNDO of an ELEMENT
     change or of FILL THE VALENCE left the status reading "ATOM  Xα(2/3) + Latter tail" with no atom named */
  const hamLabel = () => { const H = getHamiltonian(); return H.id === 'atom' ? H.label + '  ·  ' + H.short : H.label; };
  const specStatus = () => sturm.P ? [sturmLabel(), 'live'] : [hamLabel(), getHamiltonian().id === 'hydrogen' ? '' : 'live'];
  function setSturmian(o = {}) {
    if (o.on !== undefined) sturm.on = !!o.on;
    if (o.lambda !== undefined) sturm.lambda = Math.max(0.25, Math.min(3, +o.lambda || 1));
    applySturmian();
    return { on: sturm.on, lambda: sturm.lambda, active: !!sturm.P };
  }
  function applySturmian(keepAnchor = false) {
    const H = getHamiltonian(), want = sturm.on && H.id === 'hydrogen';
    if (want && reg.transition) { reg.clearTransition(clock.t); if (ui.abSw) ui.abSw.set(false); }   // the mix is a diagonal-phase feature: frozen as the state
    const c = keepAnchor ? null : reg.at(clock.t);                                                     // the state NOW, continuous across the change
    if (want) {
      const t0 = performance.now();
      sturm.P = createRegisterSturmian(sturm.lambda, { Z: getZ() }); sturm.rec = sturm.P.records(); sturm.buildMs = performance.now() - t0;
      if (space === 'p') { space = 'x'; if (ui.spaceSeg) ui.spaceSeg.set('x'); }                      // momentum space is not built for the scaled radials
      reg.setPropagator(sturm.P);
    } else { sturm.P = null; sturm.rec = null; reg.setPropagator(null); reg.setEnergies(energyOf); }
    if (c) reg.anchorFrom(c.re, c.im, clock.t);
    const on = !!sturm.P;
    if (ui.scaleSeg) ui.scaleSeg.set(sturm.on ? 'sturmian' : 'hydrogen');
    if (ui.lambdaKnob) { ui.lambdaKnob.set(sturm.lambda); ui.lambdaKnob.setDisabled(!on); }
    const keep = (elm, title) => { if (elm.dataset.title0 === undefined) elm.dataset.title0 = elm.title || ''; elm.title = on ? title : elm.dataset.title0; };
    if (ui.abSw) { ui.abSw.root.disabled = on; ui.abSw.root.classList.toggle('disabled', on); keep(ui.abSw.root, 'A / B TRANSITION is a diagonal-phase feature (two exact diagonal evolutions mixed): off under STURMIAN — switch SCALE back to HYDROGEN'); }
    if (ui.abOmega) ui.abOmega.setDisabled(on);
    if (ui.abRo && !on && /STURMIAN/.test(ui.abRo.root.textContent)) { ui.abRo.set('—  /  —', ''); ui.abRo.setSub('store two states, then TRANSITION plays A → B → A at Ω'); }
    if (ui.fz) { ui.fz.setDisabled(on); if (on) ui.fz.set(0); }
    /* wave 40: e^{−iθK_z} and e^{iαL²} are moves inside a COULOMB SHELL — written in a degeneracy the Sturmian
       scale does not have (its eigenvalues are variational, its shells are not n²-fold), so they stand down too */
    if (ui.kzKnob) { ui.kzKnob.setDisabled(on); keep(ui.kzKnob.root, 'STARK K_z is an SO(4) rotation inside a Coulomb shell: off under STURMIAN — switch SCALE back to HYDROGEN'); }
    if (ui.defKnob) { ui.defKnob.setDisabled(on); keep(ui.defKnob.root, 'DEFECT L² is a wait under the shell\'s l-dependent phase: off under STURMIAN — switch SCALE back to HYDROGEN'); }
    /* AND THE TWO RATES WITH THEM — the STORED number, not just the dial.  A rate left running into
       a scale change would go on turning a register the operator has no business turning, and
       switching back to HYDROGEN would find it already spun.  ROTATE z's rate is untouched: m is
       still m under the Sturmian scale, which is why its jog wheel is not disabled either. */
    if (on) { rotRate.kz = 0; rotRate.def = 0; }
    if (ui.kzRate) { ui.kzRate.setDisabled(on); if (on) ui.kzRate.set(0); keep(ui.kzRate.root, 'SPIN K_z drives an SO(4) rotation inside a Coulomb shell: off under STURMIAN — switch SCALE back to HYDROGEN'); }
    if (ui.defRate) { ui.defRate.setDisabled(on); if (on) ui.defRate.set(0); keep(ui.defRate.root, 'SPIN L² drives a wait under the shell\'s l-dependent phase: off under STURMIAN — switch SCALE back to HYDROGEN'); }
    if (ui.spaceSeg) { const b = ui.spaceSeg.button('p'); if (b) { b.disabled = on; keep(b, 'not built for the Sturmians: position space only under STURMIAN'); } }
    if (ui.spaceNote) ui.spaceNote.hidden = !on;
    for (const w of [wOrb, wVor, wSlice, wLad]) if (w) w.root.hidden = on || !H.hydrogenTheorems;
    if (wCalc) wCalc.root.hidden = on;   // theorems about hydrogen's eigenfunctions stand down
    wSpec.setStatus(...specStatus());
    wSpec.body.querySelectorAll('.sp-e[data-a]').forEach((e) => { e.textContent = `${api.energyOf(+e.dataset.a).toFixed(4)} ${api.unit()}`; });
    if (ui.sturmRo) paintSturmRo();
    refSnapshot = null; pendingRef = null; lastNmax = -1;
    touchState(); schedule(TIER.REBUILD);
  }
  /** the scale's readout: the ground eigenvalue, the occupied count, the S-norm and ⟨H⟩ of the state */
  function paintSturmRo() {
    sturm.roVersion = reg.version;
    if (!sturm.P) { ui.sturmRo.set(sturm.on ? 'STURMIAN · hydrogen operator only' : 'HYDROGEN 1/n', sturm.on ? 'warn' : ''); ui.sturmRo.setSub(sturm.on ? 'the scale acts under the HYDROGEN operator; switch the Hamiltonian back' : 'the shipped radials · λ acts once STURMIAN is on'); return; }
    const e = sturmEigen(); let occ = 0; for (const p of e.pop) if (p > 1e-6) occ++;
    ui.sturmRo.set(`λ = ${sturm.lambda.toFixed(3)} · E₀ = ${e.E[0].toFixed(5)} Eh · ${occ} occupied`, 'live');
    ui.sturmRo.setSub(`⟨c|S|c⟩ = ${e.norm.toFixed(4)} · ⟨H⟩ = ${e.energy.toFixed(5)} Eh · rank ${e.rank} · built in ${sturm.buildMs < 1 ? '< 1' : sturm.buildMs.toFixed(1)} ms · every E_k is an UPPER BOUND on level k of its (l, m)`);
  }
  /** the eigen-decomposition of the state: E_k, its population (the S-metric projection of c(t) — a constant of the motion), (l, m), the dominant n */
  function sturmEigen(t) {
    const P = sturm.P; if (!P) return null;
    const c = t === undefined ? { re: reg.re0, im: reg.im0 } : reg.at(t);
    return { E: Array.from(P.E), pop: Array.from(P.populations(c)), l: Array.from(P.lK), m: Array.from(P.mK), n: Array.from(P.nK), rank: P.rank, lambda: sturm.lambda, Z: getZ(), norm: P.norm(c), energy: P.energyOf(c) };
  }
  /** the energies THE CLOCK reads under the scale: the occupied eigenvalues (populations > 1e-6), Zeeman-shifted */
  const occupiedEigen = () => { const e = sturmEigen(), out = []; for (let k = 0; k < e.rank; k++) if (e.pop[k] > 1e-6) out.push(e.E[k] + reg.field.Bz * e.m[k] / 2); return out; };
  /* THE ENERGIES A PERIOD IS READ FROM — ONE expression, because TWO of them is how wave 58's review found a
     confident EXACT LOOP over a state with no period at all: capture.js was computing the psi period from
     reg.Ediag (the LABEL's ⟨H⟩ under a propagator) while periodNow() used the occupied eigenvalues. */
  function periodEnergies() { return sturm.P ? occupiedEigen() : reg.populated().map((a) => reg.Ediag(a)); }
  /** the ladder's descriptor under the scale (spectrum.js paints `eigen`) */
  function sturmSpectrum() {
    const e = sturmEigen(), Z = getZ();
    const eigen = e.E.map((E, k) => ({ k, E, pop: e.pop[k], n: e.n[k], label: `${'spdfgh'[e.l[k]]}${e.m[k] >= 0 ? '₊' : '₋'}${Math.abs(e.m[k])}` }));
    return { eigen, Emin: Math.min(e.E[0], -0.5 * Z * Z) * 1.02, Etop: 0, Emax: e.E[e.rank - 1], levels: [], levelKey: () => 0,
      footer: `S⁻¹H · λ ${sturm.lambda.toFixed(3)} · rank ${e.rank} · E > 0 pseudo-continuum`,
      caption: 'non-orthogonal basis: populations are projections ⟨C_k|S|c⟩ (the ladder) · a lane\'s energy is the label\'s ⟨H⟩, not an eigenvalue' };
  }
  /** load the k-th eigenvector (S-normalised, real) into the labels AT the current time: a stationary state of the scale */
  function selectEigen(k) {
    const P = sturm.P; if (!P || !(k >= 0 && k < P.rank)) return false;
    const e = P.eigenstate(k);
    reg.clear(); reg.anchorFrom(e.re, e.im, clock.t); lastNmax = -1;
    spectrum.select(-1); setReference(); shadowView.clearTrail(); touchState(); schedule(TIER.REBUILD);
    wSpec.setStatus(`eigenstate ${k} · E = ${P.E[k].toFixed(6)} Eh · ${'spdfgh'[P.lK[k]]}${P.mK[k] >= 0 ? '₊' : '₋'}${Math.abs(P.mK[k])} · stationary`, 'live');
    return true;
  }

  /** the ELEMENT knob: which atom the ATOM Hamiltonian solves (Z = 1 … 36); the register is re-read in it */
  function setElement(Z) {
    Z = Math.max(1, Math.min(36, Math.round(Z) || 1));
    busy.n++; busySync();                                              // wave 48: the atom is re-solved on a log mesh, twice, and Richardson-extrapolated — the mark says so
    let changed; try { changed = HAMILTONIANS.atom.configure(Z); } finally { busy.n = Math.max(0, busy.n - 1); busySync(); }
    if (ui.elemKnob) ui.elemKnob.set(Z);
    if (changed) { if (atomsView) atomsView.invalidate(); hNote(); if (getHamiltonian().id === 'atom') switchHamiltonian('atom'); else schedule(TIER.PRESENT); }
    return Z;
  }
  /** FILL THE VALENCE: the outermost occupied shell of the atom in force, every m of it equally and in phase */
  function fillValence() {
    if (getHamiltonian().id !== 'atom') { switchHamiltonian('atom'); if (ui.hamSeg) ui.hamSeg.set('atom'); }
    const cfg = configOf(HAMILTONIANS.atom.Z), sh = cfg[cfg.length - 1], amp = 1 / Math.sqrt(2 * sh.l + 1);
    reg.clear();
    for (let m = -sh.l; m <= sh.l; m++) reg.set(stateOf(sh.n, sh.l, m).index, amp, 0, clock.t);
    touchState(); schedule(TIER.REBUILD);
    const msg = `${HAMILTONIANS.atom.short} ${sh.n}${'spdfgh'[sh.l]} · ${2 * sh.l + 1} label${sh.l ? 's' : ''}, equal and in phase`;
    wState.setStatus(msg, 'live'); if (wAtoms) wAtoms.setStatus(msg, 'live');
    return { n: sh.n, l: sh.l, labels: 2 * sh.l + 1 };
  }

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
  let flowEpoch = null;                                                // the SOURCE the tracers were seeded from: a new source is a new ensemble

  // PLANE (id `slice`) — a rotatable complex plane through ψ (the 4D engine's rotor pair, carrying hydrogen's own 4-space)
  const wSlice = device({ id: 'slice', eyebrow: 'PLANE', status: '' });   // 0.4.0 S3 (R-W3): PLANE, once SLICE — the id and slice.* stay
  const slice = createSliceView(wSlice.body, {
    lut: () => (palette && palette.on ? toLUT(palette.stops) : null),
    repaint() { schedule(TIER.PRESENT); }
  });
  /* OPTIMIZATION 2026-09-24 · M6(b): appended AFTER its view is built (in its old seat, so the rack order and
     LW.bootOrder are unchanged).  Appended first, the plane model's construction-time paint read `cv.clientWidth` on a
     half-built rack and forced its first full style + layout (28.6 ms); disconnected, the read answers 0 without a
     flush, and the plane model's own ResizeObserver paints it once it is laid out. */
  rack.appendChild(wSlice.root);

  /* ── LEGACY WINDOWS (2026-10, Josh): all five are gone — QCD, H₂⁺ and HELIUM in 0.5.0 D9, H₂ and ELECTROSTATICS in D9b
     (R5-L1; ATOMS came back in 0.4.0 S3).  An older file that used one opens on its shim in restore and says so in one line. */

  /* H₂⁺ · LEGACY (the `molecule` card, with W-MO and W-PULSE) was DELETED in 0.5.0 D9: restore opens a file it owned as MOLECULES · H₂ */
  let chem = null;                                                     // wave CHEMISTRY: the fifth field owner, assigned below
  let restampParams = null;                                            // re-tag knobs as modulation targets: lanes built after boot call it (the REGISTER's phase needles)
  let molSession = null;                                               // the one owner of the molecular volume, assigned beside CHEMISTRY below (the frame loop reads it)
  let orbitals = null, states = null, register = null;                 // REGISTER: the window (register) and its two modes, assigned beside CHEMISTRY below
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
    if (v && space === 'p') { space = 'x'; if (ui.spaceSeg) ui.spaceSeg.set('x'); }
    if (!v) switchHamiltonian(getHamiltonian().id);                  // restore the atom's own hiding rules
    refSnapshot = null; pendingRef = null;
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
  molSession = createMolecularSession({ field: () => field, fieldView: molFieldView,
    repaint(rebuild) { schedule(rebuild ? TIER.REBUILD : TIER.PRESENT); } });
  const wChem = device({ id: 'chem', eyebrow: 'MOLECULES', title: 'RHF · real time', status: '' });
  if (useCompactDefaults) wChem.root.classList.add('closed');   // built closed (chemview's N8 shown() guard); the first-run block opens it on the LEFT rack — still no solve until it is switched on
  rack.appendChild(wChem.root);
  chem = createChem(wChem.body, { active: () => canPresent(wChem), loading: cardLoading(wChem, 'chem'), moreOpen: FIRST_RUN.more,   // 0.4.0 S0: the MORE fold opens on a desktop, folds on a phone or tablet
    solve: (msg, fallback, pluck) => solveChem(msg, fallback, pluck),
    repaint(rebuild) { schedule(rebuild ? TIER.REBUILD : TIER.PRESENT); },
    status(t, cls) { wChem.setStatus(t, cls); },
    setOn(v) { moleculeMode(v); stageTextTick(); },
    /* the card does not touch the field: it hands `ground` and `tdhf` products to the session, which decides which
       model is playing and which observable the field shows.  See molecular-session.js. */
    session: molSession,
    derived: (fill) => (history ? history.absorb(fill) : fill()),   // S4 · a solve's derived defaults join the row that asked for it
    now: () => clock.t });

  /* THE STAGE TEXT (Settings › Display; 0.4.0 S3 · F2) — lab/stage-text.js renders it, and 0.5.0 deletes that file for the
     kit's INFORMATIONAL layer.  Here is only its SOURCE: what is playing, as markdown — the MOLECULES formula
     ($\mathrm{H_{2}O}$, latex-state.js formulaLatex) while MOLECULES is on, else SPECTRUM's populated states in stateLatex's
     own prose ("$2s_{0}$ and $2p_{-1}$"; A ↔ B under a TRANSITION).  The states go in with UNIT coefficients — the list line
     depends on which labels are populated, never on c — so no live coefficient can reach the stage.  The source is asked
     only when one of its inputs moved (the register's version, the pick, a legacy owner): one compare a CPU tick. */
  let stageText = null;
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
    const row = chem && chem.on ? MOLECULE_BY_ID.get(chem.preset()) : null;
    return row ? '$' + formulaLatex(row.formula) + '$' : stageStates(true);
  }
  /** THE CAPTION a capture carries (T3): the same stage text as ONE plain-Unicode line — `H₂O · 1b1 HOMO · STO-3G` (the
   *  formula, the ORBITAL on the field in names.js's plain form, the basis) or SPECTRUM's states ("2s₀, 2p₋₁"; A ↔ B) — drawn
   *  by capture.js, since the DOM formula never reaches an export.  It follows the STAGE TEXT switch.  KIT BRIEF 6 replaces it. */
  function stageCaption() {
    if (!stageText || !stageText.on) return '';
    const row = chem && chem.on ? MOLECULE_BY_ID.get(chem.preset()) : null;
    if (!row) return stageStates(false);
    const o = chem.exportNames(), k = o && o.orbital;
    return [mathPlain(row.formula), k && k.plain ? k.plain + (/^(HOMO|LUMO)$/.test(k.frontier) ? ' ' + k.frontier : '') : '', BASIS_LABEL[chem.basis] || ''].filter(Boolean).join(' · ');
  }
  function stageTextTick() {
    if (!stageText) return;
    const id = chem && chem.on ? chem.preset() : '';
    if (reg.version === stageSrc.v && id === stageSrc.id) return;
    stageSrc.v = reg.version; stageSrc.id = id;
    stageText.setFormula(stageMd());
  }
  function initStageText() {
    stageText = createStageText({ stage: dom.stage, canvas: dom.canvas, racks: [rackL, rack], docked: () => layout.docked });
    wChem.root.addEventListener('change', stageTextTick);           // the pick lands in `preset` at once; the solve comes later
    chem.subscribe(() => stageTextTick());                         // … and a restore / undo / link that re-solves
    paintMarks(); stageTextTick();
  }

  /* ORBITALS — the MOLECULAR REGISTER: ψ(r, t) = Σ_k c_k e^{−iε_k t} φ_k over CHEMISTRY's canonical orbitals, which
     is where a molecule's `arg` lives (MATH-H2O-2026-09-11, Proposition 1).  It is NOT a sixth field owner: it does
     not upload a molecule and it does not touch moleculeMode() — CHEMISTRY owns the shells and this window owns the
     matrix while REGISTER ON is up.  2026-10 (Josh): it STAYS on the rack whatever MOLECULES does — MOLECULES OFF only stands its
     switch down (orbitalsview.js update), and the ladder stays painted and editable. */
  const wOrbs = device({ id: 'orbitals', eyebrow: 'MO-REGISTRY', title: 'molecular orbital registry', status: '' });   // the id stays `orbitals` so saved layouts survive the rename (REGISTER-WINDOW-SPEC §11.1)
  if (useCompactDefaults) wOrbs.root.classList.add('closed');   // the same rule CHEMISTRY keeps; the first-run block opens it under MOLECULES
  rack.appendChild(wOrbs.root);
  register = createRegister(wOrbs.body, { active: () => canPresent(wOrbs),
    stamp: () => { if (restampParams) requestAnimationFrame(restampParams); },   // a lane built after boot becomes a drop target for a macro
    solve: (msg, fallback, pluck) => solveChem(msg, fallback, pluck),   // the STATES mode asks the chem worker for its canonical ladder and vectors
    repaint(rebuild) { schedule(rebuild ? TIER.REBUILD : TIER.PRESENT); },
    status(t, cls) { wOrbs.setStatus(t, cls); },
    announce: (md) => stageText && stageText.announce(md),        // a HAND's preset only (orbitalsview / statesview presetSel)
    now: () => clock.t, field: () => field, chem: () => chem, session: molSession });
  orbitals = register.orbitals; states = register.states;

  // CALCULUS — the stats, derived live, with their laws and residuals
  const wCalc = device({ id: 'calculus', eyebrow: 'CALCULUS', status: '' });
  rack.appendChild(wCalc.root);
  const calculus = createCalculus(wCalc.body, {});

  // METERS
  const wMet = device({ id: 'meters', eyebrow: 'METERS', status: '' });
  rack.appendChild(wMet.root);
  const meters = createMeters(wMet.body);

  {
    const rp = wMet.row('tight');                                     // 0.4.0 S3: PERFORMANCE moved to SETTINGS › QUALITY; the GOVERNOR's readout stays here
    ui.govRo = readout({ label: 'GOVERNOR  state · median · grid', value: 'nominal', cls: 'wide', sub: 'budget 22 ms · the window median' }); rp.appendChild(ui.govRo.root);
  el('div', 'note', wMet.body).innerHTML = '<b>Frame profile.</b> Times are moving averages measured in this browser. PERFORMANCE (SETTINGS › QUALITY) at 120 Hz updates visible CPU readers every fourth frame while the field continues to present each frame.';
  }
  // LADDER — the Rydberg revival as a spectral instrument (print, Thread A); its own register, no field
  const wLad = device({ id: 'ladder', eyebrow: 'LADDER', status: '' });
  if (useCompactDefaults) wLad.root.classList.add('closed');
  rack.appendChild(wLad.root);
  const ladder = createLadder(wLad.body, { active: () => canPresent(wLad), loading: cardLoading(wLad, 'revival'), solve: (params) => solveCard({ op: 'ladder', params }, () => solveLadder(params)) });
  /* Shift multi-add reopens several cards in one gesture. Each explicit request enters the card worker queue even
     if later cards land below the rack clip; the single worker keeps those solves from competing with the field. */
  wChem.root.addEventListener('devopen', () => chem.prepare());
  wOrbs.root.addEventListener('devopen', () => { chem.prepare(); orbitals.paint(); orbitals.refresh(); });   // the register runs on CHEMISTRY's ladder: opening it asks for one
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
    const camOut = (id, v) => { setKnob(camKnobs[id], v); cameraPort.notify(); schedule(TIER.PRESENT); };   // C1 (A8's open item 3): a route's write is a notice
    const defs = [
      /* 0.5.0 C1 · the six saved observer.* routes keep their ids, maps and ranges, and stay HERE (the registry's road writes the pose
         raw; the panel registers none of them).  Their dials are the CAMERA panel's (camKnobs: the sphere's two arcs, ZOOM, FOV, the
         pad's X and Y), and a modulator's write is a notice to the port's subscribers (camOut), so the panel follows a route. */
      { id: 'observer.yaw', label: 'YAW', unit: ' rad', map: 'wrap', min: 0, max: 2 * Math.PI, group: 'observer', knob: () => camKnobs['observer.yaw'],
        hint: 'the camera azimuth — free-spinning, because an orbit that reaches the end of the dial and stops is not an orbit',
        get: () => obs.yaw, set: (v) => { if (sameCycle(v, obs.yaw, 2 * Math.PI)) return; if (obs.mode === 'free') orbitBy(v - obs.yaw, 0); else obs.yaw = v; camOut('observer.yaw', obs.yaw); } },
      { id: 'observer.pitch', label: 'PITCH', unit: ' rad', map: 'bipolar', min: -CAM.PITCH, max: CAM.PITCH, def: 0, group: 'observer', knob: () => camKnobs['observer.pitch'],
        hint: 'Pitch balance; 50% is level',
        get: () => obs.pitch, set: (v) => { const w = Math.max(-CAM.PITCH, Math.min(CAM.PITCH, v)); if (w === obs.pitch) return; if (obs.mode === 'free') orbitBy(0, w - obs.pitch); else obs.pitch = w; camOut('observer.pitch', obs.pitch); } },
      { id: 'observer.dist', label: 'ZOOM', map: 'log', min: CAM.DIST[0], max: CAM.DIST[1], group: 'observer', knob: () => camKnobs['observer.dist'],
        hint: 'the ZOOM dial itself — log, because the interesting half of a zoom is always the near half',
        get: () => obs.dist, set: (v) => { obs.dist = Math.max(CAM.DIST[0], Math.min(CAM.DIST[1], v)); camOut('observer.dist', obs.dist); } },
      { id: 'observer.fov', label: 'FOV', map: 'linear', min: CAM.FOV[0], max: CAM.FOV[1], group: 'observer', knob: () => camKnobs['observer.fov'],
        get: () => obs.fov, set: (v) => { obs.fov = Math.max(CAM.FOV[0], Math.min(CAM.FOV[1], v)); camOut('observer.fov', obs.fov); } },
      { id: 'observer.panx', label: 'PAN X', map: 'bipolar', min: -CAM.SHIFT, max: CAM.SHIFT, def: 0, group: 'observer', knob: () => camKnobs['observer.panx'], hint: 'the lens shift across: where the pivot sits on the frame',   // 0.4.0 S2
        get: () => obs.shift[0], set: (v) => { obs.shift = [clampShift([v, 0])[0], obs.shift[1]]; camOut('observer.panx', obs.shift[0]); } },
      { id: 'observer.pany', label: 'PAN Y', map: 'bipolar', min: -CAM.SHIFT, max: CAM.SHIFT, def: 0, group: 'observer', knob: () => camKnobs['observer.pany'], hint: 'the lens shift up and down: where the pivot sits on the frame',
        get: () => obs.shift[1], set: (v) => { obs.shift = [obs.shift[0], clampShift([0, v])[1]]; camOut('observer.pany', obs.shift[1]); } },
      { id: 'material.stage', label: 'STAGE', map: 'linear', min: 0, max: 1, group: 'material', knob: () => ui.stageK, get: () => ui.stageK.get(), set: (v) => __LW_hooks.setStage(v) },
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
      { id: 'chem.kick', label: 'κ KICK', map: 'log', min: 1e-4, max: 1e-2, def: 1e-3, group: 'state', knob: () => (chem ? chem.knobs.kick() : null),
        hint: 'the δ-kick strength the next KICK will use — linear response wants the smallest κ the trace can carry',
        get: () => (chem ? chem.kappa : 1e-3), set: (v) => { if (chem) { chem.setKappa(v); setKnob(chem.knobs.kick(), chem.kappa); } } },
      { id: 'chem.speed', label: 'MOLECULES SPEED', unit: ' steps/frame', map: 'linear', min: 1, max: 50, def: 10, group: 'state', knob: () => (chem ? chem.knobs.speed() : null),
        hint: 'real-time propagation steps asked of the worker each frame',
        get: () => (chem ? chem.speed : 10), set: (v) => { if (chem) { chem.setSpeed(v); setKnob(chem.knobs.speed(), chem.speed); } } },
      /* THE REGISTER's SLOTS (REGISTER-WINDOW-SPEC §6): MORPH, and eight lane slots in lane order — S₀ is slot 1.
         PRESENT-only like every target here: a setter stores a number and the register's own frame push reads it.
         A slot with no lane behind it is a no-op, which is the present-only law for a lane that is not there. */
      { id: 'reg.morph', label: 'REG MORPH', map: 'linear', min: 0, max: 1, def: 0, group: 'state', knob: () => (states ? states.knobs.morph() : null),
        hint: 'where the STATES register plays on the path from store A to store B (MORPH must be on)',
        get: () => (states ? states.morph : 0), set: (v) => { if (states) { states.setMorphValue(v); setKnob(states.knobs.morph(), states.morph); } } },
      { id: 'reg.e0', label: 'DRIVE E₀', unit: ' a.u.', map: 'log', min: 1e-4, max: 0.2, def: 0.01, group: 'state', knob: () => (states ? states.knobs.driveE() : null),
        hint: 'the STATES drive’s field amplitude — a live knob of the running propagation, never a restart',
        get: () => (states ? states.drive.e0 : 0.01), set: (v) => { if (states) { states.setDriveParam('e0', v); setKnob(states.knobs.driveE(), states.drive.e0); } } },
      { id: 'reg.w', label: 'DRIVE ω', unit: ' Eh', map: 'log', min: 0.05, max: 3, def: 0.4, group: 'state', knob: () => (states ? states.knobs.driveW() : null),
        hint: 'the STATES drive’s carrier frequency — sweep it through a stick to watch the resonance',
        get: () => (states ? states.drive.omega : 0.4), set: (v) => { if (states) { states.setDriveParam('omega', v); setKnob(states.knobs.driveW(), states.drive.omega); } } },
      ...Array.from({ length: 8 }, (_, i) => ({ id: `reg.amp${i + 1}`, label: `REG |b|² ${i + 1}`, map: 'linear', min: 0, max: 1, def: 0, group: 'state',
        knob: () => (states ? states.knobs.pop(i) : null), hint: `the population of lane ${i + 1} of the STATES register (lane 1 is S₀)`,
        get: () => (states ? states.slotAmp(i) : 0), set: (v) => { if (states) { states.setSlotAmp(i, v); setKnob(states.knobs.pop(i), states.slotAmp(i)); } } })),
      ...Array.from({ length: 8 }, (_, i) => ({ id: `reg.ph${i + 1}`, label: `REG PHASE ${i + 1}`, unit: ' rad', map: 'linear', min: 0, max: 2 * Math.PI, def: 0, group: 'state',
        knob: () => (states ? states.knobs.ph(i) : null), hint: `the phase of lane ${i + 1} of the STATES register — on the y lane of a degenerate pair this sweeps slosh → ring → slosh → counter-ring`,
        get: () => (states ? states.slotPhase(i) : 0), set: (v) => { if (states) states.setSlotPhase(i, v); } })),

      { id: 'state.rabi', label: 'Ω RABI', map: 'log', min: 0.005, max: 1, def: 0.05, group: 'state', knob: () => ui.abOmega,
        hint: 'Set the A–B transition rate',
        get: () => __LW_hooks.ab.omega,
        set: (v) => { __LW_hooks.ab.setOmega(v); setKnob(ui.abOmega, v); schedule(TIER.PRESENT); } },
    ];
    /* THE SIXTH ROOT, through mir/registry's own documented extension point rather than by editing the vendored module:
       CHEMISTRY's two targets are `chem.kick` and `chem.speed`, and an id's root is what a saved route is addressed by — so it
       names the instrument, not the nearest existing group.  0.5.0 C1: `observer.yaw` / `observer.pitch` carry the CAMERA panel's
       sphere arcs, so they are drop targets now, like every observer.* dial. */
    modHost = mod.install(defs, ['observer', 'material', 'state', 'transport', 'field', 'chem', 'reg']);
    restampParams = mod.stamp;


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
      dodging[who] = rect && (who === 'mod' ? modView && modView.isOpen : tl && tl.isOpen()) ? rect : null;
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

    modView = createModulation(document.getElementById('floats') || document.getElementById('lab'), mod.port({
      moved: modDodge, persist: () => saveSettings(), note: hNote,
      rateControl: () => knob({ label: 'RATE', min: 0.1, max: 3000, value: clock.rate, log: true, fmt: (v) => v.toFixed(2), onInput: (v) => { if (!modHand('transport.rate', v)) { clock.setRate(v); ui.rateKnob.set(v); } } }),
      /* WAVE 102 · THE FIFTH EDGE's memory: the chosen input, kept in this browser's settings so a returning user is not asked to
         pick it again — a device HANDLE, never audio (the kit's mir/modulation/audio-capture.js header says why that distinction matters). */
      device: { read: () => readSettings().audioDevice || '',
        write: (id) => { const S = readSettings();
          settingsStore.write({ ...S, audioDevice: id }); } },
      /* WAVE 65 · THE ARM'S OTHER DOOR: pressing the window's PLAY on a disarmed rack asks the host to arm, and the MOD lamp on
         the transport lights.  The host owns the flag, the glow and the persistence; the window only asks. */
      armed: () => modArm, arm: (on) => setModArm(!!on) }));
    modView.root.dataset.mirWindow = 'modulation';    // 0.5.0 A10's hook (the kit's controller sets the rail's, not the pane's)
    applyAccent();                                    // the two angles reach the window as soon as it exists
    modView.restore(readSettings().modwin);
    dodge = modDodge;                                 // 0.5.0 C7b: the TIMELINE's `moved` gives way through the same seat chooser
    /* wave 54: the modulation clock's visibility is driven by the ONE authority (setPageHidden), not by a second listener of its own — it still RE-ANCHORS and never jumps */
    if (page.hidden) modHost.clock.setHidden(true);
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

  /* ELECTROSTATICS · LEGACY (Φ, E, B and j of the register's charge, the #fieldlines overlay) was DELETED in 0.5.0 D9b */

  // WIGNER — the one joint object of position and momentum, cut through the axis; a niche window: it ships CLOSED
  const wWig = device({ id: 'wigner', eyebrow: 'WIGNER', status: '' });
  rack.appendChild(wWig.root); wWig.root.classList.add('closed');                // reopened from the + at the top of the rack
  const wignerView = createWigner(wWig.body, { repaint() { schedule(TIER.PRESENT); } });

  // RADIATION — what the prepared pair would radiate, and the shape of its far field; also CLOSED
  const wRad = device({ id: 'radiation', eyebrow: 'RADIATION', status: '' });
  rack.appendChild(wRad.root); wRad.root.classList.add('closed');
  const radiationView = createRadiation(wRad.body, { repaint() { schedule(TIER.PRESENT); }, ab: () => __LW_hooks.ab });
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
    if (chem && chem.on) return { on: false, status: 'hydrogenic register only', why: 'another model holds the field — this window reads the hydrogenic register' };   // 0.4.0 S0 · wave 137: MOLECULES too
    return { on: true, status: null, why: '' };
  }

  /* ── transport strip (§25) ─────────────────────────────────────────────── */
  const transport = (() => {
    const T = dom.transport;
    /* WAVE 62: the glyph is the drawing, the name is the word.  `play`'s NAME never changes when its
       glyph swaps ▶ ↔ ❚❚ — a control that renames itself is a different control to a screen reader;
       what changes is its `aria-pressed`, which is what "is it playing" actually means. */
    const play = el('button', 'tbtn play', T, '▶'); play.type = 'button'; play.title = 'Play or pause'; play.setAttribute('aria-label', 'play or pause'); play.setAttribute('aria-pressed', 'false');


    const modB = el('button', 'tbtn modb', T, 'MOD'); modB.type = 'button';
    modB.setAttribute('aria-label', 'modulation on or off');
    modB.setAttribute('aria-pressed', 'true');
    modB.title = 'Enable modulation';
    modB.addEventListener('click', () => setModArm(!modArm));
    ui.modB = modB;


    const SVG_REWIND = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" style="width:13px;height:13px;display:block;margin:auto"><rect x="5" y="5" width="2.6" height="14" rx="1.1"/><polygon points="20 5 20 19 9.5 12 20 5"/></svg>';
    const rst = el('button', 'tbtn transport-home', T); rst.type = 'button'; rst.innerHTML = SVG_REWIND; rst.title = 't → 0  (home)'; rst.setAttribute('aria-label', 'back to t = 0');
    const sm = el('button', 'tbtn transport-step-back', T, '‹'); sm.type = 'button'; sm.title = 'step back  (←)'; sm.setAttribute('aria-label', 'step back');
    const sp = el('button', 'tbtn transport-step-forward', T, '›'); sp.type = 'button'; sp.title = 'step forward  (→)'; sp.setAttribute('aria-label', 'step forward');
    ui.scrub = fader({ label: 'SCRUB  t / window', min: 0, max: 1, value: 0, fmt: (v) => (v * clock.window).toFixed(2) + ' a.u.',
      onInput: (v) => { clock.scrub(v * clock.window + laps() * clock.window); schedule(TIER.EVOLVE); } });
    T.appendChild(ui.scrub.root);
    ui.rateKnob = knob({ label: 'RATE a.u./s', min: 0.1, max: 3000, value: 4, log: true, fmt: (v) => v >= 100 ? v.toFixed(0) : v.toFixed(1), onInput: (v) => { if (modHand('transport.rate', v)) return; clock.setRate(v); } });
    T.appendChild(ui.rateKnob.root);
    const tro = readout({ label: 't  a.u.  (lap)', value: '0.00', cls: 'time' });
    T.appendChild(tro.root);
    /* ── THE CLOCK's law: when does this density repeat?  T = 2π / gcd{|E_a − E_b|} over the populated labels (EXACT where the
       differences are commensurate: hydrogen and its ions, the oscillator; a near-recurrence with its error otherwise) ── */
    ui.periodRo = readout({ label: 'REPEATS every', value: '—', cls: 'period', sub: 'exact period of the density, from the energies in force' });
    T.appendChild(ui.periodRo.root);
    /* WAVE 69 · THE THEOREM, SUBSTITUTED, LIVE.  This is the first of the three places a number was
       given permission to move (see REPORT wave 69).  It earns it because every value on the line is
       EXACT at the instant it is printed: the gcd comes from the same scan the readout above prints,
       and the lap decomposition is arithmetic on the clock.  Nothing is tweened and nothing is
       illustrative — which is the difference between this and animating a number in a video. */
    ui.periodFx = formula({ lines: [
      ['<m>T = 2π / gcd{|ΔE|} = 2π / </m>', { s: 'g' }, '<m> = </m>', { s: 'T' }],
      ['<m>t = </m>', { s: 'lap' }, '<m> · T + </m>', { s: 'ph' }, '<m> · T</m>'] ] });
    T.appendChild(ui.periodFx.root);
    const jmp = el('button', 'tbtn jump', T, '⟳'); jmp.type = 'button'; jmp.title = 'jump to the next exact repeat of the density'; jmp.setAttribute('aria-label', 'jump to the next exact repeat of the density');
    jmp.addEventListener('click', () => { const P = periodNow(true); if (P && P.T > 0) { const t = clock.t, next = t + P.T - (((t % P.T) + P.T) % P.T); clock.scrub(next); shadowView.clearTrail(); schedule(TIER.EVOLVE); } });
    let lastPeriod = null, periodCostMs = 0, periodSettling = false, periodPending = null;
    /* LA6 · ONE SCAN IN FLIGHT, THE LATEST KEY WAITING.  Every new key used to post a fresh O(pairs × 2·10⁶) scan into a
       FIFO worker that cannot drop stale work: 4 s of a moving register (keyboard auto-repeat on ZEEMAN B, a script)
       jammed it for over two minutes (AUDIT-F F3, REFUTE-B/D).  Now one scan runs; a newer key replaces `scanWant`; the
       worker is free again only when ITS reply arrives — a timed-out scan is tracked to that reply (worker-pool.js makeWorker, onLate),
       never to the promise, or a timeout plus a fresh post would put two scans back in the queue (REFUTE-D). */
    let scanBusy = false, scanWant = null;
    function scanPost(key, energies) {
      if (scanBusy) { scanWant = { key, energies }; return; }
      scanBusy = true;
      const done = (r) => {
        scanBusy = false; scanLand(key, r);
        if (scanWant) { const q = scanWant; scanWant = null; if (periodPending && sameKey(periodPending, q.key)) scanPost(periodPending, q.energies); }
      };
      scan.call({ op: 'period', energies, horizon: 2e4 }, undefined, done).then((r) => { if (!(r && r.error === 'timeout')) done(r); });
    }
    function scanLand(key, r) {
      if (!r || r.error) { if (periodPending && sameKey(periodPending, key)) periodPending = null; return; }
      if (!periodPending || !sameKey(periodPending, key)) return;          // a later state: this answer is stale
      const P = Object.assign({}, r); delete P.id; delete P.op;
      lastPeriod = P; Object.assign(pk, key); periodCostMs = 0; periodSettling = false; periodPending = null;
      paintPeriod(); schedule(TIER.PRESENT);                           // paused, no frame would repaint the readout
    }
    /* …and a dial held down by an ARROW KEY is a gesture too (auto-repeat bumps reg.version ~30×/s with no pointer):
       the wave-44 hold-off below reads it beside pointerHeld; a released key lets the settled scan run once. */
    let keyHeld = false;
    document.addEventListener('keydown', (e) => { if (e.repeat && e.target && e.target.closest && e.target.closest('.k, .fd')) keyHeld = true; }, true);
    const keyReleased = () => { if (!keyHeld) return; keyHeld = false; if (periodSettling) schedule(TIER.PRESENT); };
    document.addEventListener('keyup', keyReleased, true); window.addEventListener('blur', keyReleased);
    /* the scan's key, as numbers compared in place (wave 45: it was a string built on every frame) */
    const pk = { v: -2, fz: 0, bz: 0, h: '', mix: false, s: -1 };
    const keyNow = () => ({ v: reg.version, fz: reg.field.Fz, bz: reg.field.Bz, h: getHamiltonian().id, mix: !!reg.transition, s: sturm.P ? sturm.lambda : -1 });
    const sameKey = (a, b) => a.v === b.v && a.fz === b.fz && a.bz === b.bz && a.h === b.h && a.mix === b.mix && a.s === b.s;
    const periodFresh = () => pk.v === reg.version && pk.fz === reg.field.Fz && pk.bz === reg.field.Bz && pk.h === getHamiltonian().id && pk.mix === !!reg.transition && pk.s === (sturm.P ? sturm.lambda : -1);
    /**
     * THE SCAN IS NOT FREE (wave 44).  densityPeriod's near-recurrence scan is O(pairs × 2·10⁶) and it is reached on
     * every NEW register version — which the comment below the readout used to call "cheap, cached on the register's
     * version", true only while a state has one or two beats.  Under STURMIAN a generic λ occupies eleven eigenvalues,
     * fifty-five pairs, and one scan measured 594 ms; the λ knob calls setSturmian on every pointermove, so a drag was
     * a train of 0.6 s stalls (34 frames of 74 over 100 ms, the worst 650).  So a scan that has ALREADY proved
     * expensive is held off while a pointer is down — the same law history.js applies to its commits — and runs once
     * when the gesture ends.  `force` is the road every non-frame reader takes (LW.period, the ⟳ jump, the digest), so
     * no proof and no button ever sees a stale answer: only the per-frame readout waits, and it says that it is.
     */
    function periodNow(force = false) {
      if (periodFresh()) { periodSettling = false; return lastPeriod; }
      /* AND A DRIVEN ROTATION IS A GESTURE TOO.  The guard was `pointerHeld` alone, which a
         hands-off drive does not set: a running rate bumps reg.version on every frame, so
         periodPending got a new key sixty times a second and this posted a fresh O(pairs × 2·10⁶)
         scan to the worker on every one of them, for as long as the rate turned.  Same law, same
         line — an expensive answer waits until the movement stops. */
      if (!force && lastPeriod && periodCostMs > 8 && (pointerHeld || keyHeld || rotDriving())) { periodSettling = true; return lastPeriod; }
      const key = keyNow();
      if (reg.field.Fz !== 0) { Object.assign(pk, key); periodCostMs = 0; periodSettling = false; lastPeriod = { exact: false, stark: true, T: 0 }; return lastPeriod; }
      if (reg.transition) { Object.assign(pk, key); periodCostMs = 0; periodSettling = false; lastPeriod = { exact: false, mix: true, T: 0 }; return lastPeriod; }
      const Es = periodEnergies();          // W-STURMIAN: the OCCUPIED eigenvalues (populations > 1e-6), never the labels' ⟨H⟩ — and wave 58 hands the SAME expression to capture.js
      /* Hydrogen, ions and the oscillator normally prove commensurate in microseconds. Answer that exact half here;
         only an actually incommensurate spectrum pays module-worker startup and the bounded two-million-step scan. */
      const exact = densityPeriodExact(Es);
      if (exact) { Object.assign(pk, key); periodCostMs = 0; periodSettling = false; periodPending = null; lastPeriod = exact; return lastPeriod; }
      if (!force && scan.ok) {
        /* THE FRAME PATH (wave 45): the scan runs in the maths worker and the readout says it is settling until the
           answer lands — a BOX bow populates 56 incommensurate well energies and the scan measured 1.2 s on the first
           frame after the pointer lifted.  Forced readers (LW.period, ⟳, the digest) still scan here, synchronously. */
        if (!periodPending || !sameKey(periodPending, key)) { periodPending = key; scanPost(key, Array.from(Es)); }   // LA6: posted, or waiting behind the one in flight
        periodSettling = true; return lastPeriod;
      }
      const wasSettling = periodSettling;
      Object.assign(pk, key); periodSettling = false; periodPending = null;
      const t0 = performance.now();
      lastPeriod = densityPeriod(Es, { horizon: 2e4 });
      periodCostMs = performance.now() - t0;
      if (force && wasSettling) paintPeriod();                                 // the readout said "settling": it has the answer now
      return lastPeriod;
    }
    function periodText() {
      const P = periodNow(); if (!P) return ['—', '', ''];
      if (periodSettling) return ['…', 'settling — the recurrence scan runs off the frame, or when the gesture ends', ''];
      const src = sturm.P ? ' · from the occupied eigenvalues of S⁻¹H' : '';
      if (sturm.P && !P.exact && P.T > 0) {                          // W-STURMIAN: a "recurrence" shorter than one turn of the fastest beat is no recurrence (every phase is still small)
        const Es = occupiedEigen(); let dmax = 0; for (let i = 0; i < Es.length; i++) for (let j = i + 1; j < Es.length; j++) dmax = Math.max(dmax, Math.abs(Es[i] - Es[j]));
        if (dmax > 0 && P.T < 2 * Math.PI / dmax) return ['—', P.count + ' incommensurate eigenvalues · no recurrence within the search horizon', 'warn'];
      }
      if (P.stark) return ['— (Stark)', 'no exact period under a static field: the Stark energies are not commensurate', 'warn'];
      if (P.mix) return ['— (transition)', 'the A ↔ B mix has its own clock: the Rabi period', 'warn'];
      if (P.stationary) return ['stationary', 'one energy: the density never changes', ''];
      if (P.exact) { const lap = Math.floor(clock.t / P.T), ph = clock.t - lap * P.T; return [fmtPeriod(P.T), P.count + ' energies · gcd ' + P.g.toPrecision(4) + ' Eh · lap ' + lap + ' · ' + (100 * ph / P.T).toFixed(0) + '%' + src, 'ok']; }
      return ['≈ ' + fmtPeriod(P.T), 'nearest recurrence · error ' + (100 * P.err).toFixed(1) + '% of a beat' + src, 'warn'];
    }
    /** the four slots of the REPEATS formula, from the SAME `periodNow()` the readout above reads — one
        expression for one quantity (ANTI-PATTERN 20).  A state with no exact period prints an em dash in
        every slot rather than a number that would be a lie. */
    function paintPeriodFx() {
      if (!ui.periodFx) return;
      const P = periodNow();
      if (!P || periodSettling || !P.exact || !(P.T > 0)) { ui.periodFx.set({ g: '—', T: '—', lap: '—', ph: '—' }); return; }
      const lap = Math.floor(clock.t / P.T), ph = (clock.t - lap * P.T) / P.T;
      ui.periodFx.set({ g: P.g.toPrecision(6), T: fmtPeriod(P.T), lap: String(lap), ph: ph.toFixed(3) });
    }
    /** paint the REPEATS readout now — a forced scan (LW.period, ⟳, the digest) and the worker's answer both call it, so a paused
        instrument shows the answer the moment it exists rather than on a frame it will not run (wave 45) */
    function paintPeriod() { if (!ui.periodRo) return; const [v, sub, cls] = periodText(); ui.periodRo.set(v, cls); ui.periodRo.setSub(sub); paintPeriodFx(); }
    __LW_hooks.period = () => periodNow(true);          // every reader outside the frame loop forces the scan: no proof and no digest ever sees a settling answer
    const laps = () => Math.floor(clock.t / clock.window);
    const compactClock = (v, threshold, decimals) => Math.abs(v) < threshold
      ? v.toFixed(decimals)
      : v.toExponential(decimals).replace('e+', 'e');
    const clockText = () => {
      const lap = laps();
      return compactClock(clock.t, 1e5, 2) + (lap ? '  (' + compactClock(lap, 1e4, 1) + ')' : '');
    };
    const stepDt = () => clock.window / 48;
    play.addEventListener('click', () => togglePlay());
    /* wave 106: …and the PLAYHEAD goes back with the clock.  `ui.scrub` is only ever repainted inside
       `if (keep.frames)` in update(), and KEEP FRAMES ships OFF — so pressing ⏮ moved t to 0 and left
       the bar standing wherever it had been.  `loadPreset` has always done this (it calls
       `ui.scrub.set(0)` beside `clock.reset()`); the transport's own button did not. */
    rst.addEventListener('click', () => { clock.reset(); ui.scrub.set(0); shadowView.clearTrail(); schedule(TIER.EVOLVE); });
    sm.addEventListener('click', () => { clock.step(-stepDt()); schedule(TIER.EVOLVE); });
    sp.addEventListener('click', () => { clock.step(stepDt()); schedule(TIER.EVOLVE); });
    let troWall = 0, periodWall = 0, playShown = null;
    function update() {
      const on = clock.playing, now = performance.now();
      if (playShown !== on) { playShown = on; play.textContent = on ? '❚❚' : '▶'; play.classList.toggle('on', on); play.setAttribute('aria-pressed', String(on)); }
      /* KEEP FRAMES (wave 45): on, the playhead follows every frame as it always did; off — the default — the bar is
         disabled and never repainted, and the t readout runs at 5 Hz while playing (every paused frame, as before) */
      if (keep.frames) {
        if (!ui.scrub.dragging()) ui.scrub.set(((clock.t % clock.window) + clock.window) % clock.window / clock.window);
        tro.set(clockText(), on ? 'live' : '');
      } else if (!on || now - troWall >= 200) { troWall = now; tro.set(clockText(), on ? 'live' : ''); }
      if (ui.periodRo && (!on || keep.frames || now - periodWall >= 200)) { periodWall = now; const [v, sub, cls] = periodText(); ui.periodRo.set(v, cls); ui.periodRo.setSub(sub); paintPeriodFx(); }   // periodNow() is cached on the register's version; the scan itself runs off the frame (wave 45) or waits out a live gesture (wave 44).  WAVE 69: the formula rides the SAME cadence law — every frame with KEEP FRAMES on, 5 Hz without — so a moving number obeys the readout law the transport already owns rather than inventing a second one
    }
    setKeepFrames(keep.frames);                                // the shipped default: the bar disabled
    setModArm(modArm, { quiet: true });                        // wave 65: ONE writer paints the lamp, boot included
    return { update, stepDt };
  })();


  /** THE PLAY (0.5.0 A6): the physics clock's toggle; its edge plays or pauses the modulation (C4: the one clock, always). */
  function togglePlay() { appPlay.toggle(); schedule(TIER.EVOLVE); }
  /** THE POWER (MIR 1.5, R-B1 at 0.5.0 C4; the MOD button, Ctrl+Space, the window's power seat): `setModulationEnabled` is a
   *  ROUTE BYPASS — off, every routed control is back on its base and the hand owns it, while the clock, the sources, the tempo
   *  and the HOLDs run on, so power on picks the routes up in time.  Power never plays; play never powers (bind.js setArm). */
  function setModArm(on, opts) {
    const want = !!on, o = opts || {};
    modArm = want;
    if (ui.modB) {
      ui.modB.classList.toggle('on', want);
      ui.modB.setAttribute('aria-pressed', String(want));
    }
    if (modHost) {
      modHost.clock.setModulationEnabled(want);
      if (modView) modView.sync();
    }
    if (!o.quiet) saveMod();
    schedule(TIER.PRESENT);
    return modArm;
  }
  /** THE LOOP CLOCK, LOCKED TO THE STATE (g).  `barTempo({T, rate})` turns the density's own exact
   *  recurrence into a tempo at which ONE BAR IS ONE RECURRENCE — which is what makes the BPM chip's
   *  "an existing global clock" the instrument's clock rather than a number somebody typed, and what
   *  makes `capture.js`'s loop close on the same seam the physics closes on.  It is a KEY and not a
   *  new control, because the modulation window is a ported artifact and its timing bar is not ours
   *  to grow; the sentence lives on the MOD button and in the keyboard editor.  It never guesses: no exact
   *  period, no lock, and the refusal says which. */
  function barLock() {
    if (!modHost) return { ok: false, reason: 'no modulation rack' };
    const P = __LW_hooks.period ? __LW_hooks.period() : null;
    if (!P || !P.exact || !(P.T > 0)) {
      const why = !P ? 'no recurrence scan' : P.stark ? 'no exact period under a static field'
        : P.mix ? 'the A ↔ B mix has its own clock' : P.stationary ? 'one energy: the density never changes'
        : 'no exact period — the energies are incommensurate';
      if (modView) modView.say('the loop clock cannot be locked to this state: ' + why, 'warn');
      return { ok: false, reason: why };
    }
    const r = barTempo({ T: P.T, rate: clock.rate });
    if (!r.ok) return { ok: false, reason: r.reason };
    modHost.clock.setBpm(r.clamped ? r.bpmThatFits : r.bpm);
    if (modView) { modView.sync(); modView.say(r.clamped
      ? 'one bar = ' + r.lapsThatFit + ' laps of the recurrence at ' + modHost.model.transport.bpm.toFixed(1) + ' BPM (one lap would be ' + r.wanted.toFixed(1) + ', past the tempo range)'
      : 'one bar = one recurrence of the density, at ' + modHost.model.transport.bpm.toFixed(1) + ' BPM'); }
    saveSettings();
    return { ok: true, bpm: modHost.model.transport.bpm, wanted: r.wanted, clamped: r.clamped,
             laps: r.clamped ? r.lapsThatFit : 1, T: P.T, seconds: r.seconds, fits: r.fitsAtLaps };
  }

  /* ── badges (§41) ─────────────────────────────────────────────────────── */
  const badges = createBadges({ dom, accept: () => swClient.accept(), field, reg, mat, clock, domain, quality,
    getSpace: () => space, stateReaders, ui });   // N7 seam 6: lab/badges.js

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
    const rows = history ? history.entries() : [];
    return rows.length === 1 && !history.canUndo && !history.pendingLabel && !history.holding
      && (rows[0].label === 'boot' || rows[0].label === 'link')
      && !(layout.projects && layout.projects.dirty) && !pointerHeld
      && !(warning && warning.open)
      && !(document.activeElement && /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName))
      && !(capApi && capApi.busy)
      && (ignorePlaying || (!clock.playing && !clock.t));
  };
  const swClient = createSwClient({ buildBadge: () => badges.build,
    setStatus: (text) => { if (ui.set) ui.set.setStatus(text, 'warn'); }, getProjects: () => layout.projects, untouched,
    host: dom.badges.parentElement });

  /* ── THE BOW: ctrl+drag draws it, release fires, releasing CTRL first cancels ── */
  let bow = null, bowPrevView = null;
  function bowStart(e) {
    const r = dom.canvas.getBoundingClientRect();
    bow = { x0: e.clientX - r.left, y0: e.clientY - r.top, x1: e.clientX - r.left, y1: e.clientY - r.top, k: 0, dir: [0, 0, 1] };
    bowPrevView = mat.view; mat.view = VIEW.phase; if (ui.viewSeg) ui.viewSeg.set('phase');
    try { if (e.pointerId !== undefined) dom.canvas.setPointerCapture(e.pointerId); } catch (_) {}
    kepler.setBow(bow); schedule(TIER.PRESENT);
  }
  function bowMove(e) {
    if (!bow) return;
    const r = dom.canvas.getBoundingClientRect();
    bow.x1 = e.clientX - r.left; bow.y1 = e.clientY - r.top;
    const dx = bow.x1 - bow.x0, dy = bow.y1 - bow.y0;
    bow.k = Math.min(mat.bow?.limit ?? 3, Math.pow(Math.hypot(dx, dy) / 120, mat.bow?.curve ?? 1) * (mat.bow?.gain ?? 1));                    // 120 px of pull = 1 a.u. of momentum, capped at 3
    const B = cameraBasis(obs);
    const d = [-(dx * B.right[0] - dy * B.up[0]), -(dx * B.right[1] - dy * B.up[1]), -(dx * B.right[2] - dy * B.up[2])];   // a bow: the arrow flies opposite to the pull; screen y points down
    const n = Math.hypot(d[0], d[1], d[2]);
    bow.dir = n > 0 ? [d[0] / n, d[1] / n, d[2] / n] : [0, 0, 1];
    mat.boost.k = [bow.dir[0] * bow.k, bow.dir[1] * bow.k, bow.dir[2] * bow.k]; mat.boost.on = bow.k > 0;
    kepler.setBow(bow); schedule(TIER.PRESENT);
  }
  /* THE BOW LANDS ASYNCHRONOUSLY (wave 45).  The slap (kick.js) or the packet (well.js) is computed in the maths
     worker and lands when it answers — the pointer is free the moment the finger lifts (measured before: 127 ms on
     the first hydrogen bow, 191 ms + a 1.2 s frame on a BOX bow).  bowChain is the queue: two bows in flight land in
     order, on the state the first one left; LW.bow.landed resolves when the queue is empty.  The SLAP trigger, the K
     key and LAUNCH keep the synchronous road. */
  let bowChain = Promise.resolve(), bowInFlight = 0;
  function bowRelease() {
    if (!bow) return;
    const k = bow.k, dir = bow.dir, x0 = bow.x0, y0 = bow.y0; bowCancel();
    if (k <= 0.005) return;
    const job = getHamiltonian().id === 'well' ? () => launchPacketAsync(unproject(x0, y0), dir.map((v) => v * k), gasSigma(k)) : () => slapAlongAsync(k, dir);   // the GAS: a new packet where you pressed
    bowInFlight++; wState.setStatus('the impulse is in flight…', 'live');
    bowChain = bowChain.then(job).catch((e) => { __e.push('BOW ' + (e && e.message || e)); }).then(() => { if (--bowInFlight === 0) wState.setStatus('changes c'); });
  }
  /** the BOX bow: wellPacket in the worker, the same numbers as launchPacket, landed on the clock's time when it answers */
  async function launchPacketAsync(x0, kvec, sigma) {
    if (gasAxial || !maths.ok) { launchPacket(x0, kvec, sigma); return; }
    const r = await maths.call({ op: 'packet', x0, k: kvec, sigma, radius: HAMILTONIANS.well.radius });
    if (!r || r.error) { launchPacket(x0, kvec, sigma); return; }
    if (getHamiltonian().id !== 'well' || gasAxial) return;                             // the box was left while the packet was in flight
    reg.clear(); for (let a = 0; a < 91; a++) if (r.re[a] || r.im[a]) reg.set(a, r.re[a], r.im[a], clock.t);
    lastLaunch = { x0, k: kvec, sigma, captured: r.captured };
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
  let kdrag = null;
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
  let gasWidth = 1.8, gasAxial = false;
  const gas = createGas(HAMILTONIANS.well.radius);
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
  const gasTableOn = (on) => gas.setTable(on, (tab) => exportLocked ? null : !!(field.ok && field.setGasTable && field.setGasTable(tab)), () => { if (gas.on) schedule(TIER.RECONSTRUCT); });
  const gasSigma = (k) => Math.max(0.5, Math.min(3, gasWidth * (1 - 0.18 * Math.min(k, 3))));
  function launchPacket(x0, kvec, sigma) {
    if (gasAxial) {                                                      // the AXIAL register: along z, on the axis
      const A = HAMILTONIANS.well.radius, z0 = Math.max(-0.8 * A, Math.min(0.8 * A, x0[2] || -A / 2)), kz = kvec[2] !== 0 ? kvec[2] : Math.hypot(...kvec);
      const G = gas.launch(z0, kz, sigma, clock.t);
      reg.clear(); refSnapshot = null;
      lastLaunch = { x0: [0, 0, z0], k: [0, 0, kz], sigma, captured: G.captured, axial: true };
      if (ui.gasRo) { ui.gasRo.set(`${(100 * G.captured).toFixed(1)}% held · axial`, G.captured > 0.85 ? 'ok' : 'warn'); ui.gasRo.setSub(`σ = ${sigma.toFixed(2)} a₀ at z = ${z0.toFixed(1)} · k = ${kz.toFixed(2)} along z · ${G.modes} modes (m = 0, l ≤ 15)`); }
      touchState(); return;
    }
    const P = wellPacket(x0, kvec, sigma);
    reg.clear(); for (let a = 0; a < 91; a++) if (P.re[a] || P.im[a]) reg.set(a, P.re[a], P.im[a], clock.t);
    lastLaunch = { x0, k: kvec, sigma, captured: P.captured };
    if (ui.gasRo) { ui.gasRo.set(`${(100 * P.captured).toFixed(1)}% held`, P.captured > 0.85 ? 'ok' : 'warn'); ui.gasRo.setSub(`σ = ${sigma.toFixed(2)} a₀ at (${x0.map((v) => v.toFixed(1)).join(', ')}) · |k| = ${Math.hypot(...kvec).toFixed(2)} · the box resolves ≈ a/6 = ${(HAMILTONIANS.well.radius / 6).toFixed(1)} a₀`); }
    touchState();
  }
  let lastLaunch = null;

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
    lastLaunch = { x0: [0, 0, 0], k: d.map((v) => v * k), sigma: 1 / Math.SQRT2, captured: reg.norm2(), coherent: true };
    if (ui.gasRo) { ui.gasRo.set(`coherent · |α|² = ${(k * k / 2).toFixed(2)}`, 'ok'); ui.gasRo.setSub(`⟨z⟩ = ${k.toFixed(2)} sin t · rigid · period 2π · ${(100 * reg.norm2()).toFixed(2)}% in N ≤ 10`); }
    touchState();
    if (!clock.playing) { clock.play(performance.now() / 1000); schedule(TIER.EVOLVE); }
  }
  function bowCancel() {
    bow = null; mat.boost.on = false; kepler.setBow(null); keplerDirty = true;   // one clearing draw of the KEPLER canvas after the arrow
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
  window.addEventListener('keyup', (e) => { if (e.key === 'Control' && bow) bowCancel(); });

  /* ── THE FLOATING RACK: hide button, hover-reveal, draggable cards, hint icons, the transport's dock ── */
  const rackL = document.getElementById('rackL');
  for (const rk of [rack, rackL]) if (rk) rk.addEventListener('scroll', () => { gov.scroll = performance.now(); }, { passive: true });   // wave 45: a scrolling rack makes every reader yield for 150 ms
  /* body.rack-l says the mirror rack holds cards: the stage captions step right of it */
  if (rackL) { const syncL = () => document.body.classList.toggle('rack-l', rackL.children.length > 0); new MutationObserver(syncL).observe(rackL, { childList: true }); syncL(); }
  const LAYOUT_SLOTS = 4;      // wave 54: four favourite layouts, numbered — see the note at the ☆ button


  const floats = document.getElementById('floats');
  /* ── INK STAYS UNDER GLASS (2026-09-11) ─────────────────────────────────────────────────────────
   * The field's frame, axes and slice outline are 1-px lines drawn on the stage; a translucent pane over
   * the stage showed them as a hairline through a device's title. Skip only PAINTED surfaces, not the
   * transparent layout box around a disconnected card or the modulation constellation. Otherwise the
   * frame is cut into a moving rectangle wherever that box goes. Rectangles are gathered here — one
   * layout burst, at most every 300 ms while a frame runs, and never inside a paint.  0.5.0 A7: each species is a
   * provider in lab/occlusion.js, registered below in the old order; this host converts, clears and presents. */
  const NO_OCCLUSION = [];
  function refreshOcclusion(nowMs) {
    occludeDirty = false; occludeAt = nowMs;
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
  { const body = document.body, { root: mw, rail } = modView, dirty = occlusion.dirty, shown = (d) => !d.hidden && !d.classList.contains('closed');
    const rackShown = () => !body.classList.contains('rack-hidden') || body.classList.contains('rack-peek'), rects = (els) => els.map((s) => paintedRect(s));
    /* a card is one pane, or (DISCONNECTED, never on a phone) its head and its body with the stage showing between them */
    const panes = (d) => body.classList.contains('disconnected') && !body.classList.contains('phone') ? [d.querySelector('.dev-head'), d.querySelector('.dev-body')] : [d];
    /* Device cards scroll inside the modulation run. Their offscreen bounds must not mask the stage. */
    occlusion.register('modwin', () => shown(mw) ? [...mw.querySelectorAll('.m2rail, .m2dev, .m2workbar')].map((s) => paintedRect(s, s.classList.contains('m2dev') && s.closest('.m2run'))) : []);
    occlusion.register('chiprail', () => shown(rail) ? rects([...rail.querySelectorAll('.crail-chip')]) : []);
    /* 0.5.0 C4: the kit's window travels (tweenRect) and fades (presence); its `hidden` lands when the exit ends, and onGeometry
       tells every place, landing, open and close — both are the one producer's, so a paused field's mask follows them */
    for (const el of [mw, rail]) occlusion.watch(el, { attributes: true, attributeFilter: ['hidden'] });
    modView.onGeometry(dirty);
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
  const devById = (id) => document.querySelector('.dev[data-id="' + id + '"]');
  /** a rack card's width, from the RACK's own content box — the scrollbar is already out of clientWidth */
  const rackCardWidth = () => { const cs = getComputedStyle(rack); return Math.max(180, Math.round(rack.clientWidth - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0))); };
  /** the TRANSPORT's pop chip wears the act its next press performs (its floating mode is the pill); every other card's is the kit's */
  function popFace(d) {
    const b = d && d.querySelector('.dev-pop'); if (!b) return;
    chip(b, layout.docked ? 'north' : 'reopen', layout.docked ? 'undock the transport' : 'dock the transport');
    b.title = 'Dock or undock the transport';
  }
  /* ── 0.5.0 C3 · THE RACK IS THE KIT'S (lab/mir/shell/rack.js createRack; research/release-0.5.0/C3-DESIGN.md §2–3) ──────────
   * #rack, #rackL, #floats and the ◧ + ☆ chrome are adopted BY ID (their classes, sheets and listeners kept) and every .dev is
   * registered IN PLACE: the float layer, the ONE gesture (THE TITLE BAR DECIDES), BASINS' motion, ONE raise stack, the clamp,
   * hide and peek, the + and ☆ lists and the phone's crossing of cards and floats are the kit's.  What stays here is the
   * WORKSPACE record's shape — captureLayout's v3, so every ☆ slot and project part is a record 0.4.0 reads — and what the
   * kit's record does not carry: the transport's dock and the MORE / CORE folds (layoutExtras), the transport card itself
   * (`card: true`), and `hidden` (a legacy card, a card a molecule stood down) kept out of the + list.  A reload keeps only
   * `closed`, as before (saveSettings), so the store hands the kit its ☆ slots and no layout. */
  const sideKey = (s) => (s === 'L' || s === 'left' ? 'left' : s === 'R' || s === 'right' ? 'right' : undefined), sideLR = (s) => (s === 'left' ? 'L' : 'R');
  let parkedIds = [];   // the floats the crossing parks (the kit's memory is private: BRIEF R2), read by this listener, registered AHEAD of the kit's
  window.addEventListener('resize', () => { if (!rk.phone && isPhone()) parkedIds = rk.floating(); }, { passive: true });
  const rk = createRack({ host: document.getElementById('lab'), favourites: LAYOUT_SLOTS, handle: 'never', tabletClamp: false, phone: isPhone, retired: RETIRED_WINDOWS,
    notebook: () => (layout.notebookSize ? { size: layout.notebookSize, resize: layout.notebookResize } : null),
    store: {
      get: () => ({ favs: readSettings().layouts || {} }),
      /* a slot the kit has just captured (its v1) is written as captureLayout's v3 of the same instant; nothing else is the kit's to write */
      set(v) {
        const S = readSettings(), was = S.layouts || {}, m = { ...((v && v.favs) || {}) };
        for (const k of Object.keys(m)) if (m[k] && m[k].v === 1 && (!was[k] || was[k].at !== m[k].at)) m[k] = layout.captureLayout();
        if (JSON.stringify(m) !== JSON.stringify(was)) settingsStore.write({ ...S, layouts: m });
      },
    },
    onChange: () => occlusion.dirty() });   // a kit-side act moved a window: the mask follows (what is remembered is saveSettings', on its own edges)
  const devTitle = (d) => ((d.querySelector('.dev-eyebrow') || {}).textContent || d.dataset.id).trim();
  for (const d of document.querySelectorAll('#rackL > .dev, #rack > .dev')) rk.register({ id: d.dataset.id, el: DEVICES.get(d.dataset.id) || d, title: devTitle(d), hint: ((d.querySelector('.dev-title') || {}).textContent || '').trim() });
  /* the kit's + list knows nothing of `hidden` (a legacy card, or one a molecule stood down): those rows go (BRIEF R5) */
  if (rk.el.add) rk.el.add.addEventListener('click', () => { for (const it of rk.el.addList.querySelectorAll('.mb-item[data-win]')) { const d = devById(it.dataset.win); if (d && d.hidden) it.remove(); } });
  if (rk.el.toggle) rk.el.toggle.addEventListener('click', () => saveSettings());   // wave 59 (B111): the kit's ◧ hides by setHidden alone; on a phone the press IS the browser saying which it wants, stored as the B key stores it
  /* the ☆ list's LOAD is the kit's apply; the extras follow from the same slot once its click is done (BRIEF R4) */
  if (rk.el.favList) rk.el.favList.addEventListener('click', (e) => {
    const it = e.target.closest('.mb-item'); if (!it || e.target.closest('.fav-x')) return;
    const L = rk.layouts()[[...rk.el.favList.querySelectorAll('.mb-item')].indexOf(it) - 1], R = L && (readSettings().layouts || {})[L.slot];
    if (R) queueMicrotask(() => { if (typeof R.docked === 'boolean' && R.docked !== layout.docked) layout.dockTransport(); layoutExtras(R); saveSettings(); });
  }, { capture: true });
  /** what the kit's readLayout does not carry: the TRANSPORT card's seat and state (`card: true`) and the folds a card keeps in the record */
  function layoutExtras(L) {
    for (const c of L.cards) {
      const d = devById(c.id); if (!d) continue;
      if (d === wTr.root) {
        layout.dockSide = sideKey(c.side) === 'left' ? 'L' : 'R'; layout.dockIndex = [...d.parentElement.querySelectorAll('.dev')].indexOf(d);   // project order owns the docked transport seat too
        d.classList.toggle('closed', c.closed === true || c.open === false);
        if (d.classList.contains('folded') !== !!c.folded) { const f = d.querySelector('.dev-fold'); if (f) f.click(); }
      }
      const mt = typeof c.more === 'boolean' ? d.querySelector('.mol-more-toggle') : null;   // an older record has no `more`: the fold stays as it is
      if (mt && (mt.getAttribute('aria-expanded') === 'true') !== c.more) mt.click();
      const ct = typeof c.core === 'boolean' ? d.querySelector('.orb-core-toggle') : null;   // likewise MO-REGISTRY's CORE fold
      if (ct && (ct.getAttribute('aria-expanded') === 'true') !== c.core) ct.click();
    }
  }
  const layout = {
    toggleRack() { rk.setHidden(!rk.hidden); saveSettings(); },   // wave 59: on a phone the press IS the browser saying which it wants (see enterPhone)
    /** move a card to the other rack (or to a named side) — the MIRROR: same windows, either side */
    moveToRack(id, side) {
      const card = document.querySelector('.dev[data-id="' + id + '"]'); if (!card || !rackL) return false;
      const target = side === 'L' ? rackL : side === 'R' ? rack : (card.parentElement === rack ? rackL : rack);
      target.appendChild(card); return true;
    },
    /* WAVE 55: which rack a window BELONGS TO.  A floating card's parent is the float layer, so reading
       the parent would answer 'R' for a window whose home is the mirror rack — and `captureLayout`,
       `dockWindow` and the ⇄ all mean the HOME.  Ask the float record first. */
    side(id) { const st = rk.floatOf(id); if (st) return sideLR(st.home.side); const card = document.querySelector('.dev[data-id="' + id + '"]'); return card && card.parentElement === rackL ? 'L' : 'R'; },
    moveCard(id, index) { const list = [...rack.querySelectorAll('.dev')]; const card = list.find((d) => d.dataset.id === id); if (!card) return false; const rest = list.filter((d) => d !== card); const ref = rest[Math.max(0, Math.min(index, rest.length))] || null; rack.insertBefore(card, ref); return true; },
    order() { return [...rack.querySelectorAll('.dev')].map((d) => d.dataset.id); },
    orderAll() { return [...document.querySelectorAll('#rackL .dev, #rack .dev')].map((d) => d.dataset.id); },
    docked: false,
    dockSide: 'L',
    dockIndex: 0,                                                    // the transport's remembered slot in the left rack (0 = the very top)
    /** where a docked transport lives: the mirror rack on a desktop, the ONE rack on a phone (wave 51) */
    dockHost() { return document.body.classList.contains('phone') ? rack : (layout.dockSide==='R'?rack:(rackL || rack)); },
    dockTransport() {
      const tr = document.getElementById('transport'); if (!tr) return;
      layout.docked = !layout.docked;
      const host = layout.dockHost();
      if (layout.docked) {
        wTr.root.hidden = false;wTr.root.classList.remove('closed','folded');wTr.body.hidden=false; wTr.body.appendChild(tr); tr.classList.add('docked'); tr.classList.remove('mini');
        const cards = [...host.querySelectorAll('.dev')].filter((d) => d !== wTr.root);
        host.insertBefore(wTr.root, cards[Math.min(layout.dockIndex, cards.length)] || null);
      } else {
        layout.dockSide=wTr.root.parentElement===rackL?'L':'R';const cards = [...wTr.root.parentElement.querySelectorAll('.dev')]; layout.dockIndex = Math.max(0, cards.indexOf(wTr.root));
        dom.stage.appendChild(tr); tr.classList.remove('docked'); tr.classList.add('mini'); wTr.root.hidden = true;
      }
      schedule(TIER.PRESENT);
      popFace(wTr.root);                                             // the pop chip and the pill's own dock chip say the same thing
    },
    /* ── the kit's float verbs under their 0.4.0 names (C3-DESIGN §2): a home side is 'L'/'R' here, 'left'/'right' in the kit ── */
    floating: () => rk.floating(),
    isFloating: (id) => rk.floating().includes(id),
    floatOf(id) { const st = rk.floatOf(id); return st ? { x: st.x, y: st.y, w: st.w, compact: !!st.compact, z: rk.floating().indexOf(id), home: { side: sideLR(st.home.side), index: st.home.index } } : null; },
    /** TAKE IT OFF THE RACK.  `at` overrides the landing spot and the home slot (a saved layout supplies both); the TRANSPORT's floating mode is the pill */
    popOut(id, at) {
      if (id === 'transport') { if (layout.docked) layout.dockTransport(); return true; }
      const a = { ...(at || {}), w: (at && at.w) || rackCardWidth() };
      if (at && at.home) a.home = { side: sideKey(at.home.side) || 'right', index: Math.max(0, at.home.index | 0) };
      return rk.float(id, a);
    },
    dockWindow(id) { if (id === 'transport') { if (!layout.docked) layout.dockTransport(); return true; } return rk.dock(id); },
    toggleFloat(id) { if (id === 'transport') { layout.dockTransport(); return true; } return rk.toggleFloat(id); },
    setCompact: (id, on) => rk.setCompact(id, on),
    /** the kit has no move for a float (BRIEF R1): dock and float it again at (x, y), clamped, in the same seat of the layer */
    moveFloat(id, x, y) { const st = rk.floatOf(id), d = devById(id), next = d && d.nextElementSibling; if (!st) return false; rk.dock(id); const ok = rk.float(id, { x, y, w: st.w, compact: st.compact, home: st.home }); if (next && next.parentElement === floats) floats.insertBefore(d, next); return ok; },
    raiseFloat: (id) => rk.floating().includes(id) && rk.float(id),
    /** every floating window home again — RESET LAYOUT, and any layout that predates floating */
    dockAll(remember) { const kept = {}; for (const id of rk.floating()) { if (remember) kept[id] = layout.floatOf(id); rk.dock(id); } return kept; },
    /** to the top of its rack, unfolded, the rack shown — or, floating, to the FRONT; a hidden legacy card comes back by id */
    raise(id) { const dev = devById(id); if (!dev) return false; dev.hidden = false; rk.raise(id); saveSettings(); return true; },
    /** the ids of windows that no longer exist, and the window that absorbed each of them (wave 56) */
    retired: RETIRED_WINDOWS,
    /** reopen a closed window into a rack (default: the one it was in) */
    reopen(id, side) { const dev = devById(id); if (!dev) return false; dev.hidden = false; rk.open(id, { side: sideKey(side) }); saveSettings(); return true; },
    closed() { return [...document.querySelectorAll('.dev.closed')].map((d) => d.dataset.id); },
    /* ── FAVOURITE LAYOUTS (wave 54): capture, restore, and the four slots in this browser's settings key ──── */
    /** THE ARRANGEMENT, and nothing else.  Order is the ARRAY's order — restoring appends in it, which reproduces
     *  the order exactly — and the three per-card states are read off the classes that carry them. */
    captureLayout() {
      const nb = document.getElementById('notebook');
      /* WAVE 55: `v: 2` adds ONE optional key per card — `float` — and nothing else moved, so a v1 layout
         saved before this wave still loads: it simply has no card with a `float`, which is exactly what
         "nothing was floating" means.  A floating card keeps its HOME side and index in the record, not
         the layer it is sitting in, so docking it back after a load puts it where it came from. */
      return { v: 3, at: Date.now(),
        cards: [...document.querySelectorAll('#rackL .dev, #rack .dev, #floats .dev')].map((d) => {
          /* WAVE 59 · ON A PHONE `#rackL` IS EMPTY, so `d.parentElement === rackL` was false for EVERY card and
             every one was saved `side: 'R'`.  `enterPhone()` leaves `data-phone-from` on exactly the cards that
             came from the mirror rack — wave 51 created that breadcrumb for this — and `applyLayout` already
             read it; only the capture did not, and the asymmetry was the bug.  With the shipped arrangement
             (SPECTRUM lives on the LEFT rack out of the box) that meant: rotate a tablet past the breakpoint,
             press ☆, rotate back, load — and the mirror rack is empty for ever. */
          const st = rk.floatOf(d.dataset.id), mt = d.querySelector('.mol-more-toggle');   // 0.4.0 S0: MOLECULES' MORE fold is the card's own WORKSPACE key
          const ct = d.querySelector('.orb-core-toggle');                                      // 0.4.0 S1: MO-REGISTRY's CORE fold, the same kind of key
          return { id: d.dataset.id, side: st ? sideLR(st.home.side) : (d.dataset.phoneFrom === 'left' || d.parentElement === rackL ? 'L' : 'R'),
            folded: d.classList.contains('folded'), closed: d.classList.contains('closed'), off: d.classList.contains('off'),
            float: st ? { x: st.x, y: st.y, w: st.w, compact: !!st.compact, z: rk.floating().indexOf(d.dataset.id), index: st.home.index } : null,
            ...(mt ? { more: mt.getAttribute('aria-expanded') === 'true' } : {}), ...(ct ? { core: ct.getAttribute('aria-expanded') === 'true' } : {}) };
        }),
        docked: !!layout.docked, rackHidden: document.body.classList.contains('rack-hidden'),
        /* 0.3.1 · S1: the `look` and `cam` blocks this record carried are gone — applyLayout never read either, and between
           them they wrote the accents, the field chrome and the camera's feel (PREFERENCE) into every project and link. */
        nb: nb && nb.style.width ? [parseInt(nb.style.width, 10) || 0, parseInt(nb.style.height, 10) || 0] : null };
    },
    /** put it back: the kit's apply (a retired id opens its heir, a phone parks the floats, `nb` sizes the notebook), then the extras */
    applyLayout(L) {
      if (!L || !Array.isArray(L.cards)) return false;
      if (typeof L.docked === 'boolean' && L.docked !== layout.docked) layout.dockTransport();
      rk.apply(L); layoutExtras(L);
      if (document.body.classList.contains('phone')) parkedIds = L.cards.filter((c) => c.float && !c.closed && c.open !== false).map((c) => (RETIRED_WINDOWS[c.id] && !L.cards.some((q) => q.id === RETIRED_WINDOWS[c.id]) ? RETIRED_WINDOWS[c.id] : c.id));
      saveSettings(); schedule(TIER.PRESENT);
      return true;
    },
    layoutLabel: (L, slot) => rackLayoutLabel(readLayout(L, null, RETIRED_WINDOWS), slot),
    layouts: () => rk.layouts(),
    saveLayout: (slot) => rk.saveLayout(slot),
    loadLayout(slot) { const m = readSettings().layouts || {}; return m[slot] ? layout.applyLayout(m[slot]) : false; },
    forgetLayout: (slot) => rk.forgetLayout(slot),
    /** RESET LAYOUT: the kit's (every float home, every window opened, powered and unfolded, on its home rack, the rack shown); the transport's dock is λWAVES' */
    resetLayout() {
      rk.resetLayout();
      const ph = document.body.classList.contains('phone');
      if (ph) parkedIds = [];
      if (layout.docked !== ph) layout.dockTransport();                       // wave 51: on a phone the transport is DOCKED, not floating — reset does not undock it
      if (ph) rack.insertBefore(wTr.root, rack.firstElementChild);            // … and it goes back to the TOP of the one rack
      saveSettings();
    },
    /** an INFO panel's digest: every readout, the status, and the module's own table — as text for the notebook */
    digest(id) {
      const dev = document.querySelector('.dev[data-id="' + id + '"]'); if (!dev) return '';
      const own = DIGESTS[id] ? DIGESTS[id]() : ''; if (own && own.md !== undefined) return own.md;   // a window whose copy is markdown (CALCULUS' prose figure) copies that alone
      const lines = ['λWAVES · ' + dev.querySelector('.dev-title').textContent + ' · t = ' + clock.t.toFixed(4) + ' · ' + new Date().toISOString()];
      const st = dev.querySelector('.dev-stat'); if (st && st.textContent.trim()) lines.push('status\t' + st.textContent.trim());
      for (const ro of dev.querySelectorAll('.ro')) { const l = ro.querySelector('.ro-lbl'), v = ro.querySelector('.ro-val'), s = ro.querySelector('.ro-sub'); lines.push([l ? l.textContent.trim() : '', v ? v.textContent.trim() : '', s ? s.textContent.trim() : ''].join('\t')); }
      if (own) lines.push('', own);
      return lines.join('\n');
    },
    /** THE ONE CLIPBOARD ROAD for a window's copy: write the text, flash `copied` on the window (· COPIED on its status line) */
    async copyText(id, t) { try { await navigator.clipboard.writeText(t); } catch (e) {} const dev = document.querySelector('.dev[data-id="' + id + '"]'); if (dev) { dev.classList.add('copied'); setTimeout(() => dev.classList.remove('copied'), 900); } return t; },
    copyDigest(id) { return layout.copyText(id, layout.digest(id)); },
  };
  /** a window's hover hint in the + list and the WINDOW menu: its long title, and its status when it says something (wave 44) */
  const winHint = (d) => { const t = (d.querySelector('.dev-title') || {}).textContent || '', st = ((d.querySelector('.dev-stat') || {}).textContent || '').trim(); return st ? t + '  ·  ' + st : t; };
  const wTr = device({ id: 'transport', eyebrow: 'TRANSPORT', status: '' });
  wTr.root.hidden = true; (rackL || rack).appendChild(wTr.root);
  windowActivity.track(wTr);
  rk.register({ id: 'transport', el: wTr, title: 'TRANSPORT', card: true, onFold: () => saveSettings() }); popFace(wTr.root);   // C3: an app card (its own buttons; in neither + nor WINDOW)
  { const p = wTr.root.querySelector('.dev-pop'); if (p) p.addEventListener('click', (e) => { e.stopPropagation(); layout.dockTransport(); }); }
  {
    /* WAVE 62 · THE SKIP LINKS MOVE FOCUS THEMSELVES.  The anchors are real anchors — without script
       the browser's own fragment jump still lands on a `tabindex="-1"` rack — but in THIS app the
       FRAGMENT IS THE STATE ADDRESS (wave 56 mints `#s=…` and listens on `hashchange`), so writing
       `#rack` into it would push a junk address into the URL and the history for a focus move.
       `readLink()` returns null for a fragment with no `s=` key, so nothing would have broken; the
       address bar is the reason, and one preventDefault is the whole cost. */
    for (const a of document.querySelectorAll('a.skip')) {
      a.addEventListener('click', (e) => { const t = document.querySelector(a.getAttribute('href')); if (!t) return; e.preventDefault(); t.focus(); });
    }
    /* a dock button on the transport itself */
    const tr = document.getElementById('transport');
    /* WAVE 55: the same drawing every floating window's DOCK chip wears — one mark, one meaning, and never
       a text character (glyph.js: iOS answers several of ours with a colour emoji). */
    if (tr) { const b = el('button', 'dock-btn', tr); b.type = 'button'; b.dataset.keyAction = 'dock';


      chip(b, 'north', 'dock the transport into the rack'); b.title = 'move the transport between the stage and the rack (T)'; b.addEventListener('click', () => layout.dockTransport()); }


    if (tr) {
      const e = el('button', 'mod-exp mod-logo', tr); e.type = 'button'; e.dataset.keyAction = 'modulation';
      /* WAVE 55: the mark is now the POP-OUT's, because that is literally what the press does — the pill's
         EXPAND opens modulation as a FLOATING window over the stage, not as a card in the rack. */


      const lg = document.querySelector('#title .mark');
      if (lg) { const c = lg.cloneNode(true); c.removeAttribute('aria-hidden'); e.appendChild(c); }
      e.setAttribute('aria-label', 'open the modulation window');
      e.title = 'Open the modulation window';
      e.addEventListener('click', () => layout.modulation.toggle());
      const spinLogo = (reverse) => { const mark = e.querySelector('.mark'); if (!mark) return; if (e._spin) e._spin.cancel(); e._spin = mark.animate([{ transform: 'rotate(0deg)' }, { transform: `rotate(${reverse ? -360 : 360}deg)` }], { duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 550, easing: 'ease-in-out' }); };
      e.addEventListener('pointerenter', () => spinLogo(false));
      e.addEventListener('pointerleave', () => spinLogo(true));
      ui.modExp = e;
    }
    /** THE EXPANSION.  Not layout.raise(): on a phone the transport is docked at the TOP of the one
     *  rack and must stay there, so the window opens directly BENEATH it rather than above it. */


    layout.modulation = {
      get open() { return !!(modView && modView.isOpen); },
      expand() {
        if (!modView) return false;
        /* 2026-09-24 · open() ALONE (optimization LB1, AUDIT-E FE3).  open() already runs rebuild(); place();
           paint(true), and nothing between it and the old wake() touched the model or the registry, so wake()'s
           second rebuild + paint re-read the same model into the same DOM for 15–28 ms per open. */
        modView.open();
        document.body.classList.remove('rack-hidden');
        saveSettings(); schedule(TIER.PRESENT); return true;
      },
      /** Collapse releases preview-only work. Any route still drives its parameter. */
      collapse() { if (!modView) return false; modView.close(); saveSettings(); schedule(TIER.PRESENT); return true; },
      toggle() { return layout.modulation.open ? layout.modulation.collapse() : layout.modulation.expand(); },
    };
    /* FILE › EXPORT SHAPE (GLB · OBJ · STL) and EXPORT GRID (NPZ · CUBE), wave 134.  THE LAW: what is on screen, by
       the road it came — the grid is field.readGrid()'s own texels, the ISO is mat.iso, the colour is the phase
       view's own LUT (toLUT(palette.stops), the same CPU function the SLICE plane reads), the camera is
       cameraBasis(obs) at THIS press.  Marching cubes and every writer run in the `cards` worker queue (parked like
       a card prep, never the frame thread); the download is capture()'s own save() (no copy of its ZIP writer). */
    const exportLabel = () => { try { if (reg.preset) return reg.preset; const pop = reg.populated ? reg.populated() : []; return pop.length ? pop.length + 'modes' : 'state'; } catch (_) { return 'state'; } };
    exporter3d = createExporter({
      field: () => field,
      scene: () => {
        const E = cameraEye(obs, 1), B = E.basis, w = dom.canvas.clientWidth || 1, h = dom.canvas.clientHeight || 1;
        const q = chem && chem.on && chem.query ? chem.query() : null;
        return {
          label: exportLabel(), build: BUILD_LINE, t: clock.t, space, isoFrac: mat.iso,
          colour: { on: !!(palette && palette.on), hue: mat.hueShift || 0, invert: !!mat.invert, lut: (palette && palette.on) ? toLUT(palette.stops) : null },
          camera: { eye: E.eye, dir: B.dir, right: B.right, up: B.up, yfov: obs.fov || 0.6, aspect: w / h, shift: E.shift },   // the eye in half-units: the worker scales it by its grid's half; S2: the lens shift rides as extras
          atoms: q ? q.atoms : [{ Z: getZ(), x: 0, y: 0, z: 0 }],
        };
      },
      post: (msg, transfer) => cards.call(msg, transfer),
      save: (r) => capApi.capture.save(r),   /* capApi (depth-1, like exporter3d) wraps the CAPTURE group's own capture()/cap, built lazily there */
      status: (text, cls) => { if (ui.set) ui.set.setStatus(text, cls); },
      names: () => (chem && chem.on && chem.exportNames ? chem.exportNames() : null),   // 0.4.0 S1: the orbital's name rides in the file's metadata
    });

    /* the logo opens FILE · EDIT · WINDOW */
    const title = document.getElementById('title');
    if (title) {
      /* OPTIMIZATION 2026-09-24 · N1 · THE ROWS CALL FUNCTIONS (AUDIT-E FE1, REFUTE-D/F).  They used to reach controls
         by LABEL (`clickTrig`: the first `.trig` in document order with that text) and by KEY CODE (`runKey`: the first
         ctrl-less action bound to a code), and three rows were wrong on a first visit: RESEED ran `camReset` (the
         camera snapped home, no particles), RESET KEYS clicked a trigger deleted in 5f6421e, and CLEAR pressed one of
         five CLEARs — the undo ring's once HISTORY floated.  Every row now names its act: an ACTION by id (run with
         fine = 1, as a bare key press runs it) or a named function, and its key hint is read from the live binding
         (keyFor), so a rebind renames the row (ANTI-PATTERN 6). */
      const runAction = (id) => { const a = ACTIONS.find((x) => x.id === id); if (a) a.run(1); };
      const keyFor = (id) => kt.keyText(id);
      const MENUS = {
        FILE: () => [['NEW project', () => layout.projects.requestFresh()], ['SAVE project' + (layout.projects.current ? '  ' + layout.projects.current : '…') + '\t' + keyFor('save'), () => { if (layout.projects.current) layout.projects.save(); else { layout.notebook.open('projects'); } }], ['SAVE project AS…\t' + keyFor('saveAs'), () => layout.notebook.open('projects')], ['OPEN a project…', () => layout.notebook.open('projects')],
          ...layout.projects.recent().slice(0, 5).map((p) => ['↺  ' + p, () => layout.projects.requestOpen(p), null, '', { raw: true }]),
          null,
          ['EXPORT project (.json)', () => layout.projects.download()], ['IMPORT project (.json)…', () => layout.projects.pick()],
          null,
          ['SAVE the experiment (quick)', () => save()], ['LOAD the last quick save', () => restore()], ['COPY as JSON', () => copyJSON()],
          ['COPY a LINK to this state', () => copyLink(), null, 'a URL that reopens this exact state — the STATE card says how long it is and what format v1 could not carry (the MOLECULE panel and the MODULATION rack)'],
          null,
          ...SHAPE_EXPORTS.map((spec) => [spec.row, () => exporter3d.run(spec.fmt), () => exporter3d.busy || !field.ok, spec.tip])],
        EDIT: () => [['UNDO\t' + keyFor('undo'), () => historyApi.undo(), () => !historyApi.canUndo], ['REDO\t' + keyFor('redo'), () => historyApi.redo(), () => !historyApi.canRedo], ['HISTORY UNDO\t' + keyFor('historyUndo'), () => historyApi.historyUndo(), () => !historyApi.canHistoryUndo, 'return once to the timeline that existed before the last history-row jump'], ['UNDO HISTORY…', () => layout.raise('history')], null,
          ['PLAY / PAUSE\t' + keyFor('transport.play'), () => runAction('transport.play')], ['NORMALIZE', () => normalizeNow()], ['COPY the state as LaTeX', () => copyLatex(), null, 'the populated states in chemistry order, in the notebook\'s LaTeX — two lines: the list, then ψ with amplitudes and phases; under a molecule, the molecule\'s page: formula, RHF/basis, E and the ε ladder'], ['CLEAR the register', () => clearRegister()], ['RESET the view\t' + keyFor('camReset'), () => resetView()], ['RESEED the particles\t' + keyFor('reseed'), () => runAction('reseed')], null, ['RESET the key bindings', () => __LW_hooks.keys.reset()], ['SETTINGS…\t' + keyFor('settings'), () => layout.raise('settings')]],


        VIEW: () => [['INVERT the cloud \u2014 ink, not light', () => LW.setInvert(!mat.invert), null, 'draw the cloud as ink rather than light; the transfer is inverted and ψ is not touched'], ['ρ = |ψ|²  density', () => LW.setView('density')], ['arg ψ  phase\t' + keyFor('view') + ' cycles', () => LW.setView('phase')], ['Re ψ', () => LW.setView('real')], ['Im ψ', () => LW.setView('imag')], ['Δρ  difference', () => LW.setView('diff')], ['Re + Im  superposed (heuristic)', () => LW.setView('reim')],
          ['— style: CLOUD\t' + keyFor('style') + ' cycles', () => LW.setStyle('cloud')], ['— style: SOLID', () => LW.setStyle('solid')], ['— style: GRAIN', () => LW.setStyle('grain')], ['— style: SIGNED', () => LW.setStyle('signed')], ['— style: BANDS', () => LW.setStyle('bands')],
          ['STAGE CAPTIONS  on / off', () => ui.capSw && ui.capSw.root.click()], ['STAGE TEXT  on / off', () => ui.molFormulaSw && ui.molFormulaSw.root.click()], ['STATUS TAGS  on / off', () => ui.badgesSw && ui.badgesSw.root.click()], ['CONTROL HINTS  on / off', () => ui.controlHintsSw && ui.controlHintsSw.root.click()], ['HIDE the interface\t' + keyFor('hide'), () => runAction('hide')], ['FULL SCREEN / back\t' + keyFor('fullscreen'), () => toggleFullscreen()]],


        WINDOW: () => [['MODULATION\t' + keyFor('modulation'), () => layout.modulation.toggle()], ['TIMELINE', () => runAction('timeline')], ['NOTEBOOK\t' + keyFor('notebook'), () => layout.notebook.toggle()], ['HIDE / SHOW the rack\t' + keyFor('rack'), () => layout.toggleRack()], ['DOCK / UNDOCK the transport\t' + keyFor('dock'), () => layout.dockTransport()], ['HIDE the interface\t' + keyFor('hide'), () => runAction('hide')], ['SHOW / HIDE help\t' + keyFor('notes'), () => runAction('notes')], null, ['THEME · LIGHT', () => __LW_hooks.setTheme && __LW_hooks.setTheme('light')], ['THEME · DARK', () => __LW_hooks.setTheme && __LW_hooks.setTheme('dark')], ['THEME · SYSTEM', () => __LW_hooks.setTheme && __LW_hooks.setTheme('system')], null,
          ...[...document.querySelectorAll('.dev:not([hidden])')].map((d) => [(d.classList.contains('closed') ? '⊕  ' : '↑  ') + d.querySelector('.dev-eyebrow').textContent, () => layout.raise(d.dataset.id), null, winHint(d)])],


        ABOUT: () => [['ABOUT λWAVES', () => layout.notebook.open('about')], ['KEYBOARD SHORTCUTS…\t' + keyFor('help'), () => layout.keymap.toggle()], ['SETTINGS…\t' + keyFor('settings'), () => layout.raise('settings')], null, ['UPDATE APP', () => swClient.refresh(), null, 'check for a new build, rebuild the offline cache, and reload']],
      };
      /* 0.5.0 C3 · THE BAR IS THE KIT'S createMenubar (its port of this app's bar: the disclosure, 400 ms hover hide, the placement,
         Escape → the wordmark, the phone crossing, a row that throws still closes it).  N1's hand-back stays app glue: the kit closes the
         bar BEFORE the act and returns focus only on Escape, so a row that leaves focus on the vanished item (or nowhere) gives it back
         to the wordmark, an act that moved it on purpose (the keyboard window, the notebook) keeps it (BRIEF candidate M1). */
      const back = (run) => () => { try { run(); } finally { const f = document.activeElement; if (!f || f === document.body || mb.bar.contains(f)) title.focus({ preventScroll: true }); } };
      const mb = createMenubar({ opener: title, host: document.getElementById('lab'), phone: isPhone,
        menus: Object.fromEntries(Object.entries(MENUS).map(([g, rows]) => [g, () => rows().map((r) => r && [r[0], back(r[1]), ...r.slice(2)])])) });
      layout.menu = { open: mb.open, close: mb.close, get isOpen() { return mb.isOpen; }, scale: 1.04, get enlarged() { return title.classList.contains('menu-open'); } };
    }


    /* LEAN (the Aa button) and the KIND taxonomy (data-kind, ⧉ COPY, the boot folds): lab/window-chrome.js (N7 seam 9) */
    installWindowChrome({ KIND, layout, present: () => schedule(TIER.PRESENT) });
    for (const t of ['devclose', 'devopen']) document.addEventListener(t, () => saveSettings());   // C3: the kit's + opens a window itself
    layout.addMenu = rk.addMenu; layout.favMenu = rk.favMenu;   // 0.5.0 C3: the + and ☆ lists are the kit's (createRack chrome)
    /* ── THE NOTEBOOK: a free glass over the stage; its ⓘ flips it into the ABOUT face ── */
    const nb = document.getElementById('notebook');
    if (nb) {
      const NB_KEY = 'lambdawaves.q0.notebook', NB_TITLE = 'lambdawaves.q0.notebook.title', NB_SUBTITLE = 'lambdawaves.q0.notebook.subtitle';
      const ta = nb.querySelector('.nb-text'), view = nb.querySelector('.nb-view'), titleIn = nb.querySelector('.nb-title'), subIn = nb.querySelector('.nb-subtitle'), faces = { notes: nb.querySelector('.nb-notes'), about: nb.querySelector('.nb-aboutface') };
      /* the ABOUT face's version line is BUILD_LINE, never hand-written markup: the copy dump reads this same text back out of the face */
      const abV = nb.querySelector('.ab-version');
      if (abV) { const i = BUILD_LINE.indexOf(' · '); abV.textContent = ''; el('span', 'ab-tag', abV, i < 0 ? BUILD_LINE : BUILD_LINE.slice(0, i)); if (i >= 0) abV.appendChild(document.createTextNode(BUILD_LINE.slice(i))); }
      try {
        ta.value = localStorage.getItem(NB_KEY) || '';
        const t = localStorage.getItem(NB_TITLE); if (t) titleIn.value = t;
        if (subIn) { const s = localStorage.getItem(NB_SUBTITLE); if (s) { subIn.value = s; subIn.hidden = false; } }
      } catch (e) {}
      /* 2026-09-11: a synchronous localStorage write per keystroke became one write 300 ms after the last key; pagehide flushes */
      /* 2026-09-11: the notebook's move and resize write style once per FRAME, not once per pointer event */
      const nbPaint = coalesce(paint => paint());
      const nbPending = new Map(); let nbTimer = 0;
      const nbFlush = () => { nbTimer = 0; for (const [k, v] of nbPending) { try { localStorage.setItem(k, v); } catch (e) {} } nbPending.clear(); };
      const nbStore = (k, v) => { nbPending.set(k, v); if (!nbTimer) nbTimer = setTimeout(nbFlush, 300); };
      window.addEventListener('pagehide', nbFlush);
      titleIn.addEventListener('input', () => nbStore(NB_TITLE, titleIn.value));
      titleIn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (subIn) { subIn.hidden = false; subIn.focus(); subIn.select(); }
          else titleIn.blur();
        }
        if (e.key === 'ArrowDown' && subIn && !subIn.hidden) { e.preventDefault(); subIn.focus(); }
        if (!((e.ctrlKey || e.metaKey) && !e.altKey && (e.code === 'KeyS' || e.code === 'Comma'))) e.stopPropagation();
      });
      if (subIn) {
        subIn.addEventListener('input', () => nbStore(NB_SUBTITLE, subIn.value));
        subIn.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); subIn.blur(); }
          else if (e.key === 'Backspace' && !subIn.value) { e.preventDefault(); subIn.hidden = true; try { localStorage.removeItem(NB_SUBTITLE); } catch (_) {} titleIn.focus(); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); titleIn.focus(); }
          if (!((e.ctrlKey || e.metaKey) && !e.altKey && (e.code === 'KeyS' || e.code === 'Comma'))) e.stopPropagation();
        });
      }
      const renderMarkdown = renderNotebook;
      /* A project opens onto its notebook. The pane already scrolls, so a fixed line/word preview
         limit only hid valid Markdown while leaving usable space empty. Render the complete note
         here and let the pane's own geometry decide how much is visible at once. */
      function render() { const src = ta.value || '*empty — press ◐ to write*'; view.innerHTML = renderMarkdown(src.length > 200000 ? src.slice(0, 200000) + '\n\n*… preview truncated at 200 000 characters; the notes are kept whole*' : src); }   // 2026-09-11: a pasted book previews its first 200 k instead of one huge synchronous innerHTML
      const setMode = (m) => { nb.dataset.mode = m; if (m === 'view') render(); else ta.focus(); };
      nb.dataset.mode = 'edit';
      nb.querySelector('.nb-mode').addEventListener('click', () => setMode(nb.dataset.mode === 'view' ? 'edit' : 'view'));
      ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setMode('view'); }
        if (!((e.ctrlKey || e.metaKey) && !e.altKey && (e.code === 'KeyS' || e.code === 'Comma'))) e.stopPropagation(); });
      /* ── PROJECTS (0.5.0 C6): MIR's FOLDERS over ONE project part — this one, below; the notebook is its page 0 ── */
      /* The saved project is wider than undo: notebook, camera, palette, and modulation all
         belong here. Compare on a destructive act, never on a frame. Playback time and the
         quality governor are runtime; routed numbers compare their hand-owned bases so an
         LFO does not manufacture unsaved edits while the user listens. */
      function modulationBases() {
        if (!modHost) return null;
        modSyncBases(); // catch paused hand edits; routed targets keep their protected base by contract
        return Object.fromEntries(modHost.registry.list().map((id) => [id, modHost.registry.baseOf(id)]));
      }
      /* A project stores the HAND values behind every routed control. The live Card values may be
         anywhere in an LFO cycle when Save is pressed; those animated values are presentation for
         this frame, not the parameter settings the artist made. Keep both the generic base table and
         base-correct mirrors so this project also opens correctly in builds predating the table. */
      function projectSnapshot() {
        const data = serialize(), pr = data.presentation, bases = modulationBases();
        data.experiment.t = 0;
        pr.quality.autoScale = 1; // the governor's current drop is runtime, not part of the composition
        if (!bases) return data;
        pr.modulationBases = bases;
        for (const [id, seat] of Object.entries(modSeats(data))) if (seat[0] && !seat[2] && Number.isFinite(bases[id])) seat[0][seat[1]] = bases[id];   // S3: the history's table
        return data;
      }
      function projectKey() {
        const data = projectSnapshot(), pr = data.presentation;
        /* THE KEYS THAT DO NOT DIRTY A PROJECT (docs/STATE-SCOPES.md): the WORKSPACE — moving a window, the modulation window's
           placement, the notebook's size — and the auto-rotate switch are saved WITH the project, but a demo-maker dragging a
           window is not "unsaved work"; nor is QUALITY, advice the device clamps (D5), nor mat.steps, its shadow (applyRebuild
           writes it from quality.steps: WAVE DANCER's 240 became this device's 160 a frame after its open and read as an edit).
           0.3.1 · S2: the stage is the work (S1 left only the stage in `ui`) and counts, as the overlays and the A/B transition do. */
        delete pr.quality; delete pr.mat.steps;
        delete pr.layout; delete pr.modwin; delete pr.camera; delete pr.notebook;
        if (pr.domain.auto) delete pr.domain.half; // computed during rebuild, not a project edit
        for (const m of (pr.modulation && pr.modulation.macros) || []) if (m.sourceId) delete m.value;   // S2: a bound macro reads its source (deserialize overwrites the value) — NEW's LFO playing is not an edit
        return JSON.stringify([data, titleIn.value, subIn ? subIn.value : '', ta.value]);
      }
      /* 0.5.0 C6 · THE ONE PROJECT PART (R5-A3): λWAVES' project is serialize()/restore() — projectSnapshot() above — with the
         notebook as its page 0, { title, subtitle, text }, in the form 0.4 reads.  FOLDERS, the facade's verbs and the .mir / PNG
         exports carry this part (R-I3: the pages travel with the project); projectKey() is its signature, the unsaved mark.
         restore() THROWS when the file did not take, so the kit counts the part failed; when it took, the notebook is put back. */
      const part = {
        capture: (name) => ({ data: projectSnapshot(), notebook: { title: name && titleIn.value === 'NOTEBOOK' ? name : titleIn.value, subtitle: subIn ? subIn.value : '', text: ta.value } }),
        restore(v, ctx) {
          if (!v || typeof v !== 'object' || !v.data || restore(v.data, { project: true }) !== true) throw new Error('the project did not take');
          const n = v.notebook && typeof v.notebook === 'object' ? v.notebook : {};
          if (nbTimer) { clearTimeout(nbTimer); nbTimer = 0; } nbPending.clear();   // S2: the last project's keystrokes still in the 300 ms debounce must not land over this one's notebook
          ta.value = n.text || ''; titleIn.value = n.title || (ctx && ctx.name) || 'NOTEBOOK';
          if (subIn) { subIn.value = n.subtitle || ''; subIn.hidden = !subIn.value; }
          try { localStorage.setItem(NB_KEY, ta.value); localStorage.setItem(NB_TITLE, titleIn.value); if (subIn) localStorage.setItem(NB_SUBTITLE, subIn.value); } catch (e) {}
          return true;
        },
        signature: () => projectKey(),
      };
      const projects = createProjects({ host: floats || document.body, part,
        snapshot: () => JSON.parse(JSON.stringify(serialize())), rollback: (S) => restore(S) === true,   // M5b: the instrument as it stood, through the same road
        busy: (d) => { busy.n = Math.max(0, busy.n + d); busySync(); },   // wave 48: a project load rebuilds the register, the operator and the field — BUSY work
        notice: () => restoreNotice, thumbnail: () => LW.thumbnail(), confirm: (text) => window.confirm(text), onMoved: () => occlusion.dirty(),
        rack: { keepClear: () => ['rack', 'rackL', 'transport'].map((id) => paintedRect(document.getElementById(id))).filter(Boolean) },
        /* 0.3.1 · S2 THE NOTEBOOK LAW (PLAN §3.4): a project opens onto its notebook only when the notebook has text — the complete
           notebook, in its scrollable pane.  A blank one (NEW's included) opens nothing and closes nothing.  "Edited" is read off the
           text: no flag.  S3: the ring's bottom row is named for the file. */
        opened(label) { count(); if (history) history.clear(label); if (ta.value.trim()) { show('notes'); nb.dataset.mode = 'view'; } render(); },
        titleAfterSave(name) { if (titleIn.value !== 'NOTEBOOK') return false; titleIn.value = name; return true; } });
      addEventListener('beforeunload', (e) => {
        if (!projects.dirty) return;
        e.preventDefault(); e.returnValue = '';
      });
      /* FOLDERS lives in #floats: its pane and its rail's chips are painted glass (CLAUDE.md's mask law); a move dirties the block
         (onMoved above), and so do its open and close */
      { const { root, rail } = projects.folders.win;
        occlusion.register('folders', () => projects.folders.isOpen() ? [paintedRect(root), ...(rail.el ? [...rail.el.querySelectorAll('.mir-chip')].map((c) => paintedRect(c)) : [])] : []);
        for (const el of [root, rail.el]) occlusion.watch(el, { attributes: true, attributeFilter: ['hidden'] }); }
      nb.querySelector('.nb-projects-btn').addEventListener('click', () => projects.folders.toggle());
      layout.projects = projects;
      const count = () => { const c = nb.querySelector('.nb-count'); if (c) c.textContent = ta.value.trim() ? ta.value.trim().split(/\s+/).length + ' words · kept in this browser' : 'empty · kept in this browser'; };
      ta.addEventListener('input', () => { nbStore(NB_KEY, ta.value); count(); });
      const ABOUT_DEF_W = 470, ABOUT_DEF_H = 670;
      const NOTES_DEF_W = 640, NOTES_DEF_H = 460;
      const show = (face) => {
        if (face === 'projects') { projects.folders.open(); return; }   // 0.5.0 C6: the PROJECTS face left the notebook; its open is FOLDERS'
        nb.hidden = false; faces.notes.hidden = face !== 'notes'; faces.about.hidden = face !== 'about'; nb.dataset.face = face;
        const S = readSettings();
        if (face === 'about') {
          const w = typeof S.abW === 'number' ? S.abW : ABOUT_DEF_W;
          const h = typeof S.abH === 'number' ? S.abH : ABOUT_DEF_H;
          nbResize(w, h);
          if (!nbMoved) {
            nb.style.left = 'calc(50% - ' + Math.round(w / 2) + 'px)';
            nb.style.top = 'max(20px, calc(50% - ' + Math.round(h / 2) + 'px))';
          }
          const logo = nb.querySelector('.nb-logo');
          if (logo && !logo.children.length) { for (const c of document.getElementById('title').children) if (!c.classList.contains('ms')) logo.appendChild(c.cloneNode(true)); paintMarks(); }
        } else {
          const w = typeof S.nbW === 'number' ? S.nbW : NOTES_DEF_W;
          const h = typeof S.nbH === 'number' ? S.nbH : NOTES_DEF_H;
          nbResize(w, h);
          if (!nbMoved) {
            nb.style.left = 'calc(50% - ' + Math.round(w / 2) + 'px)';
            nb.style.top = '12%';
          }
        }


        if (face === 'notes') ta.focus();
      };
      nb.querySelector('.nb-about').addEventListener('click', () => show(nb.dataset.face === 'about' ? 'notes' : 'about'));
      nb.querySelector('.nb-close').addEventListener('click', () => { nb.hidden = true; });
      nb.querySelector('.nb-copy').addEventListener('click', async () => { try { await navigator.clipboard.writeText(ta.value); } catch (e) {} });
      const dump = nb.querySelector('.nb-dump');
      const dumpText = () => {
        const info = [...faces.about.children].filter((node) => !node.classList.contains('ab-actions')).map((node) => node.innerText).join('\n');
        return info.replace(/\n{3,}/g, '\n\n') + '\n\nsettings ' + JSON.stringify(readSettings()) + '\nfield ' + JSON.stringify({ resolution: field.resolution, half: field.half, adapter: field.adapterInfo || null }) + '\n' + navigator.userAgent;
      };
      if (dump) dump.addEventListener('click', async () => { try { await navigator.clipboard.writeText(dumpText()); } catch (e) {} });


      const NB_MIN_W = 320, NB_MIN_H = 240;
      const nbClamp = (w, h) => [Math.max(NB_MIN_W, Math.min(w, window.innerWidth - 16)), Math.max(NB_MIN_H, Math.min(h, window.innerHeight - 16))];
      function nbResize(w, h) { const [cw, ch] = nbClamp(w, h); nb.style.width = cw + 'px'; nb.style.height = ch + 'px'; return [cw, ch]; }
      function nbSaveSize() {
        const w = Math.round(parseFloat(nb.style.width)), h = Math.round(parseFloat(nb.style.height)); if (!(w > 0 && h > 0)) return;   // W129 · the size it was GIVEN (nbResize, the grip, the CSS resize all write the inline style; captureLayout reads it too), never its layout box: a closed notebook's box is 0 × 0, a phone's is its screen
        const S = readSettings();
        if (nb.dataset.face === 'about') {
          if (S.abW === w && S.abH === h) return;
          settingsStore.write({ ...S, abW: w, abH: h });
        } else {
          if (S.nbW === w && S.nbH === h) return;
          settingsStore.write({ ...S, nbW: w, nbH: h });
        }
      }
      { const grip = nb.querySelector('.nb-grip');
        if (grip) { let gd = null;
          grip.addEventListener('pointerdown', (e) => { if (e.button !== 0 || gd) return; e.preventDefault(); e.stopPropagation(); const r = nb.getBoundingClientRect(); gd = { id: e.pointerId, x: e.clientX, y: e.clientY, w: r.width, h: r.height };
            try { grip.setPointerCapture(e.pointerId); } catch (_) {} });   // a capture that cannot be taken (a synthesised pointer, a stale id) must not throw into the page — the drag works without it
          grip.addEventListener('pointermove', (e) => { if (!gd || e.pointerId !== gd.id) return; e.preventDefault(); const w = gd.w + (e.clientX - gd.x), h = gd.h + (e.clientY - gd.y); nbPaint.post(() => nbResize(w, h)); });
          const gend = (e) => { if (!gd || e.pointerId !== gd.id) return; nbPaint.flush(); gd = null; if (e && e.pointerId !== undefined && grip.hasPointerCapture && grip.hasPointerCapture(e.pointerId)) grip.releasePointerCapture(e.pointerId); nbSaveSize(); };
          for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) grip.addEventListener(type, gend);
        }
        /* the desktop's own CSS resize ends in a pointerup over the notebook — the same two numbers, the same key */
        nb.addEventListener('pointerup', () => nbSaveSize());
        const S0 = readSettings(); if (typeof S0.nbW === 'number' && typeof S0.nbH === 'number') nbResize(S0.nbW, S0.nbH);
        layout.notebookResize = (w, h) => { const r = nbResize(w, h); nbSaveSize(); return r; };
        layout.notebookSize = () => { const w = Math.round(parseFloat(nb.style.width) || NOTES_DEF_W), h = Math.round(parseFloat(nb.style.height) || NOTES_DEF_H); return { w, h, custom: w !== NOTES_DEF_W || h !== NOTES_DEF_H }; };
      }
      let nd = null, nbMoved = false; const nhead = nb.querySelector('.nb-head');
      nhead.addEventListener('pointerdown', (e) => { if (e.button !== 0 || nd || e.target.closest('button, input')) return; const r = nb.getBoundingClientRect(); nd = { id: e.pointerId, dx: e.clientX - r.left, dy: e.clientY - r.top }; try { nhead.setPointerCapture(e.pointerId); } catch (_) {} });
      nhead.addEventListener('pointermove', (e) => { if (!nd || e.pointerId !== nd.id) return; nbMoved = true; const L = Math.max(0, Math.min(window.innerWidth - 80, e.clientX - nd.dx)) + 'px', T = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - nd.dy)) + 'px'; nbPaint.post(() => { nb.style.left = L; nb.style.top = T; }); });
      const nend = (e) => { if (!nd || e.pointerId !== nd.id) return; nbPaint.flush(); nd = null; };
      for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) nhead.addEventListener(type, nend);
      count();
      layout.notebook = { open: (face = 'notes') => show(face), close: () => { nb.hidden = true; }, toggle: () => { if (nb.hidden) show('notes'); else nb.hidden = true; }, get isOpen() { return !nb.hidden; }, get face() { return nb.dataset.face; }, moveTo(x, y) { nbMoved = true; nb.style.left = x + 'px'; nb.style.top = y + 'px'; }, dump: dumpText, get text() { return ta.value; }, set text(v) { ta.value = v; ta.dispatchEvent(new Event('input')); }, get title() { return titleIn.value; }, set title(v) { titleIn.value = v; titleIn.dispatchEvent(new Event('input')); }, get subtitle() { return subIn ? subIn.value : ''; }, set subtitle(v) { if (subIn) { subIn.value = v; subIn.hidden = !v; subIn.dispatchEvent(new Event('input')); } }, get mode() { return nb.dataset.mode; }, setMode, render: renderMarkdown, get html() { return view.innerHTML; } };
    }
    /* a hidden rack peeks by the kit's pointer law (createRack); the playhead does the same around whichever seat modDodge gives it */
    const peekLast = { x: -1, y: -1, bar: false };
    const peekTransport = document.getElementById('transport');
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch' || uiHidden || !document.body.classList.contains('rack-hidden')) return;
      if (Math.abs(e.clientX - peekLast.x) < 2 && Math.abs(e.clientY - peekLast.y) < 2) return;   // a synthesised move after a layout change is not the pointer leaving
      peekLast.x = e.clientX; peekLast.y = e.clientY;
      const W = window.innerWidth, H = window.innerHeight;
      /* WAVE 108 · THE REVEAL TARGET FOLLOWS THE PLAYHEAD.  modDodge can tunnel the native
         transport from its bottom seat to its top seat, but the hidden-rack hit area used to stay
         hard-coded at the bottom of the viewport.  The pill's `at-top` class is the current seat
         written by that move, so derive the same candidate rect from it here.  The 80/120 px margins preserve the old
         720-px-wide target and its forgiving exit band without reading layout on every pointermove. */
      const barTop = peekTransport && peekTransport.classList.contains('at-top') ? 52 : H - 60 - 46;
      const bar = { left: (W - 560) / 2, right: (W + 560) / 2, top: barTop, bottom: barTop + 46 };
      const nearBar = e.clientX >= bar.left - 80 && e.clientX <= bar.right + 80
        && e.clientY >= bar.top - 60 && e.clientY <= bar.bottom + 60;
      const insideBar = e.clientX >= bar.left - 120 && e.clientX <= bar.right + 120
        && e.clientY >= bar.top - 120 && e.clientY <= bar.bottom + 120;
      if (nearBar) { document.body.classList.add('transport-peek'); peekLast.bar = true; }
      else if (!insideBar && peekLast.bar) { document.body.classList.remove('transport-peek'); peekLast.bar = false; }
    });
  }


  const phone = { on: false, applied: false, DPR: 1.5, wasDocked: false, wasRes: 0, wasSteps: 0, wasScale: 0, wasFrost: 'off' };
  function enterPhone() {
    /* WAVE 55 · THE PHONE HAS NO FLOATING, and ONE RACK: the kit's crossing (createRack `phone`) has already docked every float
       (remembered, so the crossing is reversible — wave 51's law) and folded the mirror rack into the one rack, each card
       marked `data-phone-from="left"`; this half is the transport, the phone's rack default and the low-power path. */
    /* THE TRANSPORT DOCKS AT THE TOP OF THE RACK, and it is HIDEABLE, NEVER CLOSABLE: the × stands down in
       CSS at this breakpoint, ▾ is the hide, and which way it was left is this browser's to remember. */
    phone.wasDocked = layout.docked;
    if (!layout.docked) layout.dockTransport();
    rack.insertBefore(wTr.root, rack.firstElementChild);
    wTr.root.classList.remove('closed');
    const s = readSettings();
    wTr.fold(s.phoneTr === true);


    document.body.classList.toggle('rack-hidden', readSettings().phoneRack !== true);
    /* THE LOW-POWER PATH, once per page.  Every one of these is a DEFAULT, not an override: a value this
       browser has SAID in SETTINGS still wins, exactly as CARD STYLE's default does. */
    if (!phone.applied) {
      phone.applied = true;
      if (field.setDprCap) field.setDprCap(phone.DPR);              // 3 physical pixels per CSS pixel of a ray-marched volume buys nothing at arm's length
      /* ⚠ WAVE 106 · THE PHONE STOPPED GETTING ITS LOW-POWER PATH WHEN 64³ BECAME THE DEFAULT.
         This was ONE branch doing TWO jobs, and wave 101 silently switched it off.  The grid, the
         march steps and the render scale were all set inside `gridSeg.get() !== '64'` — which was
         true for every phone while the shipped grid was 96³.  Wave 101 made 64³ the default (the
         `quality` seed above), so on a fresh profile the segment ALREADY reads '64', the whole
         branch is skipped, and the two values that have nothing to do with the grid are skipped
         with it: steps stays 160 where the phone wants 110, and scale stays 1 where it wants 0.75.
         That is ~1.78x the pixels and ~1.45x the ray-march steps, on the device least able to pay
         for them — and it is invisible, because the grid it was bundled with happens to land right.
           The exit path's own ladder (below) already states the pairing: 64 -> 110 steps, 0.75
         scale.  So the GRID move stays conditional — only a phone that arrives on 96³ or 128³ has
         a grid to remember and give back — and the two POWER values are applied unconditionally and
         remembered separately, which is what they always should have been. */
      if (ui.gridSeg) {
        /* …AND THE GUARD READS THE GRID, NOT THE WIDGET.  `ui.gridSeg.get()` is what the SEGMENT is
           showing; `quality.res` is what the field is actually marching.  They can disagree — any
           road that sets the resolution without moving the segment leaves the seg saying '64' over a
           96³ volume — and this branch's job is to make the GRID 64, so it must ask the grid.  Asking
           the widget is how the whole path came to be skipped in the first place. */
        if (quality.res !== 64) { phone.wasRes = quality.res; ui.gridSeg.set('64'); quality.res = 64; }
        phone.wasSteps = quality.steps; phone.wasScale = quality.scale;
        quality.steps = 110; quality.scale = 0.75;
      }
      if (s.governor === undefined) setGovernor(true);
      /* WAVE 67 · FROST GOES OFF ON A PHONE, and now UNCONDITIONALLY — it used to be `if nothing stored`,
         which stopped protecting anything the moment the policy started persisting a value.  A phone paints
         every frame on a low-power GPU and skin.css already strips every other backdrop-filter at this
         breakpoint; a backdrop over the field is the one thing this device cannot afford.  Remembered and
         given back on the way out, which is wave 51's law: the crossing is reversible in both directions.
         (The DISCONNECTED window fuses here too, in CSS, on BASINS' own FR_COMPACT_W law — a constellation
         needs air and a 390-px screen has none — so there is nothing to remember for it.) */
      phone.wasFrost = look.get('frost'); setFrost('off');
      if (s.keepFrames === undefined) setKeepFrames(false);
      schedule(TIER.REBUILD);
    }
  }
  function leavePhone() {
    /* the crossing is REVERSIBLE in both directions: the cards go back to the rack they came from, the transport
       to the dock state it had, and the grid to the one the phone stepped down from — unless the hand changed it
       in the meantime, in which case the hand wins. */
    if (phone.wasFrost !== 'off' && look.get('frost') === 'off') setFrost(phone.wasFrost);   // wave 67: the policy the desktop crossed with
    if (layout.docked !== phone.wasDocked) layout.dockTransport();
    if (phone.wasRes && ui.gridSeg && ui.gridSeg.get() === '64') { ui.gridSeg.set(String(phone.wasRes)); quality.res = phone.wasRes; quality.steps = { 64: 110, 96: 160, 128: 240 }[phone.wasRes]; quality.scale = { 64: 0.75, 96: 1, 128: 1 }[phone.wasRes]; }
    /* wave 106: …and the crossing is reversible in the case where the GRID never moved, which is now
       the common one.  Without this the desktop keeps the phone's 110 steps and 0.75 scale for the
       life of the page — the same bug in the other direction, and the one the split above creates
       if only its first half is written. */
    else if (phone.wasSteps) { quality.steps = phone.wasSteps; quality.scale = phone.wasScale; }
    phone.wasSteps = 0; phone.wasScale = 0;
    parkedIds = [];                                                    // the kit has put the parked floats back on the stage
    phone.applied = false;
    if (field.setDprCap) field.setDprCap(2);
    schedule(TIER.REBUILD);
  }
  const tablet = { on: false, DPR: 1.5, steps: 110 };   // isTablet() itself sits beside isPhone() at the top (W125: the first-run material asks it before any window exists)
  function syncPhone() {
    cornerLayoutDirty=true;
    const on = isPhone();
    if (on !== phone.on) {
      phone.on = on; document.body.classList.toggle('phone', on);
      if (on) enterPhone(); else leavePhone();
    }
    tablet.on = isTablet();
    /* OPTIMIZATION 2026-09-24 · M3 (L6): a field that never came up (no WebGPU, no adapter, a device lost before
       createField finished) is createField's method-less failure object, and this line threw "boot failed —
       field.setDprCap is not a function" instead of leaving rack.js:762's banner up.  The METHOD is tested, not
       `field.ok`: a device lost after boot keeps its methods and keeps today's behaviour byte for byte. */
    if (field.setDprCap) field.setDprCap(phone.on ? phone.DPR : tablet.on ? tablet.DPR : 2);   // N5: the two DPR fields are READ (both 1.5; tablet.DPR was written and never read)
    schedule(TIER.PRESENT);
    return on;
  }
  window.addEventListener('resize', syncPhone, { passive: true });
  window.addEventListener('orientationchange', syncPhone, { passive: true });
  layout.phone = { get on() { return phone.on; }, get dprCap() { return field.dprCap; }, get transportFolded() { return wTr.root.classList.contains('folded'); }, get parkedFloats() { return phone.on ? parkedIds.slice() : []; }, sync: syncPhone };
  layout.tablet = { get on() { return tablet.on; }, get dprCap() { return field.dprCap; }, get stepCap() { return field.stepCap; }, sync: syncPhone };

  /* Stage gestures own pointer lifetimes; these callbacks own the instrument.  0.5.0 C9 · `ui` is UI SPACE for the stage's scene guard:
     every window on the float layer by its WHOLE rect (the modulation window with its rail and work bars, a floated card: the gaps
     between their parts are UI, not picture) and the app's own panes.  A press there never reaches the stage.  0.5.0 C3: the kit's rack
     hands in its columns (less their shadow gutter) and its float layer (C9's open item). */
  bindStageGestures(dom.canvas, {
    ui: uiSpace({ rack: rk, extra:() => ['transport', 'notebook', 'sheet', 'offer', 'rackAddList', 'rackFavList'].map((id) => paintedRect(document.getElementById(id))) }),
    camera, travel: camTravel, law: CAM,
    getDistance: () => obs.dist, zoomAt, pan: panBy, orbitBy, resetView,
    setDragging: value => { dragging = value; },
    present: () => schedule(TIER.PRESENT),
    startSpecial(e) {
      if (e.ctrlKey) {
        bowStart(e);
        return { move: bowMove, end: bowRelease, cancel: bowCancel };
      }
      const r = dom.canvas.getBoundingClientRect();
      if (!e.shiftKey && kepler.on) {
        const hit = kepler.hit(e.clientX - r.left, e.clientY - r.top);
        if (hit) {
          kdrag = { n: hit.n, id: e.pointerId }; dom.canvas.classList.add('kdrag');
          const end = () => { kdrag = null; dom.canvas.classList.remove('kdrag'); };
          return {
            move(event) {
              const rect = dom.canvas.getBoundingClientRect();
              keplerDragTo(hit.n, event.clientX - rect.left, event.clientY - rect.top);
              schedule(TIER.RECONSTRUCT);
            },
            end, cancel: end,
          };
        }
      }
      return null;
    },
    hover(e) {
      if (bow || !kepler.on) return;
      const r = dom.canvas.getBoundingClientRect(), hit = kepler.hit(e.clientX - r.left, e.clientY - r.top);
      kepler.setHover(hit); dom.canvas.classList.toggle('khover', !!hit);
    },
  });
  new ResizeObserver(() => schedule(TIER.PRESENT)).observe(dom.canvas);
  /**
   * KEYS.  Transport on the arrows and space; the camera on WASD/QE with shift for a fine step; the ROTATION AXIS
   * on X/Y/Z, so [ and ] turn the STATE about the chosen axis (and with shift, the Runge–Lenz rotation about it).
   * The axis keys never move the camera and the camera keys never touch ψ — the badge on each window says which.
   */
  const keyState = { axis: 'z', which: 'both' };
  function keyHelp() { return `axis ${keyState.axis.toUpperCase()} · rotor ${keyState.which}`; }
  /* ── KEYS: a rebindable action table.  `fine` is shift for the stepping actions; actions that declare `shift`
     require it (so TAB and Shift+TAB are two actions).  Overrides live in localStorage.
     0.5.0 A9 · THE ROWS THE KIT'S createKeys READS (mir/shell/keys.js): an id is the kit's where the kit has a twin and `was`
     names the old one (a binding saved under it still loads, lab/keys.js); `group` and `short` are the keyboard window's;
     `ctrl: true` is the kit's `Mod` (Ctrl, or ⌘ on a Mac) and `ctrl: 'Ctrl'` its `Ctrl`, the Control key alone (⌘⇧Q logs a
     Mac out); `inFields` runs from a text field; a control a row drives carries `data-key-action` (the kit's hints() target). ── */


  const stageHasFocus = () => document.activeElement === dom.canvas;
  const setAxis = (a) => { keyState.axis = a; wState.setStatus(keyHelp(), 'live'); };
  const setWhich = (w) => { keyState.which = w; wState.setStatus(keyHelp(), 'live'); };
  const dolly = (direction, fine) => setDist(direction < 0 ? obs.dist / (1 + 0.1 * fine) : obs.dist * (1 + 0.1 * fine));
  const pov = (direction, fine) => setFov(2 * Math.atan(Math.tan(obs.fov / 2) * (direction < 0 ? 1 / (1 + 0.1 * fine) : 1 + 0.1 * fine)));
  /* Preserve the apparent size at the origin: distance × tan(FOV/2) is invariant.
     When either camera limit is reached, stop the coupled move at that limit. */
  function dollyZoom(direction, fine) {
    const invariant = obs.dist * Math.tan(obs.fov / 2);
    let dist = Math.max(CAM.DIST[0], Math.min(CAM.DIST[1], direction < 0 ? obs.dist / (1 + 0.1 * fine) : obs.dist * (1 + 0.1 * fine)));
    let fov = 2 * Math.atan(invariant / dist);
    fov = Math.max(CAM.FOV[0], Math.min(CAM.FOV[1], fov));
    dist = Math.max(CAM.DIST[0], Math.min(CAM.DIST[1], invariant / Math.tan(fov / 2)));
    const actual = setDist(dist);
    if (Math.abs(actual - dist) < 1e-9) setFov(2 * Math.atan(invariant / actual));
  }
  const KG = { T: 'TRANSPORT', C: 'CAMERA', S: 'STATE', P: 'PROJECT' };   // the keyboard window's groups; a row without one is WINDOWS & DISPLAY
  const ACTIONS = [
    { id: 'transport.play', was: 'play', group: KG.T, short: 'play', label: 'play / pause', key: 'Space', run: () => togglePlay() },
    { id: 'fullscreen', short: 'fullscreen', label: 'full screen (the browser) / back', key: 'KeyF', run: () => toggleFullscreen() },
    { id: 'notebook', short: 'notebook', label: 'notebook (and its ABOUT face)', key: 'KeyJ', run: () => layout.notebook.toggle() },
    /* wave 106: the button's own title says "t → 0  (home)", so the key must BE the button — it was
       clearing neither the shadow trail nor the playhead, so the same advertised act did two different
       things depending on which surface you used. */
    { id: 'home', group: KG.T, short: 'zero', label: 'time to zero', key: 'Home', run: () => { clock.reset(); if (ui.scrub) ui.scrub.set(0); shadowView.clearTrail(); schedule(TIER.EVOLVE); } },
    { id: 'stepBack', group: KG.T, short: 'step back', label: 'step time back (shift: fine)', key: 'ArrowLeft', run: (f) => { clock.step(-transport.stepDt() * f); schedule(TIER.EVOLVE); } },
    { id: 'stepFwd', group: KG.T, short: 'step fwd', label: 'step time forward (shift: fine)', key: 'ArrowRight', run: (f) => { clock.step(transport.stepDt() * f); schedule(TIER.EVOLVE); } },
    { id: 'zoomIn', group: KG.C, short: 'zoom in', label: 'camera closer', key: 'ArrowUp', run: (f) => { setDist(obs.dist / (1 + 0.12 * f)); } },
    { id: 'zoomOut', group: KG.C, short: 'zoom out', label: 'camera farther', key: 'ArrowDown', run: (f) => { setDist(obs.dist * (1 + 0.12 * f)); } },
    { id: 'yawL', group: KG.C, short: 'yaw left', label: 'camera yaw left', key: 'KeyA', run: (f) => queueKeyOrbit(-0.12 * f, 0) },
    { id: 'yawR', group: KG.C, short: 'yaw right', label: 'camera yaw right', key: 'KeyD', run: (f) => queueKeyOrbit(0.12 * f, 0) },
    { id: 'pitchUp', group: KG.C, short: 'pitch up', label: 'camera pitch up', key: 'KeyW', run: (f) => queueKeyOrbit(0, 0.12 * f) },
    { id: 'pitchDn', group: KG.C, short: 'pitch down', label: 'camera pitch down', key: 'KeyS', run: (f) => queueKeyOrbit(0, -0.12 * f) },   // R-K1: S stays WASD's (the kit's S is FOLDERS)
    { id: 'dollyIn', group: KG.C, short: 'dolly in', label: 'dolly in', key: 'KeyQ', shift: false, run: (f) => dolly(-1, f) },
    { id: 'dollyOut', group: KG.C, short: 'dolly out', label: 'dolly out', key: 'KeyE', shift: false, run: (f) => dolly(1, f) },
    { id: 'povIn', group: KG.C, short: 'POV tighter', label: 'POV tighter (field of view)', key: 'KeyQ', shift: true, run: () => pov(-1, 1) },
    { id: 'povOut', group: KG.C, short: 'POV wider', label: 'POV wider (field of view)', key: 'KeyE', shift: true, run: () => pov(1, 1) },
    { id: 'dollyZoomIn', group: KG.C, short: 'dolly zoom in', label: 'dolly zoom in (size held)', key: 'KeyQ', ctrl: 'Ctrl', shift: true, run: () => dollyZoom(-1, 1) },
    { id: 'dollyZoomOut', group: KG.C, short: 'dolly zoom out', label: 'dolly zoom out (size held)', key: 'KeyE', ctrl: 'Ctrl', shift: true, run: () => dollyZoom(1, 1) },
    { id: 'camReset', group: KG.C, short: 'cam reset', label: 'reset the camera', key: 'KeyR', run: () => resetView() },
    { id: 'panLeft', group: KG.C, short: 'pan left', label: 'slide the picture left (the molecule stays the pivot)', key: 'ArrowLeft', alt: true, run: (f) => panBy(-STAGE_BINDINGS.nudge * f, 0) },   // 0.4.0 S2: the lens shift, the bindings' nudge (0.05) of the half-frame a press
    { id: 'panRight', group: KG.C, short: 'pan right', label: 'slide the picture right', key: 'ArrowRight', alt: true, run: (f) => panBy(STAGE_BINDINGS.nudge * f, 0) },
    { id: 'panUp', group: KG.C, short: 'pan up', label: 'slide the picture up', key: 'ArrowUp', alt: true, run: (f) => panBy(0, STAGE_BINDINGS.nudge * f) },
    { id: 'panDown', group: KG.C, short: 'pan down', label: 'slide the picture down', key: 'ArrowDown', alt: true, run: (f) => panBy(0, -STAGE_BINDINGS.nudge * f) },
    { id: 'axisX', group: KG.S, short: 'axis X', label: 'rotation axis x', key: 'KeyX', run: () => setAxis('x') },
    { id: 'axisY', group: KG.S, short: 'axis Y', label: 'rotation axis y', key: 'KeyY', run: () => setAxis('y') },
    { id: 'axisZ', group: KG.S, short: 'axis Z', label: 'rotation axis z', key: 'KeyZ', run: () => setAxis('z') },
    { id: 'rotorBoth', group: KG.S, short: 'rotor both', label: 'rotor: both (spatial rotation)', key: 'Digit1', run: () => setWhich('both') },
    { id: 'rotorPlus', group: KG.S, short: 'rotor +', label: 'rotor: plus alone', key: 'Digit2', run: () => setWhich('+') },
    { id: 'rotorMinus', group: KG.S, short: 'rotor −', label: 'rotor: minus alone', key: 'Digit3', run: () => setWhich('−') },
    { id: 'rotorK', group: KG.S, short: 'rotor K', label: 'rotor: Runge–Lenz K', key: 'Digit4', run: () => setWhich('K') },
    { id: 'turnNeg', group: KG.S, short: 'turn −', label: 'turn ψ about the axis, −', key: 'BracketLeft', run: (f) => { reg.rotor({ which: keyState.which, axis: keyState.axis, angle: -0.12 * f, t: clock.t }); touchState(); } },
    { id: 'turnPos', group: KG.S, short: 'turn +', label: 'turn ψ about the axis, +', key: 'BracketRight', run: (f) => { reg.rotor({ which: keyState.which, axis: keyState.axis, angle: 0.12 * f, t: clock.t }); touchState(); } },
    { id: 'slap', group: KG.S, short: 'impulse', label: 'impulse along the axis (k = 0.2)', key: 'KeyK', run: (f) => { if (__LW_hooks.slap) __LW_hooks.slap(0.2 * f, keyState.axis); } },
    { id: 'style', short: 'style', label: 'cycle the draw style', key: 'KeyC', run: () => { const order = ['cloud', 'solid', 'grain', 'signed', 'bands']; const nx = order[(order.indexOf(STYLE_NAMES[mat.style]) + 1) % 5]; mat.style = STYLE[nx]; ui.styleSeg.set(nx); schedule(TIER.PRESENT); } },
    { id: 'view', short: 'view', label: 'cycle the observable', key: 'KeyV', run: () => { const order = ['density', 'phase', 'real', 'imag', 'diff', 'reim']; const nx = order[(order.indexOf(VIEW_NAMES[mat.view]) + 1) % 6]; mat.view = VIEW[nx]; ui.viewSeg.set(nx); schedule(TIER.PRESENT); } },
    { id: 'palette', short: 'palette', label: 'toggle the phase palette', key: 'KeyP', run: () => { if (palette) palette.setOn(!palette.on); } },
    { id: 'hide', was: 'hideUI', short: 'hide UI', label: 'hide / show the interface (the frame and the axes with it)', key: 'KeyH', run: () => toggleUI() },
    { id: 'nextWindow', short: 'next win', label: 'next window to the top of the rack (from the stage)', key: 'Tab', shift: false, stage: true, run: () => cycleWindow(1) },
    { id: 'prevWindow', short: 'prev win', label: 'previous window to the top of the rack (from the stage)', key: 'Tab', shift: true, stage: true, run: () => cycleWindow(-1) },
    { id: 'reseed', group: KG.S, short: 'reseed', label: 'reset the particles', key: 'KeyR', ctrl: true, run: () => { particles.setOn(true); particles.seed(160, reg, clock.t, domain.half); schedule(TIER.PRESENT); } },
    { id: 'help', was: 'keysheet', short: 'keys', label: 'the keyboard — edit bindings', key: 'Slash', shift: true, run: () => layout.keymap.toggle() },
    { id: 'notes', short: 'notes', label: 'show / hide window help', key: 'KeyN', run: () => { const on = document.body.classList.contains('window-info-off'); if (ui.setWindowInfo) ui.setWindowInfo(on); if (ui.windowInfoSw) ui.windowInfoSw.set(on); } },
    { id: 'rack', short: 'rack', label: 'hide / show the rack', key: 'KeyB', run: () => layout.toggleRack() },
    { id: 'dock', short: 'dock', label: 'dock / undock the transport', key: 'KeyT', run: () => layout.dockTransport() },
    /* WAVE 65 · the arm and the loop clock's lock.  Both are REBINDABLE and both appear in the keyboard
       editor, which is the visible seat neither could have inside the ported window: its timing bar is
       the artifact's and is not ours to grow (docs/ui/STYLE-LOCK.md, THE PORTED-WINDOW EXCEPTION). */
    /* R-K1 · the MOD arm is Ctrl+Space (the real Control: ⌘Space is Spotlight); A5+A6 seam: its run() follows the one clock's POWER. */
    { id: 'modArm', group: KG.T, short: 'mod arm', label: 'MOD — the modulation’s power: routes on or bypassed (time runs on; space plays the one clock)', key: 'Space', ctrl: 'Ctrl', run: () => setModArm(!modArm) },
    { id: 'modulation', was: 'modWin', label: 'the modulation window — open it, or close it again', key: 'KeyM', run: () => layout.modulation.toggle() },
    { id: 'modBar', group: KG.T, short: 'bar lock', label: 'lock the modulation loop clock: one bar = one recurrence of the density', key: 'KeyG', run: () => barLock() },
    { id: 'undo', group: KG.P, short: 'undo', label: 'undo the last edit', key: 'KeyZ', ctrl: true, shift: false, run: () => historyApi.undo() },
    { id: 'redo', group: KG.P, short: 'redo', label: 'redo it (Ctrl+Y too)', key: 'KeyZ', ctrl: true, shift: true, run: () => historyApi.redo() },
    { id: 'redoY', group: KG.P, short: 'redo', label: 'redo (Ctrl+Y)', key: 'KeyY', ctrl: true, shift: false, run: () => historyApi.redo() },
    { id: 'historyUndo', group: KG.P, label: 'return from the last history jump', key: 'KeyZ', ctrl: true, alt: true, shift: false, run: () => historyApi.historyUndo() },
    { id: 'settings', inFields: true, label: 'settings', key: 'Comma', ctrl: true, shift: false, run: () => layout.raise('settings') },
    { id: 'save', group: KG.P, short: 'save', inFields: true, label: 'save the open project (asks for a name when none is open)', key: 'KeyS', ctrl: true, shift: false,
      run: () => { if (layout.projects && layout.projects.current) layout.projects.save(); else layout.notebook.open('projects'); } },
    { id: 'saveAs', group: KG.P, short: 'save as', inFields: true, label: 'save the project under a new name', key: 'KeyS', ctrl: true, shift: true,
      run: () => layout.notebook.open('projects') },
    { id: 'folders', group: KG.P, short: 'folders', label: 'the projects — save, open, folders, recent (FOLDERS)', key: 'KeyO',
      run: () => layout.projects.folders.toggle() },
    /* the kit's windows λWAVES has are rows with NO chord (MIR ADOPTING-1.5 §11: their keys are Josh's to give; bind one in the keyboard) */
    { id: 'history', group: KG.P, short: 'history', label: 'the undo history window', key: null, run: () => layout.raise('history') },
    { id: 'keyboard', short: 'keyboard', label: 'the keyboard window (? opens it too, as help)', key: null, run: () => layout.keymap.toggle() },
    { id: 'timeline', short: 'timeline', label: 'the timeline window — open it, or close it again', key: null, run: () => { if (tl) tl.toggle(); } },   // 0.5.0 C7b
  ];
  /* THE DISPATCHER (the saved chords, the one keydown listener, whose key a press is): lab/keys.js (wave 130 seam 10) */
  /* S4 · A KEY'S EDIT IS A ROW OF ITS OWN, named for its action: C / V / P changed the edit scope and armed nothing, so the row came
     at the next commit under whatever name was standing (probes/S3-verify/edges*.mjs).  An edit still pending under another name
     commits first; a held key repeats under one name and stays one row; a key that changed nothing drops its name like any gesture. */
  const TRAVELS = new Set(['undo', 'redo', 'redoY', 'historyUndo']);
  const keyEdit = (a, run) => {
    if (!history || history.holding || TRAVELS.has(a.id)) return run();   // an undo is not an edit: noting its name lent it to the next unnamed edit
    const name = a.label + ' · ' + kt.keyText(a.id);
    if (history.pendingLabel !== name) history.flush();
    run(); history.note(name);
  };
  const kt = createKeyTable({ rows: ACTIONS, stageHasFocus, edit: keyEdit });   // 0.5.0 C3: the one listener, the save, the binding law (lab/key-table.js)
  /* ── 0.5.0 C3 · THE KEYBOARD WINDOW is the kit's createKeyboardWindow (keymap.js left): the drawn board, the platform switch, RECORD /
     RESET, the search and the list, the steal on a second press, Escape's three steps, the drag — on the float layer (UI space for the
     scene guard), its move telling the occlusion (CLAUDE.md).  Its paint is λWAVES' charcoal-blue skin (lab.css §KEYBOARD, R5-S3).  Its
     place is remembered as it was ({ x, y } in lw.keyboard.position.v1, PREFERENCE); focus goes in on open and back out on close. */
  {
    const KB_AT = 'lw.keyboard.position.v1';
    let back = null;
    const kb = createKeyboardWindow({ keys: kt.window, host: floats,
      onMoved: (r) => { occlusion.dirty(); const f = document.activeElement; if (r === null && back && back.isConnected && (!f || f === document.body || kb.win.root.contains(f))) back.focus({ preventScroll: true }); },
      persist: { read() { try { return JSON.parse(localStorage.getItem(KB_AT)); } catch (_) { return null; } },
        write(st) { try { if (st.x !== null) localStorage.setItem(KB_AT, JSON.stringify({ x: st.x, y: st.y })); } catch (_) {} } } });
    for (const n of [kb.win.root, kb.win.rail && kb.win.rail.el]) occlusion.watch(n, { attributes: true, attributeFilter: ['hidden'] });   // its `hidden` lands when the exit ends: the paused mask lets go then
    layout.keymap = {
      open() { if (!kb.isOpen()) { back = document.activeElement; kb.open(); } const k = kb.root.querySelector('.km-key[tabindex="0"]'); (k && k.offsetParent ? k : kb.root.querySelector('.km-action-row') || kb.root).focus({ preventScroll: true }); return true; },
      close() { kb.close(); return false; },
      toggle() { return kb.isOpen() ? layout.keymap.close() : layout.keymap.open(); },
      get isOpen() { return kb.isOpen(); },
    };
    layout.keysheet = layout.keymap;   // the '?' LIST sheet of wave 53 is gone; the window is the one bindings surface
    /* Escape: inside the window the kit's three steps (a recording, the search, the window); from anywhere else it still closes the window
       (wave 106), and from the stage it hands the keyboard back to the interface (wave 57).  The menubar and the + / ☆ lists are the kit's. */
    window.addEventListener('keydown', (e) => { if (e.code !== 'Escape' || e.defaultPrevented) return; if (kb.isOpen()) { e.preventDefault(); kb.close(); } else if (stageHasFocus()) dom.canvas.blur(); });
    kt.table.hints(document); kt.table.onChange(() => kt.table.hints(document));   // every [data-key-action] says its live chord (aria-keyshortcuts)
  }
  /* ── 0.5.0 C7b · THE TIMELINE is the kit's installTimeline (TIMELINE.md) on λWAVES' ONE modulation host: its `mod` is this seam (bind.js
     reads host, registry, play, arm, armed, onPlay, setTimeline), so it builds no second host and no tick.  Its play is THE play (clock.js
     onePlay), its playhead paints from loop()'s present, the arrangement is the host clock's automation and rides in serialize()
     (presentation.timeline) with its own undo; λWAVES' pill stays the one transport (R9), the window a WORKSPACE record (`tlwin`) that
     ships closed (R1).  Its rows join the ONE KEY TABLE (undo/redo are λWAVES' own ids: its own are reachable from its ⋯ menu). */
  if (modHost && modView) {
    tl = installTimeline({ mount: floats, present: () => schedule(TIER.PRESENT), say: (m) => wState.setStatus(m, 'warn'),
      mod: { host: modHost, registry: modHost.registry, armed: () => modArm, arm: (on) => setModArm(!!on), onPlay: appPlay.onChange, setTimeline: (x) => modView.setTimeline(x),
        play: (on) => { if (on) appPlay.play(); else appPlay.pause(); schedule(TIER.EVOLVE); return { ok: true, playing: clock.playing }; } },
      dock: { span: rk.span() }, initial: { dock: 'bottom', open: false }, keys: kt.table, project: false, transport: false, audio: false,
      store: { read: () => readSettings().tlwin || null, write: (s) => settingsStore.write({ ...readSettings(), tlwin: s }) },
      busy: () => capApi.busy, moved: (r) => dodge(r, 'tl'), onWindow: () => occlusion.dirty() });
    /* the window draws no pane of its own: its ruler, lanes and work bar are each a .glass pane (a lane clipped by the scroller), its rail chips */
    occlusion.register('timeline', () => tl.isOpen() ? [...tl.root.querySelectorAll('.glass'), ...(tl.rail.el ? tl.rail.el.querySelectorAll('.mir-chip') : [])].map((s) => paintedRect(s, s.closest('.tl-viewport'))) : []);
    for (const n of [tl.root, tl.rail.el]) occlusion.watch(n, { attributes: true, attributeFilter: ['hidden'] });
    /* a ROUTED dial's hold and right-click stay its ring's (RANGE · REMOVE · RESET): the kit's TIMELINE CLIP (timeline/knobs.js, 500 ms,
       document capture) and the ring (600 ms) claim one gesture, so the window's capture hides that dial's id from the timeline for the
       one event and gives it back right after the timeline has looked (brief B13); an unrouted dial's hold is TIMELINE CLIP's */
    for (const type of ['pointerdown', 'contextmenu']) window.addEventListener(type, (e) => { const k = e.target.closest && e.target.closest('.k[data-param]');
      if (!k || !modHost.model.routesOfTarget(k.dataset.param).some((r) => !r.dormant)) return; const id = k.dataset.param; k.removeAttribute('data-param');
      document.addEventListener(type, () => { k.dataset.param = id; }, { capture: true, once: true }); }, true);
  }


  function toggleUI() {
    const on = document.body.classList.toggle('ui-hidden');
    uiHidden = on;
    if (on) { ui.frameWas = mat.frame; ui.axisWas = mat.axis; mat.frame = false; mat.axis = false; }
    else { if (ui.frameWas !== undefined) mat.frame = ui.frameWas; if (ui.axisWas !== undefined) mat.axis = ui.axisWas; metersWall = 0; govVersion = -1; }
    if (ui.frameSw) ui.frameSw.set(mat.frame !== false); if (ui.axisSw) ui.axisSw.set(mat.axis !== false);
    schedule(TIER.PRESENT);
  }
  let tabIdx = 0, tabOrder = null;                                 // the cycle runs over the windows' ORIGINAL order
  /* ── THE TAB ORDER, STATED (wave 55) ────────────────────────────────────────────────────────────
   * THE MIRROR RACK top to bottom, then THE RIGHT RACK top to bottom, then WHATEVER IS FLOATING,
   * back-most first — captured at the first TAB of the session and never rebuilt.  It is frozen because
   * the ACT moves a card to the top of its rack: a re-read order would bounce between two windows for
   * ever.  And because the array holds the ELEMENTS, A WINDOW KEEPS ITS SEAT when it pops out or docks
   * back — the cycle walks the same list on the stage as in the rack, which is the whole point.
   * "To the top" means the top of its rack for a docked window and the FRONT OF THE STACK for a floating
   * one; either way it is unfolded, and a rail is opened back to full, because TAB's promise is that the
   * window it names is the one you can now read. */
  function cycleWindow(dir) {
    if (!tabOrder) tabOrder = [...(rackL ? rackL.querySelectorAll('.dev') : []), ...rack.querySelectorAll('.dev'), ...(floats ? floats.querySelectorAll('.dev') : [])];
    const n = tabOrder.length; if (!n) return;
    const fl = rk.floating(), front = fl.length ? devById(fl[fl.length - 1]) : null;
    const isTop = (d) => (d.classList.contains('floating') ? d === front : d === (d.parentElement || rack).querySelector('.dev:not([hidden])'));
    let i = tabIdx, guard = 0;
    do { i = (i + dir + n) % n; guard++; } while ((tabOrder[i].hidden || tabOrder[i].classList.contains('closed') || isTop(tabOrder[i])) && guard < 2 * n);
    tabIdx = i;
    const dev = tabOrder[i];
    if (dev.classList.contains('floating')) { rk.float(dev.dataset.id); if (dev.classList.contains('compact')) layout.setCompact(dev.dataset.id, false); }
    else { (dev.parentElement || rack).prepend(dev); (dev.parentElement || rack).scrollTop = 0; }
    if (dev.classList.contains('folded')) { const f = dev.querySelector('.dev-fold'); if (f) f.click(); }
    dev.classList.add('tab-hot'); setTimeout(() => dev.classList.remove('tab-hot'), 600);
  }
  __LW_hooks.keys = {
    actions: ACTIONS,
    bind: kt.bind, conflicts: kt.conflicts, reset: kt.reset,   // 0.5.0 C3: λWAVES' binding law over the kit's table (lab/key-table.js)
    /* optimization N4: capture(id) and the dispatcher's capture branch served only the SETTINGS KEYS chips that 5f6421e
       deleted; the keyboard editor records its chords itself.  `capturing` stays readable (the legacy gate reads it). */
    name: (a) => kt.keyText(a.id), get capturing() { return null; },
    /* WAVE 55: the frozen cycle, readable and re-freezable — the ONE road to a stated order rather than a
       gate re-deriving it from the DOM and calling its own guess the law. */
    get tabOrder() { return (tabOrder || []).map((d) => d.dataset.id); },
    resetTabs() { tabOrder = null; tabIdx = 0; return true; },
    toggleUI, cycleWindow, table: kt.table,
  };

  /* ── persistence (§46): experiment and presentation, separately ───────── */
  /* 0.3.1 · S3 THE EDIT SCOPE (PLAN §4.1, D6; docs/STATE-SCOPES.md) — what the history reads, keys and writes back: the PROJECT keys
     minus the view, quality, the notebook and the WORKSPACE (no DOM read), and minus what a clock or a modulator moves (experiment.t,
     a bound macro's value, a modulated target's output — its seat keeps the base —, mat.steps, domain.half under AUTO). */
  const EDIT_SKIP = ['obs', 'quality', 'layout', 'modwin', 'camera', 'notebook'];
  /** where each modulation target's hand value sits in a serialize() record, [object, key, f, back]: a saved project and a history
   *  row keep the registry BASE there.  A STATES lane slot (f: its amplitude / wrapped phase) is seated by the edit scope only. */
  function modSeats(data) {
    const pr = data.presentation, I = pr.instruments || {}, st = I.states, T = 2 * Math.PI;
    return { 'observer.yaw': [pr.obs, 'yaw'], 'observer.pitch': [pr.obs, 'pitch'], 'observer.dist': [pr.obs, 'dist'], 'observer.fov': [pr.obs, 'fov'],
      'observer.panx': [pr.obs && pr.obs.shift, 0], 'observer.pany': [pr.obs && pr.obs.shift, 1],
      'material.stage': [pr.ui.stage, 'mix'], 'material.gamma': [pr.mat, 'gamma'], 'material.exposure': [pr.mat, 'exposure'], 'material.softness': [pr.mat, 'softness'],
      'material.hue': [pr.mat, 'hueShift'], 'material.iso': [pr.mat, 'iso'], 'material.grain': [pr.mat, 'grain'], 'material.knee': [pr.mat, 'knee'],
      'material.slice.pos': [pr.mat.slice, 'pos'], 'material.slice.thick': [pr.mat.slice, 'thick'], 'transport.rate': [data.experiment, 'rate'],
      'state.rot.z': [pr.rotationRates, 'z'], 'state.stark.kz': [pr.rotationRates, 'kz'], 'state.defect.l2': [pr.rotationRates, 'def'], 'state.rabi': [pr.ab, 'omega'],
      'chem.kick': [I.chem, 'kappa'], 'chem.speed': [I.chem, 'speed'], 'reg.morph': [st, 'morph'], 'reg.e0': [st && st.drive, 'e0'], 'reg.w': [st && st.drive, 'omega'],
      ...Object.fromEntries(((st && st.lanes) || []).slice(0, 8).flatMap((L, i) => [['reg.amp' + (i + 1), [L, 'amp', Math.sqrt, (a) => a * a]], ['reg.ph' + (i + 1), [L, 'phase', (v) => ((v % T) + T) % T]]])) };
  }
  /* 0.5.0 D9 · QCD's window is deleted; its record `instruments.qcd` stays as QUARKONIUM's parameters (the key and shape it had) */
  const quarkonium = () => { const s = HAMILTONIANS.cornell.system; return { kind: s.kind, potential: s.pot, params: { alphaS: s.params.alphaS, sigma: s.params.sigma, C: s.params.C } }; };
  let restoreNotice = '';   // D9: what the last restore could not bring back (a retired legacy window), in one line; '' when nothing
  function serialize(opt) {
    const edit = !!(opt && opt.scope === 'edit');
    const m = JSON.parse(JSON.stringify(mat)); for (const k of ['bg', 'lightUI', 'stageCustom', ...FIELD_CHROME]) delete m[k];   // the stage colour travels under presentation.ui.stage; GAMMA remains an artist-owned material value; the chrome is the reader's (S1)
    const H = getHamiltonian();
    /* WAVE 56 · THE TWO KEYS A LINK NEEDED.  `damping` (DRAG γ) lived only in the undo ring's own record and
       `paletteId` only in this browser's settings, so a state serialised for a LINK arrived at the reader with
       neither.  Both are additive: restore() reads neither, so a project written today opens on a build from
       yesterday and a project written yesterday opens here, unchanged in either direction — the link-open path
       below is what applies them, because a link is the one road on which they are somebody else's. */
    const S = { experiment: Object.assign(reg.serialize(clock.t), { rate: clock.rate, window: clock.window, damping: reg.damping }),
      presentation: { obs: { ...obs, shift: [...obs.shift] }, mat: m, quality: { ...quality }, domain: { ...domain }, shadow: shadowView.mode,
        paletteId: palette ? palette.id : PAL_DEF,
        space, palette: palette ? { on: palette.on, selected: palette.selected, stops: palette.stops.map((s) => ({ at: s.at, rgb: Array.from(s.rgb) })) } : null,
        hamiltonian: { id: H.id, Z: getZ(), atomZ: HAMILTONIANS.atom.Z, well: HAMILTONIANS.well.radius, gasBasis: gasAxial ? 'axial' : 'reg' },
        wigner: { zmax: wignerView.zmax, pmax: wignerView.pmax },
        readers: { spectrum: { selected: spectrum.selected, dials: spectrum.dials }, slice: slice.save(), kepler: { shell: kepShell() } },
        /* Static instrument controls belong to the composition. Solver caches, traces, collisions,
           particles and pulse runs do not: every project still opens paused on its first frame. */
        instruments: { chem: chem.save(), orbitals: orbitals.save(), states: states.save(), register: { mode: register.mode }, qcd: quarkonium(),
          ladder: { ...ladder.params },
          particles: { count: Math.round(ui.pN.get()), trail: particles.trailLen } },
        rates: Array.from(rates), rotationRates: { ...rotRate }, sturmian: { on: sturm.on, lambda: sturm.lambda },
        modulation: modHost ? modRackStamped() : null,
        /* 2026-09-10 (Josh): A PROJECT IS A DAW PROJECT — the stage, the window arrangement (every window as it stands,
           floats included), the modulation window's placement, auto-rotate, the overlays, SPECTRUM's DIALS fold, the A/B
           transition, the notebook's size when it was resized. Every key is additive: a file without it opens as before.
           0.3.1 · S1 THE SCOPE LAW (docs/STATE-SCOPES.md): the theme, card style, frost, disconnected cards, accents and
           the camera's feel are PREFERENCE — the reader's furniture — and are never written here again. */
        ui: { stage: { mix: stageMix, custom: mat.stageCustom.slice(0, 3), follow: stageFollow } },
        layout: !edit && layout.captureLayout ? layout.captureLayout() : null,
        modwin: !edit && modView ? modView.presentation() : null,
        camera: { autoRotate: !!camera.autoRotate },
        overlays: { vortex: { on: !!vortex.on, overlay: !!vortex.overlay }, kepler: !!kepler.on, particles: { on: !!particles.on, count: particles.points.length }, dials: !!spectrum.dials },
        ab: ui.ab ? ui.ab.get() : null,
        notebook: !edit && layout.notebookSize ? (() => { const n = layout.notebookSize(); return n.custom ? { w: n.w, h: n.h } : null; })() : null } };
    const T = !edit && tl ? tl.model.serialize() : null; if (T && (T.clips.length || T.active)) S.presentation.timeline = T;   // 0.5.0 C7b: the arrangement, only when there is one (NEW and the demos stay byte-exact); never an undo row's
    if (!edit) return S;
    const pr = S.presentation, R = modHost && modHost.registry;
    delete S.experiment.t; delete pr.mat.steps; if (pr.domain.auto) delete pr.domain.half;
    for (const mc of (pr.modulation && pr.modulation.macros) || []) if (mc.sourceId) delete mc.value;
    if (R) for (const [id, [o, k, f]] of Object.entries(modSeats(S))) if (o && R.has(id) && R.isModulated(id)) o[k] = f ? f(R.baseOf(id)) : R.baseOf(id);
    for (const k of EDIT_SKIP) delete pr[k];
    return S;
  }
  /** WAVE 63 · THE RACK CARRIES ITS MODEL VERSION, because nothing else on this road did.
   *  `mod.js` stamps `modV` on a PRESET record and `presetApply` refuses a stamp it cannot read —
   *  that machinery is why bumping MOD_STATE_V to 104 protects the preset store.  But the model's
   *  own `serialize()` emits NO version at all and `deserialize()` checks none, so a project file
   *  and this browser's localStorage — the road the lab actually uses every session — were
   *  version-blind: a rack with a bipolar route, opened by a build that took an upstream `mod.js`
   *  and lost markers 2/8 and 6/8, would drop the flag and move the base by 30 % of scale with no
   *  warning at all.  `v` is additive (the model ignores an unknown key, so this is byte-compatible
   *  in both directions) and `restoreModulation` below is the loader that refuses what it cannot
   *  honour.  `rack.js` is OURS, so the guard survives an upstream re-take of the vendored file —
   *  which is the whole scenario PORT-NOTES.md warns about. */
  function modRackStamped() {
    const o = modHost.model.serialize();
    o.v = modHost.model.MOD_STATE_V;
    return o;
  }
  /** LOAD A MODULATION RACK.  The model's own law: a load is STOPPED and starts at bar 1 with phase 0,
   *  so the transport is put down first, every held parameter is handed back to its base, and the
   *  dormancy law is re-run — a route saved against a target this build does not have keeps its
   *  settings and sits inert rather than being thrown away. */
  function restoreModulation(o, savedBases, opening) {
    if (!modHost) return false;
    /* REFUSE WHAT THIS BUILD CANNOT HONOUR, and say so.  An ABSENT `v` is not a refusal — every
       rack written before wave 63 has none and means "predates the stamp", which is the same
       reading `mod.js` prescribes for an absent preset stamp.  A stamp we do not know is a rack
       whose routes may mean something this model does not implement, and loading it half-read is
       the silent 30 % the version exists to prevent: leave the rack exactly as it was and put the
       two numbers on the card. */
    const V = o && typeof o === 'object' ? o.v : undefined;
    if (V !== undefined && !modHost.model.modStateReadable(V)) {
      wState.setStatus('modulation rack refused — model ' + V + ', this build reads ' +
                       modHost.model.MOD_STATE_READS.join(' · '), 'warn');
      return false;
    }
    modHost.clock.pause();
    /* Capture the project values before restoreAll hands the previous rack's live targets back.
       Old projects have no explicit base table; for those, the fully restored controls are the
       migration source. New projects use savedBases, which remains stable through modulation. */
    const incoming = Object.fromEntries(modHost.registry.list().map((id) => [id, modGets[id] ? Number(modGets[id]()) : NaN]));
    modHost.registry.restoreAll();
    const ok = modHost.model.deserialize(o || null);
    modHost.targets.sync();
    for (const id of modHost.registry.list()) {
      const v = savedBases && Number.isFinite(savedBases[id]) ? savedBases[id] : incoming[id];
      if (Number.isFinite(v)) modHost.registry.setBase(id, v);
    }
    modHost.clock.applyAll(true);
    if (modView && !opening) modView.rebuild();                    // wave 127: a window the file opens is rebuilt by its open() (the kit's window.js restore → open → rebuild)
    schedule(TIER.PRESENT);
    return ok;
  }
  function save() { try { const s = serialize(); localStorage.setItem(LS_EXP, JSON.stringify(s.experiment)); localStorage.setItem(LS_PRES, JSON.stringify(s.presentation)); wState.setStatus('saved', 'live'); } catch (e) { wState.setStatus('save failed', 'warn'); } }
  /** the whole session as JSON on the clipboard — STATE's COPY JSON and the FILE menu's row are this one road (N1) */
  async function copyJSON() { try { await navigator.clipboard.writeText(JSON.stringify(serialize(), null, 1)); } catch (_) {} }
  /** opt.history (UNDO / REDO, S3): an edit-scope record; the transport stays where it is (the anchor c(0) travels, so the picture
   *  only moves if the coefficients did) and the ring, notebook, view and arrangement are left alone.  opt.project: a file opens at
   *  t = 0.  Neither clears the history: the road that opened the file does, naming it (boot, link, open · …). */
  function restore(obj, opt) {
    const hist = !!(opt && opt.history), gone = [];                  // D9: the retired legacy windows this file used, named once below
    if (!hist) restoreNotice = '';
    markBatchBegin();                                                // M7: released in the finally below
    try {
      if (opt && opt.project && modHost) { modHost.clock.pause(); modHost.registry.restoreAll(); }   // S2 · a project open puts the running modulation down FIRST (wave 127's law): a route still holding the stage wrote its old base back over the file's mix
      const ex = obj ? obj.experiment : JSON.parse(localStorage.getItem(LS_EXP) || 'null');
      let pr = obj ? obj.presentation : JSON.parse(localStorage.getItem(LS_PRES) || 'null');
      /* S3 · an UNDO re-applies a heavy section only when it moved (probes/S3/undo-while-playing.js: reloading an unchanged rack
         stopped a playing transport and reset every LFO; the palette, instruments and overlays re-upload, re-own or re-seed) */
      if (hist && pr) { const now = serialize({ scope: 'edit' }).presentation; pr = { ...pr };
        for (const k of ['modulation', 'palette', 'instruments', 'overlays']) if (JSON.stringify(pr[k]) === JSON.stringify(now[k])) delete pr[k]; }
      if (ex) {
        if (reg.transition && __LW_hooks.ab) __LW_hooks.ab.set(false);   // wave 127 · every road stands a running A/B transition down FIRST (UNDO's law): clearing it later froze its mix over the register written here
        const t = reg.restore(ex);
        if (!hist) {
          clock.pause(); clock.scrub(opt && opt.project ? 0 : t);
          if (ui.scrub) ui.scrub.set(0);
          shadowView.clearTrail(); shadowFoot.clear(); particles.resetClock(clock.t);
        }
        if (Number.isFinite(ex.rate) && ex.rate > 0) clock.setRate(paceRate(ex.rate));
        if (ex.window) clock.window = ex.window;
        if (Number.isFinite(ex.damping)) { reg.setDamping(ex.damping); if (ui.dragKnob) ui.dragKnob.set(reg.damping); }
        ui.rateKnob.set(clock.rate); ui.presetSel.value = reg.preset || ''; lastNmax = -1; setReference();
      }
      if (pr) { if (!hist) { camLevel.from = null; Object.assign(obs, pr.obs || {}); if (pr.obs) obs.shift = clampShift(pr.obs.shift); obs.mode = obs.mode === 'free' ? 'free' : 'turntable';   /* S2: a pose without a shift (an older file or link) opens at 0 */ if (!Array.isArray(obs.quat) || obs.quat.length !== 4) obs.quat = quatFromYawPitch(obs.yaw, obs.pitch); if (obs.mode === 'free') { /* WAVE 106 · THE ANGLES ARE A READOUT IN FREE, AND A READOUT MUST NOT MOVE THE RECORD.
      A link rounds the quaternion to f32; re-deriving the angles from THAT quaternion lands them an ulp off the
      ones the link carried, so mint(open(link)) stopped being byte-identical the moment the camera began booting
      FREE — B98's fixed point, and the codec's own node suite cannot see it because the asymmetry is here and not
      in statelink.js.  A record whose angles already agree with its pose far closer than any dial can show KEEPS
      the ones it carried; anything that genuinely disagrees is still re-derived, which is what an old favourite
      carrying no quaternion needs. */
      const y0 = obs.yaw, p0 = obs.pitch; syncFreeAngles();
      if (Math.abs(obs.yaw - y0) < 1e-4 && Math.abs(obs.pitch - p0) < 1e-4) { obs.yaw = y0; obs.pitch = p0; } } if (ui.camSeg) ui.camSeg.set(obs.mode); camera.stop(); syncCamUI(); } const pm = { ...(pr.mat || {}) }; for (const k of ['bg', 'lightUI', ...FIELD_CHROME]) delete pm[k]; Object.assign(mat, pm);   /* S1: an older file's chrome is the sender's preference — ignored, so the reader's frame, axes and invert stand */ if (Number.isFinite(pm.gamma) && ui.gammaK) ui.gammaK.set(pm.gamma); mat.finish=pm.finish||'lit'; mat.bow={gain:1,curve:1,limit:3,...pm.bow}; if(ui.finishSeg)ui.finishSeg.set(mat.finish||'lit'); if(ui.bowKnobs)for(const k in ui.bowKnobs)ui.bowKnobs[k].set(mat.bow?.[k]??({gain:1,curve:1,limit:3}[k])); if (ui.styleSeg && STYLE_NAMES[mat.style]) ui.styleSeg.set(STYLE_NAMES[mat.style]); if (ui.ditherSeg) { mat.dither = +mat.dither || 0; ui.ditherSeg.set(mat.dither ? 'ordered' : 'off'); ui.ditherK.setDisabled(!mat.dither); if (mat.dither) ui.ditherK.set(Math.max(0.25, Math.min(2, mat.dither))); } Object.assign(quality, deviceQuality(pr.quality, phone.on ? 'phone' : tablet.on ? 'tablet' : 'desktop'));   /* PACE P2: within the device's grid ceiling, and never AUTO SCALE (the device's switch) */ Object.assign(domain, pr.domain || {}); ui.viewSeg.set(VIEW_NAMES[mat.view]); if (pr.shadow) { shadowView.setMode(pr.shadow); ui.shadowSeg.set(pr.shadow); } ui.domainAuto.set(domain.auto); ui.domainKnob.setDisabled(domain.auto); }
      /* A restored number and the control that owns it are one state. Keep every Wave, Clip,
         field and quality control on the value that was just loaded before modulation reads it. */
      if (pr) {
        for (const [k, v] of [[ui.expK, mat.exposure], [ui.softK, mat.softness], [ui.hueK, mat.hueShift],
          [ui.isoK, mat.iso], [ui.grainK, mat.grain], [ui.kneeK, mat.knee], [ui.slicePosK, mat.slice && mat.slice.pos],
          [ui.sliceThickK, mat.slice && mat.slice.thick]]) if (k && Number.isFinite(v)) k.set(v);
        if (ui.sliceModeSeg && mat.slice) ui.sliceModeSeg.set(['off', 'clip', 'slab'][mat.slice.mode] || 'off');
        if (ui.sliceAxisSeg && mat.slice) ui.sliceAxisSeg.set(['x', 'y', 'z'][mat.slice.axis] || 'z');
        if (ui.gridSeg && [64, 96, 128].includes(quality.res)) ui.gridSeg.set(String(quality.res));
        if (ui.autoSw) ui.autoSw.set(!!quality.auto);
        if (ui.domainKnob && Number.isFinite(domain.half)) ui.domainKnob.set(domain.half);
        if (ui.bz) ui.bz.set(reg.field.Bz); if (ui.fz) ui.fz.set(reg.field.Fz);
        applyAccent();
      }
      if (pr) {
        /* WAVE 63 · A LINK'S MATERIAL WAS DISCARDED 16 ms AFTER IT OPENED.  `Object.assign` above has
           just put the sender's camera and material into `obs`/`mat`; for a target THIS browser has
           routed, nothing then read them: `modSyncBases()` skips modulated ids on every frame by
           design, and the only unconditional re-base lives inside `restoreModulation`, which runs
           only `if (pr.modulation !== undefined)` — a key a LINK never sets and an UNDO record
           deliberately never sets.  So the receiver's own base won one frame later, the visitor never
           saw the sender's exposure 6.5, and pulling the route off afterwards handed back 1.  The
           re-base is unconditional now, and it is FIRST, because restoreModulation's own
           restoreAll() writes the registry's bases back into `mat` and would otherwise clobber the
           file's numbers for exactly the parameters that were modulated when it opened. */
        if (!hist) modSyncBases(true);   // an UNDO's come from its record, below
        if (sturm.P) { sturm.on = false; sturm.P = null; sturm.rec = null; reg.setPropagator(null); reg.setEnergies(energyOf); }   // W-STURMIAN: stand the scale down silently (no re-anchoring) while the file's operator, Z and rates land; its own scale is applied below
        if (pr.hamiltonian) { const h = pr.hamiltonian; if (h.atomZ) setElement(h.atomZ); if (h.Z && h.Z !== getZ()) { setZ(h.Z); if (ui.zKnob) ui.zKnob.set(h.Z); } if (h.well && h.well !== HAMILTONIANS.well.radius) { HAMILTONIANS.well.setRadius(h.well); gas.setRadius(h.well); if (ui.wellKnob) ui.wellKnob.set(h.well); } if (h.id && HAMILTONIANS[h.id]) { setHamiltonian(h.id); switchHamiltonian(h.id); if (ui.hamSeg) ui.hamSeg.set(h.id); } gasAxial = h.gasBasis === 'axial'; if (ui.gasBasis) ui.gasBasis.set(gasAxial ? 'axial' : 'reg'); if (!gasAxial) gas.off(); }
        if (pr.wigner) { const G = pr.wigner; wignerView.setRange(G.zmax, G.pmax); }
        if (pr.instruments) {
          const I = pr.instruments;
          if (I.qcd && typeof I.qcd === 'object') {                    // D9: QUARKONIUM's parameters, as the deleted QCD window applied them
            const q = I.qcd, p = {}; for (const k of ['alphaS', 'sigma', 'C']) if (q.params && Number.isFinite(q.params[k])) p[k] = q.params[k];
            if (HAMILTONIANS.cornell.configure(q.kind, p, q.potential) && getHamiltonian().id === 'cornell') switchHamiltonian('cornell');
          }
          /* Set all field-owning instruments down before selecting the saved one. Their public
             switches enforce mutual exclusion and also own the window-visibility policy. */
          /* D9 · THE H₂⁺ SHIM: a file whose field the retired H₂⁺ card owned opens as MOLECULES · H₂ (STO-3G) on σg or σu — in a
             minimal basis of two 1s functions both orbitals are fixed by symmetry, the combinations the card drew (its R, ON A and the
             pulse have no twin; RHF refuses H₂⁺'s one electron).  Its old `mo` / `pulse` records are read by nothing. */
          const h2plus = !!(I.molecule && I.molecule.on) && !(I.chem && I.chem.on) && !(I.h2 && I.h2.on) && !(I.helium && I.helium.on);
          /* D9 · THE HELIUM SHIM: a file whose field the retired HELIUM card owned opens as SPECTRUM's ATOM at Z = 2 with the 1s
             filled (fillValence) — the central-field He; Hylleraas's correlation, its basis and electron 1 have no twin. */
          const he = !!(I.helium && I.helium.on) && !(I.chem && I.chem.on) && !(I.h2 && I.h2.on);
          /* D9b · THE H₂ SHIM: a file whose field the retired H₂ card (Heitler–London) owned opens as MOLECULES · H₂ (STO-3G) on
             its DENSITY — the card drew the one-electron density, and this is the same molecule's (its R scan, CI curves and the
             collision have no twin).  The old `h2` record and seat are read by nothing else. */
          const hl = !!(I.h2 && I.h2.on) && !(I.chem && I.chem.on);
          const fieldOwner = (I.chem && I.chem.on) || h2plus || hl ? 'chem' : null;
          if (I.chem) chem.load({ ...I.chem, on: false });
          if (h2plus) { const u = I.molecule.kind === 'sigma_u'; chem.load({ preset: 'H2', basis: 'sto-3g', view: 'orbital', orbital: u ? 2 : 1, on: false }); gone.push('H₂⁺ (opened as MOLECULES · H₂ ' + (u ? 'σu' : 'σg') + ')'); }
          if (hl) { chem.load({ preset: 'H2', basis: 'sto-3g', view: 'density', orbital: null, on: false }); gone.push('H₂ (opened as MOLECULES · H₂)'); }
          /* the ORBITALS register lands OFF first, like every field-touching card, and is switched on only after
             CHEMISTRY holds the volume — its own load() parks the selection until a ladder exists to hang it on */
          if (I.orbitals) orbitals.load({ ...I.orbitals, on: false });
          if (I.states) states.load({ ...I.states, on: false });
          if (I.register) register.setMode(I.register.mode);
          if (he) { setElement(2); fillValence(); gone.push('HELIUM (opened as ATOM · He 1s)'); }
          else if (fieldOwner === 'chem') chem.setOn(true);
          if (I.orbitals && I.orbitals.on && fieldOwner === 'chem') orbitals.setOn(true);
          if (I.states && I.states.on && fieldOwner === 'chem') states.setOn(true);   // parks itself until the ladder lands (statesview `wanted`)
          if (I.ladder) ladder.load(I.ladder);                         // M2 (2026-09-24): lands the params, defers the scan (ladder.js load)
          if (I.particles) {
            if (Number.isFinite(I.particles.count)) ui.pN.set(I.particles.count);
            if (Number.isFinite(I.particles.trail)) { particles.setTrail(I.particles.trail); ui.pTrail.set(I.particles.trail); }
          }
        }
        /* D9b · THE ELECTROSTATICS SHIM: a file whose overlay the retired window drew opens without it and says so; nothing is drawn */
        if (pr.field && pr.field.overlay && pr.field.overlay !== 'off') gone.push('ELECTROSTATICS');
        if (Array.isArray(pr.rates) && pr.rates.length === 91) { rates.set(pr.rates); reg.setEnergies(energyOf); }
        /* 2026-09-10 · THE DAW KEYS, each only when the file carries it (see serialize).  0.3.1 · S1: of `ui` only the STAGE
           is read; an older file's theme / card / frost / disc / accent, and its camera feel, are the sender's preferences
           and are ignored — opening a project never changes this browser's settings (docs/STATE-SCOPES.md). */
        if (pr.ui) { const U = pr.ui;
          if (U.stage) {
            if (Number.isFinite(U.stage.mix)) { stageMix = Math.max(0, Math.min(1, U.stage.mix)); if (ui.stageK) ui.stageK.set(stageMix); }
            const custom = Array.isArray(U.stage.custom) ? U.stage.custom : (Array.isArray(U.stage.b) ? U.stage.b : (Array.isArray(U.stage.a) ? U.stage.a : null));
            if (__LW_hooks.setStageColour) __LW_hooks.setStageColour(custom);
            if (__LW_hooks.setStageFollow) __LW_hooks.setStageFollow(typeof U.stage.follow === 'boolean' ? U.stage.follow : !custom);
          } }
        if (pr.camera) camera.setAutoRotate(!!pr.camera.autoRotate);
        if (pr.overlays) { const O = pr.overlays;
          if (O.vortex) { vortex.setOn(!!O.vortex.on); vortex.setOverlay(!!O.vortex.overlay); }
          if (O.kepler !== undefined) { kepler.setOn(!!O.kepler); if (ui.keplerSw) ui.keplerSw.set(!!O.kepler); }
          if (O.particles) { const count = pr.instruments && pr.instruments.particles && Number.isFinite(pr.instruments.particles.count) ? pr.instruments.particles.count : O.particles.count; if (O.particles.on) { particles.setOn(true); particles.seed(count || 160, reg, clock.t, domain.half); } else particles.setOn(false); ui.pOn.set(!!O.particles.on); }
          if (O.dials !== undefined && spectrum.setDials && !(pr.readers && pr.readers.spectrum)) spectrum.setDials(!!O.dials); }
        if (pr.readers) {
          if (pr.readers.spectrum) { const S = pr.readers.spectrum; if (Number.isFinite(S.selected)) spectrum.select(S.selected); if (S.dials !== undefined) spectrum.setDials(!!S.dials); }
          if (pr.readers.slice) slice.load(pr.readers.slice);
          if (pr.readers.kepler && Number.isFinite(pr.readers.kepler.shell) && ui.kepShell) { ui.kepShell.set(String(pr.readers.kepler.shell)); keplerRowSync(true); }
        }
        if (pr.ab && ui.ab) ui.ab.set(pr.ab);
        if (pr.notebook && layout.notebookResize && Number.isFinite(pr.notebook.w) && !(pr.layout && pr.layout.nb)) layout.notebookResize(pr.notebook.w, pr.notebook.h);   // wave 127: a layout carrying nb sizes it next (applyLayout), last
        if (pr.layout && layout.applyLayout) layout.applyLayout(pr.layout);
        if (getHamiltonian().id === 'atom' && !hist) { wAtoms.root.hidden = false; wAtoms.root.classList.remove('closed'); }   // 0.4.0 S0: the ATOM operator brings its element picker
        if (pr.instruments && chem.on && !hist) { wChem.root.classList.remove('closed'); const I = pr.instruments; if ((I.orbitals && I.orbitals.on) || (I.states && I.states.on)) wOrbs.root.classList.remove('closed'); }   // W129 · the same law for MOLECULES (a first visit leaves it and MO-REGISTRY off the rack): a file it owns brings it back, and MO-REGISTRY when the file's register is on
        /* D9 · A FILE THAT USED A RETIRED WINDOW OPENS WITHOUT IT, AND SAYS SO IN ONE LINE (the PROJECTS status and STATE's): an old
           layout seat is skipped by applyLayout (no such card), nothing throws.  QCD counts as used when its seat was open. */
        if (!hist && pr.layout && Array.isArray(pr.layout.cards) && pr.layout.cards.some((c) => c && c.id === 'qcd' && !c.closed)) gone.push('QCD (QUARKONIUM keeps its parameters)');
        if (gone.length) restoreNotice = 'retired in 0.5.0: ' + gone.join(' · ');
        stageTextTick();                                              // the STAGE TEXT follows whatever MOLECULES the file left
        if (pr.sturmian) { sturm.on = !!pr.sturmian.on; sturm.lambda = Math.max(0.25, Math.min(3, +pr.sturmian.lambda || 1)); } else sturm.on = false;   // a file without it means HYDROGEN
        applySturmian(true);                                          // the file's anchor is c(0) under the file's own law: keep it
        /* S3 · an UNDO's bases are its record's seats, never read back off a control the modulator is moving (an unseated target keeps
           its base; an unmodulated one is the control just written) */
        const histBases = {};
        if (hist) { const R = modHost.registry, seats = modSeats(obj);
          for (const id of R.list()) if (R.isModulated(id)) { const s = seats[id]; R.setBase(id, histBases[id] = s && s[0] ? (s[3] || Number)(s[0][s[1]]) : R.baseOf(id)); } }
        // Restore operator rates AFTER the destination scale is installed. The old project's
        // Sturmian guard must not erase a Coulomb project's rates on the way in.
        const rr = pr.rotationRates;
        for (const key of Object.keys(rotRate)) {
          const v = setRotationRate(key, rr && Number.isFinite(rr[key]) ? rr[key] : 0);
          const id = key === 'z' ? 'state.rot.z' : key === 'kz' ? 'state.stark.kz' : 'state.defect.l2';
          modHost.registry.setBase(id, v);
        }
        if (pr.modulation === undefined) modHost.clock.applyAll(true);
        if (pr.space && pr.space !== space && !getHamiltonian().noMomentum && !sturm.P) { space = pr.space; if (ui.spaceSeg) ui.spaceSeg.set(space); }
        if (pr.palette && palette) {
          if (Array.isArray(pr.palette.stops)) palette.load(pr.palette.stops, pr.palette.selected, pr.paletteId); else if (pr.paletteId) palette.select(pr.paletteId);   // wave 127: the file's own stops under its name — one push, not a catalogue read then a load
          palette.setOn(!!pr.palette.on); if (!pr.palette.on && mat.view !== undefined) ui.viewSeg.set(VIEW_NAMES[mat.view]);
        }
        /* Restore modulation last. Its base setters now see the final camera, Stage, transport,
           palette and state controls, so no later project step can overwrite a routed hand value. */
        const modWas = hist && pr.modulation !== undefined && modHost && modHost.clock.isPlaying();
        if (pr.modulation !== undefined) restoreModulation(pr.modulation, hist ? histBases : pr.modulationBases, !!(pr.modwin && pr.modwin.open));
        if (modWas) modHost.clock.play(performance.now() / 1000);       // S4 · restoreModulation put the clock down: an undo under THE play puts it back to playing (its demand is still held)
        if (pr.modwin && modView) modView.restore(pr.modwin);
        if (!hist && tl) tl.model.restore(pr.timeline || null);           // 0.5.0 C7b: an open replaces the arrangement (NEW clears it); an undo leaves it — it keeps its own
      }
      schedule(TIER.REBUILD); wState.setStatus(gone.length ? restoreNotice : 'restored', gone.length ? 'warn' : 'live');
      return true;
    } catch (e) { console.warn('restore failed', e); wState.setStatus('restore failed', 'warn'); return false; }   // say WHY in the console too: a silent catch hid a scope error for an afternoon
    /* OPTIMIZATION 2026-09-24 · M5: a restore that throws half-way has still moved state, and an early throw left it
       never rebuilt — so the rebuild is asked for on EVERY exit (on success it is the same coalesced request as above). */
    finally { schedule(TIER.REBUILD); markBatchEnd(); }
  }

  /* ── WAVE 56 · SHAREABLE LINKS (board #55) ────────────────────────────────────────────────
   * lab/statelink.js is a CODEC on serialize()'s OWN object — not a second serialisation — so a link is
   * the project file, minus what format v1 has no room for, in about three hundred characters of FRAGMENT
   * (never a query: a fragment is not sent to a server, and a link carries somebody's work).
   * TWO THINGS ARE LAWS HERE, and neither is decoration:
   *   SAY WHAT IS NOT CARRIED.  encodeState() returns `notCarried`, and v1 does not carry the MOLECULE
   *     panel or the MODULATION rack.  A link that silently dropped a reader's modulators would be a lie,
   *     so the mint puts the COUNT in the status line and NAMES them in a note that stays on the card —
   *     never in a hover, and never only in the console (ANTI-PATTERNS 4).
   *   A LINK IS THE BOTTOM OF THE STACK.  Exactly as `?preset=` is: opening one clears the undo ring,
   *     because there is nothing behind it to undo back to.
   * The two keys serialize() gained above are applied HERE and nowhere else: restore() is the project
   * road and does not read them, so a link opening is the one place where somebody else's palette choice
   * and somebody else's DRAG γ land in this browser. */
  const NOT_CARRIED_NAME = { mo: 'the MOLECULE panel', modulation: 'the MODULATION rack', rotationRates: 'the rotation and deflection rates' };
  const notCarriedWords = (keys) => keys.map((k) => NOT_CARRIED_NAME[k] || k).join(' · ');
  const esc = (t) => String(t).replace(/[&<>]/g, (c) => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;'));
  let linkLast = null;

  /** what the interface says about a link, in the two places it can be read: the STATE card's status line
   *  (short, and its hover hint carries the whole of it) and a note on the card that does not disappear. */
  function linkSay(msg, cls, detail) {
    wState.setStatus(msg, cls || 'live');
    if (ui.linkNote) { ui.linkNote.innerHTML = detail || ''; ui.linkNote.hidden = !detail; }
    return msg;
  }

  /** the href for the state as it stands, with everything encodeState measured about it */
  function mintLink() { linkLast = linkFor(serialize(), { paletteId: palette ? palette.id : PAL_DEF, orbitalKey: chem.on ? chem.orbitalKey() : null }); return linkLast; }   // S2: the molecule's orbital rides by its S1 name

  /** MINT and copy.  Reports `chars`, and when something is not carried it SAYS SO. */
  async function copyLink() {
    let enc;
    try { enc = mintLink(); }
    catch (e) { linkSay('link failed', 'warn', '<b>THE LINK COULD NOT BE BUILT.</b> ' + esc(e && e.message || e)); return null; }
    let copied = false;
    try { await navigator.clipboard.writeText(enc.href); copied = true; } catch (_) {}
    const say = [];
    if (enc.notCarried.length) say.push('<b>THIS LINK DOES NOT CARRY:</b> ' + notCarriedWords(enc.notCarried)
      + '. Link format v1 does not carry those settings — everything else in this window is in it: the register and its mask, the clock, the operator and its scale, the camera, the material, the palette and the 91 rates.');
    if (enc.dropped) say.push('<b>' + enc.dropped + ' coefficient' + (enc.dropped === 1 ? '' : 's') + ' fell below the link\'s 16-bit floor</b> and — at under 2.3e-10 of the peak population — travelled as zero.');
    if (!enc.fits) say.push('<b>' + enc.chars + ' CHARACTERS.</b> That is past the ' + LINK_CHAR_CEILING
      + '-character length a URL can be relied on to survive in a chat app or a mail client. It opens here; it may be cut in transit.');
    if (!copied) say.push('<b>THE CLIPBOARD REFUSED</b> (this browser only hands it to a trusted gesture). The link is here, to copy by hand:<br><code>' + esc(enc.href) + '</code>');
    linkSay((copied ? 'link copied · ' : 'link NOT copied · ') + enc.chars + ' chars'
      + (enc.notCarried.length ? ' · ' + enc.notCarried.length + ' not carried' : ''),
      copied && enc.fits ? 'live' : 'warn', say.join(' '));   // what v1 cannot carry is TRUE OF EVERY LINK, so it is information and not an alarm: the count is in the words, the colour is kept for a link that did not copy or will not survive a paste
    enc.copied = copied;
    return enc;
  }

  /** OPEN a link.  `null` from readLink() means the href simply carries no state, which is a plain visit and
   *  not an error; a LinkError means one it cannot read, and that is shown — never a console-only failure. */
  function openLink(href) {
    let got;
    try { got = readLink(href === undefined ? location.href : href); }
    catch (e) {
      const code = e instanceof LinkError ? e.code : 'error';
      linkSay('link not read', 'warn', '<b>THIS LINK DID NOT OPEN.</b> ' + esc(e && e.message || e) + ' <i>Nothing in the lab was changed.</i>');
      return { ok: false, opened: false, code, message: String(e && e.message || e) };
    }
    if (!got) return { ok: true, opened: false, code: null, message: null };
    /* THE PALETTE IS NAMED BEFORE THE STATE IS RESTORED, never after: select() re-reads the catalogue's own
       stops, so doing it second would throw away an EDITED palette that the link had carried in full. */
    if (got.paletteId && palette && got.paletteId !== palette.id) palette.select(got.paletteId);   // S1 (D2): the palette is the link's, never written into this browser's settings
    const ok = restore(got.state);
    const d = +(got.state.experiment && got.state.experiment.damping);
    if (Number.isFinite(d) && d !== reg.damping) { reg.setDamping(d); if (ui.dragKnob) ui.dragKnob.set(d); }
    if (history) history.clear('link');                 // a link is the BOTTOM of the stack, exactly as ?preset= is
    const say = [];
    for (const w of got.warnings || []) say.push('<b>NOTE.</b> ' + esc(w) + '.');
    if ((got.unknownSections || []).length) say.push('<b>' + got.unknownSections.length + ' part' + (got.unknownSections.length === 1 ? '' : 's')
      + ' of this link were written by a newer build</b> and this one skipped them; everything it does know was applied.');
    linkSay(ok ? 'opened from a link' : 'link read, restore failed', ok && !say.length ? 'live' : 'warn', say.join(' '));
    return { ok, opened: true, code: null, message: null, warnings: got.warnings, unknownSections: got.unknownSections };
  }


  /* 0.3.1 · S3 THE TRUE HISTORY: one reader, writer and key over the edit scope (the chrome, a PREFERENCE, left with the hand-kept
     lists); the key is FNV-1a over the record's JSON, taken at a commit and by canUndo / canRedo — never per frame.  0.5.0 C5: the
     rows are the kit's stack (mir/history/history.js), this record its one `edit` domain (lab/edit-domain.js) */
  const hKey = (j) => { let h = 0x811c9dc5; for (let i = 0; i < j.length; i++) h = Math.imul(h ^ j.charCodeAt(i), 0x01000193); return (h >>> 0).toString(36) + ':' + j.length; };
  let __hver = reg.version;
  Object.defineProperty(reg, 'version', { configurable: true, get() { return __hver; }, set(v) { __hver = v; if (!rotTicking) hNote(); } });
  /* the LIST repaints itself whenever the ring moves — `onChange` is the ring's own hook and fires on
     every commit, undo, redo, goto and clear, so nothing polls and nothing can drift out of step. */
  let hRender = null;
  history = createEditHistory({ read: () => { const S = serialize({ scope: 'edit' }); S.key = hKey(JSON.stringify(S)); return S; },
    write: (S) => restore(S, { history: true }), liveKey: () => hKey(JSON.stringify(serialize({ scope: 'edit' }))), depth: 60, quiet: 400, driven: () => rotMoved && rotDriving(),
    onChange: () => { if (hRender) hRender(); } });
  /* ══ WAVE 106 · THE ROWS GET THEIR NAMES FROM THE THING THE HAND TOUCHED ════════════════════════
     An FL-style list is only worth having if a row says what it was — "Move Pattern", not "edit #17".
     The ring can carry a label now; the question was where a name could come from without touching
     every one of the hundreds of setters in this file.
       It comes from the GESTURE.  This handler already fires on the way down for every control in the
     lab, and the event knows what was pressed — so the name is read off the DOM at exactly the moment
     the coalescing window opens, and every control in the instrument is named for free, including the
     ones written after today.  A knob gives its own caption, a switch and a trigger their word, a
     segment the button plus the group it belongs to; the WINDOW's title comes along so two knobs
     called RATE in different cards do not read as one thing.
       An UNNAMED gesture leaves the ring's default alone rather than blanking a name — a press on the
     card's background should not erase what the drag before it was called. */
  const hTouchName = (t) => {
    if (!t || !t.closest) return '';
    /* the EYEBROW, not the title: `.dev-eyebrow` is the card's short name (ORBIT, WAVE, CLIP) while
       `.dev-title` is its full sentence — measured, a title gave rows like
       "EXPOSURE · SPACE · DRAW · WHAT IS DRAWN OVER THE FIELD", which is a paragraph in a list column.
       This is the same `nameOf` the WINDOW menu already uses for the same reason. */
    const txt = (e) => (e && (e.textContent || '').trim().replace(/\s+/g, ' ')) || '';
    const dev = t.closest('.dev'), mw = !dev && t.closest('#modwin');   // S3: a float, titled by its .kwin-title
    const win = dev ? ((dev.querySelector('.dev-eyebrow') || {}).textContent || dev.dataset.id || '') : mw ? txt(mw.querySelector('.kwin-title')) : '';
    let what = '';
    const k = t.closest('.k');
    if (k) what = txt(k.querySelector('.k-lbl')) || k.getAttribute('aria-label') || 'knob';
    if (!what) { const sw = t.closest('.sw'); if (sw) what = txt(sw.querySelector('.sw-lbl')) || 'switch'; }
    /* a SEG labels itself with `.k-lbl` too (kit.js builds both from the same helper) — on the `.segw` that wraps the
       `.seg` (S4: `closest('.seg, .segw')` stopped at the `.seg`, so a row read DARK, not THEME DARK); safe because
       the knob branch above already claimed anything inside a .k */
    if (!what) { const sb = t.closest('.seg-b'); if (sb) { const g = sb.closest('.segw') || sb.closest('.seg');
      const gl = g ? txt(g.querySelector('.k-lbl')) : ''; what = (gl ? gl + ' ' : '') + txt(sb); } }
    if (!what) { const tr = t.closest('.trig'); if (tr) what = txt(tr.querySelector('.trig-l')) || txt(tr); }
    if (!what) { const fd = t.closest('.fd'); if (fd) what = txt(fd.querySelector('.fd-lbl')) || fd.getAttribute('aria-label') || 'fader'; }
    if (!what) { const f = t.closest('select, input'); if (f && f.type !== 'text' && f.type !== 'search') what = (f.getAttribute('aria-label') || f.title || (f.type === 'color' ? 'colour' : '')).toUpperCase(); }   // S3: a colour well or a <select>
    /* S3 · the MODULATION window's controls: a dial by device and caption (LFO RATE), the rest by device or macro slot and short
       label (LFO SINE, MACRO 1 DEPTH); a label too long for a list gives its first word (LFO BYPASS).  S4 · the curve editor (the
       `.m2svg` of an LFO or ENV; an AUDIO editor is a meter) names its source: its label, else its kind and its place among that
       kind in the window — CURVE · LFO 1 · MODULATION */
    if (!what && mw) {
      const d = t.closest('.m2dev'), slot = t.closest('.m2slot'), k2 = t.closest('.m2k'), c = t.closest('button, input, [aria-label]');
      const curve = d && t.closest('.m2svg') && ['lfo', 'env'].find((x) => d.classList.contains(x));
      if (curve) {
        const own = txt(d.querySelector('.m2minname')).toUpperCase(), K = curve.toUpperCase();
        what = 'CURVE · ' + (own && own !== K ? own : K + ' ' + ([...mw.querySelectorAll('.m2dev.' + curve)].indexOf(d) + 1));
      } else {
        let word = k2 ? txt(k2.querySelector('.m2kcap')) : c ? (c.getAttribute('aria-label') || txt(c)).split(' — ')[0] : '';
        if (word.length > 24) word = word.split(' ')[0];
        const owner = (d ? txt(d.querySelector('.m2kind')) : slot ? txt(slot.querySelector('.m2vname')) : '').toUpperCase();
        word = word.toUpperCase(); what = owner && !word.includes(owner) ? (owner + ' ' + word).trim() : word;
      }
    }
    if (!what) return '';
    const w = (win || '').trim();
    return w && w.toUpperCase() !== what.toUpperCase() ? what + ' · ' + w : what;
  };
  const heldPointers = new Set();
  /* S4 · the RIGHT button is a gesture too: MIR's curve editor adds and places a point by right-drag and resets a tension handle by
     right-click, so button 2 is held and released like button 0 (one row, named).  A pointer already held here lost its up (a
     native context menu can take it): that hold is released first, so a stale count never outlives the next press. */
  document.addEventListener('pointerdown', e => {
    if (e.button !== 0 && e.button !== 2) return;
    if (heldPointers.has(e.pointerId)) releasePointer(e);
    heldPointers.add(e.pointerId); pointerHeld = true;
    history.hold(hTouchName(e.target));
  }, true);
  const releasePointer = e => {
    if (!heldPointers.delete(e.pointerId)) return;
    pointerHeld = heldPointers.size > 0;
    history.release(); // Commits on the next task, after the control's onChange.
  };
  // Capture also sees releases that a control stops from bubbling. An implicit
  // lost capture after pointerup must not release a second finger's undo hold.
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) document.addEventListener(type, releasePointer, true);
  /* S3 · …and the form fields a pointer does not frame (a colour picker, a <select>, a typed name land after the pointerup): their
     input/change events arm the ring, named like a press (notebook typing moves no edit key: no row) */
  for (const type of ['input', 'change']) document.addEventListener(type, (e) => history.note(hTouchName(e.target)), true);
  const releasePointers = () => { for (const pointerId of heldPointers) releasePointer({ pointerId }); };
  window.addEventListener('blur', releasePointers);
  window.addEventListener('pagehide', releasePointers);
  document.addEventListener('visibilitychange', () => { if (document.hidden) releasePointers(); });
  const historyApi = {
    undo() { const ok = history.undo(); if (ok) wState.setStatus('undone · ' + history.depth + ' back, ' + history.redoDepth + ' forward', 'live'); return ok; },
    redo() { const ok = history.redo(); if (ok) wState.setStatus('redone · ' + history.depth + ' back, ' + history.redoDepth + ' forward', 'live'); return ok; },
    historyUndo() { const ok = history.historyUndo(); if (ok) wState.setStatus('returned from history jump', 'live'); return ok; },
    get canUndo() { return history.canUndo; }, get canRedo() { return history.canRedo; },
    get canHistoryUndo() { return history.canHistoryUndo; },
    get depth() { return history.depth; }, get redoDepth() { return history.redoDepth; }, get limit() { return history.limit; },
    clear() { history.clear(); }, flush() { return history.flush(); }, note(name) { history.note(name); },
    /* wave 106: the three the LIST needs — the rows, where the instrument is standing, and the jump.
       `goto` commits first (that is the ring's own rule), so jumping away from an unbanked edit banks
       it rather than losing it. */
    entries() { return history.entries(); }, get cursor() { return history.cursor; },
    render() { if (hRender) hRender(true); },   // S4: now (the ring's own onChange waits for the next frame)
    goto(i) { const ok = history.goto(i); if (ok) wState.setStatus('history · row ' + (history.cursor + 1) + ' of ' + history.entries().length, 'live'); return ok; },
    label(name) { history.label(name); },
  };


  const wHist = device({ id: 'history', eyebrow: 'HISTORY', status: '' });
  rack.appendChild(wHist.root); rk.register({ id: 'history', el: wHist, title: 'HISTORY', hint: 'HISTORY' });   // C3: registered where it is built (A4's open item)
  const histList = el('div', 'hist-list', wHist.body);
  let histUndoBtn = null, histRedoBtn = null, histReturnBtn = null;
  {
    const rh = wHist.row('tight hist-actions');
    histUndoBtn = trig({ label: 'UNDO', title: 'step back one row (Ctrl+Z)', onFire: () => historyApi.undo() }).root; rh.appendChild(histUndoBtn).dataset.keyAction = 'undo';
    histRedoBtn = trig({ label: 'REDO', title: 'step forward one row (Ctrl+Shift+Z, Ctrl+Y)', onFire: () => historyApi.redo() }).root; rh.appendChild(histRedoBtn).dataset.keyAction = 'redo';
    histReturnBtn = trig({ label: 'HISTORY UNDO', title: 'return once to the timeline from before the last history jump (Ctrl+Alt+Z)', onFire: () => historyApi.historyUndo() }).root; rh.appendChild(histReturnBtn);
    rh.appendChild(trig({ label: 'CLEAR', title: 'Clear history without changing the state', onFire: () => { historyApi.clear(); } }).root);
    el('div', 'note', wHist.body).innerHTML = '<b>History.</b> Every edit to the project is a row, newest at the top. The last ' + historyApi.limit + ' are kept for Undo and Redo; older ones fall off the bottom. Select a row to jump there. HISTORY UNDO returns once to the timeline from before that jump, even after a new edit. Preferences, the camera, the windows and the notebook are not edits.';
  }
  /* S4 · EVERY ROW (≤ 61 with the bottom), newest at the top; the list scrolls inside the card (lab.css `.hist-list`) and the
     current row is kept in view — measured against the list's own box, never scrollIntoView, which would scroll the rack too.
     A full ring built node by node, a listener each, inside the ring's onChange made one flush 2.6–3.9 ms on the desktop, past
     S3's < 2 ms (probes/S4/render-*.js): so the list is ONE string with ONE click listener, and onChange asks for ONE repaint
     per frame (sixty flushes in a loop paint once; the boot's first paint is the first frame's, no layout forced mid-boot) */
  histList.addEventListener('click', (e) => { const b = e.target.closest('.hist-row'); if (b) historyApi.goto(+b.dataset.i); });
  function renderHistory() {
    histRaf = 0;
    const rows = historyApi.entries();
    let h = '';
    for (let j = rows.length - 1; j >= 0; j--) {
      const r = rows[j], name = esc(r.label || 'edit');   /* the title is the WHOLE name (a key's row is a long sentence the column cuts) */
      h += '<button type="button" class="hist-row hist-' + r.state + '" data-i="' + r.i + '"' + (r.state === 'current' ? ' aria-current="true"' : '')
        + ' title="' + name.replace(/"/g, '&quot;') + (r.state === 'current' ? ' — where the instrument is standing' : ' — land on this moment') + '"><span class="hist-i">' + r.i + '</span><span class="hist-lbl">' + name + '</span></button>';
    }
    histList.innerHTML = h;
    histHere();
    if (histUndoBtn) histUndoBtn.disabled = !historyApi.canUndo;
    if (histRedoBtn) histRedoBtn.disabled = !historyApi.canRedo;
    if (histReturnBtn) histReturnBtn.disabled = !historyApi.canHistoryUndo;
    wHist.setStatus(rows.length + ' kept  ·  on ' + (historyApi.cursor + 1), 'live');
  }
  /** keep the current row inside the list's box (a closed or folded card has no box: it is done when the card shows) */
  function histHere() {
    const here = histList.querySelector('[aria-current]');
    if (!here || !histList.clientHeight) return;
    const box = histList.getBoundingClientRect(), at = here.getBoundingClientRect();
    if (at.top < box.top) histList.scrollTop += at.top - box.top; else if (at.bottom > box.bottom) histList.scrollTop += at.bottom - box.bottom;
  }
  /* S4 · …and when the card comes back into view (opened, unfolded, its rack shown or scrolled to): a jump made while it was
     closed left its list at the top.  window-activity's onChange already fires on each of those flips; this reads one flag. */
  let histWas = canPresent(wHist);   // tracks the card, so its flips reach onChange
  histShown = () => { const now = canPresent(wHist); if (now && !histWas) histHere(); histWas = now; };
  let histRaf = 0;
  hRender = (now) => { if (now) { cancelAnimationFrame(histRaf); renderHistory(); } else if (!histRaf) histRaf = requestAnimationFrame(renderHistory); };
  renderHistory();

  /* ── the diagnostics surface (tests and curiosity; one road) ──────────── */
  const modEdited = () => { if (modView) modView.rebuild(); hNote(); };   // LW.mod's model edits: shown, and maybe a row (S3)
  const LW = {
    ready: false, reg, clock, obs, mat, quality, domain, camera, fieldRate, stats, field, presets: PRESETS, TIER, shadowView, spectrum, orbitView: orbit, vortex, ladder, particles, get particleUI() { return { on: ui.pOn, n: ui.pN, trail: ui.pTrail }; }, slice, kepler, chem, calculus, layout, setTheme(t) { if (__LW_hooks.setTheme) __LW_hooks.setTheme(t); }, setCardStyle(c) { return setCardStyle(c); }, get cardStyle() { return document.body.dataset.card || 'refractive'; }, setFrost(m) { return setFrost(m); }, get frost() { return look.get('frost'); }, get frostLive() { return document.body.classList.contains('frost') && !document.body.classList.contains('frost-hold'); }, setDisconnected(v) { return setDisconnected(v); }, get disconnected() { return document.body.classList.contains('disconnected'); }, applySettings, get settings() { return readSettings(); }, get build() { return BUILD_LINE; }, get ab() { return __LW_hooks.ab; }, get notebook() { return layout.notebook; }, get period() { return __LW_hooks.period ? __LW_hooks.period() : null; }, get gas() { return gas; }, /** optimization K7 / W125: the gas table, ON by default — gasTable(true|false) switches it, gasTable() reads 'off' | 'building' (wanted: armed until the first AXIAL launch, then sliced in idle time) | 'on' */ gasTable(on) { if (on !== undefined) gasTableOn(!!on); return gas.table; }, setGasBasis(v) { if (ui.gasBasis) ui.gasBasis.set(v); gasAxial = v === 'axial'; if (!gasAxial) gas.off(); hNote(); schedule(TIER.RECONSTRUCT); }, get gasBasis() { return gasAxial ? 'axial' : 'reg'; }, keplerDrag(n, w) { return keplerDragToPoint(n, w); }, keplerTurn(kind, dth, n) { return keplerTurn(kind, dth, n); }, get keplerShell() { return kepShell(); }, setKeplerShell(n) { if (ui.kepShell) { ui.kepShell.set(String(n)); keplerRowSync(true); } return kepShell(); }, keplerOrbitOf(n) { return orbitOfShell(n === undefined ? kepShell() : n); }, get rotRate() { return { ...rotRate }; }, setRotRate(which, v) { const k = which === 'z' ? 'z' : which === 'kz' ? 'kz' : which === 'def' ? 'def' : null; if (!k) return null; if (!Number.isFinite(v)) return null; const w = (k !== 'z' && sturm.P) ? 0 : Math.max(-ROT_LIMIT[k], Math.min(ROT_LIMIT[k], v)); if (modHand('state.' + (k === 'z' ? 'rot.z' : k === 'kz' ? 'stark.kz' : 'defect.l2'), w)) return w; return setRotationRate(k, w); }, get rotDriving() { return rotDriving(); }, get projects() { return layout.projects; }, rateOf(a) { return rates[a]; }, setRate(a, r) { return api.setRate(a, r); }, saveSettings, setStage(v) { return __LW_hooks.setStage ? __LW_hooks.setStage(v) : null; }, setStyle(name) { if (STYLE[name] === undefined) return false; mat.style = STYLE[name]; if (ui.styleSeg) ui.styleSeg.set(name); schedule(TIER.PRESENT); return true; }, accent: { set(a, b) { look.set({ ...(a !== undefined && { accentA: a }), ...(b !== undefined && { accentB: b }) }); }, get a() { return look.get('accentA'); }, get b() { return look.get('accentB'); }, colorAt(deg) { return rgbToHex(wheelColor(deg)); } }, get theme() { return document.body.dataset.theme || 'dark'; }, get themeChoice() { return look.get('theme'); }, launchPacket, get lastLaunch() { return lastLaunch; }, enterBox() { if (getHamiltonian().id !== 'well') { setHamiltonian('well'); switchHamiltonian('well'); if (ui.hamSeg) ui.hamSeg.set('well'); } enterBox(); }, coherentBounce() { coherentBounce(); }, get autoQ() { return autoQ; }, governor: { get on() { return gov.on; }, set on(v) { setGovernor(v); }, get drop() { return gov.drop; }, get median() { return gov.median; }, get changes() { return gov.changes; }, get parked() { return [...gov.parked.keys()]; }, get probes() { return gov.probes; }, get probeMs() { return READER_LAW.probeMs; }, get state() { return !gov.on ? 'off' : gov.drop ? 'stepped-' + gov.drop : 'nominal'; }, get resolution() { return effectiveRes(); }, get work() { return perf.work; } }, maths: { get ok() { return maths.ok && scan.ok; }, get bow() { return maths.ok; }, get scan() { return scan.ok; }, get started() { return { bow: maths.started, scan: scan.started, cards: cards.started }; }, call: (m) => maths.call(m) }, get keepFrames() { return keep.frames; }, setKeepFrames, packetCentroid(G = 24) { const c = reg.at(clock.t); return wellCentroid(c.re, c.im, reg.populated(), { G }); }, setIonZ(z) { setZ(z); switchHamiltonian('hydrogen'); if (ui.zKnob) ui.zKnob.set(z); }, get Z() { return getZ(); }, perf: { get mode() { return perf.mode; }, setMode: setPerfMode, get profile() { return perf.profile; }, get counts() { return perf.counts; }, /** the median of the loop's OWN main-thread ms over the last 60 frames — the budget-independent read of "is hidden cheaper?" */ get median() { return ringMedian(perf.ring); }, /** LA1: the same median over the WHOLE loop, timed from its entry */ get loopMedian() { return ringMedian(loopRing); }, resetRing() { perf.ring.fill(0); loopRing.fill(0); } }, get keys() { return __LW_hooks.keys; }, bow: { start: (x, y) => bowStart({ clientX: x, clientY: y }), move: (x, y) => bowMove({ clientX: x, clientY: y }), release: () => bowRelease(), cancel: () => bowCancel(), get active() { return !!bow; }, get k() { return bow ? bow.k : 0; }, get dir() { return bow ? bow.dir : null; }, get landed() { return bowChain; }, get inFlight() { return bowInFlight > 0; } }, kickAlong(k, d) { slapAlong(k, d); }, setDamping(g) { reg.setDamping(g); touchState(); }, get hamiltonian() { return getHamiltonian().id; }, setHamiltonian(id) { switchHamiltonian(id); if (ui.hamSeg) ui.hamSeg.set(id); }, kick(k, axis = 'z') { if (__LW_hooks.slap) __LW_hooks.slap(k, axis); }, get space() { return space; }, setSpace(s) { if (s === 'p' && sturm.P) return false; space = s; if (ui.spaceSeg) ui.spaceSeg.set(s); schedule(TIER.REBUILD); }, get palette() { return palette; },
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
      set(id) { return __LW_hooks.setGamut ? __LW_hooks.setGamut(id) : 'srgb'; } },
    /** THE PALETTE by NAME, and the menu's grouping by stop count */
    setPalette(id) { return palette ? palette.select(id) : false; },
    get paletteId() { return palette ? palette.id : null; }, get paletteGroups() { return palette ? palette.groups : []; },
    loadPreset, schedule, togglePlay, setReference, serialize, restore, api,
    /* ── ORBITALS · the MOLECULAR REGISTER, one road (MATH-H2O Proposition 1) ─────────────────────
     * ψ(r, t) = Σ_k c_k e^{−iε_k t} φ_k over CHEMISTRY's canonical orbitals.  `ladder()` is the
     * solved ε_k with their ground-state occupancies; `state()` carries the selection, Σ|c|² and the
     * beat period 2π/Δε of the two strongest levels — the FROZEN-ORBITAL gap, never ω_RPA. */
    orbitals: {
      select(k, amp = 1, phase = 0) { return orbitals.select(k, amp, phase); },
      deselect(k) { return orbitals.deselect(k); },
      toggle(k) { return orbitals.toggle(k); },
      clear() { return orbitals.clear(); },
      norm() { return orbitals.norm(); },
      setAmp(k, v) { return orbitals.setAmp(k, v); }, setPhase(k, v) { return orbitals.setPhase(k, v); },
      setOn(v) { return orbitals.setOn(v); }, get on() { return orbitals.on; },
      setFlow(v) { return orbitals.setFlow(v); }, get flowOn() { return orbitals.flowOn; },
      preset(name) { return orbitals.preset(name); }, store(w) { return orbitals.store(w); }, setMorph(on, sv) { return orbitals.setMorph(on, sv); },
      get dials() { return orbitals.dials; }, setDials(v) { return orbitals.setDials(v); },
      ladder() { return orbitals.ladder(); }, state() { return orbitals.state(); },
      solution() { return orbitals.solution(); },
      save() { return orbitals.save(); }, load(r) { return orbitals.load(r); },
    },
    /* the REGISTER window's switch and its STATES mode: the many-electron register over S₀ and the TDA states */
    register: { get mode() { return register.mode; }, setMode(v) { return register.setMode(v); }, save() { return register.save(); }, load(r) { return register.load(r); } },
    states: {
      select(k, amp, phase) { return states.select(k, amp, phase); }, deselect(k) { return states.deselect(k); }, toggle(k) { return states.toggle(k); },
      clear() { return states.clear(); }, norm() { return states.norm(); }, setAmp(k, v) { return states.setAmp(k, v); }, setPhase(k, v) { return states.setPhase(k, v); },
      preset(name) { return states.preset(name); }, play(k) { return states.play(k); }, store(w) { return states.store(w); },
      setMorph(on, s) { return states.setMorph(on, s); }, setView(v) { return states.setView(v); }, setRef(v) { return states.setRef(v); },
      setFlow(v) { return states.setFlow(v); }, get flowOn() { return states.flowOn; }, flowState() { return flowTracers ? { on: flowTracers.on, ...flowTracers.state } : null; },
      setDrive(v) { return states.setDrive(v); }, setDriveParam(k, v) { return states.setDriveParam(k, v); }, tune() { return states.tune(); }, get drive() { return states.drive; },
      setOn(v) { return states.setOn(v); }, get on() { return states.on; },
      ladder() { return states.ladder(); }, state() { return states.state(); }, save() { return states.save(); }, load(r) { return states.load(r); },
    },
    /* the molecular funnel, readable: which model is playing, why, and what the session has dropped */
    molsession: {
      state() { return molSession.state(); },
      get selected() { return molSession.selected; }, get reason() { return molSession.reason; },
      get molecule() { return molSession.molecule; }, get solution() { return molSession.solution; },
      get counters() { return { ...molSession.counters }; },
      claimed(id) { return molSession.claimed(id); }, why(id) { return molSession.why(id); },
    },
    /* ── WAVE 52 · THE MODULATION RACK.  One road to the model, the four edges, the window and the
     * three numbers the strip is showing — `read(id)` hands back exactly what is on the screen. ── */
    mod: {
      get host() { return modHost; }, get model() { return modHost && modHost.model; },
      get registry() { return modHost && modHost.registry; }, get clock() { return modHost && modHost.clock; },
      get view() { return modView && modView.api; },
      get running() { return !!(modHost && modHost.clock.isRunning()); },
      get playing() { return !!(modHost && modHost.clock.isPlaying()); },
      get cadence() { return MOD.hz; },
      setCadence(hz) { mod.setCadence(hz); if (modView) modView.sync(); return MOD.hz; },
      /* ── WAVE 65 · THE ARM, THE ONE KEY AND THE RESUME LAW, all readable from outside ────────── */
      get armed() { return modArm; },
      arm(on) { return setModArm(!!on); },
      /** which law the rack's own chips put on the next resume, and what the last one actually did */
      resume() { return modHost ? modHost.clock.resumePlan() : null; },
      /** the loop clock locked to the density's exact recurrence: one bar = one repeat (g) */
      barLock,
      get expanded() { return layout.modulation.open; },
      expand() { return layout.modulation.expand(); }, collapse() { return layout.modulation.collapse(); },
      /** PACE P3 · the window's remembered presentation, and the road that puts one back (the device report's put-back: its
       *  first open prunes remembered rows for sources that no longer exist, which is the report's doing, not the hand's) */
      presentation() { return modView ? modView.presentation() : null; }, restorePresentation(o) { if (modView && o) modView.restore(o); return !!(modView && o); },
      /* 0.5.0 C4 (R-B1): the modulation has no play of its own — these are THE play and THE pause (the edge follows) */
      play() { appPlay.play(); schedule(TIER.EVOLVE); return { ok: true, playing: modHost.clock.isPlaying() }; },
      stop() { appPlay.pause(); schedule(TIER.PRESENT); return { ok: true, playing: modHost.clock.isPlaying() }; },
      /** a deterministic step — no realtime anywhere near it, which is what a proof wants */
      step(dt) { const d = modHost.clock.step(dt); if (modView) modView.paint(true); return d; },
      targets() { return modHost.registry.describe(); },
      state(id) { return modHost.registry.state(id); },
      read(id) { return modView ? modView.api.read(id) : null; },
      picker() { return modView ? modView.api.picker() : []; },
      addSource(kind) { const s2 = modHost.model.addSource(kind); modEdited(); return s2.id; },
      addMacro() { const m = modHost.model.addMacro(null); modEdited(); return m.id; },
      /** BIND: unbind first, always — setMacro REFUSES a change on a macro already bound to a live
       *  source, and a caller that just calls setMacro reads that refusal as a control doing nothing. */
      bind(macroId, sourceId) { modHost.model.setMacro(macroId, { sourceId: null });
        if (sourceId) modHost.model.setMacro(macroId, { sourceId }); modHost.clock.recomputeRunning();
        modEdited(); return modHost.model.macroOf(macroId).sourceId; },
      route(macroId, targetId, min, max) { const r = modHost.model.addRoute(macroId, targetId, min === undefined ? 0 : min, max === undefined ? 1 : max);
        modHost.clock.recomputeRunning(); modEdited(); return r && r.route ? r.route.id : null; },
      unroute(id) { const ok = modHost.model.removeRoute(id); modEdited(); return ok; },
      /** the runtime door: a control registered NOW is in the picker NOW, with no edit to modview.js */
      /* WAVE 61: a control registered at RUNTIME with a `knob` accessor is a drop target at runtime,
         with no edit anywhere — installOne still strips nothing it did not want, the accessor is kept
         here beside modGets, and the dial is stamped the moment it exists. That is the runtime door's
         whole promise, and without the stamp the new control would be in the picker and not on the glass. */
      register(id, spec) { const d = modHost.targets.installOne(id, spec); modGets[id] = spec.get;
        if (spec.knob) { modKnobs[id] = spec.knob; const k = spec.knob(); if (k && k.root) k.root.dataset.param = id; }
        if (modView) modView.rebuild(); return d; },
      unregister(id) { const n = modHost.targets.uninstall(id); delete modGets[id]; delete modKnobs[id]; if (modView) modView.rebuild(); return n; },
      reset() { modHost.clock.pause(); modHost.registry.restoreAll(); modHost.model.modReset();
        modHost.targets.sync(); modHost.clock.applyAll(true); modEdited(); schedule(TIER.PRESENT); return true; },
      serialize() { return modHost.model.serialize(); }, restore(o) { const ok = restoreModulation(o); hNote(); return ok; },
      diagnostics() { return modHost.diagnostics(); },
      paint() { return modView ? modView.paint(true) : false; },
      get held() { return [...modHeld]; },
      get knobs() { return Object.keys(modKnobs); },
    },
    /* UNDO / REDO over the edit scope (S3): the whole PROJECT but the view, quality and the notebook — never the layout or a preference */
    get history() { return historyApi; },
    /** W-CAPTURE (wave 58): lab/capture.js itself, built on first use — picture · planLoop · save · limits · grab, and `laws` for the
     *  pure schedule functions (0.5.0 C7: the film is captureUI.exact, render-exact.js createFilm over the kit's recorder). */
    get capture() { return capApi ? capApi.capture : null; }, get capturePlan() { return capApi ? capApi.plan(true) : null; },
    get captureUI() { return capApi; },
    /* W-EXPORT (wave 134): FILE › EXPORT SHAPE / GRID's own module instance — run(fmt), busy, last (the proof's hook;
     *  the five rows call run(fmt) themselves and need nothing here) */
    get shapeExport() { return exporter3d; },
    /* W-WIGNER: the (z, p_z) slice — the last map computed (recomputed if the state has moved), its two ranges, its numbers */
    wigner: { slice() { return hydroReader().on ? wignerView.slice(reg, clock.t) : null; }, setRange(z, p) { return wignerView.setRange(z, p); },
      get stats() { return wignerView.stats; }, get zmax() { return wignerView.zmax; }, get pmax() { return wignerView.pmax; },
      get canvas() { return wignerView.canvas; }, table() { return wignerView.table(); } },
    /* W-RADIATION: the pair in force and what it radiates */
    radiation: { pair() { return hydroReader().on ? radiationView.pair(reg, clock.t, __LW_hooks.ab) : null; },
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
    get uiHidden() { return uiHidden; },
    windowActivity: {
      state(id) { const w = document.querySelector('.dev[data-id="' + id + '"]'); return windowActivity.state(w); },
      get tracked() { return windowActivity.tracked; }, get changes() { return windowActivity.changes; },
    },
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
      get last() { return linkLast; }, get ceiling() { return LINK_CHAR_CEILING; },
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
    async thumbnail() { const r = await capApi.capture.picture({ width: 320 }); return r.ok ? r.blob : null; },
    look: look.prefs,   // 0.5.0 C2: the look store (`mir.gui`), for probes (`__LW.look.get('theme')`)
    session: dom.start ? dom.start.session : null,   // 0.5.0 C6b: THE SESSION (main.js createSession over the one part): read(), armed(), flush()
    get timeline() { return tl; },   // 0.5.0 C7b: the kit's TIMELINE (installTimeline's result: model, editor, controller, open/close), for the timeline suite
    get render() { return filmCard; },   // 0.5.0 C7b: the RENDER card ({ card, view, recorder, plan, place }; view.state() is the kit's harness read)
  };
  window.__LW = LW;
  /* ── 0.5.0 C7b · THE RENDER CARD (lab/film-card.js): MIR's createRenderCard over the film's host recorder, built once LW exists (the film
     reads it) and registered closed on the right rack (R2), in + and WINDOW; its saves are the hand-over fix (capture.js handOver) ── */
  filmCard = createFilmCard({ film: capApi.exact, capture: capApi.capture, editor: () => tl && tl.editor, open: () => tl && tl.open(), armed: () => modArm,
    digest: () => reg.digest(), key: () => [reg.version, mat.view, obs.yaw, obs.pitch, obs.dist, obs.fov, obs.shift.join(), clock.t].join('|') });
  rack.prepend(filmCard.card.root);   // at the top, where a reopen puts it and a layout that does not list it (a demo's) leaves it: a reload saves the same `closed`
  rk.register({ id: 'render', el: filmCard.card, side: 'right', closed: true, title: 'RENDER', glyph: 'render', hint: 'the picture and the film' });

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
    meters: () => 'density period\t' + (() => { const P = __LW_hooks.period ? __LW_hooks.period() : null; return P && P.exact && P.T ? P.T.toFixed(6) + ' a.u. (exact)' : P && P.T ? '≈ ' + P.T.toFixed(3) + ' a.u. (no exact period)' : '—'; })() + '\nframe profile (ms, EMA)\n' + Object.entries(perf.profile).map(([k, v]) => k + '\t' + (+v).toFixed(3)).join('\n') + '\nframes\t' + stats.frames + '\nreconstructs\t' + stats.reconstructs + '\npresents\t' + stats.presents,
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
  initStageText(); LW.stageText = stageText;   // the gate reads its string, its render count and its announcements
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
  reworkNative({ ui, mat, repaint:()=>schedule(TIER.PRESENT), modHost, modApi:()=>modView&&modView.api, cadence:()=>MOD.hz, setCadence:mod.setCadence });
  __LW_hooks.warning = warning;
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
  history.clear(linkAtBoot.opened && linkAtBoot.ok ? 'link' : 'boot');   // the shipped boot (and a ?preset= in the URL) is the BOTTOM of the stack, not a step in it


  accent.turn();
  busyHost();                         // the mark is cloned and painted before anything can need it
  markBatchEnd();                     // M7: …painted here, once, every copy of it (the clones included)
  if (layout.projects) { await Promise.race([layout.projects.seed().catch(() => null), new Promise((r) => setTimeout(r, 3000))]); layout.projects.markClean(); }   // 0.5.0 C6: the six demos are FOLDERS' starters before the lab says ready
  /* 0.5.0 C6b · THE SESSION hears the one part: the ring's moves and the notebook's input (projects.changed, the part's subscribe) */
  if (layout.projects) { history.subscribe(layout.projects.changed); const nbEl = document.getElementById('notebook'); if (nbEl) nbEl.addEventListener('input', layout.projects.changed); }
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
