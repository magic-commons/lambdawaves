# REFUTE D · boot, storage, projects, restore · cross-refutation of AUDIT-A/B/C/E/F · 2026-09-24 · Opus 5.5

Read whole: REFUTE-BRIEF.md, AUDIT-A, -B, -C, -E, -F. New probes (all `probes/D/`, GD_PORT 5234, headless Firefox unless noted):
`linkopen.mjs` (link open vs quick LOAD through restore), `failrestore.mjs` (F16 end to end), `menutrigs.mjs` (FE1's FILE rows),
plus the audit's `ladderfix.mjs`, `projects.json`, `compare-headed.json` (headed Firefox, FD1 addendum). Nothing under lab/ or
tests/ was edited.

## 1. Verdicts

**F1 (the LADDER solve on restore) ≡ FD2 — MERGE, and F's `load()` is the safer fix. I withdraw my `set()` edit.**
Same finding, same numbers (restore 455–469 ms of which `ladder.set` 414–422; mine 421 of 463). Reconciling the two fixes:
- *Callers of `set()`:* `__LW.ladder.set` (tests/current.browser-test.mjs:173, tests/legacy/boot.browser-test.mjs:8073 which
  reads the result after a 120 ms nap) and restore. F's `load()` leaves `set()` byte-for-byte as it is for every caller but
  restore. Mine changes `set()` for any caller while the card is closed. **F's wins on caller safety.**
- *Restore itself:* my `if (active) compute(); else schedule();` reads `active` at the wrong moment. restore() runs
  `ladder.set(I.ladder)` inside the instruments block (rack.js:5382), BEFORE `layout.applyLayout(pr.layout)` (rack.js:5416). So a
  project that CLOSES a currently open LADDER still pays the full synchronous solve, and one that opens it defers anyway. F's
  always-defer `load()` has no such timing dependence. **Adopt F's `load(p) = Object.assign; ui[k].set; clockFx(); schedule();`.**
- *NARROWED — "and link open":* false. `lab/statelink.js` never carries `instruments` (0 occurrences). linkopen.mjs, 3 link
  opens: 33–50 ms, and restore's `ri:ladder` mark is never reached. **Missed by both of us:** the quick-save road (STATE's LOAD,
  FILE › "LOAD the last quick save" = `restore()` on LS_PRES, which stores the full presentation including
  `instruments.ladder`) = **700–708 ms**, and the mark IS reached. The same `load()` fixes it, since it is inside restore.
- Neutrality proof carries over from ladderfix.mjs: fieldDigest, `ladder.params`, the `ladder.last` hash all equal. serialize()
  differs only in `presentation.layout.at` (a Date.now). Keep `tests/current.browser-test.mjs:14`'s `ladderComputed === false`
  law: `load()` preserves it.

**F16 (failed restore half-applied, marked clean) — CONFIRMED and it is a data-loss bug; NARROWED on "never rebuilt"; the
CHANGE is incomplete.** failrestore.mjs: a project whose `presentation.palette.stops = [5]` passes `importText` (the envelope
validator never looks inside `data`, project-import.js:12–27) and makes restore() throw at the palette step. Through the real
PROJECTS road, starting from a clean, different state: `open()` → **true**, notebook status **"opened probe/broken"**, while the
STATE card says "restore failed"; `projects.current` = the broken path; `dirty` = **false**; and a plain SAVE (Ctrl+S →
`projects.save()` onto `current`) **overwrote the stored file with the half-applied state** (`saveOverwrote: true`).
- NARROWED: "never rebuilt" depends on where it throws. Here one REBUILD ran, because switchHamiltonian scheduled it before the
  throw (`rebuildsAfterOpen: 1`). F's `finally { schedule(REBUILD) }` is still right for early throws.
- RISK in F's CHANGE: skipping `projectClean()` is not enough. `open()` also sets `pjCurrent = path` (rack.js:4471) and writes
  the notebook keys before it knows. On failure it must keep the previous `pjCurrent` and the previous notebook, and say "open
  failed". Otherwise Ctrl+S still saves the half state over the file it just failed to open (the dirty guard only fires on
  discard, not on save). Test: failrestore.mjs as a browser block (assert `saveOverwrote === false`, status says failed).

**F3 (unbounded scan queue) — CONFIRMED (+), one hole in the proposed coalescing.** Code: rack.js:3017–3027 posts a new
`scan.call` whenever the key moves; stale answers are discarded on landing, but the work is not cancelled. The hole: `raw()`
times a job out at 8 s (rack.js:793), but the worker keeps computing it, and the late reply is silently dropped (`waiting` no
longer holds the id). "At most one in flight" must therefore track the WORKER's completion (e.g. an `inFlight` flag cleared only
by a real reply, plus a `stat` round trip after a timeout), not the promise. Otherwise a timed-out scan plus a fresh post puts two
jobs back in the FIFO. Neutrality as F states (the settled key gets the same `densityPeriod` answer).

**FE7d (import the kit's palette.js / notebook-render.js, delete the lab copies) — CONFIRMED neutral; the consequences are
mine, and one of them is a hard gate.**
- Neutral: `diff lab/palette.js lab/mir/palette.js` = two comment hunks, no code, no imports in either (node-safe for
  statelink.js's suites). notebook-render.js and notebook-math.js are byte-identical to the kit copies (same sw hashes).
- **tests/wiring.test.mjs MUST drop three ALLOWLIST entries in the same commit** (lab/mir/palette.js,
  lab/mir/shell/notebook-render.js, lab/mir/shell/notebook-math.js). The test hard-fails on an allowlisted file that is now
  reached ("the entry is stale, delete it").
- Import paths to move: rack.js (palette + notebook-render), paletteview.js, statelink.js; tests/palette, ink, statelink
  (`../lab/palette.js`), tests/notebook-math.test.mjs:3 (`../lab/notebook-math.js`), tests/current.browser-test.mjs:61 (in-page
  `import('./notebook-render.js')`).
- Precache: `pwa.test --write` removes 3 entries (−37.6 KB, −3 duplicate groups); the cache name changes (as for any lab edit).
  build-deploy needs nothing (V1 re-proves over dist/). `adopt.mjs --check` is unaffected (lab-side files only).
- Interplay with my FD8(b): after FE7d, a precache skip rule for `mir/shell/**` must NOT cover notebook-render/notebook-math,
  which are now imported. pwa.test §D3 fails otherwise ("lab/ loads a file that the precache does not hold"). Make the rule
  "wiring-ALLOWLIST orphans", computed, not a directory glob.

**FE1 (menubar → functions) — CONFIRMED; storage-neutral for FILE.** menutrigs.mjs: on a first visit AND with the modulation
window open, each FILE label resolves to exactly one `.trig`, STATE's (`SAVE`, `LOAD`, `COPY JSON`, `COPY LINK` → `["state"]`).
A quick SAVE writes exactly `lambdawaves.q0.experiment` + `.presentation`. Calling `save()` / `restore()` / the JSON copy /
`copyLink()` directly writes the same keys. The only storage-relevant fact: FILE › LOAD is the 700 ms quick-load road above
(F1's `load()` fixes it too). The EDIT-row bugs (RESEED, RESET KEYS, CLEAR) are E's and stand.

**FE12 (BUILD_LINE) — CONFIRMED, no storage consequence.** BUILD_LINE reaches only the ABOUT face, `LW.build` and the copy
dump. It is not in serialize(), the settings key, a project or a link. Bumping it changes rack.js → a new sw cache name → the
normal update prompt, as any lab edit does.

**FE2 + FD5(a) + FB3 + FC4's residue — MERGE (one modwindow.js change; E owns it, E has the A/B).** All four describe the CLOSED
modulation window doing live work: layout reads in place()/paint(true) at boot (FE2, FD5a), a forced paint on every refused
LINK retry (FB3, 1 Hz while playing), and the "1.7 records/frame" FC4 saw with the UI hidden (that is FB3's 1 Hz retry, not
once per play/pause). **Self-NARROWED:** FE2's A/B shows the boot task −19.7 ms but the first rAF unmoved (743.2 vs 743.9 ms).
The layout moves into frame 1. My FD5 "40–60 ms across boot + first frame" overstates the first-frame part; it is a LW.ready win
(~20 ms) plus FB3's steady 0.7 ms/s.

**FE3 (open() + wake() double rebuild) — CONFIRMED from the restore side.** WAVE DANCER's open spends 19.1 ms in
restoreModulation (`modView.rebuild()`) and 25.9 ms in `modView.restore → open() → rebuild()` again (projects.json marks). The
same double build happens on the project road, not only in `expand()`. Once FE3 lands, restoreModulation can skip its own
`rebuild()` when `pr.modwin.open` will call open(). Measure before claiming (≈ 10–19 ms/open est.).

**FB9 (stop the warm timer) ≡ F15 — MERGE, and FB9's stop rule as written is REFUTED; F15's is right.** kick.js:42
`tablesReady()` is keyed on `RAD.id === getHamiltonian().id`. Today's forever chain re-warms the kick tables within ~2 s after an
OPERATOR switch. FB9's "stop once kickReady() && workerWarmStarted" would leave them cold after a switch, so the first K /
RELEASE on the new operator pays the cold solve (F13: 135 ms). F15's "stop, and re-arm from switchHamiltonian" (also setZ /
setElement if the table ever keys on them; today it does not) keeps idle at zero without that regression.

**FB2 ≡ F5 (the perf ring holds the last frame) — MERGE; does not touch any number I reported.** Every D number is a
`performance.now`/mark interval, a wall-clock around a synchronous call, a first-presented-frame time from `stats.presents`,
or a digest. None reads `perf.median`.

**FA5 (Firefox throughput = the completion tick) — no effect on D.** I never used `gpuFrameMs`/`throughput`. The baseline's
`projects` block (serialize/save/dirty/open/restore) is CPU `performance.now`; boot readyMs is wall clock. Both are unaffected.

**FC4 (UI-hidden path clean) — CONFIRMED;** nothing in boot/storage runs per frame under H. The only residue is FB3's retry
(merge above).

**FC7 (rack slide strips the frost) — CONFIRMED, and it also shows on the project road.** `layout.applyLayout` toggles
`body.rack-hidden` from the file (rack.js:3963, `L.rackHidden`), so opening a project saved with the rack in the other state
plays the 280 ms slide with the clear-glass glitch. Josh's call, as C says. Nothing to change in restore for it.

**FA1 / FD6 / FB6 / F14 — MERGE** (A says so too): the lazy gas build (FD6), the radius-free Hermite table (FA1), the persistent
records (FB6/F14). One gas.js change. FD6's lazy `build()` stays useful after FA1, because `launch`/`stats`/`overlap` still read
the f64 `Rt` rows.

**FD1 (my GPU prestart) — self-check after the headed run.** Headed Firefox 155: cold requestAdapter 404–430 ms (not a headless
artefact). Cold ready 1180 → 817 ms (−31 %), first frame 1220 → 937 (−23 %). Warm reload: adapter 1.7–4.4 ms, but
requestDevice stays 99–161 ms, so ready 605 → 534 (−12 %). Digest and limits are identical in all 16 boots. Standing.

## 2. Ranking — top 10 across all six audits (measured gain ÷ risk)

1. **F1 ≡ FD2** `ladder.load()` in restore: −415 ms…−1.4 s per project open and −700 ms per quick LOAD; neutral (proved); S.
2. **FD1** GPU prestart: −363 ms cold / −71 ms warm LW.ready (headed FF), −30 ms Chromium; neutral (digest/limits); S.
3. **FA2** bit-identical kernel trims: gas 2.5×, BOX 2.2×, 91 hydrogen −24 %, 0 texels differ; S.
4. **F16 (+ keep pjCurrent)**: a measured overwrite of a good project file by a half-applied state; bug; S.
5. **F6 ≡ FD3** L6 guard: the no-GPU visitor gets the banner, not "boot failed"; S.
6. **FB1 ≡ F11** gas.stats factorised: the one periodic 9–17 ms frame of the BOX scene → 0.35 ms; ≤ 3e-15 on a 2-decimal readout; S.
7. **F2** CAPTURE hover plan through the worker: −0.46…−1.0 s per hover on the BOX; neutral numbers; S–M.
8. **F3 (+ the timeout hole)** scan coalescing: prevents a 2-minute worker jam; S.
9. **FA3** specialised render pipeline: present −50 % on the default cloud, byte-exact; M.
10. **FE1** menubar rows as functions: three rows do the wrong thing today (one clears the undo ring); S.
Next: FD4 (ABOUT size lost, S) · F8 (export drops a REBUILD, S) · FE2/FD5a/FB3 merge (closed modwindow, S) · FE3 double rebuild ·
F7 LAUNCH async · F9 helium · FB7 `inLoop` try/finally · FA1 (needs Josh's law-1 acceptance) · FB2/F5 perf ring (diagnostic, do first
so every later number is right).

## 3. Missing (nobody found)

- The quick-save LOAD road pays the ladder solve: 700–708 ms (linkopen.mjs). STATE › LOAD and FILE › "LOAD the last quick save"
  → restore() on `lambdawaves.q0.presentation`. Fixed by F1's `load()`.
- `projects.open()` commits `pjCurrent` and the notebook keys before it knows restore succeeded (rack.js:4468–4471). This is
  the half of F16 that turns a failed open into data loss.
- `importText` validates only the envelope (project-import.js:12–27; project-storage.js validates records, not `data`). A
  malformed `data` imports cleanly and fails only at open. A `restore()` dry-run on a scratch copy is not possible (restore
  mutates), so the defence is F16's failure handling, not the validator.
- rack.js:4587: `nb.addEventListener('pointerup', () => nbSaveSize())` runs on EVERY pointerup inside the notebook. Each one is
  an `offsetWidth/Height` layout read + a settings JSON.parse; it writes only if changed. Lead, unmeasured (likely < 1 ms).
- rack.js:4219–4226: on a first visit the LEAN pass writes `lw.lean.v1` 24 times in one loop (0.34 ms; one write would do).
  Trivia, listed so nobody re-finds it.

## 4. Not now

- FA1 (not bit-identical; needs Josh to accept law 1's fp16 argument) · FA3's lit/additive styles · FA4 governor policy · FA6
  first-visit 64³ pairing · FA8 GLASS gradient volume.
- Every FC look option (J1–J8), FC6 tablet-motion, FC7 slide: Josh's.
- FB4 ≡ F10 re-probe back-off, FB8 reader stagger, FB11 ≡ F12 busy-mark semantics: cadence/meaning decisions for Josh.
- L12 lazy windows, a bundler, FD10 modulepreload (needs a real-network number), the rack.js seam refactor (E §6), and the MIR
  shell migration beyond FE7d: each its own wave behind the browser gate.
- Per-project localStorage keys and a `cache:'no-cache'` SW install: storage/policy migrations.
