

export const INV_SQRT2 = 1 / Math.SQRT2;
export const BIVECTOR_PLANES = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
export const E0 = [1, 0, 0, 0], E1 = [0, 1, 0, 0], E2 = [0, 0, 1, 0], E3 = [0, 0, 0, 1];

export function qmul(a, b) {
  return [a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
    a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
    a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
    a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]];
}
export const qconj = (a) => [a[0], -a[1], -a[2], -a[3]];
export const qdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
export const qnorm = (a) => Math.sqrt(qdot(a, a));
export function qnormalize(a) { const n = qnorm(a); return n === 0 ? [1, 0, 0, 0] : a.map((x) => x / n); }
export const qneg = (a) => a.map((x) => -x);
/** exp of a pure quaternion (a 3-vector): the rotor turning by |v| about v̂ */
export function expPure(v) {
  const t = Math.hypot(v[0], v[1], v[2]);
  if (t < 1e-12) return [1, v[0] / 2, v[1] / 2, v[2] / 2];
  const s = Math.sin(t) / t;
  return [Math.cos(t), v[0] * s, v[1] * s, v[2] * s];
}
/** the 4D rotation itself */
export function spinAction(qL, qR, v) { return qmul(qmul(qL, v), qconj(qR)); }
/** the 4×4 matrix of (q_L, q_R), column j = the image of ê_j */
export function rotorMatrix(qL, qR) {
  const cols = [E0, E1, E2, E3].map((e) => spinAction(qL, qR, e));
  const M = [[], [], [], []];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) M[i][j] = cols[j][i];
  return M;
}
/** Ad(q) on a 3-vector: the ordinary SO(3) rotation q v q̄ */
export function adjoint(q, v) {
  const r = qmul(qmul(q, [0, v[0], v[1], v[2]]), qconj(q));
  return [r[1], r[2], r[3]];
}
/** the self-dual / anti-self-dual split of a bivector (6 components → two 3-vectors) */
export function split(v) {
  return [[(v[0] + v[5]) * INV_SQRT2, (v[1] - v[4]) * INV_SQRT2, (v[2] + v[3]) * INV_SQRT2],
    [(v[0] - v[5]) * INV_SQRT2, (v[1] + v[4]) * INV_SQRT2, (v[2] - v[3]) * INV_SQRT2]];
}
export function wedge(a, b) { return BIVECTOR_PLANES.map(([i, j]) => a[i] * b[j] - a[j] * b[i]); }
/** the two VISIBLE rows: the oriented 2-plane the rotor pair puts on screen */
export function visibleFrame(qL, qR) {
  return { f1: qmul(qmul(qconj(qL), E2), qR), f2: qmul(qmul(qconj(qL), E3), qR) };
}
/** the two INVISIBLE rows — the depth frame; g₁ gives every sample a signed distance from the visible plane */
export function depthFrame(qL, qR) {
  return { g1: qmul(qmul(qconj(qL), E0), qR), g2: qmul(qmul(qconj(qL), E1), qR) };
}
/** the point of Gr⁺(2,4) ≅ S²×S² the rotor pair is looking at (unit vectors; the Grassmann point is these /√2) */
export function spherePoint(qL, qR) {
  return { nP: adjoint(qconj(qL), [1, 0, 0]), nM: adjoint(qconj(qR), [1, 0, 0]).map((v) => -v) };
}
/** the same point read off the visible plane's bivector — the independent route, and the way to check the first */
export function spherePointFromFrame(f1, f2) {
  const [p, m] = split(wedge(f1, f2));                 // a unit simple bivector splits with |n±| = 1/√2 …
  const s = Math.SQRT2;                                 // … so scale by √2 to compare with spherePoint's unit vectors
  return { nP: p.map((v) => v * s), nM: m.map((v) => v * s), raw: { p, m } };
}
/** the (q_L, q_R) ~ (−q_L, −q_R) quotient: pick the representative whose first non-negligible q_L component is + */
export function canonicaliseRotors(qL, qR) {
  for (let i = 0; i < 4; i++) if (Math.abs(qL[i]) > 1e-12) return qL[i] < 0 ? { qL: qneg(qL), qR: qneg(qR) } : { qL, qR };
  return { qL, qR };
}
/** cover-aware slerp: always the short way round */
export function slerp(a, b, t) {
  let d = qdot(a, b), bb = b;
  if (d < 0) { bb = qneg(b); d = -d; }
  if (d > 0.9995) return qnormalize(a.map((x, i) => x + (bb[i] - x) * t));
  const th = Math.acos(Math.min(1, d)), s = Math.sin(th);
  const w1 = Math.sin((1 - t) * th) / s, w2 = Math.sin(t * th) / s;
  return a.map((x, i) => x * w1 + bb[i] * w2);
}
/** the geodesic between two rotor pairs: two slerps, one per sphere */
export function tourSegment(from, to) { return { from, to }; }
export function tourSegmentAt(seg, t) {
  return canonicaliseRotors(slerp(seg.from.qL, seg.to.qL, t), slerp(seg.from.qR, seg.to.qR, t));
}
/**
 * The two principal angles of a motion built from half-angles (A, B).  Their note is emphatic that the wrap
 * min(s, π − s) is NOT cosmetic — without it the formula is wrong on about a twentieth of all pairs.
 */
export function principalAngles(thetaPlus, thetaMinus) {
  const fold = (s) => { const u = Math.abs(s) % (2 * Math.PI); return u > Math.PI ? 2 * Math.PI - u : u; };
  return [fold(thetaPlus + thetaMinus), fold(thetaPlus - thetaMinus)].sort((a, b) => a - b);
}
/** STILL · LEFT-ISOCLINIC · RIGHT-ISOCLINIC · SIMPLE · DOUBLE */
export function classifyManeuver(thetaPlus, thetaMinus, tol = 1e-6) {
  const p = Math.abs(thetaPlus) < tol, m = Math.abs(thetaMinus) < tol;
  if (p && m) return 'STILL';
  if (m) return 'LEFT-ISOCLINIC';
  if (p) return 'RIGHT-ISOCLINIC';
  if (Math.abs(Math.abs(thetaPlus) - Math.abs(thetaMinus)) < tol) return 'SIMPLE';
  return 'DOUBLE';
}
/**
 * The holomorphy law: the motion is U(2) ⊂ SO(4) — complex-linear for the complex structure that multiplies by i
 * on the left — iff q_L lies in span(1, i), equivalently iff n₊ does not move.  In the instrument's own terms:
 * **driving the minus rotor alone is a holomorphic motion of the shell.**
 */
export function isHolomorphic(qL, tol = 1e-9) { return Math.abs(qL[2]) < tol && Math.abs(qL[3]) < tol; }
/** project a rotor onto the holomorphic sheet by killing the j and k parts of q_L */
export function projectToU2(qL) { return qnormalize([qL[0], qL[1], 0, 0]); }
/** the identity rotor pair */
export const IDENTITY = { qL: [1, 0, 0, 0], qR: [1, 0, 0, 0] };
