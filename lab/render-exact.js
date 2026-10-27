/* render-exact.js — THE FILM'S FRAME AND ITS SCHEDULE.  What λWAVES hands MIR's recorder.
 *
 * 0.5.0 C7 · THE FILM IS THE KIT'S.  `createRecorder` (lab/mir/render/recorder.js) owns the take: the clock that steps a
 * driven modulation by exactly 1/fps (render/clock.js), the encoding — an MP4 through WebCodecs and its own muxer, the
 * encoder proven on two frames before the first, or lossless PNG frames in stored ZIP parts beside their recording.json —
 * the store on disk, the input guard (Escape or a [data-render-cancel] button cancels), the wake lock and the progress.
 * This file is what stays λWAVES': THE SCHEDULE (which logical time frame k is) and THE FRAME (`frame(i, ctx)`: the
 * picture at that time, read straight off the GPU through capture.js' `readback`, with every pin applied and witnessed).
 * The driver this file used to be — its own loop, its own PNG container and stored zip, its manifest-in-the-zip, its
 * cost table, its stop door — left with the take.  Every frame is still rendered at a scheduled logical time, one at a
 * time, as slowly as the machine needs, and nothing about the machine reaches the picture.  Slow is fine.  Wrong is not.
 *
 * ── WHY THIS IS EVEN POSSIBLE HERE ───────────────────────────────────────────────────────────────────────────
 * The register's clock is ANALYTIC.  c(t) = e^{−iEt}c(0) — `state.js`' `at(t)` evaluates any t directly, with no
 * integration, no accumulation and no history, and `reg.at(t)` twice at the same t is bit-identical.  So the
 * physics is not the problem.  A deterministic film here is a SCHEDULING problem, and the scheduling problem is
 * entirely about the OTHER clocks.
 *
 * ── THE THREE CLOCKS, AND ONLY ONE OF THEM IS ANALYTIC ───────────────────────────────────────────────────────
 *   1  THE PHYSICS CLOCK (clock.js).  Analytic.  ψ is a closed form of t.  A frame at t needs NO frame before it.
 *      → the frame SETS it: `clock.scrub(at(k))`.  Order-free, restartable, seekable.
 *   2  THE CAMERA CLOCK (camera-law.js `cameraStep`).  An INTEGRATOR: ω decays as e^{−μ dt} and the pose accumulates
 *      ∫ω dt, stepped with a WALL interval every frame (AUTO-ROTATE reads μ as 0, 018 B4: a fling then never decays).
 *      There is no pose(t) to evaluate.
 *      → a film REFUSES a moving camera (or stills it), and offers a POSE PATH instead: `poseAt(k, N)` is a pure
 *        function of the frame index, which is what a rendered camera move should have been all along.
 *   3  THE MODULATION CLOCK (mir/host.js).  Also an integrator, irreducibly: every source carries a one-pole SMOOTH
 *      filter and every envelope `t += dt`.  There is no modulated(t) to evaluate either.
 *      → a film either FREEZES it (stopped, every target back to its base, and the recorder built with no host so it
 *        steps nothing) or DRIVES it — the KIT's record clock, FROM FIRST SPACE, exactly 1/fps a frame.
 *
 * THE LAW: the physics clock is SET, the observer clocks are STEPPED, and every one of them is a function of the
 * frame index k alone.  Wall time appears here only in the progress report, and the report is never an input.
 *
 * ── THE PICTURE'S INPUT CLOSURE ──────────────────────────────────────────────────────────────────────────────
 * Read against rack.js' loop and field.js' `frame`, the rendered pixels are a function of exactly this list:
 *
 *     picture = F( modesAt(t), obs, mat, domain.half, field.resolution, canvas.width, canvas.height,
 *                  field.stats.presents mod 97, field.format, the canvas' gamut )
 *
 * and `modesAt(t)` is a pure function of t — `reg.at`, `molecule.fieldModes(t)`, `gas.fieldModes(t)` all are,
 * and `helium.fieldModes()` is t-independent (while its worker solves a new basis it serves the LAST one, so a film
 * demands `helium.sol` first) — H₂'s exception (H7, its R set by update(t)) left with its window in 0.5.0 D9b.
 *
 * ── THE SCHEDULE, AND THE TWO ENDPOINT RULES ─────────────────────────────────────────────────────────────────
 *   A LOOP is a CIRCLE.  t0 and t0+T are the same point of it.  N frames at t0 + (k/N)·T, k = 0 … N−1; the frame
 *   at t0+T is DROPPED because it IS frame 0.  Every gap in the cycle — the wrap included — is T/N.  EXCLUSIVE.
 *   A SPAN is a SEGMENT.  t0 and t1 are two different points and f(t1) ≠ f(t0).  N frames at t0 + (k/(N−1))·L;
 *   the last frame IS t1, exactly.  Dropping it would never show the state the caller asked to end on.  INCLUSIVE.
 *   The tempo differs too, and `exactSchedule` reports each: a loop of N frames covers T in N/fps; a span covers L in
 *   (N−1)/fps, while the CLIP is still N/fps long.  A film hands its schedule to the kit as a MOTION whose view(i)
 *   is frame i's logical time; the kit's frame count is N, its tempo 1/fps a frame, exactly.
 *
 * ── THE ARITHMETIC, MEASURED HERE AND NOT INHERITED ──────────────────────────────────────────────────────────
 * The offset is written off(k) = (k/D)·L and never k·(L/D):
 *   · (k/D)·L CLOSES ALWAYS, and it is a THEOREM: IEEE-754 division of a finite non-zero D by itself is exactly
 *     1.0, and 1.0·L is exactly L.  4001 of 4001 random (L, D) — necessarily.
 *   · k·(L/D) closes in 3622 of the same 4001.  A concrete counterexample: L = 212.46659503691100, D = 361.
 *   · capture.js' old anecdote (T = 45238.93, N = 601) does NOT reproduce — both forms close there.  What drifts at
 *     those numbers is the TRUE accumulator, `t += dt` N times.  `arithmeticLaw()` runs it rather than says it.
 *   · IN THE MIDDLE the two forms are a wash; the endpoint is the entire argument for the choice.
 *   AND THE OFFSET IS NOT THE TIME: t = t0 + off(k) is one more rounding, binding at a deep t0 (the gaps stop being
 *   uniform at 4.4e−11 of a gap at t0 = 45238.93).  `exactSchedule` MEASURES that (`worstGapRel`) and, where the
 *   period is exact, FOLDS THE ORIGIN — t0 ↦ t0 mod T, the same point of the circle — which is safe for every view
 *   only at T_ψ; `planExact` knows which period it loops to and folds only when it may.
 *
 * ── THE HAZARDS: EVERY SOURCE OF NON-DETERMINISM FOUND, ITS PIN, ITS WITNESS, AND WHOSE IT IS NOW ───────────
 * `HAZARDS` below is this list as data.  A frame is emitted only when its witnesses agree; a contended frame is
 * rendered again, and a frame that cannot be made to agree ABORTS the film by name, through the kit's failure road.
 *   λWAVES' — named here and pinned in `frame(i, ctx)` and its `before`:
 *   H1  THE RAY-MARCH JITTER.  field.js seeds the march's start offset with (stats.presents % 97)/97 (the GRAIN style read
 *       the same word until iteration 008 G; DUST reads none of it — its grains are fixed in the world).  PIN: presents = 13 before every frame.  WITNESS: 14 after it.
 *   H2  THE GOVERNOR steps the field grid down the ladder (128 → 96 → 64) on a slow machine.  PIN: the physics clock
 *       paused (it only judges while playing; pausing resets its drop) and governor.on = false.  WITNESS: the grid.
 *   H3  AUTO SCALE multiplies the canvas size; a window resize or a DPR change does the same, and NOTHING PRESENTS
 *       when it happens.  PIN: quality.auto = false.  WITNESS: the canvas size read AT the readback.
 *   H4 the field clock (field.frame is called with modes every frame; the generation advances by one), H5 the camera
 *   (above), H8 the reused mode list (modesAt inline in the draw; H7, H₂'s impure field, left with H₂ in 0.5.0 D9b)
 *   and H9 an interloping rack frame (the rack's own lock while a film owns the page; the jitter, generation and size
 *   witnesses all see one).
 *   THE KIT'S — H6 the modulation clock (its record clock, or no host at all), H10 the device pixel ratio (an explicit
 *   even size), H11 path-dependent 2-D overlays (a film carries none), H12 the PNG container (its encoder; λWAVES'
 *   digest is over the frame's RGBA, which is ours) and H13 the gamut (declared to it as colorSpace).
 *
 * ── WHAT THE RACK CALLS ──────────────────────────────────────────────────────────────────────────────────────
 *   const film = createFilm(LW, { canvas: dom.canvas, energies, host: () => modHost, hold });
 *   const plan = film.plan({ fps: 30, seconds: 6, width: 1920 });   // BEFORE the button commits to anything
 *   const run = film.render({ ...plan.opts, format: 'png' | 'mp4', onProgress });   run.stop();   // the kit's cancel
 *   const r = await run.done;                                      // { ok, files, name, frames, manifest, report }
 *   film.save(r);   film.verify({ frames: 6, width: 160 });   film.hazards();
 *
 * THE PROOF is `node tests/render-exact.test.mjs`: the laws, and the FRAME driven by the kit's own recorder against a
 * fake lab that reproduces every hazard, each pin removed in turn.
 */

import {
  AU_FS, VIEW_NAMES, viewCarriesGlobalPhase, wavePeriod, seamError, planPeriodRecording,
  maxPictureSize, fitPicture, slug, stamp, uniqueName, captureName,
  readback, configureCopy, captionOver, handOver,
} from './capture.js';
import { createRecorder } from './mir/render/recorder.js';
import { RECORD_FPS, estimateFilm, ceilingWarning, fmtMs, fmtBytes } from './mir/render/plan.js';

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════
   PART 1 — THE LAWS.  Nothing below touches the DOM, WebGPU or a clock; all of it is proved in node.
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

export const ENDPOINT = Object.freeze({ loop: 'exclusive', span: 'inclusive' });
export const MODES = Object.freeze(['loop', 'span']);

/**
 * THE ONE ARITHMETIC.  off(k) = (k/D)·L, and never k·(L/D) or (L·k)/D.
 * At k = D this is EXACTLY L: IEEE-754 division of a finite non-zero D by itself is exactly 1.0, and 1.0·L is
 * exactly L.  That is a theorem about the format, not a property of any particular L — which is why it is the
 * form to use, and why `arithmeticLaw` can run the comparison rather than assert it.
 */
export function offsetOf(k, D, L) { return (k / D) * L; }

/** the three candidate forms, run against each other — the proof of the choice, as data */
export function arithmeticLaw({ L, D, samples = 0 } = {}) {
  if (!(D > 0)) throw new Error('render-exact: arithmeticLaw needs a positive divisor');
  const forms = {
    'divide-first  (k/D)*L': (k) => (k / D) * L,
    'step-first    k*(L/D)': (k) => k * (L / D),
    'scale-first   (L*k)/D': (k) => (L * k) / D,
    'accumulate    sum L/D': (k) => { const dt = L / D; let s = 0; for (let i = 0; i < k; i++) s += dt; return s; },
  };
  const out = { L, D, chosen: 'divide-first  (k/D)*L', forms: {} };
  for (const [name, f] of Object.entries(forms)) {
    const end = f(D);
    out.forms[name] = { end, closes: end === L, err: end - L, ulps: ulpsBetween(end, L) };
  }
  if (samples > 0) {
    /* the middle, against exact rational arithmetic — neither form is systematically nearer, which is why the
       endpoint carries the whole argument */
    const score = { 'divide-first  (k/D)*L': 0, 'step-first    k*(L/D)': 0, tie: 0 };
    for (let i = 1; i <= samples; i++) {
      const k = Math.max(1, Math.min(D - 1, Math.round((i / (samples + 1)) * D)));
      const t = exactRational(k, D, L);
      const a = absDiffBig(binaryOf((k / D) * L), t), b = absDiffBig(binaryOf(k * (L / D)), t);
      if (a < b) score['divide-first  (k/D)*L']++; else if (b < a) score['step-first    k*(L/D)']++; else score.tie++;
    }
    out.middle = score;
  }
  return out;
}

/* the exact binary value of a double, scaled by 2^SHIFT so two of them can be compared as integers */
const BIG_SHIFT = 300n;
function binaryOf(x) {
  const dv = new DataView(new ArrayBuffer(8)); dv.setFloat64(0, x);
  const bits = dv.getBigUint64(0), expo = Number((bits >> 52n) & 0x7ffn), man = bits & 0xfffffffffffffn;
  const m = expo === 0 ? man : (man | (1n << 52n)), e = BigInt((expo === 0 ? 1 : expo) - 1075) + BIG_SHIFT;
  const v = e >= 0n ? m << e : m >> (-e);
  return (bits >> 63n) ? -v : v;
}
function exactRational(k, D, L) {
  const dv = new DataView(new ArrayBuffer(8)); dv.setFloat64(0, L);
  const bits = dv.getBigUint64(0), expo = Number((bits >> 52n) & 0x7ffn), man = bits & 0xfffffffffffffn;
  const m = expo === 0 ? man : (man | (1n << 52n)), e = BigInt((expo === 0 ? 1 : expo) - 1075) + BIG_SHIFT;
  const p = BigInt(k) * m, v = (e >= 0n ? p << e : p >> (-e)) / BigInt(D);
  return (bits >> 63n) ? -v : v;
}
const absDiffBig = (a, b) => (a > b ? a - b : b - a);

/** how many representable doubles lie between a and b — 0 means bit-identical */
export function ulpsBetween(a, b) {
  if (a === b) return 0;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return Infinity;
  const dv = new DataView(new ArrayBuffer(16));
  dv.setFloat64(0, a); dv.setFloat64(8, b);
  const key = (i) => { const u = dv.getBigUint64(i); return (u >> 63n) ? (0x8000000000000000n - (u & 0x7fffffffffffffffn)) : (u | 0x8000000000000000n); };
  const ka = key(0), kb = key(8);
  return Number(ka > kb ? ka - kb : kb - ka);
}

/**
 * FOLD THE ORIGIN.  On a circle of circumference T, t0 and t0 mod T are the same point — and the second one is a
 * much smaller number, so t0 + off(k) rounds far less.  Returns the reduced origin, how many laps were removed,
 * and the precision it buys (ulp(t0) before and after).  It is only the same point when T is a TRUE period of
 * what is being rendered, which is `planExact`'s job to decide, not this function's.
 */
export function foldOrigin(t0, T) {
  if (!(T > 0) || !Number.isFinite(t0)) return { t0, laps: 0, folded: false, ulpBefore: ulpOf(t0), ulpAfter: ulpOf(t0), gain: 1 };
  const laps = Math.floor(t0 / T);
  const folded = t0 - laps * T;                      // one rounding, and it is the point of the fold
  const t = (folded >= 0 && folded < T) ? folded : ((t0 % T) + T) % T;
  return { t0: t, laps, folded: t !== t0, ulpBefore: ulpOf(t0), ulpAfter: ulpOf(t), gain: ulpOf(t0) / Math.max(Number.MIN_VALUE, ulpOf(t)) };
}
export function ulpOf(x) {
  const a = Math.abs(x);
  if (!Number.isFinite(a)) return NaN;
  if (a === 0) return Number.MIN_VALUE;
  const e = Math.floor(Math.log2(a));
  return Math.pow(2, Math.max(-1074, e - 52));
}

/* ── THE SCHEDULE ──────────────────────────────────────────────────────────────────────────────────────────── */

/**
 * THE FRAME SCHEDULE.  `mode` decides the endpoint rule and the tempo arithmetic; everything else follows.
 *
 *   { mode: 'loop', t0, T, fps, frames | seconds | rate }   N frames, [t0, t0+T), the endpoint DROPPED
 *   { mode: 'span', t0, t1 | span, fps, frames | seconds | rate }   N frames, [t0, t1], the endpoint KEPT
 *
 * `at(k)` is the logical time of frame k and `off(k)` is its offset from the origin — the offset is where the
 * exactness lives, and `worstGapRel` says how much of it the addition t0 + off gives back at this t0.
 */
export function exactSchedule(o = {}) {
  const mode = o.mode === 'span' ? 'span' : 'loop';
  const fps = o.fps === undefined ? 30 : +o.fps;
  if (!(fps > 0)) throw new Error('render-exact: exactSchedule needs a positive fps');
  const L = mode === 'loop' ? +o.T : (o.span !== undefined ? +o.span : (+o.t1 - +o.t0));
  if (!(L > 0)) throw new Error('render-exact: exactSchedule needs a positive ' + (mode === 'loop' ? 'period T' : 'span'));
  const minFrames = o.minFrames === undefined ? (mode === 'span' ? 2 : 1) : o.minFrames;
  const maxFrames = o.maxFrames === undefined ? 36000 : o.maxFrames;

  /* how many frames.  A loop's N frames tile the circle in N gaps; a span's N frames tile the segment in N−1,
     so a request in seconds or in rate resolves to a different N in the two modes.  This is the tempo law. */
  const gapsFor = (n) => (mode === 'loop' ? n : n - 1);
  let ideal;
  if (o.frames) ideal = +o.frames;
  else if (o.seconds) ideal = mode === 'loop' ? o.seconds * fps : o.seconds * fps + 1;
  else if (o.rate) ideal = mode === 'loop' ? fps * L / o.rate : fps * L / o.rate + 1;
  else throw new Error('render-exact: exactSchedule needs one of frames, seconds or rate');
  let N = Math.round(ideal);
  const clampedLow = N < minFrames, clampedHigh = N > maxFrames;
  N = Math.max(minFrames, Math.min(maxFrames, N));

  const D = Math.max(1, gapsFor(N));                       // the DIVISOR: N for a loop, N−1 for a span
  const t0given = o.t0 === undefined ? 0 : +o.t0;
  const fold = (mode === 'loop' && o.foldT0) ? foldOrigin(t0given, L) : { t0: t0given, laps: 0, folded: false, ulpBefore: ulpOf(t0given), ulpAfter: ulpOf(t0given), gain: 1 };
  const t0 = fold.t0;

  const off = (k) => offsetOf(k, D, L);
  const at = (k) => t0 + off(k);
  const dt = L / D;
  const frameCount = (mode === 'loop' || N > 1) ? N : 1;

  const times = new Array(frameCount);
  for (let k = 0; k < frameCount; k++) times[k] = at(k);
  /* the gaps of the CYCLE for a loop (the wrap included) and of the SEGMENT for a span (no wrap: there is none) */
  const gaps = [];
  for (let k = 1; k < times.length; k++) gaps.push(times[k] - times[k - 1]);
  if (mode === 'loop') gaps.push((t0 + L) - times[times.length - 1]);
  let worst = 0; for (const g of gaps) worst = Math.max(worst, Math.abs(g - dt));
  let distinct = true; for (let k = 1; k < times.length; k++) if (!(times[k] > times[k - 1])) distinct = false;

  const gapSeconds = gapsFor(frameCount) / fps;            // the wall seconds the MOTION takes
  const clipSeconds = frameCount / fps;                    // the wall seconds the CLIP lasts

  return {
    mode, endpoint: ENDPOINT[mode], t0, t0given, folded: fold.folded, foldLaps: fold.laps, foldGain: fold.gain,
    L, T: mode === 'loop' ? L : undefined, span: mode === 'span' ? L : undefined,
    N: frameCount, D, fps, dt, at, off,
    idealFrames: ideal, clamped: clampedLow || clampedHigh, clampedLow, clampedHigh,
    /** the logical times, in order.  `{ endpoint: true }` builds the schedule this file REFUSES for a loop. */
    all(opts) {
      const n = (mode === 'loop' && opts && opts.endpoint) ? frameCount + 1 : frameCount;
      const out = new Array(n); for (let k = 0; k < n; k++) out[k] = at(k); return out;
    },
    times, gaps,
    /** THE GAPS.  `uniform` is the strict fact (every gap is dt to the last bit).  `worstGapUlps` measures the
     *  deviation in ulps OF THE TIME, and it is about one at any origin — the rounding is already minimal.  The
     *  number that moves is `worstGapRel`, the deviation as a fraction of a gap: ulp(t) grows with t0 while dt
     *  does not, so a deep origin quantises the schedule coarsely in units of its own step.  That is the defect,
     *  and `foldT0` is the fix. */
    uniform: worst === 0, worstGapErr: worst, worstGapRel: worst / dt,
    worstGapUlps: worst / ulpOf(Math.max(Math.abs(t0), Math.abs(t0 + L), dt)),
    distinct, endpointExact: off(D) === L, endpointUlps: ulpsBetween(off(D), L),
    /** the tempo.  A span's motion runs in N−1 gaps while its clip lasts N frames; a loop's are the same. */
    seconds: clipSeconds, motionSeconds: gapSeconds,
    rate: L / Math.max(1e-12, gapSeconds), requestedRate: o.rate || null,
    rateShift: o.rate ? (L / Math.max(1e-12, gapSeconds)) / o.rate - 1 : 0,
    L_fs: L * AU_FS,
  };
}

/**
 * THE ENDPOINT RULE, PROVED RATHER THAN ASSERTED — for BOTH modes, because they have different right answers.
 * Hand it `f`, any observable of t (the real density, a rendered luminance, anything), and the verdict stops
 * being an argument about phases and becomes a measurement: `duplicateRatio` is |f(last) − f(first)| divided by
 * the size of one honest frame-to-frame step, so "the endpoint frame is frame 0 again" reads as a number near 0.
 */
export function endpointLaw({ mode = 'loop', T, span, t0 = 0, N, f = null } = {}) {
  const L = mode === 'loop' ? T : span;
  const s = exactSchedule({ mode, t0, T, span, fps: 30, frames: N });
  const D = s.D, dt = s.dt;
  const shape = (endpoint) => {
    const times = mode === 'loop' ? s.all({ endpoint }) : (endpoint ? s.times.slice() : s.times.slice(0, -1));
    const g = [];
    for (let k = 1; k < times.length; k++) g.push(times[k] - times[k - 1]);
    if (mode === 'loop') g.push((t0 + L) - times[times.length - 1]);
    const out = {
      frames: times.length, first: times[0], last: times[times.length - 1],
      gaps: g, minGap: Math.min(...g), maxGap: Math.max(...g),
      uniform: g.every((x) => Math.abs(x - dt) <= 4 * ulpOf(t0 + L)),
      /** a loop: does the last frame land on the SAME POINT of the circle as the first */
      duplicatesFirst: mode === 'loop' ? !!endpoint : false,
      /** a span: does the last frame actually REACH t1, and what does the other choice miss */
      reachesEnd: mode === 'span' ? (endpoint ? times[times.length - 1] === t0 + L : false) : undefined,
      shortfall: mode === 'span' ? (t0 + L) - times[times.length - 1] : undefined,
    };
    if (f) {
      const a = f(out.first), b = f(out.last), step = Math.abs(f(s.at(1)) - f(s.at(0)));
      out.fFirst = a; out.fLast = b; out.duplicateValue = Math.abs(b - a);
      out.frameStep = step;
      out.duplicateRatio = step > 0 ? Math.abs(b - a) / step : (Math.abs(b - a) === 0 ? 0 : Infinity);
    }
    return out;
  };
  const excl = shape(false), incl = shape(true);
  return {
    mode, L, T, span, t0, N, D, dt, chosen: ENDPOINT[mode],
    exclusive: excl, inclusive: incl,
    why: mode === 'loop'
      ? 'A LOOP IS A CIRCLE: t0 and t0+T are the same point of it, so the inclusive schedule\'s last frame IS frame 0 — its wrap gap is 0 while every other gap is T/N, which holds the first image for two frame times at the join, and it stretches one period over (N+1)/fps. The exclusive schedule\'s gaps are all T/N, the wrap included.'
      : 'A SPAN IS A SEGMENT: t0 and t1 are two different states, so there is no duplicate to avoid. The exclusive schedule never renders t1 at all — it stops one gap short, at t1 − L/(N−1) — and silently shortens what the caller asked for. The inclusive schedule\'s N−1 gaps are all L/(N−1) and its last frame is t1 to the last bit.',
  };
}

/**
 * THE PLAN, and THE REFUSAL.  A loop needs a period; a state that has none is REFUSED, never silently looped.
 * The period question itself is capture.js' — `planPeriodRecording` already reads the observable, chooses T_ρ or
 * T_ψ, and refuses an incommensurate spectrum with the near-recurrence and its seam error — so this wraps it
 * rather than growing a second opinion beside it, and adds what a deterministic render needs on top: the exact
 * schedule, the fold, the cost and the hazard list.
 *
 *   mode 'span'  never refuses: any interval can be rendered.  It is LABELLED 'SPAN', never 'LOOP', and its
 *                seam is reported (a span that happens to close is a loop and says so).
 *   mode 'loop'  refuses kind 'near' and kind 'none' unless `allowNear`, exactly as capture.js does.
 */
export function planExact(period, o = {}) {
  const mode = o.mode === 'span' ? 'span' : 'loop';
  const fps = o.fps || 30;
  const t0 = o.t0 === undefined ? 0 : +o.t0;
  if (mode === 'span') {
    const L = o.span !== undefined ? +o.span : (o.t1 !== undefined ? +o.t1 - t0 : (o.seconds && o.rate ? o.seconds * o.rate : NaN));
    if (!(L > 0)) return { ok: false, kind: 'none', mode, label: 'NO SPAN', message: 'A SPAN needs t1, or span, or seconds with a rate. Nothing here says how much logical time to render.' };
    const sched = exactSchedule({ mode, t0, span: L, fps, frames: o.frames, seconds: o.seconds, rate: o.rate, minFrames: o.minFrames, maxFrames: o.maxFrames });
    const err = o.energies ? seamError(o.energies, L) : null;
    const closes = err !== null && err < 1e-9;
    return Object.assign({}, schedulePlan(sched, o), {
      ok: true, kind: 'span', mode, label: 'SPAN', closes, seamError: err, usedPeriod: null, laps: null,
      message: 'SPAN · ' + sched.N + ' frames at ' + fps + ' fps = ' + sched.seconds.toFixed(3) + ' s of clip over '
        + fmtT(L) + ' of logical time. THE ENDPOINT IS KEPT: the last frame is t1 exactly, and the motion runs over '
        + sched.D + ' gaps of ' + sched.dt.toPrecision(8) + ' a.u.'
        + (closes ? ' (this span CLOSES — it is a whole number of periods, so it would also be an exact loop, and as a loop it would want one frame fewer.)' : '')
        + (err !== null && !closes ? ' It does NOT close: the worst pair is ' + err.toPrecision(3) + ' of a turn from returning, so the last frame is not the first. That is correct for a span and would be a seam in a loop.' : ''),
    });
  }
  /* a LOOP: capture.js owns the period question */
  const P = planPeriodRecording(period, Object.assign({}, o, { fps, t0, frames: o.frames, seconds: o.seconds, rate: o.rate }));
  if (!P.ok) return Object.assign({}, P, { mode, exactRender: false });
  if (P.kind === 'stationary') {
    const sched = exactSchedule({ mode: 'span', t0, span: 1, fps, frames: 1, minFrames: 1 });
    /* THE ORDER MATTERS: capture.js' plan carries a `schedule` of its own (its loopSchedule), so ours must be
       assigned OVER it or a caller would render this file's endpoint rule against that file's times. */
    return Object.assign({}, P, schedulePlan(sched, o), { mode: 'loop', ok: true, kind: 'stationary', label: 'STATIONARY', frames: 1, N: 1 });
  }
  /* FOLD only when the period being rendered really is a period of the PICTURE.  At T_ψ every view returns and
     the fold is exact for all of them; at T_ρ only the density does, so a phase view must not be folded. */
  const mayFold = P.usedPeriod === 'wave' || !viewCarriesGlobalPhase(P.observable || 'density');
  const wantFold = o.foldT0 === undefined ? true : !!o.foldT0;
  const sched = exactSchedule({ mode: 'loop', t0, T: P.T, fps, frames: P.N, foldT0: wantFold && mayFold && P.kind === 'exact' });
  return Object.assign({}, P, schedulePlan(sched, o), {
    mode: 'loop', foldAllowed: mayFold, foldApplied: sched.folded,
    foldNote: sched.folded
      ? 'THE ORIGIN WAS FOLDED: t0 ' + P.t0 + ' → ' + sched.t0 + ' (' + sched.foldLaps + ' whole periods removed). Same point of the circle, ' + sched.foldGain.toPrecision(3) + 'x finer arithmetic, and the schedule\'s gaps are uniform again.'
      : mayFold ? 'the origin was not folded (already inside one period, or folding was declined)'
        : 'THE ORIGIN CANNOT BE FOLDED HERE: the observable is ' + (P.observable || 'density') + ', which paints the global phase of psi, and only the DENSITY returns at T_rho — t0 mod T_rho is a different picture. Loop at T_psi (pixelExact) if you want the fold.',
  });
}
function fmtT(T) { return T.toPrecision(8) + ' a.u. (' + (T * AU_FS).toPrecision(5) + ' fs)'; }
function schedulePlan(sched, o) {
  return {
    schedule: sched, N: sched.N, frames: sched.N, fps: sched.fps, dt: sched.dt, T: sched.L,
    seconds: sched.seconds, motionSeconds: sched.motionSeconds, rate: sched.rate,
    endpoint: sched.endpoint, endpointExact: sched.endpointExact,
    uniform: sched.uniform, worstGapErr: sched.worstGapErr, worstGapRel: sched.worstGapRel,
    cost: estimate({ w: o.w || o.width || 0, h: o.h || o.height || 0, frames: sched.N }),
  };
}

/* ── THE COST ──────────────────────────────────────────────────────────────────────────────────────────────── */

/** λWAVES' own seed for a device's first film: render + GPU readback + PNG was very nearly linear in megapixels — 131 ms
 *  per Mpx over a 181 ms floor across a 73x range (capture.js' six points: headless Firefox, RTX 3070, 96³, 2026-09-05).
 *  A film replaces it with this device's own milliseconds a frame once one has run. */
export const MS_FLOOR = 181, MS_PER_MPX = 131;

/**
 * WHAT IT WILL COST, before anybody starts it: the kit's estimate (render/plan.js estimateFilm — the frame count, the
 * MP4's size at its bitrate, the time) on λWAVES' seed or on a measured `msPerFrame`, with the kit's run ceiling.
 */
export function estimate({ w = 0, h = 0, frames = 0, fps = 30, format = 'png', msPerFrame = null } = {}) {
  const mpx = (w * h) / 1e6, measured = msPerFrame !== null && msPerFrame > 0;
  const ms = measured ? msPerFrame : (mpx > 0 ? MS_FLOOR + MS_PER_MPX * mpx : NaN);
  const e = estimateFilm({ frames, fps: RECORD_FPS.includes(+fps) ? +fps : 30, width: w, height: h, format, msPerFrame: ms });
  return Object.assign(e, {
    w, h, mpx, msPerFrame: ms, totalMs: e.renderMs, measured,
    basis: measured ? 'measured on this device' : 'λWAVES\' seed: ' + MS_FLOOR + ' ms + ' + MS_PER_MPX + ' ms per Mpx',
    human: (frames || 0) + ' frames · ' + (w && h ? w + '×' + h : 'size unknown') + ' · ~' + (Number.isFinite(e.renderMs) ? fmtMs(e.renderMs) : '?') + (e.bytes ? ' · ~' + fmtBytes(e.bytes) : ' · lossless PNG frames'),
    warning: !(mpx > 0) ? 'no size given: the cost is unknown' : ceilingWarning(e.renderMs).replace(/^ — /, ''),
  });
}

/* ── THE DIGEST ────────────────────────────────────────────────────────────────────────────────────────────── */

/**
 * A 64-BIT FINGERPRINT of a byte run, as two independent FNV-1a lanes with a final avalanche.  It is a
 * fingerprint and NOT a cryptographic hash: its job is to detect that two renders differ, not to resist anyone
 * trying to make them collide.  A film takes it over every frame's RGBA as read off the GPU — the pixels, which are
 * ours, never the container, which is the kit's (and an MP4's is lossy).
 */
export function digest(bytes) {
  let a = 0x811c9dc5 >>> 0, b = 0x9dc5811c >>> 0;
  const n = bytes.length;
  for (let i = 0; i < n; i++) {
    const v = bytes[i];
    a = Math.imul(a ^ v, 16777619) >>> 0;
    b = Math.imul(b ^ v, 2246822519) >>> 0;
  }
  a = (a ^ n) >>> 0; b = (b ^ (n * 2654435761)) >>> 0;
  a = Math.imul(a ^ (a >>> 15), 2246822507) >>> 0; a = (a ^ (a >>> 13)) >>> 0;
  b = Math.imul(b ^ (b >>> 15), 3266489909) >>> 0; b = (b ^ (b >>> 13)) >>> 0;
  return a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0');
}

/* ── THE HAZARD REGISTER ───────────────────────────────────────────────────────────────────────────────────── */

/**
 * EVERY SOURCE OF NON-DETERMINISM FOUND IN THE RENDER PATH, as data — so the film's pins, the honest report and the
 * proof all read the SAME list and cannot drift apart.  `owner` says whose pin it is since 0.5.0 C7: 'app' (λWAVES',
 * in `frame(i, ctx)` and its `before`) or 'kit' (MIR's recorder).  `pin` is what is done; `witness` is what is checked
 * afterwards, because a pin that is asserted and not verified is a hope.
 */
const hz = (id, owner, what, where, pin, witness) => Object.freeze({ id, owner, what, where, pin, witness });
export const HAZARDS = Object.freeze([
  hz('jitter', 'app', 'field.js seeds the ray-march start offset with (field.stats.presents % 97)/97 (DUST, which replaced GRAIN at iteration 008 G, reads none of it), so the same state renders differently at different points of a 97-frame cycle', 'field.js writeView v[19] → V.p0.w', 'stats.presents is set to the seed (13) immediately before every frame and restored honestly afterwards', 'presents reads seed+1 after the frame: exactly one present happened and it was ours'),
  hz('governor', 'app', 'the rack\'s one controller judges the window median of presented frames against the frame budget and steps the FIELD GRID down the ladder (128 → 96 → 64) on a slow machine — the picture literally coarsens with machine speed', 'rack.js loop, controlStep / gov / effectiveRes', 'the physics clock is paused (the governor only acts while playing, and pausing resets its drop) and governor.on is turned off for the film', 'field.resolution is compared against its reading before frame 0 after every frame'),
  hz('autoscale', 'app', 'quality.autoScale is moved by ONE time-paced proportional decision and multiplies the size the rack asks field.resize for; a window resize or a DPR change does the same, and NOTHING PRESENTS when they do', 'rack.js loop, autoQ', 'quality.auto = false for the film, restored after', 'canvas.width/height are read AT the readback, after the copy completes — the one place a resize between the render and the copy cannot slip past'),
  hz('fieldclock', 'app', 'the rack reconstructs psi on an EVOLVE tier only when the field clock is due, so a capped field clock renders the same picture twice', 'rack.js loop, fieldRate.capMs / lastReconMs', 'the frame bypasses the tier router and passes a non-null modes to field.frame, so the compute pass is unconditional', 'field.stats.generation advances by exactly one per frame'),
  hz('camera', 'app', 'the camera pose is an integrator: omega decays as exp(-mu dt) on the WALL clock (AUTO-ROTATE reads mu as 0: a fling never decays)', 'camera-law.js cameraStep', 'a moving camera is refused; or stilled (dy = dp = 0, autoRotate off) and restored. A camera move comes from poseAt(k, N), a pure function of the frame index', 'camera.moving is false, and obs is what the schedule wrote'),
  hz('modulation', 'kit', 'the modulation rack runs on the wall clock, and its one-pole SMOOTH filters and envelopes accumulate dt — there is no modulated(t) to evaluate', 'rack.js loop → mir/host.js advanceTo', "'freeze': the rack stops it (every target back to base) and the recorder is built with no host, so it steps nothing; 'drive': the kit's record clock (render/clock.js) replays it FROM FIRST SPACE at exactly 1/fps a frame and puts the live runtime back in one operation", "frozen: LW.mod.running is false for the whole film; driven: the kit's clock holds the realtime pump suspended"),
  hz('modealias', 'app', 'LW.modesAt(t) returns a module-level array of module-level records rewritten in place, so anything that calls modesAt between our call and field.frame\'s consumption rewrites our modes', 'rack.js modesAt / modeRecs', 'modesAt is evaluated inline in the draw, with nothing between', 'covered by the jitter witness — an interloper that could rewrite the modes had to present to do it'),
  hz('interloper', 'app', 'any schedule() from anywhere arms a rAF that resizes the canvas, presents with an unpinned seed and advances the modulation on wall time', 'rack.js schedule / loop', 'the rack\'s own hold while a film owns the page (exportLocked: no rAF is armed), and a drain before frame 0', 'the jitter, generation and size witnesses all fire; the frame is rendered again, and one that will not settle aborts the film by name'),
  hz('dpr', 'kit', 'field.resize multiplies by window.devicePixelRatio, so a film sized by scale inherits the machine\'s DPR', 'field.js resize', 'the kit\'s recorder takes an explicit even size; a scale-sized film records the resolved size and flags sizeFromMachine', 'the manifest carries the resolved size'),
  hz('overlays', 'kit', 'particles.js integrates an RK4 trajectory from its own lastT to t (and teleports when |dt| > 4, which every loop\'s wrap gap is) on the 2-D #particles layer', 'rack.js loop; particles.js advance', 'a film carries no 2-D overlay layer: the kit composites none (KIT BRIEF 6 is that road); a picture labels the overlays it upscales', 'the picture names its upscaled layers'),
  hz('deflate', 'kit', 'a PNG container\'s compression is unspecified and changes between browser builds: the PIXELS are exact and the CONTAINER is not', 'mir/render/encoder.js pngBytes', 'the kit encodes every frame; λWAVES\' digest is over the frame\'s RGBA as read off the GPU, which is ours', 'the frame log carries every digest'),
  hz('gamut', 'kit', 'field.js configures the context display-p3 on a wide-gamut screen; the same shader output then means different colour', 'field.js / capture.js configureCopy', 'a display-p3 canvas is declared to the kit\'s recorder (colorSpace), which tags its frames', 'the manifest records the gamut and the swapchain format'),
]);
export const HAZARD_IDS = Object.freeze(HAZARDS.map((h) => h.id));

/* ── THE MANIFEST ──────────────────────────────────────────────────────────────────────────────────────────── */

/**
 * THE AUDIT, and what makes a film comparable without keeping its pixels: two runs of the same schedule are compared by
 * diffing two small JSON files.  The kit writes `recording.json` beside the frames (the film's schedule rides in it, under
 * `app`, from `describe`); the frame log — every scheduled t and every digest — comes back with the result.
 */
export function manifest(o = {}) {
  const s = o.schedule;
  return {
    format: 'lambdawaves/film@2',
    built: o.stamp || null,
    schedule: s ? {
      mode: s.mode, endpoint: s.endpoint, t0: s.t0, t0given: s.t0given, folded: s.folded, foldLaps: s.foldLaps,
      L: s.L, N: s.N, D: s.D, fps: s.fps, dt: s.dt,
      endpointExact: s.endpointExact, endpointUlps: s.endpointUlps,
      uniform: s.uniform, worstGapErr: s.worstGapErr, worstGapRel: s.worstGapRel, worstGapUlps: s.worstGapUlps, distinct: s.distinct,
      seconds: s.seconds, motionSeconds: s.motionSeconds, rate: s.rate,
    } : null,
    picture: o.picture || null,
    state: o.state || null,
    pins: o.pins || null,
    witnesses: o.witnesses || null,
    frames: o.frames || [],
    ffmpeg: o.ffmpeg || null,
    caveats: [
      'The PIXELS are the exact quantity: every digest is over a frame\'s RGBA as read off the GPU. The PNG and MP4 containers are the kit\'s, and an MP4 is lossy.',
      'A cross-machine comparison is only meaningful between films that agree on gamut and swapchain format.',
      'Wall time appears here only as a report of how long the film took. It was never an input to a picture.',
    ],
  };
}

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════
   PART 2 — THE FILM: MIR's recorder, with λWAVES' frame.  Needs a browser (or the fake lab the proof injects).
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

export const DEFAULTS = Object.freeze({
  jitterSeed: 13,          // capture.js pins the same seed, so a picture and a film frame of one state agree
  retries: 3,              // a contended frame is rendered again; three failures abort the film by name
  modulation: 'freeze',    // 'freeze' | 'drive' (the kit's record clock)
  camera: 'refuse',        // 'refuse' | 'still'
  format: 'png',           // 'png' (lossless frames in the kit's ZIP parts) | 'mp4'
});

/** the frame rates a film runs at: the kit's (render/plan.js RECORD_FPS — 24, 30, 48, 60); its recorder refuses any other */
export const FILM_FPS = RECORD_FPS;

/**
 * createFilm(LW, opts) — THE FILM: `createRecorder` from lab/mir/render/recorder.js, handed λWAVES' `frame(i, ctx)`.
 *
 * THE KIT'S: the take (one run per page; Escape or a [data-render-cancel] button cancels it, and the page's input is
 * swallowed for its length), the modulation clock stepped by exactly 1/fps when a film DRIVES it (render/clock.js — with
 * nothing driven the recorder is built with no host and steps nothing, so a frozen look is the rack's own, untouched),
 * the MP4 (WebCodecs down the avc1 ladder, its own muxer, the encoder proven on two frames before the first), or the
 * lossless PNG frames in stored ZIP parts beside their recording.json, the store on disk, and the progress.
 * λWAVES': THE SCHEDULE — which logical time frame i is (exactSchedule's two endpoint rules and the fold, a driven rate
 * integrated frame by frame) — handed to the kit as a motion whose view(i) is that time; THE FRAME — the physics clock
 * SET, the pose path and H₂'s update applied, the picture rendered and read back off the GPU and settled (capture.js
 * `readback`); its PINS AND WITNESSES — H1 the jitter seed 13 pinned per frame, H2 the governor, H3 AUTO SCALE, with the
 * field-clock, clock, domain and interloper witnesses beside them; a frame is emitted only when they agree, and one that
 * will not settle ABORTS the film by name; and the caption (KIT BRIEF 6's overlay replaces it).
 *
 *   const film = createFilm(LW, { canvas, energies, host: () => modHost, hold });
 *   film.plan(o)    → planExact + the size + the cost + every hazard's live reading (a button shows it, commits to nothing)
 *   film.render({ schedule | <plan options>, format: 'mp4' | 'png', scale | width | height, caption, poseAt, beforeFrame,
 *                 modulation: 'freeze' | 'drive', camera: 'refuse' | 'still', onProgress }) → { stop(), stopped, done }
 *   film.verify(o)  → the same short schedule rendered twice through the seam, digest against digest
 *   film.save(r)    → every file of a finished film handed over (capture.js' handOver), under λWAVES' names
 * `opts.hold(on)` is the host's own lock (rack.js: its loop stands aside and its state is put back); `opts.grab` replaces
 * the GPU road (the proof's fake lab); `opts.storage` / `opts.calib` / `opts.guard` reach the kit's recorder.
 */
export function createFilm(LW, opts = {}) {
  const canvas = opts.canvas || (typeof document !== 'undefined' ? document.getElementById('field') : null);
  const now = opts.now || (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));
  const raf = opts.raf || ((typeof requestAnimationFrame === 'function') ? (() => new Promise((r) => requestAnimationFrame(r))) : (() => Promise.resolve()));
  const JITTER_SEED = opts.jitterSeed === undefined ? DEFAULTS.jitterSeed : (opts.jitterSeed | 0);
  const taken = new Set(), recs = {};
  const field = () => LW.field;
  const gpuOk = () => { const f = field(); return !!(f && f.ok); };
  let job = null, cfgUsage = null, token = 0, lastMs = null;   // lastMs: this device's own milliseconds a frame, once a film has run
  let card = null, last = null;   // 0.5.0 C7b: the RENDER card's recorder options (`recorder(o)`) · the last film's frame log and names
  const road = opts.road || {};    // the rack's own: pending() → { caption, spin, yaw0 }, step(dt) (the rotor rates), rotating(), plan(o)

  function limits() { const f = field(); return maxPictureSize(f && f.ok ? f.device.limits : null, opts.canvasCap || 32767); }
  function stateLabel() {
    try {
      if (opts.label) return opts.label;
      const p = LW.reg && LW.reg.presetId; if (p) return p;
      const pop = LW.reg && LW.reg.populated ? LW.reg.populated() : [];
      return pop.length ? pop.length + 'modes' : 'state';
    } catch (_) { return 'state'; }
  }
  /** the host's own energy expression, or none — never a guess under a propagator (capture.js' wave 58) */
  function energiesNow() {
    try {
      if (opts.energies) { const E = opts.energies(); return E && E.length ? Array.from(E) : null; }
      if (LW.reg && LW.reg.P) return null;
      return LW.reg.populated().map((a) => LW.reg.Ediag(a));
    } catch (_) { return null; }
  }
  /** the film's size, resolved — even sides of at least 16, as the kit's recorder takes them (H.264's 4:2:0) — and whether
   *  the machine decided it (H10: no width or height given, so it inherits the canvas at this device pixel ratio) */
  function sizeFor(o) {
    const lim = limits();
    const fit = fitPicture({ srcW: canvas ? canvas.width : 16, srcH: canvas ? canvas.height : 16, scale: o.scale, width: o.width, height: o.height, max: lim.side });
    const even = (n) => Math.max(16, Math.round(n) & ~1), explicit = !!(o.width || o.height);
    return Object.assign({}, fit, { w: even(fit.w), h: even(fit.h), explicit, sizeFromMachine: !explicit, limits: lim });
  }

  /** WHAT WILL HAPPEN, before anything does: the schedule, the refusal if there is one, the cost, every pin's live reading */
  function plan(o = {}) {
    const observable = o.observable || (LW.mat ? VIEW_NAMES[LW.mat.view | 0] : 'density') || 'density';
    const energies = energiesNow();
    let wave = null;
    if (energies && energies.length && (viewCarriesGlobalPhase(observable) || o.pixelExact)) { try { wave = wavePeriod(energies); } catch (_) { wave = null; } }
    const period = o.period !== undefined ? o.period : (LW.period || null);
    const size = sizeFor(o);
    const p = planExact(period, Object.assign({ t0: LW.clock ? LW.clock.t : 0, rate: LW.clock ? LW.clock.rate : undefined, energies, observable, wave, w: size.w, h: size.h }, o));
    const H = hazards(), warnings = [];
    for (const h of H.readings) if (h.state === 'live' && h.blocking) warnings.push(h.note);
    if (size.sizeFromMachine) warnings.push('THE SIZE CAME FROM THIS MACHINE: no width or height was given, so the film inherits the canvas at this device pixel ratio (' + size.w + '×' + size.h + '). Two machines will render two different pictures. Give an explicit width for a size that travels.');
    if (size.clipped) warnings.push('CLIPPED to ' + (size.limits ? size.limits.side : '?') + ' on the long side — the DEVICE limit.');
    const cost = estimate({ w: size.w, h: size.h, frames: p.N || 0, fps: o.fps || 30, format: o.format || DEFAULTS.format, msPerFrame: lastMs });
    if (p.ok && cost.warning) warnings.push(cost.warning);
    return Object.assign({}, p, { opts: Object.assign({}, o), size, observable, energies: energies ? energies.length : 0, hazards: H, warnings, cost });
  }

  /** every hazard's LIVE reading — what is armed right now, before or after a film */
  function hazards() {
    const f = field();
    const read = (id) => {
      switch (id) {
        case 'jitter': return { state: 'live', blocking: false, value: f && f.ok ? f.stats.presents : null, note: 'the jitter counter is running; a film pins it to ' + JITTER_SEED + ' for every frame' };
        case 'governor': return { state: (LW.governor && LW.governor.on) ? 'live' : 'off', blocking: false, value: LW.governor ? LW.governor.drop : null, note: (LW.governor && LW.governor.drop) ? 'THE GOVERNOR HAS ALREADY STEPPED THE GRID DOWN ' + LW.governor.drop + ' notch(es): this machine is rendering a coarser volume than the one you set. Pausing restores it, and a film pauses.' : 'the governor is armed; a film pauses the clock and turns it off, which is what disarms it' };
        case 'autoscale': return { state: (LW.quality && LW.quality.auto) ? 'live' : 'off', blocking: false, value: LW.quality ? LW.quality.autoScale : null, note: 'auto scale ' + ((LW.quality && LW.quality.auto) ? 'is on; a film holds it off and renders at the size asked for' : 'is off') };
        case 'camera': { const m = !!(LW.camera && LW.camera.moving); return { state: m ? 'live' : 'off', blocking: m, value: LW.camera ? { dy: LW.camera.dy, dp: LW.camera.dp, autoRotate: LW.camera.autoRotate } : null, note: m ? 'THE CAMERA IS MOVING' + (LW.camera.autoRotate ? ' (a fling held by AUTO-ROTATE)' : ' (a fling is still coasting)') + ': its pose is an integrator on the wall clock, so a film would depend on machine speed. camera: "still" brings it to rest; poseAt(k, N) is a camera move that IS deterministic.' : 'the camera is at rest' }; }
        case 'modulation': { const r = !!(LW.mod && LW.mod.running); return { state: r ? 'live' : 'off', blocking: r, value: r, note: r ? 'THE MODULATION RACK IS RUNNING on the wall clock, and its smoothing filters accumulate. A film freezes it (every target back to its knob), or modulation: "drive" hands it to the kit\'s record clock, FROM FIRST SPACE at 1/fps a frame.' : 'the modulation rack is not running' }; }
        case 'interloper': { const s = !!(LW.stats && LW.stats.scheduled); return { state: s ? 'live' : 'off', blocking: false, value: s, note: s ? 'a rack frame is scheduled; a film drains it and the per-frame witnesses catch any that arrive anyway' : 'no rack frame is scheduled' }; }
        case 'gamut': return { state: (f && f.ok && f.gamut && f.gamut !== 'srgb') ? 'live' : 'off', blocking: false, value: f && f.ok ? f.gamut : null, note: (f && f.ok && f.gamut && f.gamut !== 'srgb') ? 'THIS CANVAS IS ' + f.gamut + ': the film is declared display-p3 to the kit\'s encoder' : 'the canvas is sRGB' };
        case 'fieldclock': return { state: 'live', blocking: false, value: LW.fieldRate ? LW.fieldRate.capMs : null, note: 'the field clock caps reconstructs; a film bypasses the tier router entirely' };
        case 'modealias': return { state: 'live', blocking: false, value: null, note: 'the mode list is a reused buffer; a film evaluates modesAt inline in the draw' };
        default: return { state: 'kit', blocking: false, value: null, note: 'the kit\'s: ' + ((HAZARDS.find((h) => h.id === id) || {}).pin || '') };
      }
    };
    const readings = HAZARDS.map((h) => Object.assign({}, h, read(h.id)));
    return { readings, blocking: readings.filter((r) => r.blocking).map((r) => r.id), byId: Object.fromEntries(readings.map((r) => [r.id, r])) };
  }

  const configure = (withCopy) => { const ok = configureCopy(field(), canvas, withCopy); if (ok) cfgUsage = withCopy ? 'copy' : 'plain'; return ok; };

  /* ── THE PINS: applied when the recorder hands the page over (`before`), released when it takes it back (`after`, always) ── */
  async function before(spec) {
    if (!job && spec) job = jobFrom(spec);   // the card's road (or a RESUME after a reload): the job is built from the kit's spec
    const J = job; if (!J) return;
    const f = field(), pinned = J.pinned;
    J.prev = { playing: LW.clock.playing, t: LW.clock.t, rate: LW.clock.rate, cfg: cfgUsage,
      qAuto: LW.quality ? LW.quality.auto : null, qScale: LW.quality ? LW.quality.scale : null, gov: LW.governor ? LW.governor.on : null,
      camAuto: LW.camera ? LW.camera.autoRotate : null, camD: LW.camera ? [LW.camera.dy, LW.camera.dp] : null, modPlaying: !!(LW.mod && LW.mod.playing),
      presents: f && f.stats ? f.stats.presents : 0, canvasW: canvas ? canvas.width : 0, canvasH: canvas ? canvas.height : 0 };
    if (opts.hold) await opts.hold(true);
    if (f && f.pinRenderPipeline) f.pinRenderPipeline(true);   // optimization K2: the whole film draws with the GENERIC present pipeline
    /* H2 · THE CLOCK IS PAUSED, AND THAT IS WHAT DISARMS THE GOVERNOR: the rack only judges while playing, and pausing resets its
       drop.  Turning it off is the belt beside that brace.  H3 · AUTO SCALE is held off for the film. */
    if (pinned('governor')) { LW.clock.pause(); if (LW.governor) LW.governor.on = false; J.pins.governor = 'the clock is paused (which disarms it) and the governor is off'; } else J.pins.governor = 'NOT PINNED (unpin)';
    if (pinned('autoscale') && LW.quality) { LW.quality.auto = false; J.pins.autoscale = 'quality.auto = false'; } else J.pins.autoscale = 'NOT PINNED (unpin)';
    if (LW.camera && LW.camera.moving && pinned('camera')) { LW.camera.dy = 0; LW.camera.dp = 0; LW.camera.autoRotate = false; J.pins.camera = 'stilled (dy = dp = 0, autoRotate off)'; }
    else J.pins.camera = pinned('camera') ? 'at rest' : 'NOT PINNED (unpin)';
    if (J.drive) J.pins.modulation = 'driven by the kit\'s record clock from the first Space, 1/' + J.fps + ' s a frame';
    else if (J.host) J.pins.modulation = 'the kit\'s FREEZE THIS LOOK: every target holds the value it showed at the tap';
    else if (LW.mod && LW.mod.host && pinned('modulation')) { if (LW.mod.running) LW.mod.stop(); J.pins.modulation = 'frozen: every target back to its base'; }
    else J.pins.modulation = LW.mod && LW.mod.host ? 'NOT PINNED (unpin)' : 'no modulation rack';
    if (pinned('interloper')) { await raf(); await raf(); }   // DRAIN: let an armed rack frame run and decline to re-arm
    J.drained = !(LW.stats && LW.stats.scheduled);
    J.pins.interloper = J.drained ? 'the rack loop is idle' : 'THE RACK LOOP IS STILL ASKING FOR FRAMES — the witnesses will catch what it does';
    if (LW.helium && LW.helium.on) void LW.helium.sol;     // HELIUM's basis in force from frame 0 (heliumview.js, 2026-09-24)
    if (canvas && !opts.grab) configure(true);
    J.base = { resolution: f && f.ok ? f.resolution : null, half: LW.domain ? LW.domain.half : null, format: f && f.ok ? f.format : null, gamut: f && f.ok ? f.gamut : null };
    J.rate = LW.clock.rate;
  }
  async function after() {
    const J = job; if (!J || !J.prev) return;
    const P = J.prev, f = field();
    try {
      if (f && f.pinRenderPipeline) f.pinRenderPipeline(false);
      if (canvas && P.canvasW) { canvas.width = P.canvasW; canvas.height = P.canvasH; }
      if (LW.quality && P.qAuto !== null) { LW.quality.auto = P.qAuto; LW.quality.scale = P.qScale; }
      if (LW.camera && P.camAuto !== null) { LW.camera.autoRotate = P.camAuto; [LW.camera.dy, LW.camera.dp] = P.camD; if (LW.camera.moving && LW.camera.wake) LW.camera.wake(); }   // the fling goes on, from now (wake: no film-long step)
      if (LW.governor && P.gov !== null) LW.governor.on = P.gov;
      if (f && f.stats) f.stats.presents = P.presents + J.log.length;   // the diagnostic counter, put back honestly: the frames really did happen
      if (!J.host && P.modPlaying && LW.mod && LW.mod.play) LW.mod.play();
      if (LW.clock) { LW.clock.scrub(P.t); if (LW.clock.setRate) LW.clock.setRate(P.rate); }
      if (P.playing && LW.play) LW.play();
      if (canvas && P.cfg !== 'copy' && !opts.grab) configure(false);
    } catch (_) { /* a restore must never be the thing that throws */ }
    if (opts.hold) { try { await opts.hold(false); } catch (_) { /* the host's own restore */ } }
    if (LW.schedule && LW.TIER) LW.schedule(LW.TIER.PRESENT);   // the screen goes back to showing the lab
    const one = J.periods && J.log.length && J.log.every((f) => f.period) ? J.periods[0] : null;   // a film of one period clip is a LOOP
    last = { log: J.log, kind: one ? 'loop' : J.kind, label: J.label, w: J.size.w, h: J.size.h, fps: J.fps, frames: J.log.length, T: one ? one.s.L : J.sched.mode === 'loop' ? J.sched.L : 0 };
    if (J.card) job = null;   // the card's job is the recorder's run's: it ends here
  }
  const check = () => { if (!opts.grab && !gpuOk()) throw new Error('THE GRAPHICS DEVICE IS GONE: the FIELD is not up, so no frame can be read'); };

  /** THE WITNESSES.  A pin that is asserted and not verified is a hope. */
  function witnesses(J, wit, t, w, h) {
    const f = field(), pinned = J.pinned, fail = [];
    if (pinned('jitter') && wit.presents !== JITTER_SEED + 1) fail.push('jitter: presents read ' + wit.presents + ', not ' + (JITTER_SEED + 1) + ' — another frame presented during ours');
    if (pinned('fieldclock') && wit.generation !== 1) fail.push('fieldclock: the field generation advanced ' + wit.generation + ' times, not once');
    if (pinned('autoscale') && (wit.canvasW !== w || wit.canvasH !== h)) fail.push('autoscale: the canvas was ' + wit.canvasW + '×' + wit.canvasH + ' at readback, not ' + w + '×' + h);
    const res = f && f.ok ? f.resolution : J.base.resolution;
    if (pinned('governor') && res !== J.base.resolution) fail.push('governor: the field grid moved from ' + J.base.resolution + '³ to ' + res + '³ mid-film');
    const half = LW.domain ? LW.domain.half : J.base.half;
    if (half !== J.base.half) fail.push('domain: the half-width moved from ' + J.base.half + ' to ' + half + ' mid-film');
    if (LW.clock.t !== t) fail.push('clock: t read ' + LW.clock.t + ', not the scheduled ' + t);
    if (!J.host && pinned('modulation') && LW.mod && LW.mod.running) fail.push('modulation: the rack is running on wall time');
    return fail;
  }

  /**
   * THE FRAME — what the kit's recorder calls for frame i, at ctx.width × ctx.height.  When the kit steps the modulation (or the
   * arrangement) its clock has already stepped to ctx.frame and the host has applied every parameter.  THE TIME LAW (0.5.0 C7b)
   * says which physics time frame i is, in this order: inside a `lw-period` clip, ONE PERIOD's own schedule at ctx.frame − the
   * clip's first frame; else, when something can move RATE (a driven film, a clip on transport.rate), the previous frame's RATE
   * integrated once per output interval; else the RECORD law, the film's own schedule at i.  THE PHYSICS CLOCK IS SET
   * (clock.scrub — never LW.scrub, which schedules a rack frame: H9), THE OBSERVER CLOCKS ARE STEPPED by the frame index alone,
   * the jitter is pinned, the frame is read back and settled, and it is emitted only when its witnesses agree; a contended frame
   * is rendered again (the same t with the same seed is the same picture), and one that will not settle throws, which ends the
   * film through the kit's own failure road.
   */
  async function frame(i, ctx) {
    const J = job; if (!J) throw new Error('render-exact: no film is running');
    const f = field(), w = ctx.width, h = ctx.height, pinned = J.pinned, at = Number.isFinite(ctx.frame) ? ctx.frame : i;
    const pc = J.periods ? J.periods.find((p) => at >= p.k0 && at < p.k0 + p.s.N) : null;   // a loop closes only if nothing else moves
    let t = pc ? pc.s.at(at - pc.k0) : J.sched.at(i);
    /* frame zero is time zero, and a retry below never integrates twice */
    if (J.i0 === undefined) J.i0 = i;
    if (J.drive && !pc) { if (i > J.i0) J.driven += J.rate / J.fps; t = J.driven; }
    if (J.beforeFrame && !pc) J.beforeFrame({ k: i, t, dt: i ? 1 / J.fps : 0 });
    let shot = null, tries = 0;
    for (;;) {
      tries++;
      const wit = {};
      LW.clock.scrub(t);
      if (J.poseAt && !pc) Object.assign(LW.obs, J.poseAt(i, J.N, t) || {});
      if (pinned('jitter') && f && f.stats) f.stats.presents = JITTER_SEED;         // H1: the seed, pinned for THIS frame
      shot = opts.grab ? await opts.grab({ t, w, h, wit, k: i, seed: JITTER_SEED, pinned })
        : await readback(f, canvas, w, h, () => f.frame({ modes: LW.modesAt(t), obs: LW.obs, mat: LW.mat }), wit);   // H8: modesAt inline, nothing between
      const fail = witnesses(J, wit, t, w, h);
      if (!fail.length) break;
      J.contended++;
      if (tries > J.retries) {
        J.aborted = { k: i, t, why: fail, tries };
        throw new Error('ABORTED at frame ' + i + ' of ' + J.N + ' after ' + tries + ' attempts — ' + fail.join(' · ') + '. The frames before it are exact; nothing here emits a frame it cannot vouch for.');
      }
    }
    J.rate = LW.clock.rate;
    if (J.caption) captionOver(shot.rgba, w, h, J.caption);
    J.log.push({ k: i, t, off: pc ? pc.s.off(at - pc.k0) : J.drive ? t : J.sched.off(i), digest: digest(shot.rgba), retries: tries - 1, ...(pc ? { period: true } : {}) });
    return { rgba: shot.rgba, width: w, height: h };
  }

  /* ── THE CARD'S ROAD (0.5.0 C7b) ─────────────────────────────────────────────────────────────────────────────────────────
   * The kit's RENDER card calls the recorder's run() itself, so there is no film in hand when it starts.  describe() is called
   * inside the tap (nothing is awaited before it for a kit motion) and records the lab as it stands; before(spec) builds the job
   * from the kit's spec under THE TIME LAW (frame(), above); after() releases it, and `last` keeps its frame log.  A RESUME after
   * a reload rebuilds the same job from the spec the store kept: `app.pending` for a card's film, `app.film` for the facade's. */
  function describe() {
    const J = job;
    if (!J) { const r = road.pending ? road.pending() : {};
      return { token: 'lw-' + (++token) + '-' + Math.round(now()), pending: { t0: LW.clock.t, rate: LW.clock.rate, label: stateLabel(),
        observable: LW.mat ? VIEW_NAMES[LW.mat.view | 0] : 'density', caption: r.caption || '', spin: r.spin || 0, yaw0: r.yaw0 || 0 } }; }
    return { token: J.token, film: manifest({ schedule: J.sched, picture: { w: J.size.w, h: J.size.h, sizeFromMachine: !!J.size.sizeFromMachine, format: J.format, jitterSeed: JITTER_SEED },
      state: { label: J.label, observable: J.observable, version: LW.version || null } }) };
  }
  /** the arrangement's clips, read at the take (TIMELINE ON): the `lw-period` clips as frame ranges with ONE PERIOD's own
   *  schedule, and whether a clip moves RATE or the yaw */
  function arrangement(fps) {
    const ed = card && card.editor && card.editor(), host = opts.host ? opts.host() : null;
    if (!ed || !ed.model || !host) return { periods: null, on: () => false };
    const doc = ed.model.state(), spb = 60 / host.model.transport.bpm, curve = (c) => doc.curves.find((x) => x.id === c.curveId) || {};
    const live = doc.clips.filter((c) => !c.mute), periods = [];
    for (const c of live) { const v = curve(c); if (v.kind !== 'lw-period') continue;
      periods.push({ k0: Math.round(c.start * spb * fps), s: exactSchedule({ mode: 'loop', T: v.T, t0: v.t0, fps, frames: Math.max(1, Math.round(c.duration * spb * fps)) }) }); }
    return { periods: periods.length ? periods : null, on: (id) => live.some((c) => curve(c).targetId === id) };
  }
  function jobFrom(spec) {
    const A = spec.app || {}, p = A.pending || {}, s = A.film && A.film.schedule, N = spec.frames, fps = spec.fps;
    const sched = s ? exactSchedule({ mode: s.mode, t0: s.t0, [s.mode === 'span' ? 'span' : 'T']: s.L, fps, frames: s.N })   // the facade's own film
      : exactSchedule({ mode: 'loop', T: (N / fps) * (p.rate || LW.clock.rate), t0: Number.isFinite(p.t0) ? p.t0 : LW.clock.t, fps, frames: N });   // THE RECORD LAW
    const tl = spec.timeline ? arrangement(fps) : { periods: null, on: () => false };
    return { token: A.token || 'lw-' + (++token) + '-' + Math.round(now()), sched, N, fps, pinned: () => true, host: true, card: true,
      drive: !!spec.modulation || tl.on('transport.rate'), format: spec.format, size: { w: spec.width, h: spec.height }, kind: s && s.mode === 'span' ? 'frames' : 'clip',
      label: p.label || stateLabel(), observable: p.observable || null, caption: p.caption || '', periods: tl.periods,
      poseAt: p.spin && !tl.on('observer.yaw') ? (k) => ({ yaw: p.yaw0 + p.spin * (k / fps) }) : null,   // R4: AUTO-ROTATE rides as the pose path unless a yaw clip is in the take
      beforeFrame: road.step ? ({ dt }) => road.step(dt) : null, retries: DEFAULTS.retries, log: [], contended: 0, aborted: null,
      driven: sched.at(0), rate: 0, prev: null, base: null, drained: null,
      pins: { jitter: 'presents pinned to ' + JITTER_SEED + ' before every frame', fieldclock: 'bypassed: field.frame is called directly with modes every frame', camera: 'still' } };
  }
  function recorderFor(drive) {
    const key = drive ? 'drive' : 'freeze';
    if (recs[key]) return recs[key];
    const host = drive ? (opts.host ? opts.host() : null) : null, f = field(), C = drive ? card || {} : {};
    if (drive && !host) throw new Error('there is no modulation host to drive');
    return (recs[key] = createRecorder({
      host, frame, before, after, check, describe, app: 'lambdawaves', dir: 'lambdawaves-recordings',
      editor: C.editor ? { get model() { const e = C.editor(); return e && e.model; }, range: () => { const e = C.editor(); return e ? e.range() : null; },
        activeRange: () => { const e = C.editor(); return e ? e.activeRange() : null; } } : undefined,
      signature: C.signature, selfTestStages: C.selfTestStages,
      storage: opts.storage, calib: C.calib || opts.calib, wake: opts.wake, guard: opts.guard, hidden: opts.hidden, pauseWhileHidden: opts.pauseWhileHidden,
      colorSpace: f && f.ok && f.gamut && f.gamut !== 'srgb' ? 'display-p3' : undefined,
      currentSize: () => ({ w: canvas ? canvas.width : 16, h: canvas ? canvas.height : 16 }),
    }));
  }
  /** recorder({ editor: () => tl.editor, signature, selfTestStages, calib }) → the card's recorder: the host recorder, handed the
   *  timeline's editor (TIMELINE · ACTIVE / SELECTION) and the state signature a RESUME is refused without */
  function recorder(o) {
    if (o) { card = o; if (recs.drive && !recs.drive.running()) { recs.drive.destroy(); delete recs.drive; } }
    return recorderFor(true);
  }
  const busy = () => !!job || Object.values(recs).some((r) => r.running());
  /** a kit file name as λWAVES names a film (state, size, fps, frames, T: R10) */
  function nameFor(name) {
    const L = last; if (!L || !name) return name;
    const ext = (/\.(\w+)$/.exec(name) || [])[1] || 'mp4', part = (/-(\d{3})\.zip$/.exec(name) || [])[1];
    const base = uniqueName(captureName({ kind: L.kind, label: L.label, w: L.w, h: L.h, fps: L.fps, frames: L.frames, T: L.T, ext }), taken);
    return /recovered/.test(name) ? base.replace('.' + ext, '-recovered.' + ext) : part && part !== '001' ? base.replace(/\.zip$/, '-part' + part + '.zip') : base;
  }
  /** a film's own copy in the kit's store, removed — a verify's runs, or a failed film's leftovers (the card lists the rest) */
  async function discard(r) {
    const rec = Object.values(recs)[0];                    // both recorders keep one directory
    if (!rec || !r) return;
    try {
      if (r.kit) { await rec.discard(r.kit); return; }
      for (const j of await rec.recoveries()) if (j.spec && j.spec.app && j.spec.app.token === r.token) await j.store.discard();
    } catch (_) { /* nothing on disk, or already gone */ }
  }
  function progressOf(p, wall0, size) {
    const total = p.frames || 0, done = Math.min(total, p.frame || 0), el = now() - wall0, per = done > 0 ? el / done : 0;
    return { phase: p.phase, done, total, fraction: total ? done / total : 0, elapsedMs: el, msPerFrame: per, etaMs: per * (total - done), size,
      human: done + ' / ' + total + ' · ' + p.phase + ' · ' + fmtMs(el) + (done >= 3 && done < total ? ' · ' + fmtMs(per * (total - done)) + ' left' : '') };
  }

  /**
   * render(o) → { stop(), stopped, done }.  `done` resolves with the files the kit wrote, λWAVES' frame log (every scheduled t
   * and every digest), the pins and the honest report.  stop() is the kit's cancel.
   */
  function render(o = {}) {
    let stopped = false, rec = null;
    const done = (async () => {
      const P = o.schedule ? { ok: true, schedule: o.schedule, N: o.schedule.N, kind: o.kind || 'given', message: '' } : plan(o);
      if (!P.ok) return { ok: false, refused: true, plan: P, error: P.message };
      if (!gpuOk() && !opts.grab) return { ok: false, error: 'no WebGPU device: the FIELD is not up' };
      const sched = P.schedule, N = sched.N, fps = sched.fps;
      if (!FILM_FPS.includes(fps)) return { ok: false, refused: true, plan: P, error: 'A film runs at ' + FILM_FPS.join(', ') + ' fps (the kit\'s recorder); ' + fps + ' is not one of them.' };
      if (busy()) return { ok: false, refused: true, plan: P, error: 'Another render is already running: wait for it, or CANCEL it in RENDER.' };
      const unpin = new Set(o.unpin || []), pinned = (id) => !unpin.has(id);
      const camMode = o.camera || DEFAULTS.camera, drive = o.modulation === 'drive', format = o.format === 'mp4' ? 'mp4' : 'png';
      if (LW.camera && LW.camera.moving && pinned('camera') && camMode === 'refuse') {
        return { ok: false, refused: true, hazard: 'camera', error: 'THE CAMERA IS MOVING. Its pose is an integrator on the wall clock — ' + (LW.camera.autoRotate ? 'AUTO-ROTATE holds a fling' : 'a fling is still coasting') + ' — so this film would depend on how fast the machine ran. Bring it to rest, pass camera: "still" to have the film do it, or hand a poseAt(k, N) for a camera move that is a function of the frame index and therefore exact.' };
      }
      const size = P.size || sizeFor(o);
      const J = job = { token: 'lw-' + (++token) + '-' + Math.round(now()), sched, N, fps, pinned, drive, host: drive, format, size, kind: o.kind || P.kind || sched.mode,
        label: o.label || stateLabel(), observable: P.observable || null, caption: o.caption || '', poseAt: o.poseAt || null, beforeFrame: o.beforeFrame || null,
        retries: o.retries === undefined ? DEFAULTS.retries : o.retries, log: [], contended: 0, aborted: null, driven: sched.at(0), rate: 0, prev: null, base: null, drained: null,
        pins: { jitter: pinned('jitter') ? 'presents pinned to ' + JITTER_SEED + ' before every frame' : 'NOT PINNED (unpin)', fieldclock: 'bypassed: field.frame is called directly with modes every frame' } };
      const wall0 = now();
      let result = null, err = null;
      try {
        rec = recorderFor(drive);
        /* STILL with λWAVES' own schedule (C7b: the motions left — the timeline is the span, and frame() reads the schedule) */
        const run = rec.run({ motion: 'still', fps, durationS: N / fps, format, size: { w: size.w, h: size.h }, modulation: drive, timeline: false,
          onProgress: (p) => { if (o.onProgress) o.onProgress(progressOf(p, wall0, size)); } });
        if (stopped) rec.cancel();
        result = await run;
      } catch (e) { err = e; }
      finally { if (job === J) job = null; }
      const delivered = J.log.length, elapsed = now() - wall0, aborted = J.aborted;
      const cancelled = !aborted && (stopped || !!(err && /cancel/i.test(String(err.message || err))));
      if (!result && opts.discardFailed !== false) await discard({ token: J.token });
      const files = result ? result.files : [], bytes = files.reduce((n, x) => n + (x.bytes || 0), 0);
      const ext = format === 'mp4' ? 'mp4' : 'zip';
      const name = files.length ? uniqueName(captureName({ kind: J.kind, label: J.label, w: size.w, h: size.h, fps, frames: delivered, T: sched.mode === 'loop' ? sched.L : 0, ext }), taken) : null;
      const man = manifest({ stamp: stamp(new Date()), schedule: sched,
        picture: { w: size.w, h: size.h, sizeFromMachine: !!size.sizeFromMachine, clipped: !!size.clipped, format: J.base ? J.base.format : null, gamut: J.base ? J.base.gamut : null, resolution: J.base ? J.base.resolution : null, half: J.base ? J.base.half : null, container: format === 'mp4' ? 'mp4 (the kit\'s WebCodecs encoder and muxer)' : 'png frames in the kit\'s stored ZIP parts', jitterSeed: JITTER_SEED },
        state: { label: J.label, observable: J.observable, digest: (LW.stateDigest ? (() => { try { return LW.stateDigest(); } catch (_) { return null; } })() : null), version: LW.version || null },
        pins: J.pins, witnesses: { contended: J.contended, aborted: aborted ? aborted.why : null, drained: J.drained }, frames: J.log,
        ffmpeg: format === 'png' ? 'ffmpeg -framerate ' + fps + ' -i frame_%06d.png -c:v libx264 -pix_fmt yuv420p -crf 18 ' + slug(J.label) + '.mp4' : null });
      if (drive) man.modulationClock = { origin: 0, stepSeconds: 1 / fps, clock: 'the kit\'s record clock (render/clock.js), from the first Space', physics: 'the previous frame\'s RATE integrated once per output interval; the frame log carries the physics times; no loop closure asserted' };
      const ok = !!result && !aborted && delivered === N;
      if (ok && delivered > 1) lastMs = elapsed / delivered;
      return {
        ok, partial: !!(cancelled && delivered > 0), error: ok || cancelled || aborted ? null : String((err && err.message) || err || 'the film did not complete'), aborted, stopped: cancelled, refused: false,
        frames: delivered, requested: N, w: size.w, h: size.h, fps, mode: sched.mode, format, schedule: sched, plan: P,
        files, blob: files.length ? files[0].blob : null, name, bytes, manifest: man, pins: J.pins, contended: J.contended, token: J.token, kit: result,
        report: { elapsedMs: elapsed, msPerFrame: delivered ? elapsed / delivered : 0, human: fmtMs(elapsed) + ' for ' + delivered + ' frames · ' + fmtBytes(bytes),
          note: 'the elapsed time is a REPORT of how long this machine took. It was never an input to a picture: every frame was rendered at a scheduled logical time, and the same schedule on a machine half this speed gives the same pixels.' },
        message: aborted ? 'ABORTED at frame ' + aborted.k + ' of ' + N + ' after ' + aborted.tries + ' attempts — ' + aborted.why.join(' · ') + '.'
          : cancelled ? 'STOPPED at ' + delivered + ' of ' + N + ' frames. A film is a whole schedule: run it again with the same options for the same pictures.'
            : !ok ? 'FAILED after ' + delivered + ' frames: ' + String((err && err.message) || err)
              : delivered + ' frames · ' + size.w + '×' + size.h + ' · ' + sched.mode.toUpperCase() + ' · ' + (format === 'mp4' ? 'MP4' : 'PNG frames') + ' · ' + fmtBytes(bytes) + ' · rendered in ' + fmtMs(elapsed) + '. Exact: frame k is t0 + off(k), whatever the machine\'s speed.',
      };
    })();
    return { stop() { stopped = true; if (rec) rec.cancel(); }, get stopped() { return stopped; }, done };
  }

  /**
   * take('clip' | 'period' | 'frames', o) → render()'s { stop(), stopped, done } — THE THREE SCHEDULES the rack's RECORD, ONE PERIOD
   * and EXPORT FRAMES made (moved here unchanged in 0.5.0 C7b; `__LW.captureUI`'s facade runs them with no UI):
   *   clip    RECORD: a CLIP of the clock as it runs, [t0, t0 + seconds·rate) in N frames, the next take's first dropped as a loop's
   *           is; AUTO-ROTATE rides as a pose path, yaw by the frame index (the one camera move a film renders exactly)
   *   period  ONE PERIOD: the plan's own times, bit for bit, the camera still and the modulation frozen (a loop closes only if
   *           nothing else moves); a refused or STATIONARY plan is said and nothing runs
   *   frames  EXPORT FRAMES: PNG frames, at least 30 s; a SPAN of the lab's time when anything drives it, or the loop will not do
   * o: { fps, seconds, scale, drive, plan?, onProgress, options? (frames: a caller's own settings, over the others) }
   */
  function take(kind, o = {}) {
    const fps = +o.fps || 30, lab = road.pending ? road.pending() : {}, step = ({ dt }) => (road.step ? road.step(dt) : false);
    const refuse = (r) => ({ stop() {}, stopped: false, done: Promise.resolve(Object.assign({ ok: false, refused: true }, r)) });
    if (kind === 'clip') {
      const N = Math.max(1, Math.round(fps * o.seconds));
      const sched = exactSchedule({ mode: 'loop', T: (N / fps) * LW.clock.rate, t0: LW.clock.t, fps, frames: N });
      const spin = lab.spin || 0, yaw0 = lab.yaw0 || 0;
      return render({ schedule: sched, kind: 'clip', format: 'mp4', camera: 'still', caption: lab.caption || '', modulation: o.drive ? 'drive' : 'freeze',
        beforeFrame: step, poseAt: spin ? (k) => ({ yaw: yaw0 + spin * (k / fps) }) : null, onProgress: o.onProgress });
    }
    if (kind === 'period') {
      const P = o.plan || (road.plan ? road.plan({ fps, seconds: o.seconds }) : null);
      if (!P || !P.ok) return refuse({ plan: P, message: P ? P.message : 'no plan' });                 // the refusal IS the answer
      if (P.kind === 'stationary') return refuse({ plan: P, stationary: true, message: P.message });
      const sched = exactSchedule({ mode: 'loop', T: P.T, t0: P.schedule.t0, fps: P.fps, frames: P.N });
      return render({ schedule: sched, kind: P.kind === 'exact' ? 'loop' : 'near', format: 'mp4', camera: 'still', caption: lab.caption || '', onProgress: o.onProgress });
    }
    const seconds = Math.max(30, o.seconds), driven = !!o.drive;
    const settings = { fps, seconds, t0: 0, scale: o.scale, camera: 'still', modulation: driven ? 'drive' : 'freeze', format: 'png', kind: 'frames', ...(o.options || {}) };
    let P = plan(settings);
    if (driven || (road.rotating && road.rotating()) || !P.ok || P.N < seconds * settings.fps) {
      settings.mode = 'span'; settings.span = seconds * Math.max(.1, LW.clock.rate);
      P = plan(settings);
    }
    if (!P.ok) return refuse({ plan: P, message: P.message });
    return render({ ...settings, beforeFrame: step, onProgress: o.onProgress });
  }

  /** RENDER THE SAME SHORT SCHEDULE TWICE AND COMPARE THE DIGESTS: the determinism claim, checked in the browser in about a
   *  second, at a size nobody has to wait for.  A mismatch names the frame and hands back both digests. */
  async function verify(o = {}) {
    const frames = o.frames || 6, width = o.width || 160;
    const P = plan(Object.assign({ frames, width }, o));
    if (!P.ok) return { ok: false, refused: true, plan: P, error: P.message };
    const run = async () => { const r = await render(Object.assign({ format: 'png' }, o, { schedule: P.schedule, width })).done; if (r.ok) await discard(r); return r; };
    const a = await run(), b = await run();
    if (!a.ok || !b.ok) return { ok: false, error: a.error || b.error || a.message || b.message || 'a run did not complete', a, b };
    const da = a.manifest.frames.map((x) => x.digest), db = b.manifest.frames.map((x) => x.digest), bad = [];
    for (let i = 0; i < Math.max(da.length, db.length); i++) if (da[i] !== db[i]) bad.push({ k: i, a: da[i], b: db[i] });
    return { ok: bad.length === 0 && da.length === frames, frames: da.length, digests: da, mismatches: bad,
      message: bad.length === 0 ? 'DETERMINISTIC: ' + da.length + ' frames rendered twice through the kit\'s recorder, every digest identical.'
        : bad.length + ' of ' + da.length + ' frames differ between two runs of the SAME schedule — ' + JSON.stringify(bad.slice(0, 4)) + '. Something in the picture\'s input closure is not pinned; read hazards() and the witnesses in the manifest.' };
  }

  /** the hand-over: every file of a finished film, under λWAVES' name (capture.js' handOver: the render spent the tap, so a
   *  download).  The store's copy stays (0.5.0 C7b): the RENDER card's DISCARD RENDER and DISCARD STORED RENDER are its discard, so
   *  a hand-over's URL never outlives its file (C7-VERIFY N1) and no timer is set */
  function save(r) {
    if (!r || !r.files || !r.files.length) return false;
    r.files.forEach((x, i) => handOver(x.blob, r.files.length === 1 ? r.name : r.name.replace(/\.zip$/, '') + '-part' + String(i + 1).padStart(3, '0') + '.zip'));
    return true;
  }

  return { plan, render, take, verify, hazards, save, discard, limits, sizeFor, frame, recorder, nameFor, get names() { return taken; }, canvas,
    get running() { return busy(); }, get last() { return last; },
    laws: { exactSchedule, endpointLaw, arithmeticLaw, planExact, foldOrigin, estimate, digest, manifest, offsetOf, ulpsBetween, HAZARDS } };
}
