/* lab/windows/gas.js — the BOX rows of SPECTRUM's Hamiltonian group: WELL a · GAS σ · GAS |k| · BASIS · LAUNCH / BOUNCE · the GAS readout and the two notes
 * (021 G2, THE HINGE: moved verbatim out of lab/windows/spectrum.js, created right after it).  The rows go into SPECTRUM's own `.sp-ham-b` row and the
 * notes after its `.sp-ham-n`, where they stood; the gas, its launch and the bounce are kepler.js' (seated later), read through app.w inside callbacks.
 * The gas stands down when the operator leaves the BOX: once switchHamiltonian's line, now a listener on the one operator funnel (every
 * setHamiltonian in the app is followed by switchHamiltonian, so the moment is the same). */
import { TIER } from '../tier.js';
import { el, knob, seg, trig, readout } from '../mir/kit.js';
import { BASIS, NMAX } from '../hydrogen.js';
import { getHamiltonian, setHamiltonian, HAMILTONIANS, onHamiltonian } from '../hamiltonian.js';
export function createGas(app) {
  const { ui, reg, hNote, energyOf } = app, { schedule } = app.loop, { wSpec, spectrum, switchHamiltonian } = app.w;   // backward: SPECTRUM is seated just before
  const hamRows = { box: wSpec.body.querySelector('.sp-ham-b'), note: wSpec.body.querySelector('.sp-ham-n') };
  const hamBody = document.createDocumentFragment();   // the two notes, placed after the rows' note below (their seat in the group)
  ui.wellKnob = knob({ label: 'WELL <m>a</m>', title: 'WELL RADIUS a — the box of BOX and of the gas packet', min: 3, max: 30, value: 10, fmt: (v) => v.toFixed(1) + ' a₀', onInput: (v) => { HAMILTONIANS.well.setRadius(v); app.w.gas.setRadius(v); hNote(); if (getHamiltonian().id === 'well') { reg.setEnergies(energyOf); wSpec.body.querySelectorAll('.sp-e[data-a]').forEach((e) => { e.textContent = spectrum.energyText(+e.dataset.a); }); schedule(TIER.REBUILD); } } });
  {
    const rg = hamRows.box;
    rg.appendChild(ui.wellKnob.root);
    rg.appendChild(knob({ label: 'GAS  σ', title: 'GAS σ — the launched packet\'s width', min: 0.5, max: 3, value: 1.8, fmt: (v) => v.toFixed(2) + ' a₀', onInput: (v) => { app.state.gasWidth = v; } }).root);
    ui.gasSpeed = knob({ label: 'GAS  |k|', title: 'GAS |k| — the launch\'s momentum (LAUNCH and BOUNCE)', min: 0.1, max: 2.5, value: 0.8, log: true, fmt: (v) => v.toFixed(2), onInput: () => {} });
    rg.appendChild(ui.gasSpeed.root);
    ui.gasBasis = seg({ label: 'BASIS', cls: 'sp-vseg', value: 'reg', options: [{ id: 'reg', label: String(BASIS.length), title: `GAS BASIS · the register's ${BASIS.length} labels (l ≤ ${NMAX - 1}): a packet no smaller than about a/${NMAX}, launched on any axis` }, { id: 'axial', label: 'AXIAL', title: 'GAS BASIS · AXIAL 256: the larger axial box basis for narrower z packets' }], onChange: (v) => { app.state.gasAxial = v === 'axial'; if (!app.state.gasAxial) app.w.gas.off(); hNote(); schedule(TIER.RECONSTRUCT); } });
    rg.appendChild(ui.gasBasis.root);
    const go = el('div', 'sp-ham-trigs', rg);
    go.appendChild(trig({ label: 'LAUNCH', title: 'LAUNCH · a Gaussian packet in the box', onFire: () => {
      if (getHamiltonian().id !== 'well') { setHamiltonian('well'); switchHamiltonian('well'); if (ui.hamSeg) ui.hamSeg.set('well'); }
      const ax = app.sh.keyState.axis, a = HAMILTONIANS.well.radius, d = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] }[ax], k = ui.gasSpeed.get ? ui.gasSpeed.get() : 0.8;
      app.w.launchPacket(d.map((v) => -v * a / 2), d.map((v) => v * k), app.w.gasSigma(k));
    } }).root).dataset.keyAction = 'gas.launch';   // 021 I1: the actions press these two
    go.appendChild(trig({ label: 'BOUNCE', title: 'COHERENT BOUNCE · a non-spreading oscillator packet (OSCILLATOR)', onFire: () => app.w.coherentBounce() }).root).dataset.keyAction = 'gas.bounce';
    ui.gasRo = readout({ label: 'GAS  packet held by the box', value: '—', sub: 'nothing launched' });
    rg.appendChild(ui.gasRo.root);
    el('div', 'note', hamBody).innerHTML = '<b>Coherent bounce.</b> In the oscillator, an impulse moves the ground-state packet without changing its width. In the box, the packet disperses and reflects from the wall.';
    el('div', 'note', hamBody).innerHTML = '<b>Gas packet.</b> LAUNCH projects a Gaussian packet into the box basis. CAPTURED reports how much fits. Ctrl-drag on the field sets its launch point, direction, and strength.';
  }
  hamRows.note.after(hamBody);
  onHamiltonian((H) => { if (H.id !== 'well' && app.w.gas && app.w.gas.on) { app.w.gas.off(); schedule(TIER.RECONSTRUCT); } });
}
