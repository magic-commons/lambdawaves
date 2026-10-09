# C6b · HAND-OFF (the C6b builder, Opus 5.5) — after commit 3 of 4

| | |
|---|---|
| worktree | `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a47a6c9aeef569dc6` |
| branch | `worktree-agent-a47a6c9aeef569dc6`, reset to `011e6a5` (`yan-c` + BRIEF-C6B.md) |
| base copy | `.tmp/base` = `git archive 011e6a5 lab tools tests`, served on 8927 / GD 5397 |
| servers | 8923 (this tree) and 8927 (base), both mine, stopped by pid at the end |
| `e7256ae` | commit 1 · the session over the one part |
| `ba6f279` | commit 2 · the opener, the covers and the notice facade |
| `1989f3d` | **commit 3 · the banner, the veil and the wake lock** (+ the legacy re-aim) — the final code tip |

## Tests on `1989f3d` (8923 / 5393, one browser at a time, `wait-gpu` before each)

- **THE LOCK**: `--check --query gastab=0` → **860 · 0/0**; the same plus `--fixture research/release-0.4.0/measure/digest-lock-s4a.json`
  → **1004 · 0/0** (its first run, beside another browser, read `quarkonium@128` unrepeatable within the run — the P5 one-ulp fault;
  green alone).
- `offer` 16/16 · `frame-occlusion` 7/7 · `menubar` 8 · `take-in-bugs` 4/4 · `opener` 7/7 · `access` 11 · node 79 suites, 0 red.
- `gpu-recovery` **8/11**: the suite stops at its thumbnail probe on the base too — C7 removed `capture.probe`, and
  `__LW.thumbnail()` (FOLDERS' pictures) and the suite still call it (`c.probe is not a function`, base and tree). Its last scene
  (THE GPU RECOVERY, now on `#mir-banner`, `⛔ the GPU device was lost`, `role="alert"`) is green run alone (`.tmp/gpu-recovery-scene.mjs`).
- `legacy/boot`: **112 verdicts identical to the base** (B1–B96); both stop at wave 56's `?sw=1` reload ("Render did not settle:
  animation frames stopped"). A copy stepping over that page is running to exercise the re-aimed B103/B109/B110/B112/B125.
- On commit 2: `first-run` 12, `stage-text` 4/4, `film-handover` 4/4, `hit-probe-set` 49 · 0 reached. On commit 1: `history` 44,
  `new-project` 8 + `--check`, `settings-probe` 0 RED, `serialize-bytes` 11/11.
- `cat lab/*.js | wc -l`: 27,515 → 27,530 → 27,554 → **27,553**.

## Blockers

None of mine. For the integrator: `__LW.thumbnail()` throws on `011e6a5` (C7's `capture.probe` removal; C7b's or the integrator's).

## Exact next step

Commit 4 · lines, wave 209, C6B-BUILD.md (+ the draft CLAUDE.md paragraph and the CHANGES line in it), this file; stop the servers.
