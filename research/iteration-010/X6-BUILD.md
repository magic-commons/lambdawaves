# X6-BUILD · THE DELETION PASS OF 009 (iteration 010)

Builder: Opus 5.5, in its own worktree on branch `it010-deletion` from `bd0c004` (the integration tip, which already carries X2 and X4). Gate server
9381 / GD 5381. The base tree (`git archive bd0c004`) was served on 9382 / GD 5382 for the two-tree comparisons. Both servers were stopped by pid.
NOT pushed.

The brief is the ordered deletion-pass list at the end of `REVIEW-QUALITY-009.md`, plus the candidates in `REVIEW-ARCHITECTURE-009.md`. The pass
deletes lines and adds nothing, and behaviour stays byte-identical. The one exception is the bug in item 1, which was reproduced first and then
fixed. X1's ground was left alone: `rack.js` `modesAt` / `renderSet` and the reconstruction frame, `field.js`' mode upload, and the propagation
code of `sturmianreg.js` and `stark.js`. No item needed those lines. Every saved id, every `reg.*` / `chem.*` target, every `__LW` member name,
every WORKSPACE key and the serialize bytes are unchanged.

## The measure

| | base `bd0c004` | `it010-deletion` | Δ |
|---|---:|---:|---:|
| lab JS lines (`find lab -name '*.js' -not -path 'lab/mir/*'`) | 32,915 | **32,919** | +4 |
| lab JS bytes | 2,834,068 | **2,835,086** | +1.0 KB |
| branches (`if (` and `? `, lab JS less sw.js) | 7,809 | **7,801** | −8 |
| rack-deps · spectrum / persist / largest literal | 25 / 24 / 70 | **25 / 24 / 70** | — (HOLDS) |

The lines did not fall. The review's estimate of about 25 assumed deletions, but most of this pass is MOVES: a literal becomes an import or a
template, and each import costs a line. Two items also add a small function that serves both of their copies: `narrow` / `widen`, and KEPLER's
`gasSay`. One item the review counted as a deletion turned out to be a live road, so it was kept (item 5). What did fall: the branches (−8), the
twelve letter tables, the duplicated V_x loop, the duplicated GAS line, a never-reached gate, three paint sites for MORPH, a derivable witness
field, and nearly every hand-typed copy of the register's size.

The diff against the base is 138 insertions and 114 deletions over 29 files, not counting `sw.js`.

## Each item

| # | item (the review's) | verdict | lab lines (+/−) | the proof that behaviour is identical |
|---|---|---|---|---|
| 1a | the shell seat's getter, `?? 1` (`persist.js:21`) | **resolved. A REAL BUG: reproduced, then fixed** | see below | see "The NaN finding" below; `history` browser 45 PASS; `serialize-bytes` identical |
| 1b | A7's width law as one pair in `hydrogen.js` | **resolved** (`narrow(a, id, short = N6)`, `widen(a, id, full = 140)`) | 1a + 1b: +15 / −11 | node `hydrogen` · `statelink` · `equalizer` · `project-formats` · `history` · `new-project`; `serialize-bytes` 8/8 then 12/12 identical; `new-project --check` in step |
| 2 | the l letters from `names.js` (12 copies) | **resolved**: `export const L_LETTERS = 'spdfghik'`. All 12 copies read it: `atoms.js` and `atomsview.js` alias it as `SPD`; `central.js`, `hamiltonian.js` ×4, the `rack.js` COPY text and `windows/spectrum.js` ×3 index it; `radiation.js`' key is `atomForms(s).ascii` | +23 / −24 | node: the 140 `BY_NAME` keys are equal to the old ones (0 differ); max l = 6, so `'spdfghik'[l] === 'spdfghi'[l]`; `names` · `hydrogen` · `radiation` · `central` · `atoms` · `latex-state` · `cornell` green |
| 3 | one `show(v)` in `register-morph.js` | **resolved**: `set`, `reset` and `load` call it | +4 / −5 | `register` 22/22, `orbitals` 24/24, F2's restored-MORPH probe (`research/iteration-009/f2-shots/probe.mjs after`) 8/8 GREEN |
| 4a | MV's repeated V_x loop | **resolved**: `xR` / `xPhi` are chosen once per solve, giving one V_x loop with Φ inside the E_x loop; the plain road multiplies by 1 | +9 / −8 (4a + 4b) | **MV's byte check re-run** (`.tmp/x6/mvcheck.mjs`, the equivalent of MV-BUILD's `.tmp/mv` check: a sha-256 of E, E_scaled, E_x, every ε and λ, every u's f64 bytes, the model string and the label, for Z = 1…118, **on both roads**). Base, before and after are all equal: NR `c53aaba4…fe78`, ZORA·MV `93ab9b5a…909b`. `atoms` (29 gates) green |
| 4b | the model's short name retyped | **resolved, in part**: `RELATIVITY_SHORT = 'ZORA · MV'` (and `RELATIVITY = ' · scalar ' + RELATIVITY_SHORT`, string-equal), read by `status.js` and `atomsview.js` (the MODEL sub) | (in 4a) | `status` (the 110-character budget) green. **Left as typed:** `ε_ZORA·MV` (a symbol, not the name), STATUS' long prose "scalar ZORA, MacDonald–Vosko exchange", and the ZORA note's prose |
| 5a | `seed()`'s `startsWith` guard | **resolved, as a literal condition that keeps behaviour identical**: rename iff `e.name !== s.name` and `e.name` is not the kit's `uniqueName` form of it (`/ \d+$/` stripped) | +2 / −2 | Over every name an entry can hold today (`WAVE DANCER`, `… PROTOTYPE`, `… PROTOTYPE 2`, `… 17`) the old guard and the new one agree. The likely next rename, WAVE DANCER PROTOTYPE → WAVE DANCER, which the prefix test blocked, now lands. The review's suggestion `!entryAt(name)` was **not** taken, because it changes a reachable case: with a taken name the old road gives `… 2` and `!entryAt` gives no rename at all |
| 5b | the "dead" adoption branch (`projects.js` keep-filter) | **skipped: it is LIVE** | 0 | The DEMOS press's fallback (`demo()` when this browser has no starter, for example after a seed that could not fetch) imports the bundled file at its own path. `lab/demos/wave-dancer.lambdawaves.json` says `"path": "DEMOS/WAVE DANCER PROTOTYPE"`, so that copy sits exactly where the adoption branch looks, and the next boot's seed makes the untouched copy the starter instead of seeding `… 2` beside it. Deleting the branch would change that |
| 5c | the line for `docs/FOR-MIR.md` | **resolved**: "A starter's refresh carries its name" (from iteration 010) | docs +4 | — |
| 6a | `orbitals.state().cursor`'s derivable `lit` | **resolved (deleted)** | | No test or tool reads it (grep). The shape is `{ k, row, lead }`: the lit lines are `row` while the cursor leads. CLAUDE.md's sentence changed |
| 6b | `levelLine(…, on, off, …)` → `(c, lit)` | **resolved** | | Pixels identical by construction: the old `on \|\| off` colour is the colour every caller now passes, and the alpha and width follow the same truthiness. `orbitals` 24/24, `register` 22/22, the F2 probe's ladders GREEN |
| 6c | `coherence()` repeats `gammaAbs2`'s index | **resolved**: one private `gk(n, n′)` | | `coherence` and `equalizer` green (`Math.hypot` kept, so coherence is bit-identical) |
| 6d | `equalizer.js:69`'s never-reached n > 7 gate | **resolved (deleted)** | 6a–6d: +17 / −18 | BASIS stops at n = 7 = `EQ_SHELLS`, and a populated index past BASIS would throw at `BASIS[a].n` before it, so it can never fire |
| 7a | `EQ_SHELLS = 7` → `NMAX`; the bare `6` / `7` in `serialize` and the D choice | **resolved** | | `equalizer` green; `serialize-bytes` identical |
| 7b | EQ_WGSL spells seven; `EQ_F` 104 with offsets 100/101/102 | **resolved**: the kernel is templated from `NMAX`; `EQ_G = 4·⌈NMAX²/2⌉` (100) sizes the uniform and places κ, mode and floor | | **String equality:** the base's EQ_WGSL and this tree's have the same sha-256, `43071db7…afebbb`, 10,762 characters (`.tmp/x6/eqwgsl.mjs`, a temporary copy of `field.js` exporting the private const, then deleted). **THE LOCK ×2**: 843 values · 0 readback · 0 record-byte differences; 987 values · 0 · 0; page errors 0 |
| 7c | CSS `152px` ×3, `repeat(7, …)`, the `\|\| 152` fallback | **resolved**: `.eq-grid, .eq-mix { --eq-size: 152px }`, `grid-auto-rows` (no count), and the fallback reads `--eq-size` | skin.css +4 / −3 | Both trees in Firefox: `.eq-mix`, the grid, its 152 device px and **all seven fader boxes identical to the third decimal**; METERS' COHERENCE canvas computes 152 × 152 on both |
| 7d | the words: "140" (SPECTRUM ×3, badges, STATES ×3), "n ≤ 7" ×2, "a/7" (KEPLER's GAS line, written twice), "n 5–7" (AUDIO IN ×2) | **resolved**: templated from `BASIS.length` / `NMAX`; KEPLER's two identical GAS lines became one `gasSay`; AUDIO IN's bands are read from its own `BAND` table | 7a–7d: +37 / −33 (+1 after the trim) | **1,192 strings** (every `title`, every seg / knob / switch / readout label and sub, every button) are an identical set on both trees |
| 8 | the byte probes read `STARTERS` plus the retired demos | **resolved**: `tools/serialize-bytes.mjs` and `tools/camera-routes.mjs` import `STARTERS` (`lab/project-store.js`) and read every file of `tests/fixtures/retired-demos/`. `catalogue-table` already read `STARTERS` (no change). `settings-probe` was not in the brief | tools +29 / −14 | `serialize-bytes`: the first eight readings keep their sequence and their shas; the four retired files are read last (helium, n2, water, wave-dancer-008), **12/12 identical** to the base. `camera-routes`: 6 projects GREEN, all **SAME** as the base (`--against`) |

### Item 1's per-file shape
- `hydrogen.js` +3: the pair and one line of doc.
- `persist.js`: the getter is `?? 1`; `:66` is `Array.from(narrow(rates, 1))`; `:255` is `rates.set(widen(pr.rates, 1))`; the literal `91` → `N6`.
- `windows/state.js`: `cut` reads `N6`, and `pad` is `Float64Array.from(widen(v, 0, W))`. `cut` keeps its own joint re/im test, because `some(Boolean)` reads NaN as zero and `narrow`'s `!==` would not.
- `equalizer.js`: `[...narrow(eq.gains, 1, EQ_SHELLS - 1)]`.
- `statelink.js`: `widen(pr.rates, 1)`. Its binary REGISTER / REG7 layout is untouched.
- The setter's in-place widening loop stays: it must widen the record object it holds.

## The NaN finding (`persist.js:21`): REPRODUCED

`.tmp/x6/nan-repro.mjs` (Firefox, the real undo ring, not committed) did the following:
1. Route MACRO 1 → `shell.rate.n7` at depth 0, so the output is exactly 1 and the record stays 91 wide.
2. Make one more edit (STAGE 0.37).
3. Undo, then redo.

On the base:
- after the undo, the base was 1;
- **after the redo, `R.baseOf('shell.rate.n7')` read `NaN`**;
- the next `serialize({ scope: 'edit' })` wrote the record **140 wide with n = 7's rates NaN**, which JSON prints as `null`.

So the undo ring hands the modulator a NaN base, and the NaN reaches a project's bytes.

The order: the route registers lazily. The redo's restore (`persist.js:294`) seats the base from a 91-wide row, `Number(undefined)` is NaN, and
the kit's clamp passes NaN.

With `?? 1`:
- the redo's base reads 1;
- the record stays 91 wide (`after[91]` undefined);
- the same script, re-run on the final tree, gives the same answer.

The review traced this path but did not reproduce it. The getter is now total.

## The gate

| check | result |
|---|---|
| `node tests/pwa.test.mjs --write` | written (sw.js), then PASS |
| `./test.sh node` | **exit 0** (twice: after item 8 and after the comment trims) |
| `node tools/rack-deps.mjs --classes --no-write` | **HOLDS**: spectrum 25 / 25, persist 24; G-A: 30 keys, the largest 70; bare writes 0 |
| `node tools/new-project.mjs --check` | in step (16098 B) |
| `register` · `orbitals` · `chem` | **22/22 · 24/24 · 56/56** |
| `history` · `project-formats` · `current` | **exit 0** (45 PASS) · **5/5** · **exit 0** (15 PASS) |
| THE LOCK ×2 (`digest-lock --check --query gastab=0`, then with `--fixture …digest-lock-s4a.json`) | **843 / 0 / 0** and **987 / 0 / 0**; page errors 0; 53 s each |
| `tools/serialize-bytes.mjs` (two trees) | 8/8 identical after item 1; **12/12** with item 8's readings |
| `tools/camera-routes.mjs --against` the base | 6 projects GREEN and SAME |
| MV's byte check (Z = 1…118, NR and ZORA·MV) | identical: base = before = after |
| EQ_WGSL string equality | identical (`43071db7…`) |
| the F2 restored-MORPH probe | 8/8 GREEN |

## CLAUDE.md
One sentence changed where a law's wording moved: the cursor witness is now `orbitals.state().cursor` ({ k, row, lead }; its lit lines are `row`
while it leads — iteration 010 X6). No other law's words changed. The width law, the letters and the shell count say what they said; they are
now spoken once.

## Commits (on `it010-deletion`, one item each)
- `bee5cb6` item 1
- `3ec3055` item 2
- `9c67fa8` item 3
- `8522aab` item 4
- `50b270b` item 5
- `fc0173e` item 6
- `647f6df` item 7
- `96c89d5` item 8
- then the comment trims, `sw.js` and this note.

## For the integrator
- Merge with Yan's recipe: `--ours lab/sw.js`, then `pwa --write`.
- `field.js` moved (the EQ_WGSL template and EQ_F's layout only, not the mode upload), so run THE LOCK ×2. Expect 843/0 and 987/0, because the
  shader string is identical.
- Seams that may conflict textually with X1:
  - `rack.js` line 16 gained `import { L_LETTERS } from './names.js';`;
  - `rack.js` :881's COPY text reads `L_LETTERS[e.l[k]]`;
  - `field.js` :15 imports `NMAX`.

  None of these is X1's code.
- For Josh: none of the review's open questions were taken (C5's STATES repaint while MORPH is off stays as it was).
