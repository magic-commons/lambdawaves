/* field-molecule.browser-test.mjs — THE MOLECULAR FIELD, in the real browser, on the real GPU.
 * Start tools/gate/server.py first; LW_PORT and GD_PORT must be unused/owned ports.
 *
 * The field is driven DIRECTLY through window.__LW.field — no window, no rack control — so this gate answers one
 * question and not two: does MOL_WGSL put the density molecular-field.js computes into the texels RENDER_WGSL
 * reads?  The reference numbers are B-H2O-4's: ρ(O) = 193.313905, the O–H midpoint 0.492165, and the 96³ midpoint
 * sum 9.662692 which is NOT a quadrature (SYNTHESIS decision 6).
 *
 * WHY THE MOLECULE IS TRANSLATED FOR THE TWO POINT PROBES.  ρ has a CUSP at a nucleus — the O 1s width is
 * 1/√(2·130.71) = 0.062 bohr against a 0.215 bohr voxel — so the nearest voxel centre to the O nucleus on the
 * ±10.3 bohr box is 0.1 bohr away and carries a very different ρ.  Comparing that to 193.313905 would measure the
 * grid, not the kernel.  So each probe point is put EXACTLY on the centre of voxel (48, 48, 48) by translating the
 * molecule by (that centre − the point): ρ is translation-covariant, the shader evaluates the same function, and
 * the number the texel must reproduce is the one the CPU evaluator prints at the point itself.
 */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { open } from '../tools/gate/gatekit.mjs';
import { basisFrom, ANGSTROM } from '../lab/md.js';
import { moleculeRHF, registerRecord } from '../lab/rhf-molecule.js';
import { evaluator, fieldShells } from '../lab/molecular-field.js';

const HALF = 10.3, RES = 96, IDX = 48;                                      // the fixture's box, the shipped grid
const centreAt = (i) => (i + 0.5) / RES * 2 * HALF - HALF;
const CENTRE = centreAt(IDX);
const record = JSON.parse(readFileSync(new URL('../lab/vendor/bse/sto-3g-v1.json', import.meta.url), 'utf8'));
registerRecord('sto-3g', record);

/* ── node side: the molecule, its field spec, and every reference number the page will be held to ────────────── */
const atoms = [[8, 0, 0, 0.22166487441148175], [1, 0, 1.4309006215206648, -0.886659497645927],
  [1, 0, -1.4309006215206648, -0.886659497645927]].map(([Z, x, y, z]) => ({ Z, x, y, z }));
const sol = moleculeRHF({ atoms, basis: 'sto-3g' });
const basis = sol.basis, nAO = basis.n, ev = evaluator(basis.shells);
const flat = (shells) => shells.map((s) => ({ center: s.center, l: s.l, ao: s.ao,
  prims: s.prims.map((p) => ({ alpha: p.alpha, w: Array.from(p.w) })) }));
const homo = new Float64Array(nAO);
for (let i = 0; i < nAO; i++) homo[i] = sol.C[i * nAO + sol.nocc - 1];
const psiAt = (p) => { const v = ev.ao(p); let s = 0; for (let i = 0; i < nAO; i++) s += homo[i] * v[i]; return s; };
const PROBES = [
  { name: 'O nucleus', p: [0, 0, 0.22166487441148175], ref: 193.313905 },
  { name: 'O–H1 midpoint', p: [0, 0.7154503107603324, -0.3324973116172226], ref: 0.492165 },
];
for (const pr of PROBES) pr.cpu = ev.density(sol.D, pr.p);
/* benzene at the same 96³ box, for the dispatch cost alone: D is a symmetric positive-definite stand-in
   (a Kac–Murdock–Szegő matrix), because the kernel's cost is set by nAO and the shells and never by the values. */
const rCC = 1.39 * ANGSTROM, rCH = (1.39 + 1.09) * ANGSTROM, bzAtoms = [];
for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; bzAtoms.push({ Z: 6, x: rCC * Math.cos(a), y: rCC * Math.sin(a), z: 0 }); }
for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; bzAtoms.push({ Z: 1, x: rCH * Math.cos(a), y: rCH * Math.sin(a), z: 0 }); }
const bzBasis = basisFrom(bzAtoms, record, { cart: true }), bzN = bzBasis.n;
const bzD = new Float64Array(bzN * bzN);
for (let i = 0; i < bzN; i++) for (let j = 0; j < bzN; j++) bzD[i * bzN + j] = Math.exp(-0.5 * Math.abs(i - j));
const payload = { half: HALF, res: RES, idx: IDX, centre: CENTRE, nAO, shells: flat(fieldShells(basis)),
  D: Array.from(sol.D), homo: Array.from(homo), probes: PROBES.map((p) => ({ name: p.name, p: p.p })),
  bz: { nAO: bzN, shells: flat(fieldShells(bzBasis)), D: Array.from(bzD) } };

const g = await open(`https://127.0.0.1:${process.env.LW_PORT || 8701}/lab/`, { width: 1200, height: 900, script: 300000 });
let failed = false;
try {
  assert.equal((await g.waitFor('window.__LW&&__LW.ready', 200, 100)).ok, 1, 'the lab must boot');
  /* ONE page call: the app's own frame loop runs between awaits, and a molecular field is only safe from it because
     a set molecule OWNS the volume (field.js frame(): the eigenmode reconstruct stands down while molSpec is set).
     Builder B's window therefore needs no cooperation from the loop either. */
  const R = await g.ev(`
    const P = arguments[0], f = __LW.field;
    if (!f.ok) return { skip: f.error || 'no WebGPU adapter' };
    f.setResolution(P.res);
    const spec = (shells, nAO, shift) => ({ nAO, half: P.half, shells: shells.map((s) => ({
      center: [s.center[0] + shift[0], s.center[1] + shift[1], s.center[2] + shift[2]], l: s.l, ao: s.ao, prims: s.prims })) });
    const D = new Float32Array(P.D), out = { probes: [], perf: {} };
    for (const pr of P.probes) {
      const t = [P.centre - pr.p[0], P.centre - pr.p[1], P.centre - pr.p[2]];
      out.info = f.setMolecule(spec(P.shells, P.nAO, t));
      f.setMoleculeMatrix(D, { kind: 'density' });
      const rec = f.reconstructMolecule();
      const v = await f.sampleVoxel(P.idx, P.idx, P.idx), st = await f.readStats();
      out.probes.push({ name: pr.name, re: v.re, im: v.im, rho: v.re * v.re + v.im * v.im,
        at: [v.x, v.y, v.z], encodeMs: rec.encodeMs, rhoMax: st.rhoMax });
    }
    /* the molecule where it really stands, with refTex captured, for the whole-volume sum and the picture */
    f.setMolecule(spec(P.shells, P.nAO, [0, 0, 0]));
    f.setMoleculeMatrix(D, { kind: 'density', ref: true });
    f.reconstructMolecule();
    out.digest = await f.fieldDigest();
    out.stats = await f.readStats();
    out.refValid = f.refValid;
    out.perf.h2o = await f.moleculeThroughput({ n: 800 });
    /* the HOMO, signed, straddling the x = 0 nodal plane: voxels 48 and 47 sit at ±0.5Δ of one another in x */
    f.setMoleculeMatrix(new Float32Array(P.homo), { kind: 'orbital' });
    f.reconstructMolecule();
    const a = await f.sampleVoxel(P.idx, P.idx, P.idx + 1), b = await f.sampleVoxel(P.idx - 1, P.idx, P.idx + 1);
    out.orbital = { plus: { re: a.re, im: a.im, at: [a.x, a.y, a.z] }, minus: { re: b.re, im: b.im, at: [b.x, b.y, b.z] },
      info: f.moleculeInfo, stats: await f.readStats() };
    /* benzene: 36 AOs, 24 shells, the same 96³ box — the dispatch cost alone */
    f.setMolecule(spec(P.bz.shells, P.bz.nAO, [0, 0, 0]));
    f.setMoleculeMatrix(new Float32Array(P.bz.D), { kind: 'density' });
    f.reconstructMolecule();
    out.perf.benzene = await f.moleculeThroughput({ n: 800 });
    out.bzInfo = f.moleculeInfo;
    /* THE CONTRACT Builder B calls: setMolecule → setMoleculeMatrix → frame({ molecule: true }), and the dirty
       flag, so a static volume is not re-dispatched once a frame */
    f.setMolecule(spec(P.shells, P.nAO, [0, 0, 0]));
    f.setMoleculeMatrix(D, { kind: 'density', ref: true });
    const gA = f.stats.generation;
    f.frame({ obs: __LW.obs, mat: __LW.mat, molecule: true });
    const gB = f.stats.generation;
    f.frame({ obs: __LW.obs, mat: __LW.mat, molecule: true });
    out.frame = { gA, gB, gC: f.stats.generation, dirty: f.moleculeInfo.dirty, digest: (await f.fieldDigest()).integral };
    /* and setMolecule(null) hands the volume back to the eigenmode kernel */
    f.setMolecule(null);
    out.cleared = { molecular: f.molecular, info: f.moleculeInfo };
    f.setMolecule(spec(P.shells, P.nAO, [0, 0, 0]));
    f.setMoleculeMatrix(D, { kind: 'density', ref: true });
    f.reconstructMolecule();
    out.molecular = f.molecular;
    return out;
  `, [payload]);
  assert.ok(R && !R.E, `the page call threw: ${R && R.E}`);
  if (R.skip) { console.log('SKIP field-molecule: ' + R.skip); }
  else {
    /* 1. THE TEXEL CONVENTION.  RENDER_WGSL reads ρ = dot(s.rg, s.rg) for 'density' and s.x for 'real', so a
          density must arrive as (√ρ, 0): the imaginary part is exactly zero and ρ = re², to f16. */
    assert.equal(R.info.nAO, nAO); assert.equal(R.info.nShell, 5);
    assert.equal(R.info.expsPerVoxel, 12, 'STO-3G water is 12 exponentials a voxel, not 15 and not 21');
    for (let k = 0; k < PROBES.length; k++) {
      const got = R.probes[k], want = PROBES[k];
      for (const q of got.at) assert.ok(Math.abs(q - CENTRE) < 1e-9, `voxel (48,48,48) must sit at ${CENTRE}, the page says ${got.at}`);
      assert.equal(got.im, 0, 'a density texel carries no imaginary part');
      const rel = Math.abs(got.rho - want.cpu) / want.cpu;
      assert.ok(rel < 0.01, `${want.name}: GPU ρ = ${got.rho} against the evaluator's ${want.cpu} — ${(rel * 100).toFixed(4)} % over the 1 % rgba16float budget`);
      assert.ok(Math.abs(want.cpu - want.ref) < 1e-5, `${want.name}: the evaluator itself must reproduce B-H2O-4's ${want.ref}`);
    }
    console.log(`PASS molecular density texels: ρ(O) ${R.probes[0].rho.toFixed(4)} vs ${PROBES[0].cpu.toFixed(6)} (${(100 * Math.abs(R.probes[0].rho / PROBES[0].cpu - 1)).toFixed(4)} %),`
      + ` O–H midpoint ${R.probes[1].rho.toFixed(6)} vs ${PROBES[1].cpu.toFixed(6)} (${(100 * Math.abs(R.probes[1].rho / PROBES[1].cpu - 1)).toFixed(4)} %);`
      + ` texel = (√ρ, 0, 0, 0), im exactly 0, stats[0] = max ρ = ${R.probes[0].rhoMax.toFixed(3)}.`);

    /* 2. THE WHOLE VOLUME, not two voxels: the 96³ midpoint sum, which is 9.662692 and is NOT the electron count. */
    const sum = R.digest.integral, rel = Math.abs(sum - 9.662692299109256) / 9.662692299109256;
    assert.equal(R.digest.nan, 0, 'no NaN voxel anywhere in the volume');
    assert.ok(rel < 0.01, `the 96³ midpoint sum is ${sum}, against the CPU's 9.662692 — ${(rel * 100).toFixed(3)} %`);
    assert.ok(Math.abs(sum - 10) > 0.2, `and it is NOT the electron count: ${sum} against 10`);
    assert.ok(Math.abs(R.stats.rhoMax / R.digest.maxRho - 1) < 0.02, `the stats atomic (f32, ${R.stats.rhoMax}) and the texel maximum (f16, ${R.digest.maxRho}) must agree`);
    assert.ok(R.refValid && Math.abs(R.stats.refMax / R.stats.rhoMax - 1) < 0.02, `ref: true must fill refTex, whose max is ${R.stats.refMax} against ${R.stats.rhoMax}`);
    console.log(`PASS whole volume: Σρ dV over 884,736 voxels = ${sum.toFixed(6)} against the CPU's 9.662692 (${(rel * 100).toFixed(3)} %), 0 NaN,`
      + ` max ρ f32 ${R.stats.rhoMax.toFixed(3)} / f16 ${R.digest.maxRho.toFixed(3)}; refTex captured at ${R.stats.refMax.toFixed(3)} — the Δρ reference 'diff' subtracts.`);

    /* 3. THE ORBITAL KIND is SIGNED: the HOMO is H₂O's O 2p_x, so the two voxels straddling x = 0 must carry
          opposite signs and equal magnitudes, and 'phase' then reads 0/π by sign. */
    const O = R.orbital, cpuPlus = psiAt([CENTRE, CENTRE, centreAt(IDX + 1)]), cpuMinus = psiAt([centreAt(IDX - 1), CENTRE, centreAt(IDX + 1)]);
    assert.ok(O.plus.re > 0 && O.minus.re < 0, `the nodal plane: ψ(+x) = ${O.plus.re}, ψ(−x) = ${O.minus.re} must differ in sign`);
    assert.ok(Math.abs(O.plus.re + O.minus.re) < 1e-3 * Math.abs(O.plus.re) + 1e-6, 'and be equal and opposite');
    assert.ok(Math.abs(O.plus.re / cpuPlus - 1) < 0.01, `ψ(+x) = ${O.plus.re} against the evaluator's ${cpuPlus}`);
    assert.ok(Math.abs(O.minus.re / cpuMinus - 1) < 0.01, `ψ(−x) = ${O.minus.re} against the evaluator's ${cpuMinus}`);
    assert.ok(Math.abs(O.stats.rhoMax / (O.plus.re * O.plus.re) - 1) > 0.01, 'the orbital volume has its own max ψ², not the density\'s');
    assert.equal(O.info.kind, 'orbital');
    console.log(`PASS orbital kind: HOMO (O 2p_x, ε = ${sol.orbitalEnergies[sol.nocc - 1].toFixed(6)}) at ±0.5Δ across x = 0 reads ${O.plus.re.toFixed(6)} and ${O.minus.re.toFixed(6)}`
      + ` against the evaluator's ${cpuPlus.toFixed(6)} / ${cpuMinus.toFixed(6)} — signed, so 'real' shows the lobes and 'phase' reads 0 and π.`);

    /* 4. THE DISPATCH COST on this GPU, measured and reported — never predicted.  800 dispatches per reading, not
          40: Firefox polls queue completion at about 100 ms, so a 40-dispatch total came back quantised to exact
          multiples of 100 ms and read 2.5 ms for EVERY volume, 64³ and 96³ alike.  That number was the poll. */
    assert.equal(R.bzInfo.nAO, 36); assert.equal(R.bzInfo.nShell, 24);
    assert.equal(R.bzInfo.expsPerVoxel, 54, 'benzene/STO-3G is 54 exponentials a voxel (the six sp groups are shared)');
    assert.equal(R.perf.h2o.cap, 16, 'seven AOs take the 4 KiB χ tier');
    assert.equal(R.perf.benzene.cap, 40, 'thirty-six AOs take the 10 KiB χ tier');
    assert.equal(R.perf.h2o.voxels, 884736);
    console.log(`PASS dispatch cost at 96³ (${R.perf.h2o.voxels} voxels, ${R.perf.h2o.n} dispatches in one pass, one wait):`
      + ` H₂O/STO-3G 7 AOs / 12 exps / cap ${R.perf.h2o.cap} → ${R.perf.h2o.msPerDispatch} ms;`
      + ` benzene/STO-3G 36 AOs / 24 shells / 54 exps / cap ${R.perf.benzene.cap} → ${R.perf.benzene.msPerDispatch} ms.`);
    assert.ok(R.perf.benzene.msPerDispatch < 8, `benzene at 96³ must be under 8 ms per dispatch, measured ${R.perf.benzene.msPerDispatch} ms`);

    /* 5. THE CALL SEQUENCE, and the dirty flag: frame({ molecule: true }) dispatches ONCE per update. */
    assert.equal(R.frame.gB, R.frame.gA + 1, 'frame({ molecule: true }) must dispatch the changed volume');
    assert.equal(R.frame.gC, R.frame.gB, 'and must NOT dispatch again while nothing has changed');
    assert.equal(R.frame.dirty, false);
    assert.ok(Math.abs(R.frame.digest / 9.662692299109256 - 1) < 0.01, `the volume frame() built is the same one: ${R.frame.digest}`);
    assert.equal(R.cleared.molecular, false, 'setMolecule(null) must hand the volume back to the eigenmode kernel');
    assert.equal(R.cleared.info, null);
    assert.equal(R.molecular, true);
    console.log(`PASS the call sequence: setMolecule → setMoleculeMatrix → frame({ molecule: true }) dispatched once (generation ${R.frame.gA} → ${R.frame.gB}),`
      + ` a second identical frame dispatched nothing, and setMolecule(null) returned the field to the eigenmode kernel.`);
  }

  /* 6. The picture, through the app's OWN presenter — nothing about a molecular volume is special to it.
        The proof is differential and therefore theme-proof: the same camera and material over ρ and over ρ ≡ 0.
        A pixel count is not: on the light stage EVERY pixel is already non-black before anything is drawn. */
  if (!R.skip) {
    const pix = await g.ev(`const P = arguments[0], f = __LW.field, m = __LW.mat;
      m.view = 0; m.style = 1; m.exposure = 1; m.softness = 0.7; m.iso = 0.004; m.knee = 0.6;
      m.paletteOn = false; m.invert = false; m.hueShift = 0; __LW.obs.dist = 1.6;
      const on = await f.readPixels(__LW.obs, m, 320, 240);
      f.setMoleculeMatrix(new Float32Array(P.nAO * P.nAO), { kind: 'density' });     // ρ ≡ 0: the stage alone
      f.reconstructMolecule();
      const off = await f.readPixels(__LW.obs, m, 320, 240);
      f.setMoleculeMatrix(new Float32Array(P.D), { kind: 'density', ref: true });    // and back, for the picture
      f.reconstructMolecule();
      __LW.setStyle('solid');
      await new Promise((r) => setTimeout(r, 400));
      return { on, off, theme: document.body.dataset.theme, view: m.view,
        molecular: f.molecular, digest: (await f.fieldDigest()).integral };`, [payload]);
    assert.ok(!pix.E, `the present call threw: ${pix.E}`);
    assert.notEqual(pix.on.hash, pix.off.hash, 'the density must change the presented image');
    assert.ok(Math.abs(pix.on.meanLum - pix.off.meanLum) > 1, `and change its luminance: ${pix.on.meanLum} against the empty stage's ${pix.off.meanLum}`);
    assert.ok(pix.on.meanChroma > 1.1 * pix.off.meanChroma, `and carry the density view's own colour: chroma ${pix.on.meanChroma} against ${pix.off.meanChroma}`);
    assert.ok(Math.abs(pix.digest / 9.662692299109256 - 1) < 0.01, 'and the volume is back after the ρ ≡ 0 probe');
    mkdirSync(new URL('../.tmp/', import.meta.url), { recursive: true });
    writeFileSync(new URL('../.tmp/field-h2o.png', import.meta.url), Buffer.from(await g.snap(), 'base64'));
    console.log(`PASS presented unchanged (${pix.theme} theme, view 'density', style 'solid', iso 0.004): luminance ${pix.on.meanLum.toFixed(2)} against the`
      + ` ρ ≡ 0 stage's ${pix.off.meanLum.toFixed(2)}, chroma ${pix.on.meanChroma.toFixed(2)} against ${pix.off.meanChroma.toFixed(2)}, hash ${pix.on.hash} ≠ ${pix.off.hash};`
      + ` screenshot .tmp/field-h2o.png.`);
  }

  /* 7. THE WORKER ROAD, in a real module worker of its own — no rack.js, no window.  This is the other half of
        Builder B's contract: chem.solve hands back the very `shells` and `half` that setMolecule takes. */
  {
    const W = await g.ev(`
      const w = new Worker(new URL('./mathworker.js', location.href), { type: 'module' });
      const call = (msg) => new Promise((res, rej) => { const id = Math.random();
        const h = (e) => { if (e.data.id !== id) return; w.removeEventListener('message', h); res(e.data); };
        w.addEventListener('message', h); w.onerror = (e) => rej(new Error('worker error: ' + (e.message || e)));
        w.postMessage(Object.assign({ id }, msg)); });
      const atoms = arguments[0], out = {};
      const s = await call({ op: 'chem.solve', atoms, basis: 'sto-3g', charge: 0 });
      out.solve = { error: s.error || null, energy: s.energy, nAO: s.nAO, nocc: s.nocc, half: s.half, hash: s.hash,
        omega: s.roots && s.roots[0].omega, omegaTDA: s.roots && s.roots[0].omegaTDA, roots: s.roots && s.roots.length,
        shells: s.shells && s.shells.length, epsType: s.eps && s.eps.constructor.name, dipoleZ: s.dipole && s.dipole[2] };
      const i0 = await call({ op: 'chem.rt.init', atoms, basis: 'sto-3g', dt: 0.01, integrator: 'mmut', kick: { axis: 'z', kappa: 1e-3 } });
      const r1 = await call({ op: 'chem.rt.run', steps: 400 });
      out.rt = { initError: i0.error || null, runError: r1.error || null, t0: i0.t, E0: i0.E0, Dlen: i0.D_re && i0.D_re.length,
        t: r1.t, msPerStep: r1.msPerStep, samples: r1.samples, electrons: r1.electrons, idempotency: r1.idempotency,
        energy: r1.energy, traceLen: r1.trace && r1.trace.length };
      const sp = await call({ op: 'chem.rt.spectrum', tau: 200, wMin: 0.2, wMax: 1.4, dw: 0.002 });
      out.spectrum = { error: sp.error || null, grid: sp.omega && sp.omega.length, peaks: sp.peaks && sp.peaks.length };
      out.reset = await call({ op: 'chem.rt.reset' }).then((r) => ({ error: r.error || null, t: r.t }));
      out.badBasis = (await call({ op: 'chem.rt.init', atoms, basis: 'cc-pvdz' })).error || 'NO ERROR';
      /* the field eats the worker's own spec, untouched */
      const f = __LW.field;
      if (f.ok) { f.setMolecule({ nAO: s.nAO, half: s.half, shells: s.shells });
        f.setMoleculeMatrix(Float32Array.from(s.D), { kind: 'density' }); f.reconstructMolecule();
        out.field = { info: f.moleculeInfo, digest: (await f.fieldDigest()).integral }; }
      w.terminate();
      return out;`, [atoms]);
    assert.ok(!W.E, `the worker call threw: ${W.E}`);
    assert.equal(W.solve.error, null);
    assert.ok(Math.abs(W.solve.energy - -74.963023162862) < 1e-9, `chem.solve energy ${W.solve.energy}`);
    assert.equal(W.solve.hash, sol.hash, 'and the basis hash the node road computes');
    assert.ok(Math.abs(W.solve.omega - 0.483101392) < 1e-8, `the first RPA root ${W.solve.omega} (B-H2O-7's 0.483101392)`);
    assert.ok(Math.abs(W.solve.omegaTDA - 0.484640212) < 1e-8, `and its TDA partner ${W.solve.omegaTDA}`);
    assert.equal(W.solve.roots, 10, 'ten occupied–virtual pairs');
    assert.equal(W.solve.shells, 5); assert.equal(W.solve.epsType, 'Float64Array', 'typed arrays come back transferred');
    assert.ok(Math.abs(W.solve.half - 7.4309006215206646) < 1e-9, 'half = the widest nuclear coordinate + 6 bohr');
    assert.equal(W.rt.initError, null); assert.equal(W.rt.runError, null);
    assert.equal(W.rt.Dlen, nAO * nAO, 'Re D comes back as Float32Array(nAO²) for the field');
    assert.equal(W.rt.traceLen, 400); assert.equal(W.rt.samples, 401, 'the trace keeps t = 0 and the 400 steps');
    assert.ok(Math.abs(W.rt.electrons - 10) < 1e-9, `Tr(DS) = ${W.rt.electrons} after 400 MMUT steps`);
    assert.ok(W.rt.idempotency < 1e-9, `the idempotency defect ${W.rt.idempotency}`);
    assert.ok(Math.abs(W.rt.energy - W.rt.E0) < 1e-7, `the field-free energy is conserved: ${W.rt.energy} against ${W.rt.E0}`);
    assert.equal(W.spectrum.error, null); assert.equal(W.spectrum.grid, 601); assert.ok(W.spectrum.peaks >= 1);
    assert.equal(W.reset.t, 0, 'chem.rt.reset is back at the kicked t = 0');
    assert.match(W.badBasis, /unknown basis 'cc-pvdz'/, 'an unvendored basis is refused by name');
    assert.equal(W.field.info.expsPerVoxel, 12, 'the worker\'s own shells drive the kernel');
    assert.ok(W.field.digest > 9 && W.field.digest < 10.1, `and its ±${W.solve.half.toFixed(3)} bohr box sums to ${W.field.digest}`);
    console.log(`PASS the worker road (a real module worker, no rack.js): chem.solve E = ${W.solve.energy.toFixed(12)}, first RPA root ${W.solve.omega.toFixed(9)}`
      + ` / TDA ${W.solve.omegaTDA.toFixed(9)}, µ_z = ${W.solve.dipoleZ.toFixed(6)}, half ${W.solve.half.toFixed(4)};`
      + ` chem.rt 400 MMUT steps at ${W.rt.msPerStep} ms/step to t = ${W.rt.t.toFixed(2)}, Tr(DS) = ${W.rt.electrons.toFixed(12)},`
      + ` idempotency ${W.rt.idempotency.toExponential(2)}, E conserved to ${Math.abs(W.rt.energy - W.rt.E0).toExponential(2)};`
      + ` spectrum ${W.spectrum.grid} points, ${W.spectrum.peaks} peaks; reset at t = 0; and the field took its shells with ${W.field.info.expsPerVoxel} exps a voxel.`);
  }

  const errs = await g.errors();
  assert.deepEqual(errs.errs, [], 'the page must raise no error at all');
  console.log('PASS no page errors: window.__e is empty after every molecular dispatch and readback.');
} catch (e) { failed = true; console.error('RED field-molecule: ' + (e && e.message || e)); }
finally { await g.close(); }
process.exit(failed ? 1 : 0);
