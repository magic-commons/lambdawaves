/* bf-r10-ks.mjs — Round 10 (Fable), Task 2: the KS-SLICE THEOREM.
 *
 * KS map (lab/slice.js):  x = (u1²−u2²−u3²+u4², 2(u1u2−u3u4), 2(u1u3+u2u4)).
 * Claims tested:
 *   (J)   the fibre direction is RIGHT multiplication by k:  J u = u·k = (−u4, u3, −u2, u1);  and KS(u) = A · Ad(u)(k)
 *         with A = [[0,0,1],[0,−1,0],[1,0,0]] (a rotation, det +1).  Left multiplications and the other right ones FAIL.
 *   (C)   on the plane span(f1, f2) = q̄_L span(j,k) q_R the Jacobian of (a,b) ↦ KS(a f1 + b f2) has singular values
 *         σ1 = 2ρ, σ2 = 2ρ·sqrt(1 − (n₋·ê3)²)  (ρ = |(a,b)|)  — so the slice collapses to a RAY iff n₋ = ±ê3,
 *         i.e. the degenerate set is S²₊ × {±ê3}: the MINUS sphere is the one held, the plus sphere is free.
 *   (K)   generic plane: the image of the unit circle is the circle on S² of angular radius arccos|n₋·ê3| about the
 *         axis A·n₊ — checked as ⟨KS(cos t f1 + sin t f2), (n₊z, −n₊y, n₊x)⟩ = n₋z for all t.
 *   (H)   corollary as posed ("a holomorphic drag — minus rotor only — never changes degeneracy") is tested and REFUTED:
 *         driving q_R moves n₋ and switches degeneracy on/off; driving q_L (which moves n₊ only) never does.
 * run: node bf-r10-ks.mjs
 */
import { ksMap } from '../../lab/slice.js';
import { qmul, qconj, qnormalize, expPure, visibleFrame, spherePoint, adjoint, isHolomorphic } from '../../lab/rotor4.js';

const rnd = () => Math.random() * 2 - 1;
const randQ = () => qnormalize([rnd(), rnd(), rnd(), rnd()]);
const sub = (a, b) => a.map((v, i) => v - b[i]);
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
const norm = (a) => Math.sqrt(dot(a, a));
/** the bilinear polarisation B(u,v) = KS(u+v) − KS(u) − KS(v) = dKS(u)·v */
const B = (u, v) => sub(sub(ksMap(u.map((x, i) => x + v[i])), ksMap(u)), ksMap(v));
const I = [0, 1, 0, 0], J = [0, 0, 1, 0], K = [0, 0, 0, 1];

/* ── (J) the fibre ─────────────────────────────────────────────────────────── */
console.log('== (J) which unit-imaginary multiplication is the KS fibre?  max |dKS(u)·(action u)| over 50 random u ==');
const actions = { 'u·i': (u) => qmul(u, I), 'u·j': (u) => qmul(u, J), 'u·k': (u) => qmul(u, K), 'i·u': (u) => qmul(I, u), 'j·u': (u) => qmul(J, u), 'k·u': (u) => qmul(K, u) };
for (const [name, act] of Object.entries(actions)) {
  let w = 0; for (let i = 0; i < 50; i++) { const u = [rnd(), rnd(), rnd(), rnd()]; w = Math.max(w, norm(B(u, act(u)))); }
  console.log(`  ${name}: ${w.toExponential(2)}`);
}
{ let w = 0;
  for (let i = 0; i < 50; i++) { const u = [rnd(), rnd(), rnd(), rnd()]; const c = adjoint(u, [0, 0, 1]); const x = ksMap(u);
    w = Math.max(w, norm(sub(x, [c[2], -c[1], c[0]]))); }
  console.log(`  KS(u) = A·Ad(u)(k) with A(c1,c2,c3) = (c3, −c2, c1): max error ${w.toExponential(2)}   (u k ū is Ad(u)k for |u|=1; the map is homogeneous so this holds for all u)`); }

/* ── (C) the collapse law on 200 random rotor pairs ────────────────────────── */
function svals(u, f1, f2) {          // singular values of the 3×2 Jacobian [B(u,f1) B(u,f2)]
  const c1 = B(u, f1), c2 = B(u, f2);
  const a = dot(c1, c1), b = dot(c1, c2), d = dot(c2, c2);
  const tr = a + d, det = a * d - b * b, disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
  return [Math.sqrt(tr / 2 + disc), Math.sqrt(Math.max(0, tr / 2 - disc))];
}
console.log('\n== (C) 200 random rotor pairs: σ2/σ1 of the KS Jacobian on the visible plane vs sqrt(1 − n₋z²)  [and vs the WRONG sphere] ==');
let worstM = 0, worstP = 0, worstS1 = 0;
for (let i = 0; i < 200; i++) {
  const qL = randQ(), qR = randQ();
  const { f1, f2 } = visibleFrame(qL, qR), { nP, nM } = spherePoint(qL, qR);
  const a = rnd() * 3, b = rnd() * 3, u = f1.map((v, k) => a * v + b * f2[k]);
  const [s1, s2] = svals(u, f1, f2);
  worstM = Math.max(worstM, Math.abs(s2 / s1 - Math.sqrt(1 - nM[2] ** 2)));
  worstP = Math.max(worstP, Math.abs(s2 / s1 - Math.sqrt(1 - nP[2] ** 2)));
  worstS1 = Math.max(worstS1, Math.abs(s1 - 2 * Math.hypot(a, b)));
}
console.log(`  max |σ2/σ1 − sqrt(1 − n₋z²)| = ${worstM.toExponential(2)}      max |σ1 − 2ρ| = ${worstS1.toExponential(2)}`);
console.log(`  max |σ2/σ1 − sqrt(1 − n₊z²)| = ${worstP.toExponential(2)}   ← the plus sphere does NOT govern it`);

/* ── (C′) exact degeneracy: rotors with n₋ = ±ê3, and rotors with n₊ = ±ê3 ──── */
console.log('\n== (C′) constructed rotors ==');
// n₋ = −Ad(q̄_R) ê1 = ±ê3  ⇔  Ad(q̄_R) i = ∓k.  q̄_R = exp(θ j) rotates i toward −k for θ=+π/4 … (half-angle π/4 → 90°)
function rotorWithNM(sign) {           // find q_R with n₋ = sign·ê3, by construction: Ad(q̄_R) i = −sign k
  const qRbar = expPure([0, sign * Math.PI / 4, 0]);   // exp(θ j) with θ = π/4: rotation by 90° about j, i ↦ −k (right-hand rule i→−k)
  const qR = qconj(qRbar);
  const nM = spherePoint([1, 0, 0, 0], qR).nM;
  return { qR, nM };
}
for (const sign of [1, -1]) {
  const { qR, nM } = rotorWithNM(sign);
  let worst2 = 0; const qL = randQ();
  const { f1, f2 } = visibleFrame(qL, qR);
  for (let i = 0; i < 20; i++) { const a = rnd() * 3, b = rnd() * 3, u = f1.map((v, k) => a * v + b * f2[k]); const [s1, s2] = svals(u, f1, f2); worst2 = Math.max(worst2, s2 / s1); }
  const xs = []; for (let t = 0; t < 6; t++) { const u = f1.map((v, k) => Math.cos(t) * v + Math.sin(t) * f2[k]); xs.push(ksMap(u)); }
  const spread = Math.max(...xs.map((x) => norm(sub(x, xs[0]))));
  console.log(`  n₋ = (${nM.map((v) => v.toFixed(3)).join(',')}), random q_L: max σ2/σ1 = ${worst2.toExponential(2)}; image of the unit circle: spread ${spread.toExponential(2)} (a single RAY)`);
}
{ // n₊ = ê3 but generic q_R: no collapse
  const qL = qconj(expPure([0, Math.PI / 4, 0])), qR = randQ();
  const { nP, nM } = spherePoint(qL, qR); const { f1, f2 } = visibleFrame(qL, qR);
  let worst2 = 0; for (let i = 0; i < 20; i++) { const a = rnd() * 3, b = rnd() * 3, u = f1.map((v, k) => a * v + b * f2[k]); const [s1, s2] = svals(u, f1, f2); worst2 = Math.max(worst2, s2 / s1); }
  console.log(`  n₊ = (${nP.map((v) => v.toFixed(3)).join(',')}), n₋ = (${nM.map((v) => v.toFixed(3)).join(',')}): σ2/σ1 = ${worst2.toFixed(6)} vs sqrt(1−n₋z²) = ${Math.sqrt(1 - nM[2] ** 2).toFixed(6)} — NOT degenerate`); }

/* ── (K) the generic cone ──────────────────────────────────────────────────── */
console.log('\n== (K) generic plane: KS(unit circle) lies on the circle ⟨x, (n₊z, −n₊y, n₊x)⟩ = n₋z  (axis A·n₊, half-angle arccos|n₋z|) ==');
{ let w = 0, wSwap = 0;
  for (let i = 0; i < 200; i++) {
    const qL = randQ(), qR = randQ(); const { f1, f2 } = visibleFrame(qL, qR), { nP, nM } = spherePoint(qL, qR);
    const axis = [nP[2], -nP[1], nP[0]], axisSwap = [nM[2], -nM[1], nM[0]];
    for (let t = 0; t < 2 * Math.PI; t += 0.37) { const u = f1.map((v, k) => Math.cos(t) * v + Math.sin(t) * f2[k]); const x = ksMap(u);
      w = Math.max(w, Math.abs(dot(x, axis) - nM[2])); wSwap = Math.max(wSwap, Math.abs(dot(x, axisSwap) - nP[2])); }
  }
  console.log(`  max |⟨x, A n₊⟩ − n₋z| over 200 rotors × 17 angles = ${w.toExponential(2)};  with the spheres swapped: ${wSwap.toExponential(2)}`);
  // and the double cover of the circle: x(t + π) = x(t)
  let wp = 0; const qL = randQ(), qR = randQ(); const { f1, f2 } = visibleFrame(qL, qR);
  for (let t = 0; t < Math.PI; t += 0.2) { const u1 = f1.map((v, k) => Math.cos(t) * v + Math.sin(t) * f2[k]), u2 = u1.map((v) => -v); wp = Math.max(wp, norm(sub(ksMap(u1), ksMap(u2)))); }
  console.log(`  x(t+π) = x(t) (KS is even): ${wp.toExponential(2)} — the circle is traversed twice`); }

/* ── (H) the corollary as posed, tested ────────────────────────────────────── */
console.log('\n== (H) drags from a degenerate rotor (n₋ = ê3): minus-rotor drag (the lab\'s HOLOMORPHIC motion) vs plus-rotor drag ==');
{ const { qR: qR0 } = rotorWithNM(1); const qL0 = randQ();
  const deg = (qL, qR) => { const { f1, f2 } = visibleFrame(qL, qR); let w = 0; for (let i = 0; i < 10; i++) { const a = rnd() * 3, b = rnd() * 3, u = f1.map((v, k) => a * v + b * f2[k]); const [s1, s2] = svals(u, f1, f2); w = Math.max(w, s2 / s1); } return w; };
  console.log(`  start: σ2/σ1 = ${deg(qL0, qR0).toExponential(2)}, holomorphic(q_L)=${isHolomorphic(qL0)}`);
  for (const th of [0.1, 0.5, 1.0]) {
    const qR = qmul(expPure([0, th / 2, 0]), qR0);         // drive the MINUS rotor about y (about x would fix n₋ = image of ê1)
    const qL = qmul(expPure([0, th / 2, 0]), qL0);         // drive the PLUS rotor about y
    const dM = deg(qL0, qR), dP = deg(qL, qR0), nMm = spherePoint(qL0, qR).nM, nPp = spherePoint(qL, qR0).nP;
    console.log(`  θ=${th}: minus-drag → σ2/σ1 = ${dM.toFixed(6)} (n₋z = ${nMm[2].toFixed(6)}, predicted ${Math.sqrt(1 - nMm[2] ** 2).toFixed(6)});  plus-drag → σ2/σ1 = ${dP.toExponential(2)} (n₊ moved to (${nPp.map((v) => v.toFixed(3)).join(',')}), still a ray)`);
  }
}
