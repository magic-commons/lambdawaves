// F probe: the synchronous maths the rack can run on the FRAME THREAD, timed in node (same modules, same numbers).
//   node research/optimization-2026-09-24/probes/F/sync-costs.mjs
import { HAMILTONIANS, setHamiltonian, getHamiltonian } from '../../../../lab/hamiltonian.js';
import { warmStep, applyKickZ, applyKickAlong, momentumZ, tablesReady } from '../../../../lab/kick.js';
import { wellPacket } from '../../../../lab/well.js';
import { densityPeriod, densityPeriodExact } from '../../../../lab/period.js';
import { hylleraas, BASES } from '../../../../lab/helium.js';
import { sto3gH2, weinbaumOptimal, h2CurveTable } from '../../../../lab/h2ci.js';
import { spectrum } from '../../../../lab/absorb.js';
import { fitPoles } from '../../../../lab/response-fit.js';
import { solveLadder } from '../../../../lab/ladder-model.js';
const T = (f, n = 1) => { const t0 = performance.now(); let r; for (let i = 0; i < n; i++) r = f(i); return { ms: +((performance.now() - t0) / n).toFixed(2), r }; };
const out = {};
setHamiltonian('hydrogen');
out.kickTablesColdMs = T(() => { while (!warmStep(1e9)) {} }).ms;
const re = new Float64Array(91), im = new Float64Array(91); re[0] = 1; re[4] = 0.5;
out.kickZWarmMs = T(() => applyKickZ(re, im, 0.2), 5).ms;
out.kickAlongWarmMs = T(() => applyKickAlong(re, im, 0.3, [0.3, 0.5, 0.81]), 5).ms;
out.momentumZMs = T(() => momentumZ(re, im), 5).ms;
// BOX: the well's packet (LAUNCH / a BOX bow when the worker is unavailable)
setHamiltonian('well'); HAMILTONIANS.well.setRadius(10);
const pk = T(() => wellPacket([-4, 0.5, 0], [0.9, 0.2, 0], 1.4), 3);
out.wellPacketMs = pk.ms;
const labels = []; for (let a = 0; a < 91; a++) if (pk.r.re[a] || pk.r.im[a]) labels.push(a);
out.wellPacketLabels = labels.length;
const E = labels.map((a) => getHamiltonian().energy(a));
out.boxPeriodExactMs = T(() => densityPeriodExact(E)).ms;
const P = T(() => densityPeriod(E, { horizon: 2e4 }));
out.boxPeriodScanMs = P.ms; out.boxPeriodResult = { exact: P.r.exact, T: P.r.T, err: P.r.err, pairs: P.r.pairs };
const Pw = T(() => densityPeriod([0].concat(E), { horizon: 2e4 }));   // capture.js wavePeriod: the SECOND scan a phase view asks for
out.boxWavePeriodScanMs = Pw.ms;
// helium / H2 / ladder: the heavy cards' solves (demand-loaded to the cards worker, but see heliumview ensureSol)
for (const b of Object.keys(BASES)) out['hylleraas_' + b + 'Ms'] = T(() => hylleraas(BASES[b])).ms;
out.h2ReadoutPerKnobMoveMs = T(() => { sto3gH2(1.4); weinbaumOptimal(1.4, { iters: 24 }); }, 3).ms;
out.h2CurveTableMs = T(() => h2CurveTable(0.6, 10, 48)).ms;
out.solveLadderMs = T(() => solveLadder({ nbar: 30, sigma: 2, d: 0, teeth: 8 })).ms; out.solveLadderN400Ms = T(() => solveLadder({ nbar: 400, sigma: 2, d: 0, teeth: 8 })).ms;
// the atom (setElement on the ELEMENT knob's release and in restore())
setHamiltonian('atom');
for (const Z of [11, 26, 36]) out['atomConfigureZ' + Z + 'Ms'] = T(() => HAMILTONIANS.atom.configure(Z)).ms;
// CHEMISTRY: the worker's chem.rt.spectrum (absorb.js over the ACCUMULATED trace, card grid) and the frame-thread pole fit
const dt = 0.01, kappa = 1e-3;
const mk = (M) => { const tr = new Float64Array(M); for (let n = 0; n < M; n++) { const t = n * dt; tr[n] = 1e-3 * (0.7 * Math.sin(0.48 * t) + 0.2 * Math.sin(0.91 * t) + 0.1 * Math.sin(1.33 * t)); } return tr; };
for (const M of [1e4, 1e5, 3e5]) out['chemRtSpectrumM' + M + 'Ms'] = T(() => spectrum(mk(M), { dt, kappa, tau: M * dt / 12, wMin: 5e-4, wMax: 1.6 })).ms;
const tr30 = mk(30000);
out.fitPoles30kMs = T(() => fitPoles(tr30, { dt, kappa, tau: 30000 * dt / 12, init: [0.48, 0.91, 1.33], wMin: 0.05, wMax: 1.6 })).ms;
console.log(JSON.stringify(out, null, 1));
