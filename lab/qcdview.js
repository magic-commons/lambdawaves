/* qcdview.js — the QCD window: quarkonium levels under a chosen potential, the flavour-independence verdict, and
 * the exact string numbers.  Labels are the point: NUMERICAL (Numerov) for spectra, FIT for V₀, EXACT for the
 * string formulae, and a REFUTED badge on the Airy spectroscopy, because the instrument prints the kill as well
 * as the result.
 */
import { POTENTIALS, DEFAULTS, MEASURED, spectrum, airyLevels, flavourIndependence, fitOffset, reggeSlope, luscher, widthCoefficient } from './qcd.js';
import { el, seg, knob, readout, nRGB, vividInk, themeInk, graphHover, fitText } from './mir/kit.js';

export function createQCD(host, api) {
  let kind = 'charm', pot = 'cornell', params = { ...DEFAULTS }, cache = null, dirty = true;
  const r0 = el('div', 'row tight', host);
  const systemSeg = seg({ label: 'SYSTEM', value: 'charm', options: [{ id: 'charm', label: 'cc̄' }, { id: 'bottom', label: 'bb̄' }], onChange: (v) => { kind = v; dirty = true; api.repaint(); if (api.onParams) api.onParams(kind, pot, params); } });
  r0.appendChild(systemSeg.root);
  const potentialSeg = seg({ label: 'POTENTIAL', value: 'cornell', options: [
    { id: 'cornell', label: 'CORNELL' }, { id: 'linear', label: 'LINEAR', title: 'the Airy limit' }, { id: 'log', label: 'LOG' }, { id: 'coulomb', label: 'COULOMB' }],
    onChange: (v) => { pot = v; dirty = true; api.repaint(); if (api.onParams) api.onParams(kind, pot, params); } });
  r0.appendChild(potentialSeg.root);
  const r1 = el('div', 'row tight', host);
  const alphaKnob = knob({ label: 'α_s', min: 0.1, max: 0.8, value: 0.39, fmt: (v) => v.toFixed(2), onInput: (v) => { params.alphaS = v; dirty = true; api.repaint(); if (api.onParams) api.onParams(kind, pot, params); } });
  const sigmaKnob = knob({ label: 'σ GeV²', min: 0.05, max: 0.4, value: 0.18, fmt: (v) => v.toFixed(3), onInput: (v) => { params.sigma = v; dirty = true; api.repaint(); if (api.onParams) api.onParams(kind, pot, params); } });
  const cKnob = knob({ label: 'C (log)', min: 0.3, max: 1.2, value: 0.733, fmt: (v) => v.toFixed(3), onInput: (v) => { params.C = v; dirty = true; api.repaint(); if (api.onParams) api.onParams(kind, pot, params); } });
  r1.appendChild(alphaKnob.root); r1.appendChild(sigmaKnob.root); r1.appendChild(cKnob.root);
  const cv = el('canvas', 'qcd-c', host);
  const g = cv.getContext('2d');
  /* WAVE 46 — the two ladders used to print every mass beside its own line in its own colour (a cyan
     "3.097" in the gutter, an amber "J/ψ 3.097" hanging off the right of the measured rung) plus a header
     over the plot.  The rungs ARE the objects; the two lane names stay under the frame as the x axis. */
  let hovers = [], rect = null;
  const hover = graphHover(cv, { repaint: () => paint(), plot: () => rect });
  const rr = el('div', 'row tight', host);
  const roSplit = readout({ label: '2S−1S  predicted · measured', value: '—', sub: '' });
  const roFlav = readout({ label: 'bb̄/cc̄ splitting ratio', value: '—', sub: '' });
  const roMass = readout({ label: '2S mass  (V₀ fitted to 1S)', value: '—', sub: '' });
  rr.appendChild(roSplit.root); rr.appendChild(roFlav.root); rr.appendChild(roMass.root);
  const rs = el('div', 'row tight', host);
  const roRegge = readout({ label: 'REGGE α′ = 1/2πσ', value: '—', sub: 'exact · string' });
  const roLus = readout({ label: 'LÜSCHER at r = 1 fm', value: '—', sub: 'exact · universal' });
  const roW = readout({ label: 'TUBE WIDTH per e-fold', value: '—', sub: 'exact · (d−2)/2πσ' });
  rs.appendChild(roRegge.root); rs.appendChild(roLus.root); rs.appendChild(roW.root);
  el('div', 'note', host).innerHTML = '<b>Model.</b> Numerov shooting solves S-wave levels for the selected quark potential. V₀ is fitted to the ground state, so higher levels test the potential shape. A pure linear potential gives mass-dependent spacing that does not match both charmonium and bottomonium.';

  function compute() {
    const sys = MEASURED[kind];
    const v0 = fitOffset(kind, pot, params);
    const sp = spectrum(kind, pot, { ...params, V0: v0 }, 3);
    const flav = flavourIndependence(pot, params);
    const airy = airyLevels(sys.m / 2, params.sigma, 3);
    cache = { sys, v0, sp, flav, airy };
    dirty = false;
  }
  function paint() {
    const W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (W < 32 || H < 32 || !cache) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const { sys, sp } = cache;
    const Ms = [...sp.levels.map((l) => l.M), ...sys.levels.map((l) => l.M)];
    const lo = Math.min(...Ms) - 0.15, hi = Math.max(...Ms) + 0.15;
    const y = (M) => H - 14 - (M - lo) / (hi - lo) * (H - 28);
    g.font = '9px ui-monospace, monospace'; g.textBaseline = 'middle';
    const T = themeInk(g), pc = nRGB(2), mc = vividInk([255, 190, 90]);
    const PRED = `rgba(${pc[0]},${pc[1]},${pc[2]},0.9)`, MEAS = `rgba(${mc[0]},${mc[1]},${mc[2]},0.9)`;
    const frame = `${POTENTIALS[pot].label} · ${sys.label}`;
    rect = { x0: W * 0.14, y0: 14, x1: W * 0.68, y1: H - 14 }; hovers = [];
    /* the ladder: predicted on the left, measured on the right */
    for (let i = 0; i < 3; i++) {
      const p = sp.levels[i], m = sys.levels[i];
      g.strokeStyle = PRED; g.lineWidth = 2; g.beginPath(); g.moveTo(W * 0.14, y(p.M)); g.lineTo(W * 0.42, y(p.M)); g.stroke();
      hovers.push({ kind: 'line', key: 'p' + i, points: [W * 0.14, y(p.M), W * 0.42, y(p.M)], lw: 2, colour: PRED,
        info: `${i + 1}S predicted  ·  M = ${p.M.toFixed(3)} GeV  ·  ${frame}` });
      if (m) {
        g.strokeStyle = MEAS; g.beginPath(); g.moveTo(W * 0.54, y(m.M)); g.lineTo(W * 0.68, y(m.M)); g.stroke();
        g.strokeStyle = T.ink(0.28); g.lineWidth = 1; g.setLineDash([2, 3]); g.beginPath(); g.moveTo(W * 0.42, y(p.M)); g.lineTo(W * 0.54, y(m.M)); g.stroke(); g.setLineDash([]);
        hovers.push({ kind: 'line', key: 'm' + i, points: [W * 0.54, y(m.M), W * 0.68, y(m.M)], lw: 2, colour: MEAS,
          info: `${m.name}  measured (PDG)  ·  M = ${m.M.toFixed(3)} GeV  ·  ${((p.M - m.M) * 1000).toFixed(0)} MeV off the prediction` });
      }
    }
    /* the two lane names are the x axis: under the frame, measured into their own half */
    g.textBaseline = 'alphabetic';
    g.fillStyle = PRED; fitText(g, 'predicted', W * 0.14, H - 3, { x0: 2, y0: 0, x1: W * 0.5, y1: H }, 'left');
    g.fillStyle = MEAS; fitText(g, 'measured (PDG)', W * 0.54, H - 3, { x0: W * 0.5, y0: 0, x1: W - 2, y1: H }, 'left');
    hover.set(hovers, rect);
  }
  function update() {
    if (dirty) { compute(); paint(); }
    const { sp, flav, v0, sys } = cache;
    roSplit.set(`${sp.split.toFixed(4)} · ${sp.measuredSplit.toFixed(4)}`, Math.abs(sp.split / sp.measuredSplit - 1) < 0.05 ? 'ok' : 'warn');
    roSplit.setSub(`${(100 * (sp.split / sp.measuredSplit - 1)).toFixed(1)}% · Numerov`);
    const airyBad = pot === 'linear';
    roFlav.set(`${flav.predRatio.toFixed(4)} · ${flav.measRatio.toFixed(4)}`, Math.abs(flav.predRatio / flav.measRatio - 1) < 0.05 ? 'ok' : 'bad');
    roFlav.setSub(airyBad ? `linear ratio ${flav.airyRatio.toFixed(3)} · fitted exponent ${flav.fittedExponent.toFixed(3)}` : `predicted · measured · linear ratio ${flav.airyRatio.toFixed(3)}`);
    const m2 = sp.levels[1] && sys.levels[1] ? `${sp.levels[1].M.toFixed(4)} · ${sys.levels[1].M.toFixed(4)}` : '—';
    roMass.set(m2, sp.levels[1] && sys.levels[1] && Math.abs(sp.levels[1].M - sys.levels[1].M) < 0.03 ? 'ok' : 'warn');
    roMass.setSub(`V₀ = ${v0.toFixed(4)} GeV (fit) · ${sp.levels[1] && sys.levels[1] ? ((sp.levels[1].M - sys.levels[1].M) * 1000).toFixed(0) + ' MeV off' : ''}`);
    roRegge.set(`${reggeSlope(params.sigma).toFixed(4)} GeV⁻²`, Math.abs(reggeSlope(params.sigma) / 0.915 - 1) < 0.06 ? 'ok' : '');
    roRegge.setSub(`measured ρ trajectory ≈ 0.915 · ${(100 * (reggeSlope(params.sigma) / 0.91528 - 1)).toFixed(1)}%`);
    roLus.set(`${(luscher(1 / 0.1973269804)).toFixed(4)} GeV`, 'ok');
    roW.set(`${widthCoefficient(params.sigma).fm2.toFixed(5)} fm²`, 'ok');
  }
  window.addEventListener('resize', () => paint());
  return { update, get cache() { return cache; }, setPotential(p) { if (!POTENTIALS[p]) return false; pot = p; potentialSeg.set(p); dirty = true; if (api.onParams) api.onParams(kind, pot, params); return true; }, setSystem(k) { if (!MEASURED[k]) return false; kind = k; systemSeg.set(k); dirty = true; if (api.onParams) api.onParams(kind, pot, params); return true; },
    save() { return { kind, potential: pot, params: { alphaS: params.alphaS, sigma: params.sigma, C: params.C } }; }, load(o = {}) { if (typeof o.kind === 'string') this.setSystem(o.kind); if (typeof o.potential === 'string') this.setPotential(o.potential); if (o.params) { for (const [key, control] of [['alphaS', alphaKnob], ['sigma', sigmaKnob], ['C', cKnob]]) if (Number.isFinite(o.params[key])) { params[key] = o.params[key]; control.set(params[key]); } dirty = true; if (api.onParams) api.onParams(kind, pot, params); } api.repaint(); return this.save(); } };
}
