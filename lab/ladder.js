/* ladder.js — LADDER: the Rydberg ladder as a spectral instrument (print of 2026-09-03, Thread A).
 *
 * STATUS: EXACT ANALYTIC · SPECTRAL.  This window has its OWN register — populations p_n on any n (a Gaussian packet
 * or a comb of spacing d) — because the revival A(t) = Σ p_n e^{-iE_n t} needs only the spectrum, and the FIELD
 * cannot draw n > 6.  Everything drawn solid is the exact sum; everything dashed is a PREDICTION of the print's
 * Airy laws (cubic order in the level expansion; the neglected quartic β₄ is printed).  Nothing here touches the
 * main register, the clock, or the camera; it recomputes only when a knob moves (idle stays zero).
 */
import { revivalClocks, packet, revivalScan, poissonAiryChirped, combVerdict, cubicPeak, peakLaw, clockAutocorr, superrevival } from './frontier.js';
import { el, knob, readout, group, formula } from './kit.js';

export function createLadder(host) {
  const P = { nbar: 30, sigma: 2, d: 0, teeth: 8 };
  const ui = {};
  const r1 = el('div', 'row', host);
  ui.nbar = knob({ label: '<m>n̄</m>', min: 8, max: 400, value: 30, log: true, step: 1, fmt: (v) => v.toFixed(0), onInput: (v) => { P.nbar = Math.round(v); clockFx(); schedule(); } });
  ui.sigma = knob({ label: '<m>σ</m> (in <m>n</m>)', min: 0.5, max: 16, value: 2, log: true, fmt: (v) => v.toFixed(2), onInput: (v) => { P.sigma = v; schedule(); } });
  ui.d = knob({ label: 'COMB <m>d</m>', min: 0, max: 24, value: 0, step: 1, fmt: (v) => v === 0 ? 'all n' : v.toFixed(0), onInput: (v) => { P.d = Math.round(v); schedule(); } });
  ui.teeth = knob({ label: 'TEETH <m>±</m>', min: 2, max: 12, value: 8, step: 1, fmt: (v) => v.toFixed(0), onInput: (v) => { P.teeth = Math.round(v); schedule(); } });
  for (const k of ['nbar', 'sigma', 'd', 'teeth']) r1.appendChild(ui[k].root);
  const gClk = group(host, 'CLOCKS  (exact: <m>T_cl = 2πn̄³ · T_rev = 4πn̄⁴/3 · T_sr = πn̄⁵</m>)');
  /* WAVE 69 · THE SUBSTITUTION, UNDER THE FINGER.  The three clocks are closed forms in n̄ alone, so
     this line is exact at every pixel of the knob's travel — and it lands INSTANTLY, while the
     revival scan behind it (revivalScan is 400 periods × 20 samples) is still on its way.  That gap
     is not a defect to hide: a closed form answering before a numerical one is the whole reason the
     print bothered to derive it, and the window now shows the two arriving at different speeds. */
  ui.clockFx = formula({ lines: [
    ['<m>n̄ = </m>', { s: 'n' }, '<m>   ⇒   T_cl = 2π n̄³ = </m>', { s: 'tcl' }, '<m>   ·   T_rev = 4π n̄⁴/3 = </m>', { s: 'trev' }, '<m>   ·   T_sr = π n̄⁵ = </m>', { s: 'tsr' }] ] });
  gClk.appendChild(ui.clockFx.root);
  const r2 = el('div', 'row tight', gClk);
  ui.tcl = readout({ label: '<m>T_cl</m>  a.u.', value: '—' }); ui.trev = readout({ label: '<m>T_rev</m>  a.u.', value: '—', sub: '' }); ui.tsrClk = readout({ label: '<m>T_sr</m>  a.u.', value: '—' }); ui.beta = readout({ label: '<m>β₃ · β₄</m>', value: '—', sub: 'cubic · quartic strength' });
  for (const k of ['tcl', 'trev', 'tsrClk', 'beta']) r2.appendChild(ui[k].root);
  const gLand = group(host, 'REVIVAL LANDSCAPE  ·  max <m>|A|</m> in each classical period  (EXACT)');
  const land = el('div', 'ladder-c', gLand); const lcv = el('canvas', '', land);
  const gFine = group(host, 'AT <m>T_rev</m>  ·  <m>|A(T_rev + x·T_cl)|</m>  ·  solid EXACT · dashed PREDICTION (Poisson sum of Airy envelopes)');
  const fine = el('div', 'ladder-c', gFine); const fcv = el('canvas', '', fine);
  const r3 = el('div', 'row tight', host);
  ui.peak = readout({ label: 'PEAK  <m>|A|max</m>  (measured)', value: '—', sub: '' }); ui.pred = readout({ label: 'AIRY LAW  <m>|I|max(β₃)</m>', value: '—', sub: '' }); ui.atTrev = readout({ label: '<m>|A(T_rev)|</m>', value: '—' });
  for (const k of ['peak', 'pred', 'atTrev']) r3.appendChild(ui[k].root);
  const gSuper = group(host, 'SUPERREVIVAL  ·  <m>T_sr = πn̄⁵</m>  ·  the CUSP: at <m>T_sr</m> the cubic phase vanishes and the QUARTIC is what is left');
  const r5 = el('div', 'row tight', gSuper);
  ui.tsr = readout({ label: '<m>T_sr</m>  a.u.', value: '—', sub: '' }); ui.cls = readout({ label: '<m>n̄ mod 4</m>  ·  CLASS', value: '—', cls: 'two', sub: '' });
  ui.asr = readout({ label: '<m>|A(T_sr)|</m>  EXACT', value: '—', sub: 'integer phase reduction' }); ui.psr = readout({ label: 'CUSP LAW  (Pearcey)', value: '—', sub: '' });
  for (const k of ['tsr', 'cls', 'asr', 'psr']) r5.appendChild(ui[k].root);
  const gArith = group(host, 'THE ARITHMETIC  ·  <m>a/b = 4d³/3n̄</m>  ·  DEAF (peak 1) iff <m>b | 6</m>  (Fermat: <m>m³ ≡ m mod b</m>)');
  const r4 = el('div', 'row tight', gArith);
  ui.frac = readout({ label: '<m>a / b</m>', value: '—', sub: '' }); ui.verdict = readout({ label: 'VERDICT', value: '—', cls: 'two', sub: '' }); ui.cubic = readout({ label: 'CUBIC-LEVEL <m>A(p; a/b)</m>', value: '—', sub: '' }); ui.floor = readout({ label: 'PARSEVAL FLOOR <m>‖p‖₂/‖p‖₁</m>', value: '—' });
  for (const k of ['frac', 'verdict', 'cubic', 'floor']) r4.appendChild(ui[k].root);
  el('div', 'note', host).innerHTML = '<b>EXACT · SPECTRAL.</b> The revival hears the packet, not the ladder: a comb of spacing d revives perfectly iff the reduced denominator of 4d³/3n̄ divides 6; every other packet sits between the Parseval floor and 1. The FIELD cannot draw n > 6 — this window is the spectrum alone, its own register.';

  let pending = 0, last = null;
  function schedule() { if (!pending) pending = requestAnimationFrame(() => { pending = 0; compute(); }); }
  function compute() {
    const clocks = revivalClocks(P.nbar, P.sigma);
    const pops = packet({ nbar: P.nbar, sigma: P.sigma, d: P.d, teeth: P.teeth });
    const scan = revivalScan(pops, P.nbar, { maxPeriods: 400, perPeriod: 20, fine: 601, fineHalf: 1.5 });
    const law = peakLaw(clocks.beta3);
    const pred = []; const NP = 121;
    for (let i = 0; i < NP; i++) { const x = -0.5 + i / (NP - 1); pred.push([x, poissonAiryChirped(P.nbar, P.sigma, x)]); }
    let comb = null;
    if (P.d >= 1) { const v = combVerdict(P.nbar, P.d); comb = { ...v, ...cubicPeak(pops, v.a, v.b) }; }
    const sup = superrevival(P.nbar, P.sigma);
    sup.exact = clockAutocorr(pops, P.nbar, 1, 1, 5).abs;
    last = { P: { ...P }, clocks, pops, scan, law, pred, comb, sup };
    paint();
  }
  function fmtT(t) { return t >= 1e7 ? t.toExponential(3) : t >= 1e4 ? t.toFixed(0) : t.toFixed(2); }
  /** the closed forms alone — no scan, no packet, three powers: this is why it can run on the drag */
  function clockFx() {
    const n = P.nbar, TAU = 2 * Math.PI;
    ui.clockFx.set({ n: String(n), tcl: fmtT(TAU * n ** 3), trev: fmtT(2 * TAU * n ** 4 / 3), tsr: fmtT(Math.PI * n ** 5) });
  }
  clockFx();
  function paint() {
    if (!last) return;
    const { clocks, scan, law, pred, comb, pops, sup } = last;
    const reg = clocks.beta3 <= 0.25 ? ['tight', 'ok'] : clocks.beta3 <= 0.5 ? ['usable', ''] : clocks.beta3 <= 0.8 ? ['loose', 'warn'] : ['OUT OF RÉGIME', 'warn'];
    ui.tsr.set(fmtT(sup.Tsr)); ui.tsr.setSub(`= ${(sup.Tsr / clocks.Trev).toFixed(2)} T_rev · γ_sr = ${sup.gamma.toFixed(4)}`);
    ui.cls.set(`${sup.cls}  ·  ${sup.kind.toUpperCase()}`, sup.cls === 0 ? 'ok' : sup.cls === 2 ? 'warn' : ''); ui.cls.setSub(sup.note);
    ui.asr.set(sup.exact.toFixed(6)); ui.asr.setSub(`exact for any n̄: t/(4πn²) = n̄⁵/(4n²) is rational`);
    ui.psr.set(sup.predicted === null ? '—' : sup.predicted.toFixed(6), sup.trustworthy ? '' : 'warn');
    ui.psr.setSub(sup.trustworthy ? `quartic envelope + aliases · quintic γ₅ = ${sup.quintic.toExponential(1)}` : `quintic γ₅ = ${sup.quintic.toExponential(1)} — too large: the k-expansion is not converged`);
    ui.tcl.set(fmtT(clocks.Tcl)); ui.tsrClk.set(fmtT(clocks.Tsr));   /* WAVE 69: `ui.tsr` was assigned TWICE — the CLOCKS readout and the SUPERREVIVAL one had the same key, so the second overwrote the first and the CLOCKS T_sr has printed an em dash since it was written.  Two readouts, two names. */ ui.trev.set(fmtT(clocks.Trev)); ui.trev.setSub(`= ${(clocks.Trev / clocks.Tcl).toFixed(1)} T_cl · ${(clocks.Trev * 24.188843e-3).toExponential(2)} fs`); ui.tsr.set(fmtT(clocks.Tsr));
    ui.beta.set(`${clocks.beta3.toFixed(3)} · ${clocks.beta4.toFixed(4)}`);
    ui.peak.set(scan.aPeak.toFixed(4), scan.aPeak > 0.5 ? 'ok' : 'warn'); ui.peak.setSub(`at ${(scan.tPeak / clocks.Trev).toFixed(5)} T_rev = T_rev ${(scan.tPeak - clocks.Trev) / clocks.Tcl >= 0 ? '+' : '−'} ${Math.abs((scan.tPeak - clocks.Trev) / clocks.Tcl).toFixed(3)} T_cl`);
    ui.pred.set(law.heightNum.toFixed(4), reg[1]); ui.pred.setSub(`fold/Airy régime ${reg[0]} at β₃ = ${clocks.beta3.toFixed(3)} · ` + (law.seriesUsable ? `series to ${law.heightTerms} terms (err ${law.heightError.toExponential(1)})` : 'Airy maximiser, series divergent here'));
    ui.atTrev.set(scan.aAtTrev.toFixed(4));
    if (comb) {
      ui.frac.set(comb.fraction); ui.frac.setSub(`${pops.length} teeth · d = ${last.P.d}`);
      ui.verdict.set(comb.deaf ? 'DEAF — b | 6 — revives to 1' : `HEARS — b = ${comb.b} ∤ 6`, comb.deaf ? 'ok' : 'live');
      ui.verdict.setSub(comb.deaf ? 'the cubic phase is affine on the comb (Fermat/Korselt)' : 'the cubic residues break the phase; height set by the packet');
      ui.cubic.set(comb.peak.toFixed(6)); ui.cubic.setSub(`max over the classical phase x; at x = ${comb.x.toFixed(4)}`);
      ui.floor.set(comb.floor.toFixed(6));
    } else {
      ui.frac.set('—'); ui.frac.setSub('Gaussian packet on every n'); ui.verdict.set('no comb: the arithmetic does not enter', ''); ui.verdict.setSub('Ω₁ is dead: the revival is analytic (Airy), not arithmetic');
      ui.cubic.set('—'); ui.cubic.setSub(''); ui.floor.set((Math.sqrt(pops.reduce((s, q) => s + q.p * q.p, 0))).toFixed(6));
    }
    paintLand(); paintFine();
  }
  function ctx(cv, holder) {
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = holder.clientWidth, H = holder.clientHeight;
    if (W < 32 || H < 32) return null;                  // folded: no size, nothing to paint
    if (cv.width !== W * dpr || cv.height !== H * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H); g.font = '8px ui-monospace, monospace'; g.textBaseline = 'middle';
    return { g, W, H };
  }
  function paintLand() {
    const cx0 = ctx(lcv, land); if (!cx0) return;
    const { g, W, H } = cx0; const { scan, clocks } = last;
    const left = 30, right = W - 8, top = 8, bot = H - 14, span = 1.15;
    const X = (t) => left + (t / clocks.Trev) / span * (right - left), Y = (a) => bot - a * (bot - top);
    g.strokeStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.moveTo(left, Y(0)); g.lineTo(right, Y(0)); g.moveTo(left, Y(1)); g.lineTo(right, Y(1)); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.textAlign = 'right'; g.fillText('1', left - 3, Y(1)); g.fillText('0', left - 3, Y(0));
    for (const [f, lab] of [[0.25, '¼'], [1 / 3, '⅓'], [0.5, '½'], [2 / 3, '⅔'], [1, 'T_rev']]) {
      g.strokeStyle = f === 1 ? 'rgba(120,225,240,0.6)' : 'rgba(255,255,255,0.18)'; g.setLineDash([2, 3]); g.beginPath(); g.moveTo(X(f * clocks.Trev), top); g.lineTo(X(f * clocks.Trev), bot); g.stroke(); g.setLineDash([]);
      g.fillStyle = 'rgba(255,255,255,0.5)'; g.textAlign = 'center'; g.fillText(lab, X(f * clocks.Trev), H - 5);
    }
    g.strokeStyle = 'rgba(120,225,240,0.95)'; g.lineWidth = 1.2; g.beginPath();
    for (let k = 0; k < scan.periods; k++) { const x = X((k + 0.5) * clocks.Tcl), y = Y(scan.landscape[k]); if (k === 0) g.moveTo(x, y); else g.lineTo(x, y); }
    g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.textAlign = 'left'; g.fillText(`${scan.periods} classical periods · t / T_rev`, left + 4, top + 6);
  }
  function paintFine() {
    const cx1 = ctx(fcv, fine); if (!cx1) return;
    const { g, W, H } = cx1; const { scan, clocks, pred } = last;
    const left = 30, right = W - 8, top = 8, bot = H - 14, xh = 1.5;
    const X = (x) => left + (x + xh) / (2 * xh) * (right - left), Y = (a) => bot - a * (bot - top);
    g.strokeStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.moveTo(left, Y(0)); g.lineTo(right, Y(0)); g.moveTo(left, Y(1)); g.lineTo(right, Y(1)); g.moveTo(X(0), top); g.lineTo(X(0), bot); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.textAlign = 'right'; g.fillText('1', left - 3, Y(1)); g.fillText('0', left - 3, Y(0));
    g.textAlign = 'center'; for (const x of [-1, 0, 1]) g.fillText(x === 0 ? 'T_rev' : (x > 0 ? '+' : '−') + '1 T_cl', X(x), H - 5);
    g.strokeStyle = 'rgba(255,226,170,0.95)'; g.lineWidth = 1.2; g.beginPath();
    for (let i = 0; i < scan.fineT.length; i++) { const x = X((scan.fineT[i] - clocks.Trev) / clocks.Tcl), y = Y(scan.fineA[i]); if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); }
    g.stroke();
    g.strokeStyle = 'rgba(180,160,255,0.95)'; g.setLineDash([3, 3]); g.beginPath();
    for (let i = 0; i < pred.length; i++) { const x = X(pred[i][0]), y = Y(Math.min(1, pred[i][1])); if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); }
    g.stroke(); g.setLineDash([]);
    const xp = X((scan.tPeak - clocks.Trev) / clocks.Tcl), yp = Y(scan.aPeak);
    g.fillStyle = '#fff'; g.beginPath(); g.arc(xp, yp, 3, 0, 2 * Math.PI); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.45)'; g.textAlign = 'left'; g.fillText(`prediction: Poisson sum of Airy envelopes WITH the chirp δ = 3πxσ²/n̄; neglected: quartic β₄ = ${clocks.beta4.toFixed(4)}`, left + 4, top + 6);
  }
  window.addEventListener('resize', () => paint());
  compute();
  return { compute, params: P, get last() { return last; }, set(p) { Object.assign(P, p); for (const k of ['nbar', 'sigma', 'd', 'teeth']) if (p[k] !== undefined) ui[k].set(p[k]); clockFx(); compute(); } };
}
