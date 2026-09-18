/* molecular-diff.browser-test.mjs — THE SIGNED ROAD, measured against the road it replaces.
 *
 *   tools/gate/server.py "$PWD" 8712 &
 *   LW_PORT=8712 GD_PORT=5212 node tests/molecular-diff.browser-test.mjs
 *
 * WHAT WAS WRONG.  CHEMISTRY's DIFF view subtracted two rgba16float volumes that each stored √ρ.  An 11-bit
 * mantissa on √ρ is about 1e-3 relative on ρ, and a δ-kick at the card's own κ moves ρ by 1e-3 (κ = 1e-3) to
 * 1e-4 (κ = 1e-4) relative — so the picture was at best the size of the format's own noise and at worst ten
 * times under it.  The repair forms ΔD = Re D(t) − D_ref on the CPU and uploads it ONCE as a signed matrix
 * (field.js kernel kind 3), so the quantisation lands on the difference and not on the two large densities.
 *
 * WHAT IS MEASURED HERE, and it is a number and not an assertion: the same physical state — H₂O, a y δ-kick,
 * 20 unrestarted MMUT steps at Δt = 0.01 — read both ways at the same voxels, against lab/molecular-field.js's
 * CPU evaluator applied to the very ΔD that is uploaded.  The old road's Δρ is reconstructed exactly as the
 * fragment shader forms it: ρ(t) and ρ_ref are each rendered into the volume, read back as the f16 texels the
 * shader samples, and subtracted.
 *
 * THE RT STATE IS BUILT IN NODE, by lab/mathworker.js's own exported chem.rt functions — the same engine the
 * worker runs — so there is no transfer, no timing and no second implementation between the physics and the
 * reference.  The page is asked only to render.
 *
 * WHY THE APP'S OWN LOOP CANNOT SPOIL THIS (the same reason tests/field-molecule.browser-test.mjs is safe): the
 * lab is idle and paused, so rack.js schedules PRESENT and never RECONSTRUCT, and field.frame() is handed a null
 * `modes` — the eigenmode kernel writes nothing between these readbacks.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { open, judge, done } from '../tools/gate/gatekit.mjs';
import { moleculeRHF, registerRecord } from '../lab/rhf-molecule.js';
import { evaluator, fieldShells } from '../lab/molecular-field.js';
import { chemRegister, chemRtInit, chemRtRun } from '../lab/mathworker.js';
import { basisFrom, ANGSTROM } from '../lab/md.js';
import { VIEW } from '../lab/field.js';

const PORT = process.env.LW_PORT || 8712;
const RES = 96, STEPS = 20, DT = 0.01, KAPPAS = [1e-3, 1e-4];
const record = JSON.parse(readFileSync(new URL('../lab/vendor/bse/sto-3g-v1.json', import.meta.url), 'utf8'));
registerRecord('sto-3g', record); chemRegister('sto-3g', record);

/* ── the molecule, its field spec, and the box the worker itself would ask for ─────────────────────────────── */
const atoms = [[8, 0, 0, 0.22166487441148175], [1, 0, 1.4309006215206648, -0.886659497645927],
  [1, 0, -1.4309006215206648, -0.886659497645927]].map(([Z, x, y, z]) => ({ Z, x, y, z }));
const sol = moleculeRHF({ atoms, basis: 'sto-3g', detect: false, stability: false, hessian: false });
const nAO = sol.basis.n, ev = evaluator(sol.basis.shells);
const HALF = atoms.reduce((s, a) => Math.max(s, Math.abs(a.x), Math.abs(a.y), Math.abs(a.z)), 0) + 6;
const flat = (shells) => shells.map((s) => ({ center: s.center, l: s.l, ao: s.ao,
  prims: s.prims.map((p) => ({ alpha: p.alpha, w: Array.from(p.w) })) }));
const SHELLS = flat(fieldShells(sol.basis));
const centre = (i) => (i + 0.5) / RES * 2 * HALF - HALF;

/** the half-precision grid, round-to-nearest: what an rgba16float texel can hold of a number */
function f16round(x) {
  const a = Math.abs(Math.fround(x));
  if (!(a > 0)) return 0;
  const step = Math.pow(2, Math.max(-24, Math.floor(Math.log2(a)) - 10));
  return Math.sign(x) * Math.round(a / step) * step;
}
const L2 = (a) => Math.sqrt(a.reduce((s, v) => s + v * v, 0));
const relL2 = (got, want) => L2(got.map((v, i) => v - want[i])) / L2(want);
/* THE ERROR THAT MATTERS IS SCALED BY THE PEAK, not by each voxel's own value: the presenter divides the whole
   volume by ampMax = max |Δρ| before it draws anything, so max |gpu − cpu| / peak IS the visible error.  A
   per-voxel relative error is meaningless in the tail of a field whose texels are absolute — see L4's note. */
const maxOverPeak = (got, want, peak) => Math.max(...got.map((v, i) => Math.abs(v - want[i]))) / peak;

/* ── the states: one δ-kick per κ, twenty unrestarted MMUT steps, the two AO matrices the card would upload ── */
const cases = KAPPAS.map((kappa) => {
  const i0 = chemRtInit({ atoms, basis: 'sto-3g', charge: 0, dt: DT, integrator: 'mmut', kick: { axis: 'y', kappa }, restartEvery: 0 });
  const r1 = chemRtRun({ steps: STEPS });
  const ref = i0.D_re, now = r1.D_re;                    // Float32Array(nAO²), exactly what the worker puts on the wire
  /* chemview forms ΔD in f64 from those two and uploads it as f32 — so this IS the uploaded matrix */
  const dD = new Float32Array(nAO * nAO);
  for (let i = 0; i < nAO * nAO; i++) dD[i] = now[i] - ref[i];
  let dMax = 0, dNorm = 0, rNorm = 0;
  for (let i = 0; i < nAO * nAO; i++) { dMax = Math.max(dMax, Math.abs(dD[i])); dNorm += dD[i] * dD[i]; rNorm += ref[i] * ref[i]; }
  return { kappa, t: r1.t, ref: Array.from(ref), now: Array.from(now), dD: Array.from(dD),
    relMatrix: Math.sqrt(dNorm / rNorm), dMax, electrons: r1.electrons, idempotency: r1.idempotency };
});

/* ── the probes: twelve voxels spanning the difference, chosen on the CPU before the GPU is asked ──────────── */
const STRIDE = 3;
function probesFor(dD) {
  const D = Float64Array.from(dD), all = [];
  for (let i = 1; i < RES; i += STRIDE) for (let j = 1; j < RES; j += STRIDE) for (let k = 1; k < RES; k += STRIDE) {
    const p = [centre(i), centre(j), centre(k)], v = ev.density(D, p);
    if (Math.abs(v) > 0) all.push({ i, j, k, p, cpu: v });
  }
  all.sort((a, b) => Math.abs(b.cpu) - Math.abs(a.cpu));
  const peak = Math.abs(all[0].cpu), band = all.filter((q) => Math.abs(q.cpu) >= peak / 100);
  const pick = [];
  for (let n = 0; n < 6; n++) pick.push(all[n]);                                       // the six strongest lobes
  for (let n = 1; n <= 6; n++) pick.push(band[Math.round((band.length - 1) * n / 6)]);  // and six down two decades
  return pick.filter(Boolean);
}
for (const c of cases) c.probes = probesFor(c.dD);

/* benzene, for the frame cost of a signed product against a density one: the matrix is a symmetric stand-in
   (Kac–Murdock–Szegő), because the kernel's cost is set by nAO and the shells and never by the values */
const rCC = 1.39 * ANGSTROM, rCH = (1.39 + 1.09) * ANGSTROM, bz = [];
for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; bz.push({ Z: 6, x: rCC * Math.cos(a), y: rCC * Math.sin(a), z: 0 }); }
for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; bz.push({ Z: 1, x: rCH * Math.cos(a), y: rCH * Math.sin(a), z: 0 }); }
const bzBasis = basisFrom(bz, record, { cart: true }), bzN = bzBasis.n, bzD = new Float64Array(bzN * bzN);
for (let i = 0; i < bzN; i++) for (let j = 0; j < bzN; j++) bzD[i * bzN + j] = Math.exp(-0.5 * Math.abs(i - j)) * (i > j ? -1 : 1);

const payload = { half: HALF, res: RES, nAO, shells: SHELLS,
  cases: cases.map((c) => ({ kappa: c.kappa, ref: c.ref, now: c.now, dD: c.dD, probes: c.probes.map((p) => [p.i, p.j, p.k]) })),
  bz: { nAO: bzN, shells: flat(fieldShells(bzBasis)), D: Array.from(bzD) } };

const g = await open(`https://127.0.0.1:${PORT}/lab/`, { width: 1200, height: 900, script: 300000 });
try {
  const ready = await g.waitFor('window.__LW&&__LW.ready', 400, 100);
  judge('L0 boot: __LW.ready', ready.ok === 1, ready);

  const R = await g.ev(`
    const P = arguments[0], f = __LW.field;
    if (!f.ok) return { skip: f.error || 'no WebGPU adapter' };
    f.setResolution(P.res);
    f.setMolecule({ nAO: P.nAO, half: P.half, shells: P.shells });
    const out = { cases: [], perf: {}, errs: [] };
    const read = async (ijk) => { const v = await f.sampleVoxel(ijk[0], ijk[1], ijk[2]); return [v.re, v.im]; };
    for (const c of P.cases) {
      const row = { kappa: c.kappa, signed: [], im: [], refRoot: [], nowRoot: [] };
      /* THE NEW ROAD: one signed matrix, one volume, the texel IS Δρ */
      f.setMoleculeMatrix(new Float32Array(c.dD), { kind: 'signed' });
      f.reconstructMolecule();
      row.info = f.moleculeInfo; row.stats = await f.readStats();
      for (const ijk of c.probes) { const [re, im] = await read(ijk); row.signed.push(re); row.im.push(im); }
      /* and the SIGN LAW of the workgroup reduction: −ΔD must give the same max, which a max over the VALUE
         (rather than over |value|) could not — the extreme lobe of this field is negative */
      f.setMoleculeMatrix(Float32Array.from(c.dD, (v) => -v), { kind: 'signed' });
      f.reconstructMolecule();
      row.negStats = await f.readStats();
      row.neg = (await read(c.probes[0]))[0];
      /* THE OLD ROAD: two √ρ volumes, subtracted as the fragment shader subtracts them */
      f.setMoleculeMatrix(new Float32Array(c.ref), { kind: 'density' });
      f.reconstructMolecule();
      for (const ijk of c.probes) row.refRoot.push((await read(ijk))[0]);
      f.setMoleculeMatrix(new Float32Array(c.now), { kind: 'density' });
      f.reconstructMolecule();
      for (const ijk of c.probes) row.nowRoot.push((await read(ijk))[0]);
      out.cases.push(row);
    }
    /* the frame cost of the two kinds, on the same benzene volume and the same matrix: INTERLEAVED and taken
       three times each, best of three.  One reading of a warming, shared GPU is not a comparison — the spread
       between two readings of the SAME kind runs to 40 % on this machine while the whole gate is running. */
    f.setMolecule({ nAO: P.bz.nAO, half: P.half, shells: P.bz.shells });
    const runs = { density: [], signed: [] };
    for (let k = 0; k < 3; k++) for (const kind of ['density', 'signed']) {
      f.setMoleculeMatrix(new Float32Array(P.bz.D), { kind });
      f.reconstructMolecule();
      runs[kind].push(await f.moleculeThroughput({ n: 500 }));
    }
    for (const kind of ['density', 'signed']) {
      out.perf[kind] = runs[kind].reduce((a, b) => (b.msPerDispatch < a.msPerDispatch ? b : a));
      out.perf[kind].both = runs[kind].map((r) => r.msPerDispatch);
    }
    out.gpuError = f.lastGpuError || null;
    out.shaderErrors = (f.shaderMessages || []).filter((m) => m.type === 'error');
    f.setMolecule(null);
    out.errs = window.__e.slice();
    return out;`, [payload]);
  assert.ok(R && !R.E, `the page call threw: ${R && R.E}`);
  if (R.skip) { console.log('SKIP molecular-diff: ' + R.skip); }
  else {
    judge('L1 no GPU validation error and no page error after the signed dispatches',
      R.gpuError === null && R.shaderErrors.length === 0 && R.errs.length === 0,
      { gpuError: R.gpuError, shaderErrors: R.shaderErrors, pageErrors: R.errs });

    for (let ci = 0; ci < cases.length; ci++) {
      const c = cases[ci], row = R.cases[ci], tag = `κ = ${c.kappa.toExponential(0)}`;
      const cpu = c.probes.map((p) => p.cpu);
      const q16 = cpu.map(f16round);                                   // what an rgba16float texel can hold at all
      const gotNew = row.signed, gotOld = row.nowRoot.map((v, i) => v * v - row.refRoot[i] * row.refRoot[i]);

      judge(`L2 ${tag}: the signed volume is the signed kernel kind, real, and its texel carries no imaginary part`,
        row.info.kind === 'signed' && row.info.complex === false && row.im.every((v) => v === 0),
        { kind: row.info.kind, complex: row.info.complex, imaginary: row.im });

      judge(`L3 ${tag}: the workgroup max reduces max |value| — negating the matrix leaves stats[0] unchanged`,
        row.negStats.rhoMax === row.stats.rhoMax && Math.abs(row.neg + gotNew[0]) < 1e-9 * Math.abs(gotNew[0]) + 1e-12,
        { rhoMax: row.stats.rhoMax, negated: row.negStats.rhoMax, 'max |Δρ|': Math.sqrt(row.stats.rhoMax),
          probe: gotNew[0], probeNegated: row.neg,
          note: 'the extreme lobe of Δρ is negative, so a max over the VALUE would have normalised by the smaller positive one' });

      const peak = Math.sqrt(row.stats.rhoMax);                        // max |Δρ| over the WHOLE volume, the presenter's divisor
      const newL2 = relL2(gotNew, cpu), newMax = maxOverPeak(gotNew, cpu, peak);
      const storeL2 = relL2(q16, cpu), storeMax = maxOverPeak(q16, cpu, peak);
      const oldL2 = relL2(gotOld, cpu), oldMax = maxOverPeak(gotOld, cpu, peak);
      judge(`L4 ${tag}: the signed road reproduces the CPU evaluator applied to ΔD, at the texture format's own resolution`,
        newL2 < 0.01 && newMax < 3 * storeMax + 1e-5,
        { relL2: +newL2.toExponential(3), 'max err / peak': +newMax.toExponential(3),
          'rgba16float store alone': { relL2: +storeL2.toExponential(3), 'max err / peak': +storeMax.toExponential(3) },
          'f32 contraction, by difference in L²': +Math.max(0, newL2 - storeL2).toExponential(3),
          'peak |Δρ|': +peak.toExponential(3),
          'Δρ over the 12 probes': [Math.min(...cpu.map(Math.abs)).toExponential(3), Math.max(...cpu.map(Math.abs)).toExponential(3)],
          note: peak < 6.1e-5 ? 'the peak is inside f16 SUBNORMALS (< 6.1e-5), so the floor is the format\'s ABSOLUTE step 2^-24 = 6e-8 and not a relative one'
            : 'the texel holds Δρ itself, so the floor is the f16 step at that magnitude' });

      judge(`L5 ${tag}: and it beats the two-volume DIFF it replaces by more than 30× in relative L²`,
        oldL2 > 30 * newL2,
        { newRelL2: +newL2.toExponential(3), oldRelL2: +oldL2.toExponential(3), gain: +(oldL2 / newL2).toFixed(1),
          'old max err / peak': +oldMax.toExponential(3), 'new max err / peak': +newMax.toExponential(3),
          'at the strongest probe': { cpu: +cpu[0].toExponential(4), signed: +gotNew[0].toExponential(4), twoVolume: +gotOld[0].toExponential(4) },
          note: 'the old road renders ρ(t) and ρ_ref as two f16 volumes of √ρ and subtracts them, which is what the fragment shader does' });

      console.log(`      ${tag}: ‖ΔD‖/‖D_ref‖ = ${c.relMatrix.toExponential(3)}, max |ΔD_μν| = ${c.dMax.toExponential(3)}, peak |Δρ| = ${peak.toExponential(3)},`
        + ` t = ${c.t.toFixed(2)} a.u., Tr(DS) = ${c.electrons.toFixed(10)};  SIGNED relative L² ${newL2.toExponential(3)},`
        + ` max error ${newMax.toExponential(3)} of the peak, of which the f16 store alone is ${storeL2.toExponential(3)} / ${storeMax.toExponential(3)};`
        + `  OLD two-volume DIFF relative L² ${oldL2.toExponential(3)}, max error ${oldMax.toExponential(3)} of the peak`
        + ` — ${(oldL2 / newL2).toFixed(0)}× worse; at the strongest probe the CPU says ${cpu[0].toExponential(4)}, the signed volume`
        + ` ${gotNew[0].toExponential(4)} and the two-volume road ${gotOld[0].toExponential(4)}.`);
    }

    /* the two kinds differ by ONE `select` per voxel — the square root the signed kind does not take — so what is
       gated is that the signed product does not cost MORE, at a band the machine's own spread supports (best of
       three, all six readings printed).  A tighter number than this would be gating the room temperature. */
    judge('L6 a signed benzene product costs no more a frame than a density one (the same contraction, no sqrt)',
      R.perf.signed.msPerDispatch < R.perf.density.msPerDispatch * 1.5 && R.perf.signed.kind === 'signed',
      { density: R.perf.density.msPerDispatch, signed: R.perf.signed.msPerDispatch,
        bothDensity: R.perf.density.both, bothSigned: R.perf.signed.both, nAO: R.perf.signed.nAO,
        cap: R.perf.signed.cap, voxels: R.perf.signed.voxels, dispatches: R.perf.signed.n, half: HALF,
        note: 'this box is ±7.43 bohr, the worker\'s own; field-molecule.browser-test.mjs times the same molecule on ±10.3, where more of the volume is outside every shell and the kernel\'s zero-χ skip does more of the work' });
  }

  /* ── THE CARD'S OWN ROAD, END TO END, through the session ───────────────────────────────────────────────────
   * Everything above drives the field directly.  This drives CHEMISTRY: the DIFF control must now put a SIGNED
   * product on the field and show it as 'real' (two-colour lobes), the funnel must name the model that did it,
   * and switching the card off must hand back the observable the user had before the molecule took it. */
  const l7 = await g.ev(`
    __LW.setView('phase');                                   // a distinctive observable to be given back at the end
    __LW.layout.reopen('chem', 'R');
    await __LW.chem.solve('H2O');
    __LW.chem.setKappa(1e-4);
    __LW.chem.setOn(true); __LW.chem.setView('density');
    await new Promise((r) => setTimeout(r, 250));
    const before = { view: __LW.mat.view, kind: __LW.field.moleculeInfo.kind, model: __LW.molsession.selected,
      reason: __LW.molsession.reason, molecule: __LW.molsession.molecule };
    await __LW.chem.kick();
    __LW.chem.setView('diff');
    await __LW.chem.run(20);
    await new Promise((r) => setTimeout(r, 250));
    const after = { view: __LW.mat.view, kind: __LW.field.moleculeInfo.kind, model: __LW.molsession.selected,
      stats: await __LW.field.readStats(), counters: __LW.molsession.counters, chemView: __LW.chem.state().view };
    __LW.chem.stop(); __LW.chem.reset();
    await new Promise((r) => setTimeout(r, 150));
    __LW.chem.setOn(false);
    await new Promise((r) => setTimeout(r, 150));
    const off = { view: __LW.mat.view, molecular: __LW.field.molecular, selected: __LW.molsession.selected,
      reason: __LW.molsession.reason, molecule: __LW.molsession.molecule };
    return { before, after, off, errs: window.__e.slice() };`);
  judge('L7 the card starts on a density and the funnel says which model is playing',
    !l7.E && l7.before.kind === 'density' && l7.before.view === VIEW.density && l7.before.model === 'ground'
    && l7.before.molecule && l7.before.molecule.nAO === nAO, { ...l7.before, threw: l7.E });
  judge('L7 CHEMISTRY\'s DIFF control now produces a SIGNED product, read by the \'real\' view',
    l7.after.kind === 'signed' && l7.after.view === VIEW.real && l7.after.chemView === 'diff'
    && l7.after.stats.rhoMax > 0 && l7.after.model === 'ground',
    { fieldKind: l7.after.kind, observable: l7.after.view, cardView: l7.after.chemView,
      'max |Δρ|': Math.sqrt(l7.after.stats.rhoMax), model: l7.after.model, counters: l7.after.counters });
  judge('L7 nothing was dropped as stale, unselected or molecule-less; the replacements are gestures and worker replies landing between two frames, and only the last of each reached the volume',
    l7.after.counters.stale === 0 && l7.after.counters.unselected === 0 && l7.after.counters.noMolecule === 0
    && l7.after.counters.replaced < l7.after.counters.published,
    { ...l7.after.counters, note: 'published counts every accepted product, replaced the subset that arrived in a frame that already had one' });
  judge('L7 CHEM OFF hands the volume back and restores the observable the user had before the molecule took it',
    l7.off.molecular === false && l7.off.selected === null && l7.off.molecule === null && l7.off.view === VIEW.phase
    && l7.errs.length === 0, { ...l7.off, wanted: VIEW.phase, errs: l7.errs });
} catch (error) {
  judge('gate ran to the end', false, String(error && error.message || error).slice(0, 400));
} finally { await g.close(); }
process.exit(done('molecular-diff') ? 1 : 0);
