/* pulse.js — W-PULSE: the RUN a hand can watch, over Astra's field-driven molecule (lab/modrive.js).
 *
 * modrive.js is the physics and nothing here re-derives it: i S ċ = (H₀ + E_z(t) Z) c in the LENGTH GAUGE with the
 * electron's charge −1, propagated by the exponential midpoint — S-unitary to the eigensolver's own roundoff,
 * EXACT within the finite LCAO space at a constant field, and SECOND ORDER in Δt for a field that moves.  This file
 * adds the four things an interface needs and a node proof can judge:
 *
 *   1. Ė(t) IN CLOSED FORM.  The absorbed energy is a work integral, and a work integral wants the field's own
 *      derivative, not a difference of two samples:
 *          E(t)  = A sin²(πu/D) cos(ωu + φ),                                   u = t − start, 0 < u < D
 *          Ė(t)  = A[ (π/D) sin(2πu/D) cos(ωu + φ) − ω sin²(πu/D) sin(ωu + φ) ]
 *      and both vanish at u = 0 and u = D, so the pulse is C¹ and the trapezoid below has nothing to trip on.
 *
 *   2. THE WORK BALANCE, ACCUMULATED AS THE RUN GOES.  With H = H₀ + E(t)z, d⟨H₀⟩/dt = −E(t) d⟨z⟩/dt, so
 *          ⟨H₀⟩(t) − ⟨H₀⟩(0)  =  ∫₀ᵗ Ė(s) ⟨z⟩(s) ds
 *      exactly, for the exact solution.  Both sides are computed here on the SAME discrete trace — the left by
 *      the propagator, the right by the trapezoid rule on the drive's own steps — so their DIFFERENCE is a
 *      measurement of the scheme rather than a restatement of it, and it is second order like everything else:
 *      5.40e-7 · 1.35e-7 · 3.38e-8 · 8.44e-9 at Δt = 0.05 · 0.025 · 0.0125 · 0.00625 (tests/pulse.test.mjs P4).
 *
 *   3. THE POPULATION THAT LEFT THE GROUND STATE, 1 − p₀, which is what the two-function basis calls popU and
 *      what a twelve-function one has no single name for.  The eigenbasis is the FIELD-FREE one at this R:
 *      "left the ground state" means left the state it started in, not left the instantaneous eigenvector.
 *
 *   4. THE RWA YARDSTICK for the two-level case, so a run has something to be wrong against.  For a resonant
 *      sin² envelope the Rabi angle is θ = A|d_gu|D/4 and p_u = sin²θ — 0.296 rad and 0.085256 for Astra's own
 *      pulse (A = 0.02, D = 48, d_gu = −1.2345933 at R = 2), against the exact 0.0852254.  A weak pulse.
 *
 * THE SCHEDULE.  A run is `duration` of pulse followed by `tail × duration` of free evolution, so the default
 * tail = 1 ends at t = 2D = 96 — the end of Astra's own reference trace, and the reason every number below can be
 * read off it.  Time is in ATOMIC UNITS and is the lab's own logical time offset from the moment of FIRE; this
 * file holds no wall clock and schedules nothing.
 *
 * STATUS.  The propagation is NUMERICAL (exponential midpoint, second order, S-unitary to 1e-13) of a VARIATIONAL
 * two-centre model with EXACT integrals; the closed forms in 1 and 4 are EXACT; the tail's length is a DESIGN
 * CHOICE.  Gate numbers: tests/pulse.test.mjs, against reference-drive.json (Astra's DOP853) — asserted, not
 * re-derived (research/MATH-MOLECULAR-PULSES-2026-09-05.md §2.6 C1).
 */
import { createMODrive, sin2Pulse } from './modrive.js';

/** the sin² pulse's own time derivative, in closed form — EXACT, and zero at both ends like the field itself */
export function sin2PulseRate({ amplitude, omega, duration, start = 0, phase = 0 }) {
  if (![amplitude, omega, duration, start, phase].every(Number.isFinite) || duration <= 0 || omega < 0)
    throw new Error('pulse: invalid pulse parameters');
  return (t) => {
    const u = t - start;
    if (u <= 0 || u >= duration) return 0;
    const s = Math.sin(Math.PI * u / duration), c = Math.cos(omega * u + phase);
    return amplitude * ((Math.PI / duration) * Math.sin(2 * Math.PI * u / duration) * c
      - omega * s * s * Math.sin(omega * u + phase));
  };
}

/**
 * ⟨i|z|j⟩ between two FIELD-FREE eigenvectors at this R — the transition dipole the RWA needs.  Z is
 * twocentre.js' quadrature (mo.basisAt(R).M.positionZ) and the eigenvectors are mo.solve(R)'s own columns.
 */
export function transitionDipole(mo, R, i = 0, j = 1) {
  const n = mo.n, { positionZ: Z } = mo.basisAt(R).M, C = mo.solve(R).C;
  if (!Z) throw new Error('pulse: positionZ matrix required');
  let v = 0;
  for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) v += C[a * n + i] * Z[a * n + b] * C[b * n + j];
  return v;
}

/**
 * THE ROTATING-WAVE YARDSTICK, for a two-level pair driven on resonance by a sin² envelope: the pulse's own
 * Rabi angle θ = ∫Ω/2 dt = A|d|D/4 and the population it predicts, sin²θ.  KNOWN (the standard RWA area
 * theorem); it is a yardstick and not a claim about the propagation, which carries no RWA anywhere.
 */
export function rabiRWA(mo, R, { amplitude, duration }, i = 0, j = 1) {
  const d = transitionDipole(mo, R, i, j), theta = Math.abs(amplitude * d * duration / 4);
  return { dipole: d, area: theta, population: Math.sin(theta) ** 2 };
}

/**
 * createPulseRun(mo, { R, pulse, dt, tail }) — one firing of the pulse, advanced by whoever owns the clock.
 *   advance(maxSteps)  step at most that many times, never past the end;  → this
 *   read()             the live numbers, cheap enough for a frame;
 *   trace              [{ t, field, popOut, z, absorbed }], decimated to ≈ 600 points however fine Δt is
 *   done               every scheduled step taken
 */
export function createPulseRun(mo, { R = 2, pulse, dt = 0.05, tail = 1 } = {}) {
  if (!(Number.isFinite(dt) && dt > 0)) throw new Error('pulse: dt must be positive');
  if (!(Number.isFinite(tail) && tail >= 0)) throw new Error('pulse: tail must be finite and not negative');
  const P = Object.assign({ start: 0, phase: 0 }, pulse);
  const field = sin2Pulse(P), rate = sin2PulseRate(P);
  const total = P.duration * (1 + tail), N = Math.max(1, Math.round(total / dt));
  const drive = createMODrive(mo, { R, field });
  const first = drive.observables(), E0 = first.electronic;
  let work = 0, zPrev = first.z, tPrev = drive.t, steps = 0;
  const every = Math.max(1, Math.round(N / 600)), trace = [];
  const point = (o) => ({ t: o.t, field: o.field, popOut: 1 - o.populations[0], z: o.z, absorbed: o.electronic - E0 });
  trace.push(point(first));
  function advance(maxSteps = 1) {
    let k = 0;
    while (k < maxSteps && steps < N) {
      drive.step(dt);
      const o = drive.observables();
      work += 0.5 * (rate(tPrev) * zPrev + rate(o.t) * o.z) * (o.t - tPrev);   // trapezoid on the drive's own steps
      zPrev = o.z; tPrev = o.t; steps++; k++;
      if (steps % every === 0 || steps === N) trace.push(point(o));
    }
    return self;
  }
  function read() {
    const o = drive.observables(), absorbed = o.electronic - E0;
    return { t: o.t, R, dt, steps, N, total, done: steps >= N, progress: steps / N,
      field: o.field, popGround: o.populations[0], popOut: 1 - o.populations[0], populations: o.populations,
      z: o.z, electronDipole: o.electronDipole, totalDipole: o.totalDipole,
      norm: o.norm, normDrift: o.normDrift, absorbed, work, balance: absorbed - work,
      electronic: o.electronic, fieldFreeTotal: o.fieldFreeTotal, instantaneousTotal: o.instantaneousTotal };
  }
  const self = { advance, read, drive, trace, pulse: P, get t() { return drive.t; }, get done() { return steps >= N; },
    get steps() { return steps; }, get N() { return N; }, get total() { return total; } };
  return self;
}
