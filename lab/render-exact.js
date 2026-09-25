/* render-exact.js — THE DETERMINISTIC RENDERER.  Stage two of the capture work.
 *
 * capture.js records REAL TIME: every frame's content is exact, and the TEMPO is the wall clock's — measured,
 * reported, never claimed.  This file makes the opposite trade.  Every frame is rendered at a scheduled logical
 * time, one at a time, as slowly as the machine needs, and nothing about the machine reaches the picture.  Slow
 * is fine.  Wrong is not.
 *
 * ── WHY THIS IS EVEN POSSIBLE HERE ───────────────────────────────────────────────────────────────────────────
 * The register's clock is ANALYTIC.  c(t) = e^{−iEt}c(0) — `state.js`' `at(t)` evaluates any t directly, with no
 * integration, no accumulation and no history, and `reg.at(t)` twice at the same t is bit-identical.  So the
 * physics is not the problem.  A deterministic render here is a SCHEDULING problem, and the scheduling problem
 * is entirely about the OTHER clocks.
 *
 * ── THE THREE CLOCKS, AND ONLY ONE OF THEM IS ANALYTIC ───────────────────────────────────────────────────────
 * This is the whole design, and everything below is a consequence of it.
 *
 *   1  THE PHYSICS CLOCK (clock.js).  Analytic.  ψ is a closed form of t.  A frame at t needs NO frame before it.
 *      → the renderer SETS it: `clock.scrub(at(k))`.  Order-free, restartable, seekable.
 *
 *   2  THE CAMERA CLOCK (rack.js, `cameraStep`).  An INTEGRATOR: ω decays as e^{−μ dt} and the pose accumulates
 *      ∫ω dt, stepped with a WALL interval every frame, plus an AMBIENT drift of `camera.speed` rad per wall
 *      second while AUTO-ROTATE is on.  A coasting or drifting camera makes the pose a function of how fast the
 *      machine ran.  There is no pose(t) to evaluate.
 *      → the renderer REFUSES to render a moving camera, and offers a POSE PATH instead: `poseAt(k, N)` is a pure
 *        function of the frame index, which is what a rendered camera move should have been all along.
 *
 *   3  THE MODULATION CLOCK (mir/host.js, driven from the rack loop with `advanceTo(performance.now()/1000)`).
 *      Also an integrator, and irreducibly so: even under WALL sync, where the beat is derived from the absolute
 *      stamp, every source carries a one-pole SMOOTH filter (`cont += (raw − cont)(1 − e^{−dt/τ})`) and every
 *      envelope carries `t += dt`.  There is no modulated(t) to evaluate either.
 *      → the renderer either FREEZES it (`LW.mod.stop()`, every target back to its base) or DRIVES it from the
 *        schedule with `LW.mod.step(1/fps)` — mir's own deterministic door, whose docstring says exactly why it
 *        exists: "the same sequence of step() calls from the same rack gives bit-identical results, which is what
 *        an export and a proof both need."  A NOMINAL second — 1/fps of it per frame — is the only "second" in
 *        this file, and it is defined by the OUTPUT frame rate, never measured.
 *
 * THE LAW: the physics clock is SET, the observer clocks are STEPPED, and every one of them is a function of the
 * frame index k alone.  `performance.now()` appears in this file only inside the progress report, and the report
 * is never an input to a picture.
 *
 * ── THE PICTURE'S INPUT CLOSURE ──────────────────────────────────────────────────────────────────────────────
 * Read against rack.js' loop and field.js' `frame`, the rendered pixels are a function of exactly this list and
 * nothing else — which is what makes the pinning finite rather than hopeful:
 *
 *     picture = F( modesAt(t), obs, mat, domain.half, field.resolution, canvas.width, canvas.height,
 *                  field.stats.presents mod 97, field.format, the canvas' gamut )
 *
 * and `modesAt(t)` is a pure function of t — `reg.at`, `molecule.fieldModes(t)`, `gas.fieldModes(t)` all are,
 * and `helium.fieldModes()` is t-independent (while its worker solves a new basis it serves the LAST one, so the
 * preflight demands `helium.sol` first: the render always marches the basis in force) — with ONE exception, H₂,
 * which is hazard H7 below.  Everything
 * else in the lab (the meters, the spectrum, the shadow, the dipole, the Wigner slice) is outside the closure
 * and cannot reach the frame.
 *
 * ── THE SCHEDULE, AND THE TWO ENDPOINT RULES ─────────────────────────────────────────────────────────────────
 * There are two jobs and they have DIFFERENT right answers, which is why this file does not simply re-export
 * capture.js' `loopSchedule`.
 *
 *   A LOOP is a CIRCLE.  t0 and t0+T are the same point of it.  N frames at t0 + (k/N)·T, k = 0 … N−1; the frame
 *   at t0+T is DROPPED because it IS frame 0.  Every gap in the cycle — the wrap from the last frame back to the
 *   first included — is T/N.  Keeping it holds one image for two frame times at the join.  ENDPOINT EXCLUSIVE.
 *
 *   A SPAN is a SEGMENT.  t0 and t1 are two different points and f(t1) ≠ f(t0).  N frames at t0 + (k/(N−1))·L,
 *   k = 0 … N−1; the last frame IS t1, exactly.  There is no duplicate to avoid, and dropping the endpoint would
 *   silently render [t0, t1 − L/(N−1)] and never show the state the caller asked to end on.  ENDPOINT INCLUSIVE.
 *
 *   THE TEMPO ARITHMETIC DIFFERS TOO, and `exactSchedule` reports the right one for each: a loop of N frames at
 *   fps covers T in N/fps wall seconds (the wrap gap is a real gap); a span covers L in (N−1)/fps, because the
 *   last frame is an endpoint and not a gap, while the CLIP is still N/fps long.
 *
 * ── THE ARITHMETIC, MEASURED HERE AND NOT INHERITED ──────────────────────────────────────────────────────────
 * The offset is written off(k) = (k/D)·L and never k·(L/D).  capture.js says so; this file re-measured it, and
 * the conclusion holds while the evidence quoted for it does not:
 *
 *   · (k/D)·L CLOSES ALWAYS, and it is a THEOREM, not a measurement: IEEE-754 division of a finite non-zero D
 *     by itself is exactly 1.0, and 1.0·L is exactly L.  4001 of 4001 random (L, D) — necessarily.
 *   · k·(L/D) closes in 3622 of the same 4001: it fails about one time in ten.  A concrete counterexample is
 *     L = 212.46659503691100, D = 361, where D·(L/D) − L = −2.84e−14.
 *   · THE CASE capture.js' HEADER CITES DOES NOT REPRODUCE.  At T = 45238.93 and N = 601 both forms land on T to
 *     the last bit, and so does the 1s+2s period at N = 30, 120, 180, 181, 601 and 900.  The form that really
 *     drifts at those numbers is the TRUE accumulator, `t += dt` N times, which misses by 1.1e−14 to 1.3e−13 at
 *     every N tried.  The choice is right; the anecdote was not.  `arithmeticLaw()` runs it rather than says it.
 *   · IN THE MIDDLE the two forms are a wash (4424 wins to 4195 over 28007 comparisons against exact rational
 *     arithmetic, the rest ties).  The endpoint is the entire argument for the choice.
 *
 *   AND THE OFFSET IS NOT THE TIME.  t = t0 + off(k) is ONE MORE ROUNDING, and at a deep t0 it is the binding
 *   one: at t0 = 45238.93 with the 1s+2s period over 180 frames the gaps stop being uniform at 4.1e−12 a.u.
 *   (4.4e−11 of a gap), because ulp(t) has grown past T/N's own precision.  `exactSchedule` MEASURES that and
 *   reports `worstGapRel`; and where the period is exact it offers the fix — FOLD THE ORIGIN, t0 ↦ t0 mod T,
 *   which is the same point of the circle and restores the gaps to 1 ulp.  Folding is safe for every view only
 *   at T_ψ: ψ(t+T_ψ) = ψ(t) exactly, while at T_ρ only the DENSITY returns and arg ψ has turned.  `planExact`
 *   knows which period it is looping to and folds only when it may.
 *
 * ── EVERY SOURCE OF NON-DETERMINISM FOUND, AND ITS PIN ───────────────────────────────────────────────────────
 * `HAZARDS` below is this list as data — each with the pin the driver applies and, where one exists, the WITNESS
 * that checks the pin held rather than trusting it.  A frame is emitted only when its witnesses agree; a frame
 * whose witnesses disagree is re-rendered, and a frame that cannot be made to agree ABORTS the run by name.
 * That is what "no dropped or duplicated frame" means operationally.
 *
 *   H1  THE RAY-MARCH JITTER.  field.js seeds the march's start offset with (stats.presents % 97)/97 into
 *       V.p0.w, and the GRAIN draw style reads THE SAME WORD a second time to offset which voxels it keeps
 *       (field.js' shader, `floor(uvw*96 + V.p0.w*7)`), so under GRAIN the dependence is not a sub-voxel dither
 *       but a visibly different set of particles.  PIN: set stats.presents to a fixed seed immediately before
 *       every frame.  WITNESS: after the frame it must read seed+1 — exactly one present happened and it was
 *       ours.  (capture.js found this one; the GRAIN consumer is new here.)
 *   H2  THE GOVERNOR.  rack.js judges the median of the last 60 presented frame intervals against a 28 ms budget
 *       and STEPS THE FIELD GRID DOWN THE LADDER (128 → 96 → 64) when the machine is slow.  This is the headline
 *       machine-speed dependence in the lab: a slow machine renders a coarser volume.  PIN: the physics clock is
 *       paused for the whole render and the governor only acts while playing — pausing actively resets its drop —
 *       and `governor.on = false` besides.  WITNESS: field.resolution is read before frame 0 and re-read after
 *       every frame; if it ever moves the run aborts.
 *   H3  AUTO SCALE.  quality.autoScale is moved by a wall-clock EMA every 24 frames and multiplies the canvas
 *       size the rack asks field.resize for.  PIN: quality.auto = false for the run, restored after.  WITNESS:
 *       canvas.width/height are re-read before every readback.
 *   H4  THE FIELD CLOCK.  The rack only reconstructs ψ on an EVOLVE tier when `nowMs − lastReconMs ≥ capMs`, so
 *       a capped field clock renders the same picture twice.  PIN: this renderer never goes through the tier
 *       router — it calls field.frame with a non-null `modes` every frame, so the compute pass is unconditional.
 *       WITNESS: field.stats.generation must advance by exactly one per frame.
 *   H5  THE CAMERA CLOCK.  See above.  PIN: refuse `camera.moving`; optionally still it (dy = dp = 0, autoRotate
 *       off) and restore.  A camera move must come from `poseAt(k, N)`.  WITNESS: obs is re-read every frame and
 *       must equal what the schedule wrote.
 *   H6  THE MODULATION CLOCK.  See above.  PIN: 'freeze' (stop it, every target to base) or 'drive' (step it by
 *       1/fps per frame).  Never left running on wall time.  WITNESS: LW.mod.running must be false throughout.
 *   H7  H₂ IS THE ONE IMPURE FIELD SOURCE.  `h2.fieldModes()` takes no t: it reads the CURRENT R, which
 *       `h2.update(t)` sets by looking t up in a PRE-COMPUTED collision trajectory (so it is a pure function of
 *       t — but only once update has been called).  In the rack loop that call sits AFTER the frame and inside
 *       the `cpuTick` cadence, so the free-running lab's H₂ field is one frame stale and, in 120 Hz perf mode,
 *       four.  PIN: the driver calls `h2.update(t)` itself, immediately before modesAt, whenever H₂ is on.
 *   H8  THE MODE LIST IS A REUSED BUFFER.  `LW.modesAt(t)` returns a module-level array of module-level records
 *       rewritten in place (rack.js wave 45).  Anything that calls modesAt between our call and field.frame's
 *       consumption silently rewrites our modes.  PIN: modesAt is evaluated INLINE in the frame call, with
 *       nothing between, exactly as capture.js' grab does.
 *   H9  AN INTERLOPING RACK FRAME.  Any `schedule()` from anywhere arms a rAF that will resize the canvas,
 *       present with the unpinned seed and advance the modulation on wall time.  PIN: the driver never calls
 *       LW.schedule during a run, and preflight drains the loop and reads `stats.scheduled` back.  WITNESS: H1's
 *       presents counter catches an interloper that lands mid-frame, and the frame is re-rendered.
 *  H10  DEVICE PIXEL RATIO.  field.resize multiplies by window.devicePixelRatio, so a render sized by `scale`
 *       inherits the machine's DPR and a "2x" render is a different number of pixels on a phone.  PIN: an exact
 *       render should be given an explicit width/height; when it is given `scale` instead the resolved size is
 *       recorded in the manifest and flagged `sizeFromMachine: true`.
 *  H11  PATH-DEPENDENT OVERLAYS.  particles.js integrates an RK4 trajectory from its own `lastT` to t (and
 *       silently teleports rather than integrate when |dt| > 4, which every loop's wrap gap is), and the rack
 *       calls it at rAF cadence gated on the perf mode.  It paints the #particles 2-D layer, not the WebGPU
 *       canvas, so it only reaches the output through `overlays`.  PIN: overlays are OFF by default, and a
 *       path-dependent layer must be named explicitly and comes back labelled `pathDependent`.
 *  H12  THE PNG'S DEFLATE IS THE BROWSER'S.  capture.js' encodePNG reaches for CompressionStream('deflate'),
 *       whose exact output is unspecified and does change between browser builds.  THE PIXELS ARE EXACT AND THE
 *       CONTAINER IS NOT, so this file separates them: the per-frame `digest` is over the FILTERED SCANLINES —
 *       our own pure code, an injective function of the pixels — and it is the thing that is bit-identical
 *       across machines.  `deflate: 'stored'` makes the FILE bytes reproducible too, at roughly 3x the size
 *       (the measured 8192² frame goes from 1.95 MB to about 6 MB), and the manifest always says which was used.
 *  H13  THE GAMUT.  field.js configures the context `display-p3` on a wide-gamut screen; the same shader output
 *       then means different colour.  The PNG carries no ICC profile, so a P3 render read as sRGB is shifted.
 *       PIN: the gamut and the swapchain format are recorded in the manifest, and a cross-machine byte
 *       comparison is only meaningful between renders that agree on both.
 *
 * ── WHAT IT EMITS, AND WHY ───────────────────────────────────────────────────────────────────────────────────
 * A PNG SEQUENCE plus a JSON MANIFEST, optionally wrapped in one STORED zip so a 600-frame render is one
 * download and not six hundred.  The reasons, in order:
 *   · PNG is lossless, so "the same render twice" is a comparison and not an opinion.
 *   · A sequence has NO TIMING IN IT AT ALL.  The tempo is the `-framerate` you hand ffmpeg, and nothing in a
 *     browser can smear it.  Every other road out of a canvas carries wall-clock timestamps.
 *   · The manifest carries every scheduled t, every frame's digest, the schedule's own proof, the pin readings
 *     and the witnesses, so a render is AUDITABLE without keeping a gigabyte of pixels: two runs are compared by
 *     diffing two small JSON files.
 * IT DOES NOT MUX, deliberately.  MediaRecorder timestamps frames from the wall clock — the exact defect this
 * file exists to remove — and no browser video encoder guarantees byte-identical output for identical input
 * (rate control sees the encoder's queue depth, which is a machine-speed reading).  WebCodecs would let the
 * TIMESTAMPS be exact and still not the BYTES.  A muxer that is deterministic in timestamps and not in bytes
 * would be a worse lie than none, so the honest primitive is the sequence and the exact ffmpeg line, which the
 * result carries.
 *
 * ── THE COST, WHICH NOBODY SHOULD START A RENDER WITHOUT ─────────────────────────────────────────────────────
 * From capture.js' own measurements (headless Firefox, RTX 3070, 96³ grid, 2026-09-05), render + readback + PNG
 * is very nearly linear in megapixels — 131 ms per Mpx over a 181 ms floor across a 73x range — so:
 *
 *      600 frames at 8192²   1 h 30 min   1.09 GB        600 frames at 1080p    4.1 min    67 MB
 *      600 frames at 4096²      24 min    324 MB         180 frames at 2160p    3.6 min    57 MB
 *      (9.0 s a frame)                                   (406 ms and 1.2 s a frame)
 *
 * `estimate()` returns that table's reading before a run starts, and the run REPLACES it with the median of its
 * own first frames as soon as it has three, because the table is one machine on one day.
 *
 * ── WHAT A LATER RACK WAVE CALLS ─────────────────────────────────────────────────────────────────────────────
 *   import { createExactRenderer } from './render-exact.js';
 *   const ex = createExactRenderer(LW, { canvas: dom.canvas, energies: () => hostEnergies() });
 *
 *   const plan = ex.plan({ fps: 30, seconds: 6, width: 1920 });   // BEFORE the button commits to anything
 *   if (!plan.ok) show(plan.message);                             // no exact period: say so, do not loop it
 *   show(plan.cost.human);                                        // "600 frames · 8192² · ~1 h 30 m · ~1.2 GB"
 *   show(plan.warnings);                                          // a moving camera, a running modulation, …
 *
 *   const run = ex.render({ ...plan.opts, zip: true, onProgress: (p) => bar(p.done / p.total, p.human) });
 *   run.stop();                                                   // a 90-minute render needs a door
 *   const r = await run.done;                                     // { ok, blob, name, frames, manifest, ffmpeg }
 *   ex.save(r);
 *
 *   ex.verify({ frames: 6, width: 160 })   → renders the same short schedule twice and compares the digests:
 *                                            the determinism claim, checked in the browser, in about a second.
 *   ex.hazards()                           → every pin's live reading, before or after a run.
 *
 * THE PROOF is `node tests/render-exact.test.mjs` (39 GREEN).  It is NOT in test.sh — test.sh belongs to another wave; the
 * line to add beside the others is `node tests/render-exact.test.mjs; RX_RC=$?`.
 *
 * STATUS: the schedule, both endpoint rules, the arithmetic, the fold, the cost model, the digest, the manifest
 * and the zip are EXACT and proved in node.  The driver's pins and witnesses are proved in node against a fake
 * lab that REPRODUCES each hazard, so removing a pin turns a test red; what a browser must still answer is
 * listed at the foot of the test.
 */

import {
  AU_FS, VIEW_NAMES, viewCarriesGlobalPhase, wavePeriod, seamError, planPeriodRecording,
  alignedBytesPerRow, planBands, maxPictureSize, fitPicture,
  slug, stamp, uniqueName,
  toRGBA, crc32, zlibStored, pngFilter, buildPNG,
} from './capture.js';

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

/**
 * THE MEASURED TABLE.  capture.js' own measurements of ONE picture — render, GPU readback and PNG encode —
 * headless Firefox on an RTX 3070 at a 96³ grid, 2026-09-05.  Very nearly linear in megapixels: 131 ms per Mpx
 * over a 181 ms floor, holding across a 73x range.  Bytes are a ray-marched frame's own compressibility and
 * swing by 3x with the content, which is why `estimate` says so.
 */
export const COST_TABLE = Object.freeze({
  machine: 'headless Firefox · RTX 3070 · 96³ grid · 2026-09-05 (capture.js\' measurements)',
  points: Object.freeze([
    Object.freeze({ w: 1260, h: 733, mpx: 0.92358, ms: 230, bytes: 78000 }),
    Object.freeze({ w: 2048, h: 2048, mpx: 4.194304, ms: 730, bytes: null }),
    Object.freeze({ w: 3780, h: 2199, mpx: 8.312220, ms: 1200, bytes: 334000 }),
    Object.freeze({ w: 4096, h: 4096, mpx: 16.777216, ms: 2400, bytes: null }),
    Object.freeze({ w: 6144, h: 6144, mpx: 37.748736, ms: 5200, bytes: null }),
    Object.freeze({ w: 8192, h: 8192, mpx: 67.108864, ms: 9000, bytes: 1950000 }),
  ]),
  note: 'the grid is 96³ and the ray-march step count is mat.steps; a 128³ grid or a longer march costs more, and this table does not know it. The run replaces it with its own median after three frames.',
});

/** piecewise-linear in megapixels, extrapolated from the end pair beyond the table */
function interp(points, mpx, key) {
  const p = points.filter((q) => q[key] !== null && q[key] !== undefined);
  if (!p.length) return NaN;
  if (p.length === 1) return p[0][key] * (mpx / p[0].mpx);
  let i = 0; while (i < p.length - 2 && mpx > p[i + 1].mpx) i++;
  const a = p[i], b = p[i + 1];
  const s = (b[key] - a[key]) / (b.mpx - a.mpx);
  return Math.max(0, a[key] + s * (mpx - a.mpx));
}

/**
 * WHAT IT WILL COST, before anybody starts it.  `msPerFrame` may be supplied (the run does, from its own median)
 * and then the table is not consulted at all.
 */
export function estimate({ w = 0, h = 0, frames = 0, msPerFrame = null, bytesPerFrame = null, table = COST_TABLE } = {}) {
  const mpx = (w * h) / 1e6;
  const fromTable = mpx > 0 ? interp(table.points, mpx, 'ms') : NaN;
  const ms = msPerFrame !== null ? msPerFrame : fromTable;
  const bpp = mpx > 0 ? interp(table.points, mpx, 'bytes') / (mpx * 1e6) : NaN;
  const bytes = bytesPerFrame !== null ? bytesPerFrame : (mpx * 1e6 * bpp);
  const totalMs = ms * frames, totalBytes = bytes * frames;
  const extrapolated = mpx > 0 && (mpx > table.points[table.points.length - 1].mpx || mpx < table.points[0].mpx);
  return {
    w, h, mpx, frames, msPerFrame: ms, totalMs, bytesPerFrame: bytes, totalBytes,
    basis: msPerFrame !== null ? 'measured in this run' : 'the table: ' + table.machine,
    extrapolated, measured: msPerFrame !== null,
    human: (frames || 0) + ' frames · ' + (w && h ? w + '×' + h : 'size unknown') + ' · ~' + humanMs(totalMs) + ' · ~' + humanBytes(totalBytes),
    warning: !(mpx > 0) ? 'no size given: the cost is unknown'
      : totalMs > 20 * 60 * 1000 ? 'THIS IS A ' + humanMs(totalMs) + ' RENDER. Nothing here can make it faster; it can be stopped, and it cannot be resumed.'
        : totalMs > 2 * 60 * 1000 ? 'this will take ' + humanMs(totalMs) + ' — long enough to walk away from, short enough to wait for.' : '',
    bytesNote: 'the byte figure is a ray-marched frame\'s own compressibility and swings by about 3x with the content; the time figure is the one to trust.',
  };
}
export function humanMs(ms) {
  if (!Number.isFinite(ms)) return '?';
  const s = ms / 1000;
  if (s < 1) return Math.round(ms) + ' ms';
  if (s < 90) return s.toFixed(1) + ' s';
  const m = s / 60;
  if (m < 90) return m < 10 ? m.toFixed(1) + ' min' : Math.round(m) + ' min';
  const h = Math.floor(m / 60);
  return h + ' h ' + Math.round(m - 60 * h) + ' min';
}
export function humanBytes(b) {
  if (!Number.isFinite(b)) return '?';
  if (b < 1024) return Math.round(b) + ' B';
  if (b < 1048576) return (b / 1024).toFixed(0) + ' kB';
  if (b < 1073741824) return (b / 1048576).toFixed(1) + ' MB';
  return (b / 1073741824).toFixed(2) + ' GB';
}

/* ── THE DIGEST ────────────────────────────────────────────────────────────────────────────────────────────── */

/**
 * A 64-BIT FINGERPRINT of a byte run, as two independent FNV-1a lanes with a final avalanche.  It is a
 * fingerprint and NOT a cryptographic hash: its job is to detect that two renders differ, not to resist anyone
 * trying to make them collide.  It runs over the FILTERED SCANLINES rather than the PNG, because pngFilter is
 * ours and injective given (w, h) while the deflate is the browser's (hazard H12).
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

/* ── THE ZIP ───────────────────────────────────────────────────────────────────────────────────────────────── */

/**
 * ONE DOWNLOAD FOR A SEQUENCE.  A STORED zip — no compression, because a PNG is already deflated and a second
 * pass would cost minutes and save nothing — with a FIXED timestamp, so two renders of the same schedule give
 * byte-identical archives and not archives that differ only in when they were made.
 * `files` is [{ name, bytes }]; the result is one Uint8Array.  Refuses ZIP64 territory rather than write a
 * malformed archive: above 4 GB or 65535 entries, stream the frames with `onFrame` instead.
 */
export function zipStored(files, { date = null } = {}) {
  const enc = new TextEncoder();
  const DOS_TIME = 0, DOS_DATE = 0x0021;                  // 1980-01-01 00:00:00 — fixed on purpose
  let dt = DOS_TIME, dd = DOS_DATE;
  if (date) {
    const y = Math.max(1980, date.getUTCFullYear());
    dd = (((y - 1980) & 0x7f) << 9) | (((date.getUTCMonth() + 1) & 0xf) << 5) | (date.getUTCDate() & 0x1f);
    dt = ((date.getUTCHours() & 0x1f) << 11) | ((date.getUTCMinutes() & 0x3f) << 5) | ((date.getUTCSeconds() >> 1) & 0x1f);
  }
  const recs = files.map((f) => ({ name: enc.encode(f.name), bytes: f.bytes, crc: crc32(f.bytes) }));
  if (recs.length > 65535) throw new Error('render-exact: ' + recs.length + ' files needs ZIP64 — stream with onFrame instead');
  let total = 0;
  for (const r of recs) total += 30 + r.name.length + r.bytes.length + 46 + r.name.length;
  total += 22;
  let payload = 0; for (const r of recs) payload += 30 + r.name.length + r.bytes.length;
  if (payload > 0xfffffffe) throw new Error('render-exact: ' + humanBytes(payload) + ' needs ZIP64 — stream with onFrame instead');
  const out = new Uint8Array(total), dv = new DataView(out.buffer);
  let p = 0;
  for (const r of recs) {
    r.at = p;
    dv.setUint32(p, 0x04034b50, true); p += 4;
    dv.setUint16(p, 20, true); p += 2;                    // version needed
    dv.setUint16(p, 0, true); p += 2;                     // flags
    dv.setUint16(p, 0, true); p += 2;                     // method 0 = stored
    dv.setUint16(p, dt, true); p += 2;
    dv.setUint16(p, dd, true); p += 2;
    dv.setUint32(p, r.crc, true); p += 4;
    dv.setUint32(p, r.bytes.length, true); p += 4;
    dv.setUint32(p, r.bytes.length, true); p += 4;
    dv.setUint16(p, r.name.length, true); p += 2;
    dv.setUint16(p, 0, true); p += 2;                     // extra
    out.set(r.name, p); p += r.name.length;
    out.set(r.bytes, p); p += r.bytes.length;
  }
  const cdAt = p;
  for (const r of recs) {
    dv.setUint32(p, 0x02014b50, true); p += 4;
    dv.setUint16(p, 20, true); p += 2;                    // version made by
    dv.setUint16(p, 20, true); p += 2;                    // version needed
    dv.setUint16(p, 0, true); p += 2;
    dv.setUint16(p, 0, true); p += 2;
    dv.setUint16(p, dt, true); p += 2;
    dv.setUint16(p, dd, true); p += 2;
    dv.setUint32(p, r.crc, true); p += 4;
    dv.setUint32(p, r.bytes.length, true); p += 4;
    dv.setUint32(p, r.bytes.length, true); p += 4;
    dv.setUint16(p, r.name.length, true); p += 2;
    dv.setUint16(p, 0, true); p += 2;                     // extra
    dv.setUint16(p, 0, true); p += 2;                     // comment
    dv.setUint16(p, 0, true); p += 2;                     // disk
    dv.setUint16(p, 0, true); p += 2;                     // internal attrs
    dv.setUint32(p, 0, true); p += 4;                     // external attrs
    dv.setUint32(p, r.at, true); p += 4;
    out.set(r.name, p); p += r.name.length;
  }
  const cdSize = p - cdAt;
  dv.setUint32(p, 0x06054b50, true); p += 4;
  dv.setUint16(p, 0, true); p += 2;                       // this disk
  dv.setUint16(p, 0, true); p += 2;                       // disk with the central directory
  dv.setUint16(p, recs.length, true); p += 2;             // entries on this disk
  dv.setUint16(p, recs.length, true); p += 2;             // entries in total
  dv.setUint32(p, cdSize, true); p += 4;                  // the central directory's size
  dv.setUint32(p, cdAt, true); p += 4;                    // where it starts
  dv.setUint16(p, 0, true); p += 2;                       // comment length
  return out.subarray(0, p);
}

/* ── THE HAZARD REGISTER ───────────────────────────────────────────────────────────────────────────────────── */

/**
 * EVERY SOURCE OF NON-DETERMINISM FOUND IN THE RENDER PATH, as data — so the driver's pins, the honest report
 * and the proof all read the SAME list and cannot drift apart.  `pin` is what the driver does; `witness` is what
 * it checks afterwards, because a pin that is asserted and not verified is a hope.
 */
export const HAZARDS = Object.freeze([
  Object.freeze({ id: 'jitter', what: 'field.js seeds the ray-march start offset AND the GRAIN style\'s voxel-keep cell with (field.stats.presents % 97)/97, so the same state renders differently at different points of a 97-frame cycle', where: 'field.js writeView v[19] → V.p0.w; shader lines 231 and 312', pin: 'stats.presents is set to a fixed seed immediately before every frame and restored honestly afterwards', witness: 'presents reads seed+1 after the frame: exactly one present happened and it was ours' }),
  Object.freeze({ id: 'governor', what: 'the rack judges the median of the last 60 presented frames against a 28 ms budget and steps the FIELD GRID down the ladder (128 → 96 → 64) on a slow machine — the render literally coarsens with machine speed', where: 'rack.js loop, gov / effectiveRes', pin: 'the physics clock is paused (the governor only acts while playing, and pausing resets its drop) and governor.on is turned off for the run', witness: 'field.resolution is compared against its frame-0 reading after every frame' }),
  Object.freeze({ id: 'autoscale', what: 'quality.autoScale is moved by a wall-clock EMA every 24 frames and multiplies the size the rack asks field.resize for', where: 'rack.js loop, autoQ', pin: 'quality.auto = false for the run, restored after', witness: 'canvas.width/height are read AT the readback, after the copy completes — a resize that lands between the render and the copy is exactly what would slip past a check taken earlier, and NOTHING PRESENTS when a window resize or a DPR change does it, so the jitter witness is blind to this one' }),
  Object.freeze({ id: 'fieldclock', what: 'the rack reconstructs psi on an EVOLVE tier only when the field clock is due, so a capped field clock renders the same picture twice', where: 'rack.js loop, fieldRate.capMs / lastReconMs', pin: 'the renderer bypasses the tier router and passes a non-null modes to field.frame every frame, so the compute pass is unconditional', witness: 'field.stats.generation advances by exactly one per frame' }),
  Object.freeze({ id: 'camera', what: 'the camera pose is an integrator: omega decays as exp(-mu dt) and AUTO-ROTATE drifts at camera.speed rad per WALL second, stepped with a wall interval every frame', where: 'rack.js cameraStep', pin: 'a moving camera is refused; optionally stilled (dy = dp = 0, autoRotate off) and restored. A camera move comes from poseAt(k, N), a pure function of the frame index', witness: 'camera.moving is false, and obs is compared against what the schedule wrote' }),
  Object.freeze({ id: 'modulation', what: 'the modulation rack is driven from the rack loop with performance.now(), and even under WALL sync its one-pole SMOOTH filters and its envelopes accumulate dt — there is no modulated(t) to evaluate', where: 'rack.js loop → mir/host.js advanceTo; mir/mod.js advance', pin: "'freeze' stops it and returns every target to base, or 'drive' steps it by 1/fps per frame through mir's own deterministic door", witness: 'LW.mod.running is false for the whole run' }),
  Object.freeze({ id: 'h2', what: 'h2.fieldModes() takes no t: it reads the current R, which h2.update(t) sets from a pre-computed trajectory — and in the rack loop that call sits AFTER the frame and inside the cpuTick cadence, so the live H2 field is one frame stale, or four in 120 Hz mode', where: 'rack.js loop; h2view.js update', pin: 'the driver calls h2.update(t) itself, immediately before modesAt, whenever H2 is on', witness: 'none available from outside — h2 exposes no R-at-t reader' }),
  Object.freeze({ id: 'modealias', what: 'LW.modesAt(t) returns a module-level array of module-level records rewritten in place, so anything that calls modesAt between our call and field.frame\'s consumption silently rewrites our modes', where: 'rack.js modesAt / modeRecs / modeList', pin: 'modesAt is evaluated inline in the field.frame call, with nothing between', witness: 'covered by the jitter witness — an interloper that could rewrite the modes had to present to do it' }),
  Object.freeze({ id: 'interloper', what: 'any schedule() from anywhere arms a rAF that resizes the canvas, presents with an unpinned seed and advances the modulation on wall time', where: 'rack.js schedule / loop', pin: 'the driver never calls LW.schedule during a run, and preflight drains the loop and reads stats.scheduled back', witness: 'the jitter, generation and size witnesses all fire; the frame is re-rendered, and a frame that will not settle aborts the run by name' }),
  Object.freeze({ id: 'dpr', what: 'field.resize multiplies by window.devicePixelRatio, so a render sized by scale inherits the machine\'s DPR', where: 'field.js resize', pin: 'an exact render takes an explicit width/height; a scale-sized render records the resolved size and flags sizeFromMachine', witness: 'the manifest carries the resolved size' }),
  Object.freeze({ id: 'overlays', what: 'particles.js integrates an RK4 trajectory from its own lastT to t (and teleports rather than integrate when |dt| > 4, which every loop\'s wrap gap is); the rack calls it at rAF cadence gated on the perf mode', where: 'rack.js loop; particles.js advance', pin: 'overlays are off by default; a path-dependent layer must be named explicitly and comes back labelled', witness: 'the manifest lists pathDependent layers' }),
  Object.freeze({ id: 'deflate', what: "capture.js' encodePNG reaches for CompressionStream('deflate'), whose exact output is unspecified and does change between browser builds: the PIXELS are exact and the CONTAINER is not", where: 'capture.js encodePNG / deflateStream', pin: "the digest is taken over the FILTERED SCANLINES, which are ours; deflate: 'stored' makes the file bytes reproducible too, at about 3x the size", witness: 'the manifest records which deflate was used' }),
  Object.freeze({ id: 'gamut', what: 'field.js configures the context display-p3 on a wide-gamut screen and the PNG carries no ICC profile, so the same shader output means different colour and a P3 render read as sRGB is shifted', where: 'field.js / capture.js configure', pin: 'none available here — it is a property of the canvas', witness: 'the gamut and the swapchain format are recorded in the manifest; a cross-machine comparison is only meaningful between renders that agree on both' }),
]);
export const HAZARD_IDS = Object.freeze(HAZARDS.map((h) => h.id));

/* ── THE MANIFEST ──────────────────────────────────────────────────────────────────────────────────────────── */

/**
 * THE SIDECAR, and the thing that makes a render auditable without keeping its pixels: two runs of the same
 * schedule are compared by diffing two small JSON files.  `frames` carries every scheduled t and every digest.
 */
export function manifest(o = {}) {
  const s = o.schedule;
  return {
    format: 'lambdawaves/render-exact@1',
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
    pathDependent: o.pathDependent || [],
    cost: o.cost || null,
    frames: o.frames || [],
    ffmpeg: o.ffmpeg || null,
    caveats: [
      'The PIXELS are the exact quantity. The PNG container\'s compression is the browser\'s unless deflate was "stored"; compare the per-frame digests, which are over the filtered scanlines.',
      'A cross-machine comparison is only meaningful between renders that agree on gamut and swapchain format.',
      'Wall time appears in this file only as a report of how long the render took. It was never an input to a picture.',
    ],
  };
}

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════
   PART 2 — THE DRIVER.  Needs a browser (or the fake lab the proof injects); nothing above does.
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

export const DEFAULTS = Object.freeze({
  jitterSeed: 13,          // the same seed capture.js pins, so a still and a rendered frame agree
  retries: 3,              // a contended frame is re-rendered; three failures abort the run by name
  deflate: 'auto',         // 'auto' → CompressionStream if there is one, else stored; 'stored' → reproducible bytes
  modulation: 'freeze',    // 'freeze' | 'drive' | 'leave' (leave is only for a caller that knows what it is doing)
  camera: 'refuse',        // 'refuse' | 'still'
  overlays: null,
  digestFrames: true,
});

/** every path-dependent overlay layer, by the id capture.js composites them under */
export const PATH_DEPENDENT_LAYERS = Object.freeze(['particles', 'vortex', 'kepler']);

/**
 * createExactRenderer(LW, opts) — the deterministic renderer over a booted lab.
 *
 * `opts.grab` replaces the GPU road (the proof injects a fake that reproduces the hazards); `opts.now` replaces
 * the progress clock.  Everything else is the lab: LW.clock, LW.field, LW.modesAt, LW.obs, LW.mat, LW.quality,
 * LW.camera, LW.mod, LW.governor, LW.h2.
 */
export function createExactRenderer(LW, opts = {}) {
  const canvas = opts.canvas || (typeof document !== 'undefined' ? document.getElementById('field') : null);
  const now = opts.now || (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));
  const raf = opts.raf || ((typeof requestAnimationFrame === 'function') ? (() => new Promise((r) => requestAnimationFrame(r))) : (() => Promise.resolve()));
  const taken = new Set();
  const JITTER_SEED = opts.jitterSeed === undefined ? DEFAULTS.jitterSeed : (opts.jitterSeed | 0);
  let cfgUsage = null;

  const field = () => LW.field;
  const gpuOk = () => { const f = field(); return !!(f && f.ok); };
  const dev = () => { const f = field(); return f && f.ok ? f.device : null; };

  function limits() { const d = dev(); return maxPictureSize(d ? d.limits : null, opts.canvasCap || 32767); }

  function stateLabel() {
    try {
      if (opts.label) return opts.label;
      const p = LW.reg && LW.reg.presetId; if (p) return p;
      const pop = LW.reg && LW.reg.populated ? LW.reg.populated() : [];
      return pop.length ? pop.length + 'modes' : 'state';
    } catch (_) { return 'state'; }
  }

  /* ── the deflate, chosen and NAMED (hazard H12) ─────────────────────────────────────────────────────────── */
  function deflateFor(kind) {
    if (kind === 'stored') return { name: 'stored', reproducible: true, run: (b) => zlibStored(b) };
    if (typeof CompressionStream === 'function') {
      return { name: 'CompressionStream', reproducible: false, run: async (b) => {
        const cs = new CompressionStream('deflate');
        const wr = cs.writable.getWriter(); wr.write(b); wr.close();
        const parts = []; let n = 0;
        const rd = cs.readable.getReader();
        for (;;) { const { value, done } = await rd.read(); if (done) break; parts.push(value); n += value.length; }
        const out = new Uint8Array(n); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; }
        return out;
      } };
    }
    return { name: 'stored', reproducible: true, run: (b) => zlibStored(b) };
  }

  /* ── the context's usage.  COPY_SRC is not the default and the readback cannot happen without it. ───────── */
  function configure(withCopy) {
    const f = field(); if (!f || !canvas) return false;
    const c = canvas.getContext('webgpu'); if (!c) return false;
    const base = { device: f.device, format: f.format, alphaMode: 'opaque' };
    if (f.gamut && f.gamut !== 'srgb') base.colorSpace = 'display-p3';
    if (withCopy) base.usage = GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC;
    c.configure(base);
    cfgUsage = withCopy ? 'copy' : 'plain';
    return true;
  }

  /**
   * ONE FRAME AT ONE LOGICAL TIME, off the GPU, with the pins around it and the witnesses after it.
   *
   * The render and the copy sit in ONE synchronous block on purpose: the swapchain texture expires at the end of
   * the animation-frame task, so a copy encoded in a later task would read a fresh, cleared texture (capture.js
   * measured that and this file inherits the rule).  `modesAt` is evaluated INSIDE the frame call, because the
   * mode list is a reused buffer (H8).  The PINS are applied by the driver, not here, so that an injected road
   * (the proof's fake lab) gets exactly the same ones; what only this function can know is where the WITNESSES
   * are taken — immediately after the copy completes, before the await can let anything else in.
   */
  async function grabExact(t, w, h, wit) {
    const f = field(), d = f.device, c = canvas.getContext('webgpu');
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    const gen0 = f.stats.generation;
    f.frame({ modes: LW.modesAt(t), obs: LW.obs, mat: LW.mat });      // H8: modesAt inline, nothing between
    const tex = c.getCurrentTexture();
    const bpr = alignedBytesPerRow(w);
    const bands = planBands(h, bpr, d.limits.maxBufferSize);
    const enc = d.createCommandEncoder();
    const bufs = bands.map((b) => {
      const buf = d.createBuffer({ size: bpr * b.rows, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
      enc.copyTextureToBuffer({ texture: tex, origin: [0, b.y0, 0] }, { buffer: buf, bytesPerRow: bpr, rowsPerImage: b.rows }, [w, b.rows, 1]);
      return { buf, y0: b.y0, rows: b.rows };
    });
    d.queue.submit([enc.finish()]);
    /* THE FRAME IS COMPLETE WHEN THE COPY HAS RUN — not when a rAF fired, not after a timeout.  The bytes do not
       exist until this resolves, which is the whole reason this road has no cadence in it. */
    await d.queue.onSubmittedWorkDone();
    wit.presents = f.stats.presents; wit.generation = f.stats.generation - gen0;
    /* THE SIZE WITNESS ON THIS ROAD IS CONSERVATIVE, AND DELIBERATELY SO.  The dangerous window — between the
       canvas resize and getCurrentTexture, and between that and submit — is SYNCHRONOUS and cannot be entered,
       so the copy's size is safe by construction.  What this reading catches is a resize that landed during the
       readback await, which costs one re-render of the same t (the same picture) and nothing else.  A false
       alarm here is free; a missed one would write a PNG whose header lies. */
    wit.canvasW = canvas.width; wit.canvasH = canvas.height;
    const bgra = /^bgra/.test(f.format);
    const rgba = new Uint8Array(w * h * 4);
    for (const b of bufs) {
      await b.buf.mapAsync(GPUMapMode.READ);
      const src = new Uint8Array(b.buf.getMappedRange());
      rgba.set(toRGBA(src, w, b.rows, { bytesPerRow: bpr, bgra, opaque: true }), b.y0 * w * 4);
      b.buf.unmap(); b.buf.destroy();
    }
    return { rgba, w, h };
  }

  /* ── THE PLAN ──────────────────────────────────────────────────────────────────────────────────────────── */

  /** the host's own energy expression, or none — never a guess under a propagator (capture.js' wave 58) */
  function energiesNow() {
    try {
      if (opts.energies) { const E = opts.energies(); return E && E.length ? Array.from(E) : null; }
      if (LW.reg && LW.reg.P) return null;
      return LW.reg.populated().map((a) => LW.reg.Ediag(a));
    } catch (_) { return null; }
  }

  /** the picture's size, resolved — and whether the machine decided it (H10) */
  function sizeFor(o) {
    const lim = limits();
    const srcW = canvas ? canvas.width : 0, srcH = canvas ? canvas.height : 0;
    const fit = fitPicture({ srcW, srcH, scale: o.scale, width: o.width, height: o.height, max: lim.side });
    const explicit = !!(o.width || o.height);
    return Object.assign({}, fit, { explicit, sizeFromMachine: !explicit, limits: lim });
  }

  /**
   * WHAT WILL HAPPEN, before anything does: the schedule, the refusal if there is one, the cost, and every pin's
   * live reading.  A button shows `plan.message`, `plan.cost.human` and `plan.warnings` and commits to nothing.
   */
  function plan(o = {}) {
    const observable = o.observable || (LW.mat ? VIEW_NAMES[LW.mat.view | 0] : 'density') || 'density';
    const energies = energiesNow();
    let wave = null;
    if (energies && energies.length && (viewCarriesGlobalPhase(observable) || o.pixelExact)) {
      try { wave = wavePeriod(energies); } catch (_) { wave = null; }
    }
    const period = o.period !== undefined ? o.period : (LW.period || null);
    const size = canvas ? sizeFor(o) : { w: o.width || 0, h: o.height || 0, explicit: !!(o.width || o.height), sizeFromMachine: !(o.width || o.height), clipped: false };
    const p = planExact(period, Object.assign({
      t0: LW.clock ? LW.clock.t : 0, rate: LW.clock ? LW.clock.rate : undefined,
      energies, observable, wave, w: size.w, h: size.h,
    }, o));
    const H = hazards();
    const warnings = [];
    for (const h of H.readings) if (h.state === 'live' && h.blocking) warnings.push(h.note);
    if (size.sizeFromMachine) warnings.push('THE SIZE CAME FROM THIS MACHINE: no width or height was given, so the render inherits the canvas at this device pixel ratio (' + size.w + '×' + size.h + '). Two machines will render two different pictures. Give an explicit width for a size that travels.');
    if (size.clipped) warnings.push('CLIPPED to ' + (size.limits ? size.limits.side : '?') + ' on the long side — the DEVICE limit, which field.js could raise in one line.');
    if (p.ok && p.cost && p.cost.warning) warnings.push(p.cost.warning);
    return Object.assign({}, p, {
      opts: Object.assign({}, o), size, observable, energies: energies ? energies.length : 0,
      hazards: H, warnings, cost: estimate({ w: size.w, h: size.h, frames: p.N || 0 }),
      pathDependent: pathDependentOf(o.overlays),
    });
  }

  function pathDependentOf(overlays) {
    if (!overlays) return [];
    const list = Array.isArray(overlays) ? overlays : [overlays];
    return list.map((x) => (typeof x === 'string' ? x : (x && x.id) || 'layer')).filter((id) => PATH_DEPENDENT_LAYERS.indexOf(id) >= 0);
  }

  /* ── THE PINS ──────────────────────────────────────────────────────────────────────────────────────────── */

  /** every hazard's LIVE reading — what is armed right now, before or after a run */
  function hazards() {
    const f = field();
    const read = (id) => {
      switch (id) {
        case 'jitter': return { state: 'live', blocking: false, value: f && f.ok ? f.stats.presents : null, note: 'the jitter counter is running; the render pins it to ' + JITTER_SEED };
        case 'governor': return { state: (LW.governor && LW.governor.on) ? 'live' : 'off', blocking: false, value: LW.governor ? LW.governor.drop : null, note: (LW.governor && LW.governor.drop) ? 'THE GOVERNOR HAS ALREADY STEPPED THE GRID DOWN ' + LW.governor.drop + ' notch(es): this machine is rendering a coarser volume than the one you set. Pausing restores it, and the render pauses.' : 'the governor is armed; the render pauses the clock and turns it off, which is what disarms it' };
        case 'autoscale': return { state: (LW.quality && LW.quality.auto) ? 'live' : 'off', blocking: false, value: LW.quality ? LW.quality.autoScale : null, note: (LW.quality && LW.quality.auto && LW.quality.autoScale < 1) ? 'AUTO SCALE has already dropped the stage to ' + Math.round(100 * LW.quality.autoScale) + '%: the render holds it off and renders at the size asked for.' : 'auto scale is on; the render holds it off' };
        case 'fieldclock': return { state: 'live', blocking: false, value: LW.fieldRate ? LW.fieldRate.capMs : null, note: 'the field clock caps reconstructs; the render bypasses the tier router entirely' };
        case 'camera': { const m = !!(LW.camera && LW.camera.moving); return { state: m ? 'live' : 'off', blocking: m, value: LW.camera ? { dy: LW.camera.dy, dp: LW.camera.dp, ambient: LW.camera.ambient } : null, note: m ? 'THE CAMERA IS MOVING' + (LW.camera.ambient ? ' (AUTO-ROTATE is on)' : ' (a fling is still coasting)') + ': its pose is an integrator on the wall clock, so the render would depend on machine speed. It will be brought to rest — pass camera: "refuse" to be told instead, or poseAt(k, N) for a camera move that IS deterministic.' : 'the camera is at rest' }; }
        case 'modulation': { const r = !!(LW.mod && LW.mod.running); return { state: r ? 'live' : 'off', blocking: r, value: r, note: r ? 'THE MODULATION RACK IS RUNNING: it is driven from the wall clock and its smoothing filters accumulate, so it cannot be evaluated at a time. It will be frozen (every target back to its knob) — pass modulation: "drive" to step it from the schedule instead, which renders the movement and is still exact.' : 'the modulation rack is not running' }; }
        case 'h2': { const on = !!(LW.h2 && LW.h2.on); return { state: on ? 'live' : 'off', blocking: false, value: on, note: on ? 'H2 IS ON: its field modes read a current R that h2.update(t) sets, and the rack sets it AFTER the frame. The render calls h2.update(t) itself before every frame.' : 'H2 is off' }; }
        case 'modealias': return { state: 'live', blocking: false, value: null, note: 'the mode list is a reused buffer; the render evaluates modesAt inline in the frame call' };
        case 'interloper': { const s = !!(LW.stats && LW.stats.scheduled); return { state: s ? 'live' : 'off', blocking: false, value: s, note: s ? 'a rack frame is currently scheduled; preflight drains it and the per-frame witnesses catch any that arrive anyway' : 'no rack frame is scheduled' }; }
        case 'dpr': return { state: 'live', blocking: false, value: (typeof window !== 'undefined' ? window.devicePixelRatio : null), note: 'give an explicit width for a size that does not depend on this screen' };
        case 'overlays': return { state: 'off', blocking: false, value: null, note: 'overlays are off unless asked for' };
        case 'deflate': return { state: 'live', blocking: false, value: (typeof CompressionStream === 'function') ? 'CompressionStream' : 'stored', note: 'the PNG container\'s compression is the browser\'s; the digests are over the filtered scanlines, which are ours' };
        case 'gamut': return { state: (f && f.ok && f.gamut && f.gamut !== 'srgb') ? 'live' : 'off', blocking: false, value: f && f.ok ? f.gamut : null, note: (f && f.ok && f.gamut && f.gamut !== 'srgb') ? 'THIS CANVAS IS ' + f.gamut + ': the PNG carries no ICC profile, so the file will be read as sRGB and the colour will shift. The bytes are still exact, and comparable only with another render on the same gamut.' : 'the canvas is sRGB' };
        default: return { state: 'unknown', blocking: false, value: null, note: '' };
      }
    };
    const readings = HAZARDS.map((h) => Object.assign({}, h, read(h.id)));
    return { readings, blocking: readings.filter((r) => r.blocking).map((r) => r.id), byId: Object.fromEntries(readings.map((r) => [r.id, r])) };
  }

  /* ── THE RUN ───────────────────────────────────────────────────────────────────────────────────────────── */

  /**
   * render(o) → { stop(), get stopped(), done }.  `done` resolves with the frames, the manifest and the honest
   * report of what it cost.  Nothing here reads a wall clock except the progress report.
   */
  function render(o = {}) {
    let stopped = false;
    const unpin = new Set(o.unpin || []);                  // THE PROOF'S OWN DOOR: deliberately skip a pin
    const pinned = (id) => !unpin.has(id);
    const done = (async () => {
      const P = o.schedule ? { ok: true, schedule: o.schedule, N: o.schedule.N, kind: o.kind || 'given', message: '' } : plan(o);
      if (!P.ok) return { ok: false, refused: true, plan: P, error: P.message };
      const sched = P.schedule;
      const N = sched.N;
      const size = P.size || sizeFor(o);
      const fps = sched.fps;
      const modMode = o.modulation || DEFAULTS.modulation;
      const camMode = o.camera || DEFAULTS.camera;
      const retries = o.retries === undefined ? DEFAULTS.retries : o.retries;
      const def = deflateFor(o.deflate === undefined ? DEFAULTS.deflate : o.deflate);
      const wantDigest = o.digestFrames === undefined ? DEFAULTS.digestFrames : !!o.digestFrames;
      const stem = slug(o.label || stateLabel());
      const wall0 = now();

      if (!gpuOk() && !opts.grab) return { ok: false, error: 'no WebGPU device: the FIELD is not up' };
      const f = field();

      /* ── PREFLIGHT.  Every pin, then a drain, then the baseline the witnesses are read against. ────────── */
      const before = {
        playing: LW.clock.playing, t: LW.clock.t, rate: LW.clock.rate,
        modPhases: LW.mod && LW.mod.model ? LW.mod.model.snapshotPhases() : null,
        modShadows: LW.mod && LW.mod.model ? LW.mod.model.sourceList().map(s => [s.id, {shadowed:s.shadowed, shadowPhase:s.shadowPhase, shadowCycles:s.shadowCycles}]) : [],
        modTransport: LW.mod && LW.mod.model ? { ...LW.mod.model.transport } : null,
        qAuto: LW.quality ? LW.quality.auto : null, qScale: LW.quality ? LW.quality.scale : null,
        gov: LW.governor ? LW.governor.on : null,
        camDy: LW.camera ? LW.camera.dy : null, camDp: LW.camera ? LW.camera.dp : null, camAuto: LW.camera ? LW.camera.autoRotate : null,
        modPlaying: (LW.mod && LW.mod.playing) || false,
        presents: f && f.stats ? f.stats.presents : 0,
        canvasW: canvas ? canvas.width : 0, canvasH: canvas ? canvas.height : 0,
        cfg: cfgUsage,
        obs: LW.obs ? Object.assign({}, LW.obs) : null,
      };
      const pins = {};

      /* THE CLOCK IS PAUSED, AND THAT IS WHAT DISARMS THE GOVERNOR: the rack only judges while playing, and
         pausing actively resets its drop.  Turning the governor off is the belt beside that brace. */
      if (pinned('governor')) { LW.clock.pause(); if (LW.governor) LW.governor.on = false; pins.governor = 'the clock is paused (which disarms it) and the governor is off'; }
      else pins.governor = 'NOT PINNED (unpin)';
      if (pinned('autoscale') && LW.quality) { LW.quality.auto = false; pins.autoscale = 'quality.auto = false'; } else pins.autoscale = 'NOT PINNED (unpin)';
      /* the camera (H5) */
      if (LW.camera && LW.camera.moving && pinned('camera')) {
        if (camMode === 'refuse') {
          restore(before, pins);
          return { ok: false, refused: true, error: 'THE CAMERA IS MOVING. Its pose is an integrator on the wall clock — ' + (LW.camera.ambient ? 'AUTO-ROTATE is on' : 'a fling is still coasting') + ' — so this render would depend on how fast the machine ran. Bring it to rest, pass camera: "still" to have the render do it, or hand a poseAt(k, N) for a camera move that is a function of the frame index and therefore exact.', hazard: 'camera' };
        }
        LW.camera.dy = 0; LW.camera.dp = 0; LW.camera.autoRotate = false;
        pins.camera = 'stilled (dy = dp = 0, autoRotate off)';
      } else pins.camera = pinned('camera') ? 'at rest' : 'NOT PINNED (unpin)';
      /* the modulation (H6) */
      if (LW.mod && LW.mod.host && pinned('modulation')) {
        if (modMode === 'freeze') { if (LW.mod.running) LW.mod.stop(); pins.modulation = 'frozen: every target back to its base'; }
        else if (modMode === 'drive') { if (LW.mod.playing || LW.mod.running) LW.mod.stop(); if (LW.mod.model) { LW.mod.model.resetPhases(); LW.mod.model.modPlayEdge(); LW.mod.model.advance(0, 0); LW.mod.clock.applyAll(false); } pins.modulation = 'driven from the schedule at ' + (1 / fps).toFixed(6) + ' s per frame'; }
        else pins.modulation = 'LEFT RUNNING at the caller\'s request — this render is NOT deterministic';
      } else pins.modulation = LW.mod && LW.mod.host ? 'NOT PINNED (unpin)' : 'no modulation rack';
      pins.jitter = pinned('jitter') ? 'presents pinned to ' + JITTER_SEED + ' before every frame' : 'NOT PINNED (unpin)';
      pins.fieldclock = 'bypassed: field.frame is called directly with modes every frame';
      pins.h2 = (LW.h2 && LW.h2.on) ? 'h2.update(t) called before every frame' : 'H2 off';
      pins.deflate = def.name + (def.reproducible ? ' (file bytes reproducible)' : ' (file bytes are the browser\'s; the digests are not)');

      /* DRAIN: let any armed rack frame run and decline to re-arm, then read the scheduler back. */
      if (pinned('interloper')) { await raf(); await raf(); }
      const drained = !(LW.stats && LW.stats.scheduled);
      pins.interloper = drained ? 'the rack loop is idle' : 'THE RACK LOOP IS STILL ASKING FOR FRAMES — the witnesses will catch what it does';

      /* HELIUM'S BASIS IS SOLVED BEFORE FRAME 0.  After a basis change the frame loop keeps the previous basis on the
         field until the worker lands (heliumview.js, 2026-09-24); this synchronous demand makes the render's modes the
         basis in force from its first frame, and the worker's late answer is then discarded (its generation is old). */
      if (LW.helium && LW.helium.on) void LW.helium.sol;
      if (canvas) configure(true);
      const base = {
        resolution: f && f.ok ? f.resolution : null,
        half: LW.domain ? LW.domain.half : null,
        format: f && f.ok ? f.format : null,
        gamut: f && f.ok ? f.gamut : null,
        generation: f && f.stats ? f.stats.generation : 0,
      };

      /* ── THE LOOP.  One frame per scheduled time, and a frame is emitted only when its witnesses agree. ── */
      const files = [], frameLog = [];
      const msRing = [];
      let bytesOut = 0, err = null, aborted = null, contended = 0, k = 0;
      let drivenTime = 0;
      try {
        for (k = 0; k < N && !stopped; k++) {
          let t = sched.at(k);
          // Advance once per output frame, never again when a GPU witness retries it.
          if (modMode === 'drive' && LW.mod && LW.mod.step && pinned('modulation')) {
            if (k > 0) {
              drivenTime += LW.clock.rate / fps;
              if (LW.mod.model) {
                LW.mod.model.advance(1 / fps, k / fps);
                LW.mod.clock.applyAll(false);
              } else LW.mod.step(1 / fps);
            }
            t = drivenTime;
          }
          if (o.beforeFrame) o.beforeFrame({k, t, dt: k ? 1 / fps : 0});
          const fStart = now();
          let shot = null, wit = null, tries = 0;
          for (;;) {
            tries++;
            wit = {};
            /* THE PHYSICS CLOCK IS SET (never advanced): clock.scrub, not LW.scrub — LW.scrub schedules a rack
               frame, and a rack frame is hazard H9. */
            LW.clock.scrub(t);
            /* THE OBSERVER CLOCKS ARE STEPPED, by the frame index and nothing else. */
            if (o.poseAt) Object.assign(LW.obs, o.poseAt(k, N, t) || {});

            /* H7: H2's field modes read an R that only h2.update(t) sets, and the rack sets it after the frame */
            if (pinned('h2') && LW.h2 && LW.h2.on && LW.h2.update) LW.h2.update(t);
            /* H1: the jitter seed, pinned for THIS frame — the pin belongs to the driver so that an injected
               readback road gets it too, and it is put back honestly at the end of the run. */
            if (pinned('jitter') && f && f.stats) f.stats.presents = JITTER_SEED;
            shot = opts.grab ? await opts.grab({ t, w: size.w, h: size.h, wit, k, seed: JITTER_SEED, pinned }) : await grabExact(t, size.w, size.h, wit);
            /* THE WITNESSES.  A pin that is asserted and not verified is a hope. */
            const fail = [];
            if (pinned('jitter') && wit.presents !== JITTER_SEED + 1) fail.push('jitter: presents read ' + wit.presents + ', not ' + (JITTER_SEED + 1) + ' — another frame presented during ours');
            if (pinned('fieldclock') && wit.generation !== 1) fail.push('fieldclock: the field generation advanced ' + wit.generation + ' times, not once');
            if (pinned('autoscale') && (wit.canvasW !== size.w || wit.canvasH !== size.h)) fail.push('autoscale: the canvas was ' + wit.canvasW + '×' + wit.canvasH + ' at readback, not ' + size.w + '×' + size.h);
            const res = f && f.ok ? f.resolution : base.resolution;
            if (pinned('governor') && res !== base.resolution) fail.push('governor: the field grid moved from ' + base.resolution + '³ to ' + res + '³ mid-render');
            const half = LW.domain ? LW.domain.half : base.half;
            if (half !== base.half) fail.push('domain: the half-width moved from ' + base.half + ' to ' + half + ' mid-render');
            if (LW.clock.t !== t) fail.push('clock: t read ' + LW.clock.t + ', not the scheduled ' + t);
            if (pinned('modulation') && LW.mod && LW.mod.running && modMode !== 'leave') fail.push('modulation: the rack is running on wall time');
            wit.fail = fail;
            if (!fail.length) break;
            contended++;
            if (tries > retries) { aborted = { k, t, why: fail, tries }; break; }
          }
          if (aborted) break;

          /* the bytes.  pngFilter is ours and injective, so the digest over it is a digest of the pixels; the
             deflate is whatever was chosen, and the manifest says which (H12). */
          const raw = pngFilter(shot.rgba, size.w, size.h, o.filter === undefined ? -1 : o.filter);
          const dig = wantDigest ? digest(raw) : null;
          const z = await def.run(raw);
          const png = buildPNG(z instanceof Uint8Array ? z : new Uint8Array(z), size.w, size.h);
          const name = 'lambdawaves-' + stem + '-' + String(k).padStart(5, '0') + '.png';
          const item = { k, t, off: modMode === 'drive' ? t : sched.off(k), name, bytes: png, size: png.length, digest: dig, w: size.w, h: size.h, retries: tries - 1 };
          /* the Blob is LAZY: six hundred of them held eagerly is a second copy of the whole render in memory,
             and a caller that streams with onFrame or downloads the zip never asks for one. */
          let _blob = null;
          Object.defineProperty(item, 'blob', { enumerable: false, get() { return (_blob = _blob || makeBlob(png, 'image/png')); } });
          bytesOut += png.length;
          frameLog.push({ k, t, off: item.off, digest: dig, bytes: png.length, retries: tries - 1 });
          const ms = now() - fStart;
          msRing.push(ms); if (msRing.length > 12) msRing.shift();
          if (o.onFrame) await o.onFrame(item);
          else files.push(item);
          if (o.onProgress) o.onProgress(progressOf(k + 1, N, wall0, msRing, bytesOut, size));
        }
      } catch (e) { err = String((e && e.message) || e); }

      const delivered = frameLog.length;
      restore(before, pins, delivered);

      const elapsed = now() - wall0;
      const medMs = median(msRing);
      const cost = estimate({ w: size.w, h: size.h, frames: N, msPerFrame: medMs || null, bytesPerFrame: delivered ? bytesOut / delivered : null });
      const ffmpeg = 'ffmpeg -framerate ' + fps + ' -i lambdawaves-' + stem + '-%05d.png -c:v libvpx-vp9 -pix_fmt yuv420p -crf 24 -b:v 0 ' + stem + (sched.mode === 'loop' ? '-loop' : '-span') + '.webm';
      const man = manifest({
        stamp: stamp(new Date()), schedule: sched,
        picture: { w: size.w, h: size.h, sizeFromMachine: !!size.sizeFromMachine, clipped: !!size.clipped, format: base.format, gamut: base.gamut, resolution: base.resolution, half: base.half, deflate: def.name, deflateReproducible: def.reproducible, jitterSeed: JITTER_SEED },
        state: { label: stateLabel(), observable: P.observable || null, digest: (LW.stateDigest ? safe(() => LW.stateDigest()) : null), version: LW.version || null },
        pins, witnesses: { contended, aborted: aborted ? aborted.why : null, drained },
        pathDependent: pathDependentOf(o.overlays), cost,
        frames: frameLog, ffmpeg,
      });

      if (modMode === 'drive') man.modulationClock = {origin:0,stepSeconds:1/fps,physics:'Previous-frame RATE integrated once per output interval; frame records contain actual physics times; no loop closure asserted'};
      let blob = null, name = null;
      if (o.zip && !o.onFrame && delivered) {
        const enc = new TextEncoder();
        const entries = files.map((x) => ({ name: x.name, bytes: x.bytes }));
        entries.push({ name: 'manifest.json', bytes: enc.encode(JSON.stringify(man, null, 2)) });
        entries.push({ name: 'ffmpeg.txt', bytes: enc.encode(ffmpeg + '\n') });
        const zip = zipStored(entries);
        name = uniqueName('lambdawaves-' + stem + '-' + sched.N + 'f-' + size.w + 'x' + size.h + '-' + stamp(new Date()) + '.zip', taken);
        blob = makeBlob(zip, 'application/zip');
      }

      /* `ok` means THE THING THAT WAS ASKED FOR CAME OUT.  A stopped run's frames are every bit as exact as a
         finished one's — and there are fewer of them than the caller asked for, so it is `partial`, not `ok`. */
      const ok = !err && !aborted && !stopped && delivered === N;
      return {
        ok, partial: !!(stopped && delivered > 0), error: err, aborted, stopped, refused: false,
        frames: delivered, requested: N, w: size.w, h: size.h, fps, mode: sched.mode,
        schedule: sched, plan: P, files: o.onFrame ? [] : files, manifest: man, blob, name,
        bytes: bytesOut, ffmpeg, cost, pins, contended,
        report: {
          elapsedMs: elapsed, msPerFrame: medMs, human: humanMs(elapsed) + ' for ' + delivered + ' frames (' + humanMs(medMs) + ' each) · ' + humanBytes(bytesOut),
          note: 'the elapsed time is a REPORT of how long this machine took. It was not an input to any picture: every frame was rendered at a scheduled logical time, and the same schedule on a machine half this speed produces the same bytes.',
        },
        message: aborted
          ? 'ABORTED at frame ' + aborted.k + ' of ' + N + ' after ' + aborted.tries + ' attempts — ' + aborted.why.join(' · ') + '. The frames before it are exact and are returned; nothing here will emit a frame it cannot vouch for.'
          : stopped ? 'STOPPED at ' + delivered + ' of ' + N + ' frames. What was rendered is exact; a deterministic render cannot be resumed from here, because the schedule is a whole — re-run it with the same options to get the same bytes.'
            : err ? 'FAILED after ' + delivered + ' frames: ' + err
              : delivered + ' frames · ' + size.w + '×' + size.h + ' · ' + sched.mode.toUpperCase() + ' · ' + humanBytes(bytesOut) + ' · rendered in ' + humanMs(elapsed) + '. ' + (def.reproducible ? 'The FILE bytes are reproducible.' : 'The PIXELS are exact; the PNG container\'s compression is the browser\'s, so compare the per-frame digests.'),
      };
    })();
    return { stop() { stopped = true; }, get stopped() { return stopped; }, done };
  }

  function restore(before, pins, delivered = 0) {
    try {
      const f = field();
      if (canvas && before.canvasW) { canvas.width = before.canvasW; canvas.height = before.canvasH; }
      if (LW.quality && before.qAuto !== null) { LW.quality.auto = before.qAuto; LW.quality.scale = before.qScale; }
      if (LW.camera && before.camAuto !== null) LW.camera.autoRotate = before.camAuto;
      if (LW.governor && before.gov !== null) LW.governor.on = before.gov;
      /* the diagnostic counter, put back honestly: the frames really did happen (capture.js' rule) */
      if (f && f.stats) f.stats.presents = before.presents + delivered;
      if (before.modPlaying && LW.mod && LW.mod.play) LW.mod.play();
      if (before.modPhases && LW.mod && LW.mod.model) {
        LW.mod.model.restorePhases(before.modPhases);
        for (const [id, shadow] of before.modShadows) { const source=LW.mod.model.sourceOf(id); if(source) Object.assign(source, shadow); }
        Object.assign(LW.mod.model.transport, before.modTransport);
        LW.mod.model.reanchorTransport(null);
        LW.mod.clock.applyAll(false);
      }
      if (LW.clock) { LW.clock.scrub(before.t); if (LW.clock.setRate) LW.clock.setRate(before.rate); }
      if (before.playing && LW.play) LW.play();
      if (canvas && before.cfg !== 'copy') configure(false);
      if (LW.schedule && LW.TIER) LW.schedule(LW.TIER.PRESENT);   // the screen goes back to showing the lab
    } catch (_) { /* a restore must never be the thing that throws */ }
  }
  const safe = (fn) => { try { return fn(); } catch (_) { return null; } };
  const median = (a) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[s.length >> 1]; };
  function progressOf(doneN, N, wall0, ring, bytes, size) {
    const el = now() - wall0, med = median(ring), left = (N - doneN) * med;
    return {
      done: doneN, total: N, fraction: doneN / N, elapsedMs: el, msPerFrame: med, etaMs: left,
      bytes, projectedBytes: doneN ? bytes * N / doneN : 0,
      human: doneN + ' / ' + N + ' · ' + humanMs(el) + ' elapsed · ' + (doneN >= 3 ? humanMs(left) + ' left' : 'measuring…') + ' · ' + humanBytes(bytes),
      note: doneN >= 3 ? 'measured on this machine' : 'the estimate is the table\'s until three frames are in',
      size,
    };
  }
  function makeBlob(bytes, type) {
    if (typeof Blob === 'function') return new Blob([bytes], { type });
    return { bytes, type, size: bytes.length };            // node: the proof gets the bytes
  }

  /* ── THE DETERMINISM SELF-TEST ─────────────────────────────────────────────────────────────────────────── */

  /**
   * RENDER THE SAME SHORT SCHEDULE TWICE AND COMPARE THE DIGESTS.  The headline claim, checked in the browser in
   * about a second, at a size nobody has to wait for.  A mismatch names the frame and hands back both digests.
   */
  async function verify(o = {}) {
    const frames = o.frames || 6, width = o.width || 160;
    const P = plan(Object.assign({ frames, width }, o));
    if (!P.ok) return { ok: false, refused: true, plan: P, error: P.message };
    const run = (extra) => render(Object.assign({ schedule: P.schedule, width, digestFrames: true }, o, extra)).done;
    const a = await run({});
    const b = await run({});
    if (!a.ok || !b.ok) return { ok: false, error: (a.error || b.error || 'a run did not complete'), a, b };
    const da = a.manifest.frames.map((x) => x.digest), db = b.manifest.frames.map((x) => x.digest);
    const bad = [];
    for (let i = 0; i < Math.max(da.length, db.length); i++) if (da[i] !== db[i]) bad.push({ k: i, a: da[i], b: db[i] });
    return {
      ok: bad.length === 0 && da.length === frames, frames: da.length, digests: da, mismatches: bad,
      elapsedMs: a.report.elapsedMs + b.report.elapsedMs,
      message: bad.length === 0
        ? 'DETERMINISTIC: ' + da.length + ' frames rendered twice, every digest identical.'
        : bad.length + ' of ' + da.length + ' frames differ between two runs of the SAME schedule — ' + JSON.stringify(bad.slice(0, 4)) + '. Something in the picture\'s input closure is not pinned; run hazards() and read the witnesses in the manifest.',
    };
  }

  /** the download.  Takes anything with { blob, name }. */
  function save(r) {
    if (!r || !r.blob || typeof document === 'undefined') return false;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(r.blob); a.download = r.name || 'lambdawaves.bin';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return true;
  }

  return {
    plan, render, verify, hazards, save, limits, sizeFor,
    get names() { return taken; }, canvas,
    /** the pure laws, re-exported on the instance so a caller needs one import */
    laws: { exactSchedule, endpointLaw, arithmeticLaw, planExact, foldOrigin, estimate, digest, manifest, zipStored, offsetOf, ulpsBetween, HAZARDS, COST_TABLE },
  };
}
