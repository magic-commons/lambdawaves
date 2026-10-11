// (d) recompute the per-cut line sums of PLAN-DRAFT-0 §D.1–D.14, §D.18, then apply §J.1–J.3 and my own corrections. Every number is the plan's unless tagged 'review'.
import fs from 'node:fs';
const CAP = 280;
const cuts = {};
const add = (cut, label, n, tag = 'plan') => { (cuts[cut] ??= { items: [], minus: [] }).items.push({ label, n, tag }); };
const sub = (cut, label, n, tag = 'plan') => { (cuts[cut] ??= { items: [], minus: [] }).minus.push({ label, n, tag }); };
// ---- 0.6.0 as D.1 wrote it
[['C7 meaning check', 4], ['C2 period guard', 1], ['M2+M2prime equalizer (incl. WGSL +30)', 120], ['SIGNED presenter branch', 40], ['C1 nodes stand down', 6], ['C4 H2 caption', 8], ['M3 period', 8], ['M12 chord (S, +20)', 20], ['M11a routes', 12], ['flash law', 10], ['dephasing caption', 1]].forEach(([l, n]) => add('0.6.0 (D.1 as written)', l, n));
// ---- 0.6.0 after J.1/J.2 and review
[['C7', 4], ['C2', 1], ['M2+M2prime (JS+twin+tables, WGSL +30 inside)', 120], ['J.2-2 separate module: WGSL 60 instead of 30', 30, 'J.2-2 (not added to D.18)'], ['C1', 6], ['C4', 8], ['M3', 8], ['M12 chord: J.1-3 says M-L not S (review: oscillator bank + context lifecycle ~60)', 60, 'review'], ['M11a', 12], ['flash law', 10], ['dephasing caption', 1], ['N6 part (Round 2 counted +10 here; D.1 omits it)', 10, 'Round2'], ['A/B Rabi node oracle (J.2-7)', 5, 'J.2-7'], ['TEXEL-FLOOR tile (J.1-7, "0.6.x N6")', 8, 'review']].forEach(([l, n, t]) => add('0.6.0 (after J + review)', l, n, t || 'plan'));
sub('0.6.0 (D.1 as written)', 'stale comments + retired shim', 10); sub('0.6.0 (after J + review)', 'stale comments + retired shim', 10);
// ---- the other cuts, D.2-D.14 as written
[['M4 factor road', 150], ['M10 symmetry certificate', 15], ['M6 frozen core', 15], ['M5a mirror half', 40], ['N6 VALENCE bar', 5]].forEach(([l, n]) => add('0.6.1', l, n)); sub('0.6.1', 'molecule.js -75 (CONFLICT: 0.8.1 H2+ revival needs fieldModes at molecule.js:72)', 75);
[['M1 continuity', 155], ['M7 gated', 12], ['M11b drive pitch', 12], ['N6 honest readouts', 10]].forEach(([l, n]) => add('0.6.2', l, n));
[['M8 classifier', 40], ['M8prime angular nodes', 40], ['M5b asym unit', 60]].forEach(([l, n]) => add('0.6.3', l, n)); sub('0.6.3', 'vortex.js reconnection prose (vortex.js is 95 lines)', 20);
[['N1 hydrogen song', 90], ['STREAM queue', 25]].forEach(([l, n]) => add('0.6.4', l, n)); sub('0.6.4', 'modrive.js -80 (sin2Pulse is imported by mathworker.js:43 and must move)', 80);
[['N2 electrostatics', 140], ['J.2-4 RU upload pass', 35]].forEach(([l, n]) => add('0.6.5 (J.3)', l, n)); sub('0.6.5 (J.3)', 'shadow.js -> tests/lib', 90);
[['N3 vibrate', 80], ['N3prime skeleton (J.1-8)', 60], ['PULSES (J.2-11)', 20]].forEach(([l, n]) => add('0.7.0 (J.3)', l, n));
[['N8 UHF/ROHF "L" (<=250; plan: brief names it; D.18 shows <=140)', 140, 'D.18']].forEach(([l, n, t]) => add('0.7.1', l, n, t)); sub('0.7.1', '>= half of the lines (brief)', 70);
[['N4 lattice', 120]].forEach(([l, n]) => add('0.7.2', l, n)); sub('0.7.2', 'absorb dead half', 35);
[['RKS LDA', 180]].forEach(([l, n]) => add('0.7.3', l, n));
[['shelves UI', 60]].forEach(([l, n]) => add('0.7.4', l, n));
// 0.8.0 as D.12 wrote it (pre-J) and as J.3 re-cut
[['N5 log-space', 30], ['free packet', 60], ['potential lab', 80], ['coherent/squeezed/cat', 15], ['Rabi + Bloch', 60], ['mass scaling', 10], ['bead', 40]].forEach(([l, n]) => add('0.8.0 (D.12 as written)', l, n)); sub('0.8.0 (D.12 as written)', 'dead spaces + Mode.ctr (re-bake)', 40);
[['Central family via RC + POTENTIAL picker', 100], ['SQUEEZED + CAT', 40], ['INTER-SHELL STARK', 50], ['CIRCULAR RYDBERG n<=24 (no shader)', 30], ['MASS SCALING', 10], ['BEAD (no ellipsoid)', 30], ['FREE PACKET as the box at its largest radius', 5], ['A/B Rabi oracle', 5], ['1-D line plot of psi(x) (J.1-4, ray sample)', 20, 'J.1-4 (J.3 omits)']].forEach(([l, n, t]) => add('0.8.0 (J.3)', l, n, t || 'J.3'));
sub('0.8.0 (J.3)', 'none: J.2-2 withdraws the re-bake and the -40', 0);
[['H2+ double well', 80], ['H2 curve', 50], ['Rabi + Bloch (ORBIT painter)', 50], ['Lattice II presets', 20]].forEach(([l, n]) => add('0.8.1 (J.3)', l, n)); 
[['QHO Wigner', 40], ['coherence map', 30], ['A(t) trace', 30], ['ellipsoid', 50]].forEach(([l, n]) => add('0.8.2 (J.3, priced rows only)', l, n));
const rows = Object.entries(cuts).map(([cut, c]) => { const plus = c.items.reduce((s, i) => s + i.n, 0), minus = c.minus.reduce((s, i) => s + i.n, 0); return { cut, plus, minus, net: plus - minus, vsCap: CAP - (plus - minus), items: c.items.length }; });
const D18 = { '0.6.0': [230, 10], '0.6.1': [225, 75], '0.6.2': [190, 0], '0.6.3': [140, 20], '0.6.4': [115, 80], '0.6.5': [140, 0], '0.7.0': [80, 0], '0.7.1': ['brief', '>=half'], '0.7.2': [120, 35], '0.7.3': [180, 'brief'], '0.7.4': [60, 0], '0.8.0': [295, 40], '0.8.1': [70, 0], '0.8.2': [60, 0] };
const sumNew = [230, 225, 190, 140, 115, 140, 80, 120, 180, 60, 295, 70, 60].reduce((a, b) => a + b, 0);
const sumNewWith071 = sumNew + 140;
const gatedTwo = 180 + 140;
// the narrative numbers: A says "~11 cuts, ~1,350 new lines against ~3,000 of headroom, minus ~250"; D.18 says "~1,900 incl. the gated two (~1,580 without); minus ~300; ~14 cuts (~3,900 headroom)"
const out = { cap: CAP, rows, D18_as_printed: D18, D18_sumNew_excluding_0_7_1: sumNew, D18_sumNew_including_0_7_1_at_140: sumNewWith071, D18_sumNew_minus_0_7_3_only: sumNew - 180, D18_claimed_without_gated: 1580,
  D18_named_minus_sum_with_071_half: [10, 75, 0, 20, 80, 0, 0, 70, 35, 0, 0, 40, 0, 0].reduce((a, b) => a + b, 0), cuts_between_here_and_1_0_counted_in_D18: 14, cuts_claimed_in_A: 11, new_lines_claimed_in_A: 1350, headroom_claimed_in_A: 3000,
  items: cuts };
fs.writeFileSync(new URL('./sonnet0-d-linesums.json', import.meta.url), JSON.stringify(out, null, 1));
for (const r of rows) console.log(r.cut.padEnd(36), 'plus', String(r.plus).padStart(4), 'minus', String(r.minus).padStart(3), 'net', String(r.net).padStart(4), 'vs280', String(r.vsCap).padStart(4));
console.log('D.18 sum of printed +new (without 0.7.1):', sumNew, ' with 0.7.1 at 140:', sumNewWith071, ' minus-the-two-gated (180 + 140):', sumNewWith071 - gatedTwo, ' named minus:', out.D18_named_minus_sum_with_071_half);
