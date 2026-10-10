# RACK-DEPS HANDOFF · the measured dependency graph of `lab/rack.js` (Opus builder; worktree agent-a612d147a10c60abf)

Base: `a8b136c` (yan-c = `v0.5.1-alpha` + its HANDOFF).  Branch `worktree-agent-a612d147a10c60abf`.  Nothing merged, pushed or tagged.
Ask: one diagnostic for the integrator's 0.5.2 dissolution of `rack.js` — `tools/rack-deps.mjs`, its report, one node test.  Nothing under `lab/` edited.

## Step 1 · the tool + the test — DONE (commit `1d44053`)
- `tools/rack-deps.mjs` (no dependencies; the repo has no node_modules, so no acorn): §1 a lexer (comments, strings, templates with `${…}`
  nesting, regex literals by the previous token, multi-character punctuators, brace depth; it THROWS on an unterminated string / template /
  regex / comment and on unbalanced brackets), §2 a bracket pairer, §3 a two-pass scope walker (pass 1 declares, pass 2 resolves, scopes keyed
  by their opening token) that knows every binding form rack.js uses, §4 the sections (block comments at two-space indent and brace depth 1:
  `/* ── NAME ──` opens one, any other ALL-CAPS header is a sub-note; §0 is the head before the first), §5 the measure, §6 the reports.
- CLI: `node tools/rack-deps.mjs` (summary + `research/release-0.5.2/RACK-DEPS.md` + `rack-deps.json`), `--section <n|word>` (one section,
  writes nothing), `--no-write`, `--file <path>`.  Deterministic (two runs byte-identical, md + json + stdout); 0.3 s.
- `tests/rack-deps.test.mjs` (31 PASS lines, auto-discovered by `test.sh node`): the lexer (two regexes, three divisions, a nested template,
  the throws); a fixture whose every shadow (parameter, arrow parameter, destructured parameter, for-head over an unbraced body, catch, inner
  block const, inner const read before its line) and every read / write / mutate / ui member / LW key is known; an ASI + switch-case block +
  label fixture; lab/rack.js: ONE `export async function boot(dom)`, the sections tile the body (4,827 lines), every boot-level name (422) in
  exactly one section and on its section's lines, a clean walk (0 warnings), the for-head `rk` at line 3034 a shadow, no eager TDZ use.
- `bash test.sh node`: exit 0.

## Step 2 · the reports — DONE (commit `55f3849`)
`research/release-0.5.2/RACK-DEPS.md` (12 parts: totals, sections + sub-notes, the 31 × 31 matrix, the hubs, the ui bag, the LW facade +
`__LW_hooks` + `dom`, the ranking with each section's `deps`, the inverse, the cycles, the forward uses, the imports, the blind spots) and
`rack-deps.json` (everything, one collection entry per line), as the tool writes them at `a8b136c`'s rack.js (sha-256 `5ed39262…`).

The numbers: body 104–4930 = 4,827 lines, 31 sections (§10 a comment only).  422 boot-level names (158 functions): private 109 (25.8 %) ·
two–three sections 190 (45 %) · hubs ≥ 4 123 (29.1 %) · none unreferenced.  900 cross-section uses; 151 forward (150 deferred, 1 hoisted,
0 eager let/const); ONE strongly connected cluster of 26 sections (only §10, §21, §27, §28, §30 are outside it).  ui bag 107 (94 assigned in
§8 windows) · LW facade 176 (§26 169 · §27 1 · §28 5 · §30 2) · `__LW_hooks` 13.  Hubs: `clock` 21 · `ui` 21 · `mat` 19 · `schedule` 18 ·
`reg` 17 · `layout` 14.  Cheapest (reads + 3·writes + ui + hubs): §0 head 2 · §17 FLOATING RACK 4 · §3 FIELD 5 · §4 MATHS WORKERS 6 ·
§21 KEYBOARD WINDOW 9.  Dearest: §26 diagnostics 257 · §6 router 214 · §8 windows 181.  Most coupling out if moved: §2 ONE CONTROLLER
(in 229 / out 18), §8 windows (151 / 85), §6 router (47 / 113), §26 diagnostics (5 / 145), §0 head (145 / 1).

## Findings on the way (not fixed — nothing under lab/ is this agent's)
- Four imports are never referenced: `tableFor`, `FILM_FPS`, `domainForP`, `momentumTableFor` (rack.js reads the first and the last two
  only as methods, `getHamiltonian().tableFor(…)`).  The import `device` (kit.js) is re-declared by boot's own `device` wrapper.
- The `const LW = { … }` literal names two keys twice; the later one wins silently.  `frost` (two identical getters, lines 4552 and 4754)
  is harmless; `windowActivity` is not: the value object at line 4723 (`state(id)` by card id, `tracked`, `changes`) is REPLACED by the
  getter at 4757 (`get windowActivity() { return windowActivity; }`), so `__LW.windowActivity.state('id')` reaches the raw service with a
  string where it wants an element.  Worth one look by whoever owns window-activity's gate.
- 233 references in boot resolve to an inner binding that shares a boot-level name (`id` ×114, `S` ×49, `q` ×26, `rk` ×13 …) — late
  boot-level names (`q` §28, `S` / `id` §30) re-used as locals all over; a naive grep-based graph would have counted every one.

## Blind spots (also in RACK-DEPS.md §12)
Dynamic member access (`ui[k]`); aliases (`const u = ui`); bags passed whole (`reworkNative({ ui, … })`, `createBadges({ dom, … })` — the
module's own reads are invisible); calls count as reads (no call-graph closure, so transitive writes are missed); "deferred" is lexical (a
callback boot runs at once counts deferred); destructured renames keep no link to their source member; ASI only by "a name on a new line
after an expression end"; classes not modelled (none in rack.js).  Shadowing: parameters (plain, default, destructured, rest), arrow
parameters, inner const / let / function / var per block, for-heads (also over an unbraced body), catch bindings, case blocks and named
function expressions, resolved against the WHOLE block (TDZ / hoisting as JavaScript does).

## Commits
`1d44053` the tool + the test · `5872366` handoff step 1 · `55f3849` the reports · this handoff.  Trailers: Opus 5.5 (the harness's
attribution; the brief asked for "Fable 5.1", which is not the model that wrote them) + the Claude-Session line.

## Blockers
None.

## Next (the integrator's)
Read RACK-DEPS.md §7–§10 to pick the first module; `node tools/rack-deps.mjs --section <n>` before and after each move; re-run and diff
the json to watch the coupling fall.  The test pins only structural laws (one boot body, tiling, attribution, a clean walk), so it stays
green while sections move out — it goes red only if boot's shape or the walk breaks.
