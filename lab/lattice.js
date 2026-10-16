/* lattice.js — LATTICE (0.7.2 L1): a tight-binding lattice in a window of LADDER's kind — its OWN register and canvas, the solve on the cards worker,
 * nothing touching the main register, the field or the camera except to read t.  Site bars: |ψᵢ|² the height, arg ψᵢ the palette's phase hue, the
 * sites where the preset's geometry puts them; the eigen-ladder is the strip beneath (its brightness the state's weight |⟨k|ψ⟩|²; a click picks
 * EIGEN m, a click on a site SITE n).  ψ(t) = C e^{−iE(t−t₀)} C†ψ₀ is exact from the eigenpairs (lattice-model.js), t₀ the moment of the pick. */
import { PRESETS, DEFAULTS, build, solveLattice, psi0, evolver, ipr, closed, tunnelT, split } from './lattice-model.js';
import { el, knob, readout, seg, stepper, themeInk } from './mir/kit.js'; import { toLUT, hsvWheel } from './mir/palette.js';
export let LAT = null;   // the one handle (persist, the verb): the app literal never gains a key
const KN = { N: ['N', 3, 256, 1], L: ['n × n', 2, 16, 1], J1: ['J₁', 0, 2], J2: ['J₂', 0, 2], W: ['W', 0, 8], seed: ['SEED', 1, 99, 1], lam: ['λ', 0, 4], phi: ['φ', 0, 6.2832],
  Phi: ['Φ', 0, 6.2832], rings: ['RINGS', 2, 4, 1], V: ['BARRIER V', 0, 4], nb: ['SITES', 1, 2, 1], x0: ['CENTRE', 0, 1], sig: ['WIDTH σ', 0.5, 16], k0: ['k₀', 0, 3.1416], idx: ['n · m', 0, 255, 1] };
const SK = { ground: [], packet: ['x0', 'sig', 'k0'], site: ['idx'], eigen: ['idx'] }, STK = ['state', 'idx', 'x0', 'sig', 'k0'], PRE = (id) => PRESETS.find((q) => q.id === id) || PRESETS[0];
const NOTE = { benzene: ' Hückel: the six π levels ±2β, ±β, ±β fall 1 + 2 + 2 + 1 (a₂u · e₁g · e₂u · b₂g); the degenerate e₁g pair is the HOMO that MOLECULES’ STO-3G benzene names in its stem.',
  graphene: ' A flake of 6m² sites by rings around a hexagon: its levels are the flake’s, not the sheet’s.', aa: ' Localised is said by the IPR’s number alone; the Lyapunov exponent is the prediction.',
  tunnel: ' TUNNEL: a packet from the left meets a barrier V on one or two centre sites; T and R are the norm right and left of it, read once the norm on the barrier has stayed under 10⁻⁴ for 2/J. Below k₀ ≈ 0.6 (and above π − 0.6) the packet’s slowest momenta are still arriving when the walls’ echoes return.',
  patch: ' A patch of the Ammann–Beenker tiling, cut and projected from ℤ⁴ through the octagonal window (tools/lattice/ammann-beenker.mjs), never the quasicrystal.' };
export function createLattice(host, api) {
  const P = { ...DEFAULTS }, ui = {}; let H = null, S = null, ev = null, t0 = 0, hit = -1, got = null, lastTT = 0, dirty = true, busy = false, gen = 0, lastT = NaN, lut = null, lutOf = null, geo = null;
  const pre = stepper({ aria: 'Lattice preset', items: PRESETS.map(({ id, label }) => ({ id, label })), value: P.preset, cls: 'mol-step', onChange: (id) => set({ preset: id }) });
  const st = seg({ aria: 'Lattice state', value: P.state, options: Object.keys(SK).map((id) => ({ id, label: id === 'eigen' ? 'EIGEN m' : id === 'site' ? 'SITE n' : id.toUpperCase() })), onChange: (v) => set({ state: v }) });
  host.append(pre.root, st.root); const r1 = el('div', 'row', host);
  for (const [k, [label, min, max, step]] of Object.entries(KN)) r1.appendChild((ui[k] = knob({ label, min, max, value: P[k], step,
    fmt: (v) => (k === 'rings' ? `${6 * v * v} sites` : k === 'Phi' ? (v / 6.2832).toFixed(3) + ' Φ₀' : step ? String(Math.round(v)) : v.toFixed(2)), onInput: (v) => set({ [k]: step ? Math.round(v) : v }) })).root);
  const hold = el('div', 'ladder-c', host), cv = el('canvas', '', hold); hold.style.height = '180px';
  const ro = { ipr: readout({ label: 'IPR  Σ|ψ|⁴', value: '—' }), lev: readout({ label: 'LEVELS  in J', value: '—' }), law: readout({ label: 'CLOSED FORM · PREDICTION', value: '—', cls: 'wide' }), tr: readout({ label: 'T · R  once passed', value: '—', cls: 'wide' }) };
  const r2 = el('div', 'row tight', host); for (const r of Object.values(ro)) r2.appendChild(r.root); const note = el('div', 'note', host);
  function sync() {
    const show = new Set([...PRE(P.preset).knobs, ...(SK[P.state] || [])]); for (const k in KN) { ui[k].root.style.display = show.has(k) ? '' : 'none'; ui[k].set(P[k]); }
    pre.set(P.preset); st.set(P.state); ro.tr.root.style.display = P.preset === 'tunnel' ? '' : 'none'; note.innerHTML = '<b>Units.</b> J = 1 is the energy unit and 1/J the time unit; t is the transport clock’s, from the moment the state is picked.' + (NOTE[P.preset] || '');
  }
  function set(p) {
    if (p.preset === 'tunnel' && P.preset !== 'tunnel') p = { N: 256, state: 'packet', x0: 0.25, sig: 4, ...p };   // TUNNEL's packet from the left, unless a load or the verb says otherwise
    const was = { ...P }; Object.assign(P, p); sync();
    if (Object.keys(DEFAULTS).some((k) => !STK.includes(k) && P[k] !== was[k])) { dirty = true; gen++; if (api.active()) prepare(); }
    else if (S && STK.some((k) => P[k] !== was[k])) restate();
  }
  function prepare() {
    if (!dirty || busy) return; dirty = false; busy = true; const mine = gen, Hm = build(P);
    return Promise.resolve(api.solve ? api.solve({ n: Hm.n, re: Hm.re, im: Hm.im }) : solveLattice(Hm)).then((r) => { if (mine === gen && r && !r.error) { H = Hm; S = r; restate(); } })
      .finally(() => { busy = false; if (dirty && api.active()) prepare(); });
  }
  function restate() {
    ev = evolver(S, psi0(P, S, H.xy)); t0 = api.t(); lastT = NaN; hit = -1; got = null;
    const c = closed(P), E = S.E, n = S.n, h = n >> 1; let d = 0; if (c.levels) for (let k = 0; k < n; k++) d = Math.max(d, Math.abs(E[k] - c.levels[k]));
    ro.lev.set(`${n} sites · ${E[0].toFixed(4)} … ${E[n - 1].toFixed(4)}`); ro.lev.setSub(`E₁ − E₀ = ${(E[1] - E[0]).toFixed(5)} · mid E_{N/2} − E_{N/2−1} = ${(E[h] - E[h - 1]).toFixed(5)}`);
    ro.law.set(c.line); ro.law.setSub(c.levels ? `the measured levels agree to ${d.toExponential(1)}` : c.sub || 'the prediction; the IPR is the measurement'); update(api.t());
  }
  function update(t) { if (dirty) { prepare(); return; } if (!ev || t === lastT) return; lastT = t; paint(ev.at(t - t0)); }
  function paint(psi) {
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = hold.clientWidth, Hh = hold.clientHeight; if (W < 32 || Hh < 32) return;
    if (cv.width !== W * dpr || cv.height !== Hh * dpr) { cv.width = W * dpr; cv.height = Hh * dpr; }
    const g = cv.getContext('2d'), T = themeInk(g), n = S.n, xy = H.xy, pal = api.palette(), stops = pal && pal.on ? pal.stops : null;
    if (lutOf !== (stops || hsvWheel)) { lutOf = stops || hsvWheel; lut = toLUT(stops || hsvWheel()); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, Hh); ro.ipr.set(ipr(psi).toFixed(4)); ro.ipr.setSub(`1 on one site · 1/N = ${(1 / n).toFixed(4)} spread · t = ${(lastT - t0).toFixed(2)}/J`);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, mx = 1e-300;
    for (let i = 0; i < n; i++) { const [x, y] = xy[i]; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); mx = Math.max(mx, psi.re[i] ** 2 + psi.im[i] ** 2); }
    const flat = y1 - y0 < 1e-9, bot = Hh - 30, bar = flat ? bot - 10 : Math.max(14, (bot - 10) * 0.3), s = Math.min((W - 16) / ((x1 - x0) || 1), flat ? Infinity : (bot - 16 - bar) / (y1 - y0));
    const X = (x) => W / 2 + (x - (x0 + x1) / 2) * s, Y = (y) => (flat ? bot : (10 + bar + bot) / 2 + (y - (y0 + y1) / 2) * s), w = Math.max(1.5, Math.min(10, s * 0.6)); geo = { X, Y };
    if (P.preset === 'tunnel') { const tt = lastT - t0, sp = split(psi, P); if (tt < lastTT) { hit = -1; got = null; } lastTT = tt; if (sp.B > 1e-4) hit = tt; else if (hit >= 0 && !got && tt - hit >= 2) got = { ...sp, t: tt };   // passed: under 1e-4 for 2/J (the lattice's Airy tail rings through it)
      ro.tr.set(got ? `T ${got.T.toFixed(3)} measured · ${tunnelT(P.k0, P.V, P.nb).toFixed(4)} T(k₀) · R + T = ${(got.R + got.T).toFixed(9)}` : `on the barrier ${sp.B.toExponential(1)}`); ro.tr.setSub(got ? `R ${got.R.toFixed(3)} · read at t = ${got.t.toFixed(1)}/J` : 'waiting for the packet to pass');
      g.fillStyle = T.ink(0.2); g.fillRect(X((n >> 1) - P.nb + 0.5), bot - bar * P.V / 4, Math.max(3, s * P.nb), bar * P.V / 4); }   // the barrier, V/4J tall
    g.strokeStyle = T.ink(0.3); g.lineWidth = 1; g.beginPath(); for (const [i, j] of H.hop) { g.moveTo(X(xy[i][0]), Y(xy[i][1])); g.lineTo(X(xy[j][0]), Y(xy[j][1])); } g.stroke();
    for (let i = 0; i < n; i++) { const q = (psi.re[i] ** 2 + psi.im[i] ** 2) / mx, u = Math.floor(((Math.atan2(psi.im[i], psi.re[i]) / (2 * Math.PI) + 0.5) % 1) * 256) % 256;
      g.fillStyle = `rgb(${lut[u * 4] * 255 | 0},${lut[u * 4 + 1] * 255 | 0},${lut[u * 4 + 2] * 255 | 0})`; g.fillRect(X(xy[i][0]) - w / 2, Y(xy[i][1]) - q * bar, w, Math.max(1, q * bar)); }
    const E = S.E, span = (E[n - 1] - E[0]) || 1, bw = Math.max(1, (W - 16) / n - 1); let pm = 1e-300; for (let k = 0; k < n; k++) pm = Math.max(pm, ev.ar[k] ** 2 + ev.ai[k] ** 2);
    for (let k = 0; k < n; k++) { const hk = 2 + 18 * (E[k] - E[0]) / span; g.fillStyle = T.fg(0.15 + 0.85 * (ev.ar[k] ** 2 + ev.ai[k] ** 2) / pm); g.fillRect(8 + (k + 0.5) * (W - 16) / n - bw / 2, Hh - 4 - hk, bw, hk); }
  }
  cv.addEventListener('click', (e) => { if (!S || !geo) return; const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (y > r.height - 26) return set({ state: 'eigen', idx: Math.max(0, Math.min(S.n - 1, Math.floor((x - 8) / (r.width - 16) * S.n))) });
    let best = 0, bd = Infinity; for (let i = 0; i < S.n; i++) { const d = Math.hypot(geo.X(H.xy[i][0]) - x, geo.Y(H.xy[i][1]) - y); if (d < bd) { bd = d; best = i; } } set({ state: 'site', idx: best });
  });
  new ResizeObserver(() => { lastT = NaN; if (ev) update(api.t()); }).observe(hold);
  sync();
  return (LAT = { prepare, update, set, params: P, ro: Object.values(ro), get label() { return PRE(P.preset).label; },
    save() { const d = {}; for (const k in DEFAULTS) if (P[k] !== DEFAULTS[k]) d[k] = P[k]; return Object.keys(d).length ? d : undefined; },
    load(I) { const q = { ...DEFAULTS }; for (const k in q) if (I && typeof I[k] === typeof q[k]) q[k] = I[k]; if (!SK[q.state]) q.state = DEFAULTS.state; set({ ...q, preset: PRE(q.preset).id }); } });
}
