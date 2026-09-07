/* h2view.js — the H₂ window: Heitler–London's two curves, the exact dots, and THE COLLISION — two hydrogen atoms
 * thrown at each other, classical nuclei on the variational curve (Born–Oppenheimer, labelled), the electron
 * clouds drawn as the Heitler–London one-electron density (an incoherent sum of σg and σu, since that density is
 * not the square of any single orbital — that is correlation).
 */
import { h2Energies, h2Equilibrium, KNOWN_HL, EXACT_H2, collide, hlDensityWeights, MU_H2, EV } from './h2.js';
import { h2Curves, sto3gH2, sto3gHydrogen, weinbaumOptimal } from './h2ci.js';
import { overlapS } from './molecule.js';
import { modeTable } from './hydrogen.js';
import { el, seg, sw, knob, readout, trig, nRGB, vividInk, themeInk, graphHover, fitText } from './kit.js';

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
function ciCurve(Rmin, Rmax) {
  if (CI_CURVE && CI_CURVE.Rmin === Rmin && CI_CURVE.Rmax === Rmax) return CI_CURVE;
  const rhf = new Float64Array(CURVE_N), fci = new Float64Array(CURVE_N), R = new Float64Array(CURVE_N);
  for (let i = 0; i < CURVE_N; i++) { const r = Rmin + (Rmax - Rmin) * i / (CURVE_N - 1), s = sto3gH2(r); R[i] = r; rhf[i] = s.rhf; fci[i] = s.fci; }
  CI_CURVE = { Rmin, Rmax, R, rhf, fci, limit: 2 * sto3gHydrogen().E };
  return CI_CURVE;
}
export function createH2(host, api) {
  let on = false, which = 'triplet', R = 6, ke = 0.02, run = null, kappa = 300, showCI = true;   // κ: nuclear time per logical time unit (a DISPLAY choice)
  const r0 = el('div', 'row tight', host);
  const onSw = sw({ label: 'H₂ ON', value: false, title: 'hand the FIELD to two hydrogen atoms: the Heitler–London one-electron density on two moving nuclei', onChange: (v) => { on = v; api.setOn(v); } });
  r0.appendChild(onSw.root);
  const wSeg = seg({ label: 'SPIN STATE', value: 'triplet', options: [{ id: 'singlet', label: 'SINGLET (bond)' }, { id: 'triplet', label: 'TRIPLET (repel)' }], onChange: (v) => { which = v; run = null; refresh(); api.repaint(true); } });
  r0.appendChild(wSeg.root);
  /* WAVE 58 — THE CORRELATED PAIR IS A PAIR, AND IT CAN STAND DOWN.  Four curves on one 256-px canvas is a lot of
     ink for a card whose first claim is Heitler–London's; the switch takes the STO-3G pair and its own dissociation
     line away together, because RHF and FCI mean nothing apart — the whole point is the DISTANCE between them. */
  const ciSw = sw({ label: 'CORRELATED PAIR', value: true, title: 'draw the STO-3G pair: full CI (exact in this basis) and restricted Hartree-Fock (variational), with their own H + H limit — the gap between them IS the correlation energy', onChange: (v) => { showCI = v; paint(); } });
  r0.appendChild(ciSw.root);
  const r1 = el('div', 'row tight', host);
  r1.appendChild(knob({ label: 'R  (a₀)', min: 0.6, max: 10, value: 6, fmt: (v) => v.toFixed(2), onInput: (v) => { R = v; run = null; refresh(); api.repaint(true); } }).root);
  r1.appendChild(knob({ label: 'COLLIDE  KE', min: 0.002, max: 0.1, value: 0.02, log: true, fmt: (v) => v.toFixed(3) + ' Eh', onInput: (v) => { ke = v; } }).root);
  r1.appendChild(knob({ label: 'NUCLEAR CLOCK ×', min: 20, max: 2000, value: 300, log: true, fmt: (v) => '×' + v.toFixed(0), onInput: (v) => { kappa = v; } }).root);
  r1.appendChild(trig({ label: 'COLLIDE', title: 'throw the two atoms at each other from R = 8 with this relative kinetic energy; the nuclei move classically on the chosen curve', onFire: () => { run = { t0: api.now(), traj: collide(8, -Math.sqrt(2 * ke / MU_H2), which, { dt: 2, steps: 40000 }) }; R = 8; refresh(); api.repaint(true); } }).root);
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
  el('div', 'note', host).innerHTML = '<b>H₂, Heitler–London 1927.</b> Two electrons on two protons: Ψ± = [a(1)b(2) ± b(1)a(2)]/√(2(1±S²)). All six integrals are <b>EXACT</b> closed forms (Sugiura\'s exchange integral with the exponential integral, gated against the tables); the energies are <b>VARIATIONAL</b>: R_e = 1.64 a₀, D_e = 3.14 eV against the exact 1.40 a₀, 4.75 eV, drawn as a dot. The triplet is repulsive at every R — <b>Pauli repulsion is the electrostatics of the exchange density</b>. <b>COLLIDE</b> throws the atoms at each other: the nuclei move classically on the curve (Born–Oppenheimer, μ = m_p/2 = 918 electron masses) with a NUCLEAR CLOCK that runs faster than the electron clock — a display choice, labelled. On the triplet they bounce; on the singlet they fall into the bond well and, with nothing to carry the energy away, climb back out. The cloud is the Heitler–London <b>one-electron density</b>, drawn as an incoherent sum of σg and σu because that density is not the square of any single orbital: correlation on screen. <b>WAVE 49 — THE CORRELATED CURVES</b> (lab/h2ci.js, no dependencies): the thin line is <b>STO-3G full CI</b> and the dashed one <b>STO-3G RHF</b>. They differ by the <b>correlation energy</b> (0.0206 hartree at R = 1.4, where RHF = −1.116714 and FCI = −1.137276 — Szabo–Ostlund, gated) and they separate without limit as the atoms part: at R = 8 a₀ the restricted determinant sits <b>0.32 hartree above</b> FCI, which has already reached 2E(H) on its own basis. A closed shell cannot dissociate. The Slater side is <b>Weinbaum 1933</b> — Heitler–London plus the ionic term with ζ optimised — reaching −1.14772 and D<sub>e</sub> = 4.02 eV against Heitler–London’s 3.16, printed at the marker. <b>WHICH CURVE IS WHICH, plainly (wave 58).</b> Heitler–London, Weinbaum and STO-3G <b>RHF are VARIATIONAL</b> — each is a bound from above, and each can only be improved by widening what it is allowed to be. <b>STO-3G FCI is EXACT IN THIS BASIS</b>: it is every determinant the two orbitals can make, so nothing is left to add without adding functions, and it is <b>not</b> the exact H₂ — the dot at (1.40, −1.1745) is, and FCI misses it by 0.037 hartree because a minimal basis is a minimal basis. The two dashed rules are <b>two different dissociation limits and say so</b>: −1 exactly, which is two real hydrogen atoms, and −0.933164, which is two <i>STO-3G</i> hydrogen atoms, 4.7e-4 higher. FCI arrives at the second one; RHF leaves the top of the box instead. The <b>CORRELATED PAIR</b> switch takes both curves and that second rule away together, because the pair is the point and either half alone is not.';
  function refresh() {
    const e = h2Energies(R), eq = h2Equilibrium();
    roE.set(`${e.singlet.toFixed(4)} · ${e.triplet.toFixed(4)}`, e.singlet < -1 ? 'ok' : 'warn'); roE.setSub(`S = ${e.S.toFixed(4)} · J′ = ${e.J2.toFixed(4)} · K′ = ${e.K2.toFixed(4)} at R = ${R.toFixed(2)}`);
    roD.set(`${eq.DeEV.toFixed(2)} · ${EXACT_H2.DeEV.toFixed(2)} eV`, ''); roD.setSub(`R_e ${eq.Re.toFixed(2)} · ${EXACT_H2.Re.toFixed(2)} a₀ · variational`);
    { const c = sto3gH2(R), wb = weinbaumOptimal(R, { iters: 24 }), lim = 2 * sto3gHydrogen().E;   // the correlated numbers AT the marker (24 golden steps: 3e-6 on ζ, 1e-11 on E — a readout, on a knob drag)
      roCI.set(`${c.rhf.toFixed(6)} · ${c.fci.toFixed(6)}`, c.fci < lim ? 'ok' : '');
      roCI.setSub(`FCI is EXACT IN THIS BASIS · RHF is VARIATIONAL above it · correlation ${(c.fci - c.rhf).toFixed(6)} · RHF − FCI ${(c.rhf - c.fci).toFixed(4)} (→ ∞ as R → ∞: a closed shell cannot dissociate) · H + H on this basis = ${lim.toFixed(6)}`);
      roW.set(`${wb.fci.toFixed(6)} · ${wb.zeta.toFixed(4)}`, wb.fci < c.fci ? 'ok' : '');
      roW.setSub(`the same 2 × 2 CI on SLATER orbitals with ζ free — VARIATIONAL, and below STO-3G's FCI by ${(c.fci - wb.fci).toFixed(6)} at this R · ionic mixing λ = ${wb.lambda.toFixed(4)} · D_e ${((-1 - wb.fci) * EV).toFixed(3)} eV against Heitler–London's 3.16 and the exact 4.75`); }
    paint();
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
    const CAP = 'dot = EXACT H₂ (1.40 a₀, −1.1745) · HL is a bound from above'
      + (showCI ? ' · thin = STO-3G FCI, EXACT in this basis · dashed = STO-3G RHF, variational above it' : ' · the correlated pair is switched off');
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
      info: 'H + H, EXACTLY  ·  two hydrogen atoms at infinity, 2 × (−½) = −1 Eh  ·  the dissociation limit of the real molecule' });
    for (const [key, rgb, what] of [['singlet', nRGB(2), 'the bond'], ['triplet', vividInk([255, 190, 90]), 'Pauli repulsion at every R']]) {
      const col = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.95)`, pts = [];
      g.strokeStyle = col; g.lineWidth = key === which ? 2.2 : 1.2; g.beginPath();
      for (let i = 0; i <= 220; i++) { const r = Rmin + (Rmax - Rmin) * i / 220, E = h2Energies(r)[key]; pts.push(x(r), y(E)); if (i === 0) g.moveTo(x(r), y(E)); else g.lineTo(x(r), y(E)); }
      g.stroke();
      hovers.push({ kind: 'curve', key, points: pts, lw: key === which ? 2.2 : 1.2, colour: col,
        info: `${key} — ${what}  ·  Heitler–London, a bound from above  ·  at R = ${R.toFixed(2)} a₀  E = ${eNow[key].toFixed(4)} Eh` });
    }
    /* the two STO-3G curves — the correlated pair, drawn under the Heitler–London ones so the bond well reads first */
    if (showCI) { const cc = ciCurve(Rmin, Rmax);
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
      info: `EXACT H₂  ·  R_e = ${EXACT_H2.Re} a₀  ·  E = ${EXACT_H2.E.toFixed(4)} Eh` });
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
  return { update, refresh, get on() { return on; }, setOn(v) { on = !!v; if (onSw.set) onSw.set(on); api.setOn(on); }, get R() { return R; }, setR(v) { R = v; run = null; refresh(); }, get which() { return which; }, setWhich(w) { which = w; wSeg.set(w); run = null; refresh(); },
    get showCI() { return showCI; }, setShowCI(v) { showCI = !!v; ciSw.set(showCI); paint(); return showCI; },
    /** the correlated numbers AT R, for a proof that wants them without reading a readout's string */
    ci(r = R) { const c = sto3gH2(r), wb = weinbaumOptimal(r); return { R: r, rhf: c.rhf, fci: c.fci, correlation: c.fci - c.rhf, weinbaum: wb.fci, zeta: wb.zeta, lambda: wb.lambda, limit: 2 * sto3gHydrogen().E }; },
    collide(KE = ke) { ke = KE; run = { t0: api.now(), traj: collide(8, -Math.sqrt(2 * ke / MU_H2), which, { dt: 2, steps: 40000 }) }; R = 8; refresh(); return run.traj; }, get run() { return run; },
    fieldModes, get half() { return R / 2 + 5; } };
}
