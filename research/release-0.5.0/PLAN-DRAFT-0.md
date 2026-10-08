# λWAVES 0.5.0 — PLAN-DRAFT-0 (Fable's pre-draft, 2026-10-08)

**One sentence.** 0.5.0 is THE ADOPTION of MIR 1.5 — λWAVES' interface code becomes the kit's, about a quarter of `lab/*.js`
leaves — and then THE INFORMATIONAL, the live markdown layer the 0.4.0 stage text was the first taste of. It is the release
that "takes the MIR flagship status from BASINS to λWAVES" in the kit's own terms: λWAVES becomes the second app on 1.5 and the
first with a 3-D stage under it.

## 0 · What 0.4.0 left on the table for 0.5.0 (the inputs, measured)

- The tree: `sos-s0` after S0–S5 (`lab/*.js` 36,280; `lab/mir` = MIR 1.4.3, 56 files; the 17 kit briefs written; the
  interim stage-text renderer, the ATOMS cells and the library chrome named as things 0.5.0 deletes once the kit carries them).
- The canary (one row, alpha.23): a bare adopt boots; 7/82 node suites red by regex and inventory, not by behaviour;
  precache 4.6 → 9.5 MiB (locales 1.57 MB + tokens.json 0.67 MB are the overrun); ~25 % of visible elements restyled with no
  code of ours (1,172 diffs, the same order as BASINS' 192 → fixed by INTENT rulings and `app.*` layers); browser 3/3 green.
- BASINS' eleven stages (survey §2.1): +1,850 / −19,320 app lines; the lesson of stage 8 (a forced paint per tick cost
  13 ms/s until found by measurement); four re-adopts for parity.
- The 15 risks (survey §2.3), the ten seams (§2.4), the 16 gaps (§6, now the 17 briefs), the defaults the kit flips (§7.3).
- The MIR side today: the 1.5 line is alpha.24; **brief 8 (`paintedSpace`), brief 4 (`cells`), brief 7 (`addLabel({ttl})`)
  and brief 13 (the INFORMATIONAL window) are not built**; the `1.5.0` cut date is open (FOR-JOSH 10-07).

## 1 · The three gates (what 0.5.0 cannot start without, and what it can)

| gate | state | what it blocks | what is NOT blocked |
|---|---|---|---|
| **G1 · the MIR session carries brief 8 first**, then 2/3/4/7/13 | not started in alpha.24 | the adoption's occlusion road (R1), the INFORMATIONAL window, the cells, the fade's TTL | everything in stage A; the pages as content |
| **G2 · the `1.5.0` cut** (PLAN R-G1, first option: wait; the canary runs again at the cut) | open | the adoption proper (stage C) — or Josh accepts a re-adopt per alpha as BASINS did (4×) | stages A and B |
| **G3 · a reviewer's eye on the first look** (stylehash's INTENT rulings are Josh's: "the glass is Josh's") | — | stage C's first commit | — |

Ruling to ask now (**R5-G1**): wait for `1.5.0` (first option, the plan's own) · or adopt alpha.24 now behind a throwaway
and re-adopt at the cut · or cut `1.5.0` from alpha.24 + the briefs (the MIR session's call, not ours).

## 2 · The stages

### A · THE SEAMS (λWAVES only; starts now; `lab/mir` untouched; lines DOWN or equal)

The ten seams of survey §2.4, each a module with one kit entry on the far side, plus the canary's four gate rewrites and the
precache policy. One builder per group, Opus; a light check per group; the digest lock only where the frame path is touched.

| # | seam | from | to | gate |
|---|---|---|---|---|
| A1 | **settings adapter** `{read, write}` over `lambdawaves.q0.settings`, split PREFERENCE / WORKSPACE (+ LIBRARY) | `rack.js` 164–326 and the scattered reads | one module feeding `createRack({store})`, `createGui`, window `persist` later | `new-project --check`; a project open leaves the file byte-identical outside WORKSPACE keys (the existing suite) |
| A2 | **look store** (theme, card, frost, disc, blur, accent) | THEME/SURFACE 1264–1530 | one object + a one-time lift (`lookFromPrefs` shape) | `first-run`, `official-defaults-palette` |
| A3 | **project parts** with `capture/restore/signature` (experiment, hamiltonian, LOOK, overlays, modulation, ab, palette, notebook, library ref) | `serialize()/restore()` | `registerProjectPart` shape; `serialize({scope:'edit'})` stays the one history record | `history` 39, `new-project` |
| A4 | **floating-rack module** exposing `register/open/close/float/dock/capture/apply` | `rack.js` 3307–4370 (~1,065) | one module | `frame-occlusion`, `menubar`, `keyboard-window` |
| A5 | **modulation port module** | `rack.js` 2352–2640 + 5243–5390 (~440) | the `port` for `createModulation` (~150) | `mir-controls`, `lfo-tension`, `routed-knob`, `history` |
| A6 | **one-clock facade** `{play, pause, isPlaying, toggle, onChange, seek}` (R-B1: the transport's play is THE play; modulation gets POWER; LINKED/SEPARATE retired; `modArm`/`clockLink` leave PREFERENCE) | `playMod`, `clockLink`, `modArm`, `modCadence` | one facade; the kit's app-play demand later | `current`, `history`, `take-in-bugs` (S0's LINKED test rewritten to the facade) |
| A7 | **occlusion providers**: each window species registers `paintedRects()`; `refreshOcclusion` concatenates (32-rect cap, the paused-PRESENT law kept) | the enumerator 3464–3512 | providers; brief 8 replaces the enumerator only | `frame-occlusion` 7/7; the 588 lock |
| A8 | **camera port** `{get, set, subscribe, turn, home, ranges, angle:'rad'}` over `camera`/`obs` (S2's `setShift`, `zoomAt` included) | `camera-law.js` + `rack.js` 1497–1560 | the port the kit's CAMERA panel consumes (brief 2) | `camera-shift` 11, `render-regressions`, the 588 lock |
| A9 | **actions table** ids renamed to the kit's (`folders`, `help`, `save`, `transport.play`, `rack`, `dock`, `hide`, `fullscreen`), `data-key-action` on controls; **R-K1** (S stays WASD; FOLDERS takes another chord; MOD arm on Ctrl+Space) | `rack.js` 4514–4650 | the rows the kit's `createKeys` reads | `keyboard-shortcuts`, `keyboard-window` |
| A10 | **tests find things by hook** (`data-mir-window`, `data-mir-rail`, `data-menu`), never by id or English label; the canary's four: `mir.test` §16 and the import list against the manifest's inventory, `mir-manifest` accepts a pre-release and `"line"`, `slider-keys` asserts the kit's law not `.709`, `access` A8 asserts rendered text | the suites | the suites | `bash test.sh node` green on the untouched tree AND on a throwaway adopted copy |
| A11 | **kit precache policy**: extend S4a's one rule (`DATA = ['library/']`) with a skip list (`mir/locales/`, `mir/tokens.json`) so a 1.5 adoption fits the 8 MiB ceiling (7.3 MiB measured) | `sw.js` §1b, `pwa.test` | the same rule, two entries longer | `pwa` on the throwaway adopted copy ≤ 8 MiB |

Done when: every seam's lines ≤ before (A4 and A5 are the big subtractions), node + the named suites green, the 588 lock
green after A7/A8, and **the throwaway canary re-run on alpha.24 shows the seven node reds gone** (that is the test of A10/A11).
No verifier; the Major Agent looks once per group.

### B · THE CANARY II (at the `1.5.0` cut, or on alpha.24 if R5-G1 says adopt now)

The canary's recipe plus what it missed: stylehash opening the modulation window and the notebook (R13 unmeasured); every
browser suite, not three; the device report on the adopted copy. One row. Nothing committed from it. A Sonnet task.

### C · THE ADOPTION (gated on G1 + G2; the survey's leverage order; a verifier at the end — "at 0.5.0, the adoption")

| # | consumer | what leaves λWAVES | risks closed | gate |
|---|---|---|---|---|
| C1 | **the CAMERA panel** through A8's port (brief 2: PAN pad, 3-D HOME, the CSS port) + RAMP/GRADE panels for the palette and LOOK rows | `paletteview.js` 156, the camera UI ~65, PAN X/Y knobs | — | `camera-shift`, `palette`, the 1004 lock |
| C2 | **`createGui` + `createPrefs`** (R2 first: `projectAccent:false`; R7 `defaults` = λWAVES' light, refractive + ALWAYS frost, 22 px, 50 % VIVID, normal ink — **R-D1**; the phone's TINTED/frost-OFF law stays the app's) + the look-store lift | SETTINGS 163, THEME/SURFACE ~267, `native-ui.js`/`first-run.js` partly | R2, R7 | `first-run`, `official-defaults-palette`, `new-project` byte-identity, stylehash with INTENT rulings |
| C3 | **rack + transport + menubar + keys** (`createRack({store})`, `createTransport` with the physics clock, `createMenubar`, `createKeys` + `keyboard.js`) | the floating rack ~1,065, transport+menus ~165, `menubar.js`+`rack-menus.js` 198, `keymap.js`+`shortcuts.js`+`keys.js` 1,104 | R8, R9 | `menubar`, `keyboard-window`, `keyboard-shortcuts`, `frame-occlusion` (A7's providers over `[data-mir-window]`) |
| C4 | **the modulation window + one clock** (`createModulation(port)` on A5, the app-play demand on A6; the badge ladders leave `lab.css`) | `modwindow.js` 3,110, `lab.css` 405–419/813–841, `audio.js` 438 → `audio-capture` | R6, R13 | `mir-controls`, `lfo-tension`, `routed-knob`, `history`, `take-in-bugs` |
| C5 | **history** as the one `edit` domain (`history.clear(label)` for boot/link/open/new) | `history.js` 187, the HISTORY card ~50 | R3 | `history` 39 |
| C6 | **FOLDERS + notebook pages + project parts** (A3 → `registerProjectPart`; the 1.4 notebook → page 0; the collection lift; **R-I3** pages travel with the project AND "an open never closes the notebook") | PROJECTS ~330, `project-storage`/`-import` 66, `accent-wheel` 149 | R10, R11 | `new-project` 8, `history`, `offer`, `molecule-demos` |
| C7 | **the film** (`createRecorder` with `frame(i, ctx)` = the GPU readback + settle; the exact-time law's 39 gates kept) | `capture.js` + `render-exact.js` ~1,200–1,800 of 2,330 | — | `tests/render-exact` 39, `export3d`, a captured PNG/loop/video |
| C8 | **occlusion** through brief 8's `paintedSpace` (A7's providers become one subscription) | the enumerator | R1 | `frame-occlusion` 7/7 on moved, scrolled, folded and paused windows; the 1004 lock |
| C9 | **the offline layer stays the app's** (R4): the manifest and gates re-pinned against the 1.5 inventory (A10), `[data-mir-offer]` (brief 9′), the precache policy (A11) | — | R4, R12, R14 (keep λWAVES' GPU recovery) | `pwa` ≤ 8 MiB, `mir-manifest`, `offer` 16 |
| C-V | **the adoption verifier** (fresh Opus): stylehash on 8 states + the modulation window + the notebook with every diff an INTENT ruling or a bug; the whole browser gate; the 1004 and 1148 locks; the device report equal (BASINS' stage-8 lesson: ms/s on the main thread while playing, before and after); `lab/*.js` DOWN by the thousands the plan names; every one of R1–R15 named with the test that closes it | | | |

Done when: `lab/*.js` ≈ 26–27k (the survey's 9–10.5k out, 1–1.5k glue back); stylehash 0 open; every suite green; the locks
green; the device report equal; CLAUDE.md rewritten for the kit's windows (ids `#modwin` kept).

### D · THE INFORMATIONAL (gated on C; brief 13 in the kit)

| # | piece | source | gate |
|---|---|---|---|
| D1 | **the INFORMATIONAL window** (brief 13) with its switch in SETTINGS › DISPLAY (**R-I1**); `stage-text.js` deleted — the formula → `layer.addBlock({md})`, the fade → `addLabel({ttl})`, the atom labels → `addLabel({anchor})`; the live-bound `{{state}}`, `{{E}}`, `{{T}}` | S3's interim API, the kit layer | `stage-text` rewritten for the layer; 0 per-tick layout reads; KaTeX only on change |
| D2 | **pages as content** (`.md`, Obsidian-readable): per molecule (the record's page already), per named orbital, per state, per window; the greeting as page 0 of the three demos — **authored early** (a Sol or Haiku 5.5 task in A/B, reviewed once), wired here | the records, `names.js`, `latex-state.js` | the pages render in the notebook and the layer; the copy still round-trips |
| D3 | **feature labels** (`features()`: nuclei, the HOMO's lobes, the frame corners; `place()` for the stage's own coordinates) | `cameraEye`/`toScreen` | labels follow a camera turn and hold still after |
| D4 | **the overlays as movable layers**: SHADOW, ORBIT, PLANE, CALCULUS (`setEdit`) | the windows' canvases | a moved overlay persists in WORKSPACE |
| D5 | **the film overlay** (brief 6) + **TAKE MODE** (brief 7: `setCheap`, `html[data-take]`) — the caption in capture retired | `capture.js` after C7 | a captured video carries the layer deterministically |
| D6 | **FIGURE, chips, FLY-TO + search, SCENES** (STATE, replacing A/B as two of eight), **MAPS** (H₂'s FCI curve first) | SIBLINGS rows 1, 2, 4, 6, 9 | per piece |
| D7 | **the pad with the lattice** (brief 5; CAMERA's PAN knobs are its targets) and **`cells`** as the periodic table AND, mounted a second time in MOLECULES, the library's map (brief 4; the S3 ATOMS cells and the S4b header retire) | S2, S3, S4b | the ATOMS and MOLECULES suites |
| D8 | **R-I2**: `lw:` action links in pages and the non-educational HUD (palette and camera announcing) through the same engine | | one banner per hand press, none on restore |
| D9 | **the legacy windows decided**: H₂⁺, HELIUM, H₂, ELECTROSTATICS, QCD — each re-adopted as a page + a layer, or deleted (Josh names them) | `docs/LEGACY-WINDOWS.md` | lines DOWN |

Then **cut 0.5.0-alpha** (locally, until Josh says the plan has run its course). 0.5.x after: the wave index (station ring,
carousel, `Q_LM`), the RPA root names in SPECTRUM (the Sol thread's C3), period-exact export, TIMELINE, LAYERS, ATLAS…

## 3 · Rulings for Josh (each flips one line; the first option is the default)

- **R5-G1** wait for `1.5.0` · adopt alpha.24 now and re-adopt at the cut · cut `1.5.0` from alpha.24 + the briefs.
- **R5-M1** who runs the MIR session for the briefs (brief 8 first): Josh's primary account when its week resets · this account
  as a second session · Sol on the kit (it wrote the briefs).
- **R-B1** one clock (default yes) · **R-K1** S stays WASD, FOLDERS takes another chord, MOD arm on Ctrl+Space (default) ·
  **R-D1** λWAVES' first-run look under the kit (default) · **R-I1** the INFORMATIONAL switch in SETTINGS › DISPLAY (default)
  · **R-I2** `lw:` links + the HUD (default yes) · **R-I3** pages travel with the project (default) and an open never closes
  the notebook (both).
- From survey §7.3, one line each (defaults in **bold**): photosensitivity notice — **the kit's floating pane** vs the page trap ·
  toast — **BASINS' pill** vs a corner stack · ABOUT — **470 × 670** kept · NEW — **leaves preferences and arrangement alone**
  (compatible) · notes — **recent 8, pages in the project** · the KEYBOARD window — **the kit's INTENT skin** vs CLAUDE.md's
  charcoal-blue (a skin ruling; the glass is Josh's) · keys for the kit's windows — **no chord invented** · the camera's
  mouse bindings and touch gestures — Josh said they may change; a row here when he names them.
- **R5-L1** the legacy five (D9): **re-adopt H₂⁺ and HELIUM as pages + layers, delete QCD, decide H₂ and ELECTROSTATICS by use**.

## 4 · Numbers taken and numbers to take

Taken: BASINS +1,850 / −19,320; λWAVES' estimate 9,000–10,500 out, 1,000–1,500 back (survey §2.2); precache 9.46 MiB → 7.3 MiB
without locales/tokens; 1,172 stylehash diffs on a bare adopt; the stage-8 lesson 45.0 vs 32.0 ms/s. To take in A/B: the
seams' own line counts per group; the throwaway's node reds after A10/A11 (target 0); the main-thread ms/s while playing on
the untouched tree (the baseline the adoption must equal); the device report on the adopted copy.

## 5 · Order, and the verification dial

A now (parallel groups: A1+A2+A3 one builder, A4 one, A5+A6 one, A7+A8 one, A9+A10+A11 one — disjoint regions of `rack.js`,
merged in that order) · B at the cut · C in the table's order, C1/C2 first because they are small and teach the cascade ·
C-V once · D1–D9 with one light check each, a verifier only for D5 (the film) · the cut. One Sol thread, if any: the
INFORMATIONAL's page content and `features()` naming, not the adoption.

## 6 · What is not claimed

No line of 0.5.0 is built. The kit side of every brief is unbuilt in alpha.24; the `1.5.0` date is the MIR session's. The
INFORMATIONAL has run in no real app, on no touch device, over no WebGPU stage. The adoption's line counts are the survey's
estimates. The M5 numbers of 0.4.0 are still pending (Josh's one command). Nothing here changes the no-push ruling.
