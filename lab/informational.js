/* lab/informational.js — INFORMATIONAL (0.5.3 M9; Josh, PLAN §11 answer 3: "the two rows are correct but make them their own window called
 * 'Informational'"): what the stage writes, in its own rack card.  CLOSED on a first run (no first-run list names it); in + and WINDOW as every rack
 * card is; opened UNDER SETTINGS.  0.5.4 P4 seats its STATUS line here.  In lab/, not windows/: rack-deps admits only rack.js's planned modules there.
 * Iteration 007 I (Josh, JOSH-PROMPT items 8–10; ADR-0003): THE WINDOW IS BUILT FROM THE RECORD'S ROWS.  shell/stage-words.js owns the rows
 * (INFO_ROWS) and the one PREFERENCE record `lambdawaves.q0.info`; each row here is the kit's control(descriptor) — a switch, a seg, a knob, as the
 * kind of value chooses — grouped under short headings: THE WORDS (the formula, its NAME and SIZE; the ATOM LABELS and theirs; POSITION · PAD),
 * ANNOUNCE (one switch per kind and the pop-ups' SIZE), CURSOR (AWAY · DRIFT), MARKS (SKELETON · BEAD · ELLIPSOID, which draw on the stage and keep
 * their blob keys) — and STATUS.  A hand writes the record and nothing else; the record repaints the controls (FORGET, a verb's flip). */
import { el, sw, readout, group } from './mir/kit.js'; import { control } from './mir/controls/factory.js'; import { fold } from './fold.js';
import { statusOf } from './status.js'; import { getHamiltonian } from './hamiltonian.js'; import { INFO_ROWS, infoPrefs } from './shell/stage-words.js';
import { TIER } from './rack.js';
export function createInformational(app) {
  const { ui, device, isPhone } = app, { schedule } = app.loop, P = infoPrefs();
  const w = device({ id: 'informational', eyebrow: 'INFORMATIONAL', title: 'what the stage writes', status: '' });
  w.root.classList.add('native-clean', 'closed', 'lw-info-card'); app.host.rack.appendChild(w.root);
  /* one control per row, its value the record's: a hand sets the row (a dial live, as before), nothing else is written */
  const ctl = {};
  for (const r of INFO_ROWS) {
    const d = { id: 'info.' + r.key, label: r.label, hint: r.hint, value: P.get(r.key) };
    if (r.type === 'bool') d.type = 'boolean';
    else if (r.type === 'enum') d.options = r.options;
    else Object.assign(d, { min: r.min, max: r.max, step: r.step, fmt: r.fmt, home: r.default, onInput: (v) => P.set(r.key, v) });
    d.onChange = (v) => P.set(r.key, v);
    ctl[r.key] = control(d);
  }
  P.subscribe((st, changed) => { for (const k of changed) if (ctl[k] && ctl[k].get() !== st[k]) ctl[k].set(st[k]); });
  /* the names other roads press: verbs.js `switch formula|labels`, the notebook's command list */
  ui.molFormulaSw = ctl.molFormula.widget; ui.atomLabelsSw = ctl.atomLabels.widget;
  const row = (parent, keys, cls = '') => { const r = el('div', 'row tight' + (cls ? ' ' + cls : ''), parent); for (const k of keys) r.appendChild(ctl[k].root); return r; };
  const words = group(w.body, 'THE WORDS');
  row(words, ['molFormula', 'molFormulaSize'], 'info-words');
  row(words, ['molName'], 'info-words');
  row(words, ['atomLabels', 'atomLabelsSize'], 'info-words');
  row(words, ['infoPos', 'infoPad'], 'info-seat');
  const announce = group(w.body, 'ANNOUNCE');
  row(announce, INFO_ROWS.filter((r) => r.group === 'announce' && r.type === 'bool').map((r) => r.key), 'info-grid');
  row(announce, ['popSize'], 'info-size');
  const cursor = group(w.body, 'CURSOR');
  row(cursor, ['cursorAway', 'cursorDrift'], 'info-grid');
  /* MARKS: SKELETON · BEAD · ELLIPSOID draw ON the stage (2026-10-16, Josh, iteration 001), so they are INFORMATIONAL's — built here since iteration 007,
     where MOLECULES used to reach into this card's body.  Each stays its blob key (skeleton / bead / ellipsoid, settings.js), off when nothing was said */
  const marks = group(w.body, 'MARKS'), save = () => { app.sh.saveSettings(); schedule(TIER.PRESENT); };
  ui.skeletonSw = sw({ label: 'SKELETON', value: false, title: 'The nuclei as beads (CPK colours, 0.28 × the covalent radius), the bonds within 1.3 × the radii, and the dipole arrow from the centre of nuclear charge — a PREFERENCE, off by default', onChange: save });   // 0.7.0 V2: rack.js draws it (lab/skeleton.js)
  ui.beadSw = sw({ label: 'BEAD', value: false, title: 'THE BEAD: the expectation point (⟨x⟩, ⟨y⟩, ⟨z⟩) on the stage with its trail over the last period (⟨p⟩ in momentum space; for a molecule the electron density\'s centroid (ΣZR − μ)/N_e) — a PREFERENCE, off by default', onChange: save });   // 0.8.2 P3: rack.js draws it on the skeleton's canvas
  ui.ellipsoidSw = sw({ label: 'ELLIPSOID', value: false, title: 'THE UNCERTAINTY ELLIPSOID: the position covariance Σ_ij = ⟨r_i r_j⟩ − ⟨r_i⟩⟨r_j⟩ as its three principal circles, semi-axes √λ_k, about the bead (with it) — position space and a register only; a PREFERENCE, off by default', onChange: save });   // 0.8.3 B3: rack.js draws it after the bead
  el('div', 'row tight info-grid info-marks', marks).append(ui.skeletonSw.root, ui.beadSw.root, ui.ellipsoidSw.root);
  /* THE FOLD (lab/fold.js): ANNOUNCE · CURSOR · MARKS behind one chevron on its own line under THE WORDS — open on a desktop, folded on a phone
     (as MOLECULES' MORE) */
  const more = el('div', 'row tight info-more'); words.after(more); el('span', 'grp-lbl', more, 'ANNOUNCE · CURSOR · MARKS');
  fold(more, [announce, cursor, marks], { what: 'announcements, cursor and marks', open: !isPhone() });
  /* 0.5.4 P4 · STATUS (PLAN R8, Q12): lab/status.js' line for what owns the field — MOLECULES' kept one (per VIEW; its molecule-level line beneath), else the
     operator's — written by app.hooks.status on a landing, a VIEW or FLOW change, an owner or operator change, NEVER in a frame.  A tap: the MODEL sheet, its words. */
  const st = readout({ label: 'STATUS', cls: 'wide lw-status', value: '—' }); let was; el('div', 'row tight', w.body).append(st.root);
  st.root.title = 'What EXACT, NUMERICAL and UNCHECKED mean: the MODEL sheet'; st.root.addEventListener('click', () => { if (app.hooks.sheet) app.hooks.sheet(); });
  app.hooks.status = () => { const c = app.state.chem, k = c && c.on ? c.said : app.reg.P && app.reg.P.stark ? 'stark' : getHamiltonian().id, m = k === 'hydrogen' && getHamiltonian().mass, A = k === 'atom' && getHamiltonian().element,   // iteration 008 A: the ATOM speaks per element (past Kr)
      key = m ? k + m : A ? k + A.Z : k, s = key === was ? undefined : typeof k === 'string' ? statusOf({ owner: k, label: m ? 'HYDROGEN · ' + m : A ? A.symbol : '', Z: A ? A.Z : 0 }) : k;
    if (s !== undefined) { was = key; st.set(s ? s.line : '—', s && s.word === 'UNCHECKED' ? 'warn' : ''); st.setSub(s && (typeof k !== 'string' || s.atom) ? s.head : ''); } };
  app.hooks.status();
  /* UNDER SETTINGS: the kit opens a window at the top of its rack (and raise() puts it there after); once that press is done, the seat after
     SETTINGS — by the kit's own move(), so the rack's motion and its save follow — while SETTINGS stands open in a rack and this card is not floating */
  w.root.addEventListener('devopen', () => queueMicrotask(() => {
    const s = ui.set.root, rk = s.parentElement, list = rk ? [...rk.children].filter((c) => c.classList.contains('dev') && c !== w.root && !c.hidden && !c.classList.contains('closed')) : [];
    if (app.sh.rk && /^rackL?$/.test(rk && rk.id) && !s.classList.contains('closed') && !w.root.classList.contains('floating')) app.sh.rk.move('informational', { side: rk.id === 'rackL' ? 'left' : 'right', index: list.indexOf(s) + 1 });
  }));
  return w;
}
