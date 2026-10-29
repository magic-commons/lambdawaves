# The stage words: INFORMATIONAL, the captions, the ESP bar

The paragraphs below were moved verbatim from CLAUDE.md at 021 D2 and keep their iteration tags; where an older line names a file, a seat or an id a later iteration retired, the later law wins, and the laws of 021 stand first.

## The standing paragraphs

THE STAGE FORMULA (the INFORMATIONAL window since 0.5.3 M9: its own rack card, `lab/informational.js`, closed on a first run and for a
profile older than it, seated under SETTINGS when opened, listed in the FINDER and WINDOW; PREFERENCE `molFormula` / `molFormulaSize` in INFORMATIONAL's own record `lambdawaves.q0.info` since iteration 007 I (`lab/shell/stage-words.js` `INFO_ROWS` · `infoPrefs`, the kit's createPrefs; the window is built from those rows with the kit's `control()`; the blob's six keys lifted once), on by default,
50–300 %) writes what is playing on the stage as ONE block of the kit's INFORMATIONAL layer (`createInfoLayer` in `lab/shell/stage-words.js` `initStageText`, 0.5.1 D1; `lab/stage-text.js` is gone): the MOLECULES formula ($\mathrm{H_{2}O}$) while MOLECULES is on,
otherwise SPECTRUM's populated states in `stateLatex`'s prose ("$2s_{0}$ and $2p_{-1}$"; A ↔ B under a TRANSITION) — never a
live coefficient. The layer has no subject, no features and no labels; parallax, drift and following are off unless INFORMATIONAL › CURSOR (AWAY · DRIFT, off on a first run) turns them on, and is NEVER told of a
camera move (`viewChanged()` only when the racks hide or slide, the transport docks or moves, or the TIMELINE opens or docks (kept for the size); the
kit's ResizeObserver covers a size): idle it writes nothing (D1-BUILD U2: 0 records over AUTO-ROTATE and a pointer sweep).
Its key is the string it would render: a changed string is `remove()` + `addBlock({ md })` (the kit's exit and entrance), KaTeX
runs at most four times a second, and nothing is added while STAGE FORMULA is off (the root `hidden`). It wears the kit's look —
ink, the feathered shade, the serif face — at the kit's seat: the free stage's top + 12 %, between the racks, clear of the
undocked transport (`avoid`; since iteration 015 H2 the TIMELINE and the modulation window are not dodged — the words go under them); under every window (`.mir-info.lw-stage` z 20 < the racks' 30, `lab.css`),
never a pointer target, never in the occlusion mask. THE KINDS (iteration 007 I): every announcement is `stageText.say(kind, text)` — `preset` (THE FADE), `head` (THE HEAD), `registry`, `view`, `orbital`, `basis`, `rate`, `style` (pop-ups) — and is written only while INFORMATIONAL › ANNOUNCE has that kind on; Josh 10-18: the formula and the atom labels ON, every kind and NAME OFF on a first run (the say verb and ASK stay raw `announce`). Since iteration 012 R1 INFORMATIONAL's STATUS is the title bar's Aa (struck = hidden; the record's `status`), its headings THE WORDS and ANNOUNCE · CURSOR · MARKS are hidden, SKELETON reads BALL AND STICK (key `skeleton`) with OPACITY (`skeletonOpacity`) between it and SIZE, the dipole arrow it drew is MARKS › DIPOLE (`dipole`, off by default), ORBITALS is one switch for the `registry` and `orbital` kinds (`sayRegistry`), CURSOR (PARALLAX = `cursorAway` · DRIFT) and MARKS (BEAD · UNCERTAINTY · DIPOLE) are two columns. THE FADE: a HAND's preset (SPECTRUM's PRESET — a pick of the one shown reloads it — the register's eight ORBITAL presets — HOMO · LUMO · HOMO + LUMO · FRONTIER FOUR · HOMO SET · LUMO SET · WINDING · OCCUPIED, one table in `lab/orbitalsview.js` since 0.5.3 M10; iteration 012 R2 added ALL ODD · ALL EVEN (every other ladder line from the first valence line, a degenerate level one line) · BELOW HOMO · ABOVE LUMO · VIRTUAL · DEGENERATE · INVERT to the same table, and the METHOD | ORBITAL row is `.mol-mrow`, the dial levelled by relative offsets (a margin there loops the register's ResizeObservers) — and its STATES presets) is announced as the block (`data-fade`, the heading size) for 2.4 s — the formula leaves and
returns, and the kit's exit is the fade — `WINDING · $1e_{1g}$ (a) + (b)`, the names from `lab/names.js`; the press threads
`{ hand: true }`, so a restore, an undo, a project or link open never announces (`tests/stage-text.browser-test.mjs`). THE HEAD (0.5.1 D2): a HAND pick of a molecule — the MOLECULE dropdown,
MOLECULES ON, a notebook `lw:molecule=` link (chemview's `hand`) — shows its head in THE FADE's seat once that molecule's solve
lands: five lines from `latex-state.js` `moleculeHead` (formula and name; RHF/basis and E; nocc of nAO and the point group, "—"
where the record has none; the HOMO's name and the HOMO–LUMO gap; 0.5.4 P4's molecule-level STATUS, `lab/status.js` `head`: the
STATE word, the agreement with PySCF's energy and, on the 36, "geometry computed, not measured"), every number the record's `stem` or the live solve's through
`stemOf`, the composition `tools/orbital-library.mjs` writes into every stem — never the blurb, never CURATED_IE
(`tests/molecule-head.test.mjs`). It is held (`announce(md, 0)`) until Escape, a press on the picture after 2.5 s, or the next
pick, and a restore, an undo, a project, link or demo open never shows it (`__LW.head.shown`;
`tests/molecule-head.browser-test.mjs`). HOLD (I,
the kit's `infoActions` row; `lab/key-table.js` carries a row's `up`) holds the words still while the key is down. Its second
row governs the ATOM LABELS (PREFERENCE `atomLabels` / `atomLabelsSize`, on by default, split from the formula's at 0.5.3 M9), λWAVES' own letters (R6-L; kit labels are D1b, Group II): each MOLECULES nucleus marked
with its element symbol at its projected position (`lab/shell/stage-words.js` `atomLabels` through `field.js` `toScreen`, written only when the camera, molecule, size or canvas changed),
white under `mix-blend-mode: difference` so they invert whatever is beneath them. An absent `atomLabels` / `atomLabelsSize`
takes the stored `molFormula` / `molFormulaSize` once (a 0.4–0.5.2 profile with STAGE TEXT off keeps its labels off); the next save writes all four. Its third row is STATUS (0.5.4 P4; no key, no window, no badge): the kit's wide readout of what the stage may claim, from
`lab/status.js` `statusOf` (pure) — EXACT · NUMERICAL · UNCHECKED and the picture's number in its metric; MOLECULES' kept line per VIEW with its molecule-level
line beneath, else the owner's — written on a landing, a VIEW or FLOW change or an owner change, never in a frame (`tools/status-probe.mjs`); a tap opens the
MODEL sheet, which defines the words; LEAN leaves it alone (`window-chrome.js`). The type scale is the notebook's three sizes: the formula
its title (34 px), an announcement its heading (22 px) — the kit's `--info-size-body` overridden in `lab.css`, each held to 8 vw
and at least 16 px — an atom label its body (14 px); the formula and an announcement × STAGE FORMULA's SIZE, an atom label × ATOM LABELS' SIZE. It never reaches an export: a picture, a loop and a video carry
instead its one plain-Unicode CAPTION — the stage's words, then ` · ` and the STATE word (`H₂O · 1b1 HOMO · STO-3G · NUMERICAL`, `1s₀, 2p₀ · EXACT`;
0.5.4 P4c: `lab/windows/film.js` `caption()`, read at the take, one function for the film and the picture) — drawn by `lab/capture.js` `drawCaption` and
following STAGE FORMULA: off, no caption and no word (D5, Group II, replaces it).
THE QUIET STAGE (iteration 011 Q1; Josh 10-19: "For the informational, also include a button that hides the extra status thingy. When switching
between different hamiltonian systems (which usually adds a lot of different orbitals), have the informational automatically hide ultra large lists so
it doesn't fight the screen and users don't have to keep toggling it on and off just because a certain mode uses an obscene amount of 140 levels." …
"move skeleton into it's own row amongst stage formula and atom labels with a size knob to increase the disk size"): three rows of the same record,
`lambdawaves.q0.info`. STATUS (`status`) shows or hides INFORMATIONAL's STATUS readout — the only status block the stage words draw (the stage
itself writes the formula, the atom labels and, opt-in, the pop-ups, THE FADE and THE HEAD; research/iteration-011/q1-shots/before-*.png) — OFF on a
first run, ON for a record older than the key (it saw the readout); hidden, the line is still kept current; the export caption's STATE word is not
its. THE LIST CAP (`listCap`, NAME's row, 4 … 140, LOG, 16 by default = the longest LOAD VALENCE): a SPECTRUM list (either side of A ↔ B) longer than
the cap is written as its count — `stage-words.js` `capLine`, "140 levels · 7 shells" (labels · distinct n) — on the stage and in the caption, and
returns as the list once it fits; nobody toggles anything; a molecule's formula is untouched. SKELETON (`skeleton` · `skeletonSize`) is THE WORDS'
third ON + SIZE row (BEAD and UNCERTAINTY stay in MARKS): FLAT disks, no outline (`lab/skeleton.js`), radius SIZE × 0.28 × r_cov — 100 % is the old
disk (water's O 20.5 px at the first-run camera), the default 160 % (33.6 px), 50 … 400 %; the bonds and the dipole keep their 2 px. The frame reads
the knob's widget (`ui.skeletonSize`), as it reads `ui.skeletonSw`; SKELETON stays off by default, so THE LOCK cannot move; the far half glides (bead 0.9 − 0.4 s, bond 0.7 − 0.35 s, s a smoothstep over the molecule's depth, 012 O1), never a step.

THE STAGE NEVER FOLLOWS THE FURNITURE (S5): the stage text and the ESP bar seat themselves on the racks' and the bar's RESTING boxes (`stage-words.js` `resting`), so ◧/B, a peek or the bar's drop moves nothing on the stage — a recording never sees the furniture move; only `rack-l · ui-hidden · phone` and the transport's own class re-place the words; a rack with no open window still frees its side. H HOLDS THEM TOO (022 E1): under `ui-hidden` the words, the pop-ups and the ESP bar keep the furniture's resting boxes and the stage box they were last placed against (`rest()`, lab/shell/stage-words.js:189), so the whole interface going out moves nothing on the stage. ONE PRESS, ONE PLACE (S1): the bar's INFORMATIONAL button applies STAGE FORMULA OFF first and ON last, OFF dropping the block inside the hidden root, so ON is one entrance; the bar's peek lives only in `rack-wiring.js` and is armed once the pointer has left the bar since the hide. MAP ONLY also hides BALL AND STICK's 2-D sticks; Firefox holds at two frames in flight only behind a > 250 ms backlog (`field.inFlightCap`, S2); CAMERA's verbs are two rows (PAN HOME · HOME / LOCK · FLIP · AUTO-ROTATE, S3); ESP RANGE runs 0.002 … 50, logarithmic, fewer decimals above 1 (S4; the 016 line "0.002 … 5" is history).

THE WORDS ARE LIVE (023 R7): the furniture the words seat on is which racks hold an open window (watched over both racks) plus `rack-l · ui-hidden · phone` and the bar's class; a re-seat LANDS (the kit's `viewChanged({ land: true })`, 1.5.6-alpha.11) at once, even under the pointer's hold; only a new string runs the kit's exit and entrance (1467 → 83 ms from the change to the words at rest). A LEFT or RIGHT ESP strip is seated from the stage edge and its racks only (`free(false)`), never from the bar; its unit (φ, a.u.) is ESP BAR's hint, not a caption.
