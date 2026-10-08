# λWAVES 0.5.0 — PLAN (Fable, 2026-10-08; DRAFT 3 approved by Josh: "defaults, let's continue")

**One sentence.** 0.5.0 is THE ADOPTION of MIR 1.5 — λWAVES' interface code becomes the kit's — and then THE INFORMATIONAL; it is
the release judged by one number before any feature: **`lab/*.js` falls** (0.4.0 added +1,559 against its own law). Stage A, THE
SEAMS, is capped at +150 lines in total; stage D runs a ledger whose net must be ≤ 0; the whole adoption has **two verifier agents**
(C-V the adoption; C7 the film, reused by D5), one measurer (A0), and **locks only at C7** (and on any `field.js`/shader commit).

**Where things stand at approval (2026-10-08 ~13:15):** 0.4.0-alpha is **cut locally** (`8193016`, tag `v0.4.0-alpha`; nothing pushed
or deployed). Josh's test servers serve the integration branch `sos-s0` — https://127.0.0.1:8721/lab/ and on the LAN
https://10.0.0.18:8711/lab/. Stage A wave 1 is merged (A5+A6, A9–A11: `lab/*.js` 36,280 → 36,198), A0's row and A-M (the ms/s
instrument, floor 13.879 ± 0.536 ms/s) are in; A1+A8 and A7 are building; nothing of C or D is built. **A0's cost rule has fired:**
+90 % main-thread at 8 bare labels; **pass 2 (field present, 0 held frames): +115 % → D1 is 0.5.1** (§2 D, §9; `CANARY-A0.md` PASS 2).

## 0 · The inputs, measured on this tree

| input | value | source |
|---|---|---|
| `lab/*.js` | **36,280** at the 0.4.0 tag → **36,234** after A5+A6 (0.4.0 added +1,559, +4.5 %) | `wc -l` |
| the gates | **85 node suites, 27 browser suites** (the count falls when D9 deletes `qcd`, `h2`, `helium`, `electrostatics`, `cornell`) | `ls tests` |
| precache today | 188 files, **4.64 MiB** (4,864,170 B on `12451d2`; S4a's 4.53 was the cut's own build; the canary's 4.63 was 205 entries); ceiling 8 MiB (`pwa.test.mjs:302`) | REVIEW-SONNET-2 §5 |
| the canary (alpha.23 on `61f7c2c`) | boots; 7 node reds (regex/inventory, not behaviour); +196 kit files, 4.63 → 9.46 MiB; **136–150 of 595 elements restyled per state** (BASINS' first look: 192); browser 3/3 | `docs/MIR-1.5-CANARY.md` |
| the kit | 1.5 line at **alpha.24**; no `cells.js`, `lattice.js`, `info/window.js`, `paintedSpace`; `host.js:474 demand(id, on)` + `anyLive()` (`:223–228`) exist on 1.4.3, so a held `demand('app.play')` lifts the `nothing-to-run` refusal today — **A6 used exactly this** | `lab/mir/modulation/host.js`; A5-A6-BUILD |
| the kit's tools | `~/Documents/MIR/.claude/worktrees/mir-1.5/tools/{adopt.mjs, stylehash.mjs, hit-probe.mjs}` — **always the 1.5 worktree's**, never `~/Documents/MIR/tools/adopt.mjs` (that is the 1.4.3 kit) | `ls` |
| BASINS | +1,850 / −19,320 over 11 stages; four re-adopts; stage 8: **+13 ms/s** main-thread while playing = **+40 % of its 32 ms/s**, found only by measurement | survey §2.1 |
| the wiring clock | five allowlist rows dated 2026-10-07, `EXPIRE_DAYS = 60`: **red on 2026-12-06**; consumed by C2/C6 (four) and C3 (one), or retired by R5-W1 | `tests/wiring.test.mjs:60–65, :463` |
| the test surface | **1,507 uses of 96 `__LW` members in 29 test files** | grep |
| the briefs | 17 (`KIT-BRIEFS.md`), 677 gross lines on adoption | KIT-BRIEFS |
| the legacy five | `qcd` 219 · `h2` 268 (+ `h2ci.js` 330, which **stays**: six engine importers, and MAPS needs it) · `helium` 215 · `electrostatics` 437 = **1,139 deletable** (not 1,469); H₂⁺'s own files UNCOUNTED until D9 measures them | `wc -l`; REVIEW-SONNET-2 §3 |
| the ms/s instrument | **does not exist yet**: `tools/perf/cdp.mjs` has no `getMetrics`/`TaskDuration` — a new tool, row A-M | grep |

## 1 · The gates, what each blocks, and the dependency table

| gate | state | blocks |
|---|---|---|
| **G1 · the briefs in the kit** (8 first; then 2, 3, 4, 5, 6, 7, 9′, 13) | unbuilt in alpha.24 | C8 (8) · C9's `[data-mir-offer]` case only (9′) · D1 (13 + 7) · D2's journal half (3) · D5 (6 + 7) · D7 (4 + 5). **C0–C7, the rest of C9, D3, D4, D6, D8, D9, D10 need no brief** |
| **G2 · which kit** | the `1.5.0` cut is open | nothing, once pinned |
| **G3 · the first look** (the glass is Josh's) | — | C0: the seven stylehash classes are his rulings |

**R5-G1 (default first): pin alpha.24 at C0** (frozen in `MIR-MANIFEST.json`, its sha-256 into `ACCEPTED`) **and re-adopt when brief 8
lands** — "re-adopt" = taking a whole new kit version into the tree through `adopt.mjs` (never picking single files out of a kit); the
first re-adopt takes everything landed by then; if the D briefs (4/5/6/7/13) land later, ONE more; a third means D slips to 0.5.1 ·
wait for the cut · every alpha. Who builds the briefs in MIR is Josh's scheduling (Q2).

**The 0.5.0 minimum (R5-Q2):** if the briefs are not in a kit when C is done, 0.5.0 = **A + B + C0–C7 + C9 (without the 9′ case)** on the
pinned alpha — λWAVES on MIR 1.5 with the subtraction booked — and **C8, D1, D5, D7 are 0.5.1**; R1 (occlusion) is closed in 0.5.0 by
A7's providers + `frame-occlusion`, and re-closed by C8 later. Or 0.5.0 holds for the window. Josh's call.

## 2 · The stages (sizes S/M/L; each row names its closer; NEW marks a closer that does not exist yet)

### A · THE SEAMS (λWAVES only; `lab/mir` untouched; capped at +150; two builders on `rack.js` at a time)

**Acceptance of the stage:** the throwaway canary on alpha.24 shows **the residual red set = {`new-project --check` (bpm 60 → 30,
regenerated at C0), `wiring` (until R5-W1)} plus the kit's behaviour NOTEs** and nothing else; **THE `__LW` LAW** (no A or C commit
renames or removes a `__LW` member a test uses unless that test is edited in the same commit; 96 members, 1,507 uses; a rule, 0 lines);
a whole-`localStorage` diff empty outside WORKSPACE after a project open; one ledger line in REPORT per seam. **Line numbers below are
GREP ANCHORS, not numbers**: A5 moved everything below the old `:2530` by −163, and every merge moves them again. **The standing merge
conflict** between any two A branches is the generated `lab/sw.js` — take either side and `node tests/pwa.test.mjs --write`.

| # | seam | state · size | anchor in `lab/rack.js` (grep) | closer |
|---|---|---|---|---|
| **A5** | the modulation port: `lab/mod-port.js` is the object `createModulation(port)` takes, key for key | **MERGED** `b5b6d7d` · M | `createModHost`, `modDodge`, `LW.mod` | node 85; `mir-controls`, `lfo-tension`, `routed-knob`, `history` 39 — green |
| **A6** | the one-clock FACADE: `onePlay(clock)` in `lab/clock.js`; `mod.follow(on)` holds `host.clock.demand('app.play', true)` **while MOD is armed and LINKED**; the LINKED retry and S0's re-arm deleted. **LINKED/SEPARATE and `clockLink`/`modArm`/`modCadence` STAY until C4** (Josh sees that change with the kit window) | **MERGED** `b5b6d7d` (A5+A6 = −46) · M | `togglePlay`, `setModArm`, `ui.setClockLink`, the `loop()` play edge | `take-in-bugs` §1 = the four scenes (a fresh boot/NEW with the editor closed and nothing routed PLAYS; pause releases; a routed source follows; the bare host still refuses) 4/4; `history` 39; `offer` 16 — green. Not `current` (red on the base) |
| **A9** | the ACTIONS table mapped to the kit's ids where a twin exists, an alias map for saved bindings and the MENUS calls, every kit window a row with no chord, `Ctrl` explicit for Ctrl+Shift+Q/E, R-K1's first half (S stays WASD) | DONE on branch `a951ee…` · S | `const ACTIONS` | `keyboard-shortcuts`, `keyboard-window`, a `Ctrl`-vs-`Mod` case |
| **A10** | tests find things by hook (26 id selectors, 50 `.km-` lines in 7 suites); the canary's four rewrites — `mir.test` §16 + import list → the manifest's inventory and exported names; `mir-manifest` accepts a pre-release + `"line"` **with the per-version sha-256 `ACCEPTED` pin kept exactly** (alpha.24's hash enters only at C0); `slider-keys` reads `setKnobLaw().keyFine` **where the kit has it, else asserts 1.4.3's .001** (one test, green on both kits); `access` A8 reads rendered text; **the driver-port race fixed once in `tools/gate/drv.mjs`** | half, building · M | — (`tests/`, `tools/gate/`) | node green on the untouched tree AND the throwaway; `history` 39 + `offer` 16 without a pause hack |
| **A11** | the kit precache rule = **the SKIP LIST** (`mir/locales/`, `mir/tokens.json`, + what the throwaway shows lazy), read by `pwa.test` beside `DATA`, `build-deploy` carrying skipped files uncached; `sw.js` §1b's `DATA` stays a separate semantic; the `new-project` regeneration documented as C0's step. **It does not clear `wiring`** (`pwa.test.mjs:244–251` derives the unprecached set from wiring's ALLOWLIST; `wiring` fails on any unreached `lab/**/*.js`) → **R5-W1** proposed as a flagged separate commit | next, same builder · S | `lab/sw.js` §1b | `pwa` ≤ 8 MiB on the throwaway with the headroom stated (≈ 0.6 MiB today) |
| **A1** | the settings adapter `{read, write, remove}` over `lambdawaves.q0.settings` — the blob's **7 writes and 1 remove**; its header says which families stay (`NB_*`, `PJ_KEY`, `LS_EXP/LS_PRES`, keys, library) and the PREFERENCE/WORKSPACE split `createRack({store})`/`createGui` will read | building (with A8) from `b5b6d7d` · M | `SETTINGS_KEY`, `saveSettings`, `applySettings` | the blob byte-identical across boot → save → reload on the 4 demos + the empty project; the whole-`localStorage` diff (NEW probe under `tools/`) |
| **A8** | the camera port `{get, set, subscribe, turn, home, ranges, angle:'rad'}` + **the bindings as ONE data table** in `stage-gestures.js` (today code), so R5-C1 is a diff of data and brief 1 receives it as configuration | building (with A1) · M | `createCameraLaw`, the `CAMERA MOTION` banner | `camera-shift` 11, `render-regressions`, `stage-gestures` node; no lock (no `writeView` change) |
| **A7** | occlusion providers per window species in `lab/occlusion.js` (`register`, `rects()` with the 32-rect cap, `dirty()` = the one producer, the paused-PRESENT law); `refreshOcclusion` collects, converts, caps, sets; brief 8 becomes one subscription at C8 | building from `b5b6d7d` · S | `refreshOcclusion`, `placeFloat`, `keymapMoved` | `frame-occlusion` 7/7; a NEW probe under `tools/` dumping the rect lists byte-identical before/after on 11 scenes; the device report back to back. The lock cannot see this (`digest-lock.mjs:34`) |
| **A-M** (new) | **the ms/s instrument**: `tools/perf/main-thread.mjs` — CDP `Performance.getMetrics` `TaskDuration` delta over a 30 s play, ÷ 30, with Script/Layout/RecalcStyle as attribution; interleaved A/B, 5 runs each, load < 4; **the floor** = the spread of same-tree runs, measured; **the baseline BEFORE C0** on the 3070, recorded in MEASURE.md — owner: the A0 measurer (or the first C builder, before C0) | not started · S | — | the floor and the baseline written, with their spread |
| **A0** | the baseline on this tree (85 suites' red list, precache, stylehash `before`/`before2`); the adopted-half canary on alpha.24 (A9–A11's throwaway — kept until its numbers are written; A0 may use it or its own); stylehash with the modulation window and the notebook OPEN (R13 sized before C4); **the INFORMATIONAL spike** by the five rules of §B; the M5/WebKit commands for Josh | running (Sonnet) · M | the throwaway only | the row; the spike's five rules applied with the stated method — else the spike alone is re-run by Opus |

**Struck from A** (and why): A2 (the look store: ~155 lines `createGui` deletes at C2); A3 (project parts → C6 as ONE part; the DECISION
kept: `installModulation({ project: false })`, R5-A3); A4 (the floating rack: `createRack` adopts `#rack #rackL #floats` by id; the
parked branch `worktree-agent-a42dc49a851951ba4` is C3's reference and is never merged); A12 (the `__LW` object: wrong spans, a
refactor, 0 subtraction; the law does its job). Wave 2 = A1+A8 ∥ A7 (both launched from `b5b6d7d`). Merge order as they land; each
merge: `pwa --write`, node gate, the owning suites, the ledger line.

### B · THE CANARY, twice; THE SPIKE's five rules

A0 now · at the first re-adopt (then all 27 browser suites, because C0 is real). Each: adopt into a throwaway with the 1.5 worktree's
`adopt.mjs --line 1.5`, `pwa --write`, 85 node per suite (first message kept), the 9 browser suites that touch kit-derived DOM
(`frame-occlusion`, `history`, `new-project`, `mir-controls`, `lfo-tension`, `routed-knob`, `keyboard-window`, `offer`,
`official-defaults-palette`), stylehash with the modulation window and notebook open, precache bytes; the M5/WebKit commands for Josh.
Nothing committed from a throwaway.

**The spike decides by rule:** (1) **cost** — A-M's ms/s under AUTO-ROTATE, N = 0, 2, 8, 16 labels + 1 block, bare and pane: at N = 8 bare
≤ +10 % over N = 0 and 0 held frames → D1 ships in 0.5.0, else D1 waits for brief 7 (0.5.1) — **pass 2 read +115 %: 0.5.1**; and brief 7 is re-worded: `viewChanged()` is already coalesced (0.12 ms/s), the cost is ~63 DOM writes a frame (two thirds restyle + repaint), so brief 7 asks for **no per-frame DOM writes while the camera turns** (one paint a frame, a compositor-only transform per body); (2) **legibility** —
12 screenshots (1s+2p, benzene HOMO, C₆₀ HOMO × light/dark × frost on/off), bare and with `mix-blend-mode: difference` on the layer ROOT;
**Josh judges**: bare reads in ≥ 10 of 12 → no ink brief; only `difference` → a small INVERT brief; neither → pane mode with its cost;
(3) **under a rack** — at shift ±1, labels whose rect meets the rack's keep-clear: any > 0 confirms the 18th brief; (4) **D4** — an
`addBlock` with an `<img>`/SVG data URL survives the sanitiser? no → text only; (5) **touch/WebKit** — one command for Josh.

### C · THE ADOPTION (pinned alpha; the survey's leverage order; one verifier; the one lock at C7) — sizes: C0 M · C1 S · C2 M · C3 L · C4 L · C5 S · C6 L · C7 L · C8 S · C9 M

| # | consumer | what leaves | what stays / is new | closer |
|---|---|---|---|---|
| **C0** | the bare adopt (the 1.5 worktree's `adopt.mjs`) and the cascade: `index.html` (`<link>` lines, grep `mir/`) → `mir/mir.css` with `@layer app, mir;` before `base.css`; app rules on kit windows (`skin.css`, grep `#modwin`); the **32 `!important`** into `app.*` layers with twin `:not(:where())` rules; the chip/rail hooks; the manifest pinned + its sha-256 into `ACCEPTED`; `new-project` regenerated (bpm 30); R5-W1 applied | — | the kit's bytes | the 1.5 `stylehash.mjs` on 8 states + modwindow + notebook: **seven property classes** (press-scale transition, box-shadow, focus outline, `.dev-head` background, ON text-shadow, backdrop-filter, border), **each an INTENT ruling by Josh with a screenshot, or a bug**; `adopt.mjs --check` in step |
| C1 | the CAMERA panel through A8's port + RAMP/GRADE | `paletteview.js` 156, CAMERA MOTION 47 | saved routes keep their ids (`observer.*`, `mat.*`; `modPrefix`); NEW: a route script over the 4 demos + the empty project | `camera-shift`, `palette`, the route script |
| C2 | `createGui` + `createPrefs` + `createAccent` (`projectAccent:false`; `defaults` = light, refractive + ALWAYS frost, 22 px, 50 % VIVID, normal ink; the phone law stays the app's) + **the look lift**: `theme, card, frost, disc, blur, accent` from the blob → the kit's `mir.gui` keys, once, forward only | INTERFACE + THEME·SURFACE ~155, `accent-wheel.js` 152, `native-ui`/`first-run` partly | the invariant widened to a whole-`localStorage` snapshot minus WORKSPACE (NEW probe, from A1's); STATE-SCOPES rewritten; R5-S1; brief J consumed | `first-run`, `official-defaults-palette`, `new-project`, the snapshot diff, stylehash per class |
| C3 | rack + transport + menubar + keys + keyboard | the floating rack (`const layout` block + helpers), transport + menus, `menubar.js` + `rack-menus.js` 198, `keymap.js` 934 + `shortcuts.js` + `keys.js` | `keyboard-window.browser-test` rewritten wholesale (the largest test rewrite); `__LW.layout`'s 137 uses keep their verbs (A4's branch shows the seams); the KEYBOARD skin λWAVES' (R5-S3); NEW `Ctrl`-vs-`Mod` case; brief P consumed | `menubar`, `keyboard-window`, `keyboard-shortcuts`, `frame-occlusion` over `[data-mir-window]` |
| C4 | the modulation window + one clock (`createModulation(port)` on A5; `installModulation(...).play` on A6; `installModulation({ project: false })`) | `modwindow.js` 3,110, `lab.css` badge ladders, `audio.js` 438 | **R-B1 complete here**: LINKED/SEPARATE retired, the three keys leave PREFERENCE, STATE-SCOPES + `new-project` regenerated, `native-ui`'s tempo tiles 10 → 8 | `mir-controls`, `lfo-tension`, `routed-knob`, `history`, `take-in-bugs`, the replay judges |
| C5 | history as the one `edit` domain | `history.js` 187, the card ~50 | `history.clear(label)` | `history` 39 |
| C6 | FOLDERS + notebook pages + **ONE project part** over `serialize()`/`restore()` (`signature = projectKey()`) + session/opener (`createSession`, `createOpener`, `bootVeil`, `installBanner`, `installWakeLock`) | PROJECTS ~330, `project-storage`/`-import` 66 | serialize bytes identical on the 4 demos + the empty project + 6 history snapshots; NEW R10 fixture suite (an invalid collection never becomes an empty writable one; the 8 vs 24 MB cap; a 1.4 notebook → page 0); R-I3 both halves | `new-project` 8, `history`, `offer`, `molecule-demos`, the fixture suite |
| C7 | the film: `createRecorder` with `frame(i, ctx)` | ~1,200–1,800 of `capture.js` + `render-exact.js` (2,360) — **the swing** | what stays named (the GPU readback + settle, jitter seed 13, hazards H1–H3); `render-exact.test.mjs` re-aimed; **THE FILM VERIFIER here** (fresh Opus; D5 reuses its harness); **THE ONE LOCK of C — 1004 + 1148** | `render-exact`, `export3d`, a PNG/loop/video |
| C8 | occlusion by brief 8's `paintedSpace` (A7's providers → one subscription) — **G1** | the enumerator | `frame-occlusion` gains the kit species | `frame-occlusion` on moved, scrolled, folded, paused windows |
| C9 | the offline layer stays the app's: gates re-pinned (A10), the precache rule (A11), **the scene guard** (`createSceneGuard({install:false})` from `stage-gestures.js`) with a NEW λWAVES hit-probe set (the 1.5 `hit-probe.mjs`; "0 presses through a kit window's gap reach the stage" — BASINS' 25/0 is its own count, not ours), **R14**: `gpu-recovery` named, FOLDERS' `thumbnail()` via the readability probe; `[data-mir-offer]`'s case in `offer` when 9′ lands | — | — | `pwa`, `wiring`, `mir-manifest`, `offer` 16, hit-probe, `gpu-recovery` |
| **C-V** | the adoption verifier (fresh Opus), scoped: the seven stylehash classes with Josh's rulings applied; **the R1–R15 table below**, each closer run; hit-probe; **A-M's ms/s** against the pre-C baseline (gate |Δ median| ≤ max(2 × spread, 2 ms/s)); the M5 by the device report pair ("M5 pending" if absent); `adopt.mjs --check`; the `__LW` law; no lock | | | |

**The risks and their closers (C-V's table):** R1 occlusion — `frame-occlusion` (A7 interim; C8) · R2 scopes — the whole-`localStorage`
snapshot (NEW) + `new-project` · R3 history — `history` 39 · R4 offline — `pwa`, `offer` (+ the 9′ case), `wiring` under R5-W1 · R5
cascade — stylehash's seven classes (a tool, Josh's rulings) · R6 two clocks — `take-in-bugs` four scenes (A6) + the replay judges (C4)
· R7 first-run — `first-run`, `official-defaults-palette` · R8 keys — `keyboard-shortcuts`, `keyboard-window` (rewritten), the
`Ctrl`-vs-`Mod` case (NEW) · R9 ids — A10's hook selectors · R10 formats — the fixture suite (NEW) · R11 NEW/empty — `new-project` 8 +
`--check` · R12 byte-pins — `mir.test` and `mir-manifest` as rewritten (the pin kept) · R13 modwindow drift — stylehash with the window
open (A0, B) · R14 WebGPU — `gpu-recovery` + the thumbnail probe (NEW) · R15 moving kit — the pin + `adopt.mjs --check` per C commit.

**Done when:** every closer above green (NEW ones written); the seven classes ruled; ms/s within the measured floor; **`lab/*.js` at
C-V: estimate 28.2–29.6k, HARD BAR 30,000** (JS-only out ≈ 8.4–9.1k; back 1.0–1.5k; A's ledger ≤ +150, −46 so far; C7 is the swing: if the
film slips, +1.2–1.8k and the bar is checked against that); CLAUDE.md rewritten for the kit's windows.

### D · THE INFORMATIONAL (G1 for D1/D5/D7; the spike decides its shape; **net ≤ 0 on D's ledger; D9 first**) — sizes: D9 M · D1 M · D2 M · D3 S · D4 S · D5 M · D6 L · D7 M · D8 S · D10 per row

| # | piece | rule | closer |
|---|---|---|---|
| **D9** | **first**: the legacy five. **Deletable ceiling 1,139** (`h2ci.js` 330 stays — six engine importers; H₂⁺'s files measured here and added). H₂⁺ and HELIUM are field owners (pages cannot own ψ): each a MOLECULES/preset demo, a kept window, or deleted with a restore shim; QCD deleted; H₂ and ELECTROSTATICS by use — **R5-L1**. Under the default (QCD only guaranteed) the credit is **219**; D ≤ 0 needs H₂ (268) and ELECTROSTATICS (437) too, or D's additions must fit in the credit | lines DOWN; the deleted node suites listed | the history/project suites open an old file naming them |
| D1 **(0.5.1 by the spike's rule — pass 2 +115 %)** | the window (brief 13), the DISPLAY switch; `stage-text.js` → `addBlock` / `addLabel({ttl})` / `addLabel({anchor})`; `{{state}}`, `{{E}}`, `{{T}}`; `viewChanged()` only on a `cameraKey` change | the spike's cost rule | the budget held; 0 per-tick layout reads by the layer's witness |
| D2 | pages generated from the records (38 + 4 demos), hydrogenic states by class, windows from the INFO copy; the RPA root names in SPECTRUM (the Sol thread's C3); brief 3's TO NOTEBOOK / PIN when it lands | no model-authored number; `CURATED_IE` verified or tagged; no SRD 101 table; the greeting the one exception (R5-I4) | render + round-trip; the root names' Σ d_Λ m_Λ gate |
| D3 | feature labels (`features()`, `place()`) | the 18th brief if the spike's count > 0 | labels follow a turn, hold still after |
| D4 | the overlays — **text only in 0.5.0** (pass 2: a data-URL `<img>` loses its `src`, an inline `<svg>` is removed; a same-origin image file survives, the 19th brief's route); positions WORKSPACE | the spike | a moved label persists |
| D5 | the film overlay (brief 6) + TAKE MODE (brief 7); the caption retired | C7's film verifier reused | a video carries the layer deterministically |
| D6 | FIGURE, chips, FLY-TO + search, SCENES (replaces A/B as two of eight — its out), MAPS (H₂'s FCI curve) | **a piece without a named "out" is not built**; the out is named in its brief | per piece |
| D7 | the pad with the lattice (brief 5) and `cells` (brief 4; the S3 cells and S4b header retire, 38 lines) | — | ATOMS and MOLECULES suites |
| D8 | R-I2: `lw:` links and the HUD | one banner per hand press | — |
| D10 | from PLAN §8: **19** the flash guard and **21** the ink law first (laws); **8**, **20**, **24** only as far as the ledger pays, else 0.5.x; brief 1 optional | the ledger | per row |

Then **cut 0.5.0-alpha** locally. **0.4.1 BUCKYBALL** is a 0.4.x cut from `v0.4.0-alpha` (C₆₀'s density from a grid record stored as
its D₂h asymmetric unit, at the experimental geometry, the I_h names), independent of 0.5.0.

## 3 · For Josh — the four rulings that shape the release, then the questions, then the defaults

**Rulings (each flips one line; the first option is what happens if you say "defaults"):**
1. **The glass (G3).** At C0 the bare adoption restyles 136–150 of 595 visible elements in seven property classes: press-scale
   transition, box-shadow, focus outline, `.dev-head` background, ON text-shadow, backdrop-filter, border. **Each is your ruling with a
   screenshot** — keep λWAVES' look (`app.*` layer) or take the kit's. Default: **λWAVES' look wherever λWAVES originated it, the kit's
   where BASINS designed it** (your R-F1), decided class by class when C0's screenshots exist.
2. **R5-C1 the camera bindings.** Today: left-drag orbits, Alt-drag or two fingers slide, wheel/pinch zoom at the cursor, Alt+Arrows
   nudge, double-click/tap resets. **Q1: which bindings on a mouse, a trackpad and the iPad?** A8 is making them a data table; your
   answer is a row edit, and brief 1 then carries it as the kit's reference.
3. **R5-G1 which kit.** **Pin alpha.24 now, re-adopt once when brief 8 lands** (at most twice) · wait for the `1.5.0` cut · every alpha.
4. **R5-L1 the legacy five** (they pay for the INFORMATIONAL): **QCD deleted; H₂⁺ and HELIUM become MOLECULES/preset demos with a restore
   shim; H₂ and ELECTROSTATICS decided by use** · delete all five · keep all five (then D must fit in 0 lines).

**Questions:** **Q2** if the MIR briefs are not in a kit when C is done — ship 0.5.0 as the adoption alone (C8 and the INFORMATIONAL in
0.5.1), or hold? And **which session builds the briefs in MIR** (your primary account when its week resets; this account as a second
session; Sol)? · **Q3** may the adopted app show what it does not today — the MIR OPTIONS window beside SETTINGS, the LANGUAGE menu with
ten unreviewed packs, the kit's KEYBOARD skin in place of your charcoal-blue? Defaults: **hidden, hidden, yours** (R5-S1/S2/S3).

**Defaults taken unless you object:** R5-W1 (an unreached kit file in the manifest is reported, not precached, not failed; app files keep
the hard gate; the five dated rows retire) · R5-A3 (one project part, `installModulation({ project: false })`) · R-B1 (one clock, at C4)
· R-K1 (S stays WASD; Ctrl+Space is already MOD arm) · R-D1 (your first-run look under the kit) · R-I2 (`lw:` links + the HUD) · R-I3
(pages travel with the project AND an open never closes the notebook) · R5-I4 (the greeting on open is the one exception to
hand-presses-only) · R5-D2 (no SRD 101 table) · photosensitivity the kit's pane · toast BASINS' pill · ABOUT 470 × 670 · NEW leaves
preferences alone · notes recent 8, pages in the project · no chord invented for kit windows.

**Carried from 0.4.0, still yours:** Br₂ vs the benzene cap; C₆₀'s `milestone` allowance; C₂₀H₂₀ a fixture only; one rock-salt cube;
the M5 numbers (`./serve-lan.sh`, then `?report=1&post=1`, `/tools/perf/limits.html`, the persist probe on the iPad).

## 4 · The numbers

Measured: §0; the 11 shared `rack.js` sites (REVIEW-SONNET-0 §1.6); 26 id selectors + 50 `.km-` lines; 1,507 / 96 `__LW` uses; 32
`!important`; KB's 677; the legacy 1,139 deletable; A5+A6's −46. Estimates, said so wherever used: JS-only out 8.4–9.1k, back 1.0–1.5k,
hence 28.2–29.6k (hard bar 30,000); the film's 1,200–1,800 of 2,360. To take, with the method and an owner: A-M's floor and the pre-C
baseline (A0 / the first C builder); the per-seam ledger (each builder); precache bytes per alpha (B); the seven stylehash classes with
C0 (C0's builder); the spike's four numbers (A0); the whole-`localStorage` snapshots (A1); the full red list on 85 suites (A0, A9–A11).

## 5 · Order and the dial

A0 ∥ wave 1 (merged: A5+A6; building: A9–A11) → wave 2 (A1+A8 ∥ A7, building) → A-M → B at the first re-adopt → C0 with your seven
rulings → C1 → C9 → C-V once → D9 first, then D in the order the spike allows → the cut. **The dial, in one line: 2 verifier agents
(C-V, C7) + 1 measurer (A0); locks only at C7 and on `field.js`/shader commits; one light check per row otherwise; the device report
back to back for the two frame-loop seams.** Josh: "don't over-verify" — and the one regression 0.4.0's locks could not see is the
stage-8 kind, hence A-M with a measured floor.

## 6 · What is not claimed

No line of C or D is built; A is one seam merged and five building. The briefs' arrival is not ours to schedule. 28.2–29.6k is an
estimate from banner-ranged spans on an older tree; the hard bar is 30,000. A-M does not exist yet; its floor is unmeasured. No
measurement exists of the INFORMATIONAL over a WebGPU canvas, on WebKit or under touch until A0's spike; A0 runs on Sonnet and its
spike is accepted only if its five rules were applied with the stated method, else re-run by Opus. SIBLINGS rows 8, 20, 24 may move to
0.5.x by D's ledger. The M5's numbers are Josh's one command. The no-push ruling stands; 0.4.0-alpha is cut locally and not live.

## 9 · RULINGS TAKEN (Josh, 2026-10-08: "defaults, let's continue")

Every ruling in §3 takes its first option until Josh says otherwise:
- **The glass (G3):** λWAVES' look wherever λWAVES originated it (`app.*` layer), the kit's where BASINS designed it — decided class by
  class at C0 from the seven screenshots, which Josh still sees.
- **R5-C1 the camera bindings:** today's table stands (left-drag orbits; Alt-drag or two fingers slide; wheel/pinch zoom at the cursor;
  Alt+Arrows nudge; double-click/tap resets) as A8's data table; Josh's change, when he names it, is a row edit.
- **R5-G1:** pin alpha.24 at C0; re-adopt once when brief 8 lands (at most twice).
- **R5-L1:** QCD deleted; H₂⁺ and HELIUM become MOLECULES/preset demos with a restore shim; H₂ and ELECTROSTATICS decided by use.
- **Q2 (R5-Q2):** if the briefs are not in a kit when C is done, 0.5.0 = A + B + C0–C7 + C9 on the pinned alpha; C8, D1, D5, D7 are
  0.5.1. The MIR briefs are built by Josh's primary account when its week resets (first option).
- **Q3 (R5-S1/S2/S3):** MIR OPTIONS hidden (SETTINGS stays the surface); the LANGUAGE menu hidden; the KEYBOARD window keeps λWAVES'
  charcoal-blue skin as an `app.*` layer.
- **The defaults list of §3** as written: R5-W1 (the kit-file wiring law), R5-A3 (one project part, `installModulation({ project: false })`),
  R-B1 (one clock, at C4), R-K1, R-D1, R-I2, R-I3 (both), R5-I4, R5-D2, the photosensitivity pane, BASINS' toast, ABOUT 470 × 670, NEW
  leaves preferences alone, notes recent 8 with pages in the project, no chord invented for kit windows.
- **Carried from 0.4.0, still open:** Br₂ vs the cap; C₆₀'s `milestone` allowance; C₂₀H₂₀ a fixture; one rock-salt cube; the M5 numbers.
- **A0's rule, applied:** D1 (the INFORMATIONAL window) is 0.5.1 unless the spike's pass 2 or a kit fix brings 8 bare labels within +10 %.
  **Pass 2 (2026-10-08, `CANARY-A0.md` PASS 2) read +115 % with the field present and 0 held frames: D1 is 0.5.1.** What pass 2 changes
  in the wording, taken as the integrator's defaults under Josh's "defaults" ruling: (a) brief 7 asks for no per-frame DOM writes while the
  camera turns, not a coalesced `viewChanged` (already true); (b) **no ink brief** — bare reads in 12 of 12 pictures and `difference` is never
  better (worse in light) — PROVISIONAL until Josh looks at the 24 PNGs in `canary-a0/legibility/`; (c) brief 18 confirmed (2 of 3 labels meet a
  rack at shift ±1; two overlap by 30–35 px even centred) and it carries a second line: the block placed beside the subject must be clamped
  to the free stage (it lands under the rack despite `avoid`); (d) D4 text only in 0.5.0, same-origin image files for the 19th brief; (e) the
  WebKit road for 0.5.0 is the kit's probe (PASS 2 §5's block), not `check-app.mjs`, which needs `createDescribe` wired and WebKit libraries
  this machine lacks; (f) for A-M: `main-thread.mjs` measures with the photosensitivity notice open under CDP Chromium — UNVERIFIED whether
  that moves the floor; the pre-C baseline takes a notice-dismissed pair beside it before anything is re-based.
