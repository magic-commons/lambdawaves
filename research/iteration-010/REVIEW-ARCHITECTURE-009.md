# Architecture review · λWAVES · iteration 009

Range `033424d..e64b372` (17 commits; rows D · F2 · MV · DEMOS · N7, merged by Sos). Opus reviewer (row X5), 2026-10-19, read-only worktree
at `43d1e44` (lab identical to `e64b372`). Process: improve-codebase-architecture with the direction named by the brief (the seams 009 touched);
vocabulary from codebase-design (module · interface · implementation · depth · seam · adapter · leverage · locality; the deletion test).
The repo's CLAUDE.md stands in for GLOSSARY.md and docs/adr/; its laws are not re-litigated: `lab/mir/**` is a library, the `app` literal in
`lab/rack.js` is never extended, rack-deps HINGE ≤ 25, THE LOCK fixes the rendered bytes, saved ids and project bytes are law
(docs/STATE-SCOPES.md). Each card says how it stays inside them. No browser suite and no LOCK were run. One node measure:
`node tools/rack-deps.mjs --classes --no-write` → **HOLDS**: spectrum 25 / 25, persist 24, notebook 23, facade 21, molecules 15, keys 14,
readouts 13, modulation 12; G-A 30 keys, the largest 70; bare writes 0.

Josh's standing rule ("never add machinery to go faster; remove / merge / simplify") orders the list: deepening that deletes ranks above
deepening that adds a verb. Each card also carries the deletion pass's labels: kind (DELETION · MOVE · DEEPENING) and size (S · M · L).

Legend for the text diagrams: `[ box ]` module · `- - -` seam · `~~>` leakage · `[[ box ]]` deep module.

---

## Yan's scan (iteration 008), after 009

| Yan's candidate | at `e64b372` |
|---|---|
| C1 · one ladder law | **Resolved** (008 F + 009 F2). `paintStroke` fires `onEnd` on a counted change; `fillButton` has one glyph; `levelLine` lives in `paint-stroke.js` and all three ladders draw it. Residual: SPECTRUM's `pointerenter → fillSync` resync stays (`spectrum.js:63`; a folded card skips `rebuild()`). |
| C2 · one A ↔ B morph | **Resolved** by 008 F (`lab/register-morph.js`); F2 put the dim class inside it. Residual: the panes' modulator roads still differ (`orbitalsview.js:636` repaints iff MORPH plays; `statesview.js:793` always touches) → **C5** here. |
| C3 · the register owns its ON | **Resolved** by 008 F (Q1). |
| C4 · the valence subshell once | **Open, Josh's call** (F left it: Fe's tile still 3d, its press 4s). 009 did not touch it. |
| C5 · one section install | **Resolved** by 008 F (`library.js keepSection`). |
| C6 · MARKS into the INFORMATIONAL record | **Resolved** by 008 F. |
| C7 · a target declared by its window | **Not taken.** 009 added no target, so the spread did not grow. |
| C8 · MOLECULES' rows as a list | **Not taken.** 009 did not touch `chemview.js`. |

The 008 seams held. 009's friction lies elsewhere: in the **register's width** that A7 opened and N7 carried through the app, and in the
two rows that met it in parallel.

---

## C1 · One width law: a record narrows to the 91 while its n = 7 tail is at identity
**Strong** · in-process · DEEPENING **M** (deletes six idioms; the seat's getter fix alone is S)

**Files:** `lab/hydrogen.js` (`N6` :27), `lab/shell/persist.js` (21-25, 66, 255, 294), `lab/windows/state.js` (46, 49), `lab/equalizer.js` (63),
`lab/statelink.js` (379, 386)

```
BEFORE  (one law — "an n ≤ 6 file's bytes never move" — written six ways)

 [ persist.js ]                         [ windows/state.js ]           [ equalizer.js ]           [ statelink.js ]
   :66   rates.subarray(91)…every 1        :46 cut: re/im 91 while 0     :63 gains[6] === 1 ? 6     :379 rates 91 → pad 1
   :255  rates.fill(1, 91)                 :49 take/pad 91 → W              (N7, 009)              :386 wide = off ≥ N6
   :21   shellSeat get v → R[91]  ~~> undefined on a narrow record
   :23   shellSeat set v: if index ≥ length { if x === 1 return; pad }   (DEMOS, 009)
   :294  undo: Number(get v)  ~~> NaN → R.setBase  (kit clamp passes NaN)

AFTER

 [[ hydrogen.js · the register's width ]]   N6 · NMAX · narrow(arr, id, short = N6) · widen(arr, id, full = N)
        ^            ^             ^              ^                 ^
   persist write  persist read  state.js stores  equalizer (6 of 7)  shellSeat (get reads widen's identity)
```

- **Problem:** A7's width law lives in four modules as six hand-written idioms. Iteration 009's two parallel rows each added one: DEMOS as a
  special case inside a seat accessor, N7 in the equalizer's `serialize`. The seat's getter now disagrees with its setter: an undo through a
  routed `shell.rate.n7` whose output is exactly 1 reads `undefined` and hands the modulator a NaN base (reasoned from the code, not
  reproduced).
- **Solution:** `hydrogen.js`, which already owns `N6` and `NMAX`, owns the law as one `narrow` / `widen` pair. Every record site and the
  seat call it, and the equalizer calls it at shell width.
- **Wins:**
  - Delete six width idioms
  - Delete nine literal `91`s
  - Getter and setter agree
  - `project-formats.test` reaches it in node
  - locality: the width law in one place
- **Inside the laws:** the saved bytes are identical by construction (gate: `tools/serialize-bytes.mjs` on both trees,
  `node tools/new-project.mjs --check`). `statelink.js`'s binary REGISTER section (the REG7 byte law) is untouched; only its `rates` arrays
  call `widen`. `hydrogen.js` is a leaf import, so persist stays at 24 crossings. No slot, no facade member, no saved id.

**Grilling**
1. *Do the equalizer's shells (6 of 7) and the labels (91 of 140) share one module?* Yes. The sentence is the same law, so one function
   takes the width as its argument.
2. *On a narrow record, should the seat widen on an n = 7 write other than 1, or refuse it?* Widen. That is today's behaviour, and the
   undo row must hold the write.
3. *Should statelink's sparse and dense sections join?* No. They are a byte format with its own versioning (A7's REG7). Only the arrays
   join.

---

## C2 · The register's size is spoken once
**Strong** · in-process · DELETION **S** (the letters) + MOVE **S** (the shell count, the words)

**Files:** `lab/names.js` (430-432), `lab/hydrogen.js` (25), `lab/equalizer.js` (14, 63, 69, 73), `lab/field.js` (176-184, 1223, 1240),
`lab/skin.css` (633-636), `lab/windows/spectrum.js` (48, 78, 150, 213, 287, 298, 322, 324), `lab/rack.js` (881), `lab/radiation.js` (61),
`lab/central.js` (51), `lab/hamiltonian.js` (49, 66), `lab/windows/kepler.js` (54, 261), `lab/badges.js` (77), `lab/eq-audio.js` (13-14)

```
BEFORE  (N7's hand edits to say "seven")                    AFTER

 names.js     L = 'spdfghik' (private) · atomForms            [[ names.js ]]    L_LETTERS · atomForms
 + 12 copies 'spdfghi' / 'spdfgh' in 8 files                         ^  12 sites import
   radiation.js:61 ~~> '7undefined0' (the bug N7 found)
 hydrogen.js  NMAX = 7                                        [[ hydrogen.js ]] NMAX · N6 · BASIS.length
 equalizer.js EQ_SHELLS = 7   (an alias)                             ^
 field.js     EQ_WGSL: 25 · 7 · 6u · 7u · 7u · 104 · 100/101/102     |  equalizer, EQ_WGSL, EQ_F, eq CSS var,
 skin.css     152px ×3 · repeat(7)                                   |  the readout words
 words        "140" ×5 · "n ≤ 7" · "a/7" ×2 · "n 5–7" ×2
```

- **Problem:** the register's size already has owners: `NMAX` and `BASIS` in `hydrogen.js`, and the letters and `atomForms` in `names.js`.
  To carry n = 7 through the app, N7 still had to hand-edit about 25 places, and one of the copies was a live bug.
- **Solution:** the copies import what the owners already know. `names.js` exports its letters. The equalizer, its kernel and its uniform
  layout derive from `NMAX`, and the words are templated from `BASIS.length` and `NMAX`.
- **Wins:**
  - Delete 12 letter tables
  - `EQ_SHELLS` stops being an alias
  - Delete the never-reached n > 7 gate
  - leverage: one constant, ~25 sites
  - X2 starts from one road
- **Inside the laws:** EQ_WGSL is derived from COMPUTE_WGSL, and THE LOCK never runs the equalizer, so a template that yields **the same
  string** moves no locked byte. Assert string equality once in the pass. `field.js` moves, so the recipe still runs THE LOCK ×2 (expect
  843/0, 987/0). No saved key; the GAS seg's id `reg` stays, only its label is templated. The imports come from leaf modules, so rack-deps
  is unchanged and SPECTRUM stays 25 / 25.

**Grilling**
1. *Computed words ("140 labels") or literal ones?* Computed. The reader sees the same text, and the next width edit happens once.
2. *Template the equalizer's WGSL, or leave the shader literal?* Template it, with one string-equality check against today's text. The
   uniform's offsets (100 / 101 / 102) become `2·N²` rounded up to a vec4, and leaving them literal keeps the trap for the next width.
3. *Is this iteration 010's X2?* It overlaps. X2 ("every range, fold or readout that still stops at six shells") should land after it or
   take it as its first commit, so X2 does not re-spell the strings this deletes.

---

## C3 · The atom model's exchange is one factor with two adapters, and its name travels from `modelName`
**Worth exploring** · in-process · DELETION **S** (the duplicated loop) + MOVE **S** (the words)

**Files:** `lab/atoms.js` (163-168, 378-390, 418-441), `lab/status.js` (26-29), `lab/atomsview.js` (70, 76, 115, 161)

```
BEFORE                                                    AFTER

 scf()  if (!o.zora) loop V_x                               scf()  X = o.zora ? MV : PLAIN     (once per solve)
        else        loop V_x · mvR(β)     <- same line            loop V_x · X.R(β)            (PLAIN.R = 1: × 1 is exact)
        …                                                         loop E_x density · X.Φ(β)
        if (o.zora) loop t · mvPhi(β)     <- a third loop
 atoms.js   RELATIVITY ' · scalar ZORA · MV' · modelName     [[ atoms.js ]] RELATIVITY · RELATIVITY_SHORT · modelName
 status.js  "scalar-relativistic (ZORA · MV) Xα"  (typed)          ^                 ^
 atomsview  "ZORA · MV" · "ε_ZORA·MV − ε_NR" ×2 (typed)        status.js        atomsview.js
```

- **Problem:** the exchange choice is an inline `o.zora` test at two loops, plus a third loop for Φ, and the model's name is retyped in two
  modules beside the `modelName` that Sol's model-identity rule set up. MV edited seven strings in three files to rename one model.
- **Solution:** an exchange factor `{ R, Φ }` chosen once per solve, with two adapters: PLAIN (the non-relativistic road, which the
  RELATIVITY Δ readout and the oracles ship on) and MV. STATUS and ATOMS read one exported short name.
- **Wins:**
  - Two adapters: a real seam
  - Delete one loop and its branch
  - The model's name: one edit
  - `atoms.test` unchanged
- **Inside the laws:** `k13 · c3 · 1` equals `k13 · c3` in IEEE arithmetic, so the NR road stays byte-identical. MV-BUILD's sha check over
  Z = 1…118 lives in `.tmp/`, so the pass re-runs it. No picture moves (atoms are not in THE LOCK). STATUS keeps its 110-character budget.

**Grilling**
1. *A seam or a branch?* A seam: both adapters ship (PLAIN is the oracles' road and RELATIVITY Δ's second solve). By the skill's rule, two
   adapters make a real seam.
2. *Is it worth doing before spin–orbit?* Only the deletion half. Spin–orbit is a kinetic and label change (j = l ± ½), not an exchange
   change, so it will not use this seam. The seam earns its keep only if a correlation term (VWN, the model gap MV-BUILD measured) is ever
   added. Do the loop deletion now and the factor object then.
3. *Should STATUS read the full `modelName()`?* No. The line's budget is 110 characters; read the short form.

---

## C4 · The starters road: `STARTERS` is the one demo list, and the rename belongs to the kit
**Worth exploring** · local-substitutable (the FOLDERS store in localStorage; the tests use a fresh profile) · DELETION **S** + MOVE **S**

**Files:** `lab/project-store.js` (`STARTERS` :157-163), `lab/projects.js` (318-348), `tools/serialize-bytes.mjs` (19), `tools/settings-probe.mjs` (23),
`tools/camera-routes.mjs` (20), `tools/catalogue-table.mjs` (58), `docs/FOR-MIR.md`

```
BEFORE                                                        AFTER

 [ project-store.js ] STARTERS (one row)                       [[ project-store.js ]] STARTERS  <- every reader imports
 [ tools ] serialize-bytes · settings-probe · camera-routes        ^ tools (+ tests/fixtures/retired-demos as molecule readings)
           each retypes the list (molecule readings lost)          ^ catalogue-table (names)
 [ catalogue-table ] parallel demos table                    [ projects.js seed() ]
 [ projects.js seed() ]                                          rename iff e.name ≠ s.name and the name is free
   adoption road: entryAt('DEMOS/WAVE DANCER PROTOTYPE')         (adoption road deleted)
     ~~> a path no older build stored (dead)                 - - - - - - - - - - - - - - - - - - - (seam: the kit's seed/refresh)
   rename unless e.name.startsWith(s.name)                   [ MIR folders/seed.js ] refresh carries the starter's name (FOR-MIR)
     ~~> a rename to a prefix never lands
 [ MIR folders/seed.js ] refresh keeps the entry's name
```

- **Problem:** the demo list is declared once and retyped in three tools and a catalogue table, and the byte probes lost their only
  molecule projects when the ten demos went. `seed()` patches a kit behaviour with a prefix heuristic that would block the likely next
  rename (WAVE DANCER PROTOTYPE → WAVE DANCER). The rename also made the adoption road dead.
- **Solution:** every reader imports `STARTERS`, and the probes add the retired fixtures. The rename becomes the literal condition until
  the kit's refresh carries the name, which goes on the FOR-MIR list.
- **Wins:**
  - New demos: zero tool edits
  - Byte probes read a molecule again
  - Delete the dead adoption road
  - A heuristic becomes the literal condition
- **Inside the laws:** `lab/mir/**` is not edited (a FOR-MIR line). The seedId and the file id are unchanged. The probes are tools, not
  gates added. `molecule-demos.browser-test` (re-aimed by DEMOS) covers the rename.

**Grilling**
1. *Should `catalogue-table` read `STARTERS`?* For the names, yes. It keeps its own physics tag per file id (`['hydrogen', '0.5.0']`), which
   `STARTERS` does not carry.
2. *Is the rename the app's or the kit's?* The kit's: any MIR app that renames a shipped starter meets it. File it, and keep the app's loop
   (with the literal guard) until MIR ships it.
3. *Delete the adoption road now?* Yes. Its one remaining case, a reader's own project at exactly the starter's path, silently drops the
   starter.

---

## C5 · The morph owns its ON and its modulator road
**Worth exploring** · in-process · DELETION **S** · one behaviour question for Josh

**Files:** `lab/register-morph.js` (36-51), `lab/orbitalsview.js` (114-116, 636), `lab/statesview.js` (95-98, 177, 793)

```
BEFORE                                                  AFTER

 [ register-morph.js ]                                   [[ register-morph.js ]]
   set:   on = …; morphSw.set; rows.toggle                 show(v): on · switch · .reg-morphing   (one place)
   reset: on = false; morphSw.set; rows.remove             setValue(v): moved && on → o.changed()
   load:  on = …; morphSw.set; rows.toggle  (F2 added)          ^                         ^
 [ orbitalsview ] setMorphValue: repaint iff on          orbitals.setMorphValue = M.setValue   states.setMorphValue = M.setValue
 [ statesview ]   setMorphValue: touch() always
                    ~~> marks drive.dirty while MORPH is off
```

- **Problem:** the morph module owns the stores, the position, MORPH and their record, but `on` is painted in three hand-written places.
  F2's bug was the one that forgot the class. Each pane also still writes its own modulator road under a different repaint rule, which is
  Yan's C2 question 2, still open.
- **Solution:** the module paints `on` in one private place and owns what a modulator's write means: `changed()` only while MORPH plays.
  Both panes' `setMorphValue` become `M.setValue`.
- **Wins:**
  - The class follows `on` by construction
  - One modulator road, not two
  - Delete two pane bodies
  - locality: MORPH's law in one file
- **Inside the laws:** the saved ids `reg.morph` and `reg.omorph` stay (ADR-0002). `__LW.states.morph` and `__LW.orbitals.save().morph`
  keep their members. Leaf modules only.

**Grilling**
1. *Should a modulator's write repaint STATES while MORPH is off?* Recommended no, as Yan said: the picture follows only while MORPH plays.
   Today STATES' `touch()` also sets `drive.dirty` (`statesview.js:177`), so an LFO on A ↔ B restarts a running drive even with MORPH off.
   This is Josh's call, because it changes what a performer hears.
2. *Does `show(v)` join the interface?* No. It is internal; the interface stays `set` / `load` / `reset`.
3. *Which tests survive?* `register` 22/22, `orbitals` 24/24, and F2's restored-MORPH probe. They test through the panes, so nothing is
   rewritten.

---

## Noted, not carded
- **N7's find, the anchor-only draw** (`rack.js modesAt` / `renderSet()`): the field draws the labels populated at the anchor while THE
  SCALE's propagator spreads c(t) across each (l, m) block. The seam is between the Register's propagator and the frame's mode set. The
  propagator should say its own support. This is already iteration 010's **X1**, with THE LOCK moving by name.
- **`orbitals.state().cursor`** (D): a witness CLAUDE.md names but no committed test reads. Its `lit` is derivable from `row` and `lead`.
  Either one `orbitals` row reads it, or `lit` goes (quality finding 8).
- **`levelLine`'s interface** (`paint-stroke.js:94`, `on, off` with null for off) serves one caller's difference. `(rgb, lit)` is a
  narrower interface with the same pixels. Speculative.
- **SPECTRUM is still at 25 / 25.** N7 edited `windows/spectrum.js` in eleven places and added no crossing. The next SPECTRUM feature must
  shed one first.
- **Kit issue to file with MIR:** "a starter's refresh carries its name" (C4).
- **Inherited files past 1k** (quality finding 9): `chemview.js` first (no LOCK cost, highest size × churn), `rack.js`'s boot one-liners
  second, and only the equalizer pipeline out of `field.js`.

## Top recommendation
**C1 · One width law.** It is where 009's two parallel rows met the same law and wrote it two new ways at the merge seam. The pair gives the
law a home its six idioms lack, and it closes a NaN path with a one-token fix that can land first. It is in-process, behind existing byte
gates, and moves no saved byte, slot or pixel. Then **C2**, before X2 builds, so the reach of n = 7 starts from one road. Then C4 (before
Josh's new demos arrive), C5 (with Josh's one answer) and C3 (the loop now, the factor object when a functional asks for it).
