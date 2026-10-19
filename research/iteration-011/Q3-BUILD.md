# Q3 · THE ATOMIC TILES' n — build note (iteration 011, branch `it011-tiles` from `37088a7`, gate 9421 / GD 5421)

Josh, 10-19: "the layered s orbitals in the atomic main menu section don't seem to satisfyingly show that layer it is... ACTUALLY I just
noticed that the orbitals aren't correctly their 'n' level. it's definitely incorrect to just show the lone highest orbital with it's pure
n= at it's level but it's really just an indicator and visual aid."

## What changed

| file | change |
|---|---|
| `lab/valence.js` | `valenceOf(Z)` now returns the HIGHEST occupied subshell: highest n, then highest l within that n. Same return shape. The Picker's caption follows it (Fe now reads `4s²`). |
| `tools/menu-thumbs.mjs` | THE HALF-CUT for every atomic tile. It uses MATERIAL's CLIP at pos 0, with the normal toward THE CORNER's eye, (1, 1, 1)/√3. The GRID is 128, set the way SETTINGS · QUALITY's seg sets it and restored afterwards. Elements are drawn as hydrogen's pure (n, l, m), each unique state rendered once. New options: `--cut`, `--cutl`, `--style`, `--res`, `--aiso`, `--own`, `--domain`, `--out`, `--orbs`, `--nuclei`. The manifest records the look. |
| `tools/tile-layers.py`, `tools/tile-check.mjs` | New. The programmatic layer count and THE CHECK (below). |
| `lab/img/menu/el-*.webp` (118), `orb-*.webp` (37), `manifest.json` | Re-rendered. The molecule tiles were not touched. |
| `lab/sw.js` | `pwa --write`: the hashes of valence.js and picker.js only. `img/menu/` is DATA, not precache. |
| `lab/picker.js` | One comment. |
| `CLAUDE.md` | THE PICKER paragraph (below). |

THE LOCK did not move. `field.js` was not opened for writing, and the tool sets CLIP, STYLE and GRID only through the app's own state.

## 1 · THE CHECK: the rule for "highest", and the mismatches

**The rule.** Take the highest n first, then the highest l within it. This is the outermost shell, the "pure n at its level" Josh
names. "Last filled in the configuration" is the wrong rule here: it gives Fe 3d and Ce 4f, whose n is not the period's n.
- Ties never happen, because each (n, l) appears once.
- Exceptions follow from groundConfig: Cr/Cu 4s¹, Nb–Ag 5s¹, Pt/Au 6s¹, Lr 7p¹.
- Pd is [Kr] 4d¹⁰ with no 5s, so its tile is 4d. It is the only element in the table whose tile n differs from its period (checked
  for all 118).

**Before this change.** The tiles followed iteration 008's rule: the open subshell with the highest l, otherwise the last one filled in
Madelung order. Against groundConfig that gave 55 matches and **63 mismatches**:
- every d-block element except Cu, Ag, Au and Pd;
- every f-block element except Lr.

Cu, Ag and Au already matched because their d shell is full, so the open shell was ns. Pd matched as 4d and Lr as 7p.

The manifest's `orbital` is the provenance; `node tools/tile-check.mjs [manifest]` reads it. After the re-render: **118 match, 0 mismatch**.

<details><summary>The 63 mismatches before (all fixed)</summary>

| Z | el | configuration | tile drew | highest (fix) | |
|---|---|---|---|---|---|
| 21 | Sc | [Ar] 3d 4s² | 3d | **4s²** | |
| 22 | Ti | [Ar] 3d² 4s² | 3d | **4s²** | |
| 23 | V | [Ar] 3d³ 4s² | 3d | **4s²** | |
| 24 | Cr | [Ar] 3d⁵ 4s | 3d | **4s¹** | exception |
| 25 | Mn | [Ar] 3d⁵ 4s² | 3d | **4s²** | |
| 26 | Fe | [Ar] 3d⁶ 4s² | 3d | **4s²** | |
| 27 | Co | [Ar] 3d⁷ 4s² | 3d | **4s²** | |
| 28 | Ni | [Ar] 3d⁸ 4s² | 3d | **4s²** | |
| 30 | Zn | [Ar] 3d¹⁰ 4s² | 3d | **4s²** | |
| 39 | Y | [Kr] 4d 5s² | 4d | **5s²** | |
| 40 | Zr | [Kr] 4d² 5s² | 4d | **5s²** | |
| 41 | Nb | [Kr] 4d⁴ 5s | 4d | **5s¹** | exception |
| 42 | Mo | [Kr] 4d⁵ 5s | 4d | **5s¹** | exception |
| 43 | Tc | [Kr] 4d⁵ 5s² | 4d | **5s²** | |
| 44 | Ru | [Kr] 4d⁷ 5s | 4d | **5s¹** | exception |
| 45 | Rh | [Kr] 4d⁸ 5s | 4d | **5s¹** | exception |
| 48 | Cd | [Kr] 4d¹⁰ 5s² | 4d | **5s²** | |
| 57 | La | [Xe] 5d 6s² | 5d | **6s²** | exception |
| 58 | Ce | [Xe] 4f 5d 6s² | 4f | **6s²** | exception |
| 59 | Pr | [Xe] 4f³ 6s² | 4f | **6s²** | |
| 60 | Nd | [Xe] 4f⁴ 6s² | 4f | **6s²** | |
| 61 | Pm | [Xe] 4f⁵ 6s² | 4f | **6s²** | |
| 62 | Sm | [Xe] 4f⁶ 6s² | 4f | **6s²** | |
| 63 | Eu | [Xe] 4f⁷ 6s² | 4f | **6s²** | |
| 64 | Gd | [Xe] 4f⁷ 5d 6s² | 4f | **6s²** | exception |
| 65 | Tb | [Xe] 4f⁹ 6s² | 4f | **6s²** | |
| 66 | Dy | [Xe] 4f¹⁰ 6s² | 4f | **6s²** | |
| 67 | Ho | [Xe] 4f¹¹ 6s² | 4f | **6s²** | |
| 68 | Er | [Xe] 4f¹² 6s² | 4f | **6s²** | |
| 69 | Tm | [Xe] 4f¹³ 6s² | 4f | **6s²** | |
| 70 | Yb | [Xe] 4f¹⁴ 6s² | 4f | **6s²** | |
| 71 | Lu | [Xe] 4f¹⁴ 5d 6s² | 5d | **6s²** | |
| 72 | Hf | [Xe] 4f¹⁴ 5d² 6s² | 5d | **6s²** | |
| 73 | Ta | [Xe] 4f¹⁴ 5d³ 6s² | 5d | **6s²** | |
| 74 | W | [Xe] 4f¹⁴ 5d⁴ 6s² | 5d | **6s²** | |
| 75 | Re | [Xe] 4f¹⁴ 5d⁵ 6s² | 5d | **6s²** | |
| 76 | Os | [Xe] 4f¹⁴ 5d⁶ 6s² | 5d | **6s²** | |
| 77 | Ir | [Xe] 4f¹⁴ 5d⁷ 6s² | 5d | **6s²** | |
| 78 | Pt | [Xe] 4f¹⁴ 5d⁹ 6s | 5d | **6s¹** | exception |
| 80 | Hg | [Xe] 4f¹⁴ 5d¹⁰ 6s² | 5d | **6s²** | |
| 89 | Ac | [Rn] 6d 7s² | 6d | **7s²** | exception |
| 90 | Th | [Rn] 6d² 7s² | 6d | **7s²** | exception |
| 91 | Pa | [Rn] 5f² 6d 7s² | 5f | **7s²** | exception |
| 92 | U | [Rn] 5f³ 6d 7s² | 5f | **7s²** | exception |
| 93 | Np | [Rn] 5f⁴ 6d 7s² | 5f | **7s²** | exception |
| 94 | Pu | [Rn] 5f⁶ 7s² | 5f | **7s²** | |
| 95 | Am | [Rn] 5f⁷ 7s² | 5f | **7s²** | |
| 96 | Cm | [Rn] 5f⁷ 6d 7s² | 5f | **7s²** | exception |
| 97 | Bk | [Rn] 5f⁹ 7s² | 5f | **7s²** | |
| 98 | Cf | [Rn] 5f¹⁰ 7s² | 5f | **7s²** | |
| 99 | Es | [Rn] 5f¹¹ 7s² | 5f | **7s²** | |
| 100 | Fm | [Rn] 5f¹² 7s² | 5f | **7s²** | |
| 101 | Md | [Rn] 5f¹³ 7s² | 5f | **7s²** | |
| 102 | No | [Rn] 5f¹⁴ 7s² | 5f | **7s²** | |
| 104 | Rf | [Rn] 5f¹⁴ 6d² 7s² | 6d | **7s²** | |
| 105 | Db | [Rn] 5f¹⁴ 6d³ 7s² | 6d | **7s²** | |
| 106 | Sg | [Rn] 5f¹⁴ 6d⁴ 7s² | 6d | **7s²** | |
| 107 | Bh | [Rn] 5f¹⁴ 6d⁵ 7s² | 6d | **7s²** | |
| 108 | Hs | [Rn] 5f¹⁴ 6d⁶ 7s² | 6d | **7s²** | |
| 109 | Mt | [Rn] 5f¹⁴ 6d⁷ 7s² | 6d | **7s²** | |
| 110 | Ds | [Rn] 5f¹⁴ 6d⁸ 7s² | 6d | **7s²** | |
| 111 | Rg | [Rn] 5f¹⁴ 6d⁹ 7s² | 6d | **7s²** | |
| 112 | Cn | [Rn] 5f¹⁴ 6d¹⁰ 7s² | 6d | **7s²** | |

</details>

## 2 · THE LAYERS: the look chosen, and why

**The trials.** All are at THE CORNER at 200 px; see `q3-shots/look-trials.jpg`. Each trial was counted by eye and by `tile-layers.py`.

| look | hydrogen 1s…7s counted | by eye |
|---|---|---|
| **SIGNED · CLIP facing the camera** | **1 2 3 4 5 5 6** | concentric rings in the two sign colours; the clearest of the four |
| SIGNED · CLIP z (iteration 008's cut, s only) | — | a bowl: the rings are squashed into an ellipse at 35°, and 5s, 6s and 7s are hard to tell apart |
| SHELL ± (X7 `glassSigned`) · camera CLIP | 1 1 1 2 3 3 1 | thin, see-through outlines; washed out at 200 px |
| SIGNED · camera CLIP · ISO 0.012 | 1 2 3 4 5 5 6 | the outer lobe is fatter, so the inner rings are smaller |

The count for the z-cut row was not run: its nucleus is not at the tile's centre.

Two more sweeps, measured the same way:
- **ISO** 0.045 or 0.06 loses the weak outer lobes; for example, 4s counts 3 and 5s counts 2.
- **A tighter box.** DOMAIN at 0.7 of AUTO clips 7s square. At 0.78 and 0.85 the 6s count wavers between 5 and 6.

EXPOSURE stays at Josh's 0.5 from 10-18; 1 counted the same.

**Chosen:**
- SIGNED, ISO 0.03, EXPOSURE 0.5.
- CLIP through the nucleus with normal (1, 1, 1)/√3, applied to every l. A p, d or f tile shows its radial layers too: Og 7p shows its
  six rings, and Pd 4d shows its inner lobe.
- GRID 128 and DOMAIN AUTO.
- THE CORNER pose and the 8 % alpha-box size normalisation are kept.

The tool draws one picture per tile through the two-ground matte. There is no light/dark pair.

**The subject: the PURE orbital, not the atom's own.** This is the decision Josh should check. Under the ATOM system, an alkali's real
ns orbital folds its inner lobes into the core.

| atom | ns | radial nodes (bohr) | outer lobe reaches |
|---|---|---|---|
| Fr | 7s | 0.017, 0.069, 0.18, 0.39, 0.86, 2.15 | ≈ 8 bohr |
| Cs | 6s | 0.032 … 2.14 | |
| Rb | 5s | 0.052 … 1.81 | |

The numbers are from `atoms.js atomRadial`. The radial table samples every 0.08 bohr, and a 128³ voxel is 0.3 bohr. So even
cut, each element's own tile counts (`look-trials.jpg`, bottom row): Li 2, Na 2, K 3, Rb 3, Cs 3, Fr 3, Fe 3, Au 4. In other words,
5s, 6s and 7s still look alike, which is exactly Josh's complaint. Hydrogen's ns spreads its nodes out (1.85, 6.3, 13.6, 24, 39 and 62
bohr for 7s), so the pure orbital shows its n.

Josh: "it's really just an indicator and visual aid". So `el-<sym>` is now hydrogen's (n, l, m) of the element's highest subshell. It is
rendered once per state and written to every element that shares it, so for example K, Ca and Sc–Zn share the 4s picture.
`--own` restores each element's own ATOM state, which was 008 A7's road.

## 3 · THE COUNT: every s tile

`tools/tile-layers.py` counts layers as **sign runs** along 72 rays from the nucleus:
- The nucleus position comes from `menu-thumbs --nuclei`.
- The sign axis is found from the tile's own hues.
- Pixels with α < 35 % or saturation < 18 % have no sign.
- A run shorter than 1.5 px is folded into its neighbours.
- The count is the most common one across the rays.

An ns orbital should show n layers. Every tile below was counted the same on 72 of 72 rays.

| n | should show | counted | tiles |
|---|---|---|---|
| 1 | 1 | **1** | H He |
| 2 | 2 | **2** | Li Be |
| 3 | 3 | **3** | Na Mg |
| 4 | 4 | **4** | K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn |
| 5 | 5 | **5** | Rb Sr Y Zr Nb Mo Tc Ru Rh Ag Cd · orb-5s_0 |
| 6 | 6 | **5** | Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg · orb-6s_0 |
| 7 | 7 | **6** | Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Rf Db Sg Bh Hs Mt Ds Rg Cn |

**1s through 5s show every layer. 6s and 7s show one fewer.** Their innermost lobe is the 1.85-bohr core of an orbital whose visible
extent is roughly 100 bohr. On a 200 px tile that core is a pale dot about 1 px across:
- It can be seen in a zoom.
- It is not counted, even with `--min 1`.
- The 128³ grid gives it about one voxel.

What still tells the rows apart:
- The counted layers rise with n except that 5s and 6s both count 5.
- The outer colour alternates with n (5s green, 6s violet, 7s green), so 5s and 6s still differ at a glance.

Closing the last gap needs either a finer grid than the app offers (> 128) or a larger tile. Both are Josh's call.

## 4 · Bytes

| set | before | after |
|---|---|---|
| el-*.webp (118) | 460 596 B | 574 014 B |
| orb-*.webp (37) | 147 796 B | 193 600 B |
| total | 608 392 B | 767 614 B (+159 kB) |

The rings carry more edges than a smooth shell, so the files grew. These are DATA (sw.js §1b), not precache. `pwa.test` passes with
the hashes of valence.js and picker.js refreshed.

## 5 · PROVE (`research/iteration-011/q3-shots/`)

| file | what it shows |
|---|---|
| `s-1s-7s-before-after.jpg` | hydrogen 1s…7s. Before is the base tool (z-cut s only, the boot GRID); after is the camera cut at GRID 128. |
| `elements-before-after.jpg` | H, Fe, Pd, Au, Fr and Og. Before, Fe was 3d. After, Fe is 4s with 4 rings, Au 6s and Fr 7s show their layers, Pd 4d shows its inner lobe, and Og 7p shows its six. |
| `3d-4f-before-after.jpg` | the d and f tiles, uncut before and cut after |
| `look-trials.jpg` | the four looks, and the ATOM's own s tiles (Li … Fr) showing 2–3 layers |
| `picker-atomic.jpg` | the live ATOMIC deck at 1600 × 1000 (`?menu=1`): 118 of 118 pictures loaded, Fe hovered, caption "Iron · 4s²" |

## 6 · Gate

| check | result |
|---|---|
| `node tests/pwa.test.mjs --write` | green |
| `./test.sh node` | rc 0 |
| `rack-deps --classes --no-write` | clean |
| `new-project --check` | in step (16098 B) |
| browser suites | library, start and current green (rc 0). library step 5 is green, as X4 left it. official-defaults-palette and take-in-bugs were not run: their reds are pre-existing and not this row's. |

The host was under memory pressure during this row: swap was 7.2 of 8 GiB, and other sessions and apps were running. Firefox refused
`requestDevice` ("Not enough memory left") for about 25 minutes. The tiles were rendered in the windows it allowed, by retrying the
failed ones (`.tmp/q3/retry.sh`). Every tile in the manifest is from this look, and `tile-check` reports 118 / 118.

## 7 · CLAUDE.md

THE PICKER's ATOMIC sentence now reads: the HIGHEST occupied subshell, highest n then highest l in it, and its last electron's m, by
`lab/valence.js`. It carries Josh's 10-19 words verbatim: Fe 4s, not 3d; Ce 6s, not 4f; Pd 4d, the one element whose n is not its
period. The tile is drawn as the PURE (hydrogen) orbital of that (n, l, m), cut in half through the nucleus facing the camera so its
n − l radial layers read as rings. The reason is given: the atom's own orbital folds its layers into the core, so Rb 5s, Cs 6s and
Fr 7s all showed 3. `tools/tile-layers.py` is named as the counter. The pictures sentence adds the CLIP at the nucleus toward THE
CORNER's eye and GRID 128.
