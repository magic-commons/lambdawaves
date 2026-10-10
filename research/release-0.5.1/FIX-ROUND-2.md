# FIX ROUND 2 · 0.5.1 "Informational Update" (2026-10-09, Sonnet 5.5, for Claude Yan on `yan-c`)

Closes D-V's S1 and S2, measures S3, and decides the hand on a ROUTED dial. Worktree
`/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-ad237e48fb762c9d1`, branch `worktree-agent-ad237e48fb762c9d1`, reset to
`710d9df`. Ports 9033 / 5503. Nothing under `lab/mir/**` or `lab/fonts/**`; CLAUDE.md, CHANGES and REPORT untouched (the wording is DRAFTED in §6).
Never pushed, merged or tagged. `lab/*.js` **27,657 → 27,666** (+9: `lab/mod-port.js`; `lab/sw.js` is the same line count, re-hashed).

| commit | what |
|---|---|
| `f3bd6cd` | `0.5.1 fix · the flash guard lets go: after the quiet second a held route is re-applied and the line cleared (D-V S1)` — `lab/mod-port.js`, `lab/sw.js`, `tests/flash-routes.test.mjs` |
| `5ad8bee` | `0.5.1 · tests/legacy/boot B127 — the live-region ceiling names the CURVES stepper (D-V S2)` — test only |
| this one | `0.5.1 · FIX-ROUND-2.md` |

## 1 · S1 — the guard can stay held (D10-19): FIXED

**Cause (confirmed).** The kit's `createFlashGuard` lets go only inside `guard()` (`flash-guard.js:83`, a pass after `release` seconds of no refused
swing). The registry never calls a `set` whose value did not change (`registry.js` `applyModulated`: `Object.is(r.current, p) && was`). A modulator
that goes constant mid-hold therefore writes nothing, `guard()` is never called again, the route keeps the held number and METERS keeps the line.

**Fix** (`guardRoutes`, +9 lines net in `lab/mod-port.js`). `guardRoutes(defs, { driven, now, say, read, onAdvance })` keeps a map `lastWrite`
(def → the modulation-second of its last write *while held*; deleted on a pass, a release and every non-modulator write). It registers ONE watcher
with the modulation clock's `onAdvance` (`host.js:536`, the kit's "advance notice": fired after the model moved and the routes applied, on 'tick'
(live), 'step' (a film) and 'seek'). When a held def has taken no write for `WCAG.releaseS` (the guard's own `release`, 1 s) the watcher does
`guard.reset(label)`, `say('')`, and hands the raw def `read(id)` — the registry's current value. `createModPort.install` now builds the host
first (it never depended on `defs`) so it can pass `host.registry.read` and `host.clock.onAdvance`.

**Which clock, and why: the modulation's own seconds (`clock.stats().seconds`), not wall time.** That is the clock the guard already reads (`now`),
and the one a film steps with `clock.step(d)`; a `setTimeout` would fire at a wall moment unrelated to the frame schedule, so a film rendered
faster or slower than real time would let go on a different frame (the film is digest-locked; D10-19-BUILD §2 chose these seconds for the same
reason). `onAdvance` is the kit's door for exactly this ("a client that must see every move of musical time"): no timer to arm, cancel or leak, no
cost off the modulation (it only fires while the clock runs). The kit's own release path is not enough (it needs a write); `guard.reset` is what is used.

**Every law kept.** A non-modulator write (a hand on an unrouted dial, the restore on a stop) is still handed to the def bit for bit and clears a held
route (and now also forgets it in `lastWrite`, so it is never swept again); a pass hands over the number it was given; the trip is said once; the
restore to the base on a stop is exact (`tests/flash-routes.test.mjs` case 7: `of('material.exposure').at(-1)[1] === 1`).

**Tests** (`tests/flash-routes.test.mjs`; the rig gained `read` / `onAdvance` / `tick()`, and every `run` ticks after each write so the sweep is
exercised against the old cases too):
- **6b (unit):** a 10 Hz square ±0.3 stop on EXPOSURE until a refused write; the input then goes constant (the registry's current = that input ≠ the
  held output). 0.95 s of ticks: the hold stays and the line is not cleared; at release + one step (1.05 s) the def receives the input *exactly* and
  the status line gets one `''`; five more ticks do nothing; the route then starts fresh (a slow move passes untouched).
- **6 (extended):** after the stop's restore, a later tick sweeps nothing.
- **7b (wired, the real port + host + model):** a 10 Hz synced square routed to EXPOSURE, stepped with `clock.step(0.02)` until the picture is held off
  the registry's number; `removeSource` (the route kept); 0.4 s later nothing was written and the hold still stands; after release + a step the route
  equals `registry.read` exactly, the route is still modulated, the line is `['…held…', '']`; `modReset` then restores the base exactly.
- Negative control: with the release disabled (`>= 1e9`) 6b fails (`0.812 vs 1.231`) and 7b fails (`1 vs 2.148`); restored and green.

**The verifier's probe** (`.tmp/p-guard3.mjs`, the source removed at a held moment, three trials, read at +0.3 s, +2.5 s, +6 s):

| | trials stuck | at +0.3 s | at +2.5 s | at +6 s |
|---|---|---|---|---|
| tip `710d9df` (served from an export, this rig) | **3 of 3** | held, line up | held, line up | held, line up |
| this tree | **0 of 3** | held, line up (inside the quiet second) | `mat === regCurrent`, status `''` | same |

## 2 · The hand on a ROUTED dial: NOT FIXED, on purpose — the docs must say it is held too

**What the kit gives.** `P.hand(id, v)` → `registry.write` = `setBase`. Under a modulator `setBase` moves the base, emits `notify(r, 'base')` and
**returns without publishing** (`registry.js` `setBase`: `if (r.modulated) { if (moved) notify(r, 'base'); return r.base; }`), so the hand never
reaches a `set` at all. The picture changes at the modulator's *next* `applyModulated`, a write that carries the hand's base but is the same call, with
the same arguments, as any other modulator write. The only mark of a hand there is the earlier `'base'` event (and our own `P.hand`): there is no
mark *on the write the guard sees*. The 3-line bypass the brief describes is therefore "flag the id on a base move, return `driven` false for the next
write", and `driven` false is the non-modulator branch: **it resets the guard**.

**The cost of that bypass, measured** (`.tmp/hand-bypass.mjs`, scratch: `guardRoutes` over a fake clock, a 10 Hz square ±0.3 stop on EXPOSURE for 3 s at
60 frames/s, with a "hand" frame every N frames bypassing):

| hand moves | output direction reversals in 3 s | per second | tripped |
|---|---|---|---|
| none | 17 | 5.7 | yes (held) |
| every 12th frame (5 Hz) | 58 | 19.3 | no |
| every 6th / 4th / 2nd frame | 58 | 19.3 | no |

A finger moving the base five times a second would turn the limiter off against a 10 Hz strobe (the whole square passes: 19 reversals a second where
the law allows 6). Bypassing without the reset is worse: the guard's `out` would be stale and the next held write would snap the picture back to the
old number under the finger. So the smaller right thing is to leave the behaviour: **a flash is a flash whoever makes it**, and the base arc under
the finger is not fought (only the picture is limited; the dial's base follows the hand).

**Evidence of the behaviour on this tree** (`.tmp/p-guard4.mjs`, 40 real CDP drag moves in ≈ 1.85 s, ≈ 6 reversals/s): H0 unrouted — 39 of 39
reversals reach the picture, METERS silent; H1 routed to a 0.1 Hz LFO — 12 of 39 pass, `FLASH GUARD · EXPOSURE 10.6 Hz held to 3/s`, and the line
is `''` again 1.5 s after the sweep ends (S1's fix at work). The same numbers D-V measured (39 / 12).

**What changed in code for it:** only the `guardRoutes` docstring (it said "a hand's write … pass untouched" without "on an UNROUTED dial"). The
sentences to reword are in §6.

## 3 · S2 — B127's live-region ceiling: RE-AIMED

`tests/legacy/boot.browser-test.mjs` only. The CURVES card's PRESET stepper is the kit's stepper (`controls/stepper.js:53`: its name is
`aria-live`), the 7th seat of the admitted kind, written on a user's step. Done as LEGACY-BOOT-REAIM §10 did the TIMELINE's two, annotated
`/* 0.5.1 re-aim (D10-24): … */`: `canvasT.live === 7`; `liveKinds` has the third `SPAN.mir-step-text`; and the seat is NAMED by its card —
`liveCurves = live.filter(e => e.closest('.dev[data-id="curves"]'))` must be exactly `SPAN.mir-step-text` — so an 8th seat or a different kind fails.
`liveBad === 0` and the 3 s MutationObserver clause (`liveSpoke === 0`, armed on all seven seats, the closed card being in the DOM) are kept. No
`lab/` change. B127 alone through the chunk runner (`.tmp/chunk.mjs @.tmp/spec-b121.txt`): **10 of 10 green**, `live: 7`,
`liveCurves: ["SPAN.mir-step-text"]`, `liveSpoke: 0`, `during: 0`, `onPause: 1`. Green in all three full boot runs below.

## 4 · S3 — `gpu-recovery` alone on the rig: RED, the same stall (not patched)

Rig: no geckodriver / chrome of ours; **Josh's own desktop Firefox (pid 2002078, `/snap/firefox`) was up throughout** and shares the GPU (I ran anyway,
it is his). `wait-gpu` free, load 2.4–3.0. Run alone, twice, on this tree:

| run | result |
|---|---|
| 1 | **RED**: 6 PASS (boot/reload 0 and 1, grids 64/96/128/64), then `AssertionError {"E":"Render did not settle: animation frames stopped | waitForPaint/</timer<@…/lab/frame-settle.js:9:14"}` at `gpu-recovery.browser-test.mjs:15` (the status step of cycle 2, the third boot) |
| 2 | **RED**: identical (6 PASS, then the same message at the same line) |

Count: **0 of 2 green**. Same message, same step as D-V's five of eight on the tip and four of seven on the base: the headless-Firefox rAF stall of
LEGACY-BOOT-REAIM §3 (there provoked by a real pointer drag; here by the third navigation, after a reload from a dirty project). It is the rig's, not
0.5.1's (S1 touches `install` order and one clock watcher, not boot). The suite was not patched. For the tag: rerun with Josh's Firefox closed, and/or
let the cycle wait for frames returning instead of failing on the stall (a suite change for the integrator to rule on).

## 5 · The gates

| gate | result |
|---|---|
| `node tests/pwa.test.mjs --write` | `lab/sw.js` re-hashed (`mod-port.js`); 347 files precached; `pwa.test` PASS |
| `bash test.sh node` | **exit 0, 942 PASS / GREEN, 0 red**, incl. the extended `flash routes` |
| `take-in-bugs` | 4 / 4 |
| `routed-knob` | 0 failing of 4 |
| `mir-controls` | 2 / 2 |
| `offer` | 16 of 16 scenes |
| `settings-probe` | 0 of 6 scenes red |
| B127 alone (chunk) | 10 / 10 |
| `p-guard3` (S1 probe) | 0 of 3 stuck (tip: 3 of 3) |
| `p-guard4` (the hand) | unrouted 39 / routed 12, as D-V; line clears after the sweep |
| `gpu-recovery` alone ×2 | 0 of 2 green (S3 above) |
| `tests/legacy/boot` alone ×3 | **run 1: 150/152 — B69, B149.  run 2: 150/152 — B76, B149.  run 3: 151/152 — B149 only.**  B127 GREEN in all three |

**The boot suite's two extra reds are timing flakes of the rig, not the fix.** B69 (run 1; `togFollowed` 306 not 310 — the ◧ toggle measured 4 px short
of its CSS `left` transition, `skin.css:224`) was RED as a chunk on the same tree **before** I restarted the gate server and GREEN five times
**after**: twice on an export of the integrator's tip `710d9df`, once on that export with my `mod-port.js`, once on that export with my `sw.js` too
(its served files then byte-identical to my tree's), and once on my own restarted server. B76 (run 2; `c60.refused: 1`, `applied 32 vs raf 33` —
the cadence cap refused one frame, so "applied equals raf" failed by one) was GREEN as a chunk on this tree and in runs 1 and 3. Neither law touches
`guardRoutes`, `install` order or the clock's watcher (B69 is CSS geometry; B76 counts the cadence gate); both measure the machine, which shared
the GPU with Josh's Firefox. **B149 is the only law red that repeats (the expected kit red).** D-V's single run (150/152) had no flake; a flaky
law fails one run in three here.

## 6 · Drafted wording for the integrator (NOT applied; CLAUDE.md is yours)

**CLAUDE.md, THE FLASH GUARD paragraph** (replace the parenthesis `(a hand's write and a stop's restore are never held)` and add the sentence after
`said once in METERS' status (…)`):

> … holding a route a MODULATOR drives to 3 flashes a second on the modulation clock's own seconds (a hand on an UNROUTED dial and a stop's restore
> are never held; a hand on a ROUTED dial moves the BASE and the modulator's next output carries it through the guard, so that picture IS held — a
> flash is a flash whoever makes it, and the dial's base is not fought), said once in METERS' status (`FLASH GUARD · EXPOSURE 10.0 Hz held to 3/s`).
> A held route whose modulator goes constant is let go after the guard's quiet second — `guardRoutes` hears the clock's `onAdvance`, on the
> modulation's own seconds, so a film lets go on the same frame — handed the registry's current value, with the line cleared. …

**`research/release-0.5.1/CHANGES-0.5.1.md` line 9–10** (`Your own hand on a dial, slow or shallow sweeps, and every other control are never touched.`):

> A slow or shallow sweep and every other control are never touched, and your own hand on a dial nothing modulates passes straight through; a hand
> sweeping faster than three times a second on a dial an LFO is also driving is held like the LFO, because the picture it makes is the same flash.
> The line clears by itself a second after the LFO stops moving.

**`REPORT.md` wave 210** (`A route is held only while a MODULATOR drives it. A hand's write and the restore to the base on a stop pass untouched …`):
"… A hand's write on an UNROUTED dial and the restore … pass untouched (…); on a ROUTED dial the hand moves the base and the modulator's next output
carries it, so it is held. A held route whose modulator goes constant is let go after WCAG.releaseS (`onAdvance`, the modulation's seconds)."
**`D10-19-BUILD.md` §6 "Known behaviour"** is the same: a hand flailing a luminance knob is held *on a routed dial*, not held on an unrouted one.

**For the next `LEGACY-BOOT-REAIM.md` note** (CLAUDE.md has no live-region sentence): the live-region ceiling is SEVEN, named: the modulation window's
hint (`DIV.m2hint`), the keys status (`DIV.km-status`), the kit banner (`DIV.mir-banner`), the TIMELINE's status line and snap stepper
(`DIV.tl-status`, `SPAN.mir-step-text`), the CURVES card's PRESET stepper and the PALETTE stepper (`SPAN.mir-step-text` ×2) — the same admitted kind: a
user's act, silent while the transport runs.

## 7 · Commands

```
python3 tools/gate/server.py <worktree> 9033 &                                          # stopped by pid; nothing of mine is left running
LW_PORT=9033 GD_PORT=5503 node tests/flash-routes.test.mjs                              # or: bash test.sh node
LW_PORT=9033 GD_PORT=5503 node .tmp/p-guard3.mjs                                        # S1, 3 trials (read-only probe copied from D-V)
LW_PORT=9033 GD_PORT=5503 node .tmp/chunk.mjs @.tmp/spec-b121.txt                       # B127 with its helpers
LW_PORT=9033 GD_PORT=5503 node tests/gpu-recovery.browser-test.mjs                      # S3, alone
LW_PORT=9033 GD_PORT=5503 node tests/legacy/boot.browser-test.mjs                       # about 7 min, alone on the rig
```
