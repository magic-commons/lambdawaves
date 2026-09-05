/* kepler.js — the classical Kepler orbit a shell state carries, exactly.
 *
 * STATUS: EXACT expectation values; the orbit drawn is the classical one with those invariants (a DESIGN CHOICE
 * of which classical object to show — the canonical one — labelled as such).
 *
 * On a shell n hydrogen's hidden SO(4) = SU(2)₊ × SU(2)₋ has J± = (L ± K)/2, with K the Runge–Lenz vector scaled
 * to the shell (Pauli: K² + L² = n² − 1).  Classically, for a Kepler orbit of energy E = −1/(2n²):
 *
 *     a = n²  (semi-major axis, from the energy alone),   e = |K|/n  (eccentricity),   K̂ → perihelion,
 *     L̂ = the orbit's normal,   L² = a(1 − e²),   T = 2π a^{3/2} = 2π n³  (Kepler III = the revival clock T_cl).
 *
 * So the two sphere points of the ORBIT window — n₊ = ⟨J₊⟩/j and n₋ = ⟨J₋⟩/j — ARE the classical orbit: the angle
 * between them is the eccentricity (e = |n₊ − n₋|/2 for a coherent state), their sum is the angular momentum, and
 * the shell sets the size.  A coherent state (the print's Gr⁺(2,4)) is the state that sits on its ellipse; the
 * "coherence" min(|⟨J₊⟩|, |⟨J₋⟩|)/j says how close any state is to that.
 *
 * THE THEOREM THIS GATES (Pauli's replacement, exact within a shell, for EVERY shell state — Round 11 §3.1):
 * ⟨x⟩ = −(3n/2)⟨K⟩.  The classical orbit's TIME-AVERAGED position is −(3/2)·a·e·K̂, and with a = n², e = |K|/n
 * that is −(3n/2)K IDENTICALLY: once a and e are chosen from the state, the equality is by construction, and the
 * physics in it is Pauli's identity.  What the drawn ellipse cannot carry is the angular momentum: its own is
 * L_orbit = n√(1−e²), while the state has |⟨L⟩| with |⟨L⟩|² + |⟨K⟩|² ≤ n² − 1 < n² — so L_orbit > |⟨L⟩| always
 * (n − (n−1) = 1 for the circular state).  The gap is returned and printed (Round 11 §3.2).
 */
import { shellMatrix, rotorExpectations } from './frontier.js';

const unit = (v) => { const n = Math.hypot(v[0], v[1], v[2]); return n > 0 ? [v[0] / n, v[1] / n, v[2] / n] : [0, 0, 0]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
/** any unit vector perpendicular to u */
function perp(u) { const t = Math.abs(u[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]; return unit(cross(u, t)); }

/** the Kepler orbit of shell n from its rotor expectations R = rotorExpectations(shellMatrix(...)) */
export function keplerOrbit(n, R) {
  const a = n * n, e = Math.min(1, R.absK / n), L = R.L, K = R.K;
  const eL = Math.sqrt(Math.max(0, 1 - (R.absL / n) ** 2));         // the eccentricity the angular momentum alone implies
  const Lhat = R.absL > 1e-9 ? unit(L) : null, Khat = R.absK > 1e-9 ? unit(K) : null;
  let u, v, normal;
  if (Lhat && Khat) { normal = Lhat; u = unit(cross(cross(Lhat, Khat), Lhat)); v = cross(normal, u); }   // u = K̂ projected into the plane
  else if (Lhat) { normal = Lhat; u = perp(Lhat); v = cross(normal, u); }                                  // a circle: any in-plane u
  else if (Khat) { u = Khat; normal = perp(Khat); v = cross(normal, u); }                                   // a radial orbit (e → 1): a segment along K̂
  else return { n, a, e: 0, eL, isotropic: true, meanPosition: [0, 0, 0], period: 2 * Math.PI * a * Math.sqrt(a), coherence: R.coherence, absL: R.absL, absK: R.absK };
  const b = a * Math.sqrt(1 - e * e), p = a * (1 - e * e);
  return { n, a, b, e, eL, p, u, v, normal, Lhat, Khat, isotropic: false, Lorbit: n * Math.sqrt(1 - e * e), Lgap: n * Math.sqrt(1 - e * e) - R.absL,
    center: [-a * e * u[0], -a * e * u[1], -a * e * u[2]],           // the focus is the origin; the centre sits toward aphelion
    perihelion: [p / (1 + e) * u[0], p / (1 + e) * u[1], p / (1 + e) * u[2]],
    meanPosition: [-1.5 * n * K[0], -1.5 * n * K[1], -1.5 * n * K[2]], // = −(3/2) a e K̂ = the quantum ⟨x⟩ (Pauli)
    period: 2 * Math.PI * a * Math.sqrt(a), coherence: R.coherence, absL: R.absL, absK: R.absK };
}
/** N points of the orbit, r(θ) = p/(1 + e cos θ), θ from the perihelion direction u */
export function orbitPoints(orb, N = 128) {
  if (orb.isotropic) return [];
  const out = [];
  for (let i = 0; i < N; i++) {
    const th = 2 * Math.PI * i / N, r = orb.p / (1 + orb.e * Math.cos(th)), c = Math.cos(th), s = Math.sin(th);
    if (!isFinite(r) || r > 1e6) continue;
    out.push([r * (c * orb.u[0] + s * orb.v[0]), r * (c * orb.u[1] + s * orb.v[1]), r * (c * orb.u[2] + s * orb.v[2])]);
  }
  return out;
}
/**
 * the classical time-average of position over one period, by the area law dt ∝ r² dθ — a numerical check of
 * −(3/2)·a·e·K̂, kept independent of the closed form on purpose
 */
export function timeAveragedPosition(orb, N = 4000) {
  if (orb.isotropic || orb.e >= 1) return [0, 0, 0];
  let sx = 0, sy = 0, sz = 0, sw = 0;
  for (let i = 0; i < N; i++) {
    const th = 2 * Math.PI * (i + 0.5) / N, r = orb.p / (1 + orb.e * Math.cos(th)), w = r * r, c = Math.cos(th), s = Math.sin(th);
    sx += w * r * (c * orb.u[0] + s * orb.v[0]); sy += w * r * (c * orb.u[1] + s * orb.v[1]); sz += w * r * (c * orb.u[2] + s * orb.v[2]); sw += w;
  }
  return [sx / sw, sy / sw, sz / sw];
}
/** the orbits of every populated shell of a coefficient vector, with the shell's share of the norm */
export function keplerOrbits(re, im, minShare = 0.01) {
  let total = 0; for (let a = 0; a < re.length; a++) total += re[a] * re[a] + im[a] * im[a];
  const out = [];
  for (let n = 2; n <= 6; n++) {
    const M = shellMatrix(re, im, n);
    const share = total > 0 ? (M.norm2 || 0) / total : 0;
    if (share < minShare) continue;
    out.push({ share, orbit: keplerOrbit(n, rotorExpectations(M)) });
  }
  return out;
}
