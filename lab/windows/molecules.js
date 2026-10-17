/* lab/windows/molecules.js — MOLECULES, the molecular session, THE HEAD and MO-REGISTRY (0.5.2 R2d; moved verbatim out of lab/rack.js boot()) at TWO seats:
 * createMolecules(app) builds MOLECULES where the LEGACY note stands and returns createMoRegistry(), which boot() calls where ORBITALS stood (after the stage words). */
import { TIER } from '../rack.js'; import { el, sw, seg } from '../mir/kit.js';
import { VIEW, VIEW_NAMES } from '../field.js'; import { MOLECULE_BY_ID } from '../molecules.js'; import { isField } from '../mir/core/pointer.js'; import { getHamiltonian, HAMILTONIANS } from '../hamiltonian.js';
import { createChem } from '../chemview.js'; import { createRegister } from '../registerview.js'; import { createMolecularSession } from '../molecular-session.js'; import { moleculeHead } from '../latex-state.js';
export function createMolecules(app) {
  const { dom, ui, device, clock, mat, useCompactDefaults, FIRST_RUN, reg } = app, { schedule, canPresent } = app.loop, { rack } = app.host,
    { wState, wSpec, switchHamiltonian, setElement, wSh, wOrb, wVor, wSlice } = app.w, { cardLoading, field, solveChem, solveCard, touchState } = app.ctl, balance = (msg) => solveCard(msg, () => null, (r) => r);   // BALANCED FLOW's repair: the cards queue, never the frame thread
  /* H₂⁺ · LEGACY (the `molecule` card, with W-MO and W-PULSE) was DELETED in 0.5.0 D9: restore opens a file it owned as MOLECULES · H₂ */
  app.state.chem = null;                                                     // wave CHEMISTRY: the fifth field owner, assigned below
  app.state.restampParams = null;                                            // re-tag knobs as modulation targets: lanes built after boot call it (the REGISTER's phase needles)
  app.state.molSession = null;                                               // the one owner of the molecular volume, assigned beside CHEMISTRY below (the frame loop reads it)
  app.state.orbitals = null; app.state.states = null; app.state.register = null;                 // REGISTER: the window (register) and its two modes, assigned beside CHEMISTRY below
  /* Iteration 002 (Josh, 2026-10-16) · TWO MODES.  ATOMS: the 91-label SPECTRUM, the hydrogen-orbital names, the EQUALIZER and the atomic
     instruments.  MOLECULES: MOLECULES and MO-REGISTRY.  The mode IS MOLECULES ON — the switch under the title, the card's own switch, a project
     and a link all say it by one road (chem.setOn → moleculeMode) — and each mode HIDES the other's windows (hidden, never closed or moved: the
     arrangement waits for the mode to come back).  This replaces 2026-10's folded SPECTRUM under a molecule. */
  const modeSeg = seg({ aria: 'Mode: atoms or molecules', value: 'atoms', options: [{ id: 'atoms', label: 'ATOMS', title: 'ATOMS — SPECTRUM\'s 91 hydrogen states, their names and the EQUALIZER' }, { id: 'molecules', label: 'MOLECULES', title: 'MOLECULES — MOLECULES and MO-REGISTRY' }],
    onChange: (v) => { if (app.state.chem) app.state.chem.setOn(v === 'molecules'); } });
  modeSeg.root.id = 'lwMode'; { const t = document.getElementById('title'); if (t) t.after(modeSeg.root); }
  function moleculeMode(v) {
    for (const w of [wState, wSh, wOrb, wVor, wSlice, app.w.wLad, app.w.wCalc, wSpec, { root: document.querySelector('.dev[data-id="equalizer"]') }]) if (w && w.root) w.root.hidden = !!v;   // CALCULUS reads the atomic register: it stands down too (Round 11 §10b)
    for (const w of [wChem, app.w.wOrbs]) if (w) w.root.hidden = !v;
    modeSeg.set(v ? 'molecules' : 'atoms');
    if (v && app.state.space === 'p') { app.state.space = 'x'; if (ui.spaceSeg) ui.spaceSeg.set('x'); }
    if (!v) switchHamiltonian(getHamiltonian().id);                  // restore the atom's own hiding rules
    if (ui.hamSeg) ui.hamSeg.set(getHamiltonian().id);               // 0.7.4 C1: SPECTRUM's ‹ SYSTEM › reads back what owns the field
    app.state.refSnapshot = null; app.state.pendingRef = null;
    schedule(TIER.REBUILD);
  }

  /* HELIUM · LEGACY (Hylleraas) was DELETED in 0.5.0 D9: restore opens a file it owned as SPECTRUM's ATOM · He 1s */

  /* H₂ · LEGACY (Heitler–London, the collision) was DELETED in 0.5.0 D9b: restore opens a file it owned as MOLECULES · H₂ */

  /* CHEMISTRY — eight molecules, RHF and the real-time δ-kick: the field becomes an AO density matrix.
     It is a FIELD OWNER, so it goes through the moleculeMode() policy. */
  let chemPrevView = null;   // the observable the field showed before CHEMISTRY (or the ORBITALS register) took it
  /* ONE ROAD to the field's observable for the molecular pair.  CHEMISTRY asks for density / real / diff, the
     ORBITALS register asks for phase, and `null` hands back whatever the user had before either of them took it —
     so handing the field between the two cards never loses the observable the user chose for themselves. */
  function molFieldView(name) {
    if (!name) { if (chemPrevView !== null) { mat.view = chemPrevView; if (ui.viewSeg) ui.viewSeg.set(VIEW_NAMES[chemPrevView]); chemPrevView = null; } }
    else if (VIEW[name] !== undefined && mat.view !== VIEW[name]) { if (chemPrevView === null) chemPrevView = mat.view; mat.view = VIEW[name]; if (ui.viewSeg) ui.viewSeg.set(name); }
    schedule(TIER.PRESENT);
  }
  /* THE MOLECULAR SESSION — one owner, and the end of "last writer wins".  CHEMISTRY and the ORBITALS register are
     PRODUCERS of its named models; it is the only module that touches the field's two molecular setters, and the
     only caller of the view road above, so the observable comes back to the user by the same rule whichever model
     let go of the field.  tests/field-owner.test.mjs is the law that keeps that "only" true. */
  app.state.molSession = createMolecularSession({ field: () => field, fieldView: molFieldView,
    repaint(rebuild) { schedule(rebuild ? TIER.REBUILD : TIER.PRESENT); } });
  const wChem = device({ id: 'chem', eyebrow: 'MOLECULES', title: 'RHF · real time', status: '' });
  if (useCompactDefaults) wChem.root.classList.add('closed');   // built closed (chemview's N8 shown() guard); the first-run block opens it on the LEFT rack — still no solve until it is switched on
  rack.appendChild(wChem.root);
  ui.skeletonSw = sw({ label: 'SKELETON', value: false, title: 'The nuclei as beads (CPK colours, 0.28 × the covalent radius), the bonds within 1.3 × the radii, and the dipole arrow from the centre of nuclear charge — a PREFERENCE, off by default',
    onChange: () => { app.sh.saveSettings(); schedule(TIER.PRESENT); } });   // 0.7.0 V2: rack.js draws it (lab/skeleton.js); chemview seats it after the VIEW row's chevron
  ui.beadSw = sw({ label: 'BEAD', value: false, title: 'THE BEAD: the expectation point (⟨x⟩, ⟨y⟩, ⟨z⟩) on the stage with its trail over the last period (⟨p⟩ in momentum space; for a molecule the electron density\'s centroid (ΣZR − μ)/N_e) — a PREFERENCE, off by default',
    onChange: () => { app.sh.saveSettings(); schedule(TIER.PRESENT); } });   // 0.8.2 P3: rack.js draws it on the skeleton's canvas
  ui.ellipsoidSw = sw({ label: 'ELLIPSOID', value: false, title: 'THE UNCERTAINTY ELLIPSOID: the position covariance Σ_ij = ⟨r_i r_j⟩ − ⟨r_i⟩⟨r_j⟩ as its three principal circles, semi-axes √λ_k, about the bead (with it) — position space and a register only; a PREFERENCE, off by default',
    onChange: () => { app.sh.saveSettings(); schedule(TIER.PRESENT); } });   // 0.8.3 B3: rack.js draws it after the bead
  /* 2026-10-16 (Josh, iteration 001): SKELETON · BEAD · ELLIPSOID draw ON the stage, so they sit in INFORMATIONAL (built before this card, settings-card.js) */
  { const info = document.querySelector('.dev[data-id="informational"] .dev-body'); if (info) el('div', 'row tight info-marks', info).append(ui.skeletonSw.root, ui.beadSw.root, ui.ellipsoidSw.root); }
  const pop = (t) => app.state.stageText && app.state.stageText.pop(t);   // iteration 001: INFORMATIONAL's pop-ups (shell/stage-words.js)
  app.state.chem = createChem(wChem.body, { pop, active: () => canPresent(wChem), loading: cardLoading(wChem, 'chem'), moreOpen: FIRST_RUN.more,   // 0.4.0 S0: the MORE fold opens on a desktop, folds on a phone or tablet
    solve: (msg, fallback, pluck) => solveChem(msg, fallback, pluck), balance, plane: () => app.w.slice,   // iteration 005 P2: THE CONTINUITY RECORD samples PLANE's own geometry
    repaint(rebuild) { schedule(rebuild ? TIER.REBUILD : TIER.PRESENT); },
    status(t, cls) { wChem.setStatus(t, cls); },
    setOn(v) { moleculeMode(v); app.w.stageTextTick(); if (app.hooks.status) app.hooks.status(); }, said: () => app.hooks.status && app.hooks.status(),   // 0.5.4 P4: the STATUS row (informational.js)
    hand: (id) => headPick(id),                                      // 0.5.1 D2: a HAND pick (the dropdown, ON, a notebook link)
    atomZ: () => HAMILTONIANS.atom.Z, atom(z) { setElement(z); if (getHamiltonian().id !== 'atom') switchHamiltonian('atom'); ui.hamSeg.set('atom'); app.w.wAtoms.root.hidden = false; app.w.wAtoms.root.classList.remove('closed'); },   // 0.7.4 C2: ‹ ATOMS ›' tile, SPECTRUM's ATOM road
    /* the card does not touch the field: it hands `ground` and `tdhf` products to the session, which decides which
       model is playing and which observable the field shows.  See molecular-session.js. */
    session: app.state.molSession,
    derived: (fill) => (app.state.history ? app.state.history.absorb(fill) : fill()),   // S4 · a solve's derived defaults join the row that asked for it
    now: () => clock.t, clock, fps: () => app.ctl.stats.fps,   // 0.7.0 V1 VIBRATE: the flash law reads RATE and the fps; BREATHE sets RATE (the knob's road) and plays
    breathe(r) { ui.rateKnob.set(r); if (!app.ctl.modHand('transport.rate', r)) clock.setRate(r); clock.play(performance.now() / 1000); schedule(TIER.EVOLVE); } });
  /* 0.5.1 D2 · THE MOLECULE'S HEAD (R6-G): a HAND pick shows its head (latex-state.js moleculeHead: every number the record's stem or
     the live solve) in THE FADE's seat once THIS molecule's solve lands — held until Escape, a press on the picture after 2.5 s, or
     the next pick: the dismiss half of the kit's greet (info/page.js; λWAVES has no pages model).  A restore, an undo, a project,
     link or demo open never shows it — none comes through `hand`.  `head.shown` is the gate's witness (__LW.head). */
  const head = { shown: 0, md: null, want: null, bye: null };
  function headPick(id) { if (head.bye) head.bye(); head.want = id; headLand(app.state.chem.solution()); }
  /* 2026-10-16 (Josh, iteration 001): the head is the NOTEBOOK's, never the stage's — the stage writes only INFORMATIONAL's formula and atoms */
  function headLand() { head.want = null; }
  app.state.chem.subscribe(headLand);
  function createMoRegistry() {   // the second seat: MO-REGISTRY
  const wOrbs = device({ id: 'orbitals', eyebrow: 'MO-REGISTRY', title: 'molecular orbital registry', status: '' });   // the id stays `orbitals` so saved layouts survive the rename (REGISTER-WINDOW-SPEC §11.1)
  app.w.wOrbs = wOrbs;
  if (useCompactDefaults) wOrbs.root.classList.add('closed');   // the same rule CHEMISTRY keeps; the first-run block opens it under MOLECULES
  rack.appendChild(wOrbs.root);
  app.state.register = createRegister(wOrbs.body, { active: () => canPresent(wOrbs),
    stamp: () => { if (app.state.restampParams) requestAnimationFrame(app.state.restampParams); },   // a lane built after boot becomes a drop target for a macro
    solve: (msg, fallback, pluck) => solveChem(msg, fallback, pluck), balance,   // the STATES mode asks the chem worker for its canonical ladder and vectors
    repaint(rebuild) { schedule(rebuild ? TIER.REBUILD : TIER.PRESENT); },
    status(t, cls) { wOrbs.setStatus(t, cls); },
    announce: (md) => app.state.stageText && app.state.stageText.announce(md), pop,   // a HAND's preset only (orbitalsview / statesview presetSel)
    now: () => clock.t, rate: () => clock.rate, field: () => field, chem: () => app.state.chem, session: app.state.molSession,
    song: { reg, hydrogen: () => getHamiltonian().id === 'hydrogen', filming: () => app.state.exportLocked, land(re, im, t) { app.state.rotTicking = true; reg.anchorFrom(re, im, t); app.state.rotTicking = false; touchState(); } } });   // 0.6.4 S1: a landing notes no history row, as the rotation drive's ticks
  app.state.orbitals = app.state.register.orbitals; app.state.states = app.state.register.states;
  wChem.root.hidden = wOrbs.root.hidden = !app.state.chem.on;        // iteration 002: ATOMS is the boot's mode; MOLECULES ON shows the pair (moleculeMode)
  return { wOrbs }; }
  app.w.wChem = wChem; app.w.head = head; return { wChem, head, createMoRegistry };
}
