# λWAVES' icons — the brief for Gemini (022 E2; Josh runs it, not an agent)

THE LAW (lab/icons.js, docs/laws/shell.md THE ICON TABLE): the inner markup of a 24-unit box, live area 2–22, stroke 1.9, round caps and
joins, `currentColor`, solids `fill-rule="evenodd"`; drawn at 16, 20 and 24 px; named for the MEANING (camelCase), never a letter; no
gradients, no text, no transforms except NODES' `scale(1.5)`. The sheet: `research/iteration-022/E-shots/glyphs-{16,20,24}-{light,dark}.png`
(the kit's names ink, λWAVES' accent; `node tools/glyph-sheet.mjs` re-shoots it). Redraw only the names below; keep the names.

spectrum — SPECTRUM: emission lines of different heights on a baseline · wave — WAVE: a wave packet under its envelope
clip — CLIP: a box and the slab it keeps · field — FIELD: a plate and its field lines (arrows)
separable — SEPARABLE: a cube (x · y · z apart) · central — CENTRAL: a radial well and one bound level
lattice — LATTICE: a 3 × 3 of sites · emission — EMISSION: an atom sending a photon (wavy arrow)
bloch — BLOCH: a sphere, its equator and the state's arrow · plane — the SLICE plane: a tilted square and its normal
calculus — CALCULUS: the integral sign · ladder — LADDER: rungs (a†, a) · wigner — WIGNER: a contour map
shadow — SHADOW: a disc and its cast · orbit — ORBIT: an ellipse, the body on it, the focus
vortex — VORTEX: a spiral · meters — METERS: a gauge · radiation — RADIATION: a source and its rays
equalizer — EQUALIZER: bars · controlSurface — the CONTROL SURFACE: a fader and a knob
history — HISTORY: a clock turned back · keyboard — KEYBOARD: keys · notebook — NOTEBOOK: a bound, lined page
informational — INFORMATIONAL: an i in a speech line · palette — PALETTE: a ring of swatches · lens — CAMERA: a camera's lens
about — ABOUT: the λ mark · timeline — TIMELINE: lanes of clips and a playhead · film — RENDER: a frame with a play
picker — the PICKER: a shelf of tiles, one picked · transition — A ↔ B: two levels, the jump, the photon
Also look at: cogSolid at 16 px, molecule, atom, foldAll / unfoldAll, heart, sun, moon, rackToggle, arrowLeft / arrowRight.

THE COMMAND (from the λWAVES worktree; `agy` 1.4.2, the model of 012 I1 — check `agy models` first):

    agy -p "$(cat research/iteration-022/ICONS-FOR-GEMINI.md) Look at research/iteration-022/E-shots/glyphs-24-light.png and glyphs-16-dark.png. Redraw each name above under THE LAW and answer ONE JSON object { name: innerMarkup } and nothing else." --model gemini-4-argon-medium --output-format text > .tmp/icons-gemini.json

Then an agent pastes the answer's entries over the same names in `lab/icons.js` ICONS, re-runs `node tools/glyph-sheet.mjs`, grades the
sheet, and runs `node tests/pwa.test.mjs --write && ./test.sh node`.
