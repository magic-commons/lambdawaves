# R3b-HANDOFF · TRANSPORT + RACK WIRING + NOTEBOOK + KEYS (0.5.2; Opus builder; PAIR 2 beside R2b)

Worktree `.claude/worktrees/agent-ad72f08e558dc8f5f`, branch `worktree-agent-ad72f08e558dc8f5f`, base `1d5b060` (`lab/` = `87aad5e`'s).
Ports 9093/5563 (this tree), 9097/5567 (the base export in `.tmp/base`).

## After step 1 (`c7451c5`, 2026-10-10 09:16 CDT)

- THE MOVE is committed: `lab/shell/transport.js` (233), `rack-wiring.js` (341), `notebook.js` (379), `keys.js` (217); `lab/rack.js`
  3,605 → 2,448. Scripts: `.tmp/r3b-move.mjs` (plan + free names + at-use rewrites), `.tmp/r3b-write.mjs` (files + seats + fills),
  `.tmp/r3b-imports-fix.mjs` (in-place import trims), `.tmp/verbatim.mjs` (1121 moved non-blank lines: 1101 byte-identical, 17 slot
  reads, 3 fills made registrations; 34 blanks dropped).
- `node tools/rack-deps.mjs --classes`: transport 4 → 4, rack-wiring 4 → 4, notebook 21 → 21, keys 13 → 13; hinge holds; G-A clean.
- `bash test.sh node` exit 0 (project-formats re-pointed: its slice now reads `app.sh.serialize` / `app.sh.modSeats`).
- `menubar`: 4 PASS then `:143` (the quick save also wrote `lambdawaves.q0.session`) — IDENTICAL on the base export (the rig's session
  flush); a scratch copy tolerating that one key (`.tmp/menubar-tol…`) reads 8/8 on this tree.

## Next

Step 2: the light check (`keyboard-window`, `keyboard-shortcuts`, `timeline`, `offer`, `first-run`, `access`, `history`, `hit-probe-set`,
`frame-occlusion`, `settings-probe`, `serialize-bytes` vs the base, `lw-facade`, `new-project` + `--check`, the boot suite's blocks),
`R3b-BUILD.md`, REPORT wave 220, commit 2, this file again.
