/* tests/volumes-format.test.mjs — THE VOLUME FORMAT v1 (iteration 004 V1): the whole road on one small molecule.  The fixture
 * tests/fixtures/volumes/H2O.lwm is water at lab/molecules.js' own atoms, all six rungs, made by the pipeline itself
 * (tools/volumes/solve.py → tools/volumes/pack.mjs --out).  It parses (lab/volumes-format.js), every rung's record validates
 * (lab/library.js), the worker's chem.open opens each with 0 solver calls at the record's energy — and on STO-3G and 6-31+G* that
 * energy IS the app's own live RHF on the same atoms (≤ 1e-8 Eh: PySCF, the AO conversion, the f64 ε and the packer agree with
 * the app end to end); decodeRecord builds D from the every-column C and Tr(DS) = 10. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseLwm, rungs, rungRecord, espOf, encodeLwm } from '../lab/volumes-format.js';
import { validateRecord, decodeRecord, DENSITY_AO } from '../lab/library.js';
import { BASIS_FILES, moleculeRHF } from '../lab/rhf-molecule.js';
import { moleculeAtoms } from '../lab/molecules.js';
import { basisFrom, oneElectron } from '../lab/md.js';
import { MAX_MOL_AO } from '../lab/field.js';
import * as W from '../lab/mathworker.js';

const at = (rel) => new URL(rel, import.meta.url);
const bse = Object.fromEntries(Object.entries(BASIS_FILES).map(([k, f]) => [k, JSON.parse(readFileSync(at('../lab/vendor/bse/' + f), 'utf8'))]));
for (const [k, r] of Object.entries(bse)) W.chemRegister(k, r);
const bytes = readFileSync(at('./fixtures/volumes/H2O.lwm')), lwm = parseLwm(bytes);

/* the file: the header's identity, the app's atoms, the six rungs in ladder order */
assert.equal(lwm.header.id, 'H2O'); assert.equal(lwm.header.schema, 1);
const water = moleculeAtoms('H2O');
assert.deepEqual(lwm.header.geometry.atoms, water, 'the volume\'s water is lab/molecules.js\' water, bit for bit');
assert.deepEqual(rungs(lwm).map((r) => r.basis), Object.keys(BASIS_FILES), 'all six rungs, in the ladder\'s order');
assert.throws(() => parseLwm(Uint8Array.from(bytes, (b, i) => (i === 0 ? 0 : b))), /no LWM1 magic/);

let worstLive = 0, worstTr = 0;
for (const { basis, nAO } of rungs(lwm)) {
  const rec = rungRecord(lwm, basis);
  assert.deepEqual(validateRecord(rec), [], `${basis}: the rung's record validates`);
  assert.deepEqual(rec.ground.cols, [...Array(nAO).keys()], `${basis}: every column`);
  const before = W.chemSolverCalls(), o = W.chemOpen({ lib: rec, hash: null, basis });
  assert.equal(W.chemSolverCalls(), before, `${basis}: chem.open runs no solver`);
  assert.equal(o.energy, rec.ground.energy, `${basis}: chem.open answers the record's energy`);
  if (basis === 'sto-3g' || basis === '6-31+g-star') {
    const live = moleculeRHF({ atoms: water, basis, detect: false, stability: false, hessian: false });
    worstLive = Math.max(worstLive, Math.abs(live.energy - rec.ground.energy));
    assert(Math.abs(live.energy - rec.ground.energy) <= 1e-8, `${basis}: the volume's E ${rec.ground.energy} vs the app's live RHF ${live.energy}`);
  }
  /* DENSITY draws: the every-column record decodes with D = 2 Σ_occ c cᵀ, and it holds the ten electrons on the app's own S */
  const R = decodeRecord(rec), n = rec.ground.nAO, S = oneElectron(basisFrom(water, bse[basis]), []).S;
  assert(R.D instanceof Float64Array && R.D.length === n * n, `${basis}: decodeRecord built D`);
  let tr = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) tr += R.D[i * n + j] * S[j * n + i];
  worstTr = Math.max(worstTr, Math.abs(tr - 10));
  assert(Math.abs(tr - 10) < 1e-5, `${basis}: Tr(DS) = ${tr}, not 10 (C is f32: ~1e-7 is its precision)`);
}
/* iteration 014 C1 THE POTENTIAL GRID: a file without one reads null; one with one (an f16 blob in its rung, header.esp) reads back bit for bit */
assert.equal(espOf(lwm), null, 'the fixture predates the potential grid: espOf is null');
{ const top = '6-31+g-star', header = structuredClone(lwm.header), n = 4, f16 = Uint16Array.from({ length: n ** 3 }, (_, i) => 0x3c00 + i);
  const data = Object.fromEntries(Object.keys(header.rungs).map((b) => [b, Object.fromEntries(Object.keys(header.rungs[b].blobs).map((k) => [k, lwm.blob(b, k)]))]));
  data[top].esp = f16; header.esp = { basis: top, n, box: 7.5, min: -0.1, max: 12, charges: [-0.8, 0.4, 0.4], unit: 'Eh/e' };
  const back = parseLwm(encodeLwm(header, data)), e = espOf(back);
  assert(e && e.n === n && e.box === 7.5 && e.basis === top && e.f16 instanceof Uint16Array && e.f16.length === n ** 3 && e.f16.every((v, i) => v === f16[i]), 'espOf: { n, box, f16 } round-trips');
  assert.equal(rungRecord(back, top).ground.energy, rungRecord(lwm, top).ground.energy, 'the grid leaves the rung\'s record alone'); }
assert.equal(DENSITY_AO, MAX_MOL_AO, 'lab/library.js DENSITY_AO is lab/field.js MAX_MOL_AO (the density\'s χ tile)');
console.log(`PASS the volume format: H2O.lwm (${bytes.length} B) parses into ${rungs(lwm).length} rungs, each a valid every-column record chem.open opens with 0 solver calls; STO-3G and 6-31+G* equal the app's live RHF to ${worstLive.toExponential(1)} Eh; D decodes and Tr(DS) = 10 to ${worstTr.toExponential(1)} (f32 C).`);
