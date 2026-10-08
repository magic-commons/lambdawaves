#!/usr/bin/env node
/* tools/library/pubchem-ids.mjs — the library's open identifiers, CHECKED (0.4.0 S4b · R-L4: InChIKey and PubChem CID, not CAS).
 *
 *   node tools/library/pubchem-ids.mjs            ask PubChem's PUG REST once per row of tools/library/pubchem-ids.json that has a
 *                                                 `cid` or a `query` and no `checked`, politely (one request, then 0.5 s), and write
 *                                                 back what it answered: the CID, its InChIKey, its formula, its title
 *   node tools/library/pubchem-ids.mjs --recheck  every row again
 *
 * A row is VERIFIED only when PubChem's molecular formula is the record's (`formula`, Hill, neutral) and, where the row
 * already stated an InChIKey (lysine's, entered from memory in S4a), PubChem's key is that key.  Otherwise it says why.  A row
 * with `none` (a finite cluster PubChem does not list) is left alone: the record says so instead of inventing an identifier.
 * tools/orbital-library.mjs reads this file into each record's STEM fields; it never asks the network itself. */
import { readFileSync, writeFileSync } from 'node:fs';
const FILE = new URL('./pubchem-ids.json', import.meta.url);
const doc = JSON.parse(readFileSync(FILE, 'utf8')), all = process.argv.includes('--recheck');
const API = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const day = new Date().toISOString().slice(0, 10);
let asked = 0;
for (const [id, row] of Object.entries(doc.molecules)) {
  if (row.none || (row.checked && !all)) continue;
  const path = row.cid ? 'cid/' + row.cid : 'name/' + encodeURIComponent(row.query);
  let got = null, why = null;
  try {
    const res = await fetch(API + path + '/property/InChIKey,MolecularFormula,Title/JSON');
    asked++;
    if (!res.ok) why = `PubChem answered ${res.status}`;
    else got = (await res.json()).PropertyTable.Properties[0];
  } catch (e) { why = 'the network refused it: ' + String(e && e.message || e); }
  if (got) {
    const formulaOk = got.MolecularFormula === row.formula, keyOk = !row.statedInchiKey || row.statedInchiKey === got.InChIKey;
    Object.assign(row, { cid: got.CID, inchiKey: got.InChIKey, pubchemFormula: got.MolecularFormula, title: got.Title, checked: day,
      status: formulaOk && keyOk ? `VERIFIED against PubChem PUG REST on ${day}: CID ${got.CID} ("${got.Title}") → InChIKey ${got.InChIKey}; its formula ${got.MolecularFormula} is the record's`
        + (row.statedInchiKey ? '; the key entered from memory before (S4a) is the same' : '') + (row.note ? ' — ' + row.note : '')
        : `UNVERIFIED: PubChem's CID ${got.CID} is ${got.MolecularFormula}${keyOk ? '' : ' with InChIKey ' + got.InChIKey + ', not the stated ' + row.statedInchiKey}, the record is ${row.formula}` });
  } else Object.assign(row, { checked: null, status: 'UNVERIFIED: ' + why });
  console.log(`${id.padEnd(18)} ${row.status}`);
  await sleep(500);
}
writeFileSync(FILE, JSON.stringify(doc, null, 1) + '\n');
console.log(`pubchem-ids: ${asked} requests; ${Object.values(doc.molecules).filter((r) => /^VERIFIED/.test(r.status || '')).length} verified, ${Object.values(doc.molecules).filter((r) => r.none).length} with no PubChem compound, ${Object.values(doc.molecules).filter((r) => /^UNVERIFIED/.test(r.status || '')).length} unverified`);
