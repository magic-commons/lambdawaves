# Q3b · THE BLOCK'S ORBITAL — build note (iteration 011, branch `it011-block` from `a915d96`, gate 9461 / GD 5461)

Josh, 10-19 ≈ 20:00, with his table after Q3 beside GunnarDraft's reference: "Ermmm is this correct? I have the old reference files
which I'm not sure is correct but I want the highest orbital chosen on my app."

Q3's rule was "highest n, then l". It gave Fe 4s, so every d-block and f-block tile became an s picture and the table looked uniform.
This row replaces it with **the block's orbital**: the differentiating subshell, meaning the last electron the Aufbau adds, read from
the element's real ground configuration.

## What changed

| file | change |
|---|---|
| `lab/valence.js` | `blockSubshell(Z)`, new, holds the rule in one place. `valenceOf(Z)` now reads it, so the m and label are unchanged in form. |
| `lab/picker.js` | The caption follows through `valenceOf`, e.g. "Iron · 3d⁶". Two comments changed. |
| `lab/atoms.js` | One comment ("valence.js' one BLOCK'S orbital"). No code changed. |
| `tools/menu-thumbs.mjs` | The comments, and the manifest's `subshell` string. The tile road, `--own`, and the cut-open look (SIGNED, ISO 0.03, EXPOSURE 0.5, the CLIP through the nucleus facing THE CORNER, GRID 128, hydrogen's orbital per state) are untouched. |
| `tools/tile-check.mjs` | Re-aimed at `blockSubshell`. It adds an independent column: the subshell the element's seat in the table names. `--all` prints every row. It exits 1 on any mismatch. |
| `lab/img/menu/el-*.webp` | All 118 were re-rendered. 66 changed bytes: the d and f tiles plus La/Lu/Ac/Th. The s and p tiles came out byte-identical. The `orb-*` tiles were not touched. |
| `lab/img/menu/manifest.json` | Element rows and look string updated. 96 molecules and 37 orbitals kept. |
| `lab/sw.js` | `pwa --write` refreshed the hashes of valence.js, picker.js and atoms.js. |
| `CLAUDE.md` | THE PICKER sentence (§5). |

THE LOCK did not move: `lab/field.js` was never opened for writing.

## 1 · The rule

`blockSubshell(Z)`:
1. If the ground configuration holds an **open f shell** (0 < occ < 14), show that f.
2. Otherwise, show the occupied subshell that comes **last in the Madelung order** (n + l, then n): 1s 2s 2p 3s 3p 4s 3d 4p 5s 4d 5p
   6s 4f 5d 6p 7s 5f 6d 7p.

Step 1 exists because Madelung alone would give Ce 4f¹ 5d¹ as 5d, since 5d follows 4f. That lone 5d/6d electron is the
configuration's irregularity, not the block. Yb (4f¹⁴ 6s²) and No (5f¹⁴ 7s²) reach their f through step 2, because their f is last
in Madelung order. Lu and Lr close the f shell and keep their Madelung last: 5d and 7p.

Every exception in `groundConfig` (its MOVES rows), and what the rule shows for each:

| Z | el | groundConfig | shows | why |
|---|---|---|---|---|
| 24 | Cr | [Ar] 3d⁵ 4s | 3d⁵ | Madelung last |
| 29 | Cu | [Ar] 3d¹⁰ 4s | 3d¹⁰ | Madelung last |
| 41 · 42 · 44 · 45 | Nb Mo Ru Rh | [Kr] 4dᵏ 5s | 4d | Madelung last |
| 46 | Pd | [Kr] 4d¹⁰ | 4d¹⁰ | no 5s at all |
| 47 | Ag | [Kr] 4d¹⁰ 5s | 4d¹⁰ | Madelung last |
| 57 | La | [Xe] 5d 6s² | **5d¹** | no f held |
| 58 | Ce | [Xe] 4f 5d 6s² | **4f¹** | open f |
| 64 | Gd | [Xe] 4f⁷ 5d 6s² | **4f⁷** | open f |
| 78 · 79 | Pt Au | [Xe] 4f¹⁴ 5d⁹·¹⁰ 6s | 5d | Madelung last |
| 89 | Ac | [Rn] 6d 7s² | **6d¹** | no f held |
| 90 | Th | [Rn] 6d² 7s² | **6d²** | no f held |
| 91 · 92 · 93 · 96 | Pa U Np Cm | [Rn] 5fᵏ 6d 7s² | **5f** | open f |
| 103 | Lr | [Rn] 5f¹⁴ 7s² 7p | **7p¹** | f closed; 7p Madelung last |
| 71 (not a MOVES row) | Lu | [Xe] 4f¹⁴ 5d 6s² | **5d¹** | f closed |

`tile-check` also shows where the seat in the table and the rule part ways. This happens at exactly 5 elements: La, Lu, Ac, Th and Lr.
All five sit in the f rows, but the configuration says d or p.

## 2 · The re-render and THE CHECK

`LW_PORT=9461 GD_PORT=5461 node tools/menu-thumbs.mjs --set elements` rendered 57 unique hydrogen states, each written to every element
that shares it.
- All 118 tiles were written on the first pass, with **0 retries**. WebGPU device creation was not refused this time; swap was 6/7 GiB.
- Element tile bytes went from 574 014 to 581 824 B. These files are DATA, not precache.

`node tools/tile-check.mjs --all`: **118 of 118 match, 0 mismatch**. Before the re-render the same check found 52 matches and 66
mismatches: Sc–Zn, Y–Cd except Pd, La–Lu, Hf–Hg, Ac–No and Rf–Cn.

<details><summary>Every element: Z · symbol · configuration · subshell</summary>

| Z | el | configuration (groundConfig) | subshell | |
|---|---|---|---|---|
| 1 | H | 1s | **1s¹** | |
| 2 | He | 1s² | **1s²** | |
| 3 | Li | [He] 2s | **2s¹** | |
| 4 | Be | [He] 2s² | **2s²** | |
| 5 | B | [He] 2s² 2p | **2p¹** | |
| 6 | C | [He] 2s² 2p² | **2p²** | |
| 7 | N | [He] 2s² 2p³ | **2p³** | |
| 8 | O | [He] 2s² 2p⁴ | **2p⁴** | |
| 9 | F | [He] 2s² 2p⁵ | **2p⁵** | |
| 10 | Ne | [He] 2s² 2p⁶ | **2p⁶** | |
| 11 | Na | [Ne] 3s | **3s¹** | |
| 12 | Mg | [Ne] 3s² | **3s²** | |
| 13 | Al | [Ne] 3s² 3p | **3p¹** | |
| 14 | Si | [Ne] 3s² 3p² | **3p²** | |
| 15 | P | [Ne] 3s² 3p³ | **3p³** | |
| 16 | S | [Ne] 3s² 3p⁴ | **3p⁴** | |
| 17 | Cl | [Ne] 3s² 3p⁵ | **3p⁵** | |
| 18 | Ar | [Ne] 3s² 3p⁶ | **3p⁶** | |
| 19 | K | [Ar] 4s | **4s¹** | |
| 20 | Ca | [Ar] 4s² | **4s²** | |
| 21 | Sc | [Ar] 3d 4s² | **3d¹** | |
| 22 | Ti | [Ar] 3d² 4s² | **3d²** | |
| 23 | V | [Ar] 3d³ 4s² | **3d³** | |
| 24 | Cr | [Ar] 3d⁵ 4s | **3d⁵** | exception |
| 25 | Mn | [Ar] 3d⁵ 4s² | **3d⁵** | |
| 26 | Fe | [Ar] 3d⁶ 4s² | **3d⁶** | |
| 27 | Co | [Ar] 3d⁷ 4s² | **3d⁷** | |
| 28 | Ni | [Ar] 3d⁸ 4s² | **3d⁸** | |
| 29 | Cu | [Ar] 3d¹⁰ 4s | **3d¹⁰** | exception |
| 30 | Zn | [Ar] 3d¹⁰ 4s² | **3d¹⁰** | |
| 31 | Ga | [Ar] 3d¹⁰ 4s² 4p | **4p¹** | |
| 32 | Ge | [Ar] 3d¹⁰ 4s² 4p² | **4p²** | |
| 33 | As | [Ar] 3d¹⁰ 4s² 4p³ | **4p³** | |
| 34 | Se | [Ar] 3d¹⁰ 4s² 4p⁴ | **4p⁴** | |
| 35 | Br | [Ar] 3d¹⁰ 4s² 4p⁵ | **4p⁵** | |
| 36 | Kr | [Ar] 3d¹⁰ 4s² 4p⁶ | **4p⁶** | |
| 37 | Rb | [Kr] 5s | **5s¹** | |
| 38 | Sr | [Kr] 5s² | **5s²** | |
| 39 | Y | [Kr] 4d 5s² | **4d¹** | |
| 40 | Zr | [Kr] 4d² 5s² | **4d²** | |
| 41 | Nb | [Kr] 4d⁴ 5s | **4d⁴** | exception |
| 42 | Mo | [Kr] 4d⁵ 5s | **4d⁵** | exception |
| 43 | Tc | [Kr] 4d⁵ 5s² | **4d⁵** | |
| 44 | Ru | [Kr] 4d⁷ 5s | **4d⁷** | exception |
| 45 | Rh | [Kr] 4d⁸ 5s | **4d⁸** | exception |
| 46 | Pd | [Kr] 4d¹⁰ | **4d¹⁰** | exception |
| 47 | Ag | [Kr] 4d¹⁰ 5s | **4d¹⁰** | exception |
| 48 | Cd | [Kr] 4d¹⁰ 5s² | **4d¹⁰** | |
| 49 | In | [Kr] 4d¹⁰ 5s² 5p | **5p¹** | |
| 50 | Sn | [Kr] 4d¹⁰ 5s² 5p² | **5p²** | |
| 51 | Sb | [Kr] 4d¹⁰ 5s² 5p³ | **5p³** | |
| 52 | Te | [Kr] 4d¹⁰ 5s² 5p⁴ | **5p⁴** | |
| 53 | I | [Kr] 4d¹⁰ 5s² 5p⁵ | **5p⁵** | |
| 54 | Xe | [Kr] 4d¹⁰ 5s² 5p⁶ | **5p⁶** | |
| 55 | Cs | [Xe] 6s | **6s¹** | |
| 56 | Ba | [Xe] 6s² | **6s²** | |
| 57 | La | [Xe] 5d 6s² | **5d¹** | exception |
| 58 | Ce | [Xe] 4f 5d 6s² | **4f¹** | exception |
| 59 | Pr | [Xe] 4f³ 6s² | **4f³** | |
| 60 | Nd | [Xe] 4f⁴ 6s² | **4f⁴** | |
| 61 | Pm | [Xe] 4f⁵ 6s² | **4f⁵** | |
| 62 | Sm | [Xe] 4f⁶ 6s² | **4f⁶** | |
| 63 | Eu | [Xe] 4f⁷ 6s² | **4f⁷** | |
| 64 | Gd | [Xe] 4f⁷ 5d 6s² | **4f⁷** | exception |
| 65 | Tb | [Xe] 4f⁹ 6s² | **4f⁹** | |
| 66 | Dy | [Xe] 4f¹⁰ 6s² | **4f¹⁰** | |
| 67 | Ho | [Xe] 4f¹¹ 6s² | **4f¹¹** | |
| 68 | Er | [Xe] 4f¹² 6s² | **4f¹²** | |
| 69 | Tm | [Xe] 4f¹³ 6s² | **4f¹³** | |
| 70 | Yb | [Xe] 4f¹⁴ 6s² | **4f¹⁴** | |
| 71 | Lu | [Xe] 4f¹⁴ 5d 6s² | **5d¹** | |
| 72 | Hf | [Xe] 4f¹⁴ 5d² 6s² | **5d²** | |
| 73 | Ta | [Xe] 4f¹⁴ 5d³ 6s² | **5d³** | |
| 74 | W | [Xe] 4f¹⁴ 5d⁴ 6s² | **5d⁴** | |
| 75 | Re | [Xe] 4f¹⁴ 5d⁵ 6s² | **5d⁵** | |
| 76 | Os | [Xe] 4f¹⁴ 5d⁶ 6s² | **5d⁶** | |
| 77 | Ir | [Xe] 4f¹⁴ 5d⁷ 6s² | **5d⁷** | |
| 78 | Pt | [Xe] 4f¹⁴ 5d⁹ 6s | **5d⁹** | exception |
| 79 | Au | [Xe] 4f¹⁴ 5d¹⁰ 6s | **5d¹⁰** | exception |
| 80 | Hg | [Xe] 4f¹⁴ 5d¹⁰ 6s² | **5d¹⁰** | |
| 81 | Tl | [Xe] 4f¹⁴ 5d¹⁰ 6s² 6p | **6p¹** | |
| 82 | Pb | [Xe] 4f¹⁴ 5d¹⁰ 6s² 6p² | **6p²** | |
| 83 | Bi | [Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³ | **6p³** | |
| 84 | Po | [Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴ | **6p⁴** | |
| 85 | At | [Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵ | **6p⁵** | |
| 86 | Rn | [Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶ | **6p⁶** | |
| 87 | Fr | [Rn] 7s | **7s¹** | |
| 88 | Ra | [Rn] 7s² | **7s²** | |
| 89 | Ac | [Rn] 6d 7s² | **6d¹** | exception |
| 90 | Th | [Rn] 6d² 7s² | **6d²** | exception |
| 91 | Pa | [Rn] 5f² 6d 7s² | **5f²** | exception |
| 92 | U | [Rn] 5f³ 6d 7s² | **5f³** | exception |
| 93 | Np | [Rn] 5f⁴ 6d 7s² | **5f⁴** | exception |
| 94 | Pu | [Rn] 5f⁶ 7s² | **5f⁶** | |
| 95 | Am | [Rn] 5f⁷ 7s² | **5f⁷** | |
| 96 | Cm | [Rn] 5f⁷ 6d 7s² | **5f⁷** | exception |
| 97 | Bk | [Rn] 5f⁹ 7s² | **5f⁹** | |
| 98 | Cf | [Rn] 5f¹⁰ 7s² | **5f¹⁰** | |
| 99 | Es | [Rn] 5f¹¹ 7s² | **5f¹¹** | |
| 100 | Fm | [Rn] 5f¹² 7s² | **5f¹²** | |
| 101 | Md | [Rn] 5f¹³ 7s² | **5f¹³** | |
| 102 | No | [Rn] 5f¹⁴ 7s² | **5f¹⁴** | |
| 103 | Lr | [Rn] 5f¹⁴ 7s² 7p | **7p¹** | exception |
| 104 | Rf | [Rn] 5f¹⁴ 6d² 7s² | **6d²** | |
| 105 | Db | [Rn] 5f¹⁴ 6d³ 7s² | **6d³** | |
| 106 | Sg | [Rn] 5f¹⁴ 6d⁴ 7s² | **6d⁴** | |
| 107 | Bh | [Rn] 5f¹⁴ 6d⁵ 7s² | **6d⁵** | |
| 108 | Hs | [Rn] 5f¹⁴ 6d⁶ 7s² | **6d⁶** | |
| 109 | Mt | [Rn] 5f¹⁴ 6d⁷ 7s² | **6d⁷** | |
| 110 | Ds | [Rn] 5f¹⁴ 6d⁸ 7s² | **6d⁸** | |
| 111 | Rg | [Rn] 5f¹⁴ 6d⁹ 7s² | **6d⁹** | |
| 112 | Cn | [Rn] 5f¹⁴ 6d¹⁰ 7s² | **6d¹⁰** | |
| 113 | Nh | [Rn] 5f¹⁴ 6d¹⁰ 7s² 7p | **7p¹** | |
| 114 | Fl | [Rn] 5f¹⁴ 6d¹⁰ 7s² 7p² | **7p²** | |
| 115 | Mc | [Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³ | **7p³** | |
| 116 | Lv | [Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴ | **7p⁴** | |
| 117 | Ts | [Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵ | **7p⁵** | |
| 118 | Og | [Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶ | **7p⁶** | |
</details>

## 3 · By eye (`research/iteration-011/q3b-shots/`)

| file | what it shows |
|---|---|
| `table-before-after.jpg` | The whole table from the tiles in their seats. Before is Q3 (an s picture across the d and f blocks); after is Q3b. |
| `reference-vs-picker.jpg` | GunnarDraft's table beside the live Picker. The d-block rows read as d orbitals (four-lobed and dz²), the two f rows as f (six- and eight-lobed), the p block as p, and the s block as s. La, Lu, Ac and Th are d pictures in the f rows, and Lr is a p picture. |
| `picker-atomic.jpg` | The live ATOMIC deck (`tests/peek.mjs`, `?menu=1`, 1600 × 1000). All 118 of 118 pictures loaded; Fe is hovered and the caption reads "Iron · 3d⁶". |

The colours differ from the reference: the HSV wheel is turned by l (s 0°, p 45°, d 90°, f 135°), which is Josh's 10-18 look. The
subjects match block by block.

## 4 · Gate

| check | result |
|---|---|
| `node tests/pwa.test.mjs --write` | green |
| `./test.sh node` | rc 0, 0 FAIL |
| `rack-deps --classes --no-write` | clean |
| `new-project --check` | in step (16098 B) |
| browser: library, start, current | GREEN, GREEN, GREEN (rc 0) |

The pre-existing reds (official-defaults-palette, take-in-bugs :87, latex-copy §8) were not run.

## 5 · CLAUDE.md

THE PICKER's ATOMIC sentence now names **THE BLOCK'S ORBITAL**. It replaces Q3's "highest n then the highest l". The new wording:
- The rule: the differentiating subshell, the last electron the Aufbau adds, read from the real ground configuration — an open f
  shell if the ground state holds one, else the occupied subshell last in the Madelung order (listed in full), by `lab/valence.js`
  `blockSubshell`.
- Josh's 10-19 words, verbatim.
- What Q3's rule did wrong (Fe 4s, an s picture across the d and f blocks).
- What the tiles show now: s → ns, p → np, d → (n−1)d (Fe, Cr, Cu and Zn 3d; Pd 4d), Ce–Yb 4f, Pa–No 5f, La 5d / Ac 6d / Th 6d (no f
  held), Lu 5d / Lr 7p (f closed).
- `tools/tile-check.mjs` as the proof, and the caption ("Iron · 3d⁶").

The rest of the sentence (the pure orbital, the cut, the layers) is unchanged.
