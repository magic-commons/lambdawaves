# ITERATION 014 — THE BIG ONE (planned by Claude Sos, 2026-10-22; Josh: "Ultrathink a plan … keep the planning light")

BASE: `yan-c` @ `7f83530` (iteration 013 closed, the C7 catalogue swapped in). NOT pushed. Pictures Josh sent: `research/iteration-014/refs/`
(`esp-ses-mesh.jpg` an ESP on a solid SES inside a mesh SAS · `esp-sas-heatmap.jpg` 4-nitroaniline's ESP on the SAS, blue high / red low, with
a colour bar · `sticks-atom-ends.jpg` pure 3D sticks coloured by the atom at each end · `fat-balls-glucose.png` CPK space-filling balls).

## THE ONE NEW LAW (Josh, 2026-10-22: "lift")

**`lab/mir/**` MAY BE EDITED in 014.** The kit repo (`~/Documents/MIR`, worktree mir-1.5, 1.5.0-alpha.24), λWAVES' `lab/mir/` and BASINS'
`app/lab/mir/` are byte-identical today (diff: 0 files), so λWAVES becomes the place where the kit moves, as BASINS was. The trickle-down rule:
every kit change (a) bumps `lab/mir/version.js` (1.5.0-alpha.25, .26 … — NOT 1.6: 1.6 is Josh's audio-visual upgrade, nodes / dance visuals /
skins as mods, after 1.0.0), (b) gets one line under a new `## FROM λWAVES, FOR THE KIT (1.5.0-alpha.25+)` section at the TOP of
`docs/FOR-MIR.md` (what changed, which file, why — the kit's changelog is written from these lines on kit day), (c) keeps the kit's own laws
(no English in a lookup → `label()`/`t()` + the locales' English pack; parts found by class and `data-*`; `.glass` panes take the look store).
`lab/fonts/**` stays untouched. Everything else standing stays standing (no push, no deploy, THE LOCK never re-baked, `for CODEX/` read-only,
`~/Documents/LAMBDAWAVES-VOLUMES/raw/` is the solvers' — they are RUNNING (8,984-molecule queue under `babysit/babysit-c7.sh`): never touch
their pids, never start one; a builder who needs a volume field writes the solver/pack change and a `--only` dry run on ONE molecule into a
scratch raw dir (`--raw`), never the live one).

## JOSH'S PROMPT, VERBATIM

# 014 (BIG ONE)

A slight push into a prototype of MIR 1.6 before Lambdawaves 1.0.0 is official. There will still be way more iterative work. Visual inspection/research aid can be done by Gemini 4 via 'agy' (Google Antigravity; Gemini CLI is discontinued)

## NEW FEATURES: MOLECULAR RENDERING
- I've shared some screenshots for new types of views and their variations (which we could reach via customization of parameters of the these features. Electrostatic Potential Map (ESP?) (SAS/SES),  3D Colored Balls; no sticks, and pure 3D sticks with the colored atom ends.
- Let the electrostatic potential map be the tough one. This one *might* be animated/dynamic depending on how the different orbitals are doing interference and if not... then perhaps this can be a fun variation of 'Density'. Palette can have a special color map for blue for low and red for high when coloring the map BUT there can be a toggle that says '(use active) "palette"' so that it uses the palette as the color map for low and high potentials.
- We will move some of the features from the molecules window to the new 'Control Surface' to make the molecules window much smaller and more specialized.

## MORE LIBRARY METADATA
- I think the volumes should also include helpful stuff that makes loading potential maps better (assuming the first part goes well)
- I was thinking that in the library in the picker, we could make clicking on a molecule that has different possible (known) structural isomers (not the mirror kind (I guess we can add a flip button?))
- Include thumbnail variants like Signed 'Im' (so that it just shows two complimentary colors that can be hue shifted), Fat Balls; no stick, 3D sticks with atom colored joints, and SAS/SES maps (that can also be hueshifted)
## PICKER/MAIN MENU
- In Library, inside a volume, move the search bar to the middle, underneath the atomic, molecular, and library buttons.
- Where search bar once was, add in a new 'A-Z'/'Z-A' icon and a 'Sort by Mass'. Both these buttons can be a 3 round toggle, A-Z, Z-A, As-is; then the other button (perhaps it's icon can be a weight SVG) cycles through, highest mass first, lowest mass, then As-is. The As is option would be like as if the button just became unpressed. Or idk, I think you know what I'm getting at here.
- Add a 3rd row for the tags and add a 3rd row. Also through the list of molecules and add more tags in the metadata for known geometry classes/types. Use a cheap model for this?
- When the hue cycle passes through 359 to 360 or 1 to 0, it flickers a flash of different colors for a quick moment. Can fix?

## MOLECULES GENERAL EDITS
- Increase the height of the paint-able table thingy in molecules window by about 50% more.
- Remove the molecule picker and library picker and replace it with the new Main Menu picker system on the CSB instead because that looks so much more aesthetically pleasing.

## PALETTE
- Make the Palette presets drop down menu have the texts align left and the color strips align to the right.
- Let Invert also be a custom button that's a 'Knob' size for the CSB
- Capitalize the first letter of the preset name. e.g. 'sea' to 'Sea'

## INFORMATIONAL
- Let the Ball and stick model show double/triple bonds, whether a bond is sigma, or ionic, or different types of attraction, resonances (like benzene) and other 'sticks' you could think of. Let these be a customizable feature to be in the informational
## WAVE
- Strange request but can the knob direction of the parameter of ISO, KNEE, SOFT be inverted? Mostly because I associate 'more-ness' to dialing it to the right and 'less-ness' as to the left

## NEW FEATURES: MIR 1.5 TRANSPORT BAR/WINDOW/OVERHAUL
- **NEW** "CONTROL SURFACE BAR (CSB)"! We will be creating and testing out a new idea for an MIR special window (like the class of folder, timeline, MIR Options, and modulation window). This new bar will include the classic buttons from the transport like 'Play/Pause' toggle, Mod on/ off, Show timeline button, Tempo and Rate knobs and more!
- Keep in mind to remember it's a prototype and is in lockstep with a mobile build of 'MIR' (Engine stays the same... it's just designing a new UI that's a pain in the ass). We have a clone of 'Figma' called FigCraft on my machine. But that will be on a much later date. For now, let's see if we can get the "Main Idea" of Lambdawaves to fit as controls on
- Keep Gemma hidden or out of the way for now.
- Lambdawaves timeline is missing the leftside work bar from 'BASINS MIR 1.5'. The timeline should now have the basic tempo, play/pause button and the likes for a 'work bar' on the left side... check out the exact code of how 'BASINS' handled this and it's UI behavior/animations and adapt it into our newer Lambdawaves build.
- This completely replaces the 'TRANSPORT' that shows up in the stage and rack window. Essentially this is a renaming of the existing transport and a heavy overhaul on the buttons and features/philosophy. The 'Transport' we will refer to after this update will simply be 'that left bar on the timeline window'.
- Check out how BASINS'S handle's the UI spec but keep in mind the tempo expander thing is so much better in Lambdawaves and was actually the inspiration for BASINS's Transport.
- Inspect how the current tempo expander is. We will keep how the UI looks like but we will over haul the content of controls that the control bar would have.
- I only want the stage to be clear of all buttons, so the only thing should exist is the logo and the drop down menus like file, edit, view, etc. We will move the 'Picker , Hydrogen, and Molecules' buttons AND the right side's 'Add window, Auto-hide, and Saved UI layouts' to the control surface and include the picker's library's search to enable what is essentially a miniature version of the picker. Imagine when typing into the search, it does an auto-predict thing where if I type 'Nic...' and then it shows a row of, max, 6 floating thumbnails just above the CSB, which will use whatever the current hue, view setting of the thumbnail it is. We will move the molecule window's molecule chooser into the CSB.
- For the expandable mode (what used to be clicking/tapping the tempo button to reveal DJ-like controls) we will include a section where we can add CUSTOM knob routing/macros for any favorite knobs a user can pick via the right click feature on a knob (hold for mobile). These can stay as user preferences rather than project settings that gets saved so every new project starts with it. These knobs can function exactly what the original can like being able to be macro'd by the modulation window, timeline, etc. with how our current UI does 'create automation' or 'delete/add routing' right click features. (I think it just automatically routes both but they're really the same destination just different ways to do it). It will also not just have knobs but rather other switches or toggles like Presets/Store A&B from State window or Molecules window, Wave window's orbital views, and more *because* rack windows are already a fixed width, meaning that we can have a free slot of max two buttons/toggles/switches/drop-downs (if it's a short button less than half the width of the MIR rack window then perhaps more can fit). We will work as many rack window elements we can send to the custom section of the control surface but
- Also have a button that lets it stand vertically and the original rack dock/un-dock toggle can be come a cycle of: dock to rack, dock to stage, free-window (great for when the control surface is vertical (where the CSB doesn't have to be stuck in the top/bottom and auto switch/hide). A vertical bar btw would just show a magnifying glass for search; clicking on the search icon will expand the icon into a horizontal pill from which you can type on while having it be aware if it's on the left side of the screen or the right half of the screen to decide which direction the pill goes. easy-peasy
- New dimensions should try to be as narrow as possible (Bonus points if smaller than the original transport bar but I doubt it) and have the high increased by 50% for a thicker bar. Controls can be 2 rows and the expander can show much more.
- Remove the 'GUI' section in the drop down menus and let it be a gear icon on the CSB to activate MIR options window. MIR about should be a second page to the About page(s).
- There is no MIR mobile yet (Called "MIR Focus") but for now, a very functional control bar should be able to control the entire app just from the bar. Summoning a rack window could be floating instead AND users could go a different route and populate the favorite controls.

## NEW FEATURES: MIR RACK WINDOW UPGRADE
- When scrolling on the rack window, let a little colored pill appear directly adjacent to the window title bar (Accent Color B) (perhaps something that looks like a text message pill) that has a text that shows shows the name of the window in a strong, bold, sans serif font that we already have. No shadow just solid pill. Reason is that scrolling through windows is hard to see where on window begins and another starts. When the scroll bar dissappears, the pills dissappears too.
- Let it be material animated like android's material UI animations where it reminds me of an animated mask hiding and revealing the app. Let this be an incredibly cheap effect as the scroll will be moving the windows.
- Let the text autodetect whether it should use white text or black text.
- Let it be disabled/enabled toggled in the MIR options window and whether it should be Accent color A or B (honestly prefer B)

## GOL RESEARCH FOR MAIN MENU/PICKER
- Something that has fascinated me is Gol's FL studio's plugin picker. The UI is gorgeous and it feels brisk while having a very delightful animation and such.
- Look at how Gol does his icons, I'd like to plan to redo all the icons across the MIR suite (for lambdawaves for now) in the style of Gol's soft icons styling. Definitely a job for Gemini 4.
- It could be a random bloated feature (I like the current MIR Window drop down menu) but could we add something similar to FL Studio's plugin picker where you could look for MIR windows and have the ones that can't be opened be greyed out (Because molecules and hydrogen mode), a search bar and a 1:1 animation behavior.
- Try to see if Gol uploaded any of his code or talked about it for more information. Gol also made most of the Fl studio/VST GUI's so perhaps look there for his gorgeous animation style/effects (He even has a damn faux motion blur in a UI that's mostly vector based. That's insane!)
- Gol essentially mastered Vector based UI that allows FL studio to scale to any resolution and resize without stretching pixels. I want to know his secrets. A re-sizable/customization MIR would be great for an MIR 2.0.0 ambition.

(Josh, after the prompt: VOL. II may be filled partially now with a WIP label for the overflow; volumes are 5–5.5 GB each, one every other week; indexes
versioned, payloads immutable; proteins are a 2.0.0 ambition; the 70 heavy-atom cap stays.)

## WHERE EACH ITEM LIVES (Sos's greps, so a builder starts at the file)

| item | lives in |
|---|---|
| the transport, its parts, `LAMBDAWAVES_LAYOUT`, the tempo pill/panel, the dock chip | `lab/mir/shell/transport.js` l.1–60 (the laws), l.307 `tempoPill`, l.540 `LAMBDAWAVES_LAYOUT`, l.550 the docked seat; `transport.css`; `docs/TRANSPORT.md` in the kit repo says which part is BASINS' |
| the timeline and its work bar | `lab/mir/timeline/window.js` l.6–7, l.19 ("WORK BARS cycles top → bottom → hidden", `bar: 'work'`), l.48 `workLane`; λWAVES installs it at `lab/shell/keys.js` l.164 `installTimeline({...})` — the kit HAS the work bar since alpha.14; the app's store/options decide whether it shows |
| the rack, its scrollbar | `lab/mir/shell/rack.js`, `rack-scrollbar.js` (the 2-px accent thumb; shows while scrolling), `rack.css` |
| the menu bar, GUI / ABOUT entries | `lab/mir/shell/menubar.js`, `gui.js` (MIR OPTIONS), `about.js`; λWAVES' verbs `lab/shell/keys.js` (l.119 `gui`), `lab/mir-gui.js` |
| the stage buttons LIBRARY · MOLECULAR · HYDROGEN (`#lwMode`) | `lab/windows/molecules.js` l.21–40; `lab/skin.css` l.630 |
| ADD WINDOW · AUTO-HIDE · FAVOURITE LAYOUTS (right stack) | `lab/shell/rack-wiring.js` l.161–205, `lab/skin.css` l.228 |
| the Picker (search, hue ring, deck, pages, volumes) | `lab/picker.js` (hue l.78–103 `setHue`), `lab/lab.css` `.mol-pick`, `lab/skin.css` `.mm-*` |
| the MOLECULES window (chooser, the paintable ladder = REGISTER) | `lab/windows/molecules.js` l.63–120 (`createRegister`, `C.slots.register`), `lab/register.js` |
| PALETTE presets dropdown, INVERT, labels | `lab/windows/material.js` l.93–130 (`palLabel`, `createRampPanel`), `lab/mir/panels/ramp.js`, `lab/mir/palette.js` |
| ISO · KNEE · SOFT knobs | `lab/windows/material.js` l.34, 52, 54; modulation rows `lab/shell/modulation.js` l.52–61 |
| BALL AND STICK (the words' skeleton) | `lab/informational.js` l.34 (`skeleton`, `skeletonOpacity`, `skeletonSize`), `lab/shell/stage-words.js`; the bonds come from the molecule's atoms today (distance rule) |
| the field, the views (`density, phase, real, imag, diff`), ISO, KNEE | `lab/field.js` l.24–28 `VIEW_NAMES`, l.197–201, l.391 (`p3`: style, iso, grain, knee), the WGSL beside it |
| thumbnails | `tools/menu-thumbs.mjs` (renders over a gate server), `dist/vol-1/t/<id>.webp`, `index.json` `thumb` |
| the catalogue, tags (35 structure/class words), isomers | `tools/volumes/catalogue/{build,structure_tags,app_tags,check,guards,queues,report}.py`; `vol-1.candidates.json` rows carry `inchikey`, `formula`, `mw`, `tags`, `smiles` — structural isomers = same formula, different InChIKey first block (connectivity), so the tool needs NO new source |
| the solver (what a rung writes) | `tools/volumes/solve.py` l.113 `write_npz` (eps, C, occ, energy, enuc, dipole, mulliken); the pack `tools/volumes/pack.mjs`; the app's reader `lab/volumes*.js` / `lab/chem*.js` |

## ROWS AND CHAINS (each chain = one Opus builder in its own worktree, rows in order; the CSB chain is Yan's)

**CHAIN A — THE CONTROL SURFACE (kit + app; Claude Yan).** The crux. The kit's transport is already "parts + an app layout", so the CSB is a NEW
LAYOUT plus NEW PARTS, not a new window class — and `docked` (a rack window named TRANSPORT), `mountIn(host)` and the tempo expander are kept.
- **A1 CSB, THE BAR.** `lab/mir/shell/transport.js`: a `CONTROL_SURFACE_LAYOUT` in two rows, 50 % taller, as narrow as the parts allow; the bar's name
  in words becomes CONTROL SURFACE (the catalogue; the rack window keeps its id `transport` so saved layouts open). Row 1: play · mod power ·
  timeline latch · TEMPO pill (the expander, look unchanged) · RATE knob · the gear (MIR OPTIONS) · dock. Row 2 (λWAVES' parts): LIBRARY ·
  MOLECULAR · HYDROGEN (moved from `#lwMode`) · the molecule chooser (moved from MOLECULES) · the search field · ADD WINDOW · AUTO-HIDE ·
  LAYOUTS (moved from the right stack). The stage keeps only the logo and the menus. GUI leaves the menu bar (its verb stays for the key);
  MIR ABOUT becomes page 2 of ABOUT. Gemma stays hidden (013's `gemma` flag).
- **A2 THE MINIATURE PICKER.** The search field: typing shows ≤ 6 floating thumbnails above the bar (the Picker's own tiles, current hue and
  view — `lab/picker.js` exports a `suggest(query, n)` reading the same index), Enter/click opens the molecule, Esc closes. Vertical bar:
  the field is a magnifying glass that unfolds into a pill toward the screen's centre (left half → rightwards, right half → leftwards).
- **A3 THE EXPANDER'S CUSTOM SECTION.** Under the tempo panel a FAVOURITES strip: a knob's right-click (hold on touch) menu gains "ADD TO CONTROL
  SURFACE"; the strip hosts knob clones bound to the same modulation target ids (so automation / routing work unchanged) and short controls
  (A/B store, WAVE's view segment) — a control is eligible when it is a knob or ≤ half a rack card wide. Stored in the browser's settings
  (`lambdawaves.q0.csb`), never the project. Remove by the same menu or drag out.
- **A4 SEATS.** The dock chip becomes a cycle: RACK (today's docked) → STAGE (today's free bar at top/bottom with auto-hide) → FREE (a floating
  window, may stand vertical; the VERTICAL toggle lives here). The rack window's seat and the floating window's rect persist (`mir.gui`).
- **A5 THE TIMELINE'S WORK BAR.** Josh's pictures (`refs/timeline-lambdawaves.png` vs `refs/timeline-basins.png`): BASINS' timeline has the
  work bar at the TOP LEFT of the window — play · power · the BPM pill · the zoom readout (10^243.3) · rewind · the mod door · palette — in the
  same row as the right tool bar (pen · clone · SLICE · CLIPS | POINTS · SNAP · STEP · SLIDE · ACTIVE · …); λWAVES' timeline shows ONLY the right
  tool bar, the transport pill floats on the stage instead. A5 = the kit's work lane (`bar: 'work'`, `workLane: 'top'`) actually mounted in λWAVES'
  timeline with BASINS' content and its open/close animation (read BASINS' `app/lab/mir/timeline/*` — identical to ours — and BASINS' app-side
  wiring in `app/shell.js` / `timeline` install to see what λWAVES' `installTimeline` call in `lab/shell/keys.js` l.164 leaves out). SECOND
  FAULT in the same picture: λWAVES' lanes sit on a frosted, light translucent slab under the whole timeline; BASINS' lanes are clean glass over
  the fractal — Yan inspects BASINS' GUI/CSS (`app/basins.css`, `material.css`, the look store's FROST/tier values) during planning and removes
  λWAVES' slab (likely `lab/skin.css` or the look store's defaults, not the kit). After A1 "the transport" means this work bar.
- **A6 THE RACK SCROLL PILL.** `lab/mir/shell/rack-scrollbar.js` + `rack.css`: while the 2-px thumb is visible, each rack window shows a solid
  pill beside its title bar with the window's name (the kit's bold sans), accent B (option: A | B, ON | OFF in MIR OPTIONS › LOOK › RACK), text
  colour by luminance (the kit's contrast helper), a clip-path reveal/hide (`transition: clip-path`, no layout, no shadow). Hidden when the
  thumb hides.
- **A7 THE WINDOW PICKER (optional, last).** A kit panel listing every window with a search field, the unopenable greyed (MOLECULES' and
  HYDROGEN's modes), opened from the WINDOW menu's first row; the FL-Studio animation brief comes from chain E's note. Build only if A1–A6 land.

**CHAIN B — THE THREE VIEWS (app, GPU; Opus).** All three compute from what the app already has: the atoms and the solved coefficients.
- **B1 FAT BALLS.** A draw style `balls` in the field: CPK radii × a SIZE knob, atom colours (the existing element palette), no sticks; depth-cued
  spheres as SDF in the ray march (the field's march already runs per pixel; a sphere list ≤ 1,024 in a storage buffer). Hue-shiftable by
  `--mol-hue` in the thumbnails, by the palette's hue knob on the stage.
- **B2 PURE STICKS.** A draw style `sticks`: capsules between bonded atoms, each half coloured by its atom (refs/sticks-atom-ends.jpg), RADIUS
  knob; the bond list is the words' skeleton's (one source).
- **B3 THE POTENTIAL MAP.** Static first: ESP φ(r) = Σ Z_A/|r−R_A| − ∫ρ(r′)/|r−r′| on the SAS/SES (probe RADIUS knob; SAS = union of spheres
  r_vdW + probe, SES by a rolling-probe approximation: SAS distance minus probe, clamped). The electron term is the cost: do it as a Poisson
  solve on the density grid the app already marches (Jacobi/multigrid in a compute pass, or a precomputed grid from the volume — see C1); the
  nuclear term is exact. Colour: a fixed BLUE-high / RED-low map (refs/esp-sas-heatmap.jpg) with a "USE PALETTE" toggle that reads the active
  ramp instead; RANGE knob (±φ clamp). As a variation of DENSITY: paint the density isosurface by φ (the isosurface exists; only the colour
  changes) — this is the cheap first deliverable; the surface variants follow. Animated ESP: the time-dependent density's φ by the same Poisson
  pass each frame — leave as a switch marked SLOW, only if the static one is fast enough.
- **B4 THUMBNAIL VARIANTS.** `tools/menu-thumbs.mjs --style im|balls|sticks|esp`: writes `t/<id>.<style>.webp`; the index names the styles a
  molecule has; the Picker's tile shows the chosen style (a STYLE segment under the hue ring). SIGNED IM = two complementary colours (the
  palette's bipolar, hue-rotatable). (Rendering 6k+ pictures × styles is a night job over a gate server, like the finish's — not the builder's.)

**CHAIN C — THE LIBRARY'S METADATA (solver, catalogue, pack, picker; Opus).** Nothing under the LIVE `raw/`; dry runs in a scratch `--raw`.
- **C1 POTENTIAL DATA IN THE VOLUME.** `solve.py` writes per top rung a coarse ESP grid (PySCF `mol.intor('int1e_grids')` or `df` point
  charges; 32³ f16 over the march box ≈ 64 KB) and the Mulliken/ESP-fitted charges; `pack.mjs` carries it; the app's reader exposes it to B3 as
  the electron term (no Poisson needed when present; the live Poisson is the fallback for molecules solved before C1). Dry run on ONE molecule
  into a scratch raw dir; the live queue picks the field up only after Josh's word (a re-solve pass or a "finish" of the top rung only).
- **C2 ISOMERS.** `build.py`: group rows by formula + connectivity (InChIKey block 1 ≠, formula =) → `isomers: [ids]` on each row; the Picker's
  tile with isomers gets a corner mark; clicking opens a small deck of them (same hue, same style) instead of loading at once; a FLIP button on
  the stage mirrors the molecule (a camera/parity toggle — enantiomers are not catalogued). Pack + index carry `isomers`.
- **C3 MORE TAGS.** A cheap-model pass (Haiku 5.5, high effort) over `vol-1.candidates.json` proposing geometry/class tags from the SMILES +
  ChEBI class (linear · planar · ring strain · cage · macrocycle · spiro · bridged · organometallic · zwitterion …), written as a PROPOSAL file
  `catalogue/tags.proposed.json`; `structure_tags.py` adopts only tags it can verify from the structure (RDKit), the rest wait for Josh. The
  Picker's third row shows the tag chips (B4's STYLE segment sits with them).
- **C4 VOL. II WIP + THE 5 GB CUT.** `pack.mjs --max-gb 5.25 --wip`: when VOL. I passes the cut, the overflow packs as `vol-2` with `wip: true` in
  the index; the app shows a WIP label on the volume card and lets it install. Index versioned (`indexVersion`), payload immutable per id.

**CHAIN D — THE SMALL ROWS (app; Sonnet or Opus, one worktree).**
- **D1 PICKER SEARCH SEAT.** Search bar to the middle under LIBRARY · MOLECULAR · HYDROGEN (A1 moves those to the CSB — in the Picker they stay
  as the volume's three buttons); its old seat gets two 3-state toggles: NAME (A–Z → Z–A → as-is) and MASS (heavy-first → light-first → as-is;
  a weight glyph); as-is = unpressed. Sort by `name` / `mw` on the index.
- **D2 THE HUE FLICKER.** `setHue` wraps 359→0; the CSS `hue-rotate(var(--mol-hue))` transitions the long way round through the `transition` on
  `.mol-thumb`/`.mm-tile` — fix: no transition on `--mol-hue` (or set the variable in turns, 360deg + …, never wrapping the number the CSS sees).
- **D3 MOLECULES.** The REGISTER (paintable ladder) 50 % taller (`C.slots.register` height / `.lw-register` CSS); the molecule chooser and the
  library picker leave the window (A1 takes them) — the window keeps the ladder, the A/B store, the mode-independent controls.
- **D4 PALETTE.** Presets dropdown: text left, strip right (R4's list pane: `justify-content: space-between`); preset names Capitalised at the
  label (`palLabel`); INVERT as a knob-sized button part eligible for the CSB's FAVOURITES (A3's registry).
- **D5 WAVE KNOBS.** ISO, KNEE, SOFT turn the other way: the knob keeps min/max and the modulation map; the DISPLAYED direction flips
  (`knob({ reverse: true })` — a kit knob option, logged) so right = more opaque/dense, left = less.
- **D6 BONDS.** INFORMATIONAL › BALL AND STICK gains a BONDS set: ORDER (single/double/triple from the catalogue's SMILES bond orders, carried by
  the index — C2 adds `bonds: [[i,j,order]]`), AROMATIC (benzene's ring as a dashed inner circle), IONIC/DATIVE (a dotted stick when the pair's
  Mulliken charges say so), H-BOND (dotted, N/O–H···O/N within 2.5 Å). Each a switch; the skeleton draws them in the words' layer.

**CHAIN E — RESEARCH, NO CODE (Gemini via `agy`, or a Haiku reader; a note, not a row).** Gol / FL Studio's plugin picker and icon style: what
is public (Image-Line forums, Gol's posts, the FL 20/21 vector GUI write-ups), a brief for the icon redraw (soft, filled, 2-tone, scaling by
vector), the picker's motion (spring open, stagger, faux motion blur by a stretched duplicate at low alpha). Output:
`research/iteration-014/GOL-NOTE.md` + a 24-icon sample sheet for Josh. The icon redraw itself is a later iteration.

Order: A1 and B3's density-paint first (they are the prompt's two "main ideas"); D runs in parallel; C1 before B3's surface variants; A7 and
B3-animated last and optional.

## ASSUMPTIONS (Josh corrects what is wrong; the builders build these)

1. **The CSB is the transport's next layout, not a new window class**: same node, same `docked` rack window (id `transport`, word CONTROL SURFACE),
   same tempo expander look. "Transport" after 014 = the timeline's work bar.
2. **Lifting `lab/mir` means the kit MOVES in λWAVES** under the trickle-down rule above; version 1.5.0-alpha.25+; BASINS adopts on kit day.
3. **The stage keeps the logo and the menus only.** LIBRARY · MOLECULAR · HYDROGEN, the molecule chooser, ADD WINDOW · AUTO-HIDE · LAYOUTS move to
   the CSB. Keys and saved projects keep working (ids unchanged, only seats move).
4. **The potential map's first form is DENSITY painted by φ**; SAS/SES surfaces follow; animated ESP only if the static one is cheap.
5. **The special colour map is the standard: red = negative, blue = positive** (Josh answer 3; refs/esp-sas-heatmap.jpg is the colour-bar hint); "USE PALETTE" swaps in the active ramp.
6. **Isomers = structural (same formula, different connectivity)**; FLIP is a mirror of the view, not a new molecule.
7. **Favourites are browser preferences**, not project state; a favourite knob is a clone bound to the same target id.
8. **Thumbnail styles are extra files**, the index names them, the night render makes them; the builder renders ten for proof.
9. **C3's new tags are proposals** until verified by structure; a cheap model proposes, the tool adopts what it can prove.
10. **The solvers keep running throughout**; C1's solver change is dry-run only until Josh's word.

## JOSH'S ANSWERS (2026-10-22 01:1x) TO THE SIX CALLS — these overrule the assumptions above where they differ
1. **CSB seat at boot: the STAGE** (the free bar, where the transport is today). The rack seat and the free window are the other two of the cycle.
2. **The work bar**: see A5 — not a left lane; the kit's TOP-LEFT work bar as BASINS shows it, which λWAVES never mounted. Plus the frosted slab
   under λWAVES' timeline goes (BASINS' is clean). Yan inspects BASINS' GUI/CSS during planning.
3. **ESP colours: the standard** — RED = negative (electron-rich) … BLUE = positive, as the chemistry viewers draw it (assumption 5 is reversed).
   `refs/esp-sas-heatmap.jpg`'s colour bar is the hint for the palette: a vertical bar beside the map, numbers at five stops (±max, ±half, 0),
   the same ramp (red → yellow → green → cyan → blue) as the kit's special ESP preset; "USE PALETTE" swaps the active ramp into the bar too.
4. **Favourites: knobs first, plus a few easy non-knobs**: SPECTRUM's HYDROGEN | STURMIAN row (whole row; the λ SCALE knob may stay behind), WAVE's
   POSITION | MOMENTUM segment and its PROBABILITY · ARG · RE/IM view segment. Other rows next round.
5. **Gol icons: note AND a sample sheet**, and the icons may be 95–99 % like Gol's own related icons — the brief is "match, don't reinterpret".
6. **The previous ~6,000 molecules get the potential grid too** — it is NOT a re-solve: the saved rung (C, occ) rebuilds the density matrix and the
   ESP grid is one integral pass (`mol.intor('int1e_grids', grids=…)` with the nuclear term), seconds a molecule on the CPU — a post-pass
   `tools/volumes/esp-pass.py` over raw/ (run by the babysitter's finish or a night, never by a builder on the live raw/), hours for all, then a
   pack. The app's Poisson pass stays as the fallback for a molecule without the grid.

## HANDOFF
Builders' common brief: `~/.config/claude-backup/jobs/8497d75b/tmp/brief-it014-common.md` (013's with the kit law replaced by the trickle-down
rule). Yan plans and builds CHAIN A from this file; Sos (or whoever integrates) merges with the 013 recipe, LOCK by name only if `lab/field.js`'s
numbers move (B1–B3 add styles; the digest's leaves must not move — a new style is a new branch in the shader, never a change to the old ones).
