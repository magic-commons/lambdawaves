/* lattice.js — LATTICE (0.7.2 L1): a tight-binding lattice in a window of LADDER's kind — its OWN register and canvas, the solve on the cards worker,
 * nothing touching the main register, the field or the camera except to read t.  Site bars: |ψᵢ|² the height, arg ψᵢ the palette's phase hue, the
 * sites where the preset's geometry puts them; the eigen-ladder is the strip beneath (its brightness the state's weight |⟨k|ψ⟩|²; a click picks
 * EIGEN m, a click on a site SITE n).  ψ(t) = C e^{−iE(t−t₀)} C†ψ₀ is exact from the eigenpairs (lattice-model.js), t₀ the moment of the pick. */
import { PRESETS, DEFAULTS, build, solveLattice, psi0, evolver, ipr, closed, tunnelT, split, walker, spinView, levelStats } from './lattice-model.js';
import { el, knob, readout, seg, stepper, themeInk } from './mir/kit.js'; import { toLUT, hsvWheel } from './mir/palette.js';
export let LAT = null;   // the one handle (persist, the verb): the app literal never gains a key
const KN = { N: ['N', 3, 256, 1], L: ['n × n', 2, 16, 1], J1: ['J₁', 0, 2], J2: ['J₂', 0, 2], W: ['W', 0, 30], seed: ['SEED', 1, 99, 1], lam: ['λ', 0, 4], phi: ['φ', 0, 6.2832],
  Phi: ['Φ', 0, 6.2832], rings: ['RINGS', 2, 4, 1], V: ['BARRIER V', 0, 4], nb: ['SITES', 1, 2, 1], fp: ['FLUX p', 0, 8, 1], fq: ['FLUX q', 1, 8, 1], ns: ['SPINS', 2, 8, 1], d: ['d', 1, 3, 1], seeds: ['SEEDS', 1, 16, 1], x0: ['CENTRE', 0, 1], sig: ['WIDTH σ', 0.5, 16], k0: ['k₀', 0, 3.1416], idx: ['n · m', 0, 255, 1] };
const SK = { ground: [], packet: ['x0', 'sig', 'k0'], site: ['idx'], eigen: ['idx'] }, STK = ['state', 'idx', 'x0', 'sig', 'k0'], PRE = (id) => PRESETS.find((q) => q.id === id) || PRESETS[0];
const ENTER = { tunnel: { N: 256, state: 'packet', x0: 0.25, sig: 4 }, hofstadter: { L: 12 }, walk: { N: 128 } };   // a preset's own start (TUNNEL's packet from the left), unless a load or the verb says otherwise
const NOTE = { benzene: ' Hückel: the six π levels ±2β, ±β, ±β fall 1 + 2 + 2 + 1 (a₂u · e₁g · e₂u · b₂g); the degenerate e₁g pair is the HOMO that MOLECULES’ STO-3G benzene names in its stem.',
  graphene: ' A flake of 6m² sites by rings around a hexagon: its levels are the flake’s, not the sheet’s.', aa: ' Localised is said by the IPR’s number alone; the Lyapunov exponent is the prediction.',
  tunnel: ' TUNNEL: a packet from the left meets a barrier V on one or two centre sites; T and R are the norm right and left of it, read once the norm on the barrier has stayed under 10⁻⁴ for 2/J. Below k₀ ≈ 0.6 (and above π − 0.6) the packet’s slowest momenta are still arriving when the walls’ echoes return.',
  patch: ' A patch of the Ammann–Beenker tiling, cut and projected from ℤ⁴ through the octagonal window (tools/lattice/ammann-beenker.mjs), never the quasicrystal.',
  hofstadter: ' HOFSTADTER: an L × L square (L ≤ 12) under a flux Φ = p/q a plaquette, the Peierls phase e^{2πiΦx} on the y-bonds (Landau gauge); a torus when Φ·L is whole, else open edges. Harper’s equation splits the band into q; the butterfly over Φ is a record for later.',
  walk: ' QUANTUM WALK: a MAP, not a Hamiltonian, so no eigensolve and no levels. One step each 1/J: the Hadamard coin, then the shift (↑ right, ↓ left), on a ring of N ≤ 128 sites from (|↑⟩ + i|↓⟩)/√2 at the centre. The height is the site’s probability summed over the coin, the hue the coin’s balance; it spreads as t where a coin-tossing walker spreads as √t.',
  spin: ' SPIN CHAIN: the XX chain H = J Σ (σ⁺ᵢσ⁻ᵢ₊₁ + h.c.) of N ≤ 8 spins, diagonalised exactly on its 2^N states; SITE n is the product state whose set bits are the ↑ spins (|↑↓↑↓…⟩ to start; a click on a spin flips it). The bars are the N spins’ ⟨σ_z⟩, the hue its sign: 2^N basis bars would be the wrong picture. Page’s number is a random state’s mean, not a bound.' };
export function createLattice(host, api) {
  const P = { ...DEFAULTS }, ui = {}; let H = null, S = null, ev = null, t0 = 0, hit = -1, got = null, lastTT = 0, dirty = true, busy = false, gen = 0, lastT = NaN, lut = null, lutOf = null, geo = null;
  const pre = stepper({ aria: 'Lattice preset', items: PRESETS.map(({ id, label }) => ({ id, label })), value: P.preset, cls: 'mol-step', onChange: (id) => set({ preset: id }) });
  const st = seg({ aria: 'Lattice state', value: P.state, options: Object.keys(SK).map((id) => ({ id, label: id === 'eigen' ? 'EIGEN m' : id === 'site' ? 'SITE n' : id.toUpperCase() })), onChange: (v) => set({ state: v }) });
  host.append(pre.root, st.root); const r1 = el('div', 'row', host);
  for (const [k, [label, min, max, step]] of Object.entries(KN)) r1.appendChild((ui[k] = knob({ label, min, max, value: P[k], step,
    fmt: (v) => (k === 'L' && P.preset === 'anderson' && P.d > 1 ? `${(v = Math.min(P.d > 2 ? 6 : 16, Math.round(v)))}${P.d > 2 ? '³' : '²'} = ${v ** P.d} sites` : k === 'rings' ? `${6 * v * v} sites` : k === 'Phi' ? (v / 6.2832).toFixed(3) + ' Φ₀' : step ? String(Math.round(v)) : v.toFixed(2)), onInput: (v) => set({ [k]: step ? Math.round(v) : v }) })).root);
  const hold = el('div', 'ladder-c', host), cv = el('canvas', '', hold); hold.style.height = '180px';
  const ro = { ipr: readout({ label: 'IPR  Σ|ψ|⁴', value: '—' }), lev: readout({ label: 'LEVELS  in J', value: '—' }), law: readout({ label: 'CLOSED FORM · PREDICTION', value: '—', cls: 'wide' }), tr: readout({ label: 'T · R  once passed', value: '—', cls: 'wide' }) };
  ro.run = readout({ label: 'THE RUN  measured · law', value: '—', cls: 'wide' }); ro.and = readout({ label: '⟨r⟩ · IPR × N  the transition', value: '—', cls: 'wide' }); const r2 = el('div', 'row tight', host); for (const r of Object.values(ro)) r2.appendChild(r.root); const note = el('div', 'note', host);
  function sync() {
    const own = P.preset === 'walk' || P.preset === 'spin', show = new Set([...PRE(P.preset).knobs, ...(P.preset === 'walk' ? [] : SK[P.state] || [])]); if (P.preset === 'anderson') show.delete(P.d > 1 ? 'N' : 'L'); for (const k in KN) { ui[k].root.style.display = show.has(k) ? '' : 'none'; ui[k].set(P[k]); }
    pre.set(P.preset); st.set(P.state); st.root.style.display = own ? 'none' : ''; ro.tr.root.style.display = P.preset === 'tunnel' ? '' : 'none'; ro.run.root.style.display = own ? '' : 'none'; ro.and.root.style.display = P.preset === 'anderson' ? '' : 'none'; note.innerHTML = '<b>Units.</b> J = 1 is the energy unit and 1/J the time unit; t is the transport clock’s, from the moment the state is picked.' + (NOTE[P.preset] || '');
  }
  function set(p) {
    if (p.preset !== P.preset && ENTER[p.preset]) p = { ...ENTER[p.preset], ...p };
    if ((p.preset === 'spin' && P.preset !== 'spin') || (p.ns && P.preset === 'spin')) p = { state: 'site', idx: 0x55 & ((1 << (p.ns || P.ns)) - 1), ...p };   // the quench from |↑↓↑↓…⟩
    const was = { ...P }; Object.assign(P, p); sync();
    if (Object.keys(DEFAULTS).some((k) => !STK.includes(k) && P[k] !== was[k])) { dirty = true; gen++; if (api.active()) prepare(); }
    else if (S && STK.some((k) => P[k] !== was[k])) restate();
  }
  function prepare() {
    if (!dirty || busy) return; dirty = false; busy = true; const mine = gen, Hm = build(P);
    const sv = (h) => (api.solve ? api.solve({ n: h.n, re: h.re, im: h.im }) : solveLattice(h)), more = P.preset === 'anderson' ? Array.from({ length: P.seeds - 1 }, (_, j) => sv(build({ ...P, seed: P.seed + j + 1 }))) : [];
    return Promise.all([P.preset === 'walk' ? { n: Hm.n, E: null } : sv(Hm), ...more]).then(([r, ...rs]) => { if (mine === gen && r && !r.error) { H = Hm; S = r; if (P.preset === 'anderson') stats([r, ...rs]); restate(); } })
      .finally(() => { busy = false; if (dirty && api.active()) prepare(); });
  }
  function stats(rs) {   // it005 P4: ⟨r⟩ and the band-centre IPR × N averaged over SEEDS seeds from `seed` up; the picture is the first seed's
    const s = rs.filter((r) => r && !r.error).map(levelStats), av = (f) => s.reduce((a, x) => a + f(x), 0) / s.length, r = av((x) => x.r);
    ro.and.set(`⟨r⟩ ${isFinite(r) ? r.toFixed(4) : '—'} · GOE 0.5307 extended · Poisson 0.3863 localised`); ro.and.setSub(`band-centre IPR × N ${av((x) => x.iprN).toFixed(1)} (1 spread · ${S.n} on one site) · ${s.length} seed${s.length > 1 ? 's' : ''} from ${P.seed}`); }
  function restate() {
    ev = S.E ? evolver(S, psi0(P, S, H.xy)) : walker(H.n); t0 = api.t(); lastT = NaN; hit = -1; got = null;
    const c = closed(P, S.E), E = S.E, n = S.n, h = n >> 1; let d = 0; if (c.levels) for (let k = 0; k < n; k++) d = Math.max(d, Math.abs(E[k] - c.levels[k]));
    if (!E) { ro.lev.set('a map: no levels'); ro.lev.setSub(`${n} sites × 2 coin states = ${2 * n} amplitudes`); }
    else { ro.lev.set(`${n} ${P.preset === 'spin' ? 'states' : 'sites'} · ${E[0].toFixed(4)} … ${E[n - 1].toFixed(4)}`); ro.lev.setSub(`E₁ − E₀ = ${(E[1] - E[0]).toFixed(5)} · mid E_{N/2} − E_{N/2−1} = ${(E[h] - E[h - 1]).toFixed(5)}`); }
    ro.law.set(c.line); ro.law.setSub(c.levels ? `the measured levels agree to ${d.toExponential(1)}` : c.sub || 'the prediction; the IPR is the measurement'); update(api.t());
  }
  function update(t) { if (dirty) { prepare(); return; } if (!ev || t === lastT) return; lastT = t; paint(ev.at(t - t0)); }
  function paint(psi) {
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = hold.clientWidth, Hh = hold.clientHeight; if (W < 32 || Hh < 32) return;
    if (cv.width !== W * dpr || cv.height !== Hh * dpr) { cv.width = W * dpr; cv.height = Hh * dpr; }
    const g = cv.getContext('2d'), T = themeInk(g), xy = H.xy, pal = api.palette(), stops = pal && pal.on ? pal.stops : null;
    if (lutOf !== (stops || hsvWheel)) { lutOf = stops || hsvWheel; lut = toLUT(stops || hsvWheel()); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, Hh); ro.ipr.set(ipr(psi).toFixed(4)); ro.ipr.setSub(`1 on one ${P.preset === 'spin' ? 'state' : 'site'} · 1/N = ${(1 / psi.re.length).toFixed(4)} spread · t = ${(lastT - t0).toFixed(2)}/J`);
    if (P.preset === 'spin') { const v = spinView(psi, P.ns), A = P.ns >> 1; psi = v; ro.run.set(`S(t) ${v.S.toFixed(4)} · the most ${A} ln 2 = ${(A * Math.LN2).toFixed(4)} · Page’s mean ${(A * Math.LN2 - 2 ** (2 * A - P.ns - 1)).toFixed(4)}`); ro.run.setSub(`the half chain: the first ${A} spins’ −Tr ρ ln ρ · ⟨σ_z⟩ ${[...v.z].map((z) => z.toFixed(2)).join(' ')}`); }
    const n = psi.re.length; let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, mx = P.preset === 'spin' ? 1 : 1e-300;
    for (let i = 0; i < n; i++) { const [x, y] = xy[i]; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); mx = Math.max(mx, psi.re[i] ** 2 + psi.im[i] ** 2); }
    const flat = y1 - y0 < 1e-9, bot = Hh - 30, bar = flat ? bot - 10 : Math.max(14, (bot - 10) * 0.3), s = Math.min((W - 16) / ((x1 - x0) || 1), flat ? Infinity : (bot - 16 - bar) / (y1 - y0));
    const X = (x) => W / 2 + (x - (x0 + x1) / 2) * s, Y = (y) => (flat ? bot : (10 + bar + bot) / 2 + (y - (y0 + y1) / 2) * s), w = Math.max(1.5, Math.min(10, s * 0.6)); geo = { X, Y };
    if (P.preset === 'tunnel') { const tt = lastT - t0, sp = split(psi, P); if (tt < lastTT) { hit = -1; got = null; } lastTT = tt; if (sp.B > 1e-4) hit = tt; else if (hit >= 0 && !got && tt - hit >= 2) got = { ...sp, t: tt };   // passed: under 1e-4 for 2/J (the lattice's Airy tail rings through it)
      ro.tr.set(got ? `T ${got.T.toFixed(3)} measured · ${tunnelT(P.k0, P.V, P.nb).toFixed(4)} T(k₀) · R + T = ${(got.R + got.T).toFixed(9)}` : `on the barrier ${sp.B.toExponential(1)}`); ro.tr.setSub(got ? `R ${got.R.toFixed(3)} · read at t = ${got.t.toFixed(1)}/J` : 'waiting for the packet to pass');
      g.fillStyle = T.ink(0.2); g.fillRect(X((n >> 1) - P.nb + 0.5), bot - bar * P.V / 4, Math.max(3, s * P.nb), bar * P.V / 4); }   // the barrier, V/4J tall
    if (P.preset === 'walk') { let m1 = 0, m2 = 0; for (let i = 0; i < n; i++) { const q = psi.re[i] ** 2 + psi.im[i] ** 2, x = i - (n >> 1); m1 += q * x; m2 += q * x * x; } const k = psi.steps, v = m2 - m1 * m1;
      ro.run.set(`σ² ${v.toFixed(2)} measured · ${((1 - Math.SQRT1_2) * k * k).toFixed(2)} = (1 − 1/√2)t² ballistic · ${k} = t classical`); ro.run.setSub(`after ${k} steps · σ²/t² = ${k ? (v / k / k).toFixed(4) : '—'}${k > n / 2 ? ' · past t = N/2 the ring’s two fronts can meet' : ''}`); }
    g.strokeStyle = T.ink(0.3); g.lineWidth = 1; g.beginPath(); for (const [i, j] of H.hop) if (Math.hypot(xy[i][0] - xy[j][0], xy[i][1] - xy[j][1]) < 1.5) { g.moveTo(X(xy[i][0]), Y(xy[i][1])); g.lineTo(X(xy[j][0]), Y(xy[j][1])); } g.stroke();
    for (let i = 0; i < n; i++) { const q = (psi.re[i] ** 2 + psi.im[i] ** 2) / mx, u = Math.floor(((Math.atan2(psi.im[i], psi.re[i]) / (2 * Math.PI) + 0.5) % 1) * 256) % 256;
      g.fillStyle = `rgb(${lut[u * 4] * 255 | 0},${lut[u * 4 + 1] * 255 | 0},${lut[u * 4 + 2] * 255 | 0})`; g.fillRect(X(xy[i][0]) - w / 2, Y(xy[i][1]) - q * bar, w, Math.max(1, q * bar)); }
    const E = S.E, m = S.n, span = E && (E[m - 1] - E[0]) || 1, bw = Math.max(1, (W - 16) / m - 1); let pm = 1e-300; if (E) for (let k = 0; k < m; k++) pm = Math.max(pm, ev.ar[k] ** 2 + ev.ai[k] ** 2);
    if (E) for (let k = 0; k < m; k++) { const hk = 2 + 18 * (E[k] - E[0]) / span; g.fillStyle = T.fg(0.15 + 0.85 * (ev.ar[k] ** 2 + ev.ai[k] ** 2) / pm); g.fillRect(8 + (k + 0.5) * (W - 16) / m - bw / 2, Hh - 4 - hk, bw, hk); }
  }
  cv.addEventListener('click', (e) => { if (!S || !geo) return; const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (y > r.height - 26) return set({ state: 'eigen', idx: Math.max(0, Math.min(S.n - 1, Math.floor((x - 8) / (r.width - 16) * S.n))) });
    let best = 0, bd = Infinity; for (let i = 0; i < H.xy.length; i++) { const d = Math.hypot(geo.X(H.xy[i][0]) - x, geo.Y(H.xy[i][1]) - y); if (d < bd) { bd = d; best = i; } } set({ state: 'site', idx: P.preset === 'spin' ? P.idx ^ (1 << best) : best });
  });
  new ResizeObserver(() => { lastT = NaN; if (ev) update(api.t()); }).observe(hold);
  sync();
  return (LAT = { prepare, update, set, params: P, ro: Object.values(ro), get label() { return PRE(P.preset).label; },
    save() { const d = {}; for (const k in DEFAULTS) if (P[k] !== DEFAULTS[k]) d[k] = P[k]; return Object.keys(d).length ? d : undefined; },
    load(I) { const q = { ...DEFAULTS }; for (const k in q) if (I && typeof I[k] === typeof q[k]) q[k] = I[k]; if (!SK[q.state]) q.state = DEFAULTS.state; set({ ...q, preset: PRE(q.preset).id }); } });
}
