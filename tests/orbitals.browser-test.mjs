/* tests/orbitals.browser-test.mjs — the ORBITALS window's laws, in a real browser on the real GPU.
 *
 *   tools/gate/server.py "$PWD" 8706 &
 *   LW_PORT=8706 GD_PORT=5208 node tests/orbitals.browser-test.mjs
 *
 * THE WINDOW UNDER TEST is the MOLECULAR REGISTER (MATH-H2O-2026-09-11, Proposition 1):
 *     ψ(r, t) = Σ_k c_k e^{−iε_k t} φ_k(r),   φ_k = Σ_μ C_μk χ_μ
 * — hydrogen's register with the molecule's ladder.  Every number below is H₂O/STO-3G's, computed by
 * lab/rhf-molecule.js in node before the browser opens and re-derived in the page by the app's own modules:
 *     ε = −20.241863  −1.268162  −0.617565  −0.453022  −0.391237 | 0.605172  0.741598
 *     HOMO = level 5 (ε −0.391237), LUMO = level 6 (ε 0.605172), Δε = 0.996409, T = 2π/Δε = 6.305832
 * and Δε is the FROZEN-ORBITAL gap, NOT the RPA root 0.483101392 the CHEMISTRY sticks stand at — a factor
 * of two apart, which is exactly why the window's own label has to say so.
 *
 * WHY THE CLOCK IS SCRUBBED TO t = 1 BEFORE THE FIELD IS READ.  At t = 0 with both phases zero the register
 * is real (ψ = (φ_HOMO + φ_LUMO)/√2) and Im ψ is zero EVERYWHERE, legitimately.  The claim under test is that
 * the register carries an argument, so the clock is put somewhere e^{−iε_k t} is not real for either level.
 *
 * THE HALF-BEAT.  |ψ|² = ½(φ_H² + φ_L²) + φ_H φ_L cos(Δε t), so at t and t + π/Δε the cross term flips sign
 * and nothing else moves.  The probe is the voxel carrying the largest |φ_H φ_L| on the app's own grid, and
 * both densities are predicted by the CPU evaluator at that voxel's centre before the GPU is asked.
 */
import { open, judge, done } from '../tools/gate/gatekit.mjs';
import { readFileSync } from 'node:fs';
import fs from 'node:fs';
import path from 'node:path';
import { moleculeRHF, registerRecord } from '../lab/rhf-molecule.js';
import { VIEW } from '../lab/field.js';

const PORT = process.env.LW_PORT || 8706;
const ROOT = new URL('..', import.meta.url).pathname;
const SHOT = path.join(ROOT, '.tmp', 'orbitals-h2o.png');

const H2O = { energy: -74.963023162862, nAO: 7, nocc: 5, epsHOMO: -0.391237, epsLUMO: 0.605172, gap: 0.996409,
  atoms: [[8, 0, 0, 0.22166487441148175], [1, 0, 1.4309006215206648, -0.886659497645927], [1, 0, -1.4309006215206648, -0.886659497645927]] };
const near = (a, b, tol) => Number.isFinite(a) && Math.abs(a - b) <= tol;

/* ── node: the ladder and the beat, from the same solver the page will run ────────────────────────── */
registerRecord('sto-3g', JSON.parse(readFileSync(new URL('../lab/vendor/bse/sto-3g-v1.json', import.meta.url), 'utf8')));
const sol = moleculeRHF({ atoms: H2O.atoms.map(([Z, x, y, z]) => ({ Z, x, y, z })), basis: 'sto-3g' });
const EPS = Array.from(sol.orbitalEnergies);
const GAP = EPS[sol.nocc] - EPS[sol.nocc - 1], PERIOD = 2 * Math.PI / GAP, T0 = 1.0, THALF = Math.PI / GAP;
/* the probe: the voxel with the largest |φ_HOMO φ_LUMO| is found in the page on the app's OWN grid, seeded
   from a point the node solve already knows carries both lobes (measured −0.4939 and −0.5049 at res 64) */
const SEED = [-0.3483234666337811, 0.11610782221126037, -0.11610782221126037];
const payload = { seed: SEED, t0: T0, tHalf: THALF, atoms: H2O.atoms };

const g = await open(`https://127.0.0.1:${PORT}/lab/`, { width: 1500, height: 1150, script: 300000 });
try {
  /* ── L0 · boot clean, and the window exists ─────────────────────────────────────────────────────── */
  const ready = await g.waitFor('window.__LW&&__LW.ready', 400, 100);
  judge('L0 boot: __LW.ready', ready.ok === 1, ready);
  const boot = await g.ev(`return { errs: window.__e.slice(), gpu: __LW.field.error || null,
    card: !!document.querySelector('.dev[data-id="orbitals"]'),
    eyebrow: (document.querySelector('.dev[data-id="orbitals"] .dev-eyebrow') || {}).textContent,
    title: (document.querySelector('.dev[data-id="orbitals"] .dev-title') || {}).textContent,
    inMenu: [...document.querySelectorAll('.dev')].map((d) => d.dataset.id).includes('orbitals'),
    handle: typeof __LW.orbitals === 'object' && typeof __LW.orbitals.select === 'function',
    ladder0: __LW.orbitals.ladder().length, on0: __LW.orbitals.on };`);
  /* the window's eyebrow is REGISTER since 2026-09-18 (REGISTER-WINDOW-SPEC §11.1); its id, and this mode's handle, are unchanged */
  judge('L0 boot: no page error, the ORBITALS window is on the rack and __LW.orbitals is wired',
    boot.errs.length === 0 && boot.card && boot.eyebrow === 'REGISTER' && boot.inMenu && boot.handle && boot.on0 === false, boot);
  if (boot.gpu) judge('L0 a WebGPU device is required for this gate', false, { gpu: boot.gpu });

  /* ── L1 · CHEMISTRY solves the ladder the register runs on ───────────────────────────────────────── */
  const l1 = await g.ev(`__LW.layout.reopen('chem', 'R');
    const sol = await __LW.chem.solve('H2O');
    __LW.chem.setOn(true); __LW.chem.setView('density');
    await new Promise((r) => requestAnimationFrame(r)); await new Promise((r) => setTimeout(r, 250));
    const st = __LW.chem.state();
    return { energy: st.energy, nAO: st.nAO, nocc: st.nocc, owner: st.fieldOwner, running: st.running,
      view: __LW.mat.view, half: __LW.domain.half, res: __LW.field.resolution, molecular: __LW.field.molecular,
      errs: window.__e.slice() };`);
  judge(`L1 CHEMISTRY has H₂O on the field: E = ${H2O.energy} within 1e-9`,
    near(l1.energy, H2O.energy, 1e-9) && l1.owner === true && l1.molecular === true && l1.running === false,
    { energy: l1.energy, delta: l1.energy - H2O.energy, owner: l1.owner, molecular: l1.molecular, half: l1.half, res: l1.res });

  /* ── L2 · the ladder: seven levels, five occupied, HOMO 5 and LUMO 6, and the gap ─────────────────── */
  const l2 = await g.ev(`__LW.layout.reopen('orbitals', 'R');
    const d = document.querySelector('.dev[data-id="orbitals"]');
    if (d.classList.contains('folded')) d.querySelector('.dev-fold').click();
    await new Promise((r) => setTimeout(r, 220));
    const L = __LW.orbitals.ladder(), s = __LW.orbitals.state();
    const cv = d.querySelector('canvas.mol-c'), b = cv && cv.getBoundingClientRect();
    return { levels: L.length, occupied: L.filter((x) => x.occ > 0).length, ladder: L,
      homo: s.homo, lumo: s.lumo, epsHOMO: s.epsHOMO, epsLUMO: s.epsLUMO, gap: s.gap, law: s.law,
      selection: s.selection, canvas: !!cv, painted: !!(b && b.width > 100 && b.height > 40),
      dpr: cv ? { w: cv.width, h: cv.height } : null, errs: window.__e.slice() };`);
  judge('L2 the ladder is 7 levels with 5 occupied', l2.levels === H2O.nAO && l2.occupied === H2O.nocc,
    { levels: l2.levels, occupied: l2.occupied, eps: l2.ladder && l2.ladder.map((x) => +x.eps.toFixed(6)) });
  judge(`L2 HOMO is level 5 at ε = ${H2O.epsHOMO} and LUMO is level 6 at ε = ${H2O.epsLUMO} (within 1e-6)`,
    l2.homo + 1 === 5 && l2.lumo + 1 === 6 && near(l2.epsHOMO, H2O.epsHOMO, 1e-6) && near(l2.epsLUMO, H2O.epsLUMO, 1e-6),
    { homoIndex: l2.homo + 1, lumoIndex: l2.lumo + 1, epsHOMO: l2.epsHOMO, epsLUMO: l2.epsLUMO, node: { epsHOMO: EPS[4], epsLUMO: EPS[5] } });
  judge(`L2 the frozen-orbital gap Δε = ${H2O.gap} within 1e-6, and it is labelled as Δε and not ω_RPA`,
    near(l2.gap, H2O.gap, 1e-6) && near(l2.gap, GAP, 1e-12) && /beats at Δε, not at ω_RPA/.test(l2.law || ''),
    { gap: l2.gap, node: GAP, omegaRPA: 0.483101392, label: l2.law });
  judge('L2 a new solve reset the register to the HOMO alone, and the ladder canvas is DPR-sized and laid out',
    l2.selection.length === 1 && l2.selection[0].k === 4 && l2.selection[0].amp === 1 && l2.canvas && l2.painted
    && l2.dpr.w >= l2.dpr.h && l2.errs.length === 0, { selection: l2.selection, canvas: l2.dpr, errs: l2.errs });

  /* ── L3 · HOMO and LUMO at equal amplitude, then NORM ────────────────────────────────────────────── */
  const l3 = await g.ev(`const O = __LW.orbitals;
    O.clear(); O.select(4, 1, 0); O.select(5, 1, 0);
    const before = O.state();
    O.norm();
    const after = O.state();
    O.setDials(true);
    await new Promise((r) => setTimeout(r, 150));
    const d = document.querySelector('.dev[data-id="orbitals"]');
    return { before: { sum: before.sum, n: before.selection.length }, after,
      lanes: d.querySelectorAll('.orb-lane').length, knobs: d.querySelectorAll('.orb-lane .k').length,
      errs: window.__e.slice() };`);
  judge('L3 HOMO + LUMO at equal amplitude gives Σ|c|² = 2, and NORM makes it exactly 1',
    l3.before.n === 2 && near(l3.before.sum, 2, 1e-12) && near(l3.after.sum, 1, 1e-12)
    && l3.after.selection.every((c) => near(c.amp, Math.SQRT1_2, 1e-12)),
    { beforeSum: l3.before.sum, afterSum: l3.after.sum, amps: l3.after.selection.map((c) => c.amp) });
  judge('L3 the DIALS row is two lanes with an amplitude and a phase knob each',
    l3.lanes === 2 && l3.knobs === 4 && l3.errs.length === 0, { lanes: l3.lanes, knobs: l3.knobs, errs: l3.errs });
  judge(`L3 the beat readout is the period 2π/Δε = ${PERIOD.toFixed(6)} within 1e-4`,
    near(l3.after.period, PERIOD, 1e-4) && near(l3.after.dE, GAP, 1e-12),
    { period: l3.after.period, want: PERIOD, 'Δε': l3.after.dE, note: '2π/0.996409 = 6.3058' });

  /* ── L4 · REGISTER ON takes the field: the observable is phase and the texel has an imaginary part ── */
  const l4 = await g.ev(`const P = arguments[0], O = __LW.orbitals, f = __LW.field;
    const [{ loadRecord, moleculeRHF }, { evaluator }] = await Promise.all([import('./rhf-molecule.js'), import('./molecular-field.js')]);
    await loadRecord('sto-3g');
    const r = moleculeRHF({ atoms: P.atoms.map(([Z,x,y,z]) => ({ Z, x, y, z })), basis: 'sto-3g', charge: 0, detect: false, stability: false, hessian: false });
    const n = r.basis.n, ev = evaluator(r.basis.shells), nocc = r.nocc;
    const col = (k) => { const v = new Float64Array(n); for (let i = 0; i < n; i++) v[i] = r.C[i*n+k]; return v; };
    const H = col(nocc-1), L = col(nocc), eH = r.orbitalEnergies[nocc-1], eL = r.orbitalEnergies[nocc];
    const val = (v, p) => { const a = ev.ao(p); let s = 0; for (let i = 0; i < n; i++) s += v[i]*a[i]; return s; };
    const half = __LW.domain.half, res = __LW.field.resolution;
    const ix = (c) => Math.max(0, Math.min(res-1, Math.round((c+half)/(2*half)*res - 0.5)));
    const ctr = (i) => (i+0.5)/res*2*half - half;
    /* the probe: the app's own voxel nearest the seed, and the CPU truth AT ITS CENTRE (not at the seed) */
    const I = [ix(P.seed[0]), ix(P.seed[1]), ix(P.seed[2])], Q = I.map(ctr);
    const phiH = val(H, Q), phiL = val(L, Q);
    /* the register's own law, on the CPU: ψ = (1/√2)(e^{−iε_H t}φ_H + e^{−iε_L t}φ_L) */
    const psi = (t) => { const a = Math.SQRT1_2;
      const re = a*(Math.cos(-eH*t)*phiH + Math.cos(-eL*t)*phiL), im = a*(Math.sin(-eH*t)*phiH + Math.sin(-eL*t)*phiL);
      return { re, im, rho: re*re + im*im }; };
    const settle = async () => { for (let i = 0; i < 10; i++) await new Promise((r2) => requestAnimationFrame(r2)); await new Promise((r2) => setTimeout(r2, 150)); };
    const out = { probe: { i: I, at: Q, phiH, phiL }, cpu: { t0: psi(P.t0), t1: psi(P.t0 + P.tHalf) } };
    out.viewBefore = __LW.mat.view;
    __LW.clock.scrub(P.t0);
    const took = O.setOn(true);
    __LW.schedule(__LW.TIER.PRESENT);
    await settle();
    let v = await __LW.sampleVoxel(I[0], I[1], I[2]);
    out.t0 = { took, on: O.on, view: __LW.mat.view, viewSeg: (document.querySelector('.dev[data-id="observer"] .seg .on') || {}).textContent || null,
      re: v.re, im: v.im, rho: v.re*v.re + v.im*v.im, info: f.moleculeInfo, t: O.state().t };
    /* half a beat later the cross term φ_H φ_L flips sign and nothing else moves */
    __LW.clock.scrub(P.t0 + P.tHalf);
    __LW.schedule(__LW.TIER.PRESENT);
    await settle();
    v = await __LW.sampleVoxel(I[0], I[1], I[2]);
    out.t1 = { re: v.re, im: v.im, rho: v.re*v.re + v.im*v.im, info: f.moleculeInfo, t: O.state().t };
    out.period = O.state().period; out.sum = O.state().sum; out.status = O.state().status;
    out.errs = window.__e.slice();
    return out;`, [payload]);
  judge('L4 the page call ran', !l4.E, l4.E || 'ok');
  judge('L4 the probe voxel carries both lobes: φ_HOMO and φ_LUMO are both well away from zero',
    Math.abs(l4.probe.phiH) > 0.1 && Math.abs(l4.probe.phiL) > 0.1,
    { voxel: l4.probe.i, at: l4.probe.at.map((q) => +q.toFixed(6)), phiHOMO: l4.probe.phiH, phiLUMO: l4.probe.phiL });
  judge(`L4 REGISTER ON took the field and set the observable to phase (${VIEW.phase})`,
    l4.t0.took === true && l4.t0.on === true && l4.t0.view === VIEW.phase && l4.viewBefore === VIEW.density
    && l4.t0.info && l4.t0.info.kind === 'orbital' && l4.t0.info.complex === true && l4.t0.info.dirty === false,
    { view: l4.t0.view, wasView: l4.viewBefore, kind: l4.t0.info && l4.t0.info.kind, complex: l4.t0.info && l4.t0.info.complex, dirty: l4.t0.info && l4.t0.info.dirty });
  judge('L4 the texel carries an IMAGINARY part — arg ψ exists for a molecule',
    Math.abs(l4.t0.im) > 1e-3 && Math.abs(l4.t0.im / l4.cpu.t0.im - 1) < 0.02 && Math.abs(l4.t0.re / l4.cpu.t0.re - 1) < 0.02,
    { gpu: { re: l4.t0.re, im: l4.t0.im }, cpu: { re: l4.cpu.t0.re, im: l4.cpu.t0.im },
      argDeg: +(Math.atan2(l4.t0.im, l4.t0.re) * 180 / Math.PI).toFixed(3), t: l4.t0.t });
  judge(`L4 |ψ|² at t = ${T0} matches the register's own law within 2 % (rgba16float)`,
    Math.abs(l4.t0.rho / l4.cpu.t0.rho - 1) < 0.02, { gpu: l4.t0.rho, cpu: l4.cpu.t0.rho, rel: l4.t0.rho / l4.cpu.t0.rho - 1 });

  /* ── L5 · the half-beat: the LUMO's contribution changes sign, and the density with it ────────────── */
  const flip = l4.t1 ? l4.t1.rho / l4.t0.rho : NaN;
  judge(`L5 half a beat later (t = ${T0} → ${(T0 + THALF).toFixed(6)}, π/Δε = ${THALF.toFixed(6)}) the density at the probe CHANGES`,
    near(l4.t1.t, T0 + THALF, 1e-9) && Math.abs(flip - 1) > 0.25
    && Math.abs(l4.t1.rho / l4.cpu.t1.rho - 1) < 0.03 && l4.t1.info.complex === true,
    { rho_t0: l4.t0.rho, rho_t1: l4.t1.rho, ratio: flip, cpu_t0: l4.cpu.t0.rho, cpu_t1: l4.cpu.t1.rho,
      note: '|ψ|² = ½(φ_H² + φ_L²) + φ_H φ_L cos(Δε t): the cross term flips, nothing else moves' });
  judge(`L5 the period readout is 2π/Δε = ${PERIOD.toFixed(6)} within 1e-4 and Σ|c|² is still 1`,
    near(l4.period, PERIOD, 1e-4) && near(l4.sum, 1, 1e-12) && l4.errs.length === 0,
    { period: l4.period, want: +PERIOD.toFixed(6), sum: l4.sum, status: l4.status, errs: l4.errs });

  /* ── L6 · save → restore → save, deep-equal on presentation.instruments.orbitals ──────────────────── */
  const l6 = await g.ev(`const O = __LW.orbitals;
    O.setPhase(5, Math.PI / 3); O.setAmp(4, 0.5);
    const a = __LW.serialize(); const A = JSON.parse(JSON.stringify(a.presentation.instruments.orbitals));
    /* scramble every covered surface, then open the file again */
    O.clear(); O.select(1, 0.25, 1.1); O.setOn(false);
    const ok = __LW.restore(a); await new Promise((r) => setTimeout(r, 700));
    const B = JSON.parse(JSON.stringify(__LW.serialize().presentation.instruments.orbitals));
    return { ok, A, B, keys: Object.keys(A).sort().join(','), state: __LW.orbitals.state(),
      view: __LW.mat.view, chemOn: __LW.chem.state().on, errs: window.__e.slice() };`);
  const same6 = JSON.stringify(l6.A) === JSON.stringify(l6.B);
  judge('L6 presentation.instruments.orbitals round-trips deep-equal', l6.ok === true && same6, { A: l6.A, B: l6.B });
  judge('L6 the record is exactly { on, selection: [{ k, amp, phase }] }',
    l6.keys === 'on,selection' && l6.A.selection.length === 2
    && l6.A.selection.every((c) => Object.keys(c).sort().join(',') === 'amp,k,phase')
    && l6.errs.length === 0, { keys: l6.keys, selection: l6.A.selection, errs: l6.errs });

  /* ── the screenshot, with both windows open ──────────────────────────────────────────────────────── */
  fs.mkdirSync(path.dirname(SHOT), { recursive: true });
  await g.ev(`for (const id of ['chem', 'orbitals']) { const d = document.querySelector('.dev[data-id="' + id + '"]');
      d.classList.remove('closed'); if (d.classList.contains('folded')) d.querySelector('.dev-fold').click(); }
    if (!__LW.orbitals.on) __LW.orbitals.setOn(true);
    document.querySelector('.dev[data-id="orbitals"]').scrollIntoView({ block: 'center' });
    await new Promise((r) => setTimeout(r, 600)); return 1;`);
  fs.writeFileSync(SHOT, Buffer.from(await g.snap(), 'base64'));
  const bytes = fs.statSync(SHOT).size;
  judge('SHOT .tmp/orbitals-h2o.png exists and is over 50 kB, both windows open', bytes > 50 * 1024, { file: SHOT, bytes });

  /* ── L7 · REGISTER OFF hands the field back to the card that owns the molecule ────────────────────── */
  const l7 = await g.ev(`const O = __LW.orbitals;
    O.setOn(false);
    __LW.schedule(__LW.TIER.PRESENT);
    for (let i = 0; i < 10; i++) await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => setTimeout(r, 200));
    return { on: O.on, view: __LW.mat.view, chemView: __LW.chem.state().view, info: __LW.field.moleculeInfo,
      owner: __LW.chem.state().fieldOwner, errs: window.__e.slice() };`);
  judge(`L7 REGISTER OFF returns the observable (phase ${VIEW.phase} → density ${VIEW.density}) and the card's own density matrix`,
    l7.on === false && l7.view === VIEW.density && l7.chemView === 'density'
    && l7.info && l7.info.kind === 'density' && l7.info.complex === false && l7.owner === true,
    { on: l7.on, view: l7.view, chemView: l7.chemView, kind: l7.info && l7.info.kind, complex: l7.info && l7.info.complex });

  /* ── L8 · the register refuses the field while CHEMISTRY's real-time RUN has it ───────────────────── */
  const l8 = await g.ev(`const O = __LW.orbitals;
    await __LW.chem.kick();
    const k = await __LW.chem.run(20);
    const stopped = O.setOn(true);            // not running any more: this one must SUCCEED
    O.setOn(false);
    /* and with the run actually live, the register must refuse and say why */
    __LW.chem.setDt(0.01); await __LW.chem.kick();
    const sw = [...document.querySelectorAll('.dev[data-id="chem"] .sw')].find((b) => /RUN/.test(b.textContent));
    if (sw) sw.click();
    await new Promise((r) => setTimeout(r, 60));
    const refusedRunning = __LW.chem.state().running ? O.setOn(true) : 'run did not start';
    const why = O.state().refusal, on = O.on;
    if (sw && __LW.chem.state().running) sw.click();
    __LW.chem.stop(); __LW.chem.reset();
    return { steps: k && k.steps, stopped, refusedRunning, why, on, errs: window.__e.slice() };`);
  judge('L8 the register takes the field when the run is stopped, and refuses it while the run is live',
    l8.stopped === true && l8.refusedRunning === false && l8.on === false && /RT RUN/.test(String(l8.why || '')),
    { runSteps: l8.steps, tookWhenStopped: l8.stopped, tookWhileRunning: l8.refusedRunning, refusal: l8.why });

  /* ── L9 · PLAY animates the beat: the transport clock IS the register's t ─────────────────────────── */
  const l9 = await g.ev(`const O = __LW.orbitals, f = __LW.field;
    __LW.clock.scrub(0); O.setOn(true);
    const t0 = O.state().t, g0 = f.stats.generation;
    __LW.togglePlay();
    await new Promise((r) => setTimeout(r, 700));
    const mid = { t: O.state().t, gen: f.stats.generation, playing: __LW.clock.playing };
    __LW.togglePlay();
    await new Promise((r) => setTimeout(r, 120));
    const end = { t: O.state().t, gen: f.stats.generation, playing: __LW.clock.playing, complex: f.moleculeComplex };
    O.setOn(false); __LW.clock.scrub(0);
    return { t0, g0, mid, end, rate: __LW.clock.rate, errs: window.__e.slice() };`);
  judge('L9 PLAY turns the register: t advances with the transport and every frame redispatches the volume',
    l9.t0 === 0 && l9.mid.playing === true && l9.mid.t > 0.5 && l9.end.playing === false
    && l9.mid.gen - l9.g0 >= 10 && l9.end.complex === true && l9.errs.length === 0,
    { t0: l9.t0, tAfter700ms: l9.mid.t, rate: l9.rate, dispatches: l9.mid.gen - l9.g0, stillComplex: l9.end.complex, errs: l9.errs });

  const errs = await g.ev('return { errs: window.__e.slice() };');
  judge('LZ no page error at any step', errs.errs.length === 0, errs.errs);
} catch (error) {
  judge('gate ran to the end', false, String(error && error.message || error).slice(0, 400));
} finally { await g.close(); }
process.exit(done('orbitals') ? 1 : 0);
