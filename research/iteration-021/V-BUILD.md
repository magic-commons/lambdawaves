# 021 chain V — THE VISUAL CONTRACTS, the backend half (Opus builder, worktree agent-a8e46cebcbf904506, branch it021-V, BASE 87e88df = yan-c)

## V1 THE KIT DOORS — MIR 1.5.6-alpha.3 (clone road: kit 67dcbfc + 7da3c09 on kit-1.5.5; 88 added kit lines; bundle `.tmp/kit-1.5.6-alpha.3.bundle`)
- `registerGlyphs({ name: innerMarkup })` (glyph.js): beside the set, so `chip`/`setGlyph`/`glyphEl`/`glyphSvg`, `sw({ glyph })`, `trig({ glyph })`,
  the FINDER's `spec.glyph`, the menubar's `opts.icon` and the scroll pill draw app names; refuses (throws, registers none) a kit name or alias,
  a non-camelCase name, a second markup for a registered name; `appGlyphNames()`. Kit test `glyph.node.mjs` gained the case.
- `windowGlyphs({ id: name })` (window.js): an app names the glyph of a window a kit factory makes (MIR OPTIONS `gui`, ABOUT, KEYBOARD,
  TIMELINE, the FREE bar) by id, once — no option threaded through each factory. `createWindow({ glyph })` draws it before the title in a
  title bar (`.mir-win-glyph`, the head's 18 px) and writes `data-glyph` either way (a rail window has no head: data only).
- `device({ glyph })`: `data-glyph` + `.dev-glyph` before the name; `rk.register` reads it when none is passed; a rack-built window hands
  its spec's glyph to `device`. λWAVES declares at `register` (its card heads are untouched until 022 places the glyph there).
- `trig({ glyph })`: a glyph NAME draws an SVG, other text stays text. `rk.windows()` + `hidden`, `glyph`; WINDOW rows `{ icon }`; the pill's glyph.
- THE TALL WINDOW: taller than the room under the top band → `top ≤ max(0, vh − h − inset/2)`; NODES at 1280×720 [420, 56→674] → [420, 8→626].
- `fitFree` places again: the FREE bar's window, grown by the expander, moves back inside the viewport (8 px margins). Not pictured.
- `.k-lbl { max-width: 100%; overflow: hidden; text-overflow: ellipsis }`: no kit test pins the label's box (stylehash not re-captured).
- Kit: node 81/81; browser icons, controls, widgets, window, rack(-adopt/-leftovers/-motion), transport(-placement), menubar-phone, shell(-interaction),
  gui, keyboard, parity5, kit-paint, timeline-smoke green. Adopted; manifest pinned `'1.5.6-alpha.3'` (17b45f4a…); `--check` in step; FOR-MIR 8 BUILT lines.

## V2 `lab/icons.js` — THE ICON TABLE (120 lines; 56 drawings + 23 borrowed names = 79 registered; 38 window ids)
- The kit's shape: 24 box, live 2–22, stroke 1.9, round, `currentColor`, evenodd solids (`cogSolid`, `heart`), meaning-named camelCase.
  From lab/img/icons: arrowLeft/Right (3.5 → 1.9), atom, cogSolid, fileName, folderName, folders, unfoldAll (folds.svg) + a new foldAll,
  heart, hueRing, labels, library (spine ticks gone), mass, modulation (the sine), molecule (three atoms, two bonds), moon, sun, nodes,
  rackToggle (◧), reverse, saveInto (λWAVES' SAVE, 012 M1: the official one, kept under its own name), trash, windowPlus; new `repeat` (⟳).
  Resolved to the kit's: info-circle → `info`, home, download, plus; orphans curves.svg / render.svg → the kit's `curves` / `render`.
  Moved in: picker.js SHAPES → `balls`, `sticks` (1.6 → 1.9); paint-stroke.js GLYPH → `fillAll`, `emptyAll`; the NODES sprite's 27
  symbols → `node<Type>` through `scale(1.5)` at 1.267. `registerIcons()` is boot()'s first line (rack.js), before any window.
- Consumers on the kit roads: the bar's seats (`setGlyph` from the action's `icon`; FOLDS' `icon()` = foldAll/unfoldAll at its word's read;
  THEME carries moon + sun, csb.css shows one), ‹ › ⟳ → chevronLeft/chevronRight/repeat, the kit's text ◧ ☆ on λWAVES' own #rackToggle/#rackFav
  (set after createRack — no door needed), both modulation doors (`door: 'none'` + setGlyph), the Picker's `.mm-ico` seats and hue ring, the mode
  column, PALETTE ADD/REVERSE, the save/clear seats, FOLDERS' PROJECT (gallery `glyph`) and NAME/SAVE TO, NODES' cards and menu, the menus.
- Every window ONE glyph (`WINDOW_GLYPH`, at register / windowGlyphs): NODES `nodes`, FOLDERS `folders`, RENDER `render`, CAMERA
  `cameraOrbit`, INFORMATIONAL/ABOUT `info`, SETTINGS/MIR OPTIONS `settings`, PALETTE `hueRing`, MOLECULES `molecule`, ATOMS `atom`,
  TIMELINE `lanes`, MODULATION `modulation` (its rail is the kit's own: data only), FINDER's opener `windowPlus`. Probe: 29 FINDER rows,
  0 without an SVG; heads drawn: MIR OPTIONS, ABOUT, NODES, the FREE bar.
- RETIRED: `--ico`, `--icon`, `.lw-icon*`, every `mask: url()` in lab.css / skin.css / csb.css (the dead `[data-rack-list]` rows too), the
  `<use href>` sprite, keys.js' `doorIcon` URL, notebook.js `ROW_ICON`/`tagIcons`, the FINDER's `icon` hook; `lab/img/icons/` (29) and
  `nodes-icons.svg` deleted, their 30 sw.js rows gone (+ icons.js). Census (tools/v-shots.mjs icons-1600): url-masks 37 → 0, `--ico` uses
  66 → 0; icon seats with an SVG: bar 27/27, FINDER 56/56, Picker 27/27, NODES 64/64 (before 4/26 on the bar).
- `V-shots/{before,after}-icons-1600-{bar,finder,picker,nodes}.jpg`. Differences: strokes 2 → 1.9; Picker arrows 3.5 → 1.9; sticks 1.6 → 1.9; NODES
  1.4@16 → 1.9@24; INFORMATIONAL/home/download/PALETTE plus wear the kit's drawings; library without ticks; molecule as three atoms; menubar glyphs
  sit before the label (kit seat) and every WINDOW row wears one; all FINDER rows (were 5/29); NODES/MIR OPTIONS/ABOUT/FREE heads; the pill.

## V3 CRAMPED SPACE (pictures `V-shots/{before,after}-<scene>.jpg`; the sheet is 022's baseline)
- FOLDS ignores hidden windows (actions.js `foldable` reads the kit's `hidden`): MOLECULES on (SPECTRUM folded and hidden), EXPAND ALL opens
  the seven visible cards and leaves SPECTRUM folded — at BASE it unfolded the hidden SPECTRUM too (probe .tmp/probe-v3).
- THE BAR GIVES WAY TO EVERY FLOAT (shell/modulation.js): the seat is chosen against TIMELINE/MODULATION as 020 T3 built; then any open
  window in #floats over the bar's box sets `body.transport-under` (asked again on a float's open/close/move — one MutationObserver on the
  floats' own attributes, once a frame — and on resize). 1280×720: MIR OPTIONS, KEYBOARD and NODES each overlap the bar; topmost at the
  bar's right half was the bar (z 33) at BASE, now the window (`options-1280`, `nodes-1280`; KEYBOARD's foot ends 3 px above that point).
- THE NARROW STAGE (≤ 860): the old seat (left rack-w + 10, width auto) lost to the csb rules' weight; at 800 the bar stretched 112 → 466 px
  over the stacked rack with PLAY off the left edge. Picked by picture: under the top rack's cards, centred with PLAY, its own height
  (`stage-800`: [102, 112, 776, 204]). Neither brief option fits: rack-w is 300 there and the 674 px grid has no narrower form; docking
  would rewrite the seat store. Below ≈ 776 px PLAY still clips (the phone has its own layout).
- The bar on the STAGE's centre: checked first at 1280/1366, both racks open — bar centre = stage centre (683 at 1366): skipped.
- GRAIN rests while nothing plays (`body.lw-playing` from THE PLAY's onChange; play-state paused → running → paused, probed). Reduced motion
  closed: PLAY's hover lift, INVERT's turn, `.nodes-chev`, the hue ring (system setting and `<html data-motion>`).
- The touch hold on an offered segment (csb-favs) cancels only past the kit's `TAP.px` — which is **14 px** in the kit, not the review's 8.
- The sheet: 1600, 1280×720 + MIR OPTIONS / KEYBOARD / NODES, 1366, 1280, 1024, 800, phone (Firefox floors at 500 px: 500×758, `body.phone`).

## Tests
`./test.sh node` green; rack-deps HOLDS (persist 24/25); mir-manifest pinned; pwa --write. Browser (LW 9683 / GD 5683): hide-reveal,
window-switching, keyboard-window, curves, picker-looks, routed-knob, register, chem, library, frame-occlusion, menubar, lw-facade GREEN.
RED, and RED identically at BASE (a tar of yan-c served on 9684): molecule-head ("an undo back to WATER showed its head") and timeline
T1/T2/T11a/T11b (WINDOW › TIMELINE is a submenu row since I3; Space; the film's resume) — not this chain's, left for the integrator.
Re-aimed: curves (NODES lives in WINDOW › TOOLS since I3; NEW asks first, the test says yes). Fixed at the source: menubar rows lost their
hints in I3 (hide-reveal red at BASE) — a row's hint is its action's label when none is given (notebook.js item()).
THE LOCK `--check --query gastab=0`: GREEN 843 · 0 · 0 errors (a first run flagged momentum@128 as unrepeatable — a readback flake; re-run green). No leaf moved.

## CLAUDE.md sentences (for chain D)
- THE ICON TABLE: `lab/icons.js` is λWAVES' one table of drawings in the kit's shape (24 box, stroke 1.9, round, currentColor, evenodd
  solids, 16/20/24 px, meaning-named camelCase), registered at boot through the kit's `registerGlyphs`; every icon is an SVG drawn by a kit
  road (`chip`/`setGlyph`, `sw({ glyph })`, `spec.glyph`, `opts.icon`); no CSS mask, no sprite, no image file; every window declares ONE
  glyph (`WINDOW_GLYPH`) at its register or through `windowGlyphs`; a window without a drawing wears a BORROWED one until it is drawn.
- THE BAR IS ON TOP of every window, and goes UNDER any open float it overlaps (TIMELINE and MODULATION first by its seat), `body.transport-under`.
- The cramped-space sheet (`tools/v-shots.mjs`, research/iteration-021/V-shots) is 022's baseline.

## THE DRAWING LIST FOR 022 (name · window · borrows now — lab/icons.js BORROWED)
spectrum·SPECTRUM·bulletList, wave·WAVE·modulation, clip·CLIP·compact, field·FIELD·compassNorth, separable·SEPARABLE·duplicate,
central·CENTRAL·tune, lattice·LATTICE·gallery, emission·EMISSION·barsBottom, bloch·BLOCH·loop, plane·PLANE·xy, calculus·CALCULUS·curves,
ladder·LADDER·barsTop, wigner·WIGNER·eye, shadow·SHADOW·eyeShut, orbit·ORBIT·morph, vortex·VORTEX·mandelbrot, meters·METERS·grade,
radiation·RADIATION·dot, equalizer·EQUALIZER·sliders, controlSurface·CONTROL SURFACE + FREE bar·sliders, history·HISTORY·undo,
keyboard·KEYBOARD/KEYS·gripDots, notebook·NOTEBOOK (TOOLS row)·edit. Also: cogSolid at 16 px, an `about` λ mark (wears info), the mode column at 20/24.

## FOR 1.5.6 leftovers
A glyph seat on the kit rack's ◧ / ☆; a glyph in a RAIL window (no head) and on the modulation window's rail; `TAP.px` 14 vs the review's 8.

## Open questions for Josh
1. Card heads: the kit can draw each window's glyph before its name (`device({ glyph })`); λWAVES' heads stay as they are — draw them there in 022?
2. The bar goes under ANY float it overlaps (also on a tall screen when a window is dragged over it) — or only TIMELINE/MODULATION plus the short screen?
3. Under ≈ 776 px wide (a narrow desktop window) PLAY clips at the left edge: dock the bar there, or a narrower CSB grid (022)?
