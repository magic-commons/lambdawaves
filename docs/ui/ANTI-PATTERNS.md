# λWAVES ANTI-PATTERNS — real failures from this build, each with its fix
*Cheap insurance: read this before a UI wave and you will not spend a gate discovering these again.*

**1. A colour defined only inside a theme block.** NO: putting a colour's only definition in the dark block, or
in `@media (prefers-color-scheme)`. YES: every colour is a token on the bare `:root`, and a theme block only
redefines tokens. WHY: the LIGHT ladder came out white-on-white in the wave-47 walk — the token simply did not
exist in that theme. Canvas drawing takes ink from `themeInk()` / `nRGB()`, never a literal.

**2. `background: <gradient>, <color>` in one shorthand.** NO: `background: var(--glass-sheen), hsl(...)` — the
sheen is a gradient variable and the pair is invalid at computed-value time; every card went transparent on LIGHT
only, silently. YES: `linear-gradient(var(--glass-sheen), var(--glass-sheen)), hsl(...)`, or set the layers
explicitly. WHY: it shipped as a bug and became a feature (CARD STYLE) only because Josh liked what he saw.

**3. A browser block that measures a window an earlier block closed.** NO: assuming the app is in the state your
block wants. YES: every block wakes and opens what it measures first. WHY: a closed window is a 0-px canvas and
B61 failed for a reason that had nothing to do with what it tested.

**4. Information reachable only by hover.** NO: a graph whose values exist only in a hover tooltip. YES: the same
information on press for touch, and the hover affordance gated behind `(hover: hover) and (pointer: fine)`.
WHY: the iPad is a first-class target and `graphHover` was unreachable there for several waves. It is FIXED —
kit.js pins the tip on `pointerdown` for a touch pointer and dismisses it on a second tap of the same object,
and B71 drives it with a real WebDriver finger. Two traps the fix had to survive, both still true: a touch
pointer never "leaves" (the engine destroys it on lift and fires `pointerout`/`pointerleave` about a millisecond
later, which tore the pin down again), and a hover mechanism driven only through a test hook is not proved.
**THE CONSTRUCTIVE HALF (waves 60–61): with no hover, VALIDITY IS A STATE OF THE SURFACE.** A drop target cannot
be reported at the pointer, so while the route gesture is live all nine registered controls **light** and
everything else recedes to .45 — and the one under the finger is driven by `elementFromPoint` on every move,
never by `pointerenter`/`pointerleave`. Same rule for status: a source card's `● RUN 0.42 · 3 OUT` capsule sits
**on the card**, not in a tooltip.

**5. Scheduling a frame from inside a chunked job.** NO: calling `api.repaint()` in the loop that is spreading
work across frames. YES: a private rAF pump that arms once. WHY: sliceview did this and cost us B8/B14 in wave 48.

**6. A hand-written version, count or date in the UI.** NO: "waves 5–30" typed into ABOUT. YES: one constant
(`BUILD_LINE`) that the wave updates. WHY: it was stale for eighteen waves before anyone noticed.

**7. A control that changes nothing.** NO: porting a knob because the reference had one (NEBULA's seed). YES:
port only what our renderer or model actually consumes, and drop the rest with a sentence in the REPORT.

**8. A wall of text as the first thing an eye meets.** Our notes carry real physics and they stay — but the first
sentence must be the claim, with the derivation after it. A note is not a paper's abstract; it is a caption that
happens to be true.

**9. Animating a keyboard action, or animating what happens 100 times a day.** See MOTION-LAW.md gate 1.

**10. Regex backslashes.** Doubled inside a `g.ev` template, single in a judge line. Cost us B53 and again in a
later block. `node --input-type=module --check` catches what plain `--check` misses.

**11. Redesigning while fixing.** A wave that was asked to correct alignment must not also restyle the glass.
Three modes, and a wave declares which it is in: STRUCTURE (no aesthetic invention) · BEHAVIOUR (no architectural
restructuring) · POLISH (no new features).

**12. A `<select>` whose only handler is `change`.** NO: doing the work in `change` alone when the work is a
*reload* and not an assignment — **re-picking the option already selected fires nothing**, so the menu looks like
a dead control and the state it would have restored is unreachable. YES: a RELOAD trigger beside the select that
calls the same loader unconditionally (or a `click` handler that re-applies the current id). WHY: Josh threw the
bow until the impulses had accumulated real momentum and found there was no way back but a page refresh — the
creep is correct physics, the absence of a way back was the bug. B95 demonstrates it with a *counting* listener
rather than asserting it. **Six `<select>`s exist in the lab and the audit is the point of this entry**: two of
them reloaded — the PRESET list, and `lab/paletteview.js`, where after ROTATE / REVERSE / ADD / REMOVE you could
not re-pick the palette you were on to get it back. Both now carry a RELOAD trigger beside them. The other four
(modulation's macro, target, wave, drive) are pure assignments where the value *is* the state, and re-picking
there means nothing — which is the test: **is this handler an assignment or a reload?** Only a reload needs the
second road. When you add a `<select>`, answer that question in the REPORT. Wave 60 answered it for the wave
menu and the answer generalises: the one case that *looked* like it needed a reload road — re-picking the wave
you are already on in order to come back from CURVE mode — got a **visible WAVE / CURVE segment** instead,
because the way back should be a control you can see, not a hidden re-pick that fires nothing. Without it, S&H
and DRIFT would have been stranded, since no preset can draw a per-cycle stochastic wave.

**13. A test that certifies a bug.** NO: a green line whose wording describes a behaviour the fixture never
entered. YES: assert from the outside in VALUE space, and cover every ORDERING of the actors, not one. WHY:
`mir.test.mjs` blessed `registry.resync()` as "re-reads the instrument" while its fixture called `restoreAll()`
one line earlier, so the *modulated* branch was never run — and on that branch resync read the modulator's own
output back into the base, destroying the user's number silently, with no event, in two of the six
drag/modulate/resync orderings. The base is the only copy of that number in the program. **And the second half of
the smell: `rack.js` had already routed around it** with a local `modSyncBases()` — "resync() minus that" — rather
than fixing the module, on the stated grounds that "`registry.js` is MIR's file and 53 gates pin its behaviour".
Both halves of that were wrong: `PORT-NOTES.md` lists `registry.js` as **ours** (only `mod.js`, `curve.js` and
`glyph.js` are vendored), and a gate that pins a defect is the defect, not a reason to keep it. A local workaround
for a module defect is a smell: **fix the module.** It has since been fixed in `lab/mir/registry.js`
(the law is stated in its own comment: *the base of a modulated parameter is never read out of its Card*), and
`mir.test.mjs §18` now proves all six orderings, both halves of resync's job, and the quiet.

**14. A cache whose name is derived from a hand-maintained list.** NO: a content-addressed cache name computed
from a table somebody has to remember to regenerate. If an entry goes stale the name does **not** change when the
file does, the service worker keeps serving the old bytes, and a returning visitor never re-checks — the browser
is doing exactly what it was told. YES: if the name is derived, the list must be *generated and gated*, so the
build fails rather than drifts. WHY: `lab/sw.js` names its cache `digest(url@hash …)` over its own §1 precache
table — which is right, and strictly better than a hand-edited `const VERSION` (ANTI-PATTERN 6) — and the whole
guarantee rests on §1 being current. The guard is `node tests/pwa.test.mjs`, which walks `lab/` itself, re-hashes
every file and FAILS on a missing, stale or wrong entry; `--write` rewrites §1 and then proves it. **Run it after
any wave that touched `lab/`.** Without that gate this is the worst failure mode a cache has: silent, permanent,
and invisible to the person who caused it.

**15. A law the code breaks itself.** NO: a header that states an absolute guarantee and a mechanism further down
that cannot honour it. YES: state the guarantee at the strength the mechanism actually provides, and put the
missing half where it can be kept. WHY: `lab/sw.js` opens with *"A NEW BUILD IS NEVER SWAPPED IN UNDER A RUNNING
SESSION"* — and its §6 message handler calls `self.skipWaiting()`. The worker-side mitigations are real and worth
keeping (it is the only `skipWaiting()` in the file, unreachable outside the message handler, on no timer, and
`pwa.test.mjs` asserts both facts on the CODE), but none of them touch the actual hole: **`skipWaiting()` is
scope-wide.** The spec's Activate algorithm re-points every client the worker controls and fires
`controllerchange` in all of them — so the one tab whose user pressed RELOAD consents on behalf of every other
tab, including the one holding an unsaved superposition. **A per-tab promise cannot be kept by a scope-wide call,
so it has to be kept somewhere else**: the fix is that each document decides for itself what a `controllerchange`
MEANS (`rack.js`'s `swClient.asked`) — the tab that pressed reloads once, a tab that did not ask is *told* and
keeps running until its own press. A page cannot prevent the swap; it can refuse to throw work away unasked, and
say what happened instead of reloading in silence. The general shape: when a law cannot hold at the layer that
states it, do not soften the law and do not let the sentence stand — move the enforcement up to the layer that
can hold it, and say in both files which layer that is.

**16. A claim proved by a lucky sample.** NO: "N mutations, all refused" as a robustness headline. A round number
of *successes* with no sample size, no coverage fraction and no failure count is not a measurement — it is a draw.
YES: state the sample size, what fraction of the space it covers, and the failure count; and where the space is
small enough, sweep it exhaustively instead. WHY: `statelink.test.mjs`'s corruption section prints "over 680
mutations … 680 were refused with a LinkError", and 680 sounds exhaustive. It is not: 286 of those are the
truncations (which *are* exhaustive) and the other ~394 are randomly drawn single-character substitutions out of
the 18 081 that exist on that 287-character link — **about 2 %**. Swept in full, the same fixture does have
mutations the decoder accepts (measured here on the fixture as it stands: 18 078 refused, 3 decoded
bit-identically, 0 silently wrong — the exact counts move with the fixture, the shape does not), so "all refused"
describes the draw and not the codec. The claim that actually matters — *a damaged link never
silently hands back a different state* — survives the full sweep, which is precisely why it should be made on the
full sweep. Note also which of the three outcomes you are counting: refused, no-op, and silently-wrong are three
different things, and only the third is a defect.

**17. A subsystem that passes its own suite and that nothing calls.** NO: landing a module whose only caller is
its test. YES: wire it in the same wave, or say in the REPORT that it is inert and name what will call it. WHY:
the install layer, the URL state codec and the vendored chips were each built and **green a whole wave before
anything referenced them** — `tests/pwa.test.mjs` and `tests/statelink.test.mjs` passed while nothing in `lab/`
called `navigator.serviceWorker.register`, nothing linked the manifest, and nothing minted or read a link. A
service worker nobody registers is worth exactly nothing, and **the failure mode is silence in both directions**:
nothing breaks, nothing works, and the gate is green. It kept happening — three modules in one week, which is the
list `tests/wiring.test.mjs` now opens with: `sw.js` (built 55, registered 56), `capture.js` (built 57, wired 58,
and **three of the four defects that wave met were in code no browser had ever executed**), and
`lab/render-exact.js`, **inert as this is written**: 92 KB, 39 green gates, zero importers, precached and
downloaded by every visitor. The corollary, learned the same night: **when the code you are handed
and the comment prescribing how to wire it disagree, the code is the fact.** `pwa.test.mjs`'s own closing
prescription would have shipped an orphaned message channel, a lost update and a lost registration, all three
invisible.
**AND A DOCUMENTED PATTERN IS NOT A GATE — this one now has one.** `node tests/wiring.test.mjs` resolves the
import graph the browser actually walks (a real lexer, not a grep: a specifier inside a comment, a string or a
regex is not an edge — which matters, because all three orphans were *mentioned* somewhere the whole time they
were dead) and fails on any `lab/**/*.js` no root reaches. The roots are `index.html`'s script tags plus
whatever the graph discovers — `sw.js` through `register()`, `mathworker.js` through `new Worker(new URL(…))` —
never a hardcoded list, so deleting the `register()` call turns `sw.js` back into an orphan and the gate goes
red, which is what should have happened in wave 55. **A module staged for a later wave may name itself in the
allowlist, and the entry is deliberately awkward**: an 80-character reason that must NAME THE CALLER, an ISO
date printed with its age on every run, a hard failure if the file is *not* actually an orphan (a stale
allowlist is how the mechanism would quietly stop being one), and an expiry — loud at 14 days, red at 60.

**18. A protection that runs AFTER the thing it protects against.** NO: checking that a guard is present. YES:
read the ORDER, in the file, on the boot path. WHY: `?play=1` started the transport **seventy-five lines above**
the photosensitivity pane, so a shared link animated the field while the warning was being read — the pane was
present, correct and completely defeated, and wave 56's shareable links made that likelier rather than rarer.
The transport is now armed at the **foot** of boot behind `warning.onAccept(fn)`, which fires immediately when
the pane is not up so a browser that accepted before loses nothing. Anything that moves, plays or flashes at
boot goes through that callback, never beside it. Wave 59 found the same shape twice more on the same boot path:
the hint bar's nine seconds were counted **under** the notice, so a stranger who actually read a 26-word warning
about epilepsy watched the only legend in the app fade one second after pressing CONTINUE; and `showBanner()`
runs three thousand lines *before* `applySettings()`, so the one message a broken browser gets appeared
white-on-maroon and went near-black (1.19 : 1, measured in the page) a second later. **If it happens before the
user has agreed to anything, ask what state the app is actually in at that line.**

**19. A control that makes a claim and cannot tell when the claim went stale.** NO: computing a verdict once and
leaving the button that depends on it enabled. YES: **a stale plan is not an ok plan** — key the verdict on
whatever it was derived from, re-check that key on every read, and take the control DOWN when it no longer
matches, saying so. WHY: `planLoop()` answers *"EXACT LOOP, 180 frames, 3 laps"*, and a button saying EXACT LOOP
over a half-turn seam is worse than no button. The plan cannot be recomputed on a frame (a bowed BOX state is 56
incommensurate energies, 1.2 s in wave 45), so it is computed on a press, on a control change and on the pointer
entering the group — and between those, `capKey !== capKeyNow()` makes the readout say **STALE · THE STATE OR
THE VIEW HAS MOVED — press PLAN** and disables ONE PERIOD. That is what `plan.ok` gating a button has to mean.
The general shape: an expensive answer is allowed to be cached, but a cached answer is only allowed to be *shown*
alongside the thing it was an answer to.

**20. The interface re-deriving a law the module already owns.** NO: printing `v · TAU_MAX · 1000` because you
read the model and reimplemented it. YES: call the model's own accessor, or show its own sentence verbatim. WHY:
the modulation card printed the SMOOTH time from a linear formula while `mod.js`'s law is `tau = 0.5v²` — knob
0.25 said **125 ms** where the truth is **31.25 ms**, wrong by up to 4× and correct only at the two ends, which
is precisely the error nobody spot-checks. It calls `M.smoothTau()` now. The counter-example in the same tree is
the shape to copy: the capture readout carries `plan.message` **verbatim** and re-derives nothing, so it cannot
drift from the module that computed it. Two expressions for one quantity is a defect waiting for a switch to be
thrown — wave 58's other one differed only under STURMIAN, which is exactly where nobody looked, and the fix was
one shared function (`periodEnergies()`) rather than two corrections.

**21. A TEST THAT NAMES A HAZARD AND THEN EXERCISES THE CONFIGURATION WE DO NOT SHIP.** NO: writing the case,
understanding the risk precisely, and then proving it somewhere it cannot bite. YES: the test runs against the
configuration that ships, or it says out loud which one it does not cover. WHY — this has now happened three
times in one week, each time written by someone who understood the danger better than the person who later found
it:
- `pwa.test.mjs:553` names the service-worker scope hazard as a test case and hard-codes `host.invalid/lab/sw.js`.
  Production serves from the ORIGIN ROOT, where `SCOPE === '/'` makes the guard a no-op and every URL on the
  hostname returns the app from cache. The test could only ever prove the mount we abandoned.
- **B70**, the 44-px touch-target walk, tests DOM ownership and opens with `mod.reset()`. So it walks with every
  route cleared — and the macro ring, which shrinks a routed dial's turn target from 50 px to 35, does not exist
  while it walks. The fix was to walk each dial TWICE, bare and routed, and assert the RELATIVE law (*a dial that
  had 44 keeps 44*), which immediately caught a second dial that was 34 × 42 before any ring existed.
- **`mir.test.mjs`** blessed `resync()`'s general claim while its fixture called `restoreAll()` one line before
  the call, so `r.modulated` was false and the defective branch was never entered. The app had already routed
  around the bug by hand; the suite said GREEN.
THE TELL: a test whose setup makes the hazard impossible. When you write the case, ask what state the hazard needs
and whether your fixture has just removed it.

**22. "Add the class and it will take the other background."** NO: fixing a transparent element whose own
rule is `background: var(--some-token)` by adding a lower-specificity class that also sets a background.
YES: give the `var()` a **reachable value** — a fallback, or the token declared where the element actually
lands. WHY: `MANIFEST.md` prescribed exactly that one-word fix for two of the ported window's defects
(`.m2pick`, `.m2clr`), and it would have changed nothing, silently. **A declaration that is INVALID AT
COMPUTED-VALUE TIME still wins the cascade first, and only then computes to `unset`** — so
`.mir-modwindow .m2pick { background: var(--m2-plate) }` at (0,2,0) beats `.glass` at (0,1,0), the
substitution fails because `--m2-plate` is declared on a sibling subtree, and the element paints
transparent with the new class sitting there doing nothing. It works for `.m2ppick` only because that
sheet declares no background of its own, which is the detail the prescription generalised away from. The
tell: **an element that is transparent when a rule clearly gives it a colour is a broken `var()`, not a
losing cascade** — read the token's declaring selector before you reach for specificity.

**23. A surface that answers nothing, re-tuned instead of re-wired.** NO: adjusting a colour because a
panel "looks wrong beside the others". YES: ask what the other surfaces RESPOND to and whether this one
can hear it. WHY: the modulation plugin read as a flat slab beside the ABOUT card for three waves and the
colours were the same to within one 8-bit code — `hsl(212 14% 13%)` against the house's
`hsl(214 16% 13%)`, both `rgb(28, 33, 38)`. The difference was that reach-list 15 pinned the plugin's pane
at `:root:root:root`, where **CARD STYLE cannot reach it**: every other card in the lab went REFRACTIVE on
the shipped default and this one could not. Two waves of tint adjustment could not have found that, and
one question would have. The fix is that the surface reads the house's own tokens and answers the house's
own switch — after which "it follows the glass" is true tomorrow as well as today.
