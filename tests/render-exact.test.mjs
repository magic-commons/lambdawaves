/* tests/render-exact.test.mjs — the node proof of THE FILM'S FRAME AND ITS SCHEDULE (re-aimed at 0.5.0 C7's seam).
 *   node tests/render-exact.test.mjs
 *
 * What is proved here, and what is not:
 *
 *   PROVED — the endpoint decision, for BOTH modes, DECIDED rather than asserted: the loop's is judged against
 *   the real density of a real two-mode hydrogen state (the endpoint frame is frame 0 again, to a part in 10^15
 *   of one frame's own step), and the span's against the same density (t1 is a different state, and dropping it
 *   loses a real gap of motion).  The arithmetic of the offset, re-measured against exact rational arithmetic in
 *   BigInt.  The fold of the origin, and how much precision it buys.  The cost (the kit's estimate on λWAVES' seed).
 *   The digest.
 *
 *   AND THE SEAM THAT REMAINS: since 0.5.0 C7 a film is MIR's `createRecorder` handed λWAVES' `frame(i, ctx)`.  Here
 *   the KIT'S OWN RECORDER (lab/mir/render/recorder.js, unchanged, in node with a canvas stand-in that encodes PNG
 *   frames through capture.js' encoder and no file system, so the run keeps its frames in memory) drives λWAVES'
 *   frame against a FAKE LAB that REPRODUCES EVERY HAZARD: its fake shader reads the jitter counter, its fake governor
 *   drops the grid when frames run long, its fake AUTO SCALE moves the canvas, its fake rack loop interlopes (H₂'s impure field, H7,
 *   left with its window in 0.5.0 D9b).  The DRIVEN modulation is the kit's real host and record clock.  So "the same schedule
 *   twice is byte-identical" and "a slow machine gives the same pixels as a fast one" are real tests, and EVERY PIN
 *   IS REMOVED IN TURN (`unpin`) to show the test that guards it goes RED without it.
 *
 *   NOT PROVED HERE — anything that needs a GPU, a WebCodecs encoder or a real canvas.  §12 lists the browser's half.
 */
import zlib from 'node:zlib';
import {
  ENDPOINT, MODES, DEFAULTS, HAZARDS, HAZARD_IDS, MS_FLOOR, MS_PER_MPX,
  offsetOf, ulpsBetween, ulpOf, arithmeticLaw, foldOrigin,
  exactSchedule, endpointLaw, planExact, estimate,
  digest, manifest, createFilm, FILM_FPS,
} from '../lab/render-exact.js';
import * as CAP from '../lab/capture.js';
import { densityPeriod } from '../lab/period.js';
import { BASIS, psiAt } from '../lab/hydrogen.js';
import { createModHost, model as MODEL } from '../lab/mir/modulation/host.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail, (k, v) => (typeof v === 'number' && !Number.isFinite(v)) ? String(v) : v).slice(0, 420)));
}
const En = (n) => -0.5 / (n * n);

/* ── a real observable: the density of 1s + 2s at a point, exactly ────────────────────────────────────────────
   c_a(t) = c_a(0) e^{−iE_a t}; rho(r,t) = |Σ c_a phi_a(r)|².  This is the function the endpoint rule is judged
   against, so "the endpoint frame is frame 0 again" is a measurement of the physics, not an argument. */
const IDS = (() => { const f = (n, l, m) => BASIS.findIndex((b) => b.n === n && b.l === l && b.m === m); return [f(1, 0, 0), f(2, 0, 0)]; })();
const E12 = [En(1), En(2)];
function rhoAt(t, x = 0.7, y = 0.2, z = 1.1) {
  const re = new Float64Array(BASIS.length), im = new Float64Array(BASIS.length);
  const c0 = [Math.SQRT1_2, Math.SQRT1_2];
  for (let i = 0; i < IDS.length; i++) {
    const ph = -E12[i] * t;
    re[IDS[i]] = c0[i] * Math.cos(ph); im[IDS[i]] = c0[i] * Math.sin(ph);
  }
  const p = psiAt(re, im, x, y, z, IDS);
  return p.re * p.re + p.im * p.im;
}
const D12 = densityPeriod(E12);          // T_rho = 2 pi / |E2 − E1| = 16.755160819145562

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════
   §1 — THE ARITHMETIC OF THE OFFSET, RE-MEASURED
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
{
  /* THE THEOREM.  (D/D)·L is exactly L for every finite non-zero D and every finite L, because IEEE-754 division
     of a number by itself is exactly 1.0 and 1.0·L is exactly L.  Run it over a wide sweep rather than assert it. */
  let s = 12345; const rnd = () => (s = (1103515245 * s + 12345) % 2147483648) / 2147483648;
  const cases = [];
  for (let i = 0; i < 4000; i++) cases.push([Math.exp(rnd() * 20 - 6), 1 + Math.floor(rnd() * 2000)]);
  cases.push([45238.93, 601], [D12.T, 180], [D12.T, 601], [212.46659503691100, 361]);
  let closeDiv = 0, closeStep = 0, closeScale = 0, closeAcc = 0;
  const stepFails = [];
  for (const [L, D] of cases) {
    const A = arithmeticLaw({ L, D });
    if (A.forms['divide-first  (k/D)*L'].closes) closeDiv++;
    if (A.forms['step-first    k*(L/D)'].closes) closeStep++; else if (stepFails.length < 3) stepFails.push({ L, D, err: A.forms['step-first    k*(L/D)'].err });
    if (A.forms['scale-first   (L*k)/D'].closes) closeScale++;
    if (A.forms['accumulate    sum L/D'].closes) closeAcc++;
  }
  judge('THE OFFSET FORM IS off(k) = (k/D)*L, AND THAT IS A THEOREM ABOUT THE FORMAT, NOT A MEASUREMENT: D/D is exactly 1.0 for every finite non-zero D and 1.0*L is exactly L, so the last frame lands on the intended value to the last BIT. It closes in every one of ' + cases.length + ' cases. The step form k*(L/D) does not: it fails about one time in ten',
    closeDiv === cases.length && closeStep < cases.length && closeStep > 0.8 * cases.length && closeAcc < 0.2 * cases.length,
    { of: cases.length, closes: { 'divide (k/D)*L': closeDiv, 'step k*(L/D)': closeStep, 'scale (L*k)/D': closeScale, 'accumulate': closeAcc }, stepFailures: stepFails });

  /* capture.js' header cites T = 45238.93, N = 601 as the counterexample to k*(T/N).  It is not one.  Verifying
     rather than copying was the instruction, and this is what verifying bought. */
  const cited = arithmeticLaw({ L: 45238.93, D: 601 });
  const real = arithmeticLaw({ L: 212.46659503691100, D: 361 });
  const acc = arithmeticLaw({ L: D12.T, D: 180 });
  judge('THE CONCLUSION SURVIVES AND THE EVIDENCE QUOTED FOR IT DOES NOT. capture.js says the step form "lands 7.3e-12 away from the period" at T = 45238.93, N = 601: BOTH forms land on T to the last bit there, and so does the 1s+2s period at N = 180. A REAL counterexample is L = 212.46659503691100, D = 361, off by 2.8e-14 — one ulp. What does drift at those numbers is the TRUE accumulator, t += dt taken D times, which misses the 1s+2s period by 33 ulps at N = 180',
    cited.forms['step-first    k*(L/D)'].closes === true
    && cited.forms['divide-first  (k/D)*L'].closes === true
    && real.forms['step-first    k*(L/D)'].closes === false && real.forms['divide-first  (k/D)*L'].closes === true
    && acc.forms['accumulate    sum L/D'].closes === false && acc.forms['accumulate    sum L/D'].ulps > 8,
    { cited: { L: 45238.93, D: 601, step: cited.forms['step-first    k*(L/D)'].err, divide: cited.forms['divide-first  (k/D)*L'].err },
      real: { L: 212.466595036911, D: 361, stepErr: real.forms['step-first    k*(L/D)'].err, stepUlps: real.forms['step-first    k*(L/D)'].ulps },
      accumulator: { L: +D12.T.toFixed(9), D: 180, err: acc.forms['accumulate    sum L/D'].err, ulps: acc.forms['accumulate    sum L/D'].ulps } });

  /* and in the MIDDLE the two forms are a wash — which is why the endpoint carries the whole argument */
  let winA = 0, winB = 0, tie = 0;
  for (const [L, D] of cases.slice(0, 800)) {
    if (D < 8) continue;
    const m = arithmeticLaw({ L, D, samples: 7 }).middle;
    winA += m['divide-first  (k/D)*L']; winB += m['step-first    k*(L/D)']; tie += m.tie;
  }
  judge('IN THE MIDDLE NEITHER FORM IS SYSTEMATICALLY NEARER — measured against exact rational arithmetic in BigInt, not against each other. Both carry two roundings and the wins are within a few percent over thousands of comparisons, most of them ties. THE ENDPOINT IS THE ENTIRE ARGUMENT for the choice, and it is a theorem',
    winA > 0 && winB > 0 && Math.abs(winA - winB) < 0.35 * (winA + winB) && tie > winA + winB,
    { divideNearer: winA, stepNearer: winB, tie });
}

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════
   §2 — THE ENDPOINT, DECIDED AGAINST A REAL DENSITY, FOR BOTH MODES
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
{
  const N = 180, T = D12.T;
  const L = endpointLaw({ mode: 'loop', T, t0: 3.25, N, f: rhoAt });
  const dup = L.inclusive.duplicateRatio;                // |rho(t0+T) − rho(t0)| over one frame's own step
  judge('A LOOP IS A CIRCLE, SO ITS ENDPOINT IS DROPPED — AND THE PROOF IS A MEASUREMENT OF THE DENSITY, NOT AN ARGUMENT ABOUT PHASES. rho(t0+T) = rho(t0) for the exact period of a real 1s+2s state, so the inclusive schedule\'s last frame is frame 0 again: it differs from the first by ' + dup.toExponential(2) + ' of ONE FRAME\'S OWN STEP. Keeping it holds that image for two frame times at the join — its wrap gap is 0 while every other gap is T/N — and stretches one period over (N+1)/fps. The exclusive schedule\'s gaps are ALL T/N, the wrap included',
    L.chosen === 'exclusive' && ENDPOINT.loop === 'exclusive'
    && L.exclusive.frames === N && L.inclusive.frames === N + 1
    && L.inclusive.duplicatesFirst === true && dup < 1e-9
    && Math.min(...L.inclusive.gaps) === 0 && Math.min(...L.exclusive.gaps) > 0
    && L.exclusive.uniform === true,
    { N, T: +T.toFixed(9), duplicateRatio: dup, frameStep: L.inclusive.frameStep, inclusiveMinGap: Math.min(...L.inclusive.gaps), exclusiveGapSpread: L.exclusive.maxGap - L.exclusive.minGap });

  const S = endpointLaw({ mode: 'span', span: 7.5, t0: 3.25, N, f: rhoAt });
  const missed = S.exclusive.shortfall;
  judge('A SPAN IS A SEGMENT, SO ITS ENDPOINT IS KEPT — THE OPPOSITE RULE, AND THE SAME KIND OF PROOF. t0 and t1 are two DIFFERENT states of the same 1s+2s register (the density differs by ' + Math.abs(S.inclusive.fLast - S.inclusive.fFirst).toExponential(2) + ', ' + S.inclusive.duplicateRatio.toFixed(1) + ' frame-steps apart), so there is no duplicate to avoid. The inclusive schedule\'s last frame IS t1 to the last bit; the exclusive one stops ' + missed.toPrecision(4) + ' a.u. short and never renders the state the caller asked to end on',
    ENDPOINT.span === 'inclusive' && S.chosen === 'inclusive'
    && S.inclusive.reachesEnd === true && S.inclusive.last === 3.25 + 7.5
    && S.inclusive.duplicateRatio > 1 && Math.abs(missed - S.inclusive.gaps[0]) < 1e-12
    && S.inclusive.uniform === true,
    { N, span: 7.5, reaches: S.inclusive.reachesEnd, shortfall: missed, oneGap: S.inclusive.gaps[0], duplicateRatio: +S.inclusive.duplicateRatio.toFixed(3) });

  /* the two rules produce two different tempos from the same request, and each one is right for its mode */
  const loopS = exactSchedule({ mode: 'loop', T, fps: 30, frames: 180 });
  const spanS = exactSchedule({ mode: 'span', span: T, fps: 30, frames: 180 });
  judge('THE TEMPO ARITHMETIC DIFFERS TOO, AND THE SCHEDULE REPORTS THE RIGHT ONE FOR EACH MODE. A loop of 180 frames covers its period in 180 gaps, so the motion and the clip are both 6.000 s; a span of 180 frames covers the same interval in 179 gaps, so the motion is 5.967 s inside a 6.000 s clip. Reading one mode\'s arithmetic onto the other is a half-frame tempo error every lap',
    loopS.D === 180 && spanS.D === 179
    && Math.abs(loopS.motionSeconds - 6) < 1e-12 && Math.abs(loopS.seconds - 6) < 1e-12
    && Math.abs(spanS.motionSeconds - 179 / 30) < 1e-12 && Math.abs(spanS.seconds - 6) < 1e-12
    && Math.abs(loopS.rate - T / 6) < 1e-12 && Math.abs(spanS.rate - T * 30 / 179) < 1e-12,
    { loop: { D: loopS.D, motion: loopS.motionSeconds, clip: loopS.seconds, rate: +loopS.rate.toFixed(6) },
      span: { D: spanS.D, motion: +spanS.motionSeconds.toFixed(6), clip: spanS.seconds, rate: +spanS.rate.toFixed(6) } });
}

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════
   §3 — THE SCHEDULE'S OWN EXACTNESS, AND THE FOLD THAT RESTORES IT AT A DEEP t0
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
{
  const T = D12.T;
  let allExact = true, allDistinct = true;
  for (const N of [1, 2, 7, 30, 120, 180, 181, 601, 900, 3600]) {
    for (const t0 of [0, 3.25, 100.5]) {
      const s = exactSchedule({ mode: 'loop', T, t0, fps: 30, frames: N });
      if (s.off(s.D) !== T) allExact = false;
      if (N > 1 && !s.distinct) allDistinct = false;
    }
  }
  judge('THE SCHEDULE CLOSES AT EVERY N AND EVERY ORIGIN TRIED: off(D) is the period to the last bit (0 ulps) for N from 1 to 3600, and no two frames of a schedule ever land on the same time',
    allExact && allDistinct, { Ns: [1, 2, 7, 30, 120, 180, 181, 601, 900, 3600], origins: [0, 3.25, 100.5] });

  /* THE OFFSET IS EXACT; THE ADDITION IS NOT.  This is the honest limit, and it is measurable. */
  const near = exactSchedule({ mode: 'loop', T, t0: 0, fps: 30, frames: 180 });
  const deep = exactSchedule({ mode: 'loop', T, t0: 45238.93, fps: 30, frames: 180 });
  const folded = exactSchedule({ mode: 'loop', T, t0: 45238.93, fps: 30, frames: 180, foldT0: true });
  judge('THE OFFSET IS EXACT AND THE SUM t0 + off IS NOT, AND AT A DEEP ORIGIN THE SUM IS WHAT BINDS. The gaps are within ' + near.worstGapUlps.toFixed(1) + ' ulp of the TIME at either origin — the rounding is already minimal — but ulp(t) grows with t0 while T/N does not, so the same one-ulp wobble is ' + near.worstGapRel.toExponential(1) + ' of a gap at t0 = 0 and ' + deep.worstGapRel.toExponential(1) + ' at t0 = 45238.93, ' + Math.round(deep.worstGapRel / near.worstGapRel) + 'x coarser. THE FIX IS THE FOLD: t0 mod T is the same point of the circle and gives the arithmetic back',
    near.worstGapUlps < 3 && deep.worstGapUlps < 3 && deep.endpointExact === true
    && deep.worstGapRel > 1000 * near.worstGapRel
    && folded.folded === true && folded.foldLaps === 2699
    && folded.worstGapRel < 10 * near.worstGapRel && folded.foldGain >= 1024,
    { atZero: { ulpsOfT: +near.worstGapUlps.toFixed(2), rel: near.worstGapRel },
      deep: { ulpsOfT: +deep.worstGapUlps.toFixed(2), rel: deep.worstGapRel, coarserBy: Math.round(deep.worstGapRel / near.worstGapRel) },
      folded: { t0: folded.t0, laps: folded.foldLaps, rel: folded.worstGapRel, precisionGain: folded.foldGain } });

  const f = foldOrigin(45238.93, T);
  judge('AND THE FOLD IS THE SAME POINT OF THE CIRCLE, NOT AN APPROXIMATION OF IT: t0 − laps*T lands inside [0, T), the density there agrees with the density at the un-folded origin to ' + Math.abs(rhoAt(f.t0) - rhoAt(45238.93)).toExponential(2) + ' (the residue is the 2699 laps\' worth of rounding in t itself, not the fold\'s), and ulp(t) drops by ' + f.gain + 'x',
    f.folded === true && f.t0 >= 0 && f.t0 < T && f.laps === 2699
    && Math.abs(rhoAt(f.t0) - rhoAt(45238.93)) < 1e-6 * Math.max(1e-12, rhoAt(f.t0))
    && f.ulpAfter < f.ulpBefore,
    { t0: f.t0, laps: f.laps, rhoFolded: rhoAt(f.t0), rhoDeep: rhoAt(45238.93), ulpBefore: f.ulpBefore, ulpAfter: f.ulpAfter });
}

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════
   §4 — A STATE WITH NO EXACT PERIOD IS REFUSED OR LABELLED, NEVER SILENTLY LOOPED
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
{
  const good = planExact(D12, { mode: 'loop', fps: 30, seconds: 6, observable: 'density', energies: E12, t0: 0 });
  /* AN INCOMMENSURATE SPECTRUM NEEDS THREE ENERGIES, and that is worth saying: with two, there is exactly ONE
     difference and a single difference is always its own gcd, so EVERY two-mode state has an exact period. The
     refusal only has anything to refuse from three modes up. */
  const badE = [-0.5, -0.4, -0.5 + 0.1 * Math.SQRT2];
  const badP = densityPeriod(badE);
  const refused = planExact(badP, { mode: 'loop', fps: 30, seconds: 6, observable: 'density', energies: badE, t0: 0 });
  const allowed = planExact(badP, { mode: 'loop', fps: 30, seconds: 6, observable: 'density', energies: badE, t0: 0, allowNear: true });
  const none = planExact({ exact: false, T: 0, stark: true }, { mode: 'loop', fps: 30, seconds: 6, t0: 0 });
  judge('A STATE WITH NO EXACT PERIOD IS REFUSED, WITH THE NEAR-RECURRENCE AND ITS SEAM RECOMPUTED FROM THE ENERGIES — and a caller who wants it anyway gets it back labelled NEAR and never LOOP. A Stark spectrum, with no near-recurrence to offer either, is refused outright. A commensurate state is EXACT and closes',
    good.ok && good.kind === 'exact' && good.closes === true && good.seamError === 0
    && refused.ok === false && refused.kind === 'near' && refused.seamError > 1e-6 && /NO EXACT PERIOD/.test(refused.message)
    && allowed.ok === true && allowed.kind === 'near' && allowed.label === 'NEAR' && allowed.closes === false
    && none.ok === false && none.kind === 'none' && /NO EXACT PERIOD/.test(none.message),
    { exact: { kind: good.kind, N: good.N, T: +good.T.toFixed(6) },
      refused: { ok: refused.ok, kind: refused.kind, seam: refused.seamError },
      allowNear: { ok: allowed.ok, label: allowed.label, closes: allowed.closes },
      stark: { ok: none.ok, kind: none.kind } });

  /* A SPAN NEVER REFUSES — any interval can be rendered — but it says whether it closes, so a span that happens
     to be a whole number of periods is not passed off as a loop and a loop's seam is not passed off as a span. */
  const spanOpen = planExact(null, { mode: 'span', t0: 0, span: 7.5, fps: 30, frames: 180, energies: E12 });
  const spanClosed = planExact(null, { mode: 'span', t0: 0, span: D12.T, fps: 30, frames: 180, energies: E12 });
  judge('A SPAN NEVER REFUSES, BECAUSE ANY INTERVAL CAN BE RENDERED — AND IT STILL SAYS WHETHER IT CLOSES. A 7.5 a.u. span of 1s+2s does not (the worst pair is ' + spanOpen.seamError.toPrecision(3) + ' of a turn from returning, which is correct for a span and would be a seam in a loop); a span of exactly one density period does, and says so, and says it would want one frame fewer as a loop',
    spanOpen.ok && spanOpen.kind === 'span' && spanOpen.label === 'SPAN' && spanOpen.closes === false && spanOpen.seamError > 0.1
    && spanClosed.ok && spanClosed.closes === true && /CLOSES/.test(spanClosed.message)
    && spanOpen.schedule.endpoint === 'inclusive',
    { open: { closes: spanOpen.closes, seam: spanOpen.seamError }, closed: { closes: spanClosed.closes, seam: spanClosed.seamError } });

  /* the FOLD is refused where it would be a lie: at T_rho only the DENSITY returns */
  const phase = planExact(D12, { mode: 'loop', fps: 30, seconds: 6, observable: 'phase', energies: E12, t0: 45238.93, foldT0: true });
  const dens = planExact(D12, { mode: 'loop', fps: 30, seconds: 6, observable: 'density', energies: E12, t0: 45238.93, foldT0: true });
  judge('THE ORIGIN IS FOLDED ONLY WHERE FOLDING IS TRUE. At T_rho the DENSITY returns and the density view may fold; arg psi does NOT — psi(t+T_rho) = e^{i phi} psi(t) — so a phase view looping at T_rho is REFUSED the fold and told why, rather than silently rendered at a different hue',
    dens.foldApplied === true && dens.foldAllowed === true
    && phase.foldApplied === false && phase.foldAllowed === false && /CANNOT BE FOLDED/.test(phase.foldNote),
    { density: { allowed: dens.foldAllowed, applied: dens.foldApplied, t0: dens.schedule.t0 },
      phase: { allowed: phase.foldAllowed, applied: phase.foldApplied, usedPeriod: phase.usedPeriod, t0: phase.schedule.t0 } });
}

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════
   §5 — THE COST AND THE DIGEST
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
{
  const big = estimate({ w: 8192, h: 8192, frames: 600 });
  const hd = estimate({ w: 1920, h: 1080, frames: 600 });
  const meas = estimate({ w: 1920, h: 1080, frames: 600, msPerFrame: 812 });
  const mp4 = estimate({ w: 1920, h: 1080, frames: 600, fps: 30, format: 'mp4' });
  judge('NOBODY SHOULD START A 600-FRAME 8192² FILM WITHOUT BEING TOLD IT IS ' + big.human.split(' · ').slice(2).join(' and ') + '. The estimate is the KIT\'S (render/plan.js estimateFilm, its run ceiling) on λWAVES\' own seed — ' + MS_FLOOR + ' ms + ' + MS_PER_MPX + ' ms per Mpx, capture.js\' six measured points — until this device has measured its own; it says which, and an MP4\'s size is the kit\'s bitrate law while PNG frames are lossless and unknowable before',
    big.measured === false && /seed/.test(big.basis) && big.totalMs > 80 * 60 * 1000 && big.totalMs < 100 * 60 * 1000
    && /LONGER/.test(big.warning) && hd.totalMs < big.totalMs / 15 && hd.warning === ''
    && meas.measured === true && /measured/.test(meas.basis) && meas.totalMs === 812 * 600
    && mp4.bytes > 0 && big.bytes === null,
    { at8192: big.human, at1080p: hd.human, warning: big.warning.slice(0, 80), measured: meas.human, mp4: mp4.human });

  const a = new Uint8Array(4096), b = new Uint8Array(4096);
  for (let i = 0; i < 4096; i++) { a[i] = (i * 37) & 255; b[i] = (i * 37) & 255; }
  const d1 = digest(a), d2 = digest(b);
  b[2048] ^= 1;
  const d3 = digest(b);
  const swapped = Uint8Array.from(a); const t0 = swapped[10]; swapped[10] = swapped[11]; swapped[11] = t0;
  judge('THE DIGEST IS 64 BITS OVER A FRAME\'S PIXELS — OURS, NOT THE KIT\'S CONTAINER — so two films are compared without keeping a gigabyte of pixels. Identical input gives an identical digest; one flipped BIT in four kilobytes changes it; so does transposing two adjacent bytes, which a checksum would miss',
    d1 === d2 && d1 !== d3 && d1 !== digest(swapped) && d1.length === 16,
    { same: d1, oneBitFlipped: d3, twoBytesSwapped: digest(swapped) });
}
function readZip(z) {
  const dv = new DataView(z.buffer, z.byteOffset, z.byteLength);
  const dec = new TextDecoder();
  const out = [];
  let p = 0;
  while (p + 4 <= z.length && dv.getUint32(p, true) === 0x04034b50) {
    const method = dv.getUint16(p + 8, true), crc = dv.getUint32(p + 14, true);
    const csize = dv.getUint32(p + 18, true), usize = dv.getUint32(p + 22, true);
    const nlen = dv.getUint16(p + 26, true), elen = dv.getUint16(p + 28, true);
    const name = dec.decode(z.subarray(p + 30, p + 30 + nlen));
    const data = z.subarray(p + 30 + nlen + elen, p + 30 + nlen + elen + csize);
    if (method !== 0 || csize !== usize) throw new Error('not a stored entry');
    out.push({ name, bytes: data, crcOk: (zlib.crc32 ? zlib.crc32(Buffer.from(data)) : crc) === crc });
    p += 30 + nlen + elen + csize;
  }
  if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('no central directory where one should be');
  return out;
}

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════
   §6 — THE FAKE LAB, AND THE KIT'S RECORDER IN NODE.  The lab reproduces every hazard, so the frame's pins are tested
   and not merely written; the recorder is MIR's own, unchanged, on a canvas stand-in.
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

/* THE CANVAS STAND-IN the kit's recorder draws on in node: a frame handed back as RGBA reaches it only through the PNG
   road (putImageData, then toBlob), and toBlob encodes it through capture.js' own encoder with STORED deflate — so a
   frame's file is a pure function of its pixels.  No file system is handed over (`storage: {}`): the run keeps its
   frames in memory, which is the kit's own fallback. */
globalThis.ImageData = globalThis.ImageData || class ImageData { constructor(data, width, height) { this.data = data; this.width = width; this.height = height; } };
function standInCanvas() {
  const c = { width: 0, height: 0, img: null,
    getContext: () => ({ globalCompositeOperation: 'source-over', fillStyle: '#000', fillRect() {}, drawImage() {}, putImageData(img) { c.img = img; },
      getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }) }),
    toBlob(cb, type) {
      const im = c.img;
      CAP.encodePNG(new Uint8Array(im.data.buffer, im.data.byteOffset, im.data.length), im.width, im.height, { deflate: CAP.zlibStored })
        .then((png) => cb(new Blob([png], { type: type || 'image/png' })));
    } };
  return c;
}
if (!globalThis.document) globalThis.document = { createElement: () => standInCanvas(), addEventListener() {}, removeEventListener() {}, hidden: false };
const NOCALIB = { read: () => null, write() {} };

/**
 * A lab whose "shader" reads exactly what the real one does — the mode coefficients at t, the observer, the
 * material, the domain half-width, the grid resolution, the canvas size and the jitter word — and whose rack
 * misbehaves exactly where rack.js does:
 *   · a GOVERNOR that steps the grid down when the fake wall clock says frames are slow
 *   · an AUTO SCALE that moves the canvas size on the same reading
 *   · a MODULATION clock that writes into `mat` from the fake wall clock while it is running
 *   · a RACK LOOP that interlopes mid-frame, presenting once with an unpinned seed
 */
function fakeLab({ msPerFrame = 5, governor = true, autoScale = true, modulation = false, camera = null, presents = 0 } = {}) {
  const RES_LADDER = [64, 96, 128];
  const stats = { presents, generation: 0 };
  let wall = 0;                                   // the FAKE machine's clock. The frame must never read it.
  const clock = { t: 0, rate: 4, playing: false, pause() { this.playing = false; }, play() { this.playing = true; }, scrub(t) { this.t = t; } };
  const quality = { res: 96, steps: 160, scale: 1, auto: autoScale, autoScale: 1, minScale: 0.35 };
  const gov = { on: governor, drop: 0 };
  const domain = { half: 12, auto: true };
  const obs = { yaw: 0.65, pitch: 0.38, dist: 3.3, fov: 0.6 };
  const mat = { view: 0, exposure: 1, softness: 0.5, style: 0, dither: 0.5, steps: 160 };
  const cam = Object.assign({ dy: 0, dp: 0, autoRotate: false, get moving() { return this.dy !== 0 || this.dp !== 0; } }, camera || {});   // 018 B4: AUTO-ROTATE holds a fling (μ read as 0)
  const mod = { _running: modulation, _phase: 0, get running() { return this._running; }, get playing() { return this._running; },
    host: {}, stop() { this._running = false; }, play() { this._running = true; },
    _wallTick(dw) { if (this._running) { this._phase += dw; mat.exposure = 1 + 0.5 * Math.sin(2 * Math.PI * this._phase); } } };
  const canvas = { width: 320, height: 200, getContext() { return null; } };
  /* rack.js' effectiveRes, to the line: the ladder entry `drop` notches below the one the user set */
  const effectiveRes = () => { if (!gov.drop) return quality.res; let i = RES_LADDER.findIndex((r) => r >= quality.res); if (i < 0) i = RES_LADDER.length - 1; return RES_LADDER[Math.max(0, i - gov.drop)]; };
  const field = {
    ok: true, stats, format: 'bgra8unorm', gamut: 'srgb',
    get resolution() { return effectiveRes(); },
    device: { limits: { maxTextureDimension2D: 8192, maxBufferSize: 268435456 } },
    frame() { stats.generation++; stats.presents++; },
    present() { stats.presents++; },                   // a PRESENT with no reconstruct: the capped field clock
  };
  /* THE RACK LOOP, exactly as rack.js' is: it reads the WALL clock, judges the machine, and moves the picture's
     inputs while it does.  Everything it touches is something the frame has to pin. */
  function rackFrame() {
    wall += msPerFrame;
    mod._wallTick(msPerFrame / 1000);
    /* the governor judges ONLY while the transport plays, and pausing resets its drop — rack.js' own two lines */
    if (gov.on && clock.playing && msPerFrame > 28) gov.drop = Math.min(2, gov.drop + 1);
    if (!clock.playing && gov.drop) gov.drop = 0;
    if (quality.auto && msPerFrame > 28) quality.autoScale = Math.max(0.35, quality.autoScale - 0.1);
    canvas.width = Math.round(320 * quality.scale * (quality.auto ? quality.autoScale : 1));
    canvas.height = Math.round(200 * quality.scale * (quality.auto ? quality.autoScale : 1));
    field.frame();                                     // presents with WHATEVER seed is in the counter
  }
  const LW = {
    clock, quality, domain, obs, mat, field, camera: cam, mod,
    governor: { get on() { return gov.on; }, set on(v) { gov.on = v; if (!v) gov.drop = 0; }, get drop() { return gov.drop; }, get resolution() { return field.resolution; } },
    stats: { scheduled: false, frames: 0 },
    fieldRate: { capMs: 33 },
    reg: { presetId: 'fake', populated: () => [0, 1], Ediag: (a) => E12[a], P: null },
    period: D12,
    stateDigest: () => 'fake-state',
    version: 'fake',
    modesAt(t) {
      /* the register is analytic: a pure function of t (H₂'s R-reading modes, H7, left in 0.5.0 D9b) */
      return E12.map((E) => ({ re: Math.SQRT1_2 * Math.cos(-E * t), im: Math.SQRT1_2 * Math.sin(-E * t) }));
    },
    play() { clock.playing = true; },
  };
  return { LW, canvas, field, stats, gov, quality, mod, rackFrame,
    get wall() { return wall; }, tick(ms) { wall += ms === undefined ? msPerFrame : ms; }, get msPerFrame() { return msPerFrame; } };
}

/**
 * THE FAKE READBACK: a picture that is a function of EXACTLY the real closure, and of nothing else.
 *   `interlopeAt`       a rack frame lands mid-film — ONCE, as a real one would (H9)
 *   `skipReconstructAt` the capped field clock: a PRESENT with no reconstruct, so the picture is the previous
 *                       frame's — a DUPLICATE FRAME, which is the failure the generation witness exists for (H4)
 *   `resizeAt`          the canvas is resized between the render and the readback WITHOUT a present (H3)
 */
function fakeGrabFor(lab, { interlopeAt = null, skipReconstructAt = null, resizeAt = null } = {}) {
  let interloped = false, skipped = false, resized = false, lastModes = null;
  return async ({ t, w, h, wit, k }) => {
    const { LW, field, stats } = lab;
    lab.tick();                                                        // the machine takes its time
    lab.canvas.width = w; lab.canvas.height = h;
    if (interlopeAt !== null && k === interlopeAt && !interloped) { interloped = true; lab.rackFrame(); }
    if (resizeAt !== null && k === resizeAt && !resized) { resized = true; lab.canvas.width = Math.round(w * 0.6) || 1; lab.canvas.height = Math.round(h * 0.6) || 1; }
    const seed = stats.presents % 97;                                  // H1: the shader reads the counter
    const gen0 = stats.generation;
    let modes;
    if (skipReconstructAt !== null && k === skipReconstructAt && !skipped && lastModes) {
      skipped = true; modes = lastModes; field.present();               // H4: presented, never reconstructed
    } else {
      modes = LW.modesAt(t); lastModes = modes.map((m) => ({ re: m.re, im: m.im })); field.frame();
    }
    const px = new Uint8Array(w * h * 4);
    const res = field.resolution, half = LW.domain.half, ex = LW.mat.exposure, yaw = LW.obs.yaw, cw = lab.canvas.width;
    let acc = 0; for (const m of modes) acc += m.re * 1e6 + m.im * 1e3;
    for (let i = 0; i < w * h; i++) {
      const v = Math.abs(Math.sin(acc + i * 0.017 + seed * 1.7 + res * 0.31 + half * 0.11 + ex * 2.3 + yaw * 5.1 + cw * 0.0013));
      px[i * 4] = (v * 255) & 255; px[i * 4 + 1] = (v * 65535) & 255; px[i * 4 + 2] = (v * 16777215) & 255; px[i * 4 + 3] = 255;
    }
    wit.presents = stats.presents; wit.generation = stats.generation - gen0;
    wit.canvasW = lab.canvas.width; wit.canvasH = lab.canvas.height;
    return { rgba: px, w, h };
  };
}

/** the film over a fake lab: the kit's recorder, no file system, no input guard, no device calibration */
const filmFor = (lab, o = {}, extra = {}) => createFilm(lab.LW, Object.assign({ canvas: lab.canvas, grab: fakeGrabFor(lab, o), now: () => lab.wall, energies: () => E12,
  jitterSeed: o.jitterSeed, storage: {}, calib: NOCALIB, guard: false, pauseWhileHidden: false, host: o.host ? () => o.host : undefined }, extra));
async function runFake(lab, o = {}) {
  const sched = exactSchedule({ mode: 'loop', T: D12.T, t0: 0, fps: 30, frames: o.frames || 8 });
  return filmFor(lab, o).render(Object.assign({ schedule: sched, width: 16, height: 16, format: 'png' }, o)).done;
}
const digestsOf = (r) => (r.manifest ? r.manifest.frames.map((f) => f.digest) : []);
const pix = (r) => digestsOf(r).join();
const archive = async (r) => (r.files && r.files[0] ? new Uint8Array(await r.files[0].blob.arrayBuffer()) : new Uint8Array(22));   // a failed film has no archive: an empty one, so the judgement says RED

/** the KIT'S modulation host with one LFO routed to the fake lab's exposure (MIR's own rig, tests/render.node.mjs) */
function rigFor(lab, route = true) {
  const host = createModHost({ wall: 1000, roots: ['look'] });
  host.install([{ id: 'look.exposure', label: 'EXPOSURE', map: 'linear', min: 0, max: 2, get: () => lab.LW.mat.exposure, set: (v) => { lab.LW.mat.exposure = v; } }]);
  MODEL.modReset(); MODEL.setTransport({ bpm: 120, sync: 'wall', playing: false });
  if (route) {
    const src = MODEL.addSource('lfo', { label: 'LFO', on: true, wave: 'sine', sync: true, mult: MODEL.LFO_MULT_DEFAULT, phaseOff: 0, smooth: 0 });
    const macro = MODEL.macroList()[0];
    MODEL.setMacro(macro.id, { name: 'LFO', sourceId: src.id });
    MODEL.addRoute(macro.id, 'look.exposure', 0, 0.4);
  }
  host.targets.sync();
  return host;
}

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════
   §7 — THE SAME SCHEDULE TWICE IS BYTE-IDENTICAL, THROUGH THE KIT'S RECORDER
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
{
  const a = await runFake(fakeLab({}), { frames: 8 });
  const b = await runFake(fakeLab({}), { frames: 8 });
  const c = await runFake(fakeLab({ msPerFrame: 5 }), { frames: 8, interlopeAt: 3 });
  const za = await archive(a), zb = await archive(b), entries = (() => { try { return readZip(za); } catch (_) { return []; } })();
  const pngs = entries.filter((e) => /^frame_\d{6}\.png$/.test(e.name)), rec = entries.find((e) => e.name === 'recording.json');
  const rj = rec ? JSON.parse(new TextDecoder().decode(rec.bytes)) : {};
  const ihdr = pngs.length ? new DataView(pngs[0].bytes.buffer, pngs[0].bytes.byteOffset + 16, 8) : null;
  judge('THE SAME SCHEDULE FILMED TWICE IS BYTE-IDENTICAL — THE KIT\'S ARCHIVES THEMSELVES, not just the digests: eight frames through MIR\'s own recorder land as frame_000000.png … in its stored ZIP part beside its recording.json, every CRC good, and the film\'s schedule rides in that sidecar. And a RACK FRAME LANDING MID-FILM does not change a single pixel: its witness catches it (the jitter counter reads wrong), the frame is rendered again, and the film reports how many times that happened',
    a.ok && b.ok && c.ok && a.frames === 8 && a.files.length === 1
    && Buffer.compare(Buffer.from(za), Buffer.from(zb)) === 0
    && pngs.length === 8 && entries.every((e) => e.crcOk) && ihdr && ihdr.getUint32(0) === 16 && ihdr.getUint32(4) === 16
    && rj.kind === 'lambdawaves-deterministic-png' && rj.frames === 8 && rj.app && rj.app.film && rj.app.film.schedule.mode === 'loop'
    && pix(a) === pix(b) && pix(c) === pix(a) && c.contended === 1,
    { frames: a.frames, archiveBytes: za.length, identicalArchives: Buffer.compare(Buffer.from(za), Buffer.from(zb)) === 0, entries: entries.map((e) => e.name).slice(0, 2).concat(['…', entries[entries.length - 1] && entries[entries.length - 1].name]),
      sidecar: { kind: rj.kind, frames: rj.frames, schedule: rj.app && rj.app.film && rj.app.film.schedule.mode }, contendedRetries: c.contended });

  judge('AND EVERY FRAME IS A DIFFERENT PICTURE: eight scheduled times, eight distinct digests. A schedule that silently rendered the same state twice — the capped field clock, which is what hazard H4 is — would show up here as a repeat',
    new Set(digestsOf(a)).size === 8, { digests: digestsOf(a) });

  const refused = await runFake(fakeLab({}), { frames: 8, schedule: exactSchedule({ mode: 'loop', T: D12.T, fps: 15, frames: 8 }) });
  judge('A FILM RUNS AT THE KIT\'S FRAME RATES, AND A RATE IT DOES NOT TAKE IS REFUSED BY NAME BEFORE ANYTHING RUNS: ' + FILM_FPS.join(', ') + ' fps',
    refused.ok === false && refused.refused === true && /24, 30, 48, 60/.test(refused.error) && FILM_FPS.join() === '24,30,48,60',
    { error: refused.error });
}

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════
   §8 — A SLOW MACHINE PRODUCES THE SAME PIXELS AS A FAST ONE
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
{
  const fast = await runFake(fakeLab({ msPerFrame: 4 }), { frames: 8 });
  const slowLab = fakeLab({ msPerFrame: 90 }), slowFilm = filmFor(slowLab, {});
  const slow = await slowFilm.render({ schedule: exactSchedule({ mode: 'loop', T: D12.T, t0: 0, fps: 30, frames: 8 }), width: 16, height: 16, format: 'png' }).done;
  const crawl = await runFake(fakeLab({ msPerFrame: 400 }), { frames: 8, interlopeAt: 2 });
  judge('A MACHINE A HUNDRED TIMES SLOWER PRODUCES THE SAME PIXELS. On the fake slow machine the rack\'s GOVERNOR would step the field grid down the ladder and AUTO SCALE would shrink the canvas — both of which change the picture. Paused-and-off, they do neither, and the schedule is identical because it never read a clock at all',
    fast.ok && slow.ok && crawl.ok && pix(fast) === pix(slow) && pix(crawl) === pix(fast)
    && fast.schedule.times.join() === slow.schedule.times.join(),
    { sameDigests: pix(fast) === pix(slow), sameTimes: fast.schedule.times.join() === slow.schedule.times.join() });

  const after = slowFilm.plan({ fps: 30, frames: 8, width: 16, height: 16 });
  judge('THE TIME IT TOOK IS REPORTED AND WAS NEVER AN INPUT: the slow film says it took ' + slow.report.human + ' against the fast one\'s ' + fast.report.human + ', the next plan on that device costs its own measured milliseconds a frame instead of the seed, and the two films\' pictures are the same anyway',
    slow.report.elapsedMs > 10 * fast.report.elapsedMs && /REPORT/.test(slow.report.note) && after.cost.measured === true && pix(fast) === pix(slow),
    { fast: fast.report.human, slow: slow.report.human, nextCost: after.cost.basis });
}

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════
   §9 — EVERY PIN, REMOVED IN TURN.  A pin nobody can break is a pin nobody has checked.
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
{
  const ref = await runFake(fakeLab({}), { frames: 8 });
  const REF = pix(ref), refD = digestsOf(ref);

  /* H1 — THE JITTER.  The sharp test is not "the pixels changed" but "the film depends on the SESSION". */
  const noJitA = await runFake(fakeLab({ presents: 0 }), { frames: 8, unpin: ['jitter'] });
  const noJitB = await runFake(fakeLab({ presents: 41 }), { frames: 8, unpin: ['jitter'] });
  const pinA = await runFake(fakeLab({ presents: 0 }), { frames: 8 });
  const pinB = await runFake(fakeLab({ presents: 41 }), { frames: 8 });
  judge('PIN REMOVED · H1 THE RAY-MARCH JITTER, SEED 13. field.js seeds the march offset AND the GRAIN style\'s voxel-keep cell with (presents % 97)/97, so the picture depends on WHERE IN THE SESSION it was taken. Unpinned, two labs whose counters stand 41 frames apart film the same state as different pictures from the FIRST frame; pinned per frame, they are identical to each other and to the reference',
    noJitA.ok && noJitB.ok && pinA.ok && pinB.ok && pix(noJitA) !== pix(noJitB) && digestsOf(noJitA)[0] !== digestsOf(noJitB)[0]
    && pix(pinA) === pix(pinB) && pix(pinA) === REF && DEFAULTS.jitterSeed === 13,
    { unpinnedDiffer: pix(noJitA) !== pix(noJitB), pinnedAgree: pix(pinA) === pix(pinB), matchesReference: pix(pinA) === REF });

  /* H2 — THE GOVERNOR. */
  const govLab = fakeLab({ msPerFrame: 90, governor: true, autoScale: false });
  govLab.LW.clock.playing = true;                                    // as the lab is when the button is pressed
  const noGov = await runFake(govLab, { frames: 8, interlopeAt: 2, unpin: ['governor'] });
  const ng = digestsOf(noGov);
  judge('PIN REMOVED · H2 THE GOVERNOR — THE HEADLINE MACHINE-SPEED DEPENDENCE IN THE LAB. A median over 28 ms steps the FIELD GRID down the ladder, so a SLOW MACHINE RENDERS A COARSER VOLUME. With the clock left playing and the governor left armed, one interloping frame on the slow machine drops the grid from 96³ to 64³ and every frame after it is a picture of a different grid — and NOTHING SAYS SO',
    noGov.ok === true && govLab.gov.drop > 0 && govLab.field.resolution === 64
    && ng.slice(0, 2).join() === refD.slice(0, 2).join() && ng.slice(2).join() !== refD.slice(2).join(),
    { reportedOk: noGov.ok, drop: govLab.gov.drop, resolution: govLab.field.resolution, divergesAtFrame: ng.findIndex((d, i) => d !== refD[i]) });

  const govLab2 = fakeLab({ msPerFrame: 90, governor: true, autoScale: false });
  govLab2.LW.clock.playing = true;
  const withGov = await runFake(govLab2, { frames: 8, interlopeAt: 2 });
  judge('AND WITH THE PIN IN PLACE the same slow, contended machine films all eight frames at the grid it started on, identical to the fast machine\'s: pausing the clock is what disarms the governor, and turning it off is the belt',
    withGov.ok && withGov.frames === 8 && govLab2.gov.drop === 0 && pix(withGov) === REF,
    { drop: govLab2.gov.drop, resolution: govLab2.field.resolution, matchesFastMachine: pix(withGov) === REF });

  /* H3 — AUTO SCALE. */
  const noAS = await runFake(fakeLab({ msPerFrame: 90, autoScale: true }), { frames: 8, resizeAt: 2, unpin: ['autoscale'] });
  const withAS = await runFake(fakeLab({ msPerFrame: 90, autoScale: true }), { frames: 8, resizeAt: 2 });
  const na = digestsOf(noAS);
  judge('PIN REMOVED · H3 THE CANVAS RESIZED UNDER THE READBACK. NOTHING PRESENTS when AUTO SCALE, a window resize or a DPR change moves the canvas, so the jitter witness is blind to it and only the SIZE witness — read at the readback — can see the swapchain come back at a size the file will not claim. Removed, frame 2 onward is a different picture and the film reports success; kept, the same interference costs one re-render and not one pixel',
    noAS.ok === true && pix(noAS) !== REF && na.slice(0, 2).join() === refD.slice(0, 2).join()
    && withAS.ok === true && withAS.contended === 1 && pix(withAS) === REF,
    { unpinnedReportedOk: noAS.ok, divergesAtFrame: na.findIndex((d, i) => d !== refD[i]), pinnedRetries: withAS.contended, pinnedMatches: pix(withAS) === REF });

  /* H4 — THE FIELD CLOCK, AND THE DUPLICATED FRAME. */
  const noFC = await runFake(fakeLab({}), { frames: 8, skipReconstructAt: 4, unpin: ['fieldclock'] });
  const withFC = await runFake(fakeLab({}), { frames: 8, skipReconstructAt: 4 });
  const dNo = digestsOf(noFC);
  judge('PIN REMOVED · H4 THE FIELD CLOCK, AND THIS IS THE DUPLICATED FRAME ITSELF. A capped field clock PRESENTS THE SAME PICTURE TWICE and the jitter witness cannot see it. Only the GENERATION witness can. Removed, frame 4 comes back as a copy of frame 3 and the film reports success; kept, the frame is rendered again and the eight frames are eight pictures',
    noFC.ok && withFC.ok && dNo[4] === dNo[3] && noFC.contended === 0
    && new Set(digestsOf(withFC)).size === 8 && withFC.contended === 1 && pix(withFC) === REF,
    { unpinnedDigests: [dNo[3], dNo[4]], pinnedDistinct: new Set(digestsOf(withFC)).size, pinnedRetries: withFC.contended });

  /* H5 — THE CAMERA. */
  const camRefused = await runFake(fakeLab({ camera: { autoRotate: true, dy: 0.3 } }), { frames: 4, camera: 'refuse' });
  const camLab2 = fakeLab({ camera: { autoRotate: true, dy: 0.3 } });
  const camStilled = await runFake(camLab2, { frames: 4, camera: 'still' });
  judge('PIN APPLIED · H5 THE CAMERA CLOCK. The pose is an INTEGRATOR on the wall clock, so a coasting camera makes a film depend on machine speed. A moving camera is REFUSED by name, before the kit\'s recorder is even asked, with the three ways out; camera: "still" brings it to rest, records that it did, and puts it back afterwards',
    camRefused.ok === false && camRefused.refused === true && camRefused.hazard === 'camera'
    && /poseAt/.test(camRefused.error) && /integrator/.test(camRefused.error)
    && camStilled.ok && /stilled/.test(camStilled.pins.camera) && camLab2.LW.camera.autoRotate === true,
    { refusal: camRefused.error.slice(0, 110), stilledPin: camStilled.pins.camera, restored: camLab2.LW.camera.autoRotate });

  const poseAt = (k, N) => ({ yaw: 0.65 + 2 * Math.PI * k / N });
  const p1 = await runFake(fakeLab({}), { frames: 8, poseAt });
  const p2 = await runFake(fakeLab({ msPerFrame: 300 }), { frames: 8, poseAt });
  judge('AND A CAMERA MOVE THAT IS A FUNCTION OF THE FRAME INDEX IS EXACT: poseAt(k, N) turns the yaw a whole revolution over eight frames, the pictures all differ from the still ones, and a machine seventy-five times slower films the same pixels (RECORD carries AUTO-ROTATE this way)',
    p1.ok && p2.ok && pix(p1) === pix(p2) && pix(p1) !== REF && new Set(digestsOf(p1)).size === 8,
    { sameAcrossSpeeds: pix(p1) === pix(p2), differsFromStill: pix(p1) !== REF });

  /* H6 — THE MODULATION CLOCK, now the KIT'S: frozen by λWAVES with no host handed over, or driven by the kit's record clock */
  const mLab = fakeLab({ modulation: true });
  const frozen = await runFake(mLab, { frames: 8, modulation: 'freeze' });
  const dLabA = fakeLab({}), dLabB = fakeLab({ msPerFrame: 300 }), dLabC = fakeLab({}), dLabN = fakeLab({});
  const drivenA = await runFake(dLabA, { frames: 8, modulation: 'drive', host: rigFor(dLabA) });
  const exposureBack = dLabA.LW.mat.exposure;
  const drivenB = await runFake(dLabB, { frames: 8, modulation: 'drive', host: rigFor(dLabB) });
  const drivenC = await runFake(dLabC, { frames: 8, modulation: 'drive', host: rigFor(dLabC), interlopeAt: 2 });
  const unrouted = await runFake(dLabN, { frames: 8, modulation: 'drive', host: rigFor(dLabN, false) });
  judge('PIN APPLIED · H6 THE MODULATION CLOCK IS THE KIT\'S. FREEZE stops the rack (every target back to its knob) and hands the recorder no host, so nothing is stepped; DRIVE hands it the host and the KIT\'S RECORD CLOCK replays the rack from the first Space at exactly 1/fps a frame — a routed LFO moves the picture (it differs from the same drive with no route), two machines seventy-five times apart agree pixel for pixel, a GPU retry does not step the clock twice, frame zero is time zero, and the parameter is back where it was afterwards',
    frozen.ok && /frozen/.test(frozen.pins.modulation) && pix(frozen) === REF && mLab.LW.mod.running === true
    && drivenA.ok && drivenB.ok && drivenC.ok && unrouted.ok && /kit/.test(drivenA.pins.modulation)
    && pix(drivenA) === pix(drivenB) && pix(drivenC) === pix(drivenA) && drivenC.contended === 1
    && pix(drivenA) !== pix(unrouted) && drivenA.manifest.frames[0].t === 0 && Math.abs(exposureBack - 1) < 1e-12
    && drivenA.manifest.modulationClock && /record clock/.test(drivenA.manifest.modulationClock.clock),
    { frozenPin: frozen.pins.modulation, frozenMatchesUnmodulated: pix(frozen) === REF, restarted: mLab.LW.mod.running, drivenPin: drivenA.pins.modulation,
      driveSameAcrossSpeeds: pix(drivenA) === pix(drivenB), retryStepsOnce: pix(drivenC) === pix(drivenA), routeReachesPicture: pix(drivenA) !== pix(unrouted), exposureBack });


  /* H9 — the interloper witness itself: three failures abort by name, through the kit's failure road */
  const stubborn = fakeLab({});
  const always = fakeGrabFor(stubborn, {});
  const exr = filmFor(stubborn, {}, { grab: async (a) => { stubborn.rackFrame(); return always(a); } });   // an interloper on EVERY attempt
  const doomed = await exr.render({ schedule: exactSchedule({ mode: 'loop', T: D12.T, fps: 30, frames: 8 }), width: 16, height: 16, retries: 3 }).done;
  judge('PIN VERIFIED · H9 A FRAME IS EMITTED ONLY WHEN ITS WITNESSES AGREE. A contended frame is rendered again — free of consequence, because the same t with the same seed is the same picture — and a frame that will not settle after three attempts ABORTS THE FILM BY NAME, through the kit\'s own failure road (its store keeps what was finished; nothing it cannot vouch for is emitted)',
    doomed.ok === false && doomed.aborted !== null && doomed.aborted.k === 0 && doomed.aborted.tries === 4
    && /ABORTED at frame 0/.test(doomed.message) && doomed.frames === 0 && doomed.files.length === 0,
    { aborted: doomed.aborted && { k: doomed.aborted.k, tries: doomed.aborted.tries, why: doomed.aborted.why }, message: doomed.message.slice(0, 130) });

  /* and STOP is the kit's cancel */
  const full40 = await runFake(fakeLab({}), { frames: 40 });
  const stopLab = fakeLab({}), stopFilm = filmFor(stopLab, {});
  const running = stopFilm.render({ schedule: exactSchedule({ mode: 'loop', T: D12.T, fps: 30, frames: 40 }), width: 16, height: 16, onProgress: (p) => { if (p.done === 5) running.stop(); } });
  const stoppedR = await running.done;
  judge('AND A NINETY-MINUTE FILM HAS A DOOR, AND IT IS THE KIT\'S: stop() is the recorder\'s cancel (Escape and a [data-render-cancel] button are the same door), the film ends at a frame boundary, the frames it finished are the full film\'s first five to the digest, and it says plainly that a film is a whole schedule',
    stoppedR.stopped === true && stoppedR.frames === 5 && stoppedR.ok === false
    && /STOPPED at 5 of 40/.test(stoppedR.message) && /whole schedule/.test(stoppedR.message)
    && digestsOf(stoppedR).join() === digestsOf(full40).slice(0, 5).join() && stopLab.LW.clock.t === 0,
    { frames: stoppedR.frames, matchesPrefix: digestsOf(stoppedR).join() === digestsOf(full40).slice(0, 5).join(), message: stoppedR.message.slice(0, 100) });

  /* verify() */
  const vLab = fakeLab({});
  const v = await filmFor(vLab, {}).verify({ frames: 6, width: 16, height: 16 });
  const badLab = fakeLab({});
  let flip = 0;
  const badGrab = fakeGrabFor(badLab, {});
  const bad = await filmFor(badLab, {}, { grab: async (a) => { const r = await badGrab(a); if (a.k === 2) r.rgba[0] = (r.rgba[0] + (flip++)) & 255; return r; } }).verify({ frames: 6, width: 16, height: 16 });
  judge('AND verify() IS THE CLAIM CHECKED IN THE BROWSER IN ABOUT A SECOND: the same short schedule filmed twice through the kit\'s recorder, digest against digest. It comes back GREEN on an honest lab and, on one whose picture is not a function of the pinned inputs, it NAMES THE FRAME and hands back both digests',
    v.ok === true && v.frames === 6 && /DETERMINISTIC/.test(v.message)
    && bad.ok === false && bad.mismatches.length === 1 && bad.mismatches[0].k === 2 && bad.mismatches[0].a !== bad.mismatches[0].b && /1 of 6 frames differ/.test(bad.message),
    { good: v.message, badMismatch: bad.mismatches[0], badMessage: bad.message.slice(0, 96) });
}

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════
   §10 — THE RESTORE, THE MANIFEST AND THE HAZARD REGISTER
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
{
  const lab = fakeLab({ modulation: true, camera: { autoRotate: true, dy: 0.3 } });
  lab.LW.clock.playing = true; lab.LW.clock.t = 4.125;
  const before = { t: lab.LW.clock.t, playing: lab.LW.clock.playing, auto: lab.quality.auto, gov: lab.gov.on, presents: lab.stats.presents, autoRotate: lab.LW.camera.autoRotate, modRunning: lab.mod.running };
  let held = 0;
  const film = filmFor(lab, {}, { hold: (on) => { held += on ? 1 : -1; } });
  const r = await film.render({ schedule: exactSchedule({ mode: 'loop', T: D12.T, t0: 0, fps: 30, frames: 6 }), width: 16, height: 16, camera: 'still', modulation: 'freeze' }).done;
  const after = { t: lab.LW.clock.t, playing: lab.LW.clock.playing, auto: lab.quality.auto, gov: lab.gov.on, presents: lab.stats.presents, autoRotate: lab.LW.camera.autoRotate, modRunning: lab.mod.running };
  judge('THE LAB IS PUT BACK EXACTLY AS IT WAS when the kit hands the page back: the clock returns to t = 4.125 and to PLAYING, AUTO SCALE and the GOVERNOR come back on, AUTO-ROTATE comes back, the modulation transport is restarted, the host\'s own hold is taken and released once — and the jitter counter is advanced by the number of frames that really were presented rather than reset',
    r.ok && after.t === before.t && after.playing === true && after.auto === before.auto
    && after.gov === before.gov && after.autoRotate === true && after.modRunning === true
    && after.presents === before.presents + 6 && held === 0,
    { before, after, held });

  const m = r.manifest;
  judge('THE MANIFEST IS THE AUDIT: every scheduled t, offset and digest, the schedule\'s own exactness (endpoint, ulps, worst gap), the picture\'s size, grid, format, gamut and container, the jitter seed, the pin readings, the witness count and the ffmpeg line for the PNG frames — so two films are compared by diffing two small JSON files',
    m.format === 'lambdawaves/film@2'
    && m.frames.length === 6 && m.frames.every((f) => typeof f.digest === 'string' && typeof f.t === 'number' && typeof f.off === 'number')
    && m.schedule.endpointExact === true && m.schedule.endpoint === 'exclusive' && typeof m.schedule.worstGapUlps === 'number'
    && m.picture.jitterSeed === DEFAULTS.jitterSeed && /png/.test(m.picture.container)
    && m.pins && m.pins.governor && m.pins.jitter && m.pins.autoscale && typeof m.witnesses.contended === 'number'
    && /ffmpeg -framerate 30/.test(m.ffmpeg) && m.caveats.length >= 3,
    { format: m.format, frames: m.frames.length, endpoint: m.schedule.endpoint, container: m.picture.container, ffmpeg: m.ffmpeg.slice(0, 50) });

  const H = film.hazards();
  const KIT = ['modulation', 'dpr', 'deflate', 'gamut'];   // 025 B: the overlays are λWAVES' (lab/film-bake.js lays them over the frame)
  const tested = ['jitter', 'governor', 'autoscale', 'fieldclock', 'camera', 'modulation', 'interloper'];
  judge('EVERY HAZARD IN THE REGISTER IS THE SAME LIST THE FRAME PINS, THE REPORT SHOWS AND THIS FILE TESTS, AND EACH SAYS WHOSE IT IS NOW: twelve found (H7, H₂\'s impure field, left with its window in 0.5.0 D9b); H1–H5, H8–H9 are λWAVES\' (the jitter seed 13, the governor and AUTO SCALE named among them), the overlays λWAVES\' since 025 B (film-bake.js); the modulation clock, the DPR, the container and the gamut are the KIT\'S; seven have a test above that goes RED when the pin is removed',
    HAZARDS.length === 12 && HAZARD_IDS.length === 12
    && HAZARDS.every((h) => h.id && h.what && h.where && h.pin && h.witness && (h.owner === 'app' || h.owner === 'kit'))
    && HAZARDS.filter((h) => h.owner === 'kit').map((h) => h.id).join() === KIT.join()
    && ['jitter', 'governor', 'autoscale', 'overlays'].every((id) => HAZARDS.find((h) => h.id === id).owner === 'app')
    && tested.every((id) => HAZARD_IDS.includes(id))
    && H.readings.length === 12 && H.readings.every((x) => typeof x.note === 'string' && x.state),
    { app: HAZARDS.filter((h) => h.owner === 'app').map((h) => h.id), kit: HAZARDS.filter((h) => h.owner === 'kit').map((h) => h.id), blockingNow: H.blocking });

  const warnLab = fakeLab({ camera: { autoRotate: true, dy: 0.3 }, modulation: true });
  const p = filmFor(warnLab, {}).plan({ fps: 30, seconds: 6, observable: 'density' });
  judge('AND THE PLAN SAYS ALL OF IT BEFORE THE BUTTON COMMITS TO ANYTHING: the schedule, the cost (the kit\'s estimate), and the live warnings — a moving camera, a running modulation, and a size that came from THIS machine\'s device pixel ratio rather than from the caller',
    p.ok && p.N === 180 && p.warnings.length >= 3 && /frames/.test(p.cost.human)
    && p.warnings.some((w) => /CAMERA IS MOVING/.test(w)) && p.warnings.some((w) => /MODULATION RACK IS RUNNING/.test(w))
    && p.warnings.some((w) => /SIZE CAME FROM THIS MACHINE/.test(w))
    && p.hazards.blocking.includes('camera') && p.hazards.blocking.includes('modulation'),
    { N: p.N, cost: p.cost.human, blocking: p.hazards.blocking, warnings: p.warnings.map((w) => w.slice(0, 44)) });
}

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════
   §11 — THE CONTRACT WITH capture.js.  This file imports its primitives; a rename must go RED here, not in a
   browser at frame 300 of a ninety-minute film.
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
{
  const needed = ['AU_FS', 'VIEW_NAMES', 'viewCarriesGlobalPhase', 'wavePeriod', 'seamError', 'planPeriodRecording',
    'maxPictureSize', 'fitPicture', 'slug', 'stamp', 'uniqueFileName', 'captureName', 'readback', 'configureCopy', 'captionOver'];
  const missing = needed.filter((n) => CAP[n] === undefined);
  const mine = exactSchedule({ mode: 'loop', T: D12.T, t0: 3.25, fps: 30, frames: 180 });
  const theirs = CAP.loopSchedule({ T: D12.T, N: 180, t0: 3.25 });
  let sameTimes = true;
  for (let k = 0; k < 180; k++) if (mine.at(k) !== theirs.at(k)) sameTimes = false;
  const merged = planExact(D12, { mode: 'loop', fps: 30, seconds: 6, observable: 'density', energies: E12, t0: 45238.93, foldT0: true });
  judge('AND planExact HANDS BACK ITS OWN SCHEDULE, NOT THE ONE IT WRAPPED. capture.js\' plan carries a `schedule` key of its own, so the merge assigns ours OVER it; getting that backwards silently returned the sibling\'s times, which agree with ours for a loop at an ordinary origin and disagree for a SPAN, and for a loop whose origin was folded',
    merged.schedule.mode === 'loop' && merged.schedule.folded === true && merged.schedule.t0 !== 45238.93
    && typeof merged.schedule.worstGapUlps === 'number' && merged.schedule.endpoint === 'exclusive'
    && spanHasOwnSchedule(),
    { t0: merged.schedule.t0, folded: merged.schedule.folded, hasOurKeys: typeof merged.schedule.worstGapUlps === 'number' });

  judge('THE CONTRACT WITH capture.js IS PINNED HERE. This file imports its primitives — the period reader, the names, the readback both roads share and the caption — so a rename in the sibling goes RED in this suite. And the two files agree bit for bit about a loop\'s times, so ONE PERIOD (capture.js\' plan) and the film the kit encodes from it (this file\'s schedule) are the same schedule',
    missing.length === 0 && sameTimes && CAP.ENDPOINT === ENDPOINT.loop && MODES.length === 2,
    { imported: needed.length, missing, sameTimesAsCapture: sameTimes, captureEndpoint: CAP.ENDPOINT, ourLoopEndpoint: ENDPOINT.loop });
}
function spanHasOwnSchedule() {
  const sp = planExact(null, { mode: 'span', t0: 0, span: 7.5, fps: 30, frames: 180 });
  return sp.schedule.mode === 'span' && sp.schedule.D === 179 && sp.schedule.endpoint === 'inclusive';
}

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════
   §13 — THE CARD'S ROAD (0.5.0 C7b): the kit's RENDER card calls the recorder's run() itself, so the job is built from the
   kit's spec under THE TIME LAW — the period clip's schedule inside one, the RATE integral when RATE can move, else the RECORD
   law — and a RESUME after a reload rebuilds the same job from the spec the store kept.
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
{
  const W = 16, H = 16, N = 8, fps = 30;
  /* the card's recorder over a fake lab: the host recorder, handed an editor (the timeline's) and the state signature */
  const cardFilm = (lab, host, editor) => { const f = createFilm(lab.LW, { canvas: lab.canvas, grab: fakeGrabFor(lab, {}), now: () => lab.wall, energies: () => E12,
    storage: {}, calib: NOCALIB, guard: false, pauseWhileHidden: false, host: () => host }); return { film: f, rec: f.recorder({ editor: editor ? () => editor : undefined, signature: () => lab.LW.stateDigest() }) }; };
  const logT = (f) => (f.last ? f.last.log.map((x) => x.t) : []), logD = (f) => (f.last ? f.last.log.map((x) => x.digest) : []);
  const still = { motion: 'still', fps, durationS: N / fps, size: { w: W, h: H }, format: 'png', timeline: false };

  /* rule 3 — THE RECORD LAW: nothing can move RATE, so frame k is the lab's t at the tap + (k/N)·(N/fps)·rate */
  const labA = fakeLab({}); labA.LW.clock.t = 1.5;
  const A = cardFilm(labA, rigFor(labA, false));
  const zA = await A.rec.run({ ...still, modulation: false });
  const recordLaw = exactSchedule({ mode: 'loop', T: (N / fps) * 4, t0: 1.5, fps, frames: N });
  const labR = fakeLab({}); labR.LW.clock.t = 1.5;
  const facade = await filmFor(labR, {}).render({ schedule: recordLaw, width: W, height: H, format: 'png', modulation: 'freeze' }).done;
  judge('THE CARD\'S ROAD · RULE 3, THE RECORD LAW: a STILL from the kit\'s own run() — no film in hand at the tap — builds its job from the kit\'s spec: describe() records the lab at the tap (t, RATE, the caption, the spin) and before(spec) makes C7\'s RECORD schedule from it. Its eight frames sit at the RECORD law\'s times to the last bit and equal the facade\'s frozen RECORD digest for digest, and after() releases the job',
    zA.frames === N && logT(A.film).join() === recordLaw.times.join() && logD(A.film).join() === digestsOf(facade).join() && facade.ok && A.film.running === false && A.film.last.kind === 'clip',
    { times: logT(A.film).length, sameDigests: logD(A.film).join() === digestsOf(facade).join(), running: A.film.running });

  /* rule 2 — RATE CAN MOVE (MODULATION ON): the previous frame's RATE integrated once per output interval, frame zero time zero */
  const labD = fakeLab({}), labF = fakeLab({});
  const D = cardFilm(labD, rigFor(labD));
  await D.rec.run({ ...still, modulation: true });
  const driven = await filmFor(labF, { host: rigFor(labF) }).render({ schedule: exactSchedule({ mode: 'loop', T: (N / fps) * 4, t0: 0, fps, frames: N }), width: W, height: H, format: 'png', modulation: 'drive' }).done;
  const dt = logT(D.film), step = dt.slice(1).map((t, k) => t - dt[k]);
  judge('THE CARD\'S ROAD · RULE 2, RATE CAN MOVE: with MODULATION ON the card\'s film is C7\'s driven film — frame zero is the lab\'s t, every later frame the previous frame\'s RATE integrated over 1/fps — and its frames equal the facade\'s driven RECORD digest for digest through the same kit host',
    driven.ok && dt[0] === 0 && step.every((s) => Math.abs(s - 4 / fps) < 1e-12) && logD(D.film).join() === digestsOf(driven).join(),
    { t0: dt[0], step: step[0], sameDigests: logD(D.film).join() === digestsOf(driven).join() });

  /* rule 1 — INSIDE A PERIOD CLIP: ONE PERIOD's own schedule; TIMELINE · ACTIVE over the clip equals the facade's ONE PERIOD */
  const labP = fakeLab({}), hostP = rigFor(labP, false), spb = 60 / hostP.model.transport.bpm, beats = N / fps / spb, t0 = 2.75;
  const doc = { meter: 4, lanes: [{ id: 'l' }], active: { start: 0, end: beats }, curves: [{ id: 'v', kind: 'lw-period', targetId: 'lw.period', t0, T: D12.T }],
    clips: [{ id: 'c', curveId: 'v', laneId: 'l', start: 0, duration: beats, mute: false }] };
  const editor = { model: { state: () => doc, serialize: () => doc, subscribe: () => () => {} }, range: () => null, activeRange: () => doc.active };
  const P = cardFilm(labP, hostP, editor);
  await P.rec.run({ motion: 'timeline-active', fps, size: { w: W, h: H }, format: 'png', modulation: false });
  const onePeriod = exactSchedule({ mode: 'loop', T: D12.T, t0, fps, frames: N });
  const labO = fakeLab({}); labO.LW.clock.t = 9.25;
  const loop = await filmFor(labO, {}).render({ schedule: onePeriod, width: W, height: H, format: 'png', camera: 'still', modulation: 'freeze' }).done;
  judge('THE CARD\'S ROAD · RULE 1, INSIDE A PERIOD CLIP: TIMELINE · ACTIVE over a `lw-period` clip films ONE PERIOD\'s own times, bit for bit — not the lab\'s t, which stood elsewhere — and its frames equal the facade\'s ONE PERIOD digest for digest; the film is named a LOOP of T_ψ',
    loop.ok && logT(P.film).join() === onePeriod.times.join() && logD(P.film).join() === digestsOf(loop).join() && P.film.last.kind === 'loop' && P.film.last.T === D12.T,
    { frames: logT(P.film).length, sameTimes: logT(P.film).join() === onePeriod.times.join(), sameDigests: logD(P.film).join() === digestsOf(loop).join(), kind: P.film.last && P.film.last.kind });

  /* a RESUME after a reload: a fresh lab (its t moved), a fresh film, the spec the store kept (recording.json) and its checkpoint */
  const part = readZip(await archive(zA)).find((e) => e.name === 'recording.json'), spec = JSON.parse(new TextDecoder().decode(part.bytes));
  const labB = fakeLab({}); labB.LW.clock.t = 33.3;
  const B = cardFilm(labB, rigFor(labB, false)), files = [];
  const store = { id: 'resume', manifest: { checkpoint: { frames: 3 } }, resume: async () => {}, savePart: async (name, blob) => { files.push(name); return { name, blob, bytes: blob.size }; }, finishParts: async () => {}, interrupt: async () => {} };
  const rB = await B.rec.recover({ spec, store });
  judge('THE CARD\'S ROAD · A RESUME AFTER A RELOAD rebuilds its job from the spec the store kept (app.pending: the lab as it stood at the first tap), not from the lab now — the lab\'s t has moved to 33.3 — so frames 3 … 7 land on the first run\'s times and pixels exactly',
    rB.frames === N && logT(B.film).join() === recordLaw.times.slice(3).join() && logD(B.film).join() === logD(A.film).slice(3).join() && !!spec.app && !!spec.app.pending && files.length === 1,
    { resumed: logT(B.film).length, sameTimes: logT(B.film).join() === recordLaw.times.slice(3).join(), samePixels: logD(B.film).join() === logD(A.film).slice(3).join() });
}

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════
   §12 — WHAT ONLY A BROWSER CAN ANSWER
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
console.log('\n      NOT PROVED HERE — a browser must answer these (the film verifier\'s brief, research/release-0.5.0/BRIEF-C7-VERIFY.md):\n'
  + '        1  IS THE REAL RAY-MARCH A PURE FUNCTION OF THE PINNED INPUTS?  The fake shader in §6 is a model of field.js\'\n'
  + '           closure.  createFilm(LW).verify() films the same short schedule twice on the real GPU and compares digests.\n'
  + '        2  DOES THE GPU ITSELF ROUND THE SAME WAY TWICE?  "The same schedule on the same device gives the same pixels at\n'
  + '           any speed" is the claim; "the same pixels on a different GPU" is NOT made.\n'
  + '        3  THE KIT\'S ENCODER: WebCodecs H.264 and the canvas PNG writer are the browser\'s.  An MP4 is lossy and its bytes\n'
  + '           are not claimed; the PNG frames are lossless and are compared by their decoded pixels.\n'
  + '        4  THE FILM ROAD BEFORE AND AFTER C7 AGREES: EXPORT FRAMES\' decoded pixels on the pre-C7 tree and on this one.\n');
console.log((FAILED ? 'RED ' : 'GREEN ') + 'render-exact.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
