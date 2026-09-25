/* tests/auto-scale.test.mjs — AUTO SCALE's one rule (AS, 2026-09-25), judged on the REAL function: rack.js'
 * `autoScaleStep` is sliced out of the source and run here (the repo's pattern: gpu-cleanup, project-import), so this
 * suite cannot drift from the shipped rule.  The loop around it (the window opens on its first presented frame and closes
 * on a decision; it keeps the presented intervals ≤ 250 ms and is judged on their MEDIAN) is modelled line for line from
 * rack.js' frame loop, and the OLD rule it replaced (7dca938: an EMA at 0.15, −0.1 / +0.05 every 24 loop frames with ≥ 18
 * presented) is modelled beside it, so convergence times and canvas-resize counts print side by side.
 *   node tests/auto-scale.test.mjs */
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../lab/rack.js', import.meta.url), 'utf8');
const start = src.indexOf('  function autoScaleStep('), end = src.indexOf('\n  }', start) + 4;
if (start < 0 || end < start) throw new Error('autoScaleStep not found in lab/rack.js');
const autoScaleStep = new Function(src.slice(start, end) + '; return autoScaleStep;')();

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 400)));
}
const MIN = 0.35, B120 = 1000 / 120, B60 = 1000 / 60, GRID = Array.from({ length: 14 }, (_, i) => +(0.35 + 0.05 * i).toFixed(2));
const onGrid = (s) => Math.abs(s * 20 - Math.round(s * 20)) < 1e-9;
/** one decision on a window whose intervals are `ivs` (a number = eight equal intervals) */
const step = (scale, ivs, budget, sinceMs = 300, presented = 9) => {
  const a = typeof ivs === 'number' ? new Array(8).fill(ivs) : ivs, ring = new Float64Array(32);
  a.forEach((v, i) => { ring[i & 31] = v; });
  return autoScaleStep(scale, ring, a.length, budget, MIN, sinceMs, presented);
};

/* ── the rule, one decision at a time ─────────────────────────────────────────────── */
{
  const s1 = step(1, 120, B120, 417, 6), s2 = step(s1, 120 * s1 * s1, B120, 417, 6);
  judge(`D1 from scale 1 with 120 ms frames against the 120 Hz budget 8.33 ms, the first decision lands at ≤ 0.5 (${s1}) and the second at the floor (${s2}); at 12 fps six presents span 5 × 83 ms = 417 ms, so the first lands inside 0.5 s`, s1 <= 0.5 && s2 === MIN, { s1, s2 });
  let early = 0;
  for (const p of [0, 1, 5]) for (const t of [0, 249, 1000]) if (step(1, 120, B120, t, p) !== null) early++;
  for (const t of [0, 100, 249.9]) if (step(1, 120, B120, t, 60) !== null) early++;
  judge('D2 no decision before 250 ms AND 6 presented frames: null for every (presented < 6) or (since < 250 ms) case', early === 0, { early });
  let bad = 0, n = 0; const seen = [];
  for (const s of GRID) for (let e = 0.5; e < 400; e *= 1.07) for (const b of [B120, B60]) {
    const r = step(s, e, b); n++;
    if (!(r >= MIN && r <= 1 && onGrid(r)) || r > s * 1.15 + 1e-9 || r < Math.max(MIN, s * 0.5) - 1e-9) { bad++; if (seen.length < 4) seen.push({ s, e, b, r }); }
  }
  judge(`D3 over ${n} (scale, interval, budget) cases the result is on the 0.05 grid, within [minScale, 1], at most ×1.15 up and ×0.5 down in one decision`, bad === 0, { bad, seen });
  let moved = 0;
  for (const s of GRID) for (const b of [B120, B60]) for (let e = b * 1.08 + 1e-6; e <= b * 4 / 3; e += b * 0.01) if (step(s, e, b) !== s) moved++;
  judge('D4 inside the band (budget·1.08, budget·4/3] nothing moves, at every scale and both budgets', moved === 0, { moved });
  let vs = 0;
  for (const s of GRID) for (const b of [B120, B60]) for (const e of [b, b * 1.02, b * 1.08]) if (step(s, e, b) !== s) vs++;
  judge('D5 at vsync (interval = the budget … budget·1.08) it does NOT probe up: the interval cannot show headroom there, and every step is a canvas reallocation', vs === 0, { vs });
  const up = step(0.35, 4, B120), up2 = step(0.9, 4, B60);
  judge(`D6 measured headroom climbs, capped: 0.35 → ${up} at 4 ms / budget 8.33, 0.9 → ${up2} at 4 ms / budget 16.7`, up === 0.4 && up2 === 1, { up, up2 });
  judge('D7 a window with fewer than 3 intervals (no measurement yet) holds', step(0.6, [], B120) === 0.6 && step(0.6, [90, 90], B120) === 0.6);
  const desk = [17, 16, 17, 100, 17, 50, 17, 16, 33, 17, 50, 17, 16, 17, 83];     // 5 of 15 slow: a burst, not a slow scene
  const heavy = [17, 50, 83, 50, 17, 83, 50, 17, 50, 83, 17, 50, 17, 83, 50];     // 10 of 15 slow: a slow scene
  judge(`D8 THE MEDIAN: a 60 Hz window with a burst of five slow frames (up to 100 ms) holds at 1 (${step(1, desk, B60, 300, 16)}); ten of fifteen slow drops (${step(1, heavy, B60, 300, 16)})`, step(1, desk, B60, 300, 16) === 1 && step(1, heavy, B60, 300, 16) < 1);
}

/* ── lands in ONE decision, then HOLDS (the resize trap: every step reallocates the canvas) ─────────────── */
{
  const fails = [];
  for (let k = 11.2; k <= 4 * B120; k += 0.25) for (const quant of [false, true]) {
    const iv = (s) => { const c = k * s * s; return quant ? Math.max(1, Math.ceil(c / B120 - 1e-9)) * B120 : Math.max(B120, c); };
    const s1 = step(1, iv(1), B120), s2 = step(s1, iv(s1), B120), s3 = step(s2, iv(s2), B120);
    if (!quant && k * s1 * s1 < B120 - 1e-9) fails.push({ k, s1, why: 'overshot below the budget' });
    if (!quant && s2 !== s1) fails.push({ k, s1, s2, why: 'moved again' });
    if (quant && (s2 > s1 || s3 !== s2)) fails.push({ k, s1, s2, s3, why: 'quantized: not settled by the second decision' });
  }
  judge('L1 a present-bound frame (cost = k·scale², k from 11.2 ms to 4·budget) is judged ONCE with continuous intervals — the second decision holds and the first never undershoots the budget; with vsync-QUANTIZED intervals (a miss reads as two refreshes, so one step can land a hair over) it settles by the second decision, downward only, and holds', fails.length === 0, fails.slice(0, 4));
}

/* ── the loop, simulated: the new rule vs the old one ───────────────────────────────── */
function sim(rule, { k, budget = B120, refresh = B120, quant = false, T = 10000, s0 = 1, hitch = null }) {
  let t = 0, scale = s0, ema = 0, lastMs = 0, presented = 0, sinceMs = 0, n = 0, kk = 0, prev = s0, resizes = 0, frame = 0;
  const ring = new Float64Array(32), trace = [];
  while (t < T) {
    /* one loop frame: the present at `scale`, then rack.js' bookkeeping, in its order */
    if (!presented++) { sinceMs = t; kk = 0; }
    n++;
    if (lastMs) { const iv = t - lastMs; if (iv <= 250) { ring[kk++ & 31] = iv; ema = ema ? ema * 0.85 + iv * 0.15 : iv; } }
    lastMs = t;
    if (rule === 'new') {
      const next = autoScaleStep(scale, ring, kk, budget, MIN, t - sinceMs, presented);
      if (next !== null) { scale = next; presented = 0; }
    } else if (n >= 24) {
      if (presented >= 18 && ema) {
        if (ema > budget * 4 / 3 && scale > MIN) scale = Math.max(MIN, +(scale - 0.1).toFixed(2));
        else if (ema <= budget * 1.08 && scale < 1) scale = Math.min(1, +(scale + 0.05).toFixed(2));
      }
      n = 0; presented = 0;
    }
    if (scale !== prev) { resizes++; trace.push([Math.round(t), scale]); prev = scale; }
    let c = k * scale * scale; if (hitch && hitch(frame++, t)) c = Math.max(c, 100);
    t += quant ? Math.max(1, Math.ceil(c / refresh - 1e-9)) * refresh : Math.max(refresh, c);
  }
  return { final: scale, resizes, trace };
}
const settleMs = (r, target) => { let at = 0; for (const [t, s] of r.trace) at = Math.abs(s - target) <= 0.05 + 1e-9 ? (at || t) : 0; return Math.abs(r.final - target) <= 0.05 + 1e-9 ? at : Infinity; };
{
  const k = 150, target = Math.max(MIN, Math.sqrt(B120 / k));
  const nw = sim('new', { k }), old = sim('old', { k, T: 60000 });
  const tNew = settleMs(nw, target), tOld = settleMs(old, target), oldDecisions = old.trace.length;
  console.log(`      slow device (150 ms at scale 1, budget 8.33): within one 0.05 step of ${target.toFixed(2)} — NEW ${tNew} ms ${JSON.stringify(nw.trace)} · OLD ${tOld} ms (${oldDecisions} decisions × 24 frames) ${JSON.stringify(old.trace)}`);
  judge(`S1 the slow device converges to within one step of the budget-meeting scale in ${tNew} ms (< 1.5 s; its first decision alone waits 6 presents × 150 ms) against the old rule's ${(tOld / 1000).toFixed(1)} s (${oldDecisions} decisions × 24 frames ≥ 7)`, tNew < 1500 && oldDecisions >= 7 && tOld > 5 * tNew, { tNew, tOld, oldDecisions });
  const k2 = 120, t2 = Math.max(MIN, Math.sqrt(B120 / k2)), a = sim('new', { k: k2 }), b = sim('old', { k: k2, T: 60000 });
  console.log(`      120 ms at scale 1: NEW ${settleMs(a, t2)} ms · OLD ${settleMs(b, t2)} ms`);
  judge('S2 the same at 120 ms/frame: under 1.5 s new, more than five times longer old', settleMs(a, t2) < 1500 && settleMs(b, t2) > 5 * settleMs(a, t2));
}
{
  const rows = []; let worst = 0, oldWorst = 0, lastAt = 0;
  for (const k of [9, 12, 16, 20, 30, 60, 150]) for (const quant of [false, true]) {
    const a = sim('new', { k, quant }), b = sim('old', { k, quant });
    worst = Math.max(worst, a.resizes); oldWorst = Math.max(oldWorst, b.resizes); lastAt = Math.max(lastAt, a.trace.length ? a.trace[a.trace.length - 1][0] : 0);
    rows.push(`k=${k}${quant ? 'q' : ''} new ${a.final}/${a.resizes} old ${b.final}/${b.resizes}`);
  }
  console.log('      10 s of play, final scale / canvas resizes (q = vsync-quantized intervals): ' + rows.join(' · '));
  judge(`R1 10 s of play from scale 1 on seven present-bound devices, continuous and vsync-quantized: at most ${worst} canvas resizes each, the last at ${lastAt} ms (3 only where the ×0.5 cap and a quantized miss both bite: 1 → 0.5 → 0.4 → 0.35); the old rule: up to ${oldWorst}, hunting for the whole 10 s`, worst <= 3 && oldWorst >= 30 && lastAt < 1500, { worst, oldWorst, lastResizeMs: lastAt });
  const desk = sim('new', { k: 6, budget: B60, refresh: B60, quant: true }), desk120 = sim('new', { k: 7, quant: true });
  const burst = sim('new', { k: 6, budget: B60, refresh: B60, quant: true, hitch: (f) => f === 3 || f === 5 || f === 6 || f === 40 || f === 41 || (f >= 90 && f < 94) });
  judge('R2 a desktop that meets its budget at scale 1 (60 Hz and 120 Hz panels) never leaves 1 — also through bursts of 100 ms frames at play start and mid-play: zero resizes', desk.resizes === 0 && desk120.resizes === 0 && burst.resizes === 0 && desk.final === 1, { desk: desk.resizes, desk120: desk120.resizes, burst: burst.resizes });
}

console.log(`\n${TOTAL - FAILED}/${TOTAL} GREEN — AUTO SCALE's one rule`);
if (FAILED) process.exit(1);
