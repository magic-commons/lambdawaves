// research only: the library geometries (bohr) of the molecules the wider 6-31+G* record covers
import fs from 'node:fs';
const M = await import('../../../lab/molecules.js');
const eng = JSON.parse(fs.readFileSync(new URL('./engine-631.json', import.meta.url), 'utf8'));
const out = eng.map((e) => ({ id: e.id, charge: M.moleculeCharge(e.id), atoms: M.moleculeAtoms(e.id).map((a) => [a.Z, a.x, a.y, a.z]) }));
fs.writeFileSync(new URL('./geoms-631.json', import.meta.url), JSON.stringify(out));
console.log(out.length, 'geometries');
