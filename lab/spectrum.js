/* spectrum.js — the SPECTRUM rail: eigenvalue ladder, one lane per populated mode.
 *
 * A lane shows the ENERGY (eigenvalue, hartree), the degeneracy group (colour = n), the
 * population |c_a|² (a fader that sets |c_a| at the current time), the phase arg c_a(t) as a
 * live free-spinning needle (drag adds a phase; the needle keeps turning while playing),
 * MUTE / SOLO (a reconstruction mask, not an edit) and remove.  Touching a lane selects it.
 * The picker exposes all 140 states grouped by n (n = 7 since iteration 008 A7), each shell folded by its coloured `n` number.
 * Editing goes through api.* (one road).
 * W-STURMIAN: when api.hamiltonian() carries `eigen` (the SCALE is on) the ladder shows the eigen-decomposition —
 * the rank eigenvalues of S⁻¹H, each with the state's population (its S-metric projection), unoccupied ones dim,
 * E > 0 in a compressed band above the E = 0 line — and a click loads that eigenvector (api.selectEigen); the lanes
 * keep the labels' coefficients under a caption, and the RATE knobs stand down (api.rateDisabled) with a note.
 */
import { BASIS, NMAX, energy, HARTREE_EV } from './hydrogen.js';
import { el, fader, knob, formula, N_COLOR, nRGB, vividInk, graphHover, stepper, sw, chip } from './mir/kit.js';
import { paintStroke, fillButton, levelLine, footLine } from './paint-stroke.js';
import { PRESET_BY_ID } from './state.js';
import { createUserPresets } from './user-presets.js';

/** iteration 015 S4 · THE READER'S PRESETS: SPECTRUM's PREFERENCE record (settings-store.js FAMILIES), rows `{ name, data: { labels } }` */
export const USER_PRESETS_KEY = 'lambdawaves.q0.presets';

/* THE LADDER IS A CANVAS, AND A CANVAS HAS NO THEME (wave 44).  Every rule here was written in
   rgba(255,255,255,…) — right on the dark theme, WHITE ON WHITE on the light one, where "E = 0", the footer and
   every population value were ghosts on the shipped hydrogen ladder as much as on wave 39's eigen ladder.  The
   tokens are read from the body instead, exactly as radiationview.js reads its accents: --dim is rated ≥ 4.5:1 on
   the card in both themes, and --fg is what carries a value that has to sit ON a population bar. */
function readRGB(g, name, fallback) {
  const v = getComputedStyle(document.body).getPropertyValue(name).trim();
  const keep = g.fillStyle;
  g.fillStyle = fallback; if (v) { try { g.fillStyle = v; } catch (e) { /* an unparseable value leaves the fallback */ } }
  const t = String(g.fillStyle); g.fillStyle = keep;
  let m = /^#([0-9a-f]{6})$/i.exec(t);
  if (m) { const k = parseInt(m[1], 16); return [k >> 16 & 255, k >> 8 & 255, k & 255]; }
  m = /^#([0-9a-f]{3})$/i.exec(t);
  if (m) return [0, 1, 2].map((i) => parseInt(m[1][i] + m[1][i], 16));
  m = /rgba?\(([^)]+)\)/i.exec(t);
  if (m) { const p = m[1].split(',').map((x) => parseFloat(x)); return [p[0] | 0, p[1] | 0, p[2] | 0]; }
  return [255, 255, 255];
}

export function createSpectrum(host, api) {
  const ladder = el('div', 'ladder', host);
  const lcv = el('canvas', '', ladder), lfoot = footLine(lcv);   // 016 R1: the law line, shown on a hover
  /* iteration 008 S · THE PRESET (it left STATE; since iteration 015 S3 seated under the picker, above the HAMILTONIAN): the kit's stepper in PALETTE's preset look over the same list; ← → and a pick
     load a preset by the hand's road (api.loadPreset: THE FADE announces it), a pick of the preset already shown is RELOAD; VISUALS is STATE's
     PRESET VISUALS (a preset also sets its view, rate and window).  A register that is no preset reads '—' (the select's blank). */
  const pre = el('div', 'row tight sp-preset', host), DASH = { id: '', label: '—', coming: true }, PRE = (api.presets || []).map((p) => ({ id: p.id, label: p.label }));
  /* iteration 015 S4 · SAVE A PRESET (Josh: "add a save orbital (so that it just saves which orbitals were selected and that's it). Do the same
     'User' section appears when a custom preset is saved"): the bare save glyph beside the stepper asks a name in the stepper's own seat (Enter
     saves, Escape or a press elsewhere cancels) and keeps WHICH labels are populated — the reader's PREFERENCE (user-presets.js), never a project or
     a link.  The list grows a USER group at its top only while one exists, each row with a ×; a reader's preset is a `user:<name>` row of
     state.js' PRESET_BY_ID with no id (the register's provenance stays null) and no visuals, so it loads by loadPreset's own hand road — one undo
     row, THE FADE says its name — and sets nothing but the labels, equal and in phase. */
  const users = createUserPresets(USER_PRESETS_KEY), UK = 'user:', HEADS = [{ id: '#user', label: 'USER', coming: true }, { id: '#built', label: 'PRESETS', coming: true }];
  const syncUsers = () => {
    for (const k of [...PRESET_BY_ID.keys()]) if (k.startsWith(UK)) PRESET_BY_ID.delete(k);
    for (const u of users.list()) {
      const modes = ((u.data && u.data.labels) || []).filter((a) => BASIS[a]).map((a) => ({ n: BASIS[a].n, l: BASIS[a].l, m: BASIS[a].m, amp: 1 }));
      if (modes.length) PRESET_BY_ID.set(UK + u.name, { id: null, label: u.name, note: `your preset · ${modes.length} label${modes.length === 1 ? '' : 's'}, equal and in phase`, modes });
    }
  };
  const isPreset = (id) => !!id && (PRE.some((p) => p.id === id) || (id.startsWith(UK) && PRESET_BY_ID.has(id)));
  const itemsFor = (v) => { const U = users.list().filter((u) => PRESET_BY_ID.has(UK + u.name)).map((u) => ({ id: UK + u.name, label: u.name }));
    return [...(U.length ? [HEADS[0], ...U, HEADS[1]] : []), ...PRE, ...(v ? [] : [DASH])]; };
  syncUsers();
  const preStep = stepper({ aria: 'preset superposition', items: itemsFor(''), value: '', cls: 'mol-step', onChange: (id) => { if (id && api.loadPreset) api.loadPreset(id); } });
  preStep.name.title = 'Preset superpositions (a re-pick reloads)';
  preStep.name.addEventListener('click', () => { const pane = [...document.querySelectorAll('.mir-pick')].pop(), on = pane && pane.querySelector('.mir-pick-i.on');
    if (on) on.addEventListener('click', () => { if (preStep.get() && api.loadPreset) api.loadPreset(preStep.get()); });   // RELOAD: the stepper ignores a pick of its own value
    if (pane) for (const b of pane.querySelectorAll('.mir-pick-i[data-id^="' + UK + '"]')) {                                // S4: each reader's row carries its ×
      const x = el('span', 'sp-prex', b, '×'), name = b.dataset.id.slice(UK.length); x.setAttribute('role', 'button'); x.title = 'remove ' + name; x.setAttribute('aria-label', 'remove ' + name);
      x.addEventListener('mousedown', (e) => e.preventDefault());
      x.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); users.remove(name); b.remove();
        if (!pane.querySelector('.mir-pick-i[data-id^="' + UK + '"]')) for (const h of pane.querySelectorAll('.mir-pick-i[data-id^="#"]')) h.remove(); });
    } });
  const preVis = sw({ label: 'VISUALS', value: true, title: 'A preset also sets its view, rate and window', onChange: (v) => { api.visuals = v; } });
  const preSave = chip(el('button', 'sp-presave', null), 'saveInto'); preSave.type = 'button'; preSave.setAttribute('aria-label', 'SAVE PRESET');
  preSave.title = 'SAVE · the populated labels as a preset';
  pre.append(preStep.root, preSave);
  /** the name, asked in the stepper's seat: Enter keeps it, Escape or a press elsewhere lets it go */
  preSave.addEventListener('click', () => {
    const labels = api.reg.populated(); if (!labels.length || pre.querySelector('.sp-prename')) return;
    const row = preStep.name.parentElement, f = el('input', 'sp-prename', null); f.type = 'text'; f.maxLength = 40; f.setAttribute('aria-label', 'preset name');
    f.value = labels.slice(0, 4).map((a) => BASIS[a].label).join(' + ') + (labels.length > 4 ? ' …' : ''); row.insertBefore(f, preStep.name); preStep.name.hidden = true;
    let done = false; const end = (keep, key) => { if (done) return; done = true; const n = f.value.trim(); f.remove(); preStep.name.hidden = false;
      if (keep && n) { const got = users.add(n, { labels }) || n; preset.value = UK + got; preset.note = PRESET_BY_ID.get(UK + got).note; } if (key) preStep.name.focus(); };
    f.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); end(true, true); } else if (e.key === 'Escape') { e.preventDefault(); end(false, true); } });
    f.addEventListener('blur', () => end(false)); f.focus(); f.select();
  });
  /** `ui.presetSel` keeps the select's two words (persist.js and the one road write `.value`, the old note is the hover) */
  const preset = { root: preStep.root, get value() { return preStep.get(); }, set value(id) { const v = isPreset(id) ? id : ''; preStep.setItems(itemsFor(v), v); },
    set note(t) { preStep.name.title = t || ''; } };
  users.watch(() => { syncUsers(); preset.value = preStep.get(); });
  const head = el('div', 'row tight sp-head', host);
  const hideBtn = el('button', 'trig', head); hideBtn.type = 'button'; hideBtn.textContent = 'HIDE'; hideBtn.title = 'Hide or show the channels';
  const addBtn = el('button', 'trig', head); addBtn.type = 'button'; addBtn.innerHTML = '<span class="trig-g">+</span><span class="trig-l">MODE</span>';
  /* iteration 008 S · EMPTY ↔ FILL ALL (paint-stroke.js fillButton; the register's glyph since iteration 009 F2): a register with anything in it shows EMPTY (c ↦ 0, SPECTRUM's
     old CLEAR), an empty one FILL ALL (all 140 labels, equal and in phase, normalised); one undo row each.  NORM went: a HAND stroke on the grid
     normalises at its end (below), a modulator never does.  The press reads the register itself (the label is repainted by rebuild(), which a
     folded or paused card may not have run yet), and so does a hover. */
  const fillSync = () => fillB.set(!api.reg.populated().length);
  const fillB = fillButton(head, { fill: 'every label on, equal and in phase', empty: 'every label off' },
    () => { if (api.reg.populated().length) { if (api.clear) api.clear(); } else if (api.fillAll) api.fillAll(); fillSync(); });
  fillB.set(true); fillB.root.addEventListener('pointerenter', fillSync); head.appendChild(preVis.root);
  const info = el('div', 'note', head);
  /* ── WAVE 69 · THE REGISTER'S OWN LAW, LIVE ────────────────────────────────────────────────────
   * `c(t) = e^{−iE t} c(0)` is not a caption here, it is what the evolution IS — one phase per mode,
   * exact, no propagator — and every number on this line is read out of the coefficient vector the
   * frame is drawing from.  So this is the strongest of the three places a number was given
   * permission to move: the angle really is E·t folded into a turn, and watching it run is watching
   * the law rather than an animation of it.  It follows the SELECTED lane, or the strongest populated
   * one when nothing is selected, so it is never about a mode that is not there. */
  const psiFx = formula({ cls: 'sp-fx', lines: [
    ['<m>c(t) = e^{−iE t} c(0)   ·   </m>', { s: 'lab' }],
    ['<m>E = </m>', { s: 'E' }, '<m>   t = </m>', { s: 't' }, '<m>   arg c = </m>', { s: 'arg' }, '<m>   |c| = </m>', { s: 'mag' }] ] });
  const cap = el('div', 'sp-cap', host); cap.hidden = true;                          // W-STURMIAN: the caption over the lanes when the basis is not orthogonal (its own class: the ⓘ sweep folds every .note away)
  hideBtn.addEventListener('click', () => { rowsEl.hidden = !rowsEl.hidden; hideBtn.classList.toggle('on', !rowsEl.hidden); hideBtn.textContent = 'DIALS'; hideBtn.setAttribute('aria-expanded', String(!rowsEl.hidden)); });
  const rowsEl = el('div', 'sp-rows', host);


  rowsEl.hidden = true;
  hideBtn.textContent = 'DIALS'; hideBtn.setAttribute('aria-expanded', 'false');
  const picker = el('div', 'picker', host); picker.hidden = true;
  host.appendChild(psiFx.root);                                                     // the live coefficient readout follows the scale/state controls
  host.appendChild(pre);   // iteration 015 S3 (Josh: "Move the preset thing to the bottom between the 140 picker and above the Hamiltonian"): outside the HAMILTONIAN fold
  addBtn.addEventListener('click', () => { picker.hidden = !picker.hidden; addBtn.classList.toggle('on', !picker.hidden); });
  const chips = new Map();
  /* iteration 008 A7 · THE SHELL FOLD (Josh: "clicking on the colored 'n=' number … should be able to hide section of all 1, 2, 3, all the way
     to 7").  The number IS the handle — the kit's fold (lab/fold.js: `.lw-fold-body` hidden by the attribute, aria-expanded on the press), no
     chevron; a folded shell keeps its row, and a populated label inside it is counted on that row so nothing is hidden.  A folded chip is
     display:none, so THE PAINT GESTURE (elementFromPoint) crosses only the open rows; the ladder is not touched.  The folded set is WORKSPACE
     (rack-wiring.js captureLayout reads the presses' aria-expanded as the card's `shells`, written only when it is not the default): n = 7
     ships folded, on a first run and for a record older than this build. */
  const FOLD_DEFAULT = [7], shellRows = new Map();
  for (let n = 1; n <= NMAX; n++) {
    const g = el('div', 'pk-n', picker); g.style.setProperty('--nc', N_COLOR[n]); g.dataset.n = String(n);
    const nl = el('button', 'pk-nl', g, 'n' + n); nl.type = 'button';
    const cs = el('div', 'pk-chips lw-fold-body', g); cs.id = 'pk-shell-' + n; nl.setAttribute('aria-controls', cs.id);
    const cnt = el('div', 'pk-count', g); cnt.hidden = true;
    shellRows.set(n, { g, nl, cs, cnt });
    nl.addEventListener('pointerdown', (e) => e.stopPropagation());   // the handle is no paint stroke (paint-stroke.js would swallow its click)
    nl.addEventListener('click', () => { setShellFold(n, !cs.hidden); });
    for (const s of BASIS) if (s.n === n) {
      const b = el('button', 'pk-c', cs, s.label); b.type = 'button'; b.title = `${s.id}  E = ${s.E.toFixed(5)}`;
      b.dataset.a = String(s.index);
      b.addEventListener('click', () => { api.toggleMode(s.index); if (api.settle) api.settle(); });       // the keyboard's road (a hand: normalised); a pointer is answered by the paint stroke below
      chips.set(s.index, b);
    }
  }
  /** fold (true) or open shell n's row; the count on its line follows */
  function setShellFold(n, v) {
    const R = shellRows.get(n); if (!R) return;
    R.cs.hidden = !!v; R.nl.setAttribute('aria-expanded', String(!v)); R.nl.title = (v ? 'unfold' : 'fold') + ' n = ' + n; R.g.classList.toggle('folded', !!v);
    paintCounts();
  }
  /** a folded shell's populated labels, counted on its row (so a folded state is never out of sight) */
  function paintCounts() {
    for (const [n, R] of shellRows) {
      let k = 0; if (R.cs.hidden) for (const s of BASIS) if (s.n === n && chips.get(s.index).classList.contains('on')) k++;
      const t = R.cs.hidden && k ? `${k} populated` : ''; if (R.cnt.textContent !== t) R.cnt.textContent = t; R.cnt.hidden = !t;
    }
  }
  for (let n = 1; n <= NMAX; n++) setShellFold(n, FOLD_DEFAULT.includes(n));
  /* 2026-10 (Josh) · PAINT THE GRID (lab/paint-stroke.js): LEFT adds a state, RIGHT removes it; a drag takes every chip it
     crosses.  The chips are DOM, so the stroke is sampled every 6 px and asked of elementFromPoint. */
  const chipAt = (p) => { const c = document.elementFromPoint(p.x, p.y), b = c && c.closest ? c.closest('.pk-c') : null; return b && picker.contains(b) ? [+b.dataset.a] : []; };
  /* iteration 008 S · A HAND STROKE NORMALISES AT ITS END (paintStroke's onEnd, inside its pointerup and the undo hold: one row); a modulator never does */
  paintStroke(picker, { at: chipAt, apply: (as, add) => (api.paintModes ? api.paintModes(as, add) : 0), onEnd: () => { if (api.settle) api.settle(); },
    across: (a, b) => { const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 6), out = []; for (let i = 1; i < n; i++) out.push(...chipAt({ x: a.x + (b.x - a.x) * i / n, y: a.y + (b.y - a.y) * i / n })); return out; } });
  const lanes = new Map();     // index → the lane that IS built and in the DOM
  let selected = -1, lastVersion = -1;
  /* ── THE REBUILD IS INCREMENTAL, AND THE BOOKKEEPING IS NOT (wave 49) ────────────────────────────────
     A packet landing (SLAP, or the bow's release) takes the register from a handful of populated labels to
     ninety-one in ONE version bump, and rebuild() used to answer by CONSTRUCTING ninety-one lanes inside a
     single frame — a fader, two knobs and four buttons apiece, 449 ms measured on the landing frame, which
     is also exactly the frame the governor is judging.  The work splits in two, and the two halves obey
     different laws:

       THE BOOKKEEPING IS EXACT AND IMMEDIATE.  The wanted set, the removals, the ORDER of what is already
       built, the chips, the info line, the caption and the ladder are done in full on every version bump.
       They are O(91) reads and almost no DOM writes, and a state that lies for a frame is worse than a
       state that is drawn a frame late.

       THE CONSTRUCTION IS SPREAD.  `pending` is the queue of wanted-but-unbuilt indices, held in `want`
       order, and REDERIVED from scratch on every bump (`want` minus what is built) — so a bump that drops
       a label drops it from the queue, one that adds a label enqueues it, and no bump can leave a stale
       lane behind or lose one.  drain() empties the queue under a LANE_BUDGET_MS = 6 ms budget measured
       from the TOP of update(), stopping when the next lane (at the running cost `laneMs`) would not fit,
       and ALWAYS building at least one so progress cannot stall.  Each finished lane is inserted before
       the first already-built lane that follows it in `want`, which is its ordered place whether the queue
       is draining forwards or a later bump interleaved new indices among old ones.

       THE WRITES ARE DIRTY-CHECKED.  reg.population(a) is a multiply and an add; L.pop.set() is a style
       write and a text write.  refresh() writes only what MOVED since the last one: the fader and the rate
       knob are asked for their own last-painted value (get() is a closure read, so it dirty-checks against
       the DOM itself and a control the user dragged still snaps back), and every lane carries `was` for the
       rest — mute, solo, the muted/solo mask, the selection, and the label and energy strings.  select()
       keeps `was.sel` in step, since it toggles that class itself.

     The drain rides update(), which the rack calls on every CPU frame: no second rAF loop, no call back
     into the rack.  When the transport is paused AND nothing is scheduled the rack stops the loop, so a
     queue can sit unfinished until the next frame anyone asks for — the register cannot move without a
     version bump, so what is on screen is never WRONG, only short, and the next frame finishes it. */
  const LANE_BUDGET_MS = 6;
  let want = [], wantAt = new Map(), pending = [], laneMs = 1;
  let n2 = 1, anySolo = false, rateOff = false;        // the snapshot the cheap half took, reused by lanes built later in the same state
  const RATE_TITLE = 'Set this state’s phase-rate multiplier; double-tap resets';
  /** W-STURMIAN: RATE is a diagonal-phase feature — disabled, with the note on it, while a propagator is in force */
  function paintRate(L, off) { if (off === L.rateOff) return; L.rateOff = off; L.rate.setDisabled(off); L.rate.root.title = off ? (api.reg.P && api.reg.P.stark ? 'RATE is a diagonal-phase feature: off under INTER-SHELL STARK' : api.rateNote ? api.rateNote() : 'off') : RATE_TITLE; }

  function lane(a) {
    const s = BASIS[a];
    const root = el('div', 'sp-row'); root.style.setProperty('--nc', N_COLOR[s.n]); root.dataset.id = s.id;
    el('div', 'sp-band', root);
    const id = el('div', 'sp-id', root);
    const nm = el('div', 'sp-name sp-nm', id, labelText(a)); nm.dataset.a = s.index;
    const esub = el('div', 'sp-sub sp-e', id, energyText(a)); esub.dataset.a = s.index;   // the operator IN FORCE, never the static basis energy
    id.addEventListener('click', () => api.select(a));
    /* WAVE 62 · A LANE NAMES ITSELF.  `aria` overrides `label` in the kit, which is exactly what these
       three need: the eye reads '|c|²' next to a label it can see, but ninety-one sliders all called
       "|c|²" are ninety-one identical seats to anything that cannot see the row they are in. */
    /* WAVE 69 · the fader's own label is the one string in a lane that is pure mathematics; the
       ARIA name is `mathPlain`ed by the kit, so the marker never reaches an attribute. */
    const pop = fader({ label: '<m>|c|²</m>', aria: '|c|² ' + labelText(a), min: 0, max: 1, value: 0, cls: 'pop', fmt: (v) => v.toFixed(3),
      onInput: (v) => api.setPopulation(a, v), onChange: (v) => api.setPopulation(a, v, true) });
    root.appendChild(pop.root);
    const ph = knob({ aria: 'phase ' + labelText(a), min: 0, max: 2 * Math.PI, value: 0, wrap: true, cls: 'live', fmt: (v) => (v * 180 / Math.PI).toFixed(0) + '°',
      onDelta: (d) => api.addPhase(a, d), onReset: () => api.setPhase(a, 0) });
    const kn = el('div', 'sp-knobs', root); kn.appendChild(ph.root);   // the two knobs stack, half-size
    const rate = knob({ aria: 'phase rate ' + labelText(a), min: 0.25, max: 4, value: api.rateOf ? api.rateOf(a) : 1, log: true, cls: 'rate', fmt: (v) => v.toFixed(2) + '×', onInput: (v) => { if (api.setRate) api.setRate(a, v); } });
    rate.root.title = RATE_TITLE;
    kn.appendChild(rate.root);
    const mute = el('button', 'sp-b mute', root, 'M'); mute.type = 'button'; mute.title = 'mute: drop from the FIELD reconstruction (the state keeps c)';
    mute.setAttribute('aria-label', 'mute ' + labelText(a)); mute.setAttribute('aria-pressed', 'false');
    mute.addEventListener('click', () => api.toggleMute(a));
    const solo = el('button', 'sp-b solo', root, 'S'); solo.type = 'button'; solo.title = 'solo: reconstruct from this mode alone';
    solo.setAttribute('aria-label', 'solo ' + labelText(a)); solo.setAttribute('aria-pressed', 'false');
    solo.addEventListener('click', () => api.toggleSolo(a));
    const x = el('button', 'sp-x', root, '×'); x.type = 'button'; x.title = 'remove (sets c = 0)'; x.setAttribute('aria-label', 'remove ' + labelText(a));
    x.addEventListener('click', () => api.remove(a));
    /* `was` is the dirty-cache: the values ACTUALLY applied to this lane's DOM.  The two strings start at what
       lane() just wrote (so a fresh lane is never rewritten); every other field starts unset, so the lane's
       first refresh() writes it once. */
    return { root, pop, ph, rate, mute, solo, nm, esub, a, rateOff: false,
      was: { mute: null, solo: null, off: null, sel: null, label: nm.textContent, energy: esub.textContent } };
  }
  const labelText = (a) => api.labelOf ? api.labelOf(BASIS[a]) : BASIS[a].label;
  const energyText = (a) => { const E = api.energyOf ? api.energyOf(a) : BASIS[a].E; return E === E ? `${E.toFixed(4)} ${api.unit ? api.unit() : 'Eh'}` : ((api.hamiltonian && api.hamiltonian()) || {}).nan || 'unbound here'; };   // 0.8.0 G1: NaN = a level CENTRAL leaves unbound
  /** one lane's UPDATE: cheap reads, and only the DOM writes whose value moved since the last one */
  function refresh(L, a) {
    const reg = api.reg, w = L.was;
    /* the fader and the two knobs ARE their own cache — get() is a closure read and returns exactly what was last
       painted, so it dirty-checks against the DOM itself and a control the user has dragged still snaps back */
    if (L.rate && api.rateOf) { const rv = api.rateOf(a); if (Math.abs(L.rate.get() - rv) > 1e-12) L.rate.set(rv); }
    if (L.rate) paintRate(L, rateOff);
    const p = reg.population(a) / n2;                    if (L.pop.get() !== p) L.pop.set(p);
    const m = !!reg.muted[a];                            if (w.mute !== m) { w.mute = m; L.mute.classList.toggle('on', m); L.mute.setAttribute('aria-pressed', String(m)); }
    const s = !!reg.solo[a];                             if (w.solo !== s) { w.solo = s; L.solo.classList.toggle('on', s); L.solo.setAttribute('aria-pressed', String(s)); }
    const off = anySolo ? !s : m;                        if (w.off !== off) { w.off = off; L.root.classList.toggle('muted', off); }
    const sel = a === selected;                          if (w.sel !== sel) { w.sel = sel; L.root.classList.toggle('sel', sel); }
    if (L.root.classList.contains('off')) L.root.classList.remove('off');    // nothing here ever sets it; the old rebuild cleared it every pass
    const lt = labelText(a);                             if (w.label !== lt) { w.label = lt; L.nm.textContent = lt; }
    const et = energyText(a);                            if (w.energy !== et) { w.energy = et; L.esub.textContent = et; }
  }
  /** a freshly built lane goes before the first ALREADY-BUILT lane that follows it in `want` (else at the end) */
  function place(a, L) {
    const i = wantAt.has(a) ? wantAt.get(a) : want.length;
    let ref = null;
    for (let j = i + 1; j < want.length; j++) { const M = lanes.get(want[j]); if (M) { ref = M.root; break; } }
    rowsEl.insertBefore(L.root, ref);
  }
  /** THE DRAIN: build pending lanes until the budget (from the top of update()) will not take another — always one */
  function drain(t0) {
    if (!pending.length) return;
    do {
      const a = pending.shift(), t1 = performance.now();
      const L = lane(a); lanes.set(a, L); place(a, L); refresh(L, a);
      laneMs = laneMs * 0.7 + (performance.now() - t1) * 0.3;      // what ONE lane costs on this machine, right now
    } while (pending.length && performance.now() + laneMs - t0 <= LANE_BUDGET_MS);
  }
  /** the cheap half: exact and immediate on every version bump — the lane set, the order, the chips, the info line, the caption, the ladder */
  function rebuild() {
    const reg = api.reg;
    want = reg.populated();
    wantAt.clear(); for (let i = 0; i < want.length; i++) wantAt.set(want[i], i);
    const keep = new Set(want);
    for (const [a, L] of lanes) if (!keep.has(a)) { L.root.remove(); lanes.delete(a); }
    pending.length = 0;
    for (const a of want) if (!lanes.has(a)) pending.push(a);       // the queue, rederived: no stale lane, no lost one
    let prev = null;
    for (const a of want) {                                        // the ORDER of what IS built; the unbuilt ones land in the gaps (place())
      const L = lanes.get(a); if (!L) continue;
      if (prev ? prev.nextSibling !== L.root : rowsEl.firstChild !== L.root) rowsEl.insertBefore(L.root, prev ? prev.nextSibling : rowsEl.firstChild);
      prev = L.root;
    }
    n2 = reg.norm2() || 1;
    anySolo = want.some((a) => reg.solo[a]);
    rateOff = !!reg.P || !!(api.rateDisabled && api.rateDisabled());   // any propagator (STURMIAN, 0.8.0 INTER-SHELL STARK)
    for (const [a, L] of lanes) refresh(L, a);
    for (const [a, b] of chips) b.classList.toggle('on', keep.has(a));
    paintCounts();
    const rs = reg.renderSet();
    const levels = Object.keys(groupByN(want)).length;
    fillB.set(!want.length);
    info.textContent = `${want.length} populated · ${rs.rendered} rendered · ${levels} level${levels === 1 ? '' : 's'}`;
    { const HS = api.hamiltonian ? api.hamiltonian() : null, eig = !!(HS && HS.eigen);                          // W-STURMIAN: the caption and the ladder's affordance
      cap.hidden = !eig; if (eig) cap.textContent = HS.caption || 'non-orthogonal basis: populations are projections';
      if (eig !== ladderEigen) { ladderEigen = eig; lcv.style.cursor = eig ? 'pointer' : ''; lcv.title = eig ? 'Click an eigenvalue to load its eigenvector' : ''; } }
    lastVersion = reg.version;
    paintLadder();
  }
  function groupByN(list) { const g = {}; for (const a of list) (g[BASIS[a].n] = g[BASIS[a].n] || []).push(a); return g; }

  /* WAVE 46: the ladder's objects are its level lines — one hover, one tip, and the value that used to float on the bar */
  const hover = graphHover(lcv, { repaint: () => paintLadder() });

  /* the eigenvalue ladder: E_n drawn at physical height (the Rydberg bunching is the point),
     populated levels lit in their shell colour (levelLine: plain, no bar since iteration 008), the fraction of the norm in the hover */
  function paintLadder() {
    const reg = api.reg;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = ladder.clientWidth, H = ladder.clientHeight;
    if (W < 32 || H < 32) return;                       // folded: no size, nothing to paint
    if (lcv.width !== W * dpr || lcv.height !== H * dpr) { lcv.width = W * dpr; lcv.height = H * dpr; }
    const g = lcv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const INK = readRGB(g, '--dim', '#b8b8b8'), FG = readRGB(g, '--fg', '#ffffff');   // the theme's own ink: this canvas used to be white-only
    const ink = (a) => `rgba(${INK[0]},${INK[1]},${INK[2]},${a})`, fg = (a) => `rgba(${FG[0]},${FG[1]},${FG[2]},${a})`;
    /* --n1…--n6 are ONE palette for both themes (lab.css:29), pastels chosen against a dark ground, and as 8 px
       NUMBERS on the light theme they are unreadable — "50%  −0.1250" was a ghost on the shipped ladder.  The
       lines, the bars and the level names keep the shell's colour, which is what carries the coding; the value
       takes the theme's foreground when the ground is light.  Which ground it is, the theme itself says. */
    /* WAVE 46 — NOTHING FLOATS INSIDE THE PLOT.  The value used to be stroked over a halo ON its own bar
       ("50%  −0.1250"), one more coloured number in the middle of the picture.  The line, the bar and the
       shell colour say WHICH level and HOW MUCH; the number itself is one hover away, in the single tip.
       The gutter keeps the level's name and the footer keeps the law: both are outside the plot rectangle. */
    const pad = 10, left = 44, right = W - 12, top = 10, bot = H - 14;
    const plot = { x0: left, y0: top, x1: right, y1: bot };
    hovers = [];
    const HS = api.hamiltonian ? api.hamiltonian() : null;                    // null = the built-in hydrogen ladder
    eigenHits = [];
    if (HS && HS.eigen) { paintEigen(g, HS, W, H, left, right, top, bot, ink, fg, plot); return; }   // W-STURMIAN: the eigen ladder
    const Emin = HS ? HS.Emin : energy(1), Etop = HS ? HS.Etop : 0;
    const y = (E) => bot - (E - Emin) / (Etop - Emin) * (bot - top);
    g.font = '8px ui-monospace, monospace'; g.textBaseline = 'middle';
    /* iteration 018 C2 (Josh: "the reader at the very top seems to have some 'ticks' that run left to right like a horizontal ruler … delete those to
       make it cleaner like the molecule window's"): n = 3 … 7 bunch within a few px of E = 0, so their dim off-lines and the dashed continuum read as a
       ruler.  Only the LIT levels are drawn (and named, and hovered); no E = 0 dash.  The heights stay physical: the bunching of a lit Rydberg pair is the point. */
    const n2 = reg.norm2() || 1;
    const pops = {}; for (const a of reg.populated()) { const k = HS ? HS.levelKey(a) : BASIS[a].n; pops[k] = (pops[k] || 0) + reg.population(a) / n2; }
    const LEVELS = HS ? HS.levels : Array.from({ length: NMAX }, (_, i) => i + 1).map((n) => ({ key: n, E: energy(n), label: 'n' + n, rgb: nRGB(n) }));
    const names = [];                                    // (the Rydberg bunching crowds the gutter: see the placement below)
    for (const lv of LEVELS) {
      const n = lv.key, yy = y(lv.E), c = vividInk(lv.rgb);
      if (!(pops[n] > 0)) continue;
      levelLine(g, left, right, yy, c, true);
      names.push({ y: yy, txt: lv.label, col: `rgba(${c[0]},${c[1]},${c[2]},1)`, lit: true, n, pop: pops[n] });
      hovers.push({ kind: 'line', key: 'L' + n, points: [left, yy, right, yy], lw: 2, colour: `rgba(${c[0]},${c[1]},${c[2]},1)`,
        info: `${lv.label}  ·  ${(pops[n] * 100).toFixed(1)} %  ·  E = ${lv.E.toFixed(4)} Eh` });
    }
    /* THE GUTTER IS 44 px OF ONE COLUMN, AND E_n = −1/(2n²) BUNCHES (wave 46).  n3 … n6 fall inside 6 px of the
       E = 0 line on a 92 px card, so the names used to print straight over one another — "n3" and "n4" and
       "E = 0" as one smear.  A name is placed only when its row is FREE (9 px: the 8 px face's own line box),
       the LIT levels claim their rows first and in order of population, and a level that loses its name still
       has its line, its bar and its hover.  Nothing is nudged: a name away from its own level would lie. */
    const usedY = [];
    const freeRow = (yy) => !usedY.some((q) => Math.abs(q - yy) < 9);
    g.textAlign = 'right';
    for (const nm of [...names].sort((a, b) => (b.lit - a.lit) || (b.pop - a.pop) || (a.n - b.n))) {
      if (!freeRow(nm.y)) continue;
      usedY.push(nm.y); g.fillStyle = nm.col; g.fillText(nm.txt, left - 4, nm.y);   // the gutter, not the plot
    }
    lfoot(HS ? HS.footer : 'EIGENVALUE  E_n = −1/(2n²) hartree', left, W, H);
    hover.set(hovers, plot);
  }
  /* W-STURMIAN: the eigen ladder — the rank eigenvalues of S⁻¹H at physical height below E = 0 (the same scale and
     colours as the hydrogen ladder: the colour is the dominant label's n), each occupied one (population > 1e-6) lit
     with its population bar and value, unoccupied ones dim, the E > 0 pseudo-continuum compressed above the E = 0 line;
     a click within 6 px of a level loads its eigenvector */
  let eigenHits = [], ladderEigen = false, hovers = [];
  function paintEigen(g, HS, W, H, left, right, top, bot, ink, fg, plot) {
    const Emin = HS.Emin, Emax = Math.max(HS.Emax || 0, 1e-9), split = top + (bot - top) * 0.24;
    const y = (E) => E <= 0 ? bot - (E - Emin) / (0 - Emin) * (bot - split) : split - Math.min(1, E / Emax) * (split - top);
    g.font = '8px ui-monospace, monospace'; g.textBaseline = 'middle';
    g.strokeStyle = ink(0.35); g.setLineDash([2, 3]); g.beginPath(); g.moveTo(left, y(0)); g.lineTo(right, y(0)); g.stroke(); g.setLineDash([]);
    const usedTy = [];                                    // 'E = 0' shares the 44 px gutter with the level names: it is drawn last, and only if its row is free
    const lit = HS.eigen.filter((lv) => lv.pop > 1e-6).sort((a, b) => a.E - b.E), dim = HS.eigen.filter((lv) => !(lv.pop > 1e-6));
    const INK = readRGB(g, '--dim', '#b8b8b8');
    for (const lv of dim) { const yy = y(lv.E); levelLine(g, left, right, yy, INK, false); eigenHits.push({ y: yy, k: lv.k, pop: 0 });
      hovers.push({ kind: 'line', key: 'D' + lv.k, points: [left, yy, right, yy], lw: 1, colour: ink(0.7), info: `${lv.label}  ·  empty  ·  λ = ${lv.E.toFixed(4)} Eh` }); }
    /* THE DECLUTTER (wave 44).  Lit levels run upward (E ascending — sorted here, since the propagator is assembled
       block by block in (l, m) and hands its eigenvalues over in BLOCK order, not energy order), so a text within
       LEAD px of the last one is nudged up.  The pitch used to be 8 px — exactly the face's own size, so two nudged
       rows TOUCHED — and the nudge was unbounded, so a third marched off the top of the box.  Under STURMIAN that is
       the ordinary case and not an edge one: the E > 0 pseudo-continuum is compressed into about 16 px and a generic
       λ occupies three or four levels inside it.  So LEAD is the 8 px face's real line box, the nudge is CLAMPED to
       the top, a level with no room left keeps its lit line and its bar but loses its text (the `faint` branch's own
       precedent), and a text nudged off its level is tied back to it by a hairline leader in the level's own colour. */
    const LEAD = 11, TOP = top + 3;
    let lastTy = 1e9;
    for (const lv of lit) {
      const yy = y(lv.E), c = vividInk(nRGB(lv.n)), faint = lv.pop < 0.005;          // occupied below ½ %: its line, no name (the clock still counts it)
      levelLine(g, left, right, yy, c, true);
      eigenHits.push({ y: yy, k: lv.k, pop: lv.pop });
      hovers.push({ kind: 'line', key: 'E' + lv.k, points: [left, yy, right, yy], lw: 2, colour: `rgba(${c[0]},${c[1]},${c[2]},1)`,
        info: `${lv.label}  ·  ${(lv.pop * 100).toFixed(lv.pop < 0.1 ? 1 : 0)} %  ·  λ = ${lv.E.toFixed(4)} Eh` });
      if (faint) continue;
      const ty = (lastTy - yy < LEAD) ? lastTy - LEAD : yy;
      if (ty < TOP) continue;                                                // out of room: the line still says it
      lastTy = ty;
      if (ty !== yy) { g.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},0.45)`; g.lineWidth = 1; g.beginPath(); g.moveTo(left - 3, ty); g.lineTo(left - 1, yy); g.stroke(); }   // the leader back to its own level
      g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},1)`; g.textAlign = 'right'; g.fillText(lv.label, left - 4, ty); usedTy.push(ty);   // the gutter, not the plot
    }
    if (!usedTy.some((t) => Math.abs(t - y(0)) < 9)) { g.fillStyle = ink(0.75); g.textAlign = 'right'; g.fillText('E = 0', left - 4, y(0)); }
    lfoot(HS.footer || '', left, W, H);
    hover.set(hovers, plot);
  }
  lcv.addEventListener('click', (e) => {
    if (!eigenHits.length || !api.selectEigen) return;
    let best = null;
    for (const h of eigenHits) { const d = Math.abs(h.y - e.offsetY); if (d <= 6 && (!best || d < best.d - 1e-9 || (Math.abs(d - best.d) <= 1e-9 && h.pop > best.pop))) best = { d, k: h.k, pop: h.pop }; }
    if (best) api.selectEigen(best.k);
  });
  /** display-rate update: the bookkeeping on a version bump, one budget of lane construction, then the live phases */
  let fxWall = 0;
  /** the c(t) line, at 5 Hz.  THE CADENCE IS THE LAB'S OWN LAW, not a new one: rack.js prints the `t`
      readout every 200 ms unless KEEP FRAMES is on, because that is as fast as a number can be read;
      a formula is a number and takes the same rule.  It is also the reason nothing here needs a
      throttle of its own — three text writes at 5 Hz cost nothing on any frame. */
  function paintPsi(c, t) {
    const now = performance.now();
    if (now - fxWall < 200) return;
    fxWall = now;
    let a = selected;
    if (a < 0 || !lanes.has(a)) { let best = -1, bp = 0; for (const [i] of lanes) { const p = c.re[i] * c.re[i] + c.im[i] * c.im[i]; if (p > bp) { bp = p; best = i; } } a = best; }
    if (a < 0) { psiFx.set({ lab: '—', E: '—', t: '—', arg: '—', mag: '—' }); return; }
    const re = c.re[a], im = c.im[a];
    let ph = Math.atan2(im, re); if (ph < 0) ph += 2 * Math.PI;
    psiFx.set({ lab: labelText(a), E: (api.energyOf ? api.energyOf(a) : BASIS[a].E).toFixed(6) + ' ' + (api.unit ? api.unit() : 'Eh'),
      t: t.toFixed(2), arg: (ph * 180 / Math.PI).toFixed(1) + '°', mag: Math.sqrt(re * re + im * im).toFixed(4) });
  }
  function update(c, t) {
    const t0 = performance.now();
    const reg = api.reg;
    if (reg.version !== lastVersion) rebuild();
    drain(t0);                                   // the queue rides the rack's frame — no rAF of our own
    for (const [a, L] of lanes) {
      const ph = Math.atan2(c.im[a], c.re[a]);
      L.ph.set(ph < 0 ? ph + 2 * Math.PI : ph);
    }
    paintPsi(c, t);
  }
  function select(a) { selected = a; fxWall = 0; for (const [i, L] of lanes) { const s = i === a; if (L.was.sel !== s) { L.was.sel = s; L.root.classList.toggle('sel', s); } } }
  window.addEventListener('resize', () => paintLadder());
  /* the DIALS fold is project state (a demo opens with its lanes shown or folded as it was saved) */
  const setDials = (on) => { rowsEl.hidden = !on; hideBtn.classList.toggle('on', !!on); hideBtn.setAttribute('aria-expanded', String(!!on)); };
  return { update, rebuild, select, energyText, preset, get selected() { return selected; }, lanes, get building() { return pending.length; },
    get dials() { return !rowsEl.hidden; }, setDials,
    openPicker(v = true) { picker.hidden = !v; addBtn.classList.toggle('on', v); }, get pickerOpen() { return !picker.hidden; },
    /** iteration 008 A7: the folded shells (WORKSPACE, read and written by rack-wiring.js through the presses' aria-expanded) */
    get folded() { return [...shellRows].filter(([, R]) => R.cs.hidden).map(([n]) => n); }, setFolded(list) { for (const n of shellRows.keys()) setShellFold(n, list.includes(n)); } };
}
