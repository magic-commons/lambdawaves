/* lab/shell/stage-words.js — THE STAGE TEXT and its CAPTION (0.5.2 R2d; moved verbatim out of lab/rack.js boot()): the source, the caption a capture draws,
 * the tick and the INFORMATIONAL layer (initStageText, called by boot() at the go).  stageTextTick and stageCaption are registered on app.w at creation. */
import { TIER } from '../rack.js'; import { el, mathPlain } from '../mir/kit.js'; import { createInfoLayer, INFO } from '../mir/info/layer.js'; import { paintedRect } from '../occlusion.js'; import { toScreen, cameraKey } from '../field.js';
import { BASIS } from '../hydrogen.js'; import { getHamiltonian } from '../hamiltonian.js'; import { ELEMENT } from '../md.js';
import { stateLatex, formulaLatex, BASIS_LABEL, mdText } from '../latex-state.js';
import { createPrefs } from '../mir/core/prefs.js'; import { createSettingsStore } from '../settings-store.js';
/* ── iteration 007 I · THE STAGE WORDS' PREFERENCES ARE ONE RECORD OF THEIR OWN (ADR-0003): `lambdawaves.q0.info`, the kit's createPrefs over
   the declarative rows below (no `apply` spec: initStageText applies them, and INFORMATIONAL builds its controls from them with the kit's control()).
   THE KINDS: every announcement says what it is, and the stage writes it only while that kind's switch is on.  `fade` is THE FADE (the formula's seat,
   2.4 s), `pop` the short line on the other side (iteration 001), `head` THE HEAD (held until Escape or a press).  Josh 10-18: "default to formula and
   atoms on.  Everything else off."  A HAND speaks; a restore, an undo, a project or link open never does (each emitter's own law, unchanged). */
export const INFO_KEY = 'lambdawaves.q0.info';
export const KINDS = Object.freeze([
  { id: 'preset', key: 'sayPreset', seat: 'fade', label: 'PRESETS', hint: 'A hand\'s preset — SPECTRUM\'s PRESET (a pick of the one shown reloads it), the register\'s ORBITAL and STATES presets in MOLECULES, a notebook link — named in the formula\'s seat for 2.4 s' },
  { id: 'head', key: 'sayHead', seat: 'head', label: 'MOLECULE HEAD', hint: 'A hand pick of a molecule shows its head once the solve lands — formula and name, method and E, the HOMO and the gap, its STATUS — held until Escape or a press on the picture' },
  /* iteration 012 R1 (Josh 10-20: "Merge the function 'Orbital Dial' and 'Registry Adds'"): ONE switch, ORBITALS, speaks for both kinds — the orbital kind
     reads the registry's key, so a stored `sayOrbital` is simply never read again and the window's grid has room for the pop-ups' SIZE */
  { id: 'registry', key: 'sayRegistry', seat: 'pop', label: 'ORBITALS', hint: 'The orbital a hand just added to MOLECULES\' register, and the orbital MOLECULES\' ORBITAL dial lands on while a hand turns it' },
  { id: 'view', key: 'sayView', seat: 'pop', label: 'WAVE VIEW', hint: 'WAVE\'s OBSERVABLE and MOLECULES\' VIEW, as a hand changes them' },
  { id: 'orbital', key: 'sayRegistry', seat: 'pop', label: 'ORBITALS' },
  { id: 'basis', key: 'sayBasis', seat: 'pop', label: 'BASIS · METHOD', hint: 'MOLECULES\' BASIS and METHOD, as a hand picks them' },
  { id: 'rate', key: 'sayRate', seat: 'pop', label: 'RATE', hint: 'The time multiplier (the transport\'s RATE), while a hand turns it' },
  { id: 'style', key: 'sayStyle', seat: 'pop', label: 'STYLE · PALETTE', hint: 'WAVE\'s draw STYLE, PALETTE on or off and a palette preset, as a hand picks them' },
]);
const KIND = new Map(KINDS.map((k) => [k.id, k]));
const pct = (v) => Math.round(v * 100) + '%';
/** the rows: { key, type, default, … } is the kit's prefs schema; group · label · hint · options · fmt are the window's (informational.js) */
export const INFO_ROWS = Object.freeze([
  { key: 'molFormula', type: 'bool', default: true, group: 'words', label: 'STAGE FORMULA', hint: 'Write what is playing on the stage — the MOLECULES formula or the SPECTRUM states — and caption a picture or a recording with it and its STATUS word; off, an export carries neither and the stage announces nothing' },
  { key: 'molName', type: 'bool', default: false, group: 'words', label: 'NAME', hint: 'The molecule\'s name under its formula (water under H₂O)' },
  /* iteration 011 Q1 · THE LIST CAP (Josh 10-19: "have the informational automatically hide ultra large lists so it doesn't fight the screen and users don't
     have to keep toggling it on and off just because a certain mode uses an obscene amount of 140 levels"): SPECTRUM's populated list longer than the cap is
     written as its count — "140 levels · 7 shells" (capLine) — on the stage and in an export's caption; at or under the cap it is the list, as before.
     16 = the longest LOAD VALENCE (4f 5d 6s 6p, 5f 6d 7s 7p: 16 labels), so every atom's valence still reads as its subshells; a molecule's formula is untouched */
  { key: 'listCap', type: 'number', min: 4, max: 140, step: 1, log: true, default: 16, group: 'words', label: 'LIST CAP', fmt: (v) => String(Math.round(v)), hint: 'The longest populated-state list the stage writes in full: a longer one (FILL ALL, a Hamiltonian that fills many levels) is written as its count, "140 levels · 7 shells", and returns as a list once it fits again' },
  { key: 'molFormulaSize', type: 'number', min: 0.5, max: 3, step: 0.01, default: 1, group: 'words', label: 'SIZE', fmt: pct, hint: 'The STAGE FORMULA\'s size: 100% is the notebook\'s — the formula its title (34 px), THE FADE its heading' },
  { key: 'atomLabels', type: 'bool', default: true, group: 'labels', label: 'ATOM LABELS', hint: 'Mark each MOLECULES nucleus with its element symbol, inverting whatever is beneath it' },
  { key: 'atomLabelsSize', type: 'number', min: 0.5, max: 3, step: 0.01, default: 1, group: 'labels', label: 'SIZE', fmt: pct, hint: 'The ATOM LABELS\' size: 100% is the notebook\'s body (14 px)' },
  { key: 'infoPos', type: 'enum', values: ['top', 'bottom'], default: 'top', group: 'seat', label: 'POSITION', options: [{ id: 'top', label: 'TOP' }, { id: 'bottom', label: 'BOTTOM' }], hint: 'The formula at the top or the bottom of the free stage; the pop-ups take the other side' },
  { key: 'infoPad', type: 'number', min: 0, max: 0.4, step: 0.01, default: 0.12, group: 'seat', label: 'PAD', fmt: pct, hint: 'The formula\'s distance from its edge of the free stage, as a share of its height; the pop-ups keep the same distance on the other side' },
  ...KINDS.filter((k) => k.hint).map((k) => ({ key: k.key, type: 'bool', default: false, group: 'announce', label: k.label, hint: k.hint })),
  { key: 'popSize', type: 'number', min: 0.5, max: 3, step: 0.01, default: 1, group: 'announce', label: 'SIZE', fmt: pct, hint: 'The pop-ups\' size: 100% is 15 px' },
  { key: 'cursorAway', type: 'bool', default: false, group: 'cursor', label: 'PARALLAX', hint: 'The words lean away from the pointer as it crosses the stage (the kit layer\'s follow and parallax)' },
  { key: 'cursorDrift', type: 'bool', default: false, group: 'cursor', label: 'DRIFT', hint: 'The words bob slowly while they are on the stage (the kit layer\'s drift; it keeps a frame booked)' },
  /* MARKS draw ON the stage (rack.js' frame reads ui.skeletonSw · beadSw · ellipsoidSw, these rows' widgets): the record's since the fix round (C6).
     Iteration 011 Q1 (Josh 10-19: "move skeleton into it's own row amongst stage formula and atom labels with a size knob to increase the disk size"):
     SKELETON is THE WORDS' third ON + SIZE row; its disks are flat (no outline) and SIZE scales them — 100 % is the old 0.28 × the covalent radius,
     the default 160 %; the bonds and the dipole keep their 2 px.  BEAD and UNCERTAINTY stay in MARKS. */
  /* iteration 012 R1 (Josh 10-20): SKELETON is BALL AND STICK (the label only: the key `skeleton` stays), with an OPACITY knob between its switch and SIZE;
     the dipole arrow it drew ("a weird arrow … can it be separated from Skeleton?") is MARKS' DIPOLE, its own switch, off by default */
  { key: 'skeleton', type: 'bool', default: false, group: 'skeleton', label: 'BALL AND STICK', hint: 'The nuclei as flat disks in their CPK colours and the bonds within 1.3 × the covalent radii — a PREFERENCE, off by default' },   // 0.7.0 V2: rack.js draws it (lab/skeleton.js)
  { key: 'skeletonOpacity', type: 'number', min: 0.1, max: 1, step: 0.01, default: 1, group: 'skeleton', label: 'OPACITY', fmt: pct, hint: 'BALL AND STICK\'s opacity: 100% is as drawn before (the near half 90%, the far half dimmed)' },
  { key: 'skeletonSize', type: 'number', min: 0.5, max: 4, step: 0.01, default: 1.6, group: 'skeleton', label: 'SIZE', fmt: pct, hint: 'BALL AND STICK\'s disks: 100% is 0.28 × the element\'s covalent radius (the size before iteration 011), 160% the default; the bonds and the dipole arrow keep their width' },
  /* iteration 014 D6 (Josh: "Let the Ball and stick model show double/triple bonds, whether a bond is sigma, or ionic, or different types of attraction,
     resonances (like benzene) … a customizable feature to be in the informational"): BALL AND STICK's BONDS, four switches (lab/skeleton.js bondsOf) */
  { key: 'bondOrder', type: 'bool', default: true, group: 'bonds', label: 'ORDER', hint: 'Double and triple bonds as two and three parallel sticks — from the record\'s bonds when it carries them, else by length against Pyykkö\'s covalent radii' },
  { key: 'bondAromatic', type: 'bool', default: true, group: 'bonds', label: 'AROMATIC', hint: 'An aromatic ring (benzene\'s, pyridine\'s, furan\'s) as single sticks with a dashed circle inside, in the ring\'s plane' },
  { key: 'bondIonic', type: 'bool', default: true, group: 'bonds', label: 'IONIC', hint: 'An ionic or dative bond as a dotted stick: Mulliken charges 0.8 e apart (a volume molecule), else Pauling Δχ ≥ 2; dative a donor past its valence bound to B, Al or a metal' },
  { key: 'bondHydrogen', type: 'bool', default: true, group: 'bonds', label: 'H-BOND', hint: 'A hydrogen bond N/O/F–H···N/O/F (H to acceptor within 2.5 Å, the angle at H ≥ 120°) as a dotted line in the accent' },
  { key: 'dipole', type: 'bool', default: false, group: 'marks', label: 'DIPOLE', hint: 'THE DIPOLE ARROW: the molecule\'s dipole moment (a.u.) from the centre of nuclear charge, 2 bohr per a.u., in the accent — once drawn with BALL AND STICK; a PREFERENCE, off by default' },
  { key: 'bead', type: 'bool', default: false, group: 'marks', label: 'BEAD', hint: 'THE BEAD: the expectation point (⟨x⟩, ⟨y⟩, ⟨z⟩) on the stage with its trail over the last period (⟨p⟩ in momentum space; for a molecule the electron density\'s centroid (ΣZR − μ)/N_e) — a PREFERENCE, off by default' },   // 0.8.2 P3: on the skeleton's canvas
  { key: 'ellipsoid', type: 'bool', default: false, group: 'marks', label: 'UNCERTAINTY', hint: 'THE UNCERTAINTY ELLIPSOID: the position covariance Σ_ij = ⟨r_i r_j⟩ − ⟨r_i⟩⟨r_j⟩ as its three principal circles, semi-axes √λ_k, about the bead (with it) — position space and a register only; a PREFERENCE, off by default' },   // 0.8.3 B3 · iteration 008 P: the switch says what it draws; the key stays `ellipsoid`
  /* iteration 011 Q1 · STATUS (Josh 10-19: "a button that hides the extra status thingy"): INFORMATIONAL's STATUS readout — the only status block the
     stage words own (research/iteration-011/q1-shots/before-*.png) — shown or hidden.  Off on a first run; a record older than it opens ON, as it was (infoPrefs) */
  { key: 'status', type: 'bool', default: false, group: 'status', label: 'STATUS', hint: 'Show the STATUS readout below: EXACT · NUMERICAL · UNCHECKED and how good the picture is, for what owns the field (a tap on it opens the MODEL sheet).  An export caption\'s STATE word is not this switch\'s' },
]);
/** the six keys the settings blob held (0.5.3 M9, iteration 001): read once into the record, never written again */
export const BLOB_INFO = Object.freeze(['molFormula', 'molFormulaSize', 'atomLabels', 'atomLabelsSize', 'infoPos', 'infoPad']);
/** …and the three MARKS it held until the fix round (C6), each written only while on: read once into the record, whenever they are found */
const BLOB_MARKS = Object.freeze(['skeleton', 'bead', 'ellipsoid']);
/** liftInfo(blob) → the record's patch, by the laws shell/settings.js read them by: nothing said is ON at 100 %; an absent atomLabels /
 *  atomLabelsSize takes the stored molFormula / molFormulaSize (a 0.4–0.5.2 profile with STAGE TEXT off keeps its labels off); TOP at 12 % */
export function liftInfo(s = {}) {
  if (!BLOB_INFO.some((k) => s[k] !== undefined)) return {};
  const num = (v) => (v === undefined || v === null ? NaN : +v), clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const molFormula = s.molFormula !== undefined ? s.molFormula !== false : s.atomLabels !== false, atomLabels = s.atomLabels !== undefined ? s.atomLabels !== false : molFormula;
  const molFormulaSize = Number.isFinite(num(s.molFormulaSize)) ? clamp(num(s.molFormulaSize), 0.5, 3) : 1, atomLabelsSize = Number.isFinite(num(s.atomLabelsSize)) ? clamp(num(s.atomLabelsSize), 0.5, 3) : molFormulaSize;
  return { molFormula, atomLabels, molFormulaSize, atomLabelsSize, infoPos: s.infoPos === 'bottom' ? 'bottom' : 'top', infoPad: Number.isFinite(num(s.infoPad)) ? clamp(num(s.infoPad), 0, 0.4) : 0.12 };
}
let infoStore = null, infoSeen = false;
/** infoPrefs() — the one record (made at its first call: INFORMATIONAL's seat or applySettings', whichever comes first).  THE LIFT runs here, once:
 *  a blob holding the six keys and no record → the record, and the keys leave the blob.  The record is written once if absent, so a profile that has
 *  met INFORMATIONAL says so (infoKnown — the closed-card rule's "older than INFORMATIONAL" was `atomLabels === undefined`). */
export function infoPrefs() {
  if (infoStore) return infoStore;
  let ls = null; try { ls = globalThis.localStorage || null; } catch (_) {}
  const has = () => { try { return !!(ls && ls.getItem(INFO_KEY)); } catch (_) { return false; } };
  const settings = createSettingsStore(), blob = settings.read();
  infoSeen = has() || blob.atomLabels !== undefined;
  let rawInfo = {}; try { rawInfo = (ls && JSON.parse(ls.getItem(INFO_KEY) || '{}')) || {}; } catch (_) {}
  infoStore = createPrefs({ key: INFO_KEY, schema: INFO_ROWS.map(({ key, type, values, min, max, step, default: d }) => ({ key, type, values, min, max, step, default: d })), storage: ls });
  if (!has()) {
    const held = BLOB_INFO.filter((k) => k in blob);
    infoStore.set(liftInfo(blob));
    try { if (ls && !has()) ls.setItem(INFO_KEY, JSON.stringify(infoStore.all())); } catch (_) {}
    if (held.length) { for (const k of held) delete blob[k]; settings.write(blob); }
  }
  /* iteration 011 Q1: STATUS is new and off on a first run — a profile that met INFORMATIONAL before it (a record without the key, or a blob the lift
     read) saw the readout, so it opens ON, as it was; the write carries the key, and the hand's choice is kept from then on */
  if (infoSeen && !('status' in rawInfo)) infoStore.set({ status: true });
  const marks = BLOB_MARKS.filter((k) => k in blob);
  if (marks.length) { infoStore.set(Object.fromEntries(marks.map((k) => [k, blob[k] === true]))); for (const k of marks) delete blob[k]; settings.write(blob); }
  return infoStore;
}
/** has this profile met INFORMATIONAL (a record, or a blob that held atomLabels)?  Read at infoPrefs()'s first call */
export const infoKnown = () => (infoPrefs(), infoSeen);
/** THE LIST CAP's count line (iteration 011 Q1): `140 levels · 7 shells` — the populated labels and the distinct n among them */
export function capLine(ids) {
  const k = ids.length, s = new Set(ids.map((a) => BASIS[a].n)).size;
  return `${k} level${k === 1 ? '' : 's'} · ${s} shell${s === 1 ? '' : 's'}`;
}
export function createStageWords(app) {
  const { dom, reg } = app, { rack } = app.host, { wChem } = app.w, { paintMarks, look } = app.ctl, { schedule } = app.loop, P = infoPrefs();
  const stageSrc = { v: -1, id: null };
  /** the states that play, as stateLatex's prose with UNIT coefficients (md) or as their plain labels, comma-separated */
  function stageStates(md) {
    const H = getHamiltonian(), mix = reg.transition;
    const line = md ? (ids) => stateLatex({ H, states: ids.map((a) => ({ n: BASIS[a].n, l: BASIS[a].l, m: BASIS[a].m, re: 1, im: 0 })) }).split('\n')[0]
      : (ids) => ids.map((a) => (H.id === 'hydrogen' ? BASIS[a].label : H.labelOf(BASIS[a]))).join(', ');
    const live = (re, im) => BASIS.filter((s) => re[s.index] * re[s.index] + im[s.index] * im[s.index] > 1e-12).map((s) => s.index);
    const say = (ids) => (ids.length > P.get('listCap') ? capLine(ids) : line(ids));   // iteration 011 Q1 · THE LIST CAP: a list longer than the cap is its count
    if (mix) { const A = say(live(mix.reA, mix.imA)), B = say(live(mix.reB, mix.imB)); return A && B ? A + '  ↔  ' + B : A || B; }
    return say(reg.populated());
  }
  function stageMd() {
    const row = app.state.chem && app.state.chem.on ? app.state.chem.row() : null;   // the catalogue's row or a volume molecule's (V2)
    return row ? '$' + formulaLatex(row.formula) + '$' + (P.get('molName') && row.name ? '\n\n' + mdText(row.name) : '') : stageStates(true);   // NAME: the molecule's name under its formula
  }
  /** THE CAPTION a capture carries (T3): the same stage text as ONE plain-Unicode line — `H₂O · 1b1 HOMO · STO-3G` (the
   *  formula, the ORBITAL on the field in names.js's plain form, the basis) or SPECTRUM's states ("2s₀, 2p₋₁"; A ↔ B) — drawn
   *  by capture.js, since the DOM formula never reaches an export.  It follows the STAGE FORMULA switch.  KIT BRIEF 6 replaces it. */
  function stageCaption() {
    if (!app.state.stageText || !app.state.stageText.on) return '';
    const row = app.state.chem && app.state.chem.on ? app.state.chem.row() : null;
    if (!row) return stageStates(false);
    const o = app.state.chem.exportNames(), k = o && o.orbital;
    return [mathPlain(row.formula), app.state.chem.espCaption(), k && k.plain ? k.plain + (/^(HOMO|LUMO)$/.test(k.frontier) ? ' ' + k.frontier : '') : '', BASIS_LABEL[app.state.chem.basis] || '', row.volume || ''].filter(Boolean).join(' · ');
  }
  function stageTextTick() {
    if (!app.state.stageText) return;
    const id = app.state.chem && app.state.chem.on ? app.state.chem.preset() : '';
    if (reg.version === stageSrc.v && id === stageSrc.id) return;
    stageSrc.v = reg.version; stageSrc.id = id;
    app.state.stageText.setFormula(stageMd());
  }
  app.w.stageTextTick = stageTextTick; app.w.stageCaption = stageCaption;
  /* 0.5.1 D1 · THE STAGE TEXT IS ONE BLOCK of the kit's INFORMATIONAL layer (mir/info/layer.js; stage-text.js left): the kit's ink,
     shade and serif at the kit's seat — the free stage's top + 12 %, between the racks, clear of the transport and a docked TIMELINE —
     and STILL: no subject, no labels, no parallax, no drift, no following (iteration 007: INFORMATIONAL › CURSOR may turn the kit's follow ·
     parallax · drift on), and never told of a camera move (a block with no subject
     depends on no view; the layer's own ResizeObserver and `resize` cover a size, and the racks and the transport are told below);
     only a pointer passing within the kit's reach (260 px) parts it, and HOLD (I) freezes even that.
     THE LAWS kept: the key is the STRING — a changed one is remove() + addBlock(), the kit's exit and entrance — and KaTeX runs at
     most four times a second (a change inside the quarter second waits, then renders whatever is wanted by then); OFF COSTS NOTHING
     (the root hidden, nothing added); THE FADE is a HAND's preset (`{ hand: true }`; the register's `announce`) in the formula's seat
     for 2.4 s — the formula leaves and comes back, and the kit's exit IS the fade.  The type (lab.css .lw-stage) is the notebook's:
     the formula its title (34 px), an announcement its heading (22 px), × SIZE.  THE ATOM LETTERS stay λWAVES' (R6-L): one element
     symbol per nucleus at its projected place, written only when the camera, the molecule, the SIZE or the canvas changed; white
     under `difference`, so each glyph inverts what it is on; the notebook's body (14 px) × SIZE. */
  function initStageText() {
    const KATEX_MS = 250, racks = () => [app.host.rackL, rack].filter((r) => r && r.querySelector('.dev:not(.closed):not([hidden])'));
    /* 2026-10-16 (Josh, iteration 001) · THE SEAT: TOP or BOTTOM of the free stage, PAD its share of the free height from that edge (0.12 is the kit's
       own seat).  The kit is not edited: two hair-thin bands in `avoid()` (mid-stage, never at an edge, so never read as a rack) pin the free stage
       to exactly the block's height at the seat, so the kit's placeBlock lands it there.  THE POP-UPS sit on the OTHER side, at the same PAD. */
    const seat = { bottom: false, pad: 0.12 }; let block = null;
    const bars = () => [...racks(), app.sh.layout.docked ? null : document.getElementById('transport'), app.state.tl && app.state.tl.isOpen() ? app.state.tl.root : null].map((e) => paintedRect(e)).filter(Boolean);
    function freeOf(rs, sb) {                                          // the kit's free() rule (info/layer.js), in stage px
      const m = INFO.margin, vw = innerWidth; let L = m, R = sb.width - m, T = m, B = sb.height - m;
      for (const r of rs) {
        const x0 = r.left - sb.left, x1 = r.right - sb.left, y0 = r.top - sb.top, y1 = r.bottom - sb.top;
        if (x1 <= 0 || x0 >= sb.width || y1 <= 0 || y0 >= sb.height) continue;
        if (r.left <= 24) L = Math.max(L, x1 + m); else if (r.right >= vw - 24) R = Math.min(R, x0 - m);
        else if ((y0 + y1) / 2 > sb.height / 2) B = Math.min(B, y0 - m); else T = Math.max(T, y1 + m);
      }
      return R - L < 120 ? { L: m, R: sb.width - m, T, B, m } : { L, R, T, B, m };
    }
    const at = (F, h, bottom) => (bottom ? F.B - seat.pad * (F.B - F.T) - h : F.T + seat.pad * (F.B - F.T));   // a body's top edge at its seat
    const layer = createInfoLayer({ stage: dom.stage, parallax: P.get('cursorAway'), drift: P.get('cursorDrift'), follow: P.get('cursorAway'),   // the CURSOR rows (off by default): the kit's own follow · parallax · drift
      avoid: () => {
        const rs = bars(), sb = dom.stage.getBoundingClientRect(), F = freeOf(rs, sb), h = block ? block.el.offsetHeight : 0, y = Math.max(F.T, at(F, h, seat.bottom)), x = sb.left + sb.width / 2;
        const band = (y0, y1) => ({ left: x - 1, right: x + 1, top: sb.top + y0, bottom: sb.top + y1 });
        return [...rs, band(0, y - F.m), band(y + h + F.m, sb.height)];
      } });
    const pop = el('div', 'lw-pop', dom.stage); pop.setAttribute('aria-hidden', 'true');
    layer.root.classList.add('lw-stage'); layer.root.setAttribute('aria-hidden', 'true');
    const stats = { renders: 0, announced: 0, places: 0, labelWrites: 0 };   // the gate's witnesses: KaTeX runs, banners, re-placements asked, letter moves
    let on = true, labelsOn = true, labelScale = 1, formula = '', banner = null, shown = '', lastRender = -1e9, wait = 0, fadeT = 0, popHold = 0;
    function show() {                                                // the markdown wanted now, as a new block if it changed and KaTeX's quarter second has passed
      if (!on) return;
      const md = banner !== null ? banner : formula;
      if (md === shown) return;
      const due = lastRender + KATEX_MS - performance.now();
      if (due > 0) { if (!wait) wait = setTimeout(() => { wait = 0; show(); }, due); return; }
      if (block) block.remove();
      block = md ? layer.addBlock({ md }) : null; shown = md;
      if (block) { block.el.toggleAttribute('data-fade', banner !== null); lastRender = performance.now(); stats.renders++; }
    }
    /* the racks hide, peek and slide (body classes), the transport docks or goes to the top, the TIMELINE opens or docks: only THOSE
       re-place the block — the play edge's frost-hold and the tablet's motion class are not a reason to read layout — and once more
       400 ms on, when the slide or the pill's dodge (a class first, then its arrival) has landed */
    let settle = 0;
    const place = (again = true) => { stats.places++; layer.viewChanged(); clearTimeout(settle); if (again) settle = setTimeout(place, 400, false); };
    const rackKey = () => ['rack-hidden', 'rack-peek', 'rack-l', 'ui-hidden', 'phone', 'transport-peek'].map((c) => +document.body.classList.contains(c)).join('');
    /* iteration 013 N2 (Josh: "When 'cursor' settings are off, the text should stay fixed and not sway"): the kit's layer parts its bodies from a
       moving pointer (mir/info/bodies.js, 260 px of reach) whatever follow and parallax say, so with PARALLAX and DRIFT off the layer is held by
       its own freeze while the pointer is within that reach of the block, and let go as it leaves (a rest that moved meanwhile is reached then);
       docs/FOR-MIR.md asks the kit for the switch */
    let stilled = false;
    const still = (v) => { if (v !== stilled) { stilled = v; layer.freeze(v); } };
    addEventListener('pointermove', (e) => {
      if (!block || P.get('cursorAway') || P.get('cursorDrift')) return still(false);
      const r = block.el.getBoundingClientRect(), dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right), dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
      still(Math.hypot(dx, dy) < 280);
    }, { passive: true });
    addEventListener('blur', () => still(false)); addEventListener('pointerout', (e) => { if (!e.relatedTarget) still(false); });
    let racksAt = rackKey();
    new MutationObserver(() => { const k = rackKey(); if (k === racksAt) return; racksAt = k; place(); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    for (const [n, f] of [[document.getElementById('transport'), ['class']], [app.state.tl && app.state.tl.root, ['hidden', 'style']]]) if (n) new MutationObserver(() => place()).observe(n, { attributes: true, attributeFilter: f });

    const labels = el('div', '', dom.stage); labels.id = 'atomLabels'; labels.setAttribute('aria-hidden', 'true'); labels.hidden = true;
    let cssW = dom.canvas.clientWidth, cssH = dom.canvas.clientHeight;
    if (typeof ResizeObserver === 'function') new ResizeObserver((e) => { const b = e[e.length - 1].contentRect; cssW = b.width; cssH = b.height; }).observe(dom.canvas);
    let atomsId = '', atoms = [], spans = [], labelsKey = '', placeKey = '';
    function atomLabels(id, obs, half) {
      if (!id || !labelsOn) { if (!labels.hidden) labels.hidden = true; labelsKey = placeKey = ''; return; }
      if (id !== atomsId) { atomsId = id; labelsKey = ''; }
      atoms = app.state.chem.atomsNow(); const at = atoms.map((a) => `${a.x.toFixed(3)},${a.y.toFixed(3)},${a.z.toFixed(3)}`).join(';');   // 0.7.0 V2: the nuclei AS DRAWN (V1 poses them), so the labels follow
      if (labelsKey !== id + '|' + labelScale) {
        labelsKey = id + '|' + labelScale; placeKey = '';
        labels.textContent = ''; spans = atoms.map((a) => el('span', 'atom-label', labels, ELEMENT[a.Z] || '?'));
        labels.style.fontSize = Math.round(14 * labelScale) + 'px';
      }
      labels.hidden = false;
      if (cssW < 32 || cssH < 32) return;
      const key = `${labelsKey}|${cameraKey(obs)}|${obs.dist}|${obs.fov}|${half}|${cssW}|${cssH}|${at}`;
      if (key === placeKey) return;
      placeKey = key; stats.labelWrites++;
      const S = toScreen(obs, half, cssW, cssH);
      for (let i = 0; i < atoms.length; i++) {
        const a = atoms[i], sp = spans[i], q = S.at(a.x, a.y, a.z);
        if (!q) { sp.style.display = 'none'; continue; }
        sp.style.display = ''; sp.style.transform = `translate(${q[0].toFixed(1)}px, ${q[1].toFixed(1)}px) translate(-50%, -50%)`;
      }
    }
    const api = app.state.stageText = {
      layer, stats, atomLabels,
      /** the formula's markdown ('' for none); the DOM moves only if the string did */
      setFormula(md) { formula = md || ''; if (banner === null) show(); },
      /** THE FADE: `md` in the formula's seat for `ttl` (0: until dismiss(md) — the molecule's head, D2), then its exit and the
       *  formula's return.  Only a HAND calls it. */
      announce(md, ttl = 2400) {
        if (!on || !md) return false;
        stats.announced++; clearTimeout(fadeT); banner = md; show();
        if (ttl) fadeT = setTimeout(() => { banner = null; show(); }, ttl);
        return true;
      },
      dismiss(md) { if (banner !== md) return; clearTimeout(fadeT); banner = null; show(); },
      /** a POP-UP: one short line on the side away from the formula that fades out; another press restarts it (iteration 001).
       *  { hold: true } (a dial under the hand, iteration 007): the line stays lit and follows the number, and fades 1.2 s after the last held one */
      pop(text, { hold = false } = {}) {
        if (!on || !text) return false;
        clearTimeout(popHold);
        const letGo = () => { popHold = setTimeout(() => pop.classList.replace('hold', 'out'), 1200); };   // the hand let go: the held line fades from where it is
        if (hold && pop.classList.contains('hold')) { if (pop.textContent !== text) pop.textContent = text; letGo(); return true; }
        const sb = dom.stage.getBoundingClientRect(), F = freeOf(bars(), sb);
        pop.textContent = text; pop.classList.remove('go', 'hold', 'out');
        pop.style.left = (sb.left + (F.L + F.R) / 2) + 'px'; pop.style.top = (sb.top + Math.max(F.T, at(F, pop.offsetHeight, !seat.bottom))) + 'px';
        void pop.offsetWidth; pop.classList.add(hold ? 'hold' : 'go'); if (hold) letGo(); return true;
      },
      /** THE ONE VERB an emitter speaks through (iteration 007): `kind` is a row of KINDS; nothing is written while that kind's switch is off */
      say(kind, text, o = {}) {
        const k = KIND.get(kind); if (!k || !P.get(k.key)) return false;
        return k.seat === 'fade' ? api.announce(text, o.ttl) : k.seat === 'pop' ? api.pop(text, o) : false;
      },
      /** is this kind on? (THE HEAD asks before it waits for a landing) */
      wants: (kind) => { const k = KIND.get(kind); return !!(k && on && P.get(k.key)); },
      /** the record (lambdawaves.q0.info): INFORMATIONAL writes it, the gate may */
      prefs: P,
      /** POSITION (bottom: true) and PAD (0–0.4 of the free height) */
      setSeat(bottom, pad) { if (bottom !== undefined) seat.bottom = !!bottom; if (Number.isFinite(pad)) seat.pad = Math.max(0, Math.min(0.4, pad)); place(); },
      get seat() { return { ...seat }; },   // a later announcement has already taken the seat: nothing
      /** STAGE FORMULA (the formula, the fade, the caption) and ATOM LABELS are two switches since 0.5.3 M9 (INFORMATIONAL) */
      setOn(v) { on = !!v; layer.root.hidden = !on; show(); }, setLabels(v) { labelsOn = !!v; }, setLabelScale(s) { labelScale = s; labelsKey = ''; },
      /** SIZE: the type × s (lab.css), then a re-measure — setPane(false) measures every bare block again (layer.js) */
      setScale(s) { layer.root.style.setProperty('--lw-stage-size', String(s)); stats.places++; layer.setPane(false); },
      /** the pop-ups' SIZE (× 15 px), apart from the formula's since iteration 007 */
      setPopScale(s) { pop.style.setProperty('--lw-pop-size', String(s)); },
      get on() { return on; }, get labelsOn() { return labelsOn; }, get md() { return shown; }, get formula() { return formula; }, get banner() { return banner; },
    };
    /* THE RECORD APPLIED: every row at the go, then each change (INFORMATIONAL, FORGET).  The kit's createPrefs coalesces its page writes under ONE
       frame key ('mir.prefs') whatever the store, so a set here could take the look's pending job; this record writes nothing to the page, and the
       look's job is booked again after it (a MIR issue, filed in I-BUILD.md) */
    const applyInfo = (st, changed) => {
      const all = !changed, ch = (k) => all || changed.includes(k);
      if (ch('molFormula')) { document.body.classList.toggle('no-mol-formula', !st.molFormula); api.setOn(st.molFormula); }
      if (ch('molFormulaSize')) api.setScale(st.molFormulaSize);
      if (ch('atomLabels')) api.setLabels(st.atomLabels);
      if (ch('atomLabelsSize')) api.setLabelScale(st.atomLabelsSize);
      if (all || ch('infoPos') || ch('infoPad')) api.setSeat(st.infoPos === 'bottom', st.infoPad);
      if (ch('popSize')) api.setPopScale(st.popSize);
      if (!all && ch('cursorAway')) { layer.setFollow(st.cursorAway); layer.setParallax(st.cursorAway); }
      if (!all && ch('cursorDrift')) layer.setDrift(st.cursorDrift);
      if (!all && (ch('molName') || ch('listCap'))) { stageSrc.v = -1; stageTextTick(); }   // iteration 011 Q1: the cap re-writes the list at once
      if (!all) { look.prefs.apply(); schedule(TIER.PRESENT); }   // the atom labels are the frame's
    };
    applyInfo(P.all()); P.subscribe(applyInfo);
    wChem.root.addEventListener('change', stageTextTick);           // the pick lands in `preset` at once; the solve comes later
    app.state.chem.subscribe(() => stageTextTick());                         // … and a restore / undo / link that re-solves
    paintMarks(); stageTextTick();
  }
  return { stageCaption, stageTextTick, initStageText };
}
