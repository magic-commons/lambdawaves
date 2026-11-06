/* tools/diagrams/dump.mjs — THE DIAGRAMS' INPUT (037 D1 · D4): the molecules' own coordinates, for tools/diagrams/draw.py (README.md).
 *
 *   node tools/diagrams/dump.mjs                     → tools/diagrams/catalogue.json  [{ id, charge, ang: [[Z, x, y, z] Å …] }]
 *                                                      every row of the store (lab/molecules.js MOLECULES + RECORD_ONLY), CuH and ZnH₂ included
 *   node tools/diagrams/dump.mjs --volume vol-3      → tools/diagrams/vol-3.json  { volume, indexSha256, size, molecules: [{ id, charge, ang, bonds, smiles }] }
 *                                                      in THE INDEX'S ORDER (a page is `size` molecules of it: page p = rows p·size … p·size + size − 1,
 *                                                      the deck's own order when no sort is pressed); the coordinates, bonds and SMILES from each .lwm's
 *                                                      header (bohr → Å); a row whose .lwm is missing is { id } alone
 * The shelf is $LW_VOLUMES/dist (default ~/Documents/LAMBDAWAVES-VOLUMES/dist). Nothing here writes outside tools/diagrams/. */
import { openSync, readSync, closeSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';

export const PAGE = 100;            // molecules per page (a sheet of 10 × 10 tiles at 160 px)
const BOHR = 0.529177210903;        // Å per bohr (CODATA 2018)
const HERE = new URL('./', import.meta.url).pathname;
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const VOL = arg('volume', null);

if (!VOL) {
  const { MOLECULES, RECORD_ONLY } = await import('../../lab/molecules.js');
  const rows = [...MOLECULES, ...RECORD_ONLY].map((m) => ({ id: m.id, charge: m.charge || 0, ang: m.ang }));
  writeFileSync(HERE + 'catalogue.json', JSON.stringify(rows) + '\n');
  console.log(`${rows.length} molecules → tools/diagrams/catalogue.json`);
} else {
  const DIST = (process.env.LW_VOLUMES || homedir() + '/Documents/LAMBDAWAVES-VOLUMES') + '/dist/', dir = DIST + VOL + '/';
  const shelf = JSON.parse(readFileSync(DIST + 'volumes.json', 'utf8')).volumes.find((v) => v.id === VOL);
  if (!shelf) { console.error(VOL + ' is not on the shelf'); process.exit(2); }
  const bytes = readFileSync(dir + 'index.json'), sha = createHash('sha256').update(bytes).digest('hex');
  if (shelf.indexSha256 && shelf.indexSha256 !== sha) { console.error(`${VOL}: index.json hashes ${sha}, the shelf says ${shelf.indexSha256}`); process.exit(2); }
  const header = (file) => {   // the .lwm's JSON header alone: 'LWM1' · u32 H · H bytes (lab/volumes-format.js)
    const fd = openSync(file, 'r'); try { const b8 = Buffer.alloc(8); readSync(fd, b8, 0, 8, 0); const H = b8.readUInt32LE(4), hb = Buffer.alloc(H); readSync(fd, hb, 0, H, 8); return JSON.parse(hb.toString('utf8')); } finally { closeSync(fd); }
  };
  const molecules = JSON.parse(bytes.toString('utf8')).molecules.map((m) => {
    if (!m.file || !existsSync(dir + m.file)) return { id: m.id };
    const h = header(dir + m.file), atoms = (h.geometry && h.geometry.atoms) || [], k = h.geometry && h.geometry.unit === 'bohr' ? BOHR : 1;
    return { id: m.id, charge: m.charge || (h.meta && h.meta.charge) || 0, ang: atoms.map((a) => [a.Z, a.x * k, a.y * k, a.z * k]), bonds: (h.meta && h.meta.bonds) || null, smiles: (h.meta && h.meta.smiles) || null };
  });
  writeFileSync(HERE + VOL + '.json', JSON.stringify({ volume: VOL, indexSha256: sha, size: PAGE, molecules }) + '\n');
  console.log(`${VOL}: ${molecules.length} molecules, ${Math.ceil(molecules.length / PAGE)} pages → tools/diagrams/${VOL}.json`);
}
