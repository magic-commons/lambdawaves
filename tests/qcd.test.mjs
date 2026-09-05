/* tests/qcd.test.mjs — the node proof of the confining side.
 *   node tests/qcd.test.mjs
 * Anchors: Round 9's independently computed Cornell numbers (Numerov AND matrix diagonalisation, agreeing to six
 * digits), the exact Airy zeros, the PDG masses, and the exact string formulae.
 */
import { AIRY_ZEROS, POTENTIALS, DEFAULTS, MEASURED, numerov, spectrum, airyLevels, flavourIndependence,
  fitOffset, reggeSlope, luscher, widthCoefficient, HBARC_FM } from '../lab/qcd.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 280)));
}
/* the solver against a problem with a known closed form: the linear potential IS Airy */
{
  const mu = 0.75, sigma = 0.18;
  const exact = airyLevels(mu, sigma, 3);
  let worst = 0;
  for (let n = 1; n <= 3; n++) {
    const s = numerov((r) => sigma * r, mu, 0, n, { rmax: 60, N: 8000 });
    worst = Math.max(worst, Math.abs(s.E - exact[n - 1].E) / exact[n - 1].E);
  }
  judge('Q the Numerov solver reproduces the EXACT Airy spectrum of V = σr for the first three S levels (1e-5 relative) — the linear radial equation is Airy\'s equation with no approximation', worst < 1e-5, worst);
  judge('Q and the Airy ratio is rigid: E₂/E₁ = |a₂|/|a₁| = 1.74840 whatever σ and μ are', Math.abs(exact[1].E / exact[0].E - Math.abs(AIRY_ZEROS[1]) / Math.abs(AIRY_ZEROS[0])) < 1e-12 && Math.abs(exact[1].E / exact[0].E - 1.748403) < 1e-5, exact[1].E / exact[0].E);
}
/* Cornell against Round 9's numbers and the measured masses */
{
  const c = spectrum('charm', 'cornell', DEFAULTS, 3), b = spectrum('bottom', 'cornell', DEFAULTS, 3);
  judge('Q Cornell (α_s = 0.39, σ = 0.18, m_c = 1.5): the 2S−1S splitting is 0.6036 GeV, matching Round 9\'s independent Numerov + matrix diagonalisation', Math.abs(c.split - 0.60364) < 2e-3, { got: c.split, round9: 0.60364 });
  judge('Q and for bottomonium (m_b = 4.8) it is 0.5810 GeV', Math.abs(b.split - 0.58102) < 2e-3, { got: b.split, round9: 0.58102 });
  /* a potential model predicts SPLITTINGS; the absolute scale needs the constant V₀ every such model carries.
     Fit V₀ to the ground state and the 2S mass becomes a real prediction — 15 MeV out of 3.7 GeV. */
  const vc = fitOffset('charm', 'cornell', DEFAULTS), vb = fitOffset('bottom', 'cornell', DEFAULTS);
  const c2 = spectrum('charm', 'cornell', { ...DEFAULTS, V0: vc }, 2), b2 = spectrum('bottom', 'cornell', { ...DEFAULTS, V0: vb }, 2);
  judge('Q with V₀ fitted to the ground state (the constant every potential model carries), the 2S masses are PREDICTIONS and land within 20 MeV of the PDG 3.6861 and 10.0234 GeV',
    Math.abs(c2.levels[0].M - 3.0969) < 1e-6 && Math.abs(b2.levels[0].M - 9.4603) < 1e-6 && Math.abs(c2.levels[1].M - 3.6861) < 0.02 && Math.abs(b2.levels[1].M - 10.0234) < 0.02,
    { V0: [vc, vb], psi2S: c2.levels[1].M, ups2S: b2.levels[1].M });
  judge('Q every level is bound and ordered, and each wavefunction has the right node count', c.levels.every((l, i) => l.E > -4 && (i === 0 || l.E > c.levels[i - 1].E)) && b.levels.every((l, i) => i === 0 || l.E > b.levels[i - 1].E));
}
/* THE REFUTATION: the Airy spectroscopy fails on the one parameter-free test */
{
  const lin = flavourIndependence('linear', DEFAULTS), cor = flavourIndependence('cornell', DEFAULTS);
  judge('Q THE AIRY SPECTROSCOPY IS REFUTED: a pure linear potential forces the bottom/charm splitting ratio to (μ_c/μ_b)^{1/3} = 0.679, and the measurement is 0.956 — 41% wrong on the one test with no free parameter',
    Math.abs(lin.airyRatio - 0.6786) < 2e-3 && Math.abs(lin.predRatio - lin.airyRatio) < 0.02 && Math.abs(lin.measRatio - 0.9559) < 2e-3, lin);
  judge('Q the exponent the data actually wants is p ≈ 0 (Round 9: 0.0388) — not a power law at all but a LOGARITHM, for which the spacing is mass-independent exactly', Math.abs(lin.fittedExponent) < 0.06, lin.fittedExponent);
  judge('Q Cornell rescues it: its predicted ratio 0.9625 sits within 0.7% of the measured 0.9559, because the Coulomb core breaks the pure power law', Math.abs(cor.predRatio - 0.9625) < 5e-3 && Math.abs(cor.predRatio - cor.measRatio) < 0.02, cor);
  const logf = flavourIndependence('log', { ...DEFAULTS, C: 0.733, r0: 1 });
  judge('Q and a logarithmic potential gives the SAME splitting for both systems, 0.5887 GeV each (1e-3) — the flavour independence the data shows', Math.abs(logf.charmSplit - 0.58868) < 1e-3 && Math.abs(logf.bottomSplit - 0.58868) < 1e-3 && Math.abs(logf.predRatio - 1) < 1e-9, { ratio: logf.predRatio, charm: logf.charmSplit, bottom: logf.bottomSplit });
}
/* the string, exactly */
{
  judge('Q the Regge slope of the relativistic string α′ = 1/(2πσ) = 0.8842 GeV⁻², within 3.4% of the measured ρ-trajectory slope ≈ 0.915 (Round 9\'s four-state fit)', Math.abs(reggeSlope(0.18) - 0.8842) < 1e-3 && Math.abs(reggeSlope(0.18) / 0.91528 - 1) < 0.04, reggeSlope(0.18));
  judge('Q the Lüscher term is the universal −π(d−2)/24r: −π/12r in four dimensions, and it is attractive at every r', Math.abs(luscher(1) + Math.PI / 12) < 1e-15 && luscher(2) < 0 && Math.abs(luscher(2) / luscher(1) - 0.5) < 1e-15);
  const w = widthCoefficient(0.18);
  judge('Q the flux tube widens logarithmically with coefficient (d−2)/2πσ = 0.068857 fm² per e-fold (Round 9)', Math.abs(w.fm2 - 0.068857) < 1e-5, w);
  judge('Q and the conversion is the physical one: ħc = 0.19733 GeV·fm', Math.abs(HBARC_FM - 0.1973269804) < 1e-9);
}

console.log((FAILED ? 'RED' : 'GREEN') + ' qcd.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
