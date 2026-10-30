# 1.0.0 "λWAVES" — THE BUILD PLAN (Claude Yan / Fable 5.1, drafted 2026-10-16 ≈06:50 while 0.8.1 builds; base filled at the 0.9.1 cut)

> **2026-10-30 (iteration 028, chain F) — THE DEFINITION IS PLAN 028's.** **1.0 is the tree in which the last confirmed critical or high fix of the 028 review is closed** (`research/iteration-028/PLAN.md` § CALLS FOR JOSH, CALL 1 → C, the integrator's default of 2026-10-30; Josh overrides it by a word). This plan no longer defines
> 1.0; it is what 1.0 SHIPS WITH. THE PAPER (W1) and THE STANDALONE (W2) stand as written, and their device section says the iPad and
> iPhone rows UNVERIFIED, the win32-x64 package built and not run, and (028) the Android upload key gone (`docs/ACCEPTANCE-MATRIX.md`).
> Two lines of THE CUT below changed with the tree: BUILD_LINE lives in `lab/build-line.js` (021 D1), not `lab/rack.js`; and CHANGELOG.md
> is generated and judged (`node tools/changelog.mjs --check`, 028 R-27), so the MAJOR-FEATURES LIST is not hand-written at its head — the
> cuts since v0.5.3 are its tag sections, and iterations 017–028 are one `### wave` line each in REPORT.md (028 CALL 4 → a), which the
> v1.0.0 tag will be the first to carry. CITATION.cff's version and date move with BUILD_LINE.

The engine plan's D.18 (`../release-0.6.0/PLAN.md` l.48 "the standalone; the paper beside it"; l.308–310: "the standalone; the paper's seven sections written FROM the
certification table; the prior-art pass before any 'novel'. What the paper cannot say: 'real-time' for a card or a record; 'Lindblad' beyond the random-clock case;
any RC accuracy as the texel's; 'H₂⁺' without '1s-LCAO' if it returns; 'the quasicrystal' for a 256-vertex patch; 'DFT-certified' beyond 0.7.3's PySCF numbers;
VORTEX's event count before 0.6.3"; l.52 the thesis: *observable-certified reconstruction of interactive quantum wavefields in WebGPU*, "its table grows from 0.6.0,
one oracle per row"; PLAN-DRAFT-1 l.58: "the standalone is a wrapper around the PWA and waits on MIR's mobile upgrade; no `lab/` line is spent on it"). What
exists: 0.9.0's `docs/PROVENANCE.md` (the registry: every row's source, licence, oracle, Δ, script, cut; the lock's scope; the device fingerprint; the FIELD LAW
line), `lab/catalogue.js` (the systems with their status words), README's PySCF table and reworded public face, 0.9.1's `tools/platform/` with
`docs/ACCEPTANCE-MATRIX.md` re-measured on this machine, and THE DRAFTS of three papers in the vault (`~/Documents/OBSIDIAN/LAMB of WAVES/PUBLICATIONS & DRAFTING/
DRAFTS/` — `01-PLAYABLE-QUANTUM-FIELD`, the WRITING/EDITORIAL/TEACHING/BRANDING/LAYOUT passes 02–06 of 10-11/12, and `CLAUDE COLLECTION REVIEW — 2026-10-12` with
Paper 1 rewritten and compiled, Paper 2 empty, Codex's acceptance corrections pending — the pixel metrics any-channel RGB over the full frame, Re/Im normalised by
√ρmax of the stats buffer, authored labels pure white; Codex's 10-15 reorganisation moved the publications under `DATABASE/MATHEMATICS/APPS/LAMBDAWAVES`, the old
paths are links). Josh's dial (09:35): tight, features only, pre-1.0 — and 1.0.0 is where "pre-1.0" ends: this cut adds **ZERO `lab/*.js` lines** and changes
exactly two user-visible strings (the version line, the README status). Base: `yan-c` at the commit carrying the briefs after the v0.9.1-alpha cut (**TO FILL**).
Two Opus builders in parallel (disjoint files); the integrator merges, runs the light check, cuts `v1.0.0` "λWAVES" — LOCAL, like every cut since v0.5.3; the push,
the deploy and the store submissions are Josh's, after his hand check of the whole run.

## The shape (the law of this cut)
1.0.0 is the instrument saying it is finished, in three places that already agree. **THE PAPER** is written FROM the registry and the catalogue, never from memory:
seven sections, each number a `docs/PROVENANCE.md` or `lab/catalogue.js` or `tests/helpers/field-law.mjs` value with its metric and its source cited by file, each
figure a capture made by the capture package's road (`CAPTURE HANDOFFS/CLAUDE CAPTURE — 2026-10-12` — `__LW.scrub` + `__LW.capture.picture`, byte-identical stills,
headed Chromium on the RTX for WebGPU) with its caption from the tree's STATUS caption (`lab/windows/film.js` `caption()`); the three vault drafts are the VOICE and
the figure plan (Paper 1's eight compiled pages lead; Paper 2's empty seat is filled from the molecular and lattice shelves; the third paper's topic is Josh's
call — `PUBLICATION TOPICS.md`), but no sentence of theirs survives unless the registry backs it. THE PRIOR-ART PASS comes first: every sentence that could be read
as a claim of priority (the texel law, the catalogue-as-certificate, the one-clock modulation of a wavefield, the quasicrystal patch, the catalogue's status words)
gets a cited precedent or is reworded to a description; nothing is called "novel", "first" or "new" without that line (the paper's law; the MATHEMATICS research
discipline's). The paper's own list of what it cannot say (D.18) is a section, not a footnote. **THE STANDALONE** is 0.9.1's Linux Electron package made the release
artefact: built from the 1.0.0 tree, smoke-run, its payload sha and field-law line in the matrix, an installer for linux-x64 and a win32-x64 build (not run here),
`RELEASING.md` gaining the 1.0 section (what is released, from which commit, the three artefacts: the PWA at the address, the Electron package, the paper's PDF);
the iPad and iPhone rows stay UNVERIFIED and say so in the paper's device section (MIR mobile is unplanned — the standalone on a phone is not claimed). **THE CUT** is
the integrator's: `BUILD_LINE = '1.0.0 · λWAVES · <date>'`, README `**Status: 1.0.0.**`, the CHANGELOG with the MAJOR-FEATURES LIST since v0.5.3 (Josh's 10-09 ask:
one line per cut, 0.5.3 → 0.9.1, from each `CHANGES-X.md`'s head), the tag `v1.0.0`, snapshot. No new window, no new oracle, no new string beyond the two.

## The rows
| row | what lands | files | Δ lab |
|---|---|---|---|
| **W1 THE PAPER** (Opus, the writing lab; `opus-mathematician` for the prior-art pass if the integrator wants a second reader) | `research/release-1.0.0/PRIOR-ART.md` FIRST: every candidate claim in the three drafts and in README's public face, each with a cited precedent (DOI/arXiv/URL, read, not remembered — WebSearch/arXiv MCP, the `chronusq-2026-09-11/` record for the molecular side) or the reworded descriptive sentence; then `research/release-1.0.0/PAPER.md` (Markdown with display maths, ≤ 12 pages at the vault's format `FORMAT AND FIGURES.md`): §1 THE INSTRUMENT (what it plays, the one clock, the register, the catalogue's seven shelves with counts from `lab/catalogue.js`), §2 THE FIELD LAW (the texel: one f16 ulp + f32·|f64|; the three metrics for hydrogen and water from `tests/helpers/field-law.mjs` with the measured readings and the rig; the device line from PROVENANCE's head), §3 THE SYSTEMS AND THEIR ORACLES (the catalogue as the table — EXACT/NUMERICAL/UNCHECKED counts; one paragraph per shelf: hydrogen's closed forms, the oscillator, the box, ATOM's Xα with R_m, CENTRAL's five, quarkonium, the lattice's twelve + 0.8.1's three, the two-level register), §4 THE MOLECULAR LAYER (RHF/UHF/LDA against PySCF 2.14 — README's generated table; the 38 records' provenance; what the geometry is NOT — 36 of 38 UNVERIFIED; the H₂ curve's Coulson–Fischer point 2.179695 bohr), §5 TIME (what is exact — field-free hydrogen's phases — and what integrates: the RT run, the song drive, VIBRATE, the Stark propagator; THE LOCK's scope sentence as the reproducibility claim; the flash law), §6 DEVICES (the acceptance matrix's rows as measured on this machine; the iPad/iPhone rows UNVERIFIED with their two gates), §7 WHAT THIS PAPER CANNOT SAY (D.18's list, each with the line of the tree that bounds it) + the prior-art table's summary; figures by position from the capture package's `FIGURE STATUS MATRIX.md` (captured ones reused with Codex's corrections applied; blocked ones listed as blocked, never drawn by hand); `CITATION.cff` unchanged (Z1 made it true). The vault's three drafts are READ (`DECISION MEMO.md`, `WORK LEDGER.md`, `ATLAS TO PAPER MAP.md`, `PUBLICATION TOPICS.md`) and credited in the note; a sentence kept from them is marked with its source pass. | `research/release-1.0.0/PRIOR-ART.md`, `research/release-1.0.0/PAPER.md`, `research/release-1.0.0/figures/` (captures, ≤ 10, each ≤ 400 kB; the capture scripts in `.tmp/`, not committed) | **0** |
| **W2 THE STANDALONE** (Opus, in parallel) | On the 1.0.0 base: `npm run build` → `dist/`; `tools/platform/electron/package.mjs` → linux-x64 (installer/AppImage as the shell's script makes it) + win32-x64 (built, not run); `smoke-run.mjs` on the linux package; the field-law line from inside the package where 0.9.1 H2 found the road (else the shell's readback, said); `docs/ACCEPTANCE-MATRIX.md` gains the 1.0.0 rows (this machine's; the September and 0.9.1 rows HISTORICAL in place); `RELEASING.md` gains "## 1.0" (the three artefacts, the commit, the shas, the field-law line, "pushed/deployed/submitted by Josh"); `store/` listings re-read against README once more (the diff for Josh in the note; no listing edited); `research/release-1.0.0/W2-BUILD.md` (rows, shas, versions, the exact commands). Build outputs stay ignored by git. | `docs/ACCEPTANCE-MATRIX.md`, `RELEASING.md`, `research/release-1.0.0/W2-BUILD.md`, `.gitignore` (≤ 1 line if a pattern is missing) | **0** |
| **THE CUT** (the integrator, after W1 and W2 merge) | `CHANGES-1.0.0.md` (the shape of every CHANGES: the two rows, the light check, the line law — 0 — and the deferred list); the cut script's shape with THREE differences: `BUILD_LINE = '1.0.0 · λWAVES · <date>'`, README `**Status: 1.0.0.**` (no "alpha"), the tag `v1.0.0` whose message is the thesis in one sentence plus "LOCAL cut; the push, the deploy and the store submissions are Josh's"; `tools/changelog.mjs` then the MAJOR-FEATURES LIST hand-written at the CHANGELOG's head (one line per cut v0.5.3 → v1.0.0, each from its CHANGES head — twenty-odd lines); snapshot; HANDOFF §2 + checkpoint + memory + FOR-JOSH's closing paragraph (the whole run in one page: every cut, its tag, its lines; the open items; the hand check). | `lab/rack.js` (BUILD_LINE: 1 string), `README.md` (1 string), `CHANGELOG.md`, `research/release-1.0.0/CHANGES-1.0.0.md` | **0** (two strings) |

## Laws for the two builders
- Your own worktree, your own branch (`w1-paper`, `w2-standalone`) from the base commit; DISJOINT files; NO push; never edit `lab/**` (the line count is asserted
  unchanged at the merge); `./test.sh node` green at the end (W2: after `pwa --write` if `dist/` or the shells touch anything precached — they should not).
- THE PAPER'S LAW: every number is read from `docs/PROVENANCE.md`, `lab/catalogue.js`, `tests/helpers/field-law.mjs`, `lab/library.json`, `docs/ACCEPTANCE-MATRIX.md`
  or a fixture's provenance block, with the file named beside it in the Markdown source as an HTML comment; a number with no source is not written. Nothing is
  "novel", "first", "new" or "the only" without a PRIOR-ART row. The D.18 list is binding. A figure is a capture by the capture package's road or it is listed as
  blocked. Josh's words ("Who made this, honestly") are quoted, never paraphrased.
- THE LOCK is sacred and trivially so (no `lab/` change); the integrator runs it ×2 at the merge with `--query gastab=0` on BOTH runs anyway — the last two lock
  runs of the ladder, recorded in PROVENANCE's head by the integrator with the 1.0.0 commit.
- Never `pkill -f`; stop only your own pids; ports 9241, 9443, 8721/8741, 8731/8735 are taken; W1's captures use headed Chromium on the RTX (the capture memory's
  flags) on its own served tree, port 9581 (`LW_PORT=9581 GD_PORT=5681`); W2's Electron window is closed by its pid. The RTX is shared: `pgrep -fa 'firefox|chrom|electron'`
  before a run.
- One build note each: `research/release-1.0.0/W<n>-BUILD.md`.

## Gates (existing only) · the cut · what waits on Josh
Node gate 0; the line count unchanged; `node tools/provenance.mjs --check`, `node tools/pyscf-table.mjs --check`, `node tools/catalogue-table.mjs --check`; THE LOCK ×2;
then the local cut `v1.0.0` by the cut script's shape with the three differences above, the CHANGELOG with the major-features list, snapshot. NO push, NO deploy, NO gh
release, NO store submission, NO paper submission. Waits on Josh: the push/deploy decision for the whole v0.5.3 → v1.0.0 run (his hand check on 9241 first — the
FOR-JOSH note's closing paragraph lists what to touch); the paper's venue and the third paper's topic; the store listings' final words; the iPad M5 and iPhone rows
(his devices; the paste lines are in the matrix); MIR mobile (unplanned — the standalone on a phone is not claimed); the LOG-SPACE module (0.8.2 §F-2, still parked
if he never said); the two standing bugs (bessel's negative x; the kick's radial cache) if he wants them in 1.0.0 — each is one small row, else 1.0.1.

## Deferred past 1.0.0 (named, so nobody rebuilds them by accident)
The first RU record; Hofstadter's butterfly as a record; spin chains past N = 8; the two-qubit gate set; decoherence (Lindblad); the Gaussian well, delta shell,
power laws and radial Morse as CENTRAL presets; the separable module; field ionisation as physics; the helium space; the library study (Sol's Experiment 2); A9's
C++ clones; MIR mobile and the iPad standalone; the paper's submission.
