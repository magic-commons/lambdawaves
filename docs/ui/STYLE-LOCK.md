# λWAVES STYLE LOCK
*Established choices an agent must PRESERVE, not rediscover. Read this instead of inferring the house style from
lab/rack.js. If you want to change something in here, say so in your report and let Josh decide — do not drift.*

## The one law
λWAVES is an **instrument**, not a page. CANVAS = the world · WINDOWS = instruments · RACK = the workspace ·
CONTROLS = parameters · TRANSPORT = time · NOTES = the physics. Nothing here is a web dashboard, and the density
is deliberate. Freedom outside (the rack rearranges, a window comes off it, the theme and accents are the user's);
discipline inside (a window's interior stays spatially stable so muscle memory survives).

## Tokens — the source of truth is `lab/skin.css :root`; these are locked
*(`lab/lab.css :root` is the base ladder underneath it and owns `--font-ui`, `--touch`, `--acc2`, `--rail-w` and
the `--fs-*` / `--sp-*` / `--r-*` scales; skin.css re-points what it re-dresses. Both are `:root` — see Theme law.)*
- Geometry: `--rack-w: 300px` · `--card-gap: 10px` · `--card-r: 14px` · `--touch: 44px` · `--rail-w: 46px`
  (a COMPACT window's strip). The layout reads the rack width from that one variable — never hard-code it. A
  floating window's width is `--float-w`, **measured from the rack's own content box** when it pops out, so the
  card is pixel-identical on the stage and in the rack.
- Glass: `--glass-hue/sat-tint/lum` (hsl(214 16% 13%)), `--glass-opacity: .84` — chosen so the field underneath
  can never pull text below 4.5:1. **That guarantee covers the TINTED pane, NOT the shipped desktop default**:
  REFRACTIVE is `background: transparent`, so on the surface most users see there is no pane between the ink and
  the live field, and the ink ladder's own ≥ 4.5 : 1 below is measured against the tinted card. Wave 59 audited
  the surfaces and changed nothing here, so it still stands. `skin.css` forces `--glass-opacity: 1` on phones,
  but REFRACTIVE has no pane for opacity to act on, so the contrast guarantee still describes TINTED only.
  REFRACTIVE is the official default on every layout; know which surface a contrast number describes before
  you quote it.
  `--glass-border-color` .14 edge, `--glass-hairline` .08 inner, `--glass-sheen` (a 160° highlight that
  REPLACES blur), `--glass-shadow` "tight and quiet" (Josh's words).
- Relief: `--neu-raise` (stands proud) · `--neu-inset` (a well cut into the card) · `--neu-flat` (a resting seat).
  `--glass-well / --glass-raise / --glass-press / --glass-groove(-hot)` are the interaction states.
- Ink: `--fg #f2f5f7` · `--fg-soft` · `--dim` · `--ink-key` · `--ink-faint` — every one is ≥ 4.5:1 on the card.
  Never invent a new grey; pick the existing rung.
- Accent: `--acc #78e1f0` (the house cyan) with `--acc-soft` and `--acc-glow`; ACCENT B is `--acc2` / `--acc2-soft`.
  ACCENT A carries instrument emphasis and state; ACCENT B carries relationships — macros, modulation, routing,
  the solo marks. Both are angles on the live palette wheel and recolour the whole UI, so never hard-code a hex
  where an accent belongs.
- **THE ACCENT'S CONTRAST IS A RULING, NOT A DEFECT (Josh, 2026-09-05).** An audit measured every angle of all
  23 palettes on both themes: the LIGHT theme cannot reach 4.5 : 1 anywhere, because `legible()` uses one
  constant (OKLab L = 0.62) as both the dark floor and the light ceiling, and a neutral at that lightness on
  the light card is 3.22 : 1 by arithmetic. Josh has read it and ruled: *"the legibility is fine to me, you can
  customize vividness as I like all of that. That can stay."* **Do not change the clamp, do not touch VIVID, do
  not chase a contrast threshold for any accent.** If it is ever revisited it is his call, not a wave's.
- The number ladder `--n1 … --n6` has a LIGHT variant (`N_RGB_LIGHT` in kit.js). Colour for data goes through
  `nRGB()` / `vividInk()` / `themeInk()`, never a literal. **A canvas reads a CSS colour through the ONE reader
  in kit.js** — `cssRGB()` / `parseCssColor()`, which knows hex, `rgb()` and `color()` including display-p3 —
  and the two accents come from `accentRGB()`, which the wheel PUBLISHES (`setAccentRGB`) rather than the DOM
  being re-parsed. Never write a private colour reader, and never a hex fallback that is a past accent.
- **THE LOGO IS TWO OBJECTS.** The λ is TYPE and goes through `visibleInk()` (palette.js) at a stated floor of
  **3 : 1** — hue and chroma handed through, only lightness moves, a no-op wherever the colour already clears.
  **It has TWO GROUNDS and only one of them is a constant (wave 59).** The notebook's `.nb-logo .lam` really is
  on a card and takes `MARK_GROUND`; the header's `#title .lam` is `background: none` over `#field`, whose clear
  colour is **the shipped STAGE knob** — a ground the user can drag — so it reads `mat.bg` live. Correcting the
  header copy against a constant was wave 57's bug: at STAGE 0.50 on dark it left 92.8 % of the wheel under
  3 : 1. Two constants that came with the fix and must not be "tidied": `visibleInk` chooses its walk direction
  at **√0.0525 − 0.05 = 0.1791287847**, the *ratio's* break-even and not the *scale's* midpoint (0.5 left 7 416
  of 91 080 swept samples under the floor, worst 1.686 : 1; the break-even leaves 0, worst 3.000 : 1), and the
  floor is checked on the **8-bit colour the browser draws**, not on the float.
  The nine mark squares are the PALETTE showing itself and take the wheel's colours
  **verbatim**: a swatch corrected for its ground lies about the colour it is a swatch of. If they ever need to
  be seeable on a pale palette the answer is a hairline EDGE, not a recolour.
- Time: `--t-fast .12s` · `--t-soft .35s` · `--t-linger .7s` · `--logo-turn 1.2s`. See MOTION-LAW.md before using
  any of them.
- The phone breakpoint is written ONCE, in skin.css, and raises the sentinel `--phone: 1`; script reads that back
  out of the computed style rather than carrying a second copy of the query (wave 51).

## Material semantics (colour is information, material is furniture)
idle = neutral glass · hover/focus = frostier, brighter · press/latched = darker, recessed (`--glass-press`,
`--neu-inset`) · signal = restrained ACCENT A · relationship/modulation = ACCENT B. Moving AWAY from large
saturated rectangles used as generic selection furniture: if a state can be said with material, do not spend colour.

## The widget vocabulary — `lab/kit.js`
`knob` · `sw` · `seg` · `trig` · `fader` · `readout` · `device` (a window) · `group` (a labelled block inside one)
· `chip` (a header button's drawing). **A new widget is a design decision, not a convenience.** Compose from these
first; if you genuinely need a new one, name it in the REPORT with the reason. `graphHover` + `#graphTip` is the
one hover-information mechanism — do not build a second tooltip.

**Header marks are DRAWN, not typed** (wave 55). `chip(btn, name, label)` is the single call site; it sets the
SVG, the `data-gly` name a gate can read, and the accessible name together, because a button whose only content
is an aria-hidden drawing has no name. The drawings come from `lab/mir/glyph.js` — **Josh's own library, vendored
from MANDELBROT by sha256 and maintained by diff, not rewritten** (`lab/mir/PORT-NOTES.md`, alongside `mod.js`
and `curve.js`). Sizing is ours and lives in `lab.css §55b`; no call site passes a pixel count. Which marks became
drawings and which did not is listed in REPORT.md's wave-55 block — ⏻ POWER, ⧉ COPY, ◧, ☆ and the notebook's
◐ ▤ are still not drawings, because the library offers no equivalent. Do not invent one to close the gap.
**Know what those leftovers cost (wave 59, found and deliberately not fixed):** ◧ ▶ ☆ ▾ ⇄ ⓘ ⏻ ⧉ ◐ ▤ are in
**neither shipped face** and never were — the original Roboto has none of them either, so the subset dropped
nothing and they have always come from a system fallback. A machine with no font covering U+25xx shows tofu for
the transport's own play button. So: reuse the characters already on screen rather than reaching for a new one,
and if a mark must be reliable, it has to be a drawing.

## Windows: docked, floating, folded, compact
- **Any window can come off the rack** (wave 55) and it is the transport's own dock mechanism widened, not a
  second one beside it. `#floats` is one absolutely-positioned, pointer-transparent layer above both racks and
  **below the notebook and the menus**, so a menu can always be opened over a window.
- **Dragging is by the HEADER alone** — not one pixel of the body, and not all of the header either, since the
  chips keep their own clicks. Pointer events throughout, so mouse, pen and touch are one code path.
- **A floating window is deliberately NOT resizable.** A corner grip is exactly the control the one law forbids:
  it would reflow every row and spend the muscle memory the law protects. A floating card is the rack card's
  width and nothing else changes its box.
- **COMPACT is not FOLD.** FOLD is a *height* act (the body goes, the rack's width is kept, a title bar is left)
  and works anywhere. COMPACT is a *width* act a rack card cannot perform: a 46-px vertical rail carrying the
  name, POWER, CLOSE and the way back. Both are available on a floating window; keep them apart.
- **TAB order, stated:** the mirror rack top to bottom, then the right rack top to bottom, then whatever is
  floating, back-most first. Frozen at the first TAB of the session; the cycle holds the *elements*, so a window
  keeps its seat when it pops out or docks back. **This is a WINDOW-RAISE cycle and it was never a focus order**
  — and since wave 57 it fires **only while the stage has focus**. Tab was an application key everywhere, which
  meant keyboard focus could not move at all (WCAG 2.1.2, a literal trap); the stage is now a pointer-only focus
  target (`tabIndex = -1`, focused on `pointerdown`) and **Escape** lets go of it, so from `<body>` Tab walks
  into the interface, from a control Tab walks on, and from the world it still cycles windows. The rule is
  deliberately narrower than "body or canvas": a rule that eats the press on `<body>` leaves the trap at the door.
  **The rest of keyboard operability is NOT built** — focusable knobs, arrow-key values, the menubar, segmented
  state, and the bare printable keys that still fire while a control has focus. That is a project and it is
  Josh's call; REPORT.md's wave-57 block lists what remains.
- **The phone has no floating at all.** The chip stands down in CSS and `popOut()` refuses in script — control
  and act agree. Crossing the breakpoint docks every floating window first, and remembers, because wave 51's law
  is that the crossing is reversible in both directions.
- **On a phone the rack starts HIDDEN, so the field is what a visitor meets (wave 59).** At 390 px the rack is
  300 of them and opaque, and nothing hid it: the volume rendered centred *behind* it and the 90-px strip left
  over showed the far corner of an empty domain box. It is a **DEFAULT, not a rule** — `phoneRack` is the same
  kind of settings key as `card` and `phoneTr`, and pressing ◧ *is* this browser saying which it wants. Two
  refusals from the same wave, kept as house reasoning: the transport was **not** undocked into a floating pill,
  because it stays at the top of the rack by Josh's wave-51 instruction; and the volume was **not** offset to
  dodge the rack, because **moving the camera to dodge furniture lies about where the origin is** — and a 90-px
  picture is not the cure for a 90-px picture. The phone gets the legend instead.

## A window may ABSORB another — and the ID does not follow the TITLE (wave 56)
DRAW STYLE is no longer a window. SPACE and DRAW are **one card titled WAVE**: a SPACE group (the two exact
pictures, the observable grid, EXPOSURE · SOFT · HUE) over a DRAW group (everything the `style` window was),
with **INVERT · FRAME · AXIS in a bare row at the foot, in neither group** — the three of them are one thought,
*what is drawn over the field*, and none is about ψ. The space segment lost its own "SPACE ·" prefix: a label
that repeats its heading is noise. **The card keeps `data-id="observer"`** — Josh: *"we don't need to make a new
wave id"* — because the id is what `lab.css` and `skin.css` read to lay the observables out, what the settings
key's `closed[]` names, what a saved LAYOUT names, and what four gate blocks measure. A retitle is not a new
device.
- **A saved LAYOUT is a list of window ids and nothing else**, so retiring an id silently drops a seat out of
  every layout ever saved: `applyLayout` simply `continue`d past a card it could not find, which *loads* and
  loses the window with no error. The law is `RETIRED_WINDOWS = { style: 'observer' }` in `rack.js` —
  a retired id resolves to its heir, and **the heir's own record wins when both are named**, because it is one
  window now and one window can only be in one rack. Nothing bumps the layout version: v1 and v2 records read
  exactly as they always did.
- **Merge or rename a window and you EXTEND that map** — in the same wave, in `rack.js`, with a gate block that
  loads an old layout naming both ids. Do not instead invent a second migration road, and do not leave the old
  id to rot.

## The modulation window is an OUTLIER, by ruling — and its CONTROLS stay in it (amended, wave 61)
Josh, 2026-09-05: *"Modulation related stuff stays with modulation. It must be treated like the outlier and it's
okay. It's an organization thing."* The permission is conditional on the containment, so the containment is a law:
**modulation's own controls — sources, macros, the transport, the routing pickers — live in the modulation window
and its transport pill, and nowhere else.** It is the only window that defaults to floating; every other ships
docked and is popped out by a hand.

**THE WINDOW HAS A SHAPE, and the shape is the window (wave 60).** *"It seems like the modulation window still
hasn't started yet"* — and it was measurable: the face surfaced 23 of the model's ~95 controllable facts, all of
them the *wiring*. What it lacked was the picture. The laws that came out of building it:
- **ONE renderer for both source kinds.** `envPoints(s)` hands back the identical `{t,v,tension}` list an LFO
  draws, so the envelope is **the same picture with a different door** — point drags write `{a} {hold} {d,s} {r}`,
  handles write the three tensions, and a tap on empty space refuses in a sentence. Do not write a second one.
- **No new widget.** The chips are `sw`, the six shape buttons are plain buttons carrying a **sampled** path
  (a button can never draw a shape the engine would not produce), the step ladder and the picture are one `<svg>`
  in a div, and the status capsule `● RUN 0.42 · 3 OUT` is on the card, not in a hover (ANTI-PATTERNS 4).
- **The dot goes on `s.out`, never on the drawn line.** SMOOTH, INVERT and STEPS then *visibly* pull it off the
  shape — the control explains itself and nothing had to be written down. That one choice is what made the
  window legible.
- **BPM IS NOT TEMPO HERE, IT IS THE LOOP CLOCK, and the card says so.** λWAVES has no tempo and no audience —
  but it has `capture.js`, and a loop that **closes** needs every modulator to be an exact integer division of
  one period, which is exactly what BPM sync + the note ladder + ANCHOR provide. So the musical controls are
  **reframed rather than deleted**, and the ranking that follows is *shape first, loop clock second, performance
  never*. TAP TEMPO is the one that the reframe cannot save, and it is not built.

**AMENDED 2026-09-06, by Josh, and the amendment is the point of wave 61.** *"The macro is essentially the router
that brings it into the app. Otherwise the modulation is useless… Whenever a macro is routed to a knob, there
should be an indicator or miniknob or drag space where the colored arc around the knob changes the arc length."*
So **a macro's ROUTE and its ARC reach out onto the target knob, by design**, and exactly two things cross the
boundary — no more:
- **the ROUTE gesture**, while it is live: a drag from a macro's grip, or a grip armed by a tap, lights every
  registered control as a drop target and dims the rest. It exists only for the duration of the gesture and
  leaves nothing behind (this is Massive's permanently-drawn slots **without** Massive's permanent noise).
- **the ARC**, once a route exists: a two-radius ring in ACCENT B on the knob itself — the selected macro's reach
  on the outside where a finger can grab it, every other route's summed reach inside it — plus its press-and-hold
  popover. A knob with no route wears **no ring at all**; a knob is a knob until something holds it.

The old wording forbade both, and a law that contradicts the build is worse than no law. What has NOT changed:
a dial wearing ACCENT B while a modulator holds it is still the read-only signal it always was, ACCENT B still
means *relationship*, and nothing else modulation-shaped — no source card, no macro fader, no transport — may
appear outside the window. **The arc is anchored to the registry's BASE, never to the current value**, which is
why turning a knob under a running LFO slides the arc with the needle and keeps its width: that is the synth law
made visible, and it is the single best argument for the whole feature.

**The ring's own laws — settled against four references and two measurements, so do not re-decide them:**
- **Every drop fills exactly the room the knob has left, in the direction it has room.** We know `baseNorm` at
  the instant of the drop, so nothing clips on the first frame at any base — where Serum assigns full scale and
  then tells people on its own forum to park the base at 0 or 50 % first. The first act of a new route must
  never be to *reduce* a depth that already means something.
- **Zero depth is a real state and keeps its handle: a 4-px tick at the base.** Dragging to zero is **not**
  removal and must never be — a zero-length arc cannot be grabbed, which is the whole reason the tick exists.
- **Overflow CLAMPS with a spur, and only the NUMBER warns.** The model clamps (it always did), the arc stops at
  the end, and a radial spur runs outward at the overflowing end; the clipped number prints in `--warn`.
  **Never a red arc** — `--bad` is spoken for, and ACCENT B is a colour the user can move, so a hue cannot carry
  this. Geometry says it; text may colour it.
- **The ring uses TWO angle laws, because `kit.js` does**: `−135 + p·270` for an ordinary dial and `p·360` for a
  **wrap** dial (HUE and YAW are the registry's wrap targets). It reads `registry.isWrap(id)` and takes the
  needle's own law — a 270° ring on a wrap target would put the modulation somewhere the needle never goes.
  A wrap target also never wears a spur: it does not clip at all — its arc runs past u = 1 and continues from
  u = 0, and a full turn is drawn as the full circle.
- **The SVG is a child of `.k-dial`, not a sibling.** `elementFromPoint` therefore still answers *the dial*, so
  the 44-px walk (B70) keeps measuring one owner and the proof stays valid. The parent you choose is the
  hit-test you get. The price, stated: the ring owns an 8-px annulus of that finger (11 on a phone), so a press
  between r = 17.5 and r = 25.5 edits DEPTH rather than VALUE — the trade Serum makes with `alt`+drag and we
  make with geometry. Depth is a **vertical drag over the card** on kit.js's own ladder, never along the arc,
  which is 101 px of travel for a 44-px fingertip.

## Density (the clause that protects us from web defaults)
Where a density system already applies, **use it as written rather than a familiar-looking substitute**. Compact
is legal as long as hit areas do not overlap and controls stay visually distinct. The checks:
- ≥ 12 px between adjacent bordered/filled controls; ≥ 24 px around borderless icon-only controls.
- A gap INSIDE a group is at most half the gap BETWEEN groups (space carries hierarchy before a word is read).
- Pick edges and hold them: every unexplained deviation from an established alignment reads as noise.
- Sizing comes from content. Numeric readouts may be fixed-width (with tabular figures so digits do not dance);
  text — notes, labels, captions — never gets a fixed width, it wraps.
- **A 44-px seat does not mean 44-px ink** (wave 51's rule, and the k-dial's trick generalised): paint the 22-px
  puck into the *content box* of a 44-px button — same fill, same rim, same place. Grow the seat, never the mark.
- **THE REAL BODY WIDTH INSIDE A FLOATING CARD IS 226 px, not the 286 everyone assumes** (measured, wave 60).
  286 is the *docked rack's* inner width (`--rack-w` 300 − 2 × `--sp-3`); a floating window is 274
  (`--float-w` is the rack's content box **less its scrollbar**) and the group and the card each take their own
  padding on top. So six 44-px seats in one row need 279 and do **not** fit: they go three to a row at 74 px,
  and four 62-px knobs wrap to 3 + 1 rather than being shrunk into each other's hit areas. Budget against 226
  and the layout never has to be checked again at any width the window can take.
- **A control must be able to reach its own default.** Linear over 0 … 8 s on kit.js's 220-px travel is 36.4 ms
  per pixel against a default attack of **10 ms** — the smallest adjustment the knob could make was nearly four
  times the value it started on. A square law (`get √(v/8)`, `set p²·8`) makes one pixel 0.165 ms at the bottom
  and 72.6 ms at the top. Divide the range by the travel before you ship the range, and measure it with a real
  3-pixel drag rather than reasoning about it.

## Typography
Three subset faces ship, all SIL OFL, all `@font-face` in skin.css: **Roboto** (`--font-ui`), **`LW Title`** (the
title word — `#title .word` and `.nb-title`) and **STIX Two Math** (`--font-math`). The math face is a
**40 KB / 194-codepoint** subset of STIX Two Math v2.0.2. **`lab/fonts/STIXTwoMath-SOURCE.txt` is the
contract**: it holds the subsetting command and the rule that matters — *a glyph outside the list falls back
SILENTLY to a serif and looks almost right, which is worse than wrong* — and since wave 69 **the list is a
FILE, `STIXTwoMath-glyphs.txt`, which IS the subsetter's `--text-file`**, because the prose list had already
drifted from the binary. Adding a symbol means extending that file, re-running the subset, and stating the new
byte cost. Every stack still names real fallbacks after the house face.

**THE MATH FACE IS APPLIED BY ONE MARKER AND NEVER BY A SELECTOR (wave 69).** Josh's rule is **mathematics
only, never chrome** — an English word stays in the UI face — and that cannot be expressed as a selector (a
seg label is chrome in one window and an operator in the next) or as a tokenizer (`Re ψ` is mathematics and
`SLICE / CLIP` is furniture). So it is declared in the string: `<m>…</m>`, one convention for a label, a
window title, a note's innerHTML and a live formula's fixed parts alike.
- `<m>` is an unknown element, so an innerHTML note gets the face from ONE CSS rule and needs no code.
- Every plain-text call site goes through `kit.js`'s `mathText()`, which SPLITS the string and builds nodes —
  **never innerHTML**, so the marker opens no injection road — and `mathPlain()` strips it for `title` and
  `aria-label`. A marker must never reach an attribute; B146 asserts none does.
- **`tests/pwa.test.mjs §G` is the gate**: it reads the face's own cmap out of the WOFF2 and fails on any
  marked character the subset does not carry. Run it when you mark new mathematics.
- **DIGITS.** The subset's ten figures are 495/1000 em — measured, tabular — so a formula keeps its own
  numbers. `--font-num` does **not** move: every value field, knob readout, fader value and the transport
  clock is Roboto with `tabular-nums`, and so is a live formula SLOT (`.fx-v`), because a slot is where the
  digits are and a numeral column does not dance. The two faces on one line are the design: the expression is
  the math face, the substituted values are the number face, and that is also what makes a moving value
  findable by the eye with no motion at all.
- **`formula()` (kit.js) is the one place a number is allowed to move**, and it is allowed because the value
  is TRUE at every intermediate frame rather than tweened. Three sites: the transport's period theorem, the
  LADDER's clocks in n̄, and the SPECTRUM's `c(t) = e^{−iEt}c(0)`. No `aria-live` may ever go near one.

**`LW Title` IS A LICENCE FACT, NOT A LABEL (wave 59), and it is gated.** The wordmark is a five-glyph subset of
gluk's **Spinwerad 0.3**, converted TTF → WOFF2 — which is a **Modified Version** in the SIL OFL's own words
("adding to, deleting, or substituting … or by changing formats"). `spinwerad` is a **Reserved Font Name**,
declared twice independently (the licence text and the original binary's nameID 13); OFL §3 forbids a Modified
Version from using one *as the primary font name presented to the users*, and the TERMINATION clause voids the
whole grant when it does. **Un-subsetting does not fix it** — a format conversion is still a Modified Version.
So the derivative was renamed: nameID 1 / 3 / 4 / 6 rewritten, gluk's nameID 0 / 13 / 14 kept **verbatim**
(§4 expressly permits acknowledging the author, and the acknowledgement should exist), a new nameID 10 saying
what it derives from — and **the same string changed in the binary AND in the stylesheet**, because a CSS
`font-family` is exactly "the name presented to the users" and a rename in one of the two places is not a
rename. Not one outline moved. The rules that follow:
- **`tests/pwa.test.mjs §F` is the gate.** It decodes every shipped WOFF2's own `name` table by hand, gathers
  every Reserved Font Name declared anywhere in the tree (13, across the licence texts and the faces
  themselves), refuses any subset face that uses one in a user-facing name, and asserts that skin.css's three
  `@font-face` families are those same three strings. Renaming the CSS family back to `spinwerad` was tried and
  the gate refused it. Run it when you touch a face, a family name or a licence file.
- **Roboto and STIX keep their names, and the reason is the RFN, not the amount of modification.** Roboto's
  licence declares no Reserved Font Name at all; STIX's RFN is `"TM Math"`, which `STIX Two Math` does not
  contain. `Roboto-SOURCE.txt` and `Spinwerad-SOURCE.txt` say this in the files a future wave would read before
  "fixing" the asymmetry.
- **A licence must SHIP with the thing it licenses.** OFL §2 says each copy must *contain* the licence, so the
  six licence texts are precached (22 217 bytes) — an app that makes zero network requests on its second launch
  was otherwise holding twenty-three font files it could not show one for.

## Defaults that are rulings, not accidents
- **PRISM is the default palette** (board #51, Josh's ruling): a fresh profile boots with `--acc` at prism's own
  0°. λWAVES is one click away. 23 palettes, grouped in the menu by **stop count** from `PRESET_GROUPS`, which is
  the catalogue's own grouping — a palette added to `palette.js` arrives in the right group with no edit in the
  view. A default is for a first visit: naming a palette IS this browser saying which it wants. **Adding is the
  only edit `palette.js` still takes**: a shipped palette travels by name in a link, so moving a stop re-colours
  every link already minted — see *The state is a LINK*.
- **DITHER is a DRAW STYLE option, ORDERED (Bayer 8×8), and OFF by default.** Fixed in screen space, added after
  the output gamma, zero-mean; OFF is bit-reproducible. It is the 8-bit banding fix that works on every browser,
  which is the honest answer to P3 not being available here.
- **The camera has two control modes** — TURNTABLE (level horizon, poles) and FREE (no poles, the horizon rolls)
  — and the trade is one sentence on the card because it is a real trade. Under both runs ONE friction law,
  ω̇ = −μ(ω − ω_amb), with μ = FRICTION (default 2.5, and μ = 0 reads "∞ · forever"). Do not reintroduce a state
  machine beside it. **DRAG GAIN and FLING (wave 58, board #63) COMPOSE with that law and are not second copies of
  it.** DRAG GAIN scales the one sensitivity — `rad/px = GAIN × CAM.SENS`, default ×1.00, which IS the shipped
  camera; NEBULA's own dial is radians per *screen width* and its 3.14 does not travel, so the range and the step
  are theirs and the unit is ours. FLING multiplies the released ω₀ *before* the law sees it: **FLING decides how
  much velocity you get, μ decides how fast it decays**, and FLING = 0 is a pure trackball (the drag still turns
  the view; the release leaves nothing) — which no value of μ can be. A control that duplicated μ's job would be
  the wrong port.
- **CAPTURE lives in the CAMERA window and re-derives nothing** (wave 58): PICTURE ×1…×4 · TAKE A PICTURE,
  SECONDS · FPS · RECORD, **ONE PERIOD gated by `plan.ok`**, a PLAN trigger, and a `wide` readout carrying
  `plan.message` **verbatim**. `capture.js` did all the thinking — which period the observable needs, whether
  the state has one at all, how many laps that is — and the interface's whole job is to show its sentence and
  let its verdict gate the button. The plan is **never computed on a frame** (a bowed BOX state is 56
  incommensurate energies and cost 1.2 s in wave 45): on a press, on a control change, on the pointer entering
  the group. See ANTI-PATTERNS 19 for what happens after that, and 20 for why the sentence is verbatim.
  The picture ceiling is the adapter's own `maxTextureDimension2D` asked for at `requestDevice()` (16384 here,
  via the rack's `canvasCap`) and not WebGPU's default 8192 — the largest picture the build could take used to
  be a line of `field.js` rather than the GPU.
- **CARD STYLE** (REFRACTIVE default / TINTED) is Josh's choice and stays.
- **Rendering defaults:** FROST **OFF**, GLASS BLUR **22px**, PERFORMANCE **120 Hz**, GRID **64³**, and KEEP
  FRAMES **OFF**. These are first-run settings; an existing browser's explicit choices still win.

## The state is a LINK (wave 56)
The whole state rides in the URL **fragment** (`#s=…`, base64url, ~300 characters), never the query; COPY LINK
sits beside SAVE · LOAD · COPY JSON and in the FILE menu. A link is read at boot **after** `applySettings()`,
deliberately — a link is somebody else's picture and the browser's preferences are the reader's furniture — it
clears the undo ring (a link is the bottom of the stack), and it listens on `hashchange`, so the fragment is a
live address. Three laws follow from what the codec IS:
- **A link that opens must not silently drop what it could not carry.** v1 carries neither the MOLECULE panel
  nor the MODULATION rack. `encodeState` returns them in `notCarried`, and the mint puts the count in the status
  line and the names in a `.note` **on the card** — not a hover (ANTI-PATTERNS 4), not the console; a link too
  long to survive a paste says so (`fits: false`), and a `LinkError` gets its own sentence in the interface. But
  `notCarried` is a hand-kept whitelist and not a diff of what `serialize()` emits: **add a presentation key and
  add it there in the same edit**, or it is dropped *and* unreported.
- **`lab/palette.js` IS FROZEN.** An unedited catalogue palette travels by NAME — the reader rebuilds the stops
  from its own build — so moving one stop of a shipped palette re-colours every link ever minted against it, in
  silence, for ever. Add palettes; do not edit one. (Edited stops travel in full, which is the escape hatch, and
  a name this build does not have keeps the link's own stops and says so.)
- **The codec is LOSSY BY DESIGN, so do not promise a digest round trip.** The honest claim — and the measured
  one — is *the same labels, with no coefficient off by more than 7.4e-7 on the first open*, and then **exact
  ever after**: re-minting what a link produced is byte-identical text and reopening it lands on the same digest.
  A contract asking for "the same state digest" on the first trip is asking the wrong question of a
  float-quantising codec. State what is true at the strength it is true.

## The install layer is LIVE (wave 56)
`lab/manifest.webmanifest`, the icons and `lab/sw.js` are registered from `main.js` at a **relative** scope
(`register('./sw.js', { scope: './' })`; an absolute `/sw.js` is exactly how a root-scoped worker sneaks onto a
visitor's machine over the rest of the library, and this lab deploys under a path). The law **as built**, which
is not the law as first prescribed: the worker never takes itself — no `skipWaiting()` on install, no
`clients.claim()`, no timer — and because `skipWaiting()` is scope-wide the promise is kept one layer up:
**the tab that pressed RELOAD reloads exactly once; a tab that did not ask is TOLD and keeps its state**
(`rack.js`'s `swClient.asked`, and ANTI-PATTERNS 15 for why it cannot live in the worker).
**Registration is skipped under `navigator.webdriver`** unless `?sw=1` asks for it (`?sw=0` always refuses): a
worker on the gate's own origin serves every later navigation out of a cache, and one stale `sw.js` §1 entry
would make the whole browser suite silently measure yesterday's build. Run `node tests/pwa.test.mjs` after any
wave that touches `lab/` — that is the gate on the precache, and ANTI-PATTERNS 14 is why. Run
`node tests/wiring.test.mjs` beside it: that one is the gate on **reachability**, and ANTI-PATTERNS 17 is why.
Adding a file to `lab/` without wiring it fails the second while passing the first.

## Theme law
Both themes are DESIGNED, not inverted. Every colour is a token defined in the bare `:root`; a theme block only
redefines tokens. **A colour whose only definition sits inside a theme block is the classic unreadable bug** —
it is how the light-theme ladder came out white-on-white. `lightTheme()` and the `*_LIGHT` tables in kit.js are
the ink path for anything drawn on a canvas.

## Jurisdiction — who owns what in a wave
| Owns | Does NOT own |
|---|---|
| **layout**: spacing, alignment, rack geometry, overflow, content-derived sizing, spatial stability | glass hue, easing, physics |
| **material**: glass, relief, ink rungs, accent semantics, theme parity | where things sit, timing |
| **motion**: durations, easing, interruption, reduced motion (see MOTION-LAW.md) | geometry, colour |
| **physics/maths**: the laws, the numbers, the notes | any of the above |
A reviewer or builder working in one column must not casually restyle another's. Say what you touched.

## THE PORTED-WINDOW EXCEPTION — read this before you "adapt" anything (2026-09-06, Josh)
Everything above tells you to build in the house idiom. **There is one exception and it is deliberate: a window
that is a PORTED ARTIFACT keeps its own identity, verbatim.** The MODULATION window is one. Josh: "It's supposed
to be portable and a layout and use that works for every app… I don't even care if it has to be rebuilt from
scratch if it could have the material/dimensions/or whatever that this window/plugin has to have."

**The failure this exists to stop, stated plainly so you recognise yourself in it.** Asked to port that window,
three separate AI passes each re-implemented its FUNCTIONS in the host's idiom and discarded its layout, material
and dimensions — believing, reasonably, that adapting a foreign component to the local design system is good
engineering. It is good engineering for a component. It is the destruction of the artifact for a PLUGIN. Josh
spent three to four weeks iterating that window's shapes, chips, booleans and dimensions; every re-implementation
throws that work away and hands back something that merely does the same job.

**The words that mean what they say.** "Port", "adapt", "bring over" and "in our style" all license conversion —
do not use them and do not act on them. The instruction for an artifact is: **copy the DOM structure and the CSS
verbatim into a namespaced subtree; do not re-implement; do not substitute house widgets.** A rebuild is allowed
ONLY if it reproduces the same geometry and material — same widths, gutters, radii, chip sizes, type scale.

**The acceptance test, because a prose instruction cannot hold this line.** An artifact port is proved by
GEOMETRY, not by resemblance: the measured widths, heights, gaps and radii of the built window equal the source's,
asserted in a gate, plus a screenshot beside the source. A re-implementation cannot pass that, which is the point.

**What may be parameterised**: the two accent colours, and anything naming another app. That list is short by
design. Everything else — the glass, the spacing, the chrome, the chip vocabulary, the fold and rail behaviour —
travels unchanged. `docs/ui/REFERENCES.md`'s "steal the mechanism, not the look" governs a REFERENCE (something we
looked at). It does NOT govern an ARTIFACT (something we are moving). Know which one you are holding.

**THREE MEASURED DEFECTS THE PORT INHERITS, and it must prove they do not survive it (wave 63).** The third
adversarial review found seven defects in waves 60–61. Wave 63 built four of them; the other three live in markup
this port replaces wholesale, so building them would have been work thrown away — but they are not thereby fixed,
and a port that reproduces the window's geometry can very easily reproduce these with it. Each has a measurement:

1. **The ENV drag destroys two stages, and this rack is outside the undo ring.** `idx` is latched at
   `pointerdown` while `envMove` re-reads `envMapOf(s)` on every move; the map has six points when `hold > 0` and
   five when it is 0, so the instant a drag takes `hold` to zero, index 2 stops meaning `hold` and starts meaning
   `d`. Measured on the real model: **`d` 0.8 s → 0 and the sustain 0.5 → 1**, neither touched by the user, with
   no road back. Latch the MAP (or the KEY) at `pointerdown`, not just the index.
2. **The grip's advertised double-tap reset fires ZERO times** — its own `title` says "Double-tap resets the
   macro" and the `pointerdown`'s arm/disarm branch returns before `startArm`, so only every other tap reaches the
   tap watcher and the gesture that fires it is a **triple** tap inside 320 ms.
3. **FIT does not frame a GATE envelope, and the caption goes stale.** `envDuration` drops `r` under GATE while
   `envPoints` draws it, so FIT frames **0.3565 s of a picture that runs to 0.910 s** — 155 % past the right edge
   — while the caption says "FIT frames it"; and `gateMode` is not in the env signature, so after a GATE toggle
   the printed duration is **2.94× stale** for ever. (Beside them: a stage clamped to `t = 1` loses **6 s of
   release to a 2-px twitch**, because `envMove`'s inverse cannot write a stage longer than the window.)

Full report: `REVIEW-3-2026-09-06.md` §1.1, §2.1, §1.2–§1.4. **The port's acceptance gate should drive each of
these three gestures and fail on them**, exactly as wave 63's B70, B119 and B128 do for the four it built.

## Native window rework — 2026-09-08, explicit user supersession

Josh requested a full redesign of Spectrum, State, Palette, Wave, Camera, Slice,
Settings and native transport, with judgment delegated on older layout laws.
For these native windows, the older SPACE/DRAW nesting is superseded by flat rows;
section boundaries use spacing instead of nested bordered cards. Positions retain
their general ordering. Settings uses LOOK / DISPLAY / QUALITY pages in a fixed
viewport. Keyboard editing belongs only to the dedicated `?` keyboard window.

Explanatory native text and live Spectrum mathematics use accessible hover/focus/tap
popovers in the browser top layer. Their changing content cannot change a window's
geometry. The existing graph tooltip remains the graph mechanism. Readout lanes
retain fixed dimensions during playback; intentional expansions and folds remain
layout actions. The mode chooser remains open by default with a bounded scroll area;
coefficient dials remain hidden by default. Hamiltonian owns its controls below it.

The modulation design stays excluded. The old ban on exposing its tempo controls
outside the plugin is superseded specifically for the expandable native tempo bar:
both surfaces operate the same BPM, sync, cadence and hold model. No second clock,
source cards, routing layout or modulation skin is introduced. Disconnected selected
native headers tint with Accent A; the rack-switch header button is removed.

A sphere/plane control now supplies an arbitrary 3D slice normal (drag, arrow keys,
Home). The KS slice retains its 4D image gestures; the 3D miniature stands down there.
Bow adds pull gain, response exponent and a momentum limit, retaining the existing
boost/projection physics. Shader shape and finish are separate; surface-only finishes
stand down for shapes without surface lighting. Glass is a stylized translucent finish,
not a claim of physically refractive optics. New presentation parameters are saved in
projects, undo and an optional backward-compatible share-link section.

### Native control relief and natural window sizing — follow-up

User ruling supersedes the flat-control treatment and fixed Settings viewport above.
Exclusive choices use a recessed track and raised selected segment; action buttons
retain the sculpted kit surface. Persistent on/off states use an accent lamp and edge
glow in both themes. Modulation remains excluded from the native redesign.

Native window contents expand without internal scroll areas, except History. Show
all 91 Spectrum mode labels. Settings LOOK owns Reset Layout, Forget and Warning;
DISPLAY exposes a stubborn P3 switch instead of the redundant actual-gamut readout.
Changing live values must still leave geometry stable. Explicit tab changes and DIALS
expansion may resize contents. Horizontal knob-row sizing must never apply inside
Spectrum's vertical phase/rate stacks; each lane owns its grid and touch dimensions.

### Follow-up: accent arcs, basins and compact tools

WINDOW INFO is the fourth DISPLAY status switch, beside STAGE CAPTIONS; it starts
off. Accent defaults are A=300°, B=30°, Vivid=10%, without replacing saved choices.
Accent selectors and modulation dials show colored value arcs. ENV uses Accent A,
including its heading. Native readouts retain the shared inset basin material.
Macro relocation and matrix launchers are parked; see ARCHIVED-MACRO-TOOLS.md.
The ENV header TRIG is removed. Tempo editing retains the display seat's dimensions.
Logo menus use a glass surface in the browser top layer above floating windows.

### First-visit rack arrangement and compact macros

First-visit left rack: SHADOW, SPECTRUM. Right rack: SETTINGS (folded), STATE
(folded), PALETTE, WAVE, CAMERA, SLICE/CLIP. Other windows, including modulation,
start closed. DISPLAY precedes LOOK and is Settings' initially selected tab.
SHADOW's disclosure starts closed and groups its Hamiltonian readout and exact-real
caption. UI accents sample the λWAVES preset while PALETTE is off; when enabled,
they follow the active palette. Saved accent angles remain independent of this rule.

Macro minimization narrows the rail to 144px and removes only the live value face.
The routing grip, master-depth dial and reorder/delete tool retain their row positions
and height. `+ MACRO` and `+ DEVICE` remain at the rail foot. The separately archived
macro relocation and matrix launchers stay off.

### Default refinements and transport placement

New settings use 22px glass blur, Accent A=30°, Accent B=300° (Vivid stays 10%).
Saved settings retain their values. SHADOW uses PHASORS / OSC / LISSA, followed by
a separate 32px disclosure. Docking reopens the transport at the left rack's top
unless a project/layout or prior undock supplied a remembered side and slot.
Loading a layout must place the transport in array order like every other card.
Macro folding refreshes the displayed depth immediately and restores its expanded
accessibility state; repeated close/reopen must preserve values and width.
