# Contributing to λWAVES

λWAVES is a static tree of vanilla ES modules under `lab/`. There is no bundler and no framework; what you edit is what the
browser runs. Keep it that way.

## Before you open a pull request

1. `npm test` — every node suite (the mathematics, the file laws, the PWA integrity check).
2. `npm run test:browser` — the headless-Firefox gate, if you changed anything under `lab/` that the interface can show. It needs
   Firefox and geckodriver on `PATH`; `LW_PORT` / `GD_PORT` choose free ports (8700–8799 and 5200–5299 are λWAVES' ranges).
3. **After any edit under `lab/`, run `node tests/pwa.test.mjs --write`** and commit the `lab/sw.js` it rewrites. The service
   worker names its cache from the precache hashes; a stale hash leaves every returning visitor on old bytes.

A pull request answers an open issue, or says in its own words what was wrong and how it was observed. Whoever opens it is
accountable for every line in it and has run it. If an AI tool wrote or substantially shaped a change, say which tool in the pull
request and add an `Assisted-by:` trailer to the commit. Issues and reports drafted by a tool are checked by their sender before they
are sent. Coding assistants working here read [`docs/NOTES-FOR-AGENTS.md`](docs/NOTES-FOR-AGENTS.md) and [`CLAUDE.md`](CLAUDE.md) first.

## Rules of the tree

- **`lab/mir/` and `lab/fonts/` belong to MIR, not to this repository.** MIR is the interface kit
  ([github.com/magic-commons/mir](https://github.com/magic-commons/mir)): tokens, materials, widgets, gestures, window chrome, the
  modulation system. λWAVES adopts it — `node <MIR>/tools/adopt.mjs .` copies the bytes in and writes `MIR-MANIFEST.json`. Never edit
  those files here: change MIR, re-adopt, commit both; `node <MIR>/tools/adopt.mjs . --check` prints "in step" before a commit. `npm
  test` checks the manifest's file inventory and content hashes even without a MIR checkout. Changes to `lab/mir/` go to MIR.
- **Exact physics stays exact.** Hydrogen coefficients evolve by `e^{-iE t}`; nothing is integrated. A change that makes a proof in
  `tests/` tolerate more error needs a reason in the pull request, not a wider tolerance.
- **Idle is zero work.** Windows that are closed or off-screen do not compute; see `lab/mir/window-activity.js` and the work tiers.
- **State the behaviour, then measure it.** Tests here are sentences followed by a measurement. Add a failing test with the change
  that makes it pass. Read `docs/ui/STYLE-LOCK.md` before changing the interface.
- **No runtime dependencies.** `wrangler` is the only dev dependency, and it is not shipped.

## Where things live

| Path | What |
|---|---|
| `lab/` | The app. `index.html` boots `main.js` → `rack.js` (the instrument) → the windows in `lab/windows/` and the shell in `lab/shell/`. |
| `lab/field.js` | The WebGPU volume renderer. |
| `lab/hydrogen.js`, `lab/state.js` | The closed forms and the register. |
| `tests/` | Node suites (`*.test.mjs`), the browser gate (`*.browser-test.mjs`), fixtures, and `tests/legacy/` (the historical gate, run by hand). |
| `tools/` | The local and LAN servers, the gate kit, the deploy builder, the changelog generator, generators and diagnostics. |
| `docs/` | The interface laws (`docs/ui/`), the agents' laws (`docs/laws/`), the export and provenance references. |

## Commit style

One change per commit, an imperative subject line, and a body that says what was measured. The changelog is generated from the
git tags and the wave headings by `node tools/changelog.mjs`.
