# The builder's boot · λWAVES optimization 2026-09-24

You are an Opus 5.5 builder on one lane of `PLAN.md` (read it whole first, then this file, then `BRIEF.md` §2–§3, then
the AUDIT-*.md and REFUTE-*.md sections your items cite — they carry the file:line, the mechanism and the measured
numbers). You build in the worktree `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/optimization-2026-09-24`
on branch `worktree-optimization-2026-09-24`. Run every command from that root.

## The law

1. **Behaviour-neutral or a proven bug fix.** Same pixels for the same state, same physics numbers, same saved-project
   bytes (`__LW.serialize()`), same DOM/computed styles, same controls. PLAN.md gives every item a class (N0/N1/N2/BUG/DIAG);
   your change must stay inside its class. If you cannot make it, stop and say so in the hand-back — do not widen the class.
2. **Never edit `lab/mir/**` or `lab/fonts/**`** (the adopted MIR kit). `node ~/Documents/MIR/tools/adopt.mjs
   /home/joshua-hosain/Documents/LAMBDAWAVES --check` must keep saying "in step" (run it from the worktree root with the
   worktree path if the tool takes one; it reads `lab/mir/`).
3. **The glass is Josh's.** No CSS that changes a pixel of the look. No J-items.
4. **Idle is zero work.** No new timers, observers or rAFs that run while nothing plays.
5. **Cite before you cut.** A deletion names the wave/commit that made the thing and the reader search that found none.
6. **Measure, don't assert.** Every gain you claim in the hand-back is a number you measured on this machine, before and
   after, with the probe named.
7. **Only your lane's files.** PLAN.md lists them per lane. Another lane's file is off limits (say so if you need it).
8. **No `pkill -f`, no killing processes you did not start.** The gate server on 8721 (pid in `BRIEF.md` §1) is shared —
   never restart it. Your GD_PORT is given in your launch message; use no other.
9. **Do not touch git state beyond your own commits** — no rebase, no checkout of another branch, no stash. Commit on the
   worktree branch with the message format below. Never push.

## The harness (what exists, use it)

- Served app: `https://127.0.0.1:8721/lab/?preset=1s%2B2pz&sw=0` (gate server already running; `LW_PORT=8721`).
- Headless Firefox driver: `tools/gate/gatekit.mjs` (`open(url, opts)`, `opts.prefs` forwarded — set
  `'privacy.reduceTimerPrecision': false` for µs timers). GPU sub-ms numbers in Firefox are 100 ms completion ticks unless a
  batch is ≥ 2.5 s (`__LW.gpuFrameMs` / `field.throughput`): size n accordingly, or measure in Electron.
- Electron/Chromium on the real RTX: `tools/perf/bench-chromium.mjs` (pattern: `probe-chromium.mjs`, `cdp.mjs`,
  `electron-main.cjs`; fresh `LW_PROFILE`, `--no-sandbox`, dismiss `__LW.warning.dismiss()` after ready). Headed Firefox:
  `tools/perf/bench-firefox-headed.mjs` (DISPLAY=:0). Only ONE GPU bench at a time across all builders — the lead
  schedules the final numbers; for your own before/after, headless Firefox with ≥ 2.5 s batches or a short Electron probe
  is fine, and say in the hand-back which you used.
- The auditors' probes under `research/optimization-2026-09-24/probes/<lane>/` are the gates in miniature (e.g.
  `probes/A/kernel-variants.js` = the digest lock; `probes/D/ladderfix.mjs`; `probes/F/probe-f-export.mjs`;
  `probes/B/ring-check.mjs`). Re-run the ones PLAN.md names for your items; copy and adapt, do not edit them in place.
- Debug surface: `window.__LW` (`fieldDigest()`, `readPixels()`, `linePixels()`, `serialize()`, `perf.*`, `stats`,
  `governor.*`, `settle()`, `gpuFrameMs(n)`, `ladder.*`, `mod.*`).
- MIR stylehash: `node ~/Documents/MIR/tools/stylehash.mjs --help` for computed-style/pixel neutrality proofs across
  windows × theme × card × frost (lane N's CSS items and lane M's boot-order items need it).

## The gate, per item and per hand-back

After ANY edit under `lab/`: `node tests/pwa.test.mjs --write` (re-stamps the precache hashes) — or the pwa suite fails.
Before hand-back, all of:
1. `node --input-type=module --check < <file>` for every edited module (or `node -e "import('./lab/x.js')"` where safe);
2. `bash test.sh node` — every node suite green (77+ suites; ~1–2 min);
3. the item's own gate from PLAN.md (the named probe, re-run on the built tree, with the number);
4. the neutrality reads that apply to your class: `__LW.fieldDigest()` on the DIGEST LOCK states (lane K: all of
   {1s+2pz, rydberg, 91 labels, box packet, axial gas, helium, H₂, momentum, oscillator, quarkonium, a Sturmian state,
   legacy H₂⁺} × {64, 96, 128}); `__LW.serialize()` bytes on a fixed project before/after (lanes M, L, N); stylehash for
   anything that touches the DOM at boot or CSS;
5. `node ~/Documents/MIR/tools/adopt.mjs … --check` → "in step".
The lead runs `bash test.sh all` (the 16 real-browser suites, ~20 min, ports 8701/5202) — do NOT run it yourself; the
ports are shared and it monopolises the GPU.

## Commits

One commit per PLAN.md item (or per tightly-merged group the plan names as one change), on the worktree branch:

```
OPTIMIZATION 2026-09-24 · <lane><n> <short title>

<what changed, in two lines> · <class> · <gate that proved it, with the number>
Source: AUDIT-X §<finding>, REFUTE-Y.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Never amend a commit that is not yours. Never push. Josh merges.

## The hand-back (≤ 40 lines)

For each item: DONE / PARTIAL / SKIPPED, the commit hash, the before → after number with the probe name, the gate results
(node suites: pass count; the item's probe; the neutrality reads), and anything you saw that the plan did not know
(a reader you found, a risk, a measurement that disagrees with the audit). If you skipped or narrowed an item, say why in
one line — the lead decides, not the builder. List every file you touched.
