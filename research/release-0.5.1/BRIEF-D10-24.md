# BRIEF D10-24 · CURVES, the kit's panel over the picture, screen only (0.5.1 "Informational Update"; Sonnet builder)

**Read first, whole:** `research/release-0.5.1/PLAN.md` (§0, §1, the D10-24 row, §5 U9, §8, §9 R6-C), `research/release-0.5.1/AUDIT-OPUS.md` E11 and §4
U9, `lab/mir/panels/curves.js` (whole — `createCurvesPanel(options)`, `createCurvesModel`, `project: false`, `history`, `port`, AMOUNT, IDENTITY, the
IDLE law), `lab/mir/panels/picture-filter.js` (whole — one SVG filter on the app's canvas; neutral = no filter), `lab/mir/panels/curves.css`, the RAMP
card in `lab/rack.js` (`:1330–1352`: how a kit panel sits inside a λWAVES card with `project: false`), the CAMERA card (`:1354–1370`), how a card is
defined, registered in the rack and listed in + and WINDOW (C3's `createRack`: grep `kind:` and the WINDOW menu rows; the RENDER card at `:4670` is the
most recent example of a card that ships CLOSED), `lab/settings-store.js` (`FAMILIES` — where a PREFERENCE key is declared; `tools/settings-probe.mjs` is
the gate), `docs/STATE-SCOPES.md`, `CLAUDE.md` (the scopes paragraph: "Every stored key lives in exactly one of three scopes"; the glass is Josh's).

## The contract (R6-C taken: a screen-only grade remembered per device)

1. **One new λWAVES card, CURVES**, on the right rack beside RAMP/CAMERA, **shipped CLOSED**, listed in + and WINDOW like every card. Inside it the kit's
   `createCurvesPanel({ parent, project: false /* R5-A3: λWAVES has ONE project part */, ... })` with **NO `history`** (λWAVES' ring reads
   `serialize({ scope: 'edit' })` only) and **no `port`** (so the kit installs its picture filter on the stage canvas — MASTER, R, G, B — the
   "zero-engine road"). **AMOUNT is NOT routed** in this release (pass no `mod`; a routed AMOUNT would be a flash route outside D10-19's guard).
2. **SCREEN ONLY, said plainly.** The CSS/SVG filter never reaches `capture.js`' GPU readback (pictures), the recorder's `frame(i, ctx)` (films) or THE LOCK.
   The card carries ONE line of its own text saying so (the kit's hint/`note` row, in λWAVES' words: "Grades the screen only — pictures and films are
   untouched."). Nothing else is added to the card.
3. **Neutral is nothing.** With the identity curves and AMOUNT at its default, the canvas's computed `filter` reads `none` (the kit's law — confirm by
   `getComputedStyle`), so the shipped default costs nothing.
4. **The state is PREFERENCE** (a screen calibration per device): ONE new key in `lab/settings-store.js` FAMILIES under the PREFERENCE family (name it
   `curves`; the model's points per channel + amount, as the panel's own `get()`/serialisation gives them), written on change (debounced as the other
   preference writes are) and read at boot before the panel is made. It is NEVER written into a project, a link or a history row, and a project open
   never changes it (`tools/settings-probe.mjs` proves both). Never add it to `saveSettings`' look keys.
5. **The card is a painted surface** like every `.dev` (the occlusion mask comes from the rack's cards — confirm `frame-occlusion` 7 with the card
   open and floated; fix only in λWAVES' own enumerator if a hole appears).
6. **The glass is Josh's**: the card wears the kit's card skin as the other cards do; no new colours, no new `!important` (the count stays 32).
7. **Lines:** ≈ +30 (the card, the + / WINDOW entry, the key, the note line). Say the real number. Nothing in `lab/mir/**`.

## Acceptance
- **Measured (U9), NOT the main-thread pair** (a non-neutral SVG filter costs compositor/GPU time the pair cannot see): presents/s over 30 s from
  `__LW.stats.presents` (CDP or the gate's Firefox, your choice; `tools/perf/wait-gpu.mjs` first) with an S-curve on MASTER vs neutral on the same
  tree, playing WAVE DANCER; both numbers in the BUILD. Josh's device report on the M5 (`?report=1&post=1`) is his to run — write the recipe in the BUILD.
- **Neutral reads `filter: none`** on the canvas with the shipped defaults (a one-line browser check in your scene).
- **Suites:** `hit-probe-set` 0 reached (the new card's gaps); `frame-occlusion` 7 (the card open, floated, folded); `settings-probe` 0/6 with the new
  key (a project open leaves `lambdawaves.q0.settings` byte-identical outside WORKSPACE keys; the key survives a reload); `serialize-bytes` 11/11
  (nothing of yours in a project); `menubar` 8/8 (the WINDOW row); `history`; `new-project` 8 + `node tools/new-project.mjs --check` (the card closed
  in the new project's layout — regenerate only if the layout record must list it, and say so); `bash test.sh node` exit 0; `node tests/pwa.test.mjs
  --write` after the lab edit. THE LOCK: run once (860 · 0/0 and 1004 · 0/0) to prove by measurement what construction says — the readback is untouched.

## Commits (each followed by `D10-24-HANDOFF.md`)
1. `0.5.1 D10-24 · the CURVES card: the kit's panel over the picture, screen only, closed; the PREFERENCE key` (code + pwa + the probe green).
2. `0.5.1 D10-24 · presents/s neutral vs S-curve; wave 2xx; D10-24-BUILD.md` (REPORT.md under the "0.5.1 · THE INFORMATIONAL UPDATE" heading — read the last
   wave number; the CLAUDE.md sentence DRAFTED in the BUILD, not applied).

## Harness
Isolated worktree: `git reset --hard <the integrator's tip named in your launch message>` first. Ports: yours 8993/5463. `python3 tools/gate/server.py
<worktree> 8993` (run_in_background); `LW_PORT=8993 GD_PORT=5463`. ONE browser suite at a time on the rig: `node tools/perf/wait-gpu.mjs` and `pgrep -a
geckodriver` / `pgrep -a -f chrome` empty before each; never kill another's process; stop yours by pid; never `pkill -f`; a single red digest may be the
RTX 3070 in P5 — re-run alone once. The guard refuses compound shell lines (plain commands or `bash .tmp/x.sh`). Never edit `lab/mir/**`, `lab/fonts/**`.
Never merge, push, tag. `D10-24-BUILD.md`: the ledger, the two presents/s figures, the suites' counts, the brief candidates (e.g. the panel's AMOUNT
under a guard; a `screenOnly` note row in the kit), the merge notes (rack.js sites; the FAMILIES row), the drafted CLAUDE.md sentence, "what Josh will
see" (a CURVES card in + and WINDOW; the screen graded, exports untouched). Hand back by message + try `~/.claude/handoffs/agents/<id>.md`.
