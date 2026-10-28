# 022 chain S — THE SKIN (Opus builder, worktree agent-a3126e56e0dcce6a7, branch it022-S, BASE 4538c0f)

## S1 TIGHT RELIEF (c5bcb63) — kit MIR 1.5.6-alpha.5 (clone road, kit 3e6f5cc; one bump carries S2's ink too)
Tuned live first (an injected sheet over the running page, `tools/skin-sheet.mjs --css`), graded by the picture, then written in the clone.
| token | skin | today | shipped |
|---|---|---|---|
| `--neu-raise` highlight | light, non-solid (first run) | (−1,−1) 3 px white .90, inset top .90 | (−1,−1) **1 px white .70**, inset top .70 |
| `--neu-raise` highlight | dark, non-solid | (−1,−1) 3 px white .05, inset top white .08 | (−1,−1) **1 px `--neu-lit`** (new: the dark tint lifted 34 % toward white, at 32 % — a grey), inset top `--neu-lit` |
| `--neu-raise` | SOLID (MORPH, SWIFT, NEON) | highlight (−2.8,−2.8) 6 px · drop (2.8,2.8) 6 px | highlight **(−1,−1) 2 px** · drop **(1.5,1.5) 3 px** |
| `--neu-inset` | SOLID | ±1.4 · 4 px | **±1 · 2 px** |
| `--solid-lift` | light pane (L ≥ 50) | 100 % (pure white; fallback 70 %) | **≤ 45 %** (`solidRelief`; fallback 45 %); dark untouched (29 %) |
| `--shine-gain` | dark | 2.04 | **≤ 1.2** (light 1.084) |
| `--shine-term` | all | DISTANCE offset · SOFTNESS blur · α ≤ 1 | **`min(dist, 1px)`** · **`min(soft, 6px) / 3`** (≤ 2 px) · **α ≤ .35** |
| SHINE SOFT knob (gui.js) | — | 0–48, home 12 | **0–6, home 6** (a stored 12 clamps to 6 = home, so a stored skin still matches) |
| MORPH shine · soft | themes.js | .7 · 14 | **.5 · 6** (drawn 2 px) |
| AURORA shine · soft | themes.js | 1 · 18 | **.5 · 6** (drawn 2 px) |
Corrections by the picture: SHINE SOFT reads 0–6 as a third (0–2 px) rather than `min(soft, 2px)` — the literal clamp left 2–6 a dead travel and
made every returning reader's stored home (12 → 6) a "custom" look; so MORPH/AURORA's "2 px" is soft 6. The dark highlight is a grey (RESEARCH-T §4d).
Kit files: css/skin.css, shell/shell.css (the menubar floor, S2), core/look.js, shell/gui.js, shell/themes.js, tokens.json (+3 rows: `--neu-lit`,
`--surface-menu-tint`, `--surface-menu-edge`; notes), docs/TOKENS.md (regenerated), docs/INTENT.md (the relief row "How far it reaches", rule 8),
CHANGELOG (4 lines), locales/en.unreached.json (a line number), tests/gui.browser.mjs (SHINE SOFT now drags down from its home at the top — re-aimed).
`tests/themes.browser.mjs` needed no re-aim: shine opposite the light, SHINE 0 draws nothing, MORPH dark lifts more (2.63 · 1.21 vs 1.08 · 1.38) — 33/33.
λWAVES: adopted (7 + 3 files), pinned `'1.5.6-alpha.5': b208cdbf…` in tests/mir-manifest.test.mjs, `--check` in step; FOR-MIR § FOR 1.5.6 three lines;
CLAUDE.md:14 and docs/laws/kit.md name alpha.5. **Bundle: `/home/joshua-hosain/Documents/LAMBDAWAVES/.claude/worktrees/agent-a3126e56e0dcce6a7/.tmp/kit-1.5.6-alpha.5.bundle`** (kit-1.5.5 @ 3e6f5cc + v1.5.5).

**stylehash, re-baselined on purpose** (gallery/index.html, 6 states dark|light × tinted-off|refractive-on|solid-off; noise = a second before run, 7 elements):
before → after sha-256 per state: dark-tinted 32c31580e8b1 → 32564d2fb27f · light-tinted e5fac4aac2eb → 4f1b50de8ec1 · dark-refractive 88b74bb6e69a →
d8a2c1379cc2 · light-refractive 2a270df0a127 → a04c7489e5d9 · dark-solid 6198b101c984 → 03842e057e26 · light-solid 5971e0470ab0 → 4b98ce844a1b.
compare: 144 elements changed (every one a raise/well `box-shadow` or a token), 1 493 pixels beyond noise (dark-solid 1 070, the rest ≤ 157; light-tinted
and light-refractive 0 — the light highlight is white on a near-white card at gallery scale).

## S2 THE RELIEF ROAD AND THE INK (454c3e4)
- The 14 raw `var(--neu-raise)` (skin.css 6, keymap.css 4, lab.css 3, nodes.css 1) → `var(--relief-raise, var(--neu-raise))`, and the 30 raw
  `var(--neu-inset)` → `var(--relief-well, var(--neu-inset))` (the law names -well too); `grep -P '(?<!,)(?<!, )var\(--neu-(raise|inset)\)' lab/*.css` → 0.
  The mod-arming drop halo (lab.css `.mod-drop.is-over`) 7 → 2 px. RELIEF FLAT (SWIFT) now flattens SETTINGS'/WAVE's chosen segs and tracks
  (S-shots/flat-swift-light.jpg: the raise on POSITION · arg ψ · CLOUD and the wells are gone).
- THE INK (call 13), fixed at the root in the kit (rides alpha.5): a menu pane's tint `--surface-menu-tint` (the card's; flipped to the ink's ground —
  214 16% 13% — when a forced ink opposes the theme on a clear pane: FROST's White Text in LIGHT) and its rim `--surface-menu-edge` (≥ 3 : 1 against
  the stage; menus keep it with EDGE off, as INTENT says); the floor/tint/edge now reach the menubar's own lists (`#menubar .mb-list` was never
  on the menu surface — P's floor missed the WINDOW menu), the hover hint and the ⓘ panel (P's leftover).
- Measured from the picture (`tools/skin-sheet.mjs`: the row's median pane pixel, the computed ink composited over it, WCAG; the edge is the better of
  fill-vs-stage and rim-vs-stage, 24–64 px beside the pane). The WINDOW menu's rows and the hint tip, 14 looks (28 row numbers):
| skin · theme | row before → after | tip before → after | edge before → after |
|---|---|---|---|
| λWAVES light (first run) | 13.91 → **12.38** | 11.21 → 11.62 | 1.36 → 3.47 |
| λWAVES dark | 14.85 → **14.85** | 15.18 → 13.37 | 1.37 → 3.63 |
| FROST light | 1.00 → **6.17** | 1.29 → 6.76 | 1.36 → 7.98 |
| FROST dark | 17.81 → **17.81** | 16.22 → 15.19 | 1.40 → 3.69 |
| MORPH light | 16.96 → **16.96** | 16.96 → 16.96 | 1.49 → 3.40 |
| MORPH dark | 14.80 → **14.80** | 14.96 → 14.80 | 1.87 → 4.47 |
| CLASSIC light | 13.09 → **12.98** | 12.96 → 12.96 | 1.44 → 3.37 |
| CLASSIC dark | 11.66 → **11.50** | 12.53 → 12.42 | 1.72 → 4.31 |
| SWIFT light | 16.88 → **16.88** | 16.88 → 16.88 | 1.56 → 3.57 |
| SWIFT dark | 15.14 → **15.14** | 15.14 → 15.14 | 1.80 → 4.34 |
| AURORA light | 13.77 → **12.98** | 10.07 → 11.85 | 1.36 → 3.33 |
| AURORA dark | 14.34 → **14.34** | 12.79 → 10.70 | 1.45 → 3.77 |
| NEON light (reader's LIGHT over NEON) | 12.98 → **12.98** | 12.99 → 12.98 | 1.97 → 4.11 |
| NEON dark | 18.58 → **18.58** | 18.58 → 18.58 | 1.31 → 3.46 |
None below 4.5 after (least 6.17, FROST light); every edge ≥ 3 (least 3.33).

## The pictures (research/iteration-022/S-shots/)
`before/` and `after/<skin>-<theme>.jpg` — 14 contact sheets each (top: SETTINGS + WAVE on the rack, NODES and MIR OPTIONS floating, a hover hint;
bottom: the bar expanded, the WINDOW menu open). Pairs: `relief-morph-light|morph-dark|aurora-dark.jpg` (MIR OPTIONS, before over after: the 6 px
halo and the pane-top glow gone, a hairline left), `identity-first-run-rack.jpg`, `ink-first-run-menu.jpg`, `ink-frost-light-menu.jpg`, `flat-swift-light.jpg`.
**The first-run look keeps its identity**: SETTINGS, WAVE and the bar under light · refractive · frost always · blur 22 · vivid .5 lay out, fill and tint
exactly as before; what moved is the highlight (chosen segs and knob pucks, 3 px → 1 px; bar region: 1 295 px moved, max Δ 22 of 255) and the
hint tip's new rim. The WINDOW menu reads as a pane now (the .72 floor and a mid-grey rim) instead of a clear veil on the stage.

## Tests
Kit: `npm test` (node) 81/81; browser (one Chromium, MIR_CDP_PORT 9681, kit served on :9678): themes 33/33, gui 70/70, intent 36/36, plugin-intent
14/14, kit-paint 24/24, menubar-phone 15/15, controls 62/62; lint-tokens, lint-intent (no count up), tokens schema, version 3/3 sites.
λWAVES: `node tests/pwa.test.mjs --write && ./test.sh node` exit 0 after each row; mir-manifest PASS; adopt `--check` in step. Browser (LW 9677 /
GD 5677): official-defaults-palette, menubar, keyboard-window, hide-reveal, routed-knob GREEN. THE LOCK `--check --query gastab=0`: 843 · 0 · 0
page errors — no leaf moved (CSS is not in the lock).

## The sentences (for the close)
- docs/laws/kit.md — RELIEF IS TIGHT (022 S, kit 1.5.6-alpha.5): a raised control's highlight reaches 1–2 px (light 1 px · .70; SOLID 2 px of a lift
  ≤ 45 %), a dark highlight is grey (`--neu-lit`), the shine is a hairline (≤ 1 px, ≤ 2 px blur, α ≤ .35; SHINE SOFT 0–6); nothing in lab/ reads
  `--neu-raise` or `--neu-inset` raw — `--relief-raise` / `--relief-well` always, so RELIEF FLAT reaches everything (grep the lookbehind: 0).
- docs/laws/kit.md — THE MENU'S INK (022 S, call 13): every popup (menus, the menubar's lists, the hint tip, the ⓘ panel) takes the menu floor, the
  menu tint (flipped under a forced ink against the theme) and the menu edge; its rows read ≥ 4.5 : 1 and its edge ≥ 3 : 1 against the stage in every
  skin × theme — `node tools/skin-sheet.mjs <tag>` measures the 28 numbers from the picture.

## FOR 1.5.6 leftovers
FROST LIGHT's panes keep White Text (kit label table 1.05 : 1; only popups fixed) · P's modwindow tints wait · `--neu-lit` reads :root's tint, not a tone's.

## Open questions for Josh
1. FROST · LIGHT: switch FROST's TEXT to AUTO in light (black ink on its glass), or give FROST light a darker veil? Today its windows are white on white.
2. The menus' new mid-grey rim (≥ 3 : 1) is visible in every skin (S-shots/ink-first-run-menu.jpg); keep, or soften to the 1.4 hairline and accept < 3 : 1?
3. SHINE SOFT reads 0–6 as 0–2 px (a third). Keep, or a 0–2 knob?
