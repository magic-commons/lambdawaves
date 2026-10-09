/* tests/cornell.test.mjs — the node proof of QUARKONIUM as a Hamiltonian of the register.
 *   node tests/cornell.test.mjs
 * Oracles: the S-wave Numerov spectrum (the same solver), the measured masses (PDG), normalisation and
 * orthogonality of the radial functions by quadrature on the fine grid, node counts, the table's consistency — and, since
 * 0.5.0 D9 deleted qcd.js and its suite, the two anchors that suite held for the solver this file keeps: the exact Airy
 * spectrum of V = σr, and Round 9's independently computed Cornell splittings.
 */
import { BASIS } from '../lab/hydrogen.js';
import { configure, solved, radialAt, cornellEnergyOf, cornellTableFor, cornellFromTable, cornellPsiAt, cornellDomainFor, cornellLabelOf, cornellSpectrum, cornellRadialTable, NR,
  spectrum, fitOffset, numerov, DEFAULTS, MEASURED } from '../lab/cornell.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 300)));
}
/* the solver against a problem with a known closed form (moved from qcd.test.mjs): the linear potential IS Airy's equation,
   E_n = (σ²/2μ)^{1/3} |a_n| with a_n the zeros of Ai */
{
  const mu = 0.75, sigma = 0.18, A = [2.33810741, 4.08794944, 5.52055983], s = Math.cbrt(sigma * sigma / (2 * mu));
  let worst = 0;
  for (let n = 1; n <= 3; n++) worst = Math.max(worst, Math.abs(numerov((r) => sigma * r, mu, 0, n, { rmax: 60, N: 8000 }).E / (s * A[n - 1]) - 1));
  judge('AIRY: the Numerov solver reproduces the EXACT spectrum of V = σr for the first three S levels (1e-5 relative)', worst < 1e-5, worst);
  const c = spectrum('charm', 'cornell', DEFAULTS, 3), b = spectrum('bottom', 'cornell', DEFAULTS, 3);
  judge('ROUND 9: the Cornell 2S−1S splittings are 0.6036 GeV (cc̄) and 0.5810 GeV (bb̄), as Round 9\'s independent Numerov + matrix diagonalisation found',
    Math.abs(c.split - 0.60364) < 2e-3 && Math.abs(b.split - 0.58102) < 2e-3, { charm: c.split, bottom: b.split });
}
configure('charm', { ...DEFAULTS }, 'cornell');
{
  const S = solved();
  const V0 = fitOffset('charm', 'cornell', DEFAULTS), ref = spectrum('charm', 'cornell', { ...DEFAULTS, V0 }, 3);
  const M1 = cornellEnergyOf(1, 0), M2 = cornellEnergyOf(2, 0), M3 = cornellEnergyOf(3, 0);
  judge('CHARMONIUM S-wave masses agree with the S-wave spectrum (same solver) to 1e-9, the 1S sits on J/ψ (fitted V₀), the 2S is a PREDICTION within 25 MeV of PDG, and the 3S — above the open-charm threshold, where a potential model is known to overshoot — within 120 MeV',
    Math.abs(M1 - ref.levels[0].M) < 1e-9 && Math.abs(M2 - ref.levels[1].M) < 1e-9 && Math.abs(M3 - ref.levels[2].M) < 1e-9 && Math.abs(M1 - 3.0969) < 1e-6 && Math.abs(M2 - 3.6861) < 0.025 && Math.abs(M3 - 4.039) < 0.12, { M1, M2, M3, ref: ref.levels.map((x) => x.M) });
  const rows = S.rows.filter((R) => R.l === 0).slice(0, 3);
  const dot = (A, B) => { let s = 0; for (let i = 0; i < A.u.length; i++) s += A.u[i] * B.u[i]; return s * A.h; };
  const gram = rows.map((A) => rows.map((B) => dot(A, B)));
  judge('ORTHONORMAL: the l = 0 radial functions 1S, 2S, 3S have ⟨a|b⟩ = δ_ab to 1e-6 on the fine grid', gram.every((row, i) => row.every((v, j) => Math.abs(v - (i === j ? 1 : 0)) < 1e-6)), gram);
  judge('NODES: u_{n_r l} has n_r radial nodes for l = 0 and l = 3', [0, 1, 2, 3, 4, 5].every((nr) => S.nodes[0 * 6 + nr] === nr && S.nodes[3 * 6 + nr] === nr), Array.from(S.nodes));
  judge('ORDER: within each l the masses rise with n_r, and the 1P sits between the 1S and the 2S', [0, 1, 2, 3, 4, 5].every((l) => [0, 1, 2, 3, 4].every((nr) => S.M[l * 6 + nr] < S.M[l * 6 + nr + 1])) && M1 < cornellEnergyOf(2, 1) && cornellEnergyOf(2, 1) < M2, { M1, P1: cornellEnergyOf(2, 1), M2 });
  const T = cornellRadialTable(), row = 0, tab = Array.from(T.subarray(row * NR, row * NR + NR));
  const jm = 128, mid = radialAt(0, 0, S.rTab[0] * jm / (NR - 1)), tabMid = tab[jm];   // the same sample point as the table's
  judge('THE TABLE: row 0 (1S) is finite, positive at the origin, matches the fine grid at mid-range to 1e-3 (relative) and vanishes at its edge', tab.every(Number.isFinite) && tab[0] > 0 && Math.abs(tabMid - mid) < 1e-3 * Math.abs(mid) && Math.abs(tab[NR - 1]) < 0.02 * tab[0], { tab0: tab[0], tabMid, mid, edge: tab[NR - 1] });
  const a1s = BASIS.findIndex((s) => s.n === 1 && s.l === 0 && s.m === 0), a2p = BASIS.findIndex((s) => s.n === 2 && s.l === 1 && s.m === 0);
  const re = new Float64Array(91), im = new Float64Array(91); re[a1s] = 1;
  const o = cornellPsiAt(re, im, 0, 0, 0.01, [a1s]), far = cornellPsiAt(re, im, 0, 0, 30, [a1s]);
  const lbl = cornellLabelOf(BASIS[a2p]);
  judge('ψ AT A POINT: the 1S is positive near the origin and zero far out; the label of (n = 2, l = 1, m = 0) reads 1P ₊0 (quarkonium counts n_r + 1)', o.re > 0 && Math.abs(far.re) < 1e-12 && lbl === '1P ₊0', { o, far, lbl });
  judge('DOMAIN grows with the shell and the ladder lists 36 levels in GeV between its Emin and Etop', cornellDomainFor(1) < cornellDomainFor(6) && cornellSpectrum().levels.length === 36 && cornellSpectrum().levels.every((L) => L.E > cornellSpectrum().Emin && L.E < cornellSpectrum().Etop), { d1: cornellDomainFor(1), d6: cornellDomainFor(6) });
}
{
  configure('bottom');
  const M1 = cornellEnergyOf(1, 0), M2 = cornellEnergyOf(2, 0);
  judge('BOTTOMONIUM: the 1S sits on Υ(1S) and the 2S is predicted within 25 MeV of PDG 10.0234', Math.abs(M1 - MEASURED.bottom.levels[0].M) < 1e-6 && Math.abs(M2 - 10.0234) < 0.025, { M1, M2 });
  configure('charm');
}
console.log((FAILED ? 'RED ' : 'GREEN ') + 'cornell.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
