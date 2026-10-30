# 029 M2 · M3 — THE KIT DOORS · BUILD (Opus, 2026-10-30)

Tree: yan-c `c2fb743c` (M0, M1 and M5 closed) plus this branch. The kit moved from MIR 1.5.6-alpha.17 to **1.5.6-alpha.20** on the
clone road (docs/laws/kit.md): one alpha per door, built in a clone of `.tmp/it021/kit.bundle` (kit-1.5.5 @ c13df7d), adopted back once
at .20 with `adopt.mjs`. The only app edit outside the adopt set is `lab/look.js` `paintInk` (alpha.20's door, M1's two guards kept).
No stored key, window id, target id or CSS hook moved; `lab/fonts/**` and the `app` literal are untouched; `lab/sw.js` was rewritten
by `pwa.test --write` only.

## THE THREE DOORS (the clone's commits on kit-1.5.5)

| alpha | commit | door | files |
|---|---|---|---|
| **1.5.6-alpha.18** · A TEXT WRITE KEEPS ITS NODE (M2) | `c6bb10b` | `core/perf.js setText`: an element holding exactly one text node keeps it; the new value goes to that node's `data`. That makes one characterData record, where `textContent =` made a childList record (the node replaced). An identical text still writes nothing. An empty text, or an element without a single text node, takes `textContent` as before. | `mir/core/perf.js`, `tests/core-perf.node.mjs` (the row: two writes give `characterData · characterData` and no childList; the node is the same object) |
| **1.5.6-alpha.19** · THE MODULATION WINDOW WRITES ONLY WHAT CHANGED (M3) | `d3532be` | `modulation/window.js` `paint` · `paintAudio` · `paintAudioMeter` · `paintMinTrace`. Texts go through `setText`, attributes through `setAttr` (the window's own `attr` now routes there), and custom properties through `setVar`. A composed style (cssText, height, dash) is compared with the string the paint last wrote to that element (a WeakMap). The browser reads such a style back in its own spelling, so a read-back compare could never match. A band's hint is written only when its values move. `classList.toggle(name, force)` already writes nothing on no change. | `mir/modulation/window.js`, `mir/locales/en.unreached.json` (line numbers re-extracted) |
| **1.5.6-alpha.20** · THE STAGE RE-INKS ONE MARK (M1's FOR-MIR line) | `27d4f1e` | `accent.paintInk()` on `createAccent`'s return: the header λ's half of `paintMarks` alone. It writes `markInk(0, stageGround())` through `gamut` to `#title .lam`, with no square, no notebook λ and no turn sheet. `paintMarks` now begins with it, so the same ink is asked once rather than once per λ. | `mir/shell/accent.js`, `docs/API.md`, `tests/parity5.browser.mjs` (paintInk inks the λ as paintMarks does and paints no square) |

Each commit bumps `package.json`, `mir/version.js` and `mir/tokens.json` `kit`, and carries one CHANGELOG entry naming its files and
"λWAVES 029 M<n>" (the alpha.17 recipe).

**One trap, recorded.** The kit's i18n extractor (`tools/i18n-extract.mjs`) treats `hintTo(` (the import alias of `hint`) as a choke
point. A wrapper with a new name would have dropped two hint sentences from `en.json`. So the window keeps calling `hintTo(…)` and
guards it with `hintStale(node, vars)`, which compares `data-t-hvars`. The catalogue is unchanged: 1,507 strings.

**What M2 does not touch.** The dock's span observer still watches `childList + subtree`, because a window entering or leaving a rack
is membership. M2 removes its wake on every value without changing what it watches (M0's optional companion was not needed).
λWAVES' two observers that want text changes already ask for `characterData` (`lab/film-card.js:108`, `lab/windows/material.js:296`).

## ADOPT

`node .tmp/kit/tools/adopt.mjs .` → **adopted MIR 1.5.6-alpha.20 (27d4f1ea0667): 0 added, 6 updated, 0 removed, 260 unchanged**:
`core/perf.js`, `locales/en.unreached.json`, `modulation/window.js`, `shell/accent.js`, `tokens.json`, `version.js`.
- `MIR-MANIFEST.json` sha-256 `3f1940761b40e84cf9d6afc19f5166a5469ae3d5d501cf7710b15f26101d78bf`, pinned in
  `tests/mir-manifest.test.mjs` ACCEPTED: the two-file edit.
- `node tests/mir-manifest.test.mjs`: PASS, all 266 adopted files match.
- `node .tmp/kit/tools/adopt.mjs . --check`: **in step with MIR 1.5.6-alpha.20**. It said "in step with MIR 1.5.6-alpha.17" before
  any change.
- `lab/look.js`: `paintInk()` keeps the batch guard and the wheel guard, then makes one call, `accent.paintInk()`.

## THE NUMBERS (the same probe, the same scenes, before → after)

`nice -n 10 node tools/perf/mod-profile.mjs --scenes b,c,e --audio <optimization worktree>/media/star.mp3`: headless Firefox,
1920 × 1080, 30 s a scene. The probe served the tree on 9801 / GD 5801, and its pid was stopped at the end.
- BEFORE = this branch with lab/ at alpha.17. AFTER = alpha.20 adopted plus look.js.
- Raw records: `.tmp/mod-profile/before.json` and `after.json` (not committed).
- **The one tool change:** the probe's own MutationObserver now also counts records **by type** (`mutationTypes` in the summary:
  childList · characterData · attributes per second). That split is M2's direct proof.

| scene | tick p50 / p95 ms | loop JS p50 / p95 ms | JS ms/s | window paint ms/s · p50 / p95 ms | DOM mutations/s · per frame p50 | records/s by type |
|---|---|---|---|---|---|---|
| **b** WAVE DANCER, window open | 0.64 / 4.38 → 0.62 / 4.34 | **3.08 / 6.24 → 2.10 / 5.52** | **34.7 → 27.7** | **10.8 → 5.8** · 1.14 / 1.52 → 0.64 / 0.86 | **1,680 → 239** · 174 → 19 | childList 355 → **0** · attributes 1,332 → 157 · characterData 0 → 84 |
| **c** b + AUDIO live (STAR drop) | **1.52 / 5.26 → 1.44 / 5.06** | 3.92 / 7.08 → 3.12 / 6.38 | **42.6 → 35.7** | **11.0 → 6.9** · 1.18 / 1.56 → 0.72 / 1.02 | **1,825 → 706** · 189 → 69 | childList 385 → **1** · attributes 1,448 → 567 · characterData 0 → 142 |
| **e** stress (59 routes, 3 nodes, CURVES) | 18.50 / 21.60 → 17.30 / 20.52 | 39.16 / 43.44 → 37.28 / 41.78 | 86.4 → 81.6 | 2.6 → 1.6 · 1.10 / 1.44 → 0.66 / 1.12 | 2,349 → 1,936 · 1,106 → 943 | childList 232 → 33 · attributes 2,145 → 1,829 · characterData 0 → 111 |

**By region and by observer (per second):**
- The modulation window's records:
  - b 1,614 → **168**
  - c 1,696 → **572**: what is left is real change, the live meters and values.
  - e 548 → 165
- The dock span's `book`: c 284 → **62** calls, b 120 → 49. This is the observer whose `edgeOf` M0 found forcing a style and layout read
  every frame on Josh's screen (39 ms/s inclusive in Chromium).
- control-help's observer:
  - b **564 → 5** calls. The window rewrote every band's hint each paint with the same values: three attribute records, then
    control-help's adopt, then the title's removal.
  - c 567 → 566. With the microphone live, each band hint's values (`{out}% output · {db} dB input`) move every paint. That write is a real
    change; see "left".
- stage-words' furniture observer (`rackKey`): c 284 → 62 calls.

What the table says:
- **M2 is the childList column.** It goes to zero, or one, in b and c: no knob value or window text replaces a node any more.
- **M3 is the window's column.** Its paint halves (c 11.0 → 6.9 ms/s, b 10.8 → 5.8), and its records fall 10× in b and 3× in c.
- The tick moves little (c 1.52 → 1.44 ms p50). M1 already took the tick's big share. What M2 and M3 remove is what the writes woke
  after the tick: observers, a forced layout, and the browser's style and paint work on dirtied nodes.
- Headless Firefox's frame rate is its software compositor's (b 9.4 → 9.5, c 9.4 → 9.4 fps), as M0 § 1 says. It is not the number.
- Josh's 120 Hz screen was **not** re-traced. That is M4, which needs Josh's yes. M0's offender 3, the dock's `edgeOf` at 39 ms/s, is a
  Chromium number. Here its trigger fell 284 → 62 calls/s.

**The look is byte-identical.** `.tmp/scripts/winshot.mjs` (not committed) opens WAVE DANCER with the window open on this tree's server
(9833 / GD 5833), paused, seeks 0.5 → 1.0 → 1.0, and captures the window's `outerHTML` and the whole page's screenshot.
- Two BEFORE runs agreed with each other, so the capture is deterministic.
- AFTER equals BEFORE: **DOM `66a3da12bae47c7e` (88,303 bytes) · screenshot `537da9ffbd12ccb2`**, before and after.
- The kit's meter counted 1,311 writes and 3,492 skipped after, against 663 and 1,026 before. More writes route through the helpers
  now, and most of them are skipped.

## THE GATES

- `node tests/pwa.test.mjs --write && ./test.sh node`: **EXIT 0** (255 PASS lines; mir-manifest, state-scopes and hints-census inside).
- **THE LOCK** on this tree's own server (`tools/gate/server.py <tree> 9833`, GD 5833, pid 12418, stopped at the end):
  - `--check --query gastab=0`: **843 values · 0 readback · 0 record-byte differences**, unrepeatable none, page errors 0.
  - `--check --query gastab=0 --fixture research/release-0.4.0/measure/digest-lock-s4a.json`: **987 · 0 · 0**, unrepeatable none.
  - Never re-baked; no leaf moved. My first fixture run left out `--query gastab=0` and read 12 `states.gas.*` differences. That was the
    wrong command, not the tree: the fixture is recorded with the gas table off, as CLAUDE.md's "the same with --fixture" means. The
    right command reads 0.
- **Browser, one at a time on 9833:**
  - `routed-knob`: GREEN, 0 failing of 7
  - `curves`: GREEN
  - `lfo-tension`: PASS
  - `keyboard-window`: GREEN
  - `menubar`: GREEN
  - `official-defaults-palette`: PASS. Its M1 row (the header λ equals the kit's full paintMarks, and squares and the notebook λ are
    unchanged) now runs through the door.
  - `window-switching`: GREEN
  - `render-regressions`: PASS (3 of 3)
  - `node tools/x-probe.mjs x4`: CURVES **`identical: true`**, 5,411 bytes
- **The kit's own suite in the clone:**
  - `MIR_SKIP_BROWSER=1 npm test`: **82/82** after every door.
  - Kit browser files run in headless Chromium:
    - `core` 39/39
    - `modwindow` 32/32
    - `modulation-stack` 10/10
    - `window` 44/44
    - `audio` 40/40
    - `kit-paint` 24/24
    - `controls` 62/62
    - `parity5` 8/9. The one red, "FROST: a fresh store is TEXT LIGHT", is red at alpha.17 too (7/8 on c13df7d). It is alpha.8's
      FROST TEXT AUTO, and the test was never re-aimed. The new paintInk row passes.
  - The whole `npm test` (node and headless Chromium): **142/146**. All four reds are the baseline's or a launch flake:
    - `parity5`: as above, red at alpha.17.
    - `render` 64/65 ("a press at its centre starts nothing"): red at alpha.17 too. 025 A-BUILD found it red at alpha.11 (alpha.8's
      disabled-control hint law).
    - `widgets` 46/47 ("fader: disabled does not reset on a double-click"): red at alpha.17 too, the same line.
    - `rack`: Chromium did not open its DevTools port. Re-run alone, it passes 24/24.
- `node tools/rack-deps.mjs --classes --no-write`: **HOLDS** (bare cross-scope writes 0; persist 24 of 25). No import changed (look.js
  calls a member of the accent it already holds), so the dependency-cruiser count was not re-run.

## THE BUNDLE (for Josh)

`/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/optimization-2026-09-24/.tmp/it029/kit.bundle`
- sha-256 `e84615081a0eddefaba3204a751cd7a9dabf7c165bb92b40a6e829fba529b464`
- `git bundle verify`: a complete history
- heads: kit-1.5.5 @ `27d4f1e` (alpha.20), with alpha.17's c13df7d and the tag `v1.5.5` beneath

    git -C ~/Documents/MIR fetch /home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/optimization-2026-09-24/.tmp/it029/kit.bundle kit-1.5.5:kit-1.5.5-029

`docs/FOR-MIR.md` § 029 (2026-10-30) states alpha.18–.20 as DONE and closes M1's `accent.paintInk()` line.

## WHAT WAS LEFT, AND WHY

- **The live AUDIO band hints.** While the microphone is live, each band's hint carries its moving values, so its title is rewritten every
  paint and control-help adopts it: about 560 callbacks a second in scene c. A hint that reads its values when it opens would remove them.
  That changes how the hint behaves, so it is a FOR-MIR line (open), not a door taken here.
- **The headed re-trace on Josh's 120 Hz screen**: M4, Josh's yes.
- **For the close (the integrator):**
  - CLAUDE.md's kit sentence and docs/laws/kit.md's "The kit reads 1.5.6-alpha.17" become alpha.20, with a "THE DOORS OF 029" line:
    alpha.18 setText keeps its node, alpha.19 the modulation window writes only what changed, alpha.20 `accent.paintInk()`.
  - This builder did not edit CLAUDE.md or the laws.
