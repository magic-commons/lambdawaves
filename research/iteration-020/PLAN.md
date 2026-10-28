# ITERATION 020 — "019" LIST: BUGS · IMPROVEMENTS · THE BUFFER · NODES BEYOND (Claude Sos, integrator on `yan-c`; Josh 2026-10-27, evening)

## JOSH'S PROMPT (verbatim; his heading said "019", it is the fourth list of the day, so iteration 020 here)
> # 019
> ## BUGS
> - When hiding the informational via CSB, the animation seems to restart rapidly until it settles.
> - When 'map only' is pressed, it takes a second or two for the sticks to go away in wave window
> - Camera window layout is bugged. Make two rows if needed for that super crammed top row
> - Curves doesn't seem to have a delete button. If nodes is open, by default it should have nothing. If there is nothing, let there be a very faint text that says 'Hit '+' To Add Node.
> ## IMPROVEMENTS
> - I think ESP range in wave should be logarithmic. Let's make it 50 at max but it only get's larger faster towards the right of the knob.
> - When window is on auto-hide rack; the informationals that are adjusted to the left and right like the ESP strip shouldn't move with the hiding rack. Let the informational always assume the rack is always there. This is for recording purposes.
> - On CSB, add a new function with the rack window functions that are on the right side that is a toggle to 'expand all/minimize' all windows, an open node's
> - By default, nodes opens as a 'special' window rather than a rack window.
> - If keyboard, MIR options, other rack windows are open... let the CSB be always on top so that users can control it. The only exceptions are Timeline and Modulation as it should be switching up and down whereever the timeline and modulation is. not.
> - Play/Pause button, has the incorrect inset/outset animation sequence for a mouseover/click and hold/activate look. It must feel like a button. Inspect the CSS behavoir/animation of the chips
> - The add node's dropdown seems lackluster. It needs to be clear where the groups are and how they're spaced. Instead I just want a simple list with dividers without the explicity text like 'Table', 'Layer' and such. Perhaps create icons for it.
> ## EXPERIMENTAL
> - Could be in MIR options; a CPU buffer! For DAWs, increasing sample length (ms) can give more room for compute with the goal of making playback MUCH more smoother. Can we integrate a system of something similar for audio playback but with the compute of the 'play' of the field. The UI can be very similar to ASIO4ALL's latency compensation sliders.
> - The reason being is because whenever it presses play, it seems to play smoothly or want to play smoothly, however it seems to start over a millisecond sample repeatedly so it looks like the field is stuttering which is bad for screen recording.
> ## NODE FLESH OUT (research and plan out thoroughly before beginning)
> - Let's flesh out nodes even more. This is the first time we've had nodes here before and we should go further beyond. Let's research houdini/blender controls/functionality (not just more effects) to make nodes even more powerful and intuitive. Like features the makes  mini version, copacts, expand all, route... something (idk I've never used houdini and blender...this is all you Claude. I have no ideas and preferences so go willy-nilly)
> Ultrathink! I have the screenshots here [ASIO4ALL's Latency Compensation pane: In 0 samples · Out 0 samples sliders, Buffer Offset 4 ms; CAMERA's top row "PAN HOM HOME ● LOCK ○ FLIP ○ AUTO-ROTATE" clipped]

## THE MAP
`research/iteration-020/MAP.md` — every item at file:line (two Explore agents, HEAD 7e5d6db), the root causes, the seams, and the play-loop diagnosis. `NODES-FLESH-OUT.md` — the NODES research and design (read whole before chain X).

## THE LAWS OF 020 (to CLAUDE.md at the close)
- THE STAGE NEVER FOLLOWS THE FURNITURE: the stage text and the ESP bar are placed as if both racks and the bar were resting where they rest; a hidden or peeking rack moves nothing on the stage (a recording never sees the furniture move).
- ONE PRESS, ONE PLACE: a button that changes several stage rows applies them once; the stage text springs once.
- THE BAR IS ON TOP of every window but the two it dodges (TIMELINE, MODULATION); it goes under them only while it cannot dodge.
- A LOCKED CLOCK STEPS, A WALL CLOCK FLOWS: under PLAYBACK LOCK every present advances t by exactly rate/cadence, the march's jitter is pinned and AUTO SCALE holds — a missed frame slows time, never skips it; the film was always locked.
- NODES' laws: THE COLUMN IS THE CHAIN · A FLAG IS NOT A RECORD · THE KEYS ARE THE GROUND'S · A PREVIEW IS THE NODE'S OWN TRANSFER · THE DEFAULT GRAPH IS EMPTY (NODES-FLESH-OUT.md).

## CHAINS (one Opus builder each, one at a time, each on the merged tree; BASE in the CLOSED table)
### S — THE STAGE AND THE WINDOWS (items 1, 2, 3, 5, 6)
S1 ONE PRESS, ONE PLACE: the INFORMATIONAL button sets its rows in one batch and applies once (one `place()`); the ◧ hide no longer fights its own peek (the peek re-arms only after a `pointerleave` since the hide; `transport-peek` out of the words' `rackKey`). Verify both in Firefox: press each, count the stage text's moves (one).
S2 MAP ONLY, NOW: measure `field.queueMs`/`inFlight` in Firefox under ESP (the agent's inference: an uncapped GPU queue); give Firefox an in-flight cap too (a cheap fence — `onSubmittedWorkDone` counted with a ceiling of 2 under a heavy frame, or a 1 × 1 readback fence — the builder measures which keeps the fps); MAP ONLY also hides the skeleton's 2-D sticks (INFORMATIONAL › BALL AND STICK) — a map-only stage shows the map. Before/after latency numbers in the BUILD note.
S3 CAMERA IN TWO ROWS: PAN HOME · HOME on the first row, LOCK · FLIP · AUTO-ROTATE on the second (a second `.cam-row` after `.cam-verbs`); nothing clipped at rack width; a picture.
S4 ESP RANGE TO 50: max 5 → 50 (the knob is already logarithmic); fewer decimals above 1 (knob and bar); the first-run default 0.1 unchanged (THE LOCK untouched).
S5 THE STAGE NEVER FOLLOWS THE FURNITURE: the stage text and the ESP bar measure each rack's RESTING box (and the bar's) whatever `rack-hidden`/`rack-peek`/`transport-peek` say; those classes leave `rackKey`; a rack that is CLOSED (no open window) still frees its side as today. Picture: rack hidden vs shown, the words and the bar at the same pixels.

### T — THE CONTROL SURFACE (items 7, 9, 10)
T1 PLAY IS A BUTTON: PLAY takes the `.trig` sequence — rest raise → hover lift + wash → press sink (press relief + press face) → ON face + rim + glow, with the transition; the container stops doubling the relief; the kit's svg scale stays. Side by side with a chip in the BUILD note (a picture of each state is enough).
T2 FOLDS AND NODES: `app:folds` in the right group after `app:rack` — one toggling button, EXPAND ALL when any open window is folded, else MINIMIZE ALL (`rk.windows()` + `rk.fold(id, want)`), icon a plain SVG (chevrons up/down) in `lab/img/icons/`; both racks — and `app:nodes` (Josh: "Open Node's window"): a button that opens the NODES window (`LW.nodes.open()`; lit while it is open, a second press closes it), icon `lab/img/icons/nodes.svg` (a three-node chain); the right group grows to 9 seats (three rows of four with one gap, or `--csb-cols: 5` for two rows of five, the builder's pick for the bar's 674 px — say which in the BUILD note).
T3 THE BAR ON TOP: `#transport.mini` above `#floats` (chrome + 3) so the keyboard, MIR OPTIONS and any floating window never cover it; when `modDodge` leaves the bar overlapping TIMELINE or MODULATION (no free seat) a body class drops it under them for that time; menus and the pill still above the bar.

### L — PLAYBACK LOCK (the EXPERIMENTAL pair; MAP.md's diagnosis)
L1 THE LOCKED CLOCK: `clock.js` gains a locked mode (`advance()` → exactly `rate/hz` per present, no wall Δt); `rack.js`'s loop presents only on a `1/hz` accumulator tick (the modulation cap's idiom) and advances one step per present; while locked AUTO SCALE and the grid rung hold; the march's jitter seed is pinned (the film's way; THE LOCK's fixtures are paused presents and must not move — pin to the seed the first present has); the pause edge and scrub unchanged. Wall mode byte-identical to today.
L2 THE PANE: SETTINGS › FIELD QUALITY gains PLAYBACK — CLOCK WALL | LOCKED; CADENCE 30 · 60 · 120 · DISPLAY (shown as ms, ASIO's "Buffer Offset"); a LATENCY readout (ms between a knob and the picture = 1000/hz, ASIO's "In"); PREFERENCE (`docs/STATE-SCOPES.md` row; `shell/settings.js` save/apply); the governor and METERS readouts say LOCKED. No MIR OPTIONS group (the kit's SAMPLING is hidden by λWAVES; the λWAVES seat is FIELD QUALITY).
L3 THE PROOF (a diagnostic in `tools/perf/`, not a gate): a headed-Firefox probe logging per present `[now, t, Δt, presents, autoScale, canvas.width]` for 10 s of play, wall vs locked; the BUILD note prints the coefficient of variation of Δt, the count of Δt > 1.5 × median, the canvas reallocations and the presents/s, both modes. The look-ahead ring (K volumes) is NOT built: it helps only when the reconstruct misses the cadence (molecules, 128³); L3's numbers say whether it is ever needed (call 6).

### X — NODES BEYOND (items 4, 8, 11 + the flesh-out; NODES-FLESH-OUT.md is the brief)
X0 THE CLEAN SLATE: CURVES a node like any other (removable; at most one; id `curves`; `has()/setHas()` absent-safe); THE DEFAULT GRAPH IS EMPTY with the faint line "Hit + to add a node" (an existing record opens as saved; 018's one-node record still opens with CURVES); the + menu one list with icon dividers between classes, an icon + name + cost mark per item, HEAVY as today, a search line (Tab / Shift-A opens it focused; Enter adds the first match); the icon sprite `lab/img/nodes-icons.svg`; NODES opens as the FREE window from the FINDER, the WINDOW menu and the rack card's door; re-aim `tests/curves.browser-test.mjs` (add a CURVES node first). Split `lab/nodes-view.js` out of `nodes.js` here (the view: ground, cards, wires, menus) so X1–X4 land in the view file.
X1 THE GROUND: zoom (ctrl/⌘ + wheel, pinch; 0.5–2×), FIT (button + Home), selection (click, shift-click, shift-drag box, Ctrl-A, Escape), move a selection together, arrow nudge, Delete, Ctrl-D duplicate, M bypass, H collapse, Tab/Shift-A add, Ctrl-Z/Ctrl-Shift-Z over NODES' own 30-step ring (`lab/nodes-undo.js`); keys only with the ground focused, never reaching the kit's key table; the rack column never zooms.
X2 THE CARD: collapse (chevron; a collapsed card = bar + preview strip), COLLAPSE ALL / EXPAND ALL (ground head + menu), RENAME (double-click the title; shows on the bar and in the modulation target's label; ids never change), the PREVIEW strip on TABLE and MATRIX cards (grey + hue ramps through the node's own transfer, 128 samples, redrawn when its values move), the right-click menus (card: VIEW HERE · SOLO · BYPASS · COLLAPSE · DUPLICATE · RENAME · RESET · MOVE UP · MOVE DOWN · REMOVE; ground: ADD… · FIT · TIDY · COLLAPSE ALL/EXPAND ALL · BYPASS ALL), TIDY.
X3 THE FLAGS: VIEW HERE (the display flag — an eye per bar, one lit; the compiler takes `upTo`; the foot "viewing 3 of 6"), SOLO (this node alone), BYPASS ALL (the graph's master ×, key \; kept in the record as `off`); VIEW/SOLO are the view's, not the record's.
X4 FADE AND MASK on every non-LAYER node (a foot fold: FADE 0–100 % · MASK NONE/LIGHTS/DARKS/MIDS/CENTRE/EDGES · SOFT): FADE folds free for TABLE/MATRIX, one feComposite for a PRIMITIVE; a masked node becomes its own run (prim markup with result/in, the mask images cached by kind + soft — no kit change expected); the cost mark follows; FADE and SOFT are modulation targets.
Later rows (not this chain): a true DAG (MIX of branches, reroute dots, `setChain` with named results); LAYER masks; the governor's bypass of heavy nodes; RENDER bakes the graph; PROJECT scope for the graph.

## CALLS FOR JOSH (defaults stand unless he says)
1. (S1) "Hiding the informational via CSB": the INFORMATIONAL button or the ◧ rack toggle? Default: both are fixed.
2. (S2) If Firefox's in-flight cap costs frames at 64³ the cap applies only above a measured frame cost. Default: the builder's threshold, printed in the BUILD note.
3. (T2) The list's last words "an open node's" — Josh: "it's supposed to say 'Open Node's window'": a NODES button on the bar that opens the NODES window. ANSWERED.
4. (T3) When the bar cannot dodge TIMELINE/MODULATION it goes under them. Default: yes.
5. (L) PLAYBACK LOCK is OFF by default (WALL), CADENCE DISPLAY; Josh switches it on for a recording. Default: off. (Alternative: LOCKED while RECORD is armed.)
6. (L3) The look-ahead ring is not built until L3's numbers show the reconstruct missing the cadence. Default: not built.
7. (L1) The jitter seed is pinned under LOCKED only; pinning it always would end the boil in wall mode too (the paused picture is already frozen). Default: locked only; say "always" if the boil bothers you.
8. (X) FADE + MASK on every node instead of a wired DAG (NODES-FLESH-OUT.md THE ROUTE). Default: yes; the DAG stays a later row.
9. (X0) An existing reader's graph keeps its CURVES; only a first run is empty. Default: yes.
10. (X0) The node icons are the builder's plain SVGs in one sprite, for Gemini to redraw later as 018's. Default: yes.

## JOSH'S ANSWERS (2026-10-27, evening)
"Oh it's supposed to say 'Open Node's window'. defaultss for all" — call 3 answered as above; calls 1, 2, 4–10 at their defaults.
11. (S2) MAP ONLY: headless Firefox shows ≤ 150 ms; if it still lags, run `node tools/stage-probe.mjs queue` on your session (prints the backlog). Default: BALL AND STICK was the lag.
12. (S4) A project saved with ESP RANGE above 50 opens as stored (±80.0), not clamped. Default: as stored.
13. (S5) H (the whole interface out) still re-centres the words; the law covers hide/peek only. Default: as is.
14. (T2) EXPAND ALL unfolds every folded open window, SPECTRUM under a molecule too. Default: every window.
15. (T2) The right group is two rows of five with the empty tenth seat at the end. Default: as is.
16. (T1) PLAY's ON glow ring at the chips' strength. Default: as is.

## MERGE ORDER
S → T → L → X (each on the merged tree; the recipe: `git merge --no-ff --no-commit it020-<chain>` → `git checkout --ours lab/sw.js` → `node tests/pwa.test.mjs --write` → `node tools/rack-deps.mjs --classes --no-write` → `node tools/new-project.mjs --check` → `node tests/mir-manifest.test.mjs` → `./test.sh node` → commit → CLOSED row → handoff line).

## CLOSED
| chain | BASE | commit | note |
|---|---|---|---|
| S | d9210a2 | 0fc2e3e | S1–S5 (S-BUILD.md; no kit edit; node suite 246 PASS; hide-reveal/stage-text/routed-knob/camera-shift green; LOCK 843/0; MAP ONLY lag was BALL AND STICK's 2-D canvas ignoring it + Firefox inFlight cap 2 under heavy frames) |
| T | c7bd626 | 1125c89 | T1–T3 (T-BUILD.md; no kit edit; node suite green; window-switching/hide-reveal/keyboard-window/menubar/stage-text green; bar 674 px both modes, right group two rows of five) |
| L | 1125c89 | | |
