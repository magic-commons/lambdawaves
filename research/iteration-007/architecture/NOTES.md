# Iteration 007: the architecture scan (Pocock, improve-codebase-architecture) over the MOLECULES / MO-REGISTRY / INFORMATIONAL rework

Claude Sos sub-agent · 2026-10-18 · worktree `optimization-2026-09-24`, branch `yan-c` @ `81625da` · read-only on source.
The visual report is `REPORT.html` (beside this file). The glossary draft is `GLOSSARY-draft.md`. The ADR drafts are `ADR-draft-000{1,2,3}-*.md`.
The skill's grilling phase needs Josh, so this stops before it. The questions are at the foot of this file.

## Scope and method
- Files: `lab/chemview.js` (1,314 lines), `lab/windows/molecules.js` (104), `lab/molecules.js` (574), `lab/orbitalsview.js` (631), `lab/registerview.js` (76), `lab/statesview.js` (where it mirrors ORBITAL), `lab/informational.js` (42), `lab/shell/stage-words.js` (160), `lab/shell/modulation.js` (243), `lab/mod-port.js` (161), `lab/shell/persist.js` (modSeats), `lab/shell/settings.js` (the blob), the seams with `lab/rack.js`.
- `lab/modwindow.js` no longer exists: it was deleted at 0.5.0 C4 (CLAUDE.md, and `lab/shell/modulation.js:13`). The modulation seam is now `lab/mod-port.js` plus `lab/shell/modulation.js`.
- Hot spots since 2026-10-01, by commits touching each file (excluding the generated `sw.js`): `rack.js` 141, `chemview.js` 43, `lab.css` 37, `windows/molecules.js` 18, `shell/settings.js` 16, `statesview.js` 14, `persist.js` 11, `orbitalsview.js` 10, `mod-port.js` 10.
- Kit facts were verified against `lab/mir/**`, which is read only and never edited: registry maps include `integer` (`registry.js:107, 160-165`); hot re-registration keeps the base and the routes (`registry.js:252-256`); a timeline lane automates any registered target (`timeline/bind.js:2-3`, `timeline/knobs.js:18-22`); `control(descriptor)` returns both a control and its registry params (`controls/factory.js:1-27, 108-120`); `createPrefs` stores rows (`core/prefs.js:19-36`).
- Rack-deps today (`node tools/rack-deps.mjs --classes --no-write`): molecules 16, stage-words 5, modulation 11 (HINGE ≤ 25), so there is headroom in all three.

## Ranked opportunities (fewer, well-evidenced)

### 1. A target is declared once, by the window that owns its dial · Strong · in-process
**Payoff for the rework:** ORBITAL and A ↔ B become one row each in the window that owns them, and modulation and the timeline lane come with it.
**Files:** `lab/shell/modulation.js`, `lab/shell/persist.js`, `lab/mod-port.js`, `lab/shell/facade.js`, `lab/chemview.js`, `lab/statesview.js`, `lab/orbitalsview.js`.
**Problem:** today one target lives in four places.
1. A row in the static `defs` table, `shell/modulation.js:29-149`, which reaches into window internals through accessors and repeated null-guards (`app.state.chem ? app.state.chem.knobs.kick() : null`, `:120-125`; the same pattern for `app.state.states`, `:129-143`).
2. A seat row in `modSeats`, `shell/persist.js:25-36`.
3. Three members on the window's return object: getter, clamped setter and `knobs` accessor (`chemview.js:1236-1238`; `statesview.js:796-803`).
4. The setter echoing the dial through `setKnob`, written into every row.

The table is installed once (`modulation.js:154`), so a range that depends on the molecule cannot be expressed. The ORBITAL dial's range is `span()`, `chemview.js:547`. Its dial is also rebuilt by `replaceWith` (`chemview.js:561-568`), which drops the `data-param` stamp that `mod-port.js:135-138` writes. A second registration door already exists with its own stamping, `facade.js:135-138`. The orbital index was kept out on purpose by an in-code rule (`modulation.js:115-119`), which Josh now overrules (ADR-draft-0001).
**Deletion test:** delete `defs`. The knowledge reappears in each window, which is where it belongs, so the table is a pass-through, and the four-way spread is the cost.
**Solution:** each window declares its targets next to the dial, and the seam installs, re-registers and stamps them and derives `modSeats` from the same declaration.
**Wins:**
- leverage: one row per target, with modulation, lane and save all coming from it
- locality: a range change stays inside MOLECULES
- the facade door and the boot door become one door, two adapters
- interface shrinks: `knobs`, `setKappa` and `setSpeed` leave chemview's return

### 2. The stage words are one deep module, and INFORMATIONAL renders its options · Strong · in-process
**Payoff for the rework:** the "plethora of toggles", the size, pad and position knobs and the clean MIR rebuild become rows, not wiring.
**Files:** `lab/informational.js`, `lab/shell/stage-words.js`, `lab/shell/settings.js`, `docs/STATE-SCOPES.md`, and the emitters `chemview.js:196,234,251`, `orbitalsview.js:104,223`, `windows/material.js:28`, `windows/molecules.js:63-64`.
**Problem:** one option lives in four places.
1. Its control, hand-wired, `informational.js:12-27`.
2. Its save, in the one blob literal, `settings.js:31`; its comment `:27-30` records a key dropped from that literal four times.
3. Its apply, `settings.js:85-93`.
4. Its setter, `stage-words.js:125-153`.

On top of that, announcements carry no kind: the strings are emitted ad hoc from five call sites, so a toggle such as "show registry orbital adds" has nowhere to live. stage-words assembles "what is on stage" itself from seven MOLECULES members (`stage-words.js:19, 27-30, 34, 107`). MOLECULES reaches into INFORMATIONAL's DOM with `querySelector` to seat SKELETON, BEAD and ELLIPSOID (`windows/molecules.js:63`). settings special-cases the card by id (`settings.js:124`). The kit already has the parts: `createPrefs` rows (`mir/core/prefs.js:19-36`, the `mir.gui` precedent in `lab/look.js`), `control(descriptor)` (`mir/controls/factory.js`), and the layer's `setFollow`, `setParallax` and `setDrift` (`mir/info/layer.js:726-788`; λWAVES passes `follow: false` at `stage-words.js:70`).
**Solution:** emitters say a kind and a line. The stage-words module owns the kinds filter, the preference record and the layer. INFORMATIONAL is built from the module's option rows with kit controls.
**Wins:**
- leverage: a new toggle is one row
- locality: the filter sits in one place, not at five emitters
- the blob literal stops growing (ADR-draft-0003)
- MOLECULES stops reaching into INFORMATIONAL's DOM

### 3. One A ↔ B morph module for both MO-REGISTRY registers · Strong · in-process
**Payoff for the rework:** the ORBITAL pane's A ↔ B lane survives a save and reopen, and the target row is written once for both panes.
**Files:** `lab/orbitalsview.js:96, 111-118, 242-254, 289, 595`, `lab/statesview.js:53, 95-98, 264, 272-285, 580, 702, 757-767, 796-803`, `lab/molecular-register.js:41` (`slerpCoefficients`, already shared).
**Problem:** stores A and B, the position s, the MORPH switch, the A ↔ B knob and `setMorph` are written twice, nearly line for line (`orbitalsview.js:248-254` against `statesview.js:279-285`). Only the STATES copy got a target (`reg.morph`, `modulation.js:129-131`) and persistence (`statesview.js:757-767`). The ORBITAL copy's `save()` writes `{ on, selection }` only (`orbitalsview.js:595`). A lane on ORBITAL's A ↔ B would therefore reopen onto a MORPH with no stores, and so write nothing.
**Solution:** one morph module, shaped `createMorph({ snapshot, apply, … })`, that owns the two stores, s, on, the switch, the knob, save and load, and its target row. Each pane hands it a snapshot function and keys.
**Wins:**
- locality: one copy, one save shape
- fixes the ORBITAL persistence gap for free
- the new id is one row (ADR-draft-0002)
- tests hit one interface

### 4. MOLECULES' layout is a declared row list, not construction order · Worth exploring · in-process
**Payoff for the rework:** the re-lay (INSTALLED and ON at the top, the pickers stacked, BASIS → VIEW → METHOD, a VIEW that is not top-heavy) becomes a list edit, and so does the next re-lay.
**Files:** `lab/chemview.js:94-357` (the rows), `lab/lab.css:792-826`.
**Problem:** where a control sits is decided by when it is built, then patched afterwards.
- Rows are created in construction order (`chemview.js:104, 111, 228, 272, 306`).
- Controls are moved after the fact: `valSw` `insertBefore` at `:260`; TDA and CORE appended to r1 at `:268-270`, then moved to `rTda` at `:333`; r2, the readouts and the note re-parented into `.mol-more` at `:334`; `openNote` `insertBefore` at `:557`; the chevron into r1 at `:348`.
- Visibility is an inline style in `seats()` (`:261`).
- Each piece sits inside a 1,314-line closure that also holds the solve road, the field producer and the facade, so reordering means reading all of it.
- The card has been re-laid at least four times: 0.4.0 S4b/S4c, 0.5.3 M8, 0.7.3 K2 (which added METHOD beside BASIS) and iteration 001.

CLAUDE.md's row description ("BASIS · ORBITAL, then VIEW · the fold's chevron") is already stale: METHOD sits in r1 and the chevron is in r1, not the VIEW row (`chemview.js:228-255, 348`). VIEW is one seg of six options (`chemview.js:242-251`), which is why its row is top-heavy. The kit's own law would make five or more ordered options a stepper (`mir/controls/factory.js:11-12`).
**Solution:** build the controls into a map, then place them from one `LAYOUT` list of rows (`[['section'], ['installed', 'on'], ['molecule'], ['basis', 'orbital|valence'], ['view'], ['method'], 'more…']`).
**Wins:**
- locality: the layout lives in one list
- the re-lay is a diff of one list
- `seats()` becomes a row rule
**Why only "worth exploring":** the re-lay itself is about ten line moves. This pays off only if Josh expects more re-lays, and history says he will.

### Noted, not carded
- **Dead pass-through.** `windows/molecules.js:82-86`: `head`, `headPick` and `headLand` now only clear `head.want` (the head moved to the notebook, comment `:84`). It is kept alive by `__LW.head` in the pinned facade (`shell/facade.js:10, 18`). Deletion test: nothing reappears except the facade pin. Remove it the next time the facade is re-captured.
- **chemview's return object** is wider than any one caller's use: about 55 members (`chemview.js:1182-1312`). The callers fall into four roles: the facade, the register's road (`solution`, `subscribe`, `query`, `certify`, `onPick`, `setPopulations`), the stage words (`row`, `preset`, `on`, `exportNames`, `espCaption`, `atomsNow`, `basis`) and modulation (`kappa`, `setKappa`, `speed`, `setSpeed`, `knobs`). Candidates 1 and 2 remove the modulation and stage-word roles from it. Splitting the rest is speculative.
- **Three A ↔ B's.** The atomic TRANSITION (`state.js:232`, target `state.rabi`), the STATES MORPH (`reg.morph`) and the ORBITAL MORPH (no target yet). The glossary draft separates them.

## Design it twice: the top two

There were six parallel design agents, three constraints for each candidate: minimise the interface · maximise flexibility · optimise for the most common caller. Their shared brief is `briefs/SHARED-CONTEXT.md`. The designs below are condensed, and every citation in them was re-checked against the code.

### Candidate 1, the target seam

**The problem space.** Saved ids stay stable. The `app` literal is never extended. `lab/mir` is never edited. Each module keeps its hinge at 25 or below. The windows are built (`rack.js:695`, `:709`) before the seam installs (`rack.js:737`), so a declaration made at creation must be queued. The kit already provides two things this needs: the `integer` map and hot re-registration that keeps the base and the routes (`registry.js:160-165, 252-256`). The dependency is in-process. The timeline needs nothing extra, because any registered, stamped dial can take a clip (`timeline/knobs.js:18-22`).

**A1 · minimal.** A window knows one verb, `target(id, spec)`, where `spec` is the registry spec plus `dial()`, `seat` and `echo`.
- Calling `target` again with the same id is the hot re-registration. That one gesture covers both a new range and a rebuilt dial.
- A call made before install is queued and flushed in order.
- The shell keeps `install(defs)` and gains `seats(data)`, which replaces the hand-kept `modSeats` (`persist.js:25-36`).
- The facade door shrinks to `register = mod.target`.
- Thin spots: the spec has about 14 fields, and `seat` is a path into the record tree, so the window has to know `instruments.chem`.

**A2 · flexible.** `declare(spec | control() | spec[]) → Handle { refresh, redial, retire, live }`.
- The spec can carry `range()` (read on every refresh), `present()` (false sends routes dormant) and `flash: 'step'` (caps how often an integer target may step, because an ORBITAL sweep at audio rate is a strobe).
- It accepts the kit's `control()` params as they come, so there are two real adapters.
- Thin spots: lifecycle states every reader must follow. Also, a normalised clip keeps its shape but changes its meaning when nAO changes.

**A3 · common caller.** `api.target(id, knob, { min, max, get, set }) → { rebind(knob, [lo, hi]), drop() }`.
- A `declarer('chem')` binds the record, so `group` defaults to the root, `seat` to the leaf, and `def` to `get()`.
- `set` receives a value that is already clamped and does not echo; the seam echoes the dial.
- It found that the port's `idOf` cache is built once (`mod-port.js:66-68`). A rebuilt or late dial is therefore unknown to `setKnob`, which does a plain `k.set` under a route, the very "teleport" the hand/base law prevents (by reading; not run).
- It also found that `setMorph` calls `morphK.set` (`orbitalsview.js:252`), so a target's `set` must not go through it.
- Thin spot: if the author forgets `rebind` after a `replaceWith`, the dial goes dead and nothing says so.

**Comparison.**
- Depth is high in all three. A1 hides the most per unit of interface. A2 hides more but shows a wider interface. A3 puts its depth into defaults.
- Locality is the same in all three: the target sits beside its dial. A1's `seat` path leaks; A3's derived seat does not.
- The seam is placed the same way in all three, on the mod port (`app.ctl.mod`, an existing slot), reached through the window's own api object.

**Recommendation: a hybrid, mostly A1.**
- Take A1's single verb, where calling it again is the hot re-registration, so there is no handle to forget.
- Take A3's defaults: a declarer bound to the record gives a derived seat, and the seam does the echo.
- Take from A2 only the per-def flash guard and a step-rate cap for integer targets.
- Leave out `present`, `retire` and `range()`: the kit's dormant routes already cover "not landed yet".
- Fix the `idOf` cache in the same change.
- Keep the camera, material and transport rows in the shell's table: the shell owns those dials.

### Candidate 2, the stage words

**The problem space.**
- Only a hand announces (THE FADE law).
- Off costs nothing, and KaTeX runs at most four times a second.
- The caption stays one plain line.
- Everything is PREFERENCE, and a project open leaves the blob byte-identical.
- Seat order: INFORMATIONAL is built at `rack.js:664`, before the stage words at `:702`, and the layer exists only at `initStageText`, `:898`.
- The dependency is in-process, and the kit's `createPrefs` takes a `storage` argument, so the store is local-substitutable.

**B1 · minimal.** Three entries: `say(kind, text, { ttl }) → bool`, `mount(body)` (INFORMATIONAL calls it once), and `prefs` (the kit's own `createPrefs`).
- A closed KINDS table; each kind is marked fade or pop.
- One row table feeds three things: the prefs schema, `control(descriptor)` and the filter.
- Groups: FORMULA (formula, size, name, position, pad) · LABELS · MARKS (SKELETON, BEAD and ELLIPSOID move here, ending the `querySelector`) · ANNOUNCE (one switch per kind, plus pop size) · MOTION (follow, parallax and drift, through the kit's own setters).
- The six blob keys are lifted once and the `settings.js:124` special case dies.
- Thin spot: kind names are strings, checked only at run time.

**B2 · flexible.** `kind(def)` · `say(kind, payload)` · `seat(id, …)` · `options()` · `caption({ kinds })` · `slot(group, nodes)`.
- Windows declare their own kinds, including state kinds with `key()` and `md()`.
- Several seats are possible, each its own kit layer.
- `from: 'mod'` events are off by default and coalesced.
- Thin spots: the schema is built at run time, there are extra layers and observers, and INFORMATIONAL goes generic.

**B3 · common caller.** A leaf module: `import { say } from './stage-say.js'`, called as `say(kind, text)` with no hand flag.
- The hand test is internal: a trusted-event token stamped in the capture phase, plus `quiet(restore)`.
- `chem.stage() → { key, md, plain, name, atoms }` replaces the seven MOLECULES reads.
- Thin spot: a `say` after an `await` is silently lost, which is a trap for later code.

**Comparison.**
- B1 gives the most depth per entry, and its locality is the kinds table in one place.
- B2 spreads kinds across windows (less locality) and adds surface Josh has not asked for.
- B3 is the best for emitters, but its hand law is magic timing.

**Recommendation: B1, with B3's source port.**
- `say`, `mount` and `prefs` over one closed row table.
- The table lives in a leaf module that both INFORMATIONAL and the stage words import, so the seat order stops mattering.
- `chem.stage()` is one record from MOLECULES; it also carries the NAME toggle's text.
- The hand law stays plain: `say` is called only from a control's hand callback (`onInput` or `onChange`), never from a target's `set`. A modulated ORBITAL dial is then silent with no token.
- B2's per-window kinds and multi-seat wait until a second seat is actually wanted.

## Top recommendation
**Candidate 1**, with Candidate 3 inside the same change, then Candidate 2 with the INFORMATIONAL rebuild. Two of the rework's four asks are "this dial becomes a target with a lane", and Candidate 1 turns each of them into one row. Candidate 3 is needed anyway, because the ORBITAL A ↔ B lane is worthless until its stores are saved.

## Grilling questions for the one Josh picks (round 1, the frontier)
In the skill's format, each question carries a recommended answer, and "yes" accepts it. The skill stops here: these decisions are Josh's.

### If Josh picks Candidate 1 (the target seam), with 3
- **Q1 · Stepped or continuous ORBITAL.** Under a route or a lane, does the ORBITAL dial step through whole orbitals (`map: 'integer'`, each step a new picture), rather than cross-fading between neighbours (a new field product)?
  → Recommended: yes, stepped. Integer is the kit's own map, and a cross-fade is a separate feature.
- **Q2 · What a lane value means across molecules.** A clip stores 0..1, so the same curve lands on different orbitals for H₂O and benzene. Accept index semantics (0 = the first orbital, 1 = the last) for now?
  → Recommended: yes. A HOMO-relative mode ("HOMO − 2 … LUMO + 2") would be a later spec field.
- **Q3 · The new id.** Name the ORBITAL register's A ↔ B `reg.orb.morph`, and leave `reg.morph` as the STATES one?
  → Recommended: yes (ADR-draft-0002).
- **Q4 · The step-rate cap.** Hold `chem.orbital` to at most 3 changes a second under a modulator (the flash guard's WCAG rate), as for the four luminance routes? Each step is a new field.
  → Recommended: yes. A fast LFO on it is a strobe.
- **Q5 · Who declares.** Do the `chem.*` and `reg.*` rows move into their windows, while the camera, material, transport, state and shell rows stay in the shell's table?
  → Recommended: yes. The windows that own a dial declare it; the shell's own dials stay.
- **Q6 · Saving the ORBITAL register's A, B and MORPH.** Do it in this change, even though it changes the bytes of `lab/new-project.lambdawaves.json` (re-run `tools/new-project.mjs`)?
  → Recommended: yes. Without it the lane is broken on reopen.
- **Q7 · The in-code rule.** Delete the comment at `modulation.js:115-119` and record ADR-draft-0001. Does λWAVES keep ADRs in the repo (`docs/adr/`), or under `research/`?
  → Recommended: `docs/adr/`, created lazily with this first one.
- **Q8 · A↔B on the ATOMS side.** Leave the atomic TRANSITION (`state.rabi`) out of this change?
  → Recommended: yes. It is already a target.

### If Josh picks Candidate 2 (the stage words)
- **Q1 · Its own record.** Do INFORMATIONAL's options move to their own PREFERENCE family (`lambdawaves.q0.stage`), with the six blob keys lifted once?
  → Recommended: yes (ADR-draft-0003).
- **Q2 · First-run defaults.** Keep today's behaviour, and default the new kinds (ORBITAL dial, RATE, WAVE style, PALETTE) and NAME to OFF?
  → Recommended: yes. Nothing changes until Josh opts in. Registry adds and WAVE view changes stay ON as today. This is also JOSH-PROMPT's open question.
- **Q3 · NAME.** Does NAME show the name under the formula, rather than replacing the formula?
  → Recommended: yes. It goes under, in the formula block.
- **Q4 · Cursor dynamics.** Should "words move out of the cursor's way" be the kit layer's `follow` (`layer.js:9-12`) as shipped, OFF by default?
  → Recommended: yes.
- **Q5 · Which options get size, pad and position.** Formula: size, pad, position. Pop-ups: size. Atom labels: size. Is that enough?
  → Recommended: yes. Add more rows only when asked.
- **Q6 · MARKS.** Do SKELETON, BEAD and ELLIPSOID move into the stage-words record as a MARKS group?
  → Recommended: yes. They already sit in INFORMATIONAL (`windows/molecules.js:62-63`).
- **Q7 · The look.** Should the kit's `control()` choose each control kind (switch, seg, knob), even where today's hand-built rows differ?
  → Recommended: yes. That is "built from the existing MIR components".

### If Josh picks Candidate 3 alone, or 4
- **3:** all of Candidate 1's Q3 and Q6. **4:** does VIEW become a stepper (the kit's rule for six ordered options), or two rows of three? → Recommended: two rows of three. It keeps one press per view and the card looks less top-heavy.
