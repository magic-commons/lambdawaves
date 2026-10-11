/* tests/clock-phase.test.mjs — THE HUGE-TIME PHASE, two ways (0.5.4 P10 · PLAN §E; PM-13).  No lab/ change: the code under test is
 * frontier.js' clockAutocorr (the phase of mode n at t = (A/B)·π·n̄^M is the RATIONAL A·n̄^M/(4B·n²) of a turn, so its fractional
 * part is exact in BigInt) and the oracle is a SECOND road to the same phase that shares none of its arithmetic:
 *
 *   way 1  clockAutocorr:  fraction = (A·n̄^M mod 4B n²) / (4B n²), a ratio of two BigInts, then cos/sin of 2π·fraction
 *   way 2  here:           π to 120 decimal digits from Machin's formula in BigInt fixed point (nothing typed from memory),
 *                          the phase φ_n = π·A·n̄^M / (2B n²) formed in that fixed point and reduced mod 2π THERE, cos/sin of
 *                          the reduced angle.  It never forms a remainder of the integers and never forms a double of t.
 *
 * The existing frontier.test.mjs holds the structured clocks (T_sr at n̄ = 200000, mpmath at 40 digits); this holds UNSTRUCTURED
 * t — an A, B and M no clock has — out to t ≈ 3e48 rad, and the one identity only exact arithmetic satisfies: a whole number of periods
 * returns |A| = 1 exactly, however large the number is.
 *
 * THE TOLERANCES, stated.  Both ways end in a double cos/sin of an angle in [0, 2π): the reduction is exact in way 1 and good to
 * 1e-120 in way 2, so what remains is the double rounding of that angle, ~2e-16 per mode.  The gate is 1e-13 on |Δ(re + i·im)|
 * (and so on |A| and on arg A weighted by |A|), a margin of ~500× the rounding and ~10 orders below any visible difference; the
 * period identity is held at 0 (exact).  The naive double road ladderAutocorr(t as a double) is MEASURED beside them and printed,
 * never gated: it is the road the BigInt one exists to replace. */
import assert from 'node:assert/strict';
import { packet, clockAutocorr, ladderAutocorr } from '../lab/frontier.js';

/* ── way 2: π in BigInt fixed point (Machin: π = 16 atan(1/5) − 4 atan(1/239)) ─────────────────────────────────────── */
const DIG = 120n, ONE = 10n ** DIG;
function atanInv(x) {                                       // atan(1/x) · ONE, the series Σ (−1)^k / ((2k+1) x^(2k+1))
  const x2 = BigInt(x) * BigInt(x); let term = ONE / BigInt(x), sum = term, k = 1n;
  while (term !== 0n) { term /= x2; const t = term / (2n * k + 1n); sum += k % 2n ? -t : t; k++; }
  return sum;
}
const PI = 16n * atanInv(5) - 4n * atanInv(239), TWO_PI = 2n * PI;
/* no digit of π is typed here: the series is the source, and Math.PI (a double) checks that it was summed right */
assert(Math.abs(Number(PI) / Number(ONE) - Math.PI) < 1e-15, 'Machin π agrees with Math.PI to a double');

/** A(t) for t = (A/B)·π·n̄^M by way 2: the phase of each mode is formed and reduced in fixed point */
function autocorrByPi(pops, nbar, A, B, M) {
  let re = 0, im = 0, den = 0;
  const AN = BigInt(A) * BigInt(nbar) ** BigInt(M);
  for (const { n, p } of pops) {
    const phi = (AN * PI) / (2n * BigInt(B) * BigInt(n) * BigInt(n));     // φ_n = π A n̄^M / (2 B n²), in units of 1/ONE
    const red = ((phi % TWO_PI) + TWO_PI) % TWO_PI;
    const ang = Number(red) / Number(ONE);                                  // [0, 2π), the one place a double is formed
    re += p * Math.cos(ang); im += p * Math.sin(ang); den += p;
  }
  return { re: re / den, im: im / den, abs: Math.hypot(re / den, im / den) };
}
const wrap = (x) => Math.atan2(Math.sin(x), Math.cos(x));

/* ── the unstructured t: (n̄, σ, A, B, M), none of them a clock of the ladder (T_cl 2,1,3 · T_rev 4,3,4 · T_sr 1,1,5 · T_4 4,5,6) ─── */
const CASES = [
  { nbar: 50, sigma: 2, A: 7, B: 11, M: 3 },
  { nbar: 200, sigma: 3, A: 123457, B: 999983, M: 5 },
  { nbar: 2000, sigma: 3, A: 355, B: 113, M: 7 },
  { nbar: 31337, sigma: 5, A: 1, B: 1, M: 9 },
  { nbar: 200000, sigma: 3, A: 99991, B: 17, M: 6 },
  { nbar: 1000003, sigma: 4, A: 2718281, B: 3141593, M: 8 },
  { nbar: 123456789, sigma: 6, A: 6700417, B: 641, M: 4 },
];
let worst = 0, worstArg = 0, worstNaive = 0, where = '', tMax = 0;
for (const c of CASES) {
  const pops = packet({ nbar: c.nbar, sigma: c.sigma });
  const one = clockAutocorr(pops, c.nbar, c.A, c.B, c.M), two = autocorrByPi(pops, c.nbar, c.A, c.B, c.M);
  const d = Math.hypot(one.re - two.re, one.im - two.im), dArg = Math.abs(wrap(Math.atan2(one.im, one.re) - Math.atan2(two.im, two.re))) * one.abs;
  const t = (c.A / c.B) * Math.PI * c.nbar ** c.M;                           // as a DOUBLE, for the naive road only
  const naive = Math.hypot(ladderAutocorr(pops, t).re - one.re, ladderAutocorr(pops, t).im - one.im);
  tMax = Math.max(tMax, t); if (d > worst) { worst = d; where = JSON.stringify(c); } worstArg = Math.max(worstArg, dArg); worstNaive = Math.max(worstNaive, naive);
  assert(d <= 1e-13, `phase, two ways, ${JSON.stringify(c)}: |Δ(re+i im)| = ${d.toExponential(3)} exceeds 1e-13 (clockAutocorr ${one.re}, ${one.im}; by π ${two.re}, ${two.im})`);
  assert(dArg <= 1e-13, `arg·|A|, two ways, ${JSON.stringify(c)}: ${dArg.toExponential(3)} exceeds 1e-13`);
  assert(one.abs <= 1 + 1e-15 && two.abs <= 1 + 1e-15, 'a normalised packet cannot exceed |A| = 1');
}
console.log(`PASS the phase at unstructured huge t, two ways: ${CASES.length} cases, n̄ 50 … 123456789, t up to ${tMax.toExponential(2)} rad — clockAutocorr (exact BigInt fraction) vs Machin-π fixed point (120 digits): worst |Δ(re + i·im)| ${worst.toExponential(2)} at ${where}, worst arg·|A| ${worstArg.toExponential(2)}; gate 1e-13.`);
console.log(`MEASURED (not gated) the naive double road, ladderAutocorr at t as a double: worst |Δ| against the exact phase ${worstNaive.toExponential(2)} — the BigInt road exists for that number.`);

/* ── the period identity, held at ZERO: a whole number of periods of every mode returns the packet exactly ──────────────────── */
{
  const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
  for (const [nbar, sigma, B] of [[40, 2, 3], [1000, 3, 7], [20011, 4, 1]]) {
    const pops = packet({ nbar, sigma });
    let L = 1n; for (const { n } of pops) { const q = BigInt(n) * BigInt(n); L = (L / gcd(L, q)) * q; }   // lcm of every n²
    const period = 4n * BigInt(B) * L;                                       // t = (period/B)π: every phase t/(2n²) = 2π·(2L/n²), whole turns (M = 0)
    const full = clockAutocorr(pops, nbar, period, B, 0);
    assert(full.re === 1 && full.im === 0 && full.abs === 1, `${pops.length} modes at a t of ${period.toString().length} digits: whole turns must give exactly 1, got ${full.re}, ${full.im}`);
    /* and a shift by whole periods leaves the phase BIT-FOR-BIT: the remainder is the same integer */
    const base = clockAutocorr(pops, nbar, 12345n, B, 0), moved = clockAutocorr(pops, nbar, 12345n + period * 1000003n, B, 0);
    assert(moved.re === base.re && moved.im === base.im, `a shift by 1000003 whole periods changed the phase: ${moved.re},${moved.im} vs ${base.re},${base.im}`);
  }
  console.log('PASS the period identity, held at 0: t a whole number of periods of every mode (hundreds of digits long) returns |A| = 1 exactly, and a further shift by 1000003 periods leaves re and im bit-for-bit.');
}
