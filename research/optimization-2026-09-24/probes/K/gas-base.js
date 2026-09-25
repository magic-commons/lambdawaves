/* gas.js — THE AXIAL GAS: a second register for the BOX.
 *
 * The instrument's register holds the 91 hydrogen labels, l ≤ 5 — and no reinterpretation of those labels can put
 * more than six angular waves into the box, so a packet there is never smaller than about a/6.  This register is
 * built for the box alone: the well's eigenstates with m = 0 about the z axis, n_r ≤ 15 and l ≤ 15 — 256 modes.
 * A packet is the NUMERICAL projection of a Gaussian (centre z₀ on the axis, momentum k along it, width σ) on a
 * (r, θ) quadrature grid; the capture is reported.  Its evolution is EXACT in the well's own basis:
 * c(t) = c(t₀) e^{−iE(t − t₀)}, E = z²_{n_r+1,l} / 2a².  The field reads it through the well branch of the kernel,
 * which builds P_l(cos θ) by recurrence for these modes (the six-coefficient table stops at l = 5).
 *
 * What the extra modes buy: σ down to ≈ 0.6 a₀ at a = 10 (k up to ≈ 5), and a real reflection at the wall with the
 * interference fringes of the returning wave.  What they cannot buy: a packet that keeps its width — a free Gaussian
 * spreads as σ√(1 + (t/2σ²)²), and a small one spreads fast.  That is physics; the oscillator's coherent state is
 * the one packet that does not.
 */
export const LMAX = 15, NRMAX = 16;

/** j_l(x) by Miller's downward recurrence normalised on j₀ — stable for every l here */
export function sphj(l, x) {
  if (x < 1e-8) return l === 0 ? 1 : 0;
  const j0 = Math.sin(x) / x, j1 = Math.sin(x) / (x * x) - Math.cos(x) / x; let b = 0, a = 1e-30, out = 0; const start = l + 24 + Math.floor(x);
  for (let m = start; m >= 1; m--) { const c = (2 * m + 1) / x * a - b; b = a; a = c; if (m - 1 === l) out = c; if (Math.abs(a) > 1e20) { a *= 1e-20; b *= 1e-20; out *= 1e-20; } }
  return Math.abs(j0) > 1e-4 ? out * j0 / a : out * j1 / b;   // normalise on j₁ where j₀ vanishes (x = nπ): the norms of the l = 0 modes live exactly there
}
/** the first `count` positive zeros of j_l: bracket on a fine grid, then bisection */
export function zerosOf(l, count) {
  const out = []; let x = l + 0.5, f = sphj(l, x); const h = 0.02;
  while (out.length < count) {
    const x2 = x + h, f2 = sphj(l, x2);
    if (f * f2 < 0) { let lo = x, hi = x2, flo = f; for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2, fm = sphj(l, mid); if (fm * flo < 0) hi = mid; else { lo = mid; flo = fm; } } out.push((lo + hi) / 2); }
    x = x2; f = f2;
    if (x > 5000) throw new Error('zerosOf: ran away');
  }
  return out;
}
/** P_l(x) by Bonnet's recurrence */
export function legP(l, x) { if (l === 0) return 1; let p0 = 1, p1 = x; for (let k = 2; k <= l; k++) { const p2 = ((2 * k - 1) * x * p1 - (k - 1) * p0) / k; p0 = p1; p1 = p2; } return p1; }

export function createGas(a = 10, opts = {}) {
  const NRQ = opts.nr || 200, NTQ = opts.nt || 160;          // the quadrature grid (r midpoints × θ midpoints)
  let A = a, modes = [], Rt = null, Pt = null, r = null, ct = null, w = null, rw = null;
  let re0 = null, im0 = null, t0 = 0, on = false, captured = 0, last = null;
  function build() {
    modes = [];
    for (let l = 0; l <= LMAX; l++) { const z = zerosOf(l, NRMAX); for (let nr = 0; nr < NRMAX; nr++) { const k = z[nr] / A; modes.push({ nr, l, k, z: z[nr], E: k * k / 2, rnorm: Math.sqrt(2 / (A * A * A * sphj(l + 1, z[nr]) ** 2)), anorm: Math.sqrt((2 * l + 1) / (4 * Math.PI)) }); } }
    r = new Float64Array(NRQ); rw = new Float64Array(NRQ); const dr = A / NRQ;
    for (let i = 0; i < NRQ; i++) { r[i] = (i + 0.5) * dr; rw[i] = r[i] * r[i] * dr; }
    ct = new Float64Array(NTQ); w = new Float64Array(NTQ); const dth = Math.PI / NTQ;
    for (let j = 0; j < NTQ; j++) { const th = (j + 0.5) * dth; ct[j] = Math.cos(th); w[j] = Math.sin(th) * dth * 2 * Math.PI; }
    Rt = modes.map((m) => { const row = new Float64Array(NRQ); for (let i = 0; i < NRQ; i++) row[i] = m.rnorm * sphj(m.l, m.k * r[i]); return row; });
    Pt = []; for (let l = 0; l <= LMAX; l++) { const row = new Float64Array(NTQ); const an = Math.sqrt((2 * l + 1) / (4 * Math.PI)); for (let j = 0; j < NTQ; j++) row[j] = an * legP(l, ct[j]); Pt.push(row); }
    re0 = new Float64Array(modes.length); im0 = new Float64Array(modes.length);
  }
  build();
  /** ⟨a|b⟩ over the radial quadrature (same l): the basis check */
  function overlap(a, b) { if (modes[a].l !== modes[b].l) return 0; let s = 0; for (let i = 0; i < NRQ; i++) s += Rt[a][i] * Rt[b][i] * rw[i]; return s; }
  /** project a Gaussian packet (centre z₀ on the axis, momentum k along z, width σ) at time t */
  function launch(z0, k, sigma, t = 0) {
    const N = modes.length; re0 = new Float64Array(N); im0 = new Float64Array(N);
    let n2 = 0;
    const psiR = new Float64Array(NRQ * NTQ), psiI = new Float64Array(NRQ * NTQ);
    for (let i = 0; i < NRQ; i++) for (let j = 0; j < NTQ; j++) {
      const zz = r[i] * ct[j], q2 = r[i] * r[i] - 2 * r[i] * z0 * ct[j] + z0 * z0;
      const g = Math.exp(-q2 / (4 * sigma * sigma)), ph = k * zz, o = i * NTQ + j;
      psiR[o] = g * Math.cos(ph); psiI[o] = g * Math.sin(ph); n2 += g * g * rw[i] * w[j];
    }
    for (let m = 0; m < N; m++) {
      const R = Rt[m], P = Pt[modes[m].l]; let cr = 0, ci = 0;
      for (let i = 0; i < NRQ; i++) { const rr = R[i] * rw[i]; if (rr === 0) continue; let sr = 0, si = 0; for (let j = 0; j < NTQ; j++) { const pw = P[j] * w[j], o = i * NTQ + j; sr += pw * psiR[o]; si += pw * psiI[o]; } cr += rr * sr; ci += rr * si; }
      re0[m] = cr; im0[m] = ci;
    }
    let c2 = 0; for (let m = 0; m < N; m++) c2 += re0[m] * re0[m] + im0[m] * im0[m];
    captured = n2 > 0 ? c2 / n2 : 0;
    const s = c2 > 0 ? 1 / Math.sqrt(c2) : 1; for (let m = 0; m < N; m++) { re0[m] *= s; im0[m] *= s; }
    t0 = t; on = true; last = { z0, k, sigma, t0, captured };
    return { captured, modes: N };
  }
  function at(t) {
    const N = modes.length, re = new Float64Array(N), im = new Float64Array(N);
    for (let m = 0; m < N; m++) { const ph = -modes[m].E * (t - t0), c = Math.cos(ph), s = Math.sin(ph); re[m] = re0[m] * c - im0[m] * s; im[m] = re0[m] * s + im0[m] * c; }
    return { re, im };
  }
  /** the kernel records: the well branch with P_l by recurrence (lag[2] = 1 says so) */
  function fieldModes(t) {
    const c = at(t), out = [];
    for (let m = 0; m < modes.length; m++) {
      if (Math.abs(c.re[m]) < 1e-7 && Math.abs(c.im[m]) < 1e-7) continue;
      const M = modes[m];
      out.push({ table: { n: 1, l: M.l, am: 0, m: 0, norm: M.rnorm * M.anorm, lag: Float64Array.from([M.k, A, 1, 0, 0, 0]), leg: new Float64Array(6), space: 'gas' }, re: c.re[m], im: c.im[m] });
    }
    return out;
  }
  /** ψ on a coarser grid → norm, ⟨z⟩, σ_z, ⟨r⟩ */
  function stats(t, stride = 2) {
    const c = at(t); let n = 0, z = 0, z2 = 0, rr = 0;
    for (let i = 0; i < NRQ; i += stride) for (let j = 0; j < NTQ; j += stride) {
      let pr = 0, pi = 0;
      for (let m = 0; m < modes.length; m++) { const v = Rt[m][i] * Pt[modes[m].l][j]; if (v === 0) continue; pr += c.re[m] * v; pi += c.im[m] * v; }
      const d = (pr * pr + pi * pi) * rw[i] * w[j] * stride * stride, zz = r[i] * ct[j];
      n += d; z += d * zz; z2 += d * zz * zz; rr += d * r[i];
    }
    if (n <= 0) return { norm: 0, z: 0, sz: 0, r: 0 };
    return { norm: n, z: z / n, sz: Math.sqrt(Math.max(0, z2 / n - (z / n) ** 2)), r: rr / n };
  }
  return {
    get on() { return on; }, off() { on = false; }, launch, at, fieldModes, stats, overlap,
    get modes() { return modes; }, get captured() { return captured; }, get last() { return last; }, get radius() { return A; },
    setRadius(v) { if (v !== A) { A = v; build(); on = false; } },
    norm2(t) { const c = at(t); let s = 0; for (let m = 0; m < c.re.length; m++) s += c.re[m] ** 2 + c.im[m] ** 2; return s; },
  };
}
