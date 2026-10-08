# AUDIT-OPUS-1 · the senior audit of PLAN-DRAFT-1 for 0.5.0, and the plan as edited (Opus 5.5, 2026-10-08)

**AUDIT: COMPLETE** (written under a 98 % usage alarm. Part A is the edited plan. Part B holds the notes. Every number was checked on this tree, `7d10a63`, except where it is marked ESTIMATE or UNMEASURED.)

I read the following whole: `NACRE.md`, `PLAN-DRAFT-0.md`, `REVIEW-SONNET-0.md`, `PLAN-DRAFT-1.md`, the 0.4.0 `AUDIT-OPUS-1.md` (for its shape) and `PLAN.md` (§1–§10), `survey/MIR-1.5.md`, `docs/MIR-1.5-CANARY.md`, `KIT-BRIEFS.md`, the S0 / S1-NAMES / S1-CAMERAEYE / S2 / S3 / S4a / S4c hand-offs (S4b I read by its summary and greps), `CLAUDE.md`, `docs/STATE-SCOPES.md`, HANDOFF §2 (its last three updates), the kit's `ADOPTING-1.5.md`, `INFORMATIONAL.md` and `PROMPT.md`, and the SIBLINGS rows 8, 19, 20, 21, 24, 27 and 33. I checked the line citations by grep on single files: `lab/rack.js` (5,728 lines), `lab/sw.js`, `tests/wiring.test.mjs`, `tests/pwa.test.mjs`, `lab/mir/modulation/host.js`, `lab/index.html`, `lab/skin.css`, `lab/lab.css` and `tools/perf/digest-lock.mjs`. I ran nothing except `ls`, `grep`, `sed`, `awk` and `wc`. I edited no file but this one.

**Since the draft (the coordinator's facts, 10:50 CDT).** A5 is done on its branch: `lab/mod-port.js` is 119 lines, `rack.js` is −163, all gates are green, and A6 has not started. A9 is done, A10 is half-built and A11 has not started (hand-off `b6dfda6`). A4 is parked unmerged as the reference build.

---

# PART A — THE PLAN, AS EDITED (PLAN-DRAFT-1 · OPUS EDIT, for DRAFT 2)

*Every change is marked **[OPUS: …]**. A struck line is ~~struck~~ and its reason is given. Unmarked text is DRAFT 1's, kept as it was.*

# λWAVES 0.5.0 — PLAN-DRAFT-1 (Fable, 2026-10-08, after REVIEW-SONNET-0) · OPUS EDIT

**One sentence.** 0.5.0 is THE ADOPTION of MIR 1.5 — λWAVES' interface code becomes the kit's — and then THE INFORMATIONAL. This draft takes the review's ten changes: stage A is cut to the seams the canary names plus the glue-first seams, measured on this tree; C gains its row 0 and a dependency table; the default is a pinned alpha, re-adopted once at the cut; the dial is reset.

**[OPUS: The release is judged by one number before any feature: `lab/*.js` falls. 0.4.0 added +1,559 lines (34,721 → 36,280, measured) against its own law, and every stage of it added lines. 0.5.0 is the release in which the subtraction must actually land. So stage A is cut to what C cannot do without. Each A seam books its line delta, and A is allowed to rise by at most +150 lines in total. D carries a running ledger whose net must be ≤ 0 (§2 D).]**

## 0 · The inputs, measured on this tree (not the survey's)

| input | value | source |
|---|---|---|
| `lab/*.js` | **36,280** lines (0.4.0 added **+1,559**, +4.5 %, from 34,721 at PLAN §3; no 0.4.0 stage met "lines down") | `wc -l`; S3/S4a/S4b/S4c-BUILD **[OPUS: re-measured 36,280 at `7d10a63`]** |
| the gates | **85 node suites, 27 browser suites** (the canary's "82" is stale) | `ls tests` **[OPUS: confirmed]** |
| precache today | 188 files, **4.53 MiB**; ceiling 8 MiB (`pwa.test.mjs:302`) | S4a-BUILD **[OPUS: :302 confirmed]** |
| the canary (alpha.23 on `61f7c2c`) | boots; 7 node reds (regex/inventory, not behaviour); +196 kit files, 4.63 → 9.46 MiB; **136–150 of 595 elements restyled per state** (1,172 element-states over 8 states; BASINS' first look was 192 elements); browser 3/3 | `docs/MIR-1.5-CANARY.md` |
| the kit | 1.5 line at **alpha.24**; no `cells.js`, no `lattice.js`, no `info/window.js`, no `paintedSpace`; `host.js:474 demand(id, on)` exists on 1.4.3 already | `ls mir/controls mir/info`; `lab/mir/modulation/host.js` **[OPUS: :474 confirmed. `anyLive()` at `host.js:226` counts `demands.size` through `anyRouted` (:223). So a held `demand('app.play')` lifts the `nothing-to-run` refusal at `:347–352` on 1.4.3 itself. A6's mechanism is real today.]** |
| BASINS | +1,850 / −19,320 app lines over 11 stages; four parity re-adopts; stage 8: **+13 ms/s** main-thread while playing (45.0 vs 32.0) found only by measurement | survey §2.1 **[OPUS: +13 ms/s is +40 % of BASINS' own busy time (32 ms/s). It is not "1.3 %". The signal is large relative to the app's main-thread budget, and it is the budget that matters.]** |
| the wiring clock | five allowlist rows dated 2026-10-07, `EXPIRE_DAYS = 60`: **red on 2026-12-06** (warning from 10-21); their stated consumer is "the 0.5.0 adoption" | `tests/wiring.test.mjs:61–65, :463` **[OPUS: confirmed. In the 1.5 kit, `gui.js` imports `accent.js` and `about.js`, and `notebook.js` imports `about.js`. So C2 (createGui) and C6 (createNotebook) consume four of the five rows; `wordmark`/`menubar` are consumed at C3.]** |
| the test surface | `__LW.layout` 137 call sites, `.mod` 93, `.history` 67, `.keys` 13, `.projects` 8, `.notebook` 8 = **326** | grep over `tests/` **[OPUS: 326 is only the six groups that C3–C6 swap. The whole surface is **1,507 uses of 96 distinct `__LW` members in 29 test files** (`__LW.chem` 212, `.settle` 111, `.states` 84 …). The law below covers all of them.]** |
| the briefs | 17 written (`KIT-BRIEFS.md`), 677 gross lines on adoption; briefs 1, P, J, 3 (411 lines) had no consuming row in DRAFT 0 | KIT-BRIEFS §"Counted ports" |

## 1 · The gates, and what each really blocks

| gate | state | blocks | does not block |
|---|---|---|---|
| **G1 · the briefs in the kit** (8 first; then 2, 3, 4, 7, 13) | unbuilt in alpha.24 | **C8** (occlusion by `paintedSpace`), **D1** (the window), **D5** (film overlay, TAKE MODE), **D7** (cells, lattice) | **C0–C7** — every brief's "Interim" paragraph keeps the app's road (the enumerator, the PAN knobs, the pickers, the caption, `createStageText`) |
| **G2 · which kit** | the `1.5.0` cut is open; the line moves (alpha.22→23: one file; 23→24: one commit) | nothing, once pinned | — |
| **G3 · the first look** (the glass is Josh's) | — | C0's INTENT rulings | — |

**R5-G1 (default = the first):** **pin alpha.24 at C0, freeze it in `MIR-MANIFEST.json`, and re-adopt ONCE** ~~at the `1.5.0` cut~~ **[OPUS: at the first kit version that carries brief 8, whether or not that version is the cut. C8 and D1 can start only then. A second re-adopt follows only if `1.5.0` is cut later. "Once at the cut" assumes the briefs ride in the cut, and nothing says they will. The budget is one re-adopt and at most two.]** (BASINS re-adopted four times.) · wait for the cut · adopt every alpha. Who builds the briefs in MIR is Josh's scheduling, not a plan line (§3 Q2). **[OPUS: The HANDOFF update of ~07:45 launched stage A under "R5-G1 wait" as the default. DRAFT 1 flips that default. The flip needs Josh's word before C0, but it does not need his word before A, because A is the same work under either default.]**

**Dependency table (row → brief; "—" = none):** C0–C7 — · C8 8 · C9 9′ · D1 13 + 7 · D2 3 (the journal: TO NOTEBOOK / PIN) · D3 — (+ the 18th brief, label avoidance) · D4 — or a 19th brief (a layer that hosts an element) · D5 6 + 7 · D6 — · D7 4 + 5 · D8 — · D9 —.

## 2 · The stages

### A · THE SEAMS (λWAVES only; `lab/mir` untouched; measured, not "lines down")

The acceptance of the whole stage: **the throwaway canary on alpha.24 shows the red list reduced to the kit's own deltas**, every `__LW` verb the tests use unchanged (~~326 sites~~ **[OPUS: all 96 members, 1,507 uses]**), ~~serialize bytes identical on N snapshots (W130's gate)~~ **[OPUS: struck, because no A seam touches `serialize` any more (A3 moves to C6). The byte gate goes with it.]** and a whole-`localStorage` diff empty outside WORKSPACE after a project open. **Lines are measured per seam and may rise** (W130: +41 for two seams). The subtraction is booked at C3/C4. There is one ledger line in REPORT per seam. **[OPUS: A as a whole is capped at +150 lines. A5 has already come in at −44 (`mod-port.js` +119, `rack.js` −163).]** No verifier agent. The frame-loop seams (A6, A7) get the S2 pattern: the device report back to back at equal load, plus their owning suite.

**[OPUS: THE `__LW` LAW (replaces A12).** No A or C commit renames or removes a `__LW` member that a test uses, unless the test is edited in the same commit. That is a rule, not a stage, and it costs 0 lines.]**

| # | seam | sites on this tree | gate (the closer that can see it) |
|---|---|---|---|
| **A0** | **the canary re-run** on THIS tree (85 suites) and on alpha.24 **[OPUS: this half is already the A9–A11 builder's throwaway (its brief names it). A0 does not run it a second time; it reads that run's row.]** … **the INFORMATIONAL spike**: mount `createInfoLayer` (it exists in alpha.24) over the stage in the throwaway with two labels and a block — `viewChanged` cost per frame under AUTO-ROTATE, legibility over 1s+2p, benzene's HOMO and C₆₀, a label under a rack column **[OPUS: the measurements that decide D are listed in Part B §6. The stylehash recipe that opens the modulation window and the notebook stays in A0, because R13 has to be sized before C4.]**; the M5/WebKit commands for Josh (`?report=1&post=1`, `limits.html`, the persist probe) | ~~a Sonnet task~~ **[OPUS: an Opus task. The spike writes code against a layer no app has run, over WebGPU, and its numbers decide D4, the ink brief and D1's release. Opus is for builders.]**; nothing committed from the throwaway | the row; the spike decides D4, the ink-mode brief and whether D1 is 0.5.0 or 0.5.1 |
| **A10** | tests find things by hook (26 id selectors: `#modwin` 12, `#offer` 6, `#notebook` 4, `#rackAddList` 2, `#keymap` 1, `#sheet` 1; 50 `.km-`/chip-rail lines in 7 suites); the canary's four rewrites (`mir.test` §16 + import list → the manifest's inventory and exported names; `mir-manifest` accepts a pre-release + `"line"`; `slider-keys` reads `setKnobLaw().keyFine`; `access` A8 reads rendered text); **the driver-port race fixed once in `tools/gate/drv.mjs`** (a 4 s settle), not per test **[OPUS: `mir-manifest` keeps S0's per-version sha-256 pin (`ACCEPTED`, the forgery gate). Accepting a pre-release means that alpha.24's hash enters `ACCEPTED` at C0, in C0's two-file edit, and never before. The regex may widen now; the accepted set may not. PLAN §10 N4 put these rewrites in "the adoption's first commit, not before". Doing them in A is allowed only where the untouched 1.4.3 tree stays green and no pin is weakened.]** | `tests/` | node green on the untouched tree AND the throwaway; `history` 39 and `offer` 16 without a pause hack |
| **A11** | the kit precache rule: **"precache what a root reaches"** (PLAN §10 N4's design) ~~; it also closes the `wiring` red of 109 unreached modules~~ **[OPUS: struck, because it is wrong. `pwa.test.mjs:244–251` derives the unprecached set from wiring's ALLOWLIST, and `wiring.test.mjs` FAILS on any `lab/**/*.js` that no root reaches, precached or not. The precache rule fixes the bytes; it does not fix the orphan gate. A11 must also state the WIRING LAW FOR ADOPTED KIT FILES. Proposal: a file listed in `MIR-MANIFEST.json`'s inventory and reached by no root is reported (name and KB) and NOT precached, but does not fail, because it is the kit's and λWAVES may not edit or delete it. App files keep the hard gate. This also retires the five dated rows: they become kit files under the rule. So 2026-12-06 stops being a date, provided Josh rules it (R5-W1, §3). ANTI-PATTERN 17 is about inert APP code that visitors download, and both halves of it survive.]** with `mir/locales/` and `mir/tokens.json` lazy; `sw.js` §1b's `DATA` semantic (page-written cache, `sw.js:224–231`) stays separate; `tools/new-project.mjs` regeneration as a **documented adoption step** (bpm 60 → 30) | `sw.js`, `pwa.test`, `wiring.test`, `build-deploy` | `pwa` ≤ 8 MiB on the throwaway with the headroom stated (≈ 0.7 MiB today); `wiring` green there **[OPUS: under the stated law]**; the five dated allowlist rows consumed before **2026-12-06** |
| **A1** | the settings adapter `{read, write}` over `lambdawaves.q0.settings`. It owns the blob's **8 write sites** (`:193, :1309, :2779, :3825, :3829, :4288, :4291, :5648`) and SAYS which other families stay (`NB_*`, `PJ_KEY`, `LS_EXP/LS_PRES`, keys, library) | `:170–331` **[OPUS: `:170–319`. `applySettings` closes at `:319`; 320–331 is the RETIRED_WINDOWS comment. `:1309` is a `removeItem` (FORGET), so it is 7 writes and 1 remove.]** + the 8 | ~~serialize bytes on 11 snapshots;~~ **[OPUS: the settings blob byte-identical across boot → save → reload on the 4 demos + the empty project, then the whole-`localStorage` diff]** |
| ~~**A3**~~ | ~~project parts with `capture/restore/signature` …~~ **[OPUS: STRUCK from A as code; it moves to C6. The canary named no A3 block. SIBLINGS row 27 says "do last, behind the byte gates". Splitting `serialize`/`restore` (~280 lines) twice, once now and once at C6, is churn. What A keeps is the DECISION, written into this plan now: `installModulation({ project: false })`. λWAVES' `modulation` record already carries transport and BPM, and WORKSPACE `layout` already travels with a project, so a kit `rack`/`bpm` part would be a second source of truth (ADOPTING §13). At C6, λWAVES registers ONE part over `serialize()` / `restore()` with `signature = projectKey()`. It is split only if FOLDERS' per-part rollback shows a case the one part cannot name.]** | — | — |
| **A6** | the one-clock facade `{play, pause, isPlaying, toggle, onChange, seek}` that **holds `host.clock.demand('app.play', true)`** while THE play runs (the mechanism exists at `host.js:474`). This closes S0's open item (fresh-boot/NEW refusal). ~~R-B1's retirement of LINKED/SEPARATE and the three PREFERENCE keys lands with it IF its gates hold, else at C4~~ **[OPUS: the demand is held only while `modArm && clockLink`, so today's MOD arm (Ctrl+Space) keeps its meaning. The retirement of LINKED/SEPARATE and of `modArm`/`clockLink`/`modCadence` in PREFERENCE goes to C4 unconditionally: it changes STATE-SCOPES, `new-project`, five `__LW.mod.clockLink` test sites and a key row, which is a behaviour change Josh sees, and that belongs with the kit window that replaces it. The LINKED follow/retry block `:912–921` and the re-arm at `:2749` (missing from DRAFT 1's list) become dead and are deleted: −11 lines.]** | `:550–551, :912–921` (in `loop()`), `:2749`, `:2759, :3064–3103, :4736 (A9's row), :5413–5414, :5697, :199, :296–298` **[OPUS: each confirmed]** | the four scenes: play with editor closed / no routes / power off SUCCEEDS; pause releases; a routed source follows the one clock; the bare host still refuses; `history`, `take-in-bugs`, `mir-controls`, ~~`render-exact`~~ **[OPUS: struck, because A6 does not touch capture]**; device report back to back. **[OPUS: `current` is not a closer: it fails the same way on the untouched base (S2, S3).]** |
| **A5** | the modulation port as the `port` object (`defs :2530–2644`, `createModHost :2645–2653`, adapters + `modDodge :2654–2743`, the port `:2744–2786`, `modSyncBases :572–607`, `LW.mod ≈ :5395–5430` ≈ **330 lines**; the saving is C4's) **[OPUS: DONE. `lab/mod-port.js` 119, `rack.js` −163 = −44. `LW.mod` starts at `:5404`.]** | those | `mir-controls`, `lfo-tension`, `routed-knob`, `history`, the deterministic-replay judges |
| **A8** | the camera port `{get, set, subscribe, turn, home, ranges, angle:'rad'}` + **the bindings as ONE data table** in `stage-gestures.js` (today `e.altKey && !e.ctrlKey ? slide(e) : startSpecial(e)` is code) so Josh's change (§3 R5-C1) is a diff of data and brief 1 receives it as configuration | `:1258, :1525–1589` **[OPUS: `:1525–1571`. CAMERA MOTION ends at `:1571`; 1573–1589 is CAPTURE's header comment.]**`, :2542–2545, :3220, :3349, :4616, :4820`; `stage-gestures.js` | `camera-shift` 11, `render-regressions`; no lock (no `writeView` change) |
| **A9** | the ACTIONS table … R-K1's first half (S stays WASD; FOLDERS' chord proposed) — its second half is **already** the binding (`:4736` Space + ctrl) … | `:4683–4760` **[OPUS: `:4683–4750`; the table closes at `:4750`. DONE per the coordinator.]**, `:1229–2800` | `keyboard-shortcuts`, `keyboard-window`, a `Ctrl`-vs-`Mod` case |
| **A7** | occlusion providers per window species; `refreshOcclusion` concatenates; producers stay where they are (`:2700` A5's, `:3503`, `:3527` A4's, `:3995`) | `:3464–3512` | `frame-occlusion` 7/7 (its kit species come at C0); the device report back to back; **the lock cannot see this** (`digest-lock.mjs:34` sets occlusion itself) **[OPUS: confirmed at `:34`]** |
| ~~**A12**~~ | ~~the `__LW` surface as ONE object with named groups~~ **[OPUS: STRUCK. Its citations are wrong as well: `api` is `:1211–1251`, not `–1265`, and the `LW` literal is `:5330–5580`, not `–5608` (`:5595–5607` is `Object.assign(DIGESTS, …)`). Merging the two literals adds a refactor that every group would conflict on, and it subtracts nothing. The `__LW` law above does its job at 0 lines.]** | — | — |
| ~~**A4**~~ | ~~(last, reduced) "zero references outside the block" for the floating rack …~~ **[OPUS: STRUCK as a stage. `createRack` adopts `#rack #rackL #floats` by id, so the 19 outside references stay valid after C3. Their only value was the test surface, and the `__LW` law carries that. A4's parked branch stays a reference for C3 and is never merged.]** | — | — |

**The eleven shared sites** (REVIEW-SONNET-0 §1.6) decide the grouping. ~~Z = A10 + A11 · X = A1 + A3 + A6 · Y = A5 + A8 · then A9, A7 · A12 and A4 last~~ **[OPUS: the grouping, as it must be given what is in flight. Wave 1 (in flight): A5+A6 (A5 done, A6 next, same builder) ∥ A9+A10+A11 (A9 done). Wave 2 starts after both merge: A1+A8 as one builder (A1 shares `:199/:296–298` with A6, and A8 shares `:2542–2545` with A5) ∥ A7 (its producers are in A5's region, now `mod-port.js`). At most two builders at once on `rack.js`; three only when one of them is A0's spike, which touches only a throwaway. Sizes: A5+A6 M · A9–A11 M (the iterative red list + the wiring law) · A1+A8 M · A7 S · A0 M.]** ~~Three builders at a time at most~~ … ~~Sizes: Z M · X L · Y M · A9 S · A7 S · A12 S · A4 S.~~

### B · THE CANARY, ~~three times (not once)~~ **[OPUS: twice]**

A0 above (now, alpha.24 on this tree) · ~~after Z/X/Y (the red list should be the kit's deltas only)~~ **[OPUS: struck. A10's acceptance ("node green on the throwaway") IS that run, so a middle canary repeats it.]** · at the re-adopt. Each: adopt into a throwaway, `pwa --write`, 85 node, ~~27 browser once~~ **[OPUS: A0 runs the 9 browser suites that touch kit-derived DOM (`frame-occlusion`, `history`, `new-project`, `mir-controls`, `lfo-tension`, `routed-knob`, `keyboard-window`, `offer`, `official-defaults-palette`). The re-adopt runs all 27, because by then C0 is real.]**, stylehash with the modulation window and notebook open, precache bytes; plus the M5/WebKit half the kit instruments (`probe.mjs serve`, `check-app.mjs --webkit`) — one command for Josh each time. Nothing committed from a throwaway.

### C · THE ADOPTION (pinned alpha; the survey's leverage order; one verifier)

| # | consumer | what leaves | what stays / is new | closer |
|---|---|---|---|---|
| **C0** | **the bare adopt and the cascade** … the manifest pinned at alpha.24 **[OPUS: + alpha.24's sha-256 enters `ACCEPTED` (the two-file edit S0 defined); + the wiring law of A11 applies from this commit]** | — | the kit's bytes | stylehash … **seven property classes** … each an INTENT ruling by Josh with a screenshot, or a bug; `adopt.mjs --check` in step |
| C1 | the CAMERA panel through A8's port … + RAMP/GRADE | `paletteview.js` 156, CAMERA MOTION ~~65~~ **[OPUS: 47, `:1525–1571`]** | saved routes … | `camera-shift`, `palette`, the route script |
| C2 | `createGui` + `createPrefs` + `createAccent` … | INTERFACE + THEME·SURFACE ~155, `accent-wheel.js` 152, `native-ui`/`first-run` partly | the invariant widened to a whole-`localStorage` snapshot minus WORKSPACE … **the settings-surface ruling** (§3 R5-S1) | `first-run`, `official-defaults-palette`, `new-project`, the snapshot diff, stylehash per class |
| C3 | rack + transport + menubar + keys + keyboard | … | **`keyboard-window.browser-test` rewritten wholesale** … **[OPUS: + `__LW.layout`'s 137 test uses keep their verbs (A4's reference branch shows the block's seams)]** | `menubar`, `keyboard-window`, `keyboard-shortcuts`, `frame-occlusion` over `[data-mir-window]` |
| C4 | the modulation window + one clock … | `modwindow.js` 3,110, `lab.css :405–419, :813–841`, `audio.js` 438 | **[OPUS: R-B1 complete here: LINKED/SEPARATE retired, the three keys leave PREFERENCE, STATE-SCOPES and `new-project` regenerated, `installModulation({ project: false })` (A3's decision)]** | `mir-controls`, `lfo-tension`, `routed-knob`, `history`, `take-in-bugs`, the replay judges |
| C5 | history as the one `edit` domain | `history.js` 187, the card ~50 | `history.clear(label)` | `history` 39 (port race fixed in A10) |
| C6 | FOLDERS + notebook pages + project parts + **session/opener** … **[OPUS: + A3 moved here: ONE part over `serialize()`/`restore()`, `signature = projectKey()`; serialize bytes identical on the 4 demos + the empty project + 6 history snapshots (W130's gate, moved with it)]** | PROJECTS ~330 …, `project-storage`/`-import` 66 | **R10's fixture** … | `new-project` 8, `history`, `offer`, `molecule-demos`, the new fixture suite |
| C7 | the film: `createRecorder` with `frame(i, ctx)` | ~1,200–1,800 of `capture.js` + `render-exact.js` (**2,360** now) | **say what stays** … **the determinism verifier is here** (shared with D5) **[OPUS: + THE ONE LOCK of stage C runs here, the 1004 and the 1148, because C7 is the only C row on the readback path. C-V runs no lock.]** | `render-exact`, `export3d`, a PNG/loop/video |
| C8 | occlusion by brief 8's `paintedSpace` … | the enumerator | … | `frame-occlusion` on moved, scrolled, folded, paused windows |
| C9 | the offline layer stays the app's (R4) … **the scene guard** … **R14** … | — | — | `pwa`, `wiring`, `mir-manifest`, `offer` 16 (+ the STATUS TAGS case), hit-probe, `gpu-recovery` |
| **C-V** | the adoption verifier (fresh Opus), scoped … **main-thread ms/s while playing by CDP `Performance.getMetrics`** (~~ScriptDuration + Layout + RecalcStyle~~ **[OPUS: `TaskDuration` as the headline, with Script/Layout/RecalcStyle as attribution]** deltas; `tools/perf/cdp.mjs`) against a baseline taken BEFORE C on the 3070 ~~and the M5~~ **[OPUS: CDP cannot reach Safari on the M5. The M5 half is the device report pair (`?report=1&post=1`, Josh's command), recorded as "M5 pending" if absent, as in 0.4.0. No stage hangs on it.]** ~~— the metric that sees 1.3 %~~; `adopt.mjs --check`; ~~**one** 1004 + one 1148 lock~~ **[OPUS: moved to C7]**; the `__LW` surface unchanged | | | |

Done when: the 15 risks each closed by the named closer (R10's and R14's are new suites); stylehash seven classes ruled; ms/s equal within the baseline's ~~noise~~ **[OPUS: measured spread (Part B §5)]**; `lab/*.js` in ~~**26.8–28.8k**~~ **[OPUS: **28.2–29.6k, ESTIMATE** (Part B §7). The survey's 9.0–10.5k "out" includes 0.47–0.70k of CSS (a third to a half of `lab.css` + `skin.css`, not `lab/*.js`), the ~495 nested lines, and a look block measured at ~155 rather than ~267. JS-only out ≈ 8.4–9.1k. C7 is the swing: if the film slips, add 1.2–1.8k.]** + the seams' ledger; CLAUDE.md rewritten for the kit's windows.

### D · THE INFORMATIONAL (gated on G1 for D1/D5/D7; the A0 spike decides its shape)

**[OPUS: D's LEDGER.** D runs one "one in, one out" ledger across all its rows, and its net `lab/*.js` must be ≤ 0. D9 is the row that pays for D: `qcd.js`+`qcdview.js` 219, `h2.js`+`h2ci.js`+`h2view.js` 598, `helium.js`+`heliumview.js` 215, `electrostatics.js` 437 (measured file sizes, before what each keeps). So **D9 runs first in D**, and its decision is Josh's by name (R5-L1). D10 enters only as far as the ledger pays.]**

| # | piece | rule | closer |
|---|---|---|---|
| D1 | the window (brief 13), the DISPLAY switch …; `stage-text.js` → `addBlock` / `addLabel({ttl})` / `addLabel({anchor})` … | **a cost number first** (A0's spike …) **[OPUS: the app calls `viewChanged()` only when `cameraKey` (with the shift), the size or the stage rect changed, which is the key the atom labels already use. It never calls it per tick.]** | the spike's budget held; 0 per-tick layout reads by the layer's own witness |
| D2 | **pages generated from the records** … | **no model-authored number** … | … |
| D3 | feature labels … | **the 18th brief**: label avoidance of windows … | labels follow a turn and hold still after |
| D4 | the overlays … — **text only** through the layer, or **a 19th brief** … | the spike decides **[OPUS: default TEXT ONLY in 0.5.0, and the 19th brief goes to 0.5.x unless the spike shows the sanitiser keeps an image block (Part B §6)]** | a moved label persists |
| D5 | the film overlay (brief 6) + TAKE MODE (brief 7); the caption retired | the determinism verifier shared with C7 | … |
| D6 | FIGURE, chips, FLY-TO + search, SCENES …, MAPS … | **one in, one out** per piece | per piece |
| D7 | the pad with the lattice … and `cells` … | — | ATOMS and MOLECULES suites |
| D8 | R-I2: `lw:` links and the HUD … | one banner per hand press | — |
| D9 | the legacy five … **[OPUS: FIRST in D (the ledger)]** | lines DOWN | the history/project suites open an old file naming them |
| D10 | **restored from PLAN §8 …** 8, 19, 20, 21, 24; briefs **P** and **J** consumed at C3/C2; brief **1** optional | **[OPUS: each row enters only if the ledger pays for it. 19 (the flash guard) and 21 (the ink law) come first, because the photosensitivity trap and the ink are laws and the others are features. 8, 20 and 24 go to 0.5.x if D's net would rise. A row named in PLAN §8 and moved to 0.5.x is listed in §6.]** | per row |

Then **cut 0.5.0-alpha** locally. **0.4.1 BUCKYBALL** … (unchanged). **The 0.5.0 minimum (R5-Q2)** … (unchanged).

## 3 · Rulings for Josh (first option = default) and the three questions

*(DRAFT 1's list is kept. The edits:)*
- **R5-G1** pin alpha.24 at C0, re-adopt once **[OPUS: at the first kit version carrying brief 8]** · wait for the cut · adopt every alpha.
- **[OPUS: NEW · R5-W1 the wiring law for adopted kit files** (A11): **an unreached kit file listed in the manifest is reported, not precached and not failed; app files keep the hard gate; the five dated rows retire with it** · keep the hard gate and allowlist each kit orphan by name (109 at alpha.23) · renew the five rows a second time and decide at C0.]**
- **[OPUS: NEW · R5-A3 one project part or many:** **one part over `serialize()`, `installModulation({ project: false })`** · split into kit parts (`rack`, `bpm`, `pages`, `accent` …).]**
- R5-C1, R5-Q2, R5-S1/S2/S3, R-B1, R-K1, R-D1, R-I2, R-I3, R5-I4, R5-L1, R5-D2 and the one-line defaults: kept as DRAFT 1 wrote them. **[OPUS: R5-L1 is promoted, because D9 pays for D. It is the ruling to ask first after R5-G1.]**
- Carried from 0.4.0 … (unchanged).

## 4 · The numbers: measured, estimated, to take

Measured: §0's table **[OPUS: + 1,507 / 96 `__LW` uses; the wiring/precache coupling `pwa.test.mjs:244–251`; A5's −44]** … Estimated (say so wherever used): ~~9,000–10,500 out~~ **[OPUS: JS-only 8.4–9.1k out (the survey's figure less its CSS and nested lines); 1.0–1.5k back; at C-V 28.2–29.6k]** … **To take, with the method:** main-thread ms/s while playing (CDP `TaskDuration` deltas, **[OPUS: interleaved A/B/A/B/A/B, 5 runs each, at load average < 4 with no sibling agent on the GPU; the noise floor is the spread of the 5 same-tree runs and is UNMEASURED today]**, 3070 only; the M5 by device report) BEFORE C …

## 5 · Order and the dial

A0 ~~(Sonnet)~~ **[OPUS: (Opus; the spike only)]** · ~~Z, then X and Y in parallel, then A9/A7, then A12/A4~~ **[OPUS: wave 1 in flight (A5+A6 ∥ A9–A11) → wave 2 (A1+A8 ∥ A7)]** · ~~B's second run~~ · C0 with Josh's seven rulings · C1 → C9 in order · C-V once · **[OPUS: D9 first, then]** D in the order the spike allows, D5's verifier shared with C7 · the cut. **Dial:** no verifier in A (device report back to back for A6/A7); B is a ~~Sonnet~~ **[OPUS: builder's]** task; one verifier for C, scoped (§C-V); one for the film (C7/D5); locks only on `field.js`/shader commits and ~~once at C-V~~ **[OPUS: once at C7]**. Josh: "don't over-verify" — and the one thing the 0.4.0 locks could not see was the stage-8 kind of regression, hence the ms/s.

## 6 · What is not claimed

(DRAFT 1 kept.) **[OPUS: + The range 28.2–29.6k is an estimate made from banner-ranged spans on an older tree. + The ms/s noise floor on the 3070 is unmeasured. + No measurement exists of the INFORMATIONAL over a WebGPU canvas, on WebKit or under touch. + SIBLINGS rows 8, 20 and 24 may move to 0.5.x by D's ledger.]**

---

# PART B — THE AUDIT NOTES

## 1 · The ten edits that matter, with their evidence

1. **A11 does not close the wiring red.** `tests/wiring.test.mjs` header: it "FAILS on any `lab/**/*.js` that no root reaches". `pwa.test.mjs:244–251` derives the precache's STAGED set from that ALLOWLIST. A precache rule cannot clear an orphan gate. The gap needs a law (R5-W1), and that law is also the honest answer to the 2026-12-06 expiry.
2. **A12 is struck.** Its spans are wrong (`api` `:1211–1251`, the `LW` literal `:5330–5580`, with `:5595` being `Object.assign(DIGESTS`), and it adds a refactor. The `__LW` law costs 0 lines.
3. **The test surface is 1,507 uses of 96 members**, not 326 (grep `__LW\.[a-zA-Z]*` over `tests/*.mjs`, 29 files). The gate covers all of them.
4. **A4 is struck as a stage.** The kit adopts the rack by id, so outside references stay valid, and the parked branch serves as C3's reference.
5. **A3 moves to C6 as one part.** The canary named no A3 block. SIBLINGS row 27 says "do last". The decision `project:false` is made now (ADOPTING §13).
6. **A6 holds the demand only under `modArm && clockLink`, and the retirement goes to C4.** `host.js:223–228`: `anyLive` counts demands, so the fix works on 1.4.3. The LINKED retry `:912–921` and `:2749` become dead code (−11).
7. **The `mir-manifest` forgery pin survives A10.** S0 C5 built the per-version sha-256 gate. Only C0 may add alpha.24's hash.
8. **The ms/s metric is CDP `TaskDuration`, on the 3070 only.** CDP cannot reach the M5's Safari. "1.3 %" is the wrong framing; the delta is +40 % of BASINS' busy time.
9. **The numbers.** 26.8–28.8k mixes CSS into a `lab/*.js` count (survey §0 line 4: "a third to a half of lab.css/skin.css" sits inside the 9–10.5k) and keeps the nested ~495 and the look block's ~267 (measured ~155). The honest figure is 28.2–29.6k, with C7 as the swing.
10. **D gets a ledger with D9 first.** The legacy files measure 1,469 lines (`wc -l`), the only large deletion D has. 0.4.0's +1,559 is the reason.

Smaller line findings: A1 is `:170–319`, not `–331` · CAMERA MOTION is `:1525–1571`, not `–1589` (65 → 47) · ACTIONS closes at `:4750` · A6 omitted `:2749` · A1's "serialize bytes" gate belonged to A3 · A6 listed `render-exact`, which it does not touch. Confirmed correct: `wiring:61–65, :463` · `pwa:302` · `host.js:474` · the 8 settings sites · `:199, :296–298, :550–551, :2759, :3064, :4736, :5413–5414, :5697` · `serialize :4828`, `restoreModulation :4893`, `save :4924`, `restore :4930`, `:4935–4936` · `index.html:53–56, :67–68` · `skin.css:106–107` · 12 + 20 `!important` · `digest-lock.mjs:34` · `sw.js:224–231` · `layout :3572–3853` · `refreshOcclusion :3464`.

## 2 · Did DRAFT 1 answer REVIEW-SONNET-0?

Yes, on all ten changes: A cut, the ledger, the shared sites, the red list, C0 and dependencies, the SIBLINGS rows, D2 bounded, the spike, the rulings and the dial. It answered them partly wrongly in four places: the wiring claim (inherited from the review's §1.2 A11), the 326 surface, the "1.3 %" framing, and the range, which it took from the review's arithmetic without removing the CSS. It also over-built in two places. A12 is new and adds lines. The three canaries were one more than the review's "zeroth and last".

## 3 · Rulings for Josh (options, and my default first)

- **R5-G1**: pin alpha.24, re-adopt once at the first version carrying brief 8 · wait for the cut · every alpha. Default: pin. Note that it flips the HANDOFF's in-flight default "wait".
- **R5-W1 (new)**: the kit-file wiring law · allowlist 109 by name · renew the five once more. Default: the law.
- **R5-A3 (new)**: one project part, `project:false` · kit parts. Default: one part.
- **R5-L1 (promoted)**: which of H₂⁺, HELIUM, H₂, ELECTROSTATICS and QCD go. It decides whether D can be net ≤ 0.
- The rest as DRAFT 1 wrote them (R5-C1 Q1 cameras, R5-Q2 minimum, R5-S1/S2/S3 Q3).

## 4 · The risks still open

- The briefs may arrive after the `1.5.0` cut, which means two re-adopts.
- A0's spike runs on a throwaway that the A9–A11 builder owns. Sequence: the spike reads that throwaway after A11 lands.
- C7 (the film) is the largest deletion and the largest determinism risk: `render-exact.test.mjs` (716 lines) imports what leaves.
- `history`/`offer` stay flaky until `drv.mjs` is fixed. `current` is red on the base.
- The M5 has never been measured (persist, `limits.html`, the device report). Every iPad claim is pending.
- The load from parallel agents (load averages of 9.8–28 recorded in S2/S3) invalidates any timing taken beside a sibling.

## 5 · The verification dial

- **Over-verifying**: B's middle canary (struck), 27 browser suites on a bare adopt (cut to 9), locks at C-V (moved to C7, the only readback row), A6's `render-exact`.
- **Under-verifying**: the A0 spike needs Opus and stated decision rules (§6). The ms/s needs its noise floor measured before it can gate. The `__LW` surface needs the whole-member law. The manifest pin must survive A10.
- **The metric**: CDP `Performance.getMetrics` `TaskDuration` delta over a 30 s play window, divided by 30, in ms/s, with Script/Layout/RecalcStyle as attribution. It sees the stage-8 class (a forced layout or paint per tick), which the device report's "loop median" cannot, because that median times the JS loop only. **Noise floor on the 3070: UNMEASURED.** Take 5 same-tree runs interleaved, at load < 4. The gate is |Δ median| ≤ max(2 × the spread, 2 ms/s). If the spread exceeds 3 ms/s, retake on a quiet machine.

## 6 · The INFORMATIONAL's unknowns: what A0's spike must measure

A0 is the right experiment, and it must decide by rule, not by impression:
1. **Cost.** CDP ms/s under AUTO-ROTATE with N = 0, 2, 8 and 16 labels + 1 block, bare and pane, with the app calling `viewChanged()` per `cameraKey` change. Rule: at N = 8 bare, ≤ +10 % main-thread ms/s and 0 held frames, or D1 waits for brief 7's coalesced `viewChanged` (→ 0.5.1).
2. **Legibility.** 1s+2p, benzene HOMO and C₆₀ HOMO × light/dark × frost on/off = 12 screenshots (Chromium with the Vulkan flags, which S4c used). Each is shown bare, and bare with `mix-blend-mode: difference` on the layer ROOT (the kit says the blend must go there). Josh judges; the glass is his. Rule: if bare reads in ≥ 10 of 12, there is no ink brief. If only `difference` does, there is a small INVERT brief. If neither does, pane mode, with its measured cost.
3. **Under a rack.** With the shift at ±1, count the labels whose rect meets `rack.keepClear()`. Any count > 0 confirms the 18th brief.
4. **D4.** Does an `addBlock` holding an `<img>`/SVG data URL survive the sanitiser? If no, D4 is text only (the default).
5. **Touch/WebKit.** One `probe.mjs serve` command for Josh. It is pending, not blocking.

## 7 · The numbers

- Measured: 36,280, 85/27, 4.53 MiB, the canary row, 1,507/96, the legacy 1,469, A5's −44.
- Estimates: every C deletion, the glue, and the CDP floor. The calculation: JS out = 3,110 + 1,104 + 198 + 187 + 149 + 548 + 63 + 140 + 396 + 0–150 + ~1,780 (rack.js blocks with the look block at 155) + 1,200–1,800 − 495 ≈ 8.4–9.1k. Then 36,280 − 9.1k + 1.0k = 28.2k and 36,280 − 8.4k + 1.5k + ~0.2k (A's ledger) ≈ 29.6k. **26.8–28.8k is not honest. 28.2–29.6k is.**

## 8 · Order and sizes

Two builders on `rack.js` at a time, not three: the shared sites mean that a third one only queues merges. A4 is not "last"; it is gone. "Pin alpha.24, re-adopt once" is right, re-aimed at brief 8. The 2026-12-06 expiry does not force a date if R5-W1 is ruled. Without R5-W1 it forces either C6 (the last consumer) before 12-06 or a second renewal. Sizes: A0 M, A5+A6 M, A9–A11 M, A1+A8 M, A7 S; C0 M, C1 S, C2 M, C3 L, C4 L, C5 S, C6 L, C7 L, C8 S, C9 M; D9 M.

## 9 · TODAY, for the builders in flight (to forward)

1. **A5+A6 builder (starting A6):** hold `demand('app.play')` only while `modArm && clockLink`. Delete the LINKED retry (`:912–921`) and the `:2749` re-arm once play cannot be refused. Do NOT retire LINKED/SEPARATE or the three PREFERENCE keys (that is C4). Closers: `take-in-bugs` + the four scenes; not `current` (red on the base) and not `render-exact`.
2. **A9–A11 builder (A10 half-built, A11 next):** (a) keep `mir-manifest`'s per-version sha-256 `ACCEPTED` pin. Widen the version regex only; alpha.24's hash is added at C0, not now. (b) A11's precache rule does NOT clear `wiring`. Implement the precache half, and propose the kit-file wiring law (R5-W1) as a separate, flagged commit for Josh, without folding it in silently. (c) Your throwaway alpha.24 run IS A0's canary half, so keep its full red list and precache bytes. (d) Fix the port race once in `tools/gate/drv.mjs`.
3. **A4:** stays parked and is not merged or restarted.
4. **Nobody** builds A3 or A12.

## 10 · The exact next step

Fable/Sos writes **PLAN-DRAFT-2** from Part A. It takes or overrules each **[OPUS]** mark. It sends §9's list to the two builders now, and it puts R5-G1, R5-W1 and R5-L1 to Josh first. Then Sonnet (high) writes REVIEW-SONNET-2.
