# Iteration 004 — THE PICKER, THE FOLDER, THE VOLUMES (Josh 2026-10-17)

Base: `yan-c` at `fabda52`. No push, no deploy, no release. Never edit `lab/mir/**` or `lab/fonts/**`. BASINS read-only.
Research briefs (DATABASE/CLAUDE/APPS/…): BASINS/MAP (the BASINS map), LAMBDAWAVES/PLANS/IT004-MIR15-GAP.md (the MIR 1.5 gap check,
the FOLDER window recipe), LAMBDAWAVES/PLANS/IT004-SYNCHROSPECTRE-EFFECTS.md (the effects to port).

## Josh's asks → rows
| ask | row |
|---|---|
| MIR 1.5 BASINS check: non-Mandelbrot MIR features λWAVES lacks; BASINS mapped into DATABASE | R1 map · R2 gap report → F |
| the old start screen (the opener: eleven demo covers, WAVE DANCER …) leaves the boot; its demos + saves go into a FOLDER window as BASINS does | F |
| the main menu is now THE PICKER (the front page); SynchroSpectre's effects | P |
| bigger thumbnails, more columns, LEFT / RIGHT buttons | P |
| no dark background on hover — only the thumbnail's own motion; hover also shows the name under the tile | P |
| the caption much larger; "from its record" gone — volume names (VOL. I, VOL. II) instead | P |
| ATOMIC thumbnails: not flat — a corner-angle view of the orbital as λWAVES draws it, normalised in size like the molecules | P |
| the LIBRARY formalised as VOLUMES (≈5 GB each, easy install), tags and tag groups, a big-serif minimalist face (LW Title) | V · P |
| populate relentlessly: every basis STO-3G … 6-31+G* for each molecule; holistic metadata like H₂O's | V |
| how many molecules fit in a volume | V (measured, below) |

## THE BASIS LADDER (every volume molecule, at one geometry)
STO-3G · STO-6G · 3-21G · 6-31G · 6-31G* · 6-31+G* — Cartesian (cart=True), the Basis Set Exchange decimals vendored verbatim
(lab/vendor/bse). Coverage: the first five H–Kr; BSE defines 6-31+G* for H–Ar only, so a molecule with K–Kr carries five rungs.
6-31+G* v1 (H, C, N, O, F) widens to H–Ar with H, C, N, O, F byte-identical (checked 2026-10-17), so no pinned energy moves.
"STO-nG → 6-31G conversion" is used honestly: the converged density of the rung below, projected (PySCF project_dm_nr2nr), is the
STARTING GUESS of the next rung — it cuts SCF cycles; every rung is still its own converged RHF.

## THE VOLUME FORMAT v1
```
<VOLUME_BASE>/                 default './volumes/' beside lab/index.html; dev: lab/volumes → ~/Documents/LAMBDAWAVES-VOLUMES/dist (git-ignored symlink)
  volumes.json                 THE SHELF  { schema: 1, volumes: [ { id: 'vol-1', numeral: 'I', title, blurb, count, bytes, bases: [...],
                               tags: { tag: count }, index: 'vol-1/index.json', indexSha256, built } ] }
  vol-1/index.json             THE CATALOGUE  { schema: 1, id, numeral, title, bases, generator, molecules: [ { id, name, formula (plain Hill),
                               formulaM ('<m>C₉H₈O₄</m>'), charge, heavy, tags: [...], cid, inchikey, mw, pg, file: 'm/<id>.lwm', bytes, sha256,
                               thumb: 't/<id>.webp' | null, rungs: { '<basis>': { E, nAO, gapEv } } } ] }
  vol-1/m/<id>.lwm             ONE MOLECULE, ALL ITS RUNGS (binary, below)
  vol-1/t/<id>.webp            its picture (the Picker's tile; tools/menu-thumbs.mjs' look)
```
**.lwm** — little-endian: `'LWM1'` · u32 header length H · H bytes of UTF-8 JSON · zero pad to 8 · the blob section (each blob 8-aligned,
offsets from the blob section's start). Header:
```
{ schema: 1, id, volume, meta: { name, iupac, synonyms[≤6], formula, formulaM, charge, multiplicity: 1, cid, inchi, inchikey, smiles,
  mw, exactMass, heavy, nAtoms, xlogp, tpsa, hbd, hba, rotatable, complexity, tags[], blurb, blurbSource, pointGroup, sources[] },
  geometry: { atoms: [{ Z, x, y, z }] (bohr, exactly a record's input.atoms), atomsSha256 (lab/library.js atomsKey), source, method },
  rungs: { '<basis>': { record: <a schema-1 FRONTIER record with every column — lab/library.js validateRecord's law — whose
           orbitals.eps / orbitals.C are { $blob: name } placeholders>, blobs: { eps: { dtype: 'f64', offset, length },
           C: { dtype: 'f32', offset, length }, mulliken: { dtype: 'f32', … } }, solve: { solver, conv_tol, converged, cycles, guess },
           check: { orthonormality, electrons } } } }
```
The reader (lab/volumes.js) turns one rung into the schema-1 record the worker already opens (chem.open) by replacing each
placeholder with `{ $f64 | $f32: base64 }`; `ground.cols` is every column 0…nAO−1, caps { orbitals: true, rpa: false, states: false,
tdhf: false }. lab/library.js decodeRecord gains one rule: a frontier record whose columns cover the occupied set gets D = 2 Σ_occ c cᵀ
(so DENSITY draws). The record's `ground.hash` is the app's own basisFrom hash on the vendored file (chem.open refuses another).
C is f32 (7 digits: the picture's precision, stated); ε and the energy are the solver's f64. Clocks are never written.

## THE PIPELINE (tools/volumes/, data in ~/Documents/LAMBDAWAVES-VOLUMES/, never in git)
1. catalogue → `catalogue/<vol>.candidates.json`: named molecules from open sources (ChEMBL approved drugs + ATC, ChEBI roles, curated
   classics/materials/environment/food lists, the app's own 98 + library rows at THEIR pinned geometries), resolved through PubChem
   (CID, InChIKey, SMILES, IUPAC, synonyms, computed properties, the 3-D conformer) — filtered: H–Kr only, closed shell, a 3-D geometry.
   Tags from one small vocabulary of plain words (below). Excluded outright: Chemical Weapons Convention scheduled agents/precursors.
2. solve (PySCF 2.14, `nice -n 19`, resumable, smallest first) → `raw/<id>/<basis>.npz` + `raw/<id>/meta.json`.
3. pack (node, the app's own code: basisFrom, overlap, names.js) → the .lwm: PySCF AO order → the app's (frontier.py `conversion`),
   CᵀS_appC = I checked per rung (≤ 1e-8 in f64 before the f32 cast), the electrons Tr(DS) = N; then index.json + volumes.json.
4. thumbs (tools/menu-thumbs.mjs --volume vol-1) → `t/<id>.webp`.

## TAGS (plain words; a molecule carries 1–4)
medicine · painkiller · antibiotic · antiviral · heart · mind · cancer · allergy · anaesthetic · vitamin · hormone · neurotransmitter ·
amino acid · nucleobase · sugar · fat · steroid · alkaloid · food · flavour · scent · sweetener · colour · solvent · fuel · plastic ·
material · metal · gas · atmosphere · pollutant · toxin · pesticide · acid · aromatic · ring · cage · classic · natural · life
