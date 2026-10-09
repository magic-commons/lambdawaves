# D1-HANDOFF (Opus builder, worktree `.claude/worktrees/agent-aeba657c669ee3661`, branch `worktree-agent-aeba657c669ee3661`)

Base `27eb96a`. Brief `research/release-0.5.1/BRIEF-D1.md`. Ports 8973 (tip) / 8977 (base, `.tmp/base` from `git archive 27eb96a`).

## Done
1. **Step 1** — `tools/perf/main-thread.mjs` `--setup` / `--sweep` / `served`; the two base arms in the D1 scene (off 94.171 ms/s,
   26.7 presents/s · on 68.190 ms/s, 18.1 presents/s; `D1-BUILD.md` §measure). Commit `0.5.1 D1 · main-thread.mjs --setup; the three base arms`.

2. **Step 2** — the code (`0f7915a`): one kit block in `rack.js initStageText`, the letters moved in, HOLD on I (key-table carries
   `up`), stage-text.js + `#molFormula` CSS + look.js paintInk gone, `.lw-stage` rules; stage-text suite GREEN; node 940/0; pwa written.

3. **Measured** — U2 witness: A 0 records / B 0 records, runner idle (C, a sweep THROUGH the block: 749, the kit's pointer push,
   writer found — `D1-BUILD.md` U2). THE PAIR: boot −0.109 ms/s, D1 −0.368 ms/s, both PASS (≤ 3.536), presents unchanged.

4. **U3–U5 + suites** — U3 18/18 clear after the settle fix (a second re-place 400 ms on: the pill's dodge); U4 4 renders / 4
   entrances in the stroke's second; U5 one fade 2.4 s, 0 on undo/link/project/no-hand; HOLD down/up ok; suites all green
   (frame-occlusion 7/7 on a re-run alone; legacy boot 4/152 = the known law reds; node 940/0). Diagnostic arms (letters' blend) running.

## Next (exact)
5. Finish: the diagnostic's numbers into D1-BUILD §the frame cost, "what Josh will see", REPORT.md wave 210, commit 3, hand back.
(old) 4. U3 / U4 / U5 probes (`bash .tmp/probes.sh` → `.tmp/u3.txt u4.txt u5.txt`), then the suites one at a time on 8973 (GD 5443):
   frame-occlusion, `tools/hit-probe-set.mjs`, keyboard-window, legacy boot (whole, or B6/B22/B23 by `.tmp/chunk.mjs`), offer,
   history; then REPORT.md wave 210 under "0.5.1 · THE INFORMATIONAL UPDATE", D1-BUILD.md's remaining sections. Commit 3.
(old) The pair (boot + D1 scene, base 8977 vs tip 8973, interleaved 5 + 5: `.tmp/arms.sh`), the witness (U2), U3–U5, the suites. Commit 3.

## Scripts (in `.tmp/`, gitignored — rebuild from here if lost)
`rig.sh` (quiet check), `arms.sh <out> <rounds> label:port:scene:sweep…`, `scene.mjs on|off` (the setup), `sum.mjs <dir>`.
Servers: `python3 tools/gate/server.py <tree> <port>` run in the background; stop by pid.
