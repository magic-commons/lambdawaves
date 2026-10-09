# C9 HANDOFF (0.5.0 stage C) — THE SCENE GUARD, THE HIT-PROBE SET AND R14 — DONE

**C9 is built and documented.** The full write-up is `research/release-0.5.0/C9-BUILD.md`, and REPORT.md has wave 200 under
`## 2026-10-08 · 0.5.0 C — THE ADOPTION`. Nothing was merged, pushed, tagged or deployed.

- **Worktree:** `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a63344dfd9350ca1b`
- **Branch:** `worktree-agent-a63344dfd9350ca1b`, reset to `7044f37` (the `sos-s0` tip).
- **Commits:**

| commit | what |
|---|---|
| `4cee6c7` | the adopt (identical to C0's) |
| `a2823bb` | the guard |
| `37ae218` | the hit-probe set |
| `6ae9973` | R14 |
| `7b63d5c` | the hit-probe float scenes, recounted |
| `a840cef` · `ed01a91` · `58c94ac` · `79c2510` | hand-off updates |
| the docs commit | `C9-BUILD.md`, REPORT wave 200 and this file |

- **`cat lab/*.js | wc -l`:**

| tree | lines |
|---|---:|
| base | 36,288 |
| after the adopt (+181, generated `sw.js` rows) | 36,469 |
| final (C9 +13: the guard +10, the thumbnail +3) | **36,482** |

- **The hit-probe count:** 52 gap presses, 0 reached the stage (on the adopt alone: 52 of 52).
- **Servers:** every gate server I started is stopped by pid (8823: 3578115; 8827: 3608246, 3665322). Ports 8823, 8827, 5293
  and 5297 are free.

## Exact next step

Claude Sos merges this branch after C0's. See the "Exact next step" section of C9-BUILD.md.
