# ITERATION 029 — THE PERFORMANCE PASS (Claude Yan, integrator on `yan-c`; Josh 2026-10-30)

Josh's word: `PROMPT.md`. 028 closed at d5688af7 (the review, the six chains, the tree at its 1.0 gate). 029 makes the modulated lab USABLE
before the beta: measured first, then fixed in the order of the measurement, every speedup with its number, no pixel moved.

## WHAT IS KNOWN (before measuring — hypotheses, not findings)
- The modulation engine is the KIT's (`lab/mir/modulation/`: mod.js 3,151 lines · window.js 3,437 · host.js 1,140 · bind.js 434 · audio-capture.js
  264) under the law THE KIT IS 1.5.5 AND THE APP ONLY ADDS DOORS: a kit-side speedup is a DOOR 1.5.6-alpha.18+ built on the clone road
  (docs/laws/kit.md), adopted by adopt.mjs, with its FOR-MIR line — never a hand edit of `lab/mir/**`.
- The app's port is `lab/mod-port.js` (204 lines): `setKnob(k, v)` writes every routed knob through the DOM each tick (`k.show(v)` / `k.set(v)`),
  the cadence is 60 Hz (`cadence.hz`), `routeDots` walks `document.querySelectorAll('[data-param]')` (017 F6 named the 400 ms interval; now a rAF);
  `lab/shell/modulation.js` (343) seats the targets (a modulated `material.style` / `material.view` presses a seg button).
- The 028 review (dimension 5, headless Firefox, ratios only): worst rAF gap 283 ms with 73 lanes; longest task 124 ms inside a film; heap flat;
  "headless compositors dominate; headed Chromium got SwiftShader" — nobody has measured the real screen. Josh has: "super laggy".
- 017's perf rows (research/iteration-017/P-BUILD.md, X-BUILD.md): the steady timers, the rack's layout observer stamping every card, the things
  that made WAVE DANCER feel fine while the rest stuttered ("a sticky setting").
- The AUDIO device is MICROPHONE-ONLY (the kit's privacy law; `audio-capture.js`: one FFT of 2,048 bins at 48 kHz per feed); the timeline's
  audio CLIPS are analysed offline (`audio-analysis.js`, 100 Hz envelopes) — the STAR LOOP demo rides those. A headless benchmark feeds the
  AUDIO device from `media/star.mp3` through a fake capture (the port's `audio` factory is injectable: `installModulation({ audio })`,
  bind.js:105) or plays STAR LOOP's clip lanes; both are measured.

## THE LAW OF 029 (to docs/laws/iterations.md at the close)
EVERY SPEEDUP HAS ITS NUMBER (before and after, the same probe, the same scene; p50 · p95 · p99 of the frame and the tick); THE LOCK NEVER
MOVES (843/0 · 987/0 after every row — a speedup that changes a pixel is a style, not a speedup); THE KIT MOVES BY DOORS (alpha.18+ on the
clone road, one FOR-MIR line each); IDLE COSTS NOTHING, AND A HIDDEN KNOB COSTS NOTHING (the port writes only what is on screen and only
when the shown value would change).

## M0 — THE INSTRUMENT (one Opus agent, read-only but for `tools/perf/` and `research/iteration-029/`)
`tools/perf/mod-profile.mjs` on the gate kit (headless Firefox, the RTX): opens a project (WAVE DANCER demo · STAR LOOP demo · Josh's export
when it lands), arms modulation, PLAYs 30 s at 1080p in four scenes — (a) the modulation window CLOSED, (b) OPEN, (c) the AUDIO device live
on a fake capture fed from `media/star.mp3` (the drop, 36–66 s), (d) 73 lanes (the 028 stress scene) — and samples per frame: the rAF gap,
the modulation tick's ms (the port's `onAdvance`/the host's step wrapped), `setKnob` calls and distinct knobs written, DOM mutations
(MutationObserver, subtree), long tasks (PerformanceObserver), JS heap; reports p50/p95/p99 and the TOP OFFENDERS (a `performance.mark`
budget per subsystem: tick · knobs · window paint · field present · chem). Then ONE headed Chromium trace on the RTX (`/snap/bin/chromium
--enable-unsafe-webgpu --ignore-gpu-blocklist --enable-features=Vulkan --use-angle=vulkan --ozone-platform=x11`, display :0, 30 s, CDP
Tracing via `tools/perf/cdp.mjs`) for the real categories: scripting · style/layout · paint · GPU — the window WILL appear on Josh's screen
for 30 s; said before it does. Output `research/iteration-029/M0-MEASURE.md`: the numbers, the offenders ranked by ms per frame, and the
proposed rows M1…Mn each with its expected gain and its side (app / kit door). No fix in M0.

## M1 … Mn — THE FIXES (cut from M0-MEASURE.md; one Opus builder at a time; merge order by measured gain)
Candidates the measurement will confirm or dismiss (NOT a to-do list): the port writes a knob only when its shown value changes and only if
the knob is on screen (IntersectionObserver / the card's open state) · one DOM write batch per tick, never per lane · the modulation
window's lane scopes at their own cadence and only while visible (kit door) · the tick's allocations (kit door: typed arrays reused) ·
`routeDots` never on the hot path · the governor's floor and `cadence.hz` under load (a 30 Hz modulation cadence when the frame is late,
said in METERS) · the seg-press targets (material.style/view) debounced · the field's uniform upload once per frame, not per param ·
the audio FFT's bin count/feed cadence · the layout observer's stamping (017). Each row: the probe before/after, THE LOCK, the modulation
proofs (`node tools/x-probe.mjs x4` byte-identical CURVES; `flash-routes` node; `routed-knob` · `curves` · `lfo-tension` browser).

## Q — THE FRONT END QUICK FIX (Josh 10-30, "029 FRONT END"; one builder; with the M rows, file-disjoint from them)
The main menu (the Picker): the empty space between the search bar and the tags goes; the tag lines are TWO rows with a VISIBLE horizontal
scroll bar (the kit's scroll pill if it has one, else the house scrollbar); the room won goes to the molecule thumbnails, which read cramped.
Files: `lab/picker.js`, `lab/skin.css`/`lab.css` (the Picker's seats; label-only — no CSS hook renamed). Proof: `picker-looks` and `library`
browser suites, one before/after shot pair at 1440 × 900 in `research/iteration-029/Q-shots/`; no stored key, THE LOCK untouched (no field change).

## R — THE REPO FINALIZATION (Josh 10-30: "get ready to push 0.9.9 BETA"; LAST, after every code row, one builder; Josh reviews before any push)
1. ONE VOICE: every public-facing text (README, CONTRIBUTING, SECURITY, DEPLOY, RELEASING, CHANGELOG's hand parts, NOTICE, CITATION, docs/*.md
   that ship, the ABOUT and the hints) reads as an engineering repository's — plain, formal, no agent register ("the law of", "Josh's word",
   "Claude Yan", "the fleet"), no first-person speech written for Josh. The AI disclosure: AI_POLICY.md goes; README keeps two or three
   sentences (the lab was built with AI coding agents under the author's direction; the physics, tests and gates are the proof; see LEGAL-PROVENANCE)
   — nothing in Josh's voice that Josh did not write. The internal instruction set (CLAUDE.md, docs/laws/, docs/NOTES-FOR-AGENTS.md) keeps its
   register: it is for agents, and the laws' names are its index — but it says so in one line at the top of CLAUDE.md.
2. ONLY THE APPLICATION: `research/` (29 iterations of PLAN/BUILD notes, shots, scores), `REPORT.md`'s wave notebook, docs/history/, the
   store/ drafts, `serve-lan.*`, `.claude/handoffs/` — each either SHIPS (it serves a user or a contributor), MOVES to the vault
   (`~/Documents/DATABASE/CLAUDE/APPS/LAMBDAWAVES/RESEARCH/`, which already exists; git history keeps every byte, a tag
   `research-archive-2026-10-30` marks the last tree that held them) or is DELETED (junk, random texts). The builder writes the table first
   (path → ships / moves / deleted → why) in `research/iteration-029/R-REPO.md`; JOSH READS THE TABLE BEFORE THE MOVE (CALL 4); the laws and
   CLAUDE.md that cite moved paths are rewritten to cite the vault or the tag. `media/star.mp3` is Josh's copyrighted track: it never ships
   (verify .gitignore; move it beside the vault's FILMS if the repo must not even hold it ignored).
3. THE LAYOUT: top level = README · LICENSE · NOTICE · CHANGELOG · CITATION.cff · SECURITY · CONTRIBUTING · CODE_OF_CONDUCT · package.json ·
   wrangler.jsonc · lab/ · tools/ · tests/ · docs/; DEPLOY, RELEASING, LEGAL-PROVENANCE, SHIPPING-READINESS, ACCEPTANCE-MATRIX under docs/release/;
   every path a tool or a test reads is moved WITH its reader (grep before move; `./test.sh node`, `node tools/build-deploy.mjs`,
   `node tools/changelog.mjs --check` green after). GitHub side (gh is logged in as magic-commons; the GitHub MCP is not connected): the
   repository description, topics, the README's badges only if they are true (no CI badge for a workflow that never ran); nothing pushed —
   the push is Josh's.
4. THE SWEEP: knip's 14 deliberate keeps, 0 unused files, dependency-cruiser 0 cycles, `npm audit` 0 — restated in RELEASING.md's release-day
   list as the beta's checks; the tag `v0.9.9-beta` is cut by Josh's word (CALL 2) after this row.

## CALLS FOR JOSH
4. The R-REPO.md table (ships / moves / deleted) before anything moves — the default if you say "go": research/, REPORT.md's notebook,
   docs/history/ and the handoffs MOVE to the vault; store/ drafts move; AI_POLICY.md is folded; serve-lan.* ships under tools/.
1. Export "002 WAVE DANCER" (FILE › EXPORT) to `research/iteration-029/002-wave-dancer.lambdawaves.json` — the exact scene becomes the benchmark.
2. The beta's name: `v0.9.9-beta` at the cut (default), or `0.9.9` plain.
3. "Usable for everyone": the target machine for the numbers — default: the RTX at 60 Hz AND a software-GPU/integrated profile (Chromium
   SwiftShader or `--use-angle=swiftshader`) as the floor; the laptop/iPad rows stay UNVERIFIED without a device.

## CLOSED
| row | base | commit | note |
|---|---|---|---|
| M0 | e9034304 | c1aed92f | THE INSTRUMENT tools/perf/mod-profile.mjs + M0-MEASURE.md: Josh's panel 120 Hz; scene c p95 present 16.5 ms on his screen; STAGE → paintMarks 1.34 ms/frame (47 % of JS); the mutation flood 3.1 ms/frame; setText wakes three observers + a forced layout; rows M1–M5. Two Chromium windows appeared on his screen. |
| M1 + M5 | c1aed92f | MERGED | M1: look.paintInk() re-inks the header λ only (kit public accent.markInk); setStage idempotent on an exact equal (no rounding: a modulated STAGE would quantise a pixel). Scene c tick p50 5.44 → 1.40 ms · mutations 4,378 → 1,825/s · JS 69.6 → 41.6 ms/s · one stage write 1.74 → 0.04 ms; scene e tick 20.5 → 18.4 ms. M5: no code — registry.js:373 snaps and skips an equal step; the adapters compare; counts prove it (palette.index 37 of 69 ticks). LOCK 843/0 · 987/0; suites green; x-probe x4 identical; rack-deps HOLDS; test.sh node EXIT 0. FOR-MIR: accent.paintInk() (a door; with it the app's paintInk is one call). Candidate left: one energy update per shell-rate write (n7 = 49 recomputes, 0.76 ms) — "don't add". Note M-BUILD.md. |
| M2 + M3 (+ M1 door) | c2fb743c | ec5a2014 | KIT DOORS on the clone road: alpha.18 setText writes data (childList records in scene c 385 → 1/s; the dock observer's book 284 → 62 calls/s; control-help 564 → 5/s in b) · alpha.19 the modulation window writes only what changed (window paint 11.0 → 6.9 ms/s; look byte-identical by DOM + screenshot digest) · alpha.20 accent.paintInk() (look.js one call). Adopt 0/6/0, in step with 1.5.6-alpha.20; manifest pinned. Scene c mutations 1,825 → 706/s, JS 42.6 → 35.7 ms/s; b 1,680 → 239/s; e 2,349 → 1,936/s. LOCK 843/0 · 987/0; routed-knob · curves · lfo-tension · keyboard-window · menubar · official-defaults-palette · window-switching · render-regressions green; x-probe x4 identical; kit node 82/82 (full 142/146, three pre-existing + one launch flake); rack-deps HOLDS; test.sh node EXIT 0. Bundle .tmp/it029/kit.bundle (head kit-1.5.5 @ 27d4f1e): `git -C ~/Documents/MIR fetch <bundle> kit-1.5.5:kit-1.5.5-029`. OPEN FOR-MIR: live band hints (~560 rewrites/s). CLAUDE.md:6/:14 and kit.md moved to alpha.20 by the integrator. Note M23-BUILD.md. |
| Q | e97669c8 | MERGED | The gap was the third tag row (the head row 74 px, its other items 34): two rows now (paintTags), the rail's scrollbar visible (the rack's thin bar, not a new design; the kit's scroll pill is for vertical rack scrolls), deck(view, 16) on desktop (10 → 16 px gaps; 1920 × 1080 loses a column, 32 → 28 a page). Shots Q-shots/{before,after,after-1280,after-1920}.jpg. picker-looks · library · start green; test.sh node EXIT 0; no LOCK (no field change). OPEN: tests/molecular-names.browser-test.mjs RED since I3 THE MENUS (expects WINDOW rows, now submenus) — a stale suite, re-aim in R; iPad portrait rail room (Josh's call); the MOLECULAR tab keeps 10 px gaps. Note Q-BUILD.md. |
| M4 | f062794b | measured | Headed Chromium on the 120 Hz panel, scene c BEFORE → AFTER M1–M3: present p95 16.5 → 14.2 ms · page JS p50 3.3 → 0.9 ms/frame · mutations 282 → 6/frame · main thread busy 75 % → 55 % (scripting 12.6 → 7.2 s of 30). UNCHANGED: paint/composite 5.7 s (Layerize 3.3 s ≈ 1 ms/frame — the frost layer tree) and the GPU process at 38 s top-level in 30 s. Scene b (nothing written): p95 9.4 ms, 117 dropped frames vs c's 460. THE REMAINING STUTTER IS THE GPU AND THE COMPOSITOR, not script. Note M4-MEASURE.md. |

## M6 — THE OPTIMIZATION SYNTHESIS (Josh 10-31: "another optimization pass… inspect MIR options… a cheaper UI setting + hidden UI… the stutters are the biggest issue… hope for that performance eureka"; one Opus agent, measured on Josh's screen — he has said yes to the windows)
Measure on the real GPU, then design: (a) the field under modulation — autoScale, the march steps, half-res + upscale while a parameter moves, the FIELD CLOCK cap (MAX · 30 · 60) as it stands; (b) the compositor — FROST (refractive, backdrop-filter) vs TINTED vs SOLID vs blur off vs the interface hidden, each a number; (c) a 60 Hz present cap on the 120 Hz panel — steadiness vs rate, measured; (d) the kit's own cheaper paths (docs/laws/look-and-camera.md, the look store, MIR's FROST/TINTED/SOLID laws in memory). Output: M6-SYNTHESIS.md — the table of levers × cost (ms/frame on the RTX, and what each would mean on an integrated GPU), the PERFORMANCE setting as ONE honest control (e.g. QUALITY · BALANCED · LIGHT: the look, the blur, the field cadence, the present cap bundled; a PREFERENCE RECORDS row; the kit side as FOR-MIR doors), and the rows M7… each with its expected ms and its proof (the probe, THE LOCK unchanged — a quality tier that moves a pixel is a STYLE the user chose, never the default). The eureka, if there is one, is measured before it is believed.
| R | 81343d6a | MERGED | R1 the table R-REPO.md (SHIPS 55 — 14 relocated inside the tree · MOVES 20 — 3,227 research files, REPORT.md, docs/history/, five dated docs, store/, .claude/handoffs/ · DELETED 3) + tools/release/archive-research.sh (dry-run; `--apply` needs the tag research-archive-2026-10-30; rehearsed in a throwaway clone, every gate green after) — NOT APPLIED, JOSH READS FIRST (CALL 4) · R2 one voice (README in an engineering register, the AI disclosure three third-person sentences, AI_POLICY.md folded into CONTRIBUTING/README/LEGAL §1a and deleted; the agent register out of every public text; CLAUDE.md line 2 names the instruction set) · R3 docs/release/{DEPLOY,RELEASING,LEGAL-PROVENANCE,SHIPPING-READINESS,ACCEPTANCE-MATRIX}.md, tools/serve*.{sh,py}, the 178 research files gates read moved with their readers (tests/fixtures incl. THE LOCK's s4a; tools/library/census; tools/oracles; docs/conductor/examples); changelog.mjs reads docs/WAVES.md else REPORT.md, release tags only · R4 molecular-names re-aimed at the submenus (green) · R5 RELEASING's release-day list with today's numbers (knip 14 keeps · 0 files; 0 cycles; npm audit 0 in the repo, 0 high + 5 moderate under @electron/packager 20.3.0 — only a forced major downgrade offered, left). Gates: test.sh node EXIT 0 (116 suites, also with research/ moved aside); build-deploy rc 0; changelog/provenance/pyscf-table --check; LOCK 843/0 · 987/0 on the moved fixtures; molecular-names · menubar · start · lw-facade green. FOR JOSH: CALL 4 (the table), the GitHub description/topics line (R-REPO §7; nothing set), the public side branches with agent-handoff subjects, CALL 2 the beta tag, tests/legacy/ optional. Note R-BUILD.md. |
