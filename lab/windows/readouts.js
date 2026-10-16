/* lab/windows/readouts.js — the readout cards (0.5.2 R2b; moved verbatim out of lab/rack.js boot()) at THREE seats, so the rack keeps its order: createReadouts(app)
 * builds SHADOW · ORBIT · VORTEX · PLANE and returns the CALCULUS and ATOMS seats, which boot() calls where they stood (READERS, track, hydroReader stay there). */
import { TIER } from '../rack.js';
import { el, knob, sw, seg, trig, readout, group } from '../mir/kit.js';
import { toLUT } from '../mir/palette.js';
import { getHamiltonian, HAMILTONIANS } from '../hamiltonian.js'; import { BASIS } from '../hydrogen.js';
import { createShadowView, createShadowFoot } from '../shadowview.js'; import { createOrbit } from '../orbit.js'; import { createKepler } from '../keplerview.js';
import { createVortex } from '../vortex.js'; import { createParticles } from '../particles.js'; import { createSliceView } from '../sliceview.js';
import { createCalculus } from '../calculusview.js'; import { createMeters } from '../meters.js'; import { createLadder } from '../ladder.js'; import { createLattice } from '../lattice.js'; import { createBloch } from '../bloch.js'; import { solveLattice } from '../lattice-model.js'; import { createCentral, solveCentral } from '../central.js'; import { solveLadder } from '../ladder-model.js';
import { createAtoms } from '../atomsview.js'; import { createWigner } from '../wignerview.js'; import { createRadiation } from '../radiationview.js';
export function createReadouts(app) {
  const { dom, ui, device, reg, clock, obs, useCompactDefaults } = app, { schedule, canPresent } = app.loop, { rack } = app.host, { setElement, fillValence, switchHamiltonian } = app.w,
    { domain, cardLoading, solveCard, touchState, api } = app.ctl;
  const wSh = device({ id: 'shadow', eyebrow: 'SHADOW', status: '' });
  rack.appendChild(wSh.root);
  const shCanvas = el('canvas', 'shadow-c', wSh.body);
  const shadowView = createShadowView(shCanvas, api);
  app.w.shadowView = shadowView;
  {
    const r = wSh.row();
    ui.shadowSeg = seg({ aria: 'shadow picture', value: 'phasors', options: [{ id: 'phasors', label: 'PHASORS' }, { id: 'oscillators', label: 'OSC', title: 'Oscillators' }, { id: 'lissajous', label: 'LISSA', title: 'Lissajous' }], onChange: (v) => { shadowView.setMode(v); schedule(TIER.PRESENT); } });
    r.appendChild(ui.shadowSeg.root);
    ui.hc = readout({ label: 'H_C = ½qᵀAq + ½pᵀAp = ⟨H⟩', value: '—' });
    r.appendChild(ui.hc.root);
    el('div', 'epi', wSh.body, 'THE SAME COEFFICIENTS IN q,p COORDINATES');
  el('div', 'note', wSh.body).innerHTML = '<b>Shadow.</b> Each complex coefficient appears as one q,p oscillator. This is a coordinate map of the same quantum state, not a classical atom model.';
  }
  /* the FOOTER (0.4.0 S3, out of the retired DYNAMICS): L, T, V, S and their history — native-ui.js seats it in SHADOW's
     details fold, and the frame loop runs it only while that fold is open */
  ui.shFoot = el('div', 'shadow-foot', wSh.body);
  const shadowFoot = createShadowFoot(ui.shFoot);

  // ORBIT — the two rotors (print, Thread B)
  const wOrb = device({ id: 'orbit', eyebrow: 'ORBIT', status: '' });
  rack.appendChild(wOrb.root);
  const orbit = createOrbit(wOrb.body, { reg, setStatus: (t, c) => wOrb.setStatus(t, c), rotor(spec) { reg.rotor(spec); touchState(); } });
  const kepler = createKepler(dom.kepler);
  {
    const rk = wOrb.row('tight');
    ui.kepShell = seg({ label: 'SHELL', value: '3', aria: 'Kepler shell',
      options: [2, 3, 4, 5, 6].map((n) => ({ id: String(n), label: 'n' + n, title: `Read orbit axes from shell ${n}` })),
      onChange: () => app.w.keplerRowSync(true) });
    rk.appendChild(ui.kepShell.root);
    {
      const rkk = wOrb.row('tight');
      /* SPIN is the drag's OWN FIRST LEG, and it is the same call — keplerTurn('spin', dθ) is what
         keplerDragToPoint reaches for once it has worked out the φ that puts the perihelion under
         the pointer.  One entry point, one fresh read, one convention check, one touchState. */
      ui.kepSpin = knob({ label: 'SPIN  ω', min: 0, max: 2 * Math.PI, value: 0, wrap: true, cls: 'rot', fmt: () => 'D(R_L̂)',
        title: 'Rotate perihelion within the orbit plane',
        onDelta: (d) => app.w.keplerTurn('spin', d) });
      ui.kepTilt = knob({ label: 'TILT  ν', min: 0, max: 2 * Math.PI, value: 0, wrap: true, cls: 'rot', fmt: () => 'D(R_n̂)',
        title: 'Change inclination around the ascending node',
        onDelta: (d) => app.w.keplerTurn('tilt', d) });
      ui.kepTurn = knob({ label: 'TURN  Ω', min: 0, max: 2 * Math.PI, value: 0, wrap: true, cls: 'rot', fmt: () => 'D(R_z)',
        title: 'Rotate the ascending node around world z',
        onDelta: (d) => app.w.keplerTurn('turn', d) });
      for (const k of [ui.kepSpin, ui.kepTilt, ui.kepTurn]) rkk.appendChild(k.root);
      ui.kepRo = readout({ label: 'ORBIT  a · e · coherence', cls: 'wide', value: '—', sub: 'pick a populated shell' });
      rkk.appendChild(ui.kepRo.root);
    }
    ui.keplerSw = sw({ label: 'KEPLER ORBIT', value: false, title: 'Draw the Kepler orbit over the field', onChange: (v) => { kepler.setOn(v); schedule(TIER.PRESENT); } }); rk.appendChild(ui.keplerSw.root);
  el('div', 'note', wOrb.body).innerHTML = '<b>Kepler overlay.</b> The selected shell sets the ellipse size and eccentricity from ⟨L⟩ and ⟨K⟩. Dashed lines indicate a low-coherence correspondence; no orbit is drawn below the threshold.';
  }

  // VORTEX — the flow: the nodal lines (print, Thread C), and the PARTICLES that ride the same current
  const wVor = device({ id: 'vortex', eyebrow: 'VORTEX', status: '' });
  rack.appendChild(wVor.root);
  const vortex = createVortex(wVor.body, dom.vortex, { reg, clock, scrubTo: (t) => { clock.scrub(t); schedule(TIER.EVOLVE); } }); ui.vorOn = wVor.body.querySelector('.sw');   // LOCATE: B2's no-nodes stand-down greys it
  /* PARTICLES (0.4.0 S3 · R-W1: out of the retired DYNAMICS): de Broglie–Bohm tracers seeded from |ψ|² and riding v = j/ρ —
     the same current whose singular lines VORTEX locates, so the switch lives here and its overlay presents while VORTEX
     can.  COUNT and TRAIL are the project's (instruments.particles); the switch is the overlay's (overlays.particles). */
  const particles = createParticles(dom.particles, {});
  {
    const gP = group(wVor.body, 'PARTICLES'), r = el('div', 'row tight', gP);
    const seed = () => { particles.seed(Math.round(ui.pN.get()), reg, clock.t, domain.half); schedule(TIER.PRESENT); };
    ui.pOn = sw({ label: 'PARTICLES', value: false, title: 'Draw de Broglie–Bohm tracers seeded from |ψ|², riding the current v = j/ρ', onChange: (v) => { particles.setOn(v); if (v) seed(); else schedule(TIER.PRESENT); } });
    ui.pN = knob({ label: 'COUNT', min: 20, max: 600, value: 160, log: true, step: 10, fmt: (v) => v.toFixed(0), onChange: () => { if (ui.pOn.get()) seed(); } });
    ui.pTrail = knob({ label: 'TRAIL', min: 0, max: 120, value: 24, step: 1, fmt: (v) => v.toFixed(0), onInput: (v) => { particles.setTrail(Math.round(v)); schedule(TIER.PRESENT); } });
    for (const c of [ui.pOn, ui.pN, ui.pTrail]) r.appendChild(c.root);
    r.appendChild(trig({ label: 'RESEED', title: 'sample a fresh cloud from |ψ|² at the current time', onFire: () => { if (ui.pOn.get()) seed(); } }).root);
    el('div', 'note', gP).innerHTML = '<b>Particles.</b> Seeds follow |ψ|² and move with the probability current; a path never crosses a nodal line. Paths stop at the domain edge or near a node; speed is capped for display.';
  }
  /* FLOW (MOLECULAR WAVES stage 6): the SAME tracer view on its own canvas, riding a molecule's current v = j/ρ —
     the STATES register hands it a source (lab/molecular-flow.js) whose matrices it rebuilds once a frame */
  const flowTracers = dom.flow ? createParticles(dom.flow, { ink: () => (document.body.dataset.theme === 'light' ? { trail: 'rgba(16,36,84,0.42)', dot: 'rgba(10,22,56,0.92)', text: 'rgba(20,30,50,0.6)' } : { trail: 'rgba(190,230,255,0.4)', dot: 'rgba(235,248,255,0.95)', text: 'rgba(255,255,255,0.5)' }),
    caption: (st) => `FLOW · ${app.state.flowEpoch && app.state.flowEpoch.balanced ? 'BALANCED · v + ∇φ, continuity closed on the grid' : 'AS COMPUTED · v = j/ρ'} · ${st.alive}/${st.count} tracers · direction exact, size qualitative · the tracers' steps checked by no oracle` }) : null;
  app.state.flowEpoch = null;                                                // the SOURCE the tracers were seeded from: a new source is a new ensemble

  // PLANE (id `slice`) — a rotatable complex plane through ψ (the 4D engine's rotor pair, carrying hydrogen's own 4-space)
  const wSlice = device({ id: 'slice', eyebrow: 'PLANE', status: '' });   // 0.4.0 S3 (R-W3): PLANE, once SLICE — the id and slice.* stay
  app.w.wSh = wSh; app.w.wOrb = wOrb; app.w.wVor = wVor; app.w.wSlice = wSlice; app.w.orbit = orbit; app.w.flowTracers = flowTracers;
  const slice = createSliceView(wSlice.body, {
    lut: () => (app.state.palette && app.state.palette.on ? toLUT(app.state.palette.stops) : null),
    repaint() { schedule(TIER.PRESENT); }
  });
  app.w.shadowFoot = shadowFoot; app.w.kepler = kepler; app.w.vortex = vortex; app.w.particles = particles; app.w.slice = slice;
  /* OPTIMIZATION 2026-09-24 · M6(b): appended AFTER its view is built (in its old seat, so the rack order and
     LW.bootOrder are unchanged).  Appended first, the plane model's construction-time paint read `cv.clientWidth` on a
     half-built rack and forced its first full style + layout (28.6 ms); disconnected, the read answers 0 without a
     flush, and the plane model's own ResizeObserver paints it once it is laid out. */
  rack.appendChild(wSlice.root);
  function createCalcMetersLadder() {   // the second seat: CALCULUS · METERS · LADDER
  const wCalc = device({ id: 'calculus', eyebrow: 'CALCULUS', status: '' });
  rack.appendChild(wCalc.root);
  const calculus = createCalculus(wCalc.body, { revival: (list) => app.sh.verbs.run(list, { name: 'REVIVAL' }) });   // 0.8.3 B1: REVIVAL is one verb list, one history row

  // METERS
  const wMet = device({ id: 'meters', eyebrow: 'METERS', status: '' });
  app.w.wMet = wMet;
  rack.appendChild(wMet.root);
  const meters = createMeters(wMet.body, () => {   // 0.8.2 P2 · THE COHERENCE MAP's source: a molecule's STATES register (its b_K) while MOLECULES owns the field, else the register's c(0)
    const S = app.state.chem && app.state.chem.on ? app.state.states : null, H = getHamiltonian(), pal = app.state.palette;
    if (S) return S.on ? { c: S.state().lanes.filter((l) => l.amp > 1e-7).map((l) => ({ re: l.amp * Math.cos(l.phase), im: l.amp * Math.sin(l.phase), label: l.label, E: l.omega })), unit: 'hartree', pal } : { why: 'MOLECULES owns the field: the map reads its STATES register — switch STATES on in MO-REGISTRY', pal };
    return { c: reg.populated().map((a) => ({ re: reg.re0[a], im: reg.im0[a], label: H.labelOf(BASIS[a]), E: reg.Ediag(a), n: BASIS[a].n })), T: app.state.eq.last, unit: H.unit, pal };
  });

  {
    const rp = wMet.row('tight');                                     // 0.4.0 S3: PERFORMANCE moved to SETTINGS › QUALITY; the GOVERNOR's readout stays here
    ui.govRo = readout({ label: 'GOVERNOR  state · median · grid', value: 'nominal', cls: 'wide', sub: 'budget 22 ms · the window median' }); rp.appendChild(ui.govRo.root);
  el('div', 'note', wMet.body).innerHTML = '<b>Frame profile.</b> Times are moving averages measured in this browser. PERFORMANCE (SETTINGS › QUALITY) at 120 Hz updates visible CPU readers every fourth frame while the field continues to present each frame.';
  }
  // LADDER — the Rydberg revival as a spectral instrument (print, Thread A); its own register, no field
  const wLad = device({ id: 'ladder', eyebrow: 'LADDER', status: '' });
  app.w.wCalc = wCalc; app.w.wLad = wLad; app.w.calculus = calculus;
  calculus.trace = () => { const T = app.state.eq.last, G = T && T.mode === 1 && !reg.field.Fz && T.gamma; return { P: app.hooks.period && app.hooks.period(), T, signed: !!(T && T.gamma && T.mode === 2), g2: G && ((a, b) => { const k = ((BASIS[a].n - 1) * 6 + BASIS[b].n - 1) * 2; return G[k] ** 2 + G[k + 1] ** 2; }) }; };   // 0.8.3 B2: the A(t) tile's source — the transport's REPEATS period and the equalizer's table in force
  if (useCompactDefaults) wLad.root.classList.add('closed');
  rack.appendChild(wLad.root);
  const ladder = createLadder(wLad.body, { active: () => canPresent(wLad), loading: cardLoading(wLad, 'revival'), solve: (params) => solveCard({ op: 'ladder', params }, () => solveLadder(params)) });
  app.w.ladder = ladder;
  /* Shift multi-add reopens several cards in one gesture. Each explicit request enters the card worker queue even
     if later cards land below the rack clip; the single worker keeps those solves from competing with the field. */
  app.w.wChem.root.addEventListener('devopen', () => app.state.chem.prepare());
  app.w.wOrbs.root.addEventListener('devopen', () => { app.state.chem.prepare(); app.state.orbitals.paint(); app.state.orbitals.refresh(); });   // the register runs on CHEMISTRY's ladder: opening it asks for one
  wLad.root.addEventListener('devopen', () => ladder.prepare());
  const wLat = device({ id: 'lattice', eyebrow: 'LATTICE', status: '' }); wLat.root.classList.add('closed'); rack.appendChild(wLat.root);   // 0.7.2 L1: a tight-binding lattice, its own register (lab/lattice.js); ships closed
  const lattice = createLattice(wLat.body, { active: () => canPresent(wLat), t: () => clock.t, palette: () => app.state.palette, solve: (H) => solveCard({ op: 'lattice.solve', ...H }, () => solveLattice(H)) });
  wLat.root.addEventListener('devopen', () => lattice.prepare());
  const wBlo = device({ id: 'bloch', eyebrow: 'BLOCH', status: '' }); wBlo.root.classList.add('closed'); rack.appendChild(wBlo.root);   // 0.8.1 T1: one qubit, its own register (lab/bloch.js); ships closed, and opening it runs its preset from the start
  const bloch = createBloch(wBlo.body, { t: () => clock.t, obs }); wBlo.root.addEventListener('devopen', () => bloch.set({}));
  const wCen = device({ id: 'central', eyebrow: 'CENTRAL', status: '' }); wCen.root.classList.add('closed'); rack.appendChild(wCen.root);   // 0.8.0 G1: the generic central H's editor (lab/central.js); ships closed
  const central = createCentral(wCen.body, { solve: (w) => solveCard({ op: 'central.solve', ...w }, () => solveCentral(w.preset, w.params)), apply: (id) => { switchHamiltonian(id); ui.hamSeg.set(id); }, current: () => getHamiltonian().id, populated: () => reg.populated() }); wCen.root.addEventListener('devopen', () => central.prepare());
  return { wCalc, calculus, wMet, meters, wLad, ladder, wLat, lattice, wBlo, bloch, wCen }; }
  function createAtomsWignerRadiation() {   // the third seat: ATOMS · WIGNER · RADIATION
  const wAtoms = device({ id: 'atoms', eyebrow: 'ATOMS', status: '' });
  rack.appendChild(wAtoms.root); wAtoms.root.classList.add('closed');            // reopened from the + at the top of the rack
  const atomsView = createAtoms(wAtoms.body, {
    Z: () => HAMILTONIANS.atom.Z,
    select: (z) => setElement(z),
    fill: () => fillValence(),
    active: () => getHamiltonian().id === 'atom',
  });
  app.w.wAtoms = wAtoms; app.w.atomsView = atomsView;

  /* ELECTROSTATICS · LEGACY (Φ, E, B and j of the register's charge, the #fieldlines overlay) was DELETED in 0.5.0 D9b */

  // WIGNER — the one joint object of position and momentum, cut through the axis; a niche window: it ships CLOSED
  const wWig = device({ id: 'wigner', eyebrow: 'WIGNER', status: '' });
  rack.appendChild(wWig.root); wWig.root.classList.add('closed');                // reopened from the + at the top of the rack
  const wignerView = createWigner(wWig.body, { repaint() { schedule(TIER.PRESENT); } });
  app.w.wignerView = wignerView;

  // RADIATION — what the prepared pair would radiate, and the shape of its far field; also CLOSED
  const wRad = device({ id: 'radiation', eyebrow: 'RADIATION', status: '' });
  rack.appendChild(wRad.root); wRad.root.classList.add('closed');
  const radiationView = createRadiation(wRad.body, { repaint() { schedule(TIER.PRESENT); }, ab: () => app.hooks.ab }); app.w.radiationView = radiationView;
  const WIG_OK = 'numerical · a slice, not a marginal', RAD_OK = 'exact matrix elements · classical far field';
  return { wAtoms, atomsView, wWig, wignerView, wRad, radiationView, WIG_OK, RAD_OK }; }
  return { wSh, shadowView, shadowFoot, wOrb, orbit, kepler, wVor, vortex, particles, flowTracers, wSlice, slice, createCalcMetersLadder, createAtomsWignerRadiation };
}
