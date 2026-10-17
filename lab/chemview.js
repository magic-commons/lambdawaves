/* chemview.js — THE CHEMISTRY WINDOW: contract B-H2O-8 of research/MATH-H2O-2026-09-11.md as an instrument.
 * lab/molecules.js's library, RHF through the worker, the RPA/TDA inspector beside the live δ-kick trace, the fitted
 * poles with their certificate, and the AO density on the field.  Atomic units; atoms in bohr through ANGSTROM.
 *
 * THE MOLECULE CONTROL IS A DROPDOWN (2026-09-12, Josh: "this should be a dropdown menu hehe") holding ONE SECTION of the
 * library (0.4.0 S4b: the page turner ‹ SECTION › above it), in the table's <optgroup>s, each option carrying its Cartesian AO count and lab/molecules.js's PREDICTED
 * solve time, and each over-cap or unsolvable entry disabled WITH ITS REASON on the option itself.  The node is
 * paletteview.js's `<select class="sel">` — the same element, the same class, the same 44-px seat — because the
 * lab already had a dropdown and a second one would have been a second design.  The CAP is benzene: ~1.7 s
 * predicted (COST refit 2026-10-08; 9.6 s before), 36 AOs, 42 electrons, which is the longest wait this window asks
 * anyone to accept.  Past it a molecule opens only from its LIBRARY record (0.4.0 S4a, lab/library.js): its row says
 * DOWNLOAD until the record is on this device, and its open is the worker's chem.open — no solver call.
 *
 * THE FIELD IS NOT THIS WINDOW'S (2026-09-18).  lab/molecular-session.js owns the volume; this card is a PRODUCER
 * of two of its models, 'ground' and 'tdhf', and hands it one tagged product a frame.  Nothing here calls the
 * field, so nothing here depends on the order the frame loop updates the two molecular windows in.
 *
 * THE DIVISION OF LABOUR.  Nothing here does chemistry on the frame thread: `api.solve` is rack.js's chem worker
 * road and every op lands there (SYNTHESIS decision 3 — Δt = 0.01 on screen; decision 2 — unrestarted MMUT by
 * default, Magnus-2 as the reference).  The ONE exception is the pole fit (lab/response-fit.js), which is cheap and
 * throttled, and the fallback solve, which exists only for a browser with no Worker at all and says so.
 * SCREEN ALLOCATION is ROUND 3 · SOL answer 11: the main plot is 0–1.6 hartree with the inspector, and the O 1s
 * window is a collapsible inset, off by default, on its own amplitude scale, badged as a timestep diagnostic.
 * MUST NOT CLAIM: quantitative UV/X-ray spectroscopy, ionisation, correlation beyond RHF, or nuclear motion.
 */
import { el, seg, sw, knob, trig, readout, stepper, graphHover, themeInk, fitText, nRGB, accentRGB, vividInk, chip } from './mir/kit.js';
import { MOLECULES, RECORD_ONLY, RECORD_GROUP, GROUPS, SECTIONS, moleculeAtoms, moleculeCharge, optionLabel, showMs, CAP_RULE, basis631, MAX_Z } from './molecules.js';
import { statusOf, FIELD_LAW } from './status.js'; import { MAX_MOL_AO, MOL_LIMITS } from './field.js'; import { COMPONENT_ORDER } from './md.js';   // 0.5.4 P4: the status line and capability()'s limits
import { orbitalName, forms, coreCount, symmetryDefects } from './names.js'; import { sto3gH2 } from './h2ci.js'; import { h2Curve, h2Point, drawCurve } from './h2curve.js';
import { fetchRecord, installed, removeRecord, persistOnce, storageInfo, safariTab, decodeVibrate } from './library.js'; import { aliasOf, FLASH_HZ } from './flash-law.js';
import { CATALOGUE } from './catalogue.js'; import { ATOMS } from './atoms.js';   // 0.7.4 C2 · THE SHELF: the tiles' status words, and ‹ ATOMS ›' H–Kr
import { planePoints } from './slice.js';   // iteration 005 P2: THE CONTINUITY RECORD samples PLANE's own geometry
import * as V from './volumes.js'; import { parseLwm, rungRecord } from './volumes-format.js'; import { BASIS_LABEL } from './latex-state.js';   // iteration 004 V2: a volume's molecule on the stage

/* ── the library, under the names this window has always used ─────────────────────────────────────────────────
 * The geometries and their sources moved to lab/molecules.js on 2026-09-12; the eight ids the laws pin are still
 * the first eight of their groups and their arrays are frozen there.  These three exports keep their old shapes so
 * nothing that read them has to change: `label` is the entry's formula markup, `ang` its ångström array. */
export const CHEM_PRESETS = [...MOLECULES, ...RECORD_ONLY].map((m) => ({ ...m, label: m.formula }));
const PRESET_BY_ID = new Map(CHEM_PRESETS.map((p) => [p.id, p]));
/** the preset's atoms in bohr, as the worker and lab/rhf-molecule.js want them */
export const chemAtoms = moleculeAtoms;
/** the preset's formal charge — 0 for every neutral, ±1 for the four ions */
export const chemCharge = moleculeCharge;

const AXES = ['x', 'y', 'z'], AXIS_N = { x: 2, y: 5, z: 6 };
const W_MAX = 1.6, CORE_LO = 19, CORE_HI = 21;              // answer 11: the valence plot, and the core inset's own window
const DTS = ['0.02', '0.01', '0.005'];
const CERT = 1e-4;                                          // the precision the fitted poles are certified AT (4ε/σ)
/* THE FIT'S WINDOW, and why it is not the whole trace.  fitPoles runs absorb.js's transform over its own ω grid,
   which is O(samples × grid): the worker's accumulated trace is capped at 2e6 and 2e6 × 1550 is three billion
   multiply-adds on the frame thread.  The fit takes the first T = 300 a.u. — 30 000 samples at Δt = 0.01, the
   ledger's own configuration, at T/τ = 12 — while the DISPLAYED curve is the worker's transform of everything. */
const FIT_CAP = 30000;
/* THE CARD'S MMUT RESTART POLICY, and it is a decision and not a dial: SYNTHESIS decision 2 (MATH-H2O, line 712)
   makes the UNRESTARTED leapfrog the default on screen, with Magnus-2 as the reference integrator.  0 means never
   restart on the wire (lab/density.js normalises it); the worker's own default for a caller that says nothing is
   still 50, and what the readout prints is whatever chem.rt.init reports back, never this constant. */
const RESTART_EVERY = 0;
/* 0.7.3 K2 · RKS LDA: PySCF's RKS lda,vwn energies on the same grid (tests/fixtures/oracles/rks-v1.json, K1's oracle), and the stand-downs' sentences (the worker's own) */
const LDA_E = { H2O: -74.73204101826778, C6H6: -227.26271535054755, N2: -107.14784546338231, CH4: -39.61684762933404, NH3: -55.29017963855679, HF: -98.24584098961836, CO2: -184.5641630932059, C2H4: -76.85777172746918 };
/* iteration 004 V2 · A VOLUME'S MOLECULE (lab/volumes.js, THE VOLUME FORMAT v1): its ladder is its record — every rung opens through chem.open, no solve */
const VOL = 'a volume molecule is its record; the live roads are the catalogue’s', LIVE = new Set(['sto-3g', '6-31+g-star']);
const LDA_RT = 'RT stands down under RKS LDA: its operators (the TDHF Fock build) are RHF\'s', LDA_TDA = 'TDA and the register stand down under RKS LDA: their operators are RHF\'s', LDA_VIB = 'VIBRATE stands down under RKS LDA: its modes and dD/dQ are RHF\'s';

export function createChem(host, api) {
  let on = false, active = api.active ? !!api.active() : true;
  let preset = 'H2O', basis = 'sto-3g', view = 'density', orbital = null, axis = 'y', method = 'rhf', kept = new Map();   // 0.7.3 K2: kept = this molecule's solves by key (RHF · UHF · LDA), so a METHOD switch back is free
  let kappa = 1e-3, speed = 10, dt = 0.01, integrator = 'mmut', tda = false, core = false, valence = false, pulse = 'none';
  let sol = null, rt = null, running = false, inflight = false, said = null;   // said: 0.5.4 P4's status of what is on stage (tell)
  let solveSeq = 0, specTask = 0, spec = null, fit = null, fitErr = null, lastSpec = 0, lastFit = 0, selected = null;
  let fieldHash = null, mBuf = null, oBuf = null, dRef = null, dBuf = null, statusText = 'no molecule solved yet', pending = null;
  let vib = null, vibOn = false, vibK = 0, vibAmp = 1, vibFr = null, vibBusy = false, vibAgain = false, vibD = null, vibJ = -1, vibRate = 0, vibSh = null, vibAt = null, pendingVib = null;   // 0.7.0 V1 VIBRATE
  /* THE RESTORED ORBITAL INDEX HAS TO SURVIVE THE RE-SOLVE THAT RESTORING IT CAUSES.  A solve sets `orbital` to
     HOMO, which is right for a molecule the hand just picked and WRONG for one a file just reopened: load() puts a
     different molecule up, the solve that follows overwrote the saved index with nocc, and the round trip lost it.
     (Invisible while there were eight presets and the laws only ever restored H₂O onto H₂O.)  One pending value,
     consumed by the next solve and then cleared. */
  let pendingOrbital = null, pendingKey = null, wantRef = null;               // 0.4.0 S4a: the { id, hash, nameKey } a project or link named                                   // 0.4.0 S2: and a link's orbital by its S1 name, which wins over the index when the solve names it
  const keyed = (N, K) => (K && N && N.reliable && N.group === K.group ? N.mos.find((m) => m.irrep === K.irrep && m.count === K.count && (m.member || null) === (K.member || null)) || null : null);
  const subs = new Set(), notify = () => { for (const f of subs) { try { f(sol); } catch (e) { console.warn('chem subscriber', e); } } };   // the ORBITALS register listens here
  /* V2 · A VOLUME'S MOLECULE is not a preset: `volRef` holds the one on screen and `preset` is its key ('vol-1:aspirin'); `catPreset` the catalogue
     molecule a project falls back to; `volKeep` the last opened (an undo re-opens it unread); `volWant` a project's, opened on the next solve;
     `holds` the catalogue ids an INSTALLED volume carries */
  let volRef = null, volKeep = null, volWant = null, volSeq = 0, catPreset = preset, holds = new Map();
  const volName = (v) => `${String(v.name).toUpperCase()} · VOL. ${v.numeral}`;
  const rungRec = () => volRef.lwm.header.rungs[basis].record;
  function chemCharge(id) { return volRef && id === volRef.key ? volRef.charge : moleculeCharge(id); }   // the card's own: shadows the module's export with a volume molecule's
  /** the molecule on screen as a row the stage words, the caption and EDIT › COPY read: the catalogue's, or a volume molecule's { id, name, formula, charge, volume } */
  const row = () => (volRef ? { id: volRef.key, name: volRef.name, formula: volRef.meta.formulaM || volRef.meta.formula, charge: volRef.charge, volume: 'VOL. ' + volRef.numeral } : PRESET_BY_ID.get(preset) || null);

  /** the dial's own label: knob() paints on construction and calls fmt() at once, so this is HOISTED */
  function orbFmt(k) { return sol ? orbitalName(sol.names, k - 1, sol.nocc) : String(k); }   // lab/names.js: '1b1 · HOMO' (a dial's text takes the plain form)
  /* ── the rows ─────────────────────────────────────────────────────────────────────────────────── */
  /* THE SECTION HEADER IS THE PAGE TURNER (0.4.0 S4b · PLAN F5, the expansion seat): ‹ SECTION › above the dropdown, which then
     holds that one section; the name, its record count and bytes, how many are on this device, and INSTALLED — the switch's lamp
     is lit when every record of the section is kept here, and its press installs them all (persist() asked once) or removes
     them.  A section with no record solves live and offers nothing to keep; in a Safari tab nothing is offered to keep (S4a: the
     M5 has not measured persist there).  The page is the molecule's own section, or the one the hand turned to — never saved.
     0.5.3 M8 (Josh: "section picker and molecules picker should look like palette window's selector"): both pickers are the kit's
     stepper, PALETTE's preset look — SECTION's name opens the kit's list; the section's record line rides its hover. Josh's rows:
     ‹ SECTION › · INSTALLED · MOLECULES ON, then the MOLECULE picker alone, then BASIS · ORBITAL, then VIEW · the chevron. */
  let page = PRESET_BY_ID.get(preset).section, sub = '';
  const rH = el('div', 'row tight mol-section', host);
  const secStep = stepper({ aria: 'Library section', items: ['ATOMS', ...SECTIONS].map((id) => ({ id, label: id })), value: page, cls: 'mol-step', onChange: (id) => { page = id; fillSel(); if (id === 'ATOMS') setShelf(true); } });
  rH.appendChild(secStep.root);
  const keepSw = sw({ label: 'INSTALLED', value: false, title: 'Every record of this section kept on this device: press to install them all, press again to remove them', onChange: (v) => { keep(v); } });
  rH.appendChild(keepSw.root);
  const onSw = sw({ label: 'MOLECULES ON', value: false, title: 'Give the field to this molecule’s density', onChange: (v) => { setOn(v); if (v && api.hand) api.hand(preset); } });   // 0.5.1 D2: ON with a molecule chosen is a hand pick
  rH.appendChild(onSw.root);
  const r0 = el('div', 'row tight', host);
  /* 0.7.4 C2 · THE SHELF: SECTION's name opens the page as TILES under the picker (formula, name, AOs, the catalogue's word, the lamp); a tap is the hand's
     pick and the shelf folds.  ‹ ATOMS ›, the first page, is the periodic table: a tile sets OPERATOR ATOM and its element (api.atom).  Alt+↓ keeps the kit's list. */
  const shelf = el('div', 'mol-shelf', host), ATOM_W = CATALOGUE.find((r) => r.id === 'atom'); shelf.id = 'mol-shelf'; shelf.hidden = true;
  secStep.name.setAttribute('aria-controls', shelf.id); secStep.root.addEventListener('click', (e) => { if (e.target.closest('.mir-step-name')) { e.stopPropagation(); setShelf(shelf.hidden); } }, true);
  function setShelf(open) { shelf.hidden = !open; secStep.name.setAttribute('aria-expanded', String(open)); shelfFill(); }
  function shelfFill() {
    if (shelf.hidden) return; shelf.replaceChildren();
    const tile = (title, lines, pick, here, off) => { const b = el('button', 'pk-c mol-tile' + (here ? ' on' : ''), shelf); b.type = 'button'; b.title = title; b.disabled = !!off;
      lines.forEach((t, i) => el(i ? 'span' : 'b', '', b, t)); b.addEventListener('click', () => { setShelf(false); pick(); }); };
    if (page === 'ATOMS') { ATOMS.forEach((a, i) => tile(`${a.name} · Z = ${a.Z} · ${a.term} · ${ATOM_W.word} · ${ATOM_W.oracle.what}`, [a.symbol, 'Z = ' + a.Z, ATOM_W.word],
      () => { if (on) setOn(false); api.atom(a.Z); }, api.atomZ() === a.Z)); return; }
    for (const g of [...GROUPS, RECORD_GROUP]) for (const p of CHEM_PRESETS.filter((q) => q.group === g.id && q.section === page)) {
      const w = (CATALOGUE.find((r) => r.id === p.id && r.shelf === 'molecules') || {}).word || '—', lamp = p.disabled ? p.shortReason.toUpperCase() : !p.recordOnly ? 'LIVE' : have.get(p.records['sto-3g'].hash) ? 'INSTALLED' : 'DOWNLOAD';
      tile(p.name + (p.disabled ? ' — ' + p.reason : p.over ? ' — past the cap: it opens from its record' : '') + ' · ' + p.source, [p.formula, p.name, `${p.nAO} AO`, w, lamp], () => { handPick(p.id); }, p.id === preset, p.disabled);
    }
  }
  /* ── THE MOLECULE DROPDOWN ────────────────────────────────────────────────────────────────────────────────
   * paletteview.js:22's node and class, and its lesson too: a `<select>` fires `change` only when the VALUE
   * changes, so re-picking what you are already on fires nothing.  Here that is correct rather than a trap —
   * `solve()` returns the cached answer for the molecule already up, so a re-pick would be a no-op anyway, and
   * the one road that must still work (force a re-solve) is `__LW.chem.solve(id, { force: true })`.
   * A DISABLED option carries its reason in its own title, so the menu explains itself where it refuses.
   * 0.5.3 M8: the select IS the kit stepper's name (PALETTE's ‹ NAME ›): the arrows (and ← →) walk the page's enabled rows as a hand pick. */
  const mStep = stepper({ aria: 'Molecule', list: false, items: [], value: preset, cls: 'mol-step mol-pick', onChange: (id) => { mSel.value = id; handPick(id); } });
  r0.appendChild(mStep.root);
  const mSel = el('select', 'sel'); mStep.name.replaceChildren(mSel);
  mSel.setAttribute('aria-label', 'molecule');
  mSel.title = CAP_RULE; mSel.dataset.help = CAP_RULE;
  /** the dropdown holds the page's section, in the table's groups; the molecule on screen stays chosen when it is on this page */
  function fillSel() {
    mSel.replaceChildren();
    for (const g of [...GROUPS, RECORD_GROUP]) {
      const rows = CHEM_PRESETS.filter((p) => p.group === g.id && p.section === page);
      if (!rows.length) continue;
      const og = el('optgroup', '', mSel); og.label = g.label;
      for (const p of rows) {
        const o = el('option', '', og, optionLabel(p, !p.recordOnly || !!have.get(p.records['sto-3g'].hash))); o.value = p.id;
        o.disabled = !!p.disabled;
        /* the source goes on `data-help` as well as `title`: lab/mir/control-help.js moves a title to data-help at
           boot, which is fine for the control but leaves an <option> with neither unless both are set here. */
        const why = p.name + (p.disabled ? ' — ' + p.reason : '') + ' · ' + p.source;
        o.title = why; o.dataset.help = why;
      }
    }
    if (volRef) { const og = el('optgroup', '', mSel), o = el('option', '', og, volName(volRef)); og.label = 'VOL. ' + volRef.numeral; o.value = volRef.key; o.title = o.dataset.help = volRef.name + ' · ' + volRef.geometry; }   // V2: the volume molecule on screen, until a catalogue pick
    mSel.value = preset; if (mSel.value !== preset) mSel.selectedIndex = -1;   // turned away from the molecule on screen: nothing chosen here yet
    mStep.setItems([...mSel.options].filter((o) => !o.disabled).map((o) => ({ id: o.value, label: o.textContent })), mSel.value || null); secStep.set(page);
    header();
  }
  mSel.addEventListener('change', () => { mStep.set(mSel.value); handPick(mSel.value); });   // a hand press: a DOWNLOAD row installs (and asks persist once)
  /** THE HAND'S PICK (the dropdown; a notebook link, 0.5.1 D8): the solve as a press, and the app told — its head waits for this solve (D2) */
  function handPick(id) { const p = solve(id, { press: true }); if (api.hand) api.hand(preset); return p; }
  /* THE INSTALLED LAMP, read off the store (lw-data-v1): a record-only row says DOWNLOAD until its record is on this device, and
     the store is re-read when the menu is opened (the browser may have evicted it: then the row says DOWNLOAD again, never broken) */
  const have = new Map(), optOf = (id) => [...mSel.options].find((o) => o.value === id);
  const sectionRecs = () => CHEM_PRESETS.filter((p) => p.section === page).flatMap((p) => Object.values(p.records || {}));
  async function lamps() {
    for (const p of CHEM_PRESETS) for (const r of Object.values(p.records || {})) have.set(r.hash, await installed(r.hash));
    for (const p of CHEM_PRESETS) if (p.recordOnly) { const o = optOf(p.id); if (o) o.textContent = optionLabel(p, have.get(p.records['sto-3g'].hash)); }
    header(); return have;
  }
  function header() {
    const recs = sectionRecs(), on = recs.filter((r) => have.get(r.hash)).length, n = CHEM_PRESETS.filter((p) => p.section === page).length;
    const mb = (recs.reduce((s, r) => s + r.bytes, 0) / 1048576).toFixed(1);
    sub = page === 'ATOMS' ? `${ATOMS.length} elements, H–Kr · ${ATOM_W.word}` : recs.length ? `${recs.length} record${recs.length > 1 ? 's' : ''} · ${mb} MB · ${on} here` : `${n} molecules, all live`;
    secStep.root.title = page === 'ATOMS' ? `ATOMS · ${sub}: a tile sets OPERATOR ATOM and its element` : `${page} · ${sub}: ${n} molecules; ` + (recs.length ? `${recs.length} with a record (${mb} MB), ${on} of them on this device` : 'every one solves live, none has a record');
    keepSw.root.hidden = !recs.length || safariTab(); keepSw.set(recs.length > 0 && on === recs.length); shelfFill();
  }
  /** INSTALLED's press: the page's records fetched (each checked against its sha-256 name) and kept, or all removed */
  async function keep(v) {
    const recs = sectionRecs(), sec = page;
    if (v) { storageNote(await persistOnce()); let k = 0; for (const r of recs) { status(`installing ${sec}… ${++k} of ${recs.length}`, 'warn'); if (!have.get(r.hash)) await fetchRecord(r.hash, { network: true }); } }
    else for (const r of recs) await removeRecord(r.hash);
    await lamps(); const on = recs.filter((r) => have.get(r.hash)).length;
    status(`${sec}: ${on} of ${recs.length} records on this device` + (v && on < recs.length ? ' — the rest did not download (offline?)' : ''), on === (v ? recs.length : 0) ? 'ok' : 'warn');
    return { section: sec, records: recs.length, installed: on };
  }
  fillSel(); lamps(); mSel.addEventListener('focus', () => { lamps(); });
  const mSeg = { root: mStep.root, set(v) { const s = (PRESET_BY_ID.get(v) || {}).section; if (s && s !== page) { page = s; fillSel(); } if (mSel.value !== v) mSel.value = v; mStep.set(v); shelfFill(); }, get() { return mSel.value; }, el: mSel };
  /* V2 · THE BASIS SEG IS THE LADDER: a catalogue molecule keeps the live law (STO-3G; 6-31+G* under the cap), its other rungs from an INSTALLED volume
     holding its id; a volume molecule's every rung is its record, a rung its file lacks disabled with the header's reason */
  const B_TITLE = { 'sto-3g': 'The vendored minimal Cartesian basis; the oracle for all eight',
    '6-31+g-star': 'A split-valence basis with diffuse and polarisation functions, for H, C, N, O, F molecules up to 46 Cartesian AOs — water’s first root moves 0.483 → 0.341' };
  const bSeg = seg({ label: 'BASIS', value: 'sto-3g', options: Object.entries(BASIS_LABEL).map(([id, label]) => ({ id, label, title: B_TITLE[id] || label + ': in a volume' })),
    onChange: (v) => { pressBasis(v); if (api.pop) api.pop('BASIS · ' + bSeg.button(v).textContent); } });
  bSeg.root.addEventListener('pointerenter', () => { readHolds(); }); bSeg.root.addEventListener('focusin', () => { readHolds(); });   // the volumes are read when the hand comes near, never at boot
  const liveOk = (P) => (P.recordOnly ? { ok: false, nAO: P.nAO, why: `${P.name} is past the live cap and opens only from its STO-3G record; another basis would be a live solve, which is not offered` } : basis631(P.id));
  function paintBasis() {
    const P = volRef ? null : PRESET_BY_ID.get(preset), big = P && liveOk(P), h = P && holds.get(P.id);
    for (const b of Object.keys(BASIS_LABEL)) {
      const btn = bSeg.button(b); let why = '';
      if (volRef) why = volRef.rungs.includes(b) ? '' : volRef.why[b] || 'not in this file';
      else if (b === 'sto-3g' || (b === '6-31+g-star' && big.ok)) why = '';
      else if (h && h.rungs.includes(b)) why = '';
      else why = b === '6-31+g-star' ? big.why : 'in a volume';
      btn.disabled = !!why; btn.title = btn.dataset.help = why || (volRef ? `${BASIS_LABEL[b]} · ${volName(volRef)}'s record, no solve` : B_TITLE[b] && (b === 'sto-3g' || big.ok) ? B_TITLE[b] : `${BASIS_LABEL[b]} · from VOL. ${h.numeral}'s record, no solve`);
    }
  }
  /** a press on the ladder: a volume molecule opens that rung; a catalogue molecule solves live where the law allows, else opens it from the volume that holds it */
  function pressBasis(v) {
    if (!BASIS_LABEL[v]) return Promise.resolve(null);
    const P = volRef ? null : PRESET_BY_ID.get(preset), h = P && holds.get(P.id);
    if (volRef ? volRef.rungs.includes(v) : v === 'sto-3g' || (v === '6-31+g-star' && liveOk(P).ok)) { basis = v; return solve(preset); }
    if (h && h.rungs.includes(v)) return openVolume(h.volume, h.id, v);
    bSeg.set(basis); return Promise.resolve(null);
  }
  /** the catalogue ids an INSTALLED volume holds, with their rungs (the index's) */
  async function readHolds() {
    const next = new Map(), s = await V.shelf().catch(() => ({ volumes: [] }));
    for (const v of s.volumes) {
      const st = await V.statusOf(v.id).catch(() => null), idx = st && st.state === 'installed' ? await V.index(v.id).catch(() => null) : null;
      for (const m of (idx && idx.molecules) || []) if (PRESET_BY_ID.has(m.id) && !next.has(m.id)) next.set(m.id, { volume: v.id, numeral: v.numeral, id: m.id, rungs: Object.keys(m.rungs || {}) });
    }
    holds = next; paintBasis(); return holds;
  }
  paintBasis();
  const r1 = el('div', 'row tight', host), rV = el('div', 'row tight', host);
  r1.appendChild(bSeg.root);
  /* 0.7.3 K2 · METHOD beside BASIS: RHF · LDA, and U2's UHF on H₂ (folded in here); an open shell's RHF reads UHF and LDA waits for UKS. LDA always solves live
     (never a record), and only up to benzene's 36 STO-3G AOs: the grid's AO table is points × AOs (78 MB for benzene). A press is a hand pick (its head) */
  const LDA_T = 'Kohn–Sham, local density (Slater + VWN5) on a Becke × Treutler–Ahlrichs × Lebedev-302 grid, solved live — PySCF RKS lda,vwn the oracle';
  const mthS = seg({ label: 'METHOD', value: 'rhf', options: [{ id: 'rhf', label: 'RHF', title: 'Restricted Hartree–Fock: one spatial orbital for both spins' }, { id: 'uhf', label: 'UHF', title: 'H₂ by UHF: α and β free to part past the Coulson–Fischer point' }, { id: 'lda', label: 'LDA', title: LDA_T }],
    onChange: (v) => { method = v; if (api.pop) api.pop('METHOD · ' + mthS.button(v).textContent); solve(preset).then((r) => { if (r && api.hand) api.hand(preset); }); } });
  r1.appendChild(mthS.root);
  const ldaWhy = (P) => (P.multiplicity > 1 ? 'LDA is closed-shell in this cut: an open shell is UHF (no UKS until a later cut)' : basis !== 'sto-3g' ? 'LDA is STO-3G only in this cut'
    : P.recordOnly || P.nAO > 36 ? `LDA is offered up to benzene’s 36 STO-3G AOs (the grid’s AO table is points × AOs): ${P.name} has ${P.nAO}` : '');
  function methods(P) {   // the seg for this molecule and basis; a method it cannot offer falls back to RHF, said on the status line
    const h2 = preset === 'H2' && basis === 'sto-3g', why = ldaWhy(P), b = mthS.button('lda'), fell = (method === 'uhf' && !h2) || (method === 'lda' && !!why);
    if (fell) method = 'rhf';
    mthS.button('uhf').style.display = h2 ? '' : 'none'; mthS.button('rhf').textContent = P.multiplicity > 1 ? 'UHF' : 'RHF'; b.disabled = !!why; b.title = b.dataset.help = why || LDA_T; mthS.set(method);
    return fell && why ? why + ': solved by RHF' : '';
  }
  const vSeg = seg({ label: 'VIEW', value: 'density', options: [
    { id: 'density', label: 'DENSITY', title: 'ρ(r) = Σ D_ij χ_i χ_j on the field' },
    { id: 'orbital', label: 'ORBITAL', title: 'ψ_k(r) = Σ C_ik χ_i — one molecular orbital' },
    { id: 'diff', label: '<m>Δρ</m>', title: 'The induced density against the reference stored at the kick — ΔD is formed in double precision and shown as a signed field, so a weak kick is not lost in the texture format' },
    { id: 'esp', label: 'ESP', title: 'Φ(r) = Σ Z_A/|r−R_A| − ∫ρ/|r−r′| on a 64³ grid' },
    { id: 'spin', label: 'SPIN', title: 'ρα − ρβ, signed: the spin density of a UHF open shell (Dα − Dβ in double precision)' },
    { id: 'dlda', label: 'Δ LDA−RHF', title: 'ρ_LDA − ρ_RHF, signed: where LDA puts more density — D_LDA − D_RHF in double precision, the Δρ road' }],
    onChange: (v) => { view = v; seats(); pushMatrix(v === 'diff' && !rt); refresh(); tell(); if (api.pop) api.pop('VIEW · ' + vSeg.button(v).textContent); } });   // a run already HAS its t = 0 reference; only a still molecule needs one stored now
  rV.appendChild(vSeg.root);
  let orbKnob = knob({ label: 'ORBITAL', min: 1, max: 7, value: 5, title: 'The molecular orbital index, ascending in ε; HOMO by default',
    fmt: (v) => orbFmt(Math.round(v)), onInput: (v) => { orbital = Math.round(v); if (view === 'orbital') pushMatrix(); refresh(); } });
  r1.appendChild(orbKnob.root);
  /* 0.4.0 S4c · VALENCE, A SWITCH ON DENSITY (PLAN F5 iii): D − 2 Σ_core C_c C_cᵀ in f64, drawn by the density kind; the core is S1's
     coreCount(atoms).  It takes the ORBITAL dial's seat while DENSITY is the view (the dial reads nothing there): no wider row. */
  const valSw = sw({ label: 'VALENCE', value: false, title: 'The valence density: D − 2 Σ C_c C_cᵀ over the frozen-core orbitals (He for Li–Ne, Ne for Na–Ar, Ar for K–Zn …) — the core no longer drowns the bonds',
    onChange: (v) => { valence = v; pushMatrix(); refresh(); tell(); } });
  r1.insertBefore(valSw.root, orbKnob.root);
  function seats() { valSw.root.style.display = view === 'density' ? '' : 'none'; orbKnob.root.style.display = view === 'density' ? 'none' : ''; orbKnob.root.classList.toggle('off', view !== 'orbital'); }
  seats();
  /* THE TDA TOGGLE SWAPS THE WHOLE LADDER, positions AND strengths.  It used to draw each RPA root's height and
     polarisation at the k-th TDA root's ω — and the two ladders CROSS: for benzene RPA root 2 is the bright line
     while TDA root 2 is dark, its bright pair sitting at roots 3 and 4.  The TDA ladder is its own ascending list
     now (lab/rpa-inspector.js `tda`), and this switch shows that list, with ITS f and ITS μ. */
  const tdaSw = sw({ label: 'TDA', value: false, title: 'Draw the TDA ladder — its own ω, f and polarisation, never relabelled as RPA', onChange: (v) => { tda = v; selected = null; paint(); } });
  r1.appendChild(tdaSw.root);
  const coreSw = sw({ label: 'CORE', value: false, title: 'The O 1s window, 19–21 hartree: a timestep diagnostic, not X-ray spectroscopy', onChange: (v) => { core = v; cvCore.hidden = !core; paint(); } });
  r1.appendChild(coreSw.root);

  const r2 = el('div', 'row tight', host);
  const aSeg = seg({ label: 'KICK AXIS', value: 'y', options: AXES.map((a) => ({ id: a, label: a.toUpperCase(), title: 'Strike the density with exp(−iκ ' + a + ')' })),
    onChange: (v) => { axis = v; requestSpectrum(true); paint(); } });
  r2.appendChild(aSeg.root); const PULSES = ['none', 'step', 'ramp', 'wave', 'gaussian'];   // 0.7.0 V1 · PULSES: κ·f(t) along the kick axis for 40 a.u. (density.js fieldOf), the WAVE at the first bright root — instead of the δ-kick
  const pSeg = seg({ label: 'PULSE', value: 'none', options: PULSES.map((id) => ({ id, label: id.toUpperCase(), title: id === 'none' ? 'The δ-kick exp(−iκ q̂)' : 'κ·' + { step: '1', ramp: 't', wave: 'cos ωt, ω the first bright RPA root', gaussian: 'e^{−0.05 t²}' }[id] + ' along the kick axis, 0 ≤ t < 40 a.u., instead of the kick' })), onChange: (v) => { pulse = v; setRun(false); rt = spec = fit = null; pushMatrix(); refresh(); } }); r2.appendChild(pSeg.root);
  const kapKnob = knob({ label: '<m>κ</m>', min: 1e-4, max: 1e-2, value: 1e-3, log: true, title: 'The δ-kick strength; linear response wants the smallest κ the trace can carry',
    fmt: (v) => v.toExponential(1), onInput: (v) => { kappa = v; } });
  r2.appendChild(kapKnob.root);
  const kickT = trig({ label: 'KICK', title: 'exp(−iκ q̂) on the converged density, then field-free propagation', onFire: () => { kick(); } }); r2.appendChild(kickT.root);
  const runSw = sw({ label: 'RUN', value: false, title: 'Propagate the density in real time', onChange: (v) => { setRun(v); } });
  r2.appendChild(runSw.root);
  const flowSw = sw({ label: 'FLOW', value: false, title: 'Tracers on the stage riding the current of the real-time density matrix, v = j/ρ — kick and RUN first: a still molecule has no current', onChange: (v) => { setFlow(v); } });
  r2.appendChild(flowSw.root);
  const srcSeg = seg({ label: 'FLOW SOURCE', value: 'computed', options: [{ id: 'computed', label: 'AS COMPUTED', title: 'v = j/ρ, the run’s own current' }, { id: 'balanced', label: 'BALANCED', title: 'v + ∇φ with −∇·(ρ∇φ) = ∂ρ/∂t + ∇·j: continuity closed on a 32³ grid, solved in a worker' }], onChange: (v) => { flowSrc = v; if (flow) { flow.setSource(v); paintFlow(); } api.repaint(); } });
  r2.appendChild(srcSeg.root);
  const fr = el('div', 'row tight', host), roRep = readout({ label: 'REPAIR', cls: 'wide', value: '—' }), roGate = readout({ label: 'GATED', value: '—' }); fr.append(roRep.root, roGate.root); fr.hidden = true;
  /* iteration 005 P2 · THE CONTINUITY RECORD, CALCULUS's tile shape (readout + canvas) seated with FLOW — CALCULUS itself is hidden in MOLECULES mode (iteration 002) */
  const roCon = readout({ label: 'CONTINUITY  ‖∂ρ/∂t + ∇·j‖₂ / ‖∂ρ/∂t‖₂ on PLANE\'s sample · ∇·j the full 3-D divergence (the in-plane one would miss ∂j⊥/∂n)', cls: 'wide calc-ray', value: '—' }), conCv = el('canvas', '', roCon.root), conG = conCv.getContext('2d');
  conCv.style.height = '112px'; roCon.root.hidden = true;
  const spdKnob = knob({ label: 'SPEED', min: 1, max: 50, value: 10, title: 'Propagation steps per frame — one outstanding worker request at a time',
    fmt: (v) => Math.round(v) + '/frame', onInput: (v) => { speed = Math.max(1, Math.round(v)); } });
  r2.appendChild(spdKnob.root);
  const dSeg = seg({ label: '<m>STEP  Δt</m>', value: '0.01', options: DTS.map((d) => ({ id: d, label: d, title: 'Δt = ' + d + ' a.u.; 0.01 is the screen default at θ = 0.21 on the core gap' })),
    onChange: (v) => { dt = Number(v); reset(); } });
  r2.appendChild(dSeg.root);
  const iSeg = seg({ label: 'INTEGRATOR', value: 'mmut', options: [
    { id: 'mmut', label: 'MMUT', title: 'Unrestarted modified-midpoint unitary transform — the default on screen' },
    { id: 'magnus2', label: 'MAGNUS-2', title: 'The startup and the reference; the same Δt² frequency error' }],
    onChange: (v) => { integrator = v; reset(); } });
  r2.appendChild(iSeg.root);

  const cv = el('canvas', 'mol-c', host); const g = cv.getContext('2d');
  const cvCore = el('canvas', 'mol-c mol-core', host); cvCore.hidden = true; const gc = cvCore.getContext('2d');

  const rr = el('div', 'row tight', host);
  const roE = readout({ label: 'E  (hartree)', value: '—', sub: '' });
  const roEps = readout({ label: '<m>ε_HOMO · ε_LUMO</m>', value: '—', sub: '' });
  const roTr = readout({ label: '<m>Tr(DS)</m>', value: '—', sub: '' });
  const roIdem = readout({ label: 'IDEMPOTENCY', value: '—', sub: '' });
  const roT = readout({ label: '<m>t</m>  (a.u.)', value: '—', sub: '' });
  const roPick = readout({ label: 'INSPECTOR', cls: 'wide', value: '—', sub: 'hover or click a stick' });
  const roSym = readout({ label: 'SYMMETRY', cls: 'wide', value: '—', sub: '' });   // 0.6.1 F2: symmetryLine
  const roXc = readout({ label: '<m>E_xc · ∫ρ</m>', cls: 'wide', value: '—', sub: '' }); roXc.root.hidden = true;   // 0.7.3 K2: RKS LDA's own numbers, the reply's
  for (const r of [roE, roEps, roTr, roIdem, roT, roXc, roSym, roPick]) rr.appendChild(r.root);
  el('div', 'note', host).innerHTML = '<b>Model.</b> Hartree–Fock (RHF; UHF for an open shell) or, by METHOD, Kohn–Sham LDA, in a vendored Cartesian basis at a fixed geometry this window never optimises: measured for a molecule solved live (AlH₃’s is the RHF/STO-3G minimum: no gas-phase structure has been determined), computed for most library records (the head says which). Sticks are singlet RPA (or TDA) roots with height proportional to oscillator strength; the curve is Im α(ω) from the real-time δ-kick trace. Peaks are fitted poles with a 4ε/σ certificate: an uncertified reading is labelled as the raw maximum. The electron count is Tr(DS), never a voxel sum.';
  /* 2026-10 (Josh) · EVERYTHING BELOW VIEW + ORBITAL sits in `.mol-more`: TDA / CORE, the kick and run controls, the
     spectrum, the readouts and the note — every control keeps its state, save/load and API (__LW.chem.kick(), run, setTda …),
     and `shown()` makes a folded canvas's paint a no-op.
     0.4.0 S0 · wave 136: it is a FOLD, not a permanently hidden div — the README's KICK / RUN / TDA / RPA spectra were
     unreachable on a first run.  The chevron at the end of the VIEW row is the in-card details idiom SHADOW and CAMERA
     already use (a trig with the kit's chevronDown, aria-expanded); OPEN by default on a desktop, folded on a phone or
     tablet (`api.moreOpen`, first-run.js), and the open state rides in the window's WORKSPACE record (rack.js
     captureLayout `more`). */
  const note = host.lastElementChild;
  const more = el('div', 'mol-more', host); more.id = 'mol-more';
  /* 0.7.0 V1 · VIBRATE, the fold's first row: the molecule's normal-mode record (tools/vibrate-library.mjs), fetched on the first press; the nuclei at
     R₀ + A·Q₀·cos(ωt)·L and the density LINEAR + one McWeeny step — 32 phase samples from the worker (chem.vib.frames), posed per frame in update() */
  const rVib = el('div', 'row tight mol-vib', more), vibSw = sw({ label: 'VIBRATE', value: false, title: 'The nuclei breathe in one normal mode and the density with them (LINEAR + one McWeeny step): STO-3G RHF harmonic, as computed', onChange: (v) => { setVib(v); } });
  const modeStep = stepper({ aria: 'Normal mode', list: false, items: [], value: null, cls: 'mol-step', onChange: (id) => { setVib(vibOn, +id); } }), roVib = readout({ label: 'MODE', cls: 'wide', value: '—' });
  const ampKnob = knob({ label: 'AMPLITUDE', min: 0, max: 4, value: 1, title: 'In units of Q₀ = √(ħ/μω), the zero-point turning point; past 2 Q₀ it is not harmonic here', fmt: (v) => v.toFixed(1) + ' Q₀', onInput: (v) => { setVib(vibOn, vibK, v); } });
  rVib.append(vibSw.root, modeStep.root, ampKnob.root, trig({ label: 'BREATHE', title: 'RATE so one breath takes a second, the clock playing, VIBRATE on', onFire: () => { breathe(); } }).root, roVib.root);
  const rTda = el('div', 'row tight', more); rTda.appendChild(tdaSw.root); rTda.appendChild(coreSw.root);
  for (const n of [r2, fr, roCon.root, cv, cvCore, rr, note]) more.appendChild(n);
  const h2Note = el('div', 'note', more); h2Note.hidden = true;   // 0.6.2 H2: H₂'s hidden correlation, STO-3G only
  /* 0.7.1 U2 · THE CURVE under it (lab/h2curve.js): RHF · UHF · FCI along R against 2E(H); STRETCH re-poses H₂'s nuclei at ±R/2 on z and re-solves by the ordinary road
     (h2R null = the row's own geometry, byte for byte); METHOD UHF (the card's seg since 0.7.3) asks moleculeRHF for model 'uhf' (U1's arg); PROJECT `h2 { R, method }`, absent by default */
  let h2R = null, h2T = null; const R0 = moleculeAtoms('H2')[1].z, h2Box = el('div', 'mol-h2', more), h2Cv = el('canvas', 'mol-c mol-curve', h2Box), h2Row = el('div', 'row tight', h2Box);
  const h2Key = () => (preset === 'H2' && basis === 'sto-3g' && h2R ? '|' + h2R : '') + (method !== 'rhf' ? '|' + method : ''), eh = (x) => x.toFixed(2).replace('-', '−');   // and the METHOD (methods() keeps UHF to H₂)
  function chemAtoms(id) { return volRef && id === volRef.key ? volRef.atoms : moleculeAtoms(id, id === 'H2' && basis === 'sto-3g' ? h2R : null); }   // the card's own: shadows the module's export with the STRETCH's pose (and V2's volume molecule)
  const h2K = knob({ label: 'STRETCH', min: 0.8, max: 6, value: R0, title: 'R(H–H) in bohr: the two nuclei re-posed at ±R/2 on z and re-solved; the row’s own 0.741 Å by default', fmt: (v) => v.toFixed(2) + ' bohr',
    onInput: (v) => { h2Read(v); }, onChange: (v) => { h2R = Math.abs(v - R0) < 5e-3 ? null : v; solve(preset); } });
  const roH2 = readout({ label: 'THE H₂ CURVE · STO-3G', cls: 'wide', value: '—', sub: '' }); h2Row.append(h2K.root, roH2.root);
  function h2Read(R = h2K.get()) { h2T = h2T || h2Curve(Array.from({ length: 53 }, (_, i) => +(0.8 + 0.1 * i).toFixed(1))); const p = h2Point(R);
    roH2.set(`R ${R.toFixed(2)} bohr · RHF ${eh(p.rhf)} · UHF ${eh(p.uhf)} · FCI ${eh(p.fci)} Eh · S ${p.S.toFixed(2)} of ln 2 · ⟨S²⟩ ${p.s2.toFixed(2)}`);
    roH2.setSub(`UHF leaves RHF at the Coulson–Fischer point, ${h2T.cf.toFixed(3)} bohr · S: the one-orbital entanglement entropy of the FCI state, ln 2 = 0.693 at the break`); drawCurve(h2Cv, h2T, R); }
  const probeLine = el('div', 'note', more); probeLine.hidden = true; probeLine.title = 'the electrons’ potential −Σ D_pq ⟨p|1/|r−R_A||q⟩ at each nucleus R_A (md.js rinvMatrix; PySCF int1e_rinv) — the ground state’s';   // 0.6.5 X1 THE PROBE
  const moreToggle = el('button', 'trig mol-more-toggle lw-fold', r1); moreToggle.type = 'button'; moreToggle.setAttribute('aria-controls', more.id);
  chip(moreToggle, 'chevronDown', 'Show the kick, run and spectrum controls');
  const setMore = (open) => {
    more.hidden = !open; moreToggle.setAttribute('aria-expanded', String(open));
    moreToggle.setAttribute('aria-label', open ? 'Hide the kick, run and spectrum controls' : 'Show the kick, run and spectrum controls');
    if (open) requestAnimationFrame(() => paint());
  };
  moreToggle.addEventListener('click', () => setMore(more.hidden));
  setMore(api.moreOpen !== false);

  /* ── the worker road ─────────────────────────────────────────────────────────────────────────── */
  const call = (msg, fallback) => Promise.resolve(api.solve(msg, fallback || (() => null), (r) => r));
  /* THE FALLBACK IS FOR A BROWSER WITH NO WORKER, and only that: the worker's OWN exported ops (lab/mathworker.js installs its
     message handler only inside a real worker), run here on the frame thread — one road and one reply, never a second
     implementation (0.4.0 S4a: the hand-built copy this replaced answered its TDA ladder outside the canonical gauge, with
     its own `half`).  It answers the GROUND stage with the spectrum attached, so the staged road skips stage two. */
  const here = (basis) => Promise.all([import('./mathworker.js'), import('./rhf-molecule.js')]).then(async ([W, R]) => { W.chemRegister(basis, await R.loadRecord(basis)); return W; });
  async function localSolve(msg) {
    const W = await here(msg.basis), g = W.chemGround(msg), s = g.model ? {} : W.chemSpectrum(msg);   // 0.7.1: an open shell has no spectrum road
    return { ...g, roots: s.roots, tda: s.tda, timings: s.timings, stage: 'full', local: true };
  }

  /* ── solve ────────────────────────────────────────────────────────────────────────────────────── */
  function solve(id = preset, { force = false, press = false } = {}) {
    if (volRef && id !== volRef.key) { volRef = null; volSeq++; fillSel(); }   // V2: a catalogue pick puts the volume molecule away (its option goes)
    if (id !== preset) { volWant = null; preset = id; mSeg.set(id); }
    if (volRef) return volSolve({ force, press });
    if (volWant) { const w = volWant; volWant = null; return openVolume(w.volume, w.id, w.basis, { hand: false, network: false, on: false, sha: w.sha256 }); }   // a project's volume molecule, on its first solve
    catPreset = preset;
    const P = PRESET_BY_ID.get(preset) || CHEM_PRESETS[0];
    if (wantRef && wantRef.id !== preset) wantRef = null;                   // a project's record reference lasts until the molecule changes
    /* A DISABLED ENTRY IS REFUSED HERE AND NOT SENT.  CuH and ZnH₂ converge to an RHF solution that is not a
       minimum (both A ± B blocks negative), so lab/rpa-inspector.js refuses them and chem.solve cannot answer at
       all — the refusal belongs in front of the worker, with the reason, rather than as a failed solve. */
    if (P.disabled) { status(P.name + ': ' + P.reason, 'warn'); return Promise.resolve(null); }
    /* THE BENZENE-CAP LAW (PLAN B2): a molecule past the cap opens only from its record — a basis change would be a solve */
    const big = liveOk(P);
    const back = !LIVE.has(basis) ? `${P.name}: back to STO-3G — ${BASIS_LABEL[basis]} opens from a volume (the BASIS seg)` : !big.ok && basis !== 'sto-3g' ? `${P.name}: back to STO-3G — ${big.why}` : null;   // a refusal is a sentence, not a solve
    if (back) { basis = 'sto-3g'; bSeg.set('sto-3g'); status(back, 'warn'); }
    paintBasis();
    /* THE ANSWER WE ALREADY HAVE IS THE ANSWER.  Beyond not paying twice, this is load-bearing: the worker caches
       its report on (atoms, basis, charge) and TRANSFERS that report's typed arrays, so a second chem.solve for the
       same key posts detached buffers, throws inside the worker's own handler, and never replies at all — the call
       then sits until its timeout.  Re-solving is what changing the molecule or the basis does; asking twice is not. */
    const fell = methods(P), key = preset + '|' + basis + '|' + chemCharge(preset) + h2Key(), k0 = kept.get(key);
    if (!force && sol && sol.key === key) { refresh(); if (back) status(back, 'warn'); return Promise.resolve(sol); }
    if (!force && pending && pending.key === key) return back ? pending.p.then((r) => { status(back, 'warn'); return r; }) : pending.p;   // …and one IN FLIGHT is the same answer
    setRun(false); rt = null; spec = null; fit = null; fitErr = null; selected = null; if (vibOn) setVib(false);
    if (!force && k0 && (k0.roots || k0.model)) { k0.seq = ++solveSeq; if (api.loading) api.loading(false); if (api.derived) api.derived(() => land(k0)); else land(k0); return Promise.resolve(sol); }   // 0.7.3 K2: a kept solve of this molecule (METHOD back) lands again, no worker call
    const atoms = chemAtoms(preset), charge = chemCharge(preset);
    /* TWO STAGES, ONE SEQUENCE NUMBER.  The ground state lands first — the molecule appears on the field, the
       ORBITALS register gets its ladder, the readouts fill — and the spectrum follows, because it is the roots
       that cost the seconds.  Both replies are guarded by the same `solveSeq`: a reply for a molecule the hand has
       already left behind must not publish.  `solve()` itself resolves only when the roots are in, so every caller
       that awaits it (the gate included) still gets the whole answer. */
    const seq = ++solveSeq, msg = { op: 'chem.ground', atoms, basis, charge, symmetry: P.symmetry, ...(P.multiplicity > 1 ? { multiplicity: P.multiplicity } : {}), ...(method !== 'rhf' ? { model: method } : {}) };   // 0.7.1: U1's multiplicity, U2's METHOD UHF on H₂; 0.7.3: LDA (K1's model)
    const rec = method === 'rhf' && P.records && P.records[basis];   // a record is an RHF solve: UHF and LDA always solve live
    status(rec && (P.recordOnly || wantRef || have.get(rec.hash)) ? `opening ${P.name} from its record… ${P.nAO} AOs, ${P.nElectrons} electrons`
      : method === 'lda' ? `solving ${P.name} by RKS LDA… ${P.nAO} AOs, ${P.nElectrons} electrons on a ${(atoms.length * 22650).toLocaleString('en')}-point grid`
      : basis === 'sto-3g' ? `solving ${P.name}… ${P.nAO} AOs, ${P.nElectrons} electrons, ~${showMs(P.predictedMs)} predicted`
      : `solving ${P.name} in 6-31+G*… ${big.nAO} Cartesian AOs, ${P.nElectrons} electrons — up to a few seconds at the 46-AO cap`, 'warn');
    if (api.loading) api.loading(true);
    /* THE RECORD ROAD (0.4.0 S4a · PLAN B2).  A molecule whose record this device holds opens from it — the worker's chem.open,
       zero solver calls, chem.ground's own reply — and so does one past the cap (DOWNLOAD: fetched, checked against its sha-256
       name and kept) or one a project or link names (`wantRef`: the exact record when this device still holds it, else the
       catalogue's, the orbital then found by its name).  Under the cap, a record that cannot be had is the live solve; past it
       there is no live solve, and the row says what refused.  `why` is the sentence; `note` rides on the status line. */
    let why = null, note = fell;
    const viaRecord = async () => {
      const exact = wantRef && wantRef.hash !== rec.hash && await installed(wantRef.hash), hash = exact ? wantRef.hash : rec.hash;
      const net = P.recordOnly || !!wantRef, o = P.recordOnly ? optOf(P.id) : null;
      if (press && net && !have.get(hash)) persistOnce().then(storageNote);      // the user's install press: persist() asked once (lab/library.js)
      const got = await fetchRecord(hash, { network: net, onProgress: (n, t) => {
        const pc = t ? Math.round(100 * n / t) + ' %' : Math.round(n / 1024) + ' KB';
        if (seq === solveSeq) status(`downloading ${P.name}'s record… ${pc}`, 'warn');
        if (o) o.textContent = optionLabel(P, false).replace('DOWNLOAD', 'downloading ' + pc); } });
      if (!got.record) { why = `${P.name}'s record is not open: ${got.why}` + (P.recordOnly ? ' — it opens only from its record (DOWNLOAD when the network is back)' : ''); lamps(); return null; }
      if (got.from === 'network') lamps();
      if (seq !== solveSeq) return null;   /* S4a-VERIFY B1: the hand has moved on while the record was read — an abandoned chem.open would replace the worker's ONE cache */
      const m = { op: 'chem.open', lib: got.record, hash, basis };
      const r = await call(m, () => here(basis).then((W) => { try { return W.chemOpen(m); } catch (e) { return { refused: String(e && e.message || e) }; } }));
      if (!r || r.refused) { why = (r && r.refused) || `${P.name}'s record did not open`; return null; }
      if (wantRef && hash !== wantRef.hash) { pendingKey = pendingKey || wantRef.nameKey || null; note = 'the project named an older record; this is the current one, its orbital found by name'; }
      r.opened = { bytes: got.bytes, from: got.from }; r.stem = got.record.stem || null;   // 0.5.1 D2: the head of a record-opened molecule is its stem's
      return r;
    };
    const first = () => (rec ? viaRecord() : Promise.resolve(null)).then((r) => {
      if (r || P.recordOnly) return r;
      if (seq !== solveSeq) return null;   /* S4a-VERIFY B1: the same law for a live solve — never post for a molecule the hand has left */
      if (why) note = why.replace(/ —.*$/, '') + ': solved live';
      return call(msg, () => localSolve(msg));
    });
    const task = Promise.all([first(), loadMS()]).then(([r]) => {        // M8: the record module lands with the first solve
      if (seq !== solveSeq) return null;
      /* 0.5.3 M2 · a failed open (C₆₀'s record offline) gives the dropdown BACK before the solution goes: the last solved molecule
         is chosen again (or, with none, nothing), so a hand re-pick of the one that failed is a change and is answered */
      if (!r || r.error || !Number.isFinite(r.energy)) { if (sol) { preset = sol.key.split('|')[0]; mSeg.set(preset); } else mSel.selectedIndex = -1;
        sol = null; status(why || 'solve failed: ' + ((r && (r.refused || r.error)) || 'no answer'), 'warn'); refresh(); tell(); notify(); return null; }
      /* 0.3.1 · S4: the defaults this landing fills (the orbital, and through notify() the register's selection and the STATES
         ground lane — one task, probes/S4/chem-fill-timing.js) belong to the history row that asked for the solve */
      const fill = () => {
        r.key = key; r.seq = seq; r.note = note;
        r.identity = MS ? MS.identityOf({ atoms, basisHash: r.hash, charge, multiplicity: P.multiplicity || 1, model: r.model || 'RHF' }) : null;   // 0.5.4 P1: DATA, never a stamp (R13)
        land(r);
      };
      if (api.derived) api.derived(fill); else fill();
      if (r.roots || r.model) return r;                                      // the frame-thread fallback answers whole; an open shell has no spectrum (0.7.1)
      if (seq !== solveSeq) return null;                                       // S4a-VERIFY B1: no stale spectrum post either
      return call({ op: 'chem.spectrum', atoms, basis, charge }, () => Promise.resolve(null)).then((s) => {
        if (seq !== solveSeq || sol !== r) return null;
        if (!s || s.error || !s.roots) { status((s && s.refused) || 'spectrum failed: ' + ((s && s.error) || 'no answer'), 'warn'); return r; }
        sol.roots = s.roots; sol.tda = s.tda; sol.timings = s.timings || sol.timings;
        refresh(); return r;
      });
    }).catch((e) => { if (seq === solveSeq) { sol = null; status('solve failed: ' + String(e && e.message || e), 'warn'); refresh(); } return null; })
      .finally(() => { if (pending && pending.key === key) pending = null; if (seq === solveSeq && api.loading) api.loading(false); });
    pending = { key, p: task };
    return task;
  }
  /* ── V2 · A VOLUME'S MOLECULE: the .lwm (lab/volumes.js, sha-256 checked) parsed once, each rung opened by THE RECORD ROAD's chem.open with its
     ground.hash under the same `seq` law.  `network: false` is a project's road (installed only, else the sentence, no solve) ── */
  async function openVolume(volId, molId, want = null, { hand = true, network = true, on: turnOn = true, sha = null } = {}) {
    const seq0 = ++volSeq, same = (v) => v && v.volume === volId && v.id === molId;
    let v = same(volRef) ? volRef : same(volKeep) ? volKeep : null;
    if (!v) {
      status(`opening ${molId} from ${volId}…`, 'warn'); if (api.loading) api.loading(true);
      let idx = null, m = null;
      try {
        idx = await V.index(volId); m = idx.molecules.find((x) => x.id === molId);
        if (!m) throw new Error(`there is no ${molId} in ${volId}`);
        let buf = null, from = 'device';
        try { buf = await V.file(volId, molId, { network: false }); } catch (e) { if (!network) throw e; buf = await V.file(volId, molId); from = 'network'; }
        const lwm = parseLwm(buf), H = lwm.header;
        v = { key: volId + ':' + molId, volume: volId, id: molId, numeral: idx.numeral, lwm, meta: H.meta, name: H.meta.name || molId, charge: H.meta.charge || 0,
          atoms: H.geometry.atoms.map((a) => ({ Z: +a.Z, x: +a.x, y: +a.y, z: +a.z })), geometry: H.geometry.source || '', rungs: Object.keys(H.rungs),
          why: { ...(H.skipped || {}), ...(H.failed || {}) }, sha256: m.sha256 || null, bytes: buf.byteLength, from };
      } catch (e) {
        if (seq0 === volSeq) { if (api.loading) api.loading(false);
          status(network ? String(e && e.message || e) : `${String((m && m.name) || molId).toUpperCase()} · VOL. ${(idx && idx.numeral) || volId} is not on this device — install it in the PICKER's LIBRARY`, 'warn'); }
        return null;
      }
      if (seq0 !== volSeq) return null;                                      // a later pick has moved on while the file was read
    }
    v.note = sha && v.sha256 && sha !== v.sha256 ? 'the project named an older file of this molecule; this is the current one' : null;
    const b = want && v.rungs.includes(want) ? want : v.rungs[0];
    if (want && b !== want) v.note = `${volName(v)} has no ${BASIS_LABEL[want] || want} rung (${v.why[want] || 'not in the file'}): opened at ${BASIS_LABEL[b]}`;
    volRef = volKeep = v; volWant = null; preset = v.key; basis = b; bSeg.set(b); fillSel(); mSeg.set(v.key);
    const p = solve(v.key, { press: hand });
    if (turnOn && !on) setOn(true);
    const r = await p; if (r && hand && api.hand) api.hand(preset);
    readHolds(); return r;
  }
  /** the volume road of solve(): the rung's record through chem.open, kept and landed exactly as a library record is */
  function volSolve({ force = false } = {}) {
    const v = volRef;
    if (!v.rungs.includes(basis)) basis = v.rungs[0];
    bSeg.set(basis); paintBasis(); method = 'rhf'; methodsVol();
    const key = v.key + '|' + basis + '|' + v.charge;
    if (!force && sol && sol.key === key) { refresh(); return Promise.resolve(sol); }
    if (!force && pending && pending.key === key) return pending.p;
    setRun(false); rt = null; spec = null; fit = null; fitErr = null; selected = null; if (vibOn) setVib(false);
    const seq = ++solveSeq, lib = rungRecord(v.lwm, basis), m = { op: 'chem.open', lib, hash: lib.ground.hash, basis };
    status(`opening ${volName(v)} at ${BASIS_LABEL[basis]} from its record… ${lib.ground.nAO} AOs, ${lib.ground.electrons} electrons`, 'warn');
    if (api.loading) api.loading(true);
    const task = Promise.all([call(m, () => here(basis).then((W) => { try { return W.chemOpen(m); } catch (e) { return { refused: String(e && e.message || e) }; } })), loadMS()]).then(([r]) => {
      if (seq !== solveSeq) return null;
      if (!r || r.refused || r.error || !Number.isFinite(r.energy)) { sol = null; status(`${volName(v)} at ${BASIS_LABEL[basis]} did not open: ` + ((r && (r.refused || r.error)) || 'no answer'), 'warn'); refresh(); tell(); notify(); return null; }
      r.opened = { bytes: v.bytes, from: v.from }; r.stem = lib.stem || null; r.volume = { volume: v.volume, id: v.id, numeral: v.numeral };
      const fill = () => { r.key = key; r.seq = seq; r.note = v.note; v.note = null;
        r.identity = MS ? MS.identityOf({ atoms: v.atoms, basisHash: r.hash, charge: v.charge, multiplicity: 1, model: 'RHF' }) : null; land(r); };
      if (api.derived) api.derived(fill); else fill();
      return r;
    }).catch((e) => { if (seq === solveSeq) { sol = null; status('open failed: ' + String(e && e.message || e), 'warn'); refresh(); } return null; })
      .finally(() => { if (pending && pending.key === key) pending = null; if (seq === solveSeq && api.loading) api.loading(false); });
    pending = { key, p: task };
    return task;
  }
  function methodsVol() { const b = mthS.button('lda'); mthS.button('uhf').style.display = 'none'; mthS.button('rhf').textContent = 'RHF'; b.disabled = true; b.title = b.dataset.help = VOL; mthS.set('rhf'); }
  const stem = (k) => k.replace(/\|(uhf|lda)$/, '');   // a solve's key without its METHOD: the molecule, basis, charge and H₂'s stretch
  /** a landing: `r` goes on stage and is kept beside this molecule's other solves (Δ LDA−RHF reads the pair) */
  function land(r) {
    kept = new Map([...kept].filter(([k]) => stem(k) === stem(r.key))); kept.set(r.key, r);
    sol = r; mBuf = oBuf = dBuf = dRef = vibSh = null; fieldHash = null;
    const named = keyed(r.names, pendingKey);
    orbital = named ? named.k : (Number.isFinite(pendingOrbital) && pendingOrbital >= 1 && pendingOrbital <= r.nAO) ? pendingOrbital : r.nocc;
    pendingOrbital = pendingKey = null;
    rebuildOrbKnob(); standDown(); pushField(); refresh(); tell(); notify(); symmetryLine(sol.D, 'still'); vibSay(); vibLand();
  }
  /* Δ LDA−RHF: the pair [LDA, RHF] of this molecule when both are kept; asked for in VIEW (a project, a verb) with one missing, the other is solved quietly */
  const pair = () => { const s = sol && stem(sol.key), L = s && kept.get(s + '|lda'), R = s && kept.get(s); return L && R && L.D && R.D ? [L, R] : null; };
  let asked = null;
  function partner() { const s = sol, k = stem(s.key) + (method === 'lda' ? '' : '|lda'); if (view !== 'dlda' || pair() || volRef || ldaWhy(PRESET_BY_ID.get(preset)) || s.model === 'UHF') return false; if (asked === s) return true; asked = s;
    return !!call({ op: 'chem.ground', atoms: chemAtoms(preset), basis, charge: chemCharge(preset), ...(method === 'lda' ? {} : { model: 'lda' }) }).then((r) => { if (r && r.D && sol === s) { r.key = k; kept.set(k, r); views(); pushMatrix(); refresh(); tell(); } }); }
  /* THE ORBITAL DIAL'S RANGE IS THE BASIS'S, so the dial is rebuilt with the molecule rather than clamped after
     the fact.  The handle is a `let` and is REASSIGNED: kit.js's knob() publishes `get shown()`, so copying the new
     widget's members over the old object throws "setting getter-only property" in a module's strict mode — which
     is exactly how the first H₂O solve failed, silently, inside the promise chain. */
  /* 0.4.0 S4c · A FRONTIER RECORD (C₆₀) carries columns of C and no D: the dial spans the columns it carries and Δρ refuses with a
     sentence (no reference).  0.6.1 F1: where those columns hold every occupied index DENSITY is the FACTOR road, ρ = 2 Σ_k φ_k² */
  const span = () => (sol && sol.cols ? [sol.cols[0] + 1, sol.cols[sol.cols.length - 1] + 1] : [1, sol ? sol.nAO : 7]);
  const noSpectrum = (r) => !!(r && r.record && !r.record.caps.rpa);
  const factor = () => !!(sol && !sol.D && sol.cols && sol.cols[sol.nocc - 1] === sol.nocc - 1);   // ascending, so cols[0 … nocc) = 0 … nocc − 1
  const ORB_ONLY = 'this record carries orbital columns, not the density matrix this view needs', vTitle = new Map(['density', 'diff', 'esp', 'spin', 'dlda'].map((id) => [id, vSeg.button(id).title]));
  function views() { for (const [id, t] of vTitle) { const d = id === 'spin' ? !!(sol && sol.Ds) : id === 'dlda' ? !!pair() : !!(sol && (sol.D || (id === 'density' && factor()))), b = vSeg.button(id); b.disabled = !d;
    b.title = d ? t : id === 'spin' ? 'a closed shell has no spin density: ρα = ρβ' : id === 'dlda' ? 'both solves of this molecule first: METHOD LDA, and RHF is kept beside it' : ORB_ONLY;
    if (!d && view === id && !(id === 'dlda' && partner())) { view = id === 'spin' || id === 'dlda' ? 'density' : 'orbital'; vSeg.set(view); } } }
  vSeg.button('spin').disabled = vSeg.button('dlda').disabled = true;   // SPIN lights only on a UHF solve, Δ LDA−RHF on a kept pair (views())
  const uhf = () => !!sol && sol.model === 'UHF', lda = () => !!sol && sol.model === 'RKS LDA', nel = () => (uhf() ? sol.nocc + sol.nBeta : 2 * sol.nocc);   // UHF: nocc is nα
  /* 0.7.1 · AN OPEN SHELL STANDS THE CLOSED-SHELL ROADS DOWN: KICK, RUN, FLOW, PULSE, TDA and VIBRATE take the kit's disabled look and say why (the worker refuses them too); 0.7.3: so does RKS LDA, each with its sentence */
  const OPEN = 'open shell (UHF): the real-time run, TDA, the drive and the register are closed-shell roads in this cut', openNote = el('div', 'note', more); openNote.hidden = true; more.insertBefore(openNote, r2);
  let stood = '';                                                         // a closed shell never touches a control's help
  function standDown() { const o = sol.volume ? VOL : !sol.model ? '' : uhf() ? OPEN : 'RKS LDA: the real-time run, TDA, the drive, the register and VIBRATE stand down — their operators are RHF\'s'; if (o === stood) return; stood = o; openNote.hidden = !o; openNote.textContent = o; if (o) { setRun(false); if (flowOn) setFlow(false); if (vibOn) setVib(false); }
    for (const b of [kickT.root, runSw.root, flowSw.root, tdaSw.root, vibSw.root, ...pSeg.root.querySelectorAll('button')]) { b.dataset.help0 ??= b.dataset.help || b.title || ''; b.disabled = !!o; b.title = b.dataset.help = !o ? b.dataset.help0 : sol.volume ? VOL : uhf() ? OPEN : b === tdaSw.root ? LDA_TDA : b === vibSw.root ? LDA_VIB : LDA_RT; } }
  function rebuildOrbKnob() {
    views();
    const [lo, n] = span(), k = Math.min(Math.max(lo, orbital || lo), n);
    const help = orbKnob.root.dataset.help || 'The molecular orbital index, ascending in ε; HOMO by default';
    const next = knob({ label: 'ORBITAL', min: lo, max: n, value: k, title: help,
      fmt: (v) => orbFmt(Math.round(v)), onInput: (v) => { orbital = Math.round(v); if (view === 'orbital') pushMatrix(); refresh(); } });
    orbKnob.root.replaceWith(next.root); orbKnob = next;
    seats();
  }

  /* ── the real-time run ────────────────────────────────────────────────────────────────────────── */
  function kick() {
    if (!sol || sol.model || sol.volume) { if (sol) status(sol.volume ? VOL : uhf() ? OPEN : LDA_RT, 'warn'); return Promise.resolve(null); }   // 0.7.1: never a closed-shell RT run of an open shell (0.7.3: nor of an LDA solve)
    const seq = solveSeq;
    /* SYNTHESIS decision 2: the card's MMUT is UNRESTARTED, and 0 is how that is spelled on the wire.  It was
       never sent before, so the engine took its own default of 50 while this window said "unrestarted". */
    return call({ op: 'chem.rt.init', atoms: chemAtoms(preset), basis, charge: chemCharge(preset), dt, integrator, kick: { axis, kappa }, restartEvery: RESTART_EVERY, factors: flowOn,
      pulse: pulse === 'none' ? null : { shape: pulse, omega: (bright().find((k) => k.f > 1e-3) || {}).omega || 0 } }).then((r) => {   // 0.7.0 V1 PULSES
      if (seq !== solveSeq) return null;
      if (!r || r.error || !r.ok) { status('kick failed: ' + ((r && (r.refused || r.error)) || 'no real-time engine'), 'warn'); if (r && r.refused) setRun(false); return null; }
      rt = { t: r.t || 0, D_re: r.D_re || null, D_im: r.D_im || null, F: factorsOf(r), electrons: r.electrons, idempotency: r.idempotency || 0, energy: r.E0, E0: r.E0, trace: [], samples: 1, steps: 0, msPerStep: 0,
        restartEvery: r.restartEvery, restartPolicy: r.restartPolicy, sinceRestart: r.sinceRestart || 0 };
      spec = null; fit = null; fitErr = null;
      pushMatrix(true);                                        // Δρ's reference IS the kicked t = 0
      refresh(); symmetryLine(rt.D_re, 'RUN'); return r;
    });
  }
  function reset() {
    setRun(false); rt = null; spec = null; fit = null; fitErr = null;
    if (sol) call({ op: 'chem.rt.reset' }).then(() => { pushMatrix(); refresh(); symmetryLine(sol && sol.D, 'still'); });
    else refresh();
  }
  function setRun(v) {
    const next = !!v && !!sol;
    if (next === running) { if (runSw.get() !== next) runSw.set(next); return running; }
    running = next; runSw.set(running); if (running && vibOn) setVib(false);
    /* the RUN switch IS the tdhf model's claim: while it is up the run outranks the register and the still card,
       and when it goes down the session hands the field to whoever is next, in one place, by rank */
    if (S()) S().claim('tdhf', running, 'MOLECULES RT RUN is propagating the density');
    if (running && !rt) kick();
    refresh(); return running;
  }
  /** one outstanding propagation request at a time — the frame loop asks, the worker answers when it can */
  function pump() {
    if (!running || inflight || !rt || !sol) return;
    inflight = true; const seq = solveSeq;
    call({ op: 'chem.rt.run', steps: speed, factors: flowOn }).then((r) => {
      inflight = false;
      if (seq !== solveSeq || !rt) return;
      if (!r || r.error) { status('real time stopped: ' + ((r && r.error) || 'no answer'), 'warn'); setRun(false); return; }
      rt.t = r.t; rt.electrons = r.electrons; rt.idempotency = r.idempotency; rt.energy = r.energy;
      rt.steps = r.steps || rt.steps; rt.msPerStep = r.msPerStep;   // `steps` is the worker's CUMULATIVE count
      if (r.restartPolicy) { rt.restartPolicy = r.restartPolicy; rt.sinceRestart = r.sinceRestart; }
      if (r.D_re) rt.D_re = r.D_re; if (r.D_im) rt.D_im = r.D_im; rt.F = factorsOf(r);
      rt.samples = r.samples || rt.samples; append(r.trace);
      pushMatrix(); requestSpectrum(); refresh(); if (r.D_re && symDue()) symmetryLine(rt.D_re, 'RUN');
    }).catch(() => { inflight = false; });
  }
  /** the fit's own copy of the trace, capped at its window; the worker keeps the authoritative one */
  function append(tr) { if (!tr || !rt) return; for (let i = 0; i < tr.length && rt.trace.length < FIT_CAP; i++) rt.trace.push(tr[i]); }
  /** the transform is the worker's (it holds the trace); throttled to ~2 Hz, one in flight.
   *  2026-09-24 · ONE IN FLIGHT, AND NO FASTER THAN IT COSTS (optimization LB5, AUDIT-F F4).  The transform covers the
   *  whole accumulated trace and shares the worker's one queue with chem.rt.run, so once it cost more than its 500 ms
   *  cadence the queue alternated spectrum / run and the moving field got one batch per spectrum (557 → 27 steps/s at
   *  125 k samples).  A request now waits for the last one to land, and the cadence is max(500 ms, 4 × the last round
   *  trip) — the reader law's own rule.  Every spectrum shown is still absorb.js of the whole trace; a forced request
   *  (a KICK AXIS change, the end of a scripted run) still posts at once. */
  let specBusy = 0, specRtt = 0;
  function requestSpectrum(force) {
    if (!sol || !rt || (rt.samples || 0) < 16) return;
    const nowMs = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    if (!force && (specBusy || nowMs - lastSpec < Math.max(500, 4 * specRtt))) return;
    lastSpec = nowMs;
    const seq = ++specTask, tau = Math.max(10, (rt.samples || rt.trace.length) * dt / 12);
    specBusy = seq;
    call({ op: 'chem.rt.spectrum', dt, kappa, tau, wMin: 5e-4, wMax: W_MAX }).then((r) => {
      if (specBusy === seq) { specBusy = 0; specRtt = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - nowMs; }
      if (seq !== specTask || !r || r.error || !r.omega) return;
      spec = { omega: r.omega, S: r.S, ImAlpha: r.ImAlpha, peaks: r.peaks || [], tau };
      refit(); paint();
    }).catch(() => { if (specBusy === seq) specBusy = 0; });
  }
  /* THE POLES ARE FITTED, NOT PICKED (decision 4).  R ≈ 1550 grid points over a handful of poles, throttled to 2 s, and
     the only road to the certificate.  2026-09-24 · IN THE CHEM WORKER (optimization LB5, AUDIT-F F4): it cost the frame
     thread 125–153 ms every 2 s on a long run.  The card sends the window it has always fitted — a copy of its own
     ≤ FIT_CAP samples — with the same options, so the poles and the certificate are the same doubles (mathworker.js
     chemRtFit); one fit at a time; an answer for a run the card has since left is dropped; a browser with no Worker fits
     here, as before. */
  let fitBusy = false;
  const fitWire = (F) => ({ poles: F.poles, certified: !!F.certified(CERT), bound: F.bound, epsilon: F.epsilon, sigma: F.sigma,
    refusal: F.refusal ? F.refusal(CERT) : null, raw: F.raw });
  function refit() {
    const nowMs = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    if (fitBusy || !spec || !rt || rt.trace.length < 400 || nowMs - lastFit < 2000) return;
    lastFit = nowMs;
    const init = bright().filter((k) => k.omega > 0.05 && k.omega < W_MAX).slice(0, 6).map((k) => k.omega).sort((a, b) => a - b);
    if (!init.length) return;
    const run = rt, trace = Float64Array.from(rt.trace), opts = { dt, kappa, tau: spec.tau, init, wMin: 0.05, wMax: W_MAX };
    const local = () => import('./response-fit.js').then(({ fitPoles }) => {
      try { return fitWire(fitPoles(Float64Array.from(trace), opts)); } catch (e) { return { fitError: String(e && e.message || e) }; } });
    fitBusy = true;
    call({ op: 'chem.rt.fit', trace, cert: CERT, ...opts }, local).then((r) => {
      fitBusy = false;
      if (!spec || rt !== run || !r) return;
      if (r.fitError !== undefined) { fit = null; fitErr = r.fitError; }
      else { fit = { poles: r.poles, certified: r.certified, bound: r.bound, epsilon: r.epsilon, sigma: r.sigma, refusal: r.refusal, raw: r.raw }; fitErr = null; }
      paint();
    }).catch(() => { fitBusy = false; });
  }

  /* ── the field: THIS WINDOW IS A PRODUCER, lab/molecular-session.js is the owner ───────────────────────────────
   * Two models come from here, and the session decides which of them (or the ORBITALS register) is playing:
   *   'ground'  the still molecule — its density, one canonical orbital, or the difference against the reference
   *   'tdhf'    the real-time run, which outranks everything while it propagates
   * Nothing in this file calls the field directly any more, so nothing here depends on when the frame loop runs it.
   */
  const S = () => api.session || null;
  /* 0.6.5 X2 · ESP: the worker's Φ volume (`chem.esp`, X1's pump) OWNS the field as a CARD once it lands — signed, so READ as 'real'; while it computes
     the view drawn before stays (`was`).  The card goes when VIEW leaves ESP, another model publishes, or the molecule is re-uploaded or dropped. */
  let esp = null, was = 'density';                                       // esp: { card, N, min, max, ms, of: the solve it was computed from }
  const espOn = () => view === 'esp' && !!esp && esp.of === sol, drawn = () => (view !== 'esp' ? view : espOn() ? 'density' : was);
  const molView = () => (espOn() || ['orbital', 'diff', 'spin', 'dlda'].includes(drawn()) ? 'real' : 'density');   // a signed Δρ (and SPIN's ρα − ρβ) is READ as 'real': two-colour lobes
  const sgn = (x) => (x < 0 ? '−' : '+') + Math.abs(x).toFixed(2);
  function onEsp(r) {                                                     // the pump's consumer: the reply { N, half, phi, min, max, ms } becomes the card
    if (!r || !r.phi || view !== 'esp' || !sol) return false;
    const cap = 4 * Math.abs(r.min) || 1, data = r.max > cap ? Float32Array.from(r.phi, (v) => (v > cap ? cap : v)) : r.phi;   // the nuclei's Z/r peaks are tens of a.u.: shown clipped at +4|min| so the lone pairs read; the numbers are not
    esp = { card: { N: r.N, half: r.half, data }, N: r.N, min: r.min, max: r.max, cap: r.max > cap ? cap : null, ms: r.ms, of: sol };
    pushMatrix(); refresh(); tell(); return true;
  }
  let scripted = false;                       // chem.run(n) is propagating: the tdhf model's products, whichever road asked
  const model = () => (running || scripted ? 'tdhf' : 'ground');
  const product = { kind: 'density', matrix: null, view: 'density', hash: null, solution: -1 };   // ONE record, reused: the frame loop allocates nothing
  function pushField() {
    const s = S(); if (!s) return false;
    if (!on || !sol) { if (fieldHash !== null) { s.drop(); fieldHash = null; } return false; }
    /* the hash is recorded only if the session ACTUALLY took the molecule: a browser with no WebGPU device must
       not end up believing it owns a volume that was never uploaded, and never try again */
    if (fieldHash !== sol.hash) {
      if (!s.adopt({ hash: sol.hash, nAO: sol.nAO, half: sol.half, shells: sol.shells }, sol.seq)) return false;
      fieldHash = sol.hash;
    }
    return pushMatrix();
  }
  function pushMatrix(ref) {
    const s = S(); if (!s || !on || !sol || fieldHash === null) return false;
    if (ref) captureRef();
    if (view !== 'esp') was = view;
    product.hash = sol.hash; product.solution = sol.seq; product.view = molView();
    const v = drawn();
    if (v === 'orbital') { product.kind = 'orbital'; product.matrix = orbitalColumn(); }
    else if (v === 'diff') { product.kind = 'signed'; product.matrix = deltaD(); }
    else if (v === 'spin') { product.kind = 'signed'; product.matrix = sol.ds32 || (sol.ds32 = Float32Array.from(sol.Ds)); }   // 0.7.1 VIEW SPIN: Dα − Dβ, the Δρ road
    else if (v === 'dlda') { const p = pair(); if (!p) return false; product.kind = 'signed'; product.matrix = p[0].dl32 && p[0].dlOf === p[1] ? p[0].dl32 : (p[0].dlOf = p[1], p[0].dl32 = Float32Array.from(p[0].D, (x, i) => x - p[1].D[i])); }   // 0.7.3 K2: D_LDA − D_RHF in f64, once per pair
    else if (!sol.D) { product.kind = 'factor'; product.matrix = factorCols(); }
    else { product.kind = 'density'; product.matrix = densityRe(); }
    const ok = s.publish(model(), product);
    if (espOn()) s.card(esp.card); else if (view === 'esp') { if (typeof espPump === 'function') espPump(); } else if (esp) { s.card(null); esp = null; }   // espPump: X1's (0.6.5), its reply lands in onEsp
    if (ok && flowOn) feedFlow();
    return ok;
  }
  /* ── FLOW for the real-time run (stage 6): the TDHF density matrix carries a current too ───────────────────
     Re D is the whole density; Im D is NEGATED on the way in, because density.js keeps D_μν = Σ c_μ c̄_ν and the flow
     evaluator is written for ⟨a†_μ a_ν⟩ = its transpose-conjugate.  (MO-REGISTRY's packet has no such seam: it hands ψ itself,
     `setPacket`, and builds no D.  Nor do THE FACTORS, iteration 005 P2: the worker's factorsOf covers the seam once, where they are made.)
     A still molecule has Im D = 0 and no flow.
     BALANCED's Re Ḋ is the difference of the two latest landings over their Δt: centred half a landing behind the D it repairs.
     P2 · THE FACTORS: while FLOW is on each landing carries P(t)'s eigenpairs (mathworker factorsOf) and the tracers ride them, O(n·K) a point;
     these dense matrices stay for `pump`, REPAIR's road.  The two latest landings' factors are THE CONTINUITY RECORD's (continuityOn, the
     cards worker, ≤ 2 Hz): ∂ρ/∂t and the full 3-D ∇·j on PLANE's sample — every 4th point of its N², h its own spacing. */
  let flowOn = false, flow = null, flowRe = null, flowIm = null, flowEpoch = 0, flowSrc = 'computed', flowDot = null, flowT = null, dotOK = false, flowF = [], planeKey = '', planePts = null, conP = null;
  const factorsOf = (r) => (r.F_w ? { w: r.F_w, re: r.F_re, im: r.F_im, sum: r.F_sum } : null);
  const paintFlow = () => { if (!flow) return; const w = flow.said(); roRep.set(w[0]); roRep.setSub(w[1]); roGate.set(w[2]); roGate.setSub(w[3]); srcSeg.root.title = flowMod.FLOW_ORACLE[preset] || ''; paintContinuity(); };
  /** the plane payload for the worker: PLANE's own geometry (rotor, mode, EXTENT) at a quarter of its N, h its own spacing, the two latest landings, the nuclei */
  function planeOf() {
    const S = api.plane && api.plane(), [a, b] = flowF;
    if (!S || !b || !(b.t > a.t)) return null;
    const N = Math.max(8, S.res >> 2), k = `${S.mode}|${S.half}|${N}|${S.rotor.qL}|${S.rotor.qR}|${sol.hash}`;
    if (k !== planeKey) { planeKey = k; planePts = planePoints(S.rotor, { mode: S.mode, half: S.half, N }); }
    return { pts: planePts, h: 2 * S.half / S.res, dt: b.t - a.t, F0: a, F1: b, nuclei: chemAtoms(preset).flatMap((q) => [q.x, q.y, q.z]) };
  }
  /** the tile: the number, its sub, and the residual's sign on the plane (ACCENT A where ∂ρ/∂t + ∇·j > 0, B where < 0, alpha √(|r|/max)) — or one sentence */
  function paintContinuity() {
    const P = flow && flow.plane, F = rt && rt.F, why = !sol ? '' : sol.volume ? 'a volume molecule has no run (its record carries no integrals): no current to check' : sol.model ? sol.model + ': no real-time run in this cut, so no current to check'
      : !rt ? 'a still molecule: ∂ρ/∂t = 0 and j = 0 — KICK and RUN first' : !P ? 'RUN: the record needs two landings' : '';
    roCon.root.hidden = !flowOn;
    if (why || !flowOn) { conP = null; roCon.set('—'); roCon.setSub(why); conCv.width = 0; return; }
    if (P === conP) return; conP = P;
    roCon.set(P.defect.toFixed(3));
    roCon.setSub(roCon.root.title = `the finite-basis defect — an identity only in a complete basis · ${P.M} points (PLANE's sample, every 4th) · ${Math.round(100 * P.core)} % of the residual² within 0.3 a₀ of a nucleus · ${P.ms.toFixed(0)} ms`
      + (F ? ` · K ${F.w.length} factors, Σw ${F.sum.toFixed(6)} beside Tr(DS) ${(+rt.electrons).toFixed(6)}` : ''));
    const N = Math.round(Math.sqrt(P.M)), W = conCv.clientWidth || 240, Hh = 112, d = Math.min(2, window.devicePixelRatio || 1), A = accentRGB(conG, 1), B = accentRGB(conG, 2);
    let mx = 0; for (let k = 0; k < P.M; k++) mx = Math.max(mx, Math.abs(P.r[k]));
    const img = new ImageData(N, N); for (let k = 0; k < P.M; k++) { const v = P.r[k], c = v > 0 ? A : B, i = ((N - 1 - Math.floor(k / N)) * N + (k % N)) * 4; img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = Math.round(255 * Math.sqrt(Math.abs(v) / (mx || 1))); }
    const tmp = document.createElement('canvas'); tmp.width = tmp.height = N; tmp.getContext('2d').putImageData(img, 0, 0);
    conCv.width = Math.round(W * d); conCv.height = Hh * d; conG.setTransform(d, 0, 0, d, 0, 0); conG.imageSmoothingEnabled = false; conG.drawImage(tmp, (W - Hh) / 2, 0, Hh, Hh);
  }
  function feedFlow() {
    if (!sol || !flowMod) return;
    const n = sol.nAO;
    if (!flow || flow.n !== n || flowHash !== sol.hash) { flow = flowMod.createFlow(sol.shells, api.balance); flow.setSource(flowSrc); flowRe = new Float64Array(n * n); flowIm = new Float64Array(n * n); flowDot = new Float64Array(n * n); flowT = null; dotOK = false; flowHash = sol.hash; flowEpoch++; }
    const re = (rt && rt.D_re) || sol.D, im = rt && rt.D_im, t = rt ? rt.t : 0, dt = flowT === null ? 0 : t - flowT, F = rt && rt.F;
    for (let i = 0; i < n * n; i++) { if (dt > 0) flowDot[i] = (re[i] - flowRe[i]) / dt; flowRe[i] = re[i]; flowIm[i] = im ? -im[i] : 0; }
    if (dt) dotOK = dt > 0; if (dt || flowT === null) flowT = t; flow.set(flowRe, flowIm);
    if (F) { flow.setFactors(F.w, F.re, F.im); if (!flowF.length || flowF[flowF.length - 1].t !== t) { flowF.push({ ...F, t }); if (flowF.length > 2) flowF.shift(); } } else flowF = [];
    flow.setFloor(0, F ? 'f64 factors' : 'f32 D');   // P2: max(1e-7, 10 × the measured error of the ρ the tracers read) — both roads' errors are relative (P2-BUILD.md), so neither raises it
    flow.time = t;                              // the run keeps its OWN clock: the tracers ride rt.t, not the transport's
    flow.pump(Number.isFinite(sol.half) ? sol.half : 10.3, () => (dotOK ? flowDot : null), paintFlow, planeOf);
    paintContinuity();
  }
  let flowMod = null, flowHash = null;
  /* 0.6.5 X1 · THE POTENTIAL's volume: one chem.esp in flight on the cards queue, the newest D asked next (H1's pump shape); only where THE PROBE is (≤ 46 AOs: the cost is nAO² × 64³) */
  let espBusy = false, espD = null, espLast = null;
  function espPump() {
    const D = (rt && rt.D_re) || (sol && sol.D);
    if (!D || espBusy || D === espD || !sol.probe) return;
    espBusy = true; espD = D;
    Promise.resolve(api.balance({ op: 'chem.esp', N: 64, half: Number.isFinite(sol.half) ? sol.half : 10.3, shells: sol.shells, D, atoms: sol.probe })).then((r) => {
      espBusy = false; if (!r || r.error || !r.phi) return; espLast = r; onEsp(r);   // 0.6.5: the reply becomes the card (X2's consumer)
    }, () => { espBusy = false; });
  }
  function setFlow(v) {
    flowOn = !!v; if (flowSw) flowSw.set(flowOn); fr.hidden = roCon.root.hidden = !flowOn;
    if (flowOn && !flowMod) import('./molecular-flow.js').then((m) => { flowMod = m; if (flowOn) { feedFlow(); api.repaint(); } });
    else if (flowOn) feedFlow();
    tell(); api.repaint(); return flowOn;
  }
  function densityRe() {
    const n = sol.nAO, src = vibD || (rt && rt.D_re) || sol.D, P = valence ? corePart() : null;
    if (!P && src instanceof Float32Array && src.length === n * n) return src;
    if (!mBuf || mBuf.length !== n * n) mBuf = new Float32Array(n * n);
    for (let i = 0; i < n * n; i++) mBuf[i] = P ? src[i] - P[i] : src[i];
    return mBuf;
  }
  let fac = null, facOf = null;                                          // the FACTOR road's columns, f32 n × K, once per solve and VALENCE
  const coreK = () => (valence ? Math.min(coreCount(chemAtoms(preset)), sol.nocc) : 0);
  function factorCols() {   // the occupied columns k ≥ coreK(): VALENCE is these columns only — exact, no subtraction
    const n = sol.nAO, k0 = coreK(), K = sol.nocc - k0;
    if (facOf === sol && fac.K === K) return fac;
    const C = new Float32Array(n * K); for (let i = 0; i < n; i++) for (let k = 0; k < K; k++) C[i * K + k] = sol.C[i * n + k0 + k];
    fac = { C, K }; facOf = sol; return fac;
  }
  const summed = () => (factor() && view === 'density' ? (valence ? `${sol.nocc - coreK()} valence orbitals summed · ${coreK()} core frozen` : `${sol.nocc} orbitals summed`) : '');
  let coreP = null, coreOf = null;                                       // VALENCE's subtrahend 2 Σ_core C_c C_cᵀ, f64, once per solve
  function corePart() {
    if (coreOf === sol) return coreP;
    const n = sol.nAO, C = sol.C, nc = Math.min(coreCount(chemAtoms(preset)), sol.nocc); coreP = new Float64Array(n * n); coreOf = sol;
    for (let c = 0; c < nc; c++) for (let i = 0; i < n; i++) { const a = 2 * C[i * n + c]; if (a) for (let j = 0; j < n; j++) coreP[i * n + j] += a * C[j * n + c]; }
    return coreP;
  }
  /* ── Δρ, AND WHY IT IS A MATRIX DIFFERENCE AND NOT A VOLUME DIFFERENCE (2026-09-18) ────────────────────────────
   * DIFF used to upload ρ(t) and ρ_ref as two rgba16float volumes of √ρ and subtract them in the fragment shader.
   * An 11-bit mantissa on √ρ is about 1e-3 relative on ρ, and a κ = 1e-3 δ-kick moves ρ by about 1e-3 relative —
   * so the picture was at best the same size as the format's own noise, and at κ = 1e-4 it was ten times under it.
   * ΔD = Re D(t) − D_ref is formed HERE, in f64, and uploaded ONCE as a signed matrix: the quantisation then lands
   * on the difference itself and not on the two large numbers it came from.  The reference is the matrix at the
   * moment REF was taken (the kick, or switching to DIFF on a still molecule), kept in f64 beside it. */
  function captureRef() {
    const n = sol.nAO, src = vibD || (rt && rt.D_re) || sol.D;
    if (!dRef || dRef.length !== n * n) dRef = new Float64Array(n * n);
    for (let i = 0; i < n * n; i++) dRef[i] = src[i];
  }
  function deltaD() {
    const n = sol.nAO, src = vibD || (rt && rt.D_re) || sol.D;
    if (!dRef || dRef.length !== n * n) captureRef();                    // no reference yet: this instant IS the reference, Δ ≡ 0
    if (!dBuf || dBuf.length !== n * n) dBuf = new Float32Array(n * n);
    for (let i = 0; i < n * n; i++) dBuf[i] = src[i] - dRef[i];
    return dBuf;
  }
  function orbitalColumn() {
    const n = sol.nAO, k = Math.min(Math.max(0, (orbital || sol.nocc) - 1), n - 1);
    if (!oBuf || oBuf.length !== n) oBuf = new Float32Array(n);
    for (let i = 0; i < n; i++) oBuf[i] = sol.C[i * n + k];
    return oBuf;
  }

  /* ── the readouts and the header ──────────────────────────────────────────────────────────────── */
  const status = (t, cls) => { statusText = t; if (api.status) api.status(t, cls === undefined ? '' : cls); };
  /* PLAN B2's iPad law: after an install press the persisted answer and the quota are SHOWN, never assumed */
  let stored = '';
  const storageNote = (i) => { stored = !i ? '' : (i.persisted ? 'persisted' : i.safariTab ? 'a Safari tab: kept until the browser clears it — add λWAVES to the Home Screen to keep it' : 'not persisted')
    + (Number.isFinite(i.usage) && Number.isFinite(i.quota) ? ` · ${(i.usage / 1048576).toFixed(1)} of ${Math.round(i.quota / 1048576)} MB used` : ''); if (sol) refresh(); };
  function refresh() {
    if (!sol) { for (const r of [roE, roEps, roTr, roIdem, roT, roSym]) r.set('—', ''); h2Note.hidden = probeLine.hidden = roXc.root.hidden = true; paint(); return; }
    const pr = (sol.probe || []).map((a) => a.sym + ' ' + a.phiEl.toFixed(2).replace('-', '−')), many = (t) => pr.filter((v) => v === t).length;   // THE PROBE: three or more alike are one ×n
    probeLine.hidden = !pr.length; probeLine.textContent = 'Φ at nuclei · ' + [...new Set(pr)].map((t) => (many(t) > 2 ? t + ' ×' + many(t) : Array(many(t)).fill(t).join(' · '))).join(' · ') + ' a.u. · exact';
    /* Slater–Condon: σg² and σu² differ by two orbitals, so the 1-RDM has no cross term and ±b share it; ⟨H⟩ differs by 4abK */
    h2Box.hidden = h2Note.hidden = !(preset === 'H2' && basis === 'sto-3g');
    if (!h2Note.hidden && h2Note.dataset.k !== sol.key) {
      const A = chemAtoms(preset), R = Math.hypot(A[1].x - A[0].x, A[1].y - A[0].y, A[1].z - A[0].z), m = sto3gH2(R), a = m.ciVector[0], b = m.ciVector[3], K = m.gMO[5], d = 4 * Math.abs(a * b) * K;   // gMO[5] = (σgσu|σgσu)
      h2Note.dataset.k = sol.key; h2Note.innerHTML = `<b>Hidden correlation.</b> Two states share one density and one current: <m>a|σg²⟩ + b|σu²⟩</m> and <m>a|σg²⟩ − b|σu²⟩</m> differ by two orbitals, so every one-body observable is blind to the sign of <m>ab</m>; their energies differ by <m>4|ab|K</m> = ${d.toFixed(4)} Eh — ${m.fci.toFixed(6)} (the full CI) and ${(m.fci + d).toFixed(6)} Eh, with a ${a.toFixed(4)}, b ${b.toFixed(4)}, K ${K.toFixed(4)} at R ${R.toFixed(4)} bohr (lab/h2ci.js).`; h2Read();
    }
    roE.set(sol.energy.toFixed(9), 'ok');
    const P = volRef ? { name: volName(volRef), source: volRef.geometry } : PRESET_BY_ID.get(preset) || {};
    roE.setSub(`${P.name} · ${BASIS_LABEL[basis] || basis.toUpperCase()} · E_nuc ${Number(sol.Enuc).toFixed(6)}` + (sol.local ? ' · on the frame thread (no worker)' : ''));
    roE.root.title = (P.source || '') + ' — a FIXED geometry, never optimised by this window';
    const eH = sol.eps[sol.nocc - 1], eL = sol.eps[sol.nocc];
    roEps.set(`${eH.toFixed(6)} · ${Number.isFinite(eL) ? eL.toFixed(6) : '—'}`, '');
    const nmH = orbitalName(sol.names, sol.nocc - 1, sol.nocc), nmL = orbitalName(sol.names, sol.nocc, sol.nocc);
    roEps.setSub((uhf() ? 'the α set · ' : lda() ? 'Kohn–Sham · ' : '') + `${nmH}${Number.isFinite(eL) ? ' · ' + nmL : ''} · gap ${Number.isFinite(eL) ? (eL - eH).toFixed(6) : '—'} hartree · ${sol.nocc} occupied of ${sol.nAO}`
      + (sol.names && sol.names.group ? ` · ${sol.names.reliable ? sol.names.group : 'no names: ' + sol.names.reason}` : ''));
    const ne = rt ? rt.electrons : (Number.isFinite(sol.electrons) ? sol.electrons : nel());
    roTr.set(Number(ne).toFixed(10), Math.abs(ne - nel()) < 1e-8 ? 'ok' : 'warn');
    roTr.setSub('Tr(DS), never a voxel sum · ' + nel() + ' electrons' + (uhf() ? ` · ${sol.nocc} α ${sol.nBeta} β · ⟨S²⟩ ${sol.s2.toFixed(4)}` : ''));
    roIdem.set(rt ? Number(rt.idempotency).toExponential(2) : '—', rt && rt.idempotency < 1e-8 ? 'ok' : rt ? 'warn' : '');
    /* THE POLICY IN FORCE, NOT THE ONE WE MEANT.  This line used to say "unrestarted MMUT" while the engine
       restarted every 50 steps, which is a different trajectory; it now prints what chem.rt.init came back with. */
    roIdem.setSub(rt ? `‖P² − P‖ · ${integrator === 'mmut' ? 'MMUT, ' + (rt.restartPolicy || 'policy unknown') : 'Magnus-2'} · Δt ${dt}` : 'kick to begin');
    roT.set(rt ? Number(rt.t).toFixed(3) : '—', running ? 'live' : '');
    roT.setSub(rt ? `${rt.samples || rt.trace.length} samples · E ${Number(rt.energy).toFixed(6)} · ΔE ${(rt.energy - rt.E0).toExponential(2)}` + (rt.msPerStep ? ` · ${Number(rt.msPerStep).toFixed(2)} ms/step` : '') : '');
    const tm = sol.timings || {};
    roXc.root.hidden = !lda(); if (lda()) { roXc.set(`${sol.exc.toFixed(6)} · ${sol.intRho.toFixed(6)}`, Math.abs(sol.intRho - nel()) < 1e-3 ? 'ok' : 'warn');
      roXc.setSub(`E_xc (Eh) · ∫ρ on the grid, ${nel()} electrons · ${sol.gridPoints.toLocaleString('en')} points in ${Math.round(sol.gridMs)} ms · SCF ${sol.converged ? `converged in ${sol.iterations} iterations to |ΔE| < 1e-10` : `not converged after ${sol.iterations} iterations`}, ${Math.round(tm.scf - tm.integrals - sol.gridMs)} ms`); }
    /* `ground` is the whole ground-state wall and `integrals` is the pass INSIDE it, measured by the pass itself */
    status(`${sol.nAO} AOs · ${nel()} electrons` + (sol.model ? ' · ' + sol.model : '')
      + (Number.isFinite(tm.scf) ? ` · ground ${Math.round(tm.scf)} ms` : '')
      + (Number.isFinite(tm.integrals) ? ` (integrals ${Math.round(tm.integrals)} of it)` : '')
      + (Number.isFinite(tm.rpa) ? ` · rpa ${Math.round(tm.rpa)} ms` : summed() ? ' · ' + summed() : noSpectrum(sol) ? ' · orbitals only' : sol.model ? (uhf() ? ' · no spectrum (open shell)' : ' · no spectrum (RKS LDA)') : sol.roots ? '' : ' · spectrum pending')
      + (sol.opened ? ` · from its record (${Math.round(sol.opened.bytes / 1024)} KB, ${sol.opened.from === 'device' ? 'on this device' : 'downloaded'}) in ${tm.open} ms, no solver call` + (stored ? ' · ' + stored : '') : '')
      + (sol.note ? ' · ' + sol.note : '') + (view !== 'esp' ? '' : espOn() ? ` · ESP ${esp.N}³ in ${Math.round(esp.ms)} ms` : ' · ESP computing…') + (running ? ' · running' : ''), running ? 'live' : 'ok');
    paint();
  }

  /* 0.5.4 P4 · THE STATUS of what this card puts on stage (lab/status.js): built on a landing, a VIEW change, a FLOW toggle or a load and KEPT — never in a frame */
  function tell() { const P = volRef ? { records: { [basis]: { oracle: rungRec().oracle, status: { energy: 'IMPORTED' }, geometry: volRef.meta.app ? null : 'computed' } } } : PRESET_BY_ID.get(preset), row = (!lda() && (P.records || {})[basis]) || null; said = sol ? statusOf({ record: row, sol, oracle: lda() ? (LDA_E[preset] ? { what: 'PySCF RKS lda,vwn', energy: LDA_E[preset] } : null) : row ? null : basis === 'sto-3g' ? P.oracle : (P.oracle && P.oracle[basis]) || null, view: flowOn ? 'flow' : view, esp: espOn() ? esp : null, label: summed() && 'DENSITY · exact · ' + summed() }) : null; if (api.said) api.said(said); }
  /* 0.6.1 F2 · THE SYMMETRY CERTIFICATE (names.js symmetryDefects) once per landing of a density — the still, the kick, RUN's D(t) and the
     register's D₀ + ΔD (`certify`) at ≤ 5 Hz, never in a frame; kept ε < 1e-9 · broken > 1e-6 · nearly between; the catalogue's group and frame */
  let symAt = 0; const symDue = () => { const t = performance.now(); return t - symAt >= 200 && !!(symAt = t); }, gsub = (g) => g.replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[d]);
  const num = (x) => (x >= 1e-3 ? String(+x.toPrecision(2)) : x.toExponential(0).replace(/e-(\d+)/, (_, e) => '·10⁻' + e.replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])));
  function symmetryLine(D, src) {
    const sym = (volRef ? rungRec().input.symmetry : PRESET_BY_ID.get(preset).symmetry) || { group: 'C1' }, g = sym.group, say = (v, line, cls = '') => { roSym.set(v, cls); roSym.setSub(line); };
    if (!sol || !D || g === 'C1') return say(sol && D ? 'C₁' : '—', sol && D ? 'C1 · no symmetry declared' : '');
    let ops; try { ops = symmetryDefects({ atoms: chemAtoms(preset), shells: sol.shells, D, group: g, frame: sym.frame }); } catch (e) { return say(gsub(g), String(e.message || e), 'warn'); }
    if (!ops.length) return say(gsub(g), 'declared · no table');
    const kept = ops.filter((o) => o.eps < 1e-9), bad = ops.filter((o) => o.eps > 1e-6), h = ops.length, k = kept.length, o2 = k === 2 && kept[1].name;
    const worst = Math.max(...ops.map((o) => o.eps)), lo = Math.min(...bad.map((o) => o.eps)), near = h - k - bad.length;
    say(k === h ? gsub(g) : !bad.length ? `nearly ${gsub(g)} (ε = ${num(worst)})` : src === 'RUN' ? `broken by ${num(lo)} after the kick` : k === 1 ? 'C₁' : o2 ? (/σ/.test(o2) ? 'Cs' : o2 === 'i' ? 'Ci' : 'C₂') : `${k} of ${h} kept`,
      `${src} · ` + (k === h ? `${h} of ${h} kept · worst ${num(worst)}` : `{${[...new Set(kept.map((o) => o.name))].join(', ')}} kept` + (bad.length ? ` · ${bad.length} broken ≥ ${num(lo)}` : '') + (near ? ` · ${near} nearly` : '')), k === h ? 'ok' : bad.length ? 'warn' : '');
  }
  /* ── the plot ─────────────────────────────────────────────────────────────────────────────────── */
  const bright = () => (sol && sol.roots ? sol.roots : []);
  /** the ladder on screen: the RPA roots, or the TDA ladder in its own order with its own strengths */
  const ladder = () => (tda ? (sol && sol.tda ? sol.tda : []) : bright());
  const wOf = (k) => k.omega;
  /** the polarisation of a root: the axis carrying most of |μ|² */
  const polOf = (k) => { const m = k.mu || [0, 0, 0]; let b = 0; for (let q = 1; q < 3; q++) if (m[q] * m[q] > m[b] * m[b]) b = q; return AXES[b]; };
  const dominantOf = (k) => {
    const d = (k.dominant || [])[0];
    return d ? `${d.i + 1}→${d.a + 1} (X ${d.x.toFixed(3)}, Y ${d.y.toFixed(3)})` : '—';
  };
  /* A LINE NAMES ITS OWN LADDER.  The TDA number printed beside an RPA root is the k-th TDA ROOT BY INDEX and not
     that root's partner — the matching by character is an open problem (JUDGMENT.md §8.3), so it is not implied. */
  const infoOf = (k, i) => (tda
    ? `ω_TDA ${k.omega.toFixed(9)} · f_TDA ${k.f.toFixed(6)} · ${polOf(k)} · TDA root ${i + 1}`
    : `ω_RPA ${k.omega.toFixed(9)} · f ${k.f.toFixed(6)} · ${polOf(k)} · dominant ${dominantOf(k)}`
      + (Number.isFinite(k.omegaTDA) ? ` · TDA root ${i + 1} (by index, not this root's partner) ${k.omegaTDA.toFixed(9)}` : ''));

  let rect = null, coreRect = null;
  const hover = graphHover(cv, { repaint: () => paint(), plot: () => rect });
  const coreHover = graphHover(cvCore, { repaint: () => paint(), plot: () => coreRect });
  cv.addEventListener('click', () => { const h = hover.hit(); if (h && h.root) pick(h.root, h.index); });
  cvCore.addEventListener('click', () => { const h = coreHover.hit(); if (h && h.root) pick(h.root, h.index); });
  /* THE REGISTER's TWO HOOKS (stage 3).  `popOf(K)` lights a TDA stick with the STATES register's |b_K|² while that
     register is the model playing; `pickHook(K)` tells it a TDA stick was clicked, which is how a stick is PLAYED.
     Both speak TDA indices only: an RPA root has no partner in the register (JUDGMENT.md §8.3). */
  let popOf = null, pickHook = null;
  function pick(k, i) { if (tda && pickHook && Number.isInteger(i)) pickHook(i); selected = k; roPick.set(`ω ${wOf(k).toFixed(6)} · f ${k.f.toFixed(6)}`, k.f > 1e-6 ? 'ok' : ''); roPick.setSub(infoOf(k, i || 0)); paint(); }

  const size = (canvas, ctx) => {
    const W = canvas.clientWidth, H = canvas.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (W < 32 || H < 24) return null;
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    return { W, H };
  };
  /* OPTIMIZATION 2026-09-24 · N8: both canvases sit in this card, and a CLOSED or hidden card is `display: none
     !important` (mir base.css): size() would read 0 and return null for each — after forcing the document's style +
     layout, which at construction (a first visit ships MOLECULES closed) was the boot's next full flush in the chain lane
     M measured.  The reveal road is unchanged: graphHover's ResizeObserver on each canvas repaints once it has a size,
     and setActive(true) paints. */
  const shown = () => cv.isConnected && !cv.closest('[hidden], .dev.closed');
  function paint() { if (!shown()) return; paintMain(); if (core) paintCore(); if (h2T && !h2Box.hidden) drawCurve(h2Cv, h2T, h2K.get()); }
  function paintMain() {
    const s = size(cv, g); if (!s) return;
    const { W, H } = s, L = 42, Rt = W - 8, Tp = 12;
    g.font = '8px ui-monospace, monospace';
    const CAP = sol ? `${tda ? 'TDA' : 'RPA'} sticks, h ∝ f · Im α from the ${axis} kick`
      + (noSpectrum(sol) ? ' · no spectrum in its record' : sol.model ? (uhf() ? ' · no spectrum: an open shell' : ' · no spectrum: TDA and RPA are RHF\'s') : sol.roots ? '' : ' · spectrum pending')
      + (fit ? (fit.certified ? ` · ▲ poles, 4ε/σ = ${fit.bound.toExponential(1)}` : ` · ▽ raw maxima, UNCERTIFIED`) : spec ? ' · fitting…' : ' · kick and RUN')
      : 'no molecule solved';
    const caps = wrap(g, CAP, Rt - L);
    /* the ω tick row gets its OWN 10 px: the caption's baselines and the labels' tops were 2 px apart on a
       150 px canvas and the two ran through each other (measured at three caption lines). */
    const Bt = H - 6 - caps.length * 9 - 10;
    const T = themeInk(g);
    rect = { x0: L, y0: Tp, x1: Rt, y1: Bt };
    const x = (w) => L + (w / W_MAX) * (Rt - L);
    const roots = ladder().map((k, i) => ({ k, i })).filter(({ k }) => wOf(k) >= 0 && wOf(k) <= W_MAX);
    let fMax = 0; for (const { k } of roots) fMax = Math.max(fMax, k.f);
    let aMax = 0; if (spec) for (let i = 0; i < spec.ImAlpha.length; i++) if (spec.omega[i] <= W_MAX) aMax = Math.max(aMax, Math.abs(spec.ImAlpha[i]));
    const hovers = [];
    /* the axis, and the frame the sticks stand on */
    g.strokeStyle = T.ink(0.4); g.lineWidth = 1; g.beginPath(); g.moveTo(L, Bt); g.lineTo(Rt, Bt); g.stroke();
    g.font = '8px ui-monospace, monospace'; g.fillStyle = T.ink(0.75); g.textBaseline = 'top';
    for (let w = 0; w <= W_MAX + 1e-9; w += 0.4) { const px = x(w);
      g.strokeStyle = T.ink(0.18); g.beginPath(); g.moveTo(px, Tp); g.lineTo(px, Bt); g.stroke();
      if (w > 0) fitText(g, w.toFixed(1), px, Bt + 2, { x0: 2, y0: 0, x1: W - 2, y1: H }, 'center'); }   // the origin's label is the gutter's axis name
    g.textAlign = 'right'; g.textBaseline = 'middle';
    fitText(g, 'Im α', L - 4, Tp + 6, { x0: 2, y0: 0, x1: W - 2, y1: H }, 'right');
    fitText(g, 'ω  Eh', L - 4, Bt + 8, { x0: 2, y0: 0, x1: W - 2, y1: H }, 'right');
    /* Im α(ω) — the measured curve, in the accent, under the sticks so a line never hides a root */
    if (spec && aMax > 0) {
      const acc = accentRGB(g, 1);
      g.strokeStyle = `rgba(${acc[0]},${acc[1]},${acc[2]},0.92)`; g.lineWidth = 1.4; g.beginPath();
      let pen = false, pts = [];
      for (let i = 0; i < spec.omega.length; i++) { const w = spec.omega[i]; if (w > W_MAX) break;
        const px = x(w), py = Bt - Math.abs(spec.ImAlpha[i]) / aMax * (Bt - Tp) * 0.94;
        pts.push(px, py); if (!pen) { g.moveTo(px, py); pen = true; } else g.lineTo(px, py); }
      g.stroke();
      if (pts.length >= 4) hovers.push({ kind: 'curve', key: 'imalpha', points: pts, lw: 1.4, colour: `rgb(${acc.join(',')})`,
        info: `Im α_${axis}${axis}(ω) · δ-kick trace, ${rt ? (rt.samples || rt.trace.length) : 0} samples · τ = ${spec.tau.toFixed(1)} · peak ${aMax.toExponential(3)}` });
    }
    /* the sticks: the kicked axis in its own ink at full weight, the others thin — a dark root still gets a foot */
    for (const { k, i } of roots) {
      const pol = polOf(k), px = x(wOf(k)), mine = pol === axis;
      const rgb = mine ? accentRGB(g, 2) : vividInk(nRGB(AXIS_N[pol]));
      const hgt = fMax > 0 ? Math.max(2, k.f / fMax * (Bt - Tp) * 0.88) : 2;
      g.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${mine ? 0.95 : 0.5})`; g.lineWidth = mine ? 2 : 1;
      g.beginPath(); g.moveTo(px, Bt); g.lineTo(px, Bt - hgt); g.stroke();
      const hit = { kind: 'line', key: 'stick-' + wOf(k).toFixed(6) + pol, points: [px, Bt - hgt, px, Bt], lw: mine ? 3 : 2,
        colour: `rgb(${rgb.join(',')})`, info: infoOf(k, i), root: k, index: i };
      hovers.push(hit);
      if (tda && popOf) { const p = popOf(i); if (p > 1e-6) { g.fillStyle = T.fg(0.92); g.beginPath(); g.arc(px, Bt - hgt, 2 + 5 * Math.sqrt(p), 0, 2 * Math.PI); g.fill(); } }   // the register's population on this state
      if (selected && selected === k) { g.fillStyle = T.fg(0.95); g.beginPath(); g.arc(px, Bt - hgt, 2.6, 0, 2 * Math.PI); g.fill(); }
    }
    /* the fitted poles, or the raw maxima when the certificate refuses */
    const marks = fit ? (fit.certified ? fit.poles.map((p) => ({ w: p.omega, up: true, txt: `fitted pole ${p.omega.toFixed(7)} · amplitude ${p.amplitude.toExponential(3)} · bias ${Number(p.bias || 0).toExponential(2)} · certified to ${fit.bound.toExponential(2)}` }))
      : (fit.raw || []).map((p) => ({ w: p.omega, up: false, txt: `raw maximum ${p.omega.toFixed(7)} · UNCERTIFIED (4ε/σ = ${fit.bound.toExponential(2)} > ${CERT.toExponential(0)})${fit.refusal ? ' · ' + fit.refusal : ''}` })))
      : [];
    for (const m of marks) {
      if (!(m.w >= 0 && m.w <= W_MAX)) continue;
      const px = x(m.w), col = m.up ? T.fg(0.9) : T.ink(0.8);
      g.fillStyle = col; g.beginPath();
      if (m.up) { g.moveTo(px, Bt - 3); g.lineTo(px - 3, Bt + 3); g.lineTo(px + 3, Bt + 3); } else { g.moveTo(px, Bt + 3); g.lineTo(px - 3, Bt - 3); g.lineTo(px + 3, Bt - 3); }
      g.closePath(); g.fill();
      hovers.push({ kind: 'dot', key: 'fit-' + m.w.toFixed(6), x: px, y: Bt, r: 4, colour: String(col), info: m.txt });
    }
    if (fitErr) { g.fillStyle = T.ink(0.85); g.textAlign = 'left'; g.textBaseline = 'top'; fitText(g, 'fit declined: ' + fitErr, L + 4, Tp + 2, rect, 'left', true); }
    g.font = '8px ui-monospace, monospace'; g.fillStyle = T.ink(0.8); g.textBaseline = 'alphabetic';
    caps.forEach((t, i) => fitText(g, t, L, H - 3 - (caps.length - 1 - i) * 9, { x0: 4, y0: 0, x1: W - 4, y1: H }, 'left', true));
    hover.set(hovers, rect);
  }
  /* THE CORE INSET (answer 11): its own amplitude scale, off by default, badged for what it is */
  function paintCore() {
    const s = size(cvCore, gc); if (!s) return;
    const { W, H } = s, L = 42, Rt = W - 8, Tp = 10, Bt = H - 18;
    const T = themeInk(gc);
    coreRect = { x0: L, y0: Tp, x1: Rt, y1: Bt };
    const x = (w) => L + (w - CORE_LO) / (CORE_HI - CORE_LO) * (Rt - L);
    const roots = ladder().map((k, i) => ({ k, i })).filter(({ k }) => wOf(k) >= CORE_LO && wOf(k) <= CORE_HI);
    let fMax = 0; for (const { k } of roots) fMax = Math.max(fMax, k.f);
    gc.strokeStyle = T.ink(0.4); gc.lineWidth = 1; gc.beginPath(); gc.moveTo(L, Bt); gc.lineTo(Rt, Bt); gc.stroke();
    gc.font = '8px ui-monospace, monospace'; gc.fillStyle = T.ink(0.75); gc.textBaseline = 'top'; gc.textAlign = 'center';
    for (let w = CORE_LO; w <= CORE_HI + 1e-9; w += 0.5) fitText(gc, w.toFixed(1), x(w), Bt + 2, { x0: 2, y0: 0, x1: W - 2, y1: H }, 'center');
    const hovers = [];
    for (const { k, i } of roots) {
      const pol = polOf(k), px = x(wOf(k)), rgb = vividInk(nRGB(AXIS_N[pol]));
      const hgt = fMax > 0 ? Math.max(2, k.f / fMax * (Bt - Tp) * 0.8) : 2;
      gc.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.9)`; gc.lineWidth = 1.6;
      gc.beginPath(); gc.moveTo(px, Bt); gc.lineTo(px, Bt - hgt); gc.stroke();
      hovers.push({ kind: 'line', key: 'core-' + wOf(k).toFixed(6), points: [px, Bt - hgt, px, Bt], lw: 3, colour: `rgb(${rgb.join(',')})`, info: infoOf(k, i), root: k, index: i });
    }
    gc.fillStyle = T.ink(0.85); gc.textBaseline = 'top';
    fitText(gc, 'core 19–21 Eh · Δt diagnostic', 6, Tp, { x0: 2, y0: 0, x1: W - 2, y1: H }, 'left', true);
    if (!roots.length) fitText(gc, 'no root in 19–21 Eh for this molecule', L, (Tp + Bt) / 2, { x0: 2, y0: 0, x1: W - 2, y1: H }, 'left', true);
    coreHover.set(hovers, coreRect);
  }
  function wrap(ctx, txt, room) {
    const out = []; let ln = '';
    for (const word of String(txt).split(' ')) { const nx = ln ? ln + ' ' + word : word; if (ln && ctx.measureText(nx).width > room) { out.push(ln); ln = word; } else ln = nx; }
    if (ln) out.push(ln); return out;
  }

  /* ── the frame, the field-owner switch, and the saved state ───────────────────────────────────── */
  function update(t) { if (!on) return; pump(); if (view === 'esp') espPump(); if (vibFr && sol) vibPose(t); }
  /* 0.7.0 V1 · VIBRATE: on/off, the mode, the amplitude (× Q₀); the record decoded once a molecule; ONE chem.vib.frames in flight, the newest asked next */
  async function setVib(v, k = vibK, a = vibAmp) {
    const row = !volRef && PRESET_BY_ID.get(preset).vibrate, was = vibOn; vibK = k | 0; vibAmp = Math.min(4, Math.max(0, +a || 0));
    vibOn = !!(v && row && sol && sol.D && basis === 'sto-3g' && !sol.model); vibSw.set(vibOn); if (v && !vibOn && sol && (sol.model || sol.volume)) { status(sol.volume ? VOL : uhf() ? OPEN : LDA_VIB, 'warn'); return false; }
    if (!vibOn) { vibFr = vibD = vibAt = null; vibJ = -1; if (was && S() && sol && S().pose(model(), sol.shells)) pushMatrix(); if (v) status(row ? 'VIBRATE plays the STO-3G record of a solved molecule' : 'no modes recorded for this molecule', 'warn'); vibSay(); tell(); return false; }
    setRun(false);
    if (!vib || vib.id !== preset) { const got = await fetchRecord(row.hash, { network: true }); if (!vibOn) return false; if (!got.record) { status('VIBRATE: the mode record did not open — ' + got.why, 'warn'); return setVib(false); }
      vib = decodeVibrate(got.record); vibSh = null; modeStep.setItems(vib.name.map((nm, j) => ({ id: String(j), label: `${nm} ${Math.round(vib.omega[j])} cm⁻¹ · ${vib.irrep[j]}` }))); }
    vibK = Math.min(vibK, vib.K - 1); modeStep.set(String(vibK)); vibAsk(); vibSay(); tell(); return true;
  }
  function vibAsk() {
    if (!vibOn || !vib) return; if (vibBusy) { vibAgain = true; return; }
    const k = vibK, seq = solveSeq; vibBusy = true;
    call({ op: 'chem.vib.frames', basis, vib, k, amp: vibAmp, K: 32 }).then((r) => { vibBusy = false;
      if (r && r.refused) status(r.refused, 'warn'); else if (r && r.D && seq === solveSeq && vibOn) { vibFr = { D: r.D, dipole: r.dipole, q: r.q, k }; vibJ = -1; api.repaint(); }
      if (vibAgain) { vibAgain = false; vibAsk(); } }, () => { vibBusy = false; });
  }
  const vibW = () => vib.omega[vibK] / 219474.6313632, flash = () => { const fps = api.fps(), w = aliasOf([0, vibW()], api.clock.rate, fps >= 10 ? Math.round(fps) : 60); return w && w.alias > FLASH_HZ ? w : null; };
  /** the frame: j = round(K·frac(ωt/2π)) — held at Q = 0 (j = K/4) when the breath would flash — the shells moved to R₀ + Q·L and D[j] published */
  function vibPose(t) {
    const K = vibFr.q.length, held = flash(), j = held ? K / 4 : Math.round(K * ((vibW() * t / (2 * Math.PI)) % 1 + 1)) % K;
    if (j === vibJ && api.clock.rate === vibRate) return; vibJ = j; vibRate = api.clock.rate;
    const Q = vibFr.q[j], o = 3 * vib.atoms.length * vibFr.k, n = sol.nAO, L = vib.L;
    vibAt = vib.atoms.map((a, i) => ({ Z: a.Z, x: a.x + Q * L[o + 3 * i], y: a.y + Q * L[o + 3 * i + 1], z: a.z + Q * L[o + 3 * i + 2] }));
    if (!vibSh) vibSh = sol.shells.map((s) => ({ ...s, center: s.center.slice(), at: vib.atoms.findIndex((a) => a.x === s.center[0] && a.y === s.center[1] && a.z === s.center[2]) }));
    for (const s of vibSh) { const a = vibAt[s.at]; s.center[0] = a.x; s.center[1] = a.y; s.center[2] = a.z; }
    vibD = vibFr.D.subarray(j * n * n, (j + 1) * n * n); if (S() && S().pose(model(), vibSh)) pushMatrix(); vibSay(held);
  }
  function vibSay(held = vibOn && vib && flash()) {
    const row = !volRef && PRESET_BY_ID.get(preset).vibrate, w = vibOn && vib ? vibW() : 0; rVib.classList.toggle('off', !row);
    roVib.set(!w ? (row ? '—' : volRef ? VOL : 'no modes recorded for this molecule') : `${vib.name[vibK]} ${Math.round(vib.omega[vibK])} cm⁻¹ · ${vib.irrep[vibK]} · ${vibAmp.toFixed(1)} Q₀ = ${(vibAmp * vib.q0[vibK]).toFixed(3)} bohr · T ${Math.round(2 * Math.PI / w)} a.u. · `
      + (held ? `held: ${held.alias.toFixed(1)} Hz at this RATE, above ${FLASH_HZ} a second — RATE ≤ ${Math.floor(2 * Math.PI * FLASH_HZ / w)} breathes` : `${(w * api.clock.rate / (2 * Math.PI)).toFixed(1)} Hz on screen`) + (vibAmp > 2 ? ' · not harmonic here' : ''));
  }
  async function breathe() { if (!(await setVib(true))) return false; api.breathe(Math.min(3000, 2 * Math.PI / vibW())); return true; }   // one breath a second: always under the flash law
  const vibLine = (tail = '') => (vibOn && vib ? `${vib.name[vibK]} ${Math.round(vib.omega[vibK])} cm⁻¹ · ${vib.irrep[vibK]} at ${vibAmp.toFixed(1)} Q₀${tail}` : null);
  const vibLand = () => { const p = pendingVib; pendingVib = null; if (p && sol) { ampKnob.set(Math.min(4, Math.max(0, +p.amp || 0))); setVib(true, p.mode, p.amp); } };
  function setOn(v) {
    on = !!v; if (onSw.get() !== on) onSw.set(on);
    if (!on) { setRun(false); if (vibOn) setVib(false); if (S() && fieldHash !== null) { S().drop(); fieldHash = null; } }
    api.setOn(on);
    /* the claim is the whole handover: ON asks the session for the field (and it asserts this card's observable
       even before the solve lands, as the old fieldView() call did), OFF lets go and the session restores the
       observable the user had before any molecule took it */
    if (S()) S().claim('ground', on, 'MOLECULES has the field: the card’s own view');
    if (on && sol) pushField();
    else if (on) solve(preset);
    return on;
  }
  const presentation = () => ({ preset: volRef ? catPreset : preset, basis: volRef && !LIVE.has(basis) ? 'sto-3g' : basis, view, orbital, axis, kappa, speed, dt, integrator, tda, core, valence, on, ...(vibOn ? { vibrate: { mode: vibK, amp: vibAmp } } : {}), ...(pulse !== 'none' ? { pulse } : {}), ...(preset === 'H2' && (h2R || method === 'uhf') ? { h2: { R: h2R || R0, method: method === 'uhf' ? 'uhf' : 'rhf' } } : {}), ...(method === 'lda' ? { method } : {}) });   // 0.7.3 K2: `method` only for LDA (UHF stays H₂'s h2.method)
  /* ── THE SAVED STATE, and the one place this window departs from its commission ──────────────────────────────
   * save() returns THE PRESENTATION ONLY, not lab/molecule-state.js's record.  Two reasons, both in the tree:
   *   · rack.js:5048's law — "Solver caches, traces, collisions, particles and pulse runs do not [belong to the
   *     composition]" — and serializeMolecule's schema REQUIRES rhf.C and rhf.D, which for benzene is 2 × 36²
   *     numbers, about 50 kB of JSON in every project AND in every undo record that carries a presentation.
   *   · the molecule is fully determined by (preset, basis, charge), all three of which ARE saved, and the worker
   *     caches its solve on exactly that key — so reopening a project re-derives the same state for free.
   * The record is still built, validated and handed out by `record()` below for the callers it is FOR: a state
   * link, a fixture, an export.  load() accepts one through restoreMolecule so a file that carries it still opens.
   */
  let MS = null, msLoad = null;
  /* OPTIMIZATION 2026-09-24 · M8: the record module (and its five chemistry imports, ~88 KB) is fetched on the FIRST
     solve — every road into one: prepare(), setOn, the dropdown, the basis control, __LW.chem.solve — or when a file
     carries a full record, instead of on every boot.  record() answers null until a solve exists, and a solve now
     waits for this import before it publishes, so record() is never null after one where it was not before. */
  const loadMS = () => msLoad || (msLoad = import('./molecule-state.js').then((m) => { MS = m; }).catch(() => { MS = null; }));
  /** THE LIBRARY REFERENCE a project holds (PLAN B2: { id, hash, nameKey } — PROJECT, one history row per change of molecule;
      the record itself is device content and never rides in a file): the record in use, else the one the opened project named,
      else the catalogue's — and `nameKey` is the orbital's S1 name, the portable half for when the hash has moved on. */
  function save() {
    const o = presentation(), vw = volRef ? { volume: volRef.volume, id: volRef.id, basis, sha256: volRef.sha256 } : volWant;
    if (vw) { o.volume = { ...vw }; return o; }                                   // V2: the volume molecule on screen (or the one a project named, still to open) — never `library`
    const P = PRESET_BY_ID.get(preset), rec = P && P.records && P.records[basis];
    if (!rec) return o;
    const mine = sol && sol.key === preset + '|' + basis + '|' + chemCharge(preset);
    o.library = { id: preset, hash: mine && sol.record ? sol.record.hash : wantRef ? wantRef.hash : rec.hash,
      nameKey: mine ? orbitalKey() : wantRef ? wantRef.nameKey || null : null };
    return o;
  }
  /** the chosen orbital as its S1 name { group, irrep, count, member }; null when none is chosen or named */
  function orbitalKey() { const N = sol && sol.names, mo = N && N.reliable && Number.isFinite(orbital) ? N.mos[orbital - 1] : null; return mo && mo.irrep ? { group: N.group, irrep: mo.irrep, count: mo.count, member: mo.member || null } : null; }
  /** the canonical lab/molecule-state.js record of what is on screen — validated by serializeMolecule, or null */
  function record() {
    if (!MS || typeof MS.serializeMolecule !== 'function' || !sol) return null;
    try {
      return MS.serializeMolecule({ atoms: chemAtoms(preset), charge: chemCharge(preset),
        basis: { name: basis, version: '1', hash: sol.hash },
        rhf: { energy: sol.energy, eps: sol.eps, C: sol.C, D: sol.D },
        presentation: { view, orbital: Number.isFinite(orbital) ? orbital - 1 : null, showCore: core } });
    } catch (e) { return { error: String(e && e.message || e) }; }
  }
  function load(o = {}) {
    /* a file that DOES carry the full record gets it validated here; a project's presentation-only record does not */
    if (o.molecule) loadMS();                                                     // M8: a file carrying a full record asks for the module too
    if (o.molecule && MS && typeof MS.restoreMolecule === 'function') { try { MS.restoreMolecule(o.molecule); } catch (_) {} }
    let resolve = false;
    /* V2 · `volume`: the one on screen keeps its file; another opens on the next solve, from this device only (`preset` is what a missing one leaves) */
    const W = o.volume, vw = W && typeof W.volume === 'string' && typeof W.id === 'string' && BASIS_LABEL[W.basis] ? { volume: W.volume, id: W.id, basis: W.basis, sha256: typeof W.sha256 === 'string' ? W.sha256 : null } : null;
    const same = !!(vw && volRef && vw.volume === volRef.volume && vw.id === volRef.id);
    if (volRef && !same) { volRef = null; volSeq++; preset = catPreset; resolve = true; fillSel(); }
    if (same) { volWant = null; if (vw.basis !== basis) { basis = vw.basis; bSeg.set(basis); resolve = true; } }
    else {
      if ((volWant = vw)) resolve = true;
      if (typeof o.preset === 'string' && PRESET_BY_ID.has(o.preset)) { if (o.preset !== preset) resolve = true; preset = catPreset = o.preset; mSeg.set(preset); }
      if (typeof o.basis === 'string') { if (o.basis !== basis) resolve = true; basis = o.basis; bSeg.set(basis); }
    }
    const h2 = (preset === 'H2' && o.h2) || {}, nR = h2.R > 0 && Math.abs(h2.R - R0) >= 5e-3 ? Math.min(6, Math.max(0.8, h2.R)) : null, nM = o.method === 'lda' ? 'lda' : h2.method === 'uhf' ? 'uhf' : 'rhf';   // 0.7.1 U2: absent = the row's R, RHF
    if (nR !== h2R || nM !== method) { resolve = true; h2R = nR; method = nM; } h2K.set(h2R || R0); mthS.set(method);
    const L = o.library;                                                          // 0.4.0 S4a: the record this file names, fetched on open if absent
    wantRef = L && L.id === preset && /^[0-9a-f]{64}$/.test(L.hash) ? { id: L.id, hash: L.hash, nameKey: L.nameKey || null } : null;
    if (typeof o.view === 'string') { view = o.view; vSeg.set(view); }
    pendingKey = o.orbitalKey || null;                                            // 0.4.0 S2: a link's orbital by its S1 name, resolved when the solve lands
    if (Number.isFinite(o.orbital)) { orbital = Math.round(o.orbital); pendingOrbital = orbital; }
    else if (o.orbital === null) orbital = pendingOrbital = null;   // 0.3.1 · S4: the record's "not chosen" (HOMO by default) lands too — an undo of ON and NEW clear the fill
    if (typeof o.axis === 'string' && AXES.includes(o.axis)) { axis = o.axis; aSeg.set(axis); }
    if (Number.isFinite(o.kappa)) { kappa = o.kappa; kapKnob.set(kappa); }
    if (Number.isFinite(o.speed)) { speed = Math.max(1, Math.round(o.speed)); spdKnob.set(speed); }
    if (Number.isFinite(o.dt) && DTS.includes(String(o.dt))) { dt = o.dt; dSeg.set(String(o.dt)); }
    if (typeof o.integrator === 'string') { integrator = o.integrator; iSeg.set(integrator); }
    if (o.tda !== undefined) { tda = !!o.tda; tdaSw.set(tda); }
    if (o.core !== undefined) { core = !!o.core; coreSw.set(core); cvCore.hidden = !core; }
    if (o.valence !== undefined) { valence = !!o.valence; valSw.set(valence); }
    if (vibOn) setVib(false); pendingVib = o.vibrate && Number.isFinite(o.vibrate.mode) ? o.vibrate : null; pulse = PULSES.includes(o.pulse) ? o.pulse : 'none'; pSeg.set(pulse);   // 0.7.0 V1: VIBRATE plays once this molecule's solve is in (vibLand)
    setRun(false); rt = null; spec = null; fit = null; selected = null;
    if (resolve && sol) sol = null;
    if (sol && pendingKey) { const m = keyed(sol.names, pendingKey); if (m) orbital = m.k; pendingKey = null; }   // S2: the same molecule, already solved: the name lands now
    seats(); tell();
    if (o.on !== undefined) setOn(!!o.on);
    else if (sol) { pushField(); refresh(); } else refresh();
    vibLand(); return save();
  }

  /* the two models this window produces, named to the session once.  `push` is how the session asks this card to
     paint when it becomes the owner; `view` is the observable that product wants shown. */
  if (S()) { S().register('ground', { push: () => pushMatrix(), view: molView });
    S().register('tdhf', { push: () => pushMatrix(), view: molView }); }

  refresh();
  return {
    update, refresh, paint,
    prepare() { return sol ? Promise.resolve(sol) : solve(preset); },
    setActive(v) { const next = !!v; if (next === active) return active; active = next; if (active) paint(); return active; },
    get on() { return on; }, setOn, get half() { return sol && Number.isFinite(sol.half) ? sol.half : 10.3; },
    /** what the worker needs to find this solution again — the STATES register asks it for the canonical ladder */
    setFlow, get flowOn() { return flowOn; }, get flowEpoch() { return flowEpoch; }, flowSource() { return flowOn ? flow : null; }, get said() { return said; },
    query() { return sol && !uhf() ? { atoms: chemAtoms(preset), basis, charge: chemCharge(preset), ...(lda() ? { model: 'lda' } : {}) } : null; },   // 0.7.1: an open shell has no ladder to ask for; 0.7.3: an LDA one is asked so, and refused with its sentence
    /** the names an export carries (0.4.0 S1): the group and configuration, and the ORBITAL on the field when VIEW is one */
    exportNames() {
      if (!sol || !sol.names) return null;
      const N = sol.names, k = (orbital || sol.nocc) - 1, mo = N.mos[k], f = mo && mo.label ? forms(mo) : null;
      return { group: N.reliable ? N.group : null, config: N.reliable ? N.config : null, reason: N.reliable ? null : N.reason,
        orbital: view === 'orbital' ? { k: k + 1, frontier: mo ? mo.frontier : null, plain: f ? f.plain : null, latex: f ? f.latex : null, ascii: f ? f.ascii : null } : null };
    },
    /** the chosen orbital as its S1 name { group, irrep, count, member } — what a link carries (0.4.0 S2); null when none is chosen or named */
    orbitalKey,
    /** 0.6.5 X2 · ESP: the pump's consumer (a `chem.esp` reply), and the caption a capture carries while its card is on the field */
    onEsp, espCaption: () => [espOn() ? `ESP · ${esp.N}³ · min ${sgn(esp.min)} · max ${sgn(esp.max)} a.u.${esp.cap ? ` · shown clipped at ${sgn(esp.cap)}` : ''}` : '', vibLine(' · STO-3G RHF harmonic, as computed'), drawn() === 'dlda' && pair() ? 'Δ LDA−RHF · where LDA puts more density' : '', said && said.lda, drawn() === 'spin' && sol && sol.Ds ? 'SPIN · UHF' : ''].filter(Boolean).join(' · '),   // 0.7.0 V1: and the mode while VIBRATE plays
    /** 0.7.0 · the nuclei and the dipole AS DRAWN this frame (bohr, a.u.): the preset's atoms and the solve's dipole until VIBRATE poses them (V1); the skeleton and the atom labels read these, never moleculeAtoms */
    atomsNow: () => (vibFr && vibAt) || chemAtoms(preset), dipoleNow: () => (vibFr && vibJ >= 0 ? Array.from(vibFr.dipole.subarray(3 * vibJ, 3 * vibJ + 3)) : (sol && sol.dipole) || null),
    /** 0.7.0 V1 · VIBRATE from outside (the verb, __LW.chem): the row's own controls; `breathe` presses BREATHE; → the line while it plays, or null */
    async vibrate({ on: v = true, mode, amp, breathe: b } = {}) { if (Number.isFinite(amp)) ampKnob.set(Math.min(4, Math.max(0, amp))); await (b ? breathe() : setVib(v, Number.isFinite(mode) ? mode : vibK, Number.isFinite(amp) ? amp : vibAmp)); return vibLine(); },
    vibLine,
    /* THE LIBRARY (0.4.0 S4a): every record row with its installed lamp, and the INSTALL / REMOVE a section header (S4b) presses */
    async records() { await lamps(); return CHEM_PRESETS.flatMap((p) => Object.values(p.records || {}).map((r) => ({ id: p.id, basis: r.basis, hash: r.hash, bytes: r.bytes,
      caps: r.caps, recordOnly: !!p.recordOnly, installed: !!have.get(r.hash), label: optOf(p.id) ? optOf(p.id).textContent : null }))); },
    async install(id, b = 'sto-3g') {
      const r = ((PRESET_BY_ID.get(id) || {}).records || {})[b]; if (!r) return { ok: false, why: 'no record for ' + id + ' in ' + b };
      const info = await persistOnce(); storageNote(info);
      const got = await fetchRecord(r.hash, { network: true }); await lamps();
      return { ok: !!got.record, why: got.why || null, from: got.from || null, bytes: got.bytes || 0, storage: info };
    },
    async remove(id, b = 'sto-3g') { const r = ((PRESET_BY_ID.get(id) || {}).records || {})[b]; const ok = !!r && await removeRecord(r.hash); await lamps(); return ok; },
    /** THE PAGE TURNER (S4b): turn to a section by name (the hand's ‹ › road) and read its header back */
    section(s) { if (SECTIONS.includes(s) && s !== page) { page = s; fillSel(); } const recs = sectionRecs();
      return { name: page, molecules: CHEM_PRESETS.filter((p) => p.section === page).map((p) => p.id), records: recs.length, bytes: recs.reduce((t, r) => t + r.bytes, 0),
        installed: recs.filter((r) => have.get(r.hash)).length, keepOffered: !keepSw.root.hidden, lamp: keepSw.get(), sub }; },
    /** INSTALLED pressed from outside: every record of the page's section kept (true) or removed (false) — the switch's own road */
    keep(v) { keepSw.set(!!v); return keep(!!v); },
    storage: () => storageInfo(),
    /** the chem worker's own ledger — `solverCalls` counts every moleculeRHF and rpa it ran (a record's open adds none) */
    workerStat() { return call({ op: 'stat' }); },
    /** 0.5.4 P4 · what is on stage and how far it goes (PLAN R8; R25 §12.5): a thin caller — tell()'s status, the engine's own limits; null before a solve; never a frame's call */
    capability() { if (!sol) return null; const row = volRef ? { caps: rungRec().caps } : (PRESET_BY_ID.get(preset).records || {})[basis] || null;
      return { caps: row ? row.caps : null, observables: { density: !!sol.D || factor(), orbital: true, flow: !!sol.D, states: !row || row.caps.states }, derivatives: 'UNKNOWN', identity: sol.identity, status: said,
        limits: { lmax: COMPONENT_ORDER.length - 1, Z: MAX_Z, densityAO: MAX_MOL_AO, orbitalAO: MOL_LIMITS.ao }, precision: { path: 'f64 → f32 → f16 texel', law: FIELD_LAW },
        online: 'the ground solve or the record\'s open; the spectrum; a kick\'s run; the field on the GPU', cached: 'the worker\'s solve on (atoms, basis, charge); a record on this device; the field per product',
        invalidates: 'a new molecule, basis or charge: a new solve; a kick: the real-time density; VIEW, ORBITAL or VALENCE: the field only' }; },
    onPick(fn) { pickHook = typeof fn === 'function' ? fn : null; },
    setPopulations(fn) { popOf = typeof fn === 'function' ? fn : null; paint(); },
    get esp() { return espLast; }, espPump() { espPump(); return espLast; },   // 0.6.5 X1: the last chem.esp reply; VIEW ESP pumps from update()
    solution() { return sol; }, subscribe(fn) { subs.add(fn); if (sol) fn(sol); return () => subs.delete(fn); },   // the register's road: the last ground state, and every new one
    /* the modulation registry's two targets — PRESENT-only setters, and the dials they write */
    get kappa() { return kappa; }, setKappa(v) { if (!Number.isFinite(v)) return kappa; kappa = Math.min(1e-2, Math.max(1e-4, v)); return kappa; },
    get speed() { return speed; }, setSpeed(v) { if (!Number.isFinite(v)) return speed; speed = Math.min(50, Math.max(1, Math.round(v))); return speed; },
    knobs: { kick: () => kapKnob, speed: () => spdKnob },
    /* ── __LW.chem ─────────────────────────────────────────────────────────────────────────────── */
    solve(id, opts) { return solve(id === undefined ? preset : id, opts || {}); }, pick: handPick,
    preset() { return preset; }, row,
    /** V2 · a volume's molecule on the stage (the PICKER's LIBRARY, an `lw:volume=` link, __LW.chem): → the landing, or null with the reason on the status line */
    openVolume(volId, molId, b = null, opts) { return openVolume(volId, molId, b, opts); },
    get volume() { return volRef ? { volume: volRef.volume, id: volRef.id, numeral: volRef.numeral, name: volRef.name, basis, rungs: volRef.rungs.slice(), sha256: volRef.sha256 } : null; },
    /** 0.7.3 K2 · METHOD from outside (the verb, __LW.chem): the seg's own road, a hand press; → the solve, or null where it is not offered */
    setMethod(v) { const b = mthS.button(v); if (!b || b.disabled || b.style.display === 'none') return Promise.resolve(null); if (v === method) return solve(preset); mthS.set(v); method = v; return solve(preset).then((r) => { if (r && api.hand) api.hand(preset); return r; }); }, get method() { return method; },
    setView(v) { if (!['density', 'orbital', 'diff', 'esp', 'spin', 'dlda'].includes(v) || (v === 'spin' && !(sol && sol.Ds)) || (v === 'dlda' && !pair()) || (v !== 'orbital' && sol && !sol.D && !(v === 'density' && factor()))) return view; view = v; vSeg.set(v); seats(); pushMatrix(v === 'diff' && !rt); refresh(); tell(); return view; },
    orbital(k) { if (Number.isFinite(k)) { const [lo, hi] = span(); orbital = Math.min(hi, Math.max(lo, Math.round(k))); orbKnob.set(orbital); if (view === 'orbital') pushMatrix(); refresh(); } return orbital; },
    setAxis(a) { if (!AXES.includes(a)) return axis; axis = a; aSeg.set(a); paint(); return axis; },
    setIntegrator(v) { if (v !== 'mmut' && v !== 'magnus2') return integrator; integrator = v; iSeg.set(v); reset(); return integrator; },
    setDt(v) { if (!DTS.includes(String(v))) return dt; dt = Number(v); dSeg.set(String(v)); reset(); return dt; },
    setTda(v) { tda = !!v; tdaSw.set(tda); paint(); return tda; },
    setCore(v) { core = !!v; coreSw.set(core); cvCore.hidden = !core; paint(); return core; },
    setValence(v) { valence = !!v; valSw.set(valence); pushMatrix(); refresh(); return valence; },
    kick() { return kick(); },
    certify(dD) { if (sol && sol.D && symDue()) symmetryLine(sol.D.map((v, k) => v + dD[k]), 'STATES'); },   // the register's ΔD against the ground (statesview.js), at ≤ 5 Hz
    /** RUN n steps and settle — the gate's road, and it never leaves the switch on behind it */
    async run(n) {
      if (!sol) return null;
      if (!rt) { const k = await kick(); if (!k) return null; }
      const want = (rt ? rt.steps : 0) + Math.max(1, Math.round(n || speed));
      const t0 = Date.now();
      /* THE SCRIPTED ROAD CLAIMS THE FIELD TOO.  `running` is the RUN switch; this road never set it, so a scripted
         propagation was the `ground` model and the register out-ranked a run in progress.  The claim is the tdhf
         model's, whichever road is propagating, and it is handed back in `finally` unless the switch holds it. */
      const mine = !running; if (mine) { scripted = true; if (S()) S().claim('tdhf', true, 'a scripted RT run is propagating the density'); }
      try {
      while (rt && rt.steps < want && Date.now() - t0 < 120000) {
        if (!inflight) { const left = want - rt.steps; inflight = true;
          /* eslint-disable no-await-in-loop */
          const r = await call({ op: 'chem.rt.run', steps: Math.min(left, Math.max(1, speed)), factors: flowOn });
          inflight = false;
          if (!r || r.error) return null;
          rt.t = r.t; rt.electrons = r.electrons; rt.idempotency = r.idempotency; rt.energy = r.energy;
          rt.steps = r.steps || rt.steps; rt.msPerStep = r.msPerStep; if (r.D_re) rt.D_re = r.D_re; if (r.D_im) rt.D_im = r.D_im; rt.F = factorsOf(r);
          if (r.restartPolicy) { rt.restartPolicy = r.restartPolicy; rt.sinceRestart = r.sinceRestart; }
          rt.samples = r.samples || rt.samples; append(r.trace);
          pushMatrix(); if (r.D_re && symDue()) symmetryLine(rt.D_re, 'RUN');
        } else await new Promise((res) => setTimeout(res, 8));
      }
      } finally { if (mine) { scripted = false; if (!running && S()) S().claim('tdhf', false, 'the scripted RT run has finished'); pushMatrix(); } }   // and the card's own model repaints the last density
      refresh(); requestSpectrum(true); if (rt) symmetryLine(rt.D_re, 'RUN');
      return this.state();
    },
    /** the BASIS control from outside: the same road as the segment — it re-solves, and falls back with a sentence where 6-31+G* is not offered */
    setBasis(v) { if (!BASIS_LABEL[v]) v = 'sto-3g'; if (!volRef && LIVE.has(v)) { basis = v; bSeg.set(basis); return solve(preset); } return readHolds().then(() => pressBasis(v)); }, get basis() { return basis; },   // V2: the ladder's other rungs are the seg's own road
    /** the RUN switch itself, from outside: the live pump (`run(n)` is the scripted, bounded road) */
    setRun(v) { return setRun(v); },
    stop() { setRun(false); return false; },
    reset() { reset(); return true; },
    state() {
      return { preset, basis, view, on, running, nAO: sol ? sol.nAO : 0, nocc: sol ? sol.nocc : 0,
        energy: sol ? sol.energy : null, epsHOMO: sol ? sol.eps[sol.nocc - 1] : null, epsLUMO: sol ? sol.eps[sol.nocc] : null,
        names: sol && sol.names ? { group: sol.names.group, reliable: sol.names.reliable, reason: sol.names.reason, config: sol.names.config, ms: sol.names.ms } : null,
        orbitalName: sol ? orbFmt(orbital || sol.nocc) : null,
        electrons: rt ? rt.electrons : (sol ? nel() : 0), ...(sol && sol.model ? { model: sol.model, s2: sol.s2 } : {}), idempotency: rt ? rt.idempotency : null,
        t: rt ? rt.t : 0, steps: rt ? rt.steps : 0, trace: rt ? (rt.samples || rt.trace.length) : 0, fitWindow: rt ? rt.trace.length : 0, E0: rt ? rt.E0 : null,
        energyRT: rt ? rt.energy : null, half: sol ? sol.half : null, hash: sol ? sol.hash : null,
        record: sol && sol.record ? { ...sol.record, ...sol.opened, ms: sol.timings && sol.timings.open } : null, note: sol ? sol.note || null : null,
        local: !!(sol && sol.local), status: statusText, roots: sol && sol.roots ? sol.roots.length : 0,
        tdaRoots: sol && sol.tda ? sol.tda.length : 0, stage: sol ? (sol.roots ? 'full' : 'ground') : 'none',
        restartEvery: rt ? rt.restartEvery : null, restartPolicy: rt ? rt.restartPolicy : null, sinceRestart: rt ? rt.sinceRestart : null,
        fitted: fit ? fit.poles.map((p) => p.omega) : null, certified: fit ? fit.certified : null,
        fieldOwner: fieldHash !== null, kappa, speed, dt, integrator, axis, tda, core, valence, orbital };
    },
    /** the RPA ladder; `omegaTDA` on an entry is the k-th TDA ROOT BY INDEX, never that root's partner */
    roots(n) { const r = bright(); return (Number.isFinite(n) ? r.slice(0, n) : r).map((k) => ({ omega: k.omega, omegaTDA: k.omegaTDA, f: k.f, mu: Array.from(k.mu || []), pol: polOf(k), dominant: dominantOf(k) })); },
    /** the TDA ladder as its own ascending list, with its own strengths and polarisations */
    tdaRoots(n) { const r = (sol && sol.tda) || []; return (Number.isFinite(n) ? r.slice(0, n) : r).map((k) => ({ omega: k.omega, f: k.f, mu: Array.from(k.mu || []), pol: polOf(k) })); },
    spectrum() { return spec ? { tau: spec.tau, peaks: spec.peaks, n: spec.omega.length } : null; },
    fit() { return fit; },
    save, load, record,
  };
}
