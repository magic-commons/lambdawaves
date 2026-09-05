/* atomsview.js — the ATOMS window: which atom the register is in, and everything that model owes the reader.
 *
 * The maths is lab/atoms.js: one self-consistent CENTRAL field per element (Xα, α = 2/3, plus the Latter tail),
 * solved live on a logarithmic mesh — twice, and Richardson-extrapolated in dx² — for Z = 1 … 36.  This window
 * prints what the model says and, as loudly, what it does NOT say:
 *
 *   · an Xα eigenvalue is not a Koopmans energy, so −ε and the Δ-SCF ionisation stand SIDE BY SIDE and only the
 *     second is ever called an ionisation energy (Ne: −ε(2p) = 15.08 eV, Δ-SCF = 21.09 eV, measured 21.56);
 *   · the quantum defect travels with its α (Na 3s: 1.3266 at α = 2/3, 1.3732 at α = 1, spectra 1.3730);
 *   · when the two least-bound shells lie within 0.1 hartree the window says the ORDER IS α-DEPENDENT instead of
 *     asserting one (Sc's 3d/4s crosses at α* ≈ 0.84) — the whole transition row is in that band.
 *
 * The two canvases are DISPLAY CHOICES, said out loud on the picture: the shell ladder's bar is log₁₀|ε| (a linear
 * bar would be one core line and a heap), and the radial axis is √r (on a linear r a Kr 1s is one pixel wide).
 * Colours are the two accent-wheel angles the interface already carries; nothing new.
 *
 * STATUS: NUMERICAL, reporting a MODEL.  Every number leaves here with its model string attached.
 */
import { el, readout, trig, graphHover, fitText } from './kit.js';
import { ATOMS, atom, configOf, solveAtom, atomEnergyOf, ionisation, quantumDefect, atomRadial, atomDomainFor,
  EXCHANGE_MODEL, HARTREE_EV } from './atoms.js';

const SPD = 'spdfgh';
/** the two accent angles, resolved through the canvas so any CSS colour form parses; mix in sRGB */
function readRGB(g, name, fallback) {
  const v = getComputedStyle(document.body).getPropertyValue(name).trim();
  const keep = g.fillStyle;
  g.fillStyle = fallback; if (v) { try { g.fillStyle = v; } catch (e) { /* an unparseable value leaves the fallback */ } }
  const s = String(g.fillStyle); g.fillStyle = keep;
  let m = /^#([0-9a-f]{6})$/i.exec(s);
  if (m) { const k = parseInt(m[1], 16); return [k >> 16 & 255, k >> 8 & 255, k & 255]; }
  m = /^#([0-9a-f]{3})$/i.exec(s);
  if (m) return [0, 1, 2].map((i) => parseInt(m[1][i] + m[1][i], 16));
  m = /rgba?\(([^)]+)\)/i.exec(s);
  if (m) { const p = m[1].split(/[,\s/]+/).map(Number); return [p[0] | 0, p[1] | 0, p[2] | 0]; }
  return [120, 225, 240];
}
const mix = (a, b, t) => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t));
const rgba = (c, al) => `rgba(${c[0]},${c[1]},${c[2]},${al})`;

/**
 * createAtoms(host, api) — api: Z() the element in force, step(d) move the ELEMENT knob by d, fill() populate the
 * valence, active() whether the ATOM Hamiltonian is the one the register refers to.
 */
export function createAtoms(host, api) {
  let Z = 0, cache = null, dirty = true;

  const r0 = el('div', 'row tight', host);
  const roEl = readout({ label: 'ELEMENT', value: '—', sub: '' });
  const roModel = readout({ label: 'MODEL', value: '—', sub: '' });
  const roE = readout({ label: 'E  total', value: '—', sub: '' });
  r0.appendChild(roEl.root); r0.appendChild(roModel.root); r0.appendChild(roE.root);

  const r1 = el('div', 'row tight', host);
  const roIP = readout({ label: 'IONISATION  Δ-SCF', value: '—', sub: '' });
  const roKo = readout({ label: 'KOOPMANS  −ε  (NOT the IP)', value: '—', sub: '' });
  const roQD = readout({ label: 'QUANTUM DEFECT  δ_l', value: '—', sub: '' });
  r1.appendChild(roIP.root); r1.appendChild(roKo.root); r1.appendChild(roQD.root);

  const lad = el('canvas', 'atm-c', host); lad.title = 'the shell ladder: every occupied shell, its occupancy and its eigenvalue in hartree and eV; the bar is log₁₀|ε|';
  const rad = el('canvas', 'atm-r', host); rad.title = 'u_nl(r) = r·R_nl(r) of the occupied shells, on a √r axis so the core and the valence are on one picture';
  /* WAVE 46: the bars and the radial curves answer for themselves; the ladder's own columns stay (a measured
     TABLE is not a floating label), and the radial plot lost the names it used to stack over its curves. */
  const ladHover = graphHover(lad, { repaint: () => paintLadder() });
  const radHover = graphHover(rad, { repaint: () => paintRadial() });

  const r2 = el('div', 'row tight', host);
  r2.appendChild(trig({ label: '◂ Z', title: 'the previous element (the ELEMENT knob in SPECTRUM is the same control)', onFire: () => api.step(-1) }).root);
  r2.appendChild(trig({ label: 'Z ▸', title: 'the next element', onFire: () => api.step(1) }).root);
  r2.appendChild(trig({ label: 'FILL THE VALENCE', title: 'put the outermost occupied shell in the register: every m of it, equally and in phase, normalised — the ATOM Hamiltonian first if it is not already in force', onFire: () => api.fill() }).root);
  const roScf = readout({ label: 'SCF', value: '—', sub: '' });
  r2.appendChild(roScf.root);

  const alpha = el('div', 'note atm-alpha', host); alpha.hidden = true;
  el('div', 'note', host).innerHTML = '<b>NUMERICAL (self-consistent).</b> One central potential per element, shared by every shell: −Z/r + V<sub>H</sub> + V<sub>x</sub> with <b>Xα, α = 2/3</b> (Kohn–Sham–Gáspár–Dirac, not Slater\'s α = 1) and the <b>LATTER TAIL</b>, V ← min(V, −(Z−N+1)/r) — without which an LDA potential dies exponentially and the valence electron sees no Coulomb tail at all, so the quantum defect would have nothing to be defined against. Solved on a logarithmic mesh, twice (M and 2M points) and <b>Richardson-extrapolated</b> in dx², Anderson-mixed to ‖ΔV·r‖ &lt; 10<sup>−8</sup>. <b>WHAT THIS IS NOT.</b> An Xα eigenvalue is <b>not</b> a Koopmans energy (Slater 1970): for Ne, −ε(2p) = 15.08 eV against a measured 21.56, while the <b>Δ-SCF</b> of the same functional — the self-consistent ion minus the self-consistent neutral — gives 21.09. Both are printed; only the Δ-SCF is ever called an ionisation energy. Xα(2/3), Slater\'s α = 1, HFS and nonlocal Hartree–Fock are four different models, so the α travels with every number. A shell the ground configuration does not occupy is <b>virtual</b> (marked ° in the channels): it keeps this frozen field\'s eigenvalue, and atoms.js refuses to invent a radial for it — such a label carries an energy and draws nothing. Momentum space is not built for this operator: the selector forces position space, as it does for the box and quarkonium.';

  /* ── the model, once per element (≈ 0.3 s for the neutral, the ion and the α = 1 comparison, then cached) ── */
  function compute() {
    Z = api.Z();
    const A = atom(Z), S = solveAtom(Z), cfg = configOf(Z);
    const shells = S.orbitals.map((o) => ({ n: o.n, l: o.l, occ: o.occ, eps: o.eps, nodes: o.nodes })).sort((a, b) => a.eps - b.eps);
    const outer = cfg[cfg.length - 1];                                  // atoms.js's own default for the Δ-SCF
    const val = [...cfg].reverse().find((c) => c.l <= 1) || outer;      // the valence s or p, which is what δ_l is for
    const top = shells.slice(-2);
    cache = { A, S, shells, outer, val, top, half: atomDomainFor(Z),
      ip: ionisation(Z, { n: outer.n, l: outer.l }), koop: -atomEnergyOf(Z, outer.n, outer.l) * HARTREE_EV,
      d23: quantumDefect(Z, val.n, val.l), d1: quantumDefect(Z, val.n, val.l, { alpha: 1 }),
      gap: top.length === 2 ? Math.abs(top[1].eps - top[0].eps) : Infinity };
    dirty = false;
  }
  const ensure = () => { if (dirty || api.Z() !== Z) { compute(); write(); } return cache; };
  const invalidate = () => { dirty = true; };

  function write() {
    const C = cache, A = C.A, S = C.S;
    roEl.set(`${A.symbol} · ${A.name} · Z = ${A.Z}`); roEl.setSub(A.term + (Z === 24 || Z === 29 ? '  · an Aufbau exception' : ''));
    roModel.set(S.model); roModel.setSub(`central field · one potential for every shell · ${api.active() ? 'IN FORCE on the register' : 'not the operator in force'}`);
    roE.set(S.E.toFixed(5) + ' Eh'); roE.setSub(`${(S.E * HARTREE_EV).toFixed(2)} eV · Slater\'s functional with the α-fraction restored · ${S.electrons.toFixed(4)} electrons on the mesh`);
    roIP.set(C.ip.toFixed(3) + ' eV', 'ok');
    roIP.setSub(`Δ-SCF of the ${C.outer.n}${SPD[C.outer.l]} shell: E(ion) − E(neutral), the same functional both sides`);
    roKo.set('−ε = ' + C.koop.toFixed(3) + ' eV', 'warn');
    roKo.setSub(`the ${C.outer.n}${SPD[C.outer.l]} eigenvalue negated — an Xα eigenvalue is NOT an ionisation potential`);
    roQD.set(Number.isFinite(C.d23) ? `δ_${SPD[C.val.l]} = ${C.d23.toFixed(4)}` : '—');
    roQD.setSub(`${C.val.n}${SPD[C.val.l]} at α = 2/3 · at α = 1: ${C.d1.toFixed(4)}${Z === 11 ? ' · from spectra: 1.3730' : ''} · δ = n − 1/√(−2ε)`);
    roScf.set(`${S.iterations} iterations · ‖ΔV·r‖ ${S.residual.toExponential(1)}`, S.residual < 1e-7 ? 'ok' : 'warn');
    roScf.setSub(`two meshes, Richardson in dx² · half-width ${C.half.toFixed(2)} a₀ · ${C.shells.length} occupied shells`);
    const near = C.gap < 0.1 && C.top.length === 2;
    alpha.hidden = !near;
    if (near) {
      const a = C.top[1], b = C.top[0];                                  // a is the least bound of the two
      alpha.innerHTML = `<b>THE ORDER OF ${b.n}${SPD[b.l]} AND ${a.n}${SPD[a.l]} IS α-DEPENDENT.</b> They differ by ${C.gap.toFixed(4)} Eh (${(C.gap * HARTREE_EV).toFixed(3)} eV) in this model — closer than the exchange approximation itself is trustworthy — so the lab reports both eigenvalues (${b.n}${SPD[b.l]} ${b.eps.toFixed(5)}, ${a.n}${SPD[a.l]} ${a.eps.toFixed(5)} Eh at α = 2/3) and <b>asserts no order</b>.${Z === 21 ? ' For Sc the two cross at α* = 0.839: 4s lies below 3d at α = 2/3 and above it at α = 1.' : ''}`;
    }
  }

  /* ── the shell ladder: one row per occupied shell, deepest at the top; the bar is log₁₀|ε| ── */
  function paintLadder() {
    const W = lad.clientWidth, H = lad.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (W < 32 || H < 32 || !cache) return;
    if (lad.width !== Math.round(W * dpr) || lad.height !== Math.round(H * dpr)) { lad.width = Math.round(W * dpr); lad.height = Math.round(H * dpr); }
    const g = lad.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const A = readRGB(g, '--acc', '#78e1f0'), B = readRGB(g, '--acc2', '#d97ce8'), ink = readRGB(g, '--fg-soft', '#e0e0e0'), dim = readRGB(g, '--dim', '#b8b8b8');
    const sh = cache.shells, n = sh.length;                               // ascending in ε: the least bound is drawn first, at the top
    g.font = '9px ui-monospace, monospace'; g.textBaseline = 'middle';
    /* the columns are measured, not guessed: this card is ~256 px wide and the ε of a Kr 1s is nine characters */
    const left = 6, occX = left + 30, evX = W - 4;
    const wEh = Math.ceil(Math.max(...sh.map((s) => g.measureText(s.eps.toFixed(5)).width), g.measureText('ε hartree').width));
    const wEv = Math.ceil(Math.max(...sh.map((s) => g.measureText((s.eps * HARTREE_EV).toFixed(1)).width), 14));
    const ehX = evX - wEv - 8, barX = occX + 6, barW = Math.max(16, ehX - wEh - 6 - barX);
    const head = 8, bot = H - 12, rowH = Math.min(19, (bot - head - 4) / Math.max(1, n)), y0 = head + 4 + ((bot - head - 4) - rowH * n) / 2;
    /* the bar's law: log₁₀|ε| between the shallowest and the deepest shell of THIS atom */
    const lg = sh.map((s) => Math.log10(Math.max(1e-6, Math.abs(s.eps))));
    const lo = Math.min(...lg), hi = Math.max(...lg), span = Math.max(1e-9, hi - lo);
    g.fillStyle = rgba(dim, 0.75); g.textAlign = 'left';
    g.fillText('SHELL', left, head); g.textAlign = 'right'; g.fillText('ε hartree', ehX, head); g.fillText('eV', evX, head);
    const bars = [];
    for (let i = 0; i < n; i++) {
      const j = n - 1 - i, s = sh[j], y = y0 + rowH * (i + 0.5), c = mix(A, B, n < 2 ? 0 : j / (n - 1));
      const len = 5 + (barW - 5) * (lg[j] - lo) / span;
      bars.push({ kind: 'bar', key: `${s.n}${SPD[s.l]}`, x: barX, y: y - 3, w: len, h: 6, colour: rgba(c, 1),
        info: `${s.n}${SPD[s.l]}  ·  ${s.occ} electron${s.occ === 1 ? '' : 's'}  ·  ε = ${s.eps.toFixed(5)} Eh = ${(s.eps * HARTREE_EV).toFixed(1)} eV` });
      g.fillStyle = rgba(c, 0.22); g.fillRect(barX, y - 3, len, 6);
      g.fillStyle = rgba(c, 0.95); g.fillRect(barX, y - 3, 2, 6);
      g.textAlign = 'left'; g.fillStyle = rgba(c, 1); g.fillText(`${s.n}${SPD[s.l]}`, left, y);
      g.textAlign = 'right'; g.fillStyle = rgba(ink, 0.85); g.fillText(String(s.occ), occX, y);
      g.fillStyle = rgba(ink, 0.95); g.fillText(s.eps.toFixed(5), ehX, y);
      g.fillStyle = rgba(dim, 0.9); g.fillText((s.eps * HARTREE_EV).toFixed(1), evX, y);
    }
    g.font = '8px ui-monospace, monospace'; g.textAlign = 'left'; g.fillStyle = rgba(dim, 0.8); g.textBaseline = 'alphabetic';
    const foot = `${cache.A.symbol} · bar ∝ log₁₀|ε| · ε is NOT an ionisation energy`;
    g.fillText(g.measureText(foot).width < W - left - 4 ? foot : `${cache.A.symbol} · bar ∝ log₁₀|ε| · ε is not an IP`, left, H - 3);
    ladHover.set(bars, { x0: barX, y0: head, x1: barX + barW, y1: bot });
  }

  /* ── the radials: u_nl(r) = r·R_nl(r) of the occupied shells, on a √r axis over the field's own half-width ── */
  function paintRadial() {
    const W = rad.clientWidth, H = rad.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (W < 32 || H < 32 || !cache) return;
    if (rad.width !== Math.round(W * dpr) || rad.height !== Math.round(H * dpr)) { rad.width = Math.round(W * dpr); rad.height = Math.round(H * dpr); }
    const g = rad.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const A = readRGB(g, '--acc', '#78e1f0'), B = readRGB(g, '--acc2', '#d97ce8'), dim = readRGB(g, '--dim', '#b8b8b8');
    const sh = cache.shells, n = sh.length, R = cache.half, N = 200;
    const left = 20, right = W - 8, top = 10, bot = H - 22, mid = (top + bot) / 2;   // two text rows below the frame: the ticks, then the caption
    const X = (i) => left + (right - left) * i / N;                       // i/N = √(r/R): the stated display choice
    const rOf = (i) => R * (i / N) * (i / N);
    const curves = sh.map((s) => { const u = new Float64Array(N + 1); for (let i = 0; i <= N; i++) { const r = rOf(i); u[i] = r * atomRadial(Z, s.n, s.l, r); } return u; });
    let umax = 1e-12; for (const u of curves) for (const v of u) umax = Math.max(umax, Math.abs(v));
    const Y = (v) => mid - (bot - top) / 2 * 0.92 * v / umax;
    g.strokeStyle = rgba(dim, 0.25); g.lineWidth = 1;
    g.beginPath(); g.moveTo(left, Y(0)); g.lineTo(right, Y(0)); g.stroke();
    g.font = '8px ui-monospace, monospace'; g.textBaseline = 'middle'; g.fillStyle = rgba(dim, 0.8);
    /* the ticks are thin low-alpha lines; only the axis's TWO END values are written, under the frame */
    for (const f of [0.0625, 0.25, 1]) {                                   // r/R = 1/16, 1/4, 1 → x = 1/4, 1/2, 1
      const x = left + (right - left) * Math.sqrt(f);
      g.strokeStyle = rgba(dim, 0.14); g.beginPath(); g.moveTo(x, top); g.lineTo(x, bot); g.stroke();
    }
    const tickBox = { x0: left - 8, y0: bot, x1: right, y1: H };     // inside the frame's own span: never on the border
    fitText(g, '0', left, bot + 7, tickBox, 'left');
    fitText(g, R.toFixed(2), right, bot + 7, tickBox, 'right');
    const hovers = [];
    for (let k = 0; k < n; k++) {
      const j = n - 1 - k, s = sh[j], u = curves[j], c = mix(A, B, n < 2 ? 0 : j / (n - 1));
      const pts = [];
      g.strokeStyle = rgba(c, 0.95); g.lineWidth = 1.2; g.beginPath();
      for (let i = 0; i <= N; i++) { const x = X(i), y = Y(u[i]); pts.push(x, y); if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); }
      g.stroke();
      /* WAVE 46 — each curve used to write its own name at its peak, in its own colour, INSIDE the plot: eight
         shells in 120 px meant a nudge ladder and a drop rule, and the names still landed on other curves.
         The curve is the object: its name, its peak and its eigenvalue are one hover away. */
      let pk = 0; for (let i = 1; i <= N; i++) if (Math.abs(u[i]) > Math.abs(u[pk])) pk = i;
      hovers.push({ kind: 'curve', key: `${s.n}${SPD[s.l]}`, points: pts, lw: 1.2, colour: rgba(c, 1),
        info: `${s.n}${SPD[s.l]}  ·  u = r·R_nl  ·  peak |u| = ${Math.abs(u[pk]).toFixed(4)} at r = ${rOf(pk).toFixed(3)} a₀  ·  ε = ${s.eps.toFixed(5)} Eh` });
    }
    g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = rgba(dim, 0.8);
    fitText(g, `u = r·R_nl  ·  √r axis, 0 → ${R.toFixed(2)} a₀`, left, H - 3, { x0: left, y0: 0, x1: W - 4, y1: H }, 'left', true);
    radHover.set(hovers, { x0: left, y0: top, x1: right, y1: bot });
  }

  /** the copyable table the notebook gets, under the readouts layout.digest() already collects */
  function digest() {
    const C = ensure();
    const lines = [`element\t${C.A.symbol}  ${C.A.name}  Z = ${C.A.Z}\t${C.A.term}`,
      `model\t${C.S.model}\tEXCHANGE_MODEL = ${EXCHANGE_MODEL}`,
      `E total\t${C.S.E.toFixed(6)} Eh\t${(C.S.E * HARTREE_EV).toFixed(3)} eV`,
      `ionisation (Δ-SCF, ${C.outer.n}${SPD[C.outer.l]})\t${C.ip.toFixed(4)} eV\tKoopmans −ε = ${C.koop.toFixed(4)} eV (NOT the IP)`,
      `quantum defect ${C.val.n}${SPD[C.val.l]}\tδ = ${C.d23.toFixed(5)} at α = 2/3\tδ = ${C.d1.toFixed(5)} at α = 1`,
      '', 'n\tl\tshell\tocc\tnodes\tε (hartree)\tε (eV)'];
    for (const s of C.shells) lines.push(`${s.n}\t${s.l}\t${s.n}${SPD[s.l]}\t${s.occ}\t${s.nodes}\t${s.eps.toFixed(6)}\t${(s.eps * HARTREE_EV).toFixed(4)}`);
    if (!alpha.hidden) lines.push('', 'α-DEPENDENT ORDER\t' + alpha.textContent);
    return lines.join('\n');
  }

  /* the card is static per element: repaint only when the element, the operator in force, the accent, the theme or
     the width actually changes (the inline --acc is read off body.style, which costs no style recalculation) */
  let lastKey = '';
  function update() {
    if (lad.clientWidth < 32) return;                                     // closed or folded: no size, no work
    const key = [api.Z(), api.active() ? 1 : 0, document.body.style.getPropertyValue('--acc'),
      document.body.style.getPropertyValue('--acc2'), document.body.dataset.theme || '', lad.clientWidth, rad.clientHeight].join('|');
    if (!dirty && key === lastKey) return;
    lastKey = key;
    if (dirty || api.Z() !== Z) compute();
    write(); paintLadder(); paintRadial();
  }
  window.addEventListener('resize', () => { lastKey = ''; if (cache) { paintLadder(); paintRadial(); } });
  return { update, invalidate, digest, ensure, get cache() { return cache; }, get Z() { return Z; } };
}
