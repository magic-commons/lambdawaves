# State scopes

Every piece of state in λWAVES lives in exactly one of three scopes — and, since 0.4.0 S4a, one storage class beside them,
LIBRARY, which is not the reader's, the arrangement's or the work's: it is the device's (below). This is the standing law for any key a
change adds or moves. It came from Josh's 0.3.1 brief and the plan in `research/release-0.3.1/PLAN.md` §1
(decisions D1–D6 are there). Stage S1 put it into `serialize()`, `restore()`, `saveSettings()` and
`applySettings()` in `lab/rack.js` (since 0.5.2: `serialize()`/`restore()` in `lab/shell/persist.js`, `saveSettings()`/`applySettings()` in `lab/shell/settings.js`). Where this file and the code disagree, the code is right; please fix
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
| THE LOOK (0.5.0 C2): `theme` (light / dark / system), `card` (tinted / refractive), `frost` (off / still / always), `disconnected`, `blur`, `accentA`, `accentB`, `vivid`, and the three help-and-status switches `badges` (STATUS TAGS), `hints` (CONTROL HINTS), `help` (HELP, the ⓘ panels) | the kit's `mir.gui` (`lab/look.js` `createLook`: MIR's `createPrefs` over the kit's own LOOK_SCHEMA rows, with λWAVES' first-run look as their defaults), never settings. An older settings blob's `theme`, `card` (only where `cardSet` said it), `frost` (a legacy `true` is ALWAYS), `disc`, `blur`, `accent [a, b, vivid]`, `badges` and `controlHints` (or the legacy `hint`), and HELP's own key `lw-window-info`, are lifted into it once, at boot, and leave; a browser that never chose has no `mir.gui` and wears its device's first-run look. FORGET clears it with the settings. **Iteration 003:** the writer of every one of these keys moved from SETTINGS to the kit's MIR OPTIONS window (`lab/mir-gui.js`, `createGui` over this same store; GUI › MIR OPTIONS), FORGET and RESET LAYOUT with them, and the store holds EVERY LOOK_SCHEMA row now (`skin`, `accentBright`, `veil`, `saturation`, `corners`, `bright`, `hue`, `tint`, `faces`, `faceBlend`, `text`, `relief`, `edge`, `lightAngle`, `reliefAngle`, `reliefLink`, `shadow`, `shadowDist`, `shadowSoft`, `shine`, `shineSoft`, `dropShadow`, `spacing`, `motion`, `glow`, `parallax`, `dropGuides` (the modulation window's dock guide), `transportBar`, `menuBar`, `logo`, `scrub`, `automation`, `quality`), each homed where it writes nothing (`look.js` `LOOK_HOME`), so no browser's look moved. MIR OPTIONS' own device keys beside it: `mir.gui.tab` (the tab last shown), `mir.pointer` (MOTION › POINTER, core/kbm.js), `mir.tier` (QUALITY · AUTO's reading) | PREFERENCE |
| INFORMATIONAL's record, `lambdawaves.q0.info` (iteration 007 I, ADR-0003: the kit's `createPrefs` over `INFO_ROWS` in `lab/shell/stage-words.js`; INFORMATIONAL writes it, FORGET wipes it): `molFormula` / `molFormulaSize` (STAGE FORMULA and its SIZE: the formula, THE FADE and the capture's caption), `molName` (the molecule's NAME under its formula), `atomLabels` / `atomLabelsSize` (ATOM LABELS and their SIZE), `infoPos` / `infoPad` (POSITION — top or bottom — and PAD), one switch per announcement kind (`sayPreset` THE FADE, `sayHead` THE HEAD, `sayRegistry`, `sayView`, `sayOrbital`, `sayBasis`, `sayRate`, `sayStyle`), `popSize` (the pop-ups' SIZE), `cursorAway` / `cursorDrift` (the kit layer's follow + parallax, and drift). First run (Josh 10-18): the formula and the atom labels ON, everything else OFF, TOP at 12 %, every SIZE 100 %. The settings blob's six keys (`molFormula`, `molFormulaSize`, `atomLabels`, `atomLabelsSize`, `infoPos`, `infoPad`) are read ONCE into the record by the laws the blob read them by (an absent `atomLabels` / `atomLabelsSize` takes `molFormula` / `molFormulaSize`) and leave the blob; nothing writes them there again | its own key | PREFERENCE |
| `captions`, window notes (LEAN, `lw.lean.v1`), `gamut` / `p3Mode`, `warned`, `audioDevice`, key bindings (`lambdawaves.q0.keys`), keyboard-editor position (`lw.keyboard.position.v1`), `nativeLayout` (the compact first-visit furniture: 1 once this browser has booted it) | settings (and their own keys) | PREFERENCE |
| the kit's modulation presets, `lambdawaves.q0.modpresets` (`mir/modulation/mod.js` `PRESET_LS`: the presets this browser saved, in their folders) | its own key | PREFERENCE (no project, link or history row writes it) |
| AUTO SCALE (`auto`), `governor`, `keepFrames`, `perfMode` | settings | PREFERENCE |
| the modulation's POWER `modArm` (routes on or bypassed; time runs on) and its cadence `modCadence` (60 / 120 Hz) | the kit's modulation record `lambdawaves.q0.modulation` (`lab/shell/controller.js` `modStore`, MIR's `bind.js` `localStore`: the record `installModulation` reads), never settings; since 0.5.0 C4 an older settings blob's pair is read once into the record and dropped by the blob's next save; FORGET clears it with the settings | PREFERENCE |
| the RENDER card's choices (`lambdawaves.q0.render.*`: motion, format, size, fps, duration, offset, modulation, timeline, the picture `scale`; R7's first-run seed is duration 6, size current, modulation ON when MOD is armed) and the kit recorder's measured speed `mir.render.calib` (0.5.0 C7b) | their own localStorage keys, never settings | PREFERENCE |
| the CURVES card's screen grade (0.5.1 D10-24; `lambdawaves.q0.curves`: the kit curves model's `serialize()` — the points per channel MASTER · R · G · B and AMOUNT; absent = neutral, and neutral reads `filter: none` on the canvas): a screen calibration per device, graded on the screen only (the picture, the loop and the film never see it) | its own localStorage key (`lab/shell/controller.js` `curvesStore`), written 250 ms after a change, never settings, a project, a link or a history row; FORGET removes it | PREFERENCE |
| `clockLink` (LINKED / SEPARATE) — RETIRED at 0.5.0 C4 (R-B1, the one clock: THE play plays the modulation, the power never plays). An older blob's key is never read and is dropped by the next save | — | — |
| camera feel: `friction`, `spin` (speed), `dragGain`, `fling`, and the LOCK `camLock` (0.5.3: the classic camera; the pan is held at the centre and every zoom is from the centre) | settings | PREFERENCE (D4) |
| field chrome: `frame`, `axis`, `frameMode`, `axisMode`, `cornerSide`, `invert`, `axisInk`, and since iteration 008 (W) `dither` — the ordered 8×8 DITHER's amplitude in output LSB, 0 = OFF, SETTINGS › QUALITY (it was a PROJECT key in `mat` until then: `serialize()` strips it with the chrome and `restore()` ignores an older file's, save once — a profile whose blob has no `dither` yet takes the non-zero DITHER its live session (`lambdawaves.q0.session`) carried, read once at the boot's settings read and never at a project open; the settings blob always writes it, so that lift happens at most once) | settings | PREFERENCE (D1) |
| camera MODE, `presentation.obs.mode` (free / turntable) | project | PROJECT (D4's escape hatch, see below), not in history (it travels with the pose) |
| palette: `paletteId`, `palette {on, selected, stops}` | project | PROJECT (D2) |
| `ui.stage {mix, custom, follow}` | project | PROJECT |
| `experiment` (modes, preset, Bz/Fz, t, rate, window, damping) | project | PROJECT |
| `experiment.field.inter` (0.8.0 G3, STATE › STATIC FIELD › INTER-SHELL) `true` — STARK F acts across shells (lab/stark.js' propagator, H = diag(E) + F·z over the 91 labels, engaged while F > 0); absent when off, so the edit bytes never move; dropped when another propagator (STURMIAN) engages | project | PROJECT |
| `hamiltonian`, `rates`, `rotationRates`, `sturmian`, `wigner`, `instruments`, `readers`, `space`, `domain`, `shadow` | project | PROJECT (0.5.0 D9: `mo`, `instruments.molecule` and `instruments.pulse` left with the H₂⁺ card; an older file's are read only to open it as MOLECULES · H₂; `instruments.helium` left with HELIUM, read only to open the file as ATOM · He 1s. 0.5.0 D9b: `instruments.h2` left with H₂, read only to open the file as MOLECULES · H₂ on its density; `field` (ELECTROSTATICS' `overlay`, `lines`, `source`) left with ELECTROSTATICS, read only to say so) |
| `mat` LOOK: view, style, exposure, softness, iso, grain, knee, hueShift, boost, gamma, finish, bow, slice, steps, paletteOn (iteration 008 W: `view` is DENSITY 0 · PHASE 1 · RE 2 · IM 3 on WAVE — a file's Re+Im (5) opens as PHASE and its Δρ (4) as DENSITY, said once in STATE's status; `dither` left for the field chrome) | project | PROJECT |
| `overlays` (vortex, kepler, particles, dials) | project | PROJECT |
| `obs` pose (yaw, pitch, dist, fov, quat, `shift` — the lens shift, 0.4.0 S2; a file or link without it opens at 0) and `camera.autoRotate` | project | PROJECT, not in history |
| `modulation` (sources, macros, routes, transport, seq, v) and `modulationBases` | project | PROJECT |
| `ab` (A/B stores, omega, on) | project | PROJECT |
| `instruments.states.song` (0.6.4 S1, THE SONG on MO-REGISTRY › STATES): `{ hash, name, e0, rateAtDrop }` of the dropped track — FNV-1a of its decoded mono samples, its file name, E₀ and the RATE at the drop — absent when no track was dropped; NEVER the audio. A project whose track is not in this page's memory says "track missing · drop it again" and leaves the register alone; a song's landings note no history row (as the rotation drive's ticks) | project | PROJECT |
| `instruments.orbitals.A` · `.B` · `.morph` · `.morphOn` (iteration 007 B, ADR-0002, MO-REGISTRY › ORBITAL's A ↔ B): the two stores as `[{ k, re, im }]` over the molecule's orbital ladder, the slerp position s ∈ [0, 1] and MORPH — written ONLY while the register holds a store (no store, no path), ABSENT otherwise, so every older project, NEW and the demos carry none; a store's orbital past the ladder is dropped on load. s is the modulation target `reg.omorph` (its own id; `reg.morph` stays the STATES register's), so a route or a TIMELINE lane on it leaves its BASE here (`persist.js` `modSeats`) | project | PROJECT, in history (a → A / → B press, MORPH, a hand on A ↔ B) |
| `quality {res, steps, scale}` | project, clamped by the device (`deviceQuality`; a file never switches AUTO SCALE off) | PROJECT, advisory, not in history (D5) |
| notebook text, title and subtitle | beside the project data | PROJECT, not in history |
| THE SESSION `lambdawaves.q0.session` (0.5.0 C6b): the live project — the one part (`{ data, notebook }`) as it stands, in the kit's record `{ v: 1, parts }` (MIR `core/session.js`), written a quiet 300 ms after the part says it changed (the ring moved, the notebook was typed in) and at once on `pagehide`; a human start puts it back when it holds work (origin `resume`; iteration 004: there is no title screen), `?starter=home` and a demo id forget it, the boot (a driven or direct start, or a human one with no session) arms it | its own localStorage key, never settings | PROJECT; never a history row, never an edit |
| `layout` (cards — each with its fold, power, float and, for MOLECULES, its `more` fold — docked, rackHidden, nb; INFORMATIONAL is one more row since 0.5.3 M9), `closed[]`, `nbW/nbH`, `abW/abH`, `modwin` placement, favourite `layouts` | settings and project | WORKSPACE |
| `tlwin` — the TIMELINE window's shape and work lane (the kit's `createTimeline` store: place, size, dock, open, chip side, `workLane`; 0.5.0 C7b) | settings | WORKSPACE |
| `presentation.timeline` — the arrangement (the kit's timeline model: lanes, curves, clips, the ACTIVE range), written only when it holds a clip or a range, so NEW and the demos carry none; it keeps its own 64-row undo (0.5.0 C7b) | project | PROJECT, not in history (an open replaces it, NEW clears it, an undo leaves it) |
| `presentation.eq` — the BEAT EQUALIZER (`{ preset, gains[6] }`, lab/equalizer.js), written only when it is not FLAT at every gain 100 %, so every older project, NEW and the demos carry none (0.6.0 B2) | project | PROJECT, in history (a preset or a gain is one undo row) |
| `presentation.instruments.lattice` — LATTICE (0.7.2 L1, `lab/lattice.js`): only the knobs that differ from the window's defaults (`preset`, `N`, `L`, `J1`, `J2`, `W`, `seed`, `lam`, `phi`, `Phi`, `rings`, `state`, `x0`, `sig`, `k0`, `idx`; iteration 005 P4: ANDERSON's dimension `d` 1 · 2 · 3 and `seeds` 1 … 16, absent at 1), absent when none does, so NEW, the demos and every older file carry none; an absent record opens the defaults. Its knobs are not history rows of their own (as LADDER's) | project | PROJECT |
| `hamiltonian.mu` — SPECTRUM's μ/mₑ (0.8.1 T2, `lab/hamiltonian.js` `setMu`): the reduced mass beside `Z`, absent at 1 (no scale applied), so NEW, the demos and every older file carry none and open at μ = mₑ; 0.5 positronium, 185.84 muonic hydrogen; restored before `hamiltonian` switches. A link (`lw:`, statelink) does not carry it | project | PROJECT |
| `presentation.instruments.bloch` — BLOCH (0.8.1 T1, `lab/bloch.js`): only the knobs that differ from the window's defaults (`preset` · `w0` · `O` · `d` · `b` · `th` · `ph`: FLOP's π-pulse at ω₀ = 1, Ω = 0.2 from ↑; 0.8.1 T2: `mode` ONE · PAIR and `bell` Φ⁺ · Φ⁻ · Ψ⁺ · Ψ⁻ · PRODUCT, absent at ONE and Φ⁺; 0.9.3 D1: `T1` · `T2`, absent at 0 = none, and the presets `decay` · `damped`; 0.9.3 D2: `tape`, the PAIR circuit as an array of gate ids `hA` · `xA` · `zA` · `sA` · `cnot` · `swap`, ≤ 8, absent when empty, unknown ids dropped on load), absent when none does, so NEW, the demos and every older file carry none; an absent record opens the defaults. The qubit's state is never saved (a load runs the preset from its start); its knobs are not history rows of their own | project | PROJECT |
| `presentation.instruments.central` — CENTRAL (0.8.0 G1, `lab/central.js`): `{ preset, params }` of the generic central Hamiltonian (`confined` · `yukawa` · `well` · `softcore` and that preset's knobs `Rc` · `lam` · `V0`, `a` · `a`), absent at the defaults (CONFINED, R_c = 25 a₀), so NEW, the demos and every older file carry none; an absent record opens the defaults. QUARKONIUM's parameters stay `instruments.qcd` (its key and shape unchanged). Restored before `hamiltonian` switches; its knobs are not history rows of their own | project | PROJECT |
| `presentation.instruments.separable` — SEPARABLE (0.9.4 S1, `lab/separable.js`): `{ form, wx, wy, wz, L }` of the Cartesian oscillator (`iso` · `flat` · `aniso` and its ω_x ω_y ω_z, 0.5…4) or the cube (0.9.4 S2: `cube` and its side L, 4…30 a₀, default 12), absent at the defaults (ISOTROPIC, ω = 1, 1, 1, L = 12), so NEW, the demos and every older file carry none; an absent record opens the defaults. Restored before `hamiltonian` switches (the 56 labels re-sort by energy from it); its knobs are not history rows of their own | project | PROJECT |
| `phoneTr` / `phoneRack` (a phone's transport fold and hidden rack, read back from the page, so a project's layout writes them) | settings, through the layout | WORKSPACE (S2) |
| `instruments.chem.library` `{ id, hash, nameKey }` — the record a molecule opened from (or the one the opened file named, or the catalogue's): `id` the library row, `hash` the record's sha-256 (the exact reference), `nameKey` the chosen orbital's S1 name `{ group, irrep, count, member }` (the portable one, used when the hash has moved on). Written only for a molecule the catalogue `lab/library.json` lists a record for | project | PROJECT; one history row per change of molecule (it moves with `preset` and `basis`; its `nameKey` with `orbital`) |
| `instruments.chem.volume` (iteration 004 V2, a VOLUME's molecule — the PICKER's LIBRARY, an `lw:volume=` link) `{ volume, id, basis, sha256 }` — the volume (`vol-1`), the molecule's id in its catalogue, the rung on screen and the `.lwm`'s sha-256 from the catalogue; written ONLY while a volume molecule is on screen (then `library` is not written, and `preset` / `basis` keep the catalogue molecule beside it), ABSENT otherwise, so every older project, NEW and the demos carry none. The `.lwm` itself is device content (an installed volume, `lw-vol-<id>`) and never rides in a file | project | PROJECT, in history (a volume open or a rung press is one undo row); an open re-opens it from the installed volume only — not installed, the catalogue molecule stays and MOLECULES says "… is not on this device — install it in the PICKER's LIBRARY", no solve |
| `instruments.chem.vibrate` (0.7.0 V1, MOLECULES › VIBRATE) `{ mode, amp }` — the normal mode (its place in the record's MODE list) and the amplitude in Q₀ (0 … 4) while VIBRATE plays; ABSENT while it is off, so a project that never vibrated keeps its bytes. The mode record itself (`lab/library/<sha-256>.json`, catalogue `vibrations`) is device content and never rides in a file | project | PROJECT; restored once the molecule's solve is in |
| `instruments.chem.pulse` (0.7.0 V1, MOLECULES › PULSE) `'step' \| 'ramp' \| 'wave' \| 'gaussian'` — the shaped field the next KICK / RUN drives instead of the δ-kick; ABSENT for NONE (the default) | project | PROJECT |
| `instruments.chem.h2` (0.7.1 U2, MOLECULES › H₂ (STO-3G) › THE CURVE) `{ R, method }` — STRETCH's R(H–H) in bohr (0.8 … 6.0; the nuclei at ±R/2 on z) and METHOD `'rhf' \| 'uhf'`; written only on H₂ and only while R is off the row's own 0.741 Å or METHOD is UHF, so every older project, NEW and the demo carry none (BREAK, the demo that carried it, left at iteration 009 — a reader's store may still hold it) | project | PROJECT, in history (a STRETCH release or a METHOD press is one undo row); the solve follows it |
| `instruments.chem.delta` (iteration 008 U, MOLECULES › Δρ beside KICK) `true` — the card draws the induced density against the reference stored at the kick, over whatever VIEW it shows; ABSENT while off, so every older project, NEW and the demos carry none. A file saved on the retired VIEW `'diff'` opens on DENSITY with `delta` on. Since iteration 008 U `instruments.chem.view` may read `'registry'` (the register on the field), and `instruments.orbitals.on` / `instruments.states.on` are DERIVED — MOLECULES ON with VIEW REGISTRY and that pane — so a file means what it meant; an older file with either ON opens MOLECULES ON on VIEW REGISTRY | project | PROJECT, in history (a Δρ press is one undo row) |
| `instruments.chem.method` (0.7.3 K2, MOLECULES › METHOD) `'lda'` — the card's METHOD when it is RKS LDA (Slater + VWN5, solved live, never from a record; offered on closed shells up to benzene's 36 STO-3G AOs); ABSENT for RHF (the default) and for H₂'s UHF, which stays `h2.method`, so every older project, NEW and the demo carry none (LDA, the demo that carried it, left at iteration 009) | project | PROJECT, in history (a METHOD press is one undo row); the solve follows it, and VIEW `'dlda'` (Δ LDA−RHF) solves the other half quietly when a file opens on it |
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

The camera feel (friction, spin, drag gain, fling, and since 0.5.3 the LOCK `camLock`) stays PREFERENCE.

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

| Key (0.6.4) | Where | Scope |
|---|---|---|
| `audio` (S2 THE CHORD): SETTINGS › AUDIO, the consent switch for sound from this page, off by default; SPECTRUM's SOUND and LEVELS · BEATS are never saved (a hand press each session), never in a project, a link or a history row | settings | PREFERENCE |
| `askOk` (0.6.6 G2 THE TYPE BOX): the first ASK press's consent ("sends your words and this project’s readouts to <askUrl> on your network · CONTINUE"); `true` once CONTINUE is pressed, absent before; never in a project, a link or a history row (iteration 011 Q6: while `ASK_ENABLED` is off in `lab/ask.js` no door builds it — a stored value is read and carried by every save as it was, never written) | settings | PREFERENCE |
| `skeleton` (0.7.0 V2) and `bead` (0.8.2 P3 THE BEAD): INFORMATIONAL › MARKS, the nuclei and bonds, and the expectation point with its trail, on the stage's `#skeleton` canvas; off by default; never in a project, a link or a history row (iteration 008 fix round C6: rows of `lambdawaves.q0.info`, an older blob's key lifted once) | info | PREFERENCE |
| `ellipsoid` (0.8.3 B3 THE UNCERTAINTY ELLIPSOID): INFORMATIONAL › MARKS › UNCERTAINTY beside BEAD, the position covariance's three principal circles about the bead on the `#skeleton` canvas; off by default; never in a project, a link or a history row (the fix round C6: a row of `lambdawaves.q0.info`, lifted once) | info | PREFERENCE |
| `askUrl` (0.6.6 G2): SETTINGS › the GEMMA address beside AUDIO, where ASK posts; absent means this page's host at 9443 (`${location.protocol}//${location.hostname}:9443/ask`, computed, never stored); written only when the hand types one (iteration 011 Q6: while `ASK_ENABLED` is off in `lab/ask.js` no door builds it — a stored value is read and carried by every save as it was, never written) | settings | PREFERENCE |
