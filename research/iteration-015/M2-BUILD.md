# M2 THE LOOK EVERYWHERE — built (chain M, iteration 015, 2026-10-23)

## What
- The look rules every deck. A picture of ours carries `data-menu` = its kind and base: `mol:<id>`, `el:<sym>:<nl>_<m>` or `orb:<nl>_<m>`.
  `picker.js picOf(ref, look)` names its file:
  - a catalogue molecule: `img/menu/<id>.<look>.webp` for im · balls · sticks · esp · phase, else `<id>.webp`;
  - an element or a hydrogen state: `img/menu/orb-<nl>_<m>.<look>.webp` for ρ (density) and arg ψ (phase);
  - otherwise the one picture: `el-<sym>.webp`, or `orb-<nl>_<m>.webp`, which is the Im ψ look (Q3's).
- A missing variant falls back to the one picture, B4's law (the `<img>`'s error handler).
- A pick in THE LOOK DROP repaints every `[data-menu]` picture and every volume tile in place. The search suggestions (A2) are built in the look
  in use. A volume's one-atom entry uses its element's road.
- SIMPLER THAN THE PLAN: an ATOMIC tile in ρ or arg ψ reads its block orbital's `orb-` picture. menu-thumbs draws an element as hydrogen's pure
  orbital of that (n, l, m), so `el-Fe.webp` and `orb-3d_2.webp` are the same picture. The 118 × 2 element variants collapse into THE 140's.
  That saves 236 files.
- `tools/menu-thumbs.mjs`:
  - `--style` takes a list. Each molecule is picked once and drawn in every look.
  - `phase` is WAVE's PHASE of the frontier packet HOMO + i·LUMO under VIEW MIX. A real orbital's phase is only its sign: H2O.phase came out
    byte-identical to H2O.im. The quarter-turn pair is what winds the wheel.
  - The catalogue's variants are written INTO `lab/img/menu/`. A volume's variants still need a scratch `--out`.
  - `--set orbitals --orbs all` draws THE 140 (hydrogen.js BASIS) in `--style im,density,phase`.
    - im is the plain `orb-<nl>_<m>.webp`.
    - density is ρ SIGNED.
    - phase is the complex state, amplitude 1 and real. Its e^{imφ} winds the wheel, and phase leaves the l hue-turn at 0.
  - The l letters run to `spdfghik` (n = 7 reaches 7i). HUE_BY_L and the half-cut cover l ≤ 6.
  - The manifest keeps its rows when a run makes only variants, and records `variants`.
- The pictures are DATA (`img/menu/` in sw.js's DATA roots, `tests/pwa.test.mjs`), never precache.

## The pictures (rendered 10-23/24 over the gate server, the GPU shared with the solvers: ≈ 10 s a picture)
- The catalogue: 96 molecules × 5 looks (im · balls · sticks · esp · phase) = 480, none failed.
- THE 140: 103 new plain (Im ψ) pictures, plus 140 × density and 140 × phase = 383 new; the 37 old `orb-` files were kept.
- `lab/img/menu` now holds 1,115 files, 6.9 MB (once 252, 1.7 MB). All of it is DATA: fetched on first sight and kept on the device, never
  precached.
- `tools/tile-check.mjs`: 118/118 elements · THE 140 420/420.
- Shot `m-shots/M2-looks.jpg`: the MOLECULAR deck in φ (ESP), and benzene · methanol · glycine in ρ · arg ψ · Im ψ · ● · ⊸ · φ.

## Files
`lab/picker.js` (`picOf`, `pic(host, src, ref)`, `setLook`'s repaint), `tools/menu-thumbs.mjs`, `lab/img/menu/` (the pictures; see the
pictures commit).

## Tests
- `tools/m-shots.mjs look`: a look with no file yet falls back to `<id>.webp` (`LOOK=im` before the render). No console error.
- Suites: with M3.

## CLAUDE.md sentence
"THE LOOK EVERYWHERE (iteration 015 M2): every Picker deck draws the look in use. A catalogue molecule reads `img/menu/<id>.<look>.webp`; an element
or a hydrogen state in ρ / arg ψ reads `orb-<nl>_<m>.<look>.webp` (an element's picture is its block orbital's); anything else reads the one
picture, which is also the fallback for a missing variant. `menu-thumbs.mjs --style` takes a list and writes the catalogue's variants into
lab/img/menu. A molecule's arg ψ is the HOMO + i·LUMO packet."
