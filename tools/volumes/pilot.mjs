#!/usr/bin/env node
/* tools/volumes/pilot.mjs — THE PILOT'S CANDIDATES (iteration 004 V1): tools/volumes/pilot.json → a candidates file in the catalogue's
 * shape ({ molecules: [{ id, name, charge, atomsAng | atomsBohr, cid, inchikey, …, tags, blurb, blurbSource, sources }] }), the
 * file tools/volumes/solve.py and tools/volumes/pack.mjs read.
 *   node tools/volumes/pilot.mjs [--out ~/Documents/LAMBDAWAVES-VOLUMES/catalogue/pilot.candidates.json]
 * Every row's identifiers, computed properties, IUPAC name and synonyms come from PubChem PUG REST by its CID (≤ 5 requests a second,
 * 250 ms apart); its blurb is the first sentence of PubChem's description from an openly licensed source (ChEBI, CC BY 4.0; MeSH,
 * public domain; NCI Thesaurus, CC BY 4.0), named in `blurbSource`, or none.  An `app` row keeps the app's pinned atoms in bohr
 * (lab/molecules.js moleculeAtoms, exactly) and its declared symmetry; a `cid` row takes PubChem's 3-D conformer (Å; computed by
 * PubChem, MMFF94 — not a measurement, and the row says so).  The catalogue builder (PLAN.md step 1) writes vol-1's the same way. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MOLECULE_BY_ID, moleculeAtoms, moleculeCharge } from '../../lab/molecules.js';

const HERE = path.dirname(fileURLToPath(import.meta.url)), args = process.argv.slice(2);
const OUT = (args.includes('--out') ? args[args.indexOf('--out') + 1] : path.join(homedir(), 'Documents/LAMBDAWAVES-VOLUMES/catalogue/pilot.candidates.json')).replace(/^~/, homedir());
const PUG = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/';
const OPEN = [['ChEBI', 'CC BY 4.0'], ['MeSH', 'public domain (US NLM)'], ['NCI Thesaurus (NCIt)', 'CC BY 4.0']];
let last = 0;
async function get(url) {
  for (let attempt = 0; ; attempt++) {
    const wait = last + 250 - Date.now(); if (wait > 0) await new Promise((r) => setTimeout(r, wait)); last = Date.now();
    const res = await fetch(url);
    if (res.ok) return res.json();
    if (res.status === 404) return null;
    if (attempt >= 3) throw new Error(`PubChem ${res.status} for ${url}`);
    await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));        // 503 = busy: back off
  }
}
const PROPS = 'Title,IUPACName,MolecularFormula,MolecularWeight,ExactMass,InChI,InChIKey,SMILES,XLogP,TPSA,HBondDonorCount,HBondAcceptorCount,RotatableBondCount,Complexity,HeavyAtomCount,Charge';

const pilot = JSON.parse(readFileSync(path.join(HERE, 'pilot.json'), 'utf8')), out = [];
for (const row of pilot.molecules) {
  const P = (await get(PUG + row.cid + '/property/' + PROPS + '/JSON')).PropertyTable.Properties[0];
  const syn = await get(PUG + row.cid + '/synonyms/JSON'), desc = await get(PUG + row.cid + '/description/JSON');
  const synonyms = ((syn && syn.InformationList.Information[0].Synonym) || []).filter((s) => !/^\d+-\d+-\d$|^[A-Z0-9]{10}$|^(CHEBI|CHEMBL|DTXSID|UNII|NSC|EINECS|HSDB|BRN|CCRIS|AI3|DB\d)/i.test(s) && s.length <= 40).slice(0, 6);
  let blurb = null, blurbSource = null;
  for (const [src, licence] of OPEN) {
    const d = desc && desc.InformationList.Information.find((i) => i.DescriptionSourceName === src && i.Description);
    if (d) { const first = d.Description.match(/^.*?[.!?](?=\s|$)/); blurb = (first ? first[0] : d.Description).slice(0, 320); blurbSource = `${src} (${licence}) via PubChem: ${d.DescriptionURL}`; break; }
  }
  const c = { id: row.id, name: P.Title, iupac: P.IUPACName || null, synonyms, formula: P.MolecularFormula, charge: P.Charge || 0, multiplicity: 1, cid: row.cid,
    inchi: P.InChI, inchikey: P.InChIKey, smiles: P.SMILES || null, mw: +P.MolecularWeight, exactMass: +P.ExactMass, xlogp: P.XLogP ?? null, tpsa: P.TPSA ?? null,
    hbd: P.HBondDonorCount, hba: P.HBondAcceptorCount, rotatable: P.RotatableBondCount, complexity: P.Complexity, heavyPubChem: P.HeavyAtomCount, tags: row.tags,
    blurb, blurbSource, identifiersChecked: 'PubChem PUG REST, ' + new Date().toISOString().slice(0, 10),
    sources: [`identifiers and properties: PubChem CID ${row.cid} (PUG REST, ${new Date().toISOString().slice(0, 10)})`] };
  if (row.app) {
    const m = MOLECULE_BY_ID.get(row.app);
    if (!m) throw new Error(`pilot: '${row.app}' is not an app molecule`);
    if ((moleculeCharge(row.app) || 0) !== c.charge) throw new Error(`pilot: ${row.id}: PubChem's charge is not the app's`);
    Object.assign(c, { app: row.app, atomsBohr: moleculeAtoms(row.app).map((a) => [a.Z, a.x, a.y, a.z]), symmetry: m.symmetry || { group: 'C1' },
      geometrySource: m.source, geometryMethod: 'the app\'s pinned geometry (lab/molecules.js)' });
  } else {
    const rec = await get(PUG + row.cid + '/record/JSON?record_type=3d');
    if (!rec) throw new Error(`pilot: CID ${row.cid} (${row.id}) has no PubChem 3-D conformer`);
    const C = rec.PC_Compounds[0], X = C.coords[0].conformers[0];
    Object.assign(c, { atomsAng: C.atoms.element.map((Z, i) => [Z, X.x[i], X.y[i], X.z[i]]), symmetry: { group: 'C1' },
      geometrySource: `PubChem CID ${row.cid}, its 3-D conformer (PubChem3D: MMFF94s, computed — not a measurement)`, geometryMethod: 'PubChem PUG REST record_type=3d, conformer 1' });
  }
  const zs = (c.atomsAng || c.atomsBohr).map((a) => a[0]);
  if (zs.some((z) => z > 36)) throw new Error(`pilot: ${row.id} has an element past Kr`);
  if (zs.filter((z) => z > 1).length !== c.heavyPubChem) throw new Error(`pilot: ${row.id}: ${zs.filter((z) => z > 1).length} heavy atoms in the geometry, PubChem says ${c.heavyPubChem}`);
  out.push(c);
  console.log(`${row.id.padEnd(14)} CID ${String(row.cid).padEnd(8)} ${c.formula.padEnd(12)} ${String(zs.filter((z) => z > 1).length).padStart(3)} heavy · ${c.name} · ${blurbSource ? blurbSource.split(' (')[0] : 'no open blurb'}`);
}
mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ schema: 1, note: 'tools/volumes/pilot.mjs from tools/volumes/pilot.json — the volume engine\'s pilot (iteration 004 V1)', molecules: out }, null, 1) + '\n');
console.log(`pilot: ${out.length} candidates → ${OUT}`);
