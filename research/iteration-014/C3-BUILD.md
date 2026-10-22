# C3 MORE TAGS (chain C, iteration 014)

**What.**
- **The proposal (a cheap model, as the plan asked).** One Haiku sub-agent read a 400-row sample of a COPY of `vol-1.candidates.json`
  (the 300 highest-priority rows plus 100 at random, seed 14: id, name, SMILES, formula, current tags). From the SMILES and names it proposed
  geometry/class words from an offered vocabulary into `catalogue/tags.proposed.json` (scratch), copied to `c-data/tags.proposed.json`.
  293 of the 400 rows got a word. Haiku proposed one extra word, `cage`; it is not used, because `cage` is already a structure tag.
- **The adoption (`structure_tags.py` THE SHAPE WORDS).** A word is adopted only when RDKit can decide it from the row's own structure,
  and the test then decides it for EVERY row; the model never sets a row's word. All eleven proposed words have a test (GEO_RULES):
  linear · planar (the row's own atoms: RMS off a line < 0.05 Å / off a plane < 0.10 Å, H included) · strained (a 3- or 4-ring) ·
  macrocycle (a ring ≥ 12) · spiro · bridged (RDKit's spiro / bridgehead counts) · fused (two SSSR rings sharing one bond) ·
  polycyclic (≥ 3 rings) · organometallic (a metal–C bond in the atoms) · zwitterion (net 0, a formal + and −, nitro not counted) ·
  chiral (a stereocentre the SMILES marks). They go in their own field **`row['geo']`**, not `tags`: the four-word cap and the shelf's
  themes read `tags`, and no molecule's tags or volume may move. `build.py` calls `annotate_geo()`, and stats gain `geoWords` / `geoRules`.
  The CLI `structure_tags.py --adopt PROPOSED --candidates IN --out OUT --report R` writes the agreement report (`c-data/tags.adopted-report.json`):
  per word, model ∩ RDKit, model only and RDKit only on the sample, plus the rows where the model said a word RDKit refused ("waiting", for Josh).
- `pack.mjs`: the index row carries `geo` when it has one.
- **The Picker**: the tag strip is THREE rows (`.mm-tags` › `.mm-tagrow` ×3, chips 11 px so the head keeps its height). Each word goes,
  most common first, to the row that is shortest so far. The chips and the filter read `tags` ∪ `geo` (`wordsOf`), and the search matches both.
  The isomer deck now sits under the head, whatever height its rows give it.

**Dry run (scratch).** Over the 29,509-row copy (48 s): linear 136 · planar 1,054 · strained 1,663 · macrocycle 634 · spiro 1,277 ·
bridged 1,793 · fused 12,639 · polycyclic 13,704 · organometallic 29 · zwitterion 495 · chiral 13,312.
Agreement on the sample (model ∩ RDKit / model only / RDKit only):
- exact: linear 22/0/0 · macrocycle 11/0/0 · chiral 162/0/0 · organometallic 3/0/0
- close: polycyclic 148/0/1 · fused 137/0/3 · strained 29/0/2 · bridged 16/0/3
- planar 29/8/1: the 8 model-only are rows without atoms RDKit could read
- spiro 4/0/8 and zwitterion 6/0/8: RDKit finds more than the model.

Found on the way: RDKit's XYZ reader refuses an exponent (`3e-05`) and a bare integer `0`. `structure_tags.mol_from_atoms` writes Python's
repr, so 60-odd rows lost their xyz molecule there. The new code writes fixed-point; the old function is untouched (its tags must not move).

**Files.** `tools/volumes/catalogue/structure_tags.py`, `build.py`, `tools/volumes/pack.mjs`, `lab/picker.js`, `lab/skin.css`,
`research/iteration-014/c-data/{tags.proposed.json, tags.adopted-report.json}`.

**Tests.** `./test.sh node` exit 0; `library` and `start` browser suites GREEN; shot `c-shots/C3-three-tag-rows.jpg` (the scratch shelf's
VOL. I: three rows, `planar` and `polycyclic` among the chips).

**CLAUDE.md sentence.** THE SHAPE WORDS (iteration 014 C3): a cheap model proposed geometry/class words (`c-data/tags.proposed.json`);
`structure_tags.py` adopts only those RDKit decides (GEO: linear · planar · strained · macrocycle · spiro · bridged · fused · polycyclic ·
organometallic · zwitterion · chiral) into `row['geo']` (never `tags`: the cap and the themes stay); the index carries `geo`; the Picker's
tag strip is three rows over `tags` ∪ `geo`.

**For Josh.** (1) `fused`, `polycyclic` and `chiral` each mark ~45 % of the catalogue: keep them as chips, or keep only the rare ones?
(2) Haiku's extra word `cage` is already a tag. (3) Fixing `mol_from_atoms`' number format would move ~60 rows' structure tags: your call.
(4) The live catalogue gets `geo` on the next `build.py` (or `--adopt` on the file), then a pack.
