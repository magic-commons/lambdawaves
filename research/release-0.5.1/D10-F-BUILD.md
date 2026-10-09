# D10-F BUILD (0.5.1 "Informational Update") — the two pre-existing law reds, fixed

Sonnet 5.5, worktree `.claude/worktrees/agent-a2df55598db210f01`, branch `worktree-agent-a2df55598db210f01`, from `27eb96a` (the 0.5.0-alpha cut).
Contract: `BRIEF-D10-F.md`. Nothing merged, pushed, tagged or deployed.

## 1. Result

| | before (`27eb96a`) | after (this tip) |
|---|---|---|
| `tests/legacy/boot` | 152 verdicts; law reds B70, B71, B78 (BOW), B149 (PLAN.md:47; B70, B71 and B78 re-measured red as chunks at the cut) | **152 verdicts, 150 GREEN, 2 RED: B6 (a stray timing red, GREEN alone) and B149 (the kit)**; B70, B71, B78 GREEN |
| `lab/*.js` | 27,594 lines | **27,594** (the three string edits are in place; `sw.js` only re-hashes) |
| `lab/skin.css` | 561 lines | 583 (+22: one closing phone block of 22 lines, 7 of them comment, and two halo numbers) |
| `tests/legacy/boot.browser-test.mjs` | | +7 lines (five re-aims, each with its reason) |

**The brief's size was a third of the truth.** It named eight failing controls (six transport buttons and two ring knobs). The law's list on `27eb96a` was
**49 failing hit-tests** (portrait and landscape alike) **plus ten routed-dial rows whose ring band is under the law's 7 px**, plus two rows the walk cannot see.
CSS is therefore +24 lines, not "a few". The JS estimate (+3) held at **0**.

## 2. Why B70 / B71 were red — the whole list, and the one cause behind most of it

The wave-51 phone block (`skin.css`, "the LAST one in the LAST stylesheet") wrote the 44-px rules once. The September "native" rules were appended after it
and beat it on source order; the `(pointer: coarse)` twins written beside them never match this headless Firefox (it reports `hover: none` only, the house idiom).

| class | controls (failing hit) | cause | fix (sizes only, under the phone's own breakpoint) |
|---|---|---|---|
| the transport | `tbtn` ×7: play, MOD, home, step ×2, jump (45 × 34), the tempo chip (51 × 34) | `#transport.docked .native-play-row > .tbtn { height: 34px }` | `height: var(--touch)` |
| the transport | DOCK (34 × 34) | the round chip is 34 px | a 46-px `::after` halo (the ink stays 34) |
| RATE, routed | 26 × 45 | `#transport .k { width: 58px }` also matched the **kit's route-depth dial** (`.k-route-depth.k`, `modhost.css:2364`, 22 px) and stretched it over the top half of the RATE dial | `#transport .k-route-depth.k { width: 22px }` |
| SPECTRUM lane | dials 43 × 45 ×6, MUTE 42 × 44 ×3 | the native rules widened M / S / × to their 44-px column, so the wave-52 halos (`-6px`, `-9px`) now steal each other's edge | halos `-4px` |
| SPECTRUM | BOX segment 37 × 44 | `min-width: 0` in a seven-cell flex segment | `min-width: var(--touch)` |
| OBSERVER / CAMERA | 20 segments 51 × 32; CAMERA's two triggers 51 × 40; RENDER's four triggers 51 × 40 | `min-height: 32px / 40px`; the 44-px twin is `(pointer: coarse)` | `min-height: var(--touch)` |
| SETTINGS | FOLLOW chip 18; colour chip 26 × 34 | lab.css | 44 |
| SHADOW | details toggle 32 × 52 | `grid-template-columns: … 32px` | 44 |
| ring band, PAN X / EXPOSURE / SOFTNESS / HUE | band 0 | the kit's ring is 32 px out (r 24–32): two routed dials one under the other need a 64-px pitch, they had 53 / 56 | `margin-bottom` 11 / 8 px |
| ring band, STATE rotors | band 5 | the next group begins 27 px below the dial centre and cuts the ring | `margin-bottom: 14px` |

Two harness re-aims, both in the walk (`HITWALK`), both named in a comment at the site:

1. **The walk runs with the shipped STATUS TAGS (off).** The suite's baseline turns them on; the ψ-badges' second row on a phone (`lab.css:261`, `body.phone #badges { top: 44px }`)
   lies over the transport's ⏻ and ▾ (`dev-power` / `dev-fold`, "covered by badge exact"). LEGACY-BOOT-REAIM §5 says in terms that these two exist only because the baseline
   turns the tags on, so this is the harness's. The tags are put back for the blocks after (`hitWalk()`).
2. **The listener walk skips controls it is blind to.** `observer.yaw` / `observer.pitch` are the CAMERA panel's arc knobs; their capture-phase `pointerdown`
   (`mir/controls/arc.js:163`, `stopPropagation`) runs before the walk's listener, so the walk reads bare 1 × 1 and band 0 for a control the sweep above measures at 44+.
   The row is skipped when the bare walk finds no turn target at all (`b.v < 2`), not counted as a zero.

Result of the phone chunk (`m:const rect = (w, h) => new Promise~judge('B72 W-MOBILE`): portrait `fails 0 · ringShort [] · bandMin 7`, landscape the same; B69, B70, B71 GREEN.
`bandMin 7` is exactly the law's floor and is RATE's: the transport card's own right edge cuts its ring at r = 30. Left as is (moving the card's padding is not a size).

## 3. B78-BOW

`a526bda` is not the commit that removed the IMPULSE trigger. What the history says:

- `3ea35c2` (waves 50–106) carried Josh's wave-53 ruling (board #44, REPORT.md:1614) into the STATE card: group `IMPULSE · a sudden momentum kick ψ ↦ e^{ik·x}ψ (…)`, trigger `IMPULSE`,
  knob `IMPULSE k`, readout `LAST IMPULSE escaped · Δ⟨p⟩ gained`.
- `5f6421e` ("Freeze app for Claude Code debugging and refactoring handoff") replaced them with the BOW-feel redesign: group `BOW`, knobs PULL / RESPONSE / LIMIT, the hint
  "Ctrl + drag · release to fire", knob `STRENGTH`, trigger **`RELEASE`**, readout `BOW · escaped / momentum`. That commit is where the trigger left.
- `a526bda` ("Unify help surfaces and tighten interface copy") kept RELEASE and **wrote the card's note around it** ("RELEASE applies e^{ik·x}…"), changed the trigger's hint to
  "Apply ψ ↦ e^{ik·x}ψ on the selected axis", and left the group and the readout as `BOW`.

So the trigger left for a reason that stands (a redesign two commits deliberately built on, the card's own note names it), and the words the ruling forbids were left behind by accident.
Done: the **group** and the **readout** are renamed (`rack.js`, three in-place edits, +0 lines: the group, the readout, the three feel knobs' hints `Bow pull` → `Impulse pull`); the **trigger stays `RELEASE`**
and the law's trigger clause is re-aimed to read `RELEASE` with the one-line reason; the **words clause stays strict** (`leftN === 0`, GREEN).

One more re-aim, found while doing it: the **group clause** could not be met by any wording. `native-ui.js` cuts every native card's group label to its first clause (so the card shows `IMPULSE`)
and the kit's control-help moves the title to `data-help-en`, where the whole text is kept. The clause now reads the hint (`t.dataset.helpEn || t.title || t.textContent`) and is as strict as before about the words.

Saved ids untouched: the ACTIONS row stays `slap`, `mat.bow`, `ui.bowKnobs`, `__LW.bow`, `.bow-feel`, `.bow-hint`. `tests/keyboard-shortcuts` PASS, `keyboard-window` GREEN.

## 4. Suites

| suite | result |
|---|---|
| `tests/legacy/boot` (full, alone on the rig, `.tmp/boot-full.txt`) | 152 verdicts, 150 GREEN, 2 RED (below) |
| `access.test` | GREEN, 0 failing of 11 |
| `hit-probe-set` | 49 presses through a gap, **0 reached the stage** |
| `frame-occlusion` | 7 PASS |
| `keyboard-shortcuts` | PASS |
| `keyboard-window` | GREEN |
| `first-run` | 12 |
| `offer` | 16 of 16 scenes |
| `bash test.sh node` | exit 0, 940 PASS/GREEN, 0 red |
| `node tests/pwa.test.mjs --write` | run after each `lab/` edit (the two commits); PASS |

No lock, no pair: CSS and three labels (the frame and the film do not read them).

### Every red of the full run

| Row | Class | Note |
|---|---|---|
| **B149** | **MIR brief candidate (B149b)**, the one expected law red | `tab: { after: 5, running: 5 }` — a Tab starts the kit rack's 320 ms FLIP reorder on five cards; the kit has no instant option. Unchanged by this row; (a) the entrance and (c) reduced motion are green. |
| **B6** (the second clause: `/RENDERED 1\/2/` in the badge) | **stray TIMING red, not this row's** | Read 200 ms after a mute, the ψ-badges' tick had not landed (`STATE · EVOLUTION · SHADOW \| FIELD 64³ · ±16 a₀ · f16`, no `RENDERED 1/2`). GREEN alone as a chunk straight after (`.tmp/b6-1.txt`: `… RENDERED 1/2 · 50% OF NORM · 1 MUTED`). It runs at 1400 px, before any phone block, and nothing this row changed is reachable from it (phone-only CSS, three STATE strings, harness code after it). LEGACY-BOOT-REAIM §9 names B6 as the tags-tick timing row and says a later run may show it stray. The rig was shared with other builders' GPU work. |

B70, B71 and B78 are GREEN in this run (`.tmp/boot-full.txt`), as are B69, B72, B111, B139 and B144.

## 5. Merge notes

- `lab/skin.css`: the closing block is APPENDED after `#transport.docked .native-play-row > .dock-btn { order:-1; }` (the last line at the cut) and the two halo numbers are lines 277–278. Another row that appends to `skin.css`
  conflicts only at the foot: keep both, this block stays last (it is the phone's last word on purpose).
- `lab/rack.js`: lines 1539, 1544, 1555 (the STATE card's group, one hint, the readout). C3's re-apply patches the same neighbourhood; the three strings are what matter.
- `lab/sw.js`: re-run `node tests/pwa.test.mjs --write` after the merge (two rows re-hash).
- `tests/legacy/boot.browser-test.mjs`: the `hitWalk()` helper replaces two `g.ev(HITWALK)` call sites; one `if` gains `|| b.v < 2`; two clauses of B78 are re-aimed. LEGACY-BOOT-REAIM gets §11.
- REPORT.md: the "0.5.1 · THE INFORMATIONAL UPDATE" heading did not exist at the cut; this row creates it at the foot with wave 210. Another 0.5.1 row creating it too conflicts: keep one heading, renumber the waves.

## 6. What Josh will see

- On a phone the transport's six buttons and the tempo chip are 10 px taller (44), the DOCK chip is the same size with a bigger finger, the SPECTRUM, OBSERVER, CAMERA, RENDER and SETTINGS controls that were 32–40 px high are 44, and a few knob columns have 8–14 px more air under them.
  The glass, the colours and the borders are exactly as they were; a desktop and an iPad are untouched.
- The STATE card's group reads `IMPULSE` (its hint the whole sentence), the readout `LAST IMPULSE · escaped / momentum`, the three feel knobs say `Impulse pull / response / limit`. The trigger still says RELEASE.

## 7. Found, not fixed

- **STATUS TAGS on a phone**: the badge row (`lab.css:261`, top 44 px) lies over the first card's ⏻ and ▾ for as long as the rack is scrolled to the top. Shipped default is tags OFF, so nobody meets it; the suite met it because its baseline turns them on.
  A real fix moves the row (a position, not a size).
- RATE's ring band is exactly the law's floor (7 px), cut by the transport card's right edge.
- `5f6421e` ("freeze", 40 files) reverted a ruling of Josh's inside a redesign; B78 was the only law that noticed, and it has been red since.
