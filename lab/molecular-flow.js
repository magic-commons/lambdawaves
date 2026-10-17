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
 * THE FACTORS (iteration 005 P2): `setFactors(w, re, im)` — ρ = Σ_a w_a |φ_a|², j = Σ_a w_a Im φ̄_a∇φ_a, O(n·K) a point; P1's packet is K = 1, w = 1.
 * THE FLOOR (P2): `setFloor(err, what)` — v = j/ρ only where ρ > max(1e-7, 10·err), err the measured error of the ρ the tracers read; `fade()` is a
 * trail point's alpha over the last decade above it, so a tracer dissolves into the floor instead of stopping dead.
 * ENERGY REFERENCE AND KERNEL: none of its own; the TD-CIS pair density it reads is cited to PySCF's transition RDMs (proving/LEDGER.md, not in this tree) and no test here checks it; kernel W (tracers are lines from f64).
 */
import { evaluator, shellsFromField } from './molecular-field.js';

/** NACRE Round 1's oracle (RT-TDHF, 6-31+G*) as measured there, for the two molecules it ran */
export const FLOW_ORACLE = { C6H6: 'NACRE Round 1 measured, the RING: real-time check (6-31+G*): BALANCED 0.92 · AS COMPUTED 0.85', H2O: 'NACRE Round 1 measured, the bright line: real-time check (6-31+G*): AS COMPUTED 1.00 · BALANCED 0.92' };

const FLOOR = 1e-7, ONE = Float64Array.of(1);
export function createFlow(fieldShellsList, call = null) {
  const ev = evaluator(shellsFromField(fieldShellsList)), n = ev.n;
  const v = new Float64Array(n), gx = new Float64Array(n), gy = new Float64Array(n), gz = new Float64Array(n);
  const P = [0, 0, 0], M = [0, 0, 0], out = { rho: 0, j: [0, 0, 0] };
  let Re = null, Im = null, fw = null, fr = null, fi = null, K = 0, rep = null, mode = 'computed', busy = false, last = -1e9, lastPlane = -1e9, info = null, steps = 0, refused = 0;
  let floor = FLOOR, floorWhy = 'f64', rhoSeen = 0, plane = null;          // below the floor the velocity j/ρ is noise over nothing; rhoSeen: the last ρ `velocity` read (the trail's fade)
  /** ρ and j at one point, into the shared record */
  function at(x, y, z) {
    P[0] = x; P[1] = y; P[2] = z; ev.aoGrad(P, v, gx, gy, gz);
    let rho = 0, jx = 0, jy = 0, jz = 0;
    if (fw) for (let f = 0, o = 0; f < K; f++, o += n) {   // THE FACTORS (P2; P1's DIRECT PACKET is K = 1): φ = R + iM and ∇φ in ONE O(n) pass each, ρ += w|φ|², j += w Im φ̄∇φ = w(R∇M − M∇R)
      let R = 0, M = 0, rx = 0, ry = 0, rz = 0, mx = 0, my = 0, mz = 0;
      for (let p = 0; p < n; p++) { const a = fr[o + p], b = fi[o + p], vp = v[p], X = gx[p], Y = gy[p], Z = gz[p]; R += a * vp; M += b * vp; rx += a * X; ry += a * Y; rz += a * Z; mx += b * X; my += b * Y; mz += b * Z; }
      const w = fw[f]; rho += w * (R * R + M * M); jx += w * (R * mx - M * rx); jy += w * (R * my - M * ry); jz += w * (R * mz - M * rz);
    } else for (let p = 0; p < n; p++) {
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
  function setFactors(ws, res, ims) { fw = ws; fr = res; fi = ims; K = ws.length; }
  function velocity(x, y, z, cap, o) {
    const s = at(x, y, z); rhoSeen = s.rho; if (!(s.rho > floor)) return false;
    let vx = s.j[0] / s.rho, vy = s.j[1] / s.rho, vz = s.j[2] / s.rho; const sp = Math.hypot(vx, vy, vz);
    if (cap > 0 && sp > cap) { const k = cap / sp; vx *= k; vy *= k; vz *= k; }
    o[0] = vx; o[1] = vy; o[2] = vz; return true;
  }
  return {
    n, lifetime: 900, stride: 4,                             // the current is slow beside the beat: a trail point every 4th frame, a tracer reborn after ~15 s
    /** the frame's matrices: Re D_AO (symmetric, the whole density) and Im D_AO (antisymmetric) */
    set(re, im) { Re = re; Im = im; fw = null; },
    /** or one packet ψ = Σ_μ (re_μ + i im_μ) χ_μ, f64 n-vectors: D_pq = ψ̄_p ψ_q without the n² expansion — the same ρ, j and convention */
    setPacket(re, im) { Re = Im = null; setFactors(ONE, re, im); },
    /** or K weighted factors, D_pq = Σ_a w_a φ̄_ap φ_aq (re/im a-major, K·n f64): they ride `at` while the matrices `set` stays for `pump` (the REPAIR road) */
    setFactors, get factors() { return fw ? K : 0; },
    /** THE CONTINUITY RECORD's last reading from the worker (continuityOn), or null */
    get plane() { return plane; },
    get ready() { return !!(Re && Im) || !!fw; },
    at,
    /** the seeding weight: |j|, so the tracers are born where the current runs */
    weight(x, y, z) { if (!Re && !fw) return 0; const s = at(x, y, z); return Math.hypot(s.j[0], s.j[1], s.j[2]); },
    speed(p) { const s = at(p[0], p[1], p[2]); return s.rho > floor ? Math.hypot(s.j[0], s.j[1], s.j[2]) / s.rho : 0; },
    /** the floor in force: max(1e-7, 10 × the measured error of the ρ the tracers read), and what measured it */
    setFloor(err, what) { floor = Math.max(FLOOR, 10 * (err || 0)); floorWhy = what || floorWhy; }, get floor() { return floor; },
    /** the last step's trail alpha: 0 at the floor, 1 a decade above it */
    fade() { return Math.min(1, Math.max(0, Math.log10(rhoSeen / floor))); },
    /** one midpoint (RK2) step of length h along v = j/ρ, speed-capped; null where there is no density to carry a velocity */
    step(p, h, cap) {
      if (!Re && !fw) return null; steps++;
      if (!velocity(p[0], p[1], p[2], cap, M)) { refused++; return null; }
      const mx = p[0] + 0.5 * h * M[0], my = p[1] + 0.5 * h * M[1], mz = p[2] + 0.5 * h * M[2];
      if (!velocity(mx, my, mz, cap, M)) { refused++; return null; }
      return [p[0] + h * M[0], p[1] + h * M[1], p[2] + h * M[2]];
    },
    setRepair(grid) { rep = grid; }, get balanced() { return !!rep; },
    setSource(m) { mode = m === 'balanced' ? 'balanced' : 'computed'; if (mode === 'computed') rep = null; last = -1e9; },
    /** the worker road: one request in flight, the newest D wins, ≤ 8 Hz BALANCED (2 Hz AS COMPUTED, the defect alone); dot() → Re Ḋ_AO or null */
    pump(half, dot, done, ask) {   // ask() → THE CONTINUITY RECORD's { pts, h, dt, F0, F1, nuclei } or null, asked at most every 450 ms (continuityOn, in the same worker call)
      if (!call || busy || !Re || performance.now() - last < (mode === 'balanced' ? 125 : 500)) return;
      const dRe = dot(); if (!dRe) return;
      busy = true; last = performance.now(); const want = mode, pl = ask && last - lastPlane > 450 ? ask() : null; if (pl) lastPlane = last;
      Promise.resolve(call({ op: 'flow.balance', shells: fieldShellsList, half, Re, Im, dRe, solve: want === 'balanced', ...(pl && { plane: pl }) })).then((r) => {
        busy = false; if (!r || r.error) return;
        info = r; info.gated = steps ? refused / steps : 0; steps = refused = 0; if (r.plane) plane = r.plane;
        rep = want === 'balanced' && mode === 'balanced' && r.gx ? r : null; if (done) done();
      }, () => { busy = false; });
    },
    /** the REPAIR and GATED readouts: [value, sub, value, sub] */
    said() {
      if (!info) return ['—', mode === 'balanced' ? 'BALANCED · solving' : 'AS COMPUTED', '—', ''];
      const g = [Math.round(100 * info.gated) + ' %', `of tracer steps refused by the floor ρ > ${+floor.toPrecision(2)} (${floorWhy}); a trail fades over the decade above it`];
      return rep ? [(100 * info.kinetic).toFixed(1) + ' %', 'of the current’s kinetic energy · BALANCED · continuity closed on the grid · residual ' + info.residual.toExponential(1) + ' (relative)', ...g]
        : [info.defect.toFixed(2), 'the finite-basis defect ‖∂ρ/∂t + ∇·j‖/‖∂ρ/∂t‖ on the grid (not an identity in a finite basis)', ...g];
    },
  };
}

/** THE CONTINUITY RECORD (iteration 005 P2), the worker's half: at M points (pts, 3M f64), ∂ρ/∂t = (ρ₁ − ρ₀)/Δt from two landings' factors and ∇·j by
 *  centred differences of the FULL 3-D j at p ± hê (x, y, z — the in-plane divergence alone would miss the normal derivative), j the mean of the two
 *  landings' so that it is centred in time with ∂ρ/∂t.  → { defect = ‖∂ρ/∂t + ∇·j‖₂ / ‖∂ρ/∂t‖₂, r (the residual at each point, f32), core, ms }.  In a complete
 *  basis the defect is 0; in a finite one it is not, and this is how far.  `core`: the share of the residual² within 0.3 a₀ of a nucleus (`nuclei`, 3 f64
 *  each) — on benzene STO-3G it is 90–99.8 %, which is why the number moves with where the sample passes (P2-BUILD.md). */
export function continuityOn({ shells, pts, h, dt, F0, F1, nuclei = [] }) {
  const t0 = performance.now(), A = createFlow(shells), B = createFlow(shells), M = pts.length / 3, r = new Float32Array(M), P = [0, 0, 0];
  A.setFactors(F0.w, F0.re, F0.im); B.setFactors(F1.w, F1.re, F1.im);
  const jq = (q) => 0.5 * (A.at(P[0], P[1], P[2]).j[q] + B.at(P[0], P[1], P[2]).j[q]);
  let num = 0, den = 0, near = 0;
  for (let k = 0; k < M; k++) {
    const x = pts[3 * k], y = pts[3 * k + 1], z = pts[3 * k + 2], dr = (B.at(x, y, z).rho - A.at(x, y, z).rho) / dt; let div = 0;
    for (let q = 0; q < 3; q++) { P[0] = x; P[1] = y; P[2] = z; P[q] += h; const up = jq(q); P[q] -= 2 * h; div += (up - jq(q)) / (2 * h); }
    r[k] = dr + div; num += (dr + div) ** 2; den += dr * dr;
    for (let a = 0; a < nuclei.length; a += 3) if ((x - nuclei[a]) ** 2 + (y - nuclei[a + 1]) ** 2 + (z - nuclei[a + 2]) ** 2 < 0.09) { near += (dr + div) ** 2; break; }
  }
  return { defect: den > 0 ? Math.sqrt(num / den) : NaN, r, M, core: num > 0 ? near / num : 0, ms: performance.now() - t0 };
}
