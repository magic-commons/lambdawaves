# D1-HANDOFF (Opus builder, worktree `.claude/worktrees/agent-aeba657c669ee3661`, branch `worktree-agent-aeba657c669ee3661`)

Base `27eb96a`. Brief `research/release-0.5.1/BRIEF-D1.md`. Ports 8973 (tip) / 8977 (base, `.tmp/base` from `git archive 27eb96a`).

## Done
1. **Step 1** — `tools/perf/main-thread.mjs` `--setup` / `--sweep` / `served`; the two base arms in the D1 scene (off 94.171 ms/s,
   26.7 presents/s · on 68.190 ms/s, 18.1 presents/s; `D1-BUILD.md` §measure). Commit `0.5.1 D1 · main-thread.mjs --setup; the three base arms`.

## Next (exact)
2. Apply the code: `node .tmp/edit-rack.mjs` (the rack.js edit: one kit block in `initStageText`, the letters moved in, HOLD on I),
   the key-table `up` passthrough, delete `lab/stage-text.js` + its lab.css rules (`#molFormula`, `.mf-top/.mf-foot`, `.st-fade`),
   add the `.lw-stage` rules (z 20, sizes × `--lw-stage-size`), delete look.js `paintInk` (it painted `#molFormula` only), re-aim
   `tests/stage-text.browser-test.mjs`, `node tests/pwa.test.mjs --write`, `bash test.sh node`. Commit 2.
3. The pair (boot + D1 scene, base 8977 vs tip 8973, interleaved 5 + 5: `.tmp/arms.sh`), the witness (U2), U3–U5, the suites. Commit 3.

## Scripts (in `.tmp/`, gitignored — rebuild from here if lost)
`rig.sh` (quiet check), `arms.sh <out> <rounds> label:port:scene:sweep…`, `scene.mjs on|off` (the setup), `sum.mjs <dir>`.
Servers: `python3 tools/gate/server.py <tree> <port>` run in the background; stop by pid.
