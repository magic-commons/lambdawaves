/* lab/windows/spectrum.js — the SPECTRUM card (0.5.2 R2a; moved verbatim out of lab/rack.js boot()), created at the card's seat; the five appends stay
 * there.  §0's consts, schedule, page, the rack, wState and the controller's names are handed over (backward); the windows, the gas and the layout made
 * later in boot() are read through their slots inside callbacks (forward).  It registers on app.w what a moved reader needs; boot() destructures the return. */
import { TIER } from '../rack.js';
import { el, knob, seg, trig, readout, group, mathPlain } from '../mir/kit.js';
import { BASIS, stateOf } from '../hydrogen.js';
import { getHamiltonian, setHamiltonian, HAMILTONIANS, setZ, getZ } from '../hamiltonian.js';
import { ATOMS, configOf } from '../atoms.js';
import { createSpectrum } from '../spectrum.js';
import { MOLECULE_BY_ID } from '../molecules.js';
import { stateLatex, moleculeLatex } from '../latex-state.js';
import { createRegisterSturmian } from '../sturmianreg.js';
export function createSpectrumCard(app) {
  const { ui, device, reg, hNote, clock, energyOf, sturm, labelExpect } = app, { schedule, page } = app.loop, { rack } = app.host, { wState } = app.w;   // backward
  const { rotRate, busy, busySync, warmArm, touchState, setReference, api } = app.ctl;   // the controller's, filled before its seat returned
  const wSpec = device({ id: 'spectrum', eyebrow: 'SPECTRUM', status: '' });
  app.w.wSpec = wSpec;
  rack.appendChild(wSpec.root);
  /* 0.3.3 · wave 135 · THE COPY.  SPECTRUM's ⧉ is the INFO panels' ⧉ (window-chrome.js): the same class, the same glyph,
     the same seat before the fold — the kit already styles `.dev-copy` in the power button's box and tokens (base.css)
     and stands it down on a phone (skin.css §5), where EDIT › COPY the state as LaTeX is the road.  What it copies is
     the state, not the panel's text: copyLatex() below. */
  { const util = wSpec.root.querySelector('.dev-util'), b = el('button', 'dev-copy', null, '⧉'); b.type = 'button';
    b.title = 'Copy the state as LaTeX'; b.setAttribute('aria-label', 'Copy the state as LaTeX');
    util.insertBefore(b, util.querySelector('.dev-fold')); b.addEventListener('click', (e) => { e.stopPropagation(); copyLatex(); }); }
  {
    const hamGroup = group(wSpec.body, 'HAMILTONIAN');
    const rh = el('div', 'row tight', hamGroup);
    ui.hamSeg = seg({ label: 'OPERATOR', value: 'hydrogen', options: [
      { id: 'hydrogen', label: 'HYDROGEN', title: 'E = −1/(2n²); every window is a theorem about it' },
      { id: 'qho', label: 'OSCILLATOR', title: 'Harmonic oscillator levels with spacing ħω' },
      { id: 'well', label: 'BOX', title: 'Infinite spherical well with a hard boundary' },
      { id: 'atom', label: 'ATOM', title: 'Self-consistent Xα central-field atom from H to Kr' },
      { id: 'cornell', label: 'QUARKONIUM', title: 'Solve heavy-quark levels with Numerov' }],
      onChange: (v) => { switchHamiltonian(v); if (v === 'well') app.w.enterBox(); if (v === 'atom') { app.w.wAtoms.root.hidden = false; app.w.wAtoms.root.classList.remove('closed'); } } });
    /* 0.4.0 S0 · wave 136 (audit F6): the two operators whose only editors are LEGACY windows.  ATOM opens ATOMS again (its
       element picker) by un-hiding it; QUARKONIUM's button is HIDDEN (its editor, QCD,
       left in 0.5.0 D9) — the button, not the value: an older project restoring `cornell` still sets it (set() paints any id). */
    ui.hamSeg.button('cornell').hidden = true;
    rh.appendChild(ui.hamSeg.root);
    ui.wellKnob = knob({ label: 'WELL RADIUS <m>a</m>', min: 3, max: 30, value: 10, fmt: (v) => v.toFixed(1) + ' a₀', onInput: (v) => { HAMILTONIANS.well.setRadius(v); app.w.gas.setRadius(v); hNote(); if (getHamiltonian().id === 'well') { reg.setEnergies(energyOf); wSpec.body.querySelectorAll('.sp-e[data-a]').forEach((e) => { e.textContent = `${api.energyOf(+e.dataset.a).toFixed(4)} ${api.unit()}`; }); schedule(TIER.REBUILD); } } });
    rh.appendChild(ui.wellKnob.root);
    {
      const rg = wSpec.row('tight');
      rg.appendChild(knob({ label: 'GAS  σ', min: 0.5, max: 3, value: 1.8, fmt: (v) => v.toFixed(2) + ' a₀', onInput: (v) => { app.state.gasWidth = v; } }).root);
      ui.gasBasis = seg({ label: 'GAS BASIS', value: 'reg', options: [{ id: 'reg', label: '91', title: 'the register\'s 91 labels (l ≤ 5): a packet no smaller than about a/6, launched on any axis' }, { id: 'axial', label: 'AXIAL 256', title: 'Use the larger axial box basis for narrower z packets' }], onChange: (v) => { app.state.gasAxial = v === 'axial'; if (!app.state.gasAxial) app.w.gas.off(); hNote(); schedule(TIER.RECONSTRUCT); } });
      rg.appendChild(ui.gasBasis.root);
      ui.gasSpeed = knob({ label: 'GAS  |k|', min: 0.1, max: 2.5, value: 0.8, log: true, fmt: (v) => v.toFixed(2), onInput: () => {} });
      rg.appendChild(ui.gasSpeed.root);
      rg.appendChild(trig({ label: 'LAUNCH', title: 'Launch a Gaussian packet in the box', onFire: () => {
        if (getHamiltonian().id !== 'well') { setHamiltonian('well'); switchHamiltonian('well'); if (ui.hamSeg) ui.hamSeg.set('well'); }
        const ax = app.sh.keyState.axis, a = HAMILTONIANS.well.radius, d = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] }[ax], k = ui.gasSpeed.get ? ui.gasSpeed.get() : 0.8;
        app.w.launchPacket(d.map((v) => -v * a / 2), d.map((v) => v * k), app.w.gasSigma(k));
      } }).root);
      ui.gasRo = readout({ label: 'GAS  packet held by the box', value: '—', sub: 'nothing launched' });
      rg.appendChild(ui.gasRo.root);
      rg.appendChild(trig({ label: 'COHERENT BOUNCE', title: 'Launch a non-spreading oscillator packet', onFire: () => app.w.coherentBounce() }).root);
      el('div', 'note', wSpec.body).innerHTML = '<b>Coherent bounce.</b> In the oscillator, an impulse moves the ground-state packet without changing its width. In the box, the packet disperses and reflects from the wall.';
      el('div', 'note', wSpec.body).innerHTML = '<b>Gas packet.</b> LAUNCH projects a Gaussian packet into the box basis. CAPTURED reports how much fits. Ctrl-drag on the field sets its launch point, direction, and strength.';
    }
    /* WAVE 68 · `step: 1`, and it is the only knob in the lab that lacked one.  Without it an arrow
       moved 1/100 of the travel = 0.05 = a TWENTIETH of an integer, so eleven real presses produced
       TWO announced values while `aria-valuenow` walked 1.05 … 1.55 through Z values the register
       cannot hold.  A dial whose `fmt` rounds has a lattice; the travel law has to know about it. */
    ui.zKnob = knob({ label: 'Z  (ion)', min: 1, max: 6, value: 1, step: 1, fmt: (v) => 'Z = ' + Math.round(v), onInput: (v) => { setZ(Math.round(v)); if (getHamiltonian().id === 'hydrogen') switchHamiltonian('hydrogen'); } });
    rh.appendChild(ui.zKnob.root);
    ui.elemKnob = knob({ label: 'ELEMENT  Z', min: 1, max: 36, value: 10, step: 1, fmt: (v) => 'Z = ' + Math.round(v) + '  ' + ATOMS[Math.max(0, Math.min(35, Math.round(v) - 1))].symbol, onChange: (v) => setElement(Math.round(v)) });
    rh.appendChild(ui.elemKnob.root);
    {
      const rs = wSpec.row('tight');
      ui.scaleSeg = seg({ label: 'SCALE  ·  the exponent of the 91 radials  (hydrogen operator only)', value: 'hydrogen', options: [
        { id: 'hydrogen', label: 'HYDROGEN  1/n', title: 'Use standard hydrogen radial functions' },
        { id: 'sturmian', label: 'STURMIAN  λ', title: 'Use one common radial exponent λ for every label' }],
        onChange: (v) => setSturmian({ on: v === 'sturmian' }) });
      rs.appendChild(ui.scaleSeg.root);
      ui.lambdaKnob = knob({ label: 'λ  SCALE', min: 0.25, max: 3, value: 1, fmt: (v) => 'λ = ' + v.toFixed(3), onInput: (v) => { if (sturm.on) setSturmian({ lambda: v }); else sturm.lambda = Math.max(0.25, Math.min(3, v)); } });
      ui.lambdaKnob.root.title = 'Set the Sturmian exponent; Shift is finer; double-tap resets';
      ui.lambdaKnob.setDisabled(true);
      rs.appendChild(ui.lambdaKnob.root);
      ui.sturmRo = readout({ label: 'SCALE', value: 'HYDROGEN 1/n', cls: 'two', sub: 'the shipped radials · λ acts once STURMIAN is on' });
      rs.appendChild(ui.sturmRo.root);
      el('div', 'note', wSpec.body).innerHTML = '<b>Radial scale.</b> HYDROGEN uses the standard n-dependent orbitals. STURMIAN gives all labels one exponent λ and evolves them in a non-orthogonal basis. Controls that require diagonal hydrogen phases are disabled while it is active.';
    }
    el('div', 'note', wSpec.body).innerHTML = '<b>Hamiltonian.</b> Z rescales hydrogen-like ions. OSCILLATOR uses equally spaced levels; BOX uses spherical-well levels; ATOM and QUARKONIUM load numerical radial tables. Windows tied to hydrogen identities pause under other operators.';
  }
    el('div', 'note', wSpec.body).innerHTML = '<b>Atom operator.</b> Uses the selected element’s self-consistent Xα central field. Occupied shells have drawable radial functions; ° marks virtual shells with energy only. Momentum space is unavailable. See ATOMS for Δ-SCF and −ε values.';
  api.hamiltonian = () => sturm.P ? sturmSpectrum() : getHamiltonian().spectrum;          // W-STURMIAN: the eigen ladder under the scale
  /* wave 50: THE RATE WAS MISSING HERE.  The register evolves label a at energyOf(a) = H.energy(a) · rates[a]
     (`energyOf` at the top of boot(), what reg.setEnergies is given), and this — the API every reader prints from, SPECTRUM's Eh and
     the digests — returned H.energy(a) alone, so with any RATE ≠ 1 the card printed an energy the state was
     not moving with.  It is the same function now.  (Under STURMIAN the labels are not eigenstates, RATE is
     refused there, and the label's ⟨a|H|a⟩/⟨a|S|a⟩ stands.) */
  api.energyOf = (a) => sturm.P ? labelExpect(a) : energyOf(a);
  api.rateDisabled = () => !!sturm.P;
  api.rateNote = () => 'RATE is a diagonal-phase feature (a multiplier on one label\'s own E): off under STURMIAN, where the labels are not eigenstates — switch SCALE back to HYDROGEN';
  api.selectEigen = (k) => selectEigen(k);
  api.unit = () => (getHamiltonian().unit === 'hartree' ? 'Eh' : getHamiltonian().unit);
  api.labelOf = (s) => getHamiltonian().labelOf(s);
  const spectrum = createSpectrum(wSpec.body, api);
  app.w.spectrum = spectrum;
  { const kids = [...wSpec.body.children], i = kids.findIndex((k) => k.classList.contains('ladder')); const h=kids[0]; for(const k of kids.slice(1,Math.max(0,i)))h.appendChild(k); wSpec.body.appendChild(h); }
  /** NORMALIZE, and say what it did — a unit-norm state looks the same afterwards, which is why it seemed to do nothing */
  function toggleFullscreen() { const d = document; if (d.fullscreenElement) { if (d.exitFullscreen) d.exitFullscreen(); } else { const e = d.documentElement; const f = e.requestFullscreen || e.webkitRequestFullscreen; if (f) try { f.call(e); } catch (err) {} } }
  function normalizeNow() {
    const n = reg.normalize(); touchState();
    const nm = sturm.P ? '⟨c|S|c⟩^½' : '‖c‖';                                     // W-STURMIAN: the S-norm is the norm
    const msg = Math.abs(n - 1) < 5e-4 ? nm + ' was 1 already · nothing to do' : nm + ' ' + n.toFixed(4) + ' → 1';
    wState.setStatus(msg, 'live'); wSpec.setStatus(msg, 'live');
    setTimeout(() => { wState.setStatus('changes c'); wSpec.setStatus(...specStatus()); }, 1800);
  }
  app.w.normalizeNow = normalizeNow;
  /** THE COPY (0.3.3 · wave 135): the populated register at the clock's t — c(t), the mix while A/B plays — as the notebook's
   *  LaTeX in chemistry order (lab/latex-state.js), through copyDigest's one clipboard road and its `copied` flash.  SPECTRUM's
   *  status line says what went: it is where the ⧉ is.  An empty register says so and writes nothing.
   *  0.4.0 S0 · wave 136: under a MOLECULAR field owner the copy is the MOLECULE's page (moleculeLatex: the formula, RHF/basis,
   *  E, the ε ladder), never greyed — SPECTRUM only folds there now (moleculeMode), so its own list is not what the field shows. */
  let copySaid = 0;                                                  // the status restore of the last copy: a second press restarts it
  function copyLatex() {
    let text, said;
    if (app.state.chem && app.state.chem.on) {
      const row = app.state.chem && app.state.chem.on ? MOLECULE_BY_ID.get(app.state.chem.preset()) : null, sol = row ? app.state.chem.solution() : null;
      const ground = sol && sol.key === app.state.chem.preset() + '|' + app.state.chem.basis + '|' + row.charge ? sol : null;   // chemview's own solve key: never the previous molecule's ladder
      text = moleculeLatex({ molecule: row, basis: app.state.chem && app.state.chem.basis, charge: row && row.charge, ground });
      said = text ? mathPlain(row.formula) + '’s page as LaTeX' : row ? 'nothing to copy — ' + mathPlain(row.formula) + ' is still solving' : 'nothing to copy — this molecule has no page';
    } else {
      const c = reg.at(clock.t), H = getHamiltonian();
      const states = reg.populated().map((a) => ({ n: BASIS[a].n, l: BASIS[a].l, m: BASIS[a].m, re: c.re[a], im: c.im[a] }));
      text = stateLatex({ states, H }); const n = text ? text.split('\n')[0].split('$').length >> 1 : 0;
      said = text ? n + (n === 1 ? ' state' : ' states') + ' as LaTeX' : 'nothing to copy — the register is empty';
    }
    wSpec.setStatus(said, text ? 'live' : 'warn');
    clearTimeout(copySaid); copySaid = setTimeout(() => wSpec.setStatus(...specStatus()), 1800);
    return text ? app.sh.layout.copyText('spectrum', text) : Promise.resolve('');
  }
  function switchHamiltonian(id) {
    if (!app.state.warmTimer && !app.state.warmIdle && !page.hidden) warmArm(120);       // LA5: the kick tables are keyed on the operator — warm the new one in idle slices
    const H = setHamiltonian(id);
    if (id !== 'well' && app.w.gas.on) { app.w.gas.off(); schedule(TIER.RECONSTRUCT); }
    reg.setEnergies(energyOf);
    if (!H.stark && reg.field.Fz !== 0) { reg.setField({ Fz: 0 }); if (ui.fz) ui.fz.set(0); }
    if (H.noMomentum && app.state.space === 'p') { app.state.space = 'x'; if (ui.spaceSeg) ui.spaceSeg.set('x'); }
    for (const w of [app.w.wOrb, app.w.wVor, app.w.wSlice, app.w.wLad]) if (w) w.root.hidden = !H.hydrogenTheorems;
    wSpec.setStatus(hamLabel(), H.id === 'hydrogen' ? '' : 'live');
    wSpec.body.querySelectorAll('.sp-e[data-a]').forEach((e) => { e.textContent = `${api.energyOf(+e.dataset.a).toFixed(4)} ${api.unit()}`; });   // wave 50: the API, so the RATE is in the number the card shows
    wSpec.body.querySelectorAll('.sp-nm[data-a]').forEach((e) => { e.textContent = H.labelOf(BASIS[+e.dataset.a]); });
    if (sturm.on) { applySturmian(); return; }                        // W-STURMIAN: re-arm (or stand down) the scale under the operator now in force
    app.state.refSnapshot = null; app.state.pendingRef = null;
    schedule(TIER.REBUILD);
  }


  const sturmLabel = () => `STURMIAN · λ ${sturm.lambda.toFixed(3)} · Z ${getZ()} · 91 labels`;
  /* the SAME sentence switchHamiltonian writes (wave 44): it used to drop the element, so an UNDO of an ELEMENT
     change or of FILL THE VALENCE left the status reading "ATOM  Xα(2/3) + Latter tail" with no atom named */
  const hamLabel = () => { const H = getHamiltonian(); return H.id === 'atom' ? H.label + '  ·  ' + H.short : H.label; };
  const specStatus = () => sturm.P ? [sturmLabel(), 'live'] : [hamLabel(), getHamiltonian().id === 'hydrogen' ? '' : 'live'];
  function setSturmian(o = {}) {
    if (o.on !== undefined) sturm.on = !!o.on;
    if (o.lambda !== undefined) sturm.lambda = Math.max(0.25, Math.min(3, +o.lambda || 1));
    applySturmian();
    return { on: sturm.on, lambda: sturm.lambda, active: !!sturm.P };
  }
  function applySturmian(keepAnchor = false) {
    const H = getHamiltonian(), want = sturm.on && H.id === 'hydrogen';
    if (want && reg.transition) { reg.clearTransition(clock.t); if (ui.abSw) ui.abSw.set(false); }   // the mix is a diagonal-phase feature: frozen as the state
    const c = keepAnchor ? null : reg.at(clock.t);                                                     // the state NOW, continuous across the change
    if (want) {
      const t0 = performance.now();
      sturm.P = createRegisterSturmian(sturm.lambda, { Z: getZ() }); sturm.rec = sturm.P.records(); sturm.buildMs = performance.now() - t0;
      if (app.state.space === 'p') { app.state.space = 'x'; if (ui.spaceSeg) ui.spaceSeg.set('x'); }                      // momentum space is not built for the scaled radials
      reg.setPropagator(sturm.P);
    } else { sturm.P = null; sturm.rec = null; reg.setPropagator(null); reg.setEnergies(energyOf); }
    if (c) reg.anchorFrom(c.re, c.im, clock.t);
    const on = !!sturm.P;
    if (ui.scaleSeg) ui.scaleSeg.set(sturm.on ? 'sturmian' : 'hydrogen');
    if (ui.lambdaKnob) { ui.lambdaKnob.set(sturm.lambda); ui.lambdaKnob.setDisabled(!on); }
    const keep = (elm, title) => { if (elm.dataset.title0 === undefined) elm.dataset.title0 = elm.title || ''; elm.title = on ? title : elm.dataset.title0; };
    if (ui.abSw) { ui.abSw.root.disabled = on; ui.abSw.root.classList.toggle('disabled', on); keep(ui.abSw.root, 'A / B TRANSITION is a diagonal-phase feature (two exact diagonal evolutions mixed): off under STURMIAN — switch SCALE back to HYDROGEN'); }
    if (ui.abOmega) ui.abOmega.setDisabled(on);
    if (ui.abRo && !on && /STURMIAN/.test(ui.abRo.root.textContent)) { ui.abRo.set('—  /  —', ''); ui.abRo.setSub('store two states, then TRANSITION plays A → B → A at Ω'); }
    if (ui.fz) { ui.fz.setDisabled(on); if (on) ui.fz.set(0); }
    /* wave 40: e^{−iθK_z} and e^{iαL²} are moves inside a COULOMB SHELL — written in a degeneracy the Sturmian
       scale does not have (its eigenvalues are variational, its shells are not n²-fold), so they stand down too */
    if (ui.kzKnob) { ui.kzKnob.setDisabled(on); keep(ui.kzKnob.root, 'STARK K_z is an SO(4) rotation inside a Coulomb shell: off under STURMIAN — switch SCALE back to HYDROGEN'); }
    if (ui.defKnob) { ui.defKnob.setDisabled(on); keep(ui.defKnob.root, 'DEFECT L² is a wait under the shell\'s l-dependent phase: off under STURMIAN — switch SCALE back to HYDROGEN'); }
    /* AND THE TWO RATES WITH THEM — the STORED number, not just the dial.  A rate left running into
       a scale change would go on turning a register the operator has no business turning, and
       switching back to HYDROGEN would find it already spun.  ROTATE z's rate is untouched: m is
       still m under the Sturmian scale, which is why its jog wheel is not disabled either. */
    if (on) { rotRate.kz = 0; rotRate.def = 0; }
    if (ui.kzRate) { ui.kzRate.setDisabled(on); if (on) ui.kzRate.set(0); keep(ui.kzRate.root, 'SPIN K_z drives an SO(4) rotation inside a Coulomb shell: off under STURMIAN — switch SCALE back to HYDROGEN'); }
    if (ui.defRate) { ui.defRate.setDisabled(on); if (on) ui.defRate.set(0); keep(ui.defRate.root, 'SPIN L² drives a wait under the shell\'s l-dependent phase: off under STURMIAN — switch SCALE back to HYDROGEN'); }
    if (ui.spaceSeg) { const b = ui.spaceSeg.button('p'); if (b) { b.disabled = on; keep(b, 'not built for the Sturmians: position space only under STURMIAN'); } }
    if (ui.spaceNote) ui.spaceNote.hidden = !on;
    for (const w of [app.w.wOrb, app.w.wVor, app.w.wSlice, app.w.wLad]) if (w) w.root.hidden = on || !H.hydrogenTheorems;
    if (app.w.wCalc) app.w.wCalc.root.hidden = on;   // theorems about hydrogen's eigenfunctions stand down
    wSpec.setStatus(...specStatus());
    wSpec.body.querySelectorAll('.sp-e[data-a]').forEach((e) => { e.textContent = `${api.energyOf(+e.dataset.a).toFixed(4)} ${api.unit()}`; });
    if (ui.sturmRo) paintSturmRo();
    app.state.refSnapshot = null; app.state.pendingRef = null; app.state.lastNmax = -1;
    touchState(); schedule(TIER.REBUILD);
  }
  /** the scale's readout: the ground eigenvalue, the occupied count, the S-norm and ⟨H⟩ of the state */
  function paintSturmRo() {
    sturm.roVersion = reg.version;
    if (!sturm.P) { ui.sturmRo.set(sturm.on ? 'STURMIAN · hydrogen operator only' : 'HYDROGEN 1/n', sturm.on ? 'warn' : ''); ui.sturmRo.setSub(sturm.on ? 'the scale acts under the HYDROGEN operator; switch the Hamiltonian back' : 'the shipped radials · λ acts once STURMIAN is on'); return; }
    const e = sturmEigen(); let occ = 0; for (const p of e.pop) if (p > 1e-6) occ++;
    ui.sturmRo.set(`λ = ${sturm.lambda.toFixed(3)} · E₀ = ${e.E[0].toFixed(5)} Eh · ${occ} occupied`, 'live');
    ui.sturmRo.setSub(`⟨c|S|c⟩ = ${e.norm.toFixed(4)} · ⟨H⟩ = ${e.energy.toFixed(5)} Eh · rank ${e.rank} · built in ${sturm.buildMs < 1 ? '< 1' : sturm.buildMs.toFixed(1)} ms · every E_k is an UPPER BOUND on level k of its (l, m)`);
  }
  /** the eigen-decomposition of the state: E_k, its population (the S-metric projection of c(t) — a constant of the motion), (l, m), the dominant n */
  function sturmEigen(t) {
    const P = sturm.P; if (!P) return null;
    const c = t === undefined ? { re: reg.re0, im: reg.im0 } : reg.at(t);
    return { E: Array.from(P.E), pop: Array.from(P.populations(c)), l: Array.from(P.lK), m: Array.from(P.mK), n: Array.from(P.nK), rank: P.rank, lambda: sturm.lambda, Z: getZ(), norm: P.norm(c), energy: P.energyOf(c) };
  }
  /** the energies THE CLOCK reads under the scale: the occupied eigenvalues (populations > 1e-6), Zeeman-shifted */
  const occupiedEigen = () => { const e = sturmEigen(), out = []; for (let k = 0; k < e.rank; k++) if (e.pop[k] > 1e-6) out.push(e.E[k] + reg.field.Bz * e.m[k] / 2); return out; };
  /* THE ENERGIES A PERIOD IS READ FROM — ONE expression, because TWO of them is how wave 58's review found a
     confident EXACT LOOP over a state with no period at all: capture.js was computing the psi period from
     reg.Ediag (the LABEL's ⟨H⟩ under a propagator) while periodNow() used the occupied eigenvalues. */
  function periodEnergies() { return sturm.P ? occupiedEigen() : reg.populated().map((a) => reg.Ediag(a)); }
  /** the ladder's descriptor under the scale (spectrum.js paints `eigen`) */
  function sturmSpectrum() {
    const e = sturmEigen(), Z = getZ();
    const eigen = e.E.map((E, k) => ({ k, E, pop: e.pop[k], n: e.n[k], label: `${'spdfgh'[e.l[k]]}${e.m[k] >= 0 ? '₊' : '₋'}${Math.abs(e.m[k])}` }));
    return { eigen, Emin: Math.min(e.E[0], -0.5 * Z * Z) * 1.02, Etop: 0, Emax: e.E[e.rank - 1], levels: [], levelKey: () => 0,
      footer: `S⁻¹H · λ ${sturm.lambda.toFixed(3)} · rank ${e.rank} · E > 0 pseudo-continuum`,
      caption: 'non-orthogonal basis: populations are projections ⟨C_k|S|c⟩ (the ladder) · a lane\'s energy is the label\'s ⟨H⟩, not an eigenvalue' };
  }
  /** load the k-th eigenvector (S-normalised, real) into the labels AT the current time: a stationary state of the scale */
  function selectEigen(k) {
    const P = sturm.P; if (!P || !(k >= 0 && k < P.rank)) return false;
    const e = P.eigenstate(k);
    reg.clear(); reg.anchorFrom(e.re, e.im, clock.t); app.state.lastNmax = -1;
    spectrum.select(-1); setReference(); app.w.shadowView.clearTrail(); touchState(); schedule(TIER.REBUILD);
    wSpec.setStatus(`eigenstate ${k} · E = ${P.E[k].toFixed(6)} Eh · ${'spdfgh'[P.lK[k]]}${P.mK[k] >= 0 ? '₊' : '₋'}${Math.abs(P.mK[k])} · stationary`, 'live');
    return true;
  }

  /** the ELEMENT knob: which atom the ATOM Hamiltonian solves (Z = 1 … 36); the register is re-read in it */
  function setElement(Z) {
    Z = Math.max(1, Math.min(36, Math.round(Z) || 1));
    busy.n++; busySync();                                              // wave 48: the atom is re-solved on a log mesh, twice, and Richardson-extrapolated — the mark says so
    let changed; try { changed = HAMILTONIANS.atom.configure(Z); } finally { busy.n = Math.max(0, busy.n - 1); busySync(); }
    if (ui.elemKnob) ui.elemKnob.set(Z);
    if (changed) { if (app.w.atomsView) app.w.atomsView.invalidate(); hNote(); if (getHamiltonian().id === 'atom') switchHamiltonian('atom'); else schedule(TIER.PRESENT); }
    return Z;
  }
  /** FILL THE VALENCE: the outermost occupied shell of the atom in force, every m of it equally and in phase */
  function fillValence() {
    if (getHamiltonian().id !== 'atom') { switchHamiltonian('atom'); if (ui.hamSeg) ui.hamSeg.set('atom'); }
    const cfg = configOf(HAMILTONIANS.atom.Z), sh = cfg[cfg.length - 1], amp = 1 / Math.sqrt(2 * sh.l + 1);
    reg.clear();
    for (let m = -sh.l; m <= sh.l; m++) reg.set(stateOf(sh.n, sh.l, m).index, amp, 0, clock.t);
    touchState(); schedule(TIER.REBUILD);
    const msg = `${HAMILTONIANS.atom.short} ${sh.n}${'spdfgh'[sh.l]} · ${2 * sh.l + 1} label${sh.l ? 's' : ''}, equal and in phase`;
    wState.setStatus(msg, 'live'); if (app.w.wAtoms) app.w.wAtoms.setStatus(msg, 'live');
    return { n: sh.n, l: sh.l, labels: 2 * sh.l + 1 };
  }
  app.w.switchHamiltonian = switchHamiltonian; app.w.applySturmian = applySturmian; app.w.setElement = setElement; app.w.fillValence = fillValence;   // persist reads them
  return { wSpec, spectrum, toggleFullscreen, normalizeNow, copyLatex, switchHamiltonian, setSturmian, applySturmian, paintSturmRo, sturmEigen, occupiedEigen, periodEnergies,
    selectEigen, setElement, fillValence };
}
