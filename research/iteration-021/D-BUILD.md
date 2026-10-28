# 021 chain D — THE INSTRUCTIONS (Opus builder, worktree agent-a2722ae4debcaea59, branch it021-D, BASE 2031041 = yan-c)

## D0 `6881a71` THE TWO SUITES (both GREEN; history 45 PASS, menubar, keyboard-window GREEN)
- molecule-head "an undo back to WATER showed its head" — the TEST: since I1 Escape is the registry's stack, read from `e.code`
  (`lab/actions.js:193`, `if (e.code !== 'Escape' …)`; at BASE the head's own listener read `e.key`, molecules.js:118 @ 4710985). The suite's
  synthetic `new KeyboardEvent('keydown', { key: 'Escape' })` (line 76) had no `code`, so N₂/NH₃'s head stayed (fades 1). Now it carries
  `code: 'Escape'`; a real key has both.
- timeline T1 — the TEST: TIMELINE is `WINDOW › TOOLS › TIMELINE` since I3 (a kit submenu). T1 opens TOOLS, finds the row in its
  `.mb-sub-list` and taps it. T2 was red only because T1 left the TIMELINE closed (the ruler had no box).
- timeline T11a/T11b — the APP, a real bug from chain I: `lab/mapping.js:86` registered every surface action as a modulation target
  `action.<id>` whose `get` was `+!!r.get()` for a toggle, so the registry's resync moved its BASE with the act's state; the kit recorder's
  resume signature counts every base (`mir/render/recorder.js:149`), and the film itself flips MOD (`action.modarm` 1 → 0) and GOVERNOR
  (`action.settings.governor` 0 → 1) — RESUME WITH MATCHING PROJECT was refused ("colours, rack or parameter bases changed"); T11b's leftover
  RESUME row followed. Fix: the target's `get` is 0 (an act's base is not its state; `fire` still compares the live state in `actions.fire`).

## D1 `9d0c6bd` BUILD_LINE → `lab/build-line.js`
facade.js, notebook.js and mir-gui.js import it there (mir-gui no longer handed it: `createMirGui(app)`); rack.js holds a one-line pointer and
no import; only `main.js` imports rack.js. `tools/perf/main-thread.mjs` reads the line from `/lab/build-line.js` (the sha still rack.js'); the
index.html comment names build-line.js. No cut script is tracked (the 0.5.0 one lived in an untracked `.tmp/`); nothing in tests/ greps rack.js
for the line (tests/legacy reads `__LW.build`). Cycles (`npx --no-install dependency-cruiser --no-config --include-only '^lab' --output-type json
lab | node .tmp/g/cycles.cjs`, the counter rewritten from G's): **circular edges: all 37, app 0** (G left 4). `./test.sh node` green;
rack-deps HOLDS (persist 24/25, spectrum 17); THE LOCK `--check --query gastab=0` **843 · 0 · 0**, 0 page errors; lw-facade GREEN.

## D2 `28851d3` THE SPLIT
CLAUDE.md: **18,903 words / 621 lines → 1,147 words / 88 lines** — what λWAVES is and where things live; the kit sentence still on line 6 (every
"CLAUDE.md:6" citation holds); THE STANDING CONSTRAINTS; THE GATES (the exact commands, the browser suites by area, the gate-enforced laws
cited by gate); THE INDEX (one line per file + NOTES §6–7, STATE-SCOPES, FOR-MIR, the map, the PLAN). `docs/laws/` (each: a plain heading, a
one-line note, "The laws of 021" where 021 has one, then the paragraphs verbatim in their old order):
architecture 1,942 · chemistry 2,001 · control-surface 1,241 · field-and-lock 1,951 · film 424 · iterations 1,943 · kit 556 · legacy 314 ·
look-and-camera 468 · modulation-and-timeline 790 · nodes 781 · picker 2,110 · register-and-systems 2,152 · scopes-and-records 933 · shell 1,656 ·
stage-words 1,729 = 19,844 (+ CLAUDE.md 1,147 = 20,991). Spread: 020's line by subject (S → stage-words, T → control-surface, L → field-and-lock,
X → nodes; the head stays in iterations); 015's line (M → picker, S → register); 0.5.2 R0's paragraph (THE CONTEXT → architecture, THE LOCK
SAME-MACHINE → field-and-lock). The 016 board, 017 and 018 stay whole in iterations.md (cross-subject lists). Seated 021 laws: K (kit + the clone
road), G (graph, windows, OPS → architecture; owner sheets → control-surface; CHORD → modulation), R (ONE STORE + R1 + R6 FORGET → scopes; ONE
TIME → modulation; THE IDS + R6 → nodes; ONE MODE → chemistry), I (registry, menus → shell; corrected keyboard paragraph), V (icon table → shell;
the bar under any float, the sheet → control-surface), D0/D1 (the action base, build-line.js), THE LAWS OF 021 → iterations.
Also `docs/NOTES-FOR-AGENTS.md` §6 (the LOCK's 860/1004 → 843/987) and §7 (CLAUDE.md is two pages + docs/laws). §7's kit line and FOR-MIR:3
already cite CLAUDE.md:6, which holds the sentence; kit.md seats the same sentence.

## SUPERSEDED (dropped or corrected; every one of laws-diff's 18)
1. MOLECULES (old 34–43, six sentences: "MOLECULES and MO-REGISTRY sit…", "…brings them back… (MO-REGISTRY too…)", "TWO MODES, ATOMS | MOLECULES",
   "each mode HIDES… ATOMS: SPECTRUM…", "MOLECULES: the one MOLECULES card…", "Its REGISTRY ON switch…") → rewritten to R5 (HYDROGEN | MOLECULES,
   ids `molecules`/`hydrogen`, the MODE table, `molSession.selected`, claim then moleculeMode); the REGISTRY ON line was superseded by old 49–53.
2. THE ICONS of 012 I1 (three fragments: lab/img/icons, the + list's CSS mask) → superseded by V2's ICON TABLE (shell.md).
3. The keyboard paragraph (five fragments: "the menubar is createMenubar over MENUS", "the transport stays λWAVES'", "Keys are MIR's ONE KEY TABLE
   via key-table.js (ACTIONS…", "The KEYBOARD window… painted by lab.css §KEYBOARD", "The ACTIONS rows in lab/shell/keys.js…") → key-table.js over
   the kit's `lab/mir/keyboard`, the rows of `lab/actions.js`, `lab/mapping.js`, `lab/keymap.css`, the kit's transport (014 A0).
4. "The 32 `!important`…" (three fragments) → the grep's count today: **39** (skin 25, lab 11, nodes 3; csb, keymap 0).
5. "The keyboard editor's stacking (`#keymap`…) is λWAVES' own in lab.css" (no `#keymap` exists since 0.5.0 C3) → keymap.css (G6).

## laws-diff (`node tools/laws-diff.mjs 2031041`, run once; 23 lines; not a gate) — tail
    old CLAUDE.md @ 2031041: 869 sentences, 18903 words
    old sentences found in no new file: 18
      LOST · MOLECULES and MO-REGISTRY sit on the first-run LEFT rack under INFORMATIONAL and SPECTRUM;
      … (the 18 are the SUPERSEDED list above, item for item; nothing else) …
      LOST · four left with C6b's banner and warning pane).
      LOST · The keyboard editor's stacking (`#keymap` fixed at `--z-veil`, `[hidden]` none) is λWAVES' own in `lab.css`.

## The app map's kit lines, corrected (for the integrator; DATABASE is read-only here)
- 47: `8. **UI kit = MIR** (`lab/mir/**`, vendored, written by MIR's `adopt.mjs` alone — THE KIT SENTENCE, CLAUDE.md:6: 1.5.5, and every λWAVES
  need an additive door `1.5.6-alpha.N` with its FOR-MIR line; 1.5.6-alpha.3 today): `el, knob, seg, sw, trig, readout, group, fader, stepper`
  from `lab/mir/kit.js`; λWAVES' look is `lab/lab.css` + `lab/skin.css` (+ the owner sheets `csb.css`, `keymap.css`, `nodes.css`).`
- 57: `# edit lab/… (never by hand under lab/mir/** — adopt.mjs writes it; never lab/fonts/**)`
- 84: replace "never edit `lab/mir/**` or `lab/fonts/**`" with "`lab/mir/**` is written by `adopt.mjs` alone (a door is `1.5.6-alpha.N` on the
  clone road, docs/laws/kit.md) · `lab/fonts/**` untouched"; the rest of the line stands. Add an index row: the laws are `docs/laws/*.md`.

## Open questions
1. D0's fix leaves the MAPPING's toggle targets at base 0: an LFO on a toggle now follows its level from 0, never from the act's state (the act
   still runs only when the state differs). Fine, or should `action.*` stay out of the film's signature through a kit `canonical`/filter door?
2. kit.md holds the kit sentence twice (its 021 head and the moved line-6 paragraph) — verbatim moves; trim the head to a pointer if preferred.
3. Older paragraphs still mention retired seats in passing (lab/img/icons/*.svg, the + list, `nodes-icons.svg`, `ids atoms | molecules`); each
   file's note says the later law wins — a sentence-by-sentence refresh is a later pass, not done here (verbatim law).
