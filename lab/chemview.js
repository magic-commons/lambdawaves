/* chemview.js — THE CHEMISTRY WINDOW: contract B-H2O-8 of research/MATH-H2O-2026-09-11.md as an instrument.
 * lab/molecules.js's library, RHF through the worker, the RPA/TDA inspector beside the live δ-kick trace, the fitted
 * poles with their certificate, and the AO density on the field.  Atomic units; atoms in bohr through ANGSTROM.
 *
 * THE MOLECULE CONTROL IS A DROPDOWN (2026-09-12, Josh: "this should be a dropdown menu hehe").  Fifty-four closed-
 * shell species in seven <optgroup>s, each option carrying its Cartesian AO count and lab/molecules.js's PREDICTED
 * solve time, and each over-cap or unsolvable entry disabled WITH ITS REASON on the option itself.  The node is
 * paletteview.js's `<select class="sel">` — the same element, the same class, the same 44-px seat — because the
 * lab already had a dropdown and a second one would have been a second design.  The CAP is benzene: ~9.6 s
 * predicted, 36 AOs, 42 electrons, which is the longest wait this window asks anyone to accept.
 *
 * THE DIVISION OF LABOUR.  Nothing here does chemistry on the frame thread: `api.solve` is rack.js's chem worker
 * road and every op lands there (SYNTHESIS decision 3 — Δt = 0.01 on screen; decision 2 — unrestarted MMUT by
 * default, Magnus-2 as the reference).  The ONE exception is the pole fit (lab/response-fit.js), which is cheap and
 * throttled, and the fallback solve, which exists only for a browser with no Worker at all and says so.
 * SCREEN ALLOCATION is ROUND 3 · SOL answer 11: the main plot is 0–1.6 hartree with the inspector, and the O 1s
 * window is a collapsible inset, off by default, on its own amplitude scale, badged as a timestep diagnostic.
 * MUST NOT CLAIM: quantitative UV/X-ray spectroscopy, ionisation, correlation beyond RHF, or nuclear motion.
 */
import { el, seg, sw, knob, trig, readout, graphHover, themeInk, fitText, nRGB, accentRGB, vividInk } from './mir/kit.js';
import { MOLECULES, GROUPS, moleculeAtoms, moleculeCharge, optionLabel, showMs, CAP_RULE } from './molecules.js';

/* ── the library, under the names this window has always used ─────────────────────────────────────────────────
 * The geometries and their sources moved to lab/molecules.js on 2026-09-12; the eight ids the laws pin are still
 * the first eight of their groups and their arrays are frozen there.  These three exports keep their old shapes so
 * nothing that read them has to change: `label` is the entry's formula markup, `ang` its ångström array. */
export const CHEM_PRESETS = MOLECULES.map((m) => ({ ...m, label: m.formula }));
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
const AO_GUESS = (atoms) => atoms.reduce((k, a) => k + (a.Z === 1 ? 1 : 5), 0);   // STO-3G: H is one AO, first row is five

export function createChem(host, api) {
  let on = false, active = api.active ? !!api.active() : true;
  let preset = 'H2O', basis = 'sto-3g', view = 'density', orbital = null, axis = 'y';
  let kappa = 1e-3, speed = 10, dt = 0.01, integrator = 'mmut', tda = false, core = false;
  let sol = null, rt = null, running = false, inflight = false;
  let solveSeq = 0, specTask = 0, spec = null, fit = null, fitErr = null, lastSpec = 0, lastFit = 0, selected = null;
  let fieldHash = null, mBuf = null, oBuf = null, statusText = 'no molecule solved yet', pending = null;
  /* THE RESTORED ORBITAL INDEX HAS TO SURVIVE THE RE-SOLVE THAT RESTORING IT CAUSES.  A solve sets `orbital` to
     HOMO, which is right for a molecule the hand just picked and WRONG for one a file just reopened: load() puts a
     different molecule up, the solve that follows overwrote the saved index with nocc, and the round trip lost it.
     (Invisible while there were eight presets and the laws only ever restored H₂O onto H₂O.)  One pending value,
     consumed by the next solve and then cleared. */
  let pendingOrbital = null;
  const subs = new Set(), notify = () => { for (const f of subs) { try { f(sol); } catch (e) { console.warn('chem subscriber', e); } } };   // the ORBITALS register listens here

  /** the dial's own label: knob() paints on construction and calls fmt() at once, so this is HOISTED */
  function orbFmt(k) {
    if (!sol) return String(k);
    const d = k - sol.nocc;
    return d === 0 ? 'HOMO' : d === 1 ? 'LUMO' : d < 0 ? 'HOMO−' + (-d) : 'LUMO+' + (d - 1);
  }
  /* ── the rows ─────────────────────────────────────────────────────────────────────────────────── */
  const r0 = el('div', 'row tight', host);
  const onSw = sw({ label: 'CHEM ON', value: false, title: 'Give the field to this molecule’s density', onChange: (v) => { setOn(v); } });
  r0.appendChild(onSw.root);
  /* ── THE MOLECULE DROPDOWN ────────────────────────────────────────────────────────────────────────────────
   * paletteview.js:22's node and class, and its lesson too: a `<select>` fires `change` only when the VALUE
   * changes, so re-picking what you are already on fires nothing.  Here that is correct rather than a trap —
   * `solve()` returns the cached answer for the molecule already up, so a re-pick would be a no-op anyway, and
   * the one road that must still work (force a re-solve) is `__LW.chem.solve(id, { force: true })`.
   * A DISABLED option carries its reason in its own title, so the menu explains itself where it refuses. */
  const mWrap = el('div', 'segw mol-pick', r0);
  el('div', 'k-lbl', mWrap, 'MOLECULE');
  const mSel = el('select', 'sel', mWrap);
  mSel.setAttribute('aria-label', 'molecule');
  mSel.title = CAP_RULE; mSel.dataset.help = CAP_RULE;
  for (const g of GROUPS) {
    const rows = CHEM_PRESETS.filter((p) => p.group === g.id);
    if (!rows.length) continue;
    const og = el('optgroup', '', mSel); og.label = g.label;
    for (const p of rows) {
      const o = el('option', '', og, optionLabel(p)); o.value = p.id;
      o.disabled = !!p.disabled;
      /* the source goes on `data-help` as well as `title`: lab/mir/control-help.js moves a title to data-help at
         boot, which is fine for the control but leaves an <option> with neither unless both are set here. */
      const why = p.name + (p.disabled ? ' — ' + p.reason : '') + ' · ' + p.source;
      o.title = why; o.dataset.help = why;
    }
  }
  mSel.value = 'H2O';
  mSel.addEventListener('change', () => { solve(mSel.value); });
  const mSeg = { root: mWrap, set(v) { if (mSel.value !== v) mSel.value = v; }, get() { return mSel.value; }, el: mSel };
  const bSeg = seg({ label: 'BASIS', value: 'sto-3g', options: [
    { id: 'sto-3g', label: 'STO-3G', title: 'The vendored minimal Cartesian basis; the oracle for all eight' },
    { id: '6-31+g-star', label: '6-31+G*', title: 'H₂O only — 23 Cartesian AOs; the first root moves 0.483 → 0.341' }],
    onChange: (v) => { basis = v; solve(preset); } });
  r0.appendChild(bSeg.root);

  const r1 = el('div', 'row tight', host);
  const vSeg = seg({ label: 'VIEW', value: 'density', options: [
    { id: 'density', label: 'DENSITY', title: 'ρ(r) = Σ D_ij χ_i χ_j on the field' },
    { id: 'orbital', label: 'ORBITAL', title: 'ψ_k(r) = Σ C_ik χ_i — one molecular orbital' },
    { id: 'diff', label: '<m>Δρ</m>', title: 'The induced density against the reference stored at the kick' }],
    onChange: (v) => { view = v; orbKnob.root.classList.toggle('off', v !== 'orbital'); pushMatrix(v === 'diff' && !rt); refresh(); } });   // a run already HAS its t = 0 reference; only a still molecule needs one stored now
  r1.appendChild(vSeg.root);
  let orbKnob = knob({ label: 'ORBITAL', min: 1, max: 7, value: 5, title: 'The molecular orbital index, ascending in ε; HOMO by default',
    fmt: (v) => orbFmt(Math.round(v)), onInput: (v) => { orbital = Math.round(v); if (view === 'orbital') pushMatrix(); refresh(); } });
  r1.appendChild(orbKnob.root);
  const tdaSw = sw({ label: 'TDA', value: false, title: 'Draw the sticks at ω_TDA (Y = 0) instead of ω_RPA — never relabelled as RPA', onChange: (v) => { tda = v; paint(); } });
  r1.appendChild(tdaSw.root);
  const coreSw = sw({ label: 'CORE', value: false, title: 'The O 1s window, 19–21 hartree: a timestep diagnostic, not X-ray spectroscopy', onChange: (v) => { core = v; cvCore.hidden = !core; paint(); } });
  r1.appendChild(coreSw.root);

  const r2 = el('div', 'row tight', host);
  const aSeg = seg({ label: 'KICK AXIS', value: 'y', options: AXES.map((a) => ({ id: a, label: a.toUpperCase(), title: 'Strike the density with exp(−iκ ' + a + ')' })),
    onChange: (v) => { axis = v; requestSpectrum(true); paint(); } });
  r2.appendChild(aSeg.root);
  const kapKnob = knob({ label: '<m>κ</m>', min: 1e-4, max: 1e-2, value: 1e-3, log: true, title: 'The δ-kick strength; linear response wants the smallest κ the trace can carry',
    fmt: (v) => v.toExponential(1), onInput: (v) => { kappa = v; } });
  r2.appendChild(kapKnob.root);
  r2.appendChild(trig({ label: 'KICK', title: 'exp(−iκ q̂) on the converged density, then field-free propagation', onFire: () => { kick(); } }).root);
  const runSw = sw({ label: 'RUN', value: false, title: 'Propagate the density in real time', onChange: (v) => { setRun(v); } });
  r2.appendChild(runSw.root);
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
  for (const r of [roE, roEps, roTr, roIdem, roT, roPick]) rr.appendChild(r.root);
  el('div', 'note', host).innerHTML = '<b>Model.</b> Restricted Hartree–Fock in a vendored Cartesian basis at a fixed experimental geometry — not the RHF minimum. Sticks are singlet RPA (or TDA) roots with height proportional to oscillator strength; the curve is Im α(ω) from the real-time δ-kick trace. Peaks are fitted poles with a 4ε/σ certificate: an uncertified reading is labelled as the raw maximum. The electron count is Tr(DS), never a voxel sum.';

  /* ── the worker road ─────────────────────────────────────────────────────────────────────────── */
  const call = (msg, fallback) => Promise.resolve(api.solve(msg, fallback || (() => null), (r) => r));
  /* THE FALLBACK IS FOR A BROWSER WITH NO WORKER, and only that: it is the same pure maths, on the frame thread.
     `half` here is the shell support envelope; the worker's own `half` is authoritative whenever it answers. */
  async function localSolve(msg) {
    const [{ loadRecord, moleculeRHF }, { rpa }, { evaluator, fieldShells }] =
      await Promise.all([import('./rhf-molecule.js'), import('./rpa-inspector.js'), import('./molecular-field.js')]);
    await loadRecord(msg.basis);
    const r = moleculeRHF({ atoms: msg.atoms, basis: msg.basis, charge: msg.charge, detect: false, stability: false, hessian: false });
    const I = r.integrals, P = rpa({ S: I.S, h: I.h, eri: I.eri, X: I.X, Y: I.Y, Z: I.Z, C: r.C, eps: r.orbitalEnergies, nocc: r.nocc });
    const ev = evaluator(r.basis.shells);
    let half = 0; for (const sh of r.basis.shells) half = Math.max(half, ev.supportRadius(sh, 1e-10));
    return { energy: r.energy, Enuc: I.Enuc, eps: Float64Array.from(r.orbitalEnergies), C: Float64Array.from(r.C), D: Float64Array.from(r.D),
      nocc: r.nocc, nAO: I.n, order: I.order, hash: r.hash, dipole: r.dipole, shells: fieldShells(r.basis), half,
      roots: P.roots.map((k) => ({ omega: k.omega, omegaTDA: k.omegaTDA, f: k.f, mu: Array.from(k.mu), dominant: k.dominant.slice(0, 4) })),
      timings: null, stability: null, solutions: null, local: true };
  }

  /* ── solve ────────────────────────────────────────────────────────────────────────────────────── */
  function solve(id = preset, { force = false } = {}) {
    if (id !== preset) { preset = id; mSeg.set(id); }
    const P = PRESET_BY_ID.get(preset) || CHEM_PRESETS[0];
    /* A DISABLED ENTRY IS REFUSED HERE AND NOT SENT.  CuH and ZnH₂ converge to an RHF solution that is not a
       minimum (both A ± B blocks negative), so lab/rpa-inspector.js refuses them and chem.solve cannot answer at
       all — the refusal belongs in front of the worker, with the reason, rather than as a failed solve. */
    if (P.disabled) { status(P.name + ': ' + P.reason, 'warn'); return Promise.resolve(null); }
    if (preset !== 'H2O' && basis !== 'sto-3g') { basis = 'sto-3g'; bSeg.set('sto-3g'); }
    const b6 = bSeg.button('6-31+g-star'); if (b6) b6.disabled = preset !== 'H2O';
    /* THE ANSWER WE ALREADY HAVE IS THE ANSWER.  Beyond not paying twice, this is load-bearing: the worker caches
       its report on (atoms, basis, charge) and TRANSFERS that report's typed arrays, so a second chem.solve for the
       same key posts detached buffers, throws inside the worker's own handler, and never replies at all — the call
       then sits until its timeout.  Re-solving is what changing the molecule or the basis does; asking twice is not. */
    const key = preset + '|' + basis + '|' + chemCharge(preset);
    if (!force && sol && sol.key === key) { refresh(); return Promise.resolve(sol); }
    if (!force && pending && pending.key === key) return pending.p;        // …and one IN FLIGHT is the same answer
    setRun(false); rt = null; spec = null; fit = null; fitErr = null; selected = null;
    const atoms = chemAtoms(preset), charge = chemCharge(preset);
    /* the worker reports integral, scf and rpa times separately (split); benzene's integrals were 36 s before the
       2026-09-12 shell-pair rewrite of md.js and are 0.56 s after it, so the split is affordable for every preset. */
    const seq = ++solveSeq, msg = { op: 'chem.solve', atoms, basis, charge, split: true };   // integrals are 0.56 s for benzene since the shell-pair rewrite: the status line can afford the split timing
    status(`solving ${P.name}… ${P.nAO} AOs, ${P.nElectrons} electrons, ~${showMs(P.predictedMs)} predicted`, 'warn');
    if (api.loading) api.loading(true);
    const task = call(msg, () => localSolve(msg)).then((r) => {
      if (seq !== solveSeq) return null;
      if (!r || r.error || !Number.isFinite(r.energy)) { sol = null; status('solve failed: ' + ((r && r.error) || 'no answer'), 'warn'); refresh(); notify(); return null; }
      sol = r; sol.key = key; mBuf = oBuf = null; fieldHash = null;
      orbital = (Number.isFinite(pendingOrbital) && pendingOrbital >= 1 && pendingOrbital <= r.nAO) ? pendingOrbital : r.nocc;
      pendingOrbital = null;
      rebuildOrbKnob(); pushField(); refresh(); notify();
      return r;
    }).catch((e) => { if (seq === solveSeq) { sol = null; status('solve failed: ' + String(e && e.message || e), 'warn'); refresh(); } return null; })
      .finally(() => { if (pending && pending.key === key) pending = null; if (seq === solveSeq && api.loading) api.loading(false); });
    pending = { key, p: task };
    return task;
  }
  /* THE ORBITAL DIAL'S RANGE IS THE BASIS'S, so the dial is rebuilt with the molecule rather than clamped after
     the fact.  The handle is a `let` and is REASSIGNED: kit.js's knob() publishes `get shown()`, so copying the new
     widget's members over the old object throws "setting getter-only property" in a module's strict mode — which
     is exactly how the first H₂O solve failed, silently, inside the promise chain. */
  function rebuildOrbKnob() {
    const n = sol ? sol.nAO : 7, k = Math.min(Math.max(1, orbital || 1), n);
    const help = orbKnob.root.dataset.help || 'The molecular orbital index, ascending in ε; HOMO by default';
    const next = knob({ label: 'ORBITAL', min: 1, max: n, value: k, title: help,
      fmt: (v) => orbFmt(Math.round(v)), onInput: (v) => { orbital = Math.round(v); if (view === 'orbital') pushMatrix(); refresh(); } });
    orbKnob.root.replaceWith(next.root); orbKnob = next;
    orbKnob.root.classList.toggle('off', view !== 'orbital');
  }

  /* ── the real-time run ────────────────────────────────────────────────────────────────────────── */
  function kick() {
    if (!sol) return Promise.resolve(null);
    const seq = solveSeq;
    return call({ op: 'chem.rt.init', atoms: chemAtoms(preset), basis, charge: chemCharge(preset), dt, integrator, kick: { axis, kappa } }).then((r) => {
      if (seq !== solveSeq) return null;
      if (!r || r.error || !r.ok) { status('kick failed: ' + ((r && r.error) || 'no real-time engine'), 'warn'); return null; }
      rt = { t: r.t || 0, D_re: r.D_re || null, electrons: r.electrons, idempotency: r.idempotency || 0, energy: r.E0, E0: r.E0, trace: [], samples: 1, steps: 0, msPerStep: 0 };
      spec = null; fit = null; fitErr = null;
      pushMatrix(true);                                        // Δρ's reference IS the kicked t = 0
      refresh(); return r;
    });
  }
  function reset() {
    setRun(false); rt = null; spec = null; fit = null; fitErr = null;
    if (sol) call({ op: 'chem.rt.reset' }).then(() => { pushMatrix(); refresh(); });
    else refresh();
  }
  function setRun(v) {
    const next = !!v && !!sol;
    if (next === running) { if (runSw.get() !== next) runSw.set(next); return running; }
    running = next; runSw.set(running);
    if (running && !rt) kick();
    refresh(); return running;
  }
  /** one outstanding propagation request at a time — the frame loop asks, the worker answers when it can */
  function pump() {
    if (!running || inflight || !rt || !sol) return;
    inflight = true; const seq = solveSeq;
    call({ op: 'chem.rt.run', steps: speed }).then((r) => {
      inflight = false;
      if (seq !== solveSeq || !rt) return;
      if (!r || r.error) { status('real time stopped: ' + ((r && r.error) || 'no answer'), 'warn'); setRun(false); return; }
      rt.t = r.t; rt.electrons = r.electrons; rt.idempotency = r.idempotency; rt.energy = r.energy;
      rt.steps = r.steps || rt.steps; rt.msPerStep = r.msPerStep;   // `steps` is the worker's CUMULATIVE count
      if (r.D_re) rt.D_re = r.D_re;
      rt.samples = r.samples || rt.samples; append(r.trace);
      pushMatrix(); requestSpectrum(); refresh();
    }).catch(() => { inflight = false; });
  }
  /** the fit's own copy of the trace, capped at its window; the worker keeps the authoritative one */
  function append(tr) { if (!tr || !rt) return; for (let i = 0; i < tr.length && rt.trace.length < FIT_CAP; i++) rt.trace.push(tr[i]); }
  /** the transform is the worker's (it holds the trace); throttled to ~2 Hz, one in flight */
  function requestSpectrum(force) {
    if (!sol || !rt || (rt.samples || 0) < 16) return;
    const nowMs = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    if (!force && nowMs - lastSpec < 500) return;
    lastSpec = nowMs;
    const seq = ++specTask, tau = Math.max(10, (rt.samples || rt.trace.length) * dt / 12);
    call({ op: 'chem.rt.spectrum', dt, kappa, tau, wMin: 5e-4, wMax: W_MAX }).then((r) => {
      if (seq !== specTask || !r || r.error || !r.omega) return;
      spec = { omega: r.omega, S: r.S, ImAlpha: r.ImAlpha, peaks: r.peaks || [], tau };
      refit(); paint();
    }).catch(() => {});
  }
  /* THE POLES ARE FITTED, NOT PICKED (decision 4).  The fit is the one piece of maths on this thread: R ≈ 1550
     grid points over a handful of poles, throttled to 2 s, and it is the only road to the certificate. */
  function refit() {
    const nowMs = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    if (!spec || !rt || rt.trace.length < 400 || nowMs - lastFit < 2000) return;
    lastFit = nowMs;
    import('./response-fit.js').then(({ fitPoles }) => {
      if (!spec || !rt) return;
      const init = bright().filter((k) => k.omega > 0.05 && k.omega < W_MAX).slice(0, 6).map((k) => k.omega).sort((a, b) => a - b);
      if (!init.length) return;
      try {
        const F = fitPoles(Float64Array.from(rt.trace), { dt, kappa, tau: spec.tau, init, wMin: 0.05, wMax: W_MAX });
        fit = { poles: F.poles, certified: !!F.certified(CERT), bound: F.bound, epsilon: F.epsilon, sigma: F.sigma,
          refusal: F.refusal ? F.refusal(CERT) : null, raw: F.raw };
        fitErr = null;
      } catch (e) { fit = null; fitErr = String(e && e.message || e); }
      paint();
    }).catch(() => {});
  }

  /* ── the field ────────────────────────────────────────────────────────────────────────────────── */
  const F = () => (api.field && api.field.ok && typeof api.field.setMolecule === 'function' ? api.field : null);
  function pushField() {
    const f = F(); if (!f) return false;
    if (!on || !sol) { if (fieldHash !== null) { f.setMolecule(null); fieldHash = null; } return false; }
    if (fieldHash !== sol.hash) { f.setMolecule({ nAO: sol.nAO, half: sol.half, shells: sol.shells }); fieldHash = sol.hash; api.repaint(true); }
    return pushMatrix();
  }
  const fieldView = () => { if (api.fieldView && on) api.fieldView(view === 'orbital' ? 'real' : view === 'diff' ? 'diff' : 'density'); };
  function pushMatrix(ref) {
    const f = F(); if (!f || !on || !sol || fieldHash === null) return false;
    fieldView();
    if (view === 'orbital') { f.setMoleculeMatrix(orbitalColumn(), { kind: 'orbital' }); api.repaint(); return true; }
    f.setMoleculeMatrix(densityRe(), { kind: view === 'diff' ? 'diff' : 'density', ref: !!ref });
    api.repaint(); return true;
  }
  function densityRe() {
    const n = sol.nAO, src = (rt && rt.D_re) || sol.D;
    if (src instanceof Float32Array && src.length === n * n) return src;
    if (!mBuf || mBuf.length !== n * n) mBuf = new Float32Array(n * n);
    for (let i = 0; i < n * n; i++) mBuf[i] = src[i];
    return mBuf;
  }
  function orbitalColumn() {
    const n = sol.nAO, k = Math.min(Math.max(0, (orbital || sol.nocc) - 1), n - 1);
    if (!oBuf || oBuf.length !== n) oBuf = new Float32Array(n);
    for (let i = 0; i < n; i++) oBuf[i] = sol.C[i * n + k];
    return oBuf;
  }

  /* ── the readouts and the header ──────────────────────────────────────────────────────────────── */
  const status = (t, cls) => { statusText = t; if (api.status) api.status(t, cls === undefined ? '' : cls); };
  function refresh() {
    if (!sol) { for (const r of [roE, roEps, roTr, roIdem, roT]) r.set('—', ''); paint(); return; }
    roE.set(sol.energy.toFixed(9), 'ok');
    const P = PRESET_BY_ID.get(preset) || {};
    roE.setSub(`${P.name} · ${basis.toUpperCase()} · E_nuc ${Number(sol.Enuc).toFixed(6)}` + (sol.local ? ' · on the frame thread (no worker)' : ''));
    roE.root.title = (P.source || '') + ' — a FIXED geometry, not the RHF/STO-3G minimum';
    const eH = sol.eps[sol.nocc - 1], eL = sol.eps[sol.nocc];
    roEps.set(`${eH.toFixed(6)} · ${Number.isFinite(eL) ? eL.toFixed(6) : '—'}`, '');
    roEps.setSub(`gap ${Number.isFinite(eL) ? (eL - eH).toFixed(6) : '—'} hartree · ${sol.nocc} occupied of ${sol.nAO}`);
    const ne = rt ? rt.electrons : (Number.isFinite(sol.electrons) ? sol.electrons : 2 * sol.nocc);
    roTr.set(Number(ne).toFixed(10), Math.abs(ne - 2 * sol.nocc) < 1e-8 ? 'ok' : 'warn');
    roTr.setSub('Tr(DS), never a voxel sum · ' + (2 * sol.nocc) + ' electrons');
    roIdem.set(rt ? Number(rt.idempotency).toExponential(2) : '—', rt && rt.idempotency < 1e-8 ? 'ok' : rt ? 'warn' : '');
    roIdem.setSub(rt ? `‖P² − P‖ · ${integrator === 'mmut' ? 'unrestarted MMUT' : 'Magnus-2'} · Δt ${dt}` : 'kick to begin');
    roT.set(rt ? Number(rt.t).toFixed(3) : '—', running ? 'live' : '');
    roT.setSub(rt ? `${rt.samples || rt.trace.length} samples · E ${Number(rt.energy).toFixed(6)} · ΔE ${(rt.energy - rt.E0).toExponential(2)}` + (rt.msPerStep ? ` · ${Number(rt.msPerStep).toFixed(2)} ms/step` : '') : '');
    const tm = sol.timings || {};
    status(`${sol.nAO} AOs · ${2 * sol.nocc} electrons` + (Number.isFinite(tm.integrals) ? ` · integrals ${Math.round(tm.integrals)} ms` : '') + (Number.isFinite(tm.scf) ? ` · scf ${Math.round(tm.scf)} ms` : '') + (Number.isFinite(tm.rpa) ? ` · rpa ${Math.round(tm.rpa)} ms` : '') + (running ? ' · running' : ''), running ? 'live' : 'ok');
    paint();
  }

  /* ── the plot ─────────────────────────────────────────────────────────────────────────────────── */
  const bright = () => (sol && sol.roots ? sol.roots : []);
  const wOf = (k) => (tda ? k.omegaTDA : k.omega);
  /** the polarisation of a root: the axis carrying most of |μ|² */
  const polOf = (k) => { const m = k.mu || [0, 0, 0]; let b = 0; for (let q = 1; q < 3; q++) if (m[q] * m[q] > m[b] * m[b]) b = q; return AXES[b]; };
  const dominantOf = (k) => {
    const d = (k.dominant || [])[0];
    return d ? `${d.i + 1}→${d.a + 1} (X ${d.x.toFixed(3)}, Y ${d.y.toFixed(3)})` : '—';
  };
  const infoOf = (k) => `ω_RPA ${k.omega.toFixed(9)} · ω_TDA ${k.omegaTDA.toFixed(9)} · f ${k.f.toFixed(6)} · ${polOf(k)} · dominant ${dominantOf(k)}`;

  let rect = null, coreRect = null;
  const hover = graphHover(cv, { repaint: () => paint(), plot: () => rect });
  const coreHover = graphHover(cvCore, { repaint: () => paint(), plot: () => coreRect });
  cv.addEventListener('click', () => { const h = hover.hit(); if (h && h.root) pick(h.root); });
  cvCore.addEventListener('click', () => { const h = coreHover.hit(); if (h && h.root) pick(h.root); });
  function pick(k) { selected = k; roPick.set(`ω ${wOf(k).toFixed(6)} · f ${k.f.toFixed(6)}`, k.f > 1e-6 ? 'ok' : ''); roPick.setSub(infoOf(k)); paint(); }

  const size = (canvas, ctx) => {
    const W = canvas.clientWidth, H = canvas.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (W < 32 || H < 24) return null;
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    return { W, H };
  };
  function paint() { paintMain(); if (core) paintCore(); }
  function paintMain() {
    const s = size(cv, g); if (!s) return;
    const { W, H } = s, L = 42, Rt = W - 8, Tp = 12;
    g.font = '8px ui-monospace, monospace';
    const CAP = sol ? `${tda ? 'TDA' : 'RPA'} sticks, h ∝ f · Im α from the ${axis} kick`
      + (fit ? (fit.certified ? ` · ▲ poles, 4ε/σ = ${fit.bound.toExponential(1)}` : ` · ▽ raw maxima, UNCERTIFIED`) : spec ? ' · fitting…' : ' · kick and RUN')
      : 'no molecule solved';
    const caps = wrap(g, CAP, Rt - L);
    /* the ω tick row gets its OWN 10 px: the caption's baselines and the labels' tops were 2 px apart on a
       150 px canvas and the two ran through each other (measured at three caption lines). */
    const Bt = H - 6 - caps.length * 9 - 10;
    const T = themeInk(g);
    rect = { x0: L, y0: Tp, x1: Rt, y1: Bt };
    const x = (w) => L + (w / W_MAX) * (Rt - L);
    const roots = bright().filter((k) => wOf(k) >= 0 && wOf(k) <= W_MAX);
    let fMax = 0; for (const k of roots) fMax = Math.max(fMax, k.f);
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
    for (const k of roots) {
      const pol = polOf(k), px = x(wOf(k)), mine = pol === axis;
      const rgb = mine ? accentRGB(g, 2) : vividInk(nRGB(AXIS_N[pol]));
      const hgt = fMax > 0 ? Math.max(2, k.f / fMax * (Bt - Tp) * 0.88) : 2;
      g.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${mine ? 0.95 : 0.5})`; g.lineWidth = mine ? 2 : 1;
      g.beginPath(); g.moveTo(px, Bt); g.lineTo(px, Bt - hgt); g.stroke();
      const hit = { kind: 'line', key: 'stick-' + wOf(k).toFixed(6) + pol, points: [px, Bt - hgt, px, Bt], lw: mine ? 3 : 2,
        colour: `rgb(${rgb.join(',')})`, info: infoOf(k), root: k };
      hovers.push(hit);
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
    const roots = bright().filter((k) => wOf(k) >= CORE_LO && wOf(k) <= CORE_HI);
    let fMax = 0; for (const k of roots) fMax = Math.max(fMax, k.f);
    gc.strokeStyle = T.ink(0.4); gc.lineWidth = 1; gc.beginPath(); gc.moveTo(L, Bt); gc.lineTo(Rt, Bt); gc.stroke();
    gc.font = '8px ui-monospace, monospace'; gc.fillStyle = T.ink(0.75); gc.textBaseline = 'top'; gc.textAlign = 'center';
    for (let w = CORE_LO; w <= CORE_HI + 1e-9; w += 0.5) fitText(gc, w.toFixed(1), x(w), Bt + 2, { x0: 2, y0: 0, x1: W - 2, y1: H }, 'center');
    const hovers = [];
    for (const k of roots) {
      const pol = polOf(k), px = x(wOf(k)), rgb = vividInk(nRGB(AXIS_N[pol]));
      const hgt = fMax > 0 ? Math.max(2, k.f / fMax * (Bt - Tp) * 0.8) : 2;
      gc.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.9)`; gc.lineWidth = 1.6;
      gc.beginPath(); gc.moveTo(px, Bt); gc.lineTo(px, Bt - hgt); gc.stroke();
      hovers.push({ kind: 'line', key: 'core-' + wOf(k).toFixed(6), points: [px, Bt - hgt, px, Bt], lw: 3, colour: `rgb(${rgb.join(',')})`, info: infoOf(k), root: k });
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
  function update() { if (!on) return; pump(); }
  function setOn(v) {
    on = !!v; if (onSw.get() !== on) onSw.set(on);
    if (!on) { setRun(false); const f = F(); if (f && fieldHash !== null) { f.setMolecule(null); fieldHash = null; } }
    api.setOn(on);
    if (on) { if (!sol) solve(preset); else pushField(); fieldView(); } else if (api.fieldView) api.fieldView(null);
    return on;
  }
  const presentation = () => ({ preset, basis, view, orbital, axis, kappa, speed, dt, integrator, tda, core, on });
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
  let MS = null;
  import('./molecule-state.js').then((m) => { MS = m; }).catch(() => { MS = null; });
  function save() { return presentation(); }
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
    if (o.molecule && MS && typeof MS.restoreMolecule === 'function') { try { MS.restoreMolecule(o.molecule); } catch (_) {} }
    let resolve = false;
    if (typeof o.preset === 'string' && PRESET_BY_ID.has(o.preset)) { if (o.preset !== preset) resolve = true; preset = o.preset; mSeg.set(preset); }
    if (typeof o.basis === 'string') { if (o.basis !== basis) resolve = true; basis = o.basis; bSeg.set(basis); }
    if (typeof o.view === 'string') { view = o.view; vSeg.set(view); }
    if (Number.isFinite(o.orbital)) { orbital = Math.round(o.orbital); pendingOrbital = orbital; }
    if (typeof o.axis === 'string' && AXES.includes(o.axis)) { axis = o.axis; aSeg.set(axis); }
    if (Number.isFinite(o.kappa)) { kappa = o.kappa; kapKnob.set(kappa); }
    if (Number.isFinite(o.speed)) { speed = Math.max(1, Math.round(o.speed)); spdKnob.set(speed); }
    if (Number.isFinite(o.dt) && DTS.includes(String(o.dt))) { dt = o.dt; dSeg.set(String(o.dt)); }
    if (typeof o.integrator === 'string') { integrator = o.integrator; iSeg.set(integrator); }
    if (o.tda !== undefined) { tda = !!o.tda; tdaSw.set(tda); }
    if (o.core !== undefined) { core = !!o.core; coreSw.set(core); cvCore.hidden = !core; }
    setRun(false); rt = null; spec = null; fit = null; selected = null;
    if (resolve && sol) sol = null;
    orbKnob.root.classList.toggle('off', view !== 'orbital');
    if (o.on !== undefined) setOn(!!o.on);
    else if (sol) { pushField(); refresh(); } else refresh();
    return save();
  }

  refresh();
  return {
    update, refresh, paint,
    prepare() { return sol ? Promise.resolve(sol) : solve(preset); },
    setActive(v) { const next = !!v; if (next === active) return active; active = next; if (active) paint(); return active; },
    get on() { return on; }, setOn, get half() { return sol && Number.isFinite(sol.half) ? sol.half : 10.3; },
    solution() { return sol; }, subscribe(fn) { subs.add(fn); if (sol) fn(sol); return () => subs.delete(fn); },   // the register's road: the last ground state, and every new one
    /* the modulation registry's two targets — PRESENT-only setters, and the dials they write */
    get kappa() { return kappa; }, setKappa(v) { if (!Number.isFinite(v)) return kappa; kappa = Math.min(1e-2, Math.max(1e-4, v)); return kappa; },
    get speed() { return speed; }, setSpeed(v) { if (!Number.isFinite(v)) return speed; speed = Math.min(50, Math.max(1, Math.round(v))); return speed; },
    knobs: { kick: () => kapKnob, speed: () => spdKnob },
    /* ── __LW.chem ─────────────────────────────────────────────────────────────────────────────── */
    solve(id, opts) { return solve(id === undefined ? preset : id, opts || {}); },
    preset() { return preset; },
    setView(v) { if (!['density', 'orbital', 'diff'].includes(v)) return view; view = v; vSeg.set(v); orbKnob.root.classList.toggle('off', v !== 'orbital'); pushMatrix(v === 'diff' && !rt); refresh(); return view; },
    orbital(k) { if (Number.isFinite(k)) { orbital = Math.min(sol ? sol.nAO : 7, Math.max(1, Math.round(k))); orbKnob.set(orbital); if (view === 'orbital') pushMatrix(); refresh(); } return orbital; },
    setAxis(a) { if (!AXES.includes(a)) return axis; axis = a; aSeg.set(a); paint(); return axis; },
    setIntegrator(v) { if (v !== 'mmut' && v !== 'magnus2') return integrator; integrator = v; iSeg.set(v); reset(); return integrator; },
    setDt(v) { if (!DTS.includes(String(v))) return dt; dt = Number(v); dSeg.set(String(v)); reset(); return dt; },
    setTda(v) { tda = !!v; tdaSw.set(tda); paint(); return tda; },
    setCore(v) { core = !!v; coreSw.set(core); cvCore.hidden = !core; paint(); return core; },
    kick() { return kick(); },
    /** RUN n steps and settle — the gate's road, and it never leaves the switch on behind it */
    async run(n) {
      if (!sol) return null;
      if (!rt) { const k = await kick(); if (!k) return null; }
      const want = (rt ? rt.steps : 0) + Math.max(1, Math.round(n || speed));
      const t0 = Date.now();
      while (rt && rt.steps < want && Date.now() - t0 < 120000) {
        if (!inflight) { const left = want - rt.steps; inflight = true;
          /* eslint-disable no-await-in-loop */
          const r = await call({ op: 'chem.rt.run', steps: Math.min(left, Math.max(1, speed)) });
          inflight = false;
          if (!r || r.error) return null;
          rt.t = r.t; rt.electrons = r.electrons; rt.idempotency = r.idempotency; rt.energy = r.energy;
          rt.steps = r.steps || rt.steps; rt.msPerStep = r.msPerStep; if (r.D_re) rt.D_re = r.D_re;
          rt.samples = r.samples || rt.samples; append(r.trace);
          pushMatrix();
        } else await new Promise((res) => setTimeout(res, 8));
      }
      refresh(); requestSpectrum(true);
      return this.state();
    },
    stop() { setRun(false); return false; },
    reset() { reset(); return true; },
    state() {
      return { preset, basis, view, on, running, nAO: sol ? sol.nAO : 0, nocc: sol ? sol.nocc : 0,
        energy: sol ? sol.energy : null, epsHOMO: sol ? sol.eps[sol.nocc - 1] : null, epsLUMO: sol ? sol.eps[sol.nocc] : null,
        electrons: rt ? rt.electrons : (sol ? 2 * sol.nocc : 0), idempotency: rt ? rt.idempotency : null,
        t: rt ? rt.t : 0, steps: rt ? rt.steps : 0, trace: rt ? (rt.samples || rt.trace.length) : 0, fitWindow: rt ? rt.trace.length : 0, E0: rt ? rt.E0 : null,
        energyRT: rt ? rt.energy : null, half: sol ? sol.half : null, hash: sol ? sol.hash : null,
        local: !!(sol && sol.local), status: statusText, roots: sol && sol.roots ? sol.roots.length : 0,
        fitted: fit ? fit.poles.map((p) => p.omega) : null, certified: fit ? fit.certified : null,
        fieldOwner: fieldHash !== null, kappa, speed, dt, integrator, axis, tda, core, orbital };
    },
    roots(n) { const r = bright(); return (Number.isFinite(n) ? r.slice(0, n) : r).map((k) => ({ omega: k.omega, omegaTDA: k.omegaTDA, f: k.f, mu: Array.from(k.mu || []), pol: polOf(k), dominant: dominantOf(k) })); },
    spectrum() { return spec ? { tau: spec.tau, peaks: spec.peaks, n: spec.omega.length } : null; },
    fit() { return fit; },
    save, load, record,
  };
}
