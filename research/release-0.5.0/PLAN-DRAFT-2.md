# λWAVES 0.5.0 — PLAN-DRAFT-2 (Fable, 2026-10-08, after AUDIT-OPUS-1)

**One sentence.** 0.5.0 is THE ADOPTION of MIR 1.5 — λWAVES' interface code becomes the kit's — and then THE INFORMATIONAL; and it
is the release judged by one number before any feature: **`lab/*.js` falls.** 0.4.0 added +1,559 lines (34,721 → 36,280) against its
own law, every stage of it added; 0.5.0 is where the subtraction lands. Stage A is cut to what C cannot do without and is capped at
+150 lines in total; D runs a ledger whose net must be ≤ 0.

*Every **[OPUS]** mark of AUDIT-OPUS-1 Part A is taken into plain text below, except three, each named in §6 ("overruled").*

## 0 · The inputs, measured on this tree

| input | value | source |
|---|---|---|
| `lab/*.js` | **36,280** (0.4.0 +1,559, +4.5 %); A5 has since come in at **−44** on its branch (`mod-port.js` +119, `rack.js` −163) | `wc -l` at `7d10a63`; A5-A6-HANDOFF |
| the gates | **85 node suites, 27 browser suites** | `ls tests` |
| precache today | 188 files, **4.53 MiB**; ceiling 8 MiB (`pwa.test.mjs:302`) | S4a-BUILD |
| the canary (alpha.23 on `61f7c2c`) | boots; 7 node reds (regex/inventory, not behaviour); +196 kit files, 4.63 → 9.46 MiB; **136–150 of 595 elements restyled per state** (BASINS' first look: 192 elements); browser 3/3 | `docs/MIR-1.5-CANARY.md` |
| the kit | 1.5 line at **alpha.24**; no `cells.js`, `lattice.js`, `info/window.js`, `paintedSpace`; `host.js:474 demand(id, on)` exists on 1.4.3 and `anyLive()` (`:223–228`) counts demands, so a held `demand('app.play')` lifts the `nothing-to-run` refusal (`:347–352`) **today** | `ls mir/controls mir/info`; `lab/mir/modulation/host.js` |
| BASINS | +1,850 / −19,320 over 11 stages; four parity re-adopts; stage 8: **+13 ms/s** main-thread while playing = **+40 % of its 32 ms/s busy time**, found only by measurement | survey §2.1 |
| the wiring clock | five allowlist rows dated 2026-10-07, `EXPIRE_DAYS = 60`: **red on 2026-12-06**; in the 1.5 kit `gui.js` imports `accent.js` + `about.js` and `notebook.js` imports `about.js`, so C2/C6 consume four rows and C3 (`wordmark`, `menubar`) the fifth — or R5-W1 retires all five | `tests/wiring.test.mjs:61–65, :463`; the kit |
| the test surface | **1,507 uses of 96 distinct `__LW` members in 29 test files** (`.chem` 212, `.settle` 111, `.layout` 137, `.mod` 93, `.states` 84, `.history` 67 …) | grep over `tests/*.mjs` |
| the briefs | 17 (`KIT-BRIEFS.md`), 677 gross lines on adoption | KIT-BRIEFS |
| the legacy five | `qcd.js`+`qcdview.js` 219 · `h2.js`+`h2ci.js`+`h2view.js` 598 · `helium.js`+`heliumview.js` 215 · `electrostatics.js` 437 = **1,469** lines, before what each keeps | `wc -l` |

## 1 · The gates, and what each really blocks

| gate | state | blocks | does not block |
|---|---|---|---|
| **G1 · the briefs in the kit** (8 first; then 2, 3, 4, 7, 13) | unbuilt in alpha.24 | **C8**, **D1**, **D5**, **D7** | **C0–C7** — every brief's "Interim" keeps the app's road |
| **G2 · which kit** | the `1.5.0` cut is open; the line moves one commit at a time | nothing, once pinned | — |
| **G3 · the first look** (the glass is Josh's) | — | C0's seven INTENT rulings | — |

**R5-G1 (default first):** **pin alpha.24 at C0, freeze it in `MIR-MANIFEST.json`, re-adopt ONCE at the first kit version that carries
brief 8** (whether or not that is the cut; a second re-adopt only if `1.5.0` is cut later; the budget is one, at most two — BASINS took
four) · wait for the cut · adopt every alpha. This flips the HANDOFF's in-flight default "wait"; the flip needs Josh's word before C0,
not before A, because A is the same work under either.

**Dependency table (row → brief; "—" = none):** C0–C7 — · C8 8 · C9 9′ · D1 13 + 7 · D2 3 · D3 — (+ the 18th brief, label avoidance)
· D4 — (text only) or a 19th brief · D5 6 + 7 · D6 — · D7 4 + 5 · D8 — · D9 —.

## 2 · The stages

### A · THE SEAMS (λWAVES only; `lab/mir` untouched; capped at +150 lines in total)

**The acceptance of the stage:** the throwaway canary on alpha.24 shows the red list reduced to the kit's own deltas; **THE `__LW` LAW:**
no A or C commit renames or removes a `__LW` member a test uses unless that test is edited in the same commit (all 96 members, 1,507
uses; a rule, 0 lines; it replaces any "test-surface seam"); a whole-`localStorage` diff empty outside WORKSPACE after a project open;
one ledger line in REPORT per seam, lines measured and allowed to rise, the stage's sum ≤ +150. No verifier agent; the frame-loop seams
(A6, A7) take the S2 pattern — the device report back to back at equal load, plus their owning suite. **Two builders on `rack.js` at a
time**, a third only when it is A0 (a throwaway).

| # | seam | sites on this tree | closer |
|---|---|---|---|
| **A0** | **the baseline on this tree** (85 suites' red list, precache, stylehash `before`/`before2`); **the adopted half is A9–A11's throwaway run** (A0 reads its row, does not repeat it); **stylehash with the modulation window and the notebook OPEN** on an adopted copy (R13 sized before C4); **the INFORMATIONAL spike** over the stage in that copy, decided by rule (§B-spike below); the M5/WebKit commands for Josh | the throwaway; nothing committed from it | the row; the spike's five rules |
| **A10** | tests find things by hook (26 id selectors; 50 `.km-`/chip-rail lines in 7 suites); the canary's four rewrites (`mir.test` §16 + import list → the manifest's inventory and exported names; `mir-manifest` accepts a pre-release + `"line"` **while its per-version sha-256 `ACCEPTED` pin stays exactly — alpha.24's hash enters only at C0's two-file edit**; `slider-keys` reads `setKnobLaw().keyFine`; `access` A8 reads rendered text); **the driver-port race fixed once in `tools/gate/drv.mjs`** | `tests/`, `tools/gate/` | node green on the untouched tree AND the throwaway; `history` 39 and `offer` 16 without a pause hack |
| **A11** | the kit precache rule (skip `mir/locales/` and `mir/tokens.json`, or "precache what a root reaches"); `sw.js` §1b's `DATA` (page-written, `:224–231`) stays a separate semantic; `tools/new-project.mjs` regeneration as a documented adoption step (bpm 60 → 30). **It does NOT clear the `wiring` red** — `pwa.test.mjs:244–251` derives the unprecached set from wiring's ALLOWLIST and `wiring.test` fails on any `lab/**/*.js` no root reaches, precached or not — so A11 proposes **R5-W1** (§3) as a flagged, separate commit, no silent fold | `sw.js`, `pwa.test`, `build-deploy` | `pwa` ≤ 8 MiB on the throwaway (headroom ≈ 0.7 MiB today, stated); `wiring` green there under R5-W1 once ruled |
| **A1** | the settings adapter `{read, write}` over `lambdawaves.q0.settings`: it owns the blob's **7 writes and 1 remove** (`:193, :1309 removeItem, :2779, :3825, :3829, :4288, :4291, :5648`) and says which families stay (`NB_*`, `PJ_KEY`, `LS_EXP/LS_PRES`, keys, library) | `:170–319` + the 8 | the blob byte-identical across boot → save → reload on the 4 demos + the empty project; the whole-`localStorage` diff |
| **A6** | the one-clock FACADE `{play, pause, isPlaying, toggle, onChange, seek}` holding `host.clock.demand('app.play', true)` **only while `modArm && clockLink`** (today's MOD arm keeps its meaning), released on pause — closes S0's open item (fresh-boot/NEW refusal); the dead LINKED retry `:912–921` and the re-arm `:2749` deleted (−11). **The retirement of LINKED/SEPARATE and of `modArm`/`clockLink`/`modCadence` in PREFERENCE goes to C4 unconditionally** (it changes STATE-SCOPES, `new-project`, five test sites and a key row — a behaviour change Josh sees, with the kit window that replaces it) | `:550–551, :912–921, :2749, :2759, :3064–3103, :4736 (A9's row), :5413–5414, :5697, :199, :296–298` | the four scenes (play with editor closed / no routes / power off SUCCEEDS under LINKED; pause releases; a routed source follows; the bare host still refuses); `take-in-bugs`, `history` 39, `mir-controls`, `routed-knob`, `lfo-tension`; device report back to back. Not `current` (red on the base), not `render-exact` |
| **A5** | **DONE** (`f9b47dd`): `lab/mod-port.js`, the `port` object `createModulation(port)` takes (M, registry, targets, clock, apply, knobOf, persist, cadence, setCadence, armed, arm, audio, rateControl, moved, opened, closed); −44 | — | green: node 85, `mir-controls`, `lfo-tension`, `routed-knob`, `history` |
| **A8** | the camera port `{get, set, subscribe, turn, home, ranges, angle:'rad'}` + **the bindings as ONE data table** in `stage-gestures.js` (today code: `e.altKey && !e.ctrlKey ? slide(e) : startSpecial(e)`), so R5-C1 is a diff of data and brief 1 receives it as configuration | `:1258, :1525–1571, :2542–2545, :3220, :3349, :4616, :4820`; `stage-gestures.js` | `camera-shift` 11, `render-regressions`; no lock |
| **A9** | **DONE** (A9–A11's branch): the ACTIONS table (`:4683–4750`) mapped to the kit's ids where a twin exists, an alias map for saved bindings and the MENUS calls, every kit window a row with no chord, `Ctrl` explicit for Ctrl+Shift+Q/E, R-K1's first half; `data-key-action` outside A5's/A8's regions | — | `keyboard-shortcuts`, `keyboard-window`, a `Ctrl`-vs-`Mod` case |
| **A7** | occlusion providers per window species; `refreshOcclusion :3464` concatenates; producers stay (`:2700` now in `mod-port.js`, `:3503`, `:3527`, `:3995`) | `:3464–3512` | `frame-occlusion` 7/7 (kit species at C0); device report back to back. The lock cannot see this (`digest-lock.mjs:34` sets occlusion itself) |

**Struck from A** (and why): **A2** the look store — ~155 lines that `createGui` deletes at C2; build the one-time lift there. **A3**
project parts — moves to C6 as ONE part over `serialize()`/`restore()` with `signature = projectKey()` (W130's byte gate moves with
it); the canary named no A3 block; what A keeps is the DECISION, **`installModulation({ project: false })`** (R5-A3): λWAVES' `modulation`
record already carries transport and BPM and WORKSPACE `layout` already travels, so a kit `rack`/`bpm` part would be a second source of
truth (ADOPTING §13). **A4** the floating rack — `createRack` adopts `#rack #rackL #floats` by id, so the 19 outside references stay
valid after C3; the parked branch (`worktree-agent-a42dc49a851951ba4`, `4bd0bbc`) is C3's reference and is never merged. **A12** the
`__LW` object — wrong spans (`api :1211–1251`, `LW :5330–5580`), a refactor every group would conflict on, 0 subtraction; the `__LW`
law does its job.

**Waves.** Wave 1 (in flight): A5+A6 (one builder; A5 done) ∥ A9+A10+A11 (one builder; A9 done, A10 half, A11 next) ∥ A0 (a throwaway).
Wave 2 after both merge: **A1 + A8** as one builder (A1 shares `:199/:296–298` with A6; A8 shares `:2542–2545` with A5) ∥ **A7**. Sizes:
A0 M · A5+A6 M · A9–A11 M · A1+A8 M · A7 S.

### B · THE CANARY, twice; and THE SPIKE's five rules

A0 now (the baseline + A9–A11's adopted row + stylehash open + the spike) · at the re-adopt (then all 27 browser suites, because C0
is real). Each: adopt into a throwaway, `pwa --write`, 85 node per suite (first message kept), the 9 browser suites that touch
kit-derived DOM now (`frame-occlusion`, `history`, `new-project`, `mir-controls`, `lfo-tension`, `routed-knob`, `keyboard-window`,
`offer`, `official-defaults-palette`), stylehash with the modulation window and notebook open, precache bytes; plus the M5/WebKit
commands for Josh. Nothing committed from a throwaway.

**The spike decides by rule** (Part B §6): (1) **cost** — CDP `TaskDuration` ms/s under AUTO-ROTATE, N = 0, 2, 8, 16 labels + 1 block,
bare and pane, `viewChanged()` only on a `cameraKey` change: at N = 8 bare ≤ +10 % over N = 0 and 0 held frames → D1 ships in 0.5.0,
else D1 waits for brief 7's coalesced `viewChanged` (0.5.1); (2) **legibility** — 1s+2p, benzene HOMO, C₆₀ HOMO × light/dark × frost
on/off = 12 screenshots, bare and bare with `mix-blend-mode: difference` on the layer ROOT; Josh judges: bare reads in ≥ 10 of 12 → no
ink brief; only `difference` reads → a small INVERT brief; neither → pane mode with its measured cost; (3) **under a rack** — at shift
±1, labels whose rect meets the rack's keep-clear: any > 0 confirms the 18th brief; (4) **D4** — an `addBlock` holding an `<img>`/SVG
data URL survives the sanitiser? no → text only; (5) **touch/WebKit** — one command for Josh, pending not blocking.

### C · THE ADOPTION (pinned alpha; the survey's leverage order; one verifier; the one lock at C7)

| # | consumer | what leaves | what stays / is new | closer |
|---|---|---|---|---|
| **C0** | the bare adopt and the cascade: `adopt.mjs --line 1.5` into the tree, `index.html:53–56, :67–68` → `mir/mir.css` with `@layer app, mir;` before `base.css` (ADOPTING §4); app rules on kit windows (`skin.css:106–107`); the **32 `!important`** (`lab.css` 12 + `skin.css` 20) into `app.*` layers with twin `:not(:where())` rules; the chip/rail hooks; the manifest pinned at alpha.24 **+ its sha-256 into `ACCEPTED`** (S0's two-file edit); R5-W1 applies from this commit | — | the kit's bytes | stylehash on 8 states + modwindow + notebook: **seven property classes** (press-scale transition, box-shadow, focus outline, `.dev-head` background, ON text-shadow, backdrop-filter, border), each an INTENT ruling by Josh with a screenshot, or a bug; `adopt.mjs --check` in step |
| C1 | the CAMERA panel through A8's port + RAMP/GRADE | `paletteview.js` 156, CAMERA MOTION **47** (`:1525–1571`) | saved routes keep their ids (`observer.*`, `mat.*`; `modPrefix`): a script over the 4 demos + the empty project asserts every route resolves | `camera-shift`, `palette`, the route script |
| C2 | `createGui` + `createPrefs` + `createAccent` (R2: `projectAccent:false`; R-D1 `defaults`: light, refractive + ALWAYS frost, 22 px, 50 % VIVID, normal ink; the phone law stays the app's) + the look lift | INTERFACE + THEME·SURFACE ~155, `accent-wheel.js` 152, `native-ui`/`first-run` partly | the invariant widened to a whole-`localStorage` snapshot minus WORKSPACE; STATE-SCOPES rewritten; R5-S1 (SETTINGS stays the surface; MIR OPTIONS hidden); brief J consumed | `first-run`, `official-defaults-palette`, `new-project`, the snapshot diff, stylehash per class |
| C3 | rack + transport + menubar + keys + keyboard | the floating rack (`layout :3572–3853` + helpers), transport+menus, `menubar.js`+`rack-menus.js` 198, `keymap.js` 934 + `shortcuts.js` + `keys.js` | `keyboard-window.browser-test` rewritten wholesale; `__LW.layout`'s 137 uses keep their verbs (A4's reference branch shows the seams); the KEYBOARD skin λWAVES' (R5-S3); a `Ctrl`-vs-`Mod` test; brief P consumed | `menubar`, `keyboard-window`, `keyboard-shortcuts`, `frame-occlusion` over `[data-mir-window]` |
| C4 | the modulation window + one clock (`createModulation(port)` on A5; `installModulation(...).play` on A6; `installModulation({ project: false })`) | `modwindow.js` 3,110, `lab.css :405–419, :813–841`, `audio.js` 438 | **R-B1 complete here**: LINKED/SEPARATE retired, the three keys leave PREFERENCE, STATE-SCOPES and `new-project` regenerated | `mir-controls`, `lfo-tension`, `routed-knob`, `history`, `take-in-bugs`, the replay judges |
| C5 | history as the one `edit` domain | `history.js` 187, the card ~50 | `history.clear(label)` | `history` 39 |
| C6 | FOLDERS + notebook pages + **ONE project part** over `serialize()`/`restore()` (A3) + session/opener (`createSession` for `save() :4924` and the boot read `:4935–4936`; `createOpener`, `bootVeil`, `installBanner`, `installWakeLock`) | PROJECTS ~330, `project-storage`/`-import` 66 | serialize bytes identical on the 4 demos + the empty project + 6 history snapshots; R10's fixture (an invalid collection never becomes an empty writable one; the 8 vs 24 MB cap; a 1.4 notebook → page 0); R-I3 both halves | `new-project` 8, `history`, `offer`, `molecule-demos`, the fixture suite |
| C7 | the film: `createRecorder` with `frame(i, ctx)` | ~1,200–1,800 of `capture.js` + `render-exact.js` (2,360) — **the swing of the whole release** | what stays named (the GPU readback + settle, jitter seed 13, hazards H1–H3); `tests/render-exact.test.mjs` (716 lines) re-aimed at it; **the determinism verifier here** (shared with D5); **THE ONE LOCK of C — 1004 and 1148 — runs here**, the only C row on the readback path | `render-exact`, `export3d`, a PNG/loop/video |
| C8 | occlusion by brief 8's `paintedSpace` | the enumerator | `frame-occlusion` gains the kit species | `frame-occlusion` on moved, scrolled, folded, paused windows |
| C9 | the offline layer stays the app's (R4): gates re-pinned (A10), `[data-mir-offer]` with a case in `offer`, the precache rule (A11), **the scene guard** (`createSceneGuard({install:false})` from `stage-gestures.js`; hit-probe 25 inside / 0 through), **R14**: `gpu-recovery` named, FOLDERS' `thumbnail()` via the readability probe | — | — | `pwa`, `wiring`, `mir-manifest`, `offer` 16, hit-probe, `gpu-recovery` |
| **C-V** | the adoption verifier (fresh Opus), scoped: the seven stylehash classes with Josh's rulings applied; the R1–R15 table, each closer run; hit-probe; **main-thread ms/s while playing by CDP `Performance.getMetrics` `TaskDuration`** (Script/Layout/RecalcStyle as attribution) against a baseline taken BEFORE C on the 3070 — interleaved A/B, 5 runs each, load < 4, the floor = the spread of the same-tree runs (**unmeasured today**), gate |Δ median| ≤ max(2 × spread, 2 ms/s); the M5 by the device report pair ("M5 pending" if absent, as in 0.4.0); `adopt.mjs --check`; the `__LW` law | | | |

Done when: the 15 risks each closed by the named closer (R10's and R14's are new suites); the seven classes ruled; ms/s within the
measured floor; **`lab/*.js` in 28.2–29.6k, ESTIMATE** (JS-only out ≈ 8.4–9.1k: the survey's 9.0–10.5k less 0.47–0.70k of CSS, the ~495
nested lines and a look block at ~155 not ~267; back 1.0–1.5k; + A's ledger ≤ +150; C7 is the swing — if the film slips, +1.2–1.8k);
CLAUDE.md rewritten for the kit's windows.

### D · THE INFORMATIONAL (gated on G1 for D1/D5/D7; the spike decides its shape; **net ≤ 0 on D's ledger; D9 first**)

| # | piece | rule | closer |
|---|---|---|---|
| **D9** | **first**: the legacy five (1,469 lines) — H₂⁺ and HELIUM are field owners (pages cannot own ψ): each a MOLECULES/preset demo, a kept window, or deleted with a restore shim; QCD deleted; H₂ and ELECTROSTATICS by use — **R5-L1, Josh's by name**; D9 pays for D | lines DOWN | the history/project suites open an old file naming them |
| D1 | the window (brief 13), the DISPLAY switch (Josh's instruction); `stage-text.js` → `addBlock` / `addLabel({ttl})` / `addLabel({anchor})`; `{{state}}`, `{{E}}`, `{{T}}`; `viewChanged()` only on a `cameraKey` change (the atom labels' key already) | the spike's cost rule | the budget held; 0 per-tick layout reads by the layer's witness |
| D2 | pages generated from the records (38 + 4 demos), hydrogenic states by class, windows from the INFO copy; the RPA root names in SPECTRUM (the Sol thread's C3); brief 3 (TO NOTEBOOK / PIN) | no model-authored number; `CURATED_IE` verified or tagged; no SRD 101 table; the greeting the one exception (R5-I4) | render + round-trip; the root names' Σ d_Λ m_Λ gate |
| D3 | feature labels (`features()`, `place()`) | the 18th brief if the spike's count > 0 | labels follow a turn, hold still after |
| D4 | the overlays — **text only in 0.5.0** (default); a 19th brief in 0.5.x unless the spike shows the sanitiser keeps an image block; positions WORKSPACE | the spike's rule 4 | a moved label persists |
| D5 | the film overlay (brief 6) + TAKE MODE (brief 7); the caption retired | the verifier shared with C7 | a video carries the layer deterministically |
| D6 | FIGURE, chips, FLY-TO + search, SCENES (replaces A/B as two of eight), MAPS (H₂'s FCI curve first) | one in, one out per piece | per piece |
| D7 | the pad with the lattice (brief 5) and `cells` (brief 4; the S3 cells and S4b header retire, 38 lines) | — | ATOMS and MOLECULES suites |
| D8 | R-I2: `lw:` links and the HUD | one banner per hand press | — |
| D10 | from PLAN §8: **19** the flash guard (the kit's judge replaces the page trap) and **21** the ink law FIRST (laws, not features); **8** the library gallery, **20** the opener/title card, **24** CURVES only as far as the ledger pays, else 0.5.x and listed in §6; brief 1 optional | the ledger | per row |

Then **cut 0.5.0-alpha** locally. **0.4.1 BUCKYBALL** is a 0.4.x cut from the 0.4.0 tag (C₆₀'s density from a grid record stored as its
D₂h asymmetric unit, at the experimental geometry, the I_h names), independent of 0.5.0. **The 0.5.0 minimum (R5-Q2):** if the briefs
slip when A–C are done, 0.5.0 = A + B + C on the pinned alpha and the INFORMATIONAL window is 0.5.1 — or 0.5.0 holds. Josh's call.

## 3 · Rulings for Josh (first option = default), the first four first

1. **R5-G1** pin alpha.24 at C0, re-adopt once at the first kit version carrying brief 8 · wait for the cut · every alpha.
2. **R5-W1 the wiring law for adopted kit files:** an unreached kit file listed in the manifest is reported (name, KB), not precached and
   not failed; app files keep the hard gate; the five dated rows retire with it · keep the hard gate and allowlist each kit orphan by name
   (109 at alpha.23) · renew the five rows once more and decide at C0.
3. **R5-A3** one project part over `serialize()`, `installModulation({ project: false })` · split into kit parts (`rack`, `bpm`, `pages`, `accent`).
4. **R5-L1** which of H₂⁺, HELIUM, H₂, ELECTROSTATICS and QCD go (default: QCD deleted; H₂⁺ and HELIUM as demos with a shim; H₂ and
   ELECTROSTATICS by use) — it decides whether D can be net ≤ 0.
5. **R5-C1 the camera bindings** — Q1: which on a mouse, a trackpad and the iPad? (today: left-drag orbits, Alt-drag or two fingers slide,
   wheel/pinch zoom at the cursor, Alt+Arrows nudge) · **R5-Q2** the 0.5.0 minimum and who builds the briefs in MIR — Q2 · **R5-S1/S2/S3**
   SETTINGS stays the surface and MIR OPTIONS hidden · LANGUAGE hidden · the KEYBOARD window λWAVES' skin as an `app.*` layer — Q3.
6. Kept from DRAFT 1 with their defaults: R-B1 (one clock, at C4) · R-K1 (S stays WASD; Ctrl+Space is already MOD arm) · R-D1 · R-I2 ·
   R-I3 (both) · R5-I4 (the greeting, the one exception) · R5-D2 (no SRD table) · photosensitivity the kit's pane · toast BASINS' pill ·
   ABOUT 470 × 670 · NEW leaves preferences alone · notes recent 8, pages in the project · no chord invented for kit windows.
7. Carried from 0.4.0: Br₂ vs the cap; C₆₀'s `milestone` allowance; C₂₀H₂₀ a fixture; one rock-salt cube; the subtraction law unmet
   four times (+1,559).

## 4 · The numbers

Measured: §0; the 11 shared sites; 26 id selectors + 50 `.km-` lines; 1,507 / 96 `__LW` uses; 32 `!important`; KB's 677; the legacy
1,469; A5's −44; the wiring/precache coupling (`pwa.test.mjs:244–251`). Estimates, said so wherever used: JS-only out 8.4–9.1k (the
calculation: 3,110 + 1,104 + 198 + 187 + 149 + 548 + 63 + 140 + 396 + 0–150 + ~1,780 rack.js blocks + 1,200–1,800 film − 495), back
1.0–1.5k, hence 28.2–29.6k; the CDP floor. To take, with the method: the ms/s baseline BEFORE C (interleaved, 5 runs, load < 4); the
per-seam ledger; precache bytes per alpha; the seven stylehash classes with C0; the spike's four numbers; whole-`localStorage`
snapshots around a project open; the full red list on 85 suites.

## 5 · Order and the dial

A0 · wave 1 (A5+A6 ∥ A9–A11, in flight) → wave 2 (A1+A8 ∥ A7) · B at the re-adopt · C0 with Josh's seven rulings · C1 → C9 · C-V once ·
D9 first, then D in the order the spike allows · the cut. **Dial:** no verifier in A (device report back to back for A6/A7); B is the
builder's own task; one verifier for C, scoped; one for the film (C7/D5); **locks only on `field.js`/shader commits and once at C7**.
Josh: "don't over-verify" — and the one regression 0.4.0's locks could not see is the stage-8 kind, hence the ms/s with a measured floor.

## 6 · What is not claimed, and what is overruled

Not claimed: no line of C or D is built; the briefs' arrival is not ours to schedule; 28.2–29.6k is an estimate from banner-ranged spans
on an older tree; the ms/s floor on the 3070 is unmeasured; no measurement exists of the INFORMATIONAL over a WebGPU canvas, on WebKit or
under touch until the spike; SIBLINGS rows 8, 20, 24 may move to 0.5.x by D's ledger; the M5's numbers are Josh's one command; the
no-push ruling stands; 0.4.0-alpha's local cut follows the kernel verifier, before any A merge.

Overruled from AUDIT-OPUS-1 (three, with the reason): (i) **A0 is already running on Sonnet** (launched before the audit) — its baseline,
the stylehash and the spike's measurements are kept; if its spike numbers are thin or its rules unapplied, the spike alone is re-run by
Opus before D is promised. (ii) **A6's demand under `modArm && clockLink` only** is taken, but with one clause: if the facade makes the
refusal impossible under both settings at no extra line, it may say so in REPORT without retiring any key — the retirement itself stays
C4's. (iii) **B's browser list** is the audit's nine now; the bare adopt's remaining 18 suites are run once by A9–A11 on its throwaway if
time allows, because a red there is cheaper to learn in A than at C0.
