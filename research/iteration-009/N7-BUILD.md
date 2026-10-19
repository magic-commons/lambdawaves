# N7 · n = 7 THROUGH THE APP — build note (iteration 009, branch `it009-n7` from `033424d`, gate 9311 / GD 5311)

Josh (10-19), on Yan's two calls (the equalizer's seventh band; THE SCALE at n = 7): "For n=7 let's remind ourselves of the ambitions of
the other tasks of the app and try to implement it there." A7 (iteration 008) took the register to 140 labels but left three physics rows
at n ≤ 6. This row carries n = 7 into them, with the physics as the judge. It also lists every other n ≤ 6 stop and what happened to it.
Nothing is pushed.

## 1 · THE SCALE (Sturmian λ) to n = 7

**What moved.**
- `lab/sturmianreg.js:45`: the (l, m) blocks now take every label, so there are **49 blocks of ≤ 7** (it was 36 blocks of ≤ 6), and the
  rank is 140. The A7 rule that zeroed n = 7's rows is gone. An n = 7 coefficient now has its own column and evolves under the scale.
  - The header explains the change and cites Hylleraas–Undheim–MacDonald.
- `lab/sturmian.js:87`: `resolveLabels()` defaults to all 140 labels, not `BASIS.slice(0, N6)`. The header notes iteration 009.
- `lab/windows/spectrum.js`: the status line reads `STURMIAN · λ … · 140 labels` (`:213`) and the SCALE seg says "140 radials" (`:78`).
  The ladder and "load eigenstate" name l = 6 as `i` (`'spdfghi'`); `lab/rack.js:881` (the copy line) does the same.

**The proof that the move is the one a larger variational space must make.** Adding one Sturmian to a block can only move each of its
variational eigenvalues **down or leave it where it was**. The Hylleraas–Undheim–MacDonald interlacing law is
E_k(n ≤ 7) ≤ E_k(n ≤ 6) ≤ E_{k+1}(n ≤ 7).

I checked this on 168 eigenvalues: 8 (λ, Z) cases × 21 eigenvalues each, one per (l) block for l ≤ 5 (H and S do not depend on m).
The script is `.tmp/n7/eig-table.mjs`, and the new judge **Q9** in `tests/sturmian.test.mjs` holds the same check.
- **Every eigenvalue moved down or held**, and none failed interlacing.
- The largest upward move is **3.5e-17**, which is rounding. All 11 eigenvalues that held to within 1e-14 are exact: they are the label
  n₀ at λ = Z/n₀ (E = −λ²/2), as sturmian.js says they must be.

| case | the n ≤ 6 eigenvalues | largest drop | smallest drop | held exactly |
|---|---|---|---|---|
| **THE LOCK's row, λ 1.4, Z 1** | 21 | 10.10 (s, k = 5) | 1.7e-8 (1s) | 0 |
| λ 1 (1s exact) | 21 | 4.56 | 0 | 1 (1s) |
| λ ½ (2s, 2p exact) | 21 | 0.657 | 0 | 2 |
| λ ⅓ (3s, 3p, 3d exact) | 21 | 0.135 | rounding | 3 |
| λ 0.25 (the knob's floor) | 21 | 0.0261 | rounding | 4 |
| λ 3 (the knob's ceiling) | 21 | 53.66 | 3.4e-3 | 0 |
| He⁺ λ 2, Z 2 (1s exact) | 21 | 18.23 | 0 | 1 |
| λ 1.7611, Z 2 | 21 | 13.27 | 7.1e-13 | 0 |

THE LOCK's row in full (λ 1.4, Z 1; each (l) block, k from the bottom):

| l | k | E_k (n ≤ 6) | E_k (n ≤ 7) | move |
|---|---|---|---|---|
| s | 0 | -0.499999981973 | -0.499999999331 | -1.736e-8 |
| s | 1 | -0.113162004546 | -0.120307968198 | -7.146e-3 |
| s | 2 | 0.135002465112 | 0.052853178497 | -8.215e-2 |
| s | 3 | 0.763641961509 | 0.426801608881 | -3.368e-1 |
| s | 4 | 2.712780954343 | 1.311504612434 | -1.401e+0 |
| s | 5 | 14.081736605554 | 3.981729472444 | -1.010e+1 |
| p | 0 | -0.118862442795 | -0.122620169126 | -3.758e-3 |
| p | 1 | 0.075064116509 | 0.020556842445 | -5.451e-2 |
| p | 2 | 0.532288470101 | 0.311113612259 | -2.212e-1 |
| p | 3 | 1.776494420956 | 0.955095270896 | -8.214e-1 |
| p | 4 | 6.975015435229 | 2.648072265740 | -4.327e+0 |
| d | 0 | 0.003788733564 | -0.021165960605 | -2.495e-2 |
| d | 1 | 0.315465698663 | 0.185343724970 | -1.301e-1 |
| d | 2 | 1.126999857638 | 0.644626108081 | -4.824e-1 |
| d | 3 | 3.967079043469 | 1.762116041500 | -2.205e+0 |
| f | 0 | 0.137973166531 | 0.074161481371 | -6.381e-2 |
| f | 1 | 0.676777301190 | 0.399263916578 | -2.775e-1 |
| f | 2 | 2.381916198946 | 1.162768749100 | -1.219e+0 |
| g | 0 | 0.341217593571 | 0.200076372795 | -1.411e-1 |
| g | 1 | 1.415146042793 | 0.731148745172 | -6.840e-1 |
| h | 0 | 0.746666666667 | 0.395372043844 | -3.513e-1 |

The 1s at λ = 1.4 is −0.49999999933 with n ≤ 7, against −0.49999998197 with n ≤ 6: one more Sturmian brings it 26× closer to −½. The
d block's ground eigenvalue crosses zero and becomes bound: +0.0038 → −0.0212.

## 2 · The BOX packet to n = 7

- `lab/well.js:79`: `wellPacket` projects the Gaussian onto all **140** of the well's eigenstates (it was the first 91).
  - `captured` = the 91's share + n = 7's Σ|⟨q|packet⟩|², so it can only grow. The normalised coefficients moved with it.
  - The per-point factoring (K11) is unchanged. It now runs over N = 140.
- The stated resolution is now **a/7** (it was a/6), in `kepler.js` (the GAS readout's sub-line, both roads), the GAS BASIS seg
  (`spectrum.js:48`: the option reads `140`, its id stays `reg`), and the headers of `gas.js` and `mathworker.js`.
- **Measured** (the well test's packet: σ 1.6, z₀ −4, k 0.8, a = 10):
  - captured **96.68 % → 99.22 %**. The 91 of n ≤ 6 still hold exactly the 96.68 % they held (0.9668282746852214); n = 7 adds 2.54 %.
  - 40 labels are populated (it was 27).
  - THE LOCK's `box` state (`enterBox`) reads 98.2 % held in the browser, with 13 of its 40 labels at n = 7.

## THE LOCK — the sturmian and box rows re-captured by name

Q's procedure, with `.tmp/n7/relock.mjs` (Q's `q-relock.mjs`: the tool's own writer, checked to round-trip each fixture's bytes first).
1. `--write --query gastab=0 --fixture .tmp/n7/lock-fresh.json` on this tree (987 values, every state repeatable, 0 page errors). I never
   ran `--write` over a fixture.
2. Diff by name against both fixtures (`.tmp/n7/lockdiff.mjs`). Leaves in the fixtures' retired `h2` / `h2plus` / `helium` states are
   ignored, as the tool ignores them. **Only `states.sturmian.*` and `states.box.*` moved**: 39 leaves in each fixture, and **0 others**.
3. Copied exactly those 39 leaves into each fixture. Each git diff is 78 lines (2 × 39).
4. `tools/perf/digest-lock.mjs`'s header gains an ITERATION 009 N7 paragraph.

| state | grid | before → after (both fixtures alike) |
|---|---|---|
| sturmian | 64³ | digest 64071691 → 18d537f5 · integral 0.498599 → 0.304224 · maxRho 0.195255 → 0.162158 · pack fd5b6e4e → 5df964ca · rp d76bafee → bc7bbd95 · rpL c940dc88 → c562acb1 |
| sturmian | 96³ | digest e998e935 → 8eb7835 · integral 0.498624 → 0.304258 · maxRho 0.214903 → 0.185479 · pack → 5df964ca · rp 7ff05afb → eb549f04 · rpL 99632214 → 53e1d05a |
| sturmian | 128³ | digest 5df54445 → 6797aa61 · integral 0.498628 → 0.30427 · maxRho 0.225368 → 0.198571 · pack → 5df964ca · rp 375e5c1e → 82710bf6 · rpL 6d26d4b2 → 52d7c0e |
| box | 64³ | count 27 → 40 · digest 446a06f9 → 9eb94285 · integral 0.999327 → 0.999297 · maxRho 0.0144257 → 0.0150782 · pack b7f664a5 → 962bb9e7 · rp 8f5758f0 → 46009116 · rpL 9b1a3e7c → 4ca8783c |
| box | 96³ | count 27 → 40 · digest 72d60b82 → 3af9533b · integral 0.999295 → 0.999304 · maxRho 0.0145669 → 0.0152291 · pack → 962bb9e7 · rp cb3bfa37 → 5c56b194 · rpL 7b97503a → 43788444 |
| box | 128³ | count 27 → 40 · digest 7de08b65 → 5b3c8f5 · integral 0.999296 → 0.999305 · maxRho 0.0145972 → 0.0152706 · pack → 962bb9e7 · rp e57380e6 → b46b8138 · rpL e6ffd8db → d5e809b9 |

**The sturmian integral's move is the physics, checked on the CPU** (`.tmp/n7/sturm-lockrow.mjs`). The row is 1s + 2p₀ at λ 1.4, read at
t = 3.7. The field draws the anchor's two labels, so the integral is |c₁ₛ(t)|² + |c₂ₚ₀(t)|².
- n ≤ 6: 0.2979 + 0.2011 = **0.4990**.
- n ≤ 7: 0.2787 + 0.0258 = **0.3045**.
- The GPU's 0.4986 and 0.3042 are those numbers less the grid's truncation.

**Final: GREEN 843 / 0 and 987 / 0** (`--check --query gastab=0`, the second with `--fixture …/digest-lock-s4a.json`): 0 readback
differences, 0 record-byte differences, nothing unrepeatable, 0 page errors, 55 s and 56 s.

## 3 · The equalizer's seventh band

- `lab/equalizer.js`:
  - `EQ_SHELLS = 7` (`:14`) and `gammaAbs2(G, n, n′)`.
  - Seven gains.
  - The gamma passed to the kernel is a **7 × 7** table (`:92`).
  - The A7 gate ("n = 7 is populated") is gone.
  - **The table is solved over the shells in play** (`:73`): **six while no n = 7 label is populated**, seven once one is. Six-shell
    arithmetic gives the old numbers to the bit. Row and column 7 of a six-shell table are the identity's, and they multiply acc₇ = 0.
    - Proof: `.tmp/n7/eq-bits.mjs` ran the base tree's `equalizer.js` beside this one on n ≤ 6 states. It covered 432 cases (4 states ×
      9 presets × 3 gain sets × 2 Z × with or without pops) and compared the 6 × 6 gamma corner, κ, mode, λ, λmin, purity, repaired and
      serialize with Object.is: **0 differences**.
- `lab/field.js` EQ_WGSL (`:176`): seven accumulators (`min(c.w − 2, 6)`, so n = 7 no longer folds into n = 6), 7 × 7 loops, and the
  uniform `array<vec4<f32>, 25>`. `EQ_F` is 104 floats, with κ, mode and floor at 100–102.
  - The locked COMPUTE_WGSL text is untouched (EQ_WGSL is derived from it, as before).
  - THE LOCK never runs the equalizer.
- The window (`lab/windows/spectrum.js:123`, `:145`, drawGrid): seven faders, `n 1` … `n 7`, each beside its own row of a **7 × 7 grid**.
  - The grid is 152 px (it was 132), so a cell is the same size as before (`lab/skin.css:633–636`).
  - The no-nodes test reads the table's largest λ (it read `lambda[5]`).
- AUDIO IN (`lab/eq-audio.js:7`): HIGH drives n = 5–7.
- The users of the table read the 7-stride:
  - the COHERENCE map (`coherence()`), which keeps `Math.hypot`, so its numbers are bit-identical;
  - CALCULUS's A(t) `g2` (`readouts.js:144`, `gammaAbs2`).
- **Saves.** `serialize()` writes six gains while the seventh is 1, so an n ≤ 6 project's bytes never move. It writes seven when the seventh
  is off 1. `restore()` reads up to seven.
- **Measured in the browser** (Firefox, 9311), with 1s + 3d₀ + 7p₀ + 7i₋₂ under GAUSSIAN JITTER:
  - shells 7, mode 1 (a mixture), PURITY 0.661, λ = [5e-16 … 6.06];
  - a real press on the seventh fader (0.5): PURITY 0.460, |Γ₁₇| 0.307 → 0.153;
  - the same table over 1s + 2p₀ + 3d₀: shells 6, PURITY 0.633.
  - Under STURMIAN it stands down with its sentence. 0 page errors.

## 4 · Every other n ≤ 6 / 91 stop in the physics rows

| stop | done | why |
|---|---|---|
| THE SCALE's propagator zero rows (`sturmianreg.js`) | **gone** | §1 |
| qband (`tests/qband.test.mjs`) | **a second census at n ≤ 7** | Sol's anchor (n ≤ 6: 36 · 351 · 21 · 15 gaps) is kept as it is, because it is his count. The new block counts all 140 labels from `coaxialPolynomial` against **Sol's rule carried one shell up**: N² = **49** labels, **25** bins at ω = 0 (\|q\| ≤ 12), Σ 2(n+n′−2)+1 = **273**, so **571** channels; **21** distinct gaps, the widest 24/49 a.u. (172800 / 352800) at \|q\| ≤ 6. Both rings AGREE on every row. |
| the kick's ⟨p_z⟩ (`tests/kick.test.mjs`) | **numbers moved to n ≤ 7** | A7 already moved K EHRENFEST to 0.5494 k. The three sibling judges still said 0.5446 / 0.546. They now expect the register's n ≤ 7 bound share: x-slap 0.1089 → **0.1099**, t = 4 0.546 → **0.5494**, diagonal 0.5446 → **0.5494** k. The tolerances are unchanged; the grid reads 0.1056, 0.5453 and 0.527. |
| the BOX packet | **140** | §2 |
| THE ERROR FIELD (P3) | already n = 7, checked | `errorField` reads `psiAt` / the Sturmian records, both 140 wide. Live at 64³: 7s + 7p₀ + 7i₃ RMS 1.16e-7, worst 1.8e-6, toward zero. Under THE SCALE (λ ½, rank 140): RMS 7.2e-7, worst 1.5e-5. No change needed. |
| THE DIRECT PACKET (P1), THE FACTOR CURRENT and THE CONTINUITY RECORD (P2) | left | They are molecular: the AO packet, the Löwdin factors and PLANE's sample. None of them reads the hydrogen register or a shell count. |
| THE MOBILITY EDGE (P4) | left | LATTICE's Anderson cube (≤ 216 sites of its own register). It has no n. |
| inter-shell Stark | already 140 (A7) | The STARK badge said "all 91 labels"; it now says 140 (`badges.js:77`). |
| SEPARABLE's 91 slots (56 triples) | left | Its labels are re-sorted by energy. Adding N = 6 triples would interleave with the old ones under an anisotropic ω and move a saved slot's meaning. It is not one of the physics ambitions. |
| statelink's 91 (REGISTER section) | left | That is the link's byte law (A7's REG7). It is format, not physics. |
| `QHO_RGB` mod 6, `period.js`'s first pass, Wigner's n ≤ 6 timing note | left | A7 decided these, and none is a stop. |
| `radiation.js` plain names | fixed | `7i0` resolved to `7undefined0`. It now reads `'spdfghi'`. |

## Tests whose numbers moved (each justified by the physics)

- `sturmianreg`: rank 91 → **140**, blocks 36 → **49**, ±m pairs 35 → **56** (Σ_l l(7 − l)). The "n = 7 rows are zero" assertion became
  "n = 7 is in the scale": 29 eigenvectors are dominated by an n = 7 label.
- `sturmian`:
  - N = 91 → 140 throughout. `block()` reaches n = 7.
  - **Q2's Γ-route tolerance 1e-11 → 3e-11.** Γ is the ORACLE's alternating sum: at n = 7, T and H read 1.0e-11 / 1.3e-11. The
    cancellation-free quadrature route still holds 1e-13.
  - Q5's numpy ladders are pinned to the n ≤ 6 blocks (`block(l, m, 6)`): the oracle is of those.
  - **New Q9** (above).
  - Q8 median: 13 ms for 140 × 140, under the 100 ms limit.
- `well`: captured **0.96683 → 0.99223**. The loops run to `BASIS.length`.
- `calculus` C5: the packet is loaded on all 140 labels. The wall force still equals the force to 7e-16.
- `equalizer`: the 7-stride. It gains **THE SEVENTH BAND** (FLAT and the split hold to 1e-12 on 1s + 3d₀ + 7p₀ + 7i₋₂; every jitter is
  PSD with a unit diagonal; the pulse is rank one at λ = 7) and **THE SEVENTH GAIN IN A SAVE**.
- `coherence`: a 140-wide pops array.
- `kick`: above. `hydrogen`, `stark`: wording only. Their loops already ran over 140.

## Gate

| run | result |
|---|---|
| `node tests/pwa.test.mjs --write` | written |
| `./test.sh node` | **exit 0** (the first run had one red, coherence's `comb`: `Math.sqrt(a² + b²)` ≠ `Math.hypot`; `coherence()` keeps hypot now) |
| `node tools/rack-deps.mjs --classes --no-write` | exit 0, HOLDS, spectrum 25 |
| `node tools/new-project.mjs --check` | in step (16098 B) |
| THE LOCK ×2 | **GREEN 843 / 0 and 987 / 0** after the by-name re-capture (above) |
| light check (`.tmp/n7/light*.mjs`, Firefox) | the equalizer at seven (verb + a real fader press), n ≤ 6 under the same table, THE SCALE on 7s + 7p₀, THE BOX bow, the error field: **0 page errors** |

Screenshots (`research/iteration-009/n7-shots/`):
- `equalizer-seven-card.png`: the card, GAUSSIAN JITTER, n 7 at 50 %.
- `equalizer-seven-fader.png`: the same with the stage showing 1s₀, 3d₀, 7p₀ and 7i₋₂.
- `equalizer-n6-state.png`: an n ≤ 6 state, with row 7 empty.
- `scale-n7-state.png`: 7s₀ + 7p₀ under STURMIAN (the equalizer stood down).

## Found, not built (for Sos / Josh)

- **Under a propagator, the field draws only the anchor's labels.** `rack.js modesAt` uses `renderSet()` of the labels populated at the
  anchor. THE SCALE's evolution spreads c(t) across each (l, m) block, and the picture leaves that spread out. THE LOCK's sturmian row
  draws **30 %** of its S-norm at t = 3.7 (50 % at n ≤ 6). The inter-shell Stark propagator likely shares this; I did not check it. It
  predates this row and is not specific to n. Fixing it would mean rendering the blocks' support, which is its own row with its own LOCK
  move.
- The knob floor λ = 0.25 cannot reach λ = 1/7 (the hydrogen limit of n = 7). The light check asked for 1/7 and got 0.25. Widening the
  knob is a UI call.

## Proposed CLAUDE.md sentences (replacing A7's "THE SCALE λ and the BOX packet keep the 91 …; the equalizer stands down on a populated n = 7")

> THE SCALE λ and the BOX packet hold all 140 (iteration 009 N7): the Sturmian (l, m) blocks reach n = 7 (49 blocks, rank 140; every
> n ≤ 6 variational eigenvalue moved down or held — Hylleraas–Undheim–MacDonald, `tests/sturmian.test.mjs` Q9) and `wellPacket`
> projects on the 140 (captured 96.68 → 99.22 % on the well test's packet), so THE LOCK's `sturmian` and `box` rows were re-captured by
> name (39 leaves a fixture). THE BEAT EQUALIZER has seven bands (`equalizer.js` `EQ_SHELLS`, the kernel's seven accumulators, a 7 × 7
> grid and seven faders): its table is solved over six shells while n = 7 is empty — the old arithmetic to the bit — and over seven once
> it is not; a save writes six gains while the seventh is 1.

And in THE LOCK paragraph: "… iteration 009 N7 re-captured `states.sturmian.*` and `states.box.*` by name (39 + 39 leaves) when THE SCALE
and the BOX packet took n = 7; a fresh capture moved no other leaf."
