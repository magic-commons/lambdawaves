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
| 7 REPORT wave 199 (new `## 2026-10-08 · 0.5.0 C — THE ADOPTION`), C7-BUILD.md, BRIEF-C7-VERIFY.md, CLAUDE.md's film paragraph, `tools/perf/wait-gpu.mjs` | (this commit) | — (docs only) |

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
C7 is BUILT. Next: the film verifier, a fresh Opus with `research/release-0.5.0/BRIEF-C7-VERIFY.md`. Then the integrator merges this branch after C0's.
Merge note: `lab/sw.js` is the standing conflict (`node tests/pwa.test.mjs --write`). The adopt commit `0327937` is identical to C0's.
Final numbers: `lab/*.js` 36,288 → 35,753 (C7's own −716; the adopt's sw.js +181). Lock GREEN at every step.

## C7-FIX · the hand-over (2026-10-08, a second builder on top of `74ade0c`)
- worktree `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a60503e61fea6f97e`, branch `worktree-agent-a60503e61fea6f97e`, reset to `74ade0c`; ports 8863/5333
- `c994505` 0.5.0 C7 · the film's hand-over: a spent activation downloads, a live one shares (`lab/capture.js` `handOver`, `lab/render-exact.js`, `lab/sw.js`, `tools/perf/handover-probe.mjs`)
- the docs commit on top: C7-BUILD.md § the hand-over fix, REPORT wave 203, this section. **The tip is that docs commit.**
- Lock on `c994505`: 1004 GREEN 59 s 0/0 · 1148 GREEN 59 s 0/0. `handover-probe`: spent → 1 download, 0 shares (before: 1 rejected share, 0 downloads); live → 1 share.
- `lab/*.js` 35,753 → 35,768. Next: the integrator takes this branch in place of `74ade0c`. The film verifier's findings on `74ade0c` still apply, since only the hand-over moved.
