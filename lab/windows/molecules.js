/* lab/windows/molecules.js — MOLECULES, the molecular session, THE HEAD and the register (0.5.2 R2d; moved verbatim out of lab/rack.js boot()) at ONE seat,
 * where the LEGACY note stands.  Iteration 008 U: MO-REGISTRY is no longer a window — the register is built INTO the MOLECULES card (chemview's `slots`)
 * and a saved `orbitals` seat opens MOLECULES (settings.js RETIRED_WINDOWS); the fix round (F5) folded its second seat, which no longer made a device, into this one. */
import { TIER } from '../tier.js'; import { el } from '../mir/kit.js'; import { setGlyph } from '../mir/glyph.js';
import { VIEW, VIEW_NAMES, STYLE } from '../field.js'; import { MOLECULE_BY_ID } from '../molecules.js'; import { getHamiltonian, HAMILTONIANS } from '../hamiltonian.js';
import { MODE } from '../shell/settings.js';   // 021 R5: ONE MODE, the windows' table
import { createChem } from '../chemview.js'; import { createRegister } from '../registerview.js'; import { createMolecularSession } from '../molecular-session.js'; import { moleculeHead } from '../latex-state.js';
export function createMolecules(app) {
  const { dom, ui, device, clock, mat, useCompactDefaults, FIRST_RUN, reg } = app, { schedule, canPresent } = app.loop, { rack } = app.host,
    { wState, wSpec, switchHamiltonian, setElement, wSh, wOrb, wVor, wSlice } = app.w, { cardLoading, field, solveChem, solveCard, touchState } = app.ctl, balance = (msg) => solveCard(msg, () => null, (r) => r);   // BALANCED FLOW's repair: the cards queue, never the frame thread
  /* H₂⁺ · LEGACY (the `molecule` card, with W-MO and W-PULSE) was DELETED in 0.5.0 D9: restore opens a file it owned as MOLECULES · H₂ */
  app.state.chem = null;                                                     // wave CHEMISTRY: the fifth field owner, assigned below
  app.state.restampParams = null;                                            // re-tag knobs as modulation targets: lanes built after boot call it (the REGISTER's phase needles)
  app.state.molSession = null;                                               // the one owner of the molecular volume, assigned beside CHEMISTRY below (the frame loop reads it)
  app.state.orbitals = null; app.state.states = null; app.state.register = null;                 // REGISTER: the window (register) and its two modes, assigned beside CHEMISTRY below
  /* Iteration 002 (Josh, 2026-10-16) · TWO MODES.  ATOMS: the 140-label SPECTRUM, the hydrogen-orbital names, the EQUALIZER and the atomic
     instruments.  MOLECULES: MOLECULES and MO-REGISTRY.  The mode IS MOLECULES ON — the switch under the title, the card's own switch, a project
     and a link all say it by one road (chem.setOn → moleculeMode) — and each mode HIDES the other's windows (hidden, never closed or moved: the
     arrangement waits for the mode to come back).  This replaces 2026-10's folded SPECTRUM under a molecule. */
  /* 013 H4 · THE STAGE'S THREE BUTTONS (Josh, 2026-10-20): under the title a COLUMN of icons, the words only as hover hints — LIBRARY (a door:
     the Picker, the key row `menu`'s road), MOLECULAR (MOLECULES on) and HYDROGEN (MOLECULES off: the mode ATOMS was, renamed; the boot's).
     #lwMode and set(v) are kept, so the key row `mode`, a project and a link still say the mode by one road.  021 R5 (call 7): the HYDROGEN button's id
     is `hydrogen` (it was `atoms`, which also named the ATOMS window and the Picker's deck); set('atoms') is still read as HYDROGEN. */
  const modeSeg = (() => {
    const root = el('div', 'lw-stage-btns'); root.id = 'lwMode'; root.setAttribute('role', 'group'); root.setAttribute('aria-label', 'Library and mode');
    const B = [['library', 'LIBRARY — open the Picker', () => { if (app.state.picker) app.state.picker.toggle(); }],
      ['molecules', 'MOLECULAR — the molecule and its register, one window', () => { if (app.state.chem) app.state.chem.setOn(true); }],
      ['hydrogen', 'HYDROGEN — the 140 hydrogen states', () => { if (app.state.chem) app.state.chem.setOn(false); }]]
      .map(([id, tip, run]) => { const b = el('button', 'lw-stage-b', root); b.type = 'button'; b.dataset.id = id; b.title = tip; b.setAttribute('aria-label', tip.split(' —')[0]); setGlyph(b, { library: 'library', molecules: 'molecule', hydrogen: 'atom' }[id], { size: 16 }); b.addEventListener('click', run); return b; });
    return { root, set(v) { if (v === 'atoms') v = 'hydrogen'; for (const b of B) if (b.dataset.id !== 'library') b.setAttribute('aria-pressed', String(b.dataset.id === v)); } };
  })();
  modeSeg.set('hydrogen'); { const t = document.getElementById('title'); if (t) t.after(modeSeg.root); }
  /* 022 E1 · THE SWITCH WEARS THE BUSY MARK: from the press until the field's owner is drawn (`molSession.selected` claims at once; `drawn` is
     its volume published, ≈ 150 ms on a solved molecule, longer on a first solve) the pointer's busy mark is up (busy-mark.js, the one counter) and the mode column's MOLECULAR and the card say
     `aria-busy`; MOLECULES OFF, or a molecule that never lands (a refusal), ends it */
  let switchingOn = false;
  function switching(v) {
    if (!v || switchingOn || (app.state.molSession && app.state.molSession.drawn)) return;
    const marks = [modeSeg.root.querySelector('[data-id="molecules"]'), wChem.root].filter(Boolean), t0 = performance.now(); switchingOn = true;
    for (const m of marks) m.setAttribute('aria-busy', 'true');
    app.ctl.busyWrap(new Promise((done) => { const look = () => { const C = app.state.chem, S = app.state.molSession;
      if (!C || !C.on || (S && S.drawn) || performance.now() - t0 > 20000) { switchingOn = false; for (const m of marks) m.removeAttribute('aria-busy'); done(); } else requestAnimationFrame(look); };
      requestAnimationFrame(look); }));
  }
  function moleculeMode(v) {
    /* 021 R5 · ONE MODE: the windows each mode hides are the MODE table's (shell/settings.js), never a hand list here */
    for (const d of document.querySelectorAll('.dev[data-id]')) if (MODE[d.dataset.id] === 'hydrogen') d.hidden = !!v;   // CALCULUS reads the atomic register: it stands down too (Round 11 §10b)
    wChem.root.hidden = !v;                                          // iteration 008 U: the one card (the register lives in it)
    if (v && wChem.root.classList.contains('closed')) app.sh.layout.reopen('chem');   // 017 call 8: ON after a × brings the card back (the rack's road, neighbours travel)
    modeSeg.set(v ? 'molecules' : 'hydrogen');
    /* iteration 012 R3 hid POSITION | MOMENTUM under a molecule; iteration 017 W2 GREYS MOMENTUM instead (016 V1: greyed, never hidden, the seats stay) —
       WAVE's one seat is styleSync (material.js), which greys by mode too.  A molecule letting go with BALLS · STICKS · ESP drawn falls back to CLOUD, as
       the shader already draws it — after the turn, so a restore that lands the molecule OFF then ON keeps its file's style */
    if (ui.styleSync) ui.styleSync();
    if (!v && mat.style >= STYLE.balls) queueMicrotask(() => { if (!(app.state.chem && app.state.chem.on) && mat.style >= STYLE.balls) { mat.style = STYLE.cloud; ui.styleSeg.set('cloud'); schedule(TIER.PRESENT); } });
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
    if (ui.styleSync) ui.styleSync();   // iteration 017 W2: the volume's kind moved with its model — Im ψ greys or wakes (material.js modeSync)
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
  /* 017 (Josh's call 8, 2026-10-26): AN EFFECT SHOWS ITS WINDOW holds for the mode too — the card's × or POWER OFF is MOLECULES OFF (the molecule
     lets the field go; the Picker, the CSB's mode or ‹ SYSTEM › MOLECULES bring it back, and moleculeMode reopens a ×'d card) */
  wChem.root.addEventListener('devclose', () => { const C = app.state.chem; if (C && C.on) C.setOn(false); });
  wChem.root.querySelector('.dev-power').addEventListener('click', () => { const C = app.state.chem; if (wChem.root.classList.contains('off') && C && C.on) C.setOn(false); });
  /* SKELETON · BEAD · ELLIPSOID (0.7.0 V2 · 0.8.2 P3 · 0.8.3 B3) are INFORMATIONAL's MARKS since iteration 007 (lab/informational.js builds them):
     MOLECULES no longer reaches into that card's body.  The stage words are spoken through ONE verb, stageText.say(kind, text) (shell/stage-words.js) */
  const say = (kind, t, o) => !!app.state.stageText && app.state.stageText.say(kind, t, o);
  /* 027 D1 · A DEMO OPENS CLEAN: a solve's derived fill (the orbital, the register's selection, the STATES ladder and a parked lane
     record, the first potential's view) joins the history row that asked for it (S4) AND the clean mark it stood on: a project clean
     when its solve lands is clean after it — the open's mark is taken at the restore, before the worker answers */
  const derived = (fill) => { const P = app.sh.layout && app.sh.layout.projects, d = P ? P.folders.dirty() : null;
    if (app.state.history) app.state.history.absorb(fill); else fill();
    if (d && d.known && !d.dirty) P.markClean(); };
  /* 034 F5 · while a load is up, ESC is its emergency stop: a layer of THE ESCAPE STACK (lab/actions.js), put away when the load ends */
  const chemLoading = cardLoading(wChem, 'chem'); let escStop = null;
  const loading = (v) => { chemLoading(v); if (v && !escStop) escStop = app.sh.ACTIONS.escape.push(() => { escStop = null; if (app.state.chem) app.state.chem.halt(); }, { fields: true }); else if (!v && escStop) { escStop(); escStop = null; } };
  app.state.chem = createChem(wChem.body, { say, active: () => canPresent(wChem), loading, stopWorker: () => solveChem.reset && solveChem.reset(), moreOpen: FIRST_RUN.more, modHand: (id, v) => app.ctl.modHand(id, v),   // iteration 007 (MIR check B2): a hand on a ROUTED dial moves its base   // 0.4.0 S0: the MORE fold; folded on every first run since iteration 001
    solve: (msg, fallback, pluck) => solveChem(msg, fallback, pluck), balance, plane: () => app.w.slice,
    modBase: (id, v) => { const H = app.state.modHost; if (H && H.registry.has(id)) H.registry.setBase(id, v); },   // iteration 007 O: an UNROUTED hand on the ORBITAL is its base at once (syncBases runs only while the modulation clock does)   // iteration 005 P2: THE CONTINUITY RECORD samples PLANE's own geometry
    repaint(rebuild) { schedule(rebuild ? TIER.REBUILD : TIER.PRESENT); },
    status(t, cls) { wChem.setStatus(t, cls); },
    setOn(v) { moleculeMode(v); switching(v); app.w.stageTextTick(); if (app.hooks.status) app.hooks.status(); }, said: () => app.hooks.status && app.hooks.status(),   // 0.5.4 P4: the STATUS row (informational.js)
    viewed: (hand) => { const R = app.state.register; if (!R) return; if (hand && app.state.chem.view === 'orbital') R.setMode('orbital'); R.follow(hand); },   // iteration 008 U: ON, VIEW or a file moved — the register follows the one state; R: a HAND's VIEW ORBITAL shows the ladder its cursor stands on
    cursor: () => { if (app.state.register) app.state.register.orbitals.paint(); },   // iteration 008 R: the ORBITAL dial's orbital, the VIEW or ON moved — the ladder redraws its cursor
    hand: (id) => headPick(id),                                      // 0.5.1 D2: a HAND pick (the dropdown, ON, a notebook link)
    atomZ: () => HAMILTONIANS.atom.Z, atom(z) { setElement(z); if (getHamiltonian().id !== 'atom') switchHamiltonian('atom'); ui.hamSeg.set('atom'); app.w.wAtoms.root.hidden = false; app.w.wAtoms.root.classList.remove('closed'); },   // 0.7.4 C2: ‹ ATOMS ›' tile, SPECTRUM's ATOM road
    /* the card does not touch the field: it hands `ground` and `tdhf` products to the session, which decides which
       model is playing and which observable the field shows.  See molecular-session.js. */
    session: app.state.molSession,
    derived,   // S4 · a solve's derived defaults join the row that asked for it (and 027 D1: the clean mark)
    now: () => clock.t, clock, fps: () => app.ctl.stats.fps,   // 0.7.0 V1 VIBRATE: the flash law reads RATE and the fps; BREATHE sets RATE (the knob's road) and plays
    breathe(r) { ui.rateKnob.set(r); if (!app.ctl.modHand('transport.rate', r)) clock.setRate(r); clock.play(performance.now() / 1000); schedule(TIER.EVOLVE); } });
  /* 0.5.1 D2 · THE MOLECULE'S HEAD (R6-G): a HAND pick shows its head (latex-state.js moleculeHead: every number the record's stem or
     the live solve) in THE FADE's seat once THIS molecule's solve lands — held until Escape, a press on the picture after 2.5 s, or
     the next pick: the dismiss half of the kit's greet (info/page.js; λWAVES has no pages model).  A restore, an undo, a project,
     link or demo open never shows it — none comes through `hand`.  `head.shown` is the gate's witness (__LW.head). */
  const head = { shown: 0, md: null, want: null, bye: null };
  function headPick(id) { if (head.bye) head.bye(); head.want = id; headLand(app.state.chem.solution()); }
  /* 2026-10-16 (Josh, iteration 001): the head left the stage — iteration 007 brings it back only as INFORMATIONAL › ANNOUNCE › MOLECULE HEAD
     (the kind `head`, off on a first run): with the switch off a pick waits for nothing */
  function headLand(sol) {
    const id = head.want, row = id && MOLECULE_BY_ID.get(id), T = app.state.stageText;
    if (!T || !T.wants('head')) { head.want = null; return; }
    if (!row || !sol) return;
    if (app.state.chem.preset() !== id) { head.want = null; return; }                      // the molecule changed first: nothing
    if (sol.key.replace(/\|lda$/, '') !== id + '|' + app.state.chem.basis + '|' + row.charge) return;   // chemview's solve key: this molecule's landing (0.7.3: RKS LDA's too)
    head.want = null;
    const md = moleculeHead({ molecule: row, basis: app.state.chem.basis, ground: sol, stem: sol.stem, status: app.state.chem.said });   // 0.5.4 P4: tell() ran before notify()
    if (!md || !T.announce(md, 0)) return;
    head.shown++; head.md = md;
    const life = new AbortController(), until = performance.now() + 2500, bye = head.bye = () => { life.abort(); if (head.bye === bye) head.bye = null; T.dismiss(md); };
    life.signal.addEventListener('abort', app.sh.ACTIONS.escape.push(bye));   // 021 I1: a layer of THE ESCAPE STACK (lab/actions.js) until it goes
    dom.canvas.addEventListener('pointerdown', () => { if (performance.now() >= until) bye(); }, { signal: life.signal, passive: true });
  }
  app.state.chem.subscribe(headLand);
  /* iteration 007 O · a file's ORBITAL index this molecule does not hold is clamped to its span (chemview land), and STATE says so, never throws */
  app.state.chem.subscribe((sol) => { const c = app.state.chem.clamped, row = app.state.chem.row();
    if (c && sol && c.key === sol.key) wState.setStatus(`ORBITAL ${c.asked} is past ${row ? row.name : 'this molecule'}’s orbitals ${c.lo}–${c.hi}: clamped to ${c.k}`, 'warn'); });
  /* THE REGISTER, INTO the MOLECULES card (iteration 008 U: Josh, "MERGE Molecules with MO-registry"); `say` is lazy, so it need not wait for the stage words */
  const C = app.state.chem;
  /* THE ONE SWITCH: a pane's public ON (a verb, a stick's press, a file) is MOLECULES ON with VIEW MIX (id `registry`); its OFF is MOLECULES OFF */
  const one = (v, hand) => { if (!v) { C.setOn(false); return; } if (C.view !== 'registry') C.setView('registry', hand); if (!C.on) C.setOn(true); else app.state.register.follow(hand); };
  app.state.register = createRegister(C.slots.register, { bar: C.slots.top, one, stroked: () => { C.setView('registry', true); },   // a hand that painted the ladder picked VIEW MIX
    active: () => canPresent(wChem), modHand: (id, v) => app.ctl.modHand(id, v),   // iteration 007 (MIR check B2): the STATES dials' hand law
    stamp: () => { if (app.state.restampParams) requestAnimationFrame(app.state.restampParams); },   // a lane built after boot becomes a drop target for a macro
    solve: (msg, fallback, pluck) => solveChem(msg, fallback, pluck), balance, derived,   // the STATES mode asks the chem worker for its canonical ladder and vectors
    repaint(rebuild) { schedule(rebuild ? TIER.REBUILD : TIER.PRESENT); },
    status(t, cls) { wChem.setStatus(t, cls); },
    announce: (md) => say('preset', md), pop: (t) => say('registry', t),   // a HAND's preset only (orbitalsview / statesview presetSel); the orbital a hand added (orbitalsview)
    now: () => clock.t, rate: () => clock.rate, field: () => field, chem: () => app.state.chem, session: app.state.molSession,
    song: { reg, hydrogen: () => getHamiltonian().id === 'hydrogen', filming: () => app.state.exportLocked, land(re, im, t) { app.state.rotTicking = true; reg.anchorFrom(re, im, t); app.state.rotTicking = false; touchState(); } } });   // 0.6.4 S1: a landing notes no history row, as the rotation drive's ticks
  app.state.orbitals = app.state.register.orbitals; app.state.states = app.state.register.states;
  wChem.root.hidden = !C.on;                                         // iteration 002: ATOMS is the boot's mode; MOLECULES ON shows the card (moleculeMode)
  app.w.wChem = wChem; app.w.head = head; return { wChem, head };
}
