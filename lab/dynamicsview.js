/* dynamicsview.js — the DYNAMICS window: the Lagrangian, the action, the dipole, and the particle controls.
 *
 * STATUS: EXACT ANALYTIC for L, T, V, S, the action–angle chart, ⟨L_z⟩, ⟨L²⟩ and the rotor entropy; the dipole's
 * radial factor is NUMERICAL (Simpson, cached, agreeing with the hand-typed ⟨1s|z|2p_z⟩ = 128√2/243 to 1e-7).
 * Nothing here mutates the register: the particle controls seed and clear a cloud, which is an observer product.
 */
import { lagrangian, action, actionAngle, angularMoments, rotorEntropy, dipoleZ, dipoleLines, radialObservables } from './dynamics.js';
import { shellMatrix, schmidt } from './frontier.js';
import { BASIS } from './hydrogen.js';
import { el, knob, sw, trig, readout, group, nRGB, themeInk, graphHover } from './kit.js';

export function createDynamics(host, api) {
  const ui = {};
  const r1 = el('div', 'row tight', host);
  ui.L = readout({ label: 'L = T − V', value: '—', sub: 'the Lagrangian, exact' });
  ui.T = readout({ label: 'T = ½Σ E p²', value: '—' });
  ui.V = readout({ label: 'V = ½Σ E q²', value: '—' });
  ui.S = readout({ label: 'S = ∫₀ᵗ L dt′', value: '—', sub: 'closed form' });
  for (const k of ['L', 'T', 'V', 'S']) r1.appendChild(ui[k].root);
  const plot = el('div', 'dyn-c', host); const pcv = el('canvas', '', plot);
  /* WAVE 46 — the two curves used to name themselves in their own colour at the top-left of the plot
     ("L(t)" and "S(t)", right where L crosses on a fresh register).  The curves ARE the objects. */
  let hovers = [], rect = null, lastT = 0;
  const hover = graphHover(pcv, { repaint: () => paint(lastT), plot: () => rect });
  el('div', 'note', host).innerHTML = '<b>Mode dynamics.</b> In this basis, each coefficient maps to a harmonic oscillator in the shadow view. The action stays bounded and repeats with the state.';

  const gAA = group(host, 'ACTION–ANGLE');
  const aaRows = el('div', 'dyn-rows', gAA);
  el('div', 'note', gAA).innerHTML = '<b>Action and angle.</b> Spectrum populations are the conserved actions; their phases are the angles.';

  const gM = group(host, 'MOMENTS');
  const r2 = el('div', 'row tight', gM);
  ui.Lz = readout({ label: '⟨L_z⟩  ħ', value: '—' }); ui.L2 = readout({ label: '⟨L²⟩  ħ²', value: '—', sub: 'l(l+1)' });
  ui.ent = readout({ label: 'ROTOR ENTANGLEMENT', value: '—', sub: '−Σλ² ln λ², per shell' });
  ui.rr = readout({ label: '⟨r⟩  a₀', value: '—', sub: '' });
  ui.vir = readout({ label: 'ATOM VIRIAL  2⟨T⟩/(−⟨V⟩)', value: '—', sub: '⟨T⟩ = ⟨H⟩ + ⟨1/r⟩' });
  for (const k of ['Lz', 'L2', 'ent', 'rr', 'vir']) r2.appendChild(ui[k].root);
  el('div', 'note', gM).innerHTML = '<b>Virial readings.</b> These are Coulomb-space averages. The shadow window uses a separate oscillator virial relation.';

  const gD = group(host, 'DIPOLE');
  const r3 = el('div', 'row tight', gD);
  ui.dz = readout({ label: '⟨z⟩  a₀', value: '—', sub: '' }); ui.lines = readout({ label: 'EMISSION LINES', value: '—', cls: 'two', sub: '' });
  for (const k of ['dz', 'lines']) r3.appendChild(ui[k].root);
  el('div', 'note', gD).innerHTML = '<b>Dipole.</b> A state with one l value has no electric dipole. Radiated power is a classical estimate; it does not drain or alter the state.';

  const gP = group(host, 'PARTICLES');
  const r4 = el('div', 'row tight', gP);
  ui.on = sw({ label: 'PARTICLES', value: false, onChange: (v) => { api.particles.setOn(v); if (v) api.seedParticles(Math.round(ui.n.get())); api.repaint(); } });
  r4.appendChild(ui.on.root);
  ui.n = knob({ label: 'COUNT', min: 20, max: 600, value: 160, log: true, step: 10, fmt: (v) => v.toFixed(0), onChange: (v) => { if (ui.on.get()) { api.seedParticles(Math.round(v)); api.repaint(); } } });
  r4.appendChild(ui.n.root);
  ui.trail = knob({ label: 'TRAIL', min: 0, max: 120, value: 24, step: 1, fmt: (v) => v.toFixed(0), onInput: (v) => { api.particles.setTrail(Math.round(v)); api.repaint(); } });
  r4.appendChild(ui.trail.root);
  r4.appendChild(trig({ label: 'RESEED', title: 'sample a fresh cloud from |ψ|² at the current time', onFire: () => { if (ui.on.get()) { api.seedParticles(Math.round(ui.n.get())); api.repaint(); } } }).root);
  ui.pstat = readout({ label: 'CLOUD', value: '—', cls: 'two', sub: '' });
  el('div', 'row tight', gP).appendChild(ui.pstat.root);
  el('div', 'note', gP).innerHTML = '<b>Particles.</b> Seeds follow |ψ|² and move with the probability current. Paths stop at the domain edge or near a node; speed is capped for display.';

  for (const [k, r] of Object.entries(ui)) if (r && r.root && r.root.classList.contains('ro')) r.root.dataset.dq = k;
  let hist = [], lastVersion = -1;
  function update(reg, t, playing) {
    const c = reg.at(t), ids = reg.populated();
    const lg = lagrangian(c.re, c.im, ids), S = action(reg.re0, reg.im0, t, ids);
    ui.L.set(lg.L.toFixed(6)); ui.T.set(lg.T.toFixed(6)); ui.V.set(lg.V.toFixed(6)); ui.S.set(S.toFixed(6));
    const am = angularMoments(c.re, c.im);
    ui.Lz.set(am.Lz.toFixed(4)); ui.L2.set(am.L2.toFixed(4));
    const shells = [...new Set(ids.map((a) => BASIS[a].n))].sort();
    const ents = shells.map((n) => [n, rotorEntropy(schmidt(shellMatrix(reg.re0, reg.im0, n)).values)]);
    ui.ent.set(ents.length ? ents.map(([n, e]) => e.toFixed(4)).join(' · ') : '—');
    ui.ent.setSub(ents.length ? 'n = ' + ents.map(([n]) => n).join(' · ') + '   (ln 2 = 0.6931 is maximal for n = 2)' : '');
    const ro = radialObservables(c.re, c.im, ids, reg.energy());
    ui.rr.set(ro.r.toFixed(4)); ui.rr.setSub(`⟨1/r⟩ = ${ro.rinv.toFixed(5)} · ⟨T⟩ = ${ro.T.toFixed(5)}`);
    ui.vir.set(ro.virial.toFixed(5), Math.abs(ro.virial - 1) < 1e-4 ? 'ok' : '');
    const dz = dipoleZ(c.re, c.im, ids).value;
    ui.dz.set(dz.toFixed(6), Math.abs(dz) > 1e-9 ? 'live' : '');
    if (reg.version !== lastVersion) {
      lastVersion = reg.version;
      const lines = dipoleLines(reg.re0, reg.im0, ids);
      ui.lines.set(lines.length ? `${lines.length} · ω = ${lines[0].omega.toFixed(4)}` : 'none: no Δl = ±1 pair with ΔE ≠ 0 (a degenerate pair is a static dipole, not a line)', lines.length ? '' : 'warn');
      ui.lines.setSub(lines.length ? lines.slice(0, 2).map((l) => `${l.label}  T = ${l.period.toFixed(2)} a.u.  d = ${l.amplitude.toFixed(3)} a₀  P = ${l.power.toExponential(2)}`).join(' · ') : 'z couples l → l ± 1: nothing here does');
      rebuildAA(reg, c, ids);
    }
    hist.push([t, lg.L, S]); if (hist.length > 600) hist.shift();
    const st = api.particles.state;
    ui.pstat.set(api.particles.on ? `${st.alive} / ${st.count} alive` : 'off');
    ui.pstat.setSub(api.particles.on ? `${st.stalled} left the domain or stalled at a node · max |v| = ${st.maxSpeed.toFixed(2)} a.u.` : 'seeded from |ψ|² at the current logical time');
    lastT = t; paint(t, playing);
  }
  function rebuildAA(reg, c, ids) {
    aaRows.innerHTML = '';
    for (const x of actionAngle(c.re, c.im, ids)) {
      const row = el('div', 'dyn-row', aaRows);
      el('div', 'sp-name', row, x.label);
      el('div', 'sp-sub', row, `J = ${x.J.toFixed(5)}`);
      el('div', 'sp-sub', row, `θ = ${(x.theta * 180 / Math.PI).toFixed(1)}°`);
      el('div', 'sp-sub', row, `ω = ${x.omega.toFixed(5)}`);
    }
  }
  function paint(t) {
    const W = plot.clientWidth, H = plot.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (W < 32 || H < 32) return;
    if (pcv.width !== W * dpr || pcv.height !== H * dpr) { pcv.width = W * dpr; pcv.height = H * dpr; }
    const g = pcv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    g.font = '8px ui-monospace, monospace'; g.textBaseline = 'middle';
    if (hist.length < 2) return;
    const t0 = hist[0][0], t1 = hist[hist.length - 1][0] || 1;
    let lo = Infinity, hi = -Infinity;
    for (const [, L, S] of hist) { lo = Math.min(lo, L, S); hi = Math.max(hi, L, S); }
    if (!(hi > lo)) { hi = lo + 1e-9; }
    const pad = (hi - lo) * 0.15; lo -= pad; hi += pad;
    const X = (u) => 26 + (u - t0) / Math.max(1e-12, t1 - t0) * (W - 34), Y = (v) => H - 12 - (v - lo) / (hi - lo) * (H - 22);
    const T = themeInk(g);
    rect = { x0: 26, y0: 10, x1: W - 8, y1: H - 12 }; hovers = [];
    g.strokeStyle = T.ink(0.22); g.beginPath(); g.moveTo(26, Y(0)); g.lineTo(W - 8, Y(0)); g.stroke();
    g.fillStyle = T.ink(0.6); g.textAlign = 'right'; g.fillText('0', 24, Y(0));           // the one tick, in the gutter
    for (const [k, name, law] of [[1, 'L(t)', 'the Lagrangian T − V'], [2, 'S(t)', 'the action ∫₀ᵗ L dt′']]) {
      const c = nRGB(k), col = `rgba(${c[0]},${c[1]},${c[2]},0.95)`, pts = [];
      g.strokeStyle = col; g.lineWidth = 1.2; g.beginPath();
      hist.forEach(([u, ...v], i) => { const x = X(u), y = Y(v[k - 1]); pts.push(x, y); if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); });
      g.stroke();
      const now = hist[hist.length - 1][k];
      hovers.push({ kind: 'curve', key: name, points: pts, lw: 1.2, colour: col,
        info: `${name}  ·  ${law}  ·  now ${now.toFixed(6)}  ·  over the window [${lo.toFixed(4)}, ${hi.toFixed(4)}]` });
    }
    hover.set(hovers, rect);
  }
  window.addEventListener('resize', () => paint(0));
  return { update, clearHistory() { hist = []; }, get ui() { return ui; } };
}
