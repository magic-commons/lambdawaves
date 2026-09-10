/* wignerview.js — the WIGNER window: the (z, p_z) SLICE of the register's own phase-space function, drawn.
 *
 * WHAT IS ON THE CARD.  lab/wigner.js's wignerSlice on a 64 × 64 grid of the cut x = y = 0, p_x = p_y = 0, painted
 * as a SIGNED map: zero is the card's own ground (the neutral midpoint of the diverging scale, so it reads right in
 * both themes), positive ink is the interface's first accent --acc and negative ink its second --acc2 — the same
 * two colours the accent wheel already gives every other view, and no third colour anywhere.  The magnitude is
 * carried by the ink's OPACITY through |W/W_max|^0.35, because the 1s negative lobe is 1 % of the peak (−3.10e-4
 * against 1/π³) and a linear ramp would draw it as nothing; the exponent is a display law only and the readouts
 * print the true extremes.  The axes are z (a₀) across and p_z (a.u.) up, with ticks and the zero cross.
 *
 * WHAT THE READOUTS SAY.  W(0, 0) is evaluated AT the origin by wignerAxial (an even grid has no point there); the
 * minimum is the grid's argmin REFINED off the grid by a compass search on wignerAxial, which is why the 1s reads
 * −3.09726e-4 at (1.3295, 1.3791) — the module's certified pair — and not the −3.02e-4 the 64 × 64 grid can see.
 * The state is taken PER UNIT NORM (a slapped register still reads as a state) and capped at the six most populated
 * labels, the cap being said when it bites: the cost is quadratic in the terms and this runs inside a frame.
 *
 * THE ONE THING THIS WINDOW MUST NOT LET YOU BELIEVE: it is a SLICE, not a marginal.  ∫∫ W(z, p_z) dz dp_z is 1/π²
 * for the 1s, not 1, and the card says so in its own line, which the digest carries.
 *
 * STATUS: NUMERICAL (quadrature) on the register's EXACT analytic ψ — lab/wigner.js's status, unchanged; this file
 * is a view and computes no physics of its own.  Hydrogenic register only: under any other Hamiltonian, and under
 * the Sturmian scale, the closed-form radials the slice integrates are not the ones in force, so it stands down.
 */
import { wignerSlice, wignerAxial } from './wigner.js';
import { BASIS } from './hydrogen.js';
import { el, knob, readout, graphHover, fitText, cssRGB, accentRGB } from './kit.js';

const NZ = 64, NP = 64;                 // the grid the window runs (the brief's 64 × 64)
const GAMMA = 0.35;                     // the display law for the ink's opacity: |W/W_max|^γ, printed on the card
const TERM_CAP = 6;                     // the most populated labels the map integrates (the cost is O(terms²))
const LABEL = 'SLICE through x = y = 0, p_x = p_y = 0 — ∫∫ ≠ 1';

/** a CSS colour token resolved through the canvas (so any colour form parses), as [r, g, b] — kit.js's reader (wave 57) */
const readRGB = (g, name, fallback) => cssRGB(g, name, fallback);

/**
 * createWigner(host, api) — api: { repaint() } (ask the rack for a frame when a knob moves).
 * The rack drives it with update(reg, t, playing, on); everything else is this module's own.
 */
export function createWigner(host, api = {}) {
  let zmax = 8, pmax = 2, zTouched = false;                 // untouched, Z RANGE follows the stage's own domain half
  let cache = null, key = '', lastWall = -1e9, capped = 0, terms = 0, norm2 = 1;

  const r0 = el('div', 'row tight', host);
  const kZ = knob({ label: 'Z RANGE  a₀', min: 2, max: 40, value: 8, fmt: (v) => '± ' + v.toFixed(1),
    onInput: (v) => { zmax = v; zTouched = true; key = ''; if (api.repaint) api.repaint(); } });
  const kP = knob({ label: 'P RANGE  a.u.', min: 0.5, max: 4, value: 2, fmt: (v) => '± ' + v.toFixed(2),
    onInput: (v) => { pmax = v; key = ''; if (api.repaint) api.repaint(); } });
  r0.appendChild(kZ.root); r0.appendChild(kP.root);

  const cv = el('canvas', 'wig-c', host);
  /* WAVE 46 — the two coloured sign glyphs ("+" in the accent, "−" in the second) floated in the map's own
     top-right corner, over the distribution.  The map answers for itself: hovering reads (z, p_z) and W there,
     with its sign in words.  The tick ladder is the two END values per axis, in the muted ink — no more. */
  let rect = null;
  const hover = graphHover(cv, { repaint: () => paint(), plot: () => rect });
  const g = cv.getContext('2d');
  const off = document.createElement('canvas'); off.width = NZ; off.height = NP;
  const octx = off.getContext('2d');

  const line = el('div', 'wig-law', host, LABEL);
  const stand = el('div', 'wig-stand', host, ''); stand.hidden = true;

  const rr = el('div', 'row tight', host);
  const roPeak = readout({ label: 'W(0, 0)', value: '—', sub: 'a.u.⁻³ · 1/π³ = 0.0322515 for the 1s' });
  const roMin = readout({ label: 'MINIMUM  (z, p_z)', value: '—', cls: 'wide', sub: 'W is not positive: the negative lobe is the state\'s own non-classicality' });
  const roMax = readout({ label: 'MAXIMUM', value: '—', sub: 'on the 64 × 64 grid' });
  const roMs = readout({ label: 'COMPUTE', value: '—', sub: '64 × 64 · order normal · throttled to 2 Hz while playing' });
  for (const r of [roPeak, roMin, roMax, roMs]) rr.appendChild(r.root);

  el('div', 'note', host).innerHTML = '<b>Phase-space slice.</b> This is W(z,p<sub>z</sub>) at x = y = p<sub>x</sub> = p<sub>y</sub> = 0, not a marginal distribution. Negative values use Accent B. Opacity is display-scaled; readouts retain the signed values. Hydrogenic position-space states only.';

  /* ── the map ─────────────────────────────────────────────────────────── */
  function clear() { const W = cv.clientWidth, H = cv.clientHeight; if (W > 0 && H > 0) { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); } }
  function paint() {
    const W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (W < 40 || H < 40 || !cache) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const ML = 30, MR = 8, MT = 8, MB = 24, pw = W - ML - MR, ph = H - MT - MB;   // MB: TWO rows under the frame — the end ticks, then the axis name (they used to print over one another)
    if (pw < 20 || ph < 20) return;
    const A = accentRGB(g, 1), B = accentRGB(g, 2), dim = readRGB(g, '--dim', '#b8b8b8');
    const S = cache.slice, amp = Math.max(Math.abs(S.min), Math.abs(S.max)) || 1;
    /* the raster: row y is p (flipped, +p up), column x is z; ink = accent, opacity = |W/amp|^γ */
    const img = octx.createImageData(NZ, NP);
    for (let y = 0; y < NP; y++) {
      const j = NP - 1 - y;
      for (let x = 0; x < NZ; x++) {
        const v = S.W[x * NP + j], c = v >= 0 ? A : B, o = 4 * (y * NZ + x);
        img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2];
        img.data[o + 3] = Math.round(255 * Math.min(1, Math.pow(Math.abs(v) / amp, GAMMA)));
      }
    }
    octx.putImageData(img, 0, 0);
    g.imageSmoothingEnabled = true;
    g.drawImage(off, 0, 0, NZ, NP, ML, MT, pw, ph);
    /* the frame, the zero cross and the ticks */
    const ink = (a) => `rgba(${dim[0]},${dim[1]},${dim[2]},${a})`;
    g.strokeStyle = ink(0.35); g.lineWidth = 1; g.strokeRect(ML + 0.5, MT + 0.5, pw - 1, ph - 1);
    const xOf = (z) => ML + (z + zmax) / (2 * zmax) * pw, yOf = (p) => MT + (pmax - p) / (2 * pmax) * ph;
    g.strokeStyle = ink(0.22); g.setLineDash([2, 3]); g.beginPath();
    g.moveTo(xOf(0), MT); g.lineTo(xOf(0), MT + ph); g.moveTo(ML, yOf(0)); g.lineTo(ML + pw, yOf(0)); g.stroke(); g.setLineDash([]);
    g.font = '8px ui-monospace, monospace'; g.fillStyle = ink(0.8);
    g.textBaseline = 'top';
    const fmt = (v) => (Math.abs(v) >= 10 ? v.toFixed(0) : v.toFixed(1));
    /* ROW ONE under the frame: the two END values only, tucked to the frame's own corners so neither can reach
       the y gutter.  ROW TWO: the axis name.  Both measured — nothing here may leave its row. */
    const row1 = { x0: ML, y0: MT + ph, x1: ML + pw, y1: H }, row2 = { x0: ML, y0: MT + ph + 11, x1: ML + pw, y1: H };
    fitText(g, fmt(-zmax), ML, MT + ph + 2, row1, 'left');
    fitText(g, fmt(zmax), ML + pw, MT + ph + 2, row1, 'right');
    g.textBaseline = 'middle';
    for (const f of [-1, 1]) { const p = f * pmax; fitText(g, fmt(p), ML - 3, yOf(p), { x0: 0, y0: 0, x1: ML - 2, y1: H }, 'right'); }   // the p end values, in the gutter
    g.textBaseline = 'alphabetic'; g.fillStyle = ink(0.65);
    fitText(g, 'z  a₀', ML + pw / 2, MT + ph + 21, row2, 'center');
    g.save(); g.translate(9, MT + ph / 2); g.rotate(-Math.PI / 2); g.fillStyle = ink(0.65); fitText(g, 'p_z  a.u.', 0, 0, { x0: -ph / 2, y0: -4, x1: ph / 2, y1: 4 }, 'center'); g.restore();
    rect = { x0: ML, y0: MT, x1: ML + pw, y1: MT + ph };
    hover.set([{ kind: 'bar', key: 'map', quiet: true, x: ML, y: MT, w: pw, h: ph, colour: ink(1),
      info: (mx, my) => {
        const z = (mx - ML) / pw * 2 * zmax - zmax, pz = pmax - (my - MT) / ph * 2 * pmax;
        const ix = Math.max(0, Math.min(NZ - 1, Math.round((z + zmax) / (2 * zmax) * (NZ - 1))));
        const ip = Math.max(0, Math.min(NP - 1, Math.round((pz + pmax) / (2 * pmax) * (NP - 1))));
        const v = S.W[ix * NP + ip];
        return `z = ${z.toFixed(2)} a₀  ·  p_z = ${pz.toFixed(2)} a.u.  ·  W = ${v >= 0 ? '+' : '−'}${Math.abs(v).toExponential(3)}  (${v >= 0 ? 'positive' : 'NEGATIVE — no classical density'})`;
      } }], rect);
  }

  /* ── the minimum, refined off the grid (compass search on wignerAxial: the grid cannot see −3.097e-4).
     One evaluation costs about a z-row of the map, so the search carries a WALL BUDGET as well as a step
     tolerance: the 1s converges to its certified six digits inside it, and a six-label state stops early. ── */
  function refine(tm, z0, p0, dz, dp) {
    const T0 = performance.now();
    let z = z0, p = p0, v = wignerAxial(tm, z, p), sz = dz, sp = dp, n = 1;
    for (let it = 0; it < 60 && (sz > 1e-5 || sp > 1e-5); it++) {
      if (performance.now() - T0 > 80) break;
      let best = v, bz = z, bp = p;
      for (const [a, b] of [[sz, 0], [-sz, 0], [0, sp], [0, -sp], [sz, sp], [-sz, -sp], [sz, -sp], [-sz, sp]]) {
        const w = wignerAxial(tm, z + a, p + b); n++;
        if (w < best) { best = w; bz = z + a; bp = p + b; }
      }
      if (best < v) { v = best; z = bz; p = bp; } else { sz *= 0.5; sp *= 0.5; }
    }
    return { v, z, p, evals: n };
  }

  /* ── the compute ─────────────────────────────────────────────────────── */
  function build(reg, t) {
    const c = reg.at(t), ids = reg.populated();
    let n2 = 0; for (const a of ids) n2 += c.re[a] * c.re[a] + c.im[a] * c.im[a];
    const s = n2 > 0 ? 1 / Math.sqrt(n2) : 1;
    const all = ids.map((a) => ({ a, re: c.re[a] * s, im: c.im[a] * s }))
      .sort((x, y) => (y.re * y.re + y.im * y.im) - (x.re * x.re + x.im * x.im));
    const tm = all.slice(0, TERM_CAP);
    capped = all.length - tm.length; terms = tm.length; norm2 = n2;
    if (!tm.length) { cache = null; return null; }
    const slice = wignerSlice(tm, { z: [-zmax, zmax, NZ], p: [-pmax, pmax, NP], order: 'normal' });
    const t0 = performance.now();
    const peak = wignerAxial(tm, 0, 0);                                   // an even grid has no point at the origin
    const dz = 2 * zmax / (NZ - 1), dp = 2 * pmax / (NP - 1);
    const min = refine(tm, slice.argmin.z, slice.argmin.p, dz, dp);
    const refineMs = performance.now() - t0;
    cache = { slice, peak, min, terms: tm, ms: slice.ms, refineMs, zmax, pmax,
      labels: tm.map((x) => BASIS[x.a].label).join(' ') };
    return cache;
  }
  function say() {
    if (!cache) { for (const r of [roPeak, roMin, roMax, roMs]) r.set('—', 'warn'); return; }
    const C = cache;
    roPeak.set(C.peak.toFixed(7), 'live');
    roPeak.setSub(`a.u.⁻³ · 1s reference 0.0322515 · norm ${norm2.toFixed(6)}`);
    roMin.set(`${C.min.v.toExponential(4)}  at  z = ${C.min.z.toFixed(4)},  p_z = ${C.min.p.toFixed(4)}`, C.min.v < 0 ? 'ok' : '');
    roMin.setSub(`refined off-grid · ${C.min.evals} evaluations · negative values use Accent B`);
    roMax.set(C.slice.max.toExponential(4));
    roMax.setSub(`64 × 64 · ${C.labels}${capped ? ' · ' + capped + ' omitted' : ''}`);
    roMs.set(`${C.ms.toFixed(0)} ms  +  ${C.refineMs.toFixed(0)} ms`, C.ms > 400 ? 'warn' : '');
    roMs.setSub(`map and minimum · ${terms} label${terms > 1 ? 's' : ''} · 2 Hz while playing`);
  }

  /**
   * update(reg, t, playing, on) — recomputes when the state, the time or a range has changed: at once when paused
   * (a scrub, an edit, a knob), at most twice a second while playing.  `on` is the rack's guard (live, open,
   * hydrogenic, position space); off, the window stands down and says why.
   */
  function update(reg, t, playing, on, why, half) {
    if (!on) {
      if (cache) { cache = null; clear(); say(); }
      key = '';
      stand.hidden = false; stand.textContent = why || 'hydrogenic register only — the slice integrates the register\'s own closed-form ψ';
      line.hidden = true;
      return;
    }
    stand.hidden = true; line.hidden = false;
    if (!zTouched && half > 0 && isFinite(half)) {                        // the shipped Z RANGE is the domain half in force
      const z = Math.max(2, Math.min(40, half));
      if (Math.abs(z - zmax) > 1e-9) { zmax = z; kZ.set(z); kZ.setDefault(z); key = ''; }
    }
    const k = `${reg.version}|${t.toFixed(6)}|${zmax.toFixed(4)}|${pmax.toFixed(4)}`;
    if (k === key) return;
    const now = performance.now();
    if (playing && now - lastWall < 500) return;                          // ≤ 2 Hz while playing; every change when paused
    key = k; lastWall = now;
    build(reg, t); paint(); say();
  }

  /** the digest's table — the law, the grid and the numbers, as text for the notebook */
  function table() {
    if (!cache) return LABEL + '\n(the window is stood down: hydrogenic register only)';
    const C = cache;
    return [LABEL,
      `grid\t${NZ} × ${NP}\tz ∈ [${(-zmax).toFixed(2)}, ${zmax.toFixed(2)}] a₀\tp_z ∈ [${(-pmax).toFixed(2)}, ${pmax.toFixed(2)}] a.u.`,
      `labels\t${C.labels}${capped ? ' (+' + capped + ' dropped, cap 6)' : ''}\t‖c‖² = ${norm2.toFixed(6)}`,
      `W(0, 0)\t${C.peak.toFixed(9)}\t1/π³ = 0.032251534 for the 1s`,
      `minimum\t${C.min.v.toExponential(4)}\tat z = ${C.min.z.toFixed(6)}, p_z = ${C.min.p.toFixed(6)} (refined off the grid)`,
      `maximum\t${C.slice.max.toExponential(4)}\ton the grid`,
      `∫∫ over the slice\tNOT 1\t1/π² = 0.101321 for the 1s — this is a SLICE, not a marginal`,
      `compute\t${C.ms.toFixed(1)} ms + ${C.refineMs.toFixed(1)} ms\torder normal · ink opacity |W/W_max|^${GAMMA}`].join('\n');
  }

  window.addEventListener('resize', () => paint());
  return {
    update, table, paint,
    get stats() { return cache ? { peak: cache.peak, min: cache.min.v, minAt: [cache.min.z, cache.min.p], max: cache.slice.max, ms: cache.ms, refineMs: cache.refineMs, terms, capped, norm2, zmax, pmax, nz: NZ, np: NP, label: LABEL } : null; },
    get cache() { return cache; },
    /** the slice itself (recomputed if the state has moved since the last frame) */
    slice(reg, t) { if (reg && (!cache || key !== `${reg.version}|${t.toFixed(6)}|${zmax.toFixed(4)}|${pmax.toFixed(4)}`)) { key = `${reg.version}|${t.toFixed(6)}|${zmax.toFixed(4)}|${pmax.toFixed(4)}`; build(reg, t); paint(); say(); } return cache ? cache.slice : null; },
    setRange(z, p) {
      if (z !== undefined && isFinite(z)) { zmax = Math.max(2, Math.min(40, +z)); kZ.set(zmax); zTouched = true; }
      if (p !== undefined && isFinite(p)) { pmax = Math.max(0.5, Math.min(4, +p)); kP.set(pmax); }
      key = ''; if (api.repaint) api.repaint(); return { zmax, pmax };
    },
    setDefaultRange(z) { kZ.setDefault(z); },
    get zmax() { return zmax; }, get pmax() { return pmax; }, get canvas() { return cv; },
  };
}
