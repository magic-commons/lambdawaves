# I1 — THE ICONS BY GEMINI (iteration 012, branch `it012-library`)

## What changed
- 17 SVGs under `lab/img/icons/`, made by **Antigravity** on the Gemini 4 model at medium effort, in ONE non-interactive call:
  `atomic` `molecular` `library` `download` `trash` `arrow-left` `arrow-right` `home` `folders` `hue-ring` `labels` `plus` `save`
  `folder-name` `file-name` `curves` `render` (`.svg`). Nothing was drawn by hand; every file is Gemini's markup, cleaned.
- **The invocation** (from an empty scratch dir `/tmp/agy-icons-it012`, so no repo file was reachable; the prompt held only the icon
  briefs — names, meaning, 24-unit viewBox, 2-unit stroke, currentColor, "a serif-leaning line icon set", 3.5-unit stroke for the arrows):

      agy -p "$(cat brief.txt)" --model gemini-4-argon-medium --output-format text > out.txt

  `agy` 1.4.2 (`~/.local/bin/agy`), model id `gemini-4-argon-medium` ("Gemini 4 Argon (Medium)", from `agy models`). It answered one JSON
  object `{ "<name>.svg": "<svg …>" }` in one turn, no tools run.
- **Cleaning**: each SVG checked for `<script>`, `href`, `url(`, `on*=`, `<style>`, `<foreignObject>`, `<text>` (none found); root
  `width`/`height`/`id`/`class`/`style` stripped (none present); `viewBox="0 0 24 24"` required; every `fill`/`stroke` is `none` or
  `currentColor`. The arrows carry `stroke-width="3.5"` (the kit's chevrons are 1.5–2).
- **The sheet**: `research/iteration-012/I1-ICONS.html` — all 17 at 16 / 24 / 32 px on light and dark (shot: `l-shots/i1-icons-sheet.png`).
- **The window list**: the rack's + list (the kit's `drawAdd`, `lab/mir/shell/rack.js`) draws only names from the kit's glyph table, so
  ATOMS (`atoms`) and MOLECULES (`chem`) wear `atomic.svg` / `molecular.svg` through an unlayered `lab/lab.css` rule — a CSS mask on
  `[data-rack-list] .mb-item[data-win="atoms"|"chem"]::before`, 14 px in `--dim`, the kit glyph's own seat (shot: `l-shots/i1-window-list.png`).
  The PICKER is a MENUBAR row (WINDOW › PICKER, the kit's `createMenubar`): rows take no glyph and carry no `data-*` hook, so it is one
  FOR-MIR line instead (with `registerGlyph(name, svg)` for the + list).
- `lab/sw.js` refreshed by `node tests/pwa.test.mjs --write` (17 new precache rows).

## Files
`lab/img/icons/*.svg` (17) · `lab/lab.css` (one rule at the foot) · `lab/sw.js` · `docs/FOR-MIR.md` (one line) ·
`research/iteration-012/I1-ICONS.html` · `research/iteration-012/l-shot.mjs` (the 1920×1080 photograph tool for I1/L1–L3) · `l-shots/`.

## Tests
`./test.sh node` green (41 suites); `node tests/pwa.test.mjs` green. Visual check: the + list photograph.

## CLAUDE.md sentence for Yan
THE ICONS (iteration 012 I1) are Antigravity's (`agy -p … --model gemini-4-argon-medium`), cleaned to a 24-unit viewBox and currentColor, in
`lab/img/icons/` (17 files; the sheet `research/iteration-012/I1-ICONS.html`); the kit's glyph table takes no app SVG, so the rack's + list
paints ATOMS / MOLECULES' icons with a CSS mask over `[data-rack-list] .mb-item[data-win]` (`lab.css`), and WINDOW › PICKER waits on FOR-MIR.

## Open questions for Josh
1. The + list puts every glyph (the kit's and these two) at the left with the word pushed right; M1 aligns them icon-right as you asked.
2. `plus.svg` came back with small serifs on its four ends — Gemini's reading of "serif-leaning". Keep it, or ask for a plain plus?
