/* orbitalsview.js — ORBITALS: THE MOLECULAR REGISTER (MATH-H2O-2026-09-11, Proposition 1).
 *
 * Hydrogen has a STATE window and a SPECTRUM window; a molecule gets CHEMISTRY and this one, and this
 * one is the register.  The ladder is CHEMISTRY's canonical orbitals φ_k = Σ_μ C_μk χ_μ with their
 * energies ε_k, and the register is the one-electron amplitude over them:
 *
 *     ψ(r, t) = Σ_k c_k e^{−i ε_k t} φ_k(r),      c_k = |c_k| e^{i arg c_k}
 *
 * which is EXACTLY hydrogen's register with the molecule's ladder in place of −1/2n².  It is where a
 * molecule's `arg` lives: the ground-state density ρ = Σ D_μν χ_μ χ_ν is real and has no argument, and
 * so does |ψ|²'s own density, but ψ does — so the field's `phase` view has something to show.
 *
 * THE ONE LABEL THIS WINDOW MUST NEVER GET WRONG.  A HOMO + LUMO superposition beats at the FROZEN-ORBITAL
 * (Koopmans) gap Δε = ε_LUMO − ε_HOMO, with period 2π/Δε.  That is NOT the RPA excitation energy
 * ω = √((Δε + 2K − J)² − K²) that CHEMISTRY's sticks stand at.  For H₂O/STO-3G Δε = 0.996409 (T = 6.3058 a.u.)
 * while ω_RPA = 0.483101 — a factor of two apart.  Every readout here says "frozen orbitals · beats at Δε,
 * not at ω_RPA", because a beat labelled as an excitation would be a lie the picture cannot correct.
 *
 * THE FIELD.  This window is a PRODUCER of lab/molecular-session.js's 'orbital-packet' model: each frame it
 * contracts ψ's complex AO vector (nAO complex MACs — negligible beside the kernel's 1.3k MACs a voxel) and
 * hands the session one tagged product, which the session paints if this model is the selected one.
 * It does NOT own the molecule: CHEMISTRY uploads the shells, so CHEMISTRY must be ON, and the real-time run
 * OUTRANKS this model, so while it propagates the session simply does not select the register.  That used to be
 * a `refusal()` dance and a push ORDER in the frame loop; the refusal survives only as the sentence the interface
 * shows, and it asks the session for its reason rather than polling CHEMISTRY's state thirty times a second.
 */
import { el, knob, sw, readout, graphHover, themeInk, accentRGB, fitText, chip } from './mir/kit.js';
import { paintStroke, fillButton } from './paint-stroke.js'; import { createMorph } from './register-morph.js'; import { fold } from './fold.js';
import { createFlow } from './molecular-flow.js';
import { forms, frontierName, ionisation, orbitalName } from './names.js';

const DEG = 1e-6;                       // |Δε| below this is one degenerate row, drawn side by side
const TAU = 2 * Math.PI;
const LAW = 'frozen orbitals · beats at Δε, not at ω_RPA';
/* iteration 007 B (ADR-0002) · THE ORBITAL REGISTER's A ↔ B IS ITS OWN TARGET.  Its id lives here, once: shell/modulation.js registers it
   (a `defs` row), shell/persist.js seats its base (modSeats), and the knob's hand law below asks it.  `reg.morph` stays the STATES register's. */
export const OMORPH = 'reg.omorph';

export function createOrbitals(host, api) {
  const F = () => (api.field ? api.field() : null);
  const C = () => (api.chem ? api.chem() : null);
  const S = () => api.session || null;
  const now = () => (api.now ? api.now() : 0);
  const status = (t, cls) => { statusText = t; if (api.status) api.status(t, cls === undefined ? '' : cls); };
  /* THE HAND LAW (the MIR check's B2, as statesview.js): a hand on the ROUTED A ↔ B moves its BASE through the port and applies nothing itself */
  const hand = (id, v) => !!(api.modHand && api.modHand(id, v));

  let sol = null, on = false, active = api.active ? !!api.active() : true;
  let statusText = 'no molecule solved yet', unsub = null, wanted = null;
  let re = null, im = null, re64 = null, im64 = null, pushedT = NaN, pushedV = -1, version = 0, selected = -1;
  const sel = new Map();                // k → { amp, phase } — the register's own coefficients

  /* ── the ladder ───────────────────────────────────────────────────────────────────────────────── */
  const cv = el('canvas', 'mol-c', host);
  cv.title = 'The molecular orbital ladder: ε_k in hartree, occupied levels filled and virtual ones hollow, degenerate levels side by side. '
    + 'Left-click a level to put it in the register, right-click to take it out; left-drag paints every level you cross in, right-drag paints them out — a stroke down the ladder takes them all, one along a degenerate row takes its levels one by one. The axis is order-exact but not linear: every gap is drawn to scale '
    + 'up to three times the median gap and compressed beyond it, because H₂O’s O 1s at −20.24 would otherwise put the whole valence inside four pixels.';

  /* ── the head: the same four controls SPECTRUM's head carries, in the same order ──────────────── */
  const head = el('div', 'row tight sp-head', host);
  const dialsBtn = el('button', 'trig', head); dialsBtn.type = 'button'; dialsBtn.textContent = 'DIALS';
  dialsBtn.title = 'Show or hide the amplitude and phase dials for the selected orbitals';
  dialsBtn.setAttribute('aria-expanded', 'false');
  /* iteration 008 U (Josh: "can it become the 'fill all registers' button?") · ONE two-state button: an empty register shows FILL ALL, any
     other shows EMPTY.  NORM is gone: a HAND stroke on the ladder normalises at its end (the stroke's one undo row), and nothing else does */
  const fillB = fillButton(head, { fill: 'Fill the register: every orbital of the ladder, equal and in phase', empty: 'Empty the register (c ↦ 0 for every orbital)' },
    (empty) => (empty ? fill() : clear()));
  /* THE CORE FOLD (0.4.0 S1): the frozen-core levels (lab/names.js coreCount — He for Li–Ne, Ne for Na–Ar, Ar for K–Zn,
     Ar + 3d¹⁰ for Ga–Kr) fold into one `core ×n` rung, opened by this button or a click on the rung.  Folded by default;
     the open state is the card's WORKSPACE key (rack.js captureLayout `core`), never a project's work. */
  let coreOpen = false;
  const coreBtn = el('button', 'trig orb-core-toggle', head); coreBtn.type = 'button'; coreBtn.textContent = 'CORE';
  coreBtn.title = 'Fold or unfold the frozen-core levels (one `core ×n` rung on the ladder)';
  coreBtn.setAttribute('aria-expanded', 'false'); coreBtn.hidden = true;
  const setCoreOpen = (v) => { coreOpen = !!v; coreBtn.setAttribute('aria-expanded', String(coreOpen)); coreBtn.classList.toggle('on', coreOpen); paint(); };
  coreBtn.addEventListener('click', () => setCoreOpen(!coreOpen));
  const nCore = () => (sol && sol.names && sol.names.core) || 0;

  /* THE SHARED BAR (REGISTER-WINDOW-SPEC §5, §9): the same PRESET · → A · → B · MORPH the STATES mode carries.  A preset
     is a RULE, so it exists for every molecule or says why not; MORPH plays the normalised path between two stored
     registers — for orthogonal stores cos/sin, hydrogen's TRANSITION envelope — and is a performance path, not dynamics. */
  /* 0.5.3 M10 · THE ORBITAL PRESETS ARE ONE TABLE (R4): name → [the levels it takes, by k, from the HOMO h and the LUMO l; the sentence it
     refuses with; the phases, 0 unless named].  Amplitudes are equal, √(1/n).  A level a frontier record does not carry (C₆₀: cols
     175–182) refuses with the record's own sentence.  σ + σ* is struck: ε alone cannot pair a bonding orbital with its antibonding one. */
  const NO_VIRTUAL = 'this basis has no virtual orbital';
  const level = (k) => { let a = k, b = k; while (a > 0 && Math.abs(sol.eps[a - 1] - sol.eps[k]) < DEG) a--; while (b + 1 < sol.nAO && Math.abs(sol.eps[b + 1] - sol.eps[k]) < DEG) b++; return Array.from({ length: b - a + 1 }, (_, i) => a + i); };
  const pairAt = (k) => carried(k) && carried(k + 1) && Math.abs(sol.eps[k + 1] - sol.eps[k]) < DEG;
  const ORB_PRESETS = {
    'HOMO': [(h) => [h], ''], 'LUMO': [(h, l) => [l], NO_VIRTUAL], 'HOMO + LUMO': [(h, l) => [h, l], NO_VIRTUAL],
    'FRONTIER FOUR': [(h, l) => [h - 1, h, l, l + 1], 'it needs two occupied and two virtual orbitals'],
    'HOMO SET': [(h) => level(h), ''], 'LUMO SET': [(h, l) => level(l), NO_VIRTUAL],
    'WINDING': [(h, l) => { let k = pairAt(h - 1) ? h - 1 : pairAt(l) ? l : -1; for (let q = sol.nAO - 2; k < 0 && q >= 0; q--) if (pairAt(q)) k = q; return k < 0 ? null : [k, k + 1]; },
      'no degenerate orbital pair in this molecule — a winding phase needs a twofold level', [0, Math.PI / 2]],
    'OCCUPIED': [(h) => { const c = Math.min(nCore(), h); return Array.from({ length: h + 1 - c }, (_, i) => c + i); }, ''],
  };
  const bar = el('div', 'row tight reg-bar', host);
  const presetSel = el('select', 'sel', bar); presetSel.setAttribute('aria-label', 'register preset');
  presetSel.title = 'HOMO, LUMO: one orbital. HOMO + LUMO: the frozen-orbital beat. FRONTIER FOUR: HOMO−1 to LUMO+1, four orbitals. HOMO SET, LUMO SET: the whole degenerate level. '
    + 'WINDING: a degenerate orbital pair a quarter turn apart — a phase that winds around the ring under a stationary density. OCCUPIED: every valence orbital, equal phase';
  { const o = el('option', '', presetSel, 'PRESET…'); o.value = ''; for (const p of Object.keys(ORB_PRESETS)) { const q = el('option', '', presetSel, p); q.value = p; } }
  /* a HAND's preset is announced on the stage (0.4.0 S3 · F2) by its rule and the orbitals the names give it —
     `WINDING · $1e_{1g}$ (a) + (b)`, `HOMO + LUMO · $1b_{1}$ + $4a_{1}$`; preset() itself (an API, a restore) says nothing */
  presetSel.addEventListener('change', () => { const p = presetSel.value; presetSel.value = ''; if (p && preset(p) && api.announce) api.announce(presetMd(p)); });
  function presetMd(name) {
    const mos = keys().map(moOf);
    if (!mos.length || !mos.every((m) => m && m.label)) return name;
    const set = mos.length > 1 && mos.every((m) => m.label === mos[0].label && m.member);   // one degenerate level: its name once, then its members
    return name + ' · ' + (set ? `${forms(mos[0].label).latex} ` + mos.map((m) => `(${m.member})`).join(' + ') : mos.length > 4 ? mos.length + ' orbitals' : mos.map((m) => forms(m).latex).join(' + '));
  }
  const mrow = el('div', 'row tight reg-morph', host);
  /* A ↔ B (register-morph.js, one for both panes): its own target OMORPH; a store marks the register, a MORPH change repaints */
  const M = createMorph({ bar, row: mrow, id: OMORPH, key: 'k', lanes: 'dials', knobTitle: 'Where on the path from A (0) to B (1) the register plays', hand, status,
    rows: () => rowsEl, valid: (k) => !!sol && k >= 0 && k < sol.nAO, snapshot: () => { const S = new Map(); for (const [k, c] of sel) if (c.amp > 0) S.set(k, { re: c.amp * Math.cos(c.phase), im: c.amp * Math.sin(c.phase) }); return S; },
    stored: () => touch(), changed: () => { touch(); api.repaint(); } });
  /* FLOW for one orbital: ρ = |ψ|² and j = Im ψ̄∇ψ = ρ ∇arg ψ — the tracers ride the gradient of the very phase the field
     is coloured by.  A WINDING orbital circulates; a real orbital stands still.  The packet IS ψ: its f64 AO vector goes to
     the flow whole (`setPacket`, O(n) a point, any size), so there is no D_μν = c̄_μ c_ν to build and none to transpose. */
  let flowOn = false, flow = null, flowEpoch = 0;
  const flowSw = sw({ label: 'FLOW', value: false, title: 'Tracers on the stage riding this orbital’s current j = Im ψ̄∇ψ — the gradient of the phase you see', onChange: (v) => setFlow(v) });
  mrow.appendChild(flowSw.root);
  /* iteration 001 (Josh): PRESET · → A · → B and MORPH · FLOW fold behind the head's chevron (lab/fold.js); DIALS and CLEAR are glyphs */
  { const more = el('div', 'reg-more'); bar.before(more); more.append(bar, mrow); fold(head, more, { what: 'presets, A ↔ B and flow' });
    chip(dialsBtn, 'sliders', 'DIALS'); }
  function setFlow(v) {
    flowOn = !!v && !!sol; flowSw.set(flowOn);
    if (flowOn && (!flow || flow.n !== sol.nAO)) { flow = createFlow(sol.shells); flowEpoch++; }
    if (flowOn) { pushedV = -1; if (on) push(now(), true); }
    api.repaint(); return flowOn;
  }

  const rowsEl = el('div', 'sp-rows', host); rowsEl.hidden = true;
  dialsBtn.addEventListener('click', () => setDials(rowsEl.hidden));

  /* ── the readouts ─────────────────────────────────────────────────────────────────────────────── */
  const rr = el('div', 'row tight', host);
  const roGap = readout({ label: '<m>Δε</m>  (hartree)', value: '—', sub: '' });
  const roBeat = readout({ label: 'BEAT  <m>2π/Δε</m>', value: '—', sub: '' });
  const roSum = readout({ label: '<m>Σ|c|²</m>', value: '—', sub: '' });
  const roPsi = readout({ label: '<m>ψ(t)</m>', cls: 'wide', value: '—', sub: LAW });
  for (const r of [roGap, roBeat, roSum, roPsi]) rr.appendChild(r.root);
  el('div', 'note', host).innerHTML = '<b>Model.</b> The one-electron register over MOLECULES’ canonical orbitals: '
    + '<m>ψ(r, t) = Σ_k c_k e^{−iε_k t} φ_k(r)</m> with <m>φ_k = Σ_μ C_μk χ_μ</m> — hydrogen’s register with the molecule’s ladder. '
    + 'The ladder is <b>frozen</b>: a HOMO + LUMO pair beats at the Koopmans gap <m>Δε</m>, not at the RPA excitation <m>ω</m> the '
    + 'MOLECULES sticks stand at. Occupancies are the ground state’s; putting a virtual orbital in the register does not excite the molecule, '
    + 'it asks what one electron in that superposition would look like. The field shows <m>arg ψ</m> in PHASE and <m>|ψ|²</m> in DENSITY.';

  /* ── the register ─────────────────────────────────────────────────────────────────────────────── */
  const nAO = () => (sol ? sol.nAO : 0);
  const nocc = () => (sol ? sol.nocc : 0);
  /* 0.5.3 M2 · a FRONTIER record (C₆₀) carries 8 of its 300 columns (`sol.cols`): a level it does not carry is drawn dim and no hand
     reaches it — select, a paint stroke and a crossed row all skip it — so the refusal() below is never one click away */
  const carried = (k) => !!sol && k >= 0 && k < sol.nAO && (!sol.cols || sol.cols.includes(k));
  const colsWhy = () => `this record carries orbitals ${sol.cols[0] + 1}–${sol.cols[sol.cols.length - 1] + 1} only (its HOMO and LUMO sets)`;   // 0.4.0 S4c: a frontier record
  /* THE NAMES (0.4.0 S1, lab/names.js): the worker names the ladder with the solve.  A rung reads `1b1 · HOMO`, `3a1`,
     `1e1g (a)`; a degenerate HOMO is ONE HOMO (the frontier is by level).  No name (refused, C₁, unconverged): the
     frontier word by level, and the hover says why. */
  const moOf = (k) => (sol && sol.names && sol.names.mos ? sol.names.mos[k] || null : null);
  const frontierOf = (k) => { const mo = moOf(k); return mo ? mo.frontier : frontierName(k - (sol.nocc - 1)); };
  const label = (k) => (sol ? orbitalName(sol.names, k, sol.nocc) : 'k' + (k + 1));
  /** the typeset name into a DOM node: the subscript in a real <sub> (a text node cannot subscript g) */
  function writeName(node, k) {
    const mo = moOf(k);
    node.textContent = '';
    if (!mo || !mo.label) { node.textContent = label(k); return; }
    const p = forms(mo).parts, fr = frontierOf(k);
    node.appendChild(document.createTextNode(p.count + p.body));
    if (p.sub) el('sub', null, node, p.sub);
    const tail = p.mark + (mo.member ? ` (${mo.member})` : '') + (/^(HOMO|LUMO)$/.test(fr) ? ' · ' + fr : '');
    if (tail) node.appendChild(document.createTextNode(tail));
  }
  /** what a hover says about a name: the frame, where it came from, and why there is none */
  function about(k) {
    const N = sol && sol.names, mo = moOf(k);
    if (!N) return '';
    if (!mo || !mo.label) return 'no symmetry name: ' + (N.reason || 'not named');
    const out = [`${forms(mo).plain} in ${N.group} (${N.frame}) — computed from the solve's characters`];
    if (mo.member) out.push(`(${mo.member}) is one of the ${mo.dim === 2 ? 'two real combinations of the degenerate pair' : mo.dim + ' real combinations of the degenerate set'}`);
    if (N.approximate) out.push(`approximate symmetry: the framework is ${N.group} to ${N.approximate.geometryBohr.toExponential(1)} bohr`);
    if (N.downgraded) out.push('named in the exact subgroup — ' + N.downgraded);
    if (mo.aliases && mo.aliases.length) out.push('other axis convention: ' + mo.aliases.map((a) => forms(a).plain).join(' / '));
    const ch = mo.character;
    if (ch && (ch.lcao || ch.kind)) out.push(`${ch.lcao || ch.kind}${ch.bonding ? ', ' + ch.bonding : ''} — derived`);
    const ie = ionisation(String(sol.key || '').split('|')[0], mo, sol.eps[k]);
    if (ie) out.push(`vertical IE ${ie.ev.toFixed(2)} eV beside Koopmans −ε ${ie.koopmansEv.toFixed(2)} eV — curated (${ie.source})`);
    return out.join(' · ');
  }
  const touch = () => { version++; pushedV = -1; };
  /** the register's own list, ascending in k: the one order every reader here uses */
  const keys = () => [...sel.keys()].sort((a, b) => a - b);
  const sum2 = () => { let s = 0; for (const c of sel.values()) s += c.amp * c.amp; return s; };
  /** the two strongest selected levels, and the gap between them — what the beat readout is about */
  function pair() {
    const ks = keys().sort((a, b) => (sel.get(b).amp - sel.get(a).amp) || (a - b));
    if (ks.length < 2 || !sol) return null;
    const dE = Math.abs(sol.eps[ks[1]] - sol.eps[ks[0]]);
    return { a: ks[0], b: ks[1], dE, period: dE > 1e-12 ? TAU / dE : Infinity };
  }

  function select(k, amp = 1, phase = 0) {
    if (!carried(k)) return false;
    sel.set(k | 0, { amp: Math.max(0, Math.min(1, +amp || 0)), phase: ((+phase || 0) % TAU + TAU) % TAU });
    selected = k | 0; touch(); rebuild(); paint(); refresh(); api.repaint(); return true;
  }
  function deselect(k) { if (!sel.delete(k | 0)) return false; if (selected === (k | 0)) selected = -1; touch(); rebuild(); paint(); refresh(); api.repaint(); return true; }
  function toggle(k) { return sel.has(k | 0) ? deselect(k) : select(k, 1, 0); }
  /** a PAINT stroke's levels in one pass: on ⇒ every level not already in the register joins at the register's mean |c| (1 when empty),
   *  arg 0, so the stroke's closing normalisation keeps an even register even (a level already there keeps its dials); off ⇒ each leaves.
   *  One rebuild / paint / repaint however many levels it covers. */
  function paintLevels(ks, on) {
    if (!sol || !ks.length) return 0;
    let n = 0, mean = 0; for (const c of sel.values()) mean += c.amp; mean = sel.size ? mean / sel.size || 1 : 1;
    for (const k0 of ks) {
      const k = k0 | 0; if (!carried(k)) continue;
      if (on) { if (sel.has(k)) continue; sel.set(k, { amp: mean, phase: 0 }); selected = k; n++; }
      else if (sel.delete(k)) { if (selected === k) selected = -1; n++; }
    }
    if (n) { touch(); rebuild(); paint(); refresh(); api.repaint(); }
    if (n && on && api.pop) { const L = label(selected), fr = frontierOf(selected); api.pop((n > 1 ? '+' + n + ' · ' : '+ ') + (L.includes(fr) ? L : L + ' · ' + fr)); }   // iteration 001: the level a hand just added, on the stage
    return n;
  }
  function clear() { if (!sel.size) return false; sel.clear(); selected = -1; touch(); rebuild(); paint(); refresh(); api.repaint(); return true; }
  /** FILL ALL: every orbital the ladder carries, |c| = 1/√n, arg 0 — the OCCUPIED / virtual split is the ladder's own order */
  function fill() {
    if (!sol) return false;
    const ks = []; for (let k = 0; k < sol.nAO; k++) if (carried(k)) ks.push(k);
    if (!ks.length) return false;
    sel.clear(); for (const k of ks) sel.set(k, { amp: Math.sqrt(1 / ks.length), phase: 0 }); selected = sol.nocc - 1;
    touch(); rebuild(); paint(); refresh(); api.repaint(); return true;
  }
  /** Σ|c|² ↦ 1: the END of a hand's paint stroke (iteration 008 U), and the API's `norm` — never a modulator's write, never on its own */
  function norm() {
    const s = Math.sqrt(sum2());
    if (!(s > 0)) return false;
    for (const c of sel.values()) c.amp = Math.min(1, c.amp / s);
    touch(); rebuild(); paint(); refresh(); api.repaint(); return true;
  }
  function preset(name) {
    const P = ORB_PRESETS[name];
    if (!sol || !P) return false;
    const ks = P[0](sol.nocc - 1, sol.nocc), why = !ks || !ks.every((k) => k >= 0 && k < sol.nAO) ? P[1] : !ks.every(carried) ? colsWhy() : null;
    if (why) { status(`${name}: ${why}`, 'warn'); return false; }
    sel.clear(); for (const [i, k] of ks.entries()) sel.set(k, { amp: Math.sqrt(1 / ks.length), phase: P[2] ? P[2][i] : 0 }); selected = ks[0];
    touch(); rebuild(); paint(); refresh(); api.repaint(); return true;
  }
  function setAmp(k, v) { const c = sel.get(k); if (!c) return; c.amp = Math.max(0, Math.min(1, v)); touch(); paint(); refresh(); api.repaint(); }
  function setPhase(k, v) { const c = sel.get(k); if (!c) return; c.phase = ((v % TAU) + TAU) % TAU; touch(); paint(); refresh(); api.repaint(); }

  /* ── the field ────────────────────────────────────────────────────────────────────────────────── */
  /** why the register may NOT hold the field right now, or null when it may.  The RT-run clause is the session's
   *  own answer — a boolean read of one model's claim, where this used to build CHEMISTRY's thirty-field state()
   *  object and cache it for 200 ms to keep that allocation off the frame loop. */
  function refusal() {
    const c = C();
    if (!c) return 'no MOLECULES window';
    if (!c.on) return 'MOLECULES OFF: the register needs its molecule on the field';
    if (!sol) return 'no molecule solved yet';
    if (sol.cols && keys().some((k) => !sol.cols.includes(k))) return colsWhy();
    const s = S();
    if (s && s.claimed('tdhf')) return 'MOLECULES RT RUN has the field: stop the run to take it';
    const f = F();
    if (!f || !f.ok) return 'no WebGPU field';
    if (!f.molecular) return 'the field is not molecular yet';
    return null;
  }
  const vec = { re: null, im: null };                 // the pushed pair, reused: the frame loop allocates nothing
  const product = { kind: 'orbital', matrix: vec, view: 'phase', hash: null, solution: -1 };   // and so is the product record
  /** ψ's complex AO vector at t: re/im = Σ_k |c_k| e^{i(arg c_k − ε_k t)} C[:, k] — nAO complex MACs a frame, summed in f64 and cast
   *  to the field's f32 ONCE (0.5.4 P7a; the reused scratch is the frame loop's one addition — tools/perf/packet-precision.mjs measures it) */
  function vectors(t) {
    const n = nAO();
    if (!re || re.length !== n) { re = new Float32Array(n); im = new Float32Array(n); vec.re = re; vec.im = im; re64 = new Float64Array(n); im64 = new Float64Array(n); }
    re64.fill(0); im64.fill(0);
    const add = (k, amp, phase) => {
      if (!(amp > 0) || !(k >= 0) || k >= n) return;
      const th = phase - sol.eps[k] * t, cr = amp * Math.cos(th), ci = amp * Math.sin(th);
      for (let mu = 0; mu < n; mu++) { const w = sol.C[mu * n + k]; if (w === 0) continue; re64[mu] += cr * w; im64[mu] += ci * w; }
    };
    const path = M.path();
    if (path) for (const [k, c] of path) add(k, Math.hypot(c.re, c.im), Math.atan2(c.im, c.re));
    else for (const [k, c] of sel) add(k, c.amp, c.phase);
    re.set(re64); im.set(im64);
    return vec;
  }
  /** push ψ(t) — only when t or the register moved, so a paused transport does not chase its own repaint.
   *  There is no third reason any more: with one owner the volume cannot be taken out from under this model
   *  while it is the selected one, so the old `moleculeComplex` re-take check has nothing left to catch. */
  function push(t, force) {
    const s = S(); if (!s || !sol) return false;
    if (!force && t === pushedT && version === pushedV) return false;
    product.matrix = vectors(t); product.hash = sol.hash; product.solution = Number.isFinite(sol.seq) ? sol.seq : 0;
    if (!s.publish('orbital-packet', product)) return false;
    if (flowOn && flow) flow.setPacket(re64, im64);
    pushedT = t; pushedV = version;
    return true;
  }
  /** the CLAIM: take (true) or release the field — registerview's follow() is its only caller from outside (ON is the one switch's, api.one) */
  function claim(v) {
    const want = !!v;
    if (want && !on) {
      const why = refusal();
      if (why) { status('REGISTRY off — ' + why, 'warn'); return false; }
      on = true;
      pushedT = NaN; pushedV = -1;
      /* the claim is the whole handover: the session selects this model, asks for `phase`, and calls push() */
      if (S()) S().claim('orbital-packet', true, 'the ORBITALS register has the field');
    } else if (!want && on) {
      on = false;
      pushedT = NaN; pushedV = -1;
      /* and letting go is the same act in reverse: the session hands the field to the next model by RANK — the
         card if it is on, the user's own observable if nothing claims it — never by guessing a view here */
      if (S()) S().claim('orbital-packet', false, 'MO-REGISTRY OFF');
      api.repaint();
    }
    refresh();
    return on;
  }

  /* ── the dials ────────────────────────────────────────────────────────────────────────────────── */
  const lanes = new Map();
  function lane(k) {
    const c = sel.get(k);
    const root = el('div', 'row tight orb-lane'); root.dataset.k = String(k);
    const id = el('div', 'sp-id', root);
    const nm = el('div', 'sp-name sp-nm', id); writeName(nm, k); nm.title = about(k);
    const es = el('div', 'sp-sub sp-e', id, `k${k + 1} · ${sol.eps[k].toFixed(6)} Eh · ${k < nocc() ? '2 e⁻' : 'virtual'}`);
    id.addEventListener('click', () => { selected = k; paint(); markSel(); });
    const amp = knob({ label: '<m>|c|</m>', aria: 'amplitude ' + label(k), min: 0, max: 1, value: c.amp,
      title: 'The amplitude |c_k| of this orbital in the register; a stroke on the ladder makes Σ|c|² = 1',
      fmt: (v) => v.toFixed(3), onInput: (v) => setAmp(k, v) });
    const ph = knob({ label: '<m>arg c</m>', aria: 'phase ' + label(k), min: 0, max: TAU, value: c.phase, wrap: true,
      title: 'The phase arg c_k at t = 0; the register turns it by −ε_k t on its own',
      fmt: (v) => (v * 180 / Math.PI).toFixed(0) + '°', onInput: (v) => setPhase(k, v) });
    root.appendChild(amp.root); root.appendChild(ph.root);
    const x = el('button', 'sp-x', root, '×'); x.type = 'button';
    x.title = 'Take this orbital out of the register'; x.setAttribute('aria-label', 'remove ' + label(k));
    x.addEventListener('click', () => deselect(k));
    return { root, amp, ph, nm, es, k };
  }
  function markSel() { for (const [k, L] of lanes) L.root.classList.toggle('sel', k === selected); }
  function rebuild() {
    const want = sol ? keys() : [];
    const keep = new Set(want);
    for (const [k, L] of lanes) if (!keep.has(k)) { L.root.remove(); lanes.delete(k); }
    let prev = null;
    for (const k of want) {
      let L = lanes.get(k);
      if (!L) { L = lane(k); lanes.set(k, L); }
      if (prev ? prev.nextSibling !== L.root : rowsEl.firstChild !== L.root) rowsEl.insertBefore(L.root, prev ? prev.nextSibling : rowsEl.firstChild);
      prev = L.root;
    }
    markSel();
  }
  const setDials = (v) => { rowsEl.hidden = !v; dialsBtn.classList.toggle('on', !!v); dialsBtn.setAttribute('aria-expanded', String(!!v)); };

  /* ── the readouts, and the header ─────────────────────────────────────────────────────────────── */
  function refresh() {
    fillB.set(!sel.size, !!sol);
    if (!sol) {
      for (const r of [roGap, roBeat, roSum, roPsi]) { r.set('—', ''); }
      roPsi.setSub(LAW);
      status('no molecule solved yet — MOLECULES solves the ladder this register runs on', '');   // not a fault: MO-REGISTRY sits on the first-run rack before anything is solved
      return;
    }
    const eH = sol.eps[sol.nocc - 1], eL = sol.eps[sol.nocc];
    const gap = Number.isFinite(eL) ? eL - eH : NaN;
    roGap.set(Number.isFinite(gap) ? gap.toFixed(6) : '—', '');
    roGap.setSub(Number.isFinite(gap) ? `ε_LUMO ${eL.toFixed(6)} − ε_HOMO ${eH.toFixed(6)} · Koopmans, frozen` : 'no virtual orbital');
    const p = pair();
    roBeat.set(p && Number.isFinite(p.period) ? p.period.toFixed(4) : '—', p ? 'ok' : '');
    roBeat.setSub(p ? `${label(p.a)} × ${label(p.b)} · Δε ${p.dE.toFixed(6)} · ${LAW}` : 'select two orbitals to beat');
    const s = sum2();
    roSum.set(sel.size ? s.toFixed(6) : '—', sel.size ? (Math.abs(s - 1) < 1e-9 ? 'ok' : 'warn') : '');
    roSum.setSub(`${sel.size} of ${sol.nAO} orbitals · ${sol.nocc} occupied · a stroke on the ladder sets this to 1`);
    const why = refusal();
    /* 2026-10 (Josh) · MOLECULES OFF IS NOT A FAULT.  The window stays on the rack with its ladder painted and editable;
       only the switch stands down (it must let go of the field), and the status says how to bring it back. */
    const standby = !on && (!C() || !C().on);
    status(on ? `REGISTRY · ${sel.size} orbital${sel.size === 1 ? '' : 's'} · ${LAW}`
      : standby ? `the register stands by · ${sol.nAO} orbitals · MOLECULES ON, then VIEW REGISTRY`
      : why ? 'REGISTRY off — ' + why : `${sol.nAO} orbitals · gap ${Number.isFinite(gap) ? gap.toFixed(6) : '—'} · VIEW REGISTRY gives the field arg ψ`,
      on ? 'live' : standby ? '' : why ? 'warn' : 'ok');
    paintPsi(pushedT);
  }
  let psiWall = 0;
  /** the ψ(t) line at 5 Hz — the rack's own cadence for a number a reader is meant to read */
  function paintPsi(t) {
    const nowMs = performance.now();
    if (nowMs - psiWall < 200) return;
    psiWall = nowMs;
    if (!sol || !sel.size) { roPsi.set('—', ''); roPsi.setSub(LAW); return; }
    const tt = Number.isFinite(t) ? t : now();
    const parts = keys().map((k) => {
      const c = sel.get(k), th = ((c.phase - sol.eps[k] * tt) % TAU + TAU) % TAU;
      return `${label(k)} ${c.amp.toFixed(3)}∠${(th * 180 / Math.PI).toFixed(0)}°`;
    });
    roPsi.set(parts.join('  ·  '), on ? 'live' : '');
    roPsi.setSub(`t = ${tt.toFixed(3)} a.u.  ·  ${LAW}`);
  }

  /* ── THE LADDER, ON A CANVAS, IN THIS THEME'S INK ─────────────────────────────────────────────────
   * ε_k in hartree, ascending upward, occupied levels filled and virtual ones hollow.  THE AXIS IS
   * SOFT-CAPPED and says so: H₂O's O 1s sits at −20.24 against a −0.39 HOMO — 90 % of the whole span in
   * ONE gap — so a linear axis would put six of the seven levels inside four pixels and the HOMO/LUMO gap,
   * the whole point of the window, would be invisible.  Each inter-level gap is drawn TO SCALE up to three
   * times the MEDIAN gap and clamped there; the heights are then renormalised to the plot.  The map is
   * strictly monotone, so the order is exact and every gap at or below the cap keeps its true ratio — for
   * H₂O/STO-3G that is five of the six gaps, and the HOMO/LUMO gap gets 31 % of the plot instead of 5 %.
   * A cap on the FRACTION OF THE PLOT cannot do this: one gap at 90 % of the span swamps any such cap. */
  let hovers = [], hits = [];
  const hover = graphHover(cv, { repaint: () => paint() });
  function rowsOf() {
    const out = [];
    if (!sol) return out;
    const fold = coreOpen ? 0 : Math.min(nCore(), sol.nocc);
    if (fold) out.push({ eps: sol.eps[fold - 1], items: [], core: fold });
    for (let k = fold; k < sol.nAO; k++) {
      const lv = { k, eps: sol.eps[k], occ: k < sol.nocc ? 2 : 0 };
      const last = out[out.length - 1];
      if (last && Math.abs(lv.eps - last.eps) < DEG) { last.items.push(lv); continue; }
      out.push({ eps: lv.eps, items: [lv] });
    }
    return out;
  }
  function paint() {
    const W = cv.clientWidth, H = cv.clientHeight;
    if (W < 32 || H < 32) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const T = themeInk(g), A = accentRGB(g, 1), B = accentRGB(g, 2);
    const occInk = (a) => `rgba(${A[0]},${A[1]},${A[2]},${a})`, virInk = (a) => `rgba(${B[0]},${B[1]},${B[2]},${a})`;
    const left = 50, right = W - 10, top = 12, bot = H - 15;
    const plot = { x0: left, y0: top, x1: right, y1: bot };
    hovers = []; hits = [];
    g.font = '8px ui-monospace, monospace'; g.textBaseline = 'middle';
    const rows = rowsOf();
    if (!rows.length) {
      g.fillStyle = T.ink(0.85); g.textAlign = 'center';
      g.fillText('no molecule solved — MOLECULES solves the ladder this register runs on', W / 2, H / 2);
      hover.set([], plot); return;
    }
    /* the soft-capped y map, by ROW index: to scale up to 3 × the median gap, clamped beyond it */
    const m = rows.length;
    const gaps = [];
    for (let i = 0; i < m - 1; i++) gaps.push(rows[i + 1].eps - rows[i].eps);
    const pos = gaps.filter((d) => d > 0).sort((a, b) => a - b);
    const med = pos.length ? pos[pos.length >> 1] : 0;
    const cap = med > 0 ? 3 * med : Infinity;
    let tot = 0; const w = gaps.map((d) => { const x = Math.min(d, cap); tot += x; return x; });
    const ys = [bot];
    for (let i = 0; i < m - 1; i++) ys.push(ys[i] - (tot > 0 ? w[i] / tot : 1 / Math.max(1, m - 1)) * (bot - top));
    const yOf = (i) => (m === 1 ? (top + bot) / 2 : ys[i]);
    const eH = sol.eps[sol.nocc - 1], eL = sol.eps[sol.nocc];
    const names = [];
    for (let i = 0; i < m; i++) {
      const row = rows[i], yy = yOf(i), seg = (right - left) / Math.max(1, row.items.length);
      if (row.core) {                                                       // the folded core: one dashed rung, a click opens it
        g.strokeStyle = occInk(0.6); g.lineWidth = 1; g.setLineDash([3, 3]);
        g.beginPath(); g.moveTo(left + 1, yy); g.lineTo(right - 1, yy); g.stroke(); g.setLineDash([]);
        hits.push({ y: yy, x0: left, x1: right, core: true });
        hovers.push({ kind: 'line', key: 'core', points: [left + 1, yy, right - 1, yy], lw: 1, colour: occInk(1),
          info: `core ×${row.core}: the frozen-core levels (k1–k${row.core}, ε ≤ ${row.eps.toFixed(3)} Eh) · click to unfold` });
        names.push({ y: yy, txt: `core ×${row.core}`, col: occInk(0.8), rank: 1 });
        continue;
      }
      for (let j = 0; j < row.items.length; j++) {
        const lv = row.items[j], x0 = left + j * seg + 1, x1 = x0 + seg - 2;
        const c = sel.get(lv.k), lit = !!c, ink = lv.occ ? occInk : virInk, dim = !carried(lv.k);
        /* iteration 008 U (Josh: "simple lines that's dark when off and full vivid color when on") · PLAIN LINES: one stroke a level — dark
           when off, the level's full vivid ink when on — and no band, bar, box or glow beside it (the dials carry |c|; occupied A, virtual B) */
        g.strokeStyle = lit ? ink(1) : ink(dim ? 0.1 : 0.26); g.lineWidth = lit ? 2.5 : 1.5;
        g.beginPath(); g.moveTo(x0, yy); g.lineTo(x1, yy); g.stroke();
        hits.push({ y: yy, x0, x1, k: lv.k });
        hovers.push({ kind: 'line', key: 'L' + lv.k, points: [x0, yy, x1, yy], lw: lit ? 2 : 1, colour: ink(1),
          info: `${label(lv.k)}  ·  k${lv.k + 1}  ·  ε = ${lv.eps.toFixed(6)} Eh  ·  ${lv.occ ? lv.occ + ' electrons' : 'virtual, 0 electrons'}`
            + (sol.names ? '  ·  ' + about(lv.k) : '')
            + (lit ? `  ·  in the register: |c| ${c.amp.toFixed(3)}, arg c ${(c.phase * 180 / Math.PI).toFixed(0)}°` : dim ? '  ·  not carried by this record' : '  ·  click to add') });
      }
      /* the gutter: the level's plain name (no component tag: a row IS the level), with HOMO / LUMO beside it */
      const mo0 = moOf(row.items[0].k), fr = frontierOf(row.items[0].k), edge = fr === 'HOMO' || fr === 'LUMO';
      const nm = mo0 && mo0.label ? forms(mo0.label).plain + (edge ? ' ' + fr : '') : edge ? fr : 'k' + (row.items[0].k + 1);
      names.push({ y: yy, txt: nm, col: row.items[0].occ ? occInk(fr === 'HOMO' ? 1 : 0.8) : virInk(fr === 'LUMO' ? 1 : 0.75), rank: edge ? 0 : 1 });
    }
    /* the 50 px gutter, one name a row and NOTHING NUDGED: a name away from its own level would lie (spectrum's law) */
    const used = [];
    g.textAlign = 'right';
    for (const nm of [...names].sort((a, b) => a.rank - b.rank)) {
      if (used.some((q) => Math.abs(q - nm.y) < 9)) continue;
      used.push(nm.y); g.fillStyle = nm.col; g.fillText(nm.txt, left - 4, nm.y);
    }
    g.fillStyle = T.ink(0.8); g.textAlign = 'left';
    const foot = `ε_k Eh · Δε ${Number.isFinite(eL) ? (eL - eH).toFixed(6) : '—'} · FROZEN, not ω_RPA`;
    fitText(g, foot, left, H - 5, { x0: left, y0: H - 11, x1: W - 4, y1: H - 1 }, 'left', true);
    hover.set(hovers, plot);
  }
  /* 2026-10 (Josh) · PAINT THE LADDER (lab/paint-stroke.js): LEFT adds, RIGHT removes; a press adds/removes the level under
     it, a drag every level it crosses.  The levels are canvas hits in CSS px, so a stroke takes every ROW its segment
     crosses — the WHOLE row, since a degenerate row is one energy level drawn side by side, and a stroke down the ladder
     must take every orbital (GeH₄: 23 levels in 12 rows) — plus the one level nearest the pointer within 8 px, which is
     how a stroke moving ALONG a row picks its levels one by one.  Never a halo, which on a dense ladder (C₆H₆: 36 levels
     in 123 px) would paint neighbours the pointer never touched.  One stroke is one undo row. */
  const local = (e) => {
    const r = cv.getBoundingClientRect(), sx = r.width ? cv.offsetWidth / r.width : 1, sy = r.height ? cv.offsetHeight / r.height : 1;
    return { x: (e.clientX - r.left) * sx - cv.clientLeft, y: (e.clientY - r.top) * sy - cv.clientTop };
  };
  /** the level nearest p within tol px of its row; among a degenerate row's side-by-side levels, the one nearest in x */
  function nearestHit(p, tol) {
    let best = null, bd = Infinity;
    for (const h of hits) {
      const dy = Math.abs(h.y - p.y); if (dy > tol) continue;
      const dx = p.x < h.x0 ? h.x0 - p.x : p.x > h.x1 ? p.x - h.x1 : 0, d = dy * 1e4 + dx;
      if (d < bd) { bd = d; best = h; }
    }
    return best;
  }
  /** every level on every row strictly between a and b */
  function crossed(a, b) {
    const lo = Math.min(a.y, b.y), hi = Math.max(a.y, b.y);
    return hi - lo < 0.5 ? [] : hits.filter((h) => !h.core && h.y > lo && h.y < hi && carried(h.k)).map((h) => h.k);
  }
  const stroke = paintStroke(cv, { local, ready: () => hits.length > 0, onStart: () => hover.clear(),
    at: (p) => { const h = nearestHit(p, 8); return h ? [h.core ? 'core' : h.k] : []; }, across: crossed,
    apply: (ks, add) => {                                                   // a TAP on the folded core opens it; a stroke paints past it
      if (ks.includes('core')) { if (!stroke.painting) setCoreOpen(true); ks = ks.filter((k) => k !== 'core'); }
      return ks.length ? paintLevels(ks, add) : 0;
    },
    /* iteration 008 U · THE STROKE'S END (still inside its pointerup, so the same undo row): the sum of |c|^2 goes to 1, and a hand that
       painted the ladder picked the register — VIEW REGISTRY (api.stroked).  A modulator's write never comes here */
    onEnd: () => { norm(); if (api.stroked) api.stroked('orbital'); } });
  window.addEventListener('resize', () => paint());

  /* ── CHEMISTRY's road: the last ground state, and every new one ───────────────────────────────── */
  function adopt(s) {
    sol = s || null; coreBtn.hidden = !nCore();
    re = im = null; pushedT = NaN; pushedV = -1; selected = -1;
    flow = null; flowOn = false; flowSw.set(false);
    sel.clear(); M.reset(); rowsEl.classList.remove('reg-morphing');
    if (sol) {
      if (wanted) { applyRecord(wanted); wanted = null; }
      else { sel.set(sol.nocc - 1, { amp: 1, phase: 0 }); selected = sol.nocc - 1; }   // a new solve resets the register to HOMO alone
    }
    touch(); rebuild(); paint(); refresh();
    if (on) { const why = refusal(); if (why) claim(false); else push(now(), true); }
    api.repaint();
  }
  function ensureSub() {
    if (unsub) return true;
    const c = C();
    if (!c || !c.subscribe) return false;
    unsub = c.subscribe((s) => adopt(s));       // fires at once with the ground state already in hand, if there is one
    return true;
  }
  /* the one model this window produces, named to the session once: `push` is how the session asks it to paint
     when it becomes the owner, and `view` is the observable a complex orbital wants shown */
  if (S()) S().register('orbital-packet', { push: () => push(now(), true), view: () => 'phase' });
  ensureSub();

  /* ── the frame ────────────────────────────────────────────────────────────────────────────────── */
  function update(t) {
    if (!ensureSub()) return false;
    if (!on) { if (active) paintPsi(t); return false; }
    const why = refusal();
    if (why) { if (!C() || !C().on) { claim(false); return false; }   // MOLECULES went off: stand down (refresh() says 'standing by'); the window stays
      status('REGISTRY off — ' + why, 'warn'); return false; }
    const moved = push(t);
    if (active) paintPsi(t);
    return moved;
  }
  function setActive(v) { const next = !!v; if (next === active) return active; active = next; if (active) { paint(); refresh(); } return active; }

  /* ── the record ───────────────────────────────────────────────────────────────────────────────── */
  function applyRecord(r) {
    sel.clear(); selected = -1;
    const list = Array.isArray(r && r.selection) ? r.selection : [];
    for (const e of list) {
      const k = Math.round(e && e.k);
      if (!Number.isFinite(k) || k < 0 || !sol || k >= sol.nAO) continue;
      sel.set(k, { amp: Math.max(0, Math.min(1, Number.isFinite(e.amp) ? e.amp : 1)), phase: ((((+e.phase || 0) % TAU) + TAU) % TAU) });
      if (selected < 0) selected = k;
    }
    /* ADR-0002: the stores and the position travel with the selection (absent in a record that holds no store: an older file, NEW, the demos) */
    M.load(r); rowsEl.classList.toggle('reg-morphing', M.on);
  }
  /* the stores, A ↔ B and MORPH are written only while a store exists (no store, no path: MORPH cannot be on) — a register that never
     stored keeps its bytes; a ROUTED A ↔ B's base is seated by persist.js modSeats whatever this writes */
  function save() { return { on: api.want(), selection: keys().map((k) => ({ k, amp: sel.get(k).amp, phase: sel.get(k).phase })),
    ...((M.A || M.B) && M.save()) }; }
  /** the register is a selection over a LADDER, so a record landing before the molecule waits for it (see adopt).  Its own claim is let go;
   *  a record that says ON is the one switch's ON (api.one), never a claim whatever VIEW reads */
  function load(r) {
    if (!r) return false;
    if (!sol) { wanted = { selection: r.selection, A: r.A, B: r.B, morph: r.morph, morphOn: r.morphOn }; if (on) claim(false); }
    else { applyRecord(r); touch(); rebuild(); paint(); refresh(); if (on) claim(false); api.repaint(); }
    if (r.on) api.one(true);
    return true;
  }

  return {
    update, setActive, paint, refresh, claim,
    get on() { return on; }, setOn: (v) => api.one(v),   // the ONE switch (registerview), never this pane's claim
    get active() { return active; },
    get dials() { return !rowsEl.hidden; }, setDials,
    solution() { return sol; },
    setFlow, get flowOn() { return flowOn; }, get flowEpoch() { return flowEpoch; }, flowSource() { return flowOn ? flow : null; },
    select, deselect, toggle, clear, fill, norm, setAmp, setPhase, preset, store: (w) => !!M.store(w), setMorph: (v, s) => M.set(v, s),
    get morphOn() { return M.on; }, get morph() { return M.s; },
    knobs: { morph: () => M.knob },                                   // ADR-0002: the dial the `reg.omorph` row stamps and the TIMELINE lanes
    /** the modulator's road (a route, a TIMELINE lane): store the position; the picture moves only while MORPH plays */
    setMorphValue(v) { if (M.setValue(v) && M.on) { touch(); api.repaint(); } },
    get selected() { return selected; },
    ladder() { return sol ? Array.from({ length: sol.nAO }, (_, k) => ({ k, eps: sol.eps[k], occ: k < sol.nocc ? 2 : 0, name: label(k), about: about(k) })) : []; },

    state() {
      const p = pair(), eH = sol ? sol.eps[sol.nocc - 1] : null, eL = sol ? sol.eps[sol.nocc] : null;
      return { on, nAO: nAO(), nocc: nocc(), homo: sol ? sol.nocc - 1 : null, lumo: sol ? sol.nocc : null,
        epsHOMO: eH, epsLUMO: eL, gap: sol && Number.isFinite(eL) ? eL - eH : null,
        selection: keys().map((k) => ({ k, amp: sel.get(k).amp, phase: sel.get(k).phase, eps: sol.eps[k], occ: k < sol.nocc ? 2 : 0 })),
        sum: sum2(), period: p ? p.period : null, dE: p ? p.dE : null, t: pushedT, law: LAW,
        refusal: refusal(), status: statusText, hash: sol ? sol.hash : null,
        coreOpen, rungs: rowsOf().map((r) => (r.core ? `core ×${r.core}` : label(r.items[0].k))) };
    },
    save, load,
    dispose() { if (unsub) { unsub(); unsub = null; } },
  };
}
