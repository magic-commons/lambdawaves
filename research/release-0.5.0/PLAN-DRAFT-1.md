# λWAVES 0.5.0 — PLAN-DRAFT-1 (Fable, 2026-10-08, after REVIEW-SONNET-0)

**One sentence.** 0.5.0 is THE ADOPTION of MIR 1.5 — λWAVES' interface code becomes the kit's — and then THE INFORMATIONAL; this
draft takes the review's ten changes: stage A is cut to the seams the canary names plus the glue-first seams, measured on this
tree; C gains its row 0 and a dependency table; the default is a pinned alpha, re-adopted once at the cut; the dial is reset.

## 0 · The inputs, measured on this tree (not the survey's)

| input | value | source |
|---|---|---|
| `lab/*.js` | **36,280** lines (0.4.0 added **+1,559**, +4.5 %, from 34,721 at PLAN §3; no 0.4.0 stage met "lines down") | `wc -l`; S3/S4a/S4b/S4c-BUILD |
| the gates | **85 node suites, 27 browser suites** (the canary's "82" is stale) | `ls tests` |
| precache today | 188 files, **4.53 MiB**; ceiling 8 MiB (`pwa.test.mjs:302`) | S4a-BUILD |
| the canary (alpha.23 on `61f7c2c`) | boots; 7 node reds (regex/inventory, not behaviour); +196 kit files, 4.63 → 9.46 MiB; **136–150 of 595 elements restyled per state** (1,172 element-states over 8 states; BASINS' first look was 192 elements); browser 3/3 | `docs/MIR-1.5-CANARY.md` |
| the kit | 1.5 line at **alpha.24**; no `cells.js`, no `lattice.js`, no `info/window.js`, no `paintedSpace`; `host.js:474 demand(id, on)` exists on 1.4.3 already | `ls mir/controls mir/info`; `lab/mir/modulation/host.js` |
| BASINS | +1,850 / −19,320 app lines over 11 stages; four parity re-adopts; stage 8: **+13 ms/s** main-thread while playing (45.0 vs 32.0) found only by measurement | survey §2.1 |
| the wiring clock | five allowlist rows dated 2026-10-07, `EXPIRE_DAYS = 60`: **red on 2026-12-06** (warning from 10-21); their stated consumer is "the 0.5.0 adoption" | `tests/wiring.test.mjs:61–65, :463` |
| the test surface | `__LW.layout` 137 call sites, `.mod` 93, `.history` 67, `.keys` 13, `.projects` 8, `.notebook` 8 = **326** | grep over `tests/` |
| the briefs | 17 written (`KIT-BRIEFS.md`), 677 gross lines on adoption; briefs 1, P, J, 3 (411 lines) had no consuming row in DRAFT 0 | KIT-BRIEFS §"Counted ports" |

## 1 · The gates, and what each really blocks

| gate | state | blocks | does not block |
|---|---|---|---|
| **G1 · the briefs in the kit** (8 first; then 2, 3, 4, 7, 13) | unbuilt in alpha.24 | **C8** (occlusion by `paintedSpace`), **D1** (the window), **D5** (film overlay, TAKE MODE), **D7** (cells, lattice) | **C0–C7** — every brief's "Interim" paragraph keeps the app's road (the enumerator, the PAN knobs, the pickers, the caption, `createStageText`) |
| **G2 · which kit** | the `1.5.0` cut is open; the line moves (alpha.22→23: one file; 23→24: one commit) | nothing, once pinned | — |
| **G3 · the first look** (the glass is Josh's) | — | C0's INTENT rulings | — |

**R5-G1 (default = the first):** **pin alpha.24 at C0, freeze it in `MIR-MANIFEST.json`, re-adopt ONCE at the `1.5.0` cut** (BASINS
re-adopted four times; we budget one) · wait for the cut · adopt every alpha. Who builds the briefs in MIR is Josh's scheduling,
not a plan line (§3 Q2).

**Dependency table (row → brief; "—" = none):** C0–C7 — · C8 8 · C9 9′ · D1 13 + 7 · D2 3 (the journal: TO NOTEBOOK / PIN) · D3 — (+
the 18th brief, label avoidance) · D4 — or a 19th brief (a layer that hosts an element) · D5 6 + 7 · D6 — · D7 4 + 5 · D8 — · D9 —.

## 2 · The stages

### A · THE SEAMS (λWAVES only; `lab/mir` untouched; measured, not "lines down")

The acceptance of the whole stage: **the throwaway canary on alpha.24 shows the red list reduced to the kit's own deltas**, every
`__LW` verb the tests use unchanged (326 sites), serialize bytes identical on N snapshots (W130's gate) and a whole-`localStorage`
diff empty outside WORKSPACE after a project open. **Lines are measured per seam and may rise** (W130: +41 for two seams; the
subtraction is booked at C3/C4); a ledger line in REPORT per seam. No verifier agent; the frame-loop seams (A6, A7) get the S2
pattern — the device report back to back at equal load, plus their owning suite.

| # | seam | sites on this tree | gate (the closer that can see it) |
|---|---|---|---|
| **A0** | **the canary re-run** on THIS tree (85 suites) and on alpha.24: the full red list (each red's first assertion; `mir.test` hides the rest until its import is fixed — iterate), precache bytes, the stylehash recipe **opening the modulation window and the notebook** (R13 measured before C4); **the INFORMATIONAL spike**: mount `createInfoLayer` (it exists in alpha.24) over the stage in the throwaway with two labels and a block — `viewChanged` cost per frame under AUTO-ROTATE, legibility over 1s+2p, benzene's HOMO and C₆₀, a label under a rack column; the M5/WebKit commands for Josh (`?report=1&post=1`, `limits.html`, the persist probe) | a Sonnet task; nothing committed from the throwaway | the row; the spike decides D4, the ink-mode brief and whether D1 is 0.5.0 or 0.5.1 |
| **A10** | tests find things by hook (26 id selectors: `#modwin` 12, `#offer` 6, `#notebook` 4, `#rackAddList` 2, `#keymap` 1, `#sheet` 1; 50 `.km-`/chip-rail lines in 7 suites); the canary's four rewrites (`mir.test` §16 + import list → the manifest's inventory and exported names; `mir-manifest` accepts a pre-release + `"line"`; `slider-keys` reads `setKnobLaw().keyFine`; `access` A8 reads rendered text); **the driver-port race fixed once in `tools/gate/drv.mjs`** (a 4 s settle), not per test | `tests/` | node green on the untouched tree AND the throwaway; `history` 39 and `offer` 16 without a pause hack |
| **A11** | the kit precache rule: **"precache what a root reaches"** (PLAN §10 N4's design; it also closes the `wiring` red of 109 unreached modules) with `mir/locales/` and `mir/tokens.json` lazy; `sw.js` §1b's `DATA` semantic (page-written cache) stays separate; `tools/new-project.mjs` regeneration as a **documented adoption step** (bpm 60 → 30) | `sw.js`, `pwa.test`, `wiring.test`, `build-deploy` | `pwa` ≤ 8 MiB on the throwaway with the headroom stated (≈ 0.7 MiB today); `wiring` green there; the five dated allowlist rows consumed before **2026-12-06** |
| **A1** | the settings adapter `{read, write}` over `lambdawaves.q0.settings` — it owns the blob's **8 write sites** (`:193, :1309, :2779, :3825, :3829, :4288, :4291, :5648`) and SAYS which other families stay (`NB_*`, `PJ_KEY`, `LS_EXP/LS_PRES`, keys, library) | `:170–331` + the 8 | serialize bytes on 11 snapshots; whole-`localStorage` diff |
| **A3** | project parts with `capture/restore/signature`; **decide the double source of truth now**: the kit registers `pages`, `accent`, `rack`, `bpm` (ADOPTING §13) beside λWAVES' `modulation` record and WORKSPACE `layout` → `installModulation({project:false})` or `registerModulationParts`, chosen here; `serialize :4828–4883`, `restoreModulation :4893–4923`, `restore :4930–5107` SPLIT, not deleted | the three | `history` 39, `new-project` 8, the snapshot gate |
| **A6** | the one-clock facade `{play, pause, isPlaying, toggle, onChange, seek}` that **holds `host.clock.demand('app.play', true)`** while THE play runs (the mechanism exists at `host.js:474`) — this closes S0's open item (fresh-boot/NEW refusal); R-B1's retirement of LINKED/SEPARATE and the three PREFERENCE keys lands with it IF its gates hold, else at C4 | `:550–551, :912–921` (in `loop()`), `:2759, :3064–3103, :4736 (A9's row), :5413–5414, :5697, :199, :296–298` | the four scenes: play with editor closed / no routes / power off SUCCEEDS; pause releases; a routed source follows the one clock; the bare host still refuses; `history`, `take-in-bugs`, `mir-controls`, `render-exact`; device report back to back |
| **A5** | the modulation port as the `port` object (`defs :2530–2644`, `createModHost :2645–2653`, adapters + `modDodge :2654–2743`, the port `:2744–2786`, `modSyncBases :572–607`, `LW.mod ≈ :5395–5430` ≈ **330 lines**; the saving is C4's) | those | `mir-controls`, `lfo-tension`, `routed-knob`, `history`, the deterministic-replay judges |
| **A8** | the camera port `{get, set, subscribe, turn, home, ranges, angle:'rad'}` + **the bindings as ONE data table** in `stage-gestures.js` (today `e.altKey && !e.ctrlKey ? slide(e) : startSpecial(e)` is code) so Josh's change (§3 R5-C1) is a diff of data and brief 1 receives it as configuration | `:1258, :1525–1589, :2542–2545, :3220, :3349, :4616, :4820`; `stage-gestures.js` | `camera-shift` 11, `render-regressions`; no lock (no `writeView` change) |
| **A9** | the ACTIONS table: ids this tree has (`play, fullscreen, notebook, hideUI, keysheet, rack, dock, save, saveAs, modWin, modBar, modArm, undo/redo/redoY/historyUndo`) mapped to the kit's where a twin exists, with an alias map for saved bindings and the MENUS calls; every kit window a row with no chord (ADOPTING §11); `Ctrl` spelled explicitly for Ctrl+Shift+Q/E (never `Mod`); R-K1's first half (S stays WASD; FOLDERS' chord proposed) — its second half is **already** the binding (`:4736` Space + ctrl); `data-key-action` on the controls outside A5's and A8's regions (they tag their own) | `:4683–4760`, `:1229–2800` | `keyboard-shortcuts`, `keyboard-window`, a `Ctrl`-vs-`Mod` case |
| **A7** | occlusion providers per window species; `refreshOcclusion` concatenates; producers stay where they are (`:2700` A5's, `:3503`, `:3527` A4's, `:3995`) | `:3464–3512` | `frame-occlusion` 7/7 (its kit species come at C0); the device report back to back; **the lock cannot see this** (`digest-lock.mjs:34` sets occlusion itself) |
| **A12** (new) | the `__LW` surface: `api :1211–1265` and the `LW` literal `:5330–5608` as ONE object with named groups (`layout, mod, history, keys, projects, notebook, chem, camera`), members only added at the end during A, so C3–C6 are swaps behind a stable test surface | the two literals | the 326 test sites unchanged |
| **A4** (last, reduced) | "zero references outside the block" for the floating rack (`:3514–4500` mixes four owners; the kit adopts `#rack #rackL #floats` by id, so the residue is 19 outside references) and `__LW.layout`'s verbs unchanged; **not** a 1,065-line extraction (A2 dropped — the ~155 look lines are deleted by `createGui` at C2) | `:3514–3571` helpers, `layout :3572–3853` | `frame-occlusion`, `menubar`, `keyboard-window`, `history` |

**The eleven shared sites** (REVIEW-SONNET-0 §1.6) decide the grouping: **Z = A10 + A11** (disjoint, first) · **X = A1 + A3 + A6** (the
keys and the records) · **Y = A5 + A8** (the ports) · then **A9, A7** (their producers live in X/Y's regions) · **A12 and A4 last**.
Three builders at a time at most; `api`/`LW` members only appended. *In flight as this draft is written (launched before the review):*
A5+A6 as one builder and A9+A10+A11 as one; A4 stopped and reduced; X and A7/A12 follow their merges. Sizes: Z M · X L · Y M · A9 S ·
A7 S · A12 S · A4 S.

### B · THE CANARY, three times (not once)

A0 above (now, alpha.24 on this tree) · after Z/X/Y (the red list should be the kit's deltas only) · at the `1.5.0` cut (the
re-adopt). Each: adopt into a throwaway, `pwa --write`, 85 node, 27 browser once, stylehash with the modulation window and notebook
open, precache bytes; plus the M5/WebKit half the kit instruments (`probe.mjs serve`, `check-app.mjs --webkit`) — one command for
Josh each time. Nothing committed from a throwaway.

### C · THE ADOPTION (pinned alpha; the survey's leverage order; one verifier)

| # | consumer | what leaves | what stays / is new | closer |
|---|---|---|---|---|
| **C0** | **the bare adopt and the cascade**: `adopt.mjs --line 1.5` into the tree, `index.html:53–56, :67–68` → `mir/mir.css` with `@layer app, mir;` before `base.css` (ADOPTING §4); app rules on kit windows (`skin.css:106–107`), the **32 `!important`** (`lab.css` 12 + `skin.css` 20) into `app.*` layers with twin `:not(:where())` rules; the chip/rail hooks; the manifest pinned at alpha.24 | — | the kit's bytes | stylehash on 8 states + modwindow + notebook: **seven property classes** (press-scale transition, box-shadow, focus outline, `.dev-head` background, ON text-shadow, backdrop-filter, border — CAN item 9), each an INTENT ruling by Josh with a screenshot, or a bug; `adopt.mjs --check` in step |
| C1 | the CAMERA panel through A8's port (brief 2's interim: PAN knobs stay until the kit's pad) + RAMP/GRADE | `paletteview.js` 156, CAMERA MOTION 65 | **saved routes**: `observer.*`, `mat.*` keep their ids (`modPrefix`); a script over the 4 demos + the empty project asserts every route resolves | `camera-shift`, `palette`, the route script |
| C2 | `createGui` + `createPrefs` + `createAccent` (R2 first: `projectAccent:false`; R7/R-D1 `defaults`: light, refractive + ALWAYS frost, 22 px, 50 % VIVID, normal ink; the phone's TINTED/frost-OFF law stays the app's) + the look lift | INTERFACE + THEME·SURFACE ~155, `accent-wheel.js` 152, `native-ui`/`first-run` partly | the invariant **widened to a whole-`localStorage` snapshot minus WORKSPACE** (the look moves to `mir.gui`; the kit adds `mir.transport, mir.tier, mir.gui.tab, mir.flashNotice, mir.notes`); STATE-SCOPES rewritten; **the settings-surface ruling** (§3 R5-S1: Josh wrote "the Display setting in the Settings rack window, not MIR options") | `first-run`, `official-defaults-palette`, `new-project`, the snapshot diff, stylehash per class |
| C3 | rack + transport + menubar + keys + keyboard | the floating rack (`layout` 282 + helpers), transport+menus, `menubar.js`+`rack-menus.js` 198, `keymap.js` 934 + `shortcuts.js` + `keys.js` | **`keyboard-window.browser-test` rewritten wholesale** (the largest test rewrite in the plan); the KEYBOARD skin per §3 (λWAVES' by R-F1); a `Ctrl`-vs-`Mod` test | `menubar`, `keyboard-window`, `keyboard-shortcuts`, `frame-occlusion` over `[data-mir-window]` |
| C4 | the modulation window + one clock (`createModulation(port)` on A5; `installModulation(...).play` on A6's demand; the badge ladders leave `lab.css`) | `modwindow.js` 3,110, `lab.css :405–419, :813–841`, `audio.js` 438 | R-B1 complete if A6 deferred it | `mir-controls`, `lfo-tension`, `routed-knob`, `history`, `take-in-bugs`, the replay judges |
| C5 | history as the one `edit` domain | `history.js` 187, the card ~50 | `history.clear(label)` | `history` 39 (port race fixed in A10) |
| C6 | FOLDERS + notebook pages + project parts + **session/opener** (`createSession` for `save() :4924` and the boot read `:4935–4936`; `createOpener`, `bootVeil`, `installBanner`, `installWakeLock`) | PROJECTS ~330 (with `layout`'s NB/PJ part), `project-storage`/`-import` 66 | **R10's fixture**: an invalid collection never becomes an empty writable one; the 8 MB vs 24 MB cap; a 1.4 notebook → page 0; R-I3 both halves | `new-project` 8, `history`, `offer`, `molecule-demos`, the new fixture suite |
| C7 | the film: `createRecorder` with `frame(i, ctx)` | ~1,200–1,800 of `capture.js` + `render-exact.js` (**2,360** now) | **say what stays**: the GPU readback + settle, jitter seed 13, hazards H1–H3; `tests/render-exact.test.mjs` (716 lines) re-aimed at what stays; **the determinism verifier is here** (shared with D5) | `render-exact`, `export3d`, a PNG/loop/video |
| C8 | occlusion by brief 8's `paintedSpace` (A7's providers → one subscription) | the enumerator | `frame-occlusion` gains the kit species (FOLDERS, GUI, KEYBOARD, notice, dialog, banner, the INFORMATIONAL pane) | `frame-occlusion` on moved, scrolled, folded, paused windows |
| C9 | the offline layer stays the app's (R4): manifest and gates re-pinned (A10), `[data-mir-offer]` (brief 9′) with a case in `offer`, the precache rule (A11), **the scene guard** (`createSceneGuard({install:false})` from `stage-gestures.js`; BASINS' hit-probe "25 inside / 0 through"), **R14**: `gpu-recovery` named, FOLDERS' `thumbnail()` via `capture.js`'s readability probe | — | — | `pwa`, `wiring`, `mir-manifest`, `offer` 16 (+ the STATUS TAGS case), hit-probe, `gpu-recovery` |
| **C-V** | the adoption verifier (fresh Opus), scoped to what a fresh eye catches: the seven stylehash classes with Josh's rulings applied; the R1–R15 table each with its closer run; hit-probe; **main-thread ms/s while playing by CDP `Performance.getMetrics`** (ScriptDuration + Layout + RecalcStyle deltas; `tools/perf/cdp.mjs`) against a baseline taken BEFORE C on the 3070 and the M5 — the metric that sees 1.3 %; `adopt.mjs --check`; **one** 1004 + one 1148 lock; the `__LW` surface unchanged | | | |

Done when: the 15 risks each closed by the named closer (R10's and R14's are new suites); stylehash seven classes ruled; ms/s equal
within the baseline's noise; `lab/*.js` in **26.8–28.8k** (36,280 − 9,000…10,500 + 1,000…1,500; the survey's ranges nest, ~495
lines were double-counted, so the top of the range is likelier) + the seams' ledger; CLAUDE.md rewritten for the kit's windows.

### D · THE INFORMATIONAL (gated on G1 for D1/D5/D7; the A0 spike decides its shape)

| # | piece | rule | closer |
|---|---|---|---|
| D1 | the window (brief 13), the DISPLAY switch (Josh's instruction, not a ruling); `stage-text.js` → `addBlock` / `addLabel({ttl})` / `addLabel({anchor})`; the live-bound `{{state}}`, `{{E}}`, `{{T}}` | **a cost number first** (A0's spike: `viewChanged` per frame under AUTO-ROTATE with N labels; BASINS saw 30 vs 60 fps with rack glass) | the spike's budget held; 0 per-tick layout reads by the layer's own witness |
| D2 | **pages generated from the records** (38 + 4 demos: formula, group, gap, the HOMO's name, the record's own page), hydrogenic states by class, windows from the existing INFO copy; **the RPA root names in SPECTRUM** (the Sol thread's C3, Josh's D2 ruling); brief 3's TO NOTEBOOK / PIN FROM WINDOW (the journal "throughout the app") | **no model-authored number**: `CURATED_IE` verified against the primary handbooks or tagged UNVERIFIED on the page; no SRD 101 table (S4b's reading); the greeting-on-open is the ONE exception to "announce on hand presses only" (R5-I4) or `shouldGreet` off | the pages render in the notebook and the layer; the copy round-trips; the root names' Σ d_Λ m_Λ gate (ledger C3) |
| D3 | feature labels (`features()`: nuclei, lobes, frame corners; `place()`) | **the 18th brief**: label avoidance of windows (the kit avoids for blocks only; with the lens shift the pivot can sit under a rack column) | labels follow a turn and hold still after |
| D4 | the overlays (SHADOW, ORBIT, PLANE, CALCULUS) — **text only** through the layer, or **a 19th brief** (a layer that hosts an element); their positions WORKSPACE (STATE-SCOPES row) | the spike decides | a moved label persists |
| D5 | the film overlay (brief 6) + TAKE MODE (brief 7); the caption retired | the determinism verifier shared with C7 | a captured video carries the layer deterministically |
| D6 | FIGURE, chips, FLY-TO + search, SCENES (STATE: replaces A/B as two of eight), MAPS (H₂'s FCI curve first) | **one in, one out** per piece (the 0.4.0 table's law) | per piece |
| D7 | the pad with the lattice (brief 5; PAN knobs its targets) and `cells` (brief 4: the periodic table; a second mount in MOLECULES as the library's map — the S3 cells and S4b header retire, 38 gross lines) | — | ATOMS and MOLECULES suites |
| D8 | R-I2: `lw:` links and the HUD through the same engine | one banner per hand press | — |
| D9 | the legacy five — H₂⁺ and HELIUM are **field owners** (pages cannot own ψ): each becomes a MOLECULES/preset demo, keeps a window, or is deleted with a restore shim; QCD deleted; H₂ and ELECTROSTATICS by use (R5-L1 rewritten) | lines DOWN | the history/project suites open an old file naming them |
| D10 | **restored from PLAN §8 (SIBLINGS rows 0.5.0)**: 8 the library gallery (FOLDERS tiles for ORBITALS (l,n), ATOMS, MOLECULES), 19 the flash guard (the kit's judge replaces the page trap — the photosensitivity ruling), 20 the opener/title card (`startup` out, as BASINS), 21 the ink law (λWAVES' bright moving picture under frost is its case), 24 CURVES; briefs **P** (the paint gesture) and **J** (jetblack) consumed at C3/C2; brief **1** optional, not a dependency | — | per row |

Then **cut 0.5.0-alpha** locally. **0.4.1 BUCKYBALL** (C₆₀'s density from a grid record stored as its D₂h asymmetric unit — Josh's
D3 — at the experimental geometry, the I_h names) is a 0.4.x cut from the 0.4.0 tag, built when its stepping stones are measured; it
does not wait for 0.5.0 and 0.5.0 does not wait for it. **0.5.x:** the wave index, period-exact export, TIMELINE, LAYERS, ATLAS…

**The 0.5.0 minimum (R5-Q2):** if the briefs or the cut slip when A–C are done, 0.5.0 = A + B + C on the pinned alpha (λWAVES on
MIR 1.5, the subtraction booked) and the INFORMATIONAL window is 0.5.1 — or 0.5.0 holds for the window. Josh's call.

## 3 · Rulings for Josh (first option = default) and the three questions

- **R5-G1** pin alpha.24 at C0, re-adopt once at the cut · wait for the cut · adopt every alpha.
- **R5-C1 the camera bindings** (Josh 10-08: they may change): today left-drag orbits, Alt-drag or two fingers slide, wheel/pinch zoom
  at the cursor, Alt+Arrows nudge — **Q1: which bindings on a mouse, a trackpad and the iPad?** The answer becomes A8's table.
- **R5-Q2 the 0.5.0 minimum** (above) and who builds the briefs in MIR — Q2.
- **R5-S1 one settings surface or two:** **SETTINGS stays the surface; MIR OPTIONS hidden**, the kit's rows it lacks (CAPTIONS, LEAN,
  AUTO SCALE/governor/KEEP FRAMES) stay in SETTINGS · both shown. **R5-S2 the LANGUAGE menu:** **hidden** (λWAVES' strings are not
  translated; `mir/locales/` lazy) · shown. **R5-S3 the KEYBOARD window:** **λWAVES' charcoal-blue as an `app.*` layer** (R-F1: λWAVES
  originated it) · the kit's INTENT skin. — together **Q3: what may the adopted app show that it does not today?**
- **R-B1** one clock (yes) · **R-K1** S stays WASD, FOLDERS another chord (Ctrl+Space is already MOD arm) · **R-D1** λWAVES' first-run
  look · **R-I2** `lw:` links + HUD (yes) · **R-I3** pages travel with the project AND an open never closes the notebook · **R5-I4** the
  greeting on open is the one exception to hand-presses-only (default yes, `shouldGreet` honoured) · **R5-L1** H₂⁺ and HELIUM as
  MOLECULES/preset demos with a restore shim; QCD deleted; H₂ and ELECTROSTATICS by use · **R5-D2** no SRD 101 table; IEs only verified
  or tagged · photosensitivity: **the kit's pane** · toast: **BASINS' pill** · ABOUT **470 × 670** · NEW **leaves preferences alone** ·
  notes **recent 8, pages in the project** · keys for kit windows **none invented**.
- Carried from 0.4.0, still Josh's: Br₂ vs the cap; C₆₀'s `milestone` allowance; C₂₀H₂₀ a fixture; one rock-salt cube; the
  subtraction law unmet four times (+1,559).

## 4 · The numbers: measured, estimated, to take

Measured: §0's table; the 11 shared sites; 26 id selectors + 50 `.km-` lines; 326 `__LW` sites; 32 `!important`; KB's 677 gross.
Estimated (say so wherever used): 9,000–10,500 out (nested ranges, ~495 double-counted), 1,000–1,500 back (BASINS' ratio says
855–998), 1,200–1,800 of the film's 2,360. **To take, with the method:** main-thread ms/s while playing (CDP deltas, back to back at
equal load, 3070 and M5) BEFORE C; the per-seam line ledger; precache bytes per alpha; the seven stylehash classes with C0; the layer's
`viewChanged` cost per frame vs N labels (A0); whole-`localStorage` snapshots around a project open; the full red list on 85 suites.

## 5 · Order and the dial

A0 (Sonnet) · Z, then X and Y in parallel, then A9/A7, then A12/A4 — three builders at a time, `api`/`LW` members appended only, A4
last · B's second run · C0 with Josh's seven rulings · C1 → C9 in order (C1/C2 small, they teach the cascade) · C-V once · D in the
order the spike allows, D5's verifier shared with C7 · the cut. **Dial:** no verifier in A (device report back to back for A6/A7);
B is a Sonnet task; one verifier for C, scoped (§C-V); one for the film (C7/D5); locks only on `field.js`/shader commits and once at
C-V. Josh: "don't over-verify" — and the one thing the 0.4.0 locks could not see was the stage-8 kind of regression, hence the ms/s.

## 6 · What is not claimed

No line of 0.5.0's C or D is built; A's wave 1 is in flight. The briefs are unbuilt in alpha.24 and their arrival is not ours to
schedule. The INFORMATIONAL's cost and legibility over a WebGPU stage are unknown until A0's spike. The deletion totals are estimates
until each C row lands. The M5's numbers (persist, `limits.html`, the device report) are still Josh's one command. Nothing here
changes the no-push ruling; 0.4.0-alpha's local cut follows the kernel verifier, before A's merges.
