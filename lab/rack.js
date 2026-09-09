import { waitForPaint } from './frame-settle.js';
import { readProjectCollection } from './project-storage.js';
import { MAX_PROJECT_BYTES, storeProjectImport } from './project-import.js';
import { renderNotebook } from './notebook-render.js';
import { reworkNative, planeModel, infoPanel } from './native-ui.js';
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
import { createField, tableFor, VIEW, VIEW_NAMES, STYLE, STYLE_NAMES, cameraBasis, quatFromYawPitch, yawPitchFromQuat, turnFree } from './field.js';
import { el, knob, sw, seg, trig, fader, readout, device, group, formula, chip, setAccentRGB, cssRGB, accentRGB, parseCssColor } from './kit.js';
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
import { keplerOrbits } from './kepler.js';
import { createGas } from './gas.js';
import { densityPeriod, fmtPeriod } from './period.js';
import { createMolecule } from './moleculeview.js';
import { createMOPanel } from './moview.js';
import { createPulse } from './pulseview.js';
import { createCapture, maxPictureSize } from './capture.js';
import { createHelium } from './heliumview.js';
import { createH2 } from './h2view.js';
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
import { createModHost, labParameters, barTempo } from './mir/host.js';
import { createModulation } from './modwindow.js';   // wave 64: the PORTED window's host side — lab/mir/modwindow/ is the artifact
import { createAudioCapture, AUDIO_STATE } from './audio.js';   // wave 102: the capture half the port deliberately left behind
import { linkFor, readLink, LinkError, LINK_CHAR_CEILING } from './statelink.js';   // wave 56: every state of this lab is a LINK

/* THE BUILD STAMP — one constant, and every wave updates it.  The ABOUT face and its copy dump both read it here;
   nothing else in the app hand-writes a version, so a stale line can only come from forgetting THIS line. */
const BUILD_LINE = 'PRE-ALPHA · waves 5–107 · 2026-09-07';   // THE ONLY PLACE THE NUMBER LIVES: the ABOUT face, the copy dump and the proof all read it back through LW.build (ANTI-PATTERN 6)

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
  /* WAVE 106 · THE CAMERA SHIPS FREE (Josh: "Have the default camera be 'free'").  TURNTABLE keeps a
     world up-vector and clamps pitch; FREE carries a real orientation and lets the hand roll the
     scene.  The seed is unchanged and the two agree at t = 0 by construction — `quat` is built FROM
     the same yaw and pitch — so booting in FREE moves no pixel and only changes what the next drag
     is allowed to do.  The switch stays in CAMERA for anyone who wants the rail back. */
  const obs = { yaw: 0.65, pitch: 0.38, dist: 3.3, fov: 0.6, mode: 'free', quat: quatFromYawPitch(0.65, 0.38) };   // wave 54: TURNTABLE reads (yaw, pitch); FREE reads `quat` and the angles become a READOUT
  const mat = { view: VIEW.phase, exposure: 1, softness: 0.7, steps: 160, slice: { mode: 0, axis: 2, pos: 0, thick: 0.03 }, hueShift: 0, invert: false, frame: true, axis: true, axisInk: 'theme', paletteOn: false, style: STYLE.cloud, iso: 0.06, grain: 0.35, knee: 0.6, dither: 0, boost: { k: [0, 0, 0], on: false }, bg: [0.028, 0.038, 0.058], gamma: 1, lightUI: false };
  let palette = null;
  /* per-label RATE (Josh): a multiplier on each label's own E — 1 everywhere is the Hamiltonian in force; anything else is a TOY */
  const rates = new Float64Array(91).fill(1);
  const energyOf = (a) => getHamiltonian().energy(a) * rates[a];
  /* W-STURMIAN (Josh: a SWITCH — HYDROGEN is today's code path, untouched; STURMIAN adds).  The SCALE λ gives all 91 radials one
     exponent; sturm.P is the propagator in force (null = the diagonal law) and sturm.rec the records the FIELD draws (n_rec = 1/λ) */
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
  const PAL_DEF = 'prism';          // WAVE 54 · board #51, Josh's ruling: the 6-stop CIE spectral map ships as the default; λWAVES stays one click away
  let palChoice = (() => { const id = readSettings().palette; return id && PALETTE_BY_ID.get(id) ? id : PAL_DEF; })();   // a DEFAULT IS FOR A FIRST VISIT — never a retroactive edit of someone's settings
  const nativeAccentLUT=toLUT(PALETTE_BY_ID.get('lambda').stops);
  let wheelLUT = toLUT(PALETTE_BY_ID.get(palChoice).stops);
  const accent = { a: 30, b: 300, vivid: .1 };
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
       and its rail only, and nothing on `:root` moves: see lab/modhost.css. */
    if (modView) modView.setAccent(hueSat(A), hueSat(B));
    paintMarks();
  }
  /* THE MARK IS PAINTED IN ONE PLACE (wave 48, Josh: "Continue letting the about page logo match the dynamic logo
     up top").  There are three copies of the wheel now — the header's, the ABOUT face's clone and the BUSY mark's —
     and before this they diverged the moment the clone was taken, because only '#title .mark rect' was ever repainted.
     One selector, nine samples, `i % 9` so every copy gets the SAME nine: λ at 0°, the squares at 0°, 40°, … 320°. */
  const MARK_N = 9, MARK_STEP = 40;          // nine squares, 40° apart on the wheel, in reading order
  /* ── WAVE 57 · THE λ IS TYPE; THE NINE SQUARES ARE THE PALETTE.  They are not the same object and they
   * do not get the same treatment.
   * THE λ is a LETTERFORM — a thin 13-px bold-italic stroke, the only coloured half of a two-part wordmark
   * whose other half (`.word`) already abandons the wheel for #000 on light.  It took `wheelColor(0)` raw,
   * so it wore whatever luminance the palette happened to have at 0°, and measured over 23 palettes × 360°
   * of HUE it reached **1.00 : 1 on BOTH stages** — `ember` @0° on light (#fff0c8 on #eef1f6) and
   * `aurora` @6° on dark (#01051b on #070a0f).  Not faint: absent.  It now goes through `visibleInk`,
   * which keeps the hue and the chroma EXACTLY and moves only OKLab L, only when the raw colour is under
   * the floor, and only as far as the floor demands — a no-op on 47 % of the light wheel and 66 % of the
   * dark one, so a vivid λ stays exactly as vivid as it was.  The floor is 3 : 1, WCAG's non-text /
   * graphical-object ratio; 1.4.11 exempts logotypes outright, so this is a floor we CHOOSE, and it is the
   * same one the audit holds every other mark in the interface to.  It is measured against the harder of
   * the two grounds the λ is drawn on — the CARD (the notebook's ABOUT face) rather than the stage — so
   * the stage, which the gate reads, comes out at ≥ 3.06 : 1 on light and ≥ 4.29 : 1 on dark.
   * THE NINE SQUARES ARE LEFT ALONE, deliberately.  They are a swatch grid: the palette showing itself,
   * beside a palette editor that draws the same stops.  A swatch corrected for its ground is lying about
   * the colour it is a swatch of, and the two would disagree.  What that costs is on the record and is
   * NOT hidden: on the light stage `opal` can put all nine squares under 3 : 1 with the best of them at
   * 1.59 : 1 (dark's worst case still has three of nine over 3 : 1 and a best of 5.74 : 1), so on a pale
   * palette the ornament goes quiet while the wordmark beside it stays.  The fix if Josh ever wants it is
   * an edge, not a recolour — a hairline stroke in the theme's ink gives every cell a border and changes
   * no fill by one bit — and that is a design decision, not a correctness one. */
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
  function paintMarks() {
    for (const lam of document.querySelectorAll('#title .lam')) lam.style.color = gamutCss(markInk(0, stageGround()));   // over the CANVAS: the live STAGE colour
    for (const lam of document.querySelectorAll('.nb-logo .lam')) lam.style.color = gamutCss(markInk(0));                  // over the CARD: the constant that really is one
    document.querySelectorAll('#title .mark rect, .nb-logo .mark rect, #busyMark .mark rect, .mod-logo .mark rect').forEach((r, i) => {   // wave 106: …and the playhead's modulation door, which is the same mark and must turn with it
      const k = i % MARK_N;
      r.setAttribute('fill', gamutCss(wheelColor(k * MARK_STEP)));       // wave 54: the mark is DOM, so it wears the same gamut the canvas does
      if (!r.classList.contains('sq' + k)) r.classList.add('sq' + k);      // which seat on the wheel this square holds
    });
    turnDirty = true;                       // the wheel moved under the mark: the turn's keyframes are stale
  }
  /* ── THE PALETTE TURNS; THE MARK DOES NOT (wave 53, Josh, board #45) ──────────────────────────────────
   * "The logo shouldn't be spinning, and it also shouldn't be going 360 … it's more like the current palette
   * itself rotating 360, not hue phase 360."  Read literally, and it is not a hue-rotate of anything.
   *
   * Square i RESTS at the wheel's colour at i·40° (that is wave 48's mark, unchanged).  A TURN advances every
   * square around THE SAME WHEEL — square i shows (i·40° + φ) as φ runs 0 → 360° — so what moves is the palette
   * THROUGH the mark: the identity of the palette is preserved exactly, and on a four-stop palette the nine
   * squares march that palette's own four colours around themselves rather than nine arbitrary hues.  Nothing
   * rotates: no transform, no filter, no hue-rotate anywhere in the logo any more.
   *
   * The keyframes are GENERATED from the same wheelColor() the static fills come from — one @keyframes per
   * square, 36 samples 10° apart, and because 40 is a multiple of 10 every square's list is the SAME 36 palette
   * samples rotated by four places.  That identity is what "the palette itself turning" means, and it is what
   * the gate reads.  It is CSS and not JS for wave 48's reason: the mark's whole job is to go on moving while
   * the main thread is the thing that is stuck.  It is rebuilt only when a turn STARTS — a HUE drag would
   * otherwise rewrite eight kilobytes of stylesheet sixty times a second, and restart the animation with it. */
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
      css.push('#title .mark.turn rect.sq' + i + ',#title .mark.busy rect.sq' + i + ',#busyMark .mark rect.sq' + i + '{animation-name:lw-turn-' + i + '}');
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
  /* CARD STYLE's DEFAULT is the phone's, and only its default: REFRACTIVE reads the live field through the
     glass, which under a knob on a phone is jarring and is fill-rate we do not have.  A browser that has SAID
     which surface it wants still gets exactly what it said. */
  const defaultCard = () => (isPhone() ? 'tinted' : 'refractive');
  /* `cardChosen` is the difference between "this browser wants TINTED" and "this browser has never said":
     without it the first saveSettings() of a session freezes whatever the default happened to be, and the
     surface could never follow the device again.  The seg — the one place a HAND can say it — sets it. */
  let cardChosen = readSettings().cardSet === true;
  /* Wave 89: Josh explicitly chose ALWAYS for new users. Backdrop capture
     can limit live frame rate; OFF and STILL remain available preferences. */
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
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ nativeLayout:useCompactDefaults?1:S0.nativeLayout, nbW: S0.nbW, nbH: S0.nbH, layouts: S0.layouts, warned: S0.warned, audioDevice: S0.audioDevice, theme: document.body.dataset.themeChoice || document.body.dataset.theme || 'light', badges: !document.body.classList.contains('no-badges'), hint: !document.body.classList.contains('no-hint'), captions: !document.body.classList.contains('no-captions'),
        frost: frostMode, disc: document.body.classList.contains('disconnected'), blur: ui.blurK ? ui.blurK.get() : 11, card: document.body.dataset.card || defaultCard(), cardSet: cardChosen, accent: [accent.a, accent.b, accent.vivid], auto: quality.auto, governor: gov.on, keepFrames: keep.frames,
        /* WAVE 51 · THE CAMERA'S FEEL IS A PREFERENCE, not a project's (wave 50 built FRICTION / SPIN / AUTO-ROTATE and
           none of the three survived a reload).  FRICTION and SPIN are how the instrument FEELS in the hand and they
           belong beside FROST and GOVERNOR.  AUTO-ROTATE is deliberately NOT here: a lab that starts turning by itself
           when you open it is a surprise, not a setting. */
        friction: camera.friction, spin: camera.speed, dragGain: camera.dragGain, fling: camera.flingGain, modCadence: MOD.hz, modArm: modArm,   // wave 58: the two View-window dials are the same kind of preference as FRICTION and SPIN; wave 65: the MOD arm is one too
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
  /* CARD STYLE (wave 47, Josh): the glass every card and chrome pane is made of.  REFRACTIVE is the blur alone — the
     pane is transparent and what you read through it is the field; TINTED puts the theme's tinted pane back under the
     blur.  The rules are skin.css §14c; this only says which of the two the body wears, and remembers it per browser. */
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
  /* ── WAVE 67 · THE TWO NEW SURFACE CONTROLS.  Both are THIS BROWSER's preference and neither is ever in a
   * project file, exactly like FROST, CARD STYLE and the theme beside them.
   *   setFrost(mode)      OFF · STILL · ALWAYS — the vividness and WHEN it is affordable (see frostSync).
   *   setDisconnected(v)  the window as a CONSTELLATION (a bar-chip and a body-card with real air between
   *                       them) or as one slab.
   *
   * ── WAVE 69 · THE DEFAULT IS **OFF**, AND THIS IS A REVERT ─────────────────────────────────────
   * Wave 67 read Josh's two sentences — *"I love that disconnected look, it allows for more of the
   * background to show"* and *"can you make it like the webm where the window is disconnected"* — as
   * being about λWAVES' own rack, and shipped every window as a constellation.  They were about the
   * MODULATION WINDOW.  Josh, 2026-09-06: *"Why was the design of our own UI changed?? Please Claude
   * I meant the design of the Modulation window only."*
   *   So OUR windows go back to exactly what they were before wave 67 — one card, header attached —
   * and the constellation stays only as an off-by-default switch in SETTINGS, because the code is
   * twenty-one CSS rules and one class and costs nothing while it is off.  The two things wave 67
   * did that were FIXES and not design are kept and are untouched by this: the drag rewrite (40
   * forced layouts and 40 synchronous writes per drag down to one write per frame) and the pick-up
   * transition at the 120 ms rung instead of 350, which brought it back inside MOTION-LAW's ceiling.
   * FROST is independent; wave 89 later changed its first-run default to ALWAYS.
   *   `!!v` and not `v !== false`: NOTHING SAID MEANS JOINED now, on both roads — `applySettings`
   * reads `s.disc === true` for the same reason, so a profile that predates the switch opens joined
   * rather than inheriting a default nobody asked for. */
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
    if (s.badges === false) { document.body.classList.add('no-badges'); if (ui.badgesSw) ui.badgesSw.set(false); }
    if (s.hint === false) { document.body.classList.add('no-hint'); if (ui.hintSw) ui.hintSw.set(false); }
    if (s.captions === false) { document.body.classList.add('no-captions'); if (ui.capSw) ui.capSw.set(false); }
    /* WAVE 67 · FROST used to be a BOOLEAN and is now a policy with three seats, so a stored `true` has to
       mean something: it means ALWAYS, because that is literally what an old `on` did — the glass was there
       whatever the transport was doing.  Anything unreadable falls to the shipped default, OFF. */
    setFrost(s.frost === true ? 'always' : (s.frost || frostMode), { quiet: true });   // wave 89: an ABSENT key takes the shipped default, not OFF
    /* ⚠ WAVE 101 · DISCONNECTED IS ON BY DEFAULT NOW, AND THAT REVERSES WAVE 69 ON JOSH'S OWN WORD.
       Wave 67 shipped it on, Josh said "Why was the design of our own UI changed?? I meant the design
       of the Modulation window only", and wave 69 made it an off-by-default switch.  He has now looked
       at the constellation for a week beside the plugin's and asked for it as a first-run default:
       "Disconnected on by default".  `!== false` and not `=== true`, so a browser that has SAID off
       stays off and only a profile with nothing saved gets the new default. */
    setDisconnected(s.disc !== false, { quiet: true });
    cardChosen = s.cardSet === true;                                          // whether this browser has SAID is part of what applySettings restores
    setCardStyle(s.cardSet === true ? s.card : undefined);                    // wave 47: the glass of the cards — REFRACTIVE unless this browser SAID otherwise (wave 51: said, not merely saved)
    if (typeof s.blur === 'number') { document.documentElement.style.setProperty('--glass-blur', s.blur.toFixed(1) + 'px'); if (ui.blurK) ui.blurK.set(s.blur); }
    if (Array.isArray(s.accent)) { accent.a = +s.accent[0] || 0; accent.b = +s.accent[1] || 0; if (ui.accA) ui.accA.set(accent.a); if (ui.accB) ui.accB.set(accent.b); accent.vivid = +s.accent[2] || 0; if (ui.vivid) ui.vivid.set(accent.vivid); applyAccent(); }
    if (s.auto === false) { quality.auto = false; if (ui.autoSw) ui.autoSw.set(false); }
    if (s.governor === false) setGovernor(false);                 // wave 45: the governor held off
    if (s.keepFrames === true) setKeepFrames(true);              // wave 45: the playhead follows every frame (off by default)
    if (typeof s.friction === 'number') camera.setFriction(s.friction);   // wave 51: the camera's feel comes back …
    if (typeof s.spin === 'number') camera.setSpeed(s.spin);              // … but AUTO-ROTATE never does (see saveSettings)
    if (typeof s.dragGain === 'number') camera.setDragGain(s.dragGain);   // wave 58: DRAG GAIN and FLING ride beside them
    if (typeof s.fling === 'number') camera.setFling(s.fling);
    MOD.hz = s.modCadence === 120 ? 120 : 60; if (modView) modView.sync();   // wave 52: the modulation's cadence cap is the PANEL's, not the project's
    if (s.modArm === false) setModArm(false, { quiet: true });   // wave 65: the arm is this browser's, and ARMED is the default a fresh visit gets
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
    /* WAVE 101 · DISPLAY-P3 ON AN APPLE DEVICE, sRGB EVERYWHERE ELSE (Josh's new default).  Every
       Mac, iPhone and iPad this lab will meet ships a P3 panel and a colour-managed compositor, so the
       wider gamut is what those screens are FOR; a PC panel is usually sRGB and asking for P3 there
       buys a conversion and no colour.  It is a FIRST-RUN default only — `s.gamut` present means this
       browser has said, and what it said wins — and it still cannot be honoured unless the canvas
       agrees, which is what the `setGamut(...) === 'srgb'` fallback below reads. */
    const wantP3 = s.gamut ? s.gamut === 'p3' : appleDevice();
    if (wantP3 && ui.gamutSeg) ui.gamutSeg.set(field.ok && field.setGamut ? (field.setGamut(s.p3Mode === 'vivid' ? 'p3-vivid' : 'p3') === 'srgb' ? 'srgb' : 'p3') : 'srgb');   // it can only come back if the canvas can honour it
    document.body.dataset.gamut = field.ok && field.gamut !== 'srgb' ? 'p3' : 'srgb';
    settingsLoaded = true;
  }
  /* the window taxonomy (Josh, 2026-09-04): CORE is the instrument; INFO panels read and report — they keep their
     captions visible and carry a COPY digest for the notebook; CONTROL surfaces and OTHER models are niche and start folded */
  const KIND = { state: 'core', spectrum: 'core', observer: 'core', palette: 'core', camera: 'core', clip: 'core', transport: 'core', modulation: 'control', settings: 'other', about: 'other', shadow: 'info', vortex: 'info', slice: 'info', calculus: 'info', meters: 'info', ladder: 'info', orbit: 'control', dynamics: 'control', qcd: 'info', atoms: 'info', field: 'control', molecule: 'other', helium: 'other', h2: 'other', wigner: 'info', radiation: 'info' };
  /* WAVE 56 · WINDOWS THAT NO LONGER EXIST, and the window that absorbed each of them.  A saved LAYOUT is
     a list of window ids and nothing else, so retiring an id would silently drop a seat out of every layout
     ever saved unless the id has somewhere to go.  `style` (DRAW STYLE) was merged into `observer` (WAVE) by
     board #59, which kept the heir's id precisely so that three CSS selectors and the gate did not have to
     move.  Read by layout.applyLayout(); the settings key's `closed[]` needs nothing, because it names each
     window independently and the heir already names itself. */
  const RETIRED_WINDOWS = { style: 'observer' };
  const live = (w) => !(w && w.root && w.root.classList.contains('off'));
  const DIGESTS = {};
  let space = 'x';                 // 'x' position ψ(x) · 'p' momentum φ(p): the same state, two exact pictures
  /* WAVE 101 · THE SHIPPED GRID IS 64³ (Josh's new first-run default).  It is the FIRST rung of
     RES_LADDER, so the governor has two notches to give back rather than one, and a first visit costs
     a fraction of the fill 96³ did.  A browser that has chosen a grid keeps it — this is the value a
     profile with nothing saved starts on. */
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
  const gov = { on: true, drop: 0, median: 0, ring: new Float32Array(60), n: 0, okSince: 0, since: 0, changes: 0, scroll: 0, parked: new Map(), probes: 0, probeFrame: -1 };
  /* ── WAVE 67 · THE FROST POLICY, AND THE GOVERNOR NO LONGER STEALS THE GLASS ──────────────────────────
   * Wave 45 gave the governor a lever on FROST: when the frame was far longer than the maths in it, it
   * STRIPPED `body.frost` while the transport played and put it back on pause.  That is exactly the bug
   * Josh filed against BASINS in his own words — *"Glass only works when still or when animation is
   * running.  It returns to grey whenever I tap the screen"* — and BASINS answered it with a law this lab
   * now keeps too: THE MATERIAL MAY ECONOMISE, IT MAY NOT CHANGE APPEARANCE.  Stripping the class took the
   * FILL with the filter, which is the whole grey.  So the lever is gone from the governor and the same
   * economy is a POLICY THE USER NAMED, which is BASINS' own answer as well (their four blur policies).
   *
   * THE MEASUREMENT THAT SHAPES IT, on our own rig, 360 rAF intervals per arm over a live field:
   *     none 17.10 ms / 58.5 fps  ·  saturate(1.8) alone 50.32  ·  blur(8px) 50.30  ·  BASINS' full
   *     8/188/108 recipe 50.30  —  identical, because THE COST IS THE BACKDROP CAPTURE, NOT THE KERNEL.
   *     With the field PAUSED every one of those arms reads 17.10 ms: free.
   * So there is no cheap half to buy and the only lever that exists is WHEN.  Three seats:
   *     OFF     no filter.
   *     STILL   the filter is on while the transport is stopped and held while it runs.
   *     ALWAYS  the exact BASINS look, at 58.5 → 19.9 fps over a moving field, by the user's own word.
   * WHY OFF WAS THE ORIGINAL DEFAULT: the capture is paid for ANY canvas
   * that changes, so a camera orbit or a knob drag over a paused field costs the same 33 ms as playback.
   * A default of STILL would therefore either take a third of the frame rate off a gesture Josh performs a
   * hundred times a day, or twitch the material under his hand every time he touched it — and he has ruled
   * against both (he keeps all the motion; the glass may not go grey when he taps).  The vividness is one
   * press away. Wave 89 superseded this default with Josh's explicit choice of ALWAYS. */
  /** the MOMENT's half: the only thing that may move while the field runs is the filter, never the fill */
  function frostSync() {
    const hold = frostMode === 'still' && clock.playing;
    if (hold !== document.body.classList.contains('frost-hold')) document.body.classList.toggle('frost-hold', hold);
  }
  const effectiveRes = () => { if (!gov.drop) return quality.res; let i = RES_LADDER.findIndex((r) => r >= quality.res); if (i < 0) i = RES_LADDER.length - 1; return RES_LADDER[Math.max(0, i - gov.drop)]; };
  const READER_LAW = { park: 16, slow: 6, parkDrop: 8, slowDrop: 3, probeMs: 3000 };   // ms per update: parked while playing / slowed to every 6 × cost — and the tighter pair once stepped down
  /* KEEP FRAMES (wave 45, Josh): off by default — the playhead does not follow the clock, the scrub bar is disabled
     and never repainted (each repaint was a style write on the transport's glass at the display rate); RATE and
     play / pause work as before.  A SETTINGS switch; this browser's, never a project's. */
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
   * THE CONSTANTS.  μ ∈ [0, 12] /s in steps of 0.05 (so μ = 0 is EXACTLY reachable), DEFAULT 2.5: τ = 1/μ = 0.4 s,
   * a hard flick (3 rad/s) coasts ln(ω₀/ω_rest)/μ ≈ 2.8 s and turns through ω₀/μ = 1.2 rad = 69° — two flicks to
   * walk right round the cloud — where μ = 12 gives 0.25 rad = 14° (a nudge) and μ = 1 gives most of a half turn.
   * REST = 0.003 rad/s is half a pixel a second at the drag's own 0.0065 rad/px: below it the residual is set to
   * ZERO, the camera is still, and the loop stops scheduling — idle is zero work (§45).  |ω| is capped at 12 rad/s
   * (two turns a second) so no flick can outrun the picture.  A fling that hits the POLE CLAMP loses its pitch
   * component and keeps its yaw.  THE CAMERA NEVER TOUCHES ψ: it schedules TIER.PRESENT and nothing else, it is
   * not on the undo stack, and reg.version cannot move because of it (§14). */
  const CAM_TRADE = {
    turntable: 'TURNTABLE: the horizon stays level, and the pitch stops at the poles.',
    free: 'FREE: there are no poles, and the horizon rolls — a closed drag loop leaves a turn behind it, because [ĵ, k̂] = 2î.',
  };
  /* ── THE TWO DIALS FROM THE VIEW WINDOW (wave 58, board #63 — Josh: "can I also copy the View window's drag gain
   * and fling slider?").  NEBULA's own pair is dragGain 0.2 … 8 default 3.14 and flingGain 0 … 2 default 1, and the
   * FIRST of those numbers does not travel: THEIR gain is radians per SCREEN WIDTH (3.14 = a full-width drag turns
   * π), which on our 1400-px stage would be 0.00224 rad/px against the 0.0065 this instrument was built on.  A dial
   * whose default silently retunes the feel of the shipped camera is the wrong port (ANTI-PATTERN 7's cousin), so
   * the RANGE and the STEP are theirs and the UNIT is ours: DRAG GAIN multiplies CAM.SENS, and 1.00 is exactly the
   * camera Josh already has.  (Their 3.14 in our units is 3.14/(0.0065·W) — about 0.34 on a 1400-px stage.)
   *   THE TWO DIALS COMPOSE WITH THE FRICTION LAW, they do not compete with it.  FLING decides how much velocity a
   * release GIVES you; μ decides how fast it decays; μ = 0 still spins for ever whatever FLING is.  FLING = 0 is
   * "pure trackball" — the drag still turns the view, and the moment you let go there is nothing left — which is
   * NOT what μ = 12 does (that is a fling that dies in a quarter turn, and it dies over time). */
  /* WAVE 106 · MU_DEF 2.5 -> 1.0 (Josh: "the friction to be quite low but not too low").  The law is
     omega decaying as e^(-mu*t), so mu IS the reciprocal e-folding time: 2.5 stopped a flick in 0.4 s,
     which reads as sticky, and 1.0 gives it a full second of coast without tipping into the frictionless
     feel that makes a scene impossible to park.  The knob's own default reads this same constant, so
     the dial and the seed cannot drift apart. */
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
    /** hand the camera an angular velocity (rad/s, capped at MAX): what the law relaxes is ω − ω_amb */
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
    setDragGain(v) { this.dragGain = Math.max(CAM.GAIN[0], Math.min(CAM.GAIN[1], +v || 0)); if (ui.gainK) ui.gainK.set(this.dragGain); if (ui.camGainNote) ui.camGainNote(); return this.dragGain; },
    setFling(v) { this.flingGain = Math.max(CAM.FLING[0], Math.min(CAM.FLING[1], +v)); if (ui.flingK) ui.flingK.set(this.flingGain); if (ui.camGainNote) ui.camGainNote(); return this.flingGain; },
    get radPerPixel() { return this.dragGain * CAM.SENS; },
    setAutoRotate(v) { this.autoRotate = !!v; if (ui.spinSw) ui.spinSw.set(this.autoRotate); this.wake(); return this.autoRotate; },
    setSpeed(v) { this.speed = v; if (ui.spinK) ui.spinK.set(v); this.wake(); return v; },
    setDist(v) { return setDist(v); }, setFov(v) { return setFov(v); }, reset() { resetView(); },
  };
  const fieldRate = { capMs: 0 };
  /* PERFORMANCE: 'full' updates every CPU window every frame; '120' updates them every 4th frame (≈30 Hz at 120 Hz)
     while the FIELD still presents every frame — the picture never waits for a readout.  The profile is an EMA of
     the milliseconds each stage costs per frame, so the mode is chosen on numbers, not on faith. */
  const perf = { mode: 'full', cpuEvery: 1, profile: { total: 0, field: 0, spectrum: 0, shadow: 0, orbit: 0, overlays: 0, dynamics: 0, slice: 0, qcd: 0, molecule: 0, calculus: 0, meters: 0, atoms: 0, wigner: 0, radiation: 0 }, counts: { frames: 0, cpu: 0 }, ring: new Float64Array(60), work: {}, wall: {} };   // work: an EMA of the cost of the updates that DID work (≥ 1 ms), wall: when the last one ran
  const frameBudget = createFrameBudget();
  const perfBudgetMs = () => frameBudget.milliseconds(perf.mode);
  const tick = (name, fn) => { const a = performance.now(); fn(); const d = performance.now() - a; perf.profile[name] = perf.profile[name] * 0.9 + d * 0.1; if (d >= 1) { perf.work[name] = perf.work[name] ? perf.work[name] * 0.7 + d * 0.3 : d; perf.wall[name] = a; } };
  /** THE READER LAW (wave 45).  While the transport PLAYS and the governor is on, a window whose update was measured over
      a frame's budget is PARKED — it runs on pause or edit, and its status says so — one over half a frame runs at most
      every 6 × its cost, and the rack's own scroll makes every reader yield for 150 ms.  Paused, every reader runs on
      every frame exactly as before, so nothing a proof reads after settle() has changed.  The SLICE was the case: a 128²
      resample of every populated mode, 20–100 ms each at 8 Hz — every hitch of the idle histogram, and 134 ms per call
      after a bow (wave 45's measurements). */
  const READERS = {};
  function may(name, w) {
    if (!clock.playing || !gov.on) { if (gov.parked.has(name)) unpark(name, w); return true; }
    const now = performance.now();
    if (now - gov.scroll < 150) return false;
    const cost = perf.work[name] || 0, park = gov.drop ? READER_LAW.parkDrop : READER_LAW.park, slow = gov.drop ? READER_LAW.slowDrop : READER_LAW.slow;
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
    r.title = keep.frames ? '' : 'KEEP FRAMES is off (SETTINGS): the playhead does not follow the clock — RATE and play / pause still work';
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
  /* ══ THE ROTATION AND DEFLECTION RATES — A RATE IS A NUMBER, AN ANGLE IS NOT ══════════════════
   * Josh: "modulation parameters for those rotation and deflection knobs seem juicy" — and, on the
   * problem below, "rotation/deflection could be like how you suggest."
   *
   * THE PROBLEM, MEASURED.  ROTATE z, STARK K_z and DEFECT L² are JOG WHEELS.  kit.js:213 —
   * `if (o.onDelta) { … o.onDelta(d * 2π); announce(true); return; }` — returns BEFORE touching `v`,
   * so `k.get()` hands back the constructor's `value` (0) for the life of the control.  And the
   * quantity does not exist underneath either: reg.rotateZ / rotateK / defectWait mutate the
   * coefficient vector in place (state.js:276, 291, 297) and NO angle is stored anywhere in the lab.
   * So these three cannot be ABSOLUTE modulation targets: the registry would believe it owns a
   * number the program does not keep, `modSyncBases` would re-base it from a getter that lies, and
   * the arc would be anchored to a fiction.
   *
   * ⚠ THE LAW THAT CHANGES.  The block above the `defs` array says "MODULATION IS AN OBSERVER
   * INSTRUMENT: … it never touches ψ."  That sentence is now half wrong, and the new line is drawn
   * on the DERIVATIVE, not on the target: a macro may drive dθ/dt, never θ.  Nothing accumulates a
   * fictional angle, so nothing can go stale; the register is still the hand's, and what the
   * modulator holds is HOW FAST the hand is turning.  reg.re0/im0 remain the only truth.
   *
   * THE RANGES ARE DERIVED, NOT CHOSEN — the house rule ("ranges are the dials' own … a registry
   * whose range disagrees with the knob lies") applied to a control that has no range of its own:
   *   · z   — D(R_z(α)) is a rigid spatial turn of the density, exact for any α, so it cannot
   *           alias: 2π rad/s is exactly ONE TURN A SECOND at full deflection.
   *   · K_z — applyRotateK's K_z blocks have INTEGER eigenvalues on every shell (the parabolic
   *           n₁ − n₂), so e^{−iθK_z} is 2π-periodic: 2π rad/s is one full Stark cycle a second.
   *   · L²  — applyDefectWait phases by l(l+1), which for l = 0…5 is {0, 2, 6, 12, 20, 30} — EVERY
   *           ONE EVEN, gcd 2 — so e^{iαL²} is π-PERIODIC, not 2π.  π rad/s is one full defect
   *           cycle a second, and the range is π rather than 2π because the operator says so.
   *
   * ZERO COSTS NOTHING, and that is the first line of rotStep: at rate zero not one coefficient is
   * touched, reg.version does not move, none of the twelve version-keyed caches is invalidated, and
   * the frame loop is given no reason to re-arm (§45, idle is zero work).  `map: 'bipolar'` makes
   * that exact rather than approximate — zero is a detent, and the registry's zero-depth
   * short-circuit hands back r.base ITSELF (B119), so an LFO parked at depth 0 writes exactly 0. */
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
    onState: () => { if (modView) modView.paint(true); schedule(TIER.PRESENT); }
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
  /* ── WAVE 65 · THE ARM.  Josh: "the play/pause button should have a small MOD button that glows on
   * or off.  When this is on, the modulations are active and the parameters move on all the racks."
   * ARMED IS THE SHIPPED DEFAULT, deliberately: `anyRouted()` already refuses to run a transport with
   * nothing routed, so an armed rack on a fresh visit behaves exactly as every build before this one
   * did, and the switch is a way to take the modulation OFF rather than a gate that has to be found
   * before it will go on.  It is this BROWSER's preference (`modArm` in the settings key) and never a
   * project's, on FROST's and KEEP FRAMES' own pattern. */
  let modArm = true;
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
  const setKnob = (k, v) => { if (k && !k.root.classList.contains('drag')) k.set(v); };
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

  /* ── THE BUSY MARK (wave 48, Josh) ─────────────────────────────────────────
   * "When things are loading/frozen in the app, show the little square logo next to the 'WAVES' text right next to
   * the cursor where loading would be and let it hue cycle around the current palette; no shadow."
   *
   * A COUNTER, not a flag: begin() / end() nest, so a bow inside a rebuild inside a project load is one mark, and it
   * goes when the LAST of them lands.  Three kinds of work raise it — every Worker call (the bow's slap, the BOX
   * packet, the period scan), every atom solve and project load, and every field rebuild — plus one rule that needs
   * no instrumentation at all: a frame gap over 250 ms means the main thread WAS blocked by something nobody wrapped,
   * so the mark shows for 600 ms after it.  That last rule is why the mark is honest about freezes it was never told
   * about.  Its motion is CSS (lab.css §48d): a thread that is stuck cannot animate anything from JS, so it doesn't try.
   * WAVE 53 took the ROTATION and the HUE CYCLE out of it (Josh: no spin anywhere in the logo, and colour motion is
   * the palette turning, not a hue phase).  What is left says "busy" two ways, neither of them a rotation: the mark
   * BREATHES in opacity, and the palette turns through its nine squares — the same turn the header mark runs.
   * The position is written as two custom properties on a pointermove — a WRITE, never a read, and only while the
   * mark is up, so a moving pointer over an idle lab costs one assignment and no style work at all. */
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
  if (!field.ok) showBanner('WebGPU unavailable', field.error + '. The FIELD needs WebGPU; SPECTRUM, SHADOW and METERS still run on the CPU.');
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
  const makeWorker = (label) => {
    let w = null, seq = 0; const waiting = new Map();
    const fail = (why) => { for (const p of waiting.values()) { clearTimeout(p.timer); p.res({ error: why }); } waiting.clear(); if (w) { try { w.terminate(); } catch (_) {} } w = null; console.warn('λWAVES ' + label + ' worker: ' + why + ' — that maths runs on the frame thread'); };
    try {
      w = new Worker(new URL('./mathworker.js', import.meta.url), { type: 'module' });
      w.onmessage = (e) => { const p = waiting.get(e.data.id); if (p) { waiting.delete(e.data.id); clearTimeout(p.timer); p.res(e.data); } };
      w.onerror = (e) => fail('worker error: ' + (e && e.message || e));
    } catch (e) { w = null; }
    const raw = (msg, transfer) => { if (!w) return Promise.resolve(null); return new Promise((res) => { const id = ++seq; const timer = setTimeout(() => { if (waiting.has(id)) { waiting.delete(id); res({ error: 'timeout' }); } }, 8000); waiting.set(id, { res, timer }); try { w.postMessage(Object.assign({ id }, msg), transfer || []); } catch (err) { clearTimeout(timer); waiting.delete(id); res({ error: String(err && err.message || err) }); } }); };
    const call = (msg, transfer) => busyWrap(raw(msg, transfer));   // wave 48: every worker job is a BUSY job
    /* WAVE 54 · PARKING is bookkeeping, not a job: it never raises the busy mark and it is never counted as work */
    return { label, get ok() { return !!w; }, call, raw, park: () => raw({ op: 'park' }), resume: () => raw({ op: 'resume' }), stat: () => raw({ op: 'stat' }) };
  };
  const maths = makeWorker('bow'), scan = makeWorker('period');   // TWO: a 1.2 s period scan (a BOX state) must never queue a bow behind it (measured: the packet landed at 1185 ms behind one)
  if (maths.ok) maths.call({ op: 'warm', ham: 'hydrogen', Z: 1 });                    // the SLAP tables, built once off the thread
  /* …and on this thread too (the K key and the SLAP trigger are synchronous): 8 ms at a time while the transport is idle */
  let warmTimer = 0;
  const warmKick = () => { warmTimer = 0; if (page.hidden) return; if (!kickReady() && !clock.playing) kickWarm(8); warmArm(kickReady() ? 2000 : clock.playing ? 500 : 40); };
  const warmArm = (ms) => { if (warmTimer) clearTimeout(warmTimer); warmTimer = setTimeout(warmKick, ms); };
  warmArm(1500);

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
   * (mir/host.js: prevWall = null, so the first dt after a stop is not a dt; camera.wake(): lastWall = now).  There
   * is no third mechanism here — every wall reference the loop holds is simply set to NOW before the first frame. */
  const page = { hidden: false, parks: 0, resumes: 0, hiddenAt: 0, hiddenMs: 0, firstDt: null, firstWall: 0, jumped: 0, mark: null, back: null, via: '' };
  function setPageHidden(on, via) {
    const want = !!on;
    if (want === page.hidden) return page.hidden;
    page.hidden = want; page.via = via || '';
    if (want) {
      page.parks++; page.hiddenAt = performance.now();
      page.mark = { t: clock.t, camT: camera.t, frames: stats.frames, presents: stats.presents, wall: page.hiddenAt };
      if (maths.ok) maths.park(); if (scan.ok) scan.park();     // the workers: the one thing the browser throttles for nobody
      if (warmTimer) { clearTimeout(warmTimer); warmTimer = 0; }  // the timer-driven reader
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
      if (maths.ok) maths.resume(); if (scan.ok) scan.resume();
      if (modHost) modHost.clock.setHidden(false);                // mir/host re-anchors itself: prevWall = null + reanchorTransport
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
  window.addEventListener('pageshow', () => setPageHidden(document.visibilityState === 'hidden', 'pageshow'));

  /* ── the router ───────────────────────────────────────────────────────── */
  let pending = TIER.NONE, rafId = 0, lastWall = 0, lastReconMs = -1e9, dragging = false, inLoop = false;
  let winStart = 0, winFrames = 0, winRecon = 0, winSteps = 0;
  /* a schedule() from INSIDE the loop only raises `pending` — the loop's own tail registers the next frame.  Before wave
     45 it registered a second callback (rafId is 0 while the loop runs), and every in-loop schedule — H₂ running, a
     governor step — added one more loop call per frame for good: METERS read 300 "fps" at a 58 Hz display. */
  const cornerAxis = el('button','corner-axis-hit',document.getElementById('lab'));
  cornerAxis.type='button'; cornerAxis.hidden=true; cornerAxis.setAttribute('aria-label','Swap corner axis side');
  cornerAxis.title='Double-click or double-tap to swap sides; Enter also swaps';
  const swapCorner=()=>{mat.cornerSide=mat.cornerSide==='left'?'right':'left';saveSettings();schedule(TIER.PRESENT);};
  let cornerTap=0;
  cornerAxis.addEventListener('click',e=>{const now=performance.now();if(e.detail===0 || now-cornerTap<400){swapCorner();cornerTap=0;}else cornerTap=now;});
  function placeCornerAxis() {
    cornerAxis.hidden=mat.axis===false || mat.axisMode!=='corner'; if(cornerAxis.hidden)return;
    const vw=window.innerWidth,vh=window.innerHeight,left=mat.cornerSide==='left';
    const rack=document.getElementById(left?'rackL':'rack'),r=rack&&rack.getBoundingClientRect();
    const inset=r&&r.width>0 ? (left?Math.max(0,r.right):Math.max(0,vw-r.left)) : 0;
    const x=left?Math.min(vw-48,inset+54):Math.max(48,vw-inset-54),y=vh-76;
    cornerAxis.style.left=(x-44)+'px';cornerAxis.style.top=(y-44)+'px';
    mat.cornerX=x/vw*2-1;mat.cornerY=1-y/vh*2;mat.cornerScaleX=64/vw;mat.cornerScaleY=64/vh;
  }
  document.addEventListener('transitionrun',e=>{if(!['rack','rackL'].includes(e.target.id)||mat.axisMode!=='corner')return;const end=performance.now()+500;const tick=()=>{schedule(TIER.PRESENT);if(performance.now()<end)requestAnimationFrame(tick);};tick();});
  document.addEventListener('transitionend',e=>{if(e.target.id==='rack'||e.target.id==='rackL')schedule(TIER.PRESENT);});
  let exportLocked = false;
  function schedule(tier) {
    if (exportLocked) return;
    if (modSyncing) return;                    // wave 52: a re-base writes what is already there (modSyncBases)
    if (tier > pending) pending = tier;
    /* WAVE 54 · A HIDDEN PAGE ASKS FOR NO FRAMES.  `pending` still rises, so nothing asked for is lost — the
       resume schedules once and the next frame does all of it.  See the measurement in setPageHidden. */
    if (page.hidden) { stats.scheduled = false; return; }
    if (!rafId && !inLoop) { rafId = requestAnimationFrame(loop); stats.scheduled = true; }
  }
  const tableOf = (a) => sturm.P ? sturm.rec[a] : (space === 'p' ? getHamiltonian().momentumTableFor(BASIS[a]) : getHamiltonian().tableFor(BASIS[a]));   // W-STURMIAN: the scaled record, else the operator's
  const sturmHalf = () => { const nm = reg.nmax(1e-3); return domainFor(nm) / (nm * sturm.lambda); };   // a Sturmian's extent is hydrogen's for n over nλ (ρ = 2λr against 2r/n)
  function modesAt(t) {
    if (molecule && molecule.on) return molecule.fieldModes(t);           // the molecule holds the field
    if (helium && helium.on) return helium.fieldModes();                   // helium: the conditional cloud of electron 2
    if (h2 && h2.on) return h2.fieldModes();                               // H₂: the Heitler–London one-electron density
    if (gas && gas.on) return gas.fieldModes(t);                           // the AXIAL GAS: the box's second register
    const c = reg.at(t, cRe, cIm), ids = reg.renderSet(RENDER_CAP).ids;
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
    if (domain.auto) domain.half = (h2 && h2.on) ? h2.half : (helium && helium.on) ? helium.half : (molecule && molecule.on) ? molecule.half : (space === 'p' ? HH.domainForP(reg.nmin()) : sturm.P ? sturmHalf() : HH.domainFor(reg.nmax(1e-3)));   // ignore a slap's 1e-4 tails
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
  /* ── THE CAMERA'S SECOND MODE (wave 54, board #43 — Josh: "I can't rotate past the poles") ───────────────────
   * TURNTABLE is the shipped camera, unchanged: two Euler angles about a world up of +z, a level horizon, and a
   * pitch clamp at ±1.52 rad because that is where the azimuth stops being defined.
   * FREE is NEBULA's: one unit quaternion, no angles, and therefore NO CLAMP TO HIT.  A drag builds a rotor in the
   * CAMERA's own frame and multiplies it on the right, so the axes are screen-relative at every pose and a drag
   * that would stop dead at the pole in TURNTABLE goes straight over it.  The price is written on the card:
   *
   *      A LEVEL HORIZON WITH POLES, OR NO POLES WITH A HORIZON THAT ROLLS.
   *
   * The roll is not a defect and cannot be removed: the drag's two generators are the camera's up and right, and
   * [ĵ, k̂] = 2î — a closed loop in the screen plane leaves a commutator along î, which IS the roll axis.  Any
   * "fix" is a re-levelling, i.e. TURNTABLE.
   * THE FRICTION LAW IS THE SAME LAW IN BOTH MODES.  ω = ω_amb + d with ḋ = −μd, integrated in closed form, is
   * arithmetic on two scalars and does not care what they turn: what changes is the AXIS each scalar turns about.
   * The AMBIENT stays a WORLD-z drive in both modes — AUTO-ROTATE turns the cloud about the quantization axis, and
   * that is physics — while the RESIDUAL is world-z-yaw + clamped-pitch in TURNTABLE and screen-relative in FREE.
   * At a level horizon the two bases coincide and FREE reproduces TURNTABLE exactly; tilted, the residual follows
   * the screen, which is the whole point of a trackball. */
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
    if (ui.camNote) ui.camNote.textContent = obs.mode === 'free' || camLevel.from ? CAM_TRADE.free : CAM_TRADE.turntable;
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
  function syncCamUI() { if (ui.zoomK) ui.zoomK.set(obs.dist); if (ui.fovK) ui.fovK.set(obs.fov); if (ui.gainK) ui.gainK.set(camera.dragGain); if (ui.flingK) ui.flingK.set(camera.flingGain); if (ui.camGainNote) ui.camGainNote(); }
  /** RESET VIEW (the trigger, R, a double-click and a double-tap): the shipped pose and the motion with it —
      AUTO-ROTATE is a mode, not a pose, so the ambient drive is left exactly where the switch put it */
  function resetView() { const m = obs.mode; camLevel.from = null; Object.assign(obs, CAM.HOME); obs.mode = m; obs.quat = quatFromYawPitch(CAM.HOME.yaw, CAM.HOME.pitch); camera.stop(); syncCamUI(); schedule(TIER.PRESENT); }   // wave 54: the pose is the same pose in either mode
  function loop(nowMs) {
    rafId = 0;
    if (page.hidden || exportLocked) { stats.scheduled = false; return; }   // wave 54: a frame that arrived after the tab went away does nothing and re-arms nothing
    inLoop = true;
    placeCornerAxis();
    if(ui.frameSw) ui.frameSw.root.dataset.mode=mat.frame===false?'OFF':(mat.frameMode||'box').toUpperCase();
    if(ui.axisSw) ui.axisSw.root.dataset.mode=mat.axis===false?'OFF':(mat.axisMode||'box').toUpperCase();
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
      modSyncBases();
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
        feedAudio(feedHz);
        modHost.clock.advanceTo(now);
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
    if (!dragging && camera.moving) {                                // CAMERA clock: observer only (§12) — the law, never the state
      if (cameraStep(Math.min(0.1, Math.max(0, now - lastWall)))) tier = Math.max(tier, TIER.PRESENT);
    }
    lastWall = now;
    if (tier >= TIER.REBUILD) applyRebuild();
    let modes = null;
    if (tier >= TIER.RECONSTRUCT) {
      const due = (nowMs - lastReconMs) >= fieldRate.capMs;          // FIELD clock: cadence, never c
      if (tier !== TIER.EVOLVE || due) { modes = modesAt(clock.t); lastReconMs = nowMs; stats.fieldT = clock.t; winRecon++; }
    }
    const tFrame0 = performance.now();
    if (tier >= TIER.PRESENT && field.ok) {                          // PRESENTATION
      tick('field', () => { field.resize(quality.scale * (quality.auto ? quality.autoScale : 1)); field.frame({ modes, refModes: pendingRef, obs, mat }); });
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
    perf.ring[perf.counts.frames % 60] = 0;                            // filled at the tail with this frame's own main-thread cost
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
      const m = Math.min(60, gov.n), s = Array.from(gov.ring.subarray(0, m)).sort((x, y) => x - y); gov.median = s[m >> 1];
      if (gov.on && clock.playing) {
        const budget = perfBudgetMs();
        if (gov.median > budget * 1.68) {
          gov.okSince = 0;
          /* WAVE 67: the FROST arm is GONE from here.  It used to strip `body.frost` when the frame was far
             longer than the maths in it — which took the FILL with the filter and is the grey Josh filed as a
             bug.  The same economy is now the user's own FROST · STILL policy, which moves the filter and
             nothing else.  What is left is the grid notch, which changes no appearance at all. */
          if (gov.drop < 2) { gov.drop++; gov.changes++; gov.since = nowMs; gov.n = 0; schedule(TIER.REBUILD); }   // the ring restarts: the next judgment measures the new state, not the old frames
        } else if (gov.median < budget * 1.32) { if (!gov.okSince) gov.okSince = nowMs; else if (nowMs - gov.okSince >= 3000 && gov.drop > 0) { gov.drop--; gov.changes++; gov.okSince = nowMs; gov.since = nowMs; gov.n = 0; schedule(TIER.REBUILD); } }
        else gov.okSince = 0;
      }
    }
    if (!clock.playing && gov.drop) { gov.drop = 0; gov.okSince = 0; gov.changes++; schedule(TIER.REBUILD); }   // paused: nothing to govern — the user's grid comes back at once
    const c = reg.at(clock.t, cRe, cIm);
    perf.counts.frames++;
    const cpuTick = !clock.playing || (perf.counts.frames % perf.cpuEvery) === 0;   // the CPU windows' cadence
    if (cpuTick) {
      perf.counts.cpu++;
      if (reg.version !== govVersion) { govVersion = reg.version; if (gov.parked.size) { const np = reg.populated().length; for (const [name, p] of [...gov.parked.entries()]) if (np < p.pop) unpark(name, READERS[name]); } }   // an edit that SHRANK the state: a parked reader may have got cheap — re-measured (one that grew stays parked: the landing frame measured 449 ms with the SLICE re-measuring on 91 labels)
      if (!uiHidden && live(wSpec) && may('spectrum', wSpec)) tick('spectrum', () => spectrum.update(c, clock.t));
      if (!uiHidden && live(wSh) && may('shadow', wSh)) tick('shadow', () => shadowView.update(c, clock.t, reg.populated(), spectrum.selected));
      if (!uiHidden && live(wOrb) && may('orbit', wOrb)) tick('orbit', () => { orbit.update(obs); keplerRowSync(); });   // the Kepler knobs' own liveness rides the tick this window already pays for, keyed on reg.version like every other reader
    }
    tick('overlays', () => {
      if (space === 'x' && getHamiltonian().hydrogenTheorems && !sturm.P && !(molecule && molecule.on) && !(helium && helium.on) && !(h2 && h2.on)) {       // the overlays are position-space objects, and theorems about hydrogen
        if (live(wVor)) vortex.update(reg, clock.t, obs, domain.half, clock.playing); else if (dom.vortex) dom.vortex.getContext('2d').clearRect(0, 0, dom.vortex.width, dom.vortex.height);
        if (particles.on) { if (perf.cpuEvery === 1 || (perf.counts.frames % 2) === 0) particles.advance(reg, clock.t, domain.half); particles.draw(obs, domain.half); }   // 120 Hz: step every other frame (the integrator uses the logical dt, so nothing is skipped)
        if (kepler.on || kdrag || keplerDirty) { kepler.update(reg, clock.t, obs, domain.half); keplerDirty = !!kepler.on; if (!kepler.on && !bow && dom.kepler.width > 1) { dom.kepler.width = 1; dom.kepler.height = 1; } }   // wave 45: drawn while on, cleared once after, and its full-stage bitmap released (4.4 MB here, 22 MB at the iPad's DPR)
      } else { for (const c of [dom.vortex, dom.particles, dom.kepler]) if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height); }
      fieldlines.update(reg, clock.t, obs, domain.half, clock.playing, getZ(), fieldOn());   // the classical field of ρ: its own guard, its own throttle
      kepler.bowFrame();
    });
    /* the MOLECULE and H₂ integrators feed the FIELD, so they run whether or not their card can be seen;
       only moPanel's repaint is chrome, and that is the one thing the hidden interface drops (wave 48) */
    if (cpuTick && live(wMol)) tick('molecule', () => { if (molecule) molecule.update(clock.t); if (moPanel && !uiHidden) moPanel.update(clock.t, clock.playing); if (pulsePanel && !uiHidden) pulsePanel.update(clock.t); if (h2 && h2.on) { h2.update(clock.t); if (h2.run && clock.playing) schedule(TIER.RECONSTRUCT); } });
    if (cpuTick && !uiHidden) {
      if (live(wDyn) && may('dynamics', wDyn)) tick('dynamics', () => dynamics.update(reg, clock.t, clock.playing));
      if (live(wSlice) && may('slice', wSlice)) tick('slice', () => slice.update(reg, clock.t, clock.playing));
      if (live(wQCD) && may('qcd', wQCD)) tick('qcd', () => qcd.update());
      if (live(wAtoms) && may('atoms', wAtoms)) tick('atoms', () => atomsView.update());
      if (live(wWig) && !wWig.root.classList.contains('closed') && may('wigner', wWig)) tick('wigner', () => {          // the WIGNER slice: its own throttle (2 Hz while playing, wignerview.js), its own guard
        const G = hydroReader(); wWig.setStatus(G.status === null ? WIG_OK : G.status, G.status === null ? '' : 'warn');
        wignerView.update(reg, clock.t, clock.playing, G.on, G.why, domain.half);
      });
      if (live(wRad) && !wRad.root.classList.contains('closed') && may('radiation', wRad)) tick('radiation', () => {        // the DIPOLE: cheap, so every CPU tick
        const G = hydroReader(); radiationView.update(reg, clock.t, clock.playing, G.on, G.why);
        const st = G.status !== null ? G.status : radiationView.cache ? RAD_OK : 'no dipole in this state';
        wRad.setStatus(st, st === RAD_OK ? '' : 'warn');
      });
      if (live(wCalc) && may('calculus', wCalc)) tick('calculus', () => { if (calculus && !sturm.P && !(molecule && molecule.on) && !(helium && helium.on) && !(h2 && h2.on)) calculus.update(reg, clock.t); });
      ui.hc.set(reg.energy().toFixed(5));
      if (sturm.P && ui.sturmRo && sturm.roVersion !== reg.version) paintSturmRo();   // W-STURMIAN: the scale's readout follows the state
      if (gas && gas.on && ui.gasRo && (perf.counts.cpu % 6) === 0) { const s = gas.stats(clock.t); ui.gasRo.set(`${(100 * gas.captured).toFixed(1)}% held · ⟨z⟩ ${s.z.toFixed(2)} · σ_z ${s.sz.toFixed(2)}`, gas.captured > 0.85 ? 'ok' : 'warn'); }
    }
    if (!uiHidden) transport.update();
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
    /* WAVE 105 · A LIVE MICROPHONE IS ITS OWN REASON TO KEEP THE FRAME.  Without this the loop
       quiesced the moment nothing else was moving — which is the BOOT DEFAULT — so pressing MIC with
       the transport stopped opened the device and then never read it: the meter sat at 0.00, the
       followers never moved, and the recording indicator stayed lit on a capture nothing was using. */
    if (clock.playing || camera.moving || camLevel.from || pending || (audioCap && audioCap.live) || (modHost && modHost.clock.isRunning()) || rotDriving()) { rafId = requestAnimationFrame(loop); stats.scheduled = true; }   // wave 50: while |ω| is above REST too — and a camera at rest schedules NOTHING; wave 52: a running modulation is its own reason to keep the frame; and so is a NON-ZERO ROTATION RATE, which the hand can set on a paused instrument with no modulator running at all — without this clause it would turn exactly once
    else { stats.scheduled = false; stats.fps = 0; stats.reconPerSec = 0; stats.stepsPerSec = 0; autoQ.lastMs = 0; frameBudget.breakSequence(); }
    if (cpuTick && !uiHidden && live(wMet) && (!clock.playing || nowMs - metersWall >= 100)) { metersWall = nowMs; tick('meters', () => { meters.update(meterSnapshot()); badges.update(); paintGovernor(); }); }   // wave 45: 10 Hz while playing (fifteen strings and a snapshot per call), every frame when paused
    if(ui.sliceMini && ui.sliceMini.root.clientWidth>0)ui.sliceMini.paint();
    const spent = performance.now() - tFrame0;
    perf.profile.total = perf.profile.total * 0.9 + spent * 0.1;
    perf.ring[perf.counts.frames % 60] = spent;                        // wave 48: the loop's OWN main-thread ms, 60 deep — LW.perf.median reads it
  }
  function meterSnapshot() {
    const rs = reg.renderSet(RENDER_CAP);
    return { norm: reg.norm(), energy: reg.energy(), autocorr: reg.autocorrelation(clock.t).abs, t: clock.t, playing: clock.playing,
      rendered: rs.rendered, populated: rs.populated, masked: rs.masked, truncated: rs.truncated, covered: rs.coveredFraction,
      res: field.ok ? field.resolution : 0, half: domain.half, steps: mat.steps, encodeMs: stats.lastEncodeMs,
      fps: stats.fps, reconPerSec: stats.reconPerSec, stepsPerSec: stats.stepsPerSec, scheduled: stats.scheduled, lastTier: stats.lastTier, tiers: stats.tiers,
      status: statusLine(), profile: perf.profile, perfMode: perf.mode, unit: getHamiltonian().unit };
  }
  /** the METERS line for the governor: its state, the median it judged, the grid it runs, and what it parked */
  function paintGovernor() {
    if (!ui.govRo) return;
    const st = !gov.on ? 'OFF' : gov.drop ? 'STEPPED −' + gov.drop : 'nominal';
    ui.govRo.set(`${st} · ${gov.median ? gov.median.toFixed(1) : '—'} ms · ${field.ok ? field.resolution : 0}³`, !gov.on ? '' : gov.drop ? 'warn' : 'ok');
    const parked = [...gov.parked.entries()].map(([n, p]) => n + ' ' + p.cost.toFixed(0) + ' ms');
    ui.govRo.setSub((parked.length ? 'parked: ' + parked.join(' · ') + ' · re-probed every ' + (READER_LAW.probeMs / 1000).toFixed(0) + ' s' : 'nothing parked') + ' · budget ' + (perfBudgetMs() * 1.68).toFixed(0) + ' ms over the last 60 frames · scale ' + (100 * quality.scale * (quality.auto ? quality.autoScale : 1)).toFixed(0) + '%' + (maths.ok && scan.ok ? ' · the impulse, the packet and the period scan off the frame' : ' · no worker: the maths runs on the frame'));
  }
  function statusLine() {
    const rs = reg.renderSet(RENDER_CAP);
    let s = reg.field.Fz !== 0 ? 'EXACT WITHIN EACH SHELL (Stark) · EXACT REAL shadow · NUMERICAL field'
      : reg.field.Bz !== 0 ? 'EXACT ANALYTIC state + evolution (Zeeman) · EXACT REAL shadow · NUMERICAL field'
      : 'EXACT ANALYTIC state + evolution · EXACT REAL shadow · NUMERICAL field';
    if (sturm.P) s = 'EXACT EVOLUTION IN THE STURMIAN BASIS λ = ' + sturm.lambda.toFixed(3) + ' (S⁻¹H, VARIATIONAL eigenvalues, S-norm' + (reg.field.Bz !== 0 ? ', Zeeman' : '') + ') · EXACT REAL shadow · NUMERICAL field';
    if (h2 && h2.on) return 'H₂ · Heitler–London · EXACT integrals · VARIATIONAL curves · CLASSICAL nuclei (Born–Oppenheimer) · one-electron DENSITY · NUMERICAL field';
    if (helium && helium.on) return 'HELIUM · Hylleraas · EXACT integrals · VARIATIONAL energy · the conditional density of electron 2 given electron 1 · NUMERICAL field';
    if (molecule && molecule.on) return 'H₂⁺ · EXACT integrals · VARIATIONAL energies · EXACT evolution in the LCAO space · NUMERICAL field';
    if (reg.damping > 0) s = 'TOY DRAG γ = ' + reg.damping.toFixed(3) + ' · NON-UNITARY · ' + s;
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
      wSpec.setStatus(toy ? 'RATES ≠ 1 · TOY: H rescaled per label' : getHamiltonian().label, toy ? 'warn' : (getHamiltonian().id === 'hydrogen' ? '' : 'live'));
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

  /* ── WAVE 56 · THE MERGED **WAVE** WINDOW (board #59) ──────────────────────────────────────────
   * Josh: "Space and Draw windows together. Space layout up top and then the draw layout below, have
   * invert, frame, and axis be located in the bottom of this new window. Just title this window 'wave'
   * and then the two sections within are space and draw."  Asked whether it wanted an id of its own:
   * "we don't need to make a new wave id".
   * SO THIS IS A RETITLE AND AN ABSORPTION, NOT A NEW DEVICE.  The id stays `observer` because five
   * things read it and none of them is this file: lab.css and skin.css make the 3×2 observables grid
   * and its touch sizing from `.dev[data-id="observer"]`, the settings key's `closed[]` names it, a
   * saved LAYOUT names it, and the browser gate measures it.  `wStyle` IS `wObs` from here on, so every
   * line below that still says `wStyle.body` still says exactly where that control lives. */
  const wObs = device({ id: 'observer', eyebrow: 'WAVE', title: 'SPACE · DRAW · WHAT IS DRAWN OVER THE FIELD', status: 'never mutates ψ' });
  const wPal = device({ id: 'palette', eyebrow: 'PALETTE', title: 'THE COLOURING OF THE COMPLEX PLANE', status: 'design choice · ψ untouched' });
  const wStyle = wObs;                    // WAVE 56: DRAW STYLE was its own window (id `style`) until board #59 merged it in
  const wCam = device({ id: 'camera', eyebrow: 'CAMERA', title: 'ORBIT · SPIN · THE <m>Δρ</m> REFERENCE', status: 'observer only' });
  let capApi = null;                      // wave 58: the CAPTURE group's handle, published out of the block that builds it (LW reads it)
  const wClip = device({ id: 'clip', eyebrow: 'SLICE / CLIP', title: 'VOLUME · CLIP · SLAB', status: 'observer only' });
  {
    /* THE THREE SECTIONS, created here in the order they are read so that the two groups filled later
       (DRAW is filled ~130 lines down, where the style controls have always been built) still land in
       Josh's order: SPACE on top, DRAW below it, and the three overlay switches at the foot. */
    /* ⚠ WAVE 106 · THE TWO SECTIONS.  It was THREE — SPACE, DRAW, and a bare `row tight` at the foot
       holding INVERT, FRAME and AXIS (wave 56, board #59) — until Josh moved all three out: "I think
       invert in draw should move to pallete and frame and axis in draw should move to settings
       alongside a toggle to make the axis RBG or CMY."  THE EMPTY ROW IS NOT LEFT STANDING: a `row`
       with nothing in it is a gap in a card nobody can account for, and `.row` carries its own gap. */
    const gSpace = group(wObs.body, 'SPACE');
    const gDraw = group(wObs.body, 'DRAW');
    {
      const r0 = el('div', 'row', gSpace);
      ui.spaceSeg = seg({ label: 'the same state, two exact pictures', value: 'x', options: [
        { id: 'x', label: 'POSITION ψ(x)', title: 'the wavefunction in space' },
        { id: 'p', label: 'MOMENTUM φ(p)', title: 'its Fourier transform in closed form (Podolsky–Pauling 1929) — under Fock\'s map every shell is rigid on S³, so the rotors merely TURN this picture' }],
        onChange: (v) => { space = v; schedule(TIER.REBUILD); } });
      r0.appendChild(ui.spaceSeg.root);
      ui.spaceNote = el('div', 'sturm-note', gSpace); ui.spaceNote.hidden = true;          // its own class: the ⓘ sweep folds every .note away, and this one must be seen
      ui.spaceNote.innerHTML = '<b>STURMIAN:</b> momentum space is not built for the scaled radials (the Podolsky–Pauling transform would need its own table) — position space only until SCALE is back on HYDROGEN.';
    }
    const r1 = el('div', 'row', gSpace);
    ui.viewSeg = seg({ label: 'OBSERVABLE (colour is semantic)', value: 'phase', options: [
      /* WAVE 69 · THE OBSERVABLES ARE THE FIRST THING TO WEAR THE MATH FACE, and Josh chose them:
         these six labels are the only place in the lab where the label IS the mathematics and nothing
         else — no English word to protect, no unit, no digit column.  Each is one `<m>` run. */
      { id: 'density', label: '<m>ρ=|ψ|²</m>', title: 'probability density' }, { id: 'phase', label: '<m>arg ψ</m>', title: 'phase as hue, density as opacity' },
      { id: 'real', label: '<m>Re ψ</m>', title: 'signed, diverging: orange +, blue −' }, { id: 'imag', label: '<m>Im ψ</m>' }, { id: 'diff', label: '<m>Δρ</m>', title: 'ρ(t) − ρ_ref: yellow gain, blue loss' }, { id: 'reim', label: '<m>Re+Im</m>', title: 'both parts superposed — a heuristic placement, two pictures in one volume: orange/blue for Re, green/violet for Im' }],
      onChange: (v) => { mat.view = VIEW[v]; schedule(TIER.PRESENT); } });
    r1.appendChild(ui.viewSeg.root);
    const r2 = el('div', 'row tight', gSpace);
    ui.expK = knob({ label: 'EXPOSURE', min: 0.08, max: 12, value: 1, log: true, fmt: (v) => v.toFixed(2), onInput: (v) => { if (modHand('material.exposure', v)) return; mat.exposure = v; schedule(TIER.PRESENT); } }); r2.appendChild(ui.expK.root);
    ui.softK = knob({ label: 'SOFT', min: 0.3, max: 2.2, value: 0.7, fmt: (v) => 'γ' + v.toFixed(2), onInput: (v) => { if (modHand('material.softness', v)) return; mat.softness = v; schedule(TIER.PRESENT); } }); r2.appendChild(ui.softK.root);
    ui.hueK = knob({ label: 'HUE', min: 0, max: 1, value: 0, wrap: true, fmt: (v) => (v * 360).toFixed(0) + '°', onInput: (v) => { if (modHand('material.hue', v)) return; mat.hueShift = v; applyAccent(); schedule(TIER.PRESENT); } }); r2.appendChild(ui.hueK.root);
    /* WAVE 56 (board #59): INVERT, FRAME and AXIS sit together at the FOOT of the window, out of SPACE and out
       of DRAW, because the three of them are one thought — what is drawn OVER the field — and none of them is
       about ψ.  INVERT flips the ink of the cloud itself; FRAME is the domain cube; AXIS is the three xyz lines.
       WAVE 53 (Josh, board #40) built FRAME and AXIS as two objects with two switches: each has its own state in
       `mat`, each rides in the settings key and in a project, and field.js draws them from one buffer in two draw
       calls, so turning either off leaves the other exactly where it was. */
    /* ⚠ INVERT, FRAME AND AXIS ARE NOT BUILT HERE ANY MORE.  Wave 56 put the three in one row at the
       foot on the argument that they are one thought — what is drawn OVER the field.  Josh has split
       that thought where it actually divides: INVERT is about the COLOURING of the cloud, so it goes
       to PALETTE; FRAME and AXIS are furniture this browser remembers, so they go to SETTINGS beside
       the other chrome switches.  Each is built at its new seat under its NEW window's own spelling.
       `ui.invertSw`, `ui.frameSw` and `ui.axisSw` keep their names, which is why toggleUI, restore(),
       hLookWrite and LW.setFrame/setAxis needed no edit at all — the handle IS the seam. */
    /* ── THEME and SURFACE: the interface's skin, and the stage underneath it ── */
    ui.set = device({ id: 'settings', eyebrow: 'SETTINGS', title: 'INTERFACE · THEME · QUALITY', status: 'saved in this browser' });
    const gi = group(ui.set.body, 'INTERFACE');
    const ri = el('div', 'row tight', gi);
    ui.badgesSw = sw({ label: 'STATUS TAGS', value: true, title: 'the EXACT ANALYTIC / NUMERICAL tags at the top', onChange: (v) => { document.body.classList.toggle('no-badges', !v); saveSettings(); } }); ri.appendChild(ui.badgesSw.root);
    ui.hintSw = sw({ label: 'HINT BAR', value: true, title: 'the one-line gesture hint above the transport', onChange: (v) => { document.body.classList.toggle('no-hint', !v); saveSettings(); } }); ri.appendChild(ui.hintSw.root);
    ui.capSw = sw({ label: 'STAGE CAPTIONS', value: true, title: 'the KEPLER / VORTEX lines at the foot of the stage', onChange: (v) => { document.body.classList.toggle('no-captions', !v); saveSettings(); schedule(TIER.PRESENT); } }); ri.appendChild(ui.capSw.root);
    ri.appendChild(trig({ label: 'RESET LAYOUT', title: 'dock every floating window, reopen and unfold every one of them, undock the transport, both racks as shipped', onFire: () => layout.resetLayout() }).root);
    ri.appendChild(trig({ label: 'FORGET', title: 'clear what this browser remembers (theme, accents, tags, closed windows) and reload', onFire: () => { try { localStorage.removeItem(SETTINGS_KEY); } catch (e) {} location.reload(); } }).root);
    /* ⚠ WAVE 106 · THE FIELD'S OWN CHROME, MOVED HERE OUT OF THE WAVE WINDOW (Josh: "frame and axis
       in draw should move to settings alongside a toggle to make the axis RBG or CMY", and "make the
       buttons behave according to their window's peers").  STATUS TAGS · HINT BAR · STAGE CAPTIONS are
       the chrome of the INTERFACE; these are the chrome of the FIELD, and all five are remembered by
       this browser and touch ψ in no way whatever.
         THEY WEAR THIS WINDOW'S SPELLING AND NOT THE ONE THEY ARRIVED IN: every peer here hands its
       explanation to sw() as the `title:` OPTION, and an ENUMERATION here is a seg() and never a pair
       of switches — which is why AXIS COLOUR is a seg.
         ⚠ IT HAS THREE SEATS AND NOT THE TWO THE ASK READS LIKE, AND THE THIRD IS WHY WAVE 48 SURVIVES.
       Josh ruled the theme's own binding himself — vivid CMY on DARK, warm/cool on LIGHT.  A two-seat
       toggle would have had to DELETE that ruling: whichever seat shipped as default, one theme would
       have lost the colours it was given.  THEME is that ruling, kept, and it is the shipped default,
       so a browser that never touches this control sees exactly the picture wave 48 built. */
    const rc = el('div', 'row tight', gi);
    ui.frameSw = sw({ label: 'FRAME', value: true, title: 'the domain cube around the state — black on LIGHT, white on DARK; an observer object, never ψ', onChange: () => { const modes=['box','lattice','dots','off']; const current=mat.frame===false?'off':mat.frameMode||'box'; const next=modes[(modes.indexOf(current)+1)%modes.length]; mat.frame=next!=='off'; mat.frameMode=next==='off'?'box':next; ui.frameSw.set(mat.frame); ui.frameSw.root.title='FRAME · '+next.toUpperCase(); saveSettings(); schedule(TIER.PRESENT); } });
    rc.appendChild(ui.frameSw.root);
    ui.axisSw = sw({ label: 'AXIS', value: true, title: 'the three xyz axes through the origin — z is the quantization axis. WHETHER they are drawn is this switch; WHAT COLOUR they are drawn in is the seg beside it', onChange: () => { const modes=['box','corner','off']; const current=mat.axis===false?'off':mat.axisMode||'box'; const next=modes[(modes.indexOf(current)+1)%modes.length]; mat.axis=next!=='off'; mat.axisMode=next==='off'?'box':next; ui.axisSw.set(mat.axis); ui.axisSw.root.title='AXIS · '+next.toUpperCase(); saveSettings(); schedule(TIER.PRESENT); } });
    rc.appendChild(ui.axisSw.root);
    ui.axisInkSeg = seg({ label: 'AXIS COLOUR', value: 'theme', options: [
      { id: 'theme', label: 'THEME', title: 'follow the theme, as the lab has always done: vivid CMY on DARK (x cyan, y magenta, z yellow), warm/cool on LIGHT. This is the shipped seat and it changes nothing' },
      { id: 'cmy', label: 'CMY', title: 'x cyan, y magenta, z yellow, in BOTH themes — the subtractive triple, and the one that stays legible across a coloured cloud' },
      { id: 'rgb', label: 'RGB', title: 'x red, y green, z blue, in BOTH themes — the convention every other 3D tool draws its axis gizmo in' }],
      onChange: (v) => { mat.axisInk = v; saveSettings(); schedule(TIER.PRESENT); } });
    rc.appendChild(ui.axisInkSeg.root);
    ri.appendChild(trig({ label: 'SHOW THE WARNING AGAIN', title: 'bring back the photosensitivity notice — the same pane this browser saw on its first load, and it is forgotten again so the NEXT load shows it too', onFire: () => { if (__LW_hooks.warning) { __LW_hooks.warning.reset(); __LW_hooks.warning.show(); } } }).root);
    el('div', 'note', gi).innerHTML = '<b>SETTINGS</b> is the interface\'s own window: the theme and surface, the accent wheel, every key binding, the field\'s quality and the chrome switches. What you set here is remembered by this browser (FORGET clears it). Windows are of four kinds — the <b>core</b> instrument (PREPARE, EIGENVALUE, VIEW), <b>information panels</b> that read and report (captions always visible, a ⧉ COPY digest in the header), <b>control surfaces</b> and <b>other models</b> that start folded. Every window has ⏻ to stop its reader, ▾ to fold, × to close; the + at the top of a rack reopens.';
    const gt = group(ui.set.body, 'THEME  ·  SURFACE');
    const rt = el('div', 'row tight', gt);
    const THEMES = { dark: { bg: [0.028, 0.038, 0.058], invert: false }, light: { bg: [0.93, 0.95, 0.975], invert: true } };
    /* THE THEME HAS THREE SEATS AND TWO VALUES (wave 48, Josh).  `themeChoice` is what the user picked — light,
       dark or SYSTEM — and is what the settings key remembers; `theme` is the RESOLVED one, always light or dark,
       and is what body[data-theme], mat.bg, mat.lightUI, the accents and the warning pane all read.  SYSTEM follows
       prefers-color-scheme live: the matchMedia listener re-resolves without touching the choice, so a user who
       chose SYSTEM keeps SYSTEM when the OS flips.  The shipped default is LIGHT (applySettings' `|| 'light'`). */
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
      mat.bg = THEMES[theme].bg.slice();                                   // INVERT is the user's: a theme never flips it (Josh)
      mat.lightUI = theme === 'light';                                     // wave 48: the GPU chrome (the cube frame, the three axes) cannot read a CSS token — it reads this
      if (ui.themeSeg) ui.themeSeg.set(themeChoice);
      if (__LW_hooks.themeChanged) __LW_hooks.themeChanged(theme);
      applyAccent(); saveSettings();
      schedule(TIER.PRESENT);
    }
    if (sysMQ) { const onSys = () => { if (themeChoice === 'system') setTheme('system'); };
      if (sysMQ.addEventListener) sysMQ.addEventListener('change', onSys); else if (sysMQ.addListener) sysMQ.addListener(onSys); }
    ui.themeSeg = seg({ label: 'THEME', value: 'light', options: [
      { id: 'light', label: 'LIGHT', title: 'light cards, dark ink — and the stage underneath goes light with the density drawn as ink (INVERT on); the domain cube is drawn in near-black' },
      { id: 'dark', label: 'DARK', title: 'dark cards, light ink, a near-black stage — and the three axes in vivid CMY (x cyan, y magenta, z yellow)' },
      { id: 'system', label: 'SYSTEM', title: 'follow the operating system’s light / dark setting, live — prefers-color-scheme decides, and a change out there changes the lab here without touching this choice' }],
      onChange: (v) => setTheme(v) });
    rt.appendChild(ui.themeSeg.root);
    /* ── WAVE 67 · THE WINDOW'S OWN SHAPE, and the vividness with its price on the label ────────────────
     * DISCONNECTED is Josh's word for BASINS' FROST skin and it is a LOOK, not a drag mode: the window
     * stops being one slab and becomes a bar-chip and a body-card with real air between them, the field
     * showing through the gap — and on the stage that gap is a genuine hole you can turn the camera in.
     * FROST is now a POLICY rather than a switch, because the cost was measured and it is conditional on
     * MOTION and on nothing else: 17.10 ms with the field still, 50.3 ms with it moving, and the same
     * 50.3 whether the filter is a blur, a saturate or all three of BASINS' terms — the bill is the
     * backdrop CAPTURE.  So the seats are the three honest answers to "when", and the title says the
     * number rather than implying one. */
    ui.discSw = sw({ label: 'DISCONNECTED', value: false, title: 'take every window apart into a CONSTELLATION: its header becomes a floating bar-chip, its body a separate card, and the 7 px between them is a real hole — over the stage a press there turns the camera. OFF is the shipped look and is the one this rack has always had (wave 67 shipped it ON by mistake: Josh meant the MODULATION window only). Fused on a phone, where a constellation has no air to breathe', onChange: (v) => setDisconnected(v) });
    rt.appendChild(ui.discSw.root);
    ui.frostSeg = seg({ label: 'FROST', value: 'always', options: [
      { id: 'off', label: 'OFF', title: 'no backdrop filter: the card is its tint, its hairline and its sheen, and the field behind it is untouched. This is the shipped default and the only arm that costs nothing while anything moves' },
      { id: 'still', label: 'STILL', title: 'the vividness while the transport is STOPPED, held while it runs. MEASURED on this rig: with the field paused every filter reads 17.10 ms — identical to no filter at all, i.e. free — and over a moving field the same filter reads 50.3 ms (58.5 → 19.9 fps). Only the FILTER moves: the fill, the border, the sheen and the shadow are the same either side of it, so the glass never goes grey under your hand' },
      { id: 'always', label: 'ALWAYS', title: 'the exact BASINS recipe at all times — blur(GLASS BLUR) saturate(188%) brightness(108%), which is the vividness Josh named. MEASURED: 58.5 → 19.9 fps over a moving field, and it does NOT get cheaper by dropping the blur, because the cost is the backdrop capture and not the kernel (a saturate alone measured the same 50.3 ms). Worth it for a still, and it is a stated price rather than a surprise' }],
      onChange: (v) => setFrost(v) });
    rt.appendChild(ui.frostSeg.root);
    el('div', 'note', rt, 'frost: the picture\u2019s colour through the glass \u00b7 free while the field is still, a third of the frame rate while it moves');
    ui.blurK = knob({ label: 'GLASS BLUR', min: 0, max: 30, value: 11,   /* wave 101: Josh's new default */ fmt: (v) => v.toFixed(0) + ' px', title: 'the blur radius of the NOTEBOOK glass and of FROST', onInput: (v) => { document.documentElement.style.setProperty('--glass-blur', v.toFixed(1) + 'px'); }, onChange: () => saveSettings() }); rt.appendChild(ui.blurK.root);
    /* THE STAGE KNOB IS THE HEADER λ's GROUND (wave 59), which is why moving it repaints the mark: `#title`
       is `background: none` over `#field`, so `mat.bg` — this value — is the surface the λ is drawn on, and a
       correction against a ground the hand can drag is not a correction.  One named function, so the knob,
       LW.setStage and the gate all take the same road. */
    function setStageMix(v) { const d = THEMES.dark.bg, l = THEMES.light.bg; mat.bg = [0, 1, 2].map((i) => d[i] + (l[i] - d[i]) * v); paintMarks(); schedule(TIER.PRESENT); }
    ui.stageK = knob({ label: 'STAGE', min: 0, max: 1, value: 0.04, fmt: (v) => (v * 100).toFixed(0) + '%', onInput: (v) => { if (!modHand('material.stage', v)) setStageMix(v); } });
    __LW_hooks.setStage = (v) => { const x = Math.max(0, Math.min(1, +v || 0)); ui.stageK.set(x); setStageMix(x); return x; };
    rt.appendChild(ui.stageK.root);
    ui.gammaK = knob({ label: 'GAMMA', min: 0.5, max: 2.4, value: 1, fmt: (v) => v.toFixed(2), onInput: (v) => { if (modHand('material.gamma', v)) return; mat.gamma = v; schedule(TIER.PRESENT); } }); rt.appendChild(ui.gammaK.root);
    ui.cardSeg = seg({ label: 'CARD STYLE', value: 'refractive', options: [
      { id: 'refractive', label: 'REFRACTIVE', title: 'the pane is not there: every card, popover and chrome panel is transparent and you read the instrument through the blur behind it (with FROST off, through the field itself). This is the look the lab has shipped since wave 23 — for its first 24 waves by accident, and on purpose since wave 47' },
      { id: 'tinted', label: 'TINTED', title: 'the theme\'s tinted pane comes back under the blur: the dark card at hsl(214 16% 13% / .84), the light card at 245,247,249 — more contrast for the ink, less of the field' },
    ], onChange: (v) => setCardStyle(v) });
    rt.appendChild(ui.cardSeg.root);
    el('div', 'note', gt, 'refractive: the blur alone · tinted: the blur under a tinted pane');
    /* ── THE COLOUR GAMUT (wave 54, board #52) ───────────────────────────────────────────────────────────────
     * Josh asked for P3 and asked whether we could default to it.  The honest answer is NO, NOT ON THIS BROWSER,
     * and this control says so out loud instead of pretending.  The reason is not taste: Gecko does not implement
     * GPUCanvasConfiguration.colorSpace at all (the WebIDL member is commented out, Bug 1834395), so the canvas
     * stays sRGB whatever you pass it — while Firefox 113+ DOES render CSS color(display-p3 …).  Styling the
     * interface in P3 over an sRGB field would put THE SAME ACCENT IN TWO DIFFERENT COLOURS, which is worse than
     * not having the feature.  Hence THE LAW, and it is enforced in one place (field.setGamut refuses, and
     * applyAccent reads back what is actually in force):
     *
     *      THE DOM AND THE CANVAS ARE IN THE SAME COLOUR SPACE, OR THE FEATURE IS OFF.  Never a third state.
     *
     * The detection is a real probe, not a version sniff — see field.js: configure() is handed an object whose
     * `colorSpace` is a getter, and whether the browser CALLS it is whether the member exists in this build.
     * The display query is REPORTED and never used as a gate, because privacy.resistFingerprinting makes Firefox
     * answer false to it unconditionally and a wide-gamut screen would be locked out by a privacy setting. */
    const gamutSup = field.ok && field.gamutSupport ? field.gamutSupport : { canvas: false, css: false, display: false, reason: 'no WebGPU device: the canvas has no colour space to set' };
    const gamutOK = !!(gamutSup.canvas && gamutSup.css);
    const rg = el('div', 'row tight', gt);
    ui.gamutSeg = seg({ label: 'GAMUT', value: 'srgb', options: [
      { id: 'srgb', label: 'sRGB', title: 'the shipped space: the interface and the field are both sRGB, and they agree by construction' },
      { id: 'p3', label: 'DISPLAY-P3', title: gamutOK ? 'the wider space, on BOTH sides at once — the canvas is re-configured and every accent is re-expressed in it' : gamutSup.reason }],
      onChange: (v) => setGamut(v) });
    rg.appendChild(ui.gamutSeg.root);
    ui.p3Seg = seg({ label: 'IN P3', value: 'convert', options: [
      { id: 'convert', label: 'CONVERT', title: 'the same colours, re-expressed in the wider basis: nothing looks different and the 8-bit banding improves' },
      { id: 'vivid', label: 'VIVID', title: 'more chroma than was authored — a DESIGN CHOICE, and it is not accuracy: the colours are deliberately outside what the palette says' }],
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
    el('div', 'note', gt).innerHTML = '<b>GAMUT.</b> Josh asked for Display P3 and for it to be the default if it looked good. It cannot be, and the reason is worth stating rather than hiding: <b>Firefox does not implement <code>GPUCanvasConfiguration.colorSpace</code></b> — the member is commented out in Gecko (Bug 1834395) and a WebIDL dictionary silently ignores a member it does not declare, so the string is accepted, nothing throws, and the canvas stays sRGB. Firefox 113+ <i>does</i> render CSS <code>color(display-p3 …)</code>, so a P3 interface over an sRGB field would show <b>the same accent in two different colours</b>. So the law here is absolute: <b>the interface and the field are in the same space, or the feature is off</b> — there is no state in which they can drift. Where the canvas can honour it, the two things it can do are offered separately and named honestly: <b>CONVERT</b> is a colorimetric re-expression (identical colours, and the banding improves because the codes are spread over a wider basis) and <b>VIVID</b> is a deliberate chroma expansion (more saturated than the palette says — a design choice, never accuracy). Note also that a wider gamut over the same 256 levels makes 8-bit banding <i>worse</i>, not better, which is why <b>DITHER</b> in DRAW STYLE is the fix that works on every browser today.';
    const ra = el('div', 'row tight', gt);
    ui.accA = knob({ label: 'ACCENT A', min: 0, max: 360, value: 30, wrap: true, fmt: (v) => v.toFixed(0) + '°', title: 'the first UI accent: an angle on the current palette wheel', onInput: (v) => { accent.a = v; applyAccent(); }, onChange: () => saveSettings() }); ra.appendChild(ui.accA.root);
    ui.accB = knob({ label: 'ACCENT B', min: 0, max: 360, value: 300, wrap: true, fmt: (v) => v.toFixed(0) + '°', title: 'the second UI accent (solo, the warm marks): an angle on the same wheel', onInput: (v) => { accent.b = v; applyAccent(); }, onChange: () => saveSettings() }); ra.appendChild(ui.accB.root);
    ui.vivid = knob({ label: 'VIVID', min: 0, max: 1, value: .1, fmt: (v) => (v * 100).toFixed(0) + '%', title: 'push both accents toward neon: more chroma and a wider glow (also for visibility)', onInput: (v) => { accent.vivid = v; applyAccent(); }, onChange: () => saveSettings() }); ra.appendChild(ui.vivid.root);
    el('div', 'note', gt).innerHTML = '<b>THEME</b> swaps the skin\'s tokens and adapts the layer underneath: LIGHT sets a light stage (INVERT is yours — turn it on if you want the cloud drawn as ink). <b>SURFACE</b> is the render of the object itself — STAGE is the background lightness, GAMMA the output curve, and with EXPOSURE (gain), HUE and INVERT above they are all presentation: none of them touches ψ. <b>FROST</b> is the blur behind the cards, ALWAYS by default: measured at 21 px over the live field it took the frame from 17 ms to 82 ms (13 fps) under software compositing and about 25 fps on a GPU desktop, because the blur of both racks is recomposited on every frame the field changes — choose STILL to suspend its filter during playback, or OFF to avoid the backdrop capture. The GOVERNOR preserves your chosen material. <b>ACCENT A · B</b> are two angles on the current palette wheel (the PHASE PALETTE editor\'s stops, shifted by HUE): every accent in the interface takes its colour from them, held to a legible lightness for the theme, so turning the wheel recolours the whole UI. The logo is the same wheel verbatim — λ at 0°, the nine squares at 0°, 40°, … 320°.';
    __LW_hooks.setTheme = setTheme;

    const gd = group(gDraw, 'the transfer has a bounded ceiling');            // WAVE 56: `wStyle` is `wObs`; this block is the DRAW section of the WAVE window
    const rd = el('div', 'row tight', gd);
    ui.styleSeg = seg({ label: 'STYLE', value: 'cloud', options: [
      { id: 'cloud', label: 'CLOUD', title: 'the emission/absorption integral' },
      { id: 'solid', label: 'SOLID', title: 'a bounded plateau: a lit isosurface whose level EXPOSURE moves — it cannot fill the box' },
      { id: 'grain', label: 'GRAIN', title: 'the same field as noisy particles: a per-voxel hash keeps a fraction of the samples' },
      { id: 'signed', label: 'SIGNED', title: 'the wave as flat ±1 lobes meeting at a hard nodal surface — best in the REAL and IMAG views' },
      { id:'dust',label:'DUST',title:'World-locked fine particles; GRAIN controls their count' },
      { id:'glass',label:'SHELL',title:'A translucent lit density shell; ISO sets the shell. Stylized glass, without physical refraction' },
      { id:'additive',label:'ADD',title:'Additive emission through the field' },
      { id: 'bands', label: 'BANDS', title: 'the wave\'s own level lines: a cosine comb on the amplitude (GRAIN sets 2–16 bands) — an interference-fringe reading' }],
      onChange: (v) => { mat.style = STYLE[v]; schedule(TIER.PRESENT); } });
    rd.appendChild(ui.styleSeg.root);
    ui.isoK = knob({ label: 'ISO', min: 0.002, max: 0.9, value: 0.06, log: true, fmt: (v) => v.toFixed(3), onInput: (v) => { if (modHand('material.iso', v)) return; mat.iso = v; schedule(TIER.PRESENT); } }); rd.appendChild(ui.isoK.root);
    ui.grainK = knob({ label: 'GRAIN', min: 0.02, max: 1, value: 0.35, log: true, fmt: (v) => v.toFixed(2), onInput: (v) => { if (modHand('material.grain', v)) return; mat.grain = v; schedule(TIER.PRESENT); } }); rd.appendChild(ui.grainK.root);
    ui.kneeK = knob({ label: 'KNEE', min: 0.02, max: 8, value: 0.6, log: true, fmt: (v) => v.toFixed(2), onInput: (v) => { if (modHand('material.knee', v)) return; mat.knee = v; schedule(TIER.PRESENT); } }); rd.appendChild(ui.kneeK.root);
    /* WAVE 54 (board #49, Josh: "is realtime dithering possible?").  It is, and it is nearly free — but "nearly
       free" is not a claim until it has two numbers, so the REPORT carries the frame time with it off and on at the
       same grid and the same canvas.  OFF is the default and OFF is exactly zero added to the colour, so every
       pixel gate in the suite reads the same numbers it always did. */
    const rdd = el('div', 'row tight', gd);
    ui.ditherSeg = seg({ label: 'DITHER', value: 'off', options: [
      { id: 'off', label: 'OFF', title: 'the colour goes to the 8-bit swapchain as it is' },
      { id: 'ordered', label: 'ORDERED 8×8', title: 'a Bayer 8×8 threshold added to the FINAL colour: the step between two adjacent codes becomes a spatial average between them, and a smooth phase ramp stops banding' }],
      onChange: (v) => { mat.dither = v === 'off' ? 0 : (ui.ditherK ? ui.ditherK.get() : 1); if (ui.ditherK) ui.ditherK.setDisabled(v === 'off'); schedule(TIER.PRESENT); } });
    rdd.appendChild(ui.ditherSeg.root);
    ui.ditherK = knob({ label: 'STRENGTH', min: 0.25, max: 2, value: 1, fmt: (v) => '±' + (v / 2).toFixed(2) + ' LSB', onInput: (v) => { if (ui.ditherSeg.get() !== 'off') { mat.dither = v; schedule(TIER.PRESENT); } } });
    ui.ditherK.root.title = 'the amplitude in LEAST SIGNIFICANT BITS of the 8-bit output: 1.00 is the textbook ±½ LSB, which is exactly one quantisation step peak-to-peak';
    ui.ditherK.setDisabled(true);
    rdd.appendChild(ui.ditherK.root);
    el('div', 'note', gd).innerHTML = 'Every style passes its weight through a <b>saturation knee</b> w ↦ w/(1+kw), so the opacity of a step tends to a finite ceiling as EXPOSURE grows: cranking the knob deepens the blob instead of glowing the whole field. <b>SOLID</b> draws the plateau ρ ≈ ISO as a lit surface (shaded by the density gradient), so EXPOSURE moves the surface rather than flooding the volume; <b>GRAIN</b> stipples the same field into particles. All three are DESIGN CHOICES — the observable itself is chosen above. <b>DITHER</b> is the fourth, and it is about the OUTPUT rather than the field: the canvas is 8 bits per channel, a cyclic phase ramp crosses all 256 of them, and where two neighbouring codes meet the eye reads a <b>Mach band</b> that is not in the data. An <b>ordered (Bayer 8×8)</b> threshold added to the final colour — after the gamma, because the ladder it defeats is the swapchain\u2019s — turns that step into a spatial average and the band disappears. It is ORDERED and not blue noise on purpose: the pattern is fixed in screen space, so a paused instrument stays perfectly still, where a per-frame noise would shimmer at a state nobody is changing. <b>STRENGTH</b> 1.00 is ±½ LSB, the textbook amount; it is <b>OFF by default</b> and off adds exactly zero.';

    ui.keysRefresh = () => {};
    ui.keysSay = text => { if(ui.set)ui.set.setStatus(text, 'warn'); };

    const gs = group(wClip.body, 'observer only');
    const r3 = el('div', 'row', gs);
    /* wave 106: these two keep their handles for the same reason POS and THICK now do — an undo has to
       be able to MOVE a control, and a control nothing holds cannot be moved. */
    ui.sliceModeSeg = seg({ aria: 'slice mode', value: 'off', options: [{ id: 'off', label: 'VOLUME' }, { id: 'clip', label: 'CLIP' }, { id: 'slab', label: 'SLAB' }], onChange: (v) => { mat.slice.mode = { off: 0, clip: 1, slab: 2 }[v]; schedule(TIER.PRESENT); } });
    r3.appendChild(ui.sliceModeSeg.root);
    ui.sliceAxisSeg = seg({ aria: 'slice axis', value: 'z', options: [{ id: 'x', label: 'X' }, { id: 'y', label: 'Y' }, { id: 'z', label: 'Z' }], onChange: (v) => { mat.slice.axis = { x: 0, y: 1, z: 2 }[v]; delete mat.slice.normal; schedule(TIER.PRESENT); } });
    r3.appendChild(ui.sliceAxisSeg.root);
    const mini = planeModel(gs, { getNormal:()=>mat.slice.normal || [0,1,2].map(i=>i===mat.slice.axis?1:0), getPosition:()=>mat.slice.pos, onTurn:n=>{mat.slice.normal=n; schedule(TIER.PRESENT);} });
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
    const gp = group(wPal.body, 'a DESIGN CHOICE; ψ untouched');
    palette = createPaletteEditor(gp, {
      startId: palChoice,
      setLUT(lut) { wheelLUT = lut; if (field.ok) field.setPalette(lut); applyAccent(); },
      setEnabled(v) { mat.paletteOn = v;applyAccent(); if (v) { mat.view = VIEW.phase; ui.viewSeg.set('phase'); } },
      chose(id) { palChoice = id; saveSettings(); },        // wave 54: naming one from the menu IS this browser's choice
      repaint() { schedule(TIER.PRESENT); }
    });
    /* ⚠ WAVE 106 · INVERT IS THE PALETTE WINDOW'S NOW (Josh: "I think invert in draw should move to
       pallete … make the buttons behave according to their window's peers").  It belongs here on the
       MEANING and not merely on the tidying: PALETTE is the window that says how the complex plane is
       coloured, INVERT says whether that colouring is laid down as light or as ink, and this card's own
       status line — `a DESIGN CHOICE; ψ untouched` — is word for word the guarantee INVERT has always
       carried.  It takes its window's spelling: `title:` as an OPTION to sw().
         ⚠ AND IT SAVES NOW.  FRAME and AXIS have called saveSettings() since wave 53 and INVERT never
       did, so of three switches in one row two survived a reload and one did not, for no reason anyone
       recorded.  The call and the settings key are one change, not two. */
    const rInv = el('div', 'row tight', wPal.body);
    ui.invertSw = sw({ label: 'INVERT', value: false, title: 'draw the cloud as ink rather than light — the transfer is inverted, ψ is not touched', onChange: (v) => { mat.invert = v; saveSettings(); schedule(TIER.PRESENT); } });
    rInv.appendChild(ui.invertSw.root);
    const gc = group(wCam.body, 'ONE LAW  ·  ω = ω_amb + (ω₀ − ω_amb) e^{−μt}');
    /* WAVE 54 (board #43): the mode comes FIRST, because it decides what every dial below it turns. */
    const r4a = el('div', 'row tight', gc);
    ui.camSeg = seg({ label: 'CONTROL', value: 'free', options: [
      { id: 'turntable', label: 'TURNTABLE', title: 'two angles about the quantization axis: the horizon stays level, and the pitch stops at the poles' },
      { id: 'free', label: 'FREE', title: 'one unit quaternion, screen-relative axes: no poles at all — and the horizon rolls, because a closed drag loop leaves a turn behind it' }],
      onChange: (v) => setCamMode(v) });
    r4a.appendChild(ui.camSeg.root);
    ui.camNote = el('div', 'sturm-note', gc);            // its own class: the ⓘ sweep folds every .note away, and the trade must stay readable
    ui.camNote.textContent = CAM_TRADE.turntable;
    const r4 = el('div', 'row', gc);
    ui.spinSw = sw({ label: 'AUTO-ROTATE', value: false, onChange: (v) => { camera.autoRotate = v; camera.wake(); } });
    ui.spinSw.root.title = 'the AMBIENT drive ω_amb = (SPIN, 0): a fling relaxes TO it rather than fighting it — off, the camera relaxes to rest';
    r4.appendChild(ui.spinSw.root);
    ui.spinK = knob({ label: 'SPIN', min: 0.02, max: 2, value: 0.25, log: true, fmt: (v) => v.toFixed(2) + ' rad/s', onInput: (v) => { camera.speed = v; camera.wake(); }, onChange: () => saveSettings() });
    ui.spinK.root.title = 'the ambient yaw rate the camera settles at while AUTO-ROTATE is on';
    r4.appendChild(ui.spinK.root);
    ui.fricK = knob({ label: 'FRICTION', min: 0, max: CAM.MU_MAX, value: CAM.MU_DEF, step: CAM.MU_STEP, fmt: (v) => (v > 0 ? 'μ ' + v.toFixed(2) + ' /s' : '∞ · forever'), onInput: (v) => { camera.friction = v; camera.wake(); }, onChange: () => saveSettings() });
    ui.fricK.root.title = 'μ in ω̇ = −μ(ω − ω_amb): the ONE constant of the motion. 12 /s is "no momentum" (a flick dies in a quarter turn), 2.5 is the default (τ = 0.4 s, a flick coasts ≈ 2.8 s through 69°), and μ = 0 is NO DECAY — the view spins forever. Double-click resets it to 2.5';
    r4.appendChild(ui.fricK.root);
    /* WAVE 58 (board #63): the View window's two dials, in OUR units — see the CAM block for why the range travels
       and the default does not.  Both sit with FRICTION because all three are the feel of the same hand. */
    const r4h = el('div', 'row', gc);
    ui.gainK = knob({ label: 'DRAG GAIN', min: CAM.GAIN[0], max: CAM.GAIN[1], value: CAM.GAIN_DEF, step: CAM.GAIN_STEP,
      fmt: (v) => '×' + v.toFixed(2),                       // the MAPPING is a sentence, not a knob value: a .k-val is a floating tooltip and a long one spills off the card
      onInput: (v) => { camera.dragGain = v; camGainNote(); }, onChange: () => saveSettings() });
    ui.gainK.root.title = 'how far the view turns per pixel of drag: rad/px = GAIN × 0.0065, so ×1.00 is the shipped camera and ×8 is eight times as fast. It scales the ONE sensitivity, so TURNTABLE and FREE move together and SHIFT still quarters it. (NEBULA\'s dial is radians per SCREEN WIDTH — a different quantity, which is why its 3.14 is not our 1.) Double-click resets it';
    r4h.appendChild(ui.gainK.root);
    ui.flingK = knob({ label: 'FLING', min: CAM.FLING[0], max: CAM.FLING[1], value: CAM.FLING_DEF, step: CAM.FLING_STEP,
      fmt: (v) => '×' + v.toFixed(2),
      onInput: (v) => { camera.flingGain = v; camGainNote(); }, onChange: () => saveSettings() });
    ui.flingK.root.title = 'the multiplier on the released angular velocity, before the friction law sees it. FLING decides how much velocity you GET, μ decides how fast it DECAYS, and the two never fight: at 0 the view stops dead the moment you let go — a pure trackball, and the drag still turns it — at 1 it is today\'s camera, at 2 it throws twice as hard, and at μ = 0 any of them spins for ever. Double-click resets it';
    r4h.appendChild(ui.flingK.root);
    /* THE MAPPING IS ON THE CARD, not in a hover (ANTI-PATTERN 4): a .k-val is a floating tooltip that cannot hold
       "×1.00 · 0.0065 rad/px" without spilling off a 300-px card, and the number a gain MEANS is the point of it. */
    ui.gainNote = el('div', 'sturm-note', gc);
    r4h.after(ui.gainNote);
    const camGainNote = () => { if (!ui.gainNote) return;
      ui.gainNote.textContent = `${(camera.dragGain * CAM.SENS).toFixed(4)} rad/px  (SHIFT ${(camera.dragGain * CAM.SENS * CAM.FINE).toFixed(4)})`
        + ` · FLING ${camera.flingGain === 0 ? '0: the drag turns, the release leaves nothing' : camera.flingGain === 1 ? '×1: the shipped throw' : '×' + camera.flingGain.toFixed(2) + ' on the released ω₀'}`; };
    ui.camGainNote = camGainNote; camGainNote();
    const r4b = el('div', 'row tight', gc);
    ui.zoomK = knob({ label: 'ZOOM', min: CAM.DIST[0], max: CAM.DIST[1], value: CAM.HOME.dist, log: true, fmt: (v) => '×' + v.toFixed(2), onInput: (v) => setDist(v) });
    ui.zoomK.root.title = 'the camera\'s distance in DOMAIN HALF-WIDTHS (the wheel and a pinch on the stage move the same number — every wheel modifier zooms and none of them rotates)';
    r4b.appendChild(ui.zoomK.root);
    ui.fovK = knob({ label: 'FOV', min: CAM.FOV[0], max: CAM.FOV[1], value: CAM.HOME.fov, fmt: (v) => (v * 180 / Math.PI).toFixed(0) + '°', onInput: (v) => setFov(v) });
    ui.fovK.root.title = 'the vertical field of view the ray march is built with — narrow is nearly orthographic, wide is a fish-eye through the same voxels';
    r4b.appendChild(ui.fovK.root);
    r4b.appendChild(trig({ label: 'RESET VIEW', title: 'the shipped pose — yaw 0.65, pitch 0.38, ×3.30, 34° — and the motion with it (a double-click or a double-tap on the stage does the same)', onFire: () => resetView() }).root);
    r4b.appendChild(trig({ label: 'SET Δρ REF', title: 'capture ρ(now) as the DIFFERENCE reference (a field reference, not a state edit)', onFire: () => { setReference(); ui.viewSeg.set('diff'); mat.view = VIEW.diff; } }).root);
    el('div', 'note', gc).innerHTML = 'The camera has an angular <b>velocity</b> and one constant: <b>ω̇ = −μ(ω − ω<sub>amb</sub>)</b>, integrated exactly every frame. <b>FRICTION</b> is μ. A <b>drag on the stage flings</b> — the mean angular velocity of its last 80 ms — and the fling then relaxes to the ambient rate ω<sub>amb</sub> = (SPIN, 0) when AUTO-ROTATE is on, or to rest when it is off, so the switch and the slider never fight: at <b>μ = 12</b> there is no momentum at all, at <b>2.5</b> a flick coasts about 2.8 s and turns through 69°, and at <b>μ = 0 · ∞ forever</b> nothing decays and the view keeps the rate you gave it. <b>SHIFT is the fine drag</b> (a quarter of the gain, as everywhere else) and pressing or releasing it mid-drag <b>clutches</b>: the velocity history is cleared, so the fling belongs to the final motion and not to the coarse one before it. <b>DRAG GAIN and FLING</b> are the two dials from NEBULA\'s View window (wave 58), and they <b>compose with the law above rather than competing with it</b>. DRAG GAIN scales the one sensitivity this camera has — <b>rad/px = GAIN × 0.0065</b>, ×1.00 being exactly the camera that shipped — in both control modes, with SHIFT still taking a quarter of whatever it is set to. FLING multiplies the released velocity ω₀ <i>before</i> it becomes the residual, so it decides <b>how much you get</b> while μ decides <b>how fast it goes</b>: at <b>FLING 0 the view stops dead the instant you let go</b> — a pure trackball, and the drag itself still turns it, which is a thing no value of FRICTION can do — at 1 nothing changes, at 2 the same flick throws twice as far, and the closed-form travel ω₀/μ holds at every setting of both. (NEBULA\'s own gain is radians per <i>screen width</i>; that number means nothing at a rack\'s width, so the range and the step are theirs and the unit is ours.) <b>CONTROL</b> is the trade Josh asked for, and it is a real one: <b>TURNTABLE</b> keeps the horizon level and stops at the poles, <b>FREE</b> has no poles and lets the horizon roll. TURNTABLE is two Euler angles about z (the quantization axis), so pitch is clamped at ±1.52 rad and a fling into a pole loses its pitch and keeps its yaw; FREE is <b>one unit quaternion</b> with a rotor multiplied on the right, so the drag axes are the screen\u2019s at every pose and a drag walks straight over the pole — at the cost of a horizon that tilts, which is not a defect and cannot be removed: the two drag generators are the camera\u2019s up and right, and <b>[ĵ, k̂] = 2î</b> means a closed loop leaves a roll behind it. Switching INTO free moves no pixel (it is an exact conversion); switching back <b>slerps the roll level over 150 ms</b> rather than snapping. The friction law above is the same law in both — what changes is the axis each of its two numbers turns about: the AMBIENT stays a world-z drive (AUTO-ROTATE turns the cloud about the quantization axis) and the residual becomes screen-relative. <b>Double-click or double-tap the stage</b> to reset the view. The wheel (with any modifier) and a two-finger pinch are the same ZOOM. All of it is <b>observer only</b>: the camera schedules a PRESENT and nothing else — never ψ, never the clock, never the undo stack — and a still camera schedules nothing at all. There is no <b>SEED</b> here: the one seed this lab has is the particle cloud, and it lives with the particles in <b>DYNAMICS</b> (RESEED, or Ctrl+R).';

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
    const gcap = group(wCam.body, 'CAPTURE  ·  A PICTURE, A CLIP, AND ONE EXACT PERIOD');
    let exact = null, exactRun = null;
    const exactRenderer = () => exact || (exact = createExactRenderer(LW, { canvas: dom.canvas, energies: periodEnergies }));
    let cap = null, capBusy = false, capRun = null, capPlan = null, capKey = '';
    const capture = () => cap || (cap = createCapture(LW, { canvas: dom.canvas, canvasCap: 16384, energies: periodEnergies }));   // wave 58: capture reads the SAME energies periodNow() does, never the labels' ⟨H⟩
    const capKeyNow = () => `${reg.version}|${mat.view}|${ui.capFps.get()}|${ui.capSec.get()}`;
    const rc1 = el('div', 'row tight', gcap);
    ui.capScale = seg({ label: 'PICTURE', value: '2', options: [{ id: '1', label: '×1' }, { id: '2', label: '×2' }, { id: '3', label: '×3' }, { id: '4', label: '×4' }],
      onChange: () => capShowLimits() });
    ui.capScale.root.title = 'a multiple of the stage, RE-RENDERED at that size — the ray march is run again, so it is a bigger picture and not a bigger copy of this one';
    rc1.appendChild(ui.capScale.root);
    ui.capPic = trig({ label: 'TAKE A PICTURE', title: 'render one frame at the chosen size and save it as a PNG. The clock is paused, the ray-march jitter is pinned so the picture is a function of the STATE alone, and both are put back afterwards', onFire: () => capPicture() });
    rc1.appendChild(ui.capPic.root);
    const rc2 = el('div', 'row', gcap);
    ui.capSec = knob({ label: 'SECONDS', min: 1, max: 30, value: 6, step: 0.5, fmt: (v) => v.toFixed(1) + ' s', onInput: () => capStale() });
    ui.capSec.root.title = 'how long a free CLIP runs, and the wall length a LOOP is fitted to (the loop always runs exactly one period — this only decides how many frames that is)';
    rc2.appendChild(ui.capSec.root);
    ui.capFps = seg({ label: 'FPS', value: '30', options: [{ id: '15', label: '15' }, { id: '30', label: '30' }, { id: '60', label: '60' }], onChange: () => capStale() });
    rc2.appendChild(ui.capFps.root);
    ui.capRec = trig({ label: 'RECORD', title: 'a free clip: the clock runs as it is and the frames are whatever the wall gives. The tempo is MEASURED and reported, never claimed', onFire: () => capRecord() });
    rc2.appendChild(ui.capRec.root);
    ui.capLoop = trig({ label: 'ONE PERIOD', title: 'record exactly one period, seamlessly — or refuse, and say by how much the best near-recurrence misses', onFire: () => capRecordLoop() });
    rc2.appendChild(ui.capLoop.root);
    ui.capPlanT = trig({ label: 'PLAN', title: 'ask period.js what closes here, for this observable, now — never done on a frame, because a box full of impulses has 56 incommensurate energies and the scan is not free', onFire: () => capMakePlan(true) });
    rc2.appendChild(ui.capPlanT.root);
    const rx = el('div', 'row tight', gcap);
    ui.capExact = trig({ label: 'EXPORT FRAMES', title: 'export a deterministic PNG sequence and manifest as a ZIP; starts physics and modulation together at zero; exports at least 30 seconds or a full phase loop', onFire: () => capExportFrames() });
    rx.appendChild(ui.capExact.root);
    ui.capExactRo = readout({ label: 'FRAME EXPORT', cls: 'wide', value: '—', sub: 'At least 30 seconds · PNG sequence + manifest · modulation starts at beat zero' });
    gcap.appendChild(ui.capExactRo.root);
    const rc3 = el('div', 'row tight', gcap);
    ui.capShot = readout({ label: 'PICTURE', value: '—', sub: '' });
    ui.capPlanRo = readout({ label: 'THE LOOP PLAN', cls: 'wide', value: '—', sub: '' });
    rc3.appendChild(ui.capShot.root); rc3.appendChild(ui.capPlanRo.root);
    el('div', 'note', gcap).innerHTML = 'The stage is <b>ray-marched</b>, so a bigger picture is a bigger <b>render</b> and never an upscale: the backing store is resized, one frame is encoded at that size through the renderer’s own path, and the swapchain texture is copied straight back off the GPU — there is no 2-D canvas anywhere on that road. Two things would have broken it and both were measured: the march’s start offset is seeded from a 97-frame counter, so a capture <b>pins the seed</b> and puts it back (two pictures of the same paused state come back byte-identical); and <code>MediaRecorder</code> over <code>captureStream()</code> on a WebGPU canvas <b>works here</b> — four independent roads out of one frame agree on the lit fraction to three decimals — but the engine is chosen by a runtime <b>probe</b>, with a full GPU-readback <b>relay</b> behind it if a browser ever comes back blank. <b>ONE PERIOD is a theorem, not a guess.</b> The density recurs exactly at T = 2π/gcd{|ΔE|} while the energies are commensurate, so a loop of N frames samples [t₀, t₀ + T) and <b>drops the endpoint</b>, because ρ(t₀ + T) = ρ(t₀) is frame 0 again and keeping it holds one image for two frame times — a visible hitch once a lap. <b>The observable decides which period</b>: PHASE, REAL, IMAG and RE+IM paint the global phase of ψ, which returns only at T_ψ = 2π/gcd{|E|} — three density periods for 1s+2s — and PHASE is the shipped view, so the plan says which period it used and how many laps that is. <b>And a state with no exact period is REFUSED</b> — the box, a Stark field, a live A → B mix — with the best near-recurrence and how far it misses printed instead of a loop that does not close. The PNG frame sequence (<code>LW.capture.pngSequence</code>) is the only output whose <i>timing</i> is exact as well as its content, and it prints its own ffmpeg line.';

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
      if (!force && capPlan && capKey === capKeyNow()) return capPlan;
      try { capPlan = capture().planLoop({ fps: +ui.capFps.get(), seconds: ui.capSec.get() }); capKey = capKeyNow(); }
      catch (e) { capPlan = { ok: false, label: 'ERROR', message: String(e && e.message || e) }; capKey = capKeyNow(); }
      capPaint(); return capPlan;
    }
    function capPaint() {
      const P = capPlan, stale = P && capKey !== capKeyNow();
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
        const r = await run.done; capBadge(P.kind === 'exact' ? 'EXACT LOOP' : 'NEAR', r); if (r && r.blob) capture().save(r);
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
    gcap.addEventListener('pointerenter', () => { if (!capBusy) capMakePlan(false); });
    capShowLimits(); capPaint();
    capApi = { exportFrames: capExportFrames, get exact() { return exactRenderer(); }, get capture() { return capture(); }, plan: (force = true) => capMakePlan(force), picture: capPicture, record: capRecord, loop: capRecordLoop, limits: capLimits, get busy() { return capBusy || !!capRun; } };
    const gq = group(ui.set.body, 'FIELD CACHE  ·  QUALITY  (changes the estimate, never the state)');
    const r5 = el('div', 'row', gq);
    ui.gridSeg = seg({ label: 'GRID', value: String(quality.res),   /* wave 101: the CONTROL reads the shipped grid rather than restating it — a hardcoded '96' here would have disagreed with quality.res the moment the default moved */ options: [{ id: '64', label: '64³' }, { id: '96', label: '96³' }, { id: '128', label: '128³' }],
      onChange: (v) => { quality.res = +v; quality.steps = { 64: 110, 96: 160, 128: 240 }[+v]; quality.scale = { 64: 0.75, 96: 1, 128: 1 }[+v]; schedule(TIER.REBUILD); } });
    r5.appendChild(ui.gridSeg.root);
    r5.appendChild(seg({ label: 'FIELD CLOCK cap', value: '0', options: [{ id: '0', label: 'MAX' }, { id: '33', label: '30 Hz' }, { id: '66', label: '15 Hz' }, { id: '200', label: '5 Hz' }],
      onChange: (v) => { fieldRate.capMs = +v; } }).root);
    const r5b = el('div', 'row tight', gq);
    ui.autoSw = sw({ label: 'AUTO SCALE', value: true, title: 'lower the canvas resolution when the active frame budget is exceeded, raise it after sustained headroom — the estimate on screen, never the state', onChange: (v) => { quality.auto = v; if (!v) quality.autoScale = 1; saveSettings(); } }); r5b.appendChild(ui.autoSw.root);
    ui.govSw = sw({ label: 'GOVERNOR', value: true, title: 'when the last 60 frames exceed the active 60 Hz / 120 Hz budget the field grid steps one notch down and an over-budget window is parked while the transport plays; sustained headroom steps back up — off, nothing is governed', onChange: (v) => { setGovernor(v); saveSettings(); } }); r5b.appendChild(ui.govSw.root);
    ui.scaleRo = readout({ label: 'RENDER SCALE', value: '100%', sub: 'canvas pixels per CSS pixel × DPR' });
    r5b.appendChild(ui.scaleRo.root);
    const r6 = el('div', 'row', gq);
    ui.domainAuto = sw({ label: 'DOMAIN AUTO', value: true, onChange: (v) => { domain.auto = v; ui.domainKnob.setDisabled(v); schedule(TIER.REBUILD); } });
    r6.appendChild(ui.domainAuto.root);
    ui.domainKnob = knob({ label: 'HALF-WIDTH', min: 3, max: 140, value: 7, log: true, fmt: (v) => '±' + v.toFixed(0) + ' a₀', onChange: (v) => { domain.half = v; schedule(TIER.REBUILD); } });
    ui.domainKnob.setDisabled(true);
    r6.appendChild(ui.domainKnob.root);
    const r7 = el('div', 'row tight', gq);
    ui.keepSw = sw({ label: 'KEEP FRAMES', value: false, title: 'the transport\'s playhead follows every frame (the scrub bar repaints on the glass at the display rate); off — the default — the bar is disabled while RATE and play / pause work as before', onChange: (v) => { setKeepFrames(v); saveSettings(); } }); r7.appendChild(ui.keepSw.root);
    el('div', 'note', gq).innerHTML = '<b>GOVERNOR.</b> The median of the last 60 presented frames is judged against the active frame budget while the transport plays: over it, the FIELD grid steps one notch down (128 → 96 → 64) and any window whose update was measured to cost more than a frame is <b>parked</b> — it runs on pause or edit and its status says so, and once every 3 s it is let through <b>once</b> to be measured again, so a window that has come back under budget unparks itself instead of staying parked for the session — while one over half a frame runs at most every six times its cost; sustained headroom steps back up, and pausing restores your grid at once. FULL targets 60 Hz; 120 Hz follows the fastest sustained browser cadence, up to 120 Hz. METERS shows its state. <b>KEEP FRAMES</b> is the playhead: on, the scrub bar follows every frame as it always did (a repaint on the transport\'s glass at the display rate); off, the default, the bar is disabled and the t readout runs at 5 Hz — RATE and play / pause are untouched. Both are this browser\'s settings, never a project\'s. The impulse vector\'s kick, the BOX packet and the REPEATS scan run in a worker off the frame, so the pointer is free the moment the finger lifts.';
  }

  // STATE — preparation. Everything here changes c.
  const wState = device({ id: 'state', eyebrow: 'STATE', title: 'PREPARE · <m>|ψ⟩ = Σ c_nlm |nlm⟩</m>', status: 'changes c' });
  rack.appendChild(wState.root);
  {
    const r1 = wState.row();
    ui.presetSel = el('select', 'sel', r1); ui.presetSel.setAttribute('aria-label', 'preset superposition');
    for (const p of PRESETS) { const o = el('option', '', ui.presetSel, p.label); o.value = p.id; }
    ui.presetSel.addEventListener('change', () => loadPreset(ui.presetSel.value));
    ui.presetSel.style.flex = '1 1 160px';
    /* ── WAVE 55 · RIDER B (board #58): THERE WAS NO WAY BACK ─────────────────────────────────────
     * Josh, throwing the bow: "It seems to accumulate speed as I throw bow on it and there's no way to
     * reset it other than refresh page."  THE CREEP IS CORRECT PHYSICS — an impulse multiplies ψ by
     * e^{ik·x}, which adds momentum AND energy, so repeated throws populate higher shells and the beats
     * quicken.  The BUG was the absence of a way back: a preset is loaded on the select's `change` event,
     * and re-picking the option that is already selected fires no change event at all, so re-choosing "1s"
     * did nothing whatever.  RELOAD calls the same `loadPreset` unconditionally — the register, the clock
     * and the scrub back to where the preset says.
     * WHAT THIS DELIBERATELY IS NOT is a "remove the momentum" control: you cannot subtract momentum
     * without applying the opposite boost, and a button that pretended otherwise would be a lie about the
     * physics.  Reloading the preset is the honest reset. */
    r1.appendChild(trig({ label: 'RELOAD', title: 'reload the preset that is already selected — the register, the clock and the scrub back to t = 0. Re-picking the same entry in the list fires no change event, which is why this button exists', onFire: () => loadPreset(ui.presetSel.value) }).root);
    r1.appendChild(sw({ label: 'PRESET VISUALS', value: true, onChange: (v) => { applyVisuals = v; } }).root);
    ui.presetNote = el('div', 'note', wState.body, '');
    const r2 = wState.row();
    r2.appendChild(trig({ label: 'NORMALIZE', title: 'c ↦ c / √(c†c) — explicit, never silent; the status says what ‖c‖ was', onFire: () => normalizeNow() }).root);
    /* ⚠ WAVE 106 · CLEAR NEVER TOUCHED THE CLOCK, AND THAT IS THE READOUT BUG (Josh: "the numbers or
       text on the native playhead is broken and won't reset after a clear").  `reg.clear()` zeroes the
       coefficients and nothing else, so the transport went on printing the accumulated t AND ITS LAP
       COUNT — "147.32  (23)" — over an empty register, which is a number about a state that no longer
       exists.  `loadPreset` is the reference and has always been right: it does `reg.load(p);
       clock.reset(); … ui.scrub.set(0); shadowView.clearTrail();`.  CLEAR now says the same four
       things, because clearing the state and rewinding its clock are one act. */
    r2.appendChild(trig({ label: 'CLEAR', onFire: () => { reg.clear(); refSnapshot = null; clock.reset(); if (ui.scrub) ui.scrub.set(0); shadowView.clearTrail(); touchState(); } }).root);
    r2.appendChild(knob({ label: 'ROTATE z', min: 0, max: 2 * Math.PI, value: 0, wrap: true, cls: 'rot', fmt: () => 'D(R_z)', onDelta: (d) => { reg.rotateZ(d); touchState(); } }).root);
    /* THE JOG WHEEL ABOVE AND THE DIAL BELOW ARE NOT TWO TRUTHS.  The wheel is a DELTA — one shove,
       applied and forgotten, holding nothing (kit.js:213).  This is a RATE, in rad/s, and it is a
       real stored number: rotRate.z IS what the registry reads and writes, so `get` cannot lie and
       modSyncBases cannot fight it.  Nothing anywhere accumulates the angle the two of them make. */
    ui.rotZRate = knob({ label: 'SPIN z', min: -ROT_LIMIT.z, max: ROT_LIMIT.z, value: 0, cls: 'rot',
      title: 'turn the state about z continuously: D(R_z(α̇ t)).  ±2π rad/s is one full turn a second; a double-click stops it',
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
      function abStatus() {
        const count = (S) => S ? S.re.reduce((k, v, i) => k + ((v || S.im[i]) ? 1 : 0), 0) : 0, nA = count(abA), nB = count(abB);
        let ov = 0; if (abA && abB) { let r = 0, im = 0; for (let a = 0; a < 91; a++) { r += abA.re[a] * abB.re[a] + abA.im[a] * abB.im[a]; im += abA.re[a] * abB.im[a] - abA.im[a] * abB.re[a]; } ov = Math.hypot(r, im); }
        const exact = nA === 1 && nB === 1 && ov < 1e-9;
        ui.abRo.set((abA ? nA + (nA === 1 ? ' mode' : ' modes') : '—') + '  /  ' + (abB ? nB + (nB === 1 ? ' mode' : ' modes') : '—'), reg.transition ? (exact ? 'ok' : 'warn') : '');
        ui.abRo.setSub(reg.transition ? (exact ? 'EXACT · two-level Rabi, resonant drive, RWA · |⟨A|B⟩| = ' + ov.toFixed(3) : 'TOY · the Rabi envelope on composite states · |⟨A|B⟩| = ' + ov.toFixed(3)) : 'store two states, then TRANSITION plays A → B → A at Ω');
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
      el('div', 'note', gab).innerHTML = '<b>A / B.</b> STORE keeps the register as it is now (its t = 0 anchor); A and B recall it. <b>TRANSITION</b> plays c(t) = cos(Ω(t−t₀)/2)·A(t) + sin(Ω(t−t₀)/2)·B(t), with A(t), B(t) the exact evolutions. For two eigenstates under a resonant drive this is the <b>exact two-level Rabi solution</b> in the rotating-wave approximation, and the density breathes at E_B − E_A — the radiating dipole of the Falstad "atom radiative transitions" applet, here as an exact superposition you can watch in every window. With composite A or B the same envelope is a <b>TOY</b>, and the readout says so. While a transition plays, edits act on the stored anchors; turning it off freezes the mix as the new state.';
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
      title: 'precess the state through the Stark manifold continuously: e^{−iθ̇t·K_z}.  K_z has integer eigenvalues on every shell, so ±2π rad/s is one full cycle a second',
      fmt: (v) => v === 0 ? '· still ·' : v.toFixed(3) + ' rad/s',
      onInput: (v) => { const w = sturm.P ? 0 : v; if (w !== v) ui.kzRate.set(w); if (modHand('state.stark.kz', w)) return; setRotationRate('kz', w); } });
    r2.appendChild(ui.kzRate.root);
    ui.defRate = knob({ label: 'SPIN L²', min: -ROT_LIMIT.def, max: ROT_LIMIT.def, value: 0, cls: 'rot',
      title: 'run the quantum defect continuously: e^{iα̇t·L²}.  l(l+1) is EVEN for every l ≤ 5, so the phase is π-periodic and ±π rad/s is one full defect cycle a second',
      fmt: (v) => v === 0 ? '· still ·' : v.toFixed(3) + ' rad/s',
      onInput: (v) => { const w = sturm.P ? 0 : v; if (w !== v) ui.defRate.set(w); if (modHand('state.defect.l2', w)) return; setRotationRate('def', w); } });
    r2.appendChild(ui.defRate.root);
    el('div', 'note', wState.body).innerHTML = '<b>STATE ROTATE</b> applies D(R_z(α)) to the coefficients (c<sub>nlm</sub> → e<sup>−imα</sup>c<sub>nlm</sub>). <b>STARK ROTATE</b> applies e<sup>−iθK<sub>z</sub></sup>, K the Runge–Lenz vector: an SO(4) rotation mixing l at fixed (n, m) — the ORBIT invariants do not move. <b>DEFECT WAIT</b> applies e<sup>iαL²</sup> (a wait under an l-dependent phase, a quantum defect): unitary, in-shell, not an SO(4) element — the invariants move, and with the rotors it is a universal gate set. All three change c; <b>camera</b> orbit is in OBSERVER and never touches c. Edits happen at the current logical time; nothing is silently renormalized.';
    /* ── IMPULSE (wave 53, Josh, board #44: SLAP → IMPULSE, BOW → IMPULSE VECTOR — every user-visible string; the
       identifiers `slap`, `bow`, `bowRelease` and the __LW.bow / LW.kickAlong API keep their names) ── */
    const gK = group(wState.body, 'BOW');
    mat.bow = { gain: 1, curve: 1, limit: 3, ...(mat.bow || {}) };
    const feel = el('div', 'row tight bow-feel', gK);
    ui.bowKnobs = {};
    for (const [key,label,min,max] of [['gain','PULL',.25,4],['curve','RESPONSE',.25,3],['limit','LIMIT',.1,3]]) {
      const k = knob({ label, min, max, value:mat.bow[key], fmt:v=>v.toFixed(2), title: key==='curve'?'1 is linear; above 1 gives a softer start, below 1 a harder start':'Bow '+label.toLowerCase(), onInput:v=>{mat.bow[key]=v;} }); ui.bowKnobs[key]=k; feel.appendChild(k.root);
    }
    el('div','bow-hint',gK,'Ctrl + drag · release to fire');
    const rk = el('div', 'row tight', gK);
    let kickK = 0.2, kickAxis = 'z';
    rk.appendChild(knob({ label: 'STRENGTH', min: 0.01, max: 1.5, value: 0.2, log: true, fmt: (v) => v.toFixed(3) + ' a.u.', onInput: (v) => { kickK = v; } }).root);
    ui.kickAxis = seg({ label: 'ALONG', value: 'z', options: [{ id: 'x', label: 'x' }, { id: 'y', label: 'y' }, { id: 'z', label: 'z' }], onChange: (v) => { kickAxis = v; } });
    rk.appendChild(ui.kickAxis.root);
    rk.appendChild(trig({ label: 'RELEASE', title: 'kick the electron: ψ ↦ e^{ik·x}ψ at the current logical time (also: the K key, along the X/Y/Z axis)', onFire: () => slap(kickK, kickAxis) }).root);
    ui.dragKnob = knob({ label: 'DRAG <m>γ</m> (TOY)', min: 0, max: 0.5, value: 0, fmt: (v) => v === 0 ? 'off' : v.toFixed(3), onInput: (v) => { reg.setDamping(v); touchState(); } });
    rk.appendChild(ui.dragKnob.root);
    ui.kickRo = readout({ label: 'BOW · escaped / momentum', value: '—', cls: 'two', sub: 'no impulse yet' });
    rk.appendChild(ui.kickRo.root);
    el('div', 'note', gK).innerHTML = 'A sudden impulse multiplies <m>ψ</m> by a plane wave <m>e^{ik·x}</m>: exact, unitary on the full space, and the same thing a delta-pulse electric field does. The register keeps only its n ≤ 6 image, so the norm DROPS by the probability the electron was knocked out of the first six shells or ionised — <b>ESCAPED</b> is that number, never renormalised away. The momentum the register gains is Ehrenfest\'s k times the bound share of the Thomas–Reiche–Kuhn sum rule (0.546 for 1s): the missing part is the continuum. Then it <b>jiggles</b>: the state is a superposition and rings at its beats — watch DYNAMICS\' dipole. A magnetic impulse is a rotation of the state, which the rotor knobs already are. <b>THE IMPULSE VECTOR:</b> hold CTRL, press on the field and pull away to draw it — the picture switches to phase and shows the <i>exact</i> boosted state <m>e^{ik·x}ψ</m>, its fringes tightening as <m>k</m> grows (<m>λ = 2π/k</m>); release to apply the impulse in the direction the arrow points (opposite the pull, in the screen plane), release CTRL first to cancel. <b>DRAG γ is a TOY</b>, not physics: excited amplitudes decay as <m>e^{−γ(E_a−E_0)t}</m>, non-unitary, forward in time only, so the wave settles to the ground state. It is the <b>no-jump branch</b> of <m>H − iγ(H−E₀)</m>, <m>Γ_a = 2γ(E_a−E₀)</m>: the ground-state population is invariant and nothing is emitted anywhere — not Lindblad, not the Einstein rates — the norm it loses is simply discarded (Round 11 B4). The status line says TOY DRAG while it is on.';
    function pAlong(axis) {
      const c = reg.at(clock.t);                                  // sum over the WHOLE register: a rotation moves amplitude between m
      if (axis === 'z') return momentumZ(c.re, c.im);
      const R = AXIS_TO_Z[axis], re = Float64Array.from(c.re), im = Float64Array.from(c.im);
      rotorOnCopy(re, im, { which: 'both', axis: R.axis, angle: R.angle });
      return momentumZ(re, im);
    }
    function slap(k, axis) {
      const n0 = reg.norm2(), p0 = pAlong(axis);
      if (!reg.populated().length && getHamiltonian().id !== 'well') reg.set(0, 1, 0, clock.t);   // an empty box: SLAP conjures the ground state first (Josh)
      reg.kick(k, axis, clock.t);
      const n1 = reg.norm2(), p1 = pAlong(axis);
      const esc = n0 > 0 ? 1 - n1 / n0 : 0;
      ui.kickRo.set(`${(100 * esc).toFixed(2)}% · ${(p1 - p0).toFixed(4)}`, esc > 0.2 ? 'warn' : 'ok');
      ui.kickRo.setSub(`<m>k</m> = ${k.toFixed(3)} along ${axis} · Ehrenfest would give ${k.toFixed(3)}; the deficit is the continuum · <m>‖ψ‖</m> now ${Math.sqrt(n1).toFixed(4)}`);
      touchState();
    }
    __LW_hooks.slap = slap;

    const gF = group(wState.body, 'STATIC FIELD  (changes H, not ψ — the evolution law itself)');
    const rf = el('div', 'row tight', gF);
    ui.bz = knob({ label: 'ZEEMAN B', min: 0, max: 0.05, value: 0, fmt: (v) => v === 0 ? 'off' : v.toFixed(4), onInput: (v) => { reg.setField({ Bz: v }); touchState(); } });
    ui.fz = knob({ label: 'STARK F', min: 0, max: 0.01, value: 0, fmt: (v) => v === 0 ? 'off' : v.toExponential(1), onInput: (v) => { if (!getHamiltonian().stark || sturm.P) { ui.fz.set(0); return; } reg.setField({ Fz: v }); touchState(); } });
    rf.appendChild(ui.bz.root); rf.appendChild(ui.fz.root);
    rf.appendChild(trig({ label: 'NO FIELD', onFire: () => { reg.setField({ Bz: 0, Fz: 0 }); ui.bz.set(0); ui.fz.set(0); touchState(); } }).root);
    ui.fieldRo = readout({ label: 'H IN FORCE', value: 'H₀ (bare Coulomb)', cls: 'two', sub: '' });
    rf.appendChild(ui.fieldRo.root);
    el('div', 'note', gF).innerHTML = '<b>ZEEMAN</b> H = H₀ + (B/2)L<sub>z</sub> stays diagonal, so it is exact with no caveat (orbital only: this register has no spin). <b>STARK</b> H = H₀ + F·z is exact <i>within each shell</i> — on a shell z = −(3n/2)K<sub>z</sub>, whose eigenvectors are the parabolic states and are field-independent — but coupling between shells is neglected, which needs F ≪ 1/(3n⁵). Turn the field on and the Stark state stops moving: it has become an eigenstate.';

    const r3 = wState.row();
    r3.appendChild(trig({ label: 'SAVE', title: 'experiment (state, time, rate) and presentation (camera, material) saved separately', onFire: () => { save(); } }).root);
    r3.appendChild(trig({ label: 'LOAD', onFire: () => { restore(); } }).root);
    r3.appendChild(trig({ label: 'COPY JSON', onFire: async () => { try { await navigator.clipboard.writeText(JSON.stringify(serialize(), null, 1)); } catch (_) {} } }).root);
    /* WAVE 56 (board #55): the whole session as a URL.  Its seat is beside SAVE / LOAD / COPY JSON because
       that is where "this state, made portable" already lives — and the FILE menu names it too. */
    r3.appendChild(trig({ label: 'COPY LINK', title: 'copy a link that reopens this exact state — the register, the clock, the operator, the camera, the material and the palette, in about three hundred characters of URL fragment. It says how long it is, and it says what it could not carry.', onFire: () => copyLink() }).root);
    /* THE PLACE THE LINK SPEAKS.  A `.note` and not a hover: what a link dropped is information, and
       information reachable only by hover is unreachable on the iPad (ANTI-PATTERNS 4). */
    ui.linkNote = el('div', 'note link-note', wState.body, ''); ui.linkNote.hidden = true;
  }

  // SPECTRUM
  const wSpec = device({ id: 'spectrum', eyebrow: 'SPECTRUM', title: 'EIGENVALUE · POPULATION · PHASE', status: '' });
  rack.appendChild(wSpec.root);
  {
    const hamGroup = group(wSpec.body, 'HAMILTONIAN');
    const rh = el('div', 'row tight', hamGroup);
    ui.hamSeg = seg({ label: 'OPERATOR', value: 'hydrogen', options: [
      { id: 'hydrogen', label: 'HYDROGEN', title: 'E = −1/(2n²); every window is a theorem about it' },
      { id: 'qho', label: 'OSCILLATOR', title: 'E = ħω(N + 3/2), N = 2n_r + l; the same 91 labels via n_r = n − l − 1; an impulse makes an exact coherent state' },
      { id: 'well', label: 'BOX', title: 'the infinite spherical well: ψ = j_l(kr)Y, E = z²/(2a²), a hard wall — a packet given an impulse bounces and disperses' },
      { id: 'atom', label: 'ATOM', title: 'a real neutral atom (H … Kr) as ONE self-consistent central field: Xα(2/3) + the Latter tail, solved live on a log mesh and Richardson-extrapolated; the 91 labels become its shells, and a shell the ground configuration does not occupy is VIRTUAL (marked °) — it keeps the frozen field\'s eigenvalue and has no radial. The ATOMS window carries the model, the Δ-SCF ionisation and the quantum defect' },
      { id: 'cornell', label: 'QUARKONIUM', title: 'a heavy quark pair in −4α_s/3r + σr: the 91 labels re-read as the 36 (n_r, l) levels of charmonium or bottomonium, NUMERICAL (Numerov); masses in GeV, lengths in GeV⁻¹; the QCD panel\'s knobs drive it' }],
      onChange: (v) => { switchHamiltonian(v); if (v === 'well') enterBox(); } });
    rh.appendChild(ui.hamSeg.root);
    ui.wellKnob = knob({ label: 'WELL RADIUS <m>a</m>', min: 3, max: 30, value: 10, fmt: (v) => v.toFixed(1) + ' a₀', onInput: (v) => { HAMILTONIANS.well.setRadius(v); gas.setRadius(v); hNote(); if (getHamiltonian().id === 'well') { reg.setEnergies(energyOf); wSpec.body.querySelectorAll('.sp-e[data-a]').forEach((e) => { e.textContent = `${api.energyOf(+e.dataset.a).toFixed(4)} ${api.unit()}`; }); schedule(TIER.REBUILD); } } });
    rh.appendChild(ui.wellKnob.root);
    {
      const rg = wSpec.row('tight');
      rg.appendChild(knob({ label: 'GAS  σ', min: 0.5, max: 3, value: 1.8, fmt: (v) => v.toFixed(2) + ' a₀', onInput: (v) => { gasWidth = v; } }).root);
      ui.gasBasis = seg({ label: 'GAS BASIS', value: 'reg', options: [{ id: 'reg', label: '91', title: 'the register\'s 91 labels (l ≤ 5): a packet no smaller than about a/6, launched on any axis' }, { id: 'axial', label: 'AXIAL 256', title: 'the box\'s second register: m = 0 about z, n_r ≤ 15, l ≤ 15 — packets down to σ ≈ 0.6 a₀, launched along z; the channels do not list it (it is not the 91-label register)' }], onChange: (v) => { gasAxial = v === 'axial'; if (!gasAxial) gas.off(); hNote(); schedule(TIER.RECONSTRUCT); } });
      rg.appendChild(ui.gasBasis.root);
      ui.gasSpeed = knob({ label: 'GAS  |k|', min: 0.1, max: 2.5, value: 0.8, log: true, fmt: (v) => v.toFixed(2), onInput: () => {} });
      rg.appendChild(ui.gasSpeed.root);
      rg.appendChild(trig({ label: 'LAUNCH', title: 'in the BOX: put a packet of width σ at −a/2 on the chosen axis, moving along it at |k| — then watch it bounce', onFire: () => {
        if (getHamiltonian().id !== 'well') { setHamiltonian('well'); switchHamiltonian('well'); if (ui.hamSeg) ui.hamSeg.set('well'); }
        const ax = keyState.axis, a = HAMILTONIANS.well.radius, d = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] }[ax], k = ui.gasSpeed.get ? ui.gasSpeed.get() : 0.8;
        launchPacket(d.map((v) => -v * a / 2), d.map((v) => v * k), gasSigma(k));
      } }).root);
      ui.gasRo = readout({ label: 'GAS  packet held by the box', value: '—', sub: 'nothing launched' });
      rg.appendChild(ui.gasRo.root);
      rg.appendChild(trig({ label: 'COHERENT BOUNCE', title: 'in the OSCILLATOR: the ground state given an impulse |k| is an exact Glauber coherent state — it swings through the centre for ever without spreading (period 2π)', onFire: () => coherentBounce() }).root);
      el('div', 'note', wSpec.body).innerHTML = '<b>COHERENT BOUNCE (EXACT).</b> In the oscillator a ground state given an impulse, e<sup>ikz</sup>ψ<sub>0</sub> is the coherent state |α⟩ with α = ik/√2: its centre follows the classical orbit ⟨z⟩ = k sin t, ⟨p⟩ = k cos t, and its width never changes — the packet Josh asked for, rigid and bouncing, with nothing approximate (truncation at N ≤ 10 holds e<sup>−k²/2</sup>Σ(k²/2)<sup>N</sup>/N! of the norm: 99.99% at k = 2). In the BOX the same impulse disperses, because a hard wall has no equally spaced ladder — that is physics, not a defect. The BOX\'s basis (six radial zeros, l ≤ 5) also bounds how compact a held packet can be: σ/a ≳ 1/6 for 95% capture, so the gas packet is always about a sixth of the box.';
      el('div', 'note', wSpec.body).innerHTML = '<b>THE GAS.</b> In the BOX a packet is a Gaussian of width σ with momentum k, <b>projected onto the well\'s 91 eigenstates</b> and normalised as a new state; it then moves and bounces by the exact evolution. The register resolves nothing sharper than ≈ a/6, so the readout says how much of the packet it holds. The IMPULSE VECTOR launches a packet where you pressed, flying along the arrow; a harder pull launches a slightly tighter packet — a <b>DESIGN CHOICE</b> at launch (a boost by itself never changes a width).';
    }
    /* WAVE 68 · `step: 1`, and it is the only knob in the lab that lacked one.  Without it an arrow
       moved 1/100 of the travel = 0.05 = a TWENTIETH of an integer, so eleven real presses produced
       TWO announced values while `aria-valuenow` walked 1.05 … 1.55 through Z values the register
       cannot hold.  A dial whose `fmt` rounds has a lattice; the travel law has to know about it. */
    ui.zKnob = knob({ label: 'Z  (ion)', min: 1, max: 6, value: 1, step: 1, fmt: (v) => 'Z = ' + Math.round(v), onInput: (v) => { setZ(Math.round(v)); if (getHamiltonian().id === 'hydrogen') switchHamiltonian('hydrogen'); } });
    rh.appendChild(ui.zKnob.root);
    ui.elemKnob = knob({ label: 'ELEMENT  Z', min: 1, max: 36, value: 10, step: 1, fmt: (v) => 'Z = ' + Math.round(v) + '  ' + ATOMS[Math.max(0, Math.min(35, Math.round(v) - 1))].symbol, onChange: (v) => setElement(Math.round(v)) });
    rh.appendChild(ui.elemKnob.root);
    {   /* W-STURMIAN: THE SCALE — a switch (Josh); hydrogen is today's code path, untouched */
      const rs = wSpec.row('tight');
      ui.scaleSeg = seg({ label: 'SCALE  ·  the exponent of the 91 radials  (hydrogen operator only)', value: 'hydrogen', options: [
        { id: 'hydrogen', label: 'HYDROGEN  1/n', title: 'the shipped radials: each label n carries its own exponent 1/n — hydrogen\'s bound states, the diagonal law, every window' },
        { id: 'sturmian', label: 'STURMIAN  λ', title: 'one common exponent λ for all 91 labels: the Coulomb Sturmians (Rotenberg 1962), a complete discrete set. The labels stop being eigenstates: the register evolves by C e^{−iEt} CᵀS with the VARIATIONAL eigenvalues of S⁻¹H, the ladder shows them with the state\'s population in each, and the kernel draws the same tables at n = 1/λ' }],
        onChange: (v) => setSturmian({ on: v === 'sturmian' }) });
      rs.appendChild(ui.scaleSeg.root);
      ui.lambdaKnob = knob({ label: 'λ  SCALE', min: 0.25, max: 3, value: 1, fmt: (v) => 'λ = ' + v.toFixed(3), onInput: (v) => { if (sturm.on) setSturmian({ lambda: v }); else sturm.lambda = Math.max(0.25, Math.min(3, v)); } });
      ui.lambdaKnob.root.title = 'λ, the common exponent (a₀⁻¹): λ = 1/n makes label n exact again (its eigenvalue −Z²/2n²); λ = Z makes the 1s Sturmian the exact ion ground state (He⁺ at λ = 2: −2 Eh). Shift = fine, double-tap = 1';
      ui.lambdaKnob.setDisabled(true);
      rs.appendChild(ui.lambdaKnob.root);
      ui.sturmRo = readout({ label: 'SCALE', value: 'HYDROGEN 1/n', cls: 'two', sub: 'the shipped radials · λ acts once STURMIAN is on' });
      rs.appendChild(ui.sturmRo.root);
      el('div', 'note', wSpec.body).innerHTML = '<b>SCALE (a switch).</b> <b>HYDROGEN</b> is today\'s instrument, untouched. <b>STURMIAN</b> gives every one of the 91 radials the same exponent λ — the Coulomb Sturmians S<sub>nlm</sub>(λ), the same Laguerre and Legendre tables drawn at n = 1/λ, a <b>complete</b> discrete set (the shipped n ≤ 6 hydrogen set is not: 23 % of He⁺ 1s lives in the continuum it lacks). The labels stop being eigenstates: the register evolves by the exact law in the basis, c(t) = C e<sup>−iEt</sup> CᵀS c(0), with the eigenvalues of S⁻¹H — <b>variational</b> upper bounds (Hylleraas–Undheim–MacDonald), exact where a label happens to be one: λ = 1/n reproduces −Z²/2n², λ = Z the ion\'s 1s at −Z²/2. The ladder shows those eigenvalues with the state\'s population in each (S-metric projections — what "population" means in a non-orthogonal basis; they are constants of the motion); click one to load its eigenvector. The lanes keep the labels\' coefficients; a lane\'s energy is the label\'s ⟨H⟩, not an eigenvalue; the norm is ⟨c|S|c⟩ and NORMALIZE normalises in it. RATE, A / B TRANSITION and the Stark field are diagonal-phase features and stand down, as do momentum space (no table built), ELECTROSTATICS and the hydrogen-theorem windows; the Zeeman field stays (exact). Everything comes back on HYDROGEN. Z is honoured: H = −½∇² − Z/r.';
    }
    el('div', 'note', wSpec.body).innerHTML = '<b>Z</b> makes the hydrogen-like ion (He⁺, Li²⁺, …) by <b>exact scaling</b>: lengths /Z, energies ×Z², momenta ×Z — nothing approximate anywhere; the hydrogen-theorem windows are written in hydrogen\'s own units and stand down for Z ≠ 1 (ORBIT\'s invariants are dimensionless and stay). The register holds coefficients on 91 labels (n, l, m); this chooses the operator they are eigenstates OF. <b>HYDROGEN</b>: <m>E = −1/(2n²)</m>, the Coulomb closed forms. <b>OSCILLATOR</b>: <m>E = ħω(N + 3/2)</m> with <m>N = 2n_r + l</m>, the Gaussian closed forms — exact, its own momentum picture up to a phase (−i)^N, and an <b>impulse on its ground state makes an exact coherent state</b> that sloshes forever without dispersing (Ehrenfest exact), where hydrogen\'s disperses and revives. Windows that are theorems about hydrogen (ORBIT, LADDER, VORTEX, DYNAMICS, SLICE, KEPLER) stand down when the operator is not hydrogen; the Stark field, exact within a Coulomb shell, is off there.';
  }
    el('div', 'note', wSpec.body).innerHTML = '<b>ATOM</b> is the one operator here that is <b>not</b> a closed form: a real neutral atom, H … Kr, as a single self-consistent central field — −Z/r + V<sub>H</sub> + V<sub>x</sub> with <b>Xα, α = 2/3</b> and the <b>Latter tail</b> — solved live on a logarithmic mesh (twice, Richardson-extrapolated in dx²) and handed to the kernel as a tabulated radial, exactly as QUARKONIUM is. The 91 labels become that atom\'s shells: ε<sub>nl</sub> where the ground configuration occupies the shell, the same frozen field\'s eigenvalue where it does not — a <b>virtual</b> shell, marked <b>°</b>, which carries an energy and draws nothing, because atoms.js refuses to invent a radial for a shell the atom does not have. Momentum space is not built for it. <b>ε is not an ionisation energy</b>: the ATOMS window prints the Δ-SCF beside Koopmans\' −ε and never confuses them.';
  api.hamiltonian = () => sturm.P ? sturmSpectrum() : getHamiltonian().spectrum;          // W-STURMIAN: the eigen ladder under the scale
  /* wave 50: THE RATE WAS MISSING HERE.  The register evolves label a at energyOf(a) = H.energy(a) · rates[a]
     (line 72, what reg.setEnergies is given), and this — the API every reader prints from, SPECTRUM's Eh and
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
  { const kids = [...wSpec.body.children], i = kids.findIndex((k) => k.classList.contains('ladder')); const h=kids[0]; for(const k of kids.slice(1,Math.max(0,i)))h.appendChild(k); wSpec.body.appendChild(h); }   // the Hamiltonian, the gas and the bounce sit BELOW the channels (Josh)
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

  /* ── W-STURMIAN: THE SCALE (Josh: a switch — HYDROGEN is today's code path, untouched; STURMIAN adds) ─────────────────
   * On: the 91 records become sturmianRecord(n, l, m, λ) for the kernel (n_rec = 1/λ; rebuilt on every λ or Z change,
   * ≈ 1 ms + the GPU upload through TIER.REBUILD), the register evolves through the block-pure propagator C e^{−iEt} CᵀS
   * (sturmianreg.js), the state c(t) is CONTINUOUS across the change (re-anchored at the current time, as a RATE change
   * is), the norm is ⟨c|S|c⟩, the SPECTRUM ladder is the eigen-decomposition and its lanes the labels' coefficients, the
   * clock reads the OCCUPIED eigenvalues, and the diagonal-phase features (RATE, A/B TRANSITION, Stark, momentum space)
   * and the hydrogen-theorem windows stand down with a note.  Hydrogen operator only (Z honoured: H = −½∇² − Z/r). */
  const sturmLabel = () => `STURMIAN  λ = ${sturm.lambda.toFixed(3)} · Z = ${getZ()} · S⁻¹H on the 91 labels · VARIATIONAL`;
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
      footer: `EIGENVALUE  S⁻¹H at λ = ${sturm.lambda.toFixed(3)} · rank ${e.rank} · VARIATIONAL upper bounds · E > 0 pseudo-continuum`,
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

  rack.appendChild(wPal.root); rack.appendChild(wObs.root); rack.appendChild(wCam.root); rack.appendChild(wClip.root);   // Josh's order (wave 56: WAVE is one card, so `style` no longer takes a seat)
  rack.appendChild(ui.set.root);
  /* THE ABOUT FACE LIVES IN THE NOTEBOOK GLASS (wave 30), and its markup is lab/index.html's `.nb-aboutface`.
     A commented-out copy of the old in-window version sat here for twenty-nine waves; wave 59 deleted it,
     because it was a trap: it claimed two typefaces where three ship, named a font that has since been
     renamed for licence reasons, said "waves 5-27", and linked `/REPORT.md` at the SITE root — a path the
     deploy does not have.  Anyone who uncommented it would have shipped four wrong facts at once. */

  // SHADOW
  const wSh = device({ id: 'shadow', eyebrow: 'SHADOW', title: 'CLASSICAL SHADOW  <m>c = (q + ip)/√2</m>', status: 'same c(t), same time' });
  rack.appendChild(wSh.root);
  const shCanvas = el('canvas', 'shadow-c', wSh.body);
  const shadowView = createShadowView(shCanvas, api);
  {
    const r = wSh.row();
    ui.shadowSeg = seg({ aria: 'shadow picture', value: 'phasors', options: [{ id: 'phasors', label: 'PHASORS' }, { id: 'oscillators', label: 'OSC', title: 'Oscillators' }, { id: 'lissajous', label: 'LISSA', title: 'Lissajous' }], onChange: (v) => { shadowView.setMode(v); schedule(TIER.PRESENT); } });
    r.appendChild(ui.shadowSeg.root);
    ui.hc = readout({ label: 'H_C = ½qᵀAq + ½pᵀAp = ⟨H⟩', value: '—' });
    r.appendChild(ui.hc.root);
    el('div', 'epi', wSh.body, 'EXACT REAL REPRESENTATION OF FINITE UNITARY AMPLITUDE DYNAMICS');
    el('div', 'note', wSh.body).innerHTML = 'For diagonal H each amplitude is an uncoupled harmonic oscillator: q̇<sub>a</sub> = E<sub>a</sub>p<sub>a</sub>, ṗ<sub>a</sub> = −E<sub>a</sub>q<sub>a</sub>, angular velocity −E<sub>a</sub>. Exact at the equation level; it is not a claim that the atom is classical.';
  }

  // ORBIT — the two rotors (print, Thread B)
  const wOrb = device({ id: 'orbit', eyebrow: 'ORBIT', title: 'THE TWO ROTORS · <m>SO(4)</m> INVARIANTS', status: 'exact · per shell' });
  rack.appendChild(wOrb.root);
  const orbit = createOrbit(wOrb.body, { reg, setStatus: (t, c) => wOrb.setStatus(t, c), rotor(spec) { reg.rotor(spec); touchState(); } });
  const kepler = createKepler(dom.kepler);
  {
    const rk = wOrb.row('tight');
    /* ══ THE KEPLER KNOBS (Josh: "perhaps we can have some turnable knobs for kepler orbit that can
     * allow us to mess with the rotations alongside the current touch/drag controls") ═════════════
     *
     * WHY THEY ARE JOG WHEELS AND HOLD NO VALUE.  Everywhere else in this lab a knob that holds no
     * value is a defect (kit.js:213, and the three STATE wheels are the standing example).  HERE it
     * is the only correct control, and for the opposite reason: EVERY KEPLER ROTATION QUANTITY IS
     * DERIVED.  orbitOfShell(n) recomputes the orbit from reg.re0/im0 on every call; there is no
     * orbit object to write to and no angle stored anywhere.  A knob bound to a stored angle would
     * be a SECOND TRUTH, and it would drift the instant anything else edited the state — which the
     * perihelion drag, IMPULSE, the presets, a project LOAD and every undo all do.  So these report
     * deltas, they read the orbit FRESH inside every onDelta, and that fresh read is exactly what
     * makes the knobs and the drag agree instead of fighting.
     *
     * ⚠ THE ROTORS ARE NOT PER-SHELL, AND THE SELECTOR DOES NOT PRETEND THEY ARE.  applyRotor
     * (frontier.js) loops n = 2…6 and turns EVERY POPULATED SHELL.  SHELL picks whose geometry
     * supplies the AXIS, not what moves — and that has always been true of the drag too: pulling
     * n = 3's perihelion turns n = 4's orbit with it.  The note says so rather than leaving it to
     * be discovered.
     *
     * ISOTROPIC IS DISABLED, INCOHERENT IS ONLY WARNED, and the line between them is where the AXIS
     * lives.  An isotropic shell has ⟨L⟩ = ⟨K⟩ = 0: there is no normal, no node line and no
     * perihelion, so there is no axis to turn about and the controls go dead — DISABLED, never a
     * silent no-op.  Below coherence ½ the AXES still exist and the rotors are still exact SO(4)
     * elements; what fails is the claim that the ellipse IS the state, which is a DRAWING refusal
     * (keplerview.js:47) and nothing more.  Disabling a control because a picture stood down would
     * be disabling it for a reason that has nothing to do with the operator it applies. */
    ui.kepShell = seg({ label: 'SHELL', value: '3', aria: 'Kepler shell',
      options: [2, 3, 4, 5, 6].map((n) => ({ id: String(n), label: 'n' + n, title: `read the orbit axes off shell ${n} (the rotors act on the whole register)` })),
      onChange: () => keplerRowSync(true) });
    rk.appendChild(ui.kepShell.root);
    {
      const rkk = wOrb.row('tight');
      /* SPIN is the drag's OWN FIRST LEG, and it is the same call — keplerTurn('spin', dθ) is what
         keplerDragToPoint reaches for once it has worked out the φ that puts the perihelion under
         the pointer.  One entry point, one fresh read, one convention check, one touchState. */
      ui.kepSpin = knob({ label: 'SPIN  ω', min: 0, max: 2 * Math.PI, value: 0, wrap: true, cls: 'rot', fmt: () => 'D(R_L̂)',
        title: 'carry the perihelion around inside its own plane — a spatial rotation about the orbit normal L̂. This is the drag\'s first leg, by the same call',
        onDelta: (d) => keplerTurn('spin', d) });
      ui.kepTilt = knob({ label: 'TILT  ν', min: 0, max: 2 * Math.PI, value: 0, wrap: true, cls: 'rot', fmt: () => 'D(R_n̂)',
        title: 'tip the orbit plane about its NODE LINE (ẑ × L̂) — the inclination changes, the ascending node does not. With the plane already level every in-plane axis is a node, and the perihelion û is taken',
        onDelta: (d) => keplerTurn('tilt', d) });
      ui.kepTurn = knob({ label: 'TURN  Ω', min: 0, max: 2 * Math.PI, value: 0, wrap: true, cls: 'rot', fmt: () => 'D(R_z)',
        title: 'turn the ascending node about world z. The SAME operator as STATE · ROTATE z, seated here because the node is a Kepler quantity — and the only one of the three that needs no conjugation, since axis z is native to reg.rotor',
        onDelta: (d) => keplerTurn('turn', d) });
      for (const k of [ui.kepSpin, ui.kepTilt, ui.kepTurn]) rkk.appendChild(k.root);
      ui.kepRo = readout({ label: 'ORBIT  a · e · coherence', cls: 'wide', value: '—', sub: 'pick a populated shell' });
      rkk.appendChild(ui.kepRo.root);
    }
    rk.appendChild(sw({ label: 'KEPLER ORBIT', value: false, title: 'draw the classical orbit each shell carries — from the exact ⟨L⟩ and ⟨K⟩ — over the cloud', onChange: (v) => { kepler.setOn(v); schedule(TIER.PRESENT); } }).root);
    el('div', 'note', wOrb.body).innerHTML = '<b>KEPLER ORBIT.</b> The two sphere points ARE a classical orbit: the shell sets a = n², the angle between n₊ and n₋ is the eccentricity, their sum is the angular momentum, and ⟨K⟩ points to the perihelion. It is drawn over the cloud with the perihelion dotted and the classical <b>time-averaged position</b> crossed — which equals the quantum ⟨x⟩ = −(3n/2)⟨K⟩ (Pauli\'s replacement, exact for every shell state) — an identity by construction once a = n² and e = |⟨K⟩|/n are read off the state. The ellipse carries the state\'s energy and eccentricity but NOT its angular momentum: its own L = n√(1−e²) exceeds |⟨L⟩| always (K² + L² ≤ n²−1), and the label prints both. A dashed orbit means the shell is not coherent; below coherence ½ none is drawn (Round 11 §3).';
  }

  // VORTEX — the nodal lines (print, Thread C)
  const wVor = device({ id: 'vortex', eyebrow: 'VORTEX', title: 'NODAL LINES · UNIMODULAR ROOTS OF <m>P(w)</m>', status: 'exact on sampled circles' });
  rack.appendChild(wVor.root);
  const vortex = createVortex(wVor.body, dom.vortex, { reg, clock, scrubTo: (t) => { clock.scrub(t); schedule(TIER.EVOLVE); } });

  // DYNAMICS — the Lagrangian picture, the action–angle chart, the dipole, and the particle view
  const particles = createParticles(dom.particles, {});
  const wDyn = device({ id: 'dynamics', eyebrow: 'DYNAMICS', title: 'LAGRANGIAN · ACTION · DIPOLE · PARTICLES', status: 'exact · reads c(t)' });
  rack.appendChild(wDyn.root);
  const dynamics = createDynamics(wDyn.body, {
    particles,
    seedParticles(n) { particles.seed(n, reg, clock.t, domain.half); },
    repaint() { schedule(TIER.PRESENT); }
  });

  // SLICE — a rotatable complex plane through ψ (the 4D engine's rotor pair, carrying hydrogen's own 4-space)
  const wSlice = device({ id: 'slice', eyebrow: 'SLICE', title: 'COMPLEX PLANE · ROTOR · KS <m>ℝ⁴</m>', status: 'observer · domain colouring' });
  rack.appendChild(wSlice.root);
  const slice = createSliceView(wSlice.body, {
    lut: () => (palette && palette.on ? toLUT(palette.stops) : null),
    repaint() { schedule(TIER.PRESENT); }
  });

  // QCD — the confining side: quarkonium under a chosen potential, the flavour-independence verdict, the string
  const wQCD = device({ id: 'qcd', eyebrow: 'QCD', title: 'QUARKONIUM · CORNELL · THE STRING', status: 'numerical · Numerov' });
  rack.appendChild(wQCD.root);
  const qcd = createQCD(wQCD.body, { repaint() { schedule(TIER.PRESENT); }, onParams(kind, pot, p) { if (HAMILTONIANS.cornell.configure(kind, p, pot) && getHamiltonian().id === 'cornell') switchHamiltonian('cornell'); } });

  // MOLECULE — H₂⁺ in the 1s LCAO basis: the field is handed to two protons and one electron
  const wMol = device({ id: 'molecule', eyebrow: 'MOLECULE', title: '<m>H₂⁺</m> · LCAO · TUNNELLING', status: 'exact integrals · variational · classical nuclei · Pulay bound' });
  rack.appendChild(wMol.root);
  let moPanel = null, pulsePanel = null;                               // W-MO: the general basis block, and W-PULSE below it
  const molecule = createMolecule(wMol.body, { repaint(rebuild) { schedule(rebuild ? TIER.REBUILD : TIER.PRESENT); }, setOn(v) { moleculeMode(v); },
    onR(v, sync) { if (moPanel) moPanel.setR(v, sync); } });           // one R for both blocks: the knob and the API move the force line too
  moPanel = createMOPanel(wMol.body, { repaint(rebuild) { schedule(rebuild ? TIER.REBUILD : TIER.PRESENT); } });
  /* W-PULSE (wave 58, board #24): the third block on this card — Astra's field-driven H₂⁺ (lab/modrive.js), which
     nothing in the interface reached until now.  It runs on the LAB's clock (t_drive = t_lab − t₀ at FIRE) and it
     feeds nothing: the stage still draws whatever the two blocks above it hold, and the pulse is the card's own. */
  pulsePanel = createPulse(wMol.body, { now: () => clock.t });
  function moleculeMode(v) {
    for (const w of [wState, wSpec, wSh, wOrb, wVor, wDyn, wSlice, wLad, wCalc]) if (w) w.root.hidden = !!v;   // CALCULUS reads the atomic register: it stands down too (Round 11 §10b)
    if (v && space === 'p') { space = 'x'; if (ui.spaceSeg) ui.spaceSeg.set('x'); }
    if (!v) switchHamiltonian(getHamiltonian().id);                  // restore the atom's own hiding rules
    refSnapshot = null; pendingRef = null;
    schedule(TIER.REBUILD);
  }

  // HELIUM — two electrons, Hylleraas: the field becomes the conditional cloud of electron 2
  const wHe = device({ id: 'helium', eyebrow: 'HELIUM', title: 'TWO ELECTRONS · HYLLERAAS · CORRELATION', status: 'exact integrals · variational' });
  rack.appendChild(wHe.root);
  const helium = createHelium(wHe.body, { repaint(rebuild) { schedule(rebuild ? TIER.REBUILD : TIER.PRESENT); }, setOn(v) { if (v && molecule.on) molecule.setOn(false); moleculeMode(v); } });

  // H₂ — two atoms, Heitler–London: the curves, the collision, the one-electron density
  const wH2 = device({ id: 'h2', eyebrow: '<m>H₂</m>', title: 'HEITLER–LONDON · THE BOND · THE COLLISION', status: 'exact integrals · variational · classical nuclei' });
  rack.appendChild(wH2.root);
  const h2 = createH2(wH2.body, { repaint(rebuild) { schedule(rebuild ? TIER.REBUILD : TIER.PRESENT); }, setOn(v) { if (v) { if (molecule.on) molecule.setOn(false); if (helium.on) helium.setOn(false); } moleculeMode(v); }, now: () => clock.t });

  // CALCULUS — the stats, derived live, with their laws and residuals
  const wCalc = device({ id: 'calculus', eyebrow: 'CALCULUS', title: 'THE STATS · DERIVED · EHRENFEST LIVE', status: 'exact within the register' });
  rack.appendChild(wCalc.root);
  const calculus = createCalculus(wCalc.body, {});

  // METERS
  const wMet = device({ id: 'meters', eyebrow: 'METERS', title: 'INVARIANTS · CLOCKS · STATUS', status: '' });
  rack.appendChild(wMet.root);
  const meters = createMeters(wMet.body);

  {
    const rp = wMet.row('tight');
    ui.perfSeg = seg({ label: 'PERFORMANCE', value: 'full', options: [
      { id: 'full', label: 'FULL', title: 'every window updates every frame; automatic quality protects a 60 Hz frame budget' },
      { id: '120', label: '120 Hz', title: 'the CPU windows update every 4th frame; the FIELD and overlays present every frame. Automatic quality targets up to 120 Hz, following the fastest sustained cadence this browser has delivered' }],
      onChange: (v) => setPerfMode(v) });
    rp.appendChild(ui.perfSeg.root);
    ui.govRo = readout({ label: 'GOVERNOR  state · median · grid', value: 'nominal', cls: 'wide', sub: 'budget 28 ms over the last 60 frames' }); rp.appendChild(ui.govRo.root);
    el('div', 'note', wMet.body).innerHTML = '<b>FRAME PROFILE</b> is an exponential average of what each stage costs per frame, in milliseconds, measured on this machine and this browser. The display refresh rate caps what the browser will deliver (Firefox follows the compositor; a 60 Hz monitor gives 60 Hz whatever the code does). <b>120 Hz</b> mode moves the CPU windows to every 4th frame and lets AUTO SCALE / GOVERNOR follow sustained browser delivery up to 120 Hz; it starts with a 60 Hz budget until faster delivery is observed; the physics clock and the field cadence are untouched (§12: four clocks).';
  }
  // LADDER — the Rydberg revival as a spectral instrument (print, Thread A); its own register, no field
  const wLad = device({ id: 'ladder', eyebrow: 'LADDER', title: 'RYDBERG REVIVAL · SPECTRAL', status: 'own register · no field' });
  rack.appendChild(wLad.root);
  const ladder = createLadder(wLad.body);

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
   * EXCEPTION): `lab/mir/modwindow/`, BASINS' own window, moved here whole.  It is 716 × 466 at
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
        hint: 'signed and detented at the horizon: 50 % is EXACTLY level',
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
        hint: 'the palette wheel is a wheel: this one wraps, and the interface accents follow it at 10 Hz while the field follows every frame',
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
        hint: 'the physics clock’s rate — a modulation TARGET, never the modulator’s own clock',
        get: () => clock.rate, set: (v) => { clock.setRate(v); setKnob(ui.rateKnob, v); } },

      /* ══ WAVE 106 · THREE MORE, AND THEY ARE THE THREE THAT PASS THE HOUSE RULE ═══════════════════
         Josh named five places he wanted a macro.  The rule above this array is what decides which of
         them may be one: a target's setter must be a PRESENT and must not bump `reg.version`, because
         that is the UNDO ring's trigger and an LFO on it would push an entry every 400 ms.  These
         three clear it; the other two are answered in the note under `state.rabi`.
           SLICE POS and THICK are pure material writes — one uniform each, one PRESENT, no register
         touched at all.  Registering them also repairs a bug nobody filed: `mat` is serialised whole
         and restored by Object.assign, so after a project LOAD these two dials showed the OLD numbers
         over the NEW slice.  A registered target is re-based from the model on restore
         (`modSyncBases`), so the needle now follows the file. */
      { id: 'material.slice.pos', label: 'SLICE POS', map: 'bipolar', min: -1, max: 1, def: 0, group: 'material', knob: () => ui.slicePosK,
        hint: 'where the CLIP / SLAB plane cuts along the chosen axis — signed, so the centre is an exact detent. Acts only while SLICE MODE is not VOLUME',
        get: () => mat.slice.pos, set: (v) => { mat.slice.pos = v; setKnob(ui.slicePosK, v); schedule(TIER.PRESENT); } },
      { id: 'material.slice.thick', label: 'SLICE THICK', map: 'log', min: 0.01, max: 0.4, group: 'material', knob: () => ui.sliceThickK,
        hint: 'how deep the slab is. Acts only while SLICE MODE is not VOLUME',
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
        hint: 'dθ/dt about z, in rad/s — a RATE, never an angle. ±2π is one full turn a second, and D(R_z) is a rigid spatial turn so it is exact at any rate',
        get: () => rotRate.z,
        set: (v) => { setRotationRate('z', v); } },
      { id: 'state.stark.kz', label: 'SPIN K_z', unit: ' rad/s', map: 'bipolar', min: -ROT_LIMIT.kz, max: ROT_LIMIT.kz, def: 0, group: 'state', knob: () => ui.kzRate,
        hint: 'dθ/dt of e^{−iθK_z}, in rad/s. K_z has integer eigenvalues on every shell, so ±2π is one full Stark cycle a second. Clamped to zero under STURMIAN',
        get: () => rotRate.kz,
        set: (v) => { setRotationRate('kz', v); } },
      { id: 'state.defect.l2', label: 'SPIN L²', unit: ' rad/s', map: 'bipolar', min: -ROT_LIMIT.def, max: ROT_LIMIT.def, def: 0, group: 'state', knob: () => ui.defRate,
        hint: 'dα/dt of e^{iαL²}, in rad/s. l(l+1) is EVEN for every l ≤ 5, so the phase is π-periodic and the range is π, not 2π: full deflection is one defect cycle a second. Clamped to zero under STURMIAN',
        get: () => rotRate.def,
        set: (v) => { setRotationRate('def', v); } },

      { id: 'state.rabi', label: 'Ω RABI', map: 'log', min: 0.005, max: 1, def: 0.05, group: 'state', knob: () => ui.abOmega,
        hint: 'the Rabi rate of the A → B → A mix. t₀ is re-solved on every change so the mix angle never jumps',
        get: () => __LW_hooks.ab.omega,
        set: (v) => { __LW_hooks.ab.setOmega(v); setKnob(ui.abOmega, v); schedule(TIER.PRESENT); } },
    ];
    modHost = createModHost({
      available: () => field.ok,                          /* BASINS’s flowActive: is the reader live */
      present: () => schedule(TIER.PRESENT),               /* EDGE 4 — and never a tier above it */
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
    requestAnimationFrame(stampParams);
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
       presentation — the four `lab/mir/host.js` has provided since the MIR wave, and the four
       `host-contract.md` PART 3 says this window boots on and nothing else. */
    /* ══ WAVE 81 · THE PLAYHEAD DODGES THE PLUGIN, AND TUNNELS TO THE OTHER SEAT ═══════════════
     * Josh: "When moving the modulation plug in around, have the original playhead move to the top
     * … perform an interesting animation when switching to the top and bottom like pac-man tunnel
     * effect easing … whenever is at risk of being covered by the modulation plugin."
     *
     * THE DECISION IS THE HOST'S.  The window reports its rect (`port.moved`) and this picks the
     * seat, because the transport is λWAVES' own chrome and the plugin may not restyle it.
     *
     * THE TEST IS ON THE SEAT, NOT ON THE PILL.  Asking "does the plugin overlap the pill where it
     * is now?" cannot answer "would it overlap where it is going?", and a dodge decided from the
     * current position oscillates the moment both seats are occupied.  So both candidate rects are
     * computed from the pill's own size and the two anchors, and the answer is: keep the bottom if
     * the bottom is clear, take the top if it is not and the top is, otherwise DO NOT MOVE — a
     * window covering both seats is not a reason to flap between them.
     *
     * THE TUNNEL IS TWO HALVES OF ONE 300 ms MOVE (MOTION-LAW's ceiling, not a budget to beat): the
     * pill leaves through the edge it is on, the seat swaps while it is off-screen, and it arrives
     * through the opposite edge — which is why it reads as a tunnel and not as a jump.  Under
     * `prefers-reduced-motion` the CSS keeps the fade and drops the travel ("fewer and gentler,
     * never zero"), so the seat still changes and nothing slides. */
    let trSeat = 'bottom', trMoving = false;
    function seatRect(where, w, h) {
      const vw = window.innerWidth, vh = window.innerHeight;
      const top = where === 'top' ? 52 : vh - 60 - h;
      return { left: (vw - w) / 2, right: (vw + w) / 2, top, bottom: top + h };
    }
    const hits = (a, b) => !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
    function modDodge(r) {
      const t = document.getElementById('transport');
      if (!t || !t.classList.contains('mini')) return;
      if (trMoving) { if (r.right < 0) setTimeout(() => modDodge(r), 320); return; }
      if (document.body.classList.contains('rack-hidden')) return;   // it is already parked off-screen
      const box = t.getBoundingClientRect();
      const w = box.width || 560, h = box.height || 34;
      const want = !hits(seatRect('bottom', w, h), r) ? 'bottom'
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
      closed: () => modDodge({ left: -1, right: -1, top: -1, bottom: -1 }),
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
                                   frames: audioCap.frames }
                               : { state: AUDIO_STATE.IDLE, reason: '', live: false, deviceId: '', sampleRate: 0, frames: 0 }),
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
  const wAtoms = device({ id: 'atoms', eyebrow: 'ATOMS', title: 'THE PERIODIC TABLE · <m>Xα</m> · CENTRAL FIELD', status: 'numerical · SCF + Richardson' });
  rack.appendChild(wAtoms.root); wAtoms.root.classList.add('closed');            // reopened from the + at the top of the rack
  const atomsView = createAtoms(wAtoms.body, {
    Z: () => HAMILTONIANS.atom.Z,
    step: (d) => setElement(HAMILTONIANS.atom.Z + d),
    fill: () => fillValence(),
    active: () => getHamiltonian().id === 'atom',
  });

  // ELECTROSTATICS — the classical field of the register's own charge, in closed form; a niche window: it ships CLOSED
  const wFld = device({ id: 'field', eyebrow: 'ELECTROSTATICS', title: 'POTENTIAL · FIELD · CURRENT · THE CLASSICAL FIELD OF <m>ρ</m>', status: 'exact · closed form · reads c(t)' });
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
      { id: 'phi', label: 'Φ', title: 'equipotentials of the total potential, log-spaced between Φ(0.9·half) and Φ(0.25 a₀)' },
      { id: 'E', label: 'E', title: 'field lines of E = −∇Φ, seeded on a small circle round the nucleus (they end on the electron density: the atom is neutral)' },
      { id: 'j', label: 'j', title: 'streamlines of the probability current j = Im(ψ*∇ψ) — zero for every real orbital' }],
      onChange: (v) => { fieldlines.setOverlay(v); schedule(TIER.PRESENT); } });
    rf.appendChild(ui.fldOv.root);
    ui.fldLines = knob({ label: 'LINES', min: 4, max: 24, value: 10, step: 1, fmt: (v) => Math.round(v) + (fieldlines.overlay === 'phi' ? ' levels' : ' seeds'),
      onInput: (v) => { fieldlines.setLines(v); schedule(TIER.PRESENT); } });
    rf.appendChild(ui.fldLines.root);
    ui.fldSrc = seg({ label: 'SOURCE', value: 'total', options: [
      { id: 'total', label: 'ρ + nucleus', title: 'Φ = Z/r + Φ_e and E = −∇Φ: the whole atom, monopole cancelled' },
      { id: 'rho', label: 'ρ only', title: 'the electron cloud alone — Φ_e, and E with the nucleus’s exact Z r̂/r² removed (j is the electron’s either way)' }],
      onChange: (v) => { fieldlines.setSource(v); schedule(TIER.PRESENT); } });
    rf.appendChild(ui.fldSrc.root);
    const rr = wFld.row('tight');
    ui.fldQ = readout({ label: 'MONOPOLE  ∫ρ  ·  ‖c‖²', value: '—', sub: 'the L = 0 slot in closed form, against the norm it must equal' });
    ui.fldPhi = readout({ label: 'Φ_e(0)  at the nucleus', value: '—', sub: 'a.u. · volts (27.211386 V per a.u.)' });
    ui.fldE = readout({ label: '|E|  at (0, 0, 1) a₀', value: '—', sub: 'a.u. · V/m (5.1422e11 V/m per a.u.)' });
    ui.fldB = readout({ label: 'B  nucleus  ·  1 a₀ on the axis', value: '—', cls: 'wide', sub: 'tesla — a quadrature, and off the axis it is not certified: never drawn' });
    for (const r of [ui.fldQ, ui.fldPhi, ui.fldE, ui.fldB]) rr.appendChild(r.root);
    el('div', 'note', wFld.body).innerHTML = '<b>EXACT ANALYTIC.</b> ρ = |ψ|² is expanded on Y<sub>LM</sub> by exact Gaunt coefficients and <b>Poisson is solved in closed form</b>, slot by slot (finite polynomials × e<sup>−βr</sup> through the incomplete Γ functions), so Φ = Z/r + Φ<sub>e</sub>, <b>E = −∇Φ</b> and the probability current <b>j = Im(ψ*∇ψ)</b> are analytic — this window only samples them. <b>NUMERICAL:</b> the equipotentials are marching squares with a secant polish, the field lines RK4 on the unit tangent of the in-plane projection, and <b>B</b> is a quadrature. <b>B off the axis is NOT certified, so it is never drawn</b> — only the two axis numbers are printed (2p₊1: −0.521534 T at the nucleus, −0.429533 T at 1 a₀). The plane is cut through the nucleus facing the camera when the slice is built and then only re-projected, so orbiting shows you that same slice from a new angle. The closed form is <b>hydrogenic</b>: under any other Hamiltonian this window stands down.';
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
  /** is the window entitled to draw?  live, open, hydrogenic, position space, and no molecule holding the field */
  function fieldOn() {
    return live(wFld) && !wFld.root.classList.contains('closed') && space === 'x' && getHamiltonian().id === 'hydrogen' && !sturm.P
      && !(molecule && molecule.on) && !(helium && helium.on) && !(h2 && h2.on);
  }

  // WIGNER — the one joint object of position and momentum, cut through the axis; a niche window: it ships CLOSED
  const wWig = device({ id: 'wigner', eyebrow: 'WIGNER', title: 'PHASE SPACE · THE <m>(z, p_z)</m> SLICE', status: 'numerical · a slice, not a marginal' });
  rack.appendChild(wWig.root); wWig.root.classList.add('closed');                // reopened from the + at the top of the rack
  const wignerView = createWigner(wWig.body, { repaint() { schedule(TIER.PRESENT); } });

  // RADIATION — what the prepared pair would radiate, and the shape of its far field; also CLOSED
  const wRad = device({ id: 'radiation', eyebrow: 'RADIATION', title: 'THE DIPOLE · SPONTANEOUS EMISSION · THE FAR FIELD', status: 'exact matrix elements · classical far field' });
  rack.appendChild(wRad.root); wRad.root.classList.add('closed');
  const radiationView = createRadiation(wRad.body, { repaint() { schedule(TIER.PRESENT); }, ab: () => __LW_hooks.ab });
  const WIG_OK = 'numerical · a slice, not a marginal', RAD_OK = 'exact matrix elements · classical far field';
  Object.assign(READERS, { spectrum: wSpec, shadow: wSh, orbit: wOrb, dynamics: wDyn, slice: wSlice, qcd: wQCD, atoms: wAtoms, wigner: wWig, radiation: wRad, calculus: wCalc });   // the windows the READER LAW may park (never MOLECULE — it steps nuclei — nor METERS, which shows the governor)
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
    const play = el('button', 'tbtn play', T, '▶'); play.type = 'button'; play.title = 'play / pause  (space) — one press, two clocks: ψ and, while MOD is on, the modulation'; play.setAttribute('aria-label', 'play or pause'); play.setAttribute('aria-pressed', 'false');
    /* ── WAVE 65 · THE MOD ARM, BESIDE THE PLAY BUTTON ────────────────────────────────────────
     * Josh: "the play/pause button should have a small MOD button that glows on or off."  ONE
     * button covers both of the playheads he named, because `#transport` IS one element in two
     * placements — the card `dockTransport()` puts in the rack, and the pill it moves to the stage.
     * It is `.tbtn` so it keeps the 44-px seat every other transport button has, with `.modb`
     * narrowing the INK and nothing else (the density law: grow the seat, never the mark), and it
     * glows in ACCENT B because modulation is a RELATIONSHIP — the same colour the ⤢ lamp beside it
     * already lights, and the same colour a held dial wears out in the rack. */
    const modB = el('button', 'tbtn modb', T, 'MOD'); modB.type = 'button';
    modB.setAttribute('aria-label', 'modulation on or off');
    modB.setAttribute('aria-pressed', 'true');
    modB.title = 'MOD (m) — when it glows, the modulation is live and every routed control moves; off, the rack is inert and every one of them sits on the number your hand left it on. SPACE is one key for both clocks: it plays and pauses ψ and the modulation together, and they stay two clocks (an LFO can hold the physics RATE, so the RATE cannot say how fast the LFO runs). What a resume DOES is the source’s own chips: ANCH holds the curve where the pause caught it, TRIG starts it over, BPM jumps back to the note boundary just passed';
    modB.addEventListener('click', () => setModArm(!modArm));
    ui.modB = modB;
    /* ══ WAVE 106 · THE REWIND MARK IS DRAWN NOW (Josh: "iPad is showing emojis for that icon") ═══
       It was the literal character U+23EE with no U+FE0E after it, and U+23EE carries EMOJI
       PRESENTATION by default — so iOS is not misbehaving, it is following the standard, substituting
       its colour glyph and ignoring the button's `color` entirely.  A variation selector would silence
       it, but this repo already ruled on that class of bug in kit.js — "which font the device resolves
       … iOS substitutes a COLOUR emoji for several of them" — and in STYLE-LOCK: "if a mark must be
       reliable, it has to be a drawing."  So it is a drawing, on the plugin's own SVG_PLAY geometry
       (24-box, currentColor, 14 px, round joins) so it sits at the weight of its neighbours: the bar
       and the triangle of a skip-to-start.  `currentColor` means it also follows the accent the other
       transport marks follow, which the emoji never could. */
    const SVG_REWIND = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" style="width:13px;height:13px;display:block;margin:auto"><rect x="5" y="5" width="2.6" height="14" rx="1.1"/><polygon points="20 5 20 19 9.5 12 20 5"/></svg>';
    const rst = el('button', 'tbtn', T); rst.type = 'button'; rst.innerHTML = SVG_REWIND; rst.title = 't → 0  (home)'; rst.setAttribute('aria-label', 'back to t = 0');
    const sm = el('button', 'tbtn', T, '‹'); sm.type = 'button'; sm.title = 'step back  (←)'; sm.setAttribute('aria-label', 'step back');
    const sp = el('button', 'tbtn', T, '›'); sp.type = 'button'; sp.title = 'step forward  (→)'; sp.setAttribute('aria-label', 'step forward');
    ui.scrub = fader({ label: 'SCRUB  t / window', min: 0, max: 1, value: 0, fmt: (v) => (v * clock.window).toFixed(2) + ' a.u.',
      onInput: (v) => { clock.scrub(v * clock.window + laps() * clock.window); schedule(TIER.EVOLVE); } });
    T.appendChild(ui.scrub.root);
    ui.rateKnob = knob({ label: 'RATE a.u./s', min: 0.1, max: 3000, value: 4, log: true, fmt: (v) => v >= 100 ? v.toFixed(0) : v.toFixed(1), onInput: (v) => { if (modHand('transport.rate', v)) return; clock.setRate(v); } });
    T.appendChild(ui.rateKnob.root);
    const tro = readout({ label: 't  a.u.  (lap)', value: '0.00' });
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
    let periodVersion = -1, lastPeriod = null, periodCostMs = 0, periodSettling = false, periodPending = null;
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
      if (!force && lastPeriod && periodCostMs > 8 && (pointerHeld || rotDriving())) { periodSettling = true; return lastPeriod; }
      const key = keyNow();
      if (reg.field.Fz !== 0) { Object.assign(pk, key); periodVersion = reg.version; periodCostMs = 0; periodSettling = false; lastPeriod = { exact: false, stark: true, T: 0 }; return lastPeriod; }
      if (reg.transition) { Object.assign(pk, key); periodVersion = reg.version; periodCostMs = 0; periodSettling = false; lastPeriod = { exact: false, mix: true, T: 0 }; return lastPeriod; }
      const Es = periodEnergies();          // W-STURMIAN: the OCCUPIED eigenvalues (populations > 1e-6), never the labels' ⟨H⟩ — and wave 58 hands the SAME expression to capture.js
      if (!force && scan.ok) {
        /* THE FRAME PATH (wave 45): the scan runs in the maths worker and the readout says it is settling until the
           answer lands — a BOX bow populates 56 incommensurate well energies and the scan measured 1.2 s on the first
           frame after the pointer lifted.  Forced readers (LW.period, ⟳, the digest) still scan here, synchronously. */
        if (!periodPending || !sameKey(periodPending, key)) {
          periodPending = key;
          scan.call({ op: 'period', energies: Array.from(Es), horizon: 2e4 }).then((r) => {
            if (!r || r.error) { periodPending = null; return; }
            if (periodPending !== key) return;                              // a later state: this answer is stale
            const P = Object.assign({}, r); delete P.id; delete P.op;
            lastPeriod = P; Object.assign(pk, key); periodVersion = key.v; periodCostMs = 0; periodSettling = false; periodPending = null;
            paintPeriod(); schedule(TIER.PRESENT);                           // paused, no frame would repaint the readout
          });
        }
        periodSettling = true; return lastPeriod;
      }
      const wasSettling = periodSettling;
      Object.assign(pk, key); periodVersion = reg.version; periodSettling = false; periodPending = null;
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
        if (dmax > 0 && P.T < 2 * Math.PI / dmax) return ['—', 'NO EXACT PERIOD (' + P.count + ' incommensurate eigenvalues of S⁻¹H) · no near-recurrence within the horizon: the best found is shorter than one turn of the fastest beat', 'warn'];
      }
      if (P.stark) return ['— (Stark)', 'no exact period under a static field: the Stark energies are not commensurate', 'warn'];
      if (P.mix) return ['— (transition)', 'the A ↔ B mix has its own clock: the Rabi period', 'warn'];
      if (P.stationary) return ['stationary', 'one energy: the density never changes', ''];
      if (P.exact) { const lap = Math.floor(clock.t / P.T), ph = clock.t - lap * P.T; return [fmtPeriod(P.T), 'EXACT · ' + P.count + ' energies, gcd ' + P.g.toPrecision(4) + ' Eh · lap ' + lap + ' · ' + (100 * ph / P.T).toFixed(0) + '% through' + src, 'ok']; }
      return ['≈ ' + fmtPeriod(P.T), 'NO EXACT PERIOD (incommensurate energies) · nearest recurrence within ' + (100 * P.err).toFixed(1) + '% of a beat' + src, 'warn'];
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
        tro.set(clock.t.toFixed(2) + (laps() ? '  (' + laps() + ')' : ''), on ? 'live' : '');
      } else if (!on || now - troWall >= 200) { troWall = now; tro.set(clock.t.toFixed(2) + (laps() ? '  (' + laps() + ')' : ''), on ? 'live' : ''); }
      if (ui.periodRo && (!on || keep.frames || now - periodWall >= 200)) { periodWall = now; const [v, sub, cls] = periodText(); ui.periodRo.set(v, cls); ui.periodRo.setSub(sub); paintPeriodFx(); }   // periodNow() is cached on the register's version; the scan itself runs off the frame (wave 45) or waits out a live gesture (wave 44).  WAVE 69: the formula rides the SAME cadence law — every frame with KEEP FRAMES on, 5 Hz without — so a moving number obeys the readout law the transport already owns rather than inventing a second one
    }
    setKeepFrames(keep.frames);                                // the shipped default: the bar disabled
    setModArm(modArm, { quiet: true });                        // wave 65: ONE writer paints the lamp, boot included
    return { update, stepDt };
  })();
  /* ── WAVE 65 · ONE CONTROL, TWO CLOCKS ──────────────────────────────────────────────────────
   * Josh: "Space bar will affect everything — play and pause for modulation plugin and λWAVES."
   * THE TWO CLOCKS STAY TWO, and that is a law from the MIR wave, not a convenience: physics time
   * is analytic and SET (`clock.scrub`, `clock.step`, a rate in a.u. per wall second), modulation
   * time is STEPPED in beats, and `transport.rate` is itself a modulation TARGET — merge them and
   * an LFO holding RATE would be deciding how fast its own modulator runs.  So this is one PRESS
   * over two clocks, never one clock: `clock` takes the wall stamp, `modHost.clock` takes the same
   * stamp through its own door, and each keeps its own arithmetic on the other side of it.
   *   THE MODULATION FOLLOWS THE PHYSICS ONLY WHILE MOD IS ARMED, and the plugin's own play button
   * is deliberately still its own — "two play heads are considered different" — so the modulation
   * can be stopped alone from the window and the next space re-joins the two.
   *   The refusal `setPlaying` already carries (`nothing-routed`) is honoured in silence here: a
   * transport with nothing routed has nothing to do, and ψ should still play. */
  function playMod(on) {
    if (!modHost || !modArm) return null;
    const w = performance.now() / 1000;
    const r = on ? modHost.clock.play(w) : modHost.clock.pause(w);
    if (modView) modView.sync();
    return r;
  }
  function togglePlay() {
    const want = !clock.playing;
    clock.toggle(performance.now() / 1000);
    playMod(want);
    schedule(TIER.EVOLVE); hideHint();
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
   *  to grow; the sentence lives on the MOD button and in the key sheet.  It never guesses: no exact
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
    const b1 = mk('exact', 'EXACT ANALYTIC · state · evolution · shadow');
    const b2 = mk('numerical', 'NUMERICAL · FIELD');
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
      const H = getHamiltonian(), who = reg.populated();
      const names = who.slice(0, 3).map((a) => H.labelOf(BASIS[a])).join(' + ') + (who.length > 3 ? ' + ' + (who.length - 3) + ' more' : '');
      const half = Number.isInteger(domain.half) ? domain.half : domain.half.toFixed(2);
      /* `quality.res`, NOT `field.resolution`: the governor drops the live grid under load and restores
         it on pause, entirely on its own, and a sentence carrying that number rewrote itself twice in
         three seconds of playback with nobody touching anything.  The chosen grid is the user's; the
         governed one is already on the NUMERICAL badge and in the PERFORMANCE readouts, where a number
         that moves by itself belongs. */
      const where = space === 'p' ? `momentum space, ${quality.res}³ grid` : `${quality.res}³ grid over ±${half} ${H.lengthUnit}`;
      const modes = `${rs.rendered} of ${rs.populated} modes, ${(rs.coveredFraction * 100).toFixed(0)} % of the norm` + (rs.masked ? ` (${rs.masked} muted)` : '');
      const law = reg.field.Fz !== 0 ? `${H.short} + F z, F = ${reg.field.Fz.toExponential(1)}, exact within each shell`
        : reg.field.Bz !== 0 ? `${H.short} + (B/2) L_z, B = ${reg.field.Bz.toFixed(4)}, diagonal and exact` : H.label;
      const when = clock.playing ? 'playing' : `paused at t = ${clock.t.toFixed(2)} a.u.`;
      return `${names ? names + '; ' : ''}${VIEW_SAY[mat.view] || VIEW_NAMES[mat.view]}, drawn as ${STYLE_NAMES[mat.style]}; ${where}; ${modes}; ${law}; ${when}`;
    }
    function update() {
      const f = reg.field.Fz !== 0 ? `STARK F = ${reg.field.Fz.toExponential(1)} · EXACT WITHIN EACH SHELL (F ≪ ${reg.fieldValidUpTo().toExponential(1)})`
        : reg.field.Bz !== 0 ? `ZEEMAN B = ${reg.field.Bz.toFixed(4)} · exact` : '';
      if (f !== lastF) { lastF = f; b4.hidden = !f; b4.lastChild.textContent = f; b4.className = 'badge ' + (reg.field.Fz !== 0 ? 'warn' : 'exact'); }
      b1.lastChild.textContent = reg.field.Fz !== 0 ? 'EXACT ANALYTIC · state · shadow (evolution: per shell)' : 'EXACT ANALYTIC · state · evolution · shadow';
      if (ui.fieldRo) {
        ui.fieldRo.set(reg.field.Fz !== 0 ? 'H₀ + F z' : reg.field.Bz !== 0 ? 'H₀ + (B/2)L_z' : 'H₀ (bare Coulomb)', reg.field.Fz !== 0 ? 'warn' : reg.field.Bz !== 0 ? 'live' : '');
        ui.fieldRo.setSub(reg.field.Fz !== 0 ? `within-shell exact · needs F ≪ ${reg.fieldValidUpTo().toExponential(1)}` : reg.field.Bz !== 0 ? 'diagonal: exact, no caveat' : 'the register\'s own Hamiltonian');
      }
      const rs = reg.renderSet(RENDER_CAP);
      const t2 = field.ok ? `NUMERICAL · FIELD ${field.resolution}³ · ±${Number.isInteger(domain.half) ? domain.half : domain.half.toFixed(2)} ${getHamiltonian().lengthUnit}${space === 'p' ? '⁻¹ · MOMENTUM' : ''} · f16` : 'NO FIELD · WebGPU unavailable';
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
    hideHint(); kepler.setBow(bow); schedule(TIER.PRESENT);
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
    if (!reg.populated().length) reg.set(0, 1, 0, clock.t);                              // an empty register: the bow conjures the ground state, then slaps it (Josh)
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
  /* the point on the plane through the origin ⟂ the view direction that sits under a screen position */
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
    if (ui.kepEcc) ui.kepEcc.setDisabled(dead);
    if (!o) { ui.kepRo.set(`n${n} not populated`, 'warn'); ui.kepRo.setSub('this shell carries less than 1 % of the norm — nothing to turn'); return; }
    if (o.isotropic) { ui.kepRo.set(`n${n} isotropic`, 'warn'); ui.kepRo.setSub('⟨L⟩ = ⟨K⟩ = 0: no normal, no node line, no perihelion — there is no axis to turn about'); return; }
    if (ui.kepEcc && !ui.kepEcc.root.classList.contains('drag')) ui.kepEcc.set(o.e);   // the eccentricity dial is RE-SEEDED from the fresh orbit, never trusted to remember: the orbit is derived and the dial is only its face
    const warn = o.coherence < 0.5;
    ui.kepRo.set(`a = ${o.a} a₀ · e = ${o.e.toFixed(3)} · coh ${o.coherence.toFixed(2)}`, warn ? 'warn' : 'ok');
    ui.kepRo.setSub(warn
      ? 'below coherence ½ NO ELLIPSE IS DRAWN (Round 11 A5) — but ⟨L⟩ and ⟨K⟩ are exact and so are the rotors, so the knobs stay live: the refusal is the picture\'s, not the operator\'s'
      : `L̂ = (${o.normal.map((v) => v.toFixed(2)).join(', ')}) · û = (${o.u.map((v) => v.toFixed(2)).join(', ')}) · the rotors turn EVERY populated shell; this shell supplies the axes`);
  }
  let kdrag = null;
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
  /** entering the BOX launches the gas at once (Josh: "let that thang bounce") */
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
    if (!reg.populated().length && getHamiltonian().id !== 'well') { reg.set(0, 1, 0, clock.t); }   // an empty box: the bow (or SLAP) conjures the ground state, then slaps it (Josh)
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
  /* ══ WAVE 55 · THE FLOATING WINDOW — the transport's dock, WIDENED to every card ═══════════════════
   * Josh: "I was hoping the modulation window was going to be a floating draggable regular window like a
   * VST plugin"; then, choosing the capability over the one-off, "yes! I was also thinking this idea
   * where any window can be taken off the rack."
   *
   * IT IS THE SAME MECHANISM AS `dockTransport`, NOT A SECOND ONE BESIDE IT.  The transport moves one
   * element between a rack card and the stage and remembers the slot it left (`dockIndex`); a floating
   * window moves a `.dev` between a rack and `#floats` and remembers the slot it left (`home`).  The
   * transport's own ⇱ is now this system's DOCK chip, its header carries the same `.dev-pop` every other
   * window carries, and pressing it calls `dockTransport()` — so the pill IS the transport's floating
   * mode and the lab has exactly ONE idea of what floating means.
   *
   * A FLOATING WINDOW IS NOT RESIZABLE, AND THAT IS THE DESIGN.  STYLE-LOCK: freedom outside, discipline
   * inside — the workspace rearranges, a window's interior does not.  A corner grip would reflow every
   * row in the card and cost exactly the muscle memory that law protects, so a floating window is as wide
   * as a rack card (`rackCardWidth()`, read from the rack's own content box) and is pixel-identical on
   * the stage and in the rack.  Josh asked for that in his own words: "Let it use the same dimensions or
   * layout as it."  The one thing that changes the box is COMPACT, and compact is a MODE, not a reflow.
   *
   * NOTHING HERE TOUCHES ψ.  Floating is chrome: no reader changes tier because its window left the rack,
   * `live(w)` still reads the same `.off` class, and the governor parks a floating window's reader on
   * exactly the law it parks a docked one on.
   */
  const floats = document.getElementById('floats');
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
    st.x = cx; st.y = cy; d.style.left = cx + 'px'; d.style.top = cy + 'px';
  }
  const raiseFloat = (d) => { if (!d || !d.classList.contains('floating')) return false; d.style.zIndex = String(++floatZ); return true; };
  const frontFloat = () => { let best = null, z = -1; if (floats) for (const d of floats.querySelectorAll('.dev')) { const q = +d.style.zIndex || 0; if (q > z) { z = q; best = d; } } return best; };
  /** the pop chip wears the act the NEXT press performs — off the rack, or back onto it */
  function popFace(d) {
    const b = d && d.querySelector('.dev-pop'); if (!b) return;
    if (d === wTr.root) {                                              // the transport's floating mode is the pill, and it has always had one
      chip(b, layout.docked ? 'north' : 'reopen', layout.docked ? 'undock the transport' : 'dock the transport');
      b.title = 'dock / undock the transport (T) — the pill at the foot of the stage is its floating mode';
      return;
    }
    const out = d.classList.contains('floating');
    chip(b, out ? 'reopen' : 'north', out ? 'dock this window back into the rack' : 'take this window off the rack');
    b.title = out ? 'dock this window back into the rack it came from — or drag it onto a rack and drop it exactly where you want it'
      : 'take this window off the rack — it floats over the stage, dragged by its header';
  }
  function railFace(d) {
    const b = d && d.querySelector('.dev-rail'); if (!b) return;
    const c = d.classList.contains('compact');
    chip(b, c ? 'expand' : 'compact', c ? 'give this window its full width back' : 'narrow this window to its rail');
    b.title = c ? 'FULL: give this floating window its full width back'
      : 'COMPACT: narrow this floating window to a rail that keeps its name, its power switch and its close';
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
      dev.classList.remove('closed'); const host = side === 'L' ? rackL : side === 'R' ? rack : dev.parentElement || rack;
      const first = host.querySelector('.dev'); if (first) host.insertBefore(dev, first); else host.appendChild(dev);
      enterWindow(dev);
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
        /* ══ WAVE 106 · A FAVOURITE REMEMBERS HOW IT LOOKED, NOT WHAT IT WAS SHOWING ═══════════════
           Josh: "favourite layouts should also store color, draw, and camera states but not the actual
           wave states."  That line draws the boundary exactly where it belongs.  A layout is a
           WORKSPACE — where the windows are, what the instrument looks like, where you are standing —
           and the STATE is the physics you are looking at.  Loading a workspace must never overwrite
           the register: you press a favourite to change your desk, not your experiment.
             SO: the palette, the two accents and the hue; the draw style, the dither, and the three
           display flags; and the camera's POSE and its FEEL.  NOT the coefficients, not the preset,
           not t, not the Hamiltonian, not the field — none of them are read here and none are written
           on the way back in.  The mode masks and the mute/solo set are the register's too, and stay.
             `v: 3`, and every key below is OPTIONAL on the way in, so a v1 (wave 54) or v2 (wave 55)
           favourite saved before today still loads and simply says nothing about the look — which is
           the truth about it. */
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
  const wTr = device({ id: 'transport', eyebrow: 'TRANSPORT', title: 'PLAY · SCRUB · RATE', status: 'docked' });
  wTr.root.hidden = true; (rackL || rack).appendChild(wTr.root);
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
    if (tr) { const b = el('button', 'dock-btn', tr); b.type = 'button'; /* wave 106: the ↗ the modulation button gave up lands here, and Josh's reason is the whole of it —
       "the icon for the button being replaced becomes the transporter transfer as that action makes more
       sense".  A north-east arrow on a door to a window was decoration; on the control that MOVES THIS
       BAR between the stage and the rack it is a direction. */
      chip(b, 'north', 'dock the transport into the rack'); b.title = 'move the transport between the stage and the rack (T)'; b.addEventListener('click', () => layout.dockTransport()); }
    /* ── WAVE 52 · THE MINIMISED MODE ────────────────────────────────────────────────────────────
     * The modulation window REPLACES the playhead, which means the playhead becomes its minimised
     * mode: the same pill, the same proportions, the same controls, with ⤢ EXPAND taking a seat in
     * the same flex row the ⇱ send-to-rack button already sits in — so the pill's own box does not
     * move (its width and height are the stylesheet's, and the scrub is the flex: 1 that absorbs).
     * There is deliberately NO bottom-left button (BASINS has one; Josh does not want it).  The
     * button LIGHTS in ACCENT B while modulation time is running, which is how a user who has shut
     * the window can still see that something is moving — the boundary law, made visible. */
    if (tr) {
      const e = el('button', 'mod-exp mod-logo', tr); e.type = 'button';
      /* WAVE 55: the mark is now the POP-OUT's, because that is literally what the press does — the pill's
         EXPAND opens modulation as a FLOATING window over the stage, not as a card in the rack. */
      /* ══ WAVE 106 · THE LOGO IS THE DOOR (Josh: "the logo as the button that activates the modulation
         window on the native playhead") ═══════════════════════════════════════════════════════════════
         The mark is CLONED from the masthead rather than redrawn, for the reason wave 48 already gives
         about the ABOUT face's copy: there is ONE nine-square mark in this lab and every copy of it is
         painted from the same nine samples of the wheel.  `paintMarks()` is told about this one below,
         so it turns with the accent like the other three and can never drift into being a fourth,
         stale logo.
           IT IS THE RIGHT MARK FOR THE ACT.  Modulation is the instrument's own motion — the thing the
         wheel colours everything else by — so opening it behind the house mark reads as "the lab's own
         machine", where an anonymous ↗ read as "some panel".  And the arrow is not wasted: it goes to
         the seat where its meaning is literal (below). */
      const lg = document.querySelector('#title .mark');
      if (lg) { const c = lg.cloneNode(true); c.removeAttribute('aria-hidden'); e.appendChild(c); }
      e.setAttribute('aria-label', 'open the modulation window');
      e.title = 'EXPAND the modulation window (this bar is its minimised mode) — it opens FLOATING over the stage: sources, macros and routes. It lights while modulation time is running, and closing the window does not stop it';
      e.addEventListener('click', () => layout.modulation.toggle());
      const spinLogo = (reverse) => { const mark = e.querySelector('.mark'); if (!mark) return; if (e._spin) e._spin.cancel(); e._spin = mark.animate([{ transform: 'rotate(0deg)' }, { transform: `rotate(${reverse ? -360 : 360}deg)` }], { duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 550, easing: 'ease-in-out' }); };
      e.addEventListener('pointerenter', () => spinLogo(false));
      e.addEventListener('pointerleave', () => spinLogo(true));
      ui.modExp = e;
    }
    /** THE EXPANSION.  Not layout.raise(): on a phone the transport is docked at the TOP of the one
     *  rack and must stay there, so the window opens directly BENEATH it rather than above it. */
    /* ── WAVE 64 · THE SAME THREE VERBS OVER A DIFFERENT WINDOW ─────────────────────────────────
     * Wave 55 made modulation the one window that DEFAULTS to the stage (Josh: "a floating
     * draggable regular window like a VST plugin").  It is not a default any more, it is what the
     * window IS: the ported artifact carries its own chrome and its own chip rail and lives in the
     * float layer from the first frame.  So `expand` shows it where it was left, `collapse` hides
     * it, and NEITHER reaches the clock, the model or the registry — the boundary law, unchanged.
     * On a PHONE it still shows: it is `position: fixed` and its own drag grip moves it, so the
     * wave-51 "one rack and nothing floats" rule has nothing to say about a window that was never
     * on the rack. */
    layout.modulation = {
      get open() { return !!(modView && modView.isOpen); },
      expand() {
        if (!modView) return false;
        modView.open(); modView.wake();
        document.body.classList.remove('rack-hidden');
        saveSettings(); schedule(TIER.PRESENT); return true;
      },
      /** COLLAPSE IS A LAYOUT ACT AND NOTHING ELSE.  The other project's one YELLOW was exactly
       *  this coupling, and we do not inherit it. */
      collapse() { if (!modView) return false; modView.close(); saveSettings(); schedule(TIER.PRESENT); return true; },
      toggle() { return layout.modulation.open ? layout.modulation.collapse() : layout.modulation.expand(); },
    };
    /* every card's notes fold behind ONE ⓘ in its header; the panel opens OUTSIDE the rack on the stage side; clicks cycle */
    const infoPop = el('div', 'info-pop glass', document.getElementById('lab')); infoPop.id = 'infoPop'; infoPop.hidden = true;
    let infoTimer = 0, infoCard = null, infoIdx = 0;
    function showInfo(card, idx) {
      if (document.body.classList.contains('window-info-off')) return;
      const notes = [...card.querySelectorAll('.note.hint-src')].filter((n) => n.textContent.trim()); if (!notes.length) return;   // a note with nothing in it is not a page (ATOMS' α-warning is empty until two shells are close)
      infoCard = card; infoIdx = ((idx % notes.length) + notes.length) % notes.length;
      infoPop.innerHTML = '';
      el('div', 'info-title', infoPop, card.querySelector('.dev-title').textContent);
      el('div', 'info-body', infoPop).innerHTML = notes[infoIdx].innerHTML;
      el('div', 'info-foot', infoPop, notes.length > 1 ? (infoIdx + 1) + ' / ' + notes.length + '  ·  ⓘ again for the next' : 'ⓘ');
      infoPop.hidden = false;
      const r = card.getBoundingClientRect(), left = card.parentElement === rackL, h = (card.parentElement || rack).getBoundingClientRect();   // the panel clears the RACK's edge, scrollbar included
      infoPop.style.top = Math.max(8, Math.min(window.innerHeight - infoPop.offsetHeight - 8, r.top)) + 'px';
      if (left) { infoPop.style.left = (h.right + 10) + 'px'; infoPop.style.right = 'auto'; } else { infoPop.style.right = (window.innerWidth - h.left + 10) + 'px'; infoPop.style.left = 'auto'; }
    }
    function hideInfo() { infoPop.hidden = true; infoCard = null; }
    infoPop.addEventListener('pointerenter', () => clearTimeout(infoTimer));
    infoPop.addEventListener('pointerleave', () => { infoTimer = setTimeout(hideInfo, 250); });
    for (const d of document.querySelectorAll('.dev')) {
      const notes = [...d.querySelectorAll('.note')]; if (!notes.length) continue;
      for (const n of notes) n.classList.add('hint-src');
      const util = d.querySelector('.dev-util'); if (!util) continue;
      const b = el('button', 'info-i', util); b.type = 'button'; chip(b, 'info', 'about this window'); b.title = notes.length > 1 ? 'about this window (' + notes.length + ' notes — click to cycle)' : 'about this window';
      util.insertBefore(b, util.firstChild);
      b.addEventListener('click', (e) => { e.stopPropagation(); if (infoCard === d) showInfo(d, infoIdx + 1); else showInfo(d, 0); });
      b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'touch') return; clearTimeout(infoTimer); if (infoCard !== d) showInfo(d, 0); });
      b.addEventListener('pointerleave', () => { infoTimer = setTimeout(hideInfo, 350); });
    }
    layout.showInfo = (id, idx = 0) => { const d = document.querySelector('.dev[data-id="' + id + '"]'); if (d) showInfo(d, idx); };
    layout.hideInfo = hideInfo;
    /* the logo opens FILE · EDIT · WINDOW */
    const title = document.getElementById('title');
    if (title) {
      const bar = el('nav', 'menubar', document.getElementById('lab')); bar.id = 'menubar'; bar.setAttribute('popover','manual');bar.hidden = true;
      const clickTrig = (label) => { const b = [...document.querySelectorAll('.trig')].find((t) => t.textContent.trim() === label); if (b) b.click(); };
      const runKey = (code) => { const a = ACTIONS.find((x) => x.key === code && !x.ctrl); if (a) a.run(); };
      const MENUS = {
        FILE: () => [['NEW project', () => layout.projects.requestFresh()], ['SAVE project' + (layout.projects.current ? '  ' + layout.projects.current : '…'), () => { if (layout.projects.current) layout.projects.save(); else { layout.notebook.open('projects'); } }], ['SAVE project AS…', () => layout.notebook.open('projects')], ['OPEN a project…', () => layout.notebook.open('projects')],
          ...layout.projects.recent().slice(0, 5).map((p) => ['↺  ' + p, () => layout.projects.requestOpen(p)]),
          ['EXPORT project (.json)', () => document.querySelector('.pj-export').click()], ['IMPORT project (.json)…', () => document.querySelector('.pj-import input').click()],
          ['SAVE the experiment (quick)', () => clickTrig('SAVE')], ['LOAD the last quick save', () => clickTrig('LOAD')], ['COPY as JSON', () => clickTrig('COPY JSON')],
          ['COPY a LINK to this state', () => clickTrig('COPY LINK'), null, 'a URL that reopens this exact state — the STATE card says how long it is and what format v1 could not carry (the MOLECULE panel and the MODULATION rack)']],
        EDIT: () => [['UNDO\t' + keyName(ACTIONS.find((x) => x.id === 'undo')), () => historyApi.undo(), () => !historyApi.canUndo], ['REDO\t' + keyName(ACTIONS.find((x) => x.id === 'redo')), () => historyApi.redo(), () => !historyApi.canRedo], ['PLAY / PAUSE\tSpace', () => runKey('Space')], ['NORMALIZE', () => clickTrig('NORMALIZE')], ['CLEAR the register', () => clickTrig('CLEAR')], ['RESET the view', () => clickTrig('RESET VIEW')], ['RESEED the particles\tctrl+R', () => runKey('KeyR')], ['RESET the key bindings', () => clickTrig('RESET KEYS')], ['SETTINGS…', () => layout.raise('settings')]],
        /* wave 106 · and INVERT is here too (Josh: "Also Invert in view as well").  It moved to the
           PALETTE window this wave, which is where it belongs by meaning — but it is also a thing you
           reach for mid-look, and VIEW is the menu you are already in when you do.  One state, two
           doors: the switch and this item read and write the same `mat.invert`. */
        VIEW: () => [['INVERT the cloud \u2014 ink, not light', () => LW.setInvert(!mat.invert), null, 'draw the cloud as ink rather than light; the transfer is inverted and ψ is not touched'], ['ρ = |ψ|²  density', () => LW.setView('density')], ['arg ψ  phase\tV cycles', () => LW.setView('phase')], ['Re ψ', () => LW.setView('real')], ['Im ψ', () => LW.setView('imag')], ['Δρ  difference', () => LW.setView('diff')], ['Re + Im  superposed (heuristic)', () => LW.setView('reim')],
          ['— style: CLOUD\tC cycles', () => LW.setStyle('cloud')], ['— style: SOLID', () => LW.setStyle('solid')], ['— style: GRAIN', () => LW.setStyle('grain')], ['— style: SIGNED', () => LW.setStyle('signed')], ['— style: BANDS', () => LW.setStyle('bands')],
          ['STAGE CAPTIONS  on / off', () => ui.capSw && ui.capSw.root.click()], ['STATUS TAGS  on / off', () => ui.badgesSw && ui.badgesSw.root.click()], ['HINT BAR  on / off', () => ui.hintSw && ui.hintSw.root.click()], ['HIDE the interface\tH', () => runKey('KeyH')], ['FULL SCREEN / back\tF', () => toggleFullscreen()]],
        /* wave 106 · MORE THAN ONE ROAD TO THE SAME ROOM (Josh: "I want multiple routes to the
           modulation window", and "Can Modulation be reached via View or Window in the menu bar?").
           It is FIRST in WINDOW because it is the only window in the lab that is not a rack card — it
           floats over the stage and its minimised mode is the playhead — so a reader looking for it in
           the rack list would not find it.  Three doors now: the logo on the playhead, M, and here. */
        WINDOW: () => [['MODULATION\tM', () => layout.modulation.toggle()], ['NOTEBOOK\tJ', () => layout.notebook.toggle()], ['HIDE / SHOW the rack\tB', () => layout.toggleRack()], ['DOCK / UNDOCK the transport\tT', () => layout.dockTransport()], ['HIDE the interface\tH', () => runKey('KeyH')], ['SHOW / HIDE every note\tN', () => runKey('KeyN')], ['THEME · LIGHT', () => __LW_hooks.setTheme && __LW_hooks.setTheme('light')], ['THEME · DARK', () => __LW_hooks.setTheme && __LW_hooks.setTheme('dark')], ['THEME · SYSTEM', () => __LW_hooks.setTheme && __LW_hooks.setTheme('system')],
          ...[...document.querySelectorAll('.dev')].map((d) => [(d.classList.contains('closed') ? '⊕  ' : '↑  ') + d.querySelector('.dev-eyebrow').textContent + '  ·  ' + d.querySelector('.dev-title').textContent, () => layout.raise(d.dataset.id), null, winHint(d)])],
        /* WAVE 55 · RIDER A (board #54).  Josh: "in the menu should just say 'ABOUT λWAVES', SETTINGS, and
           Notebook is already in window. We don't need links to report and other."  So: TWO items.  NOTEBOOK
           duplicated the WINDOW menu; LICENCES merely opened this same ABOUT face, which already names the
           licence in its text; and the REPORT.md item opened a SITE-ROOT path — one of the three that 404 the
           moment `lab/` is deployed as the Cloudflare Pages root, which is why the ABOUT face lost its three
           file links in the same edit.  Naming a licence is enough; linking a file that will not be there is not. */
        ABOUT: () => [['ABOUT λWAVES', () => layout.notebook.open('about')], ['SETTINGS…', () => layout.raise('settings')]],
      };
      let openList = null;
      const closeLists = () => { for (const l of bar.querySelectorAll('.mb-list')) l.hidden = true; for (const b of bar.querySelectorAll('.mb-btn')) b.setAttribute('aria-expanded', 'false'); openList = null; };
      /* WAVE 53 (Josh, board #45): "the λWAVES logo should also stop spinning and instead should have the logo
         slightly enlarge when mouse over and back to normal when file, edit, view, etc. disappear."  The enlarged
         state therefore belongs to THE CHIPS BEING UP, not to the pointer — so `bar.hidden` and the class are
         written in ONE place and can never disagree.  1.04 over --t-fast (120 ms, the press rung) on `ease`. */
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
      /* ⚠ WAVE 106 · ON A PHONE THE BAR IS FURNITURE (Josh: "Always have the 'File, Edit, View' menu
         bar be showing in the phone/android version and the hide rack button makes it disappear").
           Two different things were wrong.  The bar is hidden by DEFAULT on every platform — `bar.hidden
         = true` at construction — and its two openers are a hover, which is dead on touch by its own
         guard, and a tap on the λ logo.  So on Android the only road to FILE/EDIT/VIEW was knowing to
         tap the wordmark.  And the ROOT of the "hide rack button makes it disappear" report is not the
         hide-rack button at all: `#rackToggle` lives in neither `#menubar` nor `#title`, so the
         document-level outside-press dismiss below closes the bar on its `pointerdown`, BEFORE its own
         click handler ever runs.  Nothing in either stylesheet ties `body.rack-hidden` to the bar.
           Guarding HERE fixes every path at once, because wave 53 made this the single point of truth
         for the open state — the outside-press, the 400 ms hover-out, the logo's toggle and Escape all
         come through this one function.  Desktop is untouched, so B126's Escape law still holds. */
      const barShown = (v) => { const want = document.body.classList.contains('phone') ? true : !!v;
        bar.hidden = !want;if(want&&!bar.matches(':popover-open'))bar.showPopover();else if(!want&&bar.matches(':popover-open'))bar.hidePopover(); title.classList.toggle('menu-open', want); title.setAttribute('aria-expanded', String(want)); };
      for (const name of Object.keys(MENUS)) {
        const grp = el('div', 'mb-group', bar);
        const btn = el('button', 'mb-btn', grp, name); btn.type = 'button';
        btn.setAttribute('aria-haspopup', 'true'); btn.setAttribute('aria-expanded', 'false');
        const list = el('div', 'mb-list', grp); list.hidden = true;
        const fill = () => { list.innerHTML = ''; for (const [label, run, dis, hint] of MENUS[name]()) { const it = el('button', 'mb-item', list); const kk = label.split('\t'); el('span', 'mb-lbl', it, kk[0]); if (kk[1]) el('span', 'mb-key', it, kk[1]); it.type = 'button'; if (hint) it.title = hint; if (dis && dis()) it.disabled = true; it.addEventListener('click', (e) => { e.stopPropagation(); run(); closeLists(); barShown(false); }); } };
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
      /* wave 106: `#rackToggle` is excluded by name.  It is not part of the menu, so this handler
         treated pressing it as "the user pressed somewhere else" and shut the bar on pointerdown —
         which is exactly the disappearance Josh attributed to the hide-rack button.  Hiding the rack
         and closing the menus are two different acts and pressing one must not perform the other. */
      const rackToggleEl = () => document.getElementById('rackToggle');
      document.addEventListener('pointerdown', (e) => { const rt = rackToggleEl();
        if (!bar.hidden && !bar.contains(e.target) && !title.contains(e.target) && !(rt && rt.contains(e.target))) { closeLists(); barShown(false); } });
      layout.menu = { open: showBar, close: () => { closeLists(); barShown(false); }, get isOpen() { return !bar.hidden; },
        get scale() { return LOGO_SCALE; }, get enlarged() { return title.classList.contains('menu-open'); } };
    }
    /* ── '?' — A LIVE BINDINGS SHEET (wave 53, Josh, board #46: "? - shortcut key for keyboard binds (should also
     * show the dynamic current keyboard binding)").  It is BUILT ON EVERY OPEN out of the one rebindable table
     * (__LW_hooks.keys.actions) and formatted by the same keyName() the SETTINGS chips use, so a rebind made in
     * SETTINGS is on this sheet the instant it is made and there is no second list anywhere to go stale —
     * ANTI-PATTERN 6 is exactly that failure wearing a different hat.  '?' again or Escape closes it; the keydown
     * road it rides already refuses to fire inside an INPUT, TEXTAREA or SELECT, so it cannot fire while you type. */
    {
      const ks = el('div', 'glass', document.getElementById('lab')); ks.id = 'keysheet'; ks.hidden = true;
      ks.setAttribute('role', 'dialog'); ks.setAttribute('aria-label', 'keyboard bindings');
      const head = el('div', 'ks-head', ks);
      el('h3', '', head, 'KEYBOARD');
      const x = el('button', 'ks-close', head, '×'); x.type = 'button'; x.title = 'close (? or Esc)';
      const list = el('div', 'ks-list', ks);
      el('div', 'ks-note', ks, 'Read from the live binding table — rebind any of them in SETTINGS · KEYS and this sheet says so at once. Shift is the fine step for the stepping keys; keys never fire while you are typing.');
      const fill = () => {
        const K = __LW_hooks.keys; list.innerHTML = '';
        if (!K) return 0;
        for (const a of K.actions) {
          const row = el('div', 'ks-row', list); row.dataset.action = a.id;
          el('span', 'ks-label', row, a.label);
          el('span', 'ks-chip', row, K.name(a));
        }
        return K.actions.length;
      };
      const open = () => { fill(); ks.hidden = false; return true; };
      const close = () => { ks.hidden = true; return true; };
      /* ONE ROAD.  Every rebind already ends in ui.keysRefresh() (the SETTINGS chips' own repaint), so the sheet
         hangs off that rather than owning a second notification: a rebind made while the sheet is up lands on it
         in the same tick, and one made while it is down is picked up by the fill() that opening does. */
      const prevRefresh = ui.keysRefresh;
      ui.keysRefresh = () => { if (prevRefresh) prevRefresh(); if (!ks.hidden) fill(); };
      x.addEventListener('click', (e) => { e.stopPropagation(); close(); });
      layout.keysheet = { open, close, toggle() { return ks.hidden ? open() : close(); }, get isOpen() { return !ks.hidden; },
        /** what the SHEET is showing, read back out of the DOM — never out of the table it was built from */
        rows() { return [...list.querySelectorAll('.ks-row')].map((r) => ({ id: r.dataset.action, label: r.querySelector('.ks-label').textContent, key: r.querySelector('.ks-chip').textContent })); } };
    }

    /* ── WAVE 106 · THE KEYBOARD MANUAL, and why it is a second thing beside the sheet ──────────────
     * The '?' sheet above is a LIST you read; this is a PICTURE of the board you edit on — every bound
     * key lit in its own place, so "what is still free" is a glance rather than a search through forty
     * rows.  They are the same table underneath (__LW_hooks.keys) and neither owns a copy of it, which
     * is the whole of ANTI-PATTERN 6: the manual calls keys.bind() and keys.reset() and then re-reads
     * keys.actions, exactly as the SETTINGS chips do, so a rebind made in any of the three is on the
     * other two in the same tick.  Escape closes it, as it closes the sheet. */
    {
      const km = el('div', '', document.getElementById('lab')); km.id = 'keymap'; km.hidden = true;
      km.setAttribute('role', 'dialog'); km.setAttribute('aria-label', 'the keyboard, and every binding on it');
      let returnFocus = null;
      const man = createKeymap(km, {
        get actions() { return __LW_hooks.keys ? __LW_hooks.keys.actions : []; },
        bind(id, spec) { return __LW_hooks.keys.bind(id, spec); },
        reset() { return __LW_hooks.keys.reset(); }
      }, { onClose() {
        km.hidden = true;
        if (returnFocus && returnFocus.isConnected) returnFocus.focus();
      } });
      // The editor owns a second hidden root and its recording lifecycle. Showing only
      // the host left a blank modal and a key listener whose isOpen guard never passed.
      const open = () => { returnFocus = document.activeElement; km.hidden = false; man.open(); man.root.querySelector('button').focus(); return true; };
      const close = () => { man.close(); return false; };
      /* the same ONE ROAD the sheet rides: a rebind anywhere ends in ui.keysRefresh(), so the manual
         hangs off that rather than owning a second notification of its own. */
      const prevKR = ui.keysRefresh;
      ui.keysRefresh = () => { if (prevKR) prevKR(); if (!km.hidden) man.refresh(); };
      layout.keymap = { open, close, toggle() { return km.hidden ? open() : close(); }, get isOpen() { return !km.hidden; } };
      layout.keysheet = layout.keymap; document.getElementById('keysheet')?.remove();
    }
    /* the taxonomy on every card: INFO panels get ⧉ COPY; CONTROL and OTHER start folded */
    for (const d of document.querySelectorAll('.dev')) {
      const kind = KIND[d.dataset.id] || 'other'; d.dataset.kind = kind;
      if (kind === 'info' || d.dataset.id === 'field') { const util = d.querySelector('.dev-util'); const b = el('button', 'dev-copy', util, '⧉'); b.type = 'button'; b.title = 'copy this panel\'s digest (every readout and the module\'s table) as text'; b.setAttribute('aria-label', 'copy this panel\'s digest as text'); util.insertBefore(b, util.querySelector('.dev-fold')); b.addEventListener('click', (e) => { e.stopPropagation(); layout.copyDigest(d.dataset.id); }); }
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
        /* ── WAVE 103 · SHIFT-CLICK QUEUES, AND LETTING GO OPENS THE LOT ─────────────────────────
         * JOSH: "holding shift+clicking while choosing windows to add, can it hold down multiple
         * windows the moment the shift key is released so that it loads multiple windows at once?
         * And let it remember the order of which it was clicked, have a little masked number in a
         * filled circle."
         *   THE ORDER IS THE POINT, not a nicety: `layout.reopen` PREPENDS each window to the top of
         * its rack, so opening four in the order they were picked leaves them stacked in that order.
         * A set would have opened them in DOM order and quietly thrown the user's sequence away.
         *   A SECOND SHIFT-CLICK ON A QUEUED ITEM REMOVES IT and the rest renumber, because a queue
         * you cannot correct without closing the menu is a queue nobody trusts.
         *   THE RELEASE IS THE COMMIT, which is Josh's own word for it, and it is also the only edge
         * available: a plain click has to keep meaning "open this one now" for everybody who does not
         * know the shortcut exists.  Closing the menu any other way — Escape, an outside press, the
         * chip again — DISCARDS the queue rather than firing it, because none of those mean yes. */
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
          /* WAVE 104 · ALPHABETICAL, AND STARRED IF THE SAVED LAYOUT WANTS IT (Josh).
             ORDER: the list used to come out in DOM order, which is the order the windows were BUILT
             in — a fact about rack.js and about nothing the reader can see.  A catalogue you scan for
             a name is sorted by that name.  `localeCompare` rather than `<`, because these are display
             strings and a byte comparison is not an alphabet.
             THE STAR: which closed windows belong to the arrangement this browser last saved, so the
             way back to a favourite is visible from the one menu that can restore it.  The NEWEST
             slot is the one consulted — "the current favourite" — and a window is starred only if that
             layout has it OPEN, since a layout that also had it closed is not asking for it back. */
          const favIds = (() => {
            const m = readSettings().layouts || {};
            let best = null, at = -1;
            for (const k of Object.keys(m)) { const L = m[k]; if (L && (L.at || 0) > at) { at = L.at || 0; best = L; } }
            if (!best || !Array.isArray(best.cards)) return null;
            return new Set(best.cards.filter((c) => !c.closed).map((c) => c.id));
          })();
          const nameOf = (d) => (d.querySelector('.dev-eyebrow').textContent || d.dataset.id || '').trim();
          const closed = [...document.querySelectorAll('.dev.closed')]
            .sort((a, b) => nameOf(a).localeCompare(nameOf(b), undefined, { sensitivity: 'base' }));
          if (!closed.length) el('div', 'rack-add-none', list, 'nothing is closed — × on a window closes it');
          for (const d of closed) {
            const it = el('button', 'mb-item', list, '⊕  ' + d.querySelector('.dev-eyebrow').textContent + '  ·  ' + d.querySelector('.dev-title').textContent);
            it.type = 'button'; it.dataset.win = d.dataset.id;
            if (favIds && favIds.has(d.dataset.id)) {
              const st = el('span', 'mb-fav', it, '★');
              st.title = 'this window is part of the favourite layout you saved last — reopening it puts that arrangement back together';
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
      /* ── FAVOURITE LAYOUTS (wave 54, board #48) ────────────────────────────────────────────────────────────
       * Josh: "New button underneath the 'add window' button … a short drop-down menu option for 'Save Layout'
       * and 'Load Layout'."  So it is one button in the same column, and its list is the SAME list the + uses —
       * a .glass panel of .mb-item buttons dismissed by the same outside-pointerdown — because a second menu
       * idiom in a rack this dense is a second thing to learn for nothing.
       * WHAT A LAYOUT IS, and what it is emphatically NOT.  It is the arrangement: which windows exist, in what
       * ORDER, in WHICH RACK, folded / closed / powered down, whether the transport is docked and the rack shown,
       * plus the ONE size a hand can set in this instrument (the notebook's — rack cards are sized by their
       * content, by law).  It is NOT the physics: no ψ, no clock, no register, no palette, no camera.  The gate
       * proves that by deranging the rack, loading a layout back, and asserting reg.digest() never moved.
       * NUMBERED, NOT NAMED, and the reason is that the alternative is worse: a name needs either a modal prompt
       * (a browser dialog, in an instrument that has spent fifty waves not being a web page) or a text field
       * inside the dropdown, which is the second menu idiom the paragraph above just refused.  Four slots, each
       * carrying an AUTO-DESCRIPTION — how many windows, which racks, the time it was taken — which is the
       * information a name would have carried anyway, and costs no new widget. */
      const favBtn = document.getElementById('rackFav'), favList = document.getElementById('rackFavList');
      if (favBtn && favList) {
        const draw = () => {
          favList.innerHTML = '';
          const saved = layout.layouts();
          const save = el('button', 'mb-item', favList, '☆  SAVE LAYOUT' + (saved.length >= LAYOUT_SLOTS ? '  ·  replaces the oldest' : ''));
          save.type = 'button'; save.title = 'record this arrangement of windows — the order, the rack, folded / closed / off, the dock and the notebook\u2019s size. Never the state';
          save.addEventListener('click', (ev) => { ev.stopPropagation(); layout.saveLayout(); draw(); });
          el('div', 'rack-fav-head', favList, saved.length ? 'LOAD LAYOUT' : 'nothing saved yet');
          for (const L of saved) {
            const it = el('button', 'mb-item', favList, '⊙  ' + L.label);
            it.type = 'button'; it.title = 'put the rack back exactly as this layout left it — layout only, the state is untouched';
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
      titleIn.addEventListener('input', () => { try { localStorage.setItem(NB_TITLE, titleIn.value); } catch (e) {} });
      titleIn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (subIn) { subIn.hidden = false; subIn.focus(); subIn.select(); }
          else titleIn.blur();
        }
        if (e.key === 'ArrowDown' && subIn && !subIn.hidden) { e.preventDefault(); subIn.focus(); }
        e.stopPropagation();
      });
      if (subIn) {
        subIn.addEventListener('input', () => { try { localStorage.setItem(NB_SUBTITLE, subIn.value); } catch (e) {} });
        subIn.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); subIn.blur(); }
          else if (e.key === 'Backspace' && !subIn.value) { e.preventDefault(); subIn.hidden = true; try { localStorage.removeItem(NB_SUBTITLE); } catch (_) {} titleIn.focus(); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); titleIn.focus(); }
          e.stopPropagation();
        });
      }
      const renderMarkdown = renderNotebook;
      const CAP = { lines: 14, words: 140 };
      function capText(t) { const lines = t.split('\n'); let out = [], words = 0, cut = false; for (const ln of lines) { if (out.length >= CAP.lines) { cut = true; break; } const w = ln.trim() ? ln.trim().split(/\s+/).length : 0; if (words + w > CAP.words) { cut = true; break; } words += w; out.push(ln); } return { text: out.join('\n'), cut }; }
      function render(capped) { const src = capped ? capText(ta.value) : { text: ta.value, cut: false }; view.innerHTML = renderMarkdown(src.text || '*empty — press ◐ to write*') + (src.cut ? '<div class="nb-more">… the landing shows the first ' + CAP.lines + ' lines / ' + CAP.words + ' words · ◐ opens the whole notebook</div>' : ''); }
      const setMode = (m) => { nb.dataset.mode = m; if (m === 'view') render(false); else ta.focus(); };
      nb.dataset.mode = 'edit';
      nb.querySelector('.nb-mode').addEventListener('click', () => setMode(nb.dataset.mode === 'view' ? 'edit' : 'view'));
      ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setMode('view'); }
        if (!((e.ctrlKey || e.metaKey) && !e.altKey && e.code === 'KeyS')) e.stopPropagation(); });   // wave 106: the save keys pass; every other key is still the textarea's
      /* ── PROJECTS: sessions in folders, a recent list, the notebook as each one's landing page ── */
      const pjRead = () => { try { return readProjectCollection(localStorage, PJ_KEY); } catch (e) { pjStatus('projects unavailable — ' + e.message + '. Stored data was left untouched.'); return null; } };
      const pjWrite = (P) => { try { localStorage.setItem(PJ_KEY, JSON.stringify(P)); return true; } catch (e) { pjStatus('save failed — ' + e.message); return false; } };
      let pjCurrent = null, pjBaseline = null;
      /* The saved project is wider than undo: notebook, camera, palette, and modulation all
         belong here. Compare on a destructive act, never on a frame. Playback time and the
         quality governor are runtime; routed numbers compare their hand-owned bases so an
         LFO does not manufacture unsaved edits while the user listens. */
      function projectKey() {
        const data = serialize(), pr = data.presentation;
        delete data.experiment.t;
        delete pr.quality.autoScale;
        if (pr.domain.auto) delete pr.domain.half; // computed during rebuild, not a project edit
        const seats = {
          'observer.yaw': [pr.obs, 'yaw'], 'observer.pitch': [pr.obs, 'pitch'],
          'observer.dist': [pr.obs, 'dist'], 'observer.fov': [pr.obs, 'fov'],
          'material.exposure': [pr.mat, 'exposure'], 'material.softness': [pr.mat, 'softness'],
          'material.hue': [pr.mat, 'hueShift'], 'material.iso': [pr.mat, 'iso'],
          'material.grain': [pr.mat, 'grain'], 'material.knee': [pr.mat, 'knee'],
          'material.slice.pos': [pr.mat.slice, 'pos'], 'material.slice.thick': [pr.mat.slice, 'thick'],
          'transport.rate': [data.experiment, 'rate'],
          'state.rot.z': [pr.rotationRates, 'z'], 'state.stark.kz': [pr.rotationRates, 'kz'],
          'state.defect.l2': [pr.rotationRates, 'def'],
        };
        for (const [id, [obj, key]] of Object.entries(seats)) {
          const r = modHost && modHost.registry.state(id);
          if (r && r.modulated) obj[key] = r.base;
        }
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
          Object.defineProperty(P.items, path, { configurable: true, enumerable: true, writable: true, value: { path, folder, name, saved: now, opened: Object.hasOwn(P.items, path) ? P.items[path].opened : now, data: serialize(), notebook: { title: titleIn.value === 'NOTEBOOK' ? name : titleIn.value, subtitle: subIn ? subIn.value : '', text: ta.value } } });
          pjTouch(P, path); if (!pjWrite(P)) return false; pjCurrent = path; pjStatus('saved ' + path); if (titleIn.value === 'NOTEBOOK') { titleIn.value = name; } projectClean(); renderProjects(); return true;
        },
        open(path) {
          const P = pjRead(), it = P && Object.hasOwn(P.items, path) ? P.items[path] : null; if (!it) return false;
          /* wave 48: a project load rebuilds the register, the operator and the field — BUSY work */
          busy.n++; busySync(); try { restore(it.data); } finally { busy.n = Math.max(0, busy.n - 1); busySync(); }
          ta.value = it.notebook.text || ''; titleIn.value = it.notebook.title || it.name;
          if (subIn) { subIn.value = (it.notebook && it.notebook.subtitle) || ''; subIn.hidden = !subIn.value; }
          try { localStorage.setItem(NB_KEY, ta.value); localStorage.setItem(NB_TITLE, titleIn.value); if (subIn) localStorage.setItem(NB_SUBTITLE, subIn.value); } catch (e) {}
          it.opened = new Date().toISOString(); pjTouch(P, path); const remembered = pjWrite(P); pjCurrent = path; pjStatus('opened ' + path + (remembered ? '' : ' — recent history could not be saved'));
          projectClean(); show('notes'); nb.dataset.mode = 'view'; render(true);                      // the landing page: the notebook, capped
          return true;
        },
        remove(path) { const P = pjRead(); if (!P || !Object.hasOwn(P.items, path)) return false; delete P.items[path]; P.recent = (P.recent || []).filter((p) => p !== path); if (!pjWrite(P)) return false; if (pjCurrent === path) pjCurrent = null; renderProjects(); return true; },
        fresh() { reg.clear(); refSnapshot = null; touchState(); ta.value = ''; titleIn.value = 'NOTEBOOK'; if (subIn) { subIn.value = ''; subIn.hidden = true; } try { localStorage.setItem(NB_KEY, ''); localStorage.setItem(NB_TITLE, 'NOTEBOOK'); if (subIn) localStorage.setItem(NB_SUBTITLE, ''); } catch (e) {} pjCurrent = null; projectClean(); pjStatus('new'); show('notes'); setMode('edit'); return true; },
        exportText(path) { const P = pjRead(), it = P && Object.hasOwn(P.items, path || pjCurrent) ? P.items[path || pjCurrent] : null; return it ? JSON.stringify({ lambdawaves: 'project', version: 1, ...it }, null, 1) : null; },
        importText(text) { const path = storeProjectImport(text, () => JSON.parse(localStorage.getItem(PJ_KEY) || '{"items":{},"recent":[]}'), pjWrite); renderProjects(); return path; },
      };
      function renderProjects() {
        const list = nb.querySelector('.pj-list'); if (!list) return; list.innerHTML = '';
        const items = projects.list(); if (!items.length) { el('div', 'pj-none', list, 'no projects yet — name one above and SAVE AS'); return; }
        const byFolder = new Map(); for (const it of items) { const f = it.folder || '(root)'; if (!byFolder.has(f)) byFolder.set(f, []); byFolder.get(f).push(it); }
        /* ══ WAVE 106 · THE ROOTS ARE SHOWN (Josh: "when 'saving as', I want it to show all my folders
           I created aside from Root" … "Let's just show the roots then and it should be good") ══════
           A folder in this app is NOT an object — there is no folder registry, no create, no delete.
           It is the part of a project's path before the last slash, derived at save time and regrouped
           at render; "(root)" is a display literal invented on the line above and the stored value is
           the empty string.  So the honest reading of the ask is the one Josh landed on: SHOW the
           folders that exist rather than build a system that does not.
             Each chip writes its prefix into the name field, so SAVE AS puts the next project beside
           its siblings without anyone typing a path twice — and typing a new folder still makes one,
           exactly as before, because the field is still free text.  Nothing is stored for this: the
           chips ARE the folder list, re-derived on every render, so a folder disappears when its last
           project does, which is what "it was only ever a prefix" means. */
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
        if (!((e.ctrlKey || e.metaKey) && !e.altKey && e.code === 'KeyS')) e.stopPropagation(); });
      nb.querySelector('.pj-export').addEventListener('click', () => { const t = projects.exportText(); if (!t) { pjStatus('nothing to export — save first'); return; } const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'application/json' })); a.download = (pjCurrent || 'project').replace(/\//g, '__') + '.lambdawaves.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); });
      nb.querySelector('.pj-import input').addEventListener('change', async (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; try { if (f.size > MAX_PROJECT_BYTES) throw new Error('project file exceeds 8 MiB'); const p = projects.importText(await f.text()); pjStatus('imported ' + p); } catch (err) { pjStatus('import failed: ' + err.message); } e.target.value = ''; });
      nb.querySelector('.nb-projects-btn').addEventListener('click', () => { if (nb.dataset.face === 'projects') show('notes'); else { renderProjects(); const pp = nb.querySelector('.pj-path'); if (pp && pjCurrent) pp.value = pjCurrent; show('projects'); } });
      layout.projects = projects;
      const count = () => { const c = nb.querySelector('.nb-count'); if (c) c.textContent = ta.value.trim() ? ta.value.trim().split(/\s+/).length + ' words · kept in this browser' : 'empty · kept in this browser'; };
      ta.addEventListener('input', () => { try { localStorage.setItem(NB_KEY, ta.value); } catch (e) {} count(); });
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
        /* ⚠ WAVE 106 · THE PROJECTS FACE PAINTED ITSELF ONLY IF YOU ARRIVED BY THE ONE DOOR THAT
           PAINTED IT.  Josh: "I don't see all my projects".  It was not a scroll and not a cap —
           `renderProjects()` had four callers (save, remove, import, and the ▤ button) and NONE of
           them was this function, which is what every FILE-menu door goes through: OPEN a project…,
           SAVE project AS…, and SAVE with nothing open.  So after a reload the list was the empty
           `<div class="pj-list">` index.html ships and nothing else — not even the "no projects yet"
           line, because that is written inside `renderProjects` too.  Every project was there in
           storage the whole time and the window simply never asked.
             It is painted on the way IN now, which is the only moment that can be right: the list is
           read from localStorage on every render, so it also picks up a project saved in another tab. */
        if (face === 'projects') renderProjects();
        if (face === 'notes') ta.focus();
      };
      nb.querySelector('.nb-about').addEventListener('click', () => show(nb.dataset.face === 'about' ? 'notes' : 'about'));
      nb.querySelector('.nb-close').addEventListener('click', () => { nb.hidden = true; });
      nb.querySelector('.nb-copy').addEventListener('click', async () => { try { await navigator.clipboard.writeText(ta.value); } catch (e) {} });
      const dump = nb.querySelector('.nb-dump');
      const dumpText = () => faces.about.innerText.replace(/\n{3,}/g, '\n\n') + '\n\nsettings ' + JSON.stringify(readSettings()) + '\nfield ' + JSON.stringify({ resolution: field.resolution, half: field.half, adapter: field.adapterInfo || null }) + '\n' + navigator.userAgent;
      if (dump) dump.addEventListener('click', async () => { try { await navigator.clipboard.writeText(dumpText()); } catch (e) {} });
      /* THE RESIZE GRIP (wave 48, Josh: "Window in notebook/about currently not resizable on ipad").  CSS `resize`
         is a mouse-only affordance — WebKit and Gecko both ignore a touch pointer on that corner — so the corner gets
         an element of its own with real pointer events (pointerdown / move / up, so touch, pen and mouse all reach it).
         `resize: both` stays in lab.css for the desktop; both roads end in the same inline width/height, the same
         320 × 240 floor, and the same two numbers in the settings key.  The faces go on filling the glass by flex,
         which is the wave-24 law and is why sizing the SHELL is the whole job. */
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
          grip.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); const r = nb.getBoundingClientRect(); gd = { x: e.clientX, y: e.clientY, w: r.width, h: r.height };
            try { grip.setPointerCapture(e.pointerId); } catch (_) {} });   // a capture that cannot be taken (a synthesised pointer, a stale id) must not throw into the page — the drag works without it
          grip.addEventListener('pointermove', (e) => { if (!gd) return; e.preventDefault(); nbResize(gd.w + (e.clientX - gd.x), gd.h + (e.clientY - gd.y)); });
          const gend = (e) => { if (!gd) return; gd = null; if (e && e.pointerId !== undefined && grip.hasPointerCapture && grip.hasPointerCapture(e.pointerId)) grip.releasePointerCapture(e.pointerId); nbSaveSize(); };
          grip.addEventListener('pointerup', gend); grip.addEventListener('pointercancel', gend);
        }
        /* the desktop's own CSS resize ends in a pointerup over the notebook — the same two numbers, the same key */
        nb.addEventListener('pointerup', () => nbSaveSize());
        const S0 = readSettings(); if (typeof S0.nbW === 'number' && typeof S0.nbH === 'number') nbResize(S0.nbW, S0.nbH);
        layout.notebookResize = (w, h) => { const r = nbResize(w, h); nbSaveSize(); return r; };
      }
      let nd = null, nbMoved = false; const nhead = nb.querySelector('.nb-head');
      nhead.addEventListener('pointerdown', (e) => { if (e.target.closest('button, input')) return; const r = nb.getBoundingClientRect(); nd = { dx: e.clientX - r.left, dy: e.clientY - r.top }; nhead.setPointerCapture(e.pointerId); });
      nhead.addEventListener('pointermove', (e) => { if (!nd) return; nbMoved = true; nb.style.left = Math.max(0, Math.min(window.innerWidth - 80, e.clientX - nd.dx)) + 'px'; nb.style.top = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - nd.dy)) + 'px'; });
      const nend = () => { nd = null; }; nhead.addEventListener('pointerup', nend); nhead.addEventListener('pointercancel', nend);
      count();
      layout.notebook = { open: (face = 'notes') => show(face), close: () => { nb.hidden = true; }, toggle: () => { if (nb.hidden) show('notes'); else nb.hidden = true; }, get isOpen() { return !nb.hidden; }, get face() { return nb.dataset.face; }, moveTo(x, y) { nbMoved = true; nb.style.left = x + 'px'; nb.style.top = y + 'px'; }, dump: dumpText, get text() { return ta.value; }, set text(v) { ta.value = v; ta.dispatchEvent(new Event('input')); }, get title() { return titleIn.value; }, set title(v) { titleIn.value = v; titleIn.dispatchEvent(new Event('input')); }, get subtitle() { return subIn ? subIn.value : ''; }, set subtitle(v) { if (subIn) { subIn.value = v; subIn.hidden = !v; subIn.dispatchEvent(new Event('input')); } }, get mode() { return nb.dataset.mode; }, setMode, render: renderMarkdown, get html() { return view.innerHTML; } };
    }
    /* a hidden rack peeks when the pointer nears its column and goes when it leaves; the playhead the same, at the foot of the stage */
    /* wave 48: this handler ran getComputedStyle(documentElement) on EVERY pointer move — a style resolution of the
       root, on the pointer's thread, sixty times a second, to read a constant.  --rack-w changes with the viewport
       and with nothing else, so it is read once and on resize.  And a hidden INTERFACE peeks at nothing: the racks
       are display:none under H, so the handler leaves before it touches anything. */
    const peekLast = { x: -1, y: -1, armed: false, bar: false };
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
      const nearBar = e.clientY > H - 120 && Math.abs(e.clientX - W / 2) < 360;
      if (nearBar) { document.body.classList.add('transport-peek'); peekLast.bar = true; } else if (e.clientY < H - 200 && peekLast.bar) { document.body.classList.remove('transport-peek'); peekLast.bar = false; }
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
    const DRAG_FLOOR_MS = 32;                          // BASINS' own floor: a starved rAF must not freeze the window under the finger
    function coalesce(apply) {
      let raf = 0, tmr = 0, pend = null;
      const flush = () => {
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        if (tmr) { clearTimeout(tmr); tmr = 0; }
        if (!pend) return;
        const p = pend; pend = null; apply(p);
      };
      return { post(p) { pend = p; if (raf || tmr) return; raf = requestAnimationFrame(flush); tmr = setTimeout(flush, DRAG_FLOOR_MS); }, flush };
    }

    /* drag a card by its header to reorder the rack — or across to the other rack */
    let drag = null;
    const racks = [rack, rackL].filter(Boolean);
    /* the rects are read HERE, once a frame, and never in the handler.  They cannot be hoisted to
       pointerdown the way the float's rack rects can: each insertBefore moves every card below it, so the
       geometry this reads is the geometry this pass itself just wrote. */
    const reorderTo = (p) => {
      if (!drag) return;
      /* ⚠ WAVE 106 · A PHONE HAS ONE RACK, SO A REORDER HAS ONE DESTINATION.  This is the disappearance
         Josh reported — "Tapping on a window makes it disappear off the rack" — and it is not a pop-out
         at all.  The rule below reads "the left half of the window is the mirror rack", which is true on
         a desktop with two racks and false on a phone, where wave 51 folds everything into ONE rack and
         `#rackL` is `display: none !important` at the breakpoint (skin.css §5a).  A 500-px phone puts the
         rack at x 0…300, so the middle of any header is around x 150 — inside the left half — and eight
         pixels of thumb travel moved the card into a rack that cannot be seen.  Nothing was destroyed and
         nothing floated: it was reparented into a hidden element, which looks exactly like vanishing.
         MEASURED after the fix below: the card stays in `#rack`. */
      const want = (rackL && !document.body.classList.contains('phone') && p.x < window.innerWidth / 2) ? rackL : rack;          // which rack is under the pointer: the left half of the window is the mirror rack — and on a phone there is only one
      const cards = [...want.querySelectorAll('.dev')].filter((d) => d !== drag.card && !d.hidden);
      let ref = null; for (const c of cards) { const r = c.getBoundingClientRect(); if (p.y < r.top + r.height / 2) { ref = c; break; } }
      if (drag.card.parentElement !== want || ref !== drag.card.nextSibling) {
        /* WAVE 96 · THE SIBLINGS SLIDE (Josh: "make it have reorganizing animations like sliding
           around").  A DOM move is instantaneous and the eye loses which card went where, so this is
           FLIP — read every card's box FIRST, move the node, then put each one back where it was with
           a transform and let it transition to nothing.  It is the only way to animate a reorder that
           layout, not style, performed.  Cards mid-drag are skipped: the dragged one is under a
           finger and must not lag behind it. */
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
      /* ══ WAVE 96 · DRAGGING OFF THE RACK *IS* UNDOCKING ═══════════════════════════════════════
       * Josh: "dragging window off the rack should have it already be a free window, this makes the
       * button to dislodge it pointless."  The two gestures were already here and simply never met:
       * this handler reorders inside a rack, `fdrag` below moves a window that is already floating,
       * and the ONLY road between them was a chip.  The moment the pointer leaves every rack's
       * column the card is floated and the gesture is handed to the float drag mid-flight — same
       * finger, same pointer id, no release.  `dx/dy` are carried over so the window does not jump
       * under the hand, and `dy` is clamped to the header so a card grabbed by its foot does not
       * hang off the cursor. */
      measureRacks();
      /* ⚠ WAVE 106 · AND IT IS A DESKTOP GESTURE.  Josh, on Android: "Tapping on a window makes it
         disappear off the rack."  The chain is exact and every link is deliberate on its own:
         `measureRacks()` returns an EMPTY list on a phone by design (wave 51 gives a phone one rack
         and no floating), so `rackUnder()` answers null for every x — meaning "the pointer is off the
         rack" is TRUE at every pixel of the screen.  Six pixels of thumb travel on a header therefore
         ran this branch, and the header is `touch-action: none` inside a `pan-y` rack, so the browser
         hands JS every move rather than eating it as a scroll: on a phone six pixels is not a drag,
         it is a tap.
           Then `toggleFloat` short-circuits the TRANSPORT before its own phone guard is reached —
         `if (d === wTr.root) { layout.dockTransport(); return true; }` — and undocking sends the
         transport to the stage as a `mini` pill that `body.rack-hidden` (the phone's boot default)
         paints at opacity 0.  On a phone the transport is the FIRST header a thumb meets, at the top
         of the one rack.  So: tap a window, the window disappears.  Every other card was saved only
         because `popOut` refuses on a phone one call deeper.
           The gesture simply does not exist here — there is nowhere to drag a window TO — so on a
         phone the drag stays what it is on a phone: a reorder. */
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

  /* ── WAVE 51 · W-MOBILE: THE PHONE ────────────────────────────────────────────────────────────────
   * Josh: "MOBILE MODE (phones, vertical): one rack on the left; playhead docked at the top of the rack,
   * HIDEABLE NOT CLOSABLE; opaque buttons/knobs (waves under glass are jarring); lower-PPI optimisation;
   * the hide button becomes a toggle that FOLLOWS the rack (desktop's hide stays fixed); landscape still
   * one rack."
   *
   * The BREAKPOINT is the stylesheet's (isPhone() up top reads its sentinel).  Everything here is what a
   * media query cannot say: which rack a card is in, where the transport is docked, what the device-pixel
   * ceiling is, and which grid the field runs.  Crossing the breakpoint either way is REVERSIBLE — every
   * card that moved remembers the rack it came from — because a tablet in a stand rotates, and a desktop
   * window is resized, and neither should cost the user their layout.
   */
  const phone = { on: false, applied: false, hooked: false, DPR: 1.5, wasDocked: false, wasRes: 0, wasSteps: 0, wasScale: 0, wasCard: '', wasRackHidden: false, wasFrost: 'off', floats: null };
  function enterPhone() {
    /* wave 106: FILE · EDIT · VIEW is permanent furniture here (Josh), so it is placed on the way in.
       Deferred one frame because the placement reads the logo's rect and the phone crossing is still
       re-laying the racks around it on this one. */
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
    /* ── WAVE 59 · WHAT A SHARED LINK OPENS ONTO ─────────────────────────────────────────────────────
       On a 390 × 844 phone the rack is 300 px of 390 — 77 % of the width, 95 % of the height — and at this
       breakpoint it is OPAQUE (`--glass-opacity: 1`, above).  Nothing hid it at boot, and `#field` is a
       full-stage canvas, so the volume rendered CENTRED AT x ≈ 195, behind it: the 90-px strip down the
       right edge showed the far corner of the domain box, which is mostly empty.  Someone opening a shared
       link met a wall of two hundred controls with a sliver of static colour beside it.
       SO THE RACK STARTS HIDDEN HERE, and this is not "hide the rack on a phone": it is a DEFAULT, on
       exactly CARD STYLE's and phoneTr's pattern — a default is for a first visit, and pressing ◧ IS this
       browser saying which it wants (`saveSettings` derives `phoneRack` from the class; toggleRack saves).
       Josh's wave-51 instruction is untouched: the transport stays DOCKED at the top of the rack, so the ▶
       is exactly where he put it, one tap of the ◧ that sits in the thumb zone at the screen edge — and the
       touch legend (skin.css §phone) names both.  The volume is NOT offset: moving the camera to dodge the
       rack would be a lie about where the origin is, and a 90-px picture is not the fix for a 90-px picture. */
    phone.wasRackHidden = document.body.classList.contains('rack-hidden');   // the crossing is reversible in BOTH directions (wave 51's law)
    document.body.classList.toggle('rack-hidden', readSettings().phoneRack !== true);
    phone.wasCard = document.body.dataset.card;
    if (!cardChosen) applyCard('tinted');                             // OPAQUE by default: a live field under a knob is jarring on a phone — the seg (or LW.setCardStyle) still overrules it
    if (!phone.hooked) { phone.hooked = true; const fb = wTr.root.querySelector('.dev-fold'); if (fb) fb.addEventListener('click', () => saveSettings()); }
    /* THE LOW-POWER PATH, once per page.  Every one of these is a DEFAULT, not an override: a value this
       browser has SAID in SETTINGS still wins, exactly as CARD STYLE's default does. */
    if (!phone.applied) {
      phone.applied = true;
      field.setDprCap(phone.DPR);                                   // 3 physical pixels per CSS pixel of a ray-marched volume buys nothing at arm's length
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
    field.setDprCap(2);
    schedule(TIER.REBUILD);
  }
  function syncPhone() {
    const on = isPhone();
    if (on === phone.on) return on;
    phone.on = on; document.body.classList.toggle('phone', on);
    if (on) enterPhone(); else leavePhone();
    schedule(TIER.PRESENT);
    return on;
  }
  window.addEventListener('resize', syncPhone, { passive: true });
  window.addEventListener('orientationchange', syncPhone, { passive: true });
  layout.phone = { get on() { return phone.on; }, get dprCap() { return field.dprCap; }, get transportFolded() { return wTr.root.classList.contains('folded'); }, get parkedFloats() { return phone.floats ? Object.keys(phone.floats) : []; }, sync: syncPhone };

  /* ── canvas gestures: the observer ─────────────────────────────────────── */
  {
    const cv = dom.canvas, pts = new Map(); let pinch0 = 0, dist0 = 0;
    /* WAVE 57 · THE STAGE IS A FOCUS TARGET, AND ONLY FOR THE POINTER.  tabIndex = -1 means the canvas can
       HOLD focus but is not IN the tab sequence, so Tab never lands here by accident; a press on the stage
       puts focus here deliberately.  That is what makes the TAB rule below decidable — "are your hands on
       the world, or in the rack?" is a question the DOM can now answer. */
    cv.tabIndex = -1;
    /* ── THE FLING (wave 50; NEBULA's N1, N2) ──────────────────────────────────────────────────────────────────
     * A drag records its own POSE, timestamped — not the pixels — so the fine modifier, the pole clamp and a
     * pinch are already inside the numbers; on release the mean angular velocity over the last 80 ms IS the
     * fling, handed to the law as ω₀.  THE CLUTCH: Shift pressed or released mid-drag, or a second finger
     * landing, CLEARS the history, so the fling belongs only to the final generator.  Shift is the fine drag
     * here (a quarter of the gain, as it is everywhere else in the lab), and because the gain multiplies a
     * DELTA there is no pose jump when it changes hands mid-drag — the clutch costs the history, not the view. */
    const hist = []; let hShift = false, down = null, lastTap = 0, tapX = 0, tapY = 0;
    const histPush = (t) => { hist.push({ t, yaw: camTravel.yaw, pitch: camTravel.pitch }); while (hist.length > 2 && t - hist[0].t > CAM.HIST_MS) hist.shift(); };   // wave 54: the TRAVEL, not the pose — in FREE the pose has no yaw
    const histClear = () => { hist.length = 0; };
    /** the residual angular velocity of the last 80 ms, or nothing if the finger had already stopped */
    function releaseFling() {
      if (hist.length < 2) return 0;
      const b = hist[hist.length - 1], a = hist[0], dt = (b.t - a.t) / 1000;
      if (dt < 0.008 || performance.now() - b.t > CAM.STALE_MS) return 0;
      const wy = (b.yaw - a.yaw) / dt, wp = (b.pitch - a.pitch) / dt;
      return Math.hypot(wy, wp) < CAM.REST ? 0 : camera.fling(wy, wp);
    }
    cv.addEventListener('pointerdown', (e) => { try { cv.focus({ preventScroll: true }); } catch (_) {}      // wave 57: a hand on the stage IS the stage having focus
      if (e.ctrlKey && pts.size === 0) { e.preventDefault(); bowStart(e); return; }
      if (!e.shiftKey && pts.size === 0 && kepler.on) { const r = cv.getBoundingClientRect(); const h = kepler.hit(e.clientX - r.left, e.clientY - r.top); if (h) { e.preventDefault(); cv.setPointerCapture(e.pointerId); kdrag = { n: h.n, id: e.pointerId }; cv.classList.add('kdrag'); hideHint(); return; } }   // the KEPLER handle
      if (e.shiftKey && helium && helium.on && pts.size === 0) { e.preventDefault(); const r = cv.getBoundingClientRect(); helium.placeAt(unproject(e.clientX - r.left, e.clientY - r.top)); schedule(TIER.RECONSTRUCT); return; }   // helium: put electron 1 where you click
      try { cv.setPointerCapture(e.pointerId); } catch (_) {}          // a synthetic pointer (a test, an assistive device) must not abort the drag
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); dragging = true; cv.classList.add('drag'); hideHint();
      camera.stop(); histClear(); hShift = e.shiftKey; histPush(performance.now());   // the finger CLUTCHES: a live fling is caught, and this drag's history starts here
      down = { x: e.clientX, y: e.clientY, t: performance.now() };
      if (pts.size === 2) { histClear(); const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); dist0 = obs.dist; } });
    cv.addEventListener('pointermove', (e) => {
      if (kdrag) { const r = cv.getBoundingClientRect(); keplerDragTo(kdrag.n, e.clientX - r.left, e.clientY - r.top); schedule(TIER.RECONSTRUCT); return; }
      if (!pts.size && !bow && kepler.on) { const r = cv.getBoundingClientRect(); const h = kepler.hit(e.clientX - r.left, e.clientY - r.top); kepler.setHover(h); cv.classList.toggle('khover', !!h); }
      if (bow) { bowMove(e); return; }
      const p = pts.get(e.pointerId); if (!p) return;
      if (pts.size === 1) {
        if (e.shiftKey !== hShift) { hShift = e.shiftKey; histClear(); }              // THE CLUTCH (N2): the modifier changed hands mid-drag
        const k = e.shiftKey ? CAM.FINE : 1;                                          // SHIFT is the fine drag, as it is at every other control
        const G = CAM.SENS * camera.dragGain;                                         // DRAG GAIN scales the ONE sensitivity, in both control modes, and SHIFT still quarters it
        orbitBy(-(e.clientX - p.x) * G * k, (e.clientY - p.y) * G * k);
        histPush(performance.now());
      }
      p.x = e.clientX; p.y = e.clientY;
      if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch0 > 0) setDist(dist0 * pinch0 / Math.max(1, d)); }
      schedule(TIER.PRESENT);
    });
    const up = (e) => {
      if (kdrag) { kdrag = null; cv.classList.remove('kdrag'); return; }
      if (bow) { bowRelease(); return; }
      pts.delete(e.pointerId);
      if (pts.size) { histClear(); return; }                                          // one of two fingers left: the rest is not this gesture's fling
      dragging = false; cv.classList.remove('drag');
      releaseFling(); histClear();
      /* DOUBLE-TAP = RESET VIEW.  dblclick is a mouse affordance a touch pointer may never raise (and the iPad is
         a target), so the tap is counted here on the kit's own 320 ms — two taps that neither moved nor lingered. */
      const now = performance.now(), tap = down && now - down.t < 300 && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8;
      down = null;
      if (e.pointerType === 'touch' && tap) {
        if (now - lastTap < CAM.TAP_MS && Math.hypot(e.clientX - tapX, e.clientY - tapY) < 40) { lastTap = 0; resetView(); }
        else { lastTap = now; tapX = e.clientX; tapY = e.clientY; }
      }
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', (e) => { e.preventDefault(); setDist(obs.dist * Math.pow(1.1, e.deltaY / 100)); }, { passive: false });   // N8: EVERY modifier zooms, and none of them generates a rotational increment
    cv.addEventListener('dblclick', () => resetView());
    new ResizeObserver(() => schedule(TIER.PRESENT)).observe(cv);
  }
  function hideHint() { if (dom.hint) dom.hint.classList.add('gone'); }
  /* WAVE 59 · THE NINE SECONDS BELONG TO THE LAB, NOT TO THE MODAL.  This timer was armed here, ~700 lines
     above `warning.show()`, in the same synchronous tail of the same boot — so a first visitor who actually
     READ a 26-word notice about epilepsy pressed CONTINUE at eight seconds and watched the only legend in the
     app fade one second later, or pressed at ten and never saw it at all.  `warning.onAccept` is the exact
     hook (it fires immediately when the pane is down, so a returning visitor loses nothing) and it is armed
     at the FOOT of boot beside `armAutoplay()`, which is where ANTI-PATTERN 18 says this kind of thing goes.
     `hintTimer()` is called from there. */
  function hintTimer() { warning.onAccept(() => setTimeout(hideHint, 9000)); }
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
  /* ── WAVE 57 · THE TAB RULE, AND THE KEYBOARD TRAP IT CLOSES ─────────────────────────────────────────
   * Tab and Shift+Tab were bound as APPLICATION keys and `preventDefault()`ed on every match, with the
   * dispatcher exempting only INPUT / TEXTAREA / SELECT.  Every one of the 461 controls in this lab is a
   * <button> or a <div>, so KEYBOARD FOCUS COULD NOT MOVE AT ALL: reach the notebook textarea by pointer,
   * press Tab once to leave it, and you were stuck for the rest of the session.  That is WCAG 2.1.2 in
   * the literal sense, and no test in forty suites had ever pressed Tab, which is how it reached wave 56.
   *
   * THE RULE: **TAB CYCLES WINDOWS ONLY WHILE THE STAGE HAS FOCUS.  Everywhere else Tab is the browser's.**
   * The brief's own suggestion was "body or canvas", and this is deliberately narrower, because "body"
   * leaves the trap standing at the door: a keyboard user lands on <body> at load, and if that press
   * cycles windows there is no press that ever lets them INTO the interface.  Focus on the stage is a
   * thing a hand does — a press on the world, which is the case Josh actually uses the shortcut in, with
   * a mouse already on the canvas — and it is a state the user can leave with Escape.  So every state has
   * a keyboard way out: from the stage, Escape; from <body>, Tab walks in; from any control, Tab walks on.
   * The shortcut survives exactly where it was being used, and the trap does not survive anywhere.
   * The cost, stated: a keyboard user who has never touched the stage does not get the window cycle until
   * they press it once, or rebind the action (the table is rebindable and `Backquote` is free). */
  const stageHasFocus = () => document.activeElement === dom.canvas;
  const setAxis = (a) => { keyState.axis = a; wState.setStatus(keyHelp(), 'live'); };
  const setWhich = (w) => { keyState.which = w; wState.setStatus(keyHelp(), 'live'); };
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
    { id: 'yawL', label: 'camera yaw left', key: 'KeyA', run: (f) => { orbitBy(-0.12 * f, 0); schedule(TIER.PRESENT); } },
    { id: 'yawR', label: 'camera yaw right', key: 'KeyD', run: (f) => { orbitBy(0.12 * f, 0); schedule(TIER.PRESENT); } },
    { id: 'pitchUp', label: 'camera pitch up', key: 'KeyW', run: (f) => { orbitBy(0, 0.12 * f); schedule(TIER.PRESENT); } },
    { id: 'pitchDn', label: 'camera pitch down', key: 'KeyS', run: (f) => { orbitBy(0, -0.12 * f); schedule(TIER.PRESENT); } },
    { id: 'dollyIn', label: 'dolly in', key: 'KeyQ', run: (f) => { obs.dist = Math.max(1.2, obs.dist / (1 + 0.1 * f)); schedule(TIER.PRESENT); } },
    { id: 'dollyOut', label: 'dolly out', key: 'KeyE', run: (f) => { obs.dist = Math.min(8, obs.dist * (1 + 0.1 * f)); schedule(TIER.PRESENT); } },
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
    { id: 'reseed', label: 'reset the particles', key: 'KeyR', ctrl: true, run: () => { particles.setOn(true); particles.seed(160, reg, clock.t, domain.half); if (ui.partOn) ui.partOn.set(true); schedule(TIER.PRESENT); } },
    { id: 'keysheet', label: 'the keyboard — edit bindings', key: 'Slash', shift: true, run: () => layout.keymap.toggle() },
    { id: 'notes', label: 'show / hide every note', key: 'KeyN', run: () => document.body.classList.toggle('notes-open') },
    { id: 'rack', label: 'hide / show the rack', key: 'KeyB', run: () => layout.toggleRack() },
    { id: 'dock', label: 'dock / undock the transport', key: 'KeyT', run: () => layout.dockTransport() },
    /* WAVE 65 · the arm and the loop clock's lock.  Both are REBINDABLE and both appear in the key
       sheet, which is the visible seat neither could have inside the ported window: its timing bar is
       the artifact's and is not ours to grow (docs/ui/STYLE-LOCK.md, THE PORTED-WINDOW EXCEPTION). */
    /* ══ WAVE 106 · M OPENS THE WINDOW, Ctrl+Space ARMS IT (Josh: "'M' should activate the modulation
       window.  Ctrl+space can be the alternate modulation pause that replaces the current 'M'
       function") ═══════════════════════════════════════════════════════════════════════════════════
       The two acts had one key between them and the wrong one had it.  ARMING is a transport act — it
       decides whether Space plays one clock or two — so it belongs on a SPACE chord, where the hand
       already is; OPENING the window is a navigation act, and M is the letter of the thing it opens.
       Ctrl+Space is free: `matches()` makes a bare action refuse both Ctrl and Meta, so the transport's
       own Space is untouched, and no role owns Space since wave 88. */
    { id: 'modArm', label: 'MOD \u2014 the modulation on / off (space then plays both clocks)', key: 'Space', ctrl: true, run: () => setModArm(!modArm) },
    { id: 'modWin', label: 'the modulation window \u2014 open it, or close it again', key: 'KeyM', run: () => layout.modulation.toggle() },
    { id: 'modBar', label: 'lock the modulation loop clock: one bar = one recurrence of the density', key: 'KeyG', run: () => barLock() },
    { id: 'undo', label: 'undo the last edit to ψ or its law', key: 'KeyZ', ctrl: true, shift: false, run: () => historyApi.undo() },
    { id: 'redo', label: 'redo it (Ctrl+Y too)', key: 'KeyZ', ctrl: true, shift: true, run: () => historyApi.redo() },
    /* ══ WAVE 106 · THE TWO ACCELERATORS EVERY APPLICATION HAS (Josh: "the classic ctrl+s,
       ctrl+shift+s to save and save as") ══════════════════════════════════════════════════════════
       They cost nothing to add because this table already carries modifiers — `undo` above is the
       precedent, and `reseed` (Ctrl+R) already coexists with the bare `camReset` on the same code, so
       the bare `KeyS` that lowers the pitch is untouched: `matches()` makes a bare action REFUSE both
       Ctrl and Meta.  ⌘ is Ctrl here, so a Mac gets ⌘S for free.
         SAVE FALLS BACK TO SAVE AS, which is the behaviour of every editor: with a project open it
       writes it, and with nothing open it opens the face and lets you name one rather than inventing
       a filename.  That is the FILE menu's own expression, reused rather than re-derived.
         `preventDefault` happens in the matched-action branch below, so the browser's own Save dialog
       is cancelled — exactly as Ctrl+R already suppresses the reload. */
    { id: 'save', label: 'save the open project (asks for a name when none is open)', key: 'KeyS', ctrl: true, shift: false,
      run: () => { if (layout.projects && layout.projects.current) layout.projects.save(); else layout.notebook.open('projects'); } },
    { id: 'saveAs', label: 'save the project under a new name', key: 'KeyS', ctrl: true, shift: true,
      run: () => layout.notebook.open('projects') },
  ];
  const DEFAULT_KEYS = Object.fromEntries(ACTIONS.map((a) => [a.id, { key: a.key, ctrl: !!a.ctrl, alt: !!a.alt, shift: a.shift }]));
  try { const ov = JSON.parse(localStorage.getItem(LS_KEYS) || '{}'); for (const a of ACTIONS) if (ov[a.id]) Object.assign(a, ov[a.id]); } catch (_) {}
  function saveKeys() { try { const ov = {}; for (const a of ACTIONS) { const d = DEFAULT_KEYS[a.id]; if (a.key !== d.key || !!a.ctrl !== d.ctrl || !!a.alt !== d.alt || a.shift !== d.shift) ov[a.id] = { key: a.key, ctrl: !!a.ctrl, alt: !!a.alt, shift: a.shift }; } localStorage.setItem(LS_KEYS, JSON.stringify(ov)); } catch (_) {} }
  const MAC = /Mac|iPhone|iPad/.test((navigator.platform || '') + ' ' + (navigator.userAgent || ''));
  function keyName(a) { const k = a.key.replace(/^Key/, '').replace(/^Digit/, '').replace('Arrow', '').replace('BracketLeft', '[').replace('BracketRight', ']').replace('Slash', '/');
    const n = (a.ctrl ? (MAC ? '⌘+' : 'Ctrl+') : '') + (a.alt ? 'Alt+' : '') + (a.shift ? 'Shift+' : '') + k;
    return n === 'Shift+/' ? '?' : n; }                              // wave 53: the key Josh asked for is spelled '?', not 'Shift+/'
  /* ⌘ IS ctrl here (Josh's Ctrl/⌘+Z), and an action with no ctrl now refuses BOTH modifiers rather than only one */
  function matches(a, e) { return a.key === e.code && (a.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey)) && !!a.alt === e.altKey && (a.shift === undefined || !!a.shift === e.shiftKey); }
  let capturing = null;
  /* H (wave 48, Josh: "hide UI should be able to achieve the best framerate possible").  Hiding the interface used
     to hide it only from the EYE: every reader still ran, every readout still wrote its string, and the notebook's
     backdrop-filter was still recomposited on every frame the field changed.  `uiHidden` is now a real state — the
     loop skips the readers whose only product is a display:none card, and lab.css §48a/§48b take the panes out of
     paint.  What it does NOT skip is anything the STAGE shows (the field, the vortex, the particles, the Kepler
     handle, the field lines) or anything with physics behind it (the molecule and H₂ integrators), because those are
     the picture, not the chrome.  Coming back forces one full pass so nothing shows a stale number. */
  let uiHidden = false;
  function toggleUI() {
    const on = document.body.classList.toggle('ui-hidden');
    uiHidden = on;
    if (on) { ui.frameWas = mat.frame; ui.axisWas = mat.axis; mat.frame = false; mat.axis = false; }
    else { if (ui.frameWas !== undefined) mat.frame = ui.frameWas; if (ui.axisWas !== undefined) mat.axis = ui.axisWas; metersWall = 0; govVersion = -1; }
    if (ui.frameSw) ui.frameSw.set(mat.frame !== false); if (ui.axisSw) ui.axisSw.set(mat.axis !== false);
    schedule(TIER.REBUILD);
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
    /* ══ WAVE 88 · SPACE IS THE TRANSPORT'S AND NOBODY ELSE'S ═══════════════════════════════════
       JOSH, filed as an emergency: "currently if a 'last controlled' knob, dropdown or something in
       the native UI and plugin is used, the space bar will act as a 'click' or an activate.  Can you
       make it so that the space bar ONLY affects the playhead AND the modulation play."
         Wave 62's law — "a key belongs to the focused control when that control's role would use it"
       — is still right for every other key and stays.  SPACE IS THE EXCEPTION, and it has to be,
       because it is the one binding a player uses without looking: after any click anywhere in this
       lab something is focused, so the meaning of Space depended on what you last touched.  That is
       not a shortcut, it is a coin toss.
         ENTER IS NOW THE ACTIVATOR, alone, for both roles.  A keyboard user loses nothing they had —
       Enter has always activated a button and a radio — and Space stops being ambiguous. */
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
    /* WAVE 88 · A TEXT FIELD KEEPS SPACE — it is a character there and nothing else can be meant.
       A <select> DOES NOT: Josh named the dropdown, and a focused menu swallowing Space is the same
       coin toss as a focused button.  It keeps every other key (the type-ahead, the arrows, Enter). */
    /* ⚠ WAVE 106 · TWO KEYS ESCAPE A TEXT FIELD, AND ONLY TWO.  This return sat ABOVE every modifier
       test, so Ctrl+S pressed with the caret in the project's name field or the notebook — the two
       places a hand most plausibly is when it reaches for save — reached nobody at all.
         IT IS AN ALLOWLIST AND NOT A LOOSENING.  Ctrl+Z inside the notebook still does the TEXTAREA'S
       undo and not the register's, which is a law B59 drives with a real key
       (boot.browser-test.mjs: "Ctrl+Z on the body undoes and the same key inside the notebook's
       textarea does not") — only Ctrl+S and Ctrl+Shift+S are named, because only those two have no
       meaning inside a text field that a user could want instead. */
    const savesFromText = (e.ctrlKey || e.metaKey) && !e.altKey && e.code === 'KeyS';
    if ((tag === 'INPUT' || tag === 'TEXTAREA') && !savesFromText) return;
    if (tag === 'SELECT' && e.code !== 'Space') return;
    if (capturing) {                                               // the KEYS panel is listening for a new binding
      e.preventDefault();
      if (e.code === 'Escape') { capturing = null; if (ui.keysRefresh) ui.keysRefresh(); return; }
      if (['ControlLeft', 'ControlRight', 'ShiftLeft', 'ShiftRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight'].includes(e.code)) return;
      /* WAVE 68 · THE ONE KEY THIS PANEL MAY NOT GIVE AWAY.  Tab off the stage is the browser's (wave
         57's TAB RULE), so an action that is not stage-gated could take the binding and never fire —
         ANTI-PATTERN 7, a control that changes nothing, with a keyboard trap on the other side of it if
         the dispatcher's own guard were ever weakened.  Refused here, with the reason, rather than
         accepted and quietly disabled. */
      if (e.code === 'Tab' && !capturing.stage) { const lbl = capturing.label; capturing = null; if (ui.keysRefresh) ui.keysRefresh(); if (ui.keysSay) ui.keysSay('TAB is the browser’s way through the interface and cannot be bound to “' + lbl + '” — only the two window-cycle actions take it, and only while the stage has focus.'); return; }
      capturing.key = e.code; capturing.ctrl = e.ctrlKey; capturing.alt = e.altKey; if (capturing.shift !== undefined) capturing.shift = e.shiftKey;
      capturing = null; saveKeys(); if (ui.keysRefresh) ui.keysRefresh();
      return;
    }
    if (e.code === 'Escape' && layout.keymap && layout.keymap.isOpen) { e.preventDefault(); layout.keymap.close(); return; }   // wave 106: the manual closes on Escape, like the sheet
    if (e.code === 'Escape' && layout.keysheet && layout.keysheet.isOpen) { e.preventDefault(); layout.keysheet.close(); return; }   // wave 53: Escape closes the key sheet (and Escape is bound to nothing else)
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
     * runs next is the button's own native activation or the slider's own handler.
     * IT SITS BELOW `capturing` ON PURPOSE: a KEYS chip is a focused <button>, so above it no capture
     * could ever bind Space. */
    if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      const own = seatOf(e.target);                                // wave 68: roles, not tags — and never a control that will not act
      if (own && own.has(e.code)) return;
    }
    if (e.code === 'KeyY' && (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && history) { e.preventDefault(); historyApi.redo(); return; }   // the alias; the rebindable REDO is in the table
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
     *     backwards walking is the same promise.  (The KEYS panel also refuses the binding now, so
     *     nothing offers a chip that could never fire — but the trap is closed even if it did.) */
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
    bind(id, b) { const a = ACTIONS.find((x) => x.id === id); if (!a) return false; Object.assign(a, b); saveKeys(); if (ui.keysRefresh) ui.keysRefresh(); return true; },
    reset() { for (const a of ACTIONS) Object.assign(a, DEFAULT_KEYS[a.id]); try { localStorage.removeItem(LS_KEYS); } catch (_) {} if (ui.keysRefresh) ui.keysRefresh(); },
    name: keyName, capture(id) { capturing = ACTIONS.find((x) => x.id === id) || null; if (ui.keysRefresh) ui.keysRefresh(); }, get capturing() { return capturing ? capturing.id : null },
    /* WAVE 55: the frozen cycle, readable and re-freezable — the ONE road to a stated order rather than a
       gate re-deriving it from the DOM and calling its own guess the law. */
    get tabOrder() { return (tabOrder || []).map((d) => d.dataset.id); },
    resetTabs() { tabOrder = null; tabIdx = 0; return true; },
    toggleUI, cycleWindow,
  };

  /* ── persistence (§46): experiment and presentation, separately ───────── */
  function serialize() {
    const m = JSON.parse(JSON.stringify(mat)); delete m.bg; delete m.gamma; delete m.lightUI;   // the THEME is the browser's, never the project's (Josh)
    const H = getHamiltonian();
    /* WAVE 56 · THE TWO KEYS A LINK NEEDED.  `damping` (DRAG γ) lived only in the undo ring's own record and
       `paletteId` only in this browser's settings, so a state serialised for a LINK arrived at the reader with
       neither.  Both are additive: restore() reads neither, so a project written today opens on a build from
       yesterday and a project written yesterday opens here, unchanged in either direction — the link-open path
       below is what applies them, because a link is the one road on which they are somebody else's. */
    return { experiment: Object.assign(reg.serialize(clock.t), { rate: clock.rate, window: clock.window, damping: reg.damping }),
      presentation: { obs: { ...obs }, mat: m, quality: { ...quality }, domain: { ...domain }, shadow: shadowView.mode,
        paletteId: palette ? palette.id : palChoice,
        space, palette: palette ? { on: palette.on, stops: palette.stops.map((s) => ({ at: s.at, rgb: Array.from(s.rgb) })) } : null,
        hamiltonian: { id: H.id, Z: getZ(), atomZ: HAMILTONIANS.atom.Z, well: HAMILTONIANS.well.radius, gasBasis: gasAxial ? 'axial' : 'reg' },
        field: { overlay: fieldlines.overlay, lines: fieldlines.lines, source: fieldlines.source },
        wigner: { zmax: wignerView.zmax, pmax: wignerView.pmax },
        mo: moPanel ? moPanel.save() : null,
        rates: Array.from(rates), rotationRates: { ...rotRate }, sturmian: { on: sturm.on, lambda: sturm.lambda },
        modulation: modHost ? modRackStamped() : null } };
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
  function restoreModulation(o) {
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
    modHost.registry.restoreAll();
    const ok = modHost.model.deserialize(o || null);
    modHost.targets.sync();
    /* THE FILE HAS JUST MOVED THE INSTRUMENT.  restore() writes obs / mat / quality BEFORE it gets here,
       so the bases have to be re-read from them or the applyAll below hands every target back to the
       base the PREVIOUS project left in the registry — which is B52's camera, restored and then undone. */
    modSyncBases();
    modHost.clock.applyAll(true);
    if (modView) modView.rebuild();
    schedule(TIER.PRESENT);
    return ok;
  }
  function save() { try { const s = serialize(); localStorage.setItem(LS_EXP, JSON.stringify(s.experiment)); localStorage.setItem(LS_PRES, JSON.stringify(s.presentation)); wState.setStatus('saved', 'live'); } catch (e) { wState.setStatus('save failed', 'warn'); } }
  /** opt.keepTime: leave the transport exactly where it is (UNDO / REDO) — the anchor c(0) is what travels, so the
   *  picture is continuous the way a RATE change is and only moves if the coefficients themselves did */
  function restore(obj, opt) {
    try {
      const ex = obj ? obj.experiment : JSON.parse(localStorage.getItem(LS_EXP) || 'null');
      const pr = obj ? obj.presentation : JSON.parse(localStorage.getItem(LS_PRES) || 'null');
      if (ex) { const t = reg.restore(ex); if (!(opt && opt.keepTime)) { clock.pause(); clock.scrub(t); } if (ex.rate) clock.setRate(paceRate(ex.rate)); if (ex.window) clock.window = ex.window; ui.rateKnob.set(clock.rate); ui.presetSel.value = reg.preset || ''; lastNmax = -1; setReference(); }
      if (pr) { camLevel.from = null; Object.assign(obs, pr.obs || {}); obs.mode = obs.mode === 'free' ? 'free' : 'turntable'; if (!Array.isArray(obs.quat) || obs.quat.length !== 4) obs.quat = quatFromYawPitch(obs.yaw, obs.pitch); if (obs.mode === 'free') { /* WAVE 106 · THE ANGLES ARE A READOUT IN FREE, AND A READOUT MUST NOT MOVE THE RECORD.
      A link rounds the quaternion to f32; re-deriving the angles from THAT quaternion lands them an ulp off the
      ones the link carried, so mint(open(link)) stopped being byte-identical the moment the camera began booting
      FREE — B98's fixed point, and the codec's own node suite cannot see it because the asymmetry is here and not
      in statelink.js.  A record whose angles already agree with its pose far closer than any dial can show KEEPS
      the ones it carried; anything that genuinely disagrees is still re-derived, which is what an old favourite
      carrying no quaternion needs. */
      const y0 = obs.yaw, p0 = obs.pitch; syncFreeAngles();
      if (Math.abs(obs.yaw - y0) < 1e-4 && Math.abs(obs.pitch - p0) < 1e-4) { obs.yaw = y0; obs.pitch = p0; } } if (ui.camSeg) ui.camSeg.set(obs.mode); if (ui.camNote) ui.camNote.textContent = CAM_TRADE[obs.mode]; camera.stop(); syncCamUI(); const pm = { ...(pr.mat || {}) }; delete pm.bg; delete pm.gamma; delete pm.lightUI; Object.assign(mat, pm); mat.finish=pm.finish||'lit'; mat.bow={gain:1,curve:1,limit:3,...pm.bow}; if(ui.finishSeg)ui.finishSeg.set(mat.finish||'lit'); if(ui.bowKnobs)for(const k in ui.bowKnobs)ui.bowKnobs[k].set(mat.bow?.[k]??({gain:1,curve:1,limit:3}[k])); if(ui.frameModeSeg)ui.frameModeSeg.set(mat.frame===false?'off':mat.frameMode||'box'); if(ui.axisModeSeg)ui.axisModeSeg.set(mat.axis===false?'off':mat.axisMode||'box'); if (ui.styleSeg && STYLE_NAMES[mat.style]) ui.styleSeg.set(STYLE_NAMES[mat.style]); if (ui.ditherSeg) { mat.dither = +mat.dither || 0; ui.ditherSeg.set(mat.dither ? 'ordered' : 'off'); ui.ditherK.setDisabled(!mat.dither); if (mat.dither) ui.ditherK.set(Math.max(0.25, Math.min(2, mat.dither))); } if (ui.invertSw) ui.invertSw.set(!!mat.invert); if (ui.frameSw) ui.frameSw.set(mat.frame !== false); if (ui.axisSw) ui.axisSw.set(mat.axis !== false); if (pm.axisInk !== undefined) mat.axisInk = (pm.axisInk === 'cmy' || pm.axisInk === 'rgb') ? pm.axisInk : 'theme'; if (ui.axisInkSeg) ui.axisInkSeg.set(mat.axisInk === 'cmy' || mat.axisInk === 'rgb' ? mat.axisInk : 'theme'); Object.assign(quality, pr.quality || {}); Object.assign(domain, pr.domain || {}); ui.viewSeg.set(VIEW_NAMES[mat.view]); if (pr.shadow) { shadowView.setMode(pr.shadow); ui.shadowSeg.set(pr.shadow); } ui.domainAuto.set(domain.auto); ui.domainKnob.setDisabled(domain.auto); }
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
        if (pr.field) { const F = pr.field; if (F.overlay !== undefined) fieldlines.setOverlay(F.overlay); if (F.lines !== undefined) fieldlines.setLines(F.lines); if (F.source !== undefined) fieldlines.setSource(F.source); }
        if (Array.isArray(pr.rates) && pr.rates.length === 91) { rates.set(pr.rates); reg.setEnergies(energyOf); }
        if (pr.modulation !== undefined) restoreModulation(pr.modulation);   // wave 52 (an UNDO's presentation has no such key, so undo never touches the rack)
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
          modHost.clock.applyAll(true);
        }
        if (pr.space && pr.space !== space && !getHamiltonian().noMomentum && !sturm.P) { space = pr.space; if (ui.spaceSeg) ui.spaceSeg.set(space); }
        if (pr.palette && palette) { if (Array.isArray(pr.palette.stops)) palette.load(pr.palette.stops); palette.setOn(!!pr.palette.on); if (!pr.palette.on && mat.view !== undefined) ui.viewSeg.set(VIEW_NAMES[mat.view]); }
      }
      schedule(TIER.REBUILD); wState.setStatus('restored', 'live');
      return true;
    } catch (e) { wState.setStatus('restore failed', 'warn'); return false; }
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

  /* ── UNDO / REDO (the last of the agreed order) ─────────────────────────────────────────────────
   * The ring is lab/history.js; this is the port it works through.  READ takes the register side —
   * the anchor c(0) with its mask and static field, the DRAG γ, the Hamiltonian selection, the SCALE,
   * the 91 RATEs and the two A / B stores — and, SINCE WAVE 106, the MATERIAL too: the picture knobs,
   * the draw style, the observable and the slice (Josh: "I want the undo to work for almost every
   * knob").  It still takes nothing of the camera POSE, the play state, the layout or the theme — the
   * reasons are written out at `hLook` below, and the short one is that navigation is not an edit.  WRITE goes through restore() itself with
   * keepTime, so an undo travels the same road a project LOAD does (the kernel, the spectrum lanes,
   * the knobs, the Sturmian ladder and the ATOMS card all follow) while the transport is left exactly
   * where it is: the anchor is what travels, so the picture is continuous the way a RATE change is
   * and only moves if the coefficients themselves did.  LIVEKEY is the cheap string that says whether
   * any of that has changed.  The trigger is reg.version — every register mutation bumps it — plus
   * hNote() at the few register-side setters that do not (the A / B stores, ELEMENT, GAS BASIS, WELL
   * RADIUS).  Capture is BEFORE the mutation: that is what history.js's baseline is for. */
  const hAbCopy = (S) => S ? { re: Array.from(S.re), im: Array.from(S.im) } : null;
  /* ══ WAVE 106 · THE UNDO REACHES THE KNOBS (Josh: "I want the undo to work for almost every knob,
     try your best") ═══════════════════════════════════════════════════════════════════════════════
     Until now the ring took the REGISTER side and nothing else, and the block above says so in a
     sentence that is now half wrong: "nothing of the observer's — no camera, no palette, no draw
     style".  Josh has ruled that boundary too tight.  Turning EXPOSURE, or SOFTNESS, or the SLICE, is
     an edit; a hand that overshoots one wants the same Ctrl+Z as a hand that overshoots a coefficient,
     and being told "that one is not undoable" is a distinction only the implementation can see.
       WHERE THE NEW LINE IS, and why it is not simply "everything".  This block takes what changes the
     PICTURE — the material knobs, the draw style, the observable, the three display flags and the whole
     slice — and deliberately still refuses:
       · THE CAMERA POSE.  An undo that teleports your viewpoint is not an undo, it is a jump cut, and
         you would lose the framing you were working from to get a knob back.  Navigation is not an
         edit.  (The camera's FEEL — friction, spin, the gains — is a preference, and lives in
         SETTINGS with the other preferences.)
       · THE PLAY STATE and the clock.  Ctrl+Z must never start or stop time.
       · THE LAYOUT, the theme and the palette CHOICE — those are the workspace, and wave 106 gave the
         workspace its own memory in the favourite layouts.
     THE TRIGGER NEEDED NOTHING.  `hold()`/`release()` are already bound to document-level pointerdown
     and pointerup, so every knob gesture in the lab ALREADY asks the ring to commit — it simply found
     `dirty()` false, because `liveKey` could not see the material.  Putting the material in the key is
     the whole mechanism; one drag is still one entry, by the same coalescing window as before. */
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
  document.addEventListener('pointerdown', (e) => { pointerHeld = true; history.hold(hTouchName(e.target)); }, true);   // one drag is ONE step: the window opens on the way down …
  document.addEventListener('pointerup', () => { pointerHeld = false; history.release(); });       // … and closes after the control's own onChange has run
  document.addEventListener('pointercancel', () => { pointerHeld = false; history.release(); });
  const historyApi = {
    undo() { const ok = history.undo(); if (ok) wState.setStatus('undone · ' + history.depth + ' back, ' + history.redoDepth + ' forward', 'live'); return ok; },
    redo() { const ok = history.redo(); if (ok) wState.setStatus('redone · ' + history.depth + ' back, ' + history.redoDepth + ' forward', 'live'); return ok; },
    get canUndo() { return history.canUndo; }, get canRedo() { return history.canRedo; },
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

  /* ══ WAVE 106 · THE HISTORY WINDOW (Josh: "fleshout and Polish the history system and make it
     similar to FL studio's history system") ═══════════════════════════════════════════════════════
     FL's history is not a pair of arrows — it is a LIST you can see and land on.  Every action is a
     named row, the row you are standing on is marked, the rows above it are the future you stepped
     back from and they grey out rather than vanishing, and doing something new from there truncates
     them.  All four of those are properties of the ring now; this is the surface that shows them.
       IT IS A RACK WINDOW and not a bespoke panel, so it folds, closes, floats and remembers its seat
     like every other card, and costs no new furniture.  The rows come from `entries()` and a click is
     `goto(i)` — ONE hop, not a run of undos, which is the whole point of a list: you land on a moment
     rather than walking back to it. */
  const wHist = device({ id: 'history', eyebrow: 'HISTORY', title: 'EVERY EDIT, AND THE ONE YOU ARE STANDING ON', status: '' });
  rack.appendChild(wHist.root);
  const histList = el('div', 'hist-list', wHist.body);
  {
    const rh = wHist.row('tight');
    rh.appendChild(trig({ label: 'UNDO', title: 'step back one row (Ctrl+Z)', onFire: () => historyApi.undo() }).root);
    rh.appendChild(trig({ label: 'REDO', title: 'step forward one row (Ctrl+Shift+Z, Ctrl+Y)', onFire: () => historyApi.redo() }).root);
    rh.appendChild(trig({ label: 'CLEAR', title: 'forget every row and start the list from where the instrument is now — the STATE is not touched', onFire: () => { historyApi.clear(); } }).root);
    el('div', 'note', wHist.body).innerHTML = '<b>THE LIST IS THE HISTORY.</b> Every row is one edit, named for the control that made it; a drag is one row, not one per pixel. Click any row to <b>land on that moment</b> — one hop, not a run of undos. Step back and the rows above grey out: they are still there, and doing something new from where you stand replaces them. The ring keeps the last 60. <b>What it does not carry:</b> the camera pose and the play state — an undo re-framing your view would be a jump cut, not an undo.';
  }
  function renderHistory() {
    if (!histList) return;
    const rows = historyApi.entries();
    histList.innerHTML = '';
    for (let i = rows.length - 1; i >= 0; i--) {          // newest at the top, the way a stack reads
      const r = rows[i];
      const b = el('button', 'hist-row hist-' + r.state, histList); b.type = 'button';
      el('span', 'hist-i', b, String(r.i));
      el('span', 'hist-lbl', b, r.label || 'edit');
      if (r.state === 'current') b.setAttribute('aria-current', 'true');
      b.title = r.state === 'current' ? 'where the instrument is standing' : 'land on this moment';
      b.addEventListener('click', () => historyApi.goto(r.i));
    }
    wHist.setStatus(rows.length + (rows.length === 1 ? ' row' : ' rows') + '  ·  on ' + (historyApi.cursor + 1), 'live');
  }
  hRender = renderHistory;
  renderHistory();

  /* ── the diagnostics surface (tests and curiosity; one road) ──────────── */
  const LW = {
    ready: false, reg, clock, obs, mat, quality, domain, camera, fieldRate, stats, field, presets: PRESETS, TIER, shadowView, spectrum, orbitView: orbit, vortex, ladder, particles, dynamics, slice, qcd, kepler, molecule, helium, h2, calculus, layout, fieldlines, get electrostatics() { return fieldlines.field; }, setTheme(t) { if (__LW_hooks.setTheme) __LW_hooks.setTheme(t); }, setCardStyle(c) { return setCardStyle(c); }, get cardStyle() { return document.body.dataset.card || 'refractive'; }, setFrost(m) { return setFrost(m); }, get frost() { return frostMode; }, get frostLive() { return document.body.classList.contains('frost') && !document.body.classList.contains('frost-hold'); }, setDisconnected(v) { return setDisconnected(v); }, get disconnected() { return document.body.classList.contains('disconnected'); }, applySettings, get settings() { return readSettings(); }, get build() { return BUILD_LINE; }, get ab() { return __LW_hooks.ab; }, get notebook() { return layout.notebook; }, get period() { return __LW_hooks.period ? __LW_hooks.period() : null; }, get gas() { return gas; }, setGasBasis(v) { if (ui.gasBasis) ui.gasBasis.set(v); gasAxial = v === 'axial'; if (!gasAxial) gas.off(); hNote(); schedule(TIER.RECONSTRUCT); }, get gasBasis() { return gasAxial ? 'axial' : 'reg'; }, keplerDrag(n, w) { return keplerDragToPoint(n, w); }, keplerTurn(kind, dth, n) { return keplerTurn(kind, dth, n); }, get keplerShell() { return kepShell(); }, setKeplerShell(n) { if (ui.kepShell) { ui.kepShell.set(String(n)); keplerRowSync(true); } return kepShell(); }, keplerOrbitOf(n) { return orbitOfShell(n === undefined ? kepShell() : n); }, get rotRate() { return { ...rotRate }; }, setRotRate(which, v) { const k = which === 'z' ? 'z' : which === 'kz' ? 'kz' : which === 'def' ? 'def' : null; if (!k) return null; if (!Number.isFinite(v)) return null; const w = (k !== 'z' && sturm.P) ? 0 : Math.max(-ROT_LIMIT[k], Math.min(ROT_LIMIT[k], v)); if (modHand('state.' + (k === 'z' ? 'rot.z' : k === 'kz' ? 'stark.kz' : 'defect.l2'), w)) return w; return setRotationRate(k, w); }, get rotDriving() { return rotDriving(); }, get projects() { return layout.projects; }, rateOf(a) { return rates[a]; }, setRate(a, r) { return api.setRate(a, r); }, saveSettings, setStage(v) { return __LW_hooks.setStage ? __LW_hooks.setStage(v) : null; }, setStyle(name) { if (STYLE[name] === undefined) return false; mat.style = STYLE[name]; if (ui.styleSeg) ui.styleSeg.set(name); schedule(TIER.PRESENT); return true; }, accent: { set(a, b) { if (a !== undefined) accent.a = a; if (b !== undefined) accent.b = b; applyAccent(); }, get a() { return accent.a; }, get b() { return accent.b; }, colorAt(deg) { return rgbToHex(wheelColor(deg)); } }, get theme() { return document.body.dataset.theme || 'dark'; }, get themeChoice() { return document.body.dataset.themeChoice || document.body.dataset.theme || 'dark'; }, placeElectron(px, py) { if (helium && helium.on) { helium.placeAt(unproject(px, py)); schedule(TIER.RECONSTRUCT); } }, launchPacket, get lastLaunch() { return lastLaunch; }, enterBox() { if (getHamiltonian().id !== 'well') { setHamiltonian('well'); switchHamiltonian('well'); if (ui.hamSeg) ui.hamSeg.set('well'); } enterBox(); }, coherentBounce() { coherentBounce(); }, get autoQ() { return autoQ; }, governor: { get on() { return gov.on; }, set on(v) { setGovernor(v); }, get drop() { return gov.drop; }, get median() { return gov.median; }, get changes() { return gov.changes; }, get parked() { return [...gov.parked.keys()]; }, get probes() { return gov.probes; }, get probeMs() { return READER_LAW.probeMs; }, get state() { return !gov.on ? 'off' : gov.drop ? 'stepped-' + gov.drop : 'nominal'; }, get resolution() { return effectiveRes(); }, get work() { return perf.work; } }, maths: { get ok() { return maths.ok && scan.ok; }, get bow() { return maths.ok; }, get scan() { return scan.ok; }, call: (m) => maths.call(m) }, get keepFrames() { return keep.frames; }, setKeepFrames, packetCentroid(G = 24) { const c = reg.at(clock.t); return wellCentroid(c.re, c.im, reg.populated(), { G }); }, setIonZ(z) { setZ(z); switchHamiltonian('hydrogen'); if (ui.zKnob) ui.zKnob.set(z); }, get Z() { return getZ(); }, perf: { get mode() { return perf.mode; }, setMode: setPerfMode, get profile() { return perf.profile; }, get counts() { return perf.counts; }, /** the median of the loop's OWN main-thread ms over the last 60 frames — the budget-independent read of "is hidden cheaper?" */ get median() { const a = Array.from(perf.ring).filter((v) => v > 0).sort((x, y) => x - y); return a.length ? a[a.length >> 1] : 0; }, resetRing() { perf.ring.fill(0); } }, get keys() { return __LW_hooks.keys; }, bow: { start: (x, y) => bowStart({ clientX: x, clientY: y }), move: (x, y) => bowMove({ clientX: x, clientY: y }), release: () => bowRelease(), cancel: () => bowCancel(), get active() { return !!bow; }, get k() { return bow ? bow.k : 0; }, get dir() { return bow ? bow.dir : null; }, get landed() { return bowChain; }, get inFlight() { return bowInFlight > 0; } }, kickAlong(k, d) { slapAlong(k, d); }, setDamping(g) { reg.setDamping(g); touchState(); }, get hamiltonian() { return getHamiltonian().id; }, setHamiltonian(id) { switchHamiltonian(id); if (ui.hamSeg) ui.hamSeg.set(id); }, kick(k, axis = 'z') { if (__LW_hooks.slap) __LW_hooks.slap(k, axis); }, get space() { return space; }, setSpace(s) { if (s === 'p' && sturm.P) return false; space = s; if (ui.spaceSeg) ui.spaceSeg.set(s); schedule(TIER.REBUILD); }, get palette() { return palette; },
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
  mat.view = VIEW.phase; if (ui.viewSeg) ui.viewSeg.set('phase'); schedule(TIER.PRESENT);   // the shipped observable is arg ψ (Josh); a preset picked later still brings its own visuals
  if (q.get('view') && VIEW[q.get('view')] !== undefined) { mat.view = VIEW[q.get('view')]; ui.viewSeg.set(q.get('view')); }
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
  layout.moveToRack('spectrum', 'L'); spectrum.openPicker(true);                    // the official layout (Josh): SPECTRUM on the left, MODE open
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

  /* ── THE PHOTOSENSITIVITY WARNING (wave 48, Josh) ─────────────────────────
   * "Copy the text, design, layout, symbol, function from 'Mandelbrot' into this app… Let this be an entire frost
   * glass transparent background to the current app when it loads (since Lambdawaves doesn't have a main menu) and
   * let the text color (black or white) be whatever the user's last Light/Dark/Default setting is."
   *
   * The text, the caution triangle, the 34em card, the focus trap and the CONTINUE button are MANDELBROT's warn.js,
   * carried over unchanged.  Three things are ours, and each is Josh's instruction:
   *   GROUND   — MANDELBROT paints solid #000 because its pane stands in front of a MENU.  λWAVES has no menu, so
   *              the lab is already running underneath and the pane is frost glass over it (lab.css §48f).
   *   INK      — black or white by the RESOLVED theme, so LIGHT, DARK and SYSTEM all reach it, live.
   *   MEMORY   — MANDELBROT deliberately shows on every cold start.  Ours is remembered in the settings key and
   *              brought back by SETTINGS · SHOW THE WARNING AGAIN, which is why that row exists.
   * The automation bypass is MANDELBROT's too (navigator.webdriver, ?warn=0, ?warn=1): a modal over the lab would
   * otherwise stand in front of every screenshot the gate takes.  A driver can still force it with ?warn=1. */
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
  reworkNative({ ui, mat, repaint:()=>schedule(TIER.PRESENT), modHost, cadence:()=>MOD.hz, setCadence:hz=>{MOD.hz=hz;saveSettings();}, arm:setModArm });
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
  hintTimer();                        // wave 59: and the hint bar's nine seconds start when the notice is DOWN, for the same reason and through the same hook
  if (MOTION.reduced && ui.rateKnob) ui.rateKnob.root.title = 'RATE is at a quarter of what the preset asked for, because this browser prefers reduced motion — drag it and the number is yours';
  if (palette && palette.repaint) requestAnimationFrame(() => palette.repaint());   // the strip sat in a zero-size card when first painted
  history.clear();                    // the shipped boot (and a ?preset= in the URL) is the BOTTOM of the stack, not a step in it
  /* ONE FULL TURN OF THE PALETTE ON BOOT (wave 53; wave 48's 360° SPIN was here, and Josh asked for it gone).
     The mark never moves — the nine squares walk the current palette once round and come back to where they
     rest, which is the same event said with colour instead of rotation.  Boot is the RARE tier, so it gets it. */
  markTurn();
  busyHost();                         // the mark is cloned and painted before anything can need it
  if (layout.projects) layout.projects.markClean();
  LW.ready = true;
  return LW;
}
