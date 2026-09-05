/* tests/kepler.test.mjs — the node proof of the Kepler orbit a shell state carries.
 *   node tests/kepler.test.mjs
 * Oracles: the circular Rydberg state (a circle), the Stark rotation (a circle becomes an ellipse of eccentricity
 * sin θ, a classical fact), Pauli's replacement ⟨x⟩ = −(3n/2)⟨K⟩ against the exact dipole, and the classical
 * time average of the drawn orbit by the area law.
 */
import { BASIS } from '../lab/hydrogen.js';
import { shellMatrix, rotorExpectations, applyRotor } from '../lab/frontier.js';
import { dipoleZ } from '../lab/dynamics.js';
import { keplerOrbit, orbitPoints, timeAveragedPosition, keplerOrbits } from '../lab/kepler.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 300)));
}
const idx = (n, l, m) => BASIS.findIndex((s) => s.n === n && s.l === l && s.m === m);
const N = 91;
const orbitOf = (re, im, n) => keplerOrbit(n, rotorExpectations(shellMatrix(re, im, n)));
/* the circular state |n, n−1, n−1⟩: K = 0, L = (n−1)ẑ — a circle of radius a = n² in the xy-plane */
{
  for (const n of [3, 6]) {
    const re = new Float64Array(N), im = new Float64Array(N); re[idx(n, n - 1, n - 1)] = 1;
    const o = orbitOf(re, im, n), pts = orbitPoints(o, 64);
    const radii = pts.map((p) => Math.hypot(...p)), zs = pts.map((p) => Math.abs(p[2]));
    judge(`K${n} the circular state |${n},${n - 1},${n - 1}⟩ carries a CIRCLE: e = 0 (1e-12), radius a = n² = ${n * n}, in the plane ⟂ ẑ, and its angular momentum is n−1 = ${n - 1}`,
      o.e < 1e-12 && Math.max(...radii.map((r) => Math.abs(r - n * n))) < 1e-9 && Math.max(...zs) < 1e-9 && Math.abs(o.absL - (n - 1)) < 1e-12 && Math.abs(o.normal[2]) > 1 - 1e-12,
      { e: o.e, a: o.a, absL: o.absL, normal: o.normal, eL: o.eL });
  }
  const re = new Float64Array(N), im = new Float64Array(N); re[idx(6, 5, 5)] = 1;
  const o = orbitOf(re, im, 6);
  judge('K the quantum circle is slightly sub-classical: L = n−1 not n, so the eccentricity the angular momentum alone implies is √(2n−1)/n = 0.553 at n = 6 (→ 0 as n → ∞)', Math.abs(o.eL - Math.sqrt(11) / 6) < 1e-12 && Math.abs(o.period - 2 * Math.PI * 216) < 1e-9, { eL: o.eL, period: o.period });
}
/* THE STARK ROTATION TURNS A CIRCLE INTO AN ELLIPSE OF ECCENTRICITY sin θ — a classical fact, exact on the shell */
{
  let worst = 0;
  for (const n of [4, 6]) for (const th of [0.3, 0.9, 1.4]) {
    const re = new Float64Array(N), im = new Float64Array(N); re[idx(n, n - 1, n - 1)] = 1;
    applyRotor(re, im, { which: 'K', axis: 'x', angle: th });
    const o = orbitOf(re, im, n);
    /* |J±| = j = (n−1)/2 each, tilted by ±θ: |K| = (n−1) sin θ, |L| = (n−1) cos θ */
    worst = Math.max(worst, Math.abs(o.absK - (n - 1) * Math.sin(th)), Math.abs(o.absL - (n - 1) * Math.cos(th)), Math.abs(o.e - (n - 1) * Math.sin(th) / n));
    if (n === 6 && th === 0.9) judge('K and the ellipse is drawn with the focus at the origin: |r| ranges from a(1−e) to a(1+e) over the orbit', (() => { const r = orbitPoints(o, 256).map((p) => Math.hypot(...p)); return Math.abs(Math.min(...r) - o.a * (1 - o.e)) < 1e-6 && Math.abs(Math.max(...r) - o.a * (1 + o.e)) < 1e-6; })(), { e: o.e, a: o.a });
  }
  judge('K THE STARK ROTATION: e^{−iθK_x} on a circular state gives |K| = (n−1) sin θ and |L| = (n−1) cos θ exactly (1e-12) — the circle becomes an ellipse of eccentricity sin θ, as it does classically', worst < 1e-12, worst);
}
/* PAULI\'S REPLACEMENT, GATED: ⟨z⟩ (the exact dipole) = −(3n/2)⟨K_z⟩ on any single-shell state */
{
  let seed = 31; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 - 0.5; };
  let worst = 0;
  for (const n of [2, 3, 4, 5, 6]) for (let k = 0; k < 3; k++) {
    const re = new Float64Array(N), im = new Float64Array(N), ids = [];
    for (const s of BASIS) if (s.n === n) { ids.push(s.index); re[s.index] = rnd(); im[s.index] = rnd(); }
    let n2 = 0; for (const a of ids) n2 += re[a] ** 2 + im[a] ** 2;
    const o = orbitOf(re, im, n), z = dipoleZ(re, im, ids).value;
    worst = Math.max(worst, Math.abs(z - o.meanPosition[2]));
  }
  judge('K PAULI\'S REPLACEMENT, GATED: on fifteen random single-shell states (n = 2…6) the exact dipole ⟨z⟩ equals −(3n/2)⟨K_z⟩ to 1e-9 (12000-panel quadrature; measured 5e-11) — the quantum centroid is a property of the Runge–Lenz vector alone', worst < 1e-9, worst);
}
/* THE CLASSICAL TIME AVERAGE of the drawn orbit equals that centroid: the body lingers at aphelion, at −(3/2)·a·e·K̂ */
{
  let worst = 0;
  for (const n of [3, 5]) for (const th of [0.4, 1.1]) {
    const re = new Float64Array(N), im = new Float64Array(N); re[idx(n, n - 1, n - 1)] = 1;
    applyRotor(re, im, { which: 'K', axis: 'y', angle: th });
    const o = orbitOf(re, im, n), avg = timeAveragedPosition(o, 20000);
    worst = Math.max(worst, ...avg.map((c, i) => Math.abs(c - o.meanPosition[i])));
  }
  judge('K the classical orbit\'s TIME-AVERAGED position (area law, 20000 steps) equals −(3/2)·a·e·K̂ = −(3n/2)⟨K⟩ to 1e-8 — an identity by construction once a = n², e = |K|/n are read off the state (the physics is Pauli\'s replacement, gated above)', worst < 1e-8, worst);
}
/* every populated shell gets its own orbit, weighted by its share */
{
  const re = new Float64Array(N), im = new Float64Array(N);
  re[idx(1, 0, 0)] = 0.6; re[idx(3, 2, 2)] = 0.8;
  const orbs = keplerOrbits(re, im);
  judge('K keplerOrbits: the 1s share is isotropic (no orbit) and the 3d₊₂ shell carries a circle of radius 9 with 64% of the norm', orbs.length === 1 && orbs[0].orbit.n === 3 && Math.abs(orbs[0].share - 0.64) < 1e-12 && orbs[0].orbit.e < 1e-12 && Math.abs(orbs[0].orbit.a - 9) < 1e-12, orbs.map((o) => ({ n: o.orbit.n, share: o.share, e: o.orbit.e })));
  const s = new Float64Array(N), t = new Float64Array(N); s[idx(2, 0, 0)] = 1;
  judge('K a bare 2s state is isotropic: K = 0 and L = 0, so there is no orbit to draw and the code says so', orbitOf(s, t, 2).isotropic === true);
}

console.log((FAILED ? 'RED' : 'GREEN') + ' kepler.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
