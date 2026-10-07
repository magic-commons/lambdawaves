# λWAVES 0.4.0 · S1′ `cameraEye` — BRIEF for the seam builder (wave 144)

**Written by Fable, 2026-10-07.** The contract is `PLAN.md` §3 **B1 "THE SEAMS, cut to one"**; the map is
`research/release-0.4.0/survey/LWAVES-AUDIT.md` **C.3 item 1** (the nine copies of the eye/ray maths). This is a
**deletion**: one projection helper replaces nine hand-rolled copies, so S2's lens shift is a change in one place and the
atom labels and every 2-D overlay agree with the ray pass by construction. It is also the precondition for S2.

You start from the S0 tree. THE NAMES (`BRIEF-S1-NAMES.md`) is built beside you on disjoint files (names.js, molecules.js,
mathworker.js, chemview.js, orbitalsview.js, latex-state.js, export3d.js's METADATA); you touch export3d.js's camera line
only, and nothing of theirs.

## 0 · Laws

Never edit `lab/mir/**` or `lab/fonts/**`. `node tests/pwa.test.mjs --write` after any `lab/` edit. Subtract, don't add:
`lab/*.js` total lines must go DOWN (count before and after; report both). The glass is Josh's. Never `pkill -f`. Git only
in your worktree; never push. Ports `LW_PORT=8743 GD_PORT=5211`. **This is the frame path**: the 208-value digest lock
runs on every commit (`node tools/perf/digest-lock.mjs --check` — the base fixture; a red result is re-run ALONE before
it is believed: the RTX 3070 has a one-ulp fault in power state P5). REPORT.md wave 144 under `## … 0.4.0 S1′ — ONE EYE`.

## 1 · The helper

In `lab/field.js` next to `cameraBasis` (l.614) and `cameraKey` (l.630):

```
export function cameraEye(obs, half) → { eye, target, basis: { dir, fwd, right, up }, shift: [sx, sy] }
```
- `target = [0, 0, 0]` today (the pivot stays the origin — the plan chose the lens shift over a target pivot, R-C1);
  `eye = target + dir · obs.dist · half`; `basis = cameraBasis(obs)`; `shift = obs.shift || [0, 0]` **carried through as
  zeros now** — S2 defines it and writes it into the ray; your job is that every site already asks the helper for it.
- `cameraKey(obs)` gains the shift (`|sx,sy` to 4 decimals) so a cached 2-D overlay redraws when S2 moves it.
- At shift 0 nothing numerical changes: the lock proves it.

## 2 · The nine sites (each becomes a call; delete the copy)

| site | today |
|---|---|
| `field.js` `writeView` (~1009–1033) | the uniform + `lookAt(cam, ORIGIN, …)` |
| `fieldview.js` ~172 | its own eye |
| `keplerview.js` ~36 | its own eye |
| `particles.js` ~146 | its own eye |
| `vortex.js` ~60 and its cache key ~93 | its own eye and a (yaw, pitch) key — use `cameraKey` |
| `export3d.js` ~305 (fed from `rack.js` ~3784) | `position = dir·dist·half` (the GLB camera must stay byte-identical: `tests/export3d.test.mjs`) |
| `rack.js` `pointerRay` ~3077 | its own ray |
| `rack.js` `unproject` ~3209 | intersects the plane through the origin — the target |
| `rack.js` `placeAtomLabels` (Cloud) | "the PARTICLES projection", a fourth copy of it |

Line numbers are the audit's on the pre-merge tree; grep on yours. If a tenth copy turns up, it goes too.

## 3 · Two small laws that ride along (B1, B3)

- **The stage text keys on the string it would render.** Cloud's `stageTextTick` (rack.js ~2392, polled from the tick
  ~1001) re-places and rewrites per tick; make it build its string, compare with the last, and touch the DOM only on
  change — one compare per tick, no new register event, no per-tick layout read. (S3 replaces the renderer; this keeps
  the tick honest until then.)
- **The atom labels write only on change**: `placeAtomLabels` runs only when `cameraKey`, the preset, the size or the
  canvas size changed (B3: "the atom labels write only when `cameraKey`, the shift, the preset or the size changes").

## 4 · Acceptance (PLAN §6 row S1′)

`cameraEye` the only projection (grep proves no site computes `dist * half` or `lookAt(…, ORIGIN` on its own);
`lab/*.js` down; **208-lock green on every commit**; `node tools/new-project.mjs --check`; browser one at a time on
8743/5211: `render-regressions` (the scaled hit-test), `frame-occlusion`, `export3d`, `current`, `keplerview`/`vortex`
suites if they exist (`ls tests | grep -i 'kepler\|vortex\|particles'`), and `tests/keyboard-shortcuts.test.mjs` (node). A
screenshot pair before/after at HOME and at a FREE roll is a sanity look, not a gate.

## 5 · Hand-off

`research/release-0.4.0/S1-CAMERAEYE-BUILD.md`: the commits, the nine sites with their deleted lines, the line counts,
the lock runs, the gates. Kill your gate server by pid. Final message: ten lines + worktree path + branch.

## 6 · Harness

Compound shell with variables, loops, heredocs or backticks is refused: plain commands, scripts as files. Commit per site
group if you like; the lock after each.
