#!/usr/bin/env node
/* tools/volumes/app-atoms.mjs — the app's own molecules, as the volume pipeline takes them (iteration 004 V1).
 *   node tools/volumes/app-atoms.mjs H2O NH3 TiCl4      → JSON on stdout: { molecules: [ candidate, … ] }
 * Each is a candidate in the catalogue's shape ({ id, name, charge, atomsBohr, … }) at the app's PINNED geometry: the atoms in
 * bohr exactly as lab/molecules.js moleculeAtoms gives them (the live table and the library rows alike), so a volume rung and the
 * app's own live solve are the same calculation.  tools/volumes/solve.py calls this for a candidate that names `app` and no atoms. */
import { MOLECULE_BY_ID, moleculeAtoms, moleculeCharge } from '../../lab/molecules.js';

const ids = process.argv.slice(2);
const molecules = ids.map((id) => {
  const m = MOLECULE_BY_ID.get(id);
  if (!m) throw new Error(`app-atoms: '${id}' is not a molecule of lab/molecules.js (the live table or a library row)`);
  return { id, app: id, name: m.name, formulaM: m.formula, charge: moleculeCharge(id) || 0, multiplicity: m.multiplicity || 1,
    atomsBohr: moleculeAtoms(id).map((a) => [a.Z, a.x, a.y, a.z]), symmetry: m.symmetry || { group: 'C1' },
    geometrySource: m.source || null, geometryMethod: 'the app\'s pinned geometry (lab/molecules.js)' };
});
process.stdout.write(JSON.stringify({ molecules }) + '\n');
