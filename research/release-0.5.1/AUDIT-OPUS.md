# AUDIT-OPUS · the one audit of PLAN-DRAFT-0 for 0.5.1 "Informational Update" (Opus 5.5 @ high, 2026-10-09)

**AUDIT: COMPLETE.** This is the one Opus@high round Josh ruled for stage D (PLAN §9, ≈14:00). Section 3 has the draft's own tables with
**[OPUS: …]** marks inline. Everything else is notes. Every number was checked on this tree (`07c1d7b`, `yan-c`) unless it is marked
**[DERIVED]** or **UNMEASURED**.

**What I read whole:** `PLAN-DRAFT-0.md`; PLAN §2 D, §3 and §9 (with the 10-09 afternoon rulings); `AUDIT-OPUS-1.md` (for its shape);
`CANARY-A0.md` PASS 2; `C-V.md`; `C7B-BUILD.md` (brief candidates, found-not-fixed, open items); `FIX-ROUND-1.md`; `LEGACY-BOOT-REAIM.md`
§4, §5 and §9; the C6, C6b, D9 and D9b BUILD files by their headers plus the sections cited below; the root `CLAUDE.md`; the kit-briefs vault
note (briefs 3, 6, 7, 13, the live-bound brief and the Amendments); and HANDOFF §2 for 10-09.

**What I read in the kit:** `info/layer.js` (whole, 789 lines), `info/page.js`, `info/info.css`, `shell/pages.js`, `shell/notebook.js` (by
grep), `shell/notebook-render.js`, `shell/flash-guard.js`, `shell/share-link.js`, `panels/curves.js` (header + part),
`panels/picture-filter.js` (header) and `render/recorder.js` (hooks).

**What I read on λWAVES' side:** `stage-text.js` (whole); `mod-port.js` (whole); the `rack.js` sites cited below; `names.js` `CURATED_IE`;
`latex-state.js`; `look.js`; `molecules.js`; `statelink.js` (header + exports); `library.json` with all 38 records surveyed by a node
script; the 6 demos; `tools/orbital-library.mjs` (the stem/page writer); `tools/perf/main-thread.mjs`; `tools/perf/digest-lock.mjs`; and the
stage overlays (`vortex.js`, `particles.js`, `keplerview.js`, `shadowview.js`, `orbit.js`, `sliceview.js`, `calculusview.js`).

**How I worked.** I ran only `grep`, `sed`, `wc` and four read-only node scripts under `.tmp/`. No browser and no GPU. I edited no file but
this one.

---

## 1 · Verdict

**SOUND WITH CHANGES. The structure stands. Five rows are rewritten here, D4 is struck, and D3 and D6 SCENES are moved.**

**What is sound and stays:** the gates table, the arithmetic that says the 30,000 bar binds before D's ledger, the Group I / Group II split,
D-V, "no push, no deploy", and the dial.

**What does not stand.** Four of the eight Group I rows rest on a misreading of the tree:
- D2 promises the kit's notebook tabs, but λWAVES does not run the kit's notebook. D2 also proposes a page generator that is not needed:
  the pages already exist.
- D4 moves "the readouts the four windows write over the stage", but those windows write no such text.
- D6 hands SCENES to a lock whose fixtures hold no transition.
- D8 runs `lw:` links "through statelink.js' engine" on a stage layer that cannot be clicked.

**D1's mechanism is misdescribed too.** `hold` is not a lifetime, and a block's markdown cannot be re-given. Kit atom labels become the
block's subject and pull the formula beside the molecule. Parallax runs the spring on every mouse move.

Because Josh ruled one round, every change below carries its replacement text. The integrator can fold this audit into PLAN.md without
another draft.

**The three changes that matter most:**
1. **D1 is ONE kit block for the formula and THE FADE, and the ATOM LABELS stay λWAVES' own letters in 0.5.1.** Build the block with
   `parallax: false`, no `subject` and no anchors. Never call `viewChanged()` for a camera move: a block with no subject and no anchor does
   not depend on the view (`layer.js:346`). Built that way, the block does no work per frame while the camera turns (`layer.js:1–6, 141–143`).
   Kit labels on the nuclei would do three things:
   - they become the block's subject (`readSubject`, `layer.js:161–165`), so the formula hops beside the molecule;
   - that move uses the unclamped branch the spike measured under a rack (`layer.js:352–355`; CANARY-A0 PASS 2 §3);
   - they cost per-frame writes under any turn.

   Hiding them while the camera turns blanks them for as long as AUTO-ROTATE runs. So **D3 and R6-L move to Group II** behind briefs 7
   and 18.
2. **D2 shows pages that already exist and builds no generator.** The existing sources:
   - every library record already carries `page` (`moleculeLatex`) and `stem` (formula, point group, HOMO name, gap, mass, dipole, sources);
   - the 54 live molecules make the same page at runtime, the EDIT › COPY road (`rack.js:1696–1704`);
   - the six demos already carry their notebook text.

   So the draft's tool, its 44 data files, its precache question and its project-format change all disappear. The kit's tabs need a Josh
   ruling: the kit notebook is a different notebook (C6-BUILD's 0.5.x candidate). The blurbs are model-written prose, and all 38 carry
   numerals.
3. **D4 is struck. D6 SCENES moves to 0.5.x. D8 is re-scoped and D10-19 re-calibrated.**
   - **D4.** The only words drawn over the stage besides `stage-text.js` are the VORTEX, PARTICLES and KEPLER captions. They live inside
     2-D canvases that reach exports, so they go with D5.
   - **SCENES.** No lock state holds a transition. The Rabi mix stays. WAVE DANCER plays A↔B.
   - **D8.** Links work in the notebook only. `lw:` needs its own small grammar. The HUD is THE FADE, which already ships.
   - **D10-19.** VIVID and INVERT are not routes. A guard at the default range lets a 2.2× exposure swing pass.

---

## 2 · Errors and corrections, ranked (each with the file:line I read)

**E1 · D1's mechanism (HIGH; it decides the row's cost).**
- **`hold` is not a lifetime.** `addBlock({ hold })` sets `holdUntil`, which only delays the block's AGAINST-THE-CURSOR side flip
  (`info/layer.js:425, 628`). Brief 7 says so itself ("`hold` is not a lifetime"; the vault note, brief 7 §Need). THE FADE is therefore
  λWAVES' own timer: `addBlock`, then `setTimeout(ttl) → handle.remove()`, whose exit animation is the fade.
- **A block's markdown cannot be re-given.** A handle is `{ id, el, remove() }` (`layer.js:711–725`). A changed formula is `remove()` +
  `addBlock()`: an exit, a re-measure and an entrance (340 ms + 45 ms per line, `layer.js:57`). A direct `innerHTML` write leaves stale
  `w`/`h`, because measuring is internal (`layer.js:448–481`). **Brief candidate: `handle.update(md)`.**
- **Labels on the nuclei capture the block.** With no `subject()`, the anchors become the subject (`layer.js:161–165`). Then the block is
  placed beside it (`layer.js:352–355`), the branch the spike measured under a rack at shift ±1.
- **Parallax kicks the spring runner on every pointer move over the stage** (`layer.js:120, 649`), and the default is `parallax = true`
  (`layer.js:98`).
- **`freeze(true)` does not hide anything.** It stops the runner (`layer.js:678–684`), and `viewChanged()` still paints while frozen
  (`layer.js:761`).

**Correction:** `createInfoLayer({ stage, avoid, parallax: false, drift: false, follow: false })`, no subject, no labels, never
`viewChanged()` on a camera move; `follow: false` is a default R6-F can flip. The `ResizeObserver` (`layer.js:787`) and `resize`
(`layer.js:673`) already call it on a size change. The atom letters stay λWAVES' (E2).

**E2 · The ATOM LABELS as kit labels (HIGH).** Today's letters sit ON the nuclei, with no leader line, and follow every camera key
(`stage-text.js:93–112`, called per tick from `rack.js:850`). Kit labels sit beside their anchor (`INFO.out` 46 px + `rise` 34) on a 45° leader.

That is a visible change of look. Its cost is the spike's +115 % at 8 labels if they follow. A cap of 8 drops benzene's 12 letters and C₆₀'s 60,
a regression against today's law ("each MOLECULES nucleus marked", CLAUDE.md). Hide-while-turning blanks them for the whole of AUTO-ROTATE.

**Correction:** keep the letters as λWAVES' code in 0.5.1. About 28 lines move out of `stage-text.js` before it is deleted. D3 and R6-L
move to Group II.

**E3 · D2's tabs (HIGH).** λWAVES' notebook is its own block in `rack.js` (`:3311–3510`, `NB_KEY` …). `createNotebook` is never called
(grep over `lab/*.js`). The kit's tabs exist only for `createNotebook({ pages })` (`shell/notebook.js:57, 324–607`). C6 kept that out on
purpose: "changes what the notebook is: text typed into YOURS would no longer travel with a project, and NEW would no longer empty it. Keep
λWAVES' one notebook as page 0 unless Josh rules otherwise" (`C6-BUILD.md:186–188`). The draft takes that change without the ruling and
without counting it.

**Correction:** no tabs in 0.5.1. Add ruling R6-T (§5).

**E4 · D2's data (HIGH).** All 38 records already carry `page` and `stem` (node survey; written by `tools/orbital-library.mjs:25–31, 363–379`):
- `page`: `moleculeLatex`, 1,748–15,476 characters;
- `stem`: formula, `pointGroup` (null for C₆₀), `gapEh`/`gapEv`, `homo` ("1e1g · HOMO"), mass, dipole, charge, multiplicity, identifiers
  ("VERIFIED against PubChem…"), `blurb`, `ies`, `sources`.

37 of 38 catalogue rows also carry a `molecule` block, so the draft's key list is incomplete. More importantly, MOLECULES holds 91
molecules: 54 live (`molecules.js` `MOLECULES` 54) plus 37 record-only (`RECORD_ONLY` 37). **WATER, N₂, H₂ and the other live molecules have
no record**, so the draft's own browser scene ("open WATER → the greeting") cannot pass on a record-only design. Their page is
`moleculeLatex` at runtime, the EDIT › COPY road (`rack.js:1696–1704`).

The six demos already carry a written notebook (benzene, H₂ σu, helium, N₂, water and WAVE DANCER: `notebook.text`, a `# Title` and prose).

**Correction:** there is no `tools/record-pages.mjs`, no 44 `.md` files and no precache question (records are already DATA, and the demos
are already precached, `sw.js:48–59`). Nothing new goes into the project part.

**E5 · D2's "HELP copy under `lw-window-info`" (MEDIUM).** `HELP_KEY = 'lw-window-info'` is the old ON/OFF flag. `look.js:54` reads it once,
lifts it into `mir.gui` and removes it (`look.js:22, 54`). It is not copy. The help copy is 37 `.note` blocks in 13 files
(`el('div', 'note', …).innerHTML`). "Window pages from the HELP copy" has no source as written.

**Correction:** strike it from D2. Window pages need brief 3 / brief 13: Group II.

**E6 · D2's "no model-authored number" against what the records hold (HIGH for the law).**
- **The blurbs.** Every one of the 38 carries a numeral (node: 38/38; 30/38 also a number word). They are authored prose in
  `tools/orbital-library.mjs:75–208`, for example "90° bond angles", "(2S,3R)", "the textbook 18-electron complex". Some numerals are the
  record's (AO counts) and some are written by hand.
- **`CURATED_IE`.** Ten molecules, "UNCHECKED against the live tables" (`names.js:461–466`). The C₆H₆ record's `ies.status` says "entered
  from memory in S1".
- **What a primary-handbook check would need.** Kimura (1981) and Turner (1970) are books no agent here can read. Only NIST's online tables
  are reachable, and R5-D2 rules out an SRD 101 table.

**Correction:** a page shows only numbers from the record or the live solve: formula, basis, E, nocc/nAO, ε with names, configuration, point
group, HOMO name, gap, mass, dipole, charge, multiplicity. The blurb is shown only by Josh's ruling (R6-B), and `CURATED_IE` is tagged
UNVERIFIED (the default).

**E7 · D4's premise is false (HIGH).** SHADOW, ORBIT, PLANE and CALCULUS draw their text inside their own cards: `shadowview.js:43–80`,
`orbit.js:86–95`, `sliceview.js`, and `calculusview.js:22` (a tile grid in RADIATION's card). Nothing of theirs is over the stage.

The words over the stage besides `stage-text.js` are these, drawn into the 2-D overlay canvases:
- VORTEX's caption (`vortex.js:74`);
- PARTICLES' caption (`particles.js:159`);
- KEPLER's caption (`keplerview.js:58–60`);
- the IMPULSE VECTOR readout (`keplerview.js:88–90`).

They are behind the STAGE CAPTIONS switch, which is off by default (`rack.js:237, 1132`), and **they reach exports** through
`picture({ overlays })` (`capture.js:741–744`). Moving them to a DOM layer removes them from pictures and films until brief 6. PARTICLES'
`alive/count` changes every frame, which would mean a remove + add per frame.

**Correction:** strike D4 from Group I. The captions-on-the-layer job is D5's (Group II).

**E8 · D6 SCENES and the lock (HIGH).**
- **No digest-lock state holds a transition.** The states are listed at `tools/perf/digest-lock.mjs:19–24`, and
  `digest-lock-s4a.json` has 0 hits for "transition". The draft's closer ("the lock's fixtures that hold a transition decide") is vacuous.
- **The "×36 transition" count is a grep count, not a footprint.** `rack.js:641–642` are the CSS `transitionrun`/`transitionend` listeners.
  `state.js:218–219, 608`, `molecular-register.js:14` ("transition RDMs") and `statesview.js:16, 66` ("transition dipole") are prose.
- **The A/B code itself:**
  - the STATE block `rack.js:1466–1515` (≈ 50 lines);
  - the mix in `state.js:206–232` (≈ 15), which is PHYSICS and stays under any SCENES design;
  - `stageStates`' A ↔ B line (`rack.js:2014`);
  - the period refusal (`:2471, :2501`);
  - the project road `pr.ab` (`:3935, :4128`);
  - the route `state.rabi` → `[pr.ab, 'omega']` (`:3895`);
  - `__LW_hooks.ab` for RADIATION's pair (`:2356, :4557`).
- **The flagship demo uses it.** WAVE DANCER plays A↔B (`ab.on: true`, Ω 0.1499).

So SCENES is a project-format change and a saved-route change on the flagship demo, with an OUT of about 50 UI lines (not 100) and a NET above
zero. Equality is not the lock's to prove; a node test of `state.js` `at(t)` under `setTransition` is.

**Correction:** move SCENES to 0.5.x and flip R6-S's default (§5).

**E9 · D8 (HIGH).**
- **Nothing on the stage can be clicked.** The layer is `pointer-events: none` throughout (`info/info.css:53`; `layer.js:4–5`), except a
  label in EDIT, so an `lw:` link in a stage block is dead.
- **The notebook keeps the link, but opens it in a new tab.** The sanitiser keeps `href="lw:…"` (`nbSafeURL` refuses only
  javascript/data/vbscript/file/blob, `notebook-render.js:10`), but it rewrites every link to `target=_blank rel=noopener`
  (`notebook-render.js:25`). λWAVES' notebook view needs a capture-phase click handler that takes `a[href^="lw:"]` and calls
  `preventDefault()`.
- **`statelink.js` is a WHOLE-STATE codec.** `encodeState(serialize())` → `LW.restore()` verbatim (`statelink.js:1–8, 218, 413`).
  `lw:view=density` is a new small grammar mapped onto hand verbs, like the boot's `?preset=`/`?view=` (`rack.js:4680–4682`). It is not
  statelink's engine. An `lw:#s=…` link would replace the user's whole work from one press.
- **"THE HUD" already ships.** It is THE FADE: `loadPreset(…, { hand: true })` (`rack.js:1017`) and the register's `announce`
  (`rack.js:2058`). D1 ports it.

**Correction:** D8 = `lw:` links in λWAVES' notebook view only: a whitelisted `key=value` grammar mapped to existing hand verbs, one history row
per press, announced through D1's fade. A whole-state `lw:#s=` link is excluded unless Josh rules it.

**E10 · D10-19's targets and calibration (HIGH for safety).**
- **VIVID and INVERT are not modulation routes.** VIVID is a `mir.gui` look row (`look.js:19`). INVERT is `mat.invert`, never registered.
  The luminance routes are `material.stage` 0–1, `material.gamma` 0.5–2.4, `material.exposure` **log 0.08–12**, `material.knee` log
  0.02–8 and `material.hue` **wrap** 0–1 (`rack.js:2152–2165`).
- **The guard's default range under-guards.** It counts swings of `delta × span` in the PARAMETER's units (`flash-guard.js:43, 62, 68`). For
  exposure, 0.1 × 11.92 = 1.19 linear units. A swing from 1 to 2.19 is a 2.2× luminance change, and it passes uncounted.
- **Hue false-trips.** A hue LFO crossing the wrap seam reads as a 0.98 swing.
- **The limiter covers only part of the risk.** A fast LFO on `reg.morph`, `chem.kick` or `observer.dist` can flash a large area with no
  luminance parameter involved. Only the field judge sees that.

**Correction:** guard only a whitelist (`material.exposure`, `gamma`, `stage`, `knee`), in the map's own space (log for log routes). Set
`ranges` so that `delta × span` equals the parameter step that moves luminance by about 10 % (§4 U8). Exclude `hue`, or unwrap it. Wrap at
`createModPort.install` (`mod-port.js:85–99`, λWAVES' file) so a non-luminance route is never held. The row's text says plainly that the
limiter is partial.

**E11 · D10-24 CURVES (MEDIUM).**
- **It registers a second project part by default.** `createCurvesPanel` registers part `'curves'` unless `project: false`
  (`panels/curves.js:27, 278`), which breaks R5-A3. The builder passes `project: false` and no `history`, because λWAVES' ring reads
  `serialize({ scope: 'edit' })` only.
- **"WORKSPACE if saved at all" is the wrong scope.** A grade is not window arrangement (`docs/STATE-SCOPES.md`). It is PREFERENCE (a
  screen calibration) or PROJECT (a format row), and that is Josh's call (R6-C).
- **"Screen only" is confirmed.** The CSS filter never reaches `capture.js`' GPU readback, and `recorder.js:29` takes λWAVES' `frame(i, ctx)`.
- **Its cost is not visible to the pair.** A non-neutral SVG filter on a WebGPU canvas costs compositor/GPU time that `TaskDuration` cannot
  see, so the pair is the wrong closer for it.
- **The AMOUNT knob must not be routed** in this release. Otherwise it is a flash route outside the guard.

**E12 · The pair as a "budget shared by four rows" (MEDIUM).** 3.536 is a NOISE gate: max(2 × 1.768, 2) from MEASURE §2 (`C-V.md:171`). It
is not a cost allowance. The interleaved pair's own spreads were 3.0 and 2.2 (`C-V.md:169`). Split four ways, the gate is 0.88 ms/s, below the
noise floor and unmeasurable.

**Correction:** each frame-path row must read |Δ| ≤ 3.536 on its own pair, in the boot scene AND in its own scene, and D-V reads the
cumulative pair against `v0.5.0-alpha`. Rows off the frame path (D2's greeting, D8, CURVES at neutral, the guard's ≤ 4 calls a frame) take no
pair.

**E13 · The D1 pair cannot be taken with the tool as it is (HIGH; unknown U1).** `tools/perf/main-thread.mjs` opens
`/lab/?sw=0&warn=0&starter=home` and plays the boot preset (`main-thread.mjs:51`). It has no MOLECULES, no AUTO-ROTATE and no setup hook.

The draft's D1 cell ("H₂O HOMO, AUTO-ROTATE on") needs a `--setup '<js>'` option, which is a tools/ edit and allowed. Note also that the BASE
is not "no labels": today's letters write a transform per nucleus per camera key under AUTO-ROTATE (`stage-text.js:103–111`). That is why the
pair compares the two directly; it does not need "today's cost" first.

**E14 · D1's placement and look (MEDIUM; these are Josh's).**
- **No foot seat.** With no subject, the kit's block rests at the free stage's TOP + 12 % (`layer.js:346`). Today's formula goes to the FOOT
  when the transport is docked or the pill is at the top (`stage-text.js:51`), and the layer has no seat option. **Brief candidate.**
- **`avoid()` must name more than the racks:** the transport and a bottom-docked TIMELINE too (C7b open item: "the STAGE TEXT at the foot
  under a bottom-docked timeline: not checked").
- **The layer root has no z-index** (`info.css:51–57`). λWAVES must set it under the racks, as `#molFormula` is (z 20 under the racks' 30).
- **The type scale differs.** The kit's sizes are `--info-size-*` clamps (`info.css:28–32`), not the notebook's 34/22/14 × SIZE, so λWAVES
  overrides them with an unlayered rule.
- **The look differs.** The kit's block draws a feathered shade (`info.css:76–79`) in a serif face (`info.css:54`), where today's text is
  transparent KaTeX. Josh's look at the 24 legibility PNGs is still pending (PLAN §9 (b)). It is a precondition of D1, not of D-V.

**E15 · KaTeX ≤ 4/s (MEDIUM).** The layer renders the markdown on every add (`layer.js:435–441`) with no rate limit. λWAVES keeps
`stage-text.js`' 250 ms gate (`stage-text.js:25, 39–40`) BEFORE it calls remove + add. A paint stroke on SPECTRUM's ladder changes the string
at every item it crosses.

**E16 · `ui:` anchors in any page (MEDIUM).** The first `ui:` label installs a body-wide `MutationObserver` on `style`/`class` that calls
`viewChanged()` on any change outside the layer (`layer.js:518–528`). Under modulation, routed dials restyle every frame, so that is layer work
every frame. Rule for 0.5.1: no `ui:` and no feature callouts in any page shown on the stage.

**E17 · D6 FIGURE (LOW).** A picture as a data: or blob: URL is stripped by the sanitiser (`notebook-render.js:10`). `pageFromNotebook`
(`pages.js:102`) converts a 1.4 notebook; it has nothing to do with figures. FIGURE needs brief 19. Strike it.

**E18 · §0's kit inventory, in context (LOW).** "`shell/notebook.js` shows pages as tabs" holds only for `createNotebook({ pages })`.
"`greet(layer, pages)`" needs a pages model (`shouldGreet`/`greeting`, `page.js:143–146`). λWAVES calls
`showPage(layer, firstPart(md), { hold })` itself, or adapts the dismiss half (`page.js:147–158`, about 8 lines).

**E19 · §7's B127 (LOW).** B127 is the 100 ms badge tick, a test-timing row diagnosed by the five-boot-rows agent (HANDOFF.md, 15:25
update). It is not D1's.

**E20 · Deltas not folded (MEDIUM).**
- **B70/B71 and B78-BOW** are λWAVES-side and small. B70/B71 are the 45 × 34 transport buttons on a phone; B78-BOW is the STATE card's BOW
  labels with no IMPULSE seats (`LEGACY-BOOT-REAIM.md:81–90`; red on v0.4.0 too). They are the boot suite's only law reds after the round.
- **"A film keeps the window mask it started with"** (`C7B-BUILD.md:158–161`) is λWAVES' own frame-path bug, not a kit need. It belongs in
  λWAVES' row list (Group I if Josh wants it, with the lock re-baked deliberately), not in `BRIEFS-0.5.1.md`.
- **B17** (NEW's AUDIO source refuses MODULATION ON films) can be fixed on λWAVES' side through `tools/new-project.mjs`, not only by the kit.
- **C-V's CLAUDE.md notes N1–N5** have no owner in the draft: line 9's LINKED sentence, "0.5.0 deletes" `stage-text.js`, "brief 6 at
  0.5.0", and 33 vs 32 `!important`. They belong to D-V's CLAUDE.md pass.

**What I re-measured and found right:**
- `lab/*.js` 27,594; headroom 2,406; the bar binds before the ledger (2,406 < 3,054).
- alpha.24 (`lab/mir/version.js`); no overlay hook in `recorder.js` (`:29` is `frame(i, ctx)` only).
- `stage-text.js` 132, `calculus.js` 127, `names.js` 497 (`CURATED_IE` at `:467`), `statelink.js` 633.
- 38 rows in 4 sections (ORGANIC 1, BIO 25, LATTICE 6, HEAVY 6); 6 demos; `LINK_CEILING` 2000.
- The spike's figures (+115 %; the one-block cell +4.3 to +5.7; frame JS 2.89 ms/s; `viewChanged` 0.12).

---

## 3 · The draft's §1 and §2 tables, with the marks

*Unmarked text is DRAFT 0's, kept. ~~Struck~~ text gives its reason. The replacement text is the integrator's to paste.*

### §1 · The gates

| gate | what | blocks |
|---|---|---|
| **G-L lines** | `lab/*.js` ≤ 30,000 at every merge (hard); ≤ 29,000 at the cut (soft). ~~Pages, records and demos are DATA … ruling R6-P~~ **[OPUS: struck R6-P. No page file is made (E4): a page is a record's `page`, the live `moleculeLatex`, or a demo's notebook. Nothing new is counted anywhere.]** | every row's merge |
| **G-M the pair** | A-M's interleaved pair, base = the tree before the row, tip = the row, \|Δ\| ≤ 3.536 ms/s, notice dismissed, GPU quiet **[OPUS: 3.536 is the NOISE gate (C-V.md:171). Each frame-path row passes it alone, in TWO scenes: the boot scene (the tool as it is) and the row's own scene through a new `--setup` hook in `tools/perf/main-thread.mjs` (§4 U1). It is never split between rows. D-V reads the cumulative pair against `v0.5.0-alpha`. The pair cannot see compositor/GPU cost (CURVES), so that row reads presents/s and the device report instead (§4 U9).]** | D1 ~~, D3, D4~~, D10-19 **[OPUS: D10-19 only if the guard is applied per frame on more than the whitelist]**; D-V for the whole |
| **G-D the lock** | 860 · 0/0 and 1004 · 0/0 | any row touching `field.js`, the shaders, `capture.js`' readback or ψ(t) ~~(D6 SCENES; …)~~ **[OPUS: no row of Group I as amended touches these. The lock holds no transition state (E8), so it was never SCENES' witness. The lock runs again only if Josh takes the film-mask row (§5 R6-M), and then as a deliberate re-bake.]** |
| **G-S the suites** | as drafted **[OPUS: + `tests/stage-text.browser-test.mjs` re-aimed (D1); + `frame-occlusion` (the layer is never in the mask, and its root sits under the racks); + `tests/legacy/boot` B6/B22/B23 (the stage text's tick reads)]** | every row |
| **G-K the kit law** | as drafted **[OPUS: + three brief candidates this audit adds: `handle.update(md)`; a block SEAT option (top / foot); links in a block (a per-element pointer-events exception). The integrator writes them into `BRIEFS-0.5.1.md`.]** | Group II |
| **G-W the `__LW` law** | as drafted **[OPUS: D1 must keep `__LW`'s stage-text witnesses (`stats.renders/announced/places/labelWrites`, the `md`/`formula`/`banner` getters) or re-aim `tests/stage-text.browser-test.mjs` in the same commit]** | every row |
| **G-F the fade law** | as drafted **[OPUS: + the greeting fires on a HAND pick of a molecule (a press, so it is ordinary G-F), and on a project or demo open ONLY as R5-I4's exception and only if R6-G says so. Never on undo, link or restore.]** | D1, D2, D8 |

### §2 · Group I — buildable now on alpha.24

| # | piece | rule | closer | out · ledger |
|---|---|---|---|---|
| **D1** (M) | **[OPUS: REWRITTEN.]** **THE STAGE TEXT's formula and THE FADE become ONE kit block.** `createInfoLayer({ stage, avoid: () => [racks, transport, a bottom-docked TIMELINE], parallax: false, drift: false, follow: false })` once, in `rack.js` beside `initStageText`, with no `subject`, no `features` and no labels. `viewChanged()` is never called for a camera move: the layer's own ResizeObserver and `resize` cover a size change. The formula / the states' prose = `addBlock({ md })`. A changed string = `remove()` + `addBlock()`, behind `stage-text.js`' 250 ms KaTeX gate (E15). THE FADE = a second `addBlock` + λWAVES' `setTimeout(ttl)` → `remove()` (the exit IS the fade; `hold` is not a lifetime, E1); `{ hand: true }` only. HOLD (I) = an ACTIONS row from `infoActions` (KeyI is free). The DISPLAY row stays ONE row: the switch is `root.hidden` plus "add nothing while off"; SIZE overrides `--info-size-*` × SIZE in an unlayered `lab.css` rule. The root's z-index sits under the racks. **THE ATOM LABELS stay λWAVES' letters** (≈ 28 lines out of `stage-text.js` into `rack.js` or `molecule-state.js`, unchanged: on the nuclei, `difference`, written per camera key). `stage-text.js` is then deleted. The caption (`stageCaption`, `capture.js` `drawCaption`) is unchanged until D5. ~~the ATOM LABELS = `addLabel({ anchor })` … HIDE-WHILE-TURNING … ruling R6-L~~ **(E1, E2: kit labels become the block's subject, cost per frame, are capped below today's count, and blank for the whole of AUTO-ROTATE → Group II with brief 7/18.)** Placement: the kit's seat (top of the free stage, still) or not built (**R6-F as reworded, §5**). | **[OPUS: the pair, |Δ| ≤ 3.536, in the boot scene AND in the D1 scene (MOLECULES · H₂O HOMO, AUTO-ROTATE on, STAGE TEXT on, a pointer sweep over the stage for 10 of the 30 s), base = the tree before D1. Plus a WITNESS: a `MutationObserver` on `layer.root` counts 0 records over 10 s of AUTO-ROTATE after the entrance has landed, and `layer.debug().running` is false (§4 U2). If either fails, the row is NOT merged and `stage-text.js` stays.]** | `tests/stage-text.browser-test.mjs` re-aimed (the key law; KaTeX ≤ 4/s; the fade on `{ hand: true }` only; the caption unchanged; the letters unchanged); `frame-occlusion`; `hit-probe-set` 0 reached; `keyboard-shortcuts` (the I row); the pair and the witness | OUT `stage-text.js` 132 + its `lab.css` rules; IN ≈ 35 (the layer, block, fade timer, gate) + ≈ 28 (the letters, moved) **[DERIVED] → ≈ −70** |
| **D2** (M→S) | **[OPUS: REWRITTEN.]** **THE MOLECULE'S PAGE, shown.** Its source exists: a record's `page` (`moleculeLatex`, written by `tools/orbital-library.mjs:379`) and `stem`; a live molecule's `moleculeLatex` at runtime (`rack.js:1704`); a demo's notebook. Shown (a) on the stage: a hand pick of a molecule shows its HEAD once, through `showPage(layer, head, { hold: 2500 })` on D1's layer. The HEAD is one short block: the formula and name, RHF/basis, E, nocc/nAO, point group, HOMO name, HOMO–LUMO gap, every number from the record or the live solve. It is dismissed as `greet` does (Escape or a stage press after the hold; `page.js:147–158`, adapted, since there is no pages model). (b) The full page is as today: EDIT › COPY (`moleculeLatex`) → the notebook. A demo or project open follows R6-G. ~~A generator in `tools/record-pages.mjs` … 44 pages … `lab/library/<hash>.md` … the kit's page tabs … the window pages (from the HELP copy under `lw-window-info`) … pages ride INSIDE the part … a deliberate version row~~ **(E3, E4, E5: the pages exist; λWAVES has no kit notebook; `lw-window-info` is a lifted flag; nothing new enters the project.)** The blurb (`stem.blurb`, 38/38 with model-written numerals) is NOT on the head unless **R6-B** says so. `CURATED_IE` shows only tagged UNVERIFIED (E6). The RPA root names in SPECTRUM (the Sol thread's C3) stay the names.js half, **[OPUS: kept; its own Σ d_Λ m_Λ gate, PLAN §2 D2]** | no number on the head that is absent from its record or solve (a node test over the 38 records' heads + a live solve of H₂O and N₂ in node, every numeral diffed against its source field); the head never shows on restore, undo or link (G-F) | the node test; `stage-text` suite + one browser scene: a hand pick of WATER (a LIVE molecule) → its head on the stage, gone on a stage press after 2.5 s; an undo back to it → nothing; `molecule-demos`; `history` | IN ≈ 30 (the head composer from stem/ground + the show/dismiss) **[DERIVED] → +30**; 0 data files; 0 format change |
| ~~**D3** (S) **FEATURE LABELS**~~ | **[OPUS: MOVED to Group II (D3 there). Once the atom letters stay λWAVES' (E2), no page shown in 0.5.1 carries a feature callout, so the row has no consumer. Its cost is the spike's +115 % until brief 7, and its rack clamp is brief 18.]** | — | — | 0 |
| ~~**D4** (S) **THE OVERLAYS' TEXT, movable**~~ | **[OPUS: STRUCK. No window among SHADOW, ORBIT, PLANE and CALCULUS writes text over the stage (E7). The stage words are the VORTEX, PARTICLES and KEPLER captions inside exported 2-D canvases, off by default, and moving them to the DOM removes them from pictures and films. They go to Group II with D5 (D4′ there). The WORKSPACE key for a moved label goes with it.]** | — | — | 0 |
| **D8** (S) | **[OPUS: RE-SCOPED.]** **`lw:` LINKS in the notebook.** A capture-phase click on λWAVES' notebook view (`rack.js` notebook block, `view`) takes `a[href^="lw:"]` and calls `preventDefault()`: the sanitiser keeps the href but sets `target=_blank` (`notebook-render.js:10, 25`). The grammar is `lw:key=value[&…]` over a WHITELIST mapped to existing hand verbs: `preset` (`loadPreset(id, { hand: true })`), `view`, `molecule` (the MOLECULES pick), `orbital`. One history row per press, announced once through D1's fade. ~~through `statelink.js`' engine (the same fields as `#s=`)~~ **(E9: statelink restores a whole state; a page link must not replace the user's work. An `lw:#s=` whole-state link is excluded unless Josh rules it, R6-K.)** ~~the HUD …~~ **(E9: THE FADE is the HUD and D1 ports it; the presses CLAUDE.md names already announce.)** Links on the STAGE are Group II (a block that takes a click is a kit brief). | one fade per hand press; a link press is one ring row; a link never clears the ring | `history` (a link press is one row); a browser scene: `[x](lw:view=density)` in the notebook's view changes the view, announces once, opens no tab; the stage-text suite's fade cases | IN ≈ 30 **[DERIVED] → +30** |
| **D10-19** (S) | **THE FLASH GUARD, the limiter half** **[OPUS: TARGETS AND CALIBRATION REWRITTEN.]** `createFlashGuard({ ranges })` wraps the `set` of a WHITELIST of luminance routes in `createModPort.install` (`mod-port.js:85–99`): `material.exposure`, `material.gamma`, `material.stage`, `material.knee`. Each is guarded in its map's space (log routes as log). `ranges` are chosen so that `delta × span` is the step that moves luminance by about 10 % (§4 U8). `material.hue` is excluded (wrap: a seam crossing would false-trip). Every other route is untouched. The trip goes to METERS' status (`guard.describe()`). ~~(VIVID, the palette's brightness/exposure routes, the stage's INVERT)~~ **(E10: VIVID is a look row and INVERT is not a route.)** The row's text says plainly that the limiter is PARTIAL: a fast LFO on `reg.morph`, `chem.kick` or the camera can still flash, and only the FIELD JUDGE (0.5.x, a frame-path row) sees that. | no readback; the notice unchanged | node: a 10 Hz square LFO at depth 0.3 stop on `material.exposure` is held to ≤ 3/s; the same LFO on `observer.yaw` passes untouched; a 0.1 Hz exposure ramp passes untouched; a hue LFO through the seam does not trip; `take-in-bugs` 4/4; `routed-knob` 4/4 | IN ≈ 25 **[DERIVED] → +25** |
| **D10-21** THE INK LAW | ~~satisfied by D1/D3/D4~~ **[OPUS: satisfied by D1's block alone. The atom letters keep `difference` in 0.5.1 (E2). Josh's look at the 24 PNGs moves from D-V to BEFORE D1 (R6-I): D1 ships the kit's shade + serif face over the picture.]** | — | the PNGs re-taken once at D-V | no row |
| **D10-20** THE TITLE CARD | DONE in 0.5.0 (C6b) | — | — | no row |
| **D10-24** (S) | **CURVES** … a rack card listed in + and WINDOW, shipped closed, SCREEN only **[OPUS: + `createCurvesPanel({ …, project: false })` with NO `history` (curves.js:27, 278; R5-A3). Its state is saved per **R6-C**: PREFERENCE (a screen calibration, the default) or PROJECT (then a format row). WORKSPACE is the wrong scope (E11). AMOUNT is not routed in this release. Neutral = no filter at all (picture-filter's own law).]** | the lock unchanged by construction; **[OPUS: presents/s and the device report with a non-neutral curve, not the main-thread pair (§4 U9)]** | `hit-probe-set`; `frame-occlusion` (a new painted card); `settings-probe` (one new PREFERENCE key) or `serialize-bytes` + `project-formats` (if PROJECT) | IN ≈ 30 **[DERIVED; the draft's 15 omits the card, the + entry, the occlusion provider and the key] → +30** |
| **D10-8** the library gallery | 0.5.x | — | — | not built |
| **D6** (L→S) | **[OPUS: REWRITTEN.]** **SCENES → 0.5.x, not built here** (E8): no lock state holds a transition; the Rabi mix (`state.js:206–232`) is physics and stays; WAVE DANCER plays A↔B; `pr.ab` and the route `state.rabi` would change shape; OUT ≈ 50 UI lines against a larger IN. **FLY-TO + search**: not built (no out named). ~~**FIGURE** … folded into D2~~ **(E17: a picture in a page needs brief 19 → Group II.)** **chips, MAPS**: not built. | — | — | 0 |
| **[OPUS: NEW] D10-F** (S) | **The two pre-existing law reds, fixed** (if R6-R takes it): B78-BOW (the STATE card's `BOW` group/readout → `IMPULSE` words and seats; LEGACY-BOOT-REAIM §5) and B70/B71 (the transport's six 45 × 34 buttons → 44 px tall on touch, `lab.css`) | the laws as written (waves 51, 53, 63) | `tests/legacy/boot` B70, B71, B78 green; `access`; `hit-probe-set` | IN ≈ +3 JS, a few CSS lines |

### §2 · Group II — gated on a kit brief and ONE re-adopt

| # | piece | waits on | then |
|---|---|---|---|
| **D1b** labels that FOLLOW a turning camera | brief 7's fix … **[OPUS: re-worded: "**D1b · THE ATOM LABELS as kit labels**", leaders, following. It also needs brief 18 (avoidance + the block clamp) and a decision on the 12+ nucleus molecules (benzene, C₆₀).]** | `stage-text.js`' surviving letters (≈ 28 lines) leave |
| **[OPUS: MOVED] D3** feature labels, `place()` | briefs 7 and 18 | pages may carry `[!mir|O1]` callouts; still no `ui:` callouts unless the MutationObserver hazard is measured under modulation (E16) |
| **D5** the film overlay + TAKE MODE; the caption retired | briefs 6 and 7 **[OPUS: + D4′ the overlay captions (VORTEX, PARTICLES, KEPLER) onto the layer, only once a film can carry them]** | as drafted |
| **D7** / **C8** | briefs 5+4 / 8 | as drafted |
| **D3′ · D4′ · D2′** | briefs 18, 19, 3 **[OPUS: + FIGURE needs 19; + links in a stage block (a new brief candidate); + `handle.update(md)` and a block SEAT option (new candidates, E1/E14)]** | as drafted |
| **[OPUS: NEW] D2″** the notebook's TABS | **not a brief: Josh's ruling R6-T** (adopting `createNotebook({ pages })` changes what the notebook is, C6-BUILD:186–188) | YOURS, the shelf, notes recent 8; a format row; `new-project`; `history` |

### D-V, §5 numbers, §4 order

- **D-V** as drafted **[OPUS:**
  - **+ CLAUDE.md** C-V N1–N5;
  - **+ the THE STAGE TEXT paragraph** rewritten for D1 (the letters stay; brief 6 "at 0.5.x");
  - **+ the cumulative pair in TWO scenes** (boot, D1's);
  - **+ the TIMELINE-open ms/s** (C7b open item);
  - **− the lock**, unless R6-M;
  - **+ `v0.5.0-alpha` must exist first** (`git tag -l 'v0.5*'` is empty at `07c1d7b`).

  **]**
- **§5 numbers [DERIVED]:** D1 −70 · D2 +30 · D8 +30 · D10-19 +25 · D10-24 +30 · D10-F +3 → **net ≈ +50 → `lab/*.js` ≈ 27,640 at the cut**.
  No data files are added. ~~Pages ≈ 44 × 1–2 KiB~~.
- **§4 order [OPUS]:** **D1 first, alone** (still right: D2's head, D8's announcement and the fade all ride on its layer) **∥ D10-19 ∥
  D10-24 ∥ D10-F** (each in its own files or regions: `mod-port.js`; a new card near the CAMERA/RAMP panels; `lab.css` + STATE's group). Then
  **D2 + D8 as ONE builder**: both edit the notebook block (`rack.js:3311–3510`, D2's `opened()` and D8's view handler), and D2 also takes
  the MOLECULES pick site. **The dial:**
  - **Opus** for D1 and for D2+D8;
  - **Sonnet** for D10-19 (the calibration test is node), D10-24 and D10-F;
  - **D-V**: one fresh Opus.

---

## 4 · Unknowns to measure first (a builder's or the D1 pair's, in this order)

1. **The scene hook (D1, before any D1 code).** Add `--setup '<js>'` to `tools/perf/main-thread.mjs`: an expression evaluated on the
   measured page after `__LW.ready` and the notice dismissal, before the pause/settle. Also record the served tree's sha by asking the server
   (C-V N8). The D1 scene is
   `<MOLECULES on + the H2O pick>; <the ORBITAL view + HOMO>; <AUTO-ROTATE on>; <STAGE TEXT on>`, using whatever `__LW` verbs the
   spike's `p2-cost.mjs` used. I did not check the verb names.
   - **Command:** `LW_PORT=<base> node tools/perf/main-thread.mjs --runs 1 --setup "…"`, interleaved with the tip, 5 + 5.
   - **Three arms on the BASE:** STAGE TEXT off, STAGE TEXT on (today), and on the tip, the layer. Today's cost falls out of the first two;
     the draft calls it unmeasured.
2. **The idle witness (D1).** On the tip in the D1 scene: a `MutationObserver({ subtree, attributes, childList, characterData })` on
   `layer.root` for 10 s after the entrance → **expect 0 records**, and `layer.debug().running === false`. Repeat with a CDP
   `Input.dispatchMouseEvent` sweep over the stage (40 moves/s) → expect 0 with `parallax: false`. If any record appears, the builder finds
   its writer before measuring the pair.
3. **Placement (D1).** At `__LW.camera.setShift(±1, 0)` and centred, with the transport floating, docked and at the top, and with the
   TIMELINE docked at the foot: the block's rect never meets `uiSpace()`'s rects. Re-use the spike's `09-rack-d4` recipe on the block alone.
4. **The churn (D1).** A paint stroke across 6 rows of SPECTRUM's ladder in 1 s: count KaTeX renders (≤ 4/s) and block entrances (≤ 4). If
   the remove + add flicker reads badly by eye, that is Josh's to see, and `handle.update` becomes a brief.
5. **The fade (D1).** `loadPreset(…, { hand: true })` → one block for 2.4 s, then the exit. A restore, an undo or a link → 0
   (`stats.announced` kept as the witness).
6. **The heads (D2), in node.** For each of the 38 records, and for H₂O and N₂ solved live in node (`lab/mathworker.js`' road, as the
   generator does), compose the head and diff every numeral against the source field. Confirm `stem.pointGroup` is null only for C₆₀, and
   that a head shows "—" there, not an invented group.
7. **No `ui:` anchors (D2, D8).** `grep -rn "\[!mir|ui:" lab/` must stay empty. No measurement unless Group II's D3 wants them.
8. **The guard's calibration (D10-19), in node.** For each whitelisted route, compute the parameter step that changes relative luminance by
   10 % at the route's default:
   - exposure: a multiplier on linear radiance, so log-space Δ = ln 1.1 ≈ 0.095;
   - gamma: out = in^(1/γ) at mid-grey;
   - stage and knee: from `field.js`' formula.

   Set `ranges[route]` so that 0.1 × span equals that step. Then check that a 10 Hz exposure LFO of ±0.3 stop trips and a ±0.05 stop one
   does not.
9. **CURVES' cost (D10-24).** Not with the pair. Measure presents/s over 30 s with an S-curve set against neutral (same tree), plus Josh's
   device report on the M5 (`?report=1&post=1`). Neutral must read `filter: none` on the canvas (`getComputedStyle`).
10. **`v0.5.0-alpha` exists** before D-V's base is named (`git tag -l 'v0.5*'`).

---

## 5 · The rulings, as I would put them to Josh (the first option is the default)

**Ask first: three that block D1.**
1. **R6-I · the words' look (before D1).** Look at the 24 PNGs in `research/release-0.5.0/canary-a0/legibility/`. D1 replaces today's
   transparent KaTeX formula with the kit's look: ink, a feathered shade behind it, and a serif face.
   - **The kit's look** (default: bare read 12 of 12)
   - keep today's (then D1 is not built in 0.5.1)
2. **R6-F · where the formula sits.** The kit's block rests still at the top of the free stage (between the racks, under a top bar). It no
   longer goes to the foot when the transport is docked: the kit has no foot seat, which is a brief.
   - **the kit's seat, still: no parallax and no fleeing the cursor** (default)
   - the kit's seat, fleeing the cursor once it crosses the middle (the kit's AGAINST THE CURSOR)
   - wait for a seat option in the kit (D1 to Group II)
3. **R6-L · the atom letters (reworded).**
   - **they stay as today in 0.5.1** (on each nucleus, every atom, following the turn, inverted) (default)
   - the kit's labels beside each nucleus with a leader line, hidden while the camera turns (and so hidden for all of AUTO-ROTATE), at most 8
     on screen

**Then the scope rulings.**

4. **R6-S · SCENES.**
   - **keep A/B in 0.5.1; SCENES is 0.5.x** (default, flipped from the draft's: the lock cannot prove it and WAVE DANCER uses A/B)
   - build SCENES now with a format row and a shim
5. **R6-G · the greeting.** A hand pick of a molecule shows its head (formula, energy, HOMO, gap) once on the stage.
   - **on a pick; a demo or project open keeps today's law (the notebook opens when it has text), no stage greeting** (default)
   - a demo open also shows its notebook's first part on the stage
   - off
6. **R6-B · the blurbs.** Each record's two-line description is written prose. All 38 contain numbers that no solver produced ("90°",
   "18-electron").
   - **not on the page** (default; the no-model-number law)
   - on the page, marked as description
7. **R6-T · the notebook's tabs.** The kit's tabbed notebook (project pages as tabs, plus YOURS and the shelf) changes what the notebook is.
   Text in YOURS would stop travelling with a project, and NEW would stop emptying it.
   - **not in 0.5.1; λWAVES' one notebook stays page 0** (default)
   - adopt it in 0.5.1 (a large row with a format change)
8. **R6-C · CURVES.**
   - **a screen-only grade remembered per device (PREFERENCE), exports untouched, the card says so** (default)
   - screen-only and saved with the project
   - not built
9. **R6-K · `lw:` links (new).**
   - **notebook links to a few named actions (preset, view, molecule, orbital), one undo row each** (default)
   - also whole-state links (`lw:#s=…`) that replace the open work
10. **R6-R · the two old reds (new).**
    - **fix them in 0.5.1** (default): the phone transport buttons to 44 px; the STATE card's BOW words to IMPULSE
    - leave them
11. **R6-M · the film's window mask (new).** A film cuts holes in the frame lines wherever a window stood when it started.
    - **0.5.x** (default; it changes the locked film digests)
    - fix it in 0.5.1 with a deliberate re-bake

**Kept as drafted:**
- **R6-N** the number: **0.5.1** · 0.5.5.
- **Q1** the briefs: Josh's primary account. Now 9 plus 3 new candidates: `handle.update`, a block seat option, links in a block.
- **Q2** cut before Group II: **yes**.

**Struck:** R6-P (no page files exist to count, E4). R6-L in its drafted form (replaced by 3).

---

## 6 · What I did not check

- **Nothing in a browser and nothing on the GPU.** Every cost claim above is a reading of `layer.js`, and §4 U1–U4 are what turn it into
  numbers. In particular, "a block with no subject, no anchors and no `viewChanged()` does zero work while the camera turns" is DERIVED from
  `layer.js:1–6, 141–143, 346, 612, 649`. It is not measured.
- **The kit's `createKeys` handling of an `up` row** (HOLD on I) inside λWAVES' key table. I did not read `lab/key-table.js` against
  `infoActions`' shape.
- **`field.js`' formulas for `material.stage` and `material.knee`**, which U8 needs for their luminance step.
- **Whether `moleculeLatex` can run in node for a live solve.** The generator does, so probably; U6 confirms it.
- **`docs/STATE-SCOPES.md`**, read only for the WORKSPACE definition, not whole. The `settings-store.js` FAMILIES table was not read.
- **`tests/pwa.test.mjs` and `lab/sw.js`' DATA rule**, beyond the demo rows. The audit adds no files, so the question fell away.
- **The M5 / WebKit / touch behaviour of the layer** (the kit's probe; Josh's command, PASS 2 §5).
- **The C6b/D9/D9b brief-candidate lists, item by item.** I read them by header only. The integrator's `BRIEFS-0.5.1.md` pass collects them.
- **`tools/perf/digest-lock.mjs` beyond its header state list.** A transition could still enter the lock through a styles or lines case.
  The header names none, and the s4a fixture has no "transition" key.

— Opus 5.5 @ high, 2026-10-09. For the integrator: fold §3's marks into `PLAN.md`; take R6-I, R6-F and R6-L to Josh before D1's brief;
write `BRIEF-D1.md` with §4 U1–U5 as its first step.
