# λWAVES MOTION LAW
*Load this ONLY for a polish/motion pass. A structure or behaviour wave does not need it and should not spend the
context. Method adapted from Emil Kowalski's `animate` skill (mechanism, not aesthetics); the tiers are ours.*

## Gate 1 — frequency decides whether a thing may animate at all
| How often the user does it | Our interactions | Rule |
|---|---|---|
| 100+ / day | knob drag, scrub, camera orbit, bow pull, window drag (docked or floating) | **no animation** |
| tens / day | window fold, COMPACT ↔ full, tab-to-next-window, palette change | near-imperceptible only |
| occasional | window open/close, pop out / dock back, preset load, rack reorder, theme switch | standard animation |
| rare / first time | boot, the photosensitivity pane, first preset of a session | **delight budget** |

**A keyboard-initiated action is never animated.** Space, H, B, T, N, TAB, C, V, P, ?, Ctrl+R, Ctrl+Z — the key is
the user asking for the result, not the journey. (TAB raises a window to the top of its rack or the front of the
stack; it does not travel there.)

## Gate 2 — name the purpose or do not build it
Feedback · spatial continuity (where did this come from) · state legibility · bridging an otherwise jarring
change · explanation (first run only) · delight (rare tier only). **Cannot name it? Stop.**

## Gate 3 — SIGNAL MOTION IS SACRED (our own, and the reason to be stingy)
The field, the bow, the particles, the transport, a modulation LFO's movement are **data in motion**. Decorative
motion must never be mistakable for signal: no drifting, pulsing or breathing chrome, and nothing decorative in
the accent colours that mean signal (A) or routing (B). When in doubt the instrument stays still and the physics moves.

**The modulation window's picture and the knob rings are SIGNAL, and signal has a repaint law (waves 60–61).**
`mod.js` is a module singleton and that window already paints the whole target list at **30 Hz** (a `33 ms`
guard, not a rAF — 30 Hz is plenty for a number to be read at). So:
- **Rebuild only on a SIGNATURE** — `width | shape hash | steps | which cycles`. The per-frame paint then moves
  **exactly four attributes**: the playhead's `x1`/`x2` and the dot's `cx`/`cy`. A card with no width (closed,
  folded, not yet laid out) renders nothing and says so by clearing its signature; the first paint is triggered
  by a **ResizeObserver**, because the rack has no frame loop while nothing is running.
- **The rings never touch the field's frame loop.** They ride the same 30 Hz paint and the registry's own
  events, **with `'modulated'` filtered to nothing** — that is the reason that fires sixty times a second, and
  the arc is anchored to the BASE, which `'modulated'` does not move. Every *other* reason does move it and gets
  through. An indicator that redraws on the signal it is not a function of is a frame-rate bug wearing a feature.
- The dot's divergence from the drawn line under SMOOTH, INVERT and STEPS is **signal, not jitter** — see
  STYLE-LOCK's modulation section. Never smooth it toward the curve to make the motion look tidier.

## The logo: nothing rotates, the PALETTE turns (wave 53)
The mark's 360° spin is **gone**, and so are the busy spin and its hue cycle — `lw-mark-spin`, `lw-busy-spin` and
`lw-busy-hue` are in no stylesheet. The only transform left is the resting 45° inside the SVG, which reads
identically at rest, mid-turn and busy. What moves is the live palette walked *through* the nine squares: rack.js
generates nine `@keyframes` from the same `wheelColor()` the static fills come from and injects them as
`<style id="lwTurn">`, so the animation **is** the palette and cannot drift from it. `--logo-turn: 1.2s`, `linear`,
one iteration for BOOT (rare tier, the delight budget) and infinite for BUSY, plus `lw-busy-breathe` — 1.1 s,
linear, alternate, **opacity only**. It is CSS and not JS, and it is rebuilt only when a turn STARTS: a HUE drag
would otherwise rewrite eight kilobytes of stylesheet sixty times a second and restart the animation with it.
The price, accepted: a palette changed mid-turn keeps the old keyframes until the turn restarts.

## Numbers
- Press / toggle: **100–160 ms** (`--t-fast .12s` is exactly this rung).
- Value tooltip, small popover: 125–200 ms in; the linger-out is ours (`--t-linger .7s`) and is a hold, not a motion.
- List, menu, segment: 150–250 ms.
- Window / drawer / pane: 200–500 ms — the only class allowed past the ceiling. `--t-soft .35s` belongs here.
- **Ceiling for ordinary UI: 300 ms.** Anything longer must be a window-class transition and say so. The ceiling
  is about *transitions*: a constant-motion indicator (the busy mark) and a rare-tier delight (the boot turn) are
  not transitions and are not measured against it — but they are the only two exceptions in the lab.
- Easing: entrance & exit `cubic-bezier(.23, 1, .32, 1)` · on-screen movement `cubic-bezier(.77, 0, .175, 1)` ·
  hover and colour `ease` · constant motion `linear`. **Never `ease-in` on UI** — it delays the frame the user's
  attention is already on.

## Interruption
- Anything retriggerable faster than about twice a second (the busy mark, FROST, toggles, the tooltip) uses
  **transitions, not keyframes**, so a new trigger retargets from the current state instead of snapping to a start.
  A one-shot slower than the eye (the boot turn) may legally restart, and does.
- A gesture with momentum carries its velocity **through** the interruption: the camera fling (wave 50) must
  retarget when a new drag begins, never restart from rest. Same for any future flick or throw. The friction law
  ω̇ = −μ(ω − ω_amb) is integrated in **closed form** every frame, not stepped as ω·dt, so an interruption lands on
  the exact pose and not on an accumulated error. **FLING (wave 58) scales the released ω₀ *before* the law sees
  it and changes none of this** — how much velocity you get, against μ's how fast it decays. FLING = 0 is a pure
  trackball, which no value of μ can be. Do not add a second decay anywhere.
- **Bridging is the one place a state change may take time.** Coming out of FREE back to TURNTABLE slerps the roll
  level over **150 ms** rather than snapping (wave 54); the mode is still FREE at 50 ms and level at 350.
- Exit by the path of entrance. Slow on the user's deliberate phase, snappy on the system's answer.

## Accessibility
- `@media (prefers-reduced-motion: reduce)`: keep opacity and colour changes, drop transform-based motion.
  Reduced motion means **fewer and gentler, never zero** — and we ship the animation every time, gated. The
  palette turn and the busy breath are colour and opacity and they STAY (WCAG 2.3.1 asks about 3 Hz over a
  large area; a 0.9 Hz breathe on a 22-px mark is neither).
- **AND IT REACHES THE CONTENT, NOT ONLY THE CHROME** (wave 57). A preference that quiets the interface while
  the field goes on strobing is not compliance, it is the look of it. For a time-evolution instrument reduced
  motion is **not frozen** — a frozen field is a broken λWAVES, not a reduced one — and the dangerous quantity
  is the *rate of luminance change*, which the clock already owns. So, two rules and no third: **nothing moves
  unasked** (`?play=1`, the one thing that starts the transport without a press, is refused; the PLAY button is
  untouched), and **a rate NOBODY CHOSE is divided by four** — a preset's, a project's, a link's — while **a
  rate the RATE knob was dragged to is not touched at all**, because a default is for a first visit and the hand
  always wins. `?motion=reduce` / `?motion=full` name the input the way `?warn=` does, so a gate can ask without
  a browser profile — **but since wave 59 BOTH arms are behind `navigator.webdriver`**, because `?motion=full`
  in a shared link overrode the visitor's *operating-system* preference, which is the strongest thing a person
  can say about movement. A link is somebody else's picture and does not get to answer that for the reader; and
  `?motion=reduce` is gated with it for the same reason `?warn=1` is — **a rule with one arm reachable from a
  public URL is not one rule**. Same for both `?warn` arms.
- **The chrome half WAS not finished, and wave 69 finished it before it added its one animation** — which is
  what the paragraph that stood here asked the next wave to do. What was wrong: the preference covered 9 of
  the lab's 34 `transition:` sites, and the rack's 310-px slide lost on **specificity** —
  `body.rack-hidden #rack` is (1,1,1) against the media block's `#rack` at (1,0,0), so a `transition: none`
  that looked right reached nothing for four waves. The media block now repeats the FULL selector, and names
  the fold chevrons (`.dev-fold > svg`, `.mod-fold > svg`), `.dev.dragging`'s transform, `.trig:active`'s
  1-px press, the value tooltips' transform, the window entrance's keyframe, and the ported plugin's own
  `--m2-motion-*` tokens, which is one line that reaches every transition in its 132 KB sheet without
  touching it. **The opacity fades all STAY** — the two rack chips, the rack's own fade, `.note` — because
  reduced motion is *fewer and gentler, never zero* and an opacity change is exactly what the preference asks
  to keep. **What a later wave must not forget**: the preference cannot be driven from our harness, so the
  proof (B149) lifts the block out of its `@media` wrapper and injects it as written, which measures the
  SELECTORS against the elements that carry the transforms. That is the only shape of test that could have
  caught the specificity bug, and it is the shape to copy. **Add a transform to the lab and name it here in
  the same edit** — the list grew by one in wave 60 without anyone noticing, which is how it grew before.
- **The lab's ONE entrance (wave 69).** `layout.reopen()` only: 220 ms, `cubic-bezier(.23, 1, .32, 1)`,
  opacity + a 7-px slide, one iteration, `lw-dev-enter` (and `lw-dev-enter-quiet`, opacity alone, under the
  preference). **`raise()` deliberately does not fire it**, because TAB reaches `raise()` and a
  keyboard-initiated action is never animated. A fold animation, a rack-reorder FLIP and a preset-load bridge
  were each considered and refused: the fold is the tens/day tier and its chevron already is the animation,
  the reorder happens *during* a 100+/day drag, and a preset's jarring change is in the FIELD, which is
  signal — bridging signal with a fade lies about the state.
- `@media (hover: hover) and (pointer: fine)` gates every hover affordance, so a touch device never fires a false
  hover. **Any information reachable only by hover must also be reachable by press on touch.** `graphHover` was
  the standing violation and is now the worked example: a touch pointer pins the tip on `pointerdown` and a second
  tap of the same object dismisses it, because a touch pointer never "leaves" — the engine destroys it on lift and
  fires `pointerleave` about a millisecond later, which tore the pin straight back down. Prove it with a real
  touch pointer (B71 does), never through the test hook, which cannot see that failure at all.
