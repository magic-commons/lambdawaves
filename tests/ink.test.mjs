/* tests/ink.test.mjs — the node proof of the two colour roads wave 57 straightened.
 *   node tests/ink.test.mjs
 *
 * TWO CLAIMS, both about a colour arriving somewhere in the state it left:
 *
 * (1) THE READER KNOWS EVERY FORM THE APP WRITES.  Five modules carried a copy of one CSS-colour reader and
 *     all five matched exactly three forms — #rrggbb, #rgb and rgb()/rgba().  There is a fourth and the app
 *     WRITES it: under DISPLAY-P3 `applyAccent()` sets --acc to `color(display-p3 …)`, a 2-D context
 *     serialises it back in that form, and the reader fell through to a last resort that in four of the five
 *     copies was the hard-coded wave-23 house cyan.  Six canvas views would have drawn last year's accent
 *     while the DOM wore the chosen palette, by design and in silence.  There is one reader now, in kit.js.
 *     The ORACLE is independent: this file carries field.js's FORWARD matrix (sRGB → display-p3, in linear
 *     light) and checks the reader inverts it, rather than checking the inverse against itself.
 *
 * (2) THE λ CAN BE SEEN.  `paintMarks()` set the header λ from the raw wheel, so it wore whatever luminance
 *     the palette happened to have at 0° — measured over 23 palettes × 360° of HUE that reaches 1.00 : 1 on
 *     BOTH stages (ember @0° on light, aurora @6° on dark): the same luminance as the ground.  `visibleInk`
 *     hands the colour's own OKLab a and b straight through and moves only L, only when the colour is under
 *     the floor and only as far as the floor demands.  Swept exhaustively — 23 × 360 × 2 grounds, not a sample.
 *
 * THE FLOOR, stated: 3 : 1, WCAG 2.x's non-text / graphical-object ratio.  WCAG 1.4.11 exempts logotypes
 * outright, so this is a floor the lab CHOOSES for its own mark — the same one the accent audit holds every
 * other mark in the interface to.  The nine mark squares are NOT corrected and this file measures what
 * that costs.
 *
 * (3) THE THIRD SURFACE IS A KNOB (wave 59, from the adversarial review of 2026-09-05 §2.3).  Wave 57
 *     corrected BOTH copies of the λ against a CONSTANT — the card.  That is right for `.nb-logo`, which
 *     really is on a card.  `#title` is not: it is `background: none` over `#field`, whose clear colour is
 *     `mat.bg`, and `mat.bg` IS THE SHIPPED STAGE KNOB in the CAMERA window.  Correcting against a ground
 *     the user can drag away from is not correcting.  Measured over 23 × 256 on the dark theme, STAGE 0.50
 *     put 92.8 % of the wheel under 3 : 1 with a worst case of 1.00 : 1 — the exact number rack.js's own
 *     wave-57 header names as the failure it removed ("Not faint: absent"), reached by a knob instead of a
 *     palette.  §3 below sweeps STAGE as a THIRD AXIS: 23 palettes × 256 hues × 11 stage values × 2 themes.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRESETS, toLUT, rgbToOklab, oklabToRgb, visibleInk, contrastRatio, relLuminance } from '../lab/mir/palette.js';
import { parseCssColor } from '../lab/mir/kit.js';

const LAB = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'lab');
let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 700)));
}
const T0 = Date.now();
const FLOOR = 3;

/* ── the grounds, every one derived from the stylesheets rather than guessed ────────────────────────────
 *   stage   lab.css §1 `#stage { background: #070a0f }` · skin.css `body[data-theme="light"] #stage { #eef1f6 }`
 *   card    the two numbers skin.css records as MEASURED in the page: the light card, and the dark card at
 *           the brightest corner of its 7 % sheen — the hardest surface each theme's λ is ever drawn on. */
const G = {
  lightStage: [238, 241, 246], lightCard: [236, 239, 243],
  darkStage: [7, 10, 15], darkCard: [41, 45, 50],
};
const n01 = (c) => c.map((v) => v / 255);
const n255 = (c) => c.map((v) => Math.round(v * 255));

/* ══ 1. THE READER ══════════════════════════════════════════════════════════════════════════════════════ */

/* the ORACLE: field.js's own forward map, sRGB → display-p3.  Both spaces share the sRGB transfer curve, so
   the matrix is applied in LINEAR light; the rows sum to 1, which is why D65 white stays white. */
const M_SRGB_P3 = [[0.822462, 0.177538, 0], [0.033194, 0.966806, 0], [0.017083, 0.072397, 0.910520]];
const lin = (u) => (u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4));
const enc = (u) => (u <= 0.0031308 ? 12.92 * u : 1.055 * Math.pow(u, 1 / 2.4) - 0.055);
const srgbToP3 = (rgb) => { const l = rgb.map(lin); return M_SRGB_P3.map((r) => enc(Math.max(0, Math.min(1, r[0] * l[0] + r[1] * l[1] + r[2] * l[2])))); };
/* exactly what rack.js:gamutCss emits in P3: four decimals of the transformed numbers */
const p3css = (rgb) => 'color(display-p3 ' + srgbToP3(rgb).map((v) => v.toFixed(4)).join(' ') + ')';

{
  const forms = [
    ['#78e1f0', [120, 225, 240]],
    ['#7ef', [119, 238, 255]],
    ['#78e1f0ff', [120, 225, 240]],
    ['rgb(120, 225, 240)', [120, 225, 240]],
    ['rgba(120, 225, 240, 0.5)', [120, 225, 240]],
    ['rgb(120 225 240 / 50%)', [120, 225, 240]],
    ['rgb(50%, 50%, 50%)', [128, 128, 128]],
    ['color(srgb 0.4706 0.8824 0.9412)', [120, 225, 240]],
    ['color(srgb 1 1 1)', [255, 255, 255]],
    ['color(srgb-linear 1 1 1)', [255, 255, 255]],
    ['color(display-p3 1 1 1)', [255, 255, 255]],
    ['color(display-p3 0 0 0)', [0, 0, 0]],
  ];
  const bad = forms.filter(([s, want]) => { const got = parseCssColor(s); return !got || got.some((v, i) => Math.abs(v - want[i]) > 1); });
  judge('W57-1 parseCssColor reads all four CSS colour forms — hex 3/4/6/8, rgb()/rgba() in every legal spelling, and color() in srgb, srgb-linear and display-p3 (' + forms.length + ' cases)',
    bad.length === 0, bad.map(([s]) => s + ' → ' + JSON.stringify(parseCssColor(s))));

  const refused = ['color(lab 50 20 30)', 'color(rec2020 1 0 0)', 'not-a-colour', '', 'color(display-p3 1 1)'];
  judge('W57-1 a colour space the app does not write is REFUSED (null) rather than guessed — the caller\'s own fallback then stands',
    refused.every((s) => parseCssColor(s) === null), refused.map((s) => s + ' → ' + JSON.stringify(parseCssColor(s))));

  /* THE ROUND TRIP, over the whole cube at a 17³ lattice plus every palette's every LUT entry: take an sRGB
     colour, express it in display-p3 the way the app does, hand the string to the reader, get the sRGB back. */
  let worst = 0, worstAt = null, n = 0;
  for (let r = 0; r <= 255; r += 15) for (let g = 0; g <= 255; g += 15) for (let b = 0; b <= 255; b += 15) {
    const want = [r, g, b], got = parseCssColor(p3css(n01(want)));
    n++; for (let i = 0; i < 3; i++) { const d = Math.abs(got[i] - want[i]); if (d > worst) { worst = d; worstAt = { want, got }; } }
  }
  for (const p of PRESETS) { const lut = toLUT(p.stops);
    for (let i = 0; i < 256; i += 8) { const want = n255([lut[i * 4], lut[i * 4 + 1], lut[i * 4 + 2]]), got = parseCssColor(p3css(n01(want)));
      n++; for (let k = 0; k < 3; k++) worst = Math.max(worst, Math.abs(got[k] - want[k])); } }
  judge('W57-1 the P3 ROUND TRIP is exact to one 8-bit level over ' + n + ' colours (a 17³ lattice of the whole sRGB cube plus every palette\'s LUT): worst channel error ' + worst + '/255 — so a view reading `color(display-p3 …)` off the DOM draws the colour the wheel chose, not the wave-23 cyan',
    worst <= 1, { worst, worstAt });

  /* AND THE LITERALS ARE GONE.  The six sites the audit named, plus the reader's own last resort, which was
     a SECOND copy of the same cyan; kit.js is not swept because its number ladder legitimately owns [120,225,240]
     as shell level 2, which has nothing to do with the accent. */
  const files = ['atomsview.js', 'fieldview.js', 'moview.js', 'radiationview.js', 'wignerview.js'];
  const hits = [];
  for (const f of files) {
    const src = fs.readFileSync(path.join(LAB, f), 'utf8');
    for (const [re, what] of [[/78e1f0/g, '#78e1f0'], [/d97ce8/g, '#d97ce8'], [/120,\s*225,\s*240/g, '[120, 225, 240]']])
      if (re.test(src)) hits.push(f + ' still carries ' + what);
  }
  judge('W57-1 not one of the five canvas views still holds a hard-coded copy of the pre-wheel house cyan or magenta — the accents come from the wheel through kit.js\'s setAccentRGB, and the CSS token is only the fallback',
    hits.length === 0, hits);
}

/* ══ 2. THE λ ═══════════════════════════════════════════════════════════════════════════════════════════ */

const wheelAt = (lut, deg) => { const u = ((deg / 360) % 1 + 1) % 1, i = Math.min(255, Math.floor(u * 256)) * 4; return [lut[i], lut[i + 1], lut[i + 2]]; };
const SWEEP = [];
for (const p of PRESETS) { const lut = toLUT(p.stops); for (let d = 0; d < 360; d++) SWEEP.push({ id: p.id, d, rgb: wheelAt(lut, d) }); }

{
  const rows = [];
  for (const [theme, card, stage] of [['light', G.lightCard, G.lightStage], ['dark', G.darkCard, G.darkStage]]) {
    const gc = n01(card), gs = n01(stage);
    let rawWorst = { r: 1e9 }, inkCard = { r: 1e9 }, inkStage = { r: 1e9 }, moved = 0, dHue = 0, cGain = 0, cLoss = 0;
    for (const s of SWEEP) {
      const ink = visibleInk(s.rgb, gc, FLOOR);
      if (ink !== s.rgb) {
        moved++;
        const a = rgbToOklab(s.rgb), b = rgbToOklab(ink);
        const ca = Math.hypot(a[1], a[2]), cb = Math.hypot(b[1], b[2]);
        cGain = Math.max(cGain, cb - ca);                                       // the correction may never make a colour MORE saturated
        if (ca > 0.02) {                                                        // a hue angle is only meaningful on a colour that has one
          let dh = Math.abs(Math.atan2(a[2], a[1]) - Math.atan2(b[2], b[1])) * 180 / Math.PI;
          if (dh > 180) dh = 360 - dh;
          dHue = Math.max(dHue, dh); cLoss = Math.max(cLoss, (ca - cb) / ca);
        }
      }
      const rr = contrastRatio(s.rgb, gs); if (rr < rawWorst.r) rawWorst = { r: rr, id: s.id, d: s.d };
      const rc = contrastRatio(ink, gc); if (rc < inkCard.r) inkCard = { r: rc, id: s.id, d: s.d, rgb: n255(ink) };
      const rs = contrastRatio(ink, gs); if (rs < inkStage.r) inkStage = { r: rs, id: s.id, d: s.d, rgb: n255(ink) };
    }
    rows.push({ theme, rawWorst, inkCard, inkStage, moved, total: SWEEP.length, dHue, cGain, cLoss });
  }
  for (const r of rows) {
    judge('W57-2 [' + r.theme.toUpperCase() + '] the λ clears ' + FLOOR + ' : 1 on the CARD it is corrected against, at every one of ' + r.total + ' palette × HUE samples — worst ' + r.inkCard.r.toFixed(3) + ' : 1 (' + r.inkCard.id + ' @' + r.inkCard.d + '°). RAW, it reached ' + r.rawWorst.r.toFixed(3) + ' : 1 (' + r.rawWorst.id + ' @' + r.rawWorst.d + '°) — the mark was not faint, it was ABSENT',
      r.inkCard.r >= FLOOR - 1e-9, r.inkCard);
    judge('W57-2 [' + r.theme.toUpperCase() + '] and on the STAGE, which is the surface the browser gate measures, it clears ' + r.inkStage.r.toFixed(3) + ' : 1 — the correction is done against the harder ground, so the easier one has headroom',
      r.inkStage.r >= FLOOR, r.inkStage);
    judge('W57-2 [' + r.theme.toUpperCase() + '] ONLY LIGHTNESS IS ASKED TO MOVE, and the correction is a NO-OP on ' + (100 * (1 - r.moved / r.total)).toFixed(0) + ' % of the wheel — a vivid λ stays exactly as vivid as it was. The OKLab a and b are handed through unchanged; where the new lightness puts the colour outside sRGB the encoder CLAMPS, exactly as oklabToRgb already does for every palette colour and every accent in the lab, and that is the only thing that moves the hue at all: over the whole sweep the hue angle holds to ' + r.dHue.toFixed(1) + '°, the chroma is never RAISED (max gain ' + r.cGain.toExponential(1) + ') and at worst ' + (100 * r.cLoss).toFixed(0) + ' % of it is lost at the most saturated corner, where a colour that dark simply does not exist in the gamut',
      r.dHue <= 8 && r.cGain <= 1e-6, { moved: r.moved, total: r.total, dHue: r.dHue, cGain: r.cGain, cLoss: r.cLoss });
  }

  /* the direction of the walk is the ground's, not a constant: a light ground darkens the mark, a dark one lightens it */
  const dir = [];
  for (const [theme, card] of [['light', G.lightCard], ['dark', G.darkCard]]) {
    const gc = n01(card), up = relLuminance(gc) < 0.5 ? 1 : -1;
    let wrong = 0;
    for (const s of SWEEP) { const ink = visibleInk(s.rgb, gc, FLOOR); if (ink === s.rgb) continue;
      const dL = rgbToOklab(ink)[0] - rgbToOklab(s.rgb)[0]; if (dL * up < 0) wrong++; }
    dir.push({ theme, wrong });
  }
  judge('W57-2 the walk always goes AWAY from the ground — down on the light card, up on the dark one — so the correction can never make a mark harder to see than it was',
    dir.every((x) => x.wrong === 0), dir);

  /* WHAT THE NINE SQUARES COST, since they are deliberately left uncorrected.  Reported, not asserted as a
     defect: they are a SWATCH GRID — the palette showing itself — and a swatch corrected for its ground lies
     about the colour it is a swatch of.  The number is here so the choice is on the record with its price. */
  const sq = [];
  for (const [theme, stage] of [['light', G.lightStage], ['dark', G.darkStage]]) {
    const gs = n01(stage); let worstBest = { r: 1e9 };
    for (const p of PRESETS) { const lut = toLUT(p.stops);
      for (let sh = 0; sh < 360; sh++) { let best = 0;
        for (let k = 0; k < 9; k++) best = Math.max(best, contrastRatio(wheelAt(lut, k * 40 + sh), gs));
        if (best < worstBest.r) worstBest = { r: best, id: p.id, hue: sh }; } }
    sq.push({ theme, bestSquare: +worstBest.r.toFixed(2), at: worstBest.id + ' @hue ' + worstBest.hue + '°' });
  }
  judge('W57-2 THE NINE MARK SQUARES ARE LEFT AS THE PALETTE PAINTS THEM, and the price is measured rather than assumed: the worst case over 23 × 360 leaves the BEST of the nine at ' + sq[0].bestSquare + ' : 1 on the light stage (' + sq[0].at + ') and ' + sq[1].bestSquare + ' : 1 on the dark one (' + sq[1].at + '). On a pale palette the ornament goes quiet while the wordmark beside it stays — the fix, if it is ever wanted, is a hairline EDGE in the theme\'s ink, which changes no fill by one bit',
    sq.length === 2 && sq.every((x) => x.bestSquare > 1), sq);
}

/* ══ 3. THE THIRD SURFACE: THE STAGE IS A KNOB, SO IT IS AN AXIS ════════════════════════════════════════ */
/* rack.js's STAGE knob interpolates mat.bg from THEMES.dark.bg to THEMES.light.bg — the two triples below,
   copied from rack.js and re-checked against it, so an edit there fails here rather than drifting.  markInk
   now takes the LIVE value for `#title`; this sweeps the whole travel of the knob at both themes. */
const STAGE_ENDS = { dark: [0.028, 0.038, 0.058], light: [0.93, 0.95, 0.975] };
{
  const rackSrc = fs.readFileSync(path.join(LAB, 'rack.js'), 'utf8');
  const m = rackSrc.match(/const THEMES = \{ dark: \{ bg: \[([^\]]+)\][^}]*\}, light: \{ bg: \[([^\]]+)\]/);
  judge('W59-1 the two ends of the STAGE travel in this file ARE rack.js\'s THEMES.dark.bg and THEMES.light.bg — the knob\'s range is read out of the app, not assumed',
    !!m && JSON.stringify(m[1].split(',').map(Number)) === JSON.stringify(STAGE_ENDS.dark)
        && JSON.stringify(m[2].split(',').map(Number)) === JSON.stringify(STAGE_ENDS.light),
    m ? { dark: m[1], light: m[2] } : 'THEMES not found in rack.js');

  /* markInk's own reader, transcribed: the LIVE stage for #title, the CARD constant for .nb-logo. */
  const stageAt = (v) => [0, 1, 2].map((i) => STAGE_ENDS.dark[i] + (STAGE_ENDS.light[i] - STAGE_ENDS.dark[i]) * v);
  const STAGES = [0, 0.04, 0.1, 0.2, 0.3, 0.35, 0.4, 0.5, 0.6, 0.85, 1];
  /* THE STAGE GROUND DOES NOT DEPEND ON THE THEME — mat.bg is one interpolation between the two THEMES
     values and setTheme() only picks an END of it, so this is ONE sweep, not two.  (§2 above is where the
     theme matters, because the CARD is a different colour in each.) */
  let corrected = { r: 1e9 }, raw = { r: 1e9 }, underRaw = 0, underInk = 0, n = 0, moved = 0;
  /* AND THE OLD WALK IS DRIVEN, not merely described: `bad` is visibleInk with wave 57's 0.5 threshold and
     nothing else changed, so the RED it would have produced is measured here rather than asserted away
     (ANTI-PATTERN 13 — a test that certifies a bug is a green line describing a state nothing entered). */
  const bad = (rgb, g) => { if (contrastRatio(rgb, g) >= FLOOR) return rgb;
    const lab = rgbToOklab(rgb), up = relLuminance(g) < 0.5 ? 1 : -1;
    for (let k = 1; k <= 200; k++) { const L = Math.max(0, Math.min(1, lab[0] + up * k * 0.005)), c = oklabToRgb([L, lab[1], lab[2]]);
      if (contrastRatio(c, g) >= FLOOR) return c; if (L <= 0 || L >= 1) break; }
    return oklabToRgb([up > 0 ? 1 : 0, lab[1], lab[2]]); };
  let underBad = 0, worstBad = { r: 1e9 };
  for (const v of STAGES) {
    const g = stageAt(v);
    for (const s of SWEEP) {
      n++;
      const rr = contrastRatio(s.rgb, g); if (rr < FLOOR) underRaw++;
      if (rr < raw.r) raw = { r: rr, id: s.id, d: s.d, stage: v };
      const ink = visibleInk(s.rgb, g, FLOOR), ri = contrastRatio(ink, g);
      if (ink !== s.rgb) moved++;
      if (ri < FLOOR - 1e-9) underInk++;
      if (ri < corrected.r) corrected = { r: ri, id: s.id, d: s.d, stage: v, rgb: n255(ink) };
      const rb = contrastRatio(bad(s.rgb, g), g);
      if (rb < FLOOR - 1e-9) underBad++;
      if (rb < worstBad.r) worstBad = { r: rb, id: s.id, d: s.d, stage: v };
    }
  }
  judge('W59-2 THE HEADER λ CLEARS ' + FLOOR + ' : 1 AT EVERY VALUE OF THE STAGE KNOB, not only at its shipped 0.04 — ' + n + ' samples (23 palettes × 360 hues × ' + STAGES.length + ' stage values), worst ' + corrected.r.toFixed(3) + ' : 1 (' + corrected.id + ' @' + corrected.d + '°, STAGE ' + corrected.stage + '), and the correction is a no-op on ' + (100 * (1 - moved / n)).toFixed(0) + ' % of them. UNCORRECTED against the live stage, ' + (100 * underRaw / n).toFixed(1) + ' % are under the floor and the worst is ' + raw.r.toFixed(3) + ' : 1 (' + raw.id + ' @' + raw.d + '°, STAGE ' + raw.stage + ') — the disappearance wave 57 removed, reached by a knob instead of a palette',
    underInk === 0, { corrected, raw, underRaw, underInk, moved, n });
  judge('W59-3 AND CORRECTING AGAINST THE LIVE GROUND IS NOT ENOUGH ON ITS OWN: with wave 57\'s walk-direction threshold of 0.5 — driven here, not described — ' + underBad + ' of the same ' + n + ' samples still come back UNDER the floor, worst ' + worstBad.r.toFixed(3) + ' : 1 (' + worstBad.id + ' @' + worstBad.d + '°, STAGE ' + worstBad.stage + '), because for a ground in (0.179, 0.5) the walk climbs toward a white that is itself too dark. The break-even is √0.0525 − 0.05 = ' + (Math.sqrt(0.0525) - 0.05).toFixed(10) + ', where white and black BOTH give ' + ((1.05) / (Math.sqrt(0.0525))).toFixed(3) + ' : 1 — so with that constant the reachable best is never under 3 : 1 from any ground at all',
    underBad > 0 && underInk === 0, { underBad, worstBad, underInk });
  judge('W59-4 the break-even constant is exactly where the two directions tie, checked as an identity rather than as a number typed twice: 1.05/(x+0.05) = (x+0.05)/0.05 at x = ' + (Math.sqrt(0.0525) - 0.05).toFixed(12),
    Math.abs(1.05 / (Math.sqrt(0.0525) - 0.05 + 0.05) - (Math.sqrt(0.0525) - 0.05 + 0.05) / 0.05) < 1e-12
    && /INK_BREAKEVEN = Math\.sqrt\(0\.0525\) - 0\.05/.test(fs.readFileSync(path.join(LAB, 'mir', 'palette.js'), 'utf8')),
    { x: Math.sqrt(0.0525) - 0.05, tie: 1.05 / Math.sqrt(0.0525) });

  /* AND THE CARD IS STILL A CONSTANT.  The notebook's λ is drawn on a real card, so it keeps MARK_GROUND —
     §2 above is its proof, and this line only records that the two grounds are genuinely different. */
  judge('W59-5 the two λ copies are corrected against DIFFERENT grounds, and that is the finding: the notebook\'s sits on a card (a constant) and the header\'s sits on the canvas (a knob). At the shipped STAGE 0.04 the header\'s ground is rgb(' + stageAt(0.04).map((v) => Math.round(v * 255)).join(',') + ') and the dark card is rgb(41,45,50) — a correction written for one is not a correction for the other',
    contrastRatio([1, 1, 1], stageAt(0.04)) !== contrastRatio([1, 1, 1], n01(G.darkCard)),
    { stage004: stageAt(0.04).map((v) => Math.round(v * 255)), darkCard: G.darkCard });
}

console.log('\n      floor ' + FLOOR + ' : 1 · sweep ' + SWEEP.length + ' palette × HUE samples × 2 themes, and again × 11 STAGE values · wall time ' + ((Date.now() - T0) / 1000).toFixed(1) + ' s');
console.log((FAILED ? 'RED ' : 'GREEN ') + 'ink.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
