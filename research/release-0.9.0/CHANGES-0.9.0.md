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

## Z1 · THE PUBLIC FACE
(filled at Z1's merge)

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
(filled at the cut)

## Known, deferred (recorded)
The library study (Sol's Experiment 2 — only after a profile wins a benchmark); A9's C++ clones (cited, never merged); the iPad's field-law row (Josh runs the test and
pastes the line); the paper (1.0.0, written FROM the registry and the catalogue); the push and the deploy (Josh's, after his hand check).
