# Contributing to λWAVES

λWAVES is a static tree of vanilla ES modules under `lab/`. There is no bundler and no
framework; what you edit is what the browser runs. Keep it that way.

## Before you open a pull request

1. `npm test` — every node suite (the maths, the file laws, the PWA integrity check).
2. `npm run test:browser` — the headless-Firefox gate, if you touched anything under `lab/`
   that the UI can see. It needs Firefox and geckodriver on `PATH`; `LW_PORT` / `GD_PORT`
   pick free ports (8700–8799 and 5200–5299 are λWAVES' ranges).
3. **After any edit under `lab/`, run `node tests/pwa.test.mjs --write`** and commit the
   `lab/sw.js` it rewrites. The service worker names its cache from the precache hashes;
   a stale hash strands every returning visitor on old bytes.

## House rules

- **`lab/mir/` and `lab/fonts/` are MIR's, not ours.** MIR is the interface kit (`~/Documents/MIR`, its own
  repository): tokens, materials, widgets, gestures, window chrome, the modulation system. λWAVES *adopts* it —
  `node ../MIR/tools/adopt.mjs .` copies the bytes in and writes `MIR-MANIFEST.json`. Never edit those files
  here: change MIR, re-adopt, commit both. `node ../MIR/tools/adopt.mjs . --check` must print "in step"
  before a commit. Reuse MIR's nodes, gestures and CSS; do not copy their look.
  Commit the generated `MIR-MANIFEST.json` with each adoption. `npm test` checks its
  complete file inventory and content hashes even on machines without a sibling MIR checkout.

- **Exact physics stays exact.** Hydrogen coefficients evolve by `e^{-iE t}`; nothing is
  integrated. A change that makes a proof in `tests/` tolerate more error needs a reason in
  the pull request, not a wider tolerance.
- **`lab/mir/modwindow/` is a ported plugin and is byte-frozen.** Host-side behaviour lives in
  `lab/modwindow.js` and `lab/modhost.css`. See `docs/ui/STYLE-LOCK.md` before touching the UI.
- **Idle is zero work.** Windows that are closed or off-screen must not compute; see
  `lab/mir/window-activity.js` and the work tiers in `lab/rack.js`.
- **Write the law, then measure it.** Tests here are prose sentences followed by a
  measurement. Add a failing test with the change that makes it pass.
- **No new dependencies at runtime.** `wrangler` is the only dev dependency and it is not
  shipped.

## Where things live

| Path | What |
|---|---|
| `lab/` | The app. `index.html` boots `main.js` → `rack.js` (the instrument) → the windows. |
| `lab/field.js` | The WebGPU volume renderer. |
| `lab/stage-gestures.js` | Stage pointer ownership, drag/fling, pinch, wheel zoom and interruption. Physics actions stay in the rack. |
| `lab/frame-coalescer.js` | Shared drag painting: latest position per frame, a stalled-frame fallback, and a final flush before saving. |
| `lab/hydrogen.js`, `lab/state.js` | The closed forms and the register of 91 states. |
| `tests/` | Node suites (`*.test.mjs`), the browser gate (`*.browser-test.mjs`) and `tests/legacy/` (the historical gate, run by hand). |
| `tools/` | The gate kit, the deploy builder, the changelog generator. |
| `docs/` | Style lock, shipping readiness, and `docs/history/` (past handoffs, kept for provenance). |
| `research/` | The mathematics rounds behind the physics. |
| `REPORT.md` | The lab notebook: laws, constants, measured numbers. Append; do not rewrite. |

## Commit style

One change per commit, imperative subject line, body says what was measured. The
changelog is generated from tags and `REPORT.md` headings by `node tools/changelog.mjs`.
