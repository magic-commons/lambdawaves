# S · THE STATE CARD (iteration 008, branch `it008-state`, gate server 9631 / GD 5631)

Josh (JOSH-PROMPT.md): "State window needs a massive rework as it's one of the first windows added to the app; since then, other windows
have been able to do what it does. States should simply be the A to B and Store A/B with transition on and 'rabi' knob? Everything else
has to go or be reworked into other windows."

Read first: CLAUDE.md (THE WINDOWS paragraph: STATE is `lab/windows/state.js` `createStateCard(app)`; the scopes; THE FACADE; THE
MULTI-SEAT SHAPE and `tools/rack-deps.mjs`' rule that an unplanned file under `lab/windows/` is refused — a new card file is added to the
tool's plan with its row), `lab/windows/state.js` whole, `lab/windows/spectrum.js` (`fillValence`, `normalizeNow`, the PRESET road
`loadPreset` in the controller), `lab/shell/persist.js`, `lab/shell/links.js`, `docs/STATE-SCOPES.md`, `tests/history.browser-test.mjs`,
`tests/project-formats.*`, `tools/serialize-bytes.mjs`.

## What STATE holds tonight (its labels) and where each goes
| today | home |
|---|---|
| STORE A · STORE B · A / B · TRANSITION · STRENGTH | **stays** — the whole card: STORE A · STORE B · the A / B morph (`reg.morph`, the STATES register's) · TRANSITION on · RABI (STRENGTH renamed; the drive's strength) |
| PRESET VISUALS · RELOAD | SPECTRUM's head: the kit's `stepper` ‹ PRESET › (the same list; RELOAD is its re-press); THE FADE announces as before (`hand: true`) |
| SAVE · LOAD · COPY JSON · COPY LINK | FOLDERS and the FILE menu already SAVE / OPEN; COPY JSON and COPY LINK go to EDIT › COPY's rows (or SHARE) — nothing a project could do is lost; `__LW.projects` verbs unchanged |
| CLEAR · NORMALIZE | SPECTRUM's state grid gets EMPTY ↔ FILL ALL (one two-state button, row U's pattern for the registry; a HAND stroke normalises at its end, NORMALIZE as a button goes) |
| NO FIELD · STARK F · ZEEMAN B · INTER-SHELL · x · y · z · H IN FORCE | a new small card **FIELD** (`lab/windows/static-field.js`, id `staticfield`), closed on a first run, listed in + and WINDOW, seated after SPECTRUM; the PROJECT keys unchanged (`state.stark.*`, the register's `field.inter`, `lab/stark.js`) |
| ROTATE z · SPIN z · SQUEEZE r | the same FIELD card as DRIVES (`state.rot.z`, `state.stark.kz`, `state.defect.l2` targets unchanged; `setRotRate`) |
| LAST IMPULSE · RELEASE · ALONG | METERS gains one IMPULSE line (k, λ, escaped / momentum — row K redraws the stage overlay); RELEASE and ALONG, the keyboard kick's controls, go to HELP's text and the K key (say what each did) |

## Laws
The card id `state` and its WORKSPACE seat stay; every PROJECT key stays a PROJECT key (an opened 0.5.x project is byte-identical outside
WORKSPACE; `serialize({ scope: 'edit' })` bytes do not move); `state.*` targets unchanged; the facade pin WILL change (methods move) —
re-capture `lw-facade.json` with `--write` and say the diff; rack-deps: the new file is a planned module (≤ 25), state.js shrinks; no new
test files; never `lab/mir/**`. The hydrogen register's STATES pane in MO-REGISTRY (row U's card) is a different window: leave it.

## Light check
Screenshots of the new STATE, the FIELD card and SPECTRUM's head; the walk: STORE A, a stroke, STORE B, TRANSITION on, RABI turned, the
morph played; a Stark field set from FIELD and an old project with a field reopened; a preset from SPECTRUM announces. `./test.sh node`,
rack-deps, `history`, `new-project`, `project-formats`, `lw-links`, `stage-text`, serialize-bytes, settings-probe. Report: worktree · branch ·
commits · tests · blockers · next.
