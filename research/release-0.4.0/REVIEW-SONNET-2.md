# REVIEW-SONNET-2 · the junior's two cents on PLAN-DRAFT-2 (Sonnet 5.5, high effort, 2026-10-07)

Read in order: NACRE.md; the four surveys; REVIEW-SONNET-0; AUDIT-OPUS-1 Part A; PLAN-DRAFT-2 (all of it); the names plan
and PROBE; CLAUDE.md; docs/STATE-SCOPES.md. Checked in the tree (read-only): `lab/field.js` (kernel 166-262, MOL_CAPS 672-678,
writeView 1005-1033), `lab/stage-gestures.js`, `lab/chemview.js`, `lab/window-chrome.js`, `lab/native-ui.js:86-94`,
`lab/lab.css:424`, `lab/statelink.js` (header, TAG table, notCarried), `lab/capture.js`, `lab/molecules.js`, `lab/vendor/*`,
`lab/mir/kit.js`, `tests/latex-state.test.mjs`, `tests/wiring.test.mjs`, `tools/perf/digest-lock.mjs`, origin/main's `lab.css`.
One read-only `node -e` (a `require` of the kit's KaTeX). Nothing else was run; nothing but this file was written.
"D2:n" = PLAN-DRAFT-2 line n. Without a qualifier a claim is verified in code; "by reading" marks an inference; "[mine]" my arithmetic.

---

## 1. PLAINLY WRONG

W1. **B0's `.mol-more` + LEAN fix (D2:71-72) reveals nothing on a first run.** HELP is OFF at first run (CLAUDE.md first-run law;
    `native-ui.js:86,91-92`), `body.window-info-off .dev-lean {display:none}` (`lab.css:424`), and LEAN starts ON for every card
    (`window-chrome.js:15,25`). The controls are hidden AND the Aa button that reveals them is hidden: KICK / RUN / TDA / the RPA
    spectra stay as unreachable as under Cloud's permanent `hidden`. Fix: keep `.dev-lean` visible on cards that hide controls,
    or leave `.mol-more` open by default on desktop. (Opus's own A1.8 trap, applied to his own fix.)
W2. **F4's lens-shift maths has the wrong units (D2:268-276).** `fwd + sx*tanH*aspect*right + sy*tanH*up` moves the picture by `sx`
    HALF-widths (uv spans [-1,1], `field.js:334`), not "shares of the view's width": at the clamp 0.5 the pivot reaches a
    quarter-width, not "the frame's edge". It needs `2*sx` on x and `2*sy*aspect` on y (or define the shift in uv); the pivot
    appears at minus the shift; the line pass (`field.js:557-560`) must use the same convention. Add to S2: a non-zero-shift
    pixel test that one FRAME corner lands on the same pixel through the line pass, the ray pass and `pointerRay`/`unproject`.
W3. **"The ≤64 tiers' pipelines are untouched, and the lock proves it" (D2:325; S4 row D2:388) is false.** The lock's one molecular
    fixture is H₂O/STO-3G (`digest-lock.mjs:14,142`): 7 AO = tier 0 (cap 16, `field.js:677`). Tier 1 (benzene, H₂O/6-31+G*) and
    tier 2 (41-64 AO) are in no lock, and `field-molecule.browser-test.mjs` uses benzene for COST only (a stand-in D). Fix: add a
    benzene and a 64-AO fixture to the lock on the base tree before S4c edits `molWgsl` or the dispatch.
W4. **"A link ... that names an uninstalled record fetches it on open" (D2:144-145) cannot happen.** v1 links carry no molecule:
    `statelink.js` encodes no `instruments`/`chem`, and `notCarried` names only `mo`, `modulation`, `rotationRates`
    (`:371-374`; `rack.js:4939`), so a link made under MOLECULES silently drops it. Also R-C2 (D2:289, :430) is a false choice:
    the codec's own policy says adding a section, or fields at the END of one, does not bump the version (`statelink.js:23-26`).
    The shift can ride the CAM section's tail in v1 for free.
W5. **The diversity gate deletes the section Josh named (D2:148-151 vs :305-307).** After glycine, Ala / Val / Ser / Thr / Asp /
    Asn / Glu / Gln / Lys / Met / Leu add no element, no point group (all C₁) and no tag from "(ring size, peptide bond, d-block,
    cluster, cage, nucleobase)". "All amino acids" and "diverse" must both hold: the gate needs an explicit FAMILY allowance.
W6. **S0 promises a record page that does not exist yet (D2:68-70 vs :152-153).** In S0, EDIT › COPY "copies that molecule's
    page", but pages come from the offline generator per RECORD (B2), and records exist only for benzene and the new sections.
    The 54 existing molecules, the default H₂O included, have none; the names plan's N3 (the 52-record starter) survives only as an
    aside in a ruling (D2:437). Fix: the page is a pure function of `{library row, ground names}` built at copy time in `names.js`;
    the generator only snapshots it. (S0 also precedes the names it quotes.)
W7. **R-F1 "adopts 1.5.0 first among the big four" (D2:43-47) is false.** BASINS is already on 1.5 alpha.21 at stage 11 (MIR-1.5
    survey 2.1), and Josh's 10-06 word is "lambdawaves and nebula" next. "First" can only mean first of the three still on 1.4.3.
    Say concretely what flagship changes: who writes the briefs, whose gates join the kit's release checklist.
W8. **The CORE rule skips Sc-Zn (D2:195-197).** It lists He / Ne / Ar cores and "Ar + 3d¹⁰ for Ga-Kr", and nothing for Sc-Zn: exactly
    TiCl₄, Fe(CO)₅, ferrocene, Cr(CO)₆, Ni(CO)₄, ZnCl₂ (Ar core, 3d valence). Put the per-element count in the generator.
W9. **"Wire, don't re-date" (D2:82-85) breaks two node tests.** `tests/latex-state.test.mjs:13` and `tests/notebook-math.test.mjs:19`
    `createRequire` the vendor KaTeX; `lab/vendor/package.json` (`type: commonjs`) is what makes that work under the root
    `type: module`. The kit copy has none and may not get one (adopted dir): requiring `lab/mir/shell/vendor/katex/katex.min.js`
    returns `{}` (I ran it). The tests need a `vm` / `.cjs` loader; name them in S0.
W10. **The Sol thread has no 0.4.0 stage.** D2:16-17 and R-S1 say it starts; Opus's A7 calls its ledger a 0.4.0 deliverable; the stage
    table moves it to 0.4.1 (D2:391). Josh asked for it in this ask. Add a parallel, off-path S1'' (Sol via mathcollab, no Opus cost).
W11. **Acceptances that wait on a person (D2:168-170, :386, :388).** S2, S4a and S4c close on "the 3070 and the M5 (Josh runs the M5
    half)": three stages hang on one iPad. Close on the 3070 plus a one-line command for Josh, with "M5 pending" recorded.
W12. **S2 omits CLAUDE.md's permanent guard.** `tests/render-regressions.browser-test.mjs` (scaled hit-test, paused redraw) is not in
    D2:386 although the shift changes `pointerRay`/`unproject`; the new targets `observer.panx/pany` are arguably a modulation
    edit (CLAUDE.md: `bash test.sh node` + the focused browser regression). `frame-occlusion` is not named for S0 either.
W13. **D2:487 "Nothing else new is built in 0.4.0's interface" contradicts F1/F5.** The `‹ SECTION ›` page turner and INSTALL/REMOVE
    header (D2:300-303), the CORE fold (:195) and VALENCE (:329) are new chrome that is not on Opus's three named exceptions
    (AUDIT A3.2). Name a fourth exception (Josh did ask for "expansions" and "layouts") or hand them to a brief; do not say "nothing".
W14. **Editorial damage Josh will read.** The `[OPUS: ...]` strip left ~25 orphan `**` (D2:82, 88, 94, 99, 115, 146, 155, 165, 168, 171,
    195, 212, 227, 276, 300, 302, 317, 337, 471), stray `added] P` / `added] J` (:368, :370) and `rewritten.` (:320), a doubled
    `TAKE MODE.` (:463-464), a 0.4.0 bullet that says "at 0.5.0" (:456), a dangling R-L3 (:437) and no R-W4. Repair before Josh sees it.

---

## 2. JOSH'S ASK, LAST CHECK (sentence by sentence; "0.5.0" counts as a home only if §8 names it)

| # | Josh's sentence | Home (≤5 words) | Verdict |
|---|---|---|---|
| 1 | pre-refactor to get ready for MIR 1.5 | B0.5 canary, `cameraEye`, briefs | OK, thin (one seam) |
| 2 | this will be our 0.4.0 alpha | S5, "cut 0.4.0-alpha" | OK |
| 3 | Cheat: AUTOMATA / EARTH / SOLEIL / NEBULA | §8 sibling dispositions | OK; only CITE-as-content lands now |
| 4 | take flagship status from BASINS | §1 R-F1 | PARTIAL (W7) |
| 5 | caching like expansions; metadata, STEM, copy/LaTeX to the journal | B2, F5 headers, R-L4, B0 | PARTIAL (W6: no page for 54 old molecules) |
| 6 | true human information / fill gaps, STO-3G vs 6-31+G* | F1 curated IEs, N₂ demo | PARTIAL (curated for ten only; 6-31+G* names unproven) |
| 7 | true ladder names 1a1, 1b2 on the knob | F1 / S1 | OK (dial-text rule missing, §3) |
| 8 | caching useful for future informationals | B2 page, §8 row 7 | OK |
| 9 | wave indexing, ZOETROPE, electrostatics / QHO / Taylor shells, "anything" | §6 0.5.x, §8 Later | OK (named, not planned) |
| 10 | not too many variations; be diverse | B2 diversity gate | PARTIAL (W5) |
| 11 | spectrum-button layouts: vertical periodic table | F3 ATOMS grid | OK |
| 12 | ...heavy atoms, lattices, biology (all amino acids, small chains, video end) | F5 sections as `<select>`s | PARTIAL: not button layouts; `cells` is brief 4, absent from §8; 20/20 only as records after S4c; video content unknown (§8 says so) |
| 13 | bucky-ball as our next milestone | §6 0.4.1, R-L2 | OK placed; see §5 |
| 14 | engine: much larger atom / electron count | S4c cap-128 | OK |
| 15 | engine: heavier atoms | HEAVY section, Z ≤ 36 | MISSING beyond Kr (no §8 line; §4 item 6) |
| 16 | cyclotomic scaling, Sol 6.1, DISK, lower orbitals "go nuts" | R-S1, VALENCE, CORE | PARTIAL (W10) |
| 17 | check live GitHub: atom + formula text | B0 merge, F2 | OK |
| 18 | INFORMATIONAL: video-overlay, cursor-aware; atom + formula = first taste | F2 now, §8 row 7 later | OK (first taste only, R-G2) |
| 19 | changes with settings; WINDING / HOMO-LUMO fade at the top; other elements too | F2 announce | PARTIAL: "other elements" (palette / camera HUD) is R-I2 only, not §8 |
| 20 | cursor-dynamic diagonal / flat / vertical lines | §8 row 7 | OK |
| 21 | all text through the markdown engine, proper math | F2 renderNotebook + KaTeX | OK |
| 22 | title / heading / body "typomagical"; sizes per element | F2 three sizes | PARTIAL: "typomagical" and its faces appear nowhere |
| 23 | optimise informational for GPU screen recording | brief 7, §8 TAKE MODE | OK later; nothing in 0.4.0 |
| 24 | camera pan: off-centre large zoom, max FOV | F4 lens shift | OK (units wrong, W2) |
| 25 | camera window gets the dot-matrix XY | F4 knobs; §8 row 33 pad | OK |
| 26 | dot matrix for all inlays, less intense, smaller | §5 inlay list, §8 row 33 | OK |
| 27 | audit windows; consolidate with the popular ones | F3 (DYNAMICS only) | PARTIAL: no usage data; no ruling asks which windows he opens |
| 28 | State needs to be audited | R-W5 "both done" | PARTIAL: four lines of audit |
| 29 | Calculus: video overlay, LaTeX, copy whole window as markdown | F3 prose figure; overlay in F3/§6 | PARTIAL: the overlay is not in §8 |
| 30 | premade "Figure ..." body text, rows combined | F3 prose figure | OK |
| 31 | built-in markdown journal "throughout the app" | brief 3 TO NOTEBOOK | MISSING from §8 (paste only in 0.4.0) |
| 32 | same for Dynamics, Meters, Wigner, Radiation | F3 | PARTIAL: only CALCULUS is upgraded; md copy for the rest is brief 3 |
| 33 | Calculus like Radiation, 2-3 narrow columns | F3 tiles | OK |
| 34 | rename slice to PLANE? | R-W3 | OK |
| 35 | Shadow / Orbit / Slice overlays as informational layers; move the text | F3, §6; §8 `setEdit` | PARTIAL: overlays not in §8, text-move is |
| 36 | somewhat realtime via the power button | R-W6 (status quo) | PARTIAL: proposes no change |
| 37 | use the Display setting, not MIR options | F2 STAGE TEXT row, R-I1 | OK |
| 38 | NACRE: user friendly through the rack window | F1-F5 "where" lines | PARTIAL: the ATOMS table is two hops deep |
| 39 | NACRE: no FPS stutter, reuse machinery | B3, §8 in/out table | OK |

---

## 3. THE FIRST TEN MINUTES (Opus's A6 walked against DRAFT 2: where it breaks)

**A control that is not there**
- RPA / TDA / kick / run are unreachable on a first run (W1), and they are what the README sells.
- ATOMS is two hops away: SPECTRUM (folded under a molecule) › HAMILTONIAN › ATOM. D2 never gives it a "+" / WINDOW entry. The
  periodic table is his loudest layout ask; give it a "+" row.
- PAN has no on-screen seat but two knobs in CAMERA (the pad is 0.5.0). Alt-drag is the window-move chord on KDE / XFCE (check
  Josh's desktop) and Alt+←/→ is browser Back / Forward on Windows / Linux: verify `preventDefault` holds in Firefox before
  registering them (D2:281-282). On iPad the two-finger pan sits beside pinch, which today tracks only span
  (`stage-gestures.js:72-75`), so every zoom will drift the picture; the only undo is RESET VIEW (it kills orbit and zoom too) or PAN HOME.
- VIEW becomes four segments (DENSITY ORBITAL Δρ VALENCE) beside the ORBITAL knob in one 274 px row (`chemview.js:112-119`), and
  r0 already holds ON + MOLECULE + BASIS (`:76`): the page turner adds a fourth. The hand law is no wrap. Make VALENCE a switch on DENSITY.
- Nothing shares the composed shot: links drop the molecule and the shift (W4).

**A step that needs a download**
- Every BIO entry from alanine (37 AO) up is past benzene's predicted time, so record-only: the first tap is a network fetch;
  offline the row says DOWNLOAD and nothing says progress or failure. "Benzene opens instantly" is true from the second open.
- The record store is decided before its premise is measured. If the S0 re-time puts ground-state solves up to ~64 AO under ten
  seconds on the M5 (1.0 s at 36 AO becomes ~10 s at 64 by nAO⁴ [mine]), 16 of the 20 amino acids need no download. Gate S4a's UX on
  that number; records then accelerate rather than gate.
- `navigator.storage.persist()` prompts in Firefox (Chromium decides silently): ask on the user's first INSTALL press, never at boot.
  In a Safari tab an installed section vanishes after seven days without a visit: a teacher's prepared class does not survive a holiday.

**A sentence he cannot read**
- The dial writes `val.textContent = fmt(v)` (`kit.js:181`): no sub markup, and Unicode has no subscript g. `3σ_g`, `2σ_u`, `1π_u`
  would print a literal underscore. Fix the plain form (`3σg`, `1e₁g`) for dial and canvas; subscripts only in DOM / KaTeX.
- Molecules whose point group has no table print indices throughout (all-or-nothing). Cubane and Cr(CO)₆ (O_h), ferrocene (D₅d / D₅h),
  B₁₂H₁₂²⁻ and C₂₀H₂₀ (I_h) are not among "the five remaining tables" (D2:185): the showpieces get no names.
- `WINDING · 1e₁g (a) + (b)`: (a) / (b) needs a hover sentence for a visitor ("the two real combinations of the degenerate pair").

**A thing that feels like 0.3.3**
- Glass, racks, transport and CAMERA are unchanged; the pad, springs, leader lines and layers are 0.5.0. All that is new hides behind
  MOLECULES OFF (folded on phone / tablet, LWAVES-AUDIT A.1): a new visitor sees the hydrogen register and one line of KaTeX. One demo
  (N₂). Ship water and benzene demos too (`lab/demos/*.lambdawaves.json`, the existing PROJECTS demo road, `rack.js:4079`): content, no code.
- Under a molecular owner STATE, SHADOW, ORBIT, VORTEX, PLANE, CALCULUS, LADDER and DYNAMICS are hidden (`moleculeMode`), so S3's upgrades
  and S4's library never share a screen.
- `announce` writes into the formula's node: the formula must return after the ttl, and restore / undo / project open / a modulated
  preset must stay silent (hand presses only), or Ctrl+Z replays banners.
- Capture, loop and video composite the WebGPU readback plus 2-D overlay canvases (`capture.js:489, 728-770`), never DOM text: the
  formula and the fade are invisible to every export the app makes. A teacher's slide has no orbital name.

---

## 4. TWO CENTS

1. **Orbital-only streaming (no χ tile): C₆₀'s HOMO / LUMO, and every big record's orbital view, at any AO count.**
   Where: molecular kernel, kinds 1 / 2 (`field.js:184, 220-241`). The tile exists to feed the density double loop (nAO²/2); an
   orbital is `Σ c_μ χ_μ`, O(nAO), and can accumulate shell by shell with a 256-byte reduction array. C₆₀ (180 shells, ~900 weights
   [mine]) sits inside `MOL_LIMITS` 256 / 8192. It needs a PySCF coefficient record, not a grid road. Engine/app · S-M (measure one
   300-AO dispatch first). Missed because the draft calls the wall "the kernel's", but only the density kind needs the tile, and
   Josh's named milestone could lead 0.4.0. Density and Δρ keep the tiers.
2. **The link carries the shot.** Append `shift` to the CAM section's end and add one tag for `{library id, basis, view, orbital as
   {group, irrep, count}}` (v1 policy allows both, `statelink.js:23-26`; a few dozen bytes under the 2000-character ceiling).
   App · S-M. Missed because both audits read "v1 is frozen" as "no additions", and the names plan's portable orbital key is exactly
   a link-safe orbital id. A teacher posts one link: "1b₁ of water, framed in the gap".
3. **Zoom to the cursor / pinch centroid, through the shift.** `shift' = c − (c − shift)·dist/dist'` (uv units; c = cursor or finger
   centroid; sign per the convention W2 fixes) keeps the world point under the hand still on wheel and pinch. Where:
   `stage-gestures.js` wheel + pinch. App now, kit gesture law (brief 1) later · S. Missed because pan and zoom are specified apart;
   with a centred pivot this was impossible, with a shift it is one line, and it turns the iPad's pinch drift into the maps behaviour
   people expect and teaches pan by doing.
4. **Caption in capture.** Draw one plain-Unicode line (`H₂O · 1b₁ HOMO · STO-3G`) into the capture overlay canvas so PNG, loop and
   video carry the name. Where: `capture.js` overlay path. App; brief 6 replaces it at 0.5.0 · S. Missed because FIGURE was cut for
   needing the envelope and intake, but a caption needs neither, and the DOM formula (F2) never reaches an export.
5. **One grid, two mounts: the periodic table is also the library's map.** Mount the ATOMS grid builder a second time in MOLECULES as a
   filter: lit cell = number of library molecules containing the element, tap = filter the picker, a dark cell = what the diversity
   gate wants next. App now, kit `cells` (brief 4) later · S-M. Missed because the draft makes the table an Xα atom picker and the
   library a `<select>`, while Josh's one sentence puts both in the "cache layouts" bucket; it also makes "as diverse as possible"
   something he can SEE.
6. **Heavier atoms by data, not engine.** Widen the vendored STO-3G from Z ≤ 36 to Z ≤ 54 (I, Xe): the same BSE record widened on
   2026-09-12 (`lab/vendor/bse/index.json`), `MAX_Z = 36` at `molecules.js:41`. Adds HI (30 AO), CH₃I (37), XeF₂ (39), XeF₄ (49),
   I₂ (58) [mine] to HEAVY: Josh's "heavier atoms", literally, with the cap-128 tier. Engine data · S-M, PySCF oracle per entry,
   labelled MODEL (all-electron minimal basis, no relativity). VERIFY FIRST that the BSE lists STO-3G for Z 1-54 (I believe it does;
   I did not check). Missed because "beyond Kr needs new basis data and an ECP" travelled VAULT 7.4 › AUDIT A7 › DRAFT 2
   unquestioned; an ECP belongs to def2-type bases, not to all-electron STO-3G.

---

## 5. THE ONE QUESTION

**Is the bucky-ball this release's finish line (R-L2, today "later, 0.4.1")?** It decides which engine road the largest stage builds
first. S4c (L, a verifier, a two-device frame-time protocol) is a cap-128 tier that cannot reach 300 AO. If Josh's "next milestone"
means this release, the plan slides his named goal behind a stage that does not get there; if the plan flips to "now" with no cheap
road, scope grows by a grid-upload road plus a record importer.

**Recommended answer: yes, for the orbital view.** C₆₀'s HOMO and LUMO from a PySCF coefficient record through the orbital-only
streaming path (§4 item 1, measure first); its density, I_h names and the grid-record road stay 0.4.1; the 128 tier ships for density
at ≤128 AO after the S0 re-time. Runner-up: R-G2 (INFORMATIONAL timing); Josh's own "pre-refactor ... 0.4.0 alpha" nearly answers
it, so it is the less open of the two.

---

## 6. SIGN-OFF

**Ready for Josh as DRAFT 3: yes, with the changes above.** The structure (engine and content now, kit shell at 0.5.0) is sound and I
found no reason to move it. Required in DRAFT 3: W1-W7 (each changes a behaviour or a claim he would rely on) and W14 (he reads it).
W8-W13 are one-line edits. Take the §4 items as additions or list them under "not claimed".

Three lines for the top of Josh's note:

1. 0.4.0 is the engine-and-library release: every orbital gets its textbook name (1b₁ · HOMO), dozens of new molecules from amino acids to ferrocene, a periodic table, a camera that sits off-centre, and stage text in real maths, all on today's MIR.
2. The springs, leader lines, dot-matrix pad and video overlay are 0.5.0: they need MIR 1.5.0 and would be built twice on 1.4.3 (R-G2 lets you trade the date for them).
3. Before we build, three answers: is the bucky-ball this release's finish line (R-L2), may we cut 0.3.3 from Cloud's merged work (R-A1), and who is it for: you, a class, or a Reddit visitor on an iPad (R-U1).
