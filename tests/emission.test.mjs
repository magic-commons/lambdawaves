/* tests/emission.test.mjs — the node proof of EMISSION SPECTRA (iteration 016 E2 · E3).
 *   node tests/emission.test.mjs
 * Oracles, all outside the code they judge:
 *   (a) NIST ASD's hydrogen: Hα 656.46 nm (vacuum, the fine-structure blend), Lyα 121.567, Hβ 486.27, and the tabulated Einstein A of four lines
 *       (3d→2p 6.4651e7, 3p→2s 2.2448e7, 3s→2p 6.3134e6, 2p→1s 6.2649e8 s⁻¹);
 *   (b) radiation.js's dipoleMatrix — the vector ⟨a|r|b⟩ RADIATION prints, built from its own Condon–Shortley channels — over all 140 × 140 pairs;
 *   (c) the Wigner–Eckart sum rule Σ_m′ |⟨l′m′|r̂|lm⟩|² = max(l, l′)/(2l + 1), every m;
 *   (d) positronium's Balmer α at μ = ½ (twice hydrogen's infinite-mass 656.11 nm: 1312.2 nm);
 *   (e) a dozen NIST ASD configuration strings read by hand, and the vendored table's sodium D pair.
 */
import { readFileSync } from 'node:fs';
import { lineList, linePairs, angularDipole2, radialDipole, lambdaNm, stateLines } from '../lab/dynamics.js';
import { dipoleMatrix } from '../lab/radiation.js';
import { BASIS } from '../lab/hydrogen.js';
import { setMu, getHamiltonian } from '../lab/hamiltonian.js';
import { hydrogenStrip, activeElectron, parseConfig, atomStrip, waveRGB, RANGES } from '../lab/emission-map.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 420)));
}
const T0 = Date.now(), rel = (x, y) => Math.abs(x - y) / Math.abs(y);
const L = lineList(), sub = (nu, lu, nl, ll) => L.find((x) => x.upper.n === nu && x.upper.l === lu && x.lower.n === nl && x.lower.l === ll);

{ /* (a) the wavelengths: vacuum, ¹H's reduced mass */
  const ha = sub(3, 2, 2, 1).lambda, ly = sub(2, 1, 1, 0).lambda, hb = sub(4, 1, 2, 0).lambda, inf = lambdaNm(1 / 8 - 1 / 18);
  judge('HYDROGEN\'S LINES IN VACUUM WITH μ_H: Hα 656.47 nm (656.11 at infinite mass, NIST\'s blend 656.46), Lyα 121.57, Hβ 486.27 — to 0.005 nm',
    Math.abs(ha - 656.47) < 0.005 && Math.abs(inf - 656.11) < 0.005 && Math.abs(ha - 656.46) < 0.02 && Math.abs(ly - 121.567) < 0.005 && Math.abs(hb - 486.27) < 0.01, { ha, inf, ly, hb });
}
{ /* (a) the Einstein A against NIST */
  const got = [[sub(3, 2, 2, 1).A, 6.4651e7], [sub(3, 1, 2, 0).A, 2.2448e7], [sub(3, 0, 2, 1).A, 6.3134e6], [sub(2, 1, 1, 0).A, 6.2649e8]], worst = Math.max(...got.map(([a, b]) => rel(a, b)));
  judge('THE EINSTEIN A OF FOUR LINES ON NIST\'s TABLE WITHIN 0.2 %: 3d→2p, 3p→2s, 3s→2p, 2p→1s (the subshell\'s rate, summed over the lower m′)', worst < 2e-3, { worst, got: got.map(([a]) => a) });
}
{ /* (b) the selection rule and the vector dipole, all 140 × 140 */
  let worst = 0, forbidden = 0, n = 0;
  for (const A of BASIS) for (const B of BASIS) {
    const g = angularDipole2(B.l, B.m, A.l, A.m), mine = g > 0 ? g * radialDipole(B.n, B.l, A.n, A.l) ** 2 : 0, theirs = dipoleMatrix(A.index, B.index).abs2;
    if (Math.abs(A.l - B.l) !== 1) forbidden = Math.max(forbidden, mine, theirs);
    worst = Math.max(worst, Math.abs(mine - theirs)); n++;
  }
  judge('THE SELECTION RULE TO 1e-12 OVER ALL 140 × 140 PAIRS: |⟨a|r|b⟩|² = 0 for Δl ≠ ±1, and angularDipole2 × R² equals radiation.js\'s vector dipole everywhere',
    forbidden < 1e-12 && worst < 1e-12, { pairs: n, forbidden, worst });
}
{ /* (c) the sum rule, and the m-pairs of a line summing to its rate */
  let worst = 0;
  for (let l = 0; l <= 6; l++) for (const lp of [l - 1, l + 1]) { if (lp < 0) continue; for (let m = -l; m <= l; m++) { let s = 0; for (let mp = -lp; mp <= lp; mp++) s += angularDipole2(lp, mp, l, m); worst = Math.max(worst, Math.abs(s - Math.max(l, lp) / (2 * l + 1))); } }
  const P = linePairs({ n: 3, l: 2 }, { n: 2, l: 1 }), from0 = P.filter((p) => BASIS[p.a].m === 0).reduce((s, p) => s + p.A, 0), first = P[0];
  judge('THE SUM RULE Σ_m′ |⟨l′m′|r̂|lm⟩|² = max(l, l′)/(2l + 1) FOR EVERY l ≤ 6 AND m, so each upper m of 3d→2p decays at the tabulated 6.4651e7 s⁻¹; ‹ PAIR › leads with π, 3d₀ + 2p₀',
    worst < 1e-14 && rel(from0, sub(3, 2, 2, 1).A) < 1e-12 && first.dm === 0 && BASIS[first.a].label === '3d₀' && BASIS[first.b].label === '2p₀' && P.findIndex((p) => p.dm !== 0) > P.filter((p) => p.dm === 0).length - 1,
    { worst, from0, first: [BASIS[first.a].label, BASIS[first.b].label] });
}
{ /* the strip: one line per shell pair, the series' names, ALL holds every member */
  const S = hydrogenStrip(L), ha = S.find((s) => s.id === '3-2'), hu = S.find((s) => s.id === '7-6');
  judge('THE HYDROGEN STRIP: 21 shell lines (n ≤ 7), Hα is 3 → 2 with three subshells (3d→2p first), Lyα 2 → 1, Humphreys α 7 → 6 at 12.37 µm inside ALL',
    S.length === 21 && ha.name === 'Hα' && ha.subs.length === 3 && ha.subs[0].upper.l === 2 && S.find((s) => s.id === '2-1').name === 'Lyα' && hu.name === 'Huα' && hu.lambda < RANGES.all.hi && S[0].lambda > RANGES.all.lo,
    { n: S.length, hu: hu.lambda, first: S[0].lambda });
}
{ /* (d) the operator in force moves the lines: positronium */
  setMu(0.5); const ps = hydrogenStrip(lineList(getHamiltonian())).find((s) => s.id === '3-2').lambda; setMu(1);
  judge('THE OPERATOR IN FORCE: positronium (μ = ½) puts Balmer α at 1312.2 nm, twice the infinite-mass line, and μ = 1 gives Hα back', Math.abs(ps - 2 * lambdaNm(1 / 8 - 1 / 18)) < 1e-9 && Math.abs(ps - 1312.2) < 0.1 && Math.abs(lineList()[0].lambda - L[0].lambda) < 1e-12, { ps });
}
{ /* the state's own lines: 3d₀ + 2p₀ makes Hα, a single label none */
  const re = new Float64Array(BASIS.length), im = new Float64Array(BASIS.length), a = BASIS.find((s) => s.label === '3d₀').index, b = BASIS.find((s) => s.label === '2p₀').index;
  re[a] = re[b] = Math.SQRT1_2; const S = stateLines(re, im, [a, b]), one = stateLines(re, im, [a]);
  judge('THE PREPARED STATE\'S LINES: 3d₀ + 2p₀ lights one line at Hα (upper first, T = 90.48 a.u.), one label lights none', S.length === 1 && S[0].a === a && Math.abs(S[0].lambda - 656.47) < 0.005 && Math.abs(2 * Math.PI / S[0].omega - 90.478) < 1e-3 && one.length === 0, S[0]);
}
{ /* (e) a dozen configurations, read by hand */
  const C = [['2p6.3s', '2p6.3p', '3p-3s'], ['1s2', '1s.2p', '2p-1s'], ['1s.2s', '1s.2p', '2p-2s'], ['3d10.4s', '3d10.4p', '4p-4s'], ['4f14.6s2', '4f14.6s.6p', '6p-6s'],
    ['2s2.2p2', '2s2.2p.3s', '3s-2p'], ['2p5.(2P*).3s.3p.(3P*)', '2p5.3s.(3P*).3d', '3d-3p'], ['3s2', '3s.3p', '3p-3s'], ['4f7.(8S*).6s2', '4f7.(8S*).6s.6p', '6p-6s'],
    ['1s', '3', '3p-1s'], ['2', '3', '3d-2p'], ['3d10.4s', '3d9.4s2', null], ['2s2.2p3', '2s.2p4', '2p-2s'], ['5d.6s', '5d.8p', 'past']];
  const L2 = 'spdfghik', name = (o) => o.n + L2[o.l];
  const bad = C.filter(([lo, up, want]) => { const r = activeElectron(lo, up); const got = r.why ? (r.why.startsWith('past') ? 'past' : null) : name(r.upper) + '-' + name(r.lower); return got !== want; });
  judge('FOURTEEN NIST CONFIGURATIONS READ AS THEIR ACTIVE ELECTRON: Na 3p → 3s, He 2p → 1s and 2p → 2s, Cu, Yb, C, core-excited Na, Mg, Eu, H I\'s shells, a two-electron jump refused, n = 8 past the register',
    bad.length === 0 && parseConfig('') === null && parseConfig('2p6.3x') === null, { bad });
}
{ /* (e) the vendored NIST table: sodium's D pair is one picture */
  const T = JSON.parse(readFileSync(new URL('../lab/vendor/nist/lines.json', import.meta.url), 'utf8'));
  const Na = atomStrip(T.lines, 11), D = Na.filter((x) => Math.abs(x.lambda - 589.46) < 0.4), H = atomStrip(T.lines, 1).find((x) => Math.abs(x.lambda - 656.46) < 0.02);
  judge('THE MEASURED TABLE: Na I 589.16 and 589.76 nm (vacuum) both map to 3p → 3s and list each other; H I\'s Hα maps to 3d → 2p; every row is [Z, λ, A, I, conf, term, conf, term]',
    D.length === 2 && D.every((x) => x.group === '3p-3s' && x.same.length === 1) && Math.abs(D[0].lambda - 589.158) < 0.01 && Math.abs(D[1].lambda - 589.756) < 0.01 && H && H.group === '3d-2p' && T.lines.every((r) => r.length === 8 && r[1] > 0 && r[2] > 0),
    { D: D.map((x) => [x.lambda, x.group]), rows: T.lines.length, spectra: T.elements.length });
}
{ /* the colour of a wavelength */
  const r = waveRGB(656.47), b = waveRGB(470), g = waveRGB(530);
  judge('THE COLOUR: Hα reads red, 470 nm blue, 530 nm green; outside 380–750 nm no colour', r[0] > 200 && r[1] < 60 && b[2] > b[0] && b[2] > b[1] && g[1] > g[0] && g[1] > g[2] && waveRGB(121.6) === null && waveRGB(1000) === null, { r, b, g });
}
console.log('      wall time ' + ((Date.now() - T0) / 1000).toFixed(1) + ' s');
console.log((FAILED ? 'RED ' : 'GREEN ') + 'emission.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
