/* tests/molecular-flow.test.mjs — FLOW (MOLECULAR WAVES stage 6): the current of a molecule, in node.
 *
 *   §1  ∇χ: the evaluator's analytic AO gradients against central differences of its own values
 *   §2  THE SIGN (proving/LEDGER.md Proposition 7): for ONE orbital ψ = (φ_a + iφ_b)/√2 on benzene's degenerate HOMO
 *       pair, j = Σ Im D_pq χ_p ∇χ_q with D_pq = c̄_p c_q equals the elementary Im ψ̄∇ψ — the convention that, exchanged,
 *       draws every ring current backwards while every density view stays silent
 *   §3  the RING's sense: the electrons circulate the way the dipole turns, the other quarter turn reverses both,
 *       and a linear slosh carries no angular momentum at all
 *   §4  THE CONTINUITY DEFECT, measured and reported, never asserted as an identity: ∂ρ/∂t + ∇·j is zero in a complete
 *       basis and is not in STO-3G (JUDGMENT.md §8.2)
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chemRegister, chemGround, chemStates, chemStateVectors } from '../lab/mathworker.js';
import { moleculeAtoms } from '../lab/molecules.js';
import { evaluator, shellsFromField } from '../lab/molecular-field.js';
import { createFlow } from '../lab/molecular-flow.js';
import { GROUND, createStatesModel, presetLanes } from '../lab/molecular-register.js';
import { moleculeRHF } from '../lab/rhf-molecule.js';
import { createRTHF } from '../lab/density.js';
import { fieldShells } from '../lab/molecular-field.js';

chemRegister('sto-3g', JSON.parse(fs.readFileSync(new URL('../lab/vendor/bse/sto-3g-v1.json', import.meta.url), 'utf8')));
const msg = { atoms: moleculeAtoms('C6H6'), basis: 'sto-3g', charge: 0 }, g = chemGround(msg), st = chemStates(msg), n = st.n, nocc = st.nocc;
let seed = 7; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32 - 0.5;

/* ── §1 ─────────────────────────────────────────────────────────────────────────────────────────────────── */
const ev = evaluator(shellsFromField(g.shells));
{
  const v = new Float64Array(n), gx = new Float64Array(n), gy = new Float64Array(n), gz = new Float64Array(n), h = 1e-5; let worst = 0, scale = 0;
  for (let k = 0; k < 40; k++) {
    const p = [6 * rnd(), 6 * rnd(), 3 * rnd()]; ev.aoGrad(p, v, gx, gy, gz);
    const G = [gx, gy, gz];
    for (let q = 0; q < 3; q++) {
      const a = p.slice(), b = p.slice(); a[q] += h; b[q] -= h; const va = ev.ao(a), vb = ev.ao(b);
      for (let i = 0; i < n; i++) { worst = Math.max(worst, Math.abs((va[i] - vb[i]) / (2 * h) - G[q][i])); scale = Math.max(scale, Math.abs(G[q][i])); }
    }
    const v0 = ev.ao(p); for (let i = 0; i < n; i++) assert(Math.abs(v0[i] - v[i]) < 1e-15);
  }
  assert(worst < 1e-8 * Math.max(1, scale), `AO gradient vs central differences: ${worst} on a scale of ${scale}`);
  console.log(`PASS ∇χ: 36 AOs × 3 axes × 40 points agree with central differences to ${worst.toExponential(1)} (scale ${scale.toFixed(2)}); the values are the evaluator's own.`);
}

/* ── §2 · the sign ──────────────────────────────────────────────────────────────────────────────────────── */
const flow = createFlow(g.shells);
const toAO = (M) => { const half = new Float64Array(n * n), out = new Float64Array(n * n), C = g.C;
  for (let u = 0; u < n; u++) for (let q = 0; q < n; q++) { let s = 0; for (let p = 0; p < n; p++) s += C[u * n + p] * M[p * n + q]; half[u * n + q] = s; }
  for (let u = 0; u < n; u++) for (let w = 0; w < n; w++) { let s = 0; for (let q = 0; q < n; q++) s += half[u * n + q] * C[w * n + q]; out[u * n + w] = s; } return out; };
{
  const a = nocc - 2, b = nocc - 1; assert(Math.abs(g.eps[a] - g.eps[b]) < 1e-8, 'benzene’s HOMO is a degenerate pair');
  const re = new Float64Array(n * n), im = new Float64Array(n * n);
  re[a * n + a] = re[b * n + b] = 0.5; im[a * n + b] = 0.5; im[b * n + a] = -0.5;   // D_pq = c̄_p c_q, c_a = 1/√2, c_b = i/√2
  flow.set(toAO(re), toAO(im));
  const v = new Float64Array(n), gx = new Float64Array(n), gy = new Float64Array(n), gz = new Float64Array(n); let worst = 0, peak = 0, worstRho = 0;
  for (let k = 0; k < 60; k++) {
    const th = 2 * Math.PI * k / 60, p = [2.2 * Math.cos(th), 2.2 * Math.sin(th), 0.9];
    ev.aoGrad(p, v, gx, gy, gz);
    const phi = (m, arr) => { let s = 0; for (let i = 0; i < n; i++) s += g.C[i * n + m] * arr[i]; return s; };
    const pa = phi(a, v), pb = phi(b, v), direct = [gx, gy, gz].map((G) => 0.5 * (pa * phi(b, G) - pb * phi(a, G))), s = flow.at(p[0], p[1], p[2]);   // Im ψ̄∇ψ
    for (let q = 0; q < 3; q++) { worst = Math.max(worst, Math.abs(s.j[q] - direct[q])); peak = Math.max(peak, Math.abs(direct[q])); }
    worstRho = Math.max(worstRho, Math.abs(s.rho - 0.5 * (pa * pa + pb * pb)));
  }
  assert(worst < 1e-14 && worstRho < 1e-14 && peak > 1e-3, `j vs Im ψ̄∇ψ: ${worst} (peak ${peak}); ρ: ${worstRho}`);
  console.log(`PASS the sign: j = Σ Im D_pq χ_p ∇χ_q equals Im ψ̄∇ψ to ${worst.toExponential(1)} on a ring of 60 points (peak current ${peak.toExponential(2)}); the exchanged convention would be off by ${(2 * peak).toExponential(2)}.`);
}

/* ── §3, §4 · the RING ──────────────────────────────────────────────────────────────────────────────────── */
{
  const P = presetLanes('RING', st), ks = P.lanes.filter((l) => l.key !== GROUND).map((l) => l.key), vec = chemStateVectors({ ks });
  const model = createStatesModel({ n, nocc, C: g.C, D0: g.D, rMO: st.rMO });
  ks.forEach((k, r) => model.addState(k, st.omega[k], vec.X.subarray(r * vec.count, (r + 1) * vec.count)));
  const w = st.omega[ks[0]], T = 2 * Math.PI / w, re = new Float64Array(n * n), im = new Float64Array(n * n);
  const lanesAt = (quarter) => [{ key: GROUND, re: 0.8, im: 0 }, { key: ks[0], re: 0.42, im: 0 }, { key: ks[1], re: 0.42 * Math.cos(quarter), im: 0.42 * Math.sin(quarter) }];
  const N = 22, half = 5.5, hz = 3, dV = (2 * half / N) ** 2 * (2 * hz / 10);
  const Lz = (lanes, t) => { model.evaluate(lanes, t, 'ground'); model.flowMatrices(re, im); flow.set(re, im); let L = 0;
    for (let ix = 0; ix < N; ix++) for (let iy = 0; iy < N; iy++) for (let iz = 0; iz < 10; iz++) { const x = -half + (ix + 0.5) * 2 * half / N, y = -half + (iy + 0.5) * 2 * half / N, z = -hz + (iz + 0.5) * 2 * hz / 10, s = flow.at(x, y, z); L += (x * s.j[1] - y * s.j[0]) * dV; } return L; };
  const turnOf = (lanes) => { const a0 = model.evaluate(lanes, 0, 'ground').dipole.slice(), a1 = model.evaluate(lanes, T / 16, 'ground').dipole.slice(); return Math.sign(a0[0] * a1[1] - a0[1] * a1[0]); };
  const A = lanesAt(Math.PI / 2), B = lanesAt(1.5 * Math.PI), Lin = lanesAt(0), LA = Lz(A, 0), LB = Lz(B, 0), LL = Math.max(Math.abs(Lz(Lin, 0)), Math.abs(Lz(Lin, T / 5)));
  assert(Math.sign(LA) === turnOf(A) && Math.sign(LB) === turnOf(B) && Math.sign(LA) === -Math.sign(LB), `L_z ${LA}, ${LB}; dipole senses ${turnOf(A)}, ${turnOf(B)}`);
  assert(Math.abs(LA + LB) < 1e-6 * Math.abs(LA) && LL < 1e-6 * Math.abs(LA), `|L_z(A) + L_z(B)| = ${Math.abs(LA + LB)}, linear ${LL}`);
  const LAt = Lz(A, T / 3);
  assert(Math.abs(LAt - LA) < 1e-9 * Math.abs(LA), 'the ring’s angular momentum is a constant of the free motion');
  console.log(`PASS the RING's sense: ∫(x j_y − y j_x) = ${LA.toFixed(6)} at +90° and ${LB.toFixed(6)} at 270°, each with the sense its dipole turns; constant in time to ${Math.abs(LAt - LA).toExponential(1)}; a linear slosh carries ${LL.toExponential(1)}.`);

  /* §4 · the continuity defect of the ring, on the points that carry the signal */
  const dt = 1e-3, hh = 2e-3, pts = []; for (let k = 0; k < 400; k++) pts.push([7 * rnd(), 7 * rnd(), 3 * rnd()]);
  const mats = (t) => { model.evaluate(A, t, 'ground'); const r = new Float64Array(n * n), i2 = new Float64Array(n * n); model.flowMatrices(r, i2); return [r, i2]; };
  const [rP, iP] = mats(dt), [rM, iM] = mats(-dt), [r0, i0] = mats(0);
  let num = 0, den = 0, worst = 0, scale = 0;
  for (const p of pts) {
    flow.set(rP, iP); const a = flow.at(p[0], p[1], p[2]).rho; flow.set(rM, iM); const b = flow.at(p[0], p[1], p[2]).rho, dRho = (a - b) / (2 * dt);
    flow.set(r0, i0); let div = 0;
    for (let q = 0; q < 3; q++) { const u = p.slice(), d = p.slice(); u[q] += hh; d[q] -= hh; const ju = flow.at(u[0], u[1], u[2]).j[q], jd = flow.at(d[0], d[1], d[2]).j[q]; div += (ju - jd) / (2 * hh); }
    num += (dRho + div) ** 2; den += dRho ** 2; worst = Math.max(worst, Math.abs(dRho + div)); scale = Math.max(scale, Math.abs(dRho));
  }
  /* the sign-sensitive global check: d⟨r⟩/dt = ∫ j dV in a complete basis, so d(δμ)/dt and −∫ j dV must be PARALLEL.
     Their ratio is the length-gauge / velocity-gauge gap of the basis, which is large in a minimal one. */
  const tq = 3.0, dP = model.evaluate(A, tq + dt, 'ground').dipole.slice(), dM = model.evaluate(A, tq - dt, 'ground').dipole.slice(), dmu = dP.map((v2, q) => (v2 - dM[q]) / (2 * dt));
  model.evaluate(A, tq, 'ground'); model.flowMatrices(re, im); flow.set(re, im);
  const NN = 30, H8 = 8, hq = 2 * H8 / NN, J = [0, 0, 0];
  for (let ix = 0; ix < NN; ix++) for (let iy = 0; iy < NN; iy++) for (let iz = 0; iz < NN; iz++) { const s2 = flow.at(-H8 + (ix + 0.5) * hq, -H8 + (iy + 0.5) * hq, -H8 + (iz + 0.5) * hq); for (let q = 0; q < 3; q++) J[q] -= s2.j[q] * hq ** 3; }
  const cosv = (dmu[0] * J[0] + dmu[1] * J[1]) / (Math.hypot(dmu[0], dmu[1]) * Math.hypot(J[0], J[1])), ratio = Math.hypot(J[0], J[1]) / Math.hypot(dmu[0], dmu[1]);
  assert(cosv > 0.999, `d(δμ)/dt and −∫j dV must be parallel: cos = ${cosv}`);
  console.log(`PASS the current points the way the charge moves: d(δμ)/dt ∥ −∫ j dV (cos ${cosv.toFixed(6)}). MEASURED magnitude ratio ${ratio.toFixed(3)}: in STO-3G the velocity-gauge current is that fraction of what the density's own motion implies — FLOW shows direction and sense exactly, magnitude qualitatively.`);
  const defect = Math.sqrt(num / den);
  assert(Number.isFinite(defect) && den > 0, 'the continuity defect is a number');
  console.log(`MEASURED continuity (NOT an identity in a finite basis): on 400 points of benzene's RING, ‖∂ρ/∂t + ∇·j‖ / ‖∂ρ/∂t‖ = ${defect.toFixed(4)} in STO-3G (worst ${worst.toExponential(2)} against a largest ∂ρ/∂t of ${scale.toExponential(2)}).`);
}

/* ── §5 · FLOW for a real-time TDHF run: density.js keeps D_μν = Σ c_μ c̄_ν, the transpose-conjugate of ⟨a†_μ a_ν⟩, so the
      card hands the flow evaluator −Im D.  The sign-sensitive check is the same one: the current must point the way the
      charge moves.  (With the imaginary part un-negated the cosine below is −1.) ─────────────────────────────────── */
{
  const sol = moleculeRHF({ atoms: moleculeAtoms('H2O'), basis: 'sto-3g', detect: false, stability: false, hessian: false }), I = sol.integrals, nw = I.n;
  const eng = createRTHF({ n: nw, S: I.S, h: I.h, eri: I.eri, Z: I.Z, mu: [I.X, I.Y, I.Z], Enuc: I.Enuc, nuclearDipole: I.nuclearDipole[1], nElectrons: sol.nElectrons, D0: sol.D, dt: 0.01, integrator: 'magnus2', restartEvery: 0 });
  eng.kickAlong('y', 0.02);
  for (let k = 0; k < 60; k++) eng.step();
  const dA = eng.dipoleAlong('y'); eng.step(); const D = eng.D, dMid = eng.dipoleAlong('y'); eng.step(); const dB = eng.dipoleAlong('y'), rate = (dB - dA) / 0.02;
  const fw = createFlow(fieldShells(sol.basis)), re = Float64Array.from(D.re), imNeg = Float64Array.from(D.im, (x) => -x);
  fw.set(re, imNeg);
  const N = 36, H6 = 7, hq = 2 * H6 / N; let Jy = 0, Jx = 0, Jz = 0;
  for (let ix = 0; ix < N; ix++) for (let iy = 0; iy < N; iy++) for (let iz = 0; iz < N; iz++) { const q = fw.at(-H6 + (ix + 0.5) * hq, -H6 + (iy + 0.5) * hq, -H6 + (iz + 0.5) * hq); Jx -= q.j[0] * hq ** 3; Jy -= q.j[1] * hq ** 3; Jz -= q.j[2] * hq ** 3; }
  /* dipoleAlong is the ELECTRON dipole −Tr(D M_y): its rate is −d⟨y⟩/dt = −∫ j_y dV */
  assert(Math.sign(Jy) === Math.sign(rate) && Math.abs(Jy) > 10 * Math.hypot(Jx, Jz) && Number.isFinite(dMid), `TDHF flow: d(dipole)/dt = ${rate}, −∫ j_y dV = ${Jy}, off-axis ${Math.hypot(Jx, Jz)}`);
  console.log(`PASS TDHF flow: after a y kick the electron dipole moves at ${rate.toExponential(3)} and −∫ j_y dV = ${Jy.toExponential(3)} with −Im D (same sign, ratio ${(Jy / rate).toFixed(3)}; off-axis current ${Math.hypot(Jx, Jz).toExponential(1)}).`);
}
