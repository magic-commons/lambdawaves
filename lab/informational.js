/* lab/informational.js — INFORMATIONAL (0.5.3 M9; Josh, PLAN §11 answer 3: "the two rows are correct but make them their own window called
 * 'Informational'"): what the stage writes, in its own rack card.  CLOSED on a first run (no first-run list names it); in + and WINDOW as every rack
 * card is; opened UNDER SETTINGS.  0.5.4 P4 seats its STATUS line here.  In lab/, not windows/: rack-deps admits only rack.js's planned modules there.
 * Iteration 007 I (Josh, JOSH-PROMPT items 8–10; ADR-0003): THE WINDOW IS BUILT FROM THE RECORD'S ROWS.  shell/stage-words.js owns the rows
 * (INFO_ROWS) and the one PREFERENCE record `lambdawaves.q0.info`; each row here is the kit's control(descriptor) — a switch, a seg, a knob, as the
 * kind of value chooses — grouped under short headings: THE WORDS (the formula, its NAME and SIZE; the ATOM LABELS and theirs; POSITION · PAD),
 * ANNOUNCE (one switch per kind and the pop-ups' SIZE), CURSOR (PARALLAX · DRIFT), MARKS (BEAD · UNCERTAINTY · DIPOLE — BALL AND STICK is THE WORDS' since 011 Q1 — which draw on the stage; the
 * record's since the fix round, C6, their blob keys lifted once) — and STATUS.  A hand writes the record and nothing else; the record repaints the controls (FORGET, a verb's flip). */
import { el, readout, group, trig, ariaLabel } from './mir/kit.js'; import { control } from './mir/controls/factory.js'; import { fold } from './fold.js';
import { statusOf } from './status.js'; import { getHamiltonian } from './hamiltonian.js'; import { INFO_ROWS, infoPrefs } from './shell/stage-words.js';
export function createInformational(app) {
  const { ui, device, isPhone } = app, P = infoPrefs();
  const w = device({ id: 'informational', eyebrow: 'INFORMATIONAL', status: '' });
  w.root.classList.add('closed', 'lw-info-card'); app.host.rack.appendChild(w.root);
  /* one control per row, its value the record's: a hand sets the row (a dial live, as before), nothing else is written */
  const ctl = {};
  for (const r of INFO_ROWS) {
    if (r.key === 'espBarSide' || r.key === 'infoPos') continue;   // cycle buttons, below
    const d = { id: 'info.' + r.key, label: r.label, hint: r.hint, value: P.get(r.key) };
    if (r.type === 'bool') d.type = 'boolean';
    else if (r.type === 'enum') d.options = r.options;
    else Object.assign(d, { min: r.min, max: r.max, step: r.step, log: r.log, fmt: r.fmt, home: r.default, onInput: (v) => P.set(r.key, v) });
    d.onChange = (v) => P.set(r.key, v);
    ctl[r.key] = control(d);
  }
  /* iteration 018 B7: the ESP bar's SIDE is one press that cycles RIGHT → LEFT → TOP → BOTTOM (Josh: "a toggle that just cycles"), not a seg */
  /* 022 H1 · A GLYPH REPLACES THE WORDS: the button wears the side it is on (icons.js sideRight · sideLeft · sideTop · sideBottom); the word is its name */
  /* 040 I3 (Josh 11-09: "make the 'position: top/bottom' switch … into a toggle"): POSITION is the same press, TOP ⇄ BOTTOM, wearing the side it is on */
  const cycle = (key, cls, aria) => { const r = INFO_ROWS.find((q) => q.key === key), word = (v) => r.options.find((o) => o.id === v).label, gly = (v) => 'side' + v[0].toUpperCase() + v.slice(1); let shown = P.get(key);
    const b = trig({ label: '', glyph: gly(shown), title: r.hint, cls, onFire: () => P.set(key, r.values[(r.values.indexOf(P.get(key)) + 1) % r.values.length]) });
    const name = (v) => { b.root.dataset.side = v; ariaLabel(b.root, aria, { side: { t: word(v) } }); }; name(shown);
    ctl[key] = { root: b.root, get: () => shown, set: (v) => { shown = v; b.setGlyph(gly(v)); name(v); } }; };
  cycle('espBarSide', 'info-side', 'ESP bar side: {side}'); cycle('infoPos', 'info-pos', 'Formula position: {side}');
  /* 040 I3 · ANNOUNCE ALL (Josh: "a toggle/button in the announce section … to tick all of the announcements on or off"): no key of its own — on
     while every announcement is on; a press writes them all, the record repaints the switches (and this one) */
  const SAY = INFO_ROWS.filter((r) => r.group === 'announce' && r.type === 'bool').map((r) => r.key), allOn = () => SAY.every((k) => P.get(k));
  ctl.announceAll = control({ id: 'info.announceAll', type: 'boolean', label: 'ANNOUNCE ALL', hint: 'Every announcement on or off', value: allOn(), onChange: (v) => P.set(Object.fromEntries(SAY.map((k) => [k, !!v]))) });
  P.subscribe((st, changed) => { for (const k of changed) if (ctl[k] && ctl[k].get() !== st[k]) ctl[k].set(st[k]); if (changed.some((k) => SAY.includes(k)) && ctl.announceAll.get() !== allOn()) ctl.announceAll.set(allOn()); });
  /* the names other roads press: verbs.js `switch formula|labels`, the notebook's command list */
  ui.molFormulaSw = ctl.molFormula.widget; ui.atomLabelsSw = ctl.atomLabels.widget;
  const row = (parent, keys, cls = '') => { const r = el('div', 'row tight fit' + (cls ? ' ' + cls : ''), parent);   /* 022 F2 (call 7): every hand grid a fit row */ for (const k of keys) r.appendChild(ctl[k].root); return r; };
  /* iteration 012 R1 (Josh 10-20): the headings THE WORDS and ANNOUNCE · CURSOR · MARKS are hidden — the rows say what they are */
  const words = group(w.body, 'THE WORDS'); words.querySelector(':scope > .grp-lbl')?.remove();
  row(words, ['molFormula', 'infoPos', 'infoPad', 'molFormulaSize'], 'info-words info-formula');   // 040 I3: POSITION beside the switch; 041 I1 (Josh: "Shorten the text 'Stage Formula' … fit the 'pad' knob between the formula position toggle and the size knob"): FORMULA · POSITION · PAD · SIZE, a column each
  row(words, ['molName', 'molSubtitle', 'listCap'], 'info-words info-name');   // iteration 011 Q1: THE LIST CAP beside NAME — both say what the formula writes; 018 B9: SUBTITLE between
  row(words, ['atomLabels', 'atomLabelsSize'], 'info-words');
  row(words, ['skeleton', 'skeletonOpacity', 'skeletonSize'], 'info-words info-ball');   // iteration 011 Q1: its own row; 012 R1: BALL AND STICK, shorter, OPACITY between it and SIZE
  /* the frame reads the BONDS as one object (rack.js → skeleton.draw) and the skeleton tells which road drew them in this card's status line */
  ui.bondsOf = () => { const c = app.state.chem; return { order: P.get('bondOrder'), aromatic: P.get('bondAromatic'), ionic: P.get('bondIonic'), hbond: P.get('bondHydrogen'), charges: c && c.chargesNow ? c.chargesNow() : null, rec: c && c.bondsNow ? c.bondsNow() : null }; };
  ui.bondSay = (line) => w.setStatus(line, 'live');
  /* 041 I4 (Josh 11-09: "Let announce all and the announcement size knob be on the same row and not let it be hidden when window is in it's smaller form"):
     ANNOUNCE ALL · the fold's chevron · the pop-ups' SIZE, always shown (PAD is the FORMULA row's since I1) */
  const seat = row(words, ['announceAll'], 'info-seat');
  /* 041 I7 (Josh 11-09: "Let order, aromatic, ionic, h-bond, be in the hidden part of the informational window"): BALL AND STICK's BONDS (014 D6),
     the fold's first group, under their own word */
  const bonds = group(w.body, 'BONDS'); row(bonds, ['bondOrder', 'bondAromatic', 'bondIonic', 'bondHydrogen'], 'info-words info-bonds');
  const announce = group(w.body, 'ANNOUNCE');
  /* 040 I3 (Josh: "move the ESP bar row into the hidden expanded section"): the fold's first row; its own `hidden` (a molecule's row) stays its own */
  ui.espBarRow = row(announce, ['espBar', 'espBarSide', 'espBarPad'], 'info-words info-bar'); announce.prepend(ui.espBarRow);   // 018 B7: ESP BAR · SIDE · PAD (WAVE paints it, these seat it); 040 I3: above the ANNOUNCE heading
  ui.espBarRow.hidden = !(app.state.chem && app.state.chem.on);   // 018 B10: a molecule's row — hidden under hydrogen or an atom; WAVE's modeSync re-syncs it
  row(announce, SAY, 'info-grid');   // iteration 012 R1: ORBITALS is one switch for the two orbital kinds; 041 I4: the pop-ups' SIZE left the grid for the seat row
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
     seat row's cell — one row less */
  fold(seat, [bonds, announce, cols], { what: 'bonds, ESP bar, announcements, cursor, marks', key: 'announcements, cursor and marks', open: !isPhone() });   // 040 I3: the key is the WORKSPACE `folds` name, kept
  seat.appendChild(ctl.popSize.root);   // 041 I4: SIZE in the knob column, the chevron in the button column
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
  st.root.title = 'What EXACT, NUMERICAL and UNCHECKED mean: the MODEL sheet';
  /* 022 H1 · A HINT IS ONE LINE: the two sentences the rows' hints no longer carry, in the window's ⓘ */
  el('div', 'note', w.body).innerHTML = '<b>The words.</b> FORMULA also captions every picture and recording; off, an export carries no words. A list longer than LIST CAP is written as its count (140 levels · 7 shells) and returns once it fits.'; st.root.addEventListener('click', () => { if (app.hooks.sheet) app.hooks.sheet(); });
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
}
