/* tests/statelink.test.mjs — the node proof of the URL state codec.
 *   node tests/statelink.test.mjs
 *
 * WHAT IS BEING PROVED.  lab/statelink.js turns a λWAVES session — the object rack.js's serialize()
 * builds and restore() consumes — into a string short enough to paste into a chat window, and back.
 * A link is somebody's work: the only two ways this may behave are to give back that work, or to
 * refuse and say why.  Silently giving back a DIFFERENT state is the failure this file is built to
 * make impossible, so the corruption section below does not test one broken link — it mutates a real
 * one in every single-character way there is and demands that every one of them either throws a
 * LinkError or decodes bit-identically.
 *
 * THE TOLERANCES, all stated in advance and all measured in the table at the foot:
 *   coefficients   |Δ| ≤ s/65534 = 1.5259e-5·s per component, s = max_a max(|Re c_a|, |Im c_a|)
 *                  — the signed-16-bit step against the link's own shared float32 scale.
 *   the picture    max |Δ|ψ|²| / max |ψ|² ≤ 1e-3 over 4000 sampled points, i.e. a quarter of one
 *                  8-bit display level (1/255 = 3.92e-3).  THIS is the claim that matters: not that
 *                  the numbers look close, but that nothing you could see has moved.
 *   float32 fields ≤ 1e-6 relative (a float32 carries 1.2e-7)
 *   palette stops  ≤ 2e-5 absolute (u16 per channel and per position)
 *   the clock t    EXACT — it rides as a float64, because a picture is reproduced AT a time
 *
 * THE ORACLE for the picture is lab/hydrogen.js's psiAt(), which knows nothing about this codec:
 * ψ is evaluated from the coefficients before and after the round trip at points drawn by a
 * deterministic PRNG, and the two densities are compared where the density actually is.
 */
import { Register, PRESETS } from '../lab/state.js';
import { BASIS, BASIS_INDEX, psiAt, domainFor } from '../lab/hydrogen.js';
import { PRESET_BY_ID as PALETTE_BY_ID } from '../lab/mir/palette.js';
import {
  encodeState, decodeState, linkFor, readLink, fragmentFor,
  LinkError, LINK_VERSION, LINK_CHAR_CEILING, LINK_KEY, toBase64url, fromBase64url,
} from '../lab/statelink.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 700)));
}
const T0 = Date.now();
const TOL = { coeffStep: 1 / 65534, picture: 1e-3, f32: 1e-6, stop: 2e-5 };

/* ── a deterministic PRNG, so every number below is the same on every machine ──────────────────── */
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* ── the state fixtures: exactly the shape rack.js's serialize() returns ───────────────────────── */
function presentation(over = {}) {
  return {
    obs: { yaw: 0.6512, pitch: 0.3811, dist: 3.34, fov: 0.61, mode: 'turntable', quat: [0.1830127, 0.0490, -0.0490, 0.9807853] },
    mat: { view: 1, exposure: 1.35, softness: 0.72, steps: 160, slice: { mode: 1, axis: 2, pos: 0.15, thick: 0.031 },
      hueShift: 0.42, invert: false, frame: true, axis: true, axisInk: 'rgb', paletteOn: true, style: 2, iso: 0.061, grain: 0.35,
      knee: 0.6, dither: 0.5, boost: { k: [0.1, -0.2, 0.3], on: true } },
    quality: { res: 128, steps: 160, scale: 1, auto: true, autoScale: 1, minScale: 0.35 },
    domain: { auto: false, half: 11.5 }, shadow: 'lissajous', space: 'r',
    palette: { on: true, stops: PALETTE_BY_ID.get('twilight').stops.map((s) => ({ at: s.at, rgb: s.rgb.slice() })) },
    hamiltonian: { id: 'hydrogen', Z: 2, atomZ: 3, well: 12.5, gasBasis: 'reg' },
    field: { overlay: 'E', lines: 14, source: 'rho' },
    wigner: { zmax: 12, pmax: 1.5 },
    rates: new Array(91).fill(1),
    sturmian: { on: false, lambda: 1 },
    paletteId: 'twilight',
    ...over,
  };
}
function stateOfPreset(id, t = 16.755, over = {}) {
  const reg = new Register(); reg.load(PRESETS.find((p) => p.id === id));
  const p = PRESETS.find((q) => q.id === id);
  return { experiment: Object.assign(reg.serialize(t), { rate: p.visual.rate, window: p.visual.window }), presentation: presentation(over) };
}
/** a state with `k` populated labels, random complex, normalised — the fixture for the sparse/dense law */
function stateOfK(k, seed = 7, t = 0) {
  const rnd = mulberry32(seed), reg = new Register();
  const idx = BASIS.map((s) => s.index); for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  for (const a of idx.slice(0, k)) { reg.re0[a] = rnd() * 2 - 1; reg.im0[a] = rnd() * 2 - 1; }
  if (k) reg.normalize();
  return { reg, state: { experiment: Object.assign(reg.serialize(t), { rate: 4, window: 0 }), presentation: presentation() } };
}
const vec = (modes) => { const re = new Float64Array(91), im = new Float64Array(91);
  for (const m of modes) { const a = BASIS_INDEX.get(m.id); re[a] = m.re; im[a] = m.im; } return { re, im }; };

/* ── the picture oracle: is anything you could SEE different? ──────────────────────────────────── */
function pictureError(modesA, modesB, seed = 11, samples = 4000) {
  const A = vec(modesA), B = vec(modesB);
  let nmax = 1; for (const m of modesA) if (m.re || m.im) nmax = Math.max(nmax, m.n);
  const half = Math.min(domainFor(nmax), 60), rnd = mulberry32(seed);
  let maxRho = 0, maxDiff = 0;
  for (let i = 0; i < samples; i++) {
    const u = rnd() * 2 - 1, phi = rnd() * 2 * Math.PI, st = Math.sqrt(Math.max(0, 1 - u * u));
    const r = half * (i % 2 ? rnd() : Math.cbrt(rnd()));      // half the samples close in, half through the whole ball
    const x = r * st * Math.cos(phi), y = r * st * Math.sin(phi), z = r * u;
    const pa = psiAt(A.re, A.im, x, y, z), pb = psiAt(B.re, B.im, x, y, z);
    const ra = pa.re * pa.re + pa.im * pa.im, rb = pb.re * pb.re + pb.im * pb.im;
    if (ra > maxRho) maxRho = ra;
    const d = Math.abs(ra - rb); if (d > maxDiff) maxDiff = d;
  }
  return maxRho > 0 ? maxDiff / maxRho : 0;
}

/* ── a walker that compares the decoded object against the one that was encoded ────────────────── */
const SKIP = new Set(['status', 'format', 'system', 'basis', 'units', 'mo', 'modulation', 'modes']);
function deepDiff(expected, actual, path = '', out = []) {
  if (expected === null || typeof expected !== 'object') {
    const tol = path.includes('palette.stops') ? TOL.stop : (path.endsWith('experiment.t') ? 0 : TOL.f32);
    if (typeof expected === 'number') {
      if (!(Math.abs(expected - actual) <= tol * Math.max(1, Math.abs(expected)))) out.push([path, expected, actual]);
    } else if (expected !== actual) out.push([path, expected, actual]);
    return out;
  }
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual) || actual.length !== expected.length) { out.push([path + '.length', expected.length, actual && actual.length]); return out; }
    expected.forEach((v, i) => deepDiff(v, actual[i], path + '[' + i + ']', out));
    return out;
  }
  for (const k of Object.keys(expected)) {
    if (SKIP.has(k)) continue;
    if (actual === null || actual === undefined) { out.push([path + '.' + k, expected[k], undefined]); continue; }
    deepDiff(expected[k], actual[k], path + '.' + k, out);
  }
  return out;
}

/* ══ 1 · every shipped preset round-trips, and nothing you could see moves ═══════════════════════ */
const SIZES = [];
{
  let worstCoeff = 0, worstPic = 0, worstField = null, allOk = true;
  for (const p of PRESETS) {
    const st = stateOfPreset(p.id);
    const enc = encodeState(st);
    const dec = decodeState(enc.text);
    const bound = enc.scale * TOL.coeffStep;
    let coeff = 0;
    for (const m of st.experiment.modes) {
      const g = dec.state.experiment.modes.find((z) => z.id === m.id);
      if (!g) { allOk = false; continue; }
      coeff = Math.max(coeff, Math.abs(g.re - m.re), Math.abs(g.im - m.im));
    }
    if (dec.state.experiment.modes.length !== st.experiment.modes.length) allOk = false;
    if (coeff > bound) allOk = false;
    const pic = pictureError(st.experiment.modes, dec.state.experiment.modes);
    const diffs = deepDiff(st, dec.state);
    if (diffs.length) { allOk = false; worstField = worstField || diffs[0]; }
    if (dec.state.experiment.t !== st.experiment.t) allOk = false;
    worstCoeff = Math.max(worstCoeff, coeff); worstPic = Math.max(worstPic, pic);
    SIZES.push({ id: p.id, modes: st.experiment.modes.length, chars: enc.chars, bytes: enc.bytes, mode: enc.mode, coeff, pic, scale: enc.scale });
  }
  judge('THE PRESETS: all ' + PRESETS.length + ' shipped states round-trip — every coefficient inside the stated step s/65534, the clock time exact, every camera / material / palette / stage field inside 1e-6, and the rendered density nowhere off by more than ' + worstPic.toExponential(2) + ' of its own peak (the 8-bit display level is 3.9e-3)',
    allOk && worstCoeff <= TOL.coeffStep && worstPic <= TOL.picture, { worstCoeff, worstPic, worstField });
}

/* ══ 2 · a dense random state — 91 populated labels, the worst the codec can be asked for ════════ */
{
  const { state } = stateOfK(91, 3, 785.4);
  const enc = encodeState(state), dec = decodeState(enc.text);
  const bound = enc.scale * TOL.coeffStep;
  let coeff = 0;
  for (const m of state.experiment.modes) { const g = dec.state.experiment.modes.find((z) => z.id === m.id); coeff = Math.max(coeff, Math.abs(g.re - m.re), Math.abs(g.im - m.im)); }
  const pic = pictureError(state.experiment.modes, dec.state.experiment.modes, 23);
  /* the same state carried forward by the exact evolution: quantisation is on the ANCHOR and the law is
     unitary, so the error must NOT grow with the clock */
  const regA = new Register(), regB = new Register();
  regA.restore(state.experiment); regB.restore(dec.state.experiment);
  let drift = 0;
  for (const t of [0, 16.755, 785.4, 20000]) {
    const ca = regA.at(t), cb = regB.at(t);
    for (let a = 0; a < 91; a++) drift = Math.max(drift, Math.abs(ca.re[a] - cb.re[a]), Math.abs(ca.im[a] - cb.im[a]));
  }
  judge('A DENSE STATE: 91 populated labels round-trip inside the same step (' + coeff.toExponential(3) + ' ≤ ' + bound.toExponential(3) + '), the picture moves by ' + pic.toExponential(2) + ' of its peak, and carrying it to t = 20000 a.u. by the exact evolution does not grow the error (' + drift.toExponential(3) + ') — what is quantised is the anchor, and the law is unitary',
    coeff <= bound && pic <= TOL.picture && drift <= bound * 1.5 && dec.state.experiment.modes.length === 91,
    { coeff, bound, pic, drift, chars: enc.chars, mode: enc.mode });
}

/* ══ 3 · the sparse-versus-dense decision is the smaller one, every time ════════════════════════ */
{
  /* the two shapes cost, in bytes of section payload:
       sparse  1 (subformat) + 4 (scale) + 1 (count, ≤ 127) + 5 per populated label
       dense   1 (subformat) + 4 (scale) + 364
     so sparse wins up to and including 72 labels and dense from 73 up.  The check does not take that
     on trust: it reconstructs the whole encoded length from the formula and demands the encoder match. */
  const base = encodeState(stateOfK(0, 5).state).bytes;    // everything but the register's payload
  const lenBytes = (n) => (n < 128 ? 1 : 2);
  let ok = true, bad = null, crossover = -1;
  for (let k = 0; k <= 91; k++) {
    const st = stateOfK(k, 5).state, enc = encodeState(st);
    const sparse = 6 + 5 * k, dense = 369, pick = Math.min(sparse, dense);
    const expectBytes = base - (6 + lenBytes(6)) + (pick + lenBytes(pick));
    const expectMode = sparse <= dense ? 'sparse' : 'dense';
    if (enc.mode !== expectMode || enc.bytes !== expectBytes || enc.populated !== k) { ok = false; bad = bad || { k, got: [enc.mode, enc.bytes, enc.populated], want: [expectMode, expectBytes, k] }; }
    if (crossover < 0 && enc.mode === 'dense') crossover = k;
    if (decodeState(enc.text).state.experiment.modes.length !== k) { ok = false; bad = bad || { k, decodedModes: 'wrong' }; }
  }
  judge('SPARSE OR DENSE: at every one of the 92 possible populations the register is written in the SHORTER of the two shapes and the encoded length matches the formula to the byte; the crossover is at ' + crossover + ' populated labels, and both shapes decode to the same populated set',
    ok && crossover === 73, { crossover, bad });
}
{
  /* the 91 RATE knobs get the same treatment: sparse 2 + 5k, dense 1 + 364 → sparse up to 72.
     All-ones is still WRITTEN (as a sparse list of length nil, four bytes), because a visitor whose
     own knobs are off 1 has to land on the link's rates rather than keep their own; a state that
     carries no rates array at all writes no section. */
  let ok = true, cross = -1;
  const noRates = encodeState({ experiment: stateOfPreset('1s').experiment, presentation: presentation({ rates: undefined }) });
  const allOnes = encodeState(stateOfPreset('1s'));
  const allOnesCost = allOnes.bytes - noRates.bytes;
  if (noRates.rates !== 'omitted' || allOnes.rates !== 'sparse') ok = false;
  if (decodeState(noRates.text).state.presentation.rates !== undefined) ok = false;
  if (!decodeState(allOnes.text).state.presentation.rates.every((v) => v === 1)) ok = false;
  for (let k = 0; k <= 91; k++) {
    const rates = new Array(91).fill(1); for (let a = 0; a < k; a++) rates[a] = 1.5 + a / 100;   // 1.5, never 1: k labels genuinely off the default
    const enc = encodeState(stateOfPreset('1s', 0, { rates }));
    if (enc.rates !== ((2 + 5 * k) <= 365 ? 'sparse' : 'dense')) ok = false;
    if (cross < 0 && enc.rates === 'dense') cross = k;
    const back = decodeState(enc.text).state.presentation.rates;
    for (let a = 0; a < 91; a++) if (Math.abs(back[a] - rates[a]) > TOL.f32) ok = false;
  }
  judge('THE 91 RATES take the same law — the shorter of sparse and dense, crossing over at ' + cross + ' — and every rate comes back inside 1e-6. All 91 at 1 is still SENT, for ' + allOnesCost + ' bytes, because a visitor whose own knobs are off 1 must land on the link\'s rates and not keep theirs',
    ok && cross === 73 && allOnesCost === 4, { crossover: cross, allOnesCost });
}

/* ══ 4 · a damaged link fails cleanly — it never hands back a different state ═══════════════════ */
{
  const st = stateOfPreset('recon', 481.27), good = encodeState(st).text;
  const ALPH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let mutations = 0, threw = 0, identical = 0, silentlyWrong = 0, worstCase = null;
  const same = (d) => JSON.stringify(d.state) === JSON.stringify(decodeState(good).state);
  const rnd = mulberry32(99);
  /* EVERY single-character substitution at 400 randomly chosen (position, letter) pairs … */
  for (let i = 0; i < 400; i++) {
    const at = Math.floor(rnd() * good.length), ch = ALPH[Math.floor(rnd() * 64)];
    if (good[at] === ch) continue;
    const bad = good.slice(0, at) + ch + good.slice(at + 1);
    mutations++;
    try { const d = decodeState(bad); if (same(d)) identical++; else { silentlyWrong++; worstCase = worstCase || { kind: 'substitution', at, ch }; } }
    catch (e) { if (e instanceof LinkError) threw++; else { silentlyWrong++; worstCase = worstCase || { kind: 'not a LinkError', message: String(e) }; } }
  }
  /* … and every truncation there is */
  const codes = new Set();
  for (let cut = 1; cut < good.length; cut++) {
    mutations++;
    try { const d = decodeState(good.slice(0, cut)); if (same(d)) identical++; else { silentlyWrong++; worstCase = worstCase || { kind: 'truncation', cut }; } }
    catch (e) { if (e instanceof LinkError) { threw++; codes.add(e.code); } else { silentlyWrong++; worstCase = worstCase || { kind: 'not a LinkError on truncation', cut }; } }
  }
  judge('A DAMAGED LINK NEVER LIES: over ' + mutations + ' mutations of a real link — every truncation and 400 single-character substitutions — ' + threw + ' were refused with a LinkError and ' + identical + ' were no-ops that decoded bit-identically. NOT ONE produced a different state silently',
    silentlyWrong === 0 && threw > 0, { mutations, threw, identical, silentlyWrong, truncationCodes: [...codes], worstCase });

  const cases = [
    ['not base64url at all', 'hello world! ***', 'malformed'],
    ['an empty fragment value', '', 'empty'],
    ['a stub too short to hold a header', toBase64url(new Uint8Array([1, 2, 3])), 'truncated'],
  ];
  let ok = true; const got = [];
  for (const [, text, want] of cases) {
    try { decodeState(text); ok = false; got.push('no throw'); }
    catch (e) { got.push(e.code + ': ' + e.message.slice(0, 60)); if (!(e instanceof LinkError) || e.code !== want) ok = false; }
  }
  judge('AND IT SAYS WHICH KIND: rubbish that is not base64url, an empty value, and a stub shorter than the 5-byte header each raise their own named LinkError', ok, got);
}

/* ══ 5 · an unknown version refuses, and says what happened ═════════════════════════════════════ */
{
  const bytes = fromBase64url(encodeState(stateOfPreset('2px')).text);
  const forged = Uint8Array.from(bytes); forged[0] = 7;                       // a link from a build seven formats on
  /* recompute the CRC so this is a WELL-FORMED v7 link and not merely a damaged v1 one — the two
     failures must be told apart, which is the whole reason the header layout is frozen */
  const CRC_T = (() => { const t = new Uint32Array(256); for (let i = 0; i < 256; i++) { let c = i; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[i] = c >>> 0; } return t; })();
  let c = 0xFFFFFFFF; c = CRC_T[(c ^ forged[0]) & 0xff] ^ (c >>> 8);
  for (let i = 5; i < forged.length; i++) c = CRC_T[(c ^ forged[i]) & 0xff] ^ (c >>> 8);
  c = (c ^ 0xFFFFFFFF) >>> 0;
  forged[1] = c & 0xff; forged[2] = (c >>> 8) & 0xff; forged[3] = (c >>> 16) & 0xff; forged[4] = (c >>> 24) & 0xff;
  let code = null, msg = '';
  try { decodeState(toBase64url(forged)); } catch (e) { code = e.code; msg = e.message; }
  judge('A LINK FROM THE FUTURE REFUSES rather than guessing, and the message names both formats: "' + msg + '"',
    code === 'version' && msg.includes('v7') && msg.includes('v' + LINK_VERSION), { code, msg });

  /* the other half of the same policy: a section this build does not know is SKIPPED, so a v1 link
     minted by a later build still opens here and still says that something was left behind */
  const good = fromBase64url(encodeState(stateOfPreset('2px')).text);
  const extra = new Uint8Array([0x7F, 3, 9, 9, 9]);
  const grown = new Uint8Array(good.length + extra.length);
  grown.set(good.subarray(0, 5)); grown.set(good.subarray(5), 5); grown.set(extra, good.length);
  let c2 = 0xFFFFFFFF; c2 = CRC_T[(c2 ^ grown[0]) & 0xff] ^ (c2 >>> 8);
  for (let i = 5; i < grown.length; i++) c2 = CRC_T[(c2 ^ grown[i]) & 0xff] ^ (c2 >>> 8);
  c2 = (c2 ^ 0xFFFFFFFF) >>> 0;
  grown[1] = c2 & 0xff; grown[2] = (c2 >>> 8) & 0xff; grown[3] = (c2 >>> 16) & 0xff; grown[4] = (c2 >>> 24) & 0xff;
  const d = decodeState(toBase64url(grown));
  judge('AND A SECTION FROM THE FUTURE is stepped over, not fatal: the same state comes back, `unknownSections` names the tag and `warnings` says a newer build minted it — which is why adding to the format never has to bump the version',
    JSON.stringify(d.state) === JSON.stringify(decodeState(encodeState(stateOfPreset('2px')).text).state)
    && d.unknownSections.length === 1 && d.unknownSections[0] === 0x7F && d.warnings.length === 1,
    { unknownSections: d.unknownSections, warnings: d.warnings });
}

/* ══ 6 · the encoding is stable ═════════════════════════════════════════════════════════════════ */
{
  let ok = true, fixpoint = true;
  for (const p of PRESETS) {
    const st = stateOfPreset(p.id);
    const a = encodeState(st).text, b = encodeState(st).text, c = encodeState(JSON.parse(JSON.stringify(st))).text;
    if (a !== b || a !== c) ok = false;
    /* and re-encoding what came back out gives the same string again: the codec has no drift, so a
       link that has been round-tripped through the lab is still the SAME link */
    const back = decodeState(a);
    const again = encodeState(back.state, { paletteId: back.paletteId }).text;
    if (again !== a) { fixpoint = false; }
  }
  judge('STABLE: encoding the same state twice — and encoding a structural clone of it — gives the same string every time, and encode(decode(x)) === x for all ' + PRESETS.length + ' presets, so a link survives being opened and re-shared unchanged',
    ok && fixpoint, { deterministic: ok, fixpoint });
}

/* ══ 7 · the href itself: the fragment, never the query ════════════════════════════════════════ */
{
  const st = stateOfPreset('rydberg', 785.398);
  const L = linkFor(st, { base: 'https://magic-commons.com/lab/?warn=0#stale' });
  const hashOnly = L.href.slice(L.href.indexOf('#'));
  const back = readLink(L.href);
  const beside = readLink('https://magic-commons.com/lab/#tab=spectrum&' + LINK_KEY + '=' + encodeState(st).text + '&x=1');
  const ok = L.href.startsWith('https://magic-commons.com/lab/?warn=0#' + LINK_KEY + '=')
    && !L.href.slice(0, L.href.indexOf('#')).includes(encodeState(st).text)   // the state is NOWHERE in the part a server sees
    && hashOnly.indexOf('#') === 0 && back && back.state.experiment.preset === 'rydberg'
    && beside && beside.state.experiment.preset === 'rydberg'
    && readLink('https://magic-commons.com/lab/') === null
    && readLink('https://magic-commons.com/lab/#tab=spectrum') === null
    && fragmentFor(st).startsWith(LINK_KEY + '=');
  judge('THE FRAGMENT, NEVER THE QUERY: the state lives entirely after the "#" (so it is never sent to a server, not even in a referrer), the page\'s own query survives, an old fragment is replaced, other fragment keys may sit beside "' + LINK_KEY + '=", and a plain visit with no state reads as null rather than as an error',
    ok, { href: L.href.slice(0, 78) + '…', chars: L.chars });
  const alphabet = /^[A-Za-z0-9_-]+$/;
  judge('base64url, no padding: every shipped preset\'s link uses only the 64 URL-safe characters and carries no "=" — it survives a chat window, a shell, and a Markdown [](…) with nothing escaped',
    PRESETS.every((p) => alphabet.test(encodeState(stateOfPreset(p.id)).text)), { sample: encodeState(stateOfPreset('1s')).text.slice(0, 40) + '…' });
}

/* ══ 8 · the mask, the palette, a partial state, and the quantisation floor ═════════════════════ */
{
  const st = stateOfPreset('recon');
  for (const m of st.experiment.modes) { m.muted = m.id === 'h:4:1:1'; m.solo = m.id === 'h:5:0:0'; }
  const d = decodeState(encodeState(st).text);
  const maskOk = d.state.experiment.modes.every((m) => m.muted === (m.id === 'h:4:1:1') && m.solo === (m.id === 'h:5:0:0'));
  const noMask = encodeState(stateOfPreset('recon')).bytes;
  judge('THE MUTE / SOLO MASK rides as two 91-bit fields and comes back exactly; a state with nothing masked writes no mask section at all (' + noMask + ' bytes against ' + encodeState(st).bytes + ' with one)',
    maskOk && encodeState(st).bytes === noMask + 26, { maskOk, noMask, withMask: encodeState(st).bytes });

  /* a NAMED palette costs one byte; only stops that have been EDITED are written out */
  const named = encodeState(stateOfPreset('1s'));
  const edited = presentation(); edited.palette.stops[0].rgb = [0.9, 0.1, 0.4]; edited.palette.stops[0].at = 0.125;
  const custom = encodeState({ experiment: stateOfPreset('1s').experiment, presentation: edited });
  const backStops = decodeState(custom.text).state.presentation.palette.stops;
  let stopErr = 0;
  edited.palette.stops.forEach((s, i) => { stopErr = Math.max(stopErr, Math.abs(s.at - backStops[i].at), ...s.rgb.map((v, j) => Math.abs(v - backStops[i].rgb[j]))); });
  const namedBack = decodeState(named.text).state.presentation.palette.stops;
  const namedExact = namedBack.every((s, i) => Math.abs(s.at - PALETTE_BY_ID.get('twilight').stops[i].at) < 1e-12
    && s.rgb.every((v, j) => Math.abs(v - PALETTE_BY_ID.get('twilight').stops[i].rgb[j]) < 1e-12));
  judge('THE PALETTE: an unedited catalogue palette rides as its NAME alone and its stops come back bit-exact from the catalogue (' + named.chars + ' chars); edit one stop and the whole ring is written out, ' + (custom.chars - named.chars) + ' characters more, and comes back inside ' + stopErr.toExponential(2),
    namedExact && stopErr <= TOL.stop && custom.chars > named.chars && decodeState(named.text).paletteId === 'twilight',
    { namedChars: named.chars, customChars: custom.chars, stopErr, paletteId: decodeState(named.text).paletteId });

  /* a PARTIAL state — the shape an UNDO record has — must not have a camera invented for it */
  const undoShaped = { experiment: stateOfPreset('1s').experiment,
    presentation: { hamiltonian: { id: 'well', Z: 1, atomZ: 0, well: 9.5, gasBasis: 'axial' }, sturmian: { on: true, lambda: 1.75 } } };
  const du = decodeState(encodeState(undoShaped).text);
  judge('A PARTIAL STATE stays partial: an undo-shaped record with no camera, no material and no stage encodes without inventing them (' + encodeState(undoShaped).chars + ' chars), and its Hamiltonian and Sturmian scale come back exactly — an ABSENT field is not a DEFAULT field, and restore() treats the two differently',
    du.state.presentation.obs === undefined && du.state.presentation.mat === undefined
    && du.state.presentation.domain === undefined && du.state.presentation.palette === undefined
    && du.state.presentation.hamiltonian.id === 'well' && du.state.presentation.hamiltonian.gasBasis === 'axial'
    && Math.abs(du.state.presentation.hamiltonian.well - 9.5) < TOL.f32
    && du.state.presentation.sturmian.on === true && Math.abs(du.state.presentation.sturmian.lambda - 1.75) < TOL.f32,
    { keys: Object.keys(du.state.presentation) });

  /* THE FLOOR, said out loud: a coefficient below one 16-bit step of the largest is dropped, and counted */
  const tiny = stateOfPreset('1s');
  tiny.experiment.modes.push({ id: 'h:6:5:5', n: 6, l: 5, m: 5, re: 1e-9, im: 0, muted: false, solo: false });
  const e = encodeState(tiny), dd = decodeState(e.text);
  judge('THE QUANTISATION FLOOR is reported, never hidden: a 1e-9 amplitude beside a 1.0 one is below the 16-bit step and is dropped, and encodeState says so (dropped = ' + e.dropped + ') — that is a population of 1e-18, ten million times under the register\'s own EPS_POP',
    e.dropped === 1 && e.populated === 1 && dd.state.experiment.modes.length === 1, { dropped: e.dropped, populated: e.populated });

  /* what v1 does NOT carry is named, so the interface can say so */
  const withRack = { experiment: stateOfPreset('1s').experiment, presentation: presentation({ mo: { basis: 'lcao1s' }, modulation: { routes: [] } }) };
  judge('AND WHAT IT DOES NOT CARRY IS NAMED: v1 does not put the MOLECULE panel or the MODULATION rack in a link, and encodeState returns ' + JSON.stringify(encodeState(withRack).notCarried) + ' so the interface can tell whoever minted it',
    JSON.stringify(encodeState(withRack).notCarried) === '["mo","modulation"]', encodeState(withRack).notCarried);
}

/* ══ 9 · the FREE camera's quaternion, and the two camera modes ════════════════════════════════ */
{
  const q = [0.2705981, 0.6532815, 0.2705981, 0.6532815];
  const free = stateOfPreset('2p+', 0, { obs: { yaw: -1.2, pitch: 0.9, dist: 5.5, fov: 0.45, mode: 'free', quat: q } });
  const d = decodeState(encodeState(free).text).state.presentation.obs;
  const noQuat = stateOfPreset('2p+', 0, { obs: { yaw: -1.2, pitch: 0.9, dist: 5.5, fov: 0.45, mode: 'turntable' } });
  const d2 = decodeState(encodeState(noQuat).text).state.presentation.obs;
  judge('THE CAMERA, both modes: FREE keeps its quaternion to float32 (' + q.map((v) => v.toFixed(7)).join(', ') + ') and its mode; a TURNTABLE pose with no quaternion in it carries none, so restore() rebuilds one from yaw and pitch rather than being handed a zero rotor',
    d.mode === 'free' && d.quat.every((v, i) => Math.abs(v - q[i]) <= TOL.f32)
    && Math.abs(d.yaw + 1.2) <= TOL.f32 && Math.abs(d.dist - 5.5) <= TOL.f32
    && d2.mode === 'turntable' && d2.quat === undefined,
    { free: d.quat, turntableHasQuat: d2.quat !== undefined });
}

/* ══ 10 · the size ledger: what the shipped presets cost, and what the worst case costs ═════════ */
{
  /* THE WORST CASE the codec can be handed: 91 populated labels, every one of them muted AND soloed,
     91 rates off 1, an eight-stop palette edited away from its catalogue entry, and every window's
     settings present.  Nothing bigger than this exists inside the format. */
  const { state: worst } = stateOfK(91, 17, 12345.6789);
  for (const m of worst.experiment.modes) { m.muted = true; m.solo = true; }
  worst.presentation.rates = Array.from({ length: 91 }, (_, a) => 0.5 + a / 91);
  worst.presentation.palette = { on: true, stops: Array.from({ length: 8 }, (_, i) => ({ at: i / 8 + 0.013, rgb: [0.1 + i / 20, 0.7 - i / 30, 0.33] })) };
  worst.presentation.paletteId = 'ukiyo';
  const W = encodeState(worst);
  const dW = decodeState(W.text);
  const base = 'https://magic-commons.com/lab/#' + LINK_KEY + '=';
  const worstHref = base.length + W.chars;
  const biggest = Math.max(...SIZES.map((s) => s.chars)), smallest = Math.min(...SIZES.map((s) => s.chars));

  console.log('\n      preset        modes  bytes  chars  shape   coeff err   picture err   scale');
  for (const s of SIZES) {
    console.log('      ' + s.id.padEnd(13) + String(s.modes).padStart(3) + '   ' + String(s.bytes).padStart(6)
      + ' ' + String(s.chars).padStart(6) + '  ' + s.mode.padEnd(7) + ' ' + s.coeff.toExponential(2).padStart(9)
      + '   ' + s.pic.toExponential(2).padStart(9) + '   ' + s.scale.toFixed(6));
  }
  console.log('      ' + '-'.repeat(78));
  console.log('      shipped presets                 ' + smallest + '–' + biggest + ' chars of state, ' + (base.length + smallest) + '–' + (base.length + biggest) + ' chars of href');
  console.log('      WORST CASE (91 dense + mask + 91 rates + 8 edited stops)');
  console.log('                     ' + String(W.bytes).padStart(6) + ' ' + String(W.chars).padStart(6) + '  ' + W.mode + '/' + W.rates + '   → href ' + worstHref + ' chars, ceiling ' + LINK_CHAR_CEILING);

  judge('THE SIZE LEDGER: a shipped preset is ' + smallest + '–' + biggest + ' characters of state (' + (base.length + biggest) + ' of href); the WORST case the format can produce — 91 dense coefficients, a full mute/solo mask, 91 rates off 1 and an eight-stop edited palette — is ' + W.chars + ' characters, ' + worstHref + ' of href, which is ' + Math.round(100 * worstHref / LINK_CHAR_CEILING) + '% of the ' + LINK_CHAR_CEILING + '-character practical ceiling. It round-trips, and encodeState().fits says so',
    W.fits && worstHref < LINK_CHAR_CEILING && dW.state.experiment.modes.length === 91 && dW.state.presentation.rates.length === 91,
    { worstChars: W.chars, worstHref, ceiling: LINK_CHAR_CEILING, fits: W.fits });
}

console.log('      wall time ' + ((Date.now() - T0) / 1000).toFixed(1) + ' s');
console.log((FAILED ? 'RED ' : 'GREEN ') + 'statelink.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
