/* lab/windows/spectrum.js — the SPECTRUM card (0.5.2 R2a; moved verbatim out of lab/rack.js boot()), created at the card's seat; the five appends stay
 * there.  §0's consts, schedule, page, the rack, wState and the controller's names are handed over (backward); the windows, the gas and the layout made
 * later in boot() are read through their slots inside callbacks (forward).  It registers on app.w what a moved reader needs; boot() destructures the return. */
import { TIER } from '../rack.js';
import { el, knob, seg, sw, trig, readout, group, mathPlain, fader, stepper } from '../mir/kit.js';
import { createEqualizer, EQ_PRESETS } from '../equalizer.js'; import { createEqAudio } from '../eq-audio.js'; import { createChord } from '../chord-audio.js';
import { VIEW } from '../field.js';
import { BASIS, stateOf } from '../hydrogen.js';
import { getHamiltonian, setHamiltonian, HAMILTONIANS, setZ, getZ, setMu, getMu, MASSES, onHamiltonian } from '../hamiltonian.js';
import { ATOMS, valenceShells, ZMAX } from '../atoms.js';
import { createSpectrum } from '../spectrum.js';
import { CATALOGUE } from '../catalogue.js';
import { stateLatex, moleculeLatex } from '../latex-state.js';
import { createRegisterSturmian } from '../sturmianreg.js';
const keepT = (elm, on, title) => { if (elm.dataset.title0 === undefined) elm.dataset.title0 = elm.title || ''; elm.title = on ? title : elm.dataset.title0; };
export function createSpectrumCard(app) {
  const { ui, device, reg, hNote, clock, appPlay, energyOf, sturm, labelExpect, mat, rates } = app, { schedule, page, MOTION } = app.loop, { rack } = app.host, { wState } = app.w;   // backward
  const { rotRate, busy, busySync, warmArm, touchState, setReference, api, field } = app.ctl;   // the controller's, filled before its seat returned
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
    /* 0.7.4 C1 · THE PICKER: ‹ SYSTEM ›, the kit's stepper over lab/catalogue.js — the operators with HYDROGEN, MOLECULES and LATTICE, each row's hover its
       word · oracle.  A window opens and leaves the Hamiltonian alone; the name reads back what owns the field; CENTRAL and CENTRAL › QUARKONIUM (0.8.0 G1)
       set their operator and open CENTRAL, its editor (an older project restoring `cornell` still lands).  `ui.hamSeg` keeps its name and set(id): persist, the verbs and LAUNCH read it. */
    const SYS = ['hydrogen', 'qho', 'well', 'atom', 'central', 'cornell', 'separable', 'molecules', 'lattice'].map((id) => CATALOGUE.find((r) => r.id === id)), tip = (r) => r.word + ' · ' + r.oracle.what;
    const sys = stepper({ label: 'SYSTEM', items: SYS.map((r) => ({ id: r.id, label: r.name.split(' ·')[0] })), value: 'hydrogen', cls: 'mol-step', onChange: (v) => {
      if (v === 'molecules' || v === 'lattice') app.sh.layout.reopen(v === 'molecules' ? 'chem' : v); else { switchHamiltonian(v); if (v === 'central' || v === 'cornell' || v === 'separable') app.sh.layout.reopen(v === 'separable' ? v : 'central'); if (v === 'well') app.w.enterBox(); if (v === 'atom') { app.w.wAtoms.root.hidden = false; app.w.wAtoms.root.classList.remove('closed'); } }
      ui.hamSeg.set(getHamiltonian().id); } });
    sys.name.addEventListener('click', () => document.querySelectorAll('.mir-pick-i[data-id]').forEach((b) => { const r = SYS.find((x) => x.id === b.dataset.id); if (r) b.title = tip(r); }));
    ui.hamSeg = { root: sys.root, get value() { return sys.get(); }, set(id) { sys.set(app.state.chem && app.state.chem.on ? 'molecules' : id); sys.root.title = tip(SYS.find((r) => r.id === sys.get()) || SYS[0]); } };
    ui.hamSeg.set('hydrogen');
    rh.appendChild(ui.hamSeg.root);
    ui.wellKnob = knob({ label: 'WELL RADIUS <m>a</m>', min: 3, max: 30, value: 10, fmt: (v) => v.toFixed(1) + ' a₀', onInput: (v) => { HAMILTONIANS.well.setRadius(v); app.w.gas.setRadius(v); hNote(); if (getHamiltonian().id === 'well') { reg.setEnergies(energyOf); wSpec.body.querySelectorAll('.sp-e[data-a]').forEach((e) => { e.textContent = spectrum.energyText(+e.dataset.a); }); schedule(TIER.REBUILD); } } });
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
    /* 0.8.1 T2 · MASS: μ/mₑ, the reduced mass — hydrogen's E → μE and r → r/μ on setZ's road (hamiltonian.js setMu); refused under another operator */
    const MASS = { 1: 1, ps: MASSES.positronium, muh: MASSES['muonic hydrogen'] }, setMass = (v) => { if (getHamiltonian().id === 'hydrogen') { setMu(v); hNote(); switchHamiltonian('hydrogen'); } else { ui.muKnob.set(getMu()); wSpec.setStatus('μ/mₑ scales hydrogen alone: the operator in force is ' + hamLabel(), 'warn'); } };
    ui.muKnob = knob({ label: 'μ/mₑ  (mass)', min: 0.5, max: 200, log: true, value: 1, fmt: (v) => 'μ = ' + +v.toPrecision(5), title: 'The reduced mass in mₑ: E → μE, r → r/μ (hydrogen only); double-tap resets to 1', onInput: setMass });
    const muSeg = seg({ aria: 'reduced mass', value: '1', options: [['1', '1'], ['ps', 'POSITRONIUM'], ['muh', 'MUONIC H']].map(([id, label]) => ({ id, label, title: `μ = ${+MASS[id].toPrecision(5)} mₑ` })), onChange: (id) => setMass(MASS[id]) });
    rh.append(ui.muKnob.root, muSeg.root); onHamiltonian(() => { ui.muKnob.set(getMu()); muSeg.set(Object.keys(MASS).find((id) => MASS[id] === getMu()) || ''); });
    ui.elemKnob = knob({ label: 'ELEMENT  Z', min: 1, max: ZMAX, value: 10, step: 1, fmt: (v) => 'Z = ' + Math.round(v) + '  ' + ATOMS[Math.max(0, Math.min(ZMAX - 1, Math.round(v) - 1))].symbol, onChange: (v) => setElement(Math.round(v)) });
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
  api.energyOf = (a) => sturm.P ? labelExpect(a) : Number.isNaN(getHamiltonian().energy(a)) ? NaN : energyOf(a);   // 0.8.0 G1: NaN, a level CENTRAL leaves unbound (the register holds it at 0)
  api.rateDisabled = () => !!sturm.P;
  api.rateNote = () => 'RATE is a diagonal-phase feature (a multiplier on one label\'s own E): off under STURMIAN, where the labels are not eigenstates — switch SCALE back to HYDROGEN';
  api.selectEigen = (k) => selectEigen(k);
  api.unit = () => (getHamiltonian().unit === 'hartree' ? 'Eh' : getHamiltonian().unit);
  api.labelOf = (s) => getHamiltonian().labelOf(s);
  const spectrum = createSpectrum(wSpec.body, api);
  ui.presetSel = spectrum.preset;   // iteration 008 S: the ‹ PRESET › stepper at the head (it left STATE); persist.js and the one road write its .value
  app.w.spectrum = spectrum; app.w.setSturmian = setSturmian; app.w.sturmEigen = sturmEigen; app.w.selectEigen = selectEigen;
  /* 0.6.0 B2 · THE BEAT EQUALIZER (lab/equalizer.js) under the ladder.  Cell (n, n′) of the 6 × 6 grid is the pair's beat in the picture,
     |Γ_nn′|·√(w_n w_n′) (w the shell populations), its colour the beat's log third — |ΔE| < 0.0263 Eh magenta, < 0.1130 orange, else yellow
     (the chord's own thirds: a creative choice, not a law).  A gain decoheres its shell from the others, never dims it.  A hydrogen
     position-space feature: anything else stands it down and clears the table.  syncEq() keys on what the table reads: cheap on a frame. */
  /* Iteration 002 (Josh, 2026-10-16): its OWN window, `equalizer` (an ATOMS window: MOLECULES mode hides it; closed until + or WINDOW opens it),
     polished as one MIXER (the DESIGN BOOSTER habit — the house's tokens, nothing new to learn): the grid at the screen's own pixels on the left
     (gapped cells, n along both edges, each shell's own diagonal ringed), each shell's fader on the row of its own n beside it; the colours are
     skin.css tokens (--eq-near · --eq-mid · --eq-far) and the ink is the card's.  AUDIO IN takes the faders from the MODULATION window's first
     AUDIO device (eq.audioTick, called by rack.js right after the model's feed). */
  const wEq = device({ id: 'equalizer', eyebrow: 'EQUALIZER', title: 'beat equalizer', status: '' }); wEq.root.classList.add('closed'); rack.appendChild(wEq.root);
  const eq = app.state.eq = createEqualizer(), gEq = group(wEq.body, ''), eqHead = el('div', 'row tight eq-head', gEq), mix = el('div', 'eq-mix', gEq), eqCv = el('canvas', 'eq-grid', mix), eqG = eqCv.getContext('2d');
  const eqStep = stepper({ aria: 'Equalizer preset', items: EQ_PRESETS.map((p) => ({ id: p.id, label: p.label })), value: eq.preset, cls: 'mol-step', onChange: (id) => { eq.setPreset(id); syncEq(true); hNote(); } });
  ui.eqPick = (id) => { eqStep.set(id); eq.setPreset(id); syncEq(true); hNote(); };   // 0.6.6 G1: the stepper's road for THE VERB TABLE's switch
  const eqRo = readout({ label: 'PURITY', value: '1.000', sub: 'pure' }), rFd = el('div', 'eq-faders', mix);
  const eqFd = [0, 1, 2, 3, 4, 5].map((i) => fader({ label: 'n ' + (i + 1), min: 0, max: 1, value: 1, fmt: (v) => Math.round(v * 100) + ' %', onInput: (v) => { eq.setGain(i, v); syncEq(true); }, onChange: hNote }));
  eqHead.append(eqStep.root, eqRo.root); for (const f of eqFd) rFd.appendChild(f.root);
  const aud = createEqAudio(app, { eq, host: gEq, sync: () => { eqKey = ''; syncEq(false); } });   // iteration 002: AUDIO IN (lab/eq-audio.js)
  el('div', 'note', gEq).textContent = 'the beats fade, the shells stay';
  /* 0.6.4 S2 · THE CHORD (lab/chord-audio.js): SOUND and LEVELS · BEATS, shown only while SETTINGS › AUDIO is on; not saved (a hand press each session) */
  const chord = app.state.chord = createChord({ reg, clock, motion: MOTION, onPlay: appPlay.onChange }), snd = el('div', null, gEq), sndCap = el('div', 'note', null), paintChord = () => { sndCap.textContent = chord.caption; };
  const sndSw = sw({ label: 'SOUND', value: false, title: 'SOUND — the populated levels as tones while THE play runs (a film stays silent)', onChange: (v) => { chord.set({ on: v }); paintChord(); } });
  el('div', 'row tight', snd).append(sndSw.root, seg({ label: '', value: 'levels', options: [{ id: 'levels', label: 'LEVELS' }, { id: 'beats', label: 'BEATS' }], onChange: (v) => { chord.set({ mode: v }); paintChord(); } }).root); snd.append(sndCap); snd.hidden = true;
  ui.setAudio = (v) => { snd.hidden = !v; if (!v && sndSw.get()) { sndSw.set(false); chord.set({ on: false }); } chord.retune(); paintChord(); };
  let eqKey = '', eqT = null, eqMode = 0;
  function syncEq(hand) {
    if (chord.retune() && !snd.hidden) paintChord();   // S2: keyed on version, RATE, mode — the bank moves only on change
    const H = getHamiltonian(), why = app.state.chem && app.state.chem.on ? 'MOLECULES owns the field' : sturm.P ? 'STURMIAN is on' : H.id !== 'hydrogen' ? 'the operator is not HYDROGEN' : H.mass ? H.mass + ' (its beats are written at μ = mₑ)' : app.state.space !== 'x' ? 'momentum space is on' : '';
    const key = why + eq.preset + eq.gains.join() + reg.version; if (key === eqKey) return; eqKey = key;
    const P = reg.populated(), pops = reg.re0.map((r, a) => r * r + reg.im0[a] ** 2), w = [0, 0, 0, 0, 0, 0]; for (const a of P) w[BASIS[a].n - 1] += pops[a];
    const t = why ? null : eq.table({ Z: getZ(), rates, populated: P, pops }), G = t && t.gamma, m = G ? t.mode : 0;
    if (t || eqT) { field.setEqualizer(t); schedule(TIER.RECONSTRUCT); } eqT = eq.last = t;
    gEq.classList.toggle('eq-off', !!why); gEq.title = why ? 'the equalizer is a hydrogen position-space feature: ' + why : ''; eqFd.forEach((f, i) => { f.setDisabled(!!why || aud.on); f.set(eq.gains[i]); });
    eqStep.set(eq.preset); eqRo.set(G ? t.purity.toFixed(3) : '1.000'); eqRo.setSub(t && !G ? t.gate : G && t.repaired ? 'repaired' : ['pure', 'mixture · no phase', 'signed · relative floor 2·10⁻⁴'][m]);
    if (hand && m === 2 && eqMode !== 2) { mat.view = VIEW.real; ui.viewSeg.set('real'); wSpec.setStatus('a signed table: VIEW is Re ψ, its lobes in two colours', 'live'); }
    eqMode = m; const nn = app.state.eqNoNodes = !!(G && m === 1 && t.lambdaMin > 1e-3 * t.lambda[5]);   // E4: a positive-definite mixture has no zeros
    for (const b of [ui.vorOn, ui.pOn && ui.pOn.root]) if (b) { b.disabled = nn; b.classList.toggle('disabled', nn); keepT(b, nn, `the equalized picture has no nodes (λ_min = ${nn ? t.lambdaMin.toPrecision(3) : ''})`); }
    const cell = Array.from({ length: 36 }, (_, i) => (G ? Math.hypot(G[2 * i], G[2 * i + 1]) : 1) * Math.sqrt(w[i / 6 | 0] * w[i % 6])), top = Math.max(...cell) || 1;
    drawGrid(cell, top);
  }
  /** the 6 × 6 grid at device pixels: n along the top and the left, a faint well per cell, the beat's third as its colour at |cell| / max, the diagonal ringed */
  function drawGrid(cell, top) {
    const css = eqCv.clientWidth || 132, dpr = Math.min(2, devicePixelRatio || 1), px = Math.round(css * dpr), cs = getComputedStyle(eqCv);
    if (eqCv.width !== px) eqCv.width = eqCv.height = px;
    const C = ['--eq-near', '--eq-mid', '--eq-far'].map((v) => cs.getPropertyValue(v).trim() || '#888'), pad = 14 * dpr, sz = (px - pad) / 6, gap = Math.max(1, 2 * dpr), r = 3 * dpr;
    const box = (x, y, w, h) => { eqG.beginPath(); if (eqG.roundRect) eqG.roundRect(x, y, w, h, r); else eqG.rect(x, y, w, h); };
    eqG.clearRect(0, 0, px, px); eqG.globalAlpha = 1; eqG.fillStyle = eqG.strokeStyle = cs.color; eqG.font = `${9 * dpr}px ${cs.fontFamily}`; eqG.textAlign = 'center'; eqG.textBaseline = 'middle';
    for (let i = 0; i < 6; i++) { eqG.globalAlpha = 0.5; eqG.fillText(String(i + 1), pad + (i + 0.5) * sz, pad / 2); eqG.fillText(String(i + 1), pad / 2, pad + (i + 0.5) * sz); }
    cell.forEach((s, i) => { const n = (i / 6 | 0) + 1, k = i % 6 + 1, dE = getZ() ** 2 * Math.abs(1 / (n * n) - 1 / (k * k)) / 2, x = pad + (k - 1) * sz + gap / 2, y = pad + (n - 1) * sz + gap / 2, w = sz - gap;
      eqG.globalAlpha = 0.07; eqG.fillStyle = cs.color; box(x, y, w, w); eqG.fill();
      if (s > 0) { eqG.globalAlpha = s / top; eqG.fillStyle = dE < 0.0263 ? C[0] : dE < 0.113 ? C[1] : C[2]; box(x, y, w, w); eqG.fill(); }
      if (n === k) { eqG.globalAlpha = 0.35; eqG.lineWidth = dpr; box(x + dpr / 2, y + dpr / 2, w - dpr, w - dpr); eqG.stroke(); } });
    eqG.globalAlpha = 1;
  }
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
  app.w.normalizeNow = normalizeNow; app.w.toggleFullscreen = toggleFullscreen; app.w.copyLatex = copyLatex; app.w.periodEnergies = periodEnergies;
  /** THE COPY (0.3.3 · wave 135): the populated register at the clock's t — c(t), the mix while A/B plays — as the notebook's
   *  LaTeX in chemistry order (lab/latex-state.js), through copyDigest's one clipboard road and its `copied` flash.  SPECTRUM's
   *  status line says what went: it is where the ⧉ is.  An empty register says so and writes nothing.
   *  0.4.0 S0 · wave 136: under a MOLECULAR field owner the copy is the MOLECULE's page (moleculeLatex: the formula, RHF/basis,
   *  E, the ε ladder), never greyed — SPECTRUM only folds there now (moleculeMode), so its own list is not what the field shows. */
  let copySaid = 0;                                                  // the status restore of the last copy: a second press restarts it
  function copyLatex() {
    let text, said;
    if (app.state.chem && app.state.chem.on) {
      const row = app.state.chem && app.state.chem.on ? app.state.chem.row() : null, sol = row ? app.state.chem.solution() : null;
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
    const H = setHamiltonian(id); if (app.hooks.status) app.hooks.status();   // 0.5.4 P4: the STATUS row speaks for the operator in force
    if (id !== 'well' && app.w.gas.on) { app.w.gas.off(); schedule(TIER.RECONSTRUCT); }
    reg.setEnergies(energyOf);
    if (!H.stark && reg.field.Fz !== 0) { reg.setField({ Fz: 0 }); if (ui.fz) ui.fz.set(0); }
    if (H.noMomentum && app.state.space === 'p') { app.state.space = 'x'; if (ui.spaceSeg) ui.spaceSeg.set('x'); }
    for (const w of [app.w.wOrb, app.w.wVor, app.w.wSlice, app.w.wLad]) if (w) w.root.hidden = !H.hydrogenTheorems;
    wSpec.setStatus(hamLabel(), H.id === 'hydrogen' ? '' : 'live');
    wSpec.body.querySelectorAll('.sp-e[data-a]').forEach((e) => { e.textContent = spectrum.energyText(+e.dataset.a); });   // wave 50: the API, so the RATE is in the number the card shows
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
    const H = getHamiltonian(), want = sturm.on && H.id === 'hydrogen' && getMu() === 1;   // 0.8.1 T2: the Sturmian register is built at μ = mₑ and stands down under a mass
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
    const keep = (elm, title) => keepT(elm, on, title);
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
    wSpec.body.querySelectorAll('.sp-e[data-a]').forEach((e) => { e.textContent = spectrum.energyText(+e.dataset.a); });
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

  /** the ELEMENT knob: which atom the ATOM Hamiltonian solves (Z = 1 … 86, H … Rn); the register is re-read in it */
  function setElement(Z) {
    Z = Math.max(1, Math.min(ZMAX, Math.round(Z) || 1));
    busy.n++; busySync();                                              // wave 48: the atom is re-solved on a log mesh, twice, and Richardson-extrapolated — the mark says so
    let changed; try { changed = HAMILTONIANS.atom.configure(Z); } finally { busy.n = Math.max(0, busy.n - 1); busySync(); }
    if (ui.elemKnob) ui.elemKnob.set(Z);
    if (changed) { if (app.w.atomsView) app.w.atomsView.invalidate(); hNote(); if (getHamiltonian().id === 'atom') switchHamiltonian('atom'); else schedule(TIER.PRESENT); }
    return Z;
  }
  /** LOAD VALENCE (iteration 008; once FILL THE VALENCE — the verb keeps its name; 008 Q: every subshell outside the noble-gas core, Josh
   *  10-19 "load all the subshells, the thumbnail only shows the highest orbital"): each valence subshell (`valenceShells`: Fe 4s and 3d,
   *  Au 6s, 4f and 5d) at the weight of its electrons, every m of it equal and all in phase — the spherical average of the valence density.
   *  A shell the basis does not hold (n = 7 before A7) is left out and said. */
  function fillValence() {
    if (getHamiltonian().id !== 'atom') { switchHamiltonian('atom'); if (ui.hamSeg) ui.hamSeg.set('atom'); }
    const shells = valenceShells(HAMILTONIANS.atom.Z), held = shells.filter((c) => stateOf(c.n, c.l, 0)), gone = shells.filter((c) => !held.includes(c));
    const N = held.reduce((a, c) => a + c.occ, 0), top = held[held.length - 1] || shells[shells.length - 1];
    reg.clear(); let labels = 0;
    for (const c of held) { const amp = Math.sqrt(c.occ / N / (2 * c.l + 1)); for (let m = -c.l; m <= c.l; m++) { reg.set(stateOf(c.n, c.l, m).index, amp, 0, clock.t); labels++; } }
    touchState(); schedule(TIER.REBUILD);
    const sup = (k) => String(k).replace(/./g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]), name = (c) => `${c.n}${'spdfgh'[c.l]}${sup(c.occ)}`;
    const msg = `${HAMILTONIANS.atom.short} · ${held.map(name).join(' ')} loaded · ${labels} label${labels === 1 ? '' : 's'}, in phase`
      + (gone.length ? ` · ${gone.map(name).join(' ')} past the basis (n ≤ 6), not loaded` : '');
    wState.setStatus(msg, 'live'); if (app.w.wAtoms) app.w.wAtoms.setStatus(msg, 'live');
    return { n: top.n, l: top.l, labels, shells: held.map((c) => ({ n: c.n, l: c.l, occ: c.occ })), past: gone.map((c) => ({ n: c.n, l: c.l, occ: c.occ })) };
  }
  app.w.switchHamiltonian = switchHamiltonian; app.w.applySturmian = applySturmian; app.w.setElement = setElement; app.w.fillValence = fillValence; app.w.occupiedEigen = occupiedEigen;   // persist reads them (occupiedEigen: the transport)
  return { wSpec, spectrum, toggleFullscreen, normalizeNow, copyLatex, switchHamiltonian, setSturmian, applySturmian, paintSturmRo, sturmEigen, occupiedEigen, periodEnergies,
    selectEigen, setElement, fillValence, syncEq };
}
