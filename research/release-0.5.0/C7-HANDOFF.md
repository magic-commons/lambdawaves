# C7 THE FILM — live hand-off (updated after every commit)

- worktree `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a46f384b4af43f3cc`, branch `worktree-agent-a46f384b4af43f3cc`, base `7044f37` (sos-s0 tip)
- ports 8813/5283 (gate server for this tree on 8813, started by this builder; stop by pid)
- `lab/*.js` before: 36,288

## State

| step | commit | lock |
|---|---|---|
| 1 the bare adopt (alpha.24, `adopt.mjs --line 1.5`) | `0327937` | — |
| 2 the lock on the adopted tree | (this commit) | 1004 GREEN (58 s, 0/0 diffs) · 1148 GREEN (59 s, 0/0 diffs) |

Lock commands (alone on the GPU, 4 s apart):
- 1004: `LW_PORT=8813 GD_PORT=5283 node tools/perf/digest-lock.mjs --check --query gastab=0`
- 1148: `LW_PORT=8813 GD_PORT=5283 node tools/perf/digest-lock.mjs --check --query gastab=0 --fixture research/release-0.4.0/measure/digest-lock-s4a.json`
- the 588 is the same default fixture at `--grids 96` (a subset of the 1004).

Note: the lock reads `field.readPixels` / `linePixels` / `fieldDigest` directly; it never enters `capture.js` or `render-exact.js`.

## Next

Read the remaining film consumers (rack.js EXPORT/FILM verbs, tests), then wire `createRecorder` beside the app's road.
