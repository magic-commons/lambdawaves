#!/usr/bin/env node
/* tools/volumes/pack.mjs — THE PACKER of the volume engine (iteration 004 V1, research/iteration-004/PLAN.md THE PIPELINE step 3).
 * The app's OWN code turns the solver's raw rungs (tools/volumes/solve.py → ~/Documents/LAMBDAWAVES-VOLUMES/raw) into THE VOLUME
 * FORMAT v1 (lab/volumes-format.js): dist/<vol>/m/<id>.lwm, dist/<vol>/index.json and dist/volumes.json.
 *
 *   node tools/volumes/pack.mjs --candidates ~/Documents/LAMBDAWAVES-VOLUMES/catalogue/vol-1.candidates.json [--app H2O,…]
 *        [--volume vol-1 --numeral I --title 'Volume I' --blurb '…'] [--only id,…] [--partial] [--out FILE.lwm --id H2O]
 *   --partial   also pack a molecule whose ladder is not finished (its converged rungs); by default only a finished one
 *   --out F     write ONE molecule's .lwm to F and nothing else (the test fixture: tests/fixtures/volumes/H2O.lwm)
 *   --incremental  keep a molecule's .lwm when its header says it was packed from this raw/<id>/meta.json (its digest without the
 *               solver's clocks) by this packer version (header.source) — a repack while the solver runs touches only what moved
 *
 * PER RUNG — or the rung is REFUSED, never shipped (an AO-order bug must be impossible to ship):
 *   the app's basis: lab/md.js basisFrom on the vendored file (cart); its nAO is the solver's and its hash is the record's ground.hash
 *   the app's overlap S (md.js oneElectron): max|CᵀSC − I| ≤ 1e-8 in f64, BEFORE C is cast to f32; Tr(DS) = N_electrons (≤ 1e-8·N);
 *   the app's dipole (nuclear − Tr(D M)) agrees with PySCF's to 1e-6 e·a₀ and the app's nuclear repulsion with PySCF's to 1e-8 Eh
 *   the record: schema-1 FRONTIER (tools/orbital-library.mjs buildFrontier's shape) with EVERY column (ground.cols 0 … nAO−1),
 *   caps orbitals only; names from lab/names.js where the molecule declares a group the projection names reliably, else the
 *   indices-only form; validateRecord(record) = [] and chem.open answers its energy with 0 solver calls, or no file.
 *   ε and the energy are the solver's f64; C is f32 (7 digits: the picture's precision, stated in the header); Mulliken f32.
 * Deterministic bytes: no clock enters a .lwm, index.json or volumes.json (the solver's clocks stay in raw/); sha-256 per file. */
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { basisFrom, oneElectron, nuclearRepulsion } from '../../lab/md.js';
import { BASIS_FILES } from '../../lab/rhf-molecule.js';
import { nameOrbitals, characters, coreCount, CONVENTION } from '../../lab/names.js';
import { stemOf, BASIS_LABEL } from '../../lab/latex-state.js';
import { validateRecord, atomsKey, SCHEMA } from '../../lab/library.js';
import { encodeLwm, parseLwm, rungRecord, LWM_SCHEMA } from '../../lab/volumes-format.js';
import { chemRegister, chemOpen, chemSolverCalls } from '../../lab/mathworker.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2), has = (f) => args.includes(f), argOf = (f, d = null) => (has(f) ? args[args.indexOf(f) + 1] : d);
const many = (f) => args.flatMap((a, i) => (a === f ? [args[i + 1]] : []));
const DATA = path.resolve(process.env.LW_VOLUMES || path.join(homedir(), 'Documents/LAMBDAWAVES-VOLUMES'));
const RAW = path.join(DATA, 'raw'), DIST = path.join(DATA, 'dist');
const VOL = argOf('--volume', 'vol-1'), NUMERAL = argOf('--numeral', 'I'), TITLE = argOf('--title', 'Volume ' + NUMERAL);
const BLURB = argOf('--blurb', 'Named molecules, each solved in RHF up the whole basis ladder STO-3G → 6-31+G*, with its identifiers and properties.');
const ONLY = argOf('--only') ? new Set(argOf('--only').split(',')) : null, PARTIAL = has('--partial'), OUT = argOf('--out'), INCREMENTAL = has('--incremental');
const PACKER = 'pack.mjs v1', CLOCKS = new Set(['updated', 'solved', 'pid', 'host', 'seconds']);                                      // bump when the packer's output changes, so --incremental repacks
const LADDER = Object.keys(BASIS_FILES);
const DEBYE = 2.541746473;                                         // debye per e·a₀ (tools/orbital-library.mjs)
const MASS = [0, 1.008, 4.0026, 6.94, 9.0122, 10.81, 12.011, 14.007, 15.999, 18.998, 20.180, 22.990, 24.305, 26.982, 28.085, 30.974, 32.06,
  35.45, 39.95, 39.098, 40.078, 44.956, 47.867, 50.942, 51.996, 54.938, 55.845, 58.933, 58.693, 63.546, 65.38, 69.723, 72.630, 74.922, 78.971, 79.904, 83.798];
const SYMBOL = ['X', 'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca',
  'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr'];
const sha = (b) => createHash('sha256').update(b).digest('hex');
const bse = Object.fromEntries(LADDER.map((k) => { const text = readFileSync(path.join(ROOT, 'lab/vendor/bse', BASIS_FILES[k]), 'utf8');
  return [k, { file: 'lab/vendor/bse/' + BASIS_FILES[k], text, rec: JSON.parse(text), sha: sha(text) }]; }));
for (const [k, b] of Object.entries(bse)) chemRegister(k, b.rec);
const GENERATOR = (() => { try { return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(); } catch (_) { return null; } })();

/* ── the solver's .npz, read here: a ZIP of .npy members, stored (numpy's savez), ZIP64 extras honoured ── */
function readNpz(file) {
  const z = readFileSync(file), out = {};
  let e = z.length - 22; while (e >= 0 && z.readUInt32LE(e) !== 0x06054b50) e--;
  if (e < 0) throw new Error(`${file}: not a zip`);
  let count = z.readUInt16LE(e + 10), cd = z.readUInt32LE(e + 16);
  if (cd === 0xffffffff || count === 0xffff) {                  // the ZIP64 end record, through its locator just before the end record
    const e64 = Number(z.readBigUInt64LE(e - 20 + 8)); count = Number(z.readBigUInt64LE(e64 + 32)); cd = Number(z.readBigUInt64LE(e64 + 48)); }
  for (let k = 0, p = cd; k < count; k++) {
    if (z.readUInt32LE(p) !== 0x02014b50) throw new Error(`${file}: a bad central directory`);
    const method = z.readUInt16LE(p + 10), nl = z.readUInt16LE(p + 28), xl = z.readUInt16LE(p + 30), cl = z.readUInt16LE(p + 32);
    let size = z.readUInt32LE(p + 20), off = z.readUInt32LE(p + 42);
    const name = z.toString('utf8', p + 46, p + 46 + nl);
    for (let x = p + 46 + nl, end = x + xl; x < end;) {          // the ZIP64 extra: the 0xffffffff fields, in order
      const id = z.readUInt16LE(x), len = z.readUInt16LE(x + 2); let q = x + 4;
      if (id === 1) { if (z.readUInt32LE(p + 24) === 0xffffffff) q += 8; if (size === 0xffffffff) { size = Number(z.readBigUInt64LE(q)); q += 8; } if (off === 0xffffffff) off = Number(z.readBigUInt64LE(q)); }
      x += 4 + len;
    }
    if (method !== 0) throw new Error(`${file}: ${name} is compressed (savez writes it stored)`);
    const data = off + 30 + z.readUInt16LE(off + 26) + z.readUInt16LE(off + 28);
    out[name.replace(/\.npy$/, '')] = readNpy(z.subarray(data, data + size), name);
    p += 46 + nl + xl + cl;
  }
  return out;
}
function readNpy(b, name) {
  if (b[0] !== 0x93 || b.toString('latin1', 1, 6) !== 'NUMPY') throw new Error(`${name}: not .npy`);
  const major = b[6], hl = major === 1 ? b.readUInt16LE(8) : b.readUInt32LE(8), h0 = major === 1 ? 10 : 12;
  const head = b.toString('latin1', h0, h0 + hl), descr = /'descr':\s*'([^']+)'/.exec(head)[1];
  const shape = /'shape':\s*\(([^)]*)\)/.exec(head)[1].split(',').map((s) => s.trim()).filter(Boolean).map(Number);
  if (/'fortran_order':\s*True/.test(head)) throw new Error(`${name}: Fortran order`);
  const body = b.subarray(h0 + hl), n = shape.reduce((a, c) => a * c, 1), copy = (T, w) => new T(body.buffer.slice(body.byteOffset, body.byteOffset + n * w));
  let data;
  if (descr === '<f8') data = copy(Float64Array, 8); else if (descr === '<i4') data = copy(Int32Array, 4); else if (descr === '<i8') data = Array.from(copy(BigInt64Array, 8), Number);
  else if (/^<U\d+$/.test(descr)) { const w = +descr.slice(2); data = []; for (let i = 0; i < n; i++) { let s = ''; for (let c = 0; c < w; c++) { const u = body.readUInt32LE((i * w + c) * 4); if (!u) break; s += String.fromCodePoint(u); } data.push(s); } }
  else throw new Error(`${name}: dtype ${descr} is not read here`);
  return { shape, data };
}

/* ── the molecules: the candidates' ids, in their order ── */
function members() {
  const ids = [];
  for (const f of many('--candidates')) for (const m of JSON.parse(readFileSync(f.replace(/^~/, homedir()), 'utf8')).molecules) ids.push(m.id || m.app);
  for (const s of (argOf('--app') || '').split(',').filter(Boolean)) ids.push(s);
  if (OUT) ids.push(argOf('--id'));
  return [...new Set(ids)].filter((id) => id && (!ONLY || ONLY.has(id)));
}
const SUB = '₀₁₂₃₄₅₆₇₈₉', SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
function hill(zs) {
  const n = {}; for (const Z of zs) n[Z] = (n[Z] || 0) + 1;
  const rank = (Z) => (n[6] ? (Z === 6 ? 0 : Z === 1 ? 1 : 2) : 2);
  return Object.keys(n).map(Number).sort((a, b) => rank(a) - rank(b) || SYMBOL[a].localeCompare(SYMBOL[b])).map((Z) => [SYMBOL[Z], n[Z]]);
}
const plainFormula = (h, q) => h.map(([s, c]) => s + (c > 1 ? c : '')).join('') + (q ? (Math.abs(q) > 1 ? Math.abs(q) : '') + (q > 0 ? '+' : '-') : '');
const mFormula = (h, q) => '<m>' + h.map(([s, c]) => s + (c > 1 ? [...String(c)].map((d) => SUB[+d]).join('') : '')).join('')
  + (q ? (Math.abs(q) > 1 ? [...String(Math.abs(q))].map((d) => SUP[+d]).join('') : '') + (q > 0 ? '⁺' : '⁻') : '') + '</m>';

/* ── the app's own numbers on the solver's C ── */
function appChecks(C, n, nocc, S, M, atoms) {
  const SC = new Float64Array(n * n);
  for (let i = 0; i < n; i++) { const Si = i * n; for (let k = 0; k < n; k++) { const s = S[Si + k]; if (s === 0) continue; const Ck = k * n; for (let j = 0; j < n; j++) SC[Si + j] += s * C[Ck + j]; } }
  let worst = 0, tr = 0;
  const G = new Float64Array(n);                                 // one row of CᵀSC at a time
  for (let a = 0; a < n; a++) {
    G.fill(0);
    for (let i = 0; i < n; i++) { const c = C[i * n + a]; if (c === 0) continue; const Si = i * n; for (let b = 0; b < n; b++) G[b] += c * SC[Si + b]; }
    for (let b = 0; b < n; b++) worst = Math.max(worst, Math.abs(G[b] - (a === b ? 1 : 0)));
    if (a < nocc) tr += 2 * G[a];
  }
  const nuc = [0, 1, 2].map((q) => atoms.reduce((s, A) => s + A.Z * [A.x, A.y, A.z][q], 0));
  const dip = nuc.map((v, q) => { let t = 0; const Mq = M[q];
    for (let k = 0; k < nocc; k++) for (let i = 0; i < n; i++) { const ci = C[i * n + k]; if (ci === 0) continue; let s = 0; for (let j = 0; j < n; j++) s += Mq[i * n + j] * C[j * n + k]; t += 2 * ci * s; }
    return v - t; });
  return { orthonormality: worst, electrons: tr, dipole: dip };
}

function packMolecule(id) {
  const dir = path.join(RAW, id), mp = path.join(dir, 'meta.json');
  if (!existsSync(mp)) return { id, skip: 'not solved (no raw/' + id + '/meta.json)' };
  const meta = JSON.parse(readFileSync(mp, 'utf8')), cand = meta.candidate || {}, charge = meta.charge || 0;
  const unclocked = (v) => (Array.isArray(v) ? v.map(unclocked) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).filter(([k]) => !CLOCKS.has(k)).map(([k, x]) => [k, unclocked(x)])) : v);
  const metaSha = sha(JSON.stringify(unclocked(meta)));          // what the rungs ARE, not when or where they were solved
  const have = path.join(DIST, VOL, 'm', id + '.lwm');
  if (INCREMENTAL && !OUT && existsSync(have)) {
    const old = readFileSync(have), h = parseLwm(old).header;
    if (h.source && h.source.metaSha256 === metaSha && h.source.packer === PACKER) return { id, bytes: old, header: h, report: { id, heavy: h.meta.heavy, nAtoms: h.meta.nAtoms, rungs: {}, bytes: old.length, headerBytes: old.readUInt32LE(4), kept: true }, meta };
  }
  const atoms = meta.atomsBohr.map(([Z, x, y, z]) => ({ Z, x, y, z })), zs = atoms.map((a) => a.Z), N = zs.reduce((s, z) => s + z, 0) - charge, nocc = N / 2;
  const rs = meta.rungs || {}, todo = LADDER.filter((b) => rs[b] && rs[b].status !== 'skipped');
  const unsolved = LADDER.filter((b) => !rs[b] || !rs[b].status);
  if (unsolved.length && !PARTIAL) return { id, skip: 'its ladder is not finished (' + unsolved.join(', ') + ')' };
  const h = hill(zs), formula = plainFormula(h, charge), formulaM = cand.formulaM || mFormula(h, charge);
  const sym = cand.symmetry && cand.symmetry.group ? cand.symmetry : { group: 'C1' };
  const name = cand.name || id, mass = +atoms.reduce((s, a) => s + MASS[a.Z], 0).toFixed(3), half = atoms.reduce((s, a) => Math.max(s, Math.abs(a.x), Math.abs(a.y), Math.abs(a.z)), 0) + 6;
  const geometrySource = cand.geometrySource || (cand.cid ? `PubChem CID ${cand.cid}, its 3-D conformer (computed, not measured)` : 'the candidate\'s atoms');
  const header = { schema: LWM_SCHEMA, id, volume: VOL, meta: {}, geometry: {}, rungs: {}, skipped: {}, failed: {}, source: { metaSha256: metaSha, packer: PACKER } };
  const { atomsAng, atomsBohr, app, ...rest } = cand; void atomsAng; void atomsBohr;
  header.meta = { name, formula, formulaM, charge, multiplicity: 1, heavy: zs.filter((z) => z > 1).length, nAtoms: atoms.length, mass, massUnit: 'u (IUPAC conventional atomic weights)',
    pointGroup: sym.group !== 'C1' ? sym.group : ({ Dooh: 'Dinfh', Coov: 'Cinfv' }[meta.detectedGroup] || meta.detectedGroup || null), ...rest, ...(app ? { app } : {}),
    precision: 'ε and E: the solver\'s f64; C: f32 (7 significant digits: the picture\'s precision; CᵀSC = I was checked in f64 before the cast)' };
  header.geometry = { atoms, atomsSha256: atomsKey(atoms), source: geometrySource, method: cand.geometryMethod || null, unit: 'bohr' };
  const blobs = {}, report = { id, heavy: header.meta.heavy, nAtoms: atoms.length, rungs: {} };
  for (const b of LADDER) {
    const r = rs[b];
    if (!r) continue;
    if (r.status === 'skipped') { header.skipped[b] = r.why; continue; }
    if (r.status === 'failed') { header.failed[b] = r.why; continue; }
    if (r.status !== 'converged') continue;
    if (r.basisSha256 !== bse[b].sha) throw new Error(`${id}/${b}: solved on another basis file (${r.basisSha256.slice(0, 12)} ≠ ${bse[b].sha.slice(0, 12)})`);
    const z = readNpz(path.join(dir, r.file)), basis = basisFrom(atoms, bse[b].rec, { cart: true }), n = basis.n;
    if (z.C.shape[0] !== n || z.C.shape[1] !== n || z.eps.data.length !== n) throw new Error(`${id}/${b}: the solver's ${z.C.shape.join('×')} C is not the app's ${n} AOs`);
    const C = z.C.data, eps = z.eps.data, energy = z.energy.data[0];
    const { S, M } = oneElectron(basis, []);
    const ck = appChecks(C, n, nocc, S, M, atoms), pyDip = Array.from(z.dipole.data, (v) => v / DEBYE);
    const dDip = Math.max(...ck.dipole.map((v, q) => Math.abs(v - pyDip[q]))), Enuc = nuclearRepulsion(atoms), dNuc = Math.abs(Enuc - z.enuc.data[0]);
    const why = !(ck.orthonormality <= 1e-8) ? `max|CᵀSC − I| = ${ck.orthonormality.toExponential(2)} > 1e-8: the AO order or normalisation is not the app's`
      : !(Math.abs(ck.electrons - N) <= 1e-8 * N) ? `Tr(DS) = ${ck.electrons} ≠ ${N} electrons`
      : !(dDip <= 1e-6) ? `the app's dipole misses PySCF's by ${dDip.toExponential(2)} e·a₀` : !(dNuc <= 1e-8) ? `the nuclear repulsion misses PySCF's by ${dNuc}` : null;
    if (why) { header.failed[b] = 'REFUSED by the packer: ' + why; report.rungs[b] = { refused: why }; console.log(`REFUSED ${id}/${b}: ${why}`); continue; }
    /* the names: the declared group where the projection names every level, else the indices-only form */
    const input = { atoms, S, C, eps, nocc, basis, converged: true };
    let names = nameOrbitals(input, sym);
    if (sym.group !== 'C1' && !names.reliable) { const why2 = names.reason; names = nameOrbitals(input, { group: 'C1' }); names.reason = `declared ${sym.group}, but the projection did not name these orbitals (${why2}): indices only`; }
    const ch = characters(input, names); names.mos.forEach((mo, i) => { mo.character = ch[i]; });
    names.core = Math.min(coreCount(atoms), nocc); delete names.axes; delete names.ms;
    const st = stemOf({ eps, nocc, names });
    const ground = { energy, Enuc, nocc, nAO: n, order: basis.order, hash: basis.hash, basis: b, charge, electrons: N, converged: true, dipole: ck.dipole, half,
      stability: null, solutions: [], names, cols: Array.from({ length: n }, (_, k) => k) };
    const record = {
      schema: SCHEMA, kind: 'lambdawaves.orbital-record', id, basis: b, name, formula: formulaM,
      generator: `tools/volumes/pack.mjs — PySCF ${r.solver.pyscf} RHF (tools/volumes/solve.py) re-encoded by the app: every column, checked on the app's own overlap`,
      input: { atoms, atomsSha256: atomsKey(atoms), charge, multiplicity: 1, basis: b, basisFile: bse[b].file, basisSha256: bse[b].sha, symmetry: sym },
      caps: { orbitals: true, states: false, rpa: false, tdhf: false },
      ground, orbitals: { eps: { $blob: 'eps' }, C: { $blob: 'C' } },
      stem: { formula: formulaM, pointGroup: st.pointGroup, frame: names.frame || null, approximate: !!names.approximate, mass, massUnit: 'u (IUPAC conventional atomic weights)',
        charge, multiplicity: 1, dipoleDebye: +(Math.hypot(...ck.dipole) * DEBYE).toFixed(4), gapEh: st.gapEh, gapEv: st.gapEv, homo: st.homo, geometrySource,
        inchiKey: cand.inchikey || null, pubchemCid: cand.cid || null, identifiers: cand.cid ? 'PubChem PUG REST (the candidate\'s, ' + (cand.identifiersChecked || 'as fetched') + ')' : 'none recorded',
        symmetry: { pointGroup: sym.group, labelledIn: names.reliable ? names.group : null, why: names.reason || 'labelled by projection in the declared group (lab/names.js)', frame: CONVENTION[sym.group] || null, atomsInFrame: null, pyscf: null },
        blurb: cand.blurb ? [cand.blurb] : [], ies: null,
        sources: [...(cand.sources || []), 'geometry: ' + geometrySource, `orbitals and energy: PySCF ${r.solver.pyscf} RHF, cart=True, every AO, conv_tol ${r.solver.convTol} (tools/volumes/solve.py)`, 'basis: ' + bse[b].file + ' (Basis Set Exchange, vendored)'] },
      oracle: { energy, source: 'the record IS the solver\'s (tools/volumes/solve.py)', what: `PySCF ${r.solver.pyscf} RHF on the vendored ${BASIS_LABEL[b]} decimals`, delta: 0 },
    };
    header.rungs[b] = { record, blobs: {}, solve: { solver: `PySCF ${r.solver.pyscf} RHF, cart=True, every AO (tools/volumes/solve.py)`, conv_tol: r.solver.convTol, conv_tol_grad: r.solver.convTolGrad,
      converged: true, cycles: r.cycles, guess: r.guess, attempts: r.attempts.map((a) => a.method + ' · ' + a.cycles + ' cycles' + (a.converged ? '' : ' (not converged)')), minEigS: r.minEigS },
      check: { orthonormality: ck.orthonormality, electrons: ck.electrons, dipoleDelta: dDip, enucDelta: dNuc, appBasisHash: basis.hash } };
    blobs[b] = { eps: Float64Array.from(eps), C: Float32Array.from(C), mulliken: Float32Array.from(z.mulliken.data) };
    report.rungs[b] = { nAO: n, Cbytes: n * n * 4, epsBytes: n * 8, orthonormality: ck.orthonormality, names: names.reliable ? names.group : 'indices' };
  }
  if (!Object.keys(header.rungs).length) return { id, skip: 'no rung converged' };
  for (const k of ['skipped', 'failed']) if (!Object.keys(header[k]).length) delete header[k];
  const bytes = encodeLwm(header, blobs);
  /* read back through the reader the app uses: every rung validates and opens through chem.open, 0 solver calls, its own energy */
  const lwm = parseLwm(bytes);
  for (const b of Object.keys(header.rungs)) {
    const rec = rungRecord(lwm, b), bad = validateRecord(rec);
    if (bad.length) throw new Error(`${id}/${b}: the record does not validate — ${bad.join('; ')}`);
    const before = chemSolverCalls(), o = chemOpen({ lib: rec, hash: null, basis: b });
    if (chemSolverCalls() !== before || o.energy !== header.rungs[b].record.ground.energy) throw new Error(`${id}/${b}: chem.open does not answer the record's energy with 0 solver calls`);
  }
  report.bytes = bytes.length; report.headerBytes = new DataView(bytes.buffer).getUint32(4, true);
  return { id, bytes, header, report, meta };
}

/* ── the run ── */
const ids = members(), rows = [], reports = [], skipped = [];
if (OUT) {
  const r = packMolecule(argOf('--id'));
  if (!r.bytes) { console.log(`pack: ${r.id} — ${r.skip}`); process.exit(1); }
  mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true }); writeFileSync(OUT, r.bytes);
  console.log(`pack: ${r.id} → ${OUT} · ${r.bytes.length} B · rungs ${Object.keys(r.header.rungs).join(', ')} · sha256 ${sha(r.bytes).slice(0, 16)}`); process.exit(0);
}
const VDIR = path.join(DIST, VOL); mkdirSync(path.join(VDIR, 'm'), { recursive: true });
for (const id of ids) {
  let r; try { r = packMolecule(id); } catch (e) { console.log(`FAILED ${id}: ${e.message}`); skipped.push({ id, why: e.message }); continue; }
  if (!r.bytes) { console.log(`skip ${id}: ${r.skip}`); skipped.push({ id, why: r.skip }); continue; }
  const file = path.join(VDIR, 'm', id + '.lwm'), tmp = file + '.tmp';
  writeFileSync(tmp, r.bytes); renameSync(tmp, file);
  const M = r.header.meta;
  rows.push({ id, name: M.name, formula: M.formula, formulaM: M.formulaM, charge: M.charge, heavy: M.heavy, tags: M.tags || [], cid: M.cid || null, inchikey: M.inchikey || null,
    mw: M.mw != null ? M.mw : M.mass, pg: M.pointGroup || null, file: 'm/' + id + '.lwm', bytes: r.bytes.length, sha256: sha(r.bytes),
    thumb: existsSync(path.join(VDIR, 't', id + '.webp')) ? 't/' + id + '.webp' : null,
    rungs: Object.fromEntries(Object.entries(r.header.rungs).map(([b, g]) => [b, { E: g.record.ground.energy, nAO: g.record.ground.nAO, gapEv: g.record.stem.gapEv }])),
    ...(r.header.skipped ? { skipped: Object.keys(r.header.skipped) } : {}), ...(r.header.failed ? { failed: Object.keys(r.header.failed) } : {}) });
  reports.push(r.report);
  console.log(`${id.padEnd(16)} ${String(M.heavy).padStart(3)} heavy · ${Object.keys(r.header.rungs).length} rungs · ${(r.bytes.length / 1024).toFixed(1)} KB (header ${(r.report.headerBytes / 1024).toFixed(1)} KB)`);
}
const stale = readdirSync(path.join(VDIR, 'm')).filter((f) => f.endsWith('.lwm') && !rows.some((r) => r.file === 'm/' + f));
const indexText = '{"schema":1,"id":' + JSON.stringify(VOL) + ',"numeral":' + JSON.stringify(NUMERAL) + ',"title":' + JSON.stringify(TITLE) + ',"bases":' + JSON.stringify(LADDER)
  + ',"generator":' + JSON.stringify({ tool: 'tools/volumes/pack.mjs', commit: GENERATOR, format: 'THE VOLUME FORMAT v1 (lab/volumes-format.js)' }) + ',"molecules":[\n'
  + rows.map((r) => JSON.stringify(r)).join(',\n') + '\n]}\n';
writeFileSync(path.join(VDIR, 'index.json'), indexText);
const tags = {}; for (const r of rows) for (const t of r.tags) tags[t] = (tags[t] || 0) + 1;
const shelfFile = path.join(DIST, 'volumes.json'), shelf = existsSync(shelfFile) ? JSON.parse(readFileSync(shelfFile, 'utf8')) : { schema: 1, volumes: [] };
const entry = { id: VOL, numeral: NUMERAL, title: TITLE, blurb: BLURB, count: rows.length, bytes: rows.reduce((s, r) => s + r.bytes, 0), bases: LADDER,
  tags: Object.fromEntries(Object.entries(tags).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))), index: VOL + '/index.json', indexSha256: sha(indexText),
  built: { generator: 'tools/volumes/pack.mjs', commit: GENERATOR } };
shelf.volumes = [...shelf.volumes.filter((v) => v.id !== VOL), entry].sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
writeFileSync(shelfFile, JSON.stringify(shelf, null, 1) + '\n');
writeFileSync(path.join(DATA, `pack-report-${VOL}.json`), JSON.stringify({ volume: VOL, molecules: reports, skipped }, null, 1) + '\n');   // outside dist/: measurements, not content
console.log(`pack: ${rows.length} molecules → ${path.relative(DATA, VDIR)}/ (${(entry.bytes / 1048576).toFixed(2)} MiB), index.json ${indexText.length} B, volumes.json; ${skipped.length} not packed`
  + (stale.length ? `; ${stale.length} .lwm in m/ no row reaches: ${stale.join(', ')}` : ''));
