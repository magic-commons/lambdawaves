# Iteration 013 — THE PICKER'S EDGE, THE CLIPPED ORBITAL, THE STAGE'S THREE BUTTONS (Josh, 2026-10-20; planned by Claude Sos, built by three Opus chains)

Josh, 2026-10-20 (after Yan closed 012 at `46382ab`): "Yan did the big thing. Now it's your turn." Tokens are thin (the 5-hour window is the one to
watch), so the thirteen items are built as THREE chains, one Opus builder each, one worktree each, rows in series — Yan's 012 grouping.

## Josh's prompt, verbatim

> # 013
>
> ## MAIN MENU  (PICKER)
> - When a table/page scrolls left or right, it seems to get cut off by an invisible border as if the molecules hide underneath the margins/padding. Make it instead hide nowhere and just show it swipe off the edge of the screen or at least fade it out by an invisible gradient so that it isn't a hard cut off.
> - Let the current color of the hue shift dictate the hue of the thumbnails in the molecules rack window.
>
> ## SETTINGS
> - Remove text that says 'grid' in quality.
>
> ## PALETTE
> - Remove the text that says 'the built in' for HSV and 'Re/Im Legible'.
> - The icon for '+' in palette is weirdly a cross symbol. Can it just be two lines crossing each other without the serifs?
>
> ## SPECTRUM REGRESSION AND MORE
> - There is a huge issue with the orbitals clipping in the box even when domain auto is on (especially atom mode, Hydrogen mode is less absurd). I don't mind if it's the higher orbitals when they *slightly* clip but for the lower orbitals... that's kind of bad. I believe this may be an artifact when the math for the stage had to be modified to fit incredibly large molecules. I'm not sure if it's Central, Lattice, Seperation or whatever window might not be returning the hydrogen orbitals to it's original state. (Check older pre-library Lambdawaves version to see how the orbital's size/behavior was in the older versions) (Also I understand why atoms have to be clipped, but if )
> - Make leaving 'seperable' system also close the seperable window. And other windows that appear when messing with 'spectrum's window (Like lattice)
> - Remove text that says 'System' and instead let it all be under 'Hamiltonian'
> - For the STAGE underneath the Lambdawaves logo, let 'Atoms' instead say 'Hydrogen' and default to hydrogen instead. Having the atoms window open and turning it on should automatically switch 'spectrum's system to atoms. Remove the texts and make it a mouseover hint to and make it icons: use the icons from the main menu/picker for Library, Molecular, and Atomic for the stage buttons and remove the texts and make the buttons a column instead of a row.
> - There seems to be a bug where if I try to hide the UI (H) while Box (setting) is on in Box (spectrum's system), it seems to lag while the UI is hidden, when trying to unhide the UI, the box. It returns to a way better FPS while the UI is active and the box is there where you'd think a fully hidden UI speeds up the FPS of the stage
>
> ## INFORMATIONAL
> - Shorten the buttons for position move pad knob to fit the expand window button so it's on the same row to save window height.
> - The Name/Stage Formula still seems to interact with mouse positioning even when the settings are off in informational. When 'cursor' settings are off, the text should stay fixed and not sway... though it's a nice sway.
>
> ## MISSING THUMBNAILS
> - In the base molecules library and the extended volume library, there are some missing thumbnails for the orbitals. Can we patch those up?

## Where each item lives (Sos's greps, 2026-10-20)
- **The Picker's pages** `lab/skin.css :703` `#lwMenu .mm-pages` — `width: calc(tiles × cols + gaps)`, `overflow-x: auto`, `scroll-snap-type: x mandatory`: the container is exactly the grid's width, so a page sliding out is cut at the grid's edge (the "invisible border"). The tag strip already fades by a mask (`:757–758`, `.mm-tags` mask-image linear-gradient 14 px) — the same recipe, wider, is the fix; or the pages container spans the menu's width with the grid centred.
- **THE HUE ring** `lab/picker.js :52` (`PREF0.hue`), `:94–99` `setHue` writes `--mol-hue` on `document.documentElement`; the Picker's pictures wear `filter: hue-rotate(var(--mol-hue))`. The MOLECULES rack window's thumbnails: `lab/windows/molecules.js` (grep `.webp`, `img/menu`, `mol-pic`) — they must wear the same filter.
- **QUALITY's word** `lab/windows/settings-card.js :125` `ui.gridSeg = seg({ label: 'GRID', … 64³ · 96³ · 128³ })`, seated in the QUALITY page by `lab/native-ui.js :64`.
- **The palette's words** are THE KIT's: `lab/mir/palette.js :159` `'HSV wheel (the built-in)'`, `:170` `'bipolar (Re/Im legible)'` — never edited. The app's dropdown (012 R4, `lab/palette-app.js`, the `.lw-menu` list; the app already registers its own JET BLACK at `:20`) shows the label — strip the parenthetical on the app side where the row is drawn. The plus: `lab/img/icons/plus.svg` (two strokes + six serif stubs), worn by `lab/skin.css :894–896` `.lw-icon-plus` as a mask; precached by `lab/sw.js :123` (hash moves → `node tests/pwa.test.mjs --write`).
- **DOMAIN AUTO** `lab/rack.js :324`: `half = chem.on ? chem.half : space === 'p' ? HH.domainForP(nmin) : sturm.P ? sturmHalf() : HH.domainFor(reg.nmax(1e-3))`; `lab/hydrogen.js :192` `domainFor(nmax) = 2n² + 3n + 2`; `lab/shell/controller.js :269` REBUILD when nmax moves; the molecule's rule `lab/chemview.js :703–709` (`FRAME = 20/13`, 012 O1). The ATOM system (Z ≠ 1, `lab/hamiltonian.js`, `setZ`) and the ATOMS window (`app.w.wAtoms`) — their radii scale differently from hydrogen's and `domainFor` only knows n. **Pre-library λWAVES**: the library arrived at `d0a8cf3` (0.4.0 S4a) — `git show d0a8cf3~1:lab/rack.js` / `lab/field.js` / `lab/hydrogen.js` for the old size law; the march bounds (`rp`, `rpL` in THE LOCK's leaves) moved for large molecules since.
- **The system's windows** `lab/windows/spectrum.js :35–38`: the stepper `SYSTEM` (label `:36`) under `group(wSpec.body, 'HAMILTONIAN')` `:30`; on change `molecules`/`lattice` → `layout.reopen('chem' | 'lattice')`, `central`/`cornell`/`separable` → `reopen('central' | 'separable')`, `well` → `enterBox()`, `atom` → unhide `wAtoms`. Nothing closes the window the previous system opened. `lab/rack.js :742` names the parkable windows (lattice: wLat, central: wCen, separable: wSep, atoms: wAtoms).
- **The mode under the title** `lab/windows/molecules.js :19–21`: `modeSeg` ATOMS | MOLECULES, id `lwMode`, inserted after `#title`; `moleculeMode(v)` `:22–30`; the key row `lab/shell/keys.js :83` (`mode`); the VIEW menu `lab/shell/notebook.js :110`. Icons: `lab/img/icons/library.svg · molecular.svg · atomic.svg` (012 I1), worn as masks in `lab/lab.css :920–921`. The Picker opens by `runAction('menu')`.
- **HIDE the interface** `lab/shell/keys.js :197` `toggleUI()`: `body.ui-hidden`, `mat.frame = mat.axis = false`, PRESENT; on show `metersWall = 0; govVersion = -1`. The BOX system = `well` (`enterBox`, `app.w.gas`); FRAME box = `mat.frameMode 'box'` (`lab/native-ui.js :47`). The per-frame profile: `lab/shell/controller.js :76` `perf.profile`.
- **INFORMATIONAL's seat row** `lab/informational.js :35` `row(words, ['infoPos', 'infoPad'], 'info-seat')`; the rows `lab/shell/stage-words.js :39–40`; the fold's chevron `:48–51` on its own line.
- **The sway** `lab/shell/stage-words.js :172` `createInfoLayer({ parallax: P.get('cursorAway'), drift: P.get('cursorDrift'), follow: P.get('cursorAway') })` (both default false), `:283` the live update. The kit's layer (`lab/mir/`, read-only) may still follow the pointer with `follow: false`, or the app's own CSS may.
- **The pictures** `tools/menu-thumbs.mjs` (headless Firefox over the gate kit, `--only`, writes `lab/img/menu/<id>.webp` + `manifest.json`; 252 files today; CuH and ZnH₂ have no RHF minimum, GeH₄ is HEAVY — the three without a picture since 011). The volume: `~/Documents/LAMBDAWAVES-VOLUMES/dist/vol-1/` (`index.json`, `m/`, `t/`); Yan's picture round (handoff 2026-10-19) left 7 molecules without a picture; the tool is under `tools/volumes/` (grep `picture`, `thumb`); `raw/` is never written.

## Rows and chains (BASE = this plan's commit on `yan-c`; branch `it013-<chain>`; one Opus builder per chain, rows in series, one commit per row, `research/iteration-013/<ROW>-BUILD.md` per row)

| chain · port | row | name | what |
|---|---|---|---|
| **picker** 9611 (GD 5611) | P1 | THE EDGE OF THE PAGE | a page sliding sideways is never cut at the grid's edge: the pages container runs to the menu's edge, or fades by the tag strip's gradient mask (both sides); the tiles' snap unchanged |
| | P2 | THE HUE ON THE RACK | the MOLECULES window's thumbnails wear `--mol-hue` as the Picker's do (one CSS filter; the ring's turn moves both at once) |
| | S1 | QUALITY'S WORD | the GRID word goes; 64³ · 96³ · 128³ stand |
| | S2 | THE PALETTE'S WORDS AND PLUS | the dropdown reads HSV WHEEL and BIPOLAR (the parentheticals stripped app-side; the kit untouched); `plus.svg` becomes two bare strokes (the six stubs go); sw.js by `pwa --write` |
| | N1 | THE SEAT ROW | POSITION (TOP \| BOTTOM) and PAD narrowed so the fold's chevron sits on the same row — one row less in INFORMATIONAL |
| | N2 | THE STILL WORDS | with CURSOR's PARALLAX and DRIFT off the formula and the name never move with the pointer; find who moves them (the kit's layer with `follow: false`, or the app's CSS) and still them app-side; a kit fault is one line in `docs/FOR-MIR.md` |
| | T1 | THE MISSING PICTURES | the base store's rows without a `lab/img/menu` picture (list them: GeH₄, CuH, ZnH₂, any other) rendered by `tools/menu-thumbs.mjs --only`; a row with no RHF minimum takes the library-record road if a record exists, else stays dimmed with its reason (reported); the volume's seven rendered by the volume tool into `dist/vol-1` (never `raw/`); the counts before and after |
| **stage** 9621 (GD 5621) | H3 | ONE HEADING | the stepper's word SYSTEM goes; it reads as the HAMILTONIAN group's first row (ids, `ui.hamSeg`, saved keys unchanged) |
| | H2 | THE WINDOWS THAT FOLLOW THE SYSTEM | leaving SEPARABLE closes the SEPARABLE window; CENTRAL / CORNELL (the CENTRAL window), LATTICE, ATOM (the ATOMS window) and BOX likewise — the window the stepper opened closes when the stepper leaves; a window the reader opened by hand before is left as it is if that is cheap to tell, else closed too (say which) |
| | H4 | THE STAGE'S THREE BUTTONS | under the title, a COLUMN of three icon buttons, words only as hover hints: LIBRARY (`library.svg`, opens the Picker), MOLECULAR (`molecular.svg`, MOLECULES on), HYDROGEN (`atomic.svg`, MOLECULES off — the mode ATOMS was, renamed; the default); `lwMode`'s id, the saved mode and the key row keep their ids; turning the ATOMS window ON sets SPECTRUM's system to ATOM (`ui.hamSeg` reads it back) |
| | H5 | THE HIDDEN INTERFACE'S LAG | reproduce: BOX system (`well`) + FRAME box, press H — the FPS falls while hidden and recovers on show; profile (`perf.profile` / the browser's profiler through the suites' CDP helper), name the cost, fix it app-side; if the cost is the browser's compositor, say so with the numbers |
| **physics** 9631 (GD 5631) | H1 | THE CLIPPED ORBITAL | reproduce with pictures at DOMAIN AUTO: hydrogen 1s · 2p · 3d · 4f, then the ATOM system (Z = 6, 26) and the ATOMS window, each against the pre-library law (`git show d0a8cf3~1:lab/rack.js`, `lab/hydrogen.js`, `lab/field.js` — the domain and the march bounds); find what shrank the box or grew the orbital (the large-molecule changes to the stage's math, a window — CENTRAL · LATTICE · SEPARABLE — not restoring hydrogen's state, the ATOM system's radii under `domainFor(n)`); fix at the law, not the symptom; a lower orbital never clips, a higher one may slightly; THE LOCK is never re-baked — only the leaves the restored law moved are re-captured BY NAME (`tools/digest-lock.mjs`, Yan's `gate-lock.sh` ×2 on 9241 at the merge) |

## Merge recipe (Sos)
Yan's: `git merge --no-ff --no-commit it013-<chain>` → `git checkout --ours lab/sw.js` → `node tests/pwa.test.mjs --write` → `~/.claude/jobs/2ea66c54/tmp/gate-it004.sh` → THE LOCK ×2 (`gate-lock.sh`) if `lab/field.js`, `lab/rack.js`'s domain law or the fixtures moved → commit with the rows' CLAUDE.md sentences. Order: picker → stage → physics (physics last, so the LOCK runs once on the whole).

## Assumptions (Sos; Josh overrules any by a word)
1. **H4** — LIBRARY is a door (it opens the Picker), not a third mode; HYDROGEN is the mode ATOMS was (MOLECULES off), renamed, and the boot's default as today; the Picker's own first tab stays MOLECULAR (012 L3). The three buttons keep `#lwMode`.
2. **H3** — only the word goes; the stepper keeps `ui.hamSeg`, its ids and its hover tips.
3. **S2** — the kit's labels are not edited; the app strips `(the built-in)` and `(Re/Im legible)` where its dropdown draws the row. The plus is redrawn by hand (two strokes), not by another Antigravity run.
4. **H1** — the fix restores the size law where it regressed, never shrinks the register or the LOCK's meaning; the leaves the restored law moves are re-captured by name, never re-baked; Josh's unfinished sentence ("I understand why atoms have to be clipped, but if") is read as: a higher orbital may clip slightly, a lower one never.
5. **T1** — pictures are rendered by the existing tools (the app in headless Firefox), never drawn by hand; a molecule with no RHF minimum and no record stays dimmed with its reason and is reported for Josh.
6. **P2** — the hue moves the MOLECULES window's thumbnails only (the Picker's filter), never the stage's colours.
7. **H2** — a system's window closes when the stepper leaves that system; MOLECULES' card is not closed by the stepper (it is the mode).
8. **H5** — fixed only if the cost is the app's; a compositor cost is reported with numbers, not worked around.

## Closed
| row | merged | note |
|---|---|---|
| H1 THE CLIPPED ORBITAL | `521116c` (tip `446e608`) | cause: the ATOM system's box was the occupied shells' alone (`domainFor: () => atomState().half`, since the pre-alpha freeze) while every (n ≤ 7, l) has a virtual ° row ~n² across — H 2p° clipped in ±7, C 3d° (reach 34) in ±10, Fe 4f° (reach 53) in ±12; second cause `touchState` rebuilt only when the unfiltered nmax moved. Fix: `atomHalf(nmax, reg)` = max(occupied size, every populated row's `rTab`); rebuild key follows the box. Hydrogen's law, the march box and the AUTO expression are the pre-library ones unchanged (1s/2p/3d/4f never clipped: 7/16/29/46). Large-molecule work and the windows cleared. LOCK 843/0 + 987/0, no leaf moved. Open: core labels in a heavy atom's whole box; the atom mesh's 60 a₀ cap (hydrogen 7s needs ±121) |
| H3 ONE HEADING | `e40bd98` (tip `9867c3f`) | `aria: 'SYSTEM'` instead of `label`; no gap; molecular-names re-aimed |
| H2 THE WINDOWS THAT FOLLOW THE SYSTEM | `e40bd98` | the stepper remembers the window it opened and closes it on leaving; a hand-opened one stays; CENTRAL stays between CENTRAL and CORNELL; spectrum.js at HINGE 25 exactly |
| H4 THE STAGE'S THREE BUTTONS | `e40bd98` | `#lwMode` a column of LIBRARY · MOLECULAR · HYDROGEN icon masks, hints as titles, ids kept, HYDROGEN pressed at boot (the boot mode was already hydrogen); `#lwHome` hidden; ATOMS power ON → system ATOM (click only); keys `mode` and VIEW read HYDROGEN; fits at 390 px |
| H5 THE HIDDEN INTERFACE'S LAG | `e40bd98` (report only) | NOT reproduced: headed Firefox on the GPU, BOX + FRAME box, hidden 95–101 fps vs shown 34–40; main thread < 1 ms both; the shown cost is the compositor's frosted windows; Chromium unmeasurable here (no WebGPU headless, SwiftShader headed). Needs Josh's browser / DPR / which BOX |
| P1 THE EDGE OF THE PAGE | `dfb2259` (tip `47c9ab5`) | `.mm-pages` runs 40 px (12 on a phone) past the grid under a gradient mask; pages 2·fade apart with scroll-padding; picker.js untouched |
| P2 THE HUE ON THE RACK | `dfb2259` | `--mol-hue` was written on `#lwMenu`, not the root — now on `<html>`; `.mol-pick .mol-thumb` hue-rotates |
| S1 QUALITY'S WORD | `dfb2259` | `label: ''`, aria GRID; export3d / history / field-law re-aimed |
| S2 THE PALETTE'S WORDS AND PLUS | `dfb2259` | material.js `palLabel` strips the parenthetical in what the app hands the kit; plus.svg two strokes (it had four stubs); I1-ICONS.html copies updated |
| N1 THE SEAT ROW | `dfb2259` | chevron in `.info-seat` (1fr 56px 30px); INFORMATIONAL 399 → 361 px |
| N2 THE STILL WORDS | `dfb2259` | the kit's bodies.js pushes bodies within 260 px of a moving pointer whatever `follow` says; app holds the layer (`freeze`) within 280 px while PARALLAX and DRIFT are off; FOR-MIR line; WebDriver probe 14/24 px → 0 |
| T1 THE MISSING PICTURES | `dfb2259` | base store 96/98 had pictures — CuH and ZnH₂ have no RHF minimum and no record, stay dimmed; GeH₄ already had one. VOL. I: the 7 without a picture rendered (`menu-thumbs.mjs --volume vol-1 --only`), 3,465/3,465 files in `t/`; their `thumb` fields wait for the next `pack.mjs --incremental` (not run: it would also pull the 43 solver-finished molecules and prune against the candidates — the catalogue swap is Josh's call) |

**Iteration 013 closed (Claude Sos, 2026-10-20): every row merged on `yan-c`, NOT pushed; gate green at each merge, THE LOCK 843/0 + 987/0 at the physics merge; no leaf moved.** Pre-existing red for the next sweep: `latex-copy` :147 (red on the base d830f01 too). Open for Josh: the FOR-JOSH 2026-10-20 (Sos) calls.
