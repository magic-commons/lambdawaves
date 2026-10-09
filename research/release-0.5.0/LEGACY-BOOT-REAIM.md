# tests/legacy/boot.browser-test.mjs, re-aimed for the 0.5.0 adoption

Sonnet 5.5 sub-agent, 2026-10-09. Worktree `.claude/worktrees/agent-afd5abd59436c24a7`, branch
`worktree-agent-afd5abd59436c24a7`, from `f0d4566` (sos-s0). One tracked file changed: `tests/legacy/boot.browser-test.mjs`.
Nothing under `lab/` was touched (the defects below are reported, not fixed).

## 1. The result

| | verdicts | GREEN | RED | how it ended |
|---|---|---|---|---|
| BEFORE · the suite as it stood, on this tree (`.tmp/boot-1.txt`) | 135 | 52 | 83 | **aborted at B119**: `TypeError: Cannot read properties of undefined (reading '0')` (`w61touch` needs the kit modulation window's grip, which is gone). B120 and everything after it never ran. |
| the same suite on a `git archive v0.4.0-alpha` export (`.tmp/boot-base040.txt`) | 135 | 54 | 81 | aborted at the same line: the suite was already stale against 0.4.0. |
| AFTER · the re-aimed suite on this tree (`.tmp/boot-6.txt`) | 152 | 145 | 7 | **ran to its end** (B13, the foot, is the last verdict) |
| `bash test.sh node` (`.tmp/node-gate.txt`) | | 936 GREEN/PASS | 0 | exit 0 |

The 152 is the whole suite: 17 verdicts more than run 1 reached (B120 to B149 and the foot, B13, had not run on this tree
since the adoption). The red that remains is **7 verdicts, all law, none staleness**: **five REAL REGRESSIONS of 0.5.0**
(B111, B139, B144, B149 clause (b), and the `slap` words of B78) and **three PRE-EXISTING defects** that are red on
v0.4.0-alpha too (B70, B71, and the BOW labels of B78). They are in sections 4 and 5 with the wave, the assertion, the
observed value and the cause. **No law was edited to make any of them green.** Five full runs of the finished suite
(`boot-2` to `boot-6`) were taken while it was being finished; `boot-6.txt` is the one on the committed file.

The suite takes about 7 minutes on this rig.

## 2. What the red was

Almost all of the 83 was the suite being frozen at wave 143 (Sep 2026) while the product moved under it. In order of size:

1. **Windows the 0.2.0 first-run furniture closes, and tags it turns off.** `useCompactDefaults` (rack.js) closes eleven
   windows and STATUS TAGS are off (0.4.0 S0 wave 137); the suite was written with every window open and the tags
   ticking. The baseline step (after B43) now opens them the way a reader would: `__LW.look.set({ badges: true });
   __LW.look.apply({ now: true })`, `reopen` every closed window except transport, atoms, wigner and radiation (B54/B57
   test that those ship closed), press every folded card's chevron, wait 600 ms for the kit rack's 320 ms animation.
2. **The kit's DOM and API (C0 to C9).** RAMP and CAMERA panels (C1), the look store `mir.gui` (C2: theme, card, frost,
   blur, badges, disconnected are not settings-blob keys any more), the rack (C3: no ⇄ and ⓘ chips, no key chips, the
   KEYBOARD window, the real-pointer float drag, 44 px peek, 320 ms reflow animation), the modulation window over ONE
   clock (C4/R-B1/A6: lab/modwindow.js deleted), the session, opener, banner and notice (C6/C6b), the scene guard (C9).
3. **Copy and structure that moved before 0.5.0** and were never re-gated: a526bda's help-surface pass (no ⓘ, no
   `title`, help in `data-help`, labels capitalised), `@layer app, mir` (a stylesheet walk must go into nested rules and
   `@import`s), the visibility scheduler, the kit's 1/8 knob gear, MIR 1.4.3's editable-SINE LFO.
4. **D9/D9b**: QCD, H₂⁺, HELIUM, H₂ and ELECTROSTATICS are deleted behind restore shims. Their blocks are RETIRED to a
   `gone` check that keeps the one thing still true (no window, no `__LW.*`, and the restore opens the file).
5. **The host.** See section 3. Not a law, not a regression, and the reason the suite could not simply be re-run.

## 3. The host finding: a real pointer drag kills the NEXT page's `requestAnimationFrame`

Symptom: from B143 on, `await __LW.settle()` threw `Render did not settle: animation frames stopped`, in a different place
on every run. It looked like a paint stall on 0.5.0 (an earlier measurement said 3 of 5 reloads on the tip against 0 of 5 on
v0.4.0-alpha, with the heavy windows saved open). It is **not** 0.5.0 and not the app:

* `.tmp/nav8.mjs`, on the tip AND on a `v0.4.0-alpha` export: navigating again within a moment of the last frame brings the
  next page up with `requestAnimationFrame` dead (`raf before -1`) from the second navigation on; a 1.5 s pause before
  leaving cures that (6 of 6 pages alive). After ONE WebDriver pointer action (a mouse drag) the pause does not help:
  **every later navigation in the session comes up dead**, whatever is waited and whatever is reset (storage wiped, `closed`
  list dropped, no window open). Key presses alone do not do it.
* Nothing in-session wakes the dead page: a mouse move, a click, a window resize, `maximize`, `window.focus()`, and
  re-navigating all leave it dead (`.tmp/nav9.mjs`). **A navigation through `about:blank` cures it** (`.tmp/nav9b.mjs`), and so
  does a fresh tab.
* The page is not blocked (timers fire, key handlers run); the compositor is not ticking. The pages that die are the ones that
  come after the drag, so the failure walked forward through the file (B143, B145, B146, B148) and moved around between runs.
  The earlier "3/5 vs 0/5" was the same race met at different moments.

The fix is in the helper block before `reload` (`goPainted`, used by `reload` and `w57goto`): leave the page quiet (shut
the heavy windows, drop the saved `closed` list), wait 1.2 s, hop through `about:blank`, navigate, check a frame
arrives within 2.5 s, re-open the windows, and re-navigate up to six times if it does not. The suite prints `NOTE n
reload(s) came up unpainted…` before B13 if it ever needed a retry. It needed none in the final run.

## 4. REAL REGRESSIONS (the law is untouched and the verdict stays red)

| Row · wave | The assertion | Observed on 0.5.0 | Cause | v0.4.0-alpha |
|---|---|---|---|---|
| **B111** · wave 59 (AUDIT-FIRSTRUN §5) | On a phone, pressing ◧ (`#rackToggle`) IS the browser saying which it wants: `settings.phoneRack` reads `true`, the saying is honoured when the breakpoint is crossed out and back, and pressing again reads `false`. | `phFieldT.said: null` (expected `true`), `phSaidT.stored: null`, `hiddenAgain: false`, `storedAgain: null`. The rack does show and hide (`shown: true`, `rackAt: 0`); the preference is never written, so a phone user's choice is lost on the next visit. | The kit rack's own toggle button (`data-rack-btn="toggle"`, lab/mir/shell/rack.js `btn('rackToggle', …)`) calls `setHidden` directly. `layout.toggleRack()` (rack.js:3205, the B key) does `rk.setHidden(!rk.hidden); saveSettings();` and DOES store it (`.tmp/nav14.mjs`: click → `stored` undefined; `toggleRack()` → `false`/`true`; `saveSettings()` → `true`). The click no longer reaches `data-key-action="rack"`. Fix: have the app subscribe to the kit rack's hide change and `saveSettings()`, or route the button through `layout.toggleRack`. | the same click stores `phoneRack: true` (§7) |
| **B139** · (no wave named; it follows B138, wave 67) | FROST STILL changes the filter, **not the material**: "neither changes the fill, border, shadow or radius". | With FROST STILL on a disconnected card in the light theme, the body fill is `rgba(255, 255, 255, 0.1)` stopped, **`rgba(233, 237, 241, 0.86)` while playing**, back to `0.1` on pause (`.tmp/p38.js`); border, shadow and radius do not move. The window visibly goes from glass to a near-opaque pane every time the transport plays. | Read off the numbers (not traced in the source): while the STILL hold withdraws the blur, the body falls back to the opaque non-frost fill (`0.86`) instead of keeping the frost fill (`0.1`). The skin is the kit's (`@layer mir`), not a lab file. | body fill stays `rgba(255, 255, 255, 0.1)` stopped and playing (§7) |
| **B144** · wave 68 | (c) "End reaches 360° and Home reaches 0° and both are the seam": on ACCENT A `aria-valuenow` is `360` after End and `0` after Home, and the tree and the eye agree. | End: `aria-valuenow="360"`, `aria-valuetext="360°"`, **eye `0°`**. Home straight after: `aria-valuenow` stays **`360`** (`homeIsMin: false`). From 4° Home reaches 0 correctly. | The C2 look store folds the hue: `look.set({ accentA: 360 }); look.get('accentA')` is `0` (checked). The knob is re-seated silently from the store (`set(0)`, no announce), so the eye reads 0° while the announced value is stale at 360, and the kit's Home (`nv = lo`) then sees `v === 0` and does nothing, so the tree is never updated (that last step is inferred from the kit's key handler in lab/mir/kit.js). A tree/eye disagreement of exactly the kind wave 68 closed. 0.4.0: End → eye `360°`, Home → `0`. | 0.4.0: End → eye `360°`, Home → `0` (§7) |
| **B149** · wave 69, clause (b) only | "A KEYBOARD-INITIATED ACTION IS NEVER ANIMATED": two real driver Tabs raise two windows and start zero animations. | `tab: { after: 4, running: 4 }` (5 in other runs). Real Tabs from the stage start rack-wide FLIP animations on the `.dev` cards, 320 ms each: `spectrum translate(0, 359px)`, `shadow translate(0, -1525px)`, `chem translate(0, 1884px)`, a height tween on `history` (`.tmp/nav12.mjs`, also in the shipped first-run arrangement with nothing opened). | Tab cycles the windows (`cycleWindow`): the raised card moves to the top of its rack and the kit rack (`createRack`, `animate(moves, …)`, `live()`) animates the reorder, 1.5k px of travel. 0.4.0 reordered instantly (its only animation was `.dev-enter`, on `reopen()`). The app has to ask the rack for an instant move on a keyboard raise. | none: no rack animation existed (§7) |
| **B78** · wave 53 (`slap`) | After the rename, no SLAP word is left on any seat of the live document. | `aria-label "K: slap"` on a BUTTON and two `slap` spans: 3 hits. v0.4.0-alpha has none (`.tmp/p48.js`). | `lab/rack.js:3900`, `{ id: 'slap', group: KG.S, short: 'slap', … }`: the action's `short` is what the kit's KEYBOARD window (C3) prints and uses for the key's `aria-label`; the key sheet that used to carry it left. `short: 'impulse'` fixes it. | no `slap` anywhere (§7) |

B149's other clauses are green: (a) the entrance exists (re-aimed, see §6) and (c) reduced motion lifts the rack's
slide, its transform, and the chevron's transition.

## 5. PRE-EXISTING defects (red on v0.4.0-alpha too; the laws are untouched and the verdicts stay red)

| Row · wave | The assertion | Observed | Note |
|---|---|---|---|
| **B70** · wave 63 and **B71** · wave 51 | Every interactive control is at least 44 px on a touch phone (portrait 500 × 844; landscape 844 × 390), measured by hit-testing. | B70: 46 of 441 controls fail (30 sweeps): the transport's buttons are 45 × 34 (`tbtn play`, `modb on`, `transport-home`, `step-back`, `step-forward`, `jump`), and `ringShort`: `observer.panx` routed 42 × 45, `transport.rate` routed 26 × 45. B71 repeats the same sweep at 844 × 402. | 34 px high on v0.4.0-alpha as well (§7). The two `dev-power` / `dev-fold` failures ("covered by badge exact") exist only because the baseline turns the ψ-badges on, as the suite always assumed; with the shipped tags-off they do not. |
| **B78** · wave 53 (the part that is not `slap`) | After the rename, no SLAP and no BOW is left in any text node or label of the live document, and IMPULSE has its seats: the STATE card's `IMPULSE` trigger, the `IMPULSE · a sudden momentum kick` group, the `LAST IMPULSE` readout. | STATE card: group `BOW`, readout `BOW · escaped / momentum`, no IMPULSE trigger/group/readout (`button`, `group`, `readoutOk` all `false`). | Identical on v0.4.0-alpha (`.tmp/p48.js`). The rename of wave 53 did not reach these labels, and the trigger left the card with a526bda. |

B78 is red for BOTH reasons: the `slap` hits are a 0.5.0 regression (section 4); the BOW labels and the missing IMPULSE seats are this row.
The red verdicts are B70, B71, B78, B111, B139, B144, B149: seven. (After the C7b merge: section 10.)

## 6. The re-aim and retirement table

Every change carries a `0.5.0` annotation on its own line: `grep -n '0\.5\.0' tests/legacy/boot.browser-test.mjs` lists
all of them (147 lines). A RETIRED row keeps the wave numbering and the `judge()` label and states the row in one comment
line (`// B82 RETIRED (0.5.0 C3): …`, or a `gone` check for D9/D9b). "Row" is the 0.5.0 plan row that moved the ground
(C0 glass/layers, C1 RAMP/CAMERA, C2 look store, C3 rack/KEYBOARD, C4 modulation, C6/C6b folders/session/opener/notice,
C9 scene guard, D9/D9b legacy windows); "pre" is a change that landed before 0.5.0 and was never re-gated.

### 6a. Helpers and the baseline

| Where | Old | New | Row |
|---|---|---|---|
| baseline step, after B43 | dark stage, density view, vortex and kepler on, **every window open, tags shown** | the same, plus `look.set({badges:true}); look.apply({now:true})`, reopen every closed window except transport/atoms/wigner/radiation, unfold, wait 600 ms | pre (`useCompactDefaults`), C2, C3 |
| `goPainted` / `reload` / `w57goto` | `drv.go(url)` | quiet leave, shut heavy windows, drop saved `closed`, 1.2 s, `about:blank` hop, retry ≤ 6, NOTE at the foot | host (§3) |
| B6 (truncation SAID), B22, B23, B127 | badge or sentence read on the frame | read a tick later (one more frame, or 200 ms): tags tick at most every 100 ms and only on a frame | pre (wave 137) |

### 6b. Re-aimed (the law is kept; its seat or its words moved)

| Row | Wave | Old assertion | New assertion | Row |
|---|---|---|---|---|
| B9 | — | idle window opened right after `play()` | wait 450 ms for the kit rack's height animation (its occlusion schedules one lawful PRESENT) | C3 |
| B12 | — | plain register reads `EXACT ANALYTIC` | reads `HYDROGEN` (`STURMIAN BASIS` / `STARK SHELL MODEL` otherwise) | pre |
| B16 | — | ORBIT recomputes behind a fold | recomputes when the fold opens (a folded window does no work) | pre (window-activity.js) |
| B19 | — | the editor is `paletteview.js` with a `.pal-strip` canvas | the kit's RAMP panel | C1 |
| B27 | 53 | status line says `TOY DRAG` "and says so" | "and says so" clause retired (a526bda copy pass) | pre |
| B28 | 57 | TAB's first window is the right rack's; rebind `T`; saved record shape | top read off BOTH racks (SHADOW·SPECTRUM·MOLECULES sit on the left); the rebinding goes to the unbound `U` (T is the dock key); saved record is an array of chord strings | pre, C3 |
| B38 | 59 | ⓘ hint icons, `N` notes key | removed (a526bda); HELP is the kit's row | C2 |
| B42 | — | ⓘ header icon and panel; GAMMA knob in the OBSERVER card | removed; GAMMA is in SETTINGS; scroll once the 320 ms raise ends | C2, C3 |
| B43 | 80 | SETTINGS/STATE open; key chips on SETTINGS; the tight card shadow | start folded (W129); chips left for KEYBOARD; the shadow is the kit's (box-shadow class) | C0, C3 |
| B44 | — | window named SHADOW; four ψ-badges hidden; STATUS TAGS a blob key; "top of the rack" is the first `.dev:not([hidden])` | name shortened (a526bda); the badge strip stays for the build offer; STATUS TAGS is the `mir.gui` row; the first card that is **not closed** is the top (the kit keeps a closed card in the DOM) | C2, C3 |
| B45 | — | IMPULSE trigger in STATE | reached through the `K` key | pre |
| B46 | 56 | palette strip, camera reset, SETTINGS key chips | RAMP; the panel's HOME; the KEYBOARD window | C1, C3 |
| B47 | 59 | the `J` chip is pressed; rack peeks within 60 px | `J` is pressed as a key; `RACK.peekNear = 44` | C3 |
| B49 | — | library "removed" means back to 0 demos; `.nb-more` marker | back to the six DEMOS folder items; marker left (2efbc10) | C6 |
| B54 | 106 | boot order lists ELECTROSTATICS (`field`) | not listed | D9b |
| B56 | — | period readout `NO EXACT PERIOD`; the disabled RATE / TRANSITION note in `title` | `nearest recurrence`; the note in `data-help` | pre |
| B57 | — | ELECTROSTATICS in the list; wave-39 note in `title` | gone; note in `data-help` | D9b |
| B59 | — | layout record has no `history`; `Ctrl+Z` chip | `"history"` is a card id VALUE, what no project may carry is a history KEY; chip clause retired | C3 |
| B60 | 63 | governor test from the shipped grid | the shipped grid is the ladder's first rung (64³): start from 96³ so there is a rung to give up | pre (W125 PACE) |
| B61 | 53 | METERS says `STEPPED`; the graph tip is written the frame after the move | `GRID −1 · 99.6 ms · 64³`; one more frame (about 20 fps with every window open) | pre |
| B62 | 51 | card style a blob key; four controls side by side; stamp `waves N` | the `mir.gui` row; one row each in SETTINGS; `x.y.z-alpha · the library · date`, upcased on ABOUT | C2 |
| B63 | — | chrome pixels read with the rack up; theme a blob key; SETTINGS' button label | rack put away (the occlusion mask hides the lines under a window); `mir.gui` row; the kit's pane; `WARNING` | C0, C2, C6b |
| B64 | 53 | HUE repaints via `mat.hueShift`; credits `Made with`; ABOUT size | `paintMarks()` is the repaint; `Built by AI coding agents`; ABOUT keeps its own size | C2 |
| B66 | 106 | CAMERA text same frame; RESEED trigger; the old card | read on the frame after a notice; the `Ctrl+R` action; the kit CAMERA panel (YAW·PITCH·X·Y·ZOOM·FOV + HAND), RESET VIEW is its HOME | C1 |
| B69 | 59 | grip counted as a spill; TINTED on a phone | the invisible grip is not a spill; TINTED is the first run's, a stored REFRACTIVE is not overwritten | C3 |
| B70 | 63 | ⇄ chip hidden on touch | not built (clause stands a fortiori) | C3 |
| B71 | 51 | inner height 390; top-level sheet walk | this Firefox's floor gives 402, the law is the query's ≤ 520; the walk goes into `@layer` | C0 |
| B72 | 51 | ⇄ shown again on the desktop; the phone query found by a `--phone` property | clause retired; the query is found by its text (`hover: none … max-width: 700px`) | C3, C0 |
| B73 | 50 | the camera's SPIN dial reads `1.25` (radians per second) | reads `1.25 × 180 / π` (degrees per second) | C1 |
| B74 | 92 | window leaves in 160 ms; pill 560 wide with 12 children; every button `static` | 600 ms; pill 640 wide; one visible seat (the native play row), EXPAND inside it; `static` or `relative` | C4 |
| B75 | 64 | sleep for a frame | count to a sample (the exit motion costs frames) | C4 |
| B76 | 51 | cadence law with two clocks (`LINKED`/`SEPARATE`); the modulation's frames are PRESENT-tier (`E === 0`, `P > 0`) | ONE clock: the modulation's play IS THE play; its frames are EVOLVE ones (`E > 0`); R and B stay 0; **the PACE governor is held off while the window is measured** (at 96³, about 20 fps with every window open, it steps a rung, a REBUILD, inside the 2-s window) | C4 R-B1 A6 |
| B77 | 53 | FRAME and AXES switches; shots with the rack up; stored in the project | two SEGMENTS; rack put away; PREFERENCES (docs/STATE-SCOPES.md): a project carries neither | pre, C2 |
| B79 | 53 | `lw-turn-N` keyframes in top-level sheets | `mir-turn-N`; the walk follows `@layer` and `@import` (`lw-busy-breathe` is in base.css by `@import`) | C0, C2 |
| B81 | 53 | the warning sign is an SVG composite | a picture, `lab/img/warning-sign.png`, proved in its own pixels | C6b |
| B88 | 54 | palette menu is a `<select>` grouped by stops; the name is a blob key | the RAMP stepper over `palette.groups`; the palette is the PROJECT's (a reload returns the default) | C1, STATE-SCOPES |
| B89 | 54 | GAMUT segment | the DISPLAY P3 switch and the IN P3 segment (CONVERT · VIVID) | pre |
| B90 | 55 | synthesised drag of a float; chip glyph `reopen` | a REAL pointer drag; the kit's `dock` glyph | C3 |
| B91 | 55 | ⓘ and ⇄ chips; every card unfolded | not built (86 named, not 140+); `Aa` is the one TEXT chip; the card is folded in the block | C3 |
| B93 | 55 | window leaves in 160 ms | the kit's own motion | C4 |
| B94 | 55 | the ⓘ chip | left (a526bda) | pre |
| B96 | 56 | WAVE card carries SPACE / DRAW captions | clauses retired (same on v0.4.0-alpha) | pre |
| B97 | 56 | build offer is accepted by a press | an UNTOUCHED session takes a waiting build itself (`TAKING THE NEW BUILD…`, one skip-waiting); RESUME, a cover and any other session are offered it | C6b |
| B98 | 56 | note names the MOLECULE panel and the MODULATION rack | names the MODULATION rack alone | D9 |
| B100, B101, B113 | 56, 57, 59 | palette picker `<select>`, catalogue read from it | the RAMP stepper, RELOAD is its RESET; catalogue from `palette.groups` | C1 |
| B103 | 57 | the RATE hint says `reduced motion` | `/reduced motion/i` in `data-help` (`Reduced motion lowered RATE.`, capital R since a526bda; same on v0.4.0-alpha) | pre |
| B107 | 58 | the BOW dial | the kit's HAND row calls it DRAG | C1 |
| B109 | 59 | banner messages via `import()` | through the kit's `installBanner` module | C6b |
| B110, B111 | 59 | the nine-second `#hint` legend bar (phone legend, fit, opacity) | clauses retired: the kit's CONTROL HINTS row | C2, C6b |
| B112 | 59 | the notice is put down by hand; the motion gate is read out of `rack.js` | through the facade; read out of `motion-pref.js` | C6b, pre |
| B113 | 59 | STAGE blend moves the stage | FOLLOW THEME is on and bypasses the blend; put back after | pre |
| B114 | 59 | side written `L` / `R` | `left` / `right` in `data-phone-from` | C3 |
| B122 | 62 | reveal runs for every knob; `DRAG γ (TOY)` label; Shift = a quarter of a step (`0.019 / 4`) | the knob is scrolled into view first; `DRAG γ`; the kit's ONE KNOB LAW gears Shift to an eighth (`0.019 / 8`) | C0 |
| B125 | 62 | no keyboard trap anywhere | the one legitimate trap is the kit's notice (`dismiss: false`): Tab cycles inside, Escape does nothing | C6b |
| B126 | 62 | THEME radio focusable; PROJECTS IMPORT `<input type=file>`; COPY chip `digest` | THEME is on LOOK, so the tab is selected first; the input is gone (FOLDERS makes its picker when pressed): clause retired; `copy this panel as text` | C6 |
| B128 | 63 | a link's open leaves play alone | there is ONE clock: opening a link pauses THE play; the route stays | C4 |
| B136 | 67 | boot road reads `s.disc !== false`; first card unfolded; a press in a gap orbits the picture | `LOOK_DEFAULTS`; the first card may be folded; the scene guard: a press in a window's gap never reaches the stage | C2, C9 |
| B139 | — | the `.dev` root's computed filter is `none` under ALWAYS | clause retired (skin.css:143 on both trees; visibility:hidden when disconnected, which B136 asserts); FROST is the `mir.gui` row; first card may be folded | C2 |
| B140 | 68 | KEEP FRAMES focusable; SETTINGS key chips | via the QUALITY tab; the recorder is the KEYBOARD window (refuses Tab): the table half is kept | C3 |
| B143 | 68 | `STRENGTH` knob (any) | the OBSERVER's (another card has one) | pre |
| B144 | 68 | ACCENT A on THEME | on SETTINGS · LOOK (the real-drag guard also needs a position that is on screen) | C2 |
| B146 | 69 | eleven window titles carry an `<m>` run; `.sw` tooltips are `title`s | clause retired (titles are plain words; the only `<m>` title on v0.4.0-alpha was H₂ · LEGACY); the tooltip is `data-help` (there is no `title` in the document) | pre |
| B149 | 69 | the entrance is a `.dev-enter` class with CSS keyframes; reduced motion falls back to an opacity keyframe | the kit's Web Animation on the window (translate 6 px, **220 ms, `cubic-bezier(0.23, 1, 0.32, 1)`**, one iteration; counted by duration, since the rack's own 320 ms reflows are not it); raise starts none; the quiet-keyframe clause is retired (`enter()` plays nothing under reduced motion, and its keyframe sits in `@layer mir`) | C3 |

### 6c. RETIRED (the thing is gone; the row says why)

| Row | Wave | Old assertion | Now | Row |
|---|---|---|---|---|
| B22 | — | QCD: window, `__LW.qcd` | `qcd.gone && !qcd.api` | D9 |
| B29, B58, B105 | — | H₂⁺ card: `__LW.molecule`, `__LW.mo`, `__LW.pulse` | `*.gone`; restore opens the file as MOLECULES · H₂ | D9 |
| B33, B37 | — | HELIUM card; `__LW.helium`, `__LW.placeElectron` | `*.gone`; restore opens the file as SPECTRUM's ATOM · He 1s | D9 |
| B35, B106 | — | H₂ card (Heitler–London, STO-3G curves), `__LW.h2` | `*.gone`; `lab/h2ci.js` and `tests/h2ci.test.mjs` keep the physics | D9b |
| B55 | — | ELECTROSTATICS window, `#fieldlines`, `__LW.fieldlines` | `*.gone`; a file whose overlay was on opens with the notice and nothing drawn | D9b |
| B82 | 53 | the `?` key sheet's rows | the KEYBOARD window (`tests/keyboard-window.browser-test.mjs`, `tests/keyboard-shortcuts.test.mjs`) | C3 |
| B115, B116, B117 | — | W-MODSHAPE curve and envelope pictures; the loop clock | the kit's window, held by MIR's gate and `tests/lfo-tension.browser-test.mjs` | C4 |
| B118, B119, B120 | — | macro grip router, depth arc, finger / popover (lab/modwindow.js, 3,110 lines) | `createModulation`'s own gate and `tests/routed-knob`, `lfo-tension`, `take-in-bugs` | C4 |
| B129, B130, B131 | — | the ported artifact's HOST geometry (709 rules, double-tap title, routing overlay) | MIR's gate (`mir.test`, the stylehash) and tests | C4 |
| B132, B133 | — | the MOD arm's seat; the "two clocks" of Space | ONE clock; `tests/take-in-bugs.browser-test.mjs` (five boots) | C4 R-B1 A6 |
| B137 | 67 | float drag with a once-a-frame write and a flush on release (synthesised) | the kit's `createRack` takes a REAL pointer; held by `tests/keyboard-window.browser-test.mjs` | C3 |
| clause-level | | B8 `IMPULSE` trigger, B78 key-sheet rows and hint bar, B96 captions, B72 ⇄ shown, B146 operator titles, B149 quiet keyframe, B110 / B111 legend clauses, B58 `Ctrl+Z` chip, B124 capture, B142 capture | one comment line each, naming the row | C2, C3 |

## 7. Evidence for the pre-existing and regression claims

`bash .tmp/verify-post.sh` (tip, then the 0.4.0 export, one browser at a time):

| Probe (`.tmp/verify-post.sh`) | 0.5.0 tip | v0.4.0-alpha export |
|---|---|---|
| B70/B71 transport buttons at 500 × 844, tags off | `play`, `modb on`, `transport-home`, `step-back`, `step-forward`, `jump`: all **45 × 34**; power and fold 44 × 44 | identical: 45 × 34 |
| B139 FROST STILL body fill, stopped / playing / stopped | `0.1` / **`0.86`** / `0.1` (`rgba(255,255,255,…)` to `rgba(233,237,241,…)`) | `0.1` / `0.1` / `0.1` |
| B144 ACCENT A, real End then real Home | End: `now=360 text=360° eye=0°`; Home: `now=360 eye=0°` (no change) | End: `now=360 eye=360°`; Home: `now=0 eye=0°` |
| B111 click on `#rackToggle` at 500 × 844 | `settings.phoneRack` stays absent; `saveSettings()` or `layout.toggleRack()` then stores it | the click stores `true` |
| B149(b) animations on `.dev` cards after two real Tabs (shipped arrangement) | `spectrum translate(0,359px)`, `shadow (0,-1525px)`, then `chem (0,1884px)`, `spectrum`, `shadow`, 320 ms each | none |
| B78 `slap` / `bow` words in the live document | `aria-label "K: slap"` (BUTTON), 2 × `slap` (SPAN), 2 × `BOW` (STATE) | 2 × `BOW` (STATE) |
| B61 graph tip, full-run only (`boot-5`, `boot-2` red; `boot-3`, `boot-4`, `boot-6` green) | the tip is written ON the move (`tip0: "n2 · 57.2 % · E = -0.1250 Eh"`) and the next frame has hidden it (`tipHidden: true`, `tipText: ""`) | n/a (read on the move now) |

## 8. Commands

```
# the gate server, on this tree (kill it by pid; never pkill -f)
python3 tools/gate/server.py /home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-afd5abd59436c24a7 8933 &
echo $! > .tmp/server.pid

# the suite, to its end (about 7 min), one browser at a time
LW_PORT=8933 GD_PORT=5403 node tests/legacy/boot.browser-test.mjs > .tmp/boot-6.txt 2>&1

# the 0.4.0 comparison tree and the swap between the two
git archive v0.4.0-alpha --prefix=.tmp/base040/ | tar -x          # (.tmp/export-base.sh)
bash .tmp/swap-server.sh base      # or: tree

# one block at a time, with its preamble and the full detail the judge truncates at 600 characters
LW_PORT=8933 GD_PORT=5403 node .tmp/chunk.mjs 'm:/* ── B44: close and reopen~/* ── B45'
LW_PORT=8933 GD_PORT=5403 node .tmp/chunk.mjs @.tmp/spec-b140.txt         # B140 to B149

# the node gate, once
bash test.sh node                  # exit 0, 0 red

# stop the server
kill "$(cat .tmp/server.pid)"
```

`.tmp/` is git-ignored: the probes (`nav8`, `nav9`, `nav9b`, `nav12`, `nav14`, `p38`, `p48`, …), the chunk runner and the logs
(`boot-1.txt` … `boot-6.txt`, `boot-base040.txt`) stay on this worktree and are not in the commit.

## 9. Other things seen

* A 2-second modulation window at 96³ with every window open runs at about 20 fps here (`applied 36–41 / 2 s`); the PACE
  governor can step a rung (a REBUILD) inside it. That is the load of the baseline, not of the modulation (B76).
* The final run needed no reload retry (`STALLS` 0). If `NOTE n reload(s) came up unpainted` ever appears, it is §3.
* B54 goes red when its block is run in a chunk without the blocks before it (it depends on a leftover); it is green in the
  full run. B6, B44, B61, B76, B79 and B103 were each red at one point in a full run and are explained in §6; B6 and B61
  are the two that are timing (the tags tick; the ladder's next repaint hides an unowned tip), and both now read what they
  need on the move or a tick later. B61 was red in 2 of the 5 full runs before that and green in the one after; it is the
  row to look at first if a later run shows a stray red.

## 10. After the C7b merge (2026-10-09)

Sonnet 5.5 (diagnosis, a2ea2bd5682f64c9c) then Fable 5.1 (edits and runs), worktree `.claude/worktrees/agent-a02df547124e9823f`, branch
`worktree-agent-a02df547124e9823f`, from `b9e0c57` (`yan-c`: sos-s0 `bc2a5cc` + FIX ROUND 1). One tracked file changed besides this note:
`tests/legacy/boot.browser-test.mjs`. Nothing under `lab/`. C7b (the TIMELINE window, the RENDER card, R5's exact resume) moved five rows.

### 10a. Counts

| Run | verdicts | GREEN | RED | red rows |
|---|---|---|---|---|
| the integrator's merged run (sos-s0 with C7b, before FIX ROUND 1) | 152 | 140 | 12 | B66 B70 B71 B78 B84 B108 B111 B127 B134 B139 B144 B149 |
| BEFORE · this tree `b9e0c57`, alone (`.tmp/boot-1.txt`) | 152 | 143 | 9 | B66 B70 B71 B78 B108 B127 B134 B139 B149 |
| the same, re-run with untruncated detail (`.tmp/boot-1f.txt`, B13 not run) | 151 | 141 | 10 | the nine above and **B84** |
| AFTER · this tree with the five re-aimed, alone (`.tmp/boot-2.txt`) | 152 | 147 | 5 | B70 B71 B78 B139 B149 |
| `bash test.sh node` (`.tmp/node-gate.txt`) | | 940 PASS/GREEN | 0 | exit 0 |

B84 is the flaky one: green in the baseline, red in the detailed re-run and red alone as a chunk on both trees (§10b). B16 never showed the
ResizeObserver cascade FIX ROUND 1 saw once: both of my full runs were alone on the rig (it was the neighbouring suite).

### 10b. The five rows

| Row | Wave | Old assertion | Now | Verdict |
|---|---|---|---|---|
| B66 | 106 (list: 58) | CAMERA knobs end `…SPIN\|SECONDS`; the buttons include TAKE A PICTURE and ONE PERIOD | knobs end at `SPIN`; the buttons are pinned EXACTLY to `PAN HOME\|HOME\|SET Δρ REF`; the picture and film verbs are the RENDER card's and B108 holds them | **STALE** (C7b: the capture group left the CAMERA card; observed knobs `YAW…SPIN`, switch `AUTO-ROTATE`) |
| B84 | 54 | the stat read lands inside a 3-s absence | the absence is 5 s; every claim unchanged | **HARNESS RACE** (not a regression: it fails alone on the pre-C7b export with the same numbers). Gecko throttles the hidden tab's timers to a one-second grid; the 700 ms arm timer landed at hide + 1003 ms in one run and hide + 2006 ms in another, so the 250 ms stat timer after it fell at 2.0 s or past the 3.0 s resume, and the worker's reply reaches the main thread only when that timer runs. Three runs of the new file: `armed` at +999, +2007 and +2006 ms, all green. The worker side (`bowParkedThen`, `bowIdleWhileHidden` 0, `bowRanAfter` > 0, parks and resumes 1/1, `firstDt` 0) held in every red run |
| B108 | 58 | the CAMERA card's `TAKE A PICTURE`, `RECORD`, `ONE PERIOD`, `PLAN`; `loopEnabled` / `loopDisabled` read off the ONE PERIOD button | the RENDER card's `CAPTURE IMAGE`, `RENDER`, `PLACE ONE PERIOD`, `PLAN`; the exact plan is `__LW.render.plan()` with the label and message in `.sr-period-plan`; a refused plan makes `__LW.render.place()` return `null`, say the planner's label and message verbatim in the readout, and leave the TIMELINE's clip count where it was | **STALE** (C7b R3: PLACE ONE PERIOD is a plain trigger that refuses, not a button that goes down). Every planner clause (phase, density, one-energy, STURMIAN, the real picture and its restore) was green and is unchanged |
| B127 | 62 | the canvas label is read 300 ms after a change; at most FOUR live regions | the read waits 150 ms, asks one more frame (`__LW.schedule(1)`), waits 500 ms; the live regions are SIX, named, and none is written during 3 s of playback | **STALE** twice. (1) A paused sentence is written from a frame at most every 100 ms (`rack.js:938`), so a change inside that window leaves the old one standing: the same tick as B23 and the pause read below. Seen once by the predecessor, not by me; the pre-C7b export is green. (2) The live-region ceiling was a deterministic red on this tree: six seats (`DIV.m2hint`, `DIV.km-status`, `DIV.mir-banner`, `SPAN.mir-step-text` in the RAMP, and **`DIV.tl-status` and `SPAN.mir-step-text` (the snap stepper `tl-snap`) in the TIMELINE window**); the pre-C7b export has four. Both new ones are the kit's TIMELINE, written on a user act (a selection, a step); `liveBad` stays 0 and a MutationObserver over all six sees zero writes while the transport runs |
| B134 | 65 | the BPM chip's resume floors the beat to the note boundary just passed (`applied` true, `moved` = the fraction, phase restarts at 0) | the SHIPPED resume is exact: law `BPM`, grid 1, `applied` false, `moved` 0, the beat and the phase continue; the old clause is kept on the kit's legacy road (`__LW.mod.host.clock.setExactResume(false)` for one lap, put back in a `finally`) | **STALE by ruling R5** (`C7B-DESIGN.md` §1.2 and §6: installing the TIMELINE calls `clock.setExactResume(true)`, controller.js:26). The ANCHOR and TRIG rows and the bar-lock were green and are unchanged. Josh's wave-65 sentence ("hitting space bar in between a note simply jumps to the truncated note") no longer describes the shipped lab; that was R5 and B9 asks MIR for an option |

### 10c. FIX ROUND 1's four, confirmed on the merged tree

| Row | Fix | Boot suite on `b9e0c57` |
|---|---|---|
| B78 · the `slap` words | `31f4849` | **GREEN half**: the sweep finds 2 hits, both `BOW` (STATE's group and readout), the pre-existing part. B78 stays red for that and the missing IMPULSE seats |
| B111 · `phoneRack` stored | `acd5761` | **GREEN** |
| B144 · accent End stop 360 | `7c3da43` | **GREEN** |
| B139 · FROST STILL keeps the fill | `7bd1bf6` | **STILL RED in the full run.** GREEN alone (`.tmp/c-b139.txt`, a first-run REFRACTIVE card). B112 leaves the card style TINTED in the look store, so the full run measures TINTED + dark + DISCONNECTED: the held body goes `rgba(28,32,38,.58)` to `.84` (`.tmp/boot-1f.txt`, `ctx.play` against `ctx.stop`). The cause is the kit's `skin.css:512`: `body.frost:not(.frost-hold)[data-card="tinted"] { --card-opacity: var(--frost-opacity) }`, thin while it blurs and full during the hold. 0.4.0 satisfied the law because a tinted pane did not blur at all. FIX ROUND 1 measured refractive only. A probe that injects the one unlayered rule `body.frost.frost-hold[data-card="tinted"] { --card-opacity: var(--frost-opacity); }` keeps `.58` stopped and `.58` playing for tinted and moves nothing for refractive (`.tmp/p-b139.js`). Not applied (`lab/skin.css` is not this task's) |

### 10d. What is still red, and why

| Row | Class | Note |
|---|---|---|
| B70, B71 | pre-existing (v0.4.0-alpha too) | unchanged (§5): the transport's buttons are 45 × 34 on a phone and two routed knobs are under 44 px; this run's landscape sweep counts 49 failing hit-tests |
| B78 (BOW) | pre-existing | `BOW` labels and no IMPULSE seats in the STATE card |
| B139 (TINTED) | REAL REGRESSION of 0.5.0, the fix round's second half | §10c; one `lab/skin.css` line (candidate verified in the live page) |
| B149 (b) | MIR brief candidate (B149b) | a Tab starts the rack's 320 ms reflow animation (`tab.running` 5); the kit has no instant option |

### 10e. Found, not fixed

* A PAUSED canvas label (`#field` `aria-label`) can stay one step behind a change for as long as nothing schedules a frame: the badges tick
  writes it from a frame at most every 100 ms (`rack.js:938`). The test now asks for the frame; a screen-reader user who changes the view
  while paused and hears nothing new is the product's side of it.
* The TIMELINE window added two live regions to a document that capped them at four. Both are user-act writers (`editor.js:133` guards the
  status write with a compare), so the ceiling was raised to six and named, but a seventh must be argued for the same way.
* B84's 5 s costs the suite two seconds.

### 10f. Commands

```
python3 tools/gate/server.py <worktree> 8963 &                                       # pid in .tmp/server.pid, stopped by pid
LW_PORT=8963 GD_PORT=5433 node tests/legacy/boot.browser-test.mjs > .tmp/boot-2.txt  # about 7 min, alone on the rig
LW_PORT=8963 GD_PORT=5433 node .tmp/chunk.mjs @.tmp/spec-c.txt                       # B66 and B108
LW_PORT=8963 GD_PORT=5433 node .tmp/chunk.mjs @.tmp/spec-b121.txt                    # B127 (with its helpers)
LW_PORT=8963 GD_PORT=5433 node .tmp/chunk.mjs @.tmp/spec-b132.txt                    # B134 (with its helpers)
LW_PORT=8963 GD_PORT=5433 node .tmp/chunk.mjs 'm:/* ── B84 · THE BACKGROUNDED TAB~/* ── B85 ·'
LW_PORT=8963 GD_PORT=5433 node .tmp/probe.mjs .tmp/p-b139.js                         # the TINTED hold probe
bash test.sh node                                                                    # exit 0, 940 PASS, 0 red
```
The pre-C7b comparison tree was a `git archive f0d4566` export served on 8967 (read-only, from the predecessor's `.tmp/base-pre`).

## 11. 0.5.1 D10-F (2026-10-09): B70, B71 and B78 fixed

Sonnet 5.5, worktree `.claude/worktrees/agent-a2df55598db210f01`, from `27eb96a`. Write-up: `research/release-0.5.1/D10-F-BUILD.md`. Two product files
(`lab/skin.css`, `lab/rack.js`, three strings) and this suite changed.

| Run | verdicts | GREEN | RED | red rows |
|---|---|---|---|---|
| BEFORE · `27eb96a` (PLAN.md:47, the integrator's count; the full suite was not re-run on the cut; B70, B71, B78 re-measured red as chunks) | 152 | 148 | 4 | B70 B71 B78 B149 |
| AFTER · this tip, alone (`.tmp/boot-full.txt`) | 152 | 150 | 2 | B6 B149 |

* **B6** is the stray tags-tick timing red §9 warns of: the badge is read 200 ms after a mute and the tick had not landed. GREEN alone as a chunk straight after; unrelated to D10-F.
* **B149** is the kit's FLIP reorder (`tab.running` 5): the MIR brief candidate, unchanged.
* §5's account of B70 was a third of the truth. At `27eb96a` the portrait and the landscape walk each fail **49** hit-tests, not 46 or eight: the transport's seven `tbtn`
  (the tempo chip too), DOCK (34 × 34), SPECTRUM's six lane dials (43 wide), three MUTE buttons (42) and the BOX segment (37), SHADOW's toggle (32), RENDER's four triggers (40),
  CAMERA's two (40), SETTINGS' FOLLOW chip (18) and colour chip (26), OBSERVER's 20 segments (32), and `dev-power` / `dev-fold` (the badge row). The routed pass also failed `bandMin ≥ 7`
  (ten rows: PAN X, EXPOSURE, SOFTNESS, HUE, the three STATE rotors, RATE, and the two arc knobs the walk cannot see). RATE's 26 was the kit's route-depth dial stretched by
  `#transport .k { width: 58px }`.
* The three re-aims, each a comment at its site: the walk runs with the shipped STATUS TAGS off (`hitWalk()`; the baseline's badge row over ⏻ / ▾ is §5's own "exists only because the
  baseline turns the tags on"); the listener walk skips a control whose bare walk finds no turn target (`b.v < 2`: `observer.yaw` / `pitch`, the arc knobs, whose capture-phase
  `pointerdown` stops before the walk's listener); B78's trigger clause reads `RELEASE` (the trigger left in `5f6421e`, the BOW-feel redesign, and `a526bda` wrote the card's note
  around it) and its group clause reads `data-help-en` (native-ui.js shows a group's first clause; the kit's control-help keeps the whole text there). B78's words clause is untouched.
* Commands: the chunks for these rows are `m:const rect = (w, h) => new Promise~judge('B72 W-MOBILE` (B69 to B71) and `m:const nameT = await g.ev~const logoT = await g.ev` (B78).
