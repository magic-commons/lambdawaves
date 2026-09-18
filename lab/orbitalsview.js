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
import { el, knob, sw, readout, graphHover, themeInk, accentRGB, fitText } from './mir/kit.js';
import { slerpCoefficients } from './molecular-register.js';

const DEG = 1e-6;                       // |Δε| below this is one degenerate row, drawn side by side
const TAU = 2 * Math.PI;
const LAW = 'frozen orbitals · beats at Δε, not at ω_RPA';

export function createOrbitals(host, api) {
  const F = () => (api.field ? api.field() : null);
  const C = () => (api.chem ? api.chem() : null);
  const S = () => api.session || null;
  const now = () => (api.now ? api.now() : 0);
  const status = (t, cls) => { statusText = t; if (api.status) api.status(t, cls === undefined ? '' : cls); };

  let sol = null, on = false, active = api.active ? !!api.active() : true;
  let statusText = 'no molecule solved yet', unsub = null, wanted = null;
  let re = null, im = null, pushedT = NaN, pushedV = -1, version = 0, selected = -1;
  const sel = new Map();                // k → { amp, phase } — the register's own coefficients

  /* ── the ladder ───────────────────────────────────────────────────────────────────────────────── */
  const cv = el('canvas', 'mol-c', host);
  cv.title = 'The molecular orbital ladder: ε_k in hartree, occupied levels filled and virtual ones hollow, degenerate levels side by side. '
    + 'Click a level to put it in the register, click it again to take it out. The axis is order-exact but not linear: every gap is drawn to scale '
    + 'up to three times the median gap and compressed beyond it, because H₂O’s O 1s at −20.24 would otherwise put the whole valence inside four pixels.';

  /* ── the head: the same four controls SPECTRUM's head carries, in the same order ──────────────── */
  const head = el('div', 'row tight sp-head', host);
  const dialsBtn = el('button', 'trig', head); dialsBtn.type = 'button'; dialsBtn.textContent = 'DIALS';
  dialsBtn.title = 'Show or hide the amplitude and phase dials for the selected orbitals';
  dialsBtn.setAttribute('aria-expanded', 'false');
  const clrBtn = el('button', 'trig', head); clrBtn.type = 'button'; clrBtn.textContent = 'CLEAR';
  clrBtn.title = 'Empty the register (c ↦ 0 for every orbital)';
  const nrmBtn = el('button', 'trig', head); nrmBtn.type = 'button'; nrmBtn.textContent = 'NORM';
  nrmBtn.title = 'Renormalise the register so Σ|c|² = 1';
  const onSw = sw({ label: 'REGISTER ON', value: false, cls: 'orb-on',
    title: 'Give the field this register’s amplitude ψ(r, t) and set the observable to phase — CHEMISTRY must be ON and not running',
    onChange: (v) => { setOn(v); } });
  head.appendChild(onSw.root);

  /* THE SHARED BAR (REGISTER-WINDOW-SPEC §5, §9): the same PRESET · → A · → B · MORPH the STATES mode carries.  A preset
     is a RULE, so it exists for every molecule or says why not; MORPH plays the normalised path between two stored
     registers — for orthogonal stores cos/sin, hydrogen's TRANSITION envelope — and is a performance path, not dynamics. */
  const ORB_PRESETS = ['HOMO + LUMO', 'WINDING'];
  let storeA = null, storeB = null, morphOn = false, morphS = 0;
  const bar = el('div', 'row tight reg-bar', host);
  const presetSel = el('select', 'sel', bar); presetSel.setAttribute('aria-label', 'register preset');
  presetSel.title = 'HOMO + LUMO: the frozen-orbital beat. WINDING: a degenerate orbital pair a quarter turn apart — a phase that winds around the ring under a stationary density';
  { const o = el('option', '', presetSel, 'PRESET…'); o.value = ''; for (const p of ORB_PRESETS) { const q = el('option', '', presetSel, p); q.value = p; } }
  presetSel.addEventListener('change', () => { const p = presetSel.value; presetSel.value = ''; if (p) preset(p); });
  const aBtn = el('button', 'trig', bar); aBtn.type = 'button'; aBtn.textContent = '→ A'; aBtn.title = 'Store this register as A';
  const bBtn = el('button', 'trig', bar); bBtn.type = 'button'; bBtn.textContent = '→ B'; bBtn.title = 'Store this register as B';
  aBtn.addEventListener('click', () => store('A')); bBtn.addEventListener('click', () => store('B'));
  const mrow = el('div', 'row tight reg-morph', host);
  const morphSw = sw({ label: 'MORPH', value: false, title: 'Play the normalised path from A to B instead of the dials — a performance path, not dynamics', onChange: (v) => setMorph(v, morphS) });
  const morphK = knob({ label: '<m>A ↔ B</m>', aria: 'morph A to B', min: 0, max: 1, value: 0, fmt: (v) => v.toFixed(3),
    title: 'Where on the path from A (0) to B (1) the register plays', onInput: (v) => setMorph(morphOn, v) });
  mrow.appendChild(morphSw.root); mrow.appendChild(morphK.root);

  const rowsEl = el('div', 'sp-rows', host); rowsEl.hidden = true;
  dialsBtn.addEventListener('click', () => setDials(rowsEl.hidden));
  clrBtn.addEventListener('click', () => { clear(); });
  nrmBtn.addEventListener('click', () => { norm(); });

  /* ── the readouts ─────────────────────────────────────────────────────────────────────────────── */
  const rr = el('div', 'row tight', host);
  const roGap = readout({ label: '<m>Δε</m>  (hartree)', value: '—', sub: '' });
  const roBeat = readout({ label: 'BEAT  <m>2π/Δε</m>', value: '—', sub: '' });
  const roSum = readout({ label: '<m>Σ|c|²</m>', value: '—', sub: '' });
  const roPsi = readout({ label: '<m>ψ(t)</m>', cls: 'wide', value: '—', sub: LAW });
  for (const r of [roGap, roBeat, roSum, roPsi]) rr.appendChild(r.root);
  el('div', 'note', host).innerHTML = '<b>Model.</b> The one-electron register over CHEMISTRY’s canonical orbitals: '
    + '<m>ψ(r, t) = Σ_k c_k e^{−iε_k t} φ_k(r)</m> with <m>φ_k = Σ_μ C_μk χ_μ</m> — hydrogen’s register with the molecule’s ladder. '
    + 'The ladder is <b>frozen</b>: a HOMO + LUMO pair beats at the Koopmans gap <m>Δε</m>, not at the RPA excitation <m>ω</m> the '
    + 'CHEMISTRY sticks stand at. Occupancies are the ground state’s; putting a virtual orbital in the register does not excite the molecule, '
    + 'it asks what one electron in that superposition would look like. The field shows <m>arg ψ</m> in PHASE and <m>|ψ|²</m> in DENSITY.';

  /* ── the register ─────────────────────────────────────────────────────────────────────────────── */
  const nAO = () => (sol ? sol.nAO : 0);
  const nocc = () => (sol ? sol.nocc : 0);
  const label = (k) => {
    if (!sol) return 'k' + (k + 1);
    const d = k - (sol.nocc - 1);
    return d === 0 ? 'HOMO' : d === 1 ? 'LUMO' : d < 0 ? 'HOMO−' + (-d) : 'LUMO+' + (d - 1);
  };
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
    if (!sol || !(k >= 0) || k >= sol.nAO) return false;
    sel.set(k | 0, { amp: Math.max(0, Math.min(1, +amp || 0)), phase: ((+phase || 0) % TAU + TAU) % TAU });
    selected = k | 0; touch(); rebuild(); paint(); refresh(); api.repaint(); return true;
  }
  function deselect(k) { if (!sel.delete(k | 0)) return false; if (selected === (k | 0)) selected = -1; touch(); rebuild(); paint(); refresh(); api.repaint(); return true; }
  function toggle(k) { return sel.has(k | 0) ? deselect(k) : select(k, 1, 0); }
  function clear() { if (!sel.size) return false; sel.clear(); selected = -1; touch(); rebuild(); paint(); refresh(); api.repaint(); return true; }
  /** NORM is an explicit act, exactly as it is in the hydrogen register: nothing here renormalises on its own */
  function norm() {
    const s = Math.sqrt(sum2());
    if (!(s > 0)) return false;
    for (const c of sel.values()) c.amp = Math.min(1, c.amp / s);
    touch(); rebuild(); paint(); refresh(); api.repaint(); return true;
  }
  function preset(name) {
    if (!sol) return false;
    const h = sol.nocc - 1, l = sol.nocc, R = Math.SQRT1_2;
    if (name === 'HOMO + LUMO') {
      if (!(l < sol.nAO)) { status('HOMO + LUMO: this basis has no virtual orbital', 'warn'); return false; }
      sel.clear(); sel.set(h, { amp: R, phase: 0 }); sel.set(l, { amp: R, phase: 0 }); selected = h;
    } else if (name === 'WINDING') {
      const pairAt = (k) => k >= 0 && k + 1 < sol.nAO && Math.abs(sol.eps[k + 1] - sol.eps[k]) < DEG;
      let k = pairAt(h - 1) ? h - 1 : pairAt(l) ? l : -1;
      if (k < 0) for (let q = sol.nAO - 2; q >= 0; q--) if (pairAt(q)) { k = q; break; }
      if (k < 0) { status('WINDING: no degenerate orbital pair in this molecule — a winding phase needs a twofold level', 'warn'); return false; }
      sel.clear(); sel.set(k, { amp: R, phase: 0 }); sel.set(k + 1, { amp: R, phase: Math.PI / 2 }); selected = k;
    } else return false;
    touch(); rebuild(); paint(); refresh(); api.repaint(); return true;
  }
  function store(which) {
    const M = new Map(); for (const [k, c] of sel) if (c.amp > 0) M.set(k, { re: c.amp * Math.cos(c.phase), im: c.amp * Math.sin(c.phase) });
    if (!M.size) return false;
    if (which === 'A') { storeA = M; aBtn.classList.add('on'); } else { storeB = M; bBtn.classList.add('on'); }
    touch(); return true;
  }
  function setMorph(v, sv) {
    morphS = Math.min(1, Math.max(0, Number.isFinite(sv) ? sv : morphS));
    const want = !!v && !!storeA && !!storeB;
    if (v && !want) status('MORPH needs both stores: → A, change the register, → B', 'warn');
    morphOn = want; morphSw.set(morphOn); if (morphK.get() !== morphS) morphK.set(morphS);
    rowsEl.classList.toggle('reg-morphing', morphOn);
    touch(); api.repaint(); return morphOn;
  }
  function setAmp(k, v) { const c = sel.get(k); if (!c) return; c.amp = Math.max(0, Math.min(1, v)); touch(); paint(); refresh(); api.repaint(); }
  function setPhase(k, v) { const c = sel.get(k); if (!c) return; c.phase = ((v % TAU) + TAU) % TAU; touch(); paint(); refresh(); api.repaint(); }

  /* ── the field ────────────────────────────────────────────────────────────────────────────────── */
  /** why the register may NOT hold the field right now, or null when it may.  The RT-run clause is the session's
   *  own answer — a boolean read of one model's claim, where this used to build CHEMISTRY's thirty-field state()
   *  object and cache it for 200 ms to keep that allocation off the frame loop. */
  function refusal() {
    const c = C();
    if (!c) return 'no CHEMISTRY window';
    if (!c.on) return 'CHEMISTRY OFF: the register needs its molecule on the field';
    if (!sol) return 'no molecule solved yet';
    const s = S();
    if (s && s.claimed('tdhf')) return 'CHEMISTRY RT RUN has the field: stop the run to take it';
    const f = F();
    if (!f || !f.ok) return 'no WebGPU field';
    if (!f.molecular) return 'the field is not molecular yet';
    return null;
  }
  const vec = { re: null, im: null };                 // the pushed pair, reused: the frame loop allocates nothing
  const product = { kind: 'orbital', matrix: vec, view: 'phase', hash: null, solution: -1 };   // and so is the product record
  /** ψ's complex AO vector at t: re/im = Σ_k |c_k| e^{i(arg c_k − ε_k t)} C[:, k] — nAO complex MACs a frame */
  function vectors(t) {
    const n = nAO();
    if (!re || re.length !== n) { re = new Float32Array(n); im = new Float32Array(n); vec.re = re; vec.im = im; }
    re.fill(0); im.fill(0);
    const add = (k, amp, phase) => {
      if (!(amp > 0) || !(k >= 0) || k >= n) return;
      const th = phase - sol.eps[k] * t, cr = amp * Math.cos(th), ci = amp * Math.sin(th);
      for (let mu = 0; mu < n; mu++) { const w = sol.C[mu * n + k]; if (w === 0) continue; re[mu] += cr * w; im[mu] += ci * w; }
    };
    if (morphOn && storeA && storeB) for (const [k, c] of slerpCoefficients(storeA, storeB, morphS)) add(k, Math.hypot(c.re, c.im), Math.atan2(c.im, c.re));
    else for (const [k, c] of sel) add(k, c.amp, c.phase);
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
    pushedT = t; pushedV = version;
    return true;
  }
  function setOn(v) {
    const want = !!v;
    if (want && !on) {
      const why = refusal();
      if (why) { onSw.set(false); status('register off — ' + why, 'warn'); return false; }
      on = true; onSw.set(true);
      pushedT = NaN; pushedV = -1;
      /* the claim is the whole handover: the session selects this model, asks for `phase`, and calls push() */
      if (S()) S().claim('orbital-packet', true, 'the ORBITALS register has the field');
    } else if (!want && on) {
      on = false; onSw.set(false);
      pushedT = NaN; pushedV = -1;
      /* and letting go is the same act in reverse: the session hands the field to the next model by RANK — the
         card if it is on, the user's own observable if nothing claims it — never by guessing a view here */
      if (S()) S().claim('orbital-packet', false, 'REGISTER OFF');
      api.repaint();
    } else { onSw.set(on); }
    refresh();
    return on;
  }

  /* ── the dials ────────────────────────────────────────────────────────────────────────────────── */
  const lanes = new Map();
  function lane(k) {
    const c = sel.get(k);
    const root = el('div', 'row tight orb-lane'); root.dataset.k = String(k);
    const id = el('div', 'sp-id', root);
    const nm = el('div', 'sp-name sp-nm', id, label(k));
    const es = el('div', 'sp-sub sp-e', id, `k${k + 1} · ${sol.eps[k].toFixed(6)} Eh · ${k < nocc() ? '2 e⁻' : 'virtual'}`);
    id.addEventListener('click', () => { selected = k; paint(); markSel(); });
    const amp = knob({ label: '<m>|c|</m>', aria: 'amplitude ' + label(k), min: 0, max: 1, value: c.amp,
      title: 'The amplitude |c_k| of this orbital in the register; NORM makes Σ|c|² = 1',
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
    if (!sol) {
      for (const r of [roGap, roBeat, roSum, roPsi]) { r.set('—', ''); }
      roPsi.setSub(LAW);
      status('no molecule solved yet — CHEMISTRY solves the ladder this register runs on', 'warn');
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
    roSum.setSub(`${sel.size} of ${sol.nAO} orbitals · ${sol.nocc} occupied · NORM sets this to 1`);
    const why = refusal();
    status(on ? `register ON · ${sel.size} orbital${sel.size === 1 ? '' : 's'} · ${LAW}`
      : why ? 'register off — ' + why : `${sol.nAO} orbitals · gap ${Number.isFinite(gap) ? gap.toFixed(6) : '—'} · REGISTER ON gives the field arg ψ`,
      on ? 'live' : why ? 'warn' : 'ok');
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
    for (let k = 0; k < sol.nAO; k++) {
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
      g.fillText('no molecule solved — CHEMISTRY solves the ladder this register runs on', W / 2, H / 2);
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
      const row = rows[i], yy = yOf(i), seg = (right - left) / row.items.length;
      for (let j = 0; j < row.items.length; j++) {
        const lv = row.items[j], x0 = left + j * seg + 1, x1 = x0 + seg - 2;
        const c = sel.get(lv.k), lit = !!c, ink = lv.occ ? occInk : virInk;
        g.strokeStyle = lit ? ink(1) : ink(lv.occ ? 0.6 : 0.4); g.lineWidth = lit ? 2 : 1;
        g.beginPath(); g.moveTo(x0, yy); g.lineTo(x1, yy); g.stroke();
        if (lv.occ) { g.fillStyle = ink(lit ? 0.34 : 0.16); g.fillRect(x0, yy - 3, x1 - x0, 6); }   // occupied: filled; virtual: hollow
        if (lit && c.amp > 0) { g.fillStyle = ink(0.72); g.fillRect(x0, yy - 4, Math.max(3, (x1 - x0) * c.amp), 8); }   // the register's own |c|
        if (lv.k === selected) { g.strokeStyle = T.fg(0.9); g.lineWidth = 1; g.strokeRect(x0 - 1, yy - 5, x1 - x0 + 2, 10); }
        hits.push({ y: yy, x0, x1, k: lv.k });
        hovers.push({ kind: 'line', key: 'L' + lv.k, points: [x0, yy, x1, yy], lw: lit ? 2 : 1, colour: ink(1),
          info: `${label(lv.k)}  ·  k${lv.k + 1}  ·  ε = ${lv.eps.toFixed(6)} Eh  ·  ${lv.occ ? lv.occ + ' electrons' : 'virtual, 0 electrons'}`
            + (lit ? `  ·  in the register: |c| ${c.amp.toFixed(3)}, arg c ${(c.phase * 180 / Math.PI).toFixed(0)}°` : '  ·  click to add') });
      }
      const nm = row.items.some((lv) => lv.k === sol.nocc - 1) ? 'HOMO' : row.items.some((lv) => lv.k === sol.nocc) ? 'LUMO' : 'k' + (row.items[0].k + 1);
      names.push({ y: yy, txt: nm, col: row.items[0].occ ? occInk(nm === 'HOMO' ? 1 : 0.8) : virInk(nm === 'LUMO' ? 1 : 0.75), rank: nm === 'HOMO' || nm === 'LUMO' ? 0 : 1 });
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
  cv.addEventListener('click', (e) => {
    if (!hits.length) return;
    let best = null;
    for (const h of hits) { if (e.offsetX < h.x0 - 2 || e.offsetX > h.x1 + 2) continue; const d = Math.abs(h.y - e.offsetY); if (d <= 8 && (!best || d < best.d)) best = { d, k: h.k }; }
    if (best) toggle(best.k);
  });
  window.addEventListener('resize', () => paint());

  /* ── CHEMISTRY's road: the last ground state, and every new one ───────────────────────────────── */
  function adopt(s) {
    sol = s || null;
    re = im = null; pushedT = NaN; pushedV = -1; selected = -1;
    sel.clear(); storeA = storeB = null; aBtn.classList.remove('on'); bBtn.classList.remove('on'); morphOn = false; morphSw.set(false); rowsEl.classList.remove('reg-morphing');
    if (sol) {
      if (wanted) { applyRecord(wanted); wanted = null; }
      else { sel.set(sol.nocc - 1, { amp: 1, phase: 0 }); selected = sol.nocc - 1; }   // a new solve resets the register to HOMO alone
    }
    touch(); rebuild(); paint(); refresh();
    if (on) { const why = refusal(); if (why) setOn(false); else push(now(), true); }
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
    if (why) { status('register off — ' + why, 'warn'); if (!C() || !C().on) setOn(false); return false; }
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
  }
  function save() { return { on, selection: keys().map((k) => ({ k, amp: sel.get(k).amp, phase: sel.get(k).phase })) }; }
  /** the register is a selection over a LADDER, so a record landing before the molecule waits for it (see adopt) */
  function load(r) {
    if (!r) return false;
    if (!sol) { wanted = { selection: r.selection }; if (on) setOn(false); return true; }
    applyRecord(r); touch(); rebuild(); paint(); refresh();
    if (r.on && !on) setOn(true); else if (!r.on && on) setOn(false);
    else if (on) push(now(), true);
    api.repaint();
    return true;
  }

  return {
    update, setActive, paint, refresh,
    get on() { return on; }, setOn,
    get active() { return active; },
    get dials() { return !rowsEl.hidden; }, setDials,
    solution() { return sol; },
    select, deselect, toggle, clear, norm, setAmp, setPhase, preset, store, setMorph,
    get morphOn() { return morphOn; }, get morph() { return morphS; },
    get selected() { return selected; },
    ladder() { return sol ? Array.from({ length: sol.nAO }, (_, k) => ({ k, eps: sol.eps[k], occ: k < sol.nocc ? 2 : 0 })) : []; },
    state() {
      const p = pair(), eH = sol ? sol.eps[sol.nocc - 1] : null, eL = sol ? sol.eps[sol.nocc] : null;
      return { on, nAO: nAO(), nocc: nocc(), homo: sol ? sol.nocc - 1 : null, lumo: sol ? sol.nocc : null,
        epsHOMO: eH, epsLUMO: eL, gap: sol && Number.isFinite(eL) ? eL - eH : null,
        selection: keys().map((k) => ({ k, amp: sel.get(k).amp, phase: sel.get(k).phase, eps: sol.eps[k], occ: k < sol.nocc ? 2 : 0 })),
        sum: sum2(), period: p ? p.period : null, dE: p ? p.dE : null, t: pushedT, law: LAW,
        refusal: refusal(), status: statusText, hash: sol ? sol.hash : null };
    },
    save, load,
    dispose() { if (unsub) { unsub(); unsub = null; } },
  };
}
