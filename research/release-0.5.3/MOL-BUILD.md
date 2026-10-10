# MOL-BUILD · B-MOL's rows M1 THE FORMULA · M2 C₆₀'S LADDER · M3 STATES ANSWERS · M10 MORE PRESETS (0.5.3 "Rack Tune", W1)

Builder: Claude Opus 5.5 as B-MOL, 2026-10-10, worktree `.claude/worktrees/agent-aef3472a14926d1f4`, branch `worktree-agent-aef3472a14926d1f4`,
reset to `688418f` (the integrator's `sos-s0` tip) first. Brief: `BRIEF-MOL.md`, followed in its order M1, M2, M3, M10. NO push.

| row | commit | JS lines |
|---|---|---|
| M1 THE FORMULA | `b2b090f` | +1 |
| M2 C₆₀'S LADDER | `59b327e` | +6 |
| M3 STATES ANSWERS | `453773f` | +3 |
| M10 MORE PRESETS | `efeaa07` | +8 |

The PNG pairs are under `research/release-0.5.3/eye/mol-*-{before,after}.png`. Both halves come from one script, `.tmp/mol-eye.mjs`
(headless Firefox at 1500 × 1000 on port 8953, cropped by `.tmp/crop.py`). "before" ran on the untouched `688418f` tree before any edit;
"after" ran on `efeaa07`. The scenes are the same in both. Where the rows changed a road, the script takes the hand's road (a dropdown change,
a press of a switch).

---

## M1 · THE FORMULA

**What changed.** `lab/latex-state.js:93-101`. `formulaLatex` turns each run of the spelled-out class `[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+` into one `^{…}`
(`:99`, with `SUP` at `:93`). So `²⁻` becomes `^{2-}`, and NH₄⁺ still gives `^{+}`. The two `⁺`/`⁻` replaces that were at `:98` are folded into it.
The class is spelled out because ¹ ² ³ are U+00B9/B2/B3, outside the range ⁰–⁹ (U+2070–2079). Checked before and after:
`/[⁰-⁹]/.test('²')` is `false`, and `/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]/.test('²')` is `true`. The record's baked `page` field is left alone.

**The case that pins it.** `tests/latex-state.test.mjs:131` asserts `formulaLatex('<m>B₁₂H₁₂²⁻</m>') === '\mathrm{B_{12}H_{12}^{2-}}'`.
The sweep at `:133-141` runs every formula of `MOLECULE_BY_ID` (91) and of `lab/library.json` (37 rows), **128 in all**, through KaTeX with
`throwOnError: true, strict: 'error'`. It asserts at least 91 `MOLECULE_BY_ID` rows and 37 library rows, so the `{rows:[]}` fallback at
`molecules.js:500-503` cannot pass an empty sweep. The old function fails the sweep on exactly one row: `B12H12--: KaTeX parse error: Double superscript`
(`.tmp/old-sweep.mjs`).

**What Josh will see.** He picks B₁₂H₁₂²⁻ (closo-dodecaborate) and its head shows the formula typeset. It used to show
`\mathrm{B_{12}H_{12}²^{-}}` in KaTeX's red. `eye/mol-m1-formula-before.png` → `eye/mol-m1-formula-after.png` (the head's first line; KaTeX errors 1 → 0).

## M2 · C₆₀'S LADDER

**What changed.**
- `lab/orbitalsview.js:159` adds `carried(k)`: in range, and inside `sol.cols` when a frontier record sets it. C₆₀ carries columns 175–182 of 300.
  `select` (`:207`), `paintLevels` (`:219`) and `crossed()` (`:526`) skip any level the record does not carry.
- The ladder draws an uncarried level dim (stroke alpha 0.14, fill 0.04, `:474-477`), and its hover says "not carried by this record" (`:484`).
- `colsWhy()` (`:160`) is the record's one sentence. `refusal()` uses it (`:268`), and so do the presets (M10).
- So the refusal and `update()`'s silent stop can no longer be reached by a click on a dim rung.
- `lab/chemview.js:322-325`: a failed record open puts `preset` back to the last solved molecule (`sol.key`), through `mSeg.set`, BEFORE `sol = null`.
  If nothing was solved before, it chooses nothing (`selectedIndex = -1`). A hand's re-pick of the molecule that failed is then a change, and it is
  answered. There is one road and no re-solve-on-re-pick. `:341`'s `.catch` (an exception, not a failed open) is outside my lines and unchanged.

**The case that pins it.** `tests/register.browser-test.mjs` R11 (`:187-235`):
- (a) The C₆₀ record is deleted from `lw-data-v1` and its fetch is refused in the page. A pick of C₆₀ follows the browser's own rule: a
  `<select>` fires `change` only when its value changes. Firefox's driver fires `change` on every `<option>` click, so its element road cannot stand
  in for a hand here. The dropdown must then read the last solved molecule (C6H6), with no solution. With the network back, a second pick must open C₆₀.
- (b) 36 real driver clicks down the ladder, then a real drag across all of it, must put only columns 175–182 in the register. A real press of ON
  must be answered: `orbital-packet` selected, `refusal: null`.
- Both R11 judges are **RED on the pre-M2 code**, measured with `.tmp/r11-probe.mjs` on the old `orbitalsview.js`/`chemview.js`. The dropdown stayed
  on C60, and the clicks put 34 uncarried levels in. Both are **GREEN** on M2.

**What Josh will see.** C₆₀'s MO-REGISTRY ladder shows the HOMO and LUMO sets in full ink and every other rung faint. A click on a faint rung does
nothing, and MO-REGISTRY ON lights. Before, `select(150)` went in and ON was refused with "this record carries orbitals 176–183 only".
If the buckyball's record cannot be fetched, the MOLECULE dropdown goes back to the last molecule, so picking C₆₀ again works.
`eye/mol-m2-c60-ladder-before.png` → `eye/mol-m2-c60-ladder-after.png`.

## M3 · STATES ANSWERS (STATES kept whole: R2)

**What changed** (`lab/statesview.js`; `persist.js` is not touched):
- **ON over S₀ alone plays BEAT** (`:313`). A HAND's press of the switch (`onChange → setOn(v, true)`, `:79`) over S₀ alone applies the BEAT preset
  and announces "BEAT" on the stage. That is one behaviour, with no "add a state" sentence. A restore or an API `setOn(true)` keeps the lanes it
  was given, so the restore stays byte-faithful.
- **The auto-off on a re-solve goes** (`:638`). Under ON, a new solution stands the register down only while there is no ladder (it cannot play,
  and holding the claim would drop the new molecule's ground product). It arms the re-arm, and the register comes back ON (BEAT on the new ladder)
  when the ladder lands.
- **The one re-arm seat** is the ladder's landing in `fetchLadder` (`:174-177`). It honours a parked record's `wanted.on`. It also honours an ON
  refused while the ladder was out (`:312`; that is `persist.js:232`'s road, or a hand's press during a solve; the status says "· ON when it
  lands"). And it honours a re-solve under ON. `armed` (`:51`) is 1 for a restore's wish and 2 for a hand's; a hand's wish plays BEAT over S₀.
  A parked `load` resets it (`:708`), and so do OFF and a worker refusal.
- **The no-states refusal is a sentence on the switch** (`:78-82`, `:171`, `:639`). When the worker refuses the ladder
  (`mathworker.js:328`'s "stores no CIS states", or C₆₀'s "frontier orbitals only"), the switch's label reads **NO CIS STATES**. Its hover carries
  the worker's own sentence plus "— ORBITAL mode plays its orbitals". The next fresh solution puts MO-REGISTRY ON back. "NO CIS STATES" is
  measured at 106 px, inside MO-REGISTRY ON's 117 px seat (`.tmp/label-fit.mjs`), so ORBITAL | STATES keeps one row at 1500 and at 390 px. The
  first wording, "NO STATES STORED" (129 px), folded that row to two, so it was replaced before the row was final.
- **No cut** (R2). The 19 `reg.*` targets (`shell/modulation.js`) and `__LW.states` (`shell/facade.js:71-79`) are untouched. `save()`/`load()` and
  the lane record are unchanged.

**The case that pins it.** `tests/register.browser-test.mjs` R12 (`:236-271`):
- C₆₀'s switch reads NO CIS STATES, with the worker's sentence in its hover; water's reads MO-REGISTRY ON again.
- A real press of ON over S₀ alone gives lanes S₀ + S₅ and the stage banner "BEAT".
- A re-solve (NH₃) under ON comes back ON with S₀ + S₅x.
- An API ON refused mid-ladder (C₆H₆, called synchronously from a chem subscriber) is refused "· ON when it lands" and comes ON at the landing with S₀.
- A record loaded with `on: true` while H₂O's ladder is out (parked) comes ON at the landing with the record's own lanes, byte-equal.
- Both R12 judges are **RED on the pre-M3 code** (`.tmp/r12-probe.mjs`): the label stayed MO-REGISTRY ON, the press gave S₀ alone, and every
  re-arm stayed off. Both are **GREEN** on M3.
- `history.browser-test` (STATES ground-lane bytes) passes, and `node tools/new-project.mjs --check` is in step with no regeneration.

**What Josh will see.** In STATES mode, with only S₀ in the register, MO-REGISTRY ON now plays: the stage flashes "BEAT" and shows the slosh.
Before, it lit the switch over a blank stage. For a molecule whose record has no excited states (C₆₀, the amino acids, the bases, B₁₂H₁₂²⁻ …), the
switch itself reads NO CIS STATES, and hovering it says why. Picking another molecule while STATES is on brings STATES back on by itself.
`eye/mol-m3-water-s0-before.png` → `eye/mol-m3-water-s0-after.png`; `eye/mol-m3-c60-states-before.png` → `eye/mol-m3-c60-states-after.png`.

## M10 · MORE PRESETS

**What changed.** `lab/orbitalsview.js:82-97`. The ORBITAL presets go from 2 to 8, and from if-arms in `preset()` to ONE table. Each entry maps a
name to `[the levels it takes, from the HOMO h and the LUMO l; its refusal sentence; its phases]`. `preset()` (`:234-240`) is one driver for every
entry:
- levels out of range → the entry's sentence;
- a level the record does not carry → `colsWhy()`;
- otherwise equal amplitudes √(1/n) and the named phases (0 otherwise).

√(1/2) is bit-equal to `Math.SQRT1_2`, so HOMO + LUMO and WINDING keep their bytes. σ + σ* is struck (R4). The STATES presets are unchanged.
The banner (`presetMd`, `:105-110`) names one degenerate level once and then its members (`$1e_{1g}$ (a) + (b)`, and the same for a fivefold set).
Past four orbitals with different names it gives the count. The dropdown's hover describes all eight.

**The preset table as built** (measured: water by R13 and `stage-text` t3, C₆₀ by R13 and the eye; |c| equal):

| preset | rule | water (H₂O/STO-3G) | C₆₀ (cols 175–182) | refusal |
|---|---|---|---|---|
| HOMO | k = h | 4 · `$1b_{1}$` | 179 | — |
| LUMO | k = l | 5 · `$4a_{1}$` | 180 | "this basis has no virtual orbital" |
| HOMO + LUMO | h, l (√½ each) | 4, 5 | 179, 180 | "this basis has no virtual orbital" |
| FRONTIER FOUR | h−1, h, l, l+1 (four orbitals, by index) | 3–6 | 178–181 | "it needs two occupied and two virtual orbitals" |
| HOMO SET | the whole degenerate HOMO level | 4 | 175–179 (h_u, 5-fold) | — |
| LUMO SET | the whole degenerate LUMO level | 5 | 180–182 (t_1u, 3-fold) | "this basis has no virtual orbital" |
| WINDING | a degenerate pair, phases 0 and π/2 | refused (no pair) | 178, 179 | "no degenerate orbital pair in this molecule — a winding phase needs a twofold level" |
| OCCUPIED | every valence orbital (core..h), equal phase | 1–4 | refused | C₆₀: "this record carries orbitals 176–183 only (its HOMO and LUMO sets)" |

**The case that pins it.**
- `tests/stage-text.browser-test.mjs:77` and `:84-85` pin one banner per preset, by a hand's dropdown change on water:
  - `HOMO · $1b_{1}$`, `LUMO · $4a_{1}$`
  - `FRONTIER FOUR · $3a_{1}$ + $1b_{1}$ + $4a_{1}$ + $2b_{2}$`
  - `HOMO SET · $1b_{1}$`, `LUMO SET · $4a_{1}$`
  - `OCCUPIED · $2a_{1}$ + $1b_{2}$ + $3a_{1}$ + $1b_{1}$`
  - with HOMO + LUMO and WINDING (NH₃) as before: 8 announcements.
- `tests/register.browser-test.mjs` R13 (`:273-292`) runs all eight on water and on C₆₀:
  - the option order;
  - the exact water picks and amplitudes;
  - WINDING refused on water;
  - every C₆₀ pick inside the columns;
  - OCCUPIED refused on C₆₀ with the record's sentence;
  - FRONTIER FOUR then ON is answered.

**What Josh will see.** The MO-REGISTRY PRESET… dropdown lists HOMO, LUMO, HOMO + LUMO, FRONTIER FOUR, HOMO SET, LUMO SET, WINDING and OCCUPIED.
On C₆₀, HOMO SET lights the five h_u rungs, and every preset either plays or says why. `eye/mol-m10-presets-before.png` (2 entries, HOMO + LUMO on C₆₀)
→ `eye/mol-m10-presets-after.png` (8 entries, HOMO SET on C₆₀). The list is held open for the picture with `size`; that is a picture aid, not app code.

---

## Lines before / after (`cat lab/*.js lab/shell/*.js lab/windows/*.js | wc -l`)

27,943 at `688418f` → **27,961** at `efeaa07`: **+18**, against a budget of +52 (the stop is at +78).

| file | + | − | net |
|---|---|---|---|
| `lab/latex-state.js` | 4 | 3 | +1 |
| `lab/chemview.js` (`:322-325` only) | 4 | 1 | +3 |
| `lab/orbitalsview.js` | 37 | 26 | +11 (M2 +3, M10 +8) |
| `lab/statesview.js` | 16 | 13 | +3 |

`lab/sw.js` is re-stamped by `pwa --write` after every `lab/` edit. `lab/molecular-register.js` is not touched: the ORBITAL table lives beside the
register it fills.

## The suites (final tree `efeaa07`, port 8953, rig law before each browser run)

Every closer the brief names, on the final tree. `node .tmp/waitrig.mjs` (rigfree, free and still free 4 s later) ran before each
browser suite, one at a time. B-STAGE took the rig twice between my checks, so `register` ran in a later slot.

| suite | result |
|---|---|
| `node tests/latex-state.test.mjs` | GREEN, 18 PASS; the sweep typeset **128** formulas (91 of `MOLECULE_BY_ID` + 37 library rows; ≥ 91 asserted) |
| `tests/molecule-head.browser-test.mjs` | GREEN (3 PASS, 35 s) |
| `tests/register.browser-test.mjs` | **GREEN 22/22**: R0–R10 unchanged, + R11 (C₆₀ ×2), R12 (STATES ×2), R13 (presets) |
| `node tests/library.test.mjs` | GREEN |
| `node tests/molecular-register.test.mjs` | GREEN, 8 PASS |
| `node tests/molecular-drive.test.mjs` | GREEN, 7 PASS |
| `tests/history.browser-test.mjs` | exit 0, 44 PASS (the STATES ground-lane byte cases included) |
| `node tools/new-project.mjs --check` | in step (16117 B), with **no regeneration**; `lab/new-project.lambdawaves.json` untouched |
| `tests/stage-text.browser-test.mjs` | GREEN, 4 PASS: the eight presets' banners pinned in t3 (8 announcements) |
| `tests/molecule-demos.browser-test.mjs` | GREEN, 5 PASS |
| `bash test.sh node` | exit 0 (pwa included, after `pwa --write`) |
| `node tests/molecule-head.test.mjs` (extra) | GREEN |
| serialize-bytes, `688418f` vs `efeaa07` (extra; G-B) | **11/11 IDENTICAL**: bytes, sha-256, edit bytes and edit sha for all four demos, NEW and six history rows |

The pins were each measured RED on the code before their row (`.tmp/r11-probe.mjs` on pre-M2, `.tmp/r12-probe.mjs` on pre-M3,
`.tmp/old-sweep.mjs` for M1). R13 and the stage-text banners name presets that did not exist before M10, so they cannot run on the old code.

## What I could not measure
- **Josh's own eye.** The PNGs are headless Firefox on this Linux box at 1500 × 1000, not his screen, not Safari, not the iPad.
- **A real dropdown pick.** The OS-native `<select>` popup cannot be driven headless, and Firefox's WebDriver fires `change` on every `<option>`
  click (measured: the pre-M2 code passed that road). R11 therefore emulates the browser's rule (change only on a new value) instead of using the
  driver's option click. The precondition it checks is the dropdown's value after the failure.
- **A real network failure.** C₆₀'s failed fetch is simulated by refusing that one URL in the page's `fetch`. The service worker's own fetch for
  `library/` (cache-first `lw-data-v1`) was not exercised offline.
- **THE LOCK.** I ran no digest lock. No field code changed (`field.js`, the session, the kernels). The registers' products are byte-identical for
  any given register; only which levels can be selected (M2), BEAT on a hand's ON (M3) and the presets (M10) changed. The field reads those
  products, so M-V's lock run covers it.
- **The C₆₀ ladder's speed on a GPU shared with B-STAGE**: no timings are claimed.
