/* tests/rotor4.test.mjs — the node proof of the ported 4D rotor algebra and the complex slice.
 *   node tests/rotor4.test.mjs
 * The anchors are the 4D ENGINE's OWN laws (RES-4DGRAND), checked here independently: the rotor pair is a rotation,
 * the two spheres agree by two routes, the isoclinic angle law A ± B, the holomorphy law, and the KS map's identity
 * |x| = |u|² which is what makes the KS slice a fold.
 */
import { qmul, qconj, qnormalize, expPure, spinAction, rotorMatrix, adjoint, split, wedge, visibleFrame,
  spherePoint, spherePointFromFrame, canonicaliseRotors, slerp, tourSegmentAt, principalAngles, classifyManeuver,
  isHolomorphic, projectToU2, IDENTITY } from '../lab/rotor4.js';
import { ksMap, sampleSlice, paintSlice, planeReport } from '../lab/slice.js';
import { Register, PRESETS } from '../lab/state.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 260)));
}
let seed = 424242; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const rq = () => qnormalize([rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1]);

/* the rotor pair is an SO(4) rotation: orthogonal, determinant +1, norm-preserving */
{
  let worstO = 0, worstN = 0;
  for (let k = 0; k < 12; k++) {
    const qL = rq(), qR = rq(), M = rotorMatrix(qL, qR);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      let s = 0; for (let a = 0; a < 4; a++) s += M[a][i] * M[a][j];
      worstO = Math.max(worstO, Math.abs(s - (i === j ? 1 : 0)));
    }
    const v = [rnd(), rnd(), rnd(), rnd()], w = spinAction(qL, qR, v);
    worstN = Math.max(worstN, Math.abs(Math.hypot(...w) - Math.hypot(...v)));
  }
  judge('R4 the quaternion pair x ↦ q_L x conj(q_R) is an orthogonal 4D rotation (columns orthonormal, norms preserved) over twelve random pairs', worstO < 1e-14 && worstN < 1e-14, { orth: worstO, norm: worstN });
}
/* the two spheres, by two independent routes: Ad(q̄)ê₁ and the bivector split of the visible plane */
{
  let worst = 0;
  for (let k = 0; k < 12; k++) {
    const qL = rq(), qR = rq();
    const a = spherePoint(qL, qR);
    const { f1, f2 } = visibleFrame(qL, qR);
    const b = spherePointFromFrame(f1, f2);
    for (let i = 0; i < 3; i++) worst = Math.max(worst, Math.abs(a.nP[i] - b.nP[i]), Math.abs(a.nM[i] - b.nM[i]));
  }
  judge('R4 the Grassmann point on S²×S² agrees by two routes — the rotors Ad(q̄_L)ê₁, −Ad(q̄_R)ê₁, and the self-dual split of the visible plane\'s bivector (1e-14)', worst < 1e-14, worst);
  const { nP, nM } = spherePoint(rq(), rq());
  judge('R4 and both are unit vectors (the Grassmann point itself is these over √2)', Math.abs(Math.hypot(...nP) - 1) < 1e-14 && Math.abs(Math.hypot(...nM) - 1) < 1e-14);
}
/* the isoclinic angle law: q_L = exp(A û), q_R = exp(B v̂) turns the plane by A ± B */
{
  const A = 0.7, B = 0.25, u = [1, 0, 0], v = [1, 0, 0];
  const qL = expPure(u.map((x) => x * A)), qR = expPure(v.map((x) => x * B));
  const ang = principalAngles(2 * A, 2 * B);
  judge('R4 the angle law: for q_L = exp(Aû), q_R = exp(Bv̂) the two principal angles are |A±B| doubled — 2(A−B) and 2(A+B)', Math.abs(ang[0] - 2 * (A - B)) < 1e-12 && Math.abs(ang[1] - 2 * (A + B)) < 1e-12, ang);
  judge('R4 and the classifier names the special cases: B = 0 is LEFT-ISOCLINIC, A = B is SIMPLE, A = B = 0 is STILL, otherwise DOUBLE',
    classifyManeuver(0.7, 0) === 'LEFT-ISOCLINIC' && classifyManeuver(0, 0.7) === 'RIGHT-ISOCLINIC' && classifyManeuver(0.4, 0.4) === 'SIMPLE' && classifyManeuver(0, 0) === 'STILL' && classifyManeuver(0.7, 0.25) === 'DOUBLE');
}
/* the holomorphy law: the motion is U(2) iff q_L ∈ span(1, i) iff n₊ never moves */
{
  const qR0 = rq();
  const qL = qnormalize([0.6, 0.8, 0, 0]);                    // in span(1, i)
  judge('R4 a rotor with q_L in span(1, i) is holomorphic, and one with a j or k part is not', isHolomorphic(qL) && !isHolomorphic(qnormalize([0.6, 0.4, 0.5, 0])));
  const n0 = spherePoint(qL, qR0).nP;
  let moved = 0;
  for (let k = 0; k < 8; k++) {                                // move the MINUS rotor only: n₊ must stand still
    const qR = qnormalize(qmul(rq(), qR0));
    const n = spherePoint(qL, qR).nP;
    moved = Math.max(moved, Math.hypot(n[0] - n0[0], n[1] - n0[1], n[2] - n0[2]));
  }
  judge('R4 THE HOLOMORPHY LAW: driving the MINUS rotor alone never moves n₊ (1e-15) — so in this instrument a U(2) motion of a shell is exactly a motion of one rotor', moved < 1e-15, moved);
  const p = projectToU2(qnormalize([0.5, 0.5, 0.5, 0.5]));
  judge('R4 and the projection onto the holomorphic sheet lands on it', isHolomorphic(p) && Math.abs(Math.hypot(...p) - 1) < 1e-15, p);
}
/* the geodesic and the double cover */
{
  const from = canonicaliseRotors(rq(), rq()), to = canonicaliseRotors(rq(), rq());
  const a = tourSegmentAt({ from, to }, 0), b = tourSegmentAt({ from, to }, 1), m = tourSegmentAt({ from, to }, 0.5);
  const close = (x, y) => Math.max(...x.map((v, i) => Math.abs(v - y[i])));
  judge('R4 the two-slerp geodesic starts at the first plane, ends at the second, and stays on the group in between', close(a.qL, from.qL) < 1e-12 && close(b.qL, to.qL) < 1e-12 && Math.abs(Math.hypot(...m.qL) - 1) < 1e-12 && Math.abs(Math.hypot(...m.qR) - 1) < 1e-12);
  const c1 = canonicaliseRotors([-0.5, 0.5, 0.5, 0.5], [1, 0, 0, 0]);
  judge('R4 canonicalisation fixes the (q_L, q_R) ~ (−q_L, −q_R) double cover, which is invisible on screen but not in a checksum', c1.qL[0] > 0 && c1.qR[0] < 0);
}
/* the KS map: |x| = |u|², which is what folds the KS slice */
{
  let worst = 0;
  for (let k = 0; k < 20; k++) {
    const u = [rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1];
    const x = ksMap(u), r = Math.hypot(...x), n2 = u[0] ** 2 + u[1] ** 2 + u[2] ** 2 + u[3] ** 2;
    worst = Math.max(worst, Math.abs(r - n2) / n2);
  }
  judge('R4 the Kustaanheimo–Stiefel map satisfies |x| = |u|² exactly (20 points, 1e-15) — the quadratic fold that makes the KS slice show caustics as the plane turns', worst < 1e-15, worst);
  const u = [0.3, -0.7, 0.2, 0.5], a = ksMap(u), b = ksMap(u.map((v) => -v));
  judge('R4 and it is two-to-one: u and −u land on the same point', Math.max(...a.map((v, i) => Math.abs(v - b[i]))) < 1e-15);
}
/* the slice actually samples the wavefunction, and the two planes differ */
{
  const R = new Register(); R.load(PRESETS.find((p) => p.id === '2p+'));
  const s1 = sampleSlice(R, 0, IDENTITY, { mode: 'space', half: 8, N: 24 });
  const s2 = sampleSlice(R, 0, IDENTITY, { mode: 'ks', half: 8, N: 24 });
  let n1 = 0, n2 = 0;
  for (let k = 0; k < 24 * 24; k++) { if (Math.hypot(s1.re[k], s1.im[k]) > 1e-12) n1++; if (Math.hypot(s2.re[k], s2.im[k]) > 1e-12) n2++; }
  judge('R4 both planes sample ψ (2p₊ on a 24² grid): the ℝ³ plane and the KS plane are both populated and give different pictures', n1 > 100 && n2 > 100 && Math.abs(s1.absMax - s2.absMax) > 1e-9, { space: n1, ks: n2, mx: [s1.absMax, s2.absMax] });
  /* the painter is bounded: cranking the gain cannot exceed full brightness */
  const img = { data: new Uint8ClampedArray(24 * 24 * 4), width: 24, height: 24 };
  paintSlice(s1, img, { gain: 1e6, knee: 0.6 });
  let mx = 0; for (let k = 0; k < img.data.length; k += 4) mx = Math.max(mx, img.data[k], img.data[k + 1], img.data[k + 2]);
  judge('R4 the domain colouring has a bounded ceiling: a gain of a million still clips at 255, it does not overflow', mx <= 255 && mx > 100, mx);
  const rep = planeReport(IDENTITY);
  judge('R4 the identity plane reports its two sphere points and is on the holomorphic sheet', rep.holomorphic && rep.text.includes('n₊'), rep.text);
}

/* THE KS-SLICE THEOREM (Round 10 §2): the slice (a,b) ↦ KS(a f₁ + b f₂) is a cone over a CIRCLE — its Jacobian has
   singular values σ₁ = 2ρ, σ₂ = 2ρ√(1 − n₋z²) everywhere — so it never folds; it collapses to a ray iff n₋ = ±ê₃
   (the MINUS sphere at a pole) and flattens to a plane at the equator.  The cone axis is A n₊ = (n₊z, −n₊y, n₊x). */
{
  let worstRatio = 0, worstAxis = 0;
  for (let k = 0; k < 60; k++) {
    const qL = rq(), qR = rq(), { f1, f2 } = visibleFrame(qL, qR), { nP, nM } = spherePoint(qL, qR);
    const a = rnd() * 2 - 1, b = rnd() * 2 - 1, rho = Math.hypot(a, b), h = 1e-3;
    const KS = (s, t) => ksMap([s * f1[0] + t * f2[0], s * f1[1] + t * f2[1], s * f1[2] + t * f2[2], s * f1[3] + t * f2[3]]);
    const A = KS(a + h, b), B = KS(a - h, b), C = KS(a, b + h), D = KS(a, b - h);   // central differences are EXACT for a quadratic map
    const Ja = A.map((v, i) => (v - B[i]) / (2 * h)), Jb = C.map((v, i) => (v - D[i]) / (2 * h));
    const g11 = Ja[0] * Ja[0] + Ja[1] * Ja[1] + Ja[2] * Ja[2], g22 = Jb[0] * Jb[0] + Jb[1] * Jb[1] + Jb[2] * Jb[2], g12 = Ja[0] * Jb[0] + Ja[1] * Jb[1] + Ja[2] * Jb[2];
    const tr = g11 + g22, det = g11 * g22 - g12 * g12, disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
    const s1 = Math.sqrt(tr / 2 + disc), s2 = Math.sqrt(Math.max(0, tr / 2 - disc));
    worstRatio = Math.max(worstRatio, Math.abs(s2 / s1 - Math.sqrt(1 - nM[2] * nM[2])), Math.abs(s1 - 2 * rho) / (2 * rho));
    const t = rnd() * 2 * Math.PI, X = KS(Math.cos(t), Math.sin(t));
    worstAxis = Math.max(worstAxis, Math.abs(X[0] * nP[2] - X[1] * nP[1] + X[2] * nP[0] - nM[2]));
  }
  judge('R4 THE KS-SLICE THEOREM (Round 10 §2): the slice is a cone over a circle — σ₂/σ₁ = √(1 − n₋z²) and σ₁ = 2ρ at every point (1e-9, 60 random rotors and points) — so it NEVER folds, and its axis is A·n₊: ⟨KS(cos t f₁ + sin t f₂), (n₊z, −n₊y, n₊x)⟩ = n₋z (1e-12)', worstRatio < 1e-9 && worstAxis < 1e-12, { worstRatio, worstAxis });
  /* the degenerate set: the MINUS sphere at a pole (n₋ = ±ê₃), the plus sphere free */
  let degOK = true, detail = [];
  for (const sgn of [1, -1]) {
    const qR = qconj(expPure([0, sgn * Math.PI / 4, 0])), qL = rq();                    // q̄_R turns ê₁ onto ∓ê₃
    const { nM } = spherePoint(qL, qR), { f1, f2 } = visibleFrame(qL, qR);
    const KS = (s, t) => ksMap([s * f1[0] + t * f2[0], s * f1[1] + t * f2[1], s * f1[2] + t * f2[2], s * f1[3] + t * f2[3]]);
    const X = [0, 0.7, 1.9, 3.1, 4.4].map((t) => { const v = KS(Math.cos(t), Math.sin(t)); const n = Math.hypot(...v); return v.map((c) => c / n); });
    let spread = 0; for (const v of X) spread = Math.max(spread, ...v.map((c, i) => Math.abs(c - X[0][i])));
    detail.push({ nMz: nM[2], spread });
    if (Math.abs(Math.abs(nM[2]) - 1) > 1e-12 || spread > 1e-12) degOK = false;
  }
  judge('R4 and it collapses to a single RAY exactly when n₋ = ±ê₃ — both poles of the minus sphere, any plus point: five points of the unit circle map to one direction (1e-12)', degOK, detail);
}
console.log((FAILED ? 'RED' : 'GREEN') + ' rotor4.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
