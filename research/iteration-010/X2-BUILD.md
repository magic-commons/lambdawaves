# X2 · THE REACH OF n = 7 — build note (iteration 010, branch `it010-reach` from `43d1e44`, gate 9361 / GD 5361)

Josh (10-19): the next iteration is "the integration of n = 7". N7 (009) found that the λ knob's floor 0.25 cannot reach 1/7, the
hydrogen limit of n = 7. This row widens the knob, then walks every other range, fold, readout, label and picture road for a stop at six
shells or 91 labels. Mid-row, Josh added: "make n=7 minimized by default in the spectrum window, users can discover n=7 if they want to
jam the whole rack lane with orbital options." Nothing is pushed. `lab/field.js`, the fixtures, `lab/mir/**` and `lab/fonts/**` are
untouched, and THE LOCK did not move (§ Gate).

## 1 · THE SCALE's λ reaches 1/7

| what | where |
|---|---|
| The one range and clamp: `LAMBDA_MIN = 1/7`, `LAMBDA_MAX = 3`, `clampLambda(v)` (NaN → 1, as before) | `lab/sturmianreg.js:33-37` |
| The knob: `min: LAMBDA_MIN, max: LAMBDA_MAX, log: true`; its readout names a limit it stands on (`λ = 0.143 · 1/7`) | `lab/windows/spectrum.js:83-87` |
| The setter clamps through `clampLambda` | `lab/windows/spectrum.js:224` |
| A project's restore clamps through `clampLambda` | `lab/shell/persist.js:9` (import), `:287` |

- **The map is now LOG.** On a linear 1/7 … 3 the limits ½ … 1/7 would crowd the first eighth of the travel. On the log map the seven
  limits 1, ½, ⅓, ¼, ⅕, ⅙, 1/7 sit at 64, 41, 28, 18, 11, 5 and 0 % of the travel. The λ knob is not a modulation target (no `defs`
  row), so no route reads its travel.
- **Unchanged:** the default λ = 1 (the knob's `value` and double-tap reset), the ceiling 3, the saved record `{ on, lambda }`, the
  link's f32, and THE LOCK's λ 1.4 row.
- **An old project's λ opens as it was.** Every older λ is in [0.25, 3] ⊂ [1/7, 3]. The probe restores 0.3 and gets 0.3. It restores
  0.05 and gets 1/7 (the new floor). It restores 1/7 and saves `{ on: true, lambda: 0.14285714285714285 }`.
- **The physics (headless Firefox, a real Home key on the knob, 7s alone under STURMIAN, HYDROGEN, Z = 1):**

| | λ at the floor | knob readout | ⟨H⟩ | eigenvectors lit |
|---|---|---|---|---|
| before (43d1e44) | 0.25 | `λ = 0.250` | −0.0044643 | many: 7s is spread across its l = 0 block |
| **after** | **1/7** | **`λ = 0.143 · 1/7`** | **−0.0102041 = −λ²/2 = −1/98** | **one**: pop 0.99999999999999978, n = 7, l = 0 |

At λ = Z/n₀ the label n₀ is an exact eigenvector (sturmian.js). The knob can now reach that point for every shell of the register.

## 2 · Josh's ruling: n = 7 folded by default in SPECTRUM

The law was already A7's. This row confirms each default case in the browser and leaves the code as it is:
`lab/spectrum.js:92` `FOLD_DEFAULT = [7]` and `:121` (build); `lab/shell/rack-wiring.js:6` `SHELLS_FOLDED = [7]`, `:93-94` (a layout
record without `shells` folds n = 7 alone) and `:182` (`shells` is written only when it differs from [7]).

| case | folded after it | shot |
|---|---|---|
| first run (a fresh profile) | **[7]**; the layout record has no `shells` | `after-fold-1-first-run.png` |
| a hand unfolds n7 (a real tap) | [] and the record writes `shells: []`, a WORKSPACE choice | `after-fold-2-hand-opened.png` |
| NEW after the hand unfolded it | [] (NEW "leaves the preferences and the arrangement alone", docs/STATE-SCOPES.md) | — |
| NEW from the default | **[7]**; no `shells` in the record | `after-fold-3-new.png` |
| an older file with no fold record (WAVE DANCER: its spectrum card has no `shells`), opened while n7 was unfolded | **[7]** | `after-fold-4-older-file.png` |
| the Picker opens an atom (a real tap on Fr, 7s¹) | **[7]**; the n7 row reads "1 populated" (label 91 = 7s₀) | `after-picker-atomic.png`, `after-fold-5-picker-atom.png` |

n ≤ 6 are untouched. **A call for Josh / Sos:** NEW keeps a hand's unfold because the scopes law says NEW never touches the
arrangement. If Josh wants NEW to fold n7 again, that would be a new exception to that law. I did not build it.

## 3 · The hit list (grep `6` / `91` / `NMAX` / `N6` / `n ≤ 6` / `spdfgh` near shells, `lab/` and `tools/`)

| hit | verdict |
|---|---|
| `lab/windows/spectrum.js:83` λ floor 0.25 (and `:220`, `persist.js:287`) | **widened** (§1) |
| `lab/windows/static-field.js:47` INTER-SHELL readout: `k > 6 ? 'every shell below its saddle'` after a loop that runs to k ≤ 7. At k = 7 (only n = 7 past its saddle) it said every shell was safe | **fixed** → `k > 7` |
| `lab/hamiltonian.js:24` the H0 ladder's n = 7 colour (Z ≠ 1 or μ ≠ 1) was yellow [255,236,110], while SPECTRUM's own n7 at Z = 1, the kit and keplerview use the rose | **fixed** → [246,142,159] (the kit's dark rose, as keplerview.js:12). `hydrogenRGB` has no reader, and the field never reads it |
| `lab/index.html:30,33,110` "91 nlm states" (meta, og, ABOUT tagline) and `lab/manifest.webmanifest:4` (pwa.test holds the two to the character) | **fixed** → 140 |
| `lab/index.html:130` help: "its 91 basis states with n ≤ 6", "over all 91 labels" (INTER-SHELL) | **fixed** → 140 · n ≤ 7 |
| `tests/legacy/boot.browser-test.mjs:1658` the tagline string | **fixed** to match (a legacy suite; not in the gate) |
| `tools/menu-thumbs.mjs:31` "the register ends there: 7s and 7p have no picture" | **comment fixed**. The Picker's ATOMIC deck shows `el-<sym>` for all 118 (`ATOMS.length` = 118; `el-Fr` … `el-Og` exist in `lab/img/menu/`), so no tile wants an `orb-7s` / `orb-7p` and none was drawn |
| `lab/picker.js:152` `live ? '' : 'past krypton: …'` | leave: unreachable (every element is live) |
| `lab/spectrum.js:93,121,307` shells and level lines over `NMAX` | already 7 (A7) |
| `lab/atomsview.js:63` ATOMS periods `[7, 87, 118]` | already 7 (A7) |
| `lab/windows/spectrum.js:310-327` LOAD VALENCE: "past the basis (n ≤ 7)"; Fr loads 7s₀ (probe §2) | already 7 |
| `lab/status.js:25-28`, `lab/badges.js:77` ("all 140 labels") | already 7 |
| `lab/atoms.js:106`, `lab/atomsview.js:25` `SPD = 'spdfgh'` | leave: indexed only by ground-configuration shells (l ≤ 3) |
| keyboard: `lab/shell/keys.js` Digit1–4 are the rotor's, and there are no shell keys | none to widen |
| `lab/state.js:532` preset note "maximum angular momentum in n≤6" (the 6h preset) | leave: true of that preset's own shell |
| `lab/state.js:426-427`, `lab/windows/state.js:45-46`, `lab/shell/persist.js:23-24,66,255`, `tools/new-project.mjs:89` (91-wide rates, stores, the basis word) | leave: A7's byte law (an n ≤ 6 file never moves) |
| `lab/statelink.js` (REG7, MASK_BYTES, `:511` 'n<=6' decode word) | leave: decided (link byte law) |
| `lab/hamiltonian.js:25` `QHO_RGB` mod 6 | leave: decided |
| `lab/period.js:5-10,85-86` | leave: decided (the first pass; n = 7 is handled at 352 800) |
| `lab/wigner.js:55,226` | leave: decided (timing note) |
| `lab/separable.js:3` 91 slots | leave: decided (SEPARABLE's slots) |
| `lab/equalizer.js` six/seven | already 7 (N7) |
| `lab/sturmian.js:47`, `lab/sturmianreg.js:3-6`, `lab/well.js:70-85`, `lab/kick.js:33,90`, `lab/cornell.js:4`, `lab/field.js:94` | leave: history and complexity comments (`field.js` is not touched) |
| `lab/kepler.js`, `lab/frontier.js`, `lab/central.js`, `lab/qho.js`, `lab/hamiltonian.js` loops over `NMAX`; `pad` to 7 | already 7 |
| CSS hits (`repeat(…)`, `minmax`) | false positives; `.eq-faders` is already `repeat(7, …)` |
| WAVE DANCER PROTOTYPE (n ≤ 6) | does not move: serialize-bytes case 1 is byte-identical (§4) |

## 4 · An n ≤ 6 project's bytes never move (A7's law)

`tools/serialize-bytes.mjs` was run on the base tree (`git archive 43d1e44 lab`, served on 9361) and on this tree. All 8 readings are
identical, both `serialize()` and `serialize({ scope: 'edit' })` sha-256. The 8 readings: WAVE DANCER PROTOTYPE 13170 B `20220caee5b8d6c7`,
the empty project 11274 B `ef4bdb2d750a5967`, and the six history rows. The record files are `.tmp/x2/sb-base.json` and `.tmp/x2/sb-x2.json`.

## Proof shots (`research/iteration-010/x2-shots/`, headless Firefox 1500 × 1000; probe `.tmp/x2/probe.mjs`, its log `after-probe.json` / `before-probe.json`)

- `before-lambda-floor-7s-card.png` / `before-lambda-floor-7s.png`: the knob pressed to its floor shows `λ = 0.250` on 7s.
- `after-lambda-floor-7s-card.png` / `after-lambda-floor-7s.png`: the knob at its floor shows `λ = 0.143 · 1/7` on 7s, with the stage's
  7s₀.
- The fold, case by case (§2): `after-fold-1-first-run.png` … `after-fold-5-picker-atom.png`, plus `after-picker-atomic.png`.
- 0 page errors in both runs.

## Gate

| run | result |
|---|---|
| `node tests/pwa.test.mjs --write` | written, exit 0 (the manifest's description moved with index.html) |
| `./test.sh node` | **exit 0** |
| `node tools/rack-deps.mjs --classes --no-write` | exit 0, HOLDS, spectrum 25 (limit 25) |
| `node tools/new-project.mjs --check` | in step (16098 B) |
| register · orbitals · current · project-formats | **22/22 · 24/24 · 15 PASS 0 FAIL · 5/5** |
| library | 4 PASS, then step 5 "the refusal is not named": the listed pre-existing red |
| THE LOCK `digest-lock.mjs --check --query gastab=0` | **GREEN 843 / 0 / 0**, 53 s (run once; nothing that feeds it moved) |
| serialize-bytes, base vs X2 | 8/8 identical |

## Proposed CLAUDE.md sentences

In THE REGISTER IS n ≤ 7 paragraph, after "…THE SCALE λ and the BOX packet hold all 140 (iteration 009 N7) …":

> THE SCALE's λ runs 1/7 … 3 (iteration 010 X2: `sturmianreg.js` `LAMBDA_MIN` / `clampLambda`, one clamp for the knob, the setter and a
> restore; the floor is n = 7's hydrogen limit, where 7s is an exact eigenvector, E = −1/98). The knob is LOG, so the seven limits 1 … 1/7
> spread over its travel, and its readout names a limit it stands on (`λ = 0.143 · 1/7`). The default 1, the saved `{ on, lambda }` and
> THE LOCK's λ 1.4 are unchanged, and an older λ (always ≥ 0.25) opens as it was.

And replacing the fold sentence ("SPECTRUM's coloured `n` number folds its shell …"):

> SPECTRUM's coloured `n` number folds its shell (no chevron; a folded shell counts its populated labels; the paint crosses open rows
> only). Josh 10-19: "make n=7 minimized by default in the spectrum window, users can discover n=7 if they want to jam the whole rack lane
> with orbital options". So n = 7 is folded on a first run, after NEW from the default, for any record without `shells` (an iteration-008
> or older file, the demo) and after the Picker opens an atom (Fr's 7s reads "1 populated" on the folded row). A hand's unfold is the
> card's WORKSPACE `shells`, written only when it is not [7], and kept as WORKSPACE is (NEW never touches the arrangement).
