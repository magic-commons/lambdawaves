# T1 THE MISSING PICTURES — build (iteration 013, picker chain)

Josh: "In the base molecules library and the extended volume library, there are some missing thumbnails for the orbitals. Can we patch those up?"

## The base store (`lab/molecules.js` MOLECULES + RECORD_ONLY against `lab/img/menu/`)
- Before: 98 rows, 96 with a picture, **2 without: CuH, ZnH₂** (both `disabled`: RHF/STO-3G is not a minimum, A−B ≺ 0, and the SCF does
  not converge in 200 cycles — no spectrum, no state ladder). GeH₄ (the plan's third) already has its picture (`GeH4.webp`).
- The library-record road: neither has a record (`records: {}`; no `lab/library/*.json` holds either id — the three files a grep hits
  carry the letters inside base64). So nothing to render; both stay dimmed in the Picker with the kit's reason. After: 96/98, unchanged.

## The volume (`~/Documents/LAMBDAWAVES-VOLUMES/dist/vol-1/`)
- Before: 3,465 molecules in `index.json`, 3,458 pictures in `t/`, **7 without**: tazobactam · mefenamic-acid · penciclovir ·
  streptozotocin · 3-deoxy-d-arabino-heptulosonic-acid-7-phosphate · oxycarboxin · nolatrexed (Yan's 10-19 count).
- Rendered by the existing tool, the app in headless Firefox over this worktree's gate (9611), the git-ignored dev link `lab/volumes`
  made for the run and removed after:
  `GD_PORT=5611 LW_PORT=9611 node tools/menu-thumbs.mjs --volume vol-1 --only <the seven>` → seven WebP, 28.3 kB, the shipped look.
- After: **3,465 / 3,465 pictures in `t/`.** Nothing under `raw/` was written; `index.json` and `volumes.json` untouched.
- Contact sheet: `t-shots/t1-vol1-seven.jpg` (the seven, in that order).

## What is NOT done (and why) — the index still names 7 rows `thumb: null`
The app shows a volume picture only through the index's `thumb` (`lab/volumes.js picture()`), and the index's `thumb` is the packer's
(`tools/volumes/pack.mjs` sets it when `t/<id>.webp` exists; the shelf carries `indexSha256`, so a hand edit is not an option). I did not run
the pack: the canonical `pack.mjs --candidates …/vol-1.candidates.json --volume vol-1 --numeral I --title 'All the Molecules' --sole
--incremental` would also take in the 43 molecules the solvers finished since the last pack (raw/STATUS `done`, not in the index — they
would arrive without pictures) and prunes against the CURRENT candidates file, while the catalogue swap (C7-BUILD.md §2) is still Josh's
call. The next pack day picks the seven pictures up by itself (no re-render).

## Tests
`./test.sh node` green (no `lab/` file changed in this row).

## CLAUDE.md sentence for Sos
Since iteration 013 T1 every VOL. I molecule has its `t/<id>.webp` (3,465/3,465); seven still read `thumb: null` until the next `pack.mjs --incremental`; CuH and ZnH₂ stay the base store's only rows without a picture (no RHF minimum, no record).

## Open questions for Josh
- Run the pack day now? It adds ~43 finished molecules (then their pictures: `menu-thumbs.mjs --volume vol-1 --only …` and a second pack)
  — after the catalogue-swap call.
- CuH / ZnH₂: keep them dimmed, or give them a picture from another road (a UHF/ROHF solve, or a drawn-from-density picture of the
  non-minimum RHF state)?
