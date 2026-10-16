# Z2 · THE PROVENANCE REGISTRY + THE FINGERPRINT: the build note (Opus 5.5 builder, 2026-10-16)

Branch `z2-provenance` from base `3434be1`. Files: `tools/provenance.mjs` (111 lines, the cap is 120), `docs/PROVENANCE.md` (generated), `tests/provenance.test.mjs`
(21 lines, the cap is 25), one line at the foot of `docs/NOTES-FOR-AGENTS.md`, and `research/release-0.9.0/z2-fingerprint.json` (the saved device report the head reads).
**Δ lab lines = 0.** No `lab/` file was touched: the count reads 30,027 before and after.

## `--check`
`node tools/provenance.mjs --check` → `provenance --check: 55627 bytes, 186 rows, in step`. It exits 1 on any byte difference (I appended one space and it said
`docs/PROVENANCE.md is stale` with exit 1, then I restored the file). The tool also exits 1 if its row count is not the catalogue's, or if a molecule row has no source or no oracle.

## The head: three lines and their sources
1. **THE LOCK.** The scope sentence is quoted word for word from the `THE LOCK'S SCOPE (0.5.4 R7, one sentence)` line of `tools/perf/digest-lock.mjs`'s header comment.
   The counts sentence (``--check --query gastab=0` compares 860 values, and the same plus `--fixture …digest-lock-s4a.json` 1004, both 0/0 …``) is quoted from the
   same header. Each fixture's provenance comes from its own fields: `made`, `meta.build`, the Firefox version in `meta.ua`, and whether `url` carries `gastab`.
   The default fixture `research/optimization-2026-09-24/digest-lock-base.json` was made 2026-09-25T04:01:50.657Z on build 0.2.3-alpha.1, with no `gastab` in its url.
   The 1004-value fixture `research/release-0.4.0/measure/digest-lock-s4a.json` was made 2026-10-08T11:01:28.195Z on build "0.3.3-alpha · the exports · 2026-10-07"
   on Firefox 157.0, and its url carries `gastab=0`. Neither fixture has a commit field, and the registry says so. According to `git log --diff-filter=A`, commit
   `e58e554` (0.4.0 S4a A5) added the s4a file. That fact is recorded here only; the generated file leaves it out so that it never depends on git history.
2. **FINGERPRINT.** I ran the device report once on this machine with `__LW.report({ only: 'fingerprint' })`. That is the call `tools/perf/device-report.js`'s header
   names, and it went through `tools/gate/gatekit.mjs` `open()` on `https://127.0.0.1:9551/lab/?sw=0&warn=0`, the same road `device-report-run.mjs` uses. I needed
   that call because `device-report-run.mjs` runs the full report, and the full report skips the two digests. The served tree was base `3434be1`. The runner was a
   one-off file in `.tmp/` and is not committed. I started the server on 9551 and stopped it by its own pid. Before the run, `pgrep` showed only a desktop Firefox and no gate suite.
   The whole report is saved as `research/release-0.9.0/z2-fingerprint.json` as `{ commit, port, road, report }`, and the tool formats the row from it:
   - device Linux-Firefox, build 0.8.3-alpha · Breath · 2026-10-16, run at 2026-10-16T15:03:36.140Z;
   - adapter strings all empty and driver null (Firefox);
   - UA Firefox 157.0;
   - 12 features offered; shader-f16 offered true · requested false · granted false;
   - 35 limits, format bgra8unorm;
   - digests at 64³, t = 3.7: 1s+2pz `4d36a9a5`, MOLECULES · H2O · density `386430a4`. These are the same two hashes 0.5.4 P-V recorded (`P-V-REPORT.md` row 4f).
3. **FIELD LAW.** The line reads `FIELD LAW · (filled by the integrator at the cut from tests/field-law.browser-test.mjs)`. Z3 produces the real line and the
   integrator pastes it in. When that happens, the integrator changes the literal in `tools/provenance.mjs` (the line beside `${DEVICE}`) and regenerates.
   Editing the `.md` alone would fail `--check`.

## The registry's columns and their sources
- **Molecule rows (98)** come from `lab/catalogue.js`'s `molecules` shelf, in catalogue order. Each column:
  - **section**: `lab/molecules.js` `section`.
  - **basis**: always STO-3G, plus 6-31+G* where `lab/molecules.js`'s `oracle['6-31+g-star']` exists (19 molecules).
  - **record**: the first 8 hex characters of `lab/library.json` `hash`. That hash is the sha-256 of the record's own bytes (`tools/orbital-library.mjs:382`), not of the basis.
  - **geometry**: `lab/library.json` `status.geometry`, or `—` for a live molecule. `lab/status.js` gives a live solve geometry `null`.
  - **source**: the record's `stem.geometrySource` (`lab/library/<hash>.json`). For a live molecule it is `lab/molecules.js` `source`. I checked that the two
    strings are identical for all 38 records.
  - **oracle**: three parts.
    - The fixture and its key come from the record's `oracle.source`. For a live molecule they are `sto-3g-v1.json` `library.<id>`, or `uhf-v1.json` `molecules.<id>` when the multiplicity is above 1.
    - The script is the fixture's own `provenance`: `tool` or `written_by`, with `library.written_by` and `appended.written_by` for `sto-3g-v1.json`'s keys.
      C₆₀'s fixture `research/release-0.4.0/library-census/c60-occupied.json` has no provenance block. For it the script is `tools/library/frontier.py --occupied`,
      the call that writes `save('c60-occupied.json', …)`.
    - The PySCF version is the fixture's `provenance.pyscf` (C₆₀: `solver.pyscf`). A 6-31+G* molecule also names `6-31+g-star-v1.json` and its writer.
  - **E**: the record's `oracle.energy`, or the fixture's `energy` for a live molecule.
  - **Δ**: `lab/library.json` `oracle.delta`, which is app − PySCF (`tools/orbital-library.mjs:338`).
  - **generator**: `lab/library.json` `generator`'s first word (`tools/orbital-library.mjs`), or "live solve".
  - **since**: the catalogue's.
- **Method rows (4: molecules, basis-631, uhf, lda)**: id, name, word, oracle test and what come from the catalogue. Each row's fixture is the one its `oracle.what`
  names; basis-631's is `6-31+g-star-v1.json`, from the oracles README's table. The fixture's writers come from its own provenance (all three for `sto-3g-v1.json`).
- **Every other shelf (84 rows)**: id · name · shelf · word · oracle test · since, all from `lab/catalogue.js`.
- **The basis paragraph**: `lab/vendor/bse/index.json` (name, file, bse_version, revision_date, sha256) plus each file's own `revision_description`.
  The licence clause is computed: the tool searches index.json and both files for "licence/license", finds none, and prints **NOT STATED IN THE TREE**.
- **The geometry paragraph**: a tally of `lab/library.json` `status.geometry`.
- **Research, not merged**: `research/release-0.5.4/survey/CHAT-AND-ASKS.md` §A9. The tool reads its heading (`C:5015`) and its own "Cautioned" words
  ("nothing cloned or incorporated (C:5209)").

## What the table could NOT state from the tree
- **No Δ on file for the 60 live-only molecules** (61 live, minus C₆H₆, whose record carries one). Each row has its PySCF energy, fixture and script,
  but the app's own energy is computed only inside its gate (`molecules.test.mjs` / `uhf.test.mjs`) and is never written down. The column says "not on file".
  Computing those deltas in this tool would mean 61 SCF solves inside a byte-exact `--check`, which I judged outside this row. Z1's `tools/pyscf-table.mjs` is the seat for those numbers.
- **The method rows have no geometry source**, because they describe methods. The 98 molecules all have a source and an oracle fixture.
- **Two rows have no oracle in substance**: `transition` (UNCHECKED; `current.browser-test.mjs`, "no node oracle; a toy for composites") and `rate` (UNCHECKED;
  `project-formats.test.mjs`, "only its round trip"). Their oracle-test cells name those tests.
- **C₆₀'s Δ is 0 by construction**: the record is PySCF's own (`oracle.what`: "the record IS PySCF's; its check is the field at Sol's 92 points").
- **The BSE licence is not stated anywhere in the tree.** I found it in no vendored file, in no index, and in `NOTICE`.
- **Neither lock fixture records a commit**: the registry gives each one's `made` and `meta.build`.

## Corrections to the brief
1. **The catalogue has 186 rows, not 185** (the launch message) **or 182** (the brief's 0.7.4 count): `node tools/catalogue-table.mjs --check` reads 186. The
   `molecules` shelf has 102 rows: 98 molecules (61 live and 37 record-only) plus 4 method rows.
2. **"experimental, UNVERIFIED — 36 of 38" is not one geometry class.** `lab/library.json` reads experimental 2 (C6H6, TiCl4), computed-reference 9,
   optimised-here 26, draft 1 (C60). The README's "36 of 38 UNVERIFIED" means every class other than experimental. The registry prints the class per row and the tally above the table.
3. **"The basis hash from `library.json`" does not exist.** `library.json` `hash` is the record file's own sha-256. The basis hashes are in
   `lab/vendor/bse/index.json` (and in each fixture's `bse_sha256` / `basisSha256`), and the registry prints them once above the table.
4. **There is no "BSE licence line" in the basis files' headers** (see the list above), and the registry says so instead of naming a licence from memory.
5. **The s4a fixture does not predate the gas table.** Its own url was recorded with `gastab=0`, after W125 had made the table the default. It is the default
   fixture (made 2026-09-25 on 0.2.3-alpha.1, no `gastab` in its url) that predates the table. Both runs take `--query gastab=0`, as the header's counts line says.
6. **The fingerprint's two digests need `{ only: 'fingerprint' }`.** `device-report-run.mjs` runs the full report, whose digests are skipped. I used its road with that one option.

## Gates run
- `node tools/provenance.mjs --check`: 55627 bytes, 186 rows, in step.
- `node tests/provenance.test.mjs`: PASS. 186 rows (= the catalogue), 98 molecules each with a source and an oracle, 50 named files on disk, `--check` in step.
- `node tools/catalogue-table.mjs --check`: 18274 bytes, 186 rows, in step.
- `node tests/catalogue.test.mjs`: PASS.
- `./test.sh node`: exit 0, with `provenance.test.mjs` in the run.
- `lab/` line count: 30,027, unchanged.
