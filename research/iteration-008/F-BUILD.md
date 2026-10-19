# F-BUILD · THE FIX ROUND, A DELETION PASS (iteration 008)

Builder: Opus 5.5, its own worktree, branch `it008-fix` from `68c861d` (after V and G merged). Gate server 9661 / GD 5661, plus the base tree
(`git archive 68c861d`) on 9662 for the comparison runs. Both servers were stopped by pid. NOT pushed.

The two reviews (`REVIEW-QUALITY.md`: twelve findings, `REVIEW-ARCHITECTURE.md`: eight candidates) audited `c73c5c0..34f70c7`. Every finding was
re-measured against `68c861d` before acting, because V (`62c14aa`) and G (`68c861d`) merged after the reviews.

The rule for this pass was to delete code and never change behaviour. Every saved id, every `reg.*` / `chem.*` target, every top-level `__LW`
member (the `lw-facade` pin stays green without `--write`), every WORKSPACE key and the serialize bytes are unchanged (22 / 22 readings
byte-identical to the base). Where a finding needed a behaviour change, it was skipped and the reason is recorded below.

## The measure

| | base `68c861d` | `it008-fix` | Δ |
|---|---:|---:|---:|
| lab JS lines (`find lab -name '*.js' -not -path 'lab/mir/*'`) | 32,588 | **32,556** | −32 |
| lab JS bytes | 2,793,102 | **2,789,521** | −3.6 KB |
| branches (`if (` and `? `, lab JS less sw.js) | 7,744 | **7,705** | −39 |
| rack-deps · molecules (fwd + shared) | 15 | **15** | — |
| rack-deps · spectrum | 25 | **25** | — (not pushed over) |
| rack-deps · persist | 24 | 24 | — (backward 39 → 37: `settingsStore`, `saveSettings`) |
| rack-deps · stage-words | 7 | **5** | −2 (`molFormulaScale`, `atomLabelsScale`) |
| rack-deps · pieces / `app` literal | 38 pieces · state 62 · w 71 | **37** · state 60 · w 70 | one seat fewer; three dead keys |

The line count falls less than the review's ~110 estimate, for two reasons:
- Most of what was deleted sat on long one-line statements.
- The two "one place" moves (C2 `lab/register-morph.js`, 53 lines; C5 `keepSection`, 15 lines) add a module for each pair of copies they delete.

The diff against the base is 314 insertions and 347 deletions over 26 files, `sw.js` included.

## Each finding

| finding | verdict | what was done |
|---|---|---|
| **Q1 · the one switch** (= C3) | **resolved** | See "Q1 · the one switch" below the table. |
| **Q2 · normalise at the stroke's end** | **resolved** | `paintStroke` now sums what `apply` returns (all three appliers already returned a count) and calls `onEnd` only when the sum is > 0. Deleted: the `hit` flag (4 sites), both `stroked` counters, SPECTRUM's `painted` flag with its three late `pointerup` / `pointercancel` / `lostpointercapture` listeners and the comment about listener order, and the two canvas `click` fallbacks. Real pointer clicks are eaten by paint-stroke, and a canvas has no keyboard activation, so those fallbacks were unreachable. |
| **Q3 · EMPTY ↔ FILL ALL and `levelLine`** (= C1) | **resolved, in part** | See "Q3 · EMPTY ↔ FILL ALL and `levelLine`" below the table. |
| **Q4 · the section install** (= C5) | **keepSw already gone by V; the loop resolved** | V had already deleted `keepSw`, and `section()` already derived `lamp` and `keepOffered`. The duplicate loop survived: chemview's `keep()` and the Picker's `pressSec`. Both now call **`library.js` `keepSection(recs, v, { onStep, stop })`**: persist() asked once, fetch what is absent, stop after the record in hand, a step callback, or remove. The Picker's imports shrank to `keepData, keepSection, installed, safariTab`. One timing nuance: chemview's progress line now reports a step after each record rather than before it. |
| **Q5 · MO-REGISTRY's alias seat** | **resolved** | `createMoRegistry()`, the `wOrbs` alias, `app.w.wOrbs` and the boot seat are gone, along with its false five-line ORBITALS comment and its `tools/rack-deps.mjs` PLANNED_CUT anchor. The register is built at the end of `createMolecules` (`say` is lazy). The frame loop reads `canPresent(wChem)` / `powered(wChem)`. CLAUDE.md's R2d sentence now says one seat. |
| **Q6 · the dead step-rate EMA** | **resolved** | `stepGap` is now `STEP_MS`. Deleted: `stepClock` (a rAF poll plus `onSubmittedWorkDone` per step), `stepMs`, `stepN`, the `orbitalStep` getter (a member inside `__LW.chem`, not pinned by `lw-facade`) and molecules' `field` api member. The hint reads "three steps a second at most (one per 334 ms)", and the defs comment says 334 ms. |
| **Q7 · DITHER's lift vs the law** | **resolved: the law wins and the lift stays** | See "Q7 · DITHER's lift vs the law" below the table. |
| **Q8 · `waveView`'s silent fallback** | **resolved, in part** | `waveView` now returns `null` for a name WAVE never had. `?view=` (`rack.js`) and `lw:view` (`verbs.js`) become `if (w)` / `!waveView(id)`, and their `'reim'` re-tests are gone. The three callers that need a view (`persist`, `LW.setView`, `loadPreset`) say `\|\| 'density'`. Restore's notice is composed once into `said`, so the doubled `gone.length \|\| cut.length` tests are gone. `cut` was not folded into `gone`, because `gone` carries the prefix "retired in 0.5.0:" once for all its items; folding would change the notice text. |
| **Q9 · dead state and leftovers** | **resolved, two skipped** | See "Q9 · dead state and leftovers" below the table. |
| **Q10 · stale hints and comments** | **resolved** | The PRESETS kind hint now reads "SPECTRUM's PRESET (a pick of the one shown reloads it), the register's ORBITAL and STATES presets in MOLECULES". REGISTRY ADDS reads "added to MOLECULES' register". The Wigner refusal reads "pick STATES and VIEW REGISTRY in MOLECULES". The `reg.omorph` comment now states what B-BUILD measured: a lane and a route ADD (`host.js livePos`). The 334 ms hint is covered under Q6. The rest of the 22 MO-REGISTRY mentions are history comments, plus the session's claim-reason strings, and were left. CLAUDE.md's THE FADE sentence was corrected. |
| **C2 · one A ↔ B morph** | **resolved** | See "C2 · one A ↔ B morph" below the table. |
| **C6 · MARKS into `lambdawaves.q0.info`** | **resolved** | See "C6 · MARKS into `lambdawaves.q0.info`" below the table. |
| C4 · the valence subshell | **not done (Josh's call)** | Untouched. Only Q9's `configOf` alias went. The Picker's subshell and `fillValence` are unchanged (Fe still reads `3d⁶`). |
| C7 · targets declared by their window | not done (as briefed) | — |
| C8 · MOLECULES' rows as a list | not done (as briefed) | — |
| Q11 · `build.py` > 1k | not done (as briefed: tooling) | — |
| Q12 · `chemview.js` split | not done (as briefed) | Q4 and Q6 gave back 10 lines (1,524 → 1,514; the cut lines were long ones). |

### Q1 · the one switch

What each part now does:
- **Each pane** offers its claim. The internal `setOn` was renamed `claim`, and the pane exports `claim`.
- **registerview** hands each pane `api.want()` and `api.one(v, hand)`.
- **A pane's public `setOn`** is `api.one`, so `__LW.orbitals.setOn` and `__LW.states.setOn` keep their answer: does this register hold the field now.
- **`save()`** writes `on: api.want()` at its old key position.
- **`load()`** lets go of the pane's own claim and calls `api.one(true)` when the record says on.
- **`follow()`** calls `orbitals.claim` / `states.claim`.

Deleted:
- the six reassigned members and their six aliases;
- both unseated REGISTRY ON switches, with every `onSw.set`;
- `says()`'s writes to the label and hint (the refusal sentence still lands on FILL ALL's hover, as before);
- `SW_TITLE` and both `onSwitch` exports;
- statesview's `api.claim` double road. DRIVE and a stick's press call `api.one(true, true)`.

One clause went with the wrapper: `fetchLadder`'s `armed || (wanted.on ? 1 : 0)`. A parked record's `on` was always forced to false by the wrapper, so the clause never fired, and `load` still asks the one switch exactly as the wrapper did.

### Q3 · EMPTY ↔ FILL ALL and `levelLine`

**One button.** `fillButton` moved from a sibling pane (`orbitalsview.js`) into `paint-stroke.js`, next to the gesture it serves.
- SPECTRUM's EMPTY ↔ FILL ALL is now that button in its **words** look (`words = true`): same text, same titles, same press road, which reads the register.
- `paintFill` and its `dataset.empty` cache are gone.
- The hover resync was kept as one line (`pointerenter → fillSync`), because a folded or paused card's rebuild can leave the word stale. Deleting it would change what a hover shows.
- Giving SPECTRUM the register's glyph is a visual change, and the review puts it to Josh, so it was not done.

**`levelLine`.** It is SPECTRUM's own: it lost its `export` and its false "MO-REGISTRY can draw the same line" comment. Drawing the two register ladders with it would change their alphas and widths (0.26 / 0.1 at 2.5 / 1.5 px against 0.42 at 2 / 1 px), which is a visual change, so it was skipped.

### Q7 · DITHER's lift vs the law

The `restore()` clause that wrote the settings blob during a project open is deleted. With it, `persist.js` lost `settingsStore` and `saveSettings`, and line 176 lost about 200 characters.

The one-time lift now happens at the boot's settings read (`settings.js` `applySettings`). When the blob has no `dither` key, it reads the live session (`lambdawaves.q0.session`, through the kit's pure `readSession`). A pre-W session carries `presentation.mat.dither`; a non-zero one is adopted and saved once. A project open therefore never touches the blob, and the profile that worked with DITHER on still gets it.

`docs/STATE-SCOPES.md` was updated to match. The light check confirms it: a blob with no `dither` and a session carrying 1.5 boot to `mat.dither` 1.5 with `dither: 1.5` in the blob.

`settings-probe` is still 4 of 6 red, in exactly the base's pattern: WORKSPACE `closed` / `modwin` differ on reload after a demo open. Q7 turned none of them green, because the probe's fresh profile always has `dither` in its blob, so the old clause never fired there. No PREFERENCE key is moved by any open: 0 PREFERENCE rows in `--out`.

### Q9 · dead state and leftovers

Removed:
- `app.state.molFormulaScale` / `atomLabelsScale` (the slots and their two writes);
- `valence.js` `configOf`; `valenceOf` calls `groundConfig`, with an identical answer (Fe `3d⁶`, C `2p²`);
- CAMERA's empty `rRef` row; LOCK goes straight to `.cam-verbs`, else into the fold;
- `.native-clean .bow-hint` from `skin.css`;
- static-field's three `if (ui.kickRo)` guards.

Skipped:
- chemview's `delta && sol && sol.D`. `load()` sets `delta` before a solve lands, and `views()` clears it on the landing, so reading `delta` alone would answer `'diff'` from `drawn()` before the landing. That is not provably free of behaviour change.
- SPECTRUM's RELOAD, which reaches into the kit's `.mir-pick` DOM. Fixing it is a kit need, filed here as a line for MIR: *the stepper's list should fire `onChange` (or an `onRepick`) when the hand picks the value already shown*. Restoring a RELOAD trig would add UI back, so neither was done.

### C2 · one A ↔ B morph

**`lab/register-morph.js` `createMorph(o)`** owns:
- the two stores, the position, MORPH and its switch;
- the A ↔ B knob and its hand law;
- → A · → B and their lamps;
- pack and unpack (by the pane's key name and validity rule), `path()`, `reset`, `save` and `load`.

Each pane keeps its target id (`reg.omorph` / `reg.morph`), its record shape (ORBITAL writes the morph keys only while a store exists; STATES always writes them) and its own follow-ups. Those follow-ups are:
- **after a store:** ORBITAL marks the register; STATES asks for the vectors and refreshes.
- **after a MORPH change:** repaint, plus a refresh in STATES.
- **after a modulator write:** ORBITAL repaints only while MORPH plays; STATES marks the register.

Deleted: two copies of the stores, `setMorph`, `store`, `packStore`, `unpackStore`, and the four-line knob/switch builders.

One pre-existing inconsistency was kept exactly as it was and is recorded for Josh: ORBITAL toggles `.reg-morphing` (the lanes dimmed) on a load and a reset, but STATES only on a press. A restored STATES MORPH therefore plays without dimming its lanes. Making STATES match is a one-line follow-up.

### C6 · MARKS into `lambdawaves.q0.info`

- SKELETON · BEAD · UNCERTAINTY are three `INFO_ROWS` (group `marks`, keys `skeleton` / `bead` / `ellipsoid`, the old titles as hints).
- INFORMATIONAL builds them with its control loop. `ui.skeletonSw` / `beadSw` / `ellipsoidSw` are those controls' widgets, so the frame loop is unchanged.
- A change repaints through the record's own subscriber.
- `infoPrefs()` lifts any of the three it finds in the blob, whenever it finds them. The blob writes them only while they are on, so the lift is lossless. The keys then leave the blob.
- `settings.js` lost the three writes and the three reads. FORGET reaches MARKS through the record.
- The light check confirms it: a blob holding `skeleton` and `bead` boots with the record holding both, the switches lit, and the blob clean.

## The suites (the RTX shared with three solvers: GPU 100 % P2, load average ≈ 15)

| suite | result |
|---|---|
| `./test.sh node` | **exit 0** after `node tests/pwa.test.mjs --write`. One earlier run was red only on `wigner.test` W42-8, the known timing row under the solvers. It was green on the next full run. |
| `node tools/rack-deps.mjs --classes --no-write` · `tests/rack-deps.test.mjs` | HOLDS (spectrum 25, molecules 15, 37 pieces) · PASS (exit 0) |
| `node tools/new-project.mjs --check` | in step (16100 B) |
| `register` | **22 / 22**. R9 was red twice in a row mid-round and green on the next run. Its chem-flow seed at "still" depends on whether the kick's factors had landed (base data: still count 220; red data: 0, so the run never reseeds). The base tree was green in its single run beside it. This is timing under load, not this pass. |
| `orbitals` | 23 / 24. L9 (≥ 10 dispatches in 700 ms) read 7–8, the GPU-load row U-BUILD and B-BUILD measured red at their bases. |
| `chem` | 54 / 56. L5 (MORE folded on a first run) and L7 (glycine timing under load) are the same two reds U, M and V reported. |
| `history` · `lw-facade` · `lw-links` · `new-project` · `project-formats` | all exit 0. `lw-facade` needed no pin change. |
| `stage-text` | red at its section 3 (`.dev[data-id="orbitals"] .reg-bar select` is null). The base tree is **red identically** (run on 9662): the suite still looks for the MO-REGISTRY window U retired. Pre-existing; it needs re-aiming at `.dev[data-id="chem"] .reg-pane .reg-bar select`. |
| `menubar` | red on `styles: false` against `true`. The base tree is **red identically**: G's GRAIN → DUST. Pre-existing. |
| `library` | 4 / 5. Step 5 ("the refusal is not named") is the red V-BUILD measured at its base. |
| `tools/settings-probe.mjs` | 4 of 6 scenes red, the base's WORKSPACE pattern. No PREFERENCE key moved by any open. Q7 turned none green (see Q7). |
| `tools/serialize-bytes.mjs` (this tree on 9661 against the base on 9662) | **22 / 22 sha-256 identical**: 11 full, 11 edit. |
| the light check (`.tmp/f/probe.mjs`, scratch, not committed) | **6 / 6**: the DITHER lift from the session; the MARKS lift; ORBITAL → A, → B, MORPH 0.5, the record `{ on, selection, morph, morphOn, A, B }` round-tripping with the lamps lit and `reg.omorph` registered; the one switch (setOn → VIEW REGISTRY and `orbital-packet`, saved on true; VIEW DENSITY lets go, saved on false, MOLECULES stays on, no `.orb-on` in the DOM); SPECTRUM's EMPTY ↔ FILL ALL flipping 0 ↔ 91 with its word. 0 page errors. |

## Commits (on `it008-fix`, small, one finding or cluster each)
`667abb3` Q6 · `fc164cc` Q9 + Q10 · `6752b87` Q7 · `8ee58ff` Q8 · `eb675b6` Q2 + Q3 (C1) · `2924a25` Q1 + Q5 (C3) · `ab9693b` C2 · `8269422` Q4 (C5) ·
`ad9ae9c` C6 · `69e1c37` CLAUDE.md · then this note with `pwa --write`.

## For the integrator / next
- Merge `it008-fix`, run `node tests/pwa.test.mjs --write` and `./test.sh node`.
- Re-aim `tests/stage-text.browser-test.mjs` §3 at the chem card's register pane. It has been red since U, at the base too.
- Re-aim `menubar`'s `styles` row after G. Also pre-existing.
- For Josh:
  - Should SPECTRUM's EMPTY ↔ FILL ALL wear the register's glyph? (Q3 / C1)
  - Should the register ladders take SPECTRUM's line alpha? (Q3)
  - Should STATES' lanes dim under a restored MORPH? (C2)
  - Should LOAD VALENCE load the open subshell? (C4)
- Kit lines (MIR):
  - a stepper re-pick fires `onChange` (SPECTRUM's RELOAD);
  - the kit knob's fixed range (C7, carried).
