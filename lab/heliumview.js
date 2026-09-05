/* heliumview.js — the HELIUM window: Hylleraas's two-electron ground state, and the CONDITIONAL cloud of electron 2
 * given where electron 1 is.  ON hands the FIELD to that conditional density.
 *
 * Labels: the integrals are EXACT (algebraic), the energy VARIATIONAL (a rigorous upper bound, printed beside the
 * exact −2.903724), the picture is the Born rule — ρ(x₂ | x₁) ∝ |ψ(x₁, x₂)|² — with nothing interpretive added.
 */
import { hylleraas, BASES, EXACT_E, KNOWN, cuspRatio, conditionalModes, psiPair } from './helium.js';
import { el, seg, sw, knob, readout } from './kit.js';

export function createHelium(host, api) {
  let basis = 'six', sol = hylleraas(BASES[basis]), on = false, r1 = 0.8, th1 = 0, x1v = null;   // x1v: a point placed by hand on the field (shift-click), off the knobs' plane
  const x1 = () => x1v || [r1 * Math.sin(th1), 0, r1 * Math.cos(th1)];
  const r0 = el('div', 'row tight', host);
  const onSw = sw({ label: 'HELIUM ON', value: false, title: 'hand the FIELD to helium: the cloud of electron 2 given electron 1 at the marked point', onChange: (v) => { on = v; api.setOn(v); } });
  r0.appendChild(onSw.root);
  const bSeg = seg({ label: 'HYLLERAAS TERMS', value: 'six', options: [
    { id: 'one', label: '1', title: 'e^{−ζs}: the screened product, ζ = 27/16' }, { id: 'three', label: '3', title: 'Hylleraas 1929: {1, u, t²}' },
    { id: 'six', label: '6', title: '{1, u, t², s, s², u²}' }, { id: 'ten', label: '10', title: 'ten terms: within a millihartree of exact' }],
    onChange: (v) => { basis = v; sol = hylleraas(BASES[basis]); refresh(); api.repaint(true); } });
  r0.appendChild(bSeg.root);
  const r1row = el('div', 'row tight', host);
  const kR = knob({ label: 'ELECTRON 1  r₁', min: 0.05, max: 3, value: 0.8, fmt: (v) => v.toFixed(2) + ' a₀', onInput: (v) => { r1 = v; x1v = null; api.repaint(true); refresh(); } }); r1row.appendChild(kR.root);
  const kT = knob({ label: 'ELECTRON 1  θ₁', min: 0, max: Math.PI, value: 0, fmt: (v) => (v * 180 / Math.PI).toFixed(0) + '°', onInput: (v) => { th1 = v; x1v = null; api.repaint(true); refresh(); } }); r1row.appendChild(kT.root);
  const rr = el('div', 'row tight', host);
  const roE = readout({ label: 'E  variational · exact  (hartree)', value: '—', sub: '' });
  const roZ = readout({ label: 'ζ · Kato cusp (½)', value: '—', sub: '' });
  const roH = readout({ label: 'CORRELATION HOLE', value: '—', sub: 'ρ(x₂ = x₁ | x₁) ÷ ρ(x₂ = −x₁ | x₁)' });
  rr.appendChild(roE.root); rr.appendChild(roZ.root); rr.appendChild(roH.root);
  el('div', 'note', host).innerHTML = '<b>Helium, the hard way.</b> Two electrons, one nucleus of charge 2, no mean field: Hylleraas\'s ψ = e^{−ζs}Σc·s^a t^b u^c in s = r₁+r₂, t = r₁−r₂, u = r₁₂. Every matrix element is <b>EXACT</b> (a finite sum of factorials); the energy is <b>VARIATIONAL</b>, a rigorous upper bound on the exact −2.903724 — one term gives −2.8477, Hylleraas\'s three −2.9024, ten terms come within a millihartree. The cloud shown is <b>the conditional density of electron 2 given electron 1</b> at the marked point, ρ(x₂ | x₁) ∝ |ψ(x₁, x₂)|²: its <b>shape</b> is the Born rule and nothing else (the brightness is normalised to the frame\'s peak — a rendering choice — so it does not track the conditional normalisation as electron 1 moves). Move electron 1 and the cloud of electron 2 moves away from it — that is electron correlation, and the entanglement of the singlet pair, made visible; the Kato cusp ∂ψ/∂u = ψ/2 at coalescence is the two electrons feeling each other. Position space; the atom\'s windows stand down while helium holds the field.';
  function refresh() {
    roE.set(`${sol.E.toFixed(5)} · ${EXACT_E.toFixed(6)}`, sol.E > EXACT_E ? 'ok' : 'bad');
    roE.setSub(`${sol.terms.length} terms · above exact by ${((sol.E - EXACT_E) * 1000).toFixed(2)} mEh · known anchor ${KNOWN[basis] !== undefined ? KNOWN[basis] : '—'}`);
    const cusp = cuspRatio(sol);
    roZ.set(`${sol.zeta.toFixed(4)} · ${Number.isFinite(cusp) ? cusp.toFixed(3) : '—'}`, Number.isFinite(cusp) && Math.abs(cusp - 0.5) < 0.15 ? 'ok' : '');
    const p = x1(), same = psiPair(sol, p, p) ** 2, opp = psiPair(sol, p, [-p[0], -p[1], -p[2]]) ** 2;
    roH.set(opp > 0 ? (same / opp).toFixed(4) : '—', same < opp ? 'ok' : 'warn');
  }
  refresh();
  return { update() {}, get on() { return on; }, setOn(v) { on = !!v; if (onSw.set) onSw.set(on); api.setOn(on); }, get sol() { return sol; }, setBasis(b) { basis = b; bSeg.set(b); sol = hylleraas(BASES[b]); refresh(); },
    get x1() { return x1(); }, place(r, th) { r1 = r; th1 = th; x1v = null; if (kR.set) kR.set(r); if (kT.set) kT.set(th); refresh(); }, placeAt(p) { x1v = p.slice(); r1 = Math.hypot(...p); th1 = r1 > 0 ? Math.acos(Math.max(-1, Math.min(1, p[2] / r1))) : 0; if (kR.set) kR.set(r1); if (kT.set) kT.set(th1); refresh(); }, fieldModes() { return conditionalModes(sol, x1()); }, get half() { return 4; } };
}
