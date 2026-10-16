# Z1 THE PUBLIC FACE — build note (Opus 5.5 builder, 2026-10-16)

Branch `z1-face` from base `3434be1`. Tip: the commit that adds this file, on top of `5f9bea2`. Nothing was pushed.

## 1. What changed

Every sentence changed, old → new, with its seat and the reason, is in `CLAIMS-0.9.0.md`: the 0.5.4 rows 6–11 and 13 more rows (R1–R7 README, M1 the MODEL sheet, C1 CITATION, D1–D3 docs).

- **README.**
  - "Nothing drifts" is now said of field-free hydrogen only, with a list of what does step in time.
  - The norm and anchor figures now sit beside their gate bounds.
  - The field law is the three-metric line, for hydrogen and for water.
  - SLICE → PLANE.
  - The Physics row's counts are today's.
  - A new section, `## Against PySCF`, gives the oracle sentence and the node gate's scope per suite, followed by the generated table inside a `<details>`.
  - The strobe sentence now says what the flash guard does.
  - ChronusQ is now a reference with its licence line.
- **CITATION.cff.** New title, version and date, and an abstract in the STATUS grammar.
- **Lab strings (0 lines).**
  - FLOW caption (row 6) and FLOW switch title (row 7).
  - MOLECULES' Model note (row 10) and its ENERGY readout title (10′).
  - STAGE FORMULA's title (row 11).
  - The MODEL sheet's NUMERICAL definition (M1).
- **Docs.**
  - SHIPPING-READINESS gets a dated 0.9.0 status.
  - NOTES-FOR-AGENTS §6 gets the lock's `gastab=0` on both runs.
  - NOTES-FOR-AGENTS §7: the suites list is corrected and THE FIELD LAW gets a bullet. The foot is not touched; that is Z2's line.

## 2. THE PYSCF TABLE

`tools/pyscf-table.mjs` is 38 lines and imports `lab/molecules.js`. It reads:
- `lab/library.json`;
- each row's record `lab/library/<hash>.json` (`ground.energy`, `oracle.energy`, `oracle.delta`);
- `tests/fixtures/oracles/sto-3g-v1.json` (`library`), `uhf-v1.json`, `6-31+g-star-v1.json` and `rks-v1.json`.

It rewrites README between `<!-- pyscf-table:begin -->` and `<!-- pyscf-table:end -->`.

- **Two tables, because the tree holds two kinds of number.**
  - **The 38 records:** molecule · basis · AO · method · E (app) · E (PySCF) · Δ = app − PySCF · geometry. Every value is printed as JavaScript prints the stored double, unrounded.
  - **The 61 live molecules:** PySCF's STO-3G, 6-31+G\* and RKS LDA energies.
- **Why the live table has no app energy.** The app's energy for a live molecule is computed on the device and stored nowhere (`tools/orbital-library.mjs:528-530`: "No delta — the live solve is what it is compared against, where it runs"). So the live table prints PySCF's numbers, and the prose above the block names the node gate that re-solves each kind.
- **Cell markers.**
  - "no oracle": the card offers that method and no PySCF number is on file.
  - "—": the card does not offer it. It uses the card's own rules: `basis631(id).ok`, and LDA only for closed shells up to 36 AOs (`chemview.js` `ldaWhy`).
  - "(PySCF: not converged)": the fixture's own flag.
- **`--check`:** `pyscf-table --check: 11136 bytes, 38 records + 61 live molecules, in step`. It is byte-exact and exits 1 when the block would change, as `catalogue-table --check` does.

What the table shows that no sentence said before:
- Five open shells (O₂, NO, OH, NH₂, CH₃) are offered in 6-31+G\* with no PySCF UHF number on file. Their STATUS reads UNCHECKED, so the app is honest about it, but no oracle exists.
- 43 of the 51 closed shells that LDA is offered for have no RKS oracle; only 8 do.
- Pyridine's (C₅H₅N) STO-3G oracle is an SCF that PySCF itself did not converge (see §6).

## 3. Every number, and where it came from

| number | where it is written | source |
|---|---|---|
| 3e-6 · 2e-5 · 2e-4 (hydrogen \|Δψ\| RMS · 99.8 % · worst voxel) | README l.83-88; CITATION (3e-6, 2e-4) | `tests/helpers/field-law.mjs` `FIELD_LAW.hydrogen.{rms,p998,worst}` (gate bounds; readings 2.34e-6 · 1.88e-5 · 1.68e-4 in its comment) |
| 1e-3 · 2e-3 · 3e-4 (water \|Δρ\|/ρ RMS · worst voxel · worst \|Δρ\|/ρmax) | README l.83-88 | `FIELD_LAW.density.{rms,worst,relToRhoMax}` (readings 8.31e-4 · 1.94e-3 · 2.86e-4) |
| 0.2 % of ρmax | CITATION | `lab/status.js` (`FIELD_LAW.density.worst × 100`); printed by `tools/status-probe.mjs` today: "picture good to 0.2 % of ρmax" |
| 3e-9 (bound 1e-6), 3e-16 (bound 1e-12) | README l.73-74 | `node tests/hydrogen.test.mjs` today: radial norms worst 2.666e-9 (R_10), anchors worst 2.22e-16 (Y_30); rounded up by `status.js`'s `up` rule |
| 7 open shells · 61 live · 59 enabled · 37 record-only · 98 | README Physics row | `lab/molecules.js` `MOLECULES`, `SOLVABLE`, `RECORD_ONLY`, `MOLECULE_BY_ID`, read in node |
| 46 AOs (6-31+G\*) · 36 AOs (LDA) | README Physics row | `BASIS_631.maxAO`; `lab/chemview.js` `ldaWhy` |
| 38 records; 37 compared; 36 of 38 computed geometries | README Physics row | `lab/library.json` rows (`status.energy` IMPORTED for C₆₀; geometry classes 2/26/9/1, also printed by `tests/status.test.mjs`) |
| 186 catalogue rows; 136 NUMERICAL | README Physics row; CLAIMS M1 | `node tools/catalogue-table.mjs --check` ("186 rows, in step"); `lab/catalogue.js` read in node |
| 1e-8 Eh (library write gate) | README Against PySCF | `tools/orbital-library.mjs:338-339` |
| max(1e-9, 3e-12·\|E\|), ≤ 14 AOs + HBr, Br₂ · C₂H₄, C₆H₆ · 1e-8 · ≤ 27 AOs at 1e-9 · 1e-6 | README Against PySCF | `tests/molecules.test.mjs:33,185`; `tests/chem-sweep.test.mjs` header; `tests/uhf.test.mjs` §2; `tests/basis-631.test.mjs:18,21`; `tests/rks.test.mjs` §2 |
| three flashes a second; four routes | README Accessibility | `lab/mir/shell/flash-guard.js:35` `WCAG.maxHz: 3`; `lab/mod-port.js:37` `FLASH_STEP` |
| GPL v2; WIREs 10, e1436 (2020) | README Licence | `research/chronusq-2026-09-11/A-CHRONUSQ-MAP.md:1203` (the package paper's arXiv abstract, VERIFIED there) and `:1149` |
| 109 node suites · 37 browser suites | SHIPPING-READINESS | `ls tests/*.test.mjs` / `tests/*.browser-test.mjs` today |
| PySCF 2.14.0 | README table | each fixture's `provenance.pyscf` |
| every E and Δ in the table | README block | `tools/pyscf-table.mjs` from the files in §2 |

## 4. Gates run (on the tip's lab/, before this note)

| gate | result |
|---|---|
| `node tests/pwa.test.mjs --write` | re-stamped `lab/sw.js` (5 hashes: the 5 files edited) |
| `./test.sh node` | rc 0 (all suites green, pwa last) |
| `node tests/status.test.mjs` | GREEN: 491 strings within 110 characters; 58 live solves, worst \|ΔE\| 9.69e-10 (Cl₂) |
| `node tools/new-project.mjs --check` | in step (16117 B) |
| `node tools/serialize-bytes.mjs` (`LW_PORT=9541 GD_PORT=5641`) | 11 readings. The same 11 sha-256 pairs on this branch and on the base `3434be1` (served from a `git archive` copy under `.tmp/`) |
| `node tools/status-probe.mjs` (9541/5641, `--eye .tmp/z1-eye`) | rc 0, 18 PASS. The STATUS row taps open the MODEL sheet "which defines the three words", at phone and tablet widths |
| `node tests/opener.browser-test.mjs` (9541/5641), for the MODEL sheet edit | GREEN 7 of 7 scenes |
| `node tools/rack-deps.mjs --classes` | ran clean (string edits only; no crossing changed) |
| `node tools/pyscf-table.mjs --check` | in step, 11136 bytes |
| `node tools/catalogue-table.mjs --check` | in step, 186 rows (read only) |

The servers were mine on 9541 and were stopped by pid. THE LOCK was not run: strings are not pixels, and the integrator runs it ×2 at the merge.

## 5. Δ lines

`lab/`: **0** (30,027 → 30,027; `find lab -name '*.js' -not -path 'lab/mir/*' | xargs cat | wc -l`). Five string edits sit in four lab `.js` files (chemview.js holds two of them) on existing lines, and `index.html` has one more. No test pinned any changed string. I grepped `tests/` and `tools/` for each old sentence first and found no hit. No new lab module.

## 6. Questions for Josh

1. **The ChronusQ credit on ABOUT and in NOTICE**, "Team @ Chronus Quantum for the Molecular Orbital Model". You kept it on 09-11 (`REPORT.md:2475`). The 09-11 map (`A-CHRONUSQ-MAP.md` §9) found it inaccurate and proposed "for the real-time electronic-structure reference λWAVES measures its own molecular propagators against". The later `scf.js` / `density.js` / `absorb.js` "ports" follow ChronusQ's documented equations and the papers, with no code. README now carries the reference and licence line. Should ABOUT and NOTICE follow, or stay as you wrote them?
2. **Row 9, the EXACT badge over a molecule.** Two options:
   - String-only: rename it `REGISTER · EVOLUTION · SHADOW` (and `REGISTER · SHADOW · SHELL EVOLUTION`). This scopes the claim to what is exact, but the label grows and loses its link to the STATE card.
   - One line of logic in 0.9.x: switch the badge to NUMERICAL while a molecule owns the field.

   Which do you want, or neither (STATUS TAGS is off by default)?
3. **Pyridine (C₅H₅N).** It is enabled live, and its STATE line says "energy agrees with PySCF to …" against a PySCF SCF that did not converge (`sto-3g-v1.json` `library.C5H5N.converged: false`; CuH is the same but disabled). Re-run its oracle with a stronger SCF, or mark the line?
4. **No priority claim** was found in README, CITATION, ABOUT, the sheet or `docs/`, and none was written. Nothing is called novel or first.

## 7. Sentences I could not make true from the tree

- **Row 9** (the EXACT badge over a molecule). It needs a molecule branch, which is logic, and this cut adds none (§6.2).
- **Pyridine's agreement line.** Its PySCF reference is unconverged. That is a fixture problem, not a string problem (§6.3).
- **README "Status: 0.8.3 alpha."** It becomes true at the cut, so it is the integrator's line, not mine. Likewise CITATION's `version: 0.9.0-alpha` / `date-released: 2026-10-16` assume the cut lands today. Change the date if it slips.
- **"ChronusQ is released under GPL v2".** The tree records "GPL v2" from the package paper's abstract. Whether the repository's file notices say "only" or "or later" is not recorded (`research/release-0.5.4/survey/ENGINE-VS-TREE.md:278`), so README says "GPL v2" and nothing more.

## 8. Corrections to the brief

- **The catalogue has 186 rows**, not 182 (the brief) or 185 (the launch message): `node tools/catalogue-table.mjs --check` says "186 rows, in step".
- **VIBRATE does not integrate.** It poses the nuclei at the closed form R₀ + A·Q₀·cos(ωt) and the density by LINEAR + one McWeeny step (`lab/chemview.js:278-279`). The integrators are RUN (RT-TDHF), DRIVE (TD-CIS), SONG (`driveStep`) and the FLOW tracers.
- **CLAIMS seats moved:** row 7 is `statesview.js:114` (not 113), row 8 `index.html:130` (not 129), row 10 `chemview.js:267` (not 222). Row 10 has a twin at `chemview.js:711`.
- **Row 8 was already true** since 0.5.4 P4. **Row 11's seat** is a comment and code, so the user-visible sentence that closes it is the STAGE FORMULA title in `lab/informational.js:12`.
- **No live app energies in the fixtures.** The brief expected the live molecules' app energies in a fixture; none exists (`tools/orbital-library.mjs:528-530`). Also, the live closed shells' oracle is `sto-3g-v1.json`'s `library` block (54 rows), not its `molecules` block (6).
- **README's anchor figure was too good.** "Anchors to 2e-16" was better than measured (2.22e-16). By `status.js`'s round-up rule it reads 3e-16.
- **README called the legacy windows "hidden as legacy"**, and its list included ATOMS. They were deleted in 0.5.0 (`docs/LEGACY-WINDOWS.md`), and ATOMS is back as a window. NOTES-FOR-AGENTS §7 named `helium` and `h2` suites that no longer exist.
- **Two of the "node" checks need a server.** `tools/status-probe.mjs` and `tools/serialize-bytes.mjs` are browser tools, run here on 9541/5641. serialize-bytes proves nothing alone: it was run on the base too and the shas compared.
- **The ABOUT face.** `lab/shell/notebook.js` holds no copy of its text. `tests/pwa.test.mjs` pins its tagline to the manifest.

## 9. Seams with Z2 and Z3

- **Z3 (`lab/chemview.js`).** I changed lines 267 (the Model note) and 711 (the ENERGY title). Z3's seats are the VALENCE title at 212 and the SCF line at about 728, so neither hunk is adjacent. I did not touch `lab/atomsview.js` or `tests/field-law.browser-test.mjs`.
- **Z2.** I did not touch `tools/provenance.mjs`, `docs/PROVENANCE.md` or `tests/provenance.test.mjs`. My NOTES-FOR-AGENTS edits are in §6 (l.98) and §7 (l.111-119). The foot, after §9, is Z2's alone.
