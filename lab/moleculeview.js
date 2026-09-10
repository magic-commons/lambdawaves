/* moleculeview.js — the MOLECULE window: H₂⁺ in the 1s LCAO basis.  ON hands the FIELD to the molecule.
 *
 * Labels are the point: the integrals are EXACT, the energies a VARIATIONAL upper bound (the exact
 * Bates–Ledsham–Stewart points are drawn beside them), the evolution EXACT within the two-orbital space.
 * The force on a proton left this file in wave 41: moview.js prints it for whichever basis is chosen, and at the
 * 1s LCAO the general machinery reproduces electrostatics.js's closed forms to 1e-9 (tests/mo.test.mjs G2).
 */
import { energies, EXACT_REFERENCE, EXACT_RE, EXACT_DE_EV, equilibrium, moState, moAt, aoAmplitudes, populationA, tunnelPeriod, fieldModes, domainFor, EV } from './molecule.js';
import { el, seg, sw, knob, readout, nRGB, vividInk, graphHover, fitText } from './kit.js';

/* THE CANVAS HAS NO THEME (wave 44).  These rules were written rgba(255,255,255,…) — right on the dark theme and
   WHITE ON WHITE on the light one, where the dissociation line, its "H + H⁺" label, the exact Bates dots, the R
   marker and the caption were all ghosts.  --dim is rated ≥ 4.5:1 on the card in both themes. */
function readRGB(g, name, fallback) {
  const v = getComputedStyle(document.body).getPropertyValue(name).trim();
  const keep = g.fillStyle;
  g.fillStyle = fallback; if (v) { try { g.fillStyle = v; } catch (e) { /* an unparseable value leaves the fallback */ } }
  const t = String(g.fillStyle); g.fillStyle = keep;
  let m = /^#([0-9a-f]{6})$/i.exec(t);
  if (m) { const k = parseInt(m[1], 16); return [k >> 16 & 255, k >> 8 & 255, k & 255]; }
  m = /^#([0-9a-f]{3})$/i.exec(t);
  if (m) return [0, 1, 2].map((i) => parseInt(m[1][i] + m[1][i], 16));
  m = /rgba?\(([^)]+)\)/i.exec(t);
  if (m) { const p = m[1].split(',').map((x) => parseFloat(x)); return [p[0] | 0, p[1] | 0, p[2] | 0]; }
  return [255, 255, 255];
}


export function createMolecule(host, api) {
  let R = 2, kind = 'sigma_g', on = false, state = moState(kind, R);
  const r0 = el('div', 'row tight', host);
  const onSw = sw({ label: 'MOLECULE ON', value: false, title: 'Show H₂⁺ in the field', onChange: (v) => { on = v; api.setOn(v); } });
  r0.appendChild(onSw.root);
  r0.appendChild(knob({ label: 'R  (a₀)', min: 0.6, max: 8, value: 2, fmt: (v) => v.toFixed(2), onInput: (v) => { R = v; state = moState(kind, R); refresh(); api.repaint(true); if (api.onR) api.onR(v, false); } }).root);
  const stSeg = seg({ label: 'STATE', value: 'sigma_g', options: [
    { id: 'sigma_g', label: 'σg', title: 'bonding: (a + b)/√(2(1+S))' }, { id: 'sigma_u', label: 'σu', title: 'antibonding: (a − b)/√(2(1−S)), a nodal plane at z = 0' },
    { id: 'on_A', label: 'ON A', title: 'Start the electron on proton A' }],
    onChange: (v) => { kind = v; state = moState(kind, R); refresh(); api.repaint(true); } });
  r0.appendChild(stSeg.root);
  const cv = el('canvas', 'mol-c', host);
  const g = cv.getContext('2d');
  /* WAVE 46 — the curve names came out of the caption and onto the curves themselves: "E_g (bonding) ·
     E_u (antibonding)" cost two of the four caption lines and pushed the plot's floor up.  The law stays. */
  let hovers = [], rect = null;
  const hover = graphHover(cv, { repaint: () => paint(), plot: () => rect });
  const rr = el('div', 'row tight', host);
  const roE = readout({ label: 'E_g · E_u  (hartree)', value: '—', sub: '' });
  const roD = readout({ label: 'D_e  LCAO · exact', value: '—', sub: '' });
  const roT = readout({ label: 'TUNNEL  T = 2π/(E_u−E_g)', value: '—', sub: '' });
  const roP = readout({ label: 'ELECTRON ON A', value: '—', sub: 'Mulliken population, live' });
  /* the force on a proton is the GENERAL BASIS block's line now (wave 41, moview.js): F_elec, Z_AZ_B/R², F_HF,
     the Pulay term and its bound, for whichever basis is chosen — at the 1s LCAO it is this window's own number */
  rr.appendChild(roE.root); rr.appendChild(roD.root); rr.appendChild(roT.root); rr.appendChild(roP.root);
  el('div', 'note', host).innerHTML = '<b>Model.</b> H₂⁺ uses bonding and antibonding combinations of two fixed 1s orbitals. The curves are upper bounds; dots show reference energies. ON A prepares tunnelling between the protons with period 2π/(E<sub>u</sub>−E<sub>g</sub>). Position space only.';

  function refresh() {
    const e = energies(R), eq = equilibrium(), T = tunnelPeriod(R);
    roE.set(`${e.Eg.toFixed(4)} · ${e.Eu.toFixed(4)}`, e.Eg < -0.5 ? 'ok' : 'warn');
    const ref = EXACT_REFERENCE.find((p) => Math.abs(p.R - R) < 1e-9);
    roE.setSub(`S ${e.S.toFixed(4)}${ref ? ` · reference ${ref.E.toFixed(5)} · gap ${(e.Eg - ref.E).toFixed(4)}` : ''}`);
    roD.set(`${eq.DeEV.toFixed(2)} · ${EXACT_DE_EV.toFixed(2)} eV`, '');
    roD.setSub(`R_e ${eq.Re.toFixed(2)} · reference ${EXACT_RE.toFixed(2)} a₀ · gap ${(EXACT_DE_EV - eq.DeEV).toFixed(2)} eV`);
    roT.set(`${T.toFixed(2)} a.u.`, 'ok'); roT.setSub(`E_u − E_g = ${(e.Eu - e.Eg).toFixed(4)} hartree at R = ${R.toFixed(2)}`);
    paint();
  }
  function paint() {
    const W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (W < 32 || H < 32) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const Rmin = 0.6, Rmax = 8, Emin = -0.65, Emax = 0.1, L = 40, Rt = W - 10, Tp = 12;
    /* the caption is 380 px of type on a 264 px canvas and a canvas caption does not ellipsis (wave 41's lesson (ii),
       never applied here): it is measured, wrapped at its spaces, and it SETS the plot's floor (lesson (iii)). */
    const CAP = 'dots = reference · lines = LCAO basis';
    g.font = '8px ui-monospace, monospace';
    const capLines = []; { let ln = '';
      for (const word of CAP.split(' ')) { const nx = ln ? ln + ' ' + word : word; if (ln && g.measureText(nx).width > Rt - L) { capLines.push(ln); ln = word; } else ln = nx; }
      if (ln) capLines.push(ln); }
    const Bt = H - 8 - capLines.length * 9;
    const x = (r) => L + (r - Rmin) / (Rmax - Rmin) * (Rt - L), y = (E) => Bt - (E - Emin) / (Emax - Emin) * (Bt - Tp);
    g.font = '9px ui-monospace, monospace'; g.textBaseline = 'middle';
    const D = readRGB(g, '--dim', '#b8b8b8'), ink = (al) => `rgba(${D[0]},${D[1]},${D[2]},${al})`;
    g.strokeStyle = ink(0.35); g.setLineDash([2, 3]); g.beginPath(); g.moveTo(L, y(-0.5)); g.lineTo(Rt, y(-0.5)); g.stroke(); g.setLineDash([]);
    g.fillStyle = ink(0.8); g.textAlign = 'right'; g.fillText('H + H⁺', L - 3, y(-0.5));      // the gutter's one end value
    rect = { x0: L, y0: Tp, x1: Rt, y1: Bt }; hovers = [];
    const e = energies(R);
    const CU = vividInk([255, 190, 90]), CG = nRGB(2);
    for (const [key, rgb, name] of [['Eg', CG, 'E_g  bonding'], ['Eu', CU, 'E_u  antibonding']]) {
      const col = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.95)`, pts = [];
      g.strokeStyle = col; g.lineWidth = 1.6; g.beginPath();
      for (let i = 0; i <= 200; i++) { const r = Rmin + (Rmax - Rmin) * i / 200, E = Math.min(Emax, energies(r)[key]); pts.push(x(r), y(E)); if (i === 0) g.moveTo(x(r), y(E)); else g.lineTo(x(r), y(E)); }
      g.stroke();
      hovers.push({ kind: 'curve', key, points: pts, lw: 1.6, colour: col,
        info: `${name}  ·  LCAO, a bound from above  ·  at R = ${R.toFixed(2)} a₀  E = ${e[key].toFixed(4)} Eh` });
    }
    for (const p of EXACT_REFERENCE) { g.fillStyle = ink(0.95); g.beginPath(); g.arc(x(p.R), y(p.E), 3, 0, 2 * Math.PI); g.fill();
      hovers.push({ kind: 'dot', key: 'x' + p.R, x: x(p.R), y: y(p.E), r: 3, colour: ink(1),
        info: `reference · R = ${p.R} a₀ · E = ${p.E.toFixed(4)} Eh` }); }
    g.strokeStyle = ink(0.6); g.beginPath(); g.moveTo(x(R), Tp); g.lineTo(x(R), Bt); g.stroke();
    g.fillStyle = `rgb(${CG.join(',')})`; g.beginPath(); g.arc(x(R), y(Math.min(Emax, e.Eg)), 3.5, 0, 2 * Math.PI); g.fill();
    g.fillStyle = `rgb(${CU.join(',')})`; g.beginPath(); g.arc(x(R), y(Math.min(Emax, e.Eu)), 3.5, 0, 2 * Math.PI); g.fill();
    hovers.push({ kind: 'line', key: 'Rline', points: [x(R), Tp, x(R), Bt], lw: 1, colour: ink(1),
      info: `R = ${R.toFixed(2)} a₀  ·  E_g = ${e.Eg.toFixed(4)} Eh  ·  E_u = ${e.Eu.toFixed(4)} Eh  ·  splitting ${(e.Eu - e.Eg).toFixed(4)} Eh` });
    g.font = '8px ui-monospace, monospace'; g.fillStyle = ink(0.8); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    capLines.forEach((t, i) => g.fillText(t, L, H - 4 - (capLines.length - 1 - i) * 9));       // the law, under the plot
    g.font = '9px ui-monospace, monospace'; g.textBaseline = 'middle'; g.fillStyle = ink(0.8);
    fitText(g, 'R a₀', Rt, 6, { x0: L, y0: 0, x1: Rt, y1: Tp - 2 }, 'right');                 // the x axis name, ABOVE the frame
    hover.set(hovers, rect);
  }
  function update(t) {
    if (!on) return;
    const p = populationA(aoAmplitudes(moAt(state, R, t), R), R);
    roP.set(p.toFixed(4), p > 0.5 ? 'ok' : 'warn');
  }
  window.addEventListener('resize', () => paint());
  refresh();
  return { update, refresh, get on() { return on; }, setOn(v) { on = !!v; if (onSw.set) onSw.set(on); api.setOn(on); }, get R() { return R; }, setR(v) { R = v; state = moState(kind, R); refresh(); if (api.onR) api.onR(v, true); }, get kind() { return kind; }, setKind(k) { kind = k; stSeg.set(k); state = moState(kind, R); refresh(); },
    fieldModes(t) { return fieldModes(state, R, t); }, get half() { return domainFor(R); } };
}
