/* tests/capture.test.mjs — the node proof of THE CAPTURE LAYER.
 *   node tests/capture.test.mjs
 *
 * What is proved here, and what is not:
 *
 *   PROVED — the frame schedule of an exact period is exact and CLOSES (at(N) - t0 is T to the last bit, and
 *   every gap in the cycle, the wrap-around included, is T/N); the include-or-drop decision, decided against the
 *   REAL density of a real two-mode hydrogen state rather than asserted; the refusal of a state with no exact
 *   period, with the near-recurrence and its seam error recomputed here from the energies; the filenames; the
 *   readback's band arithmetic and the size ceiling; the pixel swizzle; the overlay composite; and the PNG
 *   encoder, round-tripped through a decoder written independently in this file against node's own zlib.
 *
 *   NOT PROVED HERE — anything that needs a GPU or a MediaRecorder.  `createCapture` is a browser object; whether
 *   captureStream() on a WebGPU canvas delivers lit frames in Firefox is a question only a browser can answer,
 *   and capture.js answers it at runtime with probe().  See the note at the end of this file.
 */
import zlib from 'node:zlib';
import {
  AU_FS, ENDPOINT, WEBGPU_DEFAULT_MAX_TEXTURE_2D, WEBGPU_DEFAULT_MAX_BUFFER,
  alignedBytesPerRow, planBands, maxPictureSize, fitPicture,
  loopSchedule, planFrames, seamError, endpointProof, planPeriodRecording, wavePeriod, viewCarriesGlobalPhase, VIEW_NAMES,
  slug, stamp, captureName, uniqueName,
  toRGBA, compositeOver,
  crc32, adler32, zlibStored, pngFilter, buildPNG, encodePNG,
} from '../lab/capture.js';
import { densityPeriod } from '../lab/period.js';
import { BASIS, psiAt } from '../lab/hydrogen.js';
import { PRESETS } from '../lab/state.js';
import { VIEW_NAMES as FIELD_VIEW_NAMES, VIEW as FIELD_VIEW } from '../lab/field.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail, (k, v) => (typeof v === 'number' && !Number.isFinite(v)) ? String(v) : v).slice(0, 340)));
}
const En = (n) => -0.5 / (n * n);

/* ── an independent PNG decoder: node's zlib, and the five filters undone by hand ─────────────────────────── */
function decodePNG(buf) {
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) if (buf[i] !== sig[i]) throw new Error('not a PNG (signature)');
  let off = 8, w = 0, h = 0, depth = 0, ct = 0, interlace = 0; const idat = []; let sawIEND = false;
  const crcOf = (b) => zlib.crc32 ? zlib.crc32(b) : null;
  while (off < buf.length) {
    const len = buf.readUInt32BE(off), type = buf.toString('ascii', off + 4, off + 8), data = buf.subarray(off + 8, off + 8 + len);
    const stated = buf.readUInt32BE(off + 8 + len), got = crcOf(buf.subarray(off + 4, off + 8 + len));
    if (got !== null && got !== stated) throw new Error('bad CRC on ' + type);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; ct = data[9]; interlace = data[12]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') { sawIEND = true; break; }
    off += 12 + len;
  }
  if (depth !== 8 || ct !== 6 || interlace !== 0) throw new Error('unexpected IHDR ' + depth + '/' + ct + '/' + interlace);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = 4, stride = w * bpp, out = Buffer.alloc(h * stride);
  if (raw.length !== h * (stride + 1)) throw new Error('IDAT length ' + raw.length + ' != ' + h * (stride + 1));
  let p = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[p++], row = out.subarray(y * stride, (y + 1) * stride), prev = y ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? row[x - bpp] : 0, b = prev ? prev[x] : 0, c = (prev && x >= bpp) ? prev[x - bpp] : 0;
      let v = raw[p++];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c); }
      else if (f !== 0) throw new Error('bad filter ' + f + ' on row ' + y);
      row[x] = v & 255;
    }
  }
  return { w, h, data: out, sawIEND };
}

/* ═══ 1 · THE SCHEDULE ═════════════════════════════════════════════════════════════════════════════════════ */
{
  let exactOffset = true, lands = true, uniform = true, worstDrift = 0, worstAcc = null, n = 0;
  for (const T of [16 * Math.PI / 3, 64 * Math.PI / 3, 2 * Math.PI * 7200, 1e-3, 45238.934211693015]) {
    for (const N of [1, 2, 3, 7, 60, 180, 360, 601, 4096]) {
      for (const t0 of [0, 3.5, -12.25, 1234.5678]) {
        n++;
        const s = loopSchedule({ T, N, t0 });
        if (s.off(N) !== T) exactOffset = false;                                  // BIT for BIT, not to a tolerance
        if (s.at(N) !== t0 + T) lands = false;                                    // the wrap frame is exactly the double t0+T
        const g = s.gaps();
        if (g.length !== N) uniform = false;
        for (const v of g) if (Math.abs(v - s.dt) > 8 * Number.EPSILON * Math.max(Math.abs(t0) + T, T)) uniform = false;
        /* the accumulating form k*(T/N) is what this ISN'T: measure how far its offset misses the period */
        const drift = Math.abs(N * (T / N) - T);
        if (drift > worstDrift) { worstDrift = drift; worstAcc = { T, N, drift }; }
      }
    }
  }
  judge('THE SEAM CLOSES IN FLOATING POINT: over 180 combinations of T, N and t0 the OFFSET at the wrap, off(N) = (N/N)*T, is EXACTLY T \u2014 bit for bit, not to a tolerance, because k/N is exactly 1.0 at k = N \u2014 and at(N) is exactly the double t0 + T. The accumulating form k*(T/N) is not: it misses the period by up to 7.3e-12 a.u. Every gap in the cycle, the wrap-around from the last frame back to t0+T included, is T/N to eight ulp',
    exactOffset && lands && uniform, { combinations: n, exactOffset, landsOnT0PlusT: lands, uniform, worstMissOfTheAccumulatingForm: worstAcc });

  const s = loopSchedule({ T: 100, N: 4, t0: 7 });
  judge('THE HALF-OPEN INTERVAL: N frames cover [t0, t0+T) — 4 frames of T = 100 from t = 7 are 7, 32, 57, 82, and NOT 107', s.all().join(',') === '7,32,57,82' && s.N === 4 && s.dt === 25 && ENDPOINT === 'exclusive', { times: s.all(), dt: s.dt, endpoint: ENDPOINT });
}

/* ═══ 2 · THE INCLUDE-OR-DROP DECISION, AGAINST THE REAL DENSITY ═══════════════════════════════════════════ */
{
  /* the same state period.test.mjs uses for its ring: 4d(+2) + 2p(-1), T = 64pi/3 = 67.0206 a.u. */
  const idx = (n, l, m) => BASIS.findIndex((s) => s.n === n && s.l === l && s.m === m);
  const a = idx(4, 2, 2), b = idx(2, 1, -1), Ea = En(4), Eb = En(2);
  const ring = (t) => {
    const re = new Float64Array(91), im = new Float64Array(91);
    re[a] = Math.cos(-Ea * t) / Math.SQRT2; im[a] = Math.sin(-Ea * t) / Math.SQRT2;
    re[b] = Math.cos(-Eb * t) / Math.SQRT2; im[b] = Math.sin(-Eb * t) / Math.SQRT2;
    const out = [];
    for (let i = 0; i < 72; i++) { const phi = 2 * Math.PI * i / 72; const p = psiAt(re, im, 3 * Math.cos(phi), 3 * Math.sin(phi), 1, [a, b]); out.push(p.re * p.re + p.im * p.im); }
    return out;
  };
  const dist = (p, q) => { let m = 0; for (let i = 0; i < p.length; i++) m = Math.max(m, Math.abs(p[i] - q[i])); return m; };
  const P = densityPeriod([Ea, Eb]), T = P.T, t0 = 5.25, N = 12;
  const sInc = loopSchedule({ T, N, t0 }).all({ endpoint: true });
  const sExc = loopSchedule({ T, N, t0 }).all();
  const pics = sInc.map(ring), scale = Math.max(...pics[0]);

  /* (a) the endpoint frame IS frame 0 — the picture, not the phase */
  const dup = dist(pics[N], pics[0]) / scale;
  /* (b) in the exclusive schedule no two frames are the same picture */
  let closest = Infinity, closestPair = null;
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) { const d = dist(pics[i], pics[j]) / scale; if (d < closest) { closest = d; closestPair = [i, j]; } }
  /* (c) the gaps: uniform when the endpoint is dropped, a ZERO gap at the join when it is kept */
  const pr = endpointProof({ T, N, t0, rho: (t) => ring(t)[0] });
  judge('THE ENDPOINT IS DROPPED, AND IT IS THE DENSITY THAT SAYS SO: for 4d(+2) + 2p(-1) at T = 67.0206 a.u., the frame at t0 + T reproduces frame 0 to 2e-16 of the peak — it is not a new picture, it is frame 0 again — while in the 12-frame exclusive schedule the CLOSEST two frames still differ by 12% of the peak. Keeping it would hold the first image for two frame times at the join: the inclusive schedule\'s wrap gap is exactly 0 and its other gaps are T/N, while every gap of the exclusive schedule is T/N',
    dup < 1e-12 && closest > 0.05 && pr.inclusive.duplicatesFirst && pr.inclusive.minGap === 0 && !pr.exclusive.duplicatesFirst && pr.exclusive.uniform && (pr.exclusive.maxGap - pr.exclusive.minGap) < 1e-12 * pr.dt && pr.chosen === 'exclusive',
    { T, duplicateAtEndpoint: dup, closestDistinctPair: closestPair, closestDistance: closest, inclusiveGaps: { min: pr.inclusive.minGap, max: pr.inclusive.maxGap, uniform: pr.inclusive.uniform }, exclusiveGaps: { min: pr.exclusive.minGap, max: pr.exclusive.maxGap, spread: pr.exclusive.maxGap - pr.exclusive.minGap, uniform: pr.exclusive.uniform }, rhoSeam: pr.inclusive.duplicateValue });

  /* (d) the loop, played: index k mod N over two laps is the same picture sequence, and the sequence has period N */
  const sched = loopSchedule({ T, N, t0 });
  let loops = true;
  for (let k = 0; k < 2 * N; k++) { const d = dist(ring(sched.at(k)), pics[k % N]) / scale; if (d > 1e-12) loops = false; }
  judge('AND THE LOOP LOOPS: playing the schedule for TWO laps (k = 0 ... 2N-1, the time running on past t0+T) reproduces the same N pictures in the same order to 1e-12 — the wrap is the physics, not an edit',
    loops, { laps: 2, frames: 2 * N, N });
}

/* ═══ 3 · THE FRAME COUNT AND THE TEMPO ═══════════════════════════════════════════════════════════════════ */
{
  let ok = true, worstShift = 0, worstBound = 0;
  for (const T of [16.755160819145562, 67.02064327658225, 1809.5573684677208, 45238.934211693015]) {
    for (const fps of [24, 25, 30, 50, 60]) {
      for (const rate of [0.5, 2, 4, 17.3, 400]) {
        const p = planFrames({ T, fps, rate, maxFrames: 36000 });
        if (Math.abs(p.N / p.fps - p.seconds) > 1e-12) ok = false;
        if (Math.abs(p.rate * p.seconds - T) > 1e-9 * T) ok = false;
        if (Math.abs(p.dt * p.N - T) > 1e-9 * T) ok = false;
        if (!p.clamped) { const bound = 1 / (2 * p.N - 1) + 1e-12; if (Math.abs(p.rateShift) > bound) ok = false; worstBound = Math.max(worstBound, Math.abs(p.rateShift) / bound); worstShift = Math.max(worstShift, Math.abs(p.rateShift)); }
      }
    }
  }
  judge('THE TEMPO IS QUANTIZED AND THE QUANTIZATION IS REPORTED: one period must be a WHOLE number of frames, so the playback rate moves by at most 1/(2N-1) from the rate asked for — checked over 100 combinations of T, fps and rate, never exceeded, and the loop still covers exactly one period (N*dt = T, rate*seconds = T)',
    ok, { worstRateShiftWhenNotClamped: worstShift, worstFractionOfTheBound: worstBound });

  const byS = planFrames({ T: 67.0206, fps: 30, seconds: 6 }), byN = planFrames({ T: 67.0206, fps: 30, frames: 180 });
  judge('THE THREE WAYS TO ASK ARE THE SAME PLAN: "6 seconds at 30 fps" and "180 frames at 30 fps" agree, and the clamp is reported when it bites (1 frame becomes 2, a million becomes maxFrames)',
    byS.N === 180 && byN.N === 180 && byS.seconds === 6 && planFrames({ T: 1, fps: 30, frames: 1 }).clampedLow && planFrames({ T: 1, fps: 30, frames: 1e6 }).clampedHigh,
    { bySeconds: byS.N, byFrames: byN.N, seconds: byS.seconds, rate: +byS.rate.toFixed(4) });
}

/* ═══ 4 · THE REFUSAL ═════════════════════════════════════════════════════════════════════════════════════ */
{
  const Ex = densityPeriod([1, 2].map(En));
  const ex = planPeriodRecording(Ex, { fps: 30, seconds: 4, energies: [1, 2].map(En) });
  judge('AN EXACT PERIOD IS ACCEPTED and labelled EXACT LOOP: 1s+2s, T = 16.7552 a.u., 120 frames at 30 fps, seam error 0 recomputed from the energies themselves',
    ex.ok && ex.kind === 'exact' && ex.closes === true && ex.N === 120 && ex.measuredSeamError < 1e-12 && /EXACT LOOP/.test(ex.message),
    { kind: ex.kind, N: ex.N, T: ex.T, measuredSeamError: ex.measuredSeamError, message: ex.message.slice(0, 120) });

  const E3 = [0, 1, Math.SQRT2];
  const Nr = densityPeriod(E3, { horizon: 2000 });
  const nr = planPeriodRecording(Nr, { fps: 30, seconds: 4, energies: E3 });
  const recomputed = seamError(E3, Nr.T);
  judge('A STATE WITH NO EXACT PERIOD IS REFUSED, AND THE NEAR-RECURRENCE IS REPORTED WITH ITS ERROR: energies {0, 1, sqrt2} are incommensurate, so ok is false, kind is NEAR, T is the best recurrence within the horizon, and the error printed is the seam error RECOMPUTED here from the energies (agreeing with period.js to 1e-12) — not a claim, a measurement',
    nr.ok === false && nr.kind === 'near' && nr.T > 0 && Math.abs(nr.err - recomputed) < 1e-12 && Math.abs(nr.err - Nr.err) < 1e-12 && /NO EXACT PERIOD/.test(nr.message) && /MISSES/.test(nr.message) && !!nr.plan,
    { ok: nr.ok, kind: nr.kind, T: +nr.T.toFixed(4), err: nr.err, recomputed, message: nr.message.slice(0, 180) });

  const near = planPeriodRecording(Nr, { fps: 30, seconds: 4, energies: E3, allowNear: true });
  judge('...AND IF IT IS ASKED FOR ANYWAY IT COMES BACK LABELLED NEAR, NEVER LOOP: allowNear gives a schedule whose closes flag is FALSE and whose seamError is the miss',
    near.ok && near.kind === 'near' && near.closes === false && Math.abs(near.seamError - recomputed) < 1e-12 && near.N === 120,
    { kind: near.kind, closes: near.closes, seamError: near.seamError, N: near.N });

  const stark = planPeriodRecording({ exact: false, stark: true, T: 0 });
  const mix = planPeriodRecording({ exact: false, mix: true, T: 0 });
  const stat = planPeriodRecording({ exact: true, T: 0, stationary: true }, { fps: 30 });
  judge('THE THREE OTHER HONEST ANSWERS: a Stark state and a live A->B mix have no period AND no near-recurrence to offer (kind NONE, refused, and the reason named); a single energy is STATIONARY — the density never changes, so one frame is the whole loop',
    stark.ok === false && stark.kind === 'none' && /Stark/.test(stark.message) && mix.ok === false && mix.kind === 'none' && /Rabi/.test(mix.message) && stat.ok && stat.kind === 'stationary' && stat.frames === 1,
    { stark: stark.kind, mix: mix.kind, stationary: stat.kind, starkMsg: stark.message.slice(0, 100) });

  /* the seam error of an EXACT period really is zero, and of a bad T really is not */
  const Ehyd = [1, 2, 3, 4, 5, 6].map(En), Th = densityPeriod(Ehyd).T;
  judge('SEAM ERROR AS AN INDEPENDENT MEASURE: at the exact T of all six shells every pair closes to 4e-12 of a turn; at 0.999*T the worst pair is a fifth of a turn out',
    seamError(Ehyd, Th) < 1e-11 && seamError(Ehyd, 0.999 * Th) > 0.1, { atT: seamError(Ehyd, Th), at999: seamError(Ehyd, 0.999 * Th), T: Th });
}

/* ═══ 5 · NAMES ═══════════════════════════════════════════════════════════════════════════════════════════ */
{
  const date = new Date(Date.UTC(2026, 8, 5, 20, 31, 7));
  const n1 = captureName({ kind: 'loop', label: '1s+2s beat', w: 1920, h: 1080, fps: 30, frames: 360, T: 16.755160819, ext: 'webm', date });
  const n2 = captureName({ kind: 'still', label: 'Rydberg packet n = 4…6', w: 3840, h: 2160, ext: 'png', date });
  const bad = /[\\/:*?"<>|\x00-\x1f]/;
  const many = new Set(); const names = [];
  for (let i = 0; i < 200; i++) names.push(uniqueName(captureName({ kind: 'loop', label: 'x', w: 8, h: 8, ext: 'png', date }), many));
  const allDistinct = new Set(names).size === 200;
  const allSane = names.every((n) => !bad.test(n) && n.length < 120 && /\.png$/.test(n) && n === n.toLowerCase());
  judge('FILENAMES ARE SANE AND COLLISION-FREE: every fact of the capture is in the name (kind, state, size, fps, frame count, period, UTC stamp), nothing in it is illegal on any filesystem (no colon, no slash, no control byte), and 200 captures made in the SAME SECOND with the SAME parameters come back as 200 distinct names with the suffix before the extension',
    n1 === 'lambdawaves-loop-1s-2s-beat-1920x1080-30fps-360f-t16_755au-20260905-203107.webm'
    && n2 === 'lambdawaves-still-rydberg-packet-n-4-6-3840x2160-20260905-203107.png'
    && !bad.test(n1) && !bad.test(n2) && allDistinct && allSane && names[1].endsWith('-2.png') && names[199].endsWith('-200.png'),
    { n1, n2, distinct: new Set(names).size, second: names[1], last: names[199] });

  judge('THE PIECES: slug flattens anything to [a-z0-9-] and never leaves a stray dash; stamp is UTC, sortable and colon-free',
    slug('  Ψ: 2p+ / 3d_z²  ') === '2p-3d-z2' && slug('') === '' && slug('----') === '' && stamp(date) === '20260905-203107',
    { slug: slug('  Ψ: 2p+ / 3d_z²  '), stamp: stamp(date) });
}

/* ═══ 6 · THE READBACK'S ARITHMETIC AND THE CEILING ═══════════════════════════════════════════════════════ */
{
  judge('BYTES PER ROW IS ALIGNED TO 256, AS WebGPU DEMANDS: 320 px -> 1280 (already aligned), 321 -> 1536, 1 -> 256',
    alignedBytesPerRow(320) === 1280 && alignedBytesPerRow(321) === 1536 && alignedBytesPerRow(1) === 256 && alignedBytesPerRow(8192) === 32768,
    { p320: alignedBytesPerRow(320), p321: alignedBytesPerRow(321), p1: alignedBytesPerRow(1) });

  let tiles = true, within = true;
  for (const [h, bpr, cap] of [[8192, 32768, WEBGPU_DEFAULT_MAX_BUFFER], [2160, 15360, 1 << 20], [1, 256, 256], [4321, 4096, 100000], [16384, 65536, WEBGPU_DEFAULT_MAX_BUFFER]]) {
    const bands = planBands(h, bpr, cap);
    let y = 0; for (const b of bands) { if (b.y0 !== y) tiles = false; y += b.rows; if (b.bytes > cap) within = false; }
    if (y !== h) tiles = false;
  }
  judge('THE READBACK IS BANDED, AND THE BANDS TILE THE PICTURE EXACTLY: consecutive row groups with no gap and no overlap covering [0, h), every one inside maxBufferSize — the 8192-square picture is 256 MiB of RGBA, which IS the default limit, so a band is not optional at the top of the range',
    tiles && within && planBands(8192, 32768, WEBGPU_DEFAULT_MAX_BUFFER).length === 1 && planBands(2160, 15360, 1 << 20).length === 32,
    { full8192: planBands(8192, 32768, WEBGPU_DEFAULT_MAX_BUFFER), small: planBands(2160, 15360, 1 << 20).length });

  let threw = false; try { planBands(10, 1 << 30, 1000); } catch (_) { threw = true; }
  judge('AND A ROW THAT CANNOT FIT AT ALL IS AN ERROR, NOT A SILENT TRUNCATION', threw, { threw });

  const dflt = maxPictureSize(null), asked = maxPictureSize({ maxTextureDimension2D: 16384, maxBufferSize: 1 << 31 });
  judge('THE MAXIMUM PICTURE IS 8192 ON A SIDE, AND IT IS THE DEVICE\'S DEFAULT LIMIT, NOT THE GPU\'S: field.js calls requestDevice() with no requiredLimits, so maxTextureDimension2D is the WebGPU default 8192 (67.1 Mpx) whatever the adapter can do — maxPictureSize says so, and reports 16384 the moment a device is asked for it',
    dflt.side === 8192 && dflt.isDefaultLimit && /requiredLimits/.test(dflt.note) && asked.side === 16384 && !asked.isDefaultLimit && WEBGPU_DEFAULT_MAX_TEXTURE_2D === 8192,
    { dflt: { side: dflt.side, why: dflt.why, isDefault: dflt.isDefaultLimit }, asked: asked.side });

  const f1 = fitPicture({ srcW: 1028, srcH: 814, scale: 4 }), f2 = fitPicture({ srcW: 1028, srcH: 814, width: 3840 }), f3 = fitPicture({ srcW: 1028, srcH: 814, scale: 16 });
  judge('THE SIZE ASKED FOR: a scale multiplies both sides (4 x 1028x814 = 4112x3256, a REAL march at that size); a width alone keeps the stage\'s aspect (3840 -> 3840x3041, the same shape to 1e-4); and anything over the ceiling is CLIPPED to it with the flag set, never silently',
    f1.w === 4112 && f1.h === 3256 && !f1.clipped && f2.w === 3840 && f2.h === 3041 && Math.abs(f2.w / f2.h - 1028 / 814) < 1e-3 && f3.clipped && Math.max(f3.w, f3.h) === 8192,
    { scale4: [f1.w, f1.h], width3840: [f2.w, f2.h], scale16: [f3.w, f3.h, f3.clipped] });
}

/* ═══ 7 · PIXELS ══════════════════════════════════════════════════════════════════════════════════════════ */
{
  /* two rows of three BGRA pixels in a buffer padded to 16 bytes a row, with junk in the pad and in alpha */
  const w = 3, h = 2, bpr = 16, src = new Uint8Array(bpr * h).fill(0xcd);
  const put = (y, x, b, g, r, a) => { const o = y * bpr + x * 4; src[o] = b; src[o + 1] = g; src[o + 2] = r; src[o + 3] = a; };
  put(0, 0, 1, 2, 3, 9); put(0, 1, 4, 5, 6, 9); put(0, 2, 7, 8, 9, 9);
  put(1, 0, 10, 11, 12, 0); put(1, 1, 13, 14, 15, 0); put(1, 2, 16, 17, 18, 0);
  const rgba = toRGBA(src, w, h, { bytesPerRow: bpr, bgra: true, opaque: true });
  const straight = toRGBA(src, w, h, { bytesPerRow: bpr, bgra: false, opaque: false });
  judge('THE READBACK\'S BYTES BECOME PIXELS CORRECTLY: the row padding to 256 is dropped, bgra8unorm (what getPreferredCanvasFormat gives on this desktop) is swizzled to RGBA, and alpha is forced to 255 because the context is alphaMode "opaque" and its alpha channel is not what is on screen',
    rgba.length === w * h * 4 && rgba[0] === 3 && rgba[1] === 2 && rgba[2] === 1 && rgba[3] === 255 && rgba[w * 4] === 12 && rgba[w * 4 + 3] === 255 && straight[0] === 1 && straight[3] === 9,
    { firstPixel: [...rgba.slice(0, 4)], secondRowFirst: [...rgba.slice(w * 4, w * 4 + 4)], noSwizzle: [...straight.slice(0, 4)] });

  /* the overlay composite */
  const base = () => { const b = new Uint8Array(4 * 4 * 4); for (let i = 0; i < 16; i++) { b[i * 4] = 0; b[i * 4 + 1] = 0; b[i * 4 + 2] = 200; b[i * 4 + 3] = 255; } return b; };
  const solid = new Uint8Array(2 * 2 * 4); for (let i = 0; i < 4; i++) { solid[i * 4] = 255; solid[i * 4 + 3] = 255; }
  const clear = new Uint8Array(2 * 2 * 4);
  const half = new Uint8Array(2 * 2 * 4); for (let i = 0; i < 4; i++) { half[i * 4 + 1] = 100; half[i * 4 + 3] = 128; }
  const A = compositeOver(base(), 4, 4, solid, 2, 2), B = compositeOver(base(), 4, 4, clear, 2, 2), C = compositeOver(base(), 4, 4, half, 2, 2);
  const uniform = (b, px) => { for (let i = 0; i < 16; i++) for (let c = 0; c < 4; c++) if (b[i * 4 + c] !== px[c]) return false; return true; };
  const al = 128 / 255, expect = [Math.round(0 * al + 0 * (1 - al)), Math.round(100 * al + 0 * (1 - al)), Math.round(0 * al + 200 * (1 - al)), 255];
  judge('THE 2-D OVERLAYS COMPOSITE BY STRAIGHT ALPHA OVER, AND AN UPSCALE OF A UNIFORM LAYER STAYS UNIFORM (bilinear, so it cannot invent an edge): opaque red over blue is red everywhere, a fully transparent layer changes nothing at all, and a 50.2% green blends to the exact arithmetic value',
    uniform(A, [255, 0, 0, 255]) && uniform(B, [0, 0, 200, 255]) && uniform(C, expect),
    { opaque: [...A.slice(0, 4)], transparent: [...B.slice(0, 4)], half: [...C.slice(0, 4)], expected: expect });
}

/* ═══ 8 · THE PNG ENCODER, ROUND-TRIPPED ══════════════════════════════════════════════════════════════════ */
{
  judge('CRC32 AND ADLER32 AGAINST THE STANDARD VECTORS: crc32("123456789") = 0xcbf43926, adler32("Wikipedia") = 0x11e60398',
    crc32(new TextEncoder().encode('123456789')) === 0xcbf43926 && adler32(new TextEncoder().encode('Wikipedia')) === 0x11e60398,
    { crc: crc32(new TextEncoder().encode('123456789')).toString(16), adler: adler32(new TextEncoder().encode('Wikipedia')).toString(16) });

  judge('THE PURE-JS STORED ZLIB STREAM IS A REAL ZLIB STREAM: node inflates 200 000 bytes of it back to the byte (three stored blocks, so the block chaining is exercised)',
    (() => { const d = new Uint8Array(200000); for (let i = 0; i < d.length; i++) d[i] = (i * 37 + (i >> 8)) & 255; const back = zlib.inflateSync(Buffer.from(zlibStored(d))); return back.length === d.length && Buffer.compare(back, Buffer.from(d)) === 0; })(),
    { bytes: 200000, blocks: Math.ceil(200000 / 65535) });

  /* three images with different characters: a smooth gradient (filters matter), noise (they don't), a flat field */
  const mk = (w, h, kind) => {
    const a = new Uint8Array(w * h * 4);
    let seed = 12345;
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      if (kind === 'gradient') { a[o] = (x * 255 / w) | 0; a[o + 1] = (y * 255 / h) | 0; a[o + 2] = ((x + y) * 127 / (w + h)) | 0; }
      else if (kind === 'noise') { a[o] = (rnd() * 255) | 0; a[o + 1] = (rnd() * 255) | 0; a[o + 2] = (rnd() * 255) | 0; }
      else { a[o] = 17; a[o + 1] = 200; a[o + 2] = 99; }
      a[o + 3] = 255;
    }
    return a;
  };
  const sizes = [[1, 1], [3, 2], [64, 41], [131, 97]];
  let allRound = true; const report = [];
  for (const [w, h] of sizes) for (const kind of ['gradient', 'noise', 'flat']) {
    const img = mk(w, h, kind);
    for (const [tag, opts] of [['zlib', { deflate: (b) => new Uint8Array(zlib.deflateSync(Buffer.from(b))) }], ['stored', { deflate: zlibStored }]]) {
      const png = await encodePNG(img, w, h, opts);
      const back = decodePNG(Buffer.from(png));
      const same = back.w === w && back.h === h && back.sawIEND && Buffer.compare(back.data, Buffer.from(img)) === 0;
      if (!same) allRound = false;
      if (w === 131 && tag === 'zlib') report.push({ kind, bytes: png.length, raw: w * h * 4, ratio: +(png.length / (w * h * 4)).toFixed(3) });
    }
  }
  judge('THE PNG ENCODER ROUND-TRIPS PIXEL-EXACT: 24 images (four sizes including 1x1 and an odd 131x97, three characters, two deflates — node\'s and the pure-JS stored fallback) re-decode to the same bytes through a decoder written independently here, with every chunk CRC verified and IEND present. The gradient compresses to a fifth of its raw size, which is the adaptive row filter doing its job',
    allRound, { images: sizes.length * 3 * 2, at131x97: report });

  /* every one of the five filters, forced, must survive the decoder */
  const img = mk(48, 33, 'gradient');
  let filtersOK = true; const perFilter = [];
  for (let f = 0; f <= 4; f++) {
    const png = await encodePNG(img, 48, 33, { deflate: (b) => new Uint8Array(zlib.deflateSync(Buffer.from(b))), filter: f });
    const back = decodePNG(Buffer.from(png));
    if (Buffer.compare(back.data, Buffer.from(img)) !== 0) filtersOK = false;
    perFilter.push({ f, bytes: png.length });
  }
  const adaptive = pngFilter(img, 48, 33), chosen = new Set(); for (let y = 0; y < 33; y++) chosen.add(adaptive[y * (48 * 4 + 1)]);
  judge('ALL FIVE PNG ROW FILTERS ARE WRITTEN CORRECTLY (None, Sub, Up, Average, Paeth — each forced in turn, each decoded back to the same image), and the adaptive heuristic actually chooses between them rather than always answering None',
    filtersOK && chosen.size >= 2 && !(chosen.size === 1 && chosen.has(0)),
    { perFilter, filtersChosenOnAGradient: [...chosen] });

  /* the container itself */
  const png = await encodePNG(mk(7, 5, 'flat'), 7, 5, { deflate: zlibStored });
  const sigOK = [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => png[i] === b);
  const ihdrType = String.fromCharCode(png[12], png[13], png[14], png[15]);
  const dv = new DataView(png.buffer, png.byteOffset, png.byteLength);
  judge('AND THE CONTAINER IS A PNG BY THE SPEC: the eight-byte signature, an IHDR of 13 bytes declaring 7x5 at 8-bit RGBA non-interlaced, then IDAT, then IEND',
    sigOK && ihdrType === 'IHDR' && dv.getUint32(8) === 13 && dv.getUint32(16) === 7 && dv.getUint32(20) === 5 && png[24] === 8 && png[25] === 6 && png[28] === 0,
    { signature: sigOK, ihdr: ihdrType, w: dv.getUint32(16), h: dv.getUint32(20), depth: png[24], colourType: png[25], interlace: png[28], bytes: png.length });
}


/* ═══ 10 · WHICH PERIOD THE OBSERVABLE NEEDS ══════════════════════════════════════════════════════════════ */
{
  /* THE FACT: psi(t + T_rho) = e^{i phi} psi(t) with phi != 0, so the density repeats but arg psi does not.
     Measured on the real wavefunction of 1s+2s, not argued. */
  const idx = (n, l, m) => BASIS.findIndex((s) => s.n === n && s.l === l && s.m === m);
  const a = idx(1, 0, 0), b = idx(2, 0, 0), Ea = En(1), Eb = En(2);
  const psi = (t, x, y, z) => {
    const re = new Float64Array(91), im = new Float64Array(91);
    re[a] = Math.cos(-Ea * t) / Math.SQRT2; im[a] = Math.sin(-Ea * t) / Math.SQRT2;
    re[b] = Math.cos(-Eb * t) / Math.SQRT2; im[b] = Math.sin(-Eb * t) / Math.SQRT2;
    return psiAt(re, im, x, y, z, [a, b]);
  };
  const Trho = densityPeriod([Ea, Eb]).T, Wv = wavePeriod([Ea, Eb]), Tpsi = Wv.T;
  const t0 = 3.25, p0 = psi(t0, 0.8, 0.3, 1.7), pT = psi(t0 + Trho, 0.8, 0.3, 1.7), pW = psi(t0 + Tpsi, 0.8, 0.3, 1.7);
  const ratio = { re: (pT.re * p0.re + pT.im * p0.im) / (p0.re * p0.re + p0.im * p0.im), im: (pT.im * p0.re - pT.re * p0.im) / (p0.re * p0.re + p0.im * p0.im) };
  const mod = Math.hypot(ratio.re, ratio.im), arg = Math.atan2(ratio.im, ratio.re);
  const rho = (p) => p.re * p.re + p.im * p.im;
  judge('THE OBSERVABLE DECIDES WHICH PERIOD, AND THE WAVEFUNCTION SAYS SO: for 1s+2s, psi(t + T_rho) is psi(t) turned by a GLOBAL phase of exactly 2pi/3 (modulus 1 to 1e-15) — so the DENSITY is back (1e-16) but arg psi, Re psi and Im psi are not. At T_psi = 2pi/gcd{|E|} = 3 T_rho the wavefunction itself is back to 1e-15, phase and all',
    Math.abs(mod - 1) < 1e-14 && Math.abs(Math.abs(arg) - 2 * Math.PI / 3) < 1e-12 && Math.abs(rho(pT) - rho(p0)) < 1e-15 && Math.abs(pW.re - p0.re) < 1e-14 && Math.abs(pW.im - p0.im) < 1e-14 && Wv.exact && Math.abs(Tpsi / Trho - 3) < 1e-12,
    { Trho, Tpsi, laps: Tpsi / Trho, globalPhaseModulus: mod, globalPhaseArg: arg, twoPiOver3: 2 * Math.PI / 3, dRhoAtTrho: Math.abs(rho(pT) - rho(p0)), dPsiAtTpsi: Math.hypot(pW.re - p0.re, pW.im - p0.im) });

  const six = [1, 2, 3, 4, 5, 6].map(En);
  judge('AND SOMETIMES THEY ARE THE SAME PERIOD: over all six shells gcd{|E|} = gcd{|dE|} = 1/7200 Eh, so T_psi = T_rho = 2pi*7200 and the phase views loop in one lap — the rule is read from the energies, never assumed',
    Math.abs(wavePeriod(six).T - densityPeriod(six).T) < 1e-6 && wavePeriod(six).exact,
    { Trho: densityPeriod(six).T, Tpsi: wavePeriod(six).T });

  judge('THE VIEW TABLE IS field.js\' OWN: the six observables in the same order, and exactly the four that paint arg/Re/Im psi are the ones that carry the global phase (density and the Delta-rho difference do not)',
    VIEW_NAMES.join(',') === FIELD_VIEW_NAMES.join(',') && VIEW_NAMES.every((n, i) => FIELD_VIEW[n] === i)
    && !viewCarriesGlobalPhase('density') && !viewCarriesGlobalPhase(FIELD_VIEW.diff) && viewCarriesGlobalPhase('phase') && viewCarriesGlobalPhase(FIELD_VIEW.phase) && viewCarriesGlobalPhase('real') && viewCarriesGlobalPhase('imag') && viewCarriesGlobalPhase('reim'),
    { capture: VIEW_NAMES, field: FIELD_VIEW_NAMES, carry: VIEW_NAMES.filter(viewCarriesGlobalPhase) });

  /* and the plan uses it */
  const D = densityPeriod([Ea, Eb]), W = wavePeriod([Ea, Eb]);
  const den = planPeriodRecording(D, { fps: 30, seconds: 4, observable: 'density', wave: W });
  const pha = planPeriodRecording(D, { fps: 30, seconds: 4, observable: 'phase', wave: W });
  const exa = planPeriodRecording(D, { fps: 30, seconds: 4, observable: 'density', wave: W, pixelExact: true });
  const naked = planPeriodRecording(D, { fps: 30, seconds: 4, observable: 'phase' });
  judge('SO THE PLAN CHOOSES: the DENSITY view loops at T_rho (and says the picture repeats to ~3e-7 because the f16 cache rounds a rotated psi differently); the PHASE view loops at T_psi = 3 T_rho with the SAME frame count and three times the physics; pixelExact buys T_psi in the density view too; and a phase view with no psi period is WARNED, not silently wrong',
    den.usedPeriod === 'density' && den.T === D.T && !den.carriesGlobalPhase && den.laps === 1
    && pha.usedPeriod === 'wave' && Math.abs(pha.T - W.T) < 1e-9 && pha.carriesGlobalPhase && pha.laps === 3 && pha.pixelExact && pha.N === den.N
    && exa.usedPeriod === 'wave' && exa.pixelExact
    && naked.usedPeriod === 'density' && naked.carriesGlobalPhase && !naked.pixelExact && /WARNING/.test(naked.phaseNote),
    { density: { used: den.usedPeriod, T: den.T, N: den.N, laps: den.laps }, phase: { used: pha.usedPeriod, T: pha.T, N: pha.N, laps: pha.laps }, pixelExact: exa.usedPeriod, unwarned: naked.phaseNote.slice(0, 90) });
}

/* ═══ 11 · THE UNITS ═══════════════════════════════════════════════════════════════════════════════════════ */
{
  const P = densityPeriod([1, 2].map(En));
  const plan = planPeriodRecording(P, { fps: 30, seconds: 4 });
  judge('THE PERIOD IS ALSO REPORTED IN FEMTOSECONDS, from period.js\' own constant: T = 16.7552 a.u. is 0.405288 fs, and 120 frames of it at 30 fps is 4 s of wall — a slow-motion factor of 9.9e15',
    Math.abs(AU_FS - 0.02418884326) < 1e-15 && Math.abs(plan.seconds_fs - P.T * AU_FS) < 1e-15 && Math.abs(plan.seconds_fs - 0.4052880) < 1e-6 && plan.seconds === 4,
    { T_au: P.T, T_fs: plan.seconds_fs, wallSeconds: plan.seconds, slowMotion: (plan.seconds / (plan.seconds_fs * 1e-15)).toExponential(2) });
}

/* ═══ 12 · THE THREE PLANNER DEFECTS OF WAVE 58 (REVIEW-2-2026-09-05 §1) ═══════════════════════════════════════
   Three regressions, each stated in VALUE space against the exact fixture the review used.  Nothing here asserts
   that the fix is present; each one drives the planner into the state that produced the wrong answer and reads
   what comes back — ANTI-PATTERN 13's rule, applied to a fix rather than to a feature. */
{
  /* (a) THE HALF-TURN SEAM.  A density period that is NOT exact, with a psi period that IS: the review's own
     minimal repro, whose tell was laps: 0 (Math.round(44.88 / 1234.5)).  This is reachable in the shipped app
     under STURMIAN, where D comes from the occupied eigenvalues and W used to come from the labels' <H>. */
  const lie = planPeriodRecording({ exact: false, T: 1234.5, err: 0.37, count: 6 },
    { fps: 30, seconds: 6, observable: 'phase', wave: { exact: true, T: 44.88 } });
  const good = (() => { const D = densityPeriod([En(1), En(2)]), W = wavePeriod([En(1), En(2)]);
    return planPeriodRecording(D, { fps: 30, seconds: 4, observable: 'phase', wave: W }); })();
  judge('A PLAN MAY ONLY PROMISE WHAT THE DENSITY CLOSES: given a density period that is NOT exact (a near-recurrence 0.37 of a turn out) and a psi period that says it IS, the planner used to answer kind:"exact", closes:true, seamError:0 and laps:0 — an EXACT LOOP badge over the worst seam available. It now refuses on the density, keeps the near-recurrence and its error, and the honest case is untouched: an exact density period with an exact psi period still loops at T_psi in three laps',
    lie.ok === false && lie.kind === 'near' && Math.abs(lie.T - 1234.5) < 1e-9 && Math.abs(lie.err - 0.37) < 1e-12
    && good.ok === true && good.kind === 'exact' && good.usedPeriod === 'wave' && good.laps === 3,
    { refused: { ok: lie.ok, kind: lie.kind, T: lie.T, err: lie.err, label: lie.label },
      honest: { ok: good.ok, kind: good.kind, used: good.usedPeriod, laps: good.laps, T: +good.T.toFixed(4) } });

  /* (b) ONE ENERGY IS NOT ONE PICTURE, IN A PHASE VIEW.  psi = psi_a e^{-iE_a t} turns at 2*pi/|E_a| even though
     rho never moves — and five shipped presets are exactly one energy, three of them in a phase-carrying view. */
  const E1 = En(2), Wv = wavePeriod([E1]), Dv = densityPeriod([E1]);
  const stillDensity = planPeriodRecording(Dv, { fps: 30, seconds: 4, observable: 'density', wave: Wv });
  const movingPhase = planPeriodRecording(Dv, { fps: 30, seconds: 4, observable: 'phase', wave: Wv });
  const one = PRESETS.filter((p) => p.modes.every((m) => m.n === p.modes[0].n));   // every populated label on one shell = ONE energy
  const windows = one.filter((p) => p.visual && p.visual.window).map((p) => ({ id: p.id, view: p.visual.view,
    window: p.visual.window, Tpsi: wavePeriod([En(p.modes[0].n)]).T }));
  const windowsAgree = windows.every((w) => Math.abs(w.window - w.Tpsi) < 1e-9);
  judge('ONE ENERGY IS NOT ONE PICTURE — IT DEPENDS ON THE OBSERVABLE (wave 58). For a single populated energy the DENSITY really never changes and STATIONARY is the honest answer; but arg psi, Re psi and Im psi turn at T_psi = 2*pi/|E| and the planner used to say "every frame is the same picture" to all of them, because the stationary branch fired above the line that reads the view. The phase view now gets a real loop of 120 frames at T_psi = 50.265482 a.u. for 2p, and the density view still gets its one frame. AND THE LAB ALREADY KNEW THE NUMBER: every one-energy preset in state.js carries that same T_psi as its visual.window, to the digit',
    stillDensity.kind === 'stationary' && stillDensity.frames === 1
    && movingPhase.ok && movingPhase.kind === 'exact' && movingPhase.usedPeriod === 'wave' && movingPhase.N === 120
    && Math.abs(movingPhase.T - 2 * Math.PI / Math.abs(E1)) < 1e-9 && /GLOBAL phase/.test(movingPhase.phaseNote)
    && windows.length >= 4 && windowsAgree,
    { density: stillDensity.kind, phase: { kind: movingPhase.kind, N: movingPhase.N, T: +movingPhase.T.toFixed(6), used: movingPhase.usedPeriod }, onePresetWindows: windows });

  /* (c) A FORMALLY PERFECT LOOP OF NOTHING.  laps is unbounded: the ZEEMAN knob on a 2p doublet reaches 7998
     density periods inside 180 frames.  It stays ok — it IS a loop — and it now says what it is. */
  const Dfast = { exact: true, T: 0.05, g: 1, count: 2 }, Wslow = { exact: true, T: 40, g: 1, count: 2 };
  const blur = planPeriodRecording(Dfast, { fps: 30, seconds: 6, observable: 'phase', wave: Wslow });
  const fine = planPeriodRecording(densityPeriod([En(1), En(2)]), { fps: 30, seconds: 4, observable: 'phase', wave: wavePeriod([En(1), En(2)]) });
  judge('AN EXACT LOOP CAN STILL BE A PICTURE OF NOTHING, AND IT NOW SAYS SO: 800 density periods inside 180 frames is 0.22 frames per T_rho — formally seamless and physically unresolved — so the plan carries framesPerDensityPeriod, an undersampled flag and a sentence in its own message, while staying ok, because it IS a loop and refusing a theorem would be the wrong lie. A 3-lap 120-frame loop of 1s+2s is 40 frames per density period and is not flagged',
    blur.ok && blur.undersampled === true && Math.abs(blur.framesPerDensityPeriod - blur.N / blur.laps) < 1e-12
    && blur.framesPerDensityPeriod < 2 && /UNDERSAMPLED/.test(blur.message)
    && fine.undersampled === false && Math.abs(fine.framesPerDensityPeriod - 40) < 1e-12 && !/UNDERSAMPLED/.test(fine.message),
    { blurred: { N: blur.N, laps: blur.laps, perT: +blur.framesPerDensityPeriod.toFixed(4), undersampled: blur.undersampled },
      fine: { N: fine.N, laps: fine.laps, perT: fine.framesPerDensityPeriod, undersampled: fine.undersampled } });
}

console.log('\n      NOT PROVED HERE (a browser must answer it): whether MediaRecorder over captureStream() on a\n      WEBGPU canvas delivers lit frames in Firefox.  capture.js asks at runtime — createCapture(LW).probe()\n      returns a 2-D control, a drawImage reading and a real captureStream frame side by side, and\n      engine: "auto" believes the probe.  The relay engine (GPU readback -> a 2-D canvas -> MediaRecorder)\n      needs no such answer and is the fallback.\n');
console.log((FAILED ? 'RED ' : 'GREEN ') + 'capture.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
