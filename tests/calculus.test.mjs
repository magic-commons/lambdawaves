/* tests/calculus.test.mjs — the node proof of the calculus engine: Ehrenfest's laws hold live within the register.
 *   node tests/calculus.test.mjs
 */
import { Register } from '../lab/state.js';
import { BASIS } from '../lab/hydrogen.js';
import { setHamiltonian } from '../lab/hamiltonian.js';
import { stats, forceZ, radialForce } from '../lab/calculus.js';
import { coherentAlongZ } from '../lab/qho.js';
import { angularDipoleZ, radialDipole } from '../lab/dynamics.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 320)));
}
const idx = (n, l, m) => BASIS.findIndex((s) => s.n === n && s.l === l && s.m === m);
{
  /* the dipole-acceleration identity on eigenstates: (E_a − E_b)² z_ab = ⟨a|∂V/∂z|b⟩ = Z·ang·∫R R′ dr — this is what makes Ehrenfest II exact within the register */
  setHamiltonian('hydrogen');
  const { angularDipoleZ, radialDipole } = await import('../lab/dynamics.js');
  const { energy } = await import('../lab/hydrogen.js');
  let worst = 0, where = null;
  for (const [a, b] of [[[1, 0, 0], [2, 1, 0]], [[2, 0, 0], [3, 1, 0]], [[3, 2, 1], [4, 1, 1]], [[2, 1, 0], [5, 2, 0]], [[3, 1, -1], [6, 2, -1]]]) {
    const ang = angularDipoleZ(a[1], a[2], b[1], b[2]), z = ang * radialDipole(a[0], a[1], b[0], b[1]), F = ang * radialForce(a[0], a[1], b[0], b[1]);
    const dE = energy(a[0]) - energy(b[0]);
    const d = Math.abs(dE * dE * z - F) / (Math.abs(F) + 1e-12);
    if (d > worst) { worst = d; where = [a, b, dE * dE * z, F]; }
  }
  judge('C the dipole-acceleration identity (E_a − E_b)²⟨a|z|b⟩ = ⟨a|z/r³|b⟩ holds between hydrogen eigenstates to 3e-6 (quadrature-limited: 1.2e-6 on the n = 6 pair with 12000 panels) — the identity that makes Ehrenfest II exact within the register', worst < 3e-6, { worst, where });
}
{
  /* a hydrogen superposition: Ehrenfest I and II live */
  setHamiltonian('hydrogen');
  const R = new Register(); R.clear();
  R.set(idx(1, 0, 0), 0.6, 0); R.set(idx(2, 1, 0), 0.5, 0.3); R.set(idx(3, 2, 0), 0.2, -0.4); R.set(idx(3, 1, 0), -0.3, 0.1); R.normalize();
  let worstI = 0, worstII = 0;
  for (const t of [0, 1.7, 5.3, 12.1]) {
    const S = stats(R, t), rz = S.rows[2], rp = S.rows[3];
    worstI = Math.max(worstI, Math.abs(rz.residual) / (Math.abs(rz.predicted) + 1e-3));
    worstII = Math.max(worstII, Math.abs(rp.residual) / (Math.abs(rp.predicted) + 1e-3));
    if (t === 0) judge('C conservation: d⟨ψ|ψ⟩/dt = 0 (1e-9) and ⟨H⟩ is the population-weighted energy', Math.abs(S.rows[0].residual) < 1e-9 && Math.abs(S.rows[0].value - 1) < 1e-12 && Math.abs(S.rows[1].value - R.energy()) < 1e-15, S.rows[0]);
  }
  judge('C EHRENFEST I, live: d⟨z⟩/dt (centred difference of the exact evolution, h = 1e-3) equals ⟨p_z⟩ (Heisenberg) on a four-state hydrogen superposition at four times, to 1e-5 relative', worstI < 1e-5, worstI);
  judge('C EHRENFEST II, live: d⟨p_z⟩/dt equals −⟨z/r³⟩ (the expected Coulomb force) on the same state at four times, to 1e-5 relative', worstII < 1e-5, worstII);
}
{
  /* the oscillator: Newton's law for the packet, d⟨p⟩/dt = −⟨z⟩, and ⟨z⟩(t) = k sin t exactly */
  setHamiltonian('qho');
  const R = new Register(); R.setEnergies((a) => BASIS[a] && (2 * (BASIS[a].n - BASIS[a].l - 1) + BASIS[a].l + 1.5)); R.clear();
  const cs = coherentAlongZ(0.5, { half: 6, G: 48 });
  for (let a = 0; a < 91; a++) if (cs.re[a] || cs.im[a]) R.set(a, cs.re[a], cs.im[a], 0);
  let worst = 0, worstZ = 0;
  for (const t of [0.3, 1.1, 2.4]) {
    const S = stats(R, t), rz = S.rows[2], rp = S.rows[3];
    worst = Math.max(worst, Math.abs(rz.residual), Math.abs(rp.residual));
    worstZ = Math.max(worstZ, Math.abs(rz.value - 0.5 * Math.sin(t)), Math.abs(rp.value - 0.5 * Math.cos(t)));
  }
  judge('C THE OSCILLATOR IS NEWTON: on the coherent state d⟨z⟩/dt = ⟨p_z⟩ and d⟨p_z⟩/dt = −⟨z⟩ to 1e-4, and ⟨z⟩ = k·sin t, ⟨p_z⟩ = k·cos t to 1e-4 — Ehrenfest exact for a quadratic Hamiltonian, read off the live table', worst < 1e-4 && worstZ < 1e-4, { worst, worstZ });
  setHamiltonian('hydrogen');
}
/* C6 — an external anchor: 1s + 2p₀ with equal real weights has ⟨z⟩(t) = z₁₂ cos(ΔE t), z₁₂ = 128√2/243, ΔE = 3/8,
   so ⟨p_z⟩ = −z₁₂ΔE sin(ΔE t) and d⟨p_z⟩/dt = −z₁₂ΔE² cos(ΔE t): hand-typed closed forms against the live table */
{
  setHamiltonian('hydrogen');
  const R = new Register(); R.clear(); R.set(idx(1, 0, 0), Math.SQRT1_2, 0); R.set(idx(2, 1, 0), Math.SQRT1_2, 0);
  const z12 = 128 * Math.SQRT2 / 243, dE = 3 / 8;
  let worst = 0;
  for (const t of [0.4, 1.3, 2.9]) {
    const S = stats(R, t), rz = S.rows[2], rp = S.rows[3];
    worst = Math.max(worst, Math.abs(rz.value - z12 * Math.cos(dE * t)), Math.abs(rp.value + z12 * dE * Math.sin(dE * t)), Math.abs(rp.derivative + z12 * dE * dE * Math.cos(dE * t)));
  }
  judge('C AN EXTERNAL ANCHOR (Round 11 C6): on (1s + 2p₀)/√2 the live table\'s ⟨z⟩, ⟨p_z⟩ and d⟨p_z⟩/dt equal the hand-typed closed forms z₁₂cos(3t/8), −(3/8)z₁₂sin(3t/8), −(9/64)z₁₂cos(3t/8) with z₁₂ = 128√2/243, at three times, to 1e-7', worst < 1e-7, worst);
}
/* C5 — THE WALL IS THE FORCE, EXACTLY (Round 11 §7.2): in the box, d⟨p_z⟩/dt equals the hard-wall pressure
   −½a²∮|∂_rψ|²cosθ dΩ; both are bilinear forms in the same exact matrix elements */
{
  setHamiltonian('well');
  const { wellPacket, setWellRadius, wellEnergy } = await import('../lab/well.js');
  const { wallForceZ } = await import('../lab/calculus.js');
  setWellRadius(10);
  const R = new Register(); R.setEnergies(wellEnergy); R.clear();
  const P = wellPacket([0, 0, -4], [0, 0, 0.8], 1.6);
  for (let a = 0; a < 91; a++) if (P.re[a] || P.im[a]) R.set(a, P.re[a], P.im[a], 0);
  const ids = R.populated();
  let worstExact = 0, worstFD = 0, peak = 0;
  for (const t of [0, 3, 10, 14, 20]) {
    const c = R.at(t);
    /* the register's own exact acceleration: −Σ Re(c_a*c_b)(E_a−E_b)² z_ab */
    let acc = 0, n2 = 0; for (const a of ids) n2 += c.re[a] ** 2 + c.im[a] ** 2;
    for (const a of ids) for (const b of ids) { const A = BASIS[a], B = BASIS[b], ang = angularDipoleZ(A.l, A.m, B.l, B.m); if (!ang) continue; const z = ang * radialDipole(A.n, A.l, B.n, B.l), dEab = wellEnergy(a) - wellEnergy(b); acc -= (c.re[a] * c.re[b] + c.im[a] * c.im[b]) * dEab * dEab * z; }
    acc /= n2;
    const wall = wallForceZ(c.re, c.im, ids);
    const S = stats(R, t);
    worstExact = Math.max(worstExact, Math.abs(acc - wall)); worstFD = Math.max(worstFD, Math.abs(S.rows[3].residual)); peak = Math.max(peak, Math.abs(wall));
  }
  judge('C IN THE BOX THE WALL IS THE FORCE, EXACTLY (Round 11 §7.2): on the gas packet at t = 0, 3, 10, 14 (at the wall), 20 the register\'s d⟨p_z⟩/dt = −ΣRe(c_a*c_b)(E_a−E_b)²z_ab equals the hard-wall pressure −½a²∮|∂_rψ|²cosθ dΩ to 1e-10 (two routes sharing nothing; this route is limited by the dipole quadrature at 1.4e-11 — Round 11\'s closed-form route reaches 4e-16), and the live table\'s centred-difference residual against it is below 1e-6', worstExact < 1e-10 && worstFD < 1e-6 && peak > 0.05, { worstExact, worstFD, peak });
  setHamiltonian('hydrogen');
}
console.log((FAILED ? 'RED' : 'GREEN') + ' calculus.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
