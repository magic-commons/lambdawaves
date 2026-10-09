# λWAVES 0.5.1 "Informational Update" — PLAN, DRAFT 0 (Claude Yan, Fable 5.1, 2026-10-09 15:40 CDT)

**What this is.** Stage D of the 0.5.0 plan (`research/release-0.5.0/PLAN.md` §2 D) re-planned once, as Josh ruled on 10-09 (PLAN §9, ≈14:00: "no
full NACRE set — one short re-plan round": a Fable draft, one Opus@high audit, then build). The 0.5.0 cut, **"GUI Adoption"** (`v0.5.0-alpha`, local),
carries stage A, every C row, C-V FIT WITH NOTES, and D9/D9b. Everything else of D — D1–D8, D10 — and C8 is this release. **Its name is Josh's
("Informational Update"); its number is Josh's (0.5.5 or 0.5.1) — 0.5.1 is the DEFAULT this folder takes until he says.** Nothing is pushed,
deployed or released at its cut either (the 10-07 ruling). Tags: **[MEASURED]** = read off this tree or a file named here; **[DERIVED]** = an
estimate or a reading of mine, said so.

## 0 · The inputs, measured on this tree (`yan-c` `b9e0c57`, 2026-10-09)

- **Lines.** `cat lab/*.js | wc -l` = **27,594** [MEASURED]. The C-V bar is **30,000** (hard). Headroom **2,406**. The legacy credit D9 + D9b
  banked: D9 −2,040 (814 of them moved to `tests/lib/`), D9b −1,014 → `lab/*.js` fell **3,054** across stage D's first two rows [MEASURED, D9-BUILD.md,
  D9B-BUILD.md]. **So the 30,000 bar binds before D's "net ≤ 0" ledger does**: this release's additions must stay under 2,406 gross, and the plan's
  working target is **≤ 29,000 at the cut** (soft; the hard bar stays 30,000).
- **The kit** is MIR `1.5.0-alpha.24`, pinned (`lab/mir/version.js`; the manifest sha in `tests/mir-manifest.test.mjs`) [MEASURED]. What it HAS for
  this release [MEASURED, `lab/mir/`]: `info/layer.js` `createInfoLayer({ stage, host, subject, features, style, follow, lines, parallax, drift, pane,
  controls, keys, avoid })` → `addLabel({ anchor, title, md, line, control })`, `addBlock({ md, hold, pane })`, `setFollow`, `freeze`, `hold`,
  `setEdit`, `viewChanged()`, `clear`; HOLD on I through the app's key table (`infoActions`); the ENTRANCE; ink + halo, never a pane unless asked;
  `avoid()` keeps BLOCKS off the racks (labels are not avoided — brief 18). `info/page.js`: `parsePage(md)` reads Obsidian callouts `> [!mir|anchor]`
  (a feature id, `@place`, or `ui:control`), `showPage(layer, page)`, `greet(layer, pages)` (pages[0] once per open, 2500 ms hold, click-through).
  `shell/pages.js` `createPages()` — a project's markdown pages, pages[0] the greeting, a FOLDERS part. `shell/notebook.js` shows pages as tabs.
  `shell/flash-guard.js`: THE LIMITER `createFlashGuard()` (a parameter on its way to the renderer is held to ≤ 3 flashes/s per route, pure, no
  readback) and THE FIELD JUDGE `createFlashModel` (needs the app's 64² luminance readback); the NOTICE is already λWAVES' (C6b). `shell/share-link.js`
  `encodeState/decodeState` (`LINK_CEILING` 2000). `panels/curves.js` + `panels/picture-filter.js` (Photoshop curves as one SVG filter on the app's
  canvas, "no app code"), `panels/grade.js`. What it LACKS (each a kit brief, in the vault `LAMBDAWAVES CLAUDE KIT BRIEFS FOR MIR 2026-10-08.md`):
  **brief 13** an INFORMATIONAL rack window; **brief 7's fix** (no per-frame DOM writes while the camera turns — the spike's number); **brief 6**
  `recorder.overlay(i, ctx)` (the recorder has only `frame(i, ctx)`, `render/recorder.js:29`); **brief 4** `cells`; **brief 5** the lattice pad;
  **brief 8** `paintedSpace`; **brief 18** label avoidance; **brief 19** images in blocks; **brief 3** TO NOTEBOOK / PIN FROM WINDOW.
- **λWAVES today** [MEASURED]: `lab/stage-text.js` **132** (the interim renderer CLAUDE.md names for deletion at the INFORMATIONAL: the formula, the
  states' prose, THE FADE on a HAND's preset with `{ hand: true }`, the ATOM LABELS under `mix-blend-mode: difference`, the laws: the DOM moves only
  when the string does, KaTeX ≤ 4/s, nothing per tick, never in an export; `tests/stage-text.browser-test.mjs`); `lab/calculus.js` 127
  (`calculusMarkdown` = THE PROSE FIGURE); `lab/names.js` 497 (the orbital names; `CURATED_IE` at :467); `lab/library.json` **38 records** in four
  sections ORGANIC · BIO · LATTICE · HEAVY (keys `id basis hash bytes section nAO nocc caps`), **6 demos** in `lab/demos/` (two more than the plan's
  "4": D9 added H₂ σu and HELIUM); `lab/statelink.js` 633 (the `#s=` link; `?preset=`/`?view=` are the bottom of the undo stack); the TRANSITION A ↔ B
  (`transition` in rack.js ×29, state.js ×4, statesview.js ×2, molecular-register.js ×1); the HELP copy under `lw-window-info` (`look.js` `HELP_KEY`);
  the INFO panels' ⧉ COPY (`window-chrome.js`; `rack.js:3158` a panel's digest as text); `capture.js` `drawCaption` (the caption a picture, loop and
  video carry; its comment names KIT BRIEF 6 as its replacement) and `picture({ overlays })` for the 2-D overlays VORTEX/PARTICLES/KEPLER.
- **The spike (CANARY-A0.md PASS 2, Opus, 10-08)** [MEASURED]: 8 bare labels FOLLOWING a turning camera cost **+115 %** main-thread time (+43 ms/s;
  the rule was ≤ +10 %) — two thirds of it style recalc and paint downstream of ≈ 63 kit DOM writes a frame; `viewChanged()` itself is 0.12 ms/s. ONE
  BLOCK and no labels under the same turning camera: 36.80 / 38.20 ms/s against 32.51 / 32.74 with no layer (**+4.3 to +5.7 ms/s**, +13–17 %), the
  layer's own frame JS ≈ 2.9 ms/s. Bare text reads in 12 of 12 pictures (no ink brief; Josh judges the 24 PNGs). Labels meet the racks at shift ±1
  (brief 18). A data-URL `<img>` and an inline `<svg>` do not survive the sanitiser; a same-origin image file does (D4 text only; brief 19).
  Today's `stage-text.js` cost was never measured.
- **The gates that exist** [MEASURED, C-V.md and the HANDOFF]: node gate 940/0; THE LOCK 860 (`--query gastab=0`) and 1004 (`digest-lock-s4a.json`)
  values · 0/0; the ms/s pair `tools/perf/main-thread.mjs` interleaved base/tip, gate **3.536** ms/s (C-V: Δ +1.005 for the whole adoption); the
  suites C-V ran (R1–R15 + opener 7/7, timeline 14/14, film-probe/compare, menubar); `tests/legacy/boot` 152 verdicts (after the five-row pass the
  law reds should be B149 + B70/B71/B78-BOW only); `tools/settings-probe.mjs` 0/6; `tools/serialize-bytes.mjs` 11/11; `tools/hit-probe-set.mjs` 0
  reached; the `__LW` law (no member renamed or removed without the suites re-aimed).

## 1 · The gates of this release, and what each blocks

| gate | what | blocks |
|---|---|---|
| **G-L lines** | `lab/*.js` ≤ 30,000 at every merge (hard; C-V's bar); ≤ 29,000 at the cut (soft). Pages, records and demos are DATA (`.md`, `.json`), counted in precache bytes (`tests/pwa.test.mjs`), not in `lab/*.js` — **ruling R6-P** | every row's merge |
| **G-M the pair** | A-M's interleaved ms/s pair, base = the tree before the row, tip = the row, \|Δ\| ≤ 3.536 ms/s, taken with the notice dismissed and NOTHING else on the GPU | D1, D3, D4, D10-19; the verifier D-V for the whole |
| **G-D the lock** | 860 · 0/0 and 1004 · 0/0 | any row touching `field.js`, the shaders, `capture.js`' readback or ψ(t) (D6 SCENES; D10-19 if the field judge is built) |
| **G-S the suites** | the owning suites per row (named in each row) + `settings-probe` for any new stored key (every key in ONE scope, `docs/STATE-SCOPES.md`) + `serialize-bytes` (a format change is a deliberate version row, never a drift) + `hit-probe-set` + `frame-occlusion` (the layer is never part of the mask) | every row |
| **G-K the kit law** | never edit `lab/mir/**`; a kit need is a line in `research/release-0.5.1/BRIEFS-0.5.1.md`; the briefs are built in MIR by Josh's primary account (R5-Q2); ONE re-adopt when brief 8 lands (R5-G1, at most twice) opens Group II | Group II |
| **G-W the `__LW` law** | no `__LW` member renamed or removed unless its suites are re-aimed in the same commit | every row |
| **G-F the fade law** | an announcement only on a HAND press (`{ hand: true }`); never on a restore, an undo, a project or link open; the greeting on open is the ONE exception (R5-I4) | D1, D2, D8 |

## 2 · The rows

Sizes S/M/L; each row names its closer and its OUT (what leaves); a D6 piece without a named out is not built (PLAN §9). Ledger figures are
[DERIVED] estimates until the BUILD file measures them.

### Group I — buildable now on alpha.24 (no kit brief)

| # | piece | rule | closer | out · ledger |
|---|---|---|---|---|
| **D1** (M) **THE STAGE TEXT becomes the kit's layer.** `createInfoLayer({ stage, avoid: the racks + the transport })` once, in `rack.js` beside the badges. The formula / the states' prose = ONE `addBlock({ md })`, re-given its md only when the string changes (the stage-text law); THE FADE = the same block's text with `hold`, or a second block that leaves (G-F); the ATOM LABELS = `addLabel({ anchor })` on `features()` = the nuclei (`toScreen`), under **the HIDE-WHILE-TURNING policy**: `freeze(true)`/hide while the camera moves or AUTO-ROTATE runs, `viewChanged()` + return at rest (≤ 300 ms after) — labels never follow a turn in this release (**ruling R6-L**). The DISPLAY row stays ONE row (the switch + SIZE 50–300 %, PREFERENCE `molFormula`/`molFormulaSize`): SIZE is a CSS var on the layer root, λWAVES' unlayered rule. The block's placement: the kit's law (against the cursor, the pin) — **ruling R6-F**. Never part of the occlusion mask; never in an export (the caption stays until D5) | the spike's cost rule, now as the pair: \|Δ\| ≤ 3.536 ms/s with AUTO-ROTATE on, H₂O HOMO, 1 block + the atom labels hidden-while-turning (the spike's own cell); if the pair fails, the row is NOT merged and `stage-text.js` stays (the fallback is the truth, not a smaller block) | `tests/stage-text.browser-test.mjs` re-aimed at the layer (the key law, KaTeX ≤ 4/s, the fade on `{ hand: true }` only, the caption unchanged); `frame-occlusion` unchanged; the pair | **OUT `lab/stage-text.js` 132 whole** + its `lab.css` rules; IN ≈ 70 in rack.js [DERIVED] → **≈ −60** |
| **D2** (M) **PAGES from the records.** A generator in `tools/record-pages.mjs` writes ONE markdown page per library record (38) and per demo (6): the formula, the point group, the HOMO's name and the HOMO–LUMO gap, the basis and AO count, the record's own note, the hydrogenic states by class for SPECTRUM's atoms — every number read from the record or `names.js`, **no model-authored number**; `CURATED_IE` verified against the primary handbooks or tagged UNVERIFIED on the page; no SRD 101 table (R5-D2). The pages are DATA beside the records (`lab/library/<hash>.md` or a `page` field of the record — the builder's design, said in the BUILD), never precached (as records are), fetched when a molecule opens. Shown: in the notebook as the kit's page tabs, and on the stage through `showPage(layer, page)` — the GREETING (R5-I4's one exception) when a molecule or demo opens, `first: true` (up to the first `---`); the window pages (from the HELP copy under `lw-window-info`) through the same reader when HELP is on. The project keeps λWAVES' ONE part: pages ride INSIDE it beside `notebook` (R5-A3 holds; the bytes move → a deliberate version row in `tests/project-formats.*`, `serialize-bytes` 11/11 for files without pages). The RPA root names in SPECTRUM (the Sol thread's C3; `research/release-0.4.0/BRIEF-S1-NAMES.md`, `S1-NAMES-BUILD.md`) are the names.js half of this row | no number a page shows is absent from its record or solver (a node test diffs every number on every page against its source); the greeting shows once per open and never on a restore, undo or link (G-F) | a node test over all 44 pages (parse, numbers, UNVERIFIED tags); `project-formats` + `serialize-bytes` with the version row; `new-project` 8 + `--check`; `history` 44; one browser scene: open WATER → the greeting's first part on the stage, the page in the notebook's tabs | OUT: the HELP copy's duplicate strings where a page now holds them (the builder counts); IN ≈ 120 in lab (the reader + the greeting + the tabs) + the tool in `tools/` [DERIVED] → **≈ +90**; pages ≈ 44 × 1–2 KiB of precache-exempt data |
| **D3** (S) **FEATURE LABELS.** `features()` for the layer: every nucleus (element symbol + index), the domain cube's axis ends (x y z), the frame's corners; `place(text)` for `@x,y,z` in bohr → stage px through the one projection. Pages' callouts then attach (`> [!mir|O1] The oxygen`). The same hide-while-turning policy as D1; λWAVES' own clamp until brief 18: a label whose seat lands under a rack (`uiSpace`) is hidden, not moved | the spike's count: ≤ 8 labels on screen by default; the pair (with D1's) | a browser test: labels on WATER's three nuclei; hidden during a drag, back within 300 ms at rest; hidden under a rack; `hit-probe-set` 0 reached (the layer is `pointer-events: none`) | IN ≈ 60 in rack.js/molecule-state.js [DERIVED] → **+60** |
| **D4** (S) **THE OVERLAYS' TEXT, movable.** The readouts the four windows write over the stage — SHADOW's, ORBIT's (KEPLER `a · e · coherence`), PLANE's, CALCULUS's — as the layer's labels/blocks the user can drag (`setEdit`), **text only**; a moved label's position is a WORKSPACE key (`settings-store.js` WORKSPACE table + `settings-probe`); the 2-D drawn overlays (VORTEX, PARTICLES, KEPLER's curve) stay as they are and keep reaching exports | a moved label persists across a reload and travels with the project's WORKSPACE | `settings-probe` 0/6 with the new key; one browser scene: drag CALCULUS's readout, reload, same seat; `frame-occlusion` unchanged | OUT: the four windows' stage-text DOM/CSS where the layer now carries it (the builder measures); IN ≈ 60 [DERIVED] → **≈ 0** |
| **D8** (S) **`lw:` LINKS and THE HUD (R-I2).** A link `lw:…` in any page or notebook text acts on the lab through `statelink.js`' engine (the same fields as `#s=`: view, preset, state, camera…) on a HAND press; the HUD = one announcement per hand press through D1's block (`hold`), never on a restore/undo/open (G-F) — THE FADE generalised to the presses CLAUDE.md names (STATE's PRESET/RELOAD, MO-REGISTRY's WINDING/HOMO+LUMO/STATES presets) and to a page's `lw:` press | one banner per hand press; a link never clears the ring except as `?preset=` does (the bottom of the stack) | `history` 44 (a link press is one row); a browser scene: an `lw:view=density` link in a page changes the view and announces once; the stage-text suite's fade cases | IN ≈ 50 (the `a[href^="lw:"]` road + the announcement) [DERIVED] → **+50** |
| **D10-19** (S) **THE FLASH GUARD, the limiter half.** `createFlashGuard()` over the modulation routes that reach luminance (VIVID, the palette's brightness/exposure routes, the stage's INVERT) at `mod-port.js`' seam: a route trying > 3 flashes/s is HELD to the safe rate; the trip reported in METERS' status (`guard.lastTrip`). The FIELD JUDGE (a 64² readback per frame) is NOT built here: it is a frame-path row (the lock + the pair) — 0.5.x unless the ledger and the pair pay | no readback; the pair unchanged; the notice unchanged (λWAVES' law, C6b) | a node test: a 10 Hz square LFO on VIVID is held to ≤ 3/s, a slow ramp passes untouched; `take-in-bugs` 4/4; `routed-knob` 4/4 | IN ≈ 40 [DERIVED] → **+40** |
| **D10-21** THE INK LAW | satisfied by D1/D3/D4: every text over the picture is the layer's ink + halo; `difference` leaves with `stage-text.js` (the spike: bare reads 12/12, provisional on Josh's look at the PNGs) | — | the legibility PNGs re-taken once at D-V (the spike's recipe, gate Firefox) | no row |
| **D10-20** THE TITLE CARD | **DONE in 0.5.0 (C6b, the opener)** | — | — | no row |
| **D10-24** (S) **CURVES**, the kit's panel over the picture (`panels/curves.js` + `picture-filter.js`, an SVG filter on `#stage`'s canvas, "no app code"), a rack card listed in + and WINDOW, shipped closed. It grades the SCREEN only: the GPU readback (pictures, films, the lock) never sees a CSS filter — the card says so in one line (**ruling R6-C**) | the lock 0/0 unchanged (by construction); `serialize-bytes` unchanged unless its state is saved (WORKSPACE if saved at all) | `hit-probe-set`; `frame-occlusion` (a new card is a painted surface); the lock once | IN ≈ 15 [DERIVED] → **+15**; built only if the ledger at that point is under 29,000 |
| **D10-8** the library gallery (FOLDERS tiles for the records) | 0.5.x — no out named and the SECTION header (0.4.0 S4b) is Josh's design for the same job | — | — | not built |
| **D6** (L) **the pieces — one in, one out, or not built:** **SCENES** (M): eight scene slots in STATE replacing the TRANSITION A ↔ B pair as two of eight; a `transition` in an old file restores as scenes A and B (a shim, D9's pattern); ψ(t) under a scene play must equal today's A/B mix frame for frame where both exist (the lock's fixtures that hold a transition decide) — OUT the A/B code (`transition` ×36 across four files [MEASURED count, DERIVED ≈ 100 lines]) — **ruling R6-S**. **FLY-TO + search** (S): a search field over `names.js` that flies the camera to a named orbital or state — out to be named by its design, else not built. **FIGURE**: CALCULUS's ⧉ THE PROSE FIGURE already exists (0.4.0); a FIGURE press that drops the picture + its caption into a page is D2's `pageFromNotebook` road — folded into D2 if it costs < 20 lines, else not built. **chips**, **MAPS** (H₂'s FCI curve: H₂'s window is gone, D9b; `h2ci.js` 349 stays — a potential-energy map E(R) would be a new window): **not built in this release** (no out) | a piece without a named out is not built; SCENES touches ψ(t) → the lock | per piece; SCENES: the lock 860/1004, `history`, `project-formats`, a shim case in `tests/fixtures/legacy-*` | SCENES ≈ +140 −100 → **+40**; FLY-TO ≈ +60 if an out is found |

### Group II — gated on a kit brief landing in MIR and ONE re-adopt (R5-G1)

| # | piece | waits on | then |
|---|---|---|---|
| **D1b** labels that FOLLOW a turning camera | brief 7's fix (no per-frame DOM writes) measured ≤ +10 % at 8 labels by the spike's cell | drop the hide-while-turning policy (one line) |
| **D5** the film overlay + TAKE MODE; the caption retired | brief 6 `recorder.overlay(i, ctx)`, brief 7 | `drawCaption` leaves (`capture.js`); C7's film verifier re-run; the lock (a film's bytes change) |
| **D7** the pad with the lattice; `cells` | briefs 5 and 4 | the S3 cells and S4b header retire (38 lines); ATOMS and MOLECULES suites |
| **C8** `paintedSpace` → `refreshOcclusion` −36 | brief 8 | `frame-occlusion` 7 |
| **D3'** label avoidance; **D4'** images in blocks; **D2'** TO NOTEBOOK / PIN FROM WINDOW | briefs 18, 19, 3 | the λWAVES-side clamp/limits leave |

Group II's rows are written as rows here so the re-adopt has its list; **none is built in this release unless its brief ships in a kit before D-V**.

### D-V · the verifier (fresh Opus, once, after Group I merges)
The pair (|Δ| ≤ 3.536, base = `v0.5.0-alpha`'s tree, tip = the merged tree, notice dismissed, GPU quiet); the lock 860/1004; every suite in C-V's R1–R15
table + opener, timeline, film-probe/compare, menubar + the new suites of D1–D8; `tests/legacy/boot` (the law reds only); `settings-probe`;
`serialize-bytes` with the version row; `hit-probe-set`; the `__LW` law per commit; `lab/*.js` vs 29,000/30,000; CLAUDE.md against what it measures (the
D paragraphs); the legibility PNGs re-taken. Verdict FIT TO CUT / FIT WITH NOTES / NOT FIT. Then a fix round if needed, then **the local cut**: BUILD_LINE
`0.5.1-alpha · Informational Update · <date>`, README, pwa, node, commit, tag `v0.5.1-alpha`, `tools/changelog.mjs`, `tools/snapshot-release.mjs`,
`research/release-0.5.1/CHANGES-0.5.1.md` (major features in plain words) + the vault — **on Josh's word; NO push, NO deploy.**

## 3 · For Josh — the rulings (the FIRST option is the default under "defaults"), then the questions

1. **R6-N the number:** **0.5.1** (the plan's own number for the deferred rows) · 0.5.5. The name is yours: "Informational Update".
2. **R6-F the formula moves:** **the kit's block law** — the formula rests on the far side of the subject from the pointer and shows the pin once
   (THE WORDS SERVE THE PICTURE) · pinned where it sits today (top or foot between the racks; λWAVES asks the layer to `freeze` that block).
3. **R6-L labels during a turn:** **hide while the camera moves, return within 300 ms at rest** (the spike's +115 % makes following a 0.5.x
   thing; this ships now) · wait for brief 7 and ship following labels later (D1/D3 move to Group II).
4. **R6-S SCENES replaces A/B:** **yes** — eight scenes in STATE, an old `transition` restores as scenes A and B, ψ(t) proven equal by the lock ·
   keep A/B and do not build SCENES.
5. **R6-C CURVES:** **a screen-only grade** (exports, films and the lock untouched; the card says so) · not built.
6. **R6-P pages are data:** **`.md` pages beside the records, precache-exempt, counted in bytes not lines** · count them against the 30,000 bar.
7. **R6-G the greeting:** **on a molecule or demo open, the record's page's first part shows once** (R5-I4's one exception) · off by default.

**Questions:** **Q1** which account writes the nine kit briefs into MIR (13, 7-fix, 6, 4, 5, 8, 18, 19, 3; plus the candidates in
`BRIEFS-0.5.1.md`) — your primary account when its week resets (R5-Q2's first option)? **Q2** is the Informational Update cut before Group II (the
default: yes — Group I is the release; Group II is 0.5.x after the re-adopt) or held for it?

## 4 · Order and the dial

**D1 first, alone** (it decides the layer's cost law for everything after it; if its pair fails, D3/D4/D8's shape changes and the audit is re-read) →
**D2 ∥ D8 ∥ D10-19** (disjoint files: the records + names.js + the notebook tabs · statelink.js + the announcement · mod-port.js) → **D3 ∥ D4** (both on
D1's layer; D3 in molecule-state/rack.js features, D4 in the four windows' sites; two builders on rack.js at a time, distinct regions listed in each
BUILD's merge notes) → **D6 SCENES** (its own, the lock at every commit) → **D10-24** if the count is under 29,000 → **D-V** → a fix round → the cut.

**The dial (Josh 10-01 "don't over-verify"; 10-06 Opus for builders):** Opus builders for D1, D2, D3, D4, D6; Sonnet for D8, D10-19, D10-24 (light
rows); ONE verifier, D-V (fresh Opus); the lock only where the row says; the pair for D1, D3, D4, D10-19 and at D-V; one light check per row otherwise.
Each builder: a fresh worktree reset to the integrator's tip, a `BRIEF-D<n>.md` written by the integrator from this plan after the audit, `D<n>-HANDOFF.md`
committed after every step, `D<n>-BUILD.md` at the end with the ledger, the brief candidates and the merge notes; the integrator merges by the recipe
(`--no-ff --no-commit`; `lab/sw.js` ours then `pwa --write`; node gate; the owning suites on the integrator's server; a HANDOFF §2 line; the note).

## 5 · The numbers

[DERIVED, to be measured by each BUILD]: D1 −60 · D2 +90 · D3 +60 · D4 0 · D8 +50 · D10-19 +40 · D10-24 +15 · D6 SCENES +40 → **net ≈ +235** →
`lab/*.js` ≈ **27,830** at the cut (soft target 29,000, hard bar 30,000; the legacy credit of 3,054 is not touched). Pages ≈ 44 × 1–2 KiB of
precache-exempt data. The pair budget 3.536 ms/s is shared by D1/D3/D4/D10-19 — D1 takes most of it (the spike's one-block cell read +4.3 to +5.7
over no layer; today's stage-text cost unmeasured, so D1's own Δ is the first number this release takes).

## 6 · What is not claimed

No line of this release is built. The kit's layer has run over λWAVES' WebGPU canvas only in the spike's throwaway copy; its cost with ONE block and
hidden labels under AUTO-ROTATE is not measured; today's `stage-text.js` cost is not measured. Touch, WebKit and the iPad are unmeasured for the layer
(the M5 road is the kit's probe). Whether SCENES' ψ(t) can equal A/B's frame for frame is the lock's to say. The FIELD JUDGE's readback cost is not
measured (not built). Which briefs land in MIR, and when, is not ours to schedule. CURVES' usefulness over a palette-driven picture is Josh's to judge.
The pages' bytes in the deployed site are counted at D2's merge. The number 0.5.1 is a default.

## 7 · The deltas since PLAN §2 D, and where each landed

| delta | where |
|---|---|
| the A0 spike: D1 0.5.1 by cost; brief 7 re-worded; D4 text only; no ink brief; brief 18; brief 19 | §0; D1's hide-while-turning (R6-L); D1b in Group II; D4 text only; D10-21 no row; D3's clamp + D3'; D4' |
| C8 waiting on brief 8 | Group II |
| D6 "no named out, not built" | D6: SCENES (out A/B), FLY-TO (out to be named), FIGURE folded into D2, chips/MAPS not built |
| the net ≤ 0 ledger · the 30,000 bar | §0 (the bar binds first), G-L, §5 |
| C-V's not-verified list (camera-routes, mir-controls, serialize-bytes, ms/s with TIMELINE open) | D-V runs all four |
| found-not-fixed: a film keeps the window mask it started with (C7b); B17 NEW's AUDIO source refuses MODULATION ON films; B127's paused badge sentence can stay stale | the first is a frame-path row for 0.5.x (its digests change) — listed in `BRIEFS-0.5.1.md` §λWAVES; B17 a MIR brief candidate; B127 is D1's to retire if the layer's block replaces the canvas sentence, else a one-line fix row |
| the opener's host flake | cured in the suite (`59168b9`); D-V runs opener alone |
| MIR brief candidates: C7b B1–B17, FIX ROUND 1 (B149b, the kit's fill under the hold), C-V 5 and 8, the spike's 7/18/19, brief 13, brief 3 | `research/release-0.5.1/BRIEFS-0.5.1.md` (the integrator writes it from the BUILD files at the first merge) |
| the two new demos (H₂ σu, HELIUM) | D2 counts 6 demos, not 4 |
| the names: "GUI Adoption" / "Informational Update"; no "The" | the title, BUILD_LINE, the tag, CHANGES-0.5.1.md |

## 8 · Harness for every builder (the laws that have cost us)

Own worktree (`Agent({ isolation: 'worktree' })`, `git reset --hard <integrator tip>` first); never edit `lab/mir/**` or `lab/fonts/**`; subtract,
don't add; diagnostics in `tools/`, never `lab/`; after any `lab/` edit `node tests/pwa.test.mjs --write` then the suites; ONE browser suite at a time on
the machine, `node tools/perf/wait-gpu.mjs` and no other geckodriver before each; stop servers by pid, never `pkill -f`; a single red digest or timing
divergence may be the RTX 3070 in P5 — re-run alone once; the guard refuses compound shell lines (plain commands or `bash .tmp/x.sh`); commit a hand-off
after every step; never merge, push or tag; the glass is Josh's; every stored key in one scope; the `__LW` law; the two-account relay (the other account
relaunches you fresh from your tip, so the hand-off must carry the exact next step).

— Claude Yan, 2026-10-09. The audit (one Opus@high pass → `AUDIT-OPUS.md`) is read in full and folded into `PLAN.md`; then the briefs, then the builders.
