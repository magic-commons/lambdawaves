# State scopes

Every piece of state in λWAVES lives in exactly one of three scopes. This is the standing law for any key a
change adds or moves. It came from Josh's 0.3.1 brief and the plan in `research/release-0.3.1/PLAN.md` §1
(decisions D1–D6 are there). Stage S1 put it into `serialize()`, `restore()`, `saveSettings()` and
`applySettings()` in `lab/rack.js`. Where this file and the code disagree, the code is right; please fix
this file.

## The three scopes

- **PREFERENCE**: the reader's furniture, meaning how this person, on this device, likes to see and handle any
  picture. It is stored in settings (`lambdawaves.q0.settings`). It is never written into a project, a link or a
  history row, and opening one of those never changes it. An older file that still carries a preference key is
  opened with that key ignored. The file itself is not rewritten.
- **WORKSPACE**: the arrangement, meaning which windows are where, how big they are, and whether they are folded or
  closed. It is saved in a project, because a demo brings its windows (the DAW law), and the device also remembers
  it. Whichever arrangement was applied last wins. It is never a history row.
- **PROJECT**: the work, meaning the physics, the picture and the modulation. It is saved in a project and a link
  carries what link format v1 has room for. Every PROJECT key is a history row except the camera pose (a view is
  not an edit), the notebook (text has its own editor) and quality (a device budget that rides along as advice).
  The history today covers only the register side and the LOOK knobs. Stages S3 and S4 widen it to this scope.

## The table

| key(s) | home | scope |
|---|---|---|
| `theme` (light / dark / system) | settings | PREFERENCE |
| `card`, `cardSet`, `frost`, `disc`, `blur`, `accent [a, b, vivid]` | settings | PREFERENCE |
| tags (`badges`), `controlHints`, `captions`, Help, window notes (LEAN), `gamut` / `p3Mode`, `warned`, `audioDevice`, key bindings, keyboard-editor position, `nativeLayout` | settings (and their own keys) | PREFERENCE |
| AUTO SCALE (`auto`), `governor`, `keepFrames`, `perfMode`, `modCadence`, `modArm`, `clockLink` | settings | PREFERENCE |
| camera feel: `friction`, `spin` (speed), `dragGain`, `fling` | settings | PREFERENCE (D4) |
| field chrome: `frame`, `axis`, `frameMode`, `axisMode`, `cornerSide`, `invert`, `axisInk` | settings | PREFERENCE (D1) |
| camera MODE, `presentation.obs.mode` (free / turntable) | project | PROJECT (D4's escape hatch, see below) |
| palette: `paletteId`, `palette {on, selected, stops}` | project | PROJECT (D2) |
| `ui.stage {mix, custom, follow}` | project | PROJECT |
| `experiment` (modes, preset, Bz/Fz, t, rate, window, damping) | project | PROJECT |
| `hamiltonian`, `rates`, `rotationRates`, `sturmian`, `wigner`, `mo`, `instruments`, `field`, `readers`, `space`, `domain`, `shadow` | project | PROJECT |
| `mat` LOOK: view, style, exposure, softness, iso, grain, knee, dither, hueShift, boost, gamma, finish, bow, slice, steps, paletteOn | project | PROJECT |
| `overlays` (vortex, kepler, particles, dials) | project | PROJECT |
| `obs` pose (yaw, pitch, dist, fov, quat) and `camera.autoRotate` | project | PROJECT, not in history |
| `modulation` (sources, macros, routes, transport, seq, v) and `modulationBases` | project | PROJECT |
| `ab` (A/B stores, omega, on) | project | PROJECT |
| `quality {res, steps, scale}` | project, clamped by the device (`deviceQuality`; a file never switches AUTO SCALE off) | PROJECT, advisory, not in history (D5) |
| notebook text, title and subtitle | beside the project data | PROJECT, not in history |
| `layout` (cards, docked, rackHidden, nb), `closed[]`, `nbW/nbH`, `abW/abH`, `modwin` placement, favourite `layouts` | settings and project | WORKSPACE |
| `phoneTr` / `phoneRack` (a phone's transport fold and hidden rack, read back from the page, so a project's layout writes them) | settings, through the layout | WORKSPACE (S2) |

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
- The history ring's LOOK record (`hLook`) still carries the chrome. It drops it in S4.
- Opening the bundled demo `lab/demos/wave-dancer.lambdawaves.json` no longer switches a reader's frame and axes off.
  This is D1's stated cost. S2 stripped its dead field chrome from `mat`; its `layout.look` and `layout.cam` blocks
  (written before S1, never read by `applyLayout`) are still in the file.

## Adding a key

Choose its scope before you write it. A PREFERENCE key goes in `saveSettings()` / `applySettings()` only. A PROJECT
key goes in `serialize()` / `restore()` only, and joins the history unless it is a view. A WORKSPACE key goes in the
layout record and the settings. No key belongs to two scopes.
