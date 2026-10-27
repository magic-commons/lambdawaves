/* lab/informational.js — INFORMATIONAL (0.5.3 M9; Josh, PLAN §11 answer 3: "the two rows are correct but make them their own window called
 * 'Informational'"): what the stage writes, in its own rack card.  CLOSED on a first run (no first-run list names it); in + and WINDOW as every rack
 * card is; opened UNDER SETTINGS.  0.5.4 P4 seats its STATUS line here.  In lab/, not windows/: rack-deps admits only rack.js's planned modules there.
 * Iteration 007 I (Josh, JOSH-PROMPT items 8–10; ADR-0003): THE WINDOW IS BUILT FROM THE RECORD'S ROWS.  shell/stage-words.js owns the rows
 * (INFO_ROWS) and the one PREFERENCE record `lambdawaves.q0.info`; each row here is the kit's control(descriptor) — a switch, a seg, a knob, as the
 * kind of value chooses — grouped under short headings: THE WORDS (the formula, its NAME and SIZE; the ATOM LABELS and theirs; POSITION · PAD),
 * ANNOUNCE (one switch per kind and the pop-ups' SIZE), CURSOR (PARALLAX · DRIFT), MARKS (BEAD · UNCERTAINTY · DIPOLE — BALL AND STICK is THE WORDS' since 011 Q1 — which draw on the stage; the
 * record's since the fix round, C6, their blob keys lifted once) — and STATUS.  A hand writes the record and nothing else; the record repaints the controls (FORGET, a verb's flip). */
import { el, readout, group, trig } from './mir/kit.js'; import { control } from './mir/controls/factory.js'; import { fold } from './fold.js';
import { statusOf } from './status.js'; import { getHamiltonian } from './hamiltonian.js'; import { INFO_ROWS, infoPrefs } from './shell/stage-words.js';
export function createInformational(app) {
  const { ui, device, isPhone } = app, P = infoPrefs();
  const w = device({ id: 'informational', eyebrow: 'INFORMATIONAL', title: 'what the stage writes', status: '' });
  w.root.classList.add('native-clean', 'closed', 'lw-info-card'); app.host.rack.appendChild(w.root);
  /* one control per row, its value the record's: a hand sets the row (a dial live, as before), nothing else is written */
  const ctl = {};
  for (const r of INFO_ROWS) {
    if (r.key === 'espBarSide') continue;   // a cycle button, below
    const d = { id: 'info.' + r.key, label: r.label, hint: r.hint, value: P.get(r.key) };
    if (r.type === 'bool') d.type = 'boolean';
    else if (r.type === 'enum') d.options = r.options;
    else Object.assign(d, { min: r.min, max: r.max, step: r.step, log: r.log, fmt: r.fmt, home: r.default, onInput: (v) => P.set(r.key, v) });
    d.onChange = (v) => P.set(r.key, v);
    ctl[r.key] = control(d);
  }
  /* iteration 018 B7: the ESP bar's SIDE is one press that cycles RIGHT → LEFT → TOP → BOTTOM (Josh: "a toggle that just cycles"), not a seg */
  { const r = INFO_ROWS.find((q) => q.key === 'espBarSide'), word = (v) => r.options.find((o) => o.id === v).label; let shown = P.get(r.key);
    const b = trig({ label: word(shown), title: r.hint, cls: 'info-side', onFire: () => P.set(r.key, r.values[(r.values.indexOf(P.get(r.key)) + 1) % r.values.length]) });
    ctl[r.key] = { root: b.root, get: () => shown, set: (v) => { shown = v; b.setLabel(word(v)); } }; }
  P.subscribe((st, changed) => { for (const k of changed) if (ctl[k] && ctl[k].get() !== st[k]) ctl[k].set(st[k]); });
  /* the names other roads press: verbs.js `switch formula|labels`, the notebook's command list */
  ui.molFormulaSw = ctl.molFormula.widget; ui.atomLabelsSw = ctl.atomLabels.widget;
  const row = (parent, keys, cls = '') => { const r = el('div', 'row tight' + (cls ? ' ' + cls : ''), parent); for (const k of keys) r.appendChild(ctl[k].root); return r; };
  /* iteration 012 R1 (Josh 10-20): the headings THE WORDS and ANNOUNCE · CURSOR · MARKS are hidden — the rows say what they are */
  const words = group(w.body, 'THE WORDS'); words.querySelector(':scope > .grp-lbl')?.remove();
  row(words, ['molFormula', 'molFormulaSize'], 'info-words');
  row(words, ['molName', 'molSubtitle', 'listCap'], 'info-words info-bar');   // iteration 011 Q1: THE LIST CAP beside NAME — both say what the formula writes; 018 B9: SUBTITLE between
  row(words, ['atomLabels', 'atomLabelsSize'], 'info-words');
  row(words, ['skeleton', 'skeletonOpacity', 'skeletonSize'], 'info-words info-ball');   // iteration 011 Q1: its own row; 012 R1: BALL AND STICK, shorter, OPACITY between it and SIZE
  row(words, ['bondOrder', 'bondAromatic', 'bondIonic', 'bondHydrogen'], 'info-words info-bonds');   // iteration 014 D6: BALL AND STICK's BONDS, one row under it
  /* the frame reads the BONDS as one object (rack.js → skeleton.draw) and the skeleton tells which road drew them in this card's status line */
  ui.bondsOf = () => { const c = app.state.chem; return { order: P.get('bondOrder'), aromatic: P.get('bondAromatic'), ionic: P.get('bondIonic'), hbond: P.get('bondHydrogen'), charges: c && c.chargesNow ? c.chargesNow() : null, rec: c && c.bondsNow ? c.bondsNow() : null }; };
  ui.bondSay = (line) => w.setStatus(line, 'live');
  const seat = row(words, ['infoPos', 'infoPad'], 'info-seat');
  ui.espBarRow = row(words, ['espBar', 'espBarSide', 'espBarPad'], 'info-words info-bar');   // 018 B7: ESP BAR · SIDE · PAD (WAVE paints it, these seat it)
  ui.espBarRow.hidden = !(app.state.chem && app.state.chem.on);   // 018 B10: a molecule's row — hidden under hydrogen or an atom; WAVE's modeSync re-syncs it
  const announce = group(w.body, 'ANNOUNCE');
  /* iteration 012 R1: ORBITALS is one switch for the two orbital kinds, so the pop-ups' SIZE takes the grid's last cell (where STYLE · PALETTE stood) */
  row(announce, [...INFO_ROWS.filter((r) => r.group === 'announce' && r.type === 'bool').map((r) => r.key), 'popSize'], 'info-grid');
  /* iteration 012 R1: CURSOR and MARKS are two columns of switches, side by side */
  const cols = el('div', 'info-cols', w.body), cursor = group(cols, 'CURSOR');
  row(cursor, ['cursorAway', 'cursorDrift'], 'info-col');
  /* MARKS: BEAD · UNCERTAINTY draw ON the stage (2026-10-16, Josh, iteration 001), so they are INFORMATIONAL's — rows of its record since the
     fix round (C6); the frame reads their widgets (and SKELETON's, in THE WORDS since iteration 011 Q1, with its SIZE knob's), and a change repaints by the
     record's own subscriber (stage-words.js applyInfo) */
  const marks = group(cols, 'MARKS');
  row(marks, ['bead', 'ellipsoid', 'dipole'], 'info-col info-marks');
  ui.skeletonSw = ctl.skeleton.widget; ui.skeletonSize = ctl.skeletonSize.widget; ui.skeletonOpacity = ctl.skeletonOpacity.widget; ui.dipoleSw = ctl.dipole.widget; ui.beadSw = ctl.bead.widget; ui.ellipsoidSw = ctl.ellipsoid.widget;
  /* THE FOLD (lab/fold.js): ANNOUNCE · CURSOR · MARKS behind one chevron — open on a desktop, folded on a phone (as MOLECULES' MORE); iteration 013
     N1 (Josh: "Shorten the buttons for position move pad knob to fit the expand window button so it's on the same row"): the chevron is the
     seat row's last cell, after POSITION and PAD — one row less */
  fold(seat, [announce, cols], { what: 'announcements, cursor and marks', open: !isPhone() });
  /* 0.5.4 P4 · STATUS (PLAN R8, Q12): lab/status.js' line for what owns the field — MOLECULES' kept one (per VIEW; its molecule-level line beneath), else the
     operator's — written by app.hooks.status on a landing, a VIEW or FLOW change, an owner or operator change, NEVER in a frame.  A tap: the MODEL sheet, its words. */
  /* iteration 011 Q1 (Josh 10-19: "a button that hides the extra status thingy"): the STATUS switch above it shows or hides the readout's row — the record's
     `status`, off on a first run; hidden, the line is still kept current, so it is right the moment it is shown */
  /* iteration 012 R1 (Josh 10-20: "Status should not be a toggle in the window itself and should be a toggle on the window title bar like the molecules
     window (Icon looks like "Aa")"): the record's `status` is the title bar's Aa — struck through (pressed) while the readout is hidden, as MOLECULES' is */
  const st = readout({ label: 'STATUS', cls: 'wide lw-status', value: '—' }); let was; const stRow = el('div', 'row tight', w.body); stRow.append(st.root);
  const aa = el('button', 'dev-lean info-aa', null, 'Aa'); aa.type = 'button'; aa.title = 'Hide or show the STATUS readout'; aa.setAttribute('aria-label', 'hide or show the status readout');
  const util = w.root.querySelector('.dev-util'); if (util) util.insertBefore(aa, util.firstChild);
  aa.addEventListener('click', (e) => { e.stopPropagation(); P.set('status', !P.get('status')); });
  const showStatus = () => { const on = !!P.get('status'); stRow.hidden = !on; aa.classList.toggle('on', !on); aa.setAttribute('aria-pressed', String(!on)); };
  showStatus(); P.subscribe((_, changed) => { if (changed.includes('status')) showStatus(); });
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
