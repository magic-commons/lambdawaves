/* radiationview.js — the RADIATION window: what the prepared state would radiate, and the shape of the field.
 *
 * THE PAIR.  Radiation is a statement about TWO labels, so the window picks one: the A / B TRANSITION pair when a
 * transition is set (the dominant label of each stored state), otherwise the two most populated labels whose dipole
 * ⟨a|r|b⟩ is not zero — the pair maximising |c_a|²|c_b|², which is the pair carrying the power.  The card says which
 * of the two rules chose it.  A single label (or any set with no allowed pair: 1s + 2s, one l, Δl ≠ ±1) has NO
 * dipole at all, and the window stands down saying exactly that rather than drawing a zero.
 *
 * THE NUMBERS (lab/radiation.js, nothing computed here): A = (4/3)α³ω³|⟨a|r|b⟩|²/t_au × μ/m, τ = 1/A, ħω, the
 * wavelength λ = 2πc/ω, and the classical power of the coherent pair P = |c₁|²|c₂|² ħωA — the SYNTHESIS's B.2 line,
 * with c₁, c₂ the register's OWN coefficients on the two labels at the current time, per unit norm.  2p → 1s reads
 * A = 6.2649e8 s⁻¹ (the reduced-mass value, NIST's), τ = 1.596 ns, ħω = 10.2043 eV, λ = 2296 a₀ = 121.5 nm.
 *
 * THE PICTURE.  A polar plot of dP/dΩ in the plane spanned by x̂ (across) and ẑ (up) — the plane that contains the
 * dipole axis for every Δm = 0 line — normalised to its own peak, because the field of an atom is three orders of
 * magnitude larger than the atom (λ = 2296 a₀ against a stage of ±8 a₀) and can never be drawn to the stage's scale.
 * The curve is the pattern of the INSTANTANEOUS dipole d(t) = 2Re(d e^{−iωt}): 1 − (n̂·û)², û its direction.  For
 * Δm = 0 that direction is fixed (ẑ) and the figure-eight is STATIC; for Δm = ±1 the dipole rotates in the xy-plane
 * at ω, so the cut through the screen plane breathes between the figure-eight (dipole in the plane) and a circle
 * (dipole pointing out of it) — the phase follows clock.t·ω, one cosine per frame and nothing else.
 *
 * STATUS: EXACT ANALYTIC and KNOWN for the angular algebra and the A formula (Bethe–Salpeter §59), NUMERICAL for the
 * radial integral (dynamics.js's Simpson), all of it in lab/radiation.js and judged in tests/radiation.test.mjs.
 * This file is a view.  Hydrogenic register only: the ω of a line is the BASIS's own −1/2n², so under another
 * Hamiltonian or the Sturmian scale the window stands down instead of mixing two operators in one number.
 */
import { dipoleMatrix, einsteinA, lifetime, coherentPower, pattern, vec3c, C_AU, MU_H, AU_S } from './radiation.js';
import { BASIS } from './hydrogen.js';
import { el, readout, graphHover, fitText, cssRGB, accentRGB } from './kit.js';

const HARTREE_EV = 27.211386245988;          // CODATA 2018
const A0_NM = 0.0529177210903;               // the Bohr radius in nm
const W_PER_AU = 4.3597447222071e-18 / AU_S; // 1 a.u. of power in watts (E_h per atomic unit of time) = 0.180238 W
const NTH = 160;                             // points on the polar curve
/** scientific notation the way the rest of the lab prints it: 6.2649e8, no '+' */
const sci = (v, d = 4) => (v === 0 ? '0' : v.toExponential(d).replace('e+', 'e'));

/** a CSS colour token resolved through the canvas, as [r, g, b] — kit.js's one reader (wave 57) */
const readRGB = (g, name, fallback) => cssRGB(g, name, fallback);
const dominant = (S) => { let k = -1, best = 0; for (let a = 0; a < 91; a++) { const v = S.re[a] * S.re[a] + S.im[a] * S.im[a]; if (v > best) { best = v; k = a; } } return k; };

/**
 * createRadiation(host, api) — api: { ab() → the A/B hook (or null), repaint() }.
 * The rack drives it with update(reg, t, playing, on).
 */
export function createRadiation(host, api = {}) {
  let cache = null, key = '', phase = 0;

  const cv = el('canvas', 'rad-c', host);
  const g = cv.getContext('2d');
  const cap = el('div', 'rad-cap', host, 'far field at its own scale');
  const stand = el('div', 'rad-stand', host, ''); stand.hidden = true;

  const r1 = el('div', 'row tight', host);
  const roPair = readout({ label: 'THE PAIR', value: '—', cls: 'wide', sub: 'the A / B transition pair, else the two most populated labels with a dipole' });
  r1.appendChild(roPair.root);
  const r2 = el('div', 'row tight', host);
  const roA = readout({ label: 'A  s⁻¹  (reduced mass)', value: '—', sub: '(4/3)α³ω³|⟨a|r|b⟩|² / t_au × μ/m' });
  const roTau = readout({ label: 'τ = 1/A', value: '—', sub: 'this channel alone, not the level\'s lifetime' });
  const roLam = readout({ label: 'λ = 2πc/ω', value: '—', sub: 'three orders of magnitude off the stage' });
  const roHw = readout({ label: 'ħω', value: '—', sub: 'the Bohr frequency of the pair' });
  for (const r of [roA, roTau, roLam, roHw]) r2.appendChild(r.root);
  const r3 = el('div', 'row tight', host);
  const roD = readout({ label: '|⟨a|r|b⟩|  e a₀', value: '—', sub: 'the register\'s own radial integral × the Condon–Shortley angular factor' });
  const roP = readout({ label: 'P = |c₁|²|c₂|² ħωA', value: '—', cls: 'wide', sub: 'field of a coherent superposition, radiating |c₁|²|c₂|² ħωA' });
  r3.appendChild(roD.root); r3.appendChild(roP.root);

  el('div', 'note', host).innerHTML = '<b>EXACT + NUMERICAL.</b> ⟨a|r|b⟩ is the Condon–Shortley angular factor (l′ = l ± 1, m′ = m, m ± 1) times <b>dynamics.js\'s own radial integral</b> — the same one the A / B TRANSITION\'s ⟨z⟩ prints, so this window and that readout cannot disagree. <b>A = (4/3)α³ω³|⟨a|r|b⟩|²</b> in atomic units, divided by t_au and multiplied by μ/m once (energies scale as μ, lengths as 1/μ, so A ∝ μ exactly once): 2p → 1s gives (2/3)<sup>8</sup>α³ = 1.5162329e−8 a.u. = <b>6.2649 × 10⁸ s⁻¹</b>, which is NIST\'s value, and τ = <b>1.596 ns</b>. <b>THE FIELD:</b> for d(t) = 2Re(d e<sup>−iωt</sup>) the radiation zone carries E = [n̂(n̂·d̈) − d̈]/(c²r), B = n̂ × E, and the time-averaged power is P = (4/3)ω⁴|d|²/c³ = <b>|c₁|²|c₂|² ħωA</b> — certified in the tests by integrating the Poynting flux over a sphere and a period, not by algebra. At the equal mix that is ħωA/4. The plot is <b>the pattern of the instantaneous dipole, at its own scale</b>: λ = 2296 a₀ for Lyman-α, so it can never be drawn over the orbital. <b>The near and induction zones are not in this expression</b>, and no radiation reaction acts on the register: this is what such a dipole WOULD radiate.';

  /* ── the pair ────────────────────────────────────────────────────────── */
  function choose(reg, t, ab) {
    const c = reg.at(t), ids = reg.populated();
    let n2 = 0; for (const a of ids) n2 += c.re[a] * c.re[a] + c.im[a] * c.im[a];
    const s = n2 > 0 ? 1 / Math.sqrt(n2) : 1;
    const amp = (a) => ({ re: c.re[a] * s, im: c.im[a] * s });
    const has = (a, b) => a >= 0 && b >= 0 && a !== b && dipoleMatrix(a, b).abs2 > 1e-18 && Math.abs(BASIS[a].E - BASIS[b].E) > 1e-12;
    if (ab && ab.on && ab.A && ab.B) {                                   // the A / B TRANSITION pair, by each state's dominant label
      const a = dominant(ab.A), b = dominant(ab.B);
      if (has(a, b)) return { a, b, c1: amp(a), c2: amp(b), src: 'the A / B TRANSITION pair', norm2: n2 };
    }
    let best = null;                                                      // else: the populated pair carrying the most power
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i], b = ids[j]; if (!has(a, b)) continue;
      const w = (c.re[a] ** 2 + c.im[a] ** 2) * (c.re[b] ** 2 + c.im[b] ** 2);
      if (!best || w > best.w) best = { a, b, w };
    }
    if (!best) return null;
    return { a: best.a, b: best.b, c1: amp(best.a), c2: amp(best.b), src: 'the two most populated labels with a dipole', norm2: n2 };
  }
  function build(reg, t, ab) {
    const P = choose(reg, t, ab);
    if (!P) { cache = null; return null; }
    const A = BASIS[P.a].E <= BASIS[P.b].E ? P.a : P.b, B = A === P.a ? P.b : P.a;      // lower, upper
    const M = dipoleMatrix(A, B), w = Math.abs(BASIS[A].E - BASIS[B].E);
    const rate = einsteinA(A, B), tau = lifetime(A, B);
    const cA = A === P.a ? P.c1 : P.c2, cB = A === P.a ? P.c2 : P.c1;
    const CP = coherentPower(A, B, cA, cB), pat = pattern(CP.d, w);
    cache = { a: A, b: B, la: BASIS[A].label, lb: BASIS[B].label, dm: BASIS[B].m - BASIS[A].m, src: P.src, norm2: P.norm2,
      w1: cA.re ** 2 + cA.im ** 2, w2: cB.re ** 2 + cB.im ** 2,
      M, d: CP.d, omega: w, A: rate, tau, lambda: 2 * Math.PI * C_AU / w, dabs: Math.sqrt(M.abs2),
      P: CP.P, hbarOmegaA: CP.hbarOmegaA, weight: CP.weight, peak: pat.peak, total: pat.total,
      lyman: BASIS[A].n === 1 && BASIS[B].n === 2 };
    return cache;
  }

  /* WAVE 46 — "dP/dΩ" in the accent and "d ∥ z (Δm = 0, static)" in the second accent used to sit in the
     picture's two left corners.  The lobe and the dipole axis ARE those two objects, and say it on hover. */
  let rect = null;
  const hover = graphHover(cv, { repaint: () => paint(0), plot: () => rect });
  /* ── the picture: the instantaneous dipole's pattern in the (x̂, ẑ) plane, at its own scale ── */
  function paint(t) {
    const W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (W < 40 || H < 40) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const A = accentRGB(g, 1), B2 = accentRGB(g, 2), dim = readRGB(g, '--dim', '#b8b8b8');
    const ink = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
    const cx = W / 2, cy = H / 2, R = Math.max(10, Math.min(W, H) / 2 - 16);
    if (!cache) {                                                        /* no pair: the empty frame, never a blank slab */
      g.strokeStyle = ink(dim, 0.20); g.lineWidth = 1;
      g.beginPath(); g.arc(cx, cy, R, 0, 2 * Math.PI); g.stroke();
      g.setLineDash([2, 3]); g.beginPath(); g.moveTo(cx - R, cy); g.lineTo(cx + R, cy); g.moveTo(cx, cy - R); g.lineTo(cx, cy + R); g.stroke(); g.setLineDash([]);
      g.font = '8px ui-monospace, monospace'; g.fillStyle = ink(dim, 0.85);
      g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText('z', cx, 2);
      g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText('x', W - 2, cy);
      g.textAlign = 'center'; g.textBaseline = 'middle'; fitText(g, 'no dipole — nothing radiates', cx, cy, { x0: 2, y0: 0, x1: W - 2, y1: H }, 'center', true);
      g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      rect = { x0: cx - R, y0: cy - R, x1: cx + R, y1: cy + R };
      hover.set([], rect);
      return;
    }
    /* û: the direction of d(t) = 2Re(d e^{−iωt}) — fixed for Δm = 0, turning at ω for Δm = ±1 */
    const D = vec3c(cache.d), ph = phase, cw = Math.cos(ph), sw = Math.sin(ph);
    let u = [D.re[0] * cw + D.im[0] * sw, D.re[1] * cw + D.im[1] * sw, D.re[2] * cw + D.im[2] * sw];
    let L = Math.hypot(u[0], u[1], u[2]);
    if (L < 1e-12) { u = [D.re[0], D.re[1], D.re[2]]; L = Math.hypot(u[0], u[1], u[2]) || 1; }   // the node of a linear dipole: its axis stands
    u = [u[0] / L, u[1] / L, u[2] / L];
    /* the ring, the axes */
    g.strokeStyle = ink(dim, 0.20); g.lineWidth = 1;
    g.beginPath(); g.arc(cx, cy, R, 0, 2 * Math.PI); g.stroke();
    g.setLineDash([2, 3]); g.beginPath(); g.moveTo(cx - R, cy); g.lineTo(cx + R, cy); g.moveTo(cx, cy - R); g.lineTo(cx, cy + R); g.stroke(); g.setLineDash([]);
    /* the pattern: r(θ) = 1 − (n̂·û)², n̂ = sinθ x̂ + cosθ ẑ, normalised to its own peak */
    g.beginPath();
    const lobe = [];
    for (let i = 0; i <= NTH; i++) {
      const th = 2 * Math.PI * i / NTH, st = Math.sin(th), ct = Math.cos(th);
      const nd = st * u[0] + ct * u[2], r = R * Math.max(0, 1 - nd * nd);
      const x = cx + r * st, y = cy - r * ct;
      lobe.push(x, y);
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.closePath();
    g.fillStyle = ink(A, 0.20); g.fill();
    g.strokeStyle = ink(A, 0.92); g.lineWidth = 1.5; g.stroke();
    /* the dipole axis, projected into the plane (it shortens as the dipole turns out of it) */
    const px = u[0] * R * 0.9, pz = u[2] * R * 0.9;
    g.strokeStyle = ink(B2, 0.9); g.lineWidth = 2; g.setLineDash([4, 3]);
    g.beginPath(); g.moveTo(cx - px, cy + pz); g.lineTo(cx + px, cy - pz); g.stroke(); g.setLineDash([]);
    /* the two axis names only — the two legends are on the objects they named */
    g.font = '8px ui-monospace, monospace'; g.fillStyle = ink(dim, 0.85);
    g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText('z', cx, 2);
    g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillText('x', W - 2, cy);
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    rect = { x0: cx - R, y0: cy - R, x1: cx + R, y1: cy + R };
    hover.set([
      { kind: 'curve', key: 'lobe', points: lobe, lw: 1.5, colour: ink(A, 1),
        info: `dP/dΩ ∝ 1 − (n̂·û)²  ·  the far-field pattern of d(t), normalised to its own peak` },
      { kind: 'line', key: 'axis', points: [cx - px, cy + pz, cx + px, cy - pz], lw: 2, colour: ink(B2, 1),
        info: cache.dm === 0 ? 'd ∥ z  (Δm = 0, static)' : 'd ⟂ z  (Δm = ' + (cache.dm > 0 ? '+' : '') + cache.dm + ', turning at ω)' },
    ], rect);
  }

  function say() {
    if (!cache) { for (const r of [roPair, roA, roTau, roLam, roHw, roD, roP]) { r.set('—', 'warn'); r.setSub(''); } cap.textContent = ''; return; }
    const C = cache;
    roPair.set(`${C.la}  →  ${C.lb}    Δm = ${C.dm}`, 'live');
    roPair.setSub(`${C.src} · |c₁|² = ${C.w1.toFixed(4)}, |c₂|² = ${C.w2.toFixed(4)} · ‖c‖² = ${C.norm2.toFixed(6)} (taken per unit norm)`);
    roA.set(sci(C.A, 4) + ' s⁻¹', 'ok');
    roA.setSub(`μ/m = ${MU_H.toFixed(9)} · ${sci(C.A / MU_H, 4)} s⁻¹ at infinite nuclear mass`);
    roTau.set((C.tau * 1e9).toFixed(3) + ' ns');
    roTau.setSub(`${sci(C.tau, 4)} s · this channel alone`);
    roLam.set(C.lambda.toFixed(0) + ' a₀  ·  ' + (C.lambda * A0_NM).toFixed(1) + ' nm');
    roLam.setSub(C.lyman ? 'Lyman-α — three orders of magnitude off the stage' : 'three orders of magnitude off the stage');
    roHw.set((C.omega * HARTREE_EV).toFixed(4) + ' eV');
    roHw.setSub(`ω = ${C.omega.toFixed(6)} a.u.`);
    roD.set(C.dabs.toFixed(6));
    roD.setSub(`radial ${C.M.radial.toFixed(6)} a₀ · |⟨a|r|b⟩|² = ${C.M.abs2.toFixed(6)}`);
    roP.set(`${sci(C.P, 4)} a.u.  ·  ${sci(C.P * W_PER_AU, 3)} W`, C.P > 0 ? 'ok' : 'warn');
    roP.setSub(`field of a coherent superposition, radiating |c₁|²|c₂|² ħωA · weight ${C.weight.toFixed(6)} × ħωA = ${sci(C.hbarOmegaA, 4)} a.u.`);
    cap.textContent = `far field at its own scale (λ = ${C.lambda.toFixed(0)} a₀${C.lyman ? ' for Lyman-α' : ''})`;
  }

  /**
   * update(reg, t, playing, on) — the pair and its numbers follow the state; the picture follows the clock when the
   * dipole turns (Δm ≠ 0), and stands still when it does not.
   */
  function update(reg, t, playing, on, why) {
    if (!on) {
      if (cache) { cache = null; say(); }
      key = ''; stand.hidden = false; cap.hidden = true;
      stand.textContent = why || 'hydrogenic register only — the ω of a line is the register\'s own −1/2n²';
      paint(t); return;
    }
    const k = `${reg.version}|${t.toFixed(6)}`;
    if (k !== key) { key = k; build(reg, t, api.ab ? api.ab() : null); say(); }
    if (!cache) {
      stand.hidden = false; cap.hidden = true;
      stand.textContent = 'no dipole in this state — radiation needs two labels with l′ = l ± 1, and this state has none';
      paint(t); return;
    }
    stand.hidden = true; cap.hidden = false;
    phase = cache.dm === 0 ? 0 : cache.omega * t;                          // the rotating dipole's phase, one cosine
    paint(t);
  }

  /** the digest's table */
  function table() {
    if (!cache) return 'RADIATION · no dipole in this state (two labels with l′ = l ± 1 are needed)';
    const C = cache;
    return ['THE DIPOLE · SPONTANEOUS EMISSION · THE FAR FIELD',
      `pair\t${C.la} → ${C.lb}\tΔm = ${C.dm}\t${C.src}`,
      `A (reduced mass)\t${sci(C.A, 4)} s⁻¹\t${sci(C.A / MU_H, 4)} s⁻¹ at infinite nuclear mass`,
      `τ = 1/A\t${(C.tau * 1e9).toFixed(3)} ns\t${sci(C.tau, 4)} s`,
      `ħω\t${(C.omega * HARTREE_EV).toFixed(4)} eV\tω = ${C.omega.toFixed(6)} a.u.`,
      `λ = 2πc/ω\t${C.lambda.toFixed(1)} a₀\t${(C.lambda * A0_NM).toFixed(2)} nm`,
      `|⟨a|r|b⟩|\t${C.dabs.toFixed(9)} e a₀\tradial ${C.M.radial.toFixed(9)}`,
      `P = |c₁|²|c₂|² ħωA\t${sci(C.P, 4)} a.u.\t${sci(C.P * W_PER_AU, 4)} W · weight ${C.weight.toFixed(6)}`,
      `dP/dΩ peak\t${sci(C.peak, 4)} a.u.\ttotal ${sci(C.total, 4)} a.u. = P`,
      'the far field at its own scale: the near and induction zones are not in this expression'].join('\n');
  }

  window.addEventListener('resize', () => paint(0));
  return {
    update, table, paint,
    get stats() { return cache ? { a: cache.a, b: cache.b, la: cache.la, lb: cache.lb, dm: cache.dm, src: cache.src, A: cache.A, tau: cache.tau, lambda: cache.lambda, omega: cache.omega, eV: cache.omega * HARTREE_EV, dabs: cache.dabs, P: cache.P, hbarOmegaA: cache.hbarOmegaA, weight: cache.weight, peak: cache.peak } : null; },
    get cache() { return cache; },
    pair(reg, t, ab) { if (reg && key !== `${reg.version}|${t.toFixed(6)}`) { key = `${reg.version}|${t.toFixed(6)}`; build(reg, t, ab !== undefined ? ab : (api.ab ? api.ab() : null)); say(); paint(t); } return cache ? { a: cache.a, b: cache.b, la: cache.la, lb: cache.lb, dm: cache.dm, src: cache.src } : null; },
    get canvas() { return cv; },
  };
}
