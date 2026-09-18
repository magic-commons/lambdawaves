/* molecular-flow.js — THE CURRENT OF A MOLECULE (MOLECULAR WAVES stage 6; JUDGMENT.md §2, §4.3).
 *
 * A many-electron molecule has no single wavefunction in 3-D and so no `arg` to colour.  What it has is the
 * gauge-invariant carrier of phase: the probability current of its one-particle density matrix.  With the ONE
 * convention D_pq = ⟨a†_p a_q⟩ (proving/LEDGER.md Proposition 7 — the draft had p and q exchanged, which would have
 * drawn every ring current backwards, and no density view could have seen it),
 *
 *     ρ(r) = Σ_pq Re D_pq χ_p χ_q ,        j(r) = ½ Σ_pq Im D_pq (χ_p ∇χ_q − χ_q ∇χ_p) = Σ_pq Im D_pq χ_p ∇χ_q
 *
 * (Im D is antisymmetric).  For one orbital j = Im ψ̄∇ψ = ρ ∇arg ψ: the same quantity the phase colour encodes,
 * generalised.  v = j/ρ is the hydrodynamic velocity the tracers ride.
 *
 * WHAT IS NOT CLAIMED.  ∂ρ/∂t + ∇·j = 0 is exact in a complete basis and is VIOLATED in a finite one; the defect in
 * STO-3G is measured by tests/molecular-flow.test.mjs and reported, never asserted as an identity.  The tracers are
 * a reading of the current, not a claim that the molecule contains particles, and within one frame they ride a
 * frozen field (D(t) is rebuilt once a frame).
 */
import { evaluator, shellsFromField } from './molecular-field.js';

export function createFlow(fieldShellsList) {
  const ev = evaluator(shellsFromField(fieldShellsList)), n = ev.n;
  const v = new Float64Array(n), gx = new Float64Array(n), gy = new Float64Array(n), gz = new Float64Array(n);
  const P = [0, 0, 0], M = [0, 0, 0], out = { rho: 0, j: [0, 0, 0] };
  let Re = null, Im = null;
  const RHO_FLOOR = 1e-7;                                   // below this the velocity j/ρ is noise over nothing
  /** ρ and j at one point, into the shared record */
  function at(x, y, z) {
    P[0] = x; P[1] = y; P[2] = z; ev.aoGrad(P, v, gx, gy, gz);
    let rho = 0, jx = 0, jy = 0, jz = 0;
    for (let p = 0; p < n; p++) {
      const vp = v[p]; if (vp === 0) continue;
      const row = p * n; let u = 0, ax = 0, ay = 0, az = 0;
      for (let q = 0; q < n; q++) { u += Re[row + q] * v[q]; const m = Im[row + q]; if (m !== 0) { ax += m * gx[q]; ay += m * gy[q]; az += m * gz[q]; } }
      rho += vp * u; jx += vp * ax; jy += vp * ay; jz += vp * az;
    }
    out.rho = rho; out.j[0] = jx; out.j[1] = jy; out.j[2] = jz; return out;
  }
  function velocity(x, y, z, cap, o) {
    const s = at(x, y, z); if (!(s.rho > RHO_FLOOR)) return false;
    let vx = s.j[0] / s.rho, vy = s.j[1] / s.rho, vz = s.j[2] / s.rho; const sp = Math.hypot(vx, vy, vz);
    if (cap > 0 && sp > cap) { const k = cap / sp; vx *= k; vy *= k; vz *= k; }
    o[0] = vx; o[1] = vy; o[2] = vz; return true;
  }
  return {
    n, lifetime: 900, stride: 4,                             // the current is slow beside the beat: a trail point every 4th frame, a tracer reborn after ~15 s
    /** the frame's matrices: Re D_AO (symmetric, the whole density) and Im D_AO (antisymmetric) */
    set(re, im) { Re = re; Im = im; },
    get ready() { return !!(Re && Im); },
    at,
    /** the seeding weight: |j|, so the tracers are born where the current runs */
    weight(x, y, z) { if (!Re) return 0; const s = at(x, y, z); return Math.hypot(s.j[0], s.j[1], s.j[2]); },
    speed(p) { const s = at(p[0], p[1], p[2]); return s.rho > RHO_FLOOR ? Math.hypot(s.j[0], s.j[1], s.j[2]) / s.rho : 0; },
    /** one midpoint (RK2) step of length h along v = j/ρ, speed-capped; null where there is no density to carry a velocity */
    step(p, h, cap) {
      if (!Re || !velocity(p[0], p[1], p[2], cap, M)) return null;
      const mx = p[0] + 0.5 * h * M[0], my = p[1] + 0.5 * h * M[1], mz = p[2] + 0.5 * h * M[2];
      if (!velocity(mx, my, mz, cap, M)) return null;
      return [p[0] + h * M[0], p[1] + h * M[1], p[2] + h * M[2]];
    },
  };
}
