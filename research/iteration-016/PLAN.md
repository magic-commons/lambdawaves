# ITERATION 016 — ALMOST THERE, AND THE EMISSION SPECTRA (planned by Claude Yan, 2026-10-25; Josh remote: "take all of the board in account and Ultrathink on the Emission Spectra new MIR window")

BASE: `yan-c` @ `39869de` (iteration 015 closed 10-24; the papers of 10-24; the solvers stopped 10-25 09:24; THE NIGHT RUN c8 writing raw/, catalogue/
and dist/ since 09:45 — never a second pack or picture job beside it). NOT pushed. The board is `RULINGS.md` (Josh's 016 note, his answers to
the sixteen calls of 10-24, his four more items); this plan turns it into rows. Everything standing stands: the kit MOVES HERE under the
trickle-down rule (`lab/mir/version.js` → **1.5.0-alpha.27** for all of 016, one line per kit change at the top of `docs/FOR-MIR.md` under
`## FROM λWAVES, FOR THE KIT (1.5.0-alpha.27)`, `manifest.py` re-hash, `lab/fonts/**` untouched), THE LOCK never re-baked (843/0 and 987/0 before
and after every row), no push / deploy / tag / release, builds tight (Josh: "don't bloat the code with random verification/gate codes"): one
node test and at most one browser test per row, the existing gates re-run, nothing new in `lab/` that is a diagnostic.

## THE ROWS

### E — THE EMISSION SPECTRA (the new window; the centre of 016)

**What a line is here.** An emission line is two eigenstates beating: populate 3d₀ and 2p₀ together and the density breathes at ω = E₃ − E₂, the
dipole swings, and that swing is Hα. The engine already knows this. `lab/dynamics.js` `dipoleLines(re, im, ids)` lists every populated pair with a
non-zero z-matrix element, its Bohr frequency under THE OPERATOR IN FORCE (`getHamiltonian().energy`: Z and μ under HYDROGEN, the Xα ZORA ε under
ATOM), its strength 2|c_a||c_b||z_ab| and the Larmor power; `radialDipole` / `angularDipoleZ` are the matrix elements; RADIATION's footer paints
that list today (`lab/radiationview.js:75`). The A ↔ B TRANSITION (`state.js setTransition`, exact two-level Rabi in the RWA) is the atom
EMITTING: A = the upper level, B = the lower, the mix sweeping from A to B while the density breathes at E_B − E_A. And `loadPreset(object,
{ hand: true })` loads a `modes` list as a hand's preset, THE FADE and one history row. So the window is THE INVERSE MAP: the strip shows lines,
a press on one populates the pair that makes it. Nothing new is computed on the frame path.

**E1 THE STRIP (the window).** `lab/windows/emission.js` `createEmission(app)` (one seat, after RADIATION's in readouts.js' third seat; the id
`emission`, eyebrow EMISSION SPECTRA, listed in + and WINDOW and the WINDOW PICKER, hidden in MOLECULES mode (moleculeMode's list), CLOSED on a
first run and for a profile older than it by INFORMATIONAL's `older` road (settings.js), its fold closed (first-run `inner`). An ATOMS window.
  - Row 1, THE STRIP: one canvas, black, the lines as vertical strokes coloured by wavelength (CIE 1931 fit → sRGB; outside 380–750 nm grey),
    their height the log of the line's strength, over a thin axis in nm. RANGE is a knob-sized seg VISIBLE | ALL (380–750 nm linear; 90 nm–12 µm
    log). Two populations are drawn: THE CATALOGUE's lines dim (every line the system in force can make, E2/E3) and THE REGISTER's lines lit in
    ACCENT A at the strength `dipoleLines` gives the prepared state — the state's own spectrum, live on every landing (the register's `version`,
    never per frame). Under ATOM the lit line stands beside, not on, the measured one when the Xα Δε misses: the gap is the engine's error,
    shown and not hidden. Hover: a hairline cursor and the kit's hover hint, `Hα · 656.47 nm · 3 → 2 · 3d₀ + 2p₀ · A 6.47e7 s⁻¹`; a wheel over
    the strip steps the hover line by line (Josh's 1a law for pickers). A press is THE HAND: `loadPreset({ id: 'emission:…', label, modes }, { hand: true })`
    — equal weights, phase 0, the pair in `modes`; one history row `EMISSION · Hα`; THE FADE names the pair; the lit line jumps to it. A restore, an undo,
    a project or link open never presses. Left press = the beat (the steady superposition); Shift+press (and the DECAY switch) = the TRANSITION
    (A = upper, B = lower, ω = the line's own Rabi default) so the atom visibly emits and settles — the existing law, labelled TOY only when A or B is composite, which a line never is.
  - Row 2: ‹ SERIES › (HYDROGEN: ALL · LYMAN · BALMER · PASCHEN · BRACKETT · PFUND · HUMPHREYS — n ≤ 7 gives each series to its n = 7 member;
    ATOM: ALL · VISIBLE · ONE-ELECTRON), ‹ PAIR › the picked line's allowed (l, m) pairs (Hα: 3d₀ + 2p₀ · 3p₀ + 2s₀ · 3s₀ + 2p₀ · 3d₁ + 2p₀ …), the
    default the strongest A; π (Δm = 0) pairs first, σ (Δm = ±1, a rotating dipole) after, each with its A in the hover record line; DECAY (switch).
  - The fold (`.lw-fold`, closed): the line table of the prepared state — λ, E (eV), ω, T, A, the pair — RADIATION's list MOVED here whole (one home;
    RADIATION keeps the far-field shape and its CALCULUS tiles; `radiationview.js` loses the list — a call, below). Nothing of the window is saved
    but its card (WORKSPACE as every card: open, closed, fold); SERIES, RANGE and PAIR are the hand's, never saved (the Picker's page law).
  - STATUS (status.js): HYDROGEN `EMISSION · computed · fine structure and the Lamb shift not included`; ATOM `EMISSION · wavelength measured (NIST
    ASD) · shape computed, one-electron Xα picture · beat at the computed Δε`. The export caption carries the pair as any state.
  - Facade `__LW.emission` { lines(), pick(id, opt), pair() } → `lw-facade.json --write`, the diff said. `tests/emission.browser-test.mjs`: a press
    loads the pair, one history row, the lit line, MOLECULES hides the card.
**E2 HYDROGEN, EXACT.** `lab/dynamics.js` gains `lineList(hamiltonian)` (the physics stays in dynamics.js — the law): every (n l) → (n' l') pair
of the 140 with Δl = ±1, E from the operator in force (so Z · μ · Ps · μH move the lines — positronium's Hα at 1312.9 nm), λ_vac = 2πc/ω, and the
Einstein A(nl → n'l') = (4/3) α³ ω³ · max(l, l')/(2l + 1) · |∫R r R′ r² dr|² (atomic units; × 4.1341e16 s⁻¹) from `radialDipole`. Oracle
(`tests/emission.test.mjs`, node): Hα vacuum 656.47 nm with μ_H (656.11 at infinite mass; NIST 656.46), Lyα 121.57 nm, Hβ 486.27; A: 3d→2p 6.4651e7,
3p→2s 2.2448e7, 3s→2p 6.3134e6, 2p→1s 6.2649e8 s⁻¹ (NIST) within 0.2 %; ⟨a|z|b⟩ = 0 for Δl ≠ ±1 to 1e-12 over all 140 × 140. A line whose upper
level is past n = 7 is drawn grey "past the register" (the Balmer limit shown as a tick).
**E3 THE ATOMS, MEASURED.** The ZORA Xα ε differences are off by tenths of an eV to an eV, with no multiplets, no spin–orbit and no terms: sodium's
D line would land in the wrong colour. So the strip draws NIST's lines. `tools/nist-lines.py` (venv python; network; run on Josh's word) queries
the Atomic Spectra Database for each NEUTRAL spectrum (H I … Og I), keeps the persistent / strong lines (relative intensity above the per-element
median, A_ki known, both configurations given), converts every wavelength to vacuum, and writes `lab/vendor/nist/lines.json` (≈ 15k lines,
≈ 1 MB): `[Z, λ_vac_nm, A_ki, rel_int, lower_conf, lower_term, upper_conf, upper_term]`. NIST ASD is a US-Government work (public domain); the
citation (Kramida, Ralchenko, Reader & the NIST ASD Team) goes into the Credits & Licenses page beside BSE's. THE TABLE IS DATA, NEVER PRECACHE: the
precache sits 0.7 MiB under its 8 MiB ceiling (`tests/pwa.test.mjs`), so sw.js lists `vendor/nist/` with `volumes/` and the pictures, fetched when the
window first opens under ATOM and kept by `library.js keepData` — HYDROGEN never needs it, so the window works offline on a first run.
The mapping `lab/emission-map.js` (pure, node-testable): parse a configuration (`2p6.3s` ↔ `2p6.3p`), the one orbital removed and the one added =
the active electron's (n l) → (n' l'), else "not a one-electron line" (grey, shown, unpressable); several NIST lines on one orbital pair (He's singlet
and triplet 1s2p → 1s2s) group under one picture, listed together in the hover. The pair loads as the atom's labels in the atom's own field
(`atoms.js rowOfNr` has every n ≤ 7 row; n > 7 is "past the register"); the beat runs at the computed Δε and the STATUS says so beside the measured
E — never a rescaled clock. Oracle: a dozen NIST configuration strings parsed (`tests/emission.test.mjs`), Na I 589.0/589.6 → 3p → 3s.
**E4 THE LOOP AND THE FILM.** A two-level state has ONE period, and RENDER's PLACE ONE PERIOD already reads `periodEnergies` from the populated
labels, so a pressed line is a loop the film renders as ONE PERIOD with nothing added; Hα's T = 2π/ω = 90.5 a.u. RATE scales it as any state.
A STILL is the dipole extreme (t = 0). THE LOCK holds no such state (no new style, no shader line): 843/0 and 987/0.
**E5 WHAT IT IS NOT.** No radiation reaction (the dipole does not lose energy; `dipoleLines`' own note), no fine structure, no Lamb shift, no
line widths; the ATOM's multiplets are not drawn (one picture per orbital pair); MOLECULES' TDA spectra in `.mol-more` are a different
instrument and stay there. The window says each of these once (the MODEL sheet gains the EMISSION paragraph).

### P — THE POLISHES (the 016 note)
P1 PALETTE: INVERT ↔ ROTATE swap seats (material.js; ids unchanged, THE LOCK untouched). P2 the ‹ MOLECULE › chooser's open list denser (the
kit's list pane: 24 → 20 px rows under `.mol-pick`; a kit change → alpha.27 + FOR-MIR line). P3 DEFAULT LOOKS: PREF `look` absent → `im` on
ATOMIC, `phase` on MOLECULAR and a volume (picker.js `lookFor(deck)`); a stored `look` wins; the first write is the reader's. P4 ESP RANGE 0.002 … 5
a.u. (log; default ±0.1 unchanged; the bar's numbers follow) — call 13 closes with it. P5 ABOUT: the λWAVES logo (Josh's new file — WHERE?) large,
the MIR mark small; the i button cycles λWAVES ABOUT → MIR ABOUT → close (kit `aboutPage` takes a list → alpha.27). P6 a palette pick turns PALETTE
ON (material.js `palPick`'s choose). P7 a SETTINGS background colour pick turns that background ON (settings-card.js).

### L — THE LOOKS (calls 1, 1a, 15)
L1 THE SIXTH TILE is ATOM LABELS: the element letters over the picture (`menu-thumbs.mjs --style labels` writes `<id>.labels.webp` = the plain
picture + the symbols at the projected nuclei, tiny, overlaps allowed; PREF `look` gains `labels`; the LOOK DROP's sixth seat ● → Aa in STIX).
L2 a wheel over the LOOK DROP (and over every stepper-shaped picker of the Picker) steps one notch per detent. L3 THE 140 ON ONE PAGE: HYDROGEN
tiles at the periodic cells' size (one grid, no pages, 14 × 10 at 1600 px), each state's picture rendered to FILL its thumbnail — `menu-thumbs.mjs`
frames by the state's own radius (`reg.reachNmax`-style r at 1e-3) so 1s reads as large as 7f; the label `3p₋₁` under each in STIX (tools/tile-check
extended to the 140 pictures' fill ratio).

### W — THE WINDOWS (calls 4–10, 14, 16)
W1 TINT UNDER THE WORDS (call 4): with FROST off, a translucent window over the stage words takes the drop-down menus' tint (the kit's `.mb-list`
tint rule generalised to a `[data-tint]` surface class; MIR OPTIONS unchanged) — alpha.27. W2 PEEK one rack per edge: stands (015 H3). W3 H ON
TOUCH: the kit's edge handle ON for a touch device only (`first-run.js isPhone/isTablet` → `edgeHandle: 'touch'`). W4 THE DJ KEYS: 60 | 120 HZ
leaves the modulation window's bar for SETTINGS › QUALITY (beside GOVERNOR); TAP · WALL | FREE · HOLD ¼ · HOLD 1 stay. W5 THE MAGNET CYCLES: when
the TIMELINE and the modulation window cannot both fit (the sum of their heights > the stage's), opening one closes the other (the door SWAPS as
015 T5; the latch too) — never stacked, never overlapping; a screen that fits them keeps the magnet. W6 THE EXPANDER'S DIRECTION: seated at the
top it hangs down; at the foot it grows upward with the bar staying put (kit `tempoPanel` `side`) — alpha.27. W7 HAMILTONIAN rows dynamic by mode as
WAVE's knobs (015 S1 did the system; this row makes the group re-lay on every ‹ SYSTEM › turn without a rebuild flash). W8 THE ACCENT B DOT: a
window whose controls carry a route (the registry's routes by `data-param`) wears a 6 px ACCENT B dot where the scroll pill's tail would start
(rack-scrollbar.js' geometry), live on route add/remove — call 14; a modulated knob a style greys (V1) is thus still told of. W9 PALETTE DELETE:
removing the palette in use changes nothing on screen (015 P3 stands); a save under a taken name becomes `name 2`, `name 3` … (`user-presets.js`
`uniqueName`, shared with SPECTRUM's presets).

### R — THE REGISTER'S FOOTNOTE
R1 the maths line at the foot of MOLECULES' two ladders and SPECTRUM's state grid is `.reg-foot`, opacity 0 until the window is hovered or
focused (one CSS rule, lab.css; reduced motion no fade). THE LOCK reads no CSS.

### V — WAVE GREYS, NOT HIDES
V1 015 W1's `STYLE_READS` keeps deciding; `ui.styleSync` sets `disabled` + `.lw-mute` (the kit's muted control look) instead of `hidden`; the seats
never move (the hand law); a routed, greyed knob keeps running (W8's dot says so). The restore path the same.

### S — ESP SOFT AND BARE
S1 ESP SOFT: the potential surface takes SIGNED's edge law — the Gaussian shell of relative width 0.32 on the density about ISO (SHELL's transfer),
weight by SOFT, φ painted on the shell's density — so SOFT reads under ESP (STYLE_READS gains it) and the hard isosurface is the SOFT = 0 limit.
One shader branch edited in the ESP style only (STYLE 11; THE LOCK's eight styles never run it). S2 BARE: a MAP ONLY switch beside RADIUS (mat
`espBare`, saved, default off) draws no sticks and no balls under ESP, and nothing beneath the map as EXPOSURE falls (the march returns the map's
colour alone). `tools/perf/esp-probe.mjs` re-run: no slower than 015 W0.

### T — ONE TIME READER
T1 the TIMELINE's t readout takes the modulation window's tempo reader's classes (the kit's `.m2-tempo` face: font, sizes, weight, tabular
figures), the two readouts one look; the CSB's t the same; 015 T1's fixed 16 ch kept (`tools/csb-probe.mjs`).

## THE ORDER
E first (E1 · E2 the same day; E3's table on Josh's word for the network; E4 · E5 with E1), then S, V, W8 (they share material.js and the
style table), then P, L, W1–W7, W9, R, T. Each row its `<ROW>-BUILD.md` with the picture (Josh: "REMEMBER TO SHARE SCREENSHOTS"), `bash test.sh
node` and the row's one browser test green, the digest lock 843/0 and 987/0, rack-deps G-G, the facade re-captured where it moved.

## THE COMPUTE
THE NIGHT RUN c8 runs (log `~/Documents/LAMBDAWAVES-VOLUMES/babysit/night-c8.log`; `DONE-c8` at the end): the potential pass in two shards (≈ 16 h),
the catalogue done 09:49 (every shape word adopted), pack 1 then the pictures and the five looks, packs 2 and 3. Nothing of 016 touches raw/,
catalogue/ or dist/; L1's `labels` pictures of the VOLUME wait for c8 to end (the catalogue's 1,115 variants in lab/img/menu are free to render).

## FOR JOSH (the calls of this plan)
1. RADIATION's line list moves whole into EMISSION SPECTRA's fold (one home); RADIATION keeps its far field. Yes?
2. The ATOM half needs one network run of `tools/nist-lines.py` against NIST ASD (public domain, cited). Run it when you say; HYDROGEN needs nothing.
3. A press = the steady beat; Shift+press or DECAY = the Rabi TRANSITION (the atom emits and settles). Right, or always the beat?
4. σ pairs (Δm = ±1, a rotating dipole) listed after the π pairs in ‹ PAIR › — or π only?
5. P5 needs the new λWAVES logo file: where is it (name and folder)?
6. W4: 60 | 120 HZ to SETTINGS › QUALITY beside GOVERNOR — right seat?
