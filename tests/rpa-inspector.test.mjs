import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { rpa } from '../lab/rpa-inspector.js';
import { sBasis, sto3g1s, ZETA } from './lib/gaussian.js';
import { rhf } from '../lab/scf.js';

const close = (a, b, tol, what) => assert.ok(Math.abs(a - b) < tol, `${what}: ${a} vs ${b} (tol ${tol})`);
const fx = JSON.parse(readFileSync(new URL('./fixtures/h2o-response.json', import.meta.url)));
const h2 = JSON.parse(readFileSync(new URL('../research/chronusq-2026-09-11/oracle-pyscf.json', import.meta.url)));

/* 1. H₂O STO-3G: the ten singlet roots, oscillator strengths and transition dipoles against PySCF TDHF/TDA. */
{
  const r = rpa({ S: fx.S, h: fx.h, eri: fx.eri, X: fx.dipole.x, Y: fx.dipole.y, Z: fx.dipole.z, C: fx.C, eps: fx.eps, nocc: fx.nocc });
  assert.equal(r.roots.length, fx.nocc * (fx.n - fx.nocc), 'one root per occupied–virtual pair');
  assert.equal(r.A.length, 100); assert.equal(r.B.length, 100);
  assert.ok(r.orthonormality < 1e-12, `CᵀSC = I to ${r.orthonormality}`);
  assert.ok(r.scfResidual < 1e-8, `the fixture reference satisfies F C = S C ε to ${r.scfResidual}`);
  let wRPA = 0, wTDA = 0, wF = 0, wFT = 0, wMu = 0;
  for (let k = 0; k < 10; k++) {
    const o = r.roots[k];
    if (k) assert.ok(o.omega > r.roots[k - 1].omega, 'roots ascending');
    wRPA = Math.max(wRPA, Math.abs(o.omega - fx.rpa.roots[k]));
    wTDA = Math.max(wTDA, Math.abs(o.omegaTDA - fx.tda.roots[k]));
    wF = Math.max(wF, Math.abs(o.f - fx.rpa.f[k]));
    wFT = Math.max(wFT, Math.abs(o.fTDA - fx.tda.f[k]));
    for (let q = 0; q < 3; q++) wMu = Math.max(wMu, Math.abs(Math.abs(o.mu[q]) - Math.abs(fx.rpa.mu[k][q])));
    close(o.f, (2 / 3) * o.omega * o.mu.reduce((s, v) => s + v * v, 0), 1e-15, `f = (2/3) ω |μ|² for root ${k + 1}`);
    let xx = 0, yy = 0; for (let p = 0; p < o.X.length; p++) { xx += o.X[p] ** 2; yy += o.Y[p] ** 2; }
    close(xx - yy, 1, 1e-11, `left/right normalisation XᵀX − YᵀY = 1 for root ${k + 1}`);
    assert.ok(yy > 0, `root ${k + 1} has a non-zero de-excitation amplitude (RPA is not TDA)`);
  }
  assert.ok(wRPA < 1e-9, `ten RPA roots vs PySCF TDHF: worst ${wRPA}`);
  assert.ok(wTDA < 1e-9, `ten TDA roots vs PySCF TDA: worst ${wTDA}`);
  assert.ok(wF < 1e-8, `RPA oscillator strengths: worst ${wF}`);
  assert.ok(wFT < 1e-8, `TDA oscillator strengths: worst ${wFT}`);
  assert.ok(wMu < 1e-8, `RPA transition dipoles (per axis, sign-free): worst ${wMu}`);
  close(r.roots[0].omega, 0.483101392, 5e-10, 'first RPA root');
  close(r.roots[0].omegaTDA, 0.484640212, 5e-10, 'first TDA root');
  /* the selection rules: one x line, four y, four z, one dark root, no x-polarised core line */
  const bright = [0, 0, 0];
  for (const o of r.roots) for (let q = 0; q < 3; q++) if (o.mu[q] ** 2 > 1e-12) bright[q]++;
  assert.deepEqual(bright, [1, 4, 4], `bright-line count per polarisation ${bright}`);
  const dark = Math.max(...r.roots[1].mu.map((v) => v * v));
  assert.ok(dark < 1e-20, `the dark root at ${r.roots[1].omega} has |μ|² = ${dark}`);
  const core = [r.roots[8].mu[0] ** 2, r.roots[9].mu[0] ** 2];
  assert.ok(Math.max(...core) < 1e-12, `x-polarised O 1s strengths ${core}`);
  /* the inspector's click payload: the dominant amplitudes name the pair the oracle's assignment expects */
  assert.equal(r.roots[8].dominant[0].i, 0, 'the 20.107 line is an O 1s excitation');
  assert.equal(r.roots[9].dominant[0].i, 0, 'the 20.157 line is an O 1s excitation');
  assert.equal(r.roots[0].dominant[0].i, 4, 'the first line is out of the HOMO');
  console.log(`PASS RPA inspector H₂O/STO-3G: ten roots to ${wRPA.toExponential(2)} (TDA ${wTDA.toExponential(2)}), f to ${wF.toExponential(2)}, |μ_q| to ${wMu.toExponential(2)};`
    + ` first pair ${r.roots[0].omega.toFixed(9)}/${r.roots[0].omegaTDA.toFixed(9)}; bright 1/4/4; dark |μ|² ${dark.toExponential(2)}; x-core ${core.map((v) => v.toExponential(2)).join(', ')}.`);
}

/* 2. H₂ STO-3G at R = 1.4: the two-level closed form ω² = (Δε + 2K − J)² − K², and PySCF's TDHF/TDA. */
{
  const H = (z) => ({ z, Z: 1, ...sto3g1s(ZETA.H) }), R = 1.4, basis = sBasis([H(-R / 2), H(R / 2)]), n = 2;
  const scf = rhf(basis, { nElectrons: 2, tol: 1e-12 }), zero = new Float64Array(n * n);
  const r = rpa({ S: basis.S, h: basis.h, eri: basis.eri, X: zero, Y: zero, Z: basis.Z, C: scf.C, eps: scf.orbitalEnergies, nocc: 1 });
  const C = scf.C, moEri = (p, q, s, t) => { let v = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) for (let l = 0; l < n; l++)
      v += C[i * n + p] * C[j * n + q] * C[k * n + s] * C[l * n + t] * basis.eri[((i * n + j) * n + k) * n + l];
    return v; };
  const de = scf.orbitalEnergies[1] - scf.orbitalEnergies[0], K = moEri(0, 1, 0, 1), J = moEri(0, 0, 1, 1);
  const A = de + 2 * K - J, w = Math.sqrt(A * A - K * K);
  assert.equal(r.roots.length, 1, 'one occupied–virtual pair in the minimal basis');
  close(r.A[0], A, 1e-14, 'the 1×1 A block'); close(r.B[0], K, 1e-14, 'the 1×1 B block');
  close(K, h2.H2.gu_gu, 1e-12, '(σg σu|σg σu) vs PySCF');
  close(r.roots[0].omega, w, 1e-12, 'RPA root vs the closed form √((Δε+2K−J)² − K²)');
  close(r.roots[0].omegaTDA, A, 1e-12, 'TDA root vs the closed form Δε + 2K − J');
  close(r.roots[0].omega, h2.H2.omega_rpa, 1e-10, 'RPA root vs PySCF TDHF');
  close(r.roots[0].omegaTDA, h2.H2.omega_tda, 1e-10, 'TDA root vs PySCF TDA');
  close(r.roots[0].mu[0], 0, 1e-15, 'no x transition dipole for centres on the z axis');
  close(r.roots[0].mu[1], 0, 1e-15, 'no y transition dipole for centres on the z axis');
  assert.ok(r.roots[0].mu[2] ** 2 > 1, 'the ¹Σu⁺ line is z-polarised and bright');
  console.log(`PASS RPA inspector H₂/STO-3G: ω_RPA ${r.roots[0].omega.toFixed(12)} = closed form to ${Math.abs(r.roots[0].omega - w).toExponential(2)},`
    + ` ω_TDA ${r.roots[0].omegaTDA.toFixed(12)} to ${Math.abs(r.roots[0].omegaTDA - A).toExponential(2)}; vs PySCF ${Math.abs(r.roots[0].omega - h2.H2.omega_rpa).toExponential(2)}.`);
}

/* 3. The refusals: a mismatched reference and a truncated tensor must throw, not return a number. */
{
  const bad = Float64Array.from(fx.C); bad[0] += 0.3;
  assert.throws(() => rpa({ S: fx.S, h: fx.h, eri: fx.eri, X: fx.dipole.x, Y: fx.dipole.y, Z: fx.dipole.z, C: bad, eps: fx.eps, nocc: fx.nocc }), /CᵀSC/, 'a non-orthonormal C is refused');
  assert.throws(() => rpa({ S: fx.S, h: fx.h, eri: fx.eri.slice(0, 100), X: fx.dipole.x, Y: fx.dipole.y, Z: fx.dipole.z, C: fx.C, eps: fx.eps, nocc: fx.nocc }), /n⁴/, 'a truncated ERI tensor is refused');
  assert.throws(() => rpa({ S: fx.S, h: fx.h, eri: fx.eri, X: fx.dipole.x, Y: fx.dipole.y, Z: fx.dipole.z, C: fx.C, eps: fx.eps, nocc: 7 }), /nocc/, 'nocc = n is refused');
  console.log('PASS RPA inspector refusals: non-orthonormal C, truncated ERI, nocc = n.');
}
