/* qcdview.js — the QCD window: quarkonium levels under a chosen potential, the flavour-independence verdict, and
 * the exact string numbers.  Labels are the point: NUMERICAL (Numerov) for spectra, FIT for V₀, EXACT for the
 * string formulae, and a REFUTED badge on the Airy spectroscopy, because the instrument prints the kill as well
 * as the result.
 */
import { POTENTIALS, DEFAULTS, MEASURED, spectrum, airyLevels, flavourIndependence, fitOffset, reggeSlope, luscher, widthCoefficient } from './qcd.js';
import { el, seg, knob, readout } from './kit.js';

export function createQCD(host, api) {
  let kind = 'charm', pot = 'cornell', params = { ...DEFAULTS }, cache = null, dirty = true;
  const r0 = el('div', 'row tight', host);
  r0.appendChild(seg({ label: 'SYSTEM', value: 'charm', options: [{ id: 'charm', label: 'cc̄' }, { id: 'bottom', label: 'bb̄' }], onChange: (v) => { kind = v; dirty = true; api.repaint(); } }).root);
  r0.appendChild(seg({ label: 'POTENTIAL', value: 'cornell', options: [
    { id: 'cornell', label: 'CORNELL' }, { id: 'linear', label: 'LINEAR', title: 'the Airy limit' }, { id: 'log', label: 'LOG' }, { id: 'coulomb', label: 'COULOMB' }],
    onChange: (v) => { pot = v; dirty = true; api.repaint(); } }).root);
  const r1 = el('div', 'row tight', host);
  r1.appendChild(knob({ label: 'α_s', min: 0.1, max: 0.8, value: 0.39, fmt: (v) => v.toFixed(2), onInput: (v) => { params.alphaS = v; dirty = true; api.repaint(); } }).root);
  r1.appendChild(knob({ label: 'σ GeV²', min: 0.05, max: 0.4, value: 0.18, fmt: (v) => v.toFixed(3), onInput: (v) => { params.sigma = v; dirty = true; api.repaint(); } }).root);
  r1.appendChild(knob({ label: 'C (log)', min: 0.3, max: 1.2, value: 0.733, fmt: (v) => v.toFixed(3), onInput: (v) => { params.C = v; dirty = true; api.repaint(); } }).root);
  const cv = el('canvas', 'qcd-c', host);
  const g = cv.getContext('2d');
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
  el('div', 'note', host).innerHTML = '<b>NUMERICAL.</b> S-wave levels by Numerov shooting on the radial equation, M = 2m_q + E; the constant V₀ every potential model carries is a <b>FIT</b> to the ground state, after which the 2S mass is a prediction. <b>THE AIRY BRIDGE, REFUTED AS SPECTROSCOPY:</b> for V = σr the radial equation <i>is</i> Airy\'s equation, so the levels are Airy zeros — the print\'s own function — but their ratio is rigid and every splitting scales as μ^{−1/3}, forcing bb̄/cc̄ = 0.679 where the measurement is 0.956. The data wants a <b>logarithm</b>, for which the spacing is mass-independent exactly. The string numbers are exact; a drawn tube interior would be a model.';

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
    /* the ladder: predicted on the left, measured on the right */
    for (let i = 0; i < 3; i++) {
      const p = sp.levels[i], m = sys.levels[i];
      g.strokeStyle = 'rgba(120,225,240,0.9)'; g.lineWidth = 2; g.beginPath(); g.moveTo(W * 0.14, y(p.M)); g.lineTo(W * 0.42, y(p.M)); g.stroke();
      g.fillStyle = 'rgba(120,225,240,0.9)'; g.textAlign = 'right'; g.fillText(p.M.toFixed(3), W * 0.12, y(p.M));
      if (m) {
        g.strokeStyle = 'rgba(255,190,90,0.9)'; g.beginPath(); g.moveTo(W * 0.54, y(m.M)); g.lineTo(W * 0.68, y(m.M)); g.stroke();
        g.fillStyle = 'rgba(255,190,90,0.9)'; g.textAlign = 'left'; g.fillText(`${m.name} ${m.M.toFixed(3)}`, W * 0.70, y(m.M));
        g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 1; g.setLineDash([2, 3]); g.beginPath(); g.moveTo(W * 0.42, y(p.M)); g.lineTo(W * 0.54, y(m.M)); g.stroke(); g.setLineDash([]);
      }
    }
    g.fillStyle = 'rgba(255,255,255,0.5)'; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.fillText(`${POTENTIALS[pot].label}  ·  ${sys.label}  ·  GeV`, 8, 11);
    g.fillStyle = 'rgba(120,225,240,0.7)'; g.fillText('predicted', W * 0.14, H - 3);
    g.fillStyle = 'rgba(255,190,90,0.7)'; g.fillText("measured (PDG)", W * 0.54, H - 3);
  }
  function update() {
    if (dirty) { compute(); paint(); }
    const { sp, flav, v0, sys } = cache;
    roSplit.set(`${sp.split.toFixed(4)} · ${sp.measuredSplit.toFixed(4)}`, Math.abs(sp.split / sp.measuredSplit - 1) < 0.05 ? 'ok' : 'warn');
    roSplit.setSub(`${(100 * (sp.split / sp.measuredSplit - 1)).toFixed(1)}% · numerical (Numerov)`);
    const airyBad = pot === 'linear';
    roFlav.set(`${flav.predRatio.toFixed(4)} · ${flav.measRatio.toFixed(4)}`, Math.abs(flav.predRatio / flav.measRatio - 1) < 0.05 ? 'ok' : 'bad');
    roFlav.setSub(airyBad ? `REFUTED: Airy forces (μ_c/μ_b)^{1/3} = ${flav.airyRatio.toFixed(3)}; data exponent ${flav.fittedExponent.toFixed(3)} ≈ 0 (a log)` : `predicted · measured; a pure linear law would give ${flav.airyRatio.toFixed(3)}`);
    const m2 = sp.levels[1] && sys.levels[1] ? `${sp.levels[1].M.toFixed(4)} · ${sys.levels[1].M.toFixed(4)}` : '—';
    roMass.set(m2, sp.levels[1] && sys.levels[1] && Math.abs(sp.levels[1].M - sys.levels[1].M) < 0.03 ? 'ok' : 'warn');
    roMass.setSub(`V₀ = ${v0.toFixed(4)} GeV (fit) · ${sp.levels[1] && sys.levels[1] ? ((sp.levels[1].M - sys.levels[1].M) * 1000).toFixed(0) + ' MeV off' : ''}`);
    roRegge.set(`${reggeSlope(params.sigma).toFixed(4)} GeV⁻²`, Math.abs(reggeSlope(params.sigma) / 0.915 - 1) < 0.06 ? 'ok' : '');
    roRegge.setSub(`measured ρ trajectory ≈ 0.915 · ${(100 * (reggeSlope(params.sigma) / 0.91528 - 1)).toFixed(1)}%`);
    roLus.set(`${(luscher(1 / 0.1973269804)).toFixed(4)} GeV`, 'ok');
    roW.set(`${widthCoefficient(params.sigma).fm2.toFixed(5)} fm²`, 'ok');
  }
  window.addEventListener('resize', () => paint());
  return { update, get cache() { return cache; }, setPotential(p) { pot = p; dirty = true; }, setSystem(k) { kind = k; dirty = true; } };
}
