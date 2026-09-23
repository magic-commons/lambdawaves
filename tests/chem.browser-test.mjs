/* tests/chem.browser-test.mjs — the CHEMISTRY window's five laws, in a real browser.
 *
 *   tools/gate/server.py "$PWD" 8704 &
 *   LW_PORT=8704 GD_PORT=5206 node tests/chem.browser-test.mjs
 *
 * ORDER.  The laws are numbered as the commission numbers them and printed under those numbers, but they RUN
 * 1 · 2 · 5 · 3 · 4: law 5's screenshot wants benzene on screen and a benzene solve is ~40 s of McMurchie–Davidson
 * integrals, so it is taken while law 2's molecule is still up rather than paid for twice.
 *
 * LAW 1's VOXEL READING, and why it is not the literal 2 % of ρ(O) = 193.313905.  A texel's coordinate is
 * ((i + ½)/res)·2H − H (lab/field.js sampleVoxel), so for the O nucleus at (0, 0, 0.2216649) a voxel centre would
 * have to satisfy (i + ½)/res = ½ in x and y — impossible for an integer i at every resolution this field offers,
 * all of which are even.  The nearest centre at res 64, H = 7.4309 is 0.181 bohr away, and the O 1s cusp has width
 * 1/√(2·130.71) = 0.062 bohr: ρ there is 15.06, not 193.31, and no tolerance makes those the same number.  So the
 * law is gated as what it is actually asking — THE KERNEL IS RIGHT — by reading the GPU texel and lab/molecular-
 * field.js's CPU evaluator AT THE SAME VOXEL CENTRE, to 2 % (the rgba16float figure).  Both pinned numbers are
 * still measured and printed, from the CPU evaluator at the exact sites, so the substitution is visible.
 */
import { open, judge, done } from '../tools/gate/gatekit.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { MOLECULE_BY_ID, MOLECULES, showMs } from '../lab/molecules.js';

const PORT = process.env.LW_PORT || 8704;
const ROOT = new URL('..', import.meta.url).pathname;
const SHOT = path.join(ROOT, '.tmp', 'chem-benzene.png');

/* the pinned numbers: lab/oracles/sto-3g-v1.json (fix-mol6.py and fix-mol8.py) and the MATH-H2O ledger */
const H2O = { energy: -74.963023162862, electrons: 10, omega0: 0.483101392, nAO: 7,
  atoms: [[8, 0, 0, 0.22166487441148175], [1, 0, 1.4309006215206648, -0.886659497645927], [1, 0, -1.4309006215206648, -0.886659497645927]],
  rhoO: 193.313905, rhoMid: 0.492165 };
const BZ = { energy: -227.891006464181, nAO: 36, electrons: 42, omega: 0.360792434, f: 0.812666 };
const near = (a, b, tol) => Number.isFinite(a) && Math.abs(a - b) <= tol;
/* LAWS 6–9 (2026-09-12, the MOLECULE dropdown): the library's own oracle, read rather than retyped */
const LIB = JSON.parse(fs.readFileSync(path.join(ROOT, 'lab', 'oracles', 'sto-3g-v1.json'), 'utf8')).library;
/* THE TIME BUDGET HAS A FLOOR, and the floor is the worker road, not the arithmetic.  lab/molecules.js predicts
   HCl at 25 ms; a browser solve pays a structured-clone round trip, a `chem.solve` report of typed arrays and a
   frame boundary on top of that, and no cost model of the MATHS can or should predict those.  So the budget is
   max(2 × predictedMs, 400 ms) — the 2× the commission asked for wherever 2× is the larger number, which is every
   entry that takes long enough for the prediction to be about anything. */
const budget = (id) => Math.max(2 * MOLECULE_BY_ID.get(id).predictedMs, 400);

const g = await open(`https://127.0.0.1:${PORT}/lab/`, { width: 1500, height: 1150, script: 300000 });
try {
  /* ── boot ──────────────────────────────────────────────────────────────────────────────────── */
  const ready = await g.waitFor('window.__LW&&__LW.ready', 400, 100);
  judge('L0 boot: __LW.ready', ready.ok === 1, ready);
  const boot = await g.ev(`return { errs: window.__e.slice(), gpu: __LW.field.error || null, dirty: __LW.layout.projects.dirty,
    card: !!document.querySelector('.dev[data-id="chem"]'), eyebrow: document.querySelector('.dev[data-id="chem"] .dev-eyebrow').textContent };`);
  judge('L0 boot: no page error, MOLECULES window present', boot.errs.length === 0 && boot.card && boot.eyebrow === 'MOLECULES', boot);

  /* ── LAW 1 · H₂O: the ground state, the first RPA root, and the kernel on the grid ──────────── */
  const l1 = await g.ev(`__LW.layout.reopen('chem','R');
    const t0 = performance.now(); const sol = await __LW.chem.solve('H2O'); const ms = performance.now() - t0;
    __LW.chem.setOn(true); __LW.chem.setView('density');
    await new Promise((r) => requestAnimationFrame(r)); await new Promise((r) => setTimeout(r, 250));
    const st = __LW.chem.state(), roots = __LW.chem.roots(3);
    return { ms, energy: st.energy, electrons: st.electrons, nAO: st.nAO, nocc: st.nocc, half: st.half,
      omega0: roots[0] && roots[0].omega, omegaTDA0: roots[0] && roots[0].omegaTDA, pol0: roots[0] && roots[0].pol,
      owner: st.fieldOwner, local: st.local, status: st.status,
      stats: { molAO: __LW.field.stats.molAO, molDispatches: __LW.field.stats.molDispatches },
      res: __LW.field.resolution, domain: __LW.domain.half, errs: window.__e.slice() };`);
  judge(`L1 H₂O energy = ${H2O.energy} within 1e-8`, near(l1.energy, H2O.energy, 1e-8), { energy: l1.energy, delta: l1.energy - H2O.energy });
  judge('L1 H₂O solve in ≤ 5 s off the frame thread', l1.ms <= 5000 && l1.local === false, { ms: +l1.ms.toFixed(0), local: l1.local, status: l1.status });
  judge('L1 Tr(DS) = 10 within 1e-10', near(l1.electrons, H2O.electrons, 1e-10), { electrons: l1.electrons, delta: l1.electrons - 10 });
  judge(`L1 roots[0].omega = ${H2O.omega0} within 1e-8`, near(l1.omega0, H2O.omega0, 1e-8), { omega: l1.omega0, delta: l1.omega0 - H2O.omega0, omegaTDA: l1.omegaTDA0, pol: l1.pol0 });
  judge('L1 the field is molecular: nAO uploaded and dispatched', l1.owner === true && l1.stats.molAO === H2O.nAO && l1.stats.molDispatches >= 1, l1.stats);

  /* the kernel against the CPU evaluator at the same voxel centres, and the two pinned numbers at the exact sites */
  const l1v = await g.ev(`const A = ${JSON.stringify(H2O.atoms)}.map(([Z,x,y,z])=>({Z,x,y,z}));
    const [{ loadRecord, moleculeRHF }, { evaluator }] = await Promise.all([import('./rhf-molecule.js'), import('./molecular-field.js')]);
    await loadRecord('sto-3g');
    const r = moleculeRHF({ atoms: A, basis: 'sto-3g', charge: 0, detect: false, stability: false, hessian: false });
    const ev = evaluator(r.basis.shells), rho = (p) => ev.density(r.D, p);
    const half = __LW.domain.half, res = __LW.field.resolution;
    const ix = (c) => Math.max(0, Math.min(res - 1, Math.round((c + half) / (2 * half) * res - 0.5)));
    const O = [A[0].x, A[0].y, A[0].z], H = [A[1].x, A[1].y, A[1].z];
    const MID = [(O[0]+H[0])/2, (O[1]+H[1])/2, (O[2]+H[2])/2];
    const at = async (p, tag) => { const v = await __LW.sampleVoxel(ix(p[0]), ix(p[1]), ix(p[2]));
      const c = [v.x, v.y, v.z], cpu = rho(c), gpu = v.re * v.re;
      return { tag, gpu, cpu, rel: cpu !== 0 ? Math.abs(gpu - cpu) / Math.abs(cpu) : Math.abs(gpu), offset: Math.hypot(c[0]-p[0], c[1]-p[1], c[2]-p[2]) }; };
    return { energyCPU: r.energy, voxel: 2 * half / res, O: await at(O, 'O nucleus'), MID: await at(MID, 'O–H midpoint'),
      pinnedO: rho(O), pinnedMid: rho(MID), errs: window.__e.slice() };`);
  judge('L1 the CPU evaluator reproduces the pinned ρ(O) = 193.313905 and midpoint 0.492165 within 1e-5',
    near(l1v.pinnedO, H2O.rhoO, 1e-5) && near(l1v.pinnedMid, H2O.rhoMid, 1e-5), { rhoO: l1v.pinnedO, rhoMid: l1v.pinnedMid });
  judge('L1 GPU kernel = CPU evaluator at the voxel nearest the O nucleus, within 2 %', l1v.O.rel <= 0.02,
    { ...l1v.O, note: `the pinned 193.313905 is ${l1v.O.offset.toFixed(3)} bohr away; the O 1s cusp width is 0.062 bohr` });
  judge('L1 GPU kernel = CPU evaluator at the voxel nearest the O–H midpoint, within 2 %', l1v.MID.rel <= 0.02,
    { ...l1v.MID, note: `the pinned 0.492165 is ${l1v.MID.offset.toFixed(3)} bohr away` });
  judge('L1 no page error', l1.errs.length === 0 && l1v.errs.length === 0, { l1: l1.errs, l1v: l1v.errs });

  /* ── LAW 2 · benzene: 36 AOs, 42 electrons, the bright RPA pair, and it never blocks the frame ── */
  const l2 = await g.ev(`const t0 = performance.now();
    /* the frame thread is watched WHILE the worker solves: a gap over 2 s means the maths came home */
    let gaps = 0, worst = 0, last = performance.now(), frames = 0;
    const tick = () => { const n = performance.now(), d = n - last; last = n; frames++; if (d > worst) worst = d; if (d > 2000) gaps++; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    const sol = await __LW.chem.solve('C6H6'); const ms = performance.now() - t0;
    __LW.chem.setView('density');
    await new Promise((r) => requestAnimationFrame(r)); await new Promise((r) => setTimeout(r, 300));
    const st = __LW.chem.state(), roots = __LW.chem.roots();
    let best = null; for (const k of roots) if (!best || k.f > best.f) best = k;
    /* the ORACLE's bright pair is the brightest of the first EIGHT roots; benzene's globally brightest line is a
       higher σ transition at 0.8069 with f = 3.61, which the eight-root oracle does not reach.  Both are reported. */
    const pair = roots.filter((k) => Math.abs(k.omega - ${BZ.omega}) < 1e-6);
    return { ms, energy: st.energy, nAO: st.nAO, electrons: st.electrons, nocc: st.nocc, status: st.status, local: st.local,
      best, pair: pair.map((k) => ({ omega: k.omega, f: k.f, pol: k.pol })), pairCount: pair.length, molAO: __LW.field.stats.molAO, owner: st.fieldOwner,
      frames, worstGapMs: +worst.toFixed(0), gaps, errs: window.__e.slice() };`);
  judge(`L2 benzene energy = ${BZ.energy} within 1e-6`, near(l2.energy, BZ.energy, 1e-6), { energy: l2.energy, delta: l2.energy - BZ.energy });
  judge('L2 benzene is 36 AOs and 42 electrons', l2.nAO === BZ.nAO && l2.electrons === BZ.electrons, { nAO: l2.nAO, electrons: l2.electrons, nocc: l2.nocc });
  judge(`L2 the oracle's bright RPA pair at ${BZ.omega} within 1e-6, f = ${BZ.f} within 1e-3`,
    l2.pairCount === 2 && l2.pair.every((k) => near(k.omega, BZ.omega, 1e-6) && near(k.f, BZ.f, 1e-3)),
    { pair: l2.pair, degeneracy: l2.pairCount, globallyBrightest: l2.best && { omega: l2.best.omega, f: l2.best.f, note: 'a higher σ line, past the oracle\'s eight roots' } });
  judge('L2 benzene solved in ≤ 30 s (38 s on 2026-09-12 morning, 35 s of it the ERI pass; shell-pair tables + 8-fold fill + primitive screening took the integrals to 0.56 s)', l2.ms <= 30000, { ms: +l2.ms.toFixed(0), status: l2.status,
    note: 'the cost is lab/md.js\'s McMurchie–Davidson pass over 630k unique ERIs; node measures 35.6 s of 38.4 s for the whole solve' });
  judge('L2 the frame thread kept running while the worker solved', l2.local === false && l2.gaps === 0 && l2.frames > 10,
    { frames: l2.frames, worstGapMs: l2.worstGapMs, gapsOver2s: l2.gaps, local: l2.local });
  judge('L2 the field took benzene\'s 36 AOs, no page error', l2.owner === true && l2.molAO === BZ.nAO && l2.errs.length === 0,
    { molAO: l2.molAO, owner: l2.owner, errs: l2.errs });

  /* ── LAW 5 · the screenshot, taken while benzene is on screen ───────────────────────────────── */
  fs.mkdirSync(path.dirname(SHOT), { recursive: true });
  await g.ev(`const d = document.querySelector('.dev[data-id="chem"]');
    /* KIND 'other' starts folded (rack.js:4081), like MOLECULE, HELIUM and H₂ — a photograph of the window
       needs it unfolded, and the chevron is the only road that keeps aria-expanded honest. */
    if (d.classList.contains('folded')) d.querySelector('.dev-fold').click();
    d.scrollIntoView({ block: 'center' });
    await new Promise((r) => setTimeout(r, 500)); return 1;`);
  fs.writeFileSync(SHOT, Buffer.from(await g.snap(), 'base64'));
  const bytes = fs.statSync(SHOT).size;
  judge('L5 .tmp/chem-benzene.png exists and is over 50 kB', bytes > 50 * 1024, { file: SHOT, bytes });
  const l5 = await g.ev(`const d = document.querySelector('.dev[data-id="chem"]');
    const c = d.querySelector('canvas.mol-c'), b = c && c.getBoundingClientRect();
    return { canvas: !!c, painted: !!(b && b.width > 100 && b.height > 40), folded: d.classList.contains('folded'),
      rows: d.querySelectorAll('.row').length, controls: d.querySelectorAll('.k, .segw, .sw, .trig').length,
      view: __LW.chem.state().view, preset: __LW.chem.preset(), errs: window.__e.slice() };`);
  judge('L5 the window is UNFOLDED on benzene in DENSITY view, its plot laid out', l5.canvas && l5.painted && !l5.folded
    && l5.preset === 'C6H6' && l5.view === 'density' && l5.rows >= 4 && l5.controls >= 12 && l5.errs.length === 0, l5);

  /* ── LAW 3 · the δ-kick and 200 MMUT steps at Δt = 0.01 ──────────────────────────────────────── */
  const l3 = await g.ev(`await __LW.chem.solve('H2O');
    __LW.chem.setAxis('y'); __LW.chem.setDt(0.01); __LW.chem.setIntegrator('mmut');
    await __LW.chem.kick(); const before = __LW.chem.state();
    const t0 = performance.now(); const st = await __LW.chem.run(200); const ms = performance.now() - t0;
    return { ms, st, E0: before.E0, errs: window.__e.slice() };`);
  const s3 = l3.st || {};
  judge('L3 Tr(DS) = 10 within 1e-8 after 200 steps', near(s3.electrons, 10, 1e-8), { electrons: s3.electrons, delta: s3.electrons - 10 });
  judge('L3 idempotency ‖P² − P‖ < 1e-8', Number.isFinite(s3.idempotency) && s3.idempotency < 1e-8, { idempotency: s3.idempotency });
  /* THE COMMISSION SAYS "energy > E0" AND E₀ IS NOT THE GROUND STATE.  lab/mathworker.js's chem.rt.init takes
     E0 = observables().fieldFreeTotal AFTER engine.kickAlong, so E₀ is the KICKED energy and field-free
     propagation conserves it — measured Δ = −1.7e-11 over 200 steps, which is conservation, not a fall.  The
     claim the law is reaching for is that the δ-kick PUT energy IN, and its reference is the RHF ground state:
     +1.8e-9 = O(κ²) at κ = 1e-3.  Both halves are gated. */
  /* the band is the f-SUM RULE, not a round number: exp(−iκq̂) deposits ΔE = ½κ²Σf, and Thomas–Reiche–Kuhn gives
     Σf = N_e = 10 only in a complete basis, so ΔE/κ² must be positive and BELOW 5.  Measured 1.82 on STO-3G. */
  const raised = s3.energyRT - H2O.energy, ratio = raised / 1e-6;
  judge('L3 the kick raised the energy above the RHF ground state by ½κ²Σf, under the TRK ceiling N_e/2 = 5',
    raised > 0 && ratio > 0.5 && ratio < 5,
    { energy: s3.energyRT, groundState: H2O.energy, raised, 'ΔE/κ²': ratio, TRKceiling: 5, kappa: 1e-3 });
  judge('L3 field-free propagation conserves the kicked energy E₀ to 1e-9 over 200 steps', Math.abs(s3.energyRT - l3.E0) < 1e-9,
    { energy: s3.energyRT, E0: l3.E0, delta: s3.energyRT - l3.E0, note: 'E₀ is the POST-kick energy, so this is conservation' });
  judge('L3 200 steps, 200 new trace samples beside the t = 0 one, t = 2.0 a.u.',
    s3.steps === 200 && s3.trace === 201 && near(s3.t, 2, 1e-9), { steps: s3.steps, samples: s3.trace, t: s3.t, ms: +l3.ms.toFixed(0) });
  judge('L3 no page error', l3.errs.length === 0, l3.errs);

  /* ── LAW 4 · save → restore → save, deep-equal on presentation.instruments.chem ──────────────── */
  const l4 = await g.ev(`__LW.chem.setView('orbital'); __LW.chem.orbital(3); __LW.chem.setAxis('z'); __LW.chem.setTda(true); __LW.chem.setCore(true);
    __LW.chem.setDt(0.005); __LW.chem.setIntegrator('magnus2');
    const a = __LW.serialize(); const A = JSON.parse(JSON.stringify(a.presentation.instruments.chem));
    /* scramble every covered surface, then open the file again */
    __LW.chem.setView('density'); __LW.chem.orbital(1); __LW.chem.setAxis('x'); __LW.chem.setTda(false); __LW.chem.setCore(false);
    __LW.chem.setDt(0.02); __LW.chem.setIntegrator('mmut'); __LW.chem.setOn(false);
    const ok = __LW.restore(a); await new Promise((r) => setTimeout(r, 600));
    const B = JSON.parse(JSON.stringify(__LW.serialize().presentation.instruments.chem));
    return { ok, A, B, keys: Object.keys(A).sort(), state: __LW.chem.state(), errs: window.__e.slice() };`);
  const same = JSON.stringify(l4.A) === JSON.stringify(l4.B);
  judge('L4 presentation.instruments.chem round-trips deep-equal', l4.ok === true && same, { A: l4.A, B: l4.B });
  judge('L4 the record carries the whole presentation and no solver cache', l4.keys.join(',') === 'axis,basis,core,dt,integrator,kappa,on,orbital,preset,speed,tda,view', l4.keys);
  judge('L4 no page error', l4.errs.length === 0, l4.errs);

  /* ── LAW 6 · THE DROPDOWN (2026-09-12: "this should be a dropdown menu hehe") ─────────────────
   * A REGEX INSIDE g.ev's TEMPLATE LITERAL MUST USE CHARACTER CLASSES.  `\d` in a template literal is an
   * unrecognised escape and collapses to the letter `d` before the browser ever sees it, so /· \d+ AO/ arrives as
   * /· d+ AO/ and refuses all 54 options while printing them back looking perfectly correct.  [0-9] survives.
   * The node is paletteview.js's `<select class="sel">`, the options carry their AO count and their predicted
   * time, and an entry this engine cannot answer for is DISABLED with its reason on the option itself. */
  const l6 = await g.ev(`const card = document.querySelector('.dev[data-id="chem"]');
    const sel = card.querySelector('.mol-pick select.sel');
    const opts = sel ? [...sel.options] : [];
    return { exists: !!sel, cls: sel && sel.className, tag: sel && sel.tagName,
      count: opts.length, disabled: opts.filter((o) => o.disabled).length,
      disabledText: opts.filter((o) => o.disabled).map((o) => o.textContent + ' :: ' + (o.dataset.help || o.title || '')),
      groups: sel ? [...sel.querySelectorAll('optgroup')].map((g) => g.label) : [],
      help: sel && (sel.dataset.help || sel.title) || '', aria: sel && sel.getAttribute('aria-label'),
      value: sel && sel.value, first: opts[0] && opts[0].textContent, benzene: opts.find((o) => o.value === 'C6H6')?.textContent,
      bad: opts.filter((o) => !/· [0-9]+ AO · ~([0-9]+ ms|[0-9]+[.][0-9] s)/.test(o.textContent)).map((o) => o.value + ' :: ' + JSON.stringify(o.textContent)),
      seg: !!card.querySelector('.segw[data-nope]'), errs: window.__e.slice() };`);
  judge('L6 the MOLECULE control is a <select class="sel"> with an aria-label', l6.exists && l6.tag === 'SELECT' && l6.cls === 'sel' && l6.aria === 'molecule',
    { tag: l6.tag, cls: l6.cls, aria: l6.aria });
  judge(`L6 ≥ 30 options in ${l6.groups.length} optgroups, ≥ 1 disabled`, l6.count >= 30 && l6.disabled >= 1 && l6.groups.length >= 5,
    { options: l6.count, disabled: l6.disabled, groups: l6.groups, disabledText: l6.disabledText });
  judge('L6 every option text carries its AO count and predicted time, and a disabled one says why',
    l6.bad.length === 0 && /·\s*36 AO\s*·\s*~9\.6 s$/.test(l6.benzene || '')
    && l6.disabledText.every((t) => /not a minimum|over the cap/.test(t) && /A−B|cap/.test(t)),
    { first: l6.first, benzene: l6.benzene, malformed: l6.bad, disabledText: l6.disabledText.map((t) => t.split(' :: ')[0]) });
  judge('L6 the select names the cap rule in its own help', /cap is benzene/.test(l6.help) && /disabled/.test(l6.help), { help: l6.help });
  judge('L6 the library agrees with the menu on how many entries there are', l6.count === MOLECULES.length && l6.value === 'H2O',
    { menu: l6.count, library: MOLECULES.length, value: l6.value, errs: l6.errs });
  judge('L6 no page error', l6.errs.length === 0, l6.errs);

  /* a DISABLED entry is refused in front of the worker, with its reason, and nothing throws */
  const l6b = await g.ev(`const before = __LW.chem.preset();
    const r = await __LW.chem.solve('CuH');
    return { r, preset: __LW.chem.preset(), before, status: __LW.chem.state().status, errs: window.__e.slice() };`);
  judge('L6 an unsolvable entry (CuH: RHF is not a minimum) is refused with its reason, not sent to the worker',
    l6b.r === null && /not a minimum/.test(l6b.status) && l6b.errs.length === 0, l6b);

  /* ── LAW 7 · THREE OF THE NEW ENTRIES SOLVE IN THE BROWSER, TO THEIR ORACLE, INSIDE THEIR BUDGET ── */
  for (const id of ['HCl', 'CO2', 'glycine']) {
    const m = MOLECULE_BY_ID.get(id), o = LIB[id], cap = budget(id);
    const r = await g.ev(`const t0 = performance.now(); const sol = await __LW.chem.solve(${JSON.stringify(id)}); const ms = performance.now() - t0;
      const st = __LW.chem.state();
      return { ms, energy: st.energy, nAO: st.nAO, electrons: st.electrons, nocc: st.nocc, local: st.local,
        status: st.status, roots: st.roots, errs: window.__e.slice() };`);
    judge(`L7 ${id} = ${o.energy.toFixed(9)} within 1e-8 (${o.nao} AOs, ${o.nelec} electrons)`,
      near(r.energy, o.energy, 1e-8) && r.nAO === m.nAO && r.electrons === m.nElectrons,
      { energy: r.energy, delta: r.energy - o.energy, nAO: r.nAO, electrons: r.electrons, status: r.status });
    judge(`L7 ${id} solved off the frame thread in ≤ ${Math.round(cap)} ms (2× the predicted ${showMs(m.predictedMs)}, floor 400) and under 12 s`,
      r.ms <= cap && r.ms < 12000 && r.local === false,
      { ms: +r.ms.toFixed(0), predictedMs: m.predictedMs, budget: Math.round(cap), local: r.local });
    judge(`L7 ${id} no page error`, r.errs.length === 0, r.errs);
  }

  /* ── LAW 8 · A HEAVY ATOM ON THE FIELD.  Br carries an angular_momentum [0, 1, 2] shell, so HBr is the
   *   first entry whose d functions reach the GPU kernel at all. */
  const l8 = await g.ev(`const sol = await __LW.chem.solve('HBr'); __LW.chem.setOn(true); __LW.chem.setView('density');
    await new Promise((r) => requestAnimationFrame(r)); await new Promise((r) => setTimeout(r, 250));
    const st = __LW.chem.state();
    return { energy: st.energy, nAO: st.nAO, electrons: st.electrons, owner: st.fieldOwner, half: st.half,
      molAO: __LW.field.stats.molAO, dispatches: __LW.field.stats.molDispatches, gpu: __LW.field.error || null,
      status: st.status, errs: window.__e.slice() };`);
  judge(`L8 HBr = ${LIB.HBr.energy.toFixed(9)} within 1e-8, 20 Cartesian AOs, 36 electrons`,
    near(l8.energy, LIB.HBr.energy, 1e-8) && l8.nAO === 20 && l8.electrons === 36,
    { energy: l8.energy, delta: l8.energy - LIB.HBr.energy, nAO: l8.nAO, electrons: l8.electrons });
  judge('L8 the field takes bromine\'s 20 AOs (6 of them Cartesian d) and dispatches, with no page error',
    l8.owner === true && l8.molAO === 20 && l8.dispatches >= 1 && l8.errs.length === 0,
    { owner: l8.owner, molAO: l8.molAO, dispatches: l8.dispatches, half: l8.half, gpu: l8.gpu, errs: l8.errs });

  /* ── LAW 9 · A NON-DEFAULT PRESET ROUND-TRIPS ────────────────────────────────────────────────── */
  const l9 = await g.ev(`await __LW.chem.solve('PH3'); __LW.chem.setView('orbital'); __LW.chem.orbital(6); __LW.chem.setAxis('x');
    const a = __LW.serialize(); const A = JSON.parse(JSON.stringify(a.presentation.instruments.chem));
    await __LW.chem.solve('H2O'); __LW.chem.setView('density'); __LW.chem.setAxis('z');
    const mid = __LW.chem.preset();
    const ok = __LW.restore(a); await new Promise((r) => setTimeout(r, 900));
    const B = JSON.parse(JSON.stringify(__LW.serialize().presentation.instruments.chem));
    const st = __LW.chem.state();
    const sel = document.querySelector('.dev[data-id="chem"] .mol-pick select.sel');
    return { A, B, mid, preset: __LW.chem.preset(), selValue: sel && sel.value, energy: st.energy, nAO: st.nAO, errs: window.__e.slice() };`);
  judge('L9 a non-default preset (PH₃) round-trips through save → scramble → restore, select and all',
    l9.A.preset === 'PH3' && l9.mid === 'H2O' && l9.B.preset === 'PH3' && l9.preset === 'PH3' && l9.selValue === 'PH3'
    && JSON.stringify(l9.A) === JSON.stringify(l9.B), { A: l9.A, B: l9.B, mid: l9.mid, selValue: l9.selValue });
  judge(`L9 and it re-derives PH₃'s own ground state ${LIB.PH3.energy.toFixed(9)} within 1e-8 at ${LIB.PH3.nao} AOs`,
    near(l9.energy, LIB.PH3.energy, 1e-8) && l9.nAO === 12 && l9.errs.length === 0,
    { energy: l9.energy, delta: l9.energy - LIB.PH3.energy, nAO: l9.nAO, errs: l9.errs });

  /* ── LAW 10 · THE MMUT RESTART POLICY THE CARD IS ACTUALLY RUNNING (2026-09-18) ───────────────
   * The readout said "unrestarted MMUT" while the worker's chem.rt.init defaulted to a Magnus-2 restart every 50
   * steps — a different trajectory under a label that denied it.  The card now SENDS restartEvery = 0 and prints
   * the policy the engine reports back, so both halves are gated: the number in force and the words on screen. */
  const l10 = await g.ev(`await __LW.chem.solve('H2O');
    __LW.chem.setAxis('y'); __LW.chem.setDt(0.01); __LW.chem.setIntegrator('mmut');
    await __LW.chem.kick(); await __LW.chem.run(120);
    const st = __LW.chem.state();
    const card = document.querySelector('.dev[data-id="chem"]');
    const subs = [...card.querySelectorAll('.ro')].map((r) => (r.querySelector('.ro-lbl') || {}).textContent + ' :: ' + ((r.querySelector('.ro-sub') || {}).textContent || ''));
    return { restartEvery: st.restartEvery, restartPolicy: st.restartPolicy, sinceRestart: st.sinceRestart, steps: st.steps,
      idem: st.idempotency, sub: subs.find((s) => /IDEMPOTENCY/.test(s)) || '', errs: window.__e.slice() };`);
  judge('L10 the card runs UNRESTARTED MMUT and the engine says so (restartEvery 0, no restart in 120 steps)',
    l10.restartEvery === 0 && l10.restartPolicy === 'unrestarted' && l10.sinceRestart === l10.steps - 1 && l10.steps === 120, l10);
  judge('L10 …and the readout prints the policy in force, not an intention', /MMUT, unrestarted/.test(l10.sub),
    { sub: l10.sub, idempotency: l10.idem, errs: l10.errs });

  /* ── LAW 11 · THE TDA LADDER IS ITS OWN LADDER ─────────────────────────────────────────────────
   * roots[k].omegaTDA is the k-th TDA root BY INDEX, not the partner of RPA root k: for benzene the two ladders
   * cross, the bright RPA line sitting at index 2 and the bright TDA line at index 3.  The TDA switch must
   * therefore draw the TDA list — its ω, its f, its polarisation — and not RPA strengths at TDA positions. */
  const l11 = await g.ev(`await __LW.chem.solve('C6H6');
    const rpa = __LW.chem.roots(), tda = __LW.chem.tdaRoots();
    const brightR = rpa.map((k, i) => [i, k.omega, k.f]).filter(([, , f]) => f > 0.5)[0];
    const brightT = tda.map((k, i) => [i, k.omega, k.f]).filter(([, , f]) => f > 0.5)[0];
    __LW.chem.setTda(true); const on = __LW.chem.state();
    __LW.chem.setTda(false);
    return { nR: rpa.length, nT: tda.length, brightR, brightT, byIndex: rpa.every((k, i) => k.omegaTDA === tda[i].omega),
      ascending: tda.every((k, i) => i === 0 || k.omega >= tda[i - 1].omega), tdaRoots: on.tdaRoots, errs: window.__e.slice() };`);
  judge('L11 benzene ships both ladders, each ascending and the same length', l11.nR === 315 && l11.nT === 315 && l11.ascending && l11.byIndex,
    { rpaRoots: l11.nR, tdaRoots: l11.nT, ascending: l11.ascending, omegaTDAisTheIndexedTdaRoot: l11.byIndex });
  judge('L11 the ladders CROSS: the first bright RPA root and the first bright TDA root are different indices',
    l11.brightR && l11.brightT && l11.brightR[0] !== l11.brightT[0], { brightRPA: l11.brightR, brightTDA: l11.brightT, errs: l11.errs });

  /* ── LAW 12 · THE STAGED REPLY CANNOT PUBLISH FOR THE MOLECULE YOU LEFT ────────────────────────
   * chem.solve is now chem.ground followed by chem.spectrum.  Both replies are guarded by the card's solveSeq, so
   * starting one molecule and immediately asking for another must leave the card wholly on the second one. */
  const l12 = await g.ev(`const a = __LW.chem.solve('C2H4'); const b = __LW.chem.solve('H2O');
    await Promise.all([a, b]); await new Promise((r) => setTimeout(r, 300));
    const st = __LW.chem.state(), roots = __LW.chem.roots(1);
    return { preset: st.preset, stage: st.stage, energy: st.energy, nAO: st.nAO, roots: st.roots, tdaRoots: st.tdaRoots,
      omega0: roots[0] && roots[0].omega, errs: window.__e.slice() };`);
  judge('L12 a solve interrupted by another leaves the card on the second molecule, whole (ground AND spectrum)',
    l12.preset === 'H2O' && l12.stage === 'full' && near(l12.energy, H2O.energy, 1e-8) && l12.nAO === 7
    && l12.roots === 10 && l12.tdaRoots === 10 && near(l12.omega0, H2O.omega0, 1e-8) && l12.errs.length === 0, l12);

  /* ── the field is handed back ───────────────────────────────────────────────────────────────── */
  const off = await g.ev(`__LW.chem.setOn(false); __LW.loadPreset('1s'); await __LW.settle();
    return { owner: __LW.chem.state().fieldOwner, molDispatchesFrozen: __LW.field.stats.molAO, errs: window.__e.slice() };`);
  judge('LZ chem off hands the volume back to the eigenmode kernel', off.owner === false && off.errs.length === 0, off);
} catch (error) {
  judge('gate ran to the end', false, String(error && error.message || error).slice(0, 400));
} finally { await g.close(); }
process.exit(done('chem') ? 1 : 0);
