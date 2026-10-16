# D2 THE GATE SET — build note (0.9.3 "Decohere")

Branch `d2-gates` off `0f0d11f` (`yan-c`, D1's merge). Builder: Opus, for the integrator. The build commit is `3471b09`. The tip is the commit that adds this note (`git log -1 d2-gates`).

## Δ lines

`lab/` went from 30,110 to **30,118**, which is **+8** (the budget was +30; the cap for this cut is 30,391). `bloch-model.js` went from 57 to 62 lines (+5) and `bloch.js` from 67 to 70 (+3). No new module, no new test file, no gate script.

## The 8-vector, read off `pair`

`pair` builds p = u(0) = [Re c↑↑, Im c↑↑, Re c↓↑, Im c↓↑] and q = u(1) = [Re c↑↓, Im c↑↓, Re c↓↓, Im c↓↓] and returns [p0, p1, q0, q1, p2, p3, q2, q3]. So the 8-vector is plainly [c↑↑, c↑↓, c↓↑, c↓↓] as [Re, Im] pairs: amplitude k sits at s[2k], s[2k+1]. This agrees with `corr` (i >> 1 is A, i & 1 is B). A's two pairs (c↑x, c↓x) are (s0 s1, s4 s5) for B = ↑ and (s2 s3, s6 s7) for B = ↓.

## Seats (file:line, after the build)

### `lab/bloch-model.js`

- **`:51`** is the header comment.
- **`:52` `onA(f)`** applies a 2 × 2 map f(Re a, Im a, Re b, Im b) to A's two pairs, which is U ⊗ 1. **`perm(k)`** is an index map.
- **`:53–54` `GATES`.**
  - `hA`: H = (σ_x + σ_z)/√2.
  - `xA`: σ_x swaps the pair.
  - `zA`: σ_z negates b.
  - `sA`: S = diag(1, i), so b → i b, i.e. (Re b, Im b) → (−Im b, Re b).
  - `cnot` = `perm([0,1,2,3,6,7,4,5])`: A controls B, c↓↑ ↔ c↓↓.
  - `swap` = `perm([0,1,4,5,2,3,6,7])`: c↑↓ ↔ c↓↑.
  - All four one-qubit gates are written directly on the pairs, one expression each. None goes through `su2`, so there is no global phase to state.
- **`:55` `applyTape(s, tape)`** folds the gates in order. `DEFAULTS.tape = []` is set there, beside the gates, so D1's DEFAULTS line `:6` is untouched.
- **`:56` `pair(id, θ, φ, tape = [])`** applies the tape to the preset first, then U_A ⊗ 1 through `onA` and `su2`. With an empty tape the arithmetic is the old `pair`'s, operation for operation.
- **`:58–60` `bell(s, id, tape = [])`** signs the CHSH axes to `pair(id, 0, 0, tape)`, the preset's state after the tape and before the knobs.
- D1's lines (`:4–6`, `:33–46`) are untouched.

### `lab/bloch.js`

- **`:4–5`**: the imports gain `GATES` and kit's `trig`.
- **`:9`**: `GL` holds the trig labels H_A · X_A · Z_A · S_A · CNOT · SWAP. `tapeOf(T)` returns "tape H_A · CNOT", or "no gates" when the tape is empty.
- **`:16–17`**: the trig row `gt` sits under the Bell seg. It has the six gates and RESET.
  - Each push appends its id with `[...P.tape, id].slice(-8)` (at most 8, the oldest dropped) and goes through `set`, which re-runs `duo`.
  - RESET sets `DEFAULTS.tape`.
- **`:24`** (`n2`, the pair note) gains one sentence: "The gates act on the preset in order and the knobs turn A after the tape: from PRODUCT, H_A then CNOT is the Bell circuit, ↑↑ → Φ⁺."
- **`:27`**: `set`'s show/hide table gains `[gt, two]`, so the row is hidden in ONE. D1's T₁/T₂ entries on that line are as they were.
- **`:47–49` `duo`**: the state is `pair(P.bell, P.th, P.ph, P.tape)` and `bell(…, P.bell, P.tape)`.
  - The ENTANGLEMENT sub opens with the tape ("tape H_A · CNOT · ρ_A = …", or "no gates · …").
  - The CHSH sub says "signed to the preset after the tape" when there is a tape.
- **`:66`**: `BL.label` in PAIR appends the tape (for example "PRODUCT · tape H_A · CNOT"), so the verbs inventory reads it.
- **`:67` `save()`** writes `tape` only when it is non-empty.
- **`:68–69` `load()`**: a non-array tape becomes the default. Otherwise it keeps only known ids (`Object.hasOwn(GATES, g)`) and the last 8.

### Other files

- `docs/STATE-SCOPES.md`: the `instruments.bloch` row names `tape` (gate ids, ≤ 8, absent when empty, unknown ids dropped). No new row.
- `lab/sw.js`: hashes refreshed by `pwa.test --write`.

## The local rotation: AFTER the tape

The brief said the knobs act on A before the tape, and allowed after with a reason. **I built after**, as the plan's own shape says ("the local rotation knobs still turn A after the tape"). There are three reasons:
1. **The pair note stays true.** It says the knobs move "the arrows and the CHSH number on the fixed axes but never S_A". After the tape the knobs are a local unitary on the circuit's output, so S_A cannot move. Before the tape, a knob would change the circuit's input and so its entanglement. For example, θ₀ = π/2 before H_A · CNOT gives a product state.
2. **The axes stay fixed.** The axes are signed to the unrotated output (`bell`'s `pair(id, 0, 0, tape)`). The knobs then turn A away from them, exactly as they turn A away from a Bell preset today.
3. **An empty tape is today's window exactly**, either way.

Checked: from PRODUCT, H_A · CNOT, then θ₀ 1.2 and φ₀ 0.4 gives S_A = 0.6931471805599453 (ln 2, unchanged) and CHSH 1.1617.

## The gate checks (`.tmp/d2-check.mjs`, not committed)

H_A · CNOT on PRODUCT gives this 8-vector:

`0.70710678118654757, 0, 0, 0, 0, 0, 0.70710678118654757, 0`

| check | max \|Δ\| |
|---|---|
| H_A · CNOT on PRODUCT against Φ⁺ = (1/√2)(↑↑ + ↓↓) | **0** |
| then X_A, against Ψ⁺ | **0** |
| then Z_A, against Φ⁻ | **0** |
| then SWAP, against Φ⁺ | **0** |
| CNOT² = 1 on a random complex 8-vector | 0 |
| SWAP² = 1 | 0 |
| S_A⁴ = 1 | 0 |
| H_A² = 1 | 1.1e-16 |

The S_A and CHSH values, all from PRODUCT:

| tape | S_A | CHSH on the drawn axes |
|---|---|---|
| (none) | 0 | 1.41421356 = √2 |
| H_A | 0 | 0 |
| **H_A · CNOT** | **0.6931471805599453 = ln 2** (\|Δ\| 0) | **2.8284271247461907 = 2√2** (\|Δ\| 4.4e-16) |
| H_A · CNOT · X_A (Ψ⁺) | ln 2 | 2√2 (the axes re-signed to the state) |
| H_A · CNOT · Z_A (Φ⁻) | ln 2 | 2√2 |
| H_A · CNOT · S_A | ln 2 | √2 (the best axes give 2√2; see correction 3) |

An empty tape is byte-identical to the base: `JSON.stringify` of `pair` and `bell` against `0f0d11f`'s model was equal over 5 presets × θ ∈ {0, 0.7, 1.9, 3} × φ ∈ {0, 1.1, 4}. **PAIR's picture and numbers are unchanged with an empty tape.** The only change is the S sub's "no gates ·" prefix, which the brief asks for.

## The window's own numbers (`.tmp/d2-shot.mjs`, headless on 9621)

The script opens BLOCH, presses PAIR, then PRODUCT, then H_A, then CNOT with the real trigs.

| step | ENTANGLEMENT | CHSH | S sub |
|---|---|---|---|
| before | **0** | **1.414214** | "no gates · … r_A = (0.000, 0.000, 1.000)" |
| after H_A | 0 | 0.000000 | "tape H_A · … r_A = (1.000, 0.000, 0.000)" |
| after CNOT | **ln 2** | **2√2** (best axes 2.828427) | "tape H_A · CNOT · … r_A = (0.000, 0.000, 0.000) · … \|r\| = 0.000000" |

The trig row's display in ONE is `none`. There were no page errors.

**Screenshot: `.tmp/d2-bell-circuit.png`**, showing BLOCH › PAIR after H_A · CNOT from PRODUCT:
- the gate row sits under the Bell seg (H_A X_A Z_A S_A CNOT / SWAP RESET);
- both spheres have no arrow, because a Bell pair's reduced states are maximally mixed;
- the four faint axes are drawn.

The server was stopped by its pid.

## Gates

- `node tests/pwa.test.mjs --write`, then `./test.sh node`: exit 0, with bell 6 laws and bloch 7 laws green.
- `node tools/rack-deps.mjs --classes --no-write`: green (exit 0).
- `node tools/new-project.mjs --check`: in step, 16,117 B. The tape is default-absent.
- `LW_PORT=9621 GD_PORT=5721 node tools/serialize-bytes.mjs`: DONE 11 readings.

## Corrections to the brief

1. **The knobs act after the tape, not before.** This is the plan's reading; the reasons are given above.
2. **PRODUCT reads CHSH √2 on the drawn axes, not 2.** The plan said "CHSH 2 → 2√2". ↑↑ has ⟨σ_zσ_z⟩ = 1 and ⟨σ_xσ_x⟩ = 0 on Φ⁺'s axes, giving √2. The classical bound is 2, and a product's best axes give 2.
3. **`bell` takes the tape.** It signs the axes to the preset's state after the tape. Without that, X_A after the Bell circuit (Ψ⁺) would read CHSH 0 on Φ⁺'s axes. S_A makes (↑↑ + i↓↓)/√2, whose correlations leave the x–z plane. There the drawn axes read √2 while the readout's best-axes value says 2√2, which is honest and named.
4. **The 8-vector is in plain order.** `pair`'s p/q interleave yields [c↑↑, c↑↓, c↓↑, c↓↓] as [Re, Im] pairs, so the gates are written on s[2k], s[2k+1].
5. **`DEFAULTS.tape` is set beside the gates, not on D1's DEFAULTS line.** `save()` skips the empty tape because `[] !== []` would otherwise always write it.

## Dropped, and why

- Decoherence on the pair: deferred by the plan.
- Gates on B: not in the row.
- A per-gate undo: RESET plus the 8-gate window serve.
- No test file and no gate script, per Josh's dial.
