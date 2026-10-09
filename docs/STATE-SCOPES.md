# State scopes

Every piece of state in λWAVES lives in exactly one of three scopes — and, since 0.4.0 S4a, one storage class beside them,
LIBRARY, which is not the reader's, the arrangement's or the work's: it is the device's (below). This is the standing law for any key a
change adds or moves. It came from Josh's 0.3.1 brief and the plan in `research/release-0.3.1/PLAN.md` §1
(decisions D1–D6 are there). Stage S1 put it into `serialize()`, `restore()`, `saveSettings()` and
`applySettings()` in `lab/rack.js`. Where this file and the code disagree, the code is right; please fix
this file.

## The three scopes

- **PREFERENCE**: the reader's furniture, meaning how this person, on this device, likes to see and handle any
  picture. It is stored in settings (`lambdawaves.q0.settings`), the look in the kit's `mir.gui` (0.5.0 C2), and a few families in their own keys (the table). It is never written into a project, a link or a
  history row, and opening one of those never changes it. An older file that still carries a preference key is
  opened with that key ignored. The file itself is not rewritten.
- **WORKSPACE**: the arrangement, meaning which windows are where, how big they are, and whether they are folded or
  closed. It is saved in a project, because a demo brings its windows (the DAW law), and the device also remembers
  it. Whichever arrangement was applied last wins. It is never a history row.
- **PROJECT**: the work, meaning the physics, the picture and the modulation. It is saved in a project and a link
  carries what link format v1 has room for. Every PROJECT key is a history row except the camera pose (a view is
  not an edit), the notebook (text has its own editor) and quality (a device budget that rides along as advice).
  Since S3 the history covers exactly this: the edit scope below.

- **LIBRARY** (0.4.0 S4a, `research/release-0.4.0/PLAN.md` B2): installed orbital records — DEVICE CONTENT,
  content-addressed (`lab/library/<sha-256>.json`, named by the hash of its own bytes), kept in the Cache Storage
  `lw-data-v1`, a name no build changes, so a new build never clears them (`lab/sw.js` §1b DATA, the one precache
  exemption). A record is never written into a project, a link or a history row. A project holds only its
  reference, `instruments.chem.library = { id, hash, nameKey }`, which is PROJECT (below). Opening a project or a
  link that names a record this device lacks fetches it, checks it against its name and keeps it; offline, the open
  restores everything else and MOLECULES names the part that refused. An evicted record is "not installed" again
  (its row says DOWNLOAD), never a broken preset.

## The table

| key(s) | home | scope |
|---|---|---|
| THE LOOK (0.5.0 C2): `theme` (light / dark / system), `card` (tinted / refractive), `frost` (off / still / always), `disconnected`, `blur`, `accentA`, `accentB`, `vivid`, and the three help-and-status switches `badges` (STATUS TAGS), `hints` (CONTROL HINTS), `help` (HELP, the ⓘ panels) | the kit's `mir.gui` (`lab/look.js` `createLook`: MIR's `createPrefs` over the kit's own LOOK_SCHEMA rows, with λWAVES' first-run look as their defaults), never settings. An older settings blob's `theme`, `card` (only where `cardSet` said it), `frost` (a legacy `true` is ALWAYS), `disc`, `blur`, `accent [a, b, vivid]`, `badges` and `controlHints` (or the legacy `hint`), and HELP's own key `lw-window-info`, are lifted into it once, at boot, and leave; a browser that never chose has no `mir.gui` and wears its device's first-run look. FORGET clears it with the settings | PREFERENCE |
| `captions`, `molFormula` / `molFormulaSize` (the STAGE TEXT and its SIZE: the formula, the fade, the atom labels and the capture's caption; since 0.4.0 S3 an older `atomLabels` / `atomLabelsSize` is read once, where `molFormula` was never written, and dropped by the next save), window notes (LEAN, `lw.lean.v1`), `gamut` / `p3Mode`, `warned`, `audioDevice`, key bindings (`lambdawaves.q0.keys`), keyboard-editor position (`lw.keyboard.position.v1`), `nativeLayout` (the compact first-visit furniture: 1 once this browser has booted it) | settings (and their own keys) | PREFERENCE |
| the kit's modulation presets, `lambdawaves.q0.modpresets` (`mir/modulation/mod.js` `PRESET_LS`: the presets this browser saved, in their folders) | its own key | PREFERENCE (no project, link or history row writes it) |
| AUTO SCALE (`auto`), `governor`, `keepFrames`, `perfMode` | settings | PREFERENCE |
| the modulation's POWER `modArm` (routes on or bypassed; time runs on) and its cadence `modCadence` (60 / 120 Hz) | the kit's modulation record `lambdawaves.q0.modulation` (`rack.js` `modStore`, MIR's `bind.js` `localStore`: the record `installModulation` reads), never settings; since 0.5.0 C4 an older settings blob's pair is read once into the record and dropped by the blob's next save; FORGET clears it with the settings | PREFERENCE |
| the RENDER card's choices (`lambdawaves.q0.render.*`: motion, format, size, fps, duration, offset, modulation, timeline, the picture `scale`; R7's first-run seed is duration 6, size current, modulation ON when MOD is armed) and the kit recorder's measured speed `mir.render.calib` (0.5.0 C7b) | their own localStorage keys, never settings | PREFERENCE |
| `clockLink` (LINKED / SEPARATE) — RETIRED at 0.5.0 C4 (R-B1, the one clock: THE play plays the modulation, the power never plays). An older blob's key is never read and is dropped by the next save | — | — |
| camera feel: `friction`, `spin` (speed), `dragGain`, `fling` | settings | PREFERENCE (D4) |
| field chrome: `frame`, `axis`, `frameMode`, `axisMode`, `cornerSide`, `invert`, `axisInk` | settings | PREFERENCE (D1) |
| camera MODE, `presentation.obs.mode` (free / turntable) | project | PROJECT (D4's escape hatch, see below), not in history (it travels with the pose) |
| palette: `paletteId`, `palette {on, selected, stops}` | project | PROJECT (D2) |
| `ui.stage {mix, custom, follow}` | project | PROJECT |
| `experiment` (modes, preset, Bz/Fz, t, rate, window, damping) | project | PROJECT |
| `hamiltonian`, `rates`, `rotationRates`, `sturmian`, `wigner`, `instruments`, `readers`, `space`, `domain`, `shadow` | project | PROJECT (0.5.0 D9: `mo`, `instruments.molecule` and `instruments.pulse` left with the H₂⁺ card; an older file's are read only to open it as MOLECULES · H₂; `instruments.helium` left with HELIUM, read only to open the file as ATOM · He 1s. 0.5.0 D9b: `instruments.h2` left with H₂, read only to open the file as MOLECULES · H₂ on its density; `field` (ELECTROSTATICS' `overlay`, `lines`, `source`) left with ELECTROSTATICS, read only to say so) |
| `mat` LOOK: view, style, exposure, softness, iso, grain, knee, dither, hueShift, boost, gamma, finish, bow, slice, steps, paletteOn | project | PROJECT |
| `overlays` (vortex, kepler, particles, dials) | project | PROJECT |
| `obs` pose (yaw, pitch, dist, fov, quat, `shift` — the lens shift, 0.4.0 S2; a file or link without it opens at 0) and `camera.autoRotate` | project | PROJECT, not in history |
| `modulation` (sources, macros, routes, transport, seq, v) and `modulationBases` | project | PROJECT |
| `ab` (A/B stores, omega, on) | project | PROJECT |
| `quality {res, steps, scale}` | project, clamped by the device (`deviceQuality`; a file never switches AUTO SCALE off) | PROJECT, advisory, not in history (D5) |
| notebook text, title and subtitle | beside the project data | PROJECT, not in history |
| `layout` (cards — each with its fold, power, float and, for MOLECULES, its `more` fold — docked, rackHidden, nb), `closed[]`, `nbW/nbH`, `abW/abH`, `modwin` placement, favourite `layouts` | settings and project | WORKSPACE |
| `tlwin` — the TIMELINE window's shape and work lane (the kit's `createTimeline` store: place, size, dock, open, chip side, `workLane`; 0.5.0 C7b) | settings | WORKSPACE |
| `presentation.timeline` — the arrangement (the kit's timeline model: lanes, curves, clips, the ACTIVE range), written only when it holds a clip or a range, so NEW and the demos carry none; it keeps its own 64-row undo (0.5.0 C7b) | project | PROJECT, not in history (an open replaces it, NEW clears it, an undo leaves it) |
| `phoneTr` / `phoneRack` (a phone's transport fold and hidden rack, read back from the page, so a project's layout writes them) | settings, through the layout | WORKSPACE (S2) |
| `instruments.chem.library` `{ id, hash, nameKey }` — the record a molecule opened from (or the one the opened file named, or the catalogue's): `id` the library row, `hash` the record's sha-256 (the exact reference), `nameKey` the chosen orbital's S1 name `{ group, irrep, count, member }` (the portable one, used when the hash has moved on). Written only for a molecule the catalogue `lab/library.json` lists a record for | project | PROJECT; one history row per change of molecule (it moves with `preset` and `basis`; its `nameKey` with `orbital`) |
| the installed records themselves (`lab/library/<sha-256>.json` in Cache Storage `lw-data-v1`) | the device | LIBRARY: never in a project, a link or a history row; never changed by an undo |
| `lambdawaves.q0.library` `{ asked, granted }` — that `navigator.storage.persist()` was asked, on the first INSTALL press (never at boot) | its own localStorage key, never settings | LIBRARY |

## What each road does (as of S2)

- `serialize()` writes `presentation.ui` as `{ stage }` only and `presentation.camera` as `{ autoRotate }` only. It
  strips the field chrome from `presentation.mat` in the same way it strips `bg`, `lightUI` and `stageCustom`
  (`FIELD_CHROME` in `lab/rack.js`). `captureLayout()` no longer writes the `look` and `cam` blocks.
  `applyLayout()` never read them, and together they put the accents, the chrome and the camera feel into every
  project.
- `restore()` reads only the stage from `ui`, only `autoRotate` from `camera`, and none of the chrome from `mat`.
  An older file's theme, card, frost, disc, accent, camera feel and chrome are ignored. As a result, no project
  open calls `setTheme`, `setCardStyle`, `setFrost`, `setDisconnected`, or the camera-feel setters.
- `saveSettings()` no longer writes `palette` or `camMode`, and nothing reads them. The boot wears the shipped
  palette (`PAL_DEF`, prism) and the shipped camera mode (FREE). A project or a link brings its own palette and mode.
  An older settings object that still carries either key is harmless: the keys are ignored and are dropped on the
  next save.
- Share links are a codec over `serialize()` (`lab/statelink.js`), so a link carries no preference key. Format v1's
  MAT flags byte still has bits for invert, frame, axis and axis colour, but it is frozen. A new link writes them at
  their defaults and `restore()` ignores them.
- NEW (S2) opens `lab/new-project.lambdawaves.json`, which `tools/new-project.mjs` writes: every PROJECT key at the
  shipped default and nothing else, so it resets the work and leaves the preferences and the arrangement alone. The
  unsaved-changes mark (`projectKey()`) ignores the WORKSPACE, the auto-rotate switch, `quality` and its shadow
  `mat.steps` (advice the device clamps), and a bound macro's value (its source's output). The stage counts.
- THE HISTORY (S3) reads, keys and writes one record, `serialize({ scope: 'edit' })`: the PROJECT keys minus `obs`
  (the pose and its mode), `camera`, `quality`, the notebook and the WORKSPACE (`layout`, `modwin`, the notebook size;
  no DOM is read). It also leaves out every number that a clock or a modulator moves rather than a hand:
  `experiment.t`, a bound macro's value, `mat.steps`, `domain.half` under AUTO, and the output of a modulated target,
  whose seat holds its registry base (`modSeats()`, the table `projectSnapshot()` also uses). The key is FNV-1a over
  that record's JSON. `restore(S, { history: true })` puts it back without moving the clock, the camera, the
  notebook or the arrangement, and without clearing the ring. It re-applies the modulation, palette, instruments and
  overlays only when their JSON moved (an unchanged rack reloaded under a playing LFO stopped it). A modulated target's
  base comes from the record, never from a control the modulator is moving. The ring's bottom row names its origin:
  `boot`, `link`, `open · <project>`, `new project` (and `start` after CLEAR).
- The history and the unsaved-changes mark differ in three places. The mark counts the camera pose and the notebook text,
  and the history does not (D6: a view and a text are not edits). A STATES lane slot's base is seated only in the
  history, because a square root would move a hand-set lane by an ulp in a saved file.

## D4, measured

A camera pose cannot be read back without its mode, so the mode is PROJECT state and `camMode` left the settings.
Two measurements show this (`research/release-0.3.1/probes/S1/scope-keys.*.json`):

- A TURNTABLE orbit never updates the stored rotor. Its `quat` was 0.141 away (largest component) from the pose
  that its angles describe. A FREE reader would draw a different shot: the camera basis moved 0.323.
- A FREE loop leaves roll (|right·ẑ| = 0.568), and a TURNTABLE reading of that record moved the basis 0.685.

The camera feel (friction, spin, drag gain, fling) stays PREFERENCE.

## Known edges

- `phoneTr` is read from the transport card's fold and `phoneRack` from `rack-hidden` (on a phone). A project whose
  layout folds the transport, or hides the rack on a phone, therefore changes those two settings keys through the
  WORKSPACE road, which is why they are WORKSPACE keys and the byte-identical settings gates strip them with the rest.
- Switching MOLECULES on commits its row at the press. Its solution lands about 150 ms later and fills derived defaults
  (the chem orbital, the MO-REGISTRY selection and the STATES ground lane). Since S4 that landing runs through the ring's
  `absorb()`, which re-keys the press's row on the fill when nothing else is pending, so the switch is one row and the
  first undo turns it off. A record's null orbital and empty STATES lane list are restored as null and empty, so that
  undo is byte-identical and NEW after MOLECULES is the empty file for both keys. What remains: a later ON that reuses
  the cached solution (no new solve) leaves them unfilled. The orbital then reads null and draws the HOMO, and the
  ground lane is seeded when MO-REGISTRY STATES next plays.
- While a rotation drive is actually turning the register (a p-state under ROTATE z, paused or playing), the ring is
  `driven` and commits nothing. UNDO cannot take back an edit made in the meantime (it is grey when nothing lies below),
  and those edits merge into the one `rotation drive` row committed when the drive stops. A record of the unrotated
  anchor, which would let them be rows, is the 0.3.2 candidate.
- Edits within the same 400 ms quiet window coalesce into one row, so three fast taps of C are one undo.
- A click on a HISTORY row within about 250 ms of a keyboard or API edit can be lost, because the list repaints under
  the pointer on the next frame.
- Opening the bundled demo `lab/demos/wave-dancer.lambdawaves.json` no longer switches a reader's frame and axes off.
  This is D1's stated cost. S2 stripped its dead field chrome from `mat`; its `layout.look` and `layout.cam` blocks
  (written before S1, never read by `applyLayout`) are still in the file.

## Adding a key

Choose its scope before you write it.  Device content a build ships and a hand installs (a record, a future pack) is
LIBRARY: content-addressed under a DATA root (`lab/sw.js` §1b), never inside a project; a project names it by
`{ id, hash, nameKey }`. A PREFERENCE key goes in `saveSettings()` / `applySettings()` only (the modulation's own preferences go in the kit's
modulation record, `saveMod()`, read by `applySettings()`; a look option is a row of the kit's `mir.gui`, `lab/look.js` `LOOK_ROWS`). A PROJECT
key goes in `serialize()` / `restore()` only, and joins the history unless it is a view. A WORKSPACE key goes in the
layout record and the settings. No key belongs to two scopes.
