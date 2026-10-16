/* statesview.js — THE REGISTER's STATES MODE (MOLECULAR WAVES stages 3–4; REGISTER-WINDOW-SPEC-2026-09-18).
 *
 * Hydrogen's SPECTRUM rail is a register over exact eigenstates.  This is the molecule's: a register over the
 * MANY-ELECTRON states CHEMISTRY's inspector already solves — the ground determinant S₀ and the singlet CIS (TDA)
 * states S_K — so it beats where the spectrum's sticks stand, and it is a genuine N-electron wavefunction at any
 * amplitude (lab/molecular-register.js carries the mathematics and its proof trail).
 *
 * THE ONE LABEL THIS MODE MUST NEVER GET WRONG.  The ladder is the TDA one (benzene's bright pair at 0.3903), not
 * the RPA one a real-time TDHF run rings at (0.3608).  The sticks on screen belong to the model that is playing:
 * turning this register ON switches CHEMISTRY's plot to its TDA ladder, and every readout here says TD-CIS.
 *
 * LANES ARE HYDROGEN'S LANES.  The same .sp-row the SPECTRUM rail builds — population fader, a live phase needle
 * that keeps turning with the clock and takes a drag as an added phase, MUTE and SOLO as reconstruction masks,
 * remove — over the same kit nodes.  S₀ is pinned first: a bright line's slosh IS the S₀–S_K cross term.
 * A DEGENERATE PAIR IS TWO LANES IN THE CANONICAL GAUGE (the worker's chem.states): lane x and lane y, named by the
 * axis their transition dipole lies along, and the y lane's phase knob is the whole ring control —
 * 0° a diagonal slosh, 90° a ring current, 180° the other diagonal, 270° the ring the other way.
 *
 * THE DRIVE (stage 5).  Free evolution only turns phases; a DRIVE moves populations, for a physical reason: the
 * length-gauge field E(t)·r acting on the whole singles space, propagated in the chemistry worker by an exactly
 * unitary Strang step (mathworker.js `chem.drive.*`).  It resonates where the sticks stand — tune ω to a lane and
 * the population flops at Ω = E₀μ — and a circular field on a degenerate pair DRIVES the ring the RING preset only
 * poses.  While it runs the lanes are read-outs: the faders show |b_K(t)|², the needles arg b_K(t).
 *
 * THE FIELD.  CHANGE (default) hands the session a `signed` product, ΔD = Re D(t) − D_ref, shown as two-colour
 * lobes; DENSITY hands it Re D(t), honest and quiet (the 1s cores set the scale).  REF picks the reference of
 * CHANGE: GROUND is D₀, MEAN is the stationary part, which leaves exactly the interference terms on screen.
 */
import { stateName } from './names.js';
import { el, knob, sw, seg, fader, readout, graphHover, themeInk, accentRGB, fitText, vividInk, nRGB, label as lbl, hint, chip } from './mir/kit.js';
import { createFlow, FLOW_ORACLE } from './molecular-flow.js';
import { paintStroke } from './paint-stroke.js'; import { fold } from './fold.js';
import { BASIS } from './hydrogen.js';
import { GROUND, AU_TIME_AS, createStatesModel, slerpCoefficients, presetLanes, beatsOf, softCapLevels, PRESETS } from './molecular-register.js';

const TAU = 2 * Math.PI;
export const LANE_CAP = 8;                         // eight modulation slots (reg.amp1…8, reg.ph1…8): S₀ + seven states
const BRIGHT_F = 0.02, CORE_W = 3;                 // the BRIGHT filter: oscillator strength worth a lane, below the core-excitation window
const LAW = 'TD-CIS · frozen nuclei · TDA ladder, not the RPA one a TDHF run rings at';
const AXIS_N = [1, 2, 3];                          // the rack's n-colours for x, y, z — CHEMISTRY's own choice
const AX = ['x', 'y', 'z'];

export function createStates(host, api) {
  const S = () => api.session || null;
  const C = () => (api.chem ? api.chem() : null);
  const now = () => (api.now ? api.now() : 0);
  let statusText = 'no molecule solved yet';
  const status = (t, cls) => { statusText = t; if (api.status) api.status(t, cls === undefined ? '' : cls); };

  let sol = null, ladder = null, model = null, on = false, active = api.active ? !!api.active() : true, shown = true;
  let version = 0, pushedT = NaN, pushedV = -1, selected = GROUND, wanted = null, unsub = null, ladderSeq = 0, ladderRefused = null;   // S4c-VERIFY N5: the worker's refusal sentence outlives a press
  let armed = 0;                                   // 0.5.3 M3: ON wished while the ladder is out — 1 a restore's, 2 a hand's; the ladder's landing (fetchLadder) re-arms
  let view = 'change', ref = 'ground', brightOnly = true, morphOn = false, morphS = 0, storeA = null, storeB = null;
  const lanes = new Map();                         // key → { amp, phase, mute, solo }; GROUND first, then ascending K
  const pending = new Set();                       // state keys whose vectors are on their way from the worker
  const product = { kind: 'signed', matrix: null, view: 'real', hash: null, solution: 0 };
  const evalList = [];                             // reused: what evaluate() is handed each frame
  const trail = new Float64Array(3 * 256); let trailN = 0, trailAt = 0, trailT = NaN;
  /* FLOW (stage 6): the current's source for the stage's tracers, rebuilt once a frame from the same (c₀, Z) */
  let flowOn = false, flow = null, flowRe = null, flowIm = null, flowEpoch = 0, flowSrc = 'computed';
  /* the drive: its knobs, and the pump's one outstanding request */
  const drive = { on: false, pol: 'x', omega: 0.4, e0: 0.01, envelope: 'cw', duration: 400, phase: 0, ready: false, busy: false, dirty: false, last: null, seq: 0, sent: 0 };

  /* ── the top: ladder + scope ──────────────────────────────────────────────────────────────────── */
  const top = el('div', 'row tight reg-top', host);
  const cv = el('canvas', 'mol-c reg-ladder', top);
  cv.title = 'The many-electron ladder: S₀ at zero and the singlet excited states above it, ω in hartree. Stick weight is oscillator strength, hue is the '
    + 'axis of the transition dipole, degenerate levels sit side by side. Left-click a state to put it in the register, right-click to take it out; left-drag paints every state you cross in, right-drag paints them out.';
  const scope = el('canvas', 'mol-c reg-scope', top);
  scope.title = 'The dipole scope: the change of the electronic dipole δμ(t), traced in the plane it moves in. A line is a slosh, a circle is a ring current, '
    + 'two lines of different colour draw a Lissajous figure.';

  /* ── the head ─────────────────────────────────────────────────────────────────────────────────── */
  const head = el('div', 'row tight sp-head', host);
  const mk = (txt, title) => { const b = el('button', 'trig', head); b.type = 'button'; b.textContent = txt; b.title = title; return b; };
  const hideBtn = mk('HIDE', 'Hide or show the lanes');
  const clrBtn = mk('CLEAR', 'Empty the register: S₀ alone');
  const nrmBtn = mk('NORM', 'Renormalise the register so Σ|b|² = 1');
  const SW_TITLE = 'Give the field this register’s many-electron state — MOLECULES must be ON and not running a real-time propagation';
  const onSw = sw({ label: 'REGISTRY ON', value: false, cls: 'orb-on', title: SW_TITLE, onChange: (v) => { setOn(v, true); } });
  head.appendChild(onSw.root);
  /* 0.5.3 M3 · a record with no CIS states says so ON THE SWITCH, the worker's own sentence its hover — not a status-line whisper */
  const says = (why) => { lbl(onSw.root.querySelector('.sw-lbl'), why ? 'NO CIS STATES' : 'REGISTRY ON'); hint(onSw.root, why ? why + ' — ORBITAL mode plays its orbitals' : SW_TITLE); };

  const bar = el('div', 'row tight reg-bar', host);
  const presetSel = el('select', 'sel', bar); presetSel.title = 'Presets are rules, not indices: each one exists for every molecule or says why it does not';
  presetSel.setAttribute('aria-label', 'register preset');
  { const o = el('option', '', presetSel, 'PRESET…'); o.value = ''; for (const p of PRESETS) { const q = el('option', '', presetSel, p); q.value = p; } }
  presetSel.addEventListener('change', () => { const p = presetSel.value; presetSel.value = ''; if (p && preset(p) && api.announce) api.announce(p); });   // a HAND's preset is announced on the stage (0.4.0 S3 · F2)
  const brightBtn = el('button', 'trig on', bar); brightBtn.type = 'button'; brightBtn.textContent = 'BRIGHT'; brightBtn.title = 'The ladder shows the bright valence states only, or every state';
  const aBtn = el('button', 'trig', bar); aBtn.type = 'button'; aBtn.textContent = '→ A'; aBtn.title = 'Store this register as A';
  const bBtn = el('button', 'trig', bar); bBtn.type = 'button'; bBtn.textContent = '→ B'; bBtn.title = 'Store this register as B';
  const morphSw = sw({ label: 'MORPH', value: false, title: 'Play the normalised path from A to B instead of the lanes — a performance path, not dynamics', onChange: (v) => setMorph(v, morphS) });
  const mrow = el('div', 'row tight reg-morph', host); mrow.appendChild(morphSw.root);
  const morphK = knob({ label: '<m>A ↔ B</m>', aria: 'morph A to B', min: 0, max: 1, value: 0, fmt: (v) => v.toFixed(3),
    title: 'Where on the path from A (0) to B (1) the register plays; for orthogonal stores this is cos/sin, hydrogen’s TRANSITION envelope',
    onInput: (v) => setMorph(morphOn, v) });
  mrow.appendChild(morphK.root);

  const rowsEl = el('div', 'sp-rows', host);
  hideBtn.addEventListener('click', () => { rowsEl.hidden = !rowsEl.hidden; hideBtn.classList.toggle('on', rowsEl.hidden); });
  clrBtn.addEventListener('click', () => clear());
  nrmBtn.addEventListener('click', () => norm());
  brightBtn.addEventListener('click', () => { brightOnly = !brightOnly; brightBtn.classList.toggle('on', brightOnly); brightBtn.textContent = brightOnly ? 'BRIGHT' : 'ALL'; paint(); });
  aBtn.addEventListener('click', () => store('A'));
  bBtn.addEventListener('click', () => store('B'));

  const vr = el('div', 'row tight', host);
  const viewSeg = seg({ label: 'VIEW', value: 'change', options: [{ id: 'change', label: 'CHANGE' }, { id: 'density', label: 'DENSITY' }],
    onChange: (v) => setView(v) });
  const refSeg = seg({ label: 'REF', value: 'ground', options: [{ id: 'ground', label: 'GROUND' }, { id: 'mean', label: 'MEAN' }],
    onChange: (v) => setRef(v) });
  vr.appendChild(viewSeg.root); vr.appendChild(refSeg.root);
  const flowSw = sw({ label: 'FLOW', value: false, title: 'Tracers on the stage, riding the molecule’s current v = j/ρ — the many-electron carrier of phase. Its direction is exact and its size qualitative, in STO-3G and in 6-31+G*; the tracers’ steps are checked by no oracle', onChange: (v) => setFlow(v) });
  vr.appendChild(flowSw.root);
  const srcSeg = seg({ label: 'FLOW SOURCE', value: 'computed', options: [{ id: 'computed', label: 'AS COMPUTED', title: 'v = j/ρ, the basis’s own current' }, { id: 'balanced', label: 'BALANCED', title: 'v + ∇φ with −∇·(ρ∇φ) = ∂ρ/∂t + ∇·j: continuity closed on a 32³ grid, solved in a worker' }], onChange: (v) => setFlowSource(v) });
  vr.appendChild(srcSeg.root);
  const fr = el('div', 'row tight', host), roRep = readout({ label: 'REPAIR', cls: 'wide', value: '—' }), roGate = readout({ label: 'GATED', value: '—' }); fr.append(roRep.root, roGate.root); fr.hidden = true;
  const paintFlow = () => { if (!flow) return; const w = flow.said(); roRep.set(w[0]); roRep.setSub(w[1]); roGate.set(w[2]); roGate.setSub(w[3]); srcSeg.root.title = FLOW_ORACLE[C() && C().preset()] || ''; };

  /* ── the drive ────────────────────────────────────────────────────────────────────────────────── */
  const dr = el('div', 'row tight reg-drive', host);
  const driveSw = sw({ label: 'DRIVE', value: false, title: 'Apply the field E(t)·r to the whole molecule: populations move, at the Rabi rate Ω = E₀μ when ω sits on a stick', onChange: (v) => setDrive(v) });
  dr.appendChild(driveSw.root);
  const polSel = el('select', 'sel', dr); polSel.setAttribute('aria-label', 'drive polarisation'); polSel.title = 'The field’s polarisation: linear along an axis, or circular in a plane (⟲ and ⟳ drive opposite ring currents)';
  for (const [id, txt] of [['x', 'x'], ['y', 'y'], ['z', 'z'], ['xy+', 'xy ⟲'], ['xy-', 'xy ⟳'], ['yz+', 'yz ⟲'], ['yz-', 'yz ⟳'], ['zx+', 'zx ⟲'], ['zx-', 'zx ⟳']]) { const o = el('option', '', polSel, txt); o.value = id; }
  polSel.addEventListener('change', () => setDriveParam('pol', polSel.value));
  const tuneBtn = el('button', 'trig', dr); tuneBtn.type = 'button'; tuneBtn.textContent = 'ω → LANE'; tuneBtn.title = 'Tune the drive to the selected lane: its ω, and the axis (or the plane, for a degenerate pair) of its dipole';
  tuneBtn.addEventListener('click', () => tune());
  const envSeg = seg({ label: 'ENVELOPE', value: 'cw', options: [{ id: 'cw', label: 'CW' }, { id: 'pulse', label: 'PULSE' }], onChange: (v) => setDriveParam('envelope', v) });
  const dk = el('div', 'row tight reg-drive', host);
  const wK = knob({ label: '<m>ω</m>', aria: 'drive frequency', min: 0.05, max: 3, value: drive.omega, log: true, unit: ' Eh', fmt: (v) => v.toFixed(4),
    title: 'The drive’s carrier frequency in hartree — resonance is a stick of the ladder', onInput: (v) => setDriveParam('omega', v) });
  const eK = knob({ label: '<m>E₀</m>', aria: 'drive amplitude', min: 1e-4, max: 0.2, value: drive.e0, log: true, unit: ' a.u.', fmt: (v) => v.toExponential(2),
    title: 'The field amplitude in atomic units; on resonance the population flops at Ω = E₀μ', onInput: (v) => setDriveParam('e0', v) });
  const durK = knob({ label: 'PULSE', aria: 'pulse duration', min: 10, max: 4000, value: drive.duration, log: true, unit: ' a.u.', fmt: (v) => v.toFixed(0),
    title: 'The sin² pulse’s duration — a π-pulse is π/Ω long', onInput: (v) => setDriveParam('duration', v) });
  dk.appendChild(wK.root); dk.appendChild(eK.root); dk.appendChild(durK.root); dk.appendChild(envSeg.root);
  const roDrive = readout({ label: 'DRIVE', cls: 'wide', value: 'off', sub: 'tune ω to a lane, then DRIVE: the population flops at Ω = E₀μ' });
  el('div', 'row tight', host).appendChild(roDrive.root);
  /* ── THE SONG (0.6.4 S1): a track DRIVES hydrogen's register, E_z(t) = E₀·track(t) in i ċ = (diag E_n + E_z z) c, stepped in the chem worker (h.drive.*); each landing
     is reg.anchorFrom(c, t) and the register free-evolves between them.  The track never leaves this page: a project keeps { hash, name, e0, rateAtDrop }. */
  const song = { on: false, meta: null, samples: null, sr: 0, e0: 3e-3, ship: false, ready: false, busy: false, seq: 0, v: -1, last: null, omega: 0, dt: 0.5, speed: 0, wall: 0, paint: 0 };
  const sg = el('div', 'row tight reg-drive', host), songSw = sw({ label: 'SONG', value: false, title: 'Drive hydrogen with the track: its waveform is the field E_z(t) on the 91 labels, and RATE maps its pitch onto their lines', onChange: (v) => setSong(v) });
  const songIn = el('input', '', sg); songIn.type = 'file'; songIn.accept = 'audio/*'; songIn.hidden = true; songIn.addEventListener('change', () => { songFile(songIn.files[0]); songIn.value = ''; });
  const fileBtn = el('button', 'trig', sg, 'FILE'); fileBtn.type = 'button'; fileBtn.title = 'Choose an audio file — or drop one on this row'; fileBtn.addEventListener('click', () => songIn.click());
  const sE = knob({ label: '<m>E₀</m>', aria: 'song amplitude', min: 1e-4, max: 1e-2, value: song.e0, log: true, unit: ' a.u.', fmt: (v) => v.toExponential(2), title: 'The field at the track’s peak, in atomic units', onInput: (v) => setSongE0(v) });
  sg.prepend(songSw.root); sg.appendChild(sE.root); sg.addEventListener('dragover', (e) => e.preventDefault()); sg.addEventListener('drop', (e) => { e.preventDefault(); songFile(e.dataTransfer.files[0]); });
  const roSong = readout({ label: 'SONG', cls: 'wide', value: 'no track' }); el('div', 'row tight', host).appendChild(roSong.root); const songNote = el('div', 'note', host); refreshSong();

  /* iteration 001 (Josh): the presets, A ↔ B, the drive and the song fold behind the head's chevron (lab/fold.js); HIDE and CLEAR are glyphs */
  { const a = el('div', 'reg-more'), b = el('div', 'reg-more'); bar.before(a); a.append(bar, mrow); dr.before(b); b.append(dr, dk, roDrive.root.parentElement, sg, roSong.root.parentElement, songNote);
    fold(head, [a, b], { what: 'presets, A ↔ B, drive and song' }); chip(hideBtn, 'eyeShut', 'HIDE'); chip(clrBtn, 'clear', 'CLEAR'); }
  const rr = el('div', 'row tight', host);
  const roSum = readout({ label: '<m>Σ|b|²</m>', value: '—', sub: '' });
  const roBeat = readout({ label: 'BEAT', value: '—', sub: '' });
  const roMu = readout({ label: '<m>δμ(t)</m>  (a.u.)', cls: 'wide', value: '—', sub: LAW });
  for (const r of [roSum, roBeat, roMu]) rr.appendChild(r.root);
  el('div', 'note', host).innerHTML = '<b>Model.</b> Time-dependent configuration interaction singles: '
    + '<m>Ψ(t) = b₀Φ₀ + Σ_K b_K e^{−iω_K t}Ψ_K</m> over the RHF determinant and its singlet CIS states, exact in that space by Brillouin’s theorem, '
    + 'so the density is a real N-electron density at any amplitude. It has no double excitations and no orbital relaxation, and its lines are the '
    + '<b>TDA</b> ones — a real-time TDHF run rings at the RPA lines instead. A degenerate pair is two lanes, <m>x</m> and <m>y</m>: '
    + 'a quarter turn between them is a ring current. MORPH is a performance path between two stored registers, not dynamics.';

  /* ── names ────────────────────────────────────────────────────────────────────────────────────── */
  const axisOf = (k) => { let b = 0; for (let q = 1; q < 3; q++) if (Math.abs(ladder.mu[3 * k + q]) > Math.abs(ladder.mu[3 * k + b])) b = q; return b; };
  const isBright = (k) => ladder.f[k] > 1e-6;
  function label(key) {
    if (key === GROUND) return stateName(0);
    /* numbered by LEVEL, so the two lanes of one degenerate level share a number: S₄x and S₄y */
    const base = stateName((ladder ? ladder.cluster[key] : key) + 1);
    if (!ladder || ladder.size[key] < 2) return base;
    if (isBright(key)) return base + AX[axisOf(key)];
    let first = key; while (first > 0 && ladder.cluster[first - 1] === ladder.cluster[key]) first--;
    return base + 'abcdefgh'[key - first];
  }
  const energyOf = (key) => (key === GROUND ? 0 : ladder.omega[key]);
  const touch = () => { version++; pushedV = -1; if (drive.on) drive.dirty = true; };   // an edit under a running drive restarts it from the edited register
  const keys = () => [...lanes.keys()].sort((a, b) => a - b);
  const sum2 = () => { let s = 0; for (const c of lanes.values()) s += c.amp * c.amp; return s; };

  /* ── the worker road ──────────────────────────────────────────────────────────────────────────── */
  function fetchLadder() {
    const c = C(), q = c && c.query ? c.query() : null;
    if (!q || !api.solve) return;
    const seq = ++ladderSeq, forSol = sol; ladderRefused = null;
    Promise.resolve(api.solve({ op: 'chem.states', atoms: q.atoms, basis: q.basis, charge: q.charge, model: q.model }, () => null, (r) => r)).then((r) => {
      if (seq !== ladderSeq || forSol !== sol || !r || r.error || !r.omega) { if (seq === ladderSeq && forSol === sol) { ladderRefused = (r && r.refused) || null; armed = 0; says(ladderRefused); status(ladderRefused || 'the state ladder needs the chemistry worker', 'warn'); } return; }   // 0.4.0 S4a: a record without its CIS ladder says so
      ladder = r; ladder.basis = q.basis;   // the pitch's tag: a line, and so its Hz, is the basis's
      model = createStatesModel({ n: r.n, nocc: r.nocc, C: sol.C, D0: sol.D, rMO: r.rMO });
      if (wanted) { applyRecord(wanted, true); armed = armed || (wanted.on ? 1 : 0); wanted = null; }
      request(keys().filter((k) => k !== GROUND));
      touch(); rebuild(); paint(); refresh(); publishPopulations();
      if (armed) { const hand = armed === 2; armed = 0; setOn(true, hand); }   // THE ONE RE-ARM SEAT: a parked record's ON, a refused ON, a re-solve under ON
    }).catch(() => { if (seq === ladderSeq) status('the state ladder failed to arrive', 'warn'); });
  }
  function request(ks) {
    const need = ks.filter((k) => k !== GROUND && model && !model.has(k) && !pending.has(k));
    if (!need.length || !api.solve) return;
    for (const k of need) pending.add(k);
    const forModel = model;
    Promise.resolve(api.solve({ op: 'chem.state.vectors', ks: need }, () => null, (r) => r)).then((r) => {
      for (const k of need) pending.delete(k);
      if (forModel !== model || !r || r.error || !r.X || r.hash !== ladder.hash) return;
      r.ks.forEach((k, i) => model.addState(k, ladder.omega[k], r.X.subarray(i * r.count, (i + 1) * r.count)));
      touch(); syncLanes(); paint(); refresh();
      if (on) push(now(), true);
      api.repaint();
    }).catch(() => { for (const k of need) pending.delete(k); });
  }

  /* ── the register ─────────────────────────────────────────────────────────────────────────────── */
  function select(key, amp = 0.45, phase = 0) {
    key = key | 0;
    if (!ladder || key < GROUND || key >= ladder.count) return false;
    if (!lanes.has(key) && lanes.size >= LANE_CAP) { status(`the register holds ${LANE_CAP} lanes — one per modulation slot`, 'warn'); return false; }
    lanes.set(key, { amp: Math.max(0, Math.min(1, +amp || 0)), phase: ((+phase || 0) % TAU + TAU) % TAU, mute: false, solo: false });
    selected = key; request([key]);
    touch(); rebuild(); paint(); refresh(); publishPopulations(); api.repaint(); return true;
  }
  function deselect(key) {
    key = key | 0;
    if (key === GROUND || !lanes.delete(key)) return false;                       // S₀ is pinned
    if (selected === key) selected = GROUND;
    touch(); rebuild(); paint(); refresh(); publishPopulations(); api.repaint(); return true;
  }
  const toggle = (key) => (lanes.has(key) && key !== GROUND ? deselect(key) : select(key));
  /** 2026-10 · a PAINT stroke's states in ONE pass (lab/paint-stroke.js): add ⇒ each new state joins at |c| 0.45 up to the
   *  LANE_CAP (one warning, not one per row); remove ⇒ each leaves, S₀ pinned.  One request(), rebuild and repaint. */
  function paintStates(keys, add) {
    if (!ladder) return 0;
    const fresh = []; let n = 0, capped = false;
    for (const k0 of keys) {
      const key = k0 | 0; if (key === GROUND || key < GROUND || key >= ladder.count) continue;
      if (add) {
        if (lanes.has(key)) continue;
        if (lanes.size >= LANE_CAP) { capped = true; continue; }
        lanes.set(key, { amp: 0.45, phase: 0, mute: false, solo: false }); selected = key; fresh.push(key); n++;
      } else if (lanes.delete(key)) { if (selected === key) selected = GROUND; n++; }
    }
    if (capped) status(`the register holds ${LANE_CAP} lanes — one per modulation slot`, 'warn');
    if (!n) return 0;
    if (fresh.length) request(fresh);
    touch(); rebuild(); paint(); refresh(); publishPopulations(); api.repaint(); return n;
  }
  function clear() { lanes.clear(); lanes.set(GROUND, { amp: 1, phase: 0, mute: false, solo: false }); selected = GROUND; touch(); rebuild(); paint(); refresh(); publishPopulations(); api.repaint(); return true; }
  function norm() { const s = Math.sqrt(sum2()); if (!(s > 0)) return false; for (const c of lanes.values()) c.amp = Math.min(1, c.amp / s); touch(); syncLanes(); paint(); refresh(); publishPopulations(); api.repaint(); return true; }
  function setAmp(key, v) { const c = lanes.get(key); if (!c) return; c.amp = Math.max(0, Math.min(1, v)); touch(); paint(); refresh(); publishPopulations(); api.repaint(); }
  function setPhase(key, v) { const c = lanes.get(key); if (!c) return; c.phase = ((v % TAU) + TAU) % TAU; touch(); refresh(); api.repaint(); }
  function preset(name) {
    if (!ladder) { status('no state ladder yet — MOLECULES solves it', 'warn'); return false; }
    const P = presetLanes(name, ladder, { lanes: LANE_CAP });
    if (!P.lanes) { status(`${name}: ${P.why}`, 'warn'); return false; }
    lanes.clear();
    for (const l of P.lanes) lanes.set(l.key, { amp: l.amp, phase: l.phase, mute: false, solo: false });
    selected = P.lanes.length > 1 ? P.lanes[1].key : GROUND;
    request(keys()); touch(); rebuild(); paint(); refresh(); publishPopulations(); api.repaint();
    status(`${name}: ${P.why}`, on ? 'live' : 'ok');
    return true;
  }
  /** what plays: the lanes (masked by MUTE and SOLO), or the A → B path when MORPH is up */
  function playing() {
    evalList.length = 0;
    if (morphOn && storeA && storeB) { for (const [key, c] of slerpCoefficients(storeA, storeB, morphS)) evalList.push({ key, re: c.re, im: c.im }); return evalList; }
    let anySolo = false; for (const c of lanes.values()) if (c.solo) anySolo = true;
    for (const [key, c] of lanes) {
      if (c.mute || (anySolo && !c.solo) || !(c.amp > 0)) continue;
      evalList.push({ key, re: c.amp * Math.cos(c.phase), im: c.amp * Math.sin(c.phase) });
    }
    return evalList;
  }
  function snapshot() { const M = new Map(); for (const [key, c] of lanes) if (c.amp > 0) M.set(key, { re: c.amp * Math.cos(c.phase), im: c.amp * Math.sin(c.phase) }); return M; }
  function store(which) {
    const M = snapshot(); if (!M.size) return false;
    if (which === 'A') { storeA = M; aBtn.classList.add('on'); } else { storeB = M; bBtn.classList.add('on'); }
    request([...M.keys()]); touch(); refresh(); return true;
  }
  function setMorph(v, s) {
    morphS = Math.min(1, Math.max(0, Number.isFinite(s) ? s : morphS));
    const want = !!v && !!storeA && !!storeB;
    if (v && !want) status('MORPH needs both stores: → A, change the register, → B', 'warn');
    morphOn = want; morphSw.set(morphOn); if (morphK.get() !== morphS) morphK.set(morphS);
    rowsEl.classList.toggle('reg-morphing', morphOn);
    touch(); refresh(); api.repaint(); return morphOn;
  }
  function setFlow(v) {
    flowOn = !!v && !!model && !!sol; flowSw.set(flowOn);
    if (flowOn && !flow) { flow = createFlow(sol.shells, api.balance); flow.setSource(flowSrc); flowRe = new Float64Array(model.n * model.n); flowIm = new Float64Array(model.n * model.n); flowEpoch++; }
    fr.hidden = !flowOn; paintFlow();
    if (flowOn) { pushedV = -1; if (on) push(now(), true); }
    api.repaint(); return flowOn;
  }
  function setFlowSource(v) { flowSrc = v === 'balanced' ? 'balanced' : 'computed'; srcSeg.set(flowSrc); if (flow) { flow.setSource(flowSrc); paintFlow(); } api.repaint(); return flowSrc; }
  /** Re Ḋ_AO = (D(t + δ) − D(t − δ))/2δ, δ = 0.01 a.u., from the register's closed form; the frame's state is put back.  The DRIVE offers none. */
  function flowDot(t) {
    if (drive.on) return null; const L = playing(), A = new Float64Array(model.n * model.n), B = new Float64Array(A.length), I = new Float64Array(A.length);
    model.evaluate(L, t + 0.01); model.flowMatrices(A, I); model.evaluate(L, t - 0.01); model.flowMatrices(B, I); model.evaluate(L, t, view === 'change' ? ref : 'ground');
    return A.map((a, k) => (a - B[k]) / 0.02);
  }
  function setView(v) { view = v === 'density' ? 'density' : 'change'; viewSeg.set(view); refSeg.root.classList.toggle('off', view !== 'change'); touch(); if (on) push(now(), true); api.repaint(); return view; }
  function setRef(v) { ref = v === 'mean' ? 'mean' : 'ground'; refSeg.set(ref); touch(); if (on) push(now(), true); api.repaint(); return ref; }

  /* ── the field ────────────────────────────────────────────────────────────────────────────────── */
  function refusal() {
    const c = C(), s = S();
    if (!c) return 'no MOLECULES window';
    if (!c.on) return 'MOLECULES OFF: the register needs its molecule on the field';
    if (!sol) return 'no molecule solved yet';
    if (!ladder || !model) return ladderRefused || 'the state ladder is still being solved';   // a record without its CIS ladder says so, not "still being solved"
    if (!s) return 'no molecular session';
    if (s.claimed('tdhf')) return 'MOLECULES RT RUN has the field: stop the run to take it';
    return null;
  }
  function push(t, force) {
    const s = S(); if (!s || !model || !sol) return false;
    if (!Number.isFinite(t)) t = 0;                                               // a clock that has not ticked yet must not put NaN in a density
    if (drive.on) { if (drive.last) return publishState(model.state, t); return false; }   // the pump owns the state while the drive runs
    if (!force && t === pushedT && version === pushedV) return false;
    const st = model.evaluate(playing(), t, view === 'change' ? ref : 'ground');
    return publishState(st, t);
  }
  function publishState(st, t) {
    const s = S();
    product.kind = view === 'density' ? 'density' : 'signed';
    product.view = view === 'density' ? 'density' : 'real';
    product.matrix = model.product(product.kind); product.hash = sol.hash; product.solution = Number.isFinite(sol.seq) ? sol.seq : 0;
    if (!s.publish('states', product)) return false;
    if (view === 'density' || ref === 'ground' || drive.on) C().certify(model.deltaAO);   // 0.6.1 F2: the full ΔD against the ground, MOLECULES' certificate
    if (flowOn && flow) { model.flowMatrices(flowRe, flowIm); flow.set(flowRe, flowIm); }
    if (t !== trailT) { trail[3 * trailAt] = st.dipole[0]; trail[3 * trailAt + 1] = st.dipole[1]; trail[3 * trailAt + 2] = st.dipole[2]; trailAt = (trailAt + 1) % 256; if (trailN < 256) trailN++; trailT = t; }
    pushedT = t; pushedV = version;
    if (flowOn && flow) flow.pump(C().half, () => flowDot(t), paintFlow);   // after the trail: flowDot re-evaluates the register
    return true;
  }
  function setOn(v, hand) {
    const want = !!v;
    if (want && !on) {
      const why = refusal();
      if (why) { armed = !ladder && !ladderRefused && C() && C().on ? (hand ? 2 : 1) : 0; onSw.set(false); status('MO-REGISTRY off — ' + why + (armed ? ' · ON when it lands' : ''), 'warn'); return false; }
      if (hand && lanes.size < 2 && preset('BEAT') && api.announce) api.announce('BEAT');   // 0.5.3 M3: a hand's ON over S₀ alone plays BEAT, so the stage shows something
      if (!lanes.size) { lanes.set(GROUND, { amp: 1, phase: 0, mute: false, solo: false }); selected = GROUND; touch(); rebuild(); }   // S4: seeded where an empty record left none
      on = true; onSw.set(true); pushedT = NaN; pushedV = -1; trailN = 0; trailAt = 0;
      const c = C(); if (c && c.setTda) c.setTda(true);                            // the sticks on screen belong to the model that is playing
      if (S()) S().claim('states', true, 'the STATES register has the field');
    } else if (!want && on) {
      if (drive.on) setDrive(false);
      on = false; armed = 0; onSw.set(false); pushedT = NaN; pushedV = -1;
      if (S()) S().claim('states', false, 'MO-REGISTRY OFF');
      api.repaint();
    } else onSw.set(on);
    refresh(); publishPopulations();
    return on;
  }
  /** CHEMISTRY's sticks light with |b_K|² while this register is the one playing */
  function publishPopulations() {
    const c = C(); if (!c || !c.setPopulations) return;
    if (!on) { c.setPopulations(null); return; }
    const n2 = sum2() || 1;
    c.setPopulations((k) => (drive.on && drive.last ? drive.last.pops[k] || 0 : (lanes.get(k) ? lanes.get(k).amp ** 2 / n2 : 0)));
  }

  /* ── THE DRIVE's PUMP: one outstanding request, like CHEMISTRY's RT pump — no propagation on this thread ── */
  function initDrive(t) {
    if (!api.solve || !ladder) return;
    const seq = ++drive.seq; drive.busy = true; drive.dirty = false; drive.ready = false;
    const list = playing().map((c) => { const ph = -energyOf(c.key) * t, cs = Math.cos(ph), sn = Math.sin(ph); return { key: c.key, re: c.re * cs - c.im * sn, im: c.re * sn + c.im * cs }; });   // Schrödinger picture at t
    Promise.resolve(api.solve({ op: 'chem.drive.init', pol: drive.pol, omega: drive.omega, e0: drive.e0, envelope: drive.envelope, duration: drive.duration, phase: drive.phase, dt: 0.05, t0: t, lanes: list }, () => null, (r) => r))
      .then((r) => { if (seq !== drive.seq) return; drive.busy = false; if (!r || r.error || r.hash !== ladder.hash) { setDrive(false); status('the drive needs the chemistry worker' + (r && r.error ? ': ' + r.error : ''), 'warn'); return; } drive.ready = true; land(r); })
      .catch(() => { if (seq === drive.seq) { drive.busy = false; setDrive(false); } });
  }
  function land(r) {
    const wall = performance.now();   /* the a.u. the drive advanced per real second, for "1/x of real time" */
    if (drive.last && r.t !== drive.last.t) drive.speed = Math.abs(r.t - drive.last.t) / Math.max(1e-3, (wall - drive.wall) / 1000);
    drive.wall = wall; drive.last = r;
    model.evaluateZ(r.c0[0], r.c0[1], r.Zr, r.Zi);
    push(r.t, true);
    const ks = keys();
    for (const [k, L] of rows) { const p = k === GROUND ? r.p0 : r.pops[k]; if (Math.abs(L.pop.get() - p) > 1e-6) L.pop.set(p); }
    if (r.laneRe) ks.forEach((k, i) => { const L = rows.get(k); if (L) L.ph.set(((Math.atan2(r.laneIm[i], r.laneRe[i]) % TAU) + TAU) % TAU); });
    drive.laneKeys = ks; publishPopulations(); api.repaint();
    const ms = performance.now(); if (ms - beatWall > 300) { beatWall = ms; refresh(); }
  }
  function pumpDrive(t) {
    if (!drive.on || drive.busy) return;
    if (drive.dirty || !drive.ready) { initDrive(t); return; }
    if (drive.last && Math.abs(t - drive.last.t) < 1e-12) return;
    const seq = drive.seq; drive.busy = true;
    Promise.resolve(api.solve({ op: 'chem.drive.run', to: t, maxSteps: 1500, keys: keys() }, () => null, (r) => r))
      .then((r) => { if (seq !== drive.seq) return; drive.busy = false; if (!r || r.error) { setDrive(false); return; } land(r); })
      .catch(() => { if (seq === drive.seq) { drive.busy = false; setDrive(false); } });
  }
  function setDrive(v) {
    const want = !!v;
    if (want && !drive.on) {
      if (!on && !setOn(true)) { driveSw.set(false); return false; }
      if (morphOn) setMorph(false, morphS);
      drive.on = true; drive.last = null; drive.ready = false; drive.dirty = false; driveSw.set(true);
      rowsEl.classList.add('reg-driven'); refSeg.root.classList.add('off');
      initDrive(now());
    } else if (!want && drive.on) {
      /* DRIVE OFF freezes the driven state into the lanes it has: |b_K| and the phase that continues it in closed form.
         What leaked into states without a lane is dropped, and the readout says how much. */
      const r = drive.last; drive.on = false; drive.seq++; drive.busy = false; driveSw.set(false);
      rowsEl.classList.remove('reg-driven'); refSeg.root.classList.toggle('off', view !== 'change');
      if (r && r.laneRe && drive.laneKeys) {
        let kept = 0;
        drive.laneKeys.forEach((k, i) => { const c = lanes.get(k); if (!c) return; const a = Math.hypot(r.laneRe[i], r.laneIm[i]); c.amp = Math.min(1, a); c.phase = (((Math.atan2(r.laneIm[i], r.laneRe[i]) + energyOf(k) * r.t) % TAU) + TAU) % TAU; kept += a * a; });
        status(`drive off — the lanes keep ${(100 * kept).toFixed(1)} % of the driven state; ${(100 * Math.max(0, 1 - kept)).toFixed(1)} % had leaked to states without a lane`, 'ok');
      }
      drive.last = null; version++; pushedV = -1; syncLanes(); paint(); refreshDrive(); publishPopulations();
      if (on) push(now(), true);
      api.repaint();
    } else driveSw.set(drive.on);
    refreshDrive();
    return drive.on;
  }
  async function songFile(file) {
    if (!file) return;
    try {
      const A = new (window.AudioContext || window.webkitAudioContext)(), b = await A.decodeAudioData(await file.arrayBuffer()), x = new Float32Array(b.length); A.close();
      for (let c = 0; c < b.numberOfChannels; c++) { const d = b.getChannelData(c); for (let i = 0; i < x.length; i++) x[i] += d[i] / b.numberOfChannels; }   // the mono mix
      Object.assign(song, { samples: x, sr: b.sampleRate, ship: true, meta: { hash: null, name: file.name, e0: song.e0, rateAtDrop: api.rate ? api.rate() : 1 } }); setSong(true);
    } catch (e) { status(`SONG: ${file.name} would not decode — ${e && e.message || e}`, 'warn'); }
  }
  function setSong(v) { song.on = !!v && !!song.samples; song.seq++; song.busy = song.ready = false; song.last = null; songSw.set(song.on); if (v && !song.on) status('SONG: ' + (song.meta ? 'track missing · drop it again' : 'FILE or drop an audio file first'), 'warn'); refreshSong(); api.repaint(); return song.on; }
  function setSongE0(v) { song.e0 = Math.min(1e-2, Math.max(1e-4, +v || 3e-3)); if (song.meta) song.meta.e0 = song.e0; if (song.on && song.ready) Promise.resolve(api.solve({ op: 'h.drive.set', e0: song.e0 }, () => null, (r) => r)).catch(() => {}); refreshSong(); }
  function pumpSong(t) {   // the drive's pump, again: one request in flight, newest wins; an edit of the register (its version) restarts the song from it
    const H = api.song; if (!H || song.busy || H.filming()) return;
    if (!H.hydrogen()) { setSong(false); status('SONG drives hydrogen’s 91 labels: switch the Hamiltonian to hydrogen', 'warn'); return; }
    const init = !song.ready || H.reg.version !== song.v, seq = song.seq, v0 = H.reg.version; if (!init && Math.abs(t - song.last.t) < song.dt) return;
    const c = init ? H.reg.at(t) : null; song.busy = true;
    Promise.resolve(api.solve(init ? { op: 'h.drive.init', e0: song.e0, t0: t, re: c.re, im: c.im, ...(song.ship && { samples: song.samples, sampleRate: song.sr, rate: song.meta.rateAtDrop }) } : { op: 'h.drive.run', to: t, maxSteps: 4000 }, () => null, (r) => r)).then((r) => {
      if (seq !== song.seq) return; song.busy = false;
      if (!r || r.error) { song.ship = true; setSong(false); status('SONG: ' + (r && r.error || 'it needs the chemistry worker'), 'warn'); return; }
      if (H.reg.version !== v0) { song.ready = false; return; }
      if (init) { song.ship = false; song.ready = true; song.omega = r.omega; song.dt = r.dt; song.meta.hash = r.hash; }
      const wall = performance.now(); if (song.last && r.t !== song.last.t) song.speed = Math.abs(r.t - song.last.t) / Math.max(1e-3, (wall - song.wall) / 1000);
      song.wall = wall; song.last = r; H.land(r.re, r.im, r.t); song.v = H.reg.version; if (wall - song.paint > 250) { song.paint = wall; refreshSong(); }
    }).catch(() => { if (seq === song.seq) { song.busy = false; setSong(false); } });
  }
  function refreshSong() {   // THE PITCH: f = ΔE·RATE/2π — the track's zero-crossing pitch against the nearest z-allowed line from a populated label
    const m = song.meta, rate = api.rate ? api.rate() : 0, r = song.last, c = r || (api.song && api.song.reg.at(now())), hz = (w) => (w * m.rateAtDrop / TAU).toFixed(0);
    songNote.textContent = `E₀ ${+song.e0.toPrecision(2)} a.u. = ${+(song.e0 * 514.22).toPrecision(2)} GV/m · a 91-level bound model — above the over-barrier field 1/16n⁴ of n ≥ 3 nothing ionises here · RATE ${rate.toFixed(0)} = ${(rate * AU_TIME_AS / 1000).toFixed(0)} fs of atom time per second`;
    if (!song.samples) { roSong.set(m ? 'track missing · drop it again' : 'no track', m ? 'warn' : ''); roSong.setSub(m ? `${m.name} · the project keeps its name and hash, never the track` : 'FILE, or drop an audio file on this row: its waveform becomes the field E_z(t) on hydrogen'); return; }
    let best = null;
    if (c && song.omega > 0) for (const a of BASIS) if (c.re[a.index] ** 2 + c.im[a.index] ** 2 > 1e-3) for (const b of BASIS) if (b.m === a.m && Math.abs(b.l - a.l) === 1 && b.n !== a.n) { const dE = Math.abs(b.E - a.E); if (!best || Math.abs(dE - song.omega) < Math.abs(best.dE - song.omega)) best = { lo: a.E < b.E ? a : b, hi: a.E < b.E ? b : a, dE }; }
    roSong.set(best ? `tuned: ${hz(song.omega)} Hz → ${best.lo.label}–${best.hi.label} (${song.omega >= best.dE ? '+' : ''}${((song.omega / best.dE - 1) * 100).toFixed(1)} %)` : m.name, song.on ? 'live' : '');
    roSong.setSub(m.name + (r ? ` · ‖c‖² − 1 = ${(r.norm - 1).toExponential(0)}` + (r.lag > song.dt && song.speed > 0 && rate > song.speed ? ` · the song runs at 1/${(rate / song.speed).toFixed(1)} of real time` : '') : ''));
  }
  function setDriveParam(name, v) {
    if (name === 'pol') { drive.pol = String(v); polSel.value = drive.pol; if (drive.on) drive.dirty = true; }
    else if (name === 'envelope') { drive.envelope = v === 'pulse' ? 'pulse' : 'cw'; envSeg.set(drive.envelope); if (drive.on) drive.dirty = true; }
    else if (name === 'duration') { drive.duration = Math.min(4000, Math.max(10, +v || 400)); if (drive.on) drive.dirty = true; }
    else if (name === 'omega' || name === 'e0' || name === 'phase') {
      drive[name] = name === 'omega' ? Math.min(3, Math.max(0.05, +v)) : name === 'e0' ? Math.min(0.2, Math.max(1e-4, +v)) : +v || 0;
      /* the live knobs: no re-init, so an LFO on E₀ or ω is a modulation and not a restart */
      if (drive.on && drive.ready && api.solve) Promise.resolve(api.solve({ op: 'chem.drive.set', e0: drive.e0, omega: drive.omega, phase: drive.phase }, () => null, (r) => r)).catch(() => {});
    }
    refreshDrive(); api.repaint();
  }
  /**
   * ω → LANE.  The drive is tuned to the GAP between the selected lane and the register's REFERENCE lane — the most
   * populated other lane.  With S₀ holding the population that is the lane's own stick (its ω, its dipole's axis, or the
   * pair's plane and a circular field for a bright twofold level).  With an EXCITED lane holding it, the gap is an
   * excited-state absorption line no stick shows; the worker says which axis couples the two and how strongly.
   */
  function tune() {
    const k = selected !== GROUND && lanes.has(selected) ? selected : keys().find((q) => q !== GROUND);
    if (k === undefined || !ladder) { status('ω → LANE: add a state first', 'warn'); return false; }
    let refKey = GROUND, top = -1;
    for (const [key, c] of lanes) if (key !== k && c.amp > top) { top = c.amp; refKey = key; }
    if (!(top > 0)) refKey = GROUND;
    const gap = Math.abs(energyOf(k) - energyOf(refKey));
    if (!(gap >= 0.05)) { status(`ω → LANE: ${label(refKey)} and ${label(k)} are ${gap.toFixed(4)} Eh apart — under the drive’s 0.05 Eh floor`, 'warn'); return false; }
    setDriveParam('omega', gap); wK.set(drive.omega); drive.ref = refKey; drive.coupling = null;
    if (refKey === GROUND && isBright(k)) {
      if (ladder.size[k] === 2) { let first = k; while (first > 0 && ladder.cluster[first - 1] === ladder.cluster[k]) first--; const a = axisOf(first), b = axisOf(first + 1), id = AX[a] + AX[b] + '+'; setDriveParam('pol', { 'xy+': 'xy+', 'yx+': 'xy-', 'yz+': 'yz+', 'zy+': 'yz-', 'zx+': 'zx+', 'xz+': 'zx-' }[id] || AX[a]); }
      else setDriveParam('pol', AX[axisOf(k)]);
      drive.coupling = Math.hypot(ladder.mu[3 * k], ladder.mu[3 * k + 1], ladder.mu[3 * k + 2]);
    } else if (api.solve) {
      Promise.resolve(api.solve({ op: 'chem.drive.coupling', a: refKey, b: k }, () => null, (r) => r)).then((r) => {
        if (!r || r.error || !ladder || r.hash !== ladder.hash) return;
        const q = r.r.map(Math.abs).indexOf(Math.max(...r.r.map(Math.abs))); drive.coupling = Math.abs(r.r[q]);
        if (drive.coupling > 1e-6) setDriveParam('pol', AX[q]);
        status(drive.coupling > 1e-6 ? `ω → LANE: ${label(refKey)} → ${label(k)}, gap ${gap.toFixed(4)} Eh, ⟨${label(refKey)}|${AX[q]}|${label(k)}⟩ = ${r.r[q].toFixed(4)}` + (refKey !== GROUND ? ' — excited-state absorption, a line no stick shows' : '')
          : `ω → LANE: ${label(refKey)} → ${label(k)} is dipole-forbidden — a field cannot drive it directly`, drive.coupling > 1e-6 ? 'ok' : 'warn');
        refreshDrive();
      }).catch(() => {});
    }
    refreshDrive();
    return true;
  }
  function refreshDrive() {
    const k = selected !== GROUND && lanes.has(selected) ? selected : keys().find((q) => q !== GROUND);
    /* the coupling the last ω → LANE measured (an excited-to-excited one comes from the worker); else the lane's own stick */
    const mu = Number.isFinite(drive.coupling) && drive.coupling !== null ? drive.coupling : (k !== undefined && ladder ? Math.hypot(ladder.mu[3 * k], ladder.mu[3 * k + 1], ladder.mu[3 * k + 2]) : 0), Om = drive.e0 * mu;
    const rabi = mu > 1e-6 ? `Ω = E₀μ = ${Om.toExponential(2)} · π/Ω = ${(Math.PI / Om).toFixed(0)} a.u. on ${label(k)}` + ((() => { const gp = Math.abs(energyOf(k) - energyOf(drive.ref === undefined || !lanes.has(drive.ref) ? GROUND : drive.ref)); return Math.abs(drive.omega - gp) > 5e-4 ? ` · detuned ${(drive.omega - gp).toFixed(4)}` : ' · on resonance'; })()) : 'the selected lane is dark: a dipole field cannot move it directly';
    if (!drive.on) { roDrive.set('off', ''); roDrive.setSub(rabi); return; }
    const r = drive.last;
    roDrive.set(r ? `P₀ ${r.p0.toFixed(4)} · E ${(r.field[0]).toExponential(2)}` : 'preparing…', r ? 'live' : 'warn');
    const held = r && r.laneRe && drive.laneKeys ? drive.laneKeys.reduce((s0, key, i) => s0 + r.laneRe[i] ** 2 + r.laneIm[i] ** 2, 0) : 1;
    /* THE PITCH (0.6.2 H2): the stick ω is nearest, and the carrier heard at this RATE, f = ω·RATE/2π */
    let nk = -1; if (ladder) for (let k = 0; k < ladder.count; k++) if (isBright(k) && (nk < 0 || Math.abs(ladder.omega[k] - drive.omega) < Math.abs(ladder.omega[nk] - drive.omega))) nk = k;
    const rate = api.rate ? api.rate() : 0, lag = r && Math.abs(r.lag) > 1e-9;
    const pitch = (nk >= 0 ? ` · nearest ${label(nk)}, ${(drive.omega - ladder.omega[nk]).toFixed(4)} Eh off` : '') + ` · ${(drive.omega * rate / TAU).toFixed(0)} Hz · ${String(ladder && ladder.basis || '').toUpperCase().replace('-STAR', '*')}`
      + (lag && drive.speed > 0 && rate > drive.speed ? ` · the drive runs at 1/${(rate / drive.speed).toFixed(1)} of real time` : '');
    roDrive.setSub(r ? `${rabi} · norm − 1 ${(r.norm - 1).toExponential(1)} · outside the lanes ${(100 * Math.max(0, 1 - held)).toFixed(2)} %` + (lag ? ` · catching up ${r.lag.toFixed(1)} a.u.` : '') + pitch : rabi + pitch);
  }

  /* ── the lanes: hydrogen's .sp-row, over the same kit nodes ───────────────────────────────────── */
  const rows = new Map();
  function lane(key) {
    const c = lanes.get(key), root = el('div', 'sp-row'); root.dataset.k = String(key);
    const rgb = key === GROUND ? null : (isBright(key) ? vividInk(nRGB(AXIS_N[axisOf(key)])) : null);
    root.style.setProperty('--nc', rgb ? `rgb(${rgb.join(',')})` : 'var(--ink-faint)');
    el('div', 'sp-band', root);
    const id = el('div', 'sp-id', root);
    const nm = el('div', 'sp-name sp-nm', id, label(key));
    const es = el('div', 'sp-sub sp-e', id, key === GROUND ? 'ground' : ladder.omega[key].toFixed(4));
    id.title = key === GROUND ? 'S₀, the RHF ground determinant — pinned: a bright line’s slosh is its cross term with this lane'
      : `${label(key)} · ω_TDA ${ladder.omega[key].toFixed(6)} Eh · f ${ladder.f[key].toFixed(4)} · μ (${[0, 1, 2].map((q) => ladder.mu[3 * key + q].toFixed(3)).join(', ')})`
        + (ladder.size[key] > 1 ? ` · one of a ${ladder.size[key]}-fold level, canonical gauge (pivot ${ladder.pivot[key].toExponential(1)})` : '');
    id.addEventListener('click', () => { selected = key; paint(); markSel(); });
    const pop = fader({ label: '<m>|b|²</m>', aria: '|b|² ' + label(key), min: 0, max: 1, value: c.amp * c.amp, cls: 'pop', fmt: (v) => v.toFixed(3),
      onInput: (v) => setAmp(key, Math.sqrt(Math.max(0, v))), onChange: (v) => setAmp(key, Math.sqrt(Math.max(0, v))) });
    root.appendChild(pop.root);
    const ph = knob({ aria: 'phase ' + label(key), min: 0, max: TAU, value: c.phase, wrap: true, cls: 'live', fmt: (v) => (v * 180 / Math.PI).toFixed(0) + '°',
      onDelta: (dv) => { const l = lanes.get(key); if (l) setPhase(key, l.phase + dv); }, onReset: () => setPhase(key, 0) });
    const kn = el('div', 'sp-knobs', root); kn.appendChild(ph.root);
    const mute = el('button', 'sp-b mute', root, 'M'); mute.type = 'button'; mute.title = 'mute: leave this state out of the FIELD (the register keeps b)';
    mute.setAttribute('aria-label', 'mute ' + label(key)); mute.setAttribute('aria-pressed', 'false');
    mute.addEventListener('click', () => { const l = lanes.get(key); l.mute = !l.mute; touch(); syncLanes(); api.repaint(); });
    const solo = el('button', 'sp-b solo', root, 'S'); solo.type = 'button'; solo.title = 'solo: play this state alone';
    solo.setAttribute('aria-label', 'solo ' + label(key)); solo.setAttribute('aria-pressed', 'false');
    solo.addEventListener('click', () => { const l = lanes.get(key); l.solo = !l.solo; touch(); syncLanes(); api.repaint(); });
    const x = el('button', 'sp-x', root, key === GROUND ? '' : '×'); x.type = 'button'; x.disabled = key === GROUND;
    x.title = key === GROUND ? 'S₀ is pinned' : 'Take this state out of the register'; x.setAttribute('aria-label', 'remove ' + label(key));
    x.addEventListener('click', () => deselect(key));
    return { root, pop, ph, mute, solo, nm, es, key };
  }
  function markSel() { for (const [k, L] of rows) L.root.classList.toggle('sel', k === selected); }
  function syncLanes() {
    for (const [k, L] of rows) {
      const c = lanes.get(k); if (!c) continue;
      const p = c.amp * c.amp; if (Math.abs(L.pop.get() - p) > 1e-12) L.pop.set(p);
      L.mute.classList.toggle('on', c.mute); L.mute.setAttribute('aria-pressed', String(c.mute));
      L.solo.classList.toggle('on', c.solo); L.solo.setAttribute('aria-pressed', String(c.solo));
      L.root.classList.toggle('muted', c.mute); L.root.classList.toggle('off', k !== GROUND && model && !model.has(k));
    }
  }
  function rebuild() {
    const want = ladder ? keys() : [], keep = new Set(want);
    for (const [k, L] of rows) if (!keep.has(k)) { L.root.remove(); rows.delete(k); }
    let prev = null;
    for (const k of want) {
      let L = rows.get(k);
      if (!L) { L = lane(k); rows.set(k, L); }
      if (prev ? prev.nextSibling !== L.root : rowsEl.firstChild !== L.root) rowsEl.insertBefore(L.root, prev ? prev.nextSibling : rowsEl.firstChild);
      prev = L.root;
    }
    markSel(); syncLanes();
    if (api.stamp) api.stamp();                                                  // lanes come and go: their phase needles are the reg.ph slots' knobs, so re-tag them
  }
  /** the needles turn with the clock: arg b_K(t) = arg b_K − ω_K t */
  function spin(t) { for (const [k, L] of rows) { const c = lanes.get(k); if (!c) continue; const a = (((c.phase - energyOf(k) * t) % TAU) + TAU) % TAU; L.ph.set(a); } }

  /* ── the readouts ─────────────────────────────────────────────────────────────────────────────── */
  let roWall = 0, beatWall = 0;
  function refresh() {
    if (!sol || !ladder) {
      for (const r of [roSum, roBeat, roMu]) r.set('—', ''); roMu.setSub(LAW);
      status(sol ? 'the state ladder is on its way — MOLECULES’ spectrum comes first' : 'no molecule solved yet — MOLECULES solves the ladder this register runs on', 'warn');
      return;
    }
    const s = sum2();
    roSum.set(s.toFixed(6), Math.abs(s - 1) < 1e-9 ? 'ok' : 'warn');
    roSum.setSub(`${lanes.size} of ${LANE_CAP} lanes · ${ladder.count} states in the ladder · the field always plays b/‖b‖`);
    const dl = drive.on && drive.last ? drive.last : null;                        // under the DRIVE the beats are those of the driven populations
    const list = (dl ? keys().map((key) => ({ key, energy: energyOf(key), amp: Math.sqrt(Math.max(0, key === GROUND ? dl.p0 : dl.pops[key])) }))
      : morphOn && storeA && storeB ? [...slerpCoefficients(storeA, storeB, morphS)].map(([key, c]) => ({ key, energy: energyOf(key), amp: Math.hypot(c.re, c.im) }))
      : keys().filter((k) => !lanes.get(k).mute).map((key) => ({ key, energy: energyOf(key), amp: lanes.get(key).amp })));
    const beats = beatsOf(list), b = beats[0];
    roBeat.set(b ? `${b.period.toFixed(3)} a.u. = ${(b.period * AU_TIME_AS).toFixed(1)} as` : '—', b ? 'ok' : '');
    roBeat.setSub(b ? `${label(b.a)} × ${label(b.b)} · ΔE ${b.dE.toFixed(6)} Eh` + (beats.length > 1 ? ` · ${beats.length - 1} more beat${beats.length > 2 ? 's' : ''}` : '') : 'one level has no beat: add a state');
    const why = refusal();
    status(on ? `MO-REGISTRY ON · ${morphOn ? 'MORPH A ↔ B' : lanes.size + ' lane' + (lanes.size === 1 ? '' : 's')} · ${LAW}`
      : why ? 'MO-REGISTRY off — ' + why : `${ladder.count} states · MO-REGISTRY ON plays the many-electron state`, on ? 'live' : why ? 'warn' : 'ok');
  }
  function paintMu(t) {
    const ms = performance.now(); if (ms - roWall < 200) return; roWall = ms;
    if (!model || !on) { roMu.set('—', ''); roMu.setSub(LAW); return; }
    const d = model.state.dipole;
    roMu.set(`(${d[0].toFixed(4)}, ${d[1].toFixed(4)}, ${d[2].toFixed(4)})`, 'live');
    roMu.setSub(`t = ${(Number.isFinite(t) ? t : now()).toFixed(3)} a.u. · excited population ${model.state.excited.toFixed(4)} · ${LAW}`);
  }

  /* ── THE LADDER ───────────────────────────────────────────────────────────────────────────────── */
  let hovers = [], hits = [];
  const hover = graphHover(cv, { repaint: () => paint() });
  function levels() {
    const out = [{ E: 0, items: [GROUND] }];
    if (!ladder) return out;
    for (let k = 0; k < ladder.count; k++) {
      if (brightOnly && !(ladder.f[k] > BRIGHT_F && ladder.omega[k] < CORE_W) && !lanes.has(k)) continue;
      const last = out[out.length - 1];
      if (last.items[0] !== GROUND && ladder.cluster[last.items[0]] === ladder.cluster[k]) { last.items.push(k); continue; }
      out.push({ E: ladder.omega[k], items: [k] });
    }
    return out;
  }
  function paint() {
    if (!shown) return;
    const W = cv.clientWidth, H = cv.clientHeight; if (W < 32 || H < 32) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const T = themeInk(g), left = 44, right = W - 8, top0 = 10, bot = H - 15, plot = { x0: left, y0: top0, x1: right, y1: bot };
    hovers = []; hits = []; g.font = '8px ui-monospace, monospace'; g.textBaseline = 'middle';
    if (!ladder) { g.fillStyle = T.ink(0.85); g.textAlign = 'center'; g.fillText(sol ? 'the state ladder is on its way…' : 'no molecule solved — MOLECULES solves this ladder', W / 2, H / 2); hover.set([], plot); return; }
    const lv = levels(), ys = softCapLevels(lv.map((l) => l.E)), n2 = sum2() || 1;
    let fMax = 0; for (let k = 0; k < ladder.count; k++) fMax = Math.max(fMax, ladder.f[k]);
    const used = []; g.textAlign = 'right';
    lv.forEach((row, i) => {
      const yy = bot - ys[i] * (bot - top0), seg0 = (right - left) / row.items.length;
      row.items.forEach((key, j) => {
        const x0 = left + j * seg0 + 1, x1 = x0 + seg0 - 2, c = lanes.get(key), lit = !!c;
        const bright = key !== GROUND && isBright(key), rgb = key === GROUND ? accentRGB(g, 1) : bright ? vividInk(nRGB(AXIS_N[axisOf(key)])) : null;
        const ink = (a) => (rgb ? `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})` : T.ink(a * 0.7));
        const wgt = key === GROUND ? 2 : 1 + 2 * Math.sqrt(fMax > 0 ? ladder.f[key] / fMax : 0);
        g.strokeStyle = ink(lit ? 1 : bright || key === GROUND ? 0.7 : 0.38); g.lineWidth = lit ? wgt + 0.8 : wgt;
        g.beginPath(); g.moveTo(x0, yy); g.lineTo(x1, yy); g.stroke();
        if (lit && c.amp > 0) { g.fillStyle = ink(0.6); g.fillRect(x0, yy - 4, Math.max(3, (x1 - x0) * c.amp * c.amp / n2), 8); }   // the lane's own population
        if (key === selected) { g.strokeStyle = T.fg(0.9); g.lineWidth = 1; g.strokeRect(x0 - 1, yy - 5, x1 - x0 + 2, 10); }
        hits.push({ y: yy, x0, x1, key });
        hovers.push({ kind: 'line', key: 'S' + key, points: [x0, yy, x1, yy], lw: wgt, colour: ink(1),
          info: key === GROUND ? 'S₀ · the RHF ground determinant · pinned' + (lit ? ` · |b|² ${(c.amp * c.amp / n2).toFixed(3)}` : '')
            : `${label(key)} · ω_TDA ${ladder.omega[key].toFixed(6)} Eh · f ${ladder.f[key].toFixed(4)}` + (bright ? ` · along ${AX[axisOf(key)]}` : ' · dark')
              + (ladder.size[key] > 1 ? ` · ${ladder.size[key]}-fold` : '') + (lit ? ` · in the register: |b|² ${(c.amp * c.amp / n2).toFixed(3)}, arg b ${(c.phase * 180 / Math.PI).toFixed(0)}°` : '  ·  click to add') });
      });
      if (!used.some((q) => Math.abs(q - yy) < 9)) { used.push(yy); g.fillStyle = T.ink(0.85); g.fillText(i === 0 ? 'S₀' : row.E.toFixed(row.E < 10 ? 3 : 1), left - 4, yy); }
    });
    g.fillStyle = T.ink(0.8); g.textAlign = 'left';
    fitText(g, `ω_TDA Eh · ${brightOnly ? 'bright valence states (f > ' + BRIGHT_F + ')' : 'all ' + ladder.count + ' states'} · TD-CIS, not ω_RPA`, left, H - 5, { x0: left, y0: H - 11, x1: W - 4, y1: H - 1 }, 'left', true);
    hover.set(hovers, plot);
  }
  /* 2026-10 (Josh) · PAINT THE LADDER (lab/paint-stroke.js), the ORBITAL ladder's law: LEFT adds, RIGHT removes; a press
     takes the state under it, a drag every row it crosses (a degenerate row whole) plus the state nearest the pointer.
     S₀ is pinned: pressing it only focuses it, as a click always did. */
  const local = (e) => {
    const r = cv.getBoundingClientRect(), sx = r.width ? cv.offsetWidth / r.width : 1, sy = r.height ? cv.offsetHeight / r.height : 1;
    return { x: (e.clientX - r.left) * sx - cv.clientLeft, y: (e.clientY - r.top) * sy - cv.clientTop };
  };
  const nearest = (p) => { let best = null, bd = Infinity; for (const h of hits) { const dy = Math.abs(h.y - p.y); if (dy > 8) continue; const dx = p.x < h.x0 ? h.x0 - p.x : p.x > h.x1 ? p.x - h.x1 : 0, d = dy * 1e4 + dx; if (d < bd) { bd = d; best = h; } } return best; };
  paintStroke(cv, { local, ready: () => hits.length > 0, onStart: () => hover.clear(),
    at: (p) => { const h = nearest(p); return h ? [h.key] : []; },
    across: (a, b) => { const lo = Math.min(a.y, b.y), hi = Math.max(a.y, b.y); return hi - lo < 0.5 ? [] : hits.filter((h) => h.y > lo && h.y < hi).map((h) => h.key); },
    apply: (keys, add) => { if (keys.length === 1 && keys[0] === GROUND) { selected = GROUND; paint(); markSel(); return; } paintStates(keys, add); } });
  /* a click no pointer made: the old law, minus the toggle-off (removal is a right press now) */
  cv.addEventListener('click', (e) => {
    let best = null;
    for (const h of hits) { if (e.offsetX < h.x0 - 2 || e.offsetX > h.x1 + 2) continue; const dd = Math.abs(h.y - e.offsetY); if (dd <= 8 && (!best || dd < best.d)) best = { d: dd, key: h.key }; }
    if (!best) return;
    if (best.key === GROUND) { selected = GROUND; paint(); markSel(); } else paintStates([best.key], true);
  });

  /* ── THE DIPOLE SCOPE ─────────────────────────────────────────────────────────────────────────── */
  function paintScope() {
    if (!shown) return;
    const W = scope.clientWidth, H = scope.clientHeight; if (W < 24 || H < 24) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (scope.width !== Math.round(W * dpr) || scope.height !== Math.round(H * dpr)) { scope.width = Math.round(W * dpr); scope.height = Math.round(H * dpr); }
    const g = scope.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const T = themeInk(g), A = accentRGB(g, 2), cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 12;
    g.font = '8px ui-monospace, monospace'; g.textBaseline = 'middle'; g.textAlign = 'center';
    const reach = [0, 0, 0];
    for (let i = 0; i < trailN; i++) for (let q = 0; q < 3; q++) reach[q] = Math.max(reach[q], Math.abs(trail[3 * i + q]));
    const order = [0, 1, 2].sort((a, b) => reach[b] - reach[a] || a - b), px = Math.min(order[0], order[1]), py = Math.max(order[0], order[1]);
    const peak = Math.max(reach[px], reach[py]);
    g.strokeStyle = T.ink(0.35); g.lineWidth = 1; g.beginPath(); g.moveTo(cx - R, cy); g.lineTo(cx + R, cy); g.moveTo(cx, cy - R); g.lineTo(cx, cy + R); g.stroke();
    g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke();
    g.fillStyle = T.ink(0.85); g.textAlign = 'right'; g.fillText('δμ' + AX[px], W - 4, cy - 6); g.textAlign = 'left'; g.fillText('δμ' + AX[py], cx + 4, 7); g.textAlign = 'center';
    if (!on || trailN < 2 || !(peak > 1e-9)) { g.fillText(on ? 'still' : 'dipole scope', cx, H - 6); return; }
    const k = R / peak;
    for (let i = 1; i < trailN; i++) {
      const a = (trailAt - trailN + i - 1 + 512) % 256, b = (a + 1) % 256;
      g.strokeStyle = `rgba(${A[0]},${A[1]},${A[2]},${(0.08 + 0.9 * i / trailN).toFixed(3)})`; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(cx + k * trail[3 * a + px], cy - k * trail[3 * a + py]); g.lineTo(cx + k * trail[3 * b + px], cy - k * trail[3 * b + py]); g.stroke();
    }
    const last = (trailAt + 255) % 256;
    g.fillStyle = T.fg(0.95); g.beginPath(); g.arc(cx + k * trail[3 * last + px], cy - k * trail[3 * last + py], 2.6, 0, TAU); g.fill();
    g.fillStyle = T.ink(0.85); g.fillText(`|δμ| ≤ ${peak.toFixed(3)}`, cx, H - 6);
  }
  window.addEventListener('resize', () => { paint(); paintScope(); });

  /* ── CHEMISTRY's road ─────────────────────────────────────────────────────────────────────────── */
  function adopt(s) {
    const fresh = !sol || !s || s.hash !== sol.hash || s.seq !== sol.seq;
    sol = s || null;
    if (!fresh) return;
    ladder = null; model = null; flow = null; flowOn = false; flowSw.set(false); fr.hidden = true; pending.clear(); rows.forEach((L) => L.root.remove()); rows.clear();
    lanes.clear(); lanes.set(GROUND, { amp: 1, phase: 0, mute: false, solo: false }); selected = GROUND;
    storeA = storeB = null; aBtn.classList.remove('on'); bBtn.classList.remove('on'); morphOn = false; morphSw.set(false); trailN = 0; trailAt = 0;
    pushedT = NaN; pushedV = -1; touch();
    if (drive.on) { drive.on = false; drive.seq++; drive.busy = false; drive.last = null; driveSw.set(false); rowsEl.classList.remove('reg-driven'); }
    if (on) { setOn(false); armed = 2; }                                         // 0.5.3 M3: no auto-off — it stands by for the new ladder, which re-arms it
    says(null); paint(); paintScope(); refresh();
    if (sol) fetchLadder();
  }
  function ensureSub() {
    if (unsub) return true;
    const c = C(); if (!c || !c.subscribe) return false;
    unsub = c.subscribe((s) => adopt(s));
    if (c.onPick) c.onPick((k) => play(k));
    return true;
  }
  /** a TDA stick was clicked in CHEMISTRY's plot: that state joins the register and the register plays */
  function play(k) {
    if (!ladder || !(k >= 0) || k >= ladder.count) return false;
    if (api.show) api.show('states');
    if (!lanes.has(k)) { const g0 = lanes.get(GROUND); if (lanes.size === 1 && g0) g0.amp = 0.8; if (!select(k, 0.45, 0)) return false; }
    selected = k; markSel(); paint();
    if (!on) setOn(true);
    return true;
  }
  if (S()) S().register('states', { push: () => push(now(), true), view: () => (view === 'density' ? 'density' : 'real') });
  ensureSub();

  /* ── the frame ────────────────────────────────────────────────────────────────────────────────── */
  function update(t) {
    if (song.on) pumpSong(t);
    if (!ensureSub()) return false;
    if (!on) return false;
    const why = refusal();
    if (why) { if (!C() || !C().on) { setOn(false); status('MO-REGISTRY standing by — turn MOLECULES on, then MO-REGISTRY ON', ''); return false; }   // MOLECULES went off: the window stays
      status('MO-REGISTRY off — ' + why, 'warn'); return false; }
    if (!Number.isFinite(t)) t = 0;
    if (drive.on) { pumpDrive(t); if (active && shown) { paintScope(); paintMu(t); refreshDrive(); } return true; }
    const moved = push(t);
    if (active && shown) { if (moved) { spin(t); paintScope(); } paintMu(t); }
    return moved;
  }
  function setActive(v) { const next = !!v; if (next === active) return active; active = next; if (active) { paint(); paintScope(); refresh(); } return active; }
  function setShown(v) { shown = !!v; if (shown) { paint(); paintScope(); refresh(); } }

  /* ── the record ───────────────────────────────────────────────────────────────────────────────── */
  const packStore = (M) => (M ? [...M].map(([key, c]) => ({ key, re: c.re, im: c.im })) : null);
  const unpackStore = (a) => { if (!Array.isArray(a) || !a.length) return null; const M = new Map(); for (const e of a) { const key = Math.round(e && e.key); if (Number.isFinite(key) && key >= GROUND && ladder && key < ladder.count) M.set(key, { re: +e.re || 0, im: +e.im || 0 }); } return M.size ? M : null; };
  function applyRecord(r, parked) {
    lanes.clear(); if (parked || !emptyLanes(r)) lanes.set(GROUND, { amp: 1, phase: 0, mute: false, solo: false });
    for (const e of (Array.isArray(r.lanes) ? r.lanes : [])) {
      const key = Math.round(e && e.key);
      if (!Number.isFinite(key) || key < GROUND || key >= ladder.count || lanes.size >= LANE_CAP && !lanes.has(key)) continue;
      /* a saved lane carries its ω: a different ladder under the same index is not the same state, so it is dropped */
      if (key !== GROUND && Number.isFinite(e.omega) && Math.abs(e.omega - ladder.omega[key]) > 1e-6) continue;
      lanes.set(key, { amp: Math.max(0, Math.min(1, Number.isFinite(e.amp) ? e.amp : 0.45)), phase: ((((+e.phase || 0) % TAU) + TAU) % TAU), mute: !!e.mute, solo: !!e.solo });
    }
    storeA = unpackStore(r.A); storeB = unpackStore(r.B); aBtn.classList.toggle('on', !!storeA); bBtn.classList.toggle('on', !!storeB);
    if (storeA) request([...storeA.keys()]); if (storeB) request([...storeB.keys()]);
    view = r.view === 'density' ? 'density' : 'change'; ref = r.ref === 'mean' ? 'mean' : 'ground'; viewSeg.set(view); refSeg.set(ref);
    morphS = Math.min(1, Math.max(0, +r.morph || 0)); morphK.set(morphS); morphOn = !!r.morphOn && !!storeA && !!storeB; morphSw.set(morphOn);
    if (r.flow !== undefined) setFlow(!!r.flow);
    setFlowSource(r.flowSource);
    if (r.drive) { for (const k of ['pol', 'envelope', 'duration', 'omega', 'e0', 'phase']) if (r.drive[k] !== undefined) setDriveParam(k, r.drive[k]); wK.set(drive.omega); eK.set(drive.e0); durK.set(drive.duration); }
    selected = GROUND;
  }
  function save() {
    return { on, view, ref, flow: flowOn, ...(flowSrc === 'balanced' && { flowSource: flowSrc }), morph: morphS, morphOn, A: packStore(storeA), B: packStore(storeB),
      drive: { pol: drive.pol, omega: drive.omega, e0: drive.e0, envelope: drive.envelope, duration: drive.duration, phase: drive.phase },   // the knobs, never the run: a project opens paused and undriven
      lanes: keys().map((key) => { const c = lanes.get(key); return { key, omega: key === GROUND || !ladder ? 0 : ladder.omega[key], amp: c.amp, phase: c.phase, mute: c.mute, solo: c.solo }; }), ...(song.meta && { song: { ...song.meta } }) };
  }
  /* 0.3.1 · S4: a record whose lane list is EMPTY was written before a solution seeded the ground lane (NEW, a MOLECULES ON
     undone); on the ladder it was written beside it lands empty, and the ground lane is seeded again when the register next
     plays (setOn).  Parked for a ladder still to come, it is a record OLDER than that ladder: its solve seeds the ground lane. */
  const emptyLanes = (r) => Array.isArray(r.lanes) && r.lanes.length === 0;
  function songLoad(m) {   // the same track still in memory stays; another hash says so on the row and leaves the register alone; none clears it
    if (m && song.meta && m.hash === song.meta.hash) { setSongE0(m.e0); sE.set(song.e0); return; }
    if (song.on) setSong(false); song.samples = null; song.meta = m ? { hash: m.hash, name: String(m.name || ''), e0: +m.e0 || 3e-3, rateAtDrop: +m.rateAtDrop || 1 } : null;
    if (m) { song.e0 = song.meta.e0; sE.set(song.e0); } refreshSong();
  }
  function load(r) {
    if (!r) return false;
    songLoad(r.song);
    if (!ladder) { wanted = r; armed = 0; if (emptyLanes(r)) lanes.clear(); if (on) setOn(false); return true; }
    applyRecord(r); request(keys()); touch(); rebuild(); paint(); refresh();
    if (r.on && !on) setOn(true); else if (!r.on && on) setOn(false); else if (on) push(now(), true);
    publishPopulations(); api.repaint();
    return true;
  }
  const slotKey = (i) => keys()[i];
  return {
    update, setActive, setShown, paint, refresh, onSwitch: onSw.root,   // registerview.js seats it beside ORBITAL | STATES
    get on() { return on; }, setOn, get songOn() { return song.on; },
    setFlow, setFlowSource, get flowOn() { return flowOn; }, get flowEpoch() { return flowEpoch; }, flowSource() { return flow; },
    select, deselect, toggle, clear, norm, setAmp, setPhase, preset, play, store, setMorph, setView, setRef, setDrive, setDriveParam, tune,
    get drive() { return { on: drive.on, ready: drive.ready, pol: drive.pol, omega: drive.omega, e0: drive.e0, envelope: drive.envelope, duration: drive.duration, last: drive.last ? { t: drive.last.t, p0: drive.last.p0, norm: drive.last.norm, steps: drive.last.steps, lag: drive.last.lag, pops: drive.last.pops } : null }; },
    get view() { return view; }, get ref() { return ref; }, get morph() { return morphS; }, get morphOn() { return morphOn; },
    /* the eight modulation slots: lane order, present-only */
    knobs: { morph: () => morphK, driveW: () => wK, driveE: () => eK, pop: (i) => { const L = rows.get(slotKey(i)); return L ? L.pop : null; }, ph: (i) => { const L = rows.get(slotKey(i)); return L ? L.ph : null; } },
    slotAmp: (i) => { const c = lanes.get(slotKey(i)); return c ? c.amp * c.amp : 0; },
    setSlotAmp(i, v) { const k = slotKey(i); if (k === undefined) return; const c = lanes.get(k); c.amp = Math.sqrt(Math.max(0, Math.min(1, v))); touch(); },
    slotPhase: (i) => { const c = lanes.get(slotKey(i)); return c ? c.phase : 0; },
    setSlotPhase(i, v) { const k = slotKey(i); if (k === undefined) return; lanes.get(k).phase = ((v % TAU) + TAU) % TAU; touch(); },
    setMorphValue(v) { morphS = Math.min(1, Math.max(0, v)); touch(); },
    ladder() { return ladder ? { count: ladder.count, omega: ladder.omega, f: ladder.f, mu: ladder.mu, size: ladder.size, cluster: ladder.cluster, pivot: ladder.pivot } : null; },
    state() {
      const list = keys().map((key) => { const c = lanes.get(key); return { key, label: label(key), omega: energyOf(key), amp: c.amp, phase: c.phase, mute: c.mute, solo: c.solo, ready: model ? model.has(key) : false }; });
      const b = ladder ? beatsOf(list.map((l) => ({ key: l.key, energy: l.omega, amp: l.amp })))[0] : null;
      return { on, view, ref, morphOn, morph: morphS, hasA: !!storeA, hasB: !!storeB, lanes: list, sum: sum2(), count: ladder ? ladder.count : 0,
        beat: b ? { period: b.period, dE: b.dE, attoseconds: b.period * AU_TIME_AS } : null,
        dipole: model ? [...model.state.dipole] : null, excited: model ? model.state.excited : null, scale: model ? model.state.scale : null,
        trail: trailN, refusal: refusal(), status: statusText, law: LAW, hash: sol ? sol.hash : null, pending: pending.size };
    },
    save, load,
    dispose() { if (unsub) { unsub(); unsub = null; } },
  };
}
