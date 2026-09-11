/* heliumview.js — the HELIUM window: Hylleraas's two-electron ground state, and the CONDITIONAL cloud of electron 2
 * given where electron 1 is.  ON hands the FIELD to that conditional density.
 *
 * Labels: the integrals are EXACT (algebraic), the energy VARIATIONAL (a rigorous upper bound, printed beside the
 * exact −2.903724), the picture is the Born rule — ρ(x₂ | x₁) ∝ |ψ(x₁, x₂)|² — with nothing interpretive added.
 */
import { hylleraas, BASES, EXACT_E, KNOWN, cuspRatio, conditionalModes, psiPair } from './helium.js';
import { el, seg, sw, knob, readout } from './mir/kit.js';

export function createHelium(host, api) {
  let basis = 'six', sol = null, solving = null, generation = 0, active = api.active ? !!api.active() : true, on = false, r1 = 0.8, th1 = 0, x1v = null;   // x1v: a point placed by hand on the field (shift-click), off the knobs' plane
  const ensureSol = () => { if (!sol) { generation++; sol = hylleraas(BASES[basis]); } return sol; };
  const x1 = () => x1v || [r1 * Math.sin(th1), 0, r1 * Math.cos(th1)];
  const r0 = el('div', 'row tight', host);
  const onSw = sw({ label: 'HELIUM ON', value: false, title: 'Show helium’s conditional density in the field', onChange: (v) => { on = v; api.setOn(v); } });
  r0.appendChild(onSw.root);
  const bSeg = seg({ label: 'HYLLERAAS TERMS', value: 'six', options: [
    { id: 'one', label: '1', title: 'e^{−ζs}: the screened product, ζ = 27/16' }, { id: 'three', label: '3', title: 'Hylleraas 1929: {1, u, t²}' },
    { id: 'six', label: '6', title: '{1, u, t², s, s², u²}' }, { id: 'ten', label: '10', title: 'ten terms: within a millihartree of exact' }],
    onChange: (v) => { basis = v; sol = null; generation++; refresh(); api.repaint(true); } });
  r0.appendChild(bSeg.root);
  const r1row = el('div', 'row tight', host);
  const kR = knob({ label: 'ELECTRON 1  r₁', min: 0.05, max: 3, value: 0.8, fmt: (v) => v.toFixed(2) + ' a₀', onInput: (v) => { r1 = v; x1v = null; api.repaint(true); refresh(); } }); r1row.appendChild(kR.root);
  const kT = knob({ label: 'ELECTRON 1  θ₁', min: 0, max: Math.PI, value: 0, fmt: (v) => (v * 180 / Math.PI).toFixed(0) + '°', onInput: (v) => { th1 = v; x1v = null; api.repaint(true); refresh(); } }); r1row.appendChild(kT.root);
  const rr = el('div', 'row tight', host);
  const roE = readout({ label: 'ENERGY · MODEL / REFERENCE (hartree)', value: '—', sub: '' });
  const roZ = readout({ label: 'ζ · Kato cusp (½)', value: '—', sub: '' });
  const roH = readout({ label: 'CORRELATION HOLE', value: '—', sub: 'ρ(x₂ = x₁ | x₁) ÷ ρ(x₂ = −x₁ | x₁)' });
  rr.appendChild(roE.root); rr.appendChild(roZ.root); rr.appendChild(roH.root);
  el('div', 'note', host).innerHTML = '<b>Model.</b> A Hylleraas basis approximates the correlated two-electron ground state. The energy approaches −2.903724 Eh as terms are added. The field shows electron 2 conditioned on electron 1 at the marker; brightness is normalised per frame. Position space only.';
  function prepare() {
    if (sol) return Promise.resolve(sol);
    if (solving) return solving;
    const mine = generation, requested = basis;
    if (api.loading) api.loading(true);
    const work = api.solve ? api.solve(requested) : new Promise((resolve) => requestAnimationFrame(() => setTimeout(() => resolve({ sol: hylleraas(BASES[requested]) }), 0)));
    solving = Promise.resolve(work).then((result) => {
      if (mine === generation && requested === basis && result && !result.error) sol = result.sol || result;
      if (sol && active) refresh();
      return sol;
    }).finally(() => {
      solving = null; if (api.loading) api.loading(false);
      if (!sol && (active || on)) prepare();
    });
    return solving;
  }
  function refresh() {
    if (!active && !on) return;
    if (!sol) { prepare(); return; }
    const solved = ensureSol();
    roE.set(`${solved.E.toFixed(5)} · ${EXACT_E.toFixed(6)}`, solved.E > EXACT_E ? 'ok' : 'bad');
    roE.setSub(`${solved.terms.length} terms · reference gap ${((solved.E - EXACT_E) * 1000).toFixed(2)} mEh`);
    const cusp = cuspRatio(solved);
    roZ.set(`${solved.zeta.toFixed(4)} · ${Number.isFinite(cusp) ? cusp.toFixed(3) : '—'}`, Number.isFinite(cusp) && Math.abs(cusp - 0.5) < 0.15 ? 'ok' : '');
    const p = x1(), same = psiPair(solved, p, p) ** 2, opp = psiPair(solved, p, [-p[0], -p[1], -p[2]]) ** 2;
    roH.set(opp > 0 ? (same / opp).toFixed(4) : '—', same < opp ? 'ok' : 'warn');
  }
  refresh();
  return { update() {}, prepare, get on() { return on; }, setOn(v) { on = !!v; if (on) ensureSol(); if (onSw.set) onSw.set(on); api.setOn(on); }, get sol() { return ensureSol(); }, get computed() { return !!sol; }, get basis() { return basis; }, setBasis(b) { if (!BASES[b]) return false; basis = b; bSeg.set(b); sol = null; generation++; refresh(); return true; },
    setActive(v) { const next = !!v; if (next === active) return; active = next; if (active) refresh(); },
    save() { return { on, basis, x1: x1().slice() }; }, load(o = {}) { if (typeof o.basis === 'string') this.setBasis(o.basis); if (Array.isArray(o.x1) && o.x1.length === 3 && o.x1.every(Number.isFinite)) this.placeAt(o.x1); if (o.on !== undefined) this.setOn(!!o.on); return this.save(); },
    get x1() { return x1(); }, place(r, th) { r1 = r; th1 = th; x1v = null; if (kR.set) kR.set(r); if (kT.set) kT.set(th); refresh(); }, placeAt(p) { x1v = p.slice(); r1 = Math.hypot(...p); th1 = r1 > 0 ? Math.acos(Math.max(-1, Math.min(1, p[2] / r1))) : 0; if (kR.set) kR.set(r1); if (kT.set) kT.set(th1); refresh(); }, fieldModes() { return conditionalModes(ensureSol(), x1()); }, get half() { return 4; } };
}
