# BRIEF B-DISP · M8 MOLECULES' ROWS + M9 THE INFORMATIONAL WINDOW + M11 ONE A/B, STATE (0.5.3 "Rack Tune"; Opus builder; W3, beside B-PAL — `skin.css` hunk-disjoint: yours :443, B-PAL's :20/:325/:380)

**Read first, whole:** `research/release-0.5.3/PLAN.md` (§0 facts 4, 9, 11; rows M8 M9 M11; §2 gates incl. the G-B exception for M9; §7 R7 R10 R12; §11 Josh's
answers 3 and 5 verbatim), `AUDIT-OPUS-1.md` Part A rows M8 M9 M11 and Part B §3 (the overlap matrix: your files), `localise/MOLECULES-MO-REGISTRY.md` §3–§4,
`localise/PALETTE-AB-TRANSPORT.md` §2 (A/B), `lab/chemview.js:82-243` (the rows; `seats()`; the chevron :234; `rebuildOrbKnob` :363 — B-MOL edited :258-322 in W1:
read the merged tip), `lab/windows/settings-card.js` (:17-18 the one STAGE TEXT row; :96), `lab/shell/stage-words.js:83-118` (`setOn` :116, `setScale` :118),
`lab/native-ui.js:60-80` (:66 seats the row; :78-79 reorders STATE's A/B), `lab/shell/notebook.js:109`, `lab/windows/state.js:47-67` (the A/B group), one existing
small rack window in `lab/windows/` end to end (its card, its id, its listing in + and WINDOW, its WORKSPACE row — the shape M9 copies), `lab/mir/panels/ramp.js:121-159`
(READ ONLY: the kit's stepper the palette uses — the idiom M8 copies), `lab/shell/settings.js:85-95` (PREFERENCE keys), `tools/new-project.mjs` (and its `--check`),
`tests/stage-text.browser-test.mjs:104`, `tests/molecule-head.browser-test.mjs:80`, `tests/new-project.test.mjs:40`, `tests/current.browser-test.mjs:150,193`,
`tests/history.browser-test.mjs:162`, `tests/new-project.browser-test.mjs:69,89`, `tests/menubar.browser-test.mjs`, `docs/STATE-SCOPES.md`, `CLAUDE.md` (the MOLECULES,
STAGE FORMULA, three-scopes and LEGACY paragraphs), `docs/NOTES-FOR-AGENTS.md` (the rig law).

## Josh's words (§11, verbatim)
> 3: the two rows are correct but make them their own window called 'Informational'. … 5: Yes like the palette window's preset selector? section picker and molecules
> picker should look like palette window's selector. And if there's other things that could be 'left/right arrowed'.

## The rows
**M8 (+10).** Josh's layout, measured at 300 px and at phone width (report the row count): `rH` = ◂ SECTION ▸ · INSTALLED · MOLECULES ON; `r0` = the MOLECULE picker
alone, under ON; `r1` = BASIS · ORBITAL/VALENCE (a pair under `seats()`); `r2` = VIEW · the chevron — three rows plus the header unless VIEW and the chevron fit beside
BASIS and ORBITAL. **The ◂ SECTION ▸ picker AND the MOLECULE picker take the PALETTE window's preset-selector look** — the kit's left/right stepper idiom (`ramp.js:122`;
use the kit's stepper control if λWAVES can mount it, else match its CSS; never edit the kit). The select's keyboard/accessibility stays (a stepper beside a hidden
select, or the kit's own answer). **List every other control that could be "left/right arrowed"** (BASIS, the register preset, VIEW, the SECTION of other windows …)
in your BUILD for Josh — list, do not build. `lab.css:782-784` keeps the section row tight. Josh sees: the rows as he drew them, the ‹ › pickers (PNG pair).
**M9 (+45).** A NEW rack window **INFORMATIONAL** (id `informational`; a MIR-skinned card in `lab/windows/informational.js`, built like the small window you read; listed
in + and WINDOW; CLOSED by default on first run; seated under SETTINGS when opened) holding STAGE FORMULA + SIZE and ATOM LABELS + SIZE: `stage-words.js` splits
`setOn`/`setScale` into formula and labels; keys `atomLabels` + `atomLabelsSize` restored beside `molFormula`/`molFormulaSize` (PREFERENCE — `docs/STATE-SCOPES.md`); an
absent `atomLabels` takes the stored `molFormula` once (a 0.4–0.5.2 profile with STAGE TEXT off keeps its labels off); the one STAGE TEXT row LEAVES the DISPLAY tab
(`settings-card.js:17-18`, `native-ui.js:66`); the capture caption follows STAGE FORMULA; `stage-text.browser-test:104` re-pinned to the window; `notebook.js:109`,
`molecule-head.browser-test:80`, `new-project.test:40` follow. **A new window is a WORKSPACE layout row: regenerate `lab/new-project.lambdawaves.json` ONCE with
`node tools/new-project.mjs` and write the reason in your BUILD; prove serialize-bytes identical OUTSIDE the WORKSPACE keys** (`tools/serialize-bytes.mjs --out` +
`integrator/sb-compare.mjs`, read its diff). Write the CLAUDE.md STAGE FORMULA paragraph's new sentences and the STATE-SCOPES rows in your BUILD (the integrator
applies). Josh sees: the INFORMATIONAL window with its two rows; DISPLAY one row shorter (PNG pairs). (0.5.4 will seat its STATUS line here — leave room, add nothing.)
**M11 (+4).** R7: STATE only. The STATE card's group restyled: one row STORE A · A · STORE B · B with the stored slot lit by a CLASS (CSS `::after`, never a child text
node — `current:150` finds the buttons by exact `textContent`), and TRANSITION · Ω RABI · the readout on one line. Labels kept. Josh sees: the unified A/B row (PNG pair).

## Laws
Never edit `lab/mir/**`. Subtract, don't add. `node tests/pwa.test.mjs --write` after ANY `lab/` edit. JS budget **+59** total; stop at +88. No field code → no lock
(say if `stage-words` touches anything the field reads — it does not today). Servers: `python3 tools/gate/server.py <your worktree> 8983`, `LW_PORT=8983 GD_PORT=5453`;
`rigfree.mjs` before each browser suite; one suite at a time, 4 s apart (B-PAL shares the GPU); stop your server by pid. Scripts under `.tmp/`; `rack-deps.mjs` only
`--classes --no-write`. One commit per row; NO push.

## Closers
`tests/molecule-demos.browser-test.mjs`; `tests/molecular-names.browser-test.mjs`; `tests/chem.browser-test.mjs`; `tests/molecule-head.browser-test.mjs`; a hit-probe of the
new rows at phone width; `tests/stage-text.browser-test.mjs`; `node tests/new-project.test.mjs`; `node tools/new-project.mjs --check` (after the ONE regeneration);
`node tools/settings-probe.mjs --out` 0/6 (+ the two keys); serialize-bytes (identical outside WORKSPACE); `tests/menubar.browser-test.mjs` (+ INFORMATIONAL listed);
`node tests/frame-occlusion.browser-test.mjs` 7/7; `tests/history.browser-test.mjs` (:162; the WORKSPACE row); `tests/current.browser-test.mjs:150,193`;
`tests/new-project.browser-test.mjs:69,89`; `node tools/stylehash.mjs` before/after; `bash test.sh node`.

## Deliverables
`research/release-0.5.3/DISP-BUILD.md`: §1 M8 (the row count at 300 px and phone width; the picker idiom; the "left/right-arrowable" list for Josh); §2 M9 (the
window; the regeneration reason; the bytes diff; the CLAUDE.md / STATE-SCOPES sentences); §3 M11; §4 PNG pairs `eye/disp-*.png`; §5 lines; §6 what you could not
measure. Commit it. Hand back ≤ 300 words (worktree, branch, tip, commits, suites + results, blockers, next step); the same to `~/.claude/handoffs/agents/<your id>.md` if allowed.
