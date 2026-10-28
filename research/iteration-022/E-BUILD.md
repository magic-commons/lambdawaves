# 022 chain E — THE EDGES AND THE ICONS (Opus builder, worktree agent-adec31164c0ce485c, branch it022-E, BASE 9dc73892)

## E0 THE SUITES (df019af8) — five red at BASE, each green or explained
| suite | cause | fixed in |
|---|---|---|
| latex-copy :81 | EDIT's "COPY the state as LaTeX" is EDIT › COPY › LaTeX since 021 I3's submenus | TEST: `__row` walks a path ('COPY › LaTeX') as menubar's `__find` does |
| camera-shift (PAN HOME) | the test pressed the FIRST button reading "PAN HOME": since 022 H1 the MAPPING's action rows (`km-action-row`) read it too | TEST: CAMERA's own verb (`.dev[data-id="camera"]`) |
| take-in-bugs :95 | since 021 R5 MODE.wigner = 'hydrogen': WIGNER is HIDDEN under MOLECULES and computes nothing (window-activity `hidden`), so its status never turns | TEST: hidden, not closed, back on HYDROGEN (docs/laws/chemistry.md ONE MODE) |
| official-defaults-palette `aaHidden` | APP regressed in 022 H1: INFORMATIONAL's new ⓘ note gave it a LEAN Aa beside its STATUS Aa | APP: lab/window-chrome.js:20 — INFORMATIONAL takes no LEAN Aa (012 R1) |
| molecule-demos | not reproduced as "animation frames stopped": 1 red of 4 runs (WATER's demo, the first cold run), 3 green | the headless rig: `frame-settle.js` rejects after 3 s without a rAF; a cold worker start stalls it. Left |

## E1 THE EDGES (548ff13a) — kit 1.5.6-alpha.8
- **AVAILABILITY IS ONE LAW**: `availability(control, app) → { on, why, hide }` (lab/shell/settings.js:24, beside MODE): SPACE's MOMENTUM (MOLECULES,
  STURMIAN or a `noMomentum` operator — WELL, QUARKONIUM, ATOM, CENTRAL, SEPARABLE now GREY it; they only forced x before), Im ψ on a real
  molecular volume, the molecule-only rows (BALLS · STICKS · ESP, the ESP rows, INFORMATIONAL's ESP BAR). WAVE's `ui.availSync` applies it; its former
  owners ask it: spectrum.js switchHamiltonian and applySturmian, molecules.js moleculeMode, persist.js restore, the facade's `setSpace`.
- **A GREYED CONTROL KEEPS ITS HINT, why first** (`whyHint`, material.js): "off under MOLECULES · Momentum-space view of the state", "off in CLOUD"
  on a knob the style does not read. Kit door: a disabled knob/fader/switch/trigger takes the pointer on its root and refuses the press (a seg button
  had it since alpha.28). Pictures `E-shots/e1-hint-momentum.jpg`, `e1-hint-iso.jpg` (a real mouse; `elementFromPoint` reaches the greyed control).
- **H HOLDS THE WORDS**: under `ui-hidden` the words, pop-ups and the ESP bar keep the furniture and stage boxes they were placed against
  (stage-words.js `rest()`); H2O's block [765, 14, 71 × 49] shown and hidden — `e1-hide-before.jpg` / `e1-hide-after.jpg`.
- **THE SWITCH WEARS THE BUSY MARK**: `switching()` (molecules.js:37) raises the pointer's busy mark and `aria-busy` on MOLECULAR and the card from
  MOLECULES ON until `molSession.drawn` (new getter: the selected model's volume published or carded; `selected` itself lands at the claim, at once).
  Probe, cold water: 253–275 ms, the mark up 7 of 8 frames, cleared after (DOM state asserted; no picture caught).
- **FROST in LIGHT writes dark ink** (call 14): kit FROST `text: 'theme'` (AUTO) and the look's home TEXT AUTO; the kit's tile table FROST light
  8.06–8.11 : 1 (was 1.05). λWAVES keeps FROST DARK's white ladder (lab/look.js HOME_MAPS.text). skin-sheet: FROST light rows 6.17 → 12.29, tip
  6.76 → 11.2; FROST dark 17.81 unchanged (`e1-skin-frost-light.jpg`, `e1-skin-frost-dark.jpg`, `e1-frost-light.jpg`).

## E2 THE ICONS (dfc2fa31) — 31 drawn, 91 λWAVES glyphs registered (167 with the kit's)
The 23 of V-BUILD's list + informational · palette (a ring of swatches) · lens (CAMERA) · about (λ) · timeline · film (RENDER) · picker · transition;
`BORROWED` is gone; WINDOW_GLYPH points INFORMATIONAL, PALETTE, CAMERA, MIR OPTIONS (cogSolid), ABOUT, TIMELINE, RENDER at λWAVES' drawings. The menus:
35 action rows carry `icon` (lab/actions.js) and `item()` wears it (not on radio rows) — VIEW › CAMERA, MODE, THEME, TOOLS › PICKER/TIMELINE…
(`e2-icons-1600-menu.jpg`); census: bar 28/28, FINDER 57/57, Picker 33/33, NODES 70/70 SVG seats. The FOLDS pair, heart, sun, moon, rackToggle, the
arrows: already 1.9 (heart and the side bars evenodd/filled). Sheet: `E-shots/glyphs-{16,20,24}-{light,dark}.png` (`tools/glyph-sheet.mjs`, 34 lines).
**Gemini's brief: `research/iteration-022/ICONS-FOR-GEMINI.md`** (the law, one line per name, the `agy` command Josh runs).

## E3 THE SHEET AND THE LAWS
Re-shot with `tools/v-shots.mjs` (DIR=…/E-shots/sheet), against `research/iteration-021/V-shots/after-*` (pairs viewed side by side):
| scenario | 021 | 022 | regressed? |
|---|---|---|---|
| STAGE 1600 | bar [463, 762 → 1137, 854], racks folded | same; INFORMATIONAL's seat wears its new glyph | no |
| 1280×720 + MIR OPTIONS | 1162 × 618 over the bar, `transport-under` | same | no |
| 1280×720 + KEYBOARD | over the bar, `transport-under` | same | no |
| 1280×720 + NODES | [420, 8 → 626] (the tall clamp), under | same | no |
| 1024 | bar [175 → 849] | same | no |
| 800 | bar [102, 112, 776, 204] | same (the words still meet the λWAVES mark) | no |
| 760 / 720 (desktop, not a phone) | 674-px bar wider than the stage: PLAY or the right column clipped | scaled .88 / .8 about its top centre: [122 → 716] / [129 → 669], PLAY whole | fixed |
| 500 profile | phone layout, the bar in the hidden rack | same | no |
The bar's seat below 776 px: **scaled**, not docked (lab/csb.css:177, cheap; docking would rewrite the seat store). The headless rig is
`hover: none`, so under 700 px it is the phone; a mouse below ≈ 620 px still clips.
THE LAWS seated: shell.md "The laws of 022" — ONE MENU DOOR · A HINT IS ONE LINE (moved up from 021's block) · A LABEL IS NEVER WIDER THAN ITS CONTROL ·
A ROW FITS · THE SURFACE IS A SURFACE (+ the narrow bar) · AVAILABILITY IS ONE LAW; kit.md "The laws of 022" — A POPUP WEARS THE SKIN · RELIEF IS
TIGHT · THE MENU'S INK (the ink law, + FROST AUTO) · THE ICON TABLE IS λWAVES' OWN; stage-words.md — H holds them too (S5 extended); chemistry.md —
THE SWITCH WEARS THE BUSY MARK; iterations.md — the 022 index line. CLAUDE.md: no new laws file, so no index line; the gates line names
`hints-census --check` (H1 had put it in test.sh only); the kit sentence reads alpha.8. `tools/laws-diff.mjs` not re-run (nothing moved out).

## Kit
1.5.6-alpha.8 on the clone road (kit d5d8149 over a547da5): css/skin.css (the disabled door), kit.js (a disabled knob does not reset),
shell/menubar.js (`knobMenu` refuses a greyed knob), shell/themes.js (FROST TEXT AUTO), shell/gui.js (home TEXT AUTO), versions 3/3, CHANGELOG 2,
i18n re-extracted; tests re-aimed: prefs.node (FROST is AUTO; black in light), themes.browser (FROST light writes `dark`). Kit tests (one Chromium,
MIR_CDP_PORT 9680, kit on :9678): node 81/81 + lints, gui 70/70, themes 33/33, controls 62/62, intent 36/36, kit-paint 24/24, modwindow 32/32.
Adopted (8 files), pinned `'1.5.6-alpha.8': 47c7c8e4…`, `--check` in step; FOR-MIR § FOR 1.5.6 two BUILT lines (the FROST ask closed).
**Bundle: `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-adec31164c0ce485c/.tmp/kit-1.5.6-alpha.8.bundle`** (kit-1.5.5 @ d5d8149 + v1.5.5).

## Tests
`node tests/pwa.test.mjs --write && ./test.sh node` exit 0 after each row; rack-deps HOLDS (persist 24/25); 0 app-side cycles; new-project in step;
mir-manifest PASS. Browser (LW 9675 / GD 5675): latex-copy, camera-shift, take-in-bugs, official-defaults-palette, molecule-demos (3 of 4), stage-text,
hide-reveal, chem 56/56, routed-knob 7/7, window-switching, menubar, keyboard-window, frame-occlusion GREEN. THE LOCK once at the end
(`--check --query gastab=0`): 843 · 0 · 0 page errors, and the s4a fixture 987 · 0; no leaf moved, none unrepeatable.

## FOR 1.5.6 leftovers
A stored look with FROST's old TEXT LIGHT reads CUSTOM until FROST is picked again (no migration); a class-only `.sw.disabled` (not `:disabled`)
still takes no pointer; the kit's own 65 hints over 60 (H's list) wait.

## Open questions for Josh
1. Momentum is now GREY (not just switched back to x) under every `noMomentum` operator (WELL, QUARKONIUM, ATOM, CENTRAL, SEPARABLE…). Keep?
2. The icons are the builder's drawings (call 9): run the `agy` brief, or keep them? orbit's body and emission's photon are the weakest at 16 px.
3. The narrow desktop bar is scaled (.88 under 790, .8 under 730) rather than docked. Keep, or dock the bar under 860?
4. FROST LIGHT uses λWAVES' theme ladder (dark grey ink) rather than the kit's pure black; FROST DARK keeps pure white. Keep?
