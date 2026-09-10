/* tests/period.test.mjs — the node proof of THE CLOCK's law.
 *   node tests/period.test.mjs
 * Oracles: the closed-form shell table (P8 of the FIELDS AND MOLECULES round), direct recurrence of the density on a
 * ring, the oscillator's integer ladder, and an incommensurate case that must be refused.
 */
import { densityPeriod, densityPeriodExact, hydrogenShellPeriod, rational, fmtPeriod } from '../lab/period.js';
import { BASIS, psiAt } from '../lab/hydrogen.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 300)));
}
const En = (n) => -0.5 / (n * n);
{
  const r = rational(2 / 3), r2 = rational(0.09375 / 0.09375), r3 = rational(Math.SQRT2, 2e4, 1e-11), r4 = rational(Math.SQRT2, 1e5, 1e-9);
  judge('RATIONAL: 2/3 is found, 1 is 1/1, √2 is refused at denominators ≤ 2·10⁴ and tolerance 1e-11 — and the lesson that it is NOT refused at 1e5 / 1e-9 (Dirichlet), which is why the period law uses the strict pair', r && r.p === 2 && r.q === 3 && r2 && r2.p === 1 && r2.q === 1 && r3 === null && r4 !== null, { r, r2, r3, r4 });
}
{
  const cases = [[[2, 4], 64 * Math.PI / 3], [[1, 2], 16 * Math.PI / 3], [[3, 4, 5], 2 * Math.PI * 7200], [[1, 2, 3, 4], 2 * Math.PI * 7200 / 25], [[5, 6], 2 * Math.PI * 7200 / 44], [[1, 2, 3, 4, 5, 6], 2 * Math.PI * 7200]];
  const ok = cases.every(([S, T]) => { const a = densityPeriod(S.map(En)), b = hydrogenShellPeriod(S); return a.exact && Math.abs(a.T - T) < 1e-6 * T && Math.abs(b - T) < 1e-9 * T; });
  judge('THE TABLE: {2,4} → 64π/3 = 67.021, {1,2} → 16.755, {3,4,5} and all six → 2π·7200 = 45238.93 (the longest possible), {1,2,3,4} → 1809.56, {5,6} → 1028.16 — from the energies and from the shell law alike', ok, cases.map(([S, T]) => [S.join(''), +T.toFixed(3), +densityPeriod(S.map(En)).T.toFixed(3)]));
  const z2 = densityPeriod([2, 4].map((n) => 4 * En(n)));
  judge('Z = 2 divides every period by 4: {2,4} at Z = 2 → 16.755', z2.exact && Math.abs(z2.T - 64 * Math.PI / 12) < 1e-6, z2);
}
{
  /* the ring density of 4d₊2 + 2p₋1 returns at T and not at T/2 */
  const idx = (n, l, m) => BASIS.findIndex((s) => s.n === n && s.l === l && s.m === m);
  const a = idx(4, 2, 2), b = idx(2, 1, -1), Ea = En(4), Eb = En(2);
  const ring = (t) => { const re = new Float64Array(91), im = new Float64Array(91); re[a] = Math.cos(-Ea * t) / Math.SQRT2; im[a] = Math.sin(-Ea * t) / Math.SQRT2; re[b] = Math.cos(-Eb * t) / Math.SQRT2; im[b] = Math.sin(-Eb * t) / Math.SQRT2; const out = []; for (let i = 0; i < 180; i++) { const phi = 2 * Math.PI * i / 180; const p = psiAt(re, im, 3 * Math.cos(phi), 3 * Math.sin(phi), 1, [a, b]); out.push(p.re * p.re + p.im * p.im); } return out; };
  const T = densityPeriod([Ea, Eb]).T, p0 = ring(0), pT = ring(T), pH = ring(T / 2);
  const dev = (p) => Math.max(...p.map((v, i) => Math.abs(v - p0[i]))) / Math.max(...p0);
  judge('THE RING RETURNS: at T = 67.021 the density of 4d₊2 + 2p₋1 is back to 1e-12 and at T/2 it is not', dev(pT) < 1e-12 && dev(pH) > 0.1, { T, atT: dev(pT), atHalf: dev(pH) });
}
{
  const q = densityPeriod([1.5, 2.5, 4.5]);                                     // the oscillator: N + 3/2, N = 0, 1, 3
  judge('THE OSCILLATOR: integer differences → T = 2π exactly', q.exact && Math.abs(q.T - 2 * Math.PI) < 1e-9, q);
  const inc = densityPeriod([0, 1, Math.SQRT2], { horizon: 2000 });
  judge('INCOMMENSURATE: energies 0, 1, √2 have no exact period — refused, with a near-recurrence and its error reported', inc.exact === false && inc.T > 0 && inc.err < 0.05, inc);
  /* wave 40: {0, 1, e, π, 50} is a WIDE spectrum — fastest beat 50, slowest 0.4233.  At the scan's first sample the
     largest pair is 1/64 of a turn from an integer and every slow pair a thousandth of one, so the old scan reported
     T = 1.96e-3 a.u. with err = 1/64 EXACTLY: its own first step, a time at which nothing has moved.  The scan now
     starts at one full turn of the fastest beat, and the answer it gives is one it has actually earned. */
  const wide = [0, 1, Math.E, Math.PI, 50];
  const dd = []; for (let i = 0; i < wide.length; i++) for (let j = i + 1; j < wide.length; j++) dd.push(Math.abs(wide[j] - wide[i]));
  const dmax = Math.max(...dd), step = 2 * Math.PI / dmax / 64, w = densityPeriod(wide, { horizon: 2e4 });
  let werr = 0; for (const v of dd) { const x = v * w.T / (2 * Math.PI); werr = Math.max(werr, Math.abs(x - Math.round(x))); }
  judge('THE SCAN DOES NOT ACCEPT ITS OWN FIRST STEP: the wide incommensurate spectrum {0, 1, e, π, 50} used to return T = 1.96e-3 a.u. — the k = 1 sample, err = 1/64 exactly, a "recurrence" at which the slow pairs have turned a thousandth of a cycle. The scan starts at one full turn of the fastest beat now, so the near-recurrence is > 64 steps (3770 a.u., 30001 turns of the fastest), it is still refused as exact, and the err it prints is the err it has: recomputed from the returned T to 1e-12',
    w.exact === false && w.T / step > 64 && w.T * dmax / (2 * Math.PI) > 1 && Math.abs(werr - w.err) < 1e-12,
    { T: w.T, steps: Math.round(w.T / step), turnsOfFastest: Math.round(w.T * dmax / (2 * Math.PI)), err: w.err, recomputed: werr });
  const huge = fmtPeriod(4.035892638554461e20);
  judge('FORMAT: ordinary periods retain useful precision; very large periods use bounded scientific and human-scale units', /1\.62[0-9]* fs/.test(fmtPeriod(64 * Math.PI / 3)) && /1\.094 ps/.test(fmtPeriod(2 * Math.PI * 7200)) && huge.length <= 28 && /e20 a\.u\./.test(huge) && / h$/.test(huge), { a: fmtPeriod(64 * Math.PI / 3), b: fmtPeriod(2 * Math.PI * 7200), huge });
}
{
  const exact = densityPeriodExact([En(2), En(4)]), stationary = densityPeriodExact([En(2)]);
  const inc = densityPeriodExact([0, 1, Math.SQRT2]);
  const falseWitness = densityPeriodExact([-30.38483, -1.36619, -0.55410]);
  judge('FAST EXACT HALF: commensurate hydrogen and stationary states finish without a scan; incommensurate and falsely rational spectra explicitly ask for the bounded scan',
    exact && exact.exact && Math.abs(exact.T - 64 * Math.PI / 3) < 1e-6 && stationary && stationary.stationary && inc === null && falseWitness === null,
    { exact, stationary, inc, falseWitness });
}
{ /* wave 42, the reviewer's finding: rational()'s tolerance is RELATIVE, so a ratio of 55 passes at 5.5e-9 absolute — and
     5.5e-9 of a beat over the 2·10⁴ turns its denominator demands is a whole cycle.  Ne's three occupied ε (the ported
     Xα values) were called EXACT with T = 153 295 a.u. and a true recurrence error of 2e-5; {0, 0.001√2, 1} exact with
     T = 1.4e7.  The gcd is verified against every difference to 1e-9 of a turn before it is believed. */
  const recur = (E, T) => { let worst = 0; for (let i = 0; i < E.length; i++) for (let j = i + 1; j < E.length; j++) { const x = Math.abs(E[i] - E[j]) * T / (2 * Math.PI); worst = Math.max(worst, Math.abs(x - Math.round(x))); } return worst; };
  const Ne = [-30.38483, -1.36619, -0.55410], ne = densityPeriod(Ne, { horizon: 2e4 }), sq = [0, 0.001 * Math.SQRT2, 1], s2 = densityPeriod(sq, { horizon: 2e4 });
  judge('VERIFIED, NOT BELIEVED: Ne\'s occupied ε {−30.385, −1.366, −0.554} are REFUSED as exact (T = 116 a.u. near-recurrence, err 3.0e-5, and that err is the recurrence error recomputed here to 1e-12) — it used to say exact with T = 153 295 and a true error of 2e-5; {0, 0.001√2, 1} refused too (it used to say exact with T = 1.4e7)',
    ne.exact === false && ne.T > 0 && Math.abs(recur(Ne, ne.T) - ne.err) < 1e-12 && ne.err < 1e-4 && s2.exact === false && Math.abs(recur(sq, s2.T) - s2.err) < 1e-12,
    { Ne: { exact: ne.exact, T: +ne.T.toFixed(3), err: ne.err }, sq: { exact: s2.exact, T: +s2.T.toFixed(3), err: s2.err } });
  const tab = densityPeriod([1, 2, 3, 4, 5, 6].map(En));
  judge('AND THE SHELL TABLE STILL PASSES THE VERIFICATION: all six shells exact with T = 2π·7200 and every difference an integer multiple of the gcd to 1e-12 (the `verified` field)', tab.exact && Math.abs(tab.T - 2 * Math.PI * 7200) < 1e-6 && tab.verified < 1e-12, { T: tab.T, verified: tab.verified });
}
console.log((FAILED ? 'RED ' : 'GREEN ') + 'period.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
