/* capture.js — THE CAMERA, AND THE LAWS THE FILM STANDS ON.
 *
 * 0.5.0 C7 · THE FILM IS THE KIT'S.  A video, a loop and a frame sequence are MIR's recorder (`createRecorder`,
 * lab/mir/render/recorder.js): it owns the take clock, the encoding (an MP4 through WebCodecs and its own muxer, or
 * lossless PNG frames in stored ZIP parts), the store on disk with recovery, the input guard and the progress.  What
 * λWAVES hands it is render-exact.js' `frame(i, ctx)`, which renders each frame through `readback` below.  The road this
 * file used to record on — MediaRecorder over captureStream(), the runtime PROBE of the WebGPU canvas, the 2-D RELAY, the
 * wall-clock tempo it measured and never claimed, `verifyVideo` and `pngSequence` — left with it: a film's tempo is now
 * exact by construction, and the kit proves its encoder before the first frame (render/encoder.js verifyEncoder).
 *
 * What stays here: THE PICTURE (a still PNG at any size the device allows, which no recorder makes), THE READBACK both
 * roads share, and the pure laws of PART 1 — the period plan, the schedule, the names, the pixels and the PNG encoder.
 *
 * ── A PICTURE ────────────────────────────────────────────────────────────────────────────────────────────────
 * The stage is RAY-MARCHED, so a bigger picture is a bigger RENDER, never an upscale: the canvas' backing store
 * is resized (its CSS box is untouched, so nothing on the page moves), ONE frame is encoded at that size through
 * the renderer's own `field.frame`, the swapchain texture is copied straight back to the CPU, and the bytes are
 * written as a PNG by the encoder in this file.  There is no 2-D canvas anywhere on that path, deliberately: the
 * picture never reads the canvas' image contents (the MANDELBROT kit's sixth mistake, `drawImage` of a WebGPU canvas
 * coming back blank, cannot reach it), and a 2-D canvas has an AREA cap far below 16384² in Firefox (~1.25e8 px).
 *
 * THE CEILING IS THE DEVICE'S, AND IT IS NOT THE GPU'S.  `field.js` USED to call `adapter.requestDevice()` with no
 * `requiredLimits`, so the device took the WebGPU DEFAULT limits whatever the adapter could do — maxTextureDimension2D
 * 8192.  WAVE 58 asked for the adapter's own limit, so the ceiling here is `canvasCap` — the rack passes 16384.
 * maxBufferSize is still the default 256 MiB, which binds nothing, because the readback is banded (`planBands`).
 * `maxPictureSize()` READS both limits rather than believing this paragraph, and `isDefaultLimit` says which of the
 * two worlds the device came up in.  For the readback the context must be configured `usage: RENDER_ATTACHMENT |
 * COPY_SRC` — the default is RENDER_ATTACHMENT alone — so `configureCopy` does it (and puts it back afterwards).
 *
 * ── ONE PERIOD, EXACTLY ──────────────────────────────────────────────────────────────────────────────────────
 * `period.js` gives the EXACT recurrence time of the density: T = 2 pi / gcd{|dE|}, a theorem while the energies
 * are commensurate, so rho(t + T) = rho(t) identically.  A loop of N frames therefore samples the HALF-OPEN
 * interval [t0, t0 + T):
 *
 *        t_k = t0 + (k / N) * T,      k = 0 ... N-1,        and the frame at t0 + T is DROPPED.
 *
 * THE ENDPOINT IS DROPPED, and this is the one decision that has a right answer.  ρ(t0 + T) = ρ(t0) exactly, so
 * the frame at the endpoint is not a new picture — it is frame 0 again.  Keeping it holds the first image on
 * screen for TWO frame times at the join while every other image is held for one: a visible hitch once per lap,
 * the double exposure.  Dropping it makes every gap in the cycle equal to T/N, the wrap-around gap from the last
 * frame back to the first included, and makes the loop's wall duration N/fps map onto exactly one period.
 * `endpointProof()` returns both schedules with their gaps so the choice is checked, not asserted.
 *
 * THE ARITHMETIC IS ALSO A CHOICE.  the OFFSET from t0 is written off(k) = (k/N)*T and never k*(T/N): k/N is
 * EXACT at k = N (any integer over itself is 1.0 with no rounding), so off(N) is T to the last BIT, and t_k =
 * t0 + off(k) puts the wrap frame at exactly the double t0 + T (render-exact.js re-measured why).
 *
 * ── TWO THINGS THAT WOULD HAVE BROKEN THE SEAM, BOTH MEASURED ────────────────────────────────────────────────
 *
 * (1) THE PICTURE IS NOT A FUNCTION OF THE STATE ALONE.  field.js seeds the ray-march's start offset with
 *     `(stats.presents % 97) / 97` — a 97-frame cycle of jitter that breaks banding.  Two renders of the SAME
 *     state at different points of that cycle are different images (measured: the same t twice, free, gives two
 *     different hashes; with the seed pinned it gives one).  So every captured frame pins the seed — 13 — and puts
 *     the counter back afterwards (hazard H1; render-exact.js pins it per film frame and witnesses it).
 *
 * (2) THE OBSERVABLE DECIDES WHICH PERIOD.  psi(t + T_rho) = e^{i phi} psi(t): the DENSITY repeats at T_rho, but
 *     arg psi, Re psi and Im psi carry phi, and the shipped observable is arg psi.  Measured on 1s+2s at
 *     t0 = 3.25, jitter pinned, on the rendered 320x240 frame (the node proof shows the global phase is exactly
 *     2 pi / 3 on the wavefunction itself, and T_psi = 3 T_rho):
 *
 *        view      seam at T_rho                             seam at T_psi   frame 0 vs the LAST KEPT frame
 *        density   d lum 5.2e-5 of 230.6 (2e-7 relative),    BIT-IDENTICAL   d lum 0.044, d chroma 0.055
 *                  d chroma 6.5e-5, no pixel changes class                   - 840x the seam residue
 *        phase     d chroma 1.04 of 11.7 - a 120-degree      BIT-IDENTICAL   d chroma 1.04 - THE SAME SIZE:
 *                  hue turn on the whole picture                             the seam would read as a jump
 *
 *     So `planLoop` reads `LW.mat.view` and uses T_psi = 2 pi / gcd{|E_a|} for the four phase-carrying views.
 *     For the density it keeps T_rho — the shortest true loop of that picture — and SAYS what the residue is: a
 *     couple of parts in 10^7, the f16 cache rounding a globally-rotated psi differently, not the physics.
 *     `{ pixelExact: true }` buys the bit-identical T_psi there too, at three laps of physics for the same frames.
 *
 * ── WAVE 58 · THREE CORRECTIONS TO THE PLANNER, FROM AN ADVERSARIAL REVIEW (REVIEW-2-2026-09-05 §1) ─────────
 * Each is gated in tests/capture.test.mjs §12.
 *   (1) `planPeriodRecording` believed the psi period WITHOUT CHECKING THAT THE DENSITY PERIOD WAS EXACT.  The
 *       implication W.exact => D.exact holds in exact arithmetic and both verdicts are numerical, computed here
 *       from energies the caller supplies — and planLoop supplied two DIFFERENT sets.  Result on the suite's own
 *       1s+2s fixture under STURMIAN: kind:'exact', closes:true, seamError:0, laps:0, and a true seam of 0.49 of
 *       a turn.  The guard is now `D.exact === true &&`, and a plan may only promise what the density closes.
 *   (2) THE STATIONARY BRANCH FIRED BEFORE THE OBSERVABLE WAS READ.  One energy means rho never changes; it does
 *       NOT mean arg psi never changes, and three shipped presets are one energy in a phase view.  The branch is
 *       now below the observable, and a phase view with a good wavePeriod falls through to the ordinary loop.
 *   (3) `laps` WAS UNBOUNDED and nothing said so.  A 2p doublet at ZEEMAN 0.05 plans 7998 density periods inside
 *       180 frames — an exact loop of something nobody can see move.  It is still `ok` (it IS a loop; refusing a
 *       theorem would be the wrong lie) and it now carries `framesPerDensityPeriod`, `undersampled` and a
 *       sentence in the message, because the only defect was silence.
 *
 * ── AND WHEN THERE IS NO PERIOD ──────────────────────────────────────────────────────────────────────────────
 * The box, an incommensurate spectrum, a Stark state: `densityPeriod` refuses, and so does this.  A refusal is
 * not silence — `planPeriodRecording` hands back the best near-recurrence found within the horizon, the seam
 * error recomputed from the energies themselves (the largest distance of dE*T/2pi from an integer, in turns),
 * and what that is as a fraction of a beat.  A caller that wants it anyway must pass `allowNear: true`, and what
 * comes back is labelled NEAR, never LOOP.
 *
 * ── WHAT THE RACK CALLS ──────────────────────────────────────────────────────────────────────────────────────
 *   const cap = createCapture(LW, { canvas: dom.canvas, energies, caption });   // once, after boot; LW is window.__LW
 *   THE CAMERA BUTTON        await cap.picture({ scale: 2 }) or ({ width: 3840 }) → { blob, name, w, h, bytes, ms, clipped }
 *   THE LOOP BUTTON'S PLAN   cap.planLoop({ fps: 30, seconds: 6 }) → plan.ok, plan.message, plan.schedule (the film
 *                            itself is render-exact.js': createFilm(LW).render({ schedule, format: 'mp4' }))
 *   cap.save(r) hands a file over (`handOver`); cap.limits() is the ceiling; every returned object carries `name`.
 *   `createCapture(LW, { energies })` — HAND IT THE HOST'S OWN ENERGY EXPRESSION.  Without it this file falls back to
 *   LW.reg.Ediag, which under a PROPAGATOR (the STURMIAN switch) is the label's <a|H|a>/<a|S|a> and not an eigenvalue;
 *   rather than guess wrong there it returns none, and the phase view is WARNED.  See WAVE 58.
 *
 *   THE PROOF is `node tests/capture.test.mjs`.
 *
 * ── MEASURED (headless Firefox, RTX 3070, 1400x814 stage, 96^3 grid, 2026-09-05) ─────────────────────────────
 *   a picture at 1x (1260x733)   0.23 s, 78 kB   ·   at 3x (3780x2199)   1.20 s, 334 kB
 *   2048^2  0.73 s   ·   4096^2  2.4 s   ·   6144^2  5.2 s   ·   8192^2  9.0 s, 1.95 MB
 *   two pictures of the same paused state come back BYTE-IDENTICAL (the jitter pin), under distinct names.
 */

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════
   PART 1 — THE LAWS.  Nothing below touches the DOM, WebGPU or a clock; all of it is proved in node.
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

import { densityPeriod } from './period.js';
import { crc32 } from './mir/core/png.js';
import { saveBlob } from './mir/folders/save-blob.js';

export const AU_FS = 0.02418884326;                 // 1 a.u. of time, in femtoseconds (period.js' constant)
export const ENDPOINT = 'exclusive';                // [t0, t0+T): the endpoint frame is DROPPED.  See endpointProof.
export const WEBGPU_DEFAULT_MAX_TEXTURE_2D = 8192;  // what requestDevice() with no requiredLimits gives
export const WEBGPU_DEFAULT_MAX_BUFFER = 268435456; // 256 MiB, likewise

/* ── the readback's arithmetic ─────────────────────────────────────────────────────────────────────────────── */

/** WebGPU demands `bytesPerRow` be a multiple of 256 for a texture-to-buffer copy: the padded stride of w pixels. */
export function alignedBytesPerRow(w, bpp = 4, align = 256) {
  return Math.ceil((w * bpp) / align) * align;
}

/**
 * A full-frame readback of a big picture is bigger than maxBufferSize (8192² RGBA is 256 MiB exactly, the limit
 * itself), so the copy is BANDED: consecutive row groups that tile [0, h) with no gap and no overlap, each within
 * the buffer limit.  Returns [{ y0, rows, bytes }]; throws only if a single ROW cannot fit, which nothing can fix.
 */
export function planBands(h, bytesPerRow, maxBytes = WEBGPU_DEFAULT_MAX_BUFFER) {
  h = Math.max(0, Math.floor(h));
  if (bytesPerRow > maxBytes) throw new Error('capture: one row of ' + bytesPerRow + ' bytes exceeds maxBufferSize ' + maxBytes);
  const per = Math.max(1, Math.floor(maxBytes / bytesPerRow));
  const out = [];
  for (let y = 0; y < h; y += per) { const rows = Math.min(per, h - y); out.push({ y0: y, rows, bytes: rows * bytesPerRow }); }
  return out;
}

/**
 * THE CEILING, read rather than assumed.  `limits` is a GPUSupportedLimits (or any object with the two fields).
 * `side` is what a square picture may be; `pixels` its area; `why` names which limit is in force.
 */
export function maxPictureSize(limits, cap = 32767) {
  const tex = (limits && limits.maxTextureDimension2D) || WEBGPU_DEFAULT_MAX_TEXTURE_2D;
  const buf = (limits && limits.maxBufferSize) || WEBGPU_DEFAULT_MAX_BUFFER;
  const side = Math.max(1, Math.min(tex, cap));
  return {
    side, pixels: side * side, maxTextureDimension2D: tex, maxBufferSize: buf, canvasCap: cap,
    isDefaultLimit: tex === WEBGPU_DEFAULT_MAX_TEXTURE_2D,
    why: tex <= cap ? 'the device\'s maxTextureDimension2D' : 'the browser\'s canvas cap',
    note: tex === WEBGPU_DEFAULT_MAX_TEXTURE_2D
      ? 'this is the WebGPU DEFAULT limit, not the adapter\'s: field.js calls requestDevice() with no requiredLimits'
      : 'the adapter\'s limit, requested explicitly',
  };
}

/**
 * The size actually rendered.  Give `scale` (a multiple of what is on screen) or `width` and/or `height`; the
 * ASPECT of the stage is kept unless both are given, because the renderer's framing follows the target's aspect
 * and a picture that is not the stage's shape is not the picture that was on screen.  Clamps to `max` and says so.
 */
export function fitPicture({ srcW, srcH, scale, width, height, max = WEBGPU_DEFAULT_MAX_TEXTURE_2D }) {
  srcW = Math.max(1, Math.round(srcW)); srcH = Math.max(1, Math.round(srcH));
  let w, h, aspectKept = true;
  if (width && height) { w = Math.round(width); h = Math.round(height); aspectKept = Math.abs((w / h) - (srcW / srcH)) < 1e-6; }
  else if (width) { w = Math.round(width); h = Math.max(1, Math.round(width * srcH / srcW)); }
  else if (height) { h = Math.round(height); w = Math.max(1, Math.round(height * srcW / srcH)); }
  else { const s = scale || 1; w = Math.max(1, Math.round(srcW * s)); h = Math.max(1, Math.round(srcH * s)); }
  w = Math.max(1, w); h = Math.max(1, h);
  let clipped = false;
  if (w > max || h > max) { const k = max / Math.max(w, h); w = Math.max(1, Math.floor(w * k)); h = Math.max(1, Math.floor(h * k)); clipped = true; }
  return { w, h, clipped, aspectKept, scaleW: w / srcW, scaleH: h / srcH, srcW, srcH, max };
}

/* ── THE SCHEDULE ──────────────────────────────────────────────────────────────────────────────────────────── */

/**
 * N frames over exactly one period, the endpoint dropped.  `at(k) = t0 + (k/N)*T` — see the header for why that
 * form and not the accumulating one.  `at(N)` is t0 + T to the last bit, which is what makes the seam close.
 */
export function loopSchedule({ T, N, t0 = 0 }) {
  N = Math.max(1, Math.round(N));
  const off = (k) => (k / N) * T;                        // EXACTLY T at k = N; this is where the seam's exactness lives
  const at = (k) => t0 + off(k);
  return {
    T, N, t0, dt: T / N, endpoint: ENDPOINT, at, off,
    /** the N frames of the loop (or N+1 with `{ endpoint: true }` — the schedule this file REFUSES) */
    all(opts) { const n = (opts && opts.endpoint) ? N + 1 : N, out = new Array(n); for (let k = 0; k < n; k++) out[k] = at(k); return out; },
    /** every gap in the CYCLE: the N-1 between consecutive frames, then the wrap from the last frame back to t0+T */
    gaps(opts) { const s = this.all(opts), g = []; for (let k = 1; k < s.length; k++) g.push(s[k] - s[k - 1]); g.push((t0 + T) - s[s.length - 1]); return g; },
  };
}

/**
 * How many frames, and what that does to the tempo.  One period must be covered by a WHOLE number of frames, so
 * the wall duration is quantized to 1/fps and the playback rate moves by at most half a frame in N — reported as
 * `rateShift`, never hidden.  Give `frames`, or `seconds` (wall), or `rate` (a.u. per wall second, the clock's).
 */
export function planFrames({ T, fps = 30, frames, seconds, rate, minFrames = 2, maxFrames = 36000 }) {
  if (!(T > 0)) throw new Error('capture: planFrames needs a positive period');
  if (!(fps > 0)) throw new Error('capture: planFrames needs a positive fps');
  const wanted = frames ? { by: 'frames', n: frames } : seconds ? { by: 'seconds', n: seconds * fps } : rate ? { by: 'rate', n: fps * T / rate } : null;
  if (!wanted) throw new Error('capture: planFrames needs one of frames, seconds or rate');
  const ideal = wanted.n;
  let N = Math.round(ideal);
  const clampedLow = N < minFrames, clampedHigh = N > maxFrames;
  N = Math.max(minFrames, Math.min(maxFrames, N));
  const sec = N / fps, eff = T / sec;
  return {
    T, N, fps, dt: T / N, seconds: sec, rate: eff, requestedRate: rate || null, by: wanted.by,
    idealFrames: ideal, clamped: clampedLow || clampedHigh, clampedLow, clampedHigh,
    /** the tempo's fractional shift against the rate that was asked for (bounded by 1/(2N-1) when N was not clamped) */
    rateShift: rate ? eff / rate - 1 : 0,
    seconds_fs: T * AU_FS,
  };
}

/**
 * THE PERIOD OF psi ITSELF, which is NOT the period of the density.
 *
 * rho repeats when every DIFFERENCE has turned a whole number of times; psi repeats only when every ENERGY has.
 * psi(t + T_rho) = e^{i phi} psi(t) for some global phi, and the views that paint arg psi, Re psi or Im psi paint
 * that phi: for 1s+2s at T_rho = 16.755 the whole hue wheel has turned 120 degrees.  So a loop in the PHASE view
 * must run to T_psi = 2 pi / gcd{|E_a|}, always an integer multiple of T_rho (gcd{E} divides every difference).
 *
 * The trick is that period.js already computes a gcd of DIFFERENCES with a verification step, and the differences
 * of {0} u {E_a} are exactly the E_a together with the E_a - E_b — whose gcd is gcd{E_a}.  So this is one line,
 * and it inherits the verification (an energy set whose gcd cannot be trusted goes to the near-recurrence scan).
 */
export function wavePeriod(energies, opts) {
  return densityPeriod([0].concat(Array.from(energies || [])), opts);
}

/** the views whose picture carries the GLOBAL phase of psi, and so repeat at T_psi rather than T_rho */
export const PHASE_VIEWS = ['phase', 'real', 'imag', 'reim'];
export const VIEW_NAMES = ['density', 'phase', 'real', 'imag', 'diff', 'reim'];   // field.js' VIEW, by index
export function viewCarriesGlobalPhase(view) {
  const name = typeof view === 'number' ? VIEW_NAMES[view] : String(view);
  return PHASE_VIEWS.indexOf(name) >= 0;
}

/** THE SEAM, recomputed from the energies: max over pairs of the distance of dE*T/2pi from an integer, IN TURNS. */
export function seamError(energies, T) {
  const E = Array.from(energies || []);
  let worst = 0;
  for (let i = 0; i < E.length; i++) for (let j = i + 1; j < E.length; j++) {
    const x = Math.abs(E[i] - E[j]) * T / (2 * Math.PI);
    const f = Math.abs(x - Math.round(x));
    if (f > worst) worst = f;
  }
  return worst;
}

/**
 * THE PROOF OF THE ENDPOINT RULE, as data.  Returns the two candidate schedules with the facts that decide
 * between them: whether the last sample is the same logical time as the first modulo T (a duplicate frame), and
 * whether every gap in the cycle is equal.  `rho` (optional) is any function of t — hand it the real density and
 * `duplicateValue` becomes a measurement rather than an argument about phases.
 */
export function endpointProof({ T, N, t0 = 0, rho = null }) {
  const s = loopSchedule({ T, N, t0 });
  const wrap = (t) => { const x = (t - t0) / T; return x - Math.floor(x + 1e-15); };     // phase in [0,1)
  const shape = (endpoint) => {
    const times = s.all({ endpoint }), gaps = s.gaps({ endpoint });
    const uniform = gaps.every((g) => Math.abs(g - s.dt) <= 1e-9 * Math.max(1, s.dt));
    const first = times[0], last = times[times.length - 1];
    const samePhase = Math.abs(wrap(last) - wrap(first)) < 1e-12;
    const out = {
      frames: times.length, first, last, gaps, uniform, minGap: Math.min(...gaps), maxGap: Math.max(...gaps),
      /** the last frame lands on the same logical picture as the first: it is frame 0 again */
      duplicatesFirst: endpoint ? samePhase : false,
      wallSeconds: (n, fps) => n / fps,
    };
    if (rho) { out.rhoFirst = rho(first); out.rhoLast = rho(last); out.duplicateValue = Math.abs(out.rhoLast - out.rhoFirst); }
    return out;
  };
  return {
    T, N, t0, dt: s.dt, chosen: ENDPOINT,
    exclusive: shape(false), inclusive: shape(true),
    why: 'rho(t0+T) = rho(t0) exactly, so the inclusive schedule\'s last frame IS frame 0: it holds the first image for two frame times at the join (its wrap gap is 0, every other gap is T/N) and stretches the loop to (N+1)/fps for one period. The exclusive schedule\'s gaps are all T/N, the wrap included.',
  };
}

/**
 * THE REFUSAL, and what is offered instead.  `period` is exactly what `densityPeriod` (or LW.period) returns;
 * `energies` lets the seam error be recomputed here rather than trusted.  Never throws — the caller gets an
 * object that says what it is.
 *
 *   kind 'exact'       ok, a true loop
 *   kind 'stationary'  one energy: the density never changes, so one frame is the whole loop
 *   kind 'near'        no exact period: refused unless allowNear, with T, err and the message to show
 *   kind 'none'        no period and no near-recurrence at all (Stark, a live A→B mix): refused outright
 */
export function planPeriodRecording(period, { fps = 30, frames, seconds, rate, t0 = 0, allowNear = false, energies = null, minFrames = 2, maxFrames = 36000, observable = 'density', pixelExact = false, wave = null } = {}) {
  const D = period || {};
  const fmt = (T) => T.toPrecision(8) + ' a.u. (' + (T * AU_FS).toPrecision(5) + ' fs)';
  const reason = D.stark ? 'a static Stark field: the Stark energies are not commensurate'
    : D.mix ? 'a live A -> B transition: the mix has its own clock (the Rabi period), not the density\'s'
    : 'the energies are incommensurate';
  /* WHICH PERIOD?  THE OBSERVABLE DECIDES (see the header).  `wave` is the wavePeriod result when the caller has
     one; without it the density period is used and the choice is REPORTED rather than silently made.
     ── WAVE 58 · TWO CORRECTIONS, from an adversarial review of this file (REVIEW-2-2026-09-05 §1.1, §1.3) ──
     (1) `D.exact` IS NOW PART OF THE GUARD.  In exact arithmetic W.exact implies D.exact, since gcd{|E|} divides
     every difference — which is why the check was absent.  But both verdicts are NUMERICAL, with tolerances, and
     a caller can compute them from two DIFFERENT energy sets (planLoop did, under STURMIAN).  Believing W while
     D says "no period at all" returned kind:'exact', closes:true, seamError:0 for a state whose true seam was
     0.49 of a turn — antiphase, the worst a seam can be — and the tell was `laps: 0`.  A plan may only promise a
     loop the DENSITY closes too.
     (2) THE STATIONARY BRANCH NOW READS THE OBSERVABLE FIRST.  "One energy: the density never changes, so every
     frame is the same picture" is true of rho and false of arg psi, Re psi and Im psi, which turn at 2*pi/|E| —
     and three shipped presets are one energy IN A PHASE VIEW (2p+ ships view:'phase', and its own note says the
     picture lives in arg psi).  wavePeriod([E]) already computes that period correctly; it was never asked. */
  const needsPhase = viewCarriesGlobalPhase(observable);
  const W = (needsPhase || pixelExact) && D.exact === true && wave && wave.exact && wave.T > 0 ? wave : null;
  const stationaryDensity = !!(D.stationary || (D.exact && !(D.T > 0)));
  if (stationaryDensity && !W) {
    return { ok: true, kind: 'stationary', T: 0, N: 1, fps, dt: 0, seconds: 1 / fps, frames: 1, schedule: loopSchedule({ T: 0, N: 1, t0 }), closes: true, seamError: 0, label: 'STATIONARY', observable, carriesGlobalPhase: needsPhase, usedPeriod: 'density', Tdensity: 0, Twave: wave ? wave.T : null, laps: 1, pixelExact: false,
      phaseNote: 'the observable is ' + observable + ', which does not carry the global phase of psi, so one energy really is one picture',
      message: 'One energy: the density never changes, so every frame is the same picture and any length loops. One frame is the honest recording.' };
  }
  if (!(D.T > 0) && !W) {
    return { ok: false, kind: 'none', T: 0, exact: false, label: 'NO LOOP', observable, message: 'NO EXACT PERIOD and no near-recurrence to offer - ' + reason + '. There is nothing here that closes; record a free clip instead.' };
  }
  const P = W || D;                                     // the period this recording will actually run to
  const laps = W ? (D.T > 0 ? Math.round(W.T / D.T) : 1) : 1;
  const phaseNote = needsPhase
    ? (W ? (D.T > 0
        ? 'the observable is ' + observable + ', which paints the GLOBAL phase of psi, so the loop runs to T_psi = 2*pi/gcd{|E|} = ' + laps + ' x T_rho and the hue closes with it'
        : 'the DENSITY never changes here - one energy - but the observable is ' + observable + ', which paints the GLOBAL phase of psi: it turns at T_psi = 2*pi/|E| and the picture turns with it, so the loop runs to T_psi and closes there. One frame would have been a still of something that moves.')
         : 'WARNING: the observable is ' + observable + ', which paints the GLOBAL phase of psi - psi(t+T_rho) = e^{i phi} psi(t), so the hue has turned by the seam and it WILL show. No exact psi period was available to loop to instead.')
    : (W ? 'looping at T_psi (' + laps + ' density periods) so the frames match bit for bit'
         : 'the density repeats at T_rho exactly; the PICTURE repeats to a couple of parts in 1e7 of its mean luminance - the f16 cache rounding a globally-rotated psi differently, 840x smaller than the step between two frames - pass pixelExact for the bit-identical T_psi');
  const base = planFrames({ T: P.T, fps, frames, seconds, rate, minFrames, maxFrames });
  /* ── WAVE 58 · THE THIRD FINDING (REVIEW-2 §1.4): A PERFECT LOOP CAN BE A PICTURE OF NOTHING ──────────────
     `laps` is unbounded.  With the ZEEMAN knob at 0.05 on a 2p doublet the plan asks for 7998 density periods
     inside 180 frames - 0.02 frames per T_rho - and it is a formally exact loop of a state nobody can see move.
     It is NOT refused, because it IS an exact loop and refusing a theorem would be the wrong lie; it is COUNTED
     and SAID.  Two frames per density period is Nyquist on the fastest beat the loop contains. */
  const framesPerDensityPeriod = (W && D.T > 0) ? base.N / laps : base.N;
  const undersampled = framesPerDensityPeriod < 2;
  const meta = { observable, carriesGlobalPhase: needsPhase, usedPeriod: W ? 'wave' : 'density', Tdensity: D.T, Twave: wave ? wave.T : null, laps, pixelExact: !!W, phaseNote, framesPerDensityPeriod, undersampled };
  const sched = loopSchedule({ T: P.T, N: base.N, t0 });
  const measured = energies ? seamError(energies, P.T) : (typeof P.err === 'number' ? P.err : null);
  if (P.exact) {
    return Object.assign({}, base, meta, {
      ok: true, kind: 'exact', schedule: sched, closes: true, seamError: 0, measuredSeamError: measured, label: 'EXACT LOOP',
      message: 'EXACT LOOP · ' + base.N + ' frames at ' + fps + ' fps = ' + base.seconds.toFixed(3) + ' s of wall for one period T = ' + fmt(P.T)
        + (P.g ? ' (gcd ' + P.g.toPrecision(4) + ' Eh over ' + P.count + ' energies)' : '')
        + '. The last frame is t0 + ' + (base.N - 1) + 'T/' + base.N + '; the frame at t0 + T is dropped because it IS frame 0. ' + phaseNote + '.'
        + (undersampled ? ' UNDERSAMPLED: that is ' + laps + ' density periods in ' + base.N + ' frames, ' + framesPerDensityPeriod.toFixed(2) + ' frames per T_rho. The loop closes exactly and the motion inside it is not resolved - ask for more frames, or turn the field down.' : ''),
    });
  }
  const err = measured === null ? 1 : measured;
  const message = 'NO EXACT PERIOD (' + (P.count || '?') + ' incommensurate energies) - ' + reason
    + '. The best near-recurrence within the horizon is T = ' + fmt(P.T) + ', and it MISSES: the worst pair is '
    + err.toPrecision(3) + ' of a turn from closing (' + (100 * err).toFixed(2) + '% of a beat), so the last frame does not meet the first. '
    + 'Record it as NEAR if you want it - the seam will be visible to that much.';
  if (!allowNear) return Object.assign({ ok: false, kind: 'near', T: P.T, exact: false, err, seamError: err, label: 'NEAR', message, plan: Object.assign({}, base, meta, { schedule: sched }) }, meta);
  return Object.assign({}, base, meta, { ok: true, kind: 'near', schedule: sched, closes: false, seamError: err, err, label: 'NEAR', message });
}

/* ── NAMES ─────────────────────────────────────────────────────────────────────────────────────────────────── */

/** a filename fragment that every filesystem accepts: lowercase, [a-z0-9] runs joined by '-', never empty. */
export function slug(s, max = 48) {
  let out = String(s === undefined || s === null ? '' : s).normalize('NFKD').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (out.length > max) out = out.slice(0, max).replace(/-+$/g, '');
  return out;
}

/** UTC, sortable, and legal on Windows (no colons): YYYYMMDD-HHMMSS */
export function stamp(date = new Date()) {
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return date.getUTCFullYear() + p(date.getUTCMonth() + 1) + p(date.getUTCDate()) + '-' +
    p(date.getUTCHours()) + p(date.getUTCMinutes()) + p(date.getUTCSeconds());
}

/**
 * The name a capture is saved under.  Everything it carries is a fact about the capture, so two files never
 * disagree with each other: what it is, what state, how big, how fast, how long a period, and when.
 *   lambdawaves-loop-1s-2s-1920x1080-30fps-360f-t16.755au-20260905-203107.webm
 */
export function captureName({ kind = 'still', label = '', w = 0, h = 0, fps = 0, frames = 0, T = 0, ext = 'png', date = new Date(), prefix = 'lambdawaves' } = {}) {
  const bits = [slug(prefix, 24), slug(kind, 16)];
  const L = slug(label, 40); if (L) bits.push(L);
  if (w && h) bits.push(w + 'x' + h);
  if (fps) bits.push(slug(String(fps), 8) + 'fps');
  if (frames) bits.push(frames + 'f');
  if (T > 0) bits.push('t' + (T >= 1000 ? T.toFixed(0) : T >= 1 ? T.toFixed(3) : T.toPrecision(3)).replace(/\./g, '_') + 'au');
  bits.push(stamp(date));
  return bits.filter(Boolean).join('-') + '.' + slug(ext, 8);
}

/**
 * COLLISION-FREE, and the guard is the caller's ledger — a second of wall clock holds many captures.  Returns
 * `name` if free, else name-2, name-3 ... with the suffix BEFORE the extension.  Adds the answer to `taken`.
 */
export function uniqueName(name, taken) {
  const set = taken instanceof Set ? taken : new Set(taken || []);
  const i = name.lastIndexOf('.'), stem = i > 0 ? name.slice(0, i) : name, ext = i > 0 ? name.slice(i) : '';
  let out = name;
  for (let n = 2; set.has(out); n++) out = stem + '-' + n + ext;
  set.add(out);
  return out;
}

/* ── PIXELS ────────────────────────────────────────────────────────────────────────────────────────────────── */

/**
 * The bytes as they come off the GPU are padded to 256 and, on every desktop this runs on, BGRA (the preferred
 * canvas format is bgra8unorm).  This unpads, swizzles to RGBA, and — since the context is configured
 * `alphaMode: 'opaque'`, i.e. the alpha channel is not what is on screen — forces alpha to 255.
 */
export function toRGBA(src, w, h, { bytesPerRow = w * 4, bgra = false, opaque = true } = {}) {
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    let s = y * bytesPerRow, d = y * w * 4;
    for (let x = 0; x < w; x++, s += 4, d += 4) {
      if (bgra) { out[d] = src[s + 2]; out[d + 1] = src[s + 1]; out[d + 2] = src[s]; }
      else { out[d] = src[s]; out[d + 1] = src[s + 1]; out[d + 2] = src[s + 2]; }
      out[d + 3] = opaque ? 255 : src[s + 3];
    }
  }
  return out;
}

/**
 * The 2-D overlays (VORTEX, KEPLER, PARTICLES) are drawn by their owners at DISPLAY resolution
 * and cannot be re-rendered at 4x without touching their modules, so compositing them into a bigger picture is an
 * UPSCALE and is labelled one.  Straight (non-premultiplied) alpha over, bilinear in the layer.  Mutates `base`.
 */
export function compositeOver(base, bw, bh, layer, lw, lh) {
  const sx = lw / bw, sy = lh / bh;
  for (let y = 0; y < bh; y++) {
    const fy = Math.min(lh - 1, Math.max(0, (y + 0.5) * sy - 0.5)), y0 = Math.floor(fy), y1 = Math.min(lh - 1, y0 + 1), wy = fy - y0;
    for (let x = 0; x < bw; x++) {
      const fx = Math.min(lw - 1, Math.max(0, (x + 0.5) * sx - 0.5)), x0 = Math.floor(fx), x1 = Math.min(lw - 1, x0 + 1), wx = fx - x0;
      const o00 = (y0 * lw + x0) * 4, o01 = (y0 * lw + x1) * 4, o10 = (y1 * lw + x0) * 4, o11 = (y1 * lw + x1) * 4;
      const c = [0, 0, 0, 0];
      for (let i = 0; i < 4; i++) {
        const a = layer[o00 + i] * (1 - wx) + layer[o01 + i] * wx, b = layer[o10 + i] * (1 - wx) + layer[o11 + i] * wx;
        c[i] = a * (1 - wy) + b * wy;
      }
      const al = c[3] / 255; if (al <= 0) continue;
      const d = (y * bw + x) * 4;
      base[d] = Math.round(c[0] * al + base[d] * (1 - al));
      base[d + 1] = Math.round(c[1] * al + base[d + 1] * (1 - al));
      base[d + 2] = Math.round(c[2] * al + base[d + 2] * (1 - al));
      base[d + 3] = 255;
    }
  }
  return base;
}

/* ── PNG ───────────────────────────────────────────────────────────────────────────────────────────────────── */
/* Written here rather than handed to canvas.toBlob for two reasons, both load-bearing: a 2-D canvas has an AREA
   cap far below 8192² in Firefox (~1.25e8 px), and the bytes never came from a canvas in the first place — they
   came off the GPU.  Filtering is the standard per-row heuristic over None/Sub/Up/Paeth; the deflate is pluggable
   (CompressionStream in the browser, zlib in the proof) with a pure-JS STORED fallback that always works. */

/** crc32(bytes) — the kit's (lab/mir/core/png.js: the same table and framing this encoder always used) */
export { crc32 };

export function adler32(bytes) {
  let a = 1, b = 0;
  for (let i = 0; i < bytes.length; i++) { a = (a + bytes[i]) % 65521; b = (b + a) % 65521; }
  return ((b << 16) | a) >>> 0;
}

/** a valid zlib stream carrying the data in STORED (uncompressed) deflate blocks — no compressor, always right */
export function zlibStored(data) {
  const MAX = 65535, blocks = Math.max(1, Math.ceil(data.length / MAX));
  const out = new Uint8Array(2 + blocks * 5 + data.length + 4);
  let p = 0;
  out[p++] = 0x78; out[p++] = 0x01;
  for (let i = 0; i < blocks; i++) {
    const off = i * MAX, len = Math.min(MAX, data.length - off), last = i === blocks - 1 ? 1 : 0;
    out[p++] = last;
    out[p++] = len & 255; out[p++] = (len >>> 8) & 255;
    out[p++] = (~len) & 255; out[p++] = ((~len) >>> 8) & 255;
    out.set(data.subarray(off, off + len), p); p += len;
  }
  const ad = adler32(data);
  out[p++] = (ad >>> 24) & 255; out[p++] = (ad >>> 16) & 255; out[p++] = (ad >>> 8) & 255; out[p++] = ad & 255;
  return out.subarray(0, p);
}

/** the scanlines with a filter byte each, chosen per row by the standard minimum-sum-of-absolutes heuristic */
export function pngFilter(rgba, w, h, force = -1) {
  const bpp = 4, stride = w * bpp, out = new Uint8Array(h * (stride + 1));
  const cand = [new Uint8Array(stride), new Uint8Array(stride), new Uint8Array(stride), new Uint8Array(stride), new Uint8Array(stride)];
  let prev = new Uint8Array(stride);
  for (let y = 0; y < h; y++) {
    const row = rgba.subarray(y * stride, (y + 1) * stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? row[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
      cand[0][x] = row[x];
      cand[1][x] = (row[x] - a) & 255;
      cand[2][x] = (row[x] - b) & 255;
      cand[3][x] = (row[x] - ((a + b) >> 1)) & 255;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      cand[4][x] = (row[x] - (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255;
    }
    let best = force >= 0 ? force : 0;
    if (force < 0) {
      let bestSum = Infinity;
      for (let f = 0; f < 5; f++) { let s = 0; for (let x = 0; x < stride; x++) { const v = cand[f][x]; s += v < 128 ? v : 256 - v; } if (s < bestSum) { bestSum = s; best = f; } }
    }
    out[y * (stride + 1)] = best;
    out.set(cand[best], y * (stride + 1) + 1);
    prev = row;
  }
  return out;
}

function chunk(type, data) {
  const out = new Uint8Array(12 + data.length), dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

/** the container around an already-deflated IDAT payload: 8-bit RGBA, non-interlaced */
export function buildPNG(idat, w, h) {
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = new Uint8Array(13), dv = new DataView(ihdr.buffer);
  dv.setUint32(0, w); dv.setUint32(4, h);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const parts = [sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', new Uint8Array(0))];
  let n = 0; for (const p of parts) n += p.length;
  const out = new Uint8Array(n); let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

/** the whole encoder.  `deflate` is (Uint8Array) -> Uint8Array | Promise<Uint8Array> of a ZLIB stream. */
export async function encodePNG(rgba, w, h, { deflate = null, filter = -1 } = {}) {
  const raw = pngFilter(rgba, w, h, filter);
  const z = deflate ? await deflate(raw) : (typeof CompressionStream === 'function' ? await deflateStream(raw) : zlibStored(raw));
  return buildPNG(z instanceof Uint8Array ? z : new Uint8Array(z), w, h);
}

/** the browser's own deflate — CompressionStream('deflate') emits a ZLIB stream, which is exactly what IDAT wants */
export async function deflateStream(bytes) {
  const cs = new CompressionStream('deflate');
  const wr = cs.writable.getWriter(); wr.write(bytes); wr.close();
  const parts = []; let n = 0;
  const rd = cs.readable.getReader();
  for (;;) { const { value, done } = await rd.read(); if (done) break; parts.push(value); n += value.length; }
  const out = new Uint8Array(n); let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════
   PART 2 — THE INSTRUMENT.  Everything below needs a browser; nothing above does.
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

/**
 * THE CAPTION (0.4.0 S3 · F2): the stage text's one plain-Unicode line (`H₂O · 1b1 HOMO · STO-3G`, or SPECTRUM's states)
 * drawn into a 2-D frame, so a picture, a loop and a video carry the name — the DOM formula never reaches an export, and a
 * teacher's slide needs it.  No KaTeX in a canvas: the plain form.  At the foot, left, sized to the frame, white over a soft
 * dark stroke so it reads on any ground.  KIT BRIEF 6 (`recorder.overlay(i, ctx)`) replaces it (0.5.x, D5).
 */
export function drawCaption(g, W, H, text) {
  if (!text) return false;
  const px = Math.max(12, Math.round(H * 0.034)), pad = Math.round(px * 0.9);
  g.save(); g.font = `${px}px "STIX Two Math", "Latin Modern Math", serif`; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.lineJoin = 'round'; g.lineWidth = Math.max(2, px / 6); g.strokeStyle = 'rgba(0,0,0,0.55)'; g.fillStyle = 'rgba(255,255,255,0.94)';
  g.strokeText(text, pad, H - pad); g.fillText(text, pad, H - pad); g.restore();
  return true;
}

/** the caption over the foot of an RGBA frame, at the frame's own size: drawn into a strip the height of the foot and
 *  composited straight-alpha over it — a picture and every film frame carry the line the same way.  Mutates `rgba`. */
export function captionOver(rgba, w, h, text) {
  if (!text || typeof document === 'undefined') return false;
  const sh = Math.min(h, Math.ceil(h * 0.1) + 8), c2 = document.createElement('canvas'); c2.width = w; c2.height = sh;
  const g2 = c2.getContext('2d'); g2.translate(0, sh - h); drawCaption(g2, w, h, text);
  compositeOver(rgba.subarray((h - sh) * w * 4), w, sh, g2.getImageData(0, 0, w, sh).data, w, sh);
  return true;
}

/** the context's usage.  COPY_SRC is not the default and no readback can be taken without it; `false` puts the plain one back. */
export function configureCopy(f, canvas, withCopy) {
  const c = f && f.ok && canvas ? canvas.getContext('webgpu') : null;
  if (!c) return false;
  const base = { device: f.device, format: f.format, alphaMode: 'opaque' };
  if (f.gamut && f.gamut !== 'srgb') base.colorSpace = 'display-p3';
  if (withCopy) base.usage = GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC;
  c.configure(base);
  return true;
}

/**
 * THE READBACK — ONE FRAME AT A GIVEN SIZE, OFF THE GPU: the one road for a picture and for every film frame
 * (render-exact.js' `frame(i, ctx)`).  `draw()` renders through the renderer's own `field.frame` — the same shader,
 * camera and material the screen is showing — and the swapchain texture is copied back, banded under maxBufferSize.
 * THE RENDER AND THE COPY SIT IN ONE SYNCHRONOUS BLOCK: the swapchain texture EXPIRES at the end of the animation-frame
 * task, so a copy taken in a later task gets a fresh, CLEARED texture — black.  THE SETTLE is `onSubmittedWorkDone`: the
 * frame is complete when the copy has run, not when a rAF fired.  `wit` receives what a film's witnesses read at that
 * moment, before the await on the map can let anything else in: the present count, the generation step, the canvas size.
 * Returns { rgba, w, h, ms }; the caller puts the canvas' backing store back.
 */
export async function readback(f, canvas, w, h, draw, wit = null) {
  const d = f.device, c = canvas.getContext('webgpu');
  const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  if (canvas.width !== w) canvas.width = w;             // assigning even the same value would reallocate the swapchain
  if (canvas.height !== h) canvas.height = h;
  const gen0 = f.stats.generation;
  draw();
  const tex = c.getCurrentTexture();                    // the SAME texture draw() just rendered into
  const bpr = alignedBytesPerRow(w);
  const bands = planBands(h, bpr, d.limits.maxBufferSize);
  const enc = d.createCommandEncoder();
  const bufs = bands.map((b) => {
    const buf = d.createBuffer({ size: bpr * b.rows, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
    enc.copyTextureToBuffer({ texture: tex, origin: [0, b.y0, 0] }, { buffer: buf, bytesPerRow: bpr, rowsPerImage: b.rows }, [w, b.rows, 1]);
    return { buf, y0: b.y0, rows: b.rows };
  });
  d.queue.submit([enc.finish()]);
  await d.queue.onSubmittedWorkDone();                  // the texture must outlive the copy: only then may the canvas resize
  if (wit) { wit.presents = f.stats.presents; wit.generation = f.stats.generation - gen0; wit.canvasW = canvas.width; wit.canvasH = canvas.height; }
  const bgra = /^bgra/.test(f.format);
  const rgba = new Uint8Array(w * h * 4);
  for (const b of bufs) {
    await b.buf.mapAsync(GPUMapMode.READ);
    const src = new Uint8Array(b.buf.getMappedRange());
    rgba.set(toRGBA(src, w, b.rows, { bytesPerRow: bpr, bgra, opaque: true }), b.y0 * w * 4);
    b.buf.unmap(); b.buf.destroy();
  }
  return { rgba, w, h, ms: (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0 };
}

/** THE HAND-OVER, the one both roads reach (cap.save and render-exact's film.save).  The kit's saveBlob takes the share sheet
 *  when the browser offers one (the iPad's "Save Image"), but a share is allowed only inside the tap that asked, and saveBlob
 *  neither awaits it nor falls back: after a film's render or a GPU readback the activation is spent, share() rejects, and
 *  NOTHING was saved (Chrome, Edge, macOS Safari).  So the kit's road only while the activation is live; otherwise the
 *  `<a download>` λWAVES used before C7, its URL kept as the kit keeps one (a video ten minutes, anything else one).  A
 *  browser without navigator.userActivation counts as spent.  tests/film-handover.browser-test.mjs is its guard. */
export function handOver(blob, name) {
  if (typeof navigator !== 'undefined' && navigator.userActivation && navigator.userActivation.isActive) return saveBlob(blob, name);
  const url = URL.createObjectURL(blob), a = document.createElement('a'), video = (blob.type || '').startsWith('video/') || /\.mp4$/i.test(name);
  a.href = url; a.download = name; a.rel = 'noopener';
  document.body.appendChild(a); a.click();
  setTimeout(() => { try { URL.revokeObjectURL(url); } catch (_) { /* gone */ } a.remove(); }, video ? 10 * 60 * 1000 : 60000);
  return 'download';
}

/**
 * createCapture(LW, { canvas, caption, energies }) — the camera over a booted lab.
 * LW is window.__LW; the canvas is the FIELD's (dom.canvas), found by id if not given; `caption()` is the line a capture
 * carries ('' for none).
 */
export function createCapture(LW, opts = {}) {
  const canvas = opts.canvas || (typeof document !== 'undefined' ? document.getElementById('field') : null);
  const taken = new Set();
  let cfgUsage = null;                                   // what we last configured the context with
  const JITTER_SEED = opts.jitterSeed === undefined ? 13 : (opts.jitterSeed | 0);

  const field = () => LW.field;
  /** the caption line: `o.caption` (a string, or false for none) wins over the host's opts.caption() */
  const captionOf = (o) => { if (o && o.caption !== undefined) return o.caption || ''; try { return opts.caption ? String(opts.caption() || '') : ''; } catch (_) { return ''; } };
  const gpuOk = () => { const f = field(); return !!(f && f.ok); };
  const configure = (withCopy) => { const ok = configureCopy(field(), canvas, withCopy); if (ok) cfgUsage = withCopy ? 'copy' : 'plain'; return ok; };

  /** the state label a filename and a badge want: the preset or the populated shells */
  function stateLabel() {
    try {
      if (opts.label) return opts.label;
      const p = LW.reg && LW.reg.presetId;
      if (p) return p;
      const pop = LW.reg && LW.reg.populated ? LW.reg.populated() : [];
      return pop.length ? pop.length + 'modes' : 'state';
    } catch (_) { return 'state'; }
  }

  function limits() {
    const f = field();
    return maxPictureSize(f && f.ok ? f.device.limits : null, opts.canvasCap || 32767);
  }

  /** ONE FRAME OF THE STATE ON SCREEN.  THE RAY-MARCH JITTER (H1): the counter is pinned to the seed for the draw and the
   *  true one put back at once, so a picture is a function of the state alone. */
  function grab(w, h) {
    const f = field();
    return readback(f, canvas, w, h, () => {
      if (LW.helium && LW.helium.on) void LW.helium.sol;   // 2026-09-24: HELIUM's basis in force, never the last one shown while its worker solves (heliumview.js)
      const k = f.stats.presents; f.stats.presents = JITTER_SEED;
      if (f.pinRenderPipeline) f.pinRenderPipeline(true);   // optimization K2: an export frame draws with the GENERIC present pipeline
      try { f.frame({ modes: LW.modesAt(LW.clock.t), obs: LW.obs, mat: LW.mat }); } finally { if (f.pinRenderPipeline) f.pinRenderPipeline(false); }
      f.stats.presents = k;
    });
  }

  /** the 2-D overlays as straight RGBA at their own size — read through their own 2-D contexts, which do not lie */
  function overlayBytes(el) {
    if (!el || !el.width || el.width < 2 || !el.height) return null;
    const c2 = el.getContext('2d');
    if (!c2) return null;
    const d = c2.getImageData(0, 0, el.width, el.height);
    return { rgba: new Uint8Array(d.data.buffer.slice(0)), w: el.width, h: el.height };
  }

  /* ── THE PICTURE ───────────────────────────────────────────────────────────────────────────────────────── */
  /**
   * picture({ scale | width | height, overlays, filter, name, caption }) -> { blob, bytes, name, w, h, ms, clipped, ... }
   * A HIGHER resolution than the display is a real render: the volume is marched at the target size.
   */
  async function picture(o = {}) {
    if (!gpuOk()) return { ok: false, error: 'no WebGPU device: the FIELD is not up' };
    const lim = limits();
    const fit = fitPicture({ srcW: canvas.width, srcH: canvas.height, scale: o.scale, width: o.width, height: o.height, max: lim.side });
    const w0 = canvas.width, h0 = canvas.height;
    const wasCfg = cfgUsage;
    const busy = LW.busy && LW.busy.begin ? (LW.busy.begin(), true) : false;
    const t0 = performance.now();
    let shot = null, err = null;
    try {
      configure(true);
      shot = await grab(fit.w, fit.h);
    } catch (e) { err = String(e && e.message || e); }
    finally {
      canvas.width = w0; canvas.height = h0;
      if (wasCfg !== 'copy') configure(false);
      if (LW.schedule && LW.TIER) LW.schedule(LW.TIER.PRESENT);
      if (busy) LW.busy.end();
    }
    if (err) return { ok: false, error: err, w: fit.w, h: fit.h };
    let upscaled = null;
    if (o.overlays) {
      upscaled = [];
      for (const id of (Array.isArray(o.overlays) ? o.overlays : ['vortex', 'particles', 'kepler'])) {
        const layer = overlayBytes(typeof id === 'string' ? document.getElementById(id) : id);
        if (!layer) continue;
        compositeOver(shot.rgba, fit.w, fit.h, layer.rgba, layer.w, layer.h);
        upscaled.push({ id: typeof id === 'string' ? id : 'layer', from: layer.w + 'x' + layer.h, to: fit.w + 'x' + fit.h });
      }
    }
    const caption = captionOf(o);                          // last, and at the picture's own size
    captionOver(shot.rgba, fit.w, fit.h, caption);
    const png = await encodePNG(shot.rgba, fit.w, fit.h, { filter: o.filter === undefined ? -1 : o.filter });
    const name = uniqueName(o.name || captureName({ kind: 'still', label: stateLabel(), w: fit.w, h: fit.h, ext: 'png' }), taken);
    return {
      ok: true, blob: new Blob([png], { type: 'image/png' }), bytes: png.length, name,
      w: fit.w, h: fit.h, scale: fit.scaleW, clipped: fit.clipped, aspectKept: fit.aspectKept,
      renderMs: shot.ms, ms: performance.now() - t0, limits: lim,
      overlays: upscaled, upscaledOverlays: !!(upscaled && upscaled.length), caption,
      note: fit.clipped ? 'clipped to ' + lim.side + ' on the long side — ' + lim.why : '',
    };
  }

  /**
   * The plan the LOOP button shows BEFORE it records.  It reads the OBSERVABLE in force, because the observable
   * decides which period closes: arg psi, Re psi and Im psi carry the state's global phase and repeat only at
   * T_psi = 2 pi / gcd{|E|}, an integer multiple of the density's T.  (The psi-period scan costs what the density
   * one costs; it runs on a button press, not on a frame.)
   */
  function planLoop(o = {}) {
    const P = o.period || LW.period;   // a caller that already holds the density period (rack.js's CAPTURE hover) hands it in
    /* ── WAVE 58 (REVIEW-2 §1.2): THE ENERGIES MUST BE THE ONES THE LAB'S OWN PERIOD READER USES ────────────
     * `LW.period` is computed by rack.js from `sturm.P ? occupiedEigen() : reg.populated().map(reg.Ediag)`, and
     * its comment says why: under a PROPAGATOR (the STURMIAN switch, which ships) `reg.Ediag(a)` is the LABEL's
     * <a|H|a>/<a|S|a> and not an eigenvalue at all.  Computing `wave` from the labels while `D` came from the
     * spectrum is how a state with no period at all came back EXACT LOOP with a half-turn seam.  So the host
     * HANDS US its own expression (`opts.energies`); without one we refuse to guess under a propagator rather
     * than guessing wrong - a null here means no `wave`, so the plan falls back to the density period and the
     * phase view is WARNED instead of silently lied to. */
    const energies = (() => {
      try {
        if (opts.energies) { const E = opts.energies(); return E && E.length ? Array.from(E) : null; }
        if (LW.reg && LW.reg.P) return null;
        return LW.reg.populated().map((a) => LW.reg.Ediag(a));
      } catch (_) { return null; }
    })();
    const observable = o.observable || VIEW_NAMES[LW.mat.view | 0] || 'density';
    let wave = null;
    if (o.wave === undefined && energies && energies.length && (viewCarriesGlobalPhase(observable) || o.pixelExact)) {   // …and the psi period, which then rides in through `o`
      try { wave = wavePeriod(energies); } catch (_) { wave = null; }
    }
    return planPeriodRecording(P, Object.assign({ t0: LW.clock.t, rate: LW.clock.rate, energies, observable, wave }, o));
  }

  /** the hand-over.  Takes anything with { blob, name }: `handOver` (the share sheet inside a live tap, else a download). */
  function save(r) {
    if (!r || !r.blob) return false;
    handOver(r.blob, r.name || 'lambdawaves.bin');
    return true;
  }

  return { picture, planLoop, save, limits, grab, get names() { return taken; }, canvas,
    /** the pure laws, re-exported on the instance so a caller needs one import */
    laws: { loopSchedule, planFrames, planPeriodRecording, endpointProof, seamError, captureName, uniqueName, maxPictureSize, fitPicture, encodePNG } };
}
