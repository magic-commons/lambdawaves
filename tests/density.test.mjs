import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createMO } from '../lab/mo.js';
import { createMODrive, sin2Pulse } from '../lab/modrive.js';
import { sBasis, sto3g1s, ZETA } from './lib/gaussian.js';
import { rhf } from '../lab/scf.js';
import { sto3gH2 } from '../lab/h2ci.js';
import { createRTHF, hermitianEigen, cmat, cmul, cadj, loewdin, sandwich, creal, unitaryOf, idempotencyDefect } from '../lab/density.js';
import { spectrum, peaks } from '../lab/absorb.js';

const close = (a, b, tol, what) => assert.ok(Math.abs(a - b) < tol, `${what}: ${a} vs ${b} (tol ${tol})`);
const ref = JSON.parse(readFileSync(new URL('../research/astra-2026-09-05/reference-drive.json', import.meta.url)));
const oracle = JSON.parse(readFileSync(new URL('../research/chronusq-2026-09-11/oracle-pyscf.json', import.meta.url)));

/* 1. The Hermitian eigensolver by realification: a random 5×5 Hermitian matrix, A V = V w, V†V = I. */
{
  const n = 5, A = cmat(n); let seed = 7; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648 - 0.5);
  for (let i = 0; i < n; i++) for (let j = i; j < n; j++) { const r = rnd(), m = i === j ? 0 : rnd(); A.re[i * n + j] = A.re[j * n + i] = r; A.im[i * n + j] = m; A.im[j * n + i] = -m; }
  A.re[0] = A.re[n + 1] = 0.3; A.im[1] = A.im[n] = 0;                          // a degenerate pair to exercise the cluster path
  const { w, V } = hermitianEigen(A), AV = cmul(A, V), VdV = cmul(cadj(V), V);
  for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { close(AV.re[i * n + k], w[k] * V.re[i * n + k], 1e-11, 'A V = V w (re)'); close(AV.im[i * n + k], w[k] * V.im[i * n + k], 1e-11, 'A V = V w (im)'); close(VdV.re[i * n + k], i === k ? 1 : 0, 1e-11, 'V†V re'); close(VdV.im[i * n + k], 0, 1e-11, 'V†V im'); }
  for (let k = 1; k < n; k++) assert.ok(w[k] >= w[k - 1], 'ascending');
  console.log('PASS Hermitian eigensolver (realification, degenerate cluster handled).');
}

/* 2. One electron: the density propagator equals modrive's coefficient propagator — exactly for a constant field,
      to O(Δt²) for the sin² pulse, with the Δt-halving ratio measured. */
{
  const mo = createMO({ kind: 'lcao1s' }), R = ref.R, M = mo.basisAt(R).M, n = 2;
  const c0 = mo.vector(mo.solve(R)), D0 = new Float64Array(4); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) D0[i * n + j] = c0[i] * c0[j];
  for (const field of [0.03, -0.02]) {
    const a = createMODrive(mo, { R, field: () => field }), b = createRTHF({ n, S: M.S, h: M.H, Z: M.positionZ, nElectrons: 1, D0, field: () => field, dt: 0.5 });
    for (let s = 0; s < 40; s++) { a.step(0.5); b.step(); }
    close(b.observables().z, a.observables().z, 1e-11, 'constant field ⟨z⟩'); close(b.observables().electrons, 1, 1e-12, 'Tr P'); close(b.observables().idempotency, 0, 1e-12, 'idempotency');
  }
  const pulse = sin2Pulse(ref.pulse), diffs = [];
  for (const dt of [0.1, 0.05, 0.025]) {
    const a = createMODrive(mo, { R, field: pulse }), b = createRTHF({ n, S: M.S, h: M.H, Z: M.positionZ, nElectrons: 1, D0, field: pulse, dt });
    let worst = 0; const steps = Math.round(ref.end / dt);
    for (let s = 0; s < steps; s++) { a.step(dt); b.step(); worst = Math.max(worst, Math.abs(a.observables().z - b.observables().z)); }
    diffs.push(worst);
  }
  assert.ok(diffs[0] / diffs[1] > 3.5 && diffs[1] / diffs[2] > 3.5, `Δt-halving ratios ${diffs[0] / diffs[1]}, ${diffs[1] / diffs[2]} should be ≈ 4`);
  assert.ok(diffs[1] < 1e-4, `midpoint vs endpoint-average at Δt = 0.05: ${diffs[1]} (both O(Δt²); Magnus-2 averages the endpoints, modrive takes the midpoint)`);
  console.log(`PASS one electron: constant field exact vs modrive; pulse |Δ⟨z⟩| = ${diffs.map((d) => d.toExponential(2))} for Δt = 0.1, 0.05, 0.025 (ratios ${(diffs[0] / diffs[1]).toFixed(2)}, ${(diffs[1] / diffs[2]).toFixed(2)}).`);
}

/* 3. Two electrons, RT-RHF for H₂ STO-3G at R = 1.4: invariants, energy/drift scaling, reversal, MMUT vs Magnus-2. */
const H = (z) => ({ z, Z: 1, ...sto3g1s(ZETA.H) }), R = 1.4, basis = sBasis([H(-R / 2), H(R / 2)]), scf = rhf(basis, { nElectrons: 2 });
{
  const pulse = sin2Pulse({ amplitude: 0.02, omega: 1.0, duration: 40 }), drifts = [], deposits = [], residues = [];
  for (const dt of [0.05, 0.025]) {
    const rt = createRTHF({ ...basis, nElectrons: 2, D0: scf.D, field: pulse, dt, nuclearDipole: basis.nuclearDipole });
    const E0 = rt.observables().fieldFreeTotal; close(E0, scf.energy, 1e-10, 'initial RT energy = SCF energy');
    const nPulse = Math.round(40 / dt), nFree = Math.round(10 / dt);
    for (let s = 0; s < nPulse; s++) rt.step();
    const o = rt.observables();
    close(o.electrons, 2, 1e-12, 'Tr(DS) = 2 after the pulse'); close(o.electronsIm, 0, 1e-12, 'Tr imaginary part'); close(o.idempotency, 0, 1e-11, 'single determinant stays idempotent');
    deposits.push(o.fieldFreeTotal - E0); assert.ok(o.fieldFreeTotal > E0 + 1e-6, 'the pulse deposited energy');
    let drift = 0; const after = o.fieldFreeTotal; for (let s = 0; s < nFree; s++) { rt.step(); drift = Math.max(drift, Math.abs(rt.observables().fieldFreeTotal - after)); }
    drifts.push(drift);
    for (let s = 0; s < nPulse + nFree; s++) rt.step(-dt);                       // back through the pulse
    const back = rt.D; residues.push(Math.max(...back.re.map((v, k) => Math.abs(v - scf.D[k])), ...back.im.map((v) => Math.abs(v))));
  }
  close(deposits[0], deposits[1], 1e-5, 'deposited energy converged in Δt');
  assert.ok(drifts[0] / drifts[1] > 3, `field-free energy drift must fall ≥ 4× per halving (measured ≈ 8: third order over a fixed window): ${drifts[0]} → ${drifts[1]}`);
  assert.ok(residues[0] / residues[1] > 3 && residues[1] < 1e-5, `time-reversal residue must fall ≈ 4× per halving: ${residues[0]} → ${residues[1]}`);
  const dt = 0.05, m1 = createRTHF({ ...basis, nElectrons: 2, D0: scf.D, field: pulse, dt, integrator: 'magnus2' }), m2 = createRTHF({ ...basis, nElectrons: 2, D0: scf.D, field: pulse, dt, integrator: 'mmut' });
  let gap = 0; for (let s = 0; s < 800; s++) { m1.step(); m2.step(); gap = Math.max(gap, Math.abs(m1.observables().z - m2.observables().z)); }
  assert.ok(gap < 1e-3, `MMUT vs Magnus-2 ⟨z⟩ differ by ${gap}`);
  console.log(`PASS RT-RHF H₂: deposited ${deposits[1].toExponential(4)}, field-free drift ${drifts.map((v) => v.toExponential(1))} (ratio ${(drifts[0] / drifts[1]).toFixed(2)}), reversal ${residues.map((v) => v.toExponential(1))} (ratio ${(residues[0] / residues[1]).toFixed(2)}), MMUT−Magnus ${gap.toExponential(2)}.`);
}

/* 4. Linear response: the δ-kick spectrum of RT-RHF peaks at the RPA (TDHF) singlet excitation, not at FCI's. */
{
  const n = 2, ci = sto3gH2(R), hM = ci.hMO, gM = ci.gMO, G = (i, j, k, l) => gM[((i * 2 + j) * 2 + k) * 2 + l];
  const eg = hM[0] + G(0, 0, 0, 0), eu = hM[3] + 2 * G(1, 1, 0, 0) - G(1, 0, 0, 1);                 // ε_p = h_pp + 2(pp|gg) − (pg|gp)
  const A = eu - eg + 2 * G(0, 1, 0, 1) - G(0, 0, 1, 1), B = G(0, 1, 0, 1), wRPA = Math.sqrt((A + B) * (A - B)), wTDA = A;
  const E1u = hM[0] + hM[3] + G(0, 0, 1, 1) + G(0, 1, 0, 1) + basis.Enuc, wFCI = E1u - ci.fci;         // ¹Σu⁺ is exact in this basis
  const { X } = loewdin(basis.S, n), Zt = sandwich(X, creal(basis.Z, n)), kappa = 1e-3, dt = 0.05, T = 2000, tau = 500;
  const kicked = createRTHF({ ...basis, nElectrons: 2, D0: scf.D, dt }).kick(kappa);
  assert.ok(idempotencyDefect(kicked.P, 2) < 1e-12, 'the kick keeps the determinant idempotent');
  { const Dk = kicked.D, again = createRTHF({ ...basis, nElectrons: 2, D0: Dk, dt });                    // a complex density round-trips
    close(again.observables().electronDipole, kicked.observables().electronDipole, 1e-13, 'complex D0 accepted'); }
  const steps = Math.round(T / dt), trace = new Float64Array(steps + 1); trace[0] = kicked.observables().electronDipole;
  for (let s = 1; s <= steps; s++) { kicked.step(); trace[s] = kicked.observables().electronDipole; }
  const spec = spectrum(trace, { dt, kappa, tau, wMin: 0.2, wMax: 2.0 }), pk = peaks(spec);
  assert.equal(pk.length, 1, 'one singlet excitation in the minimal basis');
  close(wRPA, oracle.H2.omega_rpa, 1e-8, 'the closed-form RPA gap vs PySCF TDHF'); close(wTDA, oracle.H2.omega_tda, 1e-8, 'TDA vs PySCF'); close(ci.fci, oracle.H2.E_fci[0], 1e-9, 'FCI ground vs PySCF'); close(E1u, oracle.H2.E_fci[2], 1e-9, '¹Σu vs PySCF');
  close(pk[0].omega, wRPA, 2e-4, 'RT-RHF kick peak = RPA excitation');
  assert.ok(Math.abs(pk[0].omega - wFCI) > 1e-2, `the peak must NOT be the FCI gap ${wFCI}`); assert.ok(Math.abs(pk[0].omega - wTDA) > 1e-3, `nor the TDA value ${wTDA}`);
  console.log(`PASS linear response: peak ${pk[0].omega.toFixed(6)} = ω_RPA ${wRPA.toFixed(6)} (TDA ${wTDA.toFixed(6)}, FCI ¹Σu ${wFCI.toFixed(6)}); ε = [${eg.toFixed(6)}, ${eu.toFixed(6)}].`);
}

/* 5. THE DEGENERATE HERMITIAN EIGENPROBLEM, at the multiplicities a molecule with symmetry actually produces
      (2026-09-18).  A realified 2n × 2n problem gives every eigenvalue twice, so a Hermitian eigenvalue of
      multiplicity p arrives with multiplicity 2p, and picking n independent COMPLEX vectors out of that is the
      whole of hermitianEigen.  Which orthonormal basis the real eigensolver returns for a cluster is arbitrary —
      cyclic Jacobi and Householder–QL return different ones — so the gate is that V is unitary and A V = V w for
      BOTH, on a matrix built from a known spectrum with multiplicities 4, 3, 2 and 1. */
{
  const n = 10, w0 = [-3, -3, -3, -3, -1, -1, -1, 0.5, 0.5, 2.25];
  let seed = 4242; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648 - 0.5);
  const U = cmat(n);                                                            // a random unitary by complex Gram–Schmidt
  for (let c = 0; c < n; c++) {
    const zr = new Float64Array(n), zi = new Float64Array(n);
    for (let i = 0; i < n; i++) { zr[i] = rnd(); zi[i] = rnd(); }
    for (let p = 0; p < c; p++) {
      let pr = 0, pi = 0;
      for (let i = 0; i < n; i++) { pr += U.re[i * n + p] * zr[i] + U.im[i * n + p] * zi[i]; pi += U.re[i * n + p] * zi[i] - U.im[i * n + p] * zr[i]; }
      for (let i = 0; i < n; i++) { zr[i] -= pr * U.re[i * n + p] - pi * U.im[i * n + p]; zi[i] -= pr * U.im[i * n + p] + pi * U.re[i * n + p]; }
    }
    let nn = 0; for (let i = 0; i < n; i++) nn += zr[i] ** 2 + zi[i] ** 2; nn = Math.sqrt(nn);
    for (let i = 0; i < n; i++) { U.re[i * n + c] = zr[i] / nn; U.im[i * n + c] = zi[i] / nn; }
  }
  const D = cmat(n); for (let k = 0; k < n; k++) D.re[k * n + k] = w0[k];
  const A = cmul(cmul(U, D), cadj(U));
  for (let i = 0; i < n; i++) for (let j = i; j < n; j++) {                      // symmetrise away the 1e-16 asymmetry
    const re = 0.5 * (A.re[i * n + j] + A.re[j * n + i]), im = 0.5 * (A.im[i * n + j] - A.im[j * n + i]);
    A.re[i * n + j] = re; A.re[j * n + i] = re; A.im[i * n + j] = im; A.im[j * n + i] = -im;
  }
  const { w, V } = hermitianEigen(A), AV = cmul(A, V), VdV = cmul(cadj(V), V);
  let dw = 0, res = 0, orth = 0;
  for (let k = 0; k < n; k++) dw = Math.max(dw, Math.abs(w[k] - w0[k]));
  for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) {
    res = Math.max(res, Math.abs(AV.re[i * n + k] - w[k] * V.re[i * n + k]), Math.abs(AV.im[i * n + k] - w[k] * V.im[i * n + k]));
    orth = Math.max(orth, Math.abs(VdV.re[i * n + k] - (i === k ? 1 : 0)), Math.abs(VdV.im[i * n + k]));
  }
  assert.ok(dw < 1e-13, `degenerate spectrum recovered: max|Δw| ${dw}`);
  assert.ok(res < 1e-13, `A V = V w on the degenerate problem: residual ${res}`);
  assert.ok(orth < 1e-13, `V†V = I on the degenerate problem: ${orth}`);
  /* and the propagator built from it is unitary, which is the property the whole RT path rests on */
  const Uf = unitaryOf(A, 0.37), G = cmul(Uf, cadj(Uf));
  let ud = 0;
  for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) ud = Math.max(ud, Math.abs(G.re[i * n + k] - (i === k ? 1 : 0)), Math.abs(G.im[i * n + k]));
  assert.ok(ud < 1e-13, `exp(−i dt A) is unitary to ${ud} on a spectrum with multiplicities 4, 3, 2, 1`);
  console.log(`PASS Hermitian eigenproblem with multiplicities 4·3·2·1: |Δw| ${dw.toExponential(2)}, residual ${res.toExponential(2)},`
    + ` V†V − I ${orth.toExponential(2)}, UU† − I ${ud.toExponential(2)}.`);
}
