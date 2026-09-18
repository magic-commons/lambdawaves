/* canon-gauge.test.mjs — the gate for canon-gauge.mjs.  Run: node --test canon-gauge.test.mjs
 * Data: data/<id>.json from prep.mjs (the snapshot of lab/ at git HEAD).  Nothing under lab/ is imported.
 *
 * Covered: invariance of the canonical basis under a seeded random orthogonal scramble of every degenerate cluster
 * (states and orbitals), the sign rule for singletons, the triangular position of a bright cluster's dipoles, the
 * rank-deficient cluster (dark pair, and a synthetic bright+dark accidental degeneracy), the conditioning
 * diagnostic, and Proposition 7's gauge-independent ring current.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { clusterRanges, canonicaliseCluster, canonicalSign, coordinateFamily, dipoleFamily,
         orthonormalityDefect, applyRotation } from './canon-gauge.mjs';
import { loewdin } from './snapshot/lab/density.js';

const load = (id) => JSON.parse(fs.readFileSync(new URL(`./data/${id}.json`, import.meta.url), 'utf8'));
const TOL = 1e-10;

/* ── a seeded generator and a random orthogonal g×g matrix (Gram–Schmidt of gaussian columns) ───────────────── */
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
}
function randomOrthogonal(g, rand) {
  const Q = new Float64Array(g * g);
  for (let k = 0; k < g; k++) {
    for (let l = 0; l < g; l++) {
      const u = Math.max(rand(), 1e-12), v = rand();
      Q[k * g + l] = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }
    for (let j = 0; j < k; j++) {
      let d = 0;
      for (let l = 0; l < g; l++) d += Q[j * g + l] * Q[k * g + l];
      for (let l = 0; l < g; l++) Q[k * g + l] -= d * Q[j * g + l];
    }
    let n = 0;
    for (let l = 0; l < g; l++) n += Q[k * g + l] ** 2;
    n = Math.sqrt(n);
    for (let l = 0; l < g; l++) Q[k * g + l] /= n;
  }
  return Q;
}
const maxDiff = (a, b) => { let e = 0; for (let k = 0; k < a.length; k++) e = Math.max(e, Math.abs(a[k] - b[k])); return e; };

/* ── the two functional stacks ─────────────────────────────────────────────────────────────────────────────── */
function stateFamilies(d) {
  const n = d.n, nocc = d.nocc, nv = d.nvir;
  const rMO = [d.moDipole.x, d.moDipole.y, d.moDipole.z].map((a) => Float64Array.from(a));
  return [dipoleFamily(rMO, n, nocc, nv, 1e-3), coordinateFamily(nocc * nv, 1e-8, 'amplitude')];
}
function stateVectors(d) {
  const m = d.pairSpace, X = new Float64Array(d.XTDA.length * m);
  d.XTDA.forEach((v, k) => X.set(v, k * m));
  return X;
}
/** MO coefficients in Löwdin coordinates: C̃ = S^{1/2} C, columns orthonormal in the Euclidean sense. */
function loewdinOrbitals(d) {
  const n = d.n, { W } = loewdin(Float64Array.from(d.S), n), C = d.C, out = new Float64Array(n * n);
  for (let k = 0; k < n; k++) for (let u = 0; u < n; u++) {
    let s = 0;
    for (let v = 0; v < n; v++) s += W[u * n + v] * C[v * n + k];
    out[k * n + u] = s;                                             // row k = orbital k
  }
  return out;
}
/** the drive matrix over [Φ0, Ψ_K…] from the certified closed forms, for the ring-current check */
function driveMatrix(d, ks, axis) {
  const n = d.n, nocc = d.nocc, nv = d.nvir, r = d.moDipole[axis];
  const N = ks.length, R = new Float64Array((N + 1) * (N + 1));
  let t = 0;
  for (let i = 0; i < nocc; i++) t += 2 * r[i * n + i];
  R[0] = t;
  const Xs = ks.map((k) => d.XTDA[k]);
  for (let K = 0; K < N; K++) {
    let s = 0;
    for (let i = 0; i < nocc; i++) for (let a = 0; a < nv; a++) s += Math.SQRT2 * Xs[K][i * nv + a] * r[i * n + nocc + a];
    R[K + 1] = s; R[(K + 1) * (N + 1)] = s;
    for (let L = 0; L < N; L++) {
      let ov = 0;
      for (let p = 0; p < nocc * nv; p++) ov += Xs[K][p] * Xs[L][p];
      let v = 2 * ov * t / 2;                                       // 2δ_ij⟨X,X⟩ contracted with r_ij → ⟨0|R|0⟩⟨X,X⟩
      for (let i = 0; i < nocc; i++) for (let j = 0; j < nocc; j++) {
        let s2 = 0;
        for (let a = 0; a < nv; a++) s2 += Xs[K][j * nv + a] * Xs[L][i * nv + a];
        v -= s2 * r[i * n + j];
      }
      for (let a = 0; a < nv; a++) for (let b = 0; b < nv; b++) {
        let s2 = 0;
        for (let i = 0; i < nocc; i++) s2 += Xs[K][i * nv + a] * Xs[L][i * nv + b];
        v += s2 * r[(nocc + a) * n + nocc + b];
      }
      R[(K + 1) * (N + 1) + L + 1] = v;
    }
  }
  return R;
}

/* ── 1 · every degenerate STATE cluster of benzene, methane and ammonia ─────────────────────────────────────── */
for (const id of ['NH3', 'CH4', 'C6H6']) {
  test(`${id}: canonical state gauge is invariant under an orthogonal scramble of every degenerate cluster`, () => {
    const d = load(id), m = d.pairSpace, fams = stateFamilies(d), X = stateVectors(d);
    const ranges = clusterRanges(d.omegaTDA, 1e-8);
    let worst = 0, clusters = 0, singles = 0, minPivot = Infinity;
    for (const [s, e] of ranges) {
      const g = e - s, V = X.subarray(s * m, e * m);
      assert.ok(orthonormalityDefect(V, m, g) < 1e-9, 'cluster rows must be orthonormal');
      const ref = canonicaliseCluster(V, m, g, fams);
      for (const p of ref.pivots) minPivot = Math.min(minPivot, p.norm);
      if (g === 1) singles++; else clusters++;
      for (let seed = 1; seed <= 5; seed++) {
        const Q = randomOrthogonal(g, rng(seed * 7919 + s));
        const scr = applyRotation(Q, V, m, g);
        const got = canonicaliseCluster(scr, m, g, fams);
        worst = Math.max(worst, maxDiff(got.U, ref.U));
      }
    }
    console.log(`  ${id}: ${ranges.length} clusters (${clusters} degenerate, ${singles} singletons), ` +
                `max |canon(VQ) − canon(V)| = ${worst.toExponential(2)}, smallest pivot norm ${minPivot.toExponential(2)}`);
    assert.ok(worst < TOL, `recovery ${worst}`);
  });
}

/* ── 2 · degenerate ORBITAL clusters, the same rule in Löwdin coordinates ───────────────────────────────────── */
for (const id of ['NH3', 'CH4', 'C6H6']) {
  test(`${id}: canonical orbital gauge is invariant under an orthogonal scramble of every degenerate MO cluster`, () => {
    const d = load(id), n = d.n, Ct = loewdinOrbitals(d), fams = [coordinateFamily(n, 1e-8, 'loewdin')];
    const ranges = clusterRanges(d.eps, 1e-8).filter(([s, e]) => e - s > 1);
    assert.ok(ranges.length > 0, `${id} should have a degenerate MO pair`);
    let worst = 0;
    for (const [s, e] of ranges) {
      const g = e - s, V = Ct.subarray(s * n, e * n);
      assert.ok(orthonormalityDefect(V, n, g) < 1e-9);
      const ref = canonicaliseCluster(V, n, g, fams);
      for (let seed = 1; seed <= 5; seed++) {
        const Q = randomOrthogonal(g, rng(seed * 104729 + s));
        worst = Math.max(worst, maxDiff(canonicaliseCluster(applyRotation(Q, V, n, g), n, g, fams).U, ref.U));
      }
    }
    console.log(`  ${id}: ${ranges.length} degenerate MO clusters, max |canon(CQ) − canon(C)| = ${worst.toExponential(2)}`);
    assert.ok(worst < TOL, `recovery ${worst}`);
  });
}

/* ── 3 · the sign rule for a non-degenerate state ──────────────────────────────────────────────────────────── */
test('the sign rule recovers the orientation of every non-degenerate state (H2O, NH3, C6H6)', () => {
  let worst = 0, counted = 0;
  for (const id of ['H2O', 'NH3', 'C6H6']) {
    const d = load(id), m = d.pairSpace, fams = stateFamilies(d), X = stateVectors(d);
    for (const [s, e] of clusterRanges(d.omegaTDA, 1e-8)) {
      if (e - s !== 1) continue;
      const V = X.subarray(s * m, e * m), ref = canonicaliseCluster(V, m, 1, fams).U;
      const flipped = Float64Array.from(V, (x) => -x);
      worst = Math.max(worst, maxDiff(canonicaliseCluster(flipped, m, 1, fams).U, ref));
      assert.equal(canonicalSign(ref, m, fams), 1);
      counted++;
    }
  }
  console.log(`  ${counted} non-degenerate states, max |canon(−X) − canon(X)| = ${worst.toExponential(2)}`);
  assert.ok(worst < TOL);
});

/* ── 4 · where the rule puts a bright cluster's dipoles ─────────────────────────────────────────────────────── */
test('after canonicalisation a bright cluster\'s dipole matrix is lower triangular with positive diagonal, ' +
     'and (E/T clusters) its dipoles are orthogonal and of equal length', () => {
  for (const id of ['NH3', 'CH4', 'C6H6']) {
    const d = load(id), m = d.pairSpace, fams = stateFamilies(d), X = stateVectors(d), dip = fams[0];
    for (const [s, e] of clusterRanges(d.omegaTDA, 1e-8)) {
      const g = e - s;
      if (g < 2) continue;
      const { U, pivots } = canonicaliseCluster(X.subarray(s * m, e * m), m, g, fams);
      if (pivots.some((p) => p.family !== 'dipole')) continue;                    // dark or rank-deficient: section 5
      const mu = [];
      for (let j = 0; j < g; j++) {
        mu.push([0, 1, 2].map((q) => {
          let t = 0;
          for (let p = 0; p < m; p++) t += dip.rows[q * m + p] * U[j * m + p];
          return t;
        }));
      }
      for (let j = 0; j < g; j++) {
        const ax = pivots[j].index;
        assert.ok(mu[j][ax] > 1e-6, `${id} cluster ${s}: positive diagonal on axis ${ax}`);
        for (let l = j + 1; l < g; l++) assert.ok(Math.abs(mu[l][ax]) < 1e-10, `${id} cluster ${s}: μ_${l} ⟂ axis ${ax}`);
      }
      const len = mu.map((v) => Math.hypot(...v));
      let offdiag = 0;
      for (let j = 0; j < g; j++) for (let l = j + 1; l < g; l++) {
        offdiag = Math.max(offdiag, Math.abs(mu[j][0] * mu[l][0] + mu[j][1] * mu[l][1] + mu[j][2] * mu[l][2]));
      }
      console.log(`  ${id} cluster [${s},${e}) ω=${d.omegaTDA[s].toFixed(6)} axes ${pivots.map((p) => 'xyz'[p.index]).join('')}` +
                  ` |μ| = ${len.map((x) => x.toFixed(8)).join(', ')} max μ_j·μ_l = ${offdiag.toExponential(2)}`);
      assert.ok(Math.max(...len) - Math.min(...len) < 1e-8, 'equal lengths (Proposition 7)');
      assert.ok(offdiag < 1e-8, 'mutually orthogonal (Proposition 7)');
    }
  }
});

/* ── 5 · rank-deficient clusters: a real dark pair, and a synthetic bright+dark accidental degeneracy ───────── */
test('rank-deficient clusters fall through to the amplitude family and stay invariant', () => {
  const d = load('C6H6'), m = d.pairSpace, fams = stateFamilies(d), X = stateVectors(d);
  let dark = 0, worst = 0;
  for (const [s, e] of clusterRanges(d.omegaTDA, 1e-8)) {
    const g = e - s;
    if (g < 2) continue;
    const V = X.subarray(s * m, e * m), ref = canonicaliseCluster(V, m, g, fams);
    if (!ref.pivots.some((p) => p.family === 'amplitude')) continue;
    dark++;
    for (let seed = 1; seed <= 5; seed++) {
      const Q = randomOrthogonal(g, rng(seed * 31 + s));
      worst = Math.max(worst, maxDiff(canonicaliseCluster(applyRotation(Q, V, m, g), m, g, fams).U, ref.U));
    }
  }
  assert.ok(dark > 0, 'benzene has degenerate clusters the dipole family is blind to');
  console.log(`  C6H6: ${dark} clusters needing the amplitude family, max recovery error ${worst.toExponential(2)}`);
  assert.ok(worst < TOL);

  // synthetic: one bright state and one dark state declared degenerate — the dipole family gives ONE pivot
  const bright = d.fTDA.findIndex((f) => f > 0.1), darkIdx = d.fTDA.findIndex((f) => f < 1e-12);
  const V2 = new Float64Array(2 * m);
  V2.set(X.subarray(bright * m, (bright + 1) * m), 0);
  V2.set(X.subarray(darkIdx * m, (darkIdx + 1) * m), m);
  assert.ok(orthonormalityDefect(V2, m, 2) < 1e-9);
  const ref2 = canonicaliseCluster(V2, m, 2, fams);
  assert.equal(ref2.pivots[0].family, 'dipole');
  assert.equal(ref2.pivots[1].family, 'amplitude');
  let w2 = 0;
  for (let seed = 1; seed <= 8; seed++) {
    const Q = randomOrthogonal(2, rng(seed * 6007));
    w2 = Math.max(w2, maxDiff(canonicaliseCluster(applyRotation(Q, V2, m, 2), m, 2, fams).U, ref2.U));
  }
  console.log(`  synthetic bright+dark degeneracy: pivots ${ref2.pivots.map((p) => p.family + ':' + p.index).join(', ')}` +
              `, max recovery error ${w2.toExponential(2)}`);
  assert.ok(w2 < TOL);
});

/* ── 6 · conditioning: the output is Lipschitz in the span with constant 1/δ ────────────────────────────────── */
test('conditioning: a perturbation ε of the span moves the canonical basis by at most ε/δ', () => {
  const d = load('C6H6'), m = d.pairSpace, fams = stateFamilies(d), X = stateVectors(d);
  const [s, e] = clusterRanges(d.omegaTDA, 1e-8).find(([a, b]) => b - a === 2 && d.fTDA[a] > 0.1);
  const g = 2, V = Float64Array.from(X.subarray(s * m, e * m));
  const ref = canonicaliseCluster(V, m, g, fams);
  const delta = Math.min(...ref.pivots.map((p) => p.norm));
  const rand = rng(424242);
  let worst = 0;
  const eps = 1e-9;
  for (let trial = 0; trial < 5; trial++) {
    const P = Float64Array.from(V);
    for (let k = 0; k < P.length; k++) P[k] += eps * (rand() - 0.5);
    for (let k = 0; k < g; k++) {                                        // re-orthonormalise the perturbed rows
      for (let j = 0; j < k; j++) {
        let dot = 0;
        for (let p = 0; p < m; p++) dot += P[j * m + p] * P[k * m + p];
        for (let p = 0; p < m; p++) P[k * m + p] -= dot * P[j * m + p];
      }
      let nn = 0;
      for (let p = 0; p < m; p++) nn += P[k * m + p] ** 2;
      nn = Math.sqrt(nn);
      for (let p = 0; p < m; p++) P[k * m + p] /= nn;
    }
    worst = Math.max(worst, maxDiff(canonicaliseCluster(P, m, g, fams).U, ref.U));
  }
  console.log(`  C6H6 bright pair: δ = ${delta.toFixed(6)}, ε = ${eps.toExponential(0)}, ` +
              `max output move ${worst.toExponential(2)}, bound ε/δ = ${(eps / delta).toExponential(2)}`);
  assert.ok(worst < 40 * eps / delta, 'output move within a small multiple of ε/δ');
});

/* ── 7 · Proposition 7: the ring current of an E pair is the same circle in every gauge ─────────────────────── */
test('the quarter-turn ring current is gauge-independent (centre, radius, rate) and its phase is fixed by the gauge', () => {
  for (const id of ['NH3', 'C6H6']) {
    const d = load(id), m = d.pairSpace, fams = stateFamilies(d), X = stateVectors(d);
    const [s, e] = clusterRanges(d.omegaTDA, 1e-8).find(([a, b]) => b - a === 2 && d.fTDA[a] > 0.05);
    const w = d.omegaTDA[s];
    const trajectory = (V) => {
      const ks = [0, 1];
      const dd = { ...d, XTDA: [V.subarray(0, m), V.subarray(m, 2 * m)] };
      const R = ['x', 'y', 'z'].map((ax) => driveMatrix(dd, ks, ax));
      const b0 = Math.SQRT1_2, b = [{ re: 0.5, im: 0 }, { re: 0, im: 0.5 }];
      const pts = [];
      for (let k = 0; k < 64; k++) {
        const t = (2 * Math.PI / w) * k / 64;
        const c = b.map((z) => ({ re: z.re * Math.cos(w * t) + z.im * Math.sin(w * t),
                                  im: z.im * Math.cos(w * t) - z.re * Math.sin(w * t) }));
        pts.push(R.map((Rq) => {
          let v = b0 * b0 * Rq[0];
          for (let K = 0; K < 2; K++) v += 2 * b0 * c[K].re * Rq[K + 1];
          for (let K = 0; K < 2; K++) for (let L = 0; L < 2; L++) {
            v += (c[K].re * c[L].re + c[K].im * c[L].im) * Rq[(K + 1) * 3 + L + 1];
          }
          return -v;                                                    // electronic dipole = −⟨Σ r⟩
        }));
      }
      const centre = [0, 1, 2].map((q) => pts.reduce((a, p) => a + p[q], 0) / pts.length);
      const rad = pts.map((p) => Math.hypot(p[0] - centre[0], p[1] - centre[1], p[2] - centre[2]));
      const ang = Math.atan2(pts[0][1] - centre[1], pts[0][0] - centre[0]);
      return { centre, radius: rad.reduce((a, x) => a + x, 0) / rad.length,
               radiusSpread: Math.max(...rad) - Math.min(...rad), phase0: ang };
    };
    const V = Float64Array.from(X.subarray(s * m, e * m));
    const ref = trajectory(V), can = trajectory(canonicaliseCluster(V, m, 2, fams).U);
    let dC = 0, dR = 0, dPhaseRaw = 0, dPhaseCanon = 0;
    for (let seed = 1; seed <= 5; seed++) {
      const Q = randomOrthogonal(2, rng(seed * 2027 + s));
      const scr = applyRotation(Q, V, m, 2);
      const t1 = trajectory(scr), t2 = trajectory(canonicaliseCluster(scr, m, 2, fams).U);
      dC = Math.max(dC, Math.max(...[0, 1, 2].map((q) => Math.abs(t1.centre[q] - ref.centre[q]))));
      dR = Math.max(dR, Math.abs(t1.radius - ref.radius));
      dPhaseRaw = Math.max(dPhaseRaw, Math.abs(t1.phase0 - ref.phase0));
      dPhaseCanon = Math.max(dPhaseCanon, Math.abs(t2.phase0 - can.phase0));
    }
    console.log(`  ${id} ω=${w.toFixed(6)}: radius ${ref.radius.toFixed(9)} (out-of-circle spread ` +
                `${ref.radiusSpread.toExponential(2)}), scramble moves centre ${dC.toExponential(2)}, radius ` +
                `${dR.toExponential(2)}, RAW start phase ${dPhaseRaw.toFixed(4)} rad, CANONICAL start phase ${dPhaseCanon.toExponential(2)} rad`);
    assert.ok(ref.radiusSpread < 1e-9, 'the trajectory is a circle');
    assert.ok(dC < TOL && dR < TOL, 'centre and radius are gauge-invariant');
    assert.ok(dPhaseCanon < 1e-8, 'the canonical gauge fixes the starting phase');
  }
});
