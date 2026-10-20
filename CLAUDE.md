# λWAVES

MIR owns generic instrument behavior. Before changing modulation controls, read
`lab/mir/modulation/modwindow/host-contract.md` and the upstream
`/home/joshua-hosain/Documents/MIR/PROMPT.md`. Update MIR first, adopt it, then
adapt λWAVES' side of the seam (`lab/mod-port.js`, `lab/shell/modulation.js`); do not edit adopted files under `lab/mir/`.
The modulation port is `lab/mod-port.js` (the object `createModulation(port)`
takes, key for key with MIR 1.5); THE play is `onePlay` in `lab/clock.js`, and
the modulation follows every edge of it, armed or not (the MOD power is a route bypass), holding the kit's
`demand('app.play')`, so a play is never refused for want of a route or an open
editor (0.5.0 A5/A6; LINKED/SEPARATE retired at C4 — one clock, no link).

MIR 1.4.2 restores FL Studio's curve workflow: right-drag empty space adds and
places a point; Shift-right-click adds at the curve's current value; left-drag moves a point or tension handle; Ctrl fine-tunes
tension; right-click resets a tension handle; Alt-left-click deletes a point;
Shift locks a moved point's value and Ctrl locks its time. Plain left-click on
empty space is inert. A deterministic analytic wave becomes its equivalent
editable curve on first edit and must never demand a preset first.

MIR 1.4.3 starts a new LFO on the editable SINE preset. An explicitly chosen
analytic wave or an older saved source retains its mode. Double-clicking an
LFO or ENV tension handle resets that segment's tension, as right-click does.

Run `bash test.sh node` and the focused curve/impulse browser regression before
shipping modulation edits. Keep `tests/render-regressions.browser-test.mjs` as
the permanent guard against the paused-redraw, scaled-hit-test, and impulse
overlay regressions.

The 0.2.0 alpha molecular UI is MOLECULES (`chem`) and MO-REGISTRY
(`orbitals`). Keep those saved IDs, `chem.*` and `reg.*` modulation targets,
and the `mol-*`/`reg-*` CSS hooks stable. The old H₂⁺ `molecule` card was DELETED
in 0.5.0 D9: an older project whose field it owned opens as MOLECULES · H₂ on σg
or σu (the minimal-basis shape of its orbital; RHF cannot hold one electron).
MOLECULES and MO-REGISTRY sit on the first-run LEFT rack under INFORMATIONAL and
SPECTRUM; since iteration 001 (2026-10-16) EVERY first-run window arrives FOLDED
(`lab/first-run.js` FOLD_ALL), unsolved until MOLECULES is switched on;
a restored project whose field owner is MOLECULES brings them back onto the rack
(MO-REGISTRY too when that file's register is on). Since iteration 002 there are
TWO MODES, ATOMS | MOLECULES (`#lwMode` under the title, windows/molecules.js
`moleculeMode`): the mode IS MOLECULES ON, and each mode HIDES the other's
windows — ATOMS: SPECTRUM, STATE, EQUALIZER and the atomic instruments;
MOLECULES: the one MOLECULES card (hidden, never closed or moved). Its REGISTRY ON switch sits beside the
ORBITAL | STATES seg (registerview.js). Long windows fold their details behind
one chevron (`lab/fold.js`, `.lw-fold`): MOLECULES, SHADOW, CAMERA, MO-REGISTRY. MOLECULES' first row is the SECTION header, which is the library's page turner (0.4.0 S4b; 0.5.3 M8, as Josh drew it): the kit's `stepper` in PALETTE's preset look (‹ NAME ›, a whole line; its name opens the kit's list, its hover carries the section's record line, `__LW.chem.section().sub`), and since iteration 008 V ‹ SECTION › turns, after the six, every readable volume's pages — one per primary tag (‹ VOL. I · AMIDE ›; a one-atom entry on none; read when the hand nears the pickers, never at boot) — and the MOLECULE stepper's name carries the molecule's picture or, off the device, the kit's download glyph whose press keeps THAT molecule with the kit's ring (`volumes.js` `installMolecule`, `statusOf` partial; a pick opens through `openVolume` without keeping); `volumes.js` `watch` tells the card of the Picker's INSTALL / REMOVE (INSTALLED left the card); the MOLECULE picker below is a second stepper whose name IS the `<select>` (optgroups, disabled reasons and native keys kept; ‹ › and ← → walk the page's enabled rows as a hand pick) and holds that one section
(DIATOMICS · HYDRIDES · ORGANIC · BIO · LATTICE · HEAVY, `lab/molecules.js`
SECTIONS), a pick elsewhere turns the page, and the page is never saved. A
library record ships only through `tools/orbital-library.mjs`'s diversity
gate, and a molecule past the live cap opens only from its record (DOWNLOAD,
never DISABLED). Since iteration 008 U MOLECULES is THE ONE CARD: MOLECULES ON · ORBITAL | STATES (`.mol-top`), the register's ladder right
under it (`.mol-reg`; MO-REGISTRY's `orbitals` seat retired through RETIRED_WINDOWS, its ids and `reg.*` targets kept), then ‹ SECTION ›,
‹ MOLECULE › (a record-only molecule's download glyph in its name), BASIS, VIEW in two rows of three (`.mol-view`: DENSITY · ORBITAL ·
MIX / ESP · SPIN · Δ LDA−RHF; MIX's id is `registry`), METHOD · VALENCE or the ORBITAL dial (one seat, 0.4.0 S4c) and the fold (five lines at 300 px and at
phone width, 0.5.3 M8). MOLECULES ON IS REGISTRY ON: a register has the field under VIEW MIX (the saved id stays `registry`: projects, `lw:view=registry`, the verb, `LW.setView`) and its pane. THE ONE LADDER (iteration 008 R): the ladder carries two marks — the register's lit levels and the ORBITAL dial's CURSOR, a bracket round its row in the theme's ink (a degenerate row bracketed AND lit whole — iteration 009 D, Josh: "when the knob lands on a degenerate pair, light both lines" — while VIEW ORBITAL still draws the one orbital the dial names; a modulator on `chem.orbital` lights the row the same way and never moves the VIEW; the cursor as last painted is `orbitals.state().cursor` ({ k, row, lead }; its lit lines are `row` while it leads — iteration 010 X6), the ladder's own `rowsOf()` grouping (|Δε| < 1e-6) — never a second degeneracy rule), never a saved key (it IS `chem.orbital`); under VIEW ORBITAL the cursor leads and the register's marks step back, under every other VIEW the reverse. THE HAND DECIDES THE VIEW: a stroke → MIX (normalised at its end); a HAND turn of the dial (drag, keys, routed or not) → ORBITAL and the ORBITAL pane; a modulator stepping `chem.orbital` moves the cursor, never the VIEW; an undo, a restore, a project or link open move neither. MOLECULES OFF dims the ladder (`.mol-reg-off`); Δρ is a switch beside KICK; EMPTY ↔ FILL ALL is one button; NORM is gone
MOLECULES keeps KICK / RUN / TDA / the spectra in the `.mol-more` fold: folded
on every first run, desktop too (iteration 001, Josh; `first-run.js` `more: false`), its state in the card's WORKSPACE
record (`more`); its `Aa` stays visible with HELP off. THE CHEM WORKER REFUSES (0.5.4 P6, `lab/worker-pool.js`): once it has answered, an error or a
timeout is `{ error, refused }` ("pick the molecule again"), never re-run on the frame thread; it respawns once, then refuses; only a worker that never
answered (no module Worker, a construction throw) keeps the frame-thread road (`tests/worker-pool.test.mjs`, `worker-refusal`). A solve's `sol.identity`
(`molecule-state.js` `identityOf`, P1) is DATA, never a stamp — `sol.hash` stays the basis hash.

THE PAINT GESTURE (`lab/paint-stroke.js`) is one law for the ORBITAL and STATES
ladders and SPECTRUM's state grid: LEFT click adds one, LEFT drag adds every
item it crosses; RIGHT click removes one, RIGHT drag removes every item it
crosses (Alt/Option+left = right; a finger = left). A crossed degenerate row is
taken whole. One stroke is one undo row. The same module holds what the three
ladders share (iteration 009 F2): EMPTY ↔ FILL ALL (`fillButton`, one glyph,
SPECTRUM's head too) and THE LEVEL LINE (`levelLine`: off at α 0.42 and w px,
on at full strength and w + 1 px; SPECTRUM and ORBITAL w = 1, STATES w = the
oscillator weight; `fade` steps a mark back). The register's A ↔ B MORPH is
`lab/register-morph.js`: its `load` and `reset` set `.reg-morphing`, so a
restored MORPH dims the lanes exactly as a hand-set one, in both panes.

The five LEGACY windows are DELETED (0.5.0, R5-L1): QCD, H₂⁺ and HELIUM in D9,
H₂ and ELECTROSTATICS in D9b. An older file that used one opens on its shim and
says so in one line (`retired in 0.5.0: …`, PROJECTS and STATE status): a QCD
seat without the window (QUARKONIUM keeps `instruments.qcd`), H₂⁺ as MOLECULES ·
H₂ σg/σu, HELIUM as ATOM · He 1s, H₂ as MOLECULES · H₂ density, an ELECTROSTATICS
overlay as nothing drawn (`docs/LEGACY-WINDOWS.md`; `tests/fixtures/legacy-*`).
ATOMS left that list in 0.4.0 (R-A2): it is the periodic-table window — H–Kr
cells in SPECTRUM's own picker, periods as columns on the card and a phone and
rows floating, its Δ-SCF / quantum-defect / α-order readouts kept — since iteration 008 Z the ATOM's central field is SCALAR ZORA (`lab/atoms.js` `zoraKinetic`: −½(K u′)′ + [K′/2r + K l(l+1)/2r² + V] u = λ u, K = 2c²/(2c² − V); the scaled eigenvalue reported, the Δ-SCF ion in the neutral's K, spin–orbit not included), and since iteration 009 MV its exchange is MacDonald–Vosko's relativistic one (`mvR`/`mvPhi`: V_x·R(β), E_x·Φ(β), β = (3π²ρ)^{1/3}/c, R = Φ + βΦ′/4; on the ZORA road only, no switch) — the light 1s shift NIST's to ×0.60 (Ne) … ×0.97 (Rn), the scaled total's shift NIST's to 0.1 %, Au's 6s ionisation 8.65 eV against the measured 9.23 (0.04 eV further than ZORA alone: physical, Josh's call to keep), the non-relativistic solve `{ zora: false }` byte-identical to A's and read only by the window's RELATIVITY Δ (a press under the busy mark, never a frame) and `tests/atoms.test.mjs`' non-relativistic oracles; past Kr the atom's STATUS reads `<sym> · NUMERICAL · scalar-relativistic (ZORA · MV) Xα; spin–orbit not included`, H–Kr no line. THE REGISTER IS n ≤ 7 (iteration 008 A7): `hydrogen.js` BASIS is 140 labels, the 91 of n ≤ 6 first at their old indices (`N6`), n = 7's 49 after; a mode table has seven slots (0 for every older record), the radial rows are `atoms.js rowOfNr` (n = 7's 7s … 7i at 36 + l); THE SCALE λ and the BOX packet hold all 140 (iteration 009 N7): the Sturmian (l, m) blocks reach n = 7 (49 blocks, rank 140; every n ≤ 6 variational eigenvalue moved down or held — Hylleraas–Undheim–MacDonald, `tests/sturmian.test.mjs` Q9) and `wellPacket` projects on the 140 (captured 96.68 → 99.22 % on the well test's packet), so THE LOCK's `states.sturmian.*` and `states.box.*` rows were re-captured BY NAME (39 leaves a fixture; a fresh capture moved no other leaf). THE BEAT EQUALIZER has seven bands (`equalizer.js` `EQ_SHELLS`, the kernel's seven accumulators, a 7 × 7 grid and seven faders): its table is solved over six shells while n = 7 is empty — the old arithmetic to the bit — and over seven once it is not; a save writes six gains while the seventh is 1. THE SCALE's λ runs 1/7 … 3 (iteration 010 X2: `sturmianreg.js` `LAMBDA_MIN` / `clampLambda`, one clamp for the knob, the setter and a restore; the floor is n = 7's hydrogen limit, where 7s is an exact eigenvector, E = −1/98); the knob is LOG, so the seven limits 1 … 1/7 spread over its travel, and its readout names a limit it stands on (`λ = 0.143 · 1/7`); the default 1, the saved `{ on, lambda }` and THE LOCK's λ 1.4 are unchanged, and an older λ (always ≥ 0.25) opens as it was. THE BLOCKS' SUPPORT (iteration 010 X1): under a non-diagonal H — a propagator (THE SCALE, the INTER-SHELL Stark) or the within-shell Stark field — the field draws the REACH, not the anchor's labels: `state.js reach()` keeps every label whose dephased weight Σ_k |C_ak|²|d_k|² (d the anchor's normal-mode amplitudes) exceeds EPS_POP — a function of the anchor and H, never of t, so the drawn set is fixed between edits — and `renderSet` draws it heaviest first (mute, solo and RENDER_CAP = 140 as before; `anchored` counts the anchor); THE SCALE's AUTO box follows it (`rack.js sturmHalf` reads `reg.reachNmax(1e-3)`), the Stark box stays the anchor's; with no field and no propagator `renderSet` is the old law byte for byte (`tests/sturmianreg.test.mjs` §5, `tests/stark.test.mjs`); THE LOCK's sturmian row draws 30.4 → 100 % of its S-norm (GPU integral 0.304 → 0.999), its `states.sturmian.*` leaves re-captured by name (24 + 24: count 2 → 13, the box 5.71 → 12.35; the lock holds no Stark state; a fresh capture moved no other leaf). A link carries n = 7 in REG7 (0x0B), the mask's six extra bytes and 140-wide rates only when needed; a project writes rates and A ↔ B stores 91 wide while n = 7 is empty — an n ≤ 6 file's bytes never move. SPECTRUM's coloured `n` number folds its shell (no chevron; a folded shell counts its populated labels; the paint crosses open rows only). Josh 10-19: "make n=7 minimized by default in the spectrum window, users can discover n=7 if they want to jam the whole rack lane with orbital options" — so n = 7 is folded on a first run, after NEW from the default, for any record without `shells` (an iteration-008 or older file, the demo) and after the Picker opens an atom (iteration 010 X2 proved each); a hand's unfold is the card's WORKSPACE `shells`, written only when it is not [7], and kept as WORKSPACE is (NEW never touches the arrangement). The ATOM system runs Z = 1…118 (Fr–Og all converged; the seventh shell's colour rose, hue 350, appended to the kit's shell set in `palette-app.js`) — opened by
SPECTRUM's ATOM and listed in + and WINDOW (it ships closed).

DYNAMICS is RETIRED (0.4.0 S3): `RETIRED_WINDOWS` maps a saved `dynamics` seat
to `shadow`, as `style` maps to `observer`. Its L, T, V, S and their plot are
SHADOW's footer (in its details fold, computed only while the fold is open),
its moments are CALCULUS rows, its emission lines RADIATION's, its rotor
entropy ORBIT's Schmidt tile, and its PARTICLES a switch in VORTEX — the flow;
the action–angle chart is SPECTRUM. `lab/dynamics.js` stays as their physics.
CALCULUS is RADIATION's tiles (the kit's readouts, in a grid of two columns on
the card and three floating, out of LEAN), and its ⧉ copies THE PROSE FIGURE
(`calculusMarkdown`, `lab/calculus.js`: a heading, one "Figure." paragraph,
the laws in display maths) that pastes into the notebook and renders. That
skin went to CALCULUS alone, as Josh asked; METERS and WIGNER keep theirs.
The rotor plane is PLANE and the stage's cut is CLIP (0.4.0; once SLICE and
SLICE / CLIP): the ids `slice` / `clip`, `slice.*` and the `material.slice.*`
targets are unchanged. PERFORMANCE sits in SETTINGS › QUALITY beside GOVERNOR;
METERS keeps the GOVERNOR readout and FRAME PROFILE.

THE STAGE FORMULA (the INFORMATIONAL window since 0.5.3 M9: its own rack card, `lab/informational.js`, closed on a first run and for a
profile older than it, seated under SETTINGS when opened, listed in + and WINDOW; PREFERENCE `molFormula` / `molFormulaSize` in INFORMATIONAL's own record `lambdawaves.q0.info` since iteration 007 I (`lab/shell/stage-words.js` `INFO_ROWS` · `infoPrefs`, the kit's createPrefs; the window is built from those rows with the kit's `control()`; the blob's six keys lifted once), on by default,
50–300 %) writes what is playing on the stage as ONE block of the kit's INFORMATIONAL layer (`createInfoLayer` in `lab/shell/stage-words.js` `initStageText`, 0.5.1 D1; `lab/stage-text.js` is gone): the MOLECULES formula ($\mathrm{H_{2}O}$) while MOLECULES is on,
otherwise SPECTRUM's populated states in `stateLatex`'s prose ("$2s_{0}$ and $2p_{-1}$"; A ↔ B under a TRANSITION) — never a
live coefficient. The layer has no subject, no features and no labels; parallax, drift and following are off unless INFORMATIONAL › CURSOR (AWAY · DRIFT, off on a first run) turns them on, and is NEVER told of a
camera move (`viewChanged()` only when the racks hide or slide, the transport docks or moves, or the TIMELINE opens or docks; the
kit's ResizeObserver covers a size): idle it writes nothing (D1-BUILD U2: 0 records over AUTO-ROTATE and a pointer sweep).
Its key is the string it would render: a changed string is `remove()` + `addBlock({ md })` (the kit's exit and entrance), KaTeX
runs at most four times a second, and nothing is added while STAGE FORMULA is off (the root `hidden`). It wears the kit's look —
ink, the feathered shade, the serif face — at the kit's seat: the free stage's top + 12 %, between the racks, clear of the
undocked transport and an open TIMELINE (`avoid`); under every window (`.mir-info.lw-stage` z 20 < the racks' 30, `lab.css`),
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
While a molecule owns the field SPECTRUM is HIDDEN with the other ATOMS
windows (`moleculeMode`, iteration 002; THE BEAT EQUALIZER is its own window,
`equalizer`, whose AUDIO IN reads the modulation window's first AUDIO device); EDIT › COPY then
copies the molecule's page (`moleculeLatex`, `lab/latex-state.js`).

Jet Black is the app's palette row (`lab/palette-app.js`, appended to the kit's
catalogue at boot) until MIR carries it (KIT BRIEF J); every other palette is
MIR's. Cloud: PRs only, never `lab/mir`; a kit need is a MIR issue or a line in
the PR.

THE PICKER (iteration 003's main menu, renamed and rebuilt in iteration 004: `lab/picker.js`,
`app.state.picker`; the keys id stays `menu`) is the front page: it opens after the
photosensitivity notice unless a link, `?preset=` or `?menu=0` opened something, and never
for a test driver unless `?menu=1` / `?opener=1`. Three decks sized to the space (bigger tiles
AND more columns, ≥ 8 across on a desktop; ‹ › beside the pages, dots under): ATOMIC (the
118-square periodic table: each tile's symbol in STIX, its picture THE BLOCK'S ORBITAL of the atom
from the CORNER pose — the differentiating subshell, the last electron the Aufbau adds, read from the real ground configuration: an open f shell if the ground state holds one, else the occupied subshell last in the Madelung order (1s 2s 2p 3s 3p 4s 3d 4p 5s 4d 5p 6s 4f 5d 6p 7s 5f 6d 7p), and its last electron's m, by `lab/valence.js` `blockSubshell` (iteration 011 Q3b, Josh 10-19 with his table after Q3 beside GunnarDraft's reference: "Ermmm is this correct? I have the old reference files which I'm not sure is correct but I want the highest orbital chosen on my app" — Q3's "highest n, then l" drew Fe 4s and turned every d and f tile into an s picture; now the s block shows ns, the p block np, the d block (n−1)d (Fe, Cr, Cu, Zn 3d; Pd 4d), Ce–Yb 4f and Pa–No 5f, while La 5d, Ac 6d and Th 6d hold no f and Lu 5d, Lr 7p close theirs; `tools/tile-check.mjs` checks all 118; the caption's subshell is the same one: Iron · 3d⁶), drawn as the PURE (hydrogen) orbital of that (n, l, m), cut in half through the nucleus facing the camera so its n − l radial layers read as rings (the atom's own orbital folds its inner layers into the core: Rb 5s, Cs 6s and Fr 7s all showed 3 layers; `tools/tile-layers.py` counts them), while a press still opens goAtom's
fillValence — every subshell outside the noble-gas core (atoms.js `valenceShells`: Fe 4s and 3d, Au 6s, 4f and 5d), each at its electrons' weight, every m, in phase, the status line naming them, a shell past the basis said and not loaded (008 Q); Josh 10-18), MOLECULAR (every molecule of the catalogue at the
HOME pose) and LIBRARY — THE VOLUMES. A hover moves only the picture (`lab/picker-fx.js`,
SynchroSpectre's motion) and names a molecule's tile beneath it (an element's tile names nothing);
the caption is large (LW Title + STIX): for an element the name alone over its subshell alone
(`3d²`, STIX), never the symbol or Z. Pictures: `tools/menu-thumbs.mjs`
into `lab/img/menu/` (a molecule: density · SIGNED · ISO 0.03 · the HSV wheel; an atom, Josh 10-18: the
signed Im view of its one state — m = 0 held imaginary so the view holds it, m ≠ 0 real so Im ψ is the real orbital's
lobes — the wheel turned by l, s 0° · p 45° · d 90° · f 135°, EXPOSURE 0.5 so a shell is see-through, the MATERIAL CLIP at the nucleus with its normal toward THE CORNER's eye and the GRID at 128 (011 Q3); the field alone via a
two-ground alpha matte; rerun it after a molecule is added) and `--volume vol-1` into a
volume's `t/<id>.webp`. The way back: the grid button by the title, L, WINDOW › PICKER. The
look controls live in the kit's MIR OPTIONS (`lab/mir-gui.js` over the `mir.gui` look store);
SETTINGS keeps λWAVES' own (DISPLAY · QUALITY).

THE ICONS (iteration 012 I1) are Antigravity's (`agy -p … --model gemini-4-argon-medium`), cleaned to a 24-unit viewBox and currentColor, in `lab/img/icons/` (17 files; the sheet `research/iteration-012/I1-ICONS.html`); the kit's glyph table takes no app SVG, so the rack's + list paints ATOMS / MOLECULES' icons with a CSS mask over `[data-rack-list] .mb-item[data-win]` (`lab.css`), and WINDOW › PICKER waits on FOR-MIR. THE LIBRARY'S WORDS (iteration 012 L1): a volume card is its numeral, its count and its bases over `INSTALL · <size>` / `REMOVE · <size>` (the title and blurb its hover), a remove armed for 600 ms or until a press elsewhere (`armer`), no caption on the shelf, the deck a fixed height so the search never moves; SHOW LABELS (the formula on every molecule, the symbol and Z on every element) is the Picker's own PREFERENCE `lambdawaves.q0.picker`, one seat under the tabs and a twin where a volume's INSTALL was. THE LIBRARY'S LAYOUT (iteration 012 L2): under the Picker's logo RETURN HOME · FOLDERS (the door, once top left) · THE HUE ring (a slider dressed as a circle that hue-rotates the molecule pictures; PREFERENCE `hue` in `lambdawaves.q0.picker`, default 0); the tabs in LW Title with I1's icons; a deck keeps a rack's width + 20 px clear each side on a desktop; a volume's tags are two rows with its head centred between them; install / remove wear `download.svg` / `trash.svg` in the ring's eye. THE FIRST RUN'S ENTRANCE (iteration 012 L3): while the photosensitivity notice is up `body.lw-notice` lays the Picker's own ground under it and strips its pane (`lab.css`; the notice stays the kit's, the law λWAVES'); CONTINUE on a first run opens the Picker on MOLECULAR with THE ENTRANCE (`open({ first: true })`: the menu fades, the logo drops, the icons rise, the first page's tiles come one by one in order as their pictures — asked for first, eager and high — decode); reduced motion shows the end state; a deck with unchanged geometry keeps its tiles.

THE VOLUMES (iteration 004, `research/iteration-004/PLAN.md`) are the expansion library: VOL. I,
VOL. II … (≈5 GB each), every molecule solved in RHF up THE BASIS LADDER STO-3G · STO-6G ·
3-21G · 6-31G · 6-31G* · 6-31+G* (Cartesian, the BSE decimals vendored verbatim in
`lab/vendor/bse`; BSE has no 6-31+G* past Ar and 6-31G* puts an f shell on Sc–Zn the l ≤ 2
engine refuses, so such a molecule carries five or four rungs), with PubChem's identifiers,
plain-word tags (PLAN.md's vocabulary) and a blurb with its source. THE FORMAT v1: `<VOLUME_BASE>/
volumes.json` THE SHELF → `vol-1/index.json` THE CATALOGUE → `vol-1/m/<id>.lwm` (one molecule,
all its rungs: `'LWM1'` · a JSON header whose each rung is a schema-1 FRONTIER record with every
column and `{ $blob }` placeholders · the f64 ε and f32 C blobs; `lab/volumes-format.js`
`parseLwm · rungs · rungRecord · encodeLwm`, pure and DOM-free, and no clock anywhere in a
volume's bytes). `VOLUME_BASE` is `./volumes/` beside `lab/index.html`; in dev `lab/volumes` is a
git-ignored link to `~/Documents/LAMBDAWAVES-VOLUMES/dist` that no walker follows (pwa, build-deploy,
release-inputs, field-owner, verb-doc, the DATABASE map). The store is `lab/volumes.js` (`shelf ·
index · statusOf · install · remove · file · picture · installMolecule · kept · watch` over Cache Storage `lw-vol-<id>`); the
Picker's LIBRARY installs a volume with one press and its ring; a volume molecule opens through
chemview's `openVolume(volId, molId, basis)` — each rung is `rungRecord` → the worker's
`chem.open`, ZERO solver calls, the live roads (KICK · RUN · TDA · VIBRATE · LDA) standing down
in one sentence; the BASIS seg carries the six rungs in ladder order (a rung the file lacks
disabled with the header's reason; a catalogue molecule's extra rung opens the volume's own
molecule, `WATER · VOL. I`); the molecule on screen is `chem.row()`. PROJECT holds
`instruments.chem.volume = { volume, id, basis, sha256 }` only while a volume molecule is on
screen (a project naming a volume this device lacks keeps the catalogue molecule and says so —
no fetch, no solve); the notebook's `lw:volume=vol-1&id=…[&basis=…]` is a hand verb. THE
PIPELINE (`tools/volumes/`, data in `~/Documents/LAMBDAWAVES-VOLUMES/`, never in git): the
catalogue (`catalogue/build.py` — six collectors, PubChem resolves, the two screens), the solver
(`solve.py`: PySCF 2.14, every AO kept, the rung below's projected density as the guess, resumable,
SIGTERM-safe, a flock queue), the packer (`pack.mjs`: CᵀSC = I, Tr DS = N, dipole and E_nuc
against PySCF, `chem.open` with 0 solver calls, deterministic bytes, `--incremental`), the
pictures. sw.js treats `volumes/`, the four ladder basis files, the Picker's pictures (`img/menu/`)
and the demo covers as DATA, not precache (iteration 005 A: `library.js` `keepData` stores a good
answer on the device after its first fetch; a volume install keeps its basis files beside it, so
an installed volume opens offline at every rung) — the precache sits ≈ 0.7 MiB under its 8 MiB
ceiling (`tests/pwa.test.mjs`). THE SHELF (iteration 005 S, Josh: Google Drive after a donation):
`tools/volumes/themes.json` sends each finished molecule to the first theme it matches (I THE
CLASSICS · II MEDICINE · III LIFE AND FOOD · IV MATERIALS, ATMOSPHERE AND FUEL · THE REST; a theme
past 5 GB continues as "· 2"); `pack.mjs --archive` writes one `LAMBDAWAVES-VOL-<numeral>.lwv`
per volume ('LWV1' · a JSON index · the files; `volumes-format.js` `parseLwv`) that Josh hands out
himself — the shelf entry carries `archive: { name, bytes, sha256 }` and no `index`, and the
Picker's card shows OPEN FILE… (or takes a drop): `volumes.js` `installFile` slices the file per
entry, hashes every file, stores under the fetch road's own cache keys, resumes, and refuses with
a sentence when `navigator.storage.estimate()` says the device cannot hold it. No URL and no
Drive name ever enters `lab/`; `build-deploy --shelf F` ships the small `volumes.json` with the
site (`docs/VOLUMES-HOSTING.md`). The GPU solver (`tools/volumes/long-run-gpu.sh`, gpu4pyscf on
the RTX 3070, 2.24× over this CPU on drug-size rungs, every energy within 1.2e-11 Eh of the CPU's)
shares the CPU solver's flock queue.

THE LIBRARY OWNS THE INSTALLS (iteration 011 Q4; Josh 10-19: "remove those 'lattice' and 'heavy' and other downloadable stuff
from the molecular system, let that be it's own UI system for handling saved/stored/unsaved molecules in the library section";
`research/iteration-011/Q4-BUILD.md`). The Picker's MOLECULAR deck is MOLECULES ONLY: the catalogue in its SECTIONS' order (a
section's rows in the dropdown's group order), no heading tile and no install card in the grid — the section rides in the
caption's line under a hover; a record-only molecule not on this device keeps its picture and wears the kit's download glyph
(`.mm-dl`, row V's law), and its press opens it, which fetches that one record (chemview's record road). THE SECTION INSTALL
(iteration 008 P: the ring, the lamp, `INSTALL · 2 MB`, `n / N · CANCEL`, the two-press REMOVE — the installed word now
`INSTALLED · REMOVE`, the volume's) lives in the LIBRARY under the volume shelf: RECORDS, a card per catalogue section that keeps
any (ORGANIC · BIO · LATTICE · HEAVY; DIATOMICS and HYDRIDES solve live), in the volume card's look (LW Title, the 5 % ground),
over THIS DEVICE (`storageInfo`'s use and quota, `library.js keptSummary`: the records keepSection kept and the pictures and
files keepData kept, persisted or not); both stand aside while a volume is open. The store is read each time the MOLECULAR deck
or the LIBRARY comes into view (`picker.js readStore`). `__LW.chem.section()` / `keep()` / `install()` and the cache names
(`lw-data-v1`, `lw-vol-<id>`) are unchanged — a section installed by the old heading tile reads INSTALLED here.

THE PHYSICS OF ITERATION 005 (Sol-6's engine seams, `research/iteration-005/PLAN.md`). THE FLOW
IS FACTORS: `molecular-flow.js` `setFactors(w, re, im)` evaluates ρ = Σ_a w_a |φ_a|² and
j = Σ_a w_a Im(φ̄_a ∇φ_a) in one O(n·K) pass over the AO values and gradients — the MO-REGISTRY's
packet is the one-factor case (`setPacket`, P1: aspirin's 263-AO packet flows at 13.8 presents/s
where the dense n² road gave 1.2), the kicked molecule's factors are the eigenpairs of the Löwdin
P = S^½ D S^½ made in the chem worker in f64 on each landing (P2; D's eigenvalues are NOT
occupations in a non-orthogonal basis; the transpose seam dies there with no negation); the dense
`set(re, im)` road stays for REPAIR and the pump. THE CONTINUITY RECORD is a live tile in MOLECULES
beside REPAIR and GATED (CALCULUS and PLANE are hidden in MOLECULES mode): ‖∂ρ/∂t + ∇·j‖/‖∂ρ/∂t‖
on PLANE's own geometry (`slice.js` `planePoints`), the full 3-D divergence by centred differences
— the finite-basis defect, an identity only in a complete basis, 0.6–1.3 for benzene/STO-3G with
90–99.8 % of the residual within 0.3 a₀ of a nucleus. The tracer floor is `setFloor(err, what)`
(max(1e-7, 10·err); GATED names it) and a trail fades over the decade above it. THE ERROR FIELD
(P3): `field.js` `errorField()` reads the whole ψ texture back once (`readGrid`, the field-law
test's road) and compares every voxel to the Hamiltonian's own CPU `psiAt` at the field's time
(a molecule: the f32 matrix the field drew) — METERS' FLOOR · GRID ERROR tile measures on a press
and re-measures when GRID changes, giving the field-law test's numbers digit for digit (hydrogen
1s+2pz at 64³: RMS 2.34e-6, worst 1.68e-4, toward zero) beside the CERTIFIED constants; never on
the frame path. THE MOBILITY EDGE (P4): LATTICE's ANDERSON has d = 1 · 2 · 3 (the cube L ≤ 6 =
216 sites, drawn as its L layers), the level-spacing ratio ⟨r⟩ over the middle third beside its
GOE 0.5307 and Poisson 0.3863 limits (limits, not bounds: a weakly disordered small cube reads
above GOE), the band-centre IPR × N, SEEDS (1–16) averaging, W to 30; the closed line names
W_c ≈ 16.5 J in 3-D and says "finite: 6³ sites". ANGULAR NODES exists since 0.6.3 (VORTEX).

The stage frame/axis mask is built in `lab/shell/ink.js` `refreshOcclusion()` (`createInk` hands it to the loop) and
consumed by the line shader in `lab/field.js`. Mask painted window surfaces,
never a transparent layout box: the modulation root, its chip rail, and
disconnected rack cards all have intentional gaps. A moved or scrolled window
must schedule a PRESENT even while paused. Run
`tests/frame-occlusion.browser-test.mjs` after changing this geometry.

The rack is MIR's `createRack` (0.5.0 C3): every `.dev` registered in place,
`layout`'s verbs aliases over it, captureLayout's v3 still the WORKSPACE
record; the menubar is `createMenubar` over MENUS; the transport stays
λWAVES'. Keys are MIR's ONE KEY TABLE via `lab/key-table.js` (ACTIONS: `ctrl:
true` Mod, `'Ctrl'` the Control key; no `shift`: Shift is the fine step; every
row `overControls`; an overlap binds only on an explicit steal;
`lambdawaves.q0.keys` lifts 0.4.0's shape). The KEYBOARD window is the kit's
`createKeyboardWindow` on `#floats`, painted by `lab.css` §KEYBOARD
(unlayered: five rows in 416 px, legend + switch on one row, centred RECORD /
RESET, status only when needed); its occlusion follows its drag and its close.
Run `keyboard-shortcuts`, `keyboard-window`, `menubar` and `history` after
touching any of it.

The ACTIONS rows in `lab/shell/keys.js` are the rows MIR's `createKeys` will read:
an id is the kit's where the kit has a twin (`transport.play`, `save`,
`folders`, `modulation`, `notebook`, `rack`, `dock`, `hide`, `fullscreen`,
`help`, `undo`, `redo`) and `was` keeps a binding saved under the old id
loading; `group`/`short` feed the keyboard window; `inFields` lets a row run
from a text field; a control a row drives carries `data-key-action`. `ctrl:
true` is the kit's `Mod` (Ctrl or ⌘); `ctrl: 'Ctrl'` is the Control key alone
— Ctrl+Shift+Q/E and the MOD arm (Ctrl+Space) are spelled so, never `Mod` (⌘⇧Q
logs a Mac out). S stays WASD's pitch-down; FOLDERS is O (R-K1). (0.5.0 A9)
FOLDERS IS THE PROJECTS HOME (iteration 004, BASINS-shaped, `lab/projects.js`): THE ONE DEMO (iteration 009, Josh 10-19) is WAVE DANCER PROTOTYPE
(`lab/project-store.js` STARTERS: file id `wave-dancer`, seedId `demos/wave-dancer`, re-saved at KNEE 3 by the app's own road; the ten others
— WATER · BENZENE · N₂ · H₂ σu · HELIUM · CHORD · BUCKY · BREAK · TUNNEL · LDA — deleted with their covers, their files kept as
`tests/fixtures/retired-demos/`; Josh's new demos will be made on the timeline and the molecules). A reader's entry seeded from WAVE DANCER is
refreshed AND renamed in place (`seed()` renames a seeded entry once it carries its starter's revision — the kit's refresh keeps a name); an entry
seeded from a deleted demo stays the reader's, opens from their store (the DEMOS press finds it by seedId) and is never re-seeded
(`tests/molecule-demos.browser-test.mjs`, re-aimed). The DEMOS wear their covers (a 4:3 middle of
`lab/demos/covers`, refreshed in place once by the starters' `·cover` revision; only a starter being added or refreshed fetches one),
folder cards the kit's `folder` glyph, RESTORE THE DEMOS in the foot, the toolbar SAVE · PROJECT · DUPLICATE · NEW, ⓘ the RENDER card's
SUBJECT, a save also its modulation preset in CAPS (a rack with routes). Its doors: O, WINDOW › FOLDERS, the notebook's ▤, FILE (NEW,
OPEN, the recent rows ask FOLDERS' own "Save this first?"), and the FOLDERS rack card (`projects`, the kit's mountGallery, 8 a page,
closed at the top of the LEFT rack, built at its first open); each puts the front page away first (the port's `cover`). RENDER carries
FOLDERS' FILES (SAVE AS ZIP… · OPEN ZIP…); MIR OPTIONS › SAMPLING reaches the modulation host (AUTOMATION) and the TIMELINE (SCRUB); the
modulation window is in the kit's one window stack (`registerWindow`).
The CAMERA card's LOCK (PREFERENCE `camLock`, off by default) is the classic camera. It holds the pan only: the shift stays 0,
every zoom (the wheel, the pinch, the dials, the dolly zoom) is from the centre, the PAN pad rests, and a route on observer.panx/pany
or a project's shift opens centred without its record being written. FOV, CONTROL and the turn stay live (`lab/camera-law.js`
`setLock`). Alt(+Shift)+Drag is the 1:1 pan; Shift does not make it finer (0.5.3 M6, M7). Since iteration 012 M1 the table carries `mode` (ATOMS | MOLECULES), `ballStick`, `render` and `curves`, each with no chord; VIEW has the mode and BALL AND STICK rows, ABOUT has PHOTOSENSITIVITY WARNING… (SETTINGS has no WARNING), WINDOW lists FOLDERS once (the `projects` card is in + only), and WINDOW's PICKER / ATOMS / MOLECULES rows wear I1's icons (notebook.js `tagIcons` after the kit's fill, a lab.css mask); the + list puts the word left and every glyph right. Since iteration 012 M1 FOLDERS opens on DEMOS while ROOT holds none of the reader's projects (`projects.js` `demosFirst`, the window's and the card's onOpen), closes after an OPEN its own adapter took (`landed`; never for the facade's telling), PROJECT wears `save.svg` and NAME / SAVE TO carry `file-name.svg` / `folder-name.svg`. There is one demo (WAVE DANCER PROTOTYPE, iteration 009), not eleven.

A held WASD key turns the camera every frame from 120 ms after its press (iteration 012 O1, `camera-law.js` `queueKeyOrbit(yaw, pitch, id)` holds and `(0, 0, id)` releases through the rows' `up`); a tap is still one eased 0.12 rad step.

THE LOOK IS THE KIT'S (0.5.0 C2): theme, card, frost, DISCONNECTED, glass blur, ACCENT A/B, VIVID, STATUS TAGS, CONTROL HINTS and HELP
live in MIR's `mir.gui` (`lab/look.js`: `createPrefs` over the kit's own LOOK_SCHEMA rows, `createAccent`), never in the settings blob;
SETTINGS keeps each control in its seat as a `look.set`, repainted from the store, and MIR OPTIONS (`createGui`) is not built. λWAVES'
first run is the store's `defaults` (`LOOK_DEFAULTS`, `lab/rack.js`): light/refractive/ALWAYS frost, 22 px blur, 50% VIVID, DISCONNECTED,
hints on, tags and Help off; on a phone or tablet (`lab/first-run.js`, rack.js' own `isPhone()`/`isTablet()`) frost OFF, tinted. Captions
and window notes off, AUTO SCALE and governor on stay the blob's. A stored choice wins; an older blob's look (and `lw-window-info`) is
lifted once by `liftLook`; the phone's frost override stays the app's. Never add a look key to `saveSettings`.
THE BLUR, PUT BACK (iteration 012 B1, Josh 10-20: "why would it get rid of all the blurs if I already have GUI customization for it?"): Q5's allow-list is gone — the GLASS BLUR knob (`mir.gui` `blur`) governs every glass surface as before. Two narrow rules at the foot of `lab/skin.css` keep Q5's true findings: the timeline's window and lanes paint no backdrop (the toolbar and ruler keep the frost), and `#menubar .mb-list` frosts only under FROST, never on a phone or under the hold. The modulation window's ADD MACRO / ADD DEVICE sheets (`.m2pick`) are tinted at .94.

MINIMIZED BY DEFAULT (iteration 011 Q2; Josh: "By default make most of the hidable texts and exandable windows minimized for default
users"): every first-visit window arrives folded (iteration 001, FOLD_ALL) and every fold INSIDE a window (`lab/fold.js`' presses, keyed by
`data-fold`; SHADOW's details too) arrives closed on every device (`lab/first-run.js` `inner`, closed by rack.js' first-visit block). The
open ones are WORKSPACE: a card record's `folds` names them (`lab/shell/rack-wiring.js`, written only when one is open), so a resumed
session, a project or a ☆ layout that names a fold opens it, and a record without `folds` closes them. What stays open is ruled: SPECTRUM's
shells n ≤ 6 (n = 7 folded), MOLECULES' top rows, the register ladder, hints on, the formula and atom labels (007 I), the phone's
TRANSPORT card. The table: `research/iteration-011/Q2-BUILD.md`.

THE START (0.5.0 C6b, `lab/main.js`). THE PHOTOSENSITIVITY LAW is λWAVES', not
the kit's: a human visitor reads the kit's photosensitivity notice once per
browser BEFORE anything animates, and NO query string silences it for a human
(the kit's `?warn=0` is not honoured); only a test driver skips it (`?warn=1`
forces it there). Its seen-flag is the settings blob's `warned`; `__LW.warning`
keeps show dismiss needed onAccept reset seen remembered open; `?play=1` waits
for it; `LW.ready` never does. THERE IS NO TITLE SCREEN (iteration 004, Josh: the
demos and the saves are FOLDERS'): after the notice a human start takes BASINS'
no-pick rule — RESUME when `lambdawaves.q0.session` holds work (MIR's
`createSession` over the one part, PROJECT), else the boot — and the front page
(THE PICKER) opens only after CONTINUE, so the notice is never under it. The
boot awaits the choice. A driver, a link, `?preset=` or `?view=` start on
`?starter=` (home · resume · a demo id) or the boot; `?opener=1` makes a driven
start a human one (`tests/start.browser-test.mjs`); CDP tools add
`&starter=home`. STATUS TAGS off hides the four ψ-badges, never the build offer;
an untouched session (ring origin boot/link/resume) takes a waiting build itself
(`lab/sw-client.js`, `rack.js` `untouched`), any other session only on a press.
The banner is MIR's
`installBanner`, the veil MIR's `bootVeil`, and the wake lock follows THE play.

DOMAIN AUTO on is a project default, not a preference (see the scopes below). DOMAIN AUTO's half under a molecule is max(max|coordinate| + 6, (20/13)(R + 3)), R the farthest nucleus (iteration 012 O1, chemview `framed` at the landing): the visible molecule is at most 65 % of the box at every turn; H₂ and water keep theirs. In
`lab/field.js`, WAVE density uses palette θ=0; Δρ uses the same ±π/2 pair as
Re/Im; palette OFF retains the old colors. Keep
`tests/official-defaults-palette.browser-test.mjs` green when editing either. Since iteration 008 (W) WAVE's OBSERVABLE is
DENSITY · PHASE · RE · IM (`field.js` `WAVE_VIEWS`; `waveView()` maps a saved Re+Im (index 5, gone from the shader) to PHASE and a
saved Δρ (4, kept in the shader) to DENSITY, said once in STATE's status); DITHER is a PREFERENCE under SETTINGS › QUALITY (FIELD_CHROME);
CLIP is an ON switch with its lamp and the kind CLIP | SLAB (`mat.slice.mode` 0 · 1 · 2 unchanged). Since iteration 012 R3 PALETTE reads PALETTE · RELOAD · REVERSE over the strip and ADD (the plus icon, `lab/img/icons/plus.svg`) · INVERT · the stop's swatch and × · ROTATE under it; WAVE's STYLE / FINISH words are gone and POSITION | MOMENTUM is hidden while MOLECULES owns the field (a set molecule owns the volume, SPACE is the eigenmode kernel's); CAMERA has no CONTROL / DIRECTION words, ZOOM · FOV sit under YAW · PITCH beside a bigger sphere (the svg widened and side-clipped in skin.css, the kit's scale exact), HAND reads CONTROLS; CLIP is one row ON · CLIP | SLAB · POS · THICK, the kind always shown and a press on it turning CLIP on. Since iteration 012 R4 the Picker's surface is the class `.lw-menu` (skin.css), and PALETTE's preset list wears it: the kit's list pane gets `lw-menu pal-pick` as it opens (material.js `palPick`) — 24-px rows and each palette's strip at the right edge. FIELD (`staticfield`, 008 S) is closed on a first run and for a profile older than it by INFORMATIONAL's road — `applySettings`' one `older` table (`lab/shell/settings.js`): a profile is older when a key its generation always writes is missing, for FIELD the blob's `dither`, written on every save since 008 W (008 Q). Since iteration 008 G DRAW's styles are CLOUD · SOLID · SIGNED · DUST · BANDS: DUST is the one world-locked particle style (a lattice of n³ cells, n = 128·GRAIN^⅓ — GRAIN is the grain count and nothing else — one grain per cell met by exact distance, so neither the jitter seed nor a camera turn moves the pattern), GRAIN is retired (`field.js` `drawStyle()` maps its saved index 2 to DUST on every road in, said once), BANDS is one level surface per octave of the density anchored at ISO, and KNEE shapes the ray's accumulated opacity T_q(τ) = (1+qτ)^(−1/q) with q = ln(KNEE/0.6) — at the default 0.6 the old lines run and the shipped picture is bit-identical; `FLASH_STEP`'s knee step is 0.2723 from `tools/flash-calibrate.mjs`. SHELL ± (iteration 010 X7, Josh 10-19: "For 'Shell' can there be a 'signed' version of 'Shell'? Because currently it's just acting as Solid but see through. Like 'Shell Signed', Shell look with the Signed geometry.") is the style `glassSigned`, STYLE 8 — APPENDED to `field.js` `STYLE`/`STYLE_NAMES`, never renumbered — seated after SHELL in the seg (`lab/windows/material.js`): SIGNED's measure (|ψ| under DENSITY and PHASE, |Re ψ| or |Im ψ| under RE and IM) through SHELL's transfer (its Gaussian of relative width 0.32 on the measure squared, weight 0.7, light toward white, no GLASS finish, MATTE drops the light), centred at 2.5·ISO on the amplitude, where its silhouette meets SIGNED's; SOFT moves it no more than it moves SHELL (neither reads it). It is not in the C key's cycle (SHELL is not either). A project or link saves the index 8, which opens by name here and as CLOUD on any older build (`drawStyle()`'s unknown-style road). THE LOCK holds the eight styles it was captured on (`digest-lock.mjs` reads `STYLE_NAMES.slice(0, 8)`), so an appended style adds no leaf; the new branch is inserted after the glass-finish block and moved no existing line, 843/0 and 987/0 (research/iteration-010/X7-BUILD.md).

Every stored key lives in exactly one of three scopes (`docs/STATE-SCOPES.md`,
0.3.1): PREFERENCE (the reader's furniture: theme, glass, hints, keys, the
quality budget, camera feel and mode, frame and axes; never written into a
project, a link or a history row, never changed by opening one), WORKSPACE
(the window arrangement; travels with a project and the device remembers it,
last one wins) and PROJECT (the work; the whole of the undo history except the
camera pose, the notebook text and the quality hint). A project open must
leave `lambdawaves.q0.settings` byte-identical outside the WORKSPACE keys.
PROJECTS are MIR's FOLDERS over ONE project part (lab/projects.js,
lab/project-store.js): `lambdawaves` = { data: projectSnapshot(), notebook } —
the notebook is the project's page 0 — signed by projectKey();
serialize({ scope: 'edit' }) bytes never move (tools/serialize-bytes.mjs); the full
bytes gain one WORKSPACE layout row per new card (RENDER at C7b, CURVES at 0.5.1, INFORMATIONAL at 0.5.3 M9).
`lambdawaves.q0.projects` keeps λWAVES' { items, recent } through a byte-exact
translator; an invalid collection is read-only, 8 MiB a project, 24 MiB the
library (tests/project-formats.*). `__LW.projects` keeps every old verb
(`demo(file)` is a DEMOS press, `status` the last line). NEW opens the hidden
empty project lab/new-project.lambdawaves.json through the same
restore-with-rollback road; tools/new-project.mjs writes it and --check proves
it. The undo ring reads serialize({ scope: 'edit' }) and writes restore(S, {
history: true }); no hand-kept key list beside it. (0.5.0 C6)
An open never closes the notebook; it opens it only for non-blank text. Run
`tests/history.browser-test.mjs`, `tests/new-project.browser-test.mjs` and
`node tests/new-project.test.mjs` when touching any of this.
`lw:` LINKS (0.5.1 D8, R6-K): in the notebook's VIEW a link `lw:key=value[&…]` runs a WHITELIST of hand verbs — `preset` (STATE's
PRESET), `molecule` (the MOLECULE dropdown's pick, and MOLECULES on; its head is the fade), `view` (the V key's observable), `orbital`
(the ORBITAL dial by name or number, VIEW orbital) — one history row (`LINK · <text>`) and one fade a press, the ring never cleared; any
other key is ignored and said on the notebook's foot, and a whole state (`lw:s=`) is never a verb. A capture-phase click on `.nb-view`
stops the sanitiser's `target=_blank`; nothing on the stage takes a link (D8′, Group II). Run `tests/lw-links.browser-test.mjs`.
GEMMA IS HIDDEN (iteration 011 Q6). Josh 10-19: "Also Gemma doesn't seem to appear to work. Isn't she built into the app? Or if not can we
just hide the feature for now until we find out our own lightweight AI assistant in the app?" She was never built in: ASK posts to a
local broker (`tools/gemma`, Ollama's `gemma4:e4b`, `docs/GEMMA.md`). ONE flag, `ASK_ENABLED = false` in `lab/ask.js`, closes every
door, and nothing is deleted. With the flag off, the transport's ASK button and THE TYPE BOX do not mount (`shell/transport.js`), and the
/ row is not in ACTIONS (`shell/keys.js`), so the KEYBOARD window does not list it. A saved `ask` chord is carried, inert, through every
save (`key-table.js` `keep`). SETTINGS does not build the GEMMA address (`windows/settings-card.js`, `native-ui.js`). A stored `askOk` or
`askUrl` is carried by `saveSettings` as it was stored and never written. `createAsk` is never made, so no request can leave. THE VERB
TABLE and the `lw:` links do not read the flag. To bring her back, flip the flag and run `pwa.test.mjs --write`. The proof is
`research/iteration-011/q6-proof.mjs off|on`.

Every read and write of `lambdawaves.q0.settings` goes through
`lab/settings-store.js` (`createSettingsStore`; `WORKSPACE` and `FAMILIES` are
its scope tables, and `tools/settings-probe.mjs` is their gate). The camera's
port is `createCameraLaw(...).port`, the object MIR's CAMERA panel takes. The
stage's bindings are `STAGE_BINDINGS` in `lab/stage-gestures.js`; a binding
change is a row edit there. (0.5.0 A1/A8)

The CAMERA card is MIR's `createCameraPanel` over `createCameraLaw(...).port`
(`lab/windows/material.js`, grep `createCameraPanel`); the saved `observer.*` routes stay
the ONE `defs` table's (`lab/shell/modulation.js`), whose dials are the panel's (`camKnobs`) — the panel
registers none (its `mod` has no `add`). The phase palette is MIR's
`createRampPanel` (`DEFAULT_PALETTE` in `lab/palette-app.js`).
`tools/camera-routes.mjs` proves the saved routes after a camera change.
(0.5.0 C1)

The stage's pointer road asks MIR's scene guard first (`createSceneGuard({
install: false })` in `lab/stage-gestures.js`, UI space from `uiSpace` in
`lab/shell/rack-wiring.js`, `wireStage`): a press, a double-click or a wheel in a window's gap never reaches
the stage. `tools/hit-probe-set.mjs` is its gate, and the count is 0 reached.
(0.5.0 C9)

The modulation window is MIR's `createModulation(floats, port)`
(`lab/mir/modulation/window.js`) over A5's port (`lab/mod-port.js`: no
`targets`, `dock: false`), not `installModulation` (a second tick and a device
copy of the rack). There is ONE clock (R-B1): THE play's edge plays or pauses
the modulation on every edge (`mod.follow`, holding the `app.play` demand).
The MOD power (the button, Ctrl+Space, the window's seat) is
`setModulationEnabled`, a route bypass: power never plays and play never
powers. LINKED/SEPARATE and `clockLink` are retired; the tempo grid has eight
tiles. The power and cadence (`modArm`, `modCadence`) are PREFERENCE in the
kit's record `lambdawaves.q0.modulation` (`lab/shell/controller.js` `modStore`/`saveMod`,
bind.js `localStore`), never in the settings blob. `lab/modwindow.js` and
`lab/audio.js` are gone; the kit's `audio-capture.js` is the capture.
(0.5.0 C4)

MIR 1.5.0-alpha.24 is adopted and pinned (0.5.0 C0): its manifest sha-256 is
in `tests/mir-manifest.test.mjs` `ACCEPTED`; re-adopt only with the 1.5
worktree's `adopt.mjs`, then `--check`. `index.html` declares `@layer app,
mir;` then `mir/mir.css`; `lab.css` and `skin.css` stay UNLAYERED and beat
every kit layer. An `app.*` layer ranks below the kit for a normal declaration,
so keep a λWAVES look with an unlayered rule, and narrow an app rule the layers
made live with a twin `:not(:where())`. The 32 `!important` declarations stay unlayered (23 in skin.css, 9 in lab.css; `grep -o` reads 36 — four more sit in comments; four left with C6b's banner and warning pane).
R5-W1: a kit module no root reaches is reported by `wiring --unreached-kit`,
never precached, never failed; our own modules keep the hard gate. The
keyboard editor's stacking (`#keymap` fixed at `--z-veil`, `[hidden]` none) is
λWAVES' own in `lab.css`. Knobs follow 1.5's ONE KNOB LAW (vertical drag, ⅛
gear), guarded by `mir-controls`. Josh's seven glass rulings are read from
`research/release-0.5.0/C0-GLASS-RULINGS.md`; the defaults applied there are
five the kit's, two λWAVES' (the disconnected head's fill and lift, lab.css §G).

THE FILM (0.5.0 C7, C7b) is MIR's `createRecorder` handed λWAVES' `frame(i, ctx)` (`lab/render-exact.js` `createFilm`), and its UI
is the kit's: the RENDER card (`createRenderCard` in `lab/film-card.js`, registered in the rack as `render`, closed on the right)
and the TIMELINE window (`installTimeline` over λWAVES' one modulation host through the seam in `lab/shell/keys.js`: its play is THE play,
λWAVES' pill the one transport, the arrangement `presentation.timeline` with its own undo, the window the WORKSPACE key `tlwin`).
RENDER films STILL (a clip of the clock), TIMELINE · ACTIVE or TIMELINE · SELECTION as an MP4 or PNG frames; ONE PERIOD is a
`lw-period` clip (PLACE ONE PERIOD) whose t0 and T the frame reads. THE TIME LAW: the ruler is the automation's beat and t the
physics'; a frame's t is the period clip's, else the RATE integral when RATE can move, else the RECORD law from the lab's t. The
kit owns the encoding, the take clock, the store with its RECOVER / RESUME / DISCARD rows and the input guard; λWAVES keeps the
schedules, the readback and settle, seed 13, H1–H3 with their witnesses, `filmHold`, and capture.js `handOver` as every save;
`__LW.captureUI` is the scripting facade (createFilm's takes, no UI). The timeline's rows join the ONE KEY TABLE under THE FOCUS LAW
(`lab/key-table.js`: a scoped row wins its chord while its surface has the focus). Run `node tests/render-exact.test.mjs`, the
digest lock, `tools/perf/film-probe.mjs`, `tests/film-handover.browser-test.mjs` and `tests/timeline.browser-test.mjs` after
touching any of it.

THE FLASH GUARD's LIMITER (0.5.1 D10-19, PARTIAL) is `guardRoutes` in `lab/mod-port.js`: the kit's `createFlashGuard` on exactly
four routes — `material.exposure`, `material.gamma`, `material.stage`, `material.knee`, each in its map's own space (`FLASH_STEP`, `material.knee`'s step taken at the default KNEE 3 — 0.4902 in ln KNEE, 0.2723 at 0.6 (008 Q);
derived by `tools/flash-calibrate.mjs` from `field.js`' tone formulas and held to it by `tests/flash-routes.test.mjs`) — holding a
route a MODULATOR drives to 3 flashes a second on the modulation clock's own seconds (a hand on an UNROUTED dial and a stop's
restore are never held; a hand on a ROUTED dial moves the BASE and the modulator's next output carries it through the guard, so that
picture IS held — a flash is a flash whoever makes it, and the dial's base is not fought), said once in METERS' status (`FLASH GUARD · EXPOSURE 10.0 Hz held to 3/s`); `material.hue` and every other route are never
held. It does not see `reg.morph`, `chem.kick` or the camera: only THE FIELD JUDGE (a 64² luminance readback per frame, a frame-path
row, 0.5.x) does. A held route whose modulator goes constant is let go after the guard's quiet second — `guardRoutes` hears the
clock's `onAdvance`, on the modulation's own seconds, so a film lets go on the same frame — handed the registry's current value, with
the line cleared (FIX ROUND 2, D-V S1). THE PHOTOSENSITIVITY LAW (the notice, C6b) is unchanged.

THE CURVES CARD (0.5.1 D10-24, `lab/rack.js` after the RENDER registration) is MIR's `createCurvesPanel({ parent, canvas: dom.canvas,
project: false })` — no `history`, no `port`, no `mod` — over the stage canvas: MASTER · R · G · B through the kit's one SVG picture
filter, so it grades the SCREEN only (`capture.js`' GPU readback, the film's `frame(i, ctx)` and THE LOCK never see a CSS filter) and
the card says so in one line. It ships CLOSED on the right rack after RENDER, in + and WINDOW; neutral reads `filter: none` and costs
nothing, a graded screen costs a compositor pass (WAVE DANCER: 15.0 → 12.2 presents/s on the headless rig; Josh's M5 report is the
real figure). AMOUNT is not routed (a flash route outside D10-19's guard). The grade is PREFERENCE, its own record
`lambdawaves.q0.curves` (FAMILIES; the model's `serialize()`, written 250 ms after a change, removed by FORGET), never a project, link
or history row. A card that ships closed and that no layout lists is seated where an unlisted card stays (after RENDER), or `closed[]`
saves in two orders. `tests/curves.browser-test.mjs` is its guard; `__LW.curves` is the model.

THE CONTEXT (0.5.2 R0, "Rack Dissolution"). `boot()`'s ONE `app` (the last statement of its head, `lab/rack.js`, grep `const app = {`) is
fixed-shape namespaces — §0's consts by value, `ui` (the one flat registry `native-ui.js` and `badges.js` read and write), `hooks`, `state`,
`loop`, `host`, `w`, `ctl`, `sh` — each ONE literal with every key, never extended, never `Object.assign`ed into, never deleted, and none of
128 keys or more (V8 makes such a literal a dictionary; `tools/perf/app-shape.mjs` asks `%HasFastProperties`). Every `let` two planned
modules touch is `app.state.x`, read and written live, never destructured; consts and functions keep their names; a null slot is filled by
the row that moves its first reader (a module registers its own names when it is created, a boot-kept name right after its declaration).
Rename a shared binding only with `node tools/rack-deps.mjs --rename`, never `sed`; `node tools/rack-deps.mjs --classes` is G-G (0 bare
cross-module writes, forward + shared ≤ 25 per moving module; the loop and the boot head exempt — they stay in `boot()`) and
`tests/rack-deps.test.mjs` its law. A law that reads the app's SOURCE reads `tests/helpers/app-source.mjs` (`appSource()` in node,
`appFiles()` fetched in the page: rack.js, then every module under `lab/windows/` and `lab/shell/`), never `lab/rack.js` alone.
`tests/lw-facade.browser-test.mjs` pins `window.__LW` — names, kinds (get / method / value) and order — against
`research/release-0.5.2/lw-facade.json`; a row that changes the facade re-captures it with `--write` and says the diff. THE LOCK is SAME-MACHINE
(843 + 987 values since iteration 008 W took Re+Im's 17 style rows out of each fixture — once 860 + 1004; iteration 008 G re-captured the 15 particle rows `styles.{density,phase,real,imag,diff}/{grain,dust,bands}` by name, the counts unchanged; iteration 008 Q moved the default KNEE 0.6 → 3 (`field.js` `KNEE_DEFAULT`), so every readback that composites the volume was re-captured by name (175 + 193 leaves: the states' rp/rpL, every style and flag row but ADD's, the line rows' rp) — the field digests, record bytes, ADD rows and linePixels held, and the tree at KNEE 0.6 read 843/0 and 987/0; ≤ 64 AO tile states; no time-dependent molecular packet, STATES run, FLOW or `record()` is in it). Its 1004-value
fixture (`research/release-0.4.0/measure/digest-lock-s4a.json`) predates the gas table and is checked WITH `--query gastab=0`, as the tool's
header says; without it the gas states read red at every grid.

THE CONTROLLER (0.5.2 R1) is `lab/shell/controller.js` `createController(app)` — the governor and AUTO SCALE's one rule, the look, the
busy marks, the mod port, the rotation drive, `createField` and its GPU recovery, the maths workers and the ONE ROAD of state mutations
(`touchState`, `loadPreset`, `setReference`, `api`) — moved verbatim; `boot()` awaits it at §2's seat and destructures its 68 names there,
so the frame loop (§5–§6), `schedule`, `filmHold` and §13–§14 stay in `boot()` and read closure slots. The 56 of those names a later
module reads are filled on `app.ctl` once, at the end of `createController` (never by a window or shell row); the 12 only `boot()` or the
loop read stay closure slots, and a module created BEFORE that seat (§1 SETTINGS) reads `app.ctl.x` inside a callback, never at creation
(they are TDZ above the seat). The worker road is `new URL('../mathworker.js', import.meta.url)` in that module; `node tools/rack-deps.mjs
--classes` measures a moved module from its own file (`lab/shell/*.js`, `lab/windows/*.js`), and an unplanned file there is refused.

THE WINDOWS (0.5.2 R2a): STATE (with its CLEAR) is `lab/windows/state.js` `createStateCard(app)` and SPECTRUM `lab/windows/spectrum.js`
`createSpectrumCard(app)`, moved verbatim and created at their seats under the kept `// STATE` / `// SPECTRUM` lines (the five appends
stay in `boot()`). THE READ LAW for a moved module: a name that is a CONST by the time its seat runs — §0's consts, the loop's hoisted
functions, the rack, the controller's 68 (`app.ctl` is filled before the controller's seat returns) — is destructured ONCE at creation
(`const { gov, look } = app.ctl`), which the tool counts as backward; a name `boot()` makes LATER is read through its slot inside a
callback (`app.w.gas`, `app.sh.layout` …, registered by the module that makes it, or filled in `boot()` right after the declaration of a name `boot()` keeps (`app.host.camera`, `app.loop.page`) — a module created before the
controller's seat, §1 SETTINGS, reads `app.ctl.x` that way too); a shared `let` is always `app.state.x`, live. Reading a const through
`app.ctl.x` at use is NOT the pattern — the tool counts every `app.<ns>.x` read as a forward crossing and SPECTRUM would read 32 > 25.
Each module registers on `app.w` only what a moved reader needs; a fill placed inside a moving module's span counts against that module.
`node tools/rack-deps.mjs --classes`'s G-A accepts an eager fill from a module file seated earlier (`tests/rack-deps.test.mjs` §5).

SETTINGS, PERSISTENCE, THE LINKS and THE TRUE HISTORY (0.5.2 R3a) are `lab/shell/settings.js` `createSettings(app)` (§1, created BEFORE the
controller's seat, so it reads `app.ctl.x`, `app.host.camera`, `app.sh.setModArm` and `app.sh.quality` inside callbacks), `lab/shell/persist.js`
`createPersist(app)` (`serialize` and `restore` whole), `lab/shell/links.js` `createLinks(app)` (§29's `openLink()` stays in `boot()`) and
`lab/shell/history.js` `createHistory(app)` (the HISTORY card with it) — moved verbatim and called at their seats; `readSettings` stays one hoisted
line in `boot()`'s head (§0 calls it first). `serialize` / `restore` / `save` / `copyJSON` / `esc` / `copyLink` / `lookSync` are registered on
`app.sh` by the module that makes them (STATE's SAVE / LOAD / COPY read them at use; `boot()` keeps no copy), and a slot a module reads that no
moved module owns yet is filled in `boot()` right after its declaration (11 lines, 30 slots, each moving with its owner's row). `tools/rack-deps.mjs`'
G-A: a module file's eager fills (`app.<ns>.x = …` at its root) run at its seat, so a later-seated file may destructure them; `Object.assign` into a
member's object (`app.ctl.domain`) is not an extension of the shape. A lost import is invisible to `rack-deps` (it reports only the unused
direction): a move checks each file's free names against the base (`research/release-0.5.2/r3a-measure/freenames.mjs`, copied into `.tmp/` and pointed at the base — it cannot run in place; a `tools/freenames.mjs --base` is a candidate) before the browser does.

THE SHELL (0.5.2 R3b): λWAVES' transport strip is `lab/shell/transport.js` `createTransport(app)` (`setModArm` a function declaration inside it); §19a is
`lab/shell/rack-wiring.js` `createRackWiring(app)` — createRack, the layout verbs (aliases over the kit's rack; captureLayout's v3 the WORKSPACE record), the
TRANSPORT card, the phone and tablet crossings, and §18's `devById` / `rackCardWidth` / `popFace` — with TWO seats: the module at §19a's, and its returned
`wireStage()` (the crossings' listeners and the stage gestures) right after the notebook's, where those statements stood; §19b (the skip links, the dock chip,
MENUS and the kit's menubar, THE NOTEBOOK, PROJECTS whole) is `lab/shell/notebook.js` `createNotebook(app)`; §20–§23 (`keyState`, the ACTIONS rows, the
KEYBOARD window, THE TIMELINE, the tab order) is `lab/shell/keys.js` `createKeys(app)` — moved verbatim, each destructuring what `boot()` made before its seat
and reading persist's, the history's, the keys' and the facade's names through `app.sh` at use (`app.sh.LW` is the facade object, filled on the
`window.__LW = LW` line). A boot function a module calls WHILE IT IS BEING CREATED must not read a name that module returns (`popFace` read `layout` and moved
with §19a for that). A name a moved module returns that a later module reads is filled in `boot()` on the returning seat's line until that module's file is next
opened, when the fill becomes its registration (`app.w.clearRegister` on STATE's seat, `app.sh.modSeats` on persist's, `app.sh.historyApi` on the history's; R5 sent settings.js', spectrum.js' and kepler.js' fills home).

THE READOUTS AND KEPLER (0.5.2 R2b): SHADOW · ORBIT · VORTEX · PLANE, CALCULUS · METERS · LADDER and ATOMS · WIGNER · RADIATION are `lab/windows/readouts.js`
`createReadouts(app)` at THREE seats — the root builds the first and returns `createCalcMetersLadder()` / `createAtomsWignerRadiation()`, which `boot()` calls
where CALCULUS and ATOMS stood (`READERS`, the track loop and `hydroReader` stay in `boot()`) — and THE BOW + KEPLER AS A CONTROL SURFACE is
`lab/windows/kepler.js` `createKeplerSurface(app)` (`keplerview.js` owns the name `createKepler`). THE MULTI-SEAT SHAPE: a module whose spans interleave with
other cards declares each later seat as a root-level `function create<Y>()` that its root returns, and `boot()` calls it where the span stood, so no `device()`
or append changes its order; `tools/rack-deps.mjs` measures such a function as eager at its own piece and its declarations as the module's own (an arrow or a
nested closure is read as a deferred callback and its fills as never made — the tool refuses that tree; `tests/rack-deps.test.mjs` §5). `rack.js` stood at
2,001 lines with PAIR 2 in (943 at the cut; 21 module files measured).

THE MATERIAL, THE SETTINGS CARD AND THE FILM (0.5.2 R2c): WAVE (SPACE, OBSERVABLE, DRAW), CLIP, PALETTE · INVERT and CAMERA are
`lab/windows/material.js` `createMaterial(app)` and the SETTINGS card is `lab/windows/settings-card.js` `createSettingsCard(app)` — each at
TWO seats (the root builds the first span and returns `createDrawClipPaletteCamera()` / `createFieldQuality()`, which `boot()` calls where DRAW
and FIELD QUALITY stood, so the cards keep their rack order; the card registers its seven stage hooks on `app.hooks` at its root) — and THE
FILM's road (`film()`, `capture()`, the takes, `app.state.capApi`) is `lab/windows/film.js` `createFilmApi(app)` at one. `filmHold` stays in
`boot()` beside the loop as `app.loop.hold`, handed to the film BY VALUE (`const { hold: filmHold } = app.loop`; the tool counts a slot the
literal holds by value under another key as backward), and `LW`, `periodEnergies` and `stageCaption` are read through `app.sh` / `app.w` at use.

THE MOLECULES, THE STAGE WORDS, THE MODULATION SEAM AND INK (0.5.2 R2d): MOLECULES with the molecular session and THE HEAD's seat, and
the register, are `lab/windows/molecules.js` `createMolecules(app)` at ONE seat, where the LEGACY note stands (iteration 008's fix round folded
MO-REGISTRY's second seat, which no longer made a device, into it: no `createMoRegistry`, no `app.w.wOrbs`; `app.w.wChem` is registered at its
end); THE STAGE TEXT with its caption is `lab/shell/stage-words.js` `createStageWords(app)` (it registers
`app.w.stageTextTick` and `app.w.stageCaption` at creation and returns `initStageText` for `go`; `app.state.stageText` is the literal's, assigned
live), the ONE `defs` table, `mod.install`, the pill's seat and dodge and `app.state.modView` are `lab/shell/modulation.js` `createModSeam(app)`,
and §18 INK is `lab/shell/ink.js` `createInk(app)` (it returns `refreshOcclusion` for the loop) — all moved verbatim and called at their seats under
the kept section notes. A name `boot()` makes after a seat is read through its slot inside a callback (`app.w.wLad`, `app.w.wCalc`,
`app.w.stageTextTick`, `app.host.rackL`, `app.sh.layout`, `app.sh.setModArm`), and `app.host.cameraPort` is filled on the camera law's line so the
seam can destructure it.

THE FACADE (0.5.2 R5) is `lab/shell/facade.js` `createFacade(app)`, which returns §26's `__LW` literal whole — key for key, getter for getter, its
comments travelling (`Object.assign` would freeze a getter into a value) — destructuring its 121 backward names once at its top (it is seated after every
module), reading its 21 shared lets as `app.state.x` and `warning` as `app.hooks.warning`; `boot()` keeps the `/* ── the diagnostics surface` header (the
tool's anchor), `const LW = createFacade(app); window.__LW = LW; app.sh.LW = LW;` and every member it adds later (`LW.curves`, `LW.bootView` …
`LW.stageText`, `LW.ready`, `LW.report`) at its seat, so `research/release-0.5.2/lw-facade.json` holds without `--write`. Every slot the facade reads is
filled exactly once by its owner (`research/release-0.5.2/integrator/doubles.mjs` reads 0), and `boot()`'s seat destructures keep naming what a module
returns even where only a module reads it: `tools/rack-deps.mjs --classes` knows a crossing name by its boot-level declaration.
