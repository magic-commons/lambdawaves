/* tests/field-law.browser-test.mjs — THE STANDING FIELD LAW (0.5.4 P7c, ruled in research/release-0.5.4/PLAN.md §J-2), in a real browser.
 *
 *   python3 tools/gate/server.py "$PWD" 8704 &      (stop it by pid)
 *   LW_PORT=8704 GD_PORT=5206 node tests/field-law.browser-test.mjs
 *
 * The field is f64 on the CPU, f32 in the kernel and an rgba16float texel in the cache the presenter samples (lab/field.js readGrid: ONE
 * copy of every texel).  THE LAW asserts what that texel IS: each stored component within ONE f16 ulp of the kernel's f32 value, i.e. of
 * its f64 value to one ulp + the kernel's f32 error (FIELD_LAW.f32, field.js' 1e-6) — hydrogen's (Re ψ, Im ψ) against the CPU closed form
 * (__LW.cpuPsi), water's √ρ against lab/molecular-field.js' f64 evaluator over a CPU solve of the same molecule (its D checked equal to the
 * worker's).  The components past ONE ulp of the f64 value are counted and printed: the f32 term is all that carries them.  The ROUNDING MODE is measured, not assumed: of the components where rounding toward
 * zero and rounding to nearest disagree, the share the store matched (this rig: toward zero, so a full ulp, never half, is the bound).
 * THE READINGS are printed each in its own metric and held to the constants in tests/helpers/field-law.mjs — the numbers README's sentence
 * and field.js' texel comment state and P4's STATUS reads: RMS · the 99.8 %-of-voxels figure · the worst voxel · relative to the maximum.
 * THE VIEW-INVARIANCE GATE (0.5.4 P7d), on the water just read: exposure, ISO, palette, grid and quality are presentation, so none may move
 * the solve (sol.seq), the chem worker's ledger (workerStat().solverCalls) or Tr(DS) (sol.electrons, the worker's own) — each change made
 * on the hand's road and read back, so a change that did not happen cannot pass.
 * THE LINE (0.9.0 Z3, for the acceptance matrix): at its end, green or red, ONE pasteable line — `FIELD LAW · <adapter> · <browser> · <commit> ·
 * hydrogen RMS · 99.8 % · worst · water RMS · worst/ρmax · GREEN|RED` — the adapter the field's own `adapterInfo` (lab/field.js), the browser the
 * page's user agent, the commit `git rev-parse --short HEAD`, the readings the ones printed above (no second measurement). */
import { execSync } from 'node:child_process';
import { open, judge, done } from '../tools/gate/gatekit.mjs';
import { FIELD_LAW, f16, ulp16, toF16 } from './helpers/field-law.mjs';

const PORT = process.env.LW_PORT || 8704, L = FIELD_LAW, HY = L.hydrogen, DE = L.density;
let dev = null, h = null, w = null;
const g = await open(`https://127.0.0.1:${PORT}/lab/?gastab=0`, { width: 1300, height: 900, script: 300000 });
const LIB = `const f16 = ${f16}, ulp16 = ${ulp16}, toF16 = ${toF16}, LW = __LW, F = LW.field;
  const settle = async (n = 2) => { for (let i = 0; i < n; i++) await LW.settle(); };
  /* THE LAW's ledger: |stored − f64| in ulps of the f64 value, and the rounding mode read off the components where the two modes disagree */
  const ledger = () => ({ n: 0, worstUlps: 0, over: 0, strict: 0, f32: 0, at: null, disc: 0, rtz: 0, rne: 0 });
  const law = (A, s, x, where) => { A.n++; const u = ulp16(x), d = Math.abs(s - x), e = d / u;
    if (e > A.worstUlps) { A.worstUlps = e; A.at = { where, stored: s, f64: x, ulp: u }; } if (d > ${L.ulps} * u + ${L.f32} * Math.abs(x)) A.over++;
    if (e > ${L.ulps}) { A.strict++; A.f32 = Math.max(A.f32, (d - ${L.ulps} * u) / Math.abs(x)); }
    const z = toF16(x, 'rtz'), r = toF16(x, 'rne'); if (z !== r) { A.disc++; if (s === z) A.rtz++; else if (s === r) A.rne++; } };
  const mode = (A) => A.rtz >= 0.99 * A.disc ? 'toward zero' : A.rne >= 0.99 * A.disc ? 'to nearest' : 'neither';
  const quant = (v, p) => { const s = Float64Array.from(v).sort(); return s[Math.min(s.length - 1, Math.ceil(p * s.length) - 1)]; };`;
try {
  const ready = await g.waitFor('window.__LW&&__LW.ready', 400, 100);
  judge('F0 boot: __LW.ready', ready.ok === 1, ready);
  dev = await g.ev(`try { if (__LW.warning && __LW.warning.dismiss) __LW.warning.dismiss(); } catch (_) {}
    __LW.governor.on = false; __LW.quality.auto = false; __LW.quality.autoScale = 1; return { info: __LW.field.adapterInfo || null, ua: navigator.userAgent };`);

  /* ── (i)+(ii) HYDROGEN: 1s+2pz at 64³, paused at t = 3.7 a.u., every voxel of the cache against the closed form ── */
  h = await g.ev(`${LIB}
    LW.quality.res = ${HY.N}; LW.quality.steps = 110; LW.quality.scale = 1;
    LW.pause(); LW.clock.scrub(0); LW.loadPreset(${JSON.stringify(HY.preset)}); LW.pause(); LW.clock.scrub(${HY.t}); LW.schedule(4); await settle(3);
    const G = await F.readGrid(), N = G.N, H = G.half, A = ledger(), d = new Float64Array(N * N * N);
    let worst = 0, maxPsi = 0, sum2 = 0, at = null;
    for (let k = 0; k < N; k++) for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const v = i + N * j + N * N * k, re = f16(G.texels[v * 4]), im = f16(G.texels[v * 4 + 1]);
      const c = LW.cpuPsi((i + 0.5) / N * 2 * H - H, (j + 0.5) / N * 2 * H - H, (k + 0.5) / N * 2 * H - H);
      law(A, re, c.re, [i, j, k, 're']); law(A, im, c.im, [i, j, k, 'im']);
      const e = Math.hypot(re - c.re, im - c.im), m = Math.hypot(c.re, c.im); d[v] = e; sum2 += e * e;
      if (e > worst) { worst = e; at = { ijk: [i, j, k], stored: [re, im], f64: [c.re, c.im] }; } if (m > maxPsi) maxPsi = m;
    }
    return { N, half: H, t: LW.clock.t, ledger: A, mode: mode(A), rms: Math.sqrt(sum2 / d.length), p998: quant(d, ${L.p}), worst, at, maxPsi,
      relToMax: worst / maxPsi, errs: window.__e.slice() };`);
  console.log(`READING hydrogen ${HY.preset} at ${h.N}³ (±${h.half} a₀, t = ${h.t}): |Δψ| RMS ${h.rms.toExponential(2)} · 99.8 % of voxels ≤ ${h.p998.toExponential(2)}`
    + ` · worst voxel ${h.worst.toExponential(2)} · worst / max|ψ| ${h.relToMax.toExponential(2)} (max|ψ| ${h.maxPsi.toFixed(4)})`);
  console.log(`READING hydrogen rounding mode: ${h.mode} — of ${h.ledger.disc} components where the modes disagree, ${h.ledger.rtz} match toward zero, ${h.ledger.rne} to nearest`);
  console.log(`READING hydrogen past ONE ulp of the f64 value: ${h.ledger.strict} of ${h.ledger.n} components, the worst ${h.ledger.worstUlps.toFixed(4)} ulp (excess ${h.ledger.f32.toExponential(2)} relative ≤ f32 ${L.f32.toExponential()})`);
  judge(`F1 THE LAW, hydrogen: all ${2 * HY.N ** 3} stored components within ${L.ulps} f16 ulp + ${L.f32.toExponential()}·|ψ| of the closed form`,
    h.N === HY.N && h.ledger.n === 2 * HY.N ** 3 && h.ledger.over === 0, { worstUlps: h.ledger.worstUlps, over: h.ledger.over, strict: h.ledger.strict, f32: h.ledger.f32, at: h.ledger.at });
  judge(`F2 hydrogen's readings within FIELD_LAW: RMS ≤ ${HY.rms.toExponential()}, 99.8 % ≤ ${HY.p998.toExponential()}, worst voxel ≤ ${HY.worst.toExponential()}, worst/max|ψ| ≤ ${HY.relToMax.toExponential()}`,
    h.rms <= HY.rms && h.p998 <= HY.p998 && h.worst <= HY.worst && h.relToMax <= HY.relToMax && h.errs.length === 0,
    { rms: h.rms, p998: h.p998, worst: h.worst, relToMax: h.relToMax, at: h.at, errs: h.errs });

  /* ── (i)+(ii) WATER's density: H₂O STO-3G at 64³ on its own box, √ρ against the f64 evaluator of a CPU solve ── */
  w = await g.ev(`${LIB}
    LW.quality.res = ${DE.N}; LW.quality.steps = 110; LW.schedule(4); await settle(3);
    await LW.chem.solve(${JSON.stringify(DE.molecule)}); LW.chem.setOn(true); LW.chem.setView('density'); await settle(4); LW.pause(); await settle(2);
    const sol = LW.chem.solution(), q = LW.chem.query();
    const [{ loadRecord, moleculeRHF }, { evaluator }] = await Promise.all([import('./rhf-molecule.js'), import('./molecular-field.js')]);
    await loadRecord(q.basis);
    const r = moleculeRHF({ atoms: q.atoms, basis: q.basis, charge: q.charge, detect: false, stability: false, hessian: false }), ev = evaluator(r.basis.shells);
    let dD = r.D.length === sol.D.length ? 0 : Infinity; for (let p = 0; p < r.D.length; p++) dD = Math.max(dD, Math.abs(r.D[p] - sol.D[p]));
    const G = await F.readGrid(), N = G.N, H = G.half, A = ledger(), rel = [], rho = new Float64Array(N * N * N), dr = new Float64Array(N * N * N);
    let rhoMax = 0, worst = 0, at = null;
    for (let k = 0; k < N; k++) for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const v = i + N * j + N * N * k, a = f16(G.texels[v * 4]), b = f16(G.texels[v * 4 + 1]);
      const c = Math.max(0, ev.density(r.D, [(i + 0.5) / N * 2 * H - H, (j + 0.5) / N * 2 * H - H, (k + 0.5) / N * 2 * H - H])), x = Math.sqrt(c);
      law(A, a, x, [i, j, k, 'sqrt-rho']); law(A, b, 0, [i, j, k, 'zero']);
      rho[v] = c; dr[v] = Math.abs(a * a + b * b - c); if (c > rhoMax) rhoMax = c;
      if (x >= 2 ** -14) { const e = dr[v] / c; rel.push(e); if (e > worst) { worst = e; at = { ijk: [i, j, k], stored: a, sqrtRho: x, rho: c }; } }
    }
    let dMax = 0; for (let v = 0; v < dr.length; v++) dMax = Math.max(dMax, dr[v]);
    return { N, half: H, nAO: sol.nAO, energy: sol.energy, dD, ledger: A, mode: mode(A), normal: rel.length, rms: Math.sqrt(rel.reduce((s, e) => s + e * e, 0) / rel.length),
      p998: quant(rel, ${L.p}), worst, at, rhoMax, gpuRhoMax: G.rhoMax, relToRhoMax: dMax / rhoMax, errs: window.__e.slice() };`);
  console.log(`READING density ${DE.molecule} at ${w.N}³ (±${w.half.toFixed(4)} a₀, ${w.nAO} AO, E ${w.energy}): |Δρ|/ρ RMS ${w.rms.toExponential(2)} · 99.8 % of voxels ≤ ${w.p998.toExponential(2)}`
    + ` · worst voxel ${w.worst.toExponential(2)} (over the ${w.normal} voxels whose √ρ is f16-normal) · worst |Δρ| / ρmax ${w.relToRhoMax.toExponential(2)} (ρmax ${w.rhoMax.toFixed(6)}, GPU ${w.gpuRhoMax})`);
  console.log(`READING density rounding mode: ${w.mode} — of ${w.ledger.disc} components where the modes disagree, ${w.ledger.rtz} match toward zero, ${w.ledger.rne} to nearest`);
  judge('F3 the oracle is the GPU\'s density: the CPU solve\'s D equals the worker\'s to 1e-12', w.dD <= 1e-12, { dD: w.dD });
  console.log(`READING density past ONE ulp of the f64 value: ${w.ledger.strict} of ${w.ledger.n} components, the worst ${w.ledger.worstUlps.toFixed(4)} ulp (excess ${w.ledger.f32.toExponential(2)} relative ≤ f32 ${L.f32.toExponential()})`);
  judge(`F3 THE LAW, density: all ${2 * DE.N ** 3} stored components within ${L.ulps} f16 ulp + ${L.f32.toExponential()}·√ρ of √ρ in f64`,
    w.N === DE.N && w.ledger.n === 2 * DE.N ** 3 && w.ledger.over === 0, { worstUlps: w.ledger.worstUlps, over: w.ledger.over, strict: w.ledger.strict, f32: w.ledger.f32, at: w.ledger.at });
  judge(`F4 water's readings within FIELD_LAW: RMS ≤ ${DE.rms.toExponential()}, 99.8 % ≤ ${DE.p998.toExponential()}, worst voxel ≤ ${DE.worst.toExponential()}, |Δρ|/ρmax ≤ ${DE.relToRhoMax.toExponential()}`,
    w.rms <= DE.rms && w.p998 <= DE.p998 && w.worst <= DE.worst && w.relToRhoMax <= DE.relToRhoMax && w.errs.length === 0,
    { rms: w.rms, p998: w.p998, worst: w.worst, relToRhoMax: w.relToRhoMax, at: w.at, errs: w.errs });
  judge('F5 one rounding mode on both molecules', h.mode === w.mode && h.mode !== 'neither', { hydrogen: h.mode, density: w.mode });

  /* ── P7d THE VIEW-INVARIANCE GATE: the modulation registry's base (the EXPOSURE and ISO knobs' road), the palette's select and switch,
       the FIELD QUALITY segments (GRID, PERFORMANCE) and the AUTO SCALE switch pressed twice — after each, settled, the three readings ── */
  const v = await g.ev(`${LIB}
    const R = LW.mod.registry, sol0 = LW.chem.solution();
    const seg = (label, text) => { const s = [...document.querySelectorAll('.segw')].find((x) => x.querySelector('.k-lbl') && x.querySelector('.k-lbl').textContent === label);
      const b = s && [...s.querySelectorAll('.seg-b')].find((x) => x.textContent === text); if (b) b.click(); return !!b; };
    const swi = (label) => { const b = [...document.querySelectorAll('button.sw')].find((x) => x.querySelector('.sw-lbl') && x.querySelector('.sw-lbl').textContent === label); if (b) b.click(); return !!b; };
    const read = async () => { const s = LW.chem.solution(), st = await LW.chem.workerStat();
      return { seq: s && s.seq, solverCalls: st && st.solverCalls, trDS: s && s.electrons, same: s === sol0, owner: LW.chem.state().on, res: F.stats.resolution,
        exposure: LW.mat.exposure, iso: LW.mat.iso, palette: LW.paletteId, palOn: LW.palette.on, steps: LW.quality.steps, perf: LW.perf.mode, auto: LW.quality.auto }; };
    const before = await read(), pal = LW.paletteGroups.flatMap((q) => q.items).find((id) => id !== LW.paletteId), rows = [];
    const STEPS = [['EXPOSURE 2.3', () => R.setBase('material.exposure', 2.3)], ['ISO 0.2', () => R.setBase('material.iso', 0.2)],
      ['PALETTE ' + pal, () => LW.setPalette(pal)], ['PALETTE switch', () => LW.palette.setOn(!LW.palette.on)],
      ['GRID 96³', () => seg('GRID', '96³')], ['GRID 128³', () => seg('GRID', '128³')], ['GRID 64³', () => seg('GRID', '64³')],
      ['PERFORMANCE FULL', () => seg('PERFORMANCE', 'FULL')], ['AUTO SCALE', () => swi('AUTO SCALE')], ['AUTO SCALE again', () => swi('AUTO SCALE')]];
    for (const [name, f] of STEPS) { const did = f() !== false; await settle(3); await new Promise((r) => setTimeout(r, 250)); rows.push({ name, did, ...(await read()) }); }
    return { before, pal, rows, errs: window.__e.slice() };`);
  const row = (n) => v.rows.find((r) => r.name.startsWith(n)) || {}, b0 = v.before;
  console.log(`READING invariance: sol.seq ${b0.seq} · solverCalls ${b0.solverCalls} · Tr(DS) ${b0.trDS} — then ` + v.rows.map((r) => `${r.name}: ${r.seq}/${r.solverCalls}/${r.trDS}`).join(' · '));
  const moved = { exposure: Math.abs(row('EXPOSURE').exposure - 2.3) < 1e-9, iso: Math.abs(row('ISO').iso - 0.2) < 1e-9, palette: row('PALETTE ' + v.pal).palette === v.pal,
    palOn: row('PALETTE switch').palOn !== b0.palOn, grid: [row('GRID 96').res, row('GRID 128').res, row('GRID 64').res].join() === '96,128,64',
    steps: [row('GRID 96').steps, row('GRID 128').steps, row('GRID 64').steps].join() === '160,240,110', perf: row('PERFORMANCE').perf === 'full',
    auto: row('AUTO SCALE again').auto !== v.rows.find((r) => r.name === 'AUTO SCALE').auto };
  judge('V1 every presentation change took effect (read back): exposure, ISO, palette + its switch, GRID 96³ → 128³ → 64³ with its steps, PERFORMANCE, AUTO SCALE',
    b0.owner && Object.values(moved).every(Boolean) && v.rows.every((r) => r.did), { moved, rows: v.rows.map((r) => [r.name, r.did, r.res, r.steps, r.perf, r.auto]) });
  judge(`V2 THE VIEW-INVARIANCE GATE: across all ${v.rows.length} changes sol.seq (${b0.seq}), workerStat().solverCalls (${b0.solverCalls}) and Tr(DS) (${b0.trDS}) never move, the solution is the same object`,
    Number.isFinite(b0.seq) && Number.isFinite(b0.solverCalls) && Number.isFinite(b0.trDS) && Math.abs(b0.trDS - 10) < 1e-9
      && v.rows.every((r) => r.seq === b0.seq && r.solverCalls === b0.solverCalls && r.trDS === b0.trDS && r.same && r.owner) && v.errs.length === 0,
    { before: b0, changed: v.rows.filter((r) => r.seq !== b0.seq || r.solverCalls !== b0.solverCalls || r.trDS !== b0.trDS || !r.same || !r.owner), errs: v.errs });
} catch (e) { judge('F! the gate threw', false, String(e && e.message || e)); } finally { await g.close(); }
const failed = done('field-law'), x = (v) => (Number.isFinite(v) ? v.toExponential(2) : '—'), I = (dev && dev.info) || {};
const adapter = I.description || [I.vendor, I.architecture, I.device].filter(Boolean).join(' ') || (dev && dev.info ? 'adapter info blank' : 'no adapter info');   // Firefox 157 gives every member ''
const browser = ((dev && dev.ua) || '').match(/(Firefox|Edg|Chrome|Version)\/[\d.]+/g)?.pop()?.replace('Version', 'Safari') || 'unknown browser';
let commit = '?'; try { commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim(); } catch (_) {}
console.log(`FIELD LAW · ${adapter} · ${browser} · ${commit} · hydrogen RMS ${x(h && h.rms)} · 99.8 % ${x(h && h.p998)} · worst ${x(h && h.worst)}`
  + ` · water RMS ${x(w && w.rms)} · worst/ρmax ${x(w && w.relToRhoMax)} · ${failed ? 'RED' : 'GREEN'}`);
process.exit(failed ? 1 : 0);
