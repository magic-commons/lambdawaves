# λWAVES · thermo-nuclear code-quality review · `033424d..e64b372` (iteration 009 as merged)

Reviewer: Opus 5.5 (row X5), read-only worktree at `43d1e44` (its `lab/` is `e64b372`'s; the one later commit is 010's PLAN). Scope: `lab/`
(never `lab/mir/**`, a library here), `tools/`, `tests/`. Pictures, build notes and demo JSON are out of scope. Skill applied:
`research/iteration-007/skills/cursor/thermo-nuclear-code-quality-review.SKILL.md`. No browser suite and no LOCK were run. Two node
measures were run: `node tools/rack-deps.mjs --classes --no-write` (HOLDS: spectrum 25/25, persist 24, notebook 23, facade 21, molecules 15;
G-A 30 keys, the largest 70) and the line/branch counts below.

Each finding is labelled **DELETION** (lines go, nothing added), **MOVE** (the same code, in its canonical home) or **DEEPENING** (a small
module takes a law that is now spread out), with a size **S / M / L**, so the deletion pass can be briefed straight from this list.

## Verdict

**Approvable after a short deletion pass.** This is a cleaner range than 007 + 008. The five rows add **+80 lines and +9.1 KB to lab JS**
(32,205 → 32,285 lines; 2,769,526 → 2,778,641 bytes) and **+10 net branches** (`if (` and `? `: +47 / −37). No file crosses 1,000 lines,
and no row adds a mode, a switch, an `app` slot, a saved id or a gate script. D and MV are one-concept changes, each in its canonical
layer. F2 is a deletion row that did what it said. N7 *removed* a special case (A7's n ≤ 6 gate in the Sturmian blocks and the BOX
packet).

The regressions follow Yan's 008 pattern: they sit at the merge seams and in what the hand edits show.
- **The same law, written twice in parallel.** DEMOS and N7 both met A7's rule "an n ≤ 6 file's bytes never move". Each wrote its own
  narrowing, one in a seat accessor (`persist.js` `shellSeat`) and one in the equalizer's `serialize`. That makes **six idioms** for one law,
  and DEMOS' version left **a getter that can hand the modulator a NaN base** (finding 1).
- **Hand edits that show a missing canonical layer.** To take n = 7 through the app, N7 edited the l-letter table in five files (one was a
  real bug: `7i0` → `7undefined0`), the shell count in the WGSL, the uniform's size and offsets, three CSS sizes, and the words "140" and
  "a/7" in seven strings. `names.js` already owns the letters and `hydrogen.js` already owns `NMAX`; the copies bypass them (findings 2, 3).

About **25 lines, ~10 branches and ~30 hand-kept literals** can go without changing behaviour. One latent bug is fixed in one token.
None of it needs new machinery; finding 1 adds one small pair of functions and deletes six idioms.

## Measurements

| file | before | after | Δ | row | note |
|---|---:|---:|---:|---|---|
| `lab/atoms.js` | 666 | 694 | +28 | MV | 22 of them header prose (the derivation); code +8 |
| `lab/equalizer.js` | 82 | 98 | +16 | N7 | D × D solve, 7 × 7 layout, `gammaAbs2` |
| `lab/paint-stroke.js` | 86 | 98 | +12 | F2 | `levelLine` moved in (spectrum.js −7) |
| `lab/projects.js` | 344 | 353 | +9 | DEMOS | the rename loop |
| `lab/orbitalsview.js` | 645 | 653 | +8 | D, F2 | whole-row cursor, `marks`, `levelLine` |
| `lab/shell/persist.js` | 323 | 327 | +4 | DEMOS | `shellSeat` special case |
| `lab/sturmian.js` · `sturmianreg.js` · `well.js` | | | +4 | N7 | N6 gates **deleted**; header prose |
| `lab/spectrum.js` | 425 | 418 | −7 | F2 | `levelLine` and the `words` mode left |
| `lab/field.js` | 2,019 | 2,019 | 0 | N7 | EQ_WGSL 6 → 7, `EQ_F` 76 → 104 |
| every other lab file | | | 0 to +3 | | words "91" → "140", letters, comments |

`lab/demos/`: −10 demos, −11 covers (≈ −8.6k JSON lines). `tests/fixtures/retired-demos/`: +4 files (4,903 lines, byte-for-byte the shipped
files, needed by the older-store proof). Tests: N7 adds Q9 (sturmian) and two equalizer rows; DEMOS re-aims `molecule-demos` rather than
retiring it. Both are inside Josh's lean-build dial: no new test file and no new gate.

---

## Ranked findings (by the simplification they buy)

### 1. A7's width law is now written six ways, two of them by 009's two parallel rows, and one carries a NaN · DEEPENING **M** (the getter fix alone: **S**)
**Where:**
- **The law:** a register record is written 91 wide while its n = 7 tail is at its identity (rates 1, stores 0, equalizer gains 1), so an
  n ≤ 6 file's bytes never move. It is A7's law.
- **DEMOS** (`lab/shell/persist.js:21-25`) wrote it as a special case inside a seat accessor's setter:
  `if (sh[0].index >= R.length) { if (x === 1) return; for (…) R[i] = 1; }`.
- **N7** (`lab/equalizer.js:63`) wrote it again for shells: `gains.slice(0, eq.gains[6] === 1 ? 6 : EQ_SHELLS)`.
- **Inherited from A7:**
  - `persist.js:66` narrows rates: `rates.subarray(91).every(v => v === 1) ? rates.subarray(0, 91) : rates`;
  - `persist.js:255` pads them: `if (pr.rates.length === 91) rates.fill(1, 91)`;
  - `lab/windows/state.js:46` `cut` and `:49` `take` / `pad` do the same for the A/B stores with 0;
  - `lab/statelink.js:379, :386` do it for a link's rates.
- **The literal `91`** appears 5 times in `persist.js` and 4 times in `windows/state.js`, although `hydrogen.js:27` exports `N6`
  (statelink uses it).
- **The latent bug.** The getter beside DEMOS' setter is `get v() { return R[BASIS.findIndex((s) => s.n === n)]; }` (`persist.js:21`).
  - Before 009 the setter always widened a 91-wide record, so the getter read 1.
  - Since DEMOS the setter leaves the record narrow when the base is 1.
  - An undo row's restore reads the seat back: `persist.js:294`, `(s[3] || Number)(s[0][s[1]])`.
  - So a project with `shell.rate.n7` routed, whose n = 7 output is exactly 1 at the snapshot (a route at depth 0, a macro at 0), writes
    `Number(undefined)` = **NaN** into `R.setBase`. The kit's clamp passes NaN (`lab/mir/modulation/registry.js:109, :233, :333`).
  - This is reasoned from the code. It was not reproduced in a browser.

**Code-judo move:**
- Put **one pair beside `N6` in `lab/hydrogen.js`**:
  - `narrow(arr, id, short = N6)` returns the first `short` entries while the tail is all `id`, and the whole array otherwise;
  - `widen(arr, id, full = BASIS.length)` pads with `id`.
- The equalizer calls the same pair with `(6, 7)`.
- `shellSeat`'s getter reads `R[i] ?? 1`. Its setter widens through `widen` only when `x !== 1`.

**Deletes:**
- six hand-written idioms (two of them 009's) and nine literals;
- the special case inside a seat accessor;
- the NaN.

**Risk / guards:**
- The bytes are identical by construction. Prove it with `tools/serialize-bytes.mjs` on both trees and `node tools/new-project.mjs --check`.
- `tests/project-formats.test.mjs` (the retired-demo 91-wide files);
- `tests/history.browser-test.mjs` (undo through a routed shell rate);
- the statelink tests (a link's REGISTER section is a byte format: keep its binary layout and touch only the `rates` arrays).

**First, on its own:** the getter's `?? 1` is a one-token fix. Land it in the deletion pass even if the pair waits.

### 2. The l-letter table bypasses `names.js`: 13 copies in 8 files, and N7's bug came from one of them · DELETION **S**
**Where:**
- **The owner.** `lab/names.js:430` owns the letters (`const L = 'spdfghik'`, private) and `atomForms` (`:432`), "one n l m name, four
  forms".
- **The importers.** `hydrogen.js:23`, `central.js:7` and `hamiltonian.js:13` already import `atomForms`.
- **The copies.** Each keeps its own `'spdfghi'`:
  - `central.js:51`;
  - `hamiltonian.js:49, :66`;
  - `lab/windows/spectrum.js:287, :298, :322` (the first two rebuild `atomForms`' plain form by hand, minus n);
  - `lab/rack.js:881` (the COPY text);
  - `lab/radiation.js:61` (the `BY_NAME` key).
- `atoms.js:106` and `atomsview.js:25` each keep a fourth `'spdfgh'`.
- N7 edited five of these by hand. The one it caught was a real bug: `radiation.js` resolved `7i0` to `7undefined0`.

**Code-judo move:**
- Export the letters from `names.js` (e.g. `export const L_LETTERS = 'spdfghik'`).
- `windows/spectrum.js:287, :298` call `atomForms(…).plain` without n, or use the letters.
- Every other copy imports `L_LETTERS`.

**Deletes:** 12 private tables. The next shell, or l = 7's `k` (names.js already skips `j`), becomes one edit.

**Risk:** none on pixels.
- `radiation.js`' `BY_NAME` keys and the COPY text keep the same characters.
- `./test.sh node` (the hydrogen, radiation and names rows).

### 3. The shell count is re-spelled down the equalizer's road, and "140" and "a/7" are typed by hand · MOVE **S**
**Where:**
- **Equalizer.**
  - `lab/equalizer.js:14` `EQ_SHELLS = 7` fails the deletion test: it is `NMAX` (`hydrogen.js:25`) under another name.
  - `:69` is a gate its own comment calls "never reached" (BASIS stops at n = 7).
  - `:63` and `:73` keep a bare `6` and `7`.
- **Kernel.**
  - `lab/field.js:176-184` (EQ_WGSL) spells the count as `array<vec4<f32>, 25>`, `array<vec2<f32>, 7>`, `6u`, `7u` twice and `i * 7u`.
  - `:1223` sizes `EQ_F` at `104`, and `:1240` writes κ, mode and floor at the bare offsets `100 / 101 / 102`.
- **CSS.**
  - `lab/skin.css:633, :635, :636` say `152px` three times and `repeat(7, …)`;
  - `windows/spectrum.js:150` falls back to `|| 152`.
- **Words.**
  - `lab/windows/kepler.js:54` and `:261` are **the same GAS readout line twice** (`r.captured` against `P.captured`); N7 edited `a/6 → a/7` in both;
  - `badges.js:77`, `windows/spectrum.js:48, :78, :213, :324` and `statesview.js:427` type "140" or "n ≤ 7";
  - `eq-audio.js:13-14` spell "n 5–7" beside the `BAND` table that decides it.

**Code-judo move:**
- `EQ_SHELLS = NMAX`, or import `NMAX`.
- EQ_WGSL is built from it: `field.js` already imports `hydrogen.js` (`:15`).
- The uniform's size and offsets are computed: `G = 2·N²`, padded to a multiple of 4, then κ, mode and floor.
- Delete `:69`.
- One CSS custom property `--eq-size` holds the grid's size.
- One `gasSay(captured, σ, x0, k)` serves both kepler roads.
- The words read `BASIS.length` / `NMAX`.

**THE LOCK:** EQ_WGSL is derived from COMPUTE_WGSL at boot and THE LOCK never runs the equalizer (`field.js:170-174`; N7-BUILD). A
template that yields the **same string** moves no locked byte. Check it with one string-equality assertion against today's text. Because
`field.js` moved, the merge recipe still runs THE LOCK ×2; expect 843/0 and 987/0.

**Overlap:** iteration 010's row **X2** ("every other range, fold or readout that still stops at six shells") will meet these same strings.
Brief X2 to land this first, or to take it.

### 4. MV's exchange branch duplicates the V_x line, and the model's words are typed in three files · DELETION **S** + MOVE **S**
**Where:**
- **The duplicated lines.**
  - `lab/atoms.js:421-422`: two loops differ only by the factor `mvR(MV_K·c3)`.
  - `:439`: a third loop applies Φ to the energy density the line above just filled.
- **The words.** `atoms.js:163` exports `RELATIVITY = ' · scalar ZORA · MV'`, and `modelName` (`:165`) carries Sol's model-identity rule
  ("the model string travels with every number"). The same words are still typed by hand in:
  - `lab/status.js:27-28` ("scalar-relativistic (ZORA · MV) Xα"; "scalar ZORA, MacDonald–Vosko exchange");
  - `lab/atomsview.js:70, :76, :115, :161` ("ZORA · MV", "ε_ZORA·MV − ε_NR" twice).
  - MV edited seven strings in three files to rename one model.

**Code-judo move:**
- `const xR = o.zora ? (c) => mvR(MV_K * c) : () => 1` and `xPhi` alike, giving one V_x loop and the Φ inside the E_x loop.
- `k13 * c3 * 1` is `k13 * c3` exactly in IEEE arithmetic (`× 1` is exact, evaluation is left to right), so **the non-relativistic road
  stays byte-identical**.
- Export one short form beside `RELATIVITY` (e.g. `RELATIVITY_SHORT = 'ZORA · MV'`) and read it in `status.js` and `atomsview.js`.

**Deletes:** one loop, one branch, five hand-typed copies of the model's name.

**Risk:**
- `tests/atoms.test.mjs` (29 gates) and `tests/status.test.mjs` (the 110-character budget).
- MV-BUILD proved the NR road's identity with a sha-256 of every u for Z = 1…118. That script lives in `.tmp/mv/` and is not committed.
  The pass must re-run it, or an equivalent, before claiming identity.

### 5. `seed()`'s rename is a kit workaround with a brittle guard, and the rename made the adoption branch dead · DELETION **S** + a FOR-MIR line
**Where:**
- **The workaround.** `lab/projects.js:344-347` renames a refreshed starter, because `files.refresh` keeps an entry's name
  (`lab/mir/folders/seed.js:47-50`).
- **The brittle guard.** `!e.name.startsWith(s.name)` (`:346`) blocks the "… 2" case, but it also blocks every rename to a *prefix* of the
  current name. The likeliest next rename is WAVE DANCER PROTOTYPE → WAVE DANCER, when Josh's new demos land, and that one would
  silently never happen.
- **Not filed with the kit.** `docs/FOR-MIR.md`, which 009 created, does not list "a refresh carries the starter's name". CLAUDE.md
  says a kit need is a MIR issue.
- **The dead branch.** The adoption branch (`projects.js:329-334`, and its doc lines `:318-319`) looks for an older build's copy at
  `DEMOS/WAVE DANCER PROTOTYPE`, a path no older build ever stored (they stored `DEMOS/WAVE DANCER`). For the only starter it can now fire
  only on a reader's *own* project of that exact name, and there it drops the starter.

**Code-judo move:**
- The guard becomes the literal condition: rename when `e.name !== s.name` and `!entryAt(s.folder + '/' + s.name)` (the name is free).
- Delete the adoption branch.
- Add the kit line to `docs/FOR-MIR.md`. When MIR carries it, the loop goes too.

**Deletes:** about 6 lines, one magic heuristic and one dead road.

**Risk:**
- `tests/molecule-demos.browser-test.mjs` (re-aimed by DEMOS: the rename in an older store, the deleted demos opening from it);
- `tests/project-formats.test.mjs`.

### 6. The byte probes lost their molecule readings · MOVE **S**
**Where:**
- `tools/serialize-bytes.mjs:19` and `tools/settings-probe.mjs:23` (and `tools/camera-routes.mjs:20`) read one hydrogen demo and NEW.
- Before 009 they also read WATER, BENZENE and N₂, the only molecule projects in the byte law's two-tree probe.
- The files still exist as `tests/fixtures/retired-demos/{water,n2,helium}.lambdawaves.json`. The probes' own road is already "fetch the
  file, `projects.importText`, `projects.open`".
- `tools/catalogue-table.mjs:58` keeps a parallel `demos` table keyed by file id.

**Move:**
- The probes read `STARTERS` (`lab/project-store.js`) plus the three fixtures.
- `catalogue-table` takes the names from `STARTERS`.

When Josh's new demos come, no tool is edited. There is no new gate: the probes read more of what exists.

**Risk:** none. The probes are tools; run each once on both trees.

### 7. `register-morph.js` writes `on` in three places and re-paints by hand at each · DELETION **S**
**Where:**
- `lab/register-morph.js:40-41` (`set`), `:47` (`reset`) and `:50-51` (`load`) each write `on`, call `morphSw.set` and toggle
  `.reg-morphing`.
- F2's bug was exactly a road that wrote `on` without the class. F2 fixed the road; it did not remove the shape that allowed it.

**Code-judo move:** add a private `show(v) { on = v; morphSw.set(v); o.rows().classList.toggle('reg-morphing', v); }` and call it from all
three.

**Deletes:** two repeated pairs. "The class follows `on`" becomes true by construction.

**Risk:** `register` 22/22, `orbitals` 24/24, and F2's restored-MORPH probe (`research/iteration-009/f2-shots/probe.mjs`).

### 8. Small and certain
- **`orbitalsview.js:504` · DELETION S.**
  - `marks.lit` is `lead ? rowKs : []`, derivable from `row` and `lead`. `:648` deep-copies three fields of it on every `state()`.
  - No committed test reads `orbitals.state().cursor`; D's probe was `.tmp/`. CLAUDE.md names the shape `{ k, row, lit, lead }`.
  - Either one existing `orbitals` browser row reads it, or `lit` goes, with the CLAUDE.md words.
- **`paint-stroke.js:94` `levelLine(…, on, off, …)` · DELETION S (optional).**
  - The "on = null means off" convention serves one caller: ORBITAL (`orbitalsview.js:489`) and STATES (`statesview.js:633`) pass the same
    colour twice.
  - `(rgb, lit)` reads directly, and SPECTRUM passes `lit ? c : INK` (`spectrum.js:311`).
  - Pixels are identical.
- **`equalizer.js:54` · MOVE S.** `coherence()` repeats `gammaAbs2`'s index arithmetic (`:16`). Share an index helper and keep `Math.hypot`
  (N7: `coherence` stays bit-identical).
- **`equalizer.js:69` · DELETION S.** Delete the never-reached gate (finding 3).

### 9. Inherited files past 1k: where decomposition pays (009 added nothing to any of them)
Ranked by size × churn since 10-10, discounted by THE LOCK's cost:

| file | lines | bytes | lines > 400 ch | commits since 10-10 | 009 Δ | verdict |
|---|---:|---:|---:|---:|---:|---|
| `lab/chemview.js` | 1,531 | 160 KB | 7 | 48 | 0 | **first.** No LOCK cost. Seams: the ORBITAL step road, the shelf / download road (the install loop already left for `library.js keepSection`), the head and rows (Yan's C8). **L** |
| `lab/rack.js` | 972 | 98 KB | 6 | **72** | 0 | **second.** Under 1k lines but the busiest file. The app literal must not grow, so the pay-off is boot's long one-liners leaving for their shell modules (e.g. `:881`'s COPY text beside SPECTRUM), watched by the HINGE. **M** |
| `lab/field.js` | 2,019 | 159 KB | 0 | 21 | 0 | **third, and narrowly.** Every move costs THE LOCK ×2. The pixel-free cut is the equalizer pipeline (`:170-189`, `:1222-1242`, `setEqualizer` `:1948`, ≈ 45 lines → an `eq-kernel.js`), because THE LOCK never runs it; it pairs with finding 3. **S**. The rest waits for a reason. |
| `lab/render-exact.js` | 926 | 81 KB | 11 | 1 | 0 | leave: cold. |

No split is demanded of 009.

---

## Clean: do not touch
- **D · THE PAIR.** One rule changed (`lead && lv.k === kc` → `lead && i === curRow`, `orbitalsview.js:487`). It reuses the ladder's own
  `rowsOf()` grouping, so there is no second degeneracy rule.
- **F2 · the three leftovers.**
  - It deleted `fillButton`'s `words` mode and ORBITAL's two hand copies of the dim class.
  - It moved `levelLine` to the module that holds the paint law.
  - The net effect is a row of deletions. Yan's C1 is now closed.
- **MV.**
  - No switch, no option and no UI machinery: the factor rides the existing `zora` road.
  - The derivation and Janak's check are in the header.
  - The non-relativistic road is byte-identical (finding 4 keeps it so).
- **N7's physics rows.** `sturmian.js`, `sturmianreg.js` and `well.js` **lost** A7's `N6` gates. This is the rare row that deletes a special
  case to extend a feature. THE LOCK's moved leaves were re-captured by name, 39 + 39, with no others.
- **N7's equalizer D × D solve** (`equalizer.js:73`). Solving over the shells in play is semantic, not a hack. A 7 × 7 table with an empty
  n = 7 would carry a row-7 jitter into λ, PURITY and the repair, and the identity padding beyond D is what the kernel multiplies by
  acc₇ = 0.
- **DEMOS.** Ten demos and their covers went. `molecule-demos` was re-aimed under its own laws rather than retired. The FILE id and seedId
  were kept.

## The deletion pass (row F-style brief, in this order)
1. **Finding 1's getter**, `?? 1` (S, fix). Then **finding 1's pair** in `hydrogen.js` (M, DEEPENING).
2. **Finding 2**, the l-letters from `names.js` (S, DELETION).
3. **Finding 7**, `show(v)` in `register-morph.js` (S, DELETION).
4. **Finding 4**, the exchange factor and the model's short words (S, DELETION + MOVE). Re-run MV's NR identity check first.
5. **Finding 5**, the rename guard, the dead adoption branch and the FOR-MIR line (S, DELETION).
6. **Finding 8**, the small items (S).
7. **Finding 3**, the shell count (S, MOVE). Coordinate with X2, and run THE LOCK ×2 because `field.js` moves.
8. **Finding 6**, the probes read `STARTERS` and the retired fixtures (S, MOVE).

Not in the pass: finding 9's decompositions (their own rows, chemview.js first).
