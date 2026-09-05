/* tests/math-audit.test.mjs — W-ORBIT-GATE: the ORBIT card's coherence criterion, and the audit counterexamples
 * that made it necessary (ledger research/MATH-MOLECULAR-PULSES-2026-09-05.md §2.1 A1–A3, §2.6 C4).
 *   node tests/math-audit.test.mjs
 *
 * THE CLAIM UNDER TEST.  A shell n is V_j ⊗ V_j with j = (n−1)/2.  The Clebsch matrix's Schmidt spectrum says
 * whether the two rotors are SEPARABLE (rank one) and nothing more for n ≥ 3; SO(4) COHERENCE is the strictly
 * stronger statement |⟨J₊⟩| = |⟨J₋⟩| = j, equivalently the saturation of ONE SO(4)-invariant scalar,
 *     |⟨L⟩|² + |⟨K⟩|² = 2(|⟨J₊⟩|² + |⟨J₋⟩|²) = (n−1)²,
 * since each length is separately bounded by j and (n−1)² = 4j².  The card printed the rank-one test and called
 * |1,0⟩⊗|1,0⟩ — the register state −0.577350·3s + 0.816497·3d₀, which has NO angular momentum at all — "rank one ·
 * COHERENT (a Kepler ellipse)" with e = 0.  Wave 49 gates the scalar, the regression, and the label itself.
 *
 * The last block is the OTHER audit finding, kept: the moving-basis norm derivative that the Ehrenfest branch's
 * renormalisation used to absorb.  It is the metric half of the connection wave 49 puts into mo.js (see
 * tests/mo.test.mjs W49), and it is judged here against its closed form.
 * Oracles: lab/frontier.js's own shellMatrix / schmidt / rotorExpectations / applyRotor, the closed form
 * S'(R)/(1+S(R)) with S = e^{-R}(1 + R + R²/3), and Astra's -0.170613679949 per bohr at R = 2.
 */
import { readFileSync } from 'node:fs';
import { BASIS } from '../lab/hydrogen.js';
import { shellCharacter, shellCoefficients, shellMatrix, applyRotor } from '../lab/frontier.js';
import { createMO } from '../lab/mo.js';

let FAILED = 0, TOTAL = 0;
function judge(name, ok, detail) {
  TOTAL++; if (!ok) FAILED++;
  console.log((ok ? 'GREEN ' : 'RED   ') + name + (detail === undefined ? '' : '\n      ' + JSON.stringify(detail).slice(0, 400)));
}
const T0 = performance.now();
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const sig = (v, d = 8) => +v.toPrecision(d);
/** |j,m₊=j−p⟩ ⊗ |j,m₋=j−q⟩ as a Clebsch matrix of the shell n (a product state: rank one by construction) */
const product = (n, p, q) => { const re = new Float64Array(n * n); re[p * n + q] = 1; return { n, re, im: new Float64Array(n * n), norm2: 1 }; };
const toRegister = (M, n) => { const re = new Float64Array(BASIS.length), im = new Float64Array(BASIS.length); shellCoefficients(M, n, re, im); return { re, im }; };
const OLD_CRITERION = (S) => S[0] > 0.9995;                       // what orbit.js read before the audit

/* ── A1  the counterexample: rank one, zero polarisation, and the register state it really is ────────────── */
{
  const M = product(3, 1, 1), C = shellCharacter(M), { re, im } = toRegister(M, 3);
  const a3s = BASIS.findIndex((b) => b.n === 3 && b.l === 0 && b.m === 0);
  const a3d = BASIS.findIndex((b) => b.n === 3 && b.l === 2 && b.m === 0);
  const others = BASIS.filter((b) => b.n === 3 && !(b.l === 0 && b.m === 0) && !(b.l === 2 && b.m === 0));
  judge('A1 |1,0⟩⊗|1,0⟩ IS the register state −0.577350·3s + 0.816497·3d₀ (1e-6, every other n = 3 label zero to 1e-12): Schmidt (1, 0, 0) — RANK ONE — with |⟨L⟩| = |⟨K⟩| = 0 and e = 0, so it is NOT coherent; the scalar |⟨L⟩|² + |⟨K⟩|² = 0 against its ceiling (n−1)² = 4',
    near(re[a3s], -0.577350, 1e-6) && near(re[a3d], 0.816497, 1e-6) && others.every((b) => Math.abs(re[b.index]) < 1e-12 && Math.abs(im[b.index]) < 1e-12)
    && near(C.spectrum[0], 1, 1e-12) && near(C.spectrum[1], 0, 1e-12) && near(C.spectrum[2], 0, 1e-12)
    && C.absL < 1e-12 && C.absK < 1e-12 && C.e < 1e-12 && C.separable && !C.coherent && near(C.casimir, 0, 1e-12) && C.casimirMax === 4,
    { c3s: sig(re[a3s], 7), c3d: sig(re[a3d], 7), spectrum: Array.from(C.spectrum, (v) => sig(v, 6)), absL: sig(C.absL, 3), absK: sig(C.absK, 3), casimir: sig(C.casimir, 3), casimirMax: C.casimirMax, separable: C.separable, coherent: C.coherent });

  const P2 = product(3, 0, 1), C2 = shellCharacter(P2), C1 = shellCharacter(product(3, 1, 1));   // |1,1⟩⊗|1,0⟩ = (3p₁ + 3d₁)/√2
  judge('A1 THE REGRESSION GUARD: the OLD criterion (Schmidt[0] > 0.9995) calls BOTH |1,0⟩⊗|1,0⟩ and |1,1⟩⊗|1,0⟩ coherent — the second has |⟨L⟩| = |⟨K⟩| = 1, e = 1/3, scalar 2 of 4 — and the NEW scalar criterion rejects both; the old test therefore cannot be the criterion',
    OLD_CRITERION(C1.spectrum) && OLD_CRITERION(C2.spectrum) && !C1.coherent && !C2.coherent
    && near(C2.absL, 1, 1e-12) && near(C2.absK, 1, 1e-12) && near(C2.e, 1 / 3, 1e-12) && near(C2.casimir, 2, 1e-12),
    { oldSaysCoherent: [OLD_CRITERION(C1.spectrum), OLD_CRITERION(C2.spectrum)], newSaysCoherent: [C1.coherent, C2.coherent], absL: sig(C2.absL, 6), absK: sig(C2.absK, 6), e: sig(C2.e, 6), casimir: sig(C2.casimir, 6) });
}

/* ── A2  the scalar criterion on every true coherent state, n = 2 … 4, built by rotating the extremal one ── */
{
  /* the extremal (highest-weight) product |j,j⟩⊗|j,j⟩ is coherent by construction; SU(2) × SU(2) acts transitively
     on the coherent set, so every rotation of it is coherent and nothing else is.  applyRotor moves the REGISTER. */
  const rows = []; let allCoherent = true, allSaturate = true, maxDev = 0;
  let seed = 20260905; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 - 0.5; };
  for (const n of [2, 3, 4]) {
    const { re, im } = toRegister(product(n, 0, 0), n);
    for (let k = 0; k < 6; k++) {
      if (k) for (const which of ['+', '−']) for (const axis of ['x', 'y', 'z']) applyRotor(re, im, { which, axis, angle: 3 * rnd() });
      const C = shellCharacter(shellMatrix(re, im, n)), dev = Math.abs(C.casimir - (n - 1) * (n - 1));
      maxDev = Math.max(maxDev, dev); if (!C.coherent) allCoherent = false; if (dev > 1e-9) allSaturate = false;
      if (k === 0 || k === 5) rows.push({ n, k, casimir: sig(C.casimir, 10), max: (n - 1) ** 2, coherence: sig(C.coherence, 10), e: sig(C.e, 6) });
    }
  }
  const bad = shellCharacter(product(3, 1, 1));
  judge('A2 THE CRITERION HOLDS ON EVERY TRUE COHERENT STATE: the extremal product |j,j⟩⊗|j,j⟩ on n = 2, 3, 4 and five random SU(2) × SU(2) rotations of each (18 states) all satisfy |⟨L⟩|² + |⟨K⟩|² = (n−1)² to 1e-9 (max deviation below) and are labelled coherent — while the product of A1 misses its ceiling by the whole 4',
    allCoherent && allSaturate && maxDev < 1e-9 && !bad.coherent && near(bad.casimirDeficit, 4, 1e-12),
    { maxDeviation: sig(maxDev, 3), productDeficit: sig(bad.casimirDeficit, 6), rows });
}

/* ── A3  the counterexample survives the real register and physical rotor actions; the n = 1, 2 limits ───── */
{
  let ok = true; const rows = [];
  for (const [M, expected] of [[product(3, 1, 1), false], [product(3, 0, 0), true]]) {
    const { re, im } = toRegister(M, 3), before = Float64Array.from(re);
    for (const [which, axis, angle] of [['+', 'y', 0.71], ['−', 'x', -1.17], ['both', 'z', 0.43]]) applyRotor(re, im, { which, axis, angle });
    const moved = re.some((v, k) => Math.abs(v - before[k]) > 0.01);
    const C = shellCharacter(shellMatrix(re, im, 3));
    if (!(moved && C.separable && C.coherent === expected && Math.abs(C.coherence - (expected ? 1 : 0)) < 1e-12)) ok = false;
    rows.push({ expected, moved, separable: C.separable, coherent: C.coherent, casimir: sig(C.casimir, 8) });
  }
  const n2 = shellCharacter(product(2, 0, 1)), n1 = shellCharacter(product(1, 0, 0)), empty = shellCharacter({ n: 1, re: [0], im: [0], norm2: 0 });
  judge('A3 INVARIANCE AND THE LIMITS: both n = 3 products keep their labels (rank one always; coherent only the extremal one) after three physical rotor actions that genuinely move the register; at n = 2 every pure product IS coherent (the Schmidt spectrum is complete there, ceiling 1), n = 1 is trivially coherent (ceiling 0) and an EMPTY shell is neither populated nor coherent',
    ok && n2.coherent && near(n2.casimir, 1, 1e-12) && n1.coherent && n1.casimirMax === 0 && !empty.coherent && !empty.populated,
    { rows, n2casimir: sig(n2.casimir, 8), n1: { coherent: n1.coherent, max: n1.casimirMax }, empty: { populated: empty.populated, coherent: empty.coherent } });
}

/* ── A4  the label the card prints — read out of lab/orbit.js's source, which is where the audit found the bug ─ */
{
  const src = readFileSync(new URL('../lab/orbit.js', import.meta.url), 'utf8');
  const oldThreshold = /(?:spectrum|values)\s*\[\s*0\s*\]\s*>\s*0\.9995/.test(src);
  const line = /const characterLabel = [^\n]*/.exec(src);
  const hasRankOne = !!line && line[0].includes('rank one · not coherent');
  const coherentGuarded = !!line && /s\.coherent \?/.test(line[0]);
  judge('A4 THE CARD\'S LABEL: lab/orbit.js prints "rank one · not coherent" for a separable non-coherent shell and says "coherent" only on s.coherent — which is now the scalar criterion at 1e-9 (frontier.js shellCharacter); no 0.9995 rank threshold survives in the file',
    hasRankOne && coherentGuarded && !oldThreshold, { line: line ? line[0].slice(line[0].indexOf('=') + 1).trim().slice(0, 200) : null, oldThresholdPresent: oldThreshold });
}

/* ── W  the moving-basis norm derivative: the metric half of the connection (Astra's A7, ledger §2.1) ─────── */
{
  /* For the normalised bonding 1s pair held FIXED across a geometry change, d(c†S c)/dR = S′(R)/(1 + S(R)) with
     S = e^{−R}(1 + R + R²/3) and S′ = −e^{−R}R(1 + R)/3.  It is NOT zero by symmetry: renormalising the vector
     each step repairs that one scalar and discards the transport it stands for.  mo.js now carries the transport
     itself (tests/mo.test.mjs W49); this line keeps the witness that made it necessary. */
  const mo = createMO({ kind: 'lcao1s' }), R = 2, h = 1e-4;
  const c = mo.vector(mo.solve(R));
  const derivative = (mo.energyOf(R + h, c).norm - mo.energyOf(R - h, c).norm) / (2 * h);
  const S = Math.exp(-R) * (1 + R + R * R / 3), exact = -Math.exp(-R) * R * (1 + R) / (3 * (1 + S));
  judge('W THE MISSING-CONNECTION WITNESS: for the bonding 1s pair held fixed at R = 2, d(c†Sc)/dR = −0.170613679949 per bohr — the closed form S′/(1+S) to 1e-9, Astra\'s number to 1e-9, and |·| > 0.1: the norm leak the old Ehrenfest branch renormalised away is a real number, not zero by symmetry',
    near(derivative, exact, 1e-9) && near(derivative, -0.170613679949, 1e-9) && Math.abs(derivative) > 0.1,
    { derivative: sig(derivative, 12), closedForm: sig(exact, 12), astra: -0.170613679949, diff: sig(derivative - exact, 3) });
}

console.log('wall ' + ((performance.now() - T0) / 1000).toFixed(2) + ' s');
console.log((FAILED ? 'RED ' : 'GREEN ') + 'math-audit.test — ' + FAILED + ' failing of ' + TOTAL);
process.exit(FAILED ? 1 : 0);
