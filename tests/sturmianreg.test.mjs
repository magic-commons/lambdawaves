/* tests/sturmianreg.test.mjs — the node proof of THE SCALE on the register (W-STURMIAN, the UI wave's maths).
 *   node tests/sturmianreg.test.mjs
 * Oracles: the unblocked 91 × 91 createSturmian (the same law, mixed degenerate blocks allowed), the register's own
 * diagonal law at λ = 1/n, and identities that must hold to rounding (CᵀSC = I, S-norm conservation, Σ populations = 1).
 */
import { createRegisterSturmian } from '../lab/sturmianreg.js';
import { createSturmian, sturmianRecord } from '../lab/sturmian.js';
import { BASIS, stateOf, modeTable } from '../lab/hydrogen.js';
import { Register } from '../lab/state.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 300)));
}
const t0 = performance.now();
const N = 91, maxAbs = (a) => { let m = 0; for (const v of a) m = Math.max(m, Math.abs(v)); return m; };
const rnd = (seed) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 - 0.5; };
const randomState = (seed) => { const r = rnd(seed), re = new Float64Array(N), im = new Float64Array(N); for (let a = 0; a < N; a++) { re[a] = r(); im[a] = r(); } return { re, im }; };

{
  /* 1. the assembly against the unblocked solve: same eigenvalues (sorted), CᵀSC = I, every column block-pure */
  const lam = 1.4, R = createRegisterSturmian(lam, { Z: 1 }), U = createSturmian(undefined, lam, { Z: 1 });
  let dE = 0; for (let k = 0; k < N; k++) dE = Math.max(dE, Math.abs(R.E[k] - U.E[k]));
  let orth = 0; for (let k = 0; k < N; k++) for (let q = 0; q < N; q++) { let s = 0; for (let i = 0; i < N; i++) s += R.C[i * N + k] * R.CtS[q * N + i]; orth = Math.max(orth, Math.abs(s - (k === q ? 1 : 0))); }
  let impure = 0; for (let k = 0; k < N; k++) for (let i = 0; i < N; i++) if (R.C[i * N + k] !== 0 && (BASIS[i].l !== R.lK[k] || BASIS[i].m !== R.mK[k])) impure++;
  let dS = 0, dH = 0; for (let i = 0; i < N * N; i++) { dS = Math.max(dS, Math.abs(R.S[i] - U.S[i])); dH = Math.max(dH, Math.abs(R.H[i] - U.H[i])); }
  judge('ASSEMBLY: at λ = 1.4 the block-pure propagator has the unblocked 91 × 91 solve\'s eigenvalues (1e-10), CᵀSC = I (1e-12), the same S and H (1e-14), 36 blocks, rank 91, and every eigenvector carries ONE (l, m)',
    dE < 1e-10 && orth < 1e-12 && dS < 1e-14 && dH < 1e-14 && R.blocks === 36 && R.rank === 91 && impure === 0, { dE, orth, dS, dH, blocks: R.blocks, rank: R.rank, impure, E0: R.E[0] });
  /* the same evolution: a random complex state to t = 7.3 by both, and the S-norm conserved */
  const c = randomState(7), a = R.evolve(c, 7.3), b = U.evolve(c, 7.3);
  let dc = 0; for (let i = 0; i < N; i++) dc = Math.max(dc, Math.abs(a.re[i] - b.re[i]), Math.abs(a.im[i] - b.im[i]));
  const n0 = R.norm(c), n1 = R.norm(a), p = R.populations(c); let sum = 0; for (const v of p) sum += v;
  judge('THE LAW: the assembled C e^{−iEt} CᵀS agrees with the unblocked evolve on a random 91-vector at t = 7.3 (1e-10); ⟨c|S|c⟩ is conserved (1e-12 relative) and the populations sum to 1 (1e-12)',
    dc < 1e-10 && Math.abs(n1 - n0) < 1e-12 * n0 && Math.abs(sum - 1) < 1e-12, { dc, n0, n1, sum });
  /* ±m degeneracy: every eigenvalue with m ≠ 0 appears in an exactly degenerate pair, and the pair is m-pure */
  let pairs = 0, bad = 0;
  for (let k = 0; k < N; k++) if (R.mK[k] > 0) { const q = R.E.findIndex((E, j) => j !== k && R.lK[j] === R.lK[k] && R.mK[j] === -R.mK[k] && Math.abs(E - R.E[k]) < 1e-12); if (q < 0) bad++; else pairs++; }
  judge('±m: every m > 0 eigenvalue has its exact m < 0 twin (1e-12) and each column keeps its own sign of m — the purity the unblocked solver need not give', bad === 0 && pairs === 35, { pairs, bad });   // 35 labels have m > 0: Σ_l l(6 − l)
}
{
  /* 2. the hydrogen limit through the assembly: at λ = 1/2 the 2p₀ label is an exact eigenvector at −1/8 with population 1 */
  const R = createRegisterSturmian(0.5, { Z: 1 }), a = stateOf(2, 1, 0).index, c = { re: new Float64Array(N), im: new Float64Array(N) }; c.re[a] = 1;
  const p = R.populations(c), k = p.findIndex((v) => v > 0.5);
  judge('HYDROGEN LIMIT: at λ = 1/2 the 2p₀ label is an eigenstate of the assembled propagator — one population 1 (1e-12) at E = −0.125 (1e-12), (l, m) = (1, 0), dominant n = 2', k >= 0 && Math.abs(p[k] - 1) < 1e-12 && Math.abs(R.E[k] + 0.125) < 1e-12 && R.lK[k] === 1 && R.mK[k] === 0 && R.nK[k] === 2, { k, pop: p[k], E: R.E[k], n: R.nK[k] });
  const He = createRegisterSturmian(2, { Z: 2 }); const c1 = { re: new Float64Array(N), im: new Float64Array(N) }; c1.re[0] = 1; const pH = He.populations(c1), kH = pH.findIndex((v) => v > 0.5);
  judge('He⁺: Z = 2 at λ = 2 — the 1s label is an exact eigenstate at −2 (1e-10) of the assembled propagator', kH >= 0 && Math.abs(He.E[kH] + 2) < 1e-10 && Math.abs(pH[kH] - 1) < 1e-12, { E: He.E[kH], pop: pH[kH] });
  const rec = R.records(), T = modeTable(2, 1, 0), S = sturmianRecord(2, 1, 0, 0.5);
  judge('RECORDS: records() returns sturmianRecord for every label in BASIS order (n_rec = 1/λ = 2 at λ = 1/2 — the hydrogen 2p₀ table to the bit)', rec.length === 91 && rec[a].n === 2 && rec[a].norm === T.norm && rec[a].lag.every((v, i) => v === T.lag[i]) && rec[a].label.n === 2 && rec[a].norm === S.norm, { n: rec[a].n, norm: rec[a].norm, hydrogen: T.norm });
}
{
  /* 3. THE REGISTER HOOK: setPropagator(P) — at(t), set/coeffAt re-anchoring at time t, the S-norm, Ediag, normalAmplitudes/energy, Zeeman, Stark refused, null restores */
  const reg = new Register(), lam = 1.4, P = createRegisterSturmian(lam, { Z: 1 });
  reg.set(0, 0.8, 0, 0); reg.set(stateOf(2, 0, 0).index, 0.6, 0, 0);                 // 1s + 2s under the diagonal law (one (l, m) block: S₁₂ = −½, so ⟨c|S|c⟩ = 0.52 ≠ Σ|c|² = 1)
  const cH = reg.at(5);                                                                // hydrogen: e^{−iE t} per label
  reg.setPropagator(P);
  const c0 = reg.at(0), c5 = reg.at(5), viaP = P.evolve({ re: reg.re0, im: reg.im0 }, 5);
  let d5 = 0; for (let i = 0; i < N; i++) d5 = Math.max(d5, Math.abs(c5.re[i] - viaP.re[i]), Math.abs(c5.im[i] - viaP.im[i]));
  let moved = 0; for (let i = 0; i < N; i++) moved = Math.max(moved, Math.abs(c5.re[i] - cH.re[i]), Math.abs(c5.im[i] - cH.im[i]));
  judge('HOOK at(t): with the propagator in force at(5) is P.evolve(anchor, 5) (1e-14), the anchor is untouched (1e-15), and the state differs from the diagonal law\'s (the labels are not eigenstates at λ = 1.4)',
    d5 < 1e-14 && Math.abs(c0.re[0] - 0.8) < 1e-15 && moved > 1e-3, { d5, moved });
  const n2 = reg.norm2(), nS = P.norm({ re: reg.re0, im: reg.im0 }), nSt = P.norm(reg.at(123.4));
  judge('HOOK norm: norm2() is ⟨c|S|c⟩ = 1 + 2·0.8·0.6·S₁₂ = 0.52 (1e-14) and it is conserved at t = 123.4 (1e-12); it is NOT Σ|c|² = 1', Math.abs(n2 - nS) < 1e-15 && Math.abs(n2 - 0.52) < 1e-14 && Math.abs(nSt - nS) < 1e-12, { n2, nS, nSt });
  /* an edit AT time t: set c_a(t) and read it back at t; the anchor is P.evolve(c(t), −t) */
  reg.set(stateOf(3, 0, 0).index, 0.3, -0.2, 9);
  const back = reg.coeffAt(stateOf(3, 0, 0).index, 9), c9 = reg.at(9);
  judge('HOOK set(a, v, t): the component set at t = 9 reads back at t = 9 through coeffAt and at(t) (1e-12) — the anchor is re-anchored by P.evolve(·, −t)', Math.abs(back.re - 0.3) < 1e-12 && Math.abs(back.im + 0.2) < 1e-12 && Math.abs(c9.re[stateOf(3, 0, 0).index] - 0.3) < 1e-12, back);
  /* Ediag, the normal modes and the energy */
  const a1s = 0, expect = P.H[a1s * N + a1s] / P.S[a1s * N + a1s];
  const na = reg.normalAmplitudes(0); let eS = 0, nn = 0; for (let k = 0; k < na.E.length; k++) { const p = na.re[k] ** 2 + na.im[k] ** 2; eS += p * na.E[k]; nn += p; }
  const E = reg.energy(), EP = P.energyOf({ re: reg.re0, im: reg.im0 });
  judge('HOOK Ediag / energy: Ediag(1s) = ⟨1s|H|1s⟩ = λ²/2 − λ (not −½), normalAmplitudes are the S-projections onto the eigenvectors (Σ|d|² = ⟨c|S|c⟩, 1e-12) and energy() = ⟨c|H|c⟩/⟨c|S|c⟩ (1e-12)',
    Math.abs(reg.Ediag(a1s) - expect) < 1e-15 && Math.abs(expect - (lam * lam / 2 - lam)) < 1e-15 && Math.abs(nn - reg.norm2()) < 1e-12 && Math.abs(E - EP) < 1e-12 && Math.abs(eS / nn - EP) < 1e-12, { Ediag: reg.Ediag(a1s), expect, E, EP });
  /* Zeeman under the propagator: a 2p₊₁ label at λ = 1/2 (an eigenstate) picks up exactly e^{−i(E + B/2)t}; Stark is refused */
  const reg2 = new Register(); reg2.setPropagator(createRegisterSturmian(0.5, { Z: 1 })); const b = stateOf(2, 1, 1).index; reg2.set(b, 1, 0, 0); reg2.setField({ Bz: 0.02, Fz: 0.01 });
  const cz = reg2.coeffAt(b, 10), ph = -(-0.125 + 0.01) * 10;
  const na2 = reg2.normalAmplitudes(0), kz = na2.E.findIndex((E) => Math.abs(E - (-0.125 + 0.01)) < 1e-12);
  judge('HOOK Zeeman / Stark: with B = 0.02 the 2p₊₁ eigenstate at λ = ½ evolves as e^{−i(−1/8 + B/2)t} (1e-12), its normal-mode energy is shifted by B m/2, and the Stark field is refused (Fz stays 0)',
    Math.abs(cz.re - Math.cos(ph)) < 1e-12 && Math.abs(cz.im - Math.sin(ph)) < 1e-12 && kz >= 0 && reg2.field.Fz === 0, { cz, expect: [Math.cos(ph), Math.sin(ph)], Fz: reg2.field.Fz });
  /* null restores the diagonal law exactly */
  const reg3 = new Register(); reg3.set(0, 0.6, 0, 0); reg3.set(stateOf(2, 0, 0).index, 0.8, 0, 0);
  const before = reg3.at(3.3), n2b = reg3.norm2(); reg3.setPropagator(createRegisterSturmian(1.7)); reg3.setPropagator(null);
  const after = reg3.at(3.3); let dd = 0; for (let i = 0; i < N; i++) dd = Math.max(dd, Math.abs(after.re[i] - before.re[i]), Math.abs(after.im[i] - before.im[i]));
  judge('HOOK null: setPropagator(null) restores the diagonal law — at(3.3) and norm2() are what they were before (bit for bit), Ediag(1s) = −½ again', dd === 0 && reg3.norm2() === n2b && reg3.Ediag(0) === -0.5, { dd, n2: reg3.norm2() });
  /* the DRAG toy under the propagator: forward only, never amplifying, the ground eigen-component untouched */
  const reg4 = new Register(); reg4.setPropagator(P); reg4.set(0, 0.8, 0, 0); reg4.set(stateOf(2, 1, 0).index, 0, 0.6, 0); reg4.setDamping(0.5);
  const nd = P.norm(reg4.at(20)), nd0 = reg4.norm2(), p20 = P.populations(reg4.at(20)), pk0 = P.populations({ re: reg4.re0, im: reg4.im0 });
  judge('HOOK DRAG: with γ = 0.5 the S-norm at t = 20 has decayed (never grown) and the ground eigen-component\'s absolute weight is unchanged (1e-12) — the toy acts in the eigenbasis as it does in the diagonal one', nd < nd0 && Math.abs(p20[0] * nd - pk0[0] * nd0) < 1e-12, { nd0, nd, g0: pk0[0] * nd0, g20: p20[0] * nd });
}
{
  /* 4. wall time: the assembly (36 blocks) is cheaper than the 91 × 91 solve */
  const times = []; for (let i = 0; i < 7; i++) { const a = performance.now(); createRegisterSturmian(1 + 0.1 * i, { Z: 1 }); times.push(performance.now() - a); }
  times.sort((x, y) => x - y);
  judge('WALL TIME: the block-pure build + solve + projector, median of 7 runs < 20 ms', times[3] < 20, { medianMs: +times[3].toFixed(2), minMs: +times[0].toFixed(2) });
}
console.log('wall ' + ((performance.now() - t0) / 1000).toFixed(2) + ' s');
console.log((FAILED ? 'RED ' : 'GREEN ') + 'sturmianreg.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
