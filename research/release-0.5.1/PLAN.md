# λWAVES 0.5.1 "Informational Update" — THE PLAN (Claude Yan, 2026-10-09 15:55 CDT; DRAFT 0 + AUDIT-OPUS folded)

**What this is.** Stage D of `research/release-0.5.0/PLAN.md`, re-planned ONCE as Josh ruled (PLAN §9 ≈14:00: a Fable draft, one Opus@high audit,
then build). `PLAN-DRAFT-0.md` is the draft; `AUDIT-OPUS.md` is the audit (SOUND WITH CHANGES; every change read against the tree with file:line);
this file is the fold. The 0.5.0 cut, **"GUI Adoption"** (`v0.5.0-alpha`, local), carries stage A, every C row, C-V FIT WITH NOTES and D9/D9b.
**This release's name is Josh's ("Informational Update"); its number is Josh's — 0.5.1 is the DEFAULT until he says 0.5.5.** Nothing is pushed,
deployed or released at its cut (the 10-07 ruling). **[MEASURED]** = read off this tree or the file named; **[DERIVED]** = an estimate, said so;
**[AUDIT En / Un]** = the audit's item that decided the line.

## 0 · The inputs, measured (`yan-c` `07c1d7b`; re-measured by the audit)

- **Lines** `cat lab/*.js | wc -l` = **27,594**; the C-V bar **30,000** (hard); headroom **2,406**; the legacy credit banked by D9 + D9b = 3,054 —
  **the bar binds before D's "net ≤ 0" ledger** (2,406 < 3,054). Working target **≤ 29,000** at the cut (soft). [MEASURED]
- **The kit** MIR `1.5.0-alpha.24`, pinned. HAS: `info/layer.js` (`createInfoLayer({ stage, host, subject, features, style, follow, lines,
  parallax, drift, pane, controls, keys, avoid })` → `addLabel`, `addBlock({ md, hold, pane })` → `{ id, el, remove() }`, `freeze`, `hold`,
  `setEdit`, `viewChanged()`, `debug()`; **`hold` only delays the AGAINST-THE-CURSOR side flip, it is not a lifetime; a block's md cannot be
  re-given; `parallax` defaults ON and kicks the spring on every pointer move; a block with no subject and no anchor does not depend on the
  view** [AUDIT E1]); `info/page.js` (`parsePage`, `showPage`, `greet` — greet needs a pages model, λWAVES adapts its dismiss half, ≈ 8 lines
  [E18]); `shell/pages.js` + `shell/notebook.js` (tabs exist ONLY for `createNotebook({ pages })`, which λWAVES does not run [E3]);
  `shell/flash-guard.js` (THE LIMITER `createFlashGuard({ ranges })` counts swings of `delta × span` in the PARAMETER's units — the default range
  under-guards a log route [E10]; THE FIELD JUDGE needs a 64² readback); `shell/share-link.js`; `panels/curves.js` + `picture-filter.js` (an SVG
  filter on the canvas; **registers a project part unless `project: false`** [E11]); `shell/notebook-render.js` (keeps `href="lw:…"`, sets
  `target=_blank` on every link [E9]). LACKS (kit briefs, the vault note `LAMBDAWAVES CLAUDE KIT BRIEFS FOR MIR 2026-10-08.md` + `BRIEFS-0.5.1.md`):
  13 the INFORMATIONAL window · 7-fix no per-frame DOM writes while the camera turns · 6 `recorder.overlay(i, ctx)` (the recorder has only
  `frame(i, ctx)`) · 4 `cells` · 5 the lattice pad · 8 `paintedSpace` · 18 label avoidance + the block clamp · 19 images in blocks · 3 TO
  NOTEBOOK / PIN · **NEW (the audit's): `handle.update(md)`; a block SEAT option (top / foot); links in a block.** [MEASURED]
- **λWAVES today** [MEASURED]: `lab/stage-text.js` 132 (the formula / states' prose; THE FADE on `{ hand: true }`; the ATOM LABELS — letters ON the
  nuclei under `difference`, a transform per nucleus per camera key, `:93–112`, ticked from `rack.js:850`; the 250 ms KaTeX gate `:25, 39–40`;
  the foot seat when the transport is docked `:51`; the `__LW` witnesses `stats.renders/announced/places/labelWrites`, the `md`/`formula`/`banner`
  getters); the 2-D overlay canvases VORTEX / PARTICLES / KEPLER draw their captions INTO canvases that reach exports (`capture.js:741–744`), behind
  STAGE CAPTIONS (off by default) — **no window among SHADOW, ORBIT, PLANE, CALCULUS writes text over the stage** [E7]; `lab/library.json` **38 records**
  (ORGANIC 1 · BIO 25 · LATTICE 6 · HEAVY 6), **every one already carrying `page` (`moleculeLatex`, 1.7–15.5 k chars) and `stem` (formula, pointGroup
  — null for C₆₀, gapEh/gapEv, homo, mass, dipole, charge, multiplicity, identifiers, blurb, ies, sources)**; MOLECULES holds **91** molecules = 54
  live (no record; their page is `moleculeLatex` at runtime, the EDIT › COPY road `rack.js:1696–1704`) + 37 record-only [E4]; **6 demos**, each with
  its written notebook; the blurbs are authored prose, **38/38 carry a numeral no solver produced** [E6]; `CURATED_IE` (`names.js:461–467`) is
  "UNCHECKED against the live tables"; λWAVES' notebook is its own block `rack.js:3311–3510` (`createNotebook` is never called) [E3]; the TRANSITION
  A ↔ B = ≈ 50 UI lines in rack.js + the Rabi mix `state.js:206–232` (physics) + `pr.ab` + the route `state.rabi` + `__LW_hooks.ab`; **WAVE DANCER
  plays A↔B; no digest-lock state holds a transition** [E8]; the luminance routes are `material.stage` 0–1, `material.gamma` 0.5–2.4,
  `material.exposure` LOG 0.08–12, `material.knee` LOG 0.02–8, `material.hue` WRAP 0–1 (`rack.js:2152–2165`); VIVID is a look row, INVERT is not a
  route [E10]; `tools/perf/main-thread.mjs` measures only the boot preset (`?sw=0&warn=0&starter=home`), no MOLECULES, no AUTO-ROTATE, no setup hook
  [E13]; `v0.5.0-alpha` is not yet tagged at `07c1d7b` (the cut is this afternoon's next step).
- **The spike (CANARY-A0 PASS 2)** [MEASURED]: 8 bare labels FOLLOWING the camera +115 % (+43 ms/s); ONE block, no labels, AUTO-ROTATE on: +4.3 to
  +5.7 ms/s over no layer — with parallax ON and `viewChanged()` per camera key, which D1 does not do; bare reads 12/12 (Josh's look at the 24 PNGs
  pending); labels meet the racks at shift ±1; a data-URL image does not survive the sanitiser.
- **The gates that exist** [MEASURED]: node 940/0; THE LOCK 860 / 1004 · 0/0; the pair `tools/perf/main-thread.mjs` interleaved, **3.536 ms/s is a
  NOISE gate (max(2 × 1.768, 2), MEASURE §2), not a cost allowance** [E12]; the C-V suites + opener 7/7, timeline 14/14, film-probe/compare,
  menubar; `tests/legacy/boot` 152 (the law reds after the five-row pass: B149 + B70/B71/B78-BOW); settings-probe 0/6; serialize-bytes 11/11;
  hit-probe-set 0 reached; the `__LW` law.

## 1 · The gates, what each blocks

| gate | what | blocks |
|---|---|---|
| **G-L lines** | `lab/*.js` ≤ 30,000 at every merge (hard); ≤ 29,000 at the cut (soft). No page file is made (a page is a record's `page`, the live `moleculeLatex`, or a demo's notebook) — nothing new is counted anywhere | every merge |
| **G-M the pair** | the interleaved pair, \|Δ\| ≤ 3.536 ms/s, **each frame-path row ALONE, in TWO scenes**: the boot scene (the tool as it is) and the row's own scene through the NEW `--setup` hook (U1); never split between rows; notice dismissed; GPU quiet. D-V reads the cumulative pair against `v0.5.0-alpha`. The pair cannot see compositor/GPU cost: CURVES reads presents/s + the device report instead (U9) | D1 (both scenes); D10-19 only if the guard is applied per frame beyond the whitelist; D-V |
| **G-D the lock** | 860 · 0/0 and 1004 · 0/0 | no Group I row as amended touches `field.js`, the shaders, the readback or ψ(t); the lock runs again only for R6-M (then a deliberate re-bake) and once at D-V |
| **G-S the suites** | the owning suites per row + `tests/stage-text.browser-test.mjs` re-aimed (D1) + `frame-occlusion` (the layer is never in the mask; its root under the racks) + `tests/legacy/boot` B6/B22/B23 (the stage text's tick reads) + `settings-probe` for any new stored key (ONE scope each, `docs/STATE-SCOPES.md`) + `hit-probe-set` 0 reached | every row |
| **G-K the kit law** | never edit `lab/mir/**`; a kit need is a row in `research/release-0.5.1/BRIEFS-0.5.1.md`; the briefs are built in MIR by Josh's primary account (R5-Q2); ONE re-adopt when brief 8 lands (R5-G1) opens Group II | Group II |
| **G-W the `__LW` law** | no `__LW` member renamed or removed unless its suites are re-aimed in the same commit; D1 keeps the stage-text witnesses or re-aims the suite | every row |
| **G-F the fade law** | an announcement only on a HAND press (`{ hand: true }`); never on restore, undo, project or link open; the molecule HEAD fires on a HAND pick (a press — ordinary G-F); a demo/project open shows no stage greeting (R6-G default) | D1, D2, D8 |
| **G-U no `ui:` anchors** | no `ui:` callout and no feature callout in any page shown on the stage in 0.5.1 (the first `ui:` label installs a body-wide MutationObserver that calls `viewChanged()` on any restyle — layer work every frame under modulation [E16]); `grep -rn "\[!mir|ui:" lab/` stays empty (U7) | D2, D8 |

## 2 · The rows

### Group I — buildable now on alpha.24 (no kit brief). Sizes S/M; closer; OUT · ledger [DERIVED until the BUILD measures]

| # | piece | closer | suites | out · ledger |
|---|---|---|---|---|
| **D1** (M) | **THE STAGE TEXT's formula and THE FADE become ONE kit block.** `createInfoLayer({ stage, avoid: () => [the racks, the transport, a bottom-docked TIMELINE], parallax: false, drift: false, follow: false })` once, in `rack.js` beside `initStageText`, with no `subject`, no `features`, no labels; **`viewChanged()` is never called for a camera move** (the layer's own ResizeObserver and `resize` cover a size change). The formula / the states' prose = `addBlock({ md })`; a changed string = `remove()` + `addBlock()` behind the 250 ms KaTeX gate (E15); THE FADE = a second `addBlock` + λWAVES' `setTimeout(ttl) → remove()` (the exit IS the fade), `{ hand: true }` only. HOLD (I) = an ACTIONS row from `infoActions` (KeyI free; `up` rows vs `key-table.js` checked first — the audit did not). The DISPLAY row stays ONE row: the switch = `root.hidden` + add nothing while off; SIZE overrides `--info-size-*` × SIZE in an unlayered `lab.css` rule; the root's z-index under the racks (as `#molFormula`, z 20 under 30). **THE ATOM LABELS stay λWAVES' letters** (≈ 28 lines move out of `stage-text.js` into `rack.js`/`molecule-state.js` unchanged: on the nuclei, `difference`, a transform per camera key); `stage-text.js` is then deleted. The caption (`drawCaption`) is unchanged until D5. **FIRST STEP, before any D1 code: U1 the `--setup '<js>'` hook in `tools/perf/main-thread.mjs`** (+ the served tree's sha from the server, C-V N8) and the THREE arms on the base (STAGE TEXT off · on today · the tip's layer) [E13]. Placement per R6-F (the kit's seat, still: no parallax, no fleeing). Look per R6-I (the kit's ink + feathered shade + serif face; Josh's 24 PNGs) | the pair \|Δ\| ≤ 3.536 in the boot scene AND the D1 scene (MOLECULES · H₂O HOMO, ORBITAL view, AUTO-ROTATE on, STAGE TEXT on, a pointer sweep over the stage for 10 of the 30 s) · **the idle WITNESS: a `MutationObserver({ subtree, attributes, childList, characterData })` on `layer.root` records 0 over 10 s of AUTO-ROTATE after the entrance landed, and under a 40 moves/s CDP pointer sweep, and `layer.debug().running === false`** (U2) · placement U3 (the block's rect never meets `uiSpace()` at shift ±1 / centred × transport floating / docked / top × TIMELINE docked) · churn U4 (a 6-row paint stroke in 1 s → ≤ 4 renders, ≤ 4 entrances) · the fade U5 (`stats.announced` 1 on a hand preset for 2.4 s; 0 on restore/undo/link). **If the pair or the witness fails, the row is NOT merged and `stage-text.js` stays** | `tests/stage-text.browser-test.mjs` re-aimed (the key law; KaTeX ≤ 4/s; the fade on `{ hand: true }` only; the caption unchanged; the letters unchanged); `frame-occlusion`; `hit-probe-set`; `keyboard-shortcuts` + `keyboard-window` (the I row); `tests/legacy/boot` B6/B22/B23; node | OUT `stage-text.js` 132 + its `lab.css` rules; IN ≈ 35 + 28 moved → **≈ −70** |
| **D2** (S) | **THE MOLECULE'S HEAD, shown.** A HAND pick of a molecule shows its HEAD once on D1's layer through `showPage(layer, head, { hold: 2500 })`: the formula and name, RHF/basis, E, nocc/nAO, point group ("—" where `stem.pointGroup` is null, never invented), the HOMO's name, the HOMO–LUMO gap — **every number from the record (`stem`) or the live solve**; dismissed as `greet` does (Escape or a stage press after the hold; `page.js:147–158` adapted). The full page stays EDIT › COPY (`moleculeLatex`) → the notebook. No generator, no page files, no tabs, no format change [E3–E5]. The blurb is NOT on the head (R6-B); `CURATED_IE` shows only tagged UNVERIFIED (E6). The RPA root names in SPECTRUM (the Sol thread's C3, `research/release-0.4.0/BRIEF-S1-NAMES.md`, `S1-NAMES-BUILD.md`) stay the names.js half, with its own Σ d_Λ m_Λ gate. **Built by the D2+D8 builder after D1 merges** (both edit the notebook block; D2 the MOLECULES pick site) | U6 in node: for each of the 38 records, and for H₂O and N₂ solved live in node (the generator's road), compose the head and diff every numeral against its source field; the head never shows on restore, undo or link (G-F) | the node test; `stage-text` suite + one browser scene: a hand pick of WATER (LIVE) → its head, gone on a stage press after 2.5 s; an undo back → nothing; `molecule-demos`; `history` | IN ≈ 30 → **+30**; 0 data files; 0 format change |
| **D8** (S) | **`lw:` LINKS in the notebook.** A capture-phase click on λWAVES' notebook VIEW takes `a[href^="lw:"]`, `preventDefault()` (the sanitiser keeps the href but sets `target=_blank`, `notebook-render.js:10, 25`). Grammar `lw:key=value[&…]` over a WHITELIST mapped to existing HAND verbs: `preset` (`loadPreset(id, { hand: true })`), `view`, `molecule` (the MOLECULES pick), `orbital`. One history row per press; announced once through D1's fade. **No whole-state `lw:#s=` link** (R6-K): `statelink.js` restores a whole state and a page link must never replace the user's work [E9]. Links on the STAGE are Group II (a block that takes a click is a brief). THE HUD = THE FADE, already shipping; D1 ports it | one fade per hand press; a link press is one ring row; a link never clears the ring | `history`; a browser scene: `[x](lw:view=density)` in the notebook's view changes the view, announces once, opens no tab; the stage-text suite's fade cases | IN ≈ 30 → **+30** |
| **D10-19** (S) | **THE FLASH GUARD, the limiter half — WHITELIST and CALIBRATION.** `createFlashGuard({ ranges })` wraps the `set` of `material.exposure`, `material.gamma`, `material.stage`, `material.knee` at `createModPort.install` (`mod-port.js:85–99`), each guarded in its map's own space (log routes as log); `ranges` chosen so `delta × span` = the parameter step that moves luminance ≈ 10 % (U8: exposure ln 1.1 ≈ 0.095 in log space; gamma from out = in^(1/γ) at mid-grey; stage and knee from `field.js`' formulas); **`material.hue` EXCLUDED** (a wrap seam false-trips); every other route untouched (a non-luminance route is never held). The trip to METERS' status (`guard.lastTrip`). The row's text says the limiter is PARTIAL: a fast LFO on `reg.morph`, `chem.kick` or the camera can still flash — only the FIELD JUDGE (0.5.x, a frame-path row) sees that | node: a 10 Hz square LFO of ±0.3 stop on `material.exposure` is held to ≤ 3/s; ±0.05 stop passes; a 0.1 Hz ramp passes; the same 10 Hz LFO on `observer.yaw` passes untouched; a hue LFO through the seam does not trip; no readback; the notice unchanged | the node test; `take-in-bugs` 4/4; `routed-knob` 4/4; `mir-controls` 2/2 | IN ≈ 25 → **+25** |
| **D10-24** (S) | **CURVES**, the kit's panel over the picture: `createCurvesPanel({ …, project: false })` with NO `history` (R5-A3: λWAVES' one part; the ring reads `serialize({ scope: 'edit' })`), a rack card near CAMERA/RAMP listed in + and WINDOW, shipped closed; SCREEN only (the CSS filter never reaches `capture.js`' readback or `frame(i, ctx)`) — the card says so in one line; neutral = `filter: none` on the canvas; **AMOUNT not routed** in this release (a flash route outside the guard); state saved as **PREFERENCE** (R6-C default: a screen calibration per device), one new key in `settings-store.js` FAMILIES | the lock unchanged by construction; **presents/s over 30 s with an S-curve vs neutral + Josh's device report on the M5** (U9), not the pair | `hit-probe-set`; `frame-occlusion` (a new painted card); `settings-probe` (the new PREFERENCE key); node | IN ≈ 30 → **+30** |
| **D10-F** (S) | **The two pre-existing law reds, fixed** (R6-R default): **B78-BOW** the STATE card's `BOW` group/readout → `IMPULSE` words and seats (LEGACY-BOOT-REAIM §5; waves 51/53); **B70/B71** the transport's six 45 × 34 buttons → 44 px tall on touch (`lab.css`; wave 63) | the laws as written | `tests/legacy/boot` B70, B71, B78 green; `access`; `hit-probe-set`; `frame-occlusion` | IN ≈ +3 JS + CSS → **+3** |
| D10-21 THE INK LAW | satisfied by D1's block (ink + halo); the letters keep `difference` in 0.5.1; the 24 PNGs re-taken once at D-V | — | — | no row |
| D10-20 THE TITLE CARD | DONE in 0.5.0 (C6b) | — | — | no row |
| D10-8 the library gallery | 0.5.x (no out; the SECTION header is Josh's design for the job) | — | — | not built |
| D6 | **SCENES → 0.5.x** (R6-S default: no lock state holds a transition; the Rabi mix is physics and stays; WAVE DANCER plays A↔B; `pr.ab` and `state.rabi` would change shape; OUT ≈ 50 against a larger IN). **FLY-TO + search**: no out named → not built. **FIGURE**: needs brief 19 → Group II. **chips, MAPS**: not built | — | — | 0 |
| ~~D3~~ | MOVED to Group II (the letters stay λWAVES'; no 0.5.1 page carries a feature callout; the cost is the spike's +115 % until brief 7; the clamp is brief 18) | — | — | 0 |
| ~~D4~~ | STRUCK (E7: no stage text in the four windows; the overlay captions live in exported canvases → D4′ with D5) | — | — | 0 |

### Group II — gated on a kit brief landing in MIR and ONE re-adopt (R5-G1); none is built in 0.5.1 unless its brief ships before D-V

| # | piece | waits on | then |
|---|---|---|---|
| **D1b** THE ATOM LABELS as kit labels (beside each nucleus, a leader, following) | brief 7-fix (≤ +10 % at 8 labels by the spike's cell), brief 18 (avoidance + the block clamp), a decision on the 12+ nucleus molecules (benzene 12, C₆₀ 60) | the surviving letters (≈ 28 lines) leave |
| **D3** feature labels, `place()` | briefs 7 and 18 | pages may carry `[!mir|O1]` callouts; still no `ui:` unless E16's hazard is measured under modulation |
| **D5** the film overlay + TAKE MODE; the caption retired; **+ D4′** the overlay captions (VORTEX, PARTICLES, KEPLER) onto the layer once a film can carry them | briefs 6 and 7 | `drawCaption` leaves; C7's film verifier re-run; the lock (a film's bytes change) |
| **D7** the lattice pad + `cells` · **C8** `paintedSpace` → `refreshOcclusion` −36 | briefs 5+4 · 8 | the S3 cells and S4b header retire (38); `frame-occlusion` 7 |
| **D2′** TO NOTEBOOK / PIN · **D3′** avoidance · **D4′/FIGURE** images · **D8′** links in a stage block · `handle.update(md)` · a block SEAT option | briefs 3 · 18 · 19 · the three NEW candidates | the λWAVES-side limits leave |
| **D2″** the notebook's TABS (`createNotebook({ pages })`) | **not a brief — Josh's ruling R6-T** (it changes what the notebook is: YOURS would stop travelling with a project, NEW would stop emptying it; C6-BUILD:186–188) | YOURS, the shelf, notes recent 8; a format row; `new-project`; `history` |

### D-V · the verifier (fresh Opus, once, after Group I merges)
The cumulative pair against **`v0.5.0-alpha`** (which must exist first — the cut) in TWO scenes (boot, D1's), notice dismissed, GPU quiet; **+ the ms/s with
the TIMELINE open** (C7b's open item); the lock 860/1004 once; every suite in C-V's R1–R15 + opener, timeline, film-probe/compare, menubar + the new
suites of D1/D2/D8/D10; `tests/legacy/boot` (B149 the only law red if D10-F lands); `settings-probe`; `serialize-bytes` 11/11; `hit-probe-set`; the
`__LW` law per commit; `lab/*.js` vs 29,000/30,000; **CLAUDE.md**: C-V's N1–N5 (line 9's LINKED sentence; "0.5.0 deletes" `stage-text.js` → done at
D1; "brief 6 at 0.5.0" → 0.5.x; 33 vs 32 `!important`) and THE STAGE TEXT paragraph rewritten for D1 (the letters stay); the 24 legibility PNGs
re-taken. Verdict FIT TO CUT / FIT WITH NOTES / NOT FIT → a fix round if needed → **the local cut**: BUILD_LINE `0.5.1-alpha · Informational Update ·
<date>`, README, pwa, node, commit, tag `v0.5.1-alpha`, `tools/changelog.mjs`, `tools/snapshot-release.mjs`, `research/release-0.5.1/CHANGES-0.5.1.md`
(major features in plain words) + the vault — **on Josh's word; NO push, NO deploy.**

## 3 · Order and the dial

**D1 first, alone** (D2's head, D8's announcement and the fade all ride on its layer; its pair + witness decide whether the layer is the road at all)
**∥ D10-19 ∥ D10-24 ∥ D10-F** (each in its own files or regions: `mod-port.js` · a new card near CAMERA/RAMP + one FAMILIES key · `lab.css` + STATE's
BOW group) → **D2 + D8 as ONE builder** after D1 merges (both edit the notebook block `rack.js:3311–3510`; D2 also the MOLECULES pick site) → **D-V**
→ a fix round → the cut. Two builders on `rack.js` at a time, distinct regions listed in each BUILD's merge notes.

**The dial** (Josh 10-01 "don't over-verify"; 10-06 Opus for builders): **Opus** for D1 and D2+D8; **Sonnet** for D10-19 (the calibration test is node),
D10-24 and D10-F; **ONE verifier D-V** (fresh Opus); the lock only at D-V (and for R6-M if taken); the pair for D1 (two scenes) and at D-V; one light
check per row otherwise. Each builder: a fresh worktree reset to the integrator's tip, `BRIEF-D<n>.md` from this plan, `D<n>-HANDOFF.md` after every
step, `D<n>-BUILD.md` at the end (the ledger, the brief candidates, the merge notes). The integrator merges by the recipe (`--no-ff --no-commit`;
`lab/sw.js` ours then `pwa --write`; node gate; the owning suites on the integrator's server; a HANDOFF §2 line; the worker's note).

## 4 · The numbers [DERIVED, measured by each BUILD]

D1 −70 · D2 +30 · D8 +30 · D10-19 +25 · D10-24 +30 · D10-F +3 → **net ≈ +50 → `lab/*.js` ≈ 27,640 at the cut** (soft 29,000; hard 30,000). No data
files added; no project-format change; one new PREFERENCE key (CURVES). The pair is a noise gate each frame-path row passes ALONE; today's stage-text
cost falls out of U1's three arms.

## 5 · The unknowns measured first (the audit's §4, in order; U1–U5 are D1's first steps)

1. **U1 the scene hook**: `--setup '<js>'` in `tools/perf/main-thread.mjs` (evaluated after `__LW.ready` + the notice dismissal, before pause/settle;
   + the served sha from the server); the D1 scene = MOLECULES on + the H₂O pick; ORBITAL view + HOMO; AUTO-ROTATE on; STAGE TEXT on (the `__LW`
   verbs the spike's `p2-cost.mjs` used — `research/release-0.5.0/canary-a0/`, the A0 worktree's `.tmp/`); `--runs 1`, interleaved 5 + 5; THREE arms on
   the base (STAGE TEXT off · on · the tip). 2. **U2 the idle witness** (above). 3. **U3 placement** (the spike's `09-rack-d4` recipe on the block).
   4. **U4 the churn** (≤ 4 renders, ≤ 4 entrances per second under a paint stroke; if the remove + add flicker reads badly by eye, that is Josh's to
   see and `handle.update` is the brief). 5. **U5 the fade** (one block 2.4 s on a hand preset; 0 on restore/undo/link; `stats.announced`).
   6. **U6 the heads** (38 records + H₂O/N₂ live in node; every numeral diffed; pointGroup null → "—"). 7. **U7 no `ui:`** (grep stays empty).
   8. **U8 the guard's calibration** (per route, the 10 % luminance step). 9. **U9 CURVES' cost** (presents/s + the device report; neutral reads
   `filter: none`). 10. **U10 `v0.5.0-alpha` exists** (`git tag -l 'v0.5*'`) before D-V names it.

## 6 · What is not claimed

No line of this release is built. "A block with no subject, no anchors and no `viewChanged()` does zero work while the camera turns" is DERIVED from
`layer.js:1–6, 141–143, 346, 612, 649` — U1/U2 turn it into a number before D1 writes code. Today's `stage-text.js` cost is unmeasured until U1's
arms. The kit's `createKeys` handling of an `up` row (HOLD on I) against `lab/key-table.js` is unread. `field.js`' `stage`/`knee` formulas are
unread (U8). Whether `moleculeLatex` runs in node for a live solve is unconfirmed (the generator does; U6). Touch, WebKit and the iPad are unmeasured
for the layer (the kit's probe is the M5 road). Which briefs land in MIR, and when, is not ours to schedule. CURVES' usefulness over a palette-driven
picture, and the kit's serif-and-shade look over the orbital, are Josh's to judge (R6-I). The number 0.5.1 is a default.

## 7 · The deltas since PLAN §2 D, and where each landed

| delta | where |
|---|---|
| the A0 spike (D1 by cost; brief 7 re-worded; D4 text only; no ink brief; 18; 19) | §0; D1 = one block, never `viewChanged()` on a camera move; D1b/D3 Group II; D4 struck → D4′; D10-21 no row; D2′/D3′/D4′ |
| C8 waiting on brief 8 | Group II |
| D6 "no named out, not built" | SCENES 0.5.x (R6-S); FLY-TO not built; FIGURE Group II; chips/MAPS not built |
| the net ≤ 0 ledger · the 30,000 bar | §0 (the bar binds first), G-L, §4 |
| C-V's not-verified list (camera-routes, mir-controls, serialize-bytes, ms/s with TIMELINE open) + CLAUDE.md N1–N5 | D-V runs all; the N rows are D-V's CLAUDE.md pass |
| found-not-fixed: the film keeps the window mask it started with · B17 NEW's AUDIO source refuses MODULATION ON films · B127 the paused badge sentence | **λWAVES' own**, not kit briefs [E20]: the mask = R6-M (0.5.x default, a deliberate re-bake if taken); B17 fixable through `tools/new-project.mjs` (a one-line row if Josh wants it); B127 is the five-row pass's test-timing row, not D1's [E19] |
| B70/B71 + B78-BOW (the boot suite's pre-existing law reds) | **D10-F** (R6-R default: fix them) |
| the opener's host flake | cured in the suite (`59168b9`); D-V runs opener alone |
| MIR brief candidates (C7b B1–B17; FIX ROUND 1 B149b + the kit's fill under the hold; C-V 5 and 8; the spike's 7/18/19; 13; 3) **+ the audit's three** (`handle.update(md)`, a block seat option, links in a block) | `research/release-0.5.1/BRIEFS-0.5.1.md` (the Sonnet consolidation, merged by tip) |
| the two new demos (H₂ σu, HELIUM) | D2 counts 6 demos |
| the names "GUI Adoption" / "Informational Update"; no "The" | the title, BUILD_LINE, the tag, CHANGES-0.5.1.md |

## 8 · Harness for every builder (the laws that have cost us)

Own worktree (`Agent({ isolation: 'worktree' })`, `git reset --hard <integrator tip>` first); never edit `lab/mir/**` or `lab/fonts/**`; subtract,
don't add; diagnostics in `tools/`, never `lab/`; after any `lab/` edit `node tests/pwa.test.mjs --write` then the suites; ONE browser suite at a time on
the machine (`node tools/perf/wait-gpu.mjs` and no other geckodriver before each); stop servers by pid, never `pkill -f`; a single red digest or timing
divergence may be the RTX 3070 in P5 — re-run alone once; the shell guard refuses compound lines (plain commands or `bash .tmp/x.sh`); commit a
hand-off after every step; never merge, push or tag; the glass is Josh's; every stored key in one scope; the `__LW` law; the two-account relay (the
other account relaunches you fresh from your tip — the hand-off carries the exact next step).

## 9 · RULINGS TAKEN (defaults, under Josh's "defaults for everything" of 10-09 02:30 and "begin Stage D all the way" of 15:10 — he may flip any)

The first option is the default and is what this plan builds. The three that shape D1 are first; Josh should look at them before D1 merges.

1. **R6-I · the words' look.** D1 replaces today's transparent KaTeX formula with the kit's look: ink, a feathered shade, a serif face. **TAKEN: the kit's
   look** (the spike: bare reads 12 of 12) · keep today's (D1 not built in 0.5.1). *Josh: the 24 PNGs are in `research/release-0.5.0/canary-a0/legibility/`.*
2. **R6-F · where the formula sits.** **TAKEN: the kit's seat, still — top of the free stage, no parallax, no fleeing the cursor** · the kit's AGAINST
   THE CURSOR · wait for a seat option (D1 to Group II). *It no longer goes to the foot when the transport is docked; the foot seat is a brief candidate.*
3. **R6-L · the atom letters.** **TAKEN: they stay as today in 0.5.1** (on each nucleus, every atom, following the turn, inverted) · the kit's labels beside
   each nucleus, hidden while the camera turns (so hidden for all of AUTO-ROTATE), at most 8.
4. **R6-S · SCENES.** **TAKEN: keep A/B in 0.5.1; SCENES is 0.5.x** · build it now with a format row and a shim.
5. **R6-G · the greeting.** **TAKEN: a HAND pick of a molecule shows its head once; a demo or project open keeps today's law (the notebook opens when it
   has text), no stage greeting** · a demo open also shows its notebook's first part on the stage · off.
6. **R6-B · the blurbs.** **TAKEN: not on the head** (the no-model-number law; 38/38 carry authored numerals) · on the head, marked as description.
7. **R6-T · the notebook's tabs.** **TAKEN: not in 0.5.1; λWAVES' one notebook stays page 0** · adopt `createNotebook({ pages })` (a large row with a
   format change).
8. **R6-C · CURVES.** **TAKEN: a screen-only grade remembered per device (PREFERENCE), exports untouched, the card says so** · saved with the project ·
   not built.
9. **R6-K · `lw:` links.** **TAKEN: notebook links to the named actions preset / view / molecule / orbital, one undo row each** · also whole-state links.
10. **R6-R · the two old reds.** **TAKEN: fix them in 0.5.1** (D10-F) · leave them.
11. **R6-M · the film's window mask.** **TAKEN: 0.5.x** (it changes the locked film digests) · fix it in 0.5.1 with a deliberate re-bake.
12. **R6-N · the number.** **TAKEN: 0.5.1** · 0.5.5.

**Questions still Josh's:** **Q1** which account writes the briefs into MIR (9 + the audit's 3) — the primary account when its week resets (R5-Q2's first
option); **Q2** cut 0.5.1 before Group II — **yes** (Group I is the release; Group II is 0.5.x after the re-adopt).

— Claude Yan, 2026-10-09. Next: `BRIEF-D1.md`, `BRIEF-D10-19.md`, `BRIEF-D10-24.md`, `BRIEF-D10-F.md` (the first wave), then `BRIEF-D2-D8.md` after D1.
