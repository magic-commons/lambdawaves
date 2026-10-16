# 0.9.0-alpha "Certification" — what changed (Claude Yan / Fable 5.1, 2026-10-16)

The engine plan's D.16. Plan `BUILD-PLAN.md` (Yan, drafted 10-16 04:00 while 0.8.0 built; base and cap filled at the 0.8.3 cut — see "The light check"). ZERO `lab/`
lines: the cut rewords, generates and measures. Three Opus builders in parallel from the base: Z1 `z1-face`, Z2 `z2-provenance`, Z3 `z3-field-law`. Build notes:
`Z1-BUILD.md`, `Z2-BUILD.md`, `Z3-BUILD.md`; the claims closed in `CLAIMS-0.9.0.md`.

## The shape
Certification is the instrument saying, in every public place, exactly what it measured and how, and nothing more. THE PUBLIC FACE (README, CITATION, the ABOUT face,
the MODEL sheet, `docs/`) reworded sentence by sentence into the STATUS grammar's three-metric lines; "nothing drifts" said of field-free hydrogen only; the strobe
sentence the flash law's own words; ChronusQ a reference with its licence line; a generated PySCF table in README. THE PROVENANCE REGISTRY `docs/PROVENANCE.md`
generated from the catalogue and the fixtures — every record's source, licence, oracle, Δ, script and cut — with THE FINGERPRINT in its head: the lock's scope, the
device row, the FIELD LAW line. THE FIELD LAW ON A DEVICE: the standing browser test (0.5.4 P7c) prints one pasteable line for the acceptance matrix. The gated
certificates where a number exists; L1's R_m caption on ATOMS.

## Z1 · THE PUBLIC FACE (README.md, CITATION.cff, `docs/SHIPPING-READINESS.md`, `docs/NOTES-FOR-AGENTS.md` §6–§7; `lab/index.html:130–131`, `lab/windows/readouts.js:87`, `lab/statesview.js:114`, `lab/chemview.js:267` + `:711`, `lab/informational.js:12` — strings; `tools/pyscf-table.mjs` 38 lines; `CLAIMS-0.9.0.md`; branch `z1-face` tip `7769926`; 0 lab lines)
- **README, sentence by sentence into the STATUS grammar:** "nothing drifts" is said of FIELD-FREE HYDROGEN only, followed by what does step in time — RUN, DRIVE, SONG, the
  FLOW tracers, the STARK eigensolve, and VIBRATE's closed-form cos ωt with one linear McWeeny step (a correction: VIBRATE does not integrate); the field law is the
  three-metric line for hydrogen and for water, each figure a gate bound from `tests/helpers/field-law.mjs`; the norm and anchor figures sit beside their bounds (the
  anchor reads 3e-16 by `status.js`' round-up of the measured 2.22e-16 — the old "2e-16" was better than measured); SLICE → PLANE; the Physics row's counts read from
  the tree today; the strobe sentence says what the flash guard does (four routes held to three flashes a second, partial, no off switch); ChronusQ is a reference
  with its licence line (GPL v2 — the tree does not record "only" or "or later" — against GPL-3.0-only: cited, never merged); "Who made this, honestly" byte-identical.
- **"## Against PySCF":** `tools/pyscf-table.mjs` rewrites a marked block — the 38 library records with E (app) · E (PySCF) · the signed Δ as stored, and the 61 live
  molecules with PySCF's STO-3G, 6-31+G* and RKS LDA energies; the app's energy for a live molecule is computed on the device and stored nowhere (`orbital-library.mjs:528–530`
  — no live app energies exist in the fixtures; the live closed shells' oracle is `sto-3g-v1.json`'s `library` block of 54 rows), so the prose names the test that
  re-solves each kind; `--check` 11,136 bytes, in step. **Found and now in the table:** five open shells offered in 6-31+G* (O₂, NO, OH, NH₂, CH₃) have no PySCF UHF
  number on file and the app correctly reads them UNCHECKED; 43 of the 51 closed shells offered LDA have no RKS oracle; **pyridine (C₅H₅N) is live but its PySCF
  reference did not converge** (`sto-3g-v1.json`) while its STATUS line still says "agrees with PySCF to …" — a new fixture, not a string (for Josh).
- **CLAIMS rows 6–11** (`CLAIMS-0.9.0.md`: row · seat · old · new · why): row 6 `readouts.js:87`; row 7 `statesview.js:114`; row 8 already true since 0.5.4 P4
  (`index.html:130`); row 10 `chemview.js:267` and its twin `:711`; row 11 `informational.js:12`; the MODEL sheet's NUMERICAL definition `index.html:131`. **Row 9 stays
  OPEN:** the EXACT badge over a molecule needs a molecule branch in `badges.js` — logic, not a string (STATUS TAGS is off by default, so the badge is hidden on a first
  run); Josh's call: rename it `REGISTER · EVOLUTION · SHADOW`, a one-line branch in 0.9.x, or leave it. CITATION.cff: the title, `0.9.0-alpha` / 2026-10-16, the abstract
  in the grammar. NOTES-FOR-AGENTS: the legacy windows were DELETED in 0.5.0 (not "hidden"), ATOMS is back, the `helium`/`h2` suites no longer exist. `notebook.js`
  holds no copy of the ABOUT text. No priority claim was found anywhere in the public face, and none was written.
- **Checked:** node 0; status.test GREEN (58 live re-solves, worst |ΔE| 9.69e-10 on Cl₂); status-probe 18 PASS; opener 7/7; serialize-bytes 11 identical against the
  base; `pyscf-table --check` and `catalogue-table --check` in step; rack-deps holds; no test pinned any changed string (grepped first). **Questions for Josh:** ABOUT and
  NOTICE keep his ChronusQ credit "for the Molecular Orbital Model" by his 09-11 ruling (REPORT.md:2475) — should they follow README's reference-and-licence line?
  Row 9's three options. Re-run the pyridine oracle?

## Z2 · THE PROVENANCE REGISTRY + THE FINGERPRINT (`tools/provenance.mjs` 111 lines → `docs/PROVENANCE.md` 55,627 bytes, 186 rows; `tests/provenance.test.mjs` 21 lines; `docs/NOTES-FOR-AGENTS.md` one foot line; `research/release-0.9.0/z2-fingerprint.json`; branch `z2-provenance` tip `7a3f62c`; 0 lab lines)
- **The registry,** generated and `--check` byte-exact (exit 1 on any byte difference, a row count unlike the catalogue's, or a molecule without a source or an oracle):
  one row per catalogue row. The `molecules` shelf's 102 rows — 98 molecules (61 live, 37 record-only) and 4 method rows — carry section · basis (the BSE hashes
  from `lab/vendor/bse/index.json`, printed once above the table) · the geometry class PER ROW (a correction: not one "experimental, UNVERIFIED — 36 of 38" class —
  `status.geometry` reads experimental 2 (C₆H₆, TiCl₄) · computed-reference 9 · optimised-here 26 · draft 1 (C₆₀); the tally stands above the table) · oracle (PySCF
  version, script, fixture, Δ where on file — the 60 live-only molecules carry the fixture and the script but their Δ reads "not on file": the app's energy is
  computed only inside their gate test, and Z1's `tools/pyscf-table.mjs` is that number's seat) · generator · since; every other shelf's row with its oracle test and
  `since`; `transition` and `rate` UNCHECKED with no oracle in substance; C₆₀'s Δ 0 by construction. "Research, not merged": A9's C++ clones, cited by path.
  **THE BSE LICENCE IS STATED NOWHERE IN THE TREE** — not in the vendored files, their index, nor NOTICE — and the registry prints "NOT STATED IN THE TREE" (an item
  for 0.9.1/1.0.0: the licence line belongs in `lab/vendor/bse/` and NOTICE).
- **The head:** (i) the lock's scope sentence and counts quoted word for word from `tools/perf/digest-lock.mjs`' header; the default fixture made 2026-09-25 on
  0.2.3-alpha.1 with no `gastab` in its url, the 1004-value s4a fixture made 2026-10-08T11:01:28Z on 0.3.3-alpha (Firefox 157) WITH `gastab=0` in its url — a
  correction to the standing lore: s4a does not predate the gas table, the default fixture does; both runs still take `--query gastab=0` as the header says;
  neither fixture records a commit (said; `e58e554` added s4a, in the note only); (ii) the device fingerprint run once on this machine at `3434be1` through
  `__LW.report({ only: 'fingerprint' })` (the full report skips the digests): Firefox 157 — adapter strings empty, driver null; 12 features offered, shader-f16
  offered, never requested, not granted; 35 limits; bgra8unorm; the 64³ digests 1s+2pz `4d36a9a5` and H₂O density `386430a4`, the same two hashes 0.5.4 P-V
  recorded; (iii) the FIELD LAW placeholder — a literal in the tool, filled by the integrator at the merge and regenerated (editing the `.md` alone fails `--check`).
- **Checked:** `provenance.mjs --check` in step; `tests/provenance.test.mjs` (one row per catalogue id; each of the 98 molecules has a source and a PySCF oracle; all 50
  fixtures and scripts the table names exist); `catalogue-table --check` (186 rows — the catalogue grew by `rydberg-s` at 0.8.3) and catalogue test green; node 0.

## Z3 · THE FIELD LAW ON A DEVICE + THE GATED CERTIFICATES + R_m (`tests/field-law.browser-test.mjs` extended; `lab/chemview.js:728` one string; `lab/atomsview.js:71–72` the caption; `tests/status.test.mjs` §5; branch `z3-field-law` tip `21cb3b0`; +1 lab line, strings)
- **The field law on a device:** the standing test (0.5.4 P7c — the plan thought it had to be written; it existed) prints ONE pasteable line at its end, green or red,
  a crash counted as a RED check so the line still prints: `FIELD LAW · <adapter> · <browser> · <commit> · hydrogen RMS … · 99.8 % … · worst … · water RMS … ·
  worst/ρmax … · GREEN|RED`. On this rig: "adapter info blank" (Firefox 157 returns an empty string for every adapter-info member — the hardware goes into the matrix
  row by hand) · Firefox/157.0 · hydrogen RMS 2.34e-6 · 99.8 % 1.88e-5 · worst 1.68e-4 · water RMS 8.31e-4 · worst/ρmax 2.86e-4 — the figures `tests/helpers/
  field-law.mjs` already records. Its asserts and constants unchanged; 0 of 9 failing. The integrator's run on 9241 at the merge is the line in PROVENANCE's head.
- **The certificates, where a number exists and nowhere else:** LDA's SCF sub-line reads "SCF converged in <n> iterations to |ΔE| < 1e-10" (the SCF routine's own
  default tolerance — `moleculeRHF` passes none; both converged exits guarantee |ΔE| < 1e-10, so the bound is on ΔE, not the residual, which is only guaranteed below
  1e-6 at the round-off floor), or "not converged after N iterations". VALENCE gains NOTHING: the tree counts valence and core orbitals and never computes a share
  of ρ. A plain RHF solve sends no iteration count to the page, so it gets no sentence. The sentences live on the cards, not in `statusOf` (the status line's
  110-character limit); `tests/status.test.mjs` §5 checks a live LDA water solve has `converged` and an integer `iterations`, and that each typed bound (1e-10,
  1e-8) equals the tolerance parsed from the solver's source.
- **L1's R_m caption on ATOMS:** the Model note shortened and the caption "Xα(2/3) + Latter tail · SCF to ‖ΔV·r‖ < 1e-8 · virtual shells (°) in the frozen field"
  (`EXCHANGE_MODEL`; the atom solver's default tolerance).
- **Checked:** node 0; status.test GREEN (491 strings + the certificate rows); status-probe 0 failing on 9561; rack-deps holds; new-project in step; serialize-bytes 11
  readings (no saved field touched); field-law GREEN 0 of 9 on 9561.

## The light check (existing gates only) and the cut
- Node gate 0 after each merge; `pwa --write`; `new-project --check` in step; `rack-deps --classes` holds; status · provenance · catalogue · molecule-head tests green;
  `tools/pyscf-table.mjs --check` (11,136 bytes, 38 records + 61 live molecules) and `tools/provenance.mjs --check` (55,899 bytes, 186 rows) in step on the merged tree;
  `tests/field-law.browser-test.mjs` once on 9241 at Z2's merge tip `dfdd2b8` — its line pasted into `docs/PROVENANCE.md`'s head through the tool's literal and the
  registry regenerated: "FIELD LAW · adapter info blank · Firefox/157.0 · dfdd2b8 · hydrogen RMS 2.34e-6 · 99.8 % 1.88e-5 · worst 1.68e-4 · water RMS 8.31e-4 ·
  worst/ρmax 2.86e-4 · GREEN" (the hardware — the RTX 3070 rig — is the fingerprint row's, since Firefox 157 blanks the adapter info); `tests/opener.browser-test.mjs`
  once on the merged tree (the ABOUT face and the MODEL sheet moved) GREEN 7 of 7; THE LOCK ×2 at the merge tip with `--query gastab=0` on BOTH runs: 860 values · 0
  readback · 0 record-byte · 59 s, and the 1004-value fixture · 0 · 0 · 59 s — strings are not pixels.
- **Lines:** 30,027 → 30,028 (+1: Z3's two certificate strings and the R_m caption net one line; Z1 and Z2 0; the law was ≤ +8). Merge order Z2 `dfdd2b8`, Z3 `1b99df7`,
  Z1 (this commit). Only `lab/sw.js` conflicted at each merge (ours, then `pwa --write`); `docs/NOTES-FOR-AGENTS.md` auto-merged (Z2's foot line, Z1's body).
- **For Josh, from this cut (each recorded above):** the BSE licence is stated nowhere in the tree (the registry says so — a line for `lab/vendor/bse/` and NOTICE);
  pyridine is live with a non-converged PySCF reference (a new fixture); CLAIMS row 9, the EXACT badge over a molecule (three options); ABOUT's and NOTICE's ChronusQ
  credit (follow README's reference line?); the s4a fixture does carry `gastab=0` in its url — the default fixture is the one that predates the gas table.

## Known, deferred (recorded)
The library study (Sol's Experiment 2 — only after a profile wins a benchmark); A9's C++ clones (cited, never merged); the iPad's field-law row (Josh runs the test and
pastes the line); the paper (1.0.0, written FROM the registry and the catalogue); the push and the deploy (Josh's, after his hand check).
