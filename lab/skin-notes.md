# skin.css — glass × neumorphism for λWAVES (rationale)

Load order: `lab.css` then `skin.css`. The skin only re-points lab.css's custom properties and re-dresses its selectors; remove it and the lab is whole again.
**No `backdrop-filter` anywhere** — measured at −26 fps (32 → 58) over the live canvas. The glass is tint + hairline + sheen gradient + shadow.

## Palette tokens
| token | value | hex | role |
|---|---|---|---|
| card tint | `hsl(214 16% 13%)` @ `--glass-opacity .84` | #191d23 over the stage | every card, chip, sheet |
| `--fg` | #f2f5f7 | | primary numerals |
| `--fg-soft` | `hsl(0 0% 88%)` | #e0e0e0 | titles, note body |
| `--dim` | `hsl(0 0% 72%)` | #b8b8b8 | secondary text |
| `--ink-key` | `hsl(0 0% 74%)` | #bdbdbd | control labels, resting glyphs |
| `--ink-faint` | `hsl(0 0% 64%)` | #a3a3a3 | eyebrows, sub-lines, group labels |
| `--acc` | #78e1f0 (`--hue-acc 188`, `--sat-acc 80%`) | #78e1f0 | LIVE / ACTIVE / ON only |
| `--acc-ink` | #071114 | | text on the play button |
| stage | #070a0f | | the field's black |
| `--rack-w` | 300px (was 372) | | the one layout variable |

## Shadow recipe (light from the top-left)
- **raised** `--neu-raise`: `-2px -2px 5px hsl(0 0% 100% / .06), 3px 3px 7px hsl(0 0% 0% / .55), inset 0 1px 0 hsl(0 0% 100% / .09)` — knob pucks, triggers, the chosen segment, chips, the hint ⓘ.
- **inset** `--neu-inset`: `inset 2px 2px 5px hsl(0 0% 0% / .55), inset -1px -1px 3px hsl(0 0% 100% / .05)` — faders, readouts, groups, seg tracks, canvases, anything ON (an ON control is pressed in and rimmed with accent at 35–60 %).
- **flat** `--neu-flat`: `0 0 0 1px hsl(0 0% 100% / .05)` — resting seats (switches, rows, badges).
- **card float** `--glass-shadow`: `inset 0 1px 0 #fff/.07` (the glass lip) `+ 0 12px 30px #000/.48 + 0 2px 6px #000/.35`. Dragging: `0 22px 44px #000/.6` + a cyan 1-px rim + `scale(1.012)`.
- sheen `--glass-sheen`: `linear-gradient(160deg, #fff/.07, transparent 42%)` painted over the tint. Neumorphic surfaces are opaque `hsl(var(--glass-tint) / 1)` so the puck reads as solid on the translucent card.

## Contrast on the card (WCAG, computed; card = tint @ .84 over stage / over a mid field #384048-ish / over a fully bright field)
- fg 15.5 / 12.9 / 10.3 · fg-soft 12.9 / 10.8 / 8.5 · dim 8.5 / 7.1 / 5.6 · ink-key 9.0 / 7.5 / 6.0
- ink-faint 6.7 / 5.6 / **4.46** (the only value under 4.5, and only when a bright ψ cloud sits directly behind a card; raise `--glass-opacity` to .88 or `--ink-faint` to 68 % if that case ever matters)
- acc 11.2 / 9.3 / 7.4 · warn 10.0 · ok 9.8 · bad 7.6 · acc2 6.8 · acc-ink on acc 12.6 · acc on an opaque seg segment 10.7
- rack at rest (opacity .86 over the stage): fg 11.7, ink-faint 5.3, acc 8.6 · mini transport bar (tint @ .72): ink-key 9.3 over stage, 6.7 over a mid field.

## What is glass, what is neumorphic
- **Glass**: the card (translucent tint, top lip, sheen, deep float shadow), the badges, the sheet, the mini transport, the value tooltips. Cards are individually shadowed on a transparent rack with a 10-px gap, so they already read as detached.
- **Neumorphic**: every control. Knobs and triggers are raised pucks; faders, readouts, groups and seg tracks are wells; ON = pressed in + accent rim; the chosen segment rises out of its well. No neumorphic text: type never relies on emboss, so contrast is carried by ink on tint alone.
- **Values on interaction**: `.k-val` / `.fd-val` are opacity-0 at rest; `:hover`, `.drag` (kit.js already sets it), `.active`, `[data-live]` or `:focus-within` fade them in at 120 ms; on release they linger 700 ms then fade over 350 ms. `.ro-sub` reveals on hover of its readout. Under `(hover: none)` nothing is hidden.
- **Hint icons**: add class `hinted` to any `.note` → a 22-px ⓘ in the card header (right of the stat, left of fold); `:hover` / `:focus-within` grows it into a 320-px panel with the glyph holding its screen spot. Inside a `.grp` it sits on the group's top-right corner. Second/third hints in one container step 28 px left. Folded cards hide it (their `contain: paint` would clip the panel).

## Checklist for the follow-up layout work
1. Add `<link rel="stylesheet" href="./skin.css">` after lab.css in index.html.
2. Add `class="mini"` to `#transport`.
3. Mount `<button class="ui-hide" title="hide UI (H)">×</button>` in `#stage`, wired to the existing `body.ui-hidden` toggle (rack.js:744). Hover-reveal of the *hidden* rack needs a hover zone; `body.ui-hidden #rack` is `display:none` in lab.css, so give the follow-up a `body.ui-hidden.peek` rule or an edge strip.
4. Drag: on `.dev-head` pointerdown add `dragging` to the `.dev`, reorder in `#rack` on pointermove, remove on up. Skip when the target is `.dev-fold`. The header already has `cursor: grab`.
5. Floating rack: set `#rack { position: absolute; right: 0; top: 0; bottom: 0 }` and `#lab { grid-template-columns: minmax(0,1fr) 0 }`; cards need no change. Keep `--rack-w` as the width.
6. Add `hinted` to the long `.note`s (rack.js 270/287/341/353/380/413/417/451/462/532 and the view files); give each `tabindex="0"` so keyboards open them. Leave `presetNote` (rack.js:334) and the inline bar notes (spectrum.js:17, orbit.js:21) plain — they are status lines.
7. `.k.active` / `[data-live]`: set them from the model when a parameter is being driven by keys or the BOW, so the value shows without a pointer.
8. Re-measure fps with the skin on; the only new costs are box-shadows and two gradients per card, no filters.
