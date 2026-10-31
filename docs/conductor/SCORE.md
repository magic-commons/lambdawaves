# The score — λWAVES' conductor grammar, version 1

A SCORE is one JSON file in **bars, beats and the targets' own units**. `tools/conduct.mjs <score.json>` applies it in the lab
(`__LW.conduct.apply(score)`, the module `tools/conduct-score.js`) through the app's live doors into a project saved as
`CONDUCT/<name>`, bounces it with the RENDER card's own fields, and leaves `<name>.mp4 · .lambdawaves.json · .audit.json · .sheet.jpg`.
The target table is [TARGETS.md](TARGETS.md) (generated: `tools/conduct-targets.mjs`). Examples: `research/iteration-026/scores/`.

**THE SCORE THINKS IN BARS.** Every time is a beat on the ruler at the score's tempo (a bar = `meter` beats). An effect lands on a divisor of
the bar (¼ · ½ · 1 · 2 · 4 bars). Seconds appear once: `audio.offset`, the point in the file that plays at beat 0.

**ONE CLIP COVERS A TARGET AT A BEAT.** An audio band drives its target over the whole render range, so a lane never also names that
target; two lanes on one target never overlap. The conductor refuses the later one by name and skips it.

## The keys (in the order they are applied)

| key | unit / form | default | what it does |
|---|---|---|---|
| `conduct` | `1` | — (required) | the grammar version; anything else is refused whole |
| `name` | text (no `/`) | `UNTITLED` | the project `CONDUCT/<name>` and the files' stem |
| `title`, `notes`, `_…` | text | — | for the reader and the stitch's title; never applied |
| `tempo` | `{ bpm, meter }` | `{ 120, 4 }` | the transport's BPM (10…999) and the timeline's meter (1–8, 12) |
| `bars` | number > 0 | `4` | the score's length: `bars · meter` beats |
| `base` | `null` · `"NEW"` · a stored project path · a repo file path · project text · a URL | `null` (NEW) | the project the score starts from |
| `system.preset` | a preset id (`1s+2pz`, …) | — | SPECTRUM's preset, the hand's road |
| `system.modes` | `["h:n:l:m", ["h:n:l:m", amp, phase], { id, re, im }, …]` | — | the register, replaced (n ≤ 7) |
| `system.ab` | `{ a: [modes], b: [modes], omega, on }` | `omega 0.05`, `on true` | the A ↔ B TRANSITION (modes as above) |
| `system.rate` | a.u./s (0.1…3000) | — | the physics clock (`transport.rate`) |
| `molecule` | `{ id, basis, method, view, orbital, vibrate }` | — | MOLECULES on: `id` (H2O, C6H6, …), `basis` `sto-3g` \| `6-31+g-star`, `method` `rhf` \| `uhf` \| `lda`, `view` `density` \| `orbital` \| `diff` \| `esp` \| `spin` \| `dlda`, `orbital` a number or a name (HOMO, LUMO−1, 1b1), `vibrate` `true` or `{ mode, amp, breathe }`; waits for the solution |
| `look.palette` | a palette id or its number | — | PALETTE (TARGETS.md `palette.index` gives the order) |
| `look.paletteOn` | bool | — | PALETTE ON |
| `look.style` | a STYLE name or 0…11 | — | `cloud solid grain signed bands dust glass additive glassSigned balls sticks esp` (`shell` = glass, `shell±` = glassSigned, `add` = additive); `balls sticks esp` need MOLECULES on, else it stands down and is said |
| `look.view` | `density phase real imag` or 0…3; a MOLECULES view by name | — | the observable |
| `look.exposure` `softness` `iso` `grain` `knee` `gamma` `hue` `stage` | the knob's unit | — | the material targets (`material.*`; `stage` is the stage mix) |
| `look.invert` | bool | — | INVERT |
| `look.ground` | `[r, g, b]` 0…1 | — | the stage colour (`mat.stageCustom`) with STAGE at `look.stage` or 100 %: a film's own ground, not the theme's |
| `look.frame`, `look.axis` | bool | — | the field's FRAME and AXIS lines (a PREFERENCE, set live; a music video wants them off) |
| `look.slice` | `{ mode 0 off · 1 clip · 2 slab, axis 0 x · 1 y · 2 z, pos −1…1, thick 0.01…0.4 }` | — | CLIP |
| `camera` | `{ yaw, pitch, dist (or zoom), fov, panx, pany (or pan: [x, y]), mode, autoRotate }` | `autoRotate false` | the pose (radians; dist 1.2…8; fov 0.25…1.2); a film refuses a moving camera, so AUTO-ROTATE is off unless asked |
| `overlays.particles` | `{ on, count 20…600, trail 0…120 }` or bool | — | PARTICLES |
| `overlays.vortex` | bool | — | VORTEX › LOCATE |
| `nodes` | `[{ type, knobs: { k: v }, bypass }]` | — | the NODES graph REPLACED, in chain order (types: TARGETS.md › nodes); set live, never saved in the project (a device record) |
| `lanes` | see below | `[]` | automation lanes |
| `triggers` | `[{ action, at: [beats] }]` | `[]` | an `action.<id>` pulse (0 → 1 for ⅛ beat → 0) at each beat: `preset.next`, `style`, `view`, `invert`, `reseed`, `chem.vibrate`, … |
| `audio` | `{ file, offset, keep, bands }` | `keep true` | an audio-reactive arrangement, below |
| `render` | `{ fps, size, format, nodes, chrome, range, audio, caption }` | `{ 30, "1080p", "mp4", "on", "labels", [0, bars·meter], on when a KEEP clip exists }` | the RENDER card's fields; fps 24 · 30 · 48 · 60; size `current` · `1080p` · `1440p` · `2160p`; format `mp4` \| `png`; `range` [startBeat, endBeat] is TIMELINE · ACTIVE |

### A lane
`{ "target": id, "points": [[beat, value, tension?], …], "shape": "linear" | "smooth" | "step", "span": [s, e], "repeat": N, "norm": false, "name": "…" }`
- **points** are ABSOLUTE beats from 0 — or, with `span`, RELATIVE to `s`. A value is in the target's unit (TARGETS.md: map · min · max)
  and is clamped (and said) when off its range; `"norm": true` takes 0…1 instead. A STYLE, VIEW or PALETTE point may be its name (`"glass"`).
- **shape**: `linear` (the default); `smooth` eases in and out on every segment whose point carries no tension; `step` holds each value
  until the next point. The third number is the segment's tension (−1…1: + eases in, − eases out).
- **span** (default the whole score) is where the lane plays; **repeat** N makes the curve N beats long, repeated every N beats across the span.
- A `wrap` target (yaw, hue) turns freely: `[[0, 0.6], [16, 6.88]]` is one full turn (the curve is split at the seam).
- `nodes.<type>.<knob>` names a placed node by its type (`nodes.decohere.amount`, `nodes.grain#2.amount` for the second).
- Prefer the ABSOLUTE targets `material.style` · `material.view` · `palette.index` (integer, step) for a look change on a bar.

### Audio
`{ "file": "media/track.mp3", "offset": 12.8, "keep": true, "bands": { "level": "material.exposure", "low": { "target": "observer.dist", "min": 2.2, "max": 1.6 } } }`
- `file` is a path in the repo, served by the gate. **Tracks live in `media/` (gitignored: a track never enters git).**
- one clip per band (`level` · `low` · `mid` · `high`) on its own lane, spanning the render range; `offset` = seconds into the file at beat 0.
- a band's `min` / `max` are the depth window in the target's unit: `min` at silence, `max` at full (min > max inverts); a bare id keeps the full range.
- the FIRST band's clip KEEPs the file (it plays on the film: Opus-in-MP4); `keep: false` makes every band signal-only. `node tools/conduct-bpm.mjs <file>` measures the tempo and the first strong onset.

## Three examples
**A 2-bar hydrogen test** (`research/iteration-026/scores/test-2bar.score.json`): a yaw lane, an exposure breathing every half bar (repeat), a STYLE step at bar 2.
```json
{ "conduct": 1, "name": "TEST 2BAR", "tempo": { "bpm": 120, "meter": 4 }, "bars": 2, "base": null,
  "system": { "preset": "1s+2pz", "rate": 40 },
  "look": { "palette": "phosphor", "paletteOn": true, "style": "cloud", "view": "phase", "exposure": 1.2 },
  "camera": { "yaw": 0.6, "pitch": 0.4, "dist": 3.2, "fov": 0.9 },
  "lanes": [ { "target": "observer.yaw", "points": [[0, 0.6], [8, 3.74]] },
             { "target": "material.exposure", "repeat": 2, "shape": "smooth", "points": [[0, 0.8], [1, 3], [2, 0.8]] },
             { "target": "material.style", "shape": "step", "points": [[0, "cloud"], [4, "glass"]] } ] }
```
**A molecule, one orbital every half bar** (`water-orbitals.score.json`):
```json
{ "conduct": 1, "name": "WATER ORBITALS", "tempo": { "bpm": 120, "meter": 4 }, "bars": 4,
  "molecule": { "id": "H2O", "basis": "sto-3g", "view": "orbital", "orbital": 1 },
  "look": { "palette": "twilight", "paletteOn": true, "style": "glassSigned", "exposure": 1.4 },
  "lanes": [ { "target": "chem.orbital", "shape": "step", "points": [[0, 1], [2, 2], [4, 3], [6, 4], [8, 5], [10, 6], [12, 7], [14, 5]] },
             { "target": "observer.yaw", "points": [[0, 0.8], [16, 7.083]] } ] }
```
**An audio-reactive bar** (`kick-bar.score.json`, a click bed at 140 BPM whose first kick is at 5 s):
```json
{ "conduct": 1, "name": "KICK BAR", "tempo": { "bpm": 140, "meter": 4 }, "bars": 1, "system": { "preset": "1s+2pz" },
  "audio": { "file": "media/click-140.wav", "offset": 5.0, "keep": true,
             "bands": { "level": "material.exposure", "low": { "target": "observer.dist", "min": 3.0, "max": 2.2 } } } }
```

## The road
`node tools/conduct.mjs <score> [--out DIR] [--fps 30] [--size 1080p] [--format mp4|png] [--project-only] [--keep-open]` → review `<name>.sheet.jpg`
(one tile per bar at its first frame) → change the score → conduct again → `node tools/conduct-stitch.mjs OUT.mp4 a.mp4::"TITLE" b.mp4 …`.
