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
 * frozen field (D(t) is rebuilt once a frame): THE FROZEN-FRAME STEP ERROR and THE SPEED CAP (`step`'s `cap`) are covered by NO oracle.
 * BALANCED (0.6.2 H1): `setRepair(grid)` adds ρ∇φ to j, ∇φ the cards worker's face-flux repair (flow-balance.js) read trilinearly.
 * ENERGY REFERENCE AND KERNEL: none of its own; the TD-CIS pair density it reads is cited to PySCF's transition RDMs (proving/LEDGER.md, not in this tree) and no test here checks it; kernel W (tracers are lines from f64).
 */
import { evaluator, shellsFromField } from './molecular-field.js';

/** NACRE Round 1's oracle (RT-TDHF, 6-31+G*) as measured there, for the two molecules it ran */
export const FLOW_ORACLE = { C6H6: 'NACRE Round 1 measured, the RING: real-time check (6-31+G*): BALANCED 0.92 · AS COMPUTED 0.85', H2O: 'NACRE Round 1 measured, the bright line: real-time check (6-31+G*): AS COMPUTED 1.00 · BALANCED 0.92' };

export function createFlow(fieldShellsList, call = null) {
  const ev = evaluator(shellsFromField(fieldShellsList)), n = ev.n;
  const v = new Float64Array(n), gx = new Float64Array(n), gy = new Float64Array(n), gz = new Float64Array(n);
  const P = [0, 0, 0], M = [0, 0, 0], out = { rho: 0, j: [0, 0, 0] };
  let Re = null, Im = null, rep = null, mode = 'computed', busy = false, last = -1e9, info = null, steps = 0, refused = 0;
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
    if (rep) { const { N, half, gx: Gx, gy: Gy, gz: Gz } = rep, s = N / (2 * half), fx = (x + half) * s - 0.5, fy = (y + half) * s - 0.5, fz = (z + half) * s - 0.5, bx = Math.floor(fx), by = Math.floor(fy), bz = Math.floor(fz);
      for (let a = 0; a < 8; a++) { const i = bx + (a >> 2), j = by + (a >> 1 & 1), k = bz + (a & 1); if (i < 0 || j < 0 || k < 0 || i >= N || j >= N || k >= N) continue;
        const w = (a & 4 ? fx - bx : 1 - fx + bx) * (a & 2 ? fy - by : 1 - fy + by) * (a & 1 ? fz - bz : 1 - fz + bz) * rho, c = (i * N + j) * N + k;
        jx += w * Gx[c]; jy += w * Gy[c]; jz += w * Gz[c]; } }
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
      if (!Re) return null; steps++;
      if (!velocity(p[0], p[1], p[2], cap, M)) { refused++; return null; }
      const mx = p[0] + 0.5 * h * M[0], my = p[1] + 0.5 * h * M[1], mz = p[2] + 0.5 * h * M[2];
      if (!velocity(mx, my, mz, cap, M)) { refused++; return null; }
      return [p[0] + h * M[0], p[1] + h * M[1], p[2] + h * M[2]];
    },
    setRepair(grid) { rep = grid; }, get balanced() { return !!rep; },
    setSource(m) { mode = m === 'balanced' ? 'balanced' : 'computed'; if (mode === 'computed') rep = null; last = -1e9; },
    /** the worker road: one request in flight, the newest D wins, ≤ 8 Hz BALANCED (2 Hz AS COMPUTED, the defect alone); dot() → Re Ḋ_AO or null */
    pump(half, dot, done) {
      if (!call || busy || !Re || performance.now() - last < (mode === 'balanced' ? 125 : 500)) return;
      const dRe = dot(); if (!dRe) return;
      busy = true; last = performance.now(); const want = mode;
      Promise.resolve(call({ op: 'flow.balance', shells: fieldShellsList, half, Re, Im, dRe, solve: want === 'balanced' })).then((r) => {
        busy = false; if (!r || r.error) return;
        info = r; info.gated = steps ? refused / steps : 0; steps = refused = 0;
        rep = want === 'balanced' && mode === 'balanced' && r.gx ? r : null; if (done) done();
      }, () => { busy = false; });
    },
    /** the REPAIR and GATED readouts: [value, sub, value, sub] */
    said() {
      if (!info) return ['—', mode === 'balanced' ? 'BALANCED · solving' : 'AS COMPUTED', '—', ''];
      const g = [Math.round(100 * info.gated) + ' %', 'of tracer steps refused by the floor ρ > 1e-7'];
      return rep ? [(100 * info.kinetic).toFixed(1) + ' %', 'of the current’s kinetic energy · BALANCED · continuity closed on the grid · residual ' + info.residual.toExponential(1) + ' (relative)', ...g]
        : [info.defect.toFixed(2), 'the finite-basis defect ‖∂ρ/∂t + ∇·j‖/‖∂ρ/∂t‖ on the grid (not an identity in a finite basis)', ...g];
    },
  };
}
