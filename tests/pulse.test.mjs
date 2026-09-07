/* tests/pulse.test.mjs — the node proof of W-PULSE (ledger research/MATH-MOLECULAR-PULSES-2026-09-05.md §2.6 C1).
 *   node tests/pulse.test.mjs
 *
 * THE NUMBERS BELOW ARE THE OTHER LAB'S AND ARE ASSERTED, NOT RE-DERIVED.  Astra (GPT-6) wrote lab/modrive.js and
 * produced research/astra-2026-09-05/reference-drive.json — a closed-form 1s LCAO g/u pair integrated by SciPy's
 * DOP853 at rtol 3e-14, twenty-five samples from t = 0 to 96 — and Fable reproduced every one of them with an
 * independent RK4 at h = 1e-3 to 4.34e-13 (ledger §2.1 A12).  tests/modrive.test.mjs is Astra's own assert-style
 * suite over the same file and stays exactly as written; this one states each CONTRACT number as a judged line
 * with its tolerance, in the lab's format, and adds the two things lab/pulse.js puts on top of the drive: the
 * closed-form Ė(t) and the work balance it makes measurable.
 *
 * THE CLAIM THAT MATTERS is P3.  A driven-molecule card that runs but is not second order is not working, it is
 * merely moving: halving Δt must QUARTER the error, and the ratio is judged at 4.00 ± 0.05 rather than "about
 * four" — five levels of it are in the ledger, three are asserted here at the contract's own timesteps.
 */
import { readFileSync } from 'node:fs';
import { createMO } from '../lab/mo.js';
import { createMODrive, sin2Pulse } from '../lab/modrive.js';
import { createPulseRun, sin2PulseRate, transitionDipole, rabiRWA } from '../lab/pulse.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 460)));
}
const T0 = performance.now();
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const sig = (v, d = 8) => +v.toPrecision(d);

const ref = JSON.parse(readFileSync(new URL('../research/astra-2026-09-05/reference-drive.json', import.meta.url)));
const R = ref.R, PULSE = ref.pulse, LAST = ref.samples[ref.samples.length - 1];
const mo = createMO({ kind: 'lcao1s' });

/* ── P1  Ė(t) IS THE DERIVATIVE OF E(t), and the pulse is C¹ at both ends ─────────────────────────────────────── */
{
  const E = sin2Pulse(PULSE), Edot = sin2PulseRate(PULSE), h = 1e-6;
  let worst = 0, at = 0;
  for (let k = 1; k < 480; k++) {                                    // interior only: the endpoints are where a difference is one-sided
    const t = PULSE.duration * k / 480, d = (E(t + h) - E(t - h)) / (2 * h), e = Math.abs(d - Edot(t));
    if (e > worst) { worst = e; at = t; }
  }
  const ends = [E(0), E(PULSE.duration), Edot(0), Edot(PULSE.duration), E(-1), Edot(1e5)];
  judge('P1 Ė(t) IS THE CLOSED-FORM DERIVATIVE of the sin² pulse to 1e-8 at 479 interior points (central difference, h = 1e-6), and E and Ė are BOTH exactly zero at u = 0 and u = D and outside the window — the pulse is C¹, so the work integral below has no kink to straddle',
    worst < 1e-8 && ends.every((v) => v === 0),
    { maxDeviation: sig(worst, 3), at: sig(at, 6), ends, pulse: PULSE });
}

/* ── P2  THE LENGTH GAUGE'S SIGN IS kick.js'S (Δp = −∫E dt, charge −1) ────────────────────────────────────────── */
{
  const plus = createMODrive(mo, { R, field: () => 0.03 }).step(0.1).observables();
  const minus = createMODrive(mo, { R, field: () => -0.03 }).step(0.1).observables();
  judge('P2 THE FIELD SIGN IS THE LAB\'S OWN (kick.js: a sudden impulse is the delta-pulse Stark limit, Δp = −∫E dt, so the potential is +E z for a charge of −1): a static E = +0.03 held for 0.1 a.u. drives ⟨z⟩ NEGATIVE — the electron moves against the field — and reversing the field reverses ⟨z⟩ to the last bit, which is the linear response of a two-level system at this strength',
    plus.z < 0 && near(plus.z, -minus.z, 1e-14) && near(plus.norm, 1, 1e-12),
    { zPlus: sig(plus.z, 6), zMinus: sig(minus.z, 6), sum: sig(plus.z + minus.z, 3), norm: sig(plus.norm, 14) });
}

/* ── P3  ASTRA'S TRACE, AND THE SECOND ORDER THAT IS THE WHOLE CLAIM ──────────────────────────────────────────── */
{
  const run = createPulseRun(mo, { R, pulse: PULSE, dt: 0.05 });
  run.advance(1e7);
  const s = run.read();
  judge('P3a ASTRA\'S OWN TRACE, at Δt = 0.05 and t = 96: the population that left the ground state is 0.0852227 (±1e-6) and ⟨z⟩ is −0.0170653 (±1e-6), with the S-norm 1 to 1e-10 — the exponential midpoint is S-unitary by construction and carries no renormalisation anywhere',
    near(s.popOut, 0.0852227, 1e-6) && near(s.z, -0.0170653, 1e-6) && near(s.norm, 1, 1e-10) && s.done && near(s.t, 96, 1e-9),
    { popOut: sig(s.popOut, 9), astraPopU: LAST.popU, z: sig(s.z, 9), astraZ: LAST.z, norm: sig(s.norm, 14), t: sig(s.t, 10), steps: s.steps });

  /* the error is the WORST AO amplitude difference over Astra's 25 sample times — amplitudes, not populations:
     a population can be right while the phase is wrong, and the phase is what a second-order scheme is about */
  const errs = [];
  for (const dt of [0.2, 0.1, 0.05]) {
    const d = createMODrive(mo, { R, field: sin2Pulse(PULSE) });
    let worst = 0;
    for (const smp of ref.samples) {
      const count = Math.round((smp.t - d.t) / dt);
      for (let i = 0; i < count; i++) d.step(dt);
      const c = d.c;
      for (let k = 0; k < 2; k++) worst = Math.max(worst, Math.abs(c.re[k] - smp.re[k]), Math.abs(c.im[k] - smp.im[k]));
    }
    errs.push(worst);
  }
  const want = [9.2733e-5, 2.3185e-5, 5.7963e-6], ratios = [errs[0] / errs[1], errs[1] / errs[2]];
  judge('P3b SECOND ORDER, WHICH IS THE CLAIM THAT MATTERS: against Astra\'s DOP853 reference the worst AO amplitude error over the 25 sample times is 9.2733e-5 · 2.3185e-5 · 5.7963e-6 at Δt = 0.2 · 0.1 · 0.05 (each to 1e-4 of itself), and HALVING Δt QUARTERS IT — ratios 4.00 ± 0.05, twice. A pulse that runs without this is moving, not working',
    errs.every((e, i) => near(e, want[i], want[i] * 1e-4)) && ratios.every((r) => near(r, 4, 0.05)),
    { errors: errs.map((e) => sig(e, 5)), contract: want, ratios: ratios.map((r) => sig(r, 6)) });
}

/* ── P4  THE WORK BALANCE: ⟨H₀⟩(t) − ⟨H₀⟩(0) = ∫Ė⟨z⟩dt, on the run's OWN trace ─────────────────────────────────── */
{
  const rows = [], balances = [], raw = [];
  for (const dt of [0.05, 0.025, 0.0125, 0.00625]) {
    const run = createPulseRun(mo, { R, pulse: PULSE, dt });
    run.advance(1e7);
    const s = run.read();
    rows.push({ dt, absorbed: sig(s.absorbed, 9), work: sig(s.work, 9), balance: sig(s.balance, 3) });
    raw.push(s.absorbed); balances.push(Math.abs(s.balance));
  }
  const fine = rows[rows.length - 1], secondOrder = [0, 1, 2].map((i) => balances[i] / balances[i + 1]);
  /* THE ABSORBED ENERGY IS ITSELF SECOND ORDER IN Δt, so the raw number at any finite step is NOT the oracle's:
     3.34865257e-2 at Δt = 0.00625 sits 1.4e-8 BELOW Astra's 3.348654e-2, and that gap is the propagator's own
     remaining error, not a disagreement.  Richardson on the last two steps (A + (A(h/2) − A(h))/3, the exact
     correction for a second-order scheme) removes it and lands on the oracle to 2.1e-9, which is one unit in the
     last digit the ledger quotes it to — the honest way
     to state a limit from a convergent sequence, rather than widening a tolerance until the raw value fits. */
  const A2 = raw[2], A1 = raw[3], richardson = A1 + (A1 - A2) / 3;
  judge('P4 THE ABSORBED ENERGY IS A WORK INTEGRAL, and it closes: with H = H₀ + E(t)z the identity ⟨H₀⟩(t) − ⟨H₀⟩(0) = ∫₀ᵗ Ė⟨z⟩dt is exact, and computed on the run\'s OWN discrete trace (the left side by the propagator, the right by the trapezoid on the same steps) the two agree to 8.4e-9 at Δt = 0.00625 — inside the contract\'s ±1e-8 — with the residue SECOND ORDER like everything else (5.40e-7 · 1.35e-7 · 3.38e-8 · 8.44e-9, ratios 4.00 down the ladder), which is what makes it a measurement of the scheme rather than a restatement of it. The VALUE is 3.34865257e-2 hartree at that step and its own Richardson limit is 3.3486542e-2 = the ledger\'s 3.3487e-2, matching the oracle\'s 3.348654e-2 to 1e-9; the raw number is 1.4e-8 under it because the absorbed energy converges at the same second order as everything else and is stated as a limit, not stretched to fit',
    Math.abs(fine.balance) < 1e-8 && near(richardson, 3.348654e-2, 5e-9) && near(fine.absorbed, 3.348654e-2, 2e-8)
      && secondOrder.every((r) => near(r, 4, 0.15)),
    { rows, ratios: secondOrder.map((r) => sig(r, 5)), richardson: sig(richardson, 9), oracle: 3.348654e-2, ledger: 3.3487e-2 });
}

/* ── P5  THE STURMIAN n ≤ 3 RUN: twelve functions, g and u coupled, still S-unitary ───────────────────────────── */
{
  const big = createMO({ kind: 'sturmian', nMax: 3 });
  const d = createMODrive(big, { R: 2, field: sin2Pulse(PULSE) });
  for (let k = 0; k < 160; k++) d.step(0.2);
  const o = d.observables(), out = 1 - o.populations[0];
  judge('P5 THE STURMIAN n ≤ 3 BASIS — twelve σ functions on two centres, whose g and u blocks the field couples at every step — STAYS S-UNITARY TO 2e-10 over 160 steps of Δt = 0.2 (measured 1.4e-14, four orders inside it), with real population out of the ground state and more than one excited channel carrying it. The contract\'s second basis, and the reason the drive solves the FULL matrix rather than a parity block',
    big.n === 12 && near(o.norm, 1, 2e-10) && out > 1e-6 && o.populations.slice(1).filter((v) => v > 1e-9).length >= 2,
    { n: big.n, norm: sig(o.norm, 14), normDrift: sig(o.norm - 1, 3), outOfGround: sig(out, 7),
      channels: Array.from(o.populations.slice(1, 5), (v) => sig(v, 4)) });
}

/* ── P6  THE RWA YARDSTICK, and the transition dipole it is built on ──────────────────────────────────────────── */
{
  const d = transitionDipole(mo, R, 0, 1), y = rabiRWA(mo, R, PULSE);
  const run = createPulseRun(mo, { R, pulse: PULSE, dt: 0.0125 });
  run.advance(1e7);
  const exact = run.read().popOut;
  judge('P6 THE PULSE IS WEAK, AND THE RWA SAYS SO: ⟨g|z|u⟩ = −1.23459330 at R = 2 reproduces Astra\'s own dipoleGU to 1e-12 from the lab\'s two-centre quadrature and its eigenvectors; the sin² envelope\'s Rabi angle is A|d|D/4 = 0.29630 rad and sin² of it is 0.085256, against the exactly propagated 0.0852252 — 3e-5 apart, which is the rotating-wave approximation\'s own error at this area and not the propagator\'s',
    near(d, ref.dipoleGU, 1e-12) && near(y.area, 0.29630, 1e-5) && near(y.population, 0.085256, 1e-6) && near(y.population, exact, 1e-4),
    { dipole: sig(d, 12), astra: ref.dipoleGU, area: sig(y.area, 8), rwaPopulation: sig(y.population, 8), exact: sig(exact, 8), difference: sig(y.population - exact, 3) });
}

/* ── P7  THE RUN'S OWN LAWS: the schedule, the decimated trace, and what it refuses ───────────────────────────── */
{
  const run = createPulseRun(mo, { R, pulse: PULSE, dt: 0.05 });
  const partial = run.advance(400).read();
  const traceMid = run.trace.length;
  run.advance(1e7);
  const s = run.read(), tr = run.trace;
  const monotone = tr.every((p, i) => i === 0 || p.t > tr[i - 1].t);
  const zeroTail = tr.filter((p) => p.t > PULSE.duration + 1e-9).every((p) => p.field === 0);
  let throws = 0;
  for (const f of [() => createPulseRun(mo, { R, pulse: PULSE, dt: 0 }), () => createPulseRun(mo, { R, pulse: PULSE, dt: -0.1 }),
    () => createPulseRun(mo, { R, pulse: PULSE, tail: -1 }), () => sin2PulseRate({ amplitude: 1, omega: 1, duration: 0 }),
    () => createPulseRun(mo, { R: 0, pulse: PULSE })]) { try { f(); } catch (_) { throws++; } }
  judge('P7 THE RUN IS A SCHEDULE AND NOT A LOOP: duration of pulse then an equal tail of free evolution, so the default run ends at t = 2D = 96 — Astra\'s own end — in exactly N = round(total/Δt) steps, refusing to go one past it however many are asked for; the trace is DECIMATED to ≈ 600 points however fine Δt is (so a 15 360-step run costs the same to draw as a 1 920-step one), strictly increasing in t, and carries a field that is exactly zero through the whole tail. Five malformed constructions throw rather than run: Δt = 0, Δt < 0, a negative tail, a zero-duration pulse and R = 0',
    partial.steps === 400 && !partial.done && s.steps === s.N && s.done && near(s.t, 96, 1e-9)
      && tr.length > 400 && tr.length < 900 && traceMid > 5 && monotone && zeroTail && throws === 5,
    { N: s.N, total: s.total, tracePoints: tr.length, atStep400: { t: sig(partial.t, 6), points: traceMid }, throws });
}

console.log((FAILED ? 'RED   ' : 'GREEN ') + `pulse: ${TOTAL - FAILED}/${TOTAL} · ${((performance.now() - T0) / 1000).toFixed(2)} s`);
process.exit(FAILED ? 1 : 0);
