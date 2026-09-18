/* tests/molecular-register.test.mjs — the STATE REGISTER's mathematics (lab/molecular-register.js) and the worker's
 * canonical state ladder (chem.states / chem.state.vectors), in node.
 *
 *   §1  the pair form against the state-pair form: ΔD_MO and Im D_MO from Z(t) equal Σ b̄_A b_B e^{i(E_A−E_B)t} γ^{AB},
 *       with the γ blocks written out from proving/LEDGER.md Proposition 3 — a second route through the same physics
 *   §2  N-representability at full amplitude: occupations in [0, 2], trace N, for random complex registers and times
 *   §3  the canonical gauge on the wire: benzene's bright pair lands on (μ, 0, 0), (0, μ, 0); f and ω agree with the
 *       shipped TDA ladder; the vectors are unit and orthogonal
 *   §4  RING: a quarter turn on the pair is a dipole of constant length turning uniformly at ω; the other quarter
 *       turns the other way
 *   §5  MEAN: the reference removes exactly the stationary part (the period average of what is left is zero) and
 *       leaves the dipole alone
 *   §6  the kick preset has Proposition 2's phases: the dipole along the kick rises as +sin
 *   §7  slerp: endpoints, unit norm, the orthogonal case is cos/sin, a global phase on B changes nothing
 *   §8  presets by rule: water has no ring and says why; every lane a preset names exists
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chemRegister, chemGround, chemStates, chemStateVectors, chemSpectrum } from '../lab/mathworker.js';
import { moleculeAtoms } from '../lab/molecules.js';
import { hermitianEigen } from '../lab/density.js';
import { moleculeRHF, canonicalOrbitals } from '../lab/rhf-molecule.js';
import { GROUND, createStatesModel, slerpCoefficients, presetLanes, beatsOf, softCapLevels, PRESETS } from '../lab/molecular-register.js';

chemRegister('sto-3g', JSON.parse(fs.readFileSync(new URL('../lab/vendor/bse/sto-3g-v1.json', import.meta.url), 'utf8')));
let seed = 20260918; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32 - 0.5;

function load(id, want) {
  const msg = { atoms: moleculeAtoms(id), basis: 'sto-3g', charge: 0 };
  const g = chemGround(msg), st = chemStates(msg), sp = chemSpectrum(msg);
  const ks = want(st), v = chemStateVectors({ ks });
  const model = createStatesModel({ n: st.n, nocc: st.nocc, C: g.C, D0: g.D, rMO: st.rMO });
  ks.forEach((k, r) => model.addState(k, st.omega[k], v.X.subarray(r * v.count, (r + 1) * v.count)));
  return { g, st, sp, ks, v, model };
}
/** γ^{AB}_pq = ⟨A|E_pq|B⟩ from the ledger's Proposition 3 — deliberately NOT the pair form */
function gammaOf(n, nocc, XA, XB) {
  const nv = n - nocc, g = new Float64Array(n * n);
  if (!XA && !XB) { for (let i = 0; i < nocc; i++) g[i * n + i] = 2; return g; }
  if (!XA) { for (let i = 0; i < nocc; i++) for (let a = 0; a < nv; a++) g[i * n + nocc + a] = Math.SQRT2 * XB[i * nv + a]; return g; }
  if (!XB) { for (let i = 0; i < nocc; i++) for (let a = 0; a < nv; a++) g[(nocc + a) * n + i] = Math.SQRT2 * XA[i * nv + a]; return g; }
  let ov = 0; for (let p = 0; p < XA.length; p++) ov += XA[p] * XB[p];
  for (let i = 0; i < nocc; i++) for (let j = 0; j < nocc; j++) { let s = 0; for (let a = 0; a < nv; a++) s += XA[j * nv + a] * XB[i * nv + a]; g[i * n + j] = (i === j ? 2 * ov : 0) - s; }
  for (let a = 0; a < nv; a++) for (let b = 0; b < nv; b++) { let s = 0; for (let i = 0; i < nocc; i++) s += XA[i * nv + a] * XB[i * nv + b]; g[(nocc + a) * n + nocc + b] = s; }
  return g;
}

/* ── §1, §2 · water and benzene ─────────────────────────────────────────────────────────────────────────── */
for (const id of ['H2O', 'C6H6']) {
  const { st, ks, v, model } = load(id, (s) => [...s.f.keys()].sort((a, b) => s.f[b] - s.f[a]).slice(0, 4).sort((a, b) => a - b));
  const n = st.n, nocc = st.nocc, keys = [GROUND, ...ks], X = (key) => (key === GROUND ? null : v.X.subarray(ks.indexOf(key) * v.count, (ks.indexOf(key) + 1) * v.count));
  const E = (key) => (key === GROUND ? 0 : st.omega[key]);
  let worstRe = 0, worstIm = 0, occMin = Infinity, occMax = -Infinity, trErr = 0;
  for (let trial = 0; trial < 12; trial++) {
    const lanes = keys.map((key) => ({ key, re: rnd(), im: rnd() })), t = 40 * rnd();
    const s = model.evaluate(lanes, t, 'ground'), im = model.imagMO(), nrm = Math.sqrt(s.norm2);
    const re2 = new Float64Array(n * n), im2 = new Float64Array(n * n);
    for (const A of lanes) for (const B of lanes) {
      const g = gammaOf(n, nocc, X(A.key), X(B.key)), ph = (E(A.key) - E(B.key)) * t, c = Math.cos(ph), sn = Math.sin(ph);
      const wr0 = (A.re * B.re + A.im * B.im) / (nrm * nrm), wi0 = (A.re * B.im - A.im * B.re) / (nrm * nrm), wr = wr0 * c - wi0 * sn, wi = wr0 * sn + wi0 * c;
      for (let k = 0; k < n * n; k++) { re2[k] += wr * g[k]; im2[k] += wi * g[k]; }
    }
    for (let i = 0; i < nocc; i++) re2[i * n + i] -= 2;                           // against the ground state
    /* D is Hermitian: the density sees Re D symmetrised, which is what the model keeps */
    for (let p = 0; p < n; p++) for (let q = 0; q < n; q++) {
      worstRe = Math.max(worstRe, Math.abs(0.5 * (re2[p * n + q] + re2[q * n + p]) - model.deltaMO[p * n + q]));
      worstIm = Math.max(worstIm, Math.abs(0.5 * (im2[p * n + q] - im2[q * n + p]) - im[p * n + q]));
    }
    const D = { n, re: Float64Array.from(model.deltaMO), im: Float64Array.from(im) };
    for (let i = 0; i < nocc; i++) D.re[i * n + i] += 2;
    let tr = 0; for (let p = 0; p < n; p++) tr += D.re[p * n + p]; trErr = Math.max(trErr, Math.abs(tr - 2 * nocc));
    const w = hermitianEigen(D).w; occMin = Math.min(occMin, w[0]); occMax = Math.max(occMax, w[n - 1]);
  }
  assert(worstRe < 1e-12 && worstIm < 1e-12, `${id}: pair form vs state-pair form, Re ${worstRe} Im ${worstIm}`);
  assert(occMin > -1e-10 && occMax < 2 + 1e-10 && trErr < 1e-10, `${id}: occupations [${occMin}, ${occMax}], trace error ${trErr}`);
  console.log(`PASS ${id}: pair form = Σ b̄_A b_B e^{iΔEt} γ^{AB} to Re ${worstRe.toExponential(2)} / Im ${worstIm.toExponential(2)}; 12 random complex registers keep occupations in [${occMin.toExponential(2)}, 2 + ${(occMax - 2).toExponential(2)}], trace error ${trErr.toExponential(2)}.`);
}

/* ── §3, §4, §5 · benzene's bright pair ─────────────────────────────────────────────────────────────────── */
{
  const ring = (s) => presetLanes('RING', s).lanes.filter((l) => l.key !== GROUND).map((l) => l.key);
  const { st, sp, ks, v, model } = load('C6H6', ring);
  const [kx, ky] = ks, mu = (k) => [st.mu[3 * k], st.mu[3 * k + 1], st.mu[3 * k + 2]];
  assert.equal(st.size[kx], 2); assert.equal(ky, kx + 1);
  assert(Math.abs(mu(kx)[1]) < 1e-9 && Math.abs(mu(kx)[2]) < 1e-9 && mu(kx)[0] > 1, `lane x is along x: ${mu(kx)}`);
  assert(Math.abs(mu(ky)[0]) < 1e-9 && Math.abs(mu(ky)[2]) < 1e-9 && mu(ky)[1] > 1, `lane y is along y: ${mu(ky)}`);
  assert(Math.abs(mu(kx)[0] - mu(ky)[1]) < 1e-9, 'an E pair has equal dipole lengths in every gauge');
  assert(Math.abs(sp.tda[kx].omega - st.omega[kx]) < 1e-14 && Math.abs(sp.tda[kx].f - st.f[kx]) < 1e-14, 'the shipped TDA ladder is the canonical one');
  let dot = 0, n0 = 0, n1 = 0; for (let p = 0; p < v.count; p++) { dot += v.X[p] * v.X[v.count + p]; n0 += v.X[p] ** 2; n1 += v.X[v.count + p] ** 2; }
  assert(Math.abs(dot) < 1e-12 && Math.abs(n0 - 1) < 1e-12 && Math.abs(n1 - 1) < 1e-12, 'unit, orthogonal vectors');
  const w = st.omega[kx], T = 2 * Math.PI / w;
  for (const [quarter, sense] of [[Math.PI / 2, +1], [1.5 * Math.PI, -1]]) {
    const lanes = [{ key: GROUND, re: 0.8, im: 0 }, { key: kx, re: 0.42, im: 0 }, { key: ky, re: 0.42 * Math.cos(quarter), im: 0.42 * Math.sin(quarter) }];
    const mags = [], angs = [];
    for (let k = 0; k < 16; k++) { const s = model.evaluate(lanes, T * k / 16, 'ground'); mags.push(Math.hypot(s.dipole[0], s.dipole[1])); angs.push(Math.atan2(s.dipole[1], s.dipole[0])); assert(Math.abs(s.dipole[2]) < 1e-12); }
    let turn = 0; for (let k = 1; k < 16; k++) { let da = angs[k] - angs[k - 1]; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; turn += da; }
    assert(Math.max(...mags) - Math.min(...mags) < 1e-10 && mags[0] > 0.5, `constant dipole length: ${Math.min(...mags)} … ${Math.max(...mags)}`);
    assert(Math.abs(Math.abs(turn) - 2 * Math.PI * 15 / 16) < 1e-9, `uniform turn: ${turn}`);
    ring[quarter === Math.PI / 2 ? 'a' : 'b'] = turn;
    if (sense === +1) console.log(`PASS RING: |δμ| = ${mags[0].toFixed(9)} constant to ${(Math.max(...mags) - Math.min(...mags)).toExponential(1)}, turning ${(turn / (2 * Math.PI)).toFixed(6)} of a revolution in 15/16 of T = ${T.toFixed(4)} a.u. = ${(T * 24.188843).toFixed(1)} as.`);
  }
  assert(Math.sign(ring.a) === -Math.sign(ring.b), 'the other quarter turns the other way');
  /* §5 MEAN: what is left averages to zero over a period; the ground reference does not (the population moved) */
  const lanes = [{ key: GROUND, re: 0.8, im: 0 }, { key: kx, re: 0.42, im: 0 }, { key: ky, re: 0, im: 0.42 }], N = 32, n2 = st.n * st.n;
  const avgM = new Float64Array(n2), avgG = new Float64Array(n2); let dipDiff = 0;
  for (let k = 0; k < N; k++) {
    const t = T * k / N, a = [...model.evaluate(lanes, t, 'ground').dipole]; for (let q = 0; q < n2; q++) avgG[q] += model.deltaMO[q] / N;
    const b = [...model.evaluate(lanes, t, 'mean').dipole]; for (let q = 0; q < n2; q++) avgM[q] += model.deltaMO[q] / N;
    dipDiff = Math.max(dipDiff, Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]));
  }
  const maxM = Math.max(...avgM.map(Math.abs)), maxG = Math.max(...avgG.map(Math.abs));
  assert(maxM < 1e-12 && maxG > 1e-2, `period average: MEAN ${maxM}, GROUND ${maxG}`);
  assert(dipDiff < 1e-12, 'the reference is a view, the dipole is the state’s');
  const P = model.product('signed'); let peak = 0; for (const x of P) peak = Math.max(peak, Math.abs(x));
  assert(Math.abs(peak - 1) < 1e-6 && model.state.scale > 0, 'the signed product is normalised and carries its scale');
  console.log(`PASS MEAN: the period average of the MEAN-referenced change is ${maxM.toExponential(1)} (GROUND's is ${maxG.toFixed(4)}: the population moved); the signed product is normalised, scale ${model.state.scale.toExponential(3)}.`);
}

/* ── §6 · the kick's phases, on water ───────────────────────────────────────────────────────────────────── */
{
  const kick = (s) => presetLanes('KICK Y', s).lanes.filter((l) => l.key !== GROUND).map((l) => l.key);
  const { st, model } = load('H2O', kick);
  const P = presetLanes('KICK Y', st), lanes = P.lanes.map((l) => ({ key: l.key, re: l.amp * Math.cos(l.phase), im: l.amp * Math.sin(l.phase) }));
  assert(Math.abs(lanes.reduce((s, l) => s + l.re * l.re + l.im * l.im, 0) - 1) < 1e-12, 'a preset is normalised');
  const d0 = model.evaluate(lanes, 0, 'ground').dipole[1], d1 = model.evaluate(lanes, 0.05, 'ground').dipole[1];
  assert(Math.abs(d0) < 1e-12 && d1 > 1e-4, `δμ_y(0) = ${d0}, δμ_y(0.05) = ${d1}: the electronic dipole rises as +sin after b_K = −iκμ_K`);
  console.log(`PASS KICK: ${P.lanes.length - 1} states, δμ_y(0) = ${d0.toExponential(1)}, δμ_y(0.05) = +${d1.toExponential(3)} — Proposition 2's phases.`);
}

/* ── §7 · slerp ─────────────────────────────────────────────────────────────────────────────────────────── */
{
  const A = new Map([[GROUND, { re: 1, im: 0 }]]), B = new Map([[3, { re: 0, im: 2 }]]);
  for (const s of [0, 0.25, 0.5, 1]) {
    const M = slerpCoefficients(A, B, s), a = M.get(GROUND), b = M.get(3);
    assert(Math.abs(Math.hypot(a.re, a.im) - Math.cos(s * Math.PI / 2)) < 1e-12 && Math.abs(Math.hypot(b.re, b.im) - Math.sin(s * Math.PI / 2)) < 1e-12, `orthogonal anchors at s = ${s}`);
  }
  const U = new Map([[GROUND, { re: 0.6, im: 0.1 }], [1, { re: 0.2, im: -0.7 }], [2, { re: 0.3, im: 0 }]]), V = new Map([[GROUND, { re: 0.1, im: 0.5 }], [1, { re: 0.4, im: 0.4 }], [5, { re: -0.3, im: 0.2 }]]);
  let worst = 0;
  for (let k = 0; k <= 10; k++) { let s2 = 0; for (const c of slerpCoefficients(U, V, k / 10).values()) s2 += c.re ** 2 + c.im ** 2; worst = Math.max(worst, Math.abs(s2 - 1)); }
  assert(worst < 1e-12, `unit norm along the path: ${worst}`);
  const ph = 1.234, W = new Map([...U].map(([k, c]) => [k, { re: c.re * Math.cos(ph) - c.im * Math.sin(ph), im: c.re * Math.sin(ph) + c.im * Math.cos(ph) }]));
  const nU = Math.sqrt([...U.values()].reduce((s, c) => s + c.re ** 2 + c.im ** 2, 0));
  for (const s of [0, 0.3, 1]) for (const [k, c] of slerpCoefficients(U, W, s)) assert(Math.abs(c.re - U.get(k).re / nU) < 1e-12 && Math.abs(c.im - U.get(k).im / nU) < 1e-12, 'B = e^{iα}A is the same ray: the path stands still');
  console.log(`PASS slerp: cos/sin for orthogonal anchors, unit norm to ${worst.toExponential(1)} along a general path, and a global phase on B moves nothing.`);
}

/* ── §8 · presets by rule ───────────────────────────────────────────────────────────────────────────────── */
{
  const w = chemStates({ atoms: moleculeAtoms('H2O'), basis: 'sto-3g', charge: 0 }), b = chemStates({ atoms: moleculeAtoms('C6H6'), basis: 'sto-3g', charge: 0 });
  const ringW = presetLanes('RING', w); assert.equal(ringW.lanes, null); assert.match(ringW.why, /no bright degenerate pair/);
  for (const [id, L] of [['H2O', w], ['C6H6', b]]) for (const name of PRESETS) {
    const P = presetLanes(name, L); if (!P.lanes) { assert(P.why.length > 10); continue; }
    assert(P.lanes.length <= 8 && P.lanes[0].key === GROUND, `${id} ${name}`);
    for (const l of P.lanes) assert(l.key === GROUND || (l.key >= 0 && l.key < L.count && L.omega[l.key] < 3), `${id} ${name} names a valence state`);
  }
  const beats = beatsOf([{ key: GROUND, energy: 0, amp: 0.8 }, { key: 3, energy: 0.39, amp: 0.4 }, { key: 4, energy: 0.39, amp: 0.4 }]);
  assert.equal(beats.length, 2, 'a degenerate pair does not beat against itself');
  const y = softCapLevels([-20.2, -1.3, -0.6, -0.4, 0.6]); assert(y[0] === 0 && Math.abs(y[4] - 1) < 1e-12 && Math.abs(y[1] - 3 / 4.9) < 1e-12 && y[1] < 18.9 / 20.8, 'the soft cap clamps the core gap at three median gaps (0.61 of the plot, where a linear axis gives it 0.91)');
  console.log('PASS presets: every preset is a rule — water refuses RING with a sentence, benzene gets all seven; a degenerate pair has no self-beat; the ladder map is soft-capped.');
}

/* ── §9 · the orbitals' canonical gauge: a function of each level's span, so a scrambled solver changes nothing ── */
{
  const sol = moleculeRHF({ atoms: moleculeAtoms('C6H6'), basis: 'sto-3g', detect: false, stability: false, hessian: false }), I = sol.integrals, n = I.n, eps = sol.orbitalEnergies;
  const C2 = Float64Array.from(sol.C); let pairs = 0;
  for (let k = 0; k + 1 < n; k++) if (Math.abs(eps[k + 1] - eps[k]) < 1e-8) {   // rotate every degenerate pair by its own angle, and flip a sign or two
    const a = 0.3 + k, c = Math.cos(a), sn = Math.sin(a); pairs++;
    for (let u = 0; u < n; u++) { const x = C2[u * n + k], y = C2[u * n + k + 1]; C2[u * n + k] = c * x - sn * y; C2[u * n + k + 1] = -(sn * x + c * y); }
    k++;
  }
  for (let u = 0; u < n; u++) C2[u * n] = -C2[u * n];
  const back = canonicalOrbitals(I.S, C2, eps, n); let worst = 0, D = 0;
  for (let k = 0; k < n * n; k++) worst = Math.max(worst, Math.abs(back[k] - sol.C[k]));
  for (let u = 0; u < n; u++) for (let w = 0; w < n; w++) { let s = 0; for (let o = 0; o < sol.nocc; o++) s += 2 * sol.C[u * n + o] * sol.C[w * n + o]; D = Math.max(D, Math.abs(s - sol.D[u * n + w])); }
  assert(pairs >= 6 && worst < 1e-10 && D < 1e-10, `canonical orbitals: ${pairs} pairs scrambled, recovered to ${worst}; density from canonical C off by ${D}`);
  console.log(`PASS the orbitals' gauge: ${pairs} degenerate pairs of benzene rotated and sign-flipped, canonicalOrbitals returns the solver's own canonical C to ${worst.toExponential(1)}; the density is untouched (${D.toExponential(1)}).`);
}
