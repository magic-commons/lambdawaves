/* dynamicsview.js — the DYNAMICS window: the Lagrangian, the action, the dipole, and the particle controls.
 *
 * STATUS: EXACT ANALYTIC for L, T, V, S, the action–angle chart, ⟨L_z⟩, ⟨L²⟩ and the rotor entropy; the dipole's
 * radial factor is NUMERICAL (Simpson, cached, agreeing with the hand-typed ⟨1s|z|2p_z⟩ = 128√2/243 to 1e-7).
 * Nothing here mutates the register: the particle controls seed and clear a cloud, which is an observer product.
 */
import { lagrangian, action, actionAngle, angularMoments, rotorEntropy, dipoleZ, dipoleLines, radialObservables } from './dynamics.js';
import { shellMatrix, schmidt } from './frontier.js';
import { BASIS } from './hydrogen.js';
import { el, knob, sw, trig, readout, group } from './kit.js';

export function createDynamics(host, api) {
  const ui = {};
  const r1 = el('div', 'row tight', host);
  ui.L = readout({ label: 'L = T − V', value: '—', sub: 'the Lagrangian, exact' });
  ui.T = readout({ label: 'T = ½Σ E p²', value: '—' });
  ui.V = readout({ label: 'V = ½Σ E q²', value: '—' });
  ui.S = readout({ label: 'S = ∫₀ᵗ L dt′', value: '—', sub: 'closed form' });
  for (const k of ['L', 'T', 'V', 'S']) r1.appendChild(ui[k].root);
  const plot = el('div', 'dyn-c', host); const pcv = el('canvas', '', plot);
  el('div', 'note', host).innerHTML = 'The Schrödinger field Lagrangian restricted to this basis IS the shadow\'s L = Σp<sub>a</sub>q̇<sub>a</sub> − H<sub>C</sub>: uncoupled oscillators of mass 1/E<sub>a</sub> and stiffness E<sub>a</sub> — <b>both negative</b> for a bound state, ratio ω² = E<sub>a</sub>². Euler–Lagrange gives q̈ = −E²q, which is the Schrödinger equation. Over a period ⟨T⟩ = ⟨V⟩ = ½⟨H⟩ and ⟨L⟩ = 0 (the virial theorem), so <b>S(t) is bounded and periodic</b>.';

  const gAA = group(host, 'ACTION–ANGLE  ·  J_a = (1/2π)∮p dq = |c_a|² = the POPULATION  ·  θ_a = arg c_a');
  const aaRows = el('div', 'dyn-rows', gAA);
  el('div', 'note', gAA).innerHTML = 'So the SPECTRUM rail <b>is</b> the action–angle chart of the SHADOW\'s phase space, and every population being constant is Liouville\'s theorem for this system.';

  const gM = group(host, 'EXACT MOMENTS');
  const r2 = el('div', 'row tight', gM);
  ui.Lz = readout({ label: '⟨L_z⟩  ħ', value: '—' }); ui.L2 = readout({ label: '⟨L²⟩  ħ²', value: '—', sub: 'l(l+1)' });
  ui.ent = readout({ label: 'ROTOR ENTANGLEMENT', value: '—', sub: '−Σλ² ln λ², per shell' });
  ui.rr = readout({ label: '⟨r⟩  a₀', value: '—', sub: '' });
  ui.vir = readout({ label: 'ATOM VIRIAL  2⟨T⟩/(−⟨V⟩)', value: '—', sub: '⟨T⟩ = ⟨H⟩ + ⟨1/r⟩' });
  for (const k of ['Lz', 'L2', 'ent', 'rr', 'vir']) r2.appendChild(ui[k].root);
  el('div', 'note', gM).innerHTML = 'Two virial theorems hold at once and say different things: the <b>shadow\'s</b> harmonic one (⟨T⟩ = ⟨V⟩ = ½⟨H⟩ in the mode coordinates, above) and the <b>atom\'s</b> Coulomb one (2⟨T⟩ = −⟨V⟩, i.e. ⟨T⟩ = −E, here). ⟨r⟩ and ⟨1/r⟩ are Simpson integrals; for an eigenstate they are (3n² − l(l+1))/2 and 1/n².';

  const gD = group(host, 'DIPOLE  ·  ⟨z⟩ = Σ c*_a c_b ⟨a|z|b⟩  ·  z couples l → l ± 1 at fixed m');
  const r3 = el('div', 'row tight', gD);
  ui.dz = readout({ label: '⟨z⟩  a₀', value: '—', sub: '' }); ui.lines = readout({ label: 'EMISSION LINES', value: '—', cls: 'two', sub: '' });
  for (const k of ['dz', 'lines']) r3.appendChild(ui[k].root);
  el('div', 'note', gD).innerHTML = 'A state built from ONE l has no dipole however it is prepared. The power quoted is what a classical dipole of this amplitude <i>would</i> radiate at that frequency (Larmor, ⅔ω⁴d²/2 a.u.); <b>this lab has no radiation reaction</b> — the state never decays.';

  const gP = group(host, 'PARTICLES  ·  de Broglie–Bohm trajectories of the same ψ  (an observer product: ψ is untouched)');
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
  el('div', 'note', gP).innerHTML = 'Seeded by rejection sampling from |ψ|², which is the equilibrium distribution: a cloud that starts as |ψ|² stays |ψ|² (equivariance), so the cloud <b>is</b> the density, drawn one trajectory at a time. Trajectories never cross a nodal surface, and they are singular exactly on VORTEX\'s lines. The speed is clamped for drawing near a node.';

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
      ui.lines.set(lines.length ? `${lines.length} · ω = ${lines[0].omega.toFixed(4)}` : 'none (single l)', lines.length ? '' : 'warn');
      ui.lines.setSub(lines.length ? lines.slice(0, 2).map((l) => `${l.label}  T = ${l.period.toFixed(2)} a.u.  d = ${l.amplitude.toFixed(3)} a₀  P = ${l.power.toExponential(2)}`).join(' · ') : 'z couples l → l ± 1: nothing here does');
      rebuildAA(reg, c, ids);
    }
    hist.push([t, lg.L, S]); if (hist.length > 600) hist.shift();
    const st = api.particles.state;
    ui.pstat.set(api.particles.on ? `${st.alive} / ${st.count} alive` : 'off');
    ui.pstat.setSub(api.particles.on ? `${st.stalled} left the domain or stalled at a node · max |v| = ${st.maxSpeed.toFixed(2)} a.u.` : 'seeded from |ψ|² at the current logical time');
    paint(t, playing);
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
    g.strokeStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.moveTo(26, Y(0)); g.lineTo(W - 8, Y(0)); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.textAlign = 'right'; g.fillText('0', 24, Y(0));
    for (const [k, col] of [[1, 'rgba(255,226,170,0.95)'], [2, 'rgba(120,225,240,0.95)']]) {
      g.strokeStyle = col; g.lineWidth = 1.2; g.beginPath();
      hist.forEach(([u, ...v], i) => { const x = X(u), y = Y(v[k - 1]); if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); });
      g.stroke();
    }
    g.textAlign = 'left'; g.fillStyle = 'rgba(255,226,170,0.95)'; g.fillText('L(t)', 30, 8);
    g.fillStyle = 'rgba(120,225,240,0.95)'; g.fillText('S(t)', 56, 8);
  }
  window.addEventListener('resize', () => paint(0));
  return { update, clearHistory() { hist = []; }, get ui() { return ui; } };
}
