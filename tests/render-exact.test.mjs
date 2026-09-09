/* tests/render-exact.test.mjs — the node proof of THE DETERMINISTIC RENDERER.
 *   node tests/render-exact.test.mjs
 *
 * What is proved here, and what is not:
 *
 *   PROVED — the endpoint decision, for BOTH modes, DECIDED rather than asserted: the loop's is judged against
 *   the real density of a real two-mode hydrogen state (the endpoint frame is frame 0 again, to a part in 10^15
 *   of one frame's own step), and the span's against the same density (t1 is a different state, and dropping it
 *   loses a real gap of motion).  The arithmetic of the offset, re-measured against exact rational arithmetic in
 *   BigInt rather than inherited from capture.js — including the fact that capture.js' quoted counterexample does
 *   not reproduce and a real one does.  The fold of the origin, and how much precision it buys.  The cost model.
 *   The digest.  The stored zip, round-tripped through a reader written independently in this file.
 *
 *   AND THE DRIVER, against a FAKE LAB that REPRODUCES EVERY HAZARD: its fake shader reads the jitter counter,
 *   its fake governor drops the grid when frames run long, its fake AUTO SCALE moves the canvas, its fake rack
 *   loop interlopes, its fake H2 needs update(t) first, and its fake modulation runs on the fake wall clock.  So
 *   "the same schedule twice is byte-identical" and "a slow machine gives the same bytes as a fast one" are real
 *   tests and not tautologies, and EVERY PIN IS REMOVED IN TURN (`unpin`) to show the test that guards it goes
 *   RED without it.  A pin nobody can break is a pin nobody has checked.
 *
 *   NOT PROVED HERE — anything that needs a GPU.  Whether the real ray-march is a pure function of the pinned
 *   inputs is a question for a browser; §12 lists the probe to run.  See the note at the end of this file.
 */
import zlib from 'node:zlib';
import {
  ENDPOINT, MODES, DEFAULTS, PATH_DEPENDENT_LAYERS, HAZARDS, HAZARD_IDS, COST_TABLE,
  offsetOf, ulpsBetween, ulpOf, arithmeticLaw, foldOrigin,
  exactSchedule, endpointLaw, planExact, estimate, humanMs, humanBytes,
  digest, manifest, zipStored, createExactRenderer,
} from '../lab/render-exact.js';
import * as CAP from '../lab/capture.js';
import { densityPeriod } from '../lab/period.js';
import { BASIS, psiAt } from '../lab/hydrogen.js';

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
   §5 — THE COST, THE DIGEST AND THE ZIP
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
{
  const big = estimate({ w: 8192, h: 8192, frames: 600 });
  const hd = estimate({ w: 1920, h: 1080, frames: 600 });
  const meas = estimate({ w: 1920, h: 1080, frames: 600, msPerFrame: 812 });
  let monotone = true, prev = -1;
  for (const p of COST_TABLE.points) { if (p.ms <= prev) monotone = false; prev = p.ms; }
  judge('NOBODY SHOULD START A 600-FRAME 8192² RENDER WITHOUT BEING TOLD IT IS ' + big.human.split(' · ').slice(2).join(' and ') + '. The model is capture.js\' own six measured points, piecewise-linear in megapixels (131 ms per Mpx over a 181 ms floor, holding across a 73x range), and it says when the number is an extrapolation, when it is this machine\'s own median instead, and that a long render can be stopped and not resumed',
    monotone && big.totalMs > 80 * 60 * 1000 && big.totalMs < 100 * 60 * 1000
    && /1 h/.test(big.human) && /GB/.test(big.human) && /90/.test(String(Math.round(big.totalMs / 60000)))
    && hd.totalMs < big.totalMs / 15 && /THIS IS A/.test(big.warning)
    && meas.measured === true && /measured in this run/.test(meas.basis) && meas.totalMs === 812 * 600,
    { at8192: big.human, at1080p: hd.human, warning: big.warning.slice(0, 90), measured: meas.human });

  const a = new Uint8Array(4096), b = new Uint8Array(4096);
  for (let i = 0; i < 4096; i++) { a[i] = (i * 37) & 255; b[i] = (i * 37) & 255; }
  const d1 = digest(a), d2 = digest(b);
  b[2048] ^= 1;
  const d3 = digest(b);
  const swapped = Uint8Array.from(a); const t0 = swapped[10]; swapped[10] = swapped[11]; swapped[11] = t0;
  judge('THE DIGEST IS 64 BITS OVER THE FILTERED SCANLINES — OURS, NOT THE BROWSER\'S DEFLATE — so two runs are compared without keeping a gigabyte of pixels. Identical input gives an identical digest; one flipped BIT in four kilobytes changes it; so does transposing two adjacent bytes, which a checksum would miss',
    d1 === d2 && d1 !== d3 && d1 !== digest(swapped) && d1.length === 16,
    { same: d1, oneBitFlipped: d3, twoBytesSwapped: digest(swapped) });

  /* the zip, read back by a reader written here from the spec rather than from the writer */
  const enc = new TextEncoder();
  const files = [];
  for (let i = 0; i < 5; i++) files.push({ name: 'frame-' + String(i).padStart(5, '0') + '.png', bytes: enc.encode('PNG-payload-' + i + '-'.repeat(i * 7)) });
  const z1 = zipStored(files), z2 = zipStored(files);
  const read = readZip(z1);
  const same = read.length === files.length && read.every((r, i) => r.name === files[i].name && Buffer.compare(Buffer.from(r.bytes), Buffer.from(files[i].bytes)) === 0 && r.crcOk);
  judge('ONE DOWNLOAD FOR A SEQUENCE: a STORED zip (a PNG is already deflated, so a second pass would cost minutes and save nothing) with a FIXED 1980 timestamp, so two renders of the same schedule give byte-identical ARCHIVES and not archives that differ only in when they were made. Read back here by a reader written from the spec, every CRC checked',
    same && Buffer.compare(Buffer.from(z1), Buffer.from(z2)) === 0,
    { entries: read.length, bytes: z1.length, identicalArchives: Buffer.compare(Buffer.from(z1), Buffer.from(z2)) === 0, names: read.map((r) => r.name).slice(0, 2) });

  let refused = null;
  try { zipStored(Array.from({ length: 70000 }, (_, i) => ({ name: 'f' + i, bytes: new Uint8Array(0) }))); } catch (e) { refused = String(e.message); }
  judge('AND IT REFUSES ZIP64 TERRITORY RATHER THAN WRITE A MALFORMED ARCHIVE: above 65535 entries (or 4 GB) it says so and points at the streaming road instead',
    refused !== null && /ZIP64/.test(refused) && /onFrame/.test(refused), { refusal: refused });
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
   §6 — THE FAKE LAB.  It reproduces every hazard, so the driver's pins are tested and not merely written.
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════ */

/**
 * A lab whose "shader" reads exactly what the real one does — the mode coefficients at t, the observer, the
 * material, the domain half-width, the grid resolution, the canvas size and the jitter word — and whose rack
 * misbehaves exactly where rack.js does:
 *   · a GOVERNOR that steps the grid down when the fake wall clock says frames are slow
 *   · an AUTO SCALE that moves the canvas size on the same reading
 *   · a MODULATION clock that writes into `mat` from the fake wall clock while it is running
 *   · an H2 whose fieldModes read an R that only update(t) sets
 *   · a RACK LOOP that interlopes mid-frame, presenting once with an unpinned seed
 */
function fakeLab({ msPerFrame = 5, governor = true, autoScale = true, h2 = false, modulation = false, camera = null, presents = 0 } = {}) {
  const RES_LADDER = [64, 96, 128];
  const stats = { presents, generation: 0 };
  let wall = 0;                                   // the FAKE machine's clock. The driver must never read it.
  const clock = { t: 0, rate: 4, playing: false, pause() { this.playing = false; }, play() { this.playing = true; }, scrub(t) { this.t = t; } };
  const quality = { res: 96, steps: 160, scale: 1, auto: autoScale, autoScale: 1, minScale: 0.35 };
  const gov = { on: governor, drop: 0 };
  const domain = { half: 12, auto: true };
  const obs = { yaw: 0.65, pitch: 0.38, dist: 3.3, fov: 0.6 };
  const mat = { view: 0, exposure: 1, softness: 0.5, style: 0, dither: 0.5, steps: 160 };
  const cam = Object.assign({ dy: 0, dp: 0, autoRotate: false, speed: 0.25, get ambient() { return this.autoRotate ? this.speed : 0; }, get moving() { return this.ambient !== 0 || this.dy !== 0 || this.dp !== 0; } }, camera || {});
  const h2state = { on: h2, R: 6, update(t) { this.R = 6 + 2 * Math.sin(0.3 * t); } };
  const mod = { _running: modulation, _phase: 0, get running() { return this._running; }, get playing() { return this._running; },
    host: {}, stop() { this._running = false; }, play() { this._running = true; },
    step(dt) { this._phase += dt; mat.exposure = 1 + 0.5 * Math.sin(2 * Math.PI * this._phase); return dt; },
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
     inputs while it does.  Everything it touches is something the driver has to pin. */
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
    clock, quality, domain, obs, mat, field, camera: cam, h2: h2state, mod,
    governor: { get on() { return gov.on; }, set on(v) { gov.on = v; if (!v) gov.drop = 0; }, get drop() { return gov.drop; }, get resolution() { return field.resolution; } },
    stats: { scheduled: false, frames: 0 },
    fieldRate: { capMs: 33 },
    reg: { presetId: 'fake', populated: () => [0, 1], Ediag: (a) => E12[a], P: null },
    period: D12,
    stateDigest: () => 'fake-state',
    version: 'fake',
    modesAt(t) {
      /* the register is analytic; H2's contribution is NOT a function of t alone — it reads the R that
         update(t) set, exactly as h2view.js does */
      const c = E12.map((E) => ({ re: Math.SQRT1_2 * Math.cos(-E * t), im: Math.SQRT1_2 * Math.sin(-E * t) }));
      return h2state.on ? c.concat([{ re: h2state.R, im: 0 }]) : c;
    },
    play() { clock.playing = true; },
    _fake: { rackFrame, get wall() { return wall; }, set wall(v) { wall = v; }, gov, quality, canvas, mod, h2: h2state },
  };
  return { LW, canvas, field, stats, gov, quality, mod, h2: h2state, rackFrame,
    get wall() { return wall; }, tick(ms) { wall += ms === undefined ? msPerFrame : ms; }, get msPerFrame() { return msPerFrame; } };
}

/**
 * THE FAKE READBACK: a picture that is a function of EXACTLY the real closure, and of nothing else.
 *   `interlopeAt`       a rack frame lands mid-render — ONCE, as a real one would (H9)
 *   `skipReconstructAt` the capped field clock: a PRESENT with no reconstruct, so the picture is the previous
 *                       frame's — a DUPLICATE FRAME, which is the failure the generation witness exists for (H4)
 *   `resizeAt`          the canvas is resized between the render and the readback WITHOUT a present — a window
 *                       resize, a DPR change on a monitor switch, AUTO SCALE's own field.resize. The jitter
 *                       witness cannot see this one (nothing presented), so only the SIZE witness can (H3)
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
    /* the "pixels": every input in the closure, quantised into bytes.  Change any of them and the bytes change. */
    const px = new Uint8Array(w * h * 4);
    /* the CANVAS SIZE AT READBACK is an input too: a real copy takes the swapchain, whose size is whatever the
       canvas is at that moment, so a rack frame that resized it renders a different picture (H3) */
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

async function runFake(lab, o = {}) {
  const ex = createExactRenderer(lab.LW, { canvas: lab.canvas, grab: fakeGrabFor(lab, o), now: () => lab.wall, energies: () => E12, jitterSeed: o.jitterSeed });
  const sched = exactSchedule({ mode: 'loop', T: D12.T, t0: 0, fps: 30, frames: o.frames || 8 });
  return ex.render(Object.assign({ schedule: sched, width: 16, height: 12, deflate: 'stored', digestFrames: true }, o)).done;
}
const digestsOf = (r) => (r.manifest ? r.manifest.frames.map((f) => f.digest) : []);
const bytesOf = (r) => r.files.map((f) => Buffer.from(f.bytes).toString('base64'));

// Final II: a retry must not advance modulation a second time, and frame zero is time zero.
{
  const lab = fakeLab({}), plain = fakeLab({});
  let steps = 0; const step = lab.LW.mod.step;
  lab.LW.mod.step = (dt) => { steps++; return step.call(lab.LW.mod, dt); };
  const a = await runFake(lab, {frames:5,modulation:'drive',interlopeAt:2});
  const b = await runFake(plain, {frames:5,modulation:'drive'});
  judge('Final II: modulation begins at zero, advances once per frame interval, and survives a GPU retry without changing the output',
    a.ok && b.ok && steps === 4 && a.manifest.frames[0].t === 0 && bytesOf(a).join() === bytesOf(b).join(),
    {error:a.error, aborted:a.aborted, steps,retries:a.contended,firstTime:a.manifest?.frames[0].t,same:bytesOf(a).join() === bytesOf(b).join()});
}


/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════
   §7 — THE SAME SCHEDULE TWICE IS BYTE-IDENTICAL
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
{
  const a = await runFake(fakeLab({}), { frames: 8 });
  const b = await runFake(fakeLab({}), { frames: 8 });
  const c = await runFake(fakeLab({ msPerFrame: 5 }), { frames: 8, interlopeAt: 3 });
  judge('THE SAME SCHEDULE RENDERED TWICE IS BYTE-IDENTICAL — the PNG files themselves, not just the digests, because deflate: "stored" puts the container in our hands too. And a RACK FRAME LANDING MID-RENDER does not change a single byte: its witness catches it (the jitter counter reads wrong), the frame is re-rendered, and the run reports how many times that happened',
    a.ok && b.ok && c.ok && a.frames === 8
    && digestsOf(a).join() === digestsOf(b).join()
    && bytesOf(a).join() === bytesOf(b).join()
    && bytesOf(c).join() === bytesOf(a).join() && c.contended === 1,
    { frames: a.frames, firstDigest: digestsOf(a)[0], lastDigest: digestsOf(a)[7], identical: bytesOf(a).join() === bytesOf(b).join(), contendedRetries: c.contended });

  judge('AND EVERY FRAME IS A DIFFERENT PICTURE: eight scheduled times, eight distinct digests. A schedule that silently rendered the same state twice — the capped field clock, which is what hazard H4 is — would show up here as a repeat',
    new Set(digestsOf(a)).size === 8, { digests: digestsOf(a) });
}

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════
   §8 — A SLOW MACHINE PRODUCES THE SAME BYTES AS A FAST ONE
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
{
  const fast = await runFake(fakeLab({ msPerFrame: 4 }), { frames: 8 });
  const slow = await runFake(fakeLab({ msPerFrame: 90 }), { frames: 8 });
  const crawl = await runFake(fakeLab({ msPerFrame: 400 }), { frames: 8, interlopeAt: 2 });
  judge('A MACHINE A HUNDRED TIMES SLOWER PRODUCES THE SAME BYTES. On the fake slow machine the rack\'s GOVERNOR would step the field grid down the ladder and AUTO SCALE would shrink the canvas — both of which change the picture, and both of which are what makes the free-running lab machine-dependent. Paused-and-off, they do neither, and the schedule is identical because it never read a clock at all',
    fast.ok && slow.ok && crawl.ok
    && bytesOf(fast).join() === bytesOf(slow).join()
    && bytesOf(crawl).join() === bytesOf(fast).join()
    && fast.schedule.times.join() === slow.schedule.times.join(),
    { fastMs: fast.report.msPerFrame, slowMs: slow.report.msPerFrame, sameBytes: bytesOf(fast).join() === bytesOf(slow).join(), sameTimes: fast.schedule.times.join() === slow.schedule.times.join() });

  /* the elapsed time IS reported, and it is the only place wall time appears */
  judge('THE TIME IT TOOK IS REPORTED AND WAS NEVER AN INPUT: the slow run says it took ' + humanMs(slow.report.elapsedMs) + ' against the fast one\'s ' + humanMs(fast.report.elapsedMs) + ', the ETA comes from this run\'s own median rather than the table once three frames are in, and the two runs\' pictures are the same anyway',
    slow.report.elapsedMs > 10 * fast.report.elapsedMs && slow.cost.measured === true
    && /REPORT/.test(slow.report.note) && bytesOf(fast).join() === bytesOf(slow).join(),
    { fast: fast.report.human, slow: slow.report.human, costBasis: slow.cost.basis });
}

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════
   §9 — EVERY PIN, REMOVED IN TURN.  A pin nobody can break is a pin nobody has checked.
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
{
  const ref = await runFake(fakeLab({}), { frames: 8 });
  const REF = bytesOf(ref).join();

  /* H1 — THE JITTER.  The sharp test is not "the bytes changed" but "the render depends on the SESSION": two
     labs whose counters happen to stand at different places give different pictures of the same state. */
  const noJitA = await runFake(fakeLab({ presents: 0 }), { frames: 8, unpin: ['jitter'] });
  const noJitB = await runFake(fakeLab({ presents: 41 }), { frames: 8, unpin: ['jitter'] });
  const pinA = await runFake(fakeLab({ presents: 0 }), { frames: 8 });
  const pinB = await runFake(fakeLab({ presents: 41 }), { frames: 8 });
  judge('PIN REMOVED · H1 THE RAY-MARCH JITTER. field.js seeds the march offset AND the GRAIN style\'s voxel-keep cell with (presents % 97)/97, so the picture depends on WHERE IN THE SESSION it was taken. Unpinned, two labs whose counters stand 41 frames apart render the same state as different pictures from the FIRST frame; pinned, they are byte-identical to each other and to the reference',
    noJitA.ok && noJitB.ok && pinA.ok && pinB.ok
    && bytesOf(noJitA).join() !== bytesOf(noJitB).join()
    && bytesOf(noJitA)[0] !== bytesOf(noJitB)[0]
    && bytesOf(pinA).join() === bytesOf(pinB).join() && bytesOf(pinA).join() === REF,
    { unpinnedDiffer: bytesOf(noJitA).join() !== bytesOf(noJitB).join(), pinnedAgree: bytesOf(pinA).join() === bytesOf(pinB).join(), matchesReference: bytesOf(pinA).join() === REF });

  /* H2 — THE GOVERNOR.  Unpin it (the clock stays playing, the governor stays on) on a slow machine and the
     field grid steps down mid-render: a coarser volume, a different picture. */
  const govLab = fakeLab({ msPerFrame: 90, governor: true, autoScale: false });
  govLab.LW.clock.playing = true;                                    // as the lab is when the button is pressed
  const noGov = await runFake(govLab, { frames: 8, interlopeAt: 2, unpin: ['governor'] });
  judge('PIN REMOVED · H2 THE GOVERNOR — THE HEADLINE MACHINE-SPEED DEPENDENCE IN THE LAB. A median over 28 ms steps the FIELD GRID down the ladder, so a SLOW MACHINE RENDERS A COARSER VOLUME. With the clock left playing and the governor left armed, one interloping frame on the slow machine drops the grid from 96³ to 64³ and every frame after it is a picture of a different grid — and NOTHING SAYS SO: the run reports success and hands back a sequence that changes resolution in the middle',
    noGov.ok === true && govLab.gov.drop > 0 && govLab.field.resolution === 64
    && bytesOf(noGov).join() !== REF
    && bytesOf(noGov).slice(0, 2).join() === bytesOf(ref).slice(0, 2).join()
    && bytesOf(noGov).slice(2).join() !== bytesOf(ref).slice(2).join(),
    { reportedOk: noGov.ok, drop: govLab.gov.drop, resolution: govLab.field.resolution, divergesAtFrame: bytesOf(noGov).findIndex((b, i) => b !== bytesOf(ref)[i]) });

  /* and the SAME lab with the pin in place renders all eight frames at the grid it started on */
  const govLab2 = fakeLab({ msPerFrame: 90, governor: true, autoScale: false });
  govLab2.LW.clock.playing = true;
  const withGov = await runFake(govLab2, { frames: 8, interlopeAt: 2 });
  judge('AND WITH THE PIN IN PLACE the same slow, contended machine renders all eight frames at the grid it started on, byte-identical to the fast machine\'s: pausing the clock is what disarms the governor (the real rack only judges while playing, and pausing resets its drop), and turning it off is the belt',
    withGov.ok && withGov.frames === 8 && govLab2.gov.drop === 0 && bytesOf(withGov).join() === REF,
    { drop: govLab2.gov.drop, resolution: govLab2.field.resolution, matchesFastMachine: bytesOf(withGov).join() === REF });

  /* H3 — AUTO SCALE.  Unpin it on a slow machine and the canvas shrinks under the render. */
  const asLab = fakeLab({ msPerFrame: 90, autoScale: true });
  const noAS = await runFake(asLab, { frames: 8, resizeAt: 2, unpin: ['autoscale'] });
  const withAS = await runFake(fakeLab({ msPerFrame: 90, autoScale: true }), { frames: 8, resizeAt: 2 });
  judge('PIN REMOVED · H3 THE CANVAS RESIZED UNDER THE READBACK. quality.autoScale is moved by a wall-clock EMA and multiplies the size the rack asks field.resize for; a window resize and a DPR change on a monitor switch do the same. NOTHING PRESENTS when that happens, so the jitter witness is blind to it and only the SIZE witness — read at the readback, not before it — can see the swapchain come back at a size the file will not claim. Removed, frame 2 onward is a different picture and the run reports success; kept, the same interference costs one re-render and not one byte',
    noAS.ok === true && bytesOf(noAS).join() !== REF
    && bytesOf(noAS).slice(0, 2).join() === bytesOf(ref).slice(0, 2).join()
    && withAS.ok === true && withAS.contended === 1 && bytesOf(withAS).join() === REF,
    { unpinnedReportedOk: noAS.ok, divergesAtFrame: bytesOf(noAS).findIndex((b, i) => b !== bytesOf(ref)[i]),
      pinnedRetries: withAS.contended, pinnedMatches: bytesOf(withAS).join() === REF });

  /* H4 — THE FIELD CLOCK, AND THE DUPLICATED FRAME.  The fake presents frame 4 WITHOUT reconstructing, which is
     exactly what a capped field clock does: the picture is frame 3's again.  The jitter witness cannot see it —
     one present did happen, with the pinned seed — so only the GENERATION witness can. */
  const noFC = await runFake(fakeLab({}), { frames: 8, skipReconstructAt: 4, unpin: ['fieldclock'] });
  const withFC = await runFake(fakeLab({}), { frames: 8, skipReconstructAt: 4 });
  const dNo = digestsOf(noFC);
  judge('PIN REMOVED · H4 THE FIELD CLOCK, AND THIS IS THE DUPLICATED FRAME ITSELF. The rack reconstructs psi on an EVOLVE tier only when the field clock is due, so a capped field clock PRESENTS THE SAME PICTURE TWICE — and the jitter witness cannot see it, because one present really did happen with the pinned seed. Only the GENERATION witness can. Removed, frame 4 comes back as a byte-for-byte copy of frame 3 and the run reports success; kept, the frame is re-rendered and the eight frames are eight pictures',
    noFC.ok && withFC.ok
    && dNo[4] === dNo[3] && noFC.contended === 0
    && new Set(digestsOf(withFC)).size === 8 && withFC.contended === 1
    && bytesOf(withFC).join() === REF,
    { unpinnedDigests: [dNo[3], dNo[4]], duplicated: dNo[4] === dNo[3], pinnedDistinct: new Set(digestsOf(withFC)).size, pinnedRetries: withFC.contended, pinnedMatches: bytesOf(withFC).join() === REF });

  /* H5 — THE CAMERA.  A moving camera is refused, and 'still' brings it to rest and says so. */
  const camLab = fakeLab({ camera: { autoRotate: true } });
  const camRefused = await runFake(camLab, { frames: 4, camera: 'refuse' });
  const camLab2 = fakeLab({ camera: { autoRotate: true } });
  const camStilled = await runFake(camLab2, { frames: 4, camera: 'still' });
  judge('PIN APPLIED · H5 THE CAMERA CLOCK. The pose is an INTEGRATOR — omega decays as exp(-mu dt) and AUTO-ROTATE drifts at rad per WALL second — so there is no pose(t) to evaluate and a coasting camera makes the render depend on machine speed. A moving camera is REFUSED by name, with the three ways out in the message; camera: "still" brings it to rest, records that it did, and puts it back afterwards',
    camRefused.ok === false && camRefused.refused === true && camRefused.hazard === 'camera'
    && /poseAt/.test(camRefused.error) && /integrator/.test(camRefused.error)
    && camStilled.ok && /stilled/.test(camStilled.pins.camera) && camLab2.LW.camera.autoRotate === true,
    { refusal: camRefused.error.slice(0, 110), stilledPin: camStilled.pins.camera, restored: camLab2.LW.camera.autoRotate });

  /* and a POSE PATH is the deterministic way to have a camera move at all */
  const poseAt = (k, N) => ({ yaw: 0.65 + 2 * Math.PI * k / N });
  const p1 = await runFake(fakeLab({}), { frames: 8, poseAt });
  const p2 = await runFake(fakeLab({ msPerFrame: 300 }), { frames: 8, poseAt });
  judge('AND A CAMERA MOVE THAT IS A FUNCTION OF THE FRAME INDEX IS EXACT: poseAt(k, N) turns the yaw a whole revolution over eight frames, the pictures all differ from the still ones, and a machine seventy-five times slower renders the same bytes. That is what a rendered camera move should have been all along — a schedule, not an integrator',
    p1.ok && p2.ok && bytesOf(p1).join() === bytesOf(p2).join() && bytesOf(p1).join() !== REF
    && new Set(digestsOf(p1)).size === 8,
    { sameAcrossSpeeds: bytesOf(p1).join() === bytesOf(p2).join(), differsFromStill: bytesOf(p1).join() !== REF });

  /* H6 — THE MODULATION CLOCK, in both honest modes */
  const mLab = fakeLab({ modulation: true });
  const frozen = await runFake(mLab, { frames: 8, modulation: 'freeze' });
  const dLab1 = fakeLab({ modulation: true }), dLab2 = fakeLab({ modulation: true, msPerFrame: 300 });
  const drivenA = await runFake(dLab1, { frames: 8, modulation: 'drive' });
  const drivenB = await runFake(dLab2, { frames: 8, modulation: 'drive' });
  const leftLab = fakeLab({ modulation: true });
  const left = await runFake(leftLab, { frames: 8, modulation: 'leave', interlopeAt: 3 });
  judge('PIN APPLIED · H6 THE MODULATION CLOCK. It is an integrator too, and irreducibly so: even under WALL sync its one-pole SMOOTH filters and its envelopes accumulate dt, so there is no modulated(t). FREEZE stops it and every target goes back to its knob; DRIVE steps it 1/fps per frame through mir\'s own deterministic door and renders the movement — and two machines seventy-five times apart in speed agree byte for byte, because the nominal second is defined by the OUTPUT frame rate and never measured',
    frozen.ok && /frozen/.test(frozen.pins.modulation) && bytesOf(frozen).join() === REF
    && mLab.LW.mod.running === true                                   // stopped for the run, restarted after
    && drivenA.ok && drivenB.ok && bytesOf(drivenA).join() === bytesOf(drivenB).join()
    && bytesOf(drivenA).join() !== bytesOf(frozen).join()
    && new Set(digestsOf(drivenA)).size === 8,
    { frozenPin: frozen.pins.modulation, frozenMatchesUnmodulated: bytesOf(frozen).join() === REF, restarted: mLab.LW.mod.running,
      drivenPin: drivenA.pins.modulation, driveSameAcrossSpeeds: bytesOf(drivenA).join() === bytesOf(drivenB).join(), differsFromFrozen: bytesOf(drivenA).join() !== bytesOf(frozen).join() });

  judge('AND THE ONE ESCAPE HATCH SAYS WHAT IT IS. modulation: "leave" exists only for a caller who knows what they are doing, and the pin reading says "this render is NOT deterministic" rather than pretending; with the wall clock still writing into `mat`, an interloping frame moves the exposure mid-render and the picture changes from that frame on',
    left.ok && /NOT deterministic/.test(left.pins.modulation)
    && bytesOf(left).slice(0, 3).join() === bytesOf(frozen).slice(0, 3).join()
    && bytesOf(left).slice(3).join() !== bytesOf(frozen).slice(3).join(),
    { pin: left.pins.modulation, divergesAt: bytesOf(left).findIndex((b, i) => b !== bytesOf(frozen)[i]) });

  /* H7 — H2's impure field modes */
  const h2Lab = fakeLab({ h2: true });
  const h2On = await runFake(h2Lab, { frames: 8 });
  const h2Lab2 = fakeLab({ h2: true });
  const h2Off = await runFake(h2Lab2, { frames: 8, unpin: ['h2'] });
  judge('PIN REMOVED · H7 H2 IS THE ONE IMPURE FIELD SOURCE. h2.fieldModes() takes no t: it reads the current R, which h2.update(t) sets from a pre-computed trajectory — and in the rack loop that call sits AFTER the frame and inside the cpuTick cadence, so the free-running lab\'s H2 field is one frame stale and four in 120 Hz mode. The driver calls update(t) itself before every frame; without it, R never moves and every frame carries the same molecule',
    h2On.ok && h2Off.ok && bytesOf(h2On).join() !== bytesOf(h2Off).join()
    && new Set(digestsOf(h2On)).size === 8 && Math.abs(h2Lab2.h2.R - 6) < 1e-12 && Math.abs(h2Lab.h2.R - 6) > 1e-6,
    { pinnedR: h2Lab.h2.R, unpinnedR: h2Lab2.h2.R, differ: bytesOf(h2On).join() !== bytesOf(h2Off).join() });

  /* H9 — the interloper witness itself: three failures abort by name rather than emit a doubtful frame */
  const stubborn = fakeLab({});
  const alwaysGrab = fakeGrabFor(stubborn, {});
  const exr = createExactRenderer(stubborn.LW, {
    canvas: stubborn.canvas, now: () => stubborn.wall, energies: () => E12,
    grab: async (a) => { stubborn.rackFrame(); return alwaysGrab(a); },   // an interloper on EVERY attempt
  });
  const doomed = await exr.render({ schedule: exactSchedule({ mode: 'loop', T: D12.T, fps: 30, frames: 8 }), width: 16, height: 12, deflate: 'stored', retries: 3 }).done;
  judge('PIN VERIFIED · H9 A FRAME IS EMITTED ONLY WHEN ITS WITNESSES AGREE. A contended frame is re-rendered — the retry is free of consequence, because the same t with the same pinned seed is the same picture — and a frame that will not settle after three attempts ABORTS THE RUN BY NAME, handing back the exact frames before it. That is what "no dropped or duplicated frame" means when you cannot stop the interference: never emit one you cannot vouch for',
    doomed.ok === false && doomed.aborted !== null && doomed.aborted.k === 0 && doomed.aborted.tries === 4
    && /ABORTED at frame 0/.test(doomed.message) && doomed.frames === 0,
    { aborted: doomed.aborted && { k: doomed.aborted.k, tries: doomed.aborted.tries, why: doomed.aborted.why }, message: doomed.message.slice(0, 130) });

  /* and STOP: a ninety-minute render needs a door, and the door must not lie about what came out of it */
  const full40 = await runFake(fakeLab({}), { frames: 40 });
  const stopLab = fakeLab({});
  const stopEx = createExactRenderer(stopLab.LW, { canvas: stopLab.canvas, grab: fakeGrabFor(stopLab, {}), now: () => stopLab.wall, energies: () => E12 });
  const running = stopEx.render({ schedule: exactSchedule({ mode: 'loop', T: D12.T, fps: 30, frames: 40 }), width: 16, height: 12, deflate: 'stored', onProgress: (p) => { if (p.done === 5) running.stop(); } });
  const stoppedR = await running.done;
  judge('AND A NINETY-MINUTE RENDER HAS A DOOR. stop() ends the run at the frame boundary, returns exactly the frames that were finished — byte-identical to the first five of the full run — and says plainly that a deterministic render cannot be resumed, because the schedule is a whole: re-run it with the same options for the same bytes',
    stoppedR.stopped === true && stoppedR.frames === 5 && stoppedR.ok === false
    && /STOPPED at 5 of 40/.test(stoppedR.message) && /cannot be resumed/.test(stoppedR.message)
    && bytesOf(stoppedR).join() === bytesOf(full40).slice(0, 5).join(),
    { frames: stoppedR.frames, matchesPrefix: bytesOf(stoppedR).join() === bytesOf(full40).slice(0, 5).join(), message: stoppedR.message.slice(0, 100) });
  /* verify() is the API a rack wave puts behind a button, and an untested API is a liability */
  const vLab = fakeLab({});
  const vex = createExactRenderer(vLab.LW, { canvas: vLab.canvas, grab: fakeGrabFor(vLab, {}), now: () => vLab.wall, energies: () => E12 });
  const v = await vex.verify({ frames: 6, width: 16, height: 12, deflate: 'stored' });
  const badLab = fakeLab({});
  let flip = 0;
  const badGrab = fakeGrabFor(badLab, {});
  const bex = createExactRenderer(badLab.LW, { canvas: badLab.canvas, now: () => badLab.wall, energies: () => E12,
    grab: async (a) => { const r = await badGrab(a); if (a.k === 2) r.rgba[0] = (r.rgba[0] + (flip++)) & 255; return r; } });
  const bad = await bex.verify({ frames: 6, width: 16, height: 12, deflate: 'stored' });
  judge('AND verify() IS THE CLAIM CHECKED IN THE BROWSER IN ABOUT A SECOND: the same short schedule rendered twice, digest against digest, at a size nobody has to wait for. It comes back GREEN on an honest lab and, on one whose picture is not a function of the pinned inputs, it NAMES THE FRAME and hands back both digests rather than saying "something is wrong"',
    v.ok === true && v.frames === 6 && /DETERMINISTIC/.test(v.message)
    && bad.ok === false && bad.mismatches.length === 1 && bad.mismatches[0].k === 2
    && bad.mismatches[0].a !== bad.mismatches[0].b && /1 of 6 frames differ/.test(bad.message),
    { good: v.message, badMismatch: bad.mismatches[0], badMessage: bad.message.slice(0, 96) });
}

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════
   §10 — THE RESTORE, THE MANIFEST AND THE HAZARD REGISTER
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
{
  const lab = fakeLab({ modulation: true, camera: { autoRotate: true } });
  lab.LW.clock.playing = true; lab.LW.clock.t = 4.125;
  const before = { t: lab.LW.clock.t, playing: lab.LW.clock.playing, auto: lab.quality.auto, gov: lab.gov.on, presents: lab.stats.presents, autoRotate: lab.LW.camera.autoRotate, modRunning: lab.mod.running };
  const r = await runFake(lab, { frames: 6, camera: 'still', modulation: 'freeze' });
  const after = { t: lab.LW.clock.t, playing: lab.LW.clock.playing, auto: lab.quality.auto, gov: lab.gov.on, presents: lab.stats.presents, autoRotate: lab.LW.camera.autoRotate, modRunning: lab.mod.running };
  judge('THE LAB IS PUT BACK EXACTLY AS IT WAS: the clock returns to t = 4.125 and to PLAYING, AUTO SCALE and the GOVERNOR come back on, AUTO-ROTATE comes back, the modulation transport is restarted — and the jitter counter is advanced by the number of frames that really were presented rather than reset, which is the same honesty capture.js keeps',
    r.ok && after.t === before.t && after.playing === true && after.auto === before.auto
    && after.gov === before.gov && after.autoRotate === true && after.modRunning === true
    && after.presents === before.presents + 6,
    { before, after });

  const m = r.manifest;
  judge('THE MANIFEST IS THE AUDIT: it carries every scheduled t and offset, every frame\'s digest, the schedule\'s own exactness (endpoint, ulps, worst gap), the picture\'s size, grid, format, gamut and DEFLATE, the pin readings, the witness count and the ffmpeg line — so two runs are compared by diffing two small JSON files instead of a gigabyte of pixels, and a render that cannot be compared says why',
    m.format === 'lambdawaves/render-exact@1'
    && m.frames.length === 6 && m.frames.every((f) => typeof f.digest === 'string' && typeof f.t === 'number' && typeof f.off === 'number')
    && m.schedule.endpointExact === true && m.schedule.endpoint === 'exclusive' && typeof m.schedule.worstGapUlps === 'number'
    && m.picture.deflate === 'stored' && m.picture.deflateReproducible === true && m.picture.jitterSeed === DEFAULTS.jitterSeed
    && m.pins && m.pins.governor && m.pins.jitter && typeof m.witnesses.contended === 'number'
    && /ffmpeg -framerate 30/.test(m.ffmpeg) && m.caveats.length >= 3,
    { format: m.format, frames: m.frames.length, endpoint: m.schedule.endpoint, deflate: m.picture.deflate, ffmpeg: m.ffmpeg.slice(0, 70) });

  const H = createExactRenderer(lab.LW, { canvas: lab.canvas, grab: fakeGrabFor(lab, {}), energies: () => E12 }).hazards();
  const covered = ['jitter', 'governor', 'autoscale', 'fieldclock', 'camera', 'modulation', 'h2', 'interloper'];
  judge('EVERY HAZARD IN THE REGISTER IS THE SAME LIST THE DRIVER PINS, THE REPORT SHOWS AND THIS FILE TESTS — one register, so they cannot drift apart. Thirteen found, eight of them with a test above that goes RED when the pin is removed, and each carries what it is, where it lives, the pin and the witness',
    HAZARDS.length === 13 && HAZARD_IDS.length === 13
    && HAZARDS.every((h) => h.id && h.what && h.where && h.pin && h.witness)
    && covered.every((id) => HAZARD_IDS.includes(id))
    && H.readings.length === 13 && H.readings.every((r2) => typeof r2.note === 'string' && r2.state)
    && PATH_DEPENDENT_LAYERS.includes('particles'),
    { hazards: HAZARD_IDS, pinRemovalTests: covered.length, blockingNow: H.blocking });

  /* the plan warns BEFORE anything runs */
  const warnLab = fakeLab({ camera: { autoRotate: true }, modulation: true });
  const wex = createExactRenderer(warnLab.LW, { canvas: warnLab.canvas, grab: fakeGrabFor(warnLab, {}), energies: () => E12 });
  const p = wex.plan({ fps: 30, seconds: 6, observable: 'density' });
  judge('AND THE PLAN SAYS ALL OF IT BEFORE THE BUTTON COMMITS TO ANYTHING: the schedule, the cost in time and bytes, and the live warnings — a moving camera, a running modulation, and a size that came from THIS machine\'s device pixel ratio rather than from the caller',
    p.ok && p.N === 180 && p.warnings.length >= 3
    && p.warnings.some((w) => /CAMERA IS MOVING/.test(w)) && p.warnings.some((w) => /MODULATION RACK IS RUNNING/.test(w))
    && p.warnings.some((w) => /SIZE CAME FROM THIS MACHINE/.test(w))
    && p.hazards.blocking.includes('camera') && p.hazards.blocking.includes('modulation'),
    { N: p.N, cost: p.cost.human, blocking: p.hazards.blocking, warnings: p.warnings.map((w) => w.slice(0, 44)) });
}

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════
   §11 — THE CONTRACT WITH capture.js.  This file imports its primitives; a rename must go RED here, not in a
   browser at frame 300 of a ninety-minute render.
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
{
  const needed = ['AU_FS', 'VIEW_NAMES', 'viewCarriesGlobalPhase', 'wavePeriod', 'seamError', 'planPeriodRecording',
    'alignedBytesPerRow', 'planBands', 'maxPictureSize', 'fitPicture', 'slug', 'stamp', 'uniqueName',
    'toRGBA', 'crc32', 'zlibStored', 'pngFilter', 'buildPNG'];
  const missing = needed.filter((n) => CAP[n] === undefined);
  /* and the two files must agree about the loop's endpoint, or a still and a rendered frame are two schedules */
  const mine = exactSchedule({ mode: 'loop', T: D12.T, t0: 3.25, fps: 30, frames: 180 });
  const theirs = CAP.loopSchedule({ T: D12.T, N: 180, t0: 3.25 });
  let sameTimes = true;
  for (let k = 0; k < 180; k++) if (mine.at(k) !== theirs.at(k)) sameTimes = false;
  /* AND THE MERGE ORDER, WHICH COST A BUG: capture.js' plan carries a `schedule` of its own, so planExact must
     assign OURS over it — otherwise a caller renders THIS file's endpoint rule against THAT file's times, and
     for a loop the two agree, so nothing would ever have said. */
  const merged = planExact(D12, { mode: 'loop', fps: 30, seconds: 6, observable: 'density', energies: E12, t0: 45238.93, foldT0: true });
  judge('AND planExact HANDS BACK ITS OWN SCHEDULE, NOT THE ONE IT WRAPPED. capture.js\' plan carries a `schedule` key of its own, so the merge assigns ours OVER it; getting that backwards silently returned the sibling\'s times, which agree with ours for a loop at an ordinary origin and disagree for a SPAN, and for a loop whose origin was folded — which is how it was caught',
    merged.schedule.mode === 'loop' && merged.schedule.folded === true && merged.schedule.t0 !== 45238.93
    && typeof merged.schedule.worstGapUlps === 'number' && merged.schedule.endpoint === 'exclusive'
    && spanHasOwnSchedule(),
    { t0: merged.schedule.t0, folded: merged.schedule.folded, hasOurKeys: typeof merged.schedule.worstGapUlps === 'number' });

  judge('THE CONTRACT WITH capture.js IS PINNED HERE. This file imports eighteen of its primitives — the PNG parts, the readback arithmetic, the period reader and the names — so a rename in the sibling goes RED in this suite rather than at frame 300 of a ninety-minute render. And the two files agree bit for bit about a loop\'s times, so a still taken by the camera and a frame taken by the renderer are the same schedule',
    missing.length === 0 && sameTimes && CAP.ENDPOINT === ENDPOINT.loop && MODES.length === 2,
    { imported: needed.length, missing, sameTimesAsCapture: sameTimes, captureEndpoint: CAP.ENDPOINT, ourLoopEndpoint: ENDPOINT.loop });
}
function spanHasOwnSchedule() {
  const sp = planExact(null, { mode: 'span', t0: 0, span: 7.5, fps: 30, frames: 180 });
  return sp.schedule.mode === 'span' && sp.schedule.D === 179 && sp.schedule.endpoint === 'inclusive';
}

/* ════════════════════════════════════════════════════════════════════════════════════════════════════════════
   §12 — WHAT ONLY A BROWSER CAN ANSWER
   ════════════════════════════════════════════════════════════════════════════════════════════════════════════ */
console.log('\n      NOT PROVED HERE — a browser must answer these, and createExactRenderer(LW).verify() asks the\n'
  + '      first one in about a second at 160px:\n'
  + '        1  IS THE REAL RAY-MARCH A PURE FUNCTION OF THE PINNED INPUTS?  The fake shader in §6 is a model of\n'
  + '           field.js\' closure, not field.js.  verify() renders the same short schedule twice on the real GPU\n'
  + '           and compares the digests; a mismatch means something in the closure was missed.\n'
  + '        2  DOES THE GPU ITSELF ROUND THE SAME WAY TWICE?  WGSL arithmetic is deterministic per device, but\n'
  + '           two DIFFERENT GPUs may not agree bit for bit on a 300-step ray-march of transcendental functions.\n'
  + '           The claim this file makes is "the same schedule on the same device gives the same bytes at any\n'
  + '           speed"; "the same bytes on a different GPU" is a stronger claim and it is NOT made.\n'
  + '        3  DOES getCurrentTexture() OUTSIDE A rAF CALLBACK STILL COPY?  capture.js measured that it does at\n'
  + '           8192², and this file inherits the rule that the render and the copy sit in one synchronous block.\n'
  + '        4  DOES CompressionStream(\'deflate\') GIVE THE SAME BYTES ACROSS BROWSER BUILDS?  Assume not — that\n'
  + '           is hazard H12, and deflate: "stored" is the road that does not need the answer.\n');
console.log((FAILED ? 'RED ' : 'GREEN ') + 'render-exact.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
