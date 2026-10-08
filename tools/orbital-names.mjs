#!/usr/bin/env node
/* tools/orbital-names.mjs — THE NAMES' CHECK (0.4.0 S1).  node, no dependencies, read-only on lab/.
 *
 *   node tools/orbital-names.mjs --check          every declared group applied to every framework; the ten probed anchors
 *                                                 solved and compared with names-probe.json; every enabled molecule's
 *                                                 configuration or its refusal reason.  Exit 1 on any failure.
 *   node tools/orbital-names.mjs --pyscf          add the one independent cross-check: water's irreps from PySCF's
 *                                                 symm.label_orb_symm (~/bin/scipython) against lab/names.js.
 *   node tools/orbital-names.mjs --json <file>    also write every record (for the hand-off).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { moleculeRHF, registerRecord } from '../lab/rhf-molecule.js';
import { MOLECULES, MOLECULE_BY_ID, moleculeAtoms, moleculeCharge } from '../lab/molecules.js';
import { nameOrbitals, operations, frameOf, selfTest, GROUP_IDS } from '../lab/names.js';

const ROOT = new URL('../', import.meta.url);
const args = process.argv.slice(2), has = (f) => args.includes(f);
const record = JSON.parse(readFileSync(new URL('lab/vendor/bse/sto-3g-v1.json', ROOT), 'utf8'));
registerRecord('sto-3g', record);
const probe = JSON.parse(readFileSync(new URL('research/molecular-orbitals-2026-10-01/names-probe.json', ROOT), 'utf8'));
let failures = 0;
const fail = (msg) => { failures++; console.log('FAIL ' + msg); };

/* 1 · the tables */
for (const g of GROUP_IDS.filter((g) => !/inf/.test(g))) { const r = selfTest(g); if (!r.ok) fail(`table ${g}: ${JSON.stringify(r)}`); }
console.log(`tables: ${GROUP_IDS.filter((g) => !/inf/.test(g)).map((g) => `${g}(${selfTest(g).order})`).join(' ')} — every one self-tests (orthogonality, Σdim² = h, the vector rep whole)`);

/* 2 · every declared operation on every framework (no solve needed) */
const geomRows = [];
for (const m of MOLECULES) {
  const s = m.symmetry, atoms = moleculeAtoms(m.id);
  if (s.group === 'C1' || /inf/.test(s.group)) { geomRows.push([m.id, s.group, 0]); continue; }
  const fr = frameOf(atoms, s.frame); let worst = 0;
  for (const { R } of operations(s.group)) {
    const F = fr.F, Rl = [0, 1, 2].flatMap((i) => [0, 1, 2].map((j) => { let t = 0; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) t += F[i * 3 + a] * R[a * 3 + b] * F[j * 3 + b]; return t; }));
    for (const a of atoms) {
      const d = [a.x - fr.c[0], a.y - fr.c[1], a.z - fr.c[2]], r = [0, 1, 2].map((i) => fr.c[i] + Rl[i * 3] * d[0] + Rl[i * 3 + 1] * d[1] + Rl[i * 3 + 2] * d[2]);
      let best = Infinity; for (const b of atoms) if (b.Z === a.Z) best = Math.min(best, Math.hypot(b.x - r[0], b.y - r[1], b.z - r[2]));
      worst = Math.max(worst, best);
    }
  }
  geomRows.push([m.id, s.group, worst]);
  if (worst > (s.geomTol || 1e-6)) fail(`${m.id}: declared ${s.group} moves an atom ${worst.toExponential(2)} bohr (tolerance ${s.geomTol || 1e-6})`);
}
console.log('frameworks: ' + geomRows.map(([id, g, w]) => `${id} ${g}${w > 1e-12 ? ' ' + w.toExponential(1) : ''}`).join(' · '));

/* 3 · solve and name every enabled molecule; the anchors against the probe */
const ANCHORS = ['H2O', 'NH3', 'CH4', 'N2', 'CO', 'HF', 'CO2', 'C2H4', 'H2CO', 'C6H6'];
const records = {}, rows = [];
const nameOf = (id, sol, atoms) => nameOrbitals({ atoms, S: sol.integrals.S, C: sol.C, eps: sol.orbitalEnergies, nocc: sol.nocc, basis: sol.basis, converged: sol.converged }, MOLECULE_BY_ID.get(id).symmetry);
for (const m of MOLECULES) {
  if (m.disabled) { rows.push(`| ${m.id} | ${m.symmetry.group} | — | disabled: ${m.shortReason} |`); continue; }
  const atoms = moleculeAtoms(m.id), t = performance.now();
  const sol = moleculeRHF({ atoms, basis: 'sto-3g', charge: moleculeCharge(m.id), record });
  const solveMs = performance.now() - t, r = nameOf(m.id, sol, atoms);
  records[m.id] = r;
  const homo = r.mos[sol.nocc - 1], lumo = r.mos[sol.nocc];
  rows.push(`| ${m.id} | ${m.symmetry.group} | ${r.ms.toFixed(1)} | ${r.reliable ? `${r.config} · HOMO ${homo.label}${lumo ? ' · LUMO ' + lumo.label : ''}${r.approximate ? ` · approximate (framework ${r.approximate.geometryBohr.toExponential(1)} bohr, residual ${r.residual.toExponential(1)})` : ''}${r.downgraded ? ` · ${r.group} (downgraded from ${r.downgraded.split(':')[0]})` : ''}` : 'NO NAMES: ' + r.reason} |`);
  if (ANCHORS.includes(m.id)) {
    const p = probe.molecules[m.id], fr = r.mos.map((x) => x.frontier.replace('−', '-')), pf = p.mos.map((x) => x.frontier);
    if (!r.reliable) fail(`${m.id}: anchor refused — ${r.reason}`);
    else if (r.config !== p.configuration) fail(`${m.id}: configuration ${r.config} ≠ probe ${p.configuration}`);
    else if (homo.label !== p.homoLabel || (lumo && lumo.label !== p.lumoLabel)) fail(`${m.id}: HOMO/LUMO ${homo.label}/${lumo && lumo.label} ≠ probe ${p.homoLabel}/${p.lumoLabel}`);
    else if (fr.join() !== pf.join()) fail(`${m.id}: frontier names differ from the probe's by-level names`);
    else console.log(`MATCH ${m.id.padEnd(5)} ${r.config}  HOMO ${homo.label} LUMO ${lumo && lumo.label}  ${r.ms.toFixed(1)} ms (solve ${solveMs.toFixed(0)} ms)`);
  }
}
console.log('\n| molecule | group | name ms | configuration (STO-3G) or why not |\n|---|---|---|---|\n' + rows.join('\n'));

/* 4 · the one independent cross-check: PySCF's label_orb_symm on water (C2v, the same pinned basis decimals) */
if (has('--pyscf')) {
  const py = `
import json
from pyscf import gto, scf, symm
rec = json.load(open(${JSON.stringify(new URL('lab/vendor/bse/sto-3g-v1.json', ROOT).pathname)}))
def pin(z):
    out = []
    for sh in rec['elements'][str(z)]['electron_shells']:
        e = [float(x) for x in sh['exponents']]
        for col, l in enumerate(sh['angular_momentum']):
            out.append([l] + [[e[i], float(sh['coefficients'][col][i])] for i in range(len(e))])
    return out
mol = gto.M(atom='O 0 0 0.1173; H 0 0.7572 -0.4692; H 0 -0.7572 -0.4692', basis={'O': pin(8), 'H': pin(1)}, cart=True, symmetry=True, verbose=0)
mf = scf.RHF(mol).run()
print(json.dumps({'group': mol.groupname, 'labels': list(symm.label_orb_symm(mol, mol.irrep_name, mol.symm_orb, mf.mo_coeff)), 'eps': list(mf.mo_energy)}))
`;
  mkdirSync(new URL('.tmp/', ROOT), { recursive: true }); writeFileSync(new URL('.tmp/pyscf-water.py', ROOT), py);
  try {
    const out = JSON.parse(execFileSync(process.env.HOME + '/bin/scipython', ['-I', new URL('.tmp/pyscf-water.py', ROOT).pathname], { encoding: 'utf8' }).trim().split('\n').pop());
    const ours = records.H2O.mos.map((m) => m.irrep.toUpperCase());
    /* PySCF puts the planar C2v molecule in its OWN frame (it re-orients); its B1/B2 may be our B2/B1 — compare both */
    const same = ours.join() === out.labels.join(), swapped = ours.map((g) => ({ B1: 'B2', B2: 'B1' }[g] || g)).join() === out.labels.join();
    console.log(`\nPySCF ${out.group} label_orb_symm (water): ${out.labels.join(' ')}\nlab/names.js:                     ${ours.join(' ')}\n${same ? 'MATCH (same frame)' : swapped ? 'MATCH under the stored alias (PySCF puts the molecule in its own frame: x ↔ y)' : 'DIFFERS'}`);
    if (!same && !swapped) fail('PySCF cross-check differs');
  } catch (e) { console.log('\nPySCF cross-check UNVERIFIED: ' + String(e.message || e).split('\n')[0]); }
}
/* 5 · THE LIBRARY'S RECORDS (0.4.0 S4b · ledger SYNTHESIS §4 C5).  Every record's names were made at generation by the
   projection (this file's nameOrbitals on the app's own solve): with --check, every record that declares a group is named in it
   (or says why), and its framework holds every operation; with --pyscf, PySCF solves every record's own atoms on the same pinned
   decimals (tools/library/record-oracle.py --dump) and THOSE orbitals are labelled by the same projection — every label must be
   the record's, the energy the record's oracle, and PySCF's own topgroup the one the record wrote down (recorded, never a name). */
const CAT = JSON.parse(readFileSync(new URL('lab/library.json', ROOT), 'utf8'));
const recOf = (row) => JSON.parse(readFileSync(new URL('lab/library/' + row.hash + '.json', ROOT), 'utf8'));
const libRows = [];
for (const row of CAT.rows) {
  const r = recOf(row), N = r.ground.names, sym = r.input.symmetry, atoms = r.input.atoms;
  if (sym.group !== 'C1') {
    const said = !N.reliable && r.stem.symmetry && r.stem.symmetry.labelledIn === null && /indices/.test(r.stem.symmetry.why || '');   // a record that SAYS it carries indices only (the water hexamer)
    if (!said && (!N.reliable || N.group !== sym.group)) fail(`${row.id}: declared ${sym.group}, the record's names ${N.reliable ? 'are in ' + N.group : 'refused: ' + N.reason}`);
    const fr = frameOf(atoms, sym.frame); let worst = 0;
    if (!/inf/.test(sym.group)) for (const { R } of operations(sym.group)) {
      const F = fr.F, Rl = [0, 1, 2].flatMap((i) => [0, 1, 2].map((j) => { let t = 0; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) t += F[i * 3 + a] * R[a * 3 + b] * F[j * 3 + b]; return t; }));
      for (const a of atoms) {
        const d = [a.x - fr.c[0], a.y - fr.c[1], a.z - fr.c[2]], q = [0, 1, 2].map((i) => fr.c[i] + Rl[i * 3] * d[0] + Rl[i * 3 + 1] * d[1] + Rl[i * 3 + 2] * d[2]);
        let best = Infinity; for (const b of atoms) if (b.Z === a.Z) best = Math.min(best, Math.hypot(b.x - q[0], b.y - q[1], b.z - q[2]));
        worst = Math.max(worst, best);
      }
    }
    if (worst > (sym.geomTol || 1e-6)) fail(`${row.id}: declared ${sym.group} moves an atom ${worst.toExponential(2)} bohr`);
  }
  libRows.push({ row, r });
}
console.log(`\nlibrary records: ${libRows.length} — ${libRows.map(({ row, r }) => `${row.id} ${r.ground.names.reliable ? r.ground.names.group : 'C1'}`).join(' · ')}`);
if (has('--pyscf')) {
  const { basisFrom } = await import('../lab/md.js');
  const inputs = { rows: libRows.map(({ row, r }) => ({ id: row.id, charge: r.input.charge, key: row.hash.slice(0, 16), atoms: r.input.atoms.map((a) => [a.Z, a.x, a.y, a.z]) })) };
  mkdirSync(new URL('.tmp/', ROOT), { recursive: true });
  const inFile = new URL('.tmp/names-records-inputs.json', ROOT).pathname, dumpFile = new URL('.tmp/names-records-pyscf.json', ROOT).pathname;
  writeFileSync(inFile, JSON.stringify(inputs));
  let dump = null;
  try { execFileSync(process.env.HOME + '/bin/scipython', ['-I', new URL('tools/library/record-oracle.py', ROOT).pathname, inFile, '--dump', dumpFile], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 26 });
    dump = JSON.parse(readFileSync(dumpFile, 'utf8')); } catch (e) { console.log('\nPySCF cross-check of the records UNVERIFIED: ' + String(e.message || e).split('\n')[0]); }
  if (dump) {
    const lines = [];
    for (const { row, r } of libRows) {
      const p = dump[row.id], atoms = r.input.atoms, sym = r.input.symmetry, N = r.ground.names;
      if (!p) { fail(`${row.id}: PySCF gave no answer`); continue; }
      const P = nameOrbitals({ atoms, S: Float64Array.from(p.S), C: Float64Array.from(p.C), eps: p.eps, nocc: p.nocc, basis: basisFrom(atoms, record), converged: p.converged }, sym);
      const dE = p.energy - r.oracle.energy, labels = N.mos.map((m) => m.label + '|' + m.frontier), pl = P.mos.map((m) => m.label + '|' + m.frontier);
      const same = P.reliable === N.reliable && P.group === N.group && pl.length === labels.length && pl.every((l, k) => l === labels[k]);
      const top = r.stem.symmetry && r.stem.symmetry.pyscf ? r.stem.symmetry.pyscf.topgroup : null;
      if (!same) fail(`${row.id}: PySCF's orbitals project to ${P.reliable ? P.group + ' ' + P.config : 'no names (' + P.reason + ')'}, the record says ${N.reliable ? N.group + ' ' + N.config : 'no names'}`);
      if (!(Math.abs(dE) <= 1e-8)) fail(`${row.id}: PySCF ${p.energy} is ${dE.toExponential(2)} Eh from the record's oracle`);
      const homo = N.mos[N.mos.findIndex((m) => m.frontier === 'LUMO') - 1] || {}, lumo = N.mos.find((m) => m.frontier === 'LUMO') || {};
      lines.push(`| ${row.id} | ${sym.group}${r.stem.symmetry && r.stem.symmetry.pointGroup !== sym.group ? ' (of ' + r.stem.symmetry.pointGroup + ')' : ''} | ${top} | ${same ? 'MATCH' : 'DIFFERS'} | ${N.reliable ? (homo.label || '—') + ' / ' + (lumo.label || '—') : 'index only (' + (sym.group === 'C1' ? 'C₁' : 'the record says why') + ')'} | ${dE.toExponential(1)} |`);
    }
    console.log('\n| record | labelled in | PySCF topgroup (recorded) | PySCF orbitals, same projection | HOMO / LUMO | ΔE PySCF − oracle |\n|---|---|---|---|---|---|\n' + lines.join('\n'));
  }
}
const jsonAt = args.indexOf('--json');
if (jsonAt >= 0) writeFileSync(args[jsonAt + 1], JSON.stringify(records, null, 1) + '\n');
console.log(failures ? `\n${failures} FAILURE(S)` : '\nOK — every anchor matches the probe; every enabled molecule is named or says why');
process.exit(failures ? 1 : 0);
