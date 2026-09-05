/* tests/helium.test.mjs — the node proof of Hylleraas helium.
 *   node tests/helium.test.mjs
 * Oracles: a monomial integral by brute-force quadrature, the one-term closed form E(ζ) = ζ² − 27ζ/8 recovered
 * from the algebraic matrices, the known Hylleraas energies at 1, 3 and 6 terms, the variational ordering against
 * the exact −2.903724, the exchange symmetry, and the Kato cusp.
 */
import { monomialIntegral, hylleraasMatrices, hylleraasSolve, hylleraas, BASES, EXACT_E, KNOWN, oneTermEnergy, psiPair, cuspRatio, conditionalModes } from '../lab/helium.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 300)));
}
/* the monomial integral against brute force (a = 1, b = 2, c = 1, ζ = 1.7): three nested Simpson rules */
{
  const zeta = 1.7, a = 1, b = 2, c = 1, NS = 400, NU = 200, NT = 200, smax = 16;
  const w = (i, n) => (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2);
  let I = 0;
  for (let i = 0; i <= NS; i++) { const s = i * smax / NS; let Iu = 0;
    for (let j = 0; j <= NU; j++) { const u = j * s / NU; let It = 0;
      for (let k = 0; k <= NT; k++) { const t = -u + 2 * u * k / NT; It += w(k, NT) * Math.pow(t, b); }
      It *= (2 * u / NT) / 3; Iu += w(j, NU) * Math.pow(u, c) * It; }
    Iu *= (s / NU) / 3; I += w(i, NS) * Math.exp(-2 * zeta * s) * Math.pow(s, a) * Iu; }
  I *= (smax / NS) / 3;
  judge('He the monomial integral ∫e^{−2ζs} s t² u over the Hylleraas wedge matches brute-force triple quadrature (1e-6 relative)', Math.abs(I / monomialIntegral(a, b, c, zeta) - 1) < 1e-6, { brute: I, closed: monomialIntegral(a, b, c, zeta) });
  judge('He odd powers of t integrate to zero (the singlet is even in t)', monomialIntegral(0, 1, 0, 1) === 0 && monomialIntegral(2, 3, 1, 1.3) === 0);
}
/* the one-term closed form from the matrices: ⟨T⟩ = ζ², ⟨V⟩ = −27ζ/8 */
{
  for (const zeta of [1.2, 27 / 16, 2.1]) {
    const { S, T, V } = hylleraasMatrices(BASES.one, zeta);
    const t = T[0][0] / S[0][0], v = V[0][0] / S[0][0];
    judge(`He one term at ζ = ${zeta.toFixed(4)}: ⟨T⟩ = ζ² = ${(zeta * zeta).toFixed(5)} and ⟨V⟩ = −27ζ/8 = ${(-27 * zeta / 8).toFixed(5)} from the algebraic functional (1e-12)`, Math.abs(t - zeta * zeta) < 1e-12 && Math.abs(v + 27 * zeta / 8) < 1e-12, { t, v });
  }
  const one = hylleraas(BASES.one);
  judge('He the screened one-term ground state: ζ = 27/16 = 1.6875, E = −2.847656 (1e-6) — the textbook variational helium', Math.abs(one.zeta - 27 / 16) < 1e-5 && Math.abs(one.E - KNOWN.one) < 1e-6 && Math.abs(one.E - oneTermEnergy(one.zeta)) < 1e-10, { zeta: one.zeta, E: one.E });
}
/* Hylleraas 1929 and beyond */
{
  const three = hylleraas(BASES.three), six = hylleraas(BASES.six), ten = hylleraas(BASES.ten);
  judge('He HYLLERAAS 1929, three terms {1, u, t²}: E = −2.90243 (2e-4)', Math.abs(three.E - KNOWN.three) < 2e-4, { E: three.E, zeta: three.zeta, c: three.c });
  judge('He six terms {1, u, t², s, s², u²}: E = −2.90324 (2e-4)', Math.abs(six.E - KNOWN.six) < 2e-4, { E: six.E, zeta: six.zeta });
  judge('He THE BOUND: every basis lies above the exact −2.903724 and each larger basis lies lower — one > three > six > ten > exact', three.E > EXACT_E && six.E > EXACT_E && ten.E > EXACT_E && hylleraas(BASES.one).E > three.E && three.E > six.E && six.E > ten.E, { one: hylleraas(BASES.one).E, three: three.E, six: six.E, ten: ten.E, exact: EXACT_E });
  judge('He ten terms recover the exact energy to better than 1 millihartree (a rigorous upper bound: E − E_exact ∈ (0, 1e-3))', ten.E - EXACT_E > 0 && ten.E - EXACT_E < 1e-3, { gap: ten.E - EXACT_E });
  /* the exchange symmetry and the cusp */
  const x1 = [0.6, -0.3, 0.4], x2 = [-0.5, 0.8, 0.2];
  judge('He ψ(x₁, x₂) = ψ(x₂, x₁): the singlet spatial function is symmetric (1e-15)', Math.abs(psiPair(six, x1, x2) - psiPair(six, x2, x1)) < 1e-15, [psiPair(six, x1, x2), psiPair(six, x2, x1)]);
  const cusp = cuspRatio(six);
  judge('He the Kato cusp: ∂ψ/∂u ÷ ψ at coalescence should be ½; a polynomial in u cannot make a linear cusp, so six terms give 0.3373 and ten give 0.3381 — 0.5% of the gap, then it stalls (both asserted to 1e-3)', Math.abs(cusp - 0.3373) < 1e-3 && Math.abs(cuspRatio(ten) - 0.3381) < 1e-3 && Math.abs(cuspRatio(ten) - cusp) < 1e-2, { six: cusp, ten: cuspRatio(ten) });
  const modes = conditionalModes(six, x1);
  judge('He the conditional amplitude ψ(x | x₁) is packed as one kernel record per term, centred on x₁, with the exponent ζ in the m slot', modes.length === 6 && modes.every((m) => m.center === x1 && m.table.pair && Math.abs(m.table.m - six.zeta) < 1e-15), modes.length);
}
console.log((FAILED ? 'RED' : 'GREEN') + ' helium.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
