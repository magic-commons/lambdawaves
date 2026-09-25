/* moview.js — the MOLECULE window's GENERAL BASIS block (W-MO): the same two protons, but the electron may live in a
 * basis bigger than one 1s per nucleus, and the nuclei may be let go on the force that basis actually exerts.
 *
 * THE MATHS is lab/mo.js and nothing here re-derives it.  createMO({kind, nMax, lambda}) puts one one-centre set on
 * both nuclei — {1s} (lcao1s), the Coulomb Sturmians n ≤ 4 at a common scale λ (sturmian), or the register's own σ
 * functions n ≤ 6 at the fixed hydrogenic exponents ζ = 1/n (hydrogenic, 42 functions) — solves H C = S C E in the
 * gerade/ungerade blocks, and reports for ANY coefficient vector
 *     F_elec (the electron density's pull on nucleus B),  F_nuc = Z_A Z_B/R²,  F_HF = F_elec + F_nuc,
 *     pulay = 2Re⟨∂_Rψ|(H−E)ψ⟩  with  F_HF − pulay = F_exact = −dE/dR,   bound = 2‖∂_Rψ‖‖(H−E)ψ‖ ≥ |pulay|.
 * createDynamics drives classical nuclei on R with velocity Verlet, electrons Born–Oppenheimer or Ehrenfest, and
 * compares drift with the integrated BO Pulay contribution; this is not a bound on all numerical errors.
 *
 * THE HONEST FINDING this block exists to show (tests/mo.test.mjs D1).  On the frozen 1s LCAO the Hellmann–Feynman
 * force is REPULSIVE at every R (F_HF → ½/R²: a frozen 1s density cannot polarise), so under it the nuclei simply
 * run away — there is no vibration to see.  Only −dE/dR binds that basis, and the FORCE segment therefore ships on
 * −dE/dR for the 1s LCAO and on HELLMANN–FEYNMAN for the two bases that are nearly translation-closed, with the
 * sentence printed beside the force line either way.  The Pulay term and its bound are printed at every R.
 *
 * WHAT COSTS WHAT (measured, node; the browser is the same order).  groundEnergy: 0.2 / 3 / 11 ms for the three
 * bases; force() with the central differences 17 / 26 / 60 ms; one dynamics step 5 / 10 / 26 ms.  So the E(R) curve
 * (40 points) and the equilibrium (golden section, 40 iterations, then the 5-point curvature) are computed ONCE per
 * basis by a job queue that gives the frame loop the wall back every 24 ms — LW.mo.whenReady() resolves when it
 * drains — and the run takes ONE step per frame, or one per OTHER frame when a step measures over 15 ms (which the
 * 42-function register always does): the budget is 30 ms of dynamics in any one frame, and the readout says which
 * cadence is running.  The stage is not asked to draw the bigger bases at all — the card's canvas is the view there,
 * and the caption says so.
 *
 * STATUS: EXACT integrals (mo.js / twocentre.js quadrature, certified in tests/mo.test.mjs), VARIATIONAL energies
 * (an upper bound at every R), NUMERICAL eigen-solver and integrator, CLASSICAL nuclei.  KNOWN numbers re-read here:
 * Eg(2) = −0.5537715 (1s LCAO), −0.6026243 with R_e = 1.99720 and D_e = 2.7926 eV (Sturmian n ≤ 4, λ = 1.7611,
 * above the exact −0.602634214 of Bates–Ledsham–Stewart 1953), R_e = 2.35227 and D_e = 2.1246 eV (the register).
 */
import { createMO, createDynamics } from './mo.js';
import { el, sw, seg, knob, fader, trig, readout, group, graphHover, fitText, cssRGB, accentRGB } from './mir/kit.js';

/* THE CANVAS HAS NO THEME (wave 44).  These rules were written rgba(255,255,255,…) — right on the dark theme and
   WHITE ON WHITE on the light one, where the dissociation line, its "H + H⁺" label, the exact Bates dots, the R
   marker and the caption were all ghosts.  --dim is rated ≥ 4.5:1 on the card in both themes. */
const readRGB = (g, name, fallback) => cssRGB(g, name, fallback);          // wave 57: kit.js's one reader, which knows color(display-p3 …)


const KINDS = {
  lcao1s: { label: '1s LCAO', nMax: 1, title: 'One 1s orbital on each proton' },
  sturmian: { label: 'STURMIAN n ≤ 4', nMax: 4, title: 'Twenty Sturmian σ functions on two centres' },
  hydrogenic: { label: 'REGISTER n ≤ 6', nMax: 6, title: 'Forty-two register σ functions on two centres' },
};
const RUNAWAY = 'This frozen basis gives a repulsive electrostatic force';
const CURVE_N = 40, CURVE_LO = 0.8, CURVE_HI = 8, CHUNK = 5, SLICE_MS = 24, BUDGET_MS = 30;
const defaultForce = (k) => (k === 'lcao1s' ? 'exact' : 'hf');
/** the exact 1sσg total energies of Bates, Ledsham & Stewart 1953 — drawn as dots, printed when R sits on one */
const EXACT = [[1, -0.45179], [2, -0.60263], [3, -0.57756], [4, -0.54608]];

export function createMOPanel(host, api = {}) {
  let kind = 'lcao1s', lambda = 1.7611, R = 2;
  let mode = 'hold', nuclear = defaultForce('lcao1s'), R0 = 2.8, v0 = 0, dt = 5, connection = true;
  let mo = null, curve = null, eq = null, f = null, E0 = 0;
  let dyn = null, running = false, Rmin = 0, Rmax = 0, stepMs = 0, frames = 0;

  /* ── the job queue: heavy maths in ≤ 24 ms slices, one pending job per tag, the last request winning ────────── */
  const jobs = []; let pumping = false, waiters = [], demanded = false, loading = false;
  let active = api.active ? !!api.active() : true;
  const setLoading = (v) => { const next = !!v; if (next === loading) return; loading = next; if (api.loading) api.loading(next); };
  function armPump() { if (!pumping && jobs.length && (active || demanded)) { pumping = true; setLoading(true); setTimeout(pump, 0); } }
  function enqueue(tag, fn) {
    const i = jobs.findIndex((j) => j.tag === tag); if (i >= 0) jobs.splice(i, 1);
    jobs.push({ tag, fn });
    armPump();
  }
  function drain() { pumping = false; setLoading(false); if (active) { refresh(); paint(); } const w = waiters; waiters = []; demanded = false; for (const r of w) r(); }
  function pump() {
    if (!active && !demanded) { pumping = false; setLoading(false); return; }
    const t0 = performance.now();
    while (jobs.length && performance.now() - t0 < SLICE_MS) { const j = jobs.shift(); try { j.fn(); } catch (e) { console.error('mo job ' + j.tag, e); } }
    if (jobs.length) { setTimeout(pump, 0); return; }
    drain();
  }
  const whenReady = () => {
    if (!jobs.length && !pumping) return Promise.resolve();
    demanded = true; armPump();
    return new Promise((r) => waiters.push(r));
  };
  function setActive(v) { active = !!v; if (active) armPump(); else if (!demanded) setLoading(false); return active; }

  /* ── the basis: one createMO, one cached curve, one equilibrium, one force ──────────────────────────────────── */
  function rebuild() {
    jobs.length = 0;
    mo = createMO({ kind, nMax: KINDS[kind].nMax, lambda });
    eq = null; f = null; resetRun();
    curve = { R: new Float64Array(CURVE_N), E: new Float64Array(CURVE_N), done: 0, n: CURVE_N, kind, lambda };
    for (let i = 0; i < CURVE_N; i++) curve.R[i] = CURVE_LO + (CURVE_HI - CURVE_LO) * i / (CURVE_N - 1);
    for (let s = 0; s < CURVE_N; s += CHUNK) enqueue('curve:' + s, () => { const c = curve; for (let i = s; i < Math.min(CURVE_N, s + CHUNK); i++) { c.E[i] = mo.groundEnergy(c.R[i]); c.done++; } if (active) paint(); });
    enqueue('eq', () => { eq = mo.equilibrium({ lo: 1.2, hi: 4, iters: 40 }); });
    enqueue('force', solveForce);
    refresh();
  }
  /** the force line at the current R, for the ground eigenvector of the chosen basis (F_exact by central differences) */
  function solveForce() {
    if (!mo) return;
    const sol = mo.solve(R); E0 = sol.E0;
    f = mo.force(R, mo.vector(sol, 0));
  }

  /* ── the run ────────────────────────────────────────────────────────────────────────────────────────────────── */
  function resetRun() { dyn = null; running = false; Rmin = Rmax = R0; stepMs = 0; }
  function ensureDyn() {
    if (!dyn) {
      dyn = createDynamics(mo, { R0, v0, dt, electron: mode === 'ehrenfest' ? 'ehrenfest' : 'bo', nuclearForce: nuclear, connection, track: false });
      Rmin = Rmax = dyn.R;
    }
    return dyn;
  }
  /** one step, timed: Rmin/Rmax are kept here so the stepper needs no history */
  function stepOnce(n = 1) {
    const d = ensureDyn(), t0 = performance.now();
    for (let k = 0; k < n; k++) { d.step(1); if (d.R < Rmin) Rmin = d.R; if (d.R > Rmax) Rmax = d.R; }
    stepMs = stepMs ? stepMs * 0.7 + (performance.now() - t0) / n * 0.3 : (performance.now() - t0) / n;
    return d;
  }
  /** ONE step per frame, or one per OTHER frame once a step measures over half a 30 ms budget (always the register) */
  const every = () => (kind === 'hydrogenic' || stepMs > BUDGET_MS / 2 ? 2 : 1);

  /* ── the controls ───────────────────────────────────────────────────────────────────────────────────────────── */
  const box = group(host, 'GENERAL BASIS');
  const rB = el('div', 'row tight', box);
  const basisSeg = seg({ label: 'BASIS', value: 'lcao1s',
    options: Object.keys(KINDS).map((k) => ({ id: k, label: KINDS[k].label, title: KINDS[k].title })),
    onChange: (v) => setBasis(v) });
  rB.appendChild(basisSeg.root);
  const lamKnob = knob({ label: 'λ  (Sturmian)', min: 0.5, max: 3, value: 1.7611, fmt: (v) => v.toFixed(4),
    onInput: (v) => { if (kind !== 'sturmian') return; lambda = v; jobs.length = 0; enqueue('rebuild', rebuild); } });   // a drag drops the stale queue: the last λ wins
  lamKnob.root.title = 'Common Sturmian exponent. Hold Shift for finer changes.';
  rB.appendChild(lamKnob.root); lamKnob.setDisabled(true);

  const cv = el('canvas', 'mol-c', box);
  const g = cv.getContext('2d');

  const rr = el('div', 'row tight', box);
  const roE = readout({ label: 'E_total(R)  (hartree)', value: '—', sub: '' });
  const roQ = readout({ label: 'R_e · D_e · ω · T', value: '—', sub: '' });
  /* `wide` (wave 44): the force line is 333 px of text in a 230 px box, and .ro-val is nowrap with NO ellipsis — so
     the card printed "F_elec −0.133906  +  Z_AZ_B/R² 0.2500" and hard-clipped the "= F_HF" that is the whole claim.
     .ro.wide lets it wrap, which is wave 41's own lesson (ii) applied to the readout instead of the caption. */
  const roF = readout({ label: 'HELLMANN–FEYNMAN  F on nucleus B  (hartree/a₀)', value: '—', cls: 'wide', sub: '' });
  rr.appendChild(roE.root); rr.appendChild(roQ.root); rr.appendChild(roF.root);

  const rN = el('div', 'row tight', box);
  const nucSeg = seg({ label: 'NUCLEI', value: 'hold', options: [
    { id: 'hold', label: 'HOLD', title: 'the nuclei stand still at R' },
    { id: 'bo', label: 'BO', title: 'Follow the ground electronic state' },
    { id: 'ehrenfest', label: 'EHRENFEST*', title: 'Use orbitals that move with the nuclei' }],
    onChange: (v) => { mode = v; resetRun(); refresh(); paint(); } });
  rN.appendChild(nucSeg.root);
  const forceSeg = seg({ label: 'FORCE', value: nuclear === 'exact' ? 'exact' : 'hf', options: [
    { id: 'exact', label: '−dE/dR', title: 'Use the energy-conserving force on R' },
    { id: 'hf', label: 'HELLMANN–FEYNMAN', title: 'Electrostatic force on the nucleus. ' + RUNAWAY }],
    onChange: (v) => { nuclear = v; resetRun(); refresh(); paint(); } });
  rN.appendChild(forceSeg.root);
  const dtKnob = knob({ label: 'dt  (a.u.)', min: 1, max: 10, value: 5, step: 0.5, fmt: (v) => v.toFixed(1),
    onInput: (v) => { dt = v; resetRun(); refresh(); } });
  rN.appendChild(dtKnob.root);
  /* CONNECTION (wave 50).  mo.js has taken `connection` since wave 49 and nothing on the card could reach it.  It is
     the moving-basis transport exp(−ΔR S⁻¹D) with D = S′/2 + ½diag(P, −P) — the term the exact equation
     iSċ = (H − iṘD)c carries because the basis rides on the nuclei — and it is EHRENFEST's alone (a BO electron is
     re-solved at every R and has nothing to transport).  OFF is the wave-42 comparison branch: the carried vector is
     re-read in the new basis and rescaled, and normDrift then reports what the rescaling removed. */
  const connSw = sw({ label: 'CONNECTION', value: true, onChange: (v) => { connection = v; resetRun(); refresh(); paint(); } });
  connSw.root.title = 'Include the moving-basis connection';
  rN.appendChild(connSw.root);
  rN.appendChild(trig({ label: 'RUN', title: 'Run nuclear motion with the lab clock', onFire: () => run() }).root);
  rN.appendChild(trig({ label: 'HOLD', title: 'stop stepping — the trajectory stays where it is', onFire: () => hold() }).root);
  rN.appendChild(trig({ label: 'RESET', title: 'throw the trajectory away and start again at R₀, v₀', onFire: () => resetTraj() }).root);

  const rF = el('div', 'row tight', box);
  const r0Fd = fader({ label: 'R₀  a₀', min: 1, max: 6, value: 2.8, fmt: (v) => v.toFixed(3), onInput: (v) => { R0 = v; resetRun(); refresh(); paint(); } });
  const v0Fd = fader({ label: 'v₀  a.u.', min: -0.02, max: 0.02, value: 0, fmt: (v) => v.toFixed(4), onInput: (v) => { v0 = v; resetRun(); refresh(); paint(); } });
  rF.appendChild(r0Fd.root); rF.appendChild(v0Fd.root);

  const rr2 = el('div', 'row tight', box);
  const roR = readout({ label: 'NUCLEI  R(t) · v', value: '—', sub: '' });
  const roD = readout({ label: 'E_total · DRIFT · ∫bound', value: '—', sub: '' });
  const roC = readout({ label: 'MOVING BASIS  ·  dt CEILING', value: '—', cls: 'wide', sub: '' });
  rr2.appendChild(roR.root); rr2.appendChild(roD.root); rr2.appendChild(roC.root);

  el('div', 'note', box).innerHTML = '<b>Moving nuclei.</b> Choose a basis and compare the energy-gradient force with the electrostatic Hellmann–Feynman force. PULAY reports their finite-basis difference and bound. Born–Oppenheimer follows one surface; Ehrenfest also evolves the electronic coefficients and can include the moving-basis connection. Reduce dt if the drift grows.';

  /* ── the readouts ───────────────────────────────────────────────────────────────────────────────────────────── */
  const exactAt = (r) => { const p = EXACT.find((q) => Math.abs(q[0] - r) < 5e-4); return p ? ` · reference ${p[1].toFixed(5)}` : ''; };
  const note = () => (kind === 'lcao1s' ? RUNAWAY : '');
  function refresh() {
    if (!mo) return;
    const busy = jobs.length > 0;
    roE.set(E0 ? E0.toFixed(5) : '—', E0 && E0 < -0.5 ? 'ok' : E0 ? 'warn' : '');
    roE.setSub(`${KINDS[kind].label}${kind === 'sturmian' ? ` · λ ${lambda.toFixed(4)}` : ''} · ${mo.n} functions · R ${R.toFixed(3)}${exactAt(R)}`);
    if (eq) {
      roQ.set(`R_e ${eq.Re.toFixed(4)} a₀ · D_e ${eq.De_eV.toFixed(3)} eV`, eq.De_eV > 0 ? 'ok' : 'warn');
      roQ.setSub(`ω = ${eq.omega.toFixed(6)} a.u. · T = 2π/ω = ${eq.period.toFixed(1)} a.u. · from the 5-point curvature at R_e (golden section on this basis's own curve)`);
    } else { roQ.set(busy ? 'computing…' : '—', ''); roQ.setSub(`golden section on E(R), then the curvature at R_e — ${curve ? curve.done : 0}/${CURVE_N} curve points`); }
    if (f) {
      roF.set(`F_elec ${f.F_elec.toFixed(6)}  +  Z_AZ_B/R² ${f.F_nuc.toFixed(6)}  =  F_HF ${f.F_HF.toFixed(6)}`, Math.abs(f.pulay) <= f.bound ? 'ok' : 'warn');
      roF.setSub(`Pulay ${f.pulay.toFixed(8)} · bound ${f.bound.toFixed(6)} · −dE/dR ${f.F_exact.toFixed(6)}${note() ? ' · ' + note() : ''}`);
    } else { roF.set(busy ? 'computing…' : '—', ''); roF.setSub('F_HF − Pulay = −dE/dR in the finite basis'); }
    refreshRun();
  }
  /* THE dt CEILING (wave 50).  With the connection carried the generator is R-dependent, so the accuracy of the
     electron step is set by ΔR = |Ṙ|dt, not by dt alone: tests/mo.test.mjs W49-6 measures the excess electronic
     energy of the same run at 3.08e-5 · 2.14e-6 · 1.19e-6 for dt = 5 · 2.5 · 1.25 — the lab's shipped dt = 5 is 26
     times off its own converged answer, and it said so nowhere.  DT_OK = 2.5 is where that run is within a factor
     of two of the resolved number, and above it this line goes amber.  A BO electron is re-solved at every R and
     does not carry the term, so the ceiling is named for what it is. */
  const DT_OK = 2.5;
  function refreshConn() {
    const carried = mode === 'ehrenfest' && connection, over = dt > DT_OK + 1e-9;
    const state = mode !== 'ehrenfest' ? 'BO — nothing to transport' : connection ? 'CARRIED' : 'OFF — wave-42 branch';
    roC.set(`${state} · dt ${dt.toFixed(1)}${over ? ' > ' + DT_OK.toFixed(1) : ''}`, over && carried ? 'warn' : carried ? 'ok' : '');
    roC.setSub(over
      ? `dt ${dt.toFixed(1)} is ABOVE the ${DT_OK.toFixed(1)} a.u. ceiling: the moving-basis generator is R-dependent, so the step's accuracy is set by ΔR = |Ṙ|dt — the excess electronic energy of the reference run reads 3.08e-5 at dt = 5 against 1.19e-6 at dt = 1.25 (mo.test W49-6), 26× off. Turn dt down to read the connection's own answer; BO is unaffected.`
      : `exp(−ΔR S⁻¹D), D = S′/2 + ½diag(P, −P): the term a basis riding on the nuclei owes the exact equation iSċ = (H − iṘD)c. On the 1s LCAO P = 0 exactly, so it is precisely the metric term. dt ≤ ${DT_OK.toFixed(1)} a.u. resolves it.`);
  }
  function refreshRun() {
    refreshConn();
    const d = dyn;
    if (!d) {
      roR.set(`R₀ ${R0.toFixed(3)} a₀ · v₀ ${v0 >= 0 ? '+' : ''}${v0.toFixed(4)}`, mode === 'hold' ? '' : 'ok');
      roR.setSub(mode === 'hold' ? 'NUCLEI HOLD — choose BO or EHRENFEST, then RUN (the run advances with the lab clock)' : `${mode === 'bo' ? 'Born–Oppenheimer' : 'Ehrenfest'} electrons · ${nuclear === 'exact' ? '−dE/dR' : 'Hellmann–Feynman'} · dt = ${dt.toFixed(1)} a.u. · nothing stepped yet`);
      roD.set('—', ''); roD.setSub(`μ = 918.0764 electron masses · velocity Verlet · the bound is 2‖∂_Rψ‖‖(H−E)ψ‖ at every step`);
      return;
    }
    const e = d.energy, drift = d.drift, ib = d.integratedBound, ok = Math.abs(drift) <= ib;
    roR.set(`R ${d.R.toFixed(4)} a₀ · v ${d.v >= 0 ? '+' : ''}${d.v.toFixed(6)}`, running ? 'live' : 'ok');
    roR.setSub(`t = ${d.t.toFixed(0)} a.u. · ${d.steps} steps · ${mode === 'bo' ? 'BO' : 'Ehrenfest'} · ${nuclear === 'exact' ? '−dE/dR' : 'Hellmann–Feynman'} · dt = ${dt.toFixed(1)} · R ∈ [${Rmin.toFixed(3)}, ${Rmax.toFixed(3)}] · ${stepMs.toFixed(1)} ms/step, one step per ${every() === 1 ? 'frame' : 'OTHER frame'} (budget ${BUDGET_MS} ms)${note() && nuclear === 'hf' ? ' · ' + note() : ''}`);
    /* WAVE 49 — THE INEQUALITY MAY SHOW GREEN AGAIN, AND ONLY WHERE IT IS PROVED.  A BO run's |drift| ≤ ∫bound·|Ṙ|dt
       is a statement the stepper verifies at EVERY step (tests/mo.test.mjs D1, D3: max ratio 0.83), so a BO run that
       satisfies it, with no boundary clamp, is entitled to say so — the audit removed every green and left a run that
       met its own bound looking like a run that had failed.  An EHRENFEST run is never green: the bound is a BO
       statement and does not cover the electronic dynamics, whatever the connection is doing. */
    roD.set(`${e.total.toFixed(6)} · ${drift >= 0 ? '+' : ''}${drift.toExponential(2)} · ${ib.toExponential(2)}`, mode === 'bo' ? (!d.clamps && ok ? 'ok' : 'warn') : 'warn');
    roD.setSub(`${ok ? 'within Pulay bound' : 'outside Pulay bound'} · ${mode === 'ehrenfest' ? `S drift ${(d.sNorm - 1).toExponential(2)} · BO gap ${d.adiabaticGap.toExponential(2)}` : nuclear === 'hf' ? 'timestep and quadrature error not included' : 'reduce dt to check drift'}${d.clamps ? ' · boundary reached' : ''}`);
  }

  /* ── the canvas: E(R) of the chosen basis, the marker at R, the run's total energy as a dotted level ─────────── */
  const captionText = () => (kind === 'lcao1s'
    ? 'E(R) · 1s LCAO · dots = reference'
    : `E(R) · ${KINDS[kind].label} · stage uses 1s LCAO`);
  const captionShown = () => (document.body.classList.contains('no-captions') ? '' : captionText());
  /** greedy word wrap — a rack card is narrow, and this caption is the one that must be read whole (the font must
      already be set on g) */
  function wrapCaption(text, maxW) {
    if (!text) return [];
    const out = []; let line = '';
    for (const word of text.split(' ')) {
      const next = line ? line + ' ' + word : word;
      if (line && g.measureText(next).width > maxW) { out.push(line); line = word; } else line = next;
    }
    if (line) out.push(line);
    return out;
  }
  /* WAVE 46 — "R_e 1.997" used to float in the plot beside its own dashed line and "R a₀" sat inside the
     top-right corner of the frame.  The curve, the exact points and the three verticals answer for themselves. */
  let rect = null;
  const hover = graphHover(cv, { repaint: () => paint(), plot: () => rect });
  function paint() {
    if (cv.closest('[hidden]')) return; const W = cv.clientWidth, H = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);   // wave 127 (M6(c)'s law): in the hidden legacy card that read forced a whole layout (17 ms in a restore) to learn W = 0; the reveal repaints via graphHover's ResizeObserver
    if (W < 32 || H < 32 || !curve) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const L = 40, Rt = W - 10, Tp = 12, dis = mo ? mo.dissociation : -0.5;
    g.font = '8px ui-monospace, monospace';
    const caps = wrapCaption(captionShown(), Rt - L);                            // the card is narrow: the caption wraps at its own · marks
    const Bt = H - 8 - caps.length * 10;
    let lo = dis, hiRef = dis;
    for (let i = 0; i < curve.done; i++) if (curve.E[i] < lo) lo = curve.E[i];
    for (const [, E] of EXACT) { if (E < lo) lo = E; if (E > hiRef) hiRef = E; }  // the exact points share the frame: the bound's cost is the picture
    const well = Math.max(0.02, dis - lo);                                       // the depth on the card is the depth this basis finds
    const Emin = lo - 0.15 * well, Emax = Math.max(dis + 0.35 * well, hiRef + 0.08 * well);
    const x = (r) => L + (r - CURVE_LO) / (CURVE_HI - CURVE_LO) * (Rt - L);
    const y = (E) => Bt - (Math.min(Emax, Math.max(Emin, E)) - Emin) / (Emax - Emin) * (Bt - Tp);
    const rgbOf = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;                        // wave 57: the wheel's own sRGB triple, not the DOM string re-parsed
    const acc = rgbOf(accentRGB(g, 1)), acc2 = rgbOf(accentRGB(g, 2));
    const D = readRGB(g, '--dim', '#b8b8b8'), ink = (al) => `rgba(${D[0]},${D[1]},${D[2]},${al})`;
    g.font = '9px ui-monospace, monospace'; g.textBaseline = 'middle';
    g.strokeStyle = ink(0.35); g.setLineDash([2, 3]); g.beginPath(); g.moveTo(L, y(dis)); g.lineTo(Rt, y(dis)); g.stroke(); g.setLineDash([]);
    g.fillStyle = ink(0.8); g.textAlign = 'right'; g.fillText('H + H⁺', L - 3, y(dis));   // the gutter's one end value
    rect = { x0: L, y0: Tp, x1: Rt, y1: Bt };
    const hovers = [];
    if (curve.done > 1) {                                                        // the curve, as far as the queue has got
      const pts = [];
      g.strokeStyle = acc; g.lineWidth = 2; g.beginPath();
      for (let i = 0; i < curve.done; i++) { const p = [x(curve.R[i]), y(curve.E[i])]; pts.push(p[0], p[1]); if (i === 0) g.moveTo(p[0], p[1]); else g.lineTo(p[0], p[1]); }
      g.stroke();
      hovers.push({ kind: 'curve', key: 'E0', points: pts, lw: 2, colour: acc,
        info: `E₀(R)  ·  the variational curve, ${curve.done} of ${curve.R.length} points  ·  dissociation ${dis.toFixed(4)} Eh` });
    }
    for (const [r, E] of EXACT) { g.fillStyle = ink(0.95); g.beginPath(); g.arc(x(r), y(E), 3, 0, 2 * Math.PI); g.fill();
      hovers.push({ kind: 'dot', key: 'x' + r, x: x(r), y: y(E), r: 3, colour: ink(1), info: `reference · R = ${r} a₀ · E = ${E.toFixed(4)} Eh` }); }
    if (eq) {                                                                    // the minimum this basis actually has
      g.strokeStyle = ink(0.4); g.setLineDash([1, 3]); g.beginPath(); g.moveTo(x(eq.Re), y(eq.E)); g.lineTo(x(eq.Re), Bt); g.stroke(); g.setLineDash([]);
      hovers.push({ kind: 'line', key: 'Re', points: [x(eq.Re), y(eq.E), x(eq.Re), Bt], lw: 1, colour: ink(1),
        info: `R_e = ${eq.Re.toFixed(3)} a₀  ·  E = ${eq.E.toFixed(4)} Eh  ·  the minimum THIS basis has` });
    }
    if (dyn) {                                                                   // the trajectory's conserved total, dotted
      g.strokeStyle = acc2; g.setLineDash([2, 4]); g.lineWidth = 1.2; g.beginPath(); g.moveTo(L, y(dyn.energy.total)); g.lineTo(Rt, y(dyn.energy.total)); g.stroke(); g.setLineDash([]);
      hovers.push({ kind: 'line', key: 'tot', points: [L, y(dyn.energy.total), Rt, y(dyn.energy.total)], lw: 1.2, colour: acc2,
        info: `the trajectory's conserved total  ·  E = ${dyn.energy.total.toFixed(5)} Eh` });
    }
    const Rnow = dyn ? dyn.R : R, Enow = dyn ? dyn.force.E0 : E0;
    g.strokeStyle = ink(0.6); g.lineWidth = 1; g.beginPath(); g.moveTo(x(Rnow), Tp); g.lineTo(x(Rnow), Bt); g.stroke();
    if (Enow) { g.fillStyle = dyn ? acc2 : acc; g.beginPath(); g.arc(x(Rnow), y(Enow), 3.5, 0, 2 * Math.PI); g.fill();
      hovers.push({ kind: 'dot', key: 'now', x: x(Rnow), y: y(Enow), r: 3.5, colour: dyn ? acc2 : acc,
        info: `now  ·  R = ${Rnow.toFixed(3)} a₀  ·  E₀ = ${Enow.toFixed(5)} Eh` }); }
    g.font = '8px ui-monospace, monospace'; g.fillStyle = ink(0.8); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    caps.forEach((line, i) => g.fillText(line, L, H - 4 - (caps.length - 1 - i) * 10));   // the law, under the plot
    g.font = '9px ui-monospace, monospace'; g.textBaseline = 'middle'; g.fillStyle = ink(0.8);
    fitText(g, 'R a₀', Rt, 6, { x0: L, y0: 0, x1: Rt, y1: Tp - 2 }, 'right');            // the x axis name, ABOVE the frame
    hover.set(hovers, rect);
  }

  /* ── the API ────────────────────────────────────────────────────────────────────────────────────────────────── */
  function setBasis(k) {
    if (!KINDS[k] || k === kind) return false;
    kind = k; basisSeg.set(k); lamKnob.setDisabled(kind !== 'sturmian');
    nuclear = defaultForce(kind); forceSeg.set(nuclear);
    rebuild(); return true;
  }
  function setLambda(v) { lambda = Math.max(0.5, Math.min(3, +v || 1.7611)); lamKnob.set(lambda); if (kind === 'sturmian') { rebuild(); return true; } return false; }
  function setR(v, sync) { R = v; if (sync) { solveForce(); refresh(); paint(); } else enqueue('force', () => { solveForce(); paint(); }); }
  function setDynamics(m) { if (!['hold', 'bo', 'ehrenfest'].includes(m)) return false; mode = m; nucSeg.set(m); resetRun(); refresh(); paint(); return true; }
  function setForce(v) { const id = (v === 'hf' || v === 'exact') ? v : null; if (!id) return false; nuclear = id; forceSeg.set(id); resetRun(); refresh(); paint(); return true; }
  function run() { if (mode === 'hold') { refreshRun(); return false; } ensureDyn(); running = true; refreshRun(); if (api.repaint) api.repaint(false); return true; }
  function hold() { running = false; refreshRun(); return true; }
  function resetTraj() { resetRun(); refresh(); paint(); return true; }
  function step(n = 1) { if (mode === 'hold') setDynamics('bo'); stepOnce(Math.max(1, n | 0)); refreshRun(); paint(); return dyn.R; }
  /** the digest table: the force identity in full, the curve's own numbers, and the run if there is one */
  function table() {
    if (!mo) return '';
    const rows = [`THE GENERAL BASIS (W-MO)  ·  ${KINDS[kind].label}  ·  ${mo.n} functions on two centres`,
      `basis\t${kind}${kind === 'sturmian' ? '  λ = ' + lambda.toFixed(4) : ''}`,
      `R\t${R.toFixed(4)}`, `E_total(R)\t${E0.toFixed(8)}`];
    if (eq) rows.push(`R_e\t${eq.Re.toFixed(5)}`, `D_e\t${eq.De.toFixed(8)} hartree = ${eq.De_eV.toFixed(4)} eV`, `ω\t${eq.omega.toFixed(8)}`, `period 2π/ω\t${eq.period.toFixed(3)} a.u.`);
    if (f) rows.push('', 'THE FORCE ON NUCLEUS B  (hartree/a₀, positive = apart)',
      `F_elec  (the density's pull)\t${f.F_elec.toFixed(8)}`, `F_nuc = Z_AZ_B/R²\t${f.F_nuc.toFixed(8)}`, `F_HF = F_elec + F_nuc\t${f.F_HF.toFixed(8)}`,
      `F_exact = −dE/dR\t${f.F_exact.toFixed(8)}`, `Pulay 2⟨∂_Rψ|(H−E)ψ⟩\t${f.pulay.toFixed(8)}  (${f.pulay.toFixed(4)})`,
      `bound 2‖∂_Rψ‖‖(H−E)ψ‖\t${f.bound.toFixed(8)}`, `‖∂_Rψ‖\t${f.dpsiNorm.toFixed(8)}`, `‖(H−E)ψ‖\t${f.residual.toFixed(8)}`,
      `F_HF − Pulay − F_exact\t${(f.F_HF - f.pulay - f.F_exact).toExponential(3)}`);
    if (note()) rows.push(`note\t${note()}`);
    if (dyn) rows.push('', `THE RUN  ·  ${mode === 'bo' ? 'Born–Oppenheimer' : 'Ehrenfest'} electrons  ·  ${nuclear === 'exact' ? '−dE/dR' : 'Hellmann–Feynman'}  ·  dt = ${dt.toFixed(1)}${dt > DT_OK + 1e-9 ? '  (ABOVE the ' + DT_OK.toFixed(1) + ' a.u. ceiling)' : ''}`,
      `moving-basis connection\t${dyn.connection ? 'CARRIED  exp(−ΔR S⁻¹D)' : mode === 'ehrenfest' ? 'OFF  (wave-42: re-read and rescale)' : 'n/a  (BO electrons)'}`,
      `R₀ · v₀\t${R0.toFixed(4)}\t${v0.toFixed(6)}`, `t\t${dyn.t.toFixed(2)}`, `steps\t${dyn.steps}`, `R(t)\t${dyn.R.toFixed(6)}`, `v(t)\t${dyn.v.toFixed(8)}`,
      `R range\t${Rmin.toFixed(5)}\t${Rmax.toFixed(5)}`, `E_total\t${dyn.energy.total.toFixed(8)}`, `drift\t${dyn.drift.toExponential(4)}`,
      `∫bound\t${dyn.integratedBound.toExponential(4)}`, `comparison (not a certificate)\t${Math.abs(dyn.drift) <= dyn.integratedBound ? 'drift ≤ ∫bound' : 'drift > ∫bound'}`,
      `scope\tcontinuous BO Pulay contribution only; excludes numerical error, omitted basis transport and clamps`);
    return rows.join('\n');
  }
  function state() {
    const d = dyn;
    return { kind, lambda, R, n: mo ? mo.n : 0, E0, label: KINDS[kind].label,
      Re: eq ? eq.Re : null, De_eV: eq ? eq.De_eV : null, omega: eq ? eq.omega : null, period: eq ? eq.period : null,
      electron: mode, force: nuclear, connection, dt, dtOver: dt > DT_OK + 1e-9, dtCeiling: DT_OK, carried: dyn ? dyn.connection : (mode === 'ehrenfest' && connection), running, busy: jobs.length > 0 || pumping, note: note(), caption: captionShown(),
      stepMs, every: every(), curveDone: curve ? curve.done : 0,
      t: d ? d.t : 0, Rt: d ? d.R : R, v: d ? d.v : v0, steps: d ? d.steps : 0, Rmin: d ? Rmin : null, Rmax: d ? Rmax : null,
      energy: d ? d.energy : null, drift: d ? d.drift : 0, integratedBound: d ? d.integratedBound : 0,
      adiabaticGap: d ? d.adiabaticGap : 0, normDrift: d ? d.normDrift : 0,
      badge: d ? (Math.abs(d.drift) <= d.integratedBound ? 'drift ≤ ∫bound' : 'drift > ∫bound') : '' };
  }
  /** the run advances with the lab clock: one step per frame, or one per other frame when a step is dear */
  function update(t, playing) {
    if (!running || mode === 'hold' || !mo) return;
    if (!playing) return;
    frames++; if (frames % every()) return;
    stepOnce(1); refreshRun(); paint();
  }
  window.addEventListener('resize', () => { if (active) paint(); });
  rebuild();
  return {
    update, refresh, paint, table, whenReady, setActive,
    setR, get R() { return R; }, get kind() { return kind; },
    save: () => ({ kind, lambda, R, electron: mode, force: nuclear, connection, dt }),
    load(o) {
      if (!o) return false;
      if (o.kind && KINDS[o.kind] && o.kind !== kind) { kind = o.kind; basisSeg.set(kind); lamKnob.setDisabled(kind !== 'sturmian'); }
      if (o.lambda !== undefined) { lambda = Math.max(0.5, Math.min(3, +o.lambda || 1.7611)); lamKnob.set(lambda); }
      if (o.R !== undefined) R = +o.R;
      if (o.electron && ['hold', 'bo', 'ehrenfest'].includes(o.electron)) { mode = o.electron; nucSeg.set(mode); }
      if (o.force === 'hf' || o.force === 'exact') { nuclear = o.force; forceSeg.set(nuclear); }
      if (o.connection !== undefined) { connection = !!o.connection; connSw.set(connection); }
      if (o.dt !== undefined) { dt = Math.max(1, Math.min(10, +o.dt || 5)); dtKnob.set(dt); }
      rebuild(); return true;
    },
    api: { setBasis, setLambda, setR: (v) => setR(v, true), setDynamics, setForce, run, hold, reset: resetTraj, step,
      force: () => { if (!f) { solveForce(); refresh(); } return f; }, state, curve: () => curve, note, whenReady,
      setR0: (v) => { R0 = v; r0Fd.set(v); resetRun(); refresh(); paint(); }, setV0: (v) => { v0 = v; v0Fd.set(v); resetRun(); refresh(); paint(); },
      setDt: (v) => { dt = v; dtKnob.set(v); resetRun(); refresh(); paint(); },
      setConnection: (v) => { connection = !!v; connSw.set(connection); resetRun(); refresh(); paint(); return connection; }, get connection() { return connection; }, get dtCeiling() { return DT_OK; },
      digest: table, get mo() { return mo; } },
  };
}
