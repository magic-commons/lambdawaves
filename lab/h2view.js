/* h2view.js — the H₂ window: Heitler–London's two curves, the exact dots, and THE COLLISION — two hydrogen atoms
 * thrown at each other, classical nuclei on the variational curve (Born–Oppenheimer, labelled), the electron
 * clouds drawn as the Heitler–London one-electron density (an incoherent sum of σg and σu, since that density is
 * not the square of any single orbital — that is correlation).
 */
import { h2Energies, h2Equilibrium, KNOWN_HL, EXACT_H2, collide, hlDensityWeights, MU_H2, EV } from './h2.js';
import { h2Curves, h2CurveTable, sto3gH2, sto3gHydrogen, weinbaumOptimal } from './h2ci.js';
import { overlapS } from './molecule.js';
import { modeTable } from './hydrogen.js';
import { el, seg, sw, knob, readout, trig, nRGB, vividInk, themeInk, graphHover, fitText } from './mir/kit.js';

const T1S = modeTable(1, 0, 0);
/* WAVE 49 — THE CORRELATED CURVES BESIDE THE VARIATIONAL ONE (lab/h2ci.js).  Heitler–London is a bound from above
   and the card said so, but it had nothing to be above.  STO-3G RHF and FCI are drawn on the same axes: the two
   meet at the bottom of the well (0.02 hartree apart, which IS the correlation energy) and separate without limit
   as the atoms part — the restricted determinant cannot dissociate.  221 points × two energies costs about 25 ms,
   so the curves are computed ONCE and cached: nothing here depends on a knob.  The RHF curve leaves the top of the
   box near R = 4.4; it is BROKEN there rather than drawn along the ceiling, because a clipped curve would read as
   a flat one, and the readout under the plot carries the number at the marker either way. */
const CURVE_N = 221;
let CI_CURVE = null;
export function createH2(host, api) {
  let on = false, active = api.active ? !!api.active() : true, curveTask = null, which = 'triplet', R = 6, handR = 6, ke = 0.02, run = null, kappa = 300, showCI = true;   // κ: nuclear time per logical time unit (a DISPLAY choice)
  const r0 = el('div', 'row tight', host);
  const onSw = sw({ label: 'H₂ ON', value: false, title: 'Show the H₂ density in the field', onChange: (v) => { on = v; api.setOn(v); } });
  r0.appendChild(onSw.root);
  const wSeg = seg({ label: 'SPIN STATE', value: 'triplet', options: [{ id: 'singlet', label: 'SINGLET (bond)' }, { id: 'triplet', label: 'TRIPLET (repel)' }], onChange: (v) => { which = v; run = null; refresh(); api.repaint(true); } });
  r0.appendChild(wSeg.root);
  /* WAVE 58 — THE CORRELATED PAIR IS A PAIR, AND IT CAN STAND DOWN.  Four curves on one 256-px canvas is a lot of
     ink for a card whose first claim is Heitler–London's; the switch takes the STO-3G pair and its own dissociation
     line away together, because RHF and FCI mean nothing apart — the whole point is the DISTANCE between them. */
  const ciSw = sw({ label: 'CORRELATED PAIR', value: true, title: 'Show STO-3G full-CI and restricted Hartree-Fock curves', onChange: (v) => { showCI = v; paint(); } });
  r0.appendChild(ciSw.root);
  const r1 = el('div', 'row tight', host);
  const rKnob = knob({ label: 'R  (a₀)', min: 0.6, max: 10, value: 6, fmt: (v) => v.toFixed(2), onInput: (v) => { R = handR = v; run = null; refresh(); api.repaint(true); } });
  const keKnob = knob({ label: 'COLLIDE  KE', min: 0.002, max: 0.1, value: 0.02, log: true, fmt: (v) => v.toFixed(3) + ' Eh', onInput: (v) => { ke = v; } });
  const clockKnob = knob({ label: 'NUCLEAR CLOCK ×', min: 20, max: 2000, value: 300, log: true, fmt: (v) => '×' + v.toFixed(0), onInput: (v) => { kappa = v; } });
  r1.appendChild(rKnob.root); r1.appendChild(keKnob.root); r1.appendChild(clockKnob.root);
  r1.appendChild(trig({ label: 'COLLIDE', title: 'Launch the nuclei from R = 8 on the selected curve', onFire: () => { run = { t0: api.now(), traj: collide(8, -Math.sqrt(2 * ke / MU_H2), which, { dt: 2, steps: 40000 }) }; R = 8; refresh(); api.repaint(true); } }).root);
  const cv = el('canvas', 'mol-c', host); const g = cv.getContext('2d');
  const rr = el('div', 'row tight', host);
  const roE = readout({ label: 'E  singlet · triplet  (hartree)', value: '—', sub: '' });
  const roD = readout({ label: 'D_e  HL · exact', value: '—', sub: '' });
  const roC = readout({ label: 'COLLISION', value: '—', sub: 'nothing thrown yet' });
  const roCI = readout({ label: 'STO-3G  RHF · FCI  (hartree)', cls: 'wide', value: '—', sub: '' });
  /* WAVE 58 — WEINBAUM BESIDE THE STO-3G NUMBER, not inside its sub-line.  They are the SAME 2 x 2 full CI fed by
     two different integral sets — Slater 1s orbitals with ζ free, against three fixed Gaussians — so the pair of
     readouts is the comparison, and burying one of them in the other's caption hid exactly that. */
  const roW = readout({ label: 'WEINBAUM 1933  E · ζ', value: '—', sub: '' });
  rr.appendChild(roE.root); rr.appendChild(roD.root); rr.appendChild(roC.root); rr.appendChild(roCI.root); rr.appendChild(roW.root);
  el('div', 'note', host).innerHTML = '<b>Model.</b> Heitler–London gives singlet and triplet energy bounds from two 1s orbitals. The chart can add STO-3G RHF and full-CI curves; full CI includes all determinants in that basis, while the reference dot represents the physical molecule. COLLIDE moves classical nuclei on the selected curve.';
  function refresh() {
    const e = h2Energies(R), eq = h2Equilibrium();
    roE.set(`${e.singlet.toFixed(4)} · ${e.triplet.toFixed(4)}`, e.singlet < -1 ? 'ok' : 'warn'); roE.setSub(`S = ${e.S.toFixed(4)} · J′ = ${e.J2.toFixed(4)} · K′ = ${e.K2.toFixed(4)} at R = ${R.toFixed(2)}`);
    roD.set(`${eq.DeEV.toFixed(2)} · ${EXACT_H2.DeEV.toFixed(2)} eV`, ''); roD.setSub(`R_e ${eq.Re.toFixed(2)} · reference ${EXACT_H2.Re.toFixed(2)} a₀`);
    { const c = sto3gH2(R), wb = weinbaumOptimal(R, { iters: 24 }), lim = 2 * sto3gHydrogen().E;   // the correlated numbers AT the marker (24 golden steps: 3e-6 on ζ, 1e-11 on E — a readout, on a knob drag)
      roCI.set(`${c.rhf.toFixed(6)} · ${c.fci.toFixed(6)}`, c.fci < lim ? 'ok' : '');
      roCI.setSub(`FCI ${c.fci.toFixed(6)} · RHF ${c.rhf.toFixed(6)} · gap ${(c.rhf - c.fci).toFixed(4)} · basis limit ${lim.toFixed(6)}`);
      roW.set(`${wb.fci.toFixed(6)} · ${wb.zeta.toFixed(4)}`, wb.fci < c.fci ? 'ok' : '');
      roW.setSub(`Slater orbitals · ζ free · ionic mix ${wb.lambda.toFixed(4)} · D_e ${((-1 - wb.fci) * EV).toFixed(3)} eV`); }
    paint();
  }
  function prepare() {
    if (CI_CURVE) return Promise.resolve(CI_CURVE);
    if (curveTask) return curveTask;
    if (api.loading) api.loading(true);
    const work = api.solveCurve ? api.solveCurve(0.6, 10, CURVE_N) : new Promise((resolve) => requestAnimationFrame(() => setTimeout(() => resolve(h2CurveTable(0.6, 10, CURVE_N)), 0)));
    curveTask = Promise.resolve(work).then((result) => {
      if (result && !result.error) CI_CURVE = result.result || result;
      if (active) paint(); return CI_CURVE;
    }).finally(() => { curveTask = null; if (api.loading) api.loading(false); });
    return curveTask;
  }
  /* WAVE 46 — the caption named the two curves ("singlet (bond) · triplet (repel)") because the plot could
     not; the curves say it themselves now, and the caption keeps the law.  A CANVAS HAS NO THEME: every rule
     here was rgba(255,255,255,…), white on white on the light card, so the ink is read from the body. */
  let rect = null;
  const hover = graphHover(cv, { repaint: () => paint(), plot: () => rect });
  function paint() {
    const W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (W < 32 || H < 32) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const Rmin = 0.6, Rmax = 10, Emin = -1.2, Emax = -0.7, L = 40, Rt = W - 10, Tp = 12;
    /* the caption is 340 px of type on a 256 px canvas: it is measured, wrapped at its spaces, and it SETS the
       plot's floor — clipping it to one line lost the half that says WHAT the bound is (moleculeview's lesson) */
    g.font = '8px ui-monospace, monospace';
    const CAP = 'dot = reference H₂ · HL = Heitler–London'
      + (showCI ? ' · thin = STO-3G FCI · dashed = STO-3G RHF' : ' · correlated pair off');
    const capLines = []; { let ln = '';
      for (const word of CAP.split(' ')) { const nx = ln ? ln + ' ' + word : word; if (ln && g.measureText(nx).width > Rt - L) { capLines.push(ln); ln = word; } else ln = nx; }
      if (ln) capLines.push(ln); }
    const Bt = H - 6 - capLines.length * 9;
    const x = (r) => L + (r - Rmin) / (Rmax - Rmin) * (Rt - L), y = (E) => Bt - (Math.min(Emax, Math.max(Emin, E)) - Emin) / (Emax - Emin) * (Bt - Tp);
    g.font = '9px ui-monospace, monospace'; g.textBaseline = 'middle';
    const T = themeInk(g);
    rect = { x0: L, y0: Tp, x1: Rt, y1: Bt };
    const hovers = [], eNow = h2Energies(R);
    g.strokeStyle = T.ink(0.3); g.setLineDash([2, 3]); g.beginPath(); g.moveTo(L, y(-1)); g.lineTo(Rt, y(-1)); g.stroke(); g.setLineDash([]);
    g.fillStyle = T.ink(0.7); g.textAlign = 'right'; g.fillText('H + H', L - 3, y(-1));      // the gutter's one end value — the EXACT one, 2 × (−½)
    hovers.push({ kind: 'line', key: 'limit-exact', points: [L, y(-1), Rt, y(-1)], lw: 1, colour: T.ink(1),
      info: 'H + H reference · dissociation limit −1 Eh' });
    for (const [key, rgb, what] of [['singlet', nRGB(2), 'the bond'], ['triplet', vividInk([255, 190, 90]), 'Pauli repulsion at every R']]) {
      const col = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.95)`, pts = [];
      g.strokeStyle = col; g.lineWidth = key === which ? 2.2 : 1.2; g.beginPath();
      for (let i = 0; i <= 220; i++) { const r = Rmin + (Rmax - Rmin) * i / 220, E = h2Energies(r)[key]; pts.push(x(r), y(E)); if (i === 0) g.moveTo(x(r), y(E)); else g.lineTo(x(r), y(E)); }
      g.stroke();
      hovers.push({ kind: 'curve', key, points: pts, lw: key === which ? 2.2 : 1.2, colour: col,
        info: `${key} — ${what}  ·  Heitler–London, a bound from above  ·  at R = ${R.toFixed(2)} a₀  E = ${eNow[key].toFixed(4)} Eh` });
    }
    /* the two STO-3G curves — the correlated pair, drawn under the Heitler–London ones so the bond well reads first */
    if (showCI && !CI_CURVE) prepare();
    if (showCI && CI_CURVE) { const cc = CI_CURVE;
      /* WAVE 58 — THE DISSOCIATION LIMIT DRAWN AS WHAT IT IS.  The dashed rule at −1 is the EXACT H + H, and the
         STO-3G curves do not go there: their atom is −0.4665819, so their limit is −0.933164, and FCI reaching it
         while RHF climbs away is the whole claim of this pair.  Drawn in FCI's own colour, so it reads as the
         line THAT curve is heading for rather than as a second copy of the exact one. */
      { const rgb = nRGB(4); g.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.55)`; g.setLineDash([4, 4]);
        g.beginPath(); g.moveTo(L, y(cc.limit)); g.lineTo(Rt, y(cc.limit)); g.stroke(); g.setLineDash([]);
        g.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.95)`; g.textAlign = 'right'; g.textBaseline = 'middle';
        g.font = '8px ui-monospace, monospace'; g.fillText('STO-3G', L - 3, y(cc.limit) - 5); g.fillText('H + H', L - 3, y(cc.limit) + 4);
        g.font = '9px ui-monospace, monospace';
        hovers.push({ kind: 'line', key: 'limit-sto3g', points: [L, y(cc.limit), Rt, y(cc.limit)], lw: 1, colour: `rgb(${rgb.join(',')})`,
          info: `H + H ON THIS BASIS  ·  2 × E(H, STO-3G) = ${cc.limit.toFixed(6)} Eh  ·  4.7e-4 above the exact −1, because three fixed Gaussians are not a 1s  ·  FCI reaches it and RHF cannot` }); }
      for (const [key, arr, rgb, dash, what] of [['fci', cc.fci, nRGB(4), [], 'STO-3G full CI — every determinant of the minimal basis'],
        ['rhf', cc.rhf, nRGB(5), [3, 3], 'STO-3G restricted Hartree–Fock — one doubly occupied σg']]) {
        const col = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.9)`, pts = [];
        g.strokeStyle = col; g.lineWidth = 1.4; g.setLineDash(dash); g.beginPath();
        let pen = false;
        for (let i = 0; i < CURVE_N; i++) { const E = arr[i];
          if (E > Emax || E < Emin) { pen = false; continue; }                    // BROKEN, not clipped: a curve on the ceiling reads as flat
          const px = x(cc.R[i]), py = y(E); pts.push(px, py);
          if (!pen) { g.moveTo(px, py); pen = true; } else g.lineTo(px, py); }
        g.stroke(); g.setLineDash([]);
        const here = key === 'fci' ? h2Curves('fci', R) : h2Curves('rhf', R);
        if (pts.length >= 4) hovers.push({ kind: 'curve', key: 'ci-' + key, points: pts, lw: 1.4, colour: col,
          info: `${key.toUpperCase()} — ${what}  ·  at R = ${R.toFixed(2)} a₀  E = ${here.toFixed(6)} Eh  ·  H + H on this basis = ${cc.limit.toFixed(6)}` }); }
    }
    g.fillStyle = T.fg(0.95); g.beginPath(); g.arc(x(EXACT_H2.Re), y(EXACT_H2.E), 3, 0, 2 * Math.PI); g.fill();
    hovers.push({ kind: 'dot', key: 'exact', x: x(EXACT_H2.Re), y: y(EXACT_H2.E), r: 3, colour: T.fg(1),
      info: `reference H₂ · R_e = ${EXACT_H2.Re} a₀ · E = ${EXACT_H2.E.toFixed(4)} Eh` });
    const e = eNow[which];
    g.strokeStyle = T.ink(0.5); g.beginPath(); g.moveTo(x(R), Tp); g.lineTo(x(R), Bt); g.stroke();
    g.fillStyle = T.fg(1); g.beginPath(); g.arc(x(R), y(e), 3.5, 0, 2 * Math.PI); g.fill();
    hovers.push({ kind: 'dot', key: 'now', x: x(R), y: y(e), r: 3.5, colour: T.fg(1),
      info: `now  ·  ${which}  ·  R = ${R.toFixed(2)} a₀  ·  E = ${e.toFixed(4)} Eh` });
    g.font = '8px ui-monospace, monospace'; g.fillStyle = T.ink(0.8); g.textBaseline = 'alphabetic';
    capLines.forEach((t, i) => fitText(g, t, L, H - 3 - (capLines.length - 1 - i) * 9, { x0: 4, y0: 0, x1: W - 4, y1: H }, 'left', true));
    hover.set(hovers, rect);
  }
  function update(t) {
    if (!on) return;
    if (run) {
      const tau = (t - run.t0) * kappa, tr = run.traj.track;
      if (tau <= 0) R = tr[0][1];
      else if (tau >= tr[tr.length - 1][0]) { R = tr[tr.length - 1][1]; }
      else { let i = 1; while (i < tr.length && tr[i][0] < tau) i++; const [t0, r0] = tr[i - 1], [t1, r1] = tr[i]; R = r0 + (r1 - r0) * (tau - t0) / (t1 - t0); }
      roC.set(`R = ${R.toFixed(2)} a₀`, R < 2.5 ? 'live' : 'ok');
      roC.setSub(`${which} · KE ${ke.toFixed(3)} Eh · closest approach ${run.traj.Rmin.toFixed(2)} a₀ · nuclear clock ×${kappa.toFixed(0)} · τ = ${tau.toFixed(0)} a.u.`);
    }
  }
  /* the Heitler–London one-electron density as two incoherent groups: √w_g·σg (group 0) and √w_u·σu (group 1) */
  function fieldModes() {
    const S = overlapS(R), { wg, wu } = hlDensityWeights(R, which);
    const ng = Math.sqrt(wg / (2 * (1 + S))), nu = Math.sqrt(wu / (2 * (1 - S)));
    const A = [0, 0, -R / 2], B = [0, 0, R / 2];
    return [{ table: T1S, re: ng, im: 0, center: A, group: 0 }, { table: T1S, re: ng, im: 0, center: B, group: 0 },
      { table: T1S, re: nu, im: 0, center: A, group: 1 }, { table: T1S, re: -nu, im: 0, center: B, group: 1 }];
  }
  refresh();
  return { update, refresh, prepare, setActive(v) { const next = !!v; if (next === active) return active; active = next; if (active) refresh(); return active; }, get curveReady() { return !!CI_CURVE; }, get on() { return on; }, setOn(v) { on = !!v; if (onSw.set) onSw.set(on); api.setOn(on); }, get R() { return R; }, setR(v) { R = handR = v; rKnob.set(R); run = null; refresh(); }, get which() { return which; }, setWhich(w) { if (w !== 'singlet' && w !== 'triplet') return false; which = w; wSeg.set(w); run = null; refresh(); return true; },
    get showCI() { return showCI; }, setShowCI(v) { showCI = !!v; ciSw.set(showCI); paint(); return showCI; },
    save() { return { on, R: handR, which, showCI, ke, kappa }; }, load(o = {}) { if (Number.isFinite(o.R)) this.setR(o.R); if (typeof o.which === 'string') this.setWhich(o.which); if (o.showCI !== undefined) this.setShowCI(!!o.showCI); if (Number.isFinite(o.ke)) { ke = o.ke; keKnob.set(ke); } if (Number.isFinite(o.kappa)) { kappa = o.kappa; clockKnob.set(kappa); } run = null; if (o.on !== undefined) this.setOn(!!o.on); return this.save(); },
    /** the correlated numbers AT R, for a proof that wants them without reading a readout's string */
    ci(r = R) { const c = sto3gH2(r), wb = weinbaumOptimal(r); return { R: r, rhf: c.rhf, fci: c.fci, correlation: c.fci - c.rhf, weinbaum: wb.fci, zeta: wb.zeta, lambda: wb.lambda, limit: 2 * sto3gHydrogen().E }; },
    collide(KE = ke) { ke = KE; run = { t0: api.now(), traj: collide(8, -Math.sqrt(2 * ke / MU_H2), which, { dt: 2, steps: 40000 }) }; R = 8; refresh(); return run.traj; }, get run() { return run; },
    fieldModes, get half() { return R / 2 + 5; } };
}
