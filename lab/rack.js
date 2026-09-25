import { bindStageGestures } from './stage-gestures.js';
import { coalesce } from './frame-coalescer.js';
import { waitForPaint } from './frame-settle.js';
import { readProjectCollection } from './project-storage.js';
import { MAX_PROJECT_BYTES, storeProjectImport } from './project-import.js';
import { renderNotebook } from './notebook-render.js';
import { reworkNative, planeModel } from './native-ui.js';
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
import { BASIS, domainFor, psiAt, stateOf, orbitalFromTable } from './hydrogen.js';
import { Register, PRESETS, PRESET_BY_ID, RENDER_CAP } from './state.js';
import { Clock } from './clock.js';
import { createFrameBudget } from './frame-budget.js';
import { createWindowActivity } from './mir/window-activity.js';
import { createField, tableFor, VIEW, VIEW_NAMES, STYLE, STYLE_NAMES, cameraBasis, quatFromYawPitch, yawPitchFromQuat, turnFree } from './field.js';
import { el, knob, sw, seg, trig, fader, readout, device, group, formula, chip, setAccentRGB, cssRGB, accentRGB, parseCssColor } from './mir/kit.js';
import { createSpectrum } from './spectrum.js';
import { createMeters } from './meters.js';
import { createShadowView } from './shadowview.js';
import { createLadder } from './ladder.js';
import { createOrbit } from './orbit.js';
import { createVortex } from './vortex.js';
import { createParticles } from './particles.js';
import { createKepler } from './keplerview.js';
import { createExactRenderer } from './render-exact.js';
import { createKeymap } from './keymap.js';        // wave 106: the drawn keyboard and the rebinding seam
import { bindAction, bindingConflicts, normalizeBinding } from './shortcuts.js';
import { keplerOrbits } from './kepler.js';
import { createGas } from './gas.js';
import { densityPeriod, densityPeriodExact, fmtPeriod } from './period.js';
import { createMolecule } from './moleculeview.js';
import { createMOPanel } from './moview.js';
import { createPulse } from './pulseview.js';
import { createCapture, maxPictureSize, viewCarriesGlobalPhase } from './capture.js';
import { createHelium } from './heliumview.js';
import { createH2 } from './h2view.js';
import { createChem } from './chemview.js';   // wave CHEMISTRY: the RHF · real-time window (contract B-H2O-8)
import { createRegister } from './registerview.js';   // REGISTER: one window, two registers — ORBITAL (orbitalsview.js, MATH-H2O Proposition 1) and STATES (statesview.js, the many-electron TD-CIS register)
import { createMolecularSession } from './molecular-session.js';   // the ONE owner of the molecular volume (MOLECULAR WAVES stage 1)
import { hylleraas, BASES as HELIUM_BASES } from './helium.js';
import { solveLadder } from './ladder-model.js';
import { h2CurveTable } from './h2ci.js';
import { createCalculus } from './calculusview.js';
import { createDynamics } from './dynamicsview.js';
import { createPaletteEditor } from './paletteview.js';
import { createSliceView } from './sliceview.js';
import { createQCD } from './qcdview.js';
import { createAtoms } from './atomsview.js';
import { createFieldLines } from './fieldview.js';
import { createWigner } from './wignerview.js';
import { createRadiation } from './radiationview.js';
import { ATOMS, configOf } from './atoms.js';
import { toLUT, PRESET_BY_ID as PALETTE_BY_ID, rgbToOklab, oklabToRgb, rgbToHex, visibleInk, contrastRatio } from './palette.js';
import { domainForP, momentumTableFor } from './momentum.js';
import { momentumZ, AXIS_TO_Z, rotorsToZ, warmStep as kickWarm, tablesReady as kickReady } from './kick.js';
import { getHamiltonian, setHamiltonian, HAMILTONIANS, setZ, getZ } from './hamiltonian.js';
import { createRegisterSturmian } from './sturmianreg.js';
import { wellPacket, wellCentroid } from './well.js';
import { applyRotor as rotorOnCopy } from './frontier.js';
import { createHistory } from './history.js';
import { qmul, qnormalize, slerp } from './rotor4.js';   // wave 54: the FREE camera is ONE unit quaternion, and it uses the lab's own rotor library
import { createModHost, labParameters, barTempo } from './mir/modulation/host.js';
import { createModulation } from './modwindow.js';   // wave 64: the PORTED window's host side — lab/mir/modulation/modwindow/ is the artifact
import { createAudioCapture, AUDIO_STATE } from './audio.js';   // wave 102: the capture half the port deliberately left behind
import { linkFor, readLink, LinkError, LINK_CHAR_CEILING } from './statelink.js';   // wave 56: every state of this lab is a LINK

/* THE BUILD STAMP — one constant, and every wave updates it.  The ABOUT face and its copy dump both read it here;
   nothing else in the app hand-writes a version, so a stale line can only come from forgetting THIS line. */
const BUILD_LINE = '0.2.3-alpha.3 · the optimization pass · 2026-09-25';   // THE ONLY PLACE THE NUMBER LIVES: the ABOUT face, the copy dump and the proof all read it back through LW.build (ANTI-PATTERN 6)

export const TIER = { NONE: 0, PRESENT: 1, RECONSTRUCT: 2, EVOLVE: 3, REBUILD: 4 };
const TIER_NAME = ['NONE', 'PRESENT', 'RECONSTRUCT', 'EVOLVE', 'REBUILD'];
const LS_EXP = 'lambdawaves.q0.experiment', LS_PRES = 'lambdawaves.q0.presentation';

export async function boot(dom) {
  const reg = new Register();
  const __LW_hooks = {};
  /* UNDO / REDO: the ring is built at the foot of boot(), once every path it writes through exists; hNote() is
     the "an edit may have happened" ping for the few register-side setters that do not bump reg.version */
  let history = null;
  const hNote = () => { if (history) history.note(); };
  const clock = new Clock();


  const obs = { yaw: 0.65, pitch: 0.38, dist: 3.3, fov: 0.6, mode: 'free', quat: quatFromYawPitch(0.65, 0.38) };   // wave 54: TURNTABLE reads (yaw, pitch); FREE reads `quat` and the angles become a READOUT
  const mat = { view: VIEW.phase, exposure: 1, softness: 0.7, steps: 160, slice: { mode: 0, axis: 2, pos: 0, thick: 0.03 }, hueShift: 0, invert: false, frame: true, axis: true, axisInk: 'theme', paletteOn: false, style: STYLE.cloud, iso: 0.06, grain: 0.35, knee: 0.6, dither: 0, boost: { k: [0, 0, 0], on: false }, bg: [0.028, 0.038, 0.058], gamma: 1, lightUI: false };
  let palette = null;

  const rates = new Float64Array(91).fill(1);
  const energyOf = (a) => getHamiltonian().energy(a) * rates[a];


  const sturm = { on: false, lambda: 1, P: null, rec: null, buildMs: 0, roVersion: -1 };
  const labelExpect = (a) => sturm.P.H[a * 91 + a] / sturm.P.S[a * 91 + a];          // a label's ⟨a|H|a⟩/⟨a|S|a⟩ under the scale — NOT an eigenvalue
  /* ── THE WHEEL AS THE UI's ACCENT ──────────────────────────────────────────
   * Two angles on the CURRENT palette (the editor's stops, whether or not the phase view uses them, shifted by the
   * HUE knob) colour every accent in the interface — --acc and --acc2 on the body — so rotating the wheel recolours
   * the whole UI.  The logo is the same wheel: λ is the colour at 0° and the nine squares are the wheel at 0°, 40°,
   * … 320° in reading order.  For legibility the two UI accents have their OKLab lightness held to the theme's
   * range (≥ 0.62 on DARK, ≤ 0.62 on LIGHT); the logo takes the wheel's colours verbatim. */
  /* WAVE 54 · THE KEY MOVED UP, and it had to.  readSettings() is a function declaration and hoists, but the
     const it reads did NOT — it sat 90 lines below this and every early call fell into readSettings' own catch and
     came back {}.  A silent {} is exactly the shape of "this browser has never said anything", so the palette this
     browser HAD chosen was read as no choice at all and the default won every reload.  One declaration, at the top,
     above the first reader. */
  const SETTINGS_KEY = 'lambdawaves.q0.settings';
  const useCompactDefaults = readSettings().nativeLayout === 1 || !Array.isArray(readSettings().closed);
  const PAL_DEF = 'prism';
  let palChoice = (() => { const id = readSettings().palette; return id && PALETTE_BY_ID.get(id) ? id : PAL_DEF; })();   // a DEFAULT IS FOR A FIRST VISIT — never a retroactive edit of someone's settings
  const nativeAccentLUT=toLUT(PALETTE_BY_ID.get('lambda').stops);
  let wheelLUT = toLUT(PALETTE_BY_ID.get(palChoice).stops);
  const accent = { a: 30, b: 300, vivid: .5 };
  function wheelColor(deg) { const u = ((deg / 360 + (mat.hueShift || 0)) % 1 + 1) % 1; const i = Math.min(255, Math.floor(u * 256)) * 4; return [wheelLUT[i], wheelLUT[i + 1], wheelLUT[i + 2]]; }
  function legible(rgb) { const lab = rgbToOklab(rgb), light = document.body.dataset.theme === 'light'; const L = light ? Math.min(lab[0], 0.62) : Math.max(lab[0], 0.62); return L === lab[0] ? rgb : oklabToRgb([L, lab[1], lab[2]]); }
  /* WAVE 54 · THE GAMUT LAW LIVES HERE TOO.  The accents are the one colour the DOM and the canvas BOTH wear, so
     they must be written through the same map the palette LUT goes through — `gamutCss` is that map, and it is a
     hole the FIELD fills once it exists (applyAccent runs long before `field` is constructed).  While the canvas is
     sRGB it is the identity and emits the same #rrggbb it always did; in P3 it emits color(display-p3 …) of the
     SAME transformed numbers the shader will be handed.  There is no path by which the two can disagree. */
  let gamutCss = (rgb) => rgbToHex(rgb);
  /** an accent as the ported window wants it: [hue deg, saturation %] of the SAME rgb the
   *  house is wearing, so the two can never disagree about which colour the accent is. */
  function hueSat(rgb) {
    const r = rgb[0], g = rgb[1], b = rgb[2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    if (d < 1e-9) return [0, 0];
    const sat = d / (1 - Math.abs(2 * l - 1));
    let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
    return [Math.round(h), Math.round(100 * Math.min(1, sat))];
  }
  function accentColor(deg) { if(mat.paletteOn)return wheelColor(deg);const i=Math.floor(((deg/360%1+1)%1)*256)*4;return [nativeAccentLUT[i],nativeAccentLUT[i+1],nativeAccentLUT[i+2]]; }
  function applyAccent() {
    const boost = (rgb) => { if (!accent.vivid) return rgb; const lab = rgbToOklab(rgb), k = 1 + 2.2 * accent.vivid; return oklabToRgb([lab[0], lab[1] * k, lab[2] * k]); };   // VIVID: more chroma toward neon
    const A = boost(legible(accentColor(accent.a))), B = boost(legible(accentColor(accent.b))), st = document.body.style;
    st.setProperty('--acc-glow', '0 0 ' + (8 + 18 * accent.vivid).toFixed(0) + 'px color-mix(in srgb, var(--acc) ' + Math.round(55 + 40 * accent.vivid) + '%, transparent)');
    st.setProperty('--acc', gamutCss(A)); st.setProperty('--acc2', gamutCss(B)); st.setProperty('--acc-ink', rgbToOklab(A)[0] > 0.6 ? '#071114' : '#f2f5f7');
    setAccentRGB(A.map((v) => Math.round(v * 255)), B.map((v) => Math.round(v * 255)));   // wave 57: the six canvas views draw THESE numbers, not the DOM string re-parsed through a gamut
    /* WAVE 64 · THE PORTED WINDOW'S ONE PARAMETER.  It derives 57 tints from `--hue-acc` /
       `--sat-acc` and their B pair, which this house has never written at runtime — it
       publishes RESOLVED colours instead.  So the two angles are handed over, on the window
       and its rail only, and nothing on `:root` moves: see lab/mir/modulation/modhost.css. */
    if (modView) modView.setAccent(hueSat(A), hueSat(B));
    paintMarks();
  }


  const MARK_N = 9, MARK_STEP = 40;          // nine squares, 40° apart on the wheel, in reading order


  const MARK_GROUND = { light: [236, 239, 243].map((v) => v / 255), dark: [41, 45, 50].map((v) => v / 255) };   // the card MEASURED in the page, and the dark card at its sheen's brightest corner
  const MARK_FLOOR = 3;
  /* ── WAVE 59 · THE λ HAS TWO GROUNDS AND ONLY ONE OF THEM IS A CONSTANT ───────────────────────────────
   * Wave 57 corrected both copies of the λ against MARK_GROUND, the CARD.  That is right for the notebook's
   * `.nb-logo`, which really is drawn on a card.  It is NOT right for `#title`: that one is `background: none`
   * over `#field`, whose clear colour is `mat.bg` — and `mat.bg` is a SHIPPED KNOB (STAGE, the CAMERA window),
   * not a constant.  Measured over 23 palettes × 256 hues on the dark theme, STAGE 0.20 puts 38.9 % of the
   * wheel under 3 : 1, STAGE 0.50 puts 92.8 % under it with a worst case of 1.00 : 1, and on light STAGE 0.30
   * reaches 1.00 : 1 across the whole wheel — 1.00 : 1 being the exact number this file's wave-57 header names
   * as the failure it removed ("Not faint: absent").  A correction against a ground the user can drag away
   * from is not a correction.  So: the header λ reads the LIVE stage, the notebook's reads the card, and
   * "the harder of the two grounds" now means the harder of the two grounds each one is actually on. */
  const stageGround = () => (mat.bg && mat.bg.length === 3 ? mat.bg : MARK_GROUND[document.body.dataset.theme === 'light' ? 'light' : 'dark']);
  /* AND THE FLOOR IS ON THE COLOUR THE BROWSER ACTUALLY DRAWS.  `visibleInk` works in floats and stops at
     the first lightness that clears the floor; `gamutCss` then writes 8-bit hex, and that rounding can put
     the mark a thousandth UNDER it — measured 2.988 : 1 at STAGE 1 on `opal`, which is a floor the gate
     cannot honestly assert.  So the mark is QUANTISED here and, if the rounded colour misses, the same
     function is asked for a hair more; at most six tries, at most 0.05 of extra ratio, and a no-op wherever
     the float already had room (which is everywhere except the last thousandth). */
  const q8 = (c) => c.map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255) / 255);
  const markInk = (deg, ground) => {
    const g = ground || MARK_GROUND[document.body.dataset.theme === 'light' ? 'light' : 'dark'], raw = wheelColor(deg);
    for (let f = MARK_FLOOR; f < MARK_FLOOR + 0.06; f += 0.01) {
      const c = visibleInk(raw, g, f);
      if (contrastRatio(q8(c), q8(g)) >= MARK_FLOOR) return c;   // the GROUND is 8-bit on the screen too
    }
    return visibleInk(raw, g, MARK_FLOOR + 0.06);
  };
  let inkCv = null;
  const inkCtx = () => (inkCv || (inkCv = document.createElement('canvas'))).getContext('2d');   // one scratch context: the CSS colour parser the views use, reachable by a gate
  /* OPTIMIZATION 2026-09-24 · M7 · ONE PAINT PER BATCH.  paintMarks is a pure function of (palette LUT, hue, theme, stage)
     over every copy of the mark, and it ran 7× in the boot's one synchronous task and ~10× per project open, where only
     the last call is ever seen.  Inside a batch (the boot's build, restore()) a call only marks the marks dirty — and
     the turn's keyframes stale, as the full call does, so a busy mark raised inside the batch never animates the old
     palette — and the batch's end paints once.  Batches are released in a `finally` (restore) or at the boot's tail. */
  let markBatch = 0, marksDirty = false;
  function markBatchEnd() { if (markBatch > 0 && --markBatch === 0 && marksDirty) { marksDirty = false; paintMarks(); } }
  function paintMarks() {
    if (markBatch) { marksDirty = true; turnDirty = true; return; }
    for (const lam of document.querySelectorAll('#title .lam')) lam.style.color = gamutCss(markInk(0, stageGround()));   // over the CANVAS: the live STAGE colour
    for (const lam of document.querySelectorAll('.nb-logo .lam')) lam.style.color = gamutCss(markInk(0));                  // over the CARD: the constant that really is one
    document.querySelectorAll('#title .mark rect, .nb-logo .mark rect, #busyMark .mark rect, .mod-logo .mark rect, .dev-loading .mark rect').forEach((r, i) => {   // wave 106: …and the playhead's modulation door, which is the same mark and must turn with it
      const k = i % MARK_N;
      r.setAttribute('fill', gamutCss(wheelColor(k * MARK_STEP)));       // wave 54: the mark is DOM, so it wears the same gamut the canvas does
      if (!r.classList.contains('sq' + k)) r.classList.add('sq' + k);      // which seat on the wheel this square holds
    });
    turnDirty = true;                       // the wheel moved under the mark: the turn's keyframes are stale
  }


  const TURN_STOPS = 36;
  let turnSheet = null, turnDirty = true;
  /** the nine × 37 colours the turn actually animates through, from the CURRENT palette */
  function turnStops() {
    const out = [];
    for (let i = 0; i < MARK_N; i++) {
      const row = [];
      for (let k = 0; k <= TURN_STOPS; k++) row.push(rgbToHex(wheelColor(i * MARK_STEP + k * (360 / TURN_STOPS))));
      out.push(row);
    }
    return out;
  }
  function ensureTurnCSS() {
    if (turnSheet && !turnDirty) return turnSheet;
    if (!turnSheet) { turnSheet = document.createElement('style'); turnSheet.id = 'lwTurn'; document.head.appendChild(turnSheet); }
    const rows = turnStops(), css = [];
    for (let i = 0; i < MARK_N; i++) {
      css.push('@keyframes lw-turn-' + i + '{' + rows[i].map((hex, k) => (100 * k / TURN_STOPS).toFixed(3) + '%{fill:' + hex + '}').join('') + '}');
      css.push('#title .mark.turn rect.sq' + i + ',#title .mark.busy rect.sq' + i + ',#busyMark .mark rect.sq' + i + ',.dev-loading .mark rect.sq' + i + '{animation-name:lw-turn-' + i + '}');
    }
    turnSheet.textContent = css.join('\n');
    turnDirty = false;
    return turnSheet;
  }
  /** ONE TURN of the palette through the header mark — the boot's own, in place of wave 48's 360° spin */
  function markTurn() {
    const m = document.querySelector('#title .mark'); if (!m) return false;
    ensureTurnCSS();
    m.classList.remove('turn'); void m.offsetWidth;          // a one-shot asked for again STARTS again (it is not retriggerable faster than the eye)
    m.classList.add('turn');
    const off = () => m.classList.remove('turn');
    m.addEventListener('animationend', off, { once: true });
    setTimeout(off, 2200);
    return true;
  }
  /* THE PHONE SENTINEL (wave 51).  skin.css's LAST block raises `--phone` to 1 at a (hover: none) + size
     pair; the breakpoint is written THERE, once, and this reads it back out of the computed style — exactly
     as the peek handler already reads --rack-w — so the script can never disagree with the stylesheet about
     what a phone is.  What CSS cannot do is move a card between racks, dock the transport, cap the device
     pixel ratio or pick a grid; that is all the phone module below does. */
  const isPhone = () => (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--phone')) || 0) >= 1;
  /** WAVE 101 · is this an Apple display?  Used for ONE first-run default (the colour gamut) and for
   *  nothing else — no capability is inferred from it, and a saved choice always wins. */
  const appleDevice = () => { try {
    const ua = (navigator.userAgent || '') + ' ' + (navigator.platform || '') + ' ' + (navigator.vendor || '');
    return /iPhone|iPad|iPod|Macintosh|Mac OS X/i.test(ua);
  } catch (_) { return false; } };
  /* CARD STYLE has one official first-run default on every layout. A browser that has named a surface still
     gets exactly what it named; the phone's rendering budget is handled by the renderer rather than by changing
     the material under the user's hand. */
  const defaultCard = () => 'refractive';   // new desktops get the clear glass; the phone can still shed costly frost
  /* `cardChosen` is the difference between "this browser wants TINTED" and "this browser has never said":
     without it the first saveSettings() of a session freezes whatever the default happened to be, and the
     surface could never follow the device again.  The seg — the one place a HAND can say it — sets it. */
  let cardChosen = readSettings().cardSet === true;
  /* The desktop's first-run glass stays frosted; the phone crossing temporarily disables it. */
  let frostMode = 'always';                   // 'off' | 'still' | 'always'
  /* ── SETTINGS: what this browser remembers (theme, chrome, accents, quality, closed windows) ── */
  let settingsLoaded = false;
  function readSettings() { try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch (e) { return {}; } }
  document.body.dataset.card = (readSettings().cardSet === true && readSettings().card) || defaultCard();   // before a single window is built, so the FIRST paint is already this browser's glass
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
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ nativeLayout:useCompactDefaults?1:S0.nativeLayout, nbW: S0.nbW, nbH: S0.nbH, abW: S0.abW, abH: S0.abH, layouts: S0.layouts, warned: S0.warned, audioDevice: S0.audioDevice, theme: document.body.dataset.themeChoice || document.body.dataset.theme || 'light', badges: !document.body.classList.contains('no-badges'), controlHints: !document.body.classList.contains('control-hints-off'), captions: !document.body.classList.contains('no-captions'),
        frost: frostMode, disc: document.body.classList.contains('disconnected'), blur: ui.blurK ? ui.blurK.get() : 22, card: document.body.dataset.card || defaultCard(), cardSet: cardChosen, accent: [accent.a, accent.b, accent.vivid], auto: quality.auto, governor: gov.on, keepFrames: keep.frames, perfMode: perf.mode,
        /* WAVE 51 · THE CAMERA'S FEEL IS A PREFERENCE, not a project's (wave 50 built FRICTION / SPIN / AUTO-ROTATE and
           none of the three survived a reload).  FRICTION and SPIN are how the instrument FEELS in the hand and they
           belong beside FROST and GOVERNOR.  AUTO-ROTATE is deliberately NOT here: a lab that starts turning by itself
           when you open it is a surprise, not a setting. */
        friction: camera.friction, spin: camera.speed, dragGain: camera.dragGain, fling: camera.flingGain, modCadence: MOD.hz, modArm: modArm, clockLink,   // wave 58: the two View-window dials are the same kind of preference as FRICTION and SPIN; wave 65: the MOD arm is one too
        /* WAVE 64 · THE PORTED WINDOW'S PRESENTATION STATE, and it is the sixth of the six things
           host-contract.md says a host owes it: where the window sits, which lane the work bars are
           in, each device's F/C/M mode, the ribbon, and whether it was left open.  The RACK itself
           is not here — that rides in the project file, exactly as it did before. */
        modwin: modView ? modView.presentation() : S0.modwin,
        frame: mat.frame !== false, axis: mat.axis !== false, frameMode: mat.frameMode, axisMode:mat.axisMode, cornerSide:mat.cornerSide,
        /* ⚠ WAVE 106 · TWO MORE OF THE FIELD'S CHROME, AND ONE CLOSES AN ASYMMETRY NEVER DECIDED.
           `invert` IS NEW HERE: it sat in the same row as FRAME and AXIS from wave 56 and was the only
           one of the three this browser did not remember — two kept over a reload and one silently
           thrown away.  Moving it to PALETTE is the moment to end that.
           `axisInk` is a BROWSER PREFERENCE like frame and axis, and NOT like `mat.lightUI`, which
           serialize() strips out of every project: lightUI is not a choice at all, it is the RESOLVED
           theme, and a file carrying it would impose the sender's theme on its reader.  AXIS COLOUR
           *is* a choice, so it is remembered here AND rides in `mat` into a project and a link — and
           the THEME seat is what keeps that honest, because a sender who never touched the control
           sends 'theme' and the reader's own theme still decides. */
        invert: !!mat.invert, axisInk: mat.axisInk || 'theme',        // wave 53: the two chrome objects are this browser's, like FROST and the tags
        phoneTr: !!document.querySelector('.dev[data-id="transport"].folded'),
        /* WAVE 59 · WHICH WAY THE PHONE'S RACK WAS LEFT, on exactly phoneTr's pattern — a phone-only chrome
           preference, derived from the DOM rather than tracked in a second place.  The DEFAULT (nothing said)
           is HIDDEN, and that default is the whole point: see enterPhone(). */
        phoneRack: document.body.classList.contains('phone') ? !document.body.classList.contains('rack-hidden') : S0.phoneRack,
        /* WAVE 54: three more of this BROWSER's preferences — which camera the hand wants, which palette it named
           (a default is for a first visit), and which colour space it asked for. None of them is a project's. */
        camMode: obs.mode === 'free' ? 'free' : 'turntable', palette: palChoice,
        gamut: document.body.dataset.gamut === 'p3' ? 'p3' : 'srgb', p3Mode: ui.p3Seg ? ui.p3Seg.get() : 'convert',
        closed: [...document.querySelectorAll('.dev.closed')].map((d) => d.dataset.id) }));
    } catch (e) {}
  }


  /** wear a surface without claiming anyone chose it — the phone's default and the way back use this */
  function applyCard(c) {
    document.body.dataset.card = c;
    if (ui.cardSeg) ui.cardSeg.set(c);
    saveSettings();
    return c;
  }
  /** SAY which surface this browser wants: naming one IS the choice, whether it came from the seg or from LW */
  function setCardStyle(id) {
    const named = id === 'tinted' || id === 'refractive';
    if (named) cardChosen = true;
    return applyCard(named ? id : defaultCard());
  }


  function setFrost(mode, opt) {
    frostMode = mode === 'still' || mode === 'always' ? mode : 'off';
    document.body.classList.toggle('frost', frostMode !== 'off');
    frostSync();
    if (ui.frostSeg) ui.frostSeg.set(frostMode);
    if (!(opt && opt.quiet)) saveSettings();
    return frostMode;
  }
  function setDisconnected(v, opt) {
    document.body.classList.toggle('disconnected', !!v);
    if (ui.discSw) ui.discSw.set(!!v);
    if (!(opt && opt.quiet)) saveSettings();
    return !!v;
  }
  function applySettings() {
    const s = readSettings();
    if (__LW_hooks.setTheme) __LW_hooks.setTheme(s.theme || 'light');
    const badges = s.badges === true;
    document.body.classList.toggle('no-badges', !badges); if (ui.badgesSw) ui.badgesSw.set(badges);
    const controlHints = s.controlHints === undefined ? s.hint !== false : s.controlHints !== false;
    document.body.classList.toggle('control-hints-off', !controlHints); if (ui.controlHintsSw) ui.controlHintsSw.set(controlHints);
    const captions = s.captions === true;
    document.body.classList.toggle('no-captions', !captions); if (ui.capSw) ui.capSw.set(captions);
    /* WAVE 67 · FROST used to be a BOOLEAN and is now a policy with three seats, so a stored `true` has to
       mean something: it means ALWAYS, because that is literally what an old `on` did — the glass was there
       whatever the transport was doing.  Anything unreadable falls to the shipped default, ALWAYS. */
    setFrost(s.frost === true ? 'always' : (s.frost || frostMode), { quiet: true });


    setDisconnected(s.disc !== false, { quiet: true });
    cardChosen = s.cardSet === true;                                          // whether this browser has SAID is part of what applySettings restores
    setCardStyle(s.cardSet === true ? s.card : undefined);                    // wave 47: the glass of the cards — REFRACTIVE unless this browser SAID otherwise (wave 51: said, not merely saved)
    if (typeof s.blur === 'number') { document.documentElement.style.setProperty('--glass-blur', s.blur.toFixed(1) + 'px'); if (ui.blurK) ui.blurK.set(s.blur); }
    if (Array.isArray(s.accent)) { accent.a = +s.accent[0] || 0; accent.b = +s.accent[1] || 0; if (ui.accA) ui.accA.set(accent.a); if (ui.accB) ui.accB.set(accent.b); accent.vivid = +s.accent[2] || 0; if (ui.vivid) ui.vivid.set(accent.vivid); applyAccent(); }
    if (s.auto === false) { quality.auto = false; if (ui.autoSw) ui.autoSw.set(false); }
    if (s.governor === false) setGovernor(false);                 // wave 45: the governor held off
    if (s.keepFrames === true) setKeepFrames(true);              // wave 45: the playhead follows every frame (off by default)
    setPerfMode(s.perfMode === 'full' ? 'full' : '120');         // an absent key takes the official 120 Hz profile; an explicit FULL choice survives
    if (typeof s.friction === 'number') camera.setFriction(s.friction);   // wave 51: the camera's feel comes back …
    if (typeof s.spin === 'number') camera.setSpeed(s.spin);              // … but AUTO-ROTATE never does (see saveSettings)
    if (typeof s.dragGain === 'number') camera.setDragGain(s.dragGain);   // wave 58: DRAG GAIN and FLING ride beside them
    if (typeof s.fling === 'number') camera.setFling(s.fling);
    MOD.hz = s.modCadence === 120 ? 120 : 60; if (modView) modView.sync();   // wave 52: the modulation's cadence cap is the PANEL's, not the project's
    if (s.modArm === false) setModArm(false, { quiet: true });   // wave 65: the arm is this browser's, and ARMED is the default a fresh visit gets
    if (s.clockLink === false) clockLink = false;                 // 2026-09-10: LINKED is the default a fresh visit gets
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
    /* ⚠ WAVE 106 · BOTH DIRECTIONS, because the default flipped.  This read `=== 'free'` and did
       nothing otherwise, which was right while TURNTABLE was the seed: only the non-default needed
       restoring.  With FREE shipping, a browser that deliberately chose TURNTABLE would have been
       silently handed FREE on every reload.  `now: true` applies it instantly instead of starting the
       levelling slerp, because a boot is not a gesture and nothing should animate before the first
       frame. */
    if (s.camMode === 'free' || s.camMode === 'turntable') setCamMode(s.camMode, { now: true });
    if (s.p3Mode === 'vivid' && ui.p3Seg) ui.p3Seg.set('vivid');


    const wantP3 = s.gamut ? s.gamut === 'p3' : appleDevice();
    if (wantP3 && ui.gamutSeg) ui.gamutSeg.set(field.ok && field.setGamut ? (field.setGamut(s.p3Mode === 'vivid' ? 'p3-vivid' : 'p3') === 'srgb' ? 'srgb' : 'p3') : 'srgb');   // it can only come back if the canvas can honour it
    document.body.dataset.gamut = field.ok && field.gamut !== 'srgb' ? 'p3' : 'srgb';
    settingsLoaded = true;
  }


  const KIND = { state: 'core', spectrum: 'core', observer: 'core', palette: 'core', camera: 'core', clip: 'core', transport: 'core', settings: 'other', shadow: 'info', vortex: 'info', slice: 'info', calculus: 'info', meters: 'info', ladder: 'info', orbit: 'control', dynamics: 'control', qcd: 'info', atoms: 'info', field: 'control', molecule: 'other', helium: 'other', h2: 'other', chem: 'other', wigner: 'info', radiation: 'info' };
  /* WAVE 56 · WINDOWS THAT NO LONGER EXIST, and the window that absorbed each of them.  A saved LAYOUT is
     a list of window ids and nothing else, so retiring an id would silently drop a seat out of every layout
     ever saved unless the id has somewhere to go.  `style` (DRAW STYLE) was merged into `observer` (WAVE) by
     board #59, which kept the heir's id precisely so that three CSS selectors and the gate did not have to
     move.  Read by layout.applyLayout(); the settings key's `closed[]` needs nothing, because it names each
     window independently and the heir already names itself. */
  const RETIRED_WINDOWS = { style: 'observer' };
  /* POWER is persistent device state. Presentation eligibility is a separate, transient visibility law below:
     leaving the viewport must save work without rewriting the user's project or switches. */
  const powered = (w) => !(w && w.root && w.root.classList.contains('off'));
  const DIGESTS = {};
  let space = 'x';                 // 'x' position ψ(x) · 'p' momentum φ(p): the same state, two exact pictures


  const quality = { res: 64, steps: 160, scale: 1, auto: true, autoScale: 1, minScale: 0.35 };
  /* AUTO render scale: the canvas backing resolution follows the measured frame interval (rAF cadence, which is what a GPU-bound
     device shows), targeting 60 Hz in FULL and the observed cadence up to 120 Hz in 120 mode. */
  const autoQ = { n: 0, presented: 0, ema: 0, lastMs: 0, changes: 0 };
  /* ── THE GOVERNOR (wave 45): AUTO SCALE extended.  The last 60 presented frames' median is judged against the active
     frame budget: over it, the field grid steps one notch down (128 → 96 → 64) and the READER LAW tightens; sustained
     headroom steps back up;
     paused, nothing is governed and the user's grid comes back at once.  quality.res stays the USER's choice (and the
     project's); gov.drop is this browser's, never serialised. ── */
  const RES_LADDER = [64, 96, 128];
  const gov = { on: true, drop: 0, stepDrop: 0, median: 0, ring: new Float32Array(60), sorted: new Float32Array(60), n: 0, okSince: 0, changes: 0, scroll: 0, parked: new Map(), probes: 0, probeFrame: -1 };


  /** the MOMENT's half: the only thing that may move while the field runs is the filter, never the fill */
  function frostSync() {
    const hold = frostMode === 'still' && clock.playing;
    if (hold !== document.body.classList.contains('frost-hold')) document.body.classList.toggle('frost-hold', hold);
  }
  const STEP_LADDER = [1, 0.7, 0.5];                 // the governor's ray-step multipliers, tried before the grid ladder
  const effectiveRes = () => { if (!gov.drop) return quality.res; let i = RES_LADDER.findIndex((r) => r >= quality.res); if (i < 0) i = RES_LADDER.length - 1; return RES_LADDER[Math.max(0, i - gov.drop)]; };
  const READER_LAW = { park: 16, slow: 6, parkDrop: 8, slowDrop: 3, probeMs: 3000 };   // ms per update: parked while playing / slowed to every 6 × cost — and the tighter pair once stepped down


  const keep = { frames: false };
  const domain = { auto: true, half: 7 };
  /* ── THE CAMERA LAW (wave 50, W-CAMERA) ─────────────────────────────────────────────────────────────────────
   * NEBULA carries four motion modes (AUTO-ROTATE × MOMENTUM) and a fling that fights whichever one is on.  We
   * carry ONE first-order law and one constant.  The camera's angular velocity is an AMBIENT drive plus a
   * RESIDUAL, and only the residual relaxes — at the rate μ = FRICTION (1/s):
   *
   *        ω(t) = ω_amb + d(t),     ḋ = −μ d     ⇒     ω(t) = ω_amb + (ω₀ − ω_amb) e^{−μt}
   *        ω_amb = (AUTO-ROTATE ? SPIN : 0,  0)                    — a yaw drive; PITCH has no ambient
   *
   * so a fling COMPOSES with the ambient spin and relaxes TO it, never against it (NEBULA's N7, "one coalesced
   * strongest request", as a single equation instead of a state machine).  The four booleans become two dials:
   * μ large is "no momentum" (a flick dies inside half a second), μ moderate is momentum, μ = 0 is NO DECAY —
   * the residual never dies and the view spins forever — crossed with the ambient switch, and every combination
   * is reachable and legible.  THE ANGLE IS THE INTEGRAL of ω, not ω·dt: over a frame of dt the exact solution is
   *        Δyaw = ω_amb·dt + d_y (1 − e^{−μ dt})/μ,   Δpitch = d_p (1 − e^{−μ dt})/μ        (→ d·dt as μ → 0)
   * which is why the whole travel of a fling is closed form — with the ambient off it turns through exactly ω₀/μ
   * and stops — and that identity is what the gate judges (B65), not a screenshot.
   * THE CONSTANTS.  μ ∈ [0, 12] /s in steps of 0.05 (so μ = 0 is EXACTLY reachable), DEFAULT CAM.MU_DEF = 1.0 (wave 50
   * shipped 2.5, and the figures that follow are 2.5's): τ = 1/μ = 0.4 s,
   * a hard flick (3 rad/s) coasts ln(ω₀/ω_rest)/μ ≈ 2.8 s and turns through ω₀/μ = 1.2 rad = 69° — two flicks to
   * walk right round the cloud — where μ = 12 gives 0.25 rad = 14° (a nudge) and μ = 1 gives most of a half turn.
   * REST = 0.003 rad/s is half a pixel a second at the drag's own 0.0065 rad/px: below it the residual is set to
   * ZERO, the camera is still, and the loop stops scheduling — idle is zero work (§45).  |ω| is capped at 12 rad/s
   * (two turns a second) so no flick can outrun the picture.  A fling that hits the POLE CLAMP loses its pitch
   * component and keeps its yaw.  THE CAMERA NEVER TOUCHES ψ: it schedules TIER.PRESENT and nothing else, it is
   * not on the undo stack, and reg.version cannot move because of it (§14). */
  const CAM = { MU_MAX: 12, MU_DEF: 1.0, MU_STEP: 0.05, REST: 0.003, MAX: 12, HIST_MS: 80, STALE_MS: 120, SENS: 0.0065, FINE: 0.25, PITCH: 1.52, DIST: [1.2, 8], FOV: [0.25, 1.2], TAP_MS: 320, HOME: { yaw: 0.65, pitch: 0.38, dist: 3.3, fov: 0.6 },
    GAIN: [0.2, 8], GAIN_DEF: 1, GAIN_STEP: 0.01, FLING: [0, 2], FLING_DEF: 1, FLING_STEP: 0.01 };
  const camera = {
    autoRotate: false, speed: 0.25, friction: CAM.MU_DEF,
    dragGain: CAM.GAIN_DEF, flingGain: CAM.FLING_DEF,   // wave 58: rad/px = dragGain × CAM.SENS · the release is multiplied by flingGain before the law sees it
    dy: 0, dp: 0,                                    // THE RESIDUAL d = ω − ω_amb (rad/s): the only state the law carries
    t: 0, steps: 0, flings: 0, last: null,           // t: the seconds the law has integrated — the CAMERA clock (§12)
    get ambient() { return this.autoRotate ? this.speed : 0; },
    get wy() { return this.ambient + this.dy; },     // ω_yaw
    get wp() { return this.dp; },                    // ω_pitch
    get omega() { return Math.hypot(this.wy, this.wp); },
    get moving() { return this.ambient !== 0 || this.dy !== 0 || this.dp !== 0; },   // "the law has something to integrate"
    /** hand the camera an angular velocity (rad/s, capped at MAX): what the law relaxes is ω − ω_amb.
     *  FLING scales ω₀ FIRST — how much you get — and μ then decides how fast it goes: at gain 0 there is nothing
     *  to decay and the view stops dead on release (the drag itself is untouched), which no value of μ can do. */
    fling(wy, wp = 0) { const G = this.flingGain; wy *= G; wp *= G;
      const m = Math.hypot(wy, wp), k = m > CAM.MAX ? CAM.MAX / m : 1;
      if (m < CAM.REST) { wy = 0; wp = 0; }                                   // gain 0, and anything under half a pixel a second: REST is REST after the gain, not before
      this.dy = k * wy - this.ambient; this.dp = k * wp; this.flings++; this.last = { wy: this.wy, wp: this.wp, mu: this.friction, gain: G }; this.wake(); return this.omega; },
    stop() { this.dy = 0; this.dp = 0; },
    /** the camera clock starts NOW: the first frame after an idle must not integrate the idle */
    wake() { lastWall = performance.now() / 1000; schedule(TIER.PRESENT); },
    setFriction(v) { this.friction = Math.max(0, Math.min(CAM.MU_MAX, v)); if (ui.fricK) ui.fricK.set(this.friction); this.wake(); return this.friction; },
    setDragGain(v) { this.dragGain = Math.max(CAM.GAIN[0], Math.min(CAM.GAIN[1], +v || 0)); if (ui.gainK) ui.gainK.set(this.dragGain); return this.dragGain; },
    setFling(v) { this.flingGain = Math.max(CAM.FLING[0], Math.min(CAM.FLING[1], +v)); if (ui.flingK) ui.flingK.set(this.flingGain); return this.flingGain; },
    get radPerPixel() { return this.dragGain * CAM.SENS; },
    setAutoRotate(v) { this.autoRotate = !!v; if (ui.spinSw) ui.spinSw.set(this.autoRotate); this.wake(); return this.autoRotate; },
    setSpeed(v) { this.speed = v; if (ui.spinK) ui.spinK.set(v); this.wake(); return v; },
    setDist(v) { return setDist(v); }, setFov(v) { return setFov(v); }, reset() { resetView(); },
  };
  const fieldRate = { capMs: 0 };
  /* PERFORMANCE: 'full' updates every CPU window every frame; '120' updates them every 4th frame (≈30 Hz at 120 Hz)
     while the FIELD still presents every frame — the picture never waits for a readout.  The profile is an EMA of
     the milliseconds each stage costs per frame, so the mode is chosen on numbers, not on faith. */
  const perf = { mode: '120', cpuEvery: 4, profile: { total: 0, field: 0, spectrum: 0, shadow: 0, orbit: 0, vortex: 0, particles: 0, kepler: 0, fieldlines: 0, dynamics: 0, slice: 0, qcd: 0, molecule: 0, calculus: 0, meters: 0, atoms: 0, wigner: 0, radiation: 0 }, counts: { frames: 0, cpu: 0 }, ring: new Float64Array(60), work: {}, wall: {} };   // work: an EMA of the cost of the updates that DID work (≥ 1 ms), wall: when the last one ran
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
    const cost = perf.work[name] || 0, park = (gov.drop || gov.stepDrop) ? READER_LAW.parkDrop : READER_LAW.park, slow = (gov.drop || gov.stepDrop) ? READER_LAW.slowDrop : READER_LAW.slow;
    /* THE RE-PROBE (wave 50).  A parked reader never runs, so its cost is never measured again, so it stays parked
       for the whole session even after the thing that made it dear has gone (a one-off hitch during its measurement,
       a smaller state, a window that got cheaper, a governor notch that made every reader cheaper).  Once every
       PROBE_MS it is let through ONCE: perf.work is cleared first, so tick() writes a FRESH measurement rather than
       nudging a stale EMA (and a probe under 1 ms writes nothing at all, which reads as free).  The next may() then
       unparks it on the new number, or parks it again on the old one.  PROBE_MS = 3 s is the governor's own recovery
       cadence (3 s under budget lifts a grid notch): one probe of an over-budget reader costs at most its own frame,
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
    if (!gov.on) { gov.drop = 0; gov.okSince = 0; for (const name of [...gov.parked.keys()]) unpark(name, READERS[name]); schedule(TIER.REBUILD); }
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
    autoQ.n = autoQ.presented = autoQ.lastMs = autoQ.ema = 0;
    gov.n = gov.okSince = 0;
    frameBudget.breakSequence();
    if (ui.perfSeg) ui.perfSeg.set(perf.mode);
  }
  const stats = { frames: 0, presents: 0, reconstructs: 0, evolves: 0, rebuilds: 0, tiers: { PRESENT: 0, RECONSTRUCT: 0, EVOLVE: 0, REBUILD: 0 }, lastTier: 'NONE', scheduled: false, fps: 0, reconPerSec: 0, stepsPerSec: 0, lastEncodeMs: 0, fieldT: 0 };
  const cRe = new Float64Array(91), cIm = new Float64Array(91);
  let pointerHeld = false;       // a gesture is in flight: the expensive per-frame readouts wait it out (see periodNow)
  let keplerDirty = true, govVersion = -1, metersWall = 0;   // wave 45: the KEPLER canvas is drawn only while on (one clearing draw after), the parked readers re-run on an edit, METERS repaints at 10 Hz while playing
  let applyVisuals = true;
  /* WAVE 52 · W-MODWINDOW.  The modulation host (lab/mir) and its face.  Declared HERE, beside the
     scheduler's own state, because the frame loop drives the modulation clock and must be able to
     guard on it before the window that shows it has been built. */
  let modHost = null, modView = null, modWall = 0, modExpOn = null, modSyncing = false;
  let feedMs = 0;                      // wave 105: the SMOOTHED feed interval, ms — see the pump


  const ROT_LIMIT = { z: 2 * Math.PI, kz: 2 * Math.PI, def: Math.PI };
  const rotRate = { z: 0, kz: 0, def: 0 };            // rad/s.  THE ANGLE IS NOT STORED AND NEVER WILL BE.
  const rotDriving = () => rotRate.z !== 0 || rotRate.kz !== 0 || rotRate.def !== 0;
  function setRotationRate(key, value) {
    if (!(key in ROT_LIMIT) || !Number.isFinite(value)) return false;
    const v = key !== 'z' && sturm.P ? 0 : Math.max(-ROT_LIMIT[key], Math.min(ROT_LIMIT[key], value));
    if (rotRate[key] === v) return v;
    rotRate[key] = v;
    const k = key === 'z' ? ui.rotZRate : key === 'kz' ? ui.kzRate : ui.defRate;
    setKnob(k, v);
    if (!rotDriving() && history) history.note('rotation drive');
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
    if (az !== 0) reg.rotateZ(az);
    if (ak !== 0) reg.rotateK(ak);                    // ≤ 35 blocks of ≤ 6×6 symEig, unpopulated ones skipped
    if (ad !== 0) reg.defectWait(ad);
    touchState();                                     // ONE schedule for all three, not three
    return true;
  }
  /* ── WAVE 102 · ONE MICROPHONE FOR THE WHOLE RACK ───────────────────────────────────────────
   * `lab/audio.js` owns the stream, the graph and the permission story; the MODEL owns the
   * normaliser, the gate, the four followers and the onset detector.  This holds the one capture
   * they meet at.  It is created lazily — the object costs nothing, but building it before anything
   * asks would be one more thing to reason about at boot — and it NEVER opens the microphone on its
   * own: only a press on an AUDIO device's MIC button reaches `start()`. */
  let audioCap = null;
  const audioCapture = () => (audioCap || (audioCap = createAudioCapture({
    onState: () => { if (modView && modView.isOpen) modView.paint(true); schedule(TIER.PRESENT); }
  })));
  /** THE FEED, at the modulation cadence and only while something wants it.  One `read()` serves
   *  every AUDIO device in the rack: two cards listening to one microphone are two ANALYSES of one
   *  signal, and each applies its own gain, gate and followers on the other side of this call. */
  function feedAudio(feedHz) {
    if (!audioCap || !audioCap.live || !modHost) return 0;
    const MM = modHost.model;
    const packet = audioCap.read(feedHz);
    if (!packet) return 0;
    let n = 0;
    for (const src of MM.sourceList()) {
      if (src.kind !== 'audio') continue;
      MM.modFeedAudio(src.id, packet); n++;
    }
    return n;
  }
  /** WAVE 105 · THE CLOSER, AND IT MAY NOT LIVE ON THE FRAME PATH.  It used to sit at the foot of
   *  `feedAudio`, which only runs from the rAF loop — so removing the last AUDIO device while the loop
   *  was idle left the microphone open for the session.  This is called from the window after every
   *  rebuild, and from `LW.mod.reset()`, neither of which needs a frame.
   *  It also tells the MODEL the signal has stopped: without `audioReset` every follower keeps its last
   *  published value for ever, so closing the mic mid-phrase pinned every routed parameter at whatever
   *  the last frame happened to be rather than letting it fall to zero. */
  function audioSync() {
    if (!modHost) return;
    const MM = modHost.model;
    const devs = MM.sourceList().filter((q) => q.kind === 'audio');
    if (!devs.length && audioCap && (audioCap.live || audioCap.state === 'asking')) audioCap.stop();
    for (const q of devs) { if (MM.audioArm) MM.audioArm(q.id, true); }   // `armed` is false at birth; audioDemand is dead without this
  }
  /** every AUDIO device back to silence — the signal really has stopped, so say so rather than leaving
   *  the last frame's numbers standing. */
  function audioSilence() {
    if (!modHost || !modHost.model.audioReset) return;
    for (const q of modHost.model.sourceList()) if (q.kind === 'audio') modHost.model.audioReset(q.id);
  }
  const MOD = { hz: 60, get step() { return 1000 / this.hz - 0.5; } };   /* the cadence cap: 60 or 120, never the display's */


  let modArm = true;
  let clockLink = true, linkFollowed = null, linkRetryAt = 0;
  let occludeDirty = true, occludeAt = 0;    // INK UNDER GLASS: the window rectangles the line pass skips; refreshed at the top of a frame, before any DOM write
  let stageMix = 0.04, stageFollow = true;   // STAGE: 0 = theme, 1 = chosen colour; FOLLOW THEME bypasses the mix without erasing either setting
  const modKnobs = Object.create(null), modGets = Object.create(null), modHeld = new Set();
  /** THE BASE FOLLOWS THE HAND, EVERY FRAME, FOR EVERYTHING NOT HELD.
   *  Found here and fixed here: every transport EDGE calls the host's applyAll(force), which hands
   *  each unrouted target back to its registry BASE — and the base was seeded once, at registration.
   *  So a camera the hand had orbited to yaw 1.85 and a 3.7 EXPOSURE snapped back to 0.65 and 1.0 the
   *  moment RUN was pressed on a route that had nothing to do with either.  The registry's own
   *  resync() is the wrong tool — it writes the base of MODULATED parameters too, which ratchets the
   *  base up to wherever the LFO happens to be — so this is resync() minus that: re-read the Card's
   *  own adapter for every parameter NOT currently held, and never for one that is.  Eleven property
   *  reads on a frame that was going to run anyway; idle stays zero work, because idle runs no frame. */
  /** WAVE 63 · `all` — INCLUDE THE MODULATED ONES, and it is only ever true on one road.
   *  Per frame the skip is the whole point (the Card of a modulated parameter is showing the
   *  MODULATOR's output, so reading it back would ratchet the base up to wherever the LFO is —
   *  registry.js's own law).  But a RESTORE has just written somebody else's numbers straight into
   *  `mat`/`obs` with `Object.assign`, so at that instant the Card is NOT the modulator's output: it
   *  is the file's, or the LINK's, and it is the only copy of it in the program.  Read it, and read
   *  it BEFORE anything else in the restore can overwrite it.  `setBase` under modulation moves only
   *  the base and leaves `current` to the modulator, which is exactly the law wanted here. */
  function modSyncBases(all) {
    if (!modHost) return 0;
    const R = modHost.registry; let n = 0;
    /* AND IT MUST NOT ASK FOR A FRAME.  setBase publishes through the Card's own setter, which is the
       setter that schedules — but everything written here is the number the instrument ALREADY holds,
       so the paint it would ask for is a paint of what is on the screen.  §45 says idle is zero work,
       and a re-base of a camera that has just come to rest must not be the frame that breaks it. */
    modSyncing = true;
    try {
      for (const id of R.list()) {
        if (!all && R.isModulated(id)) continue;
        const g = modGets[id]; if (!g) continue;
        const v = Number(g());
        if (!Number.isFinite(v) || Object.is(R.snap(id, v), R.baseOf(id))) continue;
        R.write(id, v); n++;
      }
    } finally { modSyncing = false; }
    return n;
  }
  /** the modulator's own write to a control's DIAL — skipped while a finger is on that dial, so the
   *  hand and the LFO never take turns painting the same needle inside one gesture */
  /* A MODULATED knob is PAINTED, a plain one is SET (Josh, 2026-09-10: "touching a macro'd dial teleported the whole
     range"). The registry drives the instrument's value through the adapter's set(), which lands here; for a routed
     id that value is the modulator's, so it goes to show() — the needle dances, the base the hand owns is untouched,
     and a drag starts from the base and moves the range. An unrouted id is a base write and set() is right. */
  let knobIdCache = null, modAdapters = null;   // filled where the adapters are declared (defs)
  const knobIdOf = (k) => { if (!knobIdCache) { knobIdCache = new Map(); for (const a of (modAdapters || [])) { try { const kk = a.knob && a.knob(); if (kk) knobIdCache.set(kk, a.id); } catch (_) {} } } return knobIdCache.get(k); };
  const setKnob = (k, v) => { if (!k || k.root.classList.contains('drag')) return; const id = knobIdOf(k); if (id && modHost && modHost.registry.has(id) && modHost.registry.isModulated(id) && k.show) k.show(v); else k.set(v); };
  /** THE HAND ON A MODULATED CONTROL.  mir/registry's law: `write` IS `setBase`, so turning a knob
   *  under a running LFO moves the BASE and leaves the current value where the modulator has it —
   *  the next output rides on the new base and the picture catches up on the next frame.  Without
   *  this the direct write would be stomped by applyAll one frame later and the knob would fight. */
  const modHand = (id, v) => {
    if (!modHost || !modHost.registry.has(id) || !modHost.registry.isModulated(id)) return false;
    modHost.registry.write(id, v); return true;
  };
  let refSnapshot = null;        // { re, im, ids } — the DIFF reference state
  let pendingRef = null;


  const busy = { n: 0, until: 0, shown: false, x: -200, y: -200, host: null, moves: 0, timer: 0 };
  function busyHost() {
    if (busy.host) return busy.host;
    const h = document.getElementById('busyMark'); if (!h) return null;
    const src = document.querySelector('#title .mark');
    if (src && !h.children.length) { h.appendChild(src.cloneNode(true)); paintMarks(); }
    busy.host = h; return h;
  }
  function busySync() {
    const want = busy.n > 0 || performance.now() < busy.until;
    if (want === busy.shown) return;
    busy.shown = want;
    const h = busyHost(); if (h) { h.hidden = !want; if (want) busyWrite(); }
    if (want) ensureTurnCSS();                                    // the loop reads the CURRENT palette's keyframes
    const m = document.querySelector('#title .mark'); if (m) m.classList.toggle('busy', want);
  }
  function busyWrite() { const h = busy.host; if (!h) return; h.style.setProperty('--cx', busy.x + 'px'); h.style.setProperty('--cy', busy.y + 'px'); }
  /** raise the mark for `ms` from now — the frame-gap rule and any caller that cannot bracket its own work */
  function busyFlash(ms) { const t = performance.now() + ms; if (t > busy.until) busy.until = t; busySync();
    clearTimeout(busy.timer); busy.timer = setTimeout(() => { busy.timer = 0; busySync(); }, Math.max(0, busy.until - performance.now()) + 30); }   // the window has to close itself: nothing else would ask again
  /** bracket a promise (or a synchronous function) with the mark */
  function busyWrap(p) { busy.n++; busySync(); const done = () => { busy.n = Math.max(0, busy.n - 1); busySync(); }; if (p && typeof p.then === 'function') { p.then(done, done); return p; } done(); return p; }
  function cardLoading(w, key) {
    let on = false;
    return (v) => { const next = !!v; if (next === on) return; on = next; w.setLoading(next, key); if (next) { busy.n++; busySync(); } else { busy.n = Math.max(0, busy.n - 1); busySync(); } };
  }
  window.addEventListener('pointermove', (e) => {                       // the position: two writes, no read, and only while it is up
    busy.x = e.clientX; busy.y = e.clientY;
    if (busy.shown) { busy.moves++; busyWrite(); }
  }, { passive: true });

  /* ── FIELD ────────────────────────────────────────────────────────────── */
  /* WAVE 59 · `onLost` WAS NEVER PASSED, and field.js has offered it since it was written: `device.lost`
     flips `field.ok` to false and, with no handler, TELLS NOBODY.  A driver reset, a backgrounded mobile tab
     whose GPU is reclaimed, a laptop switching cards — the rack goes on working, the readouts go on updating,
     and the picture is frozen with no explanation.  That is the most likely failure on a phone and it is the
     one this app was silent about. */
  const field = await createField(dom.canvas, { resolution: quality.res,
    onError: (m) => showBanner('GPU error', m),
    onLost: (i) => showBanner('the GPU device was lost', ((i && i.message) || 'the browser took the WebGPU device back') + ' — the FIELD is frozen where it stands. RELOAD to bring it back; SPECTRUM, SHADOW and METERS are still live and the state is untouched.') });
  if (field.ok) gamutCss = (rgb) => (field.gamut === 'srgb' ? rgbToHex(rgb) : 'color(display-p3 ' + field.gamutInk(rgb).map((v) => v.toFixed(4)).join(' ') + ')');   // wave 54: one map, both sides
  /* M1 (2026-09-24): a device lost before createField finished has already put up onLost's own banner (the GPU device
     was lost … RELOAD); "WebGPU unavailable" over it would be the wrong sentence, so that one road keeps its banner. */
  if (!field.ok && !/^device lost/.test(field.error || '')) showBanner('WebGPU unavailable', field.error + '. The FIELD needs WebGPU; SPECTRUM, SHADOW and METERS still run on the CPU.');
  markBatch++;                        // M7: the boot's build is one synchronous task from here to busyHost() at its tail — one mark paint, there
  /* IT IS DISMISSIBLE NOW (wave 59).  It sat at z-index 60 over the stage for the whole session with no way
     down, which is a poor thing to do with a pane whose ink could not be read.  The × is wired in lab/main.js
     — the one place that reaches BOTH this banner and the `boot failed` one, which never gets here because
     boot() threw — and this re-wires it only if that did not run (a host that calls boot() directly).  Both
     are idempotent through data-wired, so the button never carries two listeners. */
  function showBanner(title, text) {
    dom.banner.hidden = false; dom.banner.querySelector('h3').textContent = title; dom.banner.querySelector('p').textContent = text;
    const x = dom.banner.querySelector('.banner-x');
    if (x && !x.dataset.wired) { x.dataset.wired = '1'; x.addEventListener('click', () => { dom.banner.hidden = true; }); }
  }
  /* ── THE MATHS WORKER (wave 45): the bow's slap, the BOX packet and the transport's period scan run off the frame.
     Every op is the same pure function this thread would call (mathworker.js imports the same modules), so an answer
     is bit-identical to the synchronous road; a worker that fails to load, errors or times out (8 s) hands the call
     back to that road.  The SLAP trigger, the K key, LAUNCH and every forced period reader stay synchronous. ── */
  const makeWorker = (label, timeoutMs = 8000) => {
    let w = null, seq = 0, failed = typeof Worker !== 'function', wantedParked = false, starts = 0; const waiting = new Map();
    /* LA6 · A TIMED-OUT JOB IS STILL RUNNING.  The worker is FIFO and cannot drop a job, so a caller that must know when
       the WORKER is free again (the period scan's one-in-flight law) passes `onLate`: the real reply, or the failure, is
       handed to it after the promise has already resolved { error: 'timeout' }.  Callers that pass nothing are untouched. */
    const late = new Map();
    const fail = (why) => { for (const p of waiting.values()) { clearTimeout(p.timer); p.res({ error: why }); } waiting.clear(); for (const f of late.values()) f({ error: why }); late.clear(); if (w) { try { w.terminate(); } catch (_) {} } w = null; failed = true; console.warn('λWAVES ' + label + ' worker: ' + why + ' — that maths runs on the frame thread'); };
    /* Constructing a module worker fetches and parses its whole private module graph. Three identical workers used
       to do that at the ready boundary even when the session never bowed, scanned or opened a heavy card. */
    const ensure = () => {
      if (w || failed) return w;
      try {
        w = new Worker(new URL('./mathworker.js', import.meta.url), { type: 'module' }); starts++;
        w.onmessage = (e) => { const p = waiting.get(e.data.id); if (p) { waiting.delete(e.data.id); clearTimeout(p.timer); p.res(e.data); } else if (late.has(e.data.id)) { const f = late.get(e.data.id); late.delete(e.data.id); f(e.data); } };
        w.onerror = (e) => fail('worker error: ' + (e && e.message || e));
        /* Message order is FIFO. A worker first requested while the page is away sees PARK before speculative work. */
        if (wantedParked) w.postMessage({ id: 0, op: 'park' });
      } catch (e) { fail('worker construction failed: ' + (e && e.message || e)); }
      return w;
    };
    const raw = (msg, transfer, onLate) => { const worker = ensure(); if (!worker) return Promise.resolve(null); return new Promise((res) => { const id = ++seq; const timer = setTimeout(() => { if (waiting.has(id)) { waiting.delete(id); if (onLate) late.set(id, onLate); res({ error: 'timeout' }); } }, timeoutMs); waiting.set(id, { res, timer }); try { worker.postMessage(Object.assign({ id }, msg), transfer || []); } catch (err) { clearTimeout(timer); waiting.delete(id); res({ error: String(err && err.message || err) }); } }); };
    const call = (msg, transfer, onLate) => busyWrap(raw(msg, transfer, onLate));   // wave 48: every worker job is a BUSY job
    /* WAVE 54 · PARKING is bookkeeping, not a job: it never raises the busy mark and it is never counted as work */
    const idleStat = () => ({ parked: wantedParked, busyMs: 0, jobs: 0, parks: 0, resumes: 0, held: 0, parkedMs: 0, idle: true });
    return { label, get ok() { return !failed; }, get started() { return !!w; }, get starts() { return starts; }, call, raw,
      park: () => { wantedParked = true; return w ? raw({ op: 'park' }) : Promise.resolve(idleStat()); },
      resume: () => { wantedParked = false; return w ? raw({ op: 'resume' }) : Promise.resolve(idleStat()); },
      stat: () => w ? raw({ op: 'stat' }) : Promise.resolve(idleStat()) };
  };
  const maths = makeWorker('bow'), scan = makeWorker('period'), cards = makeWorker('cards');   // separate queues: interaction, recurrence, and user-requested card preparation cannot block each other
  /* CHEMISTRY gets a FOURTH queue and its own ceiling, for two reasons that are both measured rather than
     aesthetic.  (1) Benzene/STO-3G is 36 s of McMurchie–Davidson integrals on this machine — the 8 s cap would
     declare a timeout and hand that work to the FRAME THREAD, which is the one thing the card must never do.
     (2) The real-time record (P, P(t−h), the trace) lives in ONE worker instance, so chem.rt.init and every
     chem.rt.run after it must reach the same worker; sharing `cards` would also let a 36 s solve block HELIUM. */
  const chemW = makeWorker('chem', 300000);
  const solveCard = (msg, fallback, pluck = (r) => r.result) => {
    const local = () => busyWrap(new Promise((resolve, reject) => requestAnimationFrame(() => setTimeout(() => { try { resolve(fallback()); } catch (e) { reject(e); } }, 0))));
    if (!cards.ok) return local();
    return cards.call(msg).then((r) => r && !r.error ? pluck(r) : local());
  };
  /** the chem road: same shape as solveCard, its own worker, and a fallback only a Worker-less browser reaches */
  const solveChem = (msg, fallback, pluck = (r) => r.result) => {
    const local = () => busyWrap(new Promise((resolve, reject) => requestAnimationFrame(() => setTimeout(() => { try { resolve(fallback()); } catch (e) { reject(e); } }, 0))));
    if (!chemW.ok) return local();
    return chemW.call(msg).then((r) => r && !r.error ? pluck(r) : local());
  };
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
      autoQ.lastMs = 0; autoQ.n = 0; autoQ.presented = 0; autoQ.ema = 0;   // the auto-scale window, and the "the thread was blocked" flash that a 3-minute gap would otherwise fire
      gov.n = 0; gov.okSince = 0; metersWall = 0; winStart = 0; winFrames = winRecon = winSteps = 0;
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
    if (modSyncing) return;                    // wave 52: a re-base writes what is already there (modSyncBases)
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
  const windowActivity = createWindowActivity({ onChange: () => schedule(TIER.PRESENT) });
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
    if (molecule && molecule.on) return molecule.fieldModes(t);           // the molecule holds the field
    if (helium && helium.on) return helium.fieldModes();                   // helium: the conditional cloud of electron 2
    if (h2 && h2.on) return h2.fieldModes();                               // H₂: the Heitler–London one-electron density
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
    if (domain.auto) domain.half = (chem && chem.on) ? chem.half : (h2 && h2.on) ? h2.half : (helium && helium.on) ? helium.half : (molecule && molecule.on) ? molecule.half : (space === 'p' ? HH.domainForP(reg.nmin()) : sturm.P ? sturmHalf() : HH.domainFor(reg.nmax(1e-3)));   // ignore a slap's 1e-4 tails
    if (field.ok) field.setSpace((h2 && h2.on) ? 5 : (helium && helium.on) ? 4 : (space === 'p' ? HH.kernelSpace.p : HH.kernelSpace.x));
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


  const camTravel = { yaw: 0, pitch: 0 };     // the turn a drag has APPLIED, in the turntable's units — the FLING reads this in BOTH modes
  const camLevel = { from: null, to: null, t0: 0, ms: 150, yaw: 0, pitch: 0 };   // FREE → TURNTABLE levels the roll over 150 ms; it never snaps
  /** in FREE the two angles are a READOUT of the look direction — kept live so every dial, digest and cache key still moves */
  function syncFreeAngles() {
    const a = yawPitchFromQuat(obs.quat, CAM.PITCH);
    obs.yaw = a.yaw + 2 * Math.PI * Math.round((obs.yaw - a.yaw) / (2 * Math.PI));   // stay on the turn the instrument was already on: a fling must not lose 2π
    obs.pitch = a.pitch;
  }
  /** THE ONE ROAD for a RELATIVE turn of the camera — the drag, the keys, LW.orbit and a modulated angle all come here */
  function orbitBy(dyaw, dpitch) {
    if (obs.mode === 'free') { obs.quat = turnFree(obs.quat, dyaw, dpitch); camTravel.yaw += dyaw; camTravel.pitch += dpitch; syncFreeAngles(); }
    else {
      obs.yaw += dyaw; camTravel.yaw += dyaw;
      const held = Math.max(-CAM.PITCH, Math.min(CAM.PITCH, obs.pitch + dpitch));
      camTravel.pitch += held - obs.pitch; obs.pitch = held;                       // the clamp EATS the travel, so a fling into the pole inherits no phantom pitch
    }
    return camTravel;
  }
  /* Key presses add a small orbit to a time-based easing queue. Repeats accumulate while held;
     a released key finishes its queued travel without leaving a perpetual camera drive. */
  const keyOrbit = { yaw: 0, pitch: 0 };
  const keyOrbitMoving = () => Math.abs(keyOrbit.yaw) + Math.abs(keyOrbit.pitch) > 0;
  function queueKeyOrbit(yaw, pitch) { if (!keyOrbitMoving()) lastWall = performance.now() / 1000;
    keyOrbit.yaw += yaw; keyOrbit.pitch += pitch; schedule(TIER.PRESENT); }
  function stepKeyOrbit(dt) {
    if (!keyOrbitMoving()) return false;
    const k = 1 - Math.exp(-Math.max(0, dt) / 0.065);
    const y = Math.abs(keyOrbit.yaw) < 0.00015 ? keyOrbit.yaw : keyOrbit.yaw * k;
    const p = Math.abs(keyOrbit.pitch) < 0.00015 ? keyOrbit.pitch : keyOrbit.pitch * k;
    keyOrbit.yaw -= y; keyOrbit.pitch -= p;
    if (Math.abs(keyOrbit.yaw) < 0.00015) { orbitBy(keyOrbit.yaw, 0); keyOrbit.yaw = 0; }
    if (Math.abs(keyOrbit.pitch) < 0.00015) { orbitBy(0, keyOrbit.pitch); keyOrbit.pitch = 0; }
    orbitBy(y, p);
    return true;
  }
  /** TURNTABLE ⇄ FREE.  Into FREE is an EXACT conversion and moves no pixel; out of it slerps the roll away. */
  function setCamMode(m, opt) {
    const want = m === 'free' ? 'free' : 'turntable';
    if (ui.camSeg) ui.camSeg.set(want);
    if (want === obs.mode && !camLevel.from) return obs.mode;
    if (want === 'free') { camLevel.from = null; obs.quat = quatFromYawPitch(obs.yaw, obs.pitch); obs.mode = 'free'; }
    else {
      const a = yawPitchFromQuat(obs.quat, CAM.PITCH);
      const yaw = a.yaw + 2 * Math.PI * Math.round((obs.yaw - a.yaw) / (2 * Math.PI));
      const to = quatFromYawPitch(yaw, a.pitch);
      if (opt && opt.now) { obs.mode = 'turntable'; obs.yaw = yaw; obs.pitch = a.pitch; obs.quat = to; camLevel.from = null; }
      else { camLevel.from = obs.quat.slice(); camLevel.to = to; camLevel.yaw = yaw; camLevel.pitch = a.pitch; camLevel.t0 = performance.now(); }
    }
    saveSettings(); schedule(TIER.PRESENT);
    return obs.mode;
  }
  /** one step of the levelling slerp — the ONLY thing that writes the pose between the two modes */
  function camLevelStep(nowMs) {
    if (!camLevel.from) return false;
    const u = Math.min(1, (nowMs - camLevel.t0) / camLevel.ms), e = u * u * (3 - 2 * u);
    if (u >= 1) { obs.quat = camLevel.to; obs.mode = 'turntable'; obs.yaw = camLevel.yaw; obs.pitch = camLevel.pitch; camLevel.from = null; }
    else { obs.quat = slerp(camLevel.from, camLevel.to, e); syncFreeAngles(); }
    return true;
  }
  /** ONE tick of the CAMERA clock: the EXACT solution of ḋ = −μd over dt, and the exact INTEGRAL of ω for the pose.
   *  Returns whether the pose moved.  Never called while a finger is on the field — the drag owns the pose then. */
  function cameraStep(dt) {
    if (!(dt > 0)) return false;
    const mu = Math.max(0, camera.friction), wa = camera.ambient;
    let iy, ip;                                                                      // ∫₀^dt d(s) ds — the residual's own travel
    if (mu > 0) { const e = Math.exp(-mu * dt), s = (1 - e) / mu; iy = camera.dy * s; ip = camera.dp * s; camera.dy *= e; camera.dp *= e; }
    else { iy = camera.dy * dt; ip = camera.dp * dt; }                               // μ = 0: no decay at all — the fling spins forever
    if (!wa && Math.hypot(camera.dy, camera.dp) < CAM.REST) { camera.dy = 0; camera.dp = 0; }   // REST: the camera is still, and the loop may stop
    camera.t += dt; camera.steps++;
    if (obs.mode === 'free') {
      const amb = wa * dt;                                                           // the AMBIENT is a WORLD axis: LEFT-multiply
      if (amb) obs.quat = qnormalize(qmul([Math.cos(amb / 2), 0, 0, Math.sin(amb / 2)], obs.quat));
      if (iy || ip) obs.quat = turnFree(obs.quat, iy, ip);                            // the RESIDUAL is screen-relative: RIGHT-multiply, and no clamp anywhere
      if (amb || iy || ip) { syncFreeAngles(); return true; }
      return false;
    }
    const dyaw = wa * dt + iy;
    if (dyaw) obs.yaw += dyaw;
    if (ip) { const want = obs.pitch + ip, held = Math.max(-CAM.PITCH, Math.min(CAM.PITCH, want)); if (held !== want) camera.dp = 0; obs.pitch = held; }   // the pole clamp EATS the pitch fling; the yaw runs on
    return dyaw !== 0 || ip !== 0;
  }
  /* the camera's pose has ONE road each: the ZOOM dial, the wheel, the pinch and the arrow keys all come through
     setDist, so the dial can never lie about where the camera is (and neither can a restored project) */
  function setDist(v) { if (modHand('observer.dist', v)) return obs.dist; obs.dist = Math.max(CAM.DIST[0], Math.min(CAM.DIST[1], v)); if (ui.zoomK) ui.zoomK.set(obs.dist); schedule(TIER.PRESENT); return obs.dist; }
  function setFov(v) { if (modHand('observer.fov', v)) return obs.fov; obs.fov = Math.max(CAM.FOV[0], Math.min(CAM.FOV[1], v)); if (ui.fovK) ui.fovK.set(obs.fov); schedule(TIER.PRESENT); return obs.fov; }
  function syncCamUI() { if (ui.zoomK) ui.zoomK.set(obs.dist); if (ui.fovK) ui.fovK.set(obs.fov); if (ui.gainK) ui.gainK.set(camera.dragGain); if (ui.flingK) ui.flingK.set(camera.flingGain); }
  /** RESET VIEW (the trigger, R, a double-click and a double-tap): the shipped pose and the motion with it —
      AUTO-ROTATE is a mode, not a pose, so the ambient drive is left exactly where the switch put it */
  function resetView() { const m = obs.mode; camLevel.from = null; Object.assign(obs, CAM.HOME); obs.mode = m; obs.quat = quatFromYawPitch(CAM.HOME.yaw, CAM.HOME.pitch); camera.stop(); syncCamUI(); schedule(TIER.PRESENT); }   // wave 54: the pose is the same pose in either mode
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
    frostSync();   /* WAVE 67: the FROST policy's one per-frame act — a class compare, no read of anything.
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
        /* LINKED means linked every frame, not only on the press that toggled play: a scrub, a preset,
           a project open or a HOLD can stop or start either clock on its own, and this is what closes
           the in-between state (one clock running, the other not) that used to appear afterwards. */
        if (clockLink && modArm && clock.playing !== linkFollowed && nowMs >= linkRetryAt) {
          linkFollowed = clock.playing;
          const r = clock.playing ? modHost.clock.play(now) : modHost.clock.pause(now);
          /* a refused play ("nothing-to-run": no route and no open window) is retried once a second, not
             every frame — so a source routed later joins a running transport within a second */
          if (r && r.ok === false) { linkFollowed = null; linkRetryAt = nowMs + 1000; }
          else if (modView) modView.sync();   /* LA2: a REFUSED play changed neither the model nor `playing` (host.js refuses
                                                 before it touches either), so its repaint was the same window again —
                                                 a whole closed window, once a second, while playing (AUDIT-B FB3) */
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
    if (tier >= TIER.REBUILD) applyRebuild();
    let modes = null;
    if (tier >= TIER.RECONSTRUCT) {
      const due = (nowMs - lastReconMs) >= fieldRate.capMs;          // FIELD clock: cadence, never c
      if (tier !== TIER.EVOLVE || due) { modes = modesAt(clock.t); lastReconMs = nowMs; stats.fieldT = clock.t; winRecon++; }
    }
    const tFrame0 = performance.now();
    if (tier >= TIER.PRESENT && field.ok) {                          // PRESENTATION
      field.setStepCap(Math.min(tabletMotion ? tablet.steps : Infinity, gov.stepDrop ? Math.max(24, Math.round(mat.steps * STEP_LADDER[gov.stepDrop])) : Infinity));   // full saved quality returns on the first still frame; the governor's step cap rides on top
      tick('field', () => { field.resize(quality.scale * (quality.auto ? quality.autoScale : 1)); field.frame({ modes, refModes: pendingRef, obs, mat, molecule: !!(molSession && molSession.molecule) }); });   // ONE owner flag: the session holds the molecule, so the session says whether the volume is molecular
      pendingRef = null;
      stats.presents++; stats.lastEncodeMs = field.stats.lastEncodeMs;
    }
    if (modes) stats.reconstructs++;
    if (tier > 0) { stats.tiers[TIER_NAME[tier]]++; stats.lastTier = TIER_NAME[tier]; }
    stats.frames++; winFrames++;
    autoQ.n++; if (tier >= TIER.PRESENT) autoQ.presented++;
    if (autoQ.lastMs && tier >= TIER.PRESENT) {
      const iv = nowMs - autoQ.lastMs;
      frameBudget.sample(iv);
      if (iv <= 250) { autoQ.ema = autoQ.ema ? autoQ.ema * 0.85 + iv * 0.15 : iv; gov.ring[gov.n % 60] = iv; gov.n++; }
    }
    if (autoQ.lastMs && nowMs - autoQ.lastMs > 250) busyFlash(600);    // wave 48: a gap that long means the thread WAS blocked by work nobody wrapped — say so for 600 ms
    autoQ.lastMs = nowMs;
    const slot = perf.counts.frames % 60; perf.ring[slot] = 0; loopRing[slot] = 0;   // filled at the tail with this frame's own main-thread cost — the SAME slot (LA1)
    if (autoQ.n >= 24) {
      if (quality.auto && autoQ.presented >= 18 && autoQ.ema) {
        const budget = perfBudgetMs();
        if (autoQ.ema > budget * 4 / 3 && quality.autoScale > quality.minScale) { quality.autoScale = Math.max(quality.minScale, +(quality.autoScale - 0.1).toFixed(2)); autoQ.changes++; }
        // At vsync the interval cannot get shorter just because the GPU has
        // headroom. Probe upward at the target cadence; back off if it misses.
        else if (autoQ.ema <= budget * 1.08 && quality.autoScale < 1) { quality.autoScale = Math.min(1, +(quality.autoScale + 0.05).toFixed(2)); autoQ.changes++; }
      }
      autoQ.n = 0; autoQ.presented = 0;
      if (ui.scaleRo) ui.scaleRo.set((100 * quality.scale * (quality.auto ? quality.autoScale : 1)).toFixed(0) + '%', quality.auto && quality.autoScale < 1 ? 'warn' : '');
    }
    /* THE GOVERNOR: the median of the last 60 presented frames, judged every 30 frames while playing */
    if (gov.n >= 30 && (gov.n % 30) === 0) {
      const m = Math.min(60, gov.n), s = gov.sorted.subarray(0, m); s.set(gov.ring.subarray(0, m)); s.sort(); gov.median = s[m >> 1];   // typed-array sort is numeric; no copy through a plain array
      if (gov.on && clock.playing) {
        const budget = perfBudgetMs();
        if (gov.median > budget * 1.68) {
          gov.okSince = 0;


          /* 2026-09-10: RAY STEPS FIRST, GRID SECOND. A step cap is a present-time number — applied on the next
             frame, no texture destroyed or rebuilt — and the ray-march cost is linear in it. Only when two step
             drops (×0.7, ×0.5) are not enough does the grid ladder move, which is the destroy/recreate that a
             driver under load likes least. Recovery walks back in the opposite order: grid, then steps. */
          if (gov.stepDrop < STEP_LADDER.length - 1) { gov.stepDrop++; gov.changes++; gov.n = 0; schedule(TIER.PRESENT); }
          else if (gov.drop < 2) { gov.drop++; gov.changes++; gov.n = 0; schedule(TIER.REBUILD); }   // the ring restarts: the next judgment measures the new state, not the old frames
        } else if (gov.median < budget * 1.32) { if (!gov.okSince) gov.okSince = nowMs; else if (nowMs - gov.okSince >= 3000 && (gov.drop > 0 || gov.stepDrop > 0)) { if (gov.drop > 0) gov.drop--; else gov.stepDrop--; gov.changes++; gov.okSince = nowMs; gov.n = 0; schedule(TIER.REBUILD); } }
        else gov.okSince = 0;
      }
    }
    if (!clock.playing && (gov.drop || gov.stepDrop)) { const rebuild = gov.drop > 0; gov.drop = 0; gov.stepDrop = 0; gov.okSince = 0; gov.changes++; schedule(rebuild ? TIER.REBUILD : TIER.PRESENT); }   // paused: nothing to govern — the user's grid and steps come back at once
    perf.counts.frames++;
    const cpuTick = !clock.playing || (perf.counts.frames % perf.cpuEvery) === 0;   // the CPU windows' cadence
    if (cpuTick) {
      /* modesAt() already evolved the same register into these scratch arrays on a reconstruction frame. Reuse it;
         in 120 Hz mode the other three frames need no CPU-reader coefficient vector at all. */
      const c = modeStateT === clock.t && modeStateVersion === reg.version ? modeState : reg.at(clock.t, cRe, cIm);
      perf.counts.cpu++;
      if (reg.version !== govVersion) { govVersion = reg.version; if (gov.parked.size) { const np = reg.populated().length; for (const [name, p] of [...gov.parked.entries()]) if (np < p.pop) unpark(name, READERS[name]); } }   // an edit that SHRANK the state: a parked reader may have got cheap — re-measured (one that grew stays parked: the landing frame measured 449 ms with the SLICE re-measuring on 91 labels)
      if (may('spectrum', wSpec)) tick('spectrum', () => spectrum.update(c, clock.t));
      if (may('shadow', wSh)) tick('shadow', () => shadowView.update(c, clock.t, stateReaders().populated, spectrum.selected));
      if (may('orbit', wOrb)) tick('orbit', () => { orbit.update(obs); keplerRowSync(); });   // the Kepler knobs' own liveness rides the tick this window already pays for, keyed on reg.version like every other reader
    }
    const overlayDomain = space === 'x' && getHamiltonian().hydrogenTheorems && !sturm.P &&
      !(molecule && molecule.on) && !(helium && helium.on) && !(h2 && h2.on) && !(chem && chem.on);
    if (overlayDomain) {
      const vortexVisible = canPresent(wVor);
      if (vortexVisible && may('vortex')) tick('vortex', () => vortex.update(reg, clock.t, obs, domain.half, clock.playing));
      else if (!vortexVisible) vortex.suspend();

      const particlesVisible = canPresent(wDyn);
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
      /* The impulse remains a stage gesture when a molecule, helium, H₂, momentum space or a
         Sturmian owns the field.  Those modes deliberately skip the Kepler redraw above, so clear
         its transparent canvas explicitly before bowFrame() paints the next arrow. */
      if (bow) kepler.clear(); else kepler.suspend();
    }

    const fieldVisible = fieldOn() && fieldlines.overlay !== 'off';
    if (fieldVisible && may('fieldlines')) tick('fieldlines', () => fieldlines.update(reg, clock.t, obs, domain.half, clock.playing, getZ(), true));
    else if (!fieldVisible) fieldlines.update(reg, clock.t, obs, domain.half, clock.playing, getZ(), false);
    kepler.bowFrame();
    /* the MOLECULE and H₂ integrators feed the FIELD, so they run whether or not their card can be seen;
       only moPanel's repaint is chrome, and that is the one thing the hidden interface drops (wave 48) */
    const molVisible = canPresent(wMol); if (moPanel) moPanel.setActive(molVisible);
    helium.setActive(canPresent(wHe));
    h2.setActive(canPresent(wH2));
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
      if (powered(wMol) || (h2 && h2.on && powered(wH2))) tick('molecule', () => {
        if (molecule && powered(wMol)) molecule.update(clock.t);
        if (moPanel && molVisible) moPanel.update(clock.t, clock.playing);
        if (pulsePanel && molVisible) pulsePanel.update(clock.t);
        if (h2 && h2.on && powered(wH2)) { h2.update(clock.t); if (h2.run && clock.playing) schedule(TIER.RECONSTRUCT); }
      });
    }
    if (cpuTick) {
      if (may('dynamics', wDyn)) tick('dynamics', () => dynamics.update(reg, clock.t, clock.playing));
      if (sliceVisible && may('slice', wSlice)) tick('slice', () => slice.update(reg, clock.t, clock.playing));
      if (may('qcd', wQCD)) tick('qcd', () => qcd.update());
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
      if (may('calculus', wCalc)) tick('calculus', () => { if (calculus && !sturm.P && !(molecule && molecule.on) && !(helium && helium.on) && !(h2 && h2.on) && !(chem && chem.on)) calculus.update(reg, clock.t); });
      if (canPresent(wSh)) ui.hc.set(reg.energy().toFixed(5));
      if (canPresent(wSpec) && sturm.P && ui.sturmRo && sturm.roVersion !== reg.version) paintSturmRo();   // W-STURMIAN: the scale's readout follows the state
      if (canPresent(wSpec) && gas && gas.on && ui.gasRo && (perf.counts.cpu % 6) === 0) { const s = gas.stats(clock.t); ui.gasRo.set(`${(100 * gas.captured).toFixed(1)}% held · ⟨z⟩ ${s.z.toFixed(2)} · σ_z ${s.sz.toFixed(2)}`, gas.captured > 0.85 ? 'ok' : 'warn'); }
    }
    if (canPresentTransport()) transport.update();
    /* WAVE 52: the strip, the meters and the beat readout, at 30 Hz (modview throttles itself) — and
       the EXPAND lamp, which is the one thing that must be painted whether the window is open or not. */
    if (modHost) {
      if (!uiHidden && modView && modView.isOpen) modView.paint(false);
      const on = modHost.clock.isRunning();
      if (on !== modExpOn) { modExpOn = on; if (ui.modExp) ui.modExp.classList.toggle('live', on); }
    }
    if (now - winStart >= 1) {
      const w = now - winStart; stats.fps = winFrames / w; stats.reconPerSec = winRecon / w; stats.stepsPerSec = winSteps / w;
      winStart = now; winFrames = winRecon = winSteps = 0;
    }
    inLoop = false;
    loopTail(false);                                                  // LA4: the re-arm, one function for this tail and the fault's
    if (cpuTick && canPresent(wMet) && (!clock.playing || nowMs - metersWall >= 100)) { metersWall = nowMs; tick('meters', () => { meters.update(meterSnapshot()); badges.update(); paintGovernor(); }); }   // wave 45: 10 Hz while playing (fifteen strings and a snapshot per call), every frame when paused
    if (ui.sliceMini && canPresent(wClip)) ui.sliceMini.paint();   // the plane model lives in the SLICE / CLIP window, not in SLICE — gated on the wrong window it never repainted while dragged
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
    else { stats.scheduled = false; stats.fps = 0; stats.reconPerSec = 0; stats.stepsPerSec = 0; autoQ.lastMs = 0; frameBudget.breakSequence(); }
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
    const st = !gov.on ? 'OFF' : gov.drop ? 'GRID −' + gov.drop + (gov.stepDrop ? ' · STEPS ×' + STEP_LADDER[gov.stepDrop] : '') : gov.stepDrop ? 'STEPS ×' + STEP_LADDER[gov.stepDrop] : 'nominal';
    ui.govRo.set(`${st} · ${gov.median ? gov.median.toFixed(1) : '—'} ms · ${field.ok ? field.resolution : 0}³`, !gov.on ? '' : (gov.drop || gov.stepDrop) ? 'warn' : 'ok');
    const parked = [...gov.parked.entries()].map(([n, p]) => n + ' ' + p.cost.toFixed(0) + ' ms');
    ui.govRo.setSub((parked.length ? 'parked: ' + parked.join(' · ') : 'all readers active') + ' · budget ' + (perfBudgetMs() * 1.68).toFixed(0) + ' ms · scale ' + (100 * quality.scale * (quality.auto ? quality.autoScale : 1)).toFixed(0) + '%');
  }
  function statusLine() {
    const rs = stateReaders().rendered;
    let s = reg.field.Fz !== 0 ? 'STARK SHELL MODEL · FIELD GRID'
      : reg.field.Bz !== 0 ? 'ZEEMAN MODEL · FIELD GRID'
      : 'HYDROGEN · FIELD GRID';
    if (sturm.P) s = 'STURMIAN λ = ' + sturm.lambda.toFixed(3) + ' · S-NORM' + (reg.field.Bz !== 0 ? ' · ZEEMAN' : '') + ' · FIELD GRID';
    if (h2 && h2.on) return 'H₂ · HEITLER–LONDON · CLASSICAL NUCLEI · ONE-ELECTRON DENSITY · FIELD GRID';
    if (helium && helium.on) return 'HELIUM · HYLLERAAS · CONDITIONAL DENSITY · FIELD GRID';
    if (molecule && molecule.on) return 'H₂⁺ · LCAO · CLASSICAL NUCLEI · FIELD GRID';
    if (reg.damping > 0) s = 'DRAG γ = ' + reg.damping.toFixed(3) + ' · ' + s;
    if (!field.ok) s += ' (no GPU)';
    if (rs.masked) s += ` · MASKED ${rs.masked}`;
    if (rs.truncated) s += ` · TRUNCATED ${rs.truncated}`;
    return s;
  }

  /* ── WAVE 57 · WHAT "REDUCED MOTION" MEANS FOR A STROBING VOLUMETRIC RENDER ─────────────────────────
   * `prefers-reduced-motion: reduce` is the strongest thing a user can say about movement, and until this
   * wave the app's ENTIRE answer to it was to switch off a 120 ms scale on the logo.  The thing the
   * photosensitivity notice exists to warn about — the field, evolving — never heard it.
   *
   * IT DOES NOT MEAN FROZEN, and that is a decision, not a shortcut.  This is a time-evolution instrument:
   * a frozen field is not a reduced λWAVES, it is a broken one, and the preference asks for less motion,
   * not for the physics to stop.  What makes a strobe dangerous is the RATE at which the luminance
   * changes, and the rate is exactly the quantity the clock already owns (a.u. per wall second).  So:
   *   1. NOTHING MOVES UNASKED.  `?play=1` — the one thing that starts the transport without a press, and
   *      the thing a shared link can carry — is refused.  The PLAY button is untouched and always works.
   *   2. WHEN IT IS ASKED TO MOVE IT MOVES AT A QUARTER SPEED, and only where nobody chose the number: a
   *      rate a PRESET, a project or a link asks for is divided by 4; a rate the RATE knob was dragged to
   *      is not touched, because a default is for a first visit and the hand always wins (STYLE-LOCK).
   * `?motion=reduce` / `?motion=full` name the input the way `?warn=` does, so a gate can ask the question
   * without a browser profile; otherwise it is the media query, live.
   * WAVE 59 · AND BOTH OF THEM ARE BEHIND `navigator.webdriver` NOW.  `?motion=full` in a shared link
   * overrode the visitor's OPERATING-SYSTEM `prefers-reduced-motion: reduce` — the strongest thing a person
   * can say about movement, and the one this app's photosensitivity notice exists beside.  A link is somebody
   * else's picture (wave 56's own law about the fragment); it does not get to answer that question for the
   * reader.  `?motion=reduce` is gated with it for the same reason `?warn=1` is: a gate with one arm
   * reachable from a public URL is not one rule. */
  const MOTION = (() => {
    const q0 = navigator.webdriver === true ? new URLSearchParams(location.search).get('motion') : null;
    const mq = (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)')) || null;
    const forced = q0 === 'reduce' ? true : q0 === 'full' ? false : null;
    const st = { divisor: 4, source: forced === null ? 'media' : 'query', reduced: forced === null ? !!(mq && mq.matches) : forced, autoplay: 'not asked' };
    if (forced === null && mq && mq.addEventListener) mq.addEventListener('change', (e) => { st.reduced = e.matches; });
    return st;
  })();
  /** the rate NOBODY CHOSE — a preset's, a project's, a link's — paced for this browser's motion preference */
  const paceRate = (r) => (MOTION.reduced ? r / MOTION.divisor : r);

  /* ── state mutations: ONE road (finger, key, test, restore all come here) ─ */
  let lastNmax = 1;
  function touchState() {
    const nm = reg.nmax();
    if (domain.auto && nm !== lastNmax) { lastNmax = nm; schedule(TIER.REBUILD); }
    else schedule(TIER.RECONSTRUCT);
  }
  function loadPreset(id) {
    const p = PRESET_BY_ID.get(id); if (!p) return false;
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
  const rack = dom.rack;


  const wObs = device({ id: 'observer', eyebrow: 'WAVE', status: '' });
  const wPal = device({ id: 'palette', eyebrow: 'PALETTE', status: '' });
  const wCam = device({ id: 'camera', eyebrow: 'CAMERA', status: '' });
  let capApi = null;                      // wave 58: the CAPTURE group's handle, published out of the block that builds it (LW reads it)
  const wClip = device({ id: 'clip', eyebrow: 'SLICE / CLIP', status: '' });
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
    r1.appendChild(ui.viewSeg.root);
    const r2 = el('div', 'row tight', gSpace);
    ui.expK = knob({ label: 'EXPOSURE', min: 0.08, max: 12, value: 1, log: true, fmt: (v) => v.toFixed(2), onInput: (v) => { if (modHand('material.exposure', v)) return; mat.exposure = v; schedule(TIER.PRESENT); } }); r2.appendChild(ui.expK.root);
    ui.softK = knob({ label: 'SOFT', min: 0.3, max: 2.2, value: 0.7, fmt: (v) => 'γ' + v.toFixed(2), onInput: (v) => { if (modHand('material.softness', v)) return; mat.softness = v; schedule(TIER.PRESENT); } }); r2.appendChild(ui.softK.root);
    ui.hueK = knob({ label: 'HUE', min: 0, max: 1, value: 0, wrap: true, fmt: (v) => (v * 360).toFixed(0) + '°', onInput: (v) => { if (modHand('material.hue', v)) return; mat.hueShift = v; applyAccent(); schedule(TIER.PRESENT); } }); r2.appendChild(ui.hueK.root);


    /* ── THEME and SURFACE: the interface's skin, and the stage underneath it ── */
    ui.set = device({ id: 'settings', eyebrow: 'SETTINGS', status: '' });
    const gi = group(ui.set.body, 'INTERFACE');
    const ri = el('div', 'row tight', gi);
    ui.badgesSw = sw({ label: 'STATUS TAGS', value: false, title: 'Show status tags at the top', onChange: (v) => { document.body.classList.toggle('no-badges', !v); saveSettings(); } }); ri.appendChild(ui.badgesSw.root);
    ui.controlHintsSw = sw({ label: 'CONTROL HINTS', value: true, title: 'Show control hints after a short hover', onChange: (v) => { document.body.classList.toggle('control-hints-off', !v); document.dispatchEvent(new Event('controlhintschange')); saveSettings(); } }); ri.appendChild(ui.controlHintsSw.root);
    ui.capSw = sw({ label: 'STAGE CAPTIONS', value: false, title: 'the KEPLER / VORTEX lines at the foot of the stage', onChange: (v) => { document.body.classList.toggle('no-captions', !v); saveSettings(); schedule(TIER.PRESENT); } }); ri.appendChild(ui.capSw.root);
    ri.appendChild(trig({ label: 'RESET LAYOUT', title: 'Restore the default window layout', onFire: () => layout.resetLayout() }).root);
    ri.appendChild(trig({ label: 'FORGET', title: 'Clear saved interface settings and reload', onFire: () => { try { localStorage.removeItem(SETTINGS_KEY); } catch (e) {} location.reload(); } }).root);


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


    const sysMQ = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const systemTheme = () => (sysMQ && sysMQ.matches ? 'dark' : 'light');
    let themeChoice = 'dark', theme = 'dark';
    function setTheme(id) {
      themeChoice = (id === 'system' || THEMES[id]) ? id : 'dark';
      theme = themeChoice === 'system' ? systemTheme() : themeChoice;
      document.body.dataset.theme = theme;
      document.body.dataset.themeChoice = themeChoice;
      /* WAVE 56: the browser's own chrome follows the theme.  A manifest's theme_color is one static value and
         cannot; <meta name="theme-color"> can, and overrides the manifest wherever it is honoured — most visibly
         as the bar behind an installed standalone window.  #eef1f6 is skin.css's `body[data-theme="light"] #stage`,
         #070a0f is lab.css's unconditional ground, which is what the document IS before a theme resolves. */
      const tc = document.getElementById('themeColor');
      if (tc) tc.setAttribute('content', theme === 'light' ? '#eef1f6' : '#070a0f');
      mat.bg = THEMES[theme].bg.slice();
      if (__LW_hooks.restage) __LW_hooks.restage();
      mat.lightUI = theme === 'light';                                     // wave 48: the GPU chrome (the cube frame, the three axes) cannot read a CSS token — it reads this
      if (ui.themeSeg) ui.themeSeg.set(themeChoice);
      if (__LW_hooks.themeChanged) __LW_hooks.themeChanged(theme);
      applyAccent(); saveSettings();
      schedule(TIER.PRESENT);
    }
    if (sysMQ) { const onSys = () => { if (themeChoice === 'system') setTheme('system'); };
      if (sysMQ.addEventListener) sysMQ.addEventListener('change', onSys); else if (sysMQ.addListener) sysMQ.addListener(onSys); }
    ui.themeSeg = seg({ label: 'THEME', value: 'light', options: [
      { id: 'light', label: 'LIGHT', title: 'Use the light interface and stage' },
      { id: 'dark', label: 'DARK', title: 'Use the dark interface and stage' },
      { id: 'system', label: 'SYSTEM', title: 'Follow the operating system theme' }],
      onChange: (v) => setTheme(v) });
    rt.appendChild(ui.themeSeg.root);


    ui.discSw = sw({ label: 'DISCONNECTED', value: false, title: 'Separate window headers from their bodies', onChange: (v) => setDisconnected(v) });
    rt.appendChild(ui.discSw.root);
    ui.frostSeg = seg({ label: 'FROST', value: 'always', options: [
      { id: 'off', label: 'OFF', title: 'Disable backdrop filtering' },
      { id: 'still', label: 'STILL', title: 'Apply frost while the field is paused' },
      { id: 'always', label: 'ALWAYS', title: 'Apply frost continuously. This can reduce frame rate.' }],
      onChange: (v) => setFrost(v) });
    rt.appendChild(ui.frostSeg.root);
    el('div', 'note', rt, 'Frost filters the field behind windows. STILL applies it while paused; ALWAYS keeps it during motion.');
    ui.blurK = knob({ label: 'GLASS BLUR', min: 0, max: 30, value: 22, fmt: (v) => v.toFixed(0) + ' px', title: 'the blur radius of the NOTEBOOK glass and of FROST', onInput: (v) => { document.documentElement.style.setProperty('--glass-blur', v.toFixed(1) + 'px'); }, onChange: () => saveSettings() }); rt.appendChild(ui.blurK.root);
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
    const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255), rgbToHex = (c) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')).join('');
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
    ui.cardSeg = seg({ label: 'CARD STYLE', value: 'refractive', options: [
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
    ui.accA = knob({ label: 'ACCENT A', min: 0, max: 360, value: 30, wrap: true, fmt: (v) => v.toFixed(0) + '°', title: 'the first UI accent: an angle on the current palette wheel', onInput: (v) => { accent.a = v; applyAccent(); }, onChange: () => saveSettings() }); ra.appendChild(ui.accA.root);
    ui.accB = knob({ label: 'ACCENT B', min: 0, max: 360, value: 300, wrap: true, fmt: (v) => v.toFixed(0) + '°', title: 'Set Accent B', onInput: (v) => { accent.b = v; applyAccent(); }, onChange: () => saveSettings() }); ra.appendChild(ui.accB.root);
    ui.vivid = knob({ label: 'VIVID', min: 0, max: 1, value: .5, fmt: (v) => (v * 100).toFixed(0) + '%', title: 'Increase accent chroma and glow', onInput: (v) => { accent.vivid = v; applyAccent(); }, onChange: () => saveSettings() }); ra.appendChild(ui.vivid.root);
    el('div', 'note', gt).innerHTML = '<b>Appearance.</b> Theme changes the interface and stage. Stage, gamma, accents, hue, exposure, and invert affect presentation without changing ψ. Frost may reduce frame rate while the field moves.';
    __LW_hooks.setTheme = setTheme;

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
    rd.appendChild(ui.styleSeg.root);
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
    const gp = group(wPal.body, 'COLOUR');
    palette = createPaletteEditor(gp, {
      startId: palChoice,
      setLUT(lut) { wheelLUT = lut; if (field.ok) field.setPalette(lut); applyAccent(); },
      setEnabled(v) { mat.paletteOn = v;applyAccent(); if (v) { mat.view = VIEW.phase; ui.viewSeg.set('phase'); } },
      chose(id) { palChoice = id; saveSettings(); },        // wave 54: naming one from the menu IS this browser's choice
      repaint() { schedule(TIER.PRESENT); }
    });


    const rInv = el('div', 'row tight', wPal.body);
    ui.invertSw = sw({ label: 'INVERT', value: false, title: 'Invert field colour without changing ψ', onChange: (v) => { mat.invert = v; saveSettings(); schedule(TIER.PRESENT); } });
    rInv.appendChild(ui.invertSw.root);
    const gc = group(wCam.body, 'CAMERA MOTION');
    /* WAVE 54 (board #43): the mode comes FIRST, because it decides what every dial below it turns. */
    const r4a = el('div', 'row tight', gc);
    ui.camSeg = seg({ label: 'CONTROL', value: 'free', options: [
      { id: 'turntable', label: 'TURNTABLE', title: 'Orbit with a level horizon' },
      { id: 'free', label: 'FREE', title: 'Use unrestricted camera rotation with roll' }],
      onChange: (v) => setCamMode(v) });
    r4a.appendChild(ui.camSeg.root);
    const r4 = el('div', 'row', gc);
    ui.spinSw = sw({ label: 'AUTO-ROTATE', value: false, onChange: (v) => { camera.autoRotate = v; camera.wake(); } });
    ui.spinSw.root.title = 'Rotate continuously around the world z axis';
    r4.appendChild(ui.spinSw.root);
    ui.spinK = knob({ label: 'SPIN', min: 0.02, max: 2, value: 0.25, log: true, fmt: (v) => v.toFixed(2) + ' rad/s', onInput: (v) => { camera.speed = v; camera.wake(); }, onChange: () => saveSettings() });
    ui.spinK.root.title = 'Set the auto-rotate speed';
    r4.appendChild(ui.spinK.root);
    ui.fricK = knob({ label: 'FRICTION', min: 0, max: CAM.MU_MAX, value: CAM.MU_DEF, step: CAM.MU_STEP, fmt: (v) => (v > 0 ? 'μ ' + v.toFixed(2) + ' /s' : '∞ · forever'), onInput: (v) => { camera.friction = v; camera.wake(); }, onChange: () => saveSettings() });
    ui.fricK.root.title = 'Set camera momentum decay; double-click to reset';
    r4.appendChild(ui.fricK.root);
    /* WAVE 58 (board #63): the View window's two dials, in OUR units — see the CAM block for why the range travels
       and the default does not.  Both sit with FRICTION because all three are the feel of the same hand. */
    const r4h = el('div', 'row', gc);
    ui.gainK = knob({ label: 'DRAG GAIN', min: CAM.GAIN[0], max: CAM.GAIN[1], value: CAM.GAIN_DEF, step: CAM.GAIN_STEP,
      fmt: (v) => '×' + v.toFixed(2),
      onInput: (v) => { camera.dragGain = v; }, onChange: () => saveSettings() });
    ui.gainK.root.title = 'Set drag sensitivity; Shift is finer; double-click resets';
    r4h.appendChild(ui.gainK.root);
    ui.flingK = knob({ label: 'FLING', min: CAM.FLING[0], max: CAM.FLING[1], value: CAM.FLING_DEF, step: CAM.FLING_STEP,
      fmt: (v) => '×' + v.toFixed(2),
      onInput: (v) => { camera.flingGain = v; }, onChange: () => saveSettings() });
    ui.flingK.root.title = 'Set released camera speed; double-click to reset';
    r4h.appendChild(ui.flingK.root);
    const r4b = el('div', 'row tight', gc);
    ui.zoomK = knob({ label: 'ZOOM', min: CAM.DIST[0], max: CAM.DIST[1], value: CAM.HOME.dist, log: true, fmt: (v) => '×' + v.toFixed(2), onInput: (v) => setDist(v) });
    ui.zoomK.root.title = 'Camera distance. Use the wheel or pinch on the stage.';
    r4b.appendChild(ui.zoomK.root);
    ui.fovK = knob({ label: 'FOV', min: CAM.FOV[0], max: CAM.FOV[1], value: CAM.HOME.fov, fmt: (v) => (v * 180 / Math.PI).toFixed(0) + '°', onInput: (v) => setFov(v) });
    ui.fovK.root.title = 'Vertical field of view';
    r4b.appendChild(ui.fovK.root);
    r4b.appendChild(trig({ label: 'RESET VIEW', title: 'Restore the default camera pose and motion', onFire: () => resetView() }).root);
    r4b.appendChild(trig({ label: 'SET Δρ REF', title: 'Use the current density as the difference reference', onFire: () => { setReference(); ui.viewSeg.set('diff'); mat.view = VIEW.diff; } }).root);
    el('div', 'note', gc).innerHTML = '<b>Camera.</b> Drag turns the view; Shift gives finer motion. DRAG GAIN changes sensitivity, FLING sets release speed, and FRICTION controls decay. TURNTABLE keeps the horizon level; FREE permits roll. Double-click, double-tap, or RESET VIEW restores the camera.';

    /* ── THE CAMERA AND THE RECORD BUTTONS (wave 58, board #57) ────────────────────────────────────────────────
     * lab/capture.js is 1033 lines, thirty node gates, and until this row nothing in the interface imported it.
     * Everything hard is already decided in there and NOTHING is re-decided here: the picture is a real render at
     * the requested size read straight off the GPU (never an upscale, never the canvas' image contents), the
     * recording engine is chosen by a runtime PROBE rather than by documentation, and the loop's schedule is a
     * theorem — N frames on [t0, t0 + T), the endpoint dropped because it IS frame 0.
     *   `planLoop()` DID THE THINKING, so this shows `plan.message` and lets `plan.ok` gate the button.  Two of the
     * facts it hands back must not be hidden and are the reason the readout is `wide`:
     *   · A STATE WITH NO EXACT PERIOD IS REFUSED, with its best near-recurrence and how far that misses in turns.
     *     A loop that does not close is not a loop, and recording one quietly would be the lie.
     *   · THE PERIOD DEPENDS ON THE OBSERVABLE.  ρ repeats at T_ρ, but arg ψ, Re ψ and Im ψ carry the global phase
     *     and repeat only at T_ψ = 2π/gcd{|E|} — three times longer for 1s+2s — and PHASE is the shipped view.
     *     The plan says which period it used, how many laps that is, and why.
     * THE PLAN IS NEVER COMPUTED ON A FRAME.  A bowed BOX state has 56 incommensurate energies and the scan cost
     * 1.2 s in wave 45; so it is computed on a press, on a control change and on the pointer entering this group,
     * and the readout says STALE (with the button down) when the state or the view has moved since.  A stale plan
     * is not an ok plan, which is exactly what `plan.ok` gating the button has to mean. */
    const gcap = group(wCam.body, 'CAPTURE');
    let exact = null, exactRun = null;
    const exactRenderer = () => exact || (exact = createExactRenderer(LW, { canvas: dom.canvas, energies: periodEnergies }));
    let cap = null, capBusy = false, capRun = null, capPlan = null, capKey = '';
    let capSoft = false, capWait = false;   // LA7: the plan in hand came from a hover (never handed to a caller) · a hover is waiting for the scan
    const capture = () => cap || (cap = createCapture(LW, { canvas: dom.canvas, canvasCap: 16384, energies: periodEnergies }));   // wave 58: capture reads the SAME energies periodNow() does, never the labels' ⟨H⟩
    const capKeyNow = () => `${reg.version}|${mat.view}|${ui.capFps.get()}|${ui.capSec.get()}`;
    const rc1 = el('div', 'row tight', gcap);
    ui.capScale = seg({ label: 'PICTURE', value: '2', options: [{ id: '1', label: '×1' }, { id: '2', label: '×2' }, { id: '3', label: '×3' }, { id: '4', label: '×4' }],
      onChange: () => capShowLimits() });
    ui.capScale.root.title = 'Render scale for still images';
    rc1.appendChild(ui.capScale.root);
    ui.capPic = trig({ label: 'TAKE A PICTURE', title: 'Render and save a PNG at the chosen size', onFire: () => capPicture() });
    rc1.appendChild(ui.capPic.root);
    const rc2 = el('div', 'row', gcap);
    ui.capSec = knob({ label: 'SECONDS', min: 1, max: 30, value: 6, step: 0.5, fmt: (v) => v.toFixed(1) + ' s', onInput: () => capStale() });
    ui.capSec.root.title = 'Duration for free recording and loop frame planning';
    rc2.appendChild(ui.capSec.root);
    ui.capFps = seg({ label: 'FPS', value: '30', options: [{ id: '15', label: '15' }, { id: '30', label: '30' }, { id: '60', label: '60' }], onChange: () => capStale() });
    rc2.appendChild(ui.capFps.root);
    ui.capRec = trig({ label: 'RECORD', title: 'Record using browser frame timing', onFire: () => capRecord() });
    rc2.appendChild(ui.capRec.root);
    ui.capLoop = trig({ label: 'ONE PERIOD', title: 'Record one usable recurrence period', onFire: () => capRecordLoop() });
    rc2.appendChild(ui.capLoop.root);
    ui.capPlanT = trig({ label: 'PLAN', title: 'Find a recurrence for the current state and observable', onFire: () => capMakePlan(true) });
    rc2.appendChild(ui.capPlanT.root);
    const rx = el('div', 'row tight', gcap);
    ui.capExact = trig({ label: 'EXPORT FRAMES', title: 'Export deterministic PNG frames and a manifest as ZIP', onFire: () => capExportFrames() });
    rx.appendChild(ui.capExact.root);
    ui.capExactRo = readout({ label: 'FRAME EXPORT', cls: 'wide', value: '—', sub: 'At least 30 seconds · PNG sequence + manifest · modulation starts at beat zero' });
    gcap.appendChild(ui.capExactRo.root);
    const rc3 = el('div', 'row tight', gcap);
    ui.capShot = readout({ label: 'PICTURE', value: '—', sub: '' });
    ui.capPlanRo = readout({ label: 'THE LOOP PLAN', cls: 'wide', value: '—', sub: '' });
    rc3.appendChild(ui.capShot.root); rc3.appendChild(ui.capPlanRo.root);
    el('div', 'note', gcap).innerHTML = '<b>Capture.</b> Pictures render at the chosen size. RECORD follows browser timing. ONE PERIOD is available when the current observable has a usable recurrence; EXPORT FRAMES writes deterministic PNG frames and a manifest.';

    /* the ceiling is READ, never asserted — and read WITHOUT forcing the capture object into existence, because
       this runs while the window is being built and `LW` does not exist yet (a const in its own temporal dead zone) */
    const capLimits = () => { try { return capture().limits(); } catch (_) { return maxPictureSize(field && field.ok ? field.device.limits : null, 16384); } };
    function capShowLimits() {
      const L = capLimits(), scale = +ui.capScale.get(), w = Math.round(dom.canvas.width * scale), h = Math.round(dom.canvas.height * scale);
      const over = Math.max(w, h) > L.side;
      ui.capShot.set(over ? `${w} × ${h} → clipped to ${L.side}` : `${w} × ${h}`, over ? 'warn' : '');
      ui.capShot.setSub(`ceiling ${L.side} on a side (${L.why}) · ${L.note}`);
    }
    function capStale() { if (capPlan && capKey !== capKeyNow()) capPaint(); }
    function capMakePlan(force) {
      if (!force && capPlan && capKey === capKeyNow() && !capSoft) return capPlan;
      capWait = false; capSoft = false;
      try { capPlan = capture().planLoop({ fps: +ui.capFps.get(), seconds: ui.capSec.get() }); capKey = capKeyNow(); }
      catch (e) { capPlan = { ok: false, label: 'ERROR', message: String(e && e.message || e) }; capKey = capKeyNow(); }
      capPaint(); return capPlan;
    }
    /* LA7 · THE HOVER ASKS, IT DOES NOT FORCE.  Wave 58's hover plan ran the FORCED period read — one or two synchronous
       2·10⁶-step scans on an incommensurate state (0.36 s on the BOX, 0.76 s in its phase view, 1.3 s under STURMIAN)
       every time the pointer crossed this group (AUDIT-F F2).  The hover now takes the frame path's answer: fresh, the
       exact half, or posted to the scan worker — and while it runs the readout says so and ONE PERIOD stays down; the
       landing re-plans.  The plan it paints is the PLAN button's: the same density period (bit-identical in the worker)
       and the same W, because W is used only when T_ψ is EXACT, and the exact half of T_ψ is microseconds.  The one
       field it leaves unset is T_ψ's near-recurrence (Twave), which nothing reads; so a hover's plan is painted and never
       handed to a caller (capSoft).  ⟳, G, PLAN, LW.period and LW.capturePlan stay forced. */
    const capWaveExact = () => {
      if (!viewCarriesGlobalPhase(mat.view | 0)) return null;
      const E = periodEnergies(); return E && E.length ? densityPeriodExact([0].concat(Array.from(E))) : null;
    };
    function capHover() {
      if (capPlan && capKey === capKeyNow() && !capWait) return;
      const soon = __LW_hooks.periodSoon ? __LW_hooks.periodSoon() : null;
      if (!soon) { capMakePlan(false); return; }
      if (soon.settling) { if (!capWait) { capWait = true; capPaint(); } return; }
      capWait = false; capSoft = true;
      try { capPlan = capture().planLoop({ fps: +ui.capFps.get(), seconds: ui.capSec.get(), period: soon.period, wave: capWaveExact() }); capKey = capKeyNow(); }
      catch (e) { capPlan = { ok: false, label: 'ERROR', message: String(e && e.message || e) }; capKey = capKeyNow(); }
      capPaint();
    }
    __LW_hooks.onPeriodLand = () => { if (capWait) capHover(); };
    function capPaint() {
      const P = capPlan, stale = P && capKey !== capKeyNow();
      if (capWait) { ui.capPlanRo.set('…', ''); ui.capPlanRo.setSub('settling — the recurrence scan runs off the frame; the plan appears when it lands'); ui.capLoop.root.disabled = true; return; }
      if (!P) { ui.capPlanRo.set('—', ''); ui.capPlanRo.setSub('press PLAN (or hover this group) and period.js will say what closes here, for the observable in force'); ui.capLoop.root.disabled = true; return; }
      ui.capPlanRo.set(stale ? P.label + ' · STALE' : P.label + (P.undersampled ? ' · UNDERSAMPLED' : ''), stale ? 'warn' : P.undersampled ? 'warn' : P.ok ? 'ok' : 'warn');
      ui.capPlanRo.setSub((stale ? 'THE STATE OR THE VIEW HAS MOVED since this plan was made — press PLAN. · ' : '')
        + P.message + (P.usedPeriod ? ` · period used: ${P.usedPeriod} (${P.laps} lap${P.laps === 1 ? '' : 's'} of T_ρ)` : ''));
      ui.capLoop.root.disabled = capBusy || stale || !P.ok;
    }
    async function capPicture() {
      if (capBusy) return; capBusy = true; ui.capPic.root.disabled = true;
      ui.capShot.set('rendering…', 'live');
      try {
        const r = await capture().picture({ scale: +ui.capScale.get() });
        if (!r || r.ok === false) { ui.capShot.set('refused', 'warn'); ui.capShot.setSub(String(r && r.error || 'no result')); }
        else { capture().save(r); ui.capShot.set(`${r.w} × ${r.h} · ${(r.bytes / 1024).toFixed(0)} kB`, 'ok');
          ui.capShot.setSub(`${r.name} · ${r.ms.toFixed(0)} ms${r.clipped ? ' · CLIPPED to the device ceiling' : ''} · the clock and the jitter seed are back where they were`); }
      } catch (e) { ui.capShot.set('error', 'warn'); ui.capShot.setSub(String(e && e.message || e)); }
      capBusy = false; ui.capPic.root.disabled = false; capPaint();
    }
    function capBadge(kind, r) {
      if (!r || r.ok === false) { ui.capPlanRo.set('refused', 'warn'); ui.capPlanRo.setSub(String(r && r.error || 'no result')); return; }
      ui.capPlanRo.set(`${kind} · ${r.frames} frames · ${(r.bytes / 1024).toFixed(0)} kB`, 'ok');
      const M = r.measured || {};
      ui.capPlanRo.setSub(`${r.name} · ${r.w} × ${r.h} · measured ${M.fps ? M.fps.toFixed(1) : '?'} fps against ${r.fps} asked (worst interval off by ${M.worstIntervalErrMs ? M.worstIntervalErrMs.toFixed(1) : '?'} ms) · engine ${r.engine || '?'} — the CONTENT is exact, the tempo is what the wall gave and is MEASURED, never claimed`);
    }
    async function capRecord() {
      if (capRun) { capRun.stop(); return; }
      if (capBusy) return; capBusy = true; ui.capRec.setLabel('STOP'); ui.capRec.on = true; capPaint();
      try { capRun = capture().record({ fps: +ui.capFps.get(), seconds: ui.capSec.get() });
        const r = await capRun.done; capBadge('CLIP', r); if (r && r.blob) capture().save(r);
      } catch (e) { ui.capPlanRo.set('error', 'warn'); ui.capPlanRo.setSub(String(e && e.message || e)); }
      capRun = null; capBusy = false; ui.capRec.setLabel('RECORD'); ui.capRec.on = false; capPaint();
    }
    async function capRecordLoop() {
      if (capBusy || capRun) return;
      const P = capMakePlan(true);
      if (!P.ok) return;                                       // the readout already carries plan.message: the refusal IS the answer
      capBusy = true; ui.capLoop.on = true; capPaint();
      try { const run = capture().recordLoop({ fps: +ui.capFps.get(), seconds: ui.capSec.get() });
        const r = await run.done; capBadge(P.kind === 'exact' ? 'PERIOD LOOP' : 'NEAR', r); if (r && r.blob) capture().save(r);
      } catch (e) { ui.capPlanRo.set('error', 'warn'); ui.capPlanRo.setSub(String(e && e.message || e)); }
      capBusy = false; ui.capLoop.on = false; capPaint();
    }
    async function capExportFrames(options = {}) {
      if (exactRun) { exactRun.stop(); return; }
      if (capBusy) return;
      const ex = exactRenderer();
      const driven = modArm;
      if (driven && modHost.model.sourceList().some(s => s.on && s.kind === 'audio')) {
        const result = {ok:false, message:'Live microphone input cannot be replayed deterministically. Bypass the AUDIO device before exporting.'};
        ui.capExactRo.set('refused', 'warn'); ui.capExactRo.setSub(result.message); return result;
      }
      const seconds = Math.max(30, ui.capSec.get());
      const settings = { fps: +ui.capFps.get(), seconds, t0:0, scale:+ui.capScale.get(), camera:'still', modulation:driven ? 'drive' : 'freeze', zip:true, ...options };
      let plan = ex.plan(settings);
      if (driven || rotDriving() || !plan.ok || plan.N < seconds * settings.fps) {
        settings.mode = 'span'; settings.span = seconds * Math.max(.1, clock.rate);
        plan = ex.plan(settings);
      }
      if (!plan.ok) { ui.capExactRo.set('refused', 'warn'); ui.capExactRo.setSub(plan.message); return plan; }
      if (driven) modHost.clock.applyAll(false);
      const stateBefore = reg.serialize(clock.t), materialBefore = structuredClone(mat), observerBefore = {...obs};
      const ratesBefore = {...rotRate};
      capBusy = true; ui.capExact.setLabel('STOP EXPORT'); ui.capExact.on = true; capPaint();
      try {
        exportLocked = true;
        if (rafId) cancelAnimationFrame(rafId); rafId = 0; stats.scheduled = false;
        exactRun = ex.render({ ...settings, beforeFrame: ({dt}) => rotStep(dt), onProgress(p) {
          ui.capExactRo.set(`${p.done} / ${p.total} frames`, 'live');
          ui.capExactRo.setSub(p.human || 'Rendering the scheduled frame times');
        } });
        const result = await exactRun.done;
        ui.capExactRo.set(result.ok ? 'exported' : result.stopped ? 'stopped' : 'refused', result.ok ? 'ok' : 'warn');
        ui.capExactRo.setSub(result.message || result.error || 'Export finished');
        if (result.ok && result.blob && options.download !== false) ex.save(result);
        return result;
      } catch (e) {
        ui.capExactRo.set('error', 'warn'); ui.capExactRo.setSub(String(e.message || e));
        return { ok: false, error: String(e.message || e) };
      } finally {
        reg.restore(stateBefore); Object.assign(mat, materialBefore); Object.assign(obs, observerBefore); Object.assign(rotRate, ratesBefore);
        exportLocked = false; modWall = 0; lastWall = performance.now() / 1000;
        schedule(TIER.RECONSTRUCT); exactRun = null; capBusy = false;
        ui.capExact.setLabel('EXPORT FRAMES'); ui.capExact.on = false; capPaint();
      }
    }
    gcap.addEventListener('pointerenter', () => { if (!capBusy) capHover(); });
    capShowLimits(); capPaint();
    capApi = { exportFrames: capExportFrames, get exact() { return exactRenderer(); }, get capture() { return capture(); }, plan: (force = true) => capMakePlan(force), picture: capPicture, record: capRecord, loop: capRecordLoop, limits: capLimits, get busy() { return capBusy || !!capRun; } };
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
    el('div', 'note', gq).innerHTML = '<b>Performance.</b> AUTO SCALE lowers canvas resolution when frames exceed the budget. GOVERNOR can also pause expensive readers and retries them periodically. KEEP FRAMES updates the playhead every frame and may cost performance.';
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
    ui.presetSel.addEventListener('change', () => loadPreset(ui.presetSel.value));
    ui.presetSel.style.flex = '1 1 160px';


    r1.appendChild(trig({ label: 'RELOAD', title: 'Reload the selected preset and reset time', onFire: () => loadPreset(ui.presetSel.value) }).root);
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
  {
    const hamGroup = group(wSpec.body, 'HAMILTONIAN');
    const rh = el('div', 'row tight', hamGroup);
    ui.hamSeg = seg({ label: 'OPERATOR', value: 'hydrogen', options: [
      { id: 'hydrogen', label: 'HYDROGEN', title: 'E = −1/(2n²); every window is a theorem about it' },
      { id: 'qho', label: 'OSCILLATOR', title: 'Harmonic oscillator levels with spacing ħω' },
      { id: 'well', label: 'BOX', title: 'Infinite spherical well with a hard boundary' },
      { id: 'atom', label: 'ATOM', title: 'Self-consistent Xα central-field atom from H to Kr' },
      { id: 'cornell', label: 'QUARKONIUM', title: 'Solve heavy-quark levels with Numerov' }],
      onChange: (v) => { switchHamiltonian(v); if (v === 'well') enterBox(); } });
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
  function switchHamiltonian(id) {
    if (!warmTimer && !warmIdle && !page.hidden) warmArm(120);       // LA5: the kick tables are keyed on the operator — warm the new one in idle slices
    const H = setHamiltonian(id);
    if (id !== 'well' && gas.on) { gas.off(); schedule(TIER.RECONSTRUCT); }
    reg.setEnergies(energyOf);
    if (!H.stark && reg.field.Fz !== 0) { reg.setField({ Fz: 0 }); if (ui.fz) ui.fz.set(0); }
    if (H.noMomentum && space === 'p') { space = 'x'; if (ui.spaceSeg) ui.spaceSeg.set('x'); }
    for (const w of [wOrb, wVor, wDyn, wSlice, wLad]) if (w) w.root.hidden = !H.hydrogenTheorems;
    if (ui.fldWin) { const hy = H.id === 'hydrogen'; ui.fldWin.setStatus(hy ? 'exact · closed form · reads c(t)' : 'hydrogenic register only', hy ? '' : 'warn'); if (!hy) { for (const r of [ui.fldQ, ui.fldPhi, ui.fldE, ui.fldB]) if (r) r.set('—', 'warn'); } }
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
    if (!(helium && helium.on)) { for (const w of [wOrb, wVor, wDyn, wSlice, wLad]) if (w) w.root.hidden = on || !H.hydrogenTheorems; if (wCalc) wCalc.root.hidden = on; }   // theorems about hydrogen's eigenfunctions stand down
    if (ui.fldWin) { const hy = H.id === 'hydrogen' && !on; ui.fldWin.setStatus(hy ? 'exact · closed form · reads c(t)' : on ? 'hydrogen only: no closed-form field for the scaled radials' : 'hydrogenic register only', hy ? '' : 'warn'); if (!hy) { for (const r of [ui.fldQ, ui.fldPhi, ui.fldE, ui.fldB]) if (r) r.set('—', 'warn'); } }
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

  // VORTEX — the nodal lines (print, Thread C)
  const wVor = device({ id: 'vortex', eyebrow: 'VORTEX', status: '' });
  rack.appendChild(wVor.root);
  const vortex = createVortex(wVor.body, dom.vortex, { reg, clock, scrubTo: (t) => { clock.scrub(t); schedule(TIER.EVOLVE); } });

  // DYNAMICS — the Lagrangian picture, the action–angle chart, the dipole, and the particle view
  const particles = createParticles(dom.particles, {});
  /* FLOW (MOLECULAR WAVES stage 6): the SAME tracer view on its own canvas, riding a molecule's current v = j/ρ —
     the STATES register hands it a source (lab/molecular-flow.js) whose matrices it rebuilds once a frame */
  const flowTracers = dom.flow ? createParticles(dom.flow, { ink: () => (document.body.dataset.theme === 'light' ? { trail: 'rgba(16,36,84,0.42)', dot: 'rgba(10,22,56,0.92)', text: 'rgba(20,30,50,0.6)' } : { trail: 'rgba(190,230,255,0.4)', dot: 'rgba(235,248,255,0.95)', text: 'rgba(255,255,255,0.5)' }),
    caption: (st) => `FLOW · ${st.alive}/${st.count} tracers on v = j/ρ of the TD-CIS density matrix · sense exact, magnitude qualitative in STO-3G` }) : null;
  let flowEpoch = null;                                                // the SOURCE the tracers were seeded from: a new source is a new ensemble
  const wDyn = device({ id: 'dynamics', eyebrow: 'DYNAMICS', status: '' });
  rack.appendChild(wDyn.root);
  const dynamics = createDynamics(wDyn.body, {
    particles,
    seedParticles(n) { particles.seed(n, reg, clock.t, domain.half); },
    repaint() { schedule(TIER.PRESENT); }
  });

  // SLICE — a rotatable complex plane through ψ (the 4D engine's rotor pair, carrying hydrogen's own 4-space)
  const wSlice = device({ id: 'slice', eyebrow: 'SLICE', status: '' });
  const slice = createSliceView(wSlice.body, {
    lut: () => (palette && palette.on ? toLUT(palette.stops) : null),
    repaint() { schedule(TIER.PRESENT); }
  });
  /* OPTIMIZATION 2026-09-24 · M6(b): appended AFTER its view is built (still before QCD, so the rack order and
     LW.bootOrder are unchanged).  Appended first, the plane model's construction-time paint read `cv.clientWidth` on a
     half-built rack and forced its first full style + layout (28.6 ms); disconnected, the read answers 0 without a
     flush, and the plane model's own ResizeObserver paints it once it is laid out. */
  rack.appendChild(wSlice.root);

  // QCD — the confining side: quarkonium under a chosen potential, the flavour-independence verdict, the string
  const wQCD = device({ id: 'qcd', eyebrow: 'QCD', status: '' });
  rack.appendChild(wQCD.root);
  const qcd = createQCD(wQCD.body, { repaint() { schedule(TIER.PRESENT); }, onParams(kind, pot, p) { if (HAMILTONIANS.cornell.configure(kind, p, pot) && getHamiltonian().id === 'cornell') switchHamiltonian('cornell'); } });

  // MOLECULE — H₂⁺ in the 1s LCAO basis: the field is handed to two protons and one electron
  const wMol = device({ id: 'molecule', eyebrow: 'H₂⁺ · LEGACY', status: '' });
  if (useCompactDefaults) wMol.root.classList.add('closed');   // do not paint the 200-point energy plot behind first-visit furniture
  // Retain its stable id, model and save record for old H₂⁺ projects. The newer
  // molecular instrument is the visible MOLECULES card; an active legacy project
  // reveals this card so its field owner still has a reachable OFF switch.
  wMol.root.hidden = true;
  rack.appendChild(wMol.root);
  let moPanel = null, pulsePanel = null;                               // W-MO: the general basis block, and W-PULSE below it
  let chem = null;                                                     // wave CHEMISTRY: the fifth field owner, assigned below
  let restampParams = null;                                            // re-tag knobs as modulation targets: lanes built after boot call it (the REGISTER's phase needles)
  let molSession = null;                                               // the one owner of the molecular volume, assigned beside CHEMISTRY below (the frame loop reads it)
  let orbitals = null, states = null, register = null;                 // REGISTER: the window (register) and its two modes, assigned beside CHEMISTRY below
  const molecule = createMolecule(wMol.body, { repaint(rebuild) { schedule(rebuild ? TIER.REBUILD : TIER.PRESENT); }, setOn(v) { if (v) { wMol.root.hidden = false; wMol.root.classList.remove('closed'); if (chem && chem.on) chem.setOn(false); } moleculeMode(v); },
    onR(v, sync) { if (moPanel) moPanel.setR(v, sync); } });           // one R for both blocks: the knob and the API move the force line too
  moPanel = createMOPanel(wMol.body, { repaint(rebuild) { schedule(rebuild ? TIER.REBUILD : TIER.PRESENT); }, active: () => canPresent(wMol), loading: cardLoading(wMol, 'basis') });


  pulsePanel = createPulse(wMol.body, { now: () => clock.t });
  function moleculeMode(v) {
    for (const w of [wState, wSpec, wSh, wOrb, wVor, wDyn, wSlice, wLad, wCalc]) if (w) w.root.hidden = !!v;   // CALCULUS reads the atomic register: it stands down too (Round 11 §10b)
    if (v && space === 'p') { space = 'x'; if (ui.spaceSeg) ui.spaceSeg.set('x'); }
    if (!v) switchHamiltonian(getHamiltonian().id);                  // restore the atom's own hiding rules
    refSnapshot = null; pendingRef = null;
    schedule(TIER.REBUILD);
  }

  // HELIUM — two electrons, Hylleraas: the field becomes the conditional cloud of electron 2
  const wHe = device({ id: 'helium', eyebrow: 'HELIUM', status: '' });
  if (useCompactDefaults) wHe.root.classList.add('closed');     // defer the ~77 ms variational solve until this card is first shown
  rack.appendChild(wHe.root);
  const helium = createHelium(wHe.body, { active: () => canPresent(wHe), loading: cardLoading(wHe, 'helium'), solve: (basis) => solveCard({ op: 'helium', basis }, () => hylleraas(HELIUM_BASES[basis]), (r) => r.sol), repaint(rebuild) { schedule(rebuild ? TIER.REBUILD : TIER.PRESENT); }, setOn(v) { if (v) { if (molecule.on) molecule.setOn(false); if (chem && chem.on) chem.setOn(false); } moleculeMode(v); } });

  // H₂ — two atoms, Heitler–London: the curves, the collision, the one-electron density
  const wH2 = device({ id: 'h2', eyebrow: '<m>H₂</m>', status: '' });
  if (useCompactDefaults) wH2.root.classList.add('closed');    // avoid the 221-point RHF/FCI plot until the user opens it
  rack.appendChild(wH2.root);
  const h2 = createH2(wH2.body, { active: () => canPresent(wH2), loading: cardLoading(wH2, 'curve'), solveCurve: (Rmin, Rmax, count) => solveCard({ op: 'h2curve', Rmin, Rmax, count }, () => h2CurveTable(Rmin, Rmax, count)), repaint(rebuild) { schedule(rebuild ? TIER.REBUILD : TIER.PRESENT); }, setOn(v) { if (v) { if (molecule.on) molecule.setOn(false); if (helium.on) helium.setOn(false); if (chem && chem.on) chem.setOn(false); } moleculeMode(v); }, now: () => clock.t });

  /* CHEMISTRY — eight molecules, RHF and the real-time δ-kick: the field becomes an AO density matrix.
     It is a FIELD OWNER like MOLECULE, HELIUM and H₂, so it goes through the same moleculeMode() policy. */
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
  if (useCompactDefaults) wChem.root.classList.add('closed');   // a first visit must not pay for a 7-AO solve behind furniture
  rack.appendChild(wChem.root);
  chem = createChem(wChem.body, { active: () => canPresent(wChem), loading: cardLoading(wChem, 'chem'),
    solve: (msg, fallback, pluck) => solveChem(msg, fallback, pluck),
    repaint(rebuild) { schedule(rebuild ? TIER.REBUILD : TIER.PRESENT); },
    status(t, cls) { wChem.setStatus(t, cls); },
    setOn(v) { if (v) { if (molecule.on) molecule.setOn(false); if (helium.on) helium.setOn(false); if (h2.on) h2.setOn(false); } moleculeMode(v); },
    /* the card does not touch the field: it hands `ground` and `tdhf` products to the session, which decides which
       model is playing and which observable the field shows.  See molecular-session.js. */
    session: molSession,
    now: () => clock.t });

  /* ORBITALS — the MOLECULAR REGISTER: ψ(r, t) = Σ_k c_k e^{−iε_k t} φ_k over CHEMISTRY's canonical orbitals, which
     is where a molecule's `arg` lives (MATH-H2O-2026-09-11, Proposition 1).  It is NOT a sixth field owner: it does
     not upload a molecule and it does not touch moleculeMode() — CHEMISTRY owns the shells and this window owns the
     matrix while REGISTER ON is up, so it stays visible and usable exactly when CHEMISTRY is on. */
  const wOrbs = device({ id: 'orbitals', eyebrow: 'MO-REGISTRY', title: 'molecular orbital registry', status: '' });   // the id stays `orbitals` so saved layouts survive the rename (REGISTER-WINDOW-SPEC §11.1)
  if (useCompactDefaults) wOrbs.root.classList.add('closed');   // the same rule CHEMISTRY keeps: no solve behind furniture
  rack.appendChild(wOrbs.root);
  register = createRegister(wOrbs.body, { active: () => canPresent(wOrbs),
    stamp: () => { if (restampParams) requestAnimationFrame(restampParams); },   // a lane built after boot becomes a drop target for a macro
    solve: (msg, fallback, pluck) => solveChem(msg, fallback, pluck),   // the STATES mode asks the chem worker for its canonical ladder and vectors
    repaint(rebuild) { schedule(rebuild ? TIER.REBUILD : TIER.PRESENT); },
    status(t, cls) { wOrbs.setStatus(t, cls); },
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
    const rp = wMet.row('tight');
    ui.perfSeg = seg({ label: 'PERFORMANCE', value: '120', options: [
      { id: 'full', label: 'FULL', title: 'Update visible readers every frame' },
      { id: '120', label: '120 Hz', title: 'Update visible CPU readers every fourth frame' }],
      onChange: (v) => { setPerfMode(v); saveSettings(); } });
    rp.appendChild(ui.perfSeg.root);
    ui.govRo = readout({ label: 'GOVERNOR  state · median · grid', value: 'nominal', cls: 'wide', sub: 'budget 28 ms over the last 60 frames' }); rp.appendChild(ui.govRo.root);
  el('div', 'note', wMet.body).innerHTML = '<b>Frame profile.</b> Times are moving averages measured in this browser. 120 Hz mode updates visible CPU readers every fourth frame while the field continues to present each frame.';
  }
  // LADDER — the Rydberg revival as a spectral instrument (print, Thread A); its own register, no field
  const wLad = device({ id: 'ladder', eyebrow: 'LADDER', status: '' });
  if (useCompactDefaults) wLad.root.classList.add('closed');
  rack.appendChild(wLad.root);
  const ladder = createLadder(wLad.body, { active: () => canPresent(wLad), loading: cardLoading(wLad, 'revival'), solve: (params) => solveCard({ op: 'ladder', params }, () => solveLadder(params)) });
  /* Shift multi-add reopens several cards in one gesture. Each explicit request enters the card worker queue even
     if later cards land below the rack clip; the single worker keeps those solves from competing with the field. */
  wMol.root.addEventListener('devopen', () => { if (moPanel) moPanel.whenReady(); });
  wHe.root.addEventListener('devopen', () => helium.prepare());
  wH2.root.addEventListener('devopen', () => h2.prepare());
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
   * `lab/modwindow.js` and shown by the transport pill's ⤢, exactly as wave 55 already opened it
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
    const defs = [
      { id: 'observer.yaw', label: 'YAW', unit: ' rad', map: 'wrap', min: 0, max: 2 * Math.PI, group: 'observer',
        hint: 'the camera azimuth — free-spinning, because an orbit that reaches the end of the dial and stops is not an orbit',
        get: () => obs.yaw, set: (v) => { if (sameCycle(v, obs.yaw, 2 * Math.PI)) return; if (obs.mode === 'free') orbitBy(v - obs.yaw, 0); else obs.yaw = v; schedule(TIER.PRESENT); } },
      { id: 'observer.pitch', label: 'PITCH', unit: ' rad', map: 'bipolar', min: -CAM.PITCH, max: CAM.PITCH, def: 0, group: 'observer',
        hint: 'Pitch balance; 50% is level',
        get: () => obs.pitch, set: (v) => { const w = Math.max(-CAM.PITCH, Math.min(CAM.PITCH, v)); if (w === obs.pitch) return; if (obs.mode === 'free') orbitBy(0, w - obs.pitch); else obs.pitch = w; schedule(TIER.PRESENT); } },
      { id: 'observer.dist', label: 'ZOOM', map: 'log', min: CAM.DIST[0], max: CAM.DIST[1], group: 'observer', knob: () => ui.zoomK,
        hint: 'the ZOOM dial itself — log, because the interesting half of a zoom is always the near half',
        get: () => obs.dist, set: (v) => { obs.dist = Math.max(CAM.DIST[0], Math.min(CAM.DIST[1], v)); setKnob(ui.zoomK, obs.dist); schedule(TIER.PRESENT); } },
      { id: 'observer.fov', label: 'FOV', map: 'linear', min: CAM.FOV[0], max: CAM.FOV[1], group: 'observer', knob: () => ui.fovK,
        get: () => obs.fov, set: (v) => { obs.fov = Math.max(CAM.FOV[0], Math.min(CAM.FOV[1], v)); setKnob(ui.fovK, obs.fov); schedule(TIER.PRESENT); } },
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


      { id: 'material.slice.pos', label: 'SLICE POS', map: 'bipolar', min: -1, max: 1, def: 0, group: 'material', knob: () => ui.slicePosK,
        hint: 'Set the clip or slab position',
        get: () => mat.slice.pos, set: (v) => { mat.slice.pos = v; setKnob(ui.slicePosK, v); schedule(TIER.PRESENT); } },
      { id: 'material.slice.thick', label: 'SLICE THICK', map: 'log', min: 0.01, max: 0.4, group: 'material', knob: () => ui.sliceThickK,
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
    modAdapters = defs; knobIdCache = null;
    modHost = createModHost({
      available: () => field.ok,                          /* BASINS’s flowActive: is the reader live */
      present: () => schedule(TIER.PRESENT),               /* EDGE 4 — and never a tier above it */
      presentationActive: false,                           /* a closed editor has no preview demand */
      /* THE SIXTH ROOT, through mir/registry's own documented extension point rather than by editing the
         vendored module: CHEMISTRY's two targets are `chem.kick` and `chem.speed`, and an id's root is what
         a saved route is addressed by — so it names the instrument, not the nearest existing group. */
      roots: ['observer', 'material', 'state', 'transport', 'field', 'chem', 'reg'],
    });
    modHost.install(defs.map(({ knob: _k, ...d }) => d));
    for (const d of defs) { if (d.knob) modKnobs[d.id] = d.knob; modGets[d.id] = d.get; }
    /* ── WAVE 61 · THE ONE LINE THE ROUTER NEEDED: DOM → id ───────────────────────────────────────
     * The lab has always had id → DOM (`modKnobs[id]`, lazily).  A DROP has the other question — the
     * finger is at (x, y), what is under it — and `elementFromPoint` answers with an element, not an
     * id.  So every dial that has one is STAMPED with its parameter id, and the drop hit-test is
     * `el.closest('.k[data-param]')`.  It is deferred one frame because the `ui.*` handles the
     * accessors close over do not exist while the defs list is being written.
     * ELEVEN TARGETS, NINE STAMPS: `observer.yaw` and `observer.pitch` carry no knob accessor at all
     * (the camera is dragged, not dialled), so they stay reachable through the modulation window's
     * own picker and are NOT drop targets.  The gesture is exactly as large as the registry's knobs
     * and no larger, and saying so here is cheaper than having it discovered. */
    /* WAVE 68 · AND THE SAME LOOP HANDS EACH DIAL ITS BASE.  kit.js's knob() cannot know what is
       driving it, and a focused dial under a running LFO used to leave the string from the moment
       focus ARRIVED in `aria-valuetext` — 9.3× off the instrument, measured.  `setBase(fn)` is the
       whole wire: while a parameter is modulated the dial announces its REGISTRY BASE and says the
       word, which is the number the user's own hand owns (modHand: on a routed parameter `write` IS
       `setBase`), so the announcement is true, it is not a claim about the moving value, and it
       changes only when the user changes it — the mutation count stays at zero. */
    const stampParams = () => { for (const d of defs) { const k = d.knob && d.knob(); if (!k || !k.root) continue; k.root.dataset.param = d.id;
      if (k.setBase) k.setBase(() => { const R = modHost && modHost.registry; return R && R.has(d.id) && R.isModulated(d.id) ? R.baseOf(d.id) : null; }); } };
    requestAnimationFrame(stampParams); restampParams = stampParams;
    /* A DIAL WHOSE PARAMETER A MODULATOR IS HOLDING WEARS ACCENT B, wherever in the rack it lives —
       and it keeps wearing it with this window closed, which is the boundary law made visible. */
    modHost.registry.subscribe('*', (ev) => {
      const held = !!ev.modulated;
      if (held === modHeld.has(ev.id)) return;
      if (held) modHeld.add(ev.id); else modHeld.delete(ev.id);
      const k = modKnobs[ev.id] && modKnobs[ev.id]();
      if (k && k.root) k.root.classList.toggle('mod-held', held);
    });
    /* THE FOUR EDGES, HANDED TO THE PORTED WINDOW.  Registry · target host · clock ·
       presentation — the four `lab/mir/modulation/host.js` has provided since the MIR wave, and the four
       `host-contract.md` PART 3 says this window boots on and nothing else. */


    let trSeat = 'bottom', trMoving = false;
    function seatRect(where, w, h) {
      const vw = window.innerWidth, vh = window.innerHeight;
      const narrowRack = matchMedia('(max-width: 860px)').matches;
      const top = where === 'top' ? (narrowRack ? 112 : 52) : vh - 60 - h;
      const left = narrowRack ? vw - w - 10 : (vw - w) / 2;
      return { left, right: left + w, top, bottom: top + h };
    }
    const hits = (a, b) => !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
    function modDodge(r) {
      occludeDirty = true;
      schedule(TIER.PRESENT);   // a paused field still has to move its line masks with the window
      const t = document.getElementById('transport');
      if (!t || !t.classList.contains('mini')) return;
      if (trMoving) { if (r.right < 0) setTimeout(() => modDodge(r), 320); return; }
      if (document.body.classList.contains('rack-hidden')) return;   // it is already parked off-screen
      const box = t.getBoundingClientRect();
      const w = box.width || 560, h = box.height || 34;
      const narrowRack = matchMedia('(max-width: 860px)').matches;
      if (narrowRack) trSeat = 'top';
      const want = narrowRack ? 'top'
                 : !hits(seatRect('bottom', w, h), r) ? 'bottom'
                 : !hits(seatRect('top', w, h), r) ? 'top' : trSeat;
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

    modView = createModulation(document.getElementById('floats') || document.getElementById('lab'), {
      moved: modDodge,
      opened: () => modHost.clock.setPresentationActive(true),
      closed: () => { modHost.clock.setPresentationActive(false); modDodge({ left: -1, right: -1, top: -1, bottom: -1 }); },
      rateControl: () => knob({ label: 'RATE', min: 0.1, max: 3000, value: clock.rate, log: true, fmt: (v) => v.toFixed(2), onInput: (v) => { if (!modHand('transport.rate', v)) { clock.setRate(v); ui.rateKnob.set(v); } } }),
      M: modHost.model, registry: modHost.registry, targets: modHost.targets, clock: modHost.clock,
      apply: () => { modHost.clock.applyAll(false); schedule(TIER.PRESENT); },
      cadence: () => MOD.hz, setCadence: (hz) => { MOD.hz = hz === 120 ? 120 : 60; saveSettings(); return MOD.hz; },
      /* WAVE 65 · THE ARM'S OTHER DOOR.  The window's own play button is the modulation playhead and
         keeps its own meaning, but pressing PLAY on a disarmed rack should not be a control that does
         nothing — so the window asks the host to arm, and the MOD lamp on the transport lights.  It is
         the host that owns the flag, the glow and the persistence; the window only asks. */
      armed: () => modArm, arm: (on) => setModArm(!!on),
      /* the router's road back to the real control: it draws the arc into `k.root` and restores the
         dial's own value text with `k.paint()` when the depth drag lets go */
      knobOf: (id) => (modKnobs[id] ? modKnobs[id]() : null),
      /* WAVE 102 · THE FIFTH EDGE.  The window asks for the microphone and reads its state; it does
         not own the stream, exactly as it does not own the clock.  `audioDevice` is remembered in
         this browser's settings so a returning user is not asked to pick an input again — a device
         HANDLE, never audio (lab/audio.js's header says why that distinction matters). */
      audio: {
        state: () => (audioCap ? { state: audioCap.state, reason: audioCap.reason, live: audioCap.live,
                                   deviceId: audioCap.deviceId, sampleRate: audioCap.sampleRate,
                                   frames: audioCap.frames, inputLatencyMs: audioCap.inputLatencyMs,
                                   analysisLatencyMs: audioCap.analysisLatencyMs, visualLatencyMs: audioCap.visualLatencyMs,
                                   latencyMs: audioCap.latencyMs, latencyEstimated: audioCap.latencyEstimated }
                               : { state: AUDIO_STATE.IDLE, reason: '', live: false, deviceId: '', sampleRate: 0, frames: 0,
                                   inputLatencyMs: null, analysisLatencyMs: 0, visualLatencyMs: 0,
                                   latencyMs: 0, latencyEstimated: true }),
        support: () => audioCapture().support(),
        start: (id) => audioCapture().start(id === undefined ? (readSettings().audioDevice || '') : id)
          .then((st) => { if (audioCap && audioCap.live) { const S = readSettings();
            try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...S, audioDevice: audioCap.deviceId })); } catch (_) {} }
            return st; }),
        stop: () => { audioSilence(); return audioCapture().stop(); },
        sync: () => audioSync(),
        devices: () => audioCapture().devices(),
      },
      persist: () => saveSettings(),
    });
    applyAccent();                                    // the two angles reach the window as soon as it exists
    modView.restore(readSettings().modwin);
    /* wave 54: the modulation clock's visibility is driven by the ONE authority (setPageHidden), not by a second listener of its own — it still RE-ANCHORS and never jumps */
    if (page.hidden) modHost.clock.setHidden(true);
  }

  // ATOMS — the periodic table as one central field (Xα(2/3) + the Latter tail, solved live); a niche window: it ships CLOSED
  const wAtoms = device({ id: 'atoms', eyebrow: 'ATOMS', status: '' });
  rack.appendChild(wAtoms.root); wAtoms.root.classList.add('closed');            // reopened from the + at the top of the rack
  const atomsView = createAtoms(wAtoms.body, {
    Z: () => HAMILTONIANS.atom.Z,
    step: (d) => setElement(HAMILTONIANS.atom.Z + d),
    fill: () => fillValence(),
    active: () => getHamiltonian().id === 'atom',
  });

  // ELECTROSTATICS — the classical field of the register's own charge, in closed form; a niche window: it ships CLOSED
  const wFld = device({ id: 'field', eyebrow: 'ELECTROSTATICS', status: '' });
  rack.appendChild(wFld.root); wFld.root.classList.add('closed');                // reopened from the + at the top of the rack
  ui.fldWin = wFld;
  const fieldlines = createFieldLines(document.getElementById('fieldlines'), {
    onStats: (s) => paintField(s),
    onControls: (c) => { if (ui.fldOv) ui.fldOv.set(c.overlay); if (ui.fldLines) ui.fldLines.set(c.lines); if (ui.fldSrc) ui.fldSrc.set(c.source); },
  });
  {
    const rf = wFld.row('tight');
    ui.fldOv = seg({ label: 'OVERLAY  ·  facing the camera', value: 'off', options: [
      { id: 'off', label: 'OFF', title: 'no lines on the stage — the readouts stay live' },
      { id: 'phi', label: 'Φ', title: 'Show equipotential contours' },
      { id: 'E', label: 'E', title: 'Draw electric-field lines in the current slice' },
      { id: 'j', label: 'j', title: 'Show probability-current streamlines' }],
      onChange: (v) => { fieldlines.setOverlay(v); schedule(TIER.PRESENT); } });
    rf.appendChild(ui.fldOv.root);
    ui.fldLines = knob({ label: 'LINES', min: 4, max: 24, value: 10, step: 1, fmt: (v) => Math.round(v) + (fieldlines.overlay === 'phi' ? ' levels' : ' seeds'),
      onInput: (v) => { fieldlines.setLines(v); schedule(TIER.PRESENT); } });
    rf.appendChild(ui.fldLines.root);
    ui.fldSrc = seg({ label: 'SOURCE', value: 'total', options: [
      { id: 'total', label: 'ρ + nucleus', title: 'Show the total atomic field' },
      { id: 'rho', label: 'ρ only', title: 'Show the electron contribution without the nucleus' }],
      onChange: (v) => { fieldlines.setSource(v); schedule(TIER.PRESENT); } });
    rf.appendChild(ui.fldSrc.root);
    const rr = wFld.row('tight');
    ui.fldQ = readout({ label: 'MONOPOLE  ∫ρ  ·  ‖c‖²', value: '—', sub: 'the L = 0 slot in closed form, against the norm it must equal' });
    ui.fldPhi = readout({ label: 'Φ_e(0)  at the nucleus', value: '—', sub: 'a.u. · volts (27.211386 V per a.u.)' });
    ui.fldE = readout({ label: '|E|  at (0, 0, 1) a₀', value: '—', sub: 'a.u. · V/m (5.1422e11 V/m per a.u.)' });
    ui.fldB = readout({ label: 'B  nucleus  ·  1 a₀ on the axis', value: '—', cls: 'wide', sub: 'tesla — a quadrature, and off the axis it is not certified: never drawn' });
    for (const r of [ui.fldQ, ui.fldPhi, ui.fldE, ui.fldB]) rr.appendChild(r.root);
  el('div', 'note', wFld.body).innerHTML = '<b>Electrostatics.</b> The window samples potential, electric field, and probability current from the hydrogenic density. Lines are drawn in the camera-facing plane. Magnetic field is reported only on the axis. Other Hamiltonians disable this window.';
  }
  /** the ELECTROSTATICS readouts, from the view's own stats block (fired after every rebuild) */
  function paintField(s) {
    if (!ui.fldQ) return;
    if (!s.ok) { for (const r of [ui.fldQ, ui.fldPhi, ui.fldE, ui.fldB]) r.set('—', 'warn'); ui.fldQ.setSub(s.note || 'the L = 0 slot in closed form, against the norm it must equal'); return; }
    ui.fldQ.set(`${s.Q.toFixed(6)}  ·  ${s.norm2.toFixed(6)}`, Math.abs(s.Q - s.norm2) < 1e-6 ? 'ok' : 'warn');
    ui.fldQ.setSub(`${s.slots} multipole slots, L ≤ ${s.Lmax}${s.note ? ' · ' + s.note : ''} · built in ${s.buildMs.toFixed(1)} ms`);
    ui.fldPhi.set(`${s.phiE0.toFixed(6)} a.u.  ·  ${s.phiE0V.toFixed(3)} V`);
    ui.fldE.set(`${s.Emag.toFixed(6)} a.u.  ·  ${s.EmagV.toExponential(3)} V/m`);
    ui.fldB.set(`${s.Bz.toFixed(6)} T at the nucleus  ·  ${s.Bz1.toFixed(6)} T`, Math.abs(s.Bz) > 1e-9 ? 'ok' : '');
    ui.fldB.setSub(`|B| ${s.Bmag.toExponential(3)} T · ${Math.abs(s.Bmag) < 1e-9 ? 'a real orbital carries no current' : 'the orbital hyperfine field'}${s.Bstale ? ' · at an earlier t (B is a quadrature: it runs at 1 Hz while playing)' : ''}`);
  }
  /** is the window entitled to present? visible, hydrogenic, in position space, with no molecule holding the field */
  function fieldOn() {
    return canPresent(wFld) && space === 'x' && getHamiltonian().id === 'hydrogen' && !sturm.P
      && !(molecule && molecule.on) && !(helium && helium.on) && !(h2 && h2.on);
  }

  // WIGNER — the one joint object of position and momentum, cut through the axis; a niche window: it ships CLOSED
  const wWig = device({ id: 'wigner', eyebrow: 'WIGNER', status: '' });
  rack.appendChild(wWig.root); wWig.root.classList.add('closed');                // reopened from the + at the top of the rack
  const wignerView = createWigner(wWig.body, { repaint() { schedule(TIER.PRESENT); } });

  // RADIATION — what the prepared pair would radiate, and the shape of its far field; also CLOSED
  const wRad = device({ id: 'radiation', eyebrow: 'RADIATION', status: '' });
  rack.appendChild(wRad.root); wRad.root.classList.add('closed');
  const radiationView = createRadiation(wRad.body, { repaint() { schedule(TIER.PRESENT); }, ab: () => __LW_hooks.ab });
  const WIG_OK = 'numerical · a slice, not a marginal', RAD_OK = 'exact matrix elements · classical far field';
  Object.assign(READERS, { spectrum: wSpec, shadow: wSh, orbit: wOrb, vortex: wVor, particles: wDyn, kepler: wOrb, fieldlines: wFld,
    dynamics: wDyn, slice: wSlice, qcd: wQCD, atoms: wAtoms, wigner: wWig, radiation: wRad, calculus: wCalc });   // the windows the READER LAW may park (never MOLECULE — it steps nuclei — nor METERS, which shows the governor)
  for (const w of [...Object.values(READERS), wVor, wMol, wHe, wH2, wMet, wFld, wLad]) windowActivity.track(w);
  /** the guard the two hydrogenic readers share: hydrogen at Z = 1, no Sturmian scale, no other model holding the
      field.  Both windows integrate the SHIPPED closed-form radials, so anything else would be two operators in one
      number; they say which one stood them down, in the wave-39 voice. */
  function hydroReader() {
    const H = getHamiltonian();
    if (sturm.P) return { on: false, status: 'hydrogen only: no closed form for the scaled radials',
      why: 'the STURMIAN scale is on: the scaled radials are not the ones this window integrates — switch SCALE back to HYDROGEN' };
    if (H.id !== 'hydrogen') return { on: false, status: 'hydrogenic register only', why: 'hydrogenic register only — the operator in force is ' + H.label };
    if (getZ() !== 1) return { on: false, status: 'hydrogenic register only (Z = 1)', why: 'the ion at Z = ' + getZ() + ' scales every radial: this window reads the Z = 1 closed forms' };
    if ((molecule && molecule.on) || (helium && helium.on) || (h2 && h2.on)) return { on: false, status: 'hydrogenic register only', why: 'another model holds the field — this window reads the hydrogenic register' };
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
       worker is free again only when ITS reply arrives — a timed-out scan is tracked to that reply (makeWorker onLate),
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
      if (__LW_hooks.onPeriodLand) __LW_hooks.onPeriodLand();          // LA7: a CAPTURE hover waiting on this scan plans now
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
    __LW_hooks.periodSoon = () => { const P = periodNow(); return { period: P, settling: periodSettling }; };   // LA7: the CAPTURE hover's read — the frame path's own, never forced
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


  function playMod(on) {
    if (!modHost || !modArm || !clockLink) return null;          // FREE: the transport does not touch the modulation clock
    const w = performance.now() / 1000;
    const r = on ? modHost.clock.play(w) : modHost.clock.pause(w);
    if (modView) modView.sync();
    return r;
  }
  function togglePlay() {
    const want = !clock.playing;
    clock.toggle(performance.now() / 1000);
    playMod(want);
    schedule(TIER.EVOLVE);
  }
  /** THE ARM.  `setEnabled(false)` is not `pause()`: it hands every routed control back to its base
   *  — including the ones a HAND macro holds, which a stopped transport keeps by the pause law's own
   *  second line — and it deliberately does NOT touch the modulation transport's `playing`, so
   *  re-arming picks up the rack the user left rather than a rack that quietly stopped. */
  function setModArm(on, opts) {
    const want = !!on, o = opts || {};
    modArm = want;
    if (ui.modB) {
      ui.modB.classList.toggle('on', want);
      ui.modB.setAttribute('aria-pressed', String(want));
    }
    if (modHost) {
      modHost.clock.setEnabled(want);
      if (want && clock.playing) modHost.clock.play(performance.now() / 1000);   // one control, and it was already pressed
      if (modView) modView.sync();
    }
    if (!o.quiet) saveSettings();
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
  const badges = (() => {
    const B = dom.badges; B.innerHTML = '';
    const sheetToggle = () => { dom.sheet.hidden = !dom.sheet.hidden; for (const b of B.querySelectorAll('.badge[aria-controls]')) b.setAttribute('aria-expanded', String(!dom.sheet.hidden)); };
    const mk = (cls, text, onClick) => { const b = el('button', 'badge ' + cls, B); b.type = 'button'; el('i', '', b); el('span', '', b, text);
      if (!onClick) { b.setAttribute('aria-controls', 'sheet'); b.setAttribute('aria-expanded', String(!dom.sheet.hidden)); }
      b.addEventListener('click', onClick || sheetToggle); return b; };
    const b1 = mk('exact', 'STATE · EVOLUTION · SHADOW');
    const b2 = mk('numerical', 'FIELD');
    const b3 = mk('warn', ''); b3.hidden = true;
    const b4 = mk('warn', ''); b4.hidden = true;
    /* WAVE 56: the fifth badge is the only one that is not about ψ — it is the offer of a NEW BUILD, and it
       is the only badge whose press is not the sheet.  It is hidden until the worker says a build is waiting
       (lab/sw.js §3), and pressing it is the ONE thing in this app that can end a session's build. */
    const b5 = mk('warn', '', () => swClient.accept()); b5.hidden = true;
    let last = '', lastF = '', lastSay = '';
    /* ── WAVE 62 · THE CANVAS SAYS WHAT IS DRAWN, AND SAYS IT RARELY ───────────────────────────────
     * Everything the sentence needs is already assembled here, on the meters' 10 Hz tick, beside four
     * writes that are already change-guarded.  A description that updates ten times a second is
     * unusable, and the answer is NOT a longer throttle: it is that THE SENTENCE CONTAINS NOTHING
     * THAT CHANGES ON ITS OWN.  That is why the clock appears only when the transport is PAUSED —
     * while playing, `t` moves every frame and any string carrying it would defeat the guard below and
     * rewrite the attribute at 10 Hz for the whole session.  With the clock out of it the string moves
     * only when the INSTRUMENT moves: the observable, the style, the grid, the half-width, the mode
     * count, the norm, the operator, the field, position or momentum — a handful of times a session,
     * every one of them a user's own act.  (Field-free evolution moves phases, not amplitudes, so the
     * mode count and the norm fraction are genuinely still while it runs.)
     * WHAT IT DOES NOT DO is describe the ray-marched volume.  A density isosurface, a phase hue field
     * and a nodal reconstruction are not text at any useful fidelity; describing the picture would be
     * fabrication.  The honest claim, and the one this makes true: THE INSTRUMENT'S STATE IS FULLY
     * READABLE; THE RENDERING IS NOT.
     * And the mechanism cannot become a live region by accident: an `aria-label` on a non-live,
     * tabIndex = -1 node is read on demand and never announced spontaneously. */
    const VIEW_SAY = ['ρ = |ψ|² — density', 'arg ψ — phase', 'Re ψ', 'Im ψ', 'Δρ — difference', 'Re + Im superposed'];
    function canvasSentence(rs) {
      if (!field.ok) return 'no field — WebGPU unavailable';
      const H = getHamiltonian(), who = stateReaders().populated;
      const names = who.slice(0, 3).map((a) => H.labelOf(BASIS[a])).join(' + ') + (who.length > 3 ? ' + ' + (who.length - 3) + ' more' : '');
      const half = Number.isInteger(domain.half) ? domain.half : domain.half.toFixed(2);
      /* `quality.res`, NOT `field.resolution`: the governor drops the live grid under load and restores
         it on pause, entirely on its own, and a sentence carrying that number rewrote itself twice in
         three seconds of playback with nobody touching anything.  The chosen grid is the user's; the
         governed one is already on the NUMERICAL badge and in the PERFORMANCE readouts, where a number
         that moves by itself belongs. */
      const where = space === 'p' ? `momentum space, ${quality.res}³ grid` : `${quality.res}³ grid over ±${half} ${H.lengthUnit}`;
      const modes = `${rs.rendered} of ${rs.populated} modes, ${(rs.coveredFraction * 100).toFixed(0)} % of the norm` + (rs.masked ? ` (${rs.masked} muted)` : '');
      const law = reg.field.Fz !== 0 ? `${H.short} + F z, F = ${reg.field.Fz.toExponential(1)}, within each shell`
        : reg.field.Bz !== 0 ? `${H.short} + (B/2) L_z, B = ${reg.field.Bz.toFixed(4)}, diagonal` : H.label;
      const when = clock.playing ? 'playing' : `paused at t = ${clock.t.toFixed(2)} a.u.`;
      return `${names ? names + '; ' : ''}${VIEW_SAY[mat.view] || VIEW_NAMES[mat.view]}, drawn as ${STYLE_NAMES[mat.style]}; ${where}; ${modes}; ${law}; ${when}`;
    }
    function update() {
      const f = reg.field.Fz !== 0 ? `STARK F = ${reg.field.Fz.toExponential(1)} · shell model · use F ≪ ${reg.fieldValidUpTo().toExponential(1)}`
        : reg.field.Bz !== 0 ? `ZEEMAN B = ${reg.field.Bz.toFixed(4)}` : '';
      if (f !== lastF) { lastF = f; b4.hidden = !f; b4.lastChild.textContent = f; b4.className = 'badge ' + (reg.field.Fz !== 0 ? 'warn' : 'exact'); }
      b1.lastChild.textContent = reg.field.Fz !== 0 ? 'STATE · SHADOW · SHELL EVOLUTION' : 'STATE · EVOLUTION · SHADOW';
      if (ui.fieldRo) {
        ui.fieldRo.set(reg.field.Fz !== 0 ? 'H₀ + F z' : reg.field.Bz !== 0 ? 'H₀ + (B/2)L_z' : 'H₀ (bare Coulomb)', reg.field.Fz !== 0 ? 'warn' : reg.field.Bz !== 0 ? 'live' : '');
        ui.fieldRo.setSub(reg.field.Fz !== 0 ? `within-shell model · use F ≪ ${reg.fieldValidUpTo().toExponential(1)}` : reg.field.Bz !== 0 ? 'diagonal in this basis' : 'current Hamiltonian');
      }
      const rs = stateReaders().rendered;
      const t2 = field.ok ? `FIELD ${field.resolution}³ · ±${Number.isInteger(domain.half) ? domain.half : domain.half.toFixed(2)} ${getHamiltonian().lengthUnit}${space === 'p' ? '⁻¹ · MOMENTUM' : ''} · f16` : 'NO FIELD · WebGPU unavailable';
      if (b2.lastChild.textContent !== t2) b2.lastChild.textContent = t2;
      b2.className = 'badge ' + (field.ok ? 'numerical' : 'bad');
      const warn = rs.masked ? `RENDERED ${rs.rendered}/${rs.populated} · ${(rs.coveredFraction * 100).toFixed(0)}% OF NORM · ${rs.masked} MUTED` : rs.truncated ? `TRUNCATED ${rs.rendered}/${rs.populated} · ${(rs.coveredFraction * 100).toFixed(0)}% OF NORM` : '';
      if (warn !== last) { last = warn; b3.hidden = !warn; b3.lastChild.textContent = warn; }
      const say = canvasSentence(rs);
      if (say !== lastSay) { lastSay = say; dom.canvas.setAttribute('aria-label', say); }   // one string build and one !== per 100 ms, the same shape as the four writes above
    }
    return { update, build: b5, say: () => lastSay };
  })();

  /* ── WAVE 56 · THE INSTALL LAYER'S INTERFACE HALF (board #56) ─────────────────────────────────────────
   * lab/sw.js precaches the whole lab and then WAITS: it never calls skipWaiting() by itself, never claims
   * a client, and has no timer.  The ONE thing that can end a session's build is a press, and this is it.
   *
   * THE LAW THE WORKER CANNOT KEEP ALONE — found by the adversarial review of 2026-09-05 §2.2, and it is
   * right.  skipWaiting() activates the new worker, and the spec's Activate algorithm then re-points EVERY
   * client in scope and fires `controllerchange` in all of them, not only in the tab that consented.  So
   * "a new build is never swapped in under a running session" can only be true per TAB, and only if each
   * tab decides for itself what a controllerchange MEANS.  That is what `asked` is:
   *     the tab that PRESSED reloads, once — it asked for exactly this;
   *     a tab that did NOT ask is TOLD and keeps running, with its unsaved superposition, its notebook page
   *     and its layout intact, until its own press.
   * The second tab is now standing on a controller whose activate has already collected the cache it booted
   * on, so what it is told says exactly that.  A page cannot prevent it; it can refuse to throw the work
   * away without being asked, and it can say what happened rather than reload in silence. */
  const swClient = {
    state: 'idle',                       // idle → ready (a build is waiting) → taking | replaced
    asked: false,                        // did THIS document ask for the swap?
    reloads: 0,
    build: null, cache: null, files: 0,
    mode: 'boot', error: null, registration: null, pending: null,
    take: null,
    /** the one seam a gate replaces — nothing else in the lab reloads the page */
    reload() { location.reload(); },
    say(badge, status) {
      const b = badges.build;
      if (b) { b.hidden = false; b.lastChild.textContent = badge; }
      if (ui.set) ui.set.setStatus(status, 'warn');       // …and a second place to find it, for a browser with STATUS TAGS off
      return badge;
    },
    /** OFFER a waiting build.  It never takes it: `take` is called by the press and by nothing else. */
    buildReady(take) {
      if (typeof take === 'function') swClient.take = take;
      if (!swClient.take) return false;
      swClient.state = 'ready';
      swClient.say('A NEW BUILD IS READY · RELOAD', 'a new build is ready');
      return true;
    },
    /** the offer, pressed */
    accept() {
      if (swClient.state !== 'ready' || !swClient.take) return false;
      swClient.asked = true; swClient.state = 'taking';
      swClient.say('TAKING THE NEW BUILD…', 'taking the new build');
      try { swClient.take(); } catch (e) { swClient.error = String(e && e.message || e); return false; }
      return true;
    },
    /** Explicit repair path from ABOUT > UPDATE APP. First ask the registration for a new worker. If
     *  one installs, take it through the normal safe handoff. If the server has the same worker, remove
     *  this app's registration and Cache Storage, then reload from the network; the next boot precaches
     *  a clean copy. Project data lives in localStorage and is never touched here. */
    async refresh() {
      if (swClient.state === 'refreshing' || swClient.state === 'taking') return false;
      let discardApproved = false;
      if (layout.projects && layout.projects.dirty) {
        if (!window.confirm('UPDATE APP WITHOUT SAVING?\nYour unsaved project changes will be lost.')) return false;
        discardApproved = true;
      }
      swClient.state = 'refreshing';
      swClient.say('CHECKING FOR A NEW BUILD…', 'checking for a new build');
      try {
        const reg = swClient.registration || (navigator.serviceWorker && await navigator.serviceWorker.getRegistration('./'));
        if (reg) {
          await reg.update();
          const installing = reg.installing;
          if (installing && !['installed', 'activated', 'redundant'].includes(installing.state)) {
            await Promise.race([
              new Promise((resolve) => installing.addEventListener('statechange', () => {
                if (['installed', 'activated', 'redundant'].includes(installing.state)) resolve();
              })),
              new Promise((resolve) => setTimeout(resolve, 15000)),
            ]);
          }
          if (reg.waiting) {
            if (discardApproved) layout.projects.markClean();
            swClient.asked = true; swClient.state = 'taking';
            swClient.say('TAKING THE NEW BUILD…', 'taking the new build');
            reg.waiting.postMessage({ type: 'LW_SW_SKIP_WAITING' });
            return true;
          }
          await reg.unregister();
        }
        if ('caches' in globalThis) {
          const names = await caches.keys();
          await Promise.all(names.filter((name) => name.startsWith('lw-lab-')).map((name) => caches.delete(name)));
        }
        if (discardApproved) layout.projects.markClean();
        swClient.asked = true;
        swClient.say('CACHE CLEARED · RELOADING…', 'cache cleared; reloading');
        swClient.reload();
        return true;
      } catch (e) {
        swClient.error = String(e && e.message || e); swClient.state = 'failed';
        swClient.say('UPDATE FAILED · TRY AGAIN', 'update failed: ' + swClient.error);
        return false;
      }
    },
    /** the controller under this document changed.  ONLY the document that asked may reload. */
    controllerChanged() {
      if (swClient.asked) { if (swClient.reloads++ === 0) swClient.reload(); return 'reloaded'; }
      swClient.state = 'replaced';
      swClient.say('THIS BUILD WAS REPLACED IN ANOTHER TAB · RELOAD WHEN READY', 'replaced in another tab');
      return 'told';
    },
    /** a message from the worker.  LW_SW_WAITING is §3's announcement, which nothing used to listen for. */
    message(d) {
      if (!d || !d.type) return null;
      if (d.type === 'LW_SW_WAITING') { swClient.pending = d; return 'waiting'; }
      if (d.type === 'LW_SW_ACTIVE' || d.type === 'LW_SW_BUILD') {
        swClient.build = d.build; swClient.files = d.files || 0; if (d.cache) swClient.cache = d.cache;
        return d.type === 'LW_SW_BUILD' ? 'build' : 'active';
      }
      return null;
    },
  };

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
  function pointerRay(px, py) {
    const W = dom.canvas.clientWidth, H = dom.canvas.clientHeight, B = cameraBasis(obs), D = obs.dist * domain.half;
    const tanH = Math.tan((obs.fov || 0.6) / 2), aspect = W / H, u = 2 * px / W - 1, v = 1 - 2 * py / H;
    const cam = [B.dir[0] * D, B.dir[1] * D, B.dir[2] * D];
    const d = [B.fwd[0] + u * tanH * aspect * B.right[0] + v * tanH * B.up[0], B.fwd[1] + u * tanH * aspect * B.right[1] + v * tanH * B.up[1], B.fwd[2] + u * tanH * aspect * B.right[2] + v * tanH * B.up[2]];
    return { cam, d };
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
    const W = dom.canvas.clientWidth, H = dom.canvas.clientHeight, B = cameraBasis(obs), D = obs.dist * domain.half;
    const tanH = Math.tan((obs.fov || 0.6) / 2), aspect = W / H, u = 2 * px / W - 1, v = 1 - 2 * py / H;
    const cam = [B.dir[0] * D, B.dir[1] * D, B.dir[2] * D];
    const d = [B.fwd[0] + u * tanH * aspect * B.right[0] + v * tanH * B.up[0], B.fwd[1] + u * tanH * aspect * B.right[1] + v * tanH * B.up[1], B.fwd[2] + u * tanH * aspect * B.right[2] + v * tanH * B.up[2]];
    const lam = -(cam[0] * B.fwd[0] + cam[1] * B.fwd[1] + cam[2] * B.fwd[2]) / (d[0] * B.fwd[0] + d[1] * B.fwd[1] + d[2] * B.fwd[2]);
    const p = [cam[0] + lam * d[0], cam[1] + lam * d[1], cam[2] + lam * d[2]];
    const a = HAMILTONIANS.well.radius, r = Math.hypot(...p), cap = 0.75 * a;
    return r > cap ? p.map((c) => c * cap / r) : p;                 // keep the launch point well inside the wall
  }
  /* a DESIGN CHOICE, labelled: a harder pull launches a tighter packet (a boost alone never changes a width) */
  let gasWidth = 1.8, gasAxial = false;
  const gas = createGas(HAMILTONIANS.well.radius);
  /* optimization K7 · THE GAS TABLE, OPT-IN (`?gastab=1`, __LW.gasTable(true); default OFF): gas.js builds it in idle slices,
     the field uploads it, the records carry their rows only once it is held, and the landing repaints a live gas. */
  const gasTableOn = (on) => gas.setTable(on, (tab) => !!(field.ok && field.setGasTable && field.setGasTable(tab)), () => { if (gas.on) schedule(TIER.RECONSTRUCT); });
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
   * layout burst, at most every 300 ms while a frame runs, and never inside a paint. */
  const NO_OCCLUSION = [];
  function refreshOcclusion(nowMs) {
    occludeDirty = false; occludeAt = nowMs;
    /* LA3 · HIDDEN, NOTHING IS PAINTED, SO NOTHING MASKS.  Under body.ui-hidden every surface below is display:none
       (lab.css: the racks, transport, sheet and both lists !important; #floats and #notebook !important; #keymap), and
       #keysheet no longer exists — so the burst's answer is exactly [] and its layout reads bought nothing, every 300 ms
       (AUDIT-B FB5, REFUTE-E/F).  The empty block is still HANDED OVER, because the line pass still runs under H (the
       slice outline) and the rectangles from before the hide must not punch holes in it; setOcclusion compares its
       signature, so an already-empty block costs a string compare.  The body-class observer below re-dirties the
       burst on the way back. */
    if (document.body.classList.contains('ui-hidden')) { if (field.setOcclusion(NO_OCCLUSION)) schedule(TIER.PRESENT); return; }
    const cb = dom.canvas.getBoundingClientRect(), out = [], body = document.body;
    const rect = (el) => { if (!el || el.hidden || getComputedStyle(el).visibility === 'hidden') return null;
      const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return null;
      let x0 = r.left - cb.left, y0 = r.top - cb.top, x1 = r.right - cb.left, y1 = r.bottom - cb.top;
      /* Device cards scroll inside the modulation run. Their offscreen bounds must not mask the stage. */
      if (el.classList.contains('m2dev')) { const clip = el.closest('.m2run')?.getBoundingClientRect();
        if (clip) { x0 = Math.max(x0, clip.left - cb.left); y0 = Math.max(y0, clip.top - cb.top);
          x1 = Math.min(x1, clip.right - cb.left); y1 = Math.min(y1, clip.bottom - cb.top); } }
      return x1 - x0 < 2 || y1 - y0 < 2 || x1 <= 0 || y1 <= 0 || x0 >= cb.width || y0 >= cb.height ? null : [x0, y0, x1, y1]; };
    const add = (el) => { const r = rect(el); if (r) out.push(r); };
    const disconnected = body.classList.contains('disconnected') && !body.classList.contains('phone');
    const surfaces = (d) => {
      if (d.id === 'modwin') return d.querySelectorAll('.m2rail, .m2dev, .m2workbar');
      if (d.classList.contains('kwin-chiprail')) return d.querySelectorAll('.crail-chip');
      if (disconnected && d.classList.contains('dev')) return [d.querySelector('.dev-head'), d.querySelector('.dev-body')];
      return [d];
    };
    const rackShown = !body.classList.contains('rack-hidden') || body.classList.contains('rack-peek');
    const cards = [];
    if (rackShown) for (const rk of [rack, rackL]) if (rk) for (const d of rk.children) if (d.classList.contains('dev') && !d.classList.contains('closed')) cards.push(d);
    for (const d of floats.children) if (!d.hidden && !d.classList.contains('closed')) for (const s of surfaces(d)) add(s);
    for (const id of ['transport', 'notebook', 'sheet', 'rackAddList', 'rackFavList']) add(document.getElementById(id));
    add(document.querySelector('#keymap .km-panel'));
    const rackRects = [];
    for (const d of cards) for (const s of surfaces(d)) { const r = rect(s); if (r) rackRects.push(r); }
    if (out.length + rackRects.length <= 32) out.push(...rackRects);
    else if (rackShown) { add(rack); add(rackL); }   // past the block's 32 the two columns stand in for their cards
    if (field.setOcclusion(out)) schedule(TIER.PRESENT);
  }
  { const dirty = () => { occludeDirty = true; schedule(TIER.PRESENT); };
    const mo = new MutationObserver(dirty);
    for (const el of [floats, rack, rackL]) if (el) mo.observe(el, { childList: true });
    /* A paused field has no periodic frame to notice a source card sliding under the run's clip. */
    if (floats) floats.addEventListener('scroll', dirty, { capture: true, passive: true });
    for (const id of ['notebook', 'transport', 'sheet', 'rackAddList', 'rackFavList']) { const el = document.getElementById(id); if (el) mo.observe(el, { attributes: true, attributeFilter: ['style', 'hidden', 'class'] }); }
    new MutationObserver(dirty).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    for (const rk of [rack, rackL]) if (rk) rk.addEventListener('scroll', dirty, { passive: true });
    window.addEventListener('resize', dirty, { passive: true });
  }
  const floatState = new Map();        // id → { home:{side,index}, x, y, w, compact } — the ARRANGEMENT, never the physics
  let floatZ = 0;                      // the stacking counter; a press hands out the next one
  const devById = (id) => document.querySelector('.dev[data-id="' + id + '"]');
  /** a rack card's width, from the RACK's own content box — the scrollbar is already out of clientWidth */
  const rackCardWidth = () => { const cs = getComputedStyle(rack); return Math.max(180, Math.round(rack.clientWidth - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0))); };
  /** THE CLAMP: a header is always reachable — 120 px of it across, all 44 of it down */
  function clampFloat(x, y, w) {
    const HEAD = 44, keep = Math.min(120, w);
    return [Math.round(Math.max(keep - w, Math.min(window.innerWidth - keep, x))),
      Math.round(Math.max(0, Math.min(Math.max(0, window.innerHeight - HEAD), y)))];
  }
  function placeFloat(d, x, y) {
    const st = floatState.get(d.dataset.id); if (!st) return;
    const [cx, cy] = clampFloat(x, y, st.w);
    st.x = cx; st.y = cy; d.style.left = cx + 'px'; d.style.top = cy + 'px'; occludeDirty = true;
    schedule(TIER.PRESENT);   // detached windows move over a paused canvas too
  }
  const raiseFloat = (d) => { if (!d || !d.classList.contains('floating')) return false; d.style.zIndex = String(++floatZ); return true; };
  const frontFloat = () => { let best = null, z = -1; if (floats) for (const d of floats.querySelectorAll('.dev')) { const q = +d.style.zIndex || 0; if (q > z) { z = q; best = d; } } return best; };
  /** the pop chip wears the act the NEXT press performs — off the rack, or back onto it */
  function popFace(d) {
    const b = d && d.querySelector('.dev-pop'); if (!b) return;
    if (d === wTr.root) {                                              // the transport's floating mode is the pill, and it has always had one
      chip(b, layout.docked ? 'north' : 'reopen', layout.docked ? 'undock the transport' : 'dock the transport');
      b.title = 'Dock or undock the transport';
      return;
    }
    const out = d.classList.contains('floating');
    chip(b, out ? 'reopen' : 'north', out ? 'dock this window back into the rack' : 'take this window off the rack');
    b.title = out ? 'Return this window to its rack'
      : 'Move this window onto the stage';
  }
  function railFace(d) {
    const b = d && d.querySelector('.dev-rail'); if (!b) return;
    const c = d.classList.contains('compact');
    chip(b, c ? 'expand' : 'compact', c ? 'give this window its full width back' : 'narrow this window to its rail');
    b.title = c ? 'Use the full window layout'
      : 'Use the compact window layout';
  }
  /* ── WAVE 69 · THE ONE ENTRANCE IN THE LAB, and everything about it is a gate in MOTION-LAW ─────
   * FREQUENCY: "window open/close" is the OCCASIONAL tier, which is the one tier that gets a standard
   * animation.  PURPOSE (gate 2): spatial continuity — a card arrives at the TOP of a rack that may
   * already be scrolled and full, and without this it simply exists, one frame after a menu closed
   * somewhere else.  NUMBERS: 220 ms, inside the 300 ms ceiling, entrance easing
   * `cubic-bezier(.23, 1, .32, 1)` verbatim.  SIGNAL (gate 3): it is opacity and a 7-px slide on
   * chrome, in no accent colour, and it is a ONE-SHOT — nothing here drifts, pulses or breathes.
   *   IT IS ON `reopen()` ALONE, and that is the law rather than an oversight.  `raise()` also clears
   * `.closed`, and it must NOT animate: TAB reaches it, and a keyboard-initiated action is never
   * animated — "the key is the user asking for the result, not the journey".  A window raised by the
   * WINDOW menu is the same act by a different road and travels no further.
   *   The class is REMOVED before it is added, with a forced reflow between, because a card reopened
   * twice inside the animation's own 220 ms would otherwise not restart — a one-shot slower than the
   * eye may legally restart, and this one does. */
  function enterWindow(dev) {
    dev.classList.remove('dev-enter');
    void dev.offsetWidth;
    dev.classList.add('dev-enter');
    dev.addEventListener('animationend', () => dev.classList.remove('dev-enter'), { once: true });
  }
  const layout = {
    toggleRack() { document.body.classList.toggle('rack-hidden'); document.body.classList.remove('rack-peek', 'transport-peek'); saveSettings(); },   // wave 59: on a phone the press IS the browser saying which it wants (see enterPhone)
    /** move a card to the other rack (or to a named side) — the MIRROR: same windows, either side */
    moveToRack(id, side) {
      const card = document.querySelector('.dev[data-id="' + id + '"]'); if (!card || !rackL) return false;
      const target = side === 'L' ? rackL : side === 'R' ? rack : (card.parentElement === rack ? rackL : rack);
      target.appendChild(card); return true;
    },
    /* WAVE 55: which rack a window BELONGS TO.  A floating card's parent is the float layer, so reading
       the parent would answer 'R' for a window whose home is the mirror rack — and `captureLayout`,
       `dockWindow` and the ⇄ all mean the HOME.  Ask the float record first. */
    side(id) { const st = floatState.get(id); if (st) return st.home.side; const card = document.querySelector('.dev[data-id="' + id + '"]'); return card && card.parentElement === rackL ? 'L' : 'R'; },
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
    /* ── WAVE 55 · THE FLOAT VERBS ─────────────────────────────────────────────────────────────── */
    /** which windows are off the rack, BACK-MOST FIRST (so replaying the list reproduces the stack) */
    floating() { return floats ? [...floats.querySelectorAll('.dev')].sort((a, b) => (+a.style.zIndex || 0) - (+b.style.zIndex || 0)).map((d) => d.dataset.id) : []; },
    isFloating(id) { const d = devById(id); return !!d && d.classList.contains('floating'); },
    floatOf(id) { const st = floatState.get(id), d = devById(id); return st ? { x: st.x, y: st.y, w: st.w, compact: !!st.compact, z: +(d && d.style.zIndex || 0), home: { ...st.home } } : null; },
    /** TAKE IT OFF THE RACK.  `at` overrides the landing spot and the home slot (a saved layout supplies both). */
    popOut(id, at) {
      const d = devById(id); if (!d || !floats) return false;
      if (d === wTr.root) { if (layout.docked) layout.dockTransport(); return true; }        // its floating mode is the pill
      if (document.body.classList.contains('phone')) return false;                           // wave 51: one rack, and nothing floats
      if (d.classList.contains('floating')) { raiseFloat(d); return true; }
      const host = d.parentElement === rackL ? rackL : rack;
      const sibs = [...host.querySelectorAll('.dev')];
      const home = at && at.home ? { side: at.home.side === 'L' ? 'L' : 'R', index: Math.max(0, at.home.index | 0) }
        : { side: host === rackL ? 'L' : 'R', index: Math.max(0, sibs.indexOf(d)) };
      const w = (at && at.w) || rackCardWidth();
      const r = d.getBoundingClientRect();
      /* IT COMES OFF SIDEWAYS: the same height, one card's width in from the rack it left, so the window
         lands ON THE STAGE and never underneath the rack it just came out of.  A CLOSED card measures
         0 × 0 (display:none), and a window opening straight into the float layer — MODULATION does — has
         no rectangle to leave from, so that case centres it instead of trusting a zero. */
      const x = at && at.x !== undefined ? at.x
        : (r.width ? (home.side === 'L' ? r.left + w + 24 : r.left - w - 24) : Math.round((window.innerWidth - w) / 2));
      /* THE LANDING IS NOT THE CLAMP.  The clamp only promises a reachable header, which is the right law
         for a DRAG and the wrong one for a first appearance: a card sitting at the bottom of a scrolled rack
         would pop out with nothing but its header on the screen.  So a window LANDS fully on the stage when
         it fits, and falls back to the clamp when it does not. */
      let y = at && at.y !== undefined ? at.y : (r.height ? r.top : 72);
      if (!(at && at.y !== undefined)) { const h = Math.min(r.height || 320, window.innerHeight - 16); y = Math.max(8, Math.min(y, window.innerHeight - h - 8)); }
      floatState.set(id, { home, x, y, w, compact: false });
      /* THE WIDTH IS A CUSTOM PROPERTY, not an inline `width`: COMPACT then overrides it with an ordinary
         stylesheet rule instead of an `!important` fighting an inline declaration. */
      d.style.setProperty('--float-w', w + 'px');
      d.classList.add('floating');
      floats.appendChild(d);
      placeFloat(d, x, y);
      raiseFloat(d);
      if (at && at.compact) layout.setCompact(id, true);
      popFace(d); railFace(d);
      schedule(TIER.PRESENT);
      return true;
    },
    /** PUT IT BACK.  With no `drop` it goes HOME — the rack and the slot it left; with one, exactly there. */
    dockWindow(id, drop) {
      const d = devById(id); if (!d) return false;
      if (d === wTr.root) { if (!layout.docked) layout.dockTransport(); return true; }
      const st = floatState.get(id); if (!st) return false;
      const host = drop && drop.host ? drop.host : (st.home.side === 'L' && rackL ? rackL : rack);
      d.classList.remove('floating', 'compact');
      d.style.left = ''; d.style.top = ''; d.style.zIndex = ''; d.style.removeProperty('--float-w');
      let ref = null;
      if (drop && drop.host) ref = drop.ref && drop.ref.parentElement === host ? drop.ref : null;
      else { const sibs = [...host.querySelectorAll('.dev')]; ref = sibs[Math.min(st.home.index, sibs.length)] || null; }
      host.insertBefore(d, ref);
      floatState.delete(id);
      popFace(d); railFace(d);
      schedule(TIER.PRESENT);
      return true;
    },
    toggleFloat(id) {
      const d = devById(id); if (!d) return false;
      if (d === wTr.root) { layout.dockTransport(); return true; }
      return d.classList.contains('floating') ? layout.dockWindow(id) : layout.popOut(id);
    },
    /** COMPACT IS A MODE, NOT A RESIZE.  The body stands down and the header re-flows to a vertical rail
     *  carrying the window's NAME, its POWER switch and its CLOSE — the three the reference keeps — plus
     *  the way back.  Nothing inside the body moves, so FULL restores it exactly (STYLE-LOCK). */
    setCompact(id, on) {
      const d = devById(id), st = floatState.get(id); if (!d || !st) return false;
      st.compact = !!on; d.classList.toggle('compact', !!on);
      railFace(d); schedule(TIER.PRESENT); return true;
    },
    moveFloat(id, x, y) { const d = devById(id); if (!d || !floatState.has(id)) return false; placeFloat(d, x, y); return true; },
    raiseFloat(id) { return raiseFloat(devById(id)); },
    /** every floating window home again — the phone's crossing, RESET LAYOUT, and any layout that predates floating */
    dockAll(remember) {
      const kept = {};
      for (const id of layout.floating()) { if (remember) kept[id] = layout.floatOf(id); layout.dockWindow(id); }
      return kept;
    },
    /** bring a window to the top of its rack, unfolded, with the rack shown — or, if it floats, to the FRONT */
    raise(id) {
      const dev = document.querySelector('.dev[data-id="' + id + '"]'); if (!dev) return false;
      dev.hidden = false; dev.classList.remove('closed');
      if (dev.classList.contains('floating')) {                      // wave 55: "the top" of a floating window is the top of the STACK
        raiseFloat(dev); if (dev.classList.contains('compact')) layout.setCompact(id, false);
      } else { (dev.parentElement || rack).prepend(dev); }
      saveSettings();
      if (dev.classList.contains('folded')) { const f = dev.querySelector('.dev-fold'); if (f) f.click(); }
      document.body.classList.remove('rack-hidden'); (dev.parentElement || rack).scrollTop = 0; return true;
    },
    /** the ids of windows that no longer exist, and the window that absorbed each of them (wave 56) */
    retired: RETIRED_WINDOWS,
    /** reopen a closed window into a rack (default: the one it was in) */
    reopen(id, side) {
      const dev = document.querySelector('.dev[data-id="' + id + '"]'); if (!dev) return false;
      dev.hidden = false; dev.classList.remove('closed'); const host = side === 'L' ? rackL : side === 'R' ? rack : dev.parentElement || rack;
      const first = host.querySelector('.dev'); if (first) host.insertBefore(dev, first); else host.appendChild(dev);
      enterWindow(dev);
      dev.dispatchEvent(new CustomEvent('devopen'));
      saveSettings(); return true;
    },
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
          const st = floatState.get(d.dataset.id);
          return { id: d.dataset.id, side: st ? st.home.side : (d.dataset.phoneFrom === 'L' || d.parentElement === rackL ? 'L' : 'R'),
            folded: d.classList.contains('folded'), closed: d.classList.contains('closed'), off: d.classList.contains('off'),
            float: st ? { x: st.x, y: st.y, w: st.w, compact: !!st.compact, z: +(d.style.zIndex || 0), index: st.home.index } : null };
        }),
        docked: !!layout.docked, rackHidden: document.body.classList.contains('rack-hidden'),
        nb: nb && nb.style.width ? [parseInt(nb.style.width, 10) || 0, parseInt(nb.style.height, 10) || 0] : null,


        look: { palette: palChoice, accA: accent.a, accB: accent.b, hue: mat.hueShift,
                style: mat.style, dither: mat.dither, invert: !!mat.invert,
                frame: mat.frame !== false, axis: mat.axis !== false, frameMode: mat.frameMode, axisMode:mat.axisMode, cornerSide:mat.cornerSide, axisInk: mat.axisInk || 'theme' },
        cam: { yaw: obs.yaw, pitch: obs.pitch, dist: obs.dist, fov: obs.fov, mode: obs.mode,
               quat: Array.isArray(obs.quat) ? obs.quat.slice() : null,
               friction: camera.friction, spin: camera.speed, autoRotate: !!camera.autoRotate,
               dragGain: camera.dragGain, fling: camera.flingGain } };
    },
    /** put it back.  Fold and power go through the BUTTONS, not the classes, because the glyph and the
     *  aria-pressed state live in device()'s closure and only the click keeps all three in step. */
    applyLayout(L) {
      if (!L || !Array.isArray(L.cards)) return false;
      if (typeof L.docked === 'boolean' && L.docked !== layout.docked) layout.dockTransport();
      /* EVERY WINDOW DOCKS FIRST.  Order is the ARRAY's order and appending reproduces it, so the float
         pass has to run on a settled rack — and this is also what makes a v1 layout (no float data at all)
         mean what it says: nothing floats.  ON A PHONE THE PASS NEVER RUNS: wave 51 gives the phone one
         rack and no floating, so a layout saved on a desktop with three windows on the stage LOADS there
         with those three windows DOCKED, in their home racks, rather than breaking. */
      layout.dockAll(false);
      const ph = document.body.classList.contains('phone');
      /* WAVE 56 · A RETIRED ID STILL LOADS.  Board #59 merged DRAW STYLE into the WAVE window and kept the
         HEIR'S id (`observer`), so `style` is a name that every layout saved before this wave still carries.
         The old loop simply `continue`d past a card it could not find: the layout loaded, and the seat the
         retired window held vanished without a word.  Now a retired id resolves to its heir — and because
         every such record names the heir as well, THE HEIR'S OWN RECORD WINS and the retired one is dropped:
         it is one window now, and one window can only be in one rack, folded or not, open or closed.
         NOTHING HERE BUMPS THE VERSION.  A v1 record (wave 54, no `float` key) and a v2 record (wave 55) are
         read exactly as they always were; this only renames a card on the way in. */
      const named = new Set(L.cards.map((c) => c.id));
      const heirOf = (id) => (RETIRED_WINDOWS[id] && !named.has(RETIRED_WINDOWS[id]) ? RETIRED_WINDOWS[id] : id);
      /* ── WAVE 59 · THE PHONE'S FLOAT MEMORY IS THE ARRANGEMENT'S, AND A LOAD IS A NEW ARRANGEMENT ────
         `enterPhone()` docks every floating window and remembers where each one was, so the crossing is
         reversible (wave 51's law); `leavePhone()` replays that record.  But a LOAD on the phone arranged
         every card, SKIPPED the float pass (a phone has no floating), and left `phone.floats` untouched —
         so rotating back popped the PRE-CROSSING windows out at their PRE-CROSSING positions, on top of the
         layout the user had just loaded, and no control they pressed said so.  The record was describing an
         arrangement that no longer existed.
         The fix is not to forget: it is to make the record describe the arrangement that IS loaded.  The
         layout carries its own float block per card, in the same shape `floatOf()` returns, so a load on a
         phone REPLACES `phone.floats` with the layout's own — and crossing back then reproduces the layout
         in full, floats included, which is what loading it meant.  A layout with no floats leaves nothing to
         replay, which is also what it meant.  (RESET LAYOUT clears it outright: reset means nothing floats.) */
      if (ph) {
        phone.floats = null;
        for (const c of L.cards) {
          if (!c.float || c.closed || (RETIRED_WINDOWS[c.id] && named.has(RETIRED_WINDOWS[c.id]))) continue;
          (phone.floats || (phone.floats = {}))[heirOf(c.id)] =
            { x: c.float.x, y: c.float.y, w: c.float.w, compact: !!c.float.compact, z: c.float.z || 0, home: { side: c.side, index: c.float.index } };
        }
      }
      for (const c of L.cards) {
        if (RETIRED_WINDOWS[c.id] && named.has(RETIRED_WINDOWS[c.id])) continue;
        const d = document.querySelector('.dev[data-id="' + heirOf(c.id) + '"]'); if (!d) continue;
        /* FOUND BY THE GATE, and it predates this wave: on a phone `#rackL` is `display: none !important`,
           so appending a card the record marks 'L' into the mirror rack made the window VANISH.  Wave 51's
           law is one rack on a phone, and its crossing is reversible through `data-phone-from` — so that is
           what a load writes here, and leaving the breakpoint puts the card back in the mirror rack. */
        const host = !ph && c.side === 'L' && rackL ? rackL : rack;
        if (ph) { if (c.side === 'L') d.dataset.phoneFrom = 'L'; else delete d.dataset.phoneFrom; }
        host.appendChild(d);if(d===wTr.root){layout.dockSide=c.side==='L'?'L':'R';layout.dockIndex=[...host.querySelectorAll('.dev')].indexOf(d);}                     // Project order owns the docked transport seat too.
        d.classList.toggle('closed', !!c.closed);
        if (d.classList.contains('folded') !== !!c.folded) { const f = d.querySelector('.dev-fold'); if (f) f.click(); }
        if (d.classList.contains('off') !== !!c.off) { const pw = d.querySelector('.dev-power'); if (pw) pw.click(); }
      }
      if (!ph) for (const c of L.cards.filter((q) => q.float && !(RETIRED_WINDOWS[q.id] && named.has(RETIRED_WINDOWS[q.id]))).sort((a, b) => (a.float.z || 0) - (b.float.z || 0)))
        layout.popOut(heirOf(c.id), { x: c.float.x, y: c.float.y, w: c.float.w, compact: c.float.compact, home: { side: c.side, index: c.float.index } });
      document.body.classList.toggle('rack-hidden', !!L.rackHidden);
      if (Array.isArray(L.nb) && L.nb[0] && layout.notebookResize) layout.notebookResize(L.nb[0], L.nb[1]);
      saveSettings(); schedule(TIER.PRESENT);
      return true;
    },
    /** the label a numbered slot wears in the menu — the information a name would have carried */
    layoutLabel(L, slot) {
      /* wave 59: a v1 record naming BOTH a retired id and its heir restores one window, not two — applyLayout
         drops the retired one.  The row is the only place a user can compare, so it counts the same set. */
      const live = L.cards.filter((c) => !(RETIRED_WINDOWS[c.id] && L.cards.some((q) => q.id === RETIRED_WINDOWS[c.id])));
      const open = live.filter((c) => !c.closed).length, sides = new Set(live.filter((c) => !c.closed).map((c) => c.side));
      const d = new Date(L.at || Date.now());
      const fl = live.filter((c) => c.float && !c.closed).length;
      return slot + '  ·  ' + open + ' window' + (open === 1 ? '' : 's') + '  ·  ' + (sides.size > 1 ? 'both racks' : sides.has('L') ? 'left rack' : 'right rack')
        + (fl ? '  ·  ' + fl + ' floating' : '')
        + '  ·  ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    },
    layouts() { const m = readSettings().layouts || {}; return Object.keys(m).map(Number).filter((n) => n >= 1 && n <= LAYOUT_SLOTS).sort((a, b) => a - b).map((slot) => ({ slot, label: layout.layoutLabel(m[slot], slot), at: m[slot].at })); },
    saveLayout(slot) {
      const S = readSettings(), m = S.layouts || {};
      let n = +slot || 0;
      if (!n) { for (let i = 1; i <= LAYOUT_SLOTS && !n; i++) if (!m[i]) n = i; }
      if (!n) { let oldest = 1; for (let i = 2; i <= LAYOUT_SLOTS; i++) if ((m[i].at || 0) < (m[oldest].at || 0)) oldest = i; n = oldest; }   // full: the oldest goes
      m[n] = layout.captureLayout();
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...S, layouts: m })); } catch (e) {}
      return n;
    },
    loadLayout(slot) { const m = readSettings().layouts || {}; return m[slot] ? layout.applyLayout(m[slot]) : false; },
    forgetLayout(slot) { const S = readSettings(), m = S.layouts || {}; delete m[slot]; try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...S, layouts: m })); } catch (e) {} return true; },
    resetLayout() {
      layout.dockAll(false);                                                 // wave 55: "reopen and unfold every window" now also means put every one of them back on a rack
      for (const d of document.querySelectorAll('.dev')) { d.classList.remove('closed', 'off'); if (d.classList.contains('folded')) { const f = d.querySelector('.dev-fold'); if (f) f.click(); } }
      const ph = document.body.classList.contains('phone');
      if (ph) phone.floats = null;                                            // wave 59: RESET LAYOUT is a new arrangement too — see applyLayout
      if (layout.docked !== ph) layout.dockTransport();                       // wave 51: on a phone the transport is DOCKED, not floating — reset does not undock it
      for (const d of [...document.querySelectorAll('#rackL .dev')]) if (d.dataset.id !== 'transport') rack.appendChild(d);
      if (ph) rack.insertBefore(wTr.root, rack.firstElementChild);            // … and it goes back to the TOP of the one rack
      document.body.classList.remove('rack-hidden'); saveSettings();
    },
    /** an INFO panel's digest: every readout, the status, and the module's own table — as text for the notebook */
    digest(id) {
      const dev = document.querySelector('.dev[data-id="' + id + '"]'); if (!dev) return '';
      const lines = ['λWAVES · ' + dev.querySelector('.dev-title').textContent + ' · t = ' + clock.t.toFixed(4) + ' · ' + new Date().toISOString()];
      const st = dev.querySelector('.dev-stat'); if (st && st.textContent.trim()) lines.push('status\t' + st.textContent.trim());
      for (const ro of dev.querySelectorAll('.ro')) { const l = ro.querySelector('.ro-lbl'), v = ro.querySelector('.ro-val'), s = ro.querySelector('.ro-sub'); lines.push([l ? l.textContent.trim() : '', v ? v.textContent.trim() : '', s ? s.textContent.trim() : ''].join('\t')); }
      const extra = DIGESTS[id] ? DIGESTS[id]() : ''; if (extra) lines.push('', extra);
      return lines.join('\n');
    },
    async copyDigest(id) { const t = layout.digest(id); try { await navigator.clipboard.writeText(t); } catch (e) {} const dev = document.querySelector('.dev[data-id="' + id + '"]'); if (dev) { dev.classList.add('copied'); setTimeout(() => dev.classList.remove('copied'), 900); } return t; },
  };
  /** a window's hover hint in the + list and the WINDOW menu: its long title, and its status when it says something (wave 44) */
  const winHint = (d) => { const t = (d.querySelector('.dev-title') || {}).textContent || '', st = ((d.querySelector('.dev-stat') || {}).textContent || '').trim(); return st ? t + '  ·  ' + st : t; };
  const wTr = device({ id: 'transport', eyebrow: 'TRANSPORT', status: '' });
  wTr.root.hidden = true; (rackL || rack).appendChild(wTr.root);
  windowActivity.track(wTr);
  {
    const tb = document.getElementById('rackToggle'); if (tb) tb.addEventListener('click', () => layout.toggleRack());
    /* WAVE 62 · THE SKIP LINKS MOVE FOCUS THEMSELVES.  The anchors are real anchors — without script
       the browser's own fragment jump still lands on a `tabindex="-1"` rack — but in THIS app the
       FRAGMENT IS THE STATE ADDRESS (wave 56 mints `#s=…` and listens on `hashchange`), so writing
       `#rack` into it would push a junk address into the URL and the history for a focus move.
       `readLink()` returns null for a fragment with no `s=` key, so nothing would have broken; the
       address bar is the reason, and one preventDefault is the whole cost. */
    for (const a of document.querySelectorAll('a.skip')) {
      a.addEventListener('click', (e) => { const t = document.querySelector(a.getAttribute('href')); if (!t) return; e.preventDefault(); t.focus(); });
    }
    const peek = document.getElementById('rackPeek');
    if (peek) { peek.addEventListener('pointerenter', () => document.body.classList.add('rack-peek')); }
    /* (the rack's own pointerleave no longer dismisses a peek: Firefox synthesises one when the rack slides, and the window handler above owns peeking now) */
    /* a dock button on the transport itself */
    const tr = document.getElementById('transport');
    /* WAVE 55: the same drawing every floating window's DOCK chip wears — one mark, one meaning, and never
       a text character (glyph.js: iOS answers several of ours with a colour emoji). */
    if (tr) { const b = el('button', 'dock-btn', tr); b.type = 'button';


      chip(b, 'north', 'dock the transport into the rack'); b.title = 'move the transport between the stage and the rack (T)'; b.addEventListener('click', () => layout.dockTransport()); }


    if (tr) {
      const e = el('button', 'mod-exp mod-logo', tr); e.type = 'button';
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
    /* the logo opens FILE · EDIT · WINDOW */
    const title = document.getElementById('title');
    if (title) {
      const bar = el('nav', 'menubar', document.getElementById('lab')); bar.id = 'menubar'; bar.setAttribute('popover','manual');bar.hidden = true;
      /* OPTIMIZATION 2026-09-24 · N1 · THE ROWS CALL FUNCTIONS (AUDIT-E FE1, REFUTE-D/F).  They used to reach controls
         by LABEL (`clickTrig`: the first `.trig` in document order with that text) and by KEY CODE (`runKey`: the first
         ctrl-less action bound to a code), and three rows were wrong on a first visit: RESEED ran `camReset` (the
         camera snapped home, no particles), RESET KEYS clicked a trigger deleted in 5f6421e, and CLEAR pressed one of
         five CLEARs — the undo ring's once HISTORY floated.  Every row now names its act: an ACTION by id (run with
         fine = 1, as a bare key press runs it) or a named function, and its key hint is read from the live binding
         (keyFor), so a rebind renames the row (ANTI-PATTERN 6). */
      const runAction = (id) => { const a = ACTIONS.find((x) => x.id === id); if (a) a.run(1); };
      const keyFor = (id) => { const a = ACTIONS.find((x) => x.id === id); return a ? keyName(a) : ''; };
      const MENUS = {
        FILE: () => [['NEW project', () => layout.projects.requestFresh()], ['SAVE project' + (layout.projects.current ? '  ' + layout.projects.current : '…') + '\t' + keyFor('save'), () => { if (layout.projects.current) layout.projects.save(); else { layout.notebook.open('projects'); } }], ['SAVE project AS…\t' + keyFor('saveAs'), () => layout.notebook.open('projects')], ['OPEN a project…', () => layout.notebook.open('projects')],
          ...layout.projects.recent().slice(0, 5).map((p) => ['↺  ' + p, () => layout.projects.requestOpen(p)]),
          null,
          ['EXPORT project (.json)', () => document.querySelector('.pj-export').click()], ['IMPORT project (.json)…', () => document.querySelector('.pj-import input').click()],
          null,
          ['SAVE the experiment (quick)', () => save()], ['LOAD the last quick save', () => restore()], ['COPY as JSON', () => copyJSON()],
          ['COPY a LINK to this state', () => copyLink(), null, 'a URL that reopens this exact state — the STATE card says how long it is and what format v1 could not carry (the MOLECULE panel and the MODULATION rack)']],
        EDIT: () => [['UNDO\t' + keyFor('undo'), () => historyApi.undo(), () => !historyApi.canUndo], ['REDO\t' + keyFor('redo'), () => historyApi.redo(), () => !historyApi.canRedo], ['HISTORY UNDO\t' + keyFor('historyUndo'), () => historyApi.historyUndo(), () => !historyApi.canHistoryUndo, 'return once to the timeline that existed before the last history-row jump'], ['UNDO HISTORY…', () => layout.raise('history')], null,
          ['PLAY / PAUSE\t' + keyFor('play'), () => runAction('play')], ['NORMALIZE', () => normalizeNow()], ['CLEAR the register', () => clearRegister()], ['RESET the view\t' + keyFor('camReset'), () => resetView()], ['RESEED the particles\t' + keyFor('reseed'), () => runAction('reseed')], null, ['RESET the key bindings', () => __LW_hooks.keys.reset()], ['SETTINGS…\t' + keyFor('settings'), () => layout.raise('settings')]],


        VIEW: () => [['INVERT the cloud \u2014 ink, not light', () => LW.setInvert(!mat.invert), null, 'draw the cloud as ink rather than light; the transfer is inverted and ψ is not touched'], ['ρ = |ψ|²  density', () => LW.setView('density')], ['arg ψ  phase\t' + keyFor('view') + ' cycles', () => LW.setView('phase')], ['Re ψ', () => LW.setView('real')], ['Im ψ', () => LW.setView('imag')], ['Δρ  difference', () => LW.setView('diff')], ['Re + Im  superposed (heuristic)', () => LW.setView('reim')],
          ['— style: CLOUD\t' + keyFor('style') + ' cycles', () => LW.setStyle('cloud')], ['— style: SOLID', () => LW.setStyle('solid')], ['— style: GRAIN', () => LW.setStyle('grain')], ['— style: SIGNED', () => LW.setStyle('signed')], ['— style: BANDS', () => LW.setStyle('bands')],
          ['STAGE CAPTIONS  on / off', () => ui.capSw && ui.capSw.root.click()], ['STATUS TAGS  on / off', () => ui.badgesSw && ui.badgesSw.root.click()], ['CONTROL HINTS  on / off', () => ui.controlHintsSw && ui.controlHintsSw.root.click()], ['HIDE the interface\t' + keyFor('hideUI'), () => runAction('hideUI')], ['FULL SCREEN / back\t' + keyFor('fullscreen'), () => toggleFullscreen()]],


        WINDOW: () => [['MODULATION\t' + keyFor('modWin'), () => layout.modulation.toggle()], ['NOTEBOOK\t' + keyFor('notebook'), () => layout.notebook.toggle()], ['HIDE / SHOW the rack\t' + keyFor('rack'), () => layout.toggleRack()], ['DOCK / UNDOCK the transport\t' + keyFor('dock'), () => layout.dockTransport()], ['HIDE the interface\t' + keyFor('hideUI'), () => runAction('hideUI')], ['SHOW / HIDE help\t' + keyFor('notes'), () => runAction('notes')], null, ['THEME · LIGHT', () => __LW_hooks.setTheme && __LW_hooks.setTheme('light')], ['THEME · DARK', () => __LW_hooks.setTheme && __LW_hooks.setTheme('dark')], ['THEME · SYSTEM', () => __LW_hooks.setTheme && __LW_hooks.setTheme('system')], null,
          ...[...document.querySelectorAll('.dev:not([hidden])')].map((d) => [(d.classList.contains('closed') ? '⊕  ' : '↑  ') + d.querySelector('.dev-eyebrow').textContent, () => layout.raise(d.dataset.id), null, winHint(d)])],


        ABOUT: () => [['ABOUT λWAVES', () => layout.notebook.open('about')], ['KEYBOARD SHORTCUTS…\t' + keyFor('keysheet'), () => layout.keymap.toggle()], ['SETTINGS…\t' + keyFor('settings'), () => layout.raise('settings')], null, ['UPDATE APP', () => swClient.refresh(), null, 'check for a new build, rebuild the offline cache, and reload']],
      };
      let openList = null;
      const closeLists = () => { for (const l of bar.querySelectorAll('.mb-list')) l.hidden = true; for (const b of bar.querySelectorAll('.mb-btn')) b.setAttribute('aria-expanded', 'false'); openList = null; };


      const LOGO_SCALE = 1.04;
      /* ── WAVE 62 · THE OPENER IS OPERABLE, AND IT IS A DISCLOSURE, NOT AN ARIA MENUBAR ────────────
       * A conformant role="menubar" needs role="menu"/"menuitem", a roving tabindex across five chips,
       * Left/Right between menus with the open list following, Up/Down within, Home/End, first-letter
       * typeahead, Escape at two levels, aria-haspopup, focus return — and, decisively, menu items must
       * be UNREACHABLE BY TAB, which means rewriting fill() and every item handler.  That is days, and
       * it earns nothing here, because the bar is a DUPLICATE surface: THEME is a seg in SETTINGS,
       * raise() is duplicated by #rackAdd, the project verbs are in the notebook's PROJECTS face, and
       * everything else has a key.  What was actually broken is that a <div> opener cannot be reached
       * at all — so #title becomes operable WITHOUT becoming a <button> (it carries the wordmark, the
       * nine-square SVG, the subtitle and wave 53's menu-open scale, all of which UA button styling
       * would drag on), the bar takes focus on open, and Tab walks the rest, because Tab IS the
       * disclosure pattern's own answer and arrows without the rest of the contract are worse. */
      title.tabIndex = 0;
      title.setAttribute('role', 'button');
      title.setAttribute('aria-haspopup', 'true');
      title.setAttribute('aria-expanded', 'false');
      title.setAttribute('aria-label', 'λWAVES — the FILE, EDIT, VIEW, WINDOW and ABOUT menus');
      /* `bar.hidden` is written in exactly ONE place (wave 53 made barShown the single point of truth
         for the open state), so `aria-expanded` can only be written there too and can never disagree. */


      const barShown = (v) => { const want = document.body.classList.contains('phone') ? true : !!v;
        bar.hidden = !want;if(want&&!bar.matches(':popover-open'))bar.showPopover();else if(!want&&bar.matches(':popover-open'))bar.hidePopover(); title.classList.toggle('menu-open', want); title.setAttribute('aria-expanded', String(want)); };
      for (const name of Object.keys(MENUS)) {
        const grp = el('div', 'mb-group', bar);
        const btn = el('button', 'mb-btn', grp, name); btn.type = 'button';
        btn.setAttribute('aria-haspopup', 'true'); btn.setAttribute('aria-expanded', 'false');
        const list = el('div', 'mb-list', grp); list.hidden = true;
        const fill = () => { list.innerHTML = ''; for (const entry of MENUS[name]()) { if (!entry) { const sep = el('div', 'mb-sep', list); sep.setAttribute('role', 'separator'); continue; } const [label, run, dis, hint] = entry; const it = el('button', 'mb-item', list); const kk = label.split('\t'); el('span', 'mb-lbl', it, kk[0]); if (kk[1]) el('span', 'mb-key', it, kk[1]); it.type = 'button'; if (hint) it.title = hint; if (dis && dis()) it.disabled = true;
          /* N1 · A ROW THAT THROWS STILL CLOSES THE MENU.  `.click()` on a trigger swallowed a listener's exception
             (dispatch reports it and returns), so the close below always ran; a direct call propagates, so the close and
             the focus hand-back sit in a `finally`.  Focus returns to the opener only if it was left on the vanished
             item (or on nothing): an act that moved focus on purpose (the keyboard editor, the notebook) keeps it. */
          it.addEventListener('click', (e) => { e.stopPropagation(); try { run(); } finally { closeLists(); barShown(false); const f = document.activeElement; if (!f || f === document.body || bar.contains(f)) title.focus({ preventScroll: true }); } }); } };
        btn.addEventListener('click', (e) => { e.stopPropagation(); const was = openList === list; closeLists(); if (!was) { fill(); list.hidden = false; btn.setAttribute('aria-expanded', 'true'); openList = list; } });
        btn.addEventListener('pointerenter', (e) => { if (e.pointerType === 'touch' || !openList || openList === list) return; closeLists(); fill(); list.hidden = false; btn.setAttribute('aria-expanded', 'true'); openList = list; });
      }
      let barTimer = 0;
      /* THE BAR IS PLACED FROM THE GEOMETRY THE SCALE CANNOT MOVE.  The logo grows from `left center`, so its left
         edge and its vertical centre are invariant under the transform while the 120 ms runs; the right edge is the
         untransformed width times the scale.  Measuring r.right instead would put the chips wherever the transition
         happened to be on the frame the menu opened. */
      const showBar = (focusIt) => { clearTimeout(barTimer); barShown(true); const r = title.getBoundingClientRect();
        bar.style.left = (r.left + title.offsetWidth + 8) + 'px';   /* WAVE 79 DELETED THE ENLARGE AND THIS TERM OUTLIVED IT: with nothing scaling, the FINAL right edge IS the plain one, and the LOGO_SCALE factor reserved 11 px for chips whose law is 8 */ bar.style.top = (r.top + r.height / 2 - bar.offsetHeight / 2) + 'px';
        /* the bar is appended to #lab AFTER both racks, so its DOM position would put it 400 stops away.
           Moving focus into it on a keyboard open is what makes that position irrelevant — and it is
           only ever done for the KEYBOARD, so a pointer hover never steals the seat under the hand. */
        if (focusIt) { const first = bar.querySelector('.mb-btn'); if (first) first.focus(); } };
      /* wave 106: the phone crossing needs to PLACE the bar, not merely un-hide it — `barShown` above
         only writes `hidden`, and the left/top are computed here from the logo's live rect.  Exposed
         rather than duplicated, so there is one placement in the file and the phone uses it. */
      __LW_hooks.showMenuBar = () => showBar(false);
      const hideBarSoon = () => { clearTimeout(barTimer); barTimer = setTimeout(() => { if (!openList) barShown(false); }, 400); };
      title.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') showBar(); });
      title.addEventListener('click', () => { if (bar.hidden) showBar(); else { closeLists(); barShown(false); } });
      title.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.code !== 'Enter' && e.code !== 'NumpadEnter') return;   // wave 88: Space is the transport's — a numeric keypad's Return is 'NumpadEnter'
        e.preventDefault();
        if (bar.hidden) showBar(true); else { closeLists(); barShown(false); }
      });
      title.addEventListener('pointerleave', hideBarSoon);
      bar.addEventListener('pointerenter', () => clearTimeout(barTimer));
      bar.addEventListener('pointerleave', hideBarSoon);


      const rackToggleEl = () => document.getElementById('rackToggle');
      document.addEventListener('pointerdown', (e) => { const rt = rackToggleEl();
        if (!bar.hidden && !bar.contains(e.target) && !title.contains(e.target) && !(rt && rt.contains(e.target))) { closeLists(); barShown(false); } });
      layout.menu = { open: showBar, close: () => { closeLists(); barShown(false); }, get isOpen() { return !bar.hidden; },
        get scale() { return LOGO_SCALE; }, get enlarged() { return title.classList.contains('menu-open'); } };
    }


    /* ── WAVE 106 · THE KEYBOARD MANUAL, and why it is a second thing beside the sheet ──────────────
     * The '?' sheet of wave 53 was a LIST you read; this is a PICTURE of the board you edit on — every bound
     * key lit in its own place, so "what is still free" is a glance rather than a search through forty
     * rows. The board and the searchable action list share __LW_hooks.keys rather than copying the
     * binding table: the editor calls keys.bind()/reset(), then re-reads keys.actions in the same
     * tick. Escape closes it, as it closes the sheet. */
    {
      const km = el('div', '', document.getElementById('lab')); km.id = 'keymap'; km.hidden = true;
      km.setAttribute('aria-label', 'Keyboard shortcuts window');
      let returnFocus = null;
      const keymapMoved = () => { occludeDirty = true; schedule(TIER.PRESENT); };
      const man = createKeymap(km, {
        get actions() { return __LW_hooks.keys ? __LW_hooks.keys.actions : []; },
        bind(id, spec, options) { return __LW_hooks.keys.bind(id, spec, options); },
        conflicts(id, spec) { return __LW_hooks.keys.conflicts(id, spec); },
        reset() { return __LW_hooks.keys.reset(); }
      }, { onMove: keymapMoved, onClose() {
        km.hidden = true;
        keymapMoved();
        if (returnFocus && returnFocus.isConnected) returnFocus.focus();
      } });
      // The editor owns a second hidden root and its recording lifecycle. Showing only
      // the host left a blank modal and a key listener whose isOpen guard never passed.
      const open = () => { returnFocus = document.activeElement; km.hidden = false; man.open(); man.root.querySelector('button').focus(); return true; };
      const close = () => { man.close(); return false; };
      /* ONE ROAD: a rebind anywhere (keys.bind, keys.reset) ends in ui.keysRefresh(), so the manual hangs off that
         rather than owning a second notification of its own.  (It used to chain onto a no-op stub left by the
         SETTINGS KEYS panel 5f6421e deleted: optimization N4.) */
      ui.keysRefresh = () => { if (!km.hidden) man.refresh(); };
      layout.keymap = { open, close, toggle() { return km.hidden ? open() : close(); }, get isOpen() { return !km.hidden; } };
      layout.keysheet = layout.keymap;   // the '?' LIST sheet of wave 53 is gone; the manual is the one bindings surface
    }
    /* LEAN (2026-09-18, the commissioner: "hide all of those visible texts and info").  Any window that carries model
       notes or readouts gets one header button, Aa: pressed, the window keeps its controls, ladders and plots and drops
       its paragraphs and readout tiles; the header's status line stays, so the window still says what it is doing.
       Remembered per window in this browser.  A presentation choice only — nothing is computed differently. */
    const LEAN_KEY = 'lw.lean.v1';
    let leanSet = new Set(), firstLean = true; try { const saved = localStorage.getItem(LEAN_KEY); firstLean = saved === null; leanSet = new Set(JSON.parse(saved || '[]')); } catch (e) { leanSet = new Set(); }
    const setLean = (d, on) => { d.classList.toggle('lean', on); const b = d.querySelector('.dev-lean'); if (b) { b.setAttribute('aria-pressed', String(on)); b.classList.toggle('on', on); }
      if (on) leanSet.add(d.dataset.id); else leanSet.delete(d.dataset.id); try { localStorage.setItem(LEAN_KEY, JSON.stringify([...leanSet])); } catch (e) { /* private mode: the choice lasts the session */ }
      schedule(TIER.PRESENT); };
    for (const d of document.querySelectorAll('.dev')) {
      if (!d.querySelector('.dev-body .note, .dev-body .ro')) continue;
      const util = d.querySelector('.dev-util'); if (!util) continue;
      const b = el('button', 'dev-lean', null, 'Aa'); b.type = 'button'; b.title = 'Hide or show this window’s notes and readouts — the controls, ladders and plots stay';
      b.setAttribute('aria-label', 'hide or show notes and readouts'); b.setAttribute('aria-pressed', 'false'); util.insertBefore(b, util.firstChild);
      b.addEventListener('click', (e) => { e.stopPropagation(); setLean(d, !d.classList.contains('lean')); });
      if (firstLean || leanSet.has(d.dataset.id)) setLean(d, true);
    }
    /* the taxonomy on every card: INFO panels get ⧉ COPY; CONTROL and OTHER start folded */
    for (const d of document.querySelectorAll('.dev')) {
      const kind = KIND[d.dataset.id] || 'other'; d.dataset.kind = kind;
      if (kind === 'info' || d.dataset.id === 'field') { const util = d.querySelector('.dev-util'); const b = el('button', 'dev-copy', util, '⧉'); b.type = 'button'; b.title = 'Copy this panel as text'; b.setAttribute('aria-label', 'copy this panel as text'); util.insertBefore(b, util.querySelector('.dev-fold')); b.addEventListener('click', (e) => { e.stopPropagation(); layout.copyDigest(d.dataset.id); }); }
      if ((kind === 'control' || kind === 'other') && !d.classList.contains('folded')) { const f = d.querySelector('.dev-fold'); if (f) f.click(); }
    }
    document.addEventListener('devclose', () => saveSettings());
    /* the + under the hide button: a list of closed windows to reopen (into the rack they came from) */
    {
      const add = document.getElementById('rackAdd'), list = document.getElementById('rackAddList');
      if (add && list) {
        chip(add, 'plus', 'reopen a closed window');   // wave 55: glyph.js's own chip, "for ADD COLOUR and any other 'one more of these' chip"
        const addShown = (v) => { list.hidden = !v; add.setAttribute('aria-expanded', String(!!v)); };
        add.setAttribute('aria-haspopup', 'true'); add.setAttribute('aria-expanded', 'false');


        let queue = [];
        const renumber = () => {
          for (const b of list.querySelectorAll('.mb-item')) {
            const k = queue.indexOf(b.dataset.win);
            b.classList.toggle('queued', k >= 0);
            let n = b.querySelector('.mb-num');
            if (k < 0) { if (n) n.remove(); continue; }
            if (!n) { n = el('span', 'mb-num', b); }
            n.textContent = String(k + 1);
          }
        };
        const clearQueue = () => { queue = []; renumber(); };
        const flushQueue = () => {
          if (!queue.length) return false;
          /* ⚠ OPENED IN REVERSE, SO THE NUMBERS READ DOWN THE RACK.  `layout.reopen` PREPENDS each
             window to the top of its rack, so replaying the pick order puts the FIRST one chosen at
             the BOTTOM — measured: picking slice · shadow · vortex left the rack reading shadow,
             vortex, slice.  Walking the queue backwards makes the badge order and the rack order the
             same list, which is the only reading of "remember the order" a user can actually see. */
          const ids = queue.slice(); clearQueue(); addShown(false);
          for (let i = ids.length - 1; i >= 0; i--) layout.reopen(ids[i], 'R');
          return true;
        };
        add.addEventListener('click', (e) => {
          e.stopPropagation(); if (!list.hidden) { clearQueue(); addShown(false); return; }
          list.innerHTML = ''; clearQueue();


          const favIds = (() => {
            const m = readSettings().layouts || {};
            let best = null, at = -1;
            for (const k of Object.keys(m)) { const L = m[k]; if (L && (L.at || 0) > at) { at = L.at || 0; best = L; } }
            if (!best || !Array.isArray(best.cards)) return null;
            return new Set(best.cards.filter((c) => !c.closed).map((c) => c.id));
          })();
          const nameOf = (d) => (d.querySelector('.dev-eyebrow').textContent || d.dataset.id || '').trim();
          const closed = [...document.querySelectorAll('.dev.closed:not([hidden])')]
            .sort((a, b) => nameOf(a).localeCompare(nameOf(b), undefined, { sensitivity: 'base' }));
          if (!closed.length) el('div', 'rack-add-none', list, 'nothing is closed — × on a window closes it');
          for (const d of closed) {
            const it = el('button', 'mb-item', list, '⊕  ' + d.querySelector('.dev-eyebrow').textContent);
            it.type = 'button'; it.dataset.win = d.dataset.id;
            if (favIds && favIds.has(d.dataset.id)) {
              const st = el('span', 'mb-fav', it, '★');
              st.title = 'Included in the most recently saved layout';
              st.setAttribute('aria-label', 'in the saved favourite layout');
            }
            it.title = winHint(d) + '  ·  SHIFT-click to queue several; they open in the order you picked them when you let SHIFT go';
            it.addEventListener('click', (ev) => {
              ev.stopPropagation();
              if (ev.shiftKey) {
                const i = queue.indexOf(d.dataset.id);
                if (i >= 0) queue.splice(i, 1); else queue.push(d.dataset.id);
                renumber(); return;
              }
              clearQueue(); layout.reopen(d.dataset.id, 'R'); addShown(false);
            });
          }
          addShown(true);
        });
        /* the COMMIT.  `key` rather than `code`, so either Shift answers. */
        window.addEventListener('keyup', (ev) => { if (ev.key === 'Shift' && !list.hidden) flushQueue(); });
        document.addEventListener('pointerdown', (ev) => { if (!list.hidden && !list.contains(ev.target) && ev.target !== add) { clearQueue(); addShown(false); } });
        layout.addMenu = { open: () => { add.click(); return true; }, close: () => { clearQueue(); addShown(false); return true; }, get shown() { return !list.hidden; },
          /* the queue, readable — a gate should not have to infer an order from four animations */
          get queued() { return queue.slice(); }, commit: flushQueue };
      }


      const favBtn = document.getElementById('rackFav'), favList = document.getElementById('rackFavList');
      if (favBtn && favList) {
        const draw = () => {
          favList.innerHTML = '';
          const saved = layout.layouts();
          const save = el('button', 'mb-item', favList, '☆  SAVE LAYOUT' + (saved.length >= LAYOUT_SLOTS ? '  ·  replaces the oldest' : ''));
          save.type = 'button'; save.title = 'Save the current window arrangement';
          save.addEventListener('click', (ev) => { ev.stopPropagation(); layout.saveLayout(); draw(); });
          el('div', 'rack-fav-head', favList, saved.length ? 'LOAD LAYOUT' : 'nothing saved yet');
          for (const L of saved) {
            const it = el('button', 'mb-item', favList, '⊙  ' + L.label);
            it.type = 'button'; it.title = 'Restore this window layout';
            const x = el('span', 'fav-x', it, '×'); x.title = 'forget this layout';
            it.addEventListener('click', (ev) => { ev.stopPropagation(); if (ev.target === x) { layout.forgetLayout(L.slot); draw(); return; } layout.loadLayout(L.slot); favShown(false); });
          }
          return saved.length;
        };
        const favShown = (v) => { favList.hidden = !v; favBtn.setAttribute('aria-expanded', String(!!v)); };
        favBtn.setAttribute('aria-haspopup', 'true'); favBtn.setAttribute('aria-expanded', 'false');
        favBtn.addEventListener('click', (e) => { e.stopPropagation(); if (!favList.hidden) { favShown(false); return; } list.hidden = true; draw(); favShown(true); });
        document.addEventListener('pointerdown', (ev) => { if (!favList.hidden && !favList.contains(ev.target) && ev.target !== favBtn) favShown(false); });
        layout.favMenu = { open: () => { list.hidden = true; draw(); favShown(true); return true; }, close: () => { favShown(false); return true; },
          get shown() { return !favList.hidden; }, get items() { return [...favList.querySelectorAll('.mb-item')].map((b) => b.textContent); }, redraw: draw };
      }
    }
    /* ── THE NOTEBOOK: a free glass over the stage; its ⓘ flips it into the ABOUT face ── */
    const nb = document.getElementById('notebook');
    if (nb) {
      const NB_KEY = 'lambdawaves.q0.notebook', NB_TITLE = 'lambdawaves.q0.notebook.title', NB_SUBTITLE = 'lambdawaves.q0.notebook.subtitle', PJ_KEY = 'lambdawaves.q0.projects';
      const ta = nb.querySelector('.nb-text'), view = nb.querySelector('.nb-view'), titleIn = nb.querySelector('.nb-title'), subIn = nb.querySelector('.nb-subtitle'), faces = { notes: nb.querySelector('.nb-notes'), about: nb.querySelector('.nb-aboutface'), projects: nb.querySelector('.nb-projectsface') };
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
      /* ── PROJECTS: sessions in folders, a recent list, the notebook as each one's landing page ── */
      const pjRead = () => { try { return readProjectCollection(localStorage, PJ_KEY); } catch (e) { pjStatus('projects unavailable — ' + e.message + '. Stored data was left untouched.'); return null; } };
      const pjWrite = (P) => { try { localStorage.setItem(PJ_KEY, JSON.stringify(P)); return true; } catch (e) { pjStatus('save failed — ' + e.message); return false; } };
      let pjCurrent = null, pjBaseline = null;
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
        const seats = {
          'observer.yaw': [pr.obs, 'yaw'], 'observer.pitch': [pr.obs, 'pitch'],
          'observer.dist': [pr.obs, 'dist'], 'observer.fov': [pr.obs, 'fov'],
          'material.stage': [pr.ui.stage, 'mix'], 'material.gamma': [pr.mat, 'gamma'],
          'material.exposure': [pr.mat, 'exposure'], 'material.softness': [pr.mat, 'softness'],
          'material.hue': [pr.mat, 'hueShift'], 'material.iso': [pr.mat, 'iso'],
          'material.grain': [pr.mat, 'grain'], 'material.knee': [pr.mat, 'knee'],
          'material.slice.pos': [pr.mat.slice, 'pos'], 'material.slice.thick': [pr.mat.slice, 'thick'],
          'transport.rate': [data.experiment, 'rate'],
          'state.rot.z': [pr.rotationRates, 'z'], 'state.stark.kz': [pr.rotationRates, 'kz'],
          'state.defect.l2': [pr.rotationRates, 'def'], 'state.rabi': [pr.ab, 'omega'],
        };
        for (const [id, seat] of Object.entries(seats)) if (seat[0] && Number.isFinite(bases[id])) seat[0][seat[1]] = bases[id];
        return data;
      }
      function projectKey() {
        const data = projectSnapshot(), pr = data.presentation;
        delete pr.quality.autoScale;
        /* THE DAW KEYS THAT DO NOT DIRTY A PROJECT: moving a window, the modulation window's placement, the
           camera's feel, the theme and stage, the notebook's size are saved WITH the project but a demo-maker
           dragging a window is not "unsaved work". The overlays and the A/B transition are content and do count. */
        delete pr.layout; delete pr.modwin; delete pr.camera; delete pr.ui; delete pr.notebook;
        if (pr.domain.auto) delete pr.domain.half; // computed during rebuild, not a project edit
        return JSON.stringify([data, titleIn.value, subIn ? subIn.value : '', ta.value]);
      }
      const projectClean = () => { pjBaseline = projectKey(); };
      const projectDirty = () => pjBaseline !== null && projectKey() !== pjBaseline;
      function discardProject(action) {
        return !projectDirty() || window.confirm(action + ' WITHOUT SAVING?\nYour unsaved project changes will be lost. Cancel to save them first.');
      }
      addEventListener('beforeunload', (e) => {
        if (!projectDirty()) return;
        e.preventDefault(); e.returnValue = '';
      });
      /* wave 62 · ONE of the at most THREE live regions in this document (#banner's role="alert" is
         another).  It changes once per user act — a save, an open, an import — which is exactly what a
         status region is for, and is why the 107 readouts must never become one. */
      { const st = nb.querySelector('.pj-status'); if (st) st.setAttribute('role', 'status'); }
      const pjStatus = (t) => { const s = nb.querySelector('.pj-status'); if (s) s.textContent = t; };
      const pjTouch = (P, path, key) => { P.recent = [path, ...(P.recent || []).filter((p) => p !== path)].slice(0, 8); };
      const projects = {
        list() { const P = pjRead(); return Object.values(P ? P.items : {}).sort((a, b) => (b.saved || '').localeCompare(a.saved || '')); },
        recent() { const P = pjRead(); return P ? (P.recent || []).filter((p) => Object.hasOwn(P.items, p)) : []; },
        get current() { return pjCurrent; },
        get dirty() { return projectDirty(); },
        markClean: projectClean,
        requestOpen(path) { return discardProject('OPEN') && projects.open(path); },
        requestFresh() { return discardProject('START A NEW PROJECT') && projects.fresh(); },
        save(path) {
          path = String(path || pjCurrent || '').trim().replace(/^\/+|\/+$/g, ''); if (!path) return false;
          const i = path.lastIndexOf('/'), folder = i < 0 ? '' : path.slice(0, i), name = i < 0 ? path : path.slice(i + 1);
          const P = pjRead(); if (!P) return false; const now = new Date().toISOString();
          Object.defineProperty(P.items, path, { configurable: true, enumerable: true, writable: true, value: { path, folder, name, saved: now, opened: Object.hasOwn(P.items, path) ? P.items[path].opened : now, data: projectSnapshot(), notebook: { title: titleIn.value === 'NOTEBOOK' ? name : titleIn.value, subtitle: subIn ? subIn.value : '', text: ta.value } } });
          pjTouch(P, path); if (!pjWrite(P)) return false; pjCurrent = path; pjStatus('saved ' + path); if (titleIn.value === 'NOTEBOOK') { titleIn.value = name; } projectClean(); renderProjects(); return true;
        },
        open(path) {
          const P = pjRead(), it = P && Object.hasOwn(P.items, path) ? P.items[path] : null; if (!it) return false;
          /* wave 48: a project load rebuilds the register, the operator and the field — BUSY work */
          /* M5b (2026-09-24): the instrument as it stands, taken before the file touches it — the SAME road a saved project
             takes (serialize → JSON → restore) — and whether it was clean, so a failed open can hand both back. */
          const before = JSON.parse(JSON.stringify(serialize())), baseline = pjBaseline, wasClean = !projectDirty();
          let restored = false, back = true;
          busy.n++; busySync(); try { restored = restore(it.data, { project: true }); if (!restored) { try { back = restore(before) === true; } catch (_) { back = false; } } } finally { busy.n = Math.max(0, busy.n - 1); busySync(); }
          /* OPTIMIZATION 2026-09-24 · M5 · A FAILED OPEN COMMITS NOTHING OF ITS OWN.  restore() answers false when the file's
             data threw half-way (importText checks only the envelope), and this used to carry on regardless: the
             notebook keys, `recent`, `current` = the broken path and a CLEAN mark over the half-applied state, so a
             plain Ctrl+S overwrote the stored file with it.  Now the previous project stays current, the notebook and
             the recent list are untouched, nothing is marked clean, and the status says so.
             M5b · …AND THE INSTRUMENT COMES BACK.  A half-applied state left current was one Ctrl+S away from overwriting the
             PREVIOUS project (measured), so the pre-open snapshot is restored through the same road and the pre-open
             dirty state re-applied: clean if it was clean, dirty against the old baseline if it was not.  If even the
             roll-back fails, nothing is current, so no SAVE can land on a file — and the status says that too. */
          if (!restored) {
            if (back) { if (wasClean && baseline !== null) projectClean(); else pjBaseline = baseline; pjStatus('open failed ' + path + ' — the previous state is back'); }
            else { pjCurrent = null; pjStatus('open failed ' + path + ' — the previous state could not be put back; nothing is current, SAVE AS to keep this'); }
            return false;
          }
          ta.value = it.notebook.text || ''; titleIn.value = it.notebook.title || it.name;
          if (subIn) { subIn.value = (it.notebook && it.notebook.subtitle) || ''; subIn.hidden = !subIn.value; }
          try { localStorage.setItem(NB_KEY, ta.value); localStorage.setItem(NB_TITLE, titleIn.value); if (subIn) localStorage.setItem(NB_SUBTITLE, subIn.value); } catch (e) {}
          it.opened = new Date().toISOString(); pjTouch(P, path); const remembered = pjWrite(P); pjCurrent = path; pjStatus('opened ' + path + (remembered ? '' : ' — recent history could not be saved'));
          projectClean(); show('notes'); nb.dataset.mode = 'view'; render();                         // the complete notebook, in its scrollable pane
          return true;
        },
        remove(path) { const P = pjRead(); if (!P || !Object.hasOwn(P.items, path)) return false; delete P.items[path]; P.recent = (P.recent || []).filter((p) => p !== path); if (!pjWrite(P)) return false; if (pjCurrent === path) pjCurrent = null; renderProjects(); return true; },
        fresh() { reg.clear(); refSnapshot = null; clock.pause(); clock.reset(); if (ui.scrub) ui.scrub.set(0); shadowView.clearTrail(); dynamics.clearHistory(); particles.resetClock(0); touchState(); ta.value = ''; titleIn.value = 'NOTEBOOK'; if (subIn) { subIn.value = ''; subIn.hidden = true; } try { localStorage.setItem(NB_KEY, ''); localStorage.setItem(NB_TITLE, 'NOTEBOOK'); if (subIn) localStorage.setItem(NB_SUBTITLE, ''); } catch (e) {} pjCurrent = null; if (history) history.clear(); projectClean(); pjStatus('new'); show('notes'); setMode('edit'); return true; },
        exportText(path) { const P = pjRead(), it = P && Object.hasOwn(P.items, path || pjCurrent) ? P.items[path || pjCurrent] : null; return it ? JSON.stringify({ lambdawaves: 'project', version: 1, ...it }, null, 1) : null; },
        importText(text) { const path = storeProjectImport(text, () => JSON.parse(localStorage.getItem(PJ_KEY) || '{"items":{},"recent":[]}'), pjWrite); renderProjects(); return path; },
      };
      function renderProjects() {
        const list = nb.querySelector('.pj-list'); if (!list) return; list.innerHTML = '';
        const items = projects.list(); if (!items.length) { el('div', 'pj-none', list, 'no projects yet — name one above and SAVE AS'); return; }
        const byFolder = new Map(); for (const it of items) { const f = it.folder || '(root)'; if (!byFolder.has(f)) byFolder.set(f, []); byFolder.get(f).push(it); }


        let roots = nb.querySelector('.pj-roots');
        if (!roots) { roots = el('div', 'pj-roots', null); list.parentElement.insertBefore(roots, list); }
        roots.innerHTML = '';
        const path = nb.querySelector('.pj-path');
        for (const f of [...byFolder.keys()].sort((a, b) => a.localeCompare(b))) {
          const c = el('button', 'pj-root', roots, f); c.type = 'button';
          c.title = f === '(root)' ? 'save into no folder' : 'save into ' + f;
          c.addEventListener('click', () => {
            if (!path) return;
            const name = (path.value.split('/').pop() || '').trim();
            path.value = (f === '(root)' ? '' : f + '/') + name;
            path.focus();
          });
        }
        /* …and the group headings sort by NAME.  `[...map.entries()].sort()` with no comparator sorts
           the STRINGIFIED pairs — "demo,[object Object]" — which happened to order by folder but only
           by accident, and case-sensitively.  It is the key, compared as a name. */
        for (const [f, arr] of [...byFolder.entries()].sort((a, b) => a[0].localeCompare(b[0]))) { el('div', 'pj-folder', list, f); for (const it of arr) { const row = el('div', 'pj-item', list); const nm = el('span', 'pj-name', row, it.name + (it.path === pjCurrent ? '  ·  current' : '')); nm.addEventListener('click', () => projects.requestOpen(it.path)); el('span', 'pj-when', row, (it.saved || '').slice(0, 16).replace('T', ' ')); const x = el('button', '', row, '×'); x.title = 'delete this project'; x.addEventListener('click', (e) => { e.stopPropagation(); projects.remove(it.path); }); } }
      }
      nb.querySelector('.pj-save').addEventListener('click', () => { const p = nb.querySelector('.pj-path').value.trim() || pjCurrent; if (p) projects.save(p); else pjStatus('give it a name: folder/name'); });
      /* wave 106: …and the field stops swallowing the save keys.  The dispatcher listens on `window`
         in the BUBBLE phase, so this `stopPropagation` was a second, independent block on Ctrl+S —
         fixing only the early return above would have left it dead here. */
      nb.querySelector('.pj-path').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); nb.querySelector('.pj-save').click(); }
        if (!((e.ctrlKey || e.metaKey) && !e.altKey && (e.code === 'KeyS' || e.code === 'Comma'))) e.stopPropagation(); });
      nb.querySelector('.pj-export').addEventListener('click', () => { const t = projects.exportText(); if (!t) { pjStatus('nothing to export — save first'); return; } const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'application/json' })); a.download = (pjCurrent || 'project').replace(/\//g, '__') + '.lambdawaves.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); });
      nb.querySelector('.pj-import input').addEventListener('change', async (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; try { if (f.size > MAX_PROJECT_BYTES) throw new Error('project file exceeds 8 MiB'); const p = projects.importText(await f.text()); pjStatus('imported ' + p); } catch (err) { pjStatus('import failed: ' + err.message); } e.target.value = ''; });
      /* THE BUNDLED DEMOS (2026-09-11): a project file shipped under lab/demos/, imported through the same road a
         file from disk takes, then opened. Josh's WAVE DANCER is the first. */
      for (const b of nb.querySelectorAll('.pj-demo')) b.addEventListener('click', async () => {
        try { const r = await fetch('./demos/' + b.dataset.file + '.lambdawaves.json', { cache: 'no-cache' }); if (!r.ok) throw new Error('HTTP ' + r.status);
          const p = projects.importText(await r.text()); if (projects.open(p)) pjStatus('opened demo ' + p); }   // M5: a failed open keeps its own status
        catch (err) { pjStatus('demo failed: ' + err.message); }
      });
      nb.querySelector('.nb-projects-btn').addEventListener('click', () => { if (nb.dataset.face === 'projects') show('notes'); else { renderProjects(); const pp = nb.querySelector('.pj-path'); if (pp && pjCurrent) pp.value = pjCurrent; show('projects'); } });
      layout.projects = projects;
      const count = () => { const c = nb.querySelector('.nb-count'); if (c) c.textContent = ta.value.trim() ? ta.value.trim().split(/\s+/).length + ' words · kept in this browser' : 'empty · kept in this browser'; };
      ta.addEventListener('input', () => { nbStore(NB_KEY, ta.value); count(); });
      const ABOUT_DEF_W = 470, ABOUT_DEF_H = 670;
      const NOTES_DEF_W = 640, NOTES_DEF_H = 460;
      const show = (face) => {
        nb.hidden = false; faces.notes.hidden = face !== 'notes'; faces.about.hidden = face !== 'about'; faces.projects.hidden = face !== 'projects'; nb.dataset.face = face;
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


        if (face === 'projects') renderProjects();
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
        const w = Math.round(nb.offsetWidth), h = Math.round(nb.offsetHeight);
        const S = readSettings();
        if (nb.dataset.face === 'about') {
          if (S.abW === w && S.abH === h) return;
          try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...S, abW: w, abH: h })); } catch (e) {}
        } else {
          if (S.nbW === w && S.nbH === h) return;
          try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...S, nbW: w, nbH: h })); } catch (e) {}
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
    /* a hidden rack peeks when the pointer nears its column and goes when it leaves; the playhead
       does the same around whichever seat modDodge currently gives it. */
    /* wave 48: this handler ran getComputedStyle(documentElement) on EVERY pointer move — a style resolution of the
       root, on the pointer's thread, sixty times a second, to read a constant.  --rack-w changes with the viewport
       and with nothing else, so it is read once and on resize.  And a hidden INTERFACE peeks at nothing: the racks
       are display:none under H, so the handler leaves before it touches anything. */
    const peekLast = { x: -1, y: -1, armed: false, bar: false };
    const peekTransport = document.getElementById('transport');
    let rackW = 300;
    const readRackW = () => { rackW = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--rack-w')) || 300; };
    readRackW(); window.addEventListener('resize', readRackW, { passive: true });
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch' || uiHidden || !document.body.classList.contains('rack-hidden')) return;
      if (Math.abs(e.clientX - peekLast.x) < 2 && Math.abs(e.clientY - peekLast.y) < 2) return;   // a synthesised move after a layout change is not the pointer leaving
      peekLast.x = e.clientX; peekLast.y = e.clientY;
      const W = window.innerWidth, H = window.innerHeight, rw = rackW;
      const hasL = rackL && rackL.children.length > 0;
      const near = e.clientX > W - 60 || (hasL && e.clientX < 60);
      const inside = e.clientX > W - rw - 24 || (hasL && e.clientX < rw + 24);
      if (near) { document.body.classList.add('rack-peek'); peekLast.armed = true; } else if (!inside && peekLast.armed) { document.body.classList.remove('rack-peek'); peekLast.armed = false; }   // only a peek this handler armed is its to dismiss
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
    /* ── WAVE 67 · A DRAG WRITES ONCE A FRAME, AND READS NO GEOMETRY IN A POINTER HANDLER ──────────────
     * BOTH window drags — reorder a rack card, and move a floating one — used to do their whole job
     * SYNCHRONOUSLY inside `pointermove`: the reorder measured every other card in the target rack with
     * `getBoundingClientRect()` and then `insertBefore`d, and the float called `getBoundingClientRect()` on
     * both racks and wrote `style.left/top`.  A mouse delivers coalesced moves at 120–1000 Hz, so over a
     * canvas that is already missing frames that is several FORCED STYLE RECALCULATIONS per displayed
     * frame, every one of them thrown away — and a DOM mutation per event on top of it for the reorder.
     * That is why ours felt bad; the mechanism that fixes it is BASINS' `dragHandle` (`window.js:861-874`)
     * and it is taken as a REFERENCE, not copied: a pointermove STORES a delta and schedules, at most one
     * geometry pass happens per frame, and a `setTimeout` FLOOR flushes it anyway if rAF is starved —
     * which is exactly what a busy WebGPU canvas does to rAF.  `flush()` on the end so the finger's LAST
     * position wins, which is the difference between a drop landing where you let go and where the last
     * frame happened to be.  MEASURED (B137): 40 synchronous moves used to force 40+ layouts and now force
     * ZERO, and the window still lands on the last pointer position exactly. */
    /* drag a card by its header to reorder the rack — or across to the other rack */
    let drag = null;
    const racks = [rack, rackL].filter(Boolean);
    /* the rects are read HERE, once a frame, and never in the handler.  They cannot be hoisted to
       pointerdown the way the float's rack rects can: each insertBefore moves every card below it, so the
       geometry this reads is the geometry this pass itself just wrote. */
    const reorderTo = (p) => {
      if (!drag) return;


      const want = (rackL && !document.body.classList.contains('phone') && p.x < window.innerWidth / 2) ? rackL : rack;          // which rack is under the pointer: the left half of the window is the mirror rack — and on a phone there is only one
      const cards = [...want.querySelectorAll('.dev')].filter((d) => d !== drag.card && !d.hidden);
      let ref = null; for (const c of cards) { const r = c.getBoundingClientRect(); if (p.y < r.top + r.height / 2) { ref = c; break; } }
      if (drag.card.parentElement !== want || ref !== drag.card.nextSibling) {


        const before = new Map();
        for (const c of [...want.children, ...(drag.card.parentElement === want ? [] : drag.card.parentElement.children)])
          if (c.classList && c.classList.contains('dev')) before.set(c, c.getBoundingClientRect().top);
        want.insertBefore(drag.card, ref);
        if (!MOTION.reduced) for (const [c, y0] of before) {
          if (c === drag.card) continue;
          const dy = y0 - c.getBoundingClientRect().top;
          if (!dy) continue;
          c.style.transition = 'none'; c.style.transform = 'translateY(' + dy + 'px)';
          requestAnimationFrame(() => { c.style.transition = 'transform .22s cubic-bezier(.23,1,.32,1)'; c.style.transform = ''; });
          setTimeout(() => { c.style.transition = ''; c.style.transform = ''; }, 320);
        }
      }
    };
    const reorderPump = coalesce(reorderTo);
    for (const rk of racks) rk.addEventListener('pointerdown', (e) => {
      const head = e.target.closest('.dev-head'); if (!head || e.target.closest('button')) return;
      const card = head.closest('.dev'); drag = { card, y0: e.clientY, moved: false }; head.setPointerCapture && head.setPointerCapture(e.pointerId);
    });
    window.addEventListener('pointermove', (e) => {
      if (!drag) return;
      if (!drag.moved && Math.abs(e.clientY - drag.y0) < 6) return;
      if (!drag.moved) { drag.moved = true; drag.card.classList.add('dragging'); }


      measureRacks();


      if (!rackUnder(e.clientX) && !document.body.classList.contains('phone')) {
        const card = drag.card, id = card.dataset.id, r = card.getBoundingClientRect();
        drag.card.classList.remove('dragging'); drag = null;
        if (!layout.floating().includes(id)) layout.toggleFloat(id);
        measureRacks();
        fdrag = { card, dx: Math.max(0, Math.min(e.clientX - r.left, r.width)),
                  dy: Math.max(0, Math.min(e.clientY - r.top, 34)),
                  x0: e.clientX, y0: e.clientY, moved: true, rk: null };
        card.classList.add('dragging');
        floatPump.post({ x: e.clientX, y: e.clientY });
        return;
      }
      reorderPump.post({ x: e.clientX, y: e.clientY });
    });
    const endDrag = () => { if (!drag) return; reorderPump.flush(); drag.card.classList.remove('dragging'); drag = null; };
    window.addEventListener('pointerup', endDrag); window.addEventListener('pointercancel', endDrag);

    /* ── WAVE 55 · THE POP-OUT AND ITS RAIL, WIRED ONCE FOR EVERY WINDOW ───────────────────────────
     * device() built the two chips; the act is here, because taking a card off a rack needs the racks,
     * the stage and the phone breakpoint, and the kit knows about none of them.  The TRANSPORT is wired
     * by the same loop and its chip calls `dockTransport()`: one control, one meaning, no second system. */
    for (const d of document.querySelectorAll('.dev')) {
      const pop = d.querySelector('.dev-pop'), rail = d.querySelector('.dev-rail');
      /* WAVE 96 · THE POP CHIP IS RETIRED for rack windows — the drag above does its whole job — but
         it is still WIRED, because the TRANSPORT keeps one as its dock control and because a host
         that un-hides it should get a working button rather than a dead one (ANTI-PATTERN 7 the
         other way round).  The hiding is skin.css's; this is only the act. */
      if (pop) { popFace(d); pop.addEventListener('click', (e) => { e.stopPropagation(); layout.toggleFloat(d.dataset.id); }); }
      if (rail) { railFace(d); rail.addEventListener('click', (e) => { e.stopPropagation(); layout.setCompact(d.dataset.id, !d.classList.contains('compact')); }); }
    }

    /* ── DRAGGING IS BY THE HEADER ALONE ───────────────────────────────────────────────────────────
     * The one thing that would make the instrument unusable is a knob drag that moves the window under
     * the finger, so the grip is the HEADER and not one pixel of the body — and not even all of the
     * header: the chips in it keep their own clicks.  Pointer events throughout, so mouse, pen and touch
     * are the same code path (`.dev-head` already carries `touch-action: none`).
     * A PRESS ANYWHERE ON A FLOATING WINDOW RAISES IT.  That is deliberately separate from the drag test
     * above it: focus follows the press, dragging follows the header. */
    let fdrag = null;
    /* THE RACK RECTS ARE MEASURED ONCE, at the press and on a resize — never in the move handler.  A rack's
       column does not move while a window is being carried over it, so reading it sixty times a second was
       a forced layout bought for nothing (wave 67; the same law as wave 48's --rack-w read). */
    let rackRects = [];
    const measureRacks = () => {
      rackRects = (document.body.classList.contains('rack-hidden') || document.body.classList.contains('phone')) ? []
        : [rack, rackL].filter(Boolean).map((rk) => ({ rk, r: rk.getBoundingClientRect() })).filter((o) => o.r.width > 2);
    };
    const rackUnder = (x) => { for (const o of rackRects) if (x >= o.r.left && x <= o.r.right) return o.rk; return null; };
    const refInRack = (rk, y) => { for (const c of rk.querySelectorAll('.dev')) { const r = c.getBoundingClientRect(); if (r.height && y < r.top + r.height / 2) return c; } return null; };
    const floatTo = (p) => {
      if (!fdrag) return;
      layout.moveFloat(fdrag.card.dataset.id, p.x - fdrag.dx, p.y - fdrag.dy);
      /* DROP BACK ONTO A RACK.  "Returning a window puts it back where it was UNLESS the user dropped it
         somewhere specific" — so a drag that ends over a rack docks THERE, at the slot under the pointer,
         and the rack says so while the finger is over it. */
      const rk = rackUnder(p.x);
      if (rk !== fdrag.rk) { if (fdrag.rk) fdrag.rk.classList.remove('rack-drop'); fdrag.rk = rk; if (rk) rk.classList.add('rack-drop'); }
    };
    const floatPump = coalesce(floatTo);
    if (floats) floats.addEventListener('pointerdown', (e) => {
      const card = e.target.closest('.dev'); if (!card) return;
      raiseFloat(card);
      const head = e.target.closest('.dev-head');
      if (!head || e.target.closest('button')) return;
      const r = card.getBoundingClientRect();
      measureRacks();
      fdrag = { card, dx: e.clientX - r.left, dy: e.clientY - r.top, x0: e.clientX, y0: e.clientY, moved: false, rk: null };
      try { head.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault();
    });
    window.addEventListener('pointermove', (e) => {
      if (!fdrag) return;
      if (!fdrag.moved && Math.abs(e.clientX - fdrag.x0) < 4 && Math.abs(e.clientY - fdrag.y0) < 4) return;
      if (!fdrag.moved) { fdrag.moved = true; fdrag.card.classList.add('dragging'); }
      floatPump.post({ x: e.clientX, y: e.clientY });
    });
    const endFloatDrag = (e) => {
      if (!fdrag) return;
      floatPump.flush();                       // THE FINGER'S LAST POSITION WINS — a drop lands where you let go, not where the last frame was
      const f = fdrag; fdrag = null;
      f.card.classList.remove('dragging');
      if (f.rk) f.rk.classList.remove('rack-drop');
      if (f.moved && f.rk) layout.dockWindow(f.card.dataset.id, { host: f.rk, ref: refInRack(f.rk, e ? e.clientY : 0) });
    };
    window.addEventListener('pointerup', endFloatDrag); window.addEventListener('pointercancel', endFloatDrag);
    /* THE VIEWPORT CAN SHRINK UNDER A FLOATING WINDOW (a rotation, a resized browser), and a header that
       has gone off the edge cannot be grabbed back.  Every float is re-clamped on resize, on the same law
       the drag uses, so a window is never stranded. */
    window.addEventListener('resize', () => { measureRacks(); for (const id of layout.floating()) { const st = floatState.get(id); if (st) placeFloat(devById(id), st.x, st.y); } }, { passive: true });
  }


  const phone = { on: false, applied: false, hooked: false, DPR: 1.5, wasDocked: false, wasRes: 0, wasSteps: 0, wasScale: 0, wasCard: '', wasRackHidden: false, wasFrost: 'off', floats: null };
  function enterPhone() {


    requestAnimationFrame(() => { if (document.body.classList.contains('phone') && __LW_hooks.showMenuBar) __LW_hooks.showMenuBar(); });
    /* ── WAVE 55 · THE PHONE HAS NO FLOATING ───────────────────────────────────────────────────────
       One rack, everything docked: the pop-out chip stands down in CSS at this breakpoint (skin.css §5a)
       and every window that was on the stage goes back on the rack HERE — before the mirror rack is
       folded into the one rack below, so a window whose home is the LEFT rack still makes the trip.
       It is REMEMBERED, because wave 51's law is that crossing the breakpoint is reversible either way:
       a tablet in a stand rotates, and neither turn should cost the user their arrangement. */
    phone.floats = layout.dockAll(true);
    /* ONE RACK, ON THE LEFT.  Everything the mirror rack held joins the one rack, in its own order and at
       the top; each card remembers where it came from so leaving the breakpoint puts it back exactly. */
    if (rackL) for (const d of [...rackL.querySelectorAll('.dev')].reverse()) { d.dataset.phoneFrom = 'L'; rack.insertBefore(d, rack.firstElementChild); }
    /* THE TRANSPORT DOCKS AT THE TOP OF THE RACK, and it is HIDEABLE, NEVER CLOSABLE: the × stands down in
       CSS at this breakpoint, ▾ is the hide, and which way it was left is this browser's to remember. */
    phone.wasDocked = layout.docked;
    if (!layout.docked) layout.dockTransport();
    rack.insertBefore(wTr.root, rack.firstElementChild);
    wTr.root.classList.remove('closed');
    const s = readSettings();
    wTr.fold(s.phoneTr === true);


    phone.wasRackHidden = document.body.classList.contains('rack-hidden');   // the crossing is reversible in BOTH directions (wave 51's law)
    document.body.classList.toggle('rack-hidden', readSettings().phoneRack !== true);
    phone.wasCard = document.body.dataset.card;
    if (!phone.hooked) { phone.hooked = true; const fb = wTr.root.querySelector('.dev-fold'); if (fb) fb.addEventListener('click', () => saveSettings()); }
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
      phone.wasFrost = frostMode; setFrost('off', { quiet: true });
      if (s.keepFrames === undefined) setKeepFrames(false);
      schedule(TIER.REBUILD);
    }
  }
  function leavePhone() {
    /* the crossing is REVERSIBLE in both directions: the cards go back to the rack they came from, the transport
       to the dock state it had, and the grid to the one the phone stepped down from — unless the hand changed it
       in the meantime, in which case the hand wins. */
    document.body.classList.toggle('rack-hidden', !!phone.wasRackHidden);   // wave 59: the phone's default was the PHONE's; the desktop gets back exactly the state it crossed with
    for (const d of [...rack.querySelectorAll('.dev[data-phone-from="L"]')]) { delete d.dataset.phoneFrom; if (rackL) rackL.appendChild(d); }
    if (!cardChosen && phone.wasCard && document.body.dataset.card !== phone.wasCard) applyCard(phone.wasCard);
    if (phone.wasFrost !== 'off' && frostMode === 'off') setFrost(phone.wasFrost, { quiet: true });   // wave 67: the policy the desktop crossed with
    if (layout.docked !== phone.wasDocked) layout.dockTransport();
    if (phone.wasRes && ui.gridSeg && ui.gridSeg.get() === '64') { ui.gridSeg.set(String(phone.wasRes)); quality.res = phone.wasRes; quality.steps = { 64: 110, 96: 160, 128: 240 }[phone.wasRes]; quality.scale = { 64: 0.75, 96: 1, 128: 1 }[phone.wasRes]; }
    /* wave 106: …and the crossing is reversible in the case where the GRID never moved, which is now
       the common one.  Without this the desktop keeps the phone's 110 steps and 0.75 scale for the
       life of the page — the same bug in the other direction, and the one the split above creates
       if only its first half is written. */
    else if (phone.wasSteps) { quality.steps = phone.wasSteps; quality.scale = phone.wasScale; }
    phone.wasSteps = 0; phone.wasScale = 0;
    /* … and what was on the stage goes back to the stage, in the stacking order it had (`body.phone` is
       already off by the time this runs, so `popOut` is allowed to answer again). */
    if (phone.floats) { for (const id of Object.keys(phone.floats).sort((a, b) => (phone.floats[a].z || 0) - (phone.floats[b].z || 0))) layout.popOut(id, phone.floats[id]); phone.floats = null; }
    phone.applied = false;
    if (field.setDprCap) field.setDprCap(2);
    schedule(TIER.REBUILD);
  }
  const tablet = { on: false, DPR: 1.5, steps: 110 };
  const isTablet = () => { try {
    const ipad = /iPad/.test(navigator.userAgent || '') || ((navigator.platform || '') === 'MacIntel' && navigator.maxTouchPoints > 1);
    const coarse = matchMedia('(hover: none) and (pointer: coarse)').matches;
    return !isPhone() && (ipad || (coarse && Math.min(innerWidth, innerHeight) >= 600));
  } catch (_) { return false; } };
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
  layout.phone = { get on() { return phone.on; }, get dprCap() { return field.dprCap; }, get transportFolded() { return wTr.root.classList.contains('folded'); }, get parkedFloats() { return phone.floats ? Object.keys(phone.floats) : []; }, sync: syncPhone };
  layout.tablet = { get on() { return tablet.on; }, get dprCap() { return field.dprCap; }, get stepCap() { return field.stepCap; }, sync: syncPhone };

  /* Stage gestures own pointer lifetimes; these callbacks own the instrument. */
  bindStageGestures(dom.canvas, {
    camera, travel: camTravel, law: CAM,
    getDistance: () => obs.dist, setDistance: setDist, orbitBy, resetView,
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
      if (e.shiftKey && helium && helium.on) {
        helium.placeAt(unproject(e.clientX - r.left, e.clientY - r.top));
        schedule(TIER.RECONSTRUCT);
        return {}; // A placement consumes this pointer until it lifts.
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
     require it (so TAB and Shift+TAB are two actions).  Overrides live in localStorage. ── */
  const LS_KEYS = 'lambdawaves.q0.keys';


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
  const ACTIONS = [
    { id: 'play', label: 'play / pause', key: 'Space', run: () => togglePlay() },
    { id: 'fullscreen', label: 'full screen (the browser) / back', key: 'KeyF', run: () => toggleFullscreen() },
    { id: 'notebook', label: 'notebook (and its ABOUT face)', key: 'KeyJ', run: () => layout.notebook.toggle() },
    /* wave 106: the button's own title says "t → 0  (home)", so the key must BE the button — it was
       clearing neither the shadow trail nor the playhead, so the same advertised act did two different
       things depending on which surface you used. */
    { id: 'home', label: 'time to zero', key: 'Home', run: () => { clock.reset(); if (ui.scrub) ui.scrub.set(0); shadowView.clearTrail(); schedule(TIER.EVOLVE); } },
    { id: 'stepBack', label: 'step time back (shift: fine)', key: 'ArrowLeft', run: (f) => { clock.step(-transport.stepDt() * f); schedule(TIER.EVOLVE); } },
    { id: 'stepFwd', label: 'step time forward (shift: fine)', key: 'ArrowRight', run: (f) => { clock.step(transport.stepDt() * f); schedule(TIER.EVOLVE); } },
    { id: 'zoomIn', label: 'camera closer', key: 'ArrowUp', run: (f) => { setDist(obs.dist / (1 + 0.12 * f)); } },
    { id: 'zoomOut', label: 'camera farther', key: 'ArrowDown', run: (f) => { setDist(obs.dist * (1 + 0.12 * f)); } },
    { id: 'yawL', label: 'camera yaw left', key: 'KeyA', run: (f) => queueKeyOrbit(-0.12 * f, 0) },
    { id: 'yawR', label: 'camera yaw right', key: 'KeyD', run: (f) => queueKeyOrbit(0.12 * f, 0) },
    { id: 'pitchUp', label: 'camera pitch up', key: 'KeyW', run: (f) => queueKeyOrbit(0, 0.12 * f) },
    { id: 'pitchDn', label: 'camera pitch down', key: 'KeyS', run: (f) => queueKeyOrbit(0, -0.12 * f) },
    { id: 'dollyIn', label: 'dolly in', key: 'KeyQ', shift: false, run: (f) => dolly(-1, f) },
    { id: 'dollyOut', label: 'dolly out', key: 'KeyE', shift: false, run: (f) => dolly(1, f) },
    { id: 'povIn', label: 'POV tighter (field of view)', key: 'KeyQ', shift: true, run: () => pov(-1, 1) },
    { id: 'povOut', label: 'POV wider (field of view)', key: 'KeyE', shift: true, run: () => pov(1, 1) },
    { id: 'dollyZoomIn', label: 'dolly zoom in (size held)', key: 'KeyQ', ctrl: true, shift: true, run: () => dollyZoom(-1, 1) },
    { id: 'dollyZoomOut', label: 'dolly zoom out (size held)', key: 'KeyE', ctrl: true, shift: true, run: () => dollyZoom(1, 1) },
    { id: 'camReset', label: 'reset the camera', key: 'KeyR', run: () => resetView() },
    { id: 'axisX', label: 'rotation axis x', key: 'KeyX', run: () => setAxis('x') },
    { id: 'axisY', label: 'rotation axis y', key: 'KeyY', run: () => setAxis('y') },
    { id: 'axisZ', label: 'rotation axis z', key: 'KeyZ', run: () => setAxis('z') },
    { id: 'rotorBoth', label: 'rotor: both (spatial rotation)', key: 'Digit1', run: () => setWhich('both') },
    { id: 'rotorPlus', label: 'rotor: plus alone', key: 'Digit2', run: () => setWhich('+') },
    { id: 'rotorMinus', label: 'rotor: minus alone', key: 'Digit3', run: () => setWhich('−') },
    { id: 'rotorK', label: 'rotor: Runge–Lenz K', key: 'Digit4', run: () => setWhich('K') },
    { id: 'turnNeg', label: 'turn ψ about the axis, −', key: 'BracketLeft', run: (f) => { reg.rotor({ which: keyState.which, axis: keyState.axis, angle: -0.12 * f, t: clock.t }); touchState(); } },
    { id: 'turnPos', label: 'turn ψ about the axis, +', key: 'BracketRight', run: (f) => { reg.rotor({ which: keyState.which, axis: keyState.axis, angle: 0.12 * f, t: clock.t }); touchState(); } },
    { id: 'slap', label: 'impulse along the axis (k = 0.2)', key: 'KeyK', run: (f) => { if (__LW_hooks.slap) __LW_hooks.slap(0.2 * f, keyState.axis); } },
    { id: 'style', label: 'cycle the draw style', key: 'KeyC', run: () => { const order = ['cloud', 'solid', 'grain', 'signed', 'bands']; const nx = order[(order.indexOf(STYLE_NAMES[mat.style]) + 1) % 5]; mat.style = STYLE[nx]; ui.styleSeg.set(nx); schedule(TIER.PRESENT); } },
    { id: 'view', label: 'cycle the observable', key: 'KeyV', run: () => { const order = ['density', 'phase', 'real', 'imag', 'diff', 'reim']; const nx = order[(order.indexOf(VIEW_NAMES[mat.view]) + 1) % 6]; mat.view = VIEW[nx]; ui.viewSeg.set(nx); schedule(TIER.PRESENT); } },
    { id: 'palette', label: 'toggle the phase palette', key: 'KeyP', run: () => { if (palette) palette.setOn(!palette.on); } },
    { id: 'hideUI', label: 'hide / show the interface (the frame and the axes with it)', key: 'KeyH', run: () => toggleUI() },
    { id: 'nextWindow', label: 'next window to the top of the rack (from the stage)', key: 'Tab', shift: false, stage: true, run: () => cycleWindow(1) },
    { id: 'prevWindow', label: 'previous window to the top of the rack (from the stage)', key: 'Tab', shift: true, stage: true, run: () => cycleWindow(-1) },
    { id: 'reseed', label: 'reset the particles', key: 'KeyR', ctrl: true, run: () => { particles.setOn(true); particles.seed(160, reg, clock.t, domain.half); schedule(TIER.PRESENT); } },
    { id: 'keysheet', label: 'the keyboard — edit bindings', key: 'Slash', shift: true, run: () => layout.keymap.toggle() },
    { id: 'notes', label: 'show / hide window help', key: 'KeyN', run: () => { const on = document.body.classList.contains('window-info-off'); if (ui.setWindowInfo) ui.setWindowInfo(on); if (ui.windowInfoSw) ui.windowInfoSw.set(on); } },
    { id: 'rack', label: 'hide / show the rack', key: 'KeyB', run: () => layout.toggleRack() },
    { id: 'dock', label: 'dock / undock the transport', key: 'KeyT', run: () => layout.dockTransport() },
    /* WAVE 65 · the arm and the loop clock's lock.  Both are REBINDABLE and both appear in the keyboard
       editor, which is the visible seat neither could have inside the ported window: its timing bar is
       the artifact's and is not ours to grow (docs/ui/STYLE-LOCK.md, THE PORTED-WINDOW EXCEPTION). */


    { id: 'modArm', label: 'MOD \u2014 the modulation on / off (space then plays both clocks)', key: 'Space', ctrl: true, run: () => setModArm(!modArm) },
    { id: 'modWin', label: 'the modulation window \u2014 open it, or close it again', key: 'KeyM', run: () => layout.modulation.toggle() },
    { id: 'modBar', label: 'lock the modulation loop clock: one bar = one recurrence of the density', key: 'KeyG', run: () => barLock() },
    { id: 'undo', label: 'undo the last edit to ψ or its law', key: 'KeyZ', ctrl: true, shift: false, run: () => historyApi.undo() },
    { id: 'redo', label: 'redo it (Ctrl+Y too)', key: 'KeyZ', ctrl: true, shift: true, run: () => historyApi.redo() },
    { id: 'redoY', label: 'redo (Ctrl+Y)', key: 'KeyY', ctrl: true, shift: false, run: () => historyApi.redo() },
    { id: 'historyUndo', label: 'return from the last history jump', key: 'KeyZ', ctrl: true, alt: true, shift: false, run: () => historyApi.historyUndo() },
    { id: 'settings', label: 'settings', key: 'Comma', ctrl: true, shift: false, run: () => layout.raise('settings') },


    { id: 'save', label: 'save the open project (asks for a name when none is open)', key: 'KeyS', ctrl: true, shift: false,
      run: () => { if (layout.projects && layout.projects.current) layout.projects.save(); else layout.notebook.open('projects'); } },
    { id: 'saveAs', label: 'save the project under a new name', key: 'KeyS', ctrl: true, shift: true,
      run: () => layout.notebook.open('projects') },
  ];
  const DEFAULT_KEYS = Object.fromEntries(ACTIONS.map((a) => [a.id, { key: a.key, ctrl: !!a.ctrl, alt: !!a.alt, shift: a.shift }]));
  /* Saved chords pass the same collision/reservation law as a live edit. Old corrupt
     overrides cannot silently shadow a newer default action. */
  try { const ov = JSON.parse(localStorage.getItem(LS_KEYS) || '{}'); for (const a of ACTIONS) if (ov[a.id]) bindAction(ACTIONS, a.id, ov[a.id]); } catch (_) {}
  function saveKeys() { try { const ov = {}; for (const a of ACTIONS) { const d = DEFAULT_KEYS[a.id]; if (a.key !== d.key || !!a.ctrl !== d.ctrl || !!a.alt !== d.alt || a.shift !== d.shift) ov[a.id] = { key: a.key, ctrl: !!a.ctrl, alt: !!a.alt, shift: a.shift }; } localStorage.setItem(LS_KEYS, JSON.stringify(ov)); } catch (_) {} }
  const MAC = /Mac|iPhone|iPad/.test((navigator.platform || '') + ' ' + (navigator.userAgent || ''));
  function keyName(a) { if (!a.key) return '—'; const k = a.key.replace(/^Key/, '').replace(/^Digit/, '').replace('Arrow', '').replace('BracketLeft', '[').replace('BracketRight', ']').replace('Slash', '/').replace('Comma', ',');
    const n = (a.ctrl ? (MAC ? '⌘+' : 'Ctrl+') : '') + (a.alt ? (MAC ? '⌥+' : 'Alt+') : '') + (a.shift ? 'Shift+' : '') + k;
    return n === 'Shift+/' ? '?' : n; }

  function matches(a, e) { return a.key === e.code && (a.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey)) && !!a.alt === e.altKey && (a.shift === undefined || !!a.shift === e.shiftKey); }


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
    const front = frontFloat();
    const isTop = (d) => (d.classList.contains('floating') ? d === front : d === (d.parentElement || rack).querySelector('.dev:not([hidden])'));
    let i = tabIdx, guard = 0;
    do { i = (i + dir + n) % n; guard++; } while ((tabOrder[i].hidden || tabOrder[i].classList.contains('closed') || isTop(tabOrder[i])) && guard < 2 * n);
    tabIdx = i;
    const dev = tabOrder[i];
    if (dev.classList.contains('floating')) { raiseFloat(dev); if (dev.classList.contains('compact')) layout.setCompact(dev.dataset.id, false); }
    else { (dev.parentElement || rack).prepend(dev); (dev.parentElement || rack).scrollTop = 0; }
    if (dev.classList.contains('folded')) { const f = dev.querySelector('.dev-fold'); if (f) f.click(); }
    dev.classList.add('tab-hot'); setTimeout(() => dev.classList.remove('tab-hot'), 600);
  }
  const ARROWS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
  const OWNED = {
    slider: new Set([...ARROWS, 'Home', 'End', 'PageUp', 'PageDown', 'Delete', 'Backspace']),


    radio: new Set([...ARROWS, 'Home', 'End', 'Enter']),
    button: new Set(['Enter']),
    /* WAVE 68 · A LINK IS NOT A BUTTON, and the difference is exactly this key.  `a[href]` fell into
       the button set, so Space was taken from the app on all ten anchors in the page — and a link
       does NOT activate on Space (it is the browser's scroll), so those presses reached nobody at
       all.  Enter alone, which is the platform's own contract for an anchor. */
    link: new Set(['Enter']),
  };
  /** WAVE 68 · WHO THE GUARD IS LOOKING AT.  The selector named the TAG `button` and never
   *  `[role="button"]` — and `#title`, the λWAVES logo, is the one `<div role="button">` wave 62
   *  itself created, so one Space on the focused logo opened the menu AND started the clock
   *  (`playing` false→true, `t` 0 → 1.863 s).  A guard about ROLES has to read roles. */
  const seatOf = (el) => {
    const w = el && el.closest && el.closest('[role="slider"],[role="radio"],[role="button"],button,a[href]');
    if (!w) return null;
    /* A CONTROL THAT WILL NOT ACT DOES NOT OWN THE KEYS.  With KEEP FRAMES off — the shipped default —
       the scrub is `aria-disabled` and its own keydown returns; the three knobs that mount disabled do
       the same since kit.js's setDisabled writes the attribute.  Before this, three arrows at such a
       control reached NOBODY: the control refused them and the guard had already taken them from the
       app.  Either say you are disabled or let the app have them — never both. */
    if (w.disabled === true || w.getAttribute('aria-disabled') === 'true') return null;
    const r = w.getAttribute('role');
    return OWNED[r === 'slider' ? 'slider' : r === 'radio' ? 'radio' : (w.tagName === 'A' && r !== 'button') ? 'link' : 'button'] || null;
  };
  window.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) || '';


    /* Project save and Settings escape a text field. This return sits above every modifier
       test, so Ctrl+S pressed with the caret in the project's name field or the notebook — the two
       places a hand most plausibly is when it reaches for save — reached nobody at all.
         IT IS AN ALLOWLIST AND NOT A LOOSENING.  Ctrl+Z inside the notebook still does the TEXTAREA'S
       undo and not the register's. Save and the platform-standard Settings shortcut have no useful
       text-editing meaning, so they stay global while the caret is active. */
    const appCommandFromText = (e.ctrlKey || e.metaKey) && !e.altKey && (e.code === 'KeyS' || e.code === 'Comma');
    if ((tag === 'INPUT' || tag === 'TEXTAREA') && !appCommandFromText) return;
    if (tag === 'SELECT' && e.code !== 'Space') return;
    if (e.code === 'Escape' && layout.keymap && layout.keymap.isOpen) { e.preventDefault(); layout.keymap.close(); return; }   // wave 106: the manual closes on Escape (layout.keysheet is this same object)
    if (e.code === 'Escape' && stageHasFocus()) { try { dom.canvas.blur(); } catch (_) {} return; }   // wave 57: the keyboard way OFF the stage — the next Tab then walks the interface
    if (e.code === 'Escape' && layout.menu && layout.menu.isOpen) { e.preventDefault(); layout.menu.close(); const t = document.getElementById('title'); if (t) t.focus(); return; }   // wave 62: the ONE new key in the whole wave
    if (e.code === 'Escape' && layout.addMenu && layout.addMenu.shown) { e.preventDefault(); layout.addMenu.close(); const b = document.getElementById('rackAdd'); if (b) b.focus(); return; }
    if (e.code === 'Escape' && layout.favMenu && layout.favMenu.shown) { e.preventDefault(); layout.favMenu.close(); const b = document.getElementById('rackFav'); if (b) b.focus(); return; }
    /* ── WAVE 62 · WHOSE KEY IS THIS? ─────────────────────────────────────────────────────────────
     * THE LAW: a key belongs to the focused control WHEN THAT CONTROL'S ROLE WOULD USE IT.  Every
     * other key is the app's shortcut, including the bare letters, and including Space on a slider.
     * Not "any control swallows everything" — that would take H, N, B and ? away from a keyboard user
     * the moment they touched a knob — and not a `{ global: true }` flag on 38 actions, which is
     * annotation to maintain and gets forgotten on the 39th.  It is a property of THE KEY AND THE
     * ROLE, so it is one Set lookup, and it degrades correctly when an action is added.
     *   Space on a focused MUTE presses MUTE and does not touch the transport (a button owns Space);
     *   Space on a focused KNOB still plays (a slider has no use for Space);
     *   ArrowRight on a focused knob turns the knob; ArrowRight on a focused SWITCH still steps time.
     * MODIFIERS ARE NEVER OWNED — Ctrl/⌘+Z undoes from inside a knob, ? opens the sheet from inside a
     * button — but Shift IS let through, because Shift+Arrow is the fine step and Shift+Tab is the
     * browser's.  The guard returns WITHOUT preventDefault(): that is the whole point, because what
     * runs next is the button's own native activation or the slider's own handler.  (The keyboard editor
     * records its chords with its own listener while it is open: lab/keymap.js.) */
    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      const own = seatOf(e.target);                                // wave 68: roles, not tags — and never a control that will not act
      if (own && own.has(e.code)) return;
    }
    /* ── WAVE 68 · TWO LAWS THE ACTIONS LOOP HAS TO OBEY BEFORE IT RUNS ANYTHING ──────────────────
     * (1) A HANDLED EVENT IS HANDLED.  `#title`'s own keydown calls preventDefault() on Space and the
     *     loop never asked, so both ran: one press opened the menu and started the physics clock.
     *     The guard above is the general answer and this is the safety net under it — any element in
     *     this lab that answers a key and says so is now believed, whatever its role happens to be.
     * (2) TAB OFF THE STAGE IS THE BROWSER'S, WHATEVER THE TABLE SAYS.  Wave 57 removed a keyboard
     *     trap by stage-gating the two window-cycle actions; wave 62's `continue` (which is correct,
     *     and stays) let a LATER action reached by the same key claim it, so two clicks in the shipped
     *     KEYS panel — bind NOTES to Tab — put the trap straight back, persisted to localStorage.
     *     Wave 57's rule was never a property of those two actions: it is a property of THE KEY, and
     *     it is enforced here where no binding can get underneath it.  Shift+Tab with it, because
     *     backwards walking is the same promise.  (The binding law refuses it too — lab/shortcuts.js
     *     bindingError, the one road of the keyboard editor, the saved overrides and keys.bind — so
     *     nothing offers a chord that could never fire; but the trap is closed even if it did.) */
    if (e.defaultPrevented) return;
    if (e.code === 'Tab' && !stageHasFocus()) return;
    /* WAVE 88 · AND THE NATIVE ACTIVATION IS CANCELLED HERE.  Taking Space out of OWNED above stops
       the guard HANDING it to the control; it does not stop the browser, which fires a <button>'s
       click from Space on its own.  One preventDefault at the top of the dispatch does, and it must
       be before the loop rather than inside a matched action, so the cancellation does not depend on
       Space still being bound to something. */
    if (e.code === 'Space') e.preventDefault();
    const fine = e.shiftKey ? 0.25 : 1;
    for (const a of ACTIONS) {
      if (!matches(a, e)) continue;
      if (a.stage && !stageHasFocus()) continue;                   // wave 57: TAB is the browser's unless the hands are on the world — see THE TAB RULE.  wave 62: `continue`, not `return` — a `return` abandoned the whole loop rather than skipping this one action, which is harmless only while Tab is the sole stage: true binding
      e.preventDefault();
      a.run(fine);
      return;
    }
  });
  __LW_hooks.keys = {
    actions: ACTIONS,
    bind(id, b, options) { const result = bindAction(ACTIONS, id, b, options); if (result.ok) { saveKeys(); if (ui.keysRefresh) ui.keysRefresh(); } return result; },
    conflicts(id, b) { const a = ACTIONS.find(x => x.id === id); return a ? bindingConflicts(ACTIONS, id, normalizeBinding(a, b)) : []; },
    reset() { for (const a of ACTIONS) Object.assign(a, DEFAULT_KEYS[a.id]); try { localStorage.removeItem(LS_KEYS); } catch (_) {} if (ui.keysRefresh) ui.keysRefresh(); },
    /* optimization N4: capture(id) and the dispatcher's capture branch served only the SETTINGS KEYS chips that 5f6421e
       deleted; the keyboard editor records its chords itself.  `capturing` stays readable (the legacy gate reads it). */
    name: keyName, get capturing() { return null; },
    /* WAVE 55: the frozen cycle, readable and re-freezable — the ONE road to a stated order rather than a
       gate re-deriving it from the DOM and calling its own guess the law. */
    get tabOrder() { return (tabOrder || []).map((d) => d.dataset.id); },
    resetTabs() { tabOrder = null; tabIdx = 0; return true; },
    toggleUI, cycleWindow,
  };

  /* ── persistence (§46): experiment and presentation, separately ───────── */
  function serialize() {
    const m = JSON.parse(JSON.stringify(mat)); delete m.bg; delete m.lightUI; delete m.stageCustom;   // the stage colour travels under presentation.ui.stage; GAMMA remains an artist-owned material value
    const H = getHamiltonian();
    /* WAVE 56 · THE TWO KEYS A LINK NEEDED.  `damping` (DRAG γ) lived only in the undo ring's own record and
       `paletteId` only in this browser's settings, so a state serialised for a LINK arrived at the reader with
       neither.  Both are additive: restore() reads neither, so a project written today opens on a build from
       yesterday and a project written yesterday opens here, unchanged in either direction — the link-open path
       below is what applies them, because a link is the one road on which they are somebody else's. */
    return { experiment: Object.assign(reg.serialize(clock.t), { rate: clock.rate, window: clock.window, damping: reg.damping }),
      presentation: { obs: { ...obs }, mat: m, quality: { ...quality }, domain: { ...domain }, shadow: shadowView.mode,
        paletteId: palette ? palette.id : palChoice,
        space, palette: palette ? { on: palette.on, selected: palette.selected, stops: palette.stops.map((s) => ({ at: s.at, rgb: Array.from(s.rgb) })) } : null,
        hamiltonian: { id: H.id, Z: getZ(), atomZ: HAMILTONIANS.atom.Z, well: HAMILTONIANS.well.radius, gasBasis: gasAxial ? 'axial' : 'reg' },
        field: { overlay: fieldlines.overlay, lines: fieldlines.lines, source: fieldlines.source },
        wigner: { zmax: wignerView.zmax, pmax: wignerView.pmax },
        readers: { spectrum: { selected: spectrum.selected, dials: spectrum.dials }, slice: slice.save(), kepler: { shell: kepShell() } },
        /* Static instrument controls belong to the composition. Solver caches, traces, collisions,
           particles and pulse runs do not: every project still opens paused on its first frame. */
        instruments: { molecule: molecule.save(), helium: helium.save(), h2: h2.save(), chem: chem.save(), orbitals: orbitals.save(), states: states.save(), register: { mode: register.mode }, qcd: qcd.save(),
          pulse: pulsePanel ? pulsePanel.api.save() : null, ladder: { ...ladder.params },
          particles: { count: Math.round(dynamics.ui.n.get()), trail: particles.trailLen } },
        mo: moPanel ? moPanel.save() : null,
        rates: Array.from(rates), rotationRates: { ...rotRate }, sturmian: { on: sturm.on, lambda: sturm.lambda },
        modulation: modHost ? modRackStamped() : null,
        /* 2026-09-10 (Josh): A PROJECT IS A DAW PROJECT. Everything a demo can show rides in it — the theme, the
           card style and frost, the accents, the stage; the window arrangement (every window as it stands,
           floats included); the modulation window's placement; the camera's feel and auto-rotate; the overlays;
           SPECTRUM's DIALS fold; the A/B transition; the notebook's size when it was resized. Every key is
           additive: a file without it opens as before, and an UNDO record never carries them. */
        ui: { theme: document.body.dataset.themeChoice || document.body.dataset.theme || 'dark', card: document.body.dataset.card || null, frost: frostMode,
              disc: document.body.classList.contains('disconnected'), accent: { ...accent }, stage: { mix: stageMix, custom: mat.stageCustom.slice(0, 3), follow: stageFollow } },
        layout: layout.captureLayout ? layout.captureLayout() : null,
        modwin: modView ? modView.presentation() : null,
        camera: { autoRotate: !!camera.autoRotate, friction: camera.friction, speed: camera.speed, dragGain: camera.dragGain, fling: camera.flingGain },
        overlays: { vortex: { on: !!vortex.on, overlay: !!vortex.overlay }, kepler: !!kepler.on, particles: { on: !!particles.on, count: particles.points.length }, dials: !!spectrum.dials },
        ab: ui.ab ? ui.ab.get() : null,
        notebook: layout.notebookSize ? (() => { const n = layout.notebookSize(); return n.custom ? { w: n.w, h: n.h } : null; })() : null } };
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
  function restoreModulation(o, savedBases) {
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
    if (modView) modView.rebuild();
    schedule(TIER.PRESENT);
    return ok;
  }
  function save() { try { const s = serialize(); localStorage.setItem(LS_EXP, JSON.stringify(s.experiment)); localStorage.setItem(LS_PRES, JSON.stringify(s.presentation)); wState.setStatus('saved', 'live'); } catch (e) { wState.setStatus('save failed', 'warn'); } }
  /** the whole session as JSON on the clipboard — STATE's COPY JSON and the FILE menu's row are this one road (N1) */
  async function copyJSON() { try { await navigator.clipboard.writeText(JSON.stringify(serialize(), null, 1)); } catch (_) {} }
  /** opt.keepTime: leave the transport exactly where it is (UNDO / REDO) — the anchor c(0) is what travels, so the
   *  picture is continuous the way a RATE change is and only moves if the coefficients themselves did */
  function restore(obj, opt) {
    markBatch++;                                                     // M7: released in the finally below
    try {
      const ex = obj ? obj.experiment : JSON.parse(localStorage.getItem(LS_EXP) || 'null');
      const pr = obj ? obj.presentation : JSON.parse(localStorage.getItem(LS_PRES) || 'null');
      if (ex) {
        const t = reg.restore(ex);
        if (!(opt && opt.keepTime)) {
          clock.pause(); clock.scrub(opt && opt.project ? 0 : t);
          if (ui.scrub) ui.scrub.set(0);
          shadowView.clearTrail(); dynamics.clearHistory(); particles.resetClock(clock.t);
        }
        if (Number.isFinite(ex.rate) && ex.rate > 0) clock.setRate(paceRate(ex.rate));
        if (ex.window) clock.window = ex.window;
        if (Number.isFinite(ex.damping)) { reg.setDamping(ex.damping); if (ui.dragKnob) ui.dragKnob.set(reg.damping); }
        ui.rateKnob.set(clock.rate); ui.presetSel.value = reg.preset || ''; lastNmax = -1; setReference();
      }
      if (pr) { camLevel.from = null; Object.assign(obs, pr.obs || {}); obs.mode = obs.mode === 'free' ? 'free' : 'turntable'; if (!Array.isArray(obs.quat) || obs.quat.length !== 4) obs.quat = quatFromYawPitch(obs.yaw, obs.pitch); if (obs.mode === 'free') { /* WAVE 106 · THE ANGLES ARE A READOUT IN FREE, AND A READOUT MUST NOT MOVE THE RECORD.
      A link rounds the quaternion to f32; re-deriving the angles from THAT quaternion lands them an ulp off the
      ones the link carried, so mint(open(link)) stopped being byte-identical the moment the camera began booting
      FREE — B98's fixed point, and the codec's own node suite cannot see it because the asymmetry is here and not
      in statelink.js.  A record whose angles already agree with its pose far closer than any dial can show KEEPS
      the ones it carried; anything that genuinely disagrees is still re-derived, which is what an old favourite
      carrying no quaternion needs. */
      const y0 = obs.yaw, p0 = obs.pitch; syncFreeAngles();
      if (Math.abs(obs.yaw - y0) < 1e-4 && Math.abs(obs.pitch - p0) < 1e-4) { obs.yaw = y0; obs.pitch = p0; } } if (ui.camSeg) ui.camSeg.set(obs.mode); camera.stop(); syncCamUI(); const pm = { ...(pr.mat || {}) }; delete pm.bg; delete pm.lightUI; Object.assign(mat, pm); if (Number.isFinite(pm.gamma) && ui.gammaK) ui.gammaK.set(pm.gamma); mat.finish=pm.finish||'lit'; mat.bow={gain:1,curve:1,limit:3,...pm.bow}; if(ui.finishSeg)ui.finishSeg.set(mat.finish||'lit'); if(ui.bowKnobs)for(const k in ui.bowKnobs)ui.bowKnobs[k].set(mat.bow?.[k]??({gain:1,curve:1,limit:3}[k])); if(ui.frameModeSeg)ui.frameModeSeg.set(mat.frame===false?'off':mat.frameMode||'box'); if(ui.axisModeSeg)ui.axisModeSeg.set(mat.axis===false?'off':mat.axisMode||'box'); if (ui.styleSeg && STYLE_NAMES[mat.style]) ui.styleSeg.set(STYLE_NAMES[mat.style]); if (ui.ditherSeg) { mat.dither = +mat.dither || 0; ui.ditherSeg.set(mat.dither ? 'ordered' : 'off'); ui.ditherK.setDisabled(!mat.dither); if (mat.dither) ui.ditherK.set(Math.max(0.25, Math.min(2, mat.dither))); } if (ui.invertSw) ui.invertSw.set(!!mat.invert); if (ui.frameSw) ui.frameSw.set(mat.frame !== false); if (ui.axisSw) ui.axisSw.set(mat.axis !== false); if (pm.axisInk !== undefined) mat.axisInk = (pm.axisInk === 'cmy' || pm.axisInk === 'rgb') ? pm.axisInk : 'theme'; if (ui.axisInkSeg) ui.axisInkSeg.set(mat.axisInk === 'cmy' || mat.axisInk === 'rgb' ? mat.axisInk : 'theme'); Object.assign(quality, pr.quality || {}); Object.assign(domain, pr.domain || {}); ui.viewSeg.set(VIEW_NAMES[mat.view]); if (pr.shadow) { shadowView.setMode(pr.shadow); ui.shadowSeg.set(pr.shadow); } ui.domainAuto.set(domain.auto); ui.domainKnob.setDisabled(domain.auto); }
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
        modSyncBases(true);
        if (sturm.P) { sturm.on = false; sturm.P = null; sturm.rec = null; reg.setPropagator(null); reg.setEnergies(energyOf); }   // W-STURMIAN: stand the scale down silently (no re-anchoring) while the file's operator, Z and rates land; its own scale is applied below
        if (pr.hamiltonian) { const h = pr.hamiltonian; if (h.atomZ) setElement(h.atomZ); if (h.Z && h.Z !== getZ()) { setZ(h.Z); if (ui.zKnob) ui.zKnob.set(h.Z); } if (h.well && h.well !== HAMILTONIANS.well.radius) { HAMILTONIANS.well.setRadius(h.well); gas.setRadius(h.well); if (ui.wellKnob) ui.wellKnob.set(h.well); } if (h.id && HAMILTONIANS[h.id]) { setHamiltonian(h.id); switchHamiltonian(h.id); if (ui.hamSeg) ui.hamSeg.set(h.id); } gasAxial = h.gasBasis === 'axial'; if (ui.gasBasis) ui.gasBasis.set(gasAxial ? 'axial' : 'reg'); if (!gasAxial) gas.off(); }
        if (pr.wigner) { const G = pr.wigner; wignerView.setRange(G.zmax, G.pmax); }
        if (pr.mo && moPanel) moPanel.load(pr.mo);                     // W-MO: the basis, λ, R and the two dynamics choices (never the theme)
        if (pr.instruments) {
          const I = pr.instruments;
          if (I.qcd) qcd.load(I.qcd);
          /* Set all field-owning instruments down before selecting the saved one. Their public
             switches enforce mutual exclusion and also own the window-visibility policy. */
          const fieldOwner = I.chem && I.chem.on ? 'chem' : I.h2 && I.h2.on ? 'h2' : I.helium && I.helium.on ? 'helium' : I.molecule && I.molecule.on ? 'molecule' : null;
          if (I.molecule) molecule.load({ ...I.molecule, on: false });
          if (I.pulse && pulsePanel) pulsePanel.api.load(I.pulse);
          if (I.helium) helium.load({ ...I.helium, on: false });
          if (I.h2) h2.load({ ...I.h2, on: false });
          if (I.chem) chem.load({ ...I.chem, on: false });
          /* the ORBITALS register lands OFF first, like every field-touching card, and is switched on only after
             CHEMISTRY holds the volume — its own load() parks the selection until a ladder exists to hang it on */
          if (I.orbitals) orbitals.load({ ...I.orbitals, on: false });
          if (I.states) states.load({ ...I.states, on: false });
          if (I.register) register.setMode(I.register.mode);
          if (fieldOwner === 'molecule') molecule.setOn(true);
          else if (fieldOwner === 'helium') helium.setOn(true);
          else if (fieldOwner === 'h2') h2.setOn(true);
          else if (fieldOwner === 'chem') chem.setOn(true);
          if (I.orbitals && I.orbitals.on && fieldOwner === 'chem') orbitals.setOn(true);
          if (I.states && I.states.on && fieldOwner === 'chem') states.setOn(true);   // parks itself until the ladder lands (statesview `wanted`)
          if (I.ladder) ladder.load(I.ladder);                         // M2 (2026-09-24): lands the params, defers the scan (ladder.js load)
          if (I.particles) {
            if (Number.isFinite(I.particles.count)) dynamics.ui.n.set(I.particles.count);
            if (Number.isFinite(I.particles.trail)) { particles.setTrail(I.particles.trail); dynamics.ui.trail.set(I.particles.trail); }
          }
        }
        if (pr.field) { const F = pr.field; if (F.overlay !== undefined) fieldlines.setOverlay(F.overlay); if (F.lines !== undefined) fieldlines.setLines(F.lines); if (F.source !== undefined) fieldlines.setSource(F.source); }
        if (Array.isArray(pr.rates) && pr.rates.length === 91) { rates.set(pr.rates); reg.setEnergies(energyOf); }
        /* 2026-09-10 · THE DAW KEYS, each only when the file carries it (see serialize) */
        if (pr.ui) { const U = pr.ui;
          if (U.theme && __LW_hooks.setTheme) __LW_hooks.setTheme(U.theme);
          if (U.card) setCardStyle(U.card);
          if (U.frost !== undefined) setFrost(U.frost, { quiet: true });
          if (U.disc !== undefined) setDisconnected(!!U.disc, { quiet: true });
          if (U.accent) { Object.assign(accent, U.accent); if (ui.accA) ui.accA.set(accent.a); if (ui.accB) ui.accB.set(accent.b); if (ui.vivid) ui.vivid.set(accent.vivid); applyAccent(); }
          if (U.stage) {
            if (Number.isFinite(U.stage.mix)) { stageMix = Math.max(0, Math.min(1, U.stage.mix)); if (ui.stageK) ui.stageK.set(stageMix); }
            const custom = Array.isArray(U.stage.custom) ? U.stage.custom : (Array.isArray(U.stage.b) ? U.stage.b : (Array.isArray(U.stage.a) ? U.stage.a : null));
            if (__LW_hooks.setStageColour) __LW_hooks.setStageColour(custom);
            if (__LW_hooks.setStageFollow) __LW_hooks.setStageFollow(typeof U.stage.follow === 'boolean' ? U.stage.follow : !custom);
          } }
        if (pr.camera) { const C = pr.camera; if (Number.isFinite(C.friction)) camera.setFriction(C.friction); if (Number.isFinite(C.speed)) camera.setSpeed(C.speed); if (Number.isFinite(C.dragGain)) camera.setDragGain(C.dragGain); if (Number.isFinite(C.fling)) camera.setFling(C.fling); camera.setAutoRotate(!!C.autoRotate); }
        if (pr.overlays) { const O = pr.overlays;
          if (O.vortex) { vortex.setOn(!!O.vortex.on); vortex.setOverlay(!!O.vortex.overlay); }
          if (O.kepler !== undefined) { kepler.setOn(!!O.kepler); if (ui.keplerSw) ui.keplerSw.set(!!O.kepler); }
          if (O.particles) { const count = pr.instruments && pr.instruments.particles && Number.isFinite(pr.instruments.particles.count) ? pr.instruments.particles.count : O.particles.count; if (O.particles.on) { particles.setOn(true); particles.seed(count || 160, reg, clock.t, domain.half); } else particles.setOn(false); if (dynamics.ui.on) dynamics.ui.on.set(!!O.particles.on); }
          if (O.dials !== undefined && spectrum.setDials && !(pr.readers && pr.readers.spectrum)) spectrum.setDials(!!O.dials); }
        if (pr.readers) {
          if (pr.readers.spectrum) { const S = pr.readers.spectrum; if (Number.isFinite(S.selected)) spectrum.select(S.selected); if (S.dials !== undefined) spectrum.setDials(!!S.dials); }
          if (pr.readers.slice) slice.load(pr.readers.slice);
          if (pr.readers.kepler && Number.isFinite(pr.readers.kepler.shell) && ui.kepShell) { ui.kepShell.set(String(pr.readers.kepler.shell)); keplerRowSync(true); }
        }
        if (pr.ab && ui.ab) ui.ab.set(pr.ab);
        if (pr.notebook && layout.notebookResize && Number.isFinite(pr.notebook.w)) layout.notebookResize(pr.notebook.w, pr.notebook.h);
        if (pr.layout && layout.applyLayout) layout.applyLayout(pr.layout);
        // A legacy H₂⁺ file can carry a closed old layout and an active field
        // owner. Keep its controls reachable after applying that layout.
        if (molecule.on) { wMol.root.hidden = false; wMol.root.classList.remove('closed'); }
        if (pr.sturmian) { sturm.on = !!pr.sturmian.on; sturm.lambda = Math.max(0.25, Math.min(3, +pr.sturmian.lambda || 1)); } else sturm.on = false;   // a file without it means HYDROGEN
        applySturmian(true);                                          // the file's anchor is c(0) under the file's own law: keep it
        // Restore operator rates AFTER the destination scale is installed. The old project's
        // Sturmian guard must not erase a Coulomb project's rates on the way in.
        if (!(opt && opt.keepTime)) {
          const rr = pr.rotationRates;
          for (const key of Object.keys(rotRate)) {
            const v = setRotationRate(key, rr && Number.isFinite(rr[key]) ? rr[key] : 0);
            const id = key === 'z' ? 'state.rot.z' : key === 'kz' ? 'state.stark.kz' : 'state.defect.l2';
            modHost.registry.setBase(id, v);
          }
          if (pr.modulation === undefined) modHost.clock.applyAll(true);
        }
        if (pr.space && pr.space !== space && !getHamiltonian().noMomentum && !sturm.P) { space = pr.space; if (ui.spaceSeg) ui.spaceSeg.set(space); }
        if (pr.palette && palette) {
          if (pr.paletteId && palette.select(pr.paletteId)) palChoice = pr.paletteId;
          if (Array.isArray(pr.palette.stops)) palette.load(pr.palette.stops, pr.palette.selected);
          palette.setOn(!!pr.palette.on); if (!pr.palette.on && mat.view !== undefined) ui.viewSeg.set(VIEW_NAMES[mat.view]);
        }
        /* Restore modulation last. Its base setters now see the final camera, Stage, transport,
           palette and state controls, so no later project step can overwrite a routed hand value. */
        if (pr.modulation !== undefined) restoreModulation(pr.modulation, pr.modulationBases);
        if (pr.modwin && modView) modView.restore(pr.modwin);
      }
      if (opt && opt.project && history) history.clear();
      schedule(TIER.REBUILD); wState.setStatus('restored', 'live');
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
  function mintLink() { linkLast = linkFor(serialize(), { paletteId: palette ? palette.id : palChoice }); return linkLast; }

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
    if (got.paletteId && palette && got.paletteId !== palette.id) { palette.select(got.paletteId); palChoice = got.paletteId; saveSettings(); }
    const ok = restore(got.state);
    const d = +(got.state.experiment && got.state.experiment.damping);
    if (Number.isFinite(d) && d !== reg.damping) { reg.setDamping(d); if (ui.dragKnob) ui.dragKnob.set(d); }
    if (history) history.clear();                       // a link is the BOTTOM of the stack, exactly as ?preset= is
    const say = [];
    for (const w of got.warnings || []) say.push('<b>NOTE.</b> ' + esc(w) + '.');
    if ((got.unknownSections || []).length) say.push('<b>' + got.unknownSections.length + ' part' + (got.unknownSections.length === 1 ? '' : 's')
      + ' of this link were written by a newer build</b> and this one skipped them; everything it does know was applied.');
    linkSay(ok ? 'opened from a link' : 'link read, restore failed', ok && !say.length ? 'live' : 'warn', say.join(' '));
    return { ok, opened: true, code: null, message: null, warnings: got.warnings, unknownSections: got.unknownSections };
  }


  const hAbCopy = (S) => S ? { re: Array.from(S.re), im: Array.from(S.im) } : null;


  const hLook = () => ({
    exposure: mat.exposure, softness: mat.softness, iso: mat.iso, grain: mat.grain, knee: mat.knee,
    dither: mat.dither, hue: mat.hueShift, style: mat.style, view: mat.view,
    invert: !!mat.invert, frame: mat.frame !== false, axis: mat.axis !== false, frameMode: mat.frameMode, axisMode:mat.axisMode, cornerSide:mat.cornerSide, axisInk: mat.axisInk || 'theme',   // ⚠ or an undo would put the axes back and not the colour they were in
    slice: { ...mat.slice, normal: mat.slice.normal?.slice() }, finish: mat.finish || 'lit', bow: { ...mat.bow },
  });
  const hLookKey = () => { const L = hLook();
    return [L.exposure, L.softness, L.iso, L.grain, L.knee, L.dither, L.hue, L.style, L.view,
            L.invert ? 1 : 0, L.frame ? 1 : 0, L.axis ? 1 : 0, L.axisInk, L.frameMode, L.axisMode, L.cornerSide,
            L.slice.mode, L.slice.axis, L.slice.pos, L.slice.thick, L.slice.normal?.join(':'), L.finish, L.bow?.gain, L.bow?.curve, L.bow?.limit].join(','); };
  /** put the look back, and MOVE THE CONTROLS — a restored value the dial does not show is a lie. */
  function hLookWrite(L) {
    if (!L) return;                                                   // an entry from before wave 106
    mat.exposure = L.exposure; mat.softness = L.softness; mat.iso = L.iso; mat.grain = L.grain;
    mat.knee = L.knee; mat.dither = L.dither; mat.hueShift = L.hue; mat.style = L.style; mat.view = L.view;
    mat.frameMode=L.frameMode||'box'; mat.axisMode=L.axisMode||'box'; mat.cornerSide=L.cornerSide||'right';
    mat.invert = !!L.invert; mat.frame = L.frame !== false; mat.axis = L.axis !== false; mat.axisInk = L.axisInk || 'theme';   // an entry from before this wave has no seat, and 'theme' is what it was drawn with
    mat.finish=L.finish||'lit'; if(ui.finishSeg)ui.finishSeg.set(mat.finish);
    if(L.bow){mat.bow={...L.bow};for(const k in ui.bowKnobs)ui.bowKnobs[k].set(mat.bow[k]);}
    if (L.slice) { mat.slice.normal=L.slice.normal?.slice(); mat.slice.mode = L.slice.mode; mat.slice.axis = L.slice.axis; mat.slice.pos = L.slice.pos; mat.slice.thick = L.slice.thick; }
    setKnob(ui.expK, L.exposure); setKnob(ui.softK, L.softness); setKnob(ui.isoK, L.iso);
    setKnob(ui.grainK, L.grain); setKnob(ui.kneeK, L.knee); setKnob(ui.hueK, L.hue);
    setKnob(ui.slicePosK, L.slice ? L.slice.pos : mat.slice.pos);
    setKnob(ui.sliceThickK, L.slice ? L.slice.thick : mat.slice.thick);
    if (ui.ditherSeg) ui.ditherSeg.set(L.dither ? 'ordered' : 'off');
    if (ui.ditherK) { ui.ditherK.setDisabled(!L.dither); if (L.dither) ui.ditherK.set(Math.max(0.25, Math.min(2, L.dither))); }
    if (ui.styleSeg && STYLE_NAMES[L.style]) ui.styleSeg.set(STYLE_NAMES[L.style]);
    if (ui.viewSeg && VIEW_NAMES[L.view]) ui.viewSeg.set(VIEW_NAMES[L.view]);
    if (ui.invertSw) ui.invertSw.set(!!L.invert);
    if (ui.frameSw) ui.frameSw.set(L.frame !== false);
    if(ui.frameModeSeg)ui.frameModeSeg.set(L.frame===false?'off':mat.frameMode);
    if(ui.axisModeSeg)ui.axisModeSeg.set(L.axis===false?'off':mat.axisMode);
    if (ui.axisSw) ui.axisSw.set(L.axis !== false);
    if (ui.axisInkSeg) ui.axisInkSeg.set(L.axisInk || 'theme');
    if (ui.sliceModeSeg && L.slice) ui.sliceModeSeg.set(['off', 'clip', 'slab'][L.slice.mode] || 'off');
    if (ui.sliceAxisSeg && L.slice) ui.sliceAxisSeg.set(['x', 'y', 'z'][L.slice.axis] || 'z');
    applyAccent();                                                    // the hue drives the two accents
    schedule(TIER.PRESENT);
  }
  function hLiveKey() {
    const H = getHamiltonian(), ab = __LW_hooks.ab;
    let rk = 0; for (let a = 0; a < 91; a++) if (rates[a] !== 1) rk = (Math.imul(rk, 131) + a * 7 + Math.round(rates[a] * 1e6)) >>> 0;
    const abk = (S) => { if (!S) return '-'; let h = 0; for (let a = 0; a < 91; a++) if (S.re[a] || S.im[a]) h = (Math.imul(h, 131) + a + Math.round((S.re[a] + 3 * S.im[a]) * 1e9)) >>> 0; return h.toString(36); };
    return [reg.digest(), reg.maskDigest(), reg.field.Bz, reg.field.Fz, reg.damping, H.id, getZ(), HAMILTONIANS.atom.Z,
      HAMILTONIANS.well.radius, gasAxial ? 'a' : 'r', rk.toString(36), sturm.on ? 1 : 0, sturm.lambda,
      reg.transition ? 1 : 0, abk(ab && ab.A), abk(ab && ab.B), hLookKey()].join('|');
  }
  function hRead() {
    const H = getHamiltonian(), ab = __LW_hooks.ab;
    return { exp: reg.serialize(clock.t), damping: reg.damping,
      ham: { id: H.id, Z: getZ(), atomZ: HAMILTONIANS.atom.Z, well: HAMILTONIANS.well.radius, gasBasis: gasAxial ? 'axial' : 'reg' },
      rates: Array.from(rates), sturmian: { on: sturm.on, lambda: sturm.lambda },
      ab: { A: hAbCopy(ab && ab.A), B: hAbCopy(ab && ab.B), on: !!reg.transition },
      look: hLook(), key: hLiveKey() };
  }
  function hWrite(S) {
    const ab = __LW_hooks.ab;
    if (reg.transition && ab) ab.set(false);                       // freeze the mix first: the anchor restored below is the truth
    restore({ experiment: S.exp, presentation: { hamiltonian: S.ham, rates: S.rates, sturmian: S.sturmian } }, { keepTime: true });
    if (reg.damping !== S.damping) { reg.setDamping(S.damping); if (ui.dragKnob) ui.dragKnob.set(S.damping); }
    if (ab && ab.setStores) ab.setStores(S.ab.A, S.ab.B);
    if (S.ab.on && ab && !reg.transition) ab.set(true);             // best effort: the mix restarts at t₀ = now
    hLookWrite(S.look);                                             // wave 106: the knobs travel with the register
    touchState();
  }
  let __hver = reg.version;
  Object.defineProperty(reg, 'version', { configurable: true, get() { return __hver; }, set(v) { __hver = v; hNote(); } });
  /* the LIST repaints itself whenever the ring moves — `onChange` is the ring's own hook and fires on
     every commit, undo, redo, goto and clear, so nothing polls and nothing can drift out of step. */
  let hRender = null;
  history = createHistory({ read: hRead, write: hWrite, liveKey: hLiveKey, depth: 60, quiet: 400, driven: rotDriving,
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
    const dev = t.closest('.dev'), win = dev ? ((dev.querySelector('.dev-eyebrow') || {}).textContent || dev.dataset.id || '') : '';
    const txt = (e) => (e && (e.textContent || '').trim().replace(/\s+/g, ' ')) || '';
    let what = '';
    const k = t.closest('.k');
    if (k) what = txt(k.querySelector('.k-lbl')) || k.getAttribute('aria-label') || 'knob';
    if (!what) { const sw = t.closest('.sw'); if (sw) what = txt(sw.querySelector('.sw-lbl')) || 'switch'; }
    /* a SEG labels itself with `.k-lbl` too (kit.js builds both from the same helper), and reaching it
       through `.seg, .segw` is safe because the knob branch above already claimed anything inside a .k */
    if (!what) { const sb = t.closest('.seg-b'); if (sb) { const g = sb.closest('.seg, .segw');
      const gl = g ? txt(g.querySelector('.k-lbl')) : ''; what = (gl ? gl + ' ' : '') + txt(sb); } }
    if (!what) { const tr = t.closest('.trig'); if (tr) what = txt(tr.querySelector('.trig-l')) || txt(tr); }
    if (!what) { const fd = t.closest('.fd'); if (fd) what = txt(fd.querySelector('.fd-lbl')) || fd.getAttribute('aria-label') || 'fader'; }
    if (!what) return '';
    const w = (win || '').trim();
    return w ? what + ' · ' + w : what;
  };
  const heldPointers = new Set();
  document.addEventListener('pointerdown', e => {
    if (e.button !== 0 || heldPointers.has(e.pointerId)) return;
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
    render() { if (hRender) hRender(); },
    goto(i) { const ok = history.goto(i); if (ok) wState.setStatus('history · row ' + (history.cursor + 1) + ' of ' + history.entries().length, 'live'); return ok; },
    label(name) { history.label(name); },
  };


  const wHist = device({ id: 'history', eyebrow: 'HISTORY', status: '' });
  rack.appendChild(wHist.root);
  const histList = el('div', 'hist-list', wHist.body);
  let histUndoBtn = null, histRedoBtn = null, histReturnBtn = null;
  {
    const rh = wHist.row('tight hist-actions');
    histUndoBtn = trig({ label: 'UNDO', title: 'step back one row (Ctrl+Z)', onFire: () => historyApi.undo() }).root; rh.appendChild(histUndoBtn);
    histRedoBtn = trig({ label: 'REDO', title: 'step forward one row (Ctrl+Shift+Z, Ctrl+Y)', onFire: () => historyApi.redo() }).root; rh.appendChild(histRedoBtn);
    histReturnBtn = trig({ label: 'HISTORY UNDO', title: 'return once to the timeline from before the last history jump (Ctrl+Alt+Z)', onFire: () => historyApi.historyUndo() }).root; rh.appendChild(histReturnBtn);
    rh.appendChild(trig({ label: 'CLEAR', title: 'Clear history without changing the state', onFire: () => { historyApi.clear(); } }).root);
    el('div', 'note', wHist.body).innerHTML = '<b>History.</b> The ten latest points are shown. Select one to jump there. HISTORY UNDO returns once to the timeline from before that jump, even after a new edit. Sixty edits remain available to Undo and Redo.';
  }
  function renderHistory() {
    if (!histList) return;
    const rows = historyApi.entries();
    histList.innerHTML = '';
    const shown = rows.slice(-10).reverse();
    for (const r of shown) {                              // newest at the top, capped so this is a glance, not a workspace
      const b = el('button', 'hist-row hist-' + r.state, histList); b.type = 'button';
      el('span', 'hist-i', b, String(r.i));
      el('span', 'hist-lbl', b, r.label || 'edit');
      if (r.state === 'current') b.setAttribute('aria-current', 'true');
      b.title = r.state === 'current' ? 'where the instrument is standing' : 'land on this moment';
      b.addEventListener('click', () => historyApi.goto(r.i));
    }
    if (histUndoBtn) histUndoBtn.disabled = !historyApi.canUndo;
    if (histRedoBtn) histRedoBtn.disabled = !historyApi.canRedo;
    if (histReturnBtn) histReturnBtn.disabled = !historyApi.canHistoryUndo;
    wHist.setStatus(shown.length + ' recent  ·  ' + rows.length + ' kept  ·  on ' + (historyApi.cursor + 1), 'live');
  }
  hRender = renderHistory;
  renderHistory();

  /* ── the diagnostics surface (tests and curiosity; one road) ──────────── */
  const LW = {
    ready: false, reg, clock, obs, mat, quality, domain, camera, fieldRate, stats, field, presets: PRESETS, TIER, shadowView, spectrum, orbitView: orbit, vortex, ladder, particles, dynamics, slice, qcd, kepler, molecule, helium, h2, chem, calculus, layout, fieldlines, get electrostatics() { return fieldlines.field; }, setTheme(t) { if (__LW_hooks.setTheme) __LW_hooks.setTheme(t); }, setCardStyle(c) { return setCardStyle(c); }, get cardStyle() { return document.body.dataset.card || 'refractive'; }, setFrost(m) { return setFrost(m); }, get frost() { return frostMode; }, get frostLive() { return document.body.classList.contains('frost') && !document.body.classList.contains('frost-hold'); }, setDisconnected(v) { return setDisconnected(v); }, get disconnected() { return document.body.classList.contains('disconnected'); }, applySettings, get settings() { return readSettings(); }, get build() { return BUILD_LINE; }, get ab() { return __LW_hooks.ab; }, get notebook() { return layout.notebook; }, get period() { return __LW_hooks.period ? __LW_hooks.period() : null; }, get gas() { return gas; }, /** optimization K7: the opt-in gas table — gasTable(true|false) switches it, gasTable() reads 'off' | 'building' | 'on' */ gasTable(on) { if (on !== undefined) gasTableOn(!!on); return gas.table; }, setGasBasis(v) { if (ui.gasBasis) ui.gasBasis.set(v); gasAxial = v === 'axial'; if (!gasAxial) gas.off(); hNote(); schedule(TIER.RECONSTRUCT); }, get gasBasis() { return gasAxial ? 'axial' : 'reg'; }, keplerDrag(n, w) { return keplerDragToPoint(n, w); }, keplerTurn(kind, dth, n) { return keplerTurn(kind, dth, n); }, get keplerShell() { return kepShell(); }, setKeplerShell(n) { if (ui.kepShell) { ui.kepShell.set(String(n)); keplerRowSync(true); } return kepShell(); }, keplerOrbitOf(n) { return orbitOfShell(n === undefined ? kepShell() : n); }, get rotRate() { return { ...rotRate }; }, setRotRate(which, v) { const k = which === 'z' ? 'z' : which === 'kz' ? 'kz' : which === 'def' ? 'def' : null; if (!k) return null; if (!Number.isFinite(v)) return null; const w = (k !== 'z' && sturm.P) ? 0 : Math.max(-ROT_LIMIT[k], Math.min(ROT_LIMIT[k], v)); if (modHand('state.' + (k === 'z' ? 'rot.z' : k === 'kz' ? 'stark.kz' : 'defect.l2'), w)) return w; return setRotationRate(k, w); }, get rotDriving() { return rotDriving(); }, get projects() { return layout.projects; }, rateOf(a) { return rates[a]; }, setRate(a, r) { return api.setRate(a, r); }, saveSettings, setStage(v) { return __LW_hooks.setStage ? __LW_hooks.setStage(v) : null; }, setStyle(name) { if (STYLE[name] === undefined) return false; mat.style = STYLE[name]; if (ui.styleSeg) ui.styleSeg.set(name); schedule(TIER.PRESENT); return true; }, accent: { set(a, b) { if (a !== undefined) accent.a = a; if (b !== undefined) accent.b = b; applyAccent(); }, get a() { return accent.a; }, get b() { return accent.b; }, colorAt(deg) { return rgbToHex(wheelColor(deg)); } }, get theme() { return document.body.dataset.theme || 'dark'; }, get themeChoice() { return document.body.dataset.themeChoice || document.body.dataset.theme || 'dark'; }, placeElectron(px, py) { if (helium && helium.on) { helium.placeAt(unproject(px, py)); schedule(TIER.RECONSTRUCT); } }, launchPacket, get lastLaunch() { return lastLaunch; }, enterBox() { if (getHamiltonian().id !== 'well') { setHamiltonian('well'); switchHamiltonian('well'); if (ui.hamSeg) ui.hamSeg.set('well'); } enterBox(); }, coherentBounce() { coherentBounce(); }, get autoQ() { return autoQ; }, governor: { get on() { return gov.on; }, set on(v) { setGovernor(v); }, get drop() { return gov.drop; }, get median() { return gov.median; }, get changes() { return gov.changes; }, get parked() { return [...gov.parked.keys()]; }, get probes() { return gov.probes; }, get probeMs() { return READER_LAW.probeMs; }, get state() { return !gov.on ? 'off' : gov.drop ? 'stepped-' + gov.drop : 'nominal'; }, get resolution() { return effectiveRes(); }, get work() { return perf.work; } }, maths: { get ok() { return maths.ok && scan.ok; }, get bow() { return maths.ok; }, get scan() { return scan.ok; }, get started() { return { bow: maths.started, scan: scan.started, cards: cards.started }; }, call: (m) => maths.call(m) }, get keepFrames() { return keep.frames; }, setKeepFrames, packetCentroid(G = 24) { const c = reg.at(clock.t); return wellCentroid(c.re, c.im, reg.populated(), { G }); }, setIonZ(z) { setZ(z); switchHamiltonian('hydrogen'); if (ui.zKnob) ui.zKnob.set(z); }, get Z() { return getZ(); }, perf: { get mode() { return perf.mode; }, setMode: setPerfMode, get profile() { return perf.profile; }, get counts() { return perf.counts; }, /** the median of the loop's OWN main-thread ms over the last 60 frames — the budget-independent read of "is hidden cheaper?" */ get median() { return ringMedian(perf.ring); }, /** LA1: the same median over the WHOLE loop, timed from its entry */ get loopMedian() { return ringMedian(loopRing); }, resetRing() { perf.ring.fill(0); loopRing.fill(0); } }, get keys() { return __LW_hooks.keys; }, bow: { start: (x, y) => bowStart({ clientX: x, clientY: y }), move: (x, y) => bowMove({ clientX: x, clientY: y }), release: () => bowRelease(), cancel: () => bowCancel(), get active() { return !!bow; }, get k() { return bow ? bow.k : 0; }, get dir() { return bow ? bow.dir : null; }, get landed() { return bowChain; }, get inFlight() { return bowInFlight > 0; } }, kickAlong(k, d) { slapAlong(k, d); }, setDamping(g) { reg.setDamping(g); touchState(); }, get hamiltonian() { return getHamiltonian().id; }, setHamiltonian(id) { switchHamiltonian(id); if (ui.hamSeg) ui.hamSeg.set(id); }, kick(k, axis = 'z') { if (__LW_hooks.slap) __LW_hooks.slap(k, axis); }, get space() { return space; }, setSpace(s) { if (s === 'p' && sturm.P) return false; space = s; if (ui.spaceSeg) ui.spaceSeg.set(s); schedule(TIER.REBUILD); }, get palette() { return palette; },
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
    setPalette(id) { const ok = palette ? palette.select(id) : false; if (ok) { palChoice = id; saveSettings(); } return ok; },
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
      setCadence(hz) { MOD.hz = hz === 120 ? 120 : 60; if (modView) modView.sync(); saveSettings(); return MOD.hz; },
      /* ── WAVE 65 · THE ARM, THE ONE KEY AND THE RESUME LAW, all readable from outside ────────── */
      get armed() { return modArm; },
      get clockLink() { return clockLink; }, set clockLink(v) { ui.setClockLink(v); },
      arm(on) { return setModArm(!!on); },
      /** which law the rack's own chips put on the next resume, and what the last one actually did */
      resume() { return modHost ? modHost.clock.resumePlan() : null; },
      /** the loop clock locked to the density's exact recurrence: one bar = one repeat (g) */
      barLock,
      get expanded() { return layout.modulation.open; },
      expand() { return layout.modulation.expand(); }, collapse() { return layout.modulation.collapse(); },
      play() { const r = modHost.clock.play(performance.now() / 1000); if (modView) modView.sync(); schedule(TIER.PRESENT); return r; },
      stop() { const r = modHost.clock.pause(performance.now() / 1000); if (modView) modView.sync(); schedule(TIER.PRESENT); return r; },
      /** a deterministic step — no realtime anywhere near it, which is what a proof wants */
      step(dt) { const d = modHost.clock.step(dt); if (modView) modView.paint(true); return d; },
      targets() { return modHost.registry.describe(); },
      state(id) { return modHost.registry.state(id); },
      read(id) { return modView ? modView.api.read(id) : null; },
      picker() { return modView ? modView.api.picker() : []; },
      addSource(kind) { const s2 = modHost.model.addSource(kind); if (modView) modView.rebuild(); return s2.id; },
      addMacro() { const m = modHost.model.addMacro(null); if (modView) modView.rebuild(); return m.id; },
      /** BIND: unbind first, always — setMacro REFUSES a change on a macro already bound to a live
       *  source, and a caller that just calls setMacro reads that refusal as a control doing nothing. */
      bind(macroId, sourceId) { modHost.model.setMacro(macroId, { sourceId: null });
        if (sourceId) modHost.model.setMacro(macroId, { sourceId }); modHost.clock.recomputeRunning();
        if (modView) modView.rebuild(); return modHost.model.macroOf(macroId).sourceId; },
      route(macroId, targetId, min, max) { const r = modHost.model.addRoute(macroId, targetId, min === undefined ? 0 : min, max === undefined ? 1 : max);
        modHost.clock.recomputeRunning(); if (modView) modView.rebuild(); return r && r.route ? r.route.id : null; },
      unroute(id) { const ok = modHost.model.removeRoute(id); if (modView) modView.rebuild(); return ok; },
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
        modHost.targets.sync(); modHost.clock.applyAll(true); if (modView) modView.rebuild(); schedule(TIER.PRESENT); return true; },
      serialize() { return modHost.model.serialize(); }, restore(o) { return restoreModulation(o); },
      diagnostics() { return modHost.diagnostics(); },
      paint() { return modView ? modView.paint(true) : false; },
      get held() { return [...modHeld]; },
      get knobs() { return Object.keys(modKnobs); },
    },
    /* UNDO / REDO over the register side only — never the camera, the palette, the layout or the theme */
    get history() { return historyApi; },
    get mo() { return moPanel ? moPanel.api : null; },      /* W-MO: the general basis, the force line and the nuclei */
    get pulse() { return pulsePanel ? pulsePanel.api : null; },  /* W-PULSE: the field-driven molecule on the same card */
    /** W-CAPTURE (wave 58): lab/capture.js itself, built on first use — picture · record · planLoop · recordLoop ·
     *  pngSequence · probe · verifyVideo · save · limits, and `laws` for the pure schedule functions. */
    get capture() { return capApi ? capApi.capture : null; }, get capturePlan() { return capApi ? capApi.plan(true) : null; },
    get captureUI() { return capApi; },
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
      colours(phi = 0) { return Array.from({ length: MARK_N }, (_, i) => rgbToHex(wheelColor(i * MARK_STEP + phi))); },
      get stops() { ensureTurnCSS(); return turnStops(); },
      get css() { ensureTurnCSS(); return turnSheet ? turnSheet.textContent : ''; },
      get steps() { return TURN_STOPS; }, get step() { return MARK_STEP; },
      turn() { return markTurn(); },
      get turning() { const m = document.querySelector('#title .mark'); return !!m && (m.classList.contains('turn') || m.classList.contains('busy')); },
      get menu() { return layout.menu; },
    },
    /* WAVE 106 · THE FROST POLICY IS READABLE, not only writable.  setFrost has been on this surface since
       wave 67 and the matching read never was, so a caller that wanted to borrow the policy for one
       measurement and hand it back had nothing to hand back — it read undefined and setFrost(undefined)
       resolves to 'off', which is not the same as the policy it borrowed.  B62 is exactly that caller: it
       has to take FROST off to see the CARD STYLE pane at all, because the frost rule is a later rule of
       equal specificity that replaces the pane with its own veil. */
    get frost() { return frostMode; },
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
      get floor() { return MARK_FLOOR; },
      get ground() { return MARK_GROUND[document.body.dataset.theme === 'light' ? 'light' : 'dark'].map((v) => Math.round(v * 255)); },
      /** the WCAG ratio between two 0…255 triples — the gate's own arithmetic, from the shipping code */
      ratio: (a, b) => contrastRatio(a.map((v) => v / 255), b.map((v) => v / 255)) },
    /** the ONE input to the TAB rule: are the hands on the world, or in the rack? */
    get stageFocus() { return stageHasFocus(); },
    version: 'QWAVE-0.1 hydrogen shadow lab · FRONTIER · 2026-09-03'
  };
  window.__LW = LW;

  /* ── go ───────────────────────────────────────────────────────────────── */
  LW.bootView = VIEW_NAMES[mat.view]; LW.bootVortex = vortex.on; LW.bootOrder = layout.orderAll(); LW.bootClosed = layout.closed();   // the shipped defaults, recorded before a URL preset's visuals apply
  const q = new URLSearchParams(location.search);
  loadPreset(q.get('preset') && PRESET_BY_ID.has(q.get('preset')) ? q.get('preset') : '1s+2pz');
  mat.view = VIEW.phase; if (ui.viewSeg) ui.viewSeg.set('phase'); schedule(TIER.PRESENT);
  if (q.get('view') && VIEW[q.get('view')] !== undefined) { mat.view = VIEW[q.get('view')]; ui.viewSeg.set(q.get('view')); }
  if (q.get('gastab') === '1') gasTableOn(true);   // optimization K7: the axial gas's Hermite table, OPT-IN (never saved, never linked)
  /* WAVE 57 · `?play=1` USED TO BE HERE, seventy-five lines above the photosensitivity notice — so a shared
     link animated the field underneath the warning while it was being read, which is exactly the thing the
     pane exists to prevent, and wave 56's shareable links made it likelier rather than rarer.  The transport
     is now started at the FOOT of boot, after the notice has been shown, and only when it has been accepted
     (or was accepted by this browser before).  See `armAutoplay` below. */
  Object.assign(DIGESTS, {
    meters: () => 'density period\t' + (() => { const P = __LW_hooks.period ? __LW_hooks.period() : null; return P && P.exact && P.T ? P.T.toFixed(6) + ' a.u. (exact)' : P && P.T ? '≈ ' + P.T.toFixed(3) + ' a.u. (no exact period)' : '—'; })() + '\nframe profile (ms, EMA)\n' + Object.entries(perf.profile).map(([k, v]) => k + '\t' + (+v).toFixed(3)).join('\n') + '\nframes\t' + stats.frames + '\nreconstructs\t' + stats.reconstructs + '\npresents\t' + stats.presents,
    calculus: () => calculus && calculus.stats ? JSON.stringify(calculus.stats, null, 1) : '',
    vortex: () => vortex.last && vortex.last.points ? 'nodal points (x, y, z)\n' + vortex.last.points.map((p) => [p.x, p.y, p.z].map((v) => (+v).toFixed(5)).join('\t')).join('\n') : '',
    spectrum: () => { const c = reg.at(clock.t), H = getHamiltonian(); return 'label\tE\t|c|²\targ c\n' + reg.populated().map((a) => H.labelOf(BASIS[a]) + '\t' + H.energy(a).toFixed(6) + '\t' + (c.re[a] ** 2 + c.im[a] ** 2).toFixed(6) + '\t' + Math.atan2(c.im[a], c.re[a]).toFixed(5)).join('\n')
      + (sturm.P ? (() => { const e = sturmEigen(); return '\n\nSTURMIAN λ = ' + sturm.lambda.toFixed(4) + ' · Z = ' + getZ() + ' · ⟨c|S|c⟩ = ' + e.norm.toFixed(6) + ' · ⟨H⟩ = ' + e.energy.toFixed(6) + '\neigenvalue\tpopulation\t(l, m)\n' + e.E.map((E, k) => E.toFixed(6) + '\t' + e.pop[k].toFixed(6) + '\t' + 'spdfgh'[e.l[k]] + (e.m[k] >= 0 ? '+' : '-') + Math.abs(e.m[k])).join('\n'); })() : ''); },
    atoms: () => atomsView.digest(),
    wigner: () => wignerView.table(),
    radiation: () => radiationView.table(),
    field: () => fieldlines.table(),
    molecule: () => (moPanel ? moPanel.table() : '') + (pulsePanel ? '\n\n' + pulsePanel.table() : ''),
    shadow: () => { const c = reg.at(clock.t); return 'label\tq\tp\n' + reg.populated().map((a) => getHamiltonian().labelOf(BASIS[a]) + '\t' + (c.re[a] * Math.SQRT2).toFixed(6) + '\t' + (c.im[a] * Math.SQRT2).toFixed(6)).join('\n'); },
  });
  layout.moveToRack('spectrum', 'L'); spectrum.openPicker(true);
  // First-visit furniture. Existing saved visibility and layouts are restored below.
  if(useCompactDefaults) {
    const left=['shadow','spectrum'],right=['settings','state','palette','observer','camera','clip'];
    for(const d of document.querySelectorAll('.dev'))d.classList.toggle('closed',![...left,...right].includes(d.dataset.id));
    for(const [host,ids] of [[rackL,left],[rack,right]])for(const id of ids){const d=document.querySelector('.dev[data-id="'+id+'"]');host.appendChild(d);const fold=['settings','state'].includes(id);if(d.classList.contains('folded')!==fold)d.querySelector('.dev-fold')?.click();}
  }
  applySettings();
  syncPhone();                        // wave 51: the breakpoint is read once the browser's settings are in, so the phone's DEFAULTS never overwrite them

  /* ── WAVE 56 · A LINK OPENS HERE ──────────────────────────────────────────────────────────────────
   * `?preset=` is read forty lines up, and this is the same kind of thing said in the fragment — but it
   * lands AFTER applySettings() and not beside the preset, deliberately: applySettings restores THIS
   * BROWSER's frame, axis, camera mode, quality and gamut, and a link that opened before it would have
   * had four of its own choices overwritten by the reader's.  A link is somebody else's picture; the
   * browser's preferences are the reader's furniture, and the picture goes on top.
   * It is also before `history.clear()` below, which is the law: a link is the BOTTOM of the stack. */
  const linkAtBoot = openLink();
  addEventListener('hashchange', () => { openLink(); });   // the fragment is a live address, not only a start


  const warning = (() => {
    const pane = document.getElementById('warnPane');
    const seen = () => readSettings().warned === true;
    const remember = (v) => { const S = readSettings(); try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...S, warned: v })); } catch (e) {} };
    let open = false, prevFocus = null, offKey = null;
    const accepted = [];                          // wave 57: what may only happen once the notice has been read
    function dismiss() {
      if (!pane || !open) return false;
      open = false; remember(true);
      while (accepted.length) { try { accepted.shift()(); } catch (e) {} }   // the pane is down: whatever was waiting on it may run
      if (offKey) { document.removeEventListener('keydown', offKey, true); offKey = null; }
      pane.classList.add('warn-out');
      let done = false;
      const gone = () => { if (done) return; done = true; pane.hidden = true; pane.classList.remove('warn-out'); if (prevFocus && prevFocus.focus) { try { prevFocus.focus(); } catch (e) {} } prevFocus = null; };
      pane.addEventListener('transitionend', gone, { once: true }); setTimeout(gone, 380);
      return true;
    }
    function show() {
      if (!pane || open) return false;
      open = true; prevFocus = document.activeElement;
      pane.hidden = false; pane.classList.remove('warn-out');
      const btn = pane.querySelector('.warn-btn');
      /* the trap is MANDELBROT's: Tab cannot leave, Enter and Space fire, and there is no Escape and no
         click-outside — the only way past a photosensitivity notice is to read it and press the button */
      offKey = (e) => { if (!open) return; if (e.key === 'Tab') { e.preventDefault(); btn && btn.focus(); } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { if (document.activeElement === btn || document.activeElement === pane) { e.preventDefault(); dismiss(); } } e.stopPropagation(); };
      document.addEventListener('keydown', offKey, true);
      if (btn) { btn.focus(); requestAnimationFrame(() => { if (open) btn.focus(); }); }
      return true;
    }
    if (pane) { const b = pane.querySelector('.warn-btn'); if (b) b.addEventListener('click', dismiss); }
    /* WAVE 59 · `?warn=0` WAS A THIRD DOOR, AND IT WAS IN THE URL.  `…/lab/?play=1&warn=0#s=…` showed a
       first-time visitor no notice at all — `needed()` answered false before `seen()` was ever consulted,
       `remember(true)` was never called, and `onAccept` therefore fired SYNCHRONOUSLY, so the field ran at
       full rate with the notice never displayed.  Wave 56 made links the way this lab travels, which made
       that likelier rather than rarer, and wave 57's own header says "NOTHING MOVES UNTIL THE NOTICE HAS
       BEEN ACCEPTED".  The stated reason for the door was a convenience "so a test can ask the question
       without a reload" — but `navigator.webdriver` already covers every test, so it bought the gate
       nothing and shipped a query string that silences a photosensitivity warning.
       BOTH ?warn INPUTS NOW REQUIRE THE DRIVER.  ?warn=1 (force) is harmless in itself but is kept behind
       the same check, because a gate with one arm reachable from a public URL is not one rule.  The `o`
       override is how the node/browser proofs drive it, and it is not reachable from location.search. */
    function needed(o) {
      const q = new URLSearchParams((o && o.query !== undefined) ? o.query : location.search);
      const driver = (o && o.driver !== undefined) ? o.driver : navigator.webdriver === true;
      if (driver === true) { if (q.get('warn') === '1') return true; return false; }
      return !seen();
    }
    return { show, dismiss, needed, onAccept(fn) { if (open) accepted.push(fn); else fn(); return true; },
      reset() { remember(false); return true; }, get seen() { return seen(); },
      get remembered() { return seen(); }, get open() { return open; } };
  })();
  ui.saveNative = saveSettings;
  ui.clockLink = () => clockLink; ui.setClockLink = (on) => { clockLink = !!on; linkFollowed = null; saveSettings(); };   // the frame loop's edge takes it from here
  reworkNative({ ui, mat, repaint:()=>schedule(TIER.PRESENT), modHost, modApi:()=>modView&&modView.api, cadence:()=>MOD.hz, setCadence:hz=>{MOD.hz=hz;saveSettings();}, arm:setModArm });
  __LW_hooks.warning = warning;
  if (warning.needed()) warning.show();
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
  armAutoplay();
  if (MOTION.reduced && ui.rateKnob) ui.rateKnob.root.title = 'Reduced motion lowered RATE. Adjust it to override.';
  if (palette && palette.repaint) requestAnimationFrame(() => palette.repaint());   // the strip sat in a zero-size card when first painted
  history.clear();                    // the shipped boot (and a ?preset= in the URL) is the BOTTOM of the stack, not a step in it


  markTurn();
  busyHost();                         // the mark is cloned and painted before anything can need it
  markBatchEnd();                     // M7: …painted here, once, every copy of it (the clones included)
  if (layout.projects) layout.projects.markClean();
  LW.ready = true;
  return LW;
}
