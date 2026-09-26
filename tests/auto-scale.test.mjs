/* tests/auto-scale.test.mjs — THE ONE CONTROLLER (wave 128): AUTO SCALE's one rule (AS, 2026-09-25) and the GOVERNOR's grid
 * rung as ONE decision, judged on the REAL code: rack.js' `controlStep` is sliced out of the source and run here (the repo's
 * pattern: gpu-cleanup, project-import), and so is the frame loop's own bookkeeping — the window, the decision, the descent
 * record and THE PAUSE EDGE, from `if (tier >= TIER.PRESENT && !autoQ.presented++)` to `playedLast = clock.playing;` — so
 * this suite cannot drift from the shipped rule.  Part one is the scale lever alone (the AS suite, unchanged: the OLD rule it
 * replaced, 7dca938's EMA at 0.15, −0.1 / +0.05 every 24 loop frames, is modelled beside it); part two drives the real loop
 * block through present-bound and reconstruct-bound scenes, with and without vsync quantisation, and the pause edge.
 *   node tests/auto-scale.test.mjs */
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../lab/rack.js', import.meta.url), 'utf8');
const slice = (from, to, inclusive) => { const a = src.indexOf(from), b = src.indexOf(to, a); if (a < 0 || b < a) throw new Error('not found in lab/rack.js: ' + from.trim().slice(0, 60)); return src.slice(a, b + (inclusive ? to.length : 0)); };
const controlStep = new Function(slice('  function controlStep(', '\n  }\n', true) + '; return controlStep;')();
/** the scale lever alone, in AS's old signature: AUTO SCALE on, no grid rung free */
const autoScaleStep = (scale, iv, k, budgetMs, minScale, sinceMs, presented) => {
  const r = controlStep({ presented, sinceMs: 0, k, iv, m0: 0, s0: 1 }, sinceMs, scale, minScale, budgetMs, true, false);
  return r && r.scale;
};

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

/* ══ PART TWO · THE ONE CONTROLLER on the loop's own bookkeeping ══════════════════════════════════════════════════════════ */
const TIER = { NONE: 0, PRESENT: 1, RECONSTRUCT: 2, EVOLVE: 3, REBUILD: 4 };
const LOOP = slice('    if (tier >= TIER.PRESENT && !autoQ.presented++)', '    playedLast = clock.playing;\n', true);
const EFFECTIVE = slice('  const effectiveRes = () =>', '\n', false);
const frameBlock = new Function('S', `const { TIER, autoQ, quality, gov, clock, ui, perf, loopRing, frameBudget, RES_LADDER, schedule, busyFlash, perfBudgetMs, controlStep, effectiveRes } = S;
  const tier = S.tier, nowMs = S.nowMs, held = false; let playedLast = S.playedLast;
${LOOP}  S.playedLast = playedLast;`);
/** a lab playing a scene whose frame costs recon·(grid/128)³ + present·scale² ms, presented on a paced loop: each interval is
 *  the frame's cost (continuous) or that cost rounded up to whole refreshes (vsync-quantised); a grid rung's rebuild frame
 *  costs `rebuildMs` more.  The loop bookkeeping above runs after every present, exactly as in rack.js. */
function lab({ recon = 0, present = 0, budget = B60, refresh = budget, quant = false, auto = true, governor = true, res = 128, rebuildMs = 40 }) {
  const S = { autoQ: { presented: 0, sinceMs: 0, k: 0, iv: new Float64Array(32), lastMs: 0, changes: 0, m0: 0, s0: 1 },
    quality: { res, steps: { 64: 110, 96: 160, 128: 240 }[res], scale: 1, auto, autoScale: 1, minScale: MIN }, gov: { on: governor, drop: 0, median: 0, changes: 0 },
    clock: { playing: true }, ui: {}, perf: { counts: { frames: 0 }, ring: [] }, loopRing: [], frameBudget: { sample() {} }, RES_LADDER: [64, 96, 128],
    TIER, pending: 0, asked: [], busyFlash() {}, perfBudgetMs: () => budget, controlStep, playedLast: false, tier: TIER.EVOLVE, nowMs: 0 };
  S.schedule = (t) => { S.pending = Math.max(S.pending, t); S.asked.push(t); };
  S.effectiveRes = new Function('gov', 'quality', 'RES_LADDER', 'return ' + EFFECTIVE.replace(/^\s*const effectiveRes = /, '').replace(/;\s*$/, ''))(S.gov, S.quality, S.RES_LADDER);
  let t = 0, grid = S.effectiveRes();
  const stepsSeen = new Set([S.quality.steps]), trace = [], decisions = [];
  const frame = (tier) => {
    const g = S.effectiveRes(), s = S.quality.auto ? S.quality.autoScale : 1, rebuilt = g !== grid; grid = g;
    const c = recon * (g / 128) ** 3 + present * s * s + (rebuilt ? rebuildMs : 0);
    const k0 = S.autoQ.changes, d0 = S.gov.changes, p0 = S.autoQ.presented;
    S.tier = tier; S.nowMs = t; S.pending = 0; frameBlock(S); stepsSeen.add(S.quality.steps);
    if (S.autoQ.presented === 0 && p0 >= 6) decisions.push({ t: Math.round(t), median: +S.gov.median.toFixed(1), scale: S.quality.autoScale, grid: S.effectiveRes() });
    if (S.autoQ.changes !== k0 || S.gov.changes !== d0) trace.push([Math.round(t), S.quality.autoScale, S.effectiveRes()]);
    t += quant ? Math.max(1, Math.ceil(c / refresh - 1e-9)) * refresh : Math.max(refresh, c);
  };
  return { S, trace, decisions, stepsSeen,
    play(ms) { S.clock.playing = true; const end = t + ms; while (t < end) frame(TIER.EVOLVE); return this; },
    /** PAUSE: the transport stops and LW.pause asks one PRESENT; frames run while something is pending — how many after the edge? */
    pause() { S.clock.playing = false; S.asked = []; frame(TIER.PRESENT); const onEdge = [...S.asked]; let after = 0; while (S.pending && after < 10) { const p = S.pending; frame(p); after++; } return { onEdge, after }; },
    get scale() { return S.quality.autoScale; }, get grid() { return S.effectiveRes(); }, get rungs() { return S.gov.drop; } };
}
const over = (L) => L.S.gov.median > L.S.perfBudgetMs() * 4 / 3;
const gridChanges = (trace) => trace.filter(([, , g], i, a) => g !== (i ? a[i - 1][2] : 128)).length;
/* (a) PRESENT-BOUND: the scale mends it and the grid never moves — at every cost the floor can reach, both budgets, with and
 *     without vsync quantisation (the case the scale² test must not misread: a drop that lands a hair over a refresh reads as
 *     the same interval as before) */
{
  const rows = [], bad = [];
  let n = 0;
  for (const [budget, refresh] of [[B60, B60], [B120, B120], [B60, B120]]) for (const quant of [false, true]) for (let k = 12; k <= 8 * budget; k *= 1.06) {
    const L = lab({ present: k, budget, refresh, quant }).play(10000); n++;
    if (L.grid !== 128 || L.S.gov.changes || over(L) || L.trace.length > 3) bad.push({ budget: +budget.toFixed(1), refresh: +refresh.toFixed(1), quant, k: +k.toFixed(1), grid: L.grid, scale: L.scale, median: L.S.gov.median, trace: L.trace });
    if (Math.abs(k - 40) < 1.3) rows.push(`k≈40 B${Math.round(1000 / budget)}/r${Math.round(1000 / refresh)}${quant ? 'q' : ''}: ${JSON.stringify(L.trace)} → ${L.scale} @ ${L.grid}³, median ${L.S.gov.median.toFixed(1)}`);
  }
  console.log('      ' + rows.join('\n      '));
  judge(`A1 a present-bound frame (cost = k·scale², ${n} scenes: k from 12 ms to 8 budgets, 60 and 120 Hz budgets on 60/120 Hz refresh, continuous and vsync-quantised): the scale settles under the band's top in ≤ 3 resizes and the GRID NEVER MOVES (${bad.length} failures)`, bad.length === 0, bad.slice(0, 3));
  const heavy = lab({ present: 200, budget: B60 }).play(10000);
  judge(`A2 a present-bound frame the scale's floor cannot mend (200 ms at scale 1): the grid steps only once the scale is AT its floor, and the scale stays there (the descent measured a present-bound frame) — ${JSON.stringify(heavy.trace)}`,
    heavy.trace.every(([, s, g]) => g === 128 || s === MIN) && heavy.scale === MIN && heavy.grid < 128, heavy.trace);
}
/* (b) RECONSTRUCT-BOUND: the scale's drop does not lower the median as scale² predicts → the scale is restored and the grid steps */
{
  const out = {};
  for (const [name, recon, present, budget, refresh, quant] of [['50+5s² B60', 50, 5, B60, B60, false], ['50+5s² B60 q60', 50, 5, B60, B60, true], ['50+5s² B120 q120', 50, 5, B120, B120, true],
    ['30+3s² B60', 30, 3, B60, B60, false], ['30+3s² B60 q120', 30, 3, B60, B120, true], ['100+5s² B60', 100, 5, B60, B60, false], ['100+5s² B60 q60', 100, 5, B60, B60, true]]) {
    const L = lab({ recon, present, budget, refresh, quant }).play(15000);
    const firstRung = L.trace.findIndex(([, , g]) => g < 128);
    out[name] = { trace: L.trace, grid: L.grid, scale: L.scale, median: +L.S.gov.median.toFixed(1), scaleChangesBeforeRung: firstRung, restoredTo: firstRung >= 0 ? L.trace[firstRung][1] : null, steps: [...L.stepsSeen] };
    console.log(`      ${name}: ${JSON.stringify(L.trace)} → ${L.scale} @ ${L.grid}³, median ${L.S.gov.median.toFixed(1)}`);
  }
  const A = ['50+5s² B60', '50+5s² B60 q60', '50+5s² B120 q120'].map((k) => out[k]);
  judge('B1 the reconstruct-bound frame (50 ms flat + 5·scale²; 60/120 Hz budgets, continuous and quantised): ONE scale drop, then the grid rung at the next decision with the scale RESTORED to 1 on that same decision — never the old walk to 35 % — and the ray steps never change (no step rung exists)',
    A.every((o) => o.scaleChangesBeforeRung === 1 && o.restoredTo === 1 && o.steps.length === 1 && o.grid < 128), A);
  judge(`B2 one rung when one mends it: 30 ms flat + 3·scale² at 60 Hz ends at 96³ with the scale at ${out['30+3s² B60'].scale} (continuous) / ${out['30+3s² B60 q120'].scale} (quantised at 120 Hz), one grid change`,
    ['30+3s² B60', '30+3s² B60 q120'].every((k) => out[k].grid === 96 && out[k].scale === 1 && gridChanges(out[k].trace) === 1), [out['30+3s² B60'], out['30+3s² B60 q120']]);
  judge(`B3 the second rung only when the first did not mend it: 100 ms flat + 5·scale² at 60 Hz takes both and ends in the band (64³ at scale ${out['100+5s² B60'].scale} continuous / ${out['100+5s² B60 q60'].scale} quantised), each rung after a descent that failed its scale² test; 50 + 5·scale² takes its second only after its descent at 96³ failed`,
    ['100+5s² B60', '100+5s² B60 q60', '50+5s² B60'].every((k) => out[k].grid === 64 && out[k].median <= B60 * 4 / 3 && gridChanges(out[k].trace) === 2), [out['100+5s² B60'], out['100+5s² B60 q60'], out['50+5s² B60']]);
}
/* (c) THE SWITCHES: each lever only when its switch is on */
{
  const r = [];
  for (const [recon, present] of [[50, 5], [0, 40]]) {
    const off = lab({ recon, present, auto: false, governor: false }).play(10000);
    const gOnly = lab({ recon, present, auto: false, governor: true }).play(10000);
    const sOnly = lab({ recon, present, auto: true, governor: false }).play(10000);
    r.push({ recon, present, off: [off.scale, off.grid, off.trace.length], gridOnly: [gOnly.scale, gOnly.grid, gOnly.trace.length], scaleOnly: [sOnly.scale, sOnly.grid] });
  }
  console.log('      [scale, grid, changes]: ' + JSON.stringify(r));
  judge('C1 both switches OFF: nothing moves (scale 1, 128³, zero changes) on the reconstruct-bound and the present-bound frame', r.every((x) => x.off[0] === 1 && x.off[1] === 128 && x.off[2] === 0), r);
  judge('C2 AUTO SCALE off, GOVERNOR on: the scale never moves, only the grid steps; AUTO SCALE on, GOVERNOR off: only the scale moves, the grid stays at 128³', r.every((x) => x.gridOnly[0] === 1 && x.gridOnly[1] < 128 && x.scaleOnly[1] === 128), r);
}
/* (d) THE PAUSE EDGE (W125-2): the grid back to the user's, the scale to 1, once, with ONE frame */
{
  const L = lab({ recon: 50, present: 5, budget: B120, refresh: B120, quant: true }).play(8000);
  const mid = { scale: L.scale, grid: L.grid, changes: L.S.gov.changes }, e = L.pause();
  const again = L.pause();
  judge(`D1 THE PAUSE EDGE: playing at ${mid.scale} × ${mid.grid}³, PAUSE puts back 128³ and scale ${L.scale} on the edge frame (asked ${JSON.stringify(e.onEdge)}), exactly ONE frame runs after it (${e.after}), one grid change counted for the restore; a second paused frame asks nothing (${again.after})`,
    mid.grid < 128 && L.grid === 128 && L.scale === 1 && e.after === 1 && L.S.gov.changes === mid.changes + 1 && again.after === 0 && again.onEdge.length === 0, { mid, e, again });
  const P = lab({ present: 40, budget: B60 }).play(3000), s0 = P.scale, pe = P.pause(), s1 = P.scale, n0 = P.trace.length;
  P.play(3000);
  judge(`D2 a present-bound play: the scale (${s0}) returns to 1 on the edge with one frame (${pe.after}), the grid untouched; PLAY again re-fits within its first decision (${P.scale}, ${P.trace.length - n0} resize after the edge)`,
    s0 < 1 && s1 === 1 && pe.after === 1 && P.scale === s0 && P.trace.length - n0 === 1 && P.grid === 128, { s0, pe, trace: P.trace });
}
/* (e) THE STEP RUNG IS GONE: no code path lowers the ray steps under load */
{
  const caps = src.match(/setStepCap\([^;]*\)/g) || [], stepsW = src.match(/mat\.steps\s*=[^=][^;]*/g) || [];
  judge(`E1 no step rung: rack.js has no STEP_LADDER / stepDrop, its one setStepCap is the tablet's while-moving cap (${JSON.stringify(caps)}), and mat.steps is written only from the user's quality (${JSON.stringify(stepsW)})`,
    !/STEP_LADDER|stepDrop/.test(src) && caps.length === 1 && caps[0] === 'setStepCap(tabletMotion ? tablet.steps : Infinity)' && stepsW.length === 1 && /quality\.steps/.test(stepsW[0]), { caps, stepsW });
}

console.log(`\n${TOTAL - FAILED}/${TOTAL} GREEN — THE ONE CONTROLLER`);
if (FAILED) process.exit(1);
