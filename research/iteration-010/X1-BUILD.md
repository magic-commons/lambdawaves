# X1 · THE BLOCKS' SUPPORT — build note (iteration 010, branch `it010-support` from `43d1e44`, gate 9351 / GD 5351)

N7's find: under a propagator the field drew only the labels populated at the ANCHOR (`rack.js modesAt` → `reg.renderSet()`), while the
evolution spreads c(t) through every block the anchor touches. THE LOCK's sturmian row drew 30 % of its S-norm at t = 3.7. This row draws
what the evolution reaches. Nothing is pushed.

## 1 · The law chosen: the REACH, cut at the register's own floor

`lab/state.js` (`reach()`, `_renderReach()`, `driven()`, `reachNmax()`):

- **When:** `driven()` holds under a non-diagonal H. That is a PROPAGATOR (THE SCALE, the INTER-SHELL Stark) **or** the within-shell Stark
  field (F ≠ 0, no propagator). The within-shell field has the same defect (2p₀ ↔ 2s at rate 3F; the anchor's two labels draw 84 % at
  t = 100), so it takes the same law. It is not a propagator in the code's sense, so I state it here. With F = 0 and no propagator,
  `renderSet` runs today's code unchanged.
- **What:** the reach. It holds every label whose **dephased weight** w_a = Σ_k |C_ak|² |d_k|² exceeds `EPS_POP` (1e-14), the floor
  `populated()` already applies to the anchor.
  - d is the anchor's normal-mode amplitude: `CᵀS c(0)` under a propagator, or the (n, m) block's `Vᵀ c(0)` under the within-shell field.
  - Over a non-degenerate block, w_a is the long-time mean of |c_a(t)|².
  - The drawn set is the reach, heaviest first, with mute and solo as before, capped at `RENDER_CAP`.
- **Why the weight and not "whole blocks" or "|c_a(t)| above a floor":**
  - (a) w depends on the anchor and H only, not on t. The drawn set is fixed between edits: no mode pops in or out as t moves, and
    `rack.js stateReaders` still caches by `reg.version`.
  - (b) On every row measured, the reach IS the touched blocks (13 = the s₀ + p₀ blocks; 28 = the m = 0 block). It also drops what a
    block rule would wrongly keep:
    - an exact eigenstate's partners. 1s at λ = 1 reaches only itself; the partners' w is about 1e-32.
    - eigSymQL's rounding across m blocks under the inter-shell Stark: 111 labels with w ≈ 1e-28, all below the floor.
  - (c) A per-t floor on |c_a(t)| would re-sort and re-upload the mode list every frame.
- **RENDER_CAP does not rise.** It is already the whole register (140, kernel `MAX_MODES` 320). The widest possible reach is 140, the same
  count an undriven 140-label state draws today, so the phone keeps the same cap.
- **THE SCALE's AUTO box follows the reach** (`rack.js sturmHalf`: `reg.reachNmax(1e-3)` in place of `reg.nmax(1e-3)`, the same 1e-3 rule
  read on w).
  - A Sturmian's box is its λ-scaled extent. The propagated state leaves the anchor's box at once.
  - Measured on the CPU (96³ midpoint quadrature of the records, `.tmp/x1/box.mjs`): the reach drawn in the anchor's box (5.714) holds
    98.11 %; in the reach's box (12.347) it holds 99.985 %.
- **The Stark box stays the anchor's.**
  - The records are hydrogen's own, and the anchor's box (16) holds 99.8 % at t = 3.7.
  - Read on w, the inter-shell tail would take the box to n = 7 (121 a.u.) at F = 0.01. There the 64³ grid cannot resolve the 1s: the
    CPU grid holds 62.8 %.
  - That tail lies past the classical saddle (F_c(3) = 7.7e-4), so it is the n ≤ 7 basis's stand-in for ionisation (the window says so).
    It is not a feature to chase with the box.

## 2 · The drawn fraction, before → after

"Labels" is the quadratic form c_R† S_RR c_R / c†Sc over the drawn set R, from the CPU (`.tmp/x1/frac.mjs`; the node judges below). "GPU"
is `fieldDigest().integral` (∫_box ρ over the S-norm, so it includes the box's truncation) at the desktop default (64³). "Before" is the
base law, emulated in the page by overriding `driven` and `reachNmax`. The emulation reproduces the fixture's base digest `18d537f5` to the
bit.

| row (anchor 1s + 2p₀, 1/√2 each) | t | drawn | labels before → after | GPU 64³ before → after | 128³ after |
|---|---|---|---|---|---|
| **THE LOCK's sturmian (λ 1.4)** | 3.7 | 2 → 13 | **30.449 % → 100 %** (1e-12) | 0.30422 → **0.99885** | 0.99922 |
| sturmian | 20 / 100 | 2 → 13 | 44.04 / 58.46 % → 100 % | — | — |
| INTER-SHELL Stark F 2e-3 | 3.7 | 2 → 28 | 99.954 % → 100 % | 0.99766 → 0.99811 | 0.99918 |
| INTER-SHELL Stark F 2e-3 | 100 | 2 → 28 | **83.560 % → 100 %** | 0.83381 → **0.99711** | 0.99813 |
| INTER-SHELL Stark F 1e-2 (the knob's top) | 3.7 | 2 → 28 | 98.854 % → 100 % | 0.98666 → 0.99795 | — |
| INTER-SHELL Stark F 1e-2 | 100 | 2 → 28 | 84.932 % → 100 % | 0.84763 → 0.94415 ¹ | — |
| within-shell Stark F 2e-3 | 3.7 | 2 → 3 | 99.975 % → 100 % | 0.99783 → 0.99803 | 0.99917 |
| within-shell Stark F 2e-3 | 100 | 2 → 3 | **84.059 % → 100 %** | 0.83873 → **0.99811** | 0.99916 |

¹ Every label is drawn. The 5.6 % missing is outside the anchor's 16 a.u. box: n ≥ 3 labels past their saddle. The CPU grid
(`.tmp/x1/starkn.mjs`) gives the same number, 94.57 %. This is the box choice in §1.

**Three roads agree on the LOCK row.**
- The quadratic form gives 100 %.
- The CPU record quadrature in the reach's box gives 99.985 %.
- The GPU integral gives 99.885 % at 64³ and 99.922 % at 128³. Before the change, the base's 0.30422 equalled N7's CPU 0.3045 less the
  grid.

## 3 · The cost

GPU timings come from `field.throughput` with `targetMs: 1500` (each road grown to ≥ 1.5 s). The default 60-dispatch call reads Firefox's
~100 ms submit-done granularity as a flat 1.68 ms. Canvas: 1600 × 914 on the desktop, 1200 × 686 at the phone's 0.75.

| row | quality | modes | reconstruct ms before → after | frame ms before → after |
|---|---|---|---|---|
| sturmian | desktop 64³ × 160 × 1 | 2 → 13 | 0.115 → 0.138 | 2.53 → 2.63 |
| sturmian | phone 64³ × 110 × 0.75 | 2 → 13 | 0.111 → 0.154 | 1.16 → 1.13 |
| sturmian | 128³ × 240 | 2 → 13 | 0.189 → 0.554 | 3.96 → 4.50 |
| INTER-SHELL F 2e-3 | desktop 64³ | 2 → 28 | 0.105 → 0.206 | 2.44 → 2.63 |
| INTER-SHELL F 2e-3 | phone 64³ | 2 → 28 | 0.101 → 0.218 | 1.04 → 1.21 |
| INTER-SHELL F 2e-3 | 128³ | 2 → 28 | 0.180 → 1.087 | 3.71 → 4.53 |
| within-shell F 2e-3 | desktop / phone 64³ | 2 → 3 | 0.083 → 0.095 / 0.081 → 0.083 | 2.42 → 2.54 / 1.08 → 1.03 |

- **CPU.** `reach()` runs once per edit: 26 µs (sturmian), 90 µs (inter-shell), 4 µs (within-shell), node (`.tmp/x1/cpu.mjs`). The
  per-reconstruct `reg.at(t)` is unchanged. It already evolved all 140 labels; only the mode-record loop grows from 2 to ≤ 28.
- **The governor's view.**
  - The added frame cost is ≤ 0.2 ms at 64³ and ≤ 0.9 ms at 128³. That is against a 120 Hz budget of 8.33 ms (the over line, ×4/3, is
    11.1 ms), so no notch and no scale step.
  - Live, with the governor and AUTO SCALE on and 4 s of PLAY: this headless Firefox is present-bound at 22–33 fps whatever the state. It
    sat at 64³ with scale 0.35 (the floor) before AND after on every row, so the run cannot tell the two laws apart.
- **The phone** keeps its old cap. The cap never moved: it is the register.

## 4 · THE LOCK — the sturmian row re-captured by name

Q's and N7's procedure (`.tmp/x1/relock.mjs` is N7's `relock.mjs`; it checks that the tool's own writer round-trips each fixture's bytes
before it writes).

1. `--write --query gastab=0 --fixture .tmp/x1/lock-fresh.json` on this tree: 987 values, nothing unrepeatable, 0 page errors.
2. Diff by name against both fixtures (`.tmp/x1/lockdiff.mjs`). **Only `states.sturmian.*` moved: 24 leaves in each fixture, 0 others.**
   The 144 other differing keys are the retired `h2` / `h2plus` / `helium` states, which the tool ignores. **THE LOCK holds no Stark state**,
   so the plan's "the Stark row" has no leaf to move. The inter-shell and within-shell rows are measured above, outside the lock.
3. Copied exactly those 24 leaves into each fixture: `count`, `digest`, `half`, `integral`, `maxRho`, `pack`, `rp` and `rpL` × 64/96/128.
4. `tools/perf/digest-lock.mjs`'s header gains an ITERATION 010 X1 paragraph.

| state | grid | before → after (both fixtures alike) |
|---|---|---|
| sturmian | 64³ | count 2 → 13 · digest 18d537f5 → aad6aff5 · half 5.71429 → 12.3469 · integral 0.304224 → 0.998849 · maxRho 0.162158 → 0.0846479 · pack 5df964ca → afb8c21a · rp bc7bbd95 → d7994b10 · rpL c562acb1 → c6384e1d |
| sturmian | 96³ | count 2 → 13 · digest 8eb7835 → aa65e211 · half 5.71429 → 12.3469 · integral 0.304258 → 0.999152 · maxRho 0.185479 → 0.100051 · pack 5df964ca → afb8c21a · rp eb549f04 → 79524b59 · rpL 53e1d05a → af048b48 |
| sturmian | 128³ | count 2 → 13 · digest 6797aa61 → af049a35 · half 5.71429 → 12.3469 · integral 0.30427 → 0.999216 · maxRho 0.198571 → 0.108228 · pack 5df964ca → afb8c21a · rp 82710bf6 → 5140343f · rpL 52d7c0e → dfe77c8d |

maxRho falls because the box is 2.16× wider and the density has spread into it.

**Final: GREEN 843 / 0 and 987 / 0** (`--check --query gastab=0`, the second with `--fixture …/digest-lock-s4a.json`): 0 readback
differences, 0 record-byte differences, nothing unrepeatable, 0 page errors, 53 s and 54 s.

## 5 · The judges (node, in the suites that own the propagators)

`tests/sturmianreg.test.mjs` §5 has 4 new judges and is 18/18 GREEN:
- **SUPPORT:**
  - The LOCK row's reach is exactly the s₀ + p₀ blocks: 13 labels, `anchored` 2.
  - The anchor draws 30.45 %, N7's find.
  - The reach draws 100 % (1e-12) at t = 3.7 and at 51 times to t = 515.
- **SUPPORT, by brute force** (the second road): over 400 times to t = 2063, no label outside the reach rises above EPS_POP (read: exactly
  0), and every label inside rises past 1e-4 (min 0.022).
- **The exact eigenstate** (1s, λ = 1) reaches only itself. The box's n is 1 there and 7 on the LOCK row.
- **The undriven identity:** 120 of 120 cases are byte-identical to today's law, inlined as the oracle (random states, mutes, solos,
  Zeeman, a propagator set and cleared). In scratch, `.tmp/x1/ident.mjs` checks against the **base tree's own `state.js`** (`43d1e44`):
  1200 / 1200 byte-identical.

`tests/stark.test.mjs` has 4 new judges and is GREEN:
- INTER-SHELL at F = 2e-3 and 1e-2: the reach is the 28 m = 0 labels, the reach draws 100 % at t = 3.7 / 100 / 1000, and no m ≠ 0 label
  rises above EPS_POP over 300 times (max 2.6e-28).
- WITHIN-SHELL: the reach is {1s, 2s, 2p₀}, drawing 100 % at t = 100 against the anchor's 84 %.
- F back to 0 is undriven again: the old record, with no `reach` key.

**Saves:** `serialize` / `restore` are untouched, so an n ≤ 6 project's bytes and every saved id hold. `new-project --check` is in step
(16098 B).

## 6 · Gate

| run | result |
|---|---|
| `node tests/pwa.test.mjs --write` | written |
| `./test.sh node` | **exit 0** |
| `node tools/rack-deps.mjs --classes --no-write` | exit 0, G-G HOLDS (spectrum 25) |
| `node tools/new-project.mjs --check` | in step (16098 B) |
| THE LOCK ×2 | **GREEN 843 / 0 and 987 / 0** after the by-name re-capture |
| `field-law` | GREEN (hydrogen RMS 2.34e-6, water RMS 8.31e-4) |
| `render-regressions` | rc 0 |
| `current` | rc 0 (15 PASS) |
| `take-in-bugs` (it sets the within-shell F) | RED at `:87` (`tags.metersClosed` undefined, the STATUS TAGS block). **The same red on the base `state.js` + `rack.js`**, so it is not this row's. It is not on the plan's list of pre-existing reds; X4 should look at it. |
| light check (`.tmp/x1/dbg.mjs`, the measure scripts) | within-shell F = 1e-3 in the page draws {1s, 2s, 2p₀}, and the badge, meters and status read normally. 0 page errors in every run. |

Screenshots (`research/iteration-010/x1-shots/`; PHASE · CLOUD, the default camera):
- THE LOCK's sturmian row at t = 3.7:
  - `sturmian-t3.7-before.png`: 2 modes, box 5.71.
  - `sturmian-t3.7-after.png`: 13 modes, box 12.35. The drawn S-norm has gone from 30 % to 99.9 %.
- The INTER-SHELL Stark row, F = 1e-2 at t = 100:
  - `stark10-t100-before.png`: 2 modes.
  - `stark10-t100-after.png`: 28 modes.
- `stark2-t3.7-after.png`: the INTER-SHELL Stark row, F = 2e-3, at t = 3.7.
- `within-t100-before.png` and `within-t100-after.png`: the within-shell Stark row at t = 100, 84 % → 99.8 %.

## 7 · Found, not built

- The **inter-shell Stark box** at a large F and a long t: every label is drawn, but the anchor's box loses the n ≥ 3 tail past the saddle
  (94.4 % at F = 1e-2, t = 100). A box that followed w would be 121 a.u. and would unresolve the 1s. DOMAIN AUTO OFF and the knob remain the
  reader's. A UI or physics call if anyone wants more.
- `badges.js` now reads "13 of 13 modes, 100 % of the norm" under a propagator, where it read "2 of 2". SPECTRUM's line reads
  "2 populated · 13 rendered". Both are true. The covered share is the dephased weight's, the only t-free number.
- `take-in-bugs :87` is a pre-existing red (above).

## Proposed CLAUDE.md sentences

After N7's "THE SCALE λ and the BOX packet hold all 140 …" sentence:

> THE BLOCKS' SUPPORT (iteration 010 X1): under a non-diagonal H — a propagator (THE SCALE, the INTER-SHELL Stark) or the within-shell
> Stark field — the field draws the REACH, not the anchor's labels: `state.js reach()` keeps every label whose dephased weight
> Σ_k |C_ak|²|d_k|² (d the anchor's normal-mode amplitudes) exceeds EPS_POP — a function of the anchor and H, never of t, so the drawn set
> is fixed between edits — and `renderSet` draws it heaviest first (mute, solo and RENDER_CAP = 140 as before; `anchored` counts the
> anchor). THE SCALE's AUTO box follows it (`rack.js sturmHalf` reads `reg.reachNmax(1e-3)`); the Stark box stays the anchor's. With no
> field and no propagator `renderSet` is today's law byte for byte (`tests/sturmianreg.test.mjs` §5, `tests/stark.test.mjs`). THE LOCK's
> sturmian row draws 30.4 → 100 % of its S-norm (GPU integral 0.304 → 0.999).

And in THE LOCK paragraph: "… iteration 010 X1 re-captured `states.sturmian.*` by name (24 + 24 leaves: count 2 → 13, the box 5.71 → 12.35)
when the field took the reach under a propagator; the lock holds no Stark state, and a fresh capture moved no other leaf."
