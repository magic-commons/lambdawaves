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
/* the 16 zeros of each j_l are radius-free (z, never k = z/a): found once per session and shared by every build and the table */
const Z16 = [];
const zeros16 = (l) => Z16[l] || (Z16[l] = zerosOf(l, NRMAX));

/* ── THE HERMITE-256 RADIAL TABLE (optimization 2026-09-24, K7 · AUDIT-A FA1, REFUTE-F §2, SOL-REVIEW §3a) — OPT-IN ──
 * j_l(k r) = j_l(z u) with u = r/a, so each mode's radial is ONE fixed function of u ∈ [0, 1] whatever the radius: 256 rows
 * (row = l·16 + n_r, build()'s own order) × 256 samples of (j_l(z u), h·z·j_l′(z u)), h = 1/255, which the kernel reads
 * with cubic Hermite instead of running the Miller recurrence per voxel per mode (128³: 46.8 → ~8 ms).  NOT bit-identical:
 * AUDIT-A measured every changed texel CLOSER to the exact value (≤ 1 fp16 ulp against the shipped ≤ 41) and ≤ 0.02 % of
 * pixels moved by one level; Sol showed that is strong evidence, not a proof — so it shipped OFF for Josh to judge, and on
 * 2026-09-25 (W125) he made it THE DEFAULT: rack.js arms it at boot, `?gastab=0` / `__LW.gasTable(false)` is the opt-out,
 * where every record carries lag[3] = 0 and the kernel runs the recurrence.  Armed is not built: setTable(true) on a gas
 * that holds no packet only records the wish, and the idle slices start at the first launch() — a session that never
 * opens AXIAL 256 builds nothing (idle is zero work). */
export const GAS_TABLE_N = 256;
const jprime = (l, x) => { if (x < 1e-6) return l === 1 ? 1 / 3 : 0; return l === 0 ? -sphj(1, x) : sphj(l - 1, x) - (l + 1) / x * sphj(l, x); };
function* gasTableSteps(N) {
  const arr = new Float32Array((LMAX + 1) * NRMAX * N * 2), h = 1 / (N - 1);
  for (let l = 0; l <= LMAX; l++) {
    const z = zeros16(l);
    for (let nr = 0; nr < NRMAX; nr++) { const row = l * NRMAX + nr, Z = z[nr]; for (let j = 0; j < N; j++) { const u = j * h, o = (row * N + j) * 2; arr[o] = sphj(l, Z * u); arr[o + 1] = h * Z * jprime(l, Z * u); } yield; }
  }
  return arr;
}
let TABLE = null, tableSteps = null;
/** the table (cached): Float32Array(256 rows × N × 2) — rows in build() order, radius-free */
export function gasRadialTable(N = GAS_TABLE_N) {
  if (N !== GAS_TABLE_N) { const g = gasTableSteps(N); let r; while (!(r = g.next()).done); return r.value; }
  if (!TABLE) { if (!tableSteps) tableSteps = gasTableSteps(N); let r; while (!(r = tableSteps.next()).done); TABLE = r.value; tableSteps = null; }
  return TABLE;
}
/** one idle slice of the table build: true once the table exists (the caller keeps slicing until then) */
function gasTableSlice(dl) {
  if (TABLE) return true;
  if (!tableSteps) tableSteps = gasTableSteps(GAS_TABLE_N);
  do { const r = tableSteps.next(); if (r.done) { TABLE = r.value; tableSteps = null; return true; } } while (!dl || dl.timeRemaining() > 2);
  return false;
}

export function createGas(a = 10, opts = {}) {
  const NRQ = opts.nr || 200, NTQ = opts.nt || 160;          // the quadrature grid (r midpoints × θ midpoints)
  let A = a, modes = [], Rt = null, Pt = null, r = null, ct = null, w = null, rw = null;
  let re0 = null, im0 = null, t0 = 0, on = false, captured = 0, last = null;
  /* THE RECORDS ARE PERSISTENT (optimization 2026-09-24, K3 · AUDIT-B FB6, F14): one kernel record per mode, built with
     the tables, and fieldModes(t) writes only re/im into them and into ONE reused list — it was 256 records × 4 objects
     (≈ 180 KB) per reconstruct.  The list is a reused buffer, exactly as rack.js' modesAt list is (render-exact H8). */
  let recs = [];
  const list = [];
  /* THE TABLES ARE BUILT ON FIRST USE (optimization 2026-09-24, K4 · AUDIT-D FD6, AUDIT-F, Sol §5.2).  They cost 14–18 ms,
     every boot paid them for a register most sessions never open, and WELL RADIUS paid them again on EVERY pointermove.
     Now setRadius only marks them stale; ensure() — at the top of every reader — builds them, in the same order from the
     same expressions (so every number is the same f64); and one idle warm builds them in ~1 ms slices shortly after
     boot, so the common first AXIAL press finds them ready.  The steps write the module's state only when complete: a
     radius change mid-warm discards the half-built one. */
  let built = false, steps = null;
  let tableRows = false, tableWant = false, tableGen = 0;     // K7: the records carry their table rows only once the table is UPLOADED
  let tableStart = null;                                      // W125: an armed table waits here for the first launch()
  function* building() {
    const ms = [];
    for (let l = 0; l <= LMAX; l++) { const z = zeros16(l); for (let nr = 0; nr < NRMAX; nr++) { const k = z[nr] / A; ms.push({ nr, l, k, z: z[nr], E: k * k / 2, rnorm: Math.sqrt(2 / (A * A * A * sphj(l + 1, z[nr]) ** 2)), anorm: Math.sqrt((2 * l + 1) / (4 * Math.PI)) }); } yield; }
    const r1 = new Float64Array(NRQ), rw1 = new Float64Array(NRQ), dr = A / NRQ;
    for (let i = 0; i < NRQ; i++) { r1[i] = (i + 0.5) * dr; rw1[i] = r1[i] * r1[i] * dr; }
    const ct1 = new Float64Array(NTQ), w1 = new Float64Array(NTQ), dth = Math.PI / NTQ;
    for (let j = 0; j < NTQ; j++) { const th = (j + 0.5) * dth; ct1[j] = Math.cos(th); w1[j] = Math.sin(th) * dth * 2 * Math.PI; }
    const R1 = [];
    for (const m of ms) { const row = new Float64Array(NRQ); for (let i = 0; i < NRQ; i++) row[i] = m.rnorm * sphj(m.l, m.k * r1[i]); R1.push(row); if (R1.length % 16 === 0) yield; }
    const P1 = []; for (let l = 0; l <= LMAX; l++) { const row = new Float64Array(NTQ); const an = Math.sqrt((2 * l + 1) / (4 * Math.PI)); for (let j = 0; j < NTQ; j++) row[j] = an * legP(l, ct1[j]); P1.push(row); }
    modes = ms; r = r1; rw = rw1; ct = ct1; w = w1; Rt = R1; Pt = P1;
    re0 = new Float64Array(modes.length); im0 = new Float64Array(modes.length);
    recs = modes.map((M, m) => ({ table: { n: 1, l: M.l, am: 0, m: 0, norm: M.rnorm * M.anorm, lag: Float64Array.from([M.k, A, 1, tableRows ? m + 1 : 0, 0, 0]), leg: new Float64Array(6), space: 'gas' }, re: 0, im: 0 }));   // lag[3]: K7's row + 1, 0 = the recurrence
    built = true;
  }
  function ensure() { if (built) return; if (!steps) steps = building(); while (!steps.next().done); steps = null; }
  /* the ONE-SHOT idle warm (a browser only: node has no requestIdleCallback, and the node suites build on first read).
     Armed like the kick warm — a first delay, then idle slices of at most one step past the deadline — and finished
     for good once built: no timer or callback survives it. */
  if (opts.warm !== false && typeof globalThis.requestIdleCallback === 'function') setTimeout(() => {
    const slice = (dl) => { if (built) { steps = null; return; } if (!steps) steps = building();
      do { if (steps.next().done) { steps = null; return; } } while (dl.timeRemaining() > 2);
      requestIdleCallback(slice); };
    requestIdleCallback(slice);
  }, opts.warmDelay === undefined ? 3000 : opts.warmDelay);
  /** ⟨a|b⟩ over the radial quadrature (same l): the basis check */
  function overlap(a, b) { ensure(); if (modes[a].l !== modes[b].l) return 0; let s = 0; for (let i = 0; i < NRQ; i++) s += Rt[a][i] * Rt[b][i] * rw[i]; return s; }
  /** project a Gaussian packet (centre z₀ on the axis, momentum k along z, width σ) at time t */
  function launch(z0, k, sigma, t = 0) {
    ensure();
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
    if (tableStart) { const start = tableStart; tableStart = null; start(); }   // W125: the register is IN USE now — an armed table starts its idle build
    return { captured, modes: N };
  }
  function at(t) {
    ensure();
    const N = modes.length, re = new Float64Array(N), im = new Float64Array(N);
    for (let m = 0; m < N; m++) { const ph = -modes[m].E * (t - t0), c = Math.cos(ph), s = Math.sin(ph); re[m] = re0[m] * c - im0[m] * s; im[m] = re0[m] * s + im0[m] * c; }
    return { re, im };
  }
  /** the kernel records: the well branch with P_l by recurrence (lag[2] = 1 says so) */
  function fieldModes(t) {
    ensure();
    let k = 0;
    for (let m = 0; m < modes.length; m++) {
      const ph = -modes[m].E * (t - t0), c = Math.cos(ph), s = Math.sin(ph);      // at(t)'s own expressions, without its two arrays
      const re = re0[m] * c - im0[m] * s, im = re0[m] * s + im0[m] * c;
      if (Math.abs(re) < 1e-7 && Math.abs(im) < 1e-7) continue;
      const R = recs[m]; R.re = re; R.im = im; list[k++] = R;
    }
    list.length = k;
    return list;
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
    get modes() { ensure(); return modes; },
    /** K7: on → the table is built (idle slices in a browser, at once in node), handed to `upload(table)` — the
     *  field's setGasTable, which answers true once it holds it — and only THEN do the records carry lag[3] = row + 1, so
     *  no frame ever reads a table that is not there (until then, and on a refusal, the kernel runs the recurrence).
     *  `upload` may answer null for NOT NOW (an export is running): the landing is retried on a later idle slice, so a
     *  deterministic render never straddles the switch.  off → every record back to lag[3] = 0 at once.  `landed()` is
     *  called after either change reaches the records.
     *  W125: while the register is not in use (no packet launched yet, or off() / a radius change took it away), on only
     *  ARMS the table: nothing is sliced until launch() puts a packet in.  `table` reads 'building' from the moment it is
     *  wanted until the records carry it — armed or slicing, the kernel runs the recurrence meanwhile. */
    setTable(want, upload, landed) {
      tableWant = !!want; const gen = ++tableGen; tableStart = null;
      const mark = (v) => { tableRows = v; if (built) for (let m = 0; m < recs.length; m++) recs[m].table.lag[3] = v ? m + 1 : 0; if (landed) landed(v); };
      if (!tableWant) { if (tableRows) mark(false); return 'off'; }
      if (tableRows) return 'on';
      const idle = typeof globalThis.requestIdleCallback === 'function';
      const land = () => { if (gen !== tableGen || !tableWant) return; const held = upload ? upload(gasRadialTable()) : true;
        if (held === false) { tableWant = false; return; }
        if (held === null) { if (idle) requestIdleCallback(land); return; }
        mark(true); };
      const start = () => { if (!idle) { land(); return; }
        const slice = (dl) => { if (gen !== tableGen) return; if (gasTableSlice(dl)) land(); else requestIdleCallback(slice); };
        requestIdleCallback(slice); };
      if (!on) { tableStart = start; return this.table; }                // armed: the first launch() starts it
      start();
      return this.table;
    },
    get table() { return tableRows ? 'on' : tableWant ? 'building' : 'off'; }, get captured() { return captured; }, get last() { return last; }, get radius() { return A; },
    setRadius(v) { if (v !== A) { A = v; built = false; steps = null; on = false; } },   // K4: stale, not rebuilt — the next reader builds
    /* K5w (optimization 2026-09-24 · AUDIT-B FB1, AUDIT-F F11, SOL-REVIEW K5): stats(t) is 8–17 ms, so SPECTRUM's readout
       asks the maths worker for it.  These two only carry the register across: stats() itself is untouched, and the
       worker's gas builds its own tables from the same radius by the same expressions — the same doubles. */
    /** the register stats(t) evolves: c(t₀) (the page's own arrays — a postMessage copies them) and t₀ */
    get register() { return re0 && { re0, im0, t0 }; },
    /** the maths worker's side: take a posted register (copied), so stats(t) evolves the same c(t₀) over this gas's tables */
    load(reg) { ensure(); re0 = Float64Array.from(reg.re0); im0 = Float64Array.from(reg.im0); t0 = reg.t0; on = true; },
    norm2(t) { const c = at(t); let s = 0; for (let m = 0; m < c.re.length; m++) s += c.re[m] ** 2 + c.im[m] ** 2; return s; },
  };
}
