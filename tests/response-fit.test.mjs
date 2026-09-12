import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fitPoles, kernel } from '../lab/response-fit.js';
import { spectrum, peaks } from '../lab/absorb.js';
import { createRTHF, loewdin, sandwich, creal } from '../lab/density.js';

const close = (a, b, tol, what) => assert.ok(Math.abs(a - b) < tol, `${what}: ${a} vs ${b} (tol ${tol})`);
const fx = JSON.parse(readFileSync(new URL('./fixtures/h2o-response.json', import.meta.url)));
const W = fx.rpa.roots, MU = fx.rpa.mu, F = fx.rpa.f;
const DT = 0.02, TAU = 50, KAPPA = 1e-3, WMIN = 0.05, WMAX = 21, DW = 1e-3;
const yLines = [3, 4, 7, 9];                                                   // the four y-bright RPA roots
const Cfor = (w) => fx.Cj.reduce((b, c) => Math.abs(c.omega - w) < Math.abs(b.omega - w) ? c : b).pred;
const synth = (A, Om, T) => { const M = Math.round(T / DT) + 1, tr = new Float64Array(M);
  for (let n = 0; n < M; n++) { let s = 0; for (let k = 0; k < A.length; k++) s += A[k] * Math.sin(Om[k] * n * DT); tr[n] = 2 * KAPPA * s; } return tr; };

/* (a) Sol's kernel IS the sampled transform: Im α(ω) = Σ_k A_k K_M(ω, Ω_k), exactly. */
{
  const Om = yLines.map((i) => W[i]), A = yLines.map((i) => MU[i][1] ** 2), T = 600;
  const tr = synth(A, Om, T), M = tr.length, K = kernel({ dt: DT, tau: TAU, M });
  const spec = spectrum(tr, { dt: DT, kappa: KAPPA, tau: TAU, wMin: WMIN, wMax: WMAX, dw: DW });
  assert.equal(spec.omega.length, 20951, 'the ROUND 4 grid, 20951 points on [0.05, 21]');
  const gam = 1 / TAU;
  let wLit = 0, wRec = 0, signal = 0;
  for (let i = 0; i < spec.ImAlpha.length; i++) signal = Math.max(signal, Math.abs(spec.ImAlpha[i]));
  for (let r = 0; r < spec.omega.length; r += 5) {                              // every fifth point: 4191 samples
    const om = spec.omega[r];
    let model = 0; for (let k = 0; k < A.length; k++) model += A[k] * K(om, Om[k]);
    let acc = 0; for (let n = 1; n < M; n++) acc += tr[n] * Math.exp(-n * DT * gam) * Math.sin(om * n * DT);
    const literal = acc * DT / KAPPA;                                           // the same transform, Math.sin per sample
    wLit = Math.max(wLit, Math.abs(model - literal));
    wRec = Math.max(wRec, Math.abs(model - spec.ImAlpha[r]));
  }
  close(signal, 97.95, 0.05, 'the signal scale of the four-line y trace (ROUND 4 §3: 97.95)');
  assert.ok(wLit < 1e-10, `K_M vs the literal damped sine transform: ${wLit}`);
  assert.ok(wRec / signal < 1e-10, `K_M vs absorb.js's spectrum, relative to the signal: ${wRec / signal}`);
  assert.ok(wRec > 10 * wLit, 'the residual gap is absorb.js\'s sine recurrence, not the kernel');
  console.log(`PASS exact kernel: max|Σ A_k K_M − literal transform| = ${wLit.toExponential(3)} (< 1e-10) on a signal of ${signal.toFixed(4)};`
    + ` against absorb.js's recurrence transform ${wRec.toExponential(3)} absolute = ${(wRec / signal).toExponential(3)} relative — the O(M ε) drift of its sine recurrence, not the kernel.`);
}

/* (b) The crowded root beside a 16.46× stronger neighbour, noiseless, T/τ = 12: the fit finds it, the maximum does not. */
{
  const Om = yLines.map((i) => W[i]), A = yLines.map((i) => MU[i][1] ** 2);
  close(A[1] / A[0], 16.4562, 1e-3, 'the amplitude ratio of the 0.807 and 0.702 lines');
  const tr = synth(A, Om, 600);
  const r = fitPoles(tr, { dt: DT, kappa: KAPPA, tau: TAU, wMin: WMIN, wMax: WMAX, dw: DW, fraction: 1e-3 });
  assert.equal(r.poles.length, 4, 'absorb.js peaks at fraction 1e-3 initialise exactly four poles on a clean trace');
  let worst = 0, worstA = 0;
  for (let k = 0; k < 4; k++) { worst = Math.max(worst, Math.abs(r.poles[k].omega - Om[k]));
    worstA = Math.max(worstA, Math.abs(r.poles[k].amplitude / A[k] - 1)); }
  assert.ok(worst < 1e-7, `every noiseless pole to 1e-7: worst ${worst}`);
  assert.ok(Math.abs(r.poles[0].omega - 0.702205381675) < 1e-7, `the crowded root: ${r.poles[0].omega}`);
  assert.ok(worstA < 1e-7, `amplitudes A_k = |μ_y|² recovered relative to ${worstA}`);
  close(r.poles[0].bias, 2.3381e-3, 1e-6, 'the raw parabolic maximum sits +2.3381e-3 off (ROUND 2 measured +2.336e-3 on a real trace)');
  assert.ok(r.epsilon <= r.precondition, `Sol's precondition ε ≤ σ²/(8 L_J): ${r.epsilon} vs ${r.precondition}`);
  close(r.sigma, 64.605, 1e-2, 'σ_min(J) of the four-line fit (ROUND 4: 64.605)');
  assert.ok(r.certified(1e-7), `a noiseless trace certifies 1e-7: 4ε/σ = ${r.bound}`);
  assert.equal(r.refusal(1e-7), null, 'no refusal on the noiseless trace at 1e-7');
  assert.ok(!r.certified(1e-13), 'the certificate does not claim 1e-13');
  console.log(`PASS four-line noiseless fit: worst pole ${worst.toExponential(2)} (gate 1e-7), crowded root ${r.poles[0].omega.toFixed(12)},`
    + ` raw maximum ${r.poles[0].rawOmega.toFixed(9)} = +${r.poles[0].bias.toExponential(4)} off; ε ${r.epsilon.toExponential(3)}, σ ${r.sigma.toFixed(4)},`
    + ` L_J ${r.LJ.toExponential(3)}, σ²/(8L_J) ${r.precondition.toExponential(3)}, 4ε/σ ${r.bound.toExponential(3)}; amplitudes to ${worstA.toExponential(2)} relative.`);
}

/* (c) All nine bright lines at once. */
{
  const idx = [...Array(10).keys()].filter((i) => F[i] > 1e-8);
  assert.equal(idx.length, 9, 'nine bright lines in the oracle');
  const Om = idx.map((i) => W[i]), A = idx.map((i) => MU[i].reduce((s, v) => s + v * v, 0));
  const tr = synth(A, Om, 600);
  const r = fitPoles(tr, { dt: DT, kappa: KAPPA, tau: TAU, wMin: WMIN, wMax: WMAX, dw: DW, init: Om });
  assert.equal(r.poles.length, 9);
  let worst = 0, worstA = 0, worstRaw = 0;
  for (let k = 0; k < 9; k++) { worst = Math.max(worst, Math.abs(r.poles[k].omega - Om[k]));
    worstA = Math.max(worstA, Math.abs(r.poles[k].amplitude / A[k] - 1));
    worstRaw = Math.max(worstRaw, Math.abs(r.poles[k].bias)); }
  assert.ok(worst < 1e-9, `all nine noiseless poles to 1e-9: worst ${worst}`);
  assert.ok(worstA < 1e-7, `nine amplitudes to ${worstA} relative`);
  assert.ok(worstRaw > 1e-3, `at least one raw maximum is displaced by more than 1e-3: worst ${worstRaw}`);
  close(r.sigma, 29.201, 1e-2, 'σ_min(J) of the nine-line fit (ROUND 4: 29.201)');
  assert.ok(r.epsilon <= r.precondition && r.certified(1e-9), 'the nine-line certificate holds at 1e-9');
  console.log(`PASS nine-line noiseless fit: worst pole ${worst.toExponential(2)} (gate 1e-9), worst amplitude ${worstA.toExponential(2)} relative,`
    + ` worst raw-maximum displacement ${worstRaw.toExponential(3)}; ε ${r.epsilon.toExponential(3)}, σ ${r.sigma.toFixed(4)}, 4ε/σ ${r.bound.toExponential(3)}.`);
}

/* (d) A real RT-RHF trace from lab/density.js: the certificate must refuse 1e-7, and the leftover is C_j Δt². */
{
  const n = fx.n, S = Float64Array.from(fx.S), h = Float64Array.from(fx.h), eri = Float64Array.from(fx.eri), Zy = Float64Array.from(fx.dipole.y);
  const { X } = loewdin(S, n), Mt = sandwich(X, creal(Zy, n));
  const run = (dt, T) => {                                                     // y kick, Magnus-2, sampled every 0.02
    const rt = createRTHF({ n, S, h, eri, Z: Zy, Enuc: fx.geometry.Enuc, nElectrons: fx.nElectrons, D0: Float64Array.from(fx.D), dt, integrator: 'magnus2' });
    const mu = () => { const P = rt.P; let a = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) a += P.re[j * n + i] * Mt.re[i * n + j]; return -a; };
    rt.kick(KAPPA);
    const every = Math.round(DT / dt), nout = Math.round(T / DT) + 1, tr = new Float64Array(nout);
    tr[0] = mu();
    for (let k = 1; k < nout; k++) { for (let q = 0; q < every; q++) rt.step(dt); tr[k] = mu(); }
    const o = rt.observables();
    close(o.electrons, fx.nElectrons, 1e-9, `Tr(DS) after the ${dt} run`);
    return { tr, idem: o.idempotency, electrons: o.electrons };
  };
  const Om = yLines.map((i) => W[i]);
  const fit = (tr, dt) => fitPoles(tr, { dt: DT, kappa: KAPPA, tau: TAU, wMin: WMIN, wMax: WMAX, dw: DW, init: Om });
  /* the peak reader cannot even name the lines on a real trace: its ripple reaches 0.5 % of the strongest line */
  const a = run(0.01, 300), ra = fit(a.tr, 0.01);
  const auto = peaks(spectrum(a.tr, { dt: DT, kappa: KAPPA, tau: TAU, wMin: WMIN, wMax: WMAX, dw: DW }), { fraction: 5e-3 });
  assert.ok(auto.length > 4, `absorb.js at fraction 5e-3 finds ${auto.length} maxima for four lines — init must come from the inspector`);
  assert.ok(!ra.certified(1e-7), 'Δt = 0.01: 1e-7 refused');
  assert.ok(!ra.certified(1e-4), 'Δt = 0.01: the precondition fails, so 1e-4 is refused too');
  assert.match(ra.refusal(1e-7), /precondition fails/, 'the refusal names the precondition');
  for (let k = 0; k < 4; k++) {
    const tgt = Om[k] + Cfor(Om[k]) * 1e-4;
    assert.ok(Math.abs(ra.poles[k].omega - tgt) < 2e-5, `Δt = 0.01 line ${k + 1}: fitted − (ω_RPA + C_j Δt²) = ${ra.poles[k].omega - tgt}`);
  }
  close(ra.poles[0].bias, 2.06e-3, 5e-5, 'the raw maximum of the crowded line on the real Δt = 0.01 trace');
  console.log(`PASS real RT Δt = 0.01, T = 300 (Tr(DS) = ${a.electrons.toFixed(12)}, idempotency ${a.idem.toExponential(2)}): ε ${ra.epsilon.toExponential(4)},`
    + ` σ ${ra.sigma.toFixed(4)}, σ²/(8L_J) ${ra.precondition.toExponential(3)} — precondition FAILS, so certified(1e-7) = false and certified(1e-4) = false;`
    + ` 4ε/σ would be ${ra.bound.toExponential(3)}. Crowded line: raw +${ra.poles[0].bias.toExponential(3)}, fitted ${(ra.poles[0].omega - Om[0]).toExponential(3)},`
    + ` C_j Δt² ${(Cfor(Om[0]) * 1e-4).toExponential(3)}, leftover ${(ra.poles[0].omega - Om[0] - Cfor(Om[0]) * 1e-4).toExponential(3)}.`);
  /* halve the step and the certificate turns: 1e-4 certified, 1e-7 still refused, and C_j Δt² is what is left */
  const b = run(0.005, 300), rb = fit(b.tr, 0.005);
  assert.ok(rb.epsilon <= rb.precondition, `Δt = 0.005: the precondition holds, ε = ${rb.epsilon} ≤ ${rb.precondition}`);
  assert.equal(rb.certified(1e-7), false, 'Δt = 0.005: 1e-7 still refused');
  assert.equal(rb.certified(1e-4), true, 'Δt = 0.005: 1e-4 certified');
  assert.match(rb.refusal(1e-7), /4ε\/σ/, 'the refusal at 1e-7 names the bound');
  close(rb.epsilon, 2.346e-4, 5e-7, 'ε on the real trace (ROUND 4 §3: 2.346e-4)');
  close(rb.bound, 1.45e-5, 5e-7, '4ε/σ on the real trace (ROUND 4 §3: 1.45e-5)');
  let worstLeft = 0;
  for (let k = 0; k < 4; k++) {
    const cj = Cfor(Om[k]), tgt = Om[k] + cj * 0.005 * 0.005;
    worstLeft = Math.max(worstLeft, Math.abs(rb.poles[k].omega - tgt));
    assert.ok(Math.abs(rb.poles[k].omega - Om[k]) < 2e-3, `line ${k + 1} is within 2e-3 of its RPA root`);
  }
  assert.ok(worstLeft < 2e-6, `fitted − (ω_RPA + C_j Δt²) on all four y lines: worst ${worstLeft}`);
  assert.ok(Math.abs(rb.poles[3].omega - Om[3]) > 600 * Math.abs(rb.poles[0].omega - Om[0]) / 1.1,
    'the O 1s line carries a 620× larger timestep shift than the crowded valence line (C_j = 60.53 against 0.0977)');
  close(rb.poles[0].omega - Om[0], 2.463e-6, 5e-9, 'the crowded line: fitted − ω_RPA (ROUND 4: +2.463e-6)');
  close(Cfor(Om[0]) * 0.005 * 0.005, 2.443e-6, 1e-9, 'C_j Δt² for the crowded line (ROUND 4: +2.443e-6)');
  console.log(`PASS real RT Δt = 0.005, T = 300: ε ${rb.epsilon.toExponential(4)} ≤ σ²/(8L_J) ${rb.precondition.toExponential(3)}, 4ε/σ ${rb.bound.toExponential(3)}`
    + ` → certified(1e-4) true, certified(1e-7) false; fitted − (ω_RPA + C_j Δt²) worst ${worstLeft.toExponential(3)} over the four y lines`
    + ` (crowded line: raw +${rb.poles[0].bias.toExponential(3)}, fitted +${(rb.poles[0].omega - Om[0]).toExponential(3)}, C_j Δt² +${(Cfor(Om[0]) * 2.5e-5).toExponential(3)},`
    + ` leftover +${(rb.poles[0].omega - Om[0] - Cfor(Om[0]) * 2.5e-5).toExponential(3)}).`);
}
