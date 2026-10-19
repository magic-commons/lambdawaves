/* tests/qband.test.mjs — THE ANGULAR q-BAND, an ANCHOR (0.5.4 P10 · PLAN §E, §G; PM-13).  No lab/ change.
 *
 * WHAT THIS IS.  Sol (GPT-6.1, 9 October 2026, "The finite hydrogen Angular–Bohr support", OPENAI MATH — DISCOVERY ROUND 2) derived
 * a COUNT: the 91-mode register of hydrogen n ≤ 6 (H diagonal, E_n = −1/2n², the declared z axis) has 36 distinct joint labels (n, m),
 * and its density |ψ|² has 351 possible joint (ω, q) channels — q = m − m′ the azimuthal band, ω = E_n − E_n′ the temporal one — rather
 * than the rectangular 21 × 31 = 651; 21 of the 351 are at ω = 0 (−10 ≤ q ≤ 10), the 15 positive gaps are distinct, and every shell
 * pair (n, n′) carries the 2(n + n′ − 2) + 1 bins |q| ≤ n + n′ − 2.  This suite computes THE SAME QUANTITIES FROM OUR CODE and puts
 * them side by side.  It checks our code against Sol's count; it does NOT check Sol's proof, and no number below is asserted to be
 * "right" because it is Sol's.  A DISAGREEMENT IS REPORTED, in the assertion message, with both sides — it is never repaired on
 * either side (not here, not in lab/): the report goes to the pilot.
 *
 * WHERE SOL'S NUMBERS COME FROM.  The ledger line is research/release-0.5.4/survey/CODEX-ROUNDS.md (round 2: "351 joint density
 * channels for n≤6 hydrogen, an exact count") and the derivation is `Angular–Bohr support and rank.md` in the read-only
 * `for CODEX/OPENAI MATH — DISCOVERY ROUND 2/` folder (read once, by a builder, for these numbers; nothing of Sol's is run).
 *
 * OUR ROAD.  lab/frontier.js coaxialPolynomial(re, im, ids, r, θ) is exactly Sol's grouping f_{n,m}(r, θ) = Σ_l c_nlm R_nl Y_l^m(θ, 0):
 * for the mode set `ids` it returns the coefficients g_m of P(w) = Σ g_m w^{m − m_min} on the coaxial circle (r, θ).  Called once per
 * shell with generic coefficients on a generic non-nodal ring, a label (n, m) is PRESENT iff its g_m is non-zero; the density's (ω, q)
 * bin is OCCUPIED iff the cross term Σ_{m − m′ = q} g_{n,m} conj(g_{n′,m′}) is non-zero, which is the convolution of two such
 * polynomials — so the 351 are counted from coaxialPolynomial's own output, not from the formula Sol summed.  E_n comes from
 * hydrogen.js (`energy`), as the integer 7200·E_n.
 *
 * THE THRESHOLDS (an instrument choice, stated because the first draft of this file got one wrong and read 349 instead of 351 — that
 * was a threshold of 1e-12 ABSOLUTE killing the genuinely tiny q = ±10 cross term g_{6,5}·conj(g_{6,−5}) ≈ 1e-12 at r = 3.1, not a
 * disagreement of the two counts).  Now both are RELATIVE: a label is present when |g| > 1e-9 of its shell's largest |g|, a bin is
 * occupied when its cross term is not cancelled to rounding, |Σ a·conj(b)| > 1e-9·Σ|a||b|.  Two rings are counted. */
import assert from 'node:assert/strict';
import { coaxialPolynomial } from '../lab/frontier.js';
import { BASIS, N6, energy } from '../lab/hydrogen.js';
const NMAX = 6;   // iteration 008 A7: the register reaches n = 7; Sol's count is of its n ≤ 6 part, the 91 labels at their old indices — counted there

/** Sol's side, as stated in the ledger; each is also re-derived from our side below, never from this table */
const SOL = Object.freeze({ nmax: 6, modes: 91, labels: 36, rectangular: 651, channels: 351, atZeroOmega: 21, positiveGaps: 15,
  positiveChannels: 165 /* channels = 21 + 2·165: Σ_{n<n′} [2(n + n′ − 2) + 1] */, largestGapQmax: 5 /* shells 1 and 6: 35/72 a.u., |q| ≤ 5 */,
  largestGap: 3500, gaps: [44, 81, 125, 175, 256, 300, 500, 675, 756, 800, 2700, 3200, 3375, 3456, 3500] /* units of 1/7200 a.u., Sol's list */ });

assert.equal(NMAX, SOL.nmax, `the counted sub-register is n ≤ ${NMAX}; Sol's count is for n ≤ ${SOL.nmax} — not comparable`);
assert.equal(N6, SOL.modes, `the n ≤ 6 part has ${N6} modes; Sol's count is for ${SOL.modes}`);

/* generic coefficients on all 91 modes (seeded; every mode non-zero) */
let seed = 20261009; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const re = new Float64Array(BASIS.length), im = new Float64Array(BASIS.length);
for (let a = 0; a < BASIS.length; a++) { re[a] = 0.25 + rnd(); im[a] = rnd() - 0.5; }
const REL = 1e-9;
const w7200 = (n) => Math.round(7200 * energy(n));              // 7200·E_n = −3600/n², an integer for n ≤ 6
const wUnit = (U) => (n) => Math.round(U * energy(n));          // U·E_n an integer: 7200 for n ≤ 6, 352800 = 2·lcm(1…7)² for n ≤ 7 (iteration 009 N7)
for (let n = 1; n <= NMAX; n++) assert.equal(w7200(n) * n * n, -3600, `7200·E_${n} is the integer −3600/${n}²`);

/** everything Sol counts, computed from coaxialPolynomial on the ring (r bohr, θ rad); NM the top shell, w the integer energy */
function census(R, THETA, NM = NMAX, w = w7200) {
  const g = []; let labels = 0;                                  // g[n] = Map m → {re, im}
  for (let n = 1; n <= NM; n++) {
    const ids = BASIS.filter((s) => s.n === n).map((s) => s.index);
    const P = coaxialPolynomial(re, im, ids, R, THETA), top = Math.max(...P.gAbs), row = new Map();
    assert(P.mmin === 1 - n && P.mmax === n - 1, `shell ${n}: m runs ${P.mmin}..${P.mmax}`);
    P.coeffs.forEach((c, k) => { if (Math.hypot(c.re, c.im) > REL * top) row.set(P.mmin + k, c); });
    g[n] = row; labels += row.size;
  }
  const bins = new Map();                                        // "ω7200|q" → the cross term Σ a·conj(b) and Σ|a||b|, over every ordered pair of shells
  for (let n = 1; n <= NM; n++) for (let n2 = 1; n2 <= NM; n2++) {
    const dw = w(n) - w(n2);
    for (const [m, a] of g[n]) for (const [m2, b] of g[n2]) {
      const key = dw + '|' + (m - m2), cur = bins.get(key) || { re: 0, im: 0, mag: 0 };
      cur.mag += Math.hypot(a.re, a.im) * Math.hypot(b.re, b.im);
      cur.re += a.re * b.re + a.im * b.im; cur.im += a.im * b.re - a.re * b.im;     // a · conj(b)
      bins.set(key, cur);
    }
  }
  let channels = 0, atZero = 0, positive = 0, qmaxAtZero = 0; const gaps = new Set(), qmaxOfGap = new Map();
  for (const [key, v] of bins) {
    if (Math.hypot(v.re, v.im) <= REL * v.mag) continue;
    const [dw, q] = key.split('|').map(Number);
    channels++;
    if (dw === 0) { atZero++; qmaxAtZero = Math.max(qmaxAtZero, Math.abs(q)); } else if (dw > 0) { positive++; gaps.add(dw); qmaxOfGap.set(dw, Math.max(qmaxOfGap.get(dw) || 0, Math.abs(q))); }
  }
  const gapList = [...gaps].sort((x, y) => x - y), widest = Math.max(...gapList);
  return { labels, channels, atZero, positive, qmaxAtZero, gapList, widest, widestQ: qmaxOfGap.get(widest) };
}

let shellPairBins = 0; for (let n = 1; n <= NMAX; n++) for (let n2 = n + 1; n2 <= NMAX; n2++) shellPairBins += 2 * (n + n2 - 2) + 1;
const lines = [];
for (const [R, THETA] of [[10, 1.0719], [20, 0.6]]) {          // r in bohr, θ in rad: rings off the axis and off every node plane
  const c = census(R, THETA);
  /* ── the comparison: each quantity, ours beside Sol's; a difference is REPORTED in the message and fixed nowhere ───────── */
  const rows = [['joint labels (n, m)', c.labels, SOL.labels], ['naive rectangle (21 × 31)', 21 * 31, SOL.rectangular],
    ['(ω, q) density channels', c.channels, SOL.channels], ['channels at ω = 0', c.atZero, SOL.atZeroOmega], ['channels at ω > 0 (= at ω < 0)', c.positive, SOL.positiveChannels],
    ['distinct positive gaps', c.gapList.length, SOL.positiveGaps], ['|q| reached at the largest gap', c.widestQ, SOL.largestGapQmax],
    ['the largest gap, in 1/7200 a.u.', c.widest, SOL.largestGap], ['the fifteen positive gaps, in 1/7200 a.u.', c.gapList.join(','), SOL.gaps.join(',')],
    ['|q| reached at ω = 0', c.qmaxAtZero, 2 * (NMAX - 1)]];
  const disagree = rows.filter(([, ours, sol]) => ours !== sol);
  const table = rows.map(([k, ours, sol]) => `${k}: ours ${ours}, Sol ${sol} ${ours === sol ? 'AGREE' : 'DISAGREE'}`).join(' · ');
  assert.equal(disagree.length, 0, `Q-BAND ANCHOR (ring r = ${R}, θ = ${THETA}): OUR COUNT DISAGREES WITH SOL'S on ${disagree.map((r) => r[0]).join('; ')} — REPORT TO THE PILOT; do not edit lab/frontier.js or this table to match.  ${table}`);
  assert.equal(c.channels, c.atZero + 2 * shellPairBins, `channels = (ω = 0 bins) + 2·Σ_{n<n′}(2(n + n′ − 2) + 1): ${c.channels} vs ${c.atZero + 2 * shellPairBins}`);
  lines.push(`ring r = ${R}, θ = ${THETA}: ${table}`);
}
console.log(`PASS THE q-BAND ANCHOR (ours counted from coaxialPolynomial, Sol's from the ledger; a difference would be REPORTED, never fixed) — ${lines.join('\n  ')}\n  Generic seeded coefficients on all ${N6} modes of n ≤ 6; the ${SOL.channels} occupied bins are the non-cancelled cross terms of the per-shell polynomials.`);

/* ── THE SEVENTH SHELL (iteration 009 N7): the register reaches n = 7, so the same census runs on all 140 labels.  Sol's count is of n ≤ 6 and stays
   the anchor above; here OUR count at n ≤ 7 is set beside SOL'S STATED RULE carried one shell up (not a ledger number): N² = 49 joint labels,
   4N − 3 = 25 bins at ω = 0 (|q| ≤ 2(N − 1) = 12), every shell pair (n, n′) carrying 2(n + n′ − 2) + 1 bins — Σ = 273, so 25 + 2·273 = 571
   channels against the rectangle 25 × 43 = 1075 — the 21 gaps distinct, the widest (shells 1 and 7, 24/49 a.u. = 172800 / 352800) reaching
   |q| ≤ 6.  A difference is REPORTED, never fixed. ── */
{
  const N7 = 7, U7 = 352800, w7 = wUnit(U7);
  for (let n = 1; n <= N7; n++) assert.equal(w7(n) * n * n, -176400, `352800·E_${n} is the integer −176400/${n}²`);
  let pairs7 = 0; for (let n = 1; n <= N7; n++) for (let n2 = n + 1; n2 <= N7; n2++) pairs7 += 2 * (n + n2 - 2) + 1;
  const RULE = { labels: N7 * N7, atZero: 4 * N7 - 3, positive: pairs7, channels: 4 * N7 - 3 + 2 * pairs7, gaps: N7 * (N7 - 1) / 2, widest: w7(N7) - w7(1), widestQ: N7 - 1, qmaxAtZero: 2 * (N7 - 1) };
  const out = [];
  for (const [R, THETA] of [[10, 1.0719], [20, 0.6]]) {
    const c = census(R, THETA, N7, w7);
    const rows = [['joint labels (n, m)', c.labels, RULE.labels], ['(ω, q) density channels', c.channels, RULE.channels], ['channels at ω = 0', c.atZero, RULE.atZero],
      ['channels at ω > 0', c.positive, RULE.positive], ['distinct positive gaps', c.gapList.length, RULE.gaps], ['the largest gap, in 1/352800 a.u.', c.widest, RULE.widest],
      ['|q| reached at the largest gap', c.widestQ, RULE.widestQ], ['|q| reached at ω = 0', c.qmaxAtZero, RULE.qmaxAtZero]];
    const table = rows.map(([k, ours, rule]) => `${k}: ours ${ours}, rule ${rule} ${ours === rule ? 'AGREE' : 'DISAGREE'}`).join(' · ');
    assert.equal(rows.filter(([, a, b]) => a !== b).length, 0, `Q-BAND AT n ≤ 7 (ring r = ${R}, θ = ${THETA}): OUR COUNT DISAGREES WITH SOL'S RULE CARRIED TO n = 7 — REPORT TO THE PILOT.  ${table}`);
    out.push(`ring r = ${R}, θ = ${THETA}: ${table}`);
  }
  console.log(`PASS THE q-BAND AT n ≤ 7 (all ${BASIS.length} labels; Sol's rule carried one shell up, our count from coaxialPolynomial) — ${out.join('\n  ')}`);
}

/* ── a sparse preparation occupies FEWER bins, never more (Sol: "poles, zeros, cancellation, mute/solo … reduce actual occupancy") ─────── */
{
  const R = 10, THETA = 1.0719, pick = (n, l, m) => BASIS.find((s) => s.n === n && s.l === l && s.m === m).index;
  const ids = [pick(1, 0, 0), pick(2, 1, 1), pick(2, 1, -1), pick(3, 2, 2)];
  const sr = new Float64Array(BASIS.length), si = new Float64Array(BASIS.length); for (const a of ids) { sr[a] = 1; si[a] = 0.3; }
  const byShell = new Map(); for (const a of ids) byShell.set(BASIS[a].n, [...(byShell.get(BASIS[a].n) || []), a]);
  const gs = new Map();
  for (const [n, list] of byShell) { const P = coaxialPolynomial(sr, si, list, R, THETA); gs.set(n, P.coeffs.map((c, k) => [P.mmin + k, c]).filter(([, c]) => Math.hypot(c.re, c.im) > 0).map(([m]) => m)); }
  const sparse = new Set();
  for (const [n, A] of gs) for (const [n2, B] of gs) for (const m of A) for (const m2 of B) sparse.add((w7200(n) - w7200(n2)) + '|' + (m - m2));
  assert(sparse.size > 0 && sparse.size < SOL.channels, `a four-mode preparation occupies ${sparse.size} of ${SOL.channels} channels`);
  console.log(`PASS a sparse preparation occupies fewer: 1s + 2p₊₁ + 2p₋₁ + 3d₊₂ touches at most ${sparse.size} of the ${SOL.channels} channels.`);
}
