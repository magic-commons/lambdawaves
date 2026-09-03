/* bf-r6-audit2.mjs — Round 6 audit, part 2: a state whose census the instrument gets WRONG,
 * the poissonAiry residual-chirp diagnosis, schmidt at small norm, and the seriesUsable boundary. */
import { envelopeI, peakLaw, revivalClocks, packet, ladderAutocorr, poissonAiry, shellMatrix, schmidt,
  stretchedCensus, applyRotateK, applyDefectWait, rotorExpectations } from '../../lab/frontier.js';
import { radial, ylm, stateOf, energy } from '../../lab/hydrogen.js';
const out = (s) => console.log(s); const J = (o) => JSON.stringify(o);
const PI = Math.PI;

/* ═══ 1 · stretchedCensus: Φ's roots are a LEVEL SET of one fixed function ═══
 * Φ(r) = |c0|²a0² − 4|c+||c−| |a+ a−| = 0  ⟺  G(r) := |a+ a−| / a0²  =  u := |c0|²/(4|c+||c−|).
 * G is fixed by the three modes; u is a free knob.  At a local maximum of G the level set has a
 * DOUBLE root; just below it, a pair of simple roots as close together as we please. */
const sig = (l, m) => ylm(l, m, PI / 2, 0).re;
{
  // (3d+2, 4p+1, 5s): P = 3d+2 (m=2), Z = 4p+1 (m=1, the MIDDLE), N = 5s (m=0)
  const aP = (r) => radial(3, 2, r) * sig(2, 2), aZ = (r) => radial(4, 1, r) * sig(1, 1), aN = (r) => radial(5, 0, r) * sig(0, 0);
  const G = (r) => Math.abs(aP(r) * aN(r)) / (aZ(r) * aZ(r));
  out('### 1  the level function G(r) = |a₊a₋|/a₀² for (3d₊₂, 4p₊₁, 5s)');
  // local maxima of G on (0.05, 40)
  const h = 2e-4, maxima = [];
  let g0 = G(0.05 - h), g1 = G(0.05);
  for (let r = 0.05 + h; r < 40; r += h) {
    const g2 = G(r);
    if (g1 > g0 && g1 > g2 && Number.isFinite(g1)) maxima.push({ r: r - h, G: g1, d2: (g2 - 2 * g1 + g0) / (h * h) });
    g0 = g1; g1 = g2;
  }
  out('  interior local maxima of G: ' + J(maxima.map((m) => [+m.r.toFixed(6), +m.G.toExponential(8), +m.d2.toExponential(4)])));
  // radial nodes of the two OUTER modes (the only places the instrument scans finely)
  const nodes = [];
  for (const [n, l] of [[3, 2], [5, 0]]) { let pr = 0.02, pv = radial(n, l, pr); for (let r = 0.03; r < 60; r += 0.01) { const v = radial(n, l, r); if (pv * v < 0) nodes.push(+((pr + r) / 2).toFixed(4)); pv = v; pr = r; } }
  out('  radial nodes of 3d and 5s (the fine-scan centres, ±0.12): ' + J(nodes));

  for (const M of maxima) {
    const dist = Math.min(...nodes.map((nd) => Math.abs(nd - M.r)));
    out('  max at r=' + M.r.toFixed(5) + '  G=' + M.G.toExponential(8) + '  G\'\'=' + M.d2.toExponential(4) + '  distance to nearest fine window = ' + (dist - 0.12).toFixed(4));
  }

  // build a state whose level u sits just below the chosen maximum: gap = 2 sqrt(2 delta / |G''|)
  for (const M of maxima) {
    const dist = Math.min(...nodes.map((nd) => Math.abs(nd - M.r)));
    if (dist < 0.15) continue;                       // must be outside every fine-scan window
    for (const gap of [5e-4, 2e-4]) {
      const delta = Math.abs(M.d2) * (gap / 2) * (gap / 2) / 2;
      const u = M.G - delta;
      // free knobs: |c+| = 1, |c−| = cm chosen so ξ = sqrt(|c− a−| / |c+ a+|) <= 1 at the roots; |c0|² = 4 |c+||c−| u
      const cm = 0.5 * Math.abs(aP(M.r) / aN(M.r));   // ⇒ |c− a−|/|c+ a+| = 0.5, ξ = 0.707 < 1: ADMISSIBLE
      const c0 = Math.sqrt(4 * 1 * cm * u);
      const modes = [{ n: 3, l: 2, m: 2, re: 1, im: 0 }, { n: 4, l: 1, m: 1, re: c0, im: 0 }, { n: 5, l: 0, m: 0, re: cm, im: 0 }];
      const c = stretchedCensus(modes, 60);
      // brute force: Φ on a 1e-6 grid
      const Phi = (r) => (c0 * aZ(r)) ** 2 - 4 * Math.abs(1 * aP(r) * cm * aN(r));
      const xi = (r) => Math.abs(c0 * aZ(r)) / (2 * Math.abs(1 * aP(r)));
      const truth = []; let pr = 0.01, pv = Phi(pr);
      for (let r = 0.01 + 1e-6; r < 60; r += 1e-6) { const v = Phi(r); if (pv * v < 0) { let a = pr, b = r, fa = pv; for (let k = 0; k < 60; k++) { const m2 = (a + b) / 2, fm = Phi(m2); if (fa * fm <= 0) b = m2; else { a = m2; fa = fm; } } truth.push((a + b) / 2); } pv = v; pr = r; }
      const truthAdm = truth.filter((r) => xi(r) <= 1);
      out('\n  --- target max r=' + M.r.toFixed(5) + ', requested root gap ' + gap + ' ---');
      out('  state: (3d₊₂, 4p₊₁, 5s) with |c| = (1, ' + c0.toExponential(10) + ', ' + cm.toExponential(10) + ')');
      out('  INSTRUMENT stretchedCensus: roots=' + J(c.roots.map((r) => +r.toFixed(6))) + '  admissible=' + c.admissible + '  count=' + c.count);
      out('  TRUTH (Φ on a 1e-6 grid):   roots=' + J(truth.map((r) => +r.toFixed(6))) + '  admissible=' + truthAdm.length + '  count=' + 2 * truthAdm.length);
      const missed = truth.filter((t) => !c.roots.some((r) => Math.abs(r - t) < 1e-5));
      out('  MISSED by the instrument: ' + J(missed.map((r) => +r.toFixed(8))) + '  (gap ' + (missed.length === 2 ? (missed[1] - missed[0]).toExponential(3) : 'n/a') + ', ξ = ' + J(missed.map((r) => +xi(r).toFixed(4))) + ')');
    }
  }
}

/* ═══ 2 · poissonAiry: which neglected term is it?  the residual quadratic chirp ═══
 * At t = T_rev + x T_cl the level phase is  L s + (2π + 3πx/n̄)s² − (8π/3n̄)s³ + (10π/3n̄²)s⁴ − …
 * The 2πs² is 1 at integers and drops out; the residual chirp γ = 3πxσ²/n̄ (in u = s/σ) does NOT. */
function chirpI(alpha, beta, gamma) {           // (1/√2π)∫ e^{−u²/2 + iγu² + iαu + iβu³} du, Simpson
  const N = 400000, U = 16, h = 2 * U / N; let re = 0, im = 0;
  for (let i = 0; i <= N; i++) { const u = -U + i * h, w = (i === 0 || i === N) ? 1 : (i % 2 ? 4 : 2);
    const ph = gamma * u * u + alpha * u + beta * u * u * u, e = Math.exp(-u * u / 2) * w;
    re += e * Math.cos(ph); im += e * Math.sin(ph); }
  const s = h / 3 / Math.sqrt(2 * PI); return { re: re * s, im: im * s };
}
out('\n### 2  poissonAiry: the neglected term at x ≠ 0 is the residual CHIRP, not the quartic');
out('  n̄  σ   x     exact        poissonAiry   err(A.4)    +chirp       err(chirp)   γ=3πxσ²/n̄   β₄');
for (const [nb, sg] of [[600, 2], [600, 4], [150, 2], [300, 3]]) {
  const pops = packet({ nbar: nb, sigma: sg }), { Tcl, Trev } = revivalClocks(nb), cl = revivalClocks(nb, sg);
  for (const x of [0.25, 0.5, 1.0]) {
    const exact = ladderAutocorr(pops, Trev + x * Tcl).abs, pred = poissonAiry(nb, sg, x);
    const gamma = 3 * PI * x * sg * sg / nb, beta = cl.beta3;
    let L = -(4 * PI * nb / 3) - 2 * PI * x; L -= 2 * PI * Math.round(L / (2 * PI));
    const a0 = -L * sg;
    let sre = 0, sim = 0, norm = 0;
    for (let j = -24; j <= 24; j++) { const v = chirpI(a0 - 2 * PI * sg * j, beta, gamma); sre += v.re; sim += v.im; norm += Math.exp(-2 * PI * PI * sg * sg * j * j); }
    const withChirp = Math.hypot(sre, sim) / norm;
    out('  ' + String(nb).padStart(4) + ' ' + sg + '  ' + String(x).padStart(4) + '  ' + exact.toFixed(9) + '  ' + pred.toFixed(9) + '  ' +
        Math.abs(exact - pred).toExponential(3) + '  ' + withChirp.toFixed(9) + '  ' + Math.abs(exact - withChirp).toExponential(3) +
        '  ' + gamma.toExponential(3) + '  ' + cl.beta4.toExponential(3));
  }
}

/* ═══ 3 · schmidt: the Jacobi off-diagonal threshold is absolute, the matrix is not ═══ */
out('\n### 3  schmidt on a NON-diagonal shell matrix scaled by ε (Jacobi threshold off < 1e-30)');
{
  const base = new Float64Array(91), bim = new Float64Array(91);
  let seed = 7; const rnd = () => { seed = (seed * 1103515245 + 12345) >>> 0; return seed / 4294967296 - 0.5; };
  for (let l = 0; l < 4; l++) for (let m = -l; m <= l; m++) { const a = stateOf(4, l, m).index; base[a] = rnd(); bim[a] = rnd(); }
  let nn = 0; for (let i = 0; i < 91; i++) nn += base[i] ** 2 + bim[i] ** 2; nn = Math.sqrt(nn);
  for (let i = 0; i < 91; i++) { base[i] /= nn; bim[i] /= nn; }
  const ref = schmidt(shellMatrix(base, bim, 4)).values;
  out('  ε=1 (reference): ' + J(ref.map((v) => +v.toFixed(10))));
  for (const eps of [1e-3, 1e-5, 1e-6, 1e-7, 1e-8, 1e-9]) {
    const re = Float64Array.from(base, (v) => v * eps), im = Float64Array.from(bim, (v) => v * eps);
    const s = schmidt(shellMatrix(re, im, 4)).values;
    let worst = 0; for (let i = 0; i < s.length; i++) worst = Math.max(worst, Math.abs(s[i] - ref[i]));
    out('  ε=' + String(eps).padEnd(6) + '  schmidt=' + J(s.map((v) => +v.toFixed(10))) + '  max dev from reference = ' + worst.toExponential(3));
  }
}

/* ═══ 4 · peakLaw: where is the optimal truncation actually tighter than 1e-3? ═══ */
out('\n### 4  peakLaw: the seriesUsable flag (hard-coded β < 0.32) against the truth');
out('   β      α*ser        α*num        relα      hser        hnum        relh       α*Err(reported)  flag');
for (const b of [0.05, 0.06, 0.07, 0.08, 0.09, 0.1, 0.12, 0.15, 0.2, 0.25, 0.3, 0.31, 0.319]) {
  const p = peakLaw(b);
  out('  ' + b.toFixed(3) + '  ' + p.alphaStar.toFixed(8) + '  ' + p.alphaStarNum.toFixed(8) + '  ' +
      (Math.abs(p.alphaStar - p.alphaStarNum) / Math.abs(p.alphaStarNum)).toExponential(2) + '  ' +
      p.height.toFixed(8) + '  ' + p.heightNum.toFixed(8) + '  ' +
      (Math.abs(p.height - p.heightNum) / p.heightNum).toExponential(2) + '  ' + p.alphaStarError.toExponential(3) + '  ' + p.seriesUsable);
}
