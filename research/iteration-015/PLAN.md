# ITERATION 015 — THE SECOND LOOK (planned by Claude Yan, 2026-10-23; Josh: "ULTRATHINK")

BASE: `yan-c` @ `35bba6e` (iteration 014 closed). NOT pushed. Picture Josh sent: `refs/spectrum-below-picker.png` (SPECTRUM's HAMILTONIAN
group as it stands — ‹ HYDROGEN › over WELL RADIUS · Z · μ, the POSITRONIUM / MUONIC seg, ELEMENT Z, GAS σ, GAS BASIS, GAS |k| · LAUNCH ·
COHERENT BOUNCE, SCALE, λ SCALE: about 600 px of rack under the picker).

Everything standing stands: the kit MOVES HERE under the trickle-down rule (`lab/mir/version.js` → **1.5.0-alpha.26** for all of 015; one line
per kit change at the top of `docs/FOR-MIR.md` under a new `## FROM λWAVES, FOR THE KIT (1.5.0-alpha.26)` heading; `manifest.py` re-hash;
`lab/fonts/**` untouched), THE LOCK never re-baked, no push / deploy / tag, the solvers RUN (2,661 of 8,984 left on 10-23 17:30: never touch
raw/ catalogue/ dist/ or their pids; the GPU is theirs at 100 % — a timing number is never a gate, a divergence is re-run alone).

## JOSH'S PROMPT, VERBATIM

# 015

## MAIN ISSUES
- I noticed that switching to ESP make is unclickable or hard to rotate/zoom via mouse controls.

## MAIN MENU
- Make the orbital view modes for p, im, balss, sticks, ESP, to be math fonts for their buttons.
- Let the orbital view modes work for the periodic table, library and molecules (base library)
- Have a main menu, full screen mode of the folder. This way, hitting folder does not take it to the stage. (This is it's new 3rd view)
- New ordering of the rows from top to bottom: Logo (a little bit bigger), Atomic, molecular, etc. Row, and then Home Folder, and Hue. Add a 4th button that shows a fancy drop down (not a classic drop down but one that shows a 2x3 layout of buttons that let you choose p, im, balls, etc.) that is center aligned and is allowed to overlap the main menu.
- Show 2 volumes, Vol. I and Vol. II but show that one is WIP.
- The color behavoir of the hue icon is that it's grey like the rest but then mouse over shows the colors avail.
- In atomic mode, it should show options to pick 'hyrogen' and the periodic table 'atoms'. Do the same love with the thumbnails for the periodic table and show every single possible 140 and their wave variants. The labels should be easier as it shouldn't show the 'z' number but rather just the orbital name like 3p or 5d.

## TIMELINE
- Timeline time should not be a math font (For BASINS it was fine because it's just a decade zoom reader in a math font but here, we can use a sans serif font that's smaller.)
- Use a font that doesn't adjust in length much. I think it's called fixed kerning? Idk,

## INSPECT HIDE AND REVEAL
- Inspect all the hide and reveals work on *your* judgement. We've added multiple different kinds of hide and reveals and reorginazion
-  Stage labels don't have to move around the modulation window and timeline. they can be sent under.
- Hitting the modulation button on the timeline and the timeline button on the modulation window should swap between them. The CSB can allow them to be called both on the screen and magnet/stack on top of each other
- When multiple fast multiwindow switching happens, everything sort of fails to keep up.
- Check the rack windows auto-hide features
- inspect the full UI hide 'H' function
- Let mouseover control hints not get cropped over any CSS errors
- Inspect all the collapses and see if they work properly
- I think there was a complete error on the title bubble... Claude asked me 'The bubbles are supposed to be outside of the window title bar right?' And I said 'yes it's correct'.... but then wen the opposite way and made it draw exactly over the title bar? I said to make it further away not completely do the opposite. Idk what my wording was but I mean 'Do not let the bubble touch or overlap the rack window'

## CSB
- Remove the DJ buttons and refine the DJ buttons on the tempo/power button bar on the modulation window. Refine the old buttons (the DJ buttons are super old and need updating to the new MIR standard)
- Modulation window's icon is super weird, I just asked for a simple sine wave. with a crest and peak.
- Try not to let the base CSB (not expanded) bar not move around or resize too much. Have it be strongly fixed having and only changing majorly if switching between hydrogen and molecules.

## SPECTRUM WINDOW
- Everything below the 140 orbital picker is a mess. I want it more compact. Bonnus points if it shortens the height and be able to hide that section with a expander toggle.
- Needs a better icon (also for molecules registry) for fill all orbitals because user's can't tell which clears all and fills all. And the control mouseover hint should reflect that clearly.
- Move the preset thing to the bottom between the 140 picker and above the Hamiltonian. It is not included in the expander.
- Similar to Palette, shorten the preset window and add a save orbital (so that it just saves which orbitals were selected and that's it). Do the same 'User' section appears when a custom preset is saved.

## WAVE
- The new 'BALLS', 'STICK', and 'ESP' options show new knobs... Allow the knobs to be dynamically shown
- If Palette is on; let it override the 'heat-map' color of the ESP to use the palette's current preset. Don't let it be a button for 'Use palette' as it should already use the palette if it's on. Palette off will change to the regular heatmap.

## PALETTE
- I think the request with align color strips right and text left for the preset dropdown menu wan't honored. I don't want the colorstrips to be randomly shifted left and right across the list. **Align** them. Add a gap between the text if need be
- Create a new icon for 'reverse' to be counter pointing pairs of arrows.
- Shorten the width of the preset bar to fit in a floppy disk icon to save presets. It can belong in the same dropdown menu, at the very top, it will say 'User' (but don't show it if the user didn't save any yet; the drop down should be as is; only showing user when a user finally saves a palette preset). Let it be just a save icon and not a button background/CSS. (similar to the modulation window's save button)
- ESP range seems to be not strong enough. could I have a stronger/wider range? and perhaps the two mid points between blue and green and green and red should be logarithmic? So that it doesn't look like just red and blue with super tight bands of green.

## WHERE EACH ITEM LIVES (read by three scouts on 10-23; file:line at `35bba6e`)

- THE ESP STALL. `.lw-espbar` is `pointer-events: none` and not UI space (lab.css:1058; rack-wiring.js:345) — it cannot take a click. The
  Poisson pass `encodeEsp` (field.js:1593-1630) runs from `field.frame` on a key `generation:atomsV:half:res`; LIVE off still re-solves on a
  new density once a second (:1596), 768 SOR dispatches at M = 128 (:1621-1626), measured 260–470 ms on palmitic acid (B3-BUILD.md:23-26).
  With the clock playing the density's generation moves every frame, so the pass fires at 1 Hz with LIVE OFF — the stall. The ESP surface is
  also ray-traced per pixel over every atom (`espPixel` :774-814, dispatched :852). No frame budget, no governor row names ESP.
- THE PICKER'S HEAD (picker.js:101-134): `.mm-top` = `.mm-logo` (44 px, skin.css:679) → `.mm-nav` (HOME · FOLDERS · HUE ring, :107-112) →
  `.mm-looks` (ρ · IM · BALLS · STICKS · ESP, inserted before the tabs, PREF `look`, :131) → `.mm-tabs` (:113) → `.mm-opts` (SHOW LABELS, the
  volume search). The LOOKS row re-fetches only `img.mm-pic[data-mol]` (volume tiles, :136); ATOMIC tiles are `img/menu/el-<sym>.webp`
  (:259) and catalogue tiles `img/menu/<id>.webp` (:284) with no variant; `tools/menu-thumbs.mjs --style` refuses to write into
  `lab/img/menu` (:41-45). lab/img/menu holds 118 `el-*`, 37 `orb-*`, 96 molecules. FOLDERS (:110) closes the Picker and opens the kit's
  floating FOLDERS window on the stage (projects.js:220-224). The shelf draws every listed volume (:424-430), the WIP pill is C4's
  `span.mm-vol-wip` (:410); `dist/volumes.json` lists vol-1 alone (5,954 molecules, 4.2 GB — under the 5.25 GB cut; the live pack runs
  `--sole`, finish-c7.sh:11). THE HUE ring is the full conic wheel at opacity .85 (skin.css:841-846), not grey. No HYDROGEN | ATOMS choice.
- SPECTRUM (lab/windows/spectrum.js + lab/spectrum.js): body order is ladder · PRESET (`.sp-preset`) · `.sp-head` (DIALS · +MODE · fill ·
  VISUALS) · `.sp-cap` · `.sp-rows` · the 140 picker · HAMILTONIAN [`rh` system + WELL/Z/μ/seg/ELEMENT Z; `rg` GAS σ · BASIS · |k| · LAUNCH ·
  BOUNCE; `rs` SCALE seg · λ]; the group is the kit's plain `group()` — no fold, no `data-fold`. `fillButton` (paint-stroke.js:77-87) is one
  rounded rect with solid vs dashed rungs, hint from spectrum.js:61; shared with the register. PRESETS are static (state.js:509); no user save.
- TIMELINE's t: keys.js:171-174 `ui.tlTime`, face skin.css:928-931 — `var(--font-math)` italic 18 / 26 px. The CSB's t inherits Roboto, 13 px.
- THE MODULATION WINDOW's bars (lab/mir/modulation/modwindow/modwindow.js:527-631): `.m2workbar.m2pre` = power · RATE · BPM · TAP · WALL/FREE ·
  60/120 HZ · HOLD ¼ · HOLD 1 ("the DJ buttons"); `.m2prebar` = ▾ PRESETS · save glyph · name · ‹ › · dead light · workspace switch — all legacy
  `m2*`/`mod*` classes in modhost.css, none the kit's `.tbtn` seats. Doors: the mod window's switch SWAPS (modulation.js:254 closes mod, opens
  TIMELINE); the timeline's door only toggles the mod window (no `onSwitch`, timeline/window.js:93) — no swap that way.
- THE CSB's size (lab.css:322 `width: max-content`): `.ro.time` `flex: 1 1 auto` widens with its text; `.mol-pick` 160–240 px and hidden under
  HYDROGEN (lab.css:361); the expander adds a row. `#transport.mini` keeps `contain: layout paint` (skin.css:435).
- THE PILL (rack-scrollbar.js:77-111, rack.css:110-121): on the title bar, over the name, from the eyebrow's left to the first head button.
- STAGE WORDS `avoid` (stage-words.js:166-183): the racks, the undocked transport, the open TIMELINE; z 20 under `#floats` at 32.
- HIDES: H = `toggleUI` (keys.js:211-218, `body.ui-hidden` hides racks, transport, #floats, menubar, title, #lwMode, notebook, pills); the rack
  hide is ◧ / B → `body.rack-hidden` with the edge peek (rack.js:826-851); there is NO auto-hide in the repo. Hints are `#controlHelp` fixed at
  z 10000 (control-help.js:54-79) — never cropped by overflow; the risks are `contain: paint` on `#transport.mini` and every `.dev`.
- SWITCHING: one STACK, synchronous raise (window.js:113-148); `presence()` WAAPI with `fill: forwards` (motion.js:158-175); `modDodge` chains
  two CSS animations with 220 / 400 ms timeouts and DROPS dodges while `trMoving` (modulation.js:202-239).
- PALETTE (material.js:150-176): `palPick` adds `lw-menu pal-pick` and an `i.pal-strip` (72 px, `margin-left: auto`) per row; REVERSE is the
  kit's text trig (ramp.js:154); `createRampPanel` takes fixed `o.presets` (ramp.js:106-122) — no user store anywhere in the kit.
- WAVE (material.js:48-101): SIZE · RADIUS · PROBE · RANGE on `wave-row-7`, ISO/SAS/SES · USE PALETTE · LIVE · SLOW on `wave-row-8`; both rows
  hidden unless an atom style, dimmed by `setDisabled` per style (`atomDrawSync` :81-93); ISO · GRAIN · KNEE · SOFT · EXPOSURE · HUE always shown.
  `espColour` (field.js:767-773): u = ½ + ½·clamp(φ/RANGE), linear; USE PALETTE samples the whole LUT cyclically (`fract`, :769) and never
  reads whether PALETTE is on (`V.p2.z`); the standard ramp is five stops at u·4. palette-app.js:34-37 ESP_RAMP and the ESP row (magenta .9).

## THE CHAINS (one builder each, in parallel; ports M 9591 · T 9601 · H 9611 · S 9621 · W 9631)

### CHAIN M — THE MAIN MENU (`lab/picker.js`, `lab/skin.css`, `tools/menu-thumbs.mjs`, `lab/volumes.js`, `tools/volumes/pack.mjs`, `lab/projects.js`)
- **M1 THE HEAD.** Under a bigger logo (44 → 56 px): row 1 the tabs ATOMIC · MOLECULAR · LIBRARY; row 2 four round buttons HOME · FOLDERS · HUE ·
  LOOK. LOOK opens THE LOOK DROP: a centred 2 × 3 pane of tiles over the menu (`.mm-lookdrop`, the `.lw-menu` surface, the Gol note's spring),
  not a native select — ρ · arg ψ · Im ψ / BALLS · STICKS · ESP — every label in the math face (STIX): `ρ`, `arg ψ`, `Im ψ`, `●`, `⊸`, `φ`,
  the word as its hint. The `.mm-looks` row is gone; PREF `look` gains `phase`. Escape or a press elsewhere closes it; the current look is lit.
- **M2 THE LOOK EVERYWHERE.** The look rules every deck: a catalogue MOLECULAR tile reads `img/menu/<id>.<look>.webp`, an ATOMIC tile
  `img/menu/el-<sym>.<look>.webp`, a HYDROGEN tile `orb-<nl>_<m>.<look>.webp`, a volume tile `t/<id>.<look>.webp` (B4). `menu-thumbs.mjs
  --style <look>` learns `phase` and WRITES into `lab/img/menu/` (the refusal lifted for the catalogue; the volume road keeps `--out`), and the
  builder renders the catalogue's 96 × 5 and the atoms' 118 × 2 (ρ is the file that exists). BALLS · STICKS · ESP are greyed on the ATOMIC
  deck with the hint "a lone atom" (its ESP is a monopole). A missing variant falls back to the one picture (the law since B4).
- **M3 ATOMIC MODE.** The ATOMIC deck's head carries HYDROGEN | ATOMS (`.mm-opts`' seat, beside SHOW LABELS). ATOMS = the periodic table as it
  is, its label the symbol alone (`.mm-z` gone). HYDROGEN = THE 140: a tile per (n, l, m) label in SPECTRUM's order, ≥ 8 across and paged, its
  label the state's name in STIX — `3p` large, `−1` as the subscript (`labelOf`'s name) — its picture the pure orbital (the Q3 recipe,
  `orb-<nl>_<m>.<look>.webp`, 140 × 3 rendered); a press opens HYDROGEN mode (MOLECULES off, SPECTRUM's system HYDROGEN) with THAT label
  alone populated through `loadPreset`'s road as a hand's pick. Caption under hover: the name over `n ℓ m`.
- **M4 FOLDERS IN THE MENU.** FOLDERS is the Picker's own full-screen page (`.mm-page[data-deck="folders"]`, THE THIRD VIEW beside the three
  decks): the kit's gallery mounted inside it (`mountGallery`, as the `projects` rack card does, sized to the space), DEMOS first (`demosFirst`),
  the toolbar SAVE · PROJECT · DUPLICATE · NEW, RESTORE THE DEMOS in the foot. The Picker stays up; an OPEN the adapter took closes it (`landed`).
  O, WINDOW › FOLDERS and the stage keep the floating window.
- **M5 THE SHELF SHOWS TWO.** `pack.mjs --wip` writes the NEXT volume's shelf entry as soon as the cut rule names one — and, with `--next II`,
  a placeholder `{ id: 'vol-2', numeral: 'II', wip: true, count: 0 }` while VOL. I is still under the cut — so the shelf reads VOL. I and
  VOL. II · WIP; the Picker's card for a zero-count WIP volume says FILLING and offers no INSTALL. Dry: a scratch shelf proves the two cards
  (the dev symlink is the live dist — never written); the live pack (Josh's run, after the queue) makes it real.
- **M6 THE HUE BUTTON.** Grey at rest like its neighbours (`filter: grayscale(1)`, opacity .55), the wheel's colours on hover, focus and drag.

### CHAIN T — THE BAR, THE TIME, THE MODULATION WINDOW (kit alpha.26: `lab/mir/modulation/**`, `lab/mir/timeline/**`, `lab/mir/shell/transport.js`; app `lab/shell/{transport,modulation,keys}.js`, `lab/lab.css`, `lab/skin.css`, `lab/img/icons/modulation.svg`)
- **T1 THE TIME.** The timeline work bar's t in the UI face: `--font-ui`, tabular lining numerals (`font-variant-numeric: tabular-nums` — the
  "fixed kerning"), 13 px label / 18 px value, upright; the same on the CSB's t (already Roboto; tabular added, a fixed `min-width` in ch).
- **T2 THE MODULATION WINDOW'S BARS.** The tempo / power bar and the preset bar redrawn on the kit's seat standard — the `.mir-transport`
  `.tbtn` 40 px seats, the kit's labels through `label()`, the frost family — keeping every function (power, RATE, BPM, TAP, WALL | FREE,
  60 | 120 HZ, HOLD ¼ · HOLD 1, PRESETS ▾ · save · name · ‹ › · dead · the switch); the legacy `m2*`/`mod*` CSS for those bars retired from
  modhost.css. This is the kit's: FOR-MIR line, version bump, manifest.
- **T3 THE ICON.** `modulation.svg` = one sine period, one stroke, a crest then a trough (`M3 12 C6 4 9 4 12 12 S18 20 21 12`), no ghost strokes.
- **T4 THE FIXED BAR.** The CSB's stage geometry is pinned: one width per mode (MOLECULES with the chooser, HYDROGEN without — the only major
  change), `.ro.time` a fixed `width` in ch with tabular numerals, the chooser a fixed 220 px, the BPM number tabular, the expander never
  changing the bar's width (it hangs below). A probe measures the bar's rect through play · pause · a long t · the expander · each mode.
- **T5 THE DOORS.** The timeline's door SWAPS (`onSwitch` on the kit's door: the TIMELINE closes, the modulation window opens) as the mod
  window's switch already does; from the CSB the TIMELINE latch and the MOD door open each without closing the other, and with both open the
  modulation window MAGNETS: its bottom edge seats on the timeline's top edge (`lab/shell/modulation.js`, beside `modDodge`), following when the
  timeline opens under it or docks; dragging the mod window away releases the magnet until the next open.
- **T6 FAST SWITCHING.** A driver opens / closes / swaps the TIMELINE, the modulation window and two rack windows 30 times in 3 s and counts
  what is left wrong (a `hidden` out of step with its presence, a dodge dropped, a transport left mid-move, an occlusion mask stale). Fix what it
  finds — the likely rows are `modDodge`'s dropped dodges while `trMoving` (queue the last one instead) and `presence()` reversals.

### CHAIN H — HIDE AND REVEAL (`lab/mir/shell/rack-scrollbar.js`, `lab/shell/stage-words.js`, `lab/shell/keys.js`, `lab/mir/shell/rack.js`, `lab/fold.js`, CSS)
- **H1 THE PILL OUTSIDE.** The scroll pill never touches the window: it floats beside the card over the STAGE side at the title bar's height,
  8 px clear of the card's inner edge, a small tail pointing at the window, the name whole (no truncation — the stage has the room); the accent
  and the 900 ms linger as A6; "the tip at the scrollbar" is dropped (it cannot be both outside and at the outer edge). Josh's words: "Do not
  let the bubble touch or overlap the rack window". FOR-MIR line.
- **H2 THE WORDS UNDER.** The stage words no longer dodge the TIMELINE or the modulation window (`avoid` keeps the racks and the undocked
  transport); they stay at z 20 under `#floats`.
- **H3 THE AUDIT.** One table in `H3-BUILD.md`, each row tried in the browser and fixed where wrong: H (every surface hidden and restored — the
  FREE transport, the CSB, the pills, frame and axes come back); the rack hide ◧ / B and its edge peek on both racks and the CSB's peek; every
  fold (`data-fold` presses: MOLECULES more, SHADOW details, CAMERA, INFORMATIONAL's seat chevron, SPECTRUM's shells, the new HAMILTONIAN
  expander when S lands) opening, closing, surviving a resize and a restore; the hover hints never cropped (`contain: paint` on
  `#transport.mini` and `.dev` — a hint born inside either is moved to the body layer or the containment narrowed); every collapse's chevron
  pointing the right way. There is no "auto-hide" in the repo: the report says so and names what Josh may have meant (the rack hide + peek).

### CHAIN S — SPECTRUM (`lab/windows/spectrum.js`, `lab/spectrum.js`, `lab/paint-stroke.js`, `lab/state.js`, new `lab/user-presets.js`)
- **S1 THE COMPACT HAMILTONIAN.** Below the picker the group folds behind an expander (`lab/fold.js`, `data-fold="ham"`, closed on a first run
  as Q2's law, open through the card's WORKSPACE `folds`), and inside it the rows are tight: ‹ SYSTEM › on its row; then ONE row per system —
  HYDROGEN: WELL a · Z · μ with POSITRONIUM | MUONIC as a knob-sized seg; ATOM: ELEMENT Z alone; GAS: σ · |k| · BASIS with LAUNCH · BOUNCE as two
  small trigs on the same row; SCALE: the seg beside the λ knob. Target ≤ 300 px for the whole group open (it is ≈ 600 in the picture).
- **S2 THE FILL ICONS.** Two glyphs nobody confuses — FILL ALL: a ladder with every rung solid and a ● at its foot; EMPTY: the same frame with
  no rungs and a ∅ — in `paint-stroke.js` `fillButton` (one change: SPECTRUM, ORBITAL and STATES), hint "FILL ALL · every label on, equal and in
  phase" / "EMPTY · every label off"; the title-bar hint reads the same words.
- **S3 THE PRESET SEAT.** The PRESET row moves below the picker and above the HAMILTONIAN expander, outside the fold.
- **S4 SAVE A PRESET.** `lab/user-presets.js` `createUserPresets(storeKey)` — a PREFERENCE record (FAMILIES) of `{ name, data }` rows with
  `add · remove · list · watch` — shared with P3. The PRESET stepper narrows to fit a bare save glyph (`lab/img/icons/save.svg`, no button
  chrome, the mod window's `.m2presave` way); a press asks a name inline (the stepper's name becomes a field, Enter saves, Escape cancels) and
  saves WHICH labels are populated (equal, in phase — "just saves which orbitals were selected"); the list grows a USER group at the TOP only
  while one exists, each row with a × to remove; a user preset announces as THE FADE like a built one. Store `lambdawaves.q0.presets`.

### CHAIN W — WAVE · PALETTE · ESP (`lab/field.js`, `lab/windows/material.js`, `lab/palette-app.js`, `lab/mir/controls/ramp.js`, `lab/img/icons/reverse.svg`, `lab/skin.css`)
- **W0 THE ESP STALL (the MAIN ISSUE; measured first).** A headed probe (the GPU is shared: ESP vs STICKS in the same minute, re-run alone)
  reads frame time at rest, under a drag and with the clock playing on benzene and palmitic acid. Then: LIVE OFF means φ is solved ONCE per
  landing (a molecule, a basis, a VIEW) and never while the clock plays — the `generation` leaves the key unless LIVE is on; LIVE ON keeps the
  1 Hz law and says so (SLOW). The ray-traced surface under a drag runs at the governor's resolution (as the march does) if the probe says it
  must. The LOCK cannot move (ESP is style 11, never captured) — run it once at the end anyway (843 / 987, no leaf moved).
- **W1 THE KNOBS FOLLOW THE STYLE.** Every WAVE knob is shown only when its style reads it — a `STYLE_READS` table in material.js: ISO (cloud ·
  solid · signed · shell · shell± · bands · esp), KNEE (the volume styles), SOFT (solid · signed · shell · shell±), GRAIN (dust), EXPOSURE and HUE
  (all), SIZE (balls), RADIUS (sticks · esp), PROBE (esp on SAS | SES), RANGE and ISO | SAS | SES and LIVE (esp) — the dimming goes, the rows
  re-flow; a restore re-applies it (`atomDrawSync`'s road).
- **W2 THE PALETTE RULES ESP.** USE PALETTE is gone (`mat.espPal` dropped on every road in): PALETTE ON paints φ with the current palette
  (the LUT sampled end to end WITHOUT the cyclic wrap, `V.p2.z` read), PALETTE OFF the standard ramp; the colour bar follows the same rule.
  The ESP row stays a preset for whoever wants it, its magenta stop removed (five stops, 0 … 1).
- **W3 THE RANGE AND THE RAMP.** RANGE runs 0.002 … 2 a.u. (log; default ±0.1), and φ reaches the ramp through a SIGNED LOG: s = sign(φ) ·
  ln(1 + |φ|/ε) / ln(1 + R/ε), ε = R/20 — the middle (green) spans a real band, the saturated ends arrive only near ±R, "stronger and wider".
  The bar's five numbers are the inverse map's (−R, −R·g(½), 0, R·g(½), R). One shader branch; THE LOCK untouched.
- **P1 THE LIST ALIGNED.** The preset list's strips are one right-hand column (check `.pal-pick .mir-pick-i` is a flex row — a non-flex row makes
  `margin-left: auto` inert and the strip trails the text, which is what Josh sees), the name left, a 14 px gap; a shot proves it.
- **P2 THE REVERSE ICON.** `lab/img/icons/reverse.svg`: two counter-pointing arrows (→ over ←), 24-unit box, currentColor; REVERSE wears it
  (the chip), the word in its hint.
- **P3 SAVE A PALETTE** (built AFTER S and W merge, on `createUserPresets`). The preset stepper narrows to fit the bare save glyph; a press asks
  a name inline and saves the current stops; the list's USER group at the top only while one exists, × removes; the kit's `createRampPanel` gains
  `setPresets(list)` (FOR-MIR line) so the app re-feeds PRESETS + the user's. Store `lambdawaves.q0.palettes`.

## MERGE ORDER
H → S → T → W → M (picker.js is M's alone; material.js is W's; modulation.js is T's; skin.css is touched by all — hand-combine with the
013/014 recipe: `--no-ff --no-commit`, `--ours lab/sw.js`, `python3 -I ~/.claude/jobs/2ea66c54/tmp/manifest.py` once per merge that touched
the kit, `bash ~/.claude/jobs/2ea66c54/tmp/gate-it004.sh`). Then P3 on the merged tree. THE LOCK twice after W.

## ASSUMPTIONS (Yan's, standing unless Josh says otherwise)
1. THE SIXTH LOOK is arg ψ (WAVE's PHASE, the HSV wheel on the phase, hue-shiftable) — Josh named five for a 2 × 3; Re ψ is blank for every
   m = 0 hydrogen state (held imaginary since Q3), so PHASE is the honest sixth.
2. THE MATH LABELS: `ρ`, `arg ψ`, `Im ψ`, `●`, `⊸`, `φ` in STIX, the word as the hint. The molecular looks are greyed on the ATOMIC deck.
3. THE PICTURES go into the repo (`lab/img/menu/`, the DATA road of the service worker, never precache): ≈ 96 × 5 + 118 × 2 + 140 × 3 ≈ 1,100
   files, ≈ 12 MB. The volumes' variants stay the night render on Josh's word.
4. "Remove the DJ buttons and refine the DJ buttons" is read as: the old DJ-style buttons on the modulation window's bars are REPLACED by the
   kit-standard seats, every function kept; nothing is removed from the CSB.
5. THE PILL floats over the stage side of the card, not in the gutter (too narrow for a word) and not at the scrollbar (it would touch).
6. VOL. II · WIP appears on the shelf through pack.mjs `--wip --next II` — the live pack is still Josh's run after the queue; 015 proves the
   card on a scratch shelf.
7. A HYDROGEN tile's press populates ONE label (the hand's pick, one history row); the 140 tiles are paged like the molecular deck.
8. FOLDERS as the Picker's page keeps the floating window for the stage's doors; nothing of projects.js' adapters changes.
9. USER presets (SPECTRUM, PALETTE) are PREFERENCE records — the reader's furniture, never in a project or a link.
10. The signed-log ESP ramp with ε = R/20 and the default RANGE ±0.1 are Yan's numbers; the bar's numbers tell the truth of the map.
11. The ESP row of PALETTE loses its magenta stop (it was B's circle-closing device for the cyclic LUT, which W2 stops using for ESP).

## CALLS FOR JOSH (answers change the build; the assumptions stand meanwhile)
1. The sixth look: arg ψ, or five tiles and an empty seat, or something else?
2. The pill: over the stage side, 8 px clear — or in a widened gutter at the scrollbar (costs the cards ≈ 40 px)?
3. The modulation window's DJ row: keep TAP, WALL | FREE, 60 | 120 HZ, HOLD ¼ · HOLD 1 all (restyled), or retire any?
4. ESP under PALETTE ON: the whole LUT end to end (−R → +R) — or the palette's θ = 0 … π half as DENSITY uses it?
5. The 140 HYDROGEN tiles: labelled `3p₋₁` (the state) — or 28 subshell tiles (`3p`) opening the m = 0 state, with the m's inside the caption?

## 014 CALLS THIS PROMPT ANSWERS
B(3) the ESP row stays a preset, no USE PALETTE switch (W2). A(1) the pill leaves the eyebrow (H1). The rest of FOR-JOSH 2026-10-22's calls
and the live-tree runs still wait.

## CLOSED (Claude Yan, 2026-10-24; merges on yan-c, NOT pushed)

| Chain | Branch | Merge | Rows | Notes |
|---|---|---|---|---|
| H | it015-h | `8cbb2ba` | H1 pill outside · H2 words under · H3 the audit (`tests/hide-reveal`) | four faults fixed: both racks peeked from one edge, the hidden bar had no mouse road back, the hint under the menubar, no auto-hide exists; kit alpha.26 |
| M | it015-m | `cad5259` | M1 head + LOOK DROP · M6 grey hue · M2 looks everywhere (863 pictures, 6.9 MB) · M3 HYDROGEN \| ATOMS, THE 140 · M4 FOLDERS page · M5 `--wip --next II` | an element's variant is its block orbital's `orb-` picture (no `el-` variants); `loadPreset` takes an object |
| S | it015-s | `a2b8169` | S2 fill icons · S3 preset seat · S1 compact HAMILTONIAN (570 → 213 px) · S4 save a preset (`lab/user-presets.js`) | controller.js hand-combined: M3's object + S4's visual guards; the stepper's value is the USER key or the object's id |
| T | it015-t | `c47dc56` | T3 icon · T1 time · T4 fixed bar (494.8 / 682 px) · T5 doors + magnet · T6 switching (`tests/window-switching`, ink `landing()`) · T2 the mod window's bars | FOR-MIR both sides; kit alpha.26 (three lines) |
| W | it015-w | `901da23` | W0 ESP stall (once per landing) · W2 + W3 palette rules ESP, signed-log range · W1 STYLE_READS · P1 list aligned (Firefox) · P2 reverse icon | LOCK 843/0 + 987/0 on the branch and on the merged tree; the palette is read first stop to last (not the whole LUT) |
| P3 | it015-p3 | `83d9e6b` | save a palette (kit `setPresets`, `lambdawaves.q0.palettes`, USER / PRESETS headings only while one exists) | built on `901da23` after the merge; manifest 060ddb35892a |

Gate (pwa --write · ./test.sh node · rack-deps --classes · new-project --check) green at every merge; the node flake (wigner W42-8 under the
solvers' load) re-run alone each time. On the merged tree `901da23`: THE LOCK 843/0 + 987/0; thirteen browser suites green (render-regressions · official-defaults-palette · library ·
stage-text · start · timeline · menubar · history · frame-occlusion · hide-reveal · window-switching · keyboard-window · orbitals — L9 red under
the solvers' GPU load, 24/24 alone).
