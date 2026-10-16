/* tests/ellipsoid.test.mjs — 0.8.3 B3: THE UNCERTAINTY ELLIPSOID Σ_ij = ⟨r_i r_j⟩ − ⟨r_i⟩⟨r_j⟩ against closed forms.   node tests/ellipsoid.test.mjs */
import { Register } from '../lab/state.js';
import { BASIS } from '../lab/hydrogen.js';
import { setHamiltonian } from '../lab/hamiltonian.js';
import { covariance } from '../lab/calculus.js';
import { angularDipoleZ } from '../lab/dynamics.js';
import { applyRotor } from '../lab/frontier.js';
import { AXIS_TO_Z } from '../lab/kick.js';
let FAILED = 0;
const judge = (name, ok, d) => { if (!ok) FAILED++; console.log((ok ? 'GREEN ' : 'RED   ') + name + (d === undefined ? '' : '  ' + JSON.stringify(d))); };
const idx = (n, l, m) => BASIS.findIndex((s) => s.n === n && s.l === l && s.m === m), dev = (A, B) => Math.max(...A.flat().map((v, i) => Math.abs(v - B.flat()[i])));
const R = new Register(), put = (...ls) => { R.clear(); for (const l of ls) R.set(idx(...l), 1, 0); R.normalize(); };
const r2nl = (n, l) => n * n * (5 * n * n + 1 - 3 * l * (l + 1)) / 2, gapOf = (E) => Math.abs(E.S[0][0] + E.S[1][1] + E.S[2][2] - E.r2 + E.mean.reduce((s, v) => s + v * v, 0));
setHamiltonian('hydrogen');
put([1, 0, 0]); const e1 = covariance(R, 0), s1 = r2nl(1, 0) / 3;
judge('E 1s: Σ = (⟨r²⟩/3)·I with ⟨r²⟩ = 3 exactly (its own road too), so σ = 1 a₀ on every axis, to 1e-12', dev(e1.S, [[s1, 0, 0], [0, s1, 0], [0, 0, s1]]) < 1e-12 && Math.max(...e1.lam.map((l) => Math.abs(Math.sqrt(l) - 1))) < 1e-12 && Math.abs(e1.r2 - 3) < 1e-12, e1.lam);
/* 2p₀: ⟨cos²θ⟩ = Σ_{l″ = 0, 2} ⟨l″ 0|cos θ|1 0⟩² and ⟨sin²θ cos²φ⟩ = (1 − ⟨cos²θ⟩)/2, each times ⟨r²⟩_{2,1} */
put([2, 1, 0]); const e2 = covariance(R, 0), c2 = angularDipoleZ(0, 0, 1, 0) ** 2 + angularDipoleZ(2, 0, 1, 0) ** 2, z2 = r2nl(2, 1) * c2, x2 = r2nl(2, 1) * (1 - c2) / 2;
judge('E 2p₀: Σ = diag(⟨x²⟩, ⟨y²⟩, ⟨z²⟩) from ⟨r²⟩_{2,1} = 30 and the angular factors (3/5, 1/5, computed) to 1e-10', dev(e2.S, [[x2, 0, 0], [0, x2, 0], [0, 0, z2]]) < 1e-10 && Math.abs(e2.r2 - 30) < 1e-10 && Math.abs(c2 - 0.6) < 1e-15, { S: e2.S, z2, x2 });
put([2, 0, 0], [2, 1, 0]); const gs = [0, 50, 500].map((t) => gapOf(covariance(R, t)));
judge('E the Stark state (2s + 2p₀)/√2: tr Σ = ⟨r²⟩ − |⟨r⟩|² to 1e-10 at t = 0, 50, 500', Math.max(...gs) < 1e-10, gs);
put([1, 0, 0], [2, 0, 0], [2, 1, 0]); const bt = [0, 3, 7].map((t) => covariance(R, t)), tr = bt.map((E) => E.S[0][0] + E.S[1][1] + E.S[2][2]);
judge('E 1s + 2s + 2p₀: the trace law holds at t = 0, 3, 7 while Σ breathes (1e-10)', Math.max(...bt.map(gapOf)) < 1e-10 && Math.abs(tr[0] - tr[1]) > 1e-3, tr);
const lone = (E) => E.axes[[0, 1, 2].find((q) => [0, 1, 2].every((p) => p === q || Math.abs(E.lam[p] - E.lam[q]) > 1e-6))].map(Math.abs);
put([2, 0, 0], [2, 1, 0]); const ez = covariance(R, 0), a = Float64Array.from(R.re0), i = Float64Array.from(R.im0); applyRotor(a, i, { axis: AXIS_TO_Z.x.axis, angle: -AXIS_TO_Z.x.angle });   // the slap's rotor, run back: ẑ → x̂
R.setAnchorAt(a, i, 0); const ex = covariance(R, 0), srt = (E) => [...E.lam].sort((p, q) => p - q);
judge('E the Stark state turned to x̂ by the slap\'s rotor: its lone principal axis follows ẑ → x̂ with the same σ (1e-10)', dev(lone(ez), [0, 0, 1]) < 1e-10 && dev(lone(ex), [1, 0, 0]) < 1e-10 && dev(srt(ez), srt(ex)) < 1e-10, { z: srt(ez), axis: lone(ex) });
if (FAILED) { console.log(`${FAILED} RED`); process.exit(1); } else console.log('ellipsoid: all green');
