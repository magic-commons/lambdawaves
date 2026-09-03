/* bf-r6-audit1.mjs — Round 6 audit of lab/frontier.js as mathematics (Opus, rival lab).
 * Nothing here writes to lab/ or tests/.  node research/probes/bf-r6-audit1.mjs
 */
import { airyAi, logAiryAiPos, envelopeI, peakLaw, revivalClocks, packet, ladderAutocorr, poissonAiry,
  combVerdict, cubicPeak, shellMatrix, schmidt, rotorExpectations, applyRotateK,
  polyRoots, coaxialPolynomial, vortexPoints, stretchedCensus } from '../../lab/frontier.js';
import { radial, ylm, stateOf, BASIS, energy } from '../../lab/hydrogen.js';

const out = (s) => console.log(s);
const J = (o) => JSON.stringify(o);

/* ═══ 1 · airyAi: the switch at |x| = 6 ═══════════════════════════════════ */
out('### 1  airyAi grid dump for mpmath comparison');
{
  const xs = [];
  for (const x of [-8, -7, -6.5, -6.0001, -6, -5.9999, -5.5, -5, -3, -1, 0, 1, 3, 4, 5, 5.5, 5.9, 5.99, 5.999, 5.9999, 6, 6.0001, 6.001, 6.01, 6.1, 6.5, 7, 8, 10, 12]) xs.push(x);
  const rows = xs.map((x) => [x, airyAi(x)]);
  out('AIGRID ' + J(rows));
  // the switch discontinuity: |Ai_series(6) - Ai_asym(6)|
  const eps = 1e-13;
  const below = airyAi(6 - eps), above = airyAi(6 + eps);
  out('SWITCH  Ai(6-)=' + below.toExponential(15) + '  Ai(6+)=' + above.toExponential(15) +
      '  jump=' + Math.abs(above - below).toExponential(3) + '  rel=' + (Math.abs(above - below) / Math.abs(below)).toExponential(3));
  // worst relative jump over a window either side of 6
  let worstRel = 0, worstX = 0;
  for (let k = 0; k <= 200; k++) {
    const x = 4 + k * 0.02;                     // series branch only
    const a = airyAi(x), b = Math.exp(logAiryAiPos(x));   // asymptotic branch evaluated anyway
    const rel = Math.abs(a - b) / Math.abs(b);
    if (x > 3 && rel > worstRel && x <= 6) { worstRel = rel; worstX = x; }
  }
  out('SERIESvsASYM on [4,6]: worst relative difference ' + worstRel.toExponential(3) + ' at x=' + worstX.toFixed(2));
}

/* ═══ 2 · peakLaw: the numerical maximiser's bracket ══════════════════════ */
out('\n### 2  peakLaw numerical maximiser');
{
  const rows = [];
  for (const b of [3e-5, 1e-4, 3e-4, 6e-4, 1e-3, 2e-3, 5e-3, 0.01, 0.02, 0.05, 0.1, 0.2, 0.32, 1, 3, 10, 100, 300, 1000]) {
    const p = peakLaw(b);
    rows.push({ beta: b, aSer: p.alphaStar, aNum: p.alphaStarNum, hSer: p.height, hNum: p.heightNum,
      relH: Math.abs(p.heightNum - p.height) / Math.max(1e-300, Math.abs(p.height)), usable: p.seriesUsable });
  }
  for (const r of rows) out('  beta=' + String(r.beta).padEnd(8) + ' a*ser=' + r.aSer.toExponential(6) + ' a*num=' + r.aNum.toExponential(6) +
    ' hser=' + r.hSer.toFixed(9) + ' hnum=' + r.hNum.toExponential(6) + ' relH=' + r.relH.toExponential(2) + (r.usable ? ' [series]' : ''));
  // the physical entry point: which (nbar, sigma) produce these betas?
  for (const [nb, sg] of [[10000, 1], [30000, 1], [3000, 1], [600, 2], [150, 2], [30, 2]]) {
    const c = revivalClocks(nb, sg); out('  n̄=' + nb + ' σ=' + sg + '  β₃=' + c.beta3.toExponential(4) + '  β₄=' + c.beta4.toExponential(4));
  }
}

/* ═══ 3 · poissonAiry: which neglected term dominates ═════════════════════ */
out('\n### 3  poissonAiry vs the exact ladder sum');
{
  out('  nbar sigma   x     exact       poissonAiry   err        beta4      quadCoef=3πxσ²/n̄');
  for (const [nb, sg] of [[600, 2], [600, 4], [150, 2], [150, 4], [300, 3], [1200, 2]]) {
    const pops = packet({ nbar: nb, sigma: sg }), { Tcl, Trev } = revivalClocks(nb), b4 = revivalClocks(nb, sg).beta4;
    for (const x of [0, 0.25, 0.5, -0.5, 1.0]) {
      const exact = ladderAutocorr(pops, Trev + x * Tcl).abs, pred = poissonAiry(nb, sg, x);
      const quad = 3 * Math.PI * x * sg * sg / nb;
      out('  ' + String(nb).padStart(5) + ' ' + sg + '   ' + String(x).padStart(5) + '  ' + exact.toFixed(9) + '  ' + pred.toFixed(9) +
          '  ' + Math.abs(exact - pred).toExponential(3) + '  ' + b4.toExponential(3) + '  ' + quad.toExponential(3));
    }
  }
}

/* ═══ 4 · schmidt: the scale of the Jacobi convergence test ═══════════════ */
out('\n### 4  schmidt on a rank-one (coherent) shell state scaled by ε');
{
  const n = 4;
  for (const eps of [1, 1e-2, 1e-4, 1e-6, 1e-7, 3e-8, 1e-8, 1e-9, 1e-10]) {
    const re = new Float64Array(91), im = new Float64Array(91);
    // |4s> + |4p0> + |4d0> + |4f0> is not rank one; build a genuine rank-one state instead:
    // the SO(4) coherent state = the extreme Stark state, which is the K_z eigenvector.  Take |4,l,0> combination
    // by rotating |4s> with K_z through a large angle: applyRotateK on |4s> gives a superposition; use theta = 2.0.
    re[stateOf(4, 0, 0).index] = 1;
    applyRotateK(re, im, 2.0);
    for (let i = 0; i < 91; i++) { re[i] *= eps; im[i] *= eps; }
    const M = shellMatrix(re, im, n), s = schmidt(M);
    out('  eps=' + String(eps).padEnd(8) + ' norm2=' + M.norm2.toExponential(3) + '  schmidt=' + J(s.values.map((v) => +v.toFixed(9))) +
        '  coherence=' + rotorExpectations(M).coherence.toFixed(9));
  }
}

/* ═══ 5 · stretchedCensus on a same-shell (degenerate) stretched triple ═══ */
out('\n### 5  stretchedCensus: degenerate (ω = 0) input');
{
  const modes = [{ n: 4, l: 2, m: 2, re: 1, im: 0 }, { n: 4, l: 1, m: 1, re: 1, im: 0 }, { n: 4, l: 0, m: 0, re: 1, im: 0 }];
  const c = stretchedCensus(modes, 60);
  out('  (4d+2, 4p+1, 4s):  Td=' + c.Td + '  roots=' + J(c.roots.map((r) => +r.toFixed(6))) +
      '  count=' + c.count + '  t0=' + J(c.points.map((p) => p.t0)));
}

/* ═══ 6 · the print's two census states, reproduced through the instrument ═ */
out('\n### 6  stretchedCensus on the print states (control)');
{
  const s5 = stretchedCensus([{ n: 3, l: 2, m: 2, re: 1, im: 0 }, { n: 4, l: 1, m: 1, re: 1, im: 0 }, { n: 5, l: 0, m: 0, re: 1, im: 0 }], 60);
  const s6 = stretchedCensus([{ n: 3, l: 2, m: 2, re: 1, im: 0 }, { n: 4, l: 1, m: 1, re: 1, im: 0 }, { n: 6, l: 0, m: 0, re: 1, im: 0 }], 60);
  out('  (3,4,5): roots=' + J(s5.roots.map((r) => +r.toFixed(6))) + ' count=' + s5.count + ' Td=' + s5.Td.toFixed(4));
  out('  (3,4,6): roots=' + J(s6.roots.map((r) => +r.toFixed(6))) + ' count=' + s6.count + ' Td=' + s6.Td.toFixed(4));
}

/* ═══ 7 · vortexPoints: the self-inversive flood on a same-shell state ════ */
out('\n### 7  vortexPoints on a state whose coaxial roots sit ON the unit circle');
{
  // 3d+1 - 3d-1 + λ·3d0 : one shell, so the three g_m share a common time phase and are real; g_{-1} = +g_{+1}
  const ids = [stateOf(3, 2, 1).index, stateOf(3, 2, 0).index, stateOf(3, 2, -1).index];
  const re = new Float64Array(91), im = new Float64Array(91);
  re[ids[0]] = 1; re[ids[1]] = 2; re[ids[2]] = -1;
  const v = vortexPoints(re, im, ids, { nr: 8, nth: 96, rMin: 1, rMax: 12 });
  out('  points=' + v.points.length + '  M=' + v.M + '  circles=' + v.circles + '  skipped=' + v.skipped);
  // ground truth: on each circle P(w) ∝ w² + c(θ) w + 1 with c real → both roots ON |w|=1 wherever |c| ≤ 2
  const P = coaxialPolynomial(re, im, ids, 5, 1.2);
  const rt = polyRoots(P.coeffs);
  out('  at r=5, θ=1.2: |w| = ' + J(rt.map((z) => +Math.hypot(z.re, z.im).toFixed(12))));
  out('  first 4 points: ' + J(v.points.slice(0, 4).map((p) => [+p.r.toFixed(3), +p.theta.toFixed(4), +p.phi.toFixed(4)])));
  // the same for a NON-degenerate control: 2p+1 + 3d0 + 4f-1 at t = 0
  const ids2 = [stateOf(2, 1, 1).index, stateOf(3, 2, 0).index, stateOf(4, 3, -1).index];
  const re2 = new Float64Array(91), im2 = new Float64Array(91);
  re2[ids2[0]] = 1; re2[ids2[1]] = 1; re2[ids2[2]] = 1;
  const v2 = vortexPoints(re2, im2, ids2, { nr: 8, nth: 96, rMin: 1, rMax: 12 });
  out('  control (2p+1,3d0,4f-1): points=' + v2.points.length + ' M=' + v2.M);
}

/* ═══ 8 · dominance at equality (Rouché) ═════════════════════════════════ */
out('\n### 8  the dominance lemma at equality');
{
  // build g = (1, -1): |g0| = |g1|, sum - mx = mx exactly; P(w) = 1 - w has the root w = 1 ON the circle
  const g = [1, 1];
  const dom = (arr) => { let mx = 0, sum = 0; for (const v of arr) { sum += v; mx = Math.max(mx, v); } return sum === 0 || mx > sum - mx; };
  out('  gAbs=[1,1] → dominant? ' + dom(g) + '  (must be false: w = 1 is a unimodular root of 1 - w)');
  out('  gAbs=[1,0.999999] → dominant? ' + dom([1, 0.999999]) + '  root modulus ' + (1 / 0.999999).toFixed(9));
  out('  gAbs=[2,1,1] → dominant? ' + dom([2, 1, 1]) + '  (equality: P = 1 + w + 2w² has roots of modulus ' + J(polyRoots([{ re: 1, im: 0 }, { re: 1, im: 0 }, { re: 2, im: 0 }]).map((z) => +Math.hypot(z.re, z.im).toFixed(6))) + ')');
  out('  gAbs=[0,0,0]  → dominant? ' + dom([0, 0, 0]) + '  (ψ ≡ 0 on the circle: the whole circle is nodal)');
}
