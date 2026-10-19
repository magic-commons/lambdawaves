# λWAVES · thermo-nuclear code-quality review · `c73c5c0..34f70c7` (iterations 007 + 008 as merged)

Reviewer: Opus 5.5, read-only worktree at `34f70c7`. Scope: `lab/` (not `lab/mir/**`), `tools/`, `tests/`. Pictures and research notes are out of scope.
Skill applied: `research/iteration-007/skills/cursor/thermo-nuclear-code-quality-review.SKILL.md`. No browser suites were run.

## Verdict

Not approvable as finished under the skill's bar, though the fix is a deletion pass, not a rewrite. The range adds **+574 lines and +68 KB to lab JS** (31,715 → 32,289 lines; 2,695,508 → 2,763,964 bytes) and **about +210 net branches** (`if (` and `? `: +458 / −246, not counting the S move). It adds no test files and no gate scripts. Taken one at a time, the rows are well built.

The regression came at the merge. Six rows (U W S K A P) branched from the same base. Where two of them met the same idea, each built its own copy and both copies shipped:
- normalising at the end of a stroke;
- EMPTY ↔ FILL ALL;
- the section install;
- the plain level line.

U also merged MO-REGISTRY into MOLECULES by wrapping it, not by re-modelling it. That left:
- six method overrides on the panes;
- two unseated "mirror" switches;
- an alias seat (`wOrbs = wChem`);
- three dead exports.

O's step cap kept a measured-rebuild EMA that has had no effect since the integrator raised `STEP_MS` to 334. W's DITHER lift writes the settings blob during a project open, which contradicts a recorded law.

About **110 lines and ~30 branches** can be deleted without changing behaviour. None of it needs new machinery.

## Measurements

| file | before | after | Δ | note |
|---|---:|---:|---:|---|
| `tools/volumes/catalogue/build.py` | 981 | **1,215** | +234 | **crosses 1k** (C7) |
| `lab/chemview.js` | 1,314 | 1,395 | +81 | already over 1k; 146 KB; 7 lines > 400 chars |
| `lab/windows/static-field.js` | — | 134 | +134 | S, moved verbatim from state.js |
| `lab/windows/state.js` | 213 | 81 | −132 | S |
| `lab/shell/stage-words.js` | 160 | 258 | +98 | I (INFO_ROWS, prefs, lift) |
| `lab/picker.js` | 298 | 369 | +71 | P (section install, one-row head) |
| `lab/keplerview.js` | 108 | 168 | +60 | K (impulse layer) |
| `lab/orbitalsview.js` | 631 | 678 | +47 | B, U |
| `lab/registerview.js` | 76 | 104 | +28 | U |
| `lab/spectrum.js` | 374 | 401 | +27 | S, A |
| `lab/valence.js` | 28 | 18 | −10 | A (good) |
| `lab/shell/persist.js` line 176 | 1,439 chars | **1,835 chars** | +396 | W put DITHER and the view map into the restore one-liner |

`!important` counts are unchanged (lab.css 11, skin.css 27 by `grep -o`). The 32-declaration law holds.

---

## Ranked findings (by the simplification they buy)

### 1. THE ONE SWITCH is layered by monkey-patching, not modelled
**Where:**
- `lab/registerview.js:59-71`: `orbitals.setOn`, `states.setOn`, `orbitals.save`, `states.save`, `orbitals.load` and `states.load` are reassigned over the panes' own methods, and the originals are aliased as `onO/onS/saveO/saveS/loadO/loadS`. A second `chem.subscribe` re-claims ORBITAL.
- The panes still carry their own retired **REGISTRY ON** switch, "kept unseated, the claim's own mirror":
  - `lab/orbitalsview.js:90`, with 4 `onSw.set` calls at :340-352;
  - `lab/statesview.js:89-91`, with 4 more `onSw.set` calls, plus `says()` writing a label and a hint onto the hidden switch, and `SW_TITLE`.
- Both panes still export `onSwitch: onSw.root` (`orbitalsview.js:652`, `statesview.js:814`). Their comment says "registerview.js seats it beside ORBITAL | STATES", but nothing reads the export any more.
- `setOn` now means two different things. Inside a pane it is the private claim; outside it is the one switch. So statesview needs a second road to the outside meaning:
  - `statesview.js:414`: `if (!on && api.claim) api.claim(); if (!on && !setOn(true))`;
  - `:745`: `if (api.claim) api.claim(); else setOn(true)`.

**Code-judo move:** give the shared state its owner.
- Hand each pane `api.want()` and `api.one(v, hand)` in the api object that `createRegister` already builds.
- In each pane, rename the internal `setOn` to `claim`.
- Make the pane's public `setOn` simply `api.one`.
- Have `save()` write `on: api.want()` and `load()` call `api.one(true)` when `r.on`.
- `follow()` then calls `orbitals.claim` / `states.claim`.

**Deletes:**
- the six reassignments and six aliases;
- both hidden switches and every `onSw.set`;
- `says()`'s writes to the dead label;
- the two `onSwitch` exports;
- the `api.claim` double road in statesview.

That is about 25 lines and 12 branches. Above all, it ends the two meanings of one verb name.

**Risk / guards:**
- `tests/register.browser-test.mjs` (22 rows, R12's hand-arm BEAT);
- `tests/orbitals.browser-test.mjs` L6 (the record is exactly `{ on, selection }`);
- `tests/history.browser-test.mjs` (the derived `on` in undo rows);
- `tests/project-formats`;
- `lw-facade.browser-test`: unchanged, because `__LW.orbitals.setOn` keeps its answer.

### 2. "A hand stroke normalises at its end" was built twice, in parallel, plus duplicate bookkeeping
**Where:**
- **U** added `onEnd` to `lab/paint-stroke.js`, with a new `hit` flag written at four sites (:33, :45, :50, :55-56).
- **S**, on its own branch, normalised SPECTRUM's grid with a `painted` flag and three raw listeners (`pointerup`, `pointercancel`, `lostpointercapture`) registered after paintStroke's own (`lab/spectrum.js:108-113`). Correctness there depends on listener registration order, and a comment explains that.
- The ORBITAL and STATES ladders then each keep their own `let stroked = 0` counter (`orbitalsview.js:560/569`, `statesview.js:675/680`). This is needed because `hit` says "keys were applied", not "something changed".

**Code-judo move:**
- `paint-stroke` sums what `o.apply(...)` returns. All three appliers already return a count: `paintLevels`, `paintStates`, and `api.paintModes` at `controller.js:305`.
- It calls `o.onEnd(total, add)` only when `total > 0`.
- SPECTRUM passes `onEnd: () => api.settle()`.
- The ladders pass `onEnd: () => { norm(); api.stroked(m); }`.

**Deletes:** `hit` (4 sites), both `stroked` counters, `painted` with its 3 listeners, and the listener-order comment. That is about 12 lines and 8 branches, and one rule in one place.

**Risk:**
- `history.browser-test` (the stroke plus its norm is still one undo row; `onEnd` is still inside the pointerup);
- `register` / `orbitals` stroke rows;
- THE PAINT GESTURE law in CLAUDE.md is unchanged.

There is a follow-on candidate. The two `cv.addEventListener('click', …)` fallbacks (`orbitalsview.js:571-576`, `statesview.js:682-687`) are commented "none can reach a canvas today". U still copied the norm-and-stroked tail into both, so they are dead code that was kept in sync by hand. Delete them, or say why the law needs them.

### 3. EMPTY ↔ FILL ALL exists twice, and the "shared" level line is shared with nobody
**Where:**
- U's `fillButton` (with the Gemini glyphs) lives in a pane module, `lab/orbitalsview.js:40-57`, and `statesview.js:35` imports it from there.
- S built its own word button in `lab/spectrum.js:65-68, 83-84, 247`: `paintFill`, a `dataset.empty` cache, and a `pointerenter` repaint hack because "the label is repainted by rebuild(), which a folded card skips". S-BUILD decision 5 already proposed sharing it.
- A exported `levelLine` (`spectrum.js:38`) "so MO-REGISTRY's ladder (row U) can draw the same line". U never imported it. The ladders keep two more plain-line rules with different alphas and widths: orbitals 0.26/0.1 at 2.5/1.5 px (`orbitalsview.js:510`), states 0.26 with an f weight, spectrum 0.42 at 2/1 px.

**Code-judo move:**
- Put `fillButton` beside `levelLine` and use it in all three places. SPECTRUM calls `fillB.set(!want.length)` where it now calls `paintFill`, and the press keeps reading `api.reg.populated()`.
- Either draw both ladders with `levelLine` (add a width argument), or drop the `export` and its false comment.

**Deletes:** `paintFill`, the pointerenter hack, and one of the two button idioms. About 8 lines, plus one visual rule for "plain lines" if the ladders adopt it.

**Risk:** SPECTRUM's head layout (`sp-head` CSS), and `tests/menubar` / `stage-text` (the preset stepper sits on the same row). THE LOCK does not cover the ladders.

### 4. The section install is written twice, and MOLECULES keeps a hidden switch as a data store
**Where:**
- **P** built THE SECTION INSTALL in the Picker: `lab/picker.js:171-205` (`pressSec`, `countSec`, `paintSec`). It loops `persistOnce` → `installed` → `fetchRecord` → `removeRecord`.
- That is the same loop as chemview's `keep(v)` (`lab/chemview.js:202-210`).
- **U** then unseated INSTALLED but kept `keepSw` "for row V" (`chemview.js:123`). Row V was never launched. `header()` still sets its lamp and `hidden` (:199). Its only remaining job is to be read back by `__LW.chem.section()` as `keepOffered: !keepSw.root.hidden, lamp: keepSw.get()` (:1291), and set by `keep()` (:1293).

**Code-judo move:**
- Put one `installSection(recs, { onStep, stop })` in `lab/library.js`, next to `fetchRecord`, `removeRecord` and `persistOnce`. chemview's `keep` and the Picker's heading tile both call it.
- `section()` derives `lamp` from `have` (every record installed) and `keepOffered` from `recs.length && !safariTab()`.
- Delete `keepSw`.

**Deletes:** about 20 lines net (the duplicate loop and its progress strings, the widget, three `keepSw.*` writes), and a widget whose state exists only for a test to read.

**Risk:**
- `tests/library.browser-test.mjs:151-167` reads `keep()`, `keepOffered` and `lamp`. Derive them, don't remove them.
- `tests/chem.browser-test.mjs` L6.
- Keeping UI alive for a row that was not launched is speculative generality; Josh's dial says build the feature when it comes.

### 5. MO-REGISTRY's second seat lives on as an alias
**Where:**
- `lab/windows/molecules.js:102-118`: `createMoRegistry()` no longer makes a device. It sets `const wOrbs = wChem` and `app.w.wOrbs = wOrbs`. No module reads `app.w.wOrbs`; the only reader is boot's closure.
- `lab/rack.js:132`: the `wOrbs` slot in the fixed app literal.
- `lab/rack.js:709-714`: the seat and its comment. The comment is now false ("REGISTER ON … it STAYS on the rack whatever MOLECULES does"), and it is the anchor `tools/rack-deps.mjs:934` keys the module span on.
- `lab/rack.js:520-521`: the frame loop reads `canPresent(wOrbs)` and `powered(wOrbs)`.

**Code-judo move:**
- The multi-seat shape existed only to keep a device's rack order. With no device, build the register at the end of `createMolecules`; `say` is already lazy, so it does not need the stage words first.
- Point the loop at `wChem`.
- Remove the slot and the seat.
- Move the rack-deps anchor to the remaining seat.

**Deletes:** one function wrapper, one alias, one app slot, one boot seat and a 5-line false comment. That is one concept fewer: "the register's card".

**Risk:**
- `node tools/rack-deps.mjs --classes` and `tests/rack-deps.test.mjs` (the plan names the seat);
- `tools/perf/app-shape.mjs` (one key fewer is fine);
- `lw-facade.json` is unchanged.

This is a recorded-law area (THE MULTI-SEAT SHAPE, CLAUDE.md R2b). The law describes how to keep order. It does not require a seat that has no device.

### 6. `chem.orbital`'s measured-rebuild EMA has been dead since the cap went to 334 ms
**Where:**
- `lab/chemview.js:85` sets `STEP_MS = 334` (Yan at the merge, for the 3 flashes/s photosensitivity reason).
- `:620` `stepGap = max(STEP_MS, round(stepMs))`.
- `:632-638` `stepClock`: a rAF poll on `field.stats.generation`, then `device.queue.onSubmittedWorkDone()` once per step.
- `:627` `stepN++`.
- `:1312` the `orbitalStep` getter ("the cap's witness"). No test or tool reads it.
- `lab/windows/molecules.js:62` passes `field: () => field` into chem only to feed this.

O-BUILD's own numbers are a 40 ms median and a 104 ms worst case per step, and 93-102 ms for the in-app EMA under load. The EMA therefore never exceeds 334, and `stepGap()` is a constant.

**Code-judo move:** `stepGap = () => STEP_MS`; delete `stepClock`, `stepMs`, `stepN`, `orbitalStep` and the `field` api member.

**Deletes:** about 14 lines, a GPU completion poll per step, and a diagnostic in `lab/` (Josh's rule: "diagnostics live in tools/, not lab/").

Fix at the same time:
- the user-visible hint at `lab/shell/modulation.js:133`, "(≥ 120 ms)", which should read 334 ms / 3 a second;
- the comment at `:122`.

**Risk:** none of `timeline` / `routed-knob` / `history` read it. A device slower than 334 ms per rebuild still coalesces, because the latest value wins.

### 7. DITHER's "read once" lift writes the settings blob during a project open (law conflict)
**Where:**
- `lab/shell/persist.js:176`, inside `restore()` and inside the 1,835-char line:
  `if (!hist && +pm.dither > 0 && !('dither' in settingsStore.read())) { …; saveSettings(); }`
- `lab/shell/settings.js:55` always writes `dither: 0` "so a profile older than it is known by its absence". It exists only to make that clause work.

**Law:** CLAUDE.md says "A project open must leave `lambdawaves.q0.settings` byte-identical outside the WORKSPACE keys", and PREFERENCE is "never changed by opening one". W-BUILD concedes the clause holds only on a "strict reading … for every profile that has saved once".

**Code-judo move:** delete the clause. `FIELD_CHROME` already strips DITHER and ignores it, exactly as frame, axis and invert are handled, and 0.3.1 S1 moved those with no lift. The blob may keep `dither` (harmless), but its rationale comment goes.

**Deletes:** one conditional, a settings write on the open path, and ~200 chars of the worst line in `persist.js`.

**Risk:** `tools/settings-probe.mjs` gets cleaner. `tools/serialize-bytes.mjs` is unchanged (the key already leaves projects). An older file's DITHER is no longer adopted. That was a convenience, not a law.

### 8. `waveView`'s silent fallback makes callers special-case `'reim'`
**Where:**
- `lab/field.js` `waveView` maps anything unknown to `'density'`.
- So the callers that must tell "known" from "unknown" re-test the retired name themselves:
  - `lab/rack.js:876` `(VIEW[q] !== undefined || q === 'reim')`;
  - `lab/verbs.js:38` `VIEW[a.id] === undefined && a.id !== 'reim'`.
- Separately, `persist.js` carries two notice lists, `gone` and `cut` (:120, :282), and tests `gone.length || cut.length` twice at :315.

**Code-judo move:**
- `waveView(v)` returns `null` for a name it does not know. Both callers become `const w = waveView(x); if (w) …`. That is skill rule 5: make the boundary explicit instead of using a silent fallback.
- Push W's two sentences onto `gone`, with the prefix moved into the sentence, and drop `cut`.

**Deletes:** two retired-name branches and one parallel list with its doubled conditions.

**Risk:** `lw-links`, `history`, and W-BUILD's probes (`mat.view = 5` → PHASE, `4` → DENSITY, `LW.setView('reim')`).

### 9. Small and certain: dead state, identity wrappers, vestigial DOM
- `app.state.molFormulaScale` / `atomLabelsScale`: declared at `lab/rack.js:120`, written at `lab/shell/stage-words.js:242/244`, read nowhere since I moved the sizes into the record. Delete both slots and both writes.
- `lab/valence.js:12` `export const configOf = (Z) => groundConfig(Z)` is an identity wrapper. It also clashes by name with `atoms.js:122` `configOf`, which has a different domain (Z ≤ 86 against Z ≤ 118). Call `groundConfig` in `valenceOf`.
- `lab/windows/material.js:137-147` `rRef`: a row is created, LOCK is appended to it, LOCK is moved to `.cam-verbs`, and the empty row is then conditionally removed. Delete the row and append LOCK where it ends up.
- `lab/skin.css:326` `.native-clean .bow-hint`: its element left with STATE's impulse block (S).
- `lab/spectrum.js:52-53` RELOAD:
  - It works by querying the kit's internal `.mir-pick` / `.mir-pick-i.on` DOM.
  - It adds a click listener on every list open.
  - It is brittle magic that depends on kit internals. Either put back a RELOAD trig (STATE had one) or file "a re-pick fires onChange" as a MIR issue. CLAUDE.md: "a kit need is a MIR issue".
- `lab/windows/static-field.js` `slap`/`squeezeIn` guard `if (ui.kickRo)` three times. `ui.kickRo` always exists by the time a key fires.
- `lab/chemview.js:750, 953`: `delta && sol && sol.D` is re-tested at both read sites, although `setDelta` and `views()` already keep `delta` false without `sol.D`. Read `delta`.

### 10. Comments and hints that now lie (user-visible ones first)
- `lab/shell/modulation.js:133`, the hint "(≥ 120 ms)". The cap is 334 ms (finding 6).
- `lab/shell/stage-words.js:14`, the PRESETS kind hint "STATE's PRESET and RELOAD, MO-REGISTRY's ORBITAL and STATES presets". STATE has no preset since S, and MO-REGISTRY is gone since U.
- `lab/shell/stage-words.js:16`, the hint "added to MO-REGISTRY".
- `lab/shell/modulation.js:144`, "a lane OR a route: the kit's either-or, the top-most wins". B-BUILD measured the opposite: the kit sums them (`host.js livePos`).
- `orbitalsview.js:652` and `statesview.js:814`, "registerview.js seats it" (finding 1).
- `rack.js:709-713`, the ORBITALS block (finding 5).
- 22 "MO-REGISTRY" mentions remain across lab JS. CLAUDE.md still says "MO-REGISTRY's eight ORBITAL presets".

### 11. `tools/volumes/catalogue/build.py` crosses 1,000 lines (981 → 1,215)
**Where:** C7 added the geometry stage in place, at about :612-760:
- `cached_geometry`, `geometry_job`, `compute_geometry`, `remember_geometry`, `build_geometry`, `_to_build`;
- a hand-rolled fork pool, `_geometry_worker` and `build_in_workers`, about 60 lines;
- the driver, where `_quick` and `_hard` at :746-747 test the same predicate twice, once negated.

**Move:**
- Move the geometry stage into `geom.py` (176 lines, already the geometry module) or a sibling, which brings `build.py` back under 1k.
- Replace the two comprehensions with one `quick(j)` predicate.
- Josh's rule is "never add machinery to go faster". Killing a build on timeout is a correctness need, because an RDKit embedding can run forever. Running jobs in parallel is only for speed, so consider one worker with a timeout.

**Risk:** tools only, and the data steps are on Josh's compute hold. Re-run `--fetch-only` and `check.py`.

### 12. `lab/chemview.js` keeps growing past 1k (1,314 → 1,395)
- O (step cap), U (Δρ switch, download glyph, slots) and M (rows) all landed in a file that was already 146 KB.
- Findings 4 and 6 give back about 25 lines.
- The candidate decomposition seams are THE SHELF / section / download road (`keep`, `lamps`, `header`, `dlShow`, the shelf tiles) and the ORBITAL step road. The first is pure library plumbing that the Picker now duplicates (finding 4).
- No split is proposed until finding 4 lands. The shared helper may be the split.

---

## Clean: do not touch
- **A · atoms.js `groundConfig` as the one source.** valence.js lost its private Madelung order and MOVE table (net −10 lines), Z ≤ 36 is bit-identical by snapshot, and `ZMAX` replaced the scattered 36s. This is the model of a row that deleted duplication.
- **S · STATE → `static-field.js`.** A verbatim move (state.js 213 → 81 lines), with every PROJECT key, `ui.*` name and target unchanged. serialize-bytes shows the edit scope identical and the only full-bytes change is the one WORKSPACE row.
- **I · `INFO_ROWS` → kit `control()` loop** (`informational.js:46-54`). One declarative table drives the store schema and the window, there is one `say(kind)` verb with a closed `KINDS` table, and `settings.js` lost its hand-kept block. The lift follows `liftLook`'s precedent.
- **W · the Re+Im shader branch deleted outright.** Index 5 is retired and never reused, and THE LOCK was trimmed by name rather than re-baked.
- **K · the impulse on its own DOM layer.** It cannot reach a picture by construction (a risk deleted, not guarded), and it writes only when the hold's geometry key changes.
- **P · `swapLine` with one line in flight.** A WeakMap and the animation's own `finished`, with no timers.
- **B · `reg.omorph`.** One constant, one `defs` row, one `modSeats` row; saved state is default-absent, so older files keep their bytes.
- **O · hot re-registration through the kit's own `targets.installOne`.** No new door. The clamp replaced the HOMO fallback.
- **The test discipline:** no new test files or gate scripts. Tests were only re-aimed, and `tools/` changes are one-line plan and fixture edits (apart from finding 11).
