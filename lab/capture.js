/* capture.js — THE CAMERA AND THE RECORDER.
 *
 * Three things, and the third is the reason the other two exist.
 *
 * ── A PICTURE ────────────────────────────────────────────────────────────────────────────────────────────────
 * The stage is RAY-MARCHED, so a bigger picture is a bigger RENDER, never an upscale: the canvas' backing store
 * is resized (its CSS box is untouched, so nothing on the page moves), ONE frame is encoded at that size through
 * the renderer's own `field.frame`, the swapchain texture is copied straight back to the CPU, and the bytes are
 * written as a PNG by the encoder in this file.  There is no 2-D canvas anywhere on that path, deliberately —
 * see THE WEBGPU CANVAS below.
 *
 * THE CEILING IS THE DEVICE'S, AND IT IS NOT THE GPU'S.  `field.js` USED to call `adapter.requestDevice()` with no
 * `requiredLimits`, so the device took the WebGPU DEFAULT limits whatever the adapter could do — maxTextureDimension2D
 * 8192 — and 8192 x 8192 was the largest picture this build could make, on an adapter reporting 32767.  WAVE 58 took
 * the line this file had been pointing at: field.js now asks for the adapter's own limit (and falls back to the plain
 * request if that were ever refused), so the ceiling here is `canvasCap` — the rack passes 16384, four times the
 * pixels.  maxBufferSize is still the default 256 MiB, which binds nothing, because the readback is banded
 * (`planBands`).  `maxPictureSize()` READS both limits rather than believing this paragraph, and `isDefaultLimit`
 * says which of the two worlds the device came up in.
 *
 * ── THE WEBGPU CANVAS · WHAT WAS MEASURED, 2026-09-05 ────────────────────────────────────────────────────────
 * The MANDELBROT gate kit records, as its sixth standing mistake, that `ctx2d.drawImage(webgpuCanvas)` comes back
 * BLANK.  Every browser road out of a canvas (drawImage, toBlob, createImageBitmap, captureStream) goes through
 * the same "canvas image contents", so that one observation puts ALL of them in doubt on a WebGPU canvas — and
 * MediaRecorder is the road this whole layer stands on.  So it was measured, on the lab's own canvas, in headless
 * Firefox (snap 8803) on the RTX 3070, and the answer is:
 *
 *     MEDIARECORDER OVER captureStream() ON THE WEBGPU CANVAS WORKS.  IT IS NOT BLANK.
 *
 * Four independent roads out of the same rendered frame agree on the fraction of lit pixels to three decimals:
 *     GPU texture readback (the picture path)   0.1016     ctx2d.drawImage of the WebGPU canvas   0.1011
 *     a live captureStream() frame, decoded     0.1010     the RECORDED WebM, played back         0.1008
 * against a 2-D control canvas that reads 1.000 and proves the reading method.  The direct engine wrote a
 * 33 kB VP8 WebM of 30 frames whose decoded pixels are lit; `drawImage` of this canvas does NOT reproduce the
 * kit's mistake #6.  That is one browser on one day, so the probe below still runs — the difference is that
 * `engine: 'auto'` is now expected to answer 'direct', and 'relay' is the belt, not the trousers.
 *
 * (The relay was measured too, and it works: the same picture, 51 kB, but 3.7 fps against the direct engine's
 * 15.5 — a full GPU readback and a putImageData per frame.  Its WebM therefore plays about four times slow.)
 *
 * Nothing here assumes any of that:
 *   · the picture path does not use the canvas' image contents at all.  It copies the swapchain TEXTURE with
 *     `copyTextureToBuffer`, which is a GPU operation and cannot lie about what was rendered.  For that the
 *     context must be configured with `usage: RENDER_ATTACHMENT | COPY_SRC` — the default is RENDER_ATTACHMENT
 *     alone — so `capture` reconfigures it (and puts it back afterwards).
 *   · the recording path ASKS, at runtime, with `probe()`, which returns those readings side by side — a 2-D
 *     control canvas (proves the reading method works), `drawImage` of the WebGPU canvas (the kit's mistake #6),
 *     and a real `captureStream()` frame decoded through a <video> — and is cached for the session.
 *     `engine: 'auto'` believes the probe, not the documentation and not the paragraph above.  `verifyVideo(blob)`
 *     plays a finished recording back and counts lit pixels, so a blank take is caught by the take itself.
 *   · if the direct road is blank there is a RELAY: every frame is read back off the GPU, put into a 2-D canvas
 *     with putImageData, and THAT canvas is what MediaRecorder records.  A 2-D canvas capture is not in question.
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
 * t0 + off(k) puts the wrap frame at exactly the double t0 + T.  The accumulating form k*(T/N) does not: at
 * T = 45238.93 and N = 601 it lands 7.3e-12 a.u. away from the period, and every frame carries its own rounding.
 * (What cannot be fixed by any form is the addition itself: t0 + T is one rounding, so at(N) - t0 need not be
 * bit-identical to T once t0 is large.  The offset is where the exactness lives, and the offset is what closes.)
 *
 * ── TWO THINGS THAT WOULD HAVE BROKEN THE SEAM, BOTH MEASURED ────────────────────────────────────────────────
 *
 * (1) THE PICTURE IS NOT A FUNCTION OF THE STATE ALONE.  field.js seeds the ray-march's start offset with
 *     `(stats.presents % 97) / 97` — a 97-frame cycle of jitter that breaks banding.  Two renders of the SAME
 *     state at different points of that cycle are different images (measured: the same t twice, free, gives two
 *     different hashes; with the seed pinned it gives one).  So every captured frame pins the seed and puts the
 *     counter back afterwards: `jitter: 'lock'`, the default for pictures and loops.
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
 * Nothing had ever imported this file, so none of the three had run in a browser; the wave that built the LOOP
 * button fixed them rather than put a button on them.  Each is gated in tests/capture.test.mjs §12.
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
 * ── WHAT THE RACK WAVE CALLS ─────────────────────────────────────────────────────────────────────────────────
 *   import { createCapture } from './capture.js';
 *   const cap = createCapture(LW, { canvas: dom.canvas });      // once, after boot; LW is window.__LW
 *
 *   THE CAMERA BUTTON        await cap.picture({ scale: 2 });               // 2x the stage, a real render
 *                            await cap.picture({ width: 3840 });            // height follows, aspect kept
 *                            → { blob, name, w, h, bytes, ms, clipped }     — then cap.save(r)
 *   THE RECORD BUTTON        const run = cap.record({ seconds: 8, fps: 30 });
 *                            run.stop();  const r = await run.done;         // → { blob, name, frames, ... }
 *   THE LOOP BUTTON          const plan = cap.planLoop({ fps: 30, seconds: 6 });
 *                            if (!plan.ok) show(plan.message);              // no exact period: say so
 *                            const r = await cap.recordLoop({ fps: 30, seconds: 6 }).done;
 *   THE FRAME SEQUENCE       await cap.pngSequence({ fps: 30, seconds: 6, onFrame: (f) => cap.save(f) });
 *                            (the only output whose TIMING is exact as well as its content — for ffmpeg)
 *   THE STATE OF THE ROAD    await cap.probe()             → which engine works in this browser, with the evidence
 *                            await cap.verifyVideo(r.blob) → did the WebM actually catch lit pixels
 *   A BIGGER RECORDING       cap.record({ width: 2560 })   → drives the lab's own quality.scale, not canvas.width:
 *                            rack.js' loop re-resizes the canvas on every presented frame, so a size poked in
 *                            from outside is undone within one.  AUTO SCALE is held off for the take.
 *   cap.save(r) is the download; cap.limits() is the ceiling; every returned object carries `name`.
 *   THE LOOP BUTTON'S LABEL is plan.message, and plan carries `usedPeriod` ('density' | 'wave'), `laps`,
 *   `Tdensity`, `Twave`, `phaseNote`, `pixelExact`, `framesPerDensityPeriod` and `undersampled` — so the button
 *   can say "EXACT LOOP · 180 frames · 3 laps (the phase view needs the psi period)" without computing anything.
 *   `createCapture(LW, { energies })` — HAND IT THE HOST'S OWN ENERGY EXPRESSION.  Without it this file falls
 *   back to LW.reg.Ediag, which under a PROPAGATOR (the STURMIAN switch) is the label's <a|H|a>/<a|S|a> and not
 *   an eigenvalue; rather than guess wrong there it returns none, and the phase view is WARNED.  See WAVE 58.  Nothing in here schedules work of
 *   its own: every capture pauses the clock, puts it back where it was, and restores the play state.
 *
 *   THE PROOF is `node tests/capture.test.mjs` (30 GREEN).  It is NOT in test.sh — test.sh belongs to another
 *   wave; the line to add beside the others is `node tests/capture.test.mjs; CP_RC=$?`.
 *
 * ── MEASURED (headless Firefox, RTX 3070, 1400x814 stage, 96^3 grid, 2026-09-05) ─────────────────────────────
 *   a picture at 1x (1260x733)   0.23 s, 78 kB   ·   at 3x (3780x2199)   1.20 s, 334 kB
 *   2048^2  0.73 s   ·   4096^2  2.4 s   ·   6144^2  5.2 s   ·   8192^2  9.0 s, 1.95 MB
 *   THE CEILING WAS 8192 ON A SIDE WHEN THESE WERE MEASURED, and wave 58 raised it: the ADAPTER reports
 *   maxTextureDimension2D = 32767, field.js now requests it, and the rack caps the picture at 16384.  Above the
 *   cap the request is CLIPPED and says so.  The timings above are per-pixel and scale; they were not re-measured.
 *   a 30-frame loop, direct engine, 1400x814: 33-35 kB VP8, 15.1-15.5 fps against a 15 fps target.
 *   two pictures of the same paused state come back BYTE-IDENTICAL (the jitter pin), under distinct names.
 *
 * STATUS: the schedule, the refusal, the names and the PNG encoder are EXACT and proved in tests/capture.test.mjs.
 * The picture is the renderer's own frame read back off the GPU.  The recording's CONTENT is exact (N frames at
 * the N scheduled logical times); its TEMPO is wall-clock and is MEASURED and reported, never claimed.
 */

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════
   PART 1 — THE LAWS.  Nothing below touches the DOM, WebGPU or a clock; all of it is proved in node.
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

import { densityPeriod } from './period.js';

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
 * The 2-D overlays (VORTEX, KEPLER, PARTICLES, the field lines) are drawn by their owners at DISPLAY resolution
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

const CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();

export function crc32(bytes, seed = 0) {
  let c = (seed ^ 0xffffffff) >>> 0;
  for (let i = 0; i < bytes.length; i++) c = (CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)) >>> 0;
  return (c ^ 0xffffffff) >>> 0;
}

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

const raf = () => new Promise((r) => requestAnimationFrame(r));
const MIMES = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];

/** the first WebM the browser will actually write, or '' */
export function pickMime(want) {
  const list = want ? [want].concat(MIMES) : MIMES;
  if (typeof MediaRecorder === 'undefined') return '';
  for (const m of list) { try { if (MediaRecorder.isTypeSupported(m)) return m; } catch (_) {} }
  return '';
}

/**
 * createCapture(LW, { canvas }) — the camera and the recorder over a booted lab.
 * LW is window.__LW; the canvas is the FIELD's (dom.canvas), found by id if not given.
 */
export function createCapture(LW, opts = {}) {
  const canvas = opts.canvas || (typeof document !== 'undefined' ? document.getElementById('field') : null);
  const taken = new Set();
  let cfgUsage = null;                                   // what we last configured the context with
  let probed = null;                                     // the engine probe: run once per session and remembered
  const JITTER_SEED = opts.jitterSeed === undefined ? 13 : (opts.jitterSeed | 0);

  /* THE RAY-MARCH JITTER (see the header, finding 1).  field.js seeds the march's start offset with
     (stats.presents % 97)/97, so the same state renders differently at different points of a 97-frame cycle.
     Pinning the counter makes a capture a function of the state alone; the true counter is put back after. */
  function pinJitter() { const f = field(); if (!f || !f.ok) return null; const k = f.stats.presents; f.stats.presents = JITTER_SEED; return k; }
  function unpinJitter(k) { const f = field(); if (f && f.ok && k !== null) f.stats.presents = k; }

  const field = () => LW.field;
  const dev = () => { const f = field(); return f && f.ok ? f.device : null; };
  const ctx = () => canvas.getContext('webgpu');
  const gpuOk = () => !!dev();

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
    const d = dev();
    return maxPictureSize(d ? d.limits : null, opts.canvasCap || 32767);
  }

  /* ── the context's usage.  COPY_SRC is not the default and the picture cannot be taken without it. ─────── */
  function configure(withCopy) {
    const f = field(), c = ctx();
    if (!f || !c) return false;
    const base = { device: f.device, format: f.format, alphaMode: 'opaque' };
    if (f.gamut && f.gamut !== 'srgb') base.colorSpace = 'display-p3';
    if (withCopy) base.usage = GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC;
    c.configure(base);
    cfgUsage = withCopy ? 'copy' : 'plain';
    return true;
  }

  /**
   * ONE FRAME AT A GIVEN SIZE, READ OFF THE GPU.  Renders through the renderer's own `frame` (so it is the same
   * shader, the same camera, the same material the screen is showing) and copies the swapchain texture back.
   * Returns { rgba, w, h, ms }.  The canvas' backing store is restored by the caller.
   */
  async function grab(w, h) {
    const f = field(), d = f.device, c = ctx();
    const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    if (canvas.width !== w) canvas.width = w;             // assigning even the same value would reallocate the swapchain
    if (canvas.height !== h) canvas.height = h;
    /* THE RENDER IS RE-DONE HERE ON PURPOSE.  The swapchain texture EXPIRES at the end of the animation-frame task,
       so a copy taken in a later task gets a fresh, CLEARED texture - black.  Render and copy must sit in one
       synchronous block, and they do. */
    const jit = pinJitter();
    f.frame({ modes: LW.modesAt(LW.clock.t), obs: LW.obs, mat: LW.mat });
    unpinJitter(jit);
    const tex = c.getCurrentTexture();                    // the SAME texture frame() just rendered into
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
   * picture({ scale | width | height, overlays, filter, name }) -> { blob, bytes, name, w, h, ms, clipped, ... }
   * A HIGHER resolution than the display is a real render: the volume is marched at the target size.
   */
  async function picture(o = {}) {
    if (!gpuOk()) return { ok: false, error: 'no WebGPU device: the FIELD is not up' };
    const f = field();
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
      for (const id of (Array.isArray(o.overlays) ? o.overlays : ['fieldlines', 'vortex', 'particles', 'kepler'])) {
        const layer = overlayBytes(typeof id === 'string' ? document.getElementById(id) : id);
        if (!layer) continue;
        compositeOver(shot.rgba, fit.w, fit.h, layer.rgba, layer.w, layer.h);
        upscaled.push({ id: typeof id === 'string' ? id : 'layer', from: layer.w + 'x' + layer.h, to: fit.w + 'x' + fit.h });
      }
    }
    const png = await encodePNG(shot.rgba, fit.w, fit.h, { filter: o.filter === undefined ? -1 : o.filter });
    const name = uniqueName(o.name || captureName({ kind: 'still', label: stateLabel(), w: fit.w, h: fit.h, ext: 'png' }), taken);
    return {
      ok: true, blob: new Blob([png], { type: 'image/png' }), bytes: png.length, name,
      w: fit.w, h: fit.h, scale: fit.scaleW, clipped: fit.clipped, aspectKept: fit.aspectKept,
      renderMs: shot.ms, ms: performance.now() - t0, limits: lim,
      overlays: upscaled, upscaledOverlays: !!(upscaled && upscaled.length),
      note: fit.clipped ? 'clipped to ' + lim.side + ' on the long side — ' + lim.why : '',
    };
  }

  /* ── THE PROBE: does a WebGPU canvas survive capture in THIS browser? ──────────────────────────────────── */
  /**
   * Three readings, side by side, so a blank one can be blamed correctly:
   *   control2d   a 2-D canvas painted a known colour, taken through the SAME road (captureStream -> <video> ->
   *               drawImage -> getImageData).  Blank here means the probe is broken, not the canvas.
   *   drawImage   ctx2d.drawImage of the WebGPU canvas: the gate kit's standing mistake #6.
   *   stream      a real captureStream() frame off the WebGPU canvas, decoded through a <video>.
   *   recorder    MediaRecorder over that stream: does it write bytes at all.
   */
  async function probe({ ms = 400, fresh = false } = {}) {
    if (probed && !fresh) return probed;
    const out = { mime: pickMime(), hasCaptureStream: typeof canvas.captureStream === 'function', hasMediaRecorder: typeof MediaRecorder !== 'undefined' };
    const readVideo = async (stream, w = 64, h = 64) => {
      const v = document.createElement('video');
      v.muted = true; v.playsInline = true; v.srcObject = stream;
      try { await v.play(); } catch (e) { return { error: 'play: ' + String(e && e.message || e) }; }
      const t0 = performance.now();
      while (performance.now() - t0 < ms && !(v.videoWidth > 0)) await raf();
      for (let i = 0; i < 6; i++) await raf();
      const cw = v.videoWidth || w, ch = v.videoHeight || h;
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d');
      let stats = null;
      try { g.drawImage(v, 0, 0, w, h); stats = litness(g.getImageData(0, 0, w, h).data); } catch (e) { stats = { error: String(e && e.message || e) }; }
      v.pause(); v.srcObject = null;
      return Object.assign({ videoW: cw, videoH: ch }, stats);
    };
    /* the control: a 2-D canvas, a known colour, the same road */
    try {
      const c = document.createElement('canvas'); c.width = 64; c.height = 64;
      const g = c.getContext('2d'); g.fillStyle = '#3ad1c0'; g.fillRect(0, 0, 64, 64);
      const s = c.captureStream(0); const tr = s.getVideoTracks()[0];
      if (tr.requestFrame) tr.requestFrame();
      out.control2d = await readVideo(s);
      tr.stop();
    } catch (e) { out.control2d = { error: String(e && e.message || e) }; }
    /* the WebGPU canvas through a 2-D context — the kit's mistake #6, re-measured here */
    try {
      if (LW.schedule && LW.TIER) LW.schedule(LW.TIER.PRESENT);
      await LW.settle();
      const c = document.createElement('canvas'); c.width = 64; c.height = 64;
      const g = c.getContext('2d');
      g.drawImage(canvas, 0, 0, 64, 64);
      out.drawImage = litness(g.getImageData(0, 0, 64, 64).data);
    } catch (e) { out.drawImage = { error: String(e && e.message || e) }; }
    /* the WebGPU canvas through captureStream */
    try {
      const s = canvas.captureStream(0);
      const tr = s.getVideoTracks()[0];
      out.trackSettings = tr.getSettings ? tr.getSettings() : null;
      if (LW.schedule && LW.TIER) LW.schedule(LW.TIER.PRESENT);
      await LW.settle();
      if (tr.requestFrame) tr.requestFrame();
      out.stream = await readVideo(s);
      /* and does MediaRecorder write anything over it */
      if (out.mime) {
        const s2 = canvas.captureStream(30);
        const rec = new MediaRecorder(s2, { mimeType: out.mime });
        const chunks = [];
        rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
        const stopped = new Promise((r) => { rec.onstop = r; });
        rec.start();
        const t0 = performance.now();
        while (performance.now() - t0 < ms) { if (LW.schedule && LW.TIER) LW.schedule(LW.TIER.PRESENT); await raf(); }
        rec.stop(); await stopped;
        let n = 0; for (const c of chunks) n += c.size;
        out.recorder = { chunks: chunks.length, bytes: n, mime: out.mime };
        s2.getTracks().forEach((t) => t.stop());
      }
      tr.stop();
    } catch (e) { out.stream = { error: String(e && e.message || e) }; }
    const litOK = (r) => !!(r && !r.error && r.frac > 0.02);
    out.probeWorks = litOK(out.control2d);
    out.directWorks = litOK(out.stream);
    out.canvasReadable = litOK(out.drawImage);
    out.engine = out.directWorks ? 'direct' : 'relay';
    out.verdict = !out.probeWorks ? 'INCONCLUSIVE: the 2-D control did not come back lit either, so the probe itself is not working here.'
      : out.directWorks ? 'captureStream() on the WebGPU canvas DELIVERS LIT FRAMES in this browser: the direct engine is honest.'
      : 'captureStream() on the WebGPU canvas comes back BLANK while the 2-D control comes back lit: the relay engine is the only honest road here.';
    probed = out;
    return out;
  }

  function litness(data) {
    let lit = 0, sum = 0, mx = 0;
    for (let i = 0; i < data.length; i += 4) {
      const L = (data[i] + data[i + 1] + data[i + 2]) / 3;
      sum += L; if (L > 24) lit++; if (L > mx) mx = L;
    }
    const n = data.length / 4;
    return { lit, total: n, frac: lit / n, mean: sum / n, max: mx };
  }

  /* ── THE RECORDING ─────────────────────────────────────────────────────────────────────────────────────── */
  /**
   * The generic recorder.  `at(k)` is the logical time of frame k (any schedule); N frames; `fps` is the WALL
   * cadence aimed at.  Returns { stop(), done } immediately — `done` resolves with the blob and the MEASURED
   * tempo, which is the only tempo claim this file makes.
   */
  function drive({ N, at, fps = 30, engine = 'auto', mime, bitrate, width, height, label, kind = 'clip', T = 0, onProgress, note = '', jitter = 'lock' }) {
    const lockJitter = jitter !== 'free';
    let cancelled = false;
    const done = (async () => {
      if (!gpuOk()) return { ok: false, error: 'no WebGPU device: the FIELD is not up' };
      if (typeof MediaRecorder === 'undefined' || !canvas.captureStream) return { ok: false, error: 'this browser has no MediaRecorder or no canvas.captureStream' };
      const m = pickMime(mime);
      if (!m) return { ok: false, error: 'no WebM MIME type this browser will encode' };
      if (engine === 'auto') { probed = probed || await probe({ ms: 250 }); engine = probed.engine; note = (note ? note + ' · ' : '') + 'engine chosen by probe: ' + probed.verdict; }
      const f = field();
      const wasPlaying = LW.clock.playing, t0log = LW.clock.t, wasCfg = cfgUsage;
      /* THE SIZE OF A RECORDING GOES THROUGH quality.scale, NOT canvas.width.  rack.js' loop calls
         field.resize(quality.scale * ...) on EVERY presented frame, so a canvas size poked in from outside is
         undone within one frame.  quality.scale is the lab's own observer control and it survives. */
      const q = LW.quality, q0 = { scale: q.scale, auto: q.auto };
      if (width || height) {
        const base = Math.max(1, canvas.width / (q.scale * (q.auto ? q.autoScale : 1)));
        const want = width ? width : (height * canvas.width / canvas.height);
        q.auto = false; q.scale = Math.max(0.05, want / base);
        LW.schedule(LW.TIER.PRESENT); await raf(); await raf();
      } else if (q.auto) { q.auto = false; q.scale = q0.scale; LW.schedule(LW.TIER.PRESENT); await raf(); }   // AUTO SCALE must not move the frame size mid-take
      const W = canvas.width, H = canvas.height;
      let relay = null, relayCtx = null, src = canvas;
      if (engine === 'relay') { relay = document.createElement('canvas'); relay.width = W; relay.height = H; relayCtx = relay.getContext('2d'); src = relay; configure(true); }
      LW.clock.pause();
      const stream = src.captureStream(0);
      const track = stream.getVideoTracks()[0];
      const rec = new MediaRecorder(stream, Object.assign({ mimeType: m }, bitrate ? { videoBitsPerSecond: bitrate } : {}));
      const chunks = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      const stopped = new Promise((r) => { rec.onstop = r; });
      const busy = LW.busy && LW.busy.begin ? (LW.busy.begin(), true) : false;
      const presents0 = f.stats.presents;
      const marks = new Array(N);
      let delivered = 0, err = null;
      const wall0 = performance.now();
      rec.start();
      try {
        for (let k = 0; k < N && !cancelled; k++) {
          const due = wall0 + (k * 1000) / fps;
          LW.scrub(at(k));
          /* RECONSTRUCT, not EVOLVE: rack.js only rebuilds psi on an EVOLVE tier when the FIELD CLOCK is due, so a
             capped field clock would record the same picture twice.  RECONSTRUCT is unconditional. */
          LW.schedule(LW.TIER.RECONSTRUCT);
          if (lockJitter) f.stats.presents = JITTER_SEED;   // the rack's own frame runs next; it must use the pinned seed
          await raf();
          while (performance.now() < due - 0.5) await raf();
          if (engine === 'relay') {
            const shot = await grab(W, H);
            const img = new ImageData(new Uint8ClampedArray(shot.rgba.buffer, 0, W * H * 4), W, H);
            relayCtx.putImageData(img, 0, 0);
          }
          if (track.requestFrame) track.requestFrame();
          marks[k] = performance.now();
          delivered++;
          if (onProgress) onProgress({ k, N, t: at(k), wall: marks[k] - wall0 });
        }
      } catch (e) { err = String(e && e.message || e); }
      const wall1 = performance.now();
      rec.stop();
      await stopped;
      stream.getTracks().forEach((t) => t.stop());
      q.scale = q0.scale; q.auto = q0.auto;
      f.stats.presents = presents0 + delivered;               // the diagnostic counter, put back honestly
      if (wasCfg !== 'copy') configure(false);
      LW.scrub(t0log);
      if (wasPlaying) LW.play();
      if (LW.schedule && LW.TIER) LW.schedule(LW.TIER.PRESENT);
      if (busy) LW.busy.end();
      const seconds = (wall1 - wall0) / 1000;
      let worst = 0, sum = 0, n = 0;
      for (let k = 1; k < delivered; k++) { const iv = marks[k] - marks[k - 1]; sum += iv; n++; if (Math.abs(iv - 1000 / fps) > worst) worst = Math.abs(iv - 1000 / fps); }
      const blob = new Blob(chunks, { type: m });
      const name = uniqueName(captureName({ kind, label: label || stateLabel(), w: W, h: H, fps, frames: delivered, T, ext: 'webm' }), taken);
      return {
        ok: !err && delivered > 0, error: err, blob, bytes: blob.size, name, mime: m, engine,
        frames: delivered, requested: N, w: W, h: H, fps, cancelled,
        measured: { seconds, fps: delivered / Math.max(1e-9, seconds), meanIntervalMs: n ? sum / n : 0, worstIntervalErrMs: worst, targetIntervalMs: 1000 / fps },
        note,
      };
    })();
    return { stop() { cancelled = true; }, get cancelled() { return cancelled; }, done };
  }

  /** a free clip: the clock runs as it is, `seconds` of wall at `fps` */
  function record(o = {}) {
    const fps = o.fps || 30, seconds = o.seconds || 5;
    const N = Math.max(1, Math.round(fps * seconds));
    const rate = LW.clock.rate, t0 = LW.clock.t;
    return drive(Object.assign({}, o, { N, fps, kind: 'clip', at: (k) => t0 + (k / fps) * rate }));
  }

  /** the plan the LOOP button shows BEFORE it records: ok, or the refusal with the near-recurrence and its error */
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

  /** ONE PERIOD, EXACTLY.  Refuses a state that has none unless `allowNear`. */
  function recordLoop(o = {}) {
    const plan = planLoop(o);
    if (!plan.ok) return { stop() {}, plan, done: Promise.resolve({ ok: false, refused: true, plan, error: plan.message }) };
    if (plan.kind === 'stationary') return { stop() {}, plan, done: Promise.resolve({ ok: false, refused: true, plan, error: plan.message }) };
    const run = drive(Object.assign({}, o, {
      N: plan.N, fps: plan.fps, at: (k) => plan.schedule.at(k), kind: plan.kind === 'exact' ? 'loop' : 'near', T: plan.T,
      note: plan.message,
    }));
    run.plan = plan;
    return run;
  }

  /**
   * The frame sequence — the ONLY output whose timing is exact as well as its content, because there is no
   * wall clock in it at all: N PNGs at the N scheduled logical times, for `ffmpeg -framerate <fps> -i ...`.
   */
  async function pngSequence(o = {}) {
    const plan = o.at ? null : planLoop(o);
    if (plan && !plan.ok) return { ok: false, refused: true, plan, error: plan.message };
    const N = o.frames || (plan ? plan.N : 0), at = o.at || (plan ? (k) => plan.schedule.at(k) : null);
    if (!N || !at) return { ok: false, error: 'pngSequence needs a period or an explicit { frames, at }' };
    const fps = o.fps || (plan ? plan.fps : 30);
    const w0 = canvas.width, h0 = canvas.height, wasCfg = cfgUsage, wasPlaying = LW.clock.playing, t0log = LW.clock.t;
    const lim = limits();
    const fit = fitPicture({ srcW: w0, srcH: h0, scale: o.scale, width: o.width, height: o.height, max: lim.side });
    const stem = slug(o.label || stateLabel());
    LW.clock.pause();
    configure(true);
    const out = [];
    try {
      for (let k = 0; k < N; k++) {
        LW.clock.scrub(at(k));
        const shot = await grab(fit.w, fit.h);
        const png = await encodePNG(shot.rgba, fit.w, fit.h);
        const name = 'lambdawaves-' + stem + '-' + String(k).padStart(5, '0') + '.png';
        const item = { k, name, blob: new Blob([png], { type: 'image/png' }), bytes: png.length, t: at(k) };
        if (o.onFrame) await o.onFrame(item); else out.push(item);
        if (o.onProgress) o.onProgress({ k, N });
      }
    } finally {
      canvas.width = w0; canvas.height = h0;
      if (wasCfg !== 'copy') configure(false);
      LW.scrub(t0log);
      if (wasPlaying) LW.play();
      if (LW.schedule && LW.TIER) LW.schedule(LW.TIER.PRESENT);
    }
    return { ok: true, frames: N, fps, w: fit.w, h: fit.h, files: out, plan, ffmpeg: 'ffmpeg -framerate ' + fps + ' -i lambdawaves-' + stem + '-%05d.png -c:v libvpx-vp9 -pix_fmt yuv420p ' + stem + '-loop.webm' };
  }

  /**
   * DID THE RECORDING ACTUALLY RECORD ANYTHING?  A blank capture stream still writes a well-formed WebM of the
   * right length full of black, so a size check proves nothing.  This plays the blob back and reads a frame out
   * of it through a 2-D canvas - the <video> element decodes, so nothing here depends on the WebGPU canvas.
   */
  async function verifyVideo(blob, { w = 96, h = 96, ms = 2000 } = {}) {
    if (!blob || !blob.size) return { ok: false, error: 'no blob' };
    const url = URL.createObjectURL(blob);
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.src = url;
    try {
      await new Promise((res, rej) => { v.onloadeddata = res; v.onerror = () => rej(new Error('decode failed')); setTimeout(() => rej(new Error('timeout')), ms); });
      await v.play().catch(() => {});
      for (let i = 0; i < 8; i++) await raf();
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d');
      g.drawImage(v, 0, 0, w, h);
      const st = litness(g.getImageData(0, 0, w, h).data);
      v.pause();
      return Object.assign({ ok: st.frac > 0.02, bytes: blob.size, videoW: v.videoWidth, videoH: v.videoHeight, duration: v.duration }, st);
    } catch (e) { return { ok: false, error: String(e && e.message || e), bytes: blob.size }; }
    finally { v.src = ''; URL.revokeObjectURL(url); }
  }

  /** the download.  Takes anything with { blob, name }. */
  function save(r) {
    if (!r || !r.blob) return false;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(r.blob); a.download = r.name || 'lambdawaves.bin';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return true;
  }

  return { picture, record, recordLoop, planLoop, pngSequence, probe, verifyVideo, save, limits, get names() { return taken; }, canvas,
    /** the pure laws, re-exported on the instance so a caller needs one import */
    laws: { loopSchedule, planFrames, planPeriodRecording, endpointProof, seamError, captureName, uniqueName, maxPictureSize, fitPicture, encodePNG } };
}
