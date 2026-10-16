/* tests/bead-ray.test.mjs — 0.8.2 P3: THE BEAD (⟨x⟩, ⟨y⟩, ⟨z⟩) and ψ ALONG A RAY, against closed forms.   node tests/bead-ray.test.mjs */
import { Register } from '../lab/state.js';
import { BASIS } from '../lab/hydrogen.js';
import { setHamiltonian, getHamiltonian } from '../lab/hamiltonian.js';
import { beadOf, expectR, rayAt } from '../lab/calculus.js';
import { applyRotor } from '../lab/frontier.js';
import { AXIS_TO_Z } from '../lab/kick.js';
let FAILED = 0;
const judge = (name, ok, d) => { if (!ok) FAILED++; console.log((ok ? 'GREEN ' : 'RED   ') + name + (d === undefined ? '' : '  ' + JSON.stringify(d))); };
const idx = (n, l, m) => BASIS.findIndex((s) => s.n === n && s.l === l && s.m === m), dev = (a, b) => Math.max(...a.map((v, i) => Math.abs(v - b[i])));
const R = new Register(), put = (...ls) => { R.clear(); for (const l of ls) R.set(idx(...l), 1, 0); R.normalize(); return R.at(0); };
setHamiltonian('hydrogen');
put([1, 0, 0]); const b1 = beadOf(R, 0);
judge('B ⟨r⟩ of 1s is (0, 0, 0) to 1e-12, and one level has no trail period', dev(b1.r, [0, 0, 0]) < 1e-12 && b1.T === Infinity, b1.r);
/* the tree's phases: R_nl > 0 near the origin, Condon–Shortley Y_lm — so ⟨2s|z|2p₀⟩ = (1/√3)·(−3√3) = −3 and (2s + 2p₀)/√2 leans to −z */
const c = put([2, 0, 0], [2, 1, 0]), bs = beadOf(R, 0);
judge('B ⟨r⟩ of the Stark state (2s + 2p₀)/√2 is (0, 0, −3) a₀ to 1e-12', dev(bs.r, [0, 0, -3]) < 1e-12, bs.r);
const a = Float64Array.from(c.re), i = Float64Array.from(c.im); applyRotor(a, i, { axis: AXIS_TO_Z.x.axis, angle: -AXIS_TO_Z.x.angle });   // the slap's rotor, run back: ẑ → x̂
const ids = BASIS.map((s) => s.index).filter((k) => a[k] || i[k]), rx = expectR(a, i, ids), d2 = (x) => { const v = getHamiltonian().psiAt(a, i, x, 0, 0, ids); return v.re * v.re + v.im * v.im; };
judge('B the Stark state turned to x̂ has ⟨r⟩ = (−3, 0, 0), and its density leans to −x (|ψ(−3,0,0)|² > |ψ(3,0,0)|²: the rotor\'s sign, convention-free)', dev(rx, [-3, 0, 0]) < 1e-12 && d2(-3) > d2(3), rx);
put([1, 0, 0], [2, 1, 0]); const bt = beadOf(R, 0);
judge('B 1s + 2p₀ beats along z with its trail period 2π/(3/8)', Math.abs(bt.r[2]) > 0.5 && Math.abs(bt.T - 16 * Math.PI / 3) < 1e-12, bt);
const c1 = put([1, 0, 0]), s1 = rayAt(c1.re, c1.im, R.populated(), [0, 0, 1], 20);
judge('R the ray of 1s matches e^{−r}/√π at all 128 points to 1e-12 (Im 0)', s1.length === 128 && Math.max(...s1.map((q) => Math.abs(q.re - Math.exp(-q.s) / Math.sqrt(Math.PI)) + Math.abs(q.im))) < 1e-12);
judge('R the 1s ray\'s |ψ|² integrates to 1 over the sphere (4π∫|ψ|²s²ds, trapezoid on the 128 points to 1e-3)', Math.abs(4 * Math.PI * s1.reduce((t, q, k) => t + (k && k < 127 ? 1 : 0.5) * (q.re * q.re) * q.s * q.s, 0) * s1[1].s - 1) < 1e-3);
setHamiltonian('qho'); const c0 = put([1, 0, 0]), s0 = rayAt(c0.re, c0.im, R.populated(), [0.6, 0, 0.8], 6);
judge('R the oscillator\'s |0⟩ along any ray matches π^{−3/4} e^{−r²/2} to 1e-12', Math.max(...s0.map((q) => Math.abs(Math.hypot(q.re, q.im) - Math.PI ** -0.75 * Math.exp(-q.s * q.s / 2)))) < 1e-12);
setHamiltonian('hydrogen');
if (FAILED) { console.log(`${FAILED} RED`); process.exit(1); } else console.log('bead-ray: all green');
