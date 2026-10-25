# L · P · W · R · T — built (iteration 016, Opus builder for Claude Yan, 2026-10-25)

Rows: L1 L2 L3 · P2 P3 P5 P7 · W1 W3 W4 W5 W6 W7 W9 · R1 · T1. Nothing committed. Pictures are in `l-shots/`.

## What was built

**L1 · THE SEVENTH TILE, ATOM LABELS.**
- `tools/menu-thumbs.mjs --style labels` renders the plain density look (SIGNED · ISO 0.03 · the wheel). It then draws each nucleus' element
  symbol over the picture, before the crop is scaled.
  - The nuclei are `chem.atomsNow()`, placed through the stage's own projection (`field.js toScreen` at the capture's size). The shot proves the
    letters land on the atoms.
  - The letters are tiny: 600 weight at 5 % of the side, so 10 px on the 200 px picture and 5–7 px on a tile. They are white with a dark halo
    and may overlap.
- The catalogue's 96 `<id>.labels.webp` files were written into `lab/img/menu` (393 kB). They are DATA, never precache: `pwa.test` is green and
  the precache list is unchanged.
- The manifest's `variants.molecules` gains `labels`.
- The render ran on my own gate port (9781 / gecko 5781). No VOLUME picture was touched: `~/Documents/LAMBDAWAVES-VOLUMES/**` and ports
  9651/5651 were left alone.
- PREF `look` gains `labels`. THE LOOK DROP now has seven tiles in two centred brick rows (picker.js places each tile over two of eight 33 px
  columns):
  - the wave looks, ρ · arg ψ · Im ψ;
  - over the structure looks, ● · ⊸ · φ · **Aa**.
- Aa is in STIX (it is in the shipped subset). Its hint is "Atom labels · each nucleus' symbol over ρ".
- Aa is greyed on ATOMIC, as BALLS · STICKS · ESP are.
- Arrow keys: ← → walk all seven; ↓ / ↑ move to the brick under or over. Every deck draws the look with 015 M2's fallback law. An element or a
  state has no labels picture, so it shows its one picture.
- Shots: `L1-lookdrop.png`, `L1-labels-deck.png`.
- **Why seven tiles and not six.** The plan says "the sixth seat ● → Aa". Taken literally, that removes BALLS, a look Josh already has. Josh's
  answer to call 2 keeps arg ψ. So the drop holds seven tiles. This is call 1 below.

**L2 · THE WHEEL.**
- `wheelSteps()` in picker.js gives one step per detent:
  - a line or page wheel steps once per event;
  - a pixel-wheel notch (one event of 50 px or more: Chromium's 100, Windows' 120) steps once;
  - a trackpad's trickle steps once per 100 px gathered.
- It steps over the drop and over the LOOK button. It skips the greyed tiles and wraps.
- The Picker's one stepper-shaped picker, the volume's ‹ VOL. I ›, takes it too (`step.step(d)`).
- A wheel pick is the reader's pick, so it writes `look` (P3).

**L3 · THE 140 ON ONE PAGE.**
- The HYDROGEN deck is no longer a pager. It is one `.mm-table.mm-htable` grid of 14 columns × 10 rows in BASIS order, built at its first
  showing, its pictures lazy.
- The tile is the periodic cell's `--t` while the height allows ten full rows; the table holds 9.35:
  `min((100vw − 64) / 18.6, (100dvh − 300) / 10.25)`.
- Each tile carries its STIX label (`3p₁`), centred at its foot. SHOW LABELS still governs it.
- At 1600 × 1000 there are 140 tiles, all on screen, 60 px each (a periodic cell is 62.5 px), and no arrows (`L3-hydrogen-140.png`).
- **No re-render was needed.** menu-thumbs already crops every picture to its own alpha box (8 % margin), so each state already fills its square.
  The new `tools/tile-check.mjs` FILL check measures all 420 orb pictures at **0.890 … 0.910 of the side (mean 0.906)**: 1s reads as large as
  7f. Re-rendering the set would have spent ≈ 70 min of the shared GPU to change nothing. tile-check now fails any picture under 0.8.

**P2 · THE DENSER CHOOSER.**
- The ‹ MOLECULE › open list is the platform's own `<select>` popup, not the kit's list pane. One unlayered lab.css rule sets its options to
  11 px, line-height 1.25 and no padding (Firefox: ≈ 24 → ≈ 20 px rows).
- **Not a kit change.** The plan expected one in the kit's list pane, but the pane is not involved.
- A native popup cannot be screenshotted headless, so the row height is not measured. A browser that ignores option styling (Chromium) keeps its
  own rows.

**P3 · DEFAULT LOOKS.**
- `PREF0` no longer carries `look`. `lookFor(atomic)` returns the reader's pick, else Im ψ on ATOMIC and arg ψ on MOLECULAR, a volume and the
  CSB search.
- A pick writes `look` and `lookHand: true`.
- A pre-016 record's `look: 'density'` without `lookHand` is read as no choice: PREF0 used to write it on every hue or labels save. Any other
  stored look wins.
- An element or state reads Im ψ (its one picture); a molecule reads `<id>.phase.webp`.

**P5 · ABOUT.** Edited in `lab/shell/notebook.js`, which is not in my owner list but is where ABOUT lives.
- The wordmark `lab/img/lambdawaves-logo.svg` is inlined at 368 px wide, its word in the ink and its pink λ and green dot kept. If the fetch
  fails, the old title clone comes back.
- The MIR page's mark is 34 px (`.ab-mir { --gui-logo-h: 34px }`; the kit's default is 92).
- The `i` button cycles λWAVES ABOUT → MIR ABOUT → close. "Close" returns to the notes when the window was showing them, else it shuts the
  window.
- **Not a kit change.** The app drives its own λWAVES | MIR seg; the kit's `aboutPage` is unchanged.
- **Josh's "new logo" file is not on this machine.** The existing svg (2026-10-16) is used. Drop the new file in place under the same name and
  nothing else changes.
- Shots: `P5-about-lw.png`, `P5-about-mir.png`.

**P7 · A BACKGROUND PICK TURNS IT ON.**
- A SETTINGS stage-colour pick already left FOLLOW THEME. Now, when STAGE sits at its near-theme rest (≤ 5 %; a first run is at 4 %), the pick
  also takes STAGE to 100 %. A knob the hand set higher keeps its blend.
- If STAGE is routed, the base moves through `modHand`.
- Measured: a pick of #203060 gives `mat.bg` = [0.125, 0.188, 0.376].

**W1 · TINT UNDER THE WORDS.**
- `lab/shell/ink.js tint()` runs inside `refreshOcclusion`, which every window move or fold already reaches. A rack or floating card whose box
  meets a line of the stage words (`.mir-info.lw-stage .mir-info-text`) gets `data-tint`, but only with FROST off and the interface shown.
- A childList observer on the words layer dirties the block when the words come or go.
- skin.css paints a tinted card with the menus' own tint, `var(--glass-sheen), hsl(var(--glass-tint) / .65)`: the whole card, or under
  DISCONNECTED its head and its body.
- **Not a kit change.** It is app CSS; MIR OPTIONS is unchanged.
- Measured: SETTINGS floated over "H₂O" got the tint (rgba(233, 237, 241, .65)); with FROST on, none (`W1-tint-under-words.png`).

**W3 · THE EDGE HANDLE ON TOUCH.** `first-run.js FIRST_RUN_MATERIAL` gains `handle`: desktop `'never'`, phone or tablet `'always'`.
`rack-wiring.js` hands `FIRST_RUN.handle` to `createRack`; it was a hard-coded `'never'`. `first-run.test` is green (13/13).

**W4 · 60 | 120 HZ → SETTINGS › QUALITY.**
- SETTINGS › QUALITY gains `ui.cadSeg` MODULATION 60 Hz | 120 Hz, beside GOVERNOR. It calls `mod.setCadence`, and the kit's record keeps it.
- `lab/mod-port.js` hands the window `cadenceKey: false`, so the modulation window's work bar now reads TAP · WALL · HOLD ¼ · HOLD 1 (measured).
- The CSB expander's tempo panel showed a 60 Hz key too. transport.js no longer hands `cadence` to `barMod`, so the panel shows TAP · WALL ·
  ÷2 · ×2 · ×4 · HOLD ¼ · HOLD 1 (`W6-expander-grows-up.png`). The cadence has one home.

**W5 · THE MAGNET CYCLES.** `lab/shell/modulation.js cycle()`.
- When the TIMELINE opens with the modulation window open, or the window opens with the TIMELINE open, it compares the two heights plus the
  stack's 8 px against the stage's usable height. That height is the canvas less the menubar seat (52) and less the CSB on the stage (its
  height + 12).
- If they do not fit, opening one closes the other. This covers the CSB latch, the door, a key or a menu.
- A stage that holds both keeps 015 T5's magnet.
- Measured:
  - at 1600 × 820 and 1600 × 1000, either order leaves one window (`W5-magnet-820.png`);
  - at 1800 × 1500 both stay, stacked (`W5-magnet-1500.png`).
- `tests/hide-reveal.browser-test.mjs` opens both on purpose, so its window went from 1500 × 900 to 1500 × 1400 (one number, commented). It is
  GREEN.

**W6 · THE EXPANDER'S DIRECTION.**
- On the stage, wide screens only, a CSB not `.at-top` puts the expander in the grid's first row (`grid-template-areas: "panel …" "play mid
  tempo"`). At the foot the bar's rows stay where they were and the panel rises above them. At the top it hangs below as before.
- Measured (csb-probe): opened at the foot, the bar's bottom stays at 854 px (top 752 → 515.5).
- **Not a kit change.** The plan expected one in `tempoPanel` side, but λWAVES' CSB grid is app CSS.

**W7 · THE HAMILTONIAN RE-LAYS ONCE.**
- `windows/spectrum.js hamShow` writes the rows only when the set shown changes; both the stepper and the operator's listener asked. The body's
  height glides from old to new in 160 ms. Reduced motion, a folded group or a hidden card switch at once.
- Frame by frame over four ‹ SYSTEM › turns, the shown rows went BOX (116 px) → ATOM (104) → none (52), with no intermediate frame. The turn
  never showed a wrong set, so the jump in height was the only "flash" left.
- rack-deps: spectrum is still at 25, the HINGE HOLDS.

**W9 · UNIQUE NAMES.**
- `user-presets.js uniqueName(name, taken)` is exported. `add()` now appends `name 2`, `name 3` … and returns the name kept; it no longer
  overwrites.
- SPECTRUM's save (`lab/spectrum.js`) uses the returned name.
- **PALETTE's save is material.js, which I may not edit.** It must read the name the same way; one line for its owner, at material.js ≈ 227:
  `palShown = PU + uniqueName(n, palUsers.list().map((x) => x.name)); palUsers.add(n, …)`.
  Until then, a PALETTE re-save under a taken name stores `name 2` but shows the old `name`.

**R1 · THE REGISTER'S FOOTNOTE.**
- The law line under SPECTRUM's ladder and MOLECULES' ORBITAL and STATES ladders was painted into each canvas, so a CSS rule could not hide it.
  `paint-stroke.js footLine(cv)` makes it a DOM `.reg-foot` beside the canvas, laid over the old fitText box. orbitalsview.js, statesview.js and
  spectrum.js call it.
- One unlayered lab.css rule hides it until the window is hovered or focused: opacity 0 → .8. Under reduced motion there is no fade.
- Measured: opacity 0 at rest, 0.8 under the driver's real pointer (`R1-foot-rest.png`, `R1-foot-hover.png`).

**T1 · ONE TIME READER.**
- The timeline's t now wears the modulation window's tempo number face (modhost.css `.m2workbar .tempo-number`): bold 18 px in the numeral face,
  tabular, ACCENT B. Its `t` wears the unit's face, bold 8 px UI.
- The CSB's t wears its own BPM pill's face at the bar's size (bold 13 px, ACCENT B; the unit 7 px).
- Measured: the timeline value reads `650 18px Roboto, tabular, rgb(224, 87, 0)`, the same as the modulation window's tempo number. 015 T1's
  16 ch is kept.
- csb-probe: the bar is still **494.8 px in HYDROGEN and 682 px in MOLECULES** at every t and name (`T1-time-reader.png`).

## Kit changes (for alpha.27 and the FOR-MIR line; the integrator re-hashes)
- `lab/mir/modulation/window.js`: `if (port.cadenceKey === false) transport.cad.remove();`, plus one line in the header's port list. An app that
  seats the cadence elsewhere takes the 60 | 120 HZ key off the work bar.

That is the only kit change. P2, P5 and W6 needed none (see the rows above). `tests/mir-manifest.test.mjs` is red until the re-hash
(window.js `279c3d4e…` vs the pinned `be87e7bc…`).

## Files
- The Picker and its pictures: `lab/picker.js`, `tools/menu-thumbs.mjs`, `tools/tile-check.mjs`, `lab/img/menu/` (96 `*.labels.webp` and the
  manifest).
- CSS: `lab/skin.css`, `lab/lab.css`.
- Windows and shell: `lab/shell/notebook.js`, `lab/shell/ink.js`, `lab/shell/modulation.js`, `lab/shell/transport.js`,
  `lab/shell/rack-wiring.js`, `lab/windows/spectrum.js`, `lab/windows/settings-card.js`, `lab/first-run.js`, `lab/mod-port.js`.
- Presets and ladders: `lab/user-presets.js`, `lab/spectrum.js`, `lab/orbitalsview.js`, `lab/statesview.js`, `lab/paint-stroke.js`.
- The kit: `lab/mir/modulation/window.js`.
- Tests: `tests/hide-reveal.browser-test.mjs` (H0), `tests/picker-looks.browser-test.mjs` (new: P3 · L1 · L2 · L3).

## Gates
- **THE LOCK** (`tools/perf/digest-lock.mjs --check --query gastab=0`): **843 values · 0 differences**. With the s4a fixture: **987 values ·
  0 differences**. Page errors 0 both times.
- `bash test.sh node`: every suite is GREEN except two failures that are not this chain's rows:
  - `tests/mir-manifest.test.mjs` is red for this chain's one kit edit (window.js). It needs the integrator's alpha.27 re-hash.
  - The flash-routes suite prints PASS, then dies on `ReferenceError: document is not defined` at `lab/mod-port.js:138`. That is
    `routeDots`' `setInterval`, from **W8 (another builder)**, firing after the node test ends. It needs a `typeof document` guard, or a
    clearable interval.
- `tests/pwa.test.mjs`: rewritten with `--write`, then PASS.
- `node tools/rack-deps.mjs --classes --no-write`: the HINGE HOLDS (spectrum 25 of 25, 0 bare writes).
- `tools/tile-check.mjs`: 118/118 elements; THE 140 at 420/420 pictures; THE FILL 0.890 … 0.910.
- Browser suites (my gate port 9781, gecko 5781):
  - `hide-reveal` GREEN (5 sections; its window is now 1400 tall, see W5);
  - `timeline` GREEN 14/14;
  - `mir-controls` GREEN;
  - `picker-looks` (new) GREEN (P3 · L1 · L2 · L3).
- `tools/csb-probe.mjs`: the stage bar is 494.8 px in HYDROGEN and 682 px in MOLECULES at every t, name and expander state; FREE 280; RACK 262.
- Diagnostic driver: `.tmp/l016/shots.mjs` (scenes picker · about · tint · time · misc · r1 · w7 · magnet). It is scratch, not committed into
  tools/.

## Not done, and why
- The VOLUME's `labels` pictures. c8 owns dist/. When it ends, the night job can run
  `node tools/menu-thumbs.mjs --volume vol-1 --style labels --out <scratch>`; the volume road now draws the letters too.
- A measured row height for P2: a native popup is not screenshot-able headless.
- PALETTE's half of W9: material.js is another builder's (the one line is above).
- The new λWAVES logo: the file is not on this machine.

## Calls for Josh
1. The LOOK DROP has **seven** tiles (Aa beside ● ⊸ φ), not six with BALLS removed. Say if BALLS should give its seat to Aa.
2. W5: with the measure used here, a 1600 × 1000 screen already cycles. Your words "two at once is too much even on a large screen" could also
   mean **always** cycle; that is a one-line change (`cycle()` returns true whenever both are open).
3. The labels picture is a fresh render of the density look. It is a little different from the older shipped ρ tile, which was rendered before
   008 Q's KNEE 3.
