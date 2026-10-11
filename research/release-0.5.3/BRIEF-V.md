# BRIEF M-V · THE VERIFICATION ROUND (0.5.3 "Rack Tune"; a FRESH Opus verifier — reads, measures, judges; fixes nothing)

**Read first, whole:** `research/release-0.5.3/PLAN.md` (§1 the rows, §2 THE GATES — your table of contents, §5 what is not claimed, §6 the ledger, §7 rulings, §11 Josh's
six answers), **`CHANGES-0.5.3.md`** (one line per merged row, with each row's "Open:" tail), every `*-BUILD.md` in the folder (STAGE, MOL, PAL, TR, CAM, DISP — their suite
tables, their base readings beside any red, their §"what I could not measure"), `CLAUDE.md` whole, `docs/NOTES-FOR-AGENTS.md` (the rig law), `docs/STATE-SCOPES.md`,
`tools/perf/digest-lock.mjs`'s header, `tools/serialize-bytes.mjs`'s header, `research/release-0.5.2/BRIEF-R-V.md` + `R-V-REPORT.md` (the previous round's shape and
its standing reds), `research/release-0.4.0/HANDOFF.md` §2's 0.5.3 blocks (the integrator's ledger: what was owed and why).

## The state you verify (the integrator, 2026-10-11 — the tip the launch message names; the BUILD files are the authority)
- **The build is complete:** M1–M13 merged in the order W1 {M4 · M1 M2 M3 M10} → W3's B-PAL {M12} → W2 {M13a M13b · M5 M6 M7} → W3's B-DISP {M8 M9 M11}. M14 is Josh's
  iPad checklist (no build; `IPAD-CHECKLIST.md`, untouched by you).
- **The base** is `v0.5.2-alpha` = `bb764a4`. Make its export once: `git archive bb764a4 | tar -x -C .tmp/base-052` and serve it on your SECOND port. Every red you
  find is read ONCE against that base before it is judged (RIG · PRE-EXISTING · DEFECT).
- **Known before you start:** `tests/current.browser-test.mjs` is RED at :138 on the base (the audio card's `followsPalette` / `longMeters`) — confirm on the base once
  and say so; B149 is the boot suite's standing law red and B6/B69 its known flakes (R-V-REPORT); `tools/stylehash.mjs` named in three briefs is MIR's tool, not the
  tree's — if it does not run on this rig (B-PAL: its headless Chromium found no WebGPU adapter) say so ONCE and move on, never loop on it.

## The estate (PLAN §2 — every gate, in this order; one browser suite at a time; `node research/release-0.5.2/r2b-measure/rigfree.mjs` before EVERY browser run — the
GPU is shared; never pipe a gate into `head`; redirect to `.tmp/` files and read them; your gate servers `python3 tools/gate/server.py <dir> <port> &` by pid, killed by pid)
1. **G-N** `bash test.sh node` exit 0; `node tools/new-project.mjs --check` in step WITHOUT regenerating (M9 regenerated once with 0 bytes changed — DISP-BUILD §2 says why;
   a second regeneration now is a defect).
2. **G-L THE LOCK** on the tip, camera lock OFF: `node tools/perf/digest-lock.mjs --check --query gastab=0` → 860 · 0/0; then `--check --fixture
   research/release-0.4.0/measure/digest-lock-s4a.json --query gastab=0` → 1004 · 0/0. Camera lock ON: READ CAM-BUILD §3's two lock-ON readings (B-CAM-2 ran them on an
   archived copy with `let locked = true`); re-run them yourself ONLY if `git log --oneline <B-CAM-2's tip>..HEAD -- lab/camera-law.js lab/field.js lab/material.js` is
   non-empty. A moved digest is a DEFECT, never a re-bake; a single red re-run alone once.
3. **G-B the bytes:** `tools/serialize-bytes.mjs --out` on the tip and on the base; compare with `research/release-0.5.2/integrator/sb-compare.mjs <tip.json> <base.json>`
   — 11/11 full AND 11/11 edit sha-identical, with ONE permitted difference: the INFORMATIONAL window's WORKSPACE row (`presentation.layout`); DISP-BUILD §2 names the
   bytes that moved — anything else that moved is BLOCKING (a PREFERENCE key entering a project, a PROJECT key changing shape). `node tools/settings-probe.mjs --out`
   0 of 6 red; `camLock`, `atomLabels`, `atomLabelsSize` present in every reached scene's blob as PREFERENCE.
4. **The 0.5.2 profile:** a stored `lambdawaves.q0.settings` written by the base (take one from the base's settings-probe run) with STAGE TEXT off, opened on the tip:
   both rows the INFORMATIONAL window now owns (STAGE FORMULA and ATOM LABELS) read OFF, nothing turned itself on, the blob byte-identical after a reload outside the
   WORKSPACE keys (PLAN row M9 + DISP-BUILD §2 state the migration law — judge the tree against the words).
5. **G-H** `LW_PORT=<yours> node tools/stage-dead-probe.mjs` → 10/10, DEAD 0. **G-W** `tests/lw-facade.browser-test.mjs` 1/1 WITHOUT `--write`.
6. **G-S the suites:** every one of the browser suites (`ls tests/*.browser-test.mjs`, 35 at the launch), one at a time, each count recorded; a red judged once against the
   base export; the boot suite ALONE (`tests/legacy/boot.browser-test.mjs`; B149 standing, B6/B69 flakes); the FILM witnesses (`node tests/render-exact.test.mjs`,
   `tests/film-handover.browser-test.mjs`). Each row's owning suites are named in its BUILD table — those must be green on the MERGED tip, not only on the builder's.
7. **G-Lines** `cat lab/*.js lab/shell/*.js lab/windows/*.js | wc -l` ≤ 28,222 (the cut cap; 27,943 at 0.5.2); the ledger per row from the BUILD files summed against
   PLAN §6's ≈ +122 — state the number, in and out, per row; the ruling on an overrun is Josh's, you state it.
8. **G-Eye** every BUILD has its before/after PNG pair under `eye/` — list any row whose pair is missing or does not show what the row says (open the PNGs).
9. **The documents against the tree:** CLAUDE.md's STAGE FORMULA paragraph (ATOM LABELS now live in the INFORMATIONAL window; is the paragraph still true?), the sentence
   CAM-BUILD §6 proposes for `camLock` and the `docs/STATE-SCOPES.md:45` camera-feel line, `atomLabels*` scope in STATE-SCOPES, every `rack.js`/module pointer the 0.5.3 rows
   moved (`placeAtomLabels`, the DISPLAY card's rows, the PALETTE rows). For each stale line propose the EXACT replacement text in your report — do NOT edit CLAUDE.md or
   the docs (the integrator applies).
10. **The fix-round candidates, judged:** (a) `lab/skin.css` `.native-clean[data-id="palette"] .palette-action` and the coarse-pointer `.pal-nav` — PAL-BUILD §3 says dead;
    grep `lab/` and `tests/` yourself and say SUBTRACT or KEEP with the proof; (b) every "Open:" tail in CHANGES-0.5.3.md — still open, or closed by a later row (M7, the
    LOCK pictures)? (c) anything a BUILD lists under "could not measure" that you CAN measure now on the merged tip.

## The verdict (`research/release-0.5.3/M-V-REPORT.md` — your ONE commit; nothing else changes; NO push)
- A table per gate: reading · the base reading beside any red · verdict (GREEN / RIG / PRE-EXISTING / DEFECT).
- The defect list for the fix round, each with file, line, law, both readings and a one-line fix proposal; severity BLOCKING (a byte outside the permitted row, a digest,
  a facade member, a law green on the base and red on the tip) or NOTE.
- The document edits (9) as exact old → new lines. The subtract list (10a) with grep proof.
- The last line: **FIT TO CUT: YES / NO** — NO only on a BLOCKING item. Then the integrator runs the fix round and `bash .tmp/cut-0.5.3.sh` (the local cut; nothing pushed).

## Laws
Never edit `lab/**`, `tests/**`, `tools/**`, `CLAUDE.md`, `docs/**` — you fix nothing. Never touch another worktree or the root checkout; never `pkill -f`; kill only your
own pids. Never edit `lab/mir/**`. Don't over-verify: each gate once, a red twice at most (once alone, once on the base). The whole round ≤ 3 hours of rig time; if the rig
stalls (2–3 frames a second on the base too) record it and stop — never loop. Report under 80 lines back to the integrator, with the report's path and your tip sha.
