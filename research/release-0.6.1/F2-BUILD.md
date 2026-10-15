# F2 THE SYMMETRY CERTIFICATE — build note (Opus 5.5, 2026-10-15)
Branch `f2-symmetry-certificate` from `612b409` (yan-c). Three commits: names.js export · the chemview readout + one statesview seam · this note.

## What landed
- `lab/names.js:227` `symmetryDefects({ atoms, shells, D, group, frame })` → `[{ R, col, name, eps }]` in `operations(group)` order, `[]` for C1 or no
  table. ε_g = max|M(g)ᵀ SDS M(g) − SDS| / max|SDS| in f64. M(g) is the file's own `aoRep` over `frameOf`/`framework`'s permutation. On an exact
  framework, DᵀSD = S accepts each M(g) (1e-10, as `nameWith` does) or it throws a sentence. Its Mᵀ W M check reuses `overlapDefect` with W = SDS.
- **S is not on `sol`.** The worker never sends it ("S never leaves the worker", mathworker.js), and a record-opened solve has no integrals at all. So
  the function rebuilds S from the wire's field shells (`sol.shells`, molecular-field.js `fieldShells`) with md.js's `etable`/`CART`: an exact
  Hermite overlap, about 4 lines. The names basis is mapped from the same shells (each centre to its nearest atom), so the signature takes `shells`, not `basis, S`.
- `lab/chemview.js:222` the SYMMETRY readout (kit `readout`, `wide`) in the `.mol-more` fold's readout row. `:609` `symmetryLine(D, src)`:
  kept ε < 1e-9 · broken > 1e-6 · nearly between. The value is the group (all kept); `nearly G (ε = …)` when nothing is broken; `broken by … after the
  kick` under RUN; otherwise the kept subgroup (E + mirror = Cs, E + C₂ = C₂, E + i = Ci, {E} = C₁) or `k of h kept`. The sub line is the source
  (still / RUN / STATES), then `h of h kept · worst …` or `{kept columns} kept · n broken ≥ … · m nearly`. Every number comes from the computation.
  "—" before a solve, `C₁ | C1 · no symmetry declared` for a C1 record, `G | declared · no table` for D∞h/C∞v.
- The landings: a solve's `fill()` (`:337`, still), the kick (`:387`), reset (`:392`, the still again), the live pump (`:418`) and the scripted
  `run(n)` (`:936`, plus one at its end `:940`), the last two gated by `symDue` (`:607`, ≥ 200 ms apart), never in the frame loop.
- **One seam outside the two named files:** `lab/statesview.js:303`, in `publishState`, hands the register's full ΔD (against the ground; skipped
  under REF MEAN) to `chem.certify(dD)` (`chemview.js:914`, ≤ 5 Hz): "Cs while the RING plays" needs it, as the RING's density lives in the register, not in `rt.D_re`, and a RUN after an x/y/z kick never reads Cs for benzene.
- The group and frame are the catalogue's `symmetry` (molecules.js). They are what the record's names were made in (`input.symmetry`,
  `stem.symmetry.labelledIn`); the stem's `pointGroup` is the full group, whose frame may differ, so it is not used.
- THE HEAD's status line: **skipped**. `statusOf` was left alone, and `said` is its object, so appending the group would need a new branch.

## The readouts as printed (CDP smoke, headless Chromium, port 9261)
| state | value · sub |
|---|---|
| benzene from its record (also live) | `D₆h` · `still · 24 of 24 kept · worst 2·10⁻¹⁴` |
| the RING playing (STATES, 4 scrubs) | `Cs` · `STATES · {E, σh} kept · 22 broken ≥ 0.0075` (node: σh 3·10⁻¹⁴; others ≥ 0.043 at t = 3.3, ≥ 0.049 at t = 10; at t = 0 the RING keeps {E, C₂′, σh, σv}) |
| z-kick κ = 0.01, t = 0 | `nearly D₆h (ε = 8·10⁻⁹)` · `RUN · {E, 3C2', i, 3σd, C2, 3C2'', σh, 3σv} kept · 16 nearly` |
| z-kick κ = 0.01, RUN 200 steps (t = 2) | `broken by 0.0034 after the kick` · `RUN · {E, 3σd, C2, 3σv} kept · 12 broken ≥ 0.0034 · 8 nearly` |
| water | `C₂v` · `still · 4 of 4 kept · worst 6·10⁻¹⁶` |
| lysine (record) | `C₁` · `C1 · no symmetry declared` |

Finding: the RT engine's own ground (re-solved at `chem.rt.init`) keeps D₂h exactly but breaks C₆/C₃ by 1–2·10⁻⁸ (node, κ = 0: 2.1·10⁻⁸), so every RUN reading carries "nearly" operations; the still keeps all 24 to 2·10⁻¹⁴. The z-kick breaks σh/i/C₂′/C₂″/S₃/S₆ together, by an amount that oscillates in t, at most about κ/2.

## Cost of one certificate (node, warm, 10 runs)
benzene STO-3G, 36 AOs, D₆h: **4.0 ms**, with the S rebuild. Lysine, 64 AOs, is declared C₁ and returns at once (0 ms); timed as if D₆h: **10.5 ms**.

## Lines
`cat lab/*.js lab/shell/*.js lab/windows/*.js | wc -l`: 28,289 → **28,321 (+32)**: over the +25 budget, under the +40 stop. names.js +15, chemview.js +16, statesview.js +1 (sw.js is the manifest).

## Commands run
- `node tests/pwa.test.mjs --write` after each lab commit: PASS.
- `bash test.sh node`: **exit 0**. It includes `rack-deps`; chemview/statesview are not moving modules. `node tools/rack-deps.mjs --classes` ran clean.
- `LW_PORT=9261 GD_PORT=5361 node tests/register.browser-test.mjs`: **GREEN, 0 failing of 22** (the suite that solves benzene and plays its RING).
- The ad-hoc CDP smoke (`.tmp/f2-smoke.mjs`, not committed) gave the table above, `window.__e` empty; node checks in `.tmp/f2-check.mjs`, `.tmp/f2-cost.mjs`.
- `__LW` gains no member (`chem.certify` sits under `__LW.chem`; the facade pin is top-level only).

## Not done
THE HEAD clause (above). No new test, tool or fixture (Josh's dial). The stem's full `pointGroup` is not certified where it differs from the catalogue group. The STATES reading is not refreshed after the register stops: the last one stays, tagged `STATES`.
