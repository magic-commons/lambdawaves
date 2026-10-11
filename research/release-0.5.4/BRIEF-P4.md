# BRIEF P4 · ONE PURE `statusOf()`, THREE SEATS (0.5.4 "Contract Layer"; Opus builder; STEP 2 PAIR A, second half — launched on the tip that carries P1 AND P3)

**Read first, whole:** `research/release-0.5.4/PLAN.md` (§B what Josh sees; §D facts 1, 3, 5; row P4 in §E; §F THE STUTTER LAW; §G; §J — R8 the face, R12 the vocabulary,
R14 two slots, Q12 yes, Q13 hydrogen yes), `AUDIT-OPUS-1.md` Part A row P4 (two slots, the badges' grammar; the three seats; what was struck and why — Josh's FOLD at
`chemview.js` is a ruling), `REVIEW-SONNET-2.md` (one pure `statusOf()`; water must never read UNCHECKED; the character budget), `P1-BUILD.md` and `P3-BUILD.md` (what you
read: `sol.identity`, `CONVENTIONS`, the catalogue's `oracle` / `geometry` / `status` members, the `oracles` member for live-only molecules), `lab/badges.js` (b1, the grammar,
`sheetToggle`), `lab/latex-state.js` (`moleculeHead`, a pure builder), `lab/informational.js` (0.5.3 M9 — the window you add ONE row to), `lab/chemview.js` (the fold; the
`r.refused` print at the solve landing — one token, F12′), `lab/capture.js` (`captionOf`) and the film's caption seat, `index.html` (the MODEL sheet's lines, "the 91 hydrogen
basis states"), `lab/field.js` (the texel constant), `tests/molecule-head.browser-test.mjs` (the anchored regexp — a fifth named group), `tests/chem.browser-test.mjs`,
`tests/stage-text.browser-test.mjs` (UNCHANGED — `stageCaption` is not touched), `tests/lw-facade.browser-test.mjs`, `CLAUDE.md` (MOLECULES, STAGE FORMULA, three scopes),
`docs/NOTES-FOR-AGENTS.md`. RE-FIND every seat by words.

## The row (+45 `lab/` lines ESTIMATE; stop and report at +67)
1. **`statusOf({ owner, record | sol, view, oracle, geometry })`** — ONE pure, DOM-free, node-importable function in a contract module (`lab/molecule-state.js` beside P1's
   `CONVENTIONS`, or a sibling contract file if that one would cross 300 lines — say which and why). Two slots in the badges' own grammar: the STATE word — EXACT (a closed
   form) · NUMERICAL (a solve checked against an oracle) · UNCHECKED (no oracle) — and the PICTURE as a number; VIEW adds its caveat. Hydrogen (`{ owner: 'hydrogen' }`) in the
   same function → EXACT with the field law's 2e-5. The vocabulary map written ONCE here: MEASURED or IMPORTED → NUMERICAL, UNKNOWN or absent → UNCHECKED, a closed form →
   EXACT. Every number comes from the constant the tests already assert (`oracle.delta`, the texel constant in `field.js`, the field law's 2e-5) — never typed twice. The
   strings of PLAN §B are the targets: `DENSITY · NUMERICAL · energy agrees with PySCF to 7e-9 Eh · picture good to 0.1 %` · `ORBITAL · NUMERICAL · sign and phase are
   arbitrary` · `FLOW · NUMERICAL · direction exact, size qualitative` · `1s+2pz · EXACT · picture good to 2e-5 RMS (worst voxel 2e-4)` · `· geometry computed, not measured` on the 36. **PLAN §J-2 (the P7c ruling) governs every picture number: it is read from the field-law constant PAIR B ships and SAYS ITS METRIC (RMS · worst voxel · % of ρmax) — never a bare "good to 2e-5"; a molecule's density reads `picture good to 0.03 % of ρmax`.**
2. **`chem.capability()`** a thin caller (no facade change — `lw-facade` 1/1 WITHOUT `--write`): `{ caps, observables, derivatives: 'UNKNOWN', limits { lmax 2, Z 36,
   densityAO 128, orbitalAO 768 }, precision, identity, online / cached / invalidates, status }`.
3. **Three seats from the one string:** (a) THE HEAD's last line — molecule-level only (STATE word, oracle, geometry; held, so no per-VIEW word that could go stale), through
   `moleculeHead`; the fifth named group in `molecule-head`'s regexp; (b) ONE kit `readout` row in the INFORMATIONAL window — the live per-VIEW caveat, written on change only
   (a solve landing, a VIEW change, a FLOW toggle), cached; a tap opens the MODEL sheet (`sheetToggle`) whose lines define the three words — reword the hydrogen-only sentence
   in `index.html`; no new window, no settings key, no badge, nothing above Josh's MOLECULES fold; (c) the export caption's short form appended in `captionOf` and the film's
   caption — NOT in `stageCaption` (stage-text pins its words). Plus `chemview.js`' solve-landing print gains `r.refused` (one token) so P6's sentences are read.
4. **Tests:** a node TABLE test over the 54 molecules × 4 views: every string ≤ ~110 chars, every number equals its source constant, a molecule with a fixture oracle is never
   UNCHECKED (water!), the geometry counts 2 / 26 / 9 / 1 come through; `molecule-head` (+ the group); `chem`; a hit-probe of the row at phone and tablet width (`tools/` script,
   PNG pair under `research/release-0.5.4/eye/`); MIR's `~/Documents/MIR/tools/stylehash.mjs` on the INFORMATIONAL window before/after (the stage probe's Chromium runs it —
   M-V-REPORT §6c has the launch flags); `frame-occlusion`; `stage-text` UNCHANGED; `lw-facade` 1/1; `settings-probe` 0/6; **the no-frame-call probe**: a `tools/` script that
   counts `statusOf` / `capability` calls across 3 s of playback = 0 and across a VIEW change = 1; THE LOCK ×2 (860 and 1004 · 0/0).

## Laws
No `lab/mir/**`. Subtract, don't add. `node tests/pwa.test.mjs --write` after ANY `lab/` edit. `bash test.sh node` exit 0. Your gate server on 9033 by pid, `LW_PORT=9033
GD_PORT=5503`, `rigfree.mjs` before every browser run, one suite at a time, never pipe a gate into `head`, kill by pid never `pkill -f`. `tools/serialize-bytes.mjs` 11/11
IDENTICAL and `new-project --check` in step (no key). THE STUTTER LAW is a gate, not a wish. The glass is Josh's: the readout row is the kit's `readout`, no CSS of your own
beyond a seat. Never write in `~/Documents/OBSIDIAN`. One commit per step ("P4: …"); NO push. Your tree: a fresh worktree, `git reset --hard <the tip the launch names>`.

## Deliverables
`research/release-0.5.4/P4-BUILD.md`: §1 `statusOf` and the vocabulary map with the table test's count; §2 the three seats (file:line) and the PNG pair; §3 every suite and probe
with its reading (the no-frame-call probe's numbers; stylehash's; the lock ×2); §4 lines before / after; §5 what you could not measure. Hand back ≤ 250 words.
