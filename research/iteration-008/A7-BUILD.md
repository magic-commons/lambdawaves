# A7 · n = 7 — the build note (iteration 008, branch `it008-n7` from `07591a7`, gate 9681 / GD 5681)

Josh asked for the level-7 orbitals and for the coloured `n` numbers in SPECTRUM's state grid to fold their shells. Both are built.
Fr–Og (Z 87–118) fitted inside the same work, so they are live too. Nothing is pushed.

## What was built

1. **The register is 140 labels.** `hydrogen.js` has `NMAX = 7`. The 49 labels of n = 7 come after the 91 of n ≤ 6, because `BASIS` is
   ordered by (n, l, m). So every old index, id and saved array keeps its place: `h:6:5:5` is still 90 and `h:7:0:0` is 91. `N6 = 91`
   names the n ≤ 6 part.
2. **The GPU kernel takes a seventh coefficient.** A mode table now has 7 slots. n = 7 needs them for L¹₆ (7s) and d⁰P₆ (7i).
   - `field.js` packs the seventh slot into `lag1.z` / `leg1.z`, which were unused. The record size stays the same.
   - The Horner chains add `+ x·lag1.z`. That term is 0 for every older record, so it adds nothing to their values.
   - The radial buffer is 48 rows. `atoms.js rowOfNr` keeps the 6 × 6 (n_r, l) grid where it was. n = 7's (6, 0) and (0, 6) go to 36 + l.
     7p … 7h land on grid rows that were free. Cornell, CENTRAL and the ATOM table share this map.
   - **Light check (METERS › FLOOR · GRID ERROR, GPU texture against the CPU ψ at every voxel, 64³):**

     | State | RMS | Worst |
     |---|---|---|
     | 7s + 7i₆ + 7p₀ | 1.2e-7 | 2.9e-6 |
     | 7i₀ alone | 1.1e-7 | 1.9e-6 |
     | 7s₀ alone | 1.2e-7 | 1.2e-6 |
     | 6s₀ (same class) | 1.5e-7 | 1.8e-6 |
     | 6h₀ (same class) | 1.6e-7 | 3.7e-6 |
3. **Every Hamiltonian follows**, and none of them moves an old label:
   - Oscillator: N ≤ 12, a 13-level ladder.
   - Box: zeros found per label as before.
   - Quarkonium: two new Numerov rows (7S, 1I), solved after the 36.
   - CENTRAL: 28 rows.
   - ATOM: frozen channels to n = 7. Each eigenvalue is its own bisection, so asking for one more changes none of the others.
   - Stark: the inter-shell solve is now 140 × 140; the shell model gains its n = 7 blocks.
   - The slap: L ≤ 12, the integral key widened. The squeeze: h₀ … h₁₂.
   - The rotors, `rotateK` and the Kepler orbits: now include n = 7.
4. **Two parts stay on the 91, so THE LOCK holds.**
   - **THE SCALE λ (Sturmian):** its (l, m) blocks are still n ≤ 6. A seven-label block would move every variational eigenvalue, so THE
     LOCK's sturmian rows would move. The propagator's objects are 140 wide with zero rows and columns for n = 7. The scale's status
     already says "91 labels".
   - **The BOX packet (`wellPacket`):** it still projects on the 91, so its `captured` and every coefficient are the same double.
     The AXIAL gas is the box's fine road.
5. **The links (no new version).**
   - The REGISTER section is still exactly the 91. n = 7 rides a new section, REG7 (0x0B), written only when an n = 7 label is populated.
     An older build skips REG7, warns once and opens the n ≤ 6 part.
   - The mask's 12 bytes already hold bits 91–95. Bits 96–139 add 6 + 6 bytes, written only when one is set.
   - Rates go 140 wide only when an n = 7 rate is off 1.
   - An n ≤ 6 link is byte-identical to the base (checked against the base tree's codec). The worst 140-label link is 1,816 characters,
     under the 2,000 ceiling.
6. **Projects.**
   - The register already saves by id. The basis word reads `n<=7 …` only when an n = 7 label is in the record.
   - The rates and the A ↔ B stores are written 91 wide while their n = 7 part is empty or 1.
   - So an older file's bytes never move: `serialize-bytes` gives **22 / 22 sha-256 identical** against the base tree (11 full, 11 edit).
   - A 91-wide record opens padded: n = 7 rates at 1, stores at 0.
   - **An older tree opening a 140-wide record:** it drops the n = 7 labels (restore by id). It also drops a 140-wide rates array or A ↔ B
     store, because its length check wants 91, and keeps its own. That is truncation, as the brief expected, and slightly more of it.
7. **The period.**
   - With n = 7 the unit is 1/352 800 (lcm(1…7)² = 176 400), and the longest period is 2π·352 800 a.u. = 53.6 ps.
   - `period.js` has a `deep` second pass (q ≤ 4·10⁵, judged to 1e-13). It runs only when the first pass found nothing, and only for
     hydrogen. So every n ≤ 6 answer is the one it was.
   - The REPEATS line names its closed form, 14400π or 705600π.
8. **The equalizer gates on n = 7.** Its kernel has six shell accumulators and would fold n = 7 into n = 6. A populated n = 7 now stands it
   down with a sentence, the same road as its "one rate per shell" gate. It never folds n = 7 into n = 6.
9. **Fr–Og (item 4) are contained, so they are live.**
   - `atoms.js` has NAMES to Og and `ZMAX = 118`. The noble cores now include [Rn]. `MOVES` already carried Ac, Th, Pa, U, Np, Cm and Lr's
     7p¹ from row A.
   - The ATOMS window has period 7 (`[7, 87, 118]`), and the SPECTRUM ELEMENT knob runs to 118.
   - The Picker's 118 tiles are all live, with 32 new `el-` pictures (0 errors, 126.8 kB, `lab/img/menu`).
   - STATUS past Rn reads "Og · NUMERICAL · non-relativistic Xα: the 7s/7p levels are a relativistic story (Og’s 7p₃/₂)". The ATOMS
     MODEL line says the same.
10. **SPECTRUM's fold.**
    - The coloured `n1` … `n7` is now a button that folds its shell's chips. It uses the kit's fold law: `.lw-fold-body` hidden by the
      attribute, `aria-expanded` and `aria-controls`. There is no chevron. Its hover says "fold n = 7" or "unfold n = 7".
    - A folded shell keeps its row and writes "*k* populated" beside the number when any of its labels is on.
    - Folded chips are display:none, so THE PAINT GESTURE crosses only the open rows. The number's press stops the stroke's
      pointerdown, so its click is not swallowed.
    - The ladder gains its n7 line and is otherwise untouched.
    - The folded set is WORKSPACE: the SPECTRUM card's layout record carries `shells`, read and applied through the presses as `more`
      and `core` are. It is written only when it is not the default [7], so n = 7 is folded on a first run and for any older record.
    - Every byte of an older layout is unchanged.
    - rack-deps: SPECTRUM is still at **25**. The fold lives in `lab/spectrum.js` and the WORKSPACE road in `rack-wiring.js`; neither
      adds an `app.*` crossing.
11. **The seventh shell's ink** is appended to the kit's `N_COLOR` / `N_RGB` / `N_RGB_LIGHT` in `palette-app.js`, the way Jet Black is.
    - Hue 350. Dark is hsl(350 85% 76%). Light is hsl(350 97% 47%), which is 3.46 : 1 on the well and 3.94 : 1 on the card (the
      wave-46 rule).
    - `--n7` is defined in `lab.css`.
    - KIT BRIEF line for MIR: *the shell set carries n = 7*.

## The gas table, measured

The gas table does not size by the register. `gas.js` is the box's own 256-mode register (l ≤ 15, n_r < 16) and never reads `BASIS`. Its
Hermite table is 16 · 16 rows × 256 × 2 f32 = **524,288 B before and after**, built in 69 ms in node. The brief's (140/91)² ≈ 2.4× does not
apply, and n = 7 needed no decision there. `gas.test` passes 9 / 9, its timing rows included.

## THE LOCK (no re-capture)

| Fixture | Result |
|---|---|
| `digest-lock.mjs --check --query gastab=0` | **GREEN: 843 values · 0 readback differences · 0 record-byte differences**, 60 s |
| the same `--fixture research/release-0.4.0/measure/digest-lock-s4a.json` | **GREEN: 987 values · 0 differences**, 59 s |

The append held, so no fixture was touched.

## Fr–Og, the table (`.tmp/atoms-sweep.mjs 87 118`, node; all bound, normalised to 1e-8, n − l − 1 nodes, monotone totals)

| Z | sym | ms | it | residual | E (Eh) | top level |
|---|---|---|---|---|---|---|
| 87 | Fr | 435 | 48 | 4.5e-10 | −22461.199 | 7s −3.123 eV |
| 88 | Ra | 300 | 41 | 9.3e-10 | −23079.464 | 7s −3.571 |
| 89 | Ac | 309 | 41 | 9.5e-10 | −23707.163 | 6d −3.731 |
| 90 | Th | 395 | 49 | 1.4e-9 | −24344.386 | 7s −4.116 |
| 91 | Pa | 359 | 46 | 1.3e-9 | −24991.711 | 6d −3.862 |
| 92 | U | 382 | 45 | 1.7e-9 | −25648.712 | 6d −3.886 |
| 93 | Np | 335 | 43 | 1.8e-9 | −26315.607 | 6d −3.894 |
| 94 | Pu | 360 | 50 | 1.3e-9 | −26992.697 | 7s −3.878 |
| 95 | Am | 321 | 45 | 1.4e-9 | −27679.584 | 7s −3.911 |
| 96 | Cm | 357 | 47 | 3.2e-9 | −28376.193 | 6d −3.855 |
| 97–102 | Bk … No | 293–346 | 37–42 | ≤ 2.8e-9 | −29083.573 … −32772.263 | 7s −3.97 … −4.11 |
| 103 | Lr | 328 | 37 | 3.3e-9 | −33540.360 | 7p −2.970 |
| 104 | Rf | 422 | 39 | 3.3e-9 | −34318.846 | 6d −4.584 |
| 105–112 | Db … Cn | 309–389 | 39–44 | ≤ 4.7e-9 | −35107.500 … −40918.186 | 7s −4.89 … −5.76 |
| 113 | Nh | 375 | 41 | 3.2e-9 | −41789.692 | 7p −3.579 |
| 114–117 | Fl … Ts | 326–355 | 39–40 | ≤ 3.2e-9 | −42671.580 … −45379.809 | 7p −4.26 … −6.59 |
| 118 | Og | 321 | 39 | 3.4e-9 | −46303.496 | 7p −7.406 |

- **Convergence:** all 32 below 1e-8 (worst 4.7e-9, Hs), ∫q = Z to 2e-13.
- **The node count:** the first sweep read "6s nodes 6" for Nh–Og. The extra crossing sits at r ≈ 24.5 a₀ where |u| is 1e-25 of its peak.
  That is the eigen-solve's noise floor in the tail, not a node. The count, which is checked and never used, now reads only crossings
  above 1e-12 of the peak. After that, all 32 are clean.
- **NIST gap (A's method; NIST's non-relativistic LDA tables stop at U):**
  - The 1s sits 26 ppm (Fr) and 18 ppm (U) above NIST's LDA, the share Kr–Rn keep.
  - The 7s −ε is 3.12 / 4.04 eV here against LDA's 2.07 / 3.56: the Latter tail binds an s valence harder.
  - Relativity is the whole story past Rn. The scalar-relativistic 1s is 12.7 % (Fr) and 14.8 % (U) deeper, and Og's 7p splits.
  - These numbers are in `atoms.js`' header.
- **Z ≤ 86 is bit-identical.** I used A's snapshot method (`.tmp/atoms-snap.mjs`: every E, ε, a sha-256 of every u and of the GPU table's
  first 40 rows, every n ≤ 6 virtual ε, configs, terms, cores) on the base tree and on this one. **0 differences in 86 atoms**, and
  `valenceOf` agrees 1–118.

## The walk (`.tmp/walk7.mjs`, real pointer strokes, 0 page errors)

1. **First run:** n = 7 folded, n ≤ 6 open.
2. **6p stroke:** a stroke across 6p₋₁ → 6p₁ populates the three. It is **one** undo row, ‖c‖ = 1. The n = 7 chips stayed hidden (not
   crossed).
3. **Unfold:** a real press on `n7` unfolds it and paints nothing.
4. **7p stroke:** a stroke across 7p₋₁ → 7p₁ populates three more, one row.
5. **Save and reopen:** `serialize()` carries `shells: []` and `basis: n<=7 …`. I then folded n2 and n7 and loaded 1s. `restore()` brought
   back folded `[]` (WORKSPACE) and the eight labels (PROJECT).
6. **Folded count:** a 7s₀ press, then n7 folded, reads "4 populated" on its row.
7. **Older project:** a record with 91-wide rates (rate 1.5 on label 2) and a 91-wide A ↔ B store opens unchanged. It re-serialises 91
   wide, with Ω 0.07 kept.
8. **FILL ALL:** 140 labels.
9. **Picker:** 118 element tiles, 0 dim.

## Screenshots (`research/iteration-008/a7-build/`)

- `grid-n7-folded-desktop.png` / `grid-n7-open-desktop.png`: the grid at the desktop card. n = 7 open is ten chip rows, which is why it
  folds.
- `grid-n7-folded-300.png` / `grid-n7-open-300.png`: the card at phone width (274 px card in a 330 px window).
- `grid-n7-folded-count.png`: n = 7 folded with "4 populated".
- `picker-atomic.png`: the ATOMIC deck, period 7 live from Fr to Og. The racks overlap the deck in a driven `?menu=1` session, the same
  on the base.
- `el-fr-ra-u-lr-cn-og.png`: the new pictures: 7s (cut), 5f, 7p, 6d, 7p.

## Decisions

- **No `orb-7s` / `orb-7p` pictures.** The brief asked for the n = 7 subshell pictures `valenceOf` names. With Fr–Og live, no tile shows an
  `orb-` picture any more; even the 5s–6d set is now unreferenced by the Picker. Rendering two more unused assets would only add machinery,
  so `menu-thumbs.mjs` says why instead.
- **The default fold is the absence of `shells`.** That keeps every older layout byte-identical and makes "older record → n = 7 folded"
  true by construction.
- **THE SCALE and the BOX packet stay at 91** (above). This is honest physics, and it is what THE LOCK demanded. A seven-label Sturmian block
  is a real change of the model, not an append.
- **The equalizer gates instead of growing.** Growing it means a seventh band, a 7 × 7 uniform and a seventh fader. That is a UI change the
  brief excluded.
- **`QHO_RGB` stays modulo 6** (the oscillator's N ≥ 6 colours unchanged). The well's n = 7 levels reuse its first colour.
- **The squeeze knob's cap stays 0.33.** Its hover was re-measured on n ≤ 7: Var within 4e-4 (was 2e-3), and r = 0.5 is 0.015 % lost and
  0.7 % wrong.

## Tests

| Run | Result |
|---|---|
| `./test.sh node` | exit 0 |
| `node tools/rack-deps.mjs --classes --no-write` | HOLDS (spectrum 25) |
| `node tools/new-project.mjs --check` | in step |
| THE LOCK × 2 | GREEN 843 / 0 and 987 / 0 |
| `tools/serialize-bytes.mjs` against the base tree on 9682 | 22 / 22 identical |
| `lw-facade` | GREEN, no pin change |
| `history` | GREEN, the five legacy fixtures included |
| `new-project` | GREEN |
| `project-formats` | 5 / 5 |
| `field-law` | 9 / 9 |
| `start` | 3 / 3 |
| `lw-links` | GREEN |
| `render-regressions` | GREEN |
| `current` | GREEN on a rerun: one `followsPalette` read failed once, and the base passed the same run |

- **wigner W42-8 at 140 labels:** 131 / 132 / 139 / 76 ms, under 150. `gas.test` passes 9 / 9.
- **Existing tests that changed** (the register is wider):
  - The 91-wide arrays became `BASIS.length`.
  - The size laws now say 140, and the cornell ladder 38.
  - Kick's ⟨p_z⟩ is 0.5494 k. That is +f(1s→7p) = 0.0048 on n ≤ 6's 0.5446.
  - The squeeze's lost norm and cap.
  - wigner-qho's 28 m = 0 labels.
  - qband counts Sol's n ≤ 6 sub-register.
  - The sturmian tests run on the scale's 91. sturmianreg asserts the 140-wide zero rows.
  - statelink draws its sparse/dense law from the 91, and its §11 judges n = 7 (REG7, the mask extension, the 140 rates, the worst case).

## Proposed CLAUDE.md sentences

> THE REGISTER IS n ≤ 7 (iteration 008 A7): `hydrogen.js` BASIS is 140 labels, the 91 of n ≤ 6 first at their old indices (`N6`), n = 7's
> 49 after; a mode table has seven slots (`lag1.z` / `leg1.z` in the kernel, 0 for every older record), the radial rows are `atoms.js
> rowOfNr` (the 6 × 6 grid, n = 7's 7s and 7i at 36 + l). THE SCALE λ and the BOX packet keep the 91 (THE LOCK's sturmian and box rows);
> the equalizer gates on a populated n = 7. A link carries n = 7 in REG7 (0x0B), the mask's six extra bytes and 140-wide rates only when
> needed; a project writes rates and A ↔ B stores 91 wide while n = 7 is empty — an n ≤ 6 file's bytes never move.
> SPECTRUM's coloured `n` number folds its shell (no chevron; a folded shell counts its populated labels; the paint crosses open rows only);
> the folded set is the card's WORKSPACE `shells`, written only when it is not [7] — n = 7 folded on a first run and for an older record.
> The ATOM system runs Z = 1…118 (Fr–Og, all converged; STATUS past Rn names the 7s/7p as relativistic); Z ≤ 86 is A's bit for bit.
