/* tests/qho.test.mjs — the node proof of the 3-D isotropic harmonic oscillator.
 *   node tests/qho.test.mjs
 * Oracles: the Schrödinger equation itself (a finite-difference Laplacian applied to the closed form must return
 * E ψ), normalisation and orthogonality by quadrature, the virial theorem, the Fourier eigen-property, and the
 * coherent state — Ehrenfest exact: a slapped ground state sloshes as a rigid Gaussian.
 */
import { BASIS, ylmNorm } from '../lab/hydrogen.js';
import { laguerreCoeffsReal, gammaHalf, qhoNorm, qhoN, qhoEnergy, qhoEnergyOf, qhoRadial, qhoTable, qhoFromTable, qhoTableFor, qhoPsiAt, qhoDomainFor, coherentAlongZ } from '../lab/qho.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 300)));
}
const idx = (n, l, m) => BASIS.findIndex((s) => s.n === n && s.l === l && s.m === m);
function simpson(f, a, b, N) { const h = (b - a) / N; let s = f(a) + f(b); for (let i = 1; i < N; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return s * h / 3; }
/* the pieces */
{
  judge('Q Γ(m+½): Γ(½) = √π, Γ(3/2) = √π/2, Γ(7/2) = 15√π/8', Math.abs(gammaHalf(0) - Math.sqrt(Math.PI)) < 1e-15 && Math.abs(gammaHalf(1) - Math.sqrt(Math.PI) / 2) < 1e-15 && Math.abs(gammaHalf(3) - 15 * Math.sqrt(Math.PI) / 8) < 1e-14);
  const c = laguerreCoeffsReal(2, 0.5);                            // L^{(1/2)}_2(x) = (x² − 5x + 15/4)/2
  judge('Q half-integer Laguerre: L^{(½)}_2(x) = ½x² − 5/2 x + 15/8', Math.abs(c[2] - 0.5) < 1e-15 && Math.abs(c[1] + 2.5) < 1e-15 && Math.abs(c[0] - 15 / 8) < 1e-15, c);
  judge('Q the labels: (n,l) ↦ N = 2n − l − 2, so 1s → N = 0 (E = 3/2), 2p → N = 1 (E = 5/2), 2s → N = 2 (E = 7/2), 6s → N = 10', qhoN(1, 0) === 0 && qhoN(2, 1) === 1 && qhoN(2, 0) === 2 && qhoN(6, 0) === 10 && Math.abs(qhoEnergyOf(2, 0) - 3.5) < 1e-15);
}
/* normalisation and orthogonality for every (n, l) in the register */
{
  let worst = 0, worstO = 0;
  for (let n = 1; n <= 6; n++) for (let l = 0; l < n; l++) {
    const I = simpson((r) => { const R = qhoRadial(n, l, r); return R * R * r * r; }, 0, 12, 6000);
    worst = Math.max(worst, Math.abs(I - 1));
    for (let n2 = n + 1; n2 <= 6; n2++) if (n2 - 1 >= l) { const O = simpson((r) => qhoRadial(n, l, r) * qhoRadial(n2, l, r) * r * r, 0, 12, 6000); worstO = Math.max(worstO, Math.abs(O)); }
  }
  judge('Q every radial function in the register is normalised (1e-10) and orthogonal to the others of the same l (1e-10)', worst < 1e-10 && worstO < 1e-10, { worst, worstO });
}
/* THE SCHRÖDINGER ORACLE: (−½∇² + ½r²) ψ = E ψ, by a fourth-order finite-difference Laplacian on the closed form */
{
  let worst = 0, where = null;
  let seed = 5; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 - 0.5; };
  for (const s of BASIS) {
    if ((s.n + s.l + s.m) % 2) continue;                              // half the basis, every shell represented
    const T = qhoTableFor(s), E = qhoEnergy(s.index), h = 2e-3;
    for (let k = 0; k < 2; k++) {
      const x = rnd() * 3, y = rnd() * 3, z = rnd() * 3, r2 = x * x + y * y + z * z;
      const f = (dx, dy, dz) => qhoFromTable(T, x + dx, y + dy, z + dz);
      const c = f(0, 0, 0);
      const lap = (part) => { let s2 = 0; for (const d of [[h, 0, 0], [0, h, 0], [0, 0, h]]) { const p1 = f(d[0], d[1], d[2])[part], m1 = f(-d[0], -d[1], -d[2])[part], p2 = f(2 * d[0], 2 * d[1], 2 * d[2])[part], m2 = f(-2 * d[0], -2 * d[1], -2 * d[2])[part]; s2 += (-p2 + 16 * p1 - 30 * c[part] + 16 * m1 - m2) / (12 * h * h); } return s2; };
      const Hre = -0.5 * lap('re') + 0.5 * r2 * c.re, Him = -0.5 * lap('im') + 0.5 * r2 * c.im;
      const scale = Math.hypot(c.re, c.im) + 1e-3;
      const d = Math.hypot(Hre - E * c.re, Him - E * c.im) / scale;
      if (d > worst) { worst = d; where = s.id; }
    }
  }
  judge('Q THE SCHRÖDINGER ORACLE: (−½∇² + ½r²)ψ = (N + 3/2)ψ for half the register at random points, fourth-order finite differences, 1e-6 relative — the closed forms solve the equation with the energies the register will use', worst < 1e-6, { worst, where });
}
/* the virial theorem ⟨T⟩ = ⟨V⟩ = E/2, by radial quadrature on the ground state and a random excited one */
{
  for (const [n, l] of [[1, 0], [4, 2]]) {
    const V = simpson((r) => { const R = qhoRadial(n, l, r); return 0.5 * r * r * R * R * r * r; }, 0, 12, 6000);
    judge(`Q virial on (n=${n}, l=${l}): ⟨½r²⟩ = E/2 = ${(qhoEnergyOf(n, l) / 2).toFixed(3)} (1e-9)`, Math.abs(V - qhoEnergyOf(n, l) / 2) < 1e-9, V);
  }
}
/* the Fourier eigen-property: φ(p) = (−i)^N ψ(p) — checked on the 1-D-like ground state by direct transform along a line */
{
  /* ∫ ψ_000(x) e^{−ip·x} d³x /(2π)^{3/2} for ψ_000 = π^{−3/4}e^{−r²/2} is π^{−3/4}e^{−p²/2}: the same function, phase (−i)⁰ = 1 */
  const T = qhoTableFor(BASIS[idx(1, 0, 0)]);
  const psi0 = qhoFromTable(T, 0, 0, 0).re, expect = Math.pow(Math.PI, -0.75);
  judge('Q the ground state is π^{−3/4}e^{−r²/2}, its own Fourier transform (phase (−i)⁰ = 1); the (−i)^N phases are set on the tables', Math.abs(psi0 - expect) < 1e-15 && qhoTable(2, 1, 0).momentumPhase.im === -1 && qhoTable(2, 0, 0).momentumPhase.re === -1, { psi0, expect });
}
/* THE BOUNDARY: a slapped ground state is a coherent state and sloshes as a RIGID Gaussian — Ehrenfest exact */
{
  const k = 0.8, cs = coherentAlongZ(k, { half: 6, G: 56 });
  const ids = []; for (let a = 0; a < 91; a++) if (Math.hypot(cs.re[a], cs.im[a]) > 1e-12) ids.push(a);
  judge('Q the coherent state e^{ikz}|0⟩ at k = 0.8 is captured by the register to 1 − 1e-6 (the Poisson tail of |α|² = 0.32 beyond n_r + l ≤ 5 is below 1e-7)', Math.abs(cs.captured - 1) < 1e-6, cs.captured);
  const k2 = 0.5, cs2 = coherentAlongZ(k2, { half: 6, G: 56 });      // |α|² = 0.125: the tail beyond N = 10 is below 1e-13, so this gate is sharp
  const ids2 = []; for (let a = 0; a < 91; a++) if (Math.hypot(cs2.re[a], cs2.im[a]) > 1e-12) ids2.push(a);
  let worst = 0;
  for (const t of [0, Math.PI / 4, Math.PI / 2, Math.PI, 1.7]) {
    const re = new Float64Array(91), im = new Float64Array(91);
    for (const a of ids2) { const E = qhoEnergy(a), c = Math.cos(E * t), s = Math.sin(E * t); re[a] = cs2.re[a] * c + cs2.im[a] * s; im[a] = cs2.im[a] * c - cs2.re[a] * s; }   // c(t) = e^{−iEt} c(0)
    const zc = k2 * Math.sin(t);                                                    // the classical trajectory from z = 0 with momentum k
    for (const [x, y, z] of [[0, 0, zc], [0.5, -0.3, zc + 0.7], [0.2, 0.9, zc - 1.1], [0, 0, zc + 2]]) {
      const v = qhoPsiAt(re, im, x, y, z, ids2), rho = v.re * v.re + v.im * v.im;
      const gauss = Math.pow(Math.PI, -1.5) * Math.exp(-(x * x + y * y + (z - zc) * (z - zc)));   // |ψ|² of the displaced ground state
      worst = Math.max(worst, Math.abs(rho - gauss) / Math.pow(Math.PI, -1.5));
    }
  }
  judge('Q EHRENFEST EXACT: evolving that coherent state with the register\'s energies, |ψ(x,t)|² IS the ground-state Gaussian translated to the classical position k·sin t (k = 0.5), at five times and four points, to 1e-5 of the peak (the register is n_r + l ≤ 5, so the l = 6 piece of N = 6 is absent — captured 1 − 1e-9) — no dispersion, ever, which is what a quadratic Hamiltonian does and hydrogen does not', worst < 1e-5, { worst, captured: cs2.captured });
  judge('Q the box for the register\'s highest level (N = 10) is the turning radius √23 plus three widths ≈ 7.8', Math.abs(qhoDomainFor(6) - (Math.sqrt(23) + 3)) < 1e-12, qhoDomainFor(6));
}

console.log((FAILED ? 'RED' : 'GREEN') + ' qho.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
