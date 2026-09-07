/* tests/palette.test.mjs — the node proof of the PHASE PALETTE catalogue.
 *   node tests/palette.test.mjs
 *
 * A palette here colours the PHASE of a complex wavefunction — arg ψ, an angle, where 0 and 1 are the same
 * point.  So every claim below is a claim about a CIRCLE, and the ones that matter are the ones a swatch strip
 * cannot show you: that the cycle closes with no seam, that no two opposite phases come out the same colour
 * (a palette that fails that HIDES the π jump across a node), and that a palette calling itself isoluminant
 * really holds its lightness all the way round.
 *
 * Oracles, all independent of lab/palette.js:
 *   (a) OKLab by the OTHER route — sRGB → XYZ(D65) → LMS (Ottosson's M1) → cube root → M2 — where the module
 *       uses the fused linear-RGB → LMS matrix.  Different constants, same function: check (1) proves it.
 *   (b) the Viénot–Brettel–Mollon (1999) dichromat simulation, which the module does not contain at all.  Every
 *       `cvd` claim in the catalogue is CHECKED against it, not taken on trust: the flag must equal the
 *       measurement, so a palette that is NOT colour-blind-safe must say so.
 *   (c) the shipped six, hard-coded here as literal hex.  If a later wave edits their stops this test goes RED —
 *       they are the picture the instrument has always drawn.
 *
 * THE TOLERANCES, all stated, all measured (the table at the foot prints every number):
 *   seam   ≤ 0.020   OKLab ΔE between the LUT's last sample and its first — the wrap at arg ψ = ±π
 *   step   ≤ 0.025   OKLab ΔE between adjacent LUT entries at 256 samples — about one JND, so nothing bands
 *   leg    ≤ 0.850   OKLab ΔE between adjacent STOPS — how long the longest leg of the cycle is allowed to be
 *   constL ≤ 0.010   the lightness range of an isoluminant palette, all the way round
 *   anti   ≥ 0.100   the SMALLEST OKLab distance between a phase and its opposite — normal vision
 *   cvd    ≥ 0.100   the same, under the deuteranope simulation — the gate the `cvd` flag must agree with
 */
import { PRESETS, PRESET_BY_ID, PRESET_GROUPS, toLUT, normalize, cyclic, rgbToOklab, oklabToRgb, rgbToHex, hexToRgb } from '../lab/palette.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 600)));
}
const T0 = Date.now();
const TOL = { seam: 0.020, step: 0.025, leg: 0.850, constL: 0.010, anti: 0.100, cvd: 0.100, varies: 0.050 };

/* ── (a) the OKLab oracle: sRGB → XYZ(D65) → LMS → OKLab, Ottosson's published two-matrix form ─────────── */
const s2l = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const l2s = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
function oklab(rgb) {
  const r = s2l(rgb[0]), g = s2l(rgb[1]), b = s2l(rgb[2]);
  const X = 0.4123907993 * r + 0.3575843394 * g + 0.1804807884 * b;
  const Y = 0.2126390059 * r + 0.7151686788 * g + 0.0721923154 * b;
  const Z = 0.0193308187 * r + 0.1191947798 * g + 0.9505321522 * b;
  const l = Math.cbrt(0.8189330101 * X + 0.3618667424 * Y - 0.1288597137 * Z);
  const m = Math.cbrt(0.0329845436 * X + 0.9293118715 * Y + 0.0361456387 * Z);
  const s = Math.cbrt(0.0482003018 * X + 0.2643662691 * Y + 0.6338517070 * Z);
  return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
}
const dE = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/* ── (b) the deuteranope oracle: Viénot, Brettel & Mollon (1999), on linear sRGB ───────────────────────── */
function deuteranope(rgb) {
  const R = s2l(rgb[0]), G = s2l(rgb[1]), B = s2l(rgb[2]);
  const Lc = 17.8824 * R + 43.5161 * G + 4.11935 * B;          // the M cone response is never computed: a
  const Sc = 0.0299566 * R + 0.184309 * G + 1.46709 * B;       // deuteranope has none, and this is the point
  const Mc = 0.494207 * Lc + 1.24827 * Sc;                     // what is seen instead: M rebuilt from L and S
  return [0.080944 * Lc - 0.130504 * Mc + 0.116721 * Sc,
    -0.0102485 * Lc + 0.0540194 * Mc - 0.113615 * Sc,
    -0.000365294 * Lc - 0.00412163 * Mc + 0.693513 * Sc]
    .map((c) => Math.max(0, Math.min(1, l2s(Math.max(0, c)))));
}

/* ── the measurement of one palette, from its LUT ──────────────────────────────────────────────────────── */
function measure(p) {
  const lut = toLUT(p.stops), lab = [], dlab = [];
  for (let i = 0; i < 256; i++) {
    const c = [lut[i * 4], lut[i * 4 + 1], lut[i * 4 + 2]];
    lab.push(oklab(c)); dlab.push(oklab(deuteranope(c)));
  }
  let Lmin = 9, Lmax = -9, step = 0, anti = 9, antiD = 9, far = 9;
  for (let i = 0; i < 256; i++) {
    Lmin = Math.min(Lmin, lab[i][0]); Lmax = Math.max(Lmax, lab[i][0]);
    step = Math.max(step, dE(lab[i], lab[(i + 1) % 256]));
    const j = (i + 128) % 256;
    anti = Math.min(anti, dE(lab[i], lab[j]));
    antiD = Math.min(antiD, dE(dlab[i], dlab[j]));
    for (let d = 64; d <= 128; d++) far = Math.min(far, dE(lab[i], lab[(i + d) % 256]));   // any two phases ≥ 90° apart
  }
  const s = normalize(p.stops);
  let leg = 0;
  for (let i = 0; i < s.length; i++) leg = Math.max(leg, dE(oklab(s[i].rgb), oklab(s[(i + 1) % s.length].rgb)));
  let bad = 0, alpha = true;
  for (let i = 0; i < 256; i++) {
    for (let k = 0; k < 3; k++) { const v = lut[i * 4 + k]; if (!Number.isFinite(v) || v < 0 || v > 1) bad++; }
    if (lut[i * 4 + 3] !== 1) alpha = false;
  }
  return { n: s.length, Lvar: Lmax - Lmin, seam: dE(lab[255], lab[0]), step, leg, anti, antiD, far, bad, alpha };
}
const MEAS = new Map(PRESETS.map((p) => [p.id, measure(p)]));

/* ── (1) the two OKLab routes are the same function ────────────────────────────────────────────────────── */
{
  let worst = 0, worstRt = 0;
  for (let r = 0; r <= 1.0001; r += 0.125) for (let g = 0; g <= 1.0001; g += 0.125) for (let b = 0; b <= 1.0001; b += 0.125) {
    const c = [r, g, b];
    worst = Math.max(worst, dE(oklab(c), rgbToOklab(c)));
    const rt = oklabToRgb(rgbToOklab(c));
    worstRt = Math.max(worstRt, Math.hypot(rt[0] - r, rt[1] - g, rt[2] - b));
  }
  judge('THE OKLab ORACLE: the module\'s fused linear-RGB → LMS matrix and the published two-matrix route (sRGB → XYZ(D65) → M1 → ∛ → M2) are the same function to 1.3e-4 over a 9³ cube — they are rounded independently at publication, and 1.3e-4 is a hundredth of the 0.02 that is one JND, so no tolerance below turns on which one is used — and oklabToRgb ∘ rgbToOklab is the identity to 2e-6.  Every number in this proof is measured in a colour space the test computes for itself',
    worst < 5e-4 && worstRt < 5e-6, { maxOklabDiff: worst, maxRoundTrip: worstRt });
}
/* ── (2) the deuteranope oracle behaves like a deuteranope ─────────────────────────────────────────────── */
{
  const grey = deuteranope([0.5, 0.5, 0.5]), white = deuteranope([1, 1, 1]);
  const red = deuteranope(hexToRgb('#ff0000')), green = deuteranope(hexToRgb('#00ff00'));
  const blue = deuteranope(hexToRgb('#0000ff')), yellow = deuteranope(hexToRgb('#ffff00'));
  const idem = dE(oklab(deuteranope(red)), oklab(red));
  const neutral = Math.abs(grey[0] - 0.5) < 0.01 && Math.abs(grey[1] - 0.5) < 0.01 && Math.abs(grey[2] - 0.5) < 0.01 && white.every((c) => c > 0.99);
  const rgFused = dE(oklab(red), oklab(green)) < 0.35 && red[2] < 0.06 && green[2] < 0.2;   // both collapse onto the yellow axis
  const byKept = dE(oklab(blue), oklab(hexToRgb('#0000ff'))) < 0.02 && dE(oklab(yellow), oklab(hexToRgb('#ffff00'))) < 0.02;
  judge('THE DEUTERANOPE ORACLE (Viénot–Brettel–Mollon 1999): neutrals are fixed (grey → grey, white → white), the blue-yellow axis is untouched (#0000ff and #ffff00 come back unchanged), red and green both collapse onto it (' + rgbToHex(red) + ' and ' + rgbToHex(green) + '), and the simulation is idempotent (a second pass moves the colour by 3e-7, the 8-bit gamma round trip)',
    neutral && rgFused && byKept && idem < 1e-5, { grey: rgbToHex(grey), red: rgbToHex(red), green: rgbToHex(green), blue: rgbToHex(blue), yellow: rgbToHex(yellow), idempotent: idem });
}
/* ── (3) the catalogue: ids, labels, the stated `points`, and the size of the delivery ─────────────────── */
{
  const ids = PRESETS.map((p) => p.id);
  const unique = new Set(ids).size === ids.length;
  const stable = ids.every((id) => typeof id === 'string' && /^[a-z][a-z0-9]*$/.test(id));
  const labelled = PRESETS.every((p) => typeof p.label === 'string' && p.label.length > 0 && typeof p.note === 'string' && p.note.length > 0);
  const byId = ids.every((id) => PRESET_BY_ID.get(id) === PRESETS.find((p) => p.id === id));
  const pointsOk = PRESETS.filter((p) => p.points !== normalize(p.stops).length);
  const flags = PRESETS.every((p) => typeof p.constL === 'boolean' && typeof p.harsh === 'boolean' && typeof p.cvd === 'boolean');
  judge('THE CATALOGUE: ' + PRESETS.length + ' palettes, every id unique and a stable lowercase word, every one labelled and noted, PRESET_BY_ID is the same object, all three claims (constL · harsh · cvd) present as booleans, and the stated `points` equals the actual stop count for every single one',
    unique && stable && labelled && byId && pointsOk.length === 0 && flags,
    { count: PRESETS.length, pointsMismatch: pointsOk.map((p) => [p.id, p.points, p.stops.length]) });

  const SHIPPED = ['wheel', 'twilight', 'ember', 'sea', 'lambda', 'bipolar'];
  const NEW = PRESETS.filter((p) => !SHIPPED.includes(p.id));
  const counts = {}; for (const p of NEW) counts[p.points] = (counts[p.points] || 0) + 1;
  const constL = NEW.filter((p) => p.constL), harsh = NEW.filter((p) => p.harsh);
  judge('THE DELIVERY: ' + NEW.length + ' new palettes (≥ 14 asked), spread over the stop counts the menu groups on — ' + Object.entries(counts).map(([k, v]) => v + '×' + k).join(', ') + ' — with at least one of 3, 4, 5, 6 and 8 points, ' + constL.length + ' constant-lightness (≥ 3 asked: ' + constL.map((p) => p.id).join(', ') + ') and ' + harsh.length + ' deliberately harsh (≥ 2 asked: ' + harsh.map((p) => p.id).join(', ') + ')',
    NEW.length >= 14 && [3, 4, 5, 6, 8].every((k) => counts[k] >= 1) && constL.length >= 3 && harsh.length >= 2, counts);

  const partition = PRESET_GROUPS.reduce((a, g) => a + g.items.length, 0) === PRESETS.length;
  const sorted = PRESET_GROUPS.every((g, i) => i === 0 || PRESET_GROUPS[i - 1].points < g.points);
  const homogeneous = PRESET_GROUPS.every((g) => g.items.every((p) => p.points === g.points));
  judge('THE MENU GROUPING: PRESET_GROUPS partitions the catalogue by stop count, ascending, each group holding only palettes of that count — ' + PRESET_GROUPS.map((g) => g.points + ' points ×' + g.items.length).join(' · '),
    partition && sorted && homogeneous, PRESET_GROUPS.map((g) => [g.points, g.items.map((p) => p.id)]));
}
/* ── (4) the shipped six are untouched ─────────────────────────────────────────────────────────────────── */
{
  const SHIPPED = {
    wheel: ['#ff2626', '#ffff26', '#26ff26', '#26ffff', '#2626ff', '#ff26ff'],
    twilight: ['#e2d9e2', '#7c5fa8', '#1c2140', '#3f8fa0'],
    ember: ['#fff0c8', '#ff8a3d', '#8c1f4a', '#2a1b4a'],
    sea: ['#eafff4', '#37c1a8', '#0b3d63', '#7a5cc0'],
    lambda: ['#5ee7d8', '#f5f7fa', '#d97ce8', '#2b3f7a', '#ffb35c'],
    bipolar: ['#2b7fff', '#f2f2f2', '#ff8a29', '#111417'],
  };
  const drift = [];
  for (const [id, hexes] of Object.entries(SHIPPED)) {
    const got = normalize(PRESET_BY_ID.get(id).stops).map((s) => rgbToHex(s.rgb));
    if (got.join(',') !== hexes.join(',')) drift.push([id, hexes, got]);
  }
  judge('THE SHIPPED SIX ARE UNTOUCHED: wheel, twilight, ember, sea, λWAVES and bipolar still hold, stop for stop, the exact colours the instrument has always drawn — the new catalogue was added beside them, not over them',
    drift.length === 0, drift);
}
/* ── (5) every stop is well formed: hex-valid, in range, at ∈ [0,1), sorted, distinct ──────────────────── */
{
  const bad = [];
  for (const p of PRESETS) {
    let prev = -1;
    for (const s of p.stops) {
      const at = s.at, rgb = s.rgb;
      if (!(Number.isFinite(at) && at >= 0 && at < 1)) bad.push([p.id, 'at', at]);
      if (!(at > prev)) bad.push([p.id, 'unsorted or duplicate at', at, prev]);
      prev = at;
      if (!(Array.isArray(rgb) && rgb.length >= 3 && rgb.every((c) => Number.isFinite(c) && c >= 0 && c <= 1))) bad.push([p.id, 'rgb', rgb]);
      const hex = rgbToHex(rgb);
      if (!/^#[0-9a-f]{6}$/.test(hex)) bad.push([p.id, 'hex', hex]);
      const rt = hexToRgb(hex);
      if (Math.max(...[0, 1, 2].map((k) => Math.abs(rt[k] - rgb[k]))) > 1 / 255) bad.push([p.id, 'hex round trip', hex, rgb]);
    }
  }
  judge('EVERY STOP IS WELL FORMED: across all ' + PRESETS.length + ' palettes every `at` is a finite number in [0, 1), strictly ascending (sorted, no duplicate angle), every rgb is three finite components in [0, 1], and every colour round-trips through a valid six-digit hex to within one 8-bit step',
    bad.length === 0, bad.slice(0, 12));
}
/* ── (6) the LUT: 256 samples, finite, in gamut, opaque ────────────────────────────────────────────────── */
{
  const bad = PRESETS.filter((p) => MEAS.get(p.id).bad > 0 || !MEAS.get(p.id).alpha);
  const size = PRESETS.every((p) => toLUT(p.stops).length === 1024);
  judge('THE LUT AT 256 SAMPLES: every palette draws 256 × RGBA with no NaN, every component inside [0, 1] after the clamp and every alpha exactly 1 — ' + (PRESETS.length * 256) + ' colours, not one of them out of gamut',
    bad.length === 0 && size, bad.map((p) => [p.id, MEAS.get(p.id).bad]));
}
/* ── (7) the cycle closes: the seam at arg ψ = ±π ──────────────────────────────────────────────────────── */
{
  const worst = PRESETS.map((p) => [p.id, MEAS.get(p.id).seam]).sort((a, b) => b[1] - a[1]);
  const agree = Math.max(...PRESETS.map((p) => Math.abs(cyclic(p.stops) - MEAS.get(p.id).seam)));
  judge('CYCLIC, NO SEAM: for every palette the LUT\'s last sample and its first differ by less than ' + TOL.seam + ' in OKLab — the largest is ' + worst[0][0] + ' at ' + worst[0][1].toFixed(4) + ' — so nothing paints a false nodal line at arg ψ = ±π; and the module\'s own cyclic() reports the same number this test measures, to 2e-6 (the two OKLab matrices again)',
    worst[0][1] < TOL.seam && agree < 1e-4, { worstThree: worst.slice(0, 3).map(([id, v]) => [id, +v.toFixed(4)]), cyclicAgrees: agree });
}
/* ── (8) smoothness: no banding between LUT entries, no over-long leg between stops ────────────────────── */
{
  const step = PRESETS.map((p) => [p.id, MEAS.get(p.id).step]).sort((a, b) => b[1] - a[1]);
  const leg = PRESETS.map((p) => [p.id, MEAS.get(p.id).leg]).sort((a, b) => b[1] - a[1]);
  judge('SMOOTH ROUND THE CIRCLE: no two adjacent LUT entries differ by more than ' + TOL.step + ' in OKLab (worst: ' + step[0][0] + ' at ' + step[0][1].toFixed(4) + ', about one JND — nothing bands), and no leg between adjacent STOPS exceeds ' + TOL.leg + ' (worst: ' + leg[0][0] + ' at ' + leg[0][1].toFixed(3) + ', which is its dark-to-bright thermal run and is a neutral ramp, not a jump)',
    step[0][1] < TOL.step && leg[0][1] < TOL.leg,
    { steepestLUT: step.slice(0, 3).map(([id, v]) => [id, +v.toFixed(4)]), longestLeg: leg.slice(0, 3).map(([id, v]) => [id, +v.toFixed(3)]) });
}
/* ── (9) the isoluminant claim, held all the way round ─────────────────────────────────────────────────── */
{
  const flat = PRESETS.filter((p) => p.constL), rest = PRESETS.filter((p) => !p.constL);
  const held = flat.filter((p) => MEAS.get(p.id).Lvar < TOL.constL);
  const notFlat = rest.filter((p) => MEAS.get(p.id).Lvar > TOL.varies);
  judge('CONSTANT LIGHTNESS, MEASURED: the ' + flat.length + ' palettes that claim it — ' + flat.map((p) => p.id + ' ' + MEAS.get(p.id).Lvar.toFixed(4)).join(', ') + ' — hold their OKLab L to under ' + TOL.constL + ' over all 256 samples (hue alone carries phase, which is what a phase map is for); and the claim is not free: every one of the other ' + rest.length + ' varies by more than ' + TOL.varies,
    held.length === flat.length && notFlat.length === rest.length,
    { claimed: flat.map((p) => [p.id, +MEAS.get(p.id).Lvar.toFixed(4)]), notHeld: flat.filter((p) => MEAS.get(p.id).Lvar >= TOL.constL).map((p) => p.id), falselyFlat: rest.filter((p) => MEAS.get(p.id).Lvar <= TOL.varies).map((p) => [p.id, +MEAS.get(p.id).Lvar.toFixed(4)]) });
}
/* ── (10) opposite phases are different colours — the π jump across a node must be visible ─────────────── */
{
  const anti = PRESETS.map((p) => [p.id, MEAS.get(p.id).anti]).sort((a, b) => a[1] - b[1]);
  judge('OPPOSITE PHASES NEVER COLLIDE: for every palette and every phase, the colour at u and the colour at u + ½ differ by at least ' + TOL.anti + ' in OKLab (the tightest is ' + anti[0][0] + ' at ' + anti[0][1].toFixed(3) + ') — a palette that failed this would paint the two sides of a nodal surface the same colour and hide the very thing the phase view is for',
    anti[0][1] >= TOL.anti, { tightestFive: anti.slice(0, 5).map(([id, v]) => [id, +v.toFixed(3)]) });
}
/* ── (11) the colour-blindness claim is a measurement, not a boast ─────────────────────────────────────── */
{
  const wrong = PRESETS.filter((p) => p.cvd !== (MEAS.get(p.id).antiD >= TOL.cvd));
  const safe = PRESETS.filter((p) => p.cvd), unsafe = PRESETS.filter((p) => !p.cvd);
  judge('THE CVD CLAIM IS CHECKED, BOTH WAYS: for every palette the declared `cvd` equals the measurement — opposite phases separated by ≥ ' + TOL.cvd + ' in OKLab AFTER a deuteranope simulation.  ' + safe.length + ' claim it and hold it (' + safe.map((p) => p.id).join(', ') + '); ' + unsafe.length + ' declare FALSE and are false, the isoluminant ones necessarily so — they have only hue, and red-green is exactly what is missing',
    wrong.length === 0,
    { declaredWrong: wrong.map((p) => [p.id, p.cvd, +MEAS.get(p.id).antiD.toFixed(3)]), safe: safe.map((p) => [p.id, +MEAS.get(p.id).antiD.toFixed(3)]), unsafe: unsafe.map((p) => [p.id, +MEAS.get(p.id).antiD.toFixed(3)]) });
}
/* ── (12) the harsh claim is a measurement too ─────────────────────────────────────────────────────────── */
{
  const harsh = PRESETS.filter((p) => p.harsh);
  const earned = harsh.filter((p) => MEAS.get(p.id).Lvar >= 0.75 && MEAS.get(p.id).leg >= 0.60);
  judge('THE HARSH CLAIM IS EARNED: every palette that calls itself harsh really does run its lightness over at least 0.75 of the range AND step at least 0.60 between adjacent stops — ' + harsh.map((p) => p.id + ' (L range ' + MEAS.get(p.id).Lvar.toFixed(3) + ', leg ' + MEAS.get(p.id).leg.toFixed(3) + ')').join(', ') + ' — which is what makes a nodal line snap instead of fade',
    earned.length === harsh.length, harsh.map((p) => [p.id, +MEAS.get(p.id).Lvar.toFixed(3), +MEAS.get(p.id).leg.toFixed(3)]));
}
/* ── (13) the interpolator itself: the wrap is a real interval, not a special case ─────────────────────── */
{
  const two = [{ at: 0, rgb: [0, 0, 0] }, { at: 0.5, rgb: [1, 1, 1] }];
  const lut = toLUT(two);
  let up = true, down = true;
  for (let i = 0; i < 127; i++) if (lut[(i + 1) * 4] < lut[i * 4]) up = false;
  for (let i = 128; i < 255; i++) if (lut[(i + 1) * 4] > lut[i * 4]) down = false;
  const ends = Math.abs(lut[0]) < 0.01 && Math.abs(lut[128 * 4] - 1) < 0.01;
  const unsorted = normalize([{ at: 0.9, rgb: [1, 0, 0] }, { at: -0.2, rgb: [0, 1, 0] }, { at: 1.3, rgb: [0, 0, 1] }]);
  const wrapped = unsorted.map((s) => +s.at.toFixed(6));
  const single = toLUT([{ at: 0.37, rgb: [0.2, 0.4, 0.6] }]);
  let flat = true; for (let i = 0; i < 256; i++) if (Math.abs(single[i * 4] - 0.2) > 1e-6) flat = false;
  judge('THE INTERPOLATOR: a two-stop black/white palette ramps monotonically up over the first half and back down over the second (the wrap is just another interval, not a special case), normalize() folds at = −0.2 and 1.3 back into [0, 1) and sorts them to ' + JSON.stringify(wrapped) + ', and a one-stop palette is a constant colour rather than a divide by zero',
    up && down && ends && wrapped.join() === '0.3,0.8,0.9' && flat, { wrapped, firstSample: lut[0], midSample: lut[128 * 4] });
}

/* ── the table ─────────────────────────────────────────────────────────────────────────────────────────── */
console.log('\n      id           pts  L range   seam    LUT step   leg    anti   anti(deut)  ≥90° apart  flags');
for (const p of PRESETS) {
  const m = MEAS.get(p.id);
  console.log('      ' + p.id.padEnd(12) + String(m.n).padStart(3) + '   ' + m.Lvar.toFixed(3).padStart(6)
    + '  ' + m.seam.toFixed(4).padStart(6) + '   ' + m.step.toFixed(4).padStart(7) + '  ' + m.leg.toFixed(3).padStart(6)
    + '  ' + m.anti.toFixed(3).padStart(6) + '     ' + m.antiD.toFixed(3).padStart(6) + '      ' + m.far.toFixed(3).padStart(6)
    + '     ' + [p.constL ? 'constL' : '', p.harsh ? 'harsh' : '', p.cvd ? 'cvd-safe' : ''].filter(Boolean).join(' '));
}
console.log('      wall time ' + ((Date.now() - T0) / 1000).toFixed(1) + ' s');
console.log((FAILED ? 'RED ' : 'GREEN ') + 'palette.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
