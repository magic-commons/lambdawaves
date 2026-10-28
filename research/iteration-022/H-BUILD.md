# 022 chain H — THE WORDS (Opus builder, worktree agent-a934fef6a0d0a7cfe, branch it022-H, BASE a044ec99)

## H1 HINTS ≤ 60 (b8cb27f2)
`tools/hints-census.mjs` (45 lines) reads `hint:` `title:` `tip:` `knobTitle:` `.title =` and the 2nd argument of `hint(` `ariaLabel(` `keep(`
(comments blanked; a ternary's branches apart, a `+` chain summed, `${…}` = 3); `--check` exits 1 over 60 and is one line of `./test.sh node`.
| | hints | ≤ 40 | 41–80 | 81–140 | > 140 | over 60 |
|---|---|---|---|---|---|---|
| app at BASE (the final tool) | 405 | 170 | 122 | 84 | 29 | **167** (152 at d627b32) |
| app after H2 | 445 (+36 action `hint`s, +4 knob titles) | 317 | 128 | 0 | 0 | **0** |
| kit (lab/mir, untouched) | 428 | 286 | 112 | 27 | 3 | 65 → FOR 1.5.6 |
A runtime sweep (every window open, `[data-help]` > 60) found what no census sees, fixed too: the MOLECULE chooser's 350-char CAP_RULE, B_TITLE,
LDA_T, the PULSE seg, the section stepper, the mode column's HYDROGEN, the lone-atom looks, SPECTRUM's system tip (name · word now), FIELD's
SQUEEZE-IN/CAT (+ SQUEEZE_REFUSAL gone), EQUALIZER's why, the MORPH `knobTitle`s, STURMIAN's five `keep()` refusals (in H2). It now finds only the
kit's strings and EMISSION's head tip (the kit composes eyebrow + status).
RESEARCH-U's 40 as shipped (≤ 40 unless marked): UNCERTAINTY "Position spread ellipsoid (√λ axes)" · KNEE "Opacity curve · 0.6 = exponential" ·
STATES FLOW "Current tracers v = j/ρ (direction exact)" (41) · BEAD "⟨r⟩ bead and its trail" · STAGE FORMULA "Write the playing state on stage" ·
LIST CAP "Longest state list written in full" · METERS "f16 grid vs exact, per voxel" · defect "basis defect · {M} pts · {p} % near nuclei · {ms}
ms" · STATUS "STATUS under the formula" · SQUEEZE "Squeeze r (cap 0.33)" · AUDIO IN "The faders follow the first AUDIO device" · the download seat
**glyph + "{name} · {mb} MB"** · PRESETS "Name a hand-picked preset" · DIPOLE "Dipole arrow (a.u.)" · HEAD "Show the picked molecule's head" · Δρ
"ΔD since the kick, signed" · IONIC "Dotted ionic/dative bonds" · BALL SIZE "Ball size × covalent radius" · a volume page "{volume} · {sub}" ·
register PRESET "Register preset" · SUBTITLE "Isomer tags under the name" · MIX "MIX: the lit lines in phase" · ORDER "Double and triple bonds" ·
ESP LIVE "ESP: re-solve live (≤ 1/s)" · VALENCE "Valence density (core removed)" · gui.js:498 (kit, listed) · INTER-SHELL "F = {F} · NUMERICAL
({ms} ms)" · ESP RANGE "ESP colour span ±RANGE Eh/e" · "Dipole scope δμ(t)" · "Excited states: ω (Eh), stick height f" · ESP "ESP map on the
surface (red −, blue +)" · PAD "Formula margin" · SONG "Drive H with the track's E_z(t)" · MOLECULES FLOW "Current tracers (kick + RUN)" · "STATES
lane {i} phase" · SIDE **glyphs** + "ESP bar side: RIGHT → LEFT → TOP → BOTTOM" (41) · LOCK "LOCK: pan and zoom at centre" · the probe "Electron
potential at each nucleus (a.u.)" (41) · EMISSION "Play A ↔ B (Shift: once)" · the MO ladder "MO ladder ε_k (Eh): click adds, right-click removes".
**Moved to the window's ⓘ (12):** MOLECULES — CAP_RULE whole (a new note); WAVE (Draw style) — ESP's signed-log span, LIVE's "off, once per
molecule, basis and VIEW"; CAMERA — LOCK is the classic camera; INFORMATIONAL (new note "The words.") — STAGE FORMULA captions every export / off
none, a list over LIST CAP is its count; MO-REGISTRY (Model) — the ladder's compressed axis, the preset glossary; STATES (Model) — stick height f
and hue = the dipole's axis, line = slosh / circle = ring current, FLOW's exact-direction claim; FIELD (Impulse) — SQUEEZE's 0.33 cap. The rest cut.
**Glyphs for words:** `download` + "{mb} MB" (MOLECULES' download seat); four new drawings `sideRight · sideLeft · sideTop · sideBottom`
(lab/icons.js) — INFORMATIONAL › SIDE wears its side, no word (aria "ESP bar side: {side}", `data-side`; tools/b-shots.mjs re-aimed); `molecule`
+ ON (H2). CAMERA's verbs keep their words (they fit; HOME · PAN HOME are the kit's panel; a glyph `sw` drops the lamp).
**`hint` (≤ 40) on 36 registry rows:** camera.panHome · camera.lock · pan ×4 · slap · preset.next · ballStick · hide · next/prevWindow ·
info-hold · modulation · nodes · windowPicker · timeline · gui · mapping · photosensitivity · update · csb.search · modArm · modBar · csb.expand ·
folds · info.all · save · folders · new · export.mir · export.png · import · knob.copyId · knob.route · control.learn · esp.side ·
settings.playLock · `window.<id>.solo`; nodes.escape's label shortened. The seats read `word ?? (hint || label)` (shell/transport.js), the MAPPING
`hint || label` (mapping.js); menus already did. The VERBS rows' labels are the verb table's docs, not hints: untouched.

## H2 LABELS
| before | shipped | the rest |
|---|---|---|
| Z RANGE  a₀ · P RANGE  a.u. (WIGNER) | Z RANGE · P RANGE | `fmt` "± 8.0 a₀" · "± 2.00 a.u." |
| EXTENT a₀ (SLICE) | EXTENT | `fmt` "±8.0 a₀" |
| RATE a.u./s (the bar) | RATE | `fmt` "4.0 a.u./s" (the value pill); its favourite face read "RATE a.u.…" |
| STARK K_z · DEFECT L² (FIELD) | STARK · DEFECT | readouts e^{−iθK_z} · e^{iαL²}; hints "STARK K_z: turn e^{−iθK_z}" · "DEFECT L²: wait e^{iαL²}" |
| SQUEEZE r | SQUEEZE | hint "Squeeze r (cap 0.33)" |
| ELEMENT  Z · λ  SCALE (SPECTRUM) | ELEMENT · SCALE | "Z = 10  Ne" · "λ = 1.000"; hints name Z and λ |
| HALF-WIDTH (SETTINGS) | WIDTH | hint "The domain’s half-width, ± a₀" |
| AMPLITUDE (VIBRATE) | SWING | hint "Amplitude in Q₀ (harmonic to 2 Q₀)" |
| MOLECULES ON | glyph `molecule` + ON | aria-label MOLECULES ON; its undo row reads "ON · MOLECULES" |
| OVERLAY ON FIELD (VORTEX) | OVERLAY | hint "Draw the nodal lines over the field" |
| favourites cell 48 px | 56 px (csb.css; the strip wraps) | STRENGTH · ZEEMAN B · ROTATE z are no targets: never favourites |
| BRIGHTNESS · SATURATION · SHINE SOFT | kit — FOR 1.5.6 | |
Ids, keys and targets unchanged. **`tools/label-fit.mjs`** (37 lines): every rack window open, reset and every inner fold open on 300-px racks;
labels (`.k-lbl .fd-lbl .sw-lbl .trig-l` + the favourites) whose scrollWidth > clientWidth; a HYDROGEN and a MOLECULES pass; `--favs` seats
EXPOSURE, RATE. **Before (H1 tree): 147 + 109 labels, 1 over (RATE a.u./s, 48/52 px). After: 147 + 109, 0.** S/V had already widened the knobs
(WIGNER's "P RANGE  a.u." 59/62), so at 300 px the table's renames are clarity; RATE was the one spill.

## Pictures (research/iteration-022/H-shots/, `tools/h-shots.mjs tips|labels <tag>`)
tips-before/after.jpg — KNEE, STAGE FORMULA, LIST CAP, LOCK, VISUALS: the 280-px tip at 48–78 px (2–5 lines) → 158–216 × 33 px, one line.
labels-before/after.jpg — SPECTRUM's HAMILTONIAN (ATOM), WIGNER, FIELD (folds open), MOLECULES' top row, the favourites (EXPOSURE · RATE).

## Tests
`node tests/pwa.test.mjs --write && ./test.sh node` GREEN (hints-census --check in it) · rack-deps HOLDS (persist 24) · 0 app cycles. Browser
(9683/5683): hide-reveal, stage-text, keyboard-window, menubar, chem (L6: the chooser's help says "cap is benzene … disabled"), field-law,
picker-looks, current, history (re-aimed: `__knob('ELEMENT')` and its row "ELEMENT · SPECTRUM", MOLECULES ON by aria-label, rows "ON ·
MOLECULES") GREEN. RED AT BASE TOO (each re-run on a BASE server): latex-copy :81 (the row "COPY the state as LaTeX" is gone from EDIT),
camera-shift (PAN HOME, 1 failing), take-in-bugs :95 (WIGNER's status under MOLECULES). The LaTeX hint keeps "chemistry order" (latex-copy :82).
THE LOCK `--check --query gastab=0`: GREEN 843 · 0 · 0 errors; no leaf moved.

## The docs/laws sentence (written: docs/laws/shell.md, the laws of 021 block)
A HINT IS ONE LINE (022 H1): every hint λWAVES writes is one line of ≤ 60 characters (≤ 40 where it fits) read by the kit's one tip; a second
sentence worth keeping lives in the window's `.note` (its ⓘ); a glyph replaces the words where one exists; an action whose label is over 40
carries a `hint` (≤ 40) the seats, the menus and the MAPPING read; `node tools/hints-census.mjs --check` is its gate. (For CLAUDE.md at the close,
with it: A LABEL IS NEVER WIDER THAN ITS CONTROL — a unit rides the value, a symbol the hint; `tools/label-fit.mjs` reads 0.)

## FOR 1.5.6 (the kit's; not changed; one line in docs/FOR-MIR.md)
65 hints over 60 (`node tools/hints-census.mjs --kit --full`): **shell/gui.js:499 LIGHT ANGLE (146) first**; modulation/window.js:2639 (283),
1890, 2086, 2014, 1988, 759, 1661 · panels/curves.js:100 (154), 321, 369 · modulation/mod.js:2494, 2524, 2554 · panels/camera.js:308, 263, 365 ·
panels/xy.js:435, 344, 401, 541, 379, 418 · panels/grade.js:172, 262, 46, 44, 51 · render/panel.js:370, 366, 391 · shell/gui.js:403, 506, 504, 452,
419, 429, 501, 469, 500 · panels/camera-rig.js:80, 78, 84, 76, 88, 90, 86, 98, 93, 99 · plane-model.js:15 · panels/lanes.js:235, 221 ·
timeline/shortcuts.js:78, 61, 92, 80 · shell/transport.js:439 ×2 · panels/ramp.js:136, 159 · timeline/editor.js:89 · keyboard/keyboard.js:116 ·
shell/notebook.js:520 · timeline/audio-drop.js:33. The three gui labels wider than their knob: BRIGHTNESS (gui.js:419), SATURATION (:429), SHINE
SOFT (:505). A 1.5.6 round rewrites them in the English pack, the second sentence to the panel's ⓘ.

## Open questions (Josh at 023; defaults shipped)
1. FIELD's rate row keeps SPIN K_z · SPIN L² (they fit) under STARK · DEFECT. 2. AMPLITUDE → SWING. 3. MOLECULES ON's undo row reads "ON ·
MOLECULES". 4. A volume tile's hint is its data (title + blurb), unbounded; EMISSION's head tip is the kit's eyebrow + status. 5. CAMERA's verbs
keep words. Defaults: as shipped.
