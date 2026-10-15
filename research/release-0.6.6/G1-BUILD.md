# 0.6.6 G1 — THE VERB TABLE + THE INVENTORY (build report)

Builder: Opus 5.5 for Claude Yan (Fable 5.1) · branch `g1-verbs` from `3a86298` (the 0.6.5 cut tip) · 2026-10-15.

## What landed
- **`lab/verbs.js` (new, 110 lines)**: `export const VERBS` (12 rows `{ id, args, doc, run(app, a) }`) and `createVerbs(app)` → `{ run, inventory, table: VERBS }`.
  It has no DOM at its top: `node -e "import('./lab/verbs.js')"` loads it. Its imports are state, molecules, field, hydrogen, names, latex-state, status,
  flash-law, equalizer, hamiltonian and mir/core/pointer, and each one was checked to load in node. G3 can `import { VERBS } from '../../lab/verbs.js'`.
- **`run(list, { who = 'GEMMA', name })`** → `{ ran: [{ verb, args }…], refused: [{ verb, why }…] }`. Each `{ verb, args }` is checked against the table first.
  An unknown verb, an unknown arg, a missing arg, a wrong type or a value outside an enum is refused with a sentence, never guessed. An unknown ID (a preset,
  a molecule, a window, an orbital, an equalizer preset) is refused by the row itself with a sentence. So is a `rate` the flash law would hold. The
  accepted rows run IN ORDER, each awaited: the `molecule` row awaits its pick's solve, and the basis's, before the next row runs. The whole list is ONE history row,
  `${who} · <the first verb in three words>`, using the first verb that is not `new`. `name` overrides the label: the `lw:` runner passes `LINK · <text>`.
  **How the one row is made.** The LINK press's `flush → act → note(name)` cannot hold across awaits. A `hNote()` during a solve settles after the 400 ms quiet window
  and splits the row. So `run` uses the same ring's gesture HOLD instead:
  - `history.hold(row)` before the first verb. It flushes the edit standing, as the LINK's flush did, and names the pending row.
  - The hold is taken again before each verb. That refreshes the kit's 5 s stuck-hold clock, and it holds again after NEW's `history.clear('new project')` drops the hold.
  - One `release()` at the end gives one settle and one row.
  - An empty accepted list touches nothing. This is the `lw:s=abc` case: 0 rows.
  **THE FADE.** A row returns `{ own }` when it announced itself (a hand's preset, a molecule's head, a `say`), or `{ fade }` (`VIEW · density`, `ORBITAL · …`).
  The first fade is said at the end, and only when no row announced itself. That keeps the `lw:` law (one fade a press), and Gemma's `say` is never overwritten.
- **`inventory()`** returns only what the app prints:
  - `owner`
  - `molecule: { formula, name, basis, E, nocc, nAO, group, homo, gapEh, gapEv, orbital, head }`. The numbers come from the live solve and `sol.stem || stemOf(sol)`,
    at the head's own precision. Before the solve lands it is `{ formula, name, solving: true }`.
  - `status`: statusOf's line. Under MOLECULES that is its kept `said`; otherwise it is the operator's.
  - `states: { prose: stateLatex's first line, populations: { label: |c|² } }`, or null under MOLECULES.
  - `repeats`: the REPEATS readout's value · sub, as printed.
  - `rate`, `t`, `playing`.
  - `camera: { yaw, pitch, zoom, fov, autoRotate }`, read through the camera port's get.
  - `windows`: the rack's open ids.
  - `view`.
  - `notebook`: the last 600 chars of page 0.
- **The `lw:` runner** (`lab/shell/notebook.js`). `orbitalOf` moved into `lab/verbs.js`. `lwLink(q, name)` now maps its four keys onto table rows:
  `preset` → preset, `view` → view, `molecule[&orbital]` → molecule {id, orbital?}, and a lone `orbital` → view {id:'orbital', orbital}.
  It then calls `app.sh.verbs.run(list, { name: 'LINK · <text>' })`. The foot says `ignored: <keys>` for unknown keys and refused rows. Five imports and
  `loadPreset` are gone from notebook.js.
- **Seats**:
  - `lab/rack.js:30` imports `createVerbs`.
  - `lab/rack.js:141`: the literal's `sh` gains `verbs: null` (sh now has 46 keys).
  - `lab/rack.js:819`: `const verbs = createVerbs(app); app.sh.verbs = verbs;`. It sits ABOVE the `/* ── the diagnostics surface` anchor. rack-deps reads
    the facade's seat at the anchor, and a fill on or after that line counts as "a null slot boot does not fill before the seat".
  - `lab/shell/facade.js:15` destructures `verbs` from `app.sh`, and `:268` adds `verbs,` as the last member of the literal.
  - `lab/windows/spectrum.js:111`: `ui.eqPick(id)` is the equalizer stepper's own road (set, setPreset, syncEq, hNote), used by `switch {id:'equalizer'}`.

## Choices made in this build
- **`view`** sends `density|orbital|diff|esp` to MOLECULES' VIEW while MOLECULES is on. The old `lw:view=` set the atomic `mat.view` under a molecule.
  With MOLECULES off it is the V key's road (`__LW.setView`). It takes `orbital?` so that the `lw:orbital=` key has a row; there was no `orbital` verb in the id list.
- **`window`** knows the rack's ids from `rk.windows()`: transport, render, curves, informational, orbit, vortex, slice, calculus, meters, ladder, atoms, wigner,
  radiation, history, shadow, spectrum, chem, orbitals, settings, state, palette, observer, camera, clip. Open is `layout.reopen(id, side)`; close is `rk.close(id)`.
  The notebook is opened by the `notebook` verb, not by `window`. The inventory's `windows` is the kit's open list, so cards that MOLECULES hides still read as open.
- **`rate`** clamps to the knob's 0.1…3000, then calls `aliasOf(periodEnergies(), v, fps)` as the transport does. Above `FLASH_HZ` the value is refused
  with the beat's Hz. The road is the knob's: `ui.rateKnob.set(v)`, then `modHand('transport.rate', v) || clock.setRate(v)`.
- **`switch`** presses the kit switch the way a hand does, with `.click()` when its state differs: LOCATE `ui.vorOn`, PARTICLES `ui.pOn`, STAGE FORMULA
  `ui.molFormulaSw`, ATOM LABELS `ui.atomLabelsSw`. `equalizer` takes a preset id or label.
- **`say`** calls `stageText.announce(md, 0)`. It is dismissed by Escape (outside a field, as THE HEAD is) or by the next `say`. When STAGE FORMULA is off
  it is refused with "not shown: STAGE FORMULA is off".
- **`notebook`** sets `layout.notebook.text = …`: the textarea's value plus its `input` event, so the project and the store see it. A hidden notebook opens on
  NOTES in VIEW. One already open in VIEW re-renders. One open in EDIT is left where the hand is.
- **`new`** calls `layout.projects.requestFresh()`, the FILE › NEW road. It asks before discarding unsaved work; if the person cancels or the fetch fails,
  the row is refused.

## THE TABLE
This is verbatim from `VERBS`, one JSON object per row. The broker builds her prompt from the module; this is a copy for reading.
```jsonl
{"id":"preset","args":{"id":"string"},"doc":"load one of STATE's PRESET hydrogen states by its id (1s+2pz, …), announced on the stage"}
{"id":"molecule","args":{"id":"string","basis":"?enum sto-3g|6-31+g-star","view":"?enum density|orbital|diff|esp","orbital":"?string|number"},"doc":"pick a library molecule by id (H2O, NH3, C6H6, …) and switch MOLECULES on; its head shows once solved; then the basis, the view and an orbital by number or name (HOMO, LUMO, 1b1)"}
{"id":"view","args":{"id":"enum density|phase|real|imag|diff|reim|orbital|esp","orbital":"?string|number"},"doc":"the observable on the field: under MOLECULES density|orbital|diff|esp (orbital by number or name), otherwise density|phase|real|imag|diff|reim"}
{"id":"window","args":{"id":"string","open":"bool","side":"?enum L|R"},"doc":"open or close a window by its id (spectrum, chem, orbitals, camera, settings, informational, render, …), onto the left (L) or right (R) rack"}
{"id":"camera","args":{"yaw":"?number","pitch":"?number","zoom":"?number","fov":"?number","autoRotate":"?bool","home":"?bool"},"doc":"pose the camera: yaw and pitch in radians (pitch −1.52…1.52), zoom the distance (1.2 near … 8 far), fov 0.25…1.2; home first puts it back; each value is clamped"}
{"id":"rate","args":{"value":"number"},"doc":"the transport RATE, atomic units of time a second (0.1 … 3000); refused when the beats would flash above 3 a second on screen"}
{"id":"play","args":{"on":"bool"},"doc":"play (true) or pause (false) the one clock"}
{"id":"scrub","args":{"t":"number"},"doc":"move the clock to time t (atomic units)"}
{"id":"switch","args":{"id":"enum locate|particles|formula|labels|equalizer","on":"bool|string"},"doc":"a hand switch on or off: VORTEX's LOCATE, PARTICLES, STAGE FORMULA, ATOM LABELS; equalizer takes a preset name instead (FLAT, GAUSSIAN JITTER, COMB, BEATS ONLY, …)"}
{"id":"say","args":{"md":"string"},"doc":"write one short markdown paragraph on the stage ($…$ maths allowed), held until Escape or the next say"}
{"id":"notebook","args":{"md":"string"},"doc":"append a markdown block to this project's notebook (opening it to read)"}
{"id":"new","args":{},"doc":"open a new empty project (asking first when this one has unsaved changes)"}
```
Arg spec: `'string' | 'number' | 'bool'` (or a `|` union of those), or `'enum a|b|c'`. A leading `?` marks the arg optional.

## Checks
- **THE DEMO LIST.** A throwaway script (`.tmp/g1-demo.mjs`, through `tools/gate/gatekit.mjs`, headless, served on 9351) sent this list through `__LW.verbs.run`:
  `[new, molecule c6h6, view density, camera {pitch 0.6, zoom 4.2}, say "Benzene: six carbons in a ring, $\mathrm{C_6H_6}$.", notebook "## Benzene\nSix carbons in a ring."]`,
  plus three bad rows (`teleport`, `camera {pitch:'up'}`, `window nope`). Result:
  - The six good rows ran in order.
  - MOLECULES is on and C6H6 solved (nocc 21 of 36 AO).
  - The stage banner is her paragraph.
  - The notebook ends with the block and is open in VIEW.
  - The ring is exactly `["new project", "GEMMA · molecule c6h6"]`: ONE row.
  - `inventory().molecule` = `{ formula: "C₆H₆", name: "benzene", basis: "STO-3G", E: -227.891006, nocc: 21, nAO: 36, group: "D6h", homo: "1e1g · HOMO",
    gapEh: 0.5516, gapEv: 15.01, orbital: "1e1g (b) · HOMO", head: "NUMERICAL · energy agrees with PySCF to 3e-13 Eh" }`. Status is "DENSITY · NUMERICAL · …";
    the camera reads pitch 0.6, zoom 4.2.
  - The three bad rows were refused with: `there is no such verb`, `camera.pitch must be number, not "up"`, `there is no window "nope"`.
- **A second list** (`who: 'TEST'`): window camera L, switch labels off, switch equalizer comb, play off, scrub 3, rate 5000, camera home + autoRotate,
  molecule h2o orbital homo, view esp, preset nope.
  - Nine rows ran. `rate 5000` was clamped to 3000; a stationary state does not flash.
  - `preset nope` was refused: `there is no preset "nope"`.
  - One ring row: `TEST · window camera true`.
  - Water's inventory: E -74.963023, 1b1 · HOMO, view esp, status "ESP · NUMERICAL · Φ at nuclei exact".
- **`tests/lw-links.browser-test.mjs`** (the four keys through the table): GREEN.
  - density: one row "LINK · density" and one fade.
  - water: one row; the head is the one fade.
  - nh3&orbital=lumo: 4a1 · LUMO (orbital 6), one row, one fade.
  - `lw:s=abc`: 0 rows, and the foot says "ignored: s".
  - The https link still opens its tab.
- **`tests/history.browser-test.mjs`**: GREEN (exit 0).
- **`tests/lw-facade.browser-test.mjs --write`**, then run plain: GREEN, 177 members (57 value · 48 get · 72 method).

## Gate results
- `node tests/pwa.test.mjs --write` updated the precache: `verbs.js` added, and new hashes for rack, facade, notebook and spectrum. `./test.sh node` then exited 0.
- `node tools/rack-deps.mjs --classes`: the HINGE holds (0 bare writes; spectrum at 25/25, as before). G-A reports none. notebook reads 20, facade 21.

## The facade diff
`research/release-0.5.2/lw-facade.json` gains one row, `["verbs","value"]`, as the last member (176 → 177 members).

## Lines (`find lab -name '*.js' -not -path 'lab/mir/*' | xargs cat | wc -l`)
28,758 → **28,858 (+100)**, exactly the ceiling: verbs.js +110, notebook.js −14, rack.js +1, facade.js +1, spectrum.js +1, sw.js +1 (the precache row).

## Deferred
- No runtime catalogue: `table` is the static `VERBS`. G3 has to generate the live ids itself. Molecule and preset ids can be imported in node from
  `lab/molecules.js` and `lab/state.js`; the window ids are listed above.
- If a solve inside ONE `molecule` row takes longer than the kit's 5 s stuck-hold, it could settle partway through the row. The hold is refreshed between rows, not inside one.
- The inventory's `windows` reads the kit's open flag, so cards that MOLECULES hides (state, shadow) still read as open.
