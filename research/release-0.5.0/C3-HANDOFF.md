# C3 · hand-off (wave 205) — PAUSED by Agent Control (usage 94 %), mid step 2

| | |
|---|---|
| task | 0.5.0 C3 — the rack, transport, menubar, keys and keyboard onto MIR 1.5.0-alpha.24 (`research/release-0.5.0/BRIEF-C3.md`) |
| worktree | `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-ab53b6b1093934d5b` |
| branch | `worktree-agent-ab53b6b1093934d5b`, from `f0fcbc4` |
| servers | none running (8883 and 8887 killed by pid 3935636 / 3935658; no geckodriver left) |

## Commits
1. `8e55952` `0.5.0 C3 · the design hand-off` — `research/release-0.5.0/C3-DESIGN.md` (decisions: the transport stays λWAVES-built, §4;
   brief P is the PAINT GESTURE and the kit has no `paintStroke` at alpha.24, so it stays open; the WORKSPACE record stays v3) and
   `tools/a4-window-probe.mjs` (A4's parity probe, copied).

2. `124f691` `WIP 0.5.0 C3 · step 2, the rack is the kit's createRack` (UNVERIFIED: history RED, four gates not run).

## Lines
`cat lab/*.js | wc -l`: 30,553 (`f0fcbc4`) → 30,119 (`124f691`), **−434** (rack.js 5,495 → 5,170; rack-menus.js −110; sw.js regenerated).

## Step 2 (the rack) — committed as WIP `124f691`
- `lab/rack.js`: `createRack` adopts `#rack #rackL #floats` + the ◧ + ☆ chrome (`favourites: 4, handle: 'never', tabletClamp: false,
  phone: isPhone, retired, notebook`, a store adapter on `settings.layouts` that rewrites a kit-captured slot as captureLayout's v3);
  every `.dev` registered IN PLACE with its `device()` result (a `DEVICES` map: `device` wrapper at the top of `boot`, import
  `device as kitDevice`) — registering the bare element made the kit re-click `.dev-fold` inside a programmatic `.click()`, which
  the browser drops (click-in-progress flag): BRIEF candidate R6; TRANSPORT `card: true` (+ its pop chip and `onFold` save);
  HISTORY registered where it is built; the `layout` verbs are aliases over the kit (captureLayout v3 + `layoutExtras` for
  docked / more / core / the transport card); the + list prunes `hidden` cards (R5); the ☆ LOAD re-applies the extras (R4);
  `moveFloat` = dock + float in the same layer seat (R1); `parkedIds` read one resize listener ahead of the kit (R2); the hands,
  the rack half of the peek, the float/z/clamp helpers and the phone crossing's card/float moves deleted; `rk.start()` before
  `syncPhone()` at boot; `devopen` also saves settings; an own-style/class observer on `#floats`/racks dirties occlusion.
- `lab/rack-menus.js` deleted (`git rm`); `lab/sw.js` regenerated (`node tests/pwa.test.mjs --write`); `tools/c3-eval.mjs` (a
  one-shot page probe, diagnostic) added.

## Tests on the working tree
- parity probe base vs tip (`.tmp/probe-base.json`, `.tmp/probe-tip.json`, diff `.tmp/probe-diff.txt`, 220 lines): every
  difference is one of — float `z` (the kit's ONE raise stack), a home index counting VISIBLE windows (the hidden TRANSPORT card
  no longer counts), `dockIndex` read on the settled rack, and their fallout in rack order; one WINDOW-row hint (WIGNER's status)
  looks timing-dependent — re-run to confirm.
- `frame-occlusion` 7/7 (one timing red on the first run at the paused rack-drag check; 3 re-runs alone green) · `menubar` 9 PASS
  lines rc 0 · `input` 13 · `offer` 17 PASS lines rc 0 · `new-project` 8.
- **`history` RED (rc 1, 1 pass / 1 fail) — not yet read**: `.tmp/run-history.browser-test.log`.
- not yet run: `hit-probe-set` (`LW_PORT=8883 node tools/hit-probe-set.mjs`), `tools/settings-probe.mjs`, `node tools/new-project.mjs
  --check`, the node gate on the tip (baseline on `f0fcbc4`: exit 0, no RED).

## Exact next step
Restart `python3 tools/gate/server.py <worktree> 8883` (and 8887 on `.tmp/base`), read `.tmp/run-history.browser-test.log`, fix the
history red, run hit-probe-set + settings-probe + new-project --check + `bash test.sh node`, then commit the fix as
`0.5.0 C3 · the rack is the kit's …` (on top of the WIP) with this file updated.  Then step 3 (createMenubar; transport stays, C3-DESIGN §4), step 4
(keys + keyboard window + tests), step 5 (lines, wave 205, C3-BUILD.md).
