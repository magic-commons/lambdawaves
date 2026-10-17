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
MOLECULES: MOLECULES and MO-REGISTRY (hidden, never closed or moved). Its REGISTRY ON switch sits beside the
ORBITAL | STATES seg (registerview.js). Long windows fold their details behind
one chevron (`lab/fold.js`, `.lw-fold`): MOLECULES, SHADOW, CAMERA, MO-REGISTRY. MOLECULES' first row is the SECTION header, which is the library's page turner (0.4.0 S4b; 0.5.3 M8, as Josh drew it): the kit's `stepper` in PALETTE's preset look (‹ NAME ›, a whole line; its name opens the kit's list, its hover carries the section's record line, `__LW.chem.section().sub`), then INSTALLED, whose lamp says every record of the section is on this device and whose press installs or removes them all (shown only for a section with records), beside MOLECULES ON; the MOLECULE picker below is a second stepper whose name IS the `<select>` (optgroups, disabled reasons and native keys kept; ‹ › and ← → walk the page's enabled rows as a hand pick) and holds that one section
(DIATOMICS · HYDRIDES · ORGANIC · BIO · LATTICE · HEAVY, `lab/molecules.js`
SECTIONS), a pick elsewhere turns the page, and the page is never saved. A
library record ships only through `tools/orbital-library.mjs`'s diversity
gate, and a molecule past the live cap opens only from its record (DOWNLOAD,
never DISABLED). Below the header and the rows ‹ MOLECULE ›, BASIS · ORBITAL (VALENCE takes the dial's seat under DENSITY, 0.4.0 S4c) and VIEW · the fold's chevron (five lines at 300 px and at phone width, 0.5.3 M8)
MOLECULES keeps KICK / RUN / TDA / the spectra in the `.mol-more` fold: open
on a desktop, folded on a phone or tablet, its state in the card's WORKSPACE
record (`more`); its `Aa` stays visible with HELP off. THE CHEM WORKER REFUSES (0.5.4 P6, `lab/worker-pool.js`): once it has answered, an error or a
timeout is `{ error, refused }` ("pick the molecule again"), never re-run on the frame thread; it respawns once, then refuses; only a worker that never
answered (no module Worker, a construction throw) keeps the frame-thread road (`tests/worker-pool.test.mjs`, `worker-refusal`). A solve's `sol.identity`
(`molecule-state.js` `identityOf`, P1) is DATA, never a stamp — `sol.hash` stays the basis hash.

THE PAINT GESTURE (`lab/paint-stroke.js`) is one law for the ORBITAL and STATES
ladders and SPECTRUM's state grid: LEFT click adds one, LEFT drag adds every
item it crosses; RIGHT click removes one, RIGHT drag removes every item it
crosses (Alt/Option+left = right; a finger = left). A crossed degenerate row is
taken whole. One stroke is one undo row.

The five LEGACY windows are DELETED (0.5.0, R5-L1): QCD, H₂⁺ and HELIUM in D9,
H₂ and ELECTROSTATICS in D9b. An older file that used one opens on its shim and
says so in one line (`retired in 0.5.0: …`, PROJECTS and STATE status): a QCD
seat without the window (QUARKONIUM keeps `instruments.qcd`), H₂⁺ as MOLECULES ·
H₂ σg/σu, HELIUM as ATOM · He 1s, H₂ as MOLECULES · H₂ density, an ELECTROSTATICS
overlay as nothing drawn (`docs/LEGACY-WINDOWS.md`; `tests/fixtures/legacy-*`).
ATOMS left that list in 0.4.0 (R-A2): it is the periodic-table window — H–Kr
cells in SPECTRUM's own picker, periods as columns on the card and a phone and
rows floating, its Δ-SCF / quantum-defect / α-order readouts kept — opened by
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
profile older than it, seated under SETTINGS when opened, listed in + and WINDOW; PREFERENCE `molFormula` / `molFormulaSize`, on by default,
50–300 %) writes what is playing on the stage as ONE block of the kit's INFORMATIONAL layer (`createInfoLayer` in `lab/shell/stage-words.js` `initStageText`, 0.5.1 D1; `lab/stage-text.js` is gone): the MOLECULES formula ($\mathrm{H_{2}O}$) while MOLECULES is on,
otherwise SPECTRUM's populated states in `stateLatex`'s prose ("$2s_{0}$ and $2p_{-1}$"; A ↔ B under a TRANSITION) — never a
live coefficient. The layer has no subject, no features and no labels, parallax, drift and following off, and is NEVER told of a
camera move (`viewChanged()` only when the racks hide or slide, the transport docks or moves, or the TIMELINE opens or docks; the
kit's ResizeObserver covers a size): idle it writes nothing (D1-BUILD U2: 0 records over AUTO-ROTATE and a pointer sweep).
Its key is the string it would render: a changed string is `remove()` + `addBlock({ md })` (the kit's exit and entrance), KaTeX
runs at most four times a second, and nothing is added while STAGE FORMULA is off (the root `hidden`). It wears the kit's look —
ink, the feathered shade, the serif face — at the kit's seat: the free stage's top + 12 %, between the racks, clear of the
undocked transport and an open TIMELINE (`avoid`); under every window (`.mir-info.lw-stage` z 20 < the racks' 30, `lab.css`),
never a pointer target, never in the occlusion mask. THE FADE: a HAND's preset (STATE's PRESET and RELOAD, MO-REGISTRY's eight ORBITAL presets — HOMO · LUMO · HOMO + LUMO · FRONTIER FOUR · HOMO SET · LUMO SET · WINDING · OCCUPIED, one table in `lab/orbitalsview.js` since 0.5.3 M10 — and its STATES presets) is announced as the block (`data-fade`, the heading size) for 2.4 s — the formula leaves and
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
118-square periodic table, each live element's picture from the CORNER pose — exactly what a
press opens), MOLECULAR (every molecule of the catalogue at the HOME pose) and LIBRARY — THE
VOLUMES. A hover moves only the picture (`lab/picker-fx.js`, SynchroSpectre's motion) and names
the tile beneath it; the caption is large (LW Title + STIX). Pictures: `tools/menu-thumbs.mjs`
into `lab/img/menu/` (density · SIGNED · ISO 0.03 · the HSV wheel, the field alone via a
two-ground alpha matte; rerun it after a molecule is added) and `--volume vol-1` into a
volume's `t/<id>.webp`. The way back: the grid button by the title, L, WINDOW › PICKER. The
look controls live in the kit's MIR OPTIONS (`lab/mir-gui.js` over the `mir.gui` look store);
SETTINGS keeps λWAVES' own (DISPLAY · QUALITY).

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
index · statusOf · install · remove · file · picture` over Cache Storage `lw-vol-<id>`); the
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
pictures. sw.js treats `volumes/` and the four ladder basis files as DATA, not precache — THE
PRECACHE SITS A FEW kB UNDER ITS 8 MiB CEILING (`tests/pwa.test.mjs`): a lab row that adds code
must move something to DATA first.

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
FOLDERS IS THE PROJECTS HOME (iteration 004, BASINS-shaped, `lab/projects.js`): the eleven DEMOS wear their covers (a 4:3 middle of
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
`setLock`). Alt(+Shift)+Drag is the 1:1 pan; Shift does not make it finer (0.5.3 M6, M7).

THE LOOK IS THE KIT'S (0.5.0 C2): theme, card, frost, DISCONNECTED, glass blur, ACCENT A/B, VIVID, STATUS TAGS, CONTROL HINTS and HELP
live in MIR's `mir.gui` (`lab/look.js`: `createPrefs` over the kit's own LOOK_SCHEMA rows, `createAccent`), never in the settings blob;
SETTINGS keeps each control in its seat as a `look.set`, repainted from the store, and MIR OPTIONS (`createGui`) is not built. λWAVES'
first run is the store's `defaults` (`LOOK_DEFAULTS`, `lab/rack.js`): light/refractive/ALWAYS frost, 22 px blur, 50% VIVID, DISCONNECTED,
hints on, tags and Help off; on a phone or tablet (`lab/first-run.js`, rack.js' own `isPhone()`/`isTablet()`) frost OFF, tinted. Captions
and window notes off, AUTO SCALE and governor on stay the blob's. A stored choice wins; an older blob's look (and `lw-window-info`) is
lifted once by `liftLook`; the phone's frost override stays the app's. Never add a look key to `saveSettings`.

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

DOMAIN AUTO on is a project default, not a preference (see the scopes below). In
`lab/field.js`, WAVE density uses palette θ=0; Δρ uses the same ±π/2 pair as
Re/Im; palette OFF retains the old colors. Keep
`tests/official-defaults-palette.browser-test.mjs` green when editing either.

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
four routes — `material.exposure`, `material.gamma`, `material.stage`, `material.knee`, each in its map's own space (`FLASH_STEP`,
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
(860 + 1004 values, ≤ 64 AO tile states; no time-dependent molecular packet, STATES run, FLOW or `record()` is in it). Its 1004-value
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
MO-REGISTRY, are `lab/windows/molecules.js` `createMolecules(app)` at TWO seats — the root builds MOLECULES where the LEGACY note stands and
returns `createMoRegistry()`, which `boot()` calls where ORBITALS stood, below the stage words (`app.w.wChem` is registered at the end of the
first span, `app.w.wOrbs` at the second); THE STAGE TEXT with its caption is `lab/shell/stage-words.js` `createStageWords(app)` (it registers
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
