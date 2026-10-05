# λWAVES

MIR owns generic instrument behavior. Before changing modulation controls, read
`lab/mir/modulation/modwindow/host-contract.md` and the upstream
`/home/joshua-hosain/Documents/MIR/PROMPT.md`. Update MIR first, adopt it, then
adapt `lab/modwindow.js`; do not edit adopted files under `lab/mir/`.

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
and the `mol-*`/`reg-*` CSS hooks stable. The old H₂⁺ `molecule` card is hidden
at startup but must be shown if an older project restores it as field owner.
MOLECULES and MO-REGISTRY start OPEN on the first-run LEFT rack directly under
SPECTRUM (folded on a phone or tablet), unsolved until MOLECULES is switched on;
a restored project whose field owner is MOLECULES brings them back onto the rack
(MO-REGISTRY too when that file's register is on). MOLECULES OFF never hides or
closes MO-REGISTRY: its switch stands down (it must release the field) and the
ladder stays painted and editable. Its MO-REGISTRY ON switch sits beside the
ORBITAL | STATES seg (registerview.js). MOLECULES shows only its top rows (ON,
MOLECULE, BASIS, VIEW + ORBITAL); the rest is kept in a hidden `.mol-more`.

THE PAINT GESTURE (`lab/paint-stroke.js`) is one law for the ORBITAL and STATES
ladders and SPECTRUM's state grid: LEFT click adds one, LEFT drag adds every
item it crosses; RIGHT click removes one, RIGHT drag removes every item it
crosses (Alt/Option+left = right; a finger = left). A crossed degenerate row is
taken whole. One stroke is one undo row.

QCD, HELIUM, H₂, ATOMS and ELECTROSTATICS are hidden LEGACY windows (2026-10)
that need an upgrade, re-adoption into MIR, or deletion — read
`docs/LEGACY-WINDOWS.md` before touching them. They keep their ids, models and
save records; HELIUM/H₂ resurface when a project turns them on as field owner,
ELECTROSTATICS when a project's overlay is on. Do not re-list them in + or
WINDOW.

The STAGE FORMULA (Settings › Display, PREFERENCE `molFormula`, on by
default) writes what is playing in the maths face on the stage: the MOLECULES
formula while MOLECULES is on, otherwise SPECTRUM's populated states ("2s₀,
2p₋₁"; A ↔ B under a TRANSITION). 88 px × its SIZE knob (`molFormulaSize`,
50–300 %), centred between the racks with a wide margin; it WRAPS inside that
width (only an unbreakable word is shrunk); at the top while the transport pill
floats at the foot, at the foot when the transport is docked or the pill is at
the top. ATOM LABELS (PREFERENCE `atomLabels` / `atomLabelsSize`, on by default,
13 px × SIZE) mark each MOLECULES nucleus with its element symbol at its
projected position (`placeAtomLabels`, the PARTICLES projection), white under
`mix-blend-mode: difference` so they invert whatever is beneath them. While a
molecule owns the field SPECTRUM is FOLDED, not hidden
(`moleculeMode`), and unfolds when the molecule lets go.

Palettes are MIR's (`lab/mir/palette.js`): add one in MIR, then adopt
(`node tools/adopt.mjs ../lambdawaves` from the MIR checkout). `jetblack` (MIR
1.4.4) is `flat: true` — a solid body, exempt from the phase-map gates in
`tests/palette.test.mjs`. It is
transparent text under every window and never part of the occlusion mask.

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
ring (`lab/history.js`) reads `serialize({ scope: 'edit' })` and writes
`restore(S, { history: true })`; do not add a hand-kept key list beside it.
An open never closes the notebook; it opens it only for non-blank text. Run
`tests/history.browser-test.mjs`, `tests/new-project.browser-test.mjs` and
`node tests/new-project.test.mjs` when touching any of this.
