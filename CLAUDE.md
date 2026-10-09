# λWAVES

MIR owns generic instrument behavior. Before changing modulation controls, read
`lab/mir/modulation/modwindow/host-contract.md` and the upstream
`/home/joshua-hosain/Documents/MIR/PROMPT.md`. Update MIR first, adopt it, then
adapt `lab/modwindow.js`; do not edit adopted files under `lab/mir/`.
The modulation port is `lab/mod-port.js` (the object `createModulation(port)`
takes, key for key with MIR 1.5); THE play is `onePlay` in `lab/clock.js`, and
while MOD is armed and LINKED the modulation follows its edges holding the kit's
`demand('app.play')`, so a play is never refused for want of a route or an open
editor (0.5.0 A5/A6).

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
MOLECULES and MO-REGISTRY start OPEN on the first-run LEFT rack directly under
SPECTRUM (folded on a phone or tablet), unsolved until MOLECULES is switched on;
a restored project whose field owner is MOLECULES brings them back onto the rack
(MO-REGISTRY too when that file's register is on). MOLECULES OFF never hides or
closes MO-REGISTRY: its switch stands down (it must release the field) and the
ladder stays painted and editable. Its MO-REGISTRY ON switch sits beside the
ORBITAL | STATES seg (registerview.js). MOLECULES' first row is the SECTION
header, which is the library's page turner (0.4.0 S4b): PALETTE's ◂ ▸, a
readout naming the section (it survives LEAN), and INSTALLED, whose lamp says
every record of the section is on this device and whose press installs or
removes them all; the MOLECULE dropdown below holds that one section
(DIATOMICS · HYDRIDES · ORGANIC · BIO · LATTICE · HEAVY, `lab/molecules.js`
SECTIONS), a pick elsewhere turns the page, and the page is never saved. A
library record ships only through `tools/orbital-library.mjs`'s diversity
gate, and a molecule past the live cap opens only from its record (DOWNLOAD,
never DISABLED). Below the header and the top rows (ON, MOLECULE, BASIS,
VIEW + ORBITAL — VALENCE takes the dial's seat under DENSITY, 0.4.0 S4c)
MOLECULES keeps KICK / RUN / TDA / the spectra in the `.mol-more` fold: open
on a desktop, folded on a phone or tablet, its state in the card's WORKSPACE
record (`more`); its `Aa` stays visible with HELP off.

THE PAINT GESTURE (`lab/paint-stroke.js`) is one law for the ORBITAL and STATES
ladders and SPECTRUM's state grid: LEFT click adds one, LEFT drag adds every
item it crosses; RIGHT click removes one, RIGHT drag removes every item it
crosses (Alt/Option+left = right; a finger = left). A crossed degenerate row is
taken whole. One stroke is one undo row.

QCD, H₂⁺ and HELIUM were DELETED in 0.5.0 D9 (R5-L1). An older file that used
one opens on its shim and says so in one line (PROJECTS and STATE status): a
QCD seat opens without the window (QUARKONIUM, `cornell.js`, keeps the solver
and `instruments.qcd`), an H₂⁺ field as MOLECULES · H₂ on σg/σu, a HELIUM field
as SPECTRUM's ATOM · He 1s; the DEMOS `H₂ σu` and `HELIUM` open the same. H₂ and
ELECTROSTATICS stay hidden LEGACY windows until Josh rules "by use" (read
`docs/LEGACY-WINDOWS.md`, `research/release-0.5.0/D9-BUILD.md`): H₂ resurfaces
as a project's field owner, ELECTROSTATICS when its overlay is on. Not in + or WINDOW.
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

THE STAGE TEXT (Settings › Display, ONE row: the switch and its SIZE;
PREFERENCE `molFormula` / `molFormulaSize`, on by default, 50–300 %) writes what
is playing on the stage in the notebook's own markdown + KaTeX
(`lab/stage-text.js` — the interim renderer, which 0.5.0 deletes for the kit's
INFORMATIONAL layer): the MOLECULES formula ($\mathrm{H_{2}O}$) while
MOLECULES is on, otherwise SPECTRUM's populated states in `stateLatex`'s prose
("$2s_{0}$ and $2p_{-1}$"; A ↔ B under a TRANSITION) — never a live
coefficient. Its key is the string it would render: the DOM moves only when
the string does, KaTeX runs at most four times a second, nothing renders while
it is off, and nothing reads layout per tick (only on a resize, a transport or
rack move, a SIZE change or a new string). THE FADE: a HAND's preset (STATE's
PRESET and RELOAD, MO-REGISTRY's WINDING / HOMO + LUMO and STATES presets) is
announced in the same node — `WINDING · $1e_{1g}$ (a) + (b)`, the names from
`lab/names.js` — and fades back to the formula; the press threads
`{ hand: true }`, so a restore, an undo, a project or link open never announces
(`tests/stage-text.browser-test.mjs`). The same switch and SIZE govern the
ATOM LABELS: each MOLECULES nucleus marked with its element symbol at its
projected position (`toScreen`, written only when the camera, molecule, size or
canvas changed), white under `mix-blend-mode: difference` so they invert
whatever is beneath them. The older `atomLabels` / `atomLabelsSize` keys are
read once (only where `molFormula` was never written) and dropped. The type
scale is the notebook's three sizes: the formula is its title (34 px), an
announcement its heading (22 px), an atom label its body (14 px), each × SIZE;
the formula is centred between the racks with a wide margin; it WRAPS inside
that width (only an unbreakable word is shrunk); at the top while the transport
pill floats at the foot, at the foot when the transport is docked or the pill is
at the top. It is transparent text under every window and never part of the
occlusion mask, and it never reaches an export: a picture, a loop and a video
carry instead its one plain-Unicode CAPTION (`H₂O · 1b1 HOMO · STO-3G`, or the
states), drawn by `lab/capture.js` `drawCaption` and following the same switch
(KIT BRIEF 6 replaces it at 0.5.0).
While a molecule owns the field SPECTRUM is FOLDED, not hidden
(`moleculeMode`), and unfolds when the molecule lets go; EDIT › COPY then
copies the molecule's page (`moleculeLatex`, `lab/latex-state.js`).

Jet Black is the app's palette row (`lab/palette-app.js`, appended to the kit's
catalogue at boot) until MIR carries it (KIT BRIEF J); every other palette is
MIR's. Cloud: PRs only, never `lab/mir`; a kit need is a MIR issue or a line in
the PR.

The stage frame/axis mask is built in `lab/rack.js` `refreshOcclusion()` and
consumed by the line shader in `lab/field.js`. Mask painted window surfaces,
never a transparent layout box: the modulation root, its chip rail, and
disconnected rack cards all have intentional gaps. A moved or scrolled window
must schedule a PRESENT even while paused. Run
`tests/frame-occlusion.browser-test.mjs` after changing this geometry.

The keyboard editor is app-owned (`lab/keymap.js`, `lab/lab.css`), not an
adopted MIR file. It is a floating MIR-skinned pane, whose occlusion follows
its drag. `lab/shortcuts.js` is the common law for defaults, saved bindings,
the Settings recorder and the keyboard editor: reject overlapping chords and
reserved keys, and only unbind another action after an explicit steal.
Shift+Q/E adjusts POV; Ctrl+Shift+Q/E is a coupled dolly zoom; WASD orbit is
eased through the presentation loop. Run `tests/keyboard-shortcuts.test.mjs`
and `tests/keyboard-window.browser-test.mjs` when changing these controls.
Keep its always-visible chrome minimal: keyboard title, platform switch,
modifier legend, board, action search/list, and Record/Reset above that list.
Status appears only when needed; do not restore the redundant headings,
binding count, drag instruction or bottom help strip.
The desktop pane fits the five key rows in 416 px with no hard keyboard UI
borders. Keep the legend and icon platform switch in one row and the centered,
subtitle-free Record/Reset controls above search; contextual status carries
the recording instructions. Preserve the raised/inset charcoal-blue skin,
visible focus glows and the phone's taller action-only editor.

The ACTIONS rows in `lab/rack.js` are the rows MIR's `createKeys` will read:
an id is the kit's where the kit has a twin (`transport.play`, `save`,
`folders`, `modulation`, `notebook`, `rack`, `dock`, `hide`, `fullscreen`,
`help`, `undo`, `redo`) and `was` keeps a binding saved under the old id
loading; `group`/`short` feed the keyboard window; `inFields` lets a row run
from a text field; a control a row drives carries `data-key-action`. `ctrl:
true` is the kit's `Mod` (Ctrl or ⌘); `ctrl: 'Ctrl'` is the Control key alone
— Ctrl+Shift+Q/E and the MOD arm (Ctrl+Space) are spelled so, never `Mod` (⌘⇧Q
logs a Mac out). S stays WASD's pitch-down; FOLDERS is O (R-K1). (0.5.0 A9)

First-run λWAVES preferences are specified in `lab/rack.js` and
`lab/native-ui.js`: tags, captions, Help and window notes off; hints,
AUTO SCALE and governor on; light/refractive/ALWAYS frost, 22 px blur and
50% VIVID on desktop; on a phone or tablet (rack.js' own
`isPhone()`/`isTablet()`, via `lab/first-run.js`) the first-run material is
frost OFF, tinted. Stored choices and the phone's frost override win.
STATUS TAGS off hides the four ψ-badges, never the build offer; an untouched
session takes a waiting build itself (`lab/sw-client.js`, `rack.js`
`untouched`), any other session only on a press. DOMAIN
AUTO on is a project default, not a preference (see the scopes below). In
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
NEW opens the hidden empty project `lab/new-project.lambdawaves.json` through
the same restore-with-rollback road as any project; `tools/new-project.mjs`
writes that file from the modulation model and the boot defaults and
`--check` proves it byte-exact — run it after changing a default. The undo
ring (the kit's stack, `lab/mir/history/history.js`, with ONE domain `edit` in `lab/edit-domain.js`) reads `serialize({ scope: 'edit' })` and writes
`restore(S, { history: true })`; do not add a hand-kept key list beside it.
An open never closes the notebook; it opens it only for non-blank text. Run
`tests/history.browser-test.mjs`, `tests/new-project.browser-test.mjs` and
`node tests/new-project.test.mjs` when touching any of this.

Every read and write of `lambdawaves.q0.settings` goes through
`lab/settings-store.js` (`createSettingsStore`; `WORKSPACE` and `FAMILIES` are
its scope tables, and `tools/settings-probe.mjs` is their gate). The camera's
port is `createCameraLaw(...).port`, the object MIR's CAMERA panel takes. The
stage's bindings are `STAGE_BINDINGS` in `lab/stage-gestures.js`; a binding
change is a row edit there. (0.5.0 A1/A8)

The CAMERA card is MIR's `createCameraPanel` over `createCameraLaw(...).port`
(`rack.js`, grep `createCameraPanel`); the saved `observer.*` routes stay
`rack.js`' definitions, whose dials are the panel's (`camKnobs`) — the panel
registers none (its `mod` has no `add`). The phase palette is MIR's
`createRampPanel` (`DEFAULT_PALETTE` in `lab/palette-app.js`).
`tools/camera-routes.mjs` proves the saved routes after a camera change.
(0.5.0 C1)

The stage's pointer road asks MIR's scene guard first (`createSceneGuard({
install: false })` in `lab/stage-gestures.js`, UI space from `uiSpace` in
`rack.js`): a press, a double-click or a wheel in a window's gap never reaches
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
kit's record `lambdawaves.q0.modulation` (`rack.js` `modStore`/`saveMod`,
bind.js `localStore`), never in the settings blob. `lab/modwindow.js` and
`lab/audio.js` are gone; the kit's `audio-capture.js` is the capture.
(0.5.0 C4)

MIR 1.5.0-alpha.24 is adopted and pinned (0.5.0 C0): its manifest sha-256 is
in `tests/mir-manifest.test.mjs` `ACCEPTED`; re-adopt only with the 1.5
worktree's `adopt.mjs`, then `--check`. `index.html` declares `@layer app,
mir;` then `mir/mir.css`; `lab.css` and `skin.css` stay UNLAYERED and beat
every kit layer. An `app.*` layer ranks below the kit for a normal declaration,
so keep a λWAVES look with an unlayered rule, and narrow an app rule the layers
made live with a twin `:not(:where())`. The 37 `!important`s stay unlayered.
R5-W1: a kit module no root reaches is reported by `wiring --unreached-kit`,
never precached, never failed; our own modules keep the hard gate. The
keyboard editor's stacking (`#keymap` fixed at `--z-veil`, `[hidden]` none) is
λWAVES' own in `lab.css`. Knobs follow 1.5's ONE KNOB LAW (vertical drag, ⅛
gear), guarded by `mir-controls`. Josh's seven glass rulings are read from
`research/release-0.5.0/C0-GLASS-RULINGS.md`; the defaults applied there are
five the kit's, two λWAVES' (the disconnected head's fill and lift, lab.css §G).

THE FILM (0.5.0 C7) is MIR's `createRecorder` handed λWAVES' `frame(i, ctx)` (`lab/render-exact.js` `createFilm`): RECORD and ONE
PERIOD are MP4s, EXPORT FRAMES the PNG frames in the kit's stored ZIP, every frame at its scheduled time. The kit owns the encoding,
the take clock (only when a film drives the modulation; a frozen film's recorder has no host), the store, the input guard and the
progress; λWAVES keeps the schedules, the GPU readback + settle (`lab/capture.js` `readback`, the one road a picture shares), the
jitter seed 13 pinned per frame and hazards H1–H3 with their witnesses (`HAZARDS[].owner`). Run `node tests/render-exact.test.mjs`,
the digest lock (1004 + 1148) and `tools/perf/film-probe.mjs` after touching any of it.
