/* tests/molecular-drive.test.mjs — THE DRIVE (MOLECULAR WAVES stage 5): TD-CIS on the full singles space, in node.
 *
 *   §1  the operator: R in the [S₀, S₁ …] basis is symmetric, R_0K = μ_K, and R_KL equals Σ_pq γ^{KL}_pq r_pq − δ_KL⟨0|R|0⟩
 *       with γ written out from proving/LEDGER.md Proposition 3 — a second route to the pair-basis closed form
 *   §2  a resonant weak field is a Rabi flop: with Ω = E₀μ the population arrives at t = π/Ω (two-level RWA), because
 *       the drive resonates WHERE THE STICK STANDS — the law the frozen-orbital drives could not keep
 *   §3  the Strang step is second order (Δt-halving ratio 4), unitary to round-off, and a negative Δt is its inverse
 *   §4  first-order perturbation theory: a weak constant field for a short time gives b_K = −E₀μ_K(1 − e^{−iω_K T})/ω_K,
 *       and the defect is second order in E₀ (halving E₀ quarters it)
 *   §5  a circular field on benzene's bright pair drives a ring: the two lanes fill equally, a quarter turn apart
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chemRegister, chemStates, chemStateVectors, chemDriveInit, chemDriveRun, chemDriveSet, chemDriveAmplitudes, chemDriveOperator } from '../lab/mathworker.js';
import { moleculeAtoms } from '../lab/molecules.js';

chemRegister('sto-3g', JSON.parse(fs.readFileSync(new URL('../lab/vendor/bse/sto-3g-v1.json', import.meta.url), 'utf8')));
const water = { atoms: moleculeAtoms('H2O'), basis: 'sto-3g', charge: 0 }, st = chemStates(water), d = st.count, n = st.n, nocc = st.nocc, nv = st.nvir;
const G = [{ key: -1, re: 1, im: 0 }];
const dist = (a, b) => { let e = 0; for (let k = 0; k < a.N; k++) e = Math.max(e, Math.hypot(a.re[k] - b.re[k], a.im[k] - b.im[k])); return e; };

/* ── §1 · the operator ──────────────────────────────────────────────────────────────────────────────────── */
{
  const all = chemStateVectors({ ks: [...Array(d).keys()] }), X = (K) => all.X.subarray(K * d, (K + 1) * d);
  let worst = 0, asym = 0, mu = 0;
  for (let q = 0; q < 3; q++) {
    const { N, R } = chemDriveOperator(q), r = st.rMO.subarray(q * n * n, (q + 1) * n * n);
    let R00 = 0; for (let i = 0; i < nocc; i++) R00 += 2 * r[i * n + i];
    for (let K = 0; K < d; K++) {
      mu = Math.max(mu, Math.abs(R[K + 1] - st.mu[3 * K + q]));
      for (let L = 0; L < d; L++) {
        asym = Math.max(asym, Math.abs(R[(K + 1) * N + L + 1] - R[(L + 1) * N + K + 1]));
        /* Σ_pq γ^{KL}_pq r_pq with γ^{KL}_ij = 2δ_ij⟨X^K,X^L⟩ − Σ_a X^K_ja X^L_ia, γ^{KL}_ab = Σ_i X^K_ia X^L_ib */
        let v = 0, ov = 0; const XK = X(K), XL = X(L);
        for (let p = 0; p < d; p++) ov += XK[p] * XL[p];
        for (let i = 0; i < nocc; i++) for (let j = 0; j < nocc; j++) { let s = 0; for (let a = 0; a < nv; a++) s += XK[j * nv + a] * XL[i * nv + a]; v += ((i === j ? 2 * ov : 0) - s) * r[i * n + j]; }
        for (let a = 0; a < nv; a++) for (let b = 0; b < nv; b++) { let s = 0; for (let i = 0; i < nocc; i++) s += XK[i * nv + a] * XL[i * nv + b]; v += s * r[(nocc + a) * n + nocc + b]; }
        worst = Math.max(worst, Math.abs(v - (K === L ? R00 : 0) - R[(K + 1) * N + L + 1]));
      }
    }
  }
  assert(worst < 1e-12 && asym < 1e-13 && mu < 1e-13, `operator: γ-route ${worst}, asymmetry ${asym}, R_0K − μ_K ${mu}`);
  console.log(`PASS the operator: R_KL = Σ γ^{KL}_pq r_pq − δ_KL⟨0|R|0⟩ to ${worst.toExponential(1)} over all ${3 * d * d} elements of three axes; symmetric to ${asym.toExponential(1)}; R_0K = μ_K to ${mu.toExponential(1)}.`);
}

/* ── §2, §3 · the Rabi flop on water's brightest valence line, and the step's order ─────────────────────── */
{
  let K = 0; for (let k = 0; k < d; k++) if (st.omega[k] < 3 && st.f[k] > st.f[K]) K = k;
  let q = 0; for (let a = 1; a < 3; a++) if (Math.abs(st.mu[3 * K + a]) > Math.abs(st.mu[3 * K + q])) q = a;
  const w = st.omega[K], mu = Math.abs(st.mu[3 * K + q]), Om = 0.01, e0 = Om / mu, Tpi = Math.PI / Om, pol = 'xyz'[q];
  const at = {};
  for (const dt of [0.1, 0.05, 0.025, 0.003125]) {
    chemDriveInit({ pol, omega: w, e0, envelope: 'cw', dt, t0: 0, lanes: G });
    const r = chemDriveRun({ to: Tpi, maxSteps: 1e7 }); at[dt] = { A: chemDriveAmplitudes(), r };
  }
  const r = at[0.05].r, e1 = dist(at[0.1].A, at[0.003125].A), e2 = dist(at[0.05].A, at[0.003125].A), e3 = dist(at[0.025].A, at[0.003125].A);
  assert(r.pops[K] > 0.999 && r.p0 < 1e-4, `Rabi: P_K(π/Ω) = ${r.pops[K]}, P_0 = ${r.p0}`);
  assert(Math.abs(r.norm - 1) < 1e-10, `norm − 1 = ${r.norm - 1}`);
  assert(e1 / e2 > 3.8 && e1 / e2 < 4.2 && e2 / e3 > 3.8 && e2 / e3 < 4.3, `Δt-halving ratios ${e1 / e2}, ${e2 / e3}`);
  console.log(`PASS Rabi: S₀ → state ${K + 1} (ω ${w.toFixed(6)}, μ_${pol} ${mu.toFixed(4)}) with E₀ = Ω/μ = ${e0.toExponential(3)}: P(π/Ω = ${Tpi.toFixed(2)} a.u.) = ${r.pops[K].toFixed(6)}, leak ${(1 - r.p0 - r.pops[K]).toExponential(2)}, norm − 1 = ${(r.norm - 1).toExponential(1)} after ${r.steps} steps.`);
  console.log(`PASS the step is second order: errors ${e1.toExponential(3)}, ${e2.toExponential(3)}, ${e3.toExponential(3)} at Δt = 0.1, 0.05, 0.025 — ratios ${(e1 / e2).toFixed(3)}, ${(e2 / e3).toFixed(3)}.`);
  /* a negative Δt is the inverse — under a circular sin² pulse, from a complex start */
  chemDriveInit({ pol: 'xy+', omega: w, e0: 0.05, envelope: 'pulse', duration: 120, dt: 0.05, t0: 0, lanes: [{ key: -1, re: 0.9, im: 0 }, { key: 2, re: 0, im: 0.3 }] });
  const a0 = chemDriveAmplitudes(), f = chemDriveRun({ to: 150, maxSteps: 1e7 }); chemDriveRun({ to: 0, maxSteps: 1e7 });
  const back = dist(chemDriveAmplitudes(), a0);
  assert(back < 1e-9 && f.p0 < 0.95 && Math.abs(f.norm - 1) < 1e-10, `reversal ${back}, p0 after the pulse ${f.p0}`);
  console.log(`PASS reversible: 3000 steps out and 3000 back under a circular sin² pulse return the state to ${back.toExponential(1)}; the pulse left P₀ = ${f.p0.toFixed(4)}.`);
  /* the live knobs do not re-init */
  const before = chemDriveAmplitudes(); const s = chemDriveSet({ e0: 0.01 }); assert(s.ok && s.e0 === 0.01 && dist(chemDriveAmplitudes(), before) === 0);
}

/* ── §4 · first order ───────────────────────────────────────────────────────────────────────────────────── */
{
  const T = 0.5, defect = (e0) => {
    chemDriveInit({ pol: 'y', omega: 0, e0, envelope: 'cw', dt: 0.0025, t0: 0, lanes: G }); chemDriveRun({ to: T, maxSteps: 1e7 });
    const A = chemDriveAmplitudes(); let worst = 0;
    for (let K = 0; K < d; K++) {
      const w = st.omega[K], m = st.mu[3 * K + 1], re = -e0 * m * (1 - Math.cos(w * T)) / w, im = -e0 * m * Math.sin(w * T) / w;
      worst = Math.max(worst, Math.hypot(A.re[K + 1] - re, A.im[K + 1] - im));
    }
    return worst;
  };
  const d1 = defect(2e-3), d2 = defect(1e-3);
  assert(d1 / d2 > 3.5 && d1 / d2 < 4.5 && d2 < 1e-6, `first-order defect ${d1} → ${d2}`);
  console.log(`PASS first order: b_K = −E₀μ_K(1 − e^{−iω_K T})/ω_K to ${d2.toExponential(2)} at E₀ = 1e-3, and the defect is second order in E₀ (ratio ${(d1 / d2).toFixed(3)}).`);
}

/* ── §5 · benzene: a circular field drives the ring ─────────────────────────────────────────────────────── */
{
  const bz = { atoms: moleculeAtoms('C6H6'), basis: 'sto-3g', charge: 0 }, sb = chemStates(bz);
  let kx = -1; for (let k = 0; k < sb.count; k++) if (sb.f[k] > 0.02 && sb.size[k] === 2) { kx = k; break; }
  const ky = kx + 1, w = sb.omega[kx], mu = sb.mu[3 * kx], Om = 0.005, t0 = performance.now();   // Ω/ω = 1.3 %: the counter-rotating terms the RWA drops are that small
  chemDriveInit({ pol: 'xy+', omega: w, e0: Om / mu, envelope: 'cw', dt: 0.05, t0: 0, lanes: G });
  const tInit = performance.now() - t0, t1 = performance.now(), r = chemDriveRun({ to: 200, maxSteps: 1e7 }), perStep = (performance.now() - t1) / r.steps, A = chemDriveAmplitudes();
  const px = r.pops[kx], py = r.pops[ky];
  let rel = Math.atan2(A.im[ky + 1], A.re[ky + 1]) - Math.atan2(A.im[kx + 1], A.re[kx + 1]); while (rel > Math.PI) rel -= 2 * Math.PI; while (rel < -Math.PI) rel += 2 * Math.PI;
  assert(px > 0.05 && Math.abs(px - py) / px < 0.02 && Math.abs(Math.abs(rel) - Math.PI / 2) < 0.05, `pair populations ${px}, ${py}, relative phase ${rel}`);
  assert(Math.abs(r.norm - 1) < 1e-10);
  console.log(`PASS the ring is driven: a circular field at the pair's ω fills lanes x and y equally (${px.toFixed(4)}, ${py.toFixed(4)}) a quarter turn apart (${(rel * 180 / Math.PI).toFixed(2)}°); benzene's 316-state drive costs ${tInit.toFixed(0)} ms to prepare and ${perStep.toFixed(3)} ms a step.`);
}
