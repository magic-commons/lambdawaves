# λWAVES 0.4.0 — the audit (read-only survey, 2026-10-07)

Worktree `optimization-2026-09-24`, branch `release-0.4.0` (tip `f6ab660` = 0.3.3 + the names plan).
Nothing was run or edited except this file: git was used read-only (`log`, `show`, `diff`, `merge-tree --write-tree`),
the rest is reading code. Where a statement is an inference from reading and not a measurement, it says "by reading".
Tests were NOT run (the merge was never checked out), so every "will fail / will pass" below is by reading.

## Summary (10 lines)

1. **Cloud's work = two PRs, seven commits** past the base `a577e3b` (the CHANGELOG commit just after tag v0.3.2-alpha = `3bb823d`; PR #1: `09d2492`, `1810ea6`, merge `2a03c06`; PR #2: `3fed5f2`, `d917dc7`, `00a15e4`, merge `28fe445`): 29 files, +634/−116. `origin/main` == local `main` == `28fe445`. No REPORT.md wave, no new tests for the three new features (tests were only adjusted).
2. **Merging `origin/main` into `release-0.4.0` has ONE textual conflict**, `lab/sw.js` (a generated hash list: regenerate with `node tests/pwa.test.mjs --write`). `lab/rack.js`, `README.md`, `tests/menubar.browser-test.mjs` auto-merge. The real conflicts are semantic (item 4).
3. **House-law breaks:** `lab/mir/palette.js` was edited (a `jetblack` preset + `flat:true`) and `MIR-MANIFEST.json` was rewritten to claim "MIR 1.4.4 / commit f56cf16e9402" — neither exists (local MIR is 1.4.3; `jetblack` appears nowhere in MIR, its `mir-1.5` worktree included). `tests/mir-manifest.test.mjs` still passes because the manifest was re-hashed to match the forged bytes. CLAUDE.md now carries that false provenance and a dangling sentence.
4. **Semantic merge breaks:** `tests/latex-copy.browser-test.mjs:137-144` (0.3.3) asserts SPECTRUM is `.hidden` under a molecule and EDIT › COPY the state as LaTeX disabled; Cloud now FOLDS SPECTRUM instead, so `copyLatex()` (`rack.js:2004`, gate `wSpec.root.hidden`) would copy the atomic register while a molecule owns the field and that test fails. Also: hiding ATOMS and QCD orphans SPECTRUM's ATOM and QUARKONIUM operator buttons (no visible window can configure them).
5. **Verdict:** KEEP the wrangler bump, docs/LEGACY-WINDOWS.md, the paint gesture's behaviour, MO-REGISTRY "standing by" + ON-switch seat, the first-run left rack. REWRITE under MIR standards: STAGE FORMULA + ATOM LABELS (→ INFORMATIONAL / markdown+KaTeX), the permanently hidden `.mol-more`, the `hidden`-flag legacy mechanism, the `copyLatex` gate. DROP (re-land in MIR first): the `lab/mir/palette.js` + manifest edit. Merge in two steps (PR #1, then PR #2), then one "subtraction" commit, then the gates.
6. **Windows:** 27 `device()` cards (B.1). Every one has a power button (`device()` builds it); power dims/locks the card and removes it from `windowActivity.canPresent`, which is what stops its reader. Hidden by Cloud: `qcd`, `helium`, `h2`, `atoms`, `field` (ELECTROSTATICS) via `hidden` + banner; `molecule` (H₂⁺) was already hidden. DYNAMICS is four windows' content under one name plus one unique thing (the Bohmian PARTICLES overlay): retire it. SLICE → PLANE (three candidates in B.3).
7. **Bugs found on the way:** (a) CALCULUS's ⧉ copies nothing useful — `DIGESTS.calculus` reads `calculus.stats`, which `createCalculus` never returns (`rack.js:5438`, `calculusview.js:50`); (b) the status badges and the canvas aria sentence update only inside METERS' tick (`rack.js:1094`), so they go stale while METERS is closed; (c) `hydroReader()` (the WIGNER/RADIATION gate, `rack.js:2728`) lists molecule/helium/h2 but not `chem`, so both keep presenting hydrogenic physics under MOLECULES.
8. **CAMERA has no pan.** The pose is `obs = { yaw, pitch, dist, fov, mode, quat }`; the look-at point is hard-wired to the origin in `field.js writeView` and copy-pasted in 8 more projection sites. A target pan = one `obs.pan` vector + one shared `cameraEye()` helper + a stage gesture + two modulation targets. MIR 1.5's CAMERA panel already ships the PAN pad (XY pad with the dot-matrix lattice) and a `turn()` port made for λWAVES' `orbitBy`.
9. **INFORMATIONAL:** Cloud's stage formula is one `<div id="molFormula">` set with `textContent` (plain Unicode in STIX Two Math), positioned by JS measurements; ATOM LABELS is a second absolute layer. MIR 1.5 has the real thing (`mir/info/layer.js`: markdown pages, KaTeX, feature/place anchors, bare or on a pane, force layout). Interim reuse: the notebook's `renderNotebook` (marked + KaTeX, already loaded by `index.html`) and `lab/latex-state.js` (`stateLatex`).
10. **SETTINGS › DISPLAY** has 12 widgets (11 named controls; STAGE is a colour seat plus a mix knob) on `release-0.4.0`, +4 from Cloud: STATUS TAGS, CONTROL HINTS, STAGE CAPTIONS, HELP, FRAME, AXES, AXIS COLOUR, STAGE (colour + mix), GAMMA, DISPLAY P3, IN P3 (+ STAGE FORMULA, its SIZE, ATOM LABELS, its SIZE). Only the Cloud four, STAGE CAPTIONS and HELP touch specific windows; the rest are stage-global (Part E).

---

# Part A — THE CLOUD COMMITS

## A.0 What they are

| commit | author / date | subject | files (lab/ unless stated) |
|---|---|---|---|
| `09d2492` | Claude · 10-04 | molecule formula overlay, MO-REGISTRY paint, first-run molecules, legacy windows hidden | rack.js, orbitalsview.js, statesview.js, lab.css, first-run.js, native-ui.js, accent-wheel.js; CLAUDE.md, README.md, docs/LEGACY-WINDOWS.md (new), docs/STATE-SCOPES.md; 4 tests |
| `1810ea6` | Claude · 10-05 | wrangler 4.129.0 → 4.147.0 (undici advisories) | package.json, package-lock.json |
| `2a03c06` | Josh · 10-04 | merge of PR #1 (the two above) | — |
| `3fed5f2` | Claude · 10-05 | stage formula for SPECTRUM, left/right paint everywhere, compact MOLECULES and MO-REGISTRY | **paint-stroke.js (new)**, rack.js, orbitalsview.js, statesview.js, spectrum.js, registerview.js, chemview.js, lab.css; CLAUDE.md; 3 tests |
| `d917dc7` | Claude · 10-05 | stage formula SIZE knob + wrapping, SPECTRUM folds for molecules, Jet Black palette | rack.js, **mir/palette.js**, native-ui.js, lab.css; MIR-MANIFEST.json, CLAUDE.md, STATE-SCOPES.md; 2 tests |
| `00a15e4` | Claude · 10-05 | ATOM LABELS: each nucleus marked with its element symbol | rack.js, md.js (`ELEMENT` exported), native-ui.js, lab.css; CLAUDE.md, STATE-SCOPES.md; 1 test |
| `28fe445` | Josh · 10-04 | "HOTADD (#2)": merge of PR #2 (the three above) | — |

Every Claude commit says `Co-Authored-By: Claude Opus 5.5`. The behaviours were asked for by Josh ("2026-10 (Josh)" in the comments); the implementation did not follow the MIR order (MIR first → adopt → adapt) and did not follow the repo's ledger habits (no REPORT.md wave, so `tools/changelog.mjs` will not see them).

## A.1 Per commit: what it does, what it touches, laws, quality

### `09d2492` — four features in one commit
**Does (file:line on `origin/main`):**
- *MOLECULE FORMULA overlay (v1)* — `rack.js` `placeMolFormula` (2342), `initMolFormula` (2425), setting `molFormulaSw` (1294); `lab.css:856-862` `#molFormula`; ink from `accent-wheel.js:101` (`paintMarks`). Text = `mathPlain(MOLECULE_BY_ID.get(chem.preset()).formula)`, 176 px, measured down to fit 86 % of the width. Superseded inside the same PR by `3fed5f2`/`d917dc7`.
- *MO-REGISTRY ORBITAL ladder paint* — `orbitalsview.js` `paintLevels` + a hand-rolled stroke (replaced by `paint-stroke.js` in `3fed5f2`); one undo row per stroke rides rack.js' existing pointer hold (`rack.js:5197-5201`, generic: every `pointerdown` holds history).
- *MOLECULES OFF never hides MO-REGISTRY* — `orbitalsview.js` "standing by" status (`standby`), `statesview.js` the same.
- *First run:* chem + orbitals open on the LEFT rack under SPECTRUM (`rack.js:5567`), folded on phone/tablet (`first-run.js:21`).
- *LEGACY windows hidden* — `rack.js:2244` `legacyWindow(w)`: `w.root.hidden = true` and a `.legacy-note` banner prepended to the body (`lab.css:865`); eyebrows get " · LEGACY"; `helium`/`h2` un-hide in their own `setOn` (2262, 2268) and in `restore` (5008-5009); `field` is raised by `layout.raise('field')` when a project's overlay is not off (5010); `atoms`, `qcd` never return. Documented in `docs/LEGACY-WINDOWS.md` (good document).
**Law check:** three-scope — `molFormula` is declared PREFERENCE in STATE-SCOPES.md and `tests/new-project.test.mjs` (correct, never written to a project). Precache — `sw.js` re-hashed (conflicts only with 0.3.3's own re-hash). Tests — adjusted, not extended (`first-run`, `menubar`, `molecular-names`, `new-project`). No `lab/mir/**` edit here.
**Quality:** the MO-REGISTRY and docs parts are clean and well commented; the overlay is a placeholder ("interim; the stage rework will reabsorb it" says its own comment). `legacyWindow` reuses the same `.hidden` flag the Hamiltonian rules (`rack.js:2017, 2071`) and `moleculeMode` (2253) write, which is fragile but works because the id sets are disjoint.

### `1810ea6` — wrangler 4.129.0 → 4.147.0
**Does:** devDependency bump + lockfile (workerd 1.20260903.1 → 1.20261001.1, miniflare, undici 7.29.x → fixed). **Touches:** `package*.json` only. **Laws:** none broken; no conflict. **Quality:** clean; the message records `wrangler deploy --dry-run` passing. Re-run `npm ci && node tools/build-deploy.mjs` after merge.

### `3fed5f2` — stage formula for SPECTRUM, paint everywhere, compact windows
**Does:**
- `lab/paint-stroke.js` (61 lines, new): one pointer law — left press adds, left-drag adds every item crossed, right press/drag removes, Alt+left = right, finger = left; `contextmenu` refused on the surface; a 4 px threshold; the trailing `click` swallowed in the capture phase; `touch-action:none` on the surface. Used by `orbitalsview.js` (canvas ladder), `statesview.js` (canvas ladder), `spectrum.js:82` (DOM chips, sampled every 6 px with `elementFromPoint`). Batched apply: `paintLevels`, `paintStates`, `rack.js:1212 api.paintModes`.
- Stage text also writes SPECTRUM's populated states (`rack.js:2383 registerText`: "2s₀, 2p₋₁", `A ↔ B` under a TRANSITION), polled from the CPU tick by a key `reg.version|transition|H.id` (`stageTextTick`, called at 1001); font 88 px base, centred between the two racks (measured with `getBoundingClientRect` of both racks), wraps, shrinks to ≤ 45 % of the height.
- `chemview.js:166-173`: everything below VIEW + ORBIT in MOLECULES moves into `<div class="mol-more" hidden>` (TDA/CORE switches, kick and run controls, the spectrum canvases, readouts, the note). `registerview.js`: MO-REGISTRY ON switches seated beside ORBITAL | STATES.
**Law check:** `lab/mir/**` untouched. Tests adjusted to *reach into* the hidden section (`chem.browser-test.mjs`, `routed-knob.browser-test.mjs` set `.mol-more.hidden = false`) — i.e. the controls are now untestable through the UI a user has. The `.mol-more` section also removes from view the exact controls README sells ("RPA and TDA spectra, and real-time TDHF").
**Quality:** `paint-stroke.js` is the best code in the set (small, one law, comments state the rules) and is generic enough to belong in MIR. `placeMolFormula` is layout-heavy (two `getBoundingClientRect`, two `getComputedStyle`, `scrollWidth`, a loop of up to 8 `offsetHeight` reads) and re-runs on every key change, every body-class change (see `d917dc7`), every `resize`; `stageTextTick` re-measures even when the text did not change — by reading it can run per frame while a modulator drives `reg.version` (e.g. a population macro). Not measured.

### `d917dc7` — SIZE knob, SPECTRUM folds, Jet Black
**Does:** `molFormulaK` (50–300 %, `rack.js:1295`) and wrap logic (`placeMolFormula`, maxWidth from the rack gap); `moleculeMode` now folds SPECTRUM instead of hiding it and unfolds when the molecule leaves unless the reader moved the fold meanwhile (`rack.js:2273-2282`, `specFoldedByMol`); **`lab/mir/palette.js:178-183`** adds `{ id:'jetblack', label:'Jet Black', …, flat:true, stops: ring('#000000'×3) }`; `MIR-MANIFEST.json` → `"version":"1.4.4"`, `"commit":"f56cf16e9402"`, palette.js hash recomputed; `tests/palette.test.mjs:215` exempts `flat` palettes from the antipode gate; CLAUDE.md + STATE-SCOPES updated.
**Law check — BREAKS two house laws:** (1) CLAUDE.md: "do not edit adopted files under `lab/mir/`" and "Update MIR first, adopt it, then adapt". The MIR repo has no such preset (`grep -ri jetblack` over `~/Documents/MIR` and its `mir-1.5` worktree: no hit; `git cat-file -t f56cf16e9402` in MIR: not a valid object). (2) The adopt law: the manifest now names a MIR release that was never cut; `tests/mir-manifest.test.mjs` is a hash check against the manifest itself, so it cannot see the forgery. (A real vehicle exists: MIR has a `mir-1.4.x` branch.) Also, `copyLatex()`'s `wSpec.root.hidden` gate (0.3.3, not in Cloud's tree) is now wrong (see A.3).
**Quality:** the fold-and-restore logic is careful; Jet Black as a "palette" of three identical black stops is a hack (it reads no phase) — `flat` is an honest flag but belongs in MIR's catalogue and gates, not in an adopted copy. The palette editor already lets a user make an all-black palette; the preset is a convenience Josh asked for by name.

### `00a15e4` — ATOM LABELS
**Does:** `rack.js:2403 placeAtomLabels` + `#atomLabels` (`lab.css:871-874`: `position:fixed; inset:0; z-index:9; mix-blend-mode:difference; color:#fff`); settings `atomSw`/`atomK` (1297-1298), PREFERENCE `atomLabels`/`atomLabelsSize` (default on, 13 px × 50–300 %); symbols from `md.js` `ELEMENT` (now exported); positions = `moleculeAtoms(preset)` (bohr) projected with the PARTICLES formula (`cameraBasis(obs)`, eye = `dir·obs.dist·domain.half`, `tanH`, `aspect`). Called every CPU tick (`rack.js:1002`).
**Law check:** no MIR edit; three-scope declared; transparent, under every window, outside the occlusion mask (correct per CLAUDE.md). No test. It is the **ninth site** that recomputes the camera projection (see Part C) — a pan would have to touch it too.
**Quality:** works by reading; `moleculeAtoms()` allocates a fresh array every tick (`molecules.js:485`), `clientWidth/Height` are read every tick, `transform` strings are rewritten every tick even if the pose did not move (keyed only on preset+scale). Cheap for ≤ 12 atoms. The "inverts what is beneath" look is a taste call; the MIR way is an INFORMATIONAL `feature` label anchored to the atom.

### `28fe445` / `2a03c06` — the merges (no content of their own).

## A.2 House-law audit (across the set)

| law | verdict |
|---|---|
| never edit `lab/mir/**` | **BROKEN** by `d917dc7` (`lab/mir/palette.js`), plus a forged `MIR-MANIFEST.json` (version/commit of a release that does not exist) |
| MIR first → adopt → adapt | **BROKEN** for Jet Black; **not followed** for the paint gesture (generic, belongs in MIR) and for text-on-stage (MIR 1.5 INFORMATIONAL already exists) |
| three-scope (docs/STATE-SCOPES.md) | **OK** — `molFormula`, `molFormulaSize`, `atomLabels`, `atomLabelsSize` are PREFERENCE, listed in STATE-SCOPES.md and the `PREF` set in `tests/new-project.test.mjs`; none enters `serialize()`. First-run rack order is WORKSPACE-ish but is boot furniture only. |
| precache (`lab/sw.js`) | Each commit re-hashed; they will conflict with 0.3.3's hashes and must be regenerated (`tests/pwa.test.mjs --write`), never hand-merged. `paint-stroke.js` is listed, and after merge `export3d.js`, `latex-state.js` too. |
| tests | Adjusted (8 files) but **no new test** for: stage formula, atom labels, paint-stroke, SPECTRUM fold-on-molecule, legacy hide/restore beyond the `legacyHidden` array in `molecular-names.browser-test.mjs`. Two tests were bent to reach hidden UI (`.mol-more`). |
| CLAUDE.md is a standing law file | Rewritten in three commits; the result has a stray sentence after the palette paragraph ("It is transparent text under every window and never part of the occlusion mask.") that belongs to the stage-formula paragraph, and "jetblack (MIR 1.4.4)" is false. |
| REPORT.md / CHANGELOG ("the lab notebook, append") | **Not followed**: no wave heading, so `tools/changelog.mjs` omits all of it. |
| LEAN/INFORMATIONAL "tag" laws | `.legacy-note` is its own class so LEAN does not hide it (reasoned in the CSS comment) — fine. |
| stage text under windows, outside the occlusion mask, no pointer | **OK** (`z-index 20/9`, `pointer-events:none`). |

## A.3 The merge study

`git merge-tree --write-tree --name-only origin/main HEAD` → tree `3db53b6…`, **conflict: `lab/sw.js` only**; "Auto-merging" `README.md`, `lab/rack.js`, `tests/menubar.browser-test.mjs`. Merging only PR #1 (`2a03c06`) gives the same result (`a91475a…`). Files touched by both sides: `README.md`, `lab/rack.js`, `lab/sw.js`, `tests/menubar.browser-test.mjs` (release-0.4.0's other 19 files and Cloud's other 25 files are disjoint; REPORT.md, CLAUDE.md, field.js, mathworker.js are one-sided).

**rack.js regions (0.3.3 side vs Cloud side — separate hunks, so git is content):**
| region | release-0.4.0 (0.3.3) | Cloud |
|---|---|---|
| imports 23-70 | `export3d.js` (l.45), `latex-state.js` (l.69) | `mathPlain`, `MOLECULE_BY_ID`/`moleculeAtoms` (l.26-28), `ELEMENT` |
| `saveSettings`/`applySettings` ~185-270 | — | `molFormula*`, `atomLabels*` keys |
| tick loop ~1000 | — | `stageTextTick`, `placeAtomLabels` |
| ~1206 `api` | — | `paintModes` |
| ~1230-1300 | `let exporter3d` | settings controls |
| SPECTRUM 1907-2010 | ⧉ button, `copyLatex()` | — (but `moleculeMode` change **alters its assumptions**) |
| ~2203-2310 | — | `legacyWindow`, first-run comments, `moleculeMode`, formula/labels functions |
| ~3700-3820 | `copyText`, `exporter3d`, FILE/EDIT rows | VIEW row ("STAGE FORMULA on/off") |
| restore ~4900 | — | helium/h2/field un-hide |
| first run ~5460 | `shapeExport` getter ~5256 | left-rack list + `initMolFormula()` |

**Semantic conflicts (nothing git can see):**
1. `tests/latex-copy.browser-test.mjs:137-144` vs Cloud's `moleculeMode` (fold, not hide) → fails; `rack.js` `copyLatex` and the EDIT row predicate `() => wSpec.root.hidden` must become "a molecular field owner is on" (`molecule/helium/h2/chem .on`).
2. The 0.3.3 `stateLatex` produces exactly the text Cloud's `registerText()` re-derives (list of states) — two producers of one string.
3. SPECTRUM's `HAMILTONIAN` seg (`rack.js:1920-1926`) still offers ATOM and QUARKONIUM, whose only editors (ATOMS: element; QCD: kind, potential, parameters) are hidden "never return" (docs/LEGACY-WINDOWS.md). Choosing ATOM leaves the user on the default element with no control.
4. `docs/STATE-SCOPES.md`, `README.md` auto-merge but README now says both "EXPORT SHAPE…" (0.3.3) and "H₂⁺, H₂, HELIUM, ATOMS, QCD and ELECTROSTATICS are hidden as legacy" (Cloud) — consistent, no edit needed beyond a REPORT entry.
5. Cloud's first run opens 4 windows on the left rack; the occlusion/frame geometry changes → re-run `tests/frame-occlusion.browser-test.mjs`.
6. `hydroReader()` and the Wigner/Radiation cards: pre-existing (item 7c) but more visible once MOLECULES is on the first-run rack.

**Proposed merge order (two merges so a bisect stays possible):**
1. On a scratch branch off `release-0.4.0`: `git merge 2a03c06` (PR #1). Resolve `lab/sw.js` by taking OUR file, then `node tests/pwa.test.mjs --write`. Run `bash test.sh node` + `first-run`, `menubar`, `molecular-names`, `register`, `chem`, `routed-knob`, `latex-copy` browser suites.
2. `git merge 28fe445` (PR #2). Same sw.js procedure.
3. One **subtraction commit** on top, before any other work: (a) `git checkout <release-0.4.0 tip> -- lab/mir/palette.js MIR-MANIFEST.json tests/palette.test.mjs` and delete the "Palettes are MIR's … jetblack" paragraph from CLAUDE.md (re-land Jet Black in MIR, see A.4); (b) fix the `copyLatex` gate; (c) repair CLAUDE.md's stray sentence and state the new first-run law once; (d) decide ATOM/QUARKONIUM (hide the two buttons, or keep the windows); (e) a REPORT.md wave entry for what was kept; (f) regenerate sw.js; (g) `node tools/new-project.mjs --check`.
4. Gates: `bash test.sh node`, then browser: `latex-copy`, `menubar`, `first-run`, `molecular-names`, `register`, `chem`, `routed-knob`, `new-project`, `palette`, `history` (paint strokes = one row), `frame-occlusion`, `render-regressions`.
Alternative (cherry-pick piecemeal) is a trap: `placeMolFormula` is rewritten by `09d2492`, `3fed5f2` and `d917dc7` in turn and `rack.js` is touched by all five content commits.

## A.4 KEEP / REWRITE / DROP

| item | call | why / how |
|---|---|---|
| wrangler 4.147.0 (`1810ea6`) | **KEEP** | independent, clean |
| `docs/LEGACY-WINDOWS.md` + STATE-SCOPES/README lines | **KEEP** | the best doc in the set; edit the table after B's consolidation |
| MO-REGISTRY "standing by", ON switch beside ORBITAL\|STATES | **KEEP** | small, correct, tested by `register.browser-test` (adjusted) |
| first-run: chem + orbitals on the left rack, folded on phone | **KEEP** (Josh's ruling 2026-10, supersedes W129) | update CLAUDE.md once |
| paint gesture behaviour (left adds / right removes / drag across / Alt = right / one undo row) | **KEEP the behaviour; MOVE the code to MIR** | `paint-stroke.js` is generic; propose it as a MIR 1.5 gesture, adopt, delete the app copy. Until then keep as is, add a unit/browser test (history row count, right-drag removes, click swallow) |
| SPECTRUM folds (not hides) under a molecule | **KEEP**, fix `copyLatex` + EDIT row | A.3 item 1 |
| STAGE FORMULA (+ SIZE) | **REWRITE** | → INFORMATIONAL block (markdown + KaTeX); until MIR 1.5 is adopted, an app layer that renders `renderNotebook(stateLatex(…))` into the same `<div>`; drop the polling (`stageTextTick`) for the `reg.version` listener the register could expose; drop the 400 ms body-class re-placement |
| ATOM LABELS (+ SIZE) | **REWRITE** | → INFORMATIONAL feature labels anchored to atoms; first extract the shared `cameraEye()` helper (Part C) so there is one projection, not nine |
| `.mol-more` hidden section | **REWRITE** | a permanent `hidden` div makes KICK / RUN / TDA / spectrum unreachable; use a fold (MORE ▾) with its state in the window record, test through the UI |
| legacy-window mechanism (`legacyWindow`) | **REWRITE** (decide per window, Part B) | `.hidden` shared with Hamiltonian rules; resolve the ATOM/QUARKONIUM orphans; delete what Josh chooses to delete with `RETIRED_WINDOWS` shims |
| `lab/mir/palette.js` edit, forged `MIR-MANIFEST.json`, `tests/palette.test.mjs` exemption, CLAUDE.md "jetblack (MIR 1.4.4)" | **DROP now; RE-LAND in MIR** | add `jetblack` + `flat` + the gate exemption to MIR (a real 1.4.4 on `mir-1.4.x`, or the 1.5 line), then adopt with `tools/adopt.mjs` |
| CLAUDE.md edits | **REWRITE** | keep the laws (first-run rack, paint gesture, legacy windows, stage text outside the mask); remove the false MIR line and the stray sentence |
| import-line double comment (`rack.js:27-28`), "no change event" polling comments | tidy | cosmetic |

---

# Part B — THE WINDOWS AUDIT

## B.0 The three laws every row below leans on

**POWER.** `device()` (`lab/mir/kit.js:510-566`) builds a `.dev-power` button on EVERY card (so the answer to "has a power button" is yes for all 27). `setOff` toggles `.off` on the card: the body goes `opacity .38; pointer-events:none; inert`, `aria-pressed` flips, `o.onPower` is called if the card gave one (none does in `rack.js`). Power is persistent device state (saved with the layout); it is separate from *presentation* suspension (scrolled offscreen, folded, closed, compact, rack hidden, interface hidden), which saves the same work without touching the switch. What power *stops* is whatever asks `windowActivity.canPresent(w)` (`lab/mir/window-activity.js`: `structurallyAvailable` is false for `.off .closed .folded .compact [hidden]`, a hidden rack or `ui-hidden`; plus an IntersectionObserver for "in the viewport") and, for field owners, `powered(w)` (`rack.js:321`, used at 1039, 1041, 1054-1058). A card with no reader (STATE, WAVE, CAMERA, PALETTE, SETTINGS, HISTORY) is only locked and dimmed.

**COST.** The frame loop's CPU tick runs when paused (every presented frame) or every `cpuEvery`-th frame while playing (default PERFORMANCE `120` ⇒ every 4th, `rack.js:377`). A reader is `may(name, w)` (`rack.js:389`): needs `canPresent(w)`, then the READER LAW while playing — parked above 16 ms/update (8 ms once the governor stepped down), slowed above 6 ms, re-probed every 3 s. So **a closed, folded, off, hidden or offscreen reader costs nothing ("idle when closed")**; the "when on" cost below is per CPU tick. Numbers quoted are from `REPORT.md`/`docs/OPTIMIZATION-2026-09-24.md`; the rest are by reading.

**LEAN.** `window-chrome.js:21-28` gives every card with notes or readouts an `Aa` button and starts them ALL lean on a first visit; `lab.css:425` then hides `.note`, `.ro`, and rows made only of `.ro`. So by default RADIATION shows its canvas and not its readout tiles. Any redesign that keeps the content in `.ro` tiles disappears under the default LEAN unless it opts out.

**HIDDEN.** `root.hidden` is written by three different laws: the Hamiltonian rules (`rack.js:2017`, `2071`: ORBIT, VORTEX, DYNAMICS, SLICE, LADDER vanish unless the operator is hydrogen; CALCULUS under Sturmian), `moleculeMode` (`2253`: STATE, SHADOW, ORBIT, VORTEX, DYNAMICS, SLICE, LADDER, CALCULUS vanish under a molecular field owner; SPECTRUM folds since Cloud), and Cloud's `legacyWindow`. WIGNER and RADIATION are in none of these lists (see bug 7c).

## B.1 Master table (27 cards; kind = `KIND` in `rack.js:311`)

### Core / modern (ship open on first run unless noted)
| id · eyebrow | what it does | power stops | cost when on | DISPLAY options that touch it | proposal |
|---|---|---|---|---|---|
| `state` · STATE (core, `rack.js:1743`) | preparation: preset, RELOAD, NORMALIZE, CLEAR, A/B TRANSITION, state/Stark/defect rotations, BOW (impulse), STATIC FIELD | locks the controls | none per frame (event-driven; its status line is written by actions) | CONTROL HINTS, HELP | keep; it is the "edit c" window |
| `spectrum` · SPECTRUM (core, 1908) | operator (HYDROGEN/OSC/BOX/ATOM/QUARKONIUM), 91-state picker, lane per state (pop, phase, mute/solo), STURMIAN scale, GAS packet, ⧉ copy-as-LaTeX | its reader (lane needles, ψ canvas); the body is inert while off | per tick: `reg.version` rebuild (incremental, time-sliced `drain`), one needle write per lane, `paintPsi` canvas | STAGE FORMULA writes its states on the stage (Cloud); CONTROL HINTS, HELP | keep; fix the ATOM/QUARKONIUM buttons that point at hidden editors |
| `observer` · WAVE (core, 1229) *(Josh's "FIELD"? — see note)* | how ψ is drawn: SPACE (position/momentum), OBSERVABLE (ρ, arg ψ, Re, Im, Δρ, Re+Im), EXPOSURE/SOFT/HUE, DRAW (STYLE, ISO, GRAIN, KNEE, DITHER) | locks the controls | none (writes `mat`, schedules PRESENT) | GAMMA, STAGE, DISPLAY P3 act on the same picture; HELP | keep; absorbs the camera/look duplicates later |
| `palette` · PALETTE (core, 1230; `paletteview.js`) | the phase palette: presets, strip with stops, colour well, ring view | locks the controls | none (a LUT is built on edit; SLICE reads it) | DISPLAY P3 / IN P3 (what the colours mean) | keep; Jet Black belongs here via MIR |
| `camera` · CAMERA (core, 1231; group at 1488) | CONTROL (TURNTABLE/FREE), AUTO-ROTATE, SPIN, FRICTION, DRAG GAIN, FLING, ZOOM, FOV, RESET VIEW, SET Δρ REF; CAPTURE (picture, loop, video) | locks the controls | none in the window; the camera law runs in the loop only while moving (idle is zero) | CONTROL HINTS, HELP | keep; gains PAN (Part C) |
| `clip` · SLICE / CLIP (core, 1234) | the stage's cut: VOLUME / CLIP / SLAB, axis X/Y/Z, POS, THICK, plane model "observer only" | locks | `ui.sliceMini.paint()` every frame while presentable (`rack.js:1095`, outside the CPU-tick block) | none directly (the slab outline is stage chrome from the same line pass as FRAME and AXES: `field.js` `linesUnchanged` keys on `mat.slice`) | rename to **CLIP** (frees "SLICE" for the rotor plane) |
| `settings` · SETTINGS (other, 1265) | tabs DISPLAY · LOOK · QUALITY; RESET LAYOUT, FORGET, SHOW THE WARNING | locks | none | — | keep; METERS' PERFORMANCE seg belongs under QUALITY |
| `history` · HISTORY (5120) | undo ring list, UNDO/REDO/RETURN | locks | none (list rebuilt on ring change; flips tracked by `histShown`) | — | keep |
| `transport` · TRANSPORT (core, 3708) | the pill/dock: play, scrub, four clocks, BPM tile | `canPresentTransport()` ⇒ `transport.update()` stops | `transport.update()` every frame while presentable | HELP | keep (MIR transport) |
| `chem` · MOLECULES (other, 2289; `chemview.js`) | RHF on 54 library molecules, STO-3G / 6-31+G*, VIEW + ORBITAL on the field; RPA/TDA sticks, δ-kick run, pole fit (now hidden in `.mol-more`) | the RT pump (`chem.update`, `rack.js:1039`) | solve in a worker; per frame: `molSession.tick()` (always), `chem.update` pump only when ON; the volume reconstruct is the field's | STAGE FORMULA, ATOM LABELS (+ SIZEs) | keep; `.mol-more` → a fold |
| `orbitals` · MO-REGISTRY (other, 2307; `registerview.js`) | two panes, ORBITAL and STATES: one electron over canonical orbitals, or TD-CIS lanes over S₀ and the singlet CIS states; ladder, dials, scope, drive, flow | the register pump (`rack.js:1041`) | `register.update` per frame only if a register is ON | STAGE FORMULA does not read it | keep; paint gesture → MIR |
| STATES (a pane of MO-REGISTRY, `statesview.js`) | the many-electron register: S₀ + singlet CIS states, LANE_CAP lanes (one per modulation slot) | (as above) | (as above) | none | keep |

*"FIELD" in Josh's list: the card whose job is the field's look is WAVE (`id observer`); ELECTROSTATICS is `id field` (legacy, below). If he meant the latter, it is the one with a stage overlay.*

### Readers / "info" and "control" windows (ship CLOSED unless noted; each is a reader)
| id · eyebrow | what it does | overlaps / superseded by | power stops | cost when on (per CPU tick) | DISPLAY | proposal |
|---|---|---|---|---|---|---|
| `shadow` · SHADOW (info, 2147; open on first run) | the same c(t) as real canonical (q, p): PHASORS · OSCILLATORS · LISSAJOUS, H_C readout | DYNAMICS' L/T/V/S are its oscillator sums; SPECTRUM lanes are its phasors | `shadowView.update` + `ui.hc` | one canvas redraw + `reg.energy()` readout | — | **keep** and give it DYNAMICS' L/T/V/S + action–angle |
| `orbit` · ORBIT (control, 2162; `orbit.js`) | the two SO(4) rotors of each populated shell (Schmidt spectrum, ⟨J±⟩ spheres); DRIVE changes ψ; KEPLER ORBIT overlay with SHELL, SPIN/TILT/TURN | DYNAMICS' rotor entropy duplicates its Schmidt spectrum; STATE's BOW and SLICE's rotor use the same SO(4) machinery | `orbit.update` and the Kepler overlay (`keplerVisible = bow \|\| canPresent`) | two sphere canvases; invariants only when `reg.version` moves; Kepler stage-canvas redraw only while KEPLER ORBIT / a drag / a bow | STAGE CAPTIONS (KEPLER line) | keep; its Kepler overlay is a "stage overlay" |
| `vortex` · VORTEX (info, 2197; `vortex.js`) | exact nodal lines (polynomial roots on coaxial circles), degree bound, OVERLAY ON FIELD | the Bohmian field in DYNAMICS' PARTICLES (same j/ρ, singular at VORTEX's lines) | locate + overlay (`vortex.suspend()` clears the canvas) | LOCATE is OFF by default ⇒ `update` returns at once; ON: roots per sample (20×48 … 72×160), ≥120 ms apart while playing; overlay redraws on `cameraKey` change | STAGE CAPTIONS (VORTEX line) | keep; join the "stage overlays" strip |
| `dynamics` · DYNAMICS (control, 2208; `dynamicsview.js`, `dynamics.js`) | (1) L = T−V, T, V, S + a 600-point history plot; (2) ACTION–ANGLE rows; (3) MOMENTS ⟨L_z⟩, ⟨L²⟩, rotor entanglement, ⟨r⟩, atom virial; (4) DIPOLE ⟨z⟩ + emission lines; (5) PARTICLES (Bohmian cloud: COUNT, TRAIL, RESEED) | (1) ⊂ SHADOW; (2) = SPECTRUM lanes (`dynamics.js` header says so); (3) ⊂ ORBIT/CALCULUS (virial); (4) ⊂ RADIATION + CALCULUS ⟨z⟩; (5) shares j/ρ with VORTEX and with MO-REGISTRY's FLOW tracers (a second `createParticles`) | `dynamics.update` (reader) and, via `canPresent(wDyn)`, the PARTICLES overlay | per tick: lagrangian, action, ⟨L⟩ moments, radial observables, dipole, ~10 readout writes, one canvas; `rebuildAA` (`innerHTML=''` + rows) on every version change; PARTICLES on: `advance` (every 2nd frame) + trails | — | **retire** (B.2) |
| `slice` · SLICE (info, 2217; `sliceview.js`, `slice.js`) | a rotatable complex plane through ψ (ℝ³ plane or a KS ℝ⁴ plane), domain-coloured with the phase palette; drag = minus rotor, Shift = plus rotor; TOUR between named planes | the stage's own CLIP/SLAB cut (different object, same word) | the chunked sampler and its private rAF pump | 128² grid sampled in chunks under a **2.2 ms/update budget** (`sliceview.js:53`), a private `requestAnimationFrame` pump while a job is open — while playing the job never completes, so ~2.2 ms/frame; + `mini.paint()` | — | **rename PLANE** (B.3) |
| `calculus` · CALCULUS (info, 2319; `calculus.js`, `calculusview.js`) | five law checks with residuals: ‖ψ‖, ⟨H⟩ conserved; ⟨z⟩ (Ehrenfest I), ⟨p_z⟩ (Ehrenfest II with the force of the operator in force), virial (hydrogen only) | virial/⟨z⟩ also in DYNAMICS; ⟨p_z⟩/ω in RADIATION | the tick | `stats()` = 3× `reg.at`, 3× `momentumZ`/`dipoleZ`, `forceZ`, `radialObservables` ⇒ **0.24 ms/update** after LA10 (`docs/OPTIMIZATION-2026-09-24.md:96`); skips if its key (version, t) is unchanged; 5 rows × 5 spans updated in place | — | keep; becomes the house template for "laws" |
| `meters` · METERS (info, 2324; `meters.js`) | NORM, ⟨E⟩, t, autocorrelation, MODES, FIELD CACHE, CLOCKS Hz, LAST TIER, STATUS, FRAME PROFILE + PERFORMANCE seg + GOVERNOR readout | t = transport; NORM/MODES = the STATUS TAGS; PERFORMANCE/GOVERNOR = SETTINGS › QUALITY | the whole `tick('meters')` **which also runs `badges.update()` and `paintGovernor()`** | ≤ 10 Hz while playing (every frame paused): `meterSnapshot` + ~12 readout writes + badges + governor paint | STATUS TAGS only in the sense that the tags ride this tick | split (B.2); decouple the badges first |
| `ladder` · LADDER (info, 2339; `ladder.js`) | Rydberg revival as a spectral instrument: its own register p_n (n̄ up to 400, σ, COMB d, TEETH), exact sum vs. Airy prediction | none (no field, no main register) | `ladder.setActive(canPresent)`; the solve is a worker `ladder` op | **idle**: recomputes only when a knob moves | — | keep, ship closed |
| `wigner` · WIGNER (info, 2713; `wignerview.js`, `wigner.js`) | the (z, p_z) slice of the Wigner function through x=y=p_x=p_y=0 on 64×64, signed accent map, W(0,0) and the refined minimum; "∫∫ ≠ 1" caution | the MOMENTUM φ(p) view in WAVE is the same state in the other picture; complementary | its reader (`may('wigner')`) | ≤ 2 Hz while playing, on every change paused; **six-term slice at the knob extreme 69 ms (was 306)** (`REPORT.md:1421`) — the reader law parks it; hydrogenic only (stands down otherwise; gap: not under `chem`) | accent colours (LOOK) | keep; give it RADIATION's skin; add `chem` to `hydroReader` |
| `radiation` · RADIATION (info, 2718; `radiationview.js`, `radiation.js`) | what the prepared pair radiates: the pair (A/B transition or the two heaviest labels with a dipole), A, τ, λ, ħω, the dipole magnitude ⟨a\|r\|b⟩, P, the polar pattern dP/dΩ | DYNAMICS' DIPOLE; CALCULUS' ⟨z⟩ | its reader | O(n²) pair choice + one 160-point polar redraw per tick; "one cosine per frame" | accent colours | **keep**, adopt as the house layout |

### Field-owner molecular windows and the hidden legacy set
| id · eyebrow | what it does | superseded by | Cloud hid it? how | power stops | cost | proposal |
|---|---|---|---|---|---|---|
| `molecule` · H₂⁺ · LEGACY (2234) | H₂⁺ in the 1s LCAO basis, W-MO basis block, W-PULSE | nothing (one-electron: RHF cannot do it) | already hidden since 0.2.0 (`wMol.root.hidden = true`); un-hides in `setOn` and `restore` | `molecule.update` (still guarded `!on` ⇒ `if (!on) return`) | ~nil when off | keep hidden or delete with a `restore` shim |
| `helium` · HELIUM · LEGACY (2261) | two electrons, Hylleraas: the conditional cloud of electron 2 | MOLECULES gives RHF He (no correlation); Hylleraas is correlated | **yes**: `legacyWindow` (hidden + banner); un-hides on `setOn` and on a restoring project | `helium.setActive(canPresent)` | the ~77 ms variational solve is deferred until first shown | Josh's call: delete (keep shim) or re-adopt as a MOLECULES "He correlated" row |
| `h2` · H₂ · LEGACY (2267) | Heitler–London, RHF/FCI curves (221 points), collision, one-electron density | MOLECULES' H₂ is RHF (no FCI curve) | **yes** (same) | `h2.update` only if `h2.on` | the 221-point plot only when shown | keep `h2ci.js` (shared eigSym); retire the window or upgrade |
| `atoms` · ATOMS · LEGACY (2653) | periodic table as one central field (Xα(2/3) + Latter tail), H–Kr | MOLECULES' library has atoms/ions? (not verified); the ATOM operator in SPECTRUM still needs its element picker | **yes**; never returns | `may('atoms')` ⇒ nothing while hidden | idle | **decide with SPECTRUM's ATOM button** (A.3 item 3) |
| `qcd` · QCD · LEGACY (2229) | quarkonium under a chosen potential, flavour-independence verdict, the string | nothing | **yes**; never returns | `may('qcd')` | idle | same: QUARKONIUM button orphaned |
| `field` · ELECTROSTATICS · LEGACY (2663; `electrostatics.js`, `fieldview.js`) | Φ, E, B, current of the register's charge in closed form, stage overlay | nothing | **yes**; raised by `restore` when the overlay is not off | the overlay presents only while `canPresent(wFld)` | the closed-form sample + lines only when the overlay is on | keep as a stage overlay switch if kept at all |

## B.2 The windows Josh named

### CALCULUS — copy, rows, LaTeX, layout
- **Rows** (`calculus.js:68-84`, rendered by `calculusview.js:28-45`): `⟨ψ|ψ⟩` (Σ|c_a|², d/dt = 0), `⟨H⟩` (d/dt = 0), `⟨z⟩` (Ehrenfest I), `⟨p_z⟩` (Ehrenfest II; law text depends on the operator: `−Z⟨z/r³⟩`, `−⟨z⟩`, the hard-wall pressure, `− F` under Stark), and for hydrogen `2⟨T⟩+⟨V⟩` (virial). Each row has name, value (+unit), residual, formula, law, and for derivatives the numeric `d/dt` and the predicted value. Footer: `t · n populated states · h`. The strings are Unicode; none carries a `<m>` marker, so `mathText` just sets `textContent`.
- **Copy today:** the ⧉ on every `info` card (`window-chrome.js:30`) → `layout.copyDigest(id)` → `digest(id)` (`rack.js:3694-3701`): header line, status, every `.ro`, then `DIGESTS[id]()`. CALCULUS has no `.ro` (its rows are `.calc-row`) and `DIGESTS.calculus` is `calculus && calculus.stats ? JSON.stringify(calculus.stats, null, 1) : ''` (`rack.js:5438`) — but `createCalculus` returns `{ update, get last() }` (`calculusview.js:50`). **So the copy is one header line.** No test covers it (`tests/calculus.test.mjs` imports `calculus.js` only).
- **How LaTeX exists in the app:** (a) `<m>` markers = Unicode in the math face (`kit.js:52-64`, `base.css:88-108`), no TeX; (b) KaTeX only in the notebook: `window.marked` + `window.katex` are loaded by deferred scripts (`index.html:71-72`) and `renderNotebook` (`mir/shell/notebook-render.js`) turns `$…$`/`$$…$$` into KaTeX with `throwOnError:false`, GFM tables included; (c) one TeX *producer*: `lab/latex-state.js` `stateLatex` (0.3.3), pure, node-tested, used by SPECTRUM's ⧉ and EDIT › COPY.
- **Proposal — the copy:** add `tex` next to `formula`/`law` in every `stats()` row (same branch that picks `F.label`, so the Z-dependent force law has a TeX twin) and a pure `calculusMarkdown(S)` in `calculus.js` (node-testable like `stats`): a heading `**CALCULUS** · t = … · h = …`, a GFM table `| quantity | value | law | predicted | residual |` with each cell a `$…$`, the footer, and the "toy on" note. `DIGESTS.calculus` returns it and `layout.digest` prefers a window's `md` over TSV. The result pastes into the NOTEBOOK and renders (marked GFM + KaTeX) with no new machinery — "the whole window" = status + t + every row + footer. Do the same for WIGNER (`table()` exists) and RADIATION (`table()` exists) so the three share one copy dialect.
- **Proposal — the layout:** RADIATION = `canvas.rad-c` + three `row tight` of `.ro` tiles (1 wide / 4 / 2; `radiationview.js:52-67`), the tiles flex-wrap at the card width. CALCULUS = a stack of `.calc-row`s with name · value · right-aligned residual and two grey sub-lines (`base.css:257-265`). Convert each law to a tile in a grid (`display:grid; grid-template-columns: repeat(auto-fit, minmax(7.5rem,1fr))` gives 2 columns on the 274 px card and 3 on a wider/floating one): label = name, value = value, sub = `residual 1.2e-9`; formula/law become the tile's hover (`graphHover`/`title`) and the copy. **Trap:** LEAN (`lab.css:425`) hides `.ro` and `.row:has(> .ro)` and is ON by default, so a CALCULUS made of `.ro` tiles would be empty on a first visit; give the grid its own class and opt it out of the LEAN rule (RADIATION's tiles are hidden by the same rule today).

### DYNAMICS
Five unrelated sections (table B.1). Costs are real (about ten readout writes + a history canvas every tick; `rebuildAA` rebuilds DOM on every version change; PARTICLES `advance` + trails). Overlaps: L/T/V/S are SHADOW's oscillator energies (`dynamics.js` header: "uncoupled oscillators"); the ACTION–ANGLE rows are SPECTRUM's population/phase (the header says "the SPECTRUM rail … is exactly the action–angle chart"); ⟨r⟩/virial are CALCULUS' virial row; DIPOLE is RADIATION; ROTOR ENTANGLEMENT is ORBIT's Schmidt spectrum. **Proposal: retire the id** (`RETIRED_WINDOWS` at `rack.js:318` already maps `style → observer` for saved layouts) after moving: L/T/V/S + history plot → SHADOW footer; MOMENTS + virial → CALCULUS rows (gain TeX and a place in the copy); DIPOLE lines → RADIATION; ACTION–ANGLE → delete (SPECTRUM); PARTICLES → a "stage overlay" switch beside VORTEX and KEPLER ORBIT (the one unique thing; its `createParticles` already exists twice, once for FLOW). Net: one fewer card, ~10 fewer readout writes per tick, no `innerHTML=''` rebuild.

### METERS
Diagnostics for the engine (frame profile, tiers, field cache, governor) mixed with state numbers (NORM, ⟨E⟩, t, autocorrelation, MODES). Two couplings matter: its tick **also drives `badges.update()`** (the STATUS TAGS, the Stark/Zeeman and masked/truncated warnings, and the canvas aria sentence) so with METERS closed those go stale (bug 7b; first-run has STATUS TAGS off, so it is latent); and its PERFORMANCE segment + GOVERNOR readout duplicate SETTINGS › QUALITY. **Proposal:** (1) move `badges.update()` to its own ≤ 10 Hz tick gated on `!body.no-badges` (and on the sentence being read) — a 5-line change that removes the coupling; (2) PERFORMANCE seg + GOVERNOR readout → SETTINGS › QUALITY; (3) keep the rest as a collapsed "ENGINE" window (the profile) and offer NORM/⟨E⟩/t as an INFORMATIONAL HUD line, or simply as SPECTRUM's header (it already owns the register).

### WIGNER and RADIATION
Both are hydrogenic-only readers that ship closed. **RADIATION** (240 lines + 204 of physics) is the model: a canvas with a polar pattern, then three rows of tiles; "stands down saying exactly why" when there is no pair; its tooltip-on-hover law (WAVE 46: no floating legend). **WIGNER** (233 + 371) is the heaviest of the pair (≤ 2 Hz playing, 69 ms worst case). Proposal: keep both; make RADIATION's skin the shared "reading window" class (plot first, then tiles, then the note, with a `table()` → markdown copy); share one gate and fix it (`hydroReader` must include `chem`: with MOLECULES on both cards would compute hydrogenic physics under a molecule).

### SHADOW and ORBIT
SHADOW: three canvas pictures of (q, p); open on first run, one redraw per tick; keep and absorb DYNAMICS' energies. ORBIT: the rotor spheres are exact invariants of the register (recomputed only on `reg.version`), plus the KEPLER controls and the stage overlay; DRIVE is the one switch that *changes ψ* (labelled "DRIVE (changes ψ)"). Keep both; ORBIT's Kepler overlay, VORTEX and PARTICLES are the three "stage overlays" and ELECTROSTATICS a fourth — a single OVERLAYS strip (INFORMATIONAL-style) would replace four switches scattered in four cards.

### STATE
Preparation. Everything here changes c; hidden under a molecular field owner; no reader. Keep as is. (Its BOW group feeds the Kepler bow gesture on the stage.)

## B.3 Naming SLICE → PLANE (three candidates)
The conflict is real: the stage's cut is called **SLICE / CLIP** (`id clip`) and the rotor plane is **SLICE** (`id slice`); both appear in menus, tests and docs. Keep both ids stable (saved layouts, `slice.*` APIs).
1. **PLANE** *(recommended, Josh's)*: shortest (fits the 274 px eyebrow with the ⓘ ⏻ ▾ × cluster), names the object the user turns, matches the kit's own word (`plane-model.js`, the mini sphere is the "plane model"), and covers the KS mode (a 2-plane in ℝ⁴ is still a plane). Pair it with renaming `SLICE / CLIP` → **CLIP** so the two stop colliding. Risk: "plane" also names CLIP's plane (resolved by the rename).
2. **ψ PLANE** (`<m>ψ</m> PLANE`, the markup is already supported by eyebrows, cf. `<m>H₂</m>`): says what is drawn on it (complex ψ, domain-coloured) and so separates it from the clip plane even without renaming CLIP. Costs a math-face glyph in the eyebrow and a longer menu string.
3. **SECTION**: the geometer's word for a plane cut through a 3- or 4-space (cross-section), distinct from the stage's CLIP; but it is a synonym of "slice", so it gains less clarity than the other two and reads like a different feature in the WINDOW menu.
(Rejected: ℂ-PLANE — collides with the PALETTE ring that already calls itself "the complex plane"; TOUR — a feature, not the window.)

## B.4 Modern windows side by side (as asked)
| window | id | reader? | power stops | idle cost | state scope of what it holds | DISPLAY it answers to |
|---|---|---|---|---|---|---|
| STATE | `state` | no | lock | 0 | PROJECT (`experiment`) | HINTS, HELP |
| SPECTRUM | `spectrum` | yes | its tick | per-tick lanes + canvas | PROJECT (`experiment`, `hamiltonian`) | STAGE FORMULA, HINTS, HELP |
| WAVE (FIELD) | `observer` | no | lock | 0 | PROJECT (`mat`), PREFERENCE (frame/axes live in SETTINGS) | GAMMA, STAGE, P3 |
| CAMERA | `camera` | no (camera law in loop) | lock | 0 | PROJECT (`obs` pose, `autoRotate`), PREFERENCE (friction, spin, gain, fling) | HINTS, HELP |
| MOLECULES | `chem` | yes (RT pump) | pump | worker-bound | PROJECT (`instruments.chem`) | STAGE FORMULA, ATOM LABELS |
| MO-REGISTRY (ORBITAL) | `orbitals` | yes | pump | 0 unless ON | PROJECT (`instruments.orbitals`) | — |
| STATES (pane) | `orbitals` | yes | pump | 0 unless ON | PROJECT (`instruments.states`) | — |
| PALETTE | `palette` | no | lock | 0 | PROJECT (`paletteId`, `palette`) | P3 |
| SETTINGS | `settings` | no | lock | 0 | PREFERENCE (+ WORKSPACE keys) | — |
| HISTORY | `history` | no | lock | 0 | the ring itself (PROJECT edit scope) | — |

## B.5 If only five things are done
1. Decide the six legacy windows (delete / re-adopt / keep hidden) together with SPECTRUM's ATOM and QUARKONIUM buttons.
2. Retire DYNAMICS into SHADOW / CALCULUS / RADIATION / a PARTICLES overlay switch.
3. Give the info windows one skin (RADIATION's) and one copy dialect (markdown + TeX); fix CALCULUS's empty copy first.
4. Decouple the badges from METERS; move PERFORMANCE/GOVERNOR to QUALITY.
5. Rename SLICE → PLANE and SLICE / CLIP → CLIP.

---

# Part C — CAMERA

## C.1 What exists today

| capability | where | detail |
|---|---|---|
| **Orbit** (drag) | `stage-gestures.js:39-70` → `orbitBy` (`camera-law.js:79`) | one pointer, left button only (`:40`); rad/px = `CAM.SENS` 0.0065 × DRAG GAIN [0.2, 8]; Shift = ×0.25 (`CAM.FINE`) |
| **TURNTABLE ⇄ FREE** | `camera-law.js:106` `setCamMode`; `obs.mode` | TURNTABLE: `(yaw, pitch)`, pitch clamped ±1.52 rad; FREE: `obs.quat` (unit quaternion, `turnFree`), roll allowed, yaw/pitch become a readout (`syncFreeAngles`); FREE→TURNTABLE levels the roll by a 150 ms slerp |
| **Keyboard orbit** | `rack.js:4546-4549` | WASD queue an eased orbit (τ 65 ms, `queueKeyOrbit`/`stepKeyOrbit`) |
| **Zoom** | `setDist` (`camera-law.js:153`), ZOOM knob (log) | `obs.dist` ∈ [1.2, 8] × `domain.half`; wheel `1.1^(Δy/100)` (`stage-gestures.js:111`); pinch (ratio of the two contacts' span); ArrowUp/Down ±12 %; Q/E dolly ±10 % |
| **FOV / POV** | `setFov` (`:154`) | `obs.fov` ∈ [0.25, 1.2] rad (14°–69°), knob; Shift+Q/E = POV; Ctrl+Shift+Q/E = **dolly zoom** (keeps `dist·tan(fov/2)` fixed, `rack.js:4525-4535`) |
| **AUTO-ROTATE + SPIN** | `camera.autoRotate`, `speed` [0.02, 2] rad/s | an ambient yaw ω_amb about world z; in FREE a left-multiplied world-axis rotation |
| **FRICTION / FLING** | `CAM.MU_*`, `camera.fling` | ONE first-order law: ω = ω_amb + d(t), ḋ = −μd, exact integrals; μ ∈ [0, 12] /s (0 = forever); a fling composes with the ambient spin and relaxes TO it; FLING gain [0, 2]; `REST` 0.003 rad/s stops the loop (idle is zero work); the angular speed is capped at 12 rad/s |
| **RESET VIEW** | button, R, double-click, double-tap | `Object.assign(obs, CAM.HOME)` — `{ yaw .65, pitch .38, dist 3.3, fov .6 }` |
| **Specials on the left pointer** | `rack.js:4472-4496` | Ctrl+drag = bow (impulse), a Kepler handle, Shift+drag places a HELIUM electron; right/middle buttons and two-finger translation are **unused** |
| **Modulation targets** | `rack.js:2398-2407` (+ adopted `host.js:615-616`) | `observer.yaw`, `observer.pitch`, `observer.dist`, `observer.fov` (and `material.*`) |
| **CAPTURE** | `rack.js:1547…` | picture/loop/video from the field's own render, not the camera law |

**There is NO pan.** The camera always looks at the origin.

## C.2 What the pose stores, and its scope
`obs = { yaw, pitch, dist, fov, mode, quat }` (`rack.js:106`). `serialize()` writes `presentation.obs = { ...obs }` (`rack.js:4684`); `restore` does `Object.assign(obs, pr.obs || {})` and repairs `mode`/`quat` only (`:4800`). Scope (docs/STATE-SCOPES.md row 40): **PROJECT, not in the undo history** (a view is not an edit), counted by the unsaved-changes mark; the camera *feel* (friction, spin, drag gain, fling) is PREFERENCE; `camera.autoRotate` is PROJECT. The share-link codec v1 (frozen) writes `yaw, pitch, dist, fov` as f32 (+ mode) (`statelink.js:291`, `:492`) — no room for a pan. `lab/new-project.lambdawaves.json` carries the pose and `tools/new-project.mjs --check` proves it byte-exact, so any new pose field means regenerating it.

## C.3 What a pan needs

**Two models (pick one; the second is cheaper, the first is the one that feels right zoomed in):**
- **A. Target pan (recommended).** Add `obs.pan = [x, y, z]` (the look-at point, in `domain.half` units so AUTO domain changes do not drift it). The eye is `target + dir·dist·half`, and ORBIT pivots about the target — which is what "inspect a lobe far from the centre" wants: with a lens shift the lobe swings out of frame as soon as you orbit.
- **B. Lens shift.** An image-plane offset (`u + sx`, `v + sy`) in the ray generation and an off-axis projection matrix; the orbit pivot stays at the centre. Exactly "slide a photo", but orbiting a panned view throws the subject out.

**Work list for A (in dependency order):**
1. **One projection helper.** The eye/ray maths is copy-pasted: `field.js:1009-1033` (`writeView`: uniform + `lookAt(cam, ORIGIN, …)`), `fieldview.js:172`, `keplerview.js:36`, `particles.js:146`, `vortex.js:60` (+ cache key `vortex.js:93`), `export3d.js:305` (`position = dir·dist·half`; fed from `rack.js:3784`), `rack.js:3077` `pointerRay`, `rack.js:3209` `unproject` (it intersects the plane through the **origin**; with a pan it must be the plane through the target), and Cloud's `placeAtomLabels`. Add `cameraEye(obs, half) → { eye, target, B }` next to `cameraBasis` (`field.js:614`) and make all nine sites call it; extend `cameraKey(obs)` (`field.js:630`) with the pan so cached 2-D overlays redraw. This is worth doing even without a pan (nine sites recomputing one formula is how a camera change breaks one overlay).
2. **The uniform.** `writeView`: `cam = target + dir·D` into `v[0..2]` (the ray origin); `right/up/fwd` unchanged; `lookAt(cam, target, B.up)` for the line chrome. `linesUnchanged` (`field.js` LINE_STATE) already keys on `VIEW[0..11]`, so line geometry refreshes by itself. Check the ray-vs-cube entry when the eye is inside or beyond the cube (at `dist` 1.2 on a diagonal the eye is already inside the cube today; verify the WGSL near-clip).
3. **The law** (`camera-law.js`): `CAM.PAN` clamp (±1 half), `CAM.HOME.pan = [0,0,0]` copied on reset (not aliased by `Object.assign`), `panBy(fx, fy)` screen-relative: Δtarget = (right·fx + up·fy)·2·dist·tan(fov/2) with fx = −Δpx/H, fy = Δpx/H (so the point under the cursor at the target plane follows the pointer exactly, independent of zoom and FOV); `setPan` as the single road with `modHand('observer.panx' …)`; pan velocity as a second residual relaxed by the same μ (keeps "ONE first-order law" and gives a pan fling for free, or leave it out); `camera.stop()` stops it; AUTO-ROTATE keeps rotating about the target.
4. **Gestures** (`stage-gestures.js:40` ignores `button !== 0`): right-drag and middle-drag = pan (refuse `contextmenu` as `paint-stroke.js` does); two-finger drag = pan while pinch = zoom (use the contacts' centroid delta beside the span ratio in the existing `rebase()` two-contact state); wheel stays dolly. Keyboard: an Alt+Arrow pair (Left/Right are time steps, Up/Down zoom; `lab/shortcuts.js` rejects overlaps, so register it in the table and extend `tests/keyboard-shortcuts.test.mjs`).
5. **Window and modulation:** CAMERA gets PAN X / PAN Y (a "share of the view width at the target plane", MIR's unit) + a PAN HOME / CENTRE trigger beside RESET VIEW; two registry entries `observer.panx`, `observer.pany` in the block at `rack.js:2398` (the adopted `host.js` list is MIR's; app-side entries are the λWAVES seat).
6. **Persistence and law:** `obs.pan` rides the `{...obs}` spread; validate on restore (finite 3-array, clamped); STATE-SCOPES row 40 → "yaw, pitch, dist, fov, quat, pan" (PROJECT, not history); regenerate `new-project.lambdawaves.json`; links: either carry no pan (opens centred, honest) or add a v2 flag byte; PREFERENCE `panGain` beside `dragGain`.
7. **Tests:** pure law test (pan then reset = identity; cursor-anchored invariance across zoom/FOV), `stage-gestures.test.mjs` (right-drag, two-finger), `statelink.test.mjs` round trip, `render-regressions.browser-test.mjs` (the scaled hit-test must use the panned eye), `keyboard-shortcuts.test.mjs`, `new-project.test.mjs`/`--check`.
Cost at runtime: TIER.PRESENT only (no reconstruct), same as an orbit.

"Planet photo with max FOV": today's widest FOV is 69° and the tightest 14° at `dist` ≥ 1.2, i.e. up to ~7× magnification at the target (visible half-height `dist·tan(fov/2)`: 1.0 half at HOME, 0.15 half at `dist` 1.2, FOV 0.25). That is the range a pan has to cover; with the clamp at ±1 half every part of the cube is reachable at every zoom.

## C.4 What an XY pad (BASINS' dot matrix) would drive
MIR 1.5 (worktree `mir-1.5`, alpha line) already contains the pieces; λWAVES is on 1.4.3 and has none of them (`grep` of `lab/mir` finds no XY pad).
- **The control:** `mir/controls/xy.js` `xyPad({ label, x, y, home, tags, onInput, onChange })`: one square for the hand, the two axes are the kit's `knob()`s so each stays a modulation target and a keyboard slider; Shift/Alt/second finger = ⅛ fine; arrows, Home, Delete, double-tap centre; **the lattice** (Josh 10-06: "a fancy dot matrix/lattice that grows in size the closer the XY is … and cursor hover") — a dot grid whose radius swells as a bell around the point, accent B when a route drives it, repainted only when point/cursor/size/theme change.
- **The CAMERA panel:** `mir/panels/camera.js` (+ `camera-rig.js`, `docs/PANEL-CAMERA.md`) takes a *port* of ids and shows only rows it has: `mode` (TURNTABLE · FREE), `yaw`/`pitch` (the direction sphere + arcs), `roll`, `zoom`, `fov`, **`panX`/`panY` (PAN pad + knob column; "a share of the view's width, up is +Y")**, HAND (`drag friction inertia fling autoRotate spin wheel`), and `turn(dyaw, dpitch)` — "a RELATIVE turn: λWAVES' one road (orbitBy) in TURNTABLE and FREE". So adopting 1.5's panel replaces the hand-built CAMERA MOTION group, and the pad appears the moment the port answers `panX`/`panY`; the engine work in C.3 is the same either way.
- **The XY panel:** `mir/panels/xy.js` (`docs/PANEL-XY.md`): PAIR (a segment/stepper picks among the app's coupled pairs), ROUTE (two macros "XY X/Y" any knob can be dragged onto) and MORPH (four snapshots A–D blended by the pad).
- **Modes for λWAVES:**
  1. **PAN** — absolute `panX/panY`, SPRING off. The natural default.
  2. **ORBIT** — in TURNTABLE the pad can be absolute (X = yaw ±π wrapped, Y = pitch ±1.52). In FREE yaw/pitch are only a readout of the quaternion, so the pad must be a **joystick** (SPRING on: displacement = angular velocity, through the law as a third summand beside ω_amb and the fling residual so FRICTION keeps its meaning), not an absolute position.
  3. **Both as modes** — one XY card with two PAIRs (PAN, ORBIT) and the stepper; plus ROUTE (an LFO on X moves pan or orbit) and MORPH (camera A–D = view presets, free).
  Before MIR 1.5 is adopted: two PAN knobs now, the pad later (the pad's knobs ARE the targets, so nothing is thrown away).

---

# Part D — THE INFORMATIONAL TODAY

## D.1 Cloud's STAGE FORMULA (origin/main)
- **File / DOM:** `lab/rack.js` 2342-2440 builds `<div id="molFormula" aria-hidden="true" hidden>` as a child of `dom.stage` (`initMolFormula`, 2425, called at 5571); CSS `lab/lab.css:856-862`; ink by `lab/accent-wheel.js:101-103`.
- **How it renders text:** **DOM, plain text.** `fe.textContent = text` (`placeMolFormula`). Not canvas, not markdown, not LaTeX, not `<m>` elements. The typeface is `--font-math` (STIX Two Math), so Unicode subscripts read as maths. Sources: `mathPlain(MOLECULE_BY_ID.get(chem.preset()).formula)` (the library's `<m>H₂O</m>` markup stripped) while MOLECULES is on, else `registerText()` — SPECTRUM's `BASIS[a].label`s ("2s₀, 2p₋₁", `H.labelOf` for other operators), `A  ↔  B` under a TRANSITION.
- **SIZE:** `molFormulaScale` ∈ [0.5, 3] from the Settings › Display knob `molFormulaK` ("SIZE", shown as %, PREFERENCE `molFormulaSize`); base font `max(24, min(88, 0.08·innerWidth))` px × scale; `max-width = gap − 2·max(48 px, 12 % of gap)` where *gap* is the open stage between the two racks (both `getBoundingClientRect()`ed each time); long text WRAPS; an unbreakable word is shrunk to fit; then shrunk further until `offsetHeight ≤ 0.45·innerHeight` (≤ 8 passes).
- **Where it sits:** `position:fixed; left = middle of the gap; z-index 20` (below racks 30 and floats 32, never in the occlusion mask, `pointer-events:none`); `top:64px` (`.mf-top`) while the transport pill floats at the foot, `bottom:26px + safe-area` (`.mf-foot`) when the transport is docked, at the top (`.at-top`) or the screen is ≤ 860 px.
- **How it is kept current:** event-driven from MOLECULES (`chem.subscribe`, the card's `change` event), polled from the frame loop's CPU tick for the register (`stageTextTick`: key `reg.version|transition|Hamiltonian id`), MutationObservers on `#transport` and `<body>` class (with a 400 ms re-place), `resize`, and a `(max-width:860px)` media listener. No `requestAnimationFrame` of its own. The ink is near-black or near-white by the luminance of the live **stage ground**, with a `text-shadow` halo in the ground colour.
- **ATOM LABELS** (`#atomLabels`, 2403): a second full-stage layer of `<span class="atom-label">` (element symbols from `md.js ELEMENT`), `transform: translate()` per tick, white under `mix-blend-mode:difference`.

## D.2 λWAVES' existing text layers
| layer | what | how |
|---|---|---|
| `#title` wordmark | λ + WAVES + the mark | DOM; `accent-wheel.js paintMarks` colours it by the stage ground |
| `#badges` + `#sheet` | the four ψ-badges (STATE·EVOLUTION·SHADOW; FIELD grid; masked/truncated; field in force) and the "model sheet"; the fifth, the new-build offer, is never hidden by STATUS TAGS | DOM buttons, written in METERS' tick (`badges.js:64`) |
| the **canvas sentence** | "1s + 2pz; arg ψ — phase, drawn as CLOUD; 96³ grid over ±14 a₀; … paused at t = …" | an `aria-label` on `<canvas id=field>` (`badges.js:78-80`), never visible, never live; rebuilt only when it changes |
| STAGE CAPTIONS | the KEPLER and VORTEX lines at the foot of the stage | drawn by the Kepler / Vortex canvases; `body.no-captions` |
| `#banner` / `#warnPane` | WebGPU-unavailable alert; photosensitivity dialog | DOM |
| the **notebook** (`#notebook`) | the user's markdown, ABOUT, NOTES | `marked` (GFM, breaks) + KaTeX (`$…$`, `$$…$$`, `throwOnError:false`, `output:'html'`), sanitised against a tag/attribute allow-list and rendered into text nodes only (`mir/shell/notebook-render.js`, `notebook-math.js`); `index.html:71-72` loads `marked` and `katex` as deferred scripts so they are ready before first use |
| `<m>…</m>` runs | Unicode maths in labels, eyebrows, options, readouts | `mathText` builds an `<m>` element (`kit.js:52-64`), font by `base.css:88-108`; **not TeX** |
| window ⓘ popovers, `.legacy-note` | help; the legacy banner | DOM |
| `lab/latex-state.js` | TeX *strings* for the register (`stateLatex`: list + ψ expansion, chemistry order, π-aware phases) | no DOM |
| Cloud's `#molFormula`, `#atomLabels` | the first big, visible, stage-level text of the app's own physics | above |

## D.3 What a markdown overlay would reuse
- **The renderer:** `renderNotebook(src, { marked, katex })` as it stands — sanitised, restores `$…$` tokens, falls back to escaped `<code>` when KaTeX is missing or throws. No new library; the scripts are already loaded.
- **The content:** `stateLatex` gives `$2p_{-1}$, $2p_{1}$, and $4d_{2}$` and the `$\psi = 0.71\,1s_{0} + …$` line for SPECTRUM (so `registerText()` and its Unicode `labelOf` go away — two producers of one string today). MOLECULES' formula needs a one-function TeX conversion of the library markup (`H₂O` → `\mathrm{H_2O}`); `latexName` already encodes KaTeX's "subscript after `\,`" trap.
- **The ink law:** `accent-wheel.js stageGround()` luminance → ink and halo; KaTeX output inherits `color`, so the same two lines colour it.
- **The keys that already exist:** PREFERENCE `molFormula`, `molFormulaSize`, `atomLabels`, `atomLabelsSize` (keep the names; they are declared in STATE-SCOPES and the tests).
- **The real home — MIR 1.5 `mir/info/layer.js` (`docs/INFORMATIONAL.md`):** "floating text over the stage, with no window"; pages are plain markdown (the same as the notebook's tabs), maths via sanitised marked + KaTeX; `layer.addBlock({ md, hold, pane })` for the formula; `layer.addLabel({ anchor, title, md })` for each nucleus with `features: () => [{ id, x, y, r }]` (or a `place`) answered in stage CSS pixels and `layer.viewChanged()` on every camera change; bare (ink + soft darkness underneath) or on a glass pane; blocks keep clear of the racks and the transport through `avoid()`; pointer parallax/avoidance; hold-still on `I`. The λWAVES seam is the same projection helper as C.3 (`cameraEye`), so ATOM LABELS, EARTH-style labels and a pan share one function.
- **Interim plan (before MIR 1.5 is adopted):** one app-side `setStageMarkdown(md)` that renders `renderNotebook(md)` into the existing `#molFormula` node, keyed by the md string so KaTeX runs only on change; subscribe to a real `reg` change event (add `reg.onChange`; the register currently has none, which is why Cloud polls) and to `chem.subscribe`; delete the body-class observer and the per-tick re-measurement. The call site is what `layer.addBlock` replaces later.

---

# Part E — SETTINGS › DISPLAY

SETTINGS has three tabs (`native-ui.js:81-96`): **DISPLAY**, LOOK (THEME, CARD STYLE, FROST, DISCONNECTED, GLASS BLUR, ACCENT A/B, VIVID, WARNING) and QUALITY (grid, steps, AUTO SCALE, governor…). DISPLAY on `release-0.4.0` (`native-ui.js:94`), then Cloud's two extra rows:

| control (id) | what it does | windows / surfaces it affects |
|---|---|---|
| STATUS TAGS (`badgesSw`) | the four ψ-badges (the build offer is exempt) | the stage's badge row + `#sheet`; **rides METERS' tick** |
| CONTROL HINTS (`controlHintsSw`) | hover hint after a short delay | every window's controls (kit) |
| STAGE CAPTIONS (`capSw`) | KEPLER / VORTEX lines at the foot of the stage | ORBIT (KEPLER ORBIT overlay), VORTEX |
| HELP (`windowInfoSw`) | the ⓘ button in each header (`body.window-info-off`) | every window |
| FRAME — BOX · LATTICE · DOTS · OFF (`frameModeSeg`) | the field boundary | the stage (`field.js` line shader, masked by windows); LATTICE/DOTS also read the camera |
| AXES — BOX · CORNER · OFF (`axisModeSeg`) | the x/y/z axes | the stage; CORNER uses the camera basis |
| AXIS COLOUR — THEME · CMY · RGB (`axisInkSeg`) | axis ink | the stage |
| STAGE (`stageSeat` colour well + FOLLOW THEME, `stageK` mix %) | the stage ground; modulation target `material.stage` | the whole picture, the wordmark's ink and (Cloud) the STAGE FORMULA's ink |
| GAMMA (`gammaK`) | tone curve; target `material.gamma` | the picture (WAVE's neighbours: PALETTE reads against it) |
| DISPLAY P3 (`gamutToggle`) | wide-gamut canvas + accents | the canvas and every accent; PALETTE |
| IN P3 — CONVERT · VIVID (`p3Seg`) | how authored colours are expressed in P3 | same |
| **STAGE FORMULA** (`molFormulaSw`, Cloud) | the big stage text | **MOLECULES** (its formula), **SPECTRUM** (its populated states), STATE's A/B TRANSITION |
| **SIZE** (`molFormulaK`, 50–300 %) | its size | same |
| **ATOM LABELS** (`atomSw`, Cloud) | element symbols on the nuclei | **MOLECULES** (while ON) |
| **SIZE** (`atomK`, 50–300 %) | their size | same |

Other display-class switches outside this tab: LEAN `Aa` per window (`window-chrome.js`, first-run ON), INVERT the cloud / VIEW menu rows (`rack.js:3819`; Cloud added "STAGE FORMULA on/off" there but not ATOM LABELS), the favourites ☆. First-run values: tags, captions, Help and window notes OFF; hints ON (CLAUDE.md); STAGE FORMULA and ATOM LABELS default ON (`s.molFormula !== false`).

---

# Part F — Findings to carry into the 0.4.0 plan (with where)

| # | finding | where | severity |
|---|---|---|---|
| F1 | forged MIR adoption (`jetblack`, "1.4.4", fake commit) | `lab/mir/palette.js:178-183`, `MIR-MANIFEST.json`, CLAUDE.md | house-law |
| F2 | CALCULUS ⧉ copies a header only | `rack.js:5438` vs `calculusview.js:50` | bug, no test |
| F3 | badges + canvas sentence tick only with METERS presentable | `rack.js:1094`, `badges.js:64-80` | latent bug (STATUS TAGS off by default) |
| F4 | `hydroReader()` omits `chem` | `rack.js:2728-2736` | bug (WIGNER/RADIATION under MOLECULES) |
| F5 | `copyLatex` / EDIT row key off `wSpec.root.hidden` | `rack.js:2004`, `:3816` | breaks `latex-copy.browser-test:137-144` after merge |
| F6 | SPECTRUM offers ATOM and QUARKONIUM whose editors are hidden | `rack.js:1920-1926` vs `docs/LEGACY-WINDOWS.md` | functional regression (Cloud) |
| F7 | `.mol-more` hides KICK/RUN/TDA/spectrum permanently | `chemview.js:166-173` | functional regression (Cloud), tests bent |
| F8 | nine sites recompute the camera projection | C.3 item 1 | refactor-before-pan |
| F9 | `stageTextTick`/`placeMolFormula` layout reads on every register change and body-class change | `rack.js` 2342-2431 | perf risk, unmeasured |
| F10 | CLAUDE.md stray sentence and false "MIR 1.4.4" | CLAUDE.md | doc |
| F11 | no REPORT.md wave for Cloud's work | — | ledger |

## Questions only Josh can answer
1. Legacy set: per window — delete (with `restore` shim), re-adopt into MIR, or keep hidden? In particular HELIUM (correlation) and H₂ (FCI curve) hold physics MOLECULES does not.
2. Should SPECTRUM keep ATOM and QUARKONIUM at all if ATOMS and QCD stay hidden?
3. PAN: target pan (orbit about what you inspect) or lens shift (slide the photo)? Pan fling yes/no? Carry the pan in share links (needs a codec v2)?
4. Name: PLANE with SLICE / CLIP → CLIP?
5. `.mol-more`: what should the compact MOLECULES show by default, and where do KICK / RUN / TDA live (a fold, a tab)?
6. Retire DYNAMICS as proposed (L/T/V/S → SHADOW, moments → CALCULUS, dipole → RADIATION, PARTICLES → overlay switch)?

