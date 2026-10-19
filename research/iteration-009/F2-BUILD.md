# F2-BUILD · THE THREE LEFTOVERS (iteration 009, call 8)

Builder: Opus 5.5, its own worktree, branch `it009-f2` from BASE `033424d`. Gate server 9341 / GD 5341. The base tree (`git archive 033424d`)
was served on 9342 for the before shots. Both servers and geckodriver were stopped. NOT pushed.

Josh (2026-10-19) said yes to Yan's call 8: *"From F: a glyph on SPECTRUM's fill button; the ladders on the plain level-line look; STATES lanes
dimming under a restored MORPH."* All three came from iteration 008 F (`F-BUILD.md` Q3 and C2), which left them to Josh because each one is a
visual change.

No saved id, `chem.*` / `reg.*` target, `mol-*` / `reg-*` CSS hook, WORKSPACE key or serialize byte changes. `new-project --check` is in step.
The app literal in `rack.js` is untouched.

## 1 · SPECTRUM's EMPTY ↔ FILL ALL wears the register's glyph

- `lab/paint-stroke.js:77` `fillButton(row, titles, onPress)` lost its `words` mode, so there is one look and one glyph source (`GLYPH`,
  Gemini's rungs from U-BUILD). `:81` always draws the SVG. `aria-label` still reads FILL ALL / EMPTY, and `dataset.state`, the titles and
  the press road are unchanged.
- `lab/spectrum.js:61` calls it without `true`. The `pointerenter → fillSync` resync stays.
- `lab/skin.css:604` sizes the glyph at 18 px in any `.sp-head` (it was `.reg-pane` only), so SPECTRUM's head draws it at the register's size.
- Shot: `f2-shots/1-fill-button.png`. Before is SPECTRUM's words, after is the glyph in both states, and below them is the ORBITAL pane's head
  with the same glyph.

## 2 · The two register ladders on SPECTRUM's plain level line

`levelLine` moved out of `spectrum.js` into `lab/paint-stroke.js:94`, next to `fillButton` (architecture C1's "one rule, one alpha").

`levelLine(g, x0, x1, y, on, off, w = 1, fade = 1)`:
- off: `off` at α 0.42, `w` px;
- on: `on` at full strength, `w + 1` px.
- `fade` multiplies the alpha, so a mark can step back.

SPECTRUM calls it as before (`spectrum.js:311, 345, 359`, w = 1). Its pixels are the same: `rgb(…)` became `rgba(…, 1)`.

The colours stay each ladder's own: SPECTRUM uses shell colour on and theme ink off; ORBITAL uses accent A for occupied and B for virtual;
STATES uses its axis colour, or the theme ink for a dark state. F-BUILD quoted the alphas and widths, and those are what changed:

| ladder · mark | before | after |
|---|---|---|
| ORBITAL · off level (`orbitalsview.js:485`) | α 0.26, 1.5 px | **α 0.42, 1 px** |
| ORBITAL · off, not carried by the record (C₆₀) | α 0.10, 1.5 px | α 0.105 (0.42 × fade 0.25), 1 px |
| ORBITAL · lit (VIEW MIX etc.) | α 1, 2.5 px | **α 1, 2 px** |
| ORBITAL · lit, stepped back under VIEW ORBITAL | α 0.5, 2 px | α 0.5 (fade 0.5), 2 px |
| ORBITAL · the dial's cursor line under VIEW ORBITAL | α 1, 2.5 px | **α 1, 2 px** (the bracket still marks it) |
| STATES · off bright state / S₀ (`statesview.js:633`) | α 0.26, w px | **α 0.42**, w px |
| STATES · off dark state (theme ink × 0.7) | α 0.182, w px | α 0.294 (0.42 × fade 0.7), w px |
| STATES · lit | α 1 (dark 0.7), w + 1 px | unchanged |
| SPECTRUM | off 0.42 / 1 px, on 1 / 2 px | unchanged |

- STATES keeps its weight `w = 1 + 2√(f / f_max)` (S₀ 2). That weight carries the oscillator strength, which is information, not a look
  (C1's question 2). Its on = w + 1 rule was already SPECTRUM's rule at w = 1.
- Only the ORBITAL widths and both off alphas move.
- ORBITAL's hover `lw` now reads 2 for the cursor line too (`cur || lit`).
- No measured reason showed that the ladders need their own rule: at α 0.42 the off lines still read as dark next to the lit ones on the light
  theme (`f2-shots/2-ladders.png`, before on top, after below, ×2).

## 3 · STATES lanes dim under a restored MORPH

**The cause.** `.reg-morphing` was toggled in three places:
- `register-morph.js` `set()`, the hand's road;
- ORBITAL's own `applyRecord` and `adopt`;
- never on STATES' restore road, `applyRecord` → `M.load`, which is reached from `load()` and from the parked `wanted` record when the
  ladder lands.

**The fix, in one place.** `lab/register-morph.js:51`: `load()` toggles `.reg-morphing` by the restored `on`. `:47`: `reset()` removes it.
This also fixes a new solve under a playing STATES MORPH, which kept its lanes dimmed. ORBITAL's two hand copies (`orbitalsview.js` adopt and
applyRecord) are deleted, and ORBITAL behaves as before.

**The proof** (`f2-shots/3-morph-restored.png`), a real save and reopen:
1. H₂O, STATES, BEAT → A, KICK Y → B, MORPH at 0.4: the lanes are dimmed (opacity .45).
2. `__LW.serialize()`, then a page reload.
3. The project goes in through FOLDERS' door (`intake.ingest`, `.lambdawaves.json`) and opens as `f2/morph`.

- Base: MORPH on, s 0.4, `.reg-morphing` **absent**, opacity 1.
- `it009-f2`: MORPH on, s 0.4, `.reg-morphing` **present**, opacity .45. 0 page errors.

## The proof script

`f2-shots/probe.mjs` and `compose.py` (headless Firefox through `tools/gate/gatekit.mjs`, real pointer for FILL ALL, pointer parked before each
shot). Base: 7 / 8, the one red being the restored MORPH. `it009-f2`: **8 / 8**.

SPECTRUM's FILL ALL by a real press: 0 → 140 labels, and the button turns to the EMPTY glyph.

## The gate

| check | result |
|---|---|
| `node tests/pwa.test.mjs --write` | exit 0 (sw.js re-hashed) |
| `./test.sh node` | **exit 0** |
| `node tools/rack-deps.mjs --classes --no-write` | HOLDS (spectrum 25, molecules 15) |
| `node tools/new-project.mjs --check` | in step (16098 B) |
| `register` | **22 / 22** |
| `orbitals` | **24 / 24** |
| `chem` | 55 / 56. L5 (MORE folded) is the pre-existing red. |
| `history` | exit 0 |
| `project-formats` | 5 / 5 |

## CLAUDE.md

These sentences were appended to THE PAINT GESTURE paragraph:

> The same module holds what the three ladders share (iteration 009 F2): EMPTY ↔ FILL ALL (`fillButton`, one glyph, SPECTRUM's head too) and
> THE LEVEL LINE (`levelLine`: off at α 0.42 and w px, on at full strength and w + 1 px; SPECTRUM and ORBITAL w = 1, STATES w = the oscillator
> weight; `fade` steps a mark back). The register's A ↔ B MORPH is `lab/register-morph.js`: its `load` and `reset` set `.reg-morphing`, so a
> restored MORPH dims the lanes exactly as a hand-set one, in both panes.
