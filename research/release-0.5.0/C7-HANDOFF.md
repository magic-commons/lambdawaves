# C7 THE FILM — live hand-off (updated after every commit)

- worktree `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a46f384b4af43f3cc`, branch `worktree-agent-a46f384b4af43f3cc`, base `7044f37` (sos-s0 tip)
- ports 8813/5283 (this tree); 8817/5287 for the base copy (`git archive 2171df3` → `.tmp/base`)
- `lab/*.js` before: 36,288 (at `7044f37` and after the adopt)
- resumed 2026-10-08 20:50 CDT after the usage pause

## State

| step | commit | lock |
|---|---|---|
| 1 the bare adopt (alpha.24, `adopt.mjs --line 1.5`) | `0327937` | — |
| 2 the lock on the adopted tree | `2171df3` | 1004 GREEN (58 s, 0/0) · 1148 GREEN (59 s, 0/0) |
| 3 the recorder wired beside the app's road (WIP) | `32f0f2f` | — |
| 3b EXPORT FRAMES' AbortError fixed (a kept result's OPFS files were discarded under it) | `4568463` | 1004 GREEN (59 s, 0/0) · 1148 GREEN (65 s, 0/0) |
| 4 the old capture road deleted (capture.js 1,188 → 789; picture byte-identical, ff9ca6bf) | (this commit) | 1004 GREEN (59 s, 0/0) · 1148 GREEN (61 s, 0/0) |
| 5 render-exact's old driver deleted (1,233 → 840) + the re-aimed test (37/37) + export3d on the kit's StoredZip | (this commit) | 1004 GREEN (58 s, 0/0) · 1148 GREEN (58 s, 0/0) |
| 6 the base-copy pixel lock of EXPORT FRAMES (base `2171df3` on 8817 vs `42438c6` on 8813, `tools/perf/film-probe.mjs` + `film-compare.mjs`) | (this commit) | 25/25 EXPORT FRAMES frames decode to identical pixels, identical times; TAKE A PICTURE byte-identical (97,866 B, ff9ca6bf) |
| 7 REPORT wave 199, C7-BUILD.md, BRIEF-C7-VERIFY.md | | |

Lock commands (alone on the GPU, load < 4, 4 s apart):
- 1004: `LW_PORT=8813 GD_PORT=5283 node tools/perf/digest-lock.mjs --check --query gastab=0`
- 1148: the same `--fixture research/release-0.4.0/measure/digest-lock-s4a.json`
- the 588 is the default fixture at `--grids 96`, a subset of the 1004. The lock reads `field.readPixels` / `linePixels` / `fieldDigest` only.

Node gate (`node .tmp/node-gate.mjs`, one suite at a time): adopted tree 85 suites / 4 reds; at `4568463` the same 4 — all C0's cascade:
`mir-manifest` (alpha.24 not in ACCEPTED) · `new-project` (OUT OF STEP) · `wiring` (unreached kit files) · `pwa` (absolute URL in `lab/mir/shell/gui.js`).

Film produced at `4568463` (`.tmp/film-probe.mjs`, Firefox 157 headless, canvas 1400×814):
PNG 97,866 B (byte-identical twice) · ONE PERIOD MP4 953,575 B, 180 f, decodes 6.0 s · RECORD MP4 744,558 B, 180 f, decodes 6.0 s ·
EXPORT FRAMES 25 PNG + recording.json, 3,248,579 B; frame 0's pixels equal the picture's.

## Next
Step 7: REPORT.md wave 199 under `## 2026-10-08 · 0.5.0 C — THE ADOPTION`, `C7-BUILD.md`, `BRIEF-C7-VERIFY.md`.
Browser at step 5: export3d 10 PASS · render-regressions 2 PASS · stage-text GREEN · offer 16/16 · menubar GREEN · verify() 6/6 on
the GPU. `lab/*.js` 35,753 (−535). Measurements: `research/release-0.5.0/measure/c7-film-base-2171df3.json`, `c7-film-42438c6.json`.
