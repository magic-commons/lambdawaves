# 0.6.0 B1 EQUALIZER CORE — the build (Opus 5.5, 2026-10-15)

Branch `b1-equalizer-core` from `8dc9a68` (yan-c). Two code commits + this note. Josh's dial held: one new test file, no tools, probes or fixtures.

## What landed
- **`lab/equalizer.js`** (new, 74 lines, pure; imports only `BASIS`): `EQ_PRESETS` (the nine, in the plan's order), `createEqualizer()` →
  `preset`, `setPreset`, `gains` (Float64Array(6)), `setGain`, `table({ Z, rates, populated, pops })`, `serialize`, `restore`, `birth()`.
  Base tables per the plan; the jitter widths solved in code from |g(1↔2)| = ½ at Z = 1 (σ = √(2 ln 2)/0.375, γ = ln 2/0.375, the box's
  sin x = x/2 by Newton); gains S = ssᵀ + diag(1 − s²), Γ = B∘S; eigenvalues by cyclic Jacobi on the 12 × 12 real embedding; a PHYSICAL
  preset that fails −10⁻¹²·max|λ| is clipped to the cone and its unit diagonal restored (`repaired`); the splits never repair. Returns
  `{ gamma: Float32Array(72), kappa, mode, lambdaMin, lambda (ascending, 6), purity, repaired, gate: '' }`, `null` at birth, and
  `{ gate: 'one rate per shell for the equalizer', gamma: null }` when two populated labels of one shell carry different `rates`.
  mode: κ ≠ 0 or indefinite → 2; PSD with every |Γ_ij| = 1 → 0 (the pulse); else 1.
- **`lab/field.js`** (+43 −4): `once` hoisted to module scope (a move; its message now says "a derived shader"); `EQ_WGSL` (:147) derived
  from COMPUTE_WGSL; `eqReady()` (:1062) compiles it on the first frame that needs it (boot stays at 8 modules) with its own bind groups
  (the six compute entries + binding 6, a 304-byte uniform); `encodeCompute` (:1101) takes it when `slot === 0 && space === 0` and a table
  is set, writing Γ, κ, mode and the 2·10⁻⁴ floor when the table object changed (identity); `setEqualizer(t)` (:1682) — `null` or a
  table with `gamma: null` clears. Shader messages land in `field.shaderMessages` as `shader: 'equalizer'`.
- **`tests/equalizer.test.mjs`** (new, 59 lines, 11 judgements). **`tests/wiring.test.mjs`**: one ALLOWLIST row for `lab/equalizer.js`
  (no root reaches it until B2; B2 deletes the row — the wiring law fails a row whose file is reached). **`lab/sw.js`**: field.js' hash.

## The WGSL substitutions, as they are
1. `var<workgroup> wmax` → `struct EQ { g: array<vec4<f32>, 18>, k: f32, mode: f32, floor: f32, pad: f32 };` + `@group(0) @binding(6) var<uniform> G: EQ;` before it.
2. `var psiB = vec2<f32>(0.0, 0.0);` → the same + `var acc: array<vec2<f32>, 6>; var inc = 0.0;`
3. the accumulate `if (P.space == 5u && M.ctr.w > 0.5) { psiB += f * ce; } else { psi += f * ce; }` →
   `{ let s = min(u32(M.c.w) - 2u, 5u); acc[s] += f * ce; inc += f * f * dot(M.c.xy, M.c.xy); }` — the shell from **c.w = n + 1**, not
   `nlm.x`: a Z ≠ 1 table stores n/Z there (hamiltonian.js:193) and keeps the exponent integer.
4. the space-5 resolve → ρ′ = κ·inc + Σ_{ij} Re Γ_ij acc_i acc̄_j (Γ_ij = g[(6i+j)/2].xy or .zw), u = Σ Γ̄_{0i} acc_i, s2 = Σ|acc_i|²;
   mode 0 ψ = u · mode 1 (√max(ρ′, 0), 0) · mode 2 (sign·√|ρ′|, 0), zero where |ρ′| < floor·s2.
5. global `P.space` → `0u`. The brief's (b) (`if (P.space == 0u || P.space == 5u)` → `if (true)`) is not done: (5) folds it to
   `if (0u == 0u || 0u == 5u)`. Derived text: braces 0, parens 0, no `P.space` left.

## Lines
`cat lab/*.js lab/shell/*.js lab/windows/*.js | wc -l`: 28,101 → **28,214 (+113)**; budget +130, stop +170.

## Commands run
- `git reset --hard 8dc9a68` → HEAD 8dc9a68.
- `node tests/equalizer.test.mjs` → 0 failing of 11 (FLAT form 3.5·10⁻¹⁸ of max 0.018; the split 3.5·10⁻¹⁸; comb |g16| 1.0000000, |g56| 0.00897;
  pulse λ = [≈0 ×5, 6.000000000000002]; beats λ_min −1; the jitters' λ_min 6.3·10⁻¹², 9.3·10⁻³, 1.1·10⁻¹⁴).
- `node tests/pwa.test.mjs --write` (twice: once after the field edit, once after the ALLOWLIST row took equalizer.js out of the precache).
- `bash test.sh node` → first run RED at `tests/wiring.test.mjs` (equalizer.js an orphan) — fixed by the ALLOWLIST row; then **exit 0**.
- Browser smoke (a throwaway `.tmp/` script on `tools/gate/gatekit.mjs`, Firefox headless, port 9201, `?preset=1s%2B2pz&warn=1&starter=home&sw=0`,
  64³, t = 3.7): FLAT `4d36a9a5` · GAUSSIAN `a8bf297d` (∫ 0.998077) · BEATS `748a6ea5` (∫|ρ′| 0.0769) · PULSE `d0b3cb39` (∫ 0.998059) ·
  `setEqualizer(null)` → `4d36a9a5` again, byte for byte; no equalizer shader message, no page error. **SMOKE GREEN.**
- EQ pass at 64³ (`field.throughput`, reconstruct only, 1s+2pz): FLAT 0.0959 ms, GAUSSIAN 0.1042 ms (+8.7 %). A readout, not a gate.
- `LW_PORT=9201 GD_PORT=5301 node tools/perf/digest-lock.mjs --check --query gastab=0` → **DIGEST LOCK GREEN: 860 values · 0 readback
  differences · 0 record-byte differences**, page errors 0, 59 s (the rig was shared with other builders' browsers and still held).

## Not done
- The 1004-value lock (`--fixture …digest-lock-s4a.json`): the integrator's, at the cut.
- No app wiring: nothing calls `setEqualizer` yet (B2). The `diff` view's reference (slot 1) is always the plain state.
- The repair branch is reachable only by rounding (every physical preset is a characteristic function, so Γ ⪰ 0 exactly); it is untested.
