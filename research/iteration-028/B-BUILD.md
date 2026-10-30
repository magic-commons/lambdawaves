# ITERATION 028 · CHAIN B — THE BOOT, THE RESTORE, THE WORD · BUILD

Builder: Opus 5.5 (Claude Yan's fleet), 2026-10-30, on its own branch fast-forwarded to `yan-c` @ 84cfeeff. One commit per row, each
with the test of its failure; the integrator merges. No app-literal change, no store added (`lambdawaves.q0.session.failed` was already a
RECORDS row), no saved key, window id, target id or CSS hook moved; THE LOCK unmoved.

## ROWS CLOSED

| row | commit | what changed | its failure's test |
|---|---|---|---|
| R-02 | b59a3166 | `lab/settings-store.js` `read()`: a parsed value that is not a plain object (`null`, `[]`, `5`, `"s"`, `true`) reads `{}` — the contract the header already stated. main.js' `warned` adapter and boot()'s `readSettings()` both go through it | first-run.test: the six texts read `{}` ×5 and the object as itself |
| R-04 | efcece64 | `lab/shell/persist.js`: `finiteOver(cur, v)` (exported, module scope) — a file's value replaces a number only when it is finite, one object deep (`mat.slice`) and element-wise in a number array (`obs.quat`); otherwise the current number stays; the rest of `v`, keys and order, as it came. restore()'s four spreads (obs, mat, quality, domain) go through it. `lab/rack.js:328` the belt: `if (domain.auto \|\| !Number.isFinite(domain.half))` re-derives the half | project-formats.test: `{ domain: { half: null } }` keeps 7; exposure `'boom'`, a NaN slice pos and a null in a quat keep the current numbers; a valid mat passes byte-for-byte; the four sites and the belt read so. first-run.test's wiring pin re-spelled for the quality site |
| R-11 | 8099541a | `lab/rack.js` the loop's `finally` (one line, + `faultRun` beside `lastFault` at :242): the second identical fault of a run calls `dom.banner.warn('a frame could not be drawn', fault)` once; the kit banner folds later runs into its (xN). Never a throw; the console/`__e` report is unchanged | render-regressions: a `mat.axis` getter that throws while playing puts `#mir-banner` up with the sentence and the message; dismissed after; `__e` holds nothing else |
| R-12 app side | e0dd4397 | `lab/projects.js`: RESUME's take is `takeResume(session, ls)` (exported): when `lambdawaves.q0.session` holds text and `session.read()` is null (a future `v`, unparsable, an empty record), the text is copied to `lambdawaves.q0.session.failed` and the kit's `resume()` is NOT called — autosave stays unarmed (it starts unarmed), the record stays as it was, and :303's sentence ("kept as … .failed; autosave is off until a project opens") is true. A readable record resumes as before | project-formats.test: `{"v":2,…}` and `{"garbage` → take false, `.failed` = the text, the record unchanged, `armed()` false; a v1 record → take true, no `.failed`, armed |

main.js untouched, as expected.

## LEFT, AND WHY

- R-12's kit half is the MIR session's (the kit is adopt.mjs' alone). When it lands, `takeResume`'s guard becomes a no-op beside the kit's
  own and can be dropped at the next adoption. The line for docs/FOR-MIR.md § FOR 1.5.6 (REVIEW §4 item 2, unchanged):

  > **core/session.js resume()** (λWAVES 028 R-12): when storage holds text under `key` but readSession() returned null, treat it as a failed
  > resume — copy to `<key>.failed`, leave autosave unarmed, return `{ ok:false, failed:['record'] }` — the law 1.5.6 wrote for a part that
  > threw, extended to the record the kit cannot read. λWAVES carries the app-side guard (lab/projects.js takeResume) until then.

- docs/FOR-MIR.md itself is not in this chain's files; the integrator (or CHAIN F) pastes the line.

## THE GATES

- `node tests/pwa.test.mjs --write && ./test.sh node`: green after every row (exit 0; first-run 15/15 → 15, project-formats 10 judged lines).
- `node tools/rack-deps.mjs --classes --no-write`: HOLDS (bare writes across scopes 0; the largest moving module persist at 24 of 25 —
  unchanged by this chain: `finiteOver` is module scope, it crosses nothing); the `app` literal not extended (30 keys).
- dependency-cruiser over `lab`: 0 app-side circular edges.
- `node tools/new-project.mjs --check`: in step (16098 B).
- `node tools/settings-probe.mjs`: 0 of 3 scenes red (boot, WAVE DANCER PROTOTYPE, NEW; reload byte-identical).
- `node tools/serialize-bytes.mjs`: 15 readings, every sha identical to a `git archive yan-c` copy served on its own port.
- THE LOCK (applyRebuild's belt), own server 9847 / GD 5847, stopped by pid: `--query gastab=0` **843 · 0**; with
  `--fixture research/release-0.4.0/measure/digest-lock-s4a.json` **987 · 0**; page errors 0.
- Browser, one at a time on the same server: `history` green; `project-formats` 5/5 (the first run went red on "paused, the mask kept
  FOLDERS mid-entrance" — a FOLDERS entrance timing under load, nothing this chain touches; green re-run alone); `start` 3/3;
  `render-regressions` green with the R-11 row.
