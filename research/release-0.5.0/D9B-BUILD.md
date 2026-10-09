# D9b · H₂ AND ELECTROSTATICS GO — build hand-off (2026-10-09, the D9b builder, Opus 5.5)

**In ten lines.** Josh ruled on 10-09 (PLAN §9): "H2 and Electrostatics should go." Both are deleted, each behind a restore
shim proved on a REAL file that the pre-D9b build wrote. An old H₂ file opens as MOLECULES · H₂ (STO-3G) on VIEW DENSITY.
An old ELECTROSTATICS file opens on its own state with nothing drawn. Each says so in one line: "retired in 0.5.0: H₂ (opened
as MOLECULES · H₂)" or "retired in 0.5.0: ELECTROSTATICS". All five legacy windows are now gone, and so is `legacyWindow`.
The ~20 lines `h2ci.js` needed moved into it. H₂⁺'s Hellmann–Feynman force (63 lines) moved VERBATIM to `tests/lib/`.
`lab/*.js` went **29,863 → 28,849 (−1,014)**. Node suites went 82 → 80, exit 0.
The lock is **860 · 0/0** and **1004 · 0/0** (s4a), run ALONE. Base-copy film pixel lock: identical.
Browser: `history` 44/44, `new-project` 8/8, `molecule-demos` 5/5, `molecular-names` 6/6, `render-regressions` 2/2, `offer` 16/16.
`current` 15/15 once `followsPalette` (red on the base `c83b7ee` too) is set aside. No blockers. Nothing is pushed or merged.

| | |
|---|---|
| worktree | `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-aba28140791c56025` |
| branch | `worktree-agent-aba28140791c56025`, reset to `c83b7ee` (the `sos-s0` tip: stage C merged + D9, PLAN §9 with the 10-09 rulings) |
| `822acff` | fixtures: two REAL pre-D9b project files (H₂, ELECTROSTATICS) |
| `9ebf35c` | H₂ deleted; its files open as MOLECULES · H₂ on its density (−274) |
| `1012497` | ELECTROSTATICS deleted; a file whose overlay was on opens with the notice and nothing drawn (−740) |
| `b71022c` | the lock's new counts in its header; CLAUDE.md's legacy paragraph, `docs/LEGACY-WINDOWS.md`, `docs/STATE-SCOPES.md` |
| hand-offs | `83e9def`, `fa8e7ab`, and the ledger commit (this file, `D9B-HANDOFF.md`, `D9B-rack.patch`, REPORT.md wave 207) |
| gate server | 8903, started and stopped by pid (4129161, then 55666 / 58018 / 70249 for the base-copy runs). geckodriver 5373. No browser of mine is left open |

## What Josh will see

- **An old H₂ file opens.** It never errors. It shows MOLECULES on H₂ (STO-3G, 1.400 a₀), VIEW DENSITY, owning the field.
  The MOLECULES card comes back onto the rack. The PROJECTS status and STATE's status say "retired in 0.5.0: H₂ (opened as
  MOLECULES · H₂)".
  - Why density: the H₂ card drew the Heitler–London one-electron DENSITY, not an orbital, and MOLECULES' twin of a density
    is the density view of the same molecule.
  - It is the molecule and basis of the `H₂ σu` demo. That demo shows the σu orbital, which an H₂ file never drew. To land on
    the demo's orbital instead, change one word in the shim (`view: 'orbital', orbital: 2`).
  - The R scan, the CI curves and the collision have no twin.
- **An old ELECTROSTATICS file opens** on its own state (the fixture: (1s + 2p_z)/√2). Nothing is drawn: the `#fieldlines`
  layer left with the window. The status says "retired in 0.5.0: ELECTROSTATICS".
- **Nothing else moves.** Neither window had a row in + / WINDOW / TAB, and no bundled file turned either on. The six demos
  and the empty project carried `h2.on: false` and `overlay: 'off'`, so they open exactly as before (`molecule-demos` 5/5,
  `new-project` 8/8). The legacy banner (`.legacy-note`) is gone with `legacyWindow`, because no hidden window is left.

## The shims (`lab/rack.js` `restore`)

| file field | opens as | notice |
|---|---|---|
| `instruments.h2.on` (and MOLECULES not on) | `chem.load({ preset: 'H2', basis: 'sto-3g', view: 'density', orbital: null })`, then `chem.setOn(true)` as the field owner. The W129 law brings MOLECULES onto the rack | `H₂ (opened as MOLECULES · H₂)` |
| `field.overlay` ≠ `off` | the file's own state. Nothing reads `lines` or `source` | `ELECTROSTATICS` |

The old `h2` record, its layout seat `h2`, the `field` record and its seat `field` are read only to choose the shim.
`applyLayout` skips a seat with no card, and nothing writes these records again. `serialize` no longer carries `field` or
`instruments.h2`: the empty project has 18 non-modulation presentation keys, down from 19 (`new-project` reads 18), and its
instruments lose `h2`. It went 16,329 → 16,198 → 16,117 B, and `--check` is in step.

## What left, and what moved

| | H₂ | ELECTROSTATICS |
|---|---|---|
| lab files deleted | `h2view.js` 186, `h2.js` 82 | `electrostatics.js` 437, `fieldview.js` 236; the `#fieldlines` canvas (index.html) and its two lab.css rules; `.legacy-note` |
| moved, kept in lab | J′ `coulombJ2`, K′ `exchangeK2`, E₁ `expint1` / `Ei` / `EULER_GAMMA` → `h2ci.js` (+19 net). `EV` now comes from `molecule.js` (the same 27.211386) | — |
| moved out of lab | `MU_H2` → `tests/lib/mo.js`. Heitler–London's closed form (`h2Energies`, the golden-section `h2Equilibrium`) → `tests/h2ci.test.mjs` as Q3's oracle and Q8 | `gaussLegendre`, `panelIntegral`, `xiIntegral`, `inverseSquareIntegral`, `hellmannFeynman` (63 lines, VERBATIM) → `tests/lib/hellmann-feynman.js`, `mo.test`'s oracle |
| rack.js | −16 (the card 6 → 1 line, and its sites) | −65 (the card 50 → 1, LEGACY WINDOWS 11 → 2, and its sites) |
| other lab | mathworker's `h2curve` op (−3); render-exact's H7 (the hazard, its report row, the frame's `h2.update(t)`, the manifest pin; −4); meters' `p.molecule` | capture.js' `fieldlines` overlay; window-chrome's ⧉ case for `field`; METERS' "field lines"; a dynamics.js comment |
| node suites | `tests/h2.test.mjs` (8 judges): 5 anchors on kept code → `h2ci.test` Q8 (8 → 13); 3 guarded deleted code (density weights, the two collisions) | `tests/electrostatics.test.mjs` (38 judges): 8 on H₂⁺'s force (§6, W42-11) → `mo.test` G0 (33 → 41); 30 judged `electrostatics.js`' own Φ / E / j / B / contours / timing and went with it |
| tools | the digest-lock scene `h2` (the tool names it RETIRED); `new-project.mjs`' `h2` | `new-project.mjs`' `field` |

`hydrogen.js` and `field.js` keep their own suites (`hydrogen.test`: normalisation, orthogonality, the table anchors).
`electrostatics.test` used them only as oracles for its own closed forms, so nothing of theirs needed to move. The field kernel's
space-5 WGSL branch (H₂'s two incoherent groups, like D9's space-4) is left in `field.js`. It is dead now. Its removal changes the
shader, so it belongs to a lock run of its own.

## The lock, and the film

- `LW_PORT=8903 GD_PORT=5373 node tools/perf/digest-lock.mjs --check --query gastab=0` gives **GREEN: 860 values · 0 readback ·
  0 record-byte differences**. `h2`, `h2plus` and `helium` are RETIRED, and the three S4a states are SKIPPED.
- The same plus `--fixture research/release-0.4.0/measure/digest-lock-s4a.json` gives **GREEN: 1004 values · 0 / 0**.
- Both ran ALONE (`wait-gpu` free, load < 4). Each count is 48 below the base's 908 / 1052 (one state = 3 grids × 16). The
  header records them. No fixture was re-baked.
- One run of the s4a fixture WITHOUT `--query gastab=0` read RED on the `gas` state only (12 readback + 3 record-byte). That is
  the W125 gas table ON against a fixture recorded with it off, which is a mis-invocation. C7-BUILD's command is "the same
  command plus `--fixture`", and with it the run is GREEN.
- `tools/perf/film-probe.mjs` (CLAUDE.md asks for it after touching render-exact) passed every step on this tree: picture,
  ONE PERIOD, RECORD, EXPORT FRAMES, verify DETERMINISTIC, no page error.
- Base-copy pixel lock: `git archive c83b7ee` was unpacked to `.tmp/base` and run with the same `picture,frames,verify`. The
  picture is `b111224e` on both, the 25 EXPORT FRAMES hashes are identical, and so are the 6 verify digests.

## Tests

- `bash test.sh node`: exit 0 on the base (82 suites), after H₂ (81), and after ELECTROSTATICS (**80**).
  - Deleted: `tests/h2.test.mjs`, `tests/electrostatics.test.mjs`.
  - Moved: their kept judges, into `h2ci.test` and `mo.test`.
  - New lib: `tests/lib/hellmann-feynman.js`.
  - Edited: `h2ci.test`, `mo.test`, `render-exact.test` (twelve hazards, 37 → 36), `ink.test` (three canvas views),
    `tests/lib/mo.js`.
- `node tools/new-project.mjs --check` is in step at 16,117 B. `node tests/pwa.test.mjs --write` ran after every `lab/` edit.
- Browser, on 8903/5373, one suite at a time and each after `wait-gpu`:
  - `history` **43/43** after H₂, **44/44** at the end (42 + legacy-h2 + legacy-electrostatics);
  - `new-project` **8/8**; `molecule-demos` **5/5**; `molecular-names` **6/6**; `render-regressions` **2/2**; `offer` **16/16**.
- `current` is red at `audioFace.ott.followsPalette`, the audio face's accent transition read 250 ms after `--acc` is set.
  - It was red on this tree, and red again when re-run ALONE.
  - It is **red on the base `c83b7ee` too**: the archive was served on 8903 and the base's own `current` failed at the same
    assertion. It is not D9b's (D9 met the same case as a timing red).
  - The suite stops at its first failure, so a copy with only that key skipped (`.tmp/current-skipfp.browser-test.mjs`, not
    committed) was run on this tree: **15/15**, including the edited lazy-card case (LADDER alone) and the round-trip that now
    asserts `'h2' in instruments === false`.
- `tests/legacy/boot` was NOT run. It is its own pass (55 / 57 + a crash after D9). The edited file passes `node --check`. Only
  D9b's cases were edited:
  - **B35** (H₂ on the GPU) and **B106** (the H₂ CI card) are RETIRED in the B29 form: the card and `__LW.h2` are gone.
  - **B55** (ELECTROSTATICS) is RETIRED: the card, `#fieldlines`, `__LW.fieldlines` and `__LW.electrostatics` are gone.
  - The six `if (__LW.h2.on) __LW.h2.setOn(false);` guards in **B55, B57, B65, B66, B67, B68** are removed.
  - **B57**'s ship order now reads `wigner radiation`.
  - **B127**'s overlay selector loses `#fieldlines`, so the count is 3.
  - **B102**'s file list loses `fieldview`. B102 stays red on `moview`, which is D9's and not touched here.

## Lines (`cat lab/*.js | wc -l`)

| step | lab/*.js | Δ | what |
|---|---|---|---|
| base `c83b7ee` | 29,863 | | |
| H₂ `9ebf35c` | 29,589 | −274 | h2view −186, h2.js −82, h2ci +19 (the closed forms moved in), rack −16, render-exact −4, mathworker −3, sw −2 |
| ELECTROSTATICS `1012497` | 28,849 | −740 | electrostatics −437 (63 of it MOVED to `tests/lib/`), fieldview −236, rack −65, sw −2 |
| **D9b** | **28,849** | **−1,014** | 941 file lines left lab; 18 of them moved into `h2ci.js` and 63 to `tests/lib/`; rack −81, render-exact −4, mathworker −3, sw −4, h2ci's comments +1 |

- **Against the estimate.** D9-BUILD put the pair at "about 935" (941 with `fieldview.js`, less ≈ 65 that would move, plus
  ≈ 60 rack lines). Measured: **−1,014** in all, or **−951** without the 63 lines booked as MOVED.
- **D's ledger** (D is to be net ≤ 0). D9 gave −2,040 (−1,226 without its 814 moved). D9b gives −1,014 (−951 without its 63
  moved). **D so far: −3,054, or −2,177 on lines that truly leave the product.**

## Every rack.js hunk (for C3's re-apply)

`research/release-0.5.0/D9B-rack.patch` is the whole diff, `git diff c83b7ee HEAD -- lab/rack.js`, 42 hunks. If C3's merge
moved a block, re-apply it by its text, not by its line. Base line numbers:

| base line | hunk |
|---|---|
| 48 · 53 · 59 | the imports `createH2` (h2view.js), `h2CurveTable` (h2ci.js), `createFieldLines` (fieldview.js) removed |
| 324 | `KIND`: `field: 'control',` and `h2: 'other',` removed |
| 392 | `perf.profile`: `fieldlines: 0,` and `molecule: 0,` removed (`molecule` was H₂'s tick) |
| 732 | `modesAt`: `if (h2 && h2.on) return h2.fieldModes();` removed |
| 747–748 | `applyRebuild`: the `(h2 && h2.on) ? h2.half :` arm and the `(h2 && h2.on) ? 5 :` kernel space removed |
| 904–905 | `overlayDomain` is one line without `!(h2 && h2.on)` |
| 926 | a comment: "a molecule, momentum space or a Sturmian" (H₂ dropped) |
| 932–934 | the frame loop: `fieldVisible` and the two `fieldlines.update` lines removed |
| 936–937 | the H₂ comment and `h2.setActive(canPresent(wH2));` removed |
| 957–959 | `if (cpuTick) { if (h2 && h2.on && powered(wH2)) tick('molecule', …) }` removed |
| 972 | CALCULUS' guard without `!(h2 && h2.on) &&` |
| 1051 | `statusLine`: the H₂ line removed |
| 1851 | a comment: ATOMS is opened "by un-hiding it" |
| 1932 · 1936 | `copyLatex`: `if (chem && chem.on)`; its last-resort string becomes "nothing to copy — this molecule has no page" |
| 1955 · 2010 | the `ui.fldWin` status lines in `switchHamiltonian` and the Sturmian scale removed |
| 2174–2184 | LEGACY WINDOWS comment + `legacyWindow` (11 lines) → a 2-line comment (all five gone) |
| 2209–2214 | the H₂ card (`wH2`, `createH2`, `legacyWindow(wH2)`) → one comment line |
| 2217 | CHEMISTRY's comment: "It is a FIELD OWNER, so it goes through the moleculeMode() policy." |
| 2240 | chem's `setOn`: `{ moleculeMode(v); stageTextTick(); }` |
| 2254 · 2266 · 2274 · 2280–2282 | the stage text: `stageSrc` without `own`; `stageMd` / `stageCaption` without `h2.on ? '' :`; `stageTextTick` without `own` |
| 2331 | `wH2`'s `devopen` listener removed |
| 2591–2640 | the ELECTROSTATICS card block (the device, `createFieldLines`, OVERLAY / LINES / SOURCE, the four readouts, the note, `paintField`, `fieldOn`) → one comment line |
| 2652 · 2654 | READERS without `fieldlines: wFld`; `windowActivity.track` without `wH2`, `wFld` |
| 2664 | `hydroReader`: `if (chem && chem.on)` |
| 4617 · 4622 | `serialize`: `field: {…}` and `h2: h2.save(),` removed |
| 4782–4792 | `restore`: THE H₂ SHIM (comment, `const hl`, `fieldOwner` with `hl`, `if (hl) { chem.load({ preset: 'H2', basis: 'sto-3g', view: 'density', orbital: null, on: false }); gone.push('H₂ (opened as MOLECULES · H₂)'); }`); `if (I.h2) h2.load(…)` and `else if (fieldOwner === 'h2') h2.setOn(true);` removed |
| 4802 | `if (pr.field) {…}` → THE ELECTROSTATICS SHIM: `if (pr.field && pr.field.overlay && pr.field.overlay !== 'off') gone.push('ELECTROSTATICS');` |
| 4828–4829 · 4831 | the H₂ un-hide law and `layout.raise('field')` removed |
| 5113 | `__LW`: `h2,`, `fieldlines,` and `get electrostatics()` removed (their tests were edited in the same commits) |
| 5387 | DIGESTS: `field: () => fieldlines.table(),` removed |

Other files a merge may meet:
- `lab/h2ci.js`, `lab/mathworker.js`, `lab/meters.js`, `lab/dynamics.js` (a comment).
- `lab/render-exact.js` and `lab/capture.js` (C7's).
- `lab/window-chrome.js` (one condition), `lab/index.html` (one canvas line; C0 owns its cascade), `lab/lab.css` (the
  `#fieldlines` selectors and the `.legacy-note` rule).
- `lab/new-project.lambdawaves.json`: take either side, then `node tools/new-project.mjs` and `--check`. `lab/sw.js`: take
  either side, then `node tests/pwa.test.mjs --write`.

## The drafted CLAUDE.md paragraph (applied in `b71022c`, replacing the D9 paragraph's LEGACY sentences)

> The five LEGACY windows are DELETED (0.5.0, R5-L1): QCD, H₂⁺ and HELIUM in D9,
> H₂ and ELECTROSTATICS in D9b. An older file that used one opens on its shim and
> says so in one line (`retired in 0.5.0: …`, PROJECTS and STATE status): a QCD
> seat without the window (QUARKONIUM keeps `instruments.qcd`), H₂⁺ as MOLECULES ·
> H₂ σg/σu, HELIUM as ATOM · He 1s, H₂ as MOLECULES · H₂ density, an ELECTROSTATICS
> overlay as nothing drawn (`docs/LEGACY-WINDOWS.md`; `tests/fixtures/legacy-*`).

## Blockers

None. The one red, `current`'s `followsPalette`, is red on the base `c83b7ee` too, with the base's own suite on the base's own
tree:

```
LW_PORT=8903 GD_PORT=5373 node tests/current.browser-test.mjs
AssertionError [ERR_ASSERTION]: followsPalette
false !== true
    at file:///…/tests/current.browser-test.mjs:138:399
```

## Open items

- **The field kernel's space-5 branch** (H₂) is dead, and so is D9's space-4 (HELIUM). Both are in `field.js`, and their removal
  is a shader change for a lock run.
- `tools/perf/device-report.js` still lists `LW.h2` and `LW.fieldlines` (and D9's `LW.molecule`, `LW.helium`, `LW.qcd`). Its
  `safe()` wrapper tolerates them.
- CLAUDE.md's FILM paragraph still says "the digest lock (1004 + 1148)", the pre-D9 counts. On this tree the counts are 860 and
  1004. That is the C7 paragraph, so it is left for the integrator.
- `legacy/boot` B102 is red on `moview` (D9's). The suite needs its own pass.
- `h2ci.js`' `h2CurveTable` has no lab caller now. It stays for `card-solvers` and D6's MAPS ("MAPS needs it", PLAN §0).

## Exact next step

The integrator (Claude Sos, `sos-s0`) merges `worktree-agent-aba28140791c56025`. If C3's rack rewrite moved the blocks, re-apply
the rack.js hunks above from `D9B-rack.patch` by their text, then grep `rack.js` for `h2\b|wH2|fieldlines|wFld|legacyWindow`.
Only the two shim comments and `const hl` should remain. Then run, in order:

```
node tools/new-project.mjs && node tools/new-project.mjs --check
node tests/pwa.test.mjs --write
bash test.sh node
history, new-project, molecule-demos, molecular-names, current
the lock ALONE: --check --query gastab=0 (860), then plus --fixture …/digest-lock-s4a.json (1004)
```
