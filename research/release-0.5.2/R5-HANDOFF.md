# R5-HANDOFF (0.5.2 "Rack Dissolution" · THE FACADE, MOVED WHOLE · runs alone after PAIR 3) — after step 1, 2026-10-10 12:35 CDT

- **Goal:** BRIEF-R5. §26's `__LW` literal WHOLE → `lab/shell/facade.js` `createFacade(app)`; `boot()` keeps `const LW = createFacade(app);`,
  `window.__LW = LW; app.sh.LW = LW;` and every later `LW.x =` line at its seat; the 22 null slots registered by their owners.
- **Where:** worktree `.claude/worktrees/agent-a2eb07f36aee94b92`, branch `worktree-agent-a2eb07f36aee94b92`, base `293df3c` (`sos-s0`; lab
  bytes = the PAIR 3 merge `7c3eebe`).
- **Commits:** `a247eda` THE MOVE (the brief's commit 1, with pwa) · this file.
- **Servers (mine, by pid):** 86847 → 9123 (this tree), 86943 → 9127 (`.tmp/base` = `git archive 293df3c`), `LW_CERTS=<worktree>/.certs`.
  Geckodriver ports 5593 / 5597. Stop both by pid at the end; the integrator's 8731 / 8735 are never touched.

## Done (step 1, `a247eda`)

- `lab/shell/facade.js` 269 lines: header 2 · 4 import lines (11 statements, 28 names; `TIER, BUILD_LINE` from `'../rack.js'`) · signature ·
  the hand-over 8 lines (dom/ui + the 121 backward names: app 12 · loop 8 · host 6 · w 35 · ctl 42 · sh 20) · `modEdited` · `return {` ·
  the literal's 250 lines · `};` · `}`. Verbatim (`.tmp/r5/verbatim.mjs`): 251 of 253 moved lines byte-identical; `const LW = {` → `return {`
  and `get warning() { return app.hooks.warning; }`.
- `lab/rack.js` 1,202 → 943: the seat; 4 import lines OUT (frame-settle, mir/palette, well, look), 6 trimmed (+ the dead `knob`);
  `createFacade` on R3a's shell import line. Three boot fill lines OUT, now their owners' registrations (settings.js, spectrum.js, kepler.js).
- The 22 registrations (one statement each, appended to an existing line): readouts orbit · flowTracers · calculus · radiationView; kepler
  gasTableOn · keplerDragToPoint · orbitOfShell · slapAlong; spectrum selectEigen · setSturmian · sturmEigen; settings applySettings; links
  mintLink · notCarriedWords · openLink; persist restoreModulation; keys stageHasFocus; molecules head; rack.js loopRing · ringMedian (on
  ringMedian's line) · MOTION (on paceRate's line) · setCamMode (camera law host line).
- Lines 27,932 → **27,943 = the cap exactly** (+11). Gates green: pwa --write, syntax (22), doubles 0 (190 slots), classes (facade 121 · 0 ·
  21 → 21, hinge holds), free names none lost, `bash test.sh node` exit 0, **lw-facade 1/1 without --write**.
- The seat destructures in `boot()` are NOT trimmed on purpose: removing the names only the facade read makes `rack-deps --classes` lose
  them as boot-level names (tried: facade backward 121 → 70, crossing names 226 → 153). Reverted; recorded for R-V.

## Next (step 2)

1. THE LOCK on this tree: `LW_PORT=9123 GD_PORT=5593 node tools/perf/digest-lock.mjs --check --query gastab=0` (860 · 0/0), then with
   `--fixture research/release-0.4.0/measure/digest-lock-s4a.json` (1004 · 0/0). A stall → once on the base (9127/5597).
2. serialize-bytes tree vs base (`tools/serialize-bytes.mjs --out`, `research/release-0.5.2/integrator/sb-compare.mjs`); settings-probe;
   history, new-project + `node tools/new-project.mjs --check`, offer, menubar, stage-text, curves, timeline, keyboard-shortcuts (node).
   Every suite through `bash .tmp/r5/run.sh <tag> tree|base <cmd>` (waits for `rigfree.mjs`, one browser at a time).
3. `R5-BUILD.md`, REPORT.md wave 223 under `## 2026-10-10 · 0.5.2 · RACK DISSOLUTION` after wave 222, commit 2, this file again.
