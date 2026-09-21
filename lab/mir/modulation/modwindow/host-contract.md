# MIR · modulation window — the host contract: what a host supplies, and nothing more

**Provenance.** Written on 2026-09-06, when this window was staged from BASINS (the MANDELBROT
project) for λWAVES as a byte-frozen port. Adopted into MIR on 2026-09-10 and corrected for the
kit on 2026-09-16. MIR 1.1.0 retired the byte-frozen law, and MIR is now the window's source.
**BASINS-era references:** `anim.js:NNNN` and `index.html:NNNN` are lines of BASINS' own files as
of 2026-09-06, `glass.js` and `glasslight.js` are BASINS' files in the MANDELBROT project, and
`EXTRACT-MODWINDOW.md` was the extraction's staging report; none of them is in MIR. The counts below (`#modwin` 164 times, 24 aria-label rules, 135 × `44px`)
were taken on the staged sheet that day; the sheet has changed since, so recount before asserting one.

Two files mount this window: `modwindow.css` and `modwindow.js`. *(In MIR they are
`mir/modulation/modwindow/`, and the kit's host seat `mir/modulation/modhost.css` loads just
before `modwindow.css` — see `README.md`.)* They carry their own
material (twenty `--m2-mat-*` tokens), their own icons, their own geometry laws and their
own chrome. What they do **not** carry is a theme, a model, and a clock.

---

# PART 1 — THE SIX HOST-SPECIFIC ITEMS

EXTRACT-MODWINDOW.md §5 found six, and four of them are one-word substitutions.

## 1. The id `modwin`

`modwindow.css` reads `#modwin` **164 times**, at specificity `(1,x,y)`. Keep the literal
id on the window root — `modwindow.js` sets it. If it is genuinely taken, run **one**
substitution across `modwindow.css` (`#modwin` → `#yourwin`) and pass `host.id`. Do
**not** demote the id selectors to classes: a host's own `.some-panel button { … }` would
then win every tie.

## 2. The aria-label `"MODULATION window controls"` — the most fragile thing here

**24 rules** in `modwindow.css` select on this string byte-for-byte — the five the
window's own sheet always had, plus the 19 chrome rules this port scoped through the
same hook rather than inventing a second one:

```css
.kwin-chiprail[aria-label="MODULATION window controls"] .crail-chip::before { … }
```

`buildChipRail` builds the label as `(title || root.id) + ' window controls'`, so
**passing `title: 'MODULATION'` is what makes it correct** — and it is the default.
Translate the title, sentence-case it, or drop it, and the chip rail silently loses its
material: no error, no console line, nothing but "the chips look wrong".

If a host must rename the window, change all 24 to a `data-*` hook in the same pass —
one find-and-replace. That removes the trap permanently.

## 3. The accent hues — **this is the parameter. Two numbers.**

```css
--hue-acc: 172;   --sat-acc: 52%;      /* Accent A */
--hue-acc2: 288;  --sat-acc2: 75%;     /* Accent B — falls back to A if unset */
```

Everything else derives, including the ENV's own green
(`--m2-env-ink: hsl(calc(var(--hue-acc) - 52) calc(var(--sat-acc) + 3%) 66%)`).
There is **not one literal hue** anywhere in this stylesheet.

The colour law, from the source's own comment (`anim.js:2653`), is not decoration:

> Shape/recess says control · **Accent A** says structural value/selection · **Accent B**
> says only live modulation/signal · **white** says active interaction/focus.

Selection is an **underline**, never a filled accent chip. That is the single most
recognisable thing about these controls after the knobs.

*(In MIR 1.4.0 the house sheets speak the same parameter: `mir/css/base.css` and
`mir/css/skin.css` derive `--acc` from `--hue-acc` / `--sat-acc` / `--lum-acc` and `--acc2`
from `--hue-acc2` / `--sat-acc2` / `--lum-acc2`, and declare both again on `<body>` with
`--acc-soft`, `--acc2-soft` and `--acc-glow`, so an app that writes the hues turns the house.
The WINDOW does not follow by itself: `modhost.css` re-declares `--hue-acc` / `--sat-acc` (and B's) on
`.mir-modwindow`, so the window's derived tints stay on its own hues until the host hands it the
accents — λWAVES calls `modView.setAccent(hueSat(A), hueSat(B))`, which `shell/accent.js` offers as
`onAccent`.)*

## 4. The fonts

```css
--font-sans: -apple-system, system-ui, sans-serif;
--font-num:  ui-monospace, Menlo, monospace;
```

Supply the two names. Every size in this window is a literal and does not move.

Separately: five elements paint with `font: inherit` (`.m2zoom`, `.m2audgrip`,
`.m2audmac`, `.modxport`, `.modtempo`), so the window's **ambient** font matters. BASINS
sets it on `body`; a host must set an equivalent on the window's container or on the root
itself, or those five fall back to the UA font.

## 5. `--ui-scale`

One multiplier on `--touch`, `--fs-*`, `--r-*`, `--sp-*`, `--kwin-bar-h`,
`--chrome-chip-*` and the whole transport strip. **Supply `1` and every computed value is
byte-identical to what ships.**

## 6. The persistence keys

BASINS uses nine: `mandel.anim`, `mandel.animPlay`, `mandel.animPanel`, `mandel.win.mod`,
`mandel.modsize`, `mandel.modcadence`, `mandel.modwin.bars`, `mandel.modwin.workBars`,
`mandel.modwin.deviceModes`. `modwindow.js` reads and writes **none** of them — it has no
persistence at all. Rename the prefix in whatever the host's own store is, and remember
what the window's presentation state actually is: the work-bar lane (top / bottom / hidden), each
device's mode (F / C / M), and the window geometry. *(The one key the kit itself writes is the
model's preset store, `mod.js` `PRESET_LS` — λWAVES' `lambdawaves.q0.modpresets`, shared by every reader
because each app has its own origin; it is not injectable yet, see PORT-NOTES 1/8.)*

---

# PART 2 — THE TOKENS. Paste this block into the host's own `:root`.

These are BASINS' shipping values, from `index.html`'s base `:root`. Every one is read by
`modwindow.css` and declared by nothing in it. *(An app on MIR does not paste this block:
with `mir/css/base.css`, `mir/css/skin.css` and `mir/modulation/modhost.css` loaded, every name
the window reads is declared in the house's values (`--glass-sat` and `--glass-bright` only fed
BASINS' `--glass-filter`, which the house sets to `none`; `--glass-canvas-scrim` is optional, below),
and `modhost.css` carries the required `.m2root` line as well. The block is for a host that mounts
`modwindow.css` without the kit's sheets.)*

```css
:root {
  /* ── the two parameters ─────────────────────────────────────────────── */
  --ui-scale: 1;
  --hue-acc: 172;  --sat-acc: 52%;
  --hue-acc2: var(--hue-acc);  --sat-acc2: var(--sat-acc);
  --hue-bad: 4;

  /* ── the ink ────────────────────────────────────────────────────────── */
  --acc:       hsl(var(--hue-acc) var(--sat-acc) 68%);
  --acc-soft:  hsl(var(--hue-acc) var(--sat-acc) 68% / 0.30);
  --acc-ink:   hsl(var(--hue-acc) calc(var(--sat-acc) + 3%) 7%);
  --acc-glow:  0 0 9px hsl(var(--hue-acc) calc(var(--sat-acc) + 8%) 64% / 0.60);
  --acc2:      hsl(var(--hue-acc2) var(--sat-acc2) 68%);
  --acc2-soft: hsl(var(--hue-acc2) var(--sat-acc2) 68% / 0.30);
  --bad:       hsl(var(--hue-bad) 62% 74%);
  --fg:        hsl(0 0% 100%);
  --fg-soft:   hsl(210 8% 88%);
  --dim:       hsl(210 7% 76%);
  --ink-shadow: 0 1px 2px hsl(0 0% 0% / 0.58), 0 0 5px hsl(0 0% 0% / 0.34);
  --mark-under: hsl(0 0% 0% / 0.38);

  /* ── the type ───────────────────────────────────────────────────────── */
  --font-sans: -apple-system, system-ui, sans-serif;
  --font-num:  ui-monospace, Menlo, monospace;
  --fs-lead:  calc(13px * var(--ui-scale));
  --fs-small: calc(10px * var(--ui-scale));
  --fs-tiny:  calc(9px  * var(--ui-scale));
  --tr-wide: 0.12em;  --tr-wider: 0.14em;  --w-bold: 650;

  /* ── the grid ───────────────────────────────────────────────────────── */
  --touch:    calc(44px * var(--ui-scale));   /* THE 44 px LAW's unit */
  --grip-hit: var(--touch);
  --r-sm: calc(5px  * var(--ui-scale));
  --r-md: calc(8px  * var(--ui-scale));
  --r-lg: calc(12px * var(--ui-scale));
  --sp-1: calc(3px  * var(--ui-scale));
  --sp-2: calc(5px  * var(--ui-scale));
  --sp-3: calc(7px  * var(--ui-scale));
  --sp-4: calc(10px * var(--ui-scale));
  --sp-5: calc(14px * var(--ui-scale));
  --z-win: 12;
  --kwin-bar-h:          calc(26px * var(--ui-scale));
  --chrome-chip-disc:    calc(48px * var(--ui-scale));
  --chrome-chip-target:  max(44px, calc(62px * var(--ui-scale)));

  /* ── the glass ──────────────────────────────────────────────────────── */
  --glass-hue: 212;  --glass-sat-tint: 12%;  --glass-lum: 17%;
  --glass-tint: var(--glass-hue) var(--glass-sat-tint) var(--glass-lum);
  --glass-opacity: 0.46;                     /* floor 0.42, stated in source */
  --glass-blur: 8px;                         /* hard ceiling 20px, law L1 */
  --glass-sat: 188%;  --glass-bright: 108%;
  --glass-filter: blur(var(--glass-blur)) saturate(var(--glass-sat)) brightness(var(--glass-bright));
  --glass-border: 0.6px;
  --glass-border-color: hsl(0 0% 100% / 0.22);
  --glass-hairline:     hsl(0 0% 100% / 0.11);
  --glass-sheen:        hsl(0 0% 100% / 0.09);
  --glass-shadow: 0 3px 13px hsl(0 0% 0% / 0.22);
  --glass-raise:  hsl(0 0% 100% / 0.05);
  --bar-raise:    var(--glass-raise);
  --glass-press:  hsl(0 0% 100% / 0.15);
  --glass-groove-hot: hsl(0 0% 100% / 0.18);
  --glass-well:   hsl(var(--glass-tint) / 0.22);
  --glass-canvas-scrim: 0.26;

  /* ── the bevel's inputs.  ALL OPTIONAL and ALL ADDITIVE: BASINS' glasslight.js
        samples the picture behind each surface and writes them INLINE on the
        element.  With no such engine the bevel is `transparent` and NOTHING
        LOOKS BROKEN — but the names must exist or the box-shadow that reads
        them becomes invalid and takes the window's shadow down with it. ── */
  --gl-w: 1.6px;
  --gl-t: transparent;  --gl-r: transparent;
  --gl-b: transparent;  --gl-l: transparent;
  --gl-glow: transparent;
  --gl-fill: transparent;
  --gl-fill-a: var(--gl-fill);  --gl-fill-b: var(--gl-fill);
}
```

**REQUIRED, and it is one line.** EXTRACT §7.8: `--fill`, `--hit`, `--signal` and
`--needle` are written *inline on elements* by the paint, and they are four very generic
names. Custom properties inherit, so a host that declares any of them on `:root` or on an
ancestor has it inherited *into* these elements and used before the first paint writes the
inline value — the fallback never fires and the first frame is wrong. Add:

```css
.m2root { --fill: 0; --hit: 0; --signal: 0; --needle: -150deg; }
```

**Optional.** `--m2-separation`, written on `<html>` by BASINS' `glass.js`, drives the
whole material ladder through `--m2-blend`. With neither it nor `--glass-canvas-scrim`,
`--m2-blend` falls back to `0.26` and the material is exactly what the default install
paints. There is nothing to supply.

---

# PART 3 — THE FOUR BEHAVIOURAL EDGES

The other project spent a whole mission proving one thing: this window boots on **four
injected edges** and nothing else. Not on a renderer, not on a scheduler, not on a GPU,
not on a canvas. **MIR has all four, in `mir/modulation/`** (λWAVES had them in `lab/mir/`).

| edge | what it is | MIR |
|---|---|---|
| 1 | **the parameter registry** — `has(id)`, `get(id)`, and a `label` per target; it is what makes a control routable, and `m2droppables()` walks it | `mir/modulation/registry.js`, `createRegistry()` |
| 2 | **a target host** — `install` / `sync` / `uninstall` / `available` | `mir/modulation/host.js`, `createTargetHost()` |
| 3 | **a clock that owns modulation time** — the whole of the risk, and six behaviours read the same two numbers (`dt`, wall stamp) and mean different things by them | `mir/modulation/host.js`, `createModClock()` |
| 4 | **presentation + geometry invalidation callbacks** — default no-ops | `mir/modulation/host.js`, `createModHost()` |

Plus the model itself: `mir/modulation/mod.js` (LFO, ENV, AUDIO, macros, routes, transport,
serialization, presets) and `mir/modulation/curve.js` (the breakpoint mathematics it leans on).

## What the host must do with the tree

`modwindow.js` returns element references and wires nothing. For each of these, the host
attaches the behaviour and does the painting. *(MIR does not ship that host controller. λWAVES'
`lab/modwindow.js` (λWAVES) is one, and BASINS and NEBULA copied it into their own trees; its API —
`wireGrip`, `wireDepth`, `paintDepth`, `rebuildMacros`, and a `moveMacro` that calls the model's
`M.moveMacro` and rebuilds the rail — is that file's, not the kit's. The kit supplies the tree
below, the four edges and the model.)*

- **the transport strip** — `mw.transport.{xport, tempo, tempoNum, tempoUnit, tempoHz,
  tempoIn, tap, sync, cad, holds}`. `xport` swaps between the two exported literals
  `SVG_PLAY` and `SVG_PAUSE` through `innerHTML`. The responsive law is `.tight` (hides
  the derived Hz) then `.tighter` (also hides the `BPM` unit); **the number itself never
  goes.**
- **the preset bar** — `mw.foot.{open, save, name, prev, next, dead}`. `dead` starts with
  `.off`, which is `display: none`; a warning that is always on the glass is furniture.
- **the macro rail** — `mw.addMacro({id, kind}, index)` per macro, 1-based. Paint
  `.vname`, `.vnum`, `.drive`, and write `--fill` (knob) or `--hit` (trigger)
  inline on `.signal`. The track line under the name is `.m2signal::before` — a
  pseudo-element. `.m2rowgrip` is the dedicated vertical reorder surface and
  `.m2slotx` is its lower-half delete action. Compact mode hides the value face
  while retaining route, master depth and row tools. There is nothing in the DOM
  to find for the track.
- **the rack** — `mw.addDevice({id, kind})`, kind `'lfo' | 'env' | 'audio'`. Cards are
  appended to the horizontal scroller. `setDeviceMode(dev, 'F' | 'C' | 'M')` is the whole of the
  presentation tri-state.
- **the curve** — write `d` on `dev.ed.path` and `dev.ed.fill`; bind its pointer surface through
  `../curve-gesture.js`. The 1.4.2 law is FL Studio's: right-drag empty space adds and places a point;
  Shift-right-click adds at the curve's current value;
  left-drag moves a point or tension handle; Ctrl fine-tunes tension; right-click resets a tension
  handle; Alt-left-click deletes a point. Plain left-click on empty space is inert. `svgPoint()` must
  transform client pixels into the SVG viewBox before `curveHit()` is asked, or a resized visible
  tension handle becomes an empty-space press. A deterministic analytic wave materializes on its
  first edit and never asks the user to select a preset. The measuring law is
  `w = max(60, round(box.clientWidth) || 206)`,
  `h = max(60, round(box.clientHeight - 14) || 128)`,
  `px(t, v) = [11 + t·(w − 22), h − 11 − v·(h − 22)]`.
- **the knobs** — write `--needle` inline on `dev.knobs[k].dial` and paint the arc pack
  `dev.knobs[k].arc` (`.trk` / `.band` / `.val`, `strokeDasharray`). The host's control
  layer should add `.kctl` and `.ctl-round` to `.dial`; `modwindow.css` styles all four
  states (`.kctl`, `.ctl-sel`, `.ctl-frozen`, `.drag`).
- **routing** — `buildRing(control, o)`, `buildSpan(control, shape)`,
  `buildClear(control, targetId)`, `buildGhost(text)`. **These attach to the routed
  control, wherever it lives**, and their CSS is deliberately unscoped for that reason.
  Rings stack at a 44 px pitch with the CLEAR button 46 px past the end, all by inline
  `translateY(calc(-50% + Npx))`.
- **the sheets** — `mw.buildDevicePick()`, `mw.buildMacroPick()`, `mw.buildPresetSheet()`,
  `mw.buildDeadInspector()`, `buildAudioSheet(dev)`. All four live on the window root and
  are born `hidden` so the first tap shows rather than hides.

## The size laws, which the host applies and does not invent

`sizeLaw` is exported and is arithmetic only — it never measures the live window.

```js
sizeLaw.width(['F','C','M', …], { uiScale, ribbon })  // 22·scale + 224 + 14 + 89 + Σ cards + n·7, floor 360
sizeLaw.height({ uiScale })                           // 98·scale + 368  = 466
sizeLaw.minHeight({ uiScale })                        // 98·scale + 220  = 318
sizeLaw.workBars(rackRight, viewport, hasDeadSends)   // -> { left, width: 450, coreW, presetW }
mw.setViewHeight(windowHeight)                        // writes --m2-view-h, clamped [220, 368]
```

**The timing bar is 450 px and never changes width.** The preset bar gives up width to it,
clamped to [244, 294], and only then does the lane stop shrinking.

## Four things a host must not undo

1. **`#modwin.modwin { overflow: visible; contain: layout }`** and
   **`#modwin.modwin > .kwin-body { overflow: visible }`**. `.kwin` carries
   `contain: layout paint` precisely so no descendant paints outside a window — a real
   Android bug. This window undoes half of it because the work bars are *allowed* to paint
   beyond it. Keep `contain: paint` on the root, or `overflow: hidden` on the body, and
   the transport strip is clipped with no error.
2. **The cascade order.** In BASINS the window's own sheet is appended to `<head>` at
   first open, so it wins every tie. `modwindow.css` reproduces that internally (chrome
   first, PART B last). Do not load a host sheet after it that can reach inside
   `.mir-modwindow`. If the host is layered, `@layer modwindow { … }` declared after every
   host layer does the same job.
3. **The 44 px law.** `44px` appears 135 times, `min-height: 44px` 33 times, and there are
   nine `::before` hit-band restorations where the ink is smaller — `.m2fold`, `.m2ab`,
   `.m2move`, `.m2pow`, `.m2x`, `.m2grab`, `.m2ring`, `.m2clr` and `.modtempo`. It is the
   reason the window works on an iPad and dropping it is the fastest way to make a copy
   feel wrong.
4. **`.m2retired` on the window root.** `modwindow.js` adds it; it is what hides the
   retired tab strip.
