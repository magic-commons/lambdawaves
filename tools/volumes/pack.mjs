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
 *               solver's clocks) and this catalogue row (its digest) by this packer version (header.source) — a repack while the solver
 *               runs touches only what moved; a kept .lwm is looked for in every vol-<n>/ of the out dir, then of the data's dist (a
 *               theme may move a molecule); and the shelf follows the catalogue (iteration 006 C4): once every volume is written, each
 *               .lwm / .webp a volume's index no longer reaches is deleted (a refused molecule, one a theme moved, a pilot leftover), and
 *               with --themes a vol-<n>/ the shelf no longer has is emptied — never with --only
 *   --out-dir D the dist to write (default ~/Documents/LAMBDAWAVES-VOLUMES/dist); pack-report-<vol>.json goes beside it
 *   --sole      (iteration 006 C5) the volume(s) this run writes ARE the shelf — volumes.json lists them alone, and with --incremental
 *               every other vol-<n>/ of the out dir is emptied and removed (its pack-report-<vol>.json beside dist too), as --themes
 *               always does.  Without it a --volume run adds or replaces its one volume and leaves the others on the shelf.
 *               Josh, 2026-10-18 ("we can just mash them all up for now"): every finished molecule in ONE volume —
 *               node tools/volumes/pack.mjs --candidates …/vol-1.candidates.json --volume vol-1 --numeral I --title 'All the Molecules' --sole --incremental
 * THE METADATA (iteration 006 C3): a molecule's names, tags, synonyms, blurb and sources are its row in the CURRENT --candidates file by
 *   id (meta.candidate — the row a rung was last solved from — only for an id the file no longer has); see candidateOf()
 * THE SHELF (iteration 005 S; one primary theme, iteration 006 C3):
 *   --themes F  tools/volumes/themes.json: every FINISHED molecule to ONE theme — the first of the file's `precedence` steps it meets
 *               (`app`: the app's own table; `any`: a tag, `none`: … but not this one; no step: the `rest` theme; --count-themes: print the whole catalogue's
 *               counts and stop), a theme ordered by the catalogue's `priority`, split past --cap bytes (5e9) of .lwm + .webp
 *               into 'TITLE · 2' with the next numeral; writes dist/vol-<n>/ for each and ONE volumes.json (replacing the old one)
 *   --archive   per volume, dist/LAMBDAWAVES-VOL-<numeral>.lwv (lab/volumes-format.js THE ARCHIVE) and its .sha256; the shelf entry gains
 *               archive: { name, bytes, sha256 } and drops `index` unless --fetchable (the dev link; a Drive volume has no index)
 *
 * ONE-ATOM ENTRIES (iteration 008 V): a candidate whose raw meta holds one atom is skipped ("one atom: …"): atoms are the ATOMS road's.
 * PER RUNG — or the rung is REFUSED, never shipped (an AO-order bug must be impossible to ship):
 *   the app's basis: lab/md.js basisFrom on the vendored file (cart); its nAO is the solver's and its hash is the record's ground.hash
 *   the app's overlap S (md.js oneElectron): max|CᵀSC − I| ≤ 1e-8 in f64, BEFORE C is cast to f32; Tr(DS) = N_electrons (≤ 1e-8·N);
 *   the app's dipole (nuclear − Tr(D M)) agrees with PySCF's to 1e-6 e·a₀ and the app's nuclear repulsion with PySCF's to 1e-8 Eh
 *   the record: schema-1 FRONTIER (tools/orbital-library.mjs buildFrontier's shape) with EVERY column (ground.cols 0 … nAO−1),
 *   caps orbitals only; names from lab/names.js where the molecule declares a group the projection names reliably, else the
 *   indices-only form; validateRecord(record) = [] and chem.open answers its energy with 0 solver calls, or no file.
 *   ε and the energy are the solver's f64; C is f32 (7 digits: the picture's precision, stated in the header); Mulliken f32.
 * Deterministic bytes: no clock enters a .lwm, index.json or volumes.json (the solver's clocks stay in raw/); sha-256 per file. */
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync, readdirSync, copyFileSync, openSync, writeSync, closeSync, unlinkSync, rmdirSync } from 'node:fs';
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
import { encodeLwm, parseLwm, rungRecord, LWM_SCHEMA, LWV_MAGIC, parseLwv } from '../../lab/volumes-format.js';
import { chemRegister, chemOpen, chemSolverCalls } from '../../lab/mathworker.js';
import { MOLECULE_BY_ID } from '../../lab/molecules.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2), has = (f) => args.includes(f), argOf = (f, d = null) => (has(f) ? args[args.indexOf(f) + 1] : d);
const many = (f) => args.flatMap((a, i) => (a === f ? [args[i + 1]] : []));
const DATA = path.resolve(process.env.LW_VOLUMES || path.join(homedir(), 'Documents/LAMBDAWAVES-VOLUMES'));
const RAW = path.join(DATA, 'raw'), DIST = path.resolve((argOf('--out-dir') || path.join(DATA, 'dist')).replace(/^~/, homedir()));
const LOOK = [...new Set([DIST, path.join(DATA, 'dist')])];
const THEMES = argOf('--themes'), CAP = +argOf('--cap', 5e9), ARCHIVE = has('--archive'), FETCHABLE = has('--fetchable');
const VOL = argOf('--volume', 'vol-1'), NUMERAL = argOf('--numeral', 'I'), TITLE = argOf('--title', 'Volume ' + NUMERAL);
const BLURB = argOf('--blurb', 'Named molecules, each solved in RHF up the whole basis ladder STO-3G → 6-31+G*, with its identifiers and properties.');
const ONLY = argOf('--only') ? new Set(argOf('--only').split(',')) : null, PARTIAL = has('--partial'), OUT = argOf('--out'), INCREMENTAL = has('--incremental');
const PACKER = 'pack.mjs v3', CLOCKS = new Set(['updated', 'solved', 'pid', 'host', 'seconds']);                                      // bump when the packer's output changes, so --incremental repacks
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
const CANDS = new Map();                                           // id → its catalogue row (tags, priority, sources: THE SHELF's themes)
function members() {
  const ids = [];
  for (const f of many('--candidates')) for (const m of JSON.parse(readFileSync(f.replace(/^~/, homedir()), 'utf8')).molecules) { ids.push(m.id || m.app); if (!CANDS.has(m.id || m.app)) CANDS.set(m.id || m.app, m); }
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
const plainOf = (m) => [...m.replace(/<\/?m>/g, '')].map((c) => (SUB.includes(c) ? SUB.indexOf(c) : SUP.includes(c) ? SUP.indexOf(c) : c === '⁺' ? '+' : c === '⁻' ? '-' : c)).join('');   // the app's markup → plain ASCII
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

/* a kept file: the target volume's folder, then every other vol-<n>/ of the out dir, then of the data's dist */
const THUMB_STYLES = ['im', 'balls', 'sticks', 'esp'];                       // iteration 014 B4: the picture variants a row may name
const variantPaths = (r) => (r.thumbs || []).map((st) => 't/' + r.id + '.' + st + '.webp');
function findKept(vol, sub, name) {
  for (const d of LOOK) {
    const dirs = [vol, ...(existsSync(d) ? readdirSync(d).filter((e) => /^vol-\d+$/.test(e) && e !== vol).sort() : [])];
    for (const v of dirs) { const f = path.join(d, v, sub, name); if (existsSync(f)) return f; }
  }
  return null;
}
/* THE MOLECULE'S METADATA (iteration 006 C3): the CURRENT catalogue's row for this id (--candidates), so names, tags, synonyms, blurbs
   and sources are always the catalogue's — meta.candidate is only the row the solver last solved a rung from (a finished molecule is
   never touched again, so it kept the names and tags of its day).  meta.candidate is the fallback for an id the file no longer has.
   A field only the solved row carries (the pilot's symmetry, geometryMethod, identifiersChecked) is kept: it describes the solve.  The
   geometry's own words describe the ATOMS: when the catalogue has since moved this molecule's atoms (build.py --refresh-geometry; the
   solver will solve it again) geometrySource comes from the row it was solved at, so a .lwm never names a geometry it does not carry. */
const ANGSTROM = 1 / 0.52917721092;                                // tools/volumes/lwbasis.py's float: the solver's Å → bohr
const sameAtoms = (ang, bohr) => Array.isArray(ang) && Array.isArray(bohr) && ang.length === bohr.length
  && ang.every((a, i) => +a[0] === bohr[i][0] && a[1] * ANGSTROM === bohr[i][1] && a[2] * ANGSTROM === bohr[i][2] && a[3] * ANGSTROM === bohr[i][3]);
const STALE = [], FALLBACK = [];                                   // packed at atoms the catalogue has since moved · not in the catalogue
function candidateOf(id, meta) {
  const solvedAt = meta.candidate || {}, row = CANDS.get(id);
  if (!row) { FALLBACK.push(id); return solvedAt; }
  const cand = { ...solvedAt, ...row };
  if (row.atomsAng && !sameAtoms(row.atomsAng, meta.atomsBohr)) { STALE.push(id); cand.geometrySource = solvedAt.geometrySource; }
  return cand;
}
function packMolecule(id, vol = VOL) {
  const dir = path.join(RAW, id), mp = path.join(dir, 'meta.json');
  if (!existsSync(mp)) return { id, skip: 'not solved (no raw/' + id + '/meta.json)' };
  const meta = JSON.parse(readFileSync(mp, 'utf8')), charge = meta.charge || 0;
  /* iteration 008 V (Josh: "Atoms should not be in the molecules window"): a ONE-ATOM entry (VOL. I's Fe · Kr · Zn · Cr · Ni · Ti, PubChem compounds)
     is an atom — the ATOMS road's (the Picker's ATOMIC deck, goAtom) — and never ships in a volume; it is skipped with this sentence in the report */
  if (Array.isArray(meta.atomsBohr) && meta.atomsBohr.length === 1) return { id, skip: 'one atom: an atom is the ATOMS road\'s, not a volume molecule (iteration 008 V)' };
  const rs0 = meta.rungs || {};
  if (!PARTIAL && LADDER.some((b) => !rs0[b] || !rs0[b].status)) return { id, skip: 'its ladder is not finished (' + LADDER.filter((b) => !rs0[b] || !rs0[b].status).join(', ') + ')' };
  const cand = candidateOf(id, meta);
  const unclocked = (v) => (Array.isArray(v) ? v.map(unclocked) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).filter(([k]) => !CLOCKS.has(k)).map(([k, x]) => [k, unclocked(x)])) : v);
  const metaSha = sha(JSON.stringify(unclocked(meta)));          // what the rungs ARE, not when or where they were solved
  const candSha = sha(JSON.stringify(cand));                      // and what the catalogue says the molecule is (names, tags …)
  const have = INCREMENTAL && !OUT ? findKept(vol, 'm', id + '.lwm') : null;
  if (have) {
    const old = readFileSync(have), h = parseLwm(old).header;
    if (h.source && h.source.metaSha256 === metaSha && h.source.candSha256 === candSha && h.source.packer === PACKER) return { id, bytes: old, header: h, report: { id, heavy: h.meta.heavy, nAtoms: h.meta.nAtoms, rungs: {}, bytes: old.length, headerBytes: old.readUInt32LE(4), kept: true }, meta };
  }
  const atoms = meta.atomsBohr.map(([Z, x, y, z]) => ({ Z, x, y, z })), zs = atoms.map((a) => a.Z), N = zs.reduce((s, z) => s + z, 0) - charge, nocc = N / 2;
  const rs = rs0;
  /* an `app` candidate (the app's own molecule) takes the APP's formula (lab/molecules.js: NH₃, HBr, CO(NH₂)₂ — not Hill's H₃N, BrH); v2 */
  const h = hill(zs), appRow = cand.app ? MOLECULE_BY_ID.get(cand.app) : null, appM = appRow && (appRow.formula.startsWith('<m>') ? appRow.formula : '<m>' + appRow.formula + '</m>');
  const formula = appRow ? plainOf(appRow.formula) : plainFormula(h, charge), formulaM = appM || cand.formulaM || mFormula(h, charge);
  const sym = cand.symmetry && cand.symmetry.group ? cand.symmetry : { group: 'C1' };
  const name = cand.name || id, mass = +atoms.reduce((s, a) => s + MASS[a.Z], 0).toFixed(3), half = atoms.reduce((s, a) => Math.max(s, Math.abs(a.x), Math.abs(a.y), Math.abs(a.z)), 0) + 6;
  const geometrySource = cand.geometrySource || (cand.cid ? `PubChem CID ${cand.cid}, its 3-D conformer (computed, not measured)` : 'the candidate\'s atoms');
  const header = { schema: LWM_SCHEMA, id, volume: vol, meta: {}, geometry: {}, rungs: {}, skipped: {}, failed: {}, source: { metaSha256: metaSha, candSha256: candSha, packer: PACKER } };
  const { atomsAng, atomsBohr, app, ...rest } = cand; void atomsAng; void atomsBohr;
  header.meta = { name, formula, formulaM, charge, multiplicity: 1, heavy: zs.filter((z) => z > 1).length, nAtoms: atoms.length, mass, massUnit: 'u (IUPAC conventional atomic weights)',
    pointGroup: sym.group !== 'C1' ? sym.group : ({ Dooh: 'Dinfh', Coov: 'Cinfv' }[meta.detectedGroup] || meta.detectedGroup || null), ...rest, formula, formulaM, ...(app ? { app } : {}),   // the packer's formula wins over the candidate's (PubChem's Hill)
    precision: 'ε and E: the solver\'s f64; C: f32 (7 significant digits: the picture\'s precision; CᵀSC = I was checked in f64 before the cast)' };
  header.geometry = { atoms, atomsSha256: atomsKey(atoms), source: geometrySource, method: cand.geometryMethod || null, unit: 'bohr' };
  const blobs = {}, report = { id, heavy: header.meta.heavy, nAtoms: atoms.length, rungs: {} };
  for (const b of LADDER) {
    const r = rs[b];
    if (!r) continue;
    if (r.status === 'skipped') { header.skipped[b] = r.why; continue; }
    if (r.status === 'failed') { header.failed[b] = r.why; continue; }
    if (r.status === 'refused') { (header.refused ||= {})[b] = r.why; continue; }   // iteration 006: a linearly dependent rung (solve.py SMIN_REFUSE)
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
  for (const k of ['skipped', 'failed', 'refused']) if (header[k] && !Object.keys(header[k]).length) delete header[k];
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

/* a kept or provisional .lwm moved to another volume: only its header's `volume` changes (the blobs keep their order, so the bytes are
   exactly what packing it there would write) */
function retarget(r, vol) {
  if (r.header.volume === vol) return r;
  const lwm = parseLwm(r.bytes), header = lwm.header; header.volume = vol;
  const data = Object.fromEntries(Object.entries(header.rungs).map(([b, g]) => [b, Object.fromEntries(Object.keys(g.blobs).map((k) => [k, lwm.blob(b, k)]))]));
  return { ...r, bytes: encodeLwm(header, data), header };
}

/* ── THE SHELF's themes: ONE PRIMARY THEME PER MOLECULE (iteration 006 C3) — the file's `precedence` steps, read in order, the first
   a molecule meets naming its theme (`app`: the app's own table; `any`: a tag, unless it also carries one of the step's `none`); a file without `precedence` keeps iteration 005 S's
   first-match over the themes' own `any`.  An app molecule is one whose row says so (`app`, or a λWAVES source) ── */
const fromApp = (c) => !!c.app || (c.sources || []).some((x) => x && (x.db === 'λWAVES' || x === 'λWAVES'));
const meets = (s, c) => (s.app && fromApp(c)) || ((s.any || []).some((x) => (c.tags || []).includes(x)) && !(s.none || []).some((x) => (c.tags || []).includes(x)));
const themeOf = (T, c) => {
  const rest = T.findIndex((t) => t.rest), fallback = rest >= 0 ? rest : T.length - 1;
  if (PRECEDENCE) { const s = PRECEDENCE.find((p) => meets(p, c)); const k = s ? T.findIndex((t) => t.id === s.theme) : -1; return k >= 0 ? k : fallback; }
  const k = T.findIndex((t) => meets(t, c)); return k >= 0 ? k : fallback; };
const roman = (n) => [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
  .reduce((s, [v, r]) => { while (n >= v) { s += r; n -= v; } return s; }, '');
const pad8 = (n) => (n + 7) & ~7;

/* ── THE ARCHIVE: 'LWV1' · u32 H · the index JSON · pad to 8 · every file 8-aligned; deterministic (no clock; the same dist → the same bytes) ── */
function writeArchive(entry, rows, vdir) {
  const files = [{ path: 'index.json' }, ...rows.map((r) => ({ path: r.file })), ...rows.filter((r) => r.thumb).map((r) => ({ path: r.thumb })), ...rows.flatMap(variantPaths).map((f) => ({ path: f }))]
    .map((f) => { const b = readFileSync(path.join(vdir, f.path)); return { path: f.path, offset: 0, length: b.length, sha256: sha(b) }; });
  const volume = { ...entry };
  let base = 0, text = '', end = 0;
  for (;;) {                                                       // the offsets live in the index: iterate to its fixed point (its length only grows)
    end = base; for (const f of files) { f.offset = end; end = f.offset + f.length; end = pad8(end); }
    text = JSON.stringify({ schema: 1, volume, files });
    const nb = pad8(8 + Buffer.byteLength(text)); if (nb === base) break; base = nb;
  }
  const name = `LAMBDAWAVES-VOL-${entry.numeral}.lwv`, out = path.join(DIST, name), tmp = out + '.tmp', hash = createHash('sha256');
  const head = Buffer.alloc(base); head.write(LWV_MAGIC, 0, 'latin1'); head.writeUInt32LE(Buffer.byteLength(text), 4); head.write(text, 8, 'utf8');
  const fd = openSync(tmp, 'w'); let at = 0;
  const put = (b) => { writeSync(fd, b); hash.update(b); at += b.length; };
  put(head);
  for (const f of files) { if (f.offset > at) put(Buffer.alloc(f.offset - at)); put(readFileSync(path.join(vdir, f.path))); }
  closeSync(fd); renameSync(tmp, out);
  const digest = hash.digest('hex');
  writeFileSync(out + '.sha256', `${digest}  ${name}\n`);
  /* read back through the app's reader: the index parses and every file sits where it says, with its bytes */
  const back = readFileSync(out), idx = parseLwv(back.subarray(0, base));
  for (const f of idx.files) if (sha(back.subarray(f.offset, f.offset + f.length)) !== f.sha256) throw new Error(`${name}: ${f.path} does not read back`);
  return { name, bytes: at, sha256: digest };
}

/* ── the run ── */
const ids = members(), packed = [], reports = [], skipped = [];
if (OUT) {
  const r = packMolecule(argOf('--id'));
  if (!r.bytes) { console.log(`pack: ${r.id} — ${r.skip}`); process.exit(1); }
  mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true }); writeFileSync(OUT, r.bytes);
  console.log(`pack: ${r.id} → ${OUT} · ${r.bytes.length} B · rungs ${Object.keys(r.header.rungs).join(', ')} · sha256 ${sha(r.bytes).slice(0, 16)}`); process.exit(0);
}
const SHELF_DOC = THEMES ? JSON.parse(readFileSync(THEMES, 'utf8')) : null, T = SHELF_DOC ? SHELF_DOC.themes : null;
const PRECEDENCE = SHELF_DOC && SHELF_DOC.precedence;
const SOLE = !!T || has('--sole');                                 // this run's volumes are the whole shelf (iteration 006 C5)
if (PRECEDENCE) for (const s of PRECEDENCE) if (!T.some((t) => t.id === s.theme)) throw new Error(`${THEMES}: a precedence step names no theme (${s.theme})`);
if (T && has('--count-themes')) {                                  // the shelf the whole catalogue would make (finished or not), and stop
  const n = T.map(() => 0); for (const id of ids) n[themeOf(T, CANDS.get(id) || {})]++;
  console.log(`themes over ${ids.length} candidates: ` + T.map((t, k) => `${t.title} ${n[k]}`).join(' · ')); process.exit(0);
}
ids.forEach((id, order) => {
  const c = CANDS.get(id), guess = T && c ? 'vol-' + (themeOf(T, c) + 1) : VOL;   // the volume it most likely lands in (a split moves it: retarget)
  let r; try { r = packMolecule(id, guess); } catch (e) { console.log(`FAILED ${id}: ${e.message}`); skipped.push({ id, why: e.message }); return; }
  if (!r.bytes) { console.log(`skip ${id}: ${r.skip}`); skipped.push({ id, why: r.skip }); return; }
  packed.push({ ...r, order, info: c || r.header.meta });
});
let plan;
if (T) {
  const byTheme = T.map(() => []);
  for (const r of packed) byTheme[themeOf(T, r.info)].push(r);
  plan = [];
  T.forEach((t, k) => {
    const list = byTheme[k].sort((a, b) => (a.info.priority ?? Infinity) - (b.info.priority ?? Infinity) || a.order - b.order);
    let part = [], size = 0, n = 1;
    const flush = () => { if (part.length) plan.push({ theme: t, part: n++, members: part }); part = []; size = 0; };
    for (const r of list) {
      const th = findKept('vol-' + (k + 1), 't', r.id + '.webp'), b = r.bytes.length + (th ? readFileSync(th).length : 0);
      if (part.length && size + b > CAP) flush();
      part.push(r); size += b;
    }
    flush();
  });
  plan.forEach((p, i) => Object.assign(p, { id: 'vol-' + (i + 1), numeral: roman(i + 1), title: p.theme.title + (p.part > 1 ? ' · ' + p.part : ''), blurb: p.theme.blurb || BLURB }));
} else plan = [{ id: VOL, numeral: NUMERAL, title: TITLE, blurb: BLURB, members: packed }];

const entries = [], written = [];
for (const p of plan) {
  const VDIR = path.join(DIST, p.id), rows = [], vreports = [];
  mkdirSync(path.join(VDIR, 'm'), { recursive: true });
  for (const r0 of p.members) {
    const r = retarget(r0, p.id), id = r.id;
    const file = path.join(VDIR, 'm', id + '.lwm'), tmp = file + '.tmp';
    writeFileSync(tmp, r.bytes); renameSync(tmp, file);
    const thumbAt = path.join(VDIR, 't', id + '.webp'), th = findKept(p.id, 't', id + '.webp');
    if (th && path.resolve(th) !== thumbAt) { mkdirSync(path.dirname(thumbAt), { recursive: true }); copyFileSync(th, thumbAt); }
    /* iteration 014 B4 · THE VARIANTS: tools/menu-thumbs.mjs --style writes t/<id>.<style>.webp; each one kept is carried and the row names them in
       `thumbs` (the Picker's STYLE seg; a row without the key shows its one picture as before, and an index without variants is byte-identical) */
    const thumbs = THUMB_STYLES.filter((st) => { const at = path.join(VDIR, 't', id + '.' + st + '.webp'), k = findKept(p.id, 't', id + '.' + st + '.webp');
      if (k && path.resolve(k) !== at) { mkdirSync(path.dirname(at), { recursive: true }); copyFileSync(k, at); } return existsSync(at); });
    const M = r.header.meta;
    rows.push({ id, name: M.name, formula: M.formula, formulaM: M.formulaM, charge: M.charge, heavy: M.heavy, tags: M.tags || [], cid: M.cid || null, inchikey: M.inchikey || null,
      mw: M.mw != null ? M.mw : M.mass, pg: M.pointGroup || null, file: 'm/' + id + '.lwm', bytes: r.bytes.length, sha256: sha(r.bytes),
      thumb: existsSync(thumbAt) ? 't/' + id + '.webp' : null, ...(thumbs.length ? { thumbs } : {}),
      rungs: Object.fromEntries(Object.entries(r.header.rungs).map(([b, g]) => [b, { E: g.record.ground.energy, nAO: g.record.ground.nAO, gapEv: g.record.stem.gapEv }])),
      ...(r.header.skipped ? { skipped: Object.keys(r.header.skipped) } : {}), ...(r.header.failed ? { failed: Object.keys(r.header.failed) } : {}) });
    vreports.push(r.report); reports.push(r.report);
    console.log(`${p.id.padEnd(6)} ${id.padEnd(16)} ${String(M.heavy).padStart(3)} heavy · ${Object.keys(r.header.rungs).length} rungs · ${(r.bytes.length / 1024).toFixed(1)} KB (header ${(r.report.headerBytes / 1024).toFixed(1)} KB)`);
  }
  written.push({ dir: VDIR, reach: new Set(rows.flatMap((r) => [r.file, r.thumb, ...variantPaths(r)].filter(Boolean))) });
  const stale = readdirSync(path.join(VDIR, 'm')).filter((f) => f.endsWith('.lwm') && !rows.some((r) => r.file === 'm/' + f));
  const indexText = '{"schema":1,"id":' + JSON.stringify(p.id) + ',"numeral":' + JSON.stringify(p.numeral) + ',"title":' + JSON.stringify(p.title) + ',"bases":' + JSON.stringify(LADDER)
    + ',"generator":' + JSON.stringify({ tool: 'tools/volumes/pack.mjs', commit: GENERATOR, format: 'THE VOLUME FORMAT v1 (lab/volumes-format.js)' }) + ',"molecules":[\n'
    + rows.map((r) => JSON.stringify(r)).join(',\n') + '\n]}\n';
  writeFileSync(path.join(VDIR, 'index.json'), indexText);
  const tags = {}; for (const r of rows) for (const t of r.tags) tags[t] = (tags[t] || 0) + 1;
  const entry = { id: p.id, numeral: p.numeral, title: p.title, blurb: p.blurb, count: rows.length, bytes: rows.reduce((s, r) => s + r.bytes, 0), bases: LADDER,
    tags: Object.fromEntries(Object.entries(tags).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))), index: p.id + '/index.json', indexSha256: sha(indexText),
    built: { generator: 'tools/volumes/pack.mjs', commit: GENERATOR } };
  if (ARCHIVE) { if (!FETCHABLE) delete entry.index; entry.archive = writeArchive(entry, rows, VDIR); }
  entries.push(entry);
  writeFileSync(path.join(path.dirname(DIST), `pack-report-${p.id}.json`), JSON.stringify({ volume: p.id, molecules: vreports, skipped }, null, 1) + '\n');   // outside dist/: measurements, not content
  console.log(`pack: ${p.id} ${p.numeral} ${p.title} — ${rows.length} molecules (${(entry.bytes / 1048576).toFixed(2)} MiB), index.json ${indexText.length} B`
    + (entry.archive ? `, ${entry.archive.name} ${entry.archive.bytes} B sha256 ${entry.archive.sha256.slice(0, 16)}` : '')
    + (stale.length ? `; ${stale.length} .lwm in m/ no row reaches: ${stale.join(', ')}` : ''));
}
const shelfFile = path.join(DIST, 'volumes.json'), shelf = !SOLE && existsSync(shelfFile) ? JSON.parse(readFileSync(shelfFile, 'utf8')) : { schema: 1, volumes: [] };
shelf.volumes = [...shelf.volumes.filter((v) => !entries.some((e) => e.id === v.id)), ...entries].sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
writeFileSync(shelfFile, JSON.stringify(shelf, null, 1) + '\n');
/* THE SHELF MATCHES THE CATALOGUE (iteration 006 C4): with --incremental, a molecule no longer in the catalogue (a screen refused it),
   or no longer in that volume's theme (its tags moved it), LEAVES the volume — every .lwm and .webp in a written volume's m/ and t/ that
   its new index.json does not reach is deleted.  Only now, after every volume is written: a moved molecule's kept file and picture were
   read from its old volume first.  With --themes or --sole the shelf is the whole of volumes.json, so a vol-<n>/ it no longer has is
   emptied the same way and then removed (iteration 006 C5: its m/, t/ and the folder itself once empty — anything else left in it is
   named, not deleted — and its pack-report-<vol>.json beside dist).  Never with --only (that run writes a partial index) or --out. */
if (INCREMENTAL && !ONLY) {
  const pruned = [], kept = [];
  const prune = (dir, reach) => { for (const sub of ['m', 't']) { const d = path.join(dir, sub); if (!existsSync(d)) continue;
    for (const f of readdirSync(d)) if (/\.(lwm|webp)$/.test(f) && !reach.has(sub + '/' + f)) { unlinkSync(path.join(d, f)); pruned.push(path.relative(DIST, path.join(d, f))); } } };
  for (const w of written) prune(w.dir, w.reach);
  if (SOLE) for (const v of readdirSync(DIST).filter((e) => /^vol-\d+$/.test(e) && !plan.some((p) => p.id === e))) {
    const vdir = path.join(DIST, v);
    prune(vdir, new Set());
    if (existsSync(path.join(vdir, 'index.json'))) { unlinkSync(path.join(vdir, 'index.json')); pruned.push(v + '/index.json'); }
    for (const d of [path.join(vdir, 'm'), path.join(vdir, 't'), vdir]) {
      if (!existsSync(d)) continue;
      const left = readdirSync(d);
      if (left.length) { kept.push(...left.map((f) => path.relative(DIST, path.join(d, f)))); continue; }
      rmdirSync(d); pruned.push(path.relative(DIST, d) + '/');
    }
    const rep = path.join(path.dirname(DIST), `pack-report-${v}.json`);
    if (existsSync(rep)) { unlinkSync(rep); pruned.push('../' + path.basename(rep)); }
  }
  console.log(`pack: --incremental pruned ${pruned.length} file(s) no index reaches any more` + (pruned.length ? ': ' + pruned.join(', ') : '')
    + (kept.length ? `; left in place (not the packer's): ${kept.join(', ')}` : ''));
}
console.log(`pack: ${packed.length} molecules in ${entries.length} volume(s) → ${DIST}/volumes.json; ${skipped.length} not packed`
  + (STALE.length ? `; ${STALE.length} packed at solved atoms the catalogue has since moved (they will be solved again): ${STALE.join(', ')}` : '')
  + (FALLBACK.length ? `; ${FALLBACK.length} not in --candidates, packed with meta.candidate: ${FALLBACK.join(', ')}` : ''));
