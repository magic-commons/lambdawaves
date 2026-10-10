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

## Step 2 · the reports — next (commit 2)
`research/release-0.5.2/RACK-DEPS.md` + `rack-deps.json` as the tool writes them at `a8b136c`'s rack.js (sha-256 `5ed39262…`).

## Blockers
None.
