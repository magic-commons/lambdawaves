# Architecture review · λWAVES · iterations 007–008

Range `c73c5c0..34f70c7` (42 commits; rows B · I · M · O, then U · W · S · K · A · P and the el- pictures). Opus reviewer, 2026-10-19,
worktree reset to `34f70c7`, read-only on source. Process: improve-codebase-architecture with the direction named; vocabulary from
codebase-design (module · interface · depth · seam · adapter · leverage · locality; the deletion test). The repo's CLAUDE.md stands in for
GLOSSARY.md and docs/adr/; its laws (THE CONTEXT's fixed-shape `app`, rack-deps' ≤ 25 crossings, THE READ LAW, the multi-seat shape) are
not re-litigated. Each card says how it stays inside them. No browser suite was run (the RTX is shared). One node measure was run:
`node tools/rack-deps.mjs --classes --no-write` (HOLDS; spectrum 25/25, persist 24, notebook 23, molecules 15, modulation 12,
stage-words 7, staticfield 1).

Josh's standing rule ("never add machinery to go faster; remove/merge/simplify") orders the list: deepening that deletes is ranked above
deepening that adds a verb or a layer.

Legend for the text diagrams: `[ box ]` module · `- - -` seam · `~~>` leakage · `[[ box ]]` deep module.

---

## Sos's scan (research/iteration-007/architecture/), after the merges

| Sos candidate | status at `34f70c7` |
|---|---|
| 1 · A target is declared once, by its owning window (Strong) | **Not resolved.** Rows B and O added `reg.omorph` and `chem.orbital` the old way: a `defs` row, a `modSeats` row, window accessors, plus (for `chem.orbital`) a hot re-registration subscriber in `modulation.js` and a `modBase` adapter in `molecules.js`. The spread grew. Carried as **C7**. |
| 2 · The stage words are one deep module (Strong) | **Resolved by row I.** `stageText.say(kind, text)` over a closed `KINDS` table, `INFO_ROWS` as the one PREFERENCE record `lambdawaves.q0.info`, INFORMATIONAL built from the rows with the kit's `control()`, MOLECULES' `querySelector` into INFORMATIONAL gone, the blob's six keys lifted. Residual: the three MARKS stayed on the blob, carried as **C6**. |
| 3 · One A ↔ B morph module for both registers (Strong) | **Not resolved, and worse.** Row B extended only the ORBITAL copy (target, persistence), so the two copies now differ in save shape and modulator repaint. Carried as **C2**. |
| 4 · MOLECULES' layout is a declared row list (Worth exploring) | **Not taken.** M and U re-laid the card by moving lines (M: +16 / −11). Both re-lays were cheap. Carried as **C8**, now Speculative. |
| noted · THE HEAD's dead pass-through | **Superseded.** Row I brought THE HEAD back as the opt-in kind `head`; `headLand` is live code again. |
| noted · chemview's return object (~55 members) | **Grew.** U and O added `slots`, `view`, `delta`, `setDelta`, `span`, `stepOrbital`, `orbitalStep`, `clamped`. |
| noted · three A ↔ B's | **Still three** (`state.rabi`, `reg.morph`, `reg.omorph`). C2 merges the two register copies; TRANSITION stays apart. |

---

## C1 · One ladder law: the paint gesture owns the stroke's end, the level line and EMPTY ↔ FILL ALL
**Strong** · in-process · deletes

**Files:** `lab/paint-stroke.js`, `lab/spectrum.js`, `lab/orbitalsview.js`, `lab/statesview.js`

```
BEFORE (three parallel rows wrote one ruling three times)

 [ spectrum.js  (row S, A) ]      [ orbitalsview.js (row U) ]     [ statesview.js (row U) ]
   painted flag                     stroked counter                 stroked counter
   3 own pointerup/cancel/lost      onEnd -> norm()                 onEnd -> norm()
   levelLine: off α .42, 1/2 px     line: off α .26, 1.5/2.5 px     line: off α .26, w/w+1
   own FILL ALL (words)             fillButton (glyph, exported) <~~ imported from orbitalsview
            \                              |                              /
             - - - - - - - - paintStroke(surface, o)  (onEnd fires on any hit) - - - -

AFTER

 [[ paint-stroke.js · THE PAINT GESTURE ]]
    onEnd fires only when an apply reported a change
    levelLine(g, x0, x1, y, lit, ink, weight)      (one rule, one alpha)
    fillButton(row, titles, onPress)               (one two-state button)
        ^              ^               ^
   spectrum.js    orbitalsview.js   statesview.js   (each: at · across · apply · onEnd: settle)
```

- **Problem:** Josh's one paint law and his one "plain lines, dark when off, vivid when on" ruling are written three times by three
  parallel rows, and the copies have already drifted: three line weights and alphas (`spectrum.js:38`, `orbitalsview.js:510`,
  `statesview.js:653`), two FILL buttons (`spectrum.js:65–84` words; `orbitalsview.js:48` glyph, which `statesview.js:35` imports
  from a sibling pane), and two end-of-stroke roads (`spectrum.js:109–113` adds three pointer listeners and a `painted` flag beside
  `paintStroke`'s own `onEnd`, which `orbitalsview.js:560–569` and `statesview.js:675–680` each wrap with a `stroked` counter).
- **Solution:** `paint-stroke.js`, already "one law for every register ladder", becomes the module the three ladders lean on: `onEnd`
  fires only when an `apply` reported a change, and it holds the plain level line and the EMPTY ↔ FILL ALL button they share.
- **Wins:**
  - Delete three "did it paint" counters
  - Delete SPECTRUM's three pointer listeners
  - One line rule, one alpha
  - `fillButton` leaves a sibling pane
  - locality: the next ladder ruling is one edit
- **Inside the laws:** all four files are leaf modules (rack-deps measures `lab/shell` and `lab/windows` only); no `app` slot, no
  facade member, no saved key moves.

**The three questions a grilling would ask**
1. *Should SPECTRUM's button wear the register's glyph or keep its words?* — The glyph, with FILL ALL / EMPTY as its label and hover.
   S-BUILD decision 5 left it open ("Row U's Gemini glyphs can be shared at the merge if Josh wants one look"). Josh's call; the module
   carries one look.
2. *Can one line rule serve STATES, whose weight encodes oscillator strength?* — Yes: one rule for colour and alpha (off = the
   level's ink at one alpha, on = full vivid), and a weight argument that STATES keeps filling from its strength. The alpha to keep
   (0.42 SPECTRUM, 0.26 the panes) is one measurement on both themes.
3. *Does keying `onEnd` on `apply`'s return change what a stroke means?* — No. Today `s.hit` fires `onEnd` whenever keys passed under
   the pointer, and every caller re-checks its own counter. Returning the count from `apply` moves that check into the gesture. A tap on
   ORBITAL's folded core returns 0 and normalises nothing, as today.

---

## C2 · One A ↔ B morph for both register panes
**Strong** · in-process · deletes · carried from Sos C3

**Files:** `lab/orbitalsview.js` (119, 137–141, 275–285, 319, 628–639, 660–662), `lab/statesview.js` (59, 101–106, 283, 292–303,
780–790, 821–826), `lab/molecular-register.js` (`slerpCoefficients`, already shared)

```
BEFORE                                            AFTER

 [ orbitalsview.js ]      [ statesview.js ]        [[ morph · A ↔ B ]]  two stores · s · MORPH ·
   storeA storeB s on       storeA storeB s on        switch · knob · save/load · modulator road
   MORPH sw · A↔B knob      MORPH sw · A↔B knob             ^                      ^
   setMorph                 setMorph (+refresh)        orbitalsview           statesview
   setMorphValue:           setMorphValue:             (snapshot, repaint,    (snapshot, repaint,
     repaint iff MORPH on     touch() always            id reg.omorph)         id reg.morph)
   save: default-absent     save: always written
```

- **Problem:** the A ↔ B path is written twice, line for line, and row B extended only the ORBITAL copy, so the copies now differ in
  save shape (default-absent against always written) and in what a modulator's write does while MORPH is off (no repaint against a
  dirty mark).
- **Solution:** one morph module owns the two stores, the position, MORPH, its switch and A ↔ B knob, its save and load and its
  modulator road. Each pane hands it a snapshot of its register and a repaint, and keeps its own target id.
- **Wins:**
  - Delete one of two copies
  - One modulator road, one repaint law
  - One place for the store packing
  - tests: `molecular-register.test` reaches it
- **ADR:** keeps ADR-0002 (`reg.omorph` stays its own id). One module, two ids.
- **Inside the laws:** leaf modules; the `defs` rows and `modSeats` keys keep their ids; no slot, no facade move
  (`__LW.orbitals.save().morph` and `__LW.states.morph` keep their members).

**Grilling**
1. *Which save shape wins?* — Keep each pane's bytes in this change: the module writes default-absent, and STATES asks for
   always-written until a release that may move its bytes (then re-run `tools/new-project.mjs --check` and serialize-bytes).
2. *Should a modulator's write repaint while MORPH is off?* — No. Both copies claim "the picture follows only while MORPH plays";
   ORBITAL's road does exactly that, STATES' `touch()` is a wasted mark.
3. *Does the third A ↔ B (STATE's TRANSITION, `state.rabi`) join?* — No. It is the atom register's propagated mix
   (`reg.transition`), not a performance path between two stored snapshots.

---

## C3 · The register owns its ON; the panes offer only their claim
**Strong** · in-process · deletes

**Files:** `lab/registerview.js` (37–64), `lab/orbitalsview.js` (88–90, 336–353, 652), `lab/statesview.js` (89–91, 354–370, 814),
`lab/windows/molecules.js` (`one`, `createMoRegistry`)

```
BEFORE                                                  AFTER

 [ registerview.js ]                                     [[ registerview.js ]]  want() · follow() · one()
   orbitals.setOn = (v) => one(v)   ~~> overwrites         saves and loads `on` (derived) itself
   states.setOn   = (v,h) => one()  ~~> overwrites               |  claim(v) -> true | sentence | 'parked'
   orbitals.save/load wrapped       ~~> overwrites               v
   states.save/load wrapped         ~~> overwrites       [ orbitalsview ]   [ statesview ]
 [ orbitalsview ]      [ statesview ]                      claim + refusal    claim + refusal + parking
   onSw REGISTRY ON (unseated)  onSw (unseated, relabelled) record without `on`  record without `on`
   setOn (closure) ≠ setOn (member)
```

- **Problem:** row U made ON derived state but left each pane's REGISTRY ON switch (built, never seated) and its `setOn` verb in place,
  then overwrote `setOn`, `save` and `load` on the panes' returned objects from outside. Inside `orbitalsview.js`, `setOn` is the
  closure; outside, the same name is registerview's wrapper. A reader of the pane sees an interface its callers never get.
- **Solution:** each pane offers its claim (take or release the field, with its refusal sentence; STATES may answer "parked") and a
  record without `on`. registerview is the one place ON is derived, saved and loaded, and the two unseated switches go.
- **Wins:**
  - Delete two unseated switches
  - Delete four overwritten members
  - one name, one meaning
  - locality: ON's law in one file
- **Inside the laws:** `__LW.orbitals.setOn` / `__LW.states.setOn` keep their names (registerview supplies them; members inside existing
  objects do not move `lw-facade.json`, as U-BUILD measured); no slot; `windows/molecules.js` stays at 15 crossings.

**Grilling**
1. *Does STATES' parking and re-arm (armed 1 | 2, BEAT for a hand's ON) belong in the pane or the register?* — In the pane: it is about
   STATES' ladder landing. The claim answers "parked", and the pane re-claims on landing while `want()` still holds.
2. *Should a pane's OFF verb mean MOLECULES OFF (today) or VIEW back to DENSITY?* — U-BUILD flagged it. Recommended: VIEW DENSITY, so a
   script that hands the field back keeps the molecule; MOLECULES OFF stays the card's switch. Josh's call, one line in `one`.
3. *Where does `statesview`'s `says()` (relabelling the unseated switch "NO CIS STATES") go?* — Its sentence already rides the FILL
   button's hover and the status line; the relabel dies with the switch.

---

## C4 · The valence subshell is atoms.js', once
**Strong** (the merge) · in-process · deletes · one behaviour question for Josh

**Files:** `lab/valence.js` (18 lines), `lab/atoms.js` (`groundConfig`, `configOf`), `lab/windows/spectrum.js` (`fillValence`),
`lab/picker.js`, `tools/menu-thumbs.mjs`

```
BEFORE                                                   AFTER

 [ atoms.js ] groundConfig(Z ≤ 118)                      [[ atoms.js ]] groundConfig · configOf · valenceOf
              configOf(Z ≤ 86)   <- one name                    ^             ^              ^
 [ valence.js ] configOf = groundConfig  <- same name     picker.js   menu-thumbs.mjs   fillValence
                valenceOf: open subshell, highest l
 [ spectrum.js ] fillValence: cfg.at(-1) of (n,l) sort   (tile, its picture and LOAD VALENCE: one subshell)

 measured at 34f70c7: 40 of 86 elements disagree — Sc–Zn, Y–Cd, La–Hg:
   the tile's picture is 3d / 4d / 4f / 5d, its press loads 4s / 5s / 6s
```

- **Problem:** "the subshell that makes the atom" has two rules in two files, and there are two `configOf` exports with different
  domains (Z ≤ 86 against ≤ 118). For 40 elements the Picker's tile shows one subshell and its press loads another.
- **Solution:** `valenceOf` moves into `atoms.js` beside `groundConfig`, `valence.js` and its alias go, and `fillValence` reads
  `valenceOf`, so the tile, its picture and LOAD VALENCE name one subshell.
- **Wins:**
  - Delete `valence.js` and its alias
  - One `configOf`, one domain
  - Picture and press agree
  - `atoms.test` covers it in node
- **Inside the laws:** pure modules; `windows/spectrum.js` gains an import, not a crossing (it stays 25); no slot; THE LOCK digests no
  atom state (A-BUILD), so nothing to re-capture.

**Grilling**
1. *For Fe, should LOAD VALENCE load 3d (open, the tile's picture) or 4s (outermost, closed 4s²)?* — 3d. The open subshell is what Josh
   asked the picture to show on 10-18. CLAUDE.md records the split ("a press still opens goAtom's fillValence") without a reason. Josh's
   call; if he wants 4s, the merge still deletes `valence.js` and the picture follows the press instead.
2. *Should `valenceOf` answer past Rn when ATOMS stop at 86?* — Yes: `groundConfig` already fills to 118 for the Picker's dimmed tiles,
   and row A7 starts from it. One function, its domain documented.
3. *Does anything gated move?* — No: THE LOCK has no atom state, `atoms.test`'s Δ-SCF rows do not read the valence rule; the change
   shows in `fillValence`'s status line and the register it loads.

---

## C5 · One section install, in library.js
**Worth exploring** · local-substitutable (Cache Storage; `tests/library.test.mjs` exists) · deletes

**Files:** `lab/chemview.js` (123, 186–209, 1289–1293), `lab/picker.js` (155–200), `lab/library.js`

```
BEFORE                                                      AFTER

 [ chemview.js ]                    [ picker.js ]             [[ library.js ]] fetchRecord · removeRecord ·
   keepSw INSTALLED (unseated)        secs · secLine            persistOnce · section install/remove/count
   keep(v): persist, loop fetch       pressSec: persist,              ^                       ^
   header(): sectionRecs, count         loop fetch, cancel,     picker heading tile      __LW.chem.keep / section()
   section() reads keepSw.get() ~~>     two-press remove        (ring, CANCEL, REMOVE?)  (status line)
                                      countSec
```

- **Problem:** row P moved the section install into the Picker by writing a second copy; the first stayed alive as `__LW.chem.keep`
  behind an INSTALLED switch nobody sees, and `section()` reports its lamp by reading that hidden widget.
- **Solution:** `library.js`, which already owns `fetchRecord`, `removeRecord` and `persistOnce`, gains the section's install, remove and
  count loop; the Picker's heading tile and `__LW.chem.keep` both call it, and `keepSw` goes.
- **Wins:**
  - Delete chemview's loop and `keepSw`
  - One section count
  - `section()` reads the store, not a widget
  - row V starts from one road
- **Inside the laws:** leaf modules; `__LW.chem.keep` and `section` keep their names; no slot.

**Grilling**
1. *Who owns cancel and progress, the loop or the tile?* — The loop takes a progress callback and a stop signal; the tile paints the ring,
   chemview writes its status line. Both callers need progress today.
2. *Is a one-atom entry part of its section's records?* — The Picker says no (an atom is the ATOMIC table's), chemview counts it. Today
   the catalogue has none (P: 0 of 98), so the counts agree; take the Picker's rule in the one count.
3. *Before or after row V (queued)?* — Before: V puts the library road on the card's steppers, and one road is what it should call.

---

## C6 · MARKS join the INFORMATIONAL record
**Worth exploring** · in-process · deletes · residual of Sos C2

**Files:** `lab/informational.js` (MARKS block), `lab/shell/stage-words.js` (`INFO_ROWS`, `BLOB_INFO`, `liftInfo`),
`lab/shell/settings.js` (37, 98–100)

```
BEFORE                                                  AFTER

 INFORMATIONAL                                           INFORMATIONAL
 |-- THE WORDS · ANNOUNCE · CURSOR  -> INFO_ROWS          |-- THE WORDS · ANNOUNCE · CURSOR · MARKS -> INFO_ROWS
 |       -> createPrefs -> lambdawaves.q0.info            |       -> createPrefs -> lambdawaves.q0.info
 |-- MARKS: 3 hand-built sw -> saveSettings -> blob       (blob: skeleton / bead / ellipsoid lifted once, as the six were)
 |       <- applySettings reads 3 keys
```

- **Problem:** one window, two stores: SKELETON, BEAD and UNCERTAINTY are built by hand and saved through the settings blob, while every
  other control in the card is a row of its own record.
- **Solution:** the three become `INFO_ROWS` in a MARKS group, lifted once from the blob as the six formula keys were (ADR-0003).
- **Wins:**
  - Delete three hand-built switches
  - `settings.js` loses three reads and writes
  - one record per window
  - FORGET reaches MARKS too
- **Inside the laws:** `settings.js` crossings fall; the lift is row I's precedent; `tools/settings-probe.mjs` is the gate.

**Grilling**
1. *Are MARKS PREFERENCE?* — Yes; each switch's title says so and they live in the blob today, never in a project.
2. *The frame loop reads `ui.skeletonSw.get()` (rack.js:510): does that change?* — No: keep `ui.skeletonSw` / `beadSw` / `ellipsoidSw`
   as the controls' widgets, as `ui.molFormulaSw` is; `verbs.js` and the loop keep reading them.
3. *Does the lift need a new "known" flag?* — No: the blob writes each mark only while it is on, so lifting three more keys through
   `liftInfo` is lossless.

---

## C7 · A target is declared by the window that owns its dial
**Worth exploring** · in-process · adds a verb, deletes accessors · carried from Sos C1

**Files:** `lab/shell/modulation.js` (defs; 132–135, 145–147, 172–181), `lab/shell/persist.js` (25–37), `lab/chemview.js` (79–86,
278–285, 600–632, 1307–1312), `lab/orbitalsview.js` (38, 660–662), `lab/statesview.js` (821–826), `lab/windows/molecules.js`
(`modBase`, the clamp subscriber), `lab/mod-port.js`

```
BEFORE: one target, chem.orbital, in five files

 modulation.js  defs row (placeholder range 1..768) + landing subscriber: installOne / setBase / applyAll / stamp
 persist.js     modSeats row 'chem.orbital'
 chemview.js    stepOrbital · handK · baseHand · rebuildOrbKnob copies data-param + mod-held · span · clamped
 molecules.js   modBase adapter · clamp status subscriber
 orbitalsview.js exports OMORPH, imported by modulation.js and persist.js

AFTER

 [[ the owning window ]]  declares: id · range · get/set · seat in its record · flash cap
        |  mod.target(...)   (re-declare by id = the kit's hot re-registration)
 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - (seam: app.ctl.mod, an existing slot)
 [ modulation seam ]  installs, re-registers, stamps; derives modSeats from the declarations
```

- **Problem:** a modulation target still lives in four or five files. Iteration 007 added two the old way, and the `reg.omorph` row's
  comment already says the opposite of what row B measured ("a lane OR a route: the kit's either-or, the top-most wins"; the kit adds
  them, `host.js livePos`).
- **Solution:** the owning window declares its target beside its dial (range, get/set, its seat in the record) and the seam installs,
  re-registers and stamps it and derives `modSeats` from the declarations.
- **Wins:**
  - `modSeats` stops being hand-kept
  - Delete ~20 null-guarded accessors
  - a range change stays in MOLECULES
  - one door, not `defs` + `register`
- **Why only "worth exploring":** it adds a verb to the port, and the windows build before the seam installs, so declarations queue.
  That is machinery; Josh's rule ranks it below C1–C6. Do it when a third window asks for a target.
- **Inside the laws:** the seam is `app.ctl.mod` (no new slot); `modulation.js` drops its `app.state.orbitals` / `states` reads;
  `persist.js` stays ≤ 24; saved ids unchanged; ADR-0001 and ADR-0002 respected. The kit knob's fixed range is why `rebuildOrbKnob`
  swaps the widget and copies the stamp; a `setRange` on the kit knob is a MIR issue (a KIT BRIEF line), and it would delete the copy.

**Grilling**
1. *Do the camera, material and transport rows move too?* — No: the shell owns those dials (Sos's A1 hybrid).
2. *Does a declaration need a lifecycle (retire, dormant)?* — No: re-declaring by id is the kit's hot re-registration; the kit's
   dormant routes cover "not landed yet".
3. *Is it worth doing now?* — Not yet. Now: fix the stale `reg.omorph` comment. When the next target is asked for: this.

---

## C8 · MOLECULES' rows as a list
**Speculative** · in-process · carried from Sos C4

**Files:** `lab/chemview.js` (115–125, 250–300, 367)

```
BEFORE                                     AFTER
 rows created in construction order          one LAYOUT list of rows, controls placed from a map
 TDA, CORE appended to rM (298–300),
 then moved to rTda (367)
```

- **Problem:** where a control sits is decided by when it is built, inside a 1,395-line closure.
- **Solution:** build the controls into a map, then place them from one list of rows.
- **Wins:** a re-lay is a diff of one list · `seats()` becomes a row rule
- **Why Speculative now:** rows M and U re-laid the card by moving lines, cheaply (M: +16 / −11). The friction is reading the closure,
  not the edit.

**Grilling**
1. *More re-lays coming?* — V (queued) touches the steppers; Josh has re-laid this card at every iteration since 0.4.0.
2. *Would a list survive U's register slots (`slots.top`, `slots.register`)?* — Yes, as two named rows.
3. *Is the TDA / CORE double placement a bug?* — No (they end in `rTda`); delete the first two appends.

---

## Noted, not carded
- **Dead slots:** `app.state.molFormulaScale` and `atomLabelsScale` are written (`stage-words.js:242, 244`) and never read (declared in
  the `rack.js:120` literal). Delete both keys.
- **Stale comment:** `modulation.js`'s `reg.omorph` row ("a lane OR a route: the kit's either-or, the top-most wins"), against B-BUILD's
  measurement.
- **Stale hint:** `KINDS`' `preset` names "STATE's PRESET and RELOAD, MO-REGISTRY's ORBITAL and STATES presets"; since S the preset is
  SPECTRUM's and since U MO-REGISTRY is inside MOLECULES. CLAUDE.md's THE FADE sentence carries the same drift.
- **SPECTRUM at 25 / 25:** row S routed its head through the controller's `api` (THE ONE ROAD), correctly; the next SPECTRUM feature
  must do the same or shed a crossing first.
- **Working as designed:** `ui.presetSel` (S) and `ui.sliceModeSeg` (W) impersonate the old widgets' `get` / `set` / `.value` so
  `persist.js` did not change: adapters at the `ui` seam, two real users each.
- **Kit issues to file with MIR:** the knob's fixed range (C7); `createPrefs`' one shared frame key (I-BUILD).

## Top recommendation
**C1 · One ladder law.** It is pure deletion in four leaf files, it closes a three-way drift that three parallel rows of iteration 008
created (S, U and A each painted one ladder), and it touches no saved key, slot or facade member. Then C2 (the A ↔ B copies that B made
diverge), then C3 (ON's law into registerview).
