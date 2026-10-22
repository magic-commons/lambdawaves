# B4 THUMBNAIL VARIANTS — built (builder B, 2026-10-22)

## What changed
- `tools/menu-thumbs.mjs --style im|balls|sticks|esp` renders a molecule variant and writes it as `<id>.<style>.webp`. It applies to
  `--set molecules` and to `--volume`.
  - A variant run REFUSES without a scratch `--out DIR`, so it never writes dist/ or lab/img/menu by hand. It writes no manifest.
  - `--esp-surface iso|sas|ses` picks the map's surface (default ses).
  - `--style signed|glassSigned` keeps meaning the atoms' draw style.
- The four looks:
  - `im`: the molecule's VIEW ORBITAL (the HOMO), drawn SIGNED on WAVE's RE. That gives two complementary colours of the HSV wheel, which
    THE HUE ring (`--mol-hue`) turns like every picture.
  - `balls` / `sticks`: B1 / B2.
  - `esp`: B3 on the SES, the standard red → blue.
- `tools/volumes/pack.mjs` carries each kept `t/<id>.<style>.webp`, by the same findKept road as the one picture.
  - The index row names what it has: `thumbs: ['im', 'balls', 'sticks', 'esp']`. A row without variants has no key, so an index with no
    variants is byte-identical to before.
  - The archive (`--archive`) and the stale-file reach include the variants.
- `lab/volumes.js` `picture(volId, molId, style)` returns the variant when the row names it, else the one picture.
- `lab/picker.js`: THE PICTURES' STYLE row sits under the hue ring: ρ · IM · BALLS · STICKS · ESP.
  - It is the Picker's PREFERENCE `look` in `lambdawaves.q0.picker`.
  - A press repaints every volume tile and search suggestion in place.
  - Catalogue tiles (`lab/img/menu`) keep their one picture: no variants are shipped, because of the precache budget.
  - Styled in `lab/skin.css` (`.mm-looks`, SHOW LABELS' look).

## Proof
- TEN molecules × four looks (H2O NH3 CH4 C6H6 HCOOH CH3OH urea glycine C5H5N CO2) went to the scratch `.tmp/b/thumbs`.
  - 40 files, 23–43 kB a look in all. Every one rendered.
  - Sheet: `b-shots/B4-variants.jpg`.
- PACK DRY RUN, one molecule, into a scratch tree:
  - Setup: `LW_VOLUMES=.tmp/b/packdry`, its `raw/H2O` a copy of the live one (read only), and the five pictures in `dist/vol-1/t/`.
  - Command: `pack.mjs --candidates …/vol-1.candidates.json --volume vol-1 --only H2O --out-dir .tmp/b/packdry/dist`.
  - Result: the row read `"thumb": "t/H2O.webp", "thumbs": ["im", "balls", "sticks", "esp"]`. Nothing live was written.
- The Picker's row: `b-shots/B4-picker.jpg`.

## Tests
- `./test.sh node`: green except wigner W42-8 (known).
- `node tests/pwa.test.mjs` green after `--write`.
- start.browser-test GREEN.
- library.browser-test: GREEN on re-run.
  - Its "store created at boot" assertion races the demo cover's keepData (projects.js seeds WAVE DANCER's cover into lw-data-v1 on a
    fresh profile; measured: `/lab/demos/covers/wave-dancer.jpg` is the only entry).
  - The base never lost the race in 4 runs; this tree lost 2 of 5. It is not this chain's store.

## CLAUDE.md sentence
"THE PICTURES' STYLE (iteration 014 B4): `tools/menu-thumbs.mjs --style im|balls|sticks|esp --out <scratch>` writes `<id>.<style>.webp`, and
pack.mjs carries them into a volume row's `thumbs`. The Picker's ρ · IM · BALLS · STICKS · ESP row under the hue ring (PREFERENCE `look`) shows
a volume tile's variant through volumes.js `picture(vol, id, style)`, else its one picture."

## For Josh / next
- Rendering ~6k molecules × 4 looks is the night job over a gate server. The index naming is in pack.mjs and waits for that pack day.
