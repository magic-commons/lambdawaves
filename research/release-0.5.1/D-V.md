# D-V · THE VERIFIER OF 0.5.1 "Informational Update" — the report (2026-10-09, a fresh Opus 5.5 verifier, for Claude Yan on `yan-c`)

## Verdict: FIT WITH NOTES (to cut 0.5.1-alpha "Informational Update")

**No BLOCKER; three SHOULDs.** Everything the plan gates on is green. Both cumulative pairs against `v0.5.0-alpha` are inside the
3.536 ms/s noise gate: boot **Δ +0.116**, D1's scene **Δ +0.227**. THE LOCK is 860 · 0/0 and 1004 · 0/0. `lab/*.js` is **27,657**, every BUILD
ledger exact. The `__LW` law holds per commit. The idle witness is 0 records (AUTO-ROTATE and a pointer sweep), and placement is 9/9 with the
TIMELINE docked. CURVES is screen-only by its picture's sha. Every suite on C-V's list and every new one is green or classified, including
C-V's two not-verified closers: camera-routes is SAME on all five projects, and serialize-bytes has its `edit` scope 11/11 identical. The three
SHOULDs:
- **S1 (D10-19).** THE FLASH GUARD can leave the picture held off the registry's value, with METERS still saying "held", once the modulator goes
  constant mid-hold (3/3; base 0/3).
- **S2 (D10-24).** `tests/legacy/boot` has a second law red, B127. The CURVES card's PRESET stepper is a 7th `aria-live` seat, the admitted kind;
  the law must be told (a test-only re-aim).
- **S3 (pre-existing, both trees).** `gpu-recovery` does not hold on this rig: TIP 5/8 red, BASE 4/7, the headless-Firefox rAF stall.

The notes:
- The open TIMELINE halves the frame rate. That is 0.5.0's: the base reads the same.
- A hand on a ROUTED dial is held by the guard, which the guard's sentences say never happens.
- CLAUDE.md lines 9, 184, 113 and 200 contradict the tree.
- C₆₀'s head wraps and shows a raw underscore.

None of these is a frame-path or data defect. S1 and S2 are a few lines each for a fix round.

| | |
|---|---|
| worktree · branch | `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-aeb9cc04c6e4b735f` · `worktree-agent-aeb9cc04c6e4b735f` |
| tree verified (TIP) | `69458d8` (`git reset --hard 69458d8`): `v0.5.0-alpha` + Group I — D10-19 `064f3b0`, D10-F `d058d6f`, D1 `76b1d5e`, D10-24 `e623e37`, D2+D8 `69458d8`, each with its docs |
| BASE | the tag `v0.5.0-alpha` = `f478482` (`git tag -l 'v0.5*'` lists it — U10); `git archive -o .tmp/base.tar v0.5.0-alpha` → `.tmp/base`. `27eb96a` (D1's base) differs from it only by `CHANGELOG.md` (`git diff --stat v0.5.0-alpha 27eb96a`) |
| servers (stopped by pid at the end) | `tools/gate/server.py` HTTPS 9023 = TIP (pid 1987864), 9027 = BASE (pid 1987886); geckodriver 5493 / 5497. Served rack.js sha-256: BASE `1f688467216239e1` (= D1's base), TIP `bd395304b9d4f028` on every run |
| harness | One browser at a time. Before every run `.tmp/rig.mjs` (load < 4; no geckodriver, no `chrome`, no marionette Firefox) then `tools/perf/wait-gpu.mjs`; waits were 0 s throughout (the integrator ran nothing while I measured). Scripts in `.tmp/` (untracked): `pairs.mjs`, `tlfig.mjs`, `sum.mjs`, `suites.mjs`, `p-witness.mjs`, `p-guard*.mjs`, `p-curves.mjs`, `p-lwkeys.mjs`, `p-tlplaces.mjs`, `p-live.mjs`, `p-audio.mjs`, `current-dbg.mjs` (a copy of `tests/current` with one print), `p-legible.mjs`, `lines.mjs`, `lwdiff.mjs`, `rig.mjs`; `p-lib.mjs` adapts D1's (read-only) |
| the rig, honestly | **A DESKTOP Firefox (not a test browser: no marionette, an RDD media process) started at 18:29:57 CDT** — during round 3 of the pairs — and ran for the rest of the session. It is no geckodriver and no load (load stayed 0.3–3.2), but it is a second GPU user. Rounds 1–2 of the pairs were before it; every later run (rounds 3–5, the lock, the TIMELINE figure, every suite) shared the GPU with it. §2 reads the pairs both ways |
| not edited | nothing under `lab/`, `tests/`, `tools/`; nothing merged, pushed or tagged |

## 1 · The closers (each once; a timing red re-run alone once)

TIP `LW_PORT=9023 GD_PORT=5493` unless named; every browser suite through `node .tmp/suites.mjs <list>` (one at a time, the rig law before each,
logs in `.tmp/s/<name>.log`).

| # | closer · command | output | verdict | re-run? |
|---|---|---|---|---|
| 1a | the pair, BOOT scene · `node .tmp/pairs.mjs 5` | BASE 42.333 (1.639) · TIP 42.449 (2.535) · **Δ +0.116 ms/s** (§2) | GREEN | — |
| 1b | the pair, D1 scene (`--setup` D1's scene, `--sweep 10`) | BASE 65.015 (6.353) · TIP 65.242 (3.099) · **Δ +0.227 ms/s** (§2) | GREEN | — |
| 1c | the TIMELINE open + playing, TIP · `node .tmp/tlfig.mjs 5` | **39.917 ms/s at 12.8 presents/s** vs closed 42.618 at 24.1 (§2; no gate) | figure | — |
| 2 | THE LOCK · `node tools/perf/digest-lock.mjs --check --query gastab=0` · `… --fixture research/release-0.4.0/measure/digest-lock-s4a.json` | **860 · 0/0** · **1004 · 0/0**, page errors 0 | GREEN | — |
| 3 | node gate · `bash test.sh node` | **exit 0**; 81 suites + pwa; 943 GREEN/PASS lines, 0 RED. Inside it: `access` 0/11, `first-run` 0/12, `render-exact` 0/40, `keyboard-shortcuts` PASS (the Ctrl-vs-Mod case), `project-formats` 8 judged lines, `mir.test` 0/103, `mir-manifest` "all 262 adopted files match … 3f969725fe44", **`flash-routes` PASS**, **`molecule-head` GREEN (38 records + H₂O/N₂ live)**, `pwa` 347 files · 6.72 MiB (1.28 MiB under), `wiring` 234/251 reachable, 17 kit modules unreached (R5-W1) | GREEN | — |
| 3 | R1 `frame-occlusion` | **7/7** | GREEN | — |
| 3 | R2 `tools/settings-probe.mjs` · `new-project` · `node tools/new-project.mjs --check` | **0 of 6 scenes red** · **8/8** · "in step (16117 B)" | GREEN | — |
| 3 | R3 `history` | **44/44** | GREEN | — |
| 3 | R4 `offer` | **16/16** | GREEN | — |
| 3 | R6 `take-in-bugs` · `routed-knob` | **4/4** · **0 failing of 4** | GREEN | — |
| 3 | R7 `official-defaults-palette` ("palette 3") | **3/3** | GREEN | — |
| 3 | R8 `keyboard-window` · `menubar` | **8/8** alone (the first run stopped after 7 PASS on a DRIVER error: `POST /session/…/url -> 500 … Failed to decode response from marionette`) · **8/8** | GREEN | keyboard-window once (driver) |
| 3 | R9 ids · `grep -rn "data-mir-\|data-lw-" tests \| wc -l` | **38** (BASE 38) | GREEN | — |
| 3 | R10 `project-formats.browser-test` | **5/5** | GREEN | — |
| 3 | R12 / R15 · `node ~/Documents/MIR/.claude/worktrees/mir-1.5/tools/adopt.mjs <tree> --check` | "**in step with MIR 1.5.0-alpha.24**" | GREEN | — |
| 3 | R14 `gpu-recovery` | **RED 5 of 8 on the TIP and 4 of 7 on the BASE**, always the same assertion: `Render did not settle: animation frames stopped` (`frame-settle.js:9`) at a boot/reload step; 10/10 when it passes, on both trees | **RED (flaky, pre-existing)** | 7 more TIP, 7 BASE (S3) |
| 3 | `tools/hit-probe-set.mjs` | **71 presses through a kit window's gap, 0 reached the stage** (the two CURVES scenes among them) | GREEN | — |
| 3 | `film-handover` · `mir-controls` · `camera-shift` · `molecule-demos` · `render-regressions` | **4/4** · **2/2** · **11/11** · **5/5** · **2/2** | GREEN | — |
| 3 | `current` | **15/15** five times; **RED twice** (the first two TIP runs) at `longMeters` (the modulation window's AUDIO tracks `width >= 220`; they measure 222 × 24) — BASE 5/5 green | GREEN (flaky; N14) | 6 more TIP (one a `.tmp` copy with a print), 5 BASE |
| 3 | **`tools/camera-routes.mjs`** (C-V's not-verified) · BASE `--out` then TIP `--against` | **5 projects GREEN**; routes, bases and law **SAME** as the BASE on all five | GREEN | — |
| 3 | **`tools/serialize-bytes.mjs`** (C-V's not-verified) · BASE and TIP `--out` (+ `--texts`) | **`edit` scope 11/11 identical**; the full bytes **+81 B on all 11**, and the only difference is the CURVES card's WORKSPACE row `{"id":"curves","side":"R","folded":false,"closed":true,"off":false,"float":null},` (as D10-24 predicted; N13) | GREEN (edit) | — |
| 3 | `film-probe` BASE + TIP · `tools/perf/film-compare.mjs` | **exit 0**: picture 97,824 B identical; 25 frames, pixel hashes and times identical; ONE PERIOD 180 digests + MP4 953,793 B identical; RECORD 180 + 743,644 B identical; verify "DETERMINISTIC" both | GREEN | — |
| 3 | NEW `stage-text` (D1, re-aimed) | **4/4**: KaTeX `$1s_{0}$ and $2p_{0}$`; 12 ticks → 0 renders, 0 layout reads; 10 strings in 303 ms → 3 renders, the last landed; one banner (22 px) and back (34 px), 0 on undo/link/project; the names; the letters 0 writes still, 1 after a turn; the caption | GREEN | — |
| 3 | NEW `molecule-head` browser (D2) | **3/3**: WATER solved in 172 ms, its head 0 ms later; a press at 2.65 s takes it; N₂ (D∞h, 3σg) on Escape; 0 heads on 2 undos, a link, the water demo, STAGE TEXT off | GREEN | — |
| 3 | NEW `lw-links` (D8) | **5/5**: `lw:view=density` one row one fade no tab; `lw:molecule=h2o`; `lw:molecule=nh3&orbital=lumo` (4a1 · LUMO); `lw:s=abc` 0 rows, "ignored: s"; an https link still opens its tab | GREEN | — |
| 3 | NEW `curves` (D10-24's suite) | **7/7** | GREEN | — |
| 3 | `opener` **alone** | **7/7** | GREEN | — |
| 3 | `timeline` (last) | **14/14** in 280 s | GREEN | — |
| 3 | **`tests/legacy/boot` alone** | **150 of 152**; RED **B149** (the expected kit law red) and **B127** (NEW: the CURVES card's PRESET stepper is a 7th `aria-live` seat; S2). B70, B71, B78 (D10-F) GREEN; B6 ×2, B22, B23 GREEN | **RED (one unexpected law red)** | the cause measured directly (`.tmp/p-live.mjs`: TIP 7 seats, BASE 6) |
| 4 | the `__LW` law per commit (§5) | 0 member paths removed from tests/tools; at runtime only `stageText.place` gone (no reader); D1 re-aimed its suite in the same commit | GREEN | — |
| 5 | lines (§4) | **27,657**; every ledger exact | GREEN | — |
| 6 | CLAUDE.md (§6) | the 0.5.1 paragraphs true but for two exceptions in THE FLASH GUARD (S1, N3); C-V's N3, N4, N5 resolved, N1 and N2 half (N4, N5 here) | NOTES | — |
| 7 | the legibility PNGs (§8) | 10 PNGs in `research/release-0.5.1/d-v/legibility/` | taken | — |
| 8 | the idle witness (U2) · `.tmp/p-witness.mjs` | **A: 0 records**, `debug().running` false (letters 41 writes, yaw +2.51 rad) · **B: 0 records**, false (letters 102) — and 0 / 0 / 0 under 10 s of TIMELINE play (§2) | GREEN | — |
| 8 | placement U3, TIMELINE docked · `.tmp/p-witness.mjs` | **9/9 clear** (shift +1/−1/0 × transport floating/docked/top; TIMELINE 364–1300 × 552–992) | GREEN | — |
| 9 | the flash guard in the app · `.tmp/p-guard.mjs`, `p-guard2.mjs`, `p-guard3.mjs`, `p-guard4.mjs` | held + said; ZOOM free; HUE free; power off / pause restore; **a held route stuck when its modulator goes constant (S1)**; **a hand on a routed dial is held (N3)** | GREEN with S1, N3 | the stuck case 3/3 + base control 0/3 |
| 10 | CURVES screen-only · `.tmp/p-curves.mjs` | picture sha equal graded / neutral; `filter: none` at neutral; PREFERENCE survives a reload; a demo open leaves the blob byte-identical outside WORKSPACE | GREEN | — |

## 2 · The cumulative pair against `v0.5.0-alpha` (G-M), and the TIMELINE-open figure

`node .tmp/pairs.mjs 5` — per round boot-base · boot-tip · d1-base · d1-tip, each `LW_PORT=<9027|9023> node tools/perf/main-thread.mjs --runs 1`
(the D1 scene adds `--setup "<D1-BUILD.md §measure step 1, verbatim>" --sweep 10`), a fresh headless Chromium per run, the warm-up navigation,
`field ok · NVIDIA GeForce RTX 3070` and `notice dismissed` on all 20, 0 held frames on all 20; every D1-scene run answered
`{"mol":true,"view":"orbital","homo":5,"auto":true,"stage":true,"md":"$\\mathrm{H_{2}O}$"}`. Raw: `.tmp/pairs/*.json`, summary `node .tmp/sum.mjs .tmp/pairs boot-base boot-tip d1-base d1-tip`.

| scene | BASE `v0.5.0-alpha` median (spread) · runs | TIP `69458d8` median (spread) · runs | **Δ median** | gate 3.536 | presents/s base → tip |
|---|---|---|---|---|---|
| **BOOT** (the tool as it is) | **42.333** (1.639) · 43.292 42.333 42.534 41.653 41.956 | **42.449** (2.535) · 43.293 42.449 43.576 42.146 41.041 | **+0.116 ms/s** | **PASS** | 24.96 → 24.32 |
| **D1** (H₂O · ORBITAL · HOMO · AUTO-ROTATE · STAGE TEXT on · 10 s sweep) | **65.015** (6.353) · 63.587 64.613 69.249 65.015 69.940 | **65.242** (3.099) · 64.486 63.679 66.778 65.242 66.392 | **+0.227 ms/s** | **PASS** | 18.29 → 17.65 |

- **Both inside the noise gate**, cumulative over all of Group I. D1-BUILD read −0.109 / −0.368 against `27eb96a` (D1 alone); this reading carries
  D10-19, D10-F, D10-24 and D2+D8 too. Attribution (script · layout · recalc, ms/s): boot 16.66 · 0.69 · 0.31 → 16.47 · 0.70 · 0.30; D1 19.54 · 4.14 ·
  9.14 → 19.49 · 4.23 · 9.12.
- **The desktop Firefox (header).** It arrived during round 3's boot-tip run. Rounds 1–2 alone (a quiet GPU): boot 43.292 / 42.333 vs 43.293 / 42.449
  (Δ of the means +0.06), D1 63.587 / 64.613 vs 64.486 / 63.679 (−0.02) — the same answer. Presents/s fell by ≈ 1 in BOTH arms from round 3 on
  (boot 25.1 25.0 | 25.0 24.3 24.4 base, 25.0 24.8 | 23.2 24.3 23.8 tip; D1 18.9 18.8 | 17.0 18.3 16.7 base, 18.8 18.8 | 17.4 17.6 17.1 tip): in the quiet
  rounds the frame rate is the same on both trees (25.1/25.0, 25.0/24.8; 18.9/18.8, 18.8/18.8), so the −0.6 presents/s in the medians is the visitor,
  not 0.5.1. The D1-scene base spread (6.35) is that visitor's too (rounds 3 and 5).
- **(c) THE TIMELINE OPEN AND PLAYING** (C7b's open item; no gate): `node .tmp/tlfig.mjs 5`, the TIP only, interleaved closed / open, the open arm's
  `--setup` = WINDOW › TIMELINE (`__LW.timeline.open()`, docked at the foot 364–1300 × 552–992, the pill dodged to the top) + one clip placed
  (`timeline.model.create({ targetId: 'material.hue', value: 0.5, start: 0, duration: 64 })`) + THE play.

  | TIP, boot scene | median ms/s (spread) · runs | presents/s | per present | script · layout · recalc (ms/s) |
  |---|---|---|---|---|
  | TIMELINE closed | **42.618** (2.007) · 42.705 41.569 40.794 42.801 42.618 | **24.09** | 1.77 ms | 16.53 · 0.70 · 0.31 |
  | **TIMELINE open + playing** | **39.917** (1.949) · 39.856 39.917 39.643 41.592 40.187 | **12.79** | **3.12 ms** | 11.46 · 1.59 · 1.53 |

  **The open TIMELINE halves the frame rate (24.1 → 12.8 presents/s) and costs the main thread +1.35 ms a frame** (layout ×2.3, style ×5); ms/s
  reads LOWER only because half the frames are gone. **It is 0.5.0's, not 0.5.1's:** the BASE presents 12.4 frames/s in the same scene
  (`.tmp/p-tlplaces.mjs` on 9027: 124 frames in 10 s; the TIP 123), and on the TIP D1's layer does nothing under it — 0 re-placements, 0 KaTeX
  renders, 0 mutation records on `layer.root`, 0 `hidden`/`style` writes on the timeline root over 10 s of TIMELINE play.

## 3 · THE LOCK (once, on the TIP)

| command | values | readback diffs | record-byte diffs | page errors | time |
|---|---|---|---|---|---|
| `LW_PORT=9023 GD_PORT=5493 node tools/perf/digest-lock.mjs --check --query gastab=0` | **860** | **0** | **0** | 0 | 57 s |
| `… --check --query gastab=0 --fixture research/release-0.4.0/measure/digest-lock-s4a.json` | **1004** | **0** | **0** | 0 | 58 s |

Both `DIGEST LOCK GREEN`, `unrepeatable now: none`; RETIRED h2, h2plus, helium (D9/D9b) as expected. No re-run needed.

## 4 · Lines (G-L)

`cat lab/*.js | wc -l` = **27,657** (BASE 27,594): **+63**; soft bar 29,000 (**1,343 under**), hard bar 30,000 (2,343 under). Every BUILD ledger is exact
against the merge it rode in on (`node .tmp/lines.mjs v0.5.0-alpha 27eb96a 064f3b0 d058d6f 76b1d5e e623e37 69458d8`, read from git objects):

| merge | row | `lab/*.js` | Δ | the BUILD said |
|---|---|---|---|---|
| `064f3b0` | D10-19 | 27,614 | +20 | +20 ✓ |
| `d058d6f` | D10-F | 27,614 | 0 | 0 ✓ (+22 CSS in skin.css, no JS) |
| `76b1d5e` | D1 | 27,558 | −56 | −56 ✓ (stage-text.js −132; 97 files) |
| `e623e37` | D10-24 | 27,577 | +19 | +19 ✓ |
| `69458d8` | D2+D8 | 27,657 | +80 | +80 ✓ |

`git diff --numstat v0.5.0-alpha 69458d8 -- lab`: rack.js +167 −16, mod-port.js +22 −2, latex-state.js +21, chemview.js +6 −4, look.js +3 −9, key-table.js ±1,
settings-store.js +2 −1, sw.js +16 −10, stage-text.js −132; lab.css +8 −15, skin.css +24 −2. Nothing in `lab/mir/**` (`adopt.mjs --check`: "in step with
MIR 1.5.0-alpha.24"). The merges are clean: `git show --cc` on the five merge commits shows no hunk in any non-generated `lab/` file that differs from
both parents (no evil merge).

## 5 · The `__LW` law, per commit since `v0.5.0-alpha` (C-V §4's method)

- **Tests and tools** (`node .tmp/lwdiff.mjs v0.5.0-alpha 69458d8`, every `__LW.<path>` in `tests/` and `tools/` from git objects): **760 → 774
  member paths, 0 removed**; new: `curves.{filter.describe,points,preset}`, `head{,.md,.shown}`, `notebook.mode`, `stageText.{banner,layer,layer.root.*,md,stats.announced}`.
- **At runtime** (`.tmp/p-lwkeys.mjs` on both ports, two levels): BASE 174 top-level / 1,216 paths, TIP 176 / 1,242. **Gone: `stageText.place` only** —
  no test or tool read it at the base (`grep -rln stageText .tmp/base/tests .tmp/base/tools` → `tests/stage-text.browser-test.mjs` alone, which reads
  `md`, `renders`, `on`). New: `chem.pick`, `curves.*` (the model), `head.{bye,md,shown,want}`, `stageText.dismiss`, `stageText.layer`.
- **Per commit** (`git show --stat` on each of the 11 non-merge commits that touch `lab/`): `5ccd238` D10-19 (no `__LW` change; `tests/flash-routes.test.mjs`
  added) · **`0f7915a` D1 — `stage-text.js` deleted, `place` dropped, `layer` added, `tests/stage-text.browser-test.mjs` re-aimed IN THE SAME COMMIT**, every
  other witness kept (`stats.renders/announced/places/labelWrites`, `md`/`formula`/`banner`/`on`, `setFormula`, `announce`, `atomLabels`, `setOn`,
  `setScale`) · `aaeb88e`, `52e51aa` D1 (internal) · `f768355`, `cdb1af8` D10-F (no `__LW` change; `__LW.bow`, `ui.bowKnobs`, `.bow-*` kept; the boot suite
  re-aimed in the same commits) · `5ef0fec` D10-24 (`curves` added with its suite) · `7903399`, `e5250ff`, `f9028a5`, `7e38b12` D2+D8 (`head`, `chem.pick`,
  `stageText.dismiss` added with their suites; chemview's spectrum `pick` untouched — the hand's is `handPick`). **GREEN.**

## 6 · CLAUDE.md against what I measured

The integrator applied D1's paragraph, D2's HEAD sentence, D8's `lw:` LINKS paragraph, D10-19's FLASH GUARD paragraph and D10-24's CURVES paragraph
(`git diff v0.5.0-alpha 69458d8 -- CLAUDE.md`); C-V's N1, N2 and N5 were edited at the 0.5.0 cut (they are in the base too). Line numbers are the TIP's.

| line(s) | the claim | measured / read | verdict |
|---|---|---|---|
| 88–90 | THE STAGE TEXT is ONE block of the kit's layer, `createInfoLayer` in `rack.js` `initStageText`; `lab/stage-text.js` is gone | `ls lab/stage-text.js` → absent (−132 in `0f7915a`); `rack.js:2076–2079` one `createInfoLayer({ stage, parallax: false, drift: false, follow: false, avoid })`, no subject/features/labels | ✓ (C-V **N3 resolved**) |
| 92–94 | never told of a camera move; `viewChanged()` only for the racks, the transport, the TIMELINE; idle it writes nothing | `rack.js` `place()` observers (body classes, `#transport` class, timeline root `hidden`/`style`). **Re-measured:** 0 records on `layer.root`, `debug().running` false, 0 re-placements, 0 renders over 10 s of AUTO-ROTATE (the letters wrote 41×) and over 10 s of a 40 moves/s sweep (102×); and 0 / 0 / 0 over 10 s of TIMELINE play (§2) | ✓ |
| 95–96 | the key is the string; KaTeX ≤ 4/s; nothing added while off (root `hidden`) | `KATEX_MS = 250` (`rack.js:2077`); `setOn` writes `layer.root.hidden`; `stage-text` suite 4/4 | ✓ |
| 96–99 | the kit's look and seat (top + 12 %, between the racks, clear of the undocked transport and an open TIMELINE); z 20 < 30; never a target; never in the mask | `lab.css:790` `.mir-info.lw-stage { z-index: 20 }`; the block at 765–835 × 118–167 (1600 × 1000, centred between the racks). **U3 re-measured with the TIMELINE docked: 9/9 clear** (shift +1/−1/0 × floating/docked/top; tops 163–212, 77–126, 163–212) | ✓ |
| 99–102 | THE FADE: a HAND's preset as the block for 2.4 s; never on restore/undo/project/link | `announce(md, ttl = 2400)`; `stage-text` suite 4/4 | ✓ |
| 102–109 | THE HEAD (D2): a HAND pick shows four lines, every number the record's stem or the live solve's; never the blurb or CURATED_IE; held until Escape / a press after 2.5 s / the next pick; never on restore/undo/project/link/demo | `molecule-head.test` GREEN (38 records + H₂O/N₂ live); the browser suite 3/3; the legibility shots' heads carry the record's numbers (benzene `E = −227.891006`, `21 occupied of 36 AO · D_6h`, `gap 0.5516 E_h = 15.01 eV`; C₆₀ `180 occupied of 300 AO · —`) | ✓ |
| 109–110 | HOLD (I), the kit's `infoActions` row; `key-table.js` carries `up` | `rack.js:3887` (`key: 'KeyI'`, `shift: false`, `run`, `up`); `key-table.js:41` | ✓ |
| 113–114 | "The older `atomLabels` / `atomLabelsSize` keys are read once … and dropped" | only `atomLabels` is read (`rack.js:246`); `atomLabelsSize` is read nowhere in `lab/` (the same at the base) — it is dropped, never read | NOTE (pre-existing; N6) |
| 114–118 | the type scale (34 / 22 px, `--info-size-body` in `lab.css`, ≤ 8 vw, ≥ 16 px; letters 14 px); the CAPTION, "D5, Group II, replaces it" | `lab.css:790–791` `clamp(16px, 8vw, 34px)` / `22px` × `--lw-stage-size`; `TYPE.body → 14` in `atomLabels`; legibility geo: 34 px Spectral, ink `rgb(20,21,31)` light / `rgb(248,246,241)` dark | ✓ (C-V **N4 resolved**; `rack.js:2049`'s comment still says "KIT BRIEF 6 replaces it" — a code comment, N11) |
| 8–11 | "while MOD is armed the modulation follows every edge of it" | `rack.js:423` `appPlay.onChange((on) => mod.follow(on))` — "every play edge, the power on or off"; lines 242–246 say the same; C-V's take-in-bugs measured the modulation playing with MOD power off | NOTE (C-V **N1 half-fixed**: LINKED gone, "while MOD is armed" stays; N4) |
| 182–184 | the paragraph after THE START begins "AUTO on is a project default" | the 0.5.0 cut removed the stray line "DOMAIN" (C-V N2) and with it the subject: the sentence was "DOMAIN AUTO on is a project default" | NOTE (C-V **N2 half-fixed**; N5) |
| 212–216 | `lw:` LINKS: a WHITELIST (preset, molecule + MOLECULES on, view, orbital), one ring row `LINK · <text>` and one fade a press; other keys ignored and said; `lw:s=` never a verb; capture-phase click on `.nb-view` | `rack.js:3465–3492` exactly so (an unknown key or value → `bad`, said on `.nb-count` for 2.4 s; no `statelink.js` road); `lw-links` suite 5/5 | ✓ |
| 259 | "The 32 `!important`s stay unlayered (23 in skin.css, 9 in lab.css …)" | `grep -o '!important' lab/skin.css lab/lab.css \| wc -l` = **36**, of which 4 are inside comments (skin.css:40, the trailing comment of skin.css:239, lab.css:15, lab.css:247); declarations **23 + 9 = 32**; the same at the base; D10-F added none | ✓ (C-V **N5 resolved**) |
| 282–288 | THE FLASH GUARD's LIMITER: four routes, each in its own space, a MODULATOR's route held to 3/s on the modulation clock, said in METERS; hue and every other route never held; "(a hand's write and a stop's restore are never held)" | `mod-port.js` `guardRoutes` exactly four `FLASH_STEP` routes; `flash-routes.test` PASS. **In the app:** a 10 Hz square on EXPOSURE held to 17 reversals in 3 s (≤ 5 in any second) while ZOOM on the same macro ran free (48; ≤ 18/s); METERS `FLASH GUARD · EXPOSURE 10.0 Hz held to 3/s`; HUE at 10 Hz free (51 reversals, ≤ 16/s); MOD power off and THE pause restore the base and clear the line (4/4 trials). **But:** (a) a HAND's sweep on a ROUTED dial IS held (12 of 39 reversals passed, METERS tripped) — unrouted it is not (39 of 39, silent); (b) a modulator that goes constant while held leaves the picture off the registry's value and the line up (SHOULD S1) | ✓ with two exceptions (S1, N3) |
| 290–298 | THE CURVES CARD: screen only; neutral `filter: none`; closed after RENDER; PREFERENCE `lambdawaves.q0.curves`, never a project/link/history row | **Re-measured:** neutral `filter: none`, no record; an S-curve → `url("#mir-picture-1")` and the picture's sha-256 (`__LW.captureUI.capture.picture`) equals the neutral one (`bfc2be4aa8c29b12` both); a DEMO open (WAVE DANCER) leaves the settings blob byte-identical outside WORKSPACE (moved: `modwin`, `nbW`, `nbH` — all WORKSPACE) and the curves record byte-identical, the filter kept; a reload restores record + filter, the card still closed; `curves` suite 7/7. The 15.0 → 12.2 presents/s figure was not re-measured | ✓ |

## 7 · Findings, ranked

**No BLOCKER.**

| # | class | what | command · output | owner |
|---|---|---|---|---|
| S1 | **SHOULD** | **THE FLASH GUARD can leave the picture HELD OFF the registry's value, indefinitely, with METERS still saying it is holding.** When a modulator stops changing while the guard holds (the LFO source removed with its route kept — the same for any source that goes constant), the registry suppresses every later unchanged write (`registry.js` `applyModulated`: `Object.is(r.current, p) && was` → no publish), so the guard's `set` is never called again and its held number stays on the screen: the picture shows EXPOSURE 1.0 while the registry (and the modulation) say 1.5157, and the status line reads `FLASH GUARD · EXPOSURE … held to 3/s` with nothing moving. D10-19-BUILD §4's "clears a quiet second after the LFO calms" holds only while writes continue. Not a photosensitivity risk (the picture is still, at one of the LFO's own levels) and it heals on the next real change (a hand on the base, MOD power, THE pause) — but the instrument shows a number its modulation does not hold, and says a hold is on when none is. Suggested (not done): on a trip, re-apply the route's current value once the quiet window has passed (a timer on the trip, or `onRelease` → `d.set(registry.read(id))`), and clear the line there | `LW_PORT=9023 node .tmp/p-guard3.mjs` (the source removed at a moment `mat.exposure ≠ registry.read`): **3/3 trials STUCK** — at +0.3 s, +2.5 s and +6 s `{"mat":1,"regCurrent":1.5157,"modulated":true,"status":"FLASH GUARD · EXPOSURE 10.0 Hz held to 3/s"}`. Control on the BASE (`LW_PORT=9027 node .tmp/p-guard3.mjs`, no guard): the picture never left the registry (2,000 polls, 0 mismatches), 0/3 stuck. `.tmp/p-guard2.mjs` S1 (the source removed when the two happened to agree): the values agree but the line stays up ≥ 2.5 s (2/2) | D10-19 |
| S2 | **SHOULD** | **`tests/legacy/boot` has a second law red: B127, made by D10-24.** B127's ceiling on speech names exactly six live seats and fails a seventh by design ("a seventh seat, or a different kind, fails this line", the C7b re-aim). The CURVES card's PRESET is the kit's stepper, whose name is `aria-live="polite"` (`mir/controls/stepper.js:53`), so the card — closed, but in the DOM — adds `SPAN.mir-step-text` as a 7th seat. It is the admitted kind (written on a user's step, like the PALETTE's and the TIMELINE's steppers; `liveSpoke` stayed 0 while playing), so this is a law that must be told, not a product defect. D10-24 and D2+D8 did not run the boot suite; D10-F's run (150/152, B127 green) predates the card. Fix: the C7b re-aim's shape — name the seventh seat in B127 (`live === 7`, the kinds string) — a test-only row, or Josh rules the stepper's name silent | `LW_PORT=9023 GD_PORT=5493 node tests/legacy/boot.browser-test.mjs` → `RED boot.browser-test — 2 failing of 152` (B127, B149). `.tmp/p-live.mjs`: TIP `7 · DIV.km-status DIV.m2hint DIV.mir-banner DIV.tl-status SPAN.mir-step-text ×3` with the third `in curves`; BASE `6` (no curves) | D10-24 / integrator (the re-aim) |
| S3 | **SHOULD** (pre-existing) | **`gpu-recovery` does not hold on this rig, on either tree**: TIP red 5 of 8, BASE red 4 of 7, every red the same `Render did not settle: animation frames stopped` at a boot/reload step (headless Firefox stops rAF; D10-24's finding 7 saw the same). C-V read 10/10 on an empty rig; today a desktop Firefox shared the GPU throughout (N1). Not 0.5.1's (the rates match, interleaved), but the gate is not a gate here. Before the tag: re-run it on an empty rig, and/or let the reload step wait on frames returning rather than fail on the stall | `.tmp/suites-g.list` interleaved: BASE red, TIP red, BASE green, TIP red, BASE red, TIP green, BASE red, TIP green (plus TIP red, red, green, red and BASE green, green, red before) | C9 / the suite; the rig |
| N1 | NOTE | **The rig was not empty for most of the session**: a desktop Firefox (no marionette; a media decoder process) from 18:29:57 CDT on. The pairs read the same with or without it (§2: rounds 1–2 alone Δ +0.06 / −0.02); presents/s fell ≈ 1 in both arms. Every suite and the lock ran beside it; nothing red is attributable to it | `ps -o pid,lstart -p 2002078` → `Fri Oct 9 18:29:57 2026`; `.tmp/rig.mjs` prints `desktop firefox 1` on every run after it | — |
| N2 | NOTE | **The TIMELINE open and playing halves the frame rate** (24.1 → 12.8 presents/s; +1.35 ms main thread a frame). Pre-existing (C7b, 0.5.0): the BASE shows the same 12.4 frames/s. For the plan's open item and for Josh: an open TIMELINE costs half the picture on this rig | §2 (c); `.tmp/p-tlplaces.mjs` on both ports | C7b (0.5.x) |
| N3 | NOTE | **"A hand's write is never held" is true only of an UNROUTED dial.** On a dial a modulator routes, the hand moves the BASE and the modulator's next output carries the hand's motion through the guard: an ≈ 11 Hz hand sweep (40 real CDP drag moves in 1.7 s) on a routed EXPOSURE dial (a quiet 0.1 Hz LFO under it) is held, and METERS trips. CLAUDE.md 285–286 ("a hand's write and a stop's restore are never held"), CHANGES-0.5.1 ("Your own hand on a dial … never touched") and D10-19-BUILD §6 say otherwise. The behaviour may well be right (a 6 Hz flash is a flash whoever makes it); the sentences should say "on an unrouted dial", or Josh rules it | `LW_PORT=9023 node .tmp/p-guard4.mjs`: H0 unrouted `{"dragMs":1706,"rev":39,"say":[""]}`; H1 routed `{"dragMs":1743,"rev":12,"say":["","FLASH GUARD · EXPOSURE 11.3 Hz held to 3/s"]}` | D10-19 / integrator (wording) · Josh (ruling) |
| N4 | NOTE | CLAUDE.md line 9: "while MOD is armed the modulation follows every edge" — the modulation follows every edge armed or not (C-V N1, half-fixed) | `rack.js:423`; CLAUDE.md 242–246 | integrator |
| N5 | NOTE | CLAUDE.md line 184 begins "AUTO on is a project default": the cut removed C-V N2's stray "DOMAIN" and with it the sentence's subject ("DOMAIN AUTO") | `sed -n 182,186p CLAUDE.md` | integrator |
| N6 | NOTE | CLAUDE.md 113–114: "`atomLabels` / `atomLabelsSize` keys are read once" — `atomLabelsSize` is never read (pre-existing) | `grep -rn atomLabelsSize lab --include=*.js` → nothing | integrator |
| N7 | NOTE | **D10-24's finding 1, confirmed:** a returning browser whose saved `closed[]` predates the card sees CURVES (and RENDER) OPEN once; × closes it for good. Josh's own browser will meet it on its first 0.5.1 load | `.tmp/p-curves.mjs` `returning`: `closed[]` without `curves`/`render` → reload → `{"curvesClosed":false,"renderClosed":false,"filter":"none"}` | D10-24 / 0.5.x (a "ships closed" list) |
| N8 | NOTE | **The legibility reading (R6-I is Josh's):** every formula block reads in all six pictures; the heads read, but C₆₀'s wraps to a fifth line with the `=` left dangling ("gap 0.2798 E_h =" / "7.61 eV" — against the hand law's no-word-wrap), shows the stem's own words with a literal underscore ("HOMO (h_u ×5) · LUMO (t1u ×3)"), and runs across the lobes and the 60 difference-blended letters; on every head the gap's two numbers are set in two faces and sizes (`0.5516 E_h` KaTeX, `= 15.01 eV` Spectral text) | §8 | Josh (R6-I); D2 |
| N9 | NOTE | CHANGES-0.5.1's D1 line says the words sit "still": D1-BUILD U2 C measured the kit's pointer push (a pointer within 260 px parts the block ≈ 60 px; 749 style writes in 10 s). Not re-measured here (the witness's A and B cases are 0) | D1-BUILD.md §measure U2 C | D1 / Josh (brief candidate 4, a STILL block) |
| N10 | NOTE | G-U: `grep -rnE "\[!mir|ui:" lab --exclude-dir=mir` finds two hits, both JavaScript object keys (`rack.js:3775` `ui: uiSpace(…)`, `rack.js:4068` `ui: { stage … }`), present at the base too — no `ui:` callout and no `[!mir|` in any page | the command | — |
| N11 | NOTE | `rack.js:2049` (the caption's comment) still says "KIT BRIEF 6 replaces it"; CLAUDE.md now says D5 (Group II) | `sed -n 2049p lab/rack.js` | D5 (cosmetic) |
| N12 | NOTE | My guard probe's HUE arm shared its macro with the EXPOSURE route of the arm before (my script's design): HUE ran free (51 reversals, ≤ 16/s) while EXPOSURE on the same macro was held and named — the whitelist, shown on one macro | `.tmp/probes/guard.json` `hue` | — |
| N13 | NOTE | CLAUDE.md 200: "serialize()/restore() bytes never move (tools/serialize-bytes.mjs)" — the `edit` scope (the undo ring's record) never moved, 11/11; the full bytes moved by exactly one WORKSPACE row, the CURVES card's (+81 B on all 11). D10-24 predicted it; the sentence should say which bytes, or the probe's base be re-taken at the cut | `node tools/serialize-bytes.mjs --out … --texts` on both trees: the only inserted text is the CURVES layout row | integrator |
| N14 | NOTE | `current` went red twice on the TIP (its first two runs) at `longMeters` — a `width >= 220` bound on tracks that measure 222 px, read 250 ms after `addSource('audio')` while the modulation window is still sizing (the window box read 636 px wide on one tree and 1015 on the other at that moment) — then 15/15 five times; BASE 5/5. Read it as a 2-px timing margin in the suite (C4's window), not 0.5.1's | `.tmp/s/current.log`, `current-rerun.log` (red); `current-3/4`, `cur5/6`, `.tmp/current-dbg.mjs` (green, `trackW` 222 × 24) | C4 / the suite |
| N15 | NOTE | `keyboard-window`'s first run stopped after 7 PASS on a geckodriver/marionette transport error (`POST /session/…/url -> 500 … Failed to decode response from marionette`); alone it was 8/8 | `.tmp/s/keyboard-window.log` | — (the driver) |

## 8 · The legibility PNGs for Josh's R6-I look (`research/release-0.5.1/d-v/legibility/`)

**Taken** with the spike's recipe (CANARY-A0 PASS 2 §2): the gate's Firefox `g.snap()` (the driver composites the real page, the WebGPU picture
included; `field.ok` true in all three sessions), a 1400 × 900 window (viewport 1400 × 814, dpr 1), the clock paused, AUTO-ROTATE off, frost as shipped
(ALWAYS). `LW_PORT=9023 GD_PORT=5493 node .tmp/p-legible.mjs research/release-0.5.1/d-v/legibility`; the geometry and ink of every shot in
`legibility-log.json` beside them. **The subject is now the SHIPPED block** (not the spike's injected one): the stage text over hydrogen (`1s+2pz`),
benzene HOMO and C₆₀ HOMO (from its record) × light / dark — `<picture>-<theme>-stage-text.png` (6) — and, for the two molecules, THE HEAD after a
hand pick (`chem.pick`) in the same seat — `<picture>-<theme>-head.png` (4). Ten PNGs.

| picture | the block (34 px Spectral; ink `rgb(20,21,31)` light / `rgb(248,246,241)` dark) | my reading (a NOTE, not a verdict) |
|---|---|---|
| hydrogen · light / dark | `1s₀ and 2p₀` at 613–787 × 96–145 | **reads** cleanly; it sits above the picture, over the empty top of the stage |
| benzene · light / dark | `C₆H₆` at 658–742 × 96–145; the 12 atom letters on the nuclei | **reads**; the formula is clear of the lobes |
| benzene head · light / dark | four lines, `C₆H₆ · benzene` / `RHF/STO-3G · E = −227.891006 Eₕ` / `21 occupied of 36 AO · D₆ₕ` / `HOMO 1e₁g · gap 0.5516 Eₕ = 15.01 eV` | **reads**, above the lobes; the gap's two numbers are in two faces and sizes (KaTeX `0.5516 E_h`, Spectral `= 15.01 eV`) |
| C₆₀ · light / dark | `C₆₀` at 673–727 × 96–145 | **reads**; in the dark shot it touches the top orange lobe's edge |
| C₆₀ head · light / dark | `C₆₀ · buckminsterfullerene` / `E = −2244.018782 Eₕ` / `180 occupied of 300 AO · —` / `HOMO (h_u ×5) · LUMO (t1u ×3) · gap 0.2798 Eₕ =` / `7.61 eV` | **reads, the weakest**: it wraps to a fifth line (the `=` dangles), it runs across the upper lobes and the 60 difference-blended letters, and the record's own HOMO words keep a literal underscore (`h_u`) |

## 9 · What I did not check

- **An empty GPU.** A desktop Firefox shared the GPU from round 3 of the pairs on (N1). The pairs read the same in their quiet rounds; the lock is
  a digest, not a timing; but nothing after 18:29:57 was taken on an empty rig.
- **R5 / R13, the stylehash cascade** (8 states × the surfaces, base vs tip): not re-run. 0.5.1's CSS is D1's three `.mir-info.lw-stage` rules in
  place of `#molFormula`'s and D10-F's phone-only block plus two phone halos (`git diff v0.5.0-alpha 69458d8 -- lab/skin.css lab/lab.css`).
- **The M5 / WebKit / iPad**: nothing here (the CURVES cost and the layer on Josh's device are his reports). **M5 pending.**
- **CURVES' presents/s** (U9: 15.0 → 12.2 with an S-curve) was not re-measured; only the neutral `filter: none` and the screen-only law were.
- **U4 (the churn) and U5 (the fade)** were not re-measured by their own probes; the re-aimed `stage-text` suite covers both laws (3 renders for 10
  strings in 303 ms; one banner, 0 on undo / link / project), and D1-BUILD has the timings.
- **D1-BUILD U2 C** (a pointer sweep THROUGH the block parts it) was not repeated (N9); my witness ran A and B only.
- **THE HEAD under 6-31+G\***, a record molecule picked under that basis, and a head over a STAGE colour far from the theme (D1's brief candidate 5:
  the kit's ink follows the theme, not the ground) — not looked at.
- **D10-F's 49 hit-tests** were read only through B70 / B71 (green); `access` 0/11 in the node gate.
- **`tools/flash-calibrate.mjs`'s derivation** was not re-derived; `flash-routes` holds the lab's constants to it (PASS).
- **The `lw:` grammar beyond the suite's five links** (a malformed `%`, `homo-1`, a degenerate name, a number out of range) — read in code
  (`rack.js:3465–3492`), not driven.
