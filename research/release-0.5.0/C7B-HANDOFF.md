# C7b · THE FILM'S UI IS THE KIT'S RENDER CARD AND TIMELINE WINDOW — live hand-off (the C7b builder, Opus 5.5)

**State: PAUSED by the usage alarm (five_hour 94 %) inside step 3.  Step 3 is committed as a WIP commit (one gate red:
settings-probe 4/6).  Nothing merged into yan-c, pushed, tagged or deployed.**

| | |
|---|---|
| worktree | `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-ab12528fb3c1bb358` |
| branch | `worktree-agent-ab12528fb3c1bb358` (reset to `ae5add1`, the first builder's tip on `4555945`) |
| `f40733d` | step 1 · createFilm takes the card's road (the first builder) |
| `8b93ef8` | merge `yan-c` `011e6a5` (C6 + HANDOFF + two briefs); `lab/sw.js` regenerated |
| `9d8671b` | step 2 · the TIMELINE window on the one clock (all step-2 gates green) |
| the WIP commit after `44dda44` | step 3 · the RENDER card, ONE PERIOD as a span clip, the CAPTURE group out, `LW.thumbnail()`'s dead probe branch out (the integrator's item) — **WIP: settings-probe red** |
| servers | 8913 (tree, pid of `server.py … agent-ab12528fb3c1bb358 8913`) and 8917 (`.tmp/base2` = `git archive 7c7da54`) — stopped by pid at the pause |
| `lab/*.js` | 27,228 (`4555945`) · 27,309 (`f40733d`) · 27,596 (`8b93ef8`, C6 +287) · 27,657 (`9d8671b`) · **27,555 (step 3)** → C7b's own +40 (+25 generated sw.js rows) |

## Step 3 gates (on the WIP tree)

- THE LOCK: `860 values · 0/0 · page errors 0` and `1004 values · 0/0 · page errors 0`.
- `tests/timeline.browser-test.mjs` **14/14** (T0–T5, T9, T10; T6 card period = facade ONE PERIOD, every digest + MP4 bytes 683,782;
  T7 card STILL = facade RECORD, PNG = MP4 frames; T8 MOD ON; T11a RESUME after Escape = uninterrupted frames; T11b state change →
  RESUME refused + DISCARD STORED; T11c CANCEL + reload → RECOVER → one valid MP4).
- film-probe + `node tools/perf/film-compare.mjs .tmp/film-base.json .tmp/film-c3.json` **exit 0** (picture bytes identical; EXPORT
  FRAMES 25 pixel-identical; ONE PERIOD 180 digests + 953,793 B; RECORD 180 + 743,644 B; verify DETERMINISTIC).
- film-handover **4/4** (re-aimed at the card) · offer **16/16** · menubar **8/8** · frame-occlusion **7** · hit-probe-set 49 / 0 ·
  render-exact **40/40** · `bash test.sh node` exit 0 (wiring 220 reached) · pwa 327 files 6.45 MiB · gpu-recovery **10/10**
  (the thumbnail scene is one road now; a first run was timing-red at reload 2, green alone) · `new-project --check` 16117 B ·
  node new-project GREEN · keyboard-shortcuts PASS.
- **RED: `tools/settings-probe.mjs` 4 of 6** (boot and NEW green; WAVE DANCER, WATER, BENZENE, N₂ red: "reload DIFFERS").
  WATER/BENZENE/N₂: the blob's `closed` holds `render` before the reload and not after (from `[transport, render, orbit, …]` to
  `[transport, orbit, …]`). WAVE DANCER: a `modwin` diff (read the full line in `.tmp/s3-sprobe.txt`; it may be the probe's named
  modwin.modes exception plus the same `closed` change). Suspect: a demo's saved `layout` has no `render` card, and the open road
  (rk apply / `layoutExtras`) or the boot's applySettings treats an unlisted, late-registered card differently before and after a
  reload — the card is built and registered after `window.__LW` (rack.js, grep `filmCard = createFilmCard`), after the C3 register
  loop but before `applySettings()` and `rk.start()`.
- NOT RUN on step 3: new-project browser 8, history 44 (both green at step 2; step 3 touches serialize only through the card),
  the ms/s pair with the TIMELINE open.

## Exact next step

1. Restart the servers (`python3 tools/gate/server.py <worktree> 8913`; base `.tmp/base2` on 8917 if ms/s is wanted), run
   `LW_PORT=8913 GD_PORT=5383 node tools/settings-probe.mjs --out .tmp/sp.json` and read the WATER scene's B1/B2/B3 `closed` lists.
2. Fix the `closed` round trip for the late-registered `render` card (likely: register it in the C3 loop's position, or make its
   closed state come from the saved list the same way before and after a reload); keep R2 (closed on first run).
3. Re-run settings-probe (0 RED), new-project browser 8, history 44, THE LOCK ×2, and the timeline suite (≈ 7 min, run it in the
   background: one foreground call is capped at 600 s).
4. Amend the WIP commit message to `0.5.0 C7b · the RENDER card; ONE PERIOD is a span clip; the CAPTURE group leaves`, fill the
   STEP3_* cells in `research/release-0.5.0/C7B-BUILD.md` (already written: decisions 1–15, B1–B17, merge notes, the CLAUDE.md draft,
   the CHANGES line), then step 4: append `.tmp/wave208.md` to REPORT.md (fill GATES_LINE), commit, update this file.
