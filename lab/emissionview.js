/* emissionview.js — THE EMISSION SPECTRA window (iteration 016 E1): the strip of lines the system in force can make, and the prepared state's own.
 *
 * THE INVERSE MAP.  The strip shows lines; a press on one populates the pair that makes it (the seat's `load`: a HAND's preset, one history row
 * `EMISSION · Hα`, THE FADE).  A press is the steady beat (the two labels at equal weight, phase 0, the density breathing at ω); Shift + press, or
 * DECAY on, is the A ↔ B TRANSITION (A the upper level, B the lower: the exact two-level Rabi mix, the atom visibly emitting).  Two populations are
 * drawn: THE CATALOGUE dim (hydrogen: dynamics.js lineList grouped by shell, emission-map.js hydrogenStrip; the ATOM: NIST ASD's measured lines,
 * lab/vendor/nist/lines.json, read on the first ATOM landing and kept as DATA) and THE STATE lit in ACCENT A (dynamics.js stateLines over the
 * populated labels, rebuilt on the register's `version`, never in a frame).  Under the ATOM the lit line stands at the COMPUTED Xα Δε, beside — not on
 * — the measured one: the gap is the engine's error, shown.  RANGE VISIBLE | ALL, ‹ SERIES ›, ‹ PAIR › and DECAY are the hand's, never saved.
 * A wheel over the strip steps the hover line by line (← → too, Enter presses); the hover is the kit's graph tip.  Nothing here runs on the frame
 * path: update() returns at once unless the operator, the element or the register moved.  The fold holds the prepared state's line table, which
 * was RADIATION's EMISSION LINES (moved whole, call 1 of the plan; RADIATION keeps its far field). */
import { el, seg, sw, stepper, accentRGB, themeInk, showGraphTip, hideGraphTip } from './mir/kit.js'; import { toLUT } from './mir/palette.js';
import { fold } from './fold.js';
import { levelLine } from './paint-stroke.js';
import { BASIS, BASIS_INDEX } from './hydrogen.js';
import { getHamiltonian } from './hamiltonian.js';
import { lineList, linePairs, stateLines, lineMass, lambdaNm, HARTREE_EV } from './dynamics.js';
import { SERIES, RANGES, xOf, hydrogenStrip, atomStrip, orbName, waveRGB } from './emission-map.js';
import { keepData } from './library.js';
import { EMISSION_STATUS } from './status.js';

const NIST_URL = './vendor/nist/lines.json';
/* E6 · THE STRIP IN LATTICE'S STYLE (Josh 10-25): no black box — the card's glass is the ground (clearRect), the axis in the theme's ink and the
   UI face, the catalogue a comb (a fine ink stroke with a 1-px core in the line's spectral colour), the register's lit lines THE LEVEL LINE upright
   in ACCENT A, the hover the ladder's cursor bracket.  STRIP_SHADE 0 = A, the lines straight on the glass (LATTICE's way, shipped); 1 = B, a
   translucent feathered shade of the ink behind them (the kit's informational layer's way). */
const STRIP_SHADE = 0;
const sci = (v, d = 2) => (v > 0 ? v.toExponential(d).replace('e+', 'e') : '—');
const nmText = (nm) => (nm >= 10000 ? (nm / 1000).toFixed(2) + ' µm' : nm >= 1000 ? (nm / 1000).toFixed(3) + ' µm' : nm.toFixed(2) + ' nm');
const lbl = (a) => BASIS[a].label;
const idx = (n, l, m) => BASIS_INDEX.get(`h:${n}:${l}:${m}`);

/** createEmission(host, api) — api: { reg, clock, load({ id, label, row, modes, decay, T }), status(text, cls), repaint() }.  The rack drives
 *  update() from its CPU tick while the card can present. */
export function createEmission(host, api) {
  const { reg } = api;
  let nist = null, nistState = 'idle';   // idle · loading · ok · failed
  let catKey = '', cat = [], litV = -1, lit = [], sys = '', range = 'all', series = 'all', hover = -1, picked = null, pairs = [], lastPair = null, dirty = true;

  /* ── the strip ── */
  const cv = el('canvas', 'em-strip', host); cv.tabIndex = 0; cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'emission lines');
  const g = cv.getContext('2d');
  /* ── row 2: ‹ SERIES › · RANGE ── */
  const r2 = el('div', 'row tight em-row', host);
  const seriesStep = stepper({ aria: 'series', items: [{ id: 'all', label: 'ALL' }], value: 'all', cls: 'em-step', onChange: (id) => { series = id; hover = -1; build(true); } });
  r2.appendChild(seriesStep.root);
  const rangeSeg = seg({ aria: 'range', value: 'all', cls: 'em-vseg', options: [{ id: 'visible', label: 'VISIBLE', title: '380–750 nm, linear' }, { id: 'all', label: 'ALL', title: '90 nm – 12.5 µm, logarithmic' }],
    onChange: (v) => { range = v; hover = -1; build(true); } });
  r2.appendChild(rangeSeg.root);
  /* ── row 3: ‹ PAIR › · DECAY · the fold ── */
  const r3 = el('div', 'row tight em-row', host);
  const pairStep = stepper({ aria: 'pair', items: [{ id: '', label: 'PAIR', coming: true }], value: '', cls: 'em-step', onChange: (id) => { const p = pairs[+id]; if (picked && p) press(picked, p, decaySw.get()); } });
  r3.appendChild(pairStep.root);
  const decaySw = sw({ label: 'DECAY', value: false, title: 'A press plays the A ↔ B TRANSITION (the upper level to the lower, Rabi) instead of the steady beat; Shift + press does it once' });
  r3.appendChild(decaySw.root);
  const table = el('div', 'em-table');
  fold(r3, table, { what: 'the line table', key: 'lines' });
  host.appendChild(table);
  el('div', 'note', host).innerHTML = '<b>Emission.</b> A line is two eigenstates beating: a press populates the pair that makes it, and the density breathes at ω = ΔE. Shift + press (or DECAY) plays the A ↔ B transition from the upper level to the lower. Dim lines are what the system can make — hydrogen computed, an ATOM measured (NIST ASD) — and lit lines are the prepared state’s. No radiation reaction, fine structure, Lamb shift or widths; an atom’s multiplets are one picture per orbital pair.';

  /* ── the catalogue of the system in force ── */
  function catalogue() {
    const H = getHamiltonian();
    if (H.id === 'hydrogen') return hydrogenStrip(lineList(H)).map((s) => ({ id: s.id, name: s.name, lambda: s.lambda, A: s.A, series: s.series, upper: s.upper, lower: s.lower, subs: s.subs, map: true, why: '' }));
    if (H.id === 'atom' && nist) {
      const sym = H.short || '';
      return atomStrip(nist.lines, H.Z).map((L) => ({ ...L, name: `${sym} ${L.lambda.toFixed(2)} nm`, series: '' }));
    }
    return [];
  }
  function seriesItems(H) {
    return H.id === 'hydrogen' ? [{ id: 'all', label: 'ALL' }, ...SERIES.map((s) => ({ id: s.id, label: s.label }))]
      : [{ id: 'all', label: 'ALL' }, { id: 'visible', label: 'VISIBLE' }, { id: 'one', label: 'ONE-ELECTRON' }];
  }
  const shown = (L) => { const x = xOf(L.lambda, RANGES[range]); if (!(x >= 0 && x <= 1)) return false;
    if (series === 'all') return true; if (sys === 'hydrogen') return L.series === series;
    return series === 'visible' ? L.lambda >= 380 && L.lambda <= 750 : !!L.map; };
  let view = [];   // the catalogue lines drawn, by λ
  function build(force) {
    const H = getHamiltonian(), key = `${H.id}:${H.Z || ''}:${H.mu || 1}:${H.k || ''}:${nistState}`;
    if (key !== catKey || force) {
      if (H.id !== sys) { sys = H.id; series = 'all'; seriesStep.setItems(seriesItems(H), 'all'); picked = null; pairs = []; paintPairs(); }
      if (key !== catKey) { catKey = key; cat = catalogue(); hover = -1; }
      view = cat.filter(shown);
      dirty = true;
    }
  }
  /* ── the lines of the prepared state ── */
  function litLines() {
    const H = getHamiltonian();
    if ((H.id !== 'hydrogen' && H.id !== 'atom') || reg.P) return [];
    return stateLines(reg.re0, reg.im0, reg.populated(), H).slice(0, 24);
  }
  function paintTable() {
    if (!lit.length) { table.innerHTML = '<p class="em-none">no line: a line needs two labels with l′ = l ± 1 and a gap</p>'; return; }
    const H = getHamiltonian(), m = lineMass(H);
    table.innerHTML = '<table><thead><tr><th>λ</th><th>E eV</th><th>ω</th><th>T</th><th>A s⁻¹</th><th>pair</th></tr></thead><tbody>' + lit.slice(0, 12).map((L) =>
      `<tr><td>${nmText(L.lambda)}</td><td>${(L.omega * m * HARTREE_EV).toFixed(3)}</td><td>${L.omega.toFixed(4)}</td><td>${(2 * Math.PI / L.omega).toFixed(1)}</td><td>${sci(L.A)}</td><td>${lbl(L.a)} → ${lbl(L.b)}</td></tr>`).join('') + '</tbody></table>';
  }

  /* ── the pairs of a line ── */
  function pairsOf(L) {
    const H = getHamiltonian();
    if (sys === 'hydrogen') { const out = []; for (const s of L.subs) for (const p of linePairs(s.upper, s.lower, H)) out.push({ ...p, level: s.A }); return out.sort((x, y) => (x.dm !== 0) - (y.dm !== 0) || y.A - x.A); }
    return L.map ? linePairs(L.map.upper, L.map.lower, H).map((p) => ({ ...p, level: L.A })) : [];
  }
  function paintPairs(sel = 0) {
    if (!pairs.length) { pairStep.setItems([{ id: '', label: 'PAIR', coming: true }], ''); return; }
    pairStep.setItems(pairs.map((p, i) => ({ id: String(i), label: `${lbl(p.a)} + ${lbl(p.b)}` })), String(sel));
    pairStep.root.title = pairs.map((p) => `${lbl(p.a)} + ${lbl(p.b)} ${p.dm === 0 ? 'π' : 'σ'} A ${sci(p.A)} s⁻¹`).slice(0, 8).join(' · ');
  }

  /* ── THE HAND: a press loads the pair ── */
  function press(L, P, decay) {
    if (!L || !P) return false;
    const A = BASIS[P.a], B = BASIS[P.b], H = getHamiltonian(), omega = Math.abs(H.energy(P.a) - H.energy(P.b));
    const ok = api.load({ id: `emission:${L.id}:${P.a}:${P.b}`, label: `${L.name} · ${lbl(P.a)} + ${lbl(P.b)}`, row: 'EMISSION · ' + L.name,
      modes: [{ n: A.n, l: A.l, m: A.m, amp: 1, phase: 0 }, { n: B.n, l: B.l, m: B.m, amp: 1, phase: 0 }], upper: P.a, lower: P.b, decay: !!decay, T: 2 * Math.PI / omega });
    if (ok !== false) { picked = L; lastPair = { line: L.name, id: L.id, upper: lbl(P.a), lower: lbl(P.b), a: P.a, b: P.b, dm: P.dm, decay: !!decay }; dirty = true; }
    return ok !== false;
  }
  function pressLine(L, decay) {
    if (!L || !L.map) return false;
    if (L !== picked) { pairs = pairsOf(L); paintPairs(0); }
    return press(L, pairs[+pairStep.get() || 0] || pairs[0], decay);
  }

  /* ── painting ── */
  let rect = { x0: 0, x1: 1, top: 0, base: 1 }, T = null, face = 'system-ui, sans-serif', palOf = null, lut = null;
  const X = (nm) => rect.x0 + xOf(nm, RANGES[range]) * (rect.x1 - rect.x0);
  function paint() {
    const W = cv.clientWidth, Hh = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (W < 40 || Hh < 30) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(Hh * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(Hh * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, Hh);
    T = themeInk(g); face = getComputedStyle(document.body).getPropertyValue('--font-ui').trim() || 'Roboto, system-ui, sans-serif';
    rect = { x0: 6, x1: W - 6, top: 6, base: Hh - 16 };
    const R = RANGES[range], span = rect.base - rect.top;
    if (STRIP_SHADE) {   // B: a feathered shade of the ink, soft at its top and bottom and at both ends (no edge to see)
      const v = g.createLinearGradient(0, 0, 0, rect.base + 2); v.addColorStop(0, T.ink(0)); v.addColorStop(0.28, T.ink(0.55)); v.addColorStop(0.82, T.ink(0.55)); v.addColorStop(1, T.ink(0));
      g.fillStyle = v; g.fillRect(0, 0, W, rect.base + 2);
      const h = g.createLinearGradient(0, 0, W, 0); h.addColorStop(0, 'rgba(0,0,0,0)'); h.addColorStop(0.06, '#000'); h.addColorStop(0.94, '#000'); h.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalCompositeOperation = 'destination-in'; g.fillStyle = h; g.fillRect(0, 0, W, Hh); g.globalCompositeOperation = 'source-over';
    }
    /* the eye's band under the axis, and the axis */
    const v0 = Math.max(rect.x0, X(380)), v1 = Math.min(rect.x1, X(750));
    for (let x = Math.floor(v0); x < v1; x++) { const nm = R.log ? R.lo * Math.pow(R.hi / R.lo, (x - rect.x0) / (rect.x1 - rect.x0)) : R.lo + (R.hi - R.lo) * (x - rect.x0) / (rect.x1 - rect.x0), c = waveRGB(nm); if (!c) continue; g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},0.55)`; g.fillRect(x, rect.base + 1, 1, 3); }
    g.strokeStyle = T.ink(0.3); g.lineWidth = 1; g.beginPath(); g.moveTo(rect.x0, rect.base + 0.5); g.lineTo(rect.x1, rect.base + 0.5); g.stroke();
    g.font = `9px ${face}`; g.textBaseline = 'top'; g.textAlign = 'center';
    const ticks = R.log ? [100, 200, 500, 1000, 2000, 5000, 10000] : [400, 500, 600, 700];
    for (const t of ticks) { const x = X(t); g.fillStyle = T.ink(0.3); g.fillRect(Math.round(x), rect.base, 1, 4); g.fillStyle = T.ink(0.85); if (R.log ? [100, 1000, 10000].includes(t) : true) g.fillText(t >= 1000 ? t / 1000 + ' µm' : t + (R.log ? ' nm' : ''), Math.min(rect.x1 - 14, Math.max(rect.x0 + 14, x)), rect.base + 5); }
    const H = getHamiltonian();
    if (sys !== 'hydrogen' && sys !== 'atom') { say('lines for HYDROGEN and ATOM only'); return; }
    if (reg.P) { say('the lines need a diagonal H: switch SCALE back to HYDROGEN'); return; }
    /* the series limits (n → ∞), past the register */
    if (sys === 'hydrogen') { g.fillStyle = T.ink(0.45); for (const s of SERIES) { if (series !== 'all' && series !== s.id) continue; const lim = lambdaNm(-H.energy(idx(s.lower, 0, 0)) * lineMass(H)), x = X(lim); if (x >= rect.x0 && x <= rect.x1) g.fillRect(Math.round(x), rect.top - 4, 1, 7); } }
    /* THE CATALOGUE, a comb: a fine ink stroke, a 1-px core in the line's spectral colour (ink past the eye); height by log A over what is drawn.
       A line no picture can make (past the register, not one electron) is the ink stroke alone, fainter */
    let lo = Infinity, hi = -Infinity; for (const L of view) { const a = Math.log10(L.A || 1); lo = Math.min(lo, a); hi = Math.max(hi, a); }
    const hOf = (A) => span * (0.22 + 0.7 * (hi > lo ? (Math.log10(A || 1) - lo) / (hi - lo) : 1));
    /* E7 (Josh 10-25: "Can it use the color of the palette or using the accent A/B?"): PALETTE ON paints the cores with the reader's palette read
       across the strip (LATTICE's road: the palette's LUT, re-made when the stops change), PALETTE OFF the line's true spectral colour; the catalogue
       line the lit state was pressed from — its HOME — wears ACCENT B (A is the computed line, B the measured one it answers) */
    const pal = api.palette && api.palette(), stops = pal && pal.on ? pal.stops : null;
    if (stops !== palOf) { palOf = stops; lut = stops ? toLUT(stops) : null; }
    const coreOf = (L, x) => { if (!lut) return waveRGB(L.lambda); const u = Math.max(0, Math.min(255, Math.round((x - rect.x0) / (rect.x1 - rect.x0) * 255))) * 4; return [lut[u] * 255 | 0, lut[u + 1] * 255 | 0, lut[u + 2] * 255 | 0]; };
    const B = accentRGB(g, 2);
    let hovX = NaN, hovTop = rect.base;
    view.forEach((L, i) => {
      const x = Math.round(X(L.lambda)) + 0.5, c = L.map ? coreOf(L, x) : null, h = hOf(L.A), on = i === hover, home = !!(picked && L.id === picked.id);
      g.strokeStyle = T.ink(L.map ? (on || home ? 0.45 : 0.3) : 0.16); g.lineWidth = L.map ? 3 : 2; g.beginPath(); g.moveTo(x, rect.base); g.lineTo(x, rect.base - h); g.stroke();
      if (L.map) { g.strokeStyle = home ? `rgb(${B[0]},${B[1]},${B[2]})` : c ? `rgba(${c[0]},${c[1]},${c[2]},${on ? 1 : 0.9})` : T.ink(on ? 0.95 : 0.6); g.lineWidth = home ? 1.5 : 1; g.beginPath(); g.moveTo(x, rect.base); g.lineTo(x, rect.base - h); g.stroke(); }
      if (on) { hovX = x; hovTop = rect.base - h; }
    });
    /* THE STATE, lit: THE LEVEL LINE upright in ACCENT A at full strength — a pressed line reads as an occupied rung */
    if (lit.length) {
      const acc = accentRGB(g, 1), top = Math.log10(lit[0].amplitude), bot = Math.log10(lit[lit.length - 1].amplitude);
      for (const L of lit) { const x = X(L.lambda); if (!(x >= rect.x0 - 1 && x <= rect.x1 + 1)) { edge(x < rect.x0 ? rect.x0 : rect.x1, acc); continue; }
        const h = span * (0.45 + 0.55 * (top > bot ? (Math.log10(L.amplitude) - bot) / (top - bot) : 1)), xx = Math.round(x) + 0.5;
        levelLine(g, rect.base, rect.base - h, xx, acc, true, 1.5, 1, true);
        if (Math.abs(xx - hovX) < 1.5) hovTop = Math.min(hovTop, rect.base - h); }
    }
    /* THE HOVER: the ladder's cursor bracket, upright — a cap over the line, a cup at its foot, in the theme's ink */
    if (hovX === hovX) { const a = Math.max(1, hovTop - 3), b = rect.base + 2, w = 4;
      g.strokeStyle = T.ink(0.95); g.lineWidth = 1.5; g.beginPath();
      g.moveTo(hovX - w, a + 3); g.lineTo(hovX - w, a); g.lineTo(hovX + w, a); g.lineTo(hovX + w, a + 3);
      g.moveTo(hovX - w, b - 3); g.lineTo(hovX - w, b); g.lineTo(hovX + w, b); g.lineTo(hovX + w, b - 3); g.stroke(); }
    if (sys === 'atom' && nistState !== 'ok') say(nistState === 'failed' ? 'NIST table unavailable here (offline before its first read)' : 'reading the NIST lines…');
    else if (!view.length && sys === 'atom') say(cat.length ? 'no measured line in this range' : `NIST ASD lists no neutral ${H.short || ''} line with A and both configurations`);
  }
  function edge(x, acc) { g.fillStyle = `rgb(${acc[0]},${acc[1]},${acc[2]})`; g.beginPath(); const d = x <= rect.x0 ? -1 : 1, y = (rect.top + rect.base) / 2; g.moveTo(x + d * 5, y); g.lineTo(x - d * 1, y - 5); g.lineTo(x - d * 1, y + 5); g.fill(); }
  function say(t) { g.font = `10px ${face}`; g.fillStyle = T ? T.ink(0.85) : 'rgba(128,128,128,0.85)'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, (rect.x0 + rect.x1) / 2, (rect.top + rect.base) / 2); }

  /* ── the hover: the cursor bracket, the kit's graph tip; the wheel and ← → step it ── */
  function tipFor(L) {
    if (sys === 'hydrogen') { const P = pairsOf(L)[0];
      return `${L.name} · ${nmText(L.lambda)} · ${L.upper} → ${L.lower}${P ? ` · ${lbl(P.a)} + ${lbl(P.b)} · A ${sci(P.level)} s⁻¹` : ''}`; }
    const H = getHamiltonian(), conf = `${L.upper.conf} ${L.upper.term} → ${L.lower.conf} ${L.lower.term}`;
    if (!L.map) return `${L.name} · ${conf} · A ${sci(L.A)} s⁻¹ · ${L.why}`;
    const a = idx(L.map.upper.n, L.map.upper.l, 0), b = idx(L.map.lower.n, L.map.lower.l, 0), calc = lambdaNm(Math.abs(H.energy(a) - H.energy(b)));
    return `${L.name} · ${orbName(L.map.upper)} → ${orbName(L.map.lower)} · ${conf} · A ${sci(L.A)} s⁻¹` + (L.same.length ? ` · with ${L.same.slice(0, 3).map((x) => x.lambda.toFixed(2)).join(', ')} nm` : '') + ` · beat at the computed Δε: ${nmText(calc)}`;
  }
  function showHover() {
    if (hover < 0 || hover >= view.length) { hideGraphTip(cv); return; }
    const L = view[hover], r = cv.getBoundingClientRect();
    showGraphTip(cv, tipFor(L), r.left + X(L.lambda), r.top + rect.top + 4);
  }
  const nearest = (px) => { let best = -1, bd = 7; view.forEach((L, i) => { const d = Math.abs(X(L.lambda) - px); if (d < bd) { bd = d; best = i; } }); return best; };
  cv.addEventListener('pointermove', (e) => { const r = cv.getBoundingClientRect(), h = nearest(e.clientX - r.left); if (h !== hover) { hover = h; paint(); } showHover(); });
  cv.addEventListener('pointerleave', () => { if (hover >= 0) { hover = -1; paint(); } hideGraphTip(cv); });
  cv.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const r = cv.getBoundingClientRect(), h = nearest(e.clientX - r.left); if (h < 0) return;
    hover = h; pressLine(view[h], e.shiftKey || decaySw.get()); paint(); showHover();
  });
  const stepHover = (d) => { if (!view.length) return; hover = hover < 0 ? (d > 0 ? 0 : view.length - 1) : Math.max(0, Math.min(view.length - 1, hover + d)); paint(); showHover(); };
  cv.addEventListener('wheel', (e) => { if (!view.length) return; e.preventDefault(); stepHover(e.deltaY > 0 || e.deltaX > 0 ? 1 : -1); }, { passive: false });
  cv.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); stepHover(e.key === 'ArrowRight' ? 1 : -1); }
    else if ((e.key === 'Enter' || e.key === ' ') && hover >= 0) { e.preventDefault(); pressLine(view[hover], e.shiftKey || decaySw.get()); paint(); }
  });
  cv.addEventListener('blur', () => hideGraphTip(cv));
  if (typeof ResizeObserver === 'function') new ResizeObserver(() => { dirty = true; update(); }).observe(cv);

  /* ── the NIST table: DATA, read on the first ATOM landing, kept on the device ── */
  function readNist() {
    if (nistState !== 'idle') return; nistState = 'loading';
    fetch(NIST_URL).then((r) => { if (!r.ok) throw new Error(r.status); keepData(NIST_URL, r.clone()); return r.json(); })
      .then((j) => { nist = j; nistState = 'ok'; }).catch(() => { nistState = 'failed'; }).finally(() => { catKey = ''; if (api.repaint) api.repaint(); });
  }

  /** update() — the rack's CPU tick while the card can present: nothing unless the operator, the element or the register moved */
  function update() {
    const H = getHamiltonian();
    if (H.id === 'atom' && nistState === 'idle') readNist();
    build(false);
    { const pal = api.palette && api.palette(); if ((pal && pal.on ? pal.stops : null) !== palOf) dirty = true; }   // E7: a palette change repaints the comb
    if (reg.version !== litV || dirty) {
      if (reg.version !== litV) { litV = reg.version; lit = litLines(); paintTable(); }
      api.status(H.id === 'hydrogen' ? EMISSION_STATUS.hydrogen : H.id === 'atom' ? EMISSION_STATUS.atom : 'lines for HYDROGEN and ATOM only', H.id === 'hydrogen' || H.id === 'atom' ? (reg.P ? 'warn' : '') : 'warn');
      dirty = false; paint();
    }
  }

  /** the facade's three: the catalogue, a press by id or name, the last pair pressed (and the lit lines, for a proof) */
  const find = (id) => cat.find((L) => L.id === id || L.name === id) || (Number.isFinite(+id) ? cat.reduce((b, L) => (!b || Math.abs(L.lambda - id) < Math.abs(b.lambda - id) ? L : b), null) : null);
  return {
    update, paint,
    lines: () => { build(false); return cat.map((L) => ({ id: L.id, name: L.name, lambda: L.lambda, A: L.A, pressable: !!L.map, why: L.why || '' })); },
    pick(id, opt = {}) { build(false); const L = find(id); if (!L || !L.map) return false; pairs = pairsOf(L); const k = Math.max(0, Math.min(pairs.length - 1, opt.pair | 0)); picked = L; paintPairs(k); return press(L, pairs[k], !!opt.decay) ? lastPair : false; },
    pair: () => lastPair,
    lit: () => lit.map((L) => ({ lambda: L.lambda, upper: lbl(L.a), lower: lbl(L.b), amplitude: L.amplitude })),
    get canvas() { return cv; },
  };
}
