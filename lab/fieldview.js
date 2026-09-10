/* fieldview.js — the ELECTROSTATICS overlay: the CLASSICAL field of the register's own charge, drawn over its cloud.
 *
 * THE MATHS is lab/electrostatics.js and nothing here re-derives it: ρ = |ψ|² is expanded on Y_LM by exact Gaunt
 * coefficients, Poisson is solved slot by slot in CLOSED FORM (finite polynomials × e^{−βr} through the incomplete
 * Γ's), so Φ, E = −∇Φ and the probability current j = Im(ψ*∇ψ) are analytic functions this file merely samples:
 *
 *   Φ(x) = Z/r + Φ_e(x)   (a.u., hartree/e)      E = −∇Φ (a.u., E_h/e a₀ = 5.14220675112e11 V/m)
 *   Φ_e(0)  the electron's potential AT the nucleus (a.u.; ×27.211386245988 for volts)
 *   Q = ∫ρ = √(4π) ∫ρ₀₀ r² dr = √(4π) Σ_β Σ_q C_q (q+2)!/β^{q+3}   — the L = 0 slot, closed form; it must be ‖c‖²
 *   Q_LM = ∫ρ_LM r^{L+2} dr = Σ_β Σ_q C_q (q+L+2)!/β^{q+L+3}       — the whole multipole table, closed form
 *   B  the magnetostatic field of that current (tesla); 2p₊1 gives −0.521534351 T at the nucleus, −0.429533192 at 1 a₀
 *
 * THE PLANE is the one through the NUCLEUS FACING THE CAMERA at the moment of the rebuild: u = right, v = up of the
 * very cameraBasis(obs) field.js hands keplerview.js, half = the stage's own half-width — so the lines sit on the
 * cloud.  The polylines are kept in plane coordinates (s, t) and re-projected every frame, so camera motion is free;
 * orbiting therefore shows you that same FIXED slice from a new angle, and the slice is re-cut only when the state,
 * the clock or a control moves (throttled to 5 Hz while playing, immediate on pause, scrub or edit).
 *
 * LEVELS are log-spaced in |Φ| between its value at 0.9·half and at 0.25 a₀, signed by the value at 0.25 a₀ — the
 * potential of a NEUTRAL atom is not one sign everywhere (its monopole cancels and a quadrupole is left), so the
 * ladder is a ladder of magnitudes and the outer sign change is simply not contoured.
 *
 * STATUS: EXACT ANALYTIC for Φ, E, j and the multipole table (electrostatics.js, DERIVED-HERE, certified in
 * tests/electrostatics.test.mjs); NUMERICAL for the contours (marching squares + secant polish) and the field lines
 * (RK4 on the unit tangent of the in-plane projection); NUMERICAL and, OFF THE AXIS, NOT CERTIFIED for B — which is
 * why B is never drawn as an overlay and only the two certified axis numbers are printed.
 * The closed form is HYDROGENIC: with any other Hamiltonian in force (oscillator, box, quarkonium, atom) the window
 * says so and draws nothing at all.
 */
import { createElectrostatics, contours as contourLines, streamlines as streamLines, planeFrame } from './electrostatics.js';
import { cameraBasis } from './field.js';
import { fitText, accentRGB } from './mir/kit.js';
import { BASIS, factorial } from './hydrogen.js';

export const VOLT = 27.211386245988;            // CODATA 2018: one a.u. of potential in volts
export const V_PER_M = 5.14220675112e11;        // CODATA 2018: one a.u. of electric field in V/m
const TERM_CAP = 12;                            // the biggest state the closed form is asked to build inside a frame
const GOLDEN = 2.39996322972865332;             // the golden angle: the j seeds spread evenly over the disc

/** the accent the interface is wearing, as a canvas colour — the WHEEL's own sRGB triple (wave 57), never a hex copy */
const accentOf = (g, n) => { const c = accentRGB(g, n); return `rgb(${c[0]},${c[1]},${c[2]})`; };

export function createFieldLines(canvas, api = {}) {
  const cv = canvas, g = cv && cv.getContext ? cv.getContext('2d') : null;
  let overlay = 'off', nLines = 10, source = 'total';
  let field = null, plane = null, art = null;                 // art = { kind, polys: [[[s,t],…],…], alpha: [] }
  let key = '', lastBuildWall = 0, lastB = { key: '', wall: 0, Bz: 0, mag: 0, Bz1: 0 };
  const stats = { ok: false, note: '', labels: '', terms: 0, populated: 0, Z: 1, half: 0,
    Q: 0, norm2: 0, phiE0: 0, phiE0V: 0, Emag: 0, EmagV: 0, Bz: 0, Bmag: 0, Bz1: 0, Bstale: false,
    slots: 0, Lmax: 0, buildMs: 0, gridN: 0, polys: 0, overlay: 'off', lines: 10, source: 'total' };

  /* ── the multipole moments, in closed form off the same table Φ is built from ───────────────────────────────── */
  /** Q_LM = ∫ρ_LM(r) r^{L+2} dr, complex; L = M = 0 times √(4π) is the charge */
  function moment(slot) {
    let re = 0, im = 0;
    for (const t of slot.terms) for (let q = t.qmin; q <= t.qmax; q++) {
      const w = factorial(q + slot.L + 2) / Math.pow(t.beta, q + slot.L + 3);
      re += t.re[q] * w; im += t.im[q] * w;
    }
    return [re, im];
  }
  const monopole = (tbl) => { const s = tbl.slots.find((x) => x.L === 0 && x.M === 0); return s ? Math.sqrt(4 * Math.PI) * moment(s)[0] : 0; };

  /* ── the state the closed form is built from: the register's own terms at t, biggest first ──────────────────── */
  function termsOf(reg, t) {
    const pop = reg.populated();
    const all = pop.map((a) => { const c = reg.coeffAt(a, t); return { a, re: c.re, im: c.im, w: c.re * c.re + c.im * c.im }; });
    all.sort((p, q) => q.w - p.w);
    return { all, use: all.slice(0, TERM_CAP), populated: pop.length };
  }

  /* ── the rebuild: the closed form, the readouts, and the geometry of whichever overlay is on ─────────────────── */
  function rebuild(reg, t, obs, half, Z, playing) {
    const t0 = performance.now();
    const T = termsOf(reg, t);
    stats.populated = T.populated; stats.terms = T.use.length; stats.Z = Z; stats.half = half;
    stats.overlay = overlay; stats.lines = nLines; stats.source = source;
    stats.labels = T.use.map((x) => BASIS[x.a].label).join(' ');
    art = null; field = null; plane = null;
    if (!T.use.length) { stats.ok = false; stats.note = 'the register is empty — no charge, no field'; stats.buildMs = 0; refreshB('', playing); emit(); return; }
    field = createElectrostatics(T.use.map((x) => ({ a: x.a, re: x.re, im: x.im })), { Z });
    stats.ok = true;
    stats.note = T.populated > T.use.length ? `${T.use.length} of ${T.populated} labels (the ${TERM_CAP} largest)` : '';
    stats.slots = field.meta.slots; stats.Lmax = field.meta.Lmax;
    stats.norm2 = T.all.reduce((s, x) => s + x.w, 0);
    stats.Q = monopole(field.table);
    stats.phiE0 = field.phiE(0, 0, 0); stats.phiE0V = stats.phiE0 * VOLT;
    stats.Emag = Math.hypot(...field.E(0, 0, 1)); stats.EmagV = stats.Emag * V_PER_M;
    const cam = cameraBasis(obs);
    plane = { origin: [0, 0, 0], u: cam.right, v: cam.up, half, n: 96 };
    if (overlay !== 'off') buildArt();
    stats.buildMs = performance.now() - t0;                       // the closed form and the geometry; B is timed apart
    refreshB(`${reg.version}|${t.toFixed(6)}|${Z}`, playing);      // …and must be in stats BEFORE the readouts are emitted
    emit();
  }

  /**
   * how fine to sample — DETERMINISTIC, from the size of the state and the number of lines asked for.  A browser's
   * performance.now() is deliberately coarsened (1 ms in Firefox), so a 3 µs call cannot be timed inside the frame:
   * this window budgets by structure instead.  A slot is one (L, M) of the multipole table, and Φ costs about
   * 3 µs per sample for a single label and 7 µs for a twelve-label state — the ladder below holds the sampling
   * near 30 ms and the tracing near 20 ms at every size, which is what the 5 Hz rebuild can afford.
   */
  function detail() {
    const s = field.meta.slots;
    const base = s <= 4 ? 96 : s <= 12 ? 80 : s <= 30 ? 64 : 48;
    return { grid: Math.max(44, Math.min(96, Math.round(base * Math.sqrt(10 / Math.max(6, nLines))))),
      steps: s <= 4 ? 3600 : s <= 12 ? 2400 : 1400 };
  }

  function buildArt() {
    const D = detail();
    if (overlay === 'phi') {
      const which = source === 'total' ? 'phi' : 'phiE';
      const f = which === 'phi' ? field.phi : field.phiE;
      const n = D.grid;
      const F = planeFrame({ ...plane, n });
      const pOut = f(...F.world(0.9 * plane.half, 0)), pIn = f(...F.world(0.25, 0));
      let lo = Math.abs(pOut), hi = Math.abs(pIn);
      if (!(lo > 0) || !isFinite(lo) || !(hi > lo)) { hi = Math.max(hi, 1e-12); lo = hi * 1e-5; }
      const sgn = pIn < 0 ? -1 : 1, N = Math.max(2, nLines);
      const levels = Array.from({ length: N }, (_, i) => sgn * Math.exp(Math.log(lo) + (Math.log(hi) - Math.log(lo)) * i / (N - 1)));
      const C = contourLines(field, { ...plane, n }, levels, { which });
      const polys = [], alpha = [];
      C.levels.forEach((lv, i) => { for (const line of lv.lines) if (line.length > 1) { polys.push(line); alpha.push(0.28 + 0.42 * (i / Math.max(1, N - 1))); } });
      art = { kind: 'phi', polys, alpha, second: false };
      stats.gridN = n; stats.polys = polys.length;
      return;
    }
    /* E and j: RK4 streamlines of the in-plane projection, from seeds this window chooses */
    const isJ = overlay === 'j';
    const src = isJ || source === 'total' ? field : electronOnly(field, stats.Z);
    const N = Math.max(2, nLines), half = plane.half;
    const seeds = isJ
      ? Array.from({ length: N }, (_, k) => { const a = k * GOLDEN, R = 0.85 * half * Math.sqrt((k + 0.5) / N); return [R * Math.cos(a), R * Math.sin(a)]; })
      : Array.from({ length: N }, (_, k) => { const a = 2 * Math.PI * k / N, R = Math.max(0.3, 0.02 * half); return [R * Math.cos(a), R * Math.sin(a)]; });
    const maxSteps = Math.max(40, Math.min(300, Math.floor(D.steps / (seeds.length * (isJ ? 1 : 2)))));
    const S = streamLines(src, plane, isJ ? 'j' : 'E', seeds, { step: half / 32, maxSteps, dir: isJ ? 1 : 'both' });
    const polys = [], alpha = [];
    for (const s of S) if (s.points.length > 1) { polys.push(s.points); alpha.push(0.62); }
    art = { kind: overlay, polys, alpha, second: isJ };
    stats.gridN = maxSteps; stats.polys = polys.length;
  }
  /** the electron's own E: the same analytic field minus the nucleus's exact Z r̂/r² — for SOURCE = ρ only */
  function electronOnly(F, Z) {
    return { E(x, y, z) { const v = F.E(x, y, z), r = Math.hypot(x, y, z), k = Z / (r * r * r); return [v[0] - k * x, v[1] - k * y, v[2] - k * z]; }, j: F.j, phi: F.phi, phiE: F.phiE };
  }

  /* ── B: two quadratures, so it runs on its own slow clock (it is a readout, never an overlay) ─────────────────── */
  function refreshB(stateKey, playing) {
    if (!field) { stats.Bz = stats.Bmag = stats.Bz1 = 0; stats.Bstale = false; lastB = { key: '', wall: 0, Bz: 0, mag: 0, Bz1: 0 }; return; }
    const wall = performance.now();
    if (lastB.key !== stateKey && (!playing || wall - lastB.wall > 1000)) {
      const b = field.bNucleus();
      lastB = { key: stateKey, wall, Bz: b.Bz, mag: b.mag, Bz1: field.bAxis(1) };
    }
    stats.Bz = lastB.Bz; stats.Bmag = lastB.mag; stats.Bz1 = lastB.Bz1;
    stats.Bstale = lastB.key !== stateKey;                       // the printed B belongs to an earlier t: say so
  }

  function emit() { if (api.onStats) api.onStats(stats); }
  /** the controls follow the API: setOverlay/setLines/setSource are what LW and a project file call */
  function sync() { if (api.onControls) api.onControls({ overlay, lines: nLines, source }); }

  /* ── the frame: re-project what was built; the rebuild is the thing that is throttled ────────────────────────── */
  function draw(obs) {
    const W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (W < 32 || H < 32) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    if (!art || !art.polys.length || !plane) return;
    const B = cameraBasis(obs), D = obs.dist * plane.half, cam = [B.dir[0] * D, B.dir[1] * D, B.dir[2] * D];
    const tanH = Math.tan((obs.fov || 0.6) / 2), aspect = W / H;
    const F = planeFrame(plane);
    const proj = (s, t) => {
      const p = F.world(s, t), dx = p[0] - cam[0], dy = p[1] - cam[1], dz = p[2] - cam[2];
      const depth = dx * B.fwd[0] + dy * B.fwd[1] + dz * B.fwd[2]; if (depth <= 0) return null;
      const u = (dx * B.right[0] + dy * B.right[1] + dz * B.right[2]) / (depth * tanH * aspect), v = (dx * B.up[0] + dy * B.up[1] + dz * B.up[2]) / (depth * tanH);
      return [(u + 1) / 2 * W, (1 - v) / 2 * H];
    };
    g.strokeStyle = art.second ? accentOf(g, 2) : accentOf(g, 1);
    g.lineWidth = 1; g.lineJoin = 'round'; g.lineCap = 'round';
    art.polys.forEach((line, i) => {
      g.globalAlpha = art.alpha[i];
      g.beginPath(); let started = false;
      for (const [s, t] of line) { const q = proj(s, t); if (!q) { started = false; continue; } if (!started) { g.moveTo(q[0], q[1]); started = true; } else g.lineTo(q[0], q[1]); }
      g.stroke();
    });
    g.globalAlpha = 1;
    if (document.body.classList.contains('no-captions')) return;
    g.fillStyle = document.body.dataset.theme === 'light' ? 'rgba(20,30,50,0.62)' : 'rgba(255,255,255,0.45)';
    g.font = '9px ui-monospace, monospace'; g.textAlign = 'left';
    const cx = document.body.classList.contains('rack-l') ? 12 + (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--rack-w')) || 300) + 8 : 12;
    /* the stage caption is measured into the stage it has: it used to run off the right edge on a narrow window */
    fitText(g, `ELECTROSTATICS · ${caption()} · the classical field of the density — Poisson solved in closed form; the current's B is a magnetostatic orbital field`,
      cx, H - 142, { x0: cx, y0: 0, x1: W - 12, y1: H }, 'left', true);
  }
  const caption = () => (overlay === 'phi' ? `${stats.polys} equipotentials of ${source === 'total' ? 'Φ' : 'Φ_e'}`
    : overlay === 'E' ? `${stats.polys} lines of ${source === 'total' ? 'E' : 'E_e'}` : `${stats.polys} streamlines of j`);

  function clear() { if (!g) return; if (cv.width !== 1 || cv.height !== 1) { cv.width = 1; cv.height = 1; } }

  /**
   * one frame.  `on` is the window's own verdict (live, open, hydrogenic, position space, no molecule): false blanks
   * the canvas and leaves the readouts alone.  The rebuild fires when the register, the clock or a control moved —
   * at once when paused, scrubbed or edited, at most 5 Hz while playing.
   */
  function update(reg, t, obs, half, playing, Z, on) {
    if (!g) return;
    if (!on || overlay === 'off') { clear(); return; }
    const k = `${reg.version}|${t.toFixed(6)}|${overlay}|${nLines}|${source}|${Z}|${half.toFixed(3)}`;
    if (k !== key) {
      const wall = performance.now();
      if (!playing || wall - lastBuildWall >= 200) { key = k; lastBuildWall = wall; rebuild(reg, t, obs, half, Z, playing); }
    }
    draw(obs);
  }
  /** rebuild on the very next frame whatever the throttle says (a control moved, or the clock stopped) */
  function invalidate() { key = ''; lastBuildWall = 0; }

  /** the copyable table: the multipole moments in closed form, then every number the readouts carry */
  function table() {
    if (!field) return 'no charge in the register';
    const rows = field.table.slots.map((s) => { const [re, im] = moment(s); return `${s.L}\t${s.M}\t${re.toExponential(6)}\t${im.toExponential(6)}`; });
    return ['terms (label, Re c, Im c)', ...field.terms.map((x) => `${x.label}\t${x.re.toFixed(6)}\t${x.im.toFixed(6)}`),
      '', `multipole moments Q_LM = ∫ρ_LM r^{L+2} dr   (${field.table.slots.length} slots, L ≤ ${field.meta.Lmax})`, 'L\tM\tRe\tIm', ...rows,
      '', `monopole √(4π)Q₀₀\t${stats.Q.toFixed(9)}`, `‖c‖² (the norm it must equal)\t${stats.norm2.toFixed(9)}`,
      `Φ_e(0)  a.u.\t${stats.phiE0.toFixed(9)}`, `Φ_e(0)  volts\t${stats.phiE0V.toFixed(6)}`,
      `|E|(0,0,1)  a.u.\t${stats.Emag.toFixed(9)}`, `|E|(0,0,1)  V/m\t${stats.EmagV.toExponential(6)}`,
      `B_z at the nucleus  T\t${stats.Bz.toFixed(9)}`, `|B| at the nucleus  T\t${stats.Bmag.toFixed(9)}`,
      `B_z(1 a₀)  T\t${stats.Bz1.toFixed(9)}`,
      `Z\t${stats.Z}`, `plane half-width  a₀\t${stats.half}`, `overlay\t${stats.overlay}`, `lines\t${stats.lines}`, `source\t${stats.source}`,
      `build  ms\t${stats.buildMs.toFixed(2)}`].join('\n');
  }

  return {
    update, draw, clear, invalidate, table, stats,
    get overlay() { return overlay; }, setOverlay(v) { overlay = v === 'phi' || v === 'E' || v === 'j' ? v : 'off'; invalidate(); sync(); return overlay; },
    get lines() { return nLines; }, setLines(n) { nLines = Math.max(4, Math.min(24, Math.round(n) || 10)); invalidate(); sync(); return nLines; },
    get source() { return source; }, setSource(v) { source = v === 'rho' ? 'rho' : 'total'; invalidate(); sync(); return source; },
    get field() { return field; }, get plane() { return plane; },
  };
}
