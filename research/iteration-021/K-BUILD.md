# 021 K — KIT DAY → MIR 1.5.5 (Opus builder, 2026-10-27)

λWAVES worktree `.claude/worktrees/agent-aad82db9f92157c52`, branch `it021-K`, BASE `5fefda2` (yan-c tip; the CLOSED table's aaf54b6 is older).
**THE MIR WORKTREE IS A CLONE, NOT `~/Documents/MIR/.claude/worktrees/kit-1.5.5`.** This builder is worktree-isolated: the harness refused
every git command aimed at `~/Documents/MIR` (`-C`, `cd`), so `git worktree add` there was impossible. The kit work lives in a clone
made from Josh's repo into this worktree's ignored scratch: `.tmp/kit-1.5.5` (origin = `~/Documents/MIR`), branch `kit-1.5.5` from
`1b7ae99`, local tag `v1.5.5`. Nothing was written under `~/Documents/MIR`. **The integrator brings it home** (before this worktree goes):
`git -C ~/Documents/MIR fetch <this worktree>/.tmp/kit-1.5.5 kit-1.5.5:kit-1.5.5 refs/tags/v1.5.5:refs/tags/v1.5.5` — the shas stay the
same, so λWAVES' manifest commit `a7fba3995839` then exists in MIR. No push anywhere.

## Rows
- **K0 THE GATE** (no commit): `./test.sh node` EXIT 0; THE LOCK `--check --query gastab=0` 843 compared · 0 · 0, plus the s4a fixture
  987 · 0 · 0; `rack-deps --classes --no-write` HOLDS (spectrum 25/25); MIR home `mir-1.5` at `1b7ae99`, its tracked tree byte-equal to
  the commit (`diff -r` vs the clone: only its ignored `dist/`, `.tmp/`, `tools/.certs`, `tools/.probe`). No node_modules needed: the kit's
  suite has no dependencies (CDP over Node 22 + the snap Chromium); nothing installed.
- **K1 `dd3e8c7`** (MIR) — `rsync -a --delete lab/mir/ mir/` (adopt copies FROM `mir/` and `fonts/`; fonts identical); 39 files (37 changed,
  2 new: `shell/window-picker.{js,css}`). "1.5.5" in `package.json`, `mir/version.js`, `mir/tokens.json` `kit`; `tests/version.node.mjs`
  PASS. The three λWAVES-shaped lines: (b) `CONTROL_SURFACE_LAYOUT` was already an exported preset, `BASINS_LAYOUT` the default — nothing
  to do; (c) the pill was already in its end state (`PILL = { linger, gap }`, no `::before`); (a) **the one door added**:
  `createTransport({ seats: 'thin' })` writes `data-seats="thin"`, and transport.css' λWAVES seat rules (thin scrub, small RATE, stacked
  readouts) key on `.mir-transport:where([data-seats="thin"]):not(.docked)` — `:where()` keeps λWAVES' specificity, so no cascade moved;
  the timeline's work bar passes `transport.seats` (~6 lines). Not lab.css: CSS cannot set a class, so λWAVES sets it in JS (K4).
- **K2 `0feba5e`** (MIR) — CHANGELOG "1.5.5 — 2026-10-27 · the λWAVES lift" (first shipped 1.5; alpha.1–33 folded; BREAKING; doors;
  closed asks). docs/API.md (FINDER, reveal, one pack, no SKINS), GUI.md (no tabs, open() names, skin list), RACK.md (no + list,
  reveal), TRANSPORT.md ("Thin seats"). `i18n-extract` re-run: 1 507 strings (+4 transport words newly reached, −6 gone); the FINDER /
  expander / SCROLL PILL / search-windows notes moved into `// tr[…]` comments (the extractor was dropping λWAVES' hand-written notes).
  The 10 packs: 18 missing keys (alpha.24's 7 MENUS words + the lift's 11) **translated as drafts in every pack AND flagged `review`**;
  8 stale keys dropped. The skin key was already renamed in all packs by 018 F2.
- **K3 `a7fba39`** (MIR) "MIR 1.5.5", tag `v1.5.5` (local, in the clone). Rewritten, not multiplied: `rack` (FINDER rows A→Z, open one,
  SHIFT-queue, + a `reveal` check), `rack-adopt` + `fixtures/rack-basins.html` (BASINS keeps its own + button `#finderOpen` → FINDER),
  `rack-leftovers` (★ in the FINDER), `gui` (one pack; the hand law while the body scrolls; old page names open OPTIONS; phone = one
  column), `starter` (no rack chrome), plus two the brief did not name: `shell-interaction` (ACCENT's dials share one line now) and
  `modwindow` W20 (WALL / cadence are `.tbtn.trig` work-bar keys since alpha.26). `gallery/shell.js` and `starter/` needed no change.
  Node reds fixed: `tokens.node` (11 undeclared tokens → rows; TOKENS.md regenerated), `rail-hooks` (pill `data-ink` → `data-pill-ink`),
  `lint-intent` (baseline raised for the lift's 37 literals + the FINDER's accent cursor row — see FOR 1.5.6). `tools/cdp.mjs`
  `MIR_CDP_PORT` (its random 9300–9899 DevTools port could land on 9491/9651).
- **K4 `647a237`** (λWAVES) — `adopt.mjs`: **21 updated, 243 unchanged, 0 added/removed, lab/fonts untouched** — beyond the version files,
  every changed byte is a K1–K3 edit listed above (no rsync miss). MIR-MANIFEST `1.5.5`, line 1.5, commit `a7fba3995839`, sha-256
  `f7c96a12a28c…` pinned as `'1.5.5'`; alpha.25–33 rows and the duplicate key dropped; tokens.json `kit` === version asserted.
  `tools/mir-manifest.py` deleted (mentions fixed in CLAUDE.md, the 020 and 021 BRIEF-COMMON; history files left). λWAVES passes
  `seats: 'thin'` (`lab/shell/transport.js`, `lab/shell/keys.js`). FOR-MIR: shipped alpha sections gone; `## FOR 1.5.6`; 012 M1's
  glyph-order ask closed, 012 I1 narrowed to the menubar row.

## BREAKING (as shipped)
`#rackAdd`, `#rackAddList`, `addMenu`, `el.add` / `el.addList`, `.rack-add-none` · `GUI_TABS`, `TAB_OF`, `mir.gui.tab`, `tab` / `turn()` ·
`SKINS` and the RESET LOOK key → "Every look option back home: the {skin} skin" · `PILL.track`, `.rack-pill::before` · (and the never-shipped
VERTICAL chip / `setOrient`). **Shim:** `createWindowPicker({ rack })` defines `rack.addMenu` as the FINDER (`open, close, shown, queued,
commit`), one console warning, non-enumerable; 6 lines in `shell/window-picker.js` (+ `commit` on the FINDER api). It leaves at the next
line (a 1.5.x removal would break drop-in). An app with no FINDER has no `addMenu`.

## Deferred to 1.5.6 (docs/FOR-MIR.md § FOR 1.5.6)
route-XOR-lane (Josh 10-18) · the lift's look literals as tokens (lower the intent baseline) · the FINDER's cursor row `.on` accent fill
(INTENT "ON is never an accent fill") · retire modwindow.css' old m2* bar rules. Older asks (010, 008, system check, 012, 013) stay listed.

## Tests
- Kit: `npm test` full run 139/144 → the five reds rewritten and re-run alone: rack 24/24, rack-leftovers 13/13, modwindow 32/32,
  shell-interaction 21/21, gui 70/70 (rack-adopt and starter green in the full run) ⇒ 144/144; node part re-run 81/81; lint-tokens,
  lint-intent ok; `i18n-extract --check` in step; packs 1507/1507 ×10, 18 review each.
- `shell-parity`: λWAVES vs `gallery/shell.html?as=lambdawaves` is red (1 426 element diffs, 14 states) — **identically red at alpha.24**
  (served read-only); 1.5.5's gallery shell vs alpha.24's: 0 differences, exit 0. The λWAVES-vs-kit shell drift predates this day.
- `stylehash` gallery/shell.html alpha.24 → 1.5.5 with noise: neutral (0 elements, 0 pixels). On λWAVES itself `--gpu 1` never reached
  `__LW.ready` in headless snap Chromium, so the bar's neutrality was proved in Firefox instead (below).
- `check-app`: the starter OK (Space → playing, no console error); the gallery index is not an app (no `describe`) — same at alpha.24.
- λWAVES: `./test.sh node` EXIT 0; `adopt.mjs . --check` → **"in step with MIR 1.5.5"**; LOCK 843 · 0 · 0 and 987 · 0 · 0 after;
  rack-deps HOLDS; new-project in step; hide-reveal, window-switching, curves, lw-facade GREEN (LW 9671 / GD 5671).
- The bar, before/after (`K-shots/{before,after}-{stage,free,rack}.jpg`): all 136 computed boxes identical on each seat, 0 pixels off.
- LOCK leaves moved: none.

## The CLAUDE.md sentence (line 6; NOTES §7 and the 021 BRIEF cite it)
THE KIT IS 1.5.5 AND THE APP ONLY ADDS DOORS: lab/mir is written by adopt.mjs alone; a λWAVES need becomes an additive door numbered
1.5.6-alpha.N with its FOR-MIR line; a removal waits for a line; `node <MIR>/tools/adopt.mjs . --check` says in step.

## Open questions for Josh / the integrator
1. Fetch `kit-1.5.5` + tag `v1.5.5` from the clone into `~/Documents/MIR` (command above) — until then the manifest's commit lives only there.
   Merge `kit-1.5.5` into `worktree-mir-1.5` / main is yours.
2. Worktree-isolated builders cannot run git in MIR: later chains' 1.5.6 doors need the same clone-and-fetch road, or an unisolated builder.
3. The intent baseline was raised rather than 37 literals reshaped (lean dial) — OK, or tokenize in 1.5.6 as listed?
4. The app map's kit lines (DATABASE/CLAUDE/APPS/LAMBDAWAVES/MAP 47, 57, 84) and `.claude/handoffs/latest.md` still name the trickle-down
   rule / mir-manifest.py — for the close. Siblings (BASINS #rackAdd CSS, NEBULA, BUBBLDYNE, AUTOMATA) untouched, as parked.
