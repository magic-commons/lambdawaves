/* tests/breath.test.mjs — 0.8.3 B1: THE RADIAL BREATH P(r, t) and REVIVAL's clocks, against closed forms and CALCULUS's own ⟨r⟩.   node tests/breath.test.mjs */
import { Register, PRESET_BY_ID } from '../lab/state.js';
import { BASIS } from '../lab/hydrogen.js';
import { setHamiltonian } from '../lab/hamiltonian.js';
import { stats, radialBreath } from '../lab/calculus.js';
import { revivalClocks } from '../lab/frontier.js';
import { densityPeriod } from '../lab/period.js';
let FAILED = 0;
const judge = (name, ok, d) => { if (!ok) FAILED++; console.log((ok ? 'GREEN ' : 'RED   ') + name + (d === undefined ? '' : '  ' + JSON.stringify(d))); };
const idx = (n, l, m) => BASIS.findIndex((s) => s.n === n && s.l === l && s.m === m), R = new Register();
const put = (...ls) => { R.clear(); for (const l of ls) R.set(idx(...l), 1, 0); R.normalize(); return R; }, pre = (id) => { R.load(PRESET_BY_ID.get(id)); return R; };
const rOf = (t) => stats(R, t).rows.find((q) => q.name === '⟨r⟩').value, pts = (B, f) => Math.max(...Array.from(B.P).map((p, k) => (B.r[k] < 40 ? Math.abs(p - f(B.r[k])) : 0)));
setHamiltonian('hydrogen');
/* the oracles: ∫P dr = Σ|c|² (the radials orthonormal within each (l, m)), and ∫rP/∫P = ⟨r⟩ — stats' bilinear form on dynamics' Gauss–Legendre rule, a different road */
const rows = [['1s', () => put([1, 0, 0]), 7], ['(2s + 2p₀)/√2', () => put([2, 0, 0], [2, 1, 0]), 16], ['rydberg', () => pre('rydberg'), 92], ['rydberg-s', () => pre('rydberg-s'), 92]].map(([id, mk, half]) => {
  mk(); const d = [0, 50, 500].map((t) => { const B = radialBreath(R, t, half); return { t, dN: B.norm - R.norm2(), dr: B.rMean - rOf(t), r: B.rMean }; });
  return { id, dN: Math.max(...d.map((x) => Math.abs(x.dN))), dr: Math.max(...d.map((x) => Math.abs(x.dr))), r: d.map((x) => +x.r.toFixed(6)) }; });
judge('B ∫P dr = Σ|c|² to 1e-10 at t = 0, 50, 500 (1s, the Stark state, rydberg, rydberg-s; 256 nodes)', rows.every((x) => x.dN < 1e-10), rows.map((x) => [x.id, x.dN.toExponential(1)]));
judge('B ∫rP/∫P = CALCULUS\'s ⟨r⟩ to 1e-8 at the same three t', rows.every((x) => x.dr < 1e-8), rows.map((x) => [x.id, x.dr.toExponential(1)]));
judge('B the circular packet\'s P(r) stands still (one n per (l, m)); the radial packet breathes', rows[2].r.every((v) => v === rows[2].r[0]) && Math.abs(rows[3].r[2] - rows[3].r[0]) > 5, [rows[2].r, rows[3].r]);
put([1, 0, 0]); const b1 = radialBreath(R, 0, 7);
judge('B P(r, 0) of 1s is 4r²e^{−2r} pointwise to 1e-12', pts(b1, (r) => 4 * r * r * Math.exp(-2 * r)) < 1e-12);
setHamiltonian('qho'); R.clear(); R.set(0, 1, 0); const b0 = radialBreath(R, 0, 6);
judge('B the oscillator\'s |0⟩ breathes as its Gaussian (4/√π) r² e^{−r²}, and ∫P = 1 to 1e-10', pts(b0, (r) => 4 / Math.sqrt(Math.PI) * r * r * Math.exp(-r * r)) < 1e-12 && Math.abs(b0.norm - 1) < 1e-10);
setHamiltonian('hydrogen'); pre('rydberg-s');
/* REVIVAL's clocks: n̄ the populated labels' norm-weighted mean; T_cl and T_rev are LADDER's revivalClocks. LADDER's law is exact to QUADRATIC order in n − n̄: at n̄ = 5 on
   three levels the cubic phase β₃ = 8πσ³/3n̄ is not small, so A(T_rev) misses A(0) — the miss is printed, not gated; the register's own recurrence is exact (densityPeriod) */
const ids = R.populated(), nb = ids.reduce((s, a) => s + BASIS[a].n * R.population(a), 0) / R.norm2(), C = revivalClocks(nb), A = (t) => R.autocorrelation(t).abs ** 2, P = densityPeriod(ids.map((a) => R.E[a]));
const near = Array.from({ length: 2001 }, (_, k) => C.Trev + (k / 1000 - 1) * C.Tcl).reduce((b, t) => (A(t) > b.A ? { t, A: A(t) } : b), { A: 0 });
console.log(`      n̄ ${nb.toFixed(6)} · T_cl ${C.Tcl.toFixed(3)} · T_rev ${C.Trev.toFixed(3)} = ${(C.Trev / C.Tcl).toFixed(4)} T_cl · A(0) ${A(0).toFixed(6)} · A(T_rev) ${A(C.Trev).toFixed(6)} (miss ${(1 - A(C.Trev)).toFixed(4)}) · peak ${near.A.toFixed(4)} at T_rev ${((near.t - C.Trev) / C.Tcl).toFixed(3)} T_cl · β₃(σ=1) ${C.beta3.toFixed(3)} rad`);
judge('R n̄ = 5 and T_cl = 2πn̄³, T_rev = 4πn̄⁴/3 to 1e-12; the register recurs exactly at its density period (A = 1 to 1e-10)', Math.abs(nb - 5) < 1e-12 && Math.abs(C.Tcl - 250 * Math.PI) < 1e-9 && Math.abs(C.Trev - 2500 * Math.PI / 3) < 1e-9 && P.exact && Math.abs(A(P.T) - 1) < 1e-10, { T: P.T });
if (FAILED) { console.log(`${FAILED} RED`); process.exit(1); } else console.log('breath: all green');
