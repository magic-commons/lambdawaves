/* accent-wheel.js — THE WHEEL AS THE UI's ACCENT, THE MARK AND ITS TURN: the two accent angles on the current palette
 * (--acc, --acc2, the ported window's hue pair), every copy of the nine-square mark and the λ (legible against the
 * ground each one is really on), and the boot's one TURN of the palette through the header mark.  A seam out of rack.js
 * boot() (optimization 2026-09-24 · N7 seam 4, AUDIT-E §6).  Closure edges, handed in: `mat` (hue, palette on, the
 * stage ground), `getModView` (the ported window, built later in boot) and the first palette LUT; and three roads back
 * in for the state other code used to write directly — setWheelLUT (the palette editor), setGamutCss (the field, once
 * it knows its canvas gamut) and markBatchBegin / markBatchEnd (M7's one-paint batches: the boot build, restore()).
 * createAccentWheel() runs where the block stood; `accent` is the same live object the settings, projects and LW read. */
import { setAccentRGB } from './mir/kit.js';
import { toLUT, PRESET_BY_ID as PALETTE_BY_ID, rgbToOklab, oklabToRgb, rgbToHex, visibleInk, contrastRatio } from './mir/palette.js';

export function createAccentWheel({ mat, getModView, lut }) {
  /* ── THE WHEEL AS THE UI's ACCENT ──────────────────────────────────────────
   * Two angles on the CURRENT palette (the editor's stops, whether or not the phase view uses them, shifted by the
   * HUE knob) colour every accent in the interface — --acc and --acc2 on the body — so rotating the wheel recolours
   * the whole UI.  The logo is the same wheel: λ is the colour at 0° and the nine squares are the wheel at 0°, 40°,
   * … 320° in reading order.  For legibility the two UI accents have their OKLab lightness held to the theme's
   * range (≥ 0.62 on DARK, ≤ 0.62 on LIGHT); the logo takes the wheel's colours verbatim. */
  const nativeAccentLUT=toLUT(PALETTE_BY_ID.get('lambda').stops);
  let wheelLUT = lut;                        // the CURRENT palette's LUT: boot() hands the first one in, the editor's setLUT the rest (setWheelLUT)
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
    const modView = getModView(); if (modView) modView.setAccent(hueSat(A), hueSat(B));
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
  function markBatchBegin() { markBatch++; }
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
  return { accent, wheelColor, applyAccent, paintMarks, markBatchBegin, markBatchEnd, markInk, stageGround, inkCtx,
    ensureTurnCSS, turnStops, markTurn, MARK_N, MARK_STEP, MARK_FLOOR, MARK_GROUND, TURN_STOPS,
    setWheelLUT(next) { wheelLUT = next; }, setGamutCss(fn) { gamutCss = fn; } };
}
