/* lab/windows/molecules.js — MOLECULES, the molecular session, THE HEAD and MO-REGISTRY (0.5.2 R2d; moved verbatim out of lab/rack.js boot()) at TWO seats:
 * createMolecules(app) builds MOLECULES where the LEGACY note stands and returns createMoRegistry(), which boot() calls where ORBITALS stood (after the stage words). */
import { TIER } from '../rack.js';
import { VIEW, VIEW_NAMES } from '../field.js'; import { MOLECULE_BY_ID } from '../molecules.js'; import { isField } from '../mir/core/pointer.js'; import { getHamiltonian } from '../hamiltonian.js';
import { createChem } from '../chemview.js'; import { createRegister } from '../registerview.js'; import { createMolecularSession } from '../molecular-session.js'; import { moleculeHead } from '../latex-state.js';
export function createMolecules(app) {
  const { dom, ui, device, clock, mat, useCompactDefaults, FIRST_RUN } = app, { schedule, canPresent } = app.loop, { rack } = app.host,
    { wState, wSpec, switchHamiltonian, wSh, wOrb, wVor, wSlice } = app.w, { cardLoading, field, solveChem } = app.ctl;
  /* H₂⁺ · LEGACY (the `molecule` card, with W-MO and W-PULSE) was DELETED in 0.5.0 D9: restore opens a file it owned as MOLECULES · H₂ */
  app.state.chem = null;                                                     // wave CHEMISTRY: the fifth field owner, assigned below
  app.state.restampParams = null;                                            // re-tag knobs as modulation targets: lanes built after boot call it (the REGISTER's phase needles)
  app.state.molSession = null;                                               // the one owner of the molecular volume, assigned beside CHEMISTRY below (the frame loop reads it)
  app.state.orbitals = null; app.state.states = null; app.state.register = null;                 // REGISTER: the window (register) and its two modes, assigned beside CHEMISTRY below
  let specFoldedByMol = false;           // 2026-10: SPECTRUM folded by a molecule taking the field (so the molecule's end unfolds it)
  function moleculeMode(v) {
    for (const w of [wState, wSh, wOrb, wVor, wSlice, app.w.wLad, app.w.wCalc]) if (w) w.root.hidden = !!v;   // CALCULUS reads the atomic register: it stands down too (Round 11 §10b)
    /* 2026-10 (Josh) · SPECTRUM is MINIMISED, not hidden: it stays on the rack, folded, while a molecule has the field, and
       unfolds when the molecule lets go — unless the reader folded or unfolded it themselves in between. */
    if (wSpec) {
      const folded = wSpec.root.classList.contains('folded');
      if (v && !folded) { wSpec.fold(true); specFoldedByMol = true; }
      else if (!v && specFoldedByMol) { if (folded) wSpec.fold(false); specFoldedByMol = false; }
    }
    if (v && app.state.space === 'p') { app.state.space = 'x'; if (ui.spaceSeg) ui.spaceSeg.set('x'); }
    if (!v) switchHamiltonian(getHamiltonian().id);                  // restore the atom's own hiding rules
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
  app.state.chem = createChem(wChem.body, { active: () => canPresent(wChem), loading: cardLoading(wChem, 'chem'), moreOpen: FIRST_RUN.more,   // 0.4.0 S0: the MORE fold opens on a desktop, folds on a phone or tablet
    solve: (msg, fallback, pluck) => solveChem(msg, fallback, pluck),
    repaint(rebuild) { schedule(rebuild ? TIER.REBUILD : TIER.PRESENT); },
    status(t, cls) { wChem.setStatus(t, cls); },
    setOn(v) { moleculeMode(v); app.w.stageTextTick(); },
    hand: (id) => headPick(id),                                      // 0.5.1 D2: a HAND pick (the dropdown, ON, a notebook link)
    /* the card does not touch the field: it hands `ground` and `tdhf` products to the session, which decides which
       model is playing and which observable the field shows.  See molecular-session.js. */
    session: app.state.molSession,
    derived: (fill) => (app.state.history ? app.state.history.absorb(fill) : fill()),   // S4 · a solve's derived defaults join the row that asked for it
    now: () => clock.t });
  /* 0.5.1 D2 · THE MOLECULE'S HEAD (R6-G): a HAND pick shows its head (latex-state.js moleculeHead: every number the record's stem or
     the live solve) in THE FADE's seat once THIS molecule's solve lands — held until Escape, a press on the picture after 2.5 s, or
     the next pick: the dismiss half of the kit's greet (info/page.js; λWAVES has no pages model).  A restore, an undo, a project,
     link or demo open never shows it — none comes through `hand`.  `head.shown` is the gate's witness (__LW.head). */
  const head = { shown: 0, md: null, want: null, bye: null };
  function headPick(id) { if (head.bye) head.bye(); head.want = id; headLand(app.state.chem.solution()); }
  function headLand(sol) {
    const id = head.want, row = id && MOLECULE_BY_ID.get(id);
    if (!row || !sol || !app.state.stageText) return;
    if (app.state.chem.preset() !== id) { head.want = null; return; }                      // the molecule changed first: nothing
    if (sol.key !== id + '|' + app.state.chem.basis + '|' + row.charge) return;             // chemview's solve key: this molecule's landing
    head.want = null;
    const md = moleculeHead({ molecule: row, basis: app.state.chem.basis, ground: sol, stem: sol.stem, status: app.state.chem.said });   // 0.5.4 P4: tell() ran before notify()
    if (!md || !app.state.stageText.announce(md, 0)) return;
    head.shown++; head.md = md;
    const life = new AbortController(), until = performance.now() + 2500, bye = head.bye = () => { life.abort(); if (head.bye === bye) head.bye = null; app.state.stageText.dismiss(md); };
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && !isField(e.target, true)) bye(); }, { signal: life.signal });
    dom.canvas.addEventListener('pointerdown', () => { if (performance.now() >= until) bye(); }, { signal: life.signal, passive: true });
  }
  app.state.chem.subscribe(headLand);
  function createMoRegistry() {   // the second seat: MO-REGISTRY
  const wOrbs = device({ id: 'orbitals', eyebrow: 'MO-REGISTRY', title: 'molecular orbital registry', status: '' });   // the id stays `orbitals` so saved layouts survive the rename (REGISTER-WINDOW-SPEC §11.1)
  app.w.wOrbs = wOrbs;
  if (useCompactDefaults) wOrbs.root.classList.add('closed');   // the same rule CHEMISTRY keeps; the first-run block opens it under MOLECULES
  rack.appendChild(wOrbs.root);
  app.state.register = createRegister(wOrbs.body, { active: () => canPresent(wOrbs),
    stamp: () => { if (app.state.restampParams) requestAnimationFrame(app.state.restampParams); },   // a lane built after boot becomes a drop target for a macro
    solve: (msg, fallback, pluck) => solveChem(msg, fallback, pluck),   // the STATES mode asks the chem worker for its canonical ladder and vectors
    repaint(rebuild) { schedule(rebuild ? TIER.REBUILD : TIER.PRESENT); },
    status(t, cls) { wOrbs.setStatus(t, cls); },
    announce: (md) => app.state.stageText && app.state.stageText.announce(md),        // a HAND's preset only (orbitalsview / statesview presetSel)
    now: () => clock.t, field: () => field, chem: () => app.state.chem, session: app.state.molSession });
  app.state.orbitals = app.state.register.orbitals; app.state.states = app.state.register.states;
  return { wOrbs }; }
  app.w.wChem = wChem; app.w.head = head; return { wChem, head, createMoRegistry };
}
